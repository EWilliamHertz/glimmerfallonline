import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  EQUIPMENT_CATALOG,
  GLIMMER_CIPHERS_CATALOG,
  HARMONIC_EXTRACT_TABLE,
  NEXUS_FAMILIARS_CATALOG,
  MAIL_POSTAGE_GOLD,
  ROOM_TYPES,
  computeFamiliarBonuses,
  extractMaterialToCiphers,
  compileFamiliarFromPrint,
  createDefaultProgression,
  calcMaxHp,
  calcCastSpeedMult,
  calcCritDamageMult,
  getEquipmentStatBonuses,
  rollMobLootDrops,
  countBagItem,
} from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { ExchangeManager } from '../server/exchangeManager.js';
import { RoomManager } from '../server/roomManager.js';

function createMockWs() {
  const sent = [];
  return {
    readyState: 1,
    sent,
    send(raw) {
      sent.push(JSON.parse(raw));
    },
  };
}

function cleanupStore(store) {
  if (store?.flushTimer) {
    clearTimeout(store.flushTimer);
    store.flushTimer = null;
  }
}

test('Harmonic Extractor catalog, Ciphers, Echo-Prints, and Chrono-Prism crit math work cleanly', () => {
  for (const cid of Object.keys(GLIMMER_CIPHERS_CATALOG)) {
    assert.ok(EQUIPMENT_CATALOG[cid], `Missing Cipher ${cid} in EQUIPMENT_CATALOG`);
    assert.equal(EQUIPMENT_CATALOG[cid].stackable, true);
  }
  for (const def of Object.values(NEXUS_FAMILIARS_CATALOG)) {
    assert.ok(EQUIPMENT_CATALOG[def.echoPrintId], `Missing Echo-Print ${def.echoPrintId} in EQUIPMENT_CATALOG`);
    assert.equal(EQUIPMENT_CATALOG[def.echoPrintId].stackable, true);
  }

  assert.ok(HARMONIC_EXTRACT_TABLE.raw_glimmer_minnow);
  assert.ok(HARMONIC_EXTRACT_TABLE.sun_copper_ore);
  assert.ok(HARMONIC_EXTRACT_TABLE.sunbloom_herb);
  assert.ok(HARMONIC_EXTRACT_TABLE.glimmerwood_logs);

  const inv = [{ id: 'raw_solar_trout', qty: 4 }];
  // Normal roll (never crits) vs Chrono-Prism boosted crit roll
  const res1 = extractMaterialToCiphers({ inv, itemId: 'raw_solar_trout', count: 2, activeFamiliarId: null, rng: () => 0.99 });
  assert.equal(res1.ok, true);
  assert.equal(res1.cipherId, 'cipher_solar');
  assert.equal(res1.cipherQty, 4); // 2x * 2 per trout
  assert.equal(res1.bonusProcs, 0);
  assert.equal(countBagItem(inv, 'raw_solar_trout'), 2);
  assert.equal(countBagItem(inv, 'cipher_solar'), 4);

  // With Chrono-Prism Sprite (+15% cipherBonusChance on top of 12% = 27%): rng() = 0.20 triggers bonus
  const res2 = extractMaterialToCiphers({ inv, itemId: 'raw_solar_trout', count: 2, activeFamiliarId: 'chrono_prism_sprite', rng: () => 0.20 });
  assert.equal(res2.ok, true);
  assert.equal(res2.bonusProcs, 2);
  assert.equal(res2.cipherQty, 6);
  assert.equal(countBagItem(inv, 'cipher_solar'), 10);
});

