import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as protocol from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';
import { ABILITY_ICON_SVGS, getAbilityIconHtml, getFactionCrestSvg } from '../client/ui/abilityIcons.js';
import { drawTileChunkTransitions } from '../client/render/autoTiler.js';
import { createVfxRenderer } from '../client/render/vfxRenderer.js';
import { computeDirectionalShadowOffset } from '../client/game/atmosphereEffects.js';
import { executeOfflineAbility, tickOfflineEntityDebuffsAndDoTs } from '../client/engine/offlineCombat.js';

function createMockPixelDom() {
  function makeMockCanvas(w = 32, h = 32) {
    const pixels = new Uint8ClampedArray(w * h * 4);
    const ops = [];
    const ctx = {
      imageSmoothingEnabled: false,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1,
      lineDashOffset: 0,
      font: '10px monospace',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      fillRect(x, y, rw, rh) {
        ops.push(['fillRect', this.fillStyle, x, y, rw, rh]);
        const ix0 = Math.max(0, Math.floor(x));
        const iy0 = Math.max(0, Math.floor(y));
        const ix1 = Math.min(w, Math.ceil(x + rw));
        const iy1 = Math.min(h, Math.ceil(y + rh));
        const col = String(this.fillStyle || '#ffffff');
        let r = 200;
        let g = 200;
        let b = 200;
        if (col.startsWith('#') && col.length >= 7) {
          r = parseInt(col.slice(1, 3), 16) || 0;
          g = parseInt(col.slice(3, 5), 16) || 0;
          b = parseInt(col.slice(5, 7), 16) || 0;
        }
        for (let py = iy0; py < iy1; py++) {
          for (let px = ix0; px < ix1; px++) {
            const idx = (py * w + px) * 4;
            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
          }
        }
      },
      clearRect() {
        pixels.fill(0);
      },
      drawImage() {
        ops.push(['drawImage']);
      },
      getImageData: () => ({ data: new Uint8ClampedArray(pixels) }),
      createImageData: () => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData(img) {
        if (img?.data) pixels.set(img.data.subarray(0, pixels.length));
      },
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      ellipse() {},
      arc() {},
      stroke() {
        ops.push(['stroke', this.strokeStyle]);
      },
      fill() {
        ops.push(['fill', this.fillStyle]);
      },
      strokeRect() {
        ops.push(['strokeRect', this.strokeStyle]);
      },
      fillText() {},
      measureText: (t) => ({ width: String(t || '').length * 6 }),
      setLineDash() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      scale() {},
      createRadialGradient: () => ({ addColorStop() {} }),
      createLinearGradient: () => ({ addColorStop() {} }),
      __ops: ops,
    };
    return {
      width: w,
      height: h,
      _pixels: pixels,
      _ops: ops,
      getContext: () => ctx,
    };
  }

  return { makeMockCanvas };
}

test('All 8 Classes have unique passives, distinct starter kits, and 32 class-exclusive abilities', () => {
  const classes = Object.values(protocol.CLASSES_CATALOG);
  assert.equal(classes.length, 8);

  const byFaction = new Map();
  for (const cls of classes) {
    if (!byFaction.has(cls.faction)) byFaction.set(cls.faction, []);
    byFaction.get(cls.faction).push(cls);

    const passive = protocol.getClassPassive(cls.id);
    assert.ok(passive && passive.name && passive.desc, `Missing passive for ${cls.id}`);
    assert.equal(cls.passiveName, passive.name);

    const wep = cls.defaultEquipment?.weapon;
    const arm = cls.defaultEquipment?.armor;
    const off = cls.defaultEquipment?.offhand;
    assert.ok(protocol.EQUIPMENT_CATALOG[wep], `Missing starter weapon ${wep} for ${cls.id}`);
    assert.ok(protocol.EQUIPMENT_CATALOG[arm], `Missing starter armor ${arm} for ${cls.id}`);
    assert.ok(protocol.EQUIPMENT_CATALOG[off], `Missing starter offhand ${off} for ${cls.id}`);

    const classSpells = Object.values(protocol.ABILITIES_CATALOG).filter((ab) => ab.classId === cls.id);
    assert.equal(classSpells.length, 4, `${cls.id} must own 4 class-exclusive abilities`);
    for (const sp of classSpells) {
      assert.equal(sp.faction, cls.faction);
      assert.ok(sp.prereq && protocol.ABILITIES_CATALOG[sp.prereq], `${sp.id} missing valid prereq`);
    }
  }

  // Subclasses inside every faction have distinct starting kits & loadouts
  for (const [fac, pair] of byFaction.entries()) {
    assert.equal(pair.length, 2, `${fac} should have 2 classes`);
    const [a, b] = pair;
    assert.notDeepEqual(a.defaultEquipment, b.defaultEquipment, `${fac} subclasses must not share defaultEquipment`);
    assert.notDeepEqual(a.legacyDefaultLoadout, b.legacyDefaultLoadout, `${fac} subclasses must not share legacyDefaultLoadout`);
  }

  // Class-gating blocks cross-class specialization & loadouts
  const prog = protocol.createDefaultProgression('vanguard');
  prog.level = 30;
  prog.skillPoints = 20;
  prog.skills.flare_strike = 1;
  assert.equal(protocol.canUpgradeAbility(prog, 'aegis_slam', 'solari_vanguard'), true);
  assert.equal(protocol.canUpgradeAbility(prog, 'starlight_mend', 'solari_vanguard'), false);

  const sanitizedBar = protocol.sanitizeLoadout(
    { 1: 'flare_strike', 2: 'starlight_mend', 9: 'aegis_slam' },
    'solari_vanguard',
    prog
  );
  assert.equal(sanitizedBar[1], 'flare_strike');
  assert.equal(sanitizedBar[2], undefined, 'Cross-class ability must be stripped from loadout');

  // All Tier-7 apex transformations belong to OFF_GCD_KINDS
  for (const kind of ['archon_form', 'voidform', 'treant_form', 'apotheosis']) {
    assert.equal(protocol.OFF_GCD_KINDS.has(kind), true, `${kind} must be in OFF_GCD_KINDS`);
  }
});

