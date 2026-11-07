import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as protocol from '../shared/protocol.js';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';
import { FrontpageController, FRONTPAGE_STATES } from '../client/frontpage.js';
import { SKILL_ICON_SVGS, getSkillIconSvg } from '../client/ui/skillIcons.js';
import { UNLOCK_ICON_SVGS, getUnlockIconSvg } from '../client/ui/unlockIcons.js';
import { setupSkillGuidesUi } from '../client/game/skillGuidesUi.js';

test('tick constants match the authoritative 20 Hz loop', () => {
  assert.equal(protocol.TICK_RATE, 20);
  assert.equal(protocol.TICK_MS, 50);
});

test('character XP curve compounds and stays monotonic through level 30', () => {
  assert.equal(protocol.xpForNextLevel(1), 80);
  let previous = 0;
  for (let level = 1; level <= 30; level += 1) {
    const need = protocol.xpForNextLevel(level);
    assert.ok(Number.isInteger(need), `level ${level} XP requirement should be an integer`);
    assert.ok(need > previous, `level ${level} must cost more XP than level ${level - 1}`);
    previous = need;
  }
  const earlyRatio = protocol.xpForNextLevel(2) / protocol.xpForNextLevel(1);
  assert.ok(earlyRatio > 1.4 && earlyRatio < 1.7, `expected ~52% growth, got ${earlyRatio}`);
});

test('paragon XP curve starts at 2500 and never decreases', () => {
  assert.equal(protocol.paragonXpForLevel(0), 2500);
  for (let level = 1; level <= 100; level += 1) {
    assert.ok(
      protocol.paragonXpForLevel(level) > protocol.paragonXpForLevel(level - 1),
      `paragon ${level} must cost more than paragon ${level - 1}`
    );
  }
});

test('profession levels resolve from the 99-level XP table', () => {
  assert.equal(protocol.getProfessionLevelFromXp(0), 1);
  const level50Xp = protocol.getXpForProfessionLevel(50);
  assert.ok(protocol.getProfessionLevelFromXp(level50Xp) >= 50);
  const level99Xp = protocol.getXpForProfessionLevel(99);
  assert.equal(protocol.getProfessionLevelFromXp(level99Xp), 99);
  assert.equal(protocol.getProfessionLevelFromXp(level99Xp + 1000000), 99);
  assert.equal(protocol.getXpForProfessionLevel(0), protocol.getXpForProfessionLevel(1));
  assert.equal(protocol.getXpForProfessionLevel(500), protocol.getXpForProfessionLevel(99));
});

test('default progression is complete and internally consistent', () => {
  const prog = protocol.createDefaultProgression();
  assert.equal(prog.level, 1);
  assert.equal(prog.xp, 0);
  assert.ok(prog.statPoints >= 0);
  assert.ok(prog.skillPoints >= 0);
  for (const stat of ['power', 'bastion', 'resonance', 'tempo']) {
    assert.ok(Number.isInteger(prog.stats[stat]), `missing base stat ${stat}`);
  }
  for (const affinity of Object.keys(protocol.PARAGON_AFFINITIES)) {
    assert.equal(prog.paragon[affinity], 0, `missing paragon affinity ${affinity}`);
  }
  assert.equal(protocol.getTotalProfessionLevel(prog.professions), 7);
  assert.equal(protocol.calcEntityLevel(prog), 3);
});

test('entity level algorithm behaves with combat matrix level scaling', () => {
  const starter = protocol.createDefaultProgression();
  assert.equal(protocol.calcEntityLevel(starter), 3);
  assert.equal(protocol.getEntityCombatArchetype(starter), 'Martial Vanguard');

  // Maxed Level 99 skills without paragon reaches 126
  const maxed = {
    ...starter,
    level: 30,
    professions: {
      combat_mastery: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
      rites: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
      flashes: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
      resonance_extraction: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
      relic_forging: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
      rite_binding: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
      glimmerweaving: { xp: protocol.getXpForProfessionLevel(99), level: 99 },
    },
  };
  assert.equal(protocol.calcEntityLevel(maxed), 126);
  assert.equal(protocol.getEntityCombatArchetype(maxed), 'Grandmaster Ascendant');

  // Paragon resonance caps out at 138
  const apotheosis = { ...maxed, paragonLevel: 100 };
  assert.equal(protocol.calcEntityLevel(apotheosis), 138);
});

test('max HP and Glimmer are positive integers that scale with level', () => {
  const base = protocol.createDefaultProgression();
  const maxed = { ...base, level: 30 };
  for (const classId of Object.keys(protocol.CLASSES_CATALOG)) {
    const hp1 = protocol.calcMaxHp(base, {}, classId);
    const hp30 = protocol.calcMaxHp(maxed, {}, classId);
    assert.ok(Number.isInteger(hp1) && hp1 > 0, `${classId} level 1 HP`);
    assert.ok(Number.isInteger(hp30) && hp30 > hp1, `${classId} level 30 HP should exceed level 1`);

    const glimmer1 = protocol.calcMaxGlimmer(base, {}, classId);
    const glimmer30 = protocol.calcMaxGlimmer(maxed, {}, classId);
    assert.ok(Number.isInteger(glimmer1) && glimmer1 > 0, `${classId} level 1 Glimmer`);
    assert.ok(Number.isInteger(glimmer30) && glimmer30 > 0, `${classId} level 30 Glimmer`);
  }
});

