import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as protocol from '../shared/protocol.js';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';
import { FrontpageController, FRONTPAGE_STATES } from '../client/frontpage.js';
import { LandingPageController } from '../client/landing.js';
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

  const timberlands = protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS;
  const coral = protocol.ROOM_TYPES.CORAL_COAST;
  assert.ok(protocol.ROOM_CONFIGS[timberlands], 'missing Ironwood Timberlands config');
  assert.ok(protocol.ROOM_CONFIGS[coral], 'missing Coral Coast config');
  assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.TERRA_ORCHARD].edgeTransitions.south, timberlands);
  assert.equal(protocol.ROOM_CONFIGS[timberlands].edgeTransitions.north, protocol.ROOM_TYPES.TERRA_ORCHARD);
  assert.equal(protocol.ROOM_CONFIGS[timberlands].edgeTransitions.east, coral);
  assert.equal(protocol.ROOM_CONFIGS[coral].edgeTransitions.west, timberlands);
  assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.UMBRI_UNDERCITY].edgeTransitions.east, coral);
  assert.equal(protocol.ROOM_CONFIGS[coral].edgeTransitions.north, protocol.ROOM_TYPES.UMBRI_UNDERCITY);
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
    assert.equal(rm.rooms.size, 18);
    const starfall = rm.rooms.get('starfall_crater_1');
    const abyssal = rm.rooms.get('abyssal_rift_1');
    const hub = rm.rooms.get('sanctuary_hub_1');
    const timberlands = rm.rooms.get('ironwood_timberlands_1');
    const coral = rm.rooms.get('coral_coast_1');
    assert.ok(starfall && abyssal && hub && timberlands && coral);

    assert.ok(starfall.entities.some((e) => e.id === 'sf_boss' && e.isBoss));
    assert.ok(abyssal.entities.some((e) => e.id === 'aby_boss' && e.isBoss));
    assert.ok(timberlands.entities.some((e) => e.id === 'iw_boss' && e.isBoss));
    assert.ok(coral.entities.some((e) => e.id === 'cc_boss' && e.isBoss));
    assert.ok(starfall.entities.filter((e) => e.skillingType).length >= 5);
    assert.ok(abyssal.entities.filter((e) => e.skillingType).length >= 5);
    assert.ok(timberlands.entities.filter((e) => e.skillingType).length >= 5);
    assert.ok(coral.entities.filter((e) => e.skillingType).length >= 5);
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
    protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS,
    protocol.ROOM_TYPES.CORAL_COAST,
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

test('LandingPageController initializes, toggles Start on this site, and renders Encyclopedias with TCG material', () => {
  const memoryStore = {};
  global.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
    setItem: (k, v) => { memoryStore[k] = String(v); },
    removeItem: (k) => { delete memoryStore[k]; },
  };

  const landing = new LandingPageController({ frontpage: null, onEnterWorld: null });
  assert.equal(landing.activeTab, 'overview');
  assert.equal(landing.getStartOnLoadout(), false, 'Default start on loadout should be false');

  // Toggle Start on this site
  landing.setStartOnLoadout(true);
  assert.equal(landing.getStartOnLoadout(), true);
  assert.equal(global.localStorage.getItem('glimmerfall_start_on_loadout'), 'true');
  landing.setStartOnLoadout(false);
  assert.equal(landing.getStartOnLoadout(), false);

  // Test Game Systems Encyclopedia content
  landing.setGameEncSection('combat');
  const combatHtml = landing.renderGameEncSection();
  assert.ok(combatHtml.includes('Attack Cleave Arcs &amp; Hitboxes'));
  assert.ok(combatHtml.includes('1.5s Global Cooldown'));

  landing.setGameEncSection('economy');
  const economyHtml = landing.renderGameEncSection();
  assert.ok(economyHtml.includes('AetherSwap Continental Orderbook'));
  assert.ok(economyHtml.includes('2% Macroeconomic Tariff Sink'));

  landing.setGameEncSection('disciplines');
  const disciplinesHtml = landing.renderGameEncSection();
  assert.ok(disciplinesHtml.includes('Resonance Extraction'));
  assert.ok(disciplinesHtml.includes('Star-Forging'));

  landing.setGameEncSection('persistence');
  const persistHtml = landing.renderGameEncSection();
  assert.ok(persistHtml.includes('Exact Health &amp; Glimmer Persistence'));
  assert.ok(persistHtml.includes('Exact World Coordinate Resuming'));
  assert.ok(persistHtml.includes('Clean Monster Respawn &amp; Aggro Wipe'));

  // Test Cosmic Lore & TCG Encyclopedia content from glimmerfalltcg.com
  landing.setLoreEncSection('creeds');
  const creedsHtml = landing.renderLoreEncSection();
  assert.ok(creedsHtml.includes('The Sunspire Dominion'));
  assert.ok(creedsHtml.includes('The Astral Conclave'));
  assert.ok(creedsHtml.includes('The Rootdeep Collective'));
  assert.ok(creedsHtml.includes('The Duskveil Syndicate'));

  landing.setLoreEncSection('cards');
  const cardsHtml = landing.renderLoreEncSection();
  assert.ok(cardsHtml.includes('glimmerfalltcg.com'));
  assert.ok(cardsHtml.includes('Solari Vanguard'));
  assert.ok(cardsHtml.includes('Dawnblade Templar'));
  assert.ok(cardsHtml.includes('Mana Crystal'));
  assert.ok(cardsHtml.includes('Chronocore Prism'));

  // Accessibility & scrolling helper methods check
  assert.equal(typeof landing.scrollUp, 'function');
  assert.equal(typeof landing.scrollDown, 'function');
  assert.equal(typeof landing.scrollToTop, 'function');
  assert.equal(typeof landing.scrollToBottom, 'function');
  assert.equal(typeof landing.scrollToSection, 'function');

  // Verify index.html and frontpage.js integration
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
  assert.ok(indexHtml.includes('Start on this site'), 'index.html must include Start on this site label');
  assert.ok(indexHtml.includes('id="frontpage-body"'), 'index.html must include frontpage-body mounting container');
  assert.ok(indexHtml.includes('id="frontpage-overlay" style="display:none;"'), 'index.html must keep frontpage overlay hidden on initial load if not toggled');
  assert.ok(indexHtml.includes('id="prologue-modal-overlay"'), 'index.html must include prologue-modal-overlay');
  assert.ok(indexHtml.includes('SKIP TO HERO SELECTION'), 'index.html must include skip to hero selection button');

  const fpSrc = fs.readFileSync(new URL('../client/frontpage.js', import.meta.url), 'utf-8');
  assert.ok(fpSrc.includes('getStartOnSite()'), 'frontpage.js must implement getStartOnSite');
  assert.ok(fpSrc.includes('setStartOnSite('), 'frontpage.js must implement setStartOnSite');
  assert.ok(fpSrc.includes('LANDING &amp; ENCYCLOPEDIAS'), 'frontpage.js must include LANDING & ENCYCLOPEDIAS button');
  assert.ok(fpSrc.includes('REPLAY CRYSTAL HEART PROLOGUE (1080P)'), 'frontpage.js must include replay prologue button');
  assert.ok(fpSrc.includes('playPrologueCinematic'), 'frontpage.js must implement playPrologueCinematic');

  const landingCss = fs.readFileSync(new URL('../client/styles/landing.css', import.meta.url), 'utf-8');
  assert.ok(landingCss.includes('linear-gradient(180deg, #facc15 0%, #ca8a04 100%)'), 'landing.css must include accessible scrollbar thumb');
  assert.ok(landingCss.includes('touch-action: pan-y !important;'), 'landing.css must enable native touch-action: pan-y for finger scrolling');
  assert.ok(!landingCss.includes('.landing-scroll-dock'), 'landing.css must not contain the deleted scroll modal/dock');
});

test('Glimmer harvesting preserves active solarCharge and does not revert to cached profile value', () => {
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf-8');
  const roomManagerSrc = fs.readFileSync(new URL('../server/roomManager.js', import.meta.url), 'utf-8');

  // Client vitals recalculation must guard live gameplay from being overwritten
  assert.ok(gameSrc.includes('recalcVitalsFromProfile(initialProf = null, isInitialSpawn = false)'), 'recalcVitalsFromProfile must distinguish isInitialSpawn');
  assert.ok(gameSrc.includes('if (isInitialSpawn && initialProf) {'), 'Only initial spawn sets vitals from initial profile');
  assert.ok(gameSrc.includes('player.solarCharge = Math.min(player.maxSolarCharge, Math.max(0, player.solarCharge || 0));'), 'Live solarCharge must not be overwritten by profile_updated');

  // Server client refresh must preserve live solarCharge
  assert.ok(roomManagerSrc.includes('client.solarCharge = Math.min(client.maxSolarCharge, client.solarCharge);'), 'Server refreshClientFromAccount must preserve live client.solarCharge');
});

