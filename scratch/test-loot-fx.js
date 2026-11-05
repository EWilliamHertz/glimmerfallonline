import assert from 'node:assert';
import fs from 'node:fs';
import { RoomManager } from '../server/roomManager.js';

console.log('🧪 Starting Loot Pickup & Death Smoke FX Verification...');

// 1. Verify client/game.js does not contain spawnSmokeBurst in offline loot pickup
const gameJs = fs.readFileSync('client/game.js', 'utf8');

const offlineLootSection = gameJs.slice(
  gameJs.indexOf('function updateOfflineLoot('),
  gameJs.indexOf('const LOOT_STYLE = {')
);

assert(!offlineLootSection.includes('spawnSmokeBurst'), 'updateOfflineLoot must NOT spawn smoke burst on pickup');
assert(offlineLootSection.includes('spawnSparkBurst'), 'updateOfflineLoot should spawn spark bursts on pickup');
console.log('✅ client/game.js updateOfflineLoot verification passed: zero smoke on pickup.');

// 2. Verify server tickLoot does NOT push smoke on loot pickup
const roomManagerJs = fs.readFileSync('server/roomManager.js', 'utf8');

const tickLootSection = roomManagerJs.slice(
  roomManagerJs.indexOf('tickLoot(room, dt) {'),
  roomManagerJs.indexOf('handleEntityDeath(room, ent, killerPlayer, killerSpell) {')
);

assert(!tickLootSection.includes("kind: 'smoke'"), 'tickLoot must NOT push smoke fx');
assert(tickLootSection.includes("kind: 'spark'"), 'tickLoot should push spark fx on pickup');
console.log('✅ server/roomManager.js tickLoot verification passed: zero smoke in loot pickup.');

// 3. Functional simulation of loot pickup
const accountsStub = {
  updateProfile: () => {},
  getProfile: () => ({ stats: {}, equipment: {}, loadout: {} }),
  addGlimmer: () => {},
  saveProgression: () => {}
};
const rm = new RoomManager({
  accountsStore: accountsStub,
  partyManager: { syncPlayerVitals: () => {} }
});
const testRoom = Array.from(rm.rooms.values())[0];
assert(testRoom, 'A default room should exist');

// Add a test player
const dummyPlayer = {
  id: 'test_player_1',
  displayName: 'TestHero',
  x: 0,
  y: 0,
  hp: 50,
  maxHp: 100,
  isDead: false,
  prog: { level: 10, stats: {} },
  equipment: {},
  send: () => {}
};
testRoom.players.set(dummyPlayer.id, dummyPlayer);

// Spawn loot drops
testRoom.loot = [
  { id: 'l1', kind: 'vital', x: 0, y: 0, ttl: 10, maxTtl: 28 },
  { id: 'l2', kind: 'glimmer', x: 0, y: 0, ttl: 10, maxTtl: 28 },
  { id: 'l3', kind: 'relic', x: 0, y: 0, ttl: 10, maxTtl: 28 }
];

testRoom.fxQueue = [];

// Tick loot
rm.tickLoot(testRoom, 0.1);

// All 3 loot items should have been picked up
assert.strictEqual(testRoom.loot.length, 0, 'All loot items should be picked up');

// Inspect fxQueue: none of the FX should be smoke
const smokeFx = testRoom.fxQueue.filter(f => f.kind === 'smoke');
assert.strictEqual(smokeFx.length, 0, `Expected 0 smoke FX from loot pickup, got ${smokeFx.length}`);

const sparkFx = testRoom.fxQueue.filter(f => f.kind === 'spark');
assert.strictEqual(sparkFx.length, 3, `Expected 3 spark FX from loot pickup, got ${sparkFx.length}`);

const fctFx = testRoom.fxQueue.filter(f => f.kind === 'fct');
assert.strictEqual(fctFx.length, 3, `Expected 3 FCT FX from loot pickup, got ${fctFx.length}`);

console.log('✅ RoomManager loot pickup simulation passed: only sparks and FCT, zero smoke.');

// 4. Verify entity death DOES still produce purple smoke
const testMob = {
  id: 'mob_test',
  name: 'Void Stalker',
  type: 'mob',
  x: 50,
  y: 50,
  isBoss: false
};
rm.handleEntityDeath(testRoom, testMob, dummyPlayer, 'Flame Arc');
const deathSmoke = testRoom.fxQueue.filter(f => f.kind === 'smoke' && f.isDeath);
assert.strictEqual(deathSmoke.length, 1, 'handleEntityDeath must push death smoke');
console.log('✅ Entity death smoke verification passed: smoke correctly preserved on monster kill.');

console.log('🎉 All Loot Pickup FX tests passed successfully!');
process.exit(0);