test('canonical sets are complete, reference real items, and activate at 4 pieces', () => {
  for (const set of Object.values(protocol.CANONICAL_SETS)) {
    assert.equal(set.pieces.length, 4, `${set.id} must have four pieces`);
    for (const pieceId of set.pieces) {
      assert.ok(protocol.EQUIPMENT_CATALOG[pieceId], `${set.id} references missing item ${pieceId}`);
    }
    const equipment = {};
    set.pieces.forEach((pieceId, index) => {
      equipment[`test_slot_${index}`] = pieceId;
    });
    const { active } = protocol.getActiveSetBonuses(equipment);
    assert.ok(active.some((entry) => entry.id === set.id), `${set.id} should activate at 4/4`);
  }
});

test('every profession has a real level-99 mastery cape', () => {
  for (const professionId of Object.keys(protocol.PROFESSIONS_CATALOG)) {
    const capeId = protocol.PROFESSION_MASTERY_CAPES[professionId];
    assert.ok(capeId, `${professionId} needs a mastery cape mapping`);
    const cape = protocol.EQUIPMENT_CATALOG[capeId];
    assert.ok(cape, `${professionId} references missing cape ${capeId}`);
    assert.equal(cape.slot, 'cape', `${capeId} must occupy the cape slot`);
    assert.equal(cape.rarity, 'Skill Mastery');
    for (const stat of ['power', 'bastion', 'resonance', 'tempo']) {
      assert.equal(cape.stats[stat], 5, `${capeId} should grant +5 ${stat}`);
    }
  }
});

test('every profession exposes concrete training instructions for Skills onboarding', () => {
  for (const [professionId, meta] of Object.entries(protocol.PROFESSIONS_CATALOG)) {
    assert.ok(typeof meta.quickStart === 'string' && meta.quickStart.length > 25, `${professionId} needs a concrete quickStart`);
    assert.ok(typeof meta.trainerLocation === 'string' && meta.trainerLocation.length > 10, `${professionId} needs a trainer location`);
    assert.ok(typeof meta.activity === 'string' && meta.activity.length > 10, `${professionId} needs an actionable activity line`);
  }
});

test('partial sets report progress instead of activating', () => {
  const set = protocol.CANONICAL_SETS.sunforged_daystar;
  const { active, progress } = protocol.getActiveSetBonuses({
    head: set.pieces[0],
    body: set.pieces[1],
  });
  assert.equal(active.length, 0);
  assert.ok(progress.some((entry) => entry.set.id === set.id && entry.count === 2));
});

test('all eight classes reference real gear and abilities', () => {
  const classes = Object.values(protocol.CLASSES_CATALOG);
  assert.equal(classes.length, 8);
  for (const cls of classes) {
    assert.ok(protocol.FACTIONS_META[cls.faction], `${cls.id} has unknown faction ${cls.faction}`);
    for (const itemId of Object.values(cls.defaultEquipment)) {
      assert.ok(protocol.EQUIPMENT_CATALOG[itemId], `${cls.id} references missing gear ${itemId}`);
    }
    for (const abilityId of Object.values(cls.defaultLoadout)) {
      assert.ok(protocol.ABILITIES_CATALOG[abilityId], `${cls.id} references missing ability ${abilityId}`);
    }
  }
});

test('equipment catalog entries are well formed', () => {
  const entries = Object.entries(protocol.EQUIPMENT_CATALOG);
  assert.ok(entries.length >= 40);
  for (const [id, item] of entries) {
    assert.equal(item.id, id, `catalog key ${id} must match item.id`);
    assert.ok(item.name, `${id} needs a name`);
    assert.ok(item.slot, `${id} needs a slot`);
    for (const [stat, value] of Object.entries(item.stats || {})) {
      assert.ok(Number.isFinite(value), `${id} has non-numeric ${stat}`);
    }
  }
});

test('ability catalog entries are faction-scoped and ranked', () => {
  const entries = Object.entries(protocol.ABILITIES_CATALOG);
  assert.ok(entries.length >= 35);
  for (const [id, ability] of entries) {
    assert.equal(ability.id, id, `catalog key ${id} must match ability.id`);
    assert.ok(ability.name, `${id} needs a name`);
    // `All` is the intentional faction scope for shared actions such as Harvest.
    assert.ok(
      protocol.FACTIONS_META[ability.faction] || ability.faction === 'All',
      `${id} has unknown faction ${ability.faction}`
    );
    assert.ok(Number.isInteger(ability.reqLevel) && ability.reqLevel >= 1, `${id} needs a level requirement`);
    assert.ok(Number.isInteger(ability.maxRank) && ability.maxRank >= 1, `${id} needs a max rank`);
  }
});

