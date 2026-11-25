import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { QUIZ_BANK } from '../data/quizBank';
import { MATCH_SETS } from '../data/matchBank';
import { EINSTEIN_PUZZLES } from '../data/einsteinBank';
import { WORD_CHALLENGES } from '../data/wordBank';
import { getLocalDateKey } from '../game/xpEngine';
import { VisualPuzzleIcon } from '../components/VisualPuzzleIcon';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from '../components/CelebrationOverlay';

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const DailyChallengeView: React.FC = () => {
  const { player, markDailyStepComplete, completeDailyChallenge, openScratchCard } = usePlayer();
  const todayKey = getLocalDateKey();
  const daySeed = Number(todayKey.replace(/-/g, '')) % 100;

  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [activeStep, setActiveStep] = useState<number>(() => {
    const firstIncomplete = [0, 1, 2, 3, 4].find(
      (i) => !player.dailyChallenge.completedSteps.includes(i)
    );
    return firstIncomplete ?? 0;
  });

  // Step-specific interactive state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [matchLeft, setMatchLeft] = useState<string | null>(null);
  const [matchedMini, setMatchedMini] = useState<string[]>([]);

  useEffect(() => {
    const interval = window.setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Deterministic daily 5-stage bundle derived from local calendar date
  const bundle = useMemo(() => {
    const quiz = QUIZ_BANK[daySeed % QUIZ_BANK.length];
    const matchSet = MATCH_SETS[daySeed % MATCH_SETS.length];
    const miniPairs = matchSet.pairs.slice(0, 3);
    const visualList = EINSTEIN_PUZZLES.filter((p) => p.visualItems && p.visualItems.length > 0);
    const visual = visualList[daySeed % visualList.length];
    const wordOptionsList = WORD_CHALLENGES.filter((w) => w.options && w.options.length > 0);
    const word = wordOptionsList[daySeed % wordOptionsList.length];
    const logicList = EINSTEIN_PUZZLES.filter((p) => p.category === 'logical' || p.category === 'pattern');
    const logic = logicList[daySeed % logicList.length];

    return { quiz, matchSet, miniPairs, visual, word, logic };
  }, [daySeed]);

  const stepLabels = [
    '1. Quiz Question',
    '2. Mini Match',
    '3. Visual Reasoning',
    '4. Word Challenge',
    '5. Logical Reasoning',
  ];

  const finishStep = (stepIdx: number) => {
    markDailyStepComplete(stepIdx);
    const completedAfter = new Set([...player.dailyChallenge.completedSteps, stepIdx]);
    if (completedAfter.size >= 5) {
      soundEngine.playVictory();
      completeDailyChallenge();
    } else {
      const next = [0, 1, 2, 3, 4].find((i) => !completedAfter.has(i));
      if (typeof next === 'number') {
        setActiveStep(next);
        setSelectedChoice(null);
      }
    }
  };

  const handleChoiceSubmit = (choice: string, correctAnswer: string) => {
    if (selectedChoice !== null) return;
    setSelectedChoice(choice);
    if (choice === correctAnswer) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }
  };

  const handleMiniMatchRight = (pairId: string) => {
    if (!matchLeft || matchedMini.includes(pairId)) return;
    if (matchLeft === pairId) {
      soundEngine.playCorrect();
      const next = [...matchedMini, pairId];
      setMatchedMini(next);
      setMatchLeft(null);
      if (next.length === bundle.miniPairs.length) {
        window.setTimeout(() => finishStep(1), 500);
      }
    } else {
      soundEngine.playWrong();
      setMatchLeft(null);
    }
  };

  const dailyCard = player.pendingScratchCards.find(
    (c) => c.challengeInstanceId === `daily-${todayKey}`
  );

  return (
    <div className="space-y-6 animate-fun-pop">
      <ConfettiBurst
        active={player.dailyChallenge.completed}
        reducedMotion={player.audio.reducedMotion}
      />

      {/* Daily Header Card */}
      <div className="card-toy rounded-3xl p-6 md:p-7 bg-gradient-to-r from-amber-50 via-white to-sky-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
            <Calendar className="w-4 h-4" />
            <span>Daily Challenge · {todayKey}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            5-Stage Brain Adventure
          </h1>
          <p className="text-sm text-slate-600">
            Complete all 5 stages today for +30 XP, +15 Gems, a Streak Boost, and a Scratch &amp; Win card!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase text-slate-500">Next Challenge</p>
            <p className="font-mono text-base font-bold text-slate-900 tabular-nums inline-flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-600" />
              {countdown}
            </p>
          </div>
          <div className="rounded-2xl bg-orange-500 text-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-[11px] font-bold uppercase text-orange-100">Streak</p>
            <p className="font-display text-lg font-bold tabular-nums inline-flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {player.streak} Days
            </p>
          </div>
        </div>
      </div>

      {/* 5-Stage Progress Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {stepLabels.map((label, i) => {
          const done = player.dailyChallenge.completedSteps.includes(i);
          const isCurrent = activeStep === i && !player.dailyChallenge.completed;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveStep(i);
                setSelectedChoice(null);
              }}
              className={`rounded-2xl p-3 text-left border-2 transition-all ${
                done
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                  : isCurrent
                  ? 'bg-blue-600 border-blue-800 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold truncate">{label}</span>
                {done && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Completed Victory Banner */}
      {player.dailyChallenge.completed ? (
        <div className="card-toy rounded-3xl p-8 text-center space-y-5 bg-gradient-to-b from-emerald-50 to-white">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg">
            <Sparkles className="w-9 h-9" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Daily Challenge Complete!
            </h2>
            <p className="text-slate-600 mt-1">
              You earned +30 XP, +15 Gems, and kept your {player.streak}-day streak alive!
            </p>
          </div>
          {dailyCard ? (
            <button
              type="button"
              onClick={() => openScratchCard(dailyCard)}
              className="btn-3d rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 border-b-4 border-orange-700 px-6 py-3.5 font-display font-bold text-white inline-flex items-center gap-2"
            >
              <Gift className="w-5 h-5" />
              <span>Scratch Today&apos;s Reward Card!</span>
            </button>
          ) : (
            <p className="text-sm font-bold text-emerald-700">
              Come back in {countdown} for tomorrow’s brand-new 5-stage challenge!
            </p>
          )}
        </div>
      ) : (
        <div className="card-toy rounded-3xl p-6 md:p-8 space-y-6">
          {/* STAGE 0: QUIZ QUESTION */}
          {activeStep === 0 && (
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Stage 1 of 5 · Quiz Question ({bundle.quiz.subject})
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {bundle.quiz.question}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bundle.quiz.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={selectedChoice !== null}
                    onClick={() => handleChoiceSubmit(opt, bundle.quiz.correctAnswer)}
                    className={`btn-3d rounded-2xl border-2 px-5 py-4 text-left font-bold ${
                      selectedChoice !== null && opt === bundle.quiz.correctAnswer
                        ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                        : selectedChoice === opt
                        ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                        : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:bg-blue-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {selectedChoice !== null && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {selectedChoice === bundle.quiz.correctAnswer ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-orange-500 shrink-0" />
                    )}
                    <p className="text-sm text-slate-700">{bundle.quiz.explanation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => finishStep(0)}
                    className="btn-3d rounded-xl bg-blue-600 border-b-4 border-blue-800 px-5 py-2.5 font-display font-bold text-white text-sm shrink-0"
                  >
                    Complete Stage 1
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 1: MINI MATCHING PUZZLE */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Stage 2 of 5 · Mini Match ({bundle.matchSet.title})
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Connect all 3 matching pairs!
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  {bundle.miniPairs.map((pair) => {
                    const done = matchedMini.includes(pair.id);
                    return (
                      <button
                        key={pair.id}
                        type="button"
                        disabled={done}
                        onClick={() => {
                          soundEngine.playClick();
                          setMatchLeft(pair.id);
                        }}
                        className={`btn-3d w-full rounded-2xl border-2 px-4 py-3.5 text-left font-bold ${
                          done
                            ? 'bg-emerald-500 text-white border-emerald-700 border-b-4'
                            : matchLeft === pair.id
                            ? 'bg-blue-600 text-white border-blue-800 border-b-4'
                            : 'bg-white text-slate-900 border-slate-200 border-b-4'
                        }`}
                      >
                        {pair.icon} {pair.left}
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2.5">
                  {[...bundle.miniPairs].reverse().map((pair) => {
                    const done = matchedMini.includes(pair.id);
                    return (
                      <button
                        key={pair.id}
                        type="button"
                        disabled={done}
                        onClick={() => handleMiniMatchRight(pair.id)}
                        className={`btn-3d w-full rounded-2xl border-2 px-4 py-3.5 text-left font-bold ${
                          done
                            ? 'bg-emerald-500 text-white border-emerald-700 border-b-4'
                            : 'bg-amber-50 text-slate-900 border-amber-300 border-b-4 hover:bg-amber-100'
                        }`}
                      >
                        {pair.right}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: VISUAL REASONING */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Stage 3 of 5 · Visual Reasoning
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {bundle.visual.question}
              </h2>
              {bundle.visual.visualItems && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {bundle.visual.visualItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={selectedChoice !== null}
                      onClick={() => handleChoiceSubmit(item.label, bundle.visual.correctAnswer)}
                      className={`btn-3d rounded-2xl border-2 p-4 flex flex-col items-center gap-2 ${
                        selectedChoice !== null && item.label === bundle.visual.correctAnswer
                          ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                          : selectedChoice === item.label
                          ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                          : 'bg-slate-50 text-slate-900 border-slate-200 border-b-4 hover:bg-indigo-50'
                      }`}
                    >
                      <VisualPuzzleIcon item={item} />
                      <span className="font-display font-bold text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedChoice !== null && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-slate-700">{bundle.visual.explanation}</p>
                  <button
                    type="button"
                    onClick={() => finishStep(2)}
                    className="btn-3d rounded-xl bg-indigo-600 border-b-4 border-indigo-800 px-5 py-2.5 font-display font-bold text-white text-sm shrink-0"
                  >
                    Complete Stage 3
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: WORD CHALLENGE */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Stage 4 of 5 · Word Challenge ({bundle.word.language})
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {bundle.word.prompt} {bundle.word.word ? `"${bundle.word.word}"` : ''}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(bundle.word.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={selectedChoice !== null}
                    onClick={() => handleChoiceSubmit(opt, bundle.word.correctAnswer)}
                    className={`btn-3d rounded-2xl border-2 px-5 py-4 text-left font-bold ${
                      selectedChoice !== null && opt === bundle.word.correctAnswer
                        ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                        : selectedChoice === opt
                        ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                        : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:bg-emerald-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {selectedChoice !== null && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-slate-700">{bundle.word.explanation}</p>
                  <button
                    type="button"
                    onClick={() => finishStep(3)}
                    className="btn-3d rounded-xl bg-emerald-600 border-b-4 border-emerald-800 px-5 py-2.5 font-display font-bold text-white text-sm shrink-0"
                  >
                    Complete Stage 4
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 4: LOGICAL REASONING */}
          {activeStep === 4 && (
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Stage 5 of 5 · Logical Reasoning
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {bundle.logic.question}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {bundle.logic.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={selectedChoice !== null}
                    onClick={() => handleChoiceSubmit(opt, bundle.logic.correctAnswer)}
                    className={`btn-3d rounded-2xl border-2 px-5 py-4 font-display text-lg font-bold ${
                      selectedChoice !== null && opt === bundle.logic.correctAnswer
                        ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                        : selectedChoice === opt
                        ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                        : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:bg-purple-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {selectedChoice !== null && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-slate-700">{bundle.logic.explanation}</p>
                  <button
                    type="button"
                    onClick={() => finishStep(4)}
                    className="btn-3d rounded-xl bg-amber-500 border-b-4 border-amber-700 px-6 py-2.5 font-display font-bold text-white text-sm shrink-0"
                  >
                    Claim +30 XP Daily Reward!
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
