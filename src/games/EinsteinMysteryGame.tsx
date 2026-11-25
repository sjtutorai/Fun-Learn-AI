import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Gift,
  Lightbulb,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { EINSTEIN_PUZZLES } from '../data/einsteinBank';
import type { EinsteinCategory } from '../types/game';
import { VisualPuzzleIcon } from '../components/VisualPuzzleIcon';
import { usePlayer } from '../context/PlayerContext';
import { computeStarRating } from '../game/xpEngine';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from '../components/CelebrationOverlay';

const CATEGORIES: { id: EinsteinCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Mysteries' },
  { id: 'odd-one-out', label: 'Odd One Out' },
  { id: 'visual-reasoning', label: 'Visual Reasoning' },
  { id: 'pattern', label: 'Pattern Sequence' },
  { id: 'logical', label: 'Logical Riddles' },
  { id: 'picture-puzzle', label: 'Picture Puzzles' },
];

export const EinsteinMysteryGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { player, recordGameCompletion, openScratchCard } = usePlayer();
  const [category, setCategory] = useState<EinsteinCategory | 'all'>('all');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [finished, setFinished] = useState(false);
  const startRef = useRef<number>(Date.now());

  const deck = useMemo(() => {
    const filtered =
      category === 'all'
        ? EINSTEIN_PUZZLES
        : EINSTEIN_PUZZLES.filter((p) => p.category === category);
    return filtered.slice(0, 6);
  }, [category]);

  const puzzle = deck[idx];

  const resetDeck = (nextCat: EinsteinCategory | 'all') => {
    soundEngine.playClick();
    setCategory(nextCat);
    setIdx(0);
    setSelected(null);
    setShowHint(false);
    setSolvedCount(0);
    setXpEarned(0);
    setFinished(false);
    startRef.current = Date.now();
  };

  const handleChoose = (opt: string) => {
    if (selected !== null || !puzzle) return;
    setSelected(opt);
    if (opt === puzzle.correctAnswer) {
      soundEngine.playCorrect();
      setSolvedCount((c) => c + 1);
      setXpEarned((x) => x + puzzle.points);
    } else {
      soundEngine.playWrong();
    }
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (idx + 1 < deck.length) {
      setIdx((i) => i + 1);
      setSelected(null);
      setShowHint(false);
    } else {
      const durationSec = Math.max(5, Math.round((Date.now() - startRef.current) / 1000));
      soundEngine.playVictory();
      recordGameCompletion({
        gameId: 'einstein-mystery',
        subject: 'Logical Reasoning',
        score: solvedCount,
        total: deck.length,
        xpEarned,
        gemsEarned: Math.max(6, solvedCount * 4),
        durationSec,
        einsteinDelta: solvedCount,
        unlockScratchCardTitle: "Einstein's Mystery Solved!",
      });
      setFinished(true);
    }
  };

  if (finished) {
    const stars = computeStarRating(solvedCount, deck.length);
    const latestCard = player.pendingScratchCards[player.pendingScratchCards.length - 1];

    return (
      <div className="max-w-xl mx-auto animate-fun-pop">
        <ConfettiBurst active={true} reducedMotion={player.audio.reducedMotion} />
        <div className="card-toy rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mx-auto flex items-center justify-center shadow-lg">
            <Award className="w-9 h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-8 h-8 ${i < stars ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
              />
            ))}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Mystery Case Closed!
            </h2>
            <p className="text-slate-600 mt-1">
              You cracked {solvedCount} of {deck.length} Einstein challenges and earned +{xpEarned} XP!
            </p>
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
              onClick={() => resetDeck(category)}
              className="btn-3d rounded-2xl bg-indigo-600 border-b-4 border-indigo-800 px-6 py-3.5 font-display font-bold text-white"
            >
              Solve More
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = selected !== null && puzzle && selected === puzzle.correctAnswer;
  const isWrong = selected !== null && puzzle && selected !== puzzle.correctAnswer;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </button>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-2xl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => resetDeck(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                category === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {puzzle && (
        <div
          className={`rounded-3xl p-5 md:p-8 space-y-6 transition-colors duration-300 ${
            isCorrect
              ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white'
              : isWrong
              ? 'bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-orange-200 animate-fun-shake'
              : 'card-toy'
          }`}
        >
          <ConfettiBurst active={Boolean(isCorrect)} reducedMotion={player.audio.reducedMotion} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
              <span className={isCorrect ? 'text-emerald-100' : 'text-indigo-600'}>
                Case {idx + 1} of {deck.length} · {puzzle.title}
              </span>
              {puzzle.isEinsteinChallenge && (
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  Einstein Challenge
                </span>
              )}
            </div>
            <span className={`font-mono text-sm font-bold tabular-nums ${isCorrect ? 'text-white' : 'text-amber-600'}`}>
              +{puzzle.points} XP
            </span>
          </div>

          <h2 className={`font-display text-2xl md:text-3xl font-bold ${isCorrect ? 'text-white' : 'text-slate-900'}`}>
            {puzzle.question}
          </h2>

          {/* Visual Object Stage (Odd One Out / Visual Reasoning / Picture Puzzles) */}
          {puzzle.visualItems && (
            <div
              className={`grid gap-4 ${
                puzzle.visualItems.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {puzzle.visualItems.map((item) => {
                const chosen = selected === item.label;
                const isAnswer = item.label === puzzle.correctAnswer;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={selected !== null}
                    onClick={() => handleChoose(item.label)}
                    className={`btn-3d rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-2.5 transition-all ${
                      selected !== null && isAnswer
                        ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                        : selected !== null && chosen
                        ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                        : 'bg-slate-50 text-slate-900 border-slate-200 border-b-4 hover:border-indigo-400 hover:bg-indigo-50/50'
                    }`}
                  >
                    <VisualPuzzleIcon item={item} />
                    <span className="font-display text-base font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pattern Sequence Tiles */}
          {puzzle.sequence && (
            <div className="flex flex-wrap items-center justify-center gap-3 py-3">
              {puzzle.sequence.map((token, i) => (
                <div
                  key={`${token}-${i}`}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-display text-2xl sm:text-3xl font-bold shadow-md border-2 ${
                    token === '?'
                      ? 'bg-amber-400 text-slate-900 border-amber-600'
                      : 'bg-indigo-600 text-white border-indigo-800'
                  }`}
                >
                  {token}
                </div>
              ))}
            </div>
          )}

          {/* Text Answer Options (for Pattern & Logical Puzzles without clickable visual cards) */}
          {!puzzle.visualItems && (
            <div className="grid grid-cols-2 gap-3.5">
              {puzzle.options.map((opt) => {
                const isAnswer = opt === puzzle.correctAnswer;
                const isChosen = selected === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={selected !== null}
                    onClick={() => handleChoose(opt)}
                    className={`btn-3d rounded-2xl border-2 px-5 py-4 font-display text-lg font-bold transition-all ${
                      selected !== null && isAnswer
                        ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                        : selected !== null && isChosen
                        ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                        : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Hint */}
          {!selected && (
            <div>
              {!showHint ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowHint(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Detective Clue</span>
                </button>
              ) : (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900">
                  Clue: {puzzle.hint}
                </div>
              )}
            </div>
          )}

          {/* Explanation Panel */}
          {selected !== null && (
            <div className="rounded-2xl bg-white text-slate-900 p-5 border-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fun-pop">
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-9 h-9 text-orange-500 shrink-0" />
                )}
                <div>
                  <h3 className={`font-display text-xl font-bold ${isCorrect ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {isCorrect ? 'GENIUS OBSERVATION!' : `GOOD TRY! Answer: ${puzzle.correctAnswer}`}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{puzzle.explanation}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="btn-3d rounded-2xl bg-indigo-600 border-b-4 border-indigo-800 px-6 py-3 font-display font-bold text-white whitespace-nowrap shrink-0"
              >
                {idx + 1 < deck.length ? 'Next Mystery' : 'Finish Investigation'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
