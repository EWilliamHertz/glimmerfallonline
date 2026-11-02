// ==========================================
// GlimmerFall Online 2D — 16-Bit Chiptune SFX & Procedural BGM Engine
// Themes:
//   - 'sanctuary' : Awakening Isle (ethereal starlight arpeggios)
//   - 'warzone'   : Nexus Warzone & Faction Biomes (heroic battle pulse)
//   - 'boss'      : World Boss / Siege / 3v3 Climax (driving climax tracker)
// ==========================================

const BGM_THEMES = {
  sanctuary: {
    stepMs: 240,
    leadType: 'triangle',
    bassType: 'triangle',
    leadGain: 0.045,
    bassGain: 0.04,
    lead: [
      587.33, 739.99, 880.0, 1174.66, 880.0, 739.99, 659.25, 739.99,
      587.33, 659.25, 880.0, 1108.73, 987.77, 880.0, 739.99, 659.25,
    ],
    bass: [
      146.83, 0, 220.0, 0, 185.0, 0, 220.0, 0,
      164.81, 0, 246.94, 0, 185.0, 0, 146.83, 0,
    ],
  },
  warzone: {
    stepMs: 165,
    leadType: 'square',
    bassType: 'triangle',
    leadGain: 0.032,
    bassGain: 0.055,
    lead: [
      440.0, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
      493.88, 0, 392.0, 440.0, 523.25, 493.88, 440.0, 0,
    ],
    bass: [
      110.0, 110.0, 220.0, 110.0, 130.81, 130.81, 261.63, 130.81,
      98.0, 98.0, 196.0, 98.0, 110.0, 146.83, 164.81, 110.0,
    ],
  },
  boss: {
    stepMs: 130,
    leadType: 'square',
    bassType: 'sawtooth',
    leadGain: 0.034,
    bassGain: 0.042,
    lead: [
      659.25, 783.99, 987.77, 783.99, 659.25, 739.99, 880.0, 739.99,
      587.33, 698.46, 880.0, 698.46, 619.25, 739.99, 987.77, 1318.51,
    ],
    bass: [
      164.81, 164.81, 329.63, 164.81, 146.83, 146.83, 293.66, 146.83,
      130.81, 130.81, 261.63, 130.81, 123.47, 146.83, 185.0, 246.94,
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
    try {
      this.bgmMuted = localStorage.getItem('glimmerfall_bgm_muted') === '1';
    } catch (_) {}
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.bgmTimer && !this.bgmMuted) {
      this.startBgmLoop();
    }
  }

  setBgmTheme(theme) {
    const next = BGM_THEMES[theme] ? theme : 'sanctuary';
    if (this.bgmTheme === next && this.bgmTimer) return;
    this.bgmTheme = next;
    this.bgmStep = 0;
    if (this.ctx && !this.bgmMuted) {
      this.startBgmLoop();
    }
  }

  toggleBgm() {
    this.init();
    this.bgmMuted = !this.bgmMuted;
    try {
      localStorage.setItem('glimmerfall_bgm_muted', this.bgmMuted ? '1' : '0');
    } catch (_) {}
    if (this.bgmMuted) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    } else {
      this.startBgmLoop();
    }
    return !this.bgmMuted;
  }

  startBgmLoop() {
    clearInterval(this.bgmTimer);
    if (this.bgmMuted || this.muted) return;
    const spec = BGM_THEMES[this.bgmTheme] || BGM_THEMES.sanctuary;

    this.bgmTimer = setInterval(() => {
      if (this.bgmMuted || this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const idx = this.bgmStep % spec.lead.length;
      this.bgmStep++;

      const leadFreq = spec.lead[idx];
      const bassFreq = spec.bass[idx];
      const dur = (spec.stepMs / 1000) * 0.85;

      if (leadFreq > 0) {
        this.playTrackerNote(spec.leadType, leadFreq, dur, spec.leadGain);
      }
      if (bassFreq > 0) {
        this.playTrackerNote(spec.bassType, bassFreq, dur * 0.95, spec.bassGain);
      }
    }, spec.stepMs);
  }

  playTrackerNote(type, freq, dur, gainVal) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
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
    gain.connect(this.ctx.destination);
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
    gain.connect(this.ctx.destination);
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
