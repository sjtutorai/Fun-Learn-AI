import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { validateQuestionBatch } from './src/game/questionValidator';
import { rollVirtualReward, SCRATCH_REWARD_TABLE } from './src/game/rewardEngine';
import { XP_RULES, addXpSafely, computeLevelInfo } from './src/game/xpEngine';
import { getQuizQuestionsForConfig } from './src/data/quizBank';
import type { Difficulty, Subject } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '256kb' }));

// In-memory anti-duplicate reward claim ledger on server (keyed by playerId:challengeInstanceId)
const claimedRewardLedger = new Map<string, { rewardId: string; claimedAt: string }>();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(getGeminiClient()),
  });
});

// Secure server-side Gemini AI Question Generation with strict schema validation & curated offline fallback
const GenerateQuestionsSchema = z.object({
  subject: z.enum([
    'Mathematics',
    'Science',
    'English',
    'Kannada',
    'Hindi',
    'Social Science',
    'General Knowledge',
    'Logical Reasoning',
  ]),
  classLevel: z.number().int().min(3).max(7).default(5),
  chapter: z.string().min(2).max(80).default('General Mastery'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Einstein Level']).default('Medium'),
  questionType: z
    .enum(['mcq', 'matching', 'odd-one-out', 'logical', 'word-puzzle', 'visual-puzzle'])
    .default('mcq'),
  count: z.number().int().min(1).max(6).default(4),
});

app.post('/api/questions/generate', async (req, res) => {
  const parsed = GenerateQuestionsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid question generation parameters.',
      details: parsed.error.flatten(),
    });
  }

  const { subject, classLevel, chapter, difficulty, questionType, count } = parsed.data;
  const ai = getGeminiClient();

  if (!ai) {
    const fallback = getQuizQuestionsForConfig(
      subject as Subject,
      classLevel,
      chapter,
      difficulty as Difficulty,
      count
    );
    return res.json({
      source: 'curated-offline-bank',
      notice: 'Using curated offline question bank while Gemini AI key is not active.',
      questions: fallback,
    });
  }

  try {
    const prompt = [
      `Create ${count} fun, crystal-clear, age-appropriate educational questions for a Class ${classLevel} student (ages 8-12).`,
      `Subject: ${subject}. Chapter: ${chapter}. Difficulty: ${difficulty}. Question Type: ${questionType}.`,
      `Rules:`,
      `- Every question must have exactly 4 distinct options.`,
      `- "correctAnswer" MUST match one of the 4 strings in "options" character-for-character.`,
      `- Every question must have ONE unambiguously correct answer, a helpful kid-friendly hint, and a concise educational explanation.`,
      `- Keep tone joyful, safe, and encouraging for ages 8-12.`,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a master elementary & middle-school curriculum designer for FUNLEARN AI (ages 8-12). Always return factual, unambiguous JSON questions.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING },
              subject: { type: Type.STRING },
              chapter: { type: Type.STRING },
              classLevel: { type: Type.INTEGER },
              difficulty: { type: Type.STRING },
              points: { type: Type.INTEGER },
              type: { type: Type.STRING },
            },
            required: [
              'question',
              'options',
              'correctAnswer',
              'explanation',
              'hint',
              'subject',
              'chapter',
              'classLevel',
              'difficulty',
              'points',
              'type',
            ],
          },
        },
      },
    });

    const rawText = (response.text ?? '[]').trim();
    const rawJson = JSON.parse(rawText);
    const normalizedInput = Array.isArray(rawJson)
      ? rawJson.map((item, idx) => ({
          ...item,
          id: `gem-${Date.now()}-${idx}`,
          subject,
          chapter,
          classLevel,
          difficulty,
          type: questionType,
          points: difficulty === 'Einstein Level' ? 20 : difficulty === 'Hard' ? 15 : 10,
        }))
      : [];

    const validated = validateQuestionBatch(normalizedInput);

    if (validated.length === 0) {
      const fallback = getQuizQuestionsForConfig(
        subject as Subject,
        classLevel,
        chapter,
        difficulty as Difficulty,
        count
      );
      return res.json({
        source: 'curated-offline-bank',
        notice: 'AI output did not pass strict validation; switched to curated questions.',
        questions: fallback,
      });
    }

    return res.json({
      source: 'gemini-ai-validated',
      questions: validated,
    });
  } catch (err) {
    console.error('Gemini question generation error:', err instanceof Error ? err.message : err);
    const fallback = getQuizQuestionsForConfig(
      subject as Subject,
      classLevel,
      chapter,
      difficulty as Difficulty,
      count
    );
    return res.json({
      source: 'curated-offline-bank',
      notice: 'Gemini AI temporarily unavailable; loaded curated offline questions.',
      questions: fallback,
    });
  }
});

// Secure Server-Side Virtual Scratch & Win Reward Roll (Anti-Duplicate Claim Ledger)
const ClaimRewardSchema = z.object({
  playerId: z.string().min(2).max(128).regex(/^[a-zA-Z0-9_\-]+$/),
  challengeInstanceId: z.string().min(4).max(120).regex(/^[a-zA-Z0-9_\-]+$/),
});

app.get('/api/rewards/probabilities', (_req, res) => {
  res.json({ rewards: SCRATCH_REWARD_TABLE });
});

app.post('/api/rewards/claim', (req, res) => {
  const parsed = ClaimRewardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid scratch card claim payload.' });
  }

  const { playerId, challengeInstanceId } = parsed.data;
  const ledgerKey = `${playerId}:${challengeInstanceId}`;

  if (claimedRewardLedger.has(ledgerKey)) {
    return res.status(409).json({
      error: 'This reward card has already been claimed.',
      alreadyClaimed: true,
    });
  }

  // Cryptographically secure roll in [0, 100)
  const randomFloat = (crypto.randomInt(0, 10000) / 10000) * 100;
  const reward = rollVirtualReward(randomFloat);
  const claimedAt = new Date().toISOString();

  claimedRewardLedger.set(ledgerKey, { rewardId: reward.id, claimedAt });

  return res.json({
    verified: true,
    challengeInstanceId,
    reward,
    claimedAt,
  });
});

// Trusted Server-Side XP Validation Route
const ValidateXpSchema = z.object({
  currentXp: z.number().int().min(0).max(1000000),
  eventType: z.enum([
    'quiz_correct',
    'match_pair',
    'word_puzzle',
    'brain_challenge',
    'adventure_mission',
    'daily_challenge',
  ]),
  count: z.number().int().min(1).max(25).default(1),
});

app.post('/api/xp/validate', (req, res) => {
  const parsed = ValidateXpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid XP validation request.' });
  }

  const { currentXp, eventType, count } = parsed.data;
  const perItemMap = {
    quiz_correct: XP_RULES.QUIZ_CORRECT,
    match_pair: XP_RULES.MATCH_PAIR,
    word_puzzle: XP_RULES.WORD_PUZZLE,
    brain_challenge: XP_RULES.BRAIN_CHALLENGE,
    adventure_mission: XP_RULES.ADVENTURE_MISSION,
    daily_challenge: XP_RULES.DAILY_CHALLENGE_COMPLETE,
  };

  const earnedXp = perItemMap[eventType] * count;
  const nextXp = addXpSafely(currentXp, earnedXp);
  const levelInfo = computeLevelInfo(nextXp);

  return res.json({
    earnedXp,
    nextXp,
    levelInfo,
  });
});

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FUNLEARN AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
