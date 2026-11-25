export type NavSection =
  | 'home'
  | 'games'
  | 'daily'
  | 'rewards'
  | 'achievements'
  | 'leaderboard'
  | 'friends'
  | 'profile'
  | 'settings';

export type GameId =
  | 'brain-blast'
  | 'match-master'
  | 'einstein-mystery'
  | 'word-wizard'
  | 'treasure-hunt';

export type Subject =
  | 'Mathematics'
  | 'Science'
  | 'English'
  | 'Kannada'
  | 'Hindi'
  | 'Social Science'
  | 'General Knowledge'
  | 'Logical Reasoning';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Einstein Level';

export type WordLanguage = 'English' | 'Kannada' | 'Hindi';

export type WordMiniGame =
  | 'scramble'
  | 'complete'
  | 'spelling'
  | 'synonym'
  | 'antonym'
  | 'sentence'
  | 'vocabulary';

export type EinsteinCategory =
  | 'odd-one-out'
  | 'visual-reasoning'
  | 'pattern'
  | 'logical'
  | 'picture-puzzle';

export type QuestionType =
  | 'mcq'
  | 'matching'
  | 'odd-one-out'
  | 'logical'
  | 'word-puzzle'
  | 'visual-puzzle';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  subject: Subject;
  chapter: string;
  classLevel: number;
  difficulty: Difficulty;
  points: number;
  type: QuestionType;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
  icon: string;
  fact: string;
}

export interface MatchCategorySet {
  id: string;
  title: string;
  subtitle: string;
  subject: Subject;
  color: string;
  pairs: MatchPair[];
}

export interface VisualItem {
  id: string;
  label: string;
  visualType:
    | 'apple'
    | 'mango'
    | 'banana'
    | 'car'
    | 'sun'
    | 'giraffe'
    | 'fridge'
    | 'whale'
    | 'elephant'
    | 'ant'
    | 'mouse'
    | 'circle'
    | 'square'
    | 'triangle'
    | 'star'
    | 'rocket'
    | 'bus'
    | 'boat'
    | 'bicycle'
    | 'tree'
    | 'book'
    | 'lamp'
    | 'diamond'
    | 'hexagon';
  color: string;
  scale?: number;
  rotation?: number;
  patternDots?: number;
}

export interface EinsteinPuzzle {
  id: string;
  category: EinsteinCategory;
  title: string;
  question: string;
  visualItems?: VisualItem[];
  sequence?: string[];
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  difficulty: Difficulty;
  points: number;
  isEinsteinChallenge?: boolean;
}

export interface WordChallenge {
  id: string;
  mode: WordMiniGame;
  language: WordLanguage;
  prompt: string;
  scrambled?: string;
  maskedWord?: string;
  missingIndex?: number;
  word?: string;
  shuffledWords?: string[];
  options?: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  points: number;
}

export interface AdventureMission {
  id: string;
  zoneId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  gemReward: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface AdventureZone {
  id: string;
  name: string;
  subject: Subject;
  description: string;
  mapX: number; // Percentage X on world map
  mapY: number; // Percentage Y on world map
  accentColor: string;
  missions: AdventureMission[];
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  nextXp: number;
  progressPercent: number;
  xpIntoLevel: number;
  xpRequiredForNext: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  conditionText: string;
  icon: string;
  accent: string;
  target: number;
}

export type RewardType = 'xp' | 'gems' | 'avatar' | 'badge' | 'theme';

export interface ScratchRewardOption {
  id: string;
  type: RewardType;
  label: string;
  value: string | number;
  probability: number; // Percentage summing to 100
  color: string;
  description: string;
}

export interface ClaimedReward {
  challengeInstanceId: string;
  reward: ScratchRewardOption;
  claimedAt: string;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
}

export interface ParentControls {
  maxDifficulty: Difficulty;
  ageGroup: '8-9' | '10-12' | 'all';
  screenTimeReminderMins: number;
  leaderboardEnabled: boolean;
  allowFriendRequests: boolean;
  deletionRequested: boolean;
}

export interface SubjectStats {
  played: number;
  correct: number;
  total: number;
  xp: number;
}

export interface GameSessionRecord {
  id: string;
  gameId: GameId | 'daily-challenge';
  subject: Subject | 'Mixed';
  score: number;
  total: number;
  accuracy: number;
  xpEarned: number;
  durationSec: number;
  completedAt: string;
  offlineCaptured?: boolean;
}

export interface FriendProfile {
  uid: string;
  friendCode: string;
  nickname: string;
  avatarId: string;
  accessoryId: string;
  level: number;
  xp: number;
  recentAchievements: string[];
  highFivesSentByMe: number;
  lastHighFiveAt?: string;
  onlineStatus?: 'playing' | 'active' | 'resting';
}

export interface FriendRequestItem {
  id: string;
  fromUid: string;
  fromCode: string;
  fromNickname: string;
  fromAvatarId: string;
  fromLevel: number;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface HighFiveLog {
  id: string;
  fromNickname: string;
  toNickname: string;
  cheerType: 'high_five' | 'awesome_job' | 'keep_going';
  createdAt: string;
}

export interface LearningPack {
  id: string;
  title: string;
  subject: Subject;
  gradeClass: number;
  description: string;
  sizeKb: number;
  accent: string;
  quizQuestions: QuizQuestion[];
  matchSet?: MatchCategorySet;
  wordChallenges?: WordChallenge[];
  einsteinPuzzles?: EinsteinPuzzle[];
}

export interface DownloadedPackMeta {
  packId: string;
  downloadedAt: string;
  itemCount: number;
  sizeKb: number;
}

export interface OfflineSyncItem {
  id: string;
  type: 'session' | 'xp' | 'achievement' | 'daily' | 'reward';
  xpDelta: number;
  gemsDelta: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface DailyChallengeState {
  dateKey: string;
  completedSteps: number[];
  completed: boolean;
  rewardClaimed: boolean;
}

export interface PlayerState {
  uid: string;
  nickname: string;
  friendCode: string;
  gradeClass: number;
  avatarId: string;
  accessoryId: string;
  themeId: string;
  selectedSubjects: Subject[];
  xp: number;
  weeklyXp: number;
  monthlyXp: number;
  gems: number;
  streak: number;
  lastActiveDate: string;
  gamesCompleted: number;
  wordPuzzlesCompleted: number;
  matchGamesCompleted: number;
  einsteinSolved: number;
  quickAnswersCount: number;
  dailyStreakMax: number;
  highFivesSent: number;
  highFivesReceived: number;
  learningMinutes: number;
  weeklyActivityMins: number[]; // 7 days Mon..Sun
  unlockedAchievements: string[];
  unlockedAvatars: string[];
  unlockedThemes: string[];
  completedMissions: string[];
  claimedRewards: ClaimedReward[];
  pendingScratchCards: { challengeInstanceId: string; sourceTitle: string }[];
  subjectStats: Record<Subject, SubjectStats>;
  recentSessions: GameSessionRecord[];
  dailyChallenge: DailyChallengeState;
  audio: AudioSettings;
  parentControls: ParentControls;
  friends: FriendProfile[];
  incomingRequests: FriendRequestItem[];
  highFiveLogs: HighFiveLog[];
  downloadedPacks: Record<string, DownloadedPackMeta>;
  offlineSyncQueue: OfflineSyncItem[];
}
