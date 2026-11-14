import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';
import * as protocol from '../shared/protocol.js';

function createTestEnv() {
  const accounts = new AccountsStore({ persistencePath: null });
  const rm = new RoomManager(accounts);
  rm.parties = rm.parties || { areInSameParty: () => false, syncPlayerVitals: () => {} };
  const room = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.SOLARI_CITADEL);
  return { rm, room };
}

function makeTestPlayer(room, id, classId, x = 200, y = 200) {
  const prog = protocol.createDefaultProgression(classId);
  prog.skills = {
    flare_strike: 1,
    radiant_bulwark: 1,
    solar_flare: 1,
    whisper_of_the_void: 1,
  };
  const p = {
    id,
    ws: { readyState: 1, send() {} },
    displayName: `Hero_${id}`,
    faction: classId.startsWith('solari') ? 'Solari' : 'Umbri',
    classId,
    x,
    y,
    z: 0,
    dir: 'right',
    hp: 200,
    maxHp: 200,
    shield: 0,
    shieldTimer: 0,
    solarCharge: 50,
    maxSolarCharge: 100,
    isDead: false,
    freezeTimer: 0,
    stealthedTimer: 0,
    weakenTimer: 0,
    slowTimer: 0,
    snareTimer: 0,
    thornbarkTimer: 0,
    zenithTimer: 0,
    rebukeTimer: 0,
    auroraStrideTimer: 0,
    solarAscensionTimer: 0,
    portalCooldown: 0,
    prog,
    equipment: {},
    loadout: { 1: 'flare_strike', 2: 'radiant_bulwark', 3: 'solar_flare' },
    cooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
    gcdTimer: 0,
    gcdTotal: 0,
    queuedAbility: null,
    castState: null,
    send() {},
  };
  room.players.set(id, p);
  return p;
}

test('Combat GCD enforces 1.5s base floor, off-GCD bypasses, and 400ms spell queue buffers & flushes', () => {
  const { rm, room } = createTestEnv();
  try {
    const tank = makeTestPlayer(room, 'p1', 'solari_vanguard', 200, 200);

    // Cast slot 1 (flare_strike — on-GCD)
    rm.handleCastAbility(room, tank, 1, null, 'right');
    assert.ok(tank.gcdTimer >= protocol.MIN_GCD_SEC && tank.gcdTimer <= protocol.BASE_GCD_SEC, `Expected GCD in [0.75, 1.5], got ${tank.gcdTimer}`);

    // Off-GCD slot 2 (radiant_bulwark — shield) executes even while on GCD!
    rm.handleCastAbility(room, tank, 2, null, 'right');
    assert.ok(tank.shield > 0, 'Off-GCD shield should execute immediately during GCD');

    // Trying to queue slot 3 when GCD remaining > 0.4s should NOT queue
    tank.gcdTimer = 0.8;
    rm.handleCastAbility(room, tank, 3, null, 'right');
    assert.equal(tank.queuedAbility, null, 'Should not queue outside 400ms window');

    // Inside 400ms window, slot 1 (cd 0) queues and auto-fires on tickRoom once GCD expires
    tank.cooldowns[1] = 0;
    tank.gcdTimer = 0.2;
    rm.handleCastAbility(room, tank, 1, null, 'right');
    assert.equal(tank.queuedAbility?.slot, 1, 'Should buffer slot 1 in spell queue');

    rm.tickRoom(room, 0.25, Date.now());
    assert.equal(tank.queuedAbility, null, 'Queued ability should flush after GCD expires');
    assert.ok(tank.gcdTimer > 0, 'Flushed ability should trigger a fresh GCD');
  } finally {
    rm.stop();
  }
});

test('Authoritative Threat Table prioritizes Tank 3.5x multiplier and Taunt lock over proximity', () => {
  const { rm, room } = createTestEnv();
  try {
    const tank = makeTestPlayer(room, 'tank', 'solari_vanguard', 260, 200); // 60px away
    const dps = makeTestPlayer(room, 'dps', 'umbral_assassin', 210, 200); // 10px away (closer!)

    const mob = {
      id: 'mob_threat_test',
      name: 'Test Sentinel',
      type: 'mob',
      x: 200,
      y: 200,
      origX: 200,
      origY: 200,
      hp: 500,
      maxHp: 500,
      damage: 5,
      speed: 40,
      aggroRange: 120,
      attackRange: 25,
      inCombat: true,
      dammers: new Set(),
    };
    room.entities.push(mob);

    // DPS deals 10 dmg -> 10 threat
    rm.addMobThreat(room, mob, dps, 10);
    // Tank deals 10 dmg -> 35 threat (3.5x)
    rm.addMobThreat(room, mob, tank, 10);
    assert.equal(mob.threatTable.dps, 10);
    assert.equal(mob.threatTable.tank, 35);

    rm.tickRoom(room, 0.05, Date.now());
    assert.equal(mob.targetPlayerId, 'tank', 'Mob should target Tank with higher threat even though DPS is closer');

    // DPS spikes 100 threat
    rm.addMobThreat(room, mob, dps, 100);
    assert.equal(mob.threatTable.dps, 110);

    // Tank taunts -> sets threat >= 110% of max and locks target for 3s
    rm.addMobThreat(room, mob, tank, 20, { isTaunt: true });
    assert.equal(mob.tauntTargetId, 'tank');
    assert.ok(mob.threatTable.tank > mob.threatTable.dps);

    rm.tickRoom(room, 0.05, Date.now());
    assert.equal(mob.targetPlayerId, 'tank', 'Taunt should lock mob onto Tank');
  } finally {
    rm.stop();
  }
});
