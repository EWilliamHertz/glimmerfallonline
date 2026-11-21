import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSnapCache,
  buildClientSnapshotPacket,
  ClientSnapshotReconstructor,
} from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { handleApiRequest } from '../server/index.js';

function createMockWs() {
  const sent = [];
  return {
    readyState: 1,
    sent,
    send(raw) {
      sent.push(JSON.parse(raw));
    },
  };
}

test('Milestone 2: Delta snapshot codec culls distant mobs and compresses idle/moving updates', () => {
  const serverCache = createSnapCache();
  const clientRecon = new ClientSnapshotReconstructor();

  const viewer = { id: 'p1', x: 0, y: 0 };
  const snap1 = {
    players: [
      { id: 'p1', name: 'Hero', x: 0, y: 0, hp: 50, maxHp: 50, equipment: { weapon: 'iron_broadsword' } },
      { id: 'p2', name: 'Ally', x: 40, y: 20, hp: 40, maxHp: 50, equipment: { weapon: 'apprentice_focus_orb' } },
    ],
    entities: [
      { id: 'mob_near', type: 'mob', name: 'Slime', x: 120, y: 0, hp: 20, maxHp: 20 },
      { id: 'mob_far', type: 'mob', name: 'Distant Rat', x: 2200, y: 0, hp: 10, maxHp: 10 },
      { id: 'boss_far', type: 'mob', name: 'Colossus', isBoss: true, x: 2400, y: 0, hp: 300, maxHp: 300 },
      { id: 'portal_far', type: 'portal', name: 'Gate', x: 2300, y: 0 },
    ],
    allies: [],
    projectiles: [],
    groundZones: [],
    banners: [],
    loot: [
      { id: 'loot_near', kind: 'gold', x: 30, y: 10, ttl: 40 },
      { id: 'loot_far', kind: 'gold', x: 2200, y: 10, ttl: 40 },
    ],
    siegeState: { active: false, nextInSec: 600 },
  };

  // First tick -> full world_state with spatial culling applied
  const pkt1 = buildClientSnapshotPacket({
    roomId: 'sanctuary_hub_1',
    onlineTotal: 2,
    fullSnapshot: snap1,
    viewer,
    clientSnapCache: serverCache,
  });
  assert.equal(pkt1.type, 'world_state');
  assert.equal(pkt1.entities.some((e) => e.id === 'mob_near'), true);
  assert.equal(pkt1.entities.some((e) => e.id === 'mob_far'), false, 'Distant normal mob should be culled');
  assert.equal(pkt1.entities.some((e) => e.id === 'boss_far'), true, 'Boss must remain visible');
  assert.equal(pkt1.entities.some((e) => e.id === 'portal_far'), true, 'Portal must remain visible');
  assert.equal(pkt1.loot.length, 1);

  const recon1 = clientRecon.applyPacket(pkt1);
  assert.equal(recon1.entities.length, 3);

  // Second tick: only p2 moves by +5px and mob_near takes 4 damage
  const snap2 = {
    ...snap1,
    players: [
      snap1.players[0],
      { ...snap1.players[1], x: 45 },
    ],
    entities: [
      { ...snap1.entities[0], hp: 16 },
      snap1.entities[1],
      snap1.entities[2],
      snap1.entities[3],
    ],
  };
  const pkt2 = buildClientSnapshotPacket({
    roomId: 'sanctuary_hub_1',
    onlineTotal: 2,
    fullSnapshot: snap2,
    viewer,
    clientSnapCache: serverCache,
  });
  assert.equal(pkt2.type, 'world_delta');
  assert.equal(pkt2.p.u.length, 1);
  assert.deepEqual(pkt2.p.u[0], { id: 'p2', x: 45 });
  assert.equal(pkt2.e.u.length, 1);
  assert.deepEqual(pkt2.e.u[0], { id: 'mob_near', hp: 16 });
  assert.equal(pkt2.allies, undefined, 'Unchanged allies omitted');
  assert.equal(pkt2.siegeState, undefined, 'Unchanged siegeState omitted');

  const fullBytes = Buffer.byteLength(JSON.stringify({ type: 'world_state', ...snap2 }));
  const deltaBytes = Buffer.byteLength(JSON.stringify(pkt2));
  assert.ok(deltaBytes < fullBytes * 0.4, `Expected >60% bandwidth reduction (${deltaBytes} vs ${fullBytes})`);

  const recon2 = clientRecon.applyPacket(pkt2);
  assert.equal(recon2.players.find((p) => p.id === 'p2')?.x, 45);
  assert.equal(recon2.entities.find((e) => e.id === 'mob_near')?.hp, 16);
  assert.equal(recon2.entities.find((e) => e.id === 'boss_far')?.hp, 300);

  // Third tick: idle tick emits tiny heartbeat delta
  const pkt3 = buildClientSnapshotPacket({
    roomId: 'sanctuary_hub_1',
    onlineTotal: 2,
    fullSnapshot: snap2,
    viewer,
    clientSnapCache: serverCache,
  });
  assert.equal(pkt3.type, 'world_delta');
  assert.equal(pkt3.p, undefined);
  assert.equal(pkt3.e, undefined);
});

test('Milestone 2: RoomManager sends world_delta on ticks and exposes /api/metrics', async () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager({ accountsStore: accounts });
  try {
    const { account } = accounts.createGuestAccount({
      preferredName: 'DeltaRunner',
      faction: 'Aether',
      classId: 'aether_astromancer',
    });
    const ws = createMockWs();
    rooms.attachConnection(ws, account);
    ws.sent.length = 0;

    rooms.tickAllRooms();
    rooms.tickAllRooms();

    assert.ok(ws.sent.some((m) => m.type === 'world_state'), 'First tick emits full world_state');
    assert.ok(ws.sent.some((m) => m.type === 'world_delta'), 'Second tick emits compact world_delta');
    const stats = rooms.getTickStats();
    assert.ok(stats.sampleCount >= 2);
    assert.ok(stats.avgMs >= 0);

    let resStatus = 0;
    let resBody = null;
    const mockRes = {
      writeHead(code) { resStatus = code; },
      end(str) { resBody = JSON.parse(str); },
    };
    await handleApiRequest({ method: 'GET', url: '/api/metrics', headers: { host: 'localhost' } }, mockRes, { accounts, rooms });
    assert.equal(resStatus, 200);
    assert.equal(resBody.ok, true);
    assert.equal(resBody.realm, 'EU-Stockholm Global Realm');
    assert.ok(resBody.tickStats);
  } finally {
    rooms.stop();
    if (accounts.flushTimer) clearTimeout(accounts.flushTimer);
  }
});
