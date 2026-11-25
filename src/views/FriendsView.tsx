import React, { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Hand,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { computeLevelInfo } from '../game/xpEngine';
import { AvatarBadge } from '../components/AvatarBadge';
import { soundEngine } from '../utils/soundEngine';

const CHEER_LABELS: Record<'high_five' | 'awesome_job' | 'keep_going', string> = {
  high_five: 'sent a High-Five!',
  awesome_job: 'cheered "Awesome Job!"',
  keep_going: 'cheered "Keep Going!"',
};

export const FriendsView: React.FC = () => {
  const {
    player,
    sendFriendRequestByCode,
    respondToFriendRequest,
    sendHighFive,
  } = usePlayer();

  const [codeInput, setCodeInput] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [highFiveBurstUid, setHighFiveBurstUid] = useState<string | null>(null);

  const handleCopyCode = async () => {
    soundEngine.playClick();
    try {
      await navigator.clipboard.writeText(player.friendCode);
    } catch {
      // Clipboard API may be restricted in iframe preview; still confirm visually
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim() || submitting) return;
    setSubmitting(true);
    setRequestFeedback(null);
    const result = await sendFriendRequestByCode(codeInput);
    setRequestFeedback(result);
    if (result.ok) {
      setCodeInput('');
    }
    setSubmitting(false);
  };

  const handleTriggerHighFive = (
    friendUid: string,
    cheerType: 'high_five' | 'awesome_job' | 'keep_going' = 'high_five'
  ) => {
    sendHighFive(friendUid, cheerType);
    setHighFiveBurstUid(friendUid);
    window.setTimeout(() => {
      setHighFiveBurstUid((prev) => (prev === friendUid ? null : prev));
    }, 1100);
  };

  return (
    <div className="space-y-6 animate-fun-pop">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Explorer Friends Club
          </h1>
          <p className="text-slate-600 mt-1">
            Connect safely using unique Friend Codes, cheer on achievements, and send High-Fives!
          </p>
        </div>

        <div className="card-toy rounded-2xl px-4 py-2.5 flex items-center gap-3 self-start">
          <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-bold text-slate-700 tabular-nums">
            {player.friends.length} Friends · {player.highFivesSent} High-Fives Sent
          </div>
        </div>
      </div>

      {/* Child Safety & Privacy Shield */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3 text-sm text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="font-semibold">
          Safe Social Space: Only explorer nicknames, levels, and badges are visible. Direct messaging is disabled—only positive High-Fives and preset cheers are allowed!
        </p>
      </div>

      {/* My Friend Code + Add Friend by Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Share My Code */}
        <div className="card-toy rounded-3xl p-6 space-y-4 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/60">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Your Unique Alphanumeric Code
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Share With Classmates &amp; Friends
            </h2>
          </div>

          <div className="rounded-2xl bg-white border-2 border-blue-200 p-4 flex items-center justify-between gap-3">
            <span
              data-testid="my-friend-code"
              className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-blue-700"
            >
              {player.friendCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn-3d rounded-xl bg-blue-600 border-b-4 border-blue-800 px-4 py-2 font-display text-sm font-bold text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Your display nickname is <strong className="text-slate-900">{player.nickname}</strong>. You can update your nickname anytime in My Profile.
          </p>
        </div>

        {/* Add a Friend Form */}
        <div className="card-toy rounded-3xl p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Add a New Explorer
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Enter a Friend Code
            </h2>
          </div>

          {!player.parentControls.allowFriendRequests ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm font-semibold text-amber-900">
              Friend requests are currently paused in the Parent Dashboard. Ask a grown-up to enable them in Settings.
            </div>
          ) : (
            <form onSubmit={handleAddFriend} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <label htmlFor="friend-code-input" className="sr-only">
                  Friend Code
                </label>
                <input
                  id="friend-code-input"
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="FUN-BRAIN-7731"
                  maxLength={16}
                  className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-mono text-base font-bold uppercase tracking-wider text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting || !codeInput.trim()}
                  className="btn-3d rounded-2xl bg-indigo-600 border-b-4 border-indigo-800 disabled:opacity-50 px-5 py-3 font-display font-bold text-white inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Add Friend'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>Try a sample code:</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCodeInput('FUN-BRAIN-7731');
                  }}
                  className="font-mono font-bold text-blue-700 underline hover:text-blue-900"
                >
                  FUN-BRAIN-7731
                </button>
              </div>

              {requestFeedback && (
                <div
                  role="status"
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 ${
                    requestFeedback.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {requestFeedback.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 shrink-0" />
                  )}
                  <span>{requestFeedback.message}</span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Incoming Friend Requests */}
      {player.incomingRequests.length > 0 && player.parentControls.allowFriendRequests && (
        <section className="card-toy rounded-3xl p-6 space-y-4 border-amber-200 bg-amber-50/40">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Incoming Friend Requests ({player.incomingRequests.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {player.incomingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl bg-white border-2 border-amber-200 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarBadge avatarId={req.fromAvatarId} size="md" />
                  <div className="min-w-0">
                    <p className="font-display font-bold text-slate-900 truncate">
                      {req.fromNickname}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      Level {req.fromLevel} · Code {req.fromCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => respondToFriendRequest(req.id, true)}
                    className="btn-3d rounded-xl bg-emerald-600 border-b-4 border-emerald-800 px-3.5 py-2 font-display text-xs font-bold text-white"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToFriendRequest(req.id, false)}
                    aria-label={`Decline request from ${req.fromNickname}`}
                    className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends Grid with Levels, Recent Achievements & High-Five Button */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <span>Your Learning Friends ({player.friends.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {player.friends.map((friend) => {
            const friendLvl = computeLevelInfo(friend.xp);
            const isBursting = highFiveBurstUid === friend.uid;
            return (
              <div
                key={friend.uid}
                className="card-toy rounded-3xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarBadge
                        avatarId={friend.avatarId}
                        accessoryId={friend.accessoryId}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold text-slate-900 truncate">
                          {friend.nickname}
                        </h3>
                        <p className="text-xs font-bold text-blue-700">
                          Level {friend.level} · {friendLvl.title}
                        </p>
                        <p className="text-xs font-mono font-bold text-slate-500 tabular-nums">
                          {friend.xp} XP
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                      {friend.friendCode}
                    </span>
                  </div>

                  {/* Recent Achievements */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Recent Achievements
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {friend.recentAchievements.map((ach) => (
                        <span
                          key={ach}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>{ach}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* High-Five Action Row */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleTriggerHighFive(friend.uid, 'high_five')}
                    className={`btn-3d w-full rounded-2xl border-b-4 py-2.5 px-4 font-display text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                      isBursting
                        ? 'bg-emerald-500 border-emerald-700 scale-[1.02]'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500 border-orange-700'
                    }`}
                  >
                    <Hand className="w-4 h-4" />
                    <span>
                      {isBursting ? 'High-Five Sent!' : 'Send High-Five!'}
                    </span>
                    {friend.highFivesSentByMe > 0 && (
                      <span className="ml-1 rounded-lg bg-black/15 px-2 py-0.5 text-xs font-mono tabular-nums">
                        {friend.highFivesSentByMe}
                      </span>
                    )}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerHighFive(friend.uid, 'awesome_job')}
                      className="rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 py-1.5 text-xs font-bold text-slate-700"
                    >
                      Awesome Job!
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerHighFive(friend.uid, 'keep_going')}
                      className="rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 py-1.5 text-xs font-bold text-slate-700"
                    >
                      Keep Going!
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Positive Encouragement Feed */}
      <section className="card-toy rounded-3xl p-6 space-y-3">
        <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
          <Hand className="w-5 h-5 text-orange-500" />
          <span>Recent High-Fives &amp; Cheers</span>
        </h2>
        <div className="divide-y divide-slate-100">
          {player.highFiveLogs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="py-2.5 flex items-center justify-between gap-2 text-sm"
            >
              <p className="text-slate-700">
                <strong className="font-display text-slate-900">{log.fromNickname}</strong>{' '}
                {CHEER_LABELS[log.cheerType]}{' '}
                <strong className="font-display text-blue-700">{log.toNickname}</strong>
              </p>
              <span className="text-xs text-slate-400 font-semibold shrink-0">
                {new Date(log.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
