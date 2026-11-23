import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { computeNextPingMs } from '../client/network.js';
import { renderPartyHud } from '../client/socialUi.js';
import { scheduleHudStackReflow } from '../client/uiLayout.js';
import { RoomManager } from '../server/roomManager.js';
import { ROOM_TYPES } from '../shared/protocol.js';

function createTrackedTextNode(initial = '') {
  let value = initial;
  return {
    writes: 0,
    get innerText() {
      return value;
    },
    set innerText(next) {
      this.writes += 1;
      value = String(next);
    },
  };
}

function createTrackedHtmlNode(initial = '') {
  let html = initial;
  const dataset = {};
  return {
    writes: 0,
    dataset,
    get innerHTML() {
      return html;
    },
    set innerHTML(next) {
      this.writes += 1;
      html = String(next);
    },
  };
}

test('computeNextPingMs prevents background/spike lock-in and recovers rapidly to ~20ms on localhost', () => {
  // Initial localhost ping sets clean baseline
  const baseline = computeNextPingMs({ prevPingMs: 0, sampleMs: 18, isLocal: true, isHidden: false });
  assert.equal(baseline, 18);

  // Hidden/throttled browser tab spike must not poison an existing baseline
  const hiddenSample = computeNextPingMs({ prevPingMs: 19, sampleMs: 920, isLocal: true, isHidden: true });
  assert.equal(hiddenSample, 19);

  // Gross localhost main-thread GC outlier (>1000ms) is ignored once baseline exists
  const gcOutlier = computeNextPingMs({ prevPingMs: 20, sampleMs: 1350, isLocal: true, isHidden: false });
  assert.equal(gcOutlier, 20);

  // Recovery from a stale 340ms ping on localhost drops rapidly toward ~18ms
  const snapRecover = computeNextPingMs({ prevPingMs: 340, sampleMs: 18, isLocal: true, isHidden: false });
  assert.ok(snapRecover <= 25, `Expected rapid localhost recovery from 340ms to ~18ms, got ${snapRecover}ms`);

  // Moderate spike recovery (150ms -> 20ms) also recovers fast instead of lingering for dozens of seconds
  const midRecover = computeNextPingMs({ prevPingMs: 150, sampleMs: 20, isLocal: true, isHidden: false });
  assert.ok(midRecover <= 60, `Expected fast recovery from 150ms to <=60ms, got ${midRecover}ms`);

  // Remote network jitter smoothing still damps brief spikes
  const remoteSmooth = computeNextPingMs({ prevPingMs: 42, sampleMs: 110, isLocal: false, isHidden: false });
  assert.ok(remoteSmooth > 42 && remoteSmooth < 110, `Expected smoothed remote ping, got ${remoteSmooth}`);
});

test('renderPartyHud skips redundant 20Hz DOM writes and reflows when party state is unchanged', () => {
  const prevDoc = globalThis.document;
  const prevWin = globalThis.window;

  const headerEl = createTrackedTextNode('');
  const listEl = createTrackedHtmlNode('');
  let displayVal = 'none';
  let displayWrites = 0;
  const leaveBtnEl = {
    style: {
      get display() {
        return displayVal;
      },
      set display(v) {
        displayWrites += 1;
        displayVal = v;
      },
    },
  };

  let scheduledReflows = 0;
  let syncReflows = 0;
  globalThis.document = {
    getElementById: (id) => {
      if (id === 'party-header-txt') return headerEl;
      if (id === 'btn-party-leave') return leaveBtnEl;
      if (id === 'party-members-list') return listEl;
      return null;
    },
  };
  globalThis.window = {
    scheduleHudStackReflow: () => {
      scheduledReflows += 1;
    },
    reflowDefaultHudStack: () => {
      syncReflows += 1;
    },
  };

  try {
    const party = {
      leaderId: 'p1',
      members: [
        { id: 'p1', name: 'Zudran', faction: 'Solari', level: 18, hp: 140, maxHp: 140 },
        { id: 'p2', name: 'Aurelia', faction: 'Aether', level: 16, hp: 110, maxHp: 125 },
      ],
    };

    // Simulate 20 identical 20Hz world_state ticks (1 full second)
    for (let i = 0; i < 20; i++) {
      renderPartyHud(party, 'p1');
    }

    assert.equal(headerEl.writes, 1, 'Party header should write only once for identical snapshots');
    assert.equal(listEl.writes, 1, 'Party list innerHTML should write only once for identical snapshots');
    assert.equal(displayWrites, 1, 'Leave button display style should write only once');
    assert.equal(scheduledReflows, 1, 'HUD stack reflow should trigger once, not 20 times/sec');
    assert.equal(syncReflows, 0, 'Coalesced scheduleHudStackReflow should be preferred over synchronous reflow');

    // Mutate HP on a member -> triggers exactly 1 update + 1 reflow
    const damagedParty = {
      leaderId: 'p1',
      members: [
        { id: 'p1', name: 'Zudran', faction: 'Solari', level: 18, hp: 95, maxHp: 140 },
        { id: 'p2', name: 'Aurelia', faction: 'Aether', level: 16, hp: 110, maxHp: 125 },
      ],
    };
    renderPartyHud(damagedParty, 'p1');
    renderPartyHud(damagedParty, 'p1');
    assert.equal(listEl.writes, 2);
    assert.equal(scheduledReflows, 2);
  } finally {
    globalThis.document = prevDoc;
    globalThis.window = prevWin;
  }
});

