import type { AudioSettings } from '../types/game';

/**
 * Synthesized Web Audio sound engine for FUNLEARN AI.
 * Strictly never autoplays before first user interaction.
 */
class FunLearnSoundEngine {
  private ctx: AudioContext | null = null;
  private hasInteracted = false;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private settings: AudioSettings = {
    soundEnabled: true,
    musicEnabled: false,
    sfxVolume: 0.7,
    musicVolume: 0.25,
    reducedMotion: false,
  };

  public unlock() {
    this.hasInteracted = true;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.syncMusicLoop();
  }

  public updateSettings(next: AudioSettings) {
    this.settings = { ...next };
    this.syncMusicLoop();
  }

  private getContext(): AudioContext | null {
    if (!this.hasInteracted || !this.settings.soundEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    delay = 0,
    gainScale = 0.28
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const vol = Math.max(0.001, gainScale * this.settings.sfxVolume);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(540, 0.06, 'triangle', 0, 0.16);
  }

  public playCorrect() {
    // Pleasant sparkling bell arpeggio
    this.playTone(587.33, 0.18, 'triangle', 0, 0.25); // D5
    this.playTone(739.99, 0.18, 'triangle', 0.08, 0.25); // F#5
    this.playTone(880.0, 0.32, 'sine', 0.16, 0.3); // A5
    this.playTone(1174.66, 0.4, 'sine', 0.24, 0.22); // D6
  }

  public playWrong() {
    // Soft gentle marimba nudge
    this.playTone(280, 0.14, 'sine', 0, 0.2);
    this.playTone(220, 0.22, 'sine', 0.12, 0.18);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    notes.forEach((n, i) => this.playTone(n, 0.26, 'triangle', times[i], 0.26));
  }

  public playLevelUp() {
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((n, i) => this.playTone(n, 0.32, 'triangle', i * 0.09, 0.26));
  }

  public playTreasure() {
    const notes = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];
    notes.forEach((n, i) => this.playTone(n, 0.28, 'sine', i * 0.075, 0.28));
  }

  public playScratch() {
    this.playTone(900 + Math.random() * 500, 0.04, 'triangle', 0, 0.08);
  }

  public playHighFive() {
    this.playTone(659.25, 0.1, 'triangle', 0, 0.26);
    this.playTone(987.77, 0.24, 'sine', 0.09, 0.28);
  }

  private syncMusicLoop() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (!this.hasInteracted || !this.settings.soundEnabled || !this.settings.musicEnabled) {
      return;
    }

    // Gentle cheerful pentatonic chime melody
    const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.0];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.settings.soundEnabled || !this.settings.musicEnabled) return;
      const freq = melody[this.musicStep % melody.length];
      this.musicStep += 1;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const vol = Math.max(0.001, 0.1 * this.settings.musicVolume);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }, 650);
  }
}

export const soundEngine = new FunLearnSoundEngine();
