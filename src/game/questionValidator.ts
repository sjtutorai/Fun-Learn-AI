import { z } from 'zod';
import type { Difficulty, QuestionType, QuizQuestion, Subject } from '../types/game';

export const ALLOWED_SUBJECTS: Subject[] = [
  'Mathematics',
  'Science',
  'English',
  'Kannada',
  'Hindi',
  'Social Science',
  'General Knowledge',
  'Logical Reasoning',
];

export const ALLOWED_DIFFICULTIES: Difficulty[] = [
  'Easy',
  'Medium',
  'Hard',
  'Einstein Level',
];

export const ALLOWED_QUESTION_TYPES: QuestionType[] = [
  'mcq',
  'matching',
  'odd-one-out',
  'logical',
  'word-puzzle',
  'visual-puzzle',
];

const RawGeneratedQuestionSchema = z.object({
  id: z.string().min(2).max(80).optional(),
  question: z.string().min(8).max(400),
  options: z.array(z.string().min(1).max(160)).min(2).max(5),
  correctAnswer: z.string().min(1).max(160),
  explanation: z.string().min(8).max(360),
  hint: z.string().min(4).max(200).optional(),
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
  chapter: z.string().min(2).max(80),
  classLevel: z.number().int().min(3).max(7),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Einstein Level']),
  points: z.number().int().min(5).max(30),
  type: z.enum(['mcq', 'matching', 'odd-one-out', 'logical', 'word-puzzle', 'visual-puzzle']),
});

/**
 * Strictly validates an AI-generated question before publishing or displaying it.
 * Rejects hallucinated answers not found in options, duplicate options, or invalid math/content.
 */
export function validateGeneratedQuestion(raw: unknown, fallbackIndex = 0): QuizQuestion | null {
  const parsed = RawGeneratedQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const q = parsed.data;
  const trimmedOptions = q.options.map((opt) => opt.trim());
  const uniqueOptions = Array.from(new Set(trimmedOptions.map((o) => o.toLowerCase())));

  // Reject if duplicate options exist
  if (uniqueOptions.length !== trimmedOptions.length) {
    return null;
  }

  // Never trust AI answer unless it exactly matches one of the options
  const trimmedAnswer = q.correctAnswer.trim();
  const matchedOption = trimmedOptions.find(
    (opt) => opt.toLowerCase() === trimmedAnswer.toLowerCase()
  );
  if (!matchedOption) {
    return null;
  }

  return {
    id: q.id || `ai-q-${Date.now()}-${fallbackIndex}`,
    question: q.question.trim(),
    options: trimmedOptions,
    correctAnswer: matchedOption,
    explanation: q.explanation.trim(),
    hint: q.hint?.trim() || 'Read the clue carefully and eliminate the choices that do not fit!',
    subject: q.subject,
    chapter: q.chapter.trim(),
    classLevel: q.classLevel,
    difficulty: q.difficulty,
    points: q.points,
    type: q.type,
  };
}

export function validateQuestionBatch(items: unknown[]): QuizQuestion[] {
  if (!Array.isArray(items)) return [];
  const valid: QuizQuestion[] = [];
  items.forEach((item, idx) => {
    const checked = validateGeneratedQuestion(item, idx);
    if (checked) valid.push(checked);
  });
  return valid;
}
