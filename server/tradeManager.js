// ==========================================
// Direct Player-to-Player Trading Manager
// ==========================================

import crypto from 'node:crypto';
import { EQUIPMENT_CATALOG } from '../shared/protocol.js';

export const MAX_TRADE_SLOTS = 8;
export const MAX_TRADE_DISTANCE_PX = 400;

export class TradeManager {
  constructor({ accountsStore, getClientById, findClientByName }) {
    this.accounts = accountsStore;
    this.getClientById = getClientById;
    this.findClientByName = findClientByName;

    // tradeId -> TradeSession
    this.trades = new Map();
    // playerId -> tradeId
    this.playerTrade = new Map();
    // inviteId -> { inviteId, senderId, senderName, targetId, expiresAt }
    this.pendingInvites = new Map();
  }

  isPlayerTrading(playerId) {
    return this.playerTrade.has(playerId);
  }

  getTrade(tradeId) {
    return this.trades.get(tradeId) || null;
  }

  getTradeForPlayer(playerId) {
    const tid = this.playerTrade.get(playerId);
    return tid ? this.trades.get(tid) || null : null;
  }

  handleRequest(sender, targetQuery) {
    if (!sender) return;
    const q = String(targetQuery || '').trim();
    if (!q) {
      sender.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] Specify a player name to trade.' });
      return;
    }

