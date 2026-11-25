import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Gem,
  Gift,
  Lock,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { ADVENTURE_ZONES } from '../data/treasureBank';
import { ART_ASSETS } from '../data/assets';
import type { AdventureMission, AdventureZone } from '../types/game';
import { usePlayer } from '../context/PlayerContext';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from '../components/CelebrationOverlay';

export const TreasureHuntGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { player, recordGameCompletion, openScratchCard } = usePlayer();
  const [activeZone, setActiveZone] = useState<AdventureZone>(ADVENTURE_ZONES[0]);
  const [activeMission, setActiveMission] = useState<AdventureMission | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [chestOpen, setChestOpen] = useState(false);
  const startRef = useRef<number>(Date.now());

  const completedSet = useMemo(() => new Set(player.completedMissions), [player.completedMissions]);

  const isZoneUnlocked = (zoneIndex: number): boolean => {
    if (zoneIndex === 0) return true;
    // Unlock next island once at least 1 mission from the previous island is completed
    const prevZone = ADVENTURE_ZONES[zoneIndex - 1];
    return prevZone.missions.some((m) => completedSet.has(m.id));
  };

  const launchMission = (mission: AdventureMission) => {
    soundEngine.playClick();
    setActiveMission(mission);
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setChestOpen(false);
    startRef.current = Date.now();
  };

  const handleAnswer = (opt: string) => {
    if (!activeMission || selected !== null) return;
    setSelected(opt);
    const q = activeMission.questions[qIdx];
    if (opt === q.correctAnswer) {
      soundEngine.playCorrect();
      setScore((s) => s + 1);
    } else {
      soundEngine.playWrong();
    }
  };

  const handleNextMissionStep = () => {
    if (!activeMission) return;
    soundEngine.playClick();
    if (qIdx + 1 < activeMission.questions.length) {
      setQIdx((i) => i + 1);
      setSelected(null);
    } else {
      const durationSec = Math.max(5, Math.round((Date.now() - startRef.current) / 1000));
      soundEngine.playTreasure();
      setChestOpen(true);
      recordGameCompletion({
        gameId: 'treasure-hunt',
        subject: activeZone.subject,
        score,
        total: activeMission.questions.length,
        xpEarned: activeMission.xpReward,
        gemsEarned: activeMission.gemReward,
        durationSec,
        completedMissionId: activeMission.id,
        unlockScratchCardTitle: `Treasure Chest: ${activeMission.title}`,
      });
    }
  };

  // MISSION PLAY & TREASURE CHEST OPENING VIEW
  if (activeMission) {
    if (chestOpen) {
      const latestCard = player.pendingScratchCards[player.pendingScratchCards.length - 1];
      return (
        <div className="max-w-xl mx-auto animate-fun-pop">
          <ConfettiBurst active={true} reducedMotion={player.audio.reducedMotion} />
          <div className="card-toy rounded-3xl p-8 text-center space-y-6 bg-gradient-to-b from-amber-50 via-white to-sky-50">
            {/* Animated Golden Treasure Chest SVG */}
            <div className="w-28 h-28 mx-auto animate-fun-float">
              <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
                <circle cx="60" cy="44" r="38" fill="#FDE047" opacity="0.35" />
                {/* Open lid */}
                <path d="M18 52 L28 24 L92 24 L102 52 Z" fill="#B45309" stroke="#78350F" strokeWidth="4" />
                <rect x="24" y="34" width="72" height="8" fill="#FACC15" />
                {/* Glowing gems spilling out */}
                <polygon points="48,54 56,36 64,54" fill="#38BDF8" />
                <polygon points="62,54 72,38 82,54" fill="#EC4899" />
                <polygon points="36,54 44,40 52,54" fill="#34D399" />
                {/* Chest Base */}
                <rect x="18" y="54" width="84" height="44" rx="8" fill="#D97706" stroke="#78350F" strokeWidth="4" />
                <rect x="18" y="70" width="84" height="10" fill="#FACC15" />
                <rect x="52" y="64" width="16" height="22" rx="4" fill="#FDE047" stroke="#92400E" strokeWidth="3" />
              </svg>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Treasure Chest Unlocked!
              </span>
              <h2 className="font-display text-3xl font-bold text-slate-900 mt-1">
                {activeMission.title}
              </h2>
              <p className="text-slate-600 mt-1">
                You discovered +{activeMission.xpReward} XP and +{activeMission.gemReward} Magic Gems!
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="rounded-2xl bg-amber-100 px-5 py-3 font-display font-bold text-amber-900">
                +{activeMission.xpReward} XP
              </div>
              <div className="rounded-2xl bg-emerald-100 px-5 py-3 font-display font-bold text-emerald-900 inline-flex items-center gap-1.5">
                <Gem className="w-5 h-5 text-emerald-600" />
                +{activeMission.gemReward} Gems
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {latestCard && (
                <button
                  type="button"
                  onClick={() => openScratchCard(latestCard)}
                  className="btn-3d flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 border-b-4 border-orange-700 px-5 py-3.5 font-display font-bold text-white flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  <span>Open Bonus Scratch Card</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveMission(null)}
                className="btn-3d rounded-2xl bg-blue-600 border-b-4 border-blue-800 px-6 py-3.5 font-display font-bold text-white"
              >
                Return to World Map
              </button>
            </div>
          </div>
        </div>
      );
    }

    const q = activeMission.questions[qIdx];
    const isCorrect = selected !== null && selected === q.correctAnswer;

    return (
      <div className="card-toy rounded-3xl p-6 md:p-8 space-y-6 animate-fun-pop">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveMission(null)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>World Map</span>
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {activeZone.name} · Challenge {qIdx + 1} of {activeMission.questions.length}
          </span>
        </div>

        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900">{q.question}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {q.options.map((opt) => {
            const isAnswer = opt === q.correctAnswer;
            const isChosen = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={selected !== null}
                onClick={() => handleAnswer(opt)}
                className={`btn-3d rounded-2xl border-2 px-5 py-4 text-left font-display text-lg font-bold transition-all ${
                  selected !== null && isAnswer
                    ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                    : selected !== null && isChosen
                    ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                    : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-orange-500 shrink-0" />
              )}
              <div>
                <p className={`font-display font-bold text-lg ${isCorrect ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {isCorrect ? 'Path Unlocked!' : `Good Try! Correct: ${q.correctAnswer}`}
                </p>
                <p className="text-sm text-slate-600">{q.explanation}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNextMissionStep}
              className="btn-3d rounded-2xl bg-amber-500 border-b-4 border-amber-700 px-6 py-3 font-display font-bold text-white whitespace-nowrap shrink-0"
            >
              {qIdx + 1 < activeMission.questions.length ? 'Next Clue' : 'Open Treasure Chest!'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // WORLD MAP VIEW
  const totalMissions = ADVENTURE_ZONES.reduce((sum, z) => sum + z.missions.length, 0);

  return (
    <div className="space-y-6 animate-fun-pop">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </button>

        <div className="flex items-center gap-4 text-sm font-bold text-slate-700 tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600" />
            Missions: {player.completedMissions.length}/{totalMissions}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <Gem className="w-4 h-4 text-emerald-500" />
            {player.gems} Gems
          </span>
        </div>
      </div>

      {/* Interactive 3D Cartoon World Map */}
      <div className="card-toy rounded-3xl overflow-hidden">
        <div className="relative aspect-[16/9] w-full bg-sky-200 overflow-hidden">
          <img
            src={ART_ASSETS.treasureMap}
            alt="FUNLEARN AI Treasure Hunt Adventure World Map with 5 Islands"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-slate-900/15" />

          {/* Interactive Island Portals Positioned Over Each 3D Island */}
          {ADVENTURE_ZONES.map((zone, zIdx) => {
            const unlocked = isZoneUnlocked(zIdx);
            const doneCount = zone.missions.filter((m) => completedSet.has(m.id)).length;
            const isSelected = activeZone.id === zone.id;

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => {
                  if (!unlocked) return;
                  soundEngine.playClick();
                  setActiveZone(zone);
                }}
                style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
                aria-label={`${zone.name} — ${unlocked ? `${doneCount} of ${zone.missions.length} missions completed` : 'Locked'}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 font-display text-xs sm:text-sm font-bold shadow-xl border-2 transition-transform whitespace-nowrap ${
                  !unlocked
                    ? 'bg-slate-800/85 text-slate-300 border-slate-600 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-400 text-slate-900 border-white scale-110 ring-4 ring-amber-300/60'
                    : 'bg-white/95 text-slate-900 border-white hover:scale-105'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {!unlocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : doneCount === zone.missions.length ? (
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>{zone.name}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Island Mission Deck */}
        <div className="p-6 md:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Selected Island · {activeZone.subject}
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900">{activeZone.name}</h2>
              <p className="text-sm text-slate-600">{activeZone.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeZone.missions.map((mission) => {
              const done = completedSet.has(mission.id);
              return (
                <div
                  key={mission.id}
                  className={`rounded-2xl border-2 p-4 flex flex-col justify-between gap-4 ${
                    done ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-bold">
                      <span className="text-slate-500">{mission.difficulty}</span>
                      <span className="text-amber-600">
                        +{mission.xpReward} XP · +{mission.gemReward} Gems
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                      {mission.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">{mission.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => launchMission(mission)}
                    className={`btn-3d w-full rounded-xl py-2.5 font-display font-bold text-sm border-b-4 ${
                      done
                        ? 'bg-emerald-500 text-white border-emerald-700'
                        : 'bg-blue-600 text-white border-blue-800'
                    }`}
                  >
                    {done ? 'Replay Mission' : 'Start Mission'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