test('Shared combatRules: 4 Faction Resource Mechanics, Chrono-Snap, Dusk Marks, and Timer Decay', () => {
  // Config covers all 4 factions cleanly
  assert.equal(protocol.getFactionResourceConfig('Solari').mode, 'bar');
  assert.equal(protocol.getFactionResourceConfig('Solari').max, 100);
  assert.equal(protocol.getFactionResourceConfig('Umbri').mode, 'pips');
  assert.equal(protocol.getFactionResourceConfig('Umbri').max, 5);
  assert.equal(protocol.getFactionResourceConfig('Terra').max, 5);
  assert.equal(protocol.getFactionResourceConfig('Aether').max, 4);

  // Umbri Assassin builds +2 Dusk Marks per melee Flash, then consumes them on a Rite
  const assassin = { classId: 'umbral_assassin', solarCharge: 50 };
  protocol.ensureActorFactionState(assassin, 'Umbri');
  protocol.advanceFactionResourceOnCast(assassin, 'Umbri', 'umbral_assassin', protocol.ABILITIES_CATALOG.whisper_of_the_void);
  assert.equal(assassin.duskMarks, 2);
  protocol.advanceFactionResourceOnCast(assassin, 'Umbri', 'umbral_assassin', protocol.ABILITIES_CATALOG.serrated_mutilate);
  assert.equal(assassin.duskMarks, 4);
  const riteSpend = protocol.advanceFactionResourceOnCast(assassin, 'Umbri', 'umbral_assassin', protocol.ABILITIES_CATALOG.soul_tithe);
  assert.equal(riteSpend.duskMarksSpent, 4);
  assert.equal(assassin.duskMarks, 0);

  const zeroMarkDmg = protocol.resolveAbilityNumbers({
    spec: protocol.ABILITIES_CATALOG.soul_tithe,
    rank: 1,
    effStats: { power: 6, bastion: 4, resonance: 6, tempo: 4 },
    actor: assassin,
    duskMarksSpent: 0,
  });
  const fourMarkDmg = protocol.resolveAbilityNumbers({
    spec: protocol.ABILITIES_CATALOG.soul_tithe,
    rank: 1,
    effStats: { power: 6, bastion: 4, resonance: 6, tempo: 4 },
    actor: assassin,
    duskMarksSpent: 4,
  });
  assert.ok(fourMarkDmg.dmg > zeroMarkDmg.dmg, 'Spending Dusk Marks must boost Rite damage');
  assert.ok(fourMarkDmg.duskLeechBonus > 0.2, 'Spending 4 Dusk Marks must grant +24% leech bonus');

  // Chronomancer Sage triggers Chrono-Snap every 3rd Flash & reaches Astral Resonance 4
  const chrono = { classId: 'chronomancer_sage', solarCharge: 50 };
  protocol.ensureActorFactionState(chrono, 'Aether');
  const aetherFlash = protocol.ABILITIES_CATALOG.reality_fracture;
  protocol.advanceFactionResourceOnCast(chrono, 'Aether', 'chronomancer_sage', aetherFlash);
  protocol.advanceFactionResourceOnCast(chrono, 'Aether', 'chronomancer_sage', aetherFlash);
  const third = protocol.advanceFactionResourceOnCast(chrono, 'Aether', 'chronomancer_sage', aetherFlash);
  assert.equal(third.chronoSnapTriggered, true);
  assert.equal(chrono.chronoSnapReady, true);
  assert.equal(chrono.astralResonance, 3);
  const consumed = protocol.advanceFactionResourceOnCast(chrono, 'Aether', 'chronomancer_sage', protocol.ABILITIES_CATALOG.gravity_well);
  assert.equal(consumed.chronoSnapConsumed, true);
  assert.equal(chrono.chronoSnapReady, false);

  // Timers decay cleanly without negative overshoot
  const actor = { sunbrandTimer: 1.2, voidformTimer: 0.4, bastionBannerTimer: 5.0 };
  protocol.tickActorCombatTimers(actor, 1.0);
  assert.ok(Math.abs(actor.sunbrandTimer - 0.2) < 1e-6);
  assert.equal(actor.voidformTimer, 0);
  assert.equal(actor.bastionBannerTimer, 4.0);
});