    const target = this.getClientById(q) || this.findClientByName(q);
    if (!target) {
      sender.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] Player "${q}" is not online.` });
      return;
    }

    if (target.id === sender.id) {
      sender.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] You cannot trade with yourself!' });
      return;
    }

    if (sender.isDead) {
      sender.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] You cannot trade while fallen.' });
      return;
    }

    if (target.isDead) {
      sender.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] ${target.displayName} is currently fallen.` });
      return;
    }

    if (sender.roomId !== target.roomId) {
      sender.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] ${target.displayName} is in a different zone.` });
      return;
    }

    const dist = Math.hypot(sender.x - target.x, sender.y - target.y);
    if (dist > MAX_TRADE_DISTANCE_PX) {
      sender.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] ${target.displayName} is too far away to trade.` });
      return;
    }

    if (this.isPlayerTrading(sender.id)) {
      sender.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] You are already in an active trade session.' });
      return;
    }

    if (this.isPlayerTrading(target.id)) {
      sender.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] ${target.displayName} is currently busy trading.` });
      return;
    }

    const inviteId = `tr_inv_${crypto.randomUUID().slice(0, 8)}`;
    this.pendingInvites.set(inviteId, {
      inviteId,
      senderId: sender.id,
      senderName: sender.displayName,
      targetId: target.id,
      expiresAt: Date.now() + 30000,
    });

    target.send({
      type: 'trade_incoming',
      inviteId,
      senderId: sender.id,
      senderName: sender.displayName,
    });

    sender.send({
      type: 'sys_msg',
      category: 'trade',
      text: `🤝 [Trade] Sent trade request to ${target.displayName}. Awaiting response...`,
    });
  }

  handleRespond(target, inviteId, accept) {
    if (!target) return;
    const inv = this.pendingInvites.get(inviteId);
    if (!inv || inv.targetId !== target.id) {
      target.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] Trade invitation has expired.' });
      return;
    }

    this.pendingInvites.delete(inviteId);
    const sender = this.getClientById(inv.senderId);

    if (!accept) {
      if (sender) {
        sender.send({
          type: 'sys_msg',
          category: 'trade',
          text: `🤝 [Trade] ${target.displayName} declined your trade request.`,
        });
      }
      return;
    }

    if (!sender) {
      target.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] Challenger is no longer online.' });
      return;
    }

    if (this.isPlayerTrading(sender.id) || this.isPlayerTrading(target.id)) {
      target.send({ type: 'sys_msg', category: 'trade', text: '🤝 [Trade] One of the players is already trading.' });
      return;
    }

    // Start trade session
    const tradeId = `trade_${crypto.randomUUID().slice(0, 8)}`;
    const session = {
      tradeId,
      p1: {
        id: sender.id,
        name: sender.displayName,
        items: [], // Array of { id, qty }
        gold: 0,
        accepted: false,
      },
      p2: {
        id: target.id,
        name: target.displayName,
        items: [],
        gold: 0,
        accepted: false,
      },
      createdAt: Date.now(),
    };

    this.trades.set(tradeId, session);
    this.playerTrade.set(sender.id, tradeId);
    this.playerTrade.set(target.id, tradeId);

    this.broadcastTradeState(session, 'trade_start');
  }

  handleOfferUpdate(client, rawItems, rawGold) {
    if (!client) return;
    const session = this.getTradeForPlayer(client.id);
    if (!session) return;

    const isP1 = session.p1.id === client.id;
    const party = isP1 ? session.p1 : session.p2;
    const profile = this.accounts.getProfile(client.id);
    if (!profile) return;

    // Validate and sanitize items
    const sanitizedItems = [];
    if (Array.isArray(rawItems)) {
      for (const entry of rawItems.slice(0, MAX_TRADE_SLOTS)) {
        if (!entry) continue;
        const itemId = typeof entry === 'string' ? entry : entry.id;
        const qty = Math.max(1, Math.min(999, Math.floor(Number(entry.qty) || 1)));
        if (!EQUIPMENT_CATALOG[itemId] && itemId !== 'solar_gold') continue;

        const inBag = this.countItemInBackpack(profile, itemId);
        if (inBag >= qty) {
          sanitizedItems.push({ id: itemId, qty });
        }
      }
    }

    // Validate and sanitize gold
    const goldOffer = Math.max(0, Math.floor(Number(rawGold) || 0));
    const maxGold = this.getPlayerGold(profile);
    const sanitizedGold = Math.min(maxGold, goldOffer);

    party.items = sanitizedItems;
    party.gold = sanitizedGold;

    // ANTI-SCAM: ANY offer modification resets acceptance for BOTH parties
    session.p1.accepted = false;
    session.p2.accepted = false;

    this.broadcastTradeState(session, 'trade_update', client.displayName);
  }

  handleAccept(client) {
    if (!client) return;
    const session = this.getTradeForPlayer(client.id);
    if (!session) return;

    const isP1 = session.p1.id === client.id;
    if (isP1) {
      session.p1.accepted = true;
    } else {
      session.p2.accepted = true;
    }

    this.broadcastTradeState(session, 'trade_update');

    // If both players have accepted, execute atomic swap
    if (session.p1.accepted && session.p2.accepted) {
      this.executeTradeSwap(session);
    }
  }

  executeTradeSwap(session) {
    const c1 = this.getClientById(session.p1.id);
    const c2 = this.getClientById(session.p2.id);

    if (!c1 || !c2) {
      this.cancelTrade(session.tradeId, 'One of the trading champions disconnected.');
      return;
    }

    const prof1 = this.accounts.getProfile(c1.id);
    const prof2 = this.accounts.getProfile(c2.id);

    if (!prof1 || !prof2) {
      this.cancelTrade(session.tradeId, 'Failed to retrieve champion profiles.');
      return;
    }

    // 1. Verify Player 1 items and gold
    if (this.getPlayerGold(prof1) < session.p1.gold) {
      this.resetTradeAccept(session, `${c1.displayName} has insufficient gold!`);
      return;
    }
    for (const it of session.p1.items) {
      if (this.countItemInBackpack(prof1, it.id) < it.qty) {
        this.resetTradeAccept(session, `${c1.displayName} no longer has all offered items!`);
        return;
      }
    }

    // 2. Verify Player 2 items and gold
    if (this.getPlayerGold(prof2) < session.p2.gold) {
      this.resetTradeAccept(session, `${c2.displayName} has insufficient gold!`);
      return;
    }
    for (const it of session.p2.items) {
      if (this.countItemInBackpack(prof2, it.id) < it.qty) {
        this.resetTradeAccept(session, `${c2.displayName} no longer has all offered items!`);
        return;
      }
    }

    // 3. Verify Backpack capacity limits
    // Calculate new item slots needed by P1 for P2's items
    const p1CanFit = this.simulateCanFitItems(prof1, session.p1.items, session.p2.items);
    if (!p1CanFit) {
      this.resetTradeAccept(session, `❌ ${c1.displayName}'s backpack does not have enough free space!`);
      return;
    }

    const p2CanFit = this.simulateCanFitItems(prof2, session.p2.items, session.p1.items);
    if (!p2CanFit) {
      this.resetTradeAccept(session, `❌ ${c2.displayName}'s backpack does not have enough free space!`);
      return;
    }

    // 4. ATOMIC SWAP EXECUTION
    // Deduct P1 items & gold
    this.deductPlayerGold(prof1, session.p1.gold);
    for (const it of session.p1.items) {
      this.removeItemFromBackpack(prof1, it.id, it.qty);
    }

    // Deduct P2 items & gold
    this.deductPlayerGold(prof2, session.p2.gold);
    for (const it of session.p2.items) {
      this.removeItemFromBackpack(prof2, it.id, it.qty);
    }

    // Credit P1 with P2 items & gold
    this.addPlayerGold(prof1, session.p2.gold);
    for (const it of session.p2.items) {
      this.addItemToBackpack(prof1, it.id, it.qty);
    }

    // Credit P2 with P1 items & gold
    this.addPlayerGold(prof2, session.p1.gold);
    for (const it of session.p1.items) {
      this.addItemToBackpack(prof2, it.id, it.qty);
    }

    // Persist both accounts
    this.accounts.updateProfile(c1.id, {
      inventory: prof1.inventory,
      gold: prof1.gold,
    });
    this.accounts.updateProfile(c2.id, {
      inventory: prof2.inventory,
      gold: prof2.gold,
    });

    const ref1 = this.accounts.getProfile(c1.id);
    const ref2 = this.accounts.getProfile(c2.id);
    c1.send({ type: 'profile_updated', profile: ref1 });
    c2.send({ type: 'profile_updated', profile: ref2 });

    // Broadcast completion
    c1.send({ type: 'trade_complete', partnerName: c2.displayName });
    c2.send({ type: 'trade_complete', partnerName: c1.displayName });

    c1.send({
      type: 'sys_msg',
      category: 'trade',
      text: `🤝 [Trade] Trade completed successfully with ${c2.displayName}!`,
    });
    c2.send({
      type: 'sys_msg',
      category: 'trade',
      text: `🤝 [Trade] Trade completed successfully with ${c1.displayName}!`,
    });

    this.cleanUpTrade(session.tradeId);
  }

  simulateCanFitItems(profile, givingItems, receivingItems) {
    // Clone inventory to test fit
    const testInv = JSON.parse(JSON.stringify(profile.inventory || []));
    const testProf = { inventory: testInv };

    // Remove giving items
    for (const it of givingItems) {
      this.removeItemFromBackpack(testProf, it.id, it.qty);
    }

    // Try adding receiving items
    for (const it of receivingItems) {
      const ok = this.addItemToBackpack(testProf, it.id, it.qty);
      if (!ok) return false;
    }
    return true;
  }

  resetTradeAccept(session, warning) {
    session.p1.accepted = false;
    session.p2.accepted = false;
    const c1 = this.getClientById(session.p1.id);
    const c2 = this.getClientById(session.p2.id);
    if (c1) c1.send({ type: 'sys_msg', category: 'trade', text: warning });
    if (c2) c2.send({ type: 'sys_msg', category: 'trade', text: warning });
    this.broadcastTradeState(session, 'trade_update');
  }

  handleCancel(client) {
    if (!client) return;
    const tid = this.playerTrade.get(client.id);
    if (tid) {
      this.cancelTrade(tid, `${client.displayName} cancelled the trade.`);
    }
  }

  cancelTrade(tradeId, reason = 'Trade cancelled.') {
    const session = this.trades.get(tradeId);
    if (!session) return;

    const c1 = this.getClientById(session.p1.id);
    const c2 = this.getClientById(session.p2.id);

    if (c1) {
      c1.send({ type: 'trade_cancelled', reason });
      c1.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] ${reason}` });
    }
    if (c2) {
      c2.send({ type: 'trade_cancelled', reason });
      c2.send({ type: 'sys_msg', category: 'trade', text: `🤝 [Trade] ${reason}` });
    }

    this.cleanUpTrade(tradeId);
  }

  cleanUpTrade(tradeId) {
    const session = this.trades.get(tradeId);
    if (session) {
      this.playerTrade.delete(session.p1.id);
      this.playerTrade.delete(session.p2.id);
      this.trades.delete(tradeId);
    }
  }

  onPlayerDisconnect(playerId) {
    const tid = this.playerTrade.get(playerId);
    if (tid) {
      this.cancelTrade(tid, 'Trade partner disconnected.');
    }
    for (const [invId, inv] of this.pendingInvites.entries()) {
      if (inv.senderId === playerId || inv.targetId === playerId) {
        this.pendingInvites.delete(invId);
      }
    }
  }

  broadcastTradeState(session, eventType = 'trade_update', modifiedBy = null) {
    const c1 = this.getClientById(session.p1.id);
    const c2 = this.getClientById(session.p2.id);

    if (c1) {
      c1.send({
        type: eventType,
        tradeId: session.tradeId,
        yourOffer: session.p1,
        partnerOffer: session.p2,
        modifiedBy,
      });
    }

    if (c2) {
      c2.send({
        type: eventType,
        tradeId: session.tradeId,
        yourOffer: session.p2,
        partnerOffer: session.p1,
        modifiedBy,
      });
    }
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
