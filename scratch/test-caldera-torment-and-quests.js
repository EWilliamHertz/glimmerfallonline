import assert from 'node:assert';
import { ROOM_TYPES, ROOM_CONFIGS } from '../shared/protocol.js';
import { RoomManager } from '../server/roomManager.js';

console.log('🧪 Starting Verification Tests for Torment Caldera, Quests, and Minimap...');

// Test 1: Room Configurations and Edge Transitions
const sHub = ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
assert.strictEqual(sHub.edgeTransitions.north, ROOM_TYPES.AETHER_SPIRE, 'Sanctuary north must lead to Aether Spire');
assert.strictEqual(sHub.edgeTransitions.south, ROOM_TYPES.TERRA_ORCHARD, 'Sanctuary south must lead to Terra Orchard');
assert.strictEqual(sHub.edgeTransitions.east, ROOM_TYPES.UMBRI_UNDERCITY, 'Sanctuary east must lead to Umbri Undercity');
assert.strictEqual(sHub.edgeTransitions.west, ROOM_TYPES.SOLARI_CITADEL, 'Sanctuary west must lead to Solari Citadel');

const aSpire = ROOM_CONFIGS[ROOM_TYPES.AETHER_SPIRE];
assert.strictEqual(aSpire.edgeTransitions.south, ROOM_TYPES.SANCTUARY_HUB, 'Aether Spire south must return to Sanctuary Hub');

const ruins = ROOM_CONFIGS[ROOM_TYPES.NEXUS_FORGOTTEN_RUINS];
assert.strictEqual(ruins.edgeTransitions.north, ROOM_TYPES.NEXUS_WARZONE, 'Forgotten Ruins north must lead to Caldera Warzone');
assert.strictEqual(ruins.edgeTransitions.south, ROOM_TYPES.SANCTUARY_HUB, 'Forgotten Ruins south must lead to Sanctuary');

const warzone = ROOM_CONFIGS[ROOM_TYPES.NEXUS_WARZONE];
assert.strictEqual(warzone.edgeTransitions.south, ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, 'Warzone south must lead to Forgotten Ruins');
assert.strictEqual(warzone.edgeTransitions.north, ROOM_TYPES.CELESTIAL_ASCENT, 'Warzone north must lead to Celestial Ascent');

const ascent = ROOM_CONFIGS[ROOM_TYPES.CELESTIAL_ASCENT];
assert.strictEqual(ascent.edgeTransitions.south, ROOM_TYPES.NEXUS_WARZONE, 'Celestial Ascent south must lead to Warzone');

console.log('✅ Test 1 Passed: Room configurations and edge transitions verified!');

// Test 2: Server RoomManager Entity Scaling in Warzone (10x HP and damage)
const mockAccounts = { saveProgression: () => {} };
const rm = new RoomManager(mockAccounts);

const warzoneRoom = rm.getOrCreatePublicRoom(ROOM_TYPES.NEXUS_WARZONE);
assert(warzoneRoom, 'Warzone public room must exist');

const outpost = warzoneRoom.entities.find((e) => e.type === 'outpost_nexus');
assert(outpost, 'Outpost nexus must exist in warzone');
assert.strictEqual(outpost.maxHp, 300, 'Outpost maxHp must be 300 (10x scaled)');

const shard = warzoneRoom.entities.find((e) => e.type === 'siege_shard');
assert(shard, 'Siege shard must exist in warzone');
assert.strictEqual(shard.maxHp, 850, 'Siege shard maxHp must be 850 (10x scaled)');

const worldBoss = warzoneRoom.entities.find((e) => e.id === 'solari_world_boss');
assert(worldBoss, 'Solari world boss must exist in warzone');
assert.strictEqual(worldBoss.maxHp, 1250, 'World boss maxHp must be 1250 (10x scaled)');
assert.strictEqual(worldBoss.damage, 44, 'World boss damage must be 44 (scaled late game)');

const passMob = warzoneRoom.entities.find((e) => e.id === 'pass_mob_1');
assert(passMob, 'Pass mob must exist in warzone');
assert.strictEqual(passMob.maxHp, 420, 'Pass mob maxHp must be 420 (10x scaled)');
assert.strictEqual(passMob.damage, 24, 'Pass mob damage must be 24 (scaled late game)');

console.log('✅ Test 2 Passed: 10x entity stats scaling in Caldera Warzone verified!');

// Test 3: Celestial Ascent Raid Boss in RoomManager
const ascentRoom = rm.getOrCreatePublicRoom(ROOM_TYPES.CELESTIAL_ASCENT);
assert(ascentRoom, 'Celestial Ascent room must exist');

const titanBoss = ascentRoom.entities.find((e) => e.id === 'celestial_titan_boss');
assert(titanBoss, 'Aurelius the Empyrean Sovereign must exist');
assert.strictEqual(titanBoss.maxHp, 3200, 'Titan boss maxHp must be 3200');
assert.strictEqual(titanBoss.damage, 32, 'Titan boss damage must be 32');
assert.strictEqual(titanBoss.dropGear, 'crown_of_dawn', 'Titan boss must drop Crown of Dawn');

console.log('✅ Test 3 Passed: Celestial Ascent Summit and Aurelius Raid Boss verified!');

// Clean up
rm.stop();

console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
