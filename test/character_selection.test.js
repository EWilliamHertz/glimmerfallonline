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
    querySelector: () => null,
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

test('Landing Page & Champion Forge: buildSpriteSheet and forge hero buttons work without throwing', async () => {
  const dummyCtx = {
    fillRect: () => {}, drawImage: () => {}, clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(400) }),
    createImageData: () => ({ data: new Uint8ClampedArray(400) }),
    putImageData: () => {},
  };
  const prevCreateElement = globalThis.document.createElement;
  globalThis.document.createElement = (tag) => {
    if (tag === 'canvas') {
      return {
        width: 32,
        height: 32,
        getContext: () => dummyCtx,
      };
    }
    return { style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {} };
  };

  const landingEl = { innerHTML: '', style: { display: 'none' } };
  const prevGetElementById = globalThis.document.getElementById;
  globalThis.document.getElementById = (id) => {
    if (id === 'landing-overlay') return landingEl;
    return prevGetElementById(id);
  };

  try {
    const { buildSpriteSheet } = await import('../client/sprites.js');
    const sheet = buildSpriteSheet();
    assert.ok(sheet.props, 'sheet.props must exist');
    assert.ok(sheet.props.graveglassTombstone, 'sheet.props.graveglassTombstone must be built without error');

    const { LandingPageController } = await import('../client/landing.js');
    const landing = new LandingPageController({
      frontpage: { close: () => {}, open: () => {} },
      onEnterWorld: () => {}
    });
    landing.open();
    assert.equal(landing.isOpen, true);

    // Test clicking Forge hero buttons
    landing.setFaction('Solari');
    landing.setTab('forge');
    assert.equal(landing.selectedFaction, 'Solari');
    assert.equal(landing.activeTab, 'forge');
    assert.ok(landingEl.innerHTML.includes('CHAMPION LOADOUT FORGE'), 'Forge tab must render loadout forge');

    landing.setFaction('Umbri');
    assert.equal(landing.selectedFaction, 'Umbri');
    assert.ok(landingEl.innerHTML.includes('Umbri'), 'Forge tab must reflect Umbri faction');

    landing.setFaction('Terra');
    assert.equal(landing.selectedFaction, 'Terra');

    landing.setFaction('Aether');
    assert.equal(landing.selectedFaction, 'Aether');
  } finally {
    globalThis.document.createElement = prevCreateElement;
    globalThis.document.getElementById = prevGetElementById;
  }
});

test('Terra Faction Integrity: Terra characters, typos ("terro"), and action bars NEVER transform to Solari', async () => {
  const { resolveFactionAndClass } = await import('../shared/protocol.js');
  const { normalizeClassAndFaction, getOrderPresetForFaction, AccountsStore } = await import('../server/accountsStore.js');
  const { getCharacterSprites } = await import('../client/sprites/characterSprites.js');

  // 1. resolveFactionAndClass checks
  const resTerra = resolveFactionAndClass({ faction: 'Terra' });
  assert.equal(resTerra.faction, 'Terra');
  assert.equal(resTerra.classId, 'forest_warden');

  // Handles 'terro' typo and lowercase
  const resTerro = resolveFactionAndClass({ faction: 'terro' });
  assert.equal(resTerro.faction, 'Terra');
  assert.equal(resTerro.classId, 'forest_warden');

  // Loadout with Solari flare_strike does NOT hijack a Terra character
  const resCrossLoadout = resolveFactionAndClass({
    faction: 'Terra',
    classId: 'forest_warden',
    loadout: { 1: 'flare_strike', 2: 'solar_flare' },
    orderTag: 'SUN',
  });
  assert.equal(resCrossLoadout.faction, 'Terra', 'Action bar must not overwrite Terra faction');
  assert.equal(resCrossLoadout.classId, 'forest_warden', 'Archetype must stay forest_warden');

  // 2. normalizeClassAndFaction checks
  const normTerro = normalizeClassAndFaction(null, 'terro');
  assert.equal(normTerro.faction, 'Terra');
  assert.equal(normTerro.classId, 'forest_warden');

  // Bad default classId does not hijack Terra
  const normProtected = normalizeClassAndFaction('solari_vanguard', 'Terra');
  assert.equal(normProtected.faction, 'Terra');
  assert.equal(normProtected.classId, 'forest_warden');

  // 3. getOrderPresetForFaction checks
  const presetTerra = getOrderPresetForFaction('Terra');
  assert.equal(presetTerra.tag, 'ROOT');
  assert.equal(presetTerra.name, 'Ironwood Watch');
  assert.equal(presetTerra.color, '#4ade80');

  const presetTerro = getOrderPresetForFaction('terro');
  assert.equal(presetTerro.tag, 'ROOT');
  assert.equal(presetTerro.name, 'Ironwood Watch');
  assert.equal(presetTerro.color, '#4ade80');

  // 4. AccountsStore creation and default character checks
  const store = new AccountsStore();
  const acc = {
    id: 'acc_dynamite_test',
    username: 'DynamiteOrc',
    displayName: 'DynamiteOrc',
    faction: 'Terra',
    classId: 'forest_warden',
    orderTag: 'ROOT',
    loadout: { 1: 'tectonic_slam' },
    equipment: {},
    inventory: [],
    bank: [],
    progression: protocol.createDefaultProgression(),
    statsMeta: { kills: 0, arenaWins: 0 },
  };
  store.accountsById.set(acc.id, acc);
  store.ensureDefaultCharacter(acc);

  const charMap = store.charactersByAccount.get(acc.id);
  assert.ok(charMap && charMap.size >= 1);
  const createdChar = charMap.values().next().value;
  assert.equal(createdChar.faction, 'Terra', 'Default character faction must be Terra');
  assert.equal(createdChar.classId, 'forest_warden', 'Default character classId must be forest_warden');
  assert.notEqual(createdChar.name, 'Solari Vanguard', 'Character name must not default to Solari Vanguard');
  assert.equal(createdChar.orderName, 'Ironwood Watch', 'Order name must be Ironwood Watch');
  assert.equal(createdChar.orderColor, '#4ade80', 'Order color must be #4ade80');

  // Public profile check
  const pub = store.toPublicProfile(acc);
  assert.equal(pub.faction, 'Terra');
  assert.equal(pub.classId, 'forest_warden');
  assert.equal(pub.orderName, 'Ironwood Watch');
  assert.equal(pub.orderColor, '#4ade80');

  // 5. Sprite paperdoll fallback check: empty equipment uses Terra ironwood gear
  const sprites = getCharacterSprites('Terra', 'forest_warden', {});
  assert.ok(sprites.down && sprites.down.length === 3);
});