test('action slots are all unlocked at level 1 and sanitizeLoadout preserves custom slot choices', () => {
  for (const slot of protocol.ACTION_SLOTS) {
    assert.equal(protocol.isSlotUnlocked({ level: 1 }, slot), true, `slot ${slot} should be unlocked at level 1`);
  }
  const prog = protocol.createDefaultProgression();
  assert.equal(protocol.getAbilityRank(prog, 'flare_strike'), 1);
  assert.equal(prog.skills.flare_strike, 1);

  // Moving Flare Strike to slot 2 or slot 9 [Q] must not duplicate it back into slot 1
  const movedToTwo = protocol.sanitizeLoadout({ 2: 'flare_strike' }, 'solari_vanguard');
  assert.deepEqual(movedToTwo, { 2: 'flare_strike' });

  const movedToNine = protocol.sanitizeLoadout({ 9: 'flare_strike' }, 'solari_vanguard');
  assert.deepEqual(movedToNine, { 9: 'flare_strike' });

  // Empty loadout seeds slot 1 with the class starter ability
  const seeded = protocol.sanitizeLoadout({}, 'solari_vanguard');
  assert.deepEqual(seeded, { 1: 'flare_strike' });
});

test('paragon bonuses stay inside their designed caps', () => {
  const prog = {
    ...protocol.createDefaultProgression(),
    paragon: {
      solari_radiance: 500,
      umbri_shadowcraft: 500,
      terra_bulwark: 500,
      aether_chronoflux: 500,
    },
  };
  assert.ok(protocol.calcCritChance(prog) <= 0.85);
  assert.ok(protocol.calcDodgeChance(prog) <= 0.40);
  assert.ok(protocol.calcDamageReduction(prog) <= 0.40);
  assert.ok(protocol.calcCdMult(prog) >= 0.35);
  assert.ok(protocol.calcCastSpeedMult(prog) >= 0.4);
});

test('faction and class resolution preserves valid loadouts', () => {
  const resolved = protocol.resolveFactionAndClass({
    faction: 'Umbri',
    classId: 'umbral_assassin',
  });
  assert.equal(resolved.faction, 'Umbri');
  assert.equal(resolved.classId, 'umbral_assassin');

  const fallback = protocol.resolveFactionAndClass({});
  assert.ok(protocol.FACTIONS_META[fallback.faction]);
  assert.ok(protocol.CLASSES_CATALOG[fallback.classId]);
});

test('cosmic crafting stations and recipes reference valid professions and catalog items', () => {
  assert.ok(Object.keys(protocol.CRAFTING_STATIONS).length >= 3);
  assert.ok(Array.isArray(protocol.CRAFTING_RECIPES) && protocol.CRAFTING_RECIPES.length >= 30);
  const seenIds = new Set();
  for (const recipe of protocol.CRAFTING_RECIPES) {
    assert.ok(!seenIds.has(recipe.id), `duplicate recipe id ${recipe.id}`);
    seenIds.add(recipe.id);
    assert.ok(protocol.CRAFTING_STATIONS[recipe.station], `${recipe.id} unknown station ${recipe.station}`);
    assert.ok(protocol.PROFESSIONS_CATALOG[recipe.profession], `${recipe.id} unknown profession ${recipe.profession}`);
    assert.ok(Number.isInteger(recipe.reqLevel) && recipe.reqLevel >= 1 && recipe.reqLevel <= 99, `${recipe.id} invalid reqLevel`);
    assert.ok(Number.isFinite(recipe.xp) && recipe.xp > 0, `${recipe.id} invalid xp`);
    assert.ok(protocol.EQUIPMENT_CATALOG[recipe.outputId], `${recipe.id} missing output item ${recipe.outputId}`);
    assert.ok(Array.isArray(recipe.ingredients) && recipe.ingredients.length >= 1, `${recipe.id} needs ingredients`);
    for (const ing of recipe.ingredients) {
      assert.ok(protocol.EQUIPMENT_CATALOG[ing.id], `${recipe.id} missing ingredient ${ing.id}`);
      assert.ok(Number.isInteger(ing.qty) && ing.qty >= 1, `${recipe.id} invalid qty for ${ing.id}`);
    }
  }
});

test('world skilling nodes and bounty contracts reference valid professions and rewards', () => {
  const nodeEntries = Object.entries(protocol.SKILLING_NODE_TYPES);
  assert.ok(nodeEntries.length >= 8);
  for (const [id, spec] of nodeEntries) {
    assert.equal(spec.id, id);
    assert.ok(protocol.PROFESSIONS_CATALOG[spec.profession], `${id} invalid profession`);
    assert.ok(Array.isArray(spec.yields) && spec.yields.length >= 1, `${id} needs yields`);
    for (const y of spec.yields) {
      assert.ok(protocol.EQUIPMENT_CATALOG[y.id], `${id} references missing yield ${y.id}`);
      assert.ok(y.chance > 0 && y.chance <= 1, `${id} invalid yield chance`);
    }
  }

  assert.ok(Array.isArray(protocol.BOUNTY_CONTRACTS) && protocol.BOUNTY_CONTRACTS.length >= 6);
  for (const b of protocol.BOUNTY_CONTRACTS) {
    assert.ok(b.id && b.title && b.kind);
    assert.ok(b.targetCount >= 1);
    assert.ok(b.rewardGold > 0 && b.rewardXp > 0);
    if (b.rewardProf) {
      assert.ok(protocol.PROFESSIONS_CATALOG[b.rewardProf.id], `${b.id} unknown reward profession`);
    }
    for (const item of b.rewardItems || []) {
      assert.ok(protocol.EQUIPMENT_CATALOG[item.id], `${b.id} missing reward item ${item.id}`);
    }
  }
});

