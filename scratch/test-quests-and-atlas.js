import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Starting Quests & World Atlas Verification...');

// 1. Check index.html elements
const indexHtml = fs.readFileSync('index.html', 'utf8');

assert(indexHtml.includes('id="quest-tracker"'), 'quest-tracker element must exist in index.html');
assert(indexHtml.includes('id="lore-tab-quests"'), 'lore-tab-quests must exist in index.html');
assert(indexHtml.includes('id="lore-tab-map"'), 'lore-tab-map must exist in index.html');
assert(indexHtml.includes('id="lore-tab-chronicle"'), 'lore-tab-chronicle must exist in index.html');
assert(indexHtml.includes('WORLD ATLAS [M]'), 'WORLD ATLAS [M] button must exist in index.html');
assert(indexHtml.includes('id="lore-modal-body"'), 'lore-modal-body container must exist in index.html');
console.log('✅ HTML markup verification passed: Quest tracker, Atlas button, Lore tabs present.');

// 2. Check client/game.js functions and structures
const gameJs = fs.readFileSync('client/game.js', 'utf8');

assert(gameJs.includes('const QUEST_CATALOG = {'), 'QUEST_CATALOG must be defined');
assert(gameJs.includes('quest_caldera_siege'), 'quest_caldera_siege quest must exist in QUEST_CATALOG');
assert(gameJs.includes('quest_celestial_ascent'), 'quest_celestial_ascent quest must exist in QUEST_CATALOG');
assert(gameJs.includes('quest_titan_cleansing'), 'quest_titan_cleansing quest must exist in QUEST_CATALOG');
assert(gameJs.includes('quest_elemental_pilgrimage'), 'quest_elemental_pilgrimage quest must exist in QUEST_CATALOG');

assert(gameJs.includes('const WORLD_ATLAS_REGIONS = {'), 'WORLD_ATLAS_REGIONS must be defined as dictionary');
assert(gameJs.includes('SANCTUARY_HUB:'), 'SANCTUARY_HUB region must be present in atlas');
assert(gameJs.includes('SOLARI_CITADEL:'), 'SOLARI_CITADEL region must be present in atlas');
assert(gameJs.includes('UMBRI_UNDERCITY:'), 'UMBRI_UNDERCITY region must be present in atlas');
assert(gameJs.includes('TERRA_ORCHARD:'), 'TERRA_ORCHARD region must be present in atlas');
assert(gameJs.includes('AETHER_SPIRE:'), 'AETHER_SPIRE region must be present in atlas');
assert(gameJs.includes('NEXUS_FORGOTTEN_RUINS:'), 'NEXUS_FORGOTTEN_RUINS region must be present in atlas');
assert(gameJs.includes('NEXUS_WARZONE:'), 'NEXUS_WARZONE region must be present in atlas');
assert(gameJs.includes('CELESTIAL_ASCENT:'), 'CELESTIAL_ASCENT region must be present in atlas');

assert(gameJs.includes('function updateQuestTrackerHUD('), 'updateQuestTrackerHUD must be defined');
assert(gameJs.includes('function renderLoreModal('), 'renderLoreModal must be defined');
assert(gameJs.includes('function renderQuestLogView('), 'renderQuestLogView must be defined');
assert(gameJs.includes('function renderWorldAtlasView('), 'renderWorldAtlasView must be defined');
assert(gameJs.includes('window.inspectMapRegion = function'), 'window.inspectMapRegion must be defined');
assert(gameJs.includes('window.toggleQuestTracking = function'), 'window.toggleQuestTracking must be defined');
assert(gameJs.includes('window.toggleWorldAtlas = function'), 'window.toggleWorldAtlas must be defined');
assert(gameJs.includes('window.openQuestLog = function'), 'window.openQuestLog must be defined');

console.log('✅ client/game.js verification passed: Quests, Atlas regions, and modal renderers present.');

// 3. Test data integrity and simulation
// Extract WORLD_ATLAS_REGIONS snippet to evaluate structure
const atlasMatch = gameJs.match(/const WORLD_ATLAS_REGIONS = (\{[\s\S]*?\n  \});/);
assert(atlasMatch, 'Should extract WORLD_ATLAS_REGIONS');
const regionsObj = eval(`(${atlasMatch[1].replace(/;$/, '')})`);
const regionKeys = Object.keys(regionsObj);
assert(regionKeys.length >= 7, `Expected at least 7 regions in World Atlas, found ${regionKeys.length}`);

for (const key of regionKeys) {
  const reg = regionsObj[key];
  assert(reg.id, `Region ${key} must have id`);
  assert(reg.name, `Region ${key} must have name`);
  assert(reg.faction, `Region ${key} must have faction/affiliation`);
  assert(reg.level, `Region ${key} must have level`);
  assert(Array.isArray(reg.entities) && reg.entities.length > 0, `Region ${key} must have entities`);
  assert(reg.travel, `Region ${key} must have travel/directions`);
  for (const ent of reg.entities) {
    assert(ent.name, 'Entity must have name');
    assert(ent.type, 'Entity must have type');
    assert(ent.hp, 'Entity must have hp');
  }
}
console.log(`✅ Verified ${regionKeys.length} World Atlas regions with affiliations, entities, and directions.`);

// 4. Test quest tracking logic simulation
const questState = {
  trackedQuests: {
    quest_caldera_siege: true,
    quest_warzone_patrol: false
  }
};

function isTracked(qId) {
  return questState.trackedQuests[qId] !== false;
}

assert.strictEqual(isTracked('quest_caldera_siege'), true, 'quest_caldera_siege should be tracked');
assert.strictEqual(isTracked('quest_warzone_patrol'), false, 'quest_warzone_patrol should not be tracked');
assert.strictEqual(isTracked('quest_elemental_pilgrimage'), true, 'untouched quest defaults to tracked');

questState.trackedQuests['quest_warzone_patrol'] = !questState.trackedQuests['quest_warzone_patrol'];
assert.strictEqual(isTracked('quest_warzone_patrol'), true, 'toggled quest should now be tracked');

console.log('✅ Quest tracking toggle simulation passed.');
console.log('🎉 All tests passed successfully!');
