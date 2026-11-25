import type { FriendProfile, FriendRequestItem, LearningPack } from '../types/game';
import { QUIZ_BANK } from './quizBank';
import { MATCH_SETS } from './matchBank';
import { WORD_CHALLENGES } from './wordBank';
import { EINSTEIN_PUZZLES } from './einsteinBank';

export const OFFLINE_LEARNING_PACKS: LearningPack[] = [
  {
    id: 'pack-math-4',
    title: 'Class 4–5 Math Champions Pack',
    subject: 'Mathematics',
    gradeClass: 4,
    description: 'Multiplication adventures, fractions, geometry shapes, and Math Formulas matching for offline play.',
    sizeKb: 48,
    accent: '#2563EB',
    quizQuestions: QUIZ_BANK.filter((q) => q.subject === 'Mathematics'),
    matchSet: MATCH_SETS.find((m) => m.id === 'math-formulas'),
  },
  {
    id: 'pack-science-5',
    title: 'Class 5 Science Explorer Pack',
    subject: 'Science',
    gradeClass: 5,
    description: 'Solar system, photosynthesis, human organs, habitats, and famous scientists bundled for offline flights & trips.',
    sizeKb: 56,
    accent: '#0EA5E9',
    quizQuestions: QUIZ_BANK.filter((q) => q.subject === 'Science'),
    matchSet: MATCH_SETS.find((m) => m.id === 'animals-habitats'),
  },
  {
    id: 'pack-languages-4',
    title: 'Trilingual Word Wizard Pack (EN · KN · HI)',
    subject: 'English',
    gradeClass: 4,
    description: 'English grammar, Kannada vocabulary, Hindi opposites, and Word Wizard mini-games playable anywhere.',
    sizeKb: 64,
    accent: '#10B981',
    quizQuestions: QUIZ_BANK.filter((q) => ['English', 'Kannada', 'Hindi'].includes(q.subject)),
    matchSet: MATCH_SETS.find((m) => m.id === 'kannada-meanings'),
    wordChallenges: WORD_CHALLENGES,
  },
  {
    id: 'pack-einstein-6',
    title: 'Class 6 Einstein Logic & Mystery Pack',
    subject: 'Logical Reasoning',
    gradeClass: 6,
    description: 'Brain teasers, visual puzzles, pattern sequences, and odd-one-out mysteries cached locally on your device.',
    sizeKb: 52,
    accent: '#6366F1',
    quizQuestions: QUIZ_BANK.filter((q) => q.subject === 'Logical Reasoning'),
    einsteinPuzzles: EINSTEIN_PUZZLES,
  },
  {
    id: 'pack-atlas-5',
    title: 'World Atlas & GK Discovery Pack',
    subject: 'General Knowledge',
    gradeClass: 5,
    description: 'Countries, Indian states & capitals, world wonders, and famous inventions ready with zero internet.',
    sizeKb: 44,
    accent: '#F59E0B',
    quizQuestions: QUIZ_BANK.filter((q) => ['Social Science', 'General Knowledge'].includes(q.subject)),
    matchSet: MATCH_SETS.find((m) => m.id === 'countries-capitals'),
  },
];

/**
 * Deterministic child-safe demo directory so Friend Codes & Leaderboard work cleanly
 * even before signing into Firebase, using nicknames only (never real emails or PII).
 */
