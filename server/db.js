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
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_gf_chars_account ON glimmerfall_characters(account_id);
  `);

  return true;
}
