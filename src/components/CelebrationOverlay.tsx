import React, { useEffect } from 'react';
import { Award, CloudCheck, Hand, Sparkles, Trophy, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const CONFETTI_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444'];

export const ConfettiBurst: React.FC<{ active: boolean; reducedMotion?: boolean }> = ({
  active,
  reducedMotion = false,
}) => {
  if (!active || reducedMotion) return null;
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${(i * 3.7) % 100}%`,
    delay: `${(i % 7) * 80}ms`,
    duration: `${1600 + (i % 5) * 320}ms`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 8 + (i % 3) * 4,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-16px',
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 0.65}px`,
            borderRadius: '3px',
            backgroundColor: p.color,
            animation: `fun-confetti-fall ${p.duration} ease-in ${p.delay} forwards`,
          }}
        />
      ))}
    </div>
  );
};

export const CelebrationOverlay: React.FC = () => {
  const { celebration, dismissCelebration, player } = usePlayer();

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(dismissCelebration, 5200);
    return () => window.clearTimeout(timer);
  }, [celebration, dismissCelebration]);

  if (!celebration) return null;

  const isLevelUp = celebration.kind === 'level-up';
  const Icon =
    celebration.kind === 'level-up'
      ? Trophy
      : celebration.kind === 'achievement'
      ? Award
      : celebration.kind === 'sync'
      ? CloudCheck
      : Hand;

  const gradient =
    celebration.kind === 'level-up'
      ? 'from-amber-400 via-orange-500 to-pink-500'
      : celebration.kind === 'achievement'
      ? 'from-indigo-500 via-blue-600 to-cyan-500'
      : celebration.kind === 'sync'
      ? 'from-emerald-500 to-teal-600'
      : 'from-teal-400 to-emerald-500';

  return (
    <>
      <ConfettiBurst active={isLevelUp || celebration.kind === 'achievement'} reducedMotion={player.audio.reducedMotion} />
      <div
        role="status"
        aria-live="polite"
        className="fixed top-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] animate-fun-pop"
      >
        <div className={`rounded-3xl bg-gradient-to-r ${gradient} p-1 shadow-2xl`}>
          <div className="bg-white rounded-[21px] p-4 flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0 shadow-md`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Celebration</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 leading-tight mt-0.5">
                {celebration.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{celebration.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={dismissCelebration}
              aria-label="Close celebration notification"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
