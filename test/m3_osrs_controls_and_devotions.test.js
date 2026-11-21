import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ROOM_TYPES,
  DEVOTIONS_CATALOG,
  MAX_ACTIVE_DEVOTIONS,
  toggleDevotionInList,
  computeDevotionModifiers,
  createDefaultProgression,
} from '../shared/protocol.js';
import { buildContextMenuEntries } from '../client/game/osrsContextMenu.js';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';

function createDummyClient(accounts, { name = 'DevotionHero', level = 20, x = 0, y = 0 } = {}) {
  const sent = [];
  const { account } = accounts.createGuestAccount({
    preferredName: name,
    faction: 'Solari',
    classId: 'solari_vanguard',
  });
  const prog = account.progression || createDefaultProgression();
  prog.level = level;
  account.progression = prog;
  return {
    ...account,
    prog,
    hp: 150,
    maxHp: 150,
    shield: 0,
    solarCharge: 40,
    maxSolarCharge: 80,
    x,
    y,
    isDead: false,
    activeDevotions: [],
    sent,
    ws: { readyState: 1, send: (raw) => sent.push(typeof raw === 'string' ? JSON.parse(raw) : raw) },
    send(pkt) {
      sent.push(pkt);
    },
  };
}

test('M3: Covenant Devotions catalog enforces level gates, mutual exclusion & modifiers', () => {
  assert.ok(DEVOTIONS_CATALOG.ward_of_steel && DEVOTIONS_CATALOG.astral_aegis);
  assert.ok(DEVOTIONS_CATALOG.zealots_vow && DEVOTIONS_CATALOG.sanctuary_grace);

  // Level 1 cannot toggle Lv.6+ Astral Aegis
  const lowLvl = toggleDevotionInList([], 'astral_aegis', 1, 20);
  assert.equal(lowLvl.ok, false);
  assert.match(lowLvl.reason, /Lv\.6/);

  // Protection mutual exclusion: activating Astral Aegis swaps out Ward of Steel
  const r1 = toggleDevotionInList([], 'ward_of_steel', 20, 20);
  assert.deepEqual(r1.list, ['ward_of_steel']);
  const r2 = toggleDevotionInList(r1.list, 'astral_aegis', 20, 20);
  assert.deepEqual(r2.list, ['astral_aegis']);

  // Stacking with Zealot's Vow respects MAX_ACTIVE_DEVOTIONS = 2
  const r3 = toggleDevotionInList(r2.list, 'zealots_vow', 20, 20);
  assert.equal(r3.list.length, MAX_ACTIVE_DEVOTIONS);
  const r4 = toggleDevotionInList(r3.list, 'sanctuary_grace', 20, 20);
  assert.equal(r4.list.length, MAX_ACTIVE_DEVOTIONS);

  const mods = computeDevotionModifiers(['astral_aegis', 'zealots_vow']);
  assert.equal(mods.riteDr, 0.35);
  assert.equal(mods.meleeDr, 0);
  assert.equal(mods.dmgMult, 1.15);
  assert.equal(mods.critBonus, 0.05);
  assert.ok(Math.abs(mods.drainPerSec - 5.6) < 0.01);
});

