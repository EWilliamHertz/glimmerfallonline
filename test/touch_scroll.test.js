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
