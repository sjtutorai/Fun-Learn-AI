import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addXpSafely,
  computeLevelInfo,
  computeStarRating,
  calculateUpdatedStreak,
  evaluateNewAchievements,
  generateFriendCode,
  isValidFriendCodeFormat,
  summarizeSyncQueue,
} from './xpEngine';
import {
  getTotalRewardProbability,
  rollVirtualReward,
  hasClaimedChallenge,
  isScratchRevealed,
} from './rewardEngine';
import { validateGeneratedQuestion, validateQuestionBatch } from './questionValidator';
import type { PlayerState } from '../types/game';

test('addXpSafely adds positive XP and never deducts XP on negative inputs', () => {
  assert.equal(addXpSafely(100, 25), 125);
  assert.equal(addXpSafely(100, -50), 100);
  assert.equal(addXpSafely(0, 0), 0);
});

test('computeLevelInfo accurately computes levels 1 through 5', () => {
  assert.equal(computeLevelInfo(0).level, 1);
  assert.equal(computeLevelInfo(0).title, 'Beginner');
  assert.equal(computeLevelInfo(150).level, 2);
  assert.equal(computeLevelInfo(150).title, 'Explorer');
  assert.equal(computeLevelInfo(400).level, 3);
  assert.equal(computeLevelInfo(400).title, 'Smart Thinker');
  assert.equal(computeLevelInfo(800).level, 4);
  assert.equal(computeLevelInfo(800).title, 'Brain Master');
  assert.equal(computeLevelInfo(1450).level, 5);
  assert.equal(computeLevelInfo(1450).title, 'Genius Champion');
  assert.equal(computeLevelInfo(1450).progressPercent, 100);
});

test('computeStarRating scales accurately from 1 to 5 stars', () => {
  assert.equal(computeStarRating(5, 5), 5);
  assert.equal(computeStarRating(4, 5), 4);
  assert.equal(computeStarRating(3, 5), 3);
  assert.equal(computeStarRating(2, 5), 2);
  assert.equal(computeStarRating(1, 5), 1);
});

test('calculateUpdatedStreak increments on consecutive local day and resets after gap', () => {
  assert.equal(calculateUpdatedStreak('2026-11-23', '2026-11-24', 3), 4);
  assert.equal(calculateUpdatedStreak('2026-11-24', '2026-11-24', 4), 4);
  assert.equal(calculateUpdatedStreak('2026-11-20', '2026-11-24', 6), 1);
});

test('scratch reward probability table sums strictly to 100% and enforces duplicate guards', () => {
  assert.equal(getTotalRewardProbability(), 100);
  assert.equal(rollVirtualReward(0).id, 'xp-10');
  assert.equal(rollVirtualReward(99.5).id, 'theme-galaxy');
  assert.equal(hasClaimedChallenge(['c-1', 'c-2'], 'c-1'), true);
  assert.equal(hasClaimedChallenge(['c-1', 'c-2'], 'c-3'), false);
  assert.equal(isScratchRevealed(0.45), true);
  assert.equal(isScratchRevealed(0.2), false);
});

test('friend code generator produces valid deterministic alphanumeric codes', () => {
  const codeA = generateFriendCode('player-seed-42');
  const codeB = generateFriendCode('player-seed-42');
  assert.equal(codeA, codeB);
  assert.equal(isValidFriendCodeFormat(codeA), true);
  assert.equal(isValidFriendCodeFormat('INVALID'), false);
  assert.equal(isValidFriendCodeFormat('FUN-1234-ABCD'), true);
  assert.equal(isValidFriendCodeFormat('FUN-BRAIN-7731'), true);
});

test('summarizeSyncQueue deduplicates queued offline items and totals deltas', () => {
  const summary = summarizeSyncQueue([
    { id: 'sync-1', type: 'session', xpDelta: 40, gemsDelta: 10, payload: {}, createdAt: '2026-11-24T00:00:00Z' },
    { id: 'sync-1', type: 'session', xpDelta: 40, gemsDelta: 10, payload: {}, createdAt: '2026-11-24T00:00:00Z' },
    { id: 'sync-2', type: 'achievement', xpDelta: 25, gemsDelta: 5, payload: {}, createdAt: '2026-11-24T00:05:00Z' },
  ]);
  assert.equal(summary.totalItems, 2);
  assert.equal(summary.totalXpDelta, 65);
  assert.equal(summary.totalGemsDelta, 15);
});

test('validateGeneratedQuestion accepts valid schema and rejects mismatched/duplicate options', () => {
  const valid = validateGeneratedQuestion({
    id: 'q-1',
    question: 'What is 8 multiplied by 7?',
    options: ['54', '56', '64', '48'],
    correctAnswer: '56',
    explanation: '8 groups of 7 equals 56.',
    hint: 'Think of 8 x 5 + 8 x 2.',
    subject: 'Mathematics',
    chapter: 'Multiplication',
    classLevel: 4,
    difficulty: 'Easy',
    points: 10,
    type: 'mcq',
  });
  assert.ok(valid);
  assert.equal(valid?.correctAnswer, '56');

  // Hallucinated answer not in options -> rejected
  const hallucinated = validateGeneratedQuestion({
    question: 'What is the capital of Karnataka?',
    options: ['Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
    correctAnswer: 'Bengaluru',
    explanation: 'Bengaluru is the capital.',
    subject: 'Social Science',
    chapter: 'Indian States',
    classLevel: 4,
    difficulty: 'Easy',
    points: 10,
    type: 'mcq',
  });
  assert.equal(hallucinated, null);

  // Batch filters out bad records
  const batch = validateQuestionBatch([valid, hallucinated, { bad: true }]);
  assert.equal(batch.length, 1);
});

test('evaluateNewAchievements unlocks eligible badges without duplicating existing ones', () => {
  const mockState = {
    gamesCompleted: 1,
    quickAnswersCount: 2,
    matchGamesCompleted: 1,
    wordPuzzlesCompleted: 20,
    einsteinSolved: 5,
    completedMissions: ['m1', 'm2', 'm3', 'm4', 'm5'],
    dailyStreakMax: 7,
    streak: 7,
    claimedRewards: [{ challengeInstanceId: 'c1', reward: rollVirtualReward(5), claimedAt: '2026-11-24' }],
    highFivesSent: 3,
    downloadedPacks: { 'pack-math-4': { packId: 'pack-math-4', downloadedAt: '2026-11-24', itemCount: 8, sizeKb: 42 } },
    unlockedAchievements: ['first-victory'],
  } as unknown as PlayerState;

  const unlocked = evaluateNewAchievements(mockState);
  assert.equal(unlocked.includes('first-victory'), false);
  assert.equal(unlocked.includes('quick-thinker'), true);
  assert.equal(unlocked.includes('word-wizard'), true);
  assert.equal(unlocked.includes('treasure-explorer'), true);
  assert.equal(unlocked.includes('high-five-hero'), true);
  assert.equal(unlocked.includes('offline-scholar'), true);
});
