import React, { useMemo, useState } from 'react';
import { Award, Crown, Medal, ShieldCheck, TrendingUp, Trophy } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { DEMO_LEADERBOARD_ROWS, type LeaderboardRow } from '../data/learningPacks';
import { computeLevelInfo } from '../game/xpEngine';
import { AvatarBadge } from '../components/AvatarBadge';
import { soundEngine } from '../utils/soundEngine';

type BoardTab = 'weekly' | 'monthly' | 'personal';

export const LeaderboardView: React.FC = () => {
  const { player, liveLeaderboard } = usePlayer();
  const [tab, setTab] = useState<BoardTab>('weekly');
  const levelInfo = computeLevelInfo(player.xp);

  const rankedRows = useMemo(() => {
    const map = new Map<string, LeaderboardRow>();
    DEMO_LEADERBOARD_ROWS.forEach((row) => map.set(row.uid, row));
    liveLeaderboard.forEach((row) => map.set(row.uid, row));

    if (player.parentControls.leaderboardEnabled) {
      map.set(player.uid, {
        uid: player.uid,
        nickname: player.nickname,
        avatarId: player.avatarId,
        accessoryId: player.accessoryId,
        xp: player.xp,
        weeklyXp: player.weeklyXp,
        monthlyXp: player.monthlyXp,
        level: levelInfo.level,
        badgesCount: player.unlockedAchievements.length,
        isCurrentUser: true,
      });
    }

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (tab === 'weekly') return b.weeklyXp - a.weeklyXp;
      return b.monthlyXp - a.monthlyXp;
    });
    return list;
  }, [
    liveLeaderboard,
    player.uid,
    player.nickname,
    player.avatarId,
    player.accessoryId,
    player.xp,
    player.weeklyXp,
    player.monthlyXp,
    player.unlockedAchievements.length,
    player.parentControls.leaderboardEnabled,
    levelInfo.level,
    tab,
  ]);

  const myRank = rankedRows.findIndex((r) => r.uid === player.uid) + 1;
  const topThree = rankedRows.slice(0, 3);
  const scoreForTab = (row: LeaderboardRow) => (tab === 'weekly' ? row.weeklyXp : row.monthlyXp);

  // Subject accuracy comparison for Personal Progress tab
  const subjectProgress = Object.entries(player.subjectStats)
    .map(([name, stat]) => ({
      name,
      played: stat.played,
      xp: stat.xp,
      accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }))
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 animate-fun-pop">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Child-Safe Leaderboard
          </h1>
          <p className="text-slate-600 mt-1">
            Celebrate learning together! Only explorer nicknames, avatars, and XP are ever shown.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-white border-2 border-slate-200 p-1 shadow-sm self-start">
          {(
            [
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'personal', label: 'My Progress' },
            ] as { id: BoardTab; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab(item.id);
              }}
              className={`rounded-xl px-4 py-2 font-display text-sm font-bold whitespace-nowrap transition-all ${
                tab === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee Notice */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3 text-sm text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="font-semibold">
          Kid-Safe Privacy Active: Real names, emails, schools, and chat are never shown or collected.
          {!player.parentControls.leaderboardEnabled && (
            <span className="text-amber-700 font-bold">
              {' '}
              Your Parent Dashboard currently hides your profile from public rankings.
            </span>
          )}
        </p>
      </div>

      {tab === 'personal' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-toy rounded-3xl p-5 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Weekly XP</p>
              <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                {player.weeklyXp} XP
              </p>
              <p className="text-xs text-slate-600">Keep playing daily to beat last week!</p>
            </div>
            <div className="card-toy rounded-3xl p-5 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Monthly XP</p>
              <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                {player.monthlyXp} XP
              </p>
              <p className="text-xs text-slate-600">
                Level {levelInfo.level} · {levelInfo.title}
              </p>
            </div>
            <div className="card-toy rounded-3xl p-5 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Personal Best Streak
              </p>
              <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                {player.dailyStreakMax} Days
              </p>
              <p className="text-xs text-slate-600">
                {player.gamesCompleted} games completed overall
              </p>
            </div>
          </div>

          <div className="card-toy rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Your Personal Growth by Subject</span>
            </h2>
            <div className="space-y-3.5">
              {subjectProgress.map((sub) => (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-800">{sub.name}</span>
                    <span className="text-slate-500 tabular-nums">
                      {sub.played > 0 ? `${sub.accuracy}% accuracy · ${sub.xp} XP` : 'Ready to explore'}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${sub.played > 0 ? Math.max(10, sub.accuracy) : 4}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topThree.map((entry, idx) => {
              const rank = idx + 1;
              const podiumStyle =
                rank === 1
                  ? 'from-amber-100 via-yellow-50 to-white border-amber-300'
                  : rank === 2
                  ? 'from-slate-100 via-white to-slate-50 border-slate-300'
                  : 'from-orange-100 via-amber-50/40 to-white border-orange-300';
              const medalColor =
                rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-500' : 'text-orange-600';

              return (
                <div
                  key={entry.uid}
                  className={`rounded-3xl border-2 bg-gradient-to-b p-5 flex flex-col items-center text-center gap-3 shadow-sm ${podiumStyle}`}
                >
                  <div className="inline-flex items-center gap-1.5 font-display font-bold text-sm text-slate-700">
                    {rank === 1 ? (
                      <Crown className={`w-5 h-5 ${medalColor}`} />
                    ) : (
                      <Medal className={`w-5 h-5 ${medalColor}`} />
                    )}
                    <span>Rank #{rank}</span>
                  </div>
                  <AvatarBadge
                    avatarId={entry.avatarId}
                    accessoryId={entry.accessoryId}
                    size="lg"
                  />
                  <div>
                    <p className="font-display text-lg font-bold text-slate-900">
                      {entry.nickname}
                      {entry.uid === player.uid && (
                        <span className="ml-1.5 text-xs font-bold text-blue-600">(You)</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      Level {entry.level} · {entry.badgesCount} Badges
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/90 border border-slate-200 px-4 py-1.5 font-mono text-sm font-bold text-blue-700 tabular-nums">
                    {scoreForTab(entry)} XP
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Ranked List */}
          <div className="card-toy rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/80">
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{tab === 'weekly' ? 'This Week’s' : 'This Month’s'} Top Explorers</span>
              </h2>
              {player.parentControls.leaderboardEnabled && myRank > 0 && (
                <span className="text-xs font-bold text-blue-700 tabular-nums">
                  Your Rank: #{myRank}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {rankedRows.map((row, idx) => {
                const isMe = row.uid === player.uid;
                return (
                  <div
                    key={row.uid}
                    className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                      isMe ? 'bg-blue-50/80' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl font-display font-bold text-sm flex items-center justify-center shrink-0 tabular-nums ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-orange-300 text-slate-950'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <AvatarBadge
                        avatarId={row.avatarId}
                        accessoryId={row.accessoryId}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-display font-bold text-slate-900 truncate">
                          {row.nickname}
                          {isMe && (
                            <span className="ml-2 text-xs font-bold text-blue-600">You</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold">
                          Level {row.level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-600 tabular-nums">
                        <Award className="w-4 h-4 text-amber-500" />
                        {row.badgesCount} badges
                      </span>
                      <span className="font-mono font-bold text-sm text-blue-700 tabular-nums">
                        {scoreForTab(row)} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
