import React from 'react';
import { Check, Gem, Gift, Lock, Palette, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AVATAR_CATALOG, THEME_CATALOG } from '../data/assets';
import { SCRATCH_REWARD_TABLE } from '../game/rewardEngine';
import { AvatarBadge } from '../components/AvatarBadge';
import { soundEngine } from '../utils/soundEngine';

export const RewardsView: React.FC = () => {
  const { player, openScratchCard, updateProfile } = usePlayer();

  return (
    <div className="space-y-8 animate-fun-pop">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Rewards &amp; Scratch Vault</h1>
          <p className="text-slate-600 mt-1">
            100% free virtual educational rewards earned by learning—never any real-money purchases!
          </p>
        </div>
        <div className="card-toy rounded-2xl px-5 py-3 flex items-center gap-3">
          <Gem className="w-6 h-6 text-emerald-500" />
          <div>
            <p className="text-xs font-bold text-slate-500">Treasure Gems</p>
            <p className="font-display text-xl font-bold text-slate-900 tabular-nums">{player.gems}</p>
          </div>
        </div>
      </div>

      {/* Ready-to-Scratch Cards */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Gift className="w-6 h-6 text-orange-500" />
          <span>Ready Scratch &amp; Win Cards ({player.pendingScratchCards.length})</span>
        </h2>

        {player.pendingScratchCards.length === 0 ? (
          <div className="card-toy rounded-3xl p-6 text-center text-slate-600">
            Complete any game or Daily Challenge to unlock a shiny new Scratch &amp; Win card!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {player.pendingScratchCards.map((card) => (
              <div
                key={card.challengeInstanceId}
                className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-1 shadow-lg"
              >
                <div className="rounded-[21px] bg-white p-5 flex flex-col justify-between gap-4 h-full">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                      Unlocked Surprise Card
                    </span>
                    <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
                      {card.sourceTitle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      openScratchCard(card);
                    }}
                    className="btn-3d w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 border-b-4 border-orange-700 py-3 font-display font-bold text-white inline-flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Scratch &amp; Reveal!</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Game Themes & Avatars Vault */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-toy rounded-3xl p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <span>Game Themes</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {THEME_CATALOG.map((theme) => {
              const unlocked = player.unlockedThemes.includes(theme.id);
              const active = player.themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    soundEngine.playClick();
                    updateProfile({ themeId: theme.id });
                  }}
                  className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50'
                      : unlocked
                      ? 'border-slate-200 bg-white hover:border-blue-300'
                      : 'border-slate-200 bg-slate-100 opacity-65 cursor-not-allowed'
                  }`}
                >
                  <div
                    className="h-12 rounded-xl mb-2.5 shadow-inner"
                    style={{ background: theme.preview }}
                  />
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display font-bold text-sm text-slate-900">
                      {theme.name}
                    </span>
                    {active ? (
                      <Check className="w-4 h-4 text-blue-600" />
                    ) : !unlocked ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-toy rounded-3xl p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Transparent Scratch Card Odds
          </h2>
          <p className="text-xs text-slate-600">
            Every virtual Scratch &amp; Win card is verified on the server so every challenge can be claimed fairly once.
          </p>
          <div className="space-y-2">
            {SCRATCH_REWARD_TABLE.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-sm"
              >
                <span className="font-bold text-slate-800">{item.label}</span>
                <span className="font-mono font-bold text-blue-700 tabular-nums">
                  {item.probability}% chance
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claimed History & Avatars */}
      <section className="card-toy rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Your Explorer Characters
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
                className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 ${
                  active
                    ? 'border-blue-600 bg-blue-50'
                    : unlocked
                    ? 'border-slate-200 bg-white hover:border-blue-300'
                    : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                }`}
              >
                <AvatarBadge avatarId={av.id} accessoryId={player.accessoryId} size="md" />
                <span className="font-display text-xs font-bold text-slate-900">{av.name}</span>
                {!unlocked && <span className="text-[11px] font-bold text-slate-500">Scratch Unlock</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
