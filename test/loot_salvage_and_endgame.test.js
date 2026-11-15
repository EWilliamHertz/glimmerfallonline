import test from 'node:test';
import assert from 'node:assert/strict';
import * as protocol from '../shared/protocol.js';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';

test('rollMobLootDrops eliminates vital/glimmer recovery orbs and scales gold/tier gear by level', () => {
  const lowTotals = [];
  const highTotals = [];

  for (let i = 0; i < 120; i += 1) {
    const lowDrops = protocol.rollMobLootDrops({
      roomType: protocol.ROOM_TYPES.SOLARI_PLAINS,
      ent: { id: 'm1', sub: 'Lv.5 Emberling', isBoss: false },
      getZoneMaterialDrop: () => 'solar_copper_ore',
    });
    for (const d of lowDrops) {
      assert.notEqual(d.kind, 'vital', 'Normal mobs must never drop vital shard orbs');
      assert.notEqual(d.kind, 'glimmer', 'Normal mobs must never drop glimmer shard orbs');
      if (d.itemId === 'solar_gold') lowTotals.push(d.qty);
    }

    const highDrops = protocol.rollMobLootDrops({
      roomType: protocol.ROOM_TYPES.CHRONOCORE_CITADEL,
      ent: { id: 'm2', sub: 'Lv.58 Paradox Arbiter', isBoss: false, eliteAffix: 'molten' },
      getZoneMaterialDrop: () => 'celestial_runite_ore',
    });
    for (const d of highDrops) {
      assert.notEqual(d.kind, 'vital', 'Elites must never drop vital shard orbs');
      assert.notEqual(d.kind, 'glimmer', 'Elites must never drop glimmer shard orbs');
      if (d.itemId === 'solar_gold') highTotals.push(d.qty);
    }
  }

  const avgLow = lowTotals.reduce((a, b) => a + b, 0) / lowTotals.length;
  const avgHigh = highTotals.reduce((a, b) => a + b, 0) / highTotals.length;
  assert.ok(avgHigh > avgLow * 4, `Expected Lv.58 Elite avg gold (${avgHigh.toFixed(1)}) to far exceed Lv.5 mob (${avgLow.toFixed(1)})`);

  const bossDrops = protocol.rollMobLootDrops({
    roomType: protocol.ROOM_TYPES.CHRONOCORE_CITADEL,
    ent: { id: 'ccit_boss', sub: '★ Lv.68 Temporal Apex Boss', isBoss: true },
    getBossSetDrop: () => 'chrono_mantle',
    getBossAccessoryDrop: () => 'amulet_of_fury',
    getKeystoneDrop: () => 'keystone_aether_5',
    getZoneMaterialDrop: () => 'celestial_runite_ore',
  });
  assert.ok(bossDrops.some((d) => d.kind === 'relic'), 'Bosses should drop an Ancient Relic Cache');
  assert.ok(!bossDrops.some((d) => d.kind === 'vital' || d.kind === 'glimmer'), 'Bosses must not drop vital/glimmer orbs');
  assert.ok(bossDrops.some((d) => d.itemId === 'ancient_relic_fragment'), 'Bosses should guarantee Ancient Relic Fragments');
});

test('RoomManager.spawnLootDrops never spawns vital or glimmer ground orbs', () => {
  const accounts = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const rm = new RoomManager(accounts);
  try {
    const plains = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.SOLARI_PLAINS);
    plains.loot = [];
    for (let i = 0; i < 30; i += 1) {
      rm.spawnLootDrops(plains, { id: `mob_${i}`, sub: 'Lv.12 Sun Scarab', x: 0, y: 0, isBoss: false });
    }
    assert.ok(plains.loot.length > 0, 'Mobs should still spawn loot items');
    for (const orb of plains.loot) {
      assert.notEqual(orb.kind, 'vital');
      assert.notEqual(orb.kind, 'glimmer');
      assert.ok(['item', 'relic'].includes(orb.kind));
    }
  } finally {
    rm.stop();
  }
});

