import test from 'node:test';
import assert from 'node:assert/strict';
import * as protocol from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { FrontpageController } from '../client/frontpage.js';

// Setup mock browser globals for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

if (typeof globalThis.document === 'undefined') {
  const bodyEl = { innerHTML: '', contains: () => false };
  const overlayEl = { style: { display: 'none' } };
  globalThis.document = {
    activeElement: null,
    getElementById: (id) => {
      if (id === 'frontpage-body') return bodyEl;
      if (id === 'frontpage-overlay') return overlayEl;
      return null;
    },
    querySelectorAll: () => [],
  };
}

test('Character Selection Integrity: Choosing Character X spawns Character X, never Character Y', async () => {
  let enteredWorldData = null;
  const mockNet = {
    connected: true,
    profile: {
      id: 'acc_test_1',
      displayName: 'CharY',
      faction: 'Solari',
      classId: 'solari_vanguard',
      activeCharacterId: 'char_y_id',
      characters: [
        {
          id: 'char_y_id',
          name: 'CharY',
          faction: 'Solari',
          classId: 'solari_vanguard',
          progression: protocol.createDefaultProgression(),
          lastPosition: { roomType: 'sanctuary_hub', x: 10, y: 20 },
        },
        {
          id: 'char_x_id',
          name: 'CharX',
          faction: 'Umbri',
          classId: 'umbral_assassin',
          progression: protocol.createDefaultProgression(),
          lastPosition: { roomType: 'sanctuary_hub', x: 50, y: 60 },
        },
      ],
    },
    async wsRpc(action, payload) {
      if (action === 'save_character') {
        const ch = mockNet.profile.characters.find((c) => c.id === payload.characterId);
        mockNet.profile.activeCharacterId = ch.id;
        mockNet.profile.displayName = ch.name;
        mockNet.profile.faction = ch.faction;
        mockNet.profile.classId = ch.classId;
        return {
          ok: true,
          character: ch,
          profile: {
            ...mockNet.profile,
            activeCharacterId: ch.id,
            displayName: ch.name,
            faction: ch.faction,
            classId: ch.classId,
          },
        };
      }
      return { ok: true };
    },
    async saveOrSelectCharacter() {},
    connectWebSocket() {},
  };

  const fp = new FrontpageController({
    net: mockNet,
    audio: {},
    onEnterWorld: (data) => {
      enteredWorldData = data;
    },
  });

  fp.playMode = 'multiplayer';
  fp.syncFromProfile(mockNet.profile);
  fp.open();

  // 1. Initial active character is Y
  assert.equal(fp.selectedCharacterId, 'char_y_id');

  // 2. Player chooses Character X
  fp.selectCharacter('char_x_id');
  assert.equal(fp.selectedCharacterId, 'char_x_id');

  // 3. Player enters realm
  await fp.playSelectedCharacter();

  assert.ok(enteredWorldData !== null, 'onEnterWorld must be invoked');
  assert.equal(enteredWorldData.profile.displayName, 'CharX', 'Profile name must be CharX');
  assert.equal(enteredWorldData.profile.classId, 'umbral_assassin', 'Profile classId must be umbral_assassin');
  assert.equal(enteredWorldData.profile.faction, 'Umbri', 'Profile faction must be Umbri');
  assert.equal(enteredWorldData.profile.activeCharacterId, 'char_x_id', 'ActiveCharacterId must be char_x_id');
});

test('Singleplayer Character Selection Integrity: Choosing Character X spawns Character X in offline realm', async () => {
  let enteredWorldData = null;
  const fp = new FrontpageController({
    net: { profile: null, connected: false },
    audio: {},
    onEnterWorld: (data) => {
      enteredWorldData = data;
    },
  });

  fp.playMode = 'singleplayer';
  const customRoster = [
    {
      id: 'sp_y',
      name: 'HeroY',
      faction: 'Solari',
      classId: 'solari_vanguard',
      progression: protocol.createDefaultProgression(),
    },
    {
      id: 'sp_x',
      name: 'HeroX',
      faction: 'Aether',
      classId: 'aether_chronomancer',
      progression: protocol.createDefaultProgression(),
    },
  ];
  fp.saveSinglePlayerRoster(customRoster);

  // Player explicitly chooses HeroX
  fp.selectCharacter('sp_x');
  assert.equal(fp.selectedCharacterId, 'sp_x');

  await fp.playSelectedCharacter();
  assert.ok(enteredWorldData !== null);
  assert.equal(enteredWorldData.playMode, 'singleplayer');
  assert.equal(enteredWorldData.profile.displayName, 'HeroX');
  assert.equal(enteredWorldData.profile.classId, 'aether_chronomancer');
  assert.equal(enteredWorldData.profile.faction, 'Aether');
  assert.equal(enteredWorldData.profile.activeCharacterId, 'sp_x');
});

test('AccountsStore & RoomManager: Character selection and attachConnection integrity', () => {
  const store = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const guest = store.createGuestAccount({
    preferredName: 'VanguardHero',
    faction: 'Solari',
    classId: 'solari_vanguard',
  });

  const accId = guest.account.id;
  const firstChar = store.listCharacters(accId)[0];
  assert.equal(firstChar.name, 'VanguardHero');

  // Create second character: ShadowHero
  const secondChar = store.createOrSelectCharacter(accId, {
    name: 'ShadowHero',
    faction: 'Umbri',
    classId: 'umbral_assassin',
  });
  assert.equal(secondChar.name, 'ShadowHero');
  assert.equal(secondChar.classId, 'umbral_assassin');

  // Verify accountsStore listCharacters contains both
  const roster = store.listCharacters(accId);
  assert.equal(roster.length, 2);

  // Test selecting firstChar
  const selected1 = store.createOrSelectCharacter(accId, { characterId: firstChar.id });
  assert.equal(selected1.id, firstChar.id);
  assert.equal(guest.account.activeCharacterId, firstChar.id);

  // Test selecting secondChar
  const selected2 = store.createOrSelectCharacter(accId, { characterId: secondChar.id });
  assert.equal(selected2.id, secondChar.id);
  assert.equal(guest.account.activeCharacterId, secondChar.id);

  // Test RoomManager attachConnection with reqCharId
  const rm = new RoomManager({ accountsStore: store });
  const fakeWs = { readyState: 1, send: () => {} };
  const clientSession = rm.attachConnection(fakeWs, guest.account, 'sanctuary_hub', 0, 0, secondChar.id);
  assert.equal(clientSession.activeCharacterId, secondChar.id, 'RoomManager client session must attach secondChar');
  assert.equal(clientSession.displayName, 'ShadowHero', 'Client session displayName must match secondChar');
  assert.equal(clientSession.classId, 'umbral_assassin', 'Client session classId must match secondChar');
  rm.stop();
});