test('Tier 3 Economy: AetherSwap Continental Exchange order placement, matching engine, and 2% tariff sink', async () => {
  const { ExchangeManager, EXCHANGE_TARIFF_RATE } = await import('../server/exchangeManager.js');

  assert.strictEqual(EXCHANGE_TARIFF_RATE, 0.02, 'Tariff rate must be exactly 2%');

  const testAccounts = {
    profiles: new Map(),
    getProfile(id) {
      if (!this.profiles.has(id)) {
        this.profiles.set(id, {
          id,
          name: `Player_${id}`,
          inventory: [{ id: 'solar_gold', qty: 1000 }, { id: 'major_vitality_elixir', qty: 10 }],
          gold: 0,
        });
      }
      return this.profiles.get(id);
    },
    updateProfile(id, updates) {
      const p = this.getProfile(id);
      Object.assign(p, updates);
      return p;
    },
  };

  const clientMessages = new Map();
  const mockClients = new Map();

  function createMockClient(id, name) {
    clientMessages.set(id, []);
    const c = {
      id,
      displayName: name,
      send(msg) {
        clientMessages.get(id).push(msg);
      },
    };
    mockClients.set(id, c);
    return c;
  }

  const exchange = new ExchangeManager({
    accountsStore: testAccounts,
    getClientById: (id) => mockClients.get(id),
    broadcastToAll: () => {},
    dataDir: `/tmp/glimmer_test_ge_${Date.now()}`,
  });

  const seller = createMockClient('p_seller', 'SellerSam');
  const buyer = createMockClient('p_buyer', 'BuyerBob');

  // 1. SellerSam places SELL offer for 5x major_vitality_elixir @ 20 🪙 each
  exchange.handlePlaceOrder(seller, {
    mode: 'SELL',
    slot: 1,
    itemId: 'major_vitality_elixir',
    qty: 5,
    unitPrice: 20,
  });

  const sellerOffers = exchange.getPlayerSlotOrders(seller.id);
  assert.strictEqual(sellerOffers[0].type, 'SELL', 'Slot 1 should be a SELL order');
  assert.strictEqual(sellerOffers[0].qty, 5, 'Sell qty should be 5');
  assert.strictEqual(sellerOffers[0].unitPrice, 20, 'Sell unitPrice should be 20');

  // Verify seller items were deducted from inventory into escrow
  const sellerProf = testAccounts.getProfile(seller.id);
  const remainingElixirs = exchange.countItemInBackpack(sellerProf, 'major_vitality_elixir');
  assert.strictEqual(remainingElixirs, 5, 'Seller should have 5 elixirs left in backpack after depositing 5');

  // 2. BuyerBob places BUY offer for 5x major_vitality_elixir @ 20 🪙 each
  exchange.handlePlaceOrder(buyer, {
    mode: 'BUY',
    slot: 1,
    itemId: 'major_vitality_elixir',
    qty: 5,
    unitPrice: 20,
  });

  // 3. Orders should match immediately!
  const buyerOffersAfter = exchange.getPlayerSlotOrders(buyer.id);
  const sellerOffersAfter = exchange.getPlayerSlotOrders(seller.id);

  assert.strictEqual(buyerOffersAfter[0].completed, true, 'Buyer order should be completed');
  assert.strictEqual(buyerOffersAfter[0].payoutItems, 5, 'Buyer should have 5 items in payout');

  assert.strictEqual(sellerOffersAfter[0].completed, true, 'Seller order should be completed');
  // 5 * 20 = 100 gross. 2% tariff of 100 = 2. Net = 98 gold.
  assert.strictEqual(sellerOffersAfter[0].payoutGold, 98, 'Seller should receive 98 gold after 2% trade tariff sink');

  // 4. BuyerBob collects items
  exchange.handleCollect(buyer, 1);
  const buyerProfAfterCollect = testAccounts.getProfile(buyer.id);
  const buyerElixirs = exchange.countItemInBackpack(buyerProfAfterCollect, 'major_vitality_elixir');
  assert.strictEqual(buyerElixirs, 15, 'Buyer should have 10 initial + 5 collected = 15 elixirs in backpack');

  // 5. SellerSam collects gold
  exchange.handleCollect(seller, 1);
  const sellerProfAfterCollect = testAccounts.getProfile(seller.id);
  const sellerGold = exchange.getPlayerGold(sellerProfAfterCollect);
  assert.strictEqual(sellerGold, 1098, 'Seller should have 1000 initial + 98 trade proceeds = 1098 gold');

  // 6. Test Aborting an unfilled order and refunding escrow
  const buyerGoldBeforeOrder = exchange.getPlayerGold(testAccounts.getProfile(buyer.id));
  exchange.handlePlaceOrder(buyer, {
    mode: 'BUY',
    slot: 2,
    itemId: 'duskveil_twin_daggers',
    qty: 1,
    unitPrice: 50,
  });
  const buyerGoldDuringEscrow = exchange.getPlayerGold(testAccounts.getProfile(buyer.id));
  assert.strictEqual(buyerGoldDuringEscrow, buyerGoldBeforeOrder - 50, 'Escrow gold must be held during active offer');

  exchange.handleAbort(buyer, 2);
  const buyerGoldAfterAbort = exchange.getPlayerGold(testAccounts.getProfile(buyer.id));
  assert.strictEqual(buyerGoldAfterAbort, buyerGoldBeforeOrder, 'Aborting buy order should refund escrow gold');
});

test('Tier 3 Social: Direct Player-to-Player Trading with anti-scam dual acceptance and atomic swap', async () => {
  const { TradeManager } = await import('../server/tradeManager.js');

  const testAccounts = {
    profiles: new Map(),
    getProfile(id) {
      if (!this.profiles.has(id)) {
        this.profiles.set(id, {
          id,
          name: `Player_${id}`,
          inventory: id === 'p1' ? [{ id: 'iron_ore', qty: 10 }, { id: 'solar_gold', qty: 500 }] : [{ id: 'bronze_bar', qty: 5 }, { id: 'solar_gold', qty: 200 }],
          gold: 0,
        });
      }
      return this.profiles.get(id);
    },
    updateProfile(id, updates) {
      const p = this.getProfile(id);
      Object.assign(p, updates);
      return p;
    },
  };

  const mockClients = new Map();
  function createMockClient(id, name, x, y) {
    const c = {
      id,
      displayName: name,
      roomId: 'sanctuary_hub',
      x,
      y,
      isDead: false,
      msgs: [],
      send(m) {
        this.msgs.push(m);
      },
    };
    mockClients.set(id, c);
    return c;
  }

  const tm = new TradeManager({
    accountsStore: testAccounts,
    getClientById: (id) => mockClients.get(id),
    findClientByName: (n) => Array.from(mockClients.values()).find((c) => c.displayName.toLowerCase() === n.toLowerCase()),
  });

  const p1 = createMockClient('p1', 'Alice', 0, 0);
  const p2 = createMockClient('p2', 'Bob', 20, 20);

  // 1. Send trade request and accept invitation
  tm.handleRequest(p1, 'Bob');
  const inviteMsg = p2.msgs.find((m) => m.type === 'trade_incoming');
  assert.ok(inviteMsg, 'Target should receive trade_incoming invite');

  tm.handleRespond(p2, inviteMsg.inviteId, true);
  assert.ok(tm.isPlayerTrading(p1.id), 'Player 1 should be in active trade');
  assert.ok(tm.isPlayerTrading(p2.id), 'Player 2 should be in active trade');

  // 2. Offer items and gold
  tm.handleOfferUpdate(p1, [{ id: 'iron_ore', qty: 4 }], 100);
  tm.handleOfferUpdate(p2, [{ id: 'bronze_bar', qty: 2 }], 50);

  const session = tm.getTradeForPlayer(p1.id);
  assert.strictEqual(session.p1.items[0].qty, 4, 'P1 offered 4 iron ore');
  assert.strictEqual(session.p1.gold, 100, 'P1 offered 100 gold');
  assert.strictEqual(session.p2.items[0].qty, 2, 'P2 offered 2 bronze bars');

  // 3. P1 accepts trade
  tm.handleAccept(p1);
  assert.strictEqual(session.p1.accepted, true, 'P1 accepted trade');
  assert.strictEqual(session.p2.accepted, false, 'P2 has not accepted yet');

  // 4. ANTI-SCAM TEST: P2 modifies offer -> MUST reset P1 accepted state!
  tm.handleOfferUpdate(p2, [{ id: 'bronze_bar', qty: 1 }], 50);
  assert.strictEqual(session.p1.accepted, false, 'Offer modification MUST reset other player acceptance to false');
  assert.strictEqual(session.p2.accepted, false, 'Offer modification MUST reset own acceptance to false');

  // 5. Both players accept final offer
  tm.handleAccept(p1);
  tm.handleAccept(p2);

  // 6. Atomic swap executed
  assert.strictEqual(tm.isPlayerTrading(p1.id), false, 'Trade should conclude cleanly after atomic swap');

  const prof1 = testAccounts.getProfile('p1');
  const prof2 = testAccounts.getProfile('p2');

  const p1Bronze = tm.countItemInBackpack(prof1, 'bronze_bar');
  const p1Iron = tm.countItemInBackpack(prof1, 'iron_ore');
  const p1Gold = tm.getPlayerGold(prof1);

  const p2Bronze = tm.countItemInBackpack(prof2, 'bronze_bar');
  const p2Iron = tm.countItemInBackpack(prof2, 'iron_ore');
  const p2Gold = tm.getPlayerGold(prof2);

  assert.strictEqual(p1Bronze, 1, 'P1 should receive 1 bronze bar');
  assert.strictEqual(p1Iron, 6, 'P1 should have 6 iron ore left (10 - 4)');
  assert.strictEqual(p1Gold, 450, 'P1 gold should be 500 - 100 + 50 = 450');

  assert.strictEqual(p2Bronze, 4, 'P2 should have 4 bronze bars left (5 - 1)');
  assert.strictEqual(p2Iron, 4, 'P2 should receive 4 iron ore');
  assert.strictEqual(p2Gold, 250, 'P2 gold should be 200 - 50 + 100 = 250');
});

