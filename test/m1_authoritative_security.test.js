import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getMerchantWarePrice,
  getMerchantSellPrice,
  QUEST_REWARDS_CATALOG,
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

test('Milestone 1: Authoritative bank_op, merchant pricing, quest completion & anti-spoof guards', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-m1-'));
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
      preferredName: 'VaultHero',
      faction: 'Solari',
      classId: 'solari_vanguard',
    });
    accounts.addItemToInventory(alice.id, 'solar_gold', 200);
    accounts.addItemToInventory(alice.id, 'sun_copper_ore', 5);

    const ws = createMockWs();
    const client = rooms.attachConnection(ws, alice);

    // 1. Tampered buy_merchant_item unitPrice=1 must still charge canonical price (28g for iron_broadsword)
    const goldBefore = countBagItem(alice.inventory, 'solar_gold');
    rooms.handlePacket(client, {
      type: 'buy_merchant_item',
      merchantId: 'merchant_smith',
      itemId: 'iron_broadsword',
      qty: 1,
      unitPrice: 1,
    });
    const canonPrice = getMerchantWarePrice('merchant_smith', 'iron_broadsword');
    assert.equal(canonPrice, 28);
    assert.equal(countBagItem(alice.inventory, 'solar_gold'), goldBefore - 28);
    assert.equal(countBagItem(alice.inventory, 'iron_broadsword'), 1);

    // 2. sell_merchant_item sells item for canonical 40% gold
    const swordIdx = alice.inventory.findIndex((it) => it.id === 'iron_broadsword');
    assert.ok(swordIdx >= 0);
    const sellPrice = getMerchantSellPrice('iron_broadsword');
    assert.ok(sellPrice > 0);
    const goldBeforeSell = countBagItem(alice.inventory, 'solar_gold');
    rooms.handlePacket(client, { type: 'sell_merchant_item', slotIndex: swordIdx, qty: 1 });
    assert.equal(countBagItem(alice.inventory, 'iron_broadsword'), 0);
    assert.equal(countBagItem(alice.inventory, 'solar_gold'), goldBeforeSell + sellPrice);

    // 3. Legacy sync_bank injection must NOT overwrite server bank/inventory
    rooms.handlePacket(client, {
      type: 'sync_bank',
      bank: [{ id: 'crown_of_dawn', qty: 99 }],
      inventory: [{ id: 'solar_gold', qty: 999999 }],
    });
    assert.equal(alice.bank.some((b) => b.id === 'crown_of_dawn'), false);
    assert.ok(countBagItem(alice.inventory, 'solar_gold') < 1000);

    // 4. Authoritative bank_op deposit, sort, quick_stack, and withdraw
    const oreIdx = alice.inventory.findIndex((it) => it.id === 'sun_copper_ore');
    rooms.handlePacket(client, { type: 'bank_op', op: 'deposit', slotIndex: oreIdx, qty: 3 });
    assert.equal(countBagItem(alice.inventory, 'sun_copper_ore'), 2);
    assert.equal(alice.bank.find((b) => b.id === 'sun_copper_ore')?.qty, 3);

    await new Promise((r) => setTimeout(r, 95));
    rooms.handlePacket(client, { type: 'bank_op', op: 'quick_stack' });
    assert.equal(countBagItem(alice.inventory, 'sun_copper_ore'), 0);
    assert.equal(alice.bank.find((b) => b.id === 'sun_copper_ore')?.qty, 5);

    await new Promise((r) => setTimeout(r, 95));
    const bankIdx = alice.bank.findIndex((b) => b.id === 'sun_copper_ore');
    rooms.handlePacket(client, { type: 'bank_op', op: 'withdraw', bankIndex: bankIdx, qty: 2 });
    assert.equal(countBagItem(alice.inventory, 'sun_copper_ore'), 2);
    assert.equal(alice.bank.find((b) => b.id === 'sun_copper_ore')?.qty, 3);

    // 5. Unowned equip_item by itemId is rejected
    rooms.handlePacket(client, { type: 'equip_item', itemId: 'crown_of_dawn' });
    assert.notEqual(alice.equipment.head, 'crown_of_dawn');

    // 6. Quest completion is authoritative and non-repeatable; sync_quest_state cannot forge completion
    rooms.handlePacket(client, {
      type: 'sync_quest_state',
      questState: { completedQuests: { quest_awakening: true } },
    });
    assert.equal(Boolean(alice.questState?.completedQuests?.quest_awakening), false);

    const goldPreQuest = countBagItem(alice.inventory, 'solar_gold');
    rooms.handlePacket(client, { type: 'complete_quest', questId: 'quest_awakening' });
    assert.equal(alice.questState?.completedQuests?.quest_awakening, true);
    assert.equal(
      countBagItem(alice.inventory, 'solar_gold'),
      goldPreQuest + QUEST_REWARDS_CATALOG.quest_awakening.rewards.gold
    );

    await new Promise((r) => setTimeout(r, 420));
    const goldAfterFirstQuest = countBagItem(alice.inventory, 'solar_gold');
    rooms.handlePacket(client, { type: 'complete_quest', questId: 'quest_awakening' });
    assert.equal(countBagItem(alice.inventory, 'solar_gold'), goldAfterFirstQuest);

    // 7. sync_profession_progress bounds huge XP spoof attempts
    rooms.handlePacket(client, {
      type: 'sync_profession_progress',
      professions: { relic_forging: { xp: 15_000_000 } },
    });
    assert.ok((client.prog.professions.relic_forging.xp || 0) <= 60);
  } finally {
    rooms?.stop();
    cleanupStore(accounts);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Milestone 1: ExchangeManager PostgreSQL persistence and price history tracking', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-m1-ex-'));
  const accounts = new AccountsStore();
  const dbLog = { queries: [] };
  const fakeDb = {
    async query(sql, params) {
      dbLog.queries.push({ sql, params });
      if (sql.startsWith('SELECT * FROM glimmerfall_exchange_orders')) return { rows: [] };
      if (sql.startsWith('SELECT item_id, match_price')) return { rows: [] };
      return { rows: [] };
    },
  };

  try {
    const exchange = new ExchangeManager({
      accountsStore: accounts,
      getClientById: () => null,
      broadcastToAll: () => {},
      dataDir: tmpDir,
      db: fakeDb,
    });
    await exchange.initAsync(fakeDb);
    assert.ok(dbLog.queries.some((q) => q.sql.includes('INSERT INTO glimmerfall_exchange_orders')));

    const { account: buyer } = accounts.createGuestAccount({
      preferredName: 'ExBuyer',
      faction: 'Aether',
      classId: 'aether_astromancer',
    });
    accounts.addItemToInventory(buyer.id, 'solar_gold', 500);
    const client = { id: buyer.id, displayName: buyer.displayName, send() {} };

    exchange.handlePlaceOrder(client, {
      slot: 1,
      itemId: 'minor_healing_salve',
      mode: 'BUY',
      qty: 2,
      unitPrice: 12,
    });
    await exchange.flush();
    const hist = exchange.getItemPriceHistory('minor_healing_salve');
    assert.equal(hist.length, 1);
    assert.equal(hist[0].price, 12);
    assert.equal(hist[0].qty, 2);
    assert.ok(dbLog.queries.some((q) => q.sql.includes('INSERT INTO glimmerfall_exchange_trades')));
  } finally {
    cleanupStore(accounts);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
