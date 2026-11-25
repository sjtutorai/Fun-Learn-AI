import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Gift,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { WORD_CHALLENGES } from '../data/wordBank';
import type { WordLanguage, WordMiniGame } from '../types/game';
import { usePlayer } from '../context/PlayerContext';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from '../components/CelebrationOverlay';

const LANGUAGES: WordLanguage[] = ['English', 'Kannada', 'Hindi'];

const MINI_MODES: { id: WordMiniGame | 'all'; label: string }[] = [
  { id: 'all', label: 'All Spells' },
  { id: 'scramble', label: 'Word Scramble' },
  { id: 'complete', label: 'Complete Word' },
  { id: 'spelling', label: 'Correct Spelling' },
  { id: 'synonym', label: 'Synonyms' },
  { id: 'antonym', label: 'Antonyms' },
  { id: 'sentence', label: 'Sentence Builder' },
  { id: 'vocabulary', label: 'Vocabulary' },
];

export const WordWizardGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { player, recordGameCompletion, openScratchCard } = usePlayer();
  const [language, setLanguage] = useState<WordLanguage>('English');
  const [mode, setMode] = useState<WordMiniGame | 'all'>('all');
  const [idx, setIdx] = useState(0);

  // Interactive tile state for Scramble and Sentence Builder
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [finished, setFinished] = useState(false);
  const startRef = useRef<number>(Date.now());

  const deck = useMemo(() => {
    const byLang = WORD_CHALLENGES.filter((w) => w.language === language);
    const byMode = mode === 'all' ? byLang : byLang.filter((w) => w.mode === mode);
    const pool = byMode.length > 0 ? byMode : byLang;
    return pool.slice(0, 6);
  }, [language, mode]);

  const challenge = deck[idx];

  const resetSession = (nextLang: WordLanguage, nextMode: WordMiniGame | 'all') => {
    soundEngine.playClick();
    setLanguage(nextLang);
    setMode(nextMode);
    setIdx(0);
    setPickedIndices([]);
    setSelectedOption(null);
    setStatus('idle');
    setShowHint(false);
    setSolvedCount(0);
    setXpEarned(0);
    setFinished(false);
    startRef.current = Date.now();
  };

  const evaluateAnswer = (submitted: string) => {
    if (!challenge || status !== 'idle') return;
    const isCorrect = submitted.trim().toLowerCase() === challenge.correctAnswer.trim().toLowerCase();
    setSelectedOption(submitted);
    if (isCorrect) {
      soundEngine.playCorrect();
      setStatus('correct');
      setSolvedCount((c) => c + 1);
      setXpEarned((x) => x + challenge.points);
    } else {
      soundEngine.playWrong();
      setStatus('wrong');
    }
  };

  const handleTilePick = (tileIdx: number) => {
    if (!challenge || status !== 'idle') return;
    soundEngine.playClick();
    if (pickedIndices.includes(tileIdx)) {
      setPickedIndices((prev) => prev.filter((i) => i !== tileIdx));
      return;
    }
    const next = [...pickedIndices, tileIdx];
    setPickedIndices(next);

    if (challenge.mode === 'scramble' && challenge.scrambled) {
      if (next.length === challenge.scrambled.length) {
        const assembled = next.map((i) => challenge.scrambled![i]).join('');
        evaluateAnswer(assembled);
      }
    } else if (challenge.mode === 'sentence' && challenge.shuffledWords) {
      if (next.length === challenge.shuffledWords.length) {
        const assembled = next.map((i) => challenge.shuffledWords![i]).join(' ');
        evaluateAnswer(assembled);
      }
    }
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (idx + 1 < deck.length) {
      setIdx((i) => i + 1);
      setPickedIndices([]);
      setSelectedOption(null);
      setStatus('idle');
      setShowHint(false);
    } else {
      const durationSec = Math.max(5, Math.round((Date.now() - startRef.current) / 1000));
      soundEngine.playVictory();
      recordGameCompletion({
        gameId: 'word-wizard',
        subject: language,
        score: solvedCount,
        total: deck.length,
        xpEarned,
        gemsEarned: Math.max(6, solvedCount * 3),
        durationSec,
        wordPuzzlesDelta: solvedCount,
        unlockScratchCardTitle: `Word Wizard (${language})`,
      });
      setFinished(true);
    }
  };

  if (finished) {
    const latestCard = player.pendingScratchCards[player.pendingScratchCards.length - 1];
    return (
      <div className="max-w-xl mx-auto animate-fun-pop">
        <ConfettiBurst active={true} reducedMotion={player.audio.reducedMotion} />
        <div className="card-toy rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mx-auto flex items-center justify-center shadow-lg">
            <Sparkles className="w-9 h-9" />
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900">
            Spellbook Mastered!
          </h2>
          <p className="text-slate-600">
            You solved {solvedCount} of {deck.length} {language} word puzzles and earned +{xpEarned} XP!
          </p>
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
              onClick={() => resetSession(language, mode)}
              className="btn-3d rounded-2xl bg-emerald-600 border-b-4 border-emerald-800 px-6 py-3.5 font-display font-bold text-white"
            >
              Cast More Spells
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-2xl">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => resetSession(lang, 'all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                language === lang ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Mini-game Mode Filter (English has all 7 modes; Kannada/Hindi have Vocab + Antonyms) */}
      {language === 'English' && (
        <div className="flex flex-wrap gap-1.5">
          {MINI_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => resetSession(language, m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                mode === m.id
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {challenge && (
        <div
          className={`rounded-3xl p-5 md:p-8 space-y-6 transition-colors duration-300 ${
            status === 'correct'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
              : status === 'wrong'
              ? 'bg-orange-50 border-2 border-orange-200 animate-fun-shake'
              : 'card-toy'
          }`}
        >
          <ConfettiBurst active={status === 'correct'} reducedMotion={player.audio.reducedMotion} />

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={status === 'correct' ? 'text-emerald-100' : 'text-emerald-700'}>
              {language} · Puzzle {idx + 1} of {deck.length} · {challenge.mode}
            </span>
            <span className={`font-mono text-sm tabular-nums ${status === 'correct' ? 'text-white' : 'text-amber-600'}`}>
              +{challenge.points} XP
            </span>
          </div>

          <h2 className={`font-display text-2xl md:text-3xl font-bold ${status === 'correct' ? 'text-white' : 'text-slate-900'}`}>
            {challenge.prompt}
          </h2>

          {/* Spotlight Word or Masked Word */}
          {(challenge.word || challenge.maskedWord) && (
            <div className="rounded-2xl bg-slate-900 text-amber-300 py-5 px-6 text-center font-display text-3xl md:text-4xl font-bold tracking-widest shadow-inner">
              {challenge.maskedWord || challenge.word}
            </div>
          )}

          {/* Mode A: Word Scramble Interactive Tiles */}
          {challenge.mode === 'scramble' && challenge.scrambled && (
            <div className="space-y-5">
              {/* Answer Slots */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[64px] rounded-2xl bg-slate-100 p-3">
                {Array.from({ length: challenge.scrambled.length }, (_, slotIdx) => {
                  const chosenTileIdx = pickedIndices[slotIdx];
                  const char =
                    typeof chosenTileIdx === 'number' ? challenge.scrambled![chosenTileIdx] : '';
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      disabled={!char || status !== 'idle'}
                      onClick={() => {
                        if (typeof chosenTileIdx === 'number') handleTilePick(chosenTileIdx);
                      }}
                      className={`w-13 h-13 rounded-2xl font-display text-2xl font-bold border-2 flex items-center justify-center transition-all ${
                        char
                          ? 'bg-emerald-500 text-white border-emerald-700 border-b-4'
                          : 'bg-white text-slate-300 border-dashed border-slate-300'
                      }`}
                    >
                      {char || '_'}
                    </button>
                  );
                })}
              </div>

              {/* Letter Bank */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {challenge.scrambled.split('').map((letter, tileIdx) => {
                  const used = pickedIndices.includes(tileIdx);
                  return (
                    <button
                      key={`${letter}-${tileIdx}`}
                      type="button"
                      disabled={used || status !== 'idle'}
                      onClick={() => handleTilePick(tileIdx)}
                      className={`btn-3d w-14 h-14 rounded-2xl font-display text-2xl font-bold border-2 ${
                        used
                          ? 'bg-slate-200 text-slate-400 border-slate-300 opacity-40'
                          : 'bg-amber-400 text-slate-900 border-amber-600 border-b-4'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {status === 'idle' && pickedIndices.length > 0 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setPickedIndices([])}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Letters</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode F: Sentence Builder */}
          {challenge.mode === 'sentence' && challenge.shuffledWords && (
            <div className="space-y-4">
              <div className="min-h-[68px] rounded-2xl bg-slate-100 p-4 flex flex-wrap items-center gap-2">
                {pickedIndices.length === 0 ? (
                  <span className="text-sm text-slate-400 font-semibold">
                    Tap the word cards below in the right order...
                  </span>
                ) : (
                  pickedIndices.map((tileIdx) => (
                    <button
                      key={`picked-${tileIdx}`}
                      type="button"
                      disabled={status !== 'idle'}
                      onClick={() => handleTilePick(tileIdx)}
                      className="rounded-xl bg-teal-600 text-white px-4 py-2 font-display font-bold text-base shadow-sm"
                    >
                      {challenge.shuffledWords![tileIdx]}
                    </button>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {challenge.shuffledWords.map((word, tileIdx) => {
                  const used = pickedIndices.includes(tileIdx);
                  return (
                    <button
                      key={`${word}-${tileIdx}`}
                      type="button"
                      disabled={used || status !== 'idle'}
                      onClick={() => handleTilePick(tileIdx)}
                      className={`btn-3d rounded-2xl px-5 py-3 font-display text-lg font-bold border-2 ${
                        used
                          ? 'bg-slate-200 text-slate-400 border-slate-300 opacity-40'
                          : 'bg-white text-slate-900 border-teal-300 border-b-4 hover:bg-teal-50'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Option Modes (Complete Word, Spelling, Synonym, Antonym, Vocabulary) */}
          {challenge.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {challenge.options.map((opt) => {
                const isAnswer = opt === challenge.correctAnswer;
                const isChosen = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={status !== 'idle'}
                    onClick={() => evaluateAnswer(opt)}
                    className={`btn-3d rounded-2xl border-2 px-5 py-4 font-display text-lg font-bold text-left transition-all ${
                      status !== 'idle' && isAnswer
                        ? 'bg-emerald-600 text-white border-emerald-800 border-b-4'
                        : status !== 'idle' && isChosen
                        ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                        : 'bg-white text-slate-900 border-slate-200 border-b-4 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Hint */}
          {status === 'idle' && (
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
                  <span>Wizard Hint</span>
                </button>
              ) : (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900">
                  Hint: {challenge.hint}
                </div>
              )}
            </div>
          )}

          {/* Result Banner */}
          {status !== 'idle' && (
            <div className="rounded-2xl bg-white text-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fun-pop">
              <div className="flex items-start gap-3">
                {status === 'correct' ? (
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-9 h-9 text-orange-500 shrink-0" />
                )}
                <div>
                  <h3 className={`font-display text-xl font-bold ${status === 'correct' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {status === 'correct' ? 'MAGICAL SPELLING!' : `GOOD TRY! Correct: ${challenge.correctAnswer}`}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{challenge.explanation}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="btn-3d rounded-2xl bg-emerald-600 border-b-4 border-emerald-800 px-6 py-3 font-display font-bold text-white whitespace-nowrap shrink-0"
              >
                {idx + 1 < deck.length ? 'Next Spell' : 'Finish Quest'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