test('Construct Cradle compilation unlocks Nexus Familiars and applies balanced utility stats', () => {
  const prog = createDefaultProgression();
  const baseHp = calcMaxHp(prog, {}, 'solari_vanguard');
  const inv = [
    { id: 'echo_print_ember_fox', qty: 1 },
    { id: 'cipher_solar', qty: 5 },
    { id: 'echo_print_pyre_drake', qty: 1 },
    { id: 'cipher_aether', qty: 4 },
  ];

  // Level-gated check for Apex Pyre-Drake
  const blocked = compileFamiliarFromPrint({ inv, prog, familiarId: 'shattered_pyre_drake', riteBindingLevel: 1 });
  assert.equal(blocked.ok, false);
  assert.match(blocked.reason, /Rite-Binding Lv\.25/);

  // Compile Starter Dawnkit Ember-Fox (Lv.1)
  const compiled = compileFamiliarFromPrint({ inv, prog, familiarId: 'dawnkit_ember_fox', riteBindingLevel: 1 });
  assert.equal(compiled.ok, true);
  assert.equal(prog.familiars.activeId, 'dawnkit_ember_fox');
  assert.deepEqual(prog.familiars.unlockedIds, ['dawnkit_ember_fox']);
  assert.equal(countBagItem(inv, 'echo_print_ember_fox'), 0);
  assert.equal(countBagItem(inv, 'cipher_solar'), 1);

  const foxBonuses = computeFamiliarBonuses('dawnkit_ember_fox');
  assert.equal(foxBonuses.maxHp, 8);
  assert.equal(foxBonuses.lanternRadius, 38);
  assert.equal(calcMaxHp(prog, {}, 'solari_vanguard'), baseHp + 8);

  // Switch to Chrono-Prism Sprite -> castSpeedPct & resonance wiring
  prog.familiars.activeId = 'chrono_prism_sprite';
  assert.ok(calcCastSpeedMult(prog, {}) < 1);
  assert.ok(getEquipmentStatBonuses({}, 'solari_vanguard', prog).resonance >= 2);

  // Switch to Shattered Pyre-Drake -> critDamagePct & power/bastion wiring
  prog.familiars.activeId = 'shattered_pyre_drake';
  assert.ok(calcCritDamageMult(prog) > 1.75);
  assert.ok(getEquipmentStatBonuses({}, 'solari_vanguard', prog).power >= 2);
});

test('Mob loot drops can include Echo-Print blueprints cleanly', () => {
  let sawEchoPrint = false;
  for (let i = 0; i < 60; i += 1) {
    const drops = rollMobLootDrops({
      roomType: ROOM_TYPES.SOLARI_PLAINS,
      ent: { id: 'boss_1', sub: '★ Lv.32 Solar Boss', isBoss: true },
      getBossSetDrop: () => 'solar_platebody',
      getBossAccessoryDrop: () => 'ring_of_the_sun',
      getKeystoneDrop: () => 'keystone_solari_2',
      getZoneMaterialDrop: () => 'sun_copper_ore',
    });
    if (drops.some((d) => String(d.itemId || '').startsWith('echo_print_'))) {
      sawEchoPrint = true;
      break;
    }
  }
  assert.equal(sawEchoPrint, true, 'Expected at least one Echo-Print drop from boss rolls');
});

