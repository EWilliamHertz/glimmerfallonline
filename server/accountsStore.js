// ==========================================
// GlimmerFall Online 2D — PostgreSQL-Backed Accounts & Character Roster Store
// Persists Accounts, Multi-Character Rosters, Factions, Classes, Loadouts & Gear
// directly into Neon PostgreSQL (DATABASE_URL) with write-through caching
// ==========================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getDbPool, initDatabaseSchema } from './db.js';
import {
  ACTION_SLOTS,
  FACTIONS_META,
  CLASSES_CATALOG,
  ABILITIES_CATALOG,
  EQUIPMENT_CATALOG,
  ORDER_PRESETS,
  ROOM_TYPES,
  createDefaultProgression,
  resolveFactionAndClass,
  PROFESSIONS_CATALOG,
  getProfessionLevelFromXp,
  sanitizeLoadout,
} from '../shared/protocol.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SECRET_PATH = path.join(DATA_DIR, 'session_secret.txt');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSessionSecret() {
  if (process.env.GLIMMERFALL_SSO_SECRET) return process.env.GLIMMERFALL_SSO_SECRET;
  if (process.env.SUPABASE_JWT_SECRET) return process.env.SUPABASE_JWT_SECRET;
  if (process.env.DATABASE_URL) {
    return crypto.createHash('sha256').update(`glimmerfall-id-secret:${process.env.DATABASE_URL}`).digest('hex');
  }
  try {
    ensureDataDir();
    if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf8').trim();
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_PATH, generated, { mode: 0o600 });
    return generated;
  } catch (_) {
    return 'glimmerfall-fallback-dev-secret-2026';
  }
}

function sanitizeName(raw, fallback = 'Vanguard') {
  const cleaned = String(raw || '')
    .replace(/[^\w\- ]/g, '')
    .trim()
    .slice(0, 18);
  return cleaned.length >= 2 ? cleaned : fallback;
}

function sanitizeOrderTag(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
}

export function normalizeClassAndFaction(classId, faction) {
  let cls = CLASSES_CATALOG[classId];
  if (!cls) {
    const byFac = Object.values(CLASSES_CATALOG).find((c) => c.faction === faction);
    cls = byFac || CLASSES_CATALOG.solari_vanguard;
  }
  return { classId: cls.id, faction: cls.faction, cls };
}

// Loadouts are sanitized in one place so offline and server characters agree on
// the "slot 1 only" starting bar and on legacy default migrations.
export function normalizeLoadout(rawLoadout, classId) {
  return sanitizeLoadout(rawLoadout, classId);
}

export const VALID_EQUIP_SLOTS = [
  'head',
  'cape',
  'neck',
  'ammo',
  'weapon',
  'body',
  'shield',
  'legs',
  'hands',
  'feet',
  'ring',
  'socket_head',
  'socket_body',
  'socket_weapon',
];

export function normalizeEquipment(rawEquip, classId) {
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const out = { ...cls.defaultEquipment };
  if (rawEquip && typeof rawEquip === 'object') {
    for (const slot of VALID_EQUIP_SLOTS) {
      let candidate = rawEquip[slot];
      if (!candidate) {
        if (slot === 'body') candidate = rawEquip.armor;
        if (slot === 'shield') candidate = rawEquip.offhand;
      }
      if (candidate && EQUIPMENT_CATALOG[candidate]) {
        const itemSlot = EQUIPMENT_CATALOG[candidate].slot;
        const matches =
          itemSlot === slot ||
          (slot === 'body' && itemSlot === 'armor') ||
          (slot === 'shield' && itemSlot === 'offhand') ||
          (slot.startsWith('socket_') && itemSlot === 'socket_gem');
        if (matches) {
          out[slot] = candidate;
        }
      }
    }
  }
  // Maintain backward-compatible aliases
  if (out.body && !out.armor) out.armor = out.body;
  if (out.armor && !out.body) out.body = out.armor;
  if (out.shield && !out.offhand) out.offhand = out.shield;
  if (out.offhand && !out.shield) out.shield = out.offhand;
  return out;
}

export function normalizeInventory(rawInv) {
  const out = [];
  if (Array.isArray(rawInv)) {
    for (const item of rawInv) {
      if (!item) continue;
      const itemId = typeof item === 'string' ? item : item.id;
      if (!itemId) continue;
      const qty = typeof item === 'object' && item.qty ? Math.max(1, Number(item.qty) || 1) : 1;
      const existing = out.find((it) => it.id === itemId);
      if (existing) {
        existing.qty += qty;
      } else {
        out.push({ id: itemId, qty });
      }
      if (out.length >= 28) break;
    }
  }
  return out.slice(0, 28);
}

export function normalizeBank(rawBank) {
  const out = [];
  if (Array.isArray(rawBank)) {
    for (const item of rawBank) {
      if (!item) continue;
      const itemId = typeof item === 'string' ? item : item.id;
      if (!itemId) continue;
      const qty = typeof item === 'object' && item.qty ? Math.max(1, Number(item.qty) || 1) : 1;
      const existing = out.find((it) => it.id === itemId);
      if (existing) {
        existing.qty += qty;
      } else {
        out.push({ id: itemId, qty });
      }
      if (out.length >= 240) break;
    }
  }
  return out.slice(0, 240);
}

export function getDefaultStarterInventory(classId = 'solari_vanguard') {
  return [
    { id: 'solar_gold', qty: 60 },
    { id: 'ring_of_the_sun', qty: 1 },
    { id: 'boots_of_haste', qty: 1 },
    { id: 'vanguard_gauntlets', qty: 1 },
    { id: 'amulet_of_glory', qty: 1 },
  ];
}

export class AccountsStore {
  constructor() {
    this.secret = loadSessionSecret();
    this.db = null;
    this.dbConnected = false;
    this.accountsById = new Map();
    this.idByUsername = new Map();
    this.charactersByAccount = new Map(); // accountId -> Map<charId, charObj>
    this.dirtyAccounts = new Set();
    this.dirtyCharacters = new Set();
    this.flushTimer = null;
  }

  async init() {
    try {
      this.dbConnected = await initDatabaseSchema();
      if (this.dbConnected) {
        this.db = getDbPool();
        await this.loadAllFromPostgres();
      }
    } catch (err) {
      console.error('[AccountsStore] PostgreSQL init error:', err.message);
      this.dbConnected = false;
    }
  }

