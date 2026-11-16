import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getXpForProfessionLevel } from '../shared/protocol.js';
import {
  DEFAULT_XP_TRACKER_IDLE_MS,
  formatCompactXp,
  formatDurationShort,
  computeSkillProgressSnapshot,
  createXpTrackerState,
  recordXpGain,
  toggleTrackerPin,
  dismissTrackerEntry,
  resetTrackerEntry,
  computeTrackerDerivedStats,
  getVisibleTrackers,
  setupXpTrackerHud,
} from '../client/game/xpTrackerHud.js';

function createMockElement(tagName = 'div') {
  const listeners = {};
  const el = {
    tagName: tagName.toUpperCase(),
    className: '',
    style: {},
    dataset: {},
    textContent: '',
    children: [],
    _innerHTML: '',
    set innerHTML(val) {
      this._innerHTML = String(val);
    },
    get innerHTML() {
      return this._innerHTML;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    dispatchEvent(ev) {
      for (const fn of listeners[ev.type] || []) fn(ev);
    },
    querySelector(sel) {
      // Support simple attribute queries used in xpTrackerHud tests
      if (sel.startsWith('[') && sel.endsWith(']')) {
        const attr = sel.slice(1, -1);
        return this._findByAttr(attr);
      }
      return null;
    },
    _findByAttr(attr) {
      if (this._innerHTML.includes(attr)) {
        return createMockElement('button');
      }
      return null;
    },
    getBoundingClientRect() {
      return { left: 1060, top: 260, width: 204, height: 54 };
    },
  };
  return el;
}

test('computeSkillProgressSnapshot computes accurate % XP and next-level bounds', () => {
  const lvl2Xp = getXpForProfessionLevel(2);
  const lvl3Xp = getXpForProfessionLevel(3);
  const midXp = Math.floor((lvl2Xp + lvl3Xp) / 2);

  const snap = computeSkillProgressSnapshot('resonance_extraction', midXp, 99);
  assert.equal(snap.level, 2);
  assert.equal(snap.nextLevel, 3);
  assert.equal(snap.isMaxed, false);
  assert.ok(snap.percent >= 48 && snap.percent <= 52, `Expected ~50%, got ${snap.percent}`);
  assert.equal(snap.xpRemaining, lvl3Xp - midXp);

  // Respects Free Trial cap (Lv. 10) cleanly
  const trialCapXp = getXpForProfessionLevel(10);
  const trialSnap = computeSkillProgressSnapshot('relic_forging', trialCapXp, 10);
  assert.equal(trialSnap.level, 10);
  assert.equal(trialSnap.isMaxed, true);
  assert.equal(trialSnap.percent, 100);
  assert.equal(trialSnap.xpRemaining, 0);
});

test('recordXpGain, derived stats & idle visibility behave like RuneLite XP Tracker', () => {
  const t0 = 1_000_000;
  let state = createXpTrackerState('skilling');

  // First gain crosses Lv. 1 -> Lv. 2 and tracks startLevel === 1 cleanly
  const lv2Xp = getXpForProfessionLevel(2);
  state = recordXpGain(state, {
    professionId: 'resonance_extraction',
    amount: lv2Xp + 15,
    totalXpAfter: lv2Xp + 15,
    levelCap: 99,
    nowMs: t0,
    reason: 'Starlight Flax',
  });

  // Combat XP stays hidden under default 'skilling' filter until toggled or pinned
  state = recordXpGain(state, {
    professionId: 'flashes',
    amount: 40,
    totalXpAfter: 40,
    levelCap: 99,
    nowMs: t0 + 1000,
    reason: 'Solar Slash',
  });

  let visible = getVisibleTrackers(state, t0 + 2000);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].professionId, 'resonance_extraction');
  assert.equal(visible[0].startLevel, 1);
  assert.equal(visible[0].level, 2);
  assert.equal(visible[0].nextLevel, 3);
  assert.equal(visible[0].levelsGained, 1);

  // Second skilling gain 30s later -> computes XP/hr, actions remaining, ETA
  state = recordXpGain(state, {
    professionId: 'resonance_extraction',
    amount: 35,
    totalXpAfter: lv2Xp + 50,
    levelCap: 99,
    nowMs: t0 + 30_000,
    reason: 'Sun-Copper Vein',
  });
  const derived = computeTrackerDerivedStats(state.entries.resonance_extraction, t0 + 30_000);
  assert.ok(derived.xpPerHour > 0);
  assert.equal(derived.actionsRemaining, Math.ceil(derived.xpRemaining / 35));
  assert.ok(derived.etaSeconds > 0);

  // Idle unpinned tracker fades away after DEFAULT_XP_TRACKER_IDLE_MS
  assert.equal(getVisibleTrackers(state, t0 + 30_000 + DEFAULT_XP_TRACKER_IDLE_MS + 10).length, 0);

  // Pinning keeps it visible even when idle, and switching to 'all' reveals Flashes
  state = toggleTrackerPin(state, 'resonance_extraction', t0 + 30_000);
  assert.equal(getVisibleTrackers({ ...state, filterMode: 'all' }, t0 + 100_000).length, 1); // Flashes expired, pinned stays!

  // Dismiss hides until next XP gain; reset clears session counters
  state = dismissTrackerEntry(state, 'resonance_extraction', t0 + 100_000);
  assert.equal(getVisibleTrackers(state, t0 + 100_500).length, 0);

  state = recordXpGain(state, {
    professionId: 'resonance_extraction',
    amount: 25,
    totalXpAfter: lv2Xp + 75,
    levelCap: 99,
    nowMs: t0 + 101_000,
  });
  state = resetTrackerEntry(state, 'resonance_extraction', lv2Xp + 75, 99, t0 + 101_000);
  assert.equal(state.entries.resonance_extraction.sessionXp, 0);
});

