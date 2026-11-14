import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelSoundEngine, BGM_THEMES } from '../client/audio.js';

// Polyfill minimal browser environment if not present
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

test('PixelSoundEngine: BGM Resume modes, localStorage persistence, and room transition resumption', () => {
  localStorage.clear();
  const engine = new PixelSoundEngine();

  // 1. Default resume mode is 'always'
  assert.equal(engine.getResumeMode(), 'always');

  // 2. Set valid modes and ensure persistence
  engine.setResumeMode('within_5m');
  assert.equal(engine.getResumeMode(), 'within_5m');
  assert.equal(localStorage.getItem('glimmerfall_bgm_resume_mode'), 'within_5m');

  engine.setResumeMode('within_15m');
  assert.equal(engine.getResumeMode(), 'within_15m');

  engine.setResumeMode('restart');
  assert.equal(engine.getResumeMode(), 'restart');

  // Invalid mode should be ignored
  engine.setResumeMode('invalid_mode');
  assert.equal(engine.getResumeMode(), 'restart');

  // 3. Testing shouldResumeTheme logic
  engine.setResumeMode('always');
  engine.bgmTheme = 'sanctuary';
  engine.bgmStep = 18;
  engine.saveThemePosition('sanctuary');

  assert.ok(engine.themePositions.sanctuary, 'Sanctuary position must be recorded');
  assert.equal(engine.themePositions.sanctuary.step, 18);
  assert.equal(engine.shouldResumeTheme('sanctuary'), true);

  // Unvisited theme should not resume
  assert.equal(engine.shouldResumeTheme('solari'), false);

  // In restart mode, should never resume
  engine.setResumeMode('restart');
  assert.equal(engine.shouldResumeTheme('sanctuary'), false);

  // In within_5m mode: fresh timestamp resumes, expired timestamp restarts
  engine.setResumeMode('within_5m');
  assert.equal(engine.shouldResumeTheme('sanctuary'), true);

  // Simulate 6 minutes having passed
  engine.themePositions.sanctuary.savedAt = Date.now() - (6 * 60 * 1000);
  assert.equal(engine.shouldResumeTheme('sanctuary'), false);

  // In within_15m mode: 6 minutes elapsed should resume
  engine.setResumeMode('within_15m');
  assert.equal(engine.shouldResumeTheme('sanctuary'), true);

  // Simulate 16 minutes elapsed: should not resume
  engine.themePositions.sanctuary.savedAt = Date.now() - (16 * 60 * 1000);
  assert.equal(engine.shouldResumeTheme('sanctuary'), false);
});

test('PixelSoundEngine: 4-Channel Polyphony (Lead, Harmony, Bass, Perc) across all 8 zones', () => {
  const zones = ['sanctuary', 'solari', 'umbri', 'terra', 'aether', 'abyss', 'warzone', 'boss'];

  for (const zone of zones) {
    const spec = BGM_THEMES[zone];
    assert.ok(spec, `Theme ${zone} must exist in BGM_THEMES`);
    assert.ok(spec.stepMs > 0, `Theme ${zone} stepMs must be positive`);

    // Verify 4 channels are defined
    assert.ok(Array.isArray(spec.lead), `Theme ${zone} must have lead array`);
    assert.ok(Array.isArray(spec.harmony), `Theme ${zone} must have harmony array`);
    assert.ok(Array.isArray(spec.bass), `Theme ${zone} must have bass array`);
    assert.ok(Array.isArray(spec.perc), `Theme ${zone} must have perc array`);

    // Minimum pattern length of 16 steps
    assert.ok(spec.lead.length >= 16, `Theme ${zone} lead must have at least 16 steps`);
    assert.ok(spec.harmony.length >= 16, `Theme ${zone} harmony must have at least 16 steps`);
    assert.ok(spec.bass.length >= 16, `Theme ${zone} bass must have at least 16 steps`);
    assert.ok(spec.perc.length >= 16, `Theme ${zone} perc must have at least 16 steps`);

    // Verify percussion types are valid
    const validPercs = new Set(['kick', 'snare', 'hat', 'cymbal', 'openhat', null]);
    for (const p of spec.perc) {
      assert.ok(validPercs.has(p), `Theme ${zone} perc contains unrecognized type: ${p}`);
    }
  }
});