test('Tier 3 Social: Friendly Player Dueling with 3-second countdown and 1-HP surrender protection', async () => {
  const { DuelManager, DUEL_COUNTDOWN_SEC, DUEL_RING_RADIUS_PX } = await import('../server/duelManager.js');

  const mockClients = new Map();
  function createMockClient(id, name, x, y) {
    const c = {
      id,
      displayName: name,
      roomId: 'sanctuary_hub',
      roomType: 'sanctuary_hub',
      x,
      y,
      hp: 100,
      maxHp: 100,
      isDead: false,
      msgs: [],
      send(m) {
        this.msgs.push(m);
      },
    };
    mockClients.set(id, c);
    return c;
  }

  const mockRoom = {
    id: 'sanctuary_hub',
    fxQueue: [],
  };

  const dm = new DuelManager({
    getClientById: (id) => mockClients.get(id),
    findClientByName: (n) => Array.from(mockClients.values()).find((c) => c.displayName.toLowerCase() === n.toLowerCase()),
    getRoomById: () => mockRoom,
    broadcastToRoom: () => {},
  });

  const c1 = createMockClient('c1', 'GladiatorA', 100, 100);
  const c2 = createMockClient('c2', 'GladiatorB', 120, 100);

  // 1. Issue duel challenge
  dm.handleRequest(c1, 'GladiatorB');
  const invite = c2.msgs.find((m) => m.type === 'duel_incoming');
  assert.ok(invite, 'Target should receive duel_incoming');

  // 2. Accept challenge
  dm.handleRespond(c2, invite.inviteId, true);
  const session = dm.getDuelForPlayer(c1.id);
  assert.ok(session, 'Active duel session should be created');
  assert.strictEqual(session.state, 'countdown', 'Duel state starts in countdown');
  assert.strictEqual(session.radius, DUEL_RING_RADIUS_PX, 'Duel radius must match DUEL_RING_RADIUS_PX');

  // 3. Countdown tick (3.0 seconds)
  dm.tick(1.0);
  assert.strictEqual(session.state, 'countdown', 'Still in countdown after 1s');
  dm.tick(2.1);
  assert.strictEqual(session.state, 'active', 'Duel should be active after 3.1s');
  assert.strictEqual(dm.isDuelActiveBetween(c1.id, c2.id), true, 'Duel is active between c1 and c2');

  // 4. Non-Lethal Surrender Protection:
  // When loser is about to take fatal damage, concludeDuel is invoked
  c2.hp = 1;
  dm.concludeDuel(c2.id, c1.id, 'defeat');

  // Verify defeated duelist DOES NOT DIE and has HP safely restored to 35% Max HP
  assert.strictEqual(c2.isDead, false, 'Defeated duelist must NOT die');
  assert.strictEqual(c2.hp, 35, 'Defeated duelist must have HP restored to 35%');
  assert.strictEqual(dm.hasActiveDuel(c1.id), false, 'Duel session cleaned up');
  assert.strictEqual(dm.hasActiveDuel(c2.id), false, 'Duel session cleaned up');

  const concludedMsg = c1.msgs.find((m) => m.type === 'duel_concluded');
  assert.ok(concludedMsg, 'Winner receives duel_concluded packet');
  assert.strictEqual(concludedMsg.winnerName, 'GladiatorA', 'Winner is GladiatorA');
  assert.strictEqual(concludedMsg.loserName, 'GladiatorB', 'Loser is GladiatorB');
});

test('Tier 3 Social: Player Inspect protocol and UI integration', () => {
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf-8');
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
  const arenaPacketsSrc = fs.readFileSync(new URL('../server/rooms/arenaAndPackets.js', import.meta.url), 'utf-8');

  // 1. Target Frame Player Actions
  assert.ok(indexHtml.includes('id="target-player-actions"'), 'index.html must have target player actions');
  assert.ok(indexHtml.includes('inspectTargetedPlayer()'), 'Must have Inspect button');
  assert.ok(indexHtml.includes('tradeTargetedPlayer()'), 'Must have Trade button');
  assert.ok(indexHtml.includes('duelTargetedPlayer()'), 'Must have Duel button');

  // 2. Modals Present in index.html
  assert.ok(indexHtml.includes('id="trade-modal"'), 'index.html must have #trade-modal');
  assert.ok(indexHtml.includes('id="inspect-modal"'), 'index.html must have #inspect-modal');
  assert.ok(indexHtml.includes('id="trade-invite-toast"'), 'index.html must have #trade-invite-toast');
  assert.ok(indexHtml.includes('id="duel-invite-toast"'), 'index.html must have #duel-invite-toast');
  assert.ok(indexHtml.includes('id="duel-countdown-banner"'), 'index.html must have #duel-countdown-banner');

  // 3. Server Inspect Packet Generation
  assert.ok(arenaPacketsSrc.includes("case 'inspect_player':"), 'Server packet router must handle inspect_player');
  assert.ok(arenaPacketsSrc.includes('handleInspectPlayer(client, targetQuery)'), 'Server must implement handleInspectPlayer');
  assert.ok(arenaPacketsSrc.includes("type: 'inspect_data'"), 'Server must emit inspect_data packet');

  // 4. Client Game Network Dispatch & World Dueling Ring
  assert.ok(gameSrc.includes("case 'inspect_data':"), 'Client must handle inspect_data packet');
  assert.ok(gameSrc.includes('renderInspectModal({ targetData: msg.target })'), 'Client must render inspect modal');
  assert.ok(gameSrc.includes('⚔️ HONORABLE DUEL RING ⚔️'), 'Client must render duel boundary ring in world canvas');
});

test('Single-instance enforcement: Name reservation and anti-spoofing in guest and registered accounts', async () => {
  const { AccountsStore, isReservedName } = await import('../server/accountsStore.js');
  const store = new AccountsStore();

  assert.ok(isReservedName('system'), 'system must be reserved');
  assert.ok(isReservedName('SYSTEM'), 'SYSTEM must be reserved case-insensitively');
  assert.ok(isReservedName('moderator'), 'moderator must be reserved');
  assert.ok(isReservedName('gm'), 'gm must be reserved');
  assert.ok(!isReservedName('admin'), 'admin is allowed as an account and character name');

  // 1. Guest account creation allows admin
  const guestAdmin = store.createGuestAccount({ preferredName: 'admin' });
  assert.strictEqual(guestAdmin.account.displayName, 'admin', 'Guest can take admin');

  // 2. Normal guest name works
  const guestLegit = store.createGuestAccount({ preferredName: 'SolariHero' });
  assert.strictEqual(guestLegit.account.displayName, 'SolariHero', 'Valid guest name is accepted');

  // 3. Registering reserved name must throw
  assert.throws(
    () => store.registerAccount({ username: 'system', password: 'secretpassword123' }),
    /reserved/i,
    'Registering system must throw reserved error'
  );
  assert.throws(
    () => store.registerAccount({ username: 'server', password: 'secretpassword123' }),
    /reserved/i,
    'Registering server must throw reserved error'
  );

  // 4. Register legitimate user
  const reg = store.registerAccount({ username: 'PlayerOne', password: 'secretpassword123' });
  assert.strictEqual(reg.account.username, 'PlayerOne');

  // 5. Another guest trying to impersonate PlayerOne must be rejected
  const guestImpersonator = store.createGuestAccount({ preferredName: 'PlayerOne' });
  assert.notStrictEqual(guestImpersonator.account.displayName, 'PlayerOne', 'Guest cannot impersonate registered username');
  assert.ok(guestImpersonator.account.displayName.startsWith('Vanguard_'), 'Guest impersonator falls back to Vanguard_xxx');

  // 6. Character creation with reserved name must throw
  assert.throws(
    () => store.createOrSelectCharacter(reg.account.id, { name: 'system' }),
    /reserved/i,
    'Creating character named system must throw'
  );
});

