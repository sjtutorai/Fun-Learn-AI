import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Gift, RotateCcw, Sparkles, Star } from 'lucide-react';
import { MATCH_SETS } from '../data/matchBank';
import type { MatchCategorySet } from '../types/game';
import { usePlayer } from '../context/PlayerContext';
import { XP_RULES, computeStarRating } from '../game/xpEngine';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from '../components/CelebrationOverlay';

interface MatchMasterGameProps {
  onExit: () => void;
}

type MatchDifficulty = 'Easy' | 'Medium' | 'Hard';

const PAIR_COUNTS: Record<MatchDifficulty, number> = {
  Easy: 4,
  Medium: 5,
  Hard: 6,
};

function deterministicShuffle<T>(arr: T[], seedOffset: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = (i * 7 + seedOffset * 3) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const MatchMasterGame: React.FC<MatchMasterGameProps> = ({ onExit }) => {
  const { player, recordGameCompletion, openScratchCard } = usePlayer();

  const [selectedSet, setSelectedSet] = useState<MatchCategorySet>(MATCH_SETS[0]);
  const [difficulty, setDifficulty] = useState<MatchDifficulty>('Medium');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'victory'>('setup');

  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ leftId: string; rightId: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [lastFact, setLastFact] = useState<string | null>(null);
  const [seed, setSeed] = useState(1);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const leftBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const startTimeRef = useRef<number>(Date.now());
  const [lines, setLines] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number }[]>([]);

  const activePairs = useMemo(
    () => selectedSet.pairs.slice(0, PAIR_COUNTS[difficulty]),
    [selectedSet, difficulty]
  );

  const rightColumn = useMemo(
    () => deterministicShuffle(activePairs, seed + activePairs.length),
    [activePairs, seed]
  );

  const recomputeLines = () => {
    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const nextLines: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];

    matchedIds.forEach((id) => {
      const lEl = leftBtnRefs.current[id];
      const rEl = rightBtnRefs.current[id];
      if (!lEl || !rEl) return;
      const lRect = lEl.getBoundingClientRect();
      const rRect = rEl.getBoundingClientRect();
      nextLines.push({
        id,
        x1: lRect.right - boardRect.left,
        y1: lRect.top + lRect.height / 2 - boardRect.top,
        x2: rRect.left - boardRect.left,
        y2: rRect.top + rRect.height / 2 - boardRect.top,
      });
    });
    setLines(nextLines);
  };

  useLayoutEffect(() => {
    if (phase === 'playing') {
      recomputeLines();
    }
  }, [matchedIds, phase, rightColumn]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onResize = () => recomputeLines();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [phase, matchedIds]);

  const startBoard = (setChoice: MatchCategorySet = selectedSet, diffChoice: MatchDifficulty = difficulty) => {
    soundEngine.playClick();
    setSelectedSet(setChoice);
    setDifficulty(diffChoice);
    setSelectedLeftId(null);
    setMatchedIds([]);
    setWrongPair(null);
    setMistakes(0);
    setLastFact(null);
    setSeed((s) => s + 1);
    startTimeRef.current = Date.now();
    setPhase('playing');
  };

  const handleRightPick = (rightId: string) => {
    if (!selectedLeftId || matchedIds.includes(rightId)) return;

    if (selectedLeftId === rightId) {
      soundEngine.playCorrect();
      const pair = activePairs.find((p) => p.id === rightId);
      const nextMatched = [...matchedIds, rightId];
      setMatchedIds(nextMatched);
      setSelectedLeftId(null);
      setWrongPair(null);
      if (pair) setLastFact(`${pair.left} → ${pair.right}: ${pair.fact}`);

      if (nextMatched.length === activePairs.length) {
        const durationSec = Math.max(4, Math.round((Date.now() - startTimeRef.current) / 1000));
        const xpEarned = activePairs.length * XP_RULES.MATCH_PAIR + (mistakes === 0 ? 10 : 0);
        window.setTimeout(() => {
          soundEngine.playVictory();
          recordGameCompletion({
            gameId: 'match-master',
            subject: selectedSet.subject,
            score: activePairs.length,
            total: activePairs.length + mistakes,
            xpEarned,
            gemsEarned: 8,
            durationSec,
            unlockScratchCardTitle: `Match Master: ${selectedSet.title}`,
          });
          setPhase('victory');
        }, 450);
      }
    } else {
      soundEngine.playWrong();
      setMistakes((m) => m + 1);
      setWrongPair({ leftId: selectedLeftId, rightId });
      window.setTimeout(() => {
        setWrongPair(null);
        setSelectedLeftId(null);
      }, 650);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-6 animate-fun-pop">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Games</span>
          </button>
          <span className="text-xs font-bold text-orange-600">
            +5 XP per matched pair · +10 Perfect Bonus
          </span>
        </div>

        <div className="card-toy rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Match Master</h1>
              <p className="text-slate-600 mt-1">
                Connect Column A to Column B with glowing lines across 11 exciting topics!
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0">
              {(['Easy', 'Medium', 'Hard'] as MatchDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDifficulty(diff);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    difficulty === diff
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {diff} ({PAIR_COUNTS[diff]} pairs)
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {MATCH_SETS.map((setItem) => {
              const isSelected = selectedSet.id === setItem.id;
              return (
                <button
                  key={setItem.id}
                  type="button"
                  onClick={() => startBoard(setItem, difficulty)}
                  className={`btn-3d rounded-2xl p-4 text-left border-2 transition-all ${
                    isSelected
                      ? 'bg-orange-50 border-orange-400 border-b-4'
                      : 'bg-white border-slate-200 border-b-4 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">{setItem.subject}</span>
                    <span className="text-lg">{setItem.pairs[0].icon}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                    {setItem.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{setItem.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'victory') {
    const totalAttempts = activePairs.length + mistakes;
    const accuracy = Math.round((activePairs.length / Math.max(1, totalAttempts)) * 100);
    const stars = computeStarRating(activePairs.length, totalAttempts);
    const xpEarned = activePairs.length * XP_RULES.MATCH_PAIR + (mistakes === 0 ? 10 : 0);
    const latestCard = player.pendingScratchCards[player.pendingScratchCards.length - 1];

    return (
      <div className="max-w-xl mx-auto animate-fun-pop">
        <ConfettiBurst active={true} reducedMotion={player.audio.reducedMotion} />
        <div className="card-toy rounded-3xl p-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-9 h-9 ${i < stars ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
              />
            ))}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">Board Mastered!</h2>
            <p className="text-slate-600 mt-1">{selectedSet.title} · {difficulty}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-700">Pairs</p>
              <p className="font-display text-2xl font-bold text-emerald-900 tabular-nums">
                {activePairs.length}/{activePairs.length}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-700">Accuracy</p>
              <p className="font-display text-2xl font-bold text-blue-900 tabular-nums">{accuracy}%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700">XP Won</p>
              <p className="font-display text-2xl font-bold text-amber-900 tabular-nums">+{xpEarned}</p>
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
                <span>Scratch Reward!</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="btn-3d rounded-2xl bg-blue-600 border-b-4 border-blue-800 px-5 py-3.5 font-display font-bold text-white"
            >
              More Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING BOARD
  return (
    <div className="card-toy rounded-3xl p-5 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="text-sm font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Topics</span>
          </button>
          <h2 className="font-display text-xl md:text-2xl font-bold text-slate-900">
            {selectedSet.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-bold text-emerald-600 tabular-nums">
            Matched: {matchedIds.length}/{activePairs.length}
          </span>
          <button
            type="button"
            onClick={() => startBoard(selectedSet, difficulty)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-600">
        {selectedLeftId
          ? 'Now tap its matching partner in Column B!'
          : 'Step 1: Tap an item in Column A, then connect it to Column B.'}
      </p>

      {/* Two-Column Interactive Board with Animated SVG Connecting Lines */}
      <div ref={boardRef} className="relative grid grid-cols-2 gap-8 sm:gap-20 md:gap-28 py-2">
        {/* SVG Connecting Lines Layer */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full z-10 overflow-visible"
          aria-hidden="true"
        >
          {lines.map((line) => {
            const midX = (line.x1 + line.x2) / 2;
            const d = `M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`;
            return (
              <g key={line.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.88"
                />
                <circle cx={line.x1} cy={line.y1} r="5.5" fill="#059669" />
                <circle cx={line.x2} cy={line.y2} r="5.5" fill="#059669" />
              </g>
            );
          })}
        </svg>

        {/* Column A */}
        <div className="space-y-3 relative z-20">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 px-1">
            Column A
          </div>
          {activePairs.map((pair) => {
            const isMatched = matchedIds.includes(pair.id);
            const isSelected = selectedLeftId === pair.id;
            const isWrong = wrongPair?.leftId === pair.id;
            return (
              <button
                key={pair.id}
                ref={(el) => {
                  leftBtnRefs.current[pair.id] = el;
                }}
                type="button"
                disabled={isMatched}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedLeftId(pair.id);
                }}
                className={`btn-3d w-full rounded-2xl border-2 px-4 py-3.5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-2 transition-all ${
                  isMatched
                    ? 'bg-emerald-500 text-white border-emerald-700 border-b-4'
                    : isWrong
                    ? 'bg-rose-500 text-white border-rose-700 border-b-4 animate-fun-shake'
                    : isSelected
                    ? 'bg-blue-600 text-white border-blue-800 border-b-4 ring-4 ring-blue-200'
                    : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:border-blue-400'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg shrink-0" aria-hidden="true">
                    {pair.icon}
                  </span>
                  <span className="truncate">{pair.left}</span>
                </span>
                {isMatched && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Column B */}
        <div className="space-y-3 relative z-20">
          <div className="text-xs font-bold uppercase tracking-wider text-orange-600 px-1">
            Column B
          </div>
          {rightColumn.map((pair) => {
            const isMatched = matchedIds.includes(pair.id);
            const isWrong = wrongPair?.rightId === pair.id;
            return (
              <button
                key={pair.id}
                ref={(el) => {
                  rightBtnRefs.current[pair.id] = el;
                }}
                type="button"
                disabled={isMatched}
                onClick={() => handleRightPick(pair.id)}
                className={`btn-3d w-full rounded-2xl border-2 px-4 py-3.5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-2 transition-all ${
                  isMatched
                    ? 'bg-emerald-500 text-white border-emerald-700 border-b-4'
                    : isWrong
                    ? 'bg-rose-500 text-white border-rose-700 border-b-4 animate-fun-shake'
                    : selectedLeftId
                    ? 'bg-amber-50 text-slate-900 border-amber-300 border-b-4 hover:bg-amber-100'
                    : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:border-orange-300'
                }`}
              >
                <span className="truncate">{pair.right}</span>
                {isMatched && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fun Fact Discovery Bar */}
      {lastFact && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 animate-fun-pop">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-900">{lastFact}</p>
        </div>
      )}
    </div>
  );
};
