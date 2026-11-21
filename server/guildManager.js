// ==========================================
// GlimmerFall Online 2D — Persistent Guilds, Friends/Ignore & Moderation Manager
// Dual-backed by Neon PostgreSQL (when configured) + fast write-through memory store.
// ==========================================

import crypto from 'node:crypto';
import {
  EQUIPMENT_CATALOG,
  isProfane,
  validateCharacterName,
} from '../shared/protocol.js';

export const MAX_GUILD_BANK_SLOTS = 24;
export const MAX_GUILD_MEMBERS = 40;
export const GUILD_RANKS = ['Leader', 'Officer', 'Member'];

export class GuildManager {
  constructor({ accountsStore, getClientById = null, findClientByName = null } = {}) {
    this.accounts = accountsStore;
    this.getClientById = getClientById;
    this.findClientByName = findClientByName;
    this.db = null;

    this.guildsById = new Map();
    this.guildIdByNameLower = new Map();
    this.guildIdByAccount = new Map();
    this.invitesByAccount = new Map(); // accountId -> Map(guildId -> { guildId, guildName, tag, inviterName, ts })
    this.relationsByAccount = new Map(); // accountId -> { friends: Map<targetId, name>, ignores: Map<targetId, name> }
    this.reports = [];

    this._dirtyGuilds = new Set();
    this._deletedGuilds = new Set();
    this._dirtyRelations = [];
    this._dirtyReports = [];
    this._flushTimer = null;
  }

  async initAsync(dbPool) {
    if (!dbPool) return false;
    this.db = dbPool;
    try {
      const gRes = await this.db.query('SELECT * FROM glimmerfall_guilds');
      for (const row of gRes.rows) {
        const g = {
          id: row.id,
          name: row.name,
          nameLower: row.name_lower,
          tag: row.tag,
          color: row.color || '#facc15',
          leaderId: row.leader_id,
          motd: row.motd || '',
          bank: Array.isArray(row.bank) ? row.bank : [],
          members: new Map(),
          createdAt: Number(row.created_at) || Date.now(),
          updatedAt: Number(row.updated_at) || Date.now(),
        };
        this.guildsById.set(g.id, g);
        this.guildIdByNameLower.set(g.nameLower, g.id);
      }

      const mRes = await this.db.query('SELECT * FROM glimmerfall_guild_members ORDER BY joined_at ASC');
      for (const row of mRes.rows) {
        const g = this.guildsById.get(row.guild_id);
        if (!g) continue;
        g.members.set(row.account_id, {
          accountId: row.account_id,
          name: row.member_name || 'Member',
          rank: GUILD_RANKS.includes(row.rank) ? row.rank : 'Member',
          joinedAt: Number(row.joined_at) || Date.now(),
        });
        this.guildIdByAccount.set(row.account_id, g.id);
      }

      const rRes = await this.db.query('SELECT * FROM glimmerfall_social_relations');
      for (const row of rRes.rows) {
        const bucket = this._ensureRelations(row.account_id);
        if (row.relation === 'ignore') {
          bucket.ignores.set(row.target_account_id, row.target_name || row.target_account_id);
        } else {
          bucket.friends.set(row.target_account_id, row.target_name || row.target_account_id);
        }
      }
      return true;
    } catch (err) {
      console.error('[GuildManager DB Init Error]:', err.message);
      return false;
    }
  }

