import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { ROOM_TYPES, ROOM_CONFIGS, GRAND_FONT_POSITIONS } from '../shared/protocol.js';

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

function clearStoreTimer(store) {
  if (store?.flushTimer) {
    clearTimeout(store.flushTimer);
    store.flushTimer = null;
  }
}

const INTERIOR_ROOM_KEYS = [
  ROOM_TYPES.INTERIOR_TAVERN,
  ROOM_TYPES.INTERIOR_BANK_VAULT,
  ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE,
  ROOM_TYPES.INTERIOR_GUILD_HALL,
  ROOM_TYPES.INTERIOR_TCG_PAVILION,
  ROOM_TYPES.INTERIOR_SOLARI_SMITHY,
  ROOM_TYPES.INTERIOR_TERRA_APOTHECARY,
  ROOM_TYPES.INTERIOR_UMBRI_PARLOR,
  ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY,
  ROOM_TYPES.INTERIOR_MARINER_TAVERN,
];

test('All 8 interior building rooms have safe indoor metadata, zero mobs/fonts/nodes, and reciprocal exits', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    for (const roomType of INTERIOR_ROOM_KEYS) {
      const cfg = ROOM_CONFIGS[roomType];
      assert.ok(cfg, `Missing ROOM_CONFIGS entry for ${roomType}`);
      assert.equal(cfg.isInterior, true, `${roomType} must set isInterior: true`);
      assert.equal(cfg.pvp, false, `${roomType} must be non-PvP`);
      assert.ok(Array.isArray(GRAND_FONT_POSITIONS[roomType]) && GRAND_FONT_POSITIONS[roomType].length === 0, `${roomType} must have no Grand Glimmer Fonts`);
      assert.ok(cfg.exitDestination?.roomType && ROOM_CONFIGS[cfg.exitDestination.roomType], `${roomType} must have valid exitDestination`);
      const outCfg = ROOM_CONFIGS[cfg.exitDestination.roomType];
      assert.ok(Math.abs(cfg.exitDestination.x) < outCfg.halfW, `${roomType} exit X must sit inside ${cfg.exitDestination.roomType}`);
      assert.ok(Math.abs(cfg.exitDestination.y) < outCfg.halfH, `${roomType} exit Y must sit inside ${cfg.exitDestination.roomType}`);
      assert.ok(Math.abs(cfg.spawnX) < cfg.halfW && Math.abs(cfg.spawnY) < cfg.halfH, `${roomType} spawn must sit inside interior bounds`);

      const room = rooms.getOrCreatePublicRoom(roomType);
      assert.equal(room.isInterior, true);
      assert.equal(room.entities.filter((e) => e.type === 'mob').length, 0, `${roomType} must spawn zero hostile mobs`);
      assert.equal(room.entities.filter((e) => e.isGrand).length, 0, `${roomType} must spawn zero Grand Glimmer Fonts`);
      assert.equal(room.entities.filter((e) => e.skillingType).length, 0, `${roomType} must spawn zero outdoor skilling nodes`);
    }
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Entering and exiting an interior building saves position instantly and reconnect spawns inside', async () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const { account } = accounts.createGuestAccount({
      preferredName: 'InnkeeperTest',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
    const ws1 = createMockWs();
    const c1 = rooms.attachConnection(ws1, account);
    assert.equal(c1.roomType, ROOM_TYPES.SANCTUARY_HUB);

    // Enter Hearthstone Inn & Tavern via switch_room
    rooms.handlePacket(c1, {
      type: 'switch_room',
      roomType: ROOM_TYPES.INTERIOR_TAVERN,
      epoch: c1.roomEpoch,
    });
    assert.equal(c1.roomType, ROOM_TYPES.INTERIOR_TAVERN);
    const activeChar = accounts.listCharacters(account.id).find((c) => c.id === account.activeCharacterId);
    assert.equal(activeChar.lastPosition.roomType, ROOM_TYPES.INTERIOR_TAVERN, 'Switching into interior must persist roomType immediately');

    // Walk inside near the tavern hearth and stop moving
    rooms.handlePacket(c1, {
      type: 'move',
      x: 12,
      y: -42,
      z: 0,
      dir: 'up',
      isMoving: true,
      epoch: c1.roomEpoch,
    });
    rooms.handlePacket(c1, {
      type: 'move',
      x: 12,
      y: -48,
      z: 0,
      dir: 'up',
      isMoving: false,
      epoch: c1.roomEpoch,
    });
    assert.deepEqual(
      accounts.listCharacters(account.id).find((c) => c.id === account.activeCharacterId).lastPosition,
      { roomType: ROOM_TYPES.INTERIOR_TAVERN, x: 12, y: -48 },
      'Stopping movement inside interior must save exact resting spot immediately'
    );

    // Sudden disconnect -> reconnect must spawn back inside the Hearthstone Tavern at (12, -48)
    rooms.removeClient(c1);
    const ws2 = createMockWs();
    const c2 = rooms.attachConnection(ws2, account);
    const joined2 = ws2.sent.find((p) => p.type === 'room_joined');
    assert.equal(joined2.roomType, ROOM_TYPES.INTERIOR_TAVERN);
    assert.equal(joined2.x, 12);
    assert.equal(joined2.y, -48);

    // Step onto southern exit doormat during authoritative server tick -> returns outside tavern
    const tavernRoom = rooms.rooms.get(c2.roomId);
    c2.portalCooldown = 0;
    c2.x = 0;
    c2.y = tavernRoom.halfH - 12;
    rooms.tickRoom(tavernRoom, 0.05, Date.now());
    const exitCfg = ROOM_CONFIGS[ROOM_TYPES.INTERIOR_TAVERN].exitDestination;
    assert.equal(c2.roomType, exitCfg.roomType);
    assert.equal(c2.x, exitCfg.x);
    assert.equal(c2.y, exitCfg.y);
    assert.deepEqual(
      accounts.listCharacters(account.id).find((c) => c.id === account.activeCharacterId).lastPosition,
      { roomType: exitCfg.roomType, x: exitCfg.x, y: exitCfg.y }
    );

    rooms.removeClient(c2);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Client wires doorways, interior rendering safeguards, and keepalive save-vitals endpoint', () => {
  const gameSrc = fs.readFileSync('client/game.js', 'utf8');
  const decorSrc = fs.readFileSync('client/game/zoneDecorBuilders.js', 'utf8');
  const ambientSrc = fs.readFileSync('client/game/ambientRenderer.js', 'utf8');
  const serverSrc = fs.readFileSync('server/index.js', 'utf8');

  assert.ok(ambientSrc.includes("if (getCurrentBiomeTheme().startsWith('interior_')) return;"), 'drawSeaAmbient must skip waves in interiors');
  for (const roomType of INTERIOR_ROOM_KEYS) {
    assert.ok(decorSrc.includes(`ROOM_TYPES.${Object.keys(ROOM_TYPES).find((k) => ROOM_TYPES[k] === roomType)}`), `Client must wire ${roomType}`);
  }
  assert.ok(gameSrc.includes('/api/auth/save-vitals'), 'Client unload handler must use keepalive save-vitals');
  assert.ok(serverSrc.includes("pathname === '/api/auth/save-vitals'"), 'Server must expose POST /api/auth/save-vitals');
});
