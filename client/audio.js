// ==========================================
// GlimmerFall Online 2D — 16-Bit Chiptune SFX & Polyphonic Procedural BGM Engine
// Zones & Themes:
//   - 'sanctuary' : Awakening Sanctuary Haven (Pixel Overloop / ethereal starlight)
//   - 'solari'    : Lantern District & Golden Citadel (Daybreak at the Sunspire)
//   - 'umbri'     : Sepulcher Undercity & Duskveil Bog (Shadows in the Sepulcher)
//   - 'terra'     : Glimmer Orchard & Rootdeep Expanse (The Rootdeep Hymn)
//   - 'aether'    : Mirrorgate Spire & Continuum (Mirrorgate Continuum)
//   - 'abyss'     : Starfall Crater & Abyssal Rift (Cataclysm at Starfall)
//   - 'warzone'   : Nexus Continental Caldera (Heroic Battle March)
//   - 'boss'      : World Boss / Siege Monolith / 3v3 Climax (Nexus Climax Tracker)
// ==========================================

export const BGM_THEMES = {
  sanctuary: {
    name: 'Pixel Overloop (Sanctuary Haven)',
    audioFile: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/sanctuary_pixel_overloop.m4a',
    stepMs: 240,
    leadType: 'triangle',
    harmonyType: 'sine',
    bassType: 'triangle',
    leadGain: 0.045,
    harmonyGain: 0.022,
    bassGain: 0.04,
    lead: [
      587.33, 739.99, 880.0, 1174.66, 880.0, 739.99, 659.25, 739.99,
      587.33, 659.25, 880.0, 1108.73, 987.77, 880.0, 739.99, 659.25,
      587.33, 739.99, 880.0, 1174.66, 1318.51, 1174.66, 987.77, 880.0,
      739.99, 880.0, 1108.73, 1174.66, 880.0, 739.99, 659.25, 587.33,
    ],
    harmony: [
      293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 329.63, 369.99,
      293.66, 329.63, 440.0, 554.37, 493.88, 440.0, 369.99, 329.63,
      293.66, 369.99, 440.0, 587.33, 659.25, 587.33, 493.88, 440.0,
      369.99, 440.0, 554.37, 587.33, 440.0, 369.99, 329.63, 293.66,
    ],
    bass: [
      146.83, 0, 220.0, 0, 185.0, 0, 220.0, 0,
      164.81, 0, 246.94, 0, 185.0, 0, 146.83, 0,
      146.83, 0, 220.0, 0, 196.0, 0, 220.0, 0,
      164.81, 0, 220.0, 0, 185.0, 0, 146.83, 0,
    ],
    perc: [
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, 'hat', 'hat',
      'kick', null, 'hat', null, 'snare', null, 'hat', null,
      'kick', 'kick', 'hat', null, 'snare', null, 'cymbal', null,
    ],
  },
  solari: {
    name: 'Daybreak at the Sunspire (Golden Citadel)',
    stepMs: 175,
    leadType: 'square',
    harmonyType: 'triangle',
    bassType: 'triangle',
    leadGain: 0.038,
    harmonyGain: 0.024,
    bassGain: 0.048,
    lead: [
      587.33, 739.99, 880.0, 1174.66, 880.0, 739.99, 783.99, 880.0,
      987.77, 880.0, 783.99, 739.99, 659.25, 587.33, 659.25, 739.99,
      880.0, 987.77, 1174.66, 1318.51, 1174.66, 987.77, 880.0, 739.99,
      659.25, 739.99, 880.0, 987.77, 1174.66, 880.0, 739.99, 587.33,
    ],
    harmony: [
      293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 392.0, 440.0,
      493.88, 440.0, 392.0, 369.99, 329.63, 293.66, 329.63, 369.99,
      440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 369.99,
      329.63, 369.99, 440.0, 493.88, 587.33, 440.0, 369.99, 293.66,
    ],
    bass: [
      146.83, 146.83, 220.0, 146.83, 196.0, 196.0, 246.94, 196.0,
      220.0, 220.0, 277.18, 220.0, 146.83, 220.0, 293.66, 146.83,
      146.83, 146.83, 220.0, 146.83, 196.0, 196.0, 246.94, 196.0,
      220.0, 220.0, 277.18, 220.0, 146.83, 196.0, 220.0, 146.83,
    ],
    perc: [
      'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
      'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'cymbal',
      'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
      'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'cymbal',
    ],
  },
  umbri: {
    name: 'Shadows in the Sepulcher (Umbri Undercity)',
    stepMs: 215,
    leadType: 'triangle',
    harmonyType: 'sine',
    bassType: 'sine',
    leadGain: 0.042,
    harmonyGain: 0.02,
    bassGain: 0.052,
    lead: [
      369.99, 440.0, 554.37, 659.25, 587.33, 554.37, 493.88, 554.37,
      440.0, 415.3, 369.99, 349.23, 369.99, 415.3, 440.0, 493.88,
      554.37, 493.88, 440.0, 415.3, 369.99, 349.23, 329.63, 349.23,
      369.99, 440.0, 493.88, 554.37, 493.88, 440.0, 415.3, 369.99,
    ],
    harmony: [
      185.0, 220.0, 277.18, 329.63, 293.66, 277.18, 246.94, 277.18,
      220.0, 207.65, 185.0, 174.61, 185.0, 207.65, 220.0, 246.94,
      277.18, 246.94, 220.0, 207.65, 185.0, 174.61, 164.81, 174.61,
      185.0, 220.0, 246.94, 277.18, 246.94, 220.0, 207.65, 185.0,
    ],
    bass: [
      92.5, 0, 138.59, 0, 146.83, 0, 123.47, 0,
      103.83, 0, 138.59, 0, 92.5, 0, 82.41, 0,
      92.5, 0, 138.59, 0, 146.83, 0, 123.47, 0,
      103.83, 0, 138.59, 0, 92.5, 0, 82.41, 0,
    ],
    perc: [
      'kick', null, null, 'hat', 'snare', null, 'hat', null,
      'kick', null, 'hat', null, 'snare', null, null, 'hat',
      'kick', null, null, 'hat', 'snare', null, 'hat', null,
      'kick', 'kick', null, 'hat', 'snare', null, 'hat', 'cymbal',
    ],
  },
  terra: {
    name: 'The Rootdeep Hymn (Terra Orchard)',
    stepMs: 195,
    leadType: 'triangle',
    harmonyType: 'triangle',
    bassType: 'triangle',
    leadGain: 0.042,
    harmonyGain: 0.022,
    bassGain: 0.045,
    lead: [
      329.63, 392.0, 440.0, 493.88, 587.33, 493.88, 440.0, 392.0,
      440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 329.63,
      392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 659.25, 587.33,
      493.88, 440.0, 392.0, 329.63, 293.66, 329.63, 392.0, 329.63,
    ],
    harmony: [
      164.81, 196.0, 220.0, 246.94, 293.66, 246.94, 220.0, 196.0,
      220.0, 246.94, 293.66, 329.63, 293.66, 246.94, 220.0, 164.81,
      196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 329.63, 293.66,
      246.94, 220.0, 196.0, 164.81, 146.83, 164.81, 196.0, 164.81,
    ],
    bass: [
      82.41, 0, 123.47, 82.41, 98.0, 0, 146.83, 98.0,
      110.0, 0, 164.81, 110.0, 123.47, 0, 185.0, 123.47,
      82.41, 0, 123.47, 82.41, 98.0, 0, 146.83, 98.0,
      110.0, 0, 164.81, 110.0, 82.41, 98.0, 123.47, 82.41,
    ],
    perc: [
      'kick', null, 'hat', 'hat', 'snare', null, 'hat', null,
      'kick', 'kick', 'hat', null, 'snare', null, 'hat', 'hat',
      'kick', null, 'hat', 'hat', 'snare', null, 'hat', null,
      'kick', null, 'snare', 'hat', 'kick', 'hat', 'snare', 'cymbal',
    ],
  },
  aether: {
    name: 'Mirrorgate Continuum (Aether Spire)',
    stepMs: 160,
    leadType: 'sine',
    harmonyType: 'sine',
    bassType: 'triangle',
    leadGain: 0.046,
    harmonyGain: 0.024,
    bassGain: 0.045,
    lead: [
      880.0, 1046.5, 1318.51, 1567.98, 1396.91, 1174.66, 1318.51, 1046.5,
      987.77, 1174.66, 1396.91, 1318.51, 1046.5, 880.0, 987.77, 783.99,
      880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 1567.98, 1318.51,
      1174.66, 1046.5, 987.77, 880.0, 783.99, 880.0, 1046.5, 880.0,
    ],
    harmony: [
      440.0, 523.25, 659.25, 783.99, 698.46, 587.33, 659.25, 523.25,
      493.88, 587.33, 698.46, 659.25, 523.25, 440.0, 493.88, 392.0,
      440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25,
      587.33, 523.25, 493.88, 440.0, 392.0, 440.0, 523.25, 440.0,
    ],
    bass: [
      110.0, 164.81, 110.0, 196.0, 174.61, 130.81, 174.61, 164.81,
      146.83, 220.0, 146.83, 130.81, 164.81, 246.94, 329.63, 164.81,
      110.0, 164.81, 110.0, 196.0, 174.61, 130.81, 174.61, 164.81,
      146.83, 220.0, 146.83, 130.81, 110.0, 164.81, 220.0, 110.0,
    ],
    perc: [
      'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
      'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'cymbal', 'hat',
      'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
      'kick', 'kick', 'hat', 'hat', 'snare', 'hat', 'cymbal', 'hat',
    ],
  },
  abyss: {
    name: 'Cataclysm at Starfall (Abyssal Rift)',
    stepMs: 185,
    leadType: 'sawtooth',
    harmonyType: 'triangle',
    bassType: 'sawtooth',
    leadGain: 0.03,
    harmonyGain: 0.02,
    bassGain: 0.048,
    lead: [
      311.13, 369.99, 440.0, 523.25, 493.88, 415.3, 329.63, 349.23,
      311.13, 369.99, 440.0, 523.25, 587.33, 523.25, 440.0, 369.99,
      329.63, 349.23, 415.3, 493.88, 440.0, 369.99, 311.13, 293.66,
      311.13, 369.99, 440.0, 493.88, 440.0, 369.99, 329.63, 311.13,
    ],
    harmony: [
      155.56, 185.0, 220.0, 261.63, 246.94, 207.65, 164.81, 174.61,
      155.56, 185.0, 220.0, 261.63, 293.66, 261.63, 220.0, 185.0,
      164.81, 174.61, 207.65, 246.94, 220.0, 185.0, 155.56, 146.83,
      155.56, 185.0, 220.0, 246.94, 220.0, 185.0, 164.81, 155.56,
    ],
    bass: [
      77.78, 77.78, 55.0, 77.78, 130.81, 130.81, 92.5, 130.81,
      123.47, 123.47, 82.41, 123.47, 103.83, 103.83, 77.78, 103.83,
      77.78, 77.78, 55.0, 77.78, 130.81, 130.81, 92.5, 130.81,
      123.47, 123.47, 82.41, 123.47, 77.78, 82.41, 92.5, 77.78,
    ],
    perc: [
      'kick', null, null, 'hat', 'snare', null, 'kick', null,
      'kick', null, 'hat', 'hat', 'snare', null, 'cymbal', null,
      'kick', null, null, 'hat', 'snare', null, 'kick', null,
      'kick', 'kick', 'hat', 'hat', 'snare', null, 'cymbal', 'snare',
    ],
  },
  warzone: {
    name: 'Continental Caldera (Heroic Battle)',
    stepMs: 165,
    leadType: 'square',
    harmonyType: 'triangle',
    bassType: 'triangle',
    leadGain: 0.032,
    harmonyGain: 0.024,
    bassGain: 0.055,
    lead: [
      440.0, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
      493.88, 0, 392.0, 440.0, 523.25, 493.88, 440.0, 0,
      523.25, 587.33, 659.25, 783.99, 880.0, 0, 783.99, 659.25,
      587.33, 523.25, 493.88, 440.0, 392.0, 440.0, 523.25, 440.0,
    ],
    harmony: [
      220.0, 0, 261.63, 293.66, 329.63, 0, 293.66, 261.63,
      246.94, 0, 196.0, 220.0, 261.63, 246.94, 220.0, 0,
      261.63, 293.66, 329.63, 392.0, 440.0, 0, 392.0, 329.63,
      293.66, 261.63, 246.94, 220.0, 196.0, 220.0, 261.63, 220.0,
    ],
    bass: [
      110.0, 110.0, 220.0, 110.0, 130.81, 130.81, 261.63, 130.81,
      98.0, 98.0, 196.0, 98.0, 110.0, 146.83, 164.81, 110.0,
      110.0, 110.0, 220.0, 110.0, 130.81, 130.81, 261.63, 130.81,
      98.0, 98.0, 196.0, 98.0, 110.0, 130.81, 146.83, 110.0,
    ],
    perc: [
      'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
      'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'cymbal',
      'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
      'kick', 'kick', 'snare', 'snare', 'kick', 'hat', 'cymbal', 'snare',
    ],
  },
  boss: {
    name: 'Nexus Climax (World Boss & Siege)',
    stepMs: 130,
    leadType: 'square',
    harmonyType: 'sawtooth',
    bassType: 'sawtooth',
    leadGain: 0.034,
    harmonyGain: 0.02,
    bassGain: 0.042,
    lead: [
      659.25, 783.99, 987.77, 783.99, 659.25, 739.99, 880.0, 739.99,
      587.33, 698.46, 880.0, 698.46, 619.25, 739.99, 987.77, 1318.51,
      1174.66, 987.77, 880.0, 783.99, 987.77, 880.0, 783.99, 659.25,
      587.33, 659.25, 783.99, 880.0, 987.77, 1174.66, 1318.51, 1567.98,
    ],
    harmony: [
      329.63, 392.0, 493.88, 392.0, 329.63, 369.99, 440.0, 369.99,
      293.66, 349.23, 440.0, 349.23, 309.63, 369.99, 493.88, 659.25,
      587.33, 493.88, 440.0, 392.0, 493.88, 440.0, 392.0, 329.63,
      293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99,
    ],
    bass: [
      164.81, 164.81, 329.63, 164.81, 146.83, 146.83, 293.66, 146.83,
      130.81, 130.81, 261.63, 130.81, 123.47, 146.83, 185.0, 246.94,
      164.81, 164.81, 329.63, 164.81, 146.83, 146.83, 293.66, 146.83,
      130.81, 130.81, 261.63, 130.81, 164.81, 196.0, 246.94, 329.63,
    ],
    perc: [
      'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'cymbal',
      'kick', 'hat', 'snare', 'hat', 'kick', 'snare', 'snare', 'cymbal',
      'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'cymbal',
      'kick', 'kick', 'snare', 'snare', 'kick', 'snare', 'cymbal', 'snare',
    ],
  },
};

