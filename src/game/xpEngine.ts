import type { LevelInfo, OfflineSyncItem, PlayerState } from '../types/game';

export const XP_RULES = {
  QUIZ_CORRECT: 10,
  MATCH_PAIR: 5,
  WORD_PUZZLE: 10,
  BRAIN_CHALLENGE: 15,
  ADVENTURE_MISSION: 25,
  DAILY_CHALLENGE_COMPLETE: 30,
} as const;

export const LEVELS = [
  { level: 1, title: 'Beginner', minXp: 0, nextXp: 150 },
  { level: 2, title: 'Explorer', minXp: 150, nextXp: 400 },
  { level: 3, title: 'Smart Thinker', minXp: 400, nextXp: 800 },
  { level: 4, title: 'Brain Master', minXp: 800, nextXp: 1400 },
  { level: 5, title: 'Genius Champion', minXp: 1400, nextXp: 2500 },
] as const;

/**
 * Pure XP addition: never deducts XP for incorrect answers.
 */
export function addXpSafely(currentXp: number, earnedXp: number): number {
  const safeCurrent = Math.max(0, Math.floor(Number.isFinite(currentXp) ? currentXp : 0));
  const safeDelta = Math.max(0, Math.floor(Number.isFinite(earnedXp) ? earnedXp : 0));
  return safeCurrent + safeDelta;
}

/**
 * Computes current level, title, and progress bar percentage from total XP.
 */
export function computeLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let current: (typeof LEVELS)[number] = LEVELS[0];

  for (const tier of LEVELS) {
    if (safeXp >= tier.minXp) {
      current = tier;
    }
  }

  const isMax = current.level === LEVELS[LEVELS.length - 1].level;
  const span = Math.max(1, current.nextXp - current.minXp);
  const xpIntoLevel = Math.max(0, safeXp - current.minXp);
  const xpRequiredForNext = isMax ? 0 : Math.max(0, current.nextXp - safeXp);
  const progressPercent = isMax ? 100 : Math.min(100, Math.round((xpIntoLevel / span) * 100));

  return {
    level: current.level,
    title: current.title,
    minXp: current.minXp,
    nextXp: current.nextXp,
    progressPercent,
    xpIntoLevel,
    xpRequiredForNext,
  };
}

/**
 * Computes 1–5 star performance rating from accuracy percentage.
 */
export function computeStarRating(correct: number, total: number): number {
  if (total <= 0) return 1;
  const pct = (correct / total) * 100;
  if (pct >= 95) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  if (pct >= 40) return 2;
  return 1;
}

/**
 * Returns local calendar date key in YYYY-MM-DD format (no UTC drift).
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes updated daily streak using local YYYY-MM-DD calendar dates.
 */
export function calculateUpdatedStreak(
  previousDateKey: string,
  currentDateKey: string,
  previousStreak: number
): number {
  if (!previousDateKey) return Math.max(1, previousStreak);
  if (previousDateKey === currentDateKey) return Math.max(1, previousStreak);

  const [py, pm, pd] = previousDateKey.split('-').map(Number);
  const [cy, cm, cd] = currentDateKey.split('-').map(Number);
  const prevMs = new Date(py, pm - 1, pd).getTime();
  const currMs = new Date(cy, cm - 1, cd).getTime();
  const diffDays = Math.round((currMs - prevMs) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return Math.max(1, previousStreak) + 1;
  }
  if (diffDays > 1) {
    return 1;
  }
  return Math.max(1, previousStreak);
}

/**
 * Evaluates which achievements should be newly unlocked given the player's state.
 */
export function evaluateNewAchievements(state: PlayerState): string[] {
  const already = new Set(state.unlockedAchievements);
  const newlyUnlocked: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !already.has(id)) {
      newlyUnlocked.push(id);
    }
  };

  check('first-victory', state.gamesCompleted >= 1);
  check('quick-thinker', state.quickAnswersCount >= 1);
  check('match-master', state.matchGamesCompleted >= 1);
  check('word-wizard', state.wordPuzzlesCompleted >= 20);
  check('einstein-mind', state.einsteinSolved >= 5);
  check('treasure-explorer', state.completedMissions.length >= 5);
  check('daily-champion', state.dailyStreakMax >= 7 || state.streak >= 7);
  check('scratch-lucky', state.claimedRewards.length >= 1);
  check('high-five-hero', state.highFivesSent >= 3);
  check('offline-scholar', Object.keys(state.downloadedPacks).length >= 1);

  return newlyUnlocked;
}

/**
 * Generates a deterministic, child-safe alphanumeric Friend Code (e.g., FUN-7K4M-9X2P).
 * Excludes ambiguous characters (0, O, 1, I).
 */
export function generateFriendCode(seed: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let raw = '';
  let val = hash >>> 0;
  for (let i = 0; i < 8; i++) {
    raw += alphabet[val % alphabet.length];
    val = Math.imul(val ^ (i + 17), 2654435761) >>> 0;
  }
  return `FUN-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

/**
 * Validates alphanumeric Friend Code format.
 */
export function isValidFriendCodeFormat(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return /^FUN-[A-Z0-9]{4,6}-[A-Z0-9]{4}$/.test(normalized);
}

/**
 * Aggregates pending offline sync queue items cleanly for Firebase synchronization.
 */
export function summarizeSyncQueue(queue: OfflineSyncItem[]): {
  totalItems: number;
  totalXpDelta: number;
  totalGemsDelta: number;
  uniqueIds: string[];
} {
  const seen = new Set<string>();
  let totalXpDelta = 0;
  let totalGemsDelta = 0;
  const uniqueIds: string[] = [];

  for (const item of queue) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    uniqueIds.push(item.id);
    totalXpDelta += Math.max(0, Math.floor(item.xpDelta || 0));
    totalGemsDelta += Math.max(0, Math.floor(item.gemsDelta || 0));
  }

  return {
    totalItems: uniqueIds.length,
    totalXpDelta,
    totalGemsDelta,
    uniqueIds,
  };
}
