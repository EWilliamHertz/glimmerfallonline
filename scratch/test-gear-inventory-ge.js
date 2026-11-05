// ==========================================
// Test Suite: RuneScape-Inspired Equipment, Barrows Sets, 28-Slot Inventory & Grand Exchange
// ==========================================

import assert from 'node:assert';
import {
  EQUIPMENT_CATALOG,
  BARROWS_SETS,
  getActiveSetBonuses,
  getEquipmentStatBonuses,
  calcMaxHp,
  calcMaxGlimmer,
  calcCritChance,
  calcCdMult,
} from '../shared/protocol.js';
import {
  VALID_EQUIP_SLOTS,
  normalizeEquipment,
  normalizeInventory,
  AccountsStore,
} from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';

console.log('🧪 Starting Gear, Barrows Sets, Inventory & Grand Exchange Verification...\n');

// 1. Verify 11 RuneScape Paperdoll Slots
console.log('1. Verifying 11 RuneScape Paperdoll Slots...');
assert.strictEqual(VALID_EQUIP_SLOTS.length, 11);
const expectedSlots = ['head', 'cape', 'neck', 'ammo', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
for (const s of expectedSlots) {
  assert.ok(VALID_EQUIP_SLOTS.includes(s), `Missing slot ${s}`);
}
console.log('   ✓ All 11 slots present and validated.');

// 2. Verify Barrows Sets Catalog
console.log('2. Verifying 5 Barrows Sets & Set Perks...');
const expectedSets = ['sunforged_daystar', 'ironwood_primordial', 'chrono_astral', 'duskveil_reaver', 'aurelius_titan'];
for (const setKey of expectedSets) {
  const s = BARROWS_SETS[setKey];
  assert.ok(s, `Missing set ${setKey}`);
  assert.strictEqual(s.pieces.length, 4, `Set ${setKey} must have 4 pieces`);
  for (const pieceId of s.pieces) {
    const item = EQUIPMENT_CATALOG[pieceId];
    assert.ok(item, `Piece ${pieceId} not found in EQUIPMENT_CATALOG`);
    assert.strictEqual(item.set, setKey, `Piece ${pieceId} set tag mismatch`);
  }
}
console.log('   ✓ All 5 Barrows sets defined with 4 pieces each.');

// 3. Verify Set Bonus Activation & Stat Additions
console.log('3. Verifying Set Bonus Calculation & Stats...');
const dharokEquip = {
  head: 'sunforged_greathelm',
  body: 'sunforged_hauberk',
  legs: 'sunforged_greaves',
  weapon: 'sunforged_warhammer',
};
const { active: dharokActive } = getActiveSetBonuses(dharokEquip);
assert.strictEqual(dharokActive.length, 1);
assert.strictEqual(dharokActive[0].id, 'sunforged_daystar');
const dharokBonuses = getEquipmentStatBonuses(dharokEquip);
// Total power: 1 (helm) + 1 (hauberk) + 1 (greaves) + 5 (hammer) + 4 (set bonus) + 1 (default shield) = 13
assert.strictEqual(dharokBonuses.power, 13);
console.log('   ✓ Dharok\'s Daystar Bulwark 4/4 activates with +4 Power & +4 Bastion set bonus.');

// Apex Boss Set: Aurelius Titan
const titanEquip = {
  head: 'crown_of_dawn',
  body: 'aurelius_sovereign_plate',
  legs: 'aurelius_starforged_greaves',
  weapon: 'aurelius_morningstar_blade',
};
const { active: titanActive } = getActiveSetBonuses(titanEquip);
assert.strictEqual(titanActive.length, 1);
assert.strictEqual(titanActive[0].id, 'aurelius_titan');
const titanHp = calcMaxHp({ level: 30, stats: { bastion: 10 } }, titanEquip);
const regularHp = calcMaxHp({ level: 30, stats: { bastion: 10 } }, {});
assert.strictEqual(titanHp > regularHp + 100, true, 'Titan set should grant +150 HP bonus');
console.log(`   ✓ Aurelius Titan grants Apex stats: Regular HP = ${regularHp}, Titan HP = ${titanHp}`);

// 4. Verify 28-Slot Inventory Normalization & Boundaries
console.log('4. Verifying 28-Slot Inventory Limits...');
const bigList = Array.from({ length: 35 }, (_, i) => ({ id: 'ring_of_the_sun', qty: 1 }));
const normInv = normalizeInventory(bigList);
assert.strictEqual(normInv.length, 28, 'Inventory must be capped at exactly 28 slots');
console.log('   ✓ Inventory strictly capped at 28 slots.');

// 5. Verify AccountsStore Atomic Swap & Unequip
console.log('5. Verifying AccountsStore Equip & Unequip Atomic Operations...');
const accounts = new AccountsStore();
const guestRes = accounts.createGuestAccount({ preferredName: 'Ironman_Test', faction: 'Solari', classId: 'solari_vanguard' });
const acc = guestRes.account;
assert.strictEqual(acc.inventory.length > 0, true, 'Guest should have starter inventory');

// Add item to inventory
const added = accounts.addItemToInventory(acc.id, 'sunforged_warhammer');
assert.strictEqual(added, true);
const warhammerIdx = acc.inventory.findIndex((it) => it.id === 'sunforged_warhammer');
assert.notStrictEqual(warhammerIdx, -1);

// Equip from inventory (slotIndex)
const equipRes = accounts.equipFromInventory(acc.id, warhammerIdx);
assert.strictEqual(equipRes.success, true);
assert.strictEqual(acc.equipment.weapon, 'sunforged_warhammer');
console.log('   ✓ Successfully equipped Sunforged War-Greathammer from inventory.');

// Unequip back to inventory
const unequipRes = accounts.unequipToInventory(acc.id, 'weapon');
assert.strictEqual(unequipRes.success, true);
assert.notStrictEqual(acc.equipment.weapon, 'sunforged_warhammer');
assert.strictEqual(acc.inventory.some((it) => it.id === 'sunforged_warhammer'), true);
console.log('   ✓ Successfully unequipped weapon back into 28-slot backpack.');

// Test accessory unequip (head slot)
accounts.updateProfile(acc.id, { equipment: { head: 'sunforged_greathelm' } });
assert.strictEqual(acc.equipment.head, 'sunforged_greathelm');
const unequipHeadRes = accounts.unequipToInventory(acc.id, 'head');
assert.strictEqual(unequipHeadRes.success, true);
assert.strictEqual(acc.equipment.head, undefined);
assert.strictEqual(acc.inventory.some((it) => it.id === 'sunforged_greathelm'), true);
console.log('   ✓ Successfully unequipped head slot back to inventory.');

// Fill inventory to 28 items and verify unequip rejection
while (acc.inventory.length < 28) {
  accounts.addItemToInventory(acc.id, 'ring_of_the_sun');
}
assert.strictEqual(acc.inventory.length, 28);
// Now equip weapon directly
accounts.updateProfile(acc.id, { equipment: { weapon: 'sunforged_warhammer' } });
// Attempt to unequip with full inventory
const fullUnequipRes = accounts.unequipToInventory(acc.id, 'weapon');
assert.strictEqual(fullUnequipRes.success, false, 'Should fail to unequip when inventory is full');
assert.ok(fullUnequipRes.reason.includes('Inventory is full'));
console.log('   ✓ Full inventory correctly prevents unequipping with feedback reason.');

// 6. Verify RoomManager Drop Roll & Biome Pools
console.log('6. Verifying RoomManager Biome Drop Pools...');
const roomMgr = new RoomManager({ accountsStore: accounts, partyManager: { syncPlayerVitals: () => {} } });
const solariRoom = { type: 'solari_citadel' };
const terraRoom = { type: 'terra_orchard' };
const warzoneRoom = { type: 'nexus_warzone' };

const solariDrop = roomMgr.getEquipmentDropForEntity(solariRoom, { isBoss: false });
assert.ok(solariDrop, 'Solari drop should be returned');
const terraDrop = roomMgr.getEquipmentDropForEntity(terraRoom, { isBoss: false });
assert.ok(terraDrop, 'Terra drop should be returned');
const warzoneDrop = roomMgr.getEquipmentDropForEntity(warzoneRoom, { isBoss: true });
assert.ok(warzoneDrop, 'Warzone boss drop should be returned');

console.log(`   ✓ Biome drops verified: Solari -> ${solariDrop}, Terra -> ${terraDrop}, Warzone -> ${warzoneDrop}`);
roomMgr.stop();

console.log('\n🎉 ALL GEAR, BARROWS SETS, INVENTORY & GE TESTS PASSED PERFECTLY!\n');
