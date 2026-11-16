import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import {
  createMoveSyncState,
  nextMoveSequence,
  resetMoveSyncOnRoomJoin,
  mapInputEventToAction,
  resetDirectionalInputs,
  computeStableFacingDir,
  smoothLerpFactor,
  reconcilePlayerSnapshot,
} from '../client/game/movementReconciler.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { ROOM_TYPES } from '../shared/protocol.js';
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

function clearStoreTimer(store) {
  if (store?.flushTimer) {
    clearTimeout(store.flushTimer);
    store.flushTimer = null;
  }
}

test('reconcilePlayerSnapshot eliminates backward rubberbanding under RTT while honoring server overrides', () => {
  const state = createMoveSyncState();
  const now = 10_000;

  // Client walks/sprints forward and sends seq 1..6 while server has only acked seq 3
  for (let i = 0; i < 6; i++) {
    nextMoveSequence(state, now + i * 50, true);
  }
  const walkingLead = reconcilePlayerSnapshot({
    player: { x: 240, y: 0, isMoving: true },
    sp: { x: 130, y: 0, isDead: false, lastMoveSeq: 3, posOverrideSeq: 1 },
    state,
    pingMs: 220,
    moveSpeedPxPerSec: 225,
    nowMs: now + 300,
  });
  assert.equal(walkingLead.action, 'none', 'In-flight RTT lead must not pull walking player backward');

  // Client stops moving right now (seq 7 sent with isMoving:false); stale snapshot seq 5 arrives 30px behind
  nextMoveSequence(state, now + 320, false);
  const stopInFlight = reconcilePlayerSnapshot({
    player: { x: 245, y: 0, isMoving: false },
    sp: { x: 215, y: 0, isDead: false, lastMoveSeq: 5, posOverrideSeq: 1 },
    state,
    pingMs: 220,
    moveSpeedPxPerSec: 225,
    nowMs: now + 340,
  });
  assert.equal(stopInFlight.action, 'none', 'Stopping must never snap backward while stop packet is in flight');

  // Once server catches up to seq 7 and player remains idle > 90ms with residual offset, gently settle
  const idleSettled = reconcilePlayerSnapshot({
    player: { x: 245, y: 0, isMoving: false },
    sp: { x: 225, y: 0, isDead: false, lastMoveSeq: 7, posOverrideSeq: 1 },
    state,
    pingMs: 220,
    moveSpeedPxPerSec: 225,
    nowMs: now + 450,
  });
  assert.equal(idleSettled.action, 'blend');

  // Authoritative server override (posOverrideSeq bumped by dash/knockback/respawn) overrides lead immediately
  const overrideRes = reconcilePlayerSnapshot({
    player: { x: 245, y: 0, isMoving: true },
    sp: { x: 40, y: -90, isDead: false, lastMoveSeq: 5, posOverrideSeq: 2 },
    state,
    pingMs: 220,
    moveSpeedPxPerSec: 225,
    nowMs: now + 460,
  });
  assert.equal(overrideRes.action, 'snap');
  assert.equal(overrideRes.snapCamera, true);
  assert.equal(state.lastAckedOverrideSeq, 2);

  // Room transition suppresses stale snapshots
  resetMoveSyncOnRoomJoin(state, 7, 2);
  const transRes = reconcilePlayerSnapshot({
    player: { x: 0, y: 96, isMoving: false },
    sp: { x: 225, y: 0, lastMoveSeq: 7, posOverrideSeq: 2 },
    state,
    isTransitioningZone: true,
  });
  assert.equal(transRes.action, 'ignore');
});

test('Input code mapping and directional facing hysteresis prevent stuck keys and circular spinning', () => {
  // Shift/Alt/dead-key characters still map via physical event.code
  assert.equal(mapInputEventToAction({ code: 'KeyW', key: 'W' }), 'w');
  assert.equal(mapInputEventToAction({ code: 'KeyA', key: 'å' }), 'a');
  assert.equal(mapInputEventToAction({ code: 'ShiftLeft', key: 'Shift' }), 'shift');
  assert.equal(mapInputEventToAction({ code: 'ArrowRight', key: 'ArrowRight' }), 'right');
  assert.equal(mapInputEventToAction({ key: 'd' }), 'd');

  // Diagonal micro-jitter around 45 degrees must NOT flip direction back and forth
  let dir = 'right';
  dir = computeStableFacingDir(0.71, 0.70, dir);
  assert.equal(dir, 'right');
  dir = computeStableFacingDir(0.69, 0.73, dir);
  assert.equal(dir, 'right', 'Small Y excess near 45deg should not spin character');
  dir = computeStableFacingDir(0.15, 0.98, dir);
  assert.equal(dir, 'down', 'Strong downward vector must switch cleanly to down');
  dir = computeStableFacingDir(-1, 0, dir);
  assert.equal(dir, 'left', 'Pure cardinal input switches immediately');

  const inputs = { w: true, a: true, s: false, d: false, up: true, down: false, left: false, right: true, shift: true, axisX: 0.7, axisY: -0.4 };
  resetDirectionalInputs(inputs);
  assert.deepEqual(inputs, { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false, shift: false, axisX: 0, axisY: 0 });
  assert.ok(smoothLerpFactor(14, 1 / 60) > 0 && smoothLerpFactor(14, 1 / 60) < 1);
});