test('FrontpageController: open() never silently auto-logs into multiplayer without explicit user action', async () => {
  let apiCalls = 0;
  const fp = new FrontpageController({
    net: {
      profile: null,
      connected: false,
      token: 'stale-token',
      async apiCall() {
        apiCalls++;
        return { ok: true, profile: { id: 'mp_acc', isGuest: false, username: 'testuser', characters: [] } };
      },
    },
    audio: {},
    onEnterWorld: () => {},
  });
  fp.rememberMe = true;
  fp.savedUsername = 'testuser';
  fp.savedPassword = 'secret';
  fp.playMode = 'singleplayer';
  fp.open();
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(apiCalls, 0, 'open() must not call /api/auth/* automatically before user chooses');
  assert.equal(fp.playMode, 'singleplayer', 'playMode must remain singleplayer');
  fp.close();
});

test('initGame boots window._fp cleanly and keeps Multiplayer roster isolated from Singleplayer characters', async () => {
  const keys = ['window', 'document', 'localStorage', 'sessionStorage', 'location', 'navigator', 'Image', 'Audio', 'AudioContext', 'webkitAudioContext', 'requestAnimationFrame', 'cancelAnimationFrame', 'ResizeObserver', 'IntersectionObserver', 'fetch', 'WebSocket', 'CustomEvent', 'Event', 'BroadcastChannel', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'setInterval', 'setTimeout'];
  const saved = Object.fromEntries(keys.map((k) => [k, globalThis[k]]));
  const origSetInterval = globalThis.setInterval;
  const origSetTimeout = globalThis.setTimeout;
  const createdIntervals = [];
  const createdTimeouts = [];
  globalThis.setInterval = (...args) => {
    const id = origSetInterval(...args);
    createdIntervals.push(id);
    id?.unref?.();
    return id;
  };
  globalThis.setTimeout = (...args) => {
    const id = origSetTimeout(...args);
    createdTimeouts.push(id);
    id?.unref?.();
    return id;
  };

  const els = new Map();
  const makeEl = (tag = 'div', id = '') => {
    const el = {
      tagName: tag.toUpperCase(), id,
      style: { setProperty() {}, removeProperty() {} },
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      dataset: {}, children: [], childNodes: [],
      width: 800, height: 600, innerWidth: 1024, innerHeight: 768,
      innerHTML: '', innerText: '', textContent: '', value: '',
      addEventListener() {}, removeEventListener() {},
      appendChild(c) { this.children.push(c); return c; },
      removeChild() {}, remove() {}, insertBefore() {},
      querySelector() { return makeEl(); }, querySelectorAll() { return []; },
      getContext() { return ctxMock; }, toDataURL() { return 'data:image/png;base64,'; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 }; },
      play() { return Promise.resolve(); }, pause() {},
      focus() {}, blur() {}, click() {}, setAttribute() {}, getAttribute: () => null, removeAttribute() {},
      closest() { return null; }, contains: () => false,
    };
    const ctxMock = new Proxy({}, {
      get: (_, prop) => {
        if (prop === 'canvas') return el;
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop() {} });
        if (prop === 'measureText') return () => ({ width: 20 });
        if (prop === 'getImageData') return (_x, _y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
        if (prop === 'createImageData') return (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
        return () => {};
      },
    });
    return el;
  };

  try {
    const lsMap = new Map([
      ['glimmerfall_play_mode', 'singleplayer'],
      ['glimmerfall_sp_roster_v2', JSON.stringify([
        { id: 'sp_only_aurelia', name: 'AURELIA', faction: 'Solari', classId: 'solari_vanguard', progression: protocol.createDefaultProgression() },
        { id: 'sp_only_umbri', name: 'UMBRAL ASSASSIN', faction: 'Umbri', classId: 'umbral_assassin', progression: protocol.createDefaultProgression() },
      ])],
    ]);
    const ssMap = new Map();
    globalThis.window = globalThis;
    globalThis.window.addEventListener = () => {};
    globalThis.window.removeEventListener = () => {};
    globalThis.window.dispatchEvent = () => {};
    globalThis.innerWidth = 1024;
    globalThis.innerHeight = 768;
    globalThis.devicePixelRatio = 1;
    globalThis.location = { href: 'https://glimmerfallonline.vercel.app/', hostname: 'glimmerfallonline.vercel.app', protocol: 'https:', search: '', hash: '', pathname: '/' };
    globalThis.navigator = { userAgent: 'Mozilla/5.0', maxTouchPoints: 0, clipboard: { writeText: async () => {} } };
    globalThis.localStorage = { getItem: (k) => lsMap.get(k) ?? null, setItem: (k, v) => lsMap.set(k, String(v)), removeItem: (k) => lsMap.delete(k) };
    globalThis.sessionStorage = { getItem: (k) => ssMap.get(k) ?? null, setItem: (k, v) => ssMap.set(k, String(v)), removeItem: (k) => ssMap.delete(k) };
    globalThis.document = {
      readyState: 'complete', hidden: false,
      documentElement: makeEl('html'), head: makeEl('head'), body: makeEl('body'),
      createElement: (tag) => makeEl(tag),
      getElementById: (id) => { if (!els.has(id)) els.set(id, makeEl('div', id)); return els.get(id); },
      querySelector: () => makeEl(), querySelectorAll: () => [],
      addEventListener() {}, removeEventListener() {},
    };
    globalThis.Image = class { set src(_v) {} addEventListener() {} };
    globalThis.Audio = class { pause() {} play() { return Promise.resolve(); } addEventListener() {} };
    const makeAudioNode = () => ({ connect() { return this; }, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { value: 1 }, start() {}, stop() {}, disconnect() {} });
    globalThis.AudioContext = class { constructor() { this.currentTime = 0; this.state = 'running'; this.destination = makeAudioNode(); } resume() { return Promise.resolve(); } createGain() { return makeAudioNode(); } createOscillator() { return makeAudioNode(); } createBiquadFilter() { return makeAudioNode(); } createBufferSource() { return makeAudioNode(); } createBuffer() { return { getChannelData() { return new Float32Array(64); } }; } };
    globalThis.webkitAudioContext = globalThis.AudioContext;
    globalThis.requestAnimationFrame = () => 1;
    globalThis.cancelAnimationFrame = () => {};
    globalThis.ResizeObserver = class { observe() {} disconnect() {} };
    globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' });
    globalThis.WebSocket = class { constructor() { this.readyState = 0; } close() {} send() {} };
    globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o?.detail; } };
    globalThis.Event = class { constructor(t) { this.type = t; } };
    globalThis.BroadcastChannel = class { postMessage() {} addEventListener() {} close() {} };

    const { initGame } = await import('../client/game.js');
    initGame();

    assert.ok(globalThis.window._fp, 'initGame must initialize window._fp without throwing');
    globalThis.window._fp.open();
    assert.deepEqual(
      globalThis.window._fp.getSinglePlayerRoster().map((c) => c.name),
      ['AURELIA', 'UMBRAL ASSASSIN']
    );

    globalThis.window._fp.setPlayMode('multiplayer');
    const mpRoster = globalThis.window._fp.getActiveRoster();
    assert.ok(!mpRoster.some((c) => c.id === 'sp_only_aurelia' || c.id === 'sp_only_umbri'), 'Multiplayer must never inherit Singleplayer roster figures');

    globalThis.window._fp.beginCharacterCreation();
    assert.equal(globalThis.window._fp.state, 'CHARACTER_CREATE');
    globalThis.window._fp.setPlayMode('singleplayer');
    const created = await globalThis.window._fp.createCharacter({ name: 'FrostWarden', faction: 'Terra', classId: 'forest_warden', orderTag: 'ROOT' });
    assert.equal(created?.name, 'FrostWarden');
    globalThis.window._fp.close();
  } finally {
    for (const id of createdIntervals) clearInterval(id);
    for (const id of createdTimeouts) clearTimeout(id);
    for (const k of keys) {
      if (saved[k] === undefined) delete globalThis[k];
      else globalThis[k] = saved[k];
    }
  }
});