test('Free Skill Point Respec: Auto-migrates legacy builds and supports on-demand respec_skills packet', () => {
  // Legacy Lv. 10 build with Tier 2+ pre-remaster points & no remasterRespecV2 flag
  const legacyProg = protocol.createDefaultProgression('vanguard');
  legacyProg.level = 10;
  legacyProg.skillPoints = 5;
  legacyProg.skills = { flare_strike: 2, radiant_bulwark: 3, consecration: 1 };
  assert.equal(protocol.shouldAutoRemasterRespec(legacyProg), true);

  const res = protocol.respecCharacterSkills(legacyProg);
  assert.equal(res.respecced, true);
  assert.equal(res.refunded, 5); // 1 extra rank on starter + 3 on bulwark + 1 on consecration
  assert.equal(legacyProg.skillPoints, 10);
  assert.equal(legacyProg.skills.flare_strike, 1);
  assert.equal(legacyProg.skills.radiant_bulwark, undefined);
  assert.equal(legacyProg.remasterRespecV2, true);
  assert.equal(protocol.shouldAutoRemasterRespec(legacyProg), false);

  // Live server RoomManager packet: respec_skills refunds points & updates loadout
  const store = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const created = store.createGuestAccount({
    preferredName: 'RespecTester',
    faction: 'Aether',
    classId: 'nexus_weaver',
  });
  const acc = created.account;
  const ch = store.listCharacters(acc.id)[0];
  ch.progression.level = 12;
  ch.progression.skillPoints = 7;
  ch.progression.skills = { reality_fracture: 1, glacial_spike: 3, arcane_tether: 2 };
  ch.progression.remasterRespecV2 = true;
  acc.progression = JSON.parse(JSON.stringify(ch.progression));

  const rm = new RoomManager({ accountsStore: store });
  const sent = [];
  const ws = { readyState: 1, send: (raw) => sent.push(JSON.parse(raw)) };
  const client = rm.attachConnection(ws, acc, protocol.ROOM_TYPES.SANCTUARY_HUB, 0, 0, ch.id);
  client.prog.level = 12;
  client.prog.skillPoints = 7;
  client.prog.skills = { reality_fracture: 1, glacial_spike: 3, arcane_tether: 2 };

  rm.handlePacket(client, { type: 'respec_skills' });
  assert.equal(client.prog.skillPoints, 12);
  assert.equal(client.prog.skills.glacial_spike, undefined);
  assert.equal(client.prog.skills.reality_fracture, 1);
  assert.ok(sent.some((m) => m.type === 'progression_sync' || m.type === 'profile_updated'), 'respec_skills must emit progression_sync/profile_updated');
  rm.stop();
});

