import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gift, Info, Sparkles, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { isScratchRevealed, rollVirtualReward, SCRATCH_REWARD_TABLE } from '../game/rewardEngine';
import type { ScratchRewardOption } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { ConfettiBurst } from './CelebrationOverlay';

export const ScratchCardModal: React.FC = () => {
  const { activeScratchCard, closeScratchCard, applyScratchReward, player, isOffline } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const scratchedCountRef = useRef(0);

  const [reward, setReward] = useState<ScratchRewardOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [showOdds, setShowOdds] = useState(false);

  const drawFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(0.5, '#F97316');
    grad.addColorStop(1, '#EC4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative subtle star dots on foil
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = 22; x < w; x += 38) {
      for (let y = 20; y < h; y += 34) {
        ctx.beginPath();
        ctx.arc(x + ((y / 34) % 2) * 14, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH HERE TO WIN!', w / 2, h / 2 - 4);
    ctx.font = '600 13px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText('Rub with your mouse or finger', w / 2, h / 2 + 22);
  }, []);

  // Fetch verified reward from backend (or deterministic offline fallback if offline)
  useEffect(() => {
    if (!activeScratchCard) return;
    let cancelled = false;
    setRevealed(false);
    setScratchPercent(0);
    setError(null);
    setReward(null);
    scratchedCountRef.current = 0;

    async function loadServerReward() {
      if (!activeScratchCard) return;
      setLoading(true);
      try {
        if (isOffline) {
          const offlineRoll = rollVirtualReward(Math.random() * 100);
          if (!cancelled) setReward(offlineRoll);
          return;
        }
        const res = await fetch('/api/rewards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.uid.replace(/[^a-zA-Z0-9_-]/g, ''),
            challengeInstanceId: activeScratchCard.challengeInstanceId.replace(/[^a-zA-Z0-9_-]/g, ''),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.alreadyClaimed) {
            if (!cancelled) setError('This scratch card was already claimed!');
            return;
          }
          throw new Error(data.error || 'Could not unlock scratch reward');
        }
        if (!cancelled) {
          setReward(data.reward as ScratchRewardOption);
        }
      } catch {
        // Resilient local fallback if backend offline
        if (!cancelled) {
          setReward(rollVirtualReward(Math.random() * 100));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadServerReward();
    return () => {
      cancelled = true;
    };
  }, [activeScratchCard, isOffline, player.uid]);

  useEffect(() => {
    if (reward && !revealed) {
      drawFoil();
    }
  }, [reward, revealed, drawFoil]);

  const triggerReveal = useCallback(() => {
    if (!activeScratchCard || !reward || revealed) return;
    setRevealed(true);
    setScratchPercent(100);
    soundEngine.playTreasure();
    applyScratchReward(activeScratchCard.challengeInstanceId, reward);
  }, [activeScratchCard, reward, revealed, applyScratchReward]);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    scratchedCountRef.current += 1;
    if (scratchedCountRef.current % 4 === 0) {
      soundEngine.playScratch();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      const totalPixels = canvas.width * canvas.height;
      for (let i = 3; i < imageData.length; i += 16) {
        if (imageData[i] < 128) cleared += 1;
      }
      const ratio = cleared / (totalPixels / 4);
      const pct = Math.min(100, Math.round(ratio * 100));
      setScratchPercent(pct);
      if (isScratchRevealed(ratio, 0.42)) {
        triggerReveal();
      }
    }
  };

  if (!activeScratchCard) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scratch and Win Virtual Reward Card"
    >
      <ConfettiBurst active={revealed} reducedMotion={player.audio.reducedMotion} />

      <div className="card-toy rounded-3xl max-w-md w-full p-6 relative animate-fun-pop">
        <button
          type="button"
          onClick={closeScratchCard}
          aria-label="Close scratch card"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 pr-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
            <Gift className="w-4 h-4" />
            <span>Virtual Educational Reward</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Scratch &amp; Win Card
          </h2>
          <p className="text-sm text-slate-600">{activeScratchCard.sourceTitle}</p>
        </div>

        <div className="mt-5">
          {loading && (
            <div className="h-48 rounded-2xl bg-amber-50 flex flex-col items-center justify-center gap-2 text-amber-700 font-semibold">
              <Sparkles className="w-7 h-7 animate-spin" />
              <span>Preparing your lucky card...</span>
            </div>
          )}

          {error && (
            <div className="h-48 rounded-2xl bg-rose-50 border-2 border-rose-200 flex flex-col items-center justify-center p-4 text-center">
              <p className="font-display text-lg font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={closeScratchCard}
                className="btn-3d mt-4 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-bold"
              >
                Back to Games
              </button>
            </div>
          )}

          {reward && !error && (
            <div className="relative rounded-2xl overflow-hidden border-4 border-amber-300 shadow-inner bg-gradient-to-br from-amber-50 via-white to-sky-50 h-48 select-none">
              {/* Revealed Reward Underneath */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2"
                  style={{ backgroundColor: reward.color }}
                >
                  <Sparkles className="w-7 h-7" />
                </div>
                <p className="font-display text-2xl font-bold text-slate-900">{reward.label}</p>
                <p className="text-sm text-slate-600 mt-1">{reward.description}</p>
              </div>

              {/* Scratch Foil Canvas */}
              {!revealed && (
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={192}
                  data-testid="scratch-card-canvas"
                  onPointerDown={(e) => {
                    isDrawingRef.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    scratchAt(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (!isDrawingRef.current) return;
                    scratchAt(e.clientX, e.clientY);
                  }}
                  onPointerUp={() => {
                    isDrawingRef.current = false;
                  }}
                  className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                />
              )}
            </div>
          )}
        </div>

        {/* Progress & Accessible Reveal Action */}
        {reward && !error && (
          <div className="mt-4 space-y-3">
            {!revealed ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  Scratched: {scratchPercent}%
                </span>
                <button
                  type="button"
                  onClick={triggerReveal}
                  className="btn-3d rounded-xl bg-amber-500 border-b-4 border-amber-700 px-4 py-2 text-sm font-display font-bold text-white"
                >
                  Instant Reveal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={closeScratchCard}
                className="btn-3d w-full rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 px-6 py-3 font-display text-lg font-bold text-white"
              >
                Awesome! Collect Reward
              </button>
            )}

            {/* Transparent Odds Disclosure */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOdds((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showOdds ? 'Hide reward probabilities' : 'View virtual reward probabilities (100% free & educational)'}</span>
              </button>
              {showOdds && (
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  {SCRATCH_REWARD_TABLE.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.label}</span>
                      <span className="font-mono font-bold text-slate-800 tabular-nums">
                        {item.probability}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
