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

export function normalizeLoadout(rawLoadout, classId) {
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const out = { ...cls.defaultLoadout };
  if (rawLoadout && typeof rawLoadout === 'object') {
    for (const slot of ACTION_SLOTS) {
      const candidate = rawLoadout[slot];
      if (candidate && ABILITIES_CATALOG[candidate] && candidate !== 'harvest') {
        out[slot] = candidate;
      }
    }
  }
  return out;
}

export function normalizeEquipment(rawEquip, classId) {
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const out = { ...cls.defaultEquipment };
  if (rawEquip && typeof rawEquip === 'object') {
    for (const slot of ['weapon', 'armor', 'offhand']) {
      const itemId = rawEquip[slot];
      if (itemId && EQUIPMENT_CATALOG[itemId] && EQUIPMENT_CATALOG[itemId].slot === slot) {
        out[slot] = itemId;
      }
    }
  }
  return out;
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
      const ch = {
        id: row.id,
        accountId: row.account_id,
        name: row.name,
        faction: row.faction,
        classId: row.class_id,
        orderTag: row.order_tag || 'SUN',
        orderName: row.order_name || 'Order of Dawn',
        orderColor: row.order_color || '#facc15',
        homeBiome: row.home_biome || ROOM_TYPES.SANCTUARY_HUB,
        loadout: normalizeLoadout(row.loadout, row.class_id),
        equipment: normalizeEquipment(row.equipment, row.class_id),
        unlockedGear: Array.isArray(row.unlocked_gear) ? row.unlocked_gear : Object.keys(EQUIPMENT_CATALOG),
        progression: this.mergeValidProgression(createDefaultProgression(), row.progression),
        statsMeta: row.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      };
      if (!this.charactersByAccount.has(ch.accountId)) {
        this.charactersByAccount.set(ch.accountId, new Map());
      }
      this.charactersByAccount.get(ch.accountId).set(ch.id, ch);
    }
    console.log(`[PostgreSQL] Loaded ${this.accountsById.size} accounts & ${charRes.rows.length} characters from Neon DB.`);
  }

  hydrateAccountRow(row) {
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

  async ensureFreshFromPostgres({ id = null, username = null } = {}) {
    if (!this.db) return;
    try {
      let accRow = null;
      if (id && !this.accountsById.has(id)) {
        const res = await this.db.query('SELECT * FROM glimmerfall_accounts WHERE id = $1 LIMIT 1', [id]);
        accRow = res.rows[0] || null;
      } else if (username) {
        const lower = String(username).trim().toLowerCase();
        if (lower && !this.idByUsername.has(lower)) {
          const res = await this.db.query('SELECT * FROM glimmerfall_accounts WHERE username_lower = $1 LIMIT 1', [lower]);
          accRow = res.rows[0] || null;
        }
      }
      if (accRow) {
        const acc = this.hydrateAccountRow(accRow);
        const cRes = await this.db.query('SELECT * FROM glimmerfall_characters WHERE account_id = $1 ORDER BY created_at ASC', [acc.id]);
        const cmap = this.charactersByAccount.get(acc.id);
        for (const r of cRes.rows) {
          cmap.set(r.id, {
            id: r.id,
            accountId: r.account_id,
            name: r.name,
            faction: r.faction,
            classId: r.class_id,
            orderTag: r.order_tag || 'SUN',
            orderName: r.order_name || 'Order of Dawn',
            orderColor: r.order_color || '#facc15',
            homeBiome: r.home_biome || ROOM_TYPES.SANCTUARY_HUB,
            loadout: normalizeLoadout(r.loadout, r.class_id),
            equipment: normalizeEquipment(r.equipment, r.class_id),
            unlockedGear: Array.isArray(r.unlocked_gear) ? r.unlocked_gear : Object.keys(EQUIPMENT_CATALOG),
            progression: this.mergeValidProgression(createDefaultProgression(), r.progression),
            statsMeta: r.stats_meta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
          });
        }
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
          active_character_id, created_at, last_login_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
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
          last_login_at = EXCLUDED.last_login_at`,
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
          home_biome, loadout, equipment, unlocked_gear, progression, stats_meta, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
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
          updated_at = NOW()`,
        [
          found.id, found.accountId, found.name, found.faction, found.classId,
          found.orderTag, found.orderName, found.orderColor, found.homeBiome,
          JSON.stringify(found.loadout || {}),
          JSON.stringify(found.equipment || {}),
          JSON.stringify(found.unlockedGear || []),
          JSON.stringify(found.progression || {}),
          JSON.stringify(found.statsMeta || {}),
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
        unlockedGear: Object.keys(EQUIPMENT_CATALOG),
        progression: acc.progression,
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
    acc.progression = ch.progression;
    acc.statsMeta = ch.statsMeta;
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
    faction = 'Solari',
    classId = 'solari_vanguard',
    orderTag,
    orderName,
    orderColor,
    loadout,
    equipment,
    homeBiome = ROOM_TYPES.SANCTUARY_HUB,
  }) {
    const acc = this.accountsById.get(accountId);
    if (!acc) throw new Error('Account not found.');
    this.ensureDefaultCharacter(acc);
    const cmap = this.charactersByAccount.get(acc.id);

    const norm = normalizeClassAndFaction(classId, faction);
    const preset = ORDER_PRESETS.find((o) =>
      (norm.faction === 'Solari' && o.tag === 'SUN') ||
      (norm.faction === 'Umbri' && o.tag === 'VOID') ||
      (norm.faction === 'Terra' && o.tag === 'ROOT') ||
      (norm.faction === 'Aether' && o.tag === 'AETH')
    ) || ORDER_PRESETS[0];

    // Update existing character if characterId passed
    if (characterId && cmap.has(characterId)) {
      const ch = cmap.get(characterId);
      if (name) ch.name = sanitizeName(name, ch.name);
      ch.faction = norm.faction;
      ch.classId = norm.classId;
      if (orderTag !== undefined) ch.orderTag = sanitizeOrderTag(orderTag) || preset.tag;
      if (orderName !== undefined) ch.orderName = sanitizeName(orderName, preset.name);
      if (orderColor) ch.orderColor = orderColor;
      if (loadout) ch.loadout = normalizeLoadout(loadout, norm.classId);
      if (equipment) ch.equipment = normalizeEquipment(equipment, norm.classId);
      if (homeBiome) ch.homeBiome = homeBiome;

      acc.activeCharacterId = ch.id;
      this.syncAccountFromActiveChar(acc);
      this.schedulePersist(acc.id, ch.id);
      return ch;
    }

    if (cmap.size >= 8) {
      throw new Error('Maximum of 8 characters per GlimmerFall ID reached.');
    }

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
      acc.username = cleanUser;
      acc.usernameLower = lower;
      acc.displayName = sanitizeName(displayName || cleanUser, cleanUser);
      acc.passwordHash = this.hashPassword(password);
      acc.isGuest = false;
      acc.faction = norm.faction;
      acc.classId = norm.classId;
      acc.orderTag = cleanTag;
      acc.orderName = cleanOrderName;
      if (loadout) acc.loadout = normalizeLoadout(loadout, norm.classId);
      if (equipment) acc.equipment = normalizeEquipment(equipment, norm.classId);
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
      this.ensureDefaultCharacter(acc);
      const ch = this.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
      if (ch) {
        ch.name = acc.displayName;
        ch.faction = acc.faction;
        ch.classId = acc.classId;
        ch.orderTag = acc.orderTag;
        ch.orderName = acc.orderName;
        if (loadout) ch.loadout = acc.loadout;
        if (equipment) ch.equipment = acc.equipment;
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

  updateProfile(accountId, { displayName, faction, classId, orderTag, orderName, orderColor, loadout, equipment }) {
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
    }

    this.schedulePersist(acc.id, ch?.id);
    return acc;
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
    return { level: lvl, xp, statPoints, skillPoints, stats, ranks };
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

  toPublicProfile(acc) {
    if (!acc) return null;
    this.ensureDefaultCharacter(acc);
    return {
      id: acc.id,
      username: acc.username,
      displayName: acc.displayName,
      isGuest: acc.isGuest,
      tcgLinked: acc.tcgLinked,
      tcgHandle: acc.tcgHandle,
      tcgEmail: acc.tcgEmail,
      faction: acc.faction,
      classId: acc.classId || 'solari_vanguard',
      orderTag: acc.orderTag,
      orderName: acc.orderName,
      orderColor: acc.orderColor,
      loadout: acc.loadout,
      equipment: acc.equipment,
      progression: acc.progression,
      statsMeta: acc.statsMeta || { kills: 0, arenaWins: 0, siegeClaims: 0 },
      activeCharacterId: acc.activeCharacterId,
      characters: this.listCharacters(acc.id),
      dbConnected: this.dbConnected,
    };
  }
}
