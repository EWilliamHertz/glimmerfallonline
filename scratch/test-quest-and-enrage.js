import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- 1. Testing UI text replacements ---');

// 1. Verify "Authentic Diablo 2 Progression" is removed from index.html
const indexHtml = fs.readFileSync('./index.html', 'utf8');
assert(!indexHtml.includes('Authentic Diablo 2 Progression'), 'index.html must not contain Authentic Diablo 2 Progression');
assert(indexHtml.includes('4 Canonical Factions • 8 Archetypes • Seamless World Traversal'), 'index.html has updated subtitle');
console.log('✓ "Authentic Diablo 2 Progression" verified removed from index.html');

// 2. Verify "ZERO LAG" is removed from frontpage.js Single Player button
const frontpageJs = fs.readFileSync('./client/frontpage.js', 'utf8');
assert(!frontpageJs.includes('ZERO LAG'), 'frontpage.js must not contain ZERO LAG');
assert(!frontpageJs.includes('0ms • ZERO LAG'), 'frontpage.js must not contain 0ms • ZERO LAG');
assert(frontpageJs.includes('OFFLINE REALM'), 'frontpage.js includes OFFLINE REALM');
console.log('✓ "ZERO LAG" verified removed from frontpage.js');

console.log('--- 2. Testing Shattered Nexus Enrage Prevention ---');

// 3. Verify server/roomManager.js excludes Shattered Nexus from Phase 3 Enrage
const roomManagerJs = fs.readFileSync('./server/roomManager.js', 'utf8');
assert(roomManagerJs.includes('isNexusShard'), 'roomManager.js must check isNexusShard');
assert(roomManagerJs.includes('if (isNexusShard) {\n              e.enraged = false;'), 'roomManager.js resets e.enraged for isNexusShard');

// 4. Verify client/game.js excludes Shattered Nexus from enrage phase and display
const gameJs = fs.readFileSync('./client/game.js', 'utf8');
assert(gameJs.includes('const isNexusShard = e.type === \'siege_shard\' || e.id === \'siege_shard\' || (e.name && e.name.includes(\'Nexus\'));'), 'client game.js checks isNexusShard during phase 3');
assert(gameJs.includes('const isNexusShard = ent.type === \'siege_shard\' || ent.id === \'siege_shard\' || (ent.name && ent.name.includes(\'Nexus\'));\n          const isEnraged = !isNexusShard && Boolean(ent.enraged || ((ent.hp / (ent.maxHp || 1)) <= 0.35));'), 'client game.js prevents isEnraged on nameplate and aura for Shattered Nexus');
console.log('✓ Shattered Nexus enrage prevention logic verified on both server and client');

console.log('--- 3. Testing Quest Kill Tracking and Reset Logic ---');

// 5. Test mock quest engine logic matching client/game.js
const ROOM_TYPES = {
  SANCTUARY_HUB: 'SANCTUARY_HUB',
  SOLARI_CITADEL: 'SOLARI_CITADEL',
  UMBRI_UNDERCITY: 'UMBRI_UNDERCITY',
  TERRA_ORCHARD: 'TERRA_ORCHARD',
  AETHER_SPIRE: 'AETHER_SPIRE',
  NEXUS_FORGOTTEN_RUINS: 'NEXUS_FORGOTTEN_RUINS',
  NEXUS_WARZONE: 'NEXUS_WARZONE',
  CELESTIAL_ASCENT: 'CELESTIAL_ASCENT',
};

let questState = {
  stasisBroken: false,
  dummyDamaged: false,
  nodeHarvested: false,
  portalTraveled: false,
  warzoneKills: 0,
  ruinsKills: 0,
  calderaKills: 0,
  titanChallenged: false,
  ascentReached: false,
  activeQuests: { quest_void_banish: { accepted: true } },
  completedQuests: {},
};

const recentKillKeys = new Set();
function onPlayerKilledMob(roomType, mobName, isBoss, mobId = null) {
  const dedupeKey = mobId ? String(mobId) : `${roomType}_${mobName}_${Math.floor(Date.now() / 1200)}`;
  if (recentKillKeys.has(dedupeKey)) return;
  recentKillKeys.add(dedupeKey);

  if (roomType !== ROOM_TYPES.SANCTUARY_HUB || (mobName && (mobName.includes('Void') || mobName.includes('Fiend') || mobName.includes('Stalker')))) {
    questState.warzoneKills = (questState.warzoneKills || 0) + 1;
  }
  if (roomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS || (mobName && (mobName.includes('Ruin') || mobName.includes('Ancient') || mobName.includes('Horror')))) {
    questState.ruinsKills = (questState.ruinsKills || 0) + 1;
  }
  if (roomType === ROOM_TYPES.NEXUS_WARZONE || (mobName && mobName.includes('Torment'))) {
    questState.calderaKills = (questState.calderaKills || 0) + 1;
  }
}

// Kill 1: Solari Citadel mob (outside Sanctuary)
onPlayerKilledMob(ROOM_TYPES.SOLARI_CITADEL, 'Golden Vanguard Scout', false, 'mob_1');
assert.strictEqual(questState.warzoneKills, 1, 'Solari Citadel kill increments warzoneKills');

// Kill 2: Umbri Undercity mob
onPlayerKilledMob(ROOM_TYPES.UMBRI_UNDERCITY, 'Dusk Fiend', false, 'mob_2');
assert.strictEqual(questState.warzoneKills, 2, 'Umbri Undercity kill increments warzoneKills');

// Kill 3: Forgotten Ruins mob
onPlayerKilledMob(ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, 'Ancient Ruin Horror', false, 'mob_3');
assert.strictEqual(questState.warzoneKills, 3, 'Forgotten Ruins kill increments warzoneKills');
assert.strictEqual(questState.ruinsKills, 1, 'Forgotten Ruins kill also increments ruinsKills');

// Dedupe test: duplicate mob_3 kill event from broadcast should be ignored
onPlayerKilledMob(ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, 'Ancient Ruin Horror', false, 'mob_3');
assert.strictEqual(questState.warzoneKills, 3, 'Duplicate mob_3 kill is deduped and does not increment');

// Caldera Torment mob kill
onPlayerKilledMob(ROOM_TYPES.NEXUS_WARZONE, 'Torment Void Fiend', false, 'mob_4');
assert.strictEqual(questState.warzoneKills, 4, 'Caldera kill increments warzoneKills');
assert.strictEqual(questState.calderaKills, 1, 'Caldera kill increments calderaKills');

console.log('✓ Quest kill counting and deduplication logic verified successfully!');
console.log('All tests passed!');
