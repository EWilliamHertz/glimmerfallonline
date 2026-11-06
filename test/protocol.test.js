import test from 'node:test';
import assert from 'node:assert/strict';
import * as protocol from '../shared/protocol.js';

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
  assert.equal(protocol.getTotalProfessionLevel(prog.professions), 5);
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

test('action slots unlock on their authored levels', () => {
  assert.equal(protocol.isSlotUnlocked({ level: 1 }, 1), true);
  assert.equal(protocol.isSlotUnlocked({ level: 1 }, 2), false);
  assert.equal(protocol.isSlotUnlocked({ level: 8 }, 12), true);
  assert.equal(protocol.isSlotUnlocked({ level: 7 }, 12), false);
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
