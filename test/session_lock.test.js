import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isActiveGameOrLoadoutTab,
  normalizeLandingTabId,
  resolveBootSurface,
  shouldReconnectOnReclaim,
  shouldShowSessionSupersededForClaim,
} from '../client/game/sessionLockHelpers.js';
import { LandingPageController } from '../client/landing.js';
import { FrontpageController } from '../client/frontpage.js';

test('Cross-tab session lock leaves Landing Page and Skill Guides open while enforcing Loadout and In-Game locks', () => {
  // Tab only viewing Landing Page or Skill Guides is NEVER canceled by another tab
  assert.equal(
    isActiveGameOrLoadoutTab({
      hasEnteredWorld: false,
      isFrontpageOpen: false,
      isLandingOpen: true,
      netConnected: false,
    }),
    false
  );
  assert.equal(
    shouldShowSessionSupersededForClaim({
      hasEnteredWorld: false,
      isFrontpageOpen: false,
      isLandingOpen: true,
      netConnected: false,
    }),
    false
  );

  // Tab inside Hero Loadout IS canceled/prompted when another tab claims session
  assert.equal(
    shouldShowSessionSupersededForClaim({
      hasEnteredWorld: false,
      isFrontpageOpen: true,
      isLandingOpen: false,
      netConnected: false,
    }),
    true
  );

  // Tab currently In-Game IS canceled/prompted when another tab enters Hero Loadout or In-Game
  assert.equal(
    shouldShowSessionSupersededForClaim({
      hasEnteredWorld: true,
      isFrontpageOpen: false,
      isLandingOpen: false,
      netConnected: false,
    }),
    true
  );

  // Even if player pressed [J] inside an active world session, an active world session participates
  assert.equal(
    shouldShowSessionSupersededForClaim({
      hasEnteredWorld: true,
      isFrontpageOpen: false,
      isLandingOpen: true,
      netConnected: true,
    }),
    true
  );
});

test('Boot surface routing opens Skill Guides / Landing cleanly in a separate tab even when Start on this site is enabled', () => {
  const skillsBoot = resolveBootSurface({
    startOnLoadout: true,
    search: '?tab=skills',
    pathname: '/',
  });
  assert.equal(skillsBoot.surface, 'landing');
  assert.equal(skillsBoot.requestedTab, 'skills');

  const skillsAliasBoot = resolveBootSurface({
    startOnLoadout: true,
    search: '?tab=skill-guides',
    pathname: '/',
  });
  assert.equal(skillsAliasBoot.surface, 'landing');
  assert.equal(skillsAliasBoot.requestedTab, 'skills');

  const landingPathBoot = resolveBootSurface({
    startOnLoadout: true,
    search: '?tab=skills',
    pathname: '/landing',
  });
  assert.equal(landingPathBoot.surface, 'landing');

  const defaultLoadoutBoot = resolveBootSurface({
    startOnLoadout: true,
    search: '',
    pathname: '/',
  });
  assert.equal(defaultLoadoutBoot.surface, 'loadout');

  const explicitLoadoutBoot = resolveBootSurface({
    startOnLoadout: false,
    search: '?loadout=1',
    pathname: '/',
  });
  assert.equal(explicitLoadoutBoot.surface, 'loadout');
});

test('Opening FrontpageController (Hero Loadout) triggers session claim hook, whereas LandingPageController does not', () => {
  let claims = 0;
  const fp = new FrontpageController({
    net: null,
    audio: null,
    onOpen() {
      claims += 1;
    },
  });
  fp.open();
  assert.equal(fp.isOpen, true);
  assert.equal(claims, 1);

  const landing = new LandingPageController({ frontpage: fp });
  landing.open('skills');
  assert.equal(landing.activeTab, normalizeLandingTabId('skill-guides'));
  // Opening Landing/Skill Guides does NOT claim session (and closes loadout if returning before world entry)
  assert.equal(claims, 1);
  assert.equal(fp.isOpen, false);
});

test('shouldReconnectOnReclaim only reconnects multiplayer when reclaiming active/online session', () => {
  assert.equal(
    shouldReconnectOnReclaim({ isSinglePlayer: true, hasEnteredWorld: true, frontpagePlayMode: 'singleplayer' }),
    false
  );
  assert.equal(
    shouldReconnectOnReclaim({ isSinglePlayer: false, hasEnteredWorld: true, frontpagePlayMode: 'multiplayer' }),
    true
  );
  assert.equal(
    shouldReconnectOnReclaim({ isSinglePlayer: false, hasEnteredWorld: false, frontpagePlayMode: 'multiplayer' }),
    true
  );
});

test('game.js, index.html, and landing page wire cross-tab Skill Guides & Session Active overlay protections', () => {
  const gameSrc = fs.readFileSync(path.join(process.cwd(), 'client', 'game.js'), 'utf8');
  const htmlSrc = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const nextPageSrc = fs.readFileSync(path.join(process.cwd(), 'landing', 'src', 'app', 'page.jsx'), 'utf8');

  assert.ok(gameSrc.includes('shouldShowSessionSupersededForClaim'));
  assert.ok(gameSrc.includes("claimActiveTabSession('loadout')"));
  assert.ok(gameSrc.includes("claimActiveTabSession('ingame')"));
  assert.ok(gameSrc.includes('switchSupersededTabToSkillGuides'));
  assert.ok(gameSrc.includes('resolveBootSurface'));
  assert.ok(htmlSrc.includes('requestedTab'));
  assert.ok(htmlSrc.includes('switchSupersededTabToSkillGuides'));
  assert.ok(nextPageSrc.includes("params.get('tab')"));
});