test('Offline Combat Executor: runs class ultimates, two-step Temporal Anchor, and DoT ticks cleanly', () => {
  const hostiles = [
    { id: 'mob_1', type: 'mob', name: 'Ash Stalker', x: 30, y: 0, hp: 120, maxHp: 120, hitFlash: 0 },
  ];
  const dmgLog = [];
  const groundZones = [];
  const projectiles = [];
  const skyBeams = [];
  const slashArcs = [];
  const afterimages = [];
  const cooldowns = { 1: 0, 2: 5, 3: 5, 4: 0, 9: 4, 10: 0, 11: 0, 12: 0 };
  const prog = protocol.createDefaultProgression('chronomancer_sage');
  prog.level = 30;
  const player = {
    x: 0, y: 0, dir: 'right', hp: 60, maxHp: 100, shield: 0, solarCharge: 50, maxSolarCharge: 100,
    cooldowns,
  };
  const sharedCtx = {
    rank: 2,
    slot: 9,
    eff: { power: 6, bastion: 4, resonance: 8, tempo: 6 },
    critChance: 0.25,
    player,
    localProfile: { faction: 'Aether', classId: 'chronomancer_sage' },
    prog,
    entities: hostiles,
    acquiredTarget: hostiles[0],
    currentTarget: hostiles[0],
    groundZones,
    projectiles,
    skyBeams,
    slashArcs,
    afterimages,
    mapBounds: { halfW: 600, halfH: 600 },
    cooldowns,
    currentRoomType: protocol.ROOM_TYPES.SANCTUARY_HUB,
    isHostileEntity: (e) => e.type === 'mob',
    damageOfflineEntity: (e, dmg, isCrit, isRite, name) => {
      e.hp = Math.max(0, e.hp - dmg);
      dmgLog.push({ id: e.id, dmg, name });
    },
    spawnSparkBurst: () => {},
    spawnSmokeBurst: () => {},
    spawnFCT: () => {},
    triggerScreenShake: () => {},
    audio: {},
    updatePlayerUI: () => {},
    getFacingVector: () => ({ dx: 1, dy: 0, angle: 0 }),
  };

  // 1. Temporal Anchor 1st press sets anchor; move away; 2nd press rewinds & heals & resets Flash CDs
  executeOfflineAbility({ ...sharedCtx, spec: protocol.ABILITIES_CATALOG.temporal_anchor });
  assert.ok(player._temporalAnchor && player.anchorTimer > 0);
  player.x = 180;
  player.y = 90;
  executeOfflineAbility({ ...sharedCtx, spec: protocol.ABILITIES_CATALOG.temporal_anchor });
  assert.equal(player.x, 0);
  assert.equal(player.y, 0);
  assert.ok(player.hp >= 90, 'Temporal Recall heals 30% Max HP');
  assert.equal(cooldowns[2], 0, 'Temporal Recall resets other ability cooldowns');

  // 2. Vanguard Judgement Verdict scales with shield & deals damage + skyBeam
  executeOfflineAbility({
    ...sharedCtx,
    localProfile: { faction: 'Solari', classId: 'solari_vanguard' },
    spec: protocol.ABILITIES_CATALOG.judgement_verdict,
  });
  assert.ok(skyBeams.length >= 1);
  assert.ok(dmgLog.some((d) => d.name === 'Judgement Verdict'));

  // 3. DoT ticks deal damage after 1.0s accumulated
  const beforeHp = hostiles[0].hp;
  hostiles[0].sunbrandTimer = 4.0;
  tickOfflineEntityDebuffsAndDoTs({
    entities: hostiles,
    dt: 1.05,
    damageOfflineEntity: sharedCtx.damageOfflineEntity,
  });
  assert.equal(hostiles[0].hp, beforeHp - 5);
});

