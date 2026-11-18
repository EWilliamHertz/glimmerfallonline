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
  MAX_BASE_LEVEL,
  resolveFactionAndClass,
  PROFESSIONS_CATALOG,
  getProfessionLevelFromXp,
  sanitizeLoadout,
  sanitizeProgressionSkills,
  shouldAutoRemasterRespec,
  respecCharacterSkills,
  validateCharacterName,
  isReservedName,
  isProfane,
  maskProfanity,
  normalizeFamiliarState,
  normalizeMailbox,
  sanitizeMailText,
  createStarterMailParcel,
  MAIL_POSTAGE_GOLD,
  MAX_MAILBOX_ITEMS,
  countBagItem,
  deductBagItems,
  addBagItem,
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

export {
  validateCharacterName,
  isReservedName,
  isProfane,
  maskProfanity,
};

export function getOrderPresetForFaction(faction, orderTag = null) {
  const cleanTag = sanitizeOrderTag(orderTag);
  if (cleanTag) {
    const byTag = ORDER_PRESETS.find((o) => o.tag === cleanTag);
    if (byTag) return byTag;
  }
  const cleanFac = String(faction || '').trim().toLowerCase();
  if (cleanFac === 'terra' || cleanFac === 'terro' || cleanFac === 'earth' || cleanFac === 'root') {
    return ORDER_PRESETS.find((o) => o.tag === 'ROOT') || ORDER_PRESETS[2];
  }
  if (cleanFac === 'umbri' || cleanFac === 'shadow' || cleanFac === 'void') {
    return ORDER_PRESETS.find((o) => o.tag === 'VOID') || ORDER_PRESETS[1];
  }
  if (cleanFac === 'aether' || cleanFac === 'magic' || cleanFac === 'arcane') {
    return ORDER_PRESETS.find((o) => o.tag === 'AETH') || ORDER_PRESETS[3];
  }
  return ORDER_PRESETS.find((o) => o.tag === 'SUN') || ORDER_PRESETS[0];
}

export function normalizeClassAndFaction(classId, faction) {
  const cleanFac = String(faction || '').trim().toLowerCase();
  let canonicalFac = null;
  if (cleanFac === 'solari' || cleanFac === 'sun') canonicalFac = 'Solari';
  else if (cleanFac === 'umbri' || cleanFac === 'shadow' || cleanFac === 'void') canonicalFac = 'Umbri';
  else if (cleanFac === 'terra' || cleanFac === 'terro' || cleanFac === 'earth' || cleanFac === 'root') canonicalFac = 'Terra';
  else if (cleanFac === 'aether' || cleanFac === 'magic' || cleanFac === 'arcane') canonicalFac = 'Aether';

  let cls = CLASSES_CATALOG[classId];
  // If classId is valid and matches canonicalFac (or no canonicalFac specified), keep it
  if (cls && (!canonicalFac || cls.faction === canonicalFac)) {
    return { classId: cls.id, faction: cls.faction, cls };
  }

  // If a canonical faction is specified, find its primary class
  if (canonicalFac) {
    const byFac = Object.values(CLASSES_CATALOG).find((c) => c.faction === canonicalFac);
    if (byFac) return { classId: byFac.id, faction: byFac.faction, cls: byFac };
  }

  // If classId is valid without matching faction
  if (cls) {
    return { classId: cls.id, faction: cls.faction, cls };
  }

  return { classId: 'solari_vanguard', faction: 'Solari', cls: CLASSES_CATALOG.solari_vanguard };
}

