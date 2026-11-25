import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Cloud,
  Lock,
  LogIn,
  LogOut,
  Music,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import type { Difficulty } from '../types/game';
import { soundEngine } from '../utils/soundEngine';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Einstein Level'];
const SCREEN_LIMITS = [15, 30, 45, 60];

export const SettingsView: React.FC = () => {
  const {
    player,
    firebaseUser,
    isOffline,
    simulatedOffline,
    setSimulatedOffline,
    isSyncing,
    lastSyncedAt,
    syncOfflineQueueNow,
    signIn,
    signOut,
    updateAudio,
    updateParentControls,
  } = usePlayer();

  // Grown-up verification gate for Parent Dashboard (14 + 9 = 23)
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);

  const handleUnlockParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (gateInput.trim() === '23') {
      soundEngine.playCorrect();
      setParentUnlocked(true);
      setGateError(null);
      setGateInput('');
    } else {
      soundEngine.playWrong();
      setGateError('Please solve 14 + 9 correctly to unlock the Parent Dashboard.');
    }
  };

  // Compute strengths & areas needing practice from player.subjectStats
  const { strengths, needsPractice, practisedCount } = useMemo(() => {
    const entries = Object.entries(player.subjectStats)
      .filter(([, s]) => s.played > 0)
      .map(([name, s]) => ({
        name,
        played: s.played,
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        xp: s.xp,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const str = entries.filter((e) => e.accuracy >= 75).slice(0, 3);
    const weak = entries.filter((e) => e.accuracy < 75).slice(0, 3);
    return {
      strengths: str,
      needsPractice: weak,
      practisedCount: entries.length,
    };
  }, [player.subjectStats]);

  const maxDailyMins = Math.max(30, ...player.weeklyActivityMins);

  return (
    <div className="space-y-6 animate-fun-pop">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Settings &amp; Parent Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Adjust sound, accessibility, offline cloud sync, and grown-up safety controls.
        </p>
      </div>

      {/* Audio, Accessibility & Cloud Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio & Motion Controls */}
        <section className="card-toy rounded-3xl p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Audio &amp; Accessibility</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {player.audio.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-bold text-sm text-slate-900">Game Sound Effects</p>
                  <p className="text-xs text-slate-500">Bells, chimes, high-fives &amp; celebration tones</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={player.audio.soundEnabled}
                onClick={() => updateAudio({ soundEnabled: !player.audio.soundEnabled })}
                className={`rounded-full px-4 py-1.5 font-display text-xs font-bold transition-all ${
                  player.audio.soundEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {player.audio.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <label htmlFor="sfx-volume">Sound Effects Volume</label>
                <span className="font-mono tabular-nums">
                  {Math.round(player.audio.sfxVolume * 100)}%
                </span>
              </div>
              <input
                id="sfx-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={player.audio.sfxVolume}
                onChange={(e) => updateAudio({ sfxVolume: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Cheerful Background Music</p>
                  <p className="text-xs text-slate-500">Gentle playful synth melody while exploring</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={player.audio.musicEnabled}
                onClick={() => updateAudio({ musicEnabled: !player.audio.musicEnabled })}
                className={`rounded-full px-4 py-1.5 font-display text-xs font-bold transition-all ${
                  player.audio.musicEnabled
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {player.audio.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Reduced Motion Mode</p>
                  <p className="text-xs text-slate-500">Calm screens without confetti or bounce effects</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={player.audio.reducedMotion}
                onClick={() => updateAudio({ reducedMotion: !player.audio.reducedMotion })}
                className={`rounded-full px-4 py-1.5 font-display text-xs font-bold transition-all ${
                  player.audio.reducedMotion
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {player.audio.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </section>

        {/* Cloud Save & Offline Sync */}
        <section className="card-toy rounded-3xl p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-600" />
            <span>Firebase Cloud Save &amp; Offline Mode</span>
          </h2>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            {firebaseUser ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    Signed in to Firebase
                  </p>
                  <p className="font-display font-bold text-slate-900">
                    {firebaseUser.displayName || player.nickname}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="btn-3d rounded-xl bg-white border-2 border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-slate-900">
                    Playing in Instant Local Explorer Mode
                  </p>
                  <p className="text-xs text-slate-600">
                    Sign in with Google to back up XP, badges, and Friend Codes across devices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signIn()}
                  className="btn-3d rounded-xl bg-blue-600 border-b-4 border-blue-800 px-4 py-2.5 font-display text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isOffline ? (
                  <WifiOff className="w-5 h-5 text-amber-600" />
                ) : (
                  <Wifi className="w-5 h-5 text-emerald-600" />
                )}
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    {isOffline ? 'Offline Mode Active' : 'Online & Ready to Sync'}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {Object.keys(player.downloadedPacks).length} packs downloaded ·{' '}
                    {player.offlineSyncQueue.length} queued updates
                    {lastSyncedAt ? ` · Synced ${lastSyncedAt}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulatedOffline(!simulatedOffline)}
                className={`rounded-xl border-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap ${
                  simulatedOffline
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {simulatedOffline ? 'Reconnect' : 'Simulate Offline'}
              </button>
            </div>

            <button
              type="button"
              disabled={isOffline || isSyncing}
              onClick={syncOfflineQueueNow}
              className="btn-3d w-full rounded-2xl bg-sky-600 border-b-4 border-sky-800 disabled:opacity-50 py-2.5 font-display text-sm font-bold text-white inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Syncing Progress...'
                  : player.offlineSyncQueue.length > 0
                  ? `Sync ${player.offlineSyncQueue.length} Offline Records Now`
                  : 'Sync Progress to Firebase Now'}
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Parent Dashboard Section */}
      <section className="card-toy rounded-3xl p-6 md:p-8 space-y-6 border-indigo-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Shield className="w-4 h-4" />
              <span>Grown-Up Zone · Child Privacy &amp; Learning Insights</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Parent Dashboard
            </h2>
          </div>

          {parentUnlocked && (
            <button
              type="button"
              onClick={() => setParentUnlocked(false)}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Dashboard</span>
            </button>
          )}
        </div>

        {!parentUnlocked ? (
          <form
            onSubmit={handleUnlockParent}
            className="rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 p-6 max-w-lg space-y-4"
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-display font-bold text-slate-900">
                  Quick Grown-Up Check
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Solve this quick sum to open weekly learning analytics, screen-time limits, and safety controls:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="parent-math-gate" className="font-display text-lg font-bold text-indigo-900">
                14 + 9 =
              </label>
              <input
                id="parent-math-gate"
                type="number"
                inputMode="numeric"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                placeholder="?"
                className="w-24 rounded-xl border-2 border-indigo-300 bg-white px-3.5 py-2 font-mono text-base font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="submit"
                className="btn-3d rounded-xl bg-indigo-600 border-b-4 border-indigo-800 px-5 py-2.5 font-display text-sm font-bold text-white inline-flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>Open Dashboard</span>
              </button>
            </div>
            {gateError && <p className="text-xs font-bold text-rose-600">{gateError}</p>}
          </form>
        ) : (
          <div className="space-y-6">
            {/* Key Learning Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-bold text-blue-700">Total Learning Time</p>
                <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {player.learningMinutes} mins
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-xs font-bold text-emerald-700">Games Completed</p>
                <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {player.gamesCompleted}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs font-bold text-amber-700">Subjects Practised</p>
                <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {practisedCount} / 8
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4">
                <p className="text-xs font-bold text-indigo-700">Active Streak</p>
                <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {player.streak} days
                </p>
              </div>
            </div>

            {/* Weekly Learning Bar Chart + Strengths/Practice */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Weekly Progress Report (Minutes)</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-500">Past 7 Days</span>
                </div>
                <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
                  {player.weeklyActivityMins.map((mins, idx) => {
                    const heightPct = Math.max(12, Math.round((mins / maxDailyMins) * 100));
                    return (
                      <div key={DAYS[idx]} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-mono font-bold text-slate-600 tabular-nums">
                          {mins}m
                        </span>
                        <div className="w-full max-w-[34px] bg-blue-100 rounded-t-xl overflow-hidden flex items-end h-24">
                          <div
                            className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-sky-400 transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{DAYS[idx]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-emerald-800 text-sm uppercase tracking-wider">
                    Strongest Subjects
                  </h3>
                  <div className="mt-2 space-y-2">
                    {strengths.length > 0 ? (
                      strengths.map((s) => (
                        <div
                          key={s.name}
                          className="rounded-xl bg-white border border-emerald-200 px-3.5 py-2 flex items-center justify-between text-sm"
                        >
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <span className="font-mono font-bold text-emerald-700 tabular-nums">
                            {s.accuracy}% accuracy
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-600">Play a few quizzes to uncover top strengths.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-amber-800 text-sm uppercase tracking-wider">
                    Topics Needing Extra Practice
                  </h3>
                  <div className="mt-2 space-y-2">
                    {needsPractice.length > 0 ? (
                      needsPractice.map((s) => (
                        <div
                          key={s.name}
                          className="rounded-xl bg-white border border-amber-200 px-3.5 py-2 flex items-center justify-between text-sm"
                        >
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <span className="font-mono font-bold text-amber-700 tabular-nums">
                            {s.accuracy}% accuracy
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Great accuracy across all practised subjects!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Safety & Screen-Time Controls */}
            <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 space-y-5">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Safety, Difficulty &amp; Screen-Time Controls
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Maximum Recommended Difficulty
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => updateParentControls({ maxDifficulty: diff })}
                        className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold ${
                          player.parentControls.maxDifficulty === diff
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Healthy Screen-Time Reminder</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SCREEN_LIMITS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updateParentControls({ screenTimeReminderMins: mins })}
                        className={`rounded-xl border-2 px-3.5 py-1.5 text-xs font-bold tabular-nums ${
                          player.parentControls.screenTimeReminderMins === mins
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {mins} mins
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div>
                    <p className="font-bold text-sm text-slate-900">Leaderboard Participation</p>
                    <p className="text-xs text-slate-500">Show nickname &amp; avatar on child-safe board</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={player.parentControls.leaderboardEnabled}
                    onClick={() =>
                      updateParentControls({
                        leaderboardEnabled: !player.parentControls.leaderboardEnabled,
                      })
                    }
                    className={`rounded-full px-4 py-1.5 font-display text-xs font-bold ${
                      player.parentControls.leaderboardEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {player.parentControls.leaderboardEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div>
                    <p className="font-bold text-sm text-slate-900">Allow Friend Code Requests</p>
                    <p className="text-xs text-slate-500">Positive High-Fives only; no DMs ever</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={player.parentControls.allowFriendRequests}
                    onClick={() =>
                      updateParentControls({
                        allowFriendRequests: !player.parentControls.allowFriendRequests,
                      })
                    }
                    className={`rounded-full px-4 py-1.5 font-display text-xs font-bold ${
                      player.parentControls.allowFriendRequests
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {player.parentControls.allowFriendRequests ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Account Deletion Request */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-slate-900">Privacy &amp; Data Deletion</p>
                  <p className="text-xs text-slate-500">
                    Request complete removal of local &amp; cloud learning profile data at any time.
                  </p>
                </div>

                {player.parentControls.deletionRequested ? (
                  <span className="rounded-xl bg-amber-50 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-900">
                    Deletion Request Logged
                  </span>
                ) : confirmDeleteStep ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateParentControls({ deletionRequested: true });
                        setConfirmDeleteStep(false);
                      }}
                      className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white"
                    >
                      Confirm Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteStep(false)}
                      className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStep(true)}
                    className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-700 inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Request Account Deletion</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