test('Visual Remaster Modules: SVG Ability Icons, Auto-Tiler, VFX Renderer, Sprites Poses & Directional Shadows', async () => {
  // 1. SVG Ability Icons cover 100% of ABILITIES_CATALOG + all 4 Faction Crests
  for (const ab of Object.values(protocol.ABILITIES_CATALOG)) {
    assert.ok(ABILITY_ICON_SVGS[ab.id], `Missing bespoke SVG emblem for ability ${ab.id}`);
    const html = getAbilityIconHtml(ab, 24);
    assert.ok(html.includes('<svg') && html.includes('viewBox="0 0 36 36"'), `Invalid SVG HTML for ${ab.id}`);
  }
  for (const fac of ['Solari', 'Umbri', 'Terra', 'Aether']) {
    assert.ok(getFactionCrestSvg(fac, 18).includes('<svg'));
  }

  // 2. Directional Shadows vary cleanly across time of day
  const dawn = computeDirectionalShadowOffset({ minuteOfDay: 180 });
  const noon = computeDirectionalShadowOffset({ minuteOfDay: 720 });
  assert.ok(typeof dawn.dx === 'number' && typeof dawn.dy === 'number');
  assert.notEqual(dawn.dx, noon.dx);

  // 3. Auto-Tiler, VFX Renderer, and Character/Boss Sprites execute cleanly against Mock 2D Canvas
  const { makeMockCanvas } = createMockPixelDom();
  const prevCreate = globalThis.document?.createElement;
  if (globalThis.document) {
    globalThis.document.createElement = (tag) => (tag === 'canvas' ? makeMockCanvas(32, 32) : { style: {} });
  }
  try {
    const chunkCanvas = makeMockCanvas(256, 256);
    const cctx = chunkCanvas.getContext('2d');
    const getTileMeta = (wx, wy) => {
      if (wx === 0 && wy === 0) return { category: 'road', biome: 'road' };
      if (wx === 1 && wy === 0) return { category: 'grass', biome: 'grass' };
      if (wx === 2 && wy === 0) return { category: 'water', biome: 'water' };
      if (wx === 3 && wy === 0) return { category: 'mountain', biome: 'mountain', isWall: true };
      return { category: 'biome', biome: 'terra' };
    };
    drawTileChunkTransitions({
      cctx,
      chunkX: 0,
      chunkY: 0,
      tileChunkTiles: 4,
      tileSize: 16,
      getTileMeta,
      sprites: { tiles: {} },
    });
    assert.ok(chunkCanvas._ops.length > 0, 'Auto-tiler must draw shoreline, cliff, and road transition pixels');

    const vfx = createVfxRenderer();
    const vfxCanvas = makeMockCanvas(320, 200);
    const vctx = vfxCanvas.getContext('2d');
    vfx.drawGroundZones(vctx, {
      groundZones: [
        { type: 'consecration', x: 50, y: 50, radius: 40, age: 1, maxAge: 6, color: '#facc15' },
        { type: 'telegraph', x: 100, y: 80, radius: 55, age: 0.5, maxAge: 1.5, color: '#ef4444', label: 'NOVA' },
      ],
      globalTime: 1.5,
    });
    vfx.drawSkyBeams(vctx, { skyBeams: [{ x: 60, y: 80, color: '#a855f7', age: 0.1, maxAge: 0.45 }], globalTime: 1.5 });
    vfx.drawProjectiles(vctx, { projectiles: [{ id: 'p1', type: 'solar_lance', x: 80, y: 60, vx: 120, vy: 0, color: '#fbbf24' }], globalTime: 1.5 });
    vfx.drawSlashArcs(vctx, { slashArcs: [{ x: 90, y: 70, angle: 0.4, color: '#fde047', age: 0.05, maxAge: 0.22 }] });
    vfx.drawEntityAuraRings(vctx, { sx: 90, sy: 70, state: { zenith: true, voidform: true, frozen: true }, globalTime: 1.5 });
    assert.ok(vfxCanvas._ops.length > 10, 'VFX renderer must emit multi-pass drawing ops');

    const { getCharacterSprites } = await import('../client/sprites/characterSprites.js');
    const vanguard = getCharacterSprites('Solari', 'solari_vanguard', {
      head: 'sunforged_greathelm',
      cape: 'fire_cape',
      neck: 'solari_sun_amulet',
      weapon: 'solari_spellblade',
      body: 'sunforged_plate',
      shield: 'radiant_shield',
      legs: 'sunforged_greaves',
      hands: 'sunforged_gauntlets',
      feet: 'boots_of_haste',
      ring: 'ring_of_precision',
    });
    assert.equal(vanguard.down.length, 3);
    assert.ok(vanguard.poses.slash.down && vanguard.poses.cast.down && vanguard.poses.guard.down && vanguard.poses.dash.down);
  } finally {
    if (globalThis.document) globalThis.document.createElement = prevCreate;
  }
});

test('UI & Remaster Wiring: HD 1.5x zoom, #class-resource-bar, Free Respec, and Deferred Rite Casting', () => {
  const root = path.resolve('.');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const game = fs.readFileSync(path.join(root, 'client/game.js'), 'utf8');
  const fp = fs.readFileSync(path.join(root, 'client/frontpage.js'), 'utf8');
  const hud = fs.readFileSync(path.join(root, 'client/styles/hud.css'), 'utf8');

  assert.ok(html.includes('id="class-resource-bar"'));
  assert.ok(hud.includes('#class-resource-bar'));
  assert.ok(game.includes('ZOOM_PRESETS = [1.5, 2, 3, 4]') && game.includes("'1.5x HD'"));
  assert.ok(game.includes('respecSkills') && game.includes('btn-free-respec'));
  assert.ok(game.includes('currentSpell = { onComplete: runOfflineExecution }'));
  assert.ok(game.includes('drawTileChunkTransitions') && game.includes('createVfxRenderer'));
  assert.ok(fp.includes('setPreviewPose') && fp.includes('passiveName'));
});