  async loadAllFromPostgres() {
    if (!this.db) return;
    const accRes = await this.db.query('SELECT * FROM glimmerfall_accounts');
    for (const row of accRes.rows) {
      const acc = {
        id: row.id,
        username: row.username,
        usernameLower: row.username_lower,
        displayName: row.display_name,
        passwordHash: row.password_hash,
        isGuest: row.is_guest,
        ssoSubject: row.sso_subject,
        tcgLinked: row.tcg_linked,
        tcgHandle: row.tcg_handle,
        tcgEmail: row.tcg_email,
        tcgSyncedAt: row.tcg_synced_at ? new Date(row.tcg_synced_at).toISOString() : null,
        faction: row.faction || 'Solari',
        classId: row.class_id || 'solari_vanguard',
        orderTag: row.order_tag || 'SUN',
        orderName: row.order_name || 'Order of Dawn',
        orderColor: row.order_color || '#facc15',
        loadout: normalizeLoadout(row.loadout, row.class_id),
        equipment: normalizeEquipment(row.equipment, row.class_id),
        inventory: normalizeInventory(row.inventory || getDefaultStarterInventory(row.class_id)),
        bank: normalizeBank(row.bank || []),
        questState: row.quest_state || {},
        progression: this.mergeValidProgression(createDefaultProgression(), row.progression),
        statsMeta: row.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
        activeCharacterId: row.active_character_id || null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : new Date().toISOString(),
      };
      this.accountsById.set(acc.id, acc);
      if (acc.usernameLower) this.idByUsername.set(acc.usernameLower, acc.id);
      this.charactersByAccount.set(acc.id, new Map());
    }

    const charRes = await this.db.query('SELECT * FROM glimmerfall_characters ORDER BY created_at ASC');
    for (const row of charRes.rows) {
      const resolved = resolveFactionAndClass({
        faction: row.faction,
        classId: row.class_id,
        loadout: row.loadout,
        orderTag: row.order_tag,
      });
      const ch = {
        id: row.id,
        accountId: row.account_id,
        name: row.name,
        faction: resolved.faction,
        classId: resolved.classId,
        orderTag: row.order_tag || (resolved.faction === 'Umbri' ? 'VOID' : resolved.faction === 'Terra' ? 'ROOT' : resolved.faction === 'Aether' ? 'AETH' : 'SUN'),
        orderName: row.order_name || `Order of ${resolved.faction}`,
        orderColor: row.order_color || '#facc15',
        homeBiome: row.home_biome || ROOM_TYPES.SANCTUARY_HUB,
        loadout: normalizeLoadout(row.loadout, resolved.classId),
        equipment: normalizeEquipment(row.equipment, resolved.classId),
        inventory: normalizeInventory(row.inventory || getDefaultStarterInventory(resolved.classId)),
        bank: normalizeBank(row.bank || []),
        questState: row.quest_state || {},
        unlockedGear: Array.isArray(row.unlocked_gear) ? row.unlocked_gear : Object.keys(EQUIPMENT_CATALOG),
        progression: this.mergeValidProgression(createDefaultProgression(), row.progression),
        statsMeta: row.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      };
      if (!this.charactersByAccount.has(ch.accountId)) {
        this.charactersByAccount.set(ch.accountId, new Map());
      }
      this.charactersByAccount.get(ch.accountId).set(ch.id, ch);
    }
    for (const acc of this.accountsById.values()) {
      this.ensureDefaultCharacter(acc);
      this.syncAccountFromActiveChar(acc);
    }
    console.log(`[PostgreSQL] Loaded ${this.accountsById.size} accounts & ${charRes.rows.length} characters from Neon DB.`);
  }

  hydrateAccountRow(row) {
    const resolved = resolveFactionAndClass({
      faction: row.faction,
      classId: row.class_id,
      loadout: row.loadout,
      orderTag: row.order_tag,
    });
    const acc = {
      id: row.id,
      username: row.username,
      usernameLower: row.username_lower,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      isGuest: row.is_guest,
      ssoSubject: row.sso_subject,
      tcgLinked: row.tcg_linked,
      tcgHandle: row.tcg_handle,
      tcgEmail: row.tcg_email,
      tcgSyncedAt: row.tcg_synced_at ? new Date(row.tcg_synced_at).toISOString() : null,
      faction: resolved.faction,
      classId: resolved.classId,
      orderTag: row.order_tag || (resolved.faction === 'Umbri' ? 'VOID' : resolved.faction === 'Terra' ? 'ROOT' : resolved.faction === 'Aether' ? 'AETH' : 'SUN'),
      orderName: row.order_name || `Order of ${resolved.faction}`,
      orderColor: row.order_color || '#facc15',
      loadout: normalizeLoadout(row.loadout, resolved.classId),
      equipment: normalizeEquipment(row.equipment, resolved.classId),
      inventory: normalizeInventory(row.inventory || getDefaultStarterInventory(resolved.classId)),
      bank: normalizeBank(row.bank || []),
      questState: row.quest_state || {},
      progression: this.mergeValidProgression(createDefaultProgression(), row.progression),
      statsMeta: row.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      activeCharacterId: row.active_character_id || null,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : new Date().toISOString(),
    };
    this.accountsById.set(acc.id, acc);
    if (acc.usernameLower) this.idByUsername.set(acc.usernameLower, acc.id);
    if (!this.charactersByAccount.has(acc.id)) {
      this.charactersByAccount.set(acc.id, new Map());
    }
    return acc;
  }

  async ensureFreshFromPostgres({ id = null, username = null, force = true } = {}) {
    if (!this.db) return;
    try {
      let accRow = null;
      if (id && (force || !this.accountsById.has(id))) {
        const res = await this.db.query('SELECT * FROM glimmerfall_accounts WHERE id = $1 LIMIT 1', [id]);
        accRow = res.rows[0] || null;
      } else if (username) {
        const lower = String(username).trim().toLowerCase();
        if (lower && (!this.idByUsername.has(lower) || force)) {
          const res = await this.db.query('SELECT * FROM glimmerfall_accounts WHERE username_lower = $1 LIMIT 1', [lower]);
          accRow = res.rows[0] || null;
        }
      }
      if (accRow) {
        const acc = this.hydrateAccountRow(accRow);
        const cRes = await this.db.query('SELECT * FROM glimmerfall_characters WHERE account_id = $1 ORDER BY created_at ASC', [acc.id]);
        const cmap = this.charactersByAccount.get(acc.id);
        for (const r of cRes.rows) {
          const charResolved = resolveFactionAndClass({
            faction: r.faction,
            classId: r.class_id,
            loadout: r.loadout,
            orderTag: r.order_tag,
          });
          cmap.set(r.id, {
            id: r.id,
            accountId: r.account_id,
            name: r.name,
            faction: charResolved.faction,
            classId: charResolved.classId,
            orderTag: r.order_tag || (charResolved.faction === 'Umbri' ? 'VOID' : charResolved.faction === 'Terra' ? 'ROOT' : charResolved.faction === 'Aether' ? 'AETH' : 'SUN'),
            orderName: r.order_name || `Order of ${charResolved.faction}`,
            orderColor: r.order_color || '#facc15',
            homeBiome: r.home_biome || ROOM_TYPES.SANCTUARY_HUB,
            loadout: normalizeLoadout(r.loadout, charResolved.classId),
            equipment: normalizeEquipment(r.equipment, charResolved.classId),
            inventory: normalizeInventory(r.inventory || getDefaultStarterInventory(charResolved.classId)),
            bank: normalizeBank(r.bank || []),
            questState: r.quest_state || {},
            unlockedGear: Array.isArray(r.unlocked_gear) ? r.unlocked_gear : Object.keys(EQUIPMENT_CATALOG),
            progression: this.mergeValidProgression(createDefaultProgression(), r.progression),
            statsMeta: r.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
          });
        }
        this.ensureDefaultCharacter(acc);
        this.syncAccountFromActiveChar(acc);
      }
    } catch (_) {}
  }

