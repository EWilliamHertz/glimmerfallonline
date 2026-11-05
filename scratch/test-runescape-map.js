import assert from 'node:assert';
import fs from 'node:fs';
import { ROOM_CONFIGS, ROOM_TYPES } from '../shared/protocol.js';

console.log('🧪 Starting RuneScape Map & First Nexus Keystone Removal Verification...');

// 1. Verify First Nexus Keystone removal in server and client
const serverJs = fs.readFileSync('server/roomManager.js', 'utf8');
const clientJs = fs.readFileSync('client/game.js', 'utf8');

assert(!serverJs.includes('sanctuary_keystone_portal'), 'sanctuary_keystone_portal must be removed from server');
assert(!clientJs.includes('sanctuary_keystone_portal'), 'sanctuary_keystone_portal must be removed from client');
console.log('✅ First Nexus Keystone portal successfully removed from both server and client.');

// 2. Verify seamless boundary transitions in ROOM_CONFIGS
const sanctuary = ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
const aether = ROOM_CONFIGS[ROOM_TYPES.AETHER_SPIRE];
const ruins = ROOM_CONFIGS[ROOM_TYPES.NEXUS_FORGOTTEN_RUINS];
const warzone = ROOM_CONFIGS[ROOM_TYPES.NEXUS_WARZONE];
const ascent = ROOM_CONFIGS[ROOM_TYPES.CELESTIAL_ASCENT];

assert.strictEqual(sanctuary.edgeTransitions.north, ROOM_TYPES.AETHER_SPIRE, 'Sanctuary north must lead to Aether Spire');
assert.strictEqual(aether.edgeTransitions.south, ROOM_TYPES.SANCTUARY_HUB, 'Aether Spire south must lead to Sanctuary');
assert.strictEqual(aether.edgeTransitions.north, ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, 'Aether Spire north must lead to Forgotten Ruins');
assert.strictEqual(ruins.edgeTransitions.south, ROOM_TYPES.AETHER_SPIRE, 'Forgotten Ruins south must lead to Aether Spire');
assert.strictEqual(ruins.edgeTransitions.north, ROOM_TYPES.NEXUS_WARZONE, 'Forgotten Ruins north must lead to Caldera');
assert.strictEqual(warzone.edgeTransitions.south, ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, 'Caldera south must lead to Forgotten Ruins');
assert.strictEqual(warzone.edgeTransitions.north, ROOM_TYPES.CELESTIAL_ASCENT, 'Caldera north must lead to Celestial Ascent');
assert.strictEqual(ascent.edgeTransitions.south, ROOM_TYPES.NEXUS_WARZONE, 'Celestial Ascent south must lead to Caldera');
console.log('✅ Continuous linear North-South continental transitions verified: Sanctuary <-> Spire <-> Ruins <-> Caldera <-> Summit.');

// 3. Verify RuneScape Square Map features in client/game.js
assert(clientJs.includes('window.edgeHoverScroll = function'), 'edgeHoverScroll must be defined');
assert(clientJs.includes('window.cancelEdgeHoverScroll = function'), 'cancelEdgeHoverScroll must be defined');
assert(clientJs.includes('window.selectMapRegion = function'), 'selectMapRegion must be defined');
assert(clientJs.includes('window.setAtlasViewMode = function'), 'setAtlasViewMode must be defined');
assert(clientJs.includes('window.centerMapOnPlayer = function'), 'centerMapOnPlayer must be defined');
assert(clientJs.includes('function renderSquareZoneView('), 'renderSquareZoneView must be defined');
assert(clientJs.includes('function renderContinentalGridView('), 'renderContinentalGridView must be defined');
assert(clientJs.includes('map-edge-scroll north'), 'North edge scroll bar must exist in template');
assert(clientJs.includes('map-edge-scroll south'), 'South edge scroll bar must exist in template');
assert(clientJs.includes('map-edge-scroll west'), 'West edge scroll bar must exist in template');
assert(clientJs.includes('map-edge-scroll east'), 'East edge scroll bar must exist in template');
console.log('✅ RuneScape Map edge-hover scroll bars and view functions present in client.');

// 4. Extract WORLD_ATLAS_REGIONS and verify neighbors & landmarks
const atlasMatch = clientJs.match(/const WORLD_ATLAS_REGIONS = (\{[\s\S]*?\n  \};)/);
assert(atlasMatch, 'Should extract WORLD_ATLAS_REGIONS');
const regionsObj = eval(`(${atlasMatch[1].replace(/;$/, '')})`);

for (const [key, reg] of Object.entries(regionsObj)) {
  assert(reg.neighbors, `Region ${key} must define neighbors`);
  assert(Array.isArray(reg.landmarks) && reg.landmarks.length > 0, `Region ${key} must have landmarks`);
  for (const lm of reg.landmarks) {
    assert(typeof lm.x === 'number' && lm.x >= 0 && lm.x <= 100, `Landmark ${lm.name} x must be 0-100%`);
    assert(typeof lm.y === 'number' && lm.y >= 0 && lm.y <= 100, `Landmark ${lm.name} y must be 0-100%`);
    assert(lm.icon, `Landmark ${lm.name} must have icon`);
    assert(lm.name, `Landmark must have name`);
  }
}
console.log('✅ Verified all regions have valid landmarks, coordinates, and neighbor topologies.');

// 5. Simulate stepping North through the whole continent
let curr = 'SANCTUARY_HUB';
assert.strictEqual(regionsObj[curr].neighbors.north, 'AETHER_SPIRE');
curr = regionsObj[curr].neighbors.north;
assert.strictEqual(regionsObj[curr].neighbors.north, 'NEXUS_FORGOTTEN_RUINS');
curr = regionsObj[curr].neighbors.north;
assert.strictEqual(regionsObj[curr].neighbors.north, 'NEXUS_WARZONE');
curr = regionsObj[curr].neighbors.north; // now NEXUS_WARZONE
assert.strictEqual(regionsObj[curr].neighbors.north, 'CELESTIAL_ASCENT');
curr = regionsObj[curr].neighbors.north; // now CELESTIAL_ASCENT
assert.strictEqual(regionsObj[curr].neighbors.north, null, 'Celestial Ascent is the apex with no further north');
console.log('✅ Simulated continent Northward traversal succeeded without arbitrary portals.');

console.log('🎉 All RuneScape Map & Keystone removal tests passed successfully!');
process.exit(0);
