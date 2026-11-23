import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ROOM_TYPES,
  MOUNTS_CATALOG,
  MOUNT_CAST_DURATION_SEC,
  WAYPOINT_SHRINES_CATALOG,
  WAYPOINT_SHRINES_BY_ID,
  getDefaultMountIdForFaction,
  canRideMountInRoom,
  getMountSpeedBonus,
  normalizeExplorationState,
  revealFogOfWarAt,
} from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';

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

test('Canonical 4 Faction Mounts expose 1.5s cast, +48% overland speed, and block indoors/cavern/arena', () => {
  assert.equal(Object.keys(MOUNTS_CATALOG).length, 4);
  assert.equal(MOUNT_CAST_DURATION_SEC, 1.5);
  assert.equal(getDefaultMountIdForFaction('Solari'), 'starlight_charger');
  assert.equal(getDefaultMountIdForFaction('Umbri'), 'voidfang_prowler');
  assert.equal(getDefaultMountIdForFaction('Terra'), 'ironwood_elk');
  assert.equal(getDefaultMountIdForFaction('Aether'), 'chrono_drake');

  assert.equal(canRideMountInRoom(ROOM_TYPES.SANCTUARY_HUB), true);
  assert.equal(canRideMountInRoom(ROOM_TYPES.NEXUS_WARZONE), true);
  assert.equal(canRideMountInRoom(ROOM_TYPES.INTERIOR_TAVERN), false);
  assert.equal(canRideMountInRoom(ROOM_TYPES.LUMINOUS_CAVERN), false);
  assert.equal(canRideMountInRoom(ROOM_TYPES.ARENA_3V3), false);

  assert.ok(Math.abs(getMountSpeedBonus('starlight_charger', ROOM_TYPES.SANCTUARY_HUB) - 1.48) < 0.001);
  assert.equal(getMountSpeedBonus('starlight_charger', ROOM_TYPES.INTERIOR_TAVERN), 1.0);
});

