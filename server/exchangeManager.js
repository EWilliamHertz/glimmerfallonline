// ==========================================
// AetherSwap Continental Exchange — Authoritative Order Book & Matching Engine
// ==========================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { EQUIPMENT_CATALOG } from '../shared/protocol.js';

export const EXCHANGE_TARIFF_RATE = 0.02; // 2% trade tariff on completed sales
export const MAX_OFFER_SLOTS = 8;

export class ExchangeManager {
  constructor({ accountsStore, getClientById, broadcastToAll, dataDir, db = null }) {
    this.accounts = accountsStore;
    this.getClientById = getClientById;
    this.broadcastToAll = broadcastToAll;
    this.dataDir = dataDir || path.resolve('server/data');
    this.filePath = path.join(this.dataDir, 'exchange_orders.json');
    this.db = db || accountsStore?.db || null;

    // orderId -> OrderRecord
    this.orders = new Map();
    // playerId -> Set<orderId>
    this.playerOrders = new Map();
    // Recent matched trades ring buffer (also mirrored to PostgreSQL when connected)
    this.recentTrades = [];
    this._dirtyOrderIds = new Set();
    this._deletedOrderIds = new Set();
    this._pendingTrades = [];
    this._dbFlushPromise = null;

    this.init();
  }

  async initAsync(dbPool = null) {
    const db = dbPool || this.db || this.accounts?.db || null;
    if (!db) return false;
    this.db = db;
    try {
      const res = await this.db.query(
        'SELECT * FROM glimmerfall_exchange_orders WHERE collected = FALSE ORDER BY created_at ASC'
      );
      if (res.rows.length > 0) {
        this.orders.clear();
        this.playerOrders.clear();
        for (const r of res.rows) {
          const o = {
            orderId: r.order_id,
            playerId: r.player_id,
            playerName: r.player_name || '',
            slot: Number(r.slot),
            mode: r.mode,
            itemId: r.item_id,
            qty: Number(r.qty),
            filledQty: Number(r.filled_qty || 0),
            unitPrice: Number(r.unit_price),
            totalPrice: Number(r.total_price),
            progress: Number(r.progress || 0),
            completed: Boolean(r.completed),
            collected: Boolean(r.collected),
            escrowGold: Number(r.escrow_gold || 0),
            escrowItems: Number(r.escrow_items || 0),
            payoutGold: Number(r.payout_gold || 0),
            payoutItems: Number(r.payout_items || 0),
            createdAt: Number(r.created_at),
            updatedAt: Number(r.updated_at),
          };
          this.orders.set(o.orderId, o);
          if (!this.playerOrders.has(o.playerId)) {
            this.playerOrders.set(o.playerId, new Set());
          }
          this.playerOrders.get(o.playerId).add(o.orderId);
        }
        this.seedAllianceLiquidity();
      } else {
        for (const o of this.orders.values()) {
          this._dirtyOrderIds.add(o.orderId);
        }
        await this.flush();
      }
      const trRes = await this.db.query(
        'SELECT item_id, match_price, match_qty, traded_at FROM glimmerfall_exchange_trades ORDER BY traded_at DESC LIMIT 250'
      );
      this.recentTrades = trRes.rows.map((r) => ({
        itemId: r.item_id,
        price: Number(r.match_price),
        qty: Number(r.match_qty),
        tradedAt: new Date(r.traded_at).toISOString(),
      })).reverse();
      return true;
    } catch (err) {
      console.warn('[AetherSwap] Failed to load exchange orders from PostgreSQL:', err.message);
      return false;
    }
  }