test('Single-instance enforcement: Superseded session protocol, anti-duplication, and safe cleanup in RoomManager', async () => {
  const { RoomManager } = await import('../server/roomManager.js');
  const { AccountsStore } = await import('../server/accountsStore.js');

  const store = new AccountsStore();
  const reg = store.registerAccount({ username: 'MultiTestHero', password: 'password123' });
  const rooms = new RoomManager({
    accountsStore: store,
    partyManager: {
      getPartyForMember: () => null,
      leaveParty: () => {},
      syncPlayerVitals: () => {},
    },
  });

  const sentPackets1 = [];
  const ws1 = {
    readyState: 1,
    closeCalls: [],
    send(str) { sentPackets1.push(JSON.parse(str)); },
    close(code, reason) { this.closeCalls.push({ code, reason }); this.readyState = 3; }
  };

  const sentPackets2 = [];
  const ws2 = {
    readyState: 1,
    closeCalls: [],
    send(str) { sentPackets2.push(JSON.parse(str)); },
    close(code, reason) { this.closeCalls.push({ code, reason }); this.readyState = 3; }
  };

  // 1. Connect first instance
  const client1 = rooms.attachConnection(ws1, reg.account, 'sanctuary_hub');
  assert.strictEqual(rooms.clients.get(reg.account.id), client1);
  const room = rooms.rooms.get(client1.roomId);
  assert.strictEqual(room.players.get(reg.account.id), client1);

  // 2. Connect second instance of same account (e.g. from second window)
  const client2 = rooms.attachConnection(ws2, reg.account, 'sanctuary_hub');

  // ws1 must receive session_superseded packet BEFORE close
  const supersededPacket = sentPackets1.find((p) => p.type === 'session_superseded');
  assert.ok(supersededPacket, 'Existing session must receive session_superseded packet');
  assert.strictEqual(client1.isSuperseded, true, 'client1 must be flagged isSuperseded');
  assert.strictEqual(ws1.closeCalls.length, 1, 'ws1 must be closed');
  assert.strictEqual(ws1.closeCalls[0].code, 4001, 'Close code must be 4001');

  // client2 is now the active player in room
  assert.strictEqual(rooms.clients.get(reg.account.id), client2);
  assert.strictEqual(room.players.get(reg.account.id), client2);

  // 3. Delayed close event fires on client1's socket (simulating async OS TCP close)
  rooms.removeClient(client1);

  // CRITICAL: Delayed remove of client1 MUST NOT delete client2 from room.players!
  assert.strictEqual(room.players.get(reg.account.id), client2, 'client2 must remain active in room.players');
  assert.strictEqual(rooms.clients.get(reg.account.id), client2, 'client2 must remain active in rooms.clients');

  rooms.stop();
});

test('Single-instance enforcement: Client network decisive superseded lock and UI overlay integration', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const netSrc = fs.readFileSync(path.join(process.cwd(), 'client/network.js'), 'utf8');
  const gameSrc = fs.readFileSync(path.join(process.cwd(), 'client/game.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

  // 1. Network.js handles session_superseded and locks reconnect
  assert.ok(netSrc.includes("msg.type === 'session_superseded'"), 'network.js must handle session_superseded packet');
  assert.ok(netSrc.includes('this.isSuperseded = true'), 'network.js must flag isSuperseded');
  assert.ok(netSrc.includes('reconnectNow()'), 'network.js must provide reconnectNow()');
  assert.ok(netSrc.includes('ev?.code === 4001'), 'network.js must check 4001 close code');

  // 2. Game.js provides cross-tab BroadcastChannel and superseded lock
  assert.ok(gameSrc.includes("BroadcastChannel('glimmerfall_active_session')"), 'game.js must use BroadcastChannel');
  assert.ok(gameSrc.includes('CLAIM_SESSION'), 'game.js must send and listen for CLAIM_SESSION');
  assert.ok(gameSrc.includes('showSessionSupersededOverlay()'), 'game.js must show superseded overlay');
  assert.ok(gameSrc.includes('window.reclaimActiveSession'), 'game.js must expose window.reclaimActiveSession');
  assert.ok(gameSrc.includes('SESSION SUPERSEDED'), 'game.js must update net status pill for superseded state');

  // 3. index.html has #session-superseded-overlay
  assert.ok(indexHtml.includes('id="session-superseded-overlay"'), 'index.html must have #session-superseded-overlay');
  assert.ok(indexHtml.includes('Session Active in Another Window'), 'Overlay must have clear retro title');
  assert.ok(indexHtml.includes('reclaimActiveSession()'), 'Overlay must have Play Here button calling reclaimActiveSession');
});

test('Rendering safety & Action Bar centering: Array prop indexing and persistent center dock alignment', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const gameSrc = fs.readFileSync(path.join(process.cwd(), 'client/game.js'), 'utf8');
  const uiLayoutSrc = fs.readFileSync(path.join(process.cwd(), 'client/uiLayout.js'), 'utf8');
  const touchSrc = fs.readFileSync(path.join(process.cwd(), 'client/touch.js'), 'utf8');

  // 1. Bounty board must be array-safe in game.js
  assert.ok(gameSrc.includes("pr.type === 'bountyBoard'"), 'Must handle bountyBoard prop');
  assert.ok(gameSrc.includes('sprites.props.bountyBoard'), 'Must reference sprites.props.bountyBoard');
  assert.ok(gameSrc.includes('Array.isArray(list)'), 'Must check Array.isArray for bountyBoard');
  assert.ok(gameSrc.includes('instanceof HTMLCanvasElement'), 'Must strictly validate Canvas before drawImage');

  // 2. Action bar centering in uiLayout and touch.js
  assert.ok(uiLayoutSrc.includes('isDefaultCenter'), 'uiLayout must preserve isDefaultCenter');
  assert.ok(uiLayoutSrc.includes("el.style.left = '50%'"), 'uiLayout must anchor center to left 50%');
  assert.ok(touchSrc.includes('isCentered'), 'touch.js fitDock must respect custom vs centered action bar');

  // 3. Sanctuary Hub decor and NPC population must never be skipped
  assert.ok(gameSrc.includes('let currentRoomId = null;'), 'currentRoomId must initialize to null to ensure room_joined populates decor');
  assert.ok(gameSrc.includes('props.length > 0 && npcs.length > 0'), 'setupZoneDecor must not early-return if decor is empty');
  assert.ok(gameSrc.includes('setupZoneDecor(ROOM_TYPES.SANCTUARY_HUB);'), 'Sanctuary decor must be initialized on boot');
});

test('Interface scaling, full loadout preservation, and anti-aliased HD text', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const baseCss = fs.readFileSync(path.join(process.cwd(), 'client/styles/base.css'), 'utf8');
  const hudCss = fs.readFileSync(path.join(process.cwd(), 'client/styles/hud.css'), 'utf8');
  const uiLayoutSrc = fs.readFileSync(path.join(process.cwd(), 'client/uiLayout.js'), 'utf8');
  const gameSrc = fs.readFileSync(path.join(process.cwd(), 'client/game.js'), 'utf8');
  const protocol = await import('../shared/protocol.js');

  // 1. Spells preservation: 8-ability loadout must NEVER be wiped back to slot 1
  const fullLoadout = {
    1: 'whisper_of_the_void',
    2: 'siphon_soul',
    3: 'soul_tithe',
    4: 'nightfall_plague',
    9: 'graveglass_ward',
    10: 'veil_of_dusk',
    11: 'unmake',
    12: 'shadow_step',
  };
  const sanitized = protocol.sanitizeLoadout(fullLoadout, 'graveglass_oracle');
  assert.deepEqual(sanitized, fullLoadout, 'Full 8-ability loadout must be preserved intact without being wiped');

  // 2. High-resolution anti-aliased text canvas layer
  assert.ok(indexHtml.includes('id="text-canvas"'), 'index.html must include text-canvas for vector HD text');
  assert.ok(baseCss.includes('#text-canvas'), 'base.css must style #text-canvas');
  assert.ok(gameSrc.includes('toggleTextAntiAliasing'), 'game.js must provide toggleTextAntiAliasing');
  assert.ok(indexHtml.includes('settings-antialiasing-checkbox'), 'index.html must expose anti-aliasing toggle');

  // 3. Interface browser scaling
  assert.ok(uiLayoutSrc.includes('setUiScale'), 'uiLayout must export setUiScale');
  assert.ok(uiLayoutSrc.includes('cycleUiScale'), 'uiLayout must export cycleUiScale');
  assert.ok(hudCss.includes('--hud-scale'), 'hud.css must scale panels with --hud-scale');
  assert.ok(indexHtml.includes('cycleUiScale()'), 'index.html must include Interface Scale button');
});