test('Account & Roster Protection: Never overwrite Lv.47 Chronomancer EWACH with Lv.1 Solari Vanguard', async () => {
  const { handleApiRequest } = await import('../server/index.js');
  const { FrontpageController } = await import('../client/frontpage.js');

  // 1. AccountsStore.createOrSelectCharacter must reject placeholder or missing characterIds
  const store = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const reg = store.registerAccount({
    username: 'ewachuser',
    password: 'secret123',
    displayName: 'EWACH',
    faction: 'Aether',
    classId: 'chronomancer_sage',
  });
  const acc = reg.account;
  const ewachChar = store.listCharacters(acc.id)[0];
  ewachChar.progression.level = 47;
  acc.progression.level = 47;

  assert.throws(
    () => store.createOrSelectCharacter(acc.id, { characterId: 'local_hero' }),
    /not found/i
  );
  assert.throws(
    () => store.createOrSelectCharacter(acc.id, { characterId: 'sp_char_starter' }),
    /not found/i
  );
  assert.throws(
    () => store.createOrSelectCharacter(acc.id, {}),
    /required/i
  );
  assert.equal(acc.activeCharacterId, ewachChar.id);
  assert.equal(store.listCharacters(acc.id).length, 1);
  assert.equal(store.toPublicProfile(acc).displayName, 'EWACH');
  assert.equal(store.toPublicProfile(acc).progression.level, 47);

  // 2. /api/auth/guest preserves existing session token when dbConnected is false
  const storeOffline = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  storeOffline.dbConnected = false;
  let resStatus = 0;
  let resBody = null;
  await handleApiRequest(
    {
      method: 'POST',
      url: '/api/auth/guest',
      headers: { host: 'localhost:3001' },
      body: { token: 'gfid_stale_ewach_token.sig' },
    },
    {
      writeHead(code) { resStatus = code; },
      end(str) { resBody = JSON.parse(str); },
    },
    { accounts: storeOffline }
  );
  assert.equal(resStatus, 503);
  assert.equal(resBody.dbOffline, true);
  assert.equal(storeOffline.accountsById.size, 0, 'Must not mint a Lv.1 guest account when client has token and DB is offline');

  // 3. FrontpageController prefers cached multiplayer profile over window.localProfile and never calls saveOrSelectCharacter for placeholders
  const prevWin = globalThis.window;
  let saveCalls = 0;
  globalThis.window = {
    ...(prevWin || {}),
    localProfile: { id: 'local_hero', displayName: 'Solari Vanguard', faction: 'Solari', classId: 'solari_vanguard' },
  };
  try {
    const cachedEwach = {
      id: 'acc_ewach',
      displayName: 'EWACH',
      faction: 'Aether',
      classId: 'chronomancer_sage',
      activeCharacterId: 'chr_ewach',
      characters: [
        { id: 'chr_ewach', name: 'EWACH', faction: 'Aether', classId: 'chronomancer_sage', progression: { level: 47 } },
      ],
    };
    const fp = new FrontpageController({
      net: {
        profile: null,
        connected: false,
        token: 'tok_ewach',
        loadCachedProfile: () => cachedEwach,
        saveOrSelectCharacter: async () => { saveCalls += 1; return {}; },
        connectWebSocket: () => {},
        bootstrapAndConnect: async () => null,
      },
      audio: {},
      onEnterWorld: () => {},
    });
    fp.playMode = 'multiplayer';
    const roster = fp.getActiveRoster();
    assert.equal(roster[0].name, 'EWACH');
    assert.equal(roster[0].classId, 'chronomancer_sage');
    assert.equal(roster[0].progression.level, 47);

    // Even if cache is cleared and placeholder is shown, playSelectedCharacter must NEVER send saveOrSelectCharacter
    fp.net.loadCachedProfile = () => null;
    fp.selectedCharacterId = null;
    await fp.playSelectedCharacter();
    assert.equal(saveCalls, 0, 'Placeholder Solari Vanguard must never trigger save_character on Online');
  } finally {
    globalThis.window = prevWin;
  }
});

test('Cloud Shell Preview Realm Switching, Redirect Detection & Clean Glimmer Formatting', async () => {
  const prevWin = globalThis.window;
  const prevLocalStorage = globalThis.localStorage;
  const prevSessionStorage = globalThis.sessionStorage;
  const prevFetch = globalThis.fetch;
  try {
    const ls = new Map();
    const ss = new Map();
    globalThis.localStorage = {
      getItem: (k) => ls.get(k) ?? null,
      setItem: (k, v) => ls.set(k, String(v)),
      removeItem: (k) => ls.delete(k),
    };
    globalThis.sessionStorage = {
      getItem: (k) => ss.get(k) ?? null,
      setItem: (k, v) => ss.set(k, String(v)),
      removeItem: (k) => ss.delete(k),
    };
    globalThis.window = {
      location: {
        protocol: 'https:',
        hostname: '8080-cs-europe-west4-pear.cloudshell.dev',
        host: '8080-cs-europe-west4-pear.cloudshell.dev',
        search: '',
      },
      addEventListener: () => {},
    };

    const { MultiplayerClient } = await import('../client/network.js');
    const net = new MultiplayerClient({ onPacket: () => {}, onStatusChange: () => {} });

    // Default Cloud Shell origin uses same-origin Vite proxy ('')
    assert.equal(net.getServerBase(), '');

    // Switching explicitly in-tab persists via sessionStorage without being wiped by getServerBase()
    net.setServerBase('https://ws.glimmerfall.online');
    assert.equal(net.getServerBase(), 'https://ws.glimmerfall.online');

    // Switching back clears sessionStorage override
    net.setServerBase('');
    assert.equal(net.getServerBase(), '');

    // Cloud Shell proxy opaqueredirect is diagnosed explicitly instead of claiming server is stopped
    globalThis.fetch = async () => ({ type: 'opaqueredirect', ok: false, status: 0 });
    const st = await net.getRealmStatus(500);
    assert.equal(st.isCloudShellAuthRedirect, true);
    assert.equal(st.reachable, false);
    await assert.rejects(() => net.login({ username: 'swagyser', password: 'pw' }), /Cloud Shell Preview auth session expired/);

    // Frontpage formats float-drift solarCharge (28.900000000000005 -> 28.9) cleanly
    const { FrontpageController } = await import('../client/frontpage.js');
    const fp = new FrontpageController({
      net: {
        ...net,
        isLocalOrigin: () => true,
        getServerBase: () => '',
        profile: {
          id: 'acc_test',
          isGuest: true,
          activeCharacterId: 'chr_1',
          characters: [
            {
              id: 'chr_1',
              name: 'Vanguard_621',
              faction: 'Solari',
              classId: 'solari_vanguard',
              hp: 55,
              solarCharge: 28.900000000000005,
              progression: { level: 1 },
            },
          ],
        },
      },
      audio: {},
      onEnterWorld: () => {},
    });
    fp.playMode = 'multiplayer';
    fp.realmStatus = { ok: true, reachable: true, dbConnected: false, totalAccounts: 1, base: '' };
    const html = fp.renderSelectionView();
    assert.ok(html.includes('28.9 Glimmer') && !html.includes('28.900000000000005'), 'Must format float-drifted Glimmer cleanly');
    assert.ok(html.includes('Connect to Live Online DB'), 'Must expose 1-click Live Online DB switch when local DB is offline');
  } finally {
    globalThis.window = prevWin;
    globalThis.localStorage = prevLocalStorage;
    globalThis.sessionStorage = prevSessionStorage;
    globalThis.fetch = prevFetch;
  }
});

