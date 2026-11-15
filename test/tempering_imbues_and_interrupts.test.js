import test from 'node:test';
import assert from 'node:assert/strict';
import * as protocol from '../shared/protocol.js';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';

test('Artisan Professions expose Lv. 30, 50, and 70 Tempering Sigils, Weapon Imbues, and Combat Feasts', () => {
  const expectedRecipes = [
    { id: 'forge_starsteel_temper_sigil', profession: 'relic_forging', reqLevel: 30, outputId: 'starsteel_temper_sigil' },
    { id: 'forge_voidfire_temper_sigil', profession: 'relic_forging', reqLevel: 50, outputId: 'voidfire_temper_sigil' },
    { id: 'forge_chronocore_temper_sigil', profession: 'relic_forging', reqLevel: 70, outputId: 'chronocore_temper_sigil' },
    { id: 'brew_solari_radiance_oil', profession: 'rite_binding', reqLevel: 30, outputId: 'solari_radiance_oil' },
    { id: 'brew_umbri_void_venom', profession: 'rite_binding', reqLevel: 50, outputId: 'umbri_void_venom' },
    { id: 'brew_chrono_starlight_imbue', profession: 'rite_binding', reqLevel: 70, outputId: 'chrono_starlight_imbue' },
    { id: 'cook_golden_starlight_feast', profession: 'glimmerweaving', reqLevel: 30, outputId: 'golden_starlight_feast' },
    { id: 'cook_abyssal_kraken_chowder', profession: 'glimmerweaving', reqLevel: 50, outputId: 'abyssal_kraken_chowder' },
    { id: 'cook_celestial_ambrosia_banquet', profession: 'glimmerweaving', reqLevel: 70, outputId: 'celestial_ambrosia_banquet' },
  ];

  for (const exp of expectedRecipes) {
    const recipe = protocol.CRAFTING_RECIPES.find((r) => r.id === exp.id);
    assert.ok(recipe, `Missing recipe ${exp.id}`);
    assert.equal(recipe.profession, exp.profession);
    assert.equal(recipe.reqLevel, exp.reqLevel);
    assert.equal(recipe.outputId, exp.outputId);
    assert.ok(protocol.EQUIPMENT_CATALOG[exp.outputId], `Missing catalog item ${exp.outputId}`);
  }
});

test('Gear Tempering (+1 to +5) scales combat stats and works authoritatively via use_consumable', () => {
  const accounts = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const rm = new RoomManager(accounts);
  rm.parties = { areInSameParty: () => false, syncPlayerVitals: () => {}, getPartyMembers: () => [] };
  try {
    const { account: acc } = accounts.createGuestAccount('TemperMaster', 'Solari', 'solari_vanguard');
    accounts.ensureDefaultCharacter(acc);
    accounts.addItemToInventory(acc.id, 'starsteel_temper_sigil', 2);
    accounts.addItemToInventory(acc.id, 'voidfire_temper_sigil', 2);
    accounts.addItemToInventory(acc.id, 'chronocore_temper_sigil', 1);
    accounts.addItemToInventory(acc.id, 'solari_radiance_oil', 1);
    accounts.addItemToInventory(acc.id, 'golden_starlight_feast', 1);

    const room = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.SANCTUARY_HUB);
    const msgs = [];
    const client = {
      id: acc.id,
      displayName: acc.displayName,
      faction: 'Solari',
      classId: 'solari_vanguard',
      roomId: room.id,
      x: 0,
      y: 0,
      hp: 40,
      maxHp: 120,
      solarCharge: 10,
      maxSolarCharge: 100,
      isDead: false,
      prog: acc.progression,
      inventory: acc.inventory,
      equipment: acc.equipment,
      send(m) { msgs.push(m); },
    };
    rm.clients.set(client.id, client);
    room.players.set(client.id, client);

    const baseEff = protocol.getEffectiveStats(client.prog, client.equipment, client.classId);

    // Temper weapon from +0 -> +1 -> +2 using Starsteel Sigils
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'starsteel_temper_sigil', preferredSlot: 'weapon' });
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'starsteel_temper_sigil', preferredSlot: 'weapon' });
    assert.equal(protocol.getTemperSlotRank(client.prog, 'weapon'), 2);

    // Temper weapon +2 -> +3 -> +4 using Voidfire Sigils
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'voidfire_temper_sigil', preferredSlot: 'weapon' });
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'voidfire_temper_sigil', preferredSlot: 'weapon' });
    assert.equal(protocol.getTemperSlotRank(client.prog, 'weapon'), 4);

    // Temper weapon +4 -> +5 using Chronocore Apex Sigil
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'chronocore_temper_sigil', preferredSlot: 'weapon' });
    assert.equal(protocol.getTemperSlotRank(client.prog, 'weapon'), 5);

    const afterEff = protocol.getEffectiveStats(client.prog, client.equipment, client.classId);
    assert.equal(afterEff.power, baseEff.power + 10, 'Weapon +5 temper must grant +10 Power');
    assert.equal(afterEff.tempo, baseEff.tempo + 5, 'Weapon +5 temper must grant +5 Tempo');

    // Apply Weapon Imbue & Feast via use_consumable
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'solari_radiance_oil' });
    rm.handlePacket(client, { type: 'use_consumable', itemId: 'golden_starlight_feast' });
    assert.ok(client.weaponImbue && client.weaponImbue.timer > 500, 'Weapon Imbue buff should be active');
    assert.ok(client.wellFedBuff && client.wellFedBuff.timer > 500, 'Well-Fed Feast buff should be active');
    assert.ok(client.hp > 40, 'Feast should restore player HP');
    const buffBonuses = protocol.getActiveCombatConsumableBonuses(client);
    assert.equal(buffBonuses.power, 10, 'Oil (+6) + Feast (+4) should stack to +10 Power');
  } finally {
    rm.stop();
  }
});