test('AccountsStore Herald Postbox delivers starter parcel, offline mail parcels, claims, and deletes', async () => {
  const accounts = new AccountsStore();
  try {
    const { account: alice } = accounts.createGuestAccount({
      preferredName: 'AliceSun',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
    const { account: bob } = accounts.createGuestAccount({
      preferredName: 'BobMoss',
      faction: 'Terra',
      classId: 'terra_warden',
    });

    // Starter welcome mail present on initialized mailbox
    const aliceMb = accounts.getMailbox(alice.id);
    assert.equal(aliceMb.mailbox.length, 1);
    assert.equal(aliceMb.unreadCount, 1);
    assert.equal(aliceMb.mailbox[0].kind, 'system_welcome');
    assert.ok(aliceMb.mailbox[0].items.some((it) => it.id === 'echo_print_ember_fox'));

    // Claim welcome parcel
    const claimWelcome = accounts.claimMailParcel(alice.id, aliceMb.mailbox[0].id);
    assert.equal(claimWelcome.ok, true);
    assert.ok(countBagItem(alice.inventory, 'echo_print_ember_fox') >= 1);
    assert.ok(countBagItem(alice.inventory, 'cipher_solar') >= 2);

    // Give Alice extra Solar Gold + material to mail Bob while Bob is completely offline
    accounts.addItemToInventory(alice.id, 'solar_gold', 250);
    accounts.addItemToInventory(alice.id, 'sun_copper_ore', 5);
    const goldBefore = countBagItem(alice.inventory, 'solar_gold');

    const sendRes = await accounts.sendMailParcel({
      senderAccountId: alice.id,
      recipientName: 'BobMoss',
      subject: 'Ore Shipment',
      body: 'Here are 3 copper ores & 40 gold for our Cradle!',
      attachGold: 40,
      attachItemId: 'sun_copper_ore',
      attachItemQty: 3,
    });
    assert.equal(sendRes.ok, true);
    assert.equal(sendRes.postagePaid, MAIL_POSTAGE_GOLD);
    assert.equal(countBagItem(alice.inventory, 'solar_gold'), goldBefore - 40 - MAIL_POSTAGE_GOLD);
    assert.equal(countBagItem(alice.inventory, 'sun_copper_ore'), 2);

    // Bob opens his Herald Postbox later & claims the shipment
    const bobMb = accounts.getMailbox(bob.id);
    const shipment = bobMb.mailbox.find((m) => m.subject === 'Ore Shipment');
    assert.ok(shipment);
    assert.equal(shipment.gold, 40);
    assert.deepEqual(shipment.items, [{ id: 'sun_copper_ore', qty: 3 }]);

    const bobGoldBefore = countBagItem(bob.inventory, 'solar_gold');
    const claimShip = accounts.claimMailParcel(bob.id, shipment.id);
    assert.equal(claimShip.ok, true);
    assert.equal(countBagItem(bob.inventory, 'solar_gold'), bobGoldBefore + 40);
    assert.equal(countBagItem(bob.inventory, 'sun_copper_ore'), 3);

    const delRes = accounts.deleteMailParcel(bob.id, shipment.id);
    assert.equal(delRes.ok, true);
    assert.equal(delRes.mailbox.some((m) => m.id === shipment.id), false);
  } finally {
    cleanupStore(accounts);
  }
});

test('RoomManager handles extract_cipher, compile_familiar, set_active_familiar, and mail_* packets with activeFamiliarId snapshots', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-p3-'));
  const accounts = new AccountsStore();
  let rooms;
  try {
    const exchange = new ExchangeManager({
      accountsStore: accounts,
      getClientById: (id) => rooms?.getClientById(id) || null,
      broadcastToAll: () => {},
      dataDir: tmpDir,
    });
    rooms = new RoomManager({ accountsStore: accounts, exchangeManager: exchange });

    const { account: alice } = accounts.createGuestAccount({
      preferredName: 'SummonTester',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
    accounts.addItemToInventory(alice.id, 'raw_solar_trout', 3);
    accounts.addItemToInventory(alice.id, 'echo_print_ember_fox', 1);
    accounts.addItemToInventory(alice.id, 'solar_gold', 50);

    const wsAlice = createMockWs();
    const cAlice = rooms.attachConnection(wsAlice, alice);

    // 1. Extract Cipher via packet
    rooms.handlePacket(cAlice, { type: 'extract_cipher', itemId: 'raw_solar_trout', count: 2 });
    assert.ok(countBagItem(alice.inventory, 'cipher_solar') >= 4);
    assert.ok((cAlice.prog.professions.resonance_extraction?.xp || 0) > 0);

    // 2. Compile Familiar via packet
    rooms.handlePacket(cAlice, { type: 'compile_familiar', familiarId: 'dawnkit_ember_fox' });
    assert.equal(cAlice.prog.familiars.activeId, 'dawnkit_ember_fox');
    assert.ok(cAlice.prog.familiars.unlockedIds.includes('dawnkit_ember_fox'));
    assert.ok((cAlice.prog.professions.rite_binding?.xp || 0) > 0);

    // Snapshot includes activeFamiliarId so nearby players see the walking familiar
    const room = rooms.rooms.get(cAlice.roomId);
    const snap = rooms.buildSnapshot(room);
    const aliceSnap = snap.players.find((p) => p.id === cAlice.id);
    assert.equal(aliceSnap?.activeFamiliarId, 'dawnkit_ember_fox');

    // 3. Dismiss & re-summon familiar
    rooms.handlePacket(cAlice, { type: 'set_active_familiar', familiarId: null });
    assert.equal(cAlice.prog.familiars.activeId, null);
    rooms.handlePacket(cAlice, { type: 'set_active_familiar', familiarId: 'dawnkit_ember_fox' });
    assert.equal(cAlice.prog.familiars.activeId, 'dawnkit_ember_fox');

    // 4. Online recipient receives live mailbox_sync & Exchange offline sale dispatches Herald Post receipt
    const { account: offlineSeller } = accounts.createGuestAccount({
      preferredName: 'OfflineSeller',
      faction: 'Aether',
      classId: 'aether_astromancer',
    });
    accounts.addItemToInventory(offlineSeller.id, 'sun_copper_ore', 2);
    const wsSeller = createMockWs();
    const cSeller = rooms.attachConnection(wsSeller, offlineSeller);
    exchange.handlePlaceOrder(cSeller, { slot: 1, itemId: 'sun_copper_ore', mode: 'SELL', qty: 1, unitPrice: 25 });
    // Disconnect seller, then Alice buys from Exchange -> offlineSeller receives AetherSwap Herald Post receipt
    rooms.removeClient(cSeller);

    exchange.handlePlaceOrder(cAlice, { slot: 1, itemId: 'sun_copper_ore', mode: 'BUY', qty: 1, unitPrice: 25 });
    const sellerMb = accounts.getMailbox(offlineSeller.id);
    assert.ok(
      sellerMb.mailbox.some((m) => m.kind === 'exchange_receipt' && m.subject.includes('Sale Matched') && m.fromName.includes('AetherSwap')),
      'Offline seller should receive automated AetherSwap Herald Post receipt'
    );

    // Mail list / send / claim / delete packets
    wsAlice.sent.length = 0;
    rooms.handlePacket(cAlice, { type: 'mail_list' });
    assert.ok(wsAlice.sent.some((m) => m.type === 'mailbox_sync'));

    rooms.handlePacket(cAlice, {
      type: 'mail_send',
      to: 'SummonTester',
      subject: 'Self Test',
      body: 'Testing mail packet roundtrip.',
      gold: 10,
    });
    await new Promise((r) => setTimeout(r, 25));
    assert.ok(wsAlice.sent.some((m) => m.type === 'mail_action_res' && m.ok && m.action === 'send'));

    const selfParcel = accounts.getMailbox(alice.id).mailbox.find((m) => m.subject === 'Self Test');
    assert.ok(selfParcel);
    rooms.handlePacket(cAlice, { type: 'mail_claim', mailId: selfParcel.id });
    assert.ok(wsAlice.sent.some((m) => m.type === 'mail_action_res' && m.ok && m.action === 'claim'));
    rooms.handlePacket(cAlice, { type: 'mail_delete', mailId: selfParcel.id });
    assert.ok(wsAlice.sent.some((m) => m.type === 'mail_action_res' && m.ok && m.action === 'delete'));
  } finally {
    rooms?.stop();
    cleanupStore(accounts);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Client UI & world maps integrate Construct Cradles, Herald Postboxes, and zero I18N modules', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const gameJs = fs.readFileSync('client/game.js', 'utf8');
  const uiJs = fs.readFileSync('client/game/summonerAndMailUi.js', 'utf8');
  const propSpritesJs = fs.readFileSync('client/sprites/propSprites.js', 'utf8');
  const famSpritesJs = fs.readFileSync('client/sprites/familiarSprites.js', 'utf8');

  assert.match(indexHtml, /id="echo-cradle-modal"/);
  assert.match(indexHtml, /id="mail-modal"/);
  assert.match(indexHtml, /id="mail-unread-pip"/);

  assert.match(gameJs, /heraldPostbox/);
  assert.match(gameJs, /x:\s*72,\s*y:\s*-96,\s*label:\s*'📬 Aether Herald Postbox/);
  assert.ok(gameJs.includes('targetY = hit.renderY - minYGap'), 'Overhead badges must lift upward instead of colliding onto nearby sprites');
  assert.match(gameJs, /constructCradle/);
  assert.match(gameJs, /echo_extractor/);
  assert.match(gameJs, /pushFamiliarRenderable/);
  assert.match(gameJs, /mailbox_sync/);
  assert.match(gameJs, /mail_action_res/);

  assert.match(uiJs, /renderEchoCradleModal/);
  assert.match(uiJs, /renderMailModal/);
  assert.match(propSpritesJs, /heraldPostbox/);
  assert.match(propSpritesJs, /constructCradle/);
  assert.match(famSpritesJs, /familiarPyreDrake/);

  // Explicit user requirement: "Do not do I18N"
  assert.equal(fs.existsSync('shared/i18n.js'), false);
  assert.equal(fs.existsSync('client/i18n.js'), false);
});