test('Left HUD Stack (Avatar, Party, Quest Tracker & Chat) never overlaps on iPad / 720p or legacy saved layouts', async () => {
  const { getUiScale, applySavedUiLayout } = await import('../client/uiLayout.js');
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;
  const prevStorage = globalThis.localStorage;
  try {
    const store = new Map([
      ['glimmerfall_custom_ui_layout', JSON.stringify({
        'party-hud': { left: '12px', top: '132px' },
        'quest-tracker': { left: '12px', top: '236px' },
      })],
    ]);
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
    let hudScale = 1.0;
    const makePanel = (id, { left = 12, top = 12, width = 262, height = 100, bottomAnchor = null, fixedRight = null } = {}) => {
      const el = {
        id,
        style: { left: `${left}px`, top: `${top}px`, maxHeight: '', display: 'block' },
        dataset: {},
        offsetWidth: width,
        offsetHeight: height,
        addEventListener: () => {},
        getBoundingClientRect() {
          const w = el.offsetWidth * hudScale;
          const rawH = el.style.maxHeight && el.id === 'combat-log' ? Math.min(height, parseFloat(el.style.maxHeight)) : el.offsetHeight;
          const h = rawH * hudScale;
          const l = fixedRight !== null ? (mockWin.innerWidth - fixedRight - w) : (parseFloat(el.style.left) || left);
          const t = bottomAnchor !== null ? (mockWin.innerHeight - bottomAnchor - h) : (parseFloat(el.style.top) || top);
          const clampedH = (el.id !== 'combat-log' && Number.isFinite(parseFloat(el.style.maxHeight)))
            ? Math.min(h, parseFloat(el.style.maxHeight) * hudScale)
            : h;
          return { left: l, top: t, right: l + w, bottom: t + clampedH, width: w, height: clampedH };
        },
      };
      return el;
    };

    const combatLogEl = { id: 'combat-log', style: { maxHeight: '' } };
    const menuBtnEl = {
      id: 'micro-btn-menu',
      offsetWidth: 68,
      offsetHeight: 25,
      style: {},
      classList: { contains: () => false },
      getBoundingClientRect: () => {
        const w = 68 * hudScale;
        const h = 25 * hudScale;
        const right = (mockWin.innerWidth / 2) + (250 * hudScale);
        const top = 10;
        return { left: right - w, right, top, bottom: top + h, width: w, height: h };
      },
    };
    const els = new Map([
      ['player-unit-frame', makePanel('player-unit-frame', { left: 12, top: 12, width: 262, height: 136 })],
      ['party-hud', makePanel('party-hud', { left: 12, top: 132, width: 252, height: 112 })],
      ['quest-tracker', makePanel('quest-tracker', { left: 12, top: 156, width: 280, height: 220 })],
      ['social-chat-panel', makePanel('social-chat-panel', { left: 12, width: 292, height: 204, bottomAnchor: 12 })],
      ['top-right-hud', makePanel('top-right-hud', { top: 12, width: 172, height: 240, fixedRight: 12 })],
      ['micro-btn-menu', menuBtnEl],
      ['combat-log', combatLogEl],
    ]);

    const mockWin = { innerWidth: 1024, innerHeight: 680, addEventListener: () => {} };
    globalThis.window = mockWin;
    globalThis.document = {
      readyState: 'complete',
      body: { classList: { contains: () => false } },
      documentElement: { style: { setProperty: () => {} } },
      getElementById: (id) => els.get(id) || null,
      querySelectorAll: () => Array.from(els.values()),
    };

    const autoScale = getUiScale();
    assert.ok(autoScale.scale <= 0.92, `iPad/short 680px viewport auto scale should stay <= 0.92 (got ${autoScale.scale})`);
    hudScale = autoScale.scale;

    // Legacy left-column saved party-hud position should migrate cleanly under the menu button
    localStorage.setItem('glimmerfall_custom_ui_layout', JSON.stringify({
      'party-hud': { left: '12px', top: '132px' },
    }));
    applySavedUiLayout();
    const av = els.get('player-unit-frame').getBoundingClientRect();
    const pt = els.get('party-hud').getBoundingClientRect();
    const qt = els.get('quest-tracker').getBoundingClientRect();
    const ch = els.get('social-chat-panel').getBoundingClientRect();
    const mb = els.get('micro-btn-menu').getBoundingClientRect();
    assert.ok(pt.top >= mb.bottom + 8, `Party HUD (${pt.top}) must sit below Menu button (${mb.bottom})`);
    assert.ok(Math.abs(pt.right - mb.right) <= 2, `Party HUD right (${pt.right}) must align under Menu button (${mb.right})`);
    assert.ok(qt.top >= av.bottom + 8, `Quest Tracker (${qt.top}) must sit below Avatar+ResourceBar (${av.bottom})`);
    const partyOverlapsChat = !(pt.right <= ch.left || pt.left >= ch.right || pt.bottom <= ch.top || pt.top >= ch.bottom);
    assert.ok(!partyOverlapsChat, 'Party HUD must never overlap Chat');
    const questOverlapsChat = !(qt.right <= ch.left || qt.left >= ch.right || qt.bottom <= ch.top || qt.top >= ch.bottom);
    assert.ok(!questOverlapsChat, `Quest Tracker (${qt.left},${qt.top}..${qt.bottom}) must not overlap Chat (${ch.left},${ch.top})`);

    // Custom non-left party-hud placement must stay where the user moved it
    localStorage.setItem('glimmerfall_custom_ui_layout', JSON.stringify({
      'party-hud': { left: '480px', top: '260px' },
    }));
    applySavedUiLayout();
    assert.equal(els.get('party-hud').style.left, '480px');
    assert.equal(els.get('party-hud').style.top, '260px');
  } finally {
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
    globalThis.localStorage = prevStorage;
  }
});