export class PixelSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmMuted = false;
    this.bgmTheme = 'sanctuary';
    this.bgmStep = 0;
    this.bgmTimer = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.trackEl = null;
    this.currentTrackUrl = null;
    this.masterVolume = this.readVolume('glimmerfall_vol_master', 0.8);
    this.musicVolume = this.readVolume('glimmerfall_vol_music', 0.65);
    this.sfxVolume = this.readVolume('glimmerfall_vol_sfx', 0.8);
    this.resumeMode = this.readResumeMode('always');
    this.themePositions = {};
    try {
      this.bgmMuted = localStorage.getItem('glimmerfall_bgm_muted') === '1';
    } catch (_) {}
  }

  readVolume(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const saved = Number(raw);
      if (Number.isFinite(saved)) return Math.max(0, Math.min(1, saved));
    } catch (_) {}
    return fallback;
  }

  readResumeMode(fallback = 'always') {
    try {
      const val = localStorage.getItem('glimmerfall_bgm_resume_mode');
      if (val && ['always', 'within_5m', 'within_15m', 'restart'].includes(val)) {
        return val;
      }
    } catch (_) {}
    return fallback;
  }

  getResumeMode() {
    return this.resumeMode;
  }

  setResumeMode(mode) {
    if (['always', 'within_5m', 'within_15m', 'restart'].includes(mode)) {
      this.resumeMode = mode;
      try {
        localStorage.setItem('glimmerfall_bgm_resume_mode', mode);
      } catch (_) {}
    }
    return this.resumeMode;
  }

  saveThemePosition(theme = this.bgmTheme) {
    if (!theme) return;
    let currentTime = 0;
    if (this.trackEl && Number.isFinite(this.trackEl.currentTime) && this.trackEl.currentTime > 0) {
      currentTime = this.trackEl.currentTime;
    }
    this.themePositions[theme] = {
      time: currentTime,
      step: this.bgmStep || 0,
      savedAt: Date.now(),
    };
  }

  shouldResumeTheme(theme) {
    if (this.resumeMode === 'restart') return false;
    const pos = this.themePositions[theme];
    if (!pos) return false;
    const elapsedMs = Date.now() - (pos.savedAt || 0);
    if (this.resumeMode === 'within_5m') {
      return elapsedMs <= 5 * 60 * 1000;
    }
    if (this.resumeMode === 'within_15m') {
      return elapsedMs <= 15 * 60 * 1000;
    }
    // 'always'
    return true;
  }

  resetRoomPositions() {
    this.themePositions = {};
  }

  ensureGainNodes() {
    if (!this.ctx || this.masterGain) return;
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.musicGain.gain.value = this.musicVolume;
    this.sfxGain.gain.value = this.sfxVolume;
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.ensureGainNodes();
    if (!this.bgmTimer && !this.bgmMuted) {
      this.startBgmLoop();
    }
  }

  getVolumes() {
    return {
      master: Math.round(this.masterVolume * 100),
      music: Math.round(this.musicVolume * 100),
      sfx: Math.round(this.sfxVolume * 100),
    };
  }

  setVolume(channel, percent) {
    const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0))) / 100;
    if (channel === 'master') this.masterVolume = value;
    else if (channel === 'music') this.musicVolume = value;
    else if (channel === 'sfx') this.sfxVolume = value;
    else return null;
    if (this.ctx) {
      this.ensureGainNodes();
      const now = this.ctx.currentTime;
      const target = channel === 'master' ? this.masterGain : channel === 'music' ? this.musicGain : this.sfxGain;
      target?.gain.setTargetAtTime(value, now, 0.02);
    }
    if (this.trackEl) {
      this.trackEl.volume = this.bgmMuted ? 0 : Math.max(0, Math.min(1, this.musicVolume * this.masterVolume));
    }
    try {
      localStorage.setItem(`glimmerfall_vol_${channel}`, String(value));
    } catch (_) {}
    return Math.round(value * 100);
  }

  playTrackAudio(url, loop = true, startTime = 0) {
    if (this.bgmMuted || this.muted) return;
    if (typeof window === 'undefined') return;
    try {
      if (!this.trackEl) {
        this.trackEl = new Audio();
      }
      if (this.currentTrackUrl === url && !this.trackEl.paused) return;

      this.currentTrackUrl = url;
      const needsSrcChange = this.trackEl.src !== url;
      if (needsSrcChange) {
        this.trackEl.src = url;
      }
      this.trackEl.loop = loop;
      this.trackEl.volume = Math.max(0, Math.min(1, this.musicVolume * this.masterVolume));

      const seekAndPlay = () => {
        if (startTime > 0 && Number.isFinite(startTime)) {
          try {
            if (this.trackEl.duration && Number.isFinite(this.trackEl.duration) && this.trackEl.duration > 0) {
              this.trackEl.currentTime = startTime % this.trackEl.duration;
            } else {
              this.trackEl.currentTime = startTime;
            }
          } catch (_) {}
        }
        const playPromise = this.trackEl.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            console.warn('[AudioEngine] Track audio playback deferred/fallback:', err.message);
            this.startBgmLoop();
          });
        }
      };

      if (needsSrcChange && startTime > 0 && this.trackEl.readyState < 1) {
        this.trackEl.addEventListener('loadedmetadata', () => {
          seekAndPlay();
        }, { once: true });
      } else {
        seekAndPlay();
      }
    } catch (err) {
      console.warn('[AudioEngine] playTrackAudio error:', err);
      this.startBgmLoop();
    }
  }

  stopTrackAudio(resetPosition = false) {
    if (this.trackEl) {
      try {
        this.trackEl.pause();
        if (resetPosition) {
          this.trackEl.currentTime = 0;
        }
      } catch (_) {}
    }
    this.currentTrackUrl = null;
  }

  setBgmEnabled(enabled) {
    this.bgmMuted = !Boolean(enabled);
    try {
      localStorage.setItem('glimmerfall_bgm_muted', this.bgmMuted ? '1' : '0');
    } catch (_) {}
    if (this.bgmMuted) {
      this.stopTrackAudio(false);
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    } else {
      this.init();
      this.setBgmTheme(this.bgmTheme);
    }
    return !this.bgmMuted;
  }

  setBgmTheme(theme) {
    const next = BGM_THEMES[theme] ? theme : 'sanctuary';
    if (this.bgmTheme === next && (this.bgmTimer || (this.trackEl && !this.trackEl.paused))) {
      return;
    }

    // 1. Save current position of outgoing theme before switching
    if (this.bgmTheme) {
      this.saveThemePosition(this.bgmTheme);
    }

    // 2. Stop audio and clear timer without erasing position map
    this.stopTrackAudio(false);
    clearInterval(this.bgmTimer);
    this.bgmTimer = null;

    // 3. Determine resume timestamp or step
    const canResume = this.shouldResumeTheme(next);
    const savedPos = canResume ? (this.themePositions[next] || { time: 0, step: 0 }) : { time: 0, step: 0 };

    this.bgmTheme = next;
    this.bgmStep = savedPos.step || 0;

    if (this.ctx && !this.bgmMuted) {
      const spec = BGM_THEMES[next];
      if (spec?.audioFile && typeof window !== 'undefined') {
        this.playTrackAudio(spec.audioFile, true, savedPos.time || 0);
      } else {
        this.startBgmLoop();
      }
    }
  }

  toggleBgm() {
    return this.setBgmEnabled(this.bgmMuted);
  }

  startBgmLoop() {
    clearInterval(this.bgmTimer);
    if (this.bgmMuted || this.muted) return;
    const spec = BGM_THEMES[this.bgmTheme] || BGM_THEMES.sanctuary;
    const patternLen = spec.lead?.length || 16;

    this.bgmTimer = setInterval(() => {
      if (this.bgmMuted || this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const idx = this.bgmStep % patternLen;
      this.bgmStep++;

      const leadFreq = spec.lead?.[idx];
      const harmFreq = spec.harmony?.[idx];
      const bassFreq = spec.bass?.[idx];
      const percType = spec.perc?.[idx];
      const dur = (spec.stepMs / 1000) * 0.85;

      if (leadFreq > 0) {
        this.playTrackerNote(spec.leadType || 'triangle', leadFreq, dur, spec.leadGain || 0.04);
      }
      if (harmFreq > 0) {
        this.playTrackerNote(spec.harmonyType || 'sine', harmFreq, dur * 0.9, spec.harmonyGain || 0.022);
      }
      if (bassFreq > 0) {
        this.playTrackerNote(spec.bassType || 'triangle', bassFreq, dur * 0.95, spec.bassGain || 0.045);
      }
      if (percType) {
        this.playTrackerPerc(percType, dur);
      }
    }, spec.stepMs);
  }

  playTrackerNote(type, freq, dur, gainVal, destNode) {
    if (!this.ctx || !freq) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal || 0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(gain);
    gain.connect(destNode || this.musicGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  playTrackerPerc(type, dur = 0.08) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.musicGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'snare') {
      this.playNoise({ duration: 0.11, bandpassFreq: 1800, endFreq: 400, gainVal: 0.04 });
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.musicGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'hat') {
      this.playNoise({ duration: 0.035, bandpassFreq: 6500, endFreq: 5000, gainVal: 0.022 });
    } else if (type === 'cymbal' || type === 'openhat') {
      this.playNoise({ duration: 0.22, bandpassFreq: 5200, endFreq: 3400, gainVal: 0.032 });
    }
  }

  playTone({ type = 'square', freqs = [440], stepTime = 0.04, gainVal = 0.14, delay = 0 }) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const totalDur = freqs.length * stepTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    freqs.forEach((f, idx) => {
      osc.frequency.setValueAtTime(f, now + idx * stepTime);
    });

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + totalDur);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + totalDur + 0.01);
  }

  playNoise({ duration = 0.15, bandpassFreq = 900, endFreq = 120, gainVal = 0.22 }) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let hold = 0;
    for (let i = 0; i < bufferSize; i++) {
      if (i % 6 === 0) hold = Math.random() > 0.5 ? 0.9 : -0.9;
      data[i] = hold;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(bandpassFreq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    src.start(now);
  }

  playSlash() {
    this.playNoise({ duration: 0.11, bandpassFreq: 1800, endFreq: 320, gainVal: 0.18 });
    this.playTone({ type: 'square', freqs: [520, 390, 260, 180], stepTime: 0.025, gainVal: 0.12 });
  }

  playHit(isCrit = false) {
    this.playNoise({ duration: isCrit ? 0.22 : 0.12, bandpassFreq: 650, endFreq: 80, gainVal: 0.25 });
    if (isCrit) {
      this.playTone({ type: 'square', freqs: [220, 440, 660, 140], stepTime: 0.035, gainVal: 0.18 });
    } else {
      this.playTone({ type: 'triangle', freqs: [180, 110, 70], stepTime: 0.035, gainVal: 0.22 });
    }
  }

  playSpell() {
    this.playTone({
      type: 'square',
      freqs: [440, 554.37, 659.25, 880, 1108.73, 1318.51],
      stepTime: 0.035,
      gainVal: 0.14,
    });
  }

  playHammer() {
    this.playTone({
      type: 'square',
      freqs: [330, 440, 587.33, 440, 659.25],
      stepTime: 0.03,
      gainVal: 0.14,
    });
  }

  playFreeze() {
    this.playNoise({ duration: 0.18, bandpassFreq: 2600, endFreq: 900, gainVal: 0.16 });
    this.playTone({
      type: 'triangle',
      freqs: [1046.5, 1318.5, 1567.98, 2093.0],
      stepTime: 0.032,
      gainVal: 0.14,
    });
  }

  playStealth() {
    this.playNoise({ duration: 0.2, bandpassFreq: 700, endFreq: 180, gainVal: 0.15 });
    this.playTone({
      type: 'triangle',
      freqs: [392.0, 311.13, 261.63, 196.0],
      stepTime: 0.04,
      gainVal: 0.13,
    });
  }

  playDrain() {
    this.playTone({
      type: 'sawtooth',
      freqs: [246.94, 293.66, 369.99, 493.88, 369.99],
      stepTime: 0.038,
      gainVal: 0.11,
    });
  }

  playChime() {
    this.playTone({
      type: 'square',
      freqs: [523.25, 659.25, 783.99, 1046.5],
      stepTime: 0.065,
      gainVal: 0.14,
    });
    this.playTone({
      type: 'triangle',
      freqs: [261.63, 329.63, 392.0, 523.25],
      stepTime: 0.065,
      gainVal: 0.16,
    });
  }

  playPickup() {
    this.playTone({ type: 'square', freqs: [880, 1174.66, 1567.98], stepTime: 0.045, gainVal: 0.11 });
  }

  playSmokePuff() {
    this.playNoise({ duration: 0.38, bandpassFreq: 520, endFreq: 65, gainVal: 0.28 });
    this.playTone({ type: 'triangle', freqs: [196, 164.8, 130.8, 98, 65.4], stepTime: 0.06, gainVal: 0.18 });
  }

  playDash() {
    this.playNoise({ duration: 0.14, bandpassFreq: 2200, endFreq: 500, gainVal: 0.16 });
    this.playTone({ type: 'square', freqs: [660, 880, 1174, 440], stepTime: 0.03, gainVal: 0.12 });
  }

  playShield() {
    this.playTone({
      type: 'square',
      freqs: [293.66, 369.99, 440, 587.33, 739.99],
      stepTime: 0.045,
      gainVal: 0.13,
    });
  }

  playZenith() {
    this.playNoise({ duration: 0.35, bandpassFreq: 900, endFreq: 90, gainVal: 0.28 });
    this.playTone({
      type: 'square',
      freqs: [146.83, 220, 293.66, 440, 587.33, 880, 1174.66],
      stepTime: 0.045,
      gainVal: 0.18,
    });
  }

  playJump() {
    this.playTone({ type: 'square', freqs: [220, 300, 400, 520], stepTime: 0.025, gainVal: 0.1 });
  }

  playPortal() {
    this.playTone({
      type: 'square',
      freqs: [330, 392, 493.88, 659.25, 783.99, 987.77, 1318.5],
      stepTime: 0.045,
      gainVal: 0.15,
    });
  }

  playLevelUp() {
    this.playTone({
      type: 'square',
      freqs: [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51],
      stepTime: 0.075,
      gainVal: 0.17,
    });
    this.playTone({
      type: 'triangle',
      freqs: [261.63, 329.63, 392.0, 523.25, 392.0, 523.25, 659.25],
      stepTime: 0.075,
      gainVal: 0.18,
    });
  }

  playQuestCompleteFanfare() {
    this.init();
    if (!this.ctx || this.muted) return;
    // Continental Quest Complete Fanfare (C4 - E4 - G4 - C5 - E5 - G5 - C6)
    const leadNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    const bassNotes = [130.81, 164.81, 196.0, 261.63, 329.63, 392.0, 523.25];
    this.playTone({
      type: 'square',
      freqs: leadNotes,
      stepTime: 0.085,
      gainVal: 0.2,
    });
    this.playTone({
      type: 'triangle',
      freqs: bassNotes,
      stepTime: 0.085,
      gainVal: 0.22,
    });
    // Add a final ringing harmonic chord
    setTimeout(() => {
      if (!this.ctx || this.muted) return;
      this.playTone({
        type: 'triangle',
        freqs: [1046.5, 1318.51, 1567.98],
        stepTime: 0.28,
        gainVal: 0.17,
      });
    }, 600);
  }

  playDialogue() {
    this.playTone({ type: 'square', freqs: [620, 740], stepTime: 0.025, gainVal: 0.08 });
  }

  playChatPop() {
    this.playTone({ type: 'triangle', freqs: [520, 680], stepTime: 0.022, gainVal: 0.09 });
  }

  playEmote() {
    this.playTone({ type: 'square', freqs: [587.33, 739.99, 880], stepTime: 0.038, gainVal: 0.11 });
  }

  playBannerPlant() {
    this.playNoise({ duration: 0.1, bandpassFreq: 520, endFreq: 160, gainVal: 0.18 });
    this.playTone({ type: 'square', freqs: [293.66, 440, 587.33, 880], stepTime: 0.055, gainVal: 0.14 });
  }

  playPartyInvite() {
    this.playTone({ type: 'square', freqs: [659.25, 880, 1046.5], stepTime: 0.05, gainVal: 0.13 });
  }
}