test('Sanctuary death respawn and Awaken Champion character creation flow', async () => {
  // 1. Authoritative Server Tick: Dead player outside Arena respawns at Sanctuary Hub
  const accounts = new AccountsStore();
  const rm = new RoomManager({ accountsStore: accounts });
  try {
    const calderaRoom = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.CALDERA_PEAK);
    const sentPackets = [];
    const fakeClient = {
      id: 'p_test_dead_respawn',
      username: 'fallen_hero',
      displayName: 'Fallen Hero',
      faction: 'Solari',
      classId: 'solari_vanguard',
      hp: 0,
      maxHp: 50,
      shield: 0,
      solarCharge: 0,
      maxSolarCharge: 30,
      prog: protocol.createDefaultProgression(),
      isDead: true,
      respawnTimer: 0.01,
      ws: { readyState: 1, send: (data) => sentPackets.push(JSON.parse(data)) },
      send: (pkt) => sentPackets.push(pkt),
    };
    rm.joinRoom(fakeClient, calderaRoom.id);
    assert.equal(fakeClient.roomType, protocol.ROOM_TYPES.CALDERA_PEAK);

    // Simulate death in Caldera
    fakeClient.isDead = true;
    fakeClient.respawnTimer = 0.01;
    fakeClient.hp = 0;

    // Tick the room
    rm.tickRoom(calderaRoom, 0.05);

    // Client should now be restored, not dead, and transported to Sanctuary Hub!
    assert.equal(fakeClient.isDead, false, 'Player should no longer be dead after respawn');
    assert.equal(fakeClient.hp, fakeClient.maxHp, 'Player HP should be restored to max');
    assert.equal(fakeClient.roomType, protocol.ROOM_TYPES.SANCTUARY_HUB, 'Player must respawn at Sanctuary Hub');
    const sanctCfg = protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.SANCTUARY_HUB];
    assert.equal(fakeClient.x, sanctCfg.spawnX, 'Player x must be Sanctuary spawnX');
    assert.equal(fakeClient.y, sanctCfg.spawnY, 'Player y must be Sanctuary spawnY');
  } finally {
    rm.stop();
  }

  // 2. FrontpageController and LandingPageController: Awaken Champion flow without black screen
  let enteredWorldData = null;
  const memoryStore = {};
  global.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
    setItem: (k, v) => { memoryStore[k] = String(v); },
    removeItem: (k) => { delete memoryStore[k]; },
  };

  const bodyEl = { innerHTML: '', contains: () => false };
  const overlayEl = { style: { display: 'none' } };
  const landingOverlayEl = { style: { display: 'block' } };
  globalThis.document = {
    activeElement: null,
    getElementById: (id) => {
      if (id === 'frontpage-body') return bodyEl;
      if (id === 'frontpage-overlay') return overlayEl;
      if (id === 'landing-overlay') return landingOverlayEl;
      return null;
    },
    querySelectorAll: () => [],
    createElement: () => ({ id: '', className: '', style: {} }),
    body: { appendChild: () => {} },
  };

  const fp = new FrontpageController({
    net: {
      profile: null,
      connected: false,
      saveOrSelectCharacter: async (payload) => ({
        ok: true,
        character: { id: 'char_online_1', name: payload.name },
        profile: { id: 'char_online_1', displayName: payload.name, faction: payload.faction, classId: payload.classId },
      }),
    },
    audio: {},
    onEnterWorld: (data) => {
      enteredWorldData = data;
    },
  });

  const landing = new LandingPageController({
    frontpage: fp,
    onEnterWorld: fp.onEnterWorld,
  });

  // Landing open() must ensure frontpage is closed so rendering loop does not halt
  landing.open();
  assert.equal(fp.isOpen, false, 'Frontpage must be closed when Landing is opened');
  assert.equal(landing.isOpen, true, 'Landing must be open');

  // Singleplayer launchGame: creates character, closes landing & frontpage, and enters world cleanly
  landing.playMode = 'singleplayer';
  landing.characterName = 'AwakenedSolari';
  landing.selectedFaction = 'Solari';
  landing.selectedClassId = 'solari_vanguard';

  await landing.launchGame();
  assert.equal(landing.isOpen, false, 'Landing must be closed after launchGame');
  assert.equal(fp.isOpen, false, 'Frontpage must be closed after launchGame');
  assert.ok(enteredWorldData !== null, 'onEnterWorld must have been called');
  assert.equal(enteredWorldData.playMode, 'singleplayer');
  assert.equal(enteredWorldData.profile.displayName, 'AwakenedSolari');
  assert.equal(enteredWorldData.startingRealm, protocol.ROOM_TYPES.SANCTUARY_HUB);

  // Multiplayer launchGame: creates character on online realm without throw or black screen
  enteredWorldData = null;
  landing.playMode = 'multiplayer';
  landing.characterName = 'OnlineAwakened';
  landing.selectedFaction = 'Umbri';
  landing.selectedClassId = 'umbri_reaper';

  await landing.launchGame();
  assert.equal(landing.isOpen, false, 'Landing must be closed after multiplayer launchGame');
  assert.equal(fp.isOpen, false, 'Frontpage must be closed after multiplayer launchGame');
  assert.ok(enteredWorldData !== null, 'onEnterWorld must have been called for multiplayer');
  assert.equal(enteredWorldData.playMode, 'multiplayer');
  assert.equal(enteredWorldData.profile.displayName, 'OnlineAwakened');
  assert.equal(enteredWorldData.startingRealm, protocol.ROOM_TYPES.SANCTUARY_HUB);
});

test('Dead player exploit prevention, anti-aliased world text, and Graveglass Oracle tactical codex', async () => {
  const accounts = new AccountsStore();
  const rm = new RoomManager({ accountsStore: accounts });
  try {
    const calderaRoom = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.CALDERA_PEAK);
    const sentPackets = [];
    const deadClient = {
      id: 'p_test_dead_exploit',
      username: 'exploit_tester',
      displayName: 'Exploit Tester',
      faction: 'Umbri',
      classId: 'graveglass_oracle',
      hp: 0,
      maxHp: 50,
      shield: 0,
      solarCharge: 0,
      maxSolarCharge: 30,
      prog: protocol.createDefaultProgression(),
      isDead: true,
      respawnTimer: 3.0,
      ws: { readyState: 1, send: (data) => sentPackets.push(JSON.parse(data)) },
      send: (pkt) => sentPackets.push(pkt),
    };
    rm.joinRoom(deadClient, calderaRoom.id, null, 10, 20);
    deadClient.isDead = true; // explicitly set dead

    const initialX = deadClient.x;
    const initialY = deadClient.y;
    const initialRoom = deadClient.roomId;

    // 1. Server rejects 'move' packet while client.isDead is true
    rm.handlePacket(deadClient, { type: 'move', x: 200, y: 300, dir: 'right', isMoving: true });
    assert.equal(deadClient.x, initialX, 'Dead client x position must not be altered by move packet');
    assert.equal(deadClient.y, initialY, 'Dead client y position must not be altered by move packet');

    // 2. Server rejects 'switch_room' packet while client.isDead is true
    rm.handlePacket(deadClient, { type: 'switch_room', roomType: protocol.ROOM_TYPES.SANCTUARY_HUB });
    assert.equal(deadClient.roomId, initialRoom, 'Dead client must not be permitted to switch rooms early');

    // 3. Server rejects 'queue_arena' packet while client.isDead is true
    rm.handlePacket(deadClient, { type: 'queue_arena', join: true });
    assert.equal(rm.arenaQueue.some((q) => q.memberIds.includes(deadClient.id)), false, 'Dead client must not be queued into arena');

    // 4. Server rejects 'save_character' RPC while client.isDead is true
    await rm.handlePacket(deadClient, { type: 'auth_rpc', reqId: 'r1', action: 'save_character', payload: { name: 'Oracle' } });
    const rpcRes = sentPackets.find((p) => p.type === 'auth_rpc_res' && p.reqId === 'r1');
    assert.ok(rpcRes, 'Server must respond to save_character RPC');
    assert.equal(rpcRes.ok, false, 'save_character must be rejected while dead');
    assert.ok(rpcRes.error.includes('fallen'), 'Error must inform player to await resurrection');
  } finally {
    rm.stop();
  }

  // 5. CSS and Client DOM verifications: #death-screen pointer events and Class Codex tab
  const modalsCss = fs.readFileSync(new URL('../client/styles/modals.css', import.meta.url), 'utf8');
  assert.ok(modalsCss.includes('#death-screen.active {\n  pointer-events: auto;\n}'), '#death-screen.active must enforce pointer-events: auto to block clicks');

  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(indexHtml.includes('id="st-tab-guide"'), 'Spellbook modal must include Class Codex & Oracle Guide tab');
  assert.ok(indexHtml.includes('id="class-guide-content"'), 'Spellbook modal must contain class-guide-content view');

  const gameJs = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  assert.ok(gameJs.includes('renderClassGuideUI'), 'game.js must implement renderClassGuideUI');
  assert.ok(gameJs.includes('GRAVEGLASS ORACLE — OFFICIAL TACTICAL CODEX'), 'game.js must contain official Graveglass Oracle tactical guide');
  assert.ok(gameJs.includes('activeTextCtx || ctx'), 'game.js must route overhead badges and loot labels to activeTextCtx for anti-aliasing');
});

