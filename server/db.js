// ==========================================
// GlimmerFall Online 2D — PostgreSQL Persistence Layer (Neon / DATABASE_URL)
// Automatically loads .env and provisions accounts & characters tables
// ==========================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../.env');

export function loadDotEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

let pool = null;

export function getDbPool() {
  if (pool) return pool;
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return null;

  // Normalize connection string for node-postgres + Neon pooler TLS
  const parsed = new URL(rawUrl);
  parsed.searchParams.delete('channel_binding');
  parsed.searchParams.set('uselibpqcompat', 'true');
  if (!parsed.searchParams.get('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
  }

  pool = new Pool({
    connectionString: parsed.toString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]:', err.message);
  });

  return pool;
}

export async function initDatabaseSchema() {
  const db = getDbPool();
  if (!db) {
    console.warn('[DB] No DATABASE_URL configured — running with local JSON fallback.');
    return false;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS glimmerfall_accounts (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      username_lower TEXT UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT,
      is_guest BOOLEAN NOT NULL DEFAULT TRUE,
      sso_subject TEXT,
      tcg_linked BOOLEAN NOT NULL DEFAULT FALSE,
      tcg_handle TEXT,
      tcg_email TEXT,
      tcg_synced_at TIMESTAMPTZ,
      faction TEXT NOT NULL DEFAULT 'Solari',
      class_id TEXT NOT NULL DEFAULT 'solari_vanguard',
      order_tag TEXT NOT NULL DEFAULT 'SUN',
      order_name TEXT NOT NULL DEFAULT 'Order of Dawn',
      order_color TEXT NOT NULL DEFAULT '#facc15',
      loadout JSONB NOT NULL DEFAULT '{}'::jsonb,
      equipment JSONB NOT NULL DEFAULT '{}'::jsonb,
      progression JSONB NOT NULL DEFAULT '{}'::jsonb,
      stats_meta JSONB NOT NULL DEFAULT '{"kills":0,"arenaWins":0}'::jsonb,
      active_character_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS glimmerfall_characters (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES glimmerfall_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      faction TEXT NOT NULL DEFAULT 'Solari',
      class_id TEXT NOT NULL DEFAULT 'solari_vanguard',
      order_tag TEXT NOT NULL DEFAULT 'SUN',
      order_name TEXT NOT NULL DEFAULT 'Order of Dawn',
      order_color TEXT NOT NULL DEFAULT '#facc15',
      home_biome TEXT NOT NULL DEFAULT 'sanctuary_hub',
      loadout JSONB NOT NULL DEFAULT '{}'::jsonb,
      equipment JSONB NOT NULL DEFAULT '{}'::jsonb,
      unlocked_gear JSONB NOT NULL DEFAULT '[]'::jsonb,
      progression JSONB NOT NULL DEFAULT '{}'::jsonb,
      stats_meta JSONB NOT NULL DEFAULT '{"kills":0,"arenaWins":0,"siegeClaims":0}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS inventory JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE glimmerfall_characters ADD COLUMN IF NOT EXISTS inventory JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS bank JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE glimmerfall_characters ADD COLUMN IF NOT EXISTS bank JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS quest_state JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE glimmerfall_characters ADD COLUMN IF NOT EXISTS quest_state JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS hp INTEGER;
    ALTER TABLE glimmerfall_characters ADD COLUMN IF NOT EXISTS hp INTEGER;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS solar_charge NUMERIC;
    ALTER TABLE glimmerfall_characters ADD COLUMN IF NOT EXISTS solar_charge NUMERIC;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS last_position JSONB;
    ALTER TABLE glimmerfall_characters ADD COLUMN IF NOT EXISTS last_position JSONB;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_gf_chars_account ON glimmerfall_characters(account_id);
    CREATE TABLE IF NOT EXISTS glimmerfall_serial_keys (
      key_code TEXT PRIMARY KEY,
      tier TEXT NOT NULL DEFAULT 'founder',
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      redeemed_by TEXT,
      redeemed_username TEXT,
      redeemed_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS glimmerfall_exchange_orders (
      order_id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL DEFAULT '',
      slot INTEGER NOT NULL,
      mode TEXT NOT NULL,
      item_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      filled_qty INTEGER NOT NULL DEFAULT 0,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      collected BOOLEAN NOT NULL DEFAULT FALSE,
      escrow_gold INTEGER NOT NULL DEFAULT 0,
      escrow_items INTEGER NOT NULL DEFAULT 0,
      payout_gold INTEGER NOT NULL DEFAULT 0,
      payout_items INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_gf_exchange_item ON glimmerfall_exchange_orders(item_id, completed, mode);
    CREATE INDEX IF NOT EXISTS idx_gf_exchange_player ON glimmerfall_exchange_orders(player_id, collected);
    CREATE TABLE IF NOT EXISTS glimmerfall_exchange_trades (
      id SERIAL PRIMARY KEY,
      item_id TEXT NOT NULL,
      match_price INTEGER NOT NULL,
      match_qty INTEGER NOT NULL,
      gross_gold INTEGER NOT NULL,
      tariff INTEGER NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      traded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_gf_exchange_trades_item ON glimmerfall_exchange_trades(item_id, traded_at DESC);

    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS muted_until BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS banned_until BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS mute_reason TEXT NOT NULL DEFAULT '';
    ALTER TABLE glimmerfall_accounts ADD COLUMN IF NOT EXISTS ban_reason TEXT NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS glimmerfall_guilds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_lower TEXT UNIQUE NOT NULL,
      tag TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#facc15',
      leader_id TEXT NOT NULL,
      motd TEXT NOT NULL DEFAULT '',
      bank JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS glimmerfall_guild_members (
      guild_id TEXT NOT NULL REFERENCES glimmerfall_guilds(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      member_name TEXT NOT NULL DEFAULT '',
      rank TEXT NOT NULL DEFAULT 'Member',
      joined_at BIGINT NOT NULL,
      PRIMARY KEY (guild_id, account_id)
    );
    CREATE INDEX IF NOT EXISTS idx_gf_guild_member_acc ON glimmerfall_guild_members(account_id);

    CREATE TABLE IF NOT EXISTS glimmerfall_social_relations (
      account_id TEXT NOT NULL,
      target_account_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      target_name TEXT NOT NULL DEFAULT '',
      created_at BIGINT NOT NULL,
      PRIMARY KEY (account_id, target_account_id, relation)
    );

    CREATE TABLE IF NOT EXISTS glimmerfall_reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      target_id TEXT,
      target_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      chat_context JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'open',
      created_at BIGINT NOT NULL
    );
  `);

  return true;
}
