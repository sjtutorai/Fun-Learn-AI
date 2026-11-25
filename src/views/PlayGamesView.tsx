import React from 'react';
import {
  CheckCircle2,
  CloudOff,
  Download,
  HardDrive,
  Play,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ART_ASSETS } from '../data/assets';
import { OFFLINE_LEARNING_PACKS } from '../data/learningPacks';
import type { GameId } from '../types/game';
import { usePlayer } from '../context/PlayerContext';
import { soundEngine } from '../utils/soundEngine';

interface PlayGamesViewProps {
  onLaunchGame: (gameId: GameId, packId?: string) => void;
}

const ALL_GAMES: {
  id: GameId;
  title: string;
  description: string;
  highlights: string;
  image: string;
  accent: string;
}[] = [
  {
    id: 'brain-blast',
    title: 'Brain Blast Quiz',
    description:
      'Pick from 8 subjects, Classes 3–7, chapters, and 4 difficulty levels—or generate fresh Gemini AI questions!',
    highlights: 'Mathematics · Science · English · Kannada · Hindi · Social Science · GK · Logic',
    image: ART_ASSETS.brainBlast,
    accent: 'bg-blue-600 border-blue-800',
  },
  {
    id: 'match-master',
    title: 'Match Master',
    description:
      'Draw glowing animated lines connecting Column A to Column B across 11 interactive educational boards.',
    highlights: 'Habitats · Capitals · Scientists · Math Formulas · Vitamins · Kannada Words',
    image: ART_ASSETS.matchMaster,
    accent: 'bg-orange-500 border-orange-700',
  },
  {
    id: 'einstein-mystery',
    title: "Einstein's Mystery",
    description:
      'Our signature detective challenge featuring Odd One Out, Visual Reasoning, Number Patterns, and Picture Puzzles.',
    highlights: 'Observation · Unambiguous Visual Clues · Einstein Mind Badge',
    image: ART_ASSETS.einsteinMystery,
    accent: 'bg-indigo-600 border-indigo-800',
  },
  {
    id: 'word-wizard',
    title: 'Word Wizard',
    description:
      'Cast language spells across 7 mini-games: Scramble, Complete Word, Spelling, Synonyms, Antonyms & Sentences.',
    highlights: 'English · Kannada · Hindi Vocabulary',
    image: ART_ASSETS.wordWizard,
    accent: 'bg-emerald-600 border-emerald-800',
  },
  {
    id: 'treasure-hunt',
    title: 'Treasure Hunt Adventure',
    description:
      'Sail across 5 vibrant 3D islands—Science Island to Logic Cave—completing missions to unlock golden chests!',
    highlights: 'Interactive World Map · Progressive Missions · Gems & Stars',
    image: ART_ASSETS.treasureMap,
    accent: 'bg-amber-500 border-amber-700',
  },
];

export const PlayGamesView: React.FC<PlayGamesViewProps> = ({ onLaunchGame }) => {
  const {
    player,
    isOffline,
    simulatedOffline,
    setSimulatedOffline,
    downloadLearningPack,
    removeLearningPack,
    syncOfflineQueueNow,
    isSyncing,
    lastSyncedAt,
  } = usePlayer();

  const downloadedCount = Object.keys(player.downloadedPacks).length;
  const queuedCount = player.offlineSyncQueue.length;

  return (
    <div className="space-y-8 animate-fun-pop">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Play Games Arcade</h1>
        <p className="text-slate-600 mt-1">
          Five interactive educational game worlds plus downloadable Offline Learning Packs!
        </p>
      </div>

      {/* 5 Complete Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ALL_GAMES.map((game) => (
          <div
            key={game.id}
            className="card-toy card-toy-hover rounded-3xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src={game.image}
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-2">
                <h2 className="font-display text-2xl font-bold text-slate-900">{game.title}</h2>
                <p className="text-sm text-slate-600">{game.description}</p>
                <p className="text-xs font-bold text-slate-500 pt-1">{game.highlights}</p>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onLaunchGame(game.id);
                }}
                className={`btn-3d w-full rounded-2xl border-b-4 py-3 font-display text-base font-bold text-white flex items-center justify-center gap-2 ${game.accent}`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch {game.title}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Offline Mode & Downloadable Learning Packs */}
      <section className="card-toy rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <HardDrive className="w-4 h-4" />
              <span>Offline Mode · Learning Packs</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Download Packs for Anytime Learning
            </h2>
            <p className="text-sm text-slate-600">
              Save curated subject &amp; grade packs right onto your device. Any XP and achievements earned offline automatically sync back to Firebase once you reconnect!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              className={`btn-3d rounded-2xl px-4 py-2.5 text-xs font-bold border-2 inline-flex items-center gap-2 ${
                isOffline
                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isOffline ? 'Offline Mode: ON (Tap to Reconnect)' : 'Online · Test Offline Mode'}</span>
            </button>

            <button
              type="button"
              disabled={isOffline || isSyncing}
              onClick={syncOfflineQueueNow}
              className="btn-3d rounded-2xl bg-blue-600 border-b-4 border-blue-800 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Syncing...'
                  : queuedCount > 0
                  ? `Sync ${queuedCount} Queued`
                  : lastSyncedAt
                  ? `Synced ${lastSyncedAt}`
                  : 'Sync with Firebase'}
              </span>
            </button>
          </div>
        </div>

        {/* Status Summary Line */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            {isOffline ? (
              <CloudOff className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {downloadedCount} of {OFFLINE_LEARNING_PACKS.length} Learning Packs stored on this device
            </span>
          </span>
          <span className="tabular-nums">
            Pending Cloud Sync Queue: {queuedCount} {queuedCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Curated Downloadable Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFLINE_LEARNING_PACKS.map((pack) => {
            const meta = player.downloadedPacks[pack.id];
            const isDownloaded = Boolean(meta);
            const count =
              pack.quizQuestions.length +
              (pack.matchSet?.pairs.length || 0) +
              (pack.wordChallenges?.length || 0) +
              (pack.einsteinPuzzles?.length || 0);

            return (
              <div
                key={pack.id}
                className={`rounded-2xl border-2 p-5 flex flex-col justify-between gap-4 ${
                  isDownloaded ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span style={{ color: pack.accent }}>
                      {pack.subject} · Class {pack.gradeClass}
                    </span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {count} items · {pack.sizeKb} KB
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{pack.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{pack.description}</p>
                </div>

                {isDownloaded ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onLaunchGame('brain-blast', pack.id);
                      }}
                      className="btn-3d flex-1 rounded-xl bg-emerald-600 border-b-4 border-emerald-800 py-2.5 text-xs font-display font-bold text-white inline-flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Offline Pack</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLearningPack(pack.id)}
                      aria-label={`Remove ${pack.title} from offline storage`}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isOffline}
                    onClick={() => downloadLearningPack(pack)}
                    className="btn-3d w-full rounded-xl bg-blue-600 border-b-4 border-blue-800 disabled:bg-slate-300 disabled:border-slate-400 py-2.5 text-xs font-display font-bold text-white inline-flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isOffline ? 'Reconnect to Download' : 'Download Pack'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