test('1.25s Crafting Cooldown anti-exploit enforcement and Crystalheart Shattering lore quests', async () => {
  // 1. Authoritative Server Crafting Cooldown (1.25s / 1250ms)
  const accounts = new AccountsStore();
  const rm = new RoomManager({ accountsStore: accounts });
  try {
    const hubRoom = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.SANCTUARY_HUB);
    const sentPackets = [];
    const { account } = accounts.createGuestAccount({
      preferredName: 'Crafter Hero',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
    account.inventory = [{ id: 'ore_starlight', qty: 10 }, { id: 'shard_glimmer', qty: 20 }];

    const crafterClient = {
      ...account,
      prog: account.progression || protocol.createDefaultProgression(),
      hp: 50,
      maxHp: 50,
      shield: 0,
      solarCharge: 30,
      maxSolarCharge: 30,
      isDead: false,
      ws: { readyState: 1, send: (data) => sentPackets.push(typeof data === 'string' ? JSON.parse(data) : data) },
      send: (pkt) => sentPackets.push(pkt),
    };

    rm.joinRoom(crafterClient, hubRoom.id);

    // Initial craft should succeed
    const recipeId = protocol.CRAFTING_RECIPES[0]?.id || 'forge_solari_blade';
    rm.handlePacket(crafterClient, { type: 'craft_recipe', recipeId });

    // Rapid second craft immediately after (0ms delta) MUST be blocked by 1.25s cooldown
    sentPackets.length = 0;
    rm.handlePacket(crafterClient, { type: 'craft_recipe', recipeId });

    const cdPkt = sentPackets.find((p) => p.type === 'sys_msg' && p.text.includes('Artisan Station'));
    assert.ok(cdPkt, 'Server must emit a cooldown warning on rapid repeated craft');
    assert.ok(cdPkt.text.includes('Please wait'), 'Cooldown warning must inform player of artisan delay');
  } finally {
    rm.stop();
  }

  // 2. Client files verify 1.25s cadence
  const craftingUiSrc = fs.readFileSync(new URL('../client/craftingUi.js', import.meta.url), 'utf8');
  assert.ok(craftingUiSrc.includes('1250'), 'craftingUi.js must tick batch crafting at 1250ms (1.25s)');
  assert.ok(craftingUiSrc.includes('1.25s cadence'), 'craftingUi.js must display 1.25s cadence');

  const gameJsSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  assert.ok(gameJsSrc.includes('CRAFT_COOLDOWN_MS = 1250'), 'game.js must enforce 1250ms client-side cooldown');

  // 3. New Canonical GlimmerFall Quests in questCatalogData.js
  const questCatalogSrc = fs.readFileSync(new URL('../client/game/questCatalogData.js', import.meta.url), 'utf8');
  assert.ok(questCatalogSrc.includes('quest_crystalheart_shattering'), 'QUEST_CATALOG must include quest_crystalheart_shattering');
  assert.ok(questCatalogSrc.includes('quest_the_four_splinters'), 'QUEST_CATALOG must include quest_the_four_splinters');
  assert.ok(questCatalogSrc.includes('quest_reforge_crystalheart_shard'), 'QUEST_CATALOG must include quest_reforge_crystalheart_shard');
  assert.ok(questCatalogSrc.includes('The Shattered Crystal Heart'), 'Quest catalog must contain The Shattered Crystal Heart title');

  // 4. World Chronicle Lore in worldAtlasAndLoreUi.js
  const chronicleSrc = fs.readFileSync(new URL('../client/game/worldAtlasAndLoreUi.js', import.meta.url), 'utf8');
  assert.ok(chronicleSrc.includes('THE CRYSTAL HEART') && chronicleSrc.includes('GREAT GLIMMER FRACTURE'), 'World chronicle must explain the Crystal Heart and Glimmer fracture');
});

test('Canonical Heroic Character Sprite Sheet V1.0 styling and palette verification', async () => {
  const { BASE_FACTION_PALETTES } = await import('../client/sprites/characterSprites.js');
  // Solari palette must match Pixel_art_animation_sheet: Cyan hair, Gold plate armor, Purple cape
  assert.equal(BASE_FACTION_PALETTES.Solari.capeMid, '#a855f8', 'Solari cape must be royal purple (#a855f8)');
  assert.equal(BASE_FACTION_PALETTES.Solari.armorHi, '#facc15', 'Solari armor must be radiant gold (#facc15)');
  assert.equal(BASE_FACTION_PALETTES.Solari.hairMid, '#38bdf8', 'Solari hair must be electric cyan (#38bdf8)');

  const characterSpritesSrc = fs.readFileSync(new URL('../client/sprites/characterSprites.js', import.meta.url), 'utf8');
  assert.ok(characterSpritesSrc.includes('makeCanvas(26, 28)'), 'Sprite canvas must use 26x28 dimensions for heroic proportions');
  assert.ok(characterSpritesSrc.includes('Pixel_art_animation_sheet'), 'Sprite sheet must document design lineage from animation sheet');
});

test('Zonal BGM music themes, sanctuary audio track streaming, and room configs', async () => {
  const { BGM_THEMES } = await import('../client/audio.js');
  assert.ok(BGM_THEMES.sanctuary, 'BGM_THEMES must define sanctuary theme');
  assert.ok(BGM_THEMES.sanctuary.audioFile.includes('sanctuary_pixel_overloop.m4a') || BGM_THEMES.sanctuary.audioFile.includes('sanctuary.m4a'), 'Sanctuary theme must link to valid sanctuary audio file');
  assert.ok(BGM_THEMES.solari, 'BGM_THEMES must define solari theme');
  assert.ok(BGM_THEMES.umbri, 'BGM_THEMES must define umbri theme');
  assert.ok(BGM_THEMES.terra, 'BGM_THEMES must define terra theme');
  assert.ok(BGM_THEMES.aether, 'BGM_THEMES must define aether theme');
  assert.ok(BGM_THEMES.abyss, 'BGM_THEMES must define abyss theme');

  const { ROOM_CONFIGS, ROOM_TYPES } = await import('../shared/protocol.js');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB].bgm, 'sanctuary');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.SOLARI_CITADEL].bgm, 'solari');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.UMBRI_UNDERCITY].bgm, 'umbri');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.TERRA_ORCHARD].bgm, 'terra');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.AETHER_SPIRE].bgm, 'aether');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.STARFALL_CRATER].bgm, 'abyss');
  assert.equal(ROOM_CONFIGS[ROOM_TYPES.ABYSSAL_RIFT].bgm, 'abyss');

  const audioJsSrc = fs.readFileSync(new URL('../client/audio.js', import.meta.url), 'utf8');
  assert.ok(audioJsSrc.includes('playTrackAudio'), 'audio.js must implement playTrackAudio');
  assert.ok(audioJsSrc.includes('stopTrackAudio'), 'audio.js must implement stopTrackAudio');
});

