import React from 'react';
import {
  Award,
  BookOpen,
  Brain,
  Compass,
  Download,
  Flame,
  Hand,
  Link2,
  Lock,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { ACHIEVEMENTS_CATALOG } from '../data/achievements';
import { usePlayer } from '../context/PlayerContext';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  zap: Zap,
  link: Link2,
  book: BookOpen,
  brain: Brain,
  compass: Compass,
  flame: Flame,
  sparkles: Sparkles,
  hand: Hand,
  download: Download,
};

export const AchievementsView: React.FC = () => {
  const { player } = usePlayer();
  const unlockedSet = new Set(player.unlockedAchievements);

  const getProgressValue = (id: string): number => {
    switch (id) {
      case 'first-victory':
        return player.gamesCompleted;
      case 'quick-thinker':
        return player.quickAnswersCount;
      case 'match-master':
        return player.matchGamesCompleted;
      case 'word-wizard':
        return player.wordPuzzlesCompleted;
      case 'einstein-mind':
        return player.einsteinSolved;
      case 'treasure-explorer':
        return player.completedMissions.length;
      case 'daily-champion':
        return Math.max(player.streak, player.dailyStreakMax);
      case 'scratch-lucky':
        return player.claimedRewards.length;
      case 'high-five-hero':
        return player.highFivesSent;
      case 'offline-scholar':
        return Object.keys(player.downloadedPacks).length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6 animate-fun-pop">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Achievements Hall</h1>
          <p className="text-slate-600 mt-1">
            Collect glowing badges as you conquer quizzes, word spells, mysteries, and islands!
          </p>
        </div>
        <div className="font-display text-lg font-bold text-blue-700 tabular-nums">
          Unlocked: {player.unlockedAchievements.length} / {ACHIEVEMENTS_CATALOG.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS_CATALOG.map((badge) => {
          const unlocked = unlockedSet.has(badge.id);
          const Icon = ICON_MAP[badge.icon] || Award;
          const progress = Math.min(badge.target, getProgressValue(badge.id));
          const pct = Math.round((progress / Math.max(1, badge.target)) * 100);

          return (
            <div
              key={badge.id}
              className={`card-toy rounded-3xl p-5 flex flex-col justify-between gap-4 ${
                unlocked ? 'bg-white' : 'bg-slate-50/90 opacity-85'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    unlocked ? 'text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                  style={unlocked ? { backgroundColor: badge.accent } : undefined}
                >
                  {unlocked ? <Icon className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {badge.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={unlocked ? 'text-emerald-600' : 'text-slate-500'}>
                    {unlocked ? 'Unlocked!' : badge.conditionText}
                  </span>
                  <span className="font-mono text-slate-600 tabular-nums">
                    {progress}/{badge.target}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${unlocked ? 100 : pct}%`,
                      backgroundColor: unlocked ? badge.accent : '#94A3B8',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
