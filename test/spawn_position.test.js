import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { ROOM_TYPES } from '../shared/protocol.js';

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

test('AccountsStore.ensureFreshFromPostgres awaits in-flight flush and preserves dirty lastPosition on 0ms reload', async () => {
  const store = new AccountsStore();
  let dbAccRow = null;
  let dbCharRow = null;

  store.db = {
    async query(sql, params) {
      const s = String(sql);
      if (s.includes('INSERT INTO glimmerfall_accounts')) {
        await new Promise((r) => setTimeout(r, 40));
        dbAccRow = {
          id: params[0],
          username: params[1],
          username_lower: params[2],
          display_name: params[3],
          password_hash: params[4],
          is_guest: params[5],
          sso_subject: params[6],
          tcg_linked: params[7],
          tcg_handle: params[8],
          tcg_email: params[9],
          tcg_synced_at: params[10],
          faction: params[11],
          class_id: params[12],
          order_tag: params[13],
          order_name: params[14],
          order_color: params[15],
          loadout: JSON.parse(params[16]),
          equipment: JSON.parse(params[17]),
          progression: JSON.parse(params[18]),
          stats_meta: JSON.parse(params[19]),
          active_character_id: params[20],
          created_at: params[21],
          last_login_at: params[22],
          inventory: JSON.parse(params[23]),
          bank: JSON.parse(params[24]),
          quest_state: JSON.parse(params[25]),
          hp: params[26],
          solar_charge: params[27],
          last_position: JSON.parse(params[28]),
        };
        return { rows: [] };
      }
      if (s.includes('INSERT INTO glimmerfall_characters')) {
        await new Promise((r) => setTimeout(r, 40));
        dbCharRow = {
          id: params[0],
          account_id: params[1],
          name: params[2],
          faction: params[3],
          class_id: params[4],
          order_tag: params[5],
          order_name: params[6],
          order_color: params[7],
          home_biome: params[8],
          loadout: JSON.parse(params[9]),
          equipment: JSON.parse(params[10]),
          unlocked_gear: JSON.parse(params[11]),
          progression: JSON.parse(params[12]),
          stats_meta: JSON.parse(params[13]),
          inventory: JSON.parse(params[14]),
          bank: JSON.parse(params[15]),
          quest_state: JSON.parse(params[16]),
          hp: params[17],
          solar_charge: params[18],
          last_position: JSON.parse(params[19]),
        };
        return { rows: [] };
      }
      if (s.includes('SELECT * FROM glimmerfall_accounts WHERE id = $1')) {
        return { rows: dbAccRow ? [dbAccRow] : [] };
      }
      if (s.includes('SELECT * FROM glimmerfall_characters WHERE account_id = $1')) {
        return { rows: dbCharRow ? [dbCharRow] : [] };
      }
      return { rows: [] };
    },
  };
  store.dbConnected = true;

  try {
    const { account } = store.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    const accId = account.id;
    const charId = account.activeCharacterId;

    await store.flushToPostgres();
    assert.equal(dbCharRow.last_position, null);

    store.saveCharacterState(accId, charId, {
      hp: 95,
      solarCharge: 30,
      lastPosition: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 342, y: -215 },
    });

    await store.ensureFreshFromPostgres({ id: accId, force: true });

    const chars = store.listCharacters(accId);
    assert.deepEqual(chars[0].lastPosition, { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 342, y: -215 });
  } finally {
    clearStoreTimer(store);
  }
});

