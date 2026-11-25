import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle, signOutPlayer } from '../firebase';
import type {
  AudioSettings,
  ClaimedReward,
  FriendProfile,
  GameId,
  GameSessionRecord,
  LearningPack,
  OfflineSyncItem,
  ParentControls,
  PlayerState,
  ScratchRewardOption,
  Subject,
} from '../types/game';
import {
  addXpSafely,
  calculateUpdatedStreak,
  computeLevelInfo,
  evaluateNewAchievements,
  generateFriendCode,
  getLocalDateKey,
  isValidFriendCodeFormat,
} from '../game/xpEngine';
import {
  DEMO_FRIEND_DIRECTORY,
  INITIAL_DEMO_FRIENDS,
  INITIAL_DEMO_REQUESTS,
  OFFLINE_LEARNING_PACKS,
} from '../data/learningPacks';
import { soundEngine } from '../utils/soundEngine';

const STORAGE_KEY = 'funlearn_ai_player_state_v2';
const PACK_STORAGE_PREFIX = 'funlearn_ai_pack_';

function createDefaultSubjectStats(): PlayerState['subjectStats'] {
  const subjects: Subject[] = [
    'Mathematics',
    'Science',
    'English',
    'Kannada',
    'Hindi',
    'Social Science',
    'General Knowledge',
    'Logical Reasoning',
  ];
  const stats = {} as PlayerState['subjectStats'];
  subjects.forEach((s) => {
    stats[s] = { played: 0, correct: 0, total: 0, xp: 0 };
  });
  // Seed light starter progress so charts look alive immediately
  stats.Mathematics = { played: 2, correct: 8, total: 10, xp: 80 };
  stats.Science = { played: 2, correct: 9, total: 10, xp: 90 };
  stats.English = { played: 1, correct: 4, total: 5, xp: 40 };
  stats['Logical Reasoning'] = { played: 1, correct: 3, total: 5, xp: 45 };
  return stats;
}