test('Server echoes lastMoveSeq, avoids mid-walk DB flush storms, and guards live walk against HTTP race overwrites', async () => {
  const accounts = new AccountsStore();
  let pgQueryCount = 0;
  accounts.db = {
    async query() {
      pgQueryCount += 1;
      return { rows: [] };
    },
  };
  accounts.dbConnected = true;

  const rooms = new RoomManager(accounts);
  try {
    const { account, token } = accounts.createGuestAccount({
      preferredName: 'SmoothRunner',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
    const charId = account.activeCharacterId;
    const ws = createMockWs();
    const client = rooms.attachConnection(ws, account, ROOM_TYPES.SANCTUARY_HUB, 0, 96, charId);

    const queriesAtSpawn = pgQueryCount;
    // Simulate walking 160px northward across multiple 20Hz packets without stopping
    for (let step = 1; step <= 8; step++) {
      rooms.handlePacket(client, {
        type: 'move',
        x: 0,
        y: 96 - step * 20,
        z: 0,
        dir: 'up',
        isMoving: true,
        seq: step,
        epoch: client.roomEpoch,
      });
    }
    assert.equal(client.lastMoveSeq, 8);
    assert.equal(pgQueryCount, queriesAtSpawn, 'Continuous walking must not trigger blocking Postgres flushes mid-stride');

    // Verify snapshot carries lastMoveSeq & posOverrideSeq
    const room = rooms.rooms.get(client.roomId);
    const snap = rooms.buildSnapshot(room);
    const me = snap.players.find((p) => p.id === client.id);
    assert.equal(me.lastMoveSeq, 8);
    assert.ok(me.posOverrideSeq >= 1);

    // Delayed HTTP save-vitals arriving with older coordinate must NOT pull live walking player backward
    const fakeReq = Readable.from([
      Buffer.from(JSON.stringify({
        token,
        characterId: charId,
        hp: 100,
        solarCharge: 10,
        lastPosition: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 96 },
      })),
    ]);
    fakeReq.url = '/api/auth/save-vitals';
    fakeReq.method = 'POST';
    fakeReq.headers = {
      host: 'localhost',
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    };
    const fakeRes = {
      statusCode: 0,
      headers: {},
      body: '',
      writeHead(code, headers) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(chunk) {
        this.body = chunk;
      },
    };
    await handleApiRequest(fakeReq, fakeRes, { accounts, rooms });
    assert.equal(fakeRes.statusCode, 200, fakeRes.body);
    assert.equal(Math.round(client.y), -64, 'Live moving player Y must remain at -64 instead of being pulled back to 96');

    // Stopping movement saves exact position immediately in memory
    rooms.handlePacket(client, {
      type: 'move',
      x: 0,
      y: -70,
      z: 0,
      dir: 'up',
      isMoving: false,
      seq: 9,
      epoch: client.roomEpoch,
    });
    const savedChar = accounts.listCharacters(account.id).find((c) => c.id === charId);
    assert.equal(savedChar.lastPosition.y, -70);

    rooms.removeClient(client);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Client wires sequence-based movement reconciliation and single-pointer touch stick cleanup', () => {
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  const touchSrc = fs.readFileSync(new URL('../client/touch.js', import.meta.url), 'utf8');

  assert.match(gameSrc, /reconcilePlayerSnapshot\(/);
  assert.match(gameSrc, /computeStableFacingDir\(/);
  assert.match(gameSrc, /mapInputEventToAction\(/);
  assert.match(gameSrc, /resetDirectionalInputs\(/);
  assert.match(gameSrc, /lostpointercapture|focusin/);
  assert.match(touchSrc, /stickPointer !== null && stickPointer !== e\.pointerId/);
  assert.match(touchSrc, /lostpointercapture/);
});