  _scheduleFlush() {
    if (!this.db || this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      this.flush().catch((e) => console.error('[GuildManager Flush Error]:', e.message));
    }, 300);
    this._flushTimer?.unref?.();
  }

  async flush() {
    if (!this.db) return;
    const delIds = Array.from(this._deletedGuilds);
    const dirtyIds = Array.from(this._dirtyGuilds);
    const relOps = this._dirtyRelations.splice(0, this._dirtyRelations.length);
    const repOps = this._dirtyReports.splice(0, this._dirtyReports.length);
    this._deletedGuilds.clear();
    this._dirtyGuilds.clear();

    for (const gid of delIds) {
      await this.db.query('DELETE FROM glimmerfall_guilds WHERE id = $1', [gid]);
    }
    for (const gid of dirtyIds) {
      const g = this.guildsById.get(gid);
      if (!g) continue;
      await this.db.query(
        `INSERT INTO glimmerfall_guilds (id, name, name_lower, tag, color, leader_id, motd, bank, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, tag=EXCLUDED.tag, color=EXCLUDED.color,
           leader_id=EXCLUDED.leader_id, motd=EXCLUDED.motd, bank=EXCLUDED.bank, updated_at=EXCLUDED.updated_at`,
        [g.id, g.name, g.nameLower, g.tag, g.color, g.leaderId, g.motd, JSON.stringify(g.bank), g.createdAt, g.updatedAt]
      );
      await this.db.query('DELETE FROM glimmerfall_guild_members WHERE guild_id = $1', [g.id]);
      for (const m of g.members.values()) {
        await this.db.query(
          `INSERT INTO glimmerfall_guild_members (guild_id, account_id, member_name, rank, joined_at)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [g.id, m.accountId, m.name, m.rank, m.joinedAt]
        );
      }
    }
    for (const op of relOps) {
      if (op.op === 'add') {
        await this.db.query(
          `INSERT INTO glimmerfall_social_relations (account_id, target_account_id, relation, target_name, created_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (account_id, target_account_id, relation) DO UPDATE SET target_name=EXCLUDED.target_name`,
          [op.accountId, op.targetId, op.relation, op.targetName, op.ts]
        );
      } else if (op.op === 'remove') {
        await this.db.query(
          'DELETE FROM glimmerfall_social_relations WHERE account_id=$1 AND target_account_id=$2 AND relation=$3',
          [op.accountId, op.targetId, op.relation]
        );
      }
    }
    for (const rep of repOps) {
      await this.db.query(
        `INSERT INTO glimmerfall_reports (id, reporter_id, reporter_name, target_id, target_name, reason, chat_context, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) ON CONFLICT DO NOTHING`,
        [rep.id, rep.reporterId, rep.reporterName, rep.targetId || null, rep.targetName, rep.reason, JSON.stringify(rep.chatContext || []), rep.status, rep.createdAt]
      );
    }
  }

  _ensureRelations(accountId) {
    let bucket = this.relationsByAccount.get(accountId);
    if (!bucket) {
      bucket = { friends: new Map(), ignores: new Map() };
      this.relationsByAccount.set(accountId, bucket);
    }
    return bucket;
  }

  // ==========================================
  // GUILD CRUD, ROSTER MANAGEMENT & 24-SLOT VAULT
  // ==========================================

  getGuildForAccount(accountId) {
    const gid = this.guildIdByAccount.get(accountId);
    return gid ? this.guildsById.get(gid) || null : null;
  }

  toPublicGuild(guild) {
    if (!guild) return null;
    const members = Array.from(guild.members.values()).map((m) => {
      const online = this.getClientById?.(m.accountId);
      return {
        accountId: m.accountId,
        name: online?.displayName || m.name,
        rank: m.rank,
        online: Boolean(online),
        roomType: online?.roomType || null,
      };
    });
    return {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      color: guild.color,
      leaderId: guild.leaderId,
      motd: guild.motd,
      bank: guild.bank,
      maxBankSlots: MAX_GUILD_BANK_SLOTS,
      members,
    };
  }

  createGuild(account, rawName, rawTag, rawColor = '#facc15') {
    if (!account) return { ok: false, reason: 'Account missing' };
    if (this.guildIdByAccount.has(account.id)) {
      return { ok: false, reason: 'Leave your current guild before founding a new one' };
    }
    const name = String(rawName || '').trim().replace(/\s+/g, ' ');
    const nameCheck = validateCharacterName(name);
    if (!nameCheck.ok) return { ok: false, reason: nameCheck.reason };
    const cleanTag = String(rawTag || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (cleanTag.length < 2) return { ok: false, reason: 'Guild Tag must be 2–4 alphanumeric characters' };
    if (isProfane(cleanTag)) return { ok: false, reason: 'Guild Tag contains restricted wording' };
    const nameLower = name.toLowerCase();
    if (this.guildIdByNameLower.has(nameLower)) {
      return { ok: false, reason: `A Guild named "${name}" already exists` };
    }

    const now = Date.now();
    const guild = {
      id: `guild_${crypto.randomUUID().slice(0, 10)}`,
      name,
      nameLower,
      tag: cleanTag,
      color: String(rawColor || '#facc15').slice(0, 16),
      leaderId: account.id,
      motd: `Welcome to <${cleanTag}> ${name}! Type /g to chat with guildmates.`,
      bank: [],
      members: new Map(),
      createdAt: now,
      updatedAt: now,
    };
    guild.members.set(account.id, {
      accountId: account.id,
      name: account.displayName || account.username,
      rank: 'Leader',
      joinedAt: now,
    });
    this.guildsById.set(guild.id, guild);
    this.guildIdByNameLower.set(nameLower, guild.id);
    this.guildIdByAccount.set(account.id, guild.id);
    account.orderTag = cleanTag;
    account.orderName = name;
    this.accounts?.schedulePersist?.(account.id, account.activeCharacterId);
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild };
  }

  inviteMember(inviterAccount, targetNameOrId) {
    const guild = this.getGuildForAccount(inviterAccount?.id);
    if (!guild) return { ok: false, reason: 'You are not in a Guild' };
    const actor = guild.members.get(inviterAccount.id);
    if (!actor || (actor.rank !== 'Leader' && actor.rank !== 'Officer')) {
      return { ok: false, reason: 'Only Leaders and Officers can send guild invites' };
    }
    if (guild.members.size >= MAX_GUILD_MEMBERS) {
      return { ok: false, reason: `Guild roster limit (${MAX_GUILD_MEMBERS}) reached` };
    }
    const targetClient = this.getClientById?.(targetNameOrId) || this.findClientByName?.(targetNameOrId);
    if (!targetClient) return { ok: false, reason: 'Target champion must be online to receive a Guild invite' };
    if (this.isIgnored(targetClient.id, inviterAccount.id, inviterAccount.displayName)) {
      return { ok: false, reason: 'Player is not accepting invites' };
    }
    if (this.guildIdByAccount.has(targetClient.id)) {
      return { ok: false, reason: `${targetClient.displayName} is already in a Guild` };
    }
    let invMap = this.invitesByAccount.get(targetClient.id);
    if (!invMap) {
      invMap = new Map();
      this.invitesByAccount.set(targetClient.id, invMap);
    }
    const invite = {
      guildId: guild.id,
      guildName: guild.name,
      tag: guild.tag,
      inviterName: inviterAccount.displayName,
      ts: Date.now(),
    };
    invMap.set(guild.id, invite);
    return { ok: true, guild, targetClient, invite };
  }

  acceptInvite(account, guildId) {
    if (!account) return { ok: false, reason: 'Account missing' };
    if (this.guildIdByAccount.has(account.id)) {
      return { ok: false, reason: 'Already belong to a Guild' };
    }
    const invMap = this.invitesByAccount.get(account.id);
    if (!invMap || !invMap.has(guildId)) {
      return { ok: false, reason: 'Guild invite expired or not found' };
    }
    const guild = this.guildsById.get(guildId);
    if (!guild) return { ok: false, reason: 'Guild no longer exists' };
    if (guild.members.size >= MAX_GUILD_MEMBERS) {
      return { ok: false, reason: 'Guild is full' };
    }
    invMap.delete(guildId);
    guild.members.set(account.id, {
      accountId: account.id,
      name: account.displayName || account.username,
      rank: 'Member',
      joinedAt: Date.now(),
    });
    guild.updatedAt = Date.now();
    this.guildIdByAccount.set(account.id, guild.id);
    account.orderTag = guild.tag;
    account.orderName = guild.name;
    this.accounts?.schedulePersist?.(account.id, account.activeCharacterId);
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild };
  }

  leaveGuild(account) {
    const guild = this.getGuildForAccount(account?.id);
    if (!guild) return { ok: false, reason: 'Not in a Guild' };
    guild.members.delete(account.id);
    this.guildIdByAccount.delete(account.id);
    guild.updatedAt = Date.now();
    if (guild.members.size === 0) {
      this.guildsById.delete(guild.id);
      this.guildIdByNameLower.delete(guild.nameLower);
      this._deletedGuilds.add(guild.id);
      this._dirtyGuilds.delete(guild.id);
    } else {
      if (guild.leaderId === account.id) {
        const nextLeader = Array.from(guild.members.values()).find((m) => m.rank === 'Officer') || Array.from(guild.members.values())[0];
        if (nextLeader) {
          nextLeader.rank = 'Leader';
          guild.leaderId = nextLeader.accountId;
        }
      }
      this._dirtyGuilds.add(guild.id);
    }
    this._scheduleFlush();
    return { ok: true, guildName: guild.name, guild };
  }

  setMemberRank(actorAccount, targetAccountId, nextRank) {
    if (!GUILD_RANKS.includes(nextRank) || nextRank === 'Leader') {
      return { ok: false, reason: 'Invalid rank (choose Officer or Member)' };
    }
    const guild = this.getGuildForAccount(actorAccount?.id);
    if (!guild) return { ok: false, reason: 'Not in a Guild' };
    if (guild.leaderId !== actorAccount.id) {
      return { ok: false, reason: 'Only the Guild Leader can promote or demote members' };
    }
    const target = guild.members.get(targetAccountId);
    if (!target || target.accountId === actorAccount.id) {
      return { ok: false, reason: 'Member not found' };
    }
    target.rank = nextRank;
    guild.updatedAt = Date.now();
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild, member: target };
  }

  kickMember(actorAccount, targetAccountId) {
    const guild = this.getGuildForAccount(actorAccount?.id);
    if (!guild) return { ok: false, reason: 'Not in a Guild' };
    const actor = guild.members.get(actorAccount.id);
    const target = guild.members.get(targetAccountId);
    if (!actor || !target) return { ok: false, reason: 'Member not found' };
    if (targetAccountId === actorAccount.id || target.rank === 'Leader') {
      return { ok: false, reason: 'Cannot kick the Guild Leader' };
    }
    if (actor.rank !== 'Leader' && !(actor.rank === 'Officer' && target.rank === 'Member')) {
      return { ok: false, reason: 'Insufficient guild rank to kick this member' };
    }
    guild.members.delete(targetAccountId);
    this.guildIdByAccount.delete(targetAccountId);
    guild.updatedAt = Date.now();
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild, kickedName: target.name };
  }

  setMotd(actorAccount, rawMotd) {
    const guild = this.getGuildForAccount(actorAccount?.id);
    if (!guild) return { ok: false, reason: 'Not in a Guild' };
    const actor = guild.members.get(actorAccount.id);
    if (!actor || (actor.rank !== 'Leader' && actor.rank !== 'Officer')) {
      return { ok: false, reason: 'Only Leaders and Officers can update the Guild MOTD' };
    }
    guild.motd = String(rawMotd || '').trim().slice(0, 140);
    guild.updatedAt = Date.now();
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild };
  }

  depositGuildBank(accountId, bagIdx, rawQty = 1) {
    const guild = this.getGuildForAccount(accountId);
    if (!guild) return { ok: false, reason: 'Join a Guild first to use the Guild Bank Vault' };
    const acc = this.accounts?.accountsById.get(accountId);
    if (!acc) return { ok: false, reason: 'Account missing' };
    const idx = Number(bagIdx);
    const inv = acc.inventory || [];
    if (!Number.isInteger(idx) || idx < 0 || idx >= inv.length) {
      return { ok: false, reason: 'Invalid backpack slot' };
    }
    const entry = inv[idx];
    const itemId = typeof entry === 'string' ? entry : entry?.id;
    const owned = typeof entry === 'string' ? 1 : (entry?.qty || 1);
    const item = EQUIPMENT_CATALOG[itemId];
    if (!item) return { ok: false, reason: 'Unknown item' };
    const qty = Math.min(owned, Math.max(1, Math.floor(Number(rawQty) || 1)));

    const existing = item.stackable !== false && (item.stackable || item.slot === 'currency' || item.slot === 'consumable' || item.slot === 'material')
      ? guild.bank.find((b) => b.id === itemId)
      : null;
    if (!existing && guild.bank.length >= MAX_GUILD_BANK_SLOTS) {
      return { ok: false, reason: `Guild Vault full (${MAX_GUILD_BANK_SLOTS}/${MAX_GUILD_BANK_SLOTS})` };
    }
    if (!this.accounts.removeItemFromInventory(accountId, idx, qty)) {
      return { ok: false, reason: 'Could not remove item from backpack' };
    }
    if (existing) {
      existing.qty = (existing.qty || 1) + qty;
    } else {
      guild.bank.push({ id: itemId, qty });
    }
    guild.updatedAt = Date.now();
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild, itemId, qty };
  }

  withdrawGuildBank(accountId, bankIdx, rawQty = 1) {
    const guild = this.getGuildForAccount(accountId);
    if (!guild) return { ok: false, reason: 'Not in a Guild' };
    const idx = Number(bankIdx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= guild.bank.length) {
      return { ok: false, reason: 'Invalid Guild Vault slot' };
    }
    const slot = guild.bank[idx];
    const qty = Math.min(slot.qty || 1, Math.max(1, Math.floor(Number(rawQty) || 1)));
    if (!this.accounts.addItemToInventory(accountId, slot.id, qty)) {
      return { ok: false, reason: 'Backpack full' };
    }
    if ((slot.qty || 1) > qty) {
      slot.qty -= qty;
    } else {
      guild.bank.splice(idx, 1);
    }
    guild.updatedAt = Date.now();
    this._dirtyGuilds.add(guild.id);
    this._scheduleFlush();
    return { ok: true, guild, itemId: slot.id, qty };
  }

  // ==========================================
  // FRIENDS, IGNORE LISTS & WHISPERS
  // ==========================================

  _resolveTargetIdentity(targetNameOrId) {
    const clean = String(targetNameOrId || '').trim();
    if (!clean) return null;
    const online = this.getClientById?.(clean) || this.findClientByName?.(clean);
    if (online) return { id: online.id, name: online.displayName || online.username };
    if (this.accounts?.accountsById) {
      const byId = this.accounts.accountsById.get(clean);
      if (byId) return { id: byId.id, name: byId.displayName || byId.username };
      const low = clean.toLowerCase();
      for (const acc of this.accounts.accountsById.values()) {
        if ((acc.displayName || '').toLowerCase() === low || (acc.usernameLower || '') === low) {
          return { id: acc.id, name: acc.displayName || acc.username };
        }
      }
    }
    return null;
  }

  addRelation(accountId, targetNameOrId, relation = 'friend') {
    const cleanRel = relation === 'ignore' ? 'ignore' : 'friend';
    const tgt = this._resolveTargetIdentity(targetNameOrId);
    if (!tgt) return { ok: false, reason: `Champion "${targetNameOrId}" not found` };
    if (tgt.id === accountId) return { ok: false, reason: 'Cannot add yourself' };
    const bucket = this._ensureRelations(accountId);
    if (cleanRel === 'friend') {
      bucket.friends.set(tgt.id, tgt.name);
      if (bucket.ignores.has(tgt.id)) {
        bucket.ignores.delete(tgt.id);
        this._dirtyRelations.push({ op: 'remove', accountId, targetId: tgt.id, relation: 'ignore' });
      }
    } else {
      bucket.ignores.set(tgt.id, tgt.name);
      if (bucket.friends.has(tgt.id)) {
        bucket.friends.delete(tgt.id);
        this._dirtyRelations.push({ op: 'remove', accountId, targetId: tgt.id, relation: 'friend' });
      }
    }
    this._dirtyRelations.push({ op: 'add', accountId, targetId: tgt.id, targetName: tgt.name, relation: cleanRel, ts: Date.now() });
    this._scheduleFlush();
    return { ok: true, relation: cleanRel, target: tgt };
  }

  removeRelation(accountId, targetNameOrId, relation = 'friend') {
    const cleanRel = relation === 'ignore' ? 'ignore' : 'friend';
    const bucket = this._ensureRelations(accountId);
    const map = cleanRel === 'ignore' ? bucket.ignores : bucket.friends;
    const low = String(targetNameOrId || '').trim().toLowerCase();
    let matchedId = map.has(targetNameOrId) ? targetNameOrId : null;
    if (!matchedId) {
      for (const [tid, tname] of map.entries()) {
        if (String(tname || '').toLowerCase() === low) {
          matchedId = tid;
          break;
        }
      }
    }
    if (!matchedId) return { ok: false, reason: 'Entry not found' };
    map.delete(matchedId);
    this._dirtyRelations.push({ op: 'remove', accountId, targetId: matchedId, relation: cleanRel });
    this._scheduleFlush();
    return { ok: true, relation: cleanRel, targetId: matchedId };
  }

  isIgnored(accountId, senderId, senderName = '') {
    const bucket = this.relationsByAccount.get(accountId);
    if (!bucket || bucket.ignores.size === 0) return false;
    if (senderId && bucket.ignores.has(senderId)) return true;
    const low = String(senderName || '').toLowerCase();
    if (low) {
      for (const n of bucket.ignores.values()) {
        if (String(n).toLowerCase() === low) return true;
      }
    }
    return false;
  }

  getSocialSnapshot(accountId) {
    const bucket = this._ensureRelations(accountId);
    const friends = Array.from(bucket.friends.entries()).map(([tid, name]) => {
      const online = this.getClientById?.(tid);
      return {
        id: tid,
        name: online?.displayName || name,
        online: Boolean(online),
        roomType: online?.roomType || null,
      };
    });
    const ignores = Array.from(bucket.ignores.entries()).map(([tid, name]) => ({
      id: tid,
      name,
    }));
    const guild = this.getGuildForAccount(accountId);
    return {
      friends,
      ignores,
      guild: this.toPublicGuild(guild),
    };
  }

  // ==========================================
  // TRUST, SAFETY & ABUSE REPORTS
  // ==========================================

  submitReport({ reporter, targetName, targetId = null, reason = '', chatContext = [] }) {
    const cleanTarget = String(targetName || '').trim().slice(0, 40);
    const cleanReason = String(reason || '').trim().slice(0, 240);
    if (!cleanTarget || !cleanReason) {
      return { ok: false, reason: 'Please specify player name and reason' };
    }
    const tgt = targetId ? { id: targetId } : this._resolveTargetIdentity(cleanTarget);
    const rep = {
      id: `rep_${crypto.randomUUID().slice(0, 10)}`,
      reporterId: reporter?.id || 'unknown',
      reporterName: reporter?.displayName || reporter?.username || 'Player',
      targetId: tgt?.id || null,
      targetName: cleanTarget,
      reason: cleanReason,
      chatContext: Array.isArray(chatContext) ? chatContext.slice(-15) : [],
      status: 'open',
      createdAt: Date.now(),
    };
    this.reports.push(rep);
    if (this.reports.length > 500) this.reports.shift();
    this._dirtyReports.push(rep);
    this._scheduleFlush();
    return { ok: true, report: rep };
  }
}