test('Starfall Crater and Abyssal Rift are configured with reciprocal seamless edge transitions', () => {
  const starfall = protocol.ROOM_TYPES.STARFALL_CRATER;
  const abyssal = protocol.ROOM_TYPES.ABYSSAL_RIFT;
  assert.ok(protocol.ROOM_CONFIGS[starfall], 'missing Starfall Crater config');
  assert.ok(protocol.ROOM_CONFIGS[abyssal], 'missing Abyssal Rift config');
  assert.ok(protocol.GRAND_FONT_POSITIONS[starfall], 'missing Starfall Crater Grand Font');
  assert.ok(protocol.GRAND_FONT_POSITIONS[abyssal], 'missing Abyssal Rift Grand Font');

  assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.SOLARI_CITADEL].edgeTransitions.west, starfall);
  assert.equal(protocol.ROOM_CONFIGS[starfall].edgeTransitions.east, protocol.ROOM_TYPES.SOLARI_CITADEL);
  assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.NEXUS_FORGOTTEN_RUINS].edgeTransitions.east, starfall);
  assert.equal(protocol.ROOM_CONFIGS[starfall].edgeTransitions.west, protocol.ROOM_TYPES.NEXUS_FORGOTTEN_RUINS);

  assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.NEXUS_WARZONE].edgeTransitions.east, abyssal);
  assert.equal(protocol.ROOM_CONFIGS[abyssal].edgeTransitions.west, protocol.ROOM_TYPES.NEXUS_WARZONE);
  assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.CELESTIAL_ASCENT].edgeTransitions.north, abyssal);
  assert.equal(protocol.ROOM_CONFIGS[abyssal].edgeTransitions.south, protocol.ROOM_TYPES.CELESTIAL_ASCENT);
});

test('Leyline socket gems grant flat HP, Glimmer, and combat stats in socket slots', () => {
  const prog = protocol.createDefaultProgression();
  const baseHp = protocol.calcMaxHp(prog, {}, 'solari_vanguard');
  const baseGlimmer = protocol.calcMaxGlimmer(prog, {}, 'solari_vanguard');
  const baseStats = protocol.getEffectiveStats(prog, {});

  const socketed = {
    socket_head: 'gem_terra_emerald',
    socket_body: 'gem_aether_diamond',
    socket_weapon: 'gem_solar_ruby',
  };
  const boostedHp = protocol.calcMaxHp(prog, socketed, 'solari_vanguard');
  const boostedGlimmer = protocol.calcMaxGlimmer(prog, socketed, 'solari_vanguard');
  const boostedStats = protocol.getEffectiveStats(prog, socketed);

  assert.ok(boostedHp > baseHp, 'socketed Terra Emerald should raise Max HP');
  assert.ok(boostedGlimmer > baseGlimmer, 'socketed Aether Diamond should raise Max Glimmer');
  assert.ok(boostedStats.power > baseStats.power, 'socketed Solar Ruby should raise Power');
});

test('RoomManager initializes Starfall Crater, Abyssal Rift, skilling veins, and Elite Champions', () => {
  const rm = new RoomManager({
    accountsStore: {},
    partyManager: { getPartyForMember: () => null },
  });
  try {
    assert.equal(rm.rooms.size, 14);
    const starfall = rm.rooms.get('starfall_crater_1');
    const abyssal = rm.rooms.get('abyssal_rift_1');
    const hub = rm.rooms.get('sanctuary_hub_1');
    assert.ok(starfall && abyssal && hub);

    assert.ok(starfall.entities.some((e) => e.id === 'sf_boss' && e.isBoss));
    assert.ok(abyssal.entities.some((e) => e.id === 'aby_boss' && e.isBoss));
    assert.ok(starfall.entities.filter((e) => e.skillingType).length >= 5);
    assert.ok(abyssal.entities.filter((e) => e.skillingType).length >= 5);
    assert.ok(hub.entities.filter((e) => e.skillingType).length >= 4);
    assert.equal(starfall.entities.filter((e) => e.eliteAffix).length, 2);
    assert.equal(abyssal.entities.filter((e) => e.eliteAffix).length, 2);

    rm.tickAllRooms();
  } finally {
    rm.stop();
  }
});