test('RoomManager restores exact saved position across disconnect/reconnect and sync_vitals validates bounds', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const { account } = accounts.createGuestAccount({ faction: 'Solari', classId: 'solari_vanguard' });
    const charId = account.activeCharacterId;

    const ws1 = createMockWs();
    const session1 = rooms.attachConnection(ws1, account, ROOM_TYPES.SANCTUARY_HUB, null, null, charId);
    rooms.handlePacket(session1, { type: 'move', x: 180, y: -80, z: 0, dir: 'right', isMoving: true });
    rooms.handlePacket(session1, { type: 'move', x: 340, y: -210, z: 0, dir: 'up', isMoving: false });

    // Reject impossible teleport via sync_vitals (keep authoritative client.x/client.y)
    rooms.handlePacket(session1, {
      type: 'sync_vitals',
      hp: 100,
      solarCharge: 20,
      lastPosition: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 1800, y: 1800 },
    });
    assert.equal(Math.round(session1.x), 340);
    assert.equal(Math.round(session1.y), -210);

    rooms.removeClient(session1);

    const ws2 = createMockWs();
    const session2 = rooms.attachConnection(ws2, account, null, null, null, charId);
    const rj = ws2.sent.find((m) => m.type === 'room_joined');
    assert.ok(rj, 'room_joined should be emitted');
    assert.equal(rj.roomType, ROOM_TYPES.SANCTUARY_HUB);
    assert.equal(rj.x, 340);
    assert.equal(rj.y, -210);

    rooms.removeClient(session2);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Grand Glimmer Font avoids duplicate Resonance XP in multiplayer & Forest Warden unlocks only once', async () => {
  const { recordAchievementStat } = await import('../client/achievementsAndEmotes.js');
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');

  const fontBlockMatch = gameSrc.match(/if \(net\.connected\) \{\s*net\.send\(\{ type: 'harvest_node', nodeId: node\.id \}\);\s*\} else \{[\s\S]*?awardProfessionXP\('resonance_extraction'/);
  assert.ok(fontBlockMatch, 'Grand Glimmer Font local awardProfessionXP should live exclusively inside the offline else branch');

  const store = new AccountsStore();
  try {
    const { account } = store.createGuestAccount({ faction: 'Terra', classId: 'forest_warden' });
    const accId = account.id;
    store.saveProgression(accId, {
      level: 10,
      xp: 0,
      professions: { resonance_extraction: { xp: 15000, level: 15 } },
      tempering: { weapon: 2 },
      stats: { trees_cut_total: 42 },
      achievements: {
        completed: { ach_forest_warden: { unlockedAt: '2026-11-15T16:00:00.000Z' } },
        unlockedTitles: ['The Forest Warden'],
      },
      equippedTitle: 'The Forest Warden',
    });
    const saved = store.accountsById.get(accId).progression;
    const merged = store.mergeValidProgression(saved, {
      level: 10,
      xp: 0,
      professions: { resonance_extraction: { xp: 15100, level: 15 } },
    });
    assert.ok(merged.achievements?.completed?.ach_forest_warden, 'ach_forest_warden must survive mergeValidProgression');
    assert.ok(merged.achievements?.unlockedTitles?.includes('The Forest Warden'));
    assert.equal(merged.tempering?.weapon, 2);
    assert.equal(merged.stats?.trees_cut_total, 42);
    assert.equal(merged.equippedTitle, 'The Forest Warden');

    let unlockCount = 0;
    const freshProg = { stats: {}, achievements: { completed: {}, unlockedTitles: [] } };
    recordAchievementStat(freshProg, 'prof_extraction_level_10', 1, () => { unlockCount++; });
    recordAchievementStat(freshProg, 'prof_extraction_level_10', 1, () => { unlockCount++; });
    const wipedProg = { stats: {}, achievements: { completed: {}, unlockedTitles: [] } };
    recordAchievementStat(wipedProg, 'prof_extraction_level_10', 1, () => { unlockCount++; });
    assert.equal(unlockCount, 1);
  } finally {
    clearStoreTimer(store);
  }
});