test('Gear Salvage converts unwanted equipment into crafting materials, gold, and Relic Forging XP', () => {
  assert.equal(protocol.isGearSalvageable('iron_broadsword'), true);
  assert.equal(protocol.isGearSalvageable('solar_gold'), false);
  assert.equal(protocol.isGearSalvageable('minor_healing_salve'), false);

  const rareYield = protocol.getSalvageYield('umbral_steel_platebody');
  assert.ok(rareYield && rareYield.gold > 0 && rareYield.xp > 0);
  assert.ok(rareYield.materials.some((m) => m.id === 'astral_mineral_dust'));

  const accounts = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const rm = new RoomManager(accounts);
  rm.parties = { areInSameParty: () => false, syncPlayerVitals: () => {}, getPartyMembers: () => [] };
  try {
    const { account: acc } = accounts.createGuestAccount('SalvageSmith', 'Solari', 'solari_vanguard');
    accounts.ensureDefaultCharacter(acc);
    accounts.addItemToInventory(acc.id, 'iron_broadsword', 1);
    accounts.addItemToInventory(acc.id, 'minor_healing_salve', 1);

    const room = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.SANCTUARY_HUB);
    const msgs = [];
    const client = {
      id: acc.id,
      displayName: acc.displayName,
      roomId: room.id,
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      solarCharge: 50,
      maxSolarCharge: 100,
      prog: structuredClone(acc.progression || protocol.createDefaultProgression('solari_vanguard')),
      inventory: acc.inventory,
      equipment: acc.equipment,
      send(m) { msgs.push(m); },
    };
    rm.clients.set(client.id, client);
    room.players.set(client.id, client);

    const beforeXp = client.prog.professions?.relic_forging?.xp || 0;
    const swordIdx = client.inventory.findIndex((it) => (typeof it === 'string' ? it : it?.id) === 'iron_broadsword');
    assert.ok(swordIdx >= 0, 'Starter inventory should include iron_broadsword');

    // Salvaging non-gear consumable must be ignored safely
    const potIdx = client.inventory.findIndex((it) => (typeof it === 'string' ? it : it?.id) === 'minor_healing_salve');
    rm.handlePacket(client, { type: 'salvage_inventory_item', slotIndex: potIdx });
    assert.ok(client.inventory.some((it) => (typeof it === 'string' ? it : it?.id) === 'minor_healing_salve'));

    // Salvaging gear succeeds
    rm.handlePacket(client, { type: 'salvage_inventory_item', slotIndex: swordIdx });
    const hasSwordAfter = client.inventory.some((it) => (typeof it === 'string' ? it : it?.id) === 'iron_broadsword');
    assert.equal(hasSwordAfter, false, 'Salvaged weapon should be removed from inventory');
    assert.ok(client.inventory.some((it) => (typeof it === 'string' ? it : it?.id) === 'astral_mineral_dust'), 'Salvaging should grant astral_mineral_dust');
    assert.ok(client.inventory.some((it) => (typeof it === 'string' ? it : it?.id) === 'solar_gold'), 'Salvaging should grant solar_gold');
    const afterXp = client.prog.professions?.relic_forging?.xp || 0;
    assert.ok(afterXp > beforeXp, 'Salvaging should award Relic Forging XP');
  } finally {
    rm.stop();
  }
});

test('Endgame Lv. 44-70 progression and Chronocore Apex bounty are configured without lowering MAX_BASE_LEVEL', () => {
  assert.ok(protocol.MAX_BASE_LEVEL >= 70, 'MAX_BASE_LEVEL must remain at least 70');

  const accounts = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const rm = new RoomManager(accounts);
  try {
    const citadel = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.CHRONOCORE_CITADEL);
    const levels = citadel.entities
      .filter((e) => e.type === 'mob')
      .map((e) => protocol.parseEntityLevel(e));
    assert.ok(Math.max(...levels) >= 65, `Chronocore Citadel must scale up toward Lv.70 (max found: ${Math.max(...levels)})`);
    assert.ok(citadel.entities.some((e) => e.id === 'ccit_mob_3' && e.type === 'mob'));
    assert.ok(citadel.entities.some((e) => e.id === 'ccit_mob_4' && e.type === 'mob'));
    const boss = citadel.entities.find((e) => e.id === 'ccit_boss');
    assert.ok(boss && boss.dropGear === 'chronos_singularity_core', 'Chronocore boss must carry its Relic dropGear');
  } finally {
    rm.stop();
  }

  const apexBounty = protocol.BOUNTY_CONTRACTS.find((b) => b.id === 'bounty_chronocore_apex');
  assert.ok(apexBounty, 'bounty_chronocore_apex should exist in BOUNTY_CONTRACTS');
  assert.equal(apexBounty.kind, 'chronocore_kills');
});