test('FrontpageController renders selection and creation views cleanly in both singleplayer and multiplayer', () => {
  const bodyEl = { innerHTML: '⚔️ INITIALIZING REALM CHAMPION SELECTION...', contains: () => false };
  const overlayEl = { style: { display: 'none' } };
  const prevDoc = globalThis.document;
  globalThis.document = {
    activeElement: null,
    getElementById: (id) => {
      if (id === 'frontpage-body') return bodyEl;
      if (id === 'frontpage-overlay') return overlayEl;
      return null;
    },
  };
  try {
    const fp = new FrontpageController({
      net: { profile: null, connected: false },
      audio: {},
      onEnterWorld: () => {},
    });
    fp.playMode = 'singleplayer';
    fp.open();
    assert.ok(!bodyEl.innerHTML.includes('INITIALIZING REALM CHAMPION SELECTION'));
    assert.ok(bodyEl.innerHTML.includes('CHARACTER SELECTION'));
    const spSig = fp.buildRenderSignature();
    assert.ok(typeof spSig === 'string' && spSig.startsWith('singleplayer::'));

    fp.playMode = 'multiplayer';
    fp.net.profile = {
      username: 'tester',
      isGuest: false,
      activeCharacterId: 'c1',
      characters: [{ id: 'c1', name: 'Lyra', faction: 'Solari', classId: 'solari_vanguard', progression: protocol.createDefaultProgression() }],
    };
    fp.syncFromProfile(fp.net.profile);
    assert.ok(bodyEl.innerHTML.includes('Lyra'));

    fp.transitionTo(FRONTPAGE_STATES.CHARACTER_CREATE);
    assert.ok(bodyEl.innerHTML.includes('FORGE A NEW CHAMPION'));
    fp.close();
  } finally {
    globalThis.document = prevDoc;
  }
});

test('Grand Glimmer Font harvest emits a single 100 Resonance Extraction XP award on server', () => {
  const rm = new RoomManager({
    accountsStore: {
      saveProgression: () => {},
      saveQuestState: () => {},
      addItemToInventory: () => false,
    },
    partyManager: {
      getPartyForMember: () => null,
      syncPlayerVitals: () => {},
    },
  });
  try {
    const room = rm.rooms.get('sanctuary_hub_1');
    const grandFont = room.entities.find((e) => e.isGrand);
    assert.ok(grandFont, 'Sanctuary Hub should have a Grand Glimmer Font');

    const sentPackets = [];
    const mockPlayer = {
      id: 'p_test',
      displayName: 'Tester',
      roomId: room.id,
      x: grandFont.x,
      y: grandFont.y,
      isDead: false,
      solarCharge: 0,
      maxSolarCharge: 100,
      classId: 'solari_vanguard',
      equipment: {},
      prog: protocol.createDefaultProgression(),
      questState: {},
      send: (pkt) => sentPackets.push(pkt),
    };

    rm.handleHarvestNode(room, mockPlayer, grandFont.id);
    const profAwards = sentPackets.filter((p) => p.type === 'progression_sync' && p.professionGained);
    assert.equal(profAwards.length, 1, 'Grand Glimmer Font should emit exactly one professionGained packet');
    assert.equal(profAwards[0].professionGained.id, 'resonance_extraction');
    assert.equal(profAwards[0].professionGained.amount, 100);
  } finally {
    rm.stop();
  }
});

test('SKILLING_LAYOUTS defines spread-out nodes across all continental realms referencing valid specs', () => {
  const layouts = protocol.SKILLING_LAYOUTS;
  assert.ok(layouts, 'SKILLING_LAYOUTS must be exported');
  const expectedRooms = [
    protocol.ROOM_TYPES.SANCTUARY_HUB,
    protocol.ROOM_TYPES.SOLARI_CITADEL,
    protocol.ROOM_TYPES.UMBRI_UNDERCITY,
    protocol.ROOM_TYPES.TERRA_ORCHARD,
    protocol.ROOM_TYPES.AETHER_SPIRE,
    protocol.ROOM_TYPES.STARFALL_CRATER,
    protocol.ROOM_TYPES.ABYSSAL_RIFT,
    protocol.ROOM_TYPES.NEXUS_WARZONE,
  ];

  for (const rType of expectedRooms) {
    const nodes = layouts[rType];
    assert.ok(Array.isArray(nodes) && nodes.length >= 6, `Room ${rType} should have at least 6 spread-out skilling nodes`);
    for (const [skType, x, y] of nodes) {
      assert.ok(protocol.SKILLING_NODE_TYPES[skType], `Unknown skilling node type: ${skType}`);
      assert.ok(typeof x === 'number' && typeof y === 'number', 'Coordinates must be numbers');
    }
  }
});

test('Ancient Runes and Runewords are valid, complete, and activate 3-socket synergies', () => {
  const runes = ['rune_sol', 'rune_umb', 'rune_ter', 'rune_aet', 'rune_zod'];
  for (const rId of runes) {
    const item = protocol.EQUIPMENT_CATALOG[rId];
    assert.ok(item, `Rune ${rId} must exist in EQUIPMENT_CATALOG`);
    assert.equal(item.slot, 'socket_gem');
    assert.ok(item.stats, `Rune ${rId} must define flat socket stats`);
  }

  assert.ok(protocol.RUNEWORD_SYNERGIES, 'RUNEWORD_SYNERGIES must exist');
  assert.ok(Object.keys(protocol.RUNEWORD_SYNERGIES).length >= 6, 'Must define at least 6 canonical Runewords');

  // Test Runeword detection on 3 socket gems: Sovereign Trinity (Sol + Umb + Zod)
  const equipment = {
    socket_1: 'rune_sol',
    socket_2: 'rune_umb',
    socket_3: 'rune_zod',
  };
  const active = protocol.getActiveRuneword(equipment);
  assert.ok(active, 'Should activate Sovereign Trinity runeword for Sol-Umb-Zod');
  assert.equal(active.name, 'Sovereign Trinity');
  assert.ok(active.dmgMult >= 1.10, 'Runeword should provide damage multiplier');
});