test('scheduleHudStackReflow coalesces multiple calls within one frame via requestAnimationFrame', () => {
  const prevDoc = globalThis.document;
  const prevWin = globalThis.window;
  const prevRaf = globalThis.requestAnimationFrame;

  const queuedCallbacks = [];
  let domLookupCount = 0;

  globalThis.document = {
    getElementById: () => {
      domLookupCount += 1;
      return null;
    },
  };
  globalThis.window = {};
  globalThis.requestAnimationFrame = (cb) => {
    queuedCallbacks.push(cb);
    return queuedCallbacks.length;
  };

  try {
    scheduleHudStackReflow();
    scheduleHudStackReflow();
    scheduleHudStackReflow();
    assert.equal(queuedCallbacks.length, 1, 'Multiple triggers in one frame must schedule only one rAF callback');
    assert.equal(domLookupCount, 0, 'Reflow must defer until the animation frame runs');

    queuedCallbacks.shift()();
    assert.ok(domLookupCount >= 1, 'Flushing rAF must execute reflowDefaultHudStack');

    const lookupsAfterFrame1 = domLookupCount;
    scheduleHudStackReflow();
    assert.equal(queuedCallbacks.length, 1, 'Pending flag must reset so subsequent frames can schedule reflow again');
    queuedCallbacks.shift()();
    assert.ok(domLookupCount > lookupsAfterFrame1);
  } finally {
    globalThis.document = prevDoc;
    globalThis.window = prevWin;
    globalThis.requestAnimationFrame = prevRaf;
  }
});

test('RoomManager tickAllRooms and nexus_warzone snapshot generation stay well within 50ms budget', () => {
  const rm = new RoomManager({
    accountsStore: { saveQuestState: () => {}, addItemToInventory: () => true },
    partyManager: { getPartyForMember: () => null, syncPlayerVitals: () => {}, areInSameParty: () => false },
  });
  try {
    const warzone = rm.getOrCreateOverworldRoom();
    assert.ok(warzone, 'unified overworld containing Nexus Warzone should initialize');

    // Warm up JIT cleanly
    rm.tickAllRooms();
    rm.buildSnapshot(warzone);

    const iterations = 25;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      rm.tickAllRooms();
      rm.buildSnapshot(warzone);
    }
    const elapsedMs = performance.now() - t0;
    const avgMs = elapsedMs / iterations;
    assert.ok(
      avgMs < 20,
      `Expected average server tick+snapshot across all rooms to be <20ms (budget 50ms), got ${avgMs.toFixed(2)}ms`
    );
  } finally {
    rm.stop();
  }
});

test('Client hot paths guard against 20Hz innerHTML thrashing, shadowBlur stalls, and ping timer leaks', () => {
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  const netSrc = fs.readFileSync(new URL('../client/network.js', import.meta.url), 'utf8');
  const layoutSrc = fs.readFileSync(new URL('../client/uiLayout.js', import.meta.url), 'utf8');

  assert.match(gameSrc, /lastSubLabelKey/, 'updatePlayerUI must memoize sub-label HTML so faction PNG logos are not recreated at 20Hz');
  assert.match(gameSrc, /fillCrispShadowText/, 'Canvas labels should use crisp offset shadows instead of expensive shadowBlur');
  assert.match(gameSrc, /isWorldInViewport/, 'World renderer must viewport-cull off-screen entities and props');
  assert.doesNotMatch(gameSrc, /ctx\.shadowBlur\s*=/, 'Hot render loop should avoid per-frame canvas shadowBlur');
  assert.match(netSrc, /clearPingTimers/, 'MultiplayerClient must clean up all ping timers on reconnect/close');
  assert.match(layoutSrc, /scheduleHudStackReflow/, 'uiLayout must expose and use coalesced scheduleHudStackReflow');
});