export const DEMO_FRIEND_DIRECTORY: FriendProfile[] = [
  {
    uid: 'demo-friend-nova',
    friendCode: 'FUN-STAR-2026',
    nickname: 'CosmicNova',
    avatarId: 'professor-owl',
    accessoryId: 'goggles',
    level: 4,
    xp: 940,
    recentAchievements: ['Einstein Mind', 'Quick Thinker', 'Treasure Explorer'],
    highFivesSentByMe: 1,
    onlineStatus: 'playing',
  },
  {
    uid: 'demo-friend-pixel',
    friendCode: 'FUN-MATH-8842',
    nickname: 'PixelPanda',
    avatarId: 'genius-panda',
    accessoryId: 'crown',
    level: 3,
    xp: 615,
    recentAchievements: ['Match Master', 'First Victory'],
    highFivesSentByMe: 0,
    onlineStatus: 'active',
  },
  {
    uid: 'demo-friend-spark',
    friendCode: 'FUN-WORD-5519',
    nickname: 'SparkDragon',
    avatarId: 'spark-dragon',
    accessoryId: 'wizard-hat',
    level: 4,
    xp: 1080,
    recentAchievements: ['Word Wizard', 'Daily Champion', 'Lucky Spark'],
    highFivesSentByMe: 0,
    onlineStatus: 'active',
  },
  {
    uid: 'demo-friend-bolt',
    friendCode: 'FUN-BRAIN-7731',
    nickname: 'BoltExplorer',
    avatarId: 'robo-buddy',
    accessoryId: 'headphones',
    level: 5,
    xp: 1540,
    recentAchievements: ['Einstein Mind', 'Daily Champion', 'Treasure Explorer'],
    highFivesSentByMe: 0,
    onlineStatus: 'resting',
  },
];

export const INITIAL_DEMO_FRIENDS: FriendProfile[] = [
  DEMO_FRIEND_DIRECTORY[0],
  DEMO_FRIEND_DIRECTORY[1],
];

export const INITIAL_DEMO_REQUESTS: FriendRequestItem[] = [
  {
    id: 'req-demo-spark',
    fromUid: 'demo-friend-spark',
    fromCode: 'FUN-WORD-5519',
    fromNickname: 'SparkDragon',
    fromAvatarId: 'spark-dragon',
    fromLevel: 4,
    toUid: 'local-player',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

export interface LeaderboardRow {
  uid: string;
  nickname: string;
  avatarId: string;
  accessoryId: string;
  xp: number;
  weeklyXp: number;
  monthlyXp: number;
  level: number;
  badgesCount: number;
  isCurrentUser?: boolean;
}

export const DEMO_LEADERBOARD_ROWS: LeaderboardRow[] = [
  {
    uid: 'demo-friend-bolt',
    nickname: 'BoltExplorer',
    avatarId: 'robo-buddy',
    accessoryId: 'headphones',
    xp: 1540,
    weeklyXp: 420,
    monthlyXp: 1120,
    level: 5,
    badgesCount: 8,
  },
  {
    uid: 'demo-friend-spark',
    nickname: 'SparkDragon',
    avatarId: 'spark-dragon',
    accessoryId: 'wizard-hat',
    xp: 1080,
    weeklyXp: 360,
    monthlyXp: 890,
    level: 4,
    badgesCount: 6,
  },
  {
    uid: 'demo-friend-nova',
    nickname: 'CosmicNova',
    avatarId: 'professor-owl',
    accessoryId: 'goggles',
    xp: 940,
    weeklyXp: 310,
    monthlyXp: 760,
    level: 4,
    badgesCount: 5,
  },
  {
    uid: 'demo-friend-pixel',
    nickname: 'PixelPanda',
    avatarId: 'genius-panda',
    accessoryId: 'crown',
    xp: 615,
    weeklyXp: 245,
    monthlyXp: 510,
    level: 3,
    badgesCount: 4,
  },
  {
    uid: 'demo-friend-mango',
    nickname: 'CleverMango',
    avatarId: 'explorer-kid',
    accessoryId: 'star-shades',
    xp: 480,
    weeklyXp: 195,
    monthlyXp: 420,
    level: 3,
    badgesCount: 3,
  },
  {
    uid: 'demo-friend-comet',
    nickname: 'SwiftComet',
    avatarId: 'astro-fox',
    accessoryId: 'none',
    xp: 310,
    weeklyXp: 140,
    monthlyXp: 290,
    level: 2,
    badgesCount: 2,
  },
];