  decodeTokenSubject(token) {
    if (!token || typeof token !== 'string') return null;
    const raw = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    if (!raw.startsWith('gfid_')) return null;
    const parts = raw.slice(5).split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = crypto.createHmac('sha256', this.secret).update(body).digest('base64url');
    if (sig !== expected) return null;
    try {
      const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
      return data.sub || null;
    } catch (_) {
      return null;
    }
  }

  schedulePersist(accountId, characterId = null) {
    if (accountId) this.dirtyAccounts.add(accountId);
    if (characterId) this.dirtyCharacters.add(characterId);
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushToPostgres().catch((err) => console.error('[DB Flush Error]:', err.message));
    }, 300);
  }

  async flushToPostgres() {
    if (!this.db) return;
    const accIds = Array.from(this.dirtyAccounts);
    const charIds = Array.from(this.dirtyCharacters);
    this.dirtyAccounts.clear();
    this.dirtyCharacters.clear();

    for (const aid of accIds) {
      const a = this.accountsById.get(aid);
      if (!a) continue;
      await this.db.query(
        `INSERT INTO glimmerfall_accounts (
          id, username, username_lower, display_name, password_hash, is_guest, sso_subject,
          tcg_linked, tcg_handle, tcg_email, tcg_synced_at, faction, class_id,
          order_tag, order_name, order_color, loadout, equipment, progression, stats_meta,
          active_character_id, created_at, last_login_at, inventory, bank, quest_state
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
        )
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          username_lower = EXCLUDED.username_lower,
          display_name = EXCLUDED.display_name,
          password_hash = EXCLUDED.password_hash,
          is_guest = EXCLUDED.is_guest,
          sso_subject = EXCLUDED.sso_subject,
          tcg_linked = EXCLUDED.tcg_linked,
          tcg_handle = EXCLUDED.tcg_handle,
          tcg_email = EXCLUDED.tcg_email,
          tcg_synced_at = EXCLUDED.tcg_synced_at,
          faction = EXCLUDED.faction,
          class_id = EXCLUDED.class_id,
          order_tag = EXCLUDED.order_tag,
          order_name = EXCLUDED.order_name,
          order_color = EXCLUDED.order_color,
          loadout = EXCLUDED.loadout,
          equipment = EXCLUDED.equipment,
          progression = EXCLUDED.progression,
          stats_meta = EXCLUDED.stats_meta,
          active_character_id = EXCLUDED.active_character_id,
          last_login_at = EXCLUDED.last_login_at,
          inventory = EXCLUDED.inventory,
          bank = EXCLUDED.bank,
          quest_state = EXCLUDED.quest_state`,
        [
          a.id, a.username, a.usernameLower, a.displayName, a.passwordHash, a.isGuest, a.ssoSubject,
          a.tcgLinked, a.tcgHandle, a.tcgEmail, a.tcgSyncedAt, a.faction, a.classId,
          a.orderTag, a.orderName, a.orderColor,
          JSON.stringify(a.loadout || {}),
          JSON.stringify(a.equipment || {}),
          JSON.stringify(a.progression || {}),
          JSON.stringify(a.statsMeta || {}),
          a.activeCharacterId,
          a.createdAt,
          a.lastLoginAt,
          JSON.stringify(a.inventory || []),
          JSON.stringify(a.bank || []),
          JSON.stringify(a.questState || {}),
        ]
      );
    }

    for (const cid of charIds) {
      let found = null;
      for (const cmap of this.charactersByAccount.values()) {
        if (cmap.has(cid)) {
          found = cmap.get(cid);
          break;
        }
      }
      if (!found) continue;
      await this.db.query(
        `INSERT INTO glimmerfall_characters (
          id, account_id, name, faction, class_id, order_tag, order_name, order_color,
          home_biome, loadout, equipment, unlocked_gear, progression, stats_meta, updated_at, inventory, bank, quest_state
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          faction = EXCLUDED.faction,
          class_id = EXCLUDED.class_id,
          order_tag = EXCLUDED.order_tag,
          order_name = EXCLUDED.order_name,
          order_color = EXCLUDED.order_color,
          home_biome = EXCLUDED.home_biome,
          loadout = EXCLUDED.loadout,
          equipment = EXCLUDED.equipment,
          unlocked_gear = EXCLUDED.unlocked_gear,
          progression = EXCLUDED.progression,
          stats_meta = EXCLUDED.stats_meta,
          inventory = EXCLUDED.inventory,
          bank = EXCLUDED.bank,
          quest_state = EXCLUDED.quest_state,
          updated_at = NOW()`,
        [
          found.id, found.accountId, found.name, found.faction, found.classId,
          found.orderTag, found.orderName, found.orderColor, found.homeBiome,
          JSON.stringify(found.loadout || {}),
          JSON.stringify(found.equipment || {}),
          JSON.stringify(found.unlockedGear || []),
          JSON.stringify(found.progression || {}),
          JSON.stringify(found.statsMeta || {}),
          JSON.stringify(found.inventory || []),
          JSON.stringify(found.bank || []),
          JSON.stringify(found.questState || {}),
        ]
      );
    }
  }

  flushSync() {
    this.flushToPostgres().catch(() => {});
  }

  hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, keyHex] = storedHash.split(':');
    const derived = crypto.scryptSync(String(password), salt, 64);
    const keyBuf = Buffer.from(keyHex, 'hex');
    if (derived.length !== keyBuf.length) return false;
    return crypto.timingSafeEqual(derived, keyBuf);
  }

  signToken(accountId) {
    const payloadObj = {
      sub: accountId,
      iss: 'glimmerfall-online',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    };
    const body = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(body).digest('base64url');
    return `gfid_${body}.${sig}`;
  }

  verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const raw = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();

    if (raw.startsWith('gfid_')) {
      const parts = raw.slice(5).split('.');
      if (parts.length !== 2) return null;
      const [body, sig] = parts;
      const expected = crypto.createHmac('sha256', this.secret).update(body).digest('base64url');
      if (sig !== expected) return null;
      try {
        const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
        return this.accountsById.get(data.sub) || null;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  ensureDefaultCharacter(acc) {
    if (!this.charactersByAccount.has(acc.id)) {
      this.charactersByAccount.set(acc.id, new Map());
    }
    const cmap = this.charactersByAccount.get(acc.id);
    if (cmap.size === 0) {
      const chId = `chr_${crypto.randomUUID().slice(0, 10)}`;
      const ch = {
        id: chId,
        accountId: acc.id,
        name: acc.displayName,
        faction: acc.faction,
        classId: acc.classId || 'solari_vanguard',
        orderTag: acc.orderTag || 'SUN',
        orderName: acc.orderName || 'Order of Dawn',
        orderColor: acc.orderColor || '#facc15',
        homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        loadout: normalizeLoadout(acc.loadout, acc.classId),
        equipment: normalizeEquipment(acc.equipment, acc.classId),
        inventory: normalizeInventory(acc.inventory || getDefaultStarterInventory(acc.classId)),
        bank: normalizeBank(acc.bank || []),
        unlockedGear: Object.keys(EQUIPMENT_CATALOG),
        progression: acc.progression,
        questState: acc.questState || {},
        statsMeta: acc.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      };
      cmap.set(chId, ch);
      acc.activeCharacterId = chId;
      this.schedulePersist(acc.id, chId);
    } else if (!acc.activeCharacterId || !cmap.has(acc.activeCharacterId)) {
      acc.activeCharacterId = cmap.keys().next().value;
      this.syncAccountFromActiveChar(acc);
    }
  }

  syncAccountFromActiveChar(acc) {
    const cmap = this.charactersByAccount.get(acc.id);
    const ch = cmap?.get(acc.activeCharacterId);
    if (!ch) return;
    acc.displayName = ch.name;
    acc.faction = ch.faction;
    acc.classId = ch.classId;
    acc.orderTag = ch.orderTag;
    acc.orderName = ch.orderName;
    acc.orderColor = ch.orderColor;
    acc.loadout = ch.loadout;
    acc.equipment = ch.equipment;
    acc.inventory = ch.inventory;
    acc.bank = ch.bank;
    acc.progression = ch.progression;
    acc.statsMeta = ch.statsMeta;
    acc.questState = ch.questState || {};
  }

  listCharacters(accountId) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return [];
    this.ensureDefaultCharacter(acc);
    return Array.from(this.charactersByAccount.get(accountId).values());
  }

  createOrSelectCharacter(accountId, {
    characterId,
    name,
    faction = null,
    classId = null,
    orderTag = null,
    orderName = null,
    orderColor = null,
    loadout = null,
    equipment = null,
    inventory = null,
    bank = null,
    homeBiome = ROOM_TYPES.SANCTUARY_HUB,
  } = {}) {
    const acc = this.accountsById.get(accountId);
    if (!acc) throw new Error('Account not found.');
    this.ensureDefaultCharacter(acc);
    const cmap = this.charactersByAccount.get(acc.id);

    // Update existing character if characterId passed (pure selection: do NOT mutate faction/classId unless explicitly provided)
    if (characterId && cmap.has(characterId)) {
      const ch = cmap.get(characterId);
      acc.activeCharacterId = ch.id;
      if (homeBiome) ch.homeBiome = homeBiome;

      if (name) ch.name = sanitizeName(name, ch.name);
      if (faction || classId) {
        const norm = normalizeClassAndFaction(classId || ch.classId, faction || ch.faction);
        ch.faction = norm.faction;
        ch.classId = norm.classId;
      }
      if (orderTag) ch.orderTag = sanitizeOrderTag(orderTag);
      if (orderName) ch.orderName = sanitizeName(orderName, ch.orderName);
      if (orderColor) ch.orderColor = orderColor;
      if (loadout) ch.loadout = normalizeLoadout(loadout, ch.classId);
      if (equipment) ch.equipment = normalizeEquipment(equipment, ch.classId);
      if (inventory) ch.inventory = normalizeInventory(inventory);
      if (bank) ch.bank = normalizeBank(bank);

      this.syncAccountFromActiveChar(acc);
      this.schedulePersist(acc.id, ch.id);
      return ch;
    }

    if (cmap.size >= 8) {
      throw new Error('Maximum of 8 characters per GlimmerFall ID reached.');
    }

    const norm = normalizeClassAndFaction(classId || 'solari_vanguard', faction || 'Solari');
    const preset = ORDER_PRESETS.find((o) =>
      (norm.faction === 'Solari' && o.tag === 'SUN') ||
      (norm.faction === 'Umbri' && o.tag === 'VOID') ||
      (norm.faction === 'Terra' && o.tag === 'ROOT') ||
      (norm.faction === 'Aether' && o.tag === 'AETH')
    ) || ORDER_PRESETS[0];

    const chId = `chr_${crypto.randomUUID().slice(0, 10)}`;
    const ch = {
      id: chId,
      accountId: acc.id,
      name: sanitizeName(name, norm.cls.name),
      faction: norm.faction,
      classId: norm.classId,
      orderTag: sanitizeOrderTag(orderTag) || preset.tag,
      orderName: sanitizeName(orderName, preset.name),
      orderColor: orderColor || preset.color,
      homeBiome,
      loadout: normalizeLoadout(loadout, norm.classId),
      equipment: normalizeEquipment(equipment, norm.classId),
      inventory: normalizeInventory(inventory || getDefaultStarterInventory(norm.classId)),
      bank: normalizeBank(bank || []),
      questState: {},
      unlockedGear: Object.keys(EQUIPMENT_CATALOG),
      progression: createDefaultProgression(),
      statsMeta: { kills: 0, arenaWins: 0, siegeClaims: 0 },
    };
    cmap.set(chId, ch);
    acc.activeCharacterId = chId;
    this.syncAccountFromActiveChar(acc);
    this.schedulePersist(acc.id, chId);
    return ch;
  }

  deleteCharacter(accountId, characterId) {
    const acc = this.accountsById.get(accountId);
    if (!acc) throw new Error('Account not found.');
    const cmap = this.charactersByAccount.get(accountId);
    if (!cmap || cmap.size <= 1) {
      throw new Error('You must keep at least 1 character on your roster.');
    }
    cmap.delete(characterId);
    if (this.db) {
      this.db.query('DELETE FROM glimmerfall_characters WHERE id = $1 AND account_id = $2', [characterId, accountId]).catch(() => {});
    }
    if (acc.activeCharacterId === characterId) {
      acc.activeCharacterId = cmap.keys().next().value;
      this.syncAccountFromActiveChar(acc);
      this.schedulePersist(acc.id, acc.activeCharacterId);
    }
    return this.listCharacters(accountId);
  }

  createGuestAccount({ preferredName, faction = 'Solari', classId = 'solari_vanguard', clientProgression = null } = {}) {
    const id = `acc_${crypto.randomUUID().slice(0, 12)}`;
    const suffix = Math.floor(100 + Math.random() * 899);
    const norm = normalizeClassAndFaction(classId, faction);
    const displayName = preferredName
      ? sanitizeName(preferredName, `Vanguard_${suffix}`)
      : `Vanguard_${suffix}`;

    const preset = ORDER_PRESETS.find((o) =>
      (norm.faction === 'Solari' && o.tag === 'SUN') ||
      (norm.faction === 'Umbri' && o.tag === 'VOID') ||
      (norm.faction === 'Terra' && o.tag === 'ROOT') ||
      (norm.faction === 'Aether' && o.tag === 'AETH')
    ) || ORDER_PRESETS[0];

    const prog = this.mergeValidProgression(createDefaultProgression(), clientProgression);

    const acc = {
      id,
      username: null,
      usernameLower: null,
      displayName,
      passwordHash: null,
      isGuest: true,
      ssoSubject: null,
      tcgLinked: false,
      tcgHandle: null,
      tcgEmail: null,
      tcgSyncedAt: null,
      faction: norm.faction,
      classId: norm.classId,
      orderTag: preset.tag,
      orderName: preset.name,
      orderColor: preset.color,
      loadout: normalizeLoadout(null, norm.classId),
      equipment: normalizeEquipment(null, norm.classId),
      inventory: getDefaultStarterInventory(norm.classId),
      bank: [],
      progression: prog,
      statsMeta: { kills: 0, arenaWins: 0, siegeClaims: 0 },
      activeCharacterId: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.accountsById.set(id, acc);
    this.ensureDefaultCharacter(acc);
    this.schedulePersist(id, acc.activeCharacterId);
    return { account: acc, token: this.signToken(acc.id) };
  }

  registerAccount({
    username,
    password,
    displayName,
    faction = 'Solari',
    classId = 'solari_vanguard',
    orderTag,
    orderName,
    loadout,
    equipment,
    inventory,
    bank,
    tcgHandle,
    upgradeAccountId = null,
    clientProgression = null,
  }) {
    const cleanUser = sanitizeName(username, '').replace(/\s+/g, '');
    if (cleanUser.length < 3) throw new Error('GlimmerFall ID username must be at least 3 characters.');
    if (!password || String(password).length < 4) throw new Error('Password must be at least 4 characters.');

    const lower = cleanUser.toLowerCase();
    const existingOwner = this.idByUsername.get(lower);
    if (existingOwner && existingOwner !== upgradeAccountId) {
      throw new Error(`Username "${cleanUser}" is already claimed.`);
    }

    const norm = normalizeClassAndFaction(classId, faction);
    const preset = ORDER_PRESETS.find((o) => o.tag === sanitizeOrderTag(orderTag)) || ORDER_PRESETS[0];
    const cleanTag = sanitizeOrderTag(orderTag) || preset.tag;
    const cleanOrderName = sanitizeName(orderName, preset.name);

    let acc = upgradeAccountId ? this.accountsById.get(upgradeAccountId) : null;
    if (acc && acc.isGuest) {
      this.ensureDefaultCharacter(acc);
      const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
      acc.username = cleanUser;
      acc.usernameLower = lower;
      acc.displayName = sanitizeName(displayName || cleanUser, cleanUser);
      acc.passwordHash = this.hashPassword(password);
      acc.isGuest = false;
      if (ch && ch.faction && ch.classId && (!faction || faction === 'Solari')) {
        acc.faction = ch.faction;
        acc.classId = ch.classId;
      } else {
        acc.faction = norm.faction;
        acc.classId = norm.classId;
      }
      acc.orderTag = cleanTag;
      acc.orderName = cleanOrderName;
      if (loadout) acc.loadout = normalizeLoadout(loadout, acc.classId);
      if (equipment) acc.equipment = normalizeEquipment(equipment, acc.classId);
      if (inventory) acc.inventory = normalizeInventory(inventory);
      if (bank) acc.bank = normalizeBank(bank);
      if (tcgHandle) {
        acc.tcgLinked = true;
        acc.tcgHandle = sanitizeName(tcgHandle, cleanUser);
        acc.tcgSyncedAt = new Date().toISOString();
      }
      if (clientProgression) {
        acc.progression = this.mergeValidProgression(acc.progression, clientProgression);
      }
      acc.lastLoginAt = new Date().toISOString();
      this.idByUsername.set(lower, acc.id);
      if (ch) {
        ch.name = acc.displayName;
        ch.faction = acc.faction;
        ch.classId = acc.classId;
        ch.orderTag = acc.orderTag;
        ch.orderName = acc.orderName;
        if (loadout) ch.loadout = acc.loadout;
        if (equipment) ch.equipment = acc.equipment;
        if (inventory) ch.inventory = acc.inventory;
        if (bank) ch.bank = acc.bank;
      }
      this.schedulePersist(acc.id, acc.activeCharacterId);
      return { account: acc, token: this.signToken(acc.id) };
    }

    const id = `acc_${crypto.randomUUID().slice(0, 12)}`;
    acc = {
      id,
      username: cleanUser,
      usernameLower: lower,
      displayName: sanitizeName(displayName || cleanUser, cleanUser),
      passwordHash: this.hashPassword(password),
      isGuest: false,
      ssoSubject: null,
      tcgLinked: Boolean(tcgHandle),
      tcgHandle: tcgHandle ? sanitizeName(tcgHandle, cleanUser) : null,
      tcgEmail: null,
      tcgSyncedAt: tcgHandle ? new Date().toISOString() : null,
      faction: norm.faction,
      classId: norm.classId,
      orderTag: cleanTag,
      orderName: cleanOrderName,
      orderColor: preset.color,
      loadout: normalizeLoadout(loadout || null, norm.classId),
      equipment: normalizeEquipment(equipment || null, norm.classId),
      inventory: normalizeInventory(inventory || getDefaultStarterInventory(norm.classId)),
      progression: this.mergeValidProgression(createDefaultProgression(), clientProgression),
      statsMeta: { kills: 0, arenaWins: 0, siegeClaims: 0 },
      activeCharacterId: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.accountsById.set(id, acc);
    this.idByUsername.set(lower, id);
    this.ensureDefaultCharacter(acc);
    this.schedulePersist(id, acc.activeCharacterId);
    return { account: acc, token: this.signToken(acc.id) };
  }

  loginAccount({ username, password }) {
    const lower = String(username || '').trim().toLowerCase();
    const id = this.idByUsername.get(lower);
    if (!id) throw new Error('GlimmerFall ID not found. Check your username or Register.');
    const acc = this.accountsById.get(id);
    if (!acc || !this.verifyPassword(password, acc.passwordHash)) {
      throw new Error('Invalid password for this GlimmerFall ID.');
    }
    acc.lastLoginAt = new Date().toISOString();
    this.ensureDefaultCharacter(acc);
    this.schedulePersist(acc.id, acc.activeCharacterId);
    return { account: acc, token: this.signToken(acc.id) };
  }

  linkGlimmerFallTcgAccount(accountId, { tcgHandle, tcgEmail, ssoToken }) {
    const acc = this.accountsById.get(accountId);
    if (!acc) throw new Error('Account session not found.');
    if (ssoToken && ssoToken.split('.').length === 3) {
      try {
        const claims = JSON.parse(Buffer.from(ssoToken.split('.')[1], 'base64url').toString('utf8'));
        if (claims.email && !tcgEmail) tcgEmail = claims.email;
        if ((claims.username || claims.preferred_username) && !tcgHandle) {
          tcgHandle = claims.username || claims.preferred_username;
        }
      } catch (_) {}
    }
    const handle = sanitizeName(tcgHandle || (tcgEmail ? tcgEmail.split('@')[0] : ''), '');
    if (!handle) throw new Error('Enter your glimmerfalltcg.com Summoner handle or email to link.');

    acc.tcgLinked = true;
    acc.tcgHandle = handle;
    acc.tcgEmail = tcgEmail ? String(tcgEmail).trim().slice(0, 80) : acc.tcgEmail;
    acc.tcgSyncedAt = new Date().toISOString();
    this.schedulePersist(acc.id, acc.activeCharacterId);
    return acc;
  }

  updateProfile(accountId, { displayName, faction, classId, orderTag, orderName, orderColor, loadout, equipment, inventory, bank }) {
    const acc = this.accountsById.get(accountId);
    if (!acc) throw new Error('Account not found.');
    this.ensureDefaultCharacter(acc);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);

    if (displayName !== undefined) acc.displayName = sanitizeName(displayName, acc.displayName);
    if (classId || faction) {
      const norm = normalizeClassAndFaction(classId || acc.classId, faction || acc.faction);
      const classChanged = norm.classId !== acc.classId;
      acc.faction = norm.faction;
      acc.classId = norm.classId;
      if (classChanged && !loadout) {
        acc.loadout = normalizeLoadout(null, norm.classId);
      }
      if (classChanged && !equipment) {
        acc.equipment = normalizeEquipment(null, norm.classId);
      }
    }
    if (loadout) acc.loadout = normalizeLoadout(loadout, acc.classId);
    if (equipment) acc.equipment = normalizeEquipment(equipment, acc.classId);
    if (inventory) acc.inventory = normalizeInventory(inventory);
    if (bank) acc.bank = normalizeBank(bank);

    if (orderTag !== undefined) {
      const tag = sanitizeOrderTag(orderTag);
      acc.orderTag = tag || 'NONE';
      const preset = ORDER_PRESETS.find((o) => o.tag === tag);
      if (preset && !orderName) acc.orderName = preset.name;
      if (preset && !orderColor) acc.orderColor = preset.color;
    }
    if (orderName !== undefined) acc.orderName = sanitizeName(orderName, acc.orderName || 'Freelance');
    if (orderColor && /^#[0-9a-fA-F]{6}$/.test(orderColor)) acc.orderColor = orderColor;

    if (ch) {
      ch.name = acc.displayName;
      ch.faction = acc.faction;
      ch.classId = acc.classId;
      ch.orderTag = acc.orderTag;
      ch.orderName = acc.orderName;
      ch.orderColor = acc.orderColor;
      ch.loadout = acc.loadout;
      ch.equipment = acc.equipment;
      ch.inventory = acc.inventory;
      if (bank) ch.bank = acc.bank;
    }

    this.schedulePersist(acc.id, ch?.id);
    return acc;
  }

  addItemToInventory(accountId, itemId, qty = 1) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return false;
    this.ensureDefaultCharacter(acc);
    if (!acc.inventory) acc.inventory = [];

    const existing = acc.inventory.find((i) => (typeof i === 'string' ? i : i.id) === itemId);
    if (existing) {
      if (typeof existing === 'string') {
        const idx = acc.inventory.indexOf(existing);
        acc.inventory[idx] = { id: itemId, qty: 1 + (qty || 1) };
      } else {
        existing.qty = (existing.qty || 1) + (qty || 1);
      }
    } else {
      if (acc.inventory.length >= 28) return false;
      acc.inventory.push({ id: itemId, qty: qty || 1 });
    }

    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) ch.inventory = acc.inventory;
    this.schedulePersist(acc.id, ch?.id);
    return true;
  }

  removeItemFromInventory(accountId, slotIndex, qty = 1) {
    const acc = this.accountsById.get(accountId);
    if (!acc || !acc.inventory) return false;
    if (slotIndex < 0 || slotIndex >= acc.inventory.length) return false;
    const it = acc.inventory[slotIndex];
    if (typeof it === 'object' && it.qty > qty) {
      it.qty -= qty;
    } else {
      acc.inventory.splice(slotIndex, 1);
    }
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) ch.inventory = acc.inventory;
    this.schedulePersist(acc.id, ch?.id);
    return true;
  }

  spendGold(accountId, amount) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return { success: false, reason: 'Account missing' };
    this.ensureDefaultCharacter(acc);
    if (!acc.inventory) acc.inventory = [];

    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    let availableGold = acc.gold || 0;
    for (const it of acc.inventory) {
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === 'solar_gold') {
        availableGold += (typeof it === 'object' && it.qty ? it.qty : 1);
      }
    }
    if (availableGold < cost) {
      return { success: false, reason: 'Not enough Solar Gold', availableGold };
    }

    let needed = cost;
    for (let i = 0; i < acc.inventory.length; i++) {
      const it = acc.inventory[i];
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === 'solar_gold') {
        const currentQty = typeof it === 'object' && it.qty ? it.qty : 1;
        if (currentQty <= needed) {
          needed -= currentQty;
          acc.inventory.splice(i, 1);
          i--;
        } else {
          it.qty -= needed;
          needed = 0;
          break;
        }
      }
    }
    if (needed > 0 && acc.gold) {
      acc.gold = Math.max(0, acc.gold - needed);
    }

    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      ch.inventory = acc.inventory;
      ch.gold = acc.gold;
    }
    this.schedulePersist(acc.id, ch?.id);
    return { success: true, remainingGold: availableGold - cost };
  }

  buyMerchantItem(accountId, itemId, unitPrice, qty = 1) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return { success: false, reason: 'Account missing' };
    this.ensureDefaultCharacter(acc);
    if (!acc.inventory) acc.inventory = [];

    const totalCost = (unitPrice || 0) * (qty || 1);
    let availableGold = acc.gold || 0;
    for (const it of acc.inventory) {
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === 'solar_gold') {
        availableGold += (typeof it === 'object' && it.qty ? it.qty : 1);
      }
    }

    if (availableGold < totalCost) {
      return { success: false, reason: 'Not enough Solar Gold' };
    }

    const itemDef = EQUIPMENT_CATALOG[itemId];
    const isStackable = Boolean(itemDef?.stackable);
    const existingSlot = isStackable ? acc.inventory.find(i => (typeof i === 'string' ? i : i.id) === itemId) : null;
    if (!existingSlot && acc.inventory.length >= 28) {
      return { success: false, reason: 'Inventory full (28/28)' };
    }

    // Deduct gold
    let needed = totalCost;
    for (let i = 0; i < acc.inventory.length; i++) {
      const it = acc.inventory[i];
      if (!it) continue;
      const id = typeof it === 'string' ? it : it.id;
      if (id === 'solar_gold') {
        const currentQty = typeof it === 'object' && it.qty ? it.qty : 1;
        if (currentQty <= needed) {
          needed -= currentQty;
          acc.inventory.splice(i, 1);
          i--;
        } else {
          it.qty -= needed;
          needed = 0;
          break;
        }
      }
    }
    if (needed > 0 && acc.gold) {
      acc.gold = Math.max(0, acc.gold - needed);
    }

    // Add item
    if (isStackable) {
      const existing = acc.inventory.find(i => (typeof i === 'string' ? i : i.id) === itemId);
      if (existing) {
        if (typeof existing === 'string') {
          const idx = acc.inventory.indexOf(existing);
          acc.inventory[idx] = { id: itemId, qty: 1 + qty };
        } else {
          existing.qty = (existing.qty || 1) + qty;
        }
      } else {
        acc.inventory.push({ id: itemId, qty });
      }
    } else {
      for (let i = 0; i < qty && acc.inventory.length < 28; i++) {
        acc.inventory.push({ id: itemId, qty: 1 });
      }
    }

    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      ch.inventory = acc.inventory;
      ch.gold = acc.gold;
    }
    this.schedulePersist(acc.id, ch?.id);
    return { success: true, item: itemDef, remainingGold: availableGold - totalCost };
  }

  equipFromInventory(accountId, slotIndex, preferredSocket = null) {
    const acc = this.accountsById.get(accountId);
    if (!acc || !acc.inventory) return { success: false, reason: 'Account or inventory missing' };
    if (slotIndex < 0 || slotIndex >= acc.inventory.length) return { success: false, reason: 'Invalid slot' };
    const invItem = acc.inventory[slotIndex];
    if (!invItem) return { success: false, reason: 'Item not found' };
    const itemDef = EQUIPMENT_CATALOG[invItem.id];
    if (!itemDef) return { success: false, reason: 'Invalid item data' };

    const currentEquip = { ...(acc.equipment || {}) };
    let targetSlot = itemDef.slot === 'armor' ? 'body' : itemDef.slot === 'offhand' ? 'shield' : itemDef.slot;
    if (itemDef.slot === 'socket_gem') {
      const socketCandidates = ['socket_weapon', 'socket_body', 'socket_head'];
      if (preferredSocket && socketCandidates.includes(preferredSocket)) {
        targetSlot = preferredSocket;
      } else {
        targetSlot = socketCandidates.find((sk) => !currentEquip[sk]) || 'socket_weapon';
      }
    }
    if (!VALID_EQUIP_SLOTS.includes(targetSlot)) {
      return { success: false, reason: 'Item cannot be equipped' };
    }
    const oldEquippedId = currentEquip[targetSlot] || (targetSlot === 'body' ? currentEquip.armor : targetSlot === 'shield' ? currentEquip.offhand : null);
    if (oldEquippedId === invItem.id) {
      return { success: false, reason: 'Already equipped in that slot' };
    }

    currentEquip[targetSlot] = invItem.id;
    if (targetSlot === 'body') currentEquip.armor = invItem.id;
    if (targetSlot === 'shield') currentEquip.offhand = invItem.id;

    if (oldEquippedId && oldEquippedId !== invItem.id) {
      if (invItem.qty > 1) {
        invItem.qty--;
        const existingOld = acc.inventory.find((it) => (typeof it === 'string' ? it : it?.id) === oldEquippedId);
        if (existingOld) {
          existingOld.qty = (existingOld.qty || 1) + 1;
        } else {
          acc.inventory.push({ id: oldEquippedId, qty: 1 });
        }
      } else {
        acc.inventory[slotIndex] = { id: oldEquippedId, qty: 1 };
      }
    } else {
      if (invItem.qty > 1) {
        invItem.qty--;
      } else {
        acc.inventory.splice(slotIndex, 1);
      }
    }
    acc.equipment = normalizeEquipment(currentEquip, acc.classId);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      ch.equipment = acc.equipment;
      ch.inventory = acc.inventory;
    }
    this.schedulePersist(acc.id, ch?.id);
    return { success: true, item: itemDef, oldEquippedId };
  }

  unequipToInventory(accountId, slotKey) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return { success: false, reason: 'Account missing' };
    if (!acc.inventory) acc.inventory = [];

    const currentEquip = { ...(acc.equipment || {}) };
    const itemId = currentEquip[slotKey] || (slotKey === 'body' ? currentEquip.armor : slotKey === 'shield' ? currentEquip.offhand : null);
    if (!itemId) return { success: false, reason: 'Slot is already empty' };

    const existing = acc.inventory.find((i) => (typeof i === 'string' ? i : i.id) === itemId);
    if (!existing && acc.inventory.length >= 28) return { success: false, reason: 'Inventory is full (28/28)' };

    delete currentEquip[slotKey];
    if (slotKey === 'body') delete currentEquip.armor;
    if (slotKey === 'armor') delete currentEquip.body;
    if (slotKey === 'shield') delete currentEquip.offhand;
    if (slotKey === 'offhand') delete currentEquip.shield;

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      acc.inventory.push({ id: itemId, qty: 1 });
    }
    acc.equipment = normalizeEquipment(currentEquip, acc.classId);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      ch.equipment = acc.equipment;
      ch.inventory = acc.inventory;
    }
    this.schedulePersist(acc.id, ch?.id);
    return { success: true, itemId, item: EQUIPMENT_CATALOG[itemId] };
  }

  saveProfessionProgress(accountId, incomingProfessions) {
    const acc = this.accountsById.get(accountId);
    if (!acc || !incomingProfessions || typeof incomingProfessions !== 'object') return null;
    const base = acc.progression || createDefaultProgression();
    const professions = {
      ...createDefaultProgression().professions,
      ...(base.professions || {}),
    };

    for (const professionId of Object.keys(PROFESSIONS_CATALOG)) {
      const incoming = incomingProfessions[professionId];
      if (!incoming || typeof incoming !== 'object') continue;
      const current = professions[professionId] || { xp: 0, level: 1 };
      const currentXp = Math.max(0, Math.floor(Number(current.xp) || 0));
      const incomingXp = Math.max(0, Math.floor(Number(incoming.xp) || 0));
      const xp = Math.min(500_000_000, Math.max(currentXp, incomingXp));
      professions[professionId] = {
        ...current,
        xp,
        level: getProfessionLevelFromXp(xp),
        masteryCapeAwarded: Boolean(current.masteryCapeAwarded || incoming.masteryCapeAwarded),
      };
    }

    acc.progression = { ...base, professions };
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) ch.progression = acc.progression;
    this.schedulePersist(acc.id, ch?.id);
    return acc.progression;
  }

  mergeValidProgression(base, incoming) {
    if (!incoming || typeof incoming !== 'object') return base;
    const lvl = Math.max(1, Math.min(50, Number(incoming.level) || base.level));
    const xp = Math.max(0, Math.floor(Number(incoming.xp) || 0));
    const statPoints = Math.max(0, Math.min(200, Math.floor(Number(incoming.statPoints ?? base.statPoints))));
    const skillPoints = Math.max(0, Math.min(60, Math.floor(Number(incoming.skillPoints ?? base.skillPoints))));
    const stats = {
      power: Math.max(1, Math.min(99, Math.floor(Number(incoming.stats?.power ?? base.stats.power)))),
      bastion: Math.max(1, Math.min(99, Math.floor(Number(incoming.stats?.bastion ?? base.stats.bastion)))),
      resonance: Math.max(1, Math.min(99, Math.floor(Number(incoming.stats?.resonance ?? base.stats.resonance)))),
      tempo: Math.max(1, Math.min(99, Math.floor(Number(incoming.stats?.tempo ?? base.stats.tempo)))),
    };
    const ranks = { ...base.ranks };
    if (incoming.ranks && typeof incoming.ranks === 'object') {
      for (const k of ACTION_SLOTS) {
        if (incoming.ranks[k] !== undefined) {
          ranks[k] = Math.max(1, Math.min(5, Math.floor(Number(incoming.ranks[k]) || 1)));
        }
      }
    }
    const skills = { ...(base.skills || {}) };
    if (incoming.skills && typeof incoming.skills === 'object') {
      for (const [k, v] of Object.entries(incoming.skills)) {
        skills[k] = Math.max(0, Math.min(5, Math.floor(Number(v) || 0)));
      }
    }
    const professions = {
      combat_mastery: { xp: 0, level: 1 },
      rites: { xp: 0, level: 1 },
      flashes: { xp: 0, level: 1 },
      resonance_extraction: { xp: 0, level: 1 },
      relic_forging: { xp: 0, level: 1 },
      rite_binding: { xp: 0, level: 1 },
      glimmerweaving: { xp: 0, level: 1 },
      ...(base.professions || {}),
    };
    if (incoming.professions && typeof incoming.professions === 'object') {
      for (const [k, v] of Object.entries(incoming.professions)) {
        if (professions[k] !== undefined && v && typeof v === 'object') {
          const xp = Math.max(0, Math.floor(Number(v.xp) || 0));
          const level = getProfessionLevelFromXp(xp);
          professions[k] = {
            xp,
            level,
            masteryCapeAwarded: Boolean(base.professions?.[k]?.masteryCapeAwarded || v.masteryCapeAwarded),
          };
        }
      }
    }
    return { level: lvl, xp, statPoints, skillPoints, stats, ranks, skills, professions };
  }

  saveProgression(accountId, progression, statsMetaPatch = null) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return;
    acc.progression = this.mergeValidProgression(acc.progression, progression);
    if (statsMetaPatch) {
      acc.statsMeta = {
        kills: (acc.statsMeta?.kills || 0) + (statsMetaPatch.addKills || 0),
        arenaWins: (acc.statsMeta?.arenaWins || 0) + (statsMetaPatch.addArenaWins || 0),
        siegeClaims: (acc.statsMeta?.siegeClaims || 0) + (statsMetaPatch.addSiegeClaims || 0),
      };
    }
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      ch.progression = acc.progression;
      ch.statsMeta = acc.statsMeta;
    }
    this.schedulePersist(acc.id, ch?.id);
  }

  syncBankAndInventory(accountId, bank, inventory, equipment = null) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return;
    this.ensureDefaultCharacter(acc);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      if (Array.isArray(bank)) ch.bank = normalizeBank(bank);
      if (Array.isArray(inventory)) ch.inventory = normalizeInventory(inventory);
      if (equipment && typeof equipment === 'object') ch.equipment = normalizeEquipment(equipment, ch.classId);
    }
    if (Array.isArray(bank)) acc.bank = ch ? ch.bank : normalizeBank(bank);
    if (Array.isArray(inventory)) acc.inventory = ch ? ch.inventory : normalizeInventory(inventory);
    if (equipment && typeof equipment === 'object') acc.equipment = ch ? ch.equipment : normalizeEquipment(equipment, acc.classId);
    this.schedulePersist(acc.id, ch?.id);
  }

  saveQuestState(accountId, questState) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return;
    this.ensureDefaultCharacter(acc);
    if (questState && typeof questState === 'object') {
      acc.questState = questState;
      const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
      if (ch) {
        ch.questState = questState;
      }
      this.schedulePersist(acc.id, ch?.id);
    }
  }

  toPublicProfile(acc) {
    if (!acc) return null;
    this.ensureDefaultCharacter(acc);
    this.syncAccountFromActiveChar(acc);
    const activeChar = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    const resolved = resolveFactionAndClass({
      faction: activeChar?.faction || acc.faction,
      classId: activeChar?.classId || acc.classId,
      loadout: activeChar?.loadout || acc.loadout,
      orderTag: activeChar?.orderTag || acc.orderTag,
    });
    return {
      id: acc.id,
      username: acc.username,
      displayName: activeChar?.name || acc.displayName,
      isGuest: acc.isGuest,
      tcgLinked: acc.tcgLinked,
      tcgHandle: acc.tcgHandle,
      tcgEmail: acc.tcgEmail,
      faction: resolved.faction,
      classId: resolved.classId,
      orderTag: activeChar?.orderTag || acc.orderTag || (resolved.faction === 'Umbri' ? 'VOID' : resolved.faction === 'Terra' ? 'ROOT' : resolved.faction === 'Aether' ? 'AETH' : 'SUN'),
      orderName: activeChar?.orderName || acc.orderName || `Order of ${resolved.faction}`,
      orderColor: activeChar?.orderColor || acc.orderColor || '#facc15',
      loadout: activeChar?.loadout || acc.loadout || {},
      equipment: activeChar?.equipment || acc.equipment || {},
      inventory: activeChar?.inventory || acc.inventory || [],
      bank: Array.isArray(activeChar?.bank) ? activeChar.bank : [],
      questState: activeChar?.questState || acc.questState || {},
      progression: activeChar?.progression || acc.progression || {},
      statsMeta: activeChar?.statsMeta || acc.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      activeCharacterId: acc.activeCharacterId,
      characters: this.listCharacters(acc.id),
      dbConnected: this.dbConnected,
    };
  }
}
