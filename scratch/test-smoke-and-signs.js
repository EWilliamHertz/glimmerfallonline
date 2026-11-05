// scratch/test-smoke-and-signs.js
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Verification Tests for Purple Smoke Animations and Waypost Signs Removal...');

const gameJsPath = path.resolve(process.cwd(), 'client/game.js');
const gameJs = fs.readFileSync(gameJsPath, 'utf8');

// 1. Verify No Waypost Signs in props
console.log('\n--- Test 1: Verify Waypost Signs Removal ---');
const woodenSignMatches = gameJs.match(/type:\s*['"]woodenSign['"]/g) || [];
// The only allowed occurrence is the fallback renderer handling in drawWorld (1 occurrence)
console.log(`Found ${woodenSignMatches.length} references to 'woodenSign'`);
assert.strictEqual(woodenSignMatches.length <= 1, true, `Expected <= 1 reference to woodenSign, found ${woodenSignMatches.length}`);

assert.strictEqual(gameJs.includes("label: '⬆ NORTH GATE"), false, 'Sanctuary North sign still present');
assert.strictEqual(gameJs.includes("label: '⭐ TORMENT GATE"), false, 'Ruins Torment sign still present');
assert.strictEqual(gameJs.includes("label: '⬇ DESCENT"), false, 'Celestial Ascent sign still present');
assert.strictEqual(gameJs.includes("label: '⭐ ASCENT GATE"), false, 'Warzone Ascent sign still present');
assert.strictEqual(gameJs.includes("Trail sign"), false, 'Warzone Trail sign still present');
console.log('✅ Test 1 Passed: All waypost signs successfully removed from all game zones!');

// 2. Verify Purple Smoke Animation System
console.log('\n--- Test 2: Verify Purple Smoke Animation System ---');
assert.strictEqual(gameJs.includes('SMOKE_PURPLE_PALETTE'), true, 'SMOKE_PURPLE_PALETTE missing');
assert.strictEqual(gameJs.includes('triggerEntityDeathEffect'), true, 'triggerEntityDeathEffect missing');
assert.strictEqual(gameJs.includes("pt.type === 'smoke'"), true, 'Smoke particle type renderer missing');
assert.strictEqual(gameJs.includes('pt.darkColor'), true, 'Smoke darkColor halo missing');
assert.strictEqual(gameJs.includes('pt.highlightColor'), true, 'Smoke highlightColor core missing');
assert.strictEqual(gameJs.includes('p.vz += 14 * dt'), true, 'Smoke buoyancy physics missing');
console.log('✅ Test 2 Passed: Billowing purple smoke particle system verified!');

// 3. Verify Entity Death Hooks
console.log('\n--- Test 3: Verify Entity & Player Death Hooks ---');
assert.strictEqual(gameJs.includes('triggerEntityDeathEffect(ent.x, ent.y, ent.isBoss);'), true, 'killOfflineEntity hook missing');
assert.strictEqual(gameJs.includes('triggerEntityDeathEffect(se.x, se.y, se.isBoss);'), true, 'state_sync dying entity hook missing');
assert.strictEqual(gameJs.includes("triggerEntityDeathEffect(fx.x, fx.y, (fx.count || 26) > 35);"), true, 'fx smoke hook missing');
assert.strictEqual(gameJs.includes('triggerEntityDeathEffect(player.x, player.y, true);'), true, 'Player death hook missing');
console.log('✅ Test 3 Passed: All entity and player death triggers verified!');

console.log('\n🎉 ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!');
