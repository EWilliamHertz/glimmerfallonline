import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as protocol from '../shared/protocol.js';
import { recordAchievementStat } from '../client/achievementsAndEmotes.js';

test('All Trees Choppable: Crimson Blossom, Alpine Pine, Ancient Oak, logs, and campfire recipes', () => {
  // 1. Verify Skilling Node Specs for all tree types
  const treeSpecs = [
    { key: 'tree_blossom', logs: 'blossom_logs', reqLevel: 1 },
    { key: 'tree_glimmerwood', logs: 'glimmerwood_logs', reqLevel: 1 },
    { key: 'tree_pine', logs: 'pine_logs', reqLevel: 10 },
    { key: 'tree_ironbark', logs: 'ironbark_logs', reqLevel: 15 },
    { key: 'tree_ancient_oak', logs: 'oak_logs', reqLevel: 25 },
    { key: 'tree_duskveil', logs: 'duskveil_logs', reqLevel: 35 },
    { key: 'tree_sunforged', logs: 'sunforged_logs', reqLevel: 55 },
    { key: 'tree_starlight', logs: 'starlight_logs', reqLevel: 75 },
  ];

  treeSpecs.forEach(({ key, logs, reqLevel }) => {
    const spec = protocol.SKILLING_NODE_TYPES[key];
    assert.ok(spec, `SKILLING_NODE_TYPES must define ${key}`);
    assert.equal(spec.profession, 'resonance_extraction');
    assert.equal(spec.reqLevel, reqLevel, `${key} reqLevel mismatch`);
    assert.ok(spec.charges >= 3, `${key} charges must be at least 3`);
    assert.ok(spec.xp >= 20, `${key} must grant extraction XP`);
    assert.ok(spec.yields.some((y) => y.id === logs), `${key} must yield ${logs}`);

    const item = protocol.EQUIPMENT_CATALOG[logs];
    assert.ok(item, `EQUIPMENT_CATALOG must define ${logs}`);
    assert.equal(item.slot, 'material');
    assert.equal(item.stackable, true);
  });

  // 2. Verify Campfire Recipes for new timber species
  const recipes = [
    { id: 'recipe_blossom_campfire_kit', logId: 'blossom_logs' },
    { id: 'recipe_pine_campfire_kit', logId: 'pine_logs' },
    { id: 'recipe_oak_campfire_kit', logId: 'oak_logs' },
  ];

  recipes.forEach(({ id, logId }) => {
    const r = protocol.CRAFTING_RECIPES.find((rec) => rec.id === id);
    assert.ok(r, `CRAFTING_RECIPES must define ${id}`);
    assert.equal(r.outputId, 'campfire_kit');
    assert.ok(r.ingredients.some((ing) => ing.id === logId), `${id} must require ${logId}`);
  });

  // 3. Verify Crimson Blossom Trees are in Sanctuary Hub & Terra Orchard
  const sanctuaryTrees = protocol.SKILLING_LAYOUTS[protocol.ROOM_TYPES.SANCTUARY_HUB];
  assert.ok(sanctuaryTrees.some(([k]) => k === 'tree_blossom'), 'Sanctuary Hub must feature choppable Crimson Blossom Trees');
  assert.ok(sanctuaryTrees.some(([k]) => k === 'tree_ancient_oak'), 'Sanctuary Hub must feature choppable Ancient Oaks');

  const orchardTrees = protocol.SKILLING_LAYOUTS[protocol.ROOM_TYPES.TERRA_ORCHARD];
  assert.ok(orchardTrees.some(([k]) => k === 'tree_blossom'), 'Terra Orchard must feature choppable Crimson Blossom Trees');
  assert.ok(orchardTrees.some(([k]) => k === 'tree_ancient_oak'), 'Terra Orchard must feature choppable Ancient Oaks');

  const warzoneTrees = protocol.SKILLING_LAYOUTS[protocol.ROOM_TYPES.NEXUS_WARZONE];
  assert.ok(warzoneTrees.some(([k]) => k === 'tree_pine'), 'Nexus Warzone must feature choppable Alpine Pines');
  assert.ok(warzoneTrees.some(([k]) => k === 'tree_ancient_oak'), 'Nexus Warzone must feature choppable Ancient Oaks');
});

test('Day 20 Emote Wheel & EMOTES_CATALOG: Wave, Bow, Cheer, Flex, Dance, Salute, and Hearth', () => {
  const expectedEmotes = ['wave', 'bow', 'cheer', 'swords', 'shield', 'flex', 'dance', 'salute', 'fire', 'gg'];
  expectedEmotes.forEach((id) => {
    const em = protocol.EMOTES_CATALOG[id];
    assert.ok(em, `EMOTES_CATALOG must define ${id}`);
    assert.ok(em.icon, `${id} must have an icon`);
    assert.ok(em.label, `${id} must have a label`);
    assert.ok(em.text, `${id} must have text`);
  });
});

test('Day 21 In-Game Achievements & TCG Lore Codex Engine', () => {
  // 1. Catalog integrity
  assert.ok(protocol.ACHIEVEMENTS_CATALOG.length >= 12, 'ACHIEVEMENTS_CATALOG must have at least 12 milestones');
  assert.ok(protocol.LORE_CODEX_ENTRIES.length >= 5, 'LORE_CODEX_ENTRIES must have at least 5 chapters');

  // 2. Progression & Unlocks
  const dummyProg = {
    stats: {},
    achievements: { completed: {}, unlockedTitles: [] },
  };

  let unlocked = [];
  // Chop 5 Crimson Blossom Trees
  for (let i = 0; i < 5; i++) {
    const res = recordAchievementStat(dummyProg, 'trees_blossom_cut', 1);
    if (res.length) unlocked.push(...res);
  }

  assert.equal(dummyProg.stats.trees_blossom_cut, 5);
  assert.ok(dummyProg.achievements.completed.ach_crimson_feller, 'ach_crimson_feller must be unlocked');
  assert.ok(dummyProg.achievements.unlockedTitles.includes('Crimson Arborist'), 'Title Crimson Arborist must be unlocked');

  // Verify getUnlockedTitles helper
  const titles = protocol.getUnlockedTitles(dummyProg);
  assert.ok(titles.includes('Crimson Arborist'));

  // Verify sanitizePlayerTitle
  assert.equal(protocol.sanitizePlayerTitle('<Crimson Arborist>'), 'Crimson Arborist');
  assert.equal(protocol.sanitizePlayerTitle('InvalidNonExistentTitle'), null);
});