test('setupXpTrackerHud renders right-side cards with % progress and shows From->To tooltip on hover', () => {
  const dock = createMockElement('div');
  const tooltip = createMockElement('div');
  const mockDoc = {
    defaultView: { innerHeight: 900 },
    getElementById(id) {
      if (id === 'xp-tracker-dock') return dock;
      if (id === 'xp-tracker-tooltip') return tooltip;
      return null;
    },
    createElement(tag) {
      return createMockElement(tag);
    },
  };

  const hud = setupXpTrackerHud({
    doc: mockDoc,
    getProgression: () => ({ professions: { glimmerweaving: { xp: 120, level: 2 } } }),
    getLevelCap: () => 99,
  });
  assert.ok(hud);

  const lv2 = getXpForProfessionLevel(2);
  hud.recordGain({
    professionId: 'glimmerweaving',
    amount: 35,
    totalXpAfter: lv2 + 45,
    reason: 'Grilled Minnow',
  });

  assert.equal(dock.style.display, 'flex');
  assert.equal(dock.children.length, 2); // header + 1 skill card
  const card = dock.children[1];
  assert.match(card.innerHTML, /Glimmerweaving/);
  assert.match(card.innerHTML, /Lv\.2→3/);
  assert.match(card.innerHTML, /%/);

  // Hover reveals detailed RuneLite level from/to & XP breakdown tooltip
  card.dispatchEvent({ type: 'mouseenter' });
  assert.equal(tooltip.style.display, 'block');
  assert.match(tooltip.innerHTML, /Lv\. 2 → Lv\. 3/);
  assert.match(tooltip.innerHTML, /Remaining to Lv\.3/);
  assert.match(tooltip.innerHTML, /Grilled Minnow/);

  card.dispatchEvent({ type: 'mouseleave' });
  assert.equal(tooltip.style.display, 'none');

  assert.equal(formatCompactXp(28400), '28.4k');
  assert.equal(formatDurationShort(125), '2m 5s');
});

test('index.html, hud.css, game.js, and skillGuidesUi.js wire RuneLite XP Tracker cleanly', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'client/styles/hud.css'), 'utf8');
  const game = fs.readFileSync(path.join(root, 'client/game.js'), 'utf8');
  const guides = fs.readFileSync(path.join(root, 'client/game/skillGuidesUi.js'), 'utf8');

  assert.match(html, /id="xp-tracker-dock"/);
  assert.match(html, /id="xp-tracker-tooltip"/);
  assert.match(css, /#xp-tracker-dock/);
  assert.match(css, /#xp-tracker-tooltip/);
  assert.match(game, /setupXpTrackerHud/);
  assert.match(game, /xpTrackerHud\?\.recordGain/);
  assert.match(game, /window\.pinXpTracker/);
  assert.match(guides, /window\.pinXpTracker/);
});