  init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const o of parsed) {
            this.orders.set(o.orderId, o);
            if (!this.playerOrders.has(o.playerId)) {
              this.playerOrders.set(o.playerId, new Set());
            }
            this.playerOrders.get(o.playerId).add(o.orderId);
          }
        }
      }
    } catch (err) {
      console.warn('[AetherSwap] Failed to load exchange orders file:', err.message);
    }

    this.seedAllianceLiquidity();
  }

  save() {
    try {
      const list = Array.from(this.orders.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.warn('[AetherSwap] Failed to persist exchange orders:', err.message);
    }
    if (this.db) {
      this.flush().catch((err) => {
        console.warn('[AetherSwap] PostgreSQL sync error:', err.message);
      });
    }
  }

  markOrderDirty(orderId) {
    if (!orderId) return;
    this._deletedOrderIds.delete(orderId);
    this._dirtyOrderIds.add(orderId);
  }

  markOrderDeleted(orderId) {
    if (!orderId) return;
    this._dirtyOrderIds.delete(orderId);
    this._deletedOrderIds.add(orderId);
  }

  async flush() {
    if (!this.db) return;
    const run = async () => {
      const upserts = Array.from(this._dirtyOrderIds);
      const deletes = Array.from(this._deletedOrderIds);
      const trades = this._pendingTrades.splice(0, this._pendingTrades.length);
      this._dirtyOrderIds.clear();
      this._deletedOrderIds.clear();

      for (const orderId of upserts) {
        const o = this.orders.get(orderId);
        if (!o) continue;
        await this.db.query(
          `INSERT INTO glimmerfall_exchange_orders (
            order_id, player_id, player_name, slot, mode, item_id, qty, filled_qty,
            unit_price, total_price, progress, completed, collected, escrow_gold,
            escrow_items, payout_gold, payout_items, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          ON CONFLICT (order_id) DO UPDATE SET
            filled_qty = EXCLUDED.filled_qty,
            progress = EXCLUDED.progress,
            completed = EXCLUDED.completed,
            collected = EXCLUDED.collected,
            escrow_gold = EXCLUDED.escrow_gold,
            escrow_items = EXCLUDED.escrow_items,
            payout_gold = EXCLUDED.payout_gold,
            payout_items = EXCLUDED.payout_items,
            updated_at = EXCLUDED.updated_at`,
          [
            o.orderId, o.playerId, o.playerName || '', o.slot, o.mode, o.itemId, o.qty, o.filledQty || 0,
            o.unitPrice, o.totalPrice, o.progress || 0, Boolean(o.completed), Boolean(o.collected),
            o.escrowGold || 0, o.escrowItems || 0, o.payoutGold || 0, o.payoutItems || 0,
            o.createdAt, o.updatedAt,
          ]
        );
      }

      if (deletes.length > 0) {
        await this.db.query('DELETE FROM glimmerfall_exchange_orders WHERE order_id = ANY($1::text[])', [deletes]);
      }

      for (const tr of trades) {
        await this.db.query(
          `INSERT INTO glimmerfall_exchange_trades (item_id, match_price, match_qty, gross_gold, tariff, buyer_id, seller_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [tr.itemId, tr.matchPrice, tr.matchQty, tr.grossGold, tr.tariff, tr.buyerId, tr.sellerId]
        );
      }
    };

    const prev = this._dbFlushPromise;
    const next = prev ? prev.catch(() => {}).then(run) : run();
    this._dbFlushPromise = next;
    try {
      await next;
    } finally {
      if (this._dbFlushPromise === next) this._dbFlushPromise = null;
    }
  }

  getItemPriceHistory(itemId, limit = 25) {
    const cleanId = String(itemId || '').trim();
    const list = cleanId ? this.recentTrades.filter((t) => t.itemId === cleanId) : this.recentTrades;
    return list.slice(-Math.max(1, Math.min(100, limit)));
  }

  seedAllianceLiquidity() {
    // If no resting sell orders for core consumables and ores exist, seed a small baseline
    const alliancePlayerId = 'alliance_depot_arbiter';
    const seeds = [
      { itemId: 'minor_healing_salve', qty: 25, unitPrice: 12 },
      { itemId: 'glimmer_draught', qty: 20, unitPrice: 14 },
      { itemId: 'sweet_apple', qty: 50, unitPrice: 3 },
      { itemId: 'iron_ore', qty: 40, unitPrice: 6 },
      { itemId: 'bronze_bar', qty: 20, unitPrice: 15 },
      { itemId: 'iron_broadsword', qty: 8, unitPrice: 45 },
    ];

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const existing = Array.from(this.orders.values()).find(
        (o) => o.playerId === alliancePlayerId && o.itemId === s.itemId && !o.completed && o.mode === 'SELL'
      );
      if (!existing) {
        const orderId = `seed_${s.itemId}_${i + 1}`;
        const order = {
          orderId,
          playerId: alliancePlayerId,
          playerName: 'Astral Commerce Alliance',
          slot: i + 1,
          mode: 'SELL',
          itemId: s.itemId,
          qty: s.qty,
          filledQty: 0,
          unitPrice: s.unitPrice,
          totalPrice: s.qty * s.unitPrice,
          progress: 0,
          completed: false,
          collected: false,
          escrowGold: 0,
          escrowItems: s.qty,
          payoutGold: 0,
          payoutItems: 0,
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now(),
        };
        this.orders.set(orderId, order);
        if (!this.playerOrders.has(alliancePlayerId)) {
          this.playerOrders.set(alliancePlayerId, new Set());
        }
        this.playerOrders.get(alliancePlayerId).add(orderId);
      }
    }
  }

  getPlayerSlotOrders(playerId) {
    const slots = [];
    for (let s = 1; s <= MAX_OFFER_SLOTS; s++) {
      slots.push({
        slot: s,
        type: null,
        itemId: null,
        qty: 0,
        filledQty: 0,
        unitPrice: 0,
        totalPrice: 0,
        progress: 0,
        completed: false,
        orderId: null,
        payoutGold: 0,
        payoutItems: 0,
      });
    }

    const oIds = this.playerOrders.get(playerId);
    if (oIds) {
      for (const id of oIds) {
        const o = this.orders.get(id);
        if (!o || o.collected) continue;
        if (o.slot >= 1 && o.slot <= MAX_OFFER_SLOTS) {
          slots[o.slot - 1] = {
            slot: o.slot,
            type: o.mode,
            itemId: o.itemId,
            qty: o.qty,
            filledQty: o.filledQty,
            unitPrice: o.unitPrice,
            totalPrice: o.totalPrice,
            progress: o.progress,
            completed: o.completed,
            orderId: o.orderId,
            payoutGold: o.payoutGold,
            payoutItems: o.payoutItems,
            createdAt: o.createdAt,
          };
        }
      }
    }
    return slots;
  }

  handleOpen(client) {
    if (!client) return;
    this.syncClient(client);
  }

  syncClient(client) {
    if (!client) return;
    const offers = this.getPlayerSlotOrders(client.id);
    client.send({
      type: 'exchange_sync',
      offers,
      ts: Date.now(),
    });
  }

  handlePlaceOrder(client, msg) {
    if (!client) return;
    const mode = String(msg.mode || '').toUpperCase();
    if (mode !== 'BUY' && mode !== 'SELL') {
      client.send({ type: 'sys_msg', category: 'trade', text: '❌ Invalid exchange order mode.' });
      return;
    }

    const slot = Math.max(1, Math.min(MAX_OFFER_SLOTS, Number(msg.slot) || 1));
    const itemId = String(msg.itemId || '').trim();
    const qty = Math.max(1, Math.min(999, Math.floor(Number(msg.qty) || 1)));
    const unitPrice = Math.max(1, Math.floor(Number(msg.unitPrice) || 1));
    const itemDef = EQUIPMENT_CATALOG[itemId];

    if (!itemDef && itemId !== 'solar_gold') {
      client.send({ type: 'sys_msg', category: 'trade', text: '❌ Unknown item catalog spec.' });
      return;
    }

    // Verify slot is currently empty
    const currentOrders = this.getPlayerSlotOrders(client.id);
    const existing = currentOrders[slot - 1];
    if (existing && existing.type) {
      client.send({ type: 'sys_msg', category: 'trade', text: `❌ Slot #${slot} already has an active offer.` });
      return;
    }

    const totalCost = qty * unitPrice;
    const profile = this.accounts.getProfile(client.id);
    if (!profile) return;

    if (mode === 'BUY') {
      // Validate gold
      const currentGold = this.getPlayerGold(profile);
      if (currentGold < totalCost) {
        client.send({
          type: 'sys_msg',
          category: 'trade',
          text: `❌ Insufficient Solar Gold Sovereigns (Need ${totalCost} 🪙, Have ${currentGold} 🪙)!`,
        });
        return;
      }
      this.deductPlayerGold(profile, totalCost);
    } else {
      // Validate item in inventory
      const inBag = this.countItemInBackpack(profile, itemId);
      if (inBag < qty) {
        client.send({
          type: 'sys_msg',
          category: 'trade',
          text: `❌ Insufficient items in backpack (Need ${qty}, Have ${inBag})!`,
        });
        return;
      }
      this.removeItemFromBackpack(profile, itemId, qty);
    }

    // Persist account inventory changes
    this.accounts.updateProfile(client.id, {
      inventory: profile.inventory,
      gold: profile.gold,
    });
    const refreshed = this.accounts.getProfile(client.id);
    client.send({ type: 'profile_updated', profile: refreshed });

    const orderId = `ge_${crypto.randomUUID().slice(0, 8)}`;
    const order = {
      orderId,
      playerId: client.id,
      playerName: client.displayName,
      slot,
      mode,
      itemId,
      qty,
      filledQty: 0,
      unitPrice,
      totalPrice: totalCost,
      progress: 0,
      completed: false,
      collected: false,
      escrowGold: mode === 'BUY' ? totalCost : 0,
      escrowItems: mode === 'SELL' ? qty : 0,
      payoutGold: 0,
      payoutItems: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.orders.set(orderId, order);
    this.markOrderDirty(orderId);
    if (!this.playerOrders.has(client.id)) {
      this.playerOrders.set(client.id, new Set());
    }
    this.playerOrders.get(client.id).add(orderId);

    // Run order matching
    this.matchOrders(itemId);
    this.save();
    this.syncClient(client);

    const verb = mode === 'BUY' ? 'Buy Offer' : 'Sell Offer';
    client.send({
      type: 'sys_msg',
      category: 'trade',
      text: `🌀 [AetherSwap] Placed ${verb} in Slot #${slot}: ${qty}x ${itemDef?.name || itemId} @ ${unitPrice} 🪙 each.`,
    });
  }

  matchOrders(itemId) {
    if (!itemId) return;

    // Collect active unfilled BUY and SELL orders for itemId
    const buyOrders = [];
    const sellOrders = [];

    for (const o of this.orders.values()) {
      if (o.itemId !== itemId || o.completed) continue;
      if (o.mode === 'BUY') buyOrders.push(o);
      else if (o.mode === 'SELL') sellOrders.push(o);
    }

    // Buy orders sorted by unitPrice DESC, then createdAt ASC
    buyOrders.sort((a, b) => {
      if (b.unitPrice !== a.unitPrice) return b.unitPrice - a.unitPrice;
      return a.createdAt - b.createdAt;
    });

    // Sell orders sorted by unitPrice ASC, then createdAt ASC
    sellOrders.sort((a, b) => {
      if (a.unitPrice !== b.unitPrice) return a.unitPrice - b.unitPrice;
      return a.createdAt - b.createdAt;
    });

    let matched = false;

    for (const buy of buyOrders) {
      if (buy.completed) continue;

      for (const sell of sellOrders) {
        if (sell.completed) continue;
        if (buy.playerId === sell.playerId) continue; // No self-trading
        if (buy.unitPrice < sell.unitPrice) break; // No price overlap

        // Match price is resting order price (or seller's price)
        const matchPrice = sell.createdAt <= buy.createdAt ? sell.unitPrice : buy.unitPrice;
        const buyRemaining = buy.qty - buy.filledQty;
        const sellRemaining = sell.qty - sell.filledQty;
        const matchQty = Math.min(buyRemaining, sellRemaining);

        if (matchQty <= 0) continue;

        // Trade execution
        const grossGold = matchQty * matchPrice;
        const tariff = Math.floor(grossGold * EXCHANGE_TARIFF_RATE);
        const netGold = grossGold - tariff;

        // Update Buyer
        buy.filledQty += matchQty;
        buy.payoutItems += matchQty;
        buy.progress = Math.min(100, Math.floor((buy.filledQty / buy.qty) * 100));
        buy.updatedAt = Date.now();
        // Excess escrow refund (if buyer paid higher unitPrice than matchPrice)
        const escrowSpent = matchQty * buy.unitPrice;
        const actualCost = matchQty * matchPrice;
        const excessEscrow = escrowSpent - actualCost;
        if (excessEscrow > 0) {
          buy.payoutGold += excessEscrow;
        }
        buy.escrowGold = Math.max(0, buy.escrowGold - escrowSpent);

        if (buy.filledQty >= buy.qty) {
          buy.completed = true;
          buy.progress = 100;
        }

        // Update Seller
        sell.filledQty += matchQty;
        sell.payoutGold += netGold;
        sell.escrowItems = Math.max(0, sell.escrowItems - matchQty);
        sell.progress = Math.min(100, Math.floor((sell.filledQty / sell.qty) * 100));
        sell.updatedAt = Date.now();

        if (sell.filledQty >= sell.qty) {
          sell.completed = true;
          sell.progress = 100;
        }

        this.markOrderDirty(buy.orderId);
        this.markOrderDirty(sell.orderId);
        this.recentTrades.push({
          itemId,
          price: matchPrice,
          qty: matchQty,
          tradedAt: new Date().toISOString(),
        });
        if (this.recentTrades.length > 500) {
          this.recentTrades.splice(0, this.recentTrades.length - 500);
        }
        this._pendingTrades.push({
          itemId,
          matchPrice,
          matchQty,
          grossGold,
          tariff,
          buyerId: buy.playerId,
          sellerId: sell.playerId,
        });

        matched = true;

        // Notify Buyer if online
        const buyerClient = this.getClientById?.(buy.playerId);
        if (buyerClient) {
          this.syncClient(buyerClient);
          buyerClient.send({
            type: 'sys_msg',
            category: 'trade',
            text: `✨ [AetherSwap] Buy Offer in Slot #${buy.slot} matched! +${matchQty}x ${EQUIPMENT_CATALOG[itemId]?.name || itemId} ready for collection.`,
          });
        }

        // Notify Seller (and dispatch Herald Post offline receipt)
        const sellerClient = this.getClientById?.(sell.playerId);
        const itemLabel = EQUIPMENT_CATALOG[itemId]?.name || itemId;
        if (sell.playerId !== 'alliance_depot_arbiter' && typeof this.accounts?.deliverSystemMail === 'function') {
          this.accounts.deliverSystemMail(sell.playerId, {
            fromName: 'AetherSwap Clearinghouse',
            subject: `Sale Matched: ${matchQty}x ${itemLabel}`,
            body: `Your AetherSwap Sell Offer in Slot #${sell.slot} sold ${matchQty}x ${itemLabel} @ ${matchPrice} Gold each. Net payout after 2% tariff (${tariff}g): ${netGold} Gold — ready to collect from Exchange Broker Silvius!`,
            gold: 0,
            items: [],
            kind: 'exchange_receipt',
          });
          if (sellerClient && typeof this.accounts.getMailbox === 'function') {
            sellerClient.send({ type: 'mailbox_sync', ...this.accounts.getMailbox(sell.playerId) });
          }
        }
        if (sellerClient) {
          this.syncClient(sellerClient);
          sellerClient.send({
            type: 'sys_msg',
            category: 'trade',
            text: `🪙 [AetherSwap] Sell Offer in Slot #${sell.slot} matched! +${netGold} 🪙 ready for collection (2% tariff: ${tariff} 🪙).`,
          });
        }

        if (buy.completed) break;
      }
    }

    if (matched) {
      this.save();
    }
  }

  handleCollect(client, slot) {
    if (!client) return;
    const targetSlot = Number(slot);
    const oIds = this.playerOrders.get(client.id);
    if (!oIds) return;

    let targetOrder = null;
    for (const id of oIds) {
      const o = this.orders.get(id);
      if (o && o.slot === targetSlot && !o.collected) {
        targetOrder = o;
        break;
      }
    }

    if (!targetOrder) {
      client.send({ type: 'sys_msg', category: 'trade', text: `❌ No offer found in Slot #${targetSlot}.` });
      return;
    }

    if (targetOrder.payoutItems <= 0 && targetOrder.payoutGold <= 0) {
      client.send({ type: 'sys_msg', category: 'trade', text: `❌ Slot #${targetSlot} has nothing to collect yet.` });
      return;
    }

    const profile = this.accounts.getProfile(client.id);
    if (!profile) return;

    const itemDef = EQUIPMENT_CATALOG[targetOrder.itemId];

    // If there are payout items to collect
    if (targetOrder.payoutItems > 0) {
      const added = this.addItemToBackpack(profile, targetOrder.itemId, targetOrder.payoutItems);
      if (!added) {
        client.send({
          type: 'sys_msg',
          category: 'trade',
          text: '🎒 Backpack full! Clear space before collecting items from AetherSwap.',
        });
        return;
      }
      client.send({
        type: 'sys_msg',
        category: 'trade',
        text: `📦 Collected ${targetOrder.payoutItems}x ${itemDef?.name || targetOrder.itemId} from Slot #${targetSlot}!`,
      });
      targetOrder.payoutItems = 0;
    }

    // If there is payout gold to collect
    if (targetOrder.payoutGold > 0) {
      this.addPlayerGold(profile, targetOrder.payoutGold);
      client.send({
        type: 'sys_msg',
        category: 'trade',
        text: `🪙 Collected ${targetOrder.payoutGold} Solar Gold Sovereigns from Slot #${targetSlot}!`,
      });
      targetOrder.payoutGold = 0;
    }

    if (targetOrder.completed) {
      targetOrder.collected = true;
      this.orders.delete(targetOrder.orderId);
      this.playerOrders.get(client.id)?.delete(targetOrder.orderId);
      this.markOrderDeleted(targetOrder.orderId);
    } else {
      this.markOrderDirty(targetOrder.orderId);
    }

    this.accounts.updateProfile(client.id, {
      inventory: profile.inventory,
      gold: profile.gold,
    });
    const refreshed = this.accounts.getProfile(client.id);
    client.send({ type: 'profile_updated', profile: refreshed });

    this.save();
    this.syncClient(client);
  }

  handleAbort(client, slot) {
    if (!client) return;
    const targetSlot = Number(slot);
    const oIds = this.playerOrders.get(client.id);
    if (!oIds) return;

    let targetOrder = null;
    for (const id of oIds) {
      const o = this.orders.get(id);
      if (o && o.slot === targetSlot && !o.collected) {
        targetOrder = o;
        break;
      }
    }

    if (!targetOrder) return;

    const profile = this.accounts.getProfile(client.id);
    if (!profile) return;

    const itemDef = EQUIPMENT_CATALOG[targetOrder.itemId];

    // Refund remaining escrow
    if (targetOrder.mode === 'BUY') {
      const refundGold = targetOrder.escrowGold + targetOrder.payoutGold;
      if (refundGold > 0) {
        this.addPlayerGold(profile, refundGold);
        client.send({
          type: 'sys_msg',
          category: 'trade',
          text: `🌀 Aborted Buy Offer #${targetSlot}. Refunded ${refundGold} Solar Gold Sovereigns.`,
        });
      }
      if (targetOrder.payoutItems > 0) {
        this.addItemToBackpack(profile, targetOrder.itemId, targetOrder.payoutItems);
      }
    } else {
      const remainingItems = targetOrder.escrowItems;
      if (remainingItems > 0) {
        this.addItemToBackpack(profile, targetOrder.itemId, remainingItems);
        client.send({
          type: 'sys_msg',
          category: 'trade',
          text: `🌀 Aborted Sell Offer #${targetSlot}. Returned ${remainingItems}x ${itemDef?.name || targetOrder.itemId} to backpack.`,
        });
      }
      if (targetOrder.payoutGold > 0) {
        this.addPlayerGold(profile, targetOrder.payoutGold);
      }
    }

    targetOrder.collected = true;
    this.orders.delete(targetOrder.orderId);
    this.playerOrders.get(client.id)?.delete(targetOrder.orderId);
    this.markOrderDeleted(targetOrder.orderId);

    this.accounts.updateProfile(client.id, {
      inventory: profile.inventory,
      gold: profile.gold,
    });
    const refreshed = this.accounts.getProfile(client.id);
    client.send({ type: 'profile_updated', profile: refreshed });

    this.save();
    this.syncClient(client);
  }

  // Inventory & Currency Helpers
  getPlayerGold(profile) {
    let total = 0;
    if (profile.gold && typeof profile.gold === 'number') {
      total += profile.gold;
    }
    for (const it of (profile?.inventory || [])) {
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === 'solar_gold') {
        total += typeof it === 'object' && it.qty ? it.qty : 1;
      }
    }
    return total;
  }

  deductPlayerGold(profile, amount) {
    let needed = amount;
    if (!profile.inventory) profile.inventory = [];
    for (let i = profile.inventory.length - 1; i >= 0; i--) {
      const it = profile.inventory[i];
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === 'solar_gold') {
        const currentQty = typeof it === 'object' && it.qty ? it.qty : 1;
        if (currentQty <= needed) {
          needed -= currentQty;
          profile.inventory.splice(i, 1);
        } else {
          it.qty -= needed;
          needed = 0;
          break;
        }
      }
    }
    if (needed > 0 && profile.gold) {
      profile.gold = Math.max(0, profile.gold - needed);
    }
  }

  addPlayerGold(profile, amount) {
    if (amount <= 0) return;
    if (!profile.inventory) profile.inventory = [];
    const existing = profile.inventory.find((it) => (typeof it === 'object' ? it.id : it) === 'solar_gold');
    if (existing && typeof existing === 'object') {
      existing.qty = (existing.qty || 1) + amount;
    } else {
      if (profile.inventory.length < 28) {
        profile.inventory.push({ id: 'solar_gold', qty: amount });
      } else {
        profile.gold = (profile.gold || 0) + amount;
      }
    }
  }

  addItemToBackpack(profile, itemId, qty = 1) {
    if (!profile.inventory) profile.inventory = [];
    const existing = profile.inventory.find((it) => (typeof it === 'object' ? it.id : it) === itemId);
    if (existing) {
      if (typeof existing === 'string') {
        const idx = profile.inventory.indexOf(existing);
        profile.inventory[idx] = { id: itemId, qty: 1 + qty };
      } else {
        existing.qty = (existing.qty || 1) + qty;
      }
      return true;
    }
    if (profile.inventory.length >= 28) return false;
    profile.inventory.push({ id: itemId, qty });
    return true;
  }

  removeItemFromBackpack(profile, itemId, qty = 1) {
    if (!profile.inventory) return false;
    let remaining = qty;
    for (let i = profile.inventory.length - 1; i >= 0; i--) {
      const it = profile.inventory[i];
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === itemId) {
        const currentQty = typeof it === 'object' && it.qty ? it.qty : 1;
        if (currentQty <= remaining) {
          remaining -= currentQty;
          profile.inventory.splice(i, 1);
        } else {
          it.qty -= remaining;
          remaining = 0;
        }
        if (remaining <= 0) return true;
      }
    }
    return remaining <= 0;
  }

  countItemInBackpack(profile, itemId) {
    let count = 0;
    for (const it of (profile?.inventory || [])) {
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      const qty = typeof it === 'object' && it.qty ? it.qty : 1;
      if (id === itemId) count += qty;
    }
    return count;
  }
}
