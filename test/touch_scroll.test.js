import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('iPad Touch & Finger Scrolling Verification: touchmove is unrestricted on landing and UI', () => {
  const touchJsSrc = fs.readFileSync(new URL('../client/touch.js', import.meta.url), 'utf8');

  // Verify touchmove does not globally preventDefault
  assert.ok(
    touchJsSrc.includes('const landingEl = document.getElementById(\'landing-overlay\');'),
    'touch.js must inspect if landing overlay is visible'
  );
  assert.ok(
    touchJsSrc.includes('.landing-overlay, #landing-overlay, #frontpage-overlay'),
    'touch.js must exclude landing and frontpage overlays from preventDefault'
  );

  const landingCss = fs.readFileSync(new URL('../client/styles/landing.css', import.meta.url), 'utf8');
  assert.ok(landingCss.includes('overflow-y: scroll !important;'), 'landing.css must force overflow-y: scroll for iOS WebKit async scrolling layer');
  assert.ok(landingCss.includes('-webkit-overflow-scrolling: touch !important;'), 'landing.css must enable iOS momentum touch scrolling');
  assert.ok(landingCss.includes('touch-action: pan-y !important;'), 'landing.css must configure touch-action: pan-y');
});

test('Phone & iPad Playability: Double-tap / double-click to extract never zooms the viewport', () => {
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(
    indexHtml.includes('maximum-scale=1.0') && indexHtml.includes('user-scalable=no'),
    'index.html viewport meta must disable pinch/double-tap browser zoom'
  );

  const baseCss = fs.readFileSync(new URL('../client/styles/base.css', import.meta.url), 'utf8');
  assert.ok(baseCss.includes('touch-action: manipulation;'), 'base.css must set touch-action: manipulation on HUD and buttons');
  assert.ok(baseCss.includes('touch-action: none;'), 'base.css must set touch-action: none on game canvas');

  const touchJsSrc = fs.readFileSync(new URL('../client/touch.js', import.meta.url), 'utf8');
  assert.ok(touchJsSrc.includes("document.addEventListener('dblclick', blockZoomGesture"), 'touch.js must block dblclick zoom on canvas and HUD');
  assert.ok(touchJsSrc.includes("document.addEventListener('touchend'"), 'touch.js must guard rapid touchend events against iOS smart zoom');
  assert.ok(touchJsSrc.includes('touch-btn-interact'), 'touch.js must include dedicated ACT / NPC touch button');

  const gameJsSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  assert.ok(gameJsSrc.includes("canvas.addEventListener('pointerdown'"), 'game.js must handle touch pointerdown directly on canvas with 0ms delay');
  assert.ok(gameJsSrc.includes('autoWalkTarget') && gameJsSrc.includes('autoHarvestNodeId'), 'game.js must support tap-to-walk and auto-harvest channeling');
});
