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
