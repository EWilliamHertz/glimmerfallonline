import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  FOUNDER_ONLY_ROOMS,
  SURFACE_ROOM_TYPES,
  ENTERED_ROOM_TYPES,
  SURFACE_ZONE_DEFINITIONS,
  SURFACE_ZONE_PLACEMENT,
  SURFACE_TRANSITION_CORRIDORS,
  isSurfaceRoomType,
  isEnteredRealm,
  localToWorld,
  getRegionAtWorldPos,
  isWalkableSurfacePos,
  isSurfaceFootprintInWater,
  getDistanceOutsideWalkableSurface,
  migrateLegacyPosition,
} from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { WORLD_ATLAS_REGIONS } from '../client/game/worldAtlasData.js';

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

test('Path B Single-Grid Overworld: Zero bounding-box overlap & 24 continuous corridors', () => {
  assert.equal(SURFACE_ROOM_TYPES.size, 18, 'Expected 18 unified surface zones');
  assert.equal(ENTERED_ROOM_TYPES.size, 17, 'Expected 17 entered realms (10 interiors + cavern + arena + 4 crypts + 10-player raid)');
  assert.equal(SURFACE_TRANSITION_CORRIDORS.length, 24, 'Expected 24 transitioning buffer corridors');

  const zones = Object.values(SURFACE_ZONE_PLACEMENT);
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const a = zones[i];
      const b = zones[j];
      const overlapX = a.minX < b.maxX && a.maxX > b.minX;
      const overlapY = a.minY < b.maxY && a.maxY > b.minY;
      assert.equal(overlapX && overlapY, false, `Surface zones ${a.id} and ${b.id} overlap!`);
    }
  }

  let bufferCorridors = 0;
  for (const cor of SURFACE_TRANSITION_CORRIDORS) {
    assert.ok(isSurfaceRoomType(cor.fromRoom), `${cor.fromRoom} must be surface`);
    assert.ok(isSurfaceRoomType(cor.toRoom), `${cor.toRoom} must be surface`);
    const span = cor.axis === 'x' ? cor.maxX - cor.minX : cor.maxY - cor.minY;
    assert.ok(span >= 256 && span <= 1360, `Corridor ${cor.id} span (${span}px) should be valid`);
    if (span >= 256 && span <= 384) bufferCorridors++;
  }
  assert.ok(bufferCorridors >= 18, `Expected >=18 compact 16-24 tile transitioning corridors (got ${bufferCorridors})`);
});

test('Path B Topology: Connected surface borders, separated subterranean cavern, and legacy portals removed', () => {
  for (const sId of SURFACE_ROOM_TYPES) {
    const cfg = ROOM_CONFIGS[sId];
    assert.ok(cfg?.edgeTransitions, `${sId} must define edgeTransitions`);
    for (const [dir, neighbor] of Object.entries(cfg.edgeTransitions)) {
      assert.ok(isSurfaceRoomType(neighbor), `${sId}.${dir} points to non-surface ${neighbor}`);
      const hasCorridor = SURFACE_TRANSITION_CORRIDORS.some(
        (c) => (c.fromRoom === sId && c.toRoom === neighbor) || (c.toRoom === sId && c.fromRoom === neighbor)
      );
      assert.equal(hasCorridor, true, `${sId}.${dir} -> ${neighbor} must have a walkable SURFACE_TRANSITION_CORRIDORS link`);
    }
    const atlas = WORLD_ATLAS_REGIONS[sId.toUpperCase()];
    if (atlas) {
      for (const dir of ['north', 'south', 'east', 'west']) {
        assert.equal(
          atlas.neighbors[dir] || null,
          cfg.edgeTransitions[dir] ? cfg.edgeTransitions[dir].toUpperCase() : null,
          `Atlas ${sId}.${dir} disagrees with ROOM_CONFIGS.edgeTransitions`
        );
      }
    }
  }

  assert.equal(isEnteredRealm(ROOM_TYPES.LUMINOUS_CAVERN), true);
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.LUMINOUS_CAVERN].isSubterranean, true);
  assert.equal(isEnteredRealm(ROOM_TYPES.ARENA_3V3), true);
  assert.equal(isEnteredRealm(ROOM_TYPES.SOLARI_SUNKEN_VAULT), true);
  assert.equal(isEnteredRealm(ROOM_TYPES.INTERIOR_TAVERN), true);

  const endgameSrc = fs.readFileSync(new URL('../server/rooms/dungeonEndgameAndSkilling.js', import.meta.url), 'utf8');
  assert.doesNotMatch(endgameSrc, /sg_portal_out/, 'Legacy Starlight Grove warp portal must be removed');
  assert.doesNotMatch(endgameSrc, /ccit_portal_west/, 'Legacy Chronocore warp portal must be removed');
});

