import React, { useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Flame,
  Gamepad2,
  Lock,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { ACCESSORY_CATALOG, AVATAR_CATALOG } from '../data/assets';
import { ACHIEVEMENTS_CATALOG } from '../data/achievements';
import { computeLevelInfo } from '../game/xpEngine';
import type { Subject } from '../types/game';
import { AvatarBadge } from '../components/AvatarBadge';
import { soundEngine } from '../utils/soundEngine';

const ALL_SUBJECTS: Subject[] = [
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

export const ProfileView: React.FC = () => {
  const { player, updateProfile } = usePlayer();
  const [nicknameDraft, setNicknameDraft] = useState(player.nickname);
  const [savedBanner, setSavedBanner] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const levelInfo = computeLevelInfo(player.xp);
  const unlockedBadges = ACHIEVEMENTS_CATALOG.filter((a) =>
    player.unlockedAchievements.includes(a.id)
  );

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nicknameDraft.trim().slice(0, 24);
    if (cleaned.length < 2) return;
    soundEngine.playCorrect();
    updateProfile({ nickname: cleaned });
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 2000);
  };

  const toggleSubject = (sub: Subject) => {
    soundEngine.playClick();
    const exists = player.selectedSubjects.includes(sub);
    if (exists && player.selectedSubjects.length <= 1) return;
    const next = exists
      ? player.selectedSubjects.filter((s) => s !== sub)
      : [...player.selectedSubjects, sub];
    updateProfile({ selectedSubjects: next });
  };

  const handleCopyCode = async () => {
    soundEngine.playClick();
    try {
      await navigator.clipboard.writeText(player.friendCode);
    } catch {
      // Clipboard may be unavailable
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fun-pop">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          My Explorer Profile &amp; Avatar Studio
        </h1>
        <p className="text-slate-600 mt-1">
          Customize your character, pick your favourite subjects, and track your learning milestones.
        </p>
      </div>

      {/* Hero Profile Summary + Stats */}
      <div className="card-toy rounded-3xl p-6 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 flex items-center gap-5">
          <AvatarBadge
            avatarId={player.avatarId}
            accessoryId={player.accessoryId}
            size="xl"
          />
          <div className="space-y-1.5 min-w-0">
            <h2 className="font-display text-2xl font-bold text-slate-900 truncate">
              {player.nickname}
            </h2>
            <p className="text-sm font-bold text-blue-700">
              Level {levelInfo.level} · {levelInfo.title}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Class {player.gradeClass} Explorer
            </p>
            <button
              type="button"
              onClick={handleCopyCode}
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 px-3 py-1 font-mono text-xs font-bold text-slate-800"
            >
              <span>{player.friendCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3.5">
            <Zap className="w-4 h-4 text-blue-600 mb-1" />
            <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
              {player.xp}
            </p>
            <p className="text-xs font-bold text-slate-600">Total XP</p>
          </div>
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-3.5">
            <Flame className="w-4 h-4 text-orange-500 mb-1" />
            <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
              {player.streak}d
            </p>
            <p className="text-xs font-bold text-slate-600">Daily Streak</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5">
            <Gamepad2 className="w-4 h-4 text-emerald-600 mb-1" />
            <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
              {player.gamesCompleted}
            </p>
            <p className="text-xs font-bold text-slate-600">Games Won</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5">
            <Award className="w-4 h-4 text-amber-600 mb-1" />
            <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
              {player.unlockedAchievements.length}/{ACHIEVEMENTS_CATALOG.length}
            </p>
            <p className="text-xs font-bold text-slate-600">Badges</p>
          </div>
        </div>
      </div>

      {/* Avatar & Accessories Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card-toy rounded-3xl p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Choose Your Character</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AVATAR_CATALOG.map((av) => {
              const unlocked = player.unlockedAvatars.includes(av.id);
              const active = player.avatarId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    soundEngine.playClick();
                    updateProfile({ avatarId: av.id });
                  }}
                  className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : unlocked
                      ? 'border-slate-200 bg-white hover:border-blue-300'
                      : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <AvatarBadge avatarId={av.id} accessoryId={player.accessoryId} size="md" />
                  <span className="font-display text-xs font-bold text-slate-900">{av.name}</span>
                  {!unlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <Lock className="w-3 h-3" /> Scratch Card
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-toy rounded-3xl p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Virtual Avatar Accessories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACCESSORY_CATALOG.map((acc) => {
              const active = player.accessoryId === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    updateProfile({ accessoryId: acc.id });
                  }}
                  className={`rounded-2xl border-2 p-3 flex flex-col items-center text-center gap-1.5 transition-all ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <AvatarBadge avatarId={player.avatarId} accessoryId={acc.id} size="sm" />
                  <span className="font-display text-xs font-bold text-slate-900">{acc.name}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {acc.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Explorer Details Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card-toy rounded-3xl p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Explorer Identity</span>
          </h2>

          <form onSubmit={handleSaveNickname} className="space-y-3">
            <label htmlFor="nickname-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Safe Display Nickname (No Real Full Name Needed)
            </label>
            <div className="flex gap-2.5">
              <input
                id="nickname-input"
                type="text"
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                minLength={2}
                maxLength={24}
                className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 font-display text-base font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="btn-3d rounded-2xl bg-blue-600 border-b-4 border-blue-800 px-5 py-2.5 font-display text-sm font-bold text-white whitespace-nowrap"
              >
                Save Name
              </button>
            </div>
            {savedBanner && (
              <p className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <Check className="w-4 h-4" /> Nickname updated!
              </p>
            )}
          </form>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Class / Grade
            </p>
            <div className="flex flex-wrap gap-2">
              {CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    updateProfile({ gradeClass: cls });
                  }}
                  className={`btn-3d rounded-xl border-2 px-4 py-2 font-display text-sm font-bold ${
                    player.gradeClass === cls
                      ? 'bg-blue-600 text-white border-blue-800 border-b-4'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Favourite Subjects
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map((sub) => {
                const selected = player.selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Badges Showcase */}
        <section className="card-toy rounded-3xl p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Unlocked Achievement Showcase
          </h2>
          {unlockedBadges.length === 0 ? (
            <p className="text-sm text-slate-600">
              Play any game to unlock your very first trophy badge!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unlockedBadges.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: b.accent }}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-slate-900 truncate">
                      {b.name}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{b.conditionText}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