test('Authoritative ChatSpamFilter rate limits, duplicate suppression, caps reduction, and profanity masking', async () => {
  const { ChatSpamFilter, maskProfanity, isProfane } = await import('../shared/protocol/chatAndNameFilter.js');
  const filter = new ChatSpamFilter({ minIntervalMs: 500, maxInWindow: 3, windowMs: 2000, repeatCooldownMs: 3000 });

  // 1. First message succeeds
  const r1 = filter.processMessage('player_1', 'Hail, Knights of the Sunspire!');
  assert.equal(r1.allowed, true);
  assert.equal(r1.filteredText, 'Hail, Knights of the Sunspire!');

  // 2. Rapid message under minIntervalMs is throttled
  const r2 = filter.processMessage('player_1', 'Can anyone hear me?');
  assert.equal(r2.allowed, false);
  assert.ok(r2.reason.includes('slow down'));

  // 3. Different player is not throttled by player_1
  const rOther = filter.processMessage('player_2', 'I can hear you clearly!');
  assert.equal(rOther.allowed, true);

  // 4. Repeated exact message spam is rejected even after delay if within repeatCooldownMs
  const filter2 = new ChatSpamFilter({ minIntervalMs: 0, maxInWindow: 10, windowMs: 5000, repeatCooldownMs: 5000 });
  const r3 = filter2.processMessage('p3', 'Selling Sunfire Blade for 500g');
  assert.equal(r3.allowed, true);
  const r3Dup = filter2.processMessage('p3', 'Selling Sunfire Blade for 500g');
  assert.equal(r3Dup.allowed, false);
  assert.ok(r3Dup.reason.toLowerCase().includes('duplicate message'));

  // 5. Excessive caps lock shouting is normalized
  const rCaps = filter2.processMessage('p3', 'EVERYONE COME TO THE WARZONE NOW RIGHT THIS SECOND');
  assert.equal(rCaps.allowed, true);
  assert.ok(rCaps.filteredText !== 'EVERYONE COME TO THE WARZONE NOW RIGHT THIS SECOND');
  assert.ok(rCaps.filteredText.toLowerCase().includes('everyone come to the warzone'));

  // 6. Profanity masking
  assert.equal(isProfane('What a friendly day'), false);
  assert.equal(isProfane('You are a fucking idiot'), true);
  const masked = maskProfanity('You are a fucking idiot and a bitch');
  assert.ok(!masked.includes('fucking'));
  assert.ok(!masked.includes('bitch'));
  assert.ok(masked.includes('*'));
});

test('Character Name validation, profanity filter, reserved words, and cross-account duplication prevention', async () => {
  const { validateCharacterName } = await import('../shared/protocol/chatAndNameFilter.js');
  const { AccountsStore } = await import('../server/accountsStore.js');

  // Length bounds
  assert.equal(validateCharacterName('ab').valid, false);
  assert.equal(validateCharacterName('A'.repeat(25)).valid, false);

  // Character set (alphanumeric, spaces, underscores, hyphens)
  assert.equal(validateCharacterName('Hero_123').valid, true);
  assert.equal(validateCharacterName('Solar-Knight').valid, true);
  assert.equal(validateCharacterName('Hero<script>').valid, false);
  assert.equal(validateCharacterName('Hero$Money').valid, false);

  // Reserved names
  assert.equal(validateCharacterName('System').valid, false);
  assert.equal(validateCharacterName('Moderator').valid, false);
  assert.equal(validateCharacterName('GameMaster').valid, false);

  // Profanity in character name
  assert.equal(validateCharacterName('FuckingHero').valid, false);
  assert.equal(validateCharacterName('BitchKnight').valid, false);

  // Cross-account duplication prevention in AccountsStore
  const store = new AccountsStore();
  const acc1 = store.createGuestAccount({ preferredName: 'OriginalHero' });
  assert.ok(acc1.account);

  // Attempting to create character with existing name on same or different account must fail
  assert.equal(store.isNameTaken('OriginalHero'), true);
  assert.equal(store.isNameTaken('ORIGINALHERO'), true, 'Name collision must be case-insensitive');
  assert.equal(store.isNameTaken('originalhero'), true);

  const acc2 = store.createGuestAccount({ preferredName: 'OtherAccount' });
  assert.throws(() => {
    store.createOrSelectCharacter(acc2.account.id, {
      name: 'OriginalHero',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
  }, /already taken/i);
});

test('RuneScape skilling variations: Arboreal Timbercraft, Cosmic Angling, and Campfire Hearthcraft', () => {
  // 1. Five Tiers of Arboreal Timbercraft Trees
  const treeKeys = ['tree_glimmerwood', 'tree_ironbark', 'tree_duskveil', 'tree_sunforged', 'tree_starlight'];
  const expectedLogs = ['glimmerwood_logs', 'ironbark_logs', 'duskveil_logs', 'sunforged_logs', 'starlight_logs'];
  treeKeys.forEach((tKey, idx) => {
    const spec = protocol.SKILLING_NODE_TYPES[tKey];
    assert.ok(spec, `Missing skilling node ${tKey}`);
    assert.equal(spec.profession, 'resonance_extraction');
    assert.equal(spec.secondaryProfession, 'glimmerweaving');
    assert.ok(spec.reqLevel >= 1);
    assert.ok(spec.yields.some((y) => y.id === expectedLogs[idx]), `${tKey} must yield ${expectedLogs[idx]}`);
    assert.ok(protocol.EQUIPMENT_CATALOG[expectedLogs[idx]], `Missing catalog item ${expectedLogs[idx]}`);
  });

  // 2. Five Tiers of Cosmic Angling Fishing Spots
  const fishKeys = ['fish_shallows', 'fish_river', 'fish_reef', 'fish_abyss', 'fish_celestial'];
  const expectedRawFish = ['raw_glimmer_minnow', 'raw_solar_trout', 'raw_prism_salmon', 'raw_void_eel', 'raw_celestial_koi'];
  fishKeys.forEach((fKey, idx) => {
    const spec = protocol.SKILLING_NODE_TYPES[fKey];
    assert.ok(spec, `Missing skilling node ${fKey}`);
    assert.equal(spec.profession, 'resonance_extraction');
    assert.equal(spec.secondaryProfession, 'glimmerweaving');
    assert.ok(spec.reqLevel >= 1);
    assert.ok(spec.yields.some((y) => y.id === expectedRawFish[idx]), `${fKey} must yield ${expectedRawFish[idx]}`);
    assert.ok(protocol.EQUIPMENT_CATALOG[expectedRawFish[idx]], `Missing catalog item ${expectedRawFish[idx]}`);
  });

  // 3. Campfire Hearth Station & Cooking Recipes
  const hearthStation = protocol.CRAFTING_STATIONS.campfire_hearth;
  assert.ok(hearthStation, 'CRAFTING_STATIONS must define campfire_hearth');
  assert.equal(hearthStation.professionId, 'glimmerweaving');

  const cookedFoods = ['grilled_glimmer_minnow', 'smoked_solar_trout', 'pan_seared_prism_salmon', 'abyssal_eel_skewer', 'celestial_koi_banquet'];
  cookedFoods.forEach((foodId) => {
    const item = protocol.EQUIPMENT_CATALOG[foodId];
    assert.ok(item, `Missing cooked food ${foodId}`);
    assert.equal(item.slot, 'consumable');
    assert.ok(item.healHp > 0, `${foodId} must restore HP`);
    assert.ok(item.restoreGlimmer > 0, `${foodId} must restore Glimmer`);

    const recipe = protocol.CRAFTING_RECIPES.find((r) => r.station === 'campfire_hearth' && r.outputId === foodId);
    assert.ok(recipe, `campfire_hearth recipe missing for ${foodId}`);
    assert.equal(recipe.profession, 'glimmerweaving');
  });

  // 4. Deployable Campfire Kit
  const campfireKit = protocol.EQUIPMENT_CATALOG.campfire_kit;
  assert.ok(campfireKit, 'Missing campfire_kit catalog item');
  assert.equal(campfireKit.placeCampfire, true);
  const kitRecipe = protocol.CRAFTING_RECIPES.find((r) => r.outputId === 'campfire_kit');
  assert.ok(kitRecipe, 'campfire_kit must be craftable');

  // 5. New Explorable Zones (Ironwood Timberlands & Coral Coast)
  const timberlands = protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS];
  const coralCoast = protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.CORAL_COAST];
  assert.ok(timberlands, 'Missing Ironwood Timberlands room config');
  assert.ok(coralCoast, 'Missing Coral Coast room config');
  assert.equal(timberlands.edgeTransitions.north, protocol.ROOM_TYPES.TERRA_ORCHARD);
  assert.equal(timberlands.edgeTransitions.east, protocol.ROOM_TYPES.CORAL_COAST);
  assert.equal(coralCoast.edgeTransitions.north, protocol.ROOM_TYPES.UMBRI_UNDERCITY);
  assert.equal(coralCoast.edgeTransitions.west, protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS);
});