test('SKILL_ICON_SVGS defines crisp vector SVG icons for all 7 skills and 3 crests', () => {
  const expectedKeys = [
    'skills_medallion',
    'entity_crest',
    'total_crest',
    'combat_mastery',
    'rites',
    'flashes',
    'resonance_extraction',
    'relic_forging',
    'rite_binding',
    'glimmerweaving',
  ];

  for (const k of expectedKeys) {
    const raw = SKILL_ICON_SVGS[k];
    assert.ok(raw, `Missing SVG icon for ${k}`);
    assert.ok(raw.includes('<svg'), `Icon ${k} must contain <svg`);
    assert.ok(raw.includes('</svg>'), `Icon ${k} must close with </svg>`);
    assert.ok(raw.includes('viewBox="0 0 36 36"'), `Icon ${k} must have standard 36x36 viewBox`);

    const wrapped = getSkillIconSvg(k, 32);
    assert.ok(wrapped.includes('width:32px'), `Wrapped SVG for ${k} should set width 32px`);
    assert.ok(wrapped.includes('height:32px'), `Wrapped SVG for ${k} should set height 32px`);
  }
});

test('RoomManager arena queue and match conclusion preserves player pre-arena return spot', () => {
  const rm = new RoomManager({
    accountsStore: {
      saveProgression: () => {},
      patchStatsMeta: () => {},
      persist: () => {},
    },
    partyManager: {
      getPartyForPlayer: () => null,
      getPartyForMember: () => null,
      syncPlayerVitals: () => {},
    },
  });
  try {
    const mockClient = {
      id: 'test_player_1',
      displayName: 'Aurelia',
      faction: 'Solari',
      classId: 'solari_vanguard',
      roomType: protocol.ROOM_TYPES.SANCTUARY_HUB,
      roomId: protocol.ROOM_TYPES.SANCTUARY_HUB,
      x: 42,
      y: 84,
      hp: 40,
      maxHp: 40,
      prog: protocol.createDefaultProgression(),
      messages: [],
      send(data) {
        this.messages.push(data);
      },
    };
    rm.clients.set(mockClient.id, mockClient);

    // Send queue_arena packet with specific return coordinates
    rm.handlePacket(mockClient, {
      type: 'queue_arena',
      join: true,
      mode: 'bots',
      returnRoom: protocol.ROOM_TYPES.SANCTUARY_HUB,
      returnX: 42,
      returnY: 84,
    });

    assert.ok(mockClient.preArenaSpot, 'Client must have preArenaSpot recorded');
    assert.equal(mockClient.preArenaSpot.roomType, protocol.ROOM_TYPES.SANCTUARY_HUB);
    assert.equal(mockClient.preArenaSpot.x, 42);
    assert.equal(mockClient.preArenaSpot.y, 84);

    // Process matchmaking to launch match
    rm.processMatchmaking();
    assert.equal(mockClient.roomType, protocol.ROOM_TYPES.ARENA_3V3);

    // Find arena room
    const arenaRoom = Array.from(rm.rooms.values()).find((r) => r.type === protocol.ROOM_TYPES.ARENA_3V3);
    assert.ok(arenaRoom, 'Arena room must be created');

    // Kill red nexus to trigger Blue team victory
    const redNexus = arenaRoom.entities.find((e) => e.id === 'red_nexus');
    assert.ok(redNexus, 'Red nexus must exist in arena');
    redNexus.hp = 0;
    rm.handleEntityDeath(arenaRoom, redNexus);

    assert.equal(arenaRoom.matchEnded, true, 'Match must be marked ended');
    const winMsg = mockClient.messages.find((m) => m.type === 'arena_result');
    assert.ok(winMsg, 'Client must receive arena_result message');
    assert.equal(winMsg.won, true, 'Blue team client must win when red nexus falls');
  } finally {
    rm.stop();
  }
});

test('Registered character names are immutable and cannot be renamed', () => {
  const store = new AccountsStore();
  const { account: acc } = store.createGuestAccount('EternalHero', 'Solari', 'solari_vanguard');
  const initialName = store.listCharacters(acc.id)[0].name;
  assert.ok(initialName && initialName.length > 0, 'Character must have an initial registered name');

  // Attempting to rename via updateProfile must be rejected / ignored
  store.updateProfile(acc.id, { displayName: 'ChangedNameViaProfile' });
  assert.equal(store.accountsById.get(acc.id).displayName, initialName, 'Account displayName must not change');
  assert.equal(store.listCharacters(acc.id)[0].name, initialName, 'Character name must remain immutable');

  // Attempting to rename via character selection/update must be ignored
  store.createOrSelectCharacter(acc.id, { characterId: acc.activeCharacterId, name: 'ChangedNameViaSelect' });
  assert.equal(store.listCharacters(acc.id)[0].name, initialName, 'Character name must remain immutable after selection');
});