test('Water Collision: Blocks Abyssal Rift void pools, footprints, and dashes across rivers', () => {
  // Abyssal Rift void_sea pools must block movement matching client pickTile
  const abyssPoolX = 12 * 16 + 8; // |12| % 8 === 4 && |12| > 5
  const abyssPoolY = 12 * 16 + 8;
  assert.equal(protocol.isWaterTile(abyssPoolX, abyssPoolY, protocol.ROOM_TYPES.ABYSSAL_RIFT), true);
  assert.equal(protocol.isWaterTile(0, 0, protocol.ROOM_TYPES.ABYSSAL_RIFT), false);

  // clampStepOutOfWater stops BEFORE South River in Nexus Warzone (must not teleport across river!)
  const southShoreY = 75 * 16 - 8;
  const southBankFarY = 82 * 16;
  const clampedRiver = protocol.clampStepOutOfWater(120, southShoreY, 120, southBankFarY, protocol.ROOM_TYPES.NEXUS_WARZONE, 1800, 1800);
  assert.equal(clampedRiver.blockedByWater, true);
  assert.equal(protocol.isWaterTile(120, 77 * 16 + 4, protocol.ROOM_TYPES.NEXUS_WARZONE), true);
  assert.ok(clampedRiver.y < 77 * 16, `Dash must stop on north shore before river, got y=${clampedRiver.y}`);
  assert.equal(protocol.isFootprintInWater(clampedRiver.x, clampedRiver.y, protocol.ROOM_TYPES.NEXUS_WARZONE), false);

  // Coral Coast open sea blocks footprints while pier remains walkable
  assert.equal(protocol.isFootprintInWater(0, -400, protocol.ROOM_TYPES.CORAL_COAST), false, 'North pier must remain walkable');
  assert.equal(protocol.isFootprintInWater(-160, -400, protocol.ROOM_TYPES.CORAL_COAST), true, 'Open northern sea must block');
  const dry = protocol.findNearestDryTile(-160, -400, protocol.ROOM_TYPES.CORAL_COAST, 576, 576);
  assert.equal(protocol.isFootprintInWater(dry.x, dry.y, protocol.ROOM_TYPES.CORAL_COAST, 4, 4), false);
});