test('M3: Server RoomManager authorizes toggle_devotion, drains Glimmer, and mitigates/amplifies combat', () => {
  const accounts = new AccountsStore();
  const rm = new RoomManager({
    accountsStore: accounts,
    partyManager: {
      getPartyMembers: () => [],
      getPartyForMember: () => null,
      syncPlayerVitals: () => {},
    },
  });
  try {
    const room = rm.getOrCreatePublicRoom(ROOM_TYPES.SANCTUARY_HUB);
    const p1 = createDummyClient(accounts, { name: 'TemplarOne', level: 20, x: 40, y: 40 });
    rm.joinRoom(p1, room.id);

    // 1. Toggle Zealot's Vow on
    rm.handlePacket(p1, { type: 'toggle_devotion', devotionId: 'zealots_vow' });
    assert.deepEqual(p1.activeDevotions, ['zealots_vow']);
    assert.ok(p1.sent.some((m) => m.type === 'devotion_sync' && m.activeDevotions.includes('zealots_vow')));

    // Snapshot carries overhead devotions array
    const snap = rm.buildSnapshot(room, Date.now());
    const sp = snap.players.find((x) => x.id === p1.id);
    assert.deepEqual(sp.devotions, ['zealots_vow']);

    // 2. Toggle Ward of Steel on -> melee damage taken reduced by 35%
    const meleeAttacker = { id: 'dummy_atk', name: 'Dummy Strike' };
    const hpBeforeNoWard = p1.hp;
    rm.damagePlayerSession(room, p1, 40, 'Dummy Strike', false, meleeAttacker, false);
    const unwardedDmg = hpBeforeNoWard - p1.hp;

    p1._actionCooldowns = {};
    rm.handlePacket(p1, { type: 'toggle_devotion', devotionId: 'ward_of_steel' });
    assert.ok(p1.activeDevotions.includes('ward_of_steel'), 'Ward of Steel must activate');
    const hpBeforeWard = p1.hp;
    rm.damagePlayerSession(room, p1, 40, 'Dummy Strike', false, meleeAttacker, false);
    const wardedDmg = hpBeforeWard - p1.hp;
    assert.ok(wardedDmg < unwardedDmg, `Ward of Steel must reduce melee damage (${wardedDmg} < ${unwardedDmg})`);

    // 3. Authoritative offense boost via Zealot's Vow (+15% dmgMult)
    const dummy = room.entities.find((e) => e.type === 'dummy');
    assert.ok(dummy, 'Sanctuary Hub should have training dummy');
    dummy.hp = 500;
    dummy.maxHp = 500;
    const dummyHpStart = dummy.hp;
    rm.applyAuthoritativeDamage(room, p1, { kind: 'entity', ref: dummy }, 100, false, 'Strike', false);
    const dealt = dummyHpStart - dummy.hp;
    assert.ok(dealt >= 115, `Zealot Vow should amplify 100 dmg to >= 115 (got ${dealt})`);

    // 4. Glimmer exhaustion automatically deactivates overhead devotions in tickRoom
    p1.solarCharge = 0.05;
    p1.sent.length = 0;
    rm.tickRoom(room, 0.25, Date.now());
    assert.deepEqual(p1.activeDevotions, []);
    assert.ok(p1.sent.some((m) => m.type === 'devotion_sync' && m.activeDevotions.length === 0));
  } finally {
    rm.stop();
  }
});

test('M3: OSRS right-click context menu aggregates stacked world targets cleanly', () => {
  const entries = buildContextMenuEntries({
    wx: 100,
    wy: 100,
    lootDrops: [{ id: 'd1', x: 102, y: 102, itemId: 'sword_solari_t1', qty: 1 }],
    remotePlayers: [{ id: 'p2', name: 'KnightB', level: 12, x: 100, y: 110, isDead: false }],
    entities: [{ id: 'mob_1', type: 'mob', name: 'Void Wolf', x: 100, y: 110, hp: 50, maxHp: 50 }],
    npcs: [{ id: 'npc_banker', name: 'Vaultkeeper Sol', x: 100, y: 115, isBank: true }],
    props: [],
    equipmentCatalog: { sword_solari_t1: { name: 'Sunblade' } },
    isHostileEntity: (e) => e.type === 'mob',
    isRemoteHostile: () => true,
  });

  const verbs = entries.map((e) => e.verb);
  assert.ok(verbs.includes('Take'), 'Loot Take action missing');
  assert.ok(verbs.includes('Follow'), 'Player Follow action missing');
  assert.ok(verbs.includes('Trade with'), 'Player Trade action missing');
  assert.ok(verbs.includes('Attack'), 'Hostile Attack action missing');
  assert.ok(verbs.includes('Drop Table'), 'Mob Drop Table inspect action missing');
  assert.ok(verbs.includes('Bank'), 'Bank NPC option missing');
  assert.equal(entries[entries.length - 2].verb, 'Walk here');
  assert.equal(entries[entries.length - 1].verb, 'Cancel');
});

test('M3: Client HUD, click-to-move markers, auto-retaliate & nameplate devotion wiring present', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes('id="devotion-prayer-bar"'));
  assert.ok(html.includes('id="btn-auto-retaliate"'));
  assert.ok(html.includes('data-filter="whisper"'));
  assert.ok(html.includes('data-filter="trade"'));

  const gameJs = fs.readFileSync('client/game.js', 'utf8');
  assert.ok(gameJs.includes('buildContextMenuEntries'));
  assert.ok(gameJs.includes('openOsrsContextMenu'));
  assert.ok(gameJs.includes('followPlayerId'));
  assert.ok(gameJs.includes('clickMarkers'));
  assert.ok(gameJs.includes('triggerAutoRetaliate'));
  assert.ok(gameJs.includes('toggleDevotion'));

  const socialUi = fs.readFileSync('client/socialUi.js', 'utf8');
  assert.ok(socialUi.includes('DEVOTIONS_CATALOG[id]'));
});