test('getSkillIconSvg injects explicit sizing and covers all professions and crests', () => {
  const requiredIcons = [
    'combat_mastery',
    'rites',
    'flashes',
    'resonance_extraction',
    'relic_forging',
    'rite_binding',
    'glimmerweaving',
    'skills_medallion',
    'entity_crest',
    'total_crest',
  ];

  for (const id of requiredIcons) {
    const rendered = getSkillIconSvg(id, 32);
    assert.ok(rendered.includes('width="32"'), `${id} SVG must have explicit width="32"`);
    assert.ok(rendered.includes('height="32"'), `${id} SVG must have explicit height="32"`);
    assert.ok(rendered.includes('<svg'), `${id} must contain SVG markup`);
    assert.ok(rendered.includes('gf-skill-svg-wrap'), `${id} must be wrapped in gf-skill-svg-wrap`);
  }
});

test('Skill guide and skill training guide modals open and render without ReferenceErrors', () => {
  const elements = new Map();
  const prevDoc = globalThis.document;
  const prevWin = globalThis.window;

  globalThis.document = {
    activeElement: null,
    getElementById: (id) => {
      if (!elements.has(id)) {
        elements.set(id, {
          id,
          style: { display: 'none' },
          innerHTML: '',
          innerText: '',
          classList: { add: () => {}, remove: () => {}, contains: () => false },
          setAttribute: () => {},
          getAttribute: () => '',
        });
      }
      return elements.get(id);
    },
    querySelectorAll: () => [],
  };
  globalThis.window = globalThis;

  try {
    setupSkillGuidesUi({
      getProg: () => ({ professions: { resonance_extraction: { level: 10, xp: 1200 } } }),
      audio: {},
      toggleModal: (id) => {
        const el = globalThis.document.getElementById(id);
        if (el) el.style.display = 'block';
      },
    });

    // Test openSkillGuide
    globalThis.window.openSkillGuide('resonance_extraction');
    const guideModal = elements.get('skill-guide-modal');
    assert.equal(guideModal.style.display, 'block', 'skill-guide-modal must display as block');
    assert.ok(elements.get('skill-guide-title').innerText.includes('RESONANCE EXTRACTION'), 'guide title must update');
    const unlocksContainer = elements.get('skill-guide-unlocks-container');
    assert.ok(unlocksContainer.innerHTML.includes('skill-unlock-emblem-box'), 'must render emblem box in unlock cards');
    assert.ok(unlocksContainer.innerHTML.includes('skill-unlock-icon-stage'), 'must render icon stage in emblem box');
    assert.ok(unlocksContainer.innerHTML.includes('skill-unlock-level-tag'), 'must render level tag at bottom of emblem box');
    assert.ok(unlocksContainer.innerHTML.includes('LVL 1'), 'must display level text');
    assert.ok(unlocksContainer.innerHTML.includes('width="36"'), 'must render vector icon scaled to 36px');

    // Test openSkillTrainingGuide
    globalThis.window.openSkillTrainingGuide();
    const trainingModal = elements.get('skill-training-modal');
    assert.equal(trainingModal.style.display, 'block', 'skill-training-modal must display as block');
    const trainingBody = elements.get('skill-training-body');
    assert.ok(trainingBody.innerHTML.length > 50, 'skill-training-body must contain rendered cards');
    assert.ok(trainingBody.innerHTML.includes('Resonance Extraction'), 'must render skill cards');
  } finally {
    globalThis.document = prevDoc;
    globalThis.window = prevWin;
  }
});

test('UNLOCK_ICON_SVGS provides high grade vector icons for all 69 skill guide acquirements', () => {
  const all69Keys = [
    // Resonance Extraction (14)
    'font_channeling', 'copper_vein', 'sunbloom_herb', 'leyline_shrine', 'tin_outcrop',
    'umbral_coal', 'void_lily', 'mithril_vein', 'terra_clover', 'adamant_vein',
    'aether_lotus', 'runite_asteroid', 'empyrean_starleaf', 'cape_extractor',
    // Relic Forging (11)
    'bronze_bar', 'star_scimitar', 'bronze_breastplate', 'umbral_bar', 'umbral_platebody',
    'mithril_bar', 'mithril_greatsword', 'adamant_shield', 'runite_bar', 'cosmos_set', 'cape_smith',
    // Rite Binding (9)
    'healing_salve', 'glimmer_draught', 'cut_ruby_sapphire', 'vitality_elixir', 'cut_emerald_diamond',
    'battle_tonic', 'chrono_draught', 'leyline_rune', 'cape_binder',
    // Glimmerweaving (8)
    'fiber_yarn', 'acolyte_robes', 'wanderer_cloak', 'duskveil_silk', 'duskveil_hood',
    'mystic_vestments', 'gossamer_cloak', 'cape_weaver',
    // Combat Mastery (9)
    'training_dummy', 'faction_patrol', 'dungeon_boss', 'nexus_siege', 'elite_champion',
    'world_boss', 'mythic_keystone', 'void_singularity', 'cape_champion',
    // Rites (9)
    'smite_rite', 'channel_focus', 'radiant_cascade', 'resonance_amp', 'terra_quake',
    'channel_cadence', 'solar_nova', 'overchannel_surge', 'cape_hierophant',
    // Flashes (9)
    'flare_strike', 'fleetfoot', 'phantom_blink', 'counter_deflect', 'tempest_flurry',
    'chrono_snap', 'horizon_blitz', 'hyper_reflex', 'cape_tempest',
  ];

  assert.equal(all69Keys.length, 69, 'Must have exactly 69 acquirement keys');

  for (const k of all69Keys) {
    assert.ok(k in UNLOCK_ICON_SVGS, `UNLOCK_ICON_SVGS must contain key ${k}`);
    const svgStr = getUnlockIconSvg(k, 24);
    assert.ok(svgStr.includes('<svg'), `${k} must return an SVG string`);
    assert.ok(svgStr.includes('width="24"'), `${k} must have explicit width="24"`);
    assert.ok(svgStr.includes('height="24"'), `${k} must have explicit height="24"`);
    assert.ok(svgStr.includes('gf-unlock-svg-wrap'), `${k} must have wrapper gf-unlock-svg-wrap`);
  }
});

