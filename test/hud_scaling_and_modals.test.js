import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getUiScale } from '../client/uiLayout.js';

test('getUiScale prevents HUD bloat and panel overlap across 1920p, 720p, and iPad viewports', () => {
  const prevWin = globalThis.window;
  try {
    globalThis.window = { innerWidth: 1920, innerHeight: 1080 };
    assert.equal(getUiScale().scale, 1.25);

    globalThis.window = { innerWidth: 1280, innerHeight: 720 };
    assert.equal(getUiScale().scale, 0.92);

    globalThis.window = { innerWidth: 1024, innerHeight: 768 };
    assert.equal(getUiScale().scale, 0.92);

    globalThis.window = { innerWidth: 820, innerHeight: 1180 };
    assert.equal(getUiScale().scale, 0.88);
  } finally {
    if (prevWin === undefined) delete globalThis.window;
    else globalThis.window = prevWin;
  }
});

test('HUD CSS scales top-center banners dynamically below micro-menu and compacts iPad portrait nav', () => {
  const hudCss = fs.readFileSync(new URL('../client/styles/hud.css', import.meta.url), 'utf8');
  assert.ok(hudCss.includes('top: calc(14px + 42px * var(--hud-scale, 1));'));
  assert.ok(hudCss.includes('top: calc(58px + 44px * var(--hud-scale, 1));'));
  assert.ok(hudCss.includes('@media (max-width: 900px)'));
});

test('Modals restore focus and wire Escape dismissal for Activity Finder, Hero Share, Hub, GearBag, and Rune Puzzle', () => {
  const gameJs = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  const hubJs = fs.readFileSync(new URL('../client/game/unifiedMenuHub.js', import.meta.url), 'utf8');
  const shareJs = fs.readFileSync(new URL('../client/game/heroCardShare.js', import.meta.url), 'utf8');
  const puzzleJs = fs.readFileSync(new URL('../client/game/puzzlesAndInteriors.js', import.meta.url), 'utf8');

  assert.ok(gameJs.includes('#gf-activity-finder-modal') && gameJs.includes('#gf-hero-share-modal'));
  assert.ok(gameJs.includes('closeActivityFinder') && gameJs.includes('closeHeroShareCard'));
  assert.ok(hubJs.includes('captureFocusTarget') && hubJs.includes('restoreFocusTarget'));
  assert.ok(shareJs.includes('hideOverlayModal') && shareJs.includes('lastOverlayFocus'));
  assert.ok(puzzleJs.includes('lastFocusBeforeOpen') && puzzleJs.includes('closeModal'));
});