test('Authoritative Overworld Movement: Cross-biome walking emits region_changed with zero room_joined or camera snap and shares AOI visibility', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const { account: a1 } = accounts.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    const { account: a2 } = accounts.createGuestAccount({ faction: 'Umbri', classId: 'umbri_nightblade' });

    const ws1 = createMockWs();
    const ws2 = createMockWs();
    const borderWestX = -560;
    const c1 = rooms.attachConnection(ws1, a1, ROOM_TYPES.SANCTUARY_HUB, borderWestX, 0);
    const c2 = rooms.attachConnection(ws2, a2, ROOM_TYPES.SANCTUARY_HUB, -880, 0);

    assert.equal(c1.roomId, 'overworld_1');
    assert.equal(c2.roomId, 'overworld_1');
    assert.equal(c1.roomType, ROOM_TYPES.SANCTUARY_HUB);
    assert.equal(c2.roomType, ROOM_TYPES.SOLARI_CITADEL);

    // Clear initial join packets
    ws1.sent.length = 0;

    // Step hero 1 west across the Sanctuary <-> Solari border corridor (midpoint at x = -736)
    const steps = [-620, -680, -730, -780, -860];
    for (let i = 0; i < steps.length; i++) {
      rooms.handlePacket(c1, {
        type: 'move',
        x: steps[i],
        y: 0,
        z: 0,
        dir: 'left',
        isMoving: true,
        seq: i + 1,
        epoch: c1.epoch,
      });
    }

    assert.equal(c1.roomId, 'overworld_1', 'Player must remain in unified overworld_1 room');
    assert.equal(c1.roomType, ROOM_TYPES.SOLARI_CITADEL, 'Crossing corridor midpoint updates logical biome');
    assert.equal(Math.round(c1.x), -860, 'Continuous Euclidean worldX preserved across border');

    const regionMsgs = ws1.sent.filter((m) => m.type === 'region_changed');
    const roomJoins = ws1.sent.filter((m) => m.type === 'room_joined');
    assert.equal(regionMsgs.length, 1, 'Walking across border must emit region_changed');
    assert.equal(regionMsgs[0].roomType, ROOM_TYPES.SOLARI_CITADEL);
    assert.equal(roomJoins.length, 0, 'Walking across surface borders must NEVER emit room_joined portal reloads');

    // Broadcast snapshot from overworld_1 shows player 2 across border inside AOI radius
    const overworldRoom = rooms.rooms.get(c1.roomId);
    rooms.tickRoom(overworldRoom, 0.05, Date.now());
    const snap1 = ws1.sent.find((m) => m.type === 'world_state' || m.type === 'world_delta');
    assert.ok(snap1, 'Client receives world snapshot after border crossing');
    const seenOther = (snap1.players || []).some((p) => p.id === c2.id);
    assert.equal(seenOther, true, 'Players within 1400px AOI must stay visible across biome border');

    rooms.removeClient(c1);
    rooms.removeClient(c2);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Founder Astral Resonance Barrier blocks unpaid Trial accounts at Founder corridors while admitting Founders', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    assert.ok(FOUNDER_ONLY_ROOMS.has(ROOM_TYPES.STARFALL_CRATER));

    const { account: freeAcc } = accounts.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    freeAcc.statsMeta = { ...(freeAcc.statsMeta || {}), editionTier: 'free' };
    if (freeAcc.characters?.[0]) freeAcc.characters[0].statsMeta = { ...(freeAcc.characters[0].statsMeta || {}), editionTier: 'free' };
    const { account: founderAcc } = accounts.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    founderAcc.tcgLinked = true;
    founderAcc.statsMeta = { ...(founderAcc.statsMeta || {}), editionTier: 'founder' };
    const founderChars = accounts.charactersByAccount.get(founderAcc.id);
    if (founderChars) {
      for (const ch of founderChars.values()) {
        ch.statsMeta = { ...(ch.statsMeta || {}), editionTier: 'founder' };
      }
    }

    const wsFree = createMockWs();
    // Stand in Solari Citadel north corridor (x = -1376, midpoint with Starfall Crater is y = -1080)
    const cFree = rooms.attachConnection(wsFree, freeAcc, ROOM_TYPES.SOLARI_CITADEL, -1376, -1040);
    wsFree.sent.length = 0;

    rooms.handlePacket(cFree, {
      type: 'move',
      x: -1376,
      y: -1120,
      z: 0,
      dir: 'up',
      isMoving: true,
      seq: 1,
      epoch: cFree.epoch,
    });

    assert.equal(cFree.roomType, ROOM_TYPES.SOLARI_CITADEL, 'Free trial account held at Solari Citadel side of Astral Barrier');
    assert.ok(cFree.y >= -1080, 'Free trial account must not step across Starfall Crater threshold');
    assert.ok(wsFree.sent.some((m) => m.type === 'trial_gate'), 'Trial gate feedback packet sent');

    const wsFounder = createMockWs();
    const cFounder = rooms.attachConnection(wsFounder, founderAcc, ROOM_TYPES.SOLARI_CITADEL, -1376, -1040);
    wsFounder.sent.length = 0;

    rooms.handlePacket(cFounder, {
      type: 'move',
      x: -1376,
      y: -1120,
      z: 0,
      dir: 'up',
      isMoving: true,
      seq: 1,
      epoch: cFounder.epoch,
    });

    assert.equal(cFounder.roomType, ROOM_TYPES.STARFALL_CRATER, 'Founder account crosses Astral Barrier cleanly');
    assert.equal(Math.round(cFounder.y), -1120);

    rooms.removeClient(cFree);
    rooms.removeClient(cFounder);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('migrateLegacyPosition converts legacy surface local coords to global Overworld coords without altering interiors/cavern', () => {
  const legacySolari = migrateLegacyPosition({ roomType: ROOM_TYPES.SOLARI_CITADEL, x: 100, y: -50 });
  const expected = localToWorld(ROOM_TYPES.SOLARI_CITADEL, 100, -50);
  assert.equal(legacySolari.migrated, true);
  assert.equal(legacySolari.worldX, expected.wx);
  assert.equal(legacySolari.worldY, expected.wy);
  assert.equal(getRegionAtWorldPos(legacySolari.worldX, legacySolari.worldY).roomType, ROOM_TYPES.SOLARI_CITADEL);

  const alreadyMigrated = migrateLegacyPosition({
    roomType: ROOM_TYPES.SOLARI_CITADEL,
    x: expected.wx,
    y: expected.wy,
    worldX: expected.wx,
    worldY: expected.wy,
  });
  assert.equal(alreadyMigrated.migrated, false);
  assert.equal(alreadyMigrated.worldX, expected.wx);
  assert.equal(alreadyMigrated.worldY, expected.wy);

  const tavern = migrateLegacyPosition({ roomType: ROOM_TYPES.INTERIOR_TAVERN, x: 12, y: 18 });
  assert.equal(tavern.migrated, false);
  assert.equal(tavern.x, 12);
  assert.equal(tavern.y, 18);

  const cavern = migrateLegacyPosition({ roomType: ROOM_TYPES.LUMINOUS_CAVERN, x: -45, y: 80 });
  assert.equal(cavern.migrated, false);
  assert.equal(cavern.roomType, ROOM_TYPES.LUMINOUS_CAVERN);
  assert.equal(cavern.x, -45);
  assert.equal(cavern.y, 80);
});

test('All 24 surface corridors orient gradients monotonically, stay inside zone overlap, stay dry, and match ROOM_CONFIGS dimensions', () => {
  for (const [id, def] of Object.entries(SURFACE_ZONE_DEFINITIONS)) {
    const cfg = ROOM_CONFIGS[id];
    assert.ok(cfg, `ROOM_CONFIGS exists for ${id}`);
    assert.equal(cfg.halfW, def.halfW, `${id} halfW matches ROOM_CONFIGS`);
    assert.equal(cfg.halfH, def.halfH, `${id} halfH matches ROOM_CONFIGS`);
  }

  for (const cor of SURFACE_TRANSITION_CORRIDORS) {
    const pMin = SURFACE_ZONE_PLACEMENT[cor.minRoom];
    const pMax = SURFACE_ZONE_PLACEMENT[cor.maxRoom];
    const cMin = ROOM_CONFIGS[cor.minRoom];
    const cMax = ROOM_CONFIGS[cor.maxRoom];
    assert.ok(pMin && pMax && cMin && cMax, `Placements/configs exist for ${cor.id}`);

    const overlapMin = Math.max(
      cor.axis === 'y' ? pMin.originX - cMin.halfW : pMin.originY - cMin.halfH,
      cor.axis === 'y' ? pMax.originX - cMax.halfW : pMax.originY - cMax.halfH
    );
    const overlapMax = Math.min(
      cor.axis === 'y' ? pMin.originX + cMin.halfW : pMin.originY + cMin.halfH,
      cor.axis === 'y' ? pMax.originX + cMax.halfW : pMax.originY + cMax.halfH
    );
    const fixedCenter = cor.axis === 'y' ? cor.midX : cor.midY;
    assert.ok(
      fixedCenter - cor.halfWidth >= overlapMin && fixedCenter + cor.halfWidth <= overlapMax,
      `${cor.id} width fits inside shared overlap [${overlapMin}..${overlapMax}]`
    );

    const alongMin = cor.axis === 'x' ? cor.minX : cor.minY;
    const alongMax = cor.axis === 'x' ? cor.maxX : cor.maxY;
    let prevRoom = null;
    let flips = 0;
    let prevBlendT = -1;
    for (let u = alongMin - 48; u <= alongMax + 48; u += 8) {
      const wx = cor.axis === 'x' ? u : fixedCenter;
      const wy = cor.axis === 'y' ? u : fixedCenter;
      assert.equal(isWalkableSurfacePos(wx, wy, 4), true, `${cor.id} walkable at (${wx}, ${wy})`);
      assert.equal(isSurfaceFootprintInWater(wx, wy, 5, 4), false, `${cor.id} dry at (${wx}, ${wy})`);
      const reg = getRegionAtWorldPos(wx, wy);
      if (reg.inTransition && reg.corridor?.id === cor.id) {
        assert.ok(reg.blendT >= prevBlendT - 1e-6, `${cor.id} blendT monotonic ascending (${prevBlendT} -> ${reg.blendT})`);
        prevBlendT = reg.blendT;
      }
      if (prevRoom && reg.roomType !== prevRoom) flips++;
      prevRoom = reg.roomType;
    }
    assert.equal(flips, 1, `${cor.id} flips biome exactly once`);
  }

  assert.equal(getDistanceOutsideWalkableSurface(0, 0), 0);
  assert.equal(getDistanceOutsideWalkableSurface(0, 520), 0);
  assert.ok(getDistanceOutsideWalkableSurface(500, 530) > 0);
});

test('Northbound and Westbound overland walks emit monotonic single-flip region_changed events with open road decor', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const { account: founderAcc } = accounts.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    founderAcc.tcgLinked = true;
    founderAcc.statsMeta = { ...(founderAcc.statsMeta || {}), editionTier: 'founder' };
    const chars = accounts.charactersByAccount.get(founderAcc.id);
    if (chars) {
      for (const ch of chars.values()) {
        ch.statsMeta = { ...(ch.statsMeta || {}), editionTier: 'founder' };
      }
    }

    const wsN = createMockWs();
    const clientN = rooms.attachConnection(wsN, founderAcc, ROOM_TYPES.SANCTUARY_HUB, 0, -440);
    wsN.sent.length = 0;

    let seq = 1;
    const northSeq = [clientN.roomType];
    for (let wy = -456; wy >= -3400; wy -= 16) {
      rooms.handlePacket(clientN, {
        type: 'move',
        x: 0,
        y: wy,
        z: 0,
        dir: 'up',
        isMoving: true,
        seq: seq++,
        epoch: clientN.epoch,
      });
      if (northSeq[northSeq.length - 1] !== clientN.roomType) {
        northSeq.push(clientN.roomType);
      }
    }

    assert.deepEqual(northSeq, [
      ROOM_TYPES.SANCTUARY_HUB,
      ROOM_TYPES.AETHER_SPIRE,
      ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
      ROOM_TYPES.NEXUS_WARZONE,
    ]);
    const northEvents = wsN.sent.filter((m) => m.type === 'region_changed').map((m) => m.roomType);
    assert.deepEqual(northEvents, [
      ROOM_TYPES.AETHER_SPIRE,
      ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
      ROOM_TYPES.NEXUS_WARZONE,
    ]);

    const wsW = createMockWs();
    const clientW = rooms.attachConnection(wsW, founderAcc, ROOM_TYPES.SANCTUARY_HUB, -500, 0);
    wsW.sent.length = 0;
    seq = 1;
    const westSeq = [clientW.roomType];
    for (let wx = -516; wx >= -1000; wx -= 16) {
      rooms.handlePacket(clientW, {
        type: 'move',
        x: wx,
        y: 0,
        z: 0,
        dir: 'left',
        isMoving: true,
        seq: seq++,
        epoch: clientW.epoch,
      });
      if (westSeq[westSeq.length - 1] !== clientW.roomType) {
        westSeq.push(clientW.roomType);
      }
    }
    assert.deepEqual(westSeq, [ROOM_TYPES.SANCTUARY_HUB, ROOM_TYPES.SOLARI_CITADEL]);
    assert.deepEqual(
      wsW.sent.filter((m) => m.type === 'region_changed').map((m) => m.roomType),
      [ROOM_TYPES.SOLARI_CITADEL]
    );

    rooms.removeClient(clientN);
    rooms.removeClient(clientW);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }

  const decorSrc = fs.readFileSync(new URL('../client/game/zoneDecorBuilders.js', import.meta.url), 'utf8');
  assert.ok(!decorSrc.includes("type: 'ruinedArch', x: 0, y: -375"));
  assert.ok(!decorSrc.includes("type: 'ruinedArch', x: 0, y: -380"));
  // Entered Crypt doorways remain intact
  const archCount = (decorSrc.match(/type:\s*'ruinedArch'/g) || []).length;
  assert.equal(archCount, 4, 'Only the 4 Mythic Crypt doorways retain ruinedArch props');
});