// Loadouts are sanitized in one place so offline and server characters agree on
// the "slot 1 only" starting bar and on legacy default migrations.
export function normalizeLoadout(rawLoadout, classId, prog = null) {
  return sanitizeLoadout(rawLoadout, classId, prog);
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
    this.serialKeys = new Map(); // keyCode -> { key, tier, note, createdAt, redeemedBy, redeemedUsername, redeemedAt }
    this.dirtyAccounts = new Set();
    this.dirtyCharacters = new Set();
    this.flushTimer = null;
    this._inFlightFlush = null;
    this.loadSerialKeysLocal();
  }

  async init() {
    try {
      this.dbConnected = await initDatabaseSchema();
      if (this.dbConnected) {
        this.db = getDbPool();
        await this.loadAllFromPostgres();
        await this.loadSerialKeysFromPostgres();
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
      const resolvedAcc = resolveFactionAndClass({
        faction: row.faction,
        classId: row.class_id,
        loadout: row.loadout,
        orderTag: row.order_tag,
      });
      const accPreset = getOrderPresetForFaction(resolvedAcc.faction, row.order_tag);
      const accProg = this.mergeValidProgression(createDefaultProgression(), row.progression);
    if (shouldAutoRemasterRespec(accProg)) {
      respecCharacterSkills(accProg);
      this.dirtyAccounts.add(row.id);
    }
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
        faction: resolvedAcc.faction,
        classId: resolvedAcc.classId,
        orderTag: row.order_tag || accPreset.tag,
        orderName: row.order_name || accPreset.name,
        orderColor: row.order_color || accPreset.color,
        loadout: normalizeLoadout(row.loadout, resolvedAcc.classId, accProg),
        equipment: normalizeEquipment(row.equipment, resolvedAcc.classId),
        inventory: normalizeInventory(row.inventory || getDefaultStarterInventory(resolvedAcc.classId)),
        bank: normalizeBank(row.bank || []),
        questState: row.quest_state || {},
        progression: accProg,
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
      const chPreset = getOrderPresetForFaction(resolved.faction, row.order_tag);
      const chProg = this.mergeValidProgression(createDefaultProgression(), row.progression);
      if (shouldAutoRemasterRespec(chProg)) {
        respecCharacterSkills(chProg);
        this.dirtyCharacters.add(row.id);
      }
      const ch = {
        id: row.id,
        accountId: row.account_id,
        name: row.name,
        faction: resolved.faction,
        classId: resolved.classId,
        orderTag: row.order_tag || chPreset.tag,
        orderName: row.order_name || chPreset.name,
        orderColor: row.order_color || chPreset.color,
        homeBiome: row.home_biome || ROOM_TYPES.SANCTUARY_HUB,
        loadout: normalizeLoadout(row.loadout, resolved.classId, chProg),
        equipment: normalizeEquipment(row.equipment, resolved.classId),
        inventory: normalizeInventory(row.inventory || getDefaultStarterInventory(resolved.classId)),
        bank: normalizeBank(row.bank || []),
        questState: row.quest_state || {},
        unlockedGear: Array.isArray(row.unlocked_gear) ? row.unlocked_gear : Object.keys(EQUIPMENT_CATALOG),
        progression: chProg,
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
    const accProg = this.mergeValidProgression(createDefaultProgression(), row.progression);
    if (shouldAutoRemasterRespec(accProg)) {
      respecCharacterSkills(accProg);
      this.dirtyAccounts.add(row.id);
    }
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
      orderTag: row.order_tag || getOrderPresetForFaction(resolved.faction, row.order_tag).tag,
      orderName: row.order_name || getOrderPresetForFaction(resolved.faction, row.order_tag).name,
      orderColor: row.order_color || getOrderPresetForFaction(resolved.faction, row.order_tag).color,
      loadout: normalizeLoadout(row.loadout, resolved.classId, accProg),
      equipment: normalizeEquipment(row.equipment, resolved.classId),
      inventory: normalizeInventory(row.inventory || getDefaultStarterInventory(resolved.classId)),
      bank: normalizeBank(row.bank || []),
      questState: row.quest_state || {},
      progression: accProg,
      statsMeta: row.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      activeCharacterId: row.active_character_id || null,
      hp: row.hp != null ? Number(row.hp) : null,
      solarCharge: row.solar_charge != null ? Number(row.solar_charge) : null,
      lastPosition: row.last_position || null,
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
    if (this._inFlightFlush) {
      await this._inFlightFlush.catch(() => {});
    }
    if (this.dirtyAccounts.size > 0 || this.dirtyCharacters.size > 0) {
      await this.flushToPostgres().catch(() => {});
    }
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
        if (this.dirtyAccounts.has(accRow.id) || this._inFlightFlush) {
          return;
        }
        const acc = this.hydrateAccountRow(accRow);
        const cRes = await this.db.query('SELECT * FROM glimmerfall_characters WHERE account_id = $1 ORDER BY created_at ASC', [acc.id]);
        const cmap = this.charactersByAccount.get(acc.id);
        for (const r of cRes.rows) {
          if (this.dirtyCharacters.has(r.id)) continue;
          const charResolved = resolveFactionAndClass({
            faction: r.faction,
            classId: r.class_id,
            loadout: r.loadout,
            orderTag: r.order_tag,
          });
          const charProg = this.mergeValidProgression(createDefaultProgression(), r.progression);
          if (shouldAutoRemasterRespec(charProg)) {
            respecCharacterSkills(charProg);
            this.dirtyCharacters.add(r.id);
          }
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
            loadout: normalizeLoadout(r.loadout, charResolved.classId, charProg),
            equipment: normalizeEquipment(r.equipment, charResolved.classId),
            inventory: normalizeInventory(r.inventory || getDefaultStarterInventory(charResolved.classId)),
            bank: normalizeBank(r.bank || []),
            questState: r.quest_state || {},
            unlockedGear: Array.isArray(r.unlocked_gear) ? r.unlocked_gear : Object.keys(EQUIPMENT_CATALOG),
            progression: charProg,
            statsMeta: r.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
            hp: r.hp != null ? Number(r.hp) : null,
            solarCharge: r.solar_charge != null ? Number(r.solar_charge) : null,
            lastPosition: r.last_position || null,
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
    this.flushTimer?.unref?.();
  }

  async flushToPostgres() {
    const run = async () => {
      if (!this.db) return;
      const accIds = Array.from(this.dirtyAccounts);
      const charIds = Array.from(this.dirtyCharacters);
      if (accIds.length === 0 && charIds.length === 0) return;
      this.dirtyAccounts.clear();
      this.dirtyCharacters.clear();

      const accIdsSet = new Set(accIds);
      const charsToFlush = [];
      for (const cid of charIds) {
        let found = null;
        for (const cmap of this.charactersByAccount.values()) {
          if (cmap.has(cid)) {
            found = cmap.get(cid);
            break;
          }
        }
        if (!found) continue;
        charsToFlush.push(found);
        if (found.accountId && this.accountsById.has(found.accountId)) {
          accIdsSet.add(found.accountId);
        }
      }

      try {
        const accountQueries = [];
        for (const aid of accIdsSet) {
          const a = this.accountsById.get(aid);
          if (!a) continue;
          accountQueries.push(
            this.db.query(
              `INSERT INTO glimmerfall_accounts (
                id, username, username_lower, display_name, password_hash, is_guest, sso_subject,
                tcg_linked, tcg_handle, tcg_email, tcg_synced_at, faction, class_id,
                order_tag, order_name, order_color, loadout, equipment, progression, stats_meta,
                active_character_id, created_at, last_login_at, inventory, bank, quest_state, hp, solar_charge, last_position
              ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
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
                quest_state = EXCLUDED.quest_state,
                hp = EXCLUDED.hp,
                solar_charge = EXCLUDED.solar_charge,
                last_position = EXCLUDED.last_position`,
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
                a.hp != null ? a.hp : null,
                a.solarCharge != null ? a.solarCharge : null,
                JSON.stringify(a.lastPosition || null),
              ]
            )
          );
        }
        if (accountQueries.length > 0) {
          await Promise.all(accountQueries);
        }

        const characterQueries = [];
        for (const found of charsToFlush) {
          characterQueries.push(
            this.db.query(
              `INSERT INTO glimmerfall_characters (
                id, account_id, name, faction, class_id, order_tag, order_name, order_color,
                home_biome, loadout, equipment, unlocked_gear, progression, stats_meta, updated_at, inventory, bank, quest_state, hp, solar_charge, last_position
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),$15,$16,$17,$18,$19,$20)
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
                hp = EXCLUDED.hp,
                solar_charge = EXCLUDED.solar_charge,
                last_position = EXCLUDED.last_position,
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
                found.hp != null ? found.hp : null,
                found.solarCharge != null ? found.solarCharge : null,
                JSON.stringify(found.lastPosition || null),
              ]
            )
          );
        }
        if (characterQueries.length > 0) {
          await Promise.all(characterQueries);
        }
      } catch (err) {
        for (const aid of accIds) this.dirtyAccounts.add(aid);
        for (const cid of charIds) this.dirtyCharacters.add(cid);
        throw err;
      }
    };
    const prev = this._inFlightFlush;
    const p = (prev ? prev.catch(() => {}).then(run) : run());
    this._inFlightFlush = p;
    try {
      await p;
    } finally {
      if (this._inFlightFlush === p) this._inFlightFlush = null;
    }
  }

  flushSync() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    return this.flushToPostgres().catch(() => {});
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
      const norm = normalizeClassAndFaction(acc.classId, acc.faction);
      const preset = getOrderPresetForFaction(norm.faction, acc.orderTag);
      let cleanName = acc.displayName;
      if (!cleanName || (cleanName === 'Solari Vanguard' && norm.faction !== 'Solari')) {
        cleanName = acc.username || norm.cls.name;
      }
      const ch = {
        id: chId,
        accountId: acc.id,
        name: cleanName,
        faction: norm.faction,
        classId: norm.classId,
        orderTag: acc.orderTag || preset.tag,
        orderName: (acc.orderName && acc.orderName !== 'Order of Dawn') ? acc.orderName : preset.name,
        orderColor: (acc.orderColor && acc.orderColor !== '#facc15') ? acc.orderColor : preset.color,
        homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        loadout: normalizeLoadout(acc.loadout, norm.classId),
        equipment: normalizeEquipment(acc.equipment, norm.classId),
        inventory: normalizeInventory(acc.inventory || getDefaultStarterInventory(norm.classId)),
        bank: normalizeBank(acc.bank || []),
        unlockedGear: Object.keys(EQUIPMENT_CATALOG),
        progression: acc.progression,
        questState: acc.questState || {},
        statsMeta: acc.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
        hp: acc.hp != null ? acc.hp : null,
        solarCharge: acc.solarCharge != null ? acc.solarCharge : 0,
        lastPosition: acc.lastPosition || null,
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
    acc.hp = ch.hp != null ? ch.hp : null;
    acc.solarCharge = ch.solarCharge != null ? ch.solarCharge : 0;
    acc.lastPosition = ch.lastPosition || null;
  }

  isNameTaken(name, { excludeAccountId = null, excludeCharId = null } = {}) {
    if (!name) return false;
    const lower = String(name).trim().toLowerCase();
    if (this.idByUsername.has(lower)) {
      const matchAccId = this.idByUsername.get(lower);
      if (matchAccId !== excludeAccountId) return true;
    }
    for (const [accId, cmap] of this.charactersByAccount.entries()) {
      for (const [cId, ch] of cmap.entries()) {
        if (accId === excludeAccountId && (!excludeCharId || cId === excludeCharId)) continue;
        if (ch.name && ch.name.trim().toLowerCase() === lower) {
          return true;
        }
      }
    }
    return false;
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
    const PLACEHOLDER_IDS = new Set(['local_hero', 'sp_char_starter', 'mp_char_cached', 'mp_char_default']);
    if (characterId && !cmap.has(characterId)) {
      if (!name || PLACEHOLDER_IDS.has(characterId)) {
        throw new Error(`Character "${characterId}" was not found on this account.`);
      }
    }
    if (!characterId && !name && !classId && !faction && cmap.size > 0) {
      throw new Error('Explicit name or class is required to forge a new champion.');
    }

    if (characterId && cmap.has(characterId)) {
      const ch = cmap.get(characterId);
      acc.activeCharacterId = ch.id;
      if (homeBiome) ch.homeBiome = homeBiome;

      // Character name is immutable once registered
      if (!ch.name && name) {
        const vRes = validateCharacterName(name);
        if (!vRes.valid) throw new Error(vRes.error);
        if (this.isNameTaken(vRes.cleanName, { excludeAccountId: acc.id, excludeCharId: ch.id })) {
          throw new Error(`Character name "${vRes.cleanName}" is already taken by another champion.`);
        }
        ch.name = vRes.cleanName;
      }
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

    // If characterId was not explicitly passed, check if a character with this name already exists on this account
    if (!characterId && name) {
      const matchNameLower = String(name).trim().toLowerCase();
      const existingSameName = Array.from(cmap.values()).find((c) => c.name && c.name.trim().toLowerCase() === matchNameLower);
      if (existingSameName) {
        acc.activeCharacterId = existingSameName.id;
        if (homeBiome) existingSameName.homeBiome = homeBiome;
        if (faction || classId) {
          const norm = normalizeClassAndFaction(classId || existingSameName.classId, faction || existingSameName.faction);
          existingSameName.faction = norm.faction;
          existingSameName.classId = norm.classId;
        }
        if (orderTag) existingSameName.orderTag = sanitizeOrderTag(orderTag);
        if (orderName) existingSameName.orderName = sanitizeName(orderName, existingSameName.orderName);
        if (orderColor) existingSameName.orderColor = orderColor;
        if (loadout) existingSameName.loadout = normalizeLoadout(loadout, existingSameName.classId);
        if (equipment) existingSameName.equipment = normalizeEquipment(equipment, existingSameName.classId);
        if (inventory) existingSameName.inventory = normalizeInventory(inventory);
        if (bank) existingSameName.bank = normalizeBank(bank);

        this.syncAccountFromActiveChar(acc);
        this.schedulePersist(acc.id, existingSameName.id);
        return existingSameName;
      }
    }

    if (cmap.size >= 8) {
      throw new Error('Maximum of 8 characters per GlimmerFall ID reached.');
    }

    const norm = normalizeClassAndFaction(classId, faction);
    const preset = getOrderPresetForFaction(norm.faction, orderTag);

    const chId = `chr_${crypto.randomUUID().slice(0, 10)}`;
    const candidateName = name || norm.cls.name;
    const vRes = validateCharacterName(candidateName);
    if (!vRes.valid) throw new Error(vRes.error);
    if (this.isNameTaken(vRes.cleanName, { excludeAccountId: acc.id })) {
      throw new Error(`Character name "${vRes.cleanName}" is already taken by another champion.`);
    }
    const reqName = vRes.cleanName;
    const ch = {
      id: chId,
      accountId: acc.id,
      name: reqName,
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
    let displayName = `Vanguard_${suffix}`;

    if (preferredName) {
      const vRes = validateCharacterName(preferredName);
      if (vRes.valid && !this.isNameTaken(vRes.cleanName)) {
        displayName = vRes.cleanName;
      }
    }

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
    const vRes = validateCharacterName(username);
    if (!vRes.valid) throw new Error(vRes.error);
    const cleanUser = vRes.cleanName.replace(/\s+/g, '');
    if (!password || String(password).length < 4) throw new Error('Password must be at least 4 characters.');

    const lower = cleanUser.toLowerCase();
    if (this.isNameTaken(cleanUser, { excludeAccountId: upgradeAccountId })) {
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

  updateProfile(accountId, { displayName, faction, classId, orderTag, orderName, orderColor, loadout, equipment, inventory, bank, title }) {
    const acc = this.accountsById.get(accountId);
    if (!acc) throw new Error('Account not found.');
    this.ensureDefaultCharacter(acc);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);

    // Character name is immutable once registered
    if (displayName !== undefined && !acc.displayName) acc.displayName = sanitizeName(displayName, 'Champion');
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
    if (title !== undefined) {
      acc.title = title ? String(title).trim() : null;
      if (ch) ch.title = acc.title;
    }

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
    const lvl = Math.max(1, Math.min(MAX_BASE_LEVEL, Number(incoming.level) || base.level));
    const xp = Math.max(0, Math.floor(Number(incoming.xp) || 0));
    const maxStatPts = Math.max(260, MAX_BASE_LEVEL * 4);
    const maxSkillPts = Math.max(90, MAX_BASE_LEVEL + 20);
    const statPoints = Math.max(0, Math.min(maxStatPts, Math.floor(Number(incoming.statPoints ?? base.statPoints))));
    const skillPoints = Math.max(0, Math.min(maxSkillPts, Math.floor(Number(incoming.skillPoints ?? base.skillPoints))));
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
          const minRank = k === 1 || k === '1' ? 1 : 0;
          ranks[k] = Math.max(minRank, Math.min(5, Math.floor(Number(incoming.ranks[k]) || 0)));
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
    const paragonLevel = Math.max(0, Math.floor(Number(incoming.paragonLevel ?? base.paragonLevel) || 0));
    const paragonXp = Math.max(0, Math.floor(Number(incoming.paragonXp ?? base.paragonXp) || 0));
    const paragonPoints = Math.max(0, Math.floor(Number(incoming.paragonPoints ?? base.paragonPoints) || 0));
    const paragon = {
      solari_radiance: 0,
      umbri_shadowcraft: 0,
      terra_bulwark: 0,
      aether_chronoflux: 0,
      ...(base.paragon || {}),
      ...(incoming.paragon && typeof incoming.paragon === 'object' ? incoming.paragon : {}),
    };
    const tempering = {
      ...(base.tempering && typeof base.tempering === 'object' ? base.tempering : {}),
      ...(incoming.tempering && typeof incoming.tempering === 'object' ? incoming.tempering : {}),
    };
    const coreStatKeys = new Set(['power', 'bastion', 'resonance', 'tempo']);
    for (const src of [base.stats, incoming.stats]) {
      if (!src || typeof src !== 'object') continue;
      for (const [k, v] of Object.entries(src)) {
        if (coreStatKeys.has(k)) continue;
        const num = Math.max(0, Math.floor(Number(v) || 0));
        stats[k] = Math.max(Number(stats[k]) || 0, num);
      }
    }
    const completedAch = {
      ...(base.achievements?.completed && typeof base.achievements.completed === 'object' ? base.achievements.completed : {}),
      ...(incoming.achievements?.completed && typeof incoming.achievements.completed === 'object' ? incoming.achievements.completed : {}),
    };
    const unlockedTitlesSet = new Set([
      ...(Array.isArray(base.achievements?.unlockedTitles) ? base.achievements.unlockedTitles : []),
      ...(Array.isArray(incoming.achievements?.unlockedTitles) ? incoming.achievements.unlockedTitles : []),
    ]);
    const equippedTitle = incoming.equippedTitle !== undefined
      ? incoming.equippedTitle
      : (base.equippedTitle ?? null);
    const familiars = normalizeFamiliarState({
      unlockedIds: [
        ...(Array.isArray(base.familiars?.unlockedIds) ? base.familiars.unlockedIds : []),
        ...(Array.isArray(incoming.familiars?.unlockedIds) ? incoming.familiars.unlockedIds : []),
      ],
      activeId: incoming.familiars?.activeId !== undefined
        ? incoming.familiars.activeId
        : (base.familiars?.activeId ?? null),
    });
    const remasterRespecV2 = Boolean(base?.remasterRespecV2 || incoming?.remasterRespecV2);
    return sanitizeProgressionSkills({
      level: lvl,
      xp,
      statPoints,
      skillPoints,
      stats,
      ranks,
      skills,
      professions,
      paragonLevel,
      paragonXp,
      paragonPoints,
      paragon,
      tempering,
      familiars,
      achievements: {
        completed: completedAch,
        unlockedTitles: Array.from(unlockedTitlesSet),
      },
      equippedTitle,
      remasterRespecV2,
    });
  }

  saveProgression(accountId, progression, statsMetaPatch = null) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return;
    acc.progression = this.mergeValidProgression(acc.progression, progression);
    if (statsMetaPatch) {
      acc.statsMeta = {
        ...(acc.statsMeta || {}),
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

  ensureMailboxInitialized(accountId) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return [];
    this.ensureDefaultCharacter(acc);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    const meta = acc.statsMeta && typeof acc.statsMeta === 'object' ? acc.statsMeta : {};
    acc.statsMeta = meta;

    let mailbox = normalizeMailbox(meta.mailbox || ch?.statsMeta?.mailbox || []);
    let changed = false;
    if (!meta.mailboxSeeded && !ch?.statsMeta?.mailboxSeeded) {
      mailbox = [createStarterMailParcel(acc.displayName, acc.faction), ...mailbox].slice(0, MAX_MAILBOX_ITEMS);
      meta.mailboxSeeded = true;
      changed = true;
    }
    meta.mailbox = mailbox;
    if (ch) {
      ch.statsMeta = { ...(ch.statsMeta || {}), mailboxSeeded: Boolean(meta.mailboxSeeded), mailbox };
    }
    if (changed) {
      this.schedulePersist(acc.id, ch?.id);
    }
    return mailbox;
  }

  getMailbox(accountId) {
    const mailbox = this.ensureMailboxInitialized(accountId);
    const unreadCount = mailbox.filter((m) => !m.read).length;
    return { mailbox, unreadCount };
  }

  async findRecipientAccountByName(recipientName) {
    const lower = String(recipientName || '').trim().toLowerCase();
    if (!lower) return null;

    for (const [accId, cmap] of this.charactersByAccount.entries()) {
      for (const ch of cmap.values()) {
        if (String(ch.name || '').trim().toLowerCase() === lower) {
          return this.accountsById.get(accId) || null;
        }
      }
    }
    for (const acc of this.accountsById.values()) {
      if (
        String(acc.displayName || '').trim().toLowerCase() === lower ||
        String(acc.usernameLower || acc.username || '').trim().toLowerCase() === lower
      ) {
        return acc;
      }
    }

    if (this.db) {
      try {
        const cRes = await this.db.query('SELECT account_id FROM glimmerfall_characters WHERE LOWER(name) = $1 LIMIT 1', [lower]);
        let foundAccId = cRes.rows[0]?.account_id || null;
        if (!foundAccId) {
          const aRes = await this.db.query(
            'SELECT id FROM glimmerfall_accounts WHERE LOWER(display_name) = $1 OR username_lower = $1 LIMIT 1',
            [lower]
          );
          foundAccId = aRes.rows[0]?.id || null;
        }
        if (foundAccId) {
          await this.ensureFreshFromPostgres({ id: foundAccId, force: true });
          return this.accountsById.get(foundAccId) || null;
        }
      } catch (_) {}
    }
    return null;
  }

  deliverMailToAccount(recipientAccountId, parcel) {
    const targetAcc = this.accountsById.get(recipientAccountId);
    if (!targetAcc) return { error: 'Recipient account not found.' };
    const existing = this.ensureMailboxInitialized(targetAcc.id);
    const nextList = normalizeMailbox([parcel, ...existing]);
    targetAcc.statsMeta = {
      ...(targetAcc.statsMeta || {}),
      mailboxSeeded: true,
      mailbox: nextList,
    };
    const ch = this.charactersByAccount.get(targetAcc.id)?.get(targetAcc.activeCharacterId);
    if (ch) {
      ch.statsMeta = { ...(ch.statsMeta || {}), mailboxSeeded: true, mailbox: nextList };
    }
    this.schedulePersist(targetAcc.id, ch?.id);
    return { ok: true, mailbox: nextList, unreadCount: nextList.filter((m) => !m.read).length };
  }

  deliverSystemMail(recipientAccountId, { fromName = 'Sanctuary Herald', subject, body, gold = 0, items = [], kind = 'system' }) {
    const parcel = {
      id: `mail_${crypto.randomUUID().slice(0, 10)}`,
      fromName: sanitizeMailText(fromName, 28) || 'Sanctuary Herald',
      fromAccountId: null,
      subject: sanitizeMailText(subject || 'Sanctuary Dispatch', 64),
      body: sanitizeMailText(body || '', 420),
      gold: Math.max(0, Math.floor(Number(gold) || 0)),
      items: Array.isArray(items) ? items : [],
      read: false,
      claimed: gold <= 0 && (!Array.isArray(items) || items.length === 0),
      kind,
      createdAt: new Date().toISOString(),
    };
    return this.deliverMailToAccount(recipientAccountId, parcel);
  }

  async sendMailParcel({
    senderAccountId,
    recipientName,
    subject = '',
    body = '',
    attachGold = 0,
    attachItemId = null,
    attachItemQty = 1,
  }) {
    const senderAcc = this.accountsById.get(senderAccountId);
    if (!senderAcc) return { error: 'Sender session missing.' };
    this.ensureDefaultCharacter(senderAcc);
    this.syncAccountFromActiveChar(senderAcc);

    const cleanRecipient = sanitizeMailText(recipientName, 24);
    if (!cleanRecipient) return { error: 'Enter a recipient champion name.' };
    const cleanSubject = maskProfanity(sanitizeMailText(subject, 64)) || 'Courier Dispatch';
    const cleanBody = maskProfanity(sanitizeMailText(body, 420));
    if (!cleanBody && !(attachGold > 0) && !attachItemId) {
      return { error: 'Write a message or attach gold/an item.' };
    }

    const recipientAcc = await this.findRecipientAccountByName(cleanRecipient);
    if (!recipientAcc) {
      return { error: `No registered or online champion named "${cleanRecipient}" was found.` };
    }

    const cleanGold = Math.max(0, Math.min(999999, Math.floor(Number(attachGold) || 0)));
    const totalGoldCost = MAIL_POSTAGE_GOLD + cleanGold;
    const inv = Array.isArray(senderAcc.inventory) ? senderAcc.inventory : (senderAcc.inventory = []);
    if (countBagItem(inv, 'solar_gold') < totalGoldCost) {
      return { error: `Need ${totalGoldCost} Gold (${MAIL_POSTAGE_GOLD}g postage + ${cleanGold}g attached).` };
    }

    const itemsToAttach = [];
    if (attachItemId) {
      const itemDef = EQUIPMENT_CATALOG[attachItemId];
      if (!itemDef || attachItemId === 'solar_gold') {
        return { error: 'Invalid item selected for mail parcel.' };
      }
      const cleanQty = itemDef.stackable ? Math.max(1, Math.min(999, Math.floor(Number(attachItemQty) || 1))) : 1;
      if (countBagItem(inv, attachItemId) < cleanQty) {
        return { error: `You do not have ${cleanQty}x ${itemDef.name} in your bag.` };
      }
      itemsToAttach.push({ id: attachItemId, qty: cleanQty });
    }

    deductBagItems(inv, 'solar_gold', totalGoldCost);
    for (const att of itemsToAttach) {
      deductBagItems(inv, att.id, att.qty);
    }

    const senderCh = this.charactersByAccount.get(senderAcc.id)?.get(senderAcc.activeCharacterId);
    if (senderCh) senderCh.inventory = inv;
    this.schedulePersist(senderAcc.id, senderCh?.id);

    const parcel = {
      id: `mail_${crypto.randomUUID().slice(0, 10)}`,
      fromName: senderAcc.displayName || 'Adventurer',
      fromAccountId: senderAcc.id,
      subject: cleanSubject,
      body: cleanBody,
      gold: cleanGold,
      items: itemsToAttach,
      read: false,
      claimed: cleanGold === 0 && itemsToAttach.length === 0,
      kind: 'player',
      createdAt: new Date().toISOString(),
    };
    const delivery = this.deliverMailToAccount(recipientAcc.id, parcel);
    if (delivery.error) return delivery;

    return {
      ok: true,
      parcel,
      recipientAccountId: recipientAcc.id,
      recipientName: recipientAcc.displayName,
      postagePaid: MAIL_POSTAGE_GOLD,
    };
  }

  claimMailParcel(accountId, mailId) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return { error: 'Account not found.' };
    const mailbox = this.ensureMailboxInitialized(accountId);
    const mail = mailbox.find((m) => m.id === mailId);
    if (!mail) return { error: 'Mail dispatch not found.' };
    if (mail.claimed) return { error: 'Attachments already claimed.' };

    const inv = Array.isArray(acc.inventory) ? acc.inventory : (acc.inventory = []);
    let neededNewSlots = 0;
    if (mail.gold > 0 && !inv.find((s) => (typeof s === 'string' ? s : s?.id) === 'solar_gold')) {
      neededNewSlots += 1;
    }
    const pendingItems = Array.isArray(mail.items) ? mail.items : [];
    for (const att of pendingItems) {
      const def = EQUIPMENT_CATALOG[att.id];
      if (!def) continue;
      if (def.stackable) {
        const exists = inv.find((s) => (typeof s === 'string' ? s : s?.id) === att.id);
        if (!exists) neededNewSlots += 1;
      } else {
        neededNewSlots += Math.max(1, Number(att.qty) || 1);
      }
    }
    if (inv.length + neededNewSlots > 28) {
      return { error: `Need ${neededNewSlots} free backpack slot(s) before claiming this parcel.` };
    }

    if (mail.gold > 0) {
      addBagItem(inv, 'solar_gold', mail.gold, true, 28);
    }
    for (const att of pendingItems) {
      const def = EQUIPMENT_CATALOG[att.id];
      if (!def) continue;
      addBagItem(inv, att.id, att.qty || 1, Boolean(def.stackable), 28);
    }

    mail.claimed = true;
    mail.read = true;
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) {
      ch.inventory = inv;
      ch.statsMeta = { ...(ch.statsMeta || {}), mailbox };
    }
    acc.statsMeta = { ...(acc.statsMeta || {}), mailbox };
    this.schedulePersist(acc.id, ch?.id);

    return {
      ok: true,
      mail,
      mailbox,
      unreadCount: mailbox.filter((m) => !m.read).length,
    };
  }

  markMailRead(accountId, mailId) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return { mailbox: [], unreadCount: 0 };
    const mailbox = this.ensureMailboxInitialized(accountId);
    const mail = mailbox.find((m) => m.id === mailId);
    if (mail && !mail.read) {
      mail.read = true;
      const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
      if (ch) ch.statsMeta = { ...(ch.statsMeta || {}), mailbox };
      acc.statsMeta = { ...(acc.statsMeta || {}), mailbox };
      this.schedulePersist(acc.id, ch?.id);
    }
    return { mailbox, unreadCount: mailbox.filter((m) => !m.read).length };
  }

  deleteMailParcel(accountId, mailId) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return { error: 'Account not found.' };
    const mailbox = this.ensureMailboxInitialized(accountId);
    const idx = mailbox.findIndex((m) => m.id === mailId);
    if (idx === -1) return { error: 'Mail dispatch not found.' };
    const entry = mailbox[idx];
    if (!entry.claimed && (entry.gold > 0 || (entry.items && entry.items.length > 0))) {
      return { error: 'Claim gold or items before deleting this parcel.' };
    }
    mailbox.splice(idx, 1);
    const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) ch.statsMeta = { ...(ch.statsMeta || {}), mailbox };
    acc.statsMeta = { ...(acc.statsMeta || {}), mailbox };
    this.schedulePersist(acc.id, ch?.id);
    return { ok: true, mailbox, unreadCount: mailbox.filter((m) => !m.read).length };
  }

  getProfile(accountId) {
    const acc = this.accountsById.get(accountId);
    return acc ? this.toPublicProfile(acc) : null;
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
    const preset = getOrderPresetForFaction(resolved.faction, activeChar?.orderTag || acc.orderTag);
    const editionTier =
      acc.statsMeta?.editionTier ||
      activeChar?.statsMeta?.editionTier ||
      (acc.tcgLinked ? 'founder' : 'free');
    const defaultTitle = editionTier === 'founder' ? 'FOUNDER' : null;
    const { unreadCount } = this.getMailbox(acc.id);
    return {
      id: acc.id,
      username: acc.username,
      displayName: activeChar?.name || acc.displayName,
      isGuest: acc.isGuest,
      tcgLinked: acc.tcgLinked,
      tcgHandle: acc.tcgHandle,
      tcgEmail: acc.tcgEmail,
      editionTier,
      redeemedSerialKey: acc.statsMeta?.redeemedSerialKey || activeChar?.statsMeta?.redeemedSerialKey || null,
      faction: resolved.faction,
      classId: resolved.classId,
      orderTag: activeChar?.orderTag || acc.orderTag || preset.tag,
      orderName: activeChar?.orderName || acc.orderName || preset.name,
      orderColor: activeChar?.orderColor || acc.orderColor || preset.color,
      loadout: activeChar?.loadout || acc.loadout || {},
      equipment: activeChar?.equipment || acc.equipment || {},
      inventory: activeChar?.inventory || acc.inventory || [],
      bank: Array.isArray(activeChar?.bank) ? activeChar.bank : [],
      questState: activeChar?.questState || acc.questState || {},
      progression: activeChar?.progression || acc.progression || {},
      statsMeta: activeChar?.statsMeta || acc.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      unreadMailCount: unreadCount,
      title: activeChar?.title || acc.title || defaultTitle,
      activeCharacterId: acc.activeCharacterId,
      hp: typeof activeChar?.hp === 'number' ? activeChar.hp : (typeof acc.hp === 'number' ? acc.hp : null),
      solarCharge: typeof activeChar?.solarCharge === 'number' ? activeChar.solarCharge : (typeof acc.solarCharge === 'number' ? acc.solarCharge : null),
      lastPosition: activeChar?.lastPosition || acc.lastPosition || null,
      characters: this.listCharacters(acc.id),
      dbConnected: this.dbConnected,
    };
  }

  // ==========================================
  // Founder's Edition Serial Key Management (/admin & Redemption)
  // ==========================================
  verifyAdminPassword(rawPassword) {
    const expected = String(process.env.ADMIN_PASSWORD || 'Yb07tw44!').trim();
    const provided = String(rawPassword || '').trim();
    return Boolean(expected && provided && provided === expected);
  }

  loadSerialKeysLocal() {
    try {
      ensureDataDir();
      const file = path.join(DATA_DIR, 'serial_keys.json');
      if (!fs.existsSync(file)) return;
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.key) {
            this.serialKeys.set(String(item.key).toUpperCase(), item);
          }
        }
      }
    } catch (_) {}
  }

  saveSerialKeysLocal() {
    try {
      ensureDataDir();
      const file = path.join(DATA_DIR, 'serial_keys.json');
      const arr = Array.from(this.serialKeys.values());
      fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
    } catch (_) {}
  }

  async loadSerialKeysFromPostgres() {
    if (!this.db) return;
    try {
      const res = await this.db.query('SELECT * FROM glimmerfall_serial_keys ORDER BY created_at DESC');
      for (const row of res.rows) {
        const keyCode = String(row.key_code || '').toUpperCase();
        if (!keyCode) continue;
        this.serialKeys.set(keyCode, {
          key: keyCode,
          tier: row.tier || 'founder',
          note: row.note || '',
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          redeemedBy: row.redeemed_by || null,
          redeemedUsername: row.redeemed_username || null,
          redeemedAt: row.redeemed_at ? new Date(row.redeemed_at).toISOString() : null,
        });
      }
      this.saveSerialKeysLocal();
    } catch (_) {}
  }

  async generateSerialKeys({ count = 1, note = '', tier = 'founder' } = {}) {
    const safeCount = Math.max(1, Math.min(50, Math.floor(Number(count) || 1)));
    const cleanNote = String(note || '').trim().slice(0, 120);
    const cleanTier = String(tier || 'founder').trim().toLowerCase() || 'founder';
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const created = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < safeCount; i++) {
      let keyCode = '';
      do {
        const seg = () => {
          let s = '';
          const bytes = crypto.randomBytes(4);
          for (let j = 0; j < 4; j++) s += alphabet[bytes[j] % alphabet.length];
          return s;
        };
        keyCode = `GF-${seg()}-${seg()}-${seg()}`;
      } while (this.serialKeys.has(keyCode));

      const entry = {
        key: keyCode,
        tier: cleanTier,
        note: cleanNote,
        createdAt: nowIso,
        redeemedBy: null,
        redeemedUsername: null,
        redeemedAt: null,
      };
      this.serialKeys.set(keyCode, entry);
      created.push(entry);

      if (this.db) {
        try {
          await this.db.query(
            `INSERT INTO glimmerfall_serial_keys (key_code, tier, note, created_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (key_code) DO NOTHING`,
            [entry.key, entry.tier, entry.note, entry.createdAt]
          );
        } catch (_) {}
      }
    }

    this.saveSerialKeysLocal();
    return created;
  }

  async listSerialKeys() {
    if (this.db) {
      await this.loadSerialKeysFromPostgres();
    }
    const keys = Array.from(this.serialKeys.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const redeemedCount = keys.filter((k) => Boolean(k.redeemedAt)).length;
    return {
      keys,
      total: keys.length,
      available: keys.length - redeemedCount,
      redeemed: redeemedCount,
    };
  }

  async revokeSerialKey(rawKey) {
    const cleanKey = String(rawKey || '').trim().toUpperCase();
    if (!cleanKey) return { error: 'Serial key is required.' };
    const existing = this.serialKeys.get(cleanKey);
    if (!existing) return { error: 'Serial key not found.' };
    if (existing.redeemedAt) return { error: 'Cannot revoke a key that has already been redeemed.' };
    this.serialKeys.delete(cleanKey);
    this.saveSerialKeysLocal();
    if (this.db) {
      try {
        await this.db.query('DELETE FROM glimmerfall_serial_keys WHERE key_code = $1', [cleanKey]);
      } catch (_) {}
    }
    return { ok: true, key: cleanKey };
  }

  async redeemSerialKey(accountId, rawKey, fallbackName = 'Adventurer') {
    const cleanKey = String(rawKey || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
    if (!cleanKey || !/^GF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanKey)) {
      return { error: 'Invalid serial key format. Expected GF-XXXX-XXXX-XXXX.' };
    }

    if (this.db && !this.serialKeys.has(cleanKey)) {
      await this.loadSerialKeysFromPostgres();
    }

    const entry = this.serialKeys.get(cleanKey);
    if (!entry) {
      return { error: 'Serial key not recognized. Double-check your code and try again.' };
    }
    if (entry.redeemedAt) {
      return { error: 'This serial key has already been redeemed.' };
    }

    const acc = accountId ? this.accountsById.get(accountId) : null;
    const nowIso = new Date().toISOString();
    entry.redeemedBy = acc ? acc.id : `local_${crypto.randomUUID().slice(0, 8)}`;
    entry.redeemedUsername = acc ? (acc.username || acc.displayName || fallbackName) : String(fallbackName || 'Adventurer').slice(0, 24);
    entry.redeemedAt = nowIso;
    this.serialKeys.set(cleanKey, entry);
    this.saveSerialKeysLocal();

    if (this.db) {
      try {
        await this.db.query(
          `UPDATE glimmerfall_serial_keys
           SET redeemed_by = $2, redeemed_username = $3, redeemed_at = $4
           WHERE key_code = $1`,
          [cleanKey, entry.redeemedBy, entry.redeemedUsername, entry.redeemedAt]
        );
      } catch (_) {}
    }

    if (acc) {
      acc.statsMeta = {
        ...(acc.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 }),
        editionTier: entry.tier || 'founder',
        redeemedSerialKey: cleanKey,
        redeemedAt: nowIso,
      };
      acc.title = acc.title || 'FOUNDER';
      const cmap = this.charactersByAccount.get(acc.id);
      if (cmap) {
        for (const ch of cmap.values()) {
          ch.statsMeta = {
            ...(ch.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 }),
            editionTier: entry.tier || 'founder',
            redeemedSerialKey: cleanKey,
          };
          ch.title = ch.title || 'FOUNDER';
        }
      }
      const activeChar = cmap?.get(acc.activeCharacterId);
      this.schedulePersist(acc.id, activeChar?.id);
      await this.flushToPostgres();
      return {
        ok: true,
        key: entry,
        editionTier: entry.tier || 'founder',
        profile: this.toPublicProfile(acc),
      };
    }

    return {
      ok: true,
      key: entry,
      editionTier: entry.tier || 'founder',
    };
  }

  saveCharacterState(accountId, characterId = null, { hp, solarCharge, isDead = false, lastPosition = null, immediate = true } = {}) {
    const acc = this.accountsById.get(accountId);
    if (!acc) return;
    const targetCharId = characterId || acc.activeCharacterId;
    const cmap = this.charactersByAccount.get(acc.id);
    const ch = cmap?.get(targetCharId);

    const safeHp = isDead ? null : (typeof hp === 'number' && hp > 0 ? Math.round(hp) : null);
    const safeGlimmer = typeof solarCharge === 'number' && solarCharge >= 0 ? Math.round(solarCharge) : 0;
    const safePos = (lastPosition && typeof lastPosition === 'object' && lastPosition.roomType)
      ? { roomType: String(lastPosition.roomType), x: Math.round(Number(lastPosition.x) || 0), y: Math.round(Number(lastPosition.y) || 0) }
      : null;

    if (ch) {
      if (safeHp !== undefined) ch.hp = safeHp;
      if (safeGlimmer !== undefined) ch.solarCharge = safeGlimmer;
      if (safePos !== null) ch.lastPosition = safePos;
      ch.isDead = Boolean(isDead);
    }
    if (safeHp !== undefined) acc.hp = safeHp;
    if (safeGlimmer !== undefined) acc.solarCharge = safeGlimmer;
    if (safePos !== null) acc.lastPosition = safePos;
    this.schedulePersist(acc.id, targetCharId);
    if (immediate) {
      this.flushSync();
    }
  }
}