test('Action bar abilities do not render R1-R5 rank pips and item slots show 1 and increasing quantities', () => {
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf-8');
  const hudCss = fs.readFileSync(new URL('../client/styles/hud.css', import.meta.url), 'utf-8');

  // Verify renderActionSlotButton does not render slot-rank-pip or R${rank}
  assert.ok(!gameSrc.includes('<span class="slot-rank-pip">R${rank}</span>'), 'Ability action slots must not render R1-R5 slot-rank-pip');
  assert.ok(!gameSrc.includes('slot-rank-pip'), 'game.js should not reference slot-rank-pip');

  // Verify renderActionItemSlot renders quantity for 1 and higher (qty >= 1)
  assert.ok(gameSrc.includes('${item && qty >= 1 ? `<span class="action-qty">${qty}</span>` : \'\'}'), 'Item action slots must display stack count for 1 and increasing quantities');
  assert.ok(gameSrc.includes('${item.name}${qty >= 1 ? ` ×${qty}` : \'\'}'), 'Item slot title must display stack count for 1 and increasing quantities');

  // Verify CSS hides slot-rank-pip and styles action-qty
  assert.ok(hudCss.includes('.slot-rank-pip {'), 'hud.css should define .slot-rank-pip');
  assert.ok(hudCss.includes('display: none !important;'), 'hud.css should hide .slot-rank-pip');
  assert.ok(hudCss.includes('.action-qty {'), 'hud.css should style .action-qty');
});

test('Health, Glimmer, and lastPosition persistence across login and character saves', () => {
  const store = new AccountsStore();
  const { account: acc } = store.createGuestAccount('PersistedHero', 'Solari', 'solari_vanguard');
  store.ensureDefaultCharacter(acc);

  // Save character vitals and position
  store.saveCharacterState(acc.id, acc.activeCharacterId, {
    hp: 27,
    solarCharge: 45,
    isDead: false,
    lastPosition: { roomType: protocol.ROOM_TYPES.SOLARI_CITADEL, x: 120, y: -40 },
  });

  const updatedAcc = store.accountsById.get(acc.id);
  const activeChar = store.charactersByAccount.get(acc.id).get(acc.activeCharacterId);
  assert.equal(activeChar.hp, 27, 'Character hp must be persisted to 27');
  assert.equal(activeChar.solarCharge, 45, 'Character solarCharge must be persisted to 45');
  assert.deepEqual(activeChar.lastPosition, { roomType: protocol.ROOM_TYPES.SOLARI_CITADEL, x: 120, y: -40 });
  assert.equal(updatedAcc.hp, 27, 'Account hp must sync with active character');
  assert.equal(updatedAcc.solarCharge, 45, 'Account solarCharge must sync with active character');

  // Verify frontpage character creation does not contain starting location selector
  const frontpageSrc = fs.readFileSync(new URL('../client/frontpage.js', import.meta.url), 'utf-8');
  assert.ok(!frontpageSrc.includes('STARTING BIOME'), 'Character loadout creation must not allow changing starting location');
});

test('Monster respawn wipes aggro state and enforces spawnAggroGrace', () => {
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf-8');
  const serverDeathSrc = fs.readFileSync(new URL('../server/rooms/entityDeathAndProgression.js', import.meta.url), 'utf-8');

  // Client-side offline mob death / respawn wipes aggro
  assert.ok(gameSrc.includes('spawnAggroGrace: 2.0'), 'Client respawnTemplate must specify spawnAggroGrace: 2.0');
  assert.ok(gameSrc.includes('if (e.spawnAggroGrace > 0)'), 'Client mob update loop must respect spawnAggroGrace');

  // Server-side entity death / respawn wipes aggro
  assert.ok(serverDeathSrc.includes('spawnAggroGrace: 2.0'), 'Server respawn must enforce spawnAggroGrace: 2.0');
  assert.ok(serverDeathSrc.includes('inCombat: false'), 'Server mob death must set inCombat: false');
  assert.ok(serverDeathSrc.includes('targetPlayerId: null'), 'Server mob death must clear targetPlayerId');
});