test('Server Mount lifecycle: 1.5s cast completes, moves cancel summon, and combat damage or Rites dismount immediately', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const { account } = accounts.createGuestAccount({ faction: 'Aether', classId: 'chronomancer_sage' });
    const ws = createMockWs();
    const client = rooms.attachConnection(ws, account, ROOM_TYPES.SANCTUARY_HUB, 0, 96);
    const overworld = rooms.rooms.get(client.roomId);
    ws.sent.length = 0;

    // 1. Start summon, verify moving cancels cast
    rooms.handlePacket(client, { type: 'toggle_mount' });
    assert.ok(ws.sent.some((m) => m.type === 'mount_cast_started' && m.mountId === 'chrono_drake' && m.duration === 1.5));
    assert.ok(client.mountCast, 'Mount summon cast must be active');

    rooms.handlePacket(client, {
      type: 'move',
      x: 24,
      y: 96,
      z: 0,
      dir: 'right',
      isMoving: true,
      seq: 1,
      epoch: client.epoch,
    });
    assert.equal(client.mountCast, null, 'Walking cancels active mount summon');
    assert.equal(client.mountId, null);

    // 2. Stationary summon completes after 1.5s tick
    ws.sent.length = 0;
    rooms.handlePacket(client, { type: 'toggle_mount' });
    rooms.tickRoom(overworld, 0.8, Date.now());
    assert.equal(client.mountId, null, 'Not yet mounted at 0.8s');
    rooms.tickRoom(overworld, 0.8, Date.now());
    assert.equal(client.mountId, 'chrono_drake', 'Mounted on Chrono Drake after 1.5s cast');
    assert.ok(ws.sent.some((m) => m.type === 'mount_synced' && m.mountId === 'chrono_drake'));

    // 3. Casting an ability instantaneously dismounts
    rooms.handlePacket(client, { type: 'cast_ability', slot: 1, targetId: 'training_dummy', dir: 'up' });
    assert.equal(client.mountId, null, 'Casting ability must immediately dismount');

    // 4. Re-mount, then verify taking combat damage instantaneously dismounts
    client.hp = client.maxHp;
    client.mountId = 'chrono_drake';
    rooms.damagePlayerSession(overworld, client, 10, 'Rift Stalker', false, null, true);
    assert.equal(client.mountId, null, 'Taking combat damage must immediately dismount');

    rooms.removeClient(client);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Fog of War chunks & discovered zones update along seamless overland travel and Waypoint Shrines gate/warp cleanly', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    assert.equal(WAYPOINT_SHRINES_CATALOG.length, 18, 'Every surface region anchors a canonical Waypoint Shrine');
    const initExp = normalizeExplorationState(undefined, 'Terra');
    assert.ok(initExp.unlockedShrines.includes('wp_sanctuary_hub'));
    const fogStep = revealFogOfWarAt(initExp, -1376, 132, ROOM_TYPES.SOLARI_CITADEL, 1, 'Terra');
    assert.equal(fogStep.newlyDiscoveredZone, ROOM_TYPES.SOLARI_CITADEL);
    assert.ok(fogStep.state.discoveredChunks.includes('-4,0'));

    const { account } = accounts.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    account.statsMeta = { ...(account.statsMeta || {}), editionTier: 'free' };
    const ws = createMockWs();
    const solWp = WAYPOINT_SHRINES_BY_ID.wp_solari_citadel;
    const client = rooms.attachConnection(ws, account, ROOM_TYPES.SOLARI_CITADEL, solWp.wx, solWp.wy + 260);
    ws.sent.length = 0;

    // Attempting to unlock Solari waypoint while too far away fails cleanly
    rooms.handlePacket(client, { type: 'discover_waypoint', shrineId: 'wp_solari_citadel' });
    assert.equal(client.prog.exploration.unlockedShrines.includes('wp_solari_citadel'), false);

    // Attempting to teleport to an unattuned waypoint fails cleanly
    rooms.handlePacket(client, { type: 'teleport_waypoint', shrineId: 'wp_solari_citadel' });
    assert.ok(Math.abs(client.y - (solWp.wy + 260)) < 10);

    // Walk up adjacent to Solari Waypoint -> reveals chunks + attunes shrine + grants +40 XP
    const beforeXp = client.prog.xp || 0;
    rooms.handlePacket(client, {
      type: 'move',
      x: solWp.wx,
      y: solWp.wy + 20,
      z: 0,
      dir: 'up',
      isMoving: true,
      seq: 1,
      epoch: client.epoch,
    });
    rooms.handlePacket(client, { type: 'discover_waypoint', shrineId: 'wp_solari_citadel' });
    assert.equal(client.prog.exploration.unlockedShrines.includes('wp_solari_citadel'), true);
    assert.ok((client.prog.xp || 0) >= beforeXp + 40, 'First waypoint discovery grants exploration XP');

    // Warp back to Sanctuary Plaza Waystone, then warp back to Solari Gate
    rooms.handlePacket(client, { type: 'teleport_waypoint', shrineId: 'wp_sanctuary_hub' });
    assert.equal(client.roomType, ROOM_TYPES.SANCTUARY_HUB);
    const hubWp = WAYPOINT_SHRINES_BY_ID.wp_sanctuary_hub;
    assert.equal(Math.round(client.x), hubWp.wx);
    assert.equal(Math.round(client.y), hubWp.wy);

    rooms.handlePacket(client, { type: 'teleport_waypoint', shrineId: 'wp_solari_citadel' });
    assert.equal(client.roomType, ROOM_TYPES.SOLARI_CITADEL);
    assert.equal(Math.round(client.x), solWp.wx);

    // Free account cannot warp to a Founder waypoint even if forced into unlockedShrines
    client.prog.exploration.unlockedShrines.push('wp_starfall_crater');
    rooms.handlePacket(client, { type: 'teleport_waypoint', shrineId: 'wp_starfall_crater' });
    assert.equal(client.roomType, ROOM_TYPES.SOLARI_CITADEL, 'Founder barrier blocks waypoint warp into Founder realms');

    rooms.removeClient(client);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Client wires Mount HUD button, Mount pixel sprites, and World Map Fog/Waypoint controls', () => {
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const gameJs = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  const atlasJs = fs.readFileSync(new URL('../client/game/worldAtlasAndLoreUi.js', import.meta.url), 'utf8');
  const mountSprJs = fs.readFileSync(new URL('../client/sprites/mountSprites.js', import.meta.url), 'utf8');

  assert.match(indexHtml, /id="btn-mount"/);
  assert.match(gameJs, /window\.toggleMount/);
  assert.match(gameJs, /window\.teleportToWaypoint/);
  assert.match(gameJs, /getMountSpeedBonus/);
  assert.match(atlasJs, /UNCHARTED FOG OF WAR/);
  assert.match(atlasJs, /teleportToWaypoint/);
  assert.match(mountSprJs, /starlight_charger/);
  assert.match(mountSprJs, /waypointShrineActive/);
});