test('Off-GCD Flashes interrupt Elite/Boss casts, cancel linked telegraphs, and apply +35% Stagger Vulnerability', () => {
  assert.equal(protocol.canAbilityInterrupt(protocol.ABILITIES_CATALOG.radiant_bulwark), true);
  assert.equal(protocol.canAbilityInterrupt(protocol.ABILITIES_CATALOG.solar_intervene), true);
  assert.equal(protocol.canAbilityInterrupt(protocol.ABILITIES_CATALOG.shadow_step), true);
  assert.equal(protocol.canAbilityInterrupt(protocol.ABILITIES_CATALOG.frost_nova), true);
  assert.equal(protocol.canAbilityInterrupt(protocol.ABILITIES_CATALOG.flare_strike), false);
  assert.equal(protocol.canAbilityInterrupt(protocol.ABILITIES_CATALOG.solar_flare), false);

  const accounts = new AccountsStore({ memoryOnly: true, persistentMemoryFallback: true });
  const rm = new RoomManager(accounts);
  rm.parties = { areInSameParty: () => false, syncPlayerVitals: () => {}, getPartyMembers: () => [] };
  try {
    const { account: acc } = accounts.createGuestAccount('FlashBreaker', 'Solari', 'solari_vanguard');
    accounts.ensureDefaultCharacter(acc);
    acc.progression.level = 12;
    acc.progression.skills.radiant_bulwark = 1;
    acc.progression.skills.flare_strike = 1;
    acc.loadout = { 1: 'flare_strike', 2: 'radiant_bulwark' };

    const room = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.STARFALL_CRATER);
    const msgs = [];
    const player = {
      id: acc.id,
      displayName: acc.displayName,
      faction: 'Solari',
      classId: 'solari_vanguard',
      roomId: room.id,
      x: 0,
      y: 0,
      z: 0,
      dir: 'right',
      hp: 150,
      maxHp: 150,
      shield: 0,
      solarCharge: 20,
      maxSolarCharge: 100,
      isDead: false,
      prog: acc.progression,
      equipment: acc.equipment,
      loadout: acc.loadout,
      cooldowns: { 1: 0, 2: 0 },
      gcdTimer: 0.9, // On GCD — off-GCD Flash must still interrupt!
      gcdTotal: 1.5,
      send(m) { msgs.push(m); },
    };
    rm.clients.set(player.id, player);
    room.players.set(player.id, player);

    const boss = room.entities.find((e) => e.type === 'mob') || {
      id: 'test_elite',
      name: 'Test Elite',
      type: 'mob',
      x: 40,
      y: 0,
      origX: 40,
      origY: 0,
      hp: 1000,
      maxHp: 1000,
      damage: 15,
      inCombat: true,
      dammers: new Set(),
      threatTable: {},
    };
    if (!room.entities.includes(boss)) room.entities.push(boss);
    boss.x = 40;
    boss.y = 0;
    boss.hp = 1000;
    boss.maxHp = 1000;
    boss.staggerTimer = 0;
    boss.freezeTimer = 0;
    boss.castState = {
      id: 'cast_test_1',
      spellName: '🔥 CORONA CATACLYSM',
      color: '#facc15',
      remaining: 2.0,
      totalDuration: 2.2,
      interruptible: true,
    };
    room.groundZones.push({
      id: 'tel_test_1',
      castId: 'cast_test_1',
      type: 'telegraph',
      x: 0,
      y: 0,
      radius: 75,
      age: 0,
      maxAge: 2.2,
      damage: 50,
      bossRef: boss,
    });

    const flashXpBefore = player.prog.professions.flashes.xp || 0;
    rm.handleCastAbility(room, player, 2, boss.id, 'right');

    assert.equal(boss.castState, null, 'Off-GCD Flash must cancel enemy castState');
    assert.ok(boss.staggerTimer >= 2.9, 'Interrupted enemy must be Staggered for 3.0s');
    assert.ok(boss.freezeTimer >= 1.4, 'Interrupted enemy must be stunned briefly');
    assert.equal(room.groundZones.some((gz) => gz.castId === 'cast_test_1'), false, 'Linked telegraph must be cancelled upon interrupt');
    assert.ok(player.solarCharge >= 38, `Interrupt must award +18 bonus Glimmer (got ${player.solarCharge})`);
    assert.ok(msgs.some((m) => m.text && m.text.includes('Counter-Flash')), 'Interrupt must notify player with Counter-Flash message');
    assert.ok((player.prog.professions.flashes.xp || 0) >= flashXpBefore + 35, 'Interrupt must award +35 Flashes XP');

    // Damage during Stagger receives +35% vulnerability multiplier
    const hpBefore = boss.hp;
    rm.applyAuthoritativeDamage(room, player, { kind: 'entity', ref: boss }, 100, false, 'Test Strike', false);
    assert.equal(hpBefore - boss.hp, Math.round(100 * protocol.INTERRUPT_VULN_MULT), 'Staggered mob should take 1.35x damage');
  } finally {
    rm.stop();
  }
});