test('Client frontpage and game entry keep exact spawn coords across WS connect & camera snap', async () => {
  const frontpageSrc = fs.readFileSync(new URL('../client/frontpage.js', import.meta.url), 'utf8');
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');

  assert.match(frontpageSrc, /this\.net\?\.connectWebSocket\(true\)/, 'frontpage should force-reconnect WS with updated coords/character');
  assert.match(gameSrc, /!currentRoomId \|\| !currentRoomType \|\| currentRoomType !== targetRealm/);
  assert.match(gameSrc, /else if \(!net\.connected && \(!net\.token \|\| !net\.ws \|\| net\.ws\.readyState > 1\)\)/);
  assert.match(gameSrc, /syncNetProfileLastPosition/);

  const prevWindow = globalThis.window;
  const prevLocalStorage = globalThis.localStorage;
  try {
    globalThis.window = {
      location: {
        protocol: 'https:',
        hostname: '8080-cs-553118797525-default.cs-europe-west4-pear.cloudshell.dev',
        host: '8080-cs-553118797525-default.cs-europe-west4-pear.cloudshell.dev',
        search: '',
      },
      addEventListener: () => {},
    };
    const storeMap = new Map([['glimmerfall_server_url', 'https://ws.glimmerfall.online']]);
    globalThis.localStorage = {
      getItem: (k) => storeMap.get(k) ?? null,
      setItem: (k, v) => storeMap.set(k, String(v)),
      removeItem: (k) => storeMap.delete(k),
    };
    const { MultiplayerClient } = await import('../client/network.js');
    const net = new MultiplayerClient({ onPacket: () => {}, onStatusChange: () => {} });
    assert.equal(net.isLocalOrigin(), true, 'Cloud Shell web preview must be treated as local origin');
    assert.equal(net.getServerBase(), '', 'Cloud Shell web preview must use same-origin Vite proxy');
    assert.equal(storeMap.has('glimmerfall_server_url'), false, 'Stale remote server URL must be cleared');
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevLocalStorage;
  }

  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const { account } = accounts.createGuestAccount({ preferredName: 'EWACH', faction: 'Solari', classId: 'solari_vanguard' });
    const charAId = account.activeCharacterId;
    const charB = accounts.createOrSelectCharacter(account.id, {
      name: 'AltKnight',
      faction: 'Terra',
      classId: 'terra_warden',
    });
    const charBId = charB.id;
    accounts.saveCharacterState(account.id, charBId, {
      hp: 100,
      solarCharge: 0,
      lastPosition: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 188, y: -110 },
    });
    account.activeCharacterId = charAId;
    accounts.syncAccountFromActiveChar(account);

    const ws = createMockWs();
    const client = rooms.attachConnection(ws, account, ROOM_TYPES.SANCTUARY_HUB, 0, 96, charAId);
    assert.equal(client.x, 0);
    assert.equal(client.y, 96);

    await rooms.handleWsAuthRpc(client, {
      reqId: 'req_save_char_1',
      action: 'save_character',
      payload: { characterId: charBId, enterRealm: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 96 },
    });

    const updatedCharB = accounts.listCharacters(account.id).find((c) => c.id === charBId);
    assert.equal(updatedCharB.lastPosition.x, 188, 'save_character must not clobber target char saved lastPosition with (0, 96)');
    assert.equal(updatedCharB.lastPosition.y, -110);
    assert.equal(client.x, 188, 'save_character must move server client to target char saved lastPosition');
    assert.equal(client.y, -110);

    // Instant room persistence check: joinRoom must save the new realm immediately without waiting for disconnect
    rooms.joinRoom(client, ROOM_TYPES.SOLARI_CITADEL, null, 24, 48, 'down');
    const savedImmediately = accounts.listCharacters(account.id).find((c) => c.id === charBId);
    assert.equal(savedImmediately.lastPosition.roomType, ROOM_TYPES.SOLARI_CITADEL, 'joinRoom must save new roomType immediately');
    assert.equal(savedImmediately.lastPosition.x, 24);
    assert.equal(savedImmediately.lastPosition.y, 48);

    // Throttled move persistence: stopping moving saves exact resting coordinate immediately
    let saveCalls = 0;
    const origSaveState = accounts.saveCharacterState.bind(accounts);
    accounts.saveCharacterState = (...args) => {
      saveCalls += 1;
      return origSaveState(...args);
    };
    rooms.handlePacket(client, {
      type: 'move',
      x: 28,
      y: 48,
      z: 0,
      dir: 'right',
      isMoving: true,
      epoch: client.roomEpoch,
    });
    assert.equal(saveCalls, 0, 'Tiny 4px continuous move step should not flood DB saves at 20Hz');
    rooms.handlePacket(client, {
      type: 'move',
      x: 30,
      y: 52,
      z: 0,
      dir: 'down',
      isMoving: false,
      epoch: client.roomEpoch,
    });
    assert.equal(saveCalls, 1, 'Stopping movement must persist exact position immediately');
    const afterStop = accounts.listCharacters(account.id).find((c) => c.id === charBId);
    assert.equal(afterStop.lastPosition.x, 30);
    assert.equal(afterStop.lastPosition.y, 52);

    rooms.removeClient(client);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});