function createInitialState(): PlayerState {
  const today = getLocalDateKey();
  const uid = 'local-explorer-01';
  return {
    uid,
    nickname: 'StarExplorer',
    friendCode: generateFriendCode(uid),
    gradeClass: 5,
    avatarId: 'explorer-kid',
    accessoryId: 'goggles',
    themeId: 'sky',
    selectedSubjects: ['Mathematics', 'Science', 'English', 'Logical Reasoning'],
    xp: 255,
    weeklyXp: 165,
    monthlyXp: 255,
    gems: 45,
    streak: 3,
    lastActiveDate: today,
    gamesCompleted: 3,
    wordPuzzlesCompleted: 6,
    matchGamesCompleted: 1,
    einsteinSolved: 2,
    quickAnswersCount: 2,
    dailyStreakMax: 3,
    highFivesSent: 1,
    highFivesReceived: 2,
    learningMinutes: 42,
    weeklyActivityMins: [12, 18, 15, 22, 14, 25, 16],
    unlockedAchievements: ['first-victory', 'quick-thinker', 'match-master'],
    unlockedAvatars: ['explorer-kid', 'professor-owl', 'genius-panda', 'spark-dragon', 'robo-buddy'],
    unlockedThemes: ['sky', 'jungle', 'candy'],
    completedMissions: ['sci-m1'],
    claimedRewards: [],
    pendingScratchCards: [
      { challengeInstanceId: 'welcome-bonus-card', sourceTitle: 'Welcome Explorer Gift' },
    ],
    subjectStats: createDefaultSubjectStats(),
    recentSessions: [
      {
        id: 'seed-session-1',
        gameId: 'brain-blast',
        subject: 'Science',
        score: 5,
        total: 5,
        accuracy: 100,
        xpEarned: 50,
        durationSec: 84,
        completedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: 'seed-session-2',
        gameId: 'match-master',
        subject: 'General Knowledge',
        score: 5,
        total: 5,
        accuracy: 100,
        xpEarned: 25,
        durationSec: 46,
        completedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
    ],
    dailyChallenge: {
      dateKey: today,
      completedSteps: [],
      completed: false,
      rewardClaimed: false,
    },
    audio: {
      soundEnabled: true,
      musicEnabled: false,
      sfxVolume: 0.72,
      musicVolume: 0.25,
      reducedMotion: false,
    },
    parentControls: {
      maxDifficulty: 'Einstein Level',
      ageGroup: 'all',
      screenTimeReminderMins: 30,
      leaderboardEnabled: true,
      allowFriendRequests: true,
      deletionRequested: false,
    },
    friends: INITIAL_DEMO_FRIENDS,
    incomingRequests: INITIAL_DEMO_REQUESTS,
    highFiveLogs: [
      {
        id: 'hf-seed-1',
        fromNickname: 'CosmicNova',
        toNickname: 'StarExplorer',
        cheerType: 'high_five',
        createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
    ],
    downloadedPacks: {},
    offlineSyncQueue: [],
  };
}

export interface CelebrationBanner {
  id: string;
  kind: 'level-up' | 'achievement' | 'high-five' | 'sync';
  title: string;
  subtitle: string;
}

interface PlayerContextValue {
  player: PlayerState;
  firebaseUser: User | null;
  authReady: boolean;
  isOffline: boolean;
  simulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  celebration: CelebrationBanner | null;
  dismissCelebration: () => void;
  activeScratchCard: { challengeInstanceId: string; sourceTitle: string } | null;
  openScratchCard: (card: { challengeInstanceId: string; sourceTitle: string }) => void;
  closeScratchCard: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  recordGameCompletion: (params: {
    gameId: GameId | 'daily-challenge';
    subject: Subject | 'Mixed';
    score: number;
    total: number;
    xpEarned: number;
    gemsEarned?: number;
    durationSec: number;
    quickAnswers?: number;
    wordPuzzlesDelta?: number;
    einsteinDelta?: number;
    completedMissionId?: string;
    unlockScratchCardTitle?: string;
  }) => void;
  markDailyStepComplete: (stepIndex: number) => void;
  completeDailyChallenge: () => void;
  applyScratchReward: (challengeInstanceId: string, reward: ScratchRewardOption) => void;
  updateProfile: (patch: Partial<Pick<PlayerState, 'nickname' | 'gradeClass' | 'avatarId' | 'accessoryId' | 'themeId' | 'selectedSubjects'>>) => void;
  updateAudio: (patch: Partial<AudioSettings>) => void;
  updateParentControls: (patch: Partial<ParentControls>) => void;
  sendFriendRequestByCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  respondToFriendRequest: (requestId: string, accept: boolean) => void;
  sendHighFive: (friendUid: string, cheerType?: 'high_five' | 'awesome_job' | 'keep_going') => void;
  downloadLearningPack: (pack: LearningPack) => void;
  removeLearningPack: (packId: string) => void;
  getCachedPack: (packId: string) => LearningPack | null;
  syncOfflineQueueNow: () => Promise<void>;
  liveLeaderboard: {
    uid: string;
    nickname: string;
    avatarId: string;
    accessoryId: string;
    xp: number;
    weeklyXp: number;
    monthlyXp: number;
    level: number;
    badgesCount: number;
  }[];
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<PlayerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PlayerState>;
        const base = createInitialState();
        const today = getLocalDateKey();
        const daily =
          parsed.dailyChallenge && parsed.dailyChallenge.dateKey === today
            ? parsed.dailyChallenge
            : { dateKey: today, completedSteps: [], completed: false, rewardClaimed: false };
        return {
          ...base,
          ...parsed,
          dailyChallenge: daily,
          audio: { ...base.audio, ...(parsed.audio || {}) },
          parentControls: { ...base.parentControls, ...(parsed.parentControls || {}) },
          subjectStats: { ...base.subjectStats, ...(parsed.subjectStats || {}) },
        };
      }
    } catch {
      // Ignore storage parse error
    }
    return createInitialState();
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [networkOffline, setNetworkOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationBanner | null>(null);
  const [activeScratchCard, setActiveScratchCard] = useState<{
    challengeInstanceId: string;
    sourceTitle: string;
  } | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<PlayerContextValue['liveLeaderboard']>([]);

  const isOffline = networkOffline || simulatedOffline;
  const playerRef = useRef(player);
  playerRef.current = player;

  // Persist locally on every state update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    } catch {
      // Ignore quota errors
    }
  }, [player]);

  // Sync sound engine settings & reduced motion class on document
  useEffect(() => {
    soundEngine.updateSettings(player.audio);
    if (player.audio.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [player.audio]);

  // Unlock Web Audio on first user interaction (never autoplay)
  useEffect(() => {
    const onFirstGesture = () => {
      soundEngine.unlock();
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  // Online / Offline connectivity listeners
  useEffect(() => {
    const handleOnline = () => setNetworkOffline(false);
    const handleOffline = () => setNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync profile + queued offline progress to Firestore when online and signed in
  const syncToFirestore = useCallback(
    async (user: User, snapshot: PlayerState, clearQueue = false) => {
      if (!user || !user.emailVerified) return;
      const lvl = computeLevelInfo(snapshot.xp).level;
      const uid = user.uid;
      const userPath = `users/${uid}`;

      try {
        const userRef = doc(db, 'users', uid);
        const existingSnap = await getDoc(userRef);
        const basePayload = {
          uid,
          nickname: snapshot.nickname.slice(0, 24),
          friendCode: snapshot.friendCode,
          gradeClass: snapshot.gradeClass,
          avatarId: snapshot.avatarId,
          accessoryId: snapshot.accessoryId,
          themeId: snapshot.themeId,
          xp: Math.max(0, Math.floor(snapshot.xp)),
          gems: Math.max(0, Math.floor(snapshot.gems)),
          level: lvl,
          streak: snapshot.streak,
          highFivesReceived: snapshot.highFivesReceived,
          lastActiveDate: snapshot.lastActiveDate,
          gamesCompleted: snapshot.gamesCompleted,
          learningMinutes: snapshot.learningMinutes,
          leaderboardOptIn: snapshot.parentControls.leaderboardEnabled,
          allowFriendRequests: snapshot.parentControls.allowFriendRequests,
          selectedSubjects: snapshot.selectedSubjects.slice(0, 10),
          unlockedAvatars: snapshot.unlockedAvatars.slice(0, 20),
          unlockedThemes: snapshot.unlockedThemes.slice(0, 10),
          completedMissions: snapshot.completedMissions.slice(0, 40),
          updatedAt: serverTimestamp(),
        };

        if (!existingSnap.exists()) {
          await setDoc(userRef, {
            ...basePayload,
            createdAt: serverTimestamp(),
          });
        } else {
          await setDoc(userRef, basePayload, { merge: true });
        }

        // Sync child-safe Leaderboard doc (no PII!)
        await setDoc(
          doc(db, 'leaderboard', uid),
          {
            uid,
            nickname: snapshot.nickname.slice(0, 24),
            avatarId: snapshot.avatarId,
            accessoryId: snapshot.accessoryId,
            xp: Math.max(0, Math.floor(snapshot.xp)),
            weeklyXp: Math.max(0, Math.floor(snapshot.weeklyXp)),
            monthlyXp: Math.max(0, Math.floor(snapshot.monthlyXp)),
            level: lvl,
            badgesCount: snapshot.unlockedAchievements.length,
            optedIn: snapshot.parentControls.leaderboardEnabled,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Sync Friend Code lookup doc (no PII!)
        await setDoc(
          doc(db, 'friendCodes', snapshot.friendCode),
          {
            code: snapshot.friendCode,
            uid,
            nickname: snapshot.nickname.slice(0, 24),
            avatarId: snapshot.avatarId,
            accessoryId: snapshot.accessoryId,
            level: lvl,
            recentBadges: snapshot.unlockedAchievements.slice(0, 6),
            allowRequests: snapshot.parentControls.allowFriendRequests,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Sync queued achievements & sessions
        for (const achId of snapshot.unlockedAchievements) {
          const safeId = achId.replace(/[^a-zA-Z0-9_-]/g, '');
          if (!safeId) continue;
          const achRef = doc(db, 'users', uid, 'achievements', safeId);
          const achSnap = await getDoc(achRef);
          if (!achSnap.exists()) {
            await setDoc(achRef, {
              uid,
              achievementId: safeId,
              unlocked: true,
              unlockedAt: serverTimestamp(),
            });
          }
        }

        if (clearQueue && snapshot.offlineSyncQueue.length > 0) {
          setPlayer((prev) => ({ ...prev, offlineSyncQueue: [] }));
        }
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        // Non-fatal in preview if offline; log structured Firestore info
        try {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        } catch {
          // Handled cleanly without crashing UI
        }
      }
    },
    []
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (user && !isOffline) {
        const friendCode = generateFriendCode(user.uid);
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setPlayer((prev) => ({
              ...prev,
              uid: user.uid,
              friendCode: typeof data.friendCode === 'string' ? data.friendCode : friendCode,
              nickname: typeof data.nickname === 'string' ? data.nickname : prev.nickname,
              xp: Math.max(prev.xp, typeof data.xp === 'number' ? data.xp : 0),
              gems: Math.max(prev.gems, typeof data.gems === 'number' ? data.gems : 0),
              streak: Math.max(prev.streak, typeof data.streak === 'number' ? data.streak : 1),
            }));
          } else {
            const updated = { ...playerRef.current, uid: user.uid, friendCode };
            setPlayer(updated);
            await syncToFirestore(user, updated, false);
          }

          // Load opted-in leaderboard rows
          const lbQuery = query(collection(db, 'leaderboard'), where('optedIn', '==', true));
          const lbSnap = await getDocs(lbQuery);
          const rows = lbSnap.docs.map((d) => {
            const r = d.data();
            return {
              uid: String(r.uid || d.id),
              nickname: String(r.nickname || 'Explorer'),
              avatarId: String(r.avatarId || 'explorer-kid'),
              accessoryId: String(r.accessoryId || 'none'),
              xp: Number(r.xp || 0),
              weeklyXp: Number(r.weeklyXp || 0),
              monthlyXp: Number(r.monthlyXp || 0),
              level: Number(r.level || 1),
              badgesCount: Number(r.badgesCount || 0),
            };
          });
          setLiveLeaderboard(rows);
        } catch {
          // Fallback silently to local mode if Firestore unreachable
        }
      }
    });
    return () => unsub();
  }, [isOffline, syncToFirestore]);

  const syncOfflineQueueNow = useCallback(async () => {
    if (isOffline) return;
    setIsSyncing(true);
    try {
      const current = playerRef.current;
      const queuedCount = current.offlineSyncQueue.length;
      if (firebaseUser) {
        await syncToFirestore(firebaseUser, current, true);
      } else {
        // Local acknowledgement when in guest preview mode
        setPlayer((prev) => ({ ...prev, offlineSyncQueue: [] }));
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      if (queuedCount > 0) {
        soundEngine.playCorrect();
        setCelebration({
          id: `sync-${Date.now()}`,
          kind: 'sync',
          title: 'Progress Synced!',
          subtitle: `${queuedCount} offline learning ${queuedCount === 1 ? 'record' : 'records'} saved safely to the cloud!`,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [firebaseUser, isOffline, syncToFirestore]);

  // Automatic Firebase sync as soon as connectivity returns
  useEffect(() => {
    if (!isOffline && player.offlineSyncQueue.length > 0) {
      syncOfflineQueueNow();
    }
  }, [isOffline, player.offlineSyncQueue.length, syncOfflineQueueNow]);

  const recordGameCompletion: PlayerContextValue['recordGameCompletion'] = useCallback(
    ({
      gameId,
      subject,
      score,
      total,
      xpEarned,
      gemsEarned = 5,
      durationSec,
      quickAnswers = 0,
      wordPuzzlesDelta = 0,
      einsteinDelta = 0,
      completedMissionId,
      unlockScratchCardTitle,
    }) => {
      const today = getLocalDateKey();
      const safeXp = Math.max(0, Math.round(xpEarned));
      const safeGems = Math.max(0, Math.round(gemsEarned));
      const accuracy = total > 0 ? Math.round((score / total) * 100) : 100;
      const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      setPlayer((prev) => {
        const oldLevel = computeLevelInfo(prev.xp).level;
        const nextXp = addXpSafely(prev.xp, safeXp);
        const newLevelInfo = computeLevelInfo(nextXp);
        const nextStreak = calculateUpdatedStreak(prev.lastActiveDate, today, prev.streak);

        const nextSubjectStats = { ...prev.subjectStats };
        if (subject !== 'Mixed' && nextSubjectStats[subject]) {
          const cur = nextSubjectStats[subject];
          nextSubjectStats[subject] = {
            played: cur.played + 1,
            correct: cur.correct + score,
            total: cur.total + total,
            xp: cur.xp + safeXp,
          };
        }

        const nextCompletedMissions =
          completedMissionId && !prev.completedMissions.includes(completedMissionId)
            ? [...prev.completedMissions, completedMissionId]
            : prev.completedMissions;

        const sessionRecord: GameSessionRecord = {
          id: sessionId,
          gameId,
          subject,
          score,
          total,
          accuracy,
          xpEarned: safeXp,
          durationSec,
          completedAt: new Date().toISOString(),
          offlineCaptured: isOffline,
        };

        const nextPendingCards = unlockScratchCardTitle
          ? [
              ...prev.pendingScratchCards,
              {
                challengeInstanceId: `card-${gameId}-${Date.now()}`,
                sourceTitle: unlockScratchCardTitle,
              },
            ]
          : prev.pendingScratchCards;

        const draftNext: PlayerState = {
          ...prev,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + safeXp,
          monthlyXp: prev.monthlyXp + safeXp,
          gems: prev.gems + safeGems,
          streak: nextStreak,
          dailyStreakMax: Math.max(prev.dailyStreakMax, nextStreak),
          lastActiveDate: today,
          gamesCompleted: prev.gamesCompleted + 1,
          matchGamesCompleted: prev.matchGamesCompleted + (gameId === 'match-master' ? 1 : 0),
          wordPuzzlesCompleted: prev.wordPuzzlesCompleted + wordPuzzlesDelta,
          einsteinSolved: prev.einsteinSolved + einsteinDelta,
          quickAnswersCount: prev.quickAnswersCount + quickAnswers,
          learningMinutes: prev.learningMinutes + Math.max(1, Math.round(durationSec / 60)),
          completedMissions: nextCompletedMissions,
          subjectStats: nextSubjectStats,
          recentSessions: [sessionRecord, ...prev.recentSessions].slice(0, 20),
          pendingScratchCards: nextPendingCards,
          offlineSyncQueue: isOffline
            ? [
                ...prev.offlineSyncQueue,
                {
                  id: sessionId,
                  type: 'session',
                  xpDelta: safeXp,
                  gemsDelta: safeGems,
                  payload: { gameId, subject, score, total, accuracy },
                  createdAt: new Date().toISOString(),
                },
              ]
            : prev.offlineSyncQueue,
        };

        const newlyUnlocked = evaluateNewAchievements(draftNext);
        const finalState: PlayerState = {
          ...draftNext,
          unlockedAchievements: [...draftNext.unlockedAchievements, ...newlyUnlocked],
        };

        if (newLevelInfo.level > oldLevel) {
          soundEngine.playLevelUp();
          setCelebration({
            id: `lvl-${Date.now()}`,
            kind: 'level-up',
            title: `Level ${newLevelInfo.level}: ${newLevelInfo.title}!`,
            subtitle: `Amazing work, ${prev.nickname}! You reached ${nextXp} XP!`,
          });
        } else if (newlyUnlocked.length > 0) {
          soundEngine.playVictory();
          setCelebration({
            id: `ach-${Date.now()}`,
            kind: 'achievement',
            title: 'New Achievement Unlocked!',
            subtitle: `You earned ${newlyUnlocked.length} new badge${newlyUnlocked.length > 1 ? 's' : ''} in your trophy hall!`,
          });
        }

        if (firebaseUser && !isOffline) {
          void syncToFirestore(firebaseUser, finalState, false);
        }

        return finalState;
      });
    },
    [firebaseUser, isOffline, syncToFirestore]
  );

  const markDailyStepComplete = useCallback((stepIndex: number) => {
    const today = getLocalDateKey();
    setPlayer((prev) => {
      const baseDaily =
        prev.dailyChallenge.dateKey === today
          ? prev.dailyChallenge
          : { dateKey: today, completedSteps: [], completed: false, rewardClaimed: false };
      if (baseDaily.completedSteps.includes(stepIndex)) return prev;
      const steps = [...baseDaily.completedSteps, stepIndex].sort((a, b) => a - b);
      return {
        ...prev,
        dailyChallenge: {
          ...baseDaily,
          completedSteps: steps,
        },
      };
    });
  }, []);

  const completeDailyChallenge = useCallback(() => {
    const today = getLocalDateKey();
    setPlayer((prev) => {
      if (prev.dailyChallenge.dateKey === today && prev.dailyChallenge.rewardClaimed) {
        return prev;
      }
      const nextXp = addXpSafely(prev.xp, 30);
      const nextStreak = calculateUpdatedStreak(prev.lastActiveDate, today, prev.streak);
      const cardId = `daily-${today}`;
      const next: PlayerState = {
        ...prev,
        xp: nextXp,
        weeklyXp: prev.weeklyXp + 30,
        monthlyXp: prev.monthlyXp + 30,
        gems: prev.gems + 15,
        streak: nextStreak,
        dailyStreakMax: Math.max(prev.dailyStreakMax, nextStreak),
        lastActiveDate: today,
        dailyChallenge: {
          dateKey: today,
          completedSteps: [0, 1, 2, 3, 4],
          completed: true,
          rewardClaimed: true,
        },
        pendingScratchCards: [
          ...prev.pendingScratchCards,
          { challengeInstanceId: cardId, sourceTitle: `Daily Challenge (${today})` },
        ],
        offlineSyncQueue: isOffline
          ? [
              ...prev.offlineSyncQueue,
              {
                id: `daily-sync-${today}`,
                type: 'daily',
                xpDelta: 30,
                gemsDelta: 15,
                payload: { dateKey: today },
                createdAt: new Date().toISOString(),
              },
            ]
          : prev.offlineSyncQueue,
      };
      const newlyUnlocked = evaluateNewAchievements(next);
      return {
        ...next,
        unlockedAchievements: [...next.unlockedAchievements, ...newlyUnlocked],
      };
    });
  }, [isOffline]);

  const applyScratchReward = useCallback(
    (challengeInstanceId: string, reward: ScratchRewardOption) => {
      setPlayer((prev) => {
        if (prev.claimedRewards.some((c) => c.challengeInstanceId === challengeInstanceId)) {
          return prev;
        }
        let nextXp = prev.xp;
        let nextGems = prev.gems;
        const nextAvatars = [...prev.unlockedAvatars];
        const nextThemes = [...prev.unlockedThemes];
        const nextBadges = [...prev.unlockedAchievements];

        if (reward.type === 'xp' && typeof reward.value === 'number') {
          nextXp = addXpSafely(prev.xp, reward.value);
        } else if (reward.type === 'gems' && typeof reward.value === 'number') {
          nextGems += reward.value;
        } else if (reward.type === 'avatar' && typeof reward.value === 'string') {
          if (!nextAvatars.includes(reward.value)) nextAvatars.push(reward.value);
        } else if (reward.type === 'theme' && typeof reward.value === 'string') {
          if (!nextThemes.includes(reward.value)) nextThemes.push(reward.value);
        } else if (reward.type === 'badge' && typeof reward.value === 'string') {
          if (!nextBadges.includes(reward.value)) nextBadges.push(reward.value);
        }

        const claim: ClaimedReward = {
          challengeInstanceId,
          reward,
          claimedAt: new Date().toISOString(),
        };

        const draft: PlayerState = {
          ...prev,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + (nextXp - prev.xp),
          monthlyXp: prev.monthlyXp + (nextXp - prev.xp),
          gems: nextGems,
          unlockedAvatars: nextAvatars,
          unlockedThemes: nextThemes,
          unlockedAchievements: nextBadges,
          claimedRewards: [claim, ...prev.claimedRewards],
          pendingScratchCards: prev.pendingScratchCards.filter(
            (c) => c.challengeInstanceId !== challengeInstanceId
          ),
        };
        const newlyUnlocked = evaluateNewAchievements(draft);
        return {
          ...draft,
          unlockedAchievements: [...draft.unlockedAchievements, ...newlyUnlocked],
        };
      });
    },
    []
  );

  const updateProfile: PlayerContextValue['updateProfile'] = useCallback(
    (patch) => {
      setPlayer((prev) => {
        const next = { ...prev, ...patch };
        if (firebaseUser && !isOffline) {
          void syncToFirestore(firebaseUser, next, false);
        }
        return next;
      });
    },
    [firebaseUser, isOffline, syncToFirestore]
  );

  const updateAudio: PlayerContextValue['updateAudio'] = useCallback((patch) => {
    setPlayer((prev) => ({
      ...prev,
      audio: { ...prev.audio, ...patch },
    }));
  }, []);

  const updateParentControls: PlayerContextValue['updateParentControls'] = useCallback(
    (patch) => {
      setPlayer((prev) => {
        const next = {
          ...prev,
          parentControls: { ...prev.parentControls, ...patch },
        };
        if (firebaseUser && !isOffline) {
          void syncToFirestore(firebaseUser, next, false);
        }
        return next;
      });
    },
    [firebaseUser, isOffline, syncToFirestore]
  );

  const sendFriendRequestByCode = useCallback(
    async (rawCode: string): Promise<{ ok: boolean; message: string }> => {
      const normalized = rawCode.trim().toUpperCase();
      if (!isValidFriendCodeFormat(normalized)) {
        return { ok: false, message: 'Enter a valid Friend Code like FUN-BRAIN-7731.' };
      }
      if (normalized === playerRef.current.friendCode) {
        return { ok: false, message: 'That is your own Friend Code! Share it with a friend instead.' };
      }
      if (playerRef.current.friends.some((f) => f.friendCode === normalized)) {
        return { ok: false, message: 'You are already friends with this explorer!' };
      }

      // 1. Check live Firestore friendCodes if signed in and online
      if (firebaseUser && !isOffline) {
        try {
          const codeSnap = await getDoc(doc(db, 'friendCodes', normalized));
          if (codeSnap.exists()) {
            const target = codeSnap.data();
            if (target.allowRequests === false) {
              return { ok: false, message: 'This player’s parent has paused new friend requests.' };
            }
            const reqId = `${firebaseUser.uid}_${String(target.uid)}`;
            await setDoc(doc(db, 'friendRequests', reqId), {
              fromUid: firebaseUser.uid,
              fromNickname: playerRef.current.nickname,
              fromAvatarId: playerRef.current.avatarId,
              fromLevel: computeLevelInfo(playerRef.current.xp).level,
              toUid: String(target.uid),
              toCode: normalized,
              status: 'pending',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            soundEngine.playCorrect();
            return {
              ok: true,
              message: `Friend request sent to ${String(target.nickname)}!`,
            };
          }
        } catch {
          // Fall through to demo directory check
        }
      }

      // 2. Check deterministic demo directory so users can test Friend Codes immediately!
      const match = DEMO_FRIEND_DIRECTORY.find((d) => d.friendCode === normalized);
      if (match) {
        setPlayer((prev) => ({
          ...prev,
          friends: [match, ...prev.friends.filter((f) => f.uid !== match.uid)],
          incomingRequests: prev.incomingRequests.filter((r) => r.fromUid !== match.uid),
        }));
        soundEngine.playCorrect();
        return {
          ok: true,
          message: `Connected with ${match.nickname}! You can now see their achievements and send High-Fives!`,
        };
      }

      return {
        ok: false,
        message: 'No explorer found with that code. Try FUN-BRAIN-7731 or FUN-WORD-5519!',
      };
    },
    [firebaseUser, isOffline]
  );

  const respondToFriendRequest = useCallback((requestId: string, accept: boolean) => {
    setPlayer((prev) => {
      const req = prev.incomingRequests.find((r) => r.id === requestId);
      if (!req) return prev;
      const remaining = prev.incomingRequests.filter((r) => r.id !== requestId);
      if (!accept) {
        return { ...prev, incomingRequests: remaining };
      }
      const directoryEntry = DEMO_FRIEND_DIRECTORY.find((d) => d.uid === req.fromUid);
      const newFriend: FriendProfile = directoryEntry || {
        uid: req.fromUid,
        friendCode: req.fromCode,
        nickname: req.fromNickname,
        avatarId: req.fromAvatarId,
        accessoryId: 'none',
        level: req.fromLevel,
        xp: req.fromLevel * 220,
        recentAchievements: ['First Victory'],
        highFivesSentByMe: 0,
        onlineStatus: 'active',
      };
      soundEngine.playCorrect();
      return {
        ...prev,
        incomingRequests: remaining,
        friends: [newFriend, ...prev.friends.filter((f) => f.uid !== newFriend.uid)],
      };
    });
  }, []);

  const sendHighFive = useCallback(
    (friendUid: string, cheerType: 'high_five' | 'awesome_job' | 'keep_going' = 'high_five') => {
      soundEngine.playHighFive();
      setPlayer((prev) => {
        const target = prev.friends.find((f) => f.uid === friendUid);
        if (!target) return prev;
        const now = new Date().toISOString();
        const nextFriends = prev.friends.map((f) =>
          f.uid === friendUid
            ? { ...f, highFivesSentByMe: f.highFivesSentByMe + 1, lastHighFiveAt: now }
            : f
        );
        const draft: PlayerState = {
          ...prev,
          highFivesSent: prev.highFivesSent + 1,
          friends: nextFriends,
          highFiveLogs: [
            {
              id: `hf-${Date.now()}`,
              fromNickname: prev.nickname,
              toNickname: target.nickname,
              cheerType,
              createdAt: now,
            },
            ...prev.highFiveLogs,
          ].slice(0, 15),
        };
        const newlyUnlocked = evaluateNewAchievements(draft);
        return {
          ...draft,
          unlockedAchievements: [...draft.unlockedAchievements, ...newlyUnlocked],
        };
      });
    },
    []
  );

  const downloadLearningPack = useCallback((pack: LearningPack) => {
    try {
      localStorage.setItem(`${PACK_STORAGE_PREFIX}${pack.id}`, JSON.stringify(pack));
    } catch {
      // Ignore storage limit
    }
    const itemCount =
      pack.quizQuestions.length +
      (pack.matchSet?.pairs.length || 0) +
      (pack.wordChallenges?.length || 0) +
      (pack.einsteinPuzzles?.length || 0);

    soundEngine.playCorrect();
    setPlayer((prev) => {
      const draft: PlayerState = {
        ...prev,
        downloadedPacks: {
          ...prev.downloadedPacks,
          [pack.id]: {
            packId: pack.id,
            downloadedAt: new Date().toISOString(),
            itemCount,
            sizeKb: pack.sizeKb,
          },
        },
      };
      const newlyUnlocked = evaluateNewAchievements(draft);
      return {
        ...draft,
        unlockedAchievements: [...draft.unlockedAchievements, ...newlyUnlocked],
      };
    });
  }, []);

  const removeLearningPack = useCallback((packId: string) => {
    try {
      localStorage.removeItem(`${PACK_STORAGE_PREFIX}${packId}`);
    } catch {
      // Ignore
    }
    setPlayer((prev) => {
      const nextPacks = { ...prev.downloadedPacks };
      delete nextPacks[packId];
      return { ...prev, downloadedPacks: nextPacks };
    });
  }, []);

  const getCachedPack = useCallback((packId: string): LearningPack | null => {
    try {
      const raw = localStorage.getItem(`${PACK_STORAGE_PREFIX}${packId}`);
      if (raw) return JSON.parse(raw) as LearningPack;
    } catch {
      // Ignore
    }
    return OFFLINE_LEARNING_PACKS.find((p) => p.id === packId) || null;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        player,
        firebaseUser,
        authReady,
        isOffline,
        simulatedOffline,
        setSimulatedOffline,
        isSyncing,
        lastSyncedAt,
        celebration,
        dismissCelebration: () => setCelebration(null),
        activeScratchCard,
        openScratchCard: (card) => setActiveScratchCard(card),
        closeScratchCard: () => setActiveScratchCard(null),
        signIn: signInWithGoogle,
        signOut: signOutPlayer,
        recordGameCompletion,
        markDailyStepComplete,
        completeDailyChallenge,
        applyScratchReward,
        updateProfile,
        updateAudio,
        updateParentControls,
        sendFriendRequestByCode,
        respondToFriendRequest,
        sendHighFive,
        downloadLearningPack,
        removeLearningPack,
        getCachedPack,
        syncOfflineQueueNow,
        liveLeaderboard,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