test('PixelSoundEngine: init() never starts procedural bgmTimer on top of streamed audioFile tracks', () => {
  const prevWin = globalThis.window;
  const prevAudio = globalThis.Audio;
  try {
    globalThis.window = {
      AudioContext: class {
        constructor() { this.state = 'running'; this.currentTime = 0; }
        createGain() { return { gain: { value: 1, setValueAtTime() {}, setTargetAtTime() {} }, connect() {} }; }
        resume() {}
      },
    };
    globalThis.Audio = class {
      constructor() { this.src = ''; this.paused = false; this.readyState = 4; }
      play() { this.paused = false; return Promise.resolve(); }
      pause() { this.paused = true; }
      addEventListener() {}
    };

    const engine = new PixelSoundEngine();
    engine.bgmTheme = 'solari';
    engine.init();
    assert.equal(engine.bgmTimer, null, 'Procedural bgmTimer must remain null when streamed audioFile is active');
    assert.equal(engine.currentTrackUrl, BGM_THEMES.solari.audioFile);
  } finally {
    if (prevWin === undefined) delete globalThis.window; else globalThis.window = prevWin;
    if (prevAudio === undefined) delete globalThis.Audio; else globalThis.Audio = prevAudio;
  }
});

test('PixelSoundEngine: AbortError/NotAllowedError and rapid zone transitions never overlap procedural and streamed BGM', async () => {
  const prevWin = globalThis.window;
  const prevAudio = globalThis.Audio;
  try {
    globalThis.window = {
      AudioContext: class {
        constructor() { this.state = 'running'; this.currentTime = 0; }
        createGain() { return { gain: { value: 1, setValueAtTime() {}, setTargetAtTime() {} }, connect() {} }; }
        resume() {}
      },
    };
    const listeners = new Map();
    globalThis.Audio = class {
      constructor() { this.src = ''; this.paused = true; this.readyState = 0; this.playCount = 0; }
      play() {
        this.playCount++;
        this.paused = false;
        const err = new Error('The play() request was interrupted');
        err.name = this.playCount === 1 ? 'AbortError' : 'NotAllowedError';
        return Promise.reject(err);
      }
      pause() { this.paused = true; }
      addEventListener(ev, fn) { listeners.set(fn, ev); }
      removeEventListener(_ev, fn) { listeners.delete(fn); }
    };

    localStorage.clear();
    const engine = new PixelSoundEngine();
    engine.ctx = new globalThis.window.AudioContext();
    engine.setResumeMode('always');
    engine.themePositions.solari = { step: 0, time: 12 };

    engine.setBgmTheme('solari');
    assert.equal(listeners.size, 1, 'Should attach one loadedmetadata listener for deferred seek');

    // Rapidly switch to umbri before loadedmetadata fires
    engine.setBgmTheme('umbri');
    assert.equal(listeners.size, 0, 'Switching themes must remove stale loadedmetadata listener');

    await new Promise((r) => setTimeout(r, 10));
    assert.equal(engine.bgmTimer, null, 'AbortError/NotAllowedError must NOT start procedural bgmTimer');

    // Calling startBgmLoop must explicitly pause any active trackEl
    engine.trackEl.paused = false;
    engine.startBgmLoop();
    assert.equal(engine.trackEl.paused, true, 'startBgmLoop must pause trackEl for strict mutual exclusion');
    clearInterval(engine.bgmTimer);
    engine.bgmTimer = null;
    engine.stopTrackAudio(false);
  } finally {
    if (prevWin === undefined) delete globalThis.window; else globalThis.window = prevWin;
    if (prevAudio === undefined) delete globalThis.Audio; else globalThis.Audio = prevAudio;
  }
});