test('RuneScape Bank Vault Depot & Deposit All Materials', async () => {
  const bankUi = await import('../client/bankUi.js');
  const protocol = await import('../shared/protocol.js');

  const testProfile = {
    id: 'test_player',
    inventory: [
      { id: 'iron_broadsword', qty: 1 }, // weapon (gear)
      { id: 'glimmerwood_logs', qty: 25 }, // material
      { id: 'sun_copper_ore', qty: 14 }, // material
      { id: 'minor_healing_salve', qty: 3 }, // consumable
      { id: 'raw_prism_salmon', qty: 5 }, // material
    ],
    bank: [
      { id: 'glimmerwood_logs', qty: 10 },
    ],
  };

  // Run depositAllMaterialsToBank
  bankUi.depositAllMaterialsToBank(testProfile);

  // Material items should have been transferred to bank and stacked
  const bankWood = testProfile.bank.find((b) => b.id === 'glimmerwood_logs');
  assert.ok(bankWood, 'Wood must be in bank');
  assert.equal(bankWood.qty, 35, 'Wood should stack 10 + 25 = 35');

  const bankOre = testProfile.bank.find((b) => b.id === 'sun_copper_ore');
  assert.ok(bankOre, 'Ore must be added to bank');
  assert.equal(bankOre.qty, 14);

  const bankFish = testProfile.bank.find((b) => b.id === 'raw_prism_salmon');
  assert.ok(bankFish, 'Raw fish must be added to bank');
  assert.equal(bankFish.qty, 5);

  // Non-material items must remain in inventory!
  assert.equal(testProfile.inventory.length, 2, 'Weapon and potion must remain in bag');
  assert.equal(testProfile.inventory[0].id, 'iron_broadsword');
  assert.equal(testProfile.inventory[1].id, 'minor_healing_salve');
});

test('Tibia Skull Infamy rules & Graveglass Tombstone retrieval run', async () => {
  const protocol = await import('../shared/protocol.js');
  const { RoomManager } = await import('../server/roomManager.js');
  const { AccountsStore } = await import('../server/accountsStore.js');

  // 1. Constants
  assert.equal(protocol.SKULL_TYPES.WHITE, 'white');
  assert.equal(protocol.SKULL_TYPES.RED, 'red');
  assert.equal(protocol.WHITE_SKULL_DURATION_SEC, 900);
  assert.equal(protocol.RED_SKULL_DURATION_SEC, 1800);

  // 2. RoomManager player skull initialization
  const store = new AccountsStore();
  const rm = new RoomManager({
    accountsStore: store,
    partyManager: {
      getPartyForMember: () => null,
      leaveParty: () => {},
      syncPlayerVitals: () => {},
      getPartyMembers: () => [],
      areInSameParty: () => false,
    },
  });

  const reg1 = store.registerAccount({ username: 'pker_test_user', password: 'Pass123!456', displayName: 'Ruthless PKer', faction: 'Solari', classId: 'solari_paladin' });
  const reg2 = store.registerAccount({ username: 'miner_test_user', password: 'Pass123!456', displayName: 'Peaceful Miner', faction: 'Terra', classId: 'terra_warden' });

  const dummyWs = { readyState: 1, send: () => {}, close: () => {} };
  const victimWs = { readyState: 1, send: () => {}, close: () => {} };

  const attacker = rm.attachConnection(dummyWs, reg1.account, 'nexus_warzone');
  const victim = rm.attachConnection(victimWs, reg2.account, 'nexus_warzone');

  attacker.prog.solarGold = 500;
  victim.prog.solarGold = 300;
  victim.inventory = [{ id: 'glimmerwood_logs', qty: 8 }];

  assert.equal(attacker.skull, null, 'New player must start unskulled');
  assert.equal(attacker.skullTimer, 0);
  assert.equal(attacker.pkCount, 0);

  const warzoneRoom = rm.rooms.get(attacker.roomId);
  assert.ok(warzoneRoom, 'Must be in warzone room');

  // 3. Attacker damages unflagged victim in PvP zone -> White Skull (15m)
  rm.damagePlayerSession(warzoneRoom, victim, 10, attacker.displayName, false, attacker);
  assert.equal(attacker.skull, 'white', 'Attacking innocent player flags White Skull');
  assert.equal(attacker.skullTimer, 900, 'White Skull lasts 900 seconds (15 minutes)');

  // 4. Victim dies -> Graveglass Tombstone spawned with dropped materials & gold
  victim.hp = 1;
  rm.damagePlayerSession(warzoneRoom, victim, 50, attacker.displayName, false, attacker);
  assert.equal(victim.isDead, true, 'Victim should be dead');
  assert.ok(victim.activeTombstone, 'Victim must receive an active tombstone record');

  const tombstone = warzoneRoom.entities.find((e) => e.type === 'graveglass_tombstone');
  assert.ok(tombstone, 'Graveglass Tombstone entity must be spawned in room');
  assert.equal(tombstone.ownerId, victim.id);
  assert.ok(tombstone.gold > 0, 'Tombstone must contain dropped gold');
  assert.ok(tombstone.items.length > 0, 'Tombstone must contain dropped materials');

  // 5. Graveglass Tombstone retrieval run
  victim.isDead = false;
  victim.x = tombstone.x;
  victim.y = tombstone.y;
  const prevGold = victim.prog.solarGold;

  // Tick the room to process proximity retrieval
  rm.tickRoom(warzoneRoom, 0.05, Date.now());
  assert.equal(warzoneRoom.entities.find((e) => e.type === 'graveglass_tombstone'), undefined, 'Tombstone should be removed after retrieval');
  assert.equal(victim.prog.solarGold, prevGold + tombstone.gold, 'Gold should be restored to player upon corpse retrieval');

  // 6. 3 Unprovoked Kills triggers Red Skull (30m)
  attacker.pkCount = 2;
  victim.skull = null;
  victim.hp = 1;
  rm.damagePlayerSession(warzoneRoom, victim, 50, attacker.displayName, false, attacker);
  assert.equal(attacker.skull, 'red', '3 unprovoked kills grants Red Skull');
  assert.equal(attacker.skullTimer, 1800, 'Red skull lasts 1800 seconds (30m)');

  rm.stop();
});

test('World of Warcraft Boss Multi-Phase Mechanics & Telegraphed AoE Ground Danger Zones', async () => {
  const protocol = await import('../shared/protocol.js');
  const { RoomManager } = await import('../server/roomManager.js');
  const { AccountsStore } = await import('../server/accountsStore.js');

  const store = new AccountsStore();
  const rm = new RoomManager({ accountsStore: store });

  // 1. Check Ironwood Timberlands boss (Elder Barkhide) and Coral Coast boss (Triton) in room entities
  const timberlandsRoom = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS);
  const barkhide = timberlandsRoom.entities.find((e) => e.name.includes('Barkhide'));
  assert.ok(barkhide, 'Elder Barkhide must exist in Ironwood Timberlands');
  assert.equal(barkhide.isBoss, true);
  assert.equal(barkhide.spriteKey, 'elderBarkhide');

  const coralRoom = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.CORAL_COAST);
  const triton = coralRoom.entities.find((e) => e.name.includes('Triton'));
  assert.ok(triton, 'Triton must exist in Coral Coast');
  assert.equal(triton.isBoss, true);
  assert.equal(triton.spriteKey, 'tideReaverBoss');

  // 2. Elder Barkhide Telegraphed Primal Root Bind ground danger zone
  timberlandsRoom.groundZones.push({
    id: 'tel_barkhide_test',
    type: 'telegraph',
    color: '#22c55e',
    label: '🌿 PRIMAL ROOT BIND',
    x: 0,
    y: 0,
    radius: 76,
    age: 0,
    maxAge: 1.65,
    damage: 28,
    bossName: barkhide.name,
    bossRef: barkhide,
    snare: 2.5,
  });

  const reg = store.registerAccount({ username: 'wow_raider', password: 'Pass123!456', displayName: 'Heroic Raider', faction: 'Solari', classId: 'solari_paladin' });
  const dummyWs = { readyState: 1, send: () => {}, close: () => {} };
  const player = rm.attachConnection(dummyWs, reg.account, 'ironwood_timberlands');
  player.x = 20;
  player.y = 20;
  const initialHp = player.hp;

  // Advance time past telegraph maxAge so it detonates
  const telZone = timberlandsRoom.groundZones.find((gz) => gz.id === 'tel_barkhide_test');
  telZone.age = 1.7;
  rm.tickRoom(timberlandsRoom, 0.1, Date.now());

  // Player within radius must suffer damage and snare!
  assert.ok(player.hp < initialHp, 'Player within telegraphed circle must take detonation damage');
  assert.ok(player.snareTimer > 0, 'Player within Primal Root Bind circle must be snared');
  assert.equal(timberlandsRoom.groundZones.find((gz) => gz.id === 'tel_barkhide_test'), undefined, 'Telegraph zone must be consumed after detonation');

  rm.stop();
});







