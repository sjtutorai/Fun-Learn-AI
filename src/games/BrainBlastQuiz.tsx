import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Gift,
  Lightbulb,
  Sparkles,
  Star,
  Wand2,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { QUIZ_BANK, SUBJECT_CHAPTERS, getQuizQuestionsForConfig } from '../data/quizBank';
import { OFFLINE_LEARNING_PACKS } from '../data/learningPacks';
import type { Difficulty, QuizQuestion, Subject } from '../types/game';
import { usePlayer } from '../context/PlayerContext';
import { computeStarRating, XP_RULES } from '../game/xpEngine';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from '../components/CelebrationOverlay';

const SUBJECTS: Subject[] = [
  'Mathematics',
  'Science',
  'English',
  'Kannada',
  'Hindi',
  'Social Science',
  'General Knowledge',
  'Logical Reasoning',
];

const CLASSES = [3, 4, 5, 6, 7];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Einstein Level'];

interface BrainBlastQuizProps {
  onExit: () => void;
  initialPackId?: string | null;
}

export const BrainBlastQuiz: React.FC<BrainBlastQuizProps> = ({ onExit, initialPackId }) => {
  const { player, recordGameCompletion, openScratchCard, isOffline, getCachedPack } = usePlayer();

  const [phase, setPhase] = useState<'setup' | 'playing' | 'summary'>('setup');
  const [subject, setSubject] = useState<Subject>('Science');
  const [gradeClass, setGradeClass] = useState<number>(player.gradeClass);
  const [chapter, setChapter] = useState<string>(SUBJECT_CHAPTERS.Science[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [useAiGen, setUseAiGen] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [sourceBanner, setSourceBanner] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correctCount, setCorrectCount] = useState(0);
  const [quickCount, setQuickCount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [earnedCardId, setEarnedCardId] = useState<string | null>(null);

  const startTimestampRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  const allowedDifficulties = useMemo(() => {
    const order: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Einstein Level'];
    const maxIdx = order.indexOf(player.parentControls.maxDifficulty);
    return order.slice(0, maxIdx >= 0 ? maxIdx + 1 : order.length);
  }, [player.parentControls.maxDifficulty]);

  // Auto-launch if opened from a downloaded Offline Learning Pack
  useEffect(() => {
    if (!initialPackId) return;
    const pack = getCachedPack(initialPackId) || OFFLINE_LEARNING_PACKS.find((p) => p.id === initialPackId);
    if (pack && pack.quizQuestions.length > 0) {
      setSubject(pack.subject);
      setGradeClass(pack.gradeClass);
      setQuestions(pack.quizQuestions.slice(0, 5));
      setSourceBanner(`Playing downloaded pack: ${pack.title}`);
      setCurrentIdx(0);
      setSelectedOption(null);
      setShowHint(false);
      setTimeLeft(30);
      setCorrectCount(0);
      setQuickCount(0);
      setTotalXpEarned(0);
      startTimestampRef.current = Date.now();
      questionStartRef.current = Date.now();
      setPhase('playing');
    }
  }, [initialPackId, getCachedPack]);

  useEffect(() => {
    const chapters = SUBJECT_CHAPTERS[subject];
    if (!chapters.includes(chapter)) {
      setChapter(chapters[0]);
    }
  }, [subject, chapter]);

  // Countdown timer during active question
  useEffect(() => {
    if (phase !== 'playing' || selectedOption !== null) return;
    if (timeLeft <= 0) {
      soundEngine.playWrong();
      setSelectedOption('__TIMEOUT__');
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, selectedOption, timeLeft]);

  const startQuiz = async () => {
    soundEngine.playClick();
    setLoadingQuestions(true);
    setSourceBanner(null);

    try {
      let loaded: QuizQuestion[] = [];
      if (useAiGen && !isOffline) {
        const res = await fetch('/api/questions/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            classLevel: gradeClass,
            chapter,
            difficulty,
            questionType: 'mcq',
            count: 5,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.questions) && data.questions.length > 0) {
          loaded = data.questions;
          setSourceBanner(
            data.source === 'gemini-ai-validated'
              ? 'Fresh Gemini AI questions validated & ready!'
              : data.notice || 'Loaded from curated question bank.'
          );
        }
      }
      if (loaded.length === 0) {
        loaded = getQuizQuestionsForConfig(subject, gradeClass, chapter, difficulty, 5);
        if (isOffline) {
          setSourceBanner('Offline Mode active — using cached local question bank!');
        }
      }

      setQuestions(loaded);
      setCurrentIdx(0);
      setSelectedOption(null);
      setShowHint(false);
      setTimeLeft(30);
      setCorrectCount(0);
      setQuickCount(0);
      setTotalXpEarned(0);
      setEarnedCardId(null);
      startTimestampRef.current = Date.now();
      questionStartRef.current = Date.now();
      setPhase('playing');
    } catch {
      const fallback = getQuizQuestionsForConfig(subject, gradeClass, chapter, difficulty, 5);
      setQuestions(fallback);
      setSourceBanner('Loaded curated offline question bank.');
      setPhase('playing');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const currentQuestion = questions[currentIdx];

  const handleSelectAnswer = (option: string) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(option);
    const secondsUsed = (Date.now() - questionStartRef.current) / 1000;
    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      soundEngine.playCorrect();
      const earned = currentQuestion.points || XP_RULES.QUIZ_CORRECT;
      setCorrectCount((c) => c + 1);
      setTotalXpEarned((x) => x + earned);
      if (secondsUsed <= 10) {
        setQuickCount((q) => q + 1);
      }
    } else {
      soundEngine.playWrong();
    }
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setShowHint(false);
      setTimeLeft(30);
      questionStartRef.current = Date.now();
    } else {
      const durationSec = Math.max(5, Math.round((Date.now() - startTimestampRef.current) / 1000));
      setElapsedSec(durationSec);
      const cardId = `card-brain-blast-${Date.now()}`;
      setEarnedCardId(cardId);
      soundEngine.playVictory();
      recordGameCompletion({
        gameId: 'brain-blast',
        subject,
        score: correctCount,
        total: questions.length,
        xpEarned: totalXpEarned,
        gemsEarned: Math.max(5, correctCount * 3),
        durationSec,
        quickAnswers: quickCount,
        unlockScratchCardTitle: `Brain Blast Quiz (${subject})`,
      });
      setPhase('summary');
    }
  };

  const isCorrectState =
    selectedOption !== null && currentQuestion && selectedOption === currentQuestion.correctAnswer;
  const isWrongState =
    selectedOption !== null && currentQuestion && selectedOption !== currentQuestion.correctAnswer;

  if (phase === 'setup') {
    return (
      <div className="space-y-6 animate-fun-pop">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Games</span>
          </button>
          <span className="text-xs font-bold text-blue-600">
            +10 XP per correct answer · Zero XP penalty
          </span>
        </div>

        <div className="card-toy rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Brain Blast Quiz</h1>
            <p className="text-slate-600 mt-1">
              Pick your subject, class, chapter, and challenge level to launch your quiz adventure!
            </p>
          </div>

          {/* Step 1: Subject */}
          <div className="space-y-2.5">
            <label className="block font-display text-base font-bold text-slate-800">
              1. Choose a Subject
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSubject(sub);
                  }}
                  className={`btn-3d rounded-2xl px-3.5 py-3 text-sm font-bold border-2 text-left transition-colors ${
                    subject === sub
                      ? 'bg-blue-600 text-white border-blue-700 border-b-4 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 & 3: Class & Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <label className="block font-display text-base font-bold text-slate-800">
                2. Select Your Class
              </label>
              <div className="flex flex-wrap gap-2">
                {CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setGradeClass(cls);
                    }}
                    className={`btn-3d rounded-2xl px-4 py-2.5 text-sm font-bold border-2 ${
                      gradeClass === cls
                        ? 'bg-amber-400 text-slate-900 border-amber-600 border-b-4'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="quiz-chapter-select" className="block font-display text-base font-bold text-slate-800">
                3. Select Chapter
              </label>
              <select
                id="quiz-chapter-select"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {SUBJECT_CHAPTERS[subject].map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 4: Difficulty */}
          <div className="space-y-2.5">
            <label className="block font-display text-base font-bold text-slate-800">
              4. Choose Difficulty Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DIFFICULTIES.map((diff) => {
                const locked = !allowedDifficulties.includes(diff);
                return (
                  <button
                    key={diff}
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      soundEngine.playClick();
                      setDifficulty(diff);
                    }}
                    className={`btn-3d rounded-2xl px-3.5 py-3 text-sm font-bold border-2 ${
                      locked
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : difficulty === diff
                        ? diff === 'Einstein Level'
                          ? 'bg-indigo-600 text-white border-indigo-800 border-b-4'
                          : 'bg-emerald-500 text-white border-emerald-700 border-b-4'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    {diff} {locked ? '(Parent Locked)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gemini AI Question Generator Toggle */}
          <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-bold text-slate-900">
                  Gemini AI Fresh Questions {isOffline ? '(Offline Fallback Active)' : ''}
                </p>
                <p className="text-xs text-slate-600">
                  Generate validated Class {gradeClass} {subject} questions live with automatic offline fallback.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useAiGen && !isOffline}
              disabled={isOffline}
              onClick={() => setUseAiGen((v) => !v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                useAiGen && !isOffline
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              {isOffline ? 'Offline Bank Ready' : useAiGen ? 'AI Generation ON' : 'Use Curated Bank'}
            </button>
          </div>

          <button
            type="button"
            onClick={startQuiz}
            disabled={loadingQuestions}
            data-start="true"
            className="btn-3d w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-b-4 border-indigo-900 px-6 py-4 font-display text-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>{loadingQuestions ? 'Preparing Quiz Questions...' : 'Start Brain Blast Quiz!'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const stars = computeStarRating(correctCount, questions.length);
    const latestCard =
      player.pendingScratchCards[player.pendingScratchCards.length - 1] ||
      (earnedCardId ? { challengeInstanceId: earnedCardId, sourceTitle: `Brain Blast Quiz (${subject})` } : null);

    return (
      <div className="max-w-2xl mx-auto animate-fun-pop">
        <ConfettiBurst active={true} reducedMotion={player.audio.reducedMotion} />
        <div className="card-toy rounded-3xl p-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 text-amber-500">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-9 h-9 ${i < stars ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
              />
            ))}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              {accuracy >= 80 ? 'Brilliant Brain Blast!' : 'Awesome Effort, Explorer!'}
            </h2>
            <p className="text-slate-600 mt-1">
              {subject} · Class {gradeClass} · {difficulty}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-700">Correct</p>
              <p className="font-display text-2xl font-bold text-emerald-900 tabular-nums">
                {correctCount}/{questions.length}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-700">Accuracy</p>
              <p className="font-display text-2xl font-bold text-blue-900 tabular-nums">{accuracy}%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700">XP Earned</p>
              <p className="font-display text-2xl font-bold text-amber-900 tabular-nums">+{totalXpEarned}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4">
              <p className="text-xs font-bold text-indigo-700">Time</p>
              <p className="font-display text-2xl font-bold text-indigo-900 tabular-nums">{elapsedSec}s</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {latestCard && (
              <button
                type="button"
                onClick={() => openScratchCard(latestCard)}
                className="btn-3d flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 border-b-4 border-orange-700 px-6 py-3.5 font-display text-lg font-bold text-white flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                <span>Scratch &amp; Win Reward!</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="btn-3d rounded-2xl bg-blue-600 border-b-4 border-blue-800 px-6 py-3.5 font-display text-base font-bold text-white"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="btn-3d rounded-2xl bg-slate-100 border-b-4 border-slate-300 px-5 py-3.5 font-display text-base font-bold text-slate-800"
            >
              All Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING PHASE
  const progressPct = Math.round(((currentIdx + (selectedOption ? 1 : 0)) / Math.max(1, questions.length)) * 100);

  return (
    <div
      className={`rounded-3xl p-4 sm:p-6 md:p-8 transition-colors duration-300 ${
        isCorrectState
          ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white'
          : isWrongState
          ? 'bg-gradient-to-br from-orange-100 via-rose-50 to-amber-50 animate-fun-shake'
          : 'card-toy'
      }`}
    >
      <ConfettiBurst active={Boolean(isCorrectState)} reducedMotion={player.audio.reducedMotion} />

      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className={`text-sm font-bold inline-flex items-center gap-1.5 ${
              isCorrectState ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit</span>
          </button>
          <span className={`text-sm font-bold tabular-nums ${isCorrectState ? 'text-white' : 'text-slate-800'}`}>
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums px-3 py-1 rounded-xl ${
              timeLeft <= 8 && !selectedOption
                ? 'bg-rose-500 text-white'
                : isCorrectState
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
          <span className={`font-mono text-sm font-bold tabular-nums ${isCorrectState ? 'text-white' : 'text-amber-600'}`}>
            +{totalXpEarned} XP
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-3 rounded-full overflow-hidden mb-6 ${isCorrectState ? 'bg-white/25' : 'bg-slate-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCorrectState ? 'bg-amber-300' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {sourceBanner && (
        <div
          className={`mb-4 text-xs font-semibold flex items-center gap-1.5 ${
            isCorrectState ? 'text-emerald-100' : 'text-indigo-700'
          }`}
        >
          {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{sourceBanner}</span>
        </div>
      )}

      {currentQuestion && (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-wider ${isCorrectState ? 'text-emerald-100' : 'text-blue-600'}`}>
              {currentQuestion.subject} · {currentQuestion.chapter} · {currentQuestion.difficulty}
            </p>
            <h2 className={`font-display text-2xl md:text-3xl font-bold leading-snug ${isCorrectState ? 'text-white' : 'text-slate-900'}`}>
              {currentQuestion.question}
            </h2>
          </div>

          {/* Optional Hint */}
          {!selectedOption && (
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
                  <span>Need a Hint?</span>
                </button>
              ) : (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900">
                  Hint: {currentQuestion.hint}
                </div>
              )}
            </div>
          )}

          {/* 4 Answer Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuestion.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
              const isChosen = selectedOption === opt;
              const isRightOption = opt === currentQuestion.correctAnswer;

              let btnClass =
                'bg-white text-slate-900 border-slate-200 border-b-4 hover:border-blue-400 hover:bg-blue-50';
              if (selectedOption !== null) {
                if (isRightOption) {
                  btnClass = 'bg-emerald-600 text-white border-emerald-800 border-b-4';
                } else if (isChosen) {
                  btnClass = 'bg-rose-500 text-white border-rose-700 border-b-4';
                } else {
                  btnClass = isCorrectState
                    ? 'bg-white/20 text-white/80 border-white/20'
                    : 'bg-slate-100 text-slate-400 border-slate-200';
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`btn-3d rounded-2xl border-2 px-5 py-4 text-left font-bold text-base flex items-center gap-3.5 transition-all ${btnClass}`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                      selectedOption !== null && isRightOption
                        ? 'bg-white text-emerald-700'
                        : selectedOption !== null && isChosen
                        ? 'bg-white text-rose-600'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Educational Explanation */}
          {selectedOption !== null && (
            <div
              className={`rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fun-pop ${
                isCorrectState ? 'bg-white/95 text-slate-900' : 'bg-white border-2 border-orange-200 text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {isCorrectState ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-10 h-10 text-orange-500 shrink-0" />
                )}
                <div>
                  <h3 className={`font-display text-xl font-bold ${isCorrectState ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {isCorrectState
                      ? `EXCELLENT! +${currentQuestion.points} XP`
                      : selectedOption === '__TIMEOUT__'
                      ? 'GOOD TRY! Time ran out'
                      : 'GOOD TRY! Let’s learn why'}
                  </h3>
                  {!isCorrectState && (
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      Correct Answer: {currentQuestion.correctAnswer}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 mt-1">{currentQuestion.explanation}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn-3d rounded-2xl bg-blue-600 border-b-4 border-blue-800 px-6 py-3 font-display font-bold text-white whitespace-nowrap shrink-0"
              >
                {currentIdx + 1 < questions.length ? 'Next Question' : 'See My Score!'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
