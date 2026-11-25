import React from 'react';
import {
  Award,
  Calendar,
  ChevronRight,
  Compass,
  Flame,
  Gift,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { ART_ASSETS } from '../data/assets';
import { ACHIEVEMENTS_CATALOG } from '../data/achievements';
import { computeLevelInfo } from '../game/xpEngine';
import type { GameId, NavSection } from '../types/game';
import { AvatarBadge } from '../components/AvatarBadge';
import { soundEngine } from '../utils/soundEngine';

interface HomeViewProps {
  onNavigate: (section: NavSection) => void;
  onLaunchGame: (gameId: GameId) => void;
}

const GAME_CARDS: {
  id: GameId;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  btnColor: string;
}[] = [
  {
    id: 'brain-blast',
    title: 'Brain Blast Quiz',
    subtitle: '8 school subjects, timers, hints & Gemini AI questions',
    tag: '+10 XP / Q',
    image: ART_ASSETS.brainBlast,
    btnColor: 'bg-blue-600 border-blue-800',
  },
  {
    id: 'match-master',
    title: 'Match Master',
    subtitle: 'Connect glowing pairs across 11 fun discovery boards',
    tag: '+5 XP / Pair',
    image: ART_ASSETS.matchMaster,
    btnColor: 'bg-orange-500 border-orange-700',
  },
  {
    id: 'einstein-mystery',
    title: "Einstein's Mystery",
    subtitle: 'Visual riddles, patterns, odd-one-out & logic puzzles',
    tag: '+15 XP / Case',
    image: ART_ASSETS.einsteinMystery,
    btnColor: 'bg-indigo-600 border-indigo-800',
  },
  {
    id: 'word-wizard',
    title: 'Word Wizard',
    subtitle: '7 spelling & word quests in English, Kannada & Hindi',
    tag: '+10 XP / Spell',
    image: ART_ASSETS.wordWizard,
    btnColor: 'bg-emerald-600 border-emerald-800',
  },
  {
    id: 'treasure-hunt',
    title: 'Treasure Hunt',
    subtitle: 'Explore 5 islands, unlock chests & collect magic gems',
    tag: '+25 XP / Quest',
    image: ART_ASSETS.treasureMap,
    btnColor: 'bg-amber-500 border-amber-700',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onLaunchGame }) => {
  const { player, openScratchCard } = usePlayer();
  const levelInfo = computeLevelInfo(player.xp);
  const dailyDoneCount = player.dailyChallenge.completedSteps.length;
  const recentAchievements = ACHIEVEMENTS_CATALOG.filter((a) =>
    player.unlockedAchievements.includes(a.id)
  ).slice(0, 4);

  const topSubjects = Object.entries(player.subjectStats)
    .filter(([, s]) => s.played > 0)
    .sort((a, b) => b[1].xp - a[1].xp)
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fun-pop">
      {/* Hero Explorer Welcome Banner */}
      <section className="relative rounded-3xl overflow-hidden card-toy border-0">
        <div className="relative min-h-[260px] md:min-h-[300px] flex items-center">
          <img
            src={ART_ASSETS.heroExplorer}
            alt="Young explorer flying an airship over floating islands of science and books"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F2454]/95 via-[#173573]/85 to-[#173573]/55 sm:to-[#173573]/15" />

          <div className="relative z-10 p-6 md:p-9 max-w-xl space-y-4 text-white">
            <div className="flex items-center gap-3.5">
              <AvatarBadge
                avatarId={player.avatarId}
                accessoryId={player.accessoryId}
                size="md"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Think Smart · Play Hard · Learn More
                </p>
                <h1 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
                  Welcome back, {player.nickname}!
                </h1>
              </div>
            </div>

            {/* Level & XP Progress Meter */}
            <div className="rounded-2xl bg-white/14 border border-white/20 p-3.5 space-y-2 max-w-md">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>
                  Level {levelInfo.level}: {levelInfo.title}
                </span>
                <span className="font-mono text-amber-300 tabular-nums">
                  {player.xp} XP
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-sky-100">
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-300" />
                  {player.streak}-day streak
                </span>
                <span className="tabular-nums">
                  {levelInfo.xpRequiredForNext > 0
                    ? `${levelInfo.xpRequiredForNext} XP to Level ${levelInfo.level + 1}`
                    : 'Max Level Champion!'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onLaunchGame('brain-blast');
                }}
                className="btn-3d rounded-2xl bg-amber-400 text-slate-950 border-b-4 border-amber-600 px-6 py-3 font-display font-bold text-base inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Zap className="w-5 h-5" />
                <span>Play Brain Blast</span>
              </button>
              {player.pendingScratchCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    openScratchCard(player.pendingScratchCards[0]);
                  }}
                  className="btn-3d rounded-2xl bg-white/95 text-slate-900 border-b-4 border-slate-300 px-5 py-3 font-display font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <Gift className="w-4 h-4 text-orange-500" />
                  <span>{player.pendingScratchCards.length} Scratch Card Ready</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Daily Challenge + Featured Game Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Daily Challenge Card */}
        <div className="card-toy rounded-3xl p-6 flex flex-col justify-between gap-4 bg-gradient-to-br from-amber-50 via-white to-orange-50/70">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
                <Calendar className="w-4 h-4" />
                <span>Today’s Adventure · +30 XP</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Daily 5-in-1 Challenge
              </h2>
              <p className="text-sm text-slate-600">
                Complete 1 quiz, 1 match board, 1 visual riddle, 1 word spell, and 1 logic puzzle!
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white font-display font-bold text-xl flex flex-col items-center justify-center shadow-md shrink-0 tabular-nums">
              <span>{dailyDoneCount}/5</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-full h-3 rounded-full bg-orange-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${(dailyDoneCount / 5) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('daily');
              }}
              className="btn-3d w-full sm:w-auto rounded-2xl bg-orange-500 border-b-4 border-orange-700 px-5 py-2.5 font-display font-bold text-white text-sm inline-flex items-center justify-center gap-1.5"
            >
              <span>{player.dailyChallenge.completed ? 'Review Today’s Win' : 'Play Daily Challenge'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Signature Game: Einstein's Mystery */}
        <div className="card-toy rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-5 items-stretch">
          <div className="sm:col-span-2 relative min-h-[150px] bg-indigo-950">
            <img
              src={ART_ASSETS.einsteinMystery}
              alt="Owl detective with brass spectacles inspecting floating puzzle gears"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="sm:col-span-3 p-6 flex flex-col justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Signature Game
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
                Einstein&apos;s Mystery
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Test your observation and logical superpowers with visual puzzles, number sequences, and tricky riddles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onLaunchGame('einstein-mystery');
              }}
              className="btn-3d self-start rounded-2xl bg-indigo-600 border-b-4 border-indigo-800 px-5 py-2.5 font-display font-bold text-white text-sm inline-flex items-center gap-1.5"
            >
              <span>Solve Mysteries</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* All 5 Playable Game Cards */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
              Choose Your Game World
            </h2>
            <p className="text-sm text-slate-600">
              Every game awards XP, gems, badges, and a Scratch &amp; Win surprise card!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('games')}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            Offline Packs &amp; All Games →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {GAME_CARDS.map((card) => (
            <div
              key={card.id}
              className="card-toy card-toy-hover rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={card.image}
                    alt={`${card.title} 3D illustration`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xs font-bold text-slate-500">{card.tag}</p>
                  <h3 className="font-display text-lg font-bold text-slate-900 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.subtitle}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onLaunchGame(card.id);
                  }}
                  className={`btn-3d w-full rounded-2xl border-b-4 py-2.5 font-display font-bold text-sm text-white ${card.btnColor}`}
                >
                  Play Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Summary: Recent Achievements & Learning Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-toy rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Recent Achievements</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('achievements')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View All ({player.unlockedAchievements.length}/{ACHIEVEMENTS_CATALOG.length})
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentAchievements.map((badge) => (
              <div
                key={badge.id}
                className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-3"
              >
                <div
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: badge.accent }}
                >
                  <Award className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-slate-900 truncate">
                    {badge.name}
                  </p>
                  <p className="text-xs text-slate-600 truncate">{badge.conditionText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-toy rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>Learning Progress Summary</span>
            </h2>
            <span className="text-xs font-bold text-slate-500 tabular-nums">
              {player.gamesCompleted} games played
            </span>
          </div>
          <div className="space-y-3">
            {topSubjects.map(([sub, stat]) => {
              const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
              return (
                <div key={sub} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{sub}</span>
                    <span className="text-slate-500 tabular-nums">
                      {pct}% accuracy · {stat.xp} XP
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                      style={{ width: `${Math.max(12, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
