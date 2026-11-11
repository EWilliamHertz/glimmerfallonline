#!/usr/bin/env node
/**
 * ============================================================================
 * GlimmerFall Online — Google Flow Cinematics Vercel Blob Uploader
 * ============================================================================
 *
 * Scans assets/cinematics/ or project root for .mp4 files generated via
 * Google Flow and uploads them to Vercel Blob with public 1080p CDN URLs.
 *
 * Usage:
 *   node scripts/upload-blob-cinematics.mjs --list
 *   node scripts/upload-blob-cinematics.mjs --file <path-to-mp4>
 *   node scripts/upload-blob-cinematics.mjs --all
 *
 * Environment variables:
 *   BLOB_READ_WRITE_TOKEN   Vercel Blob RW token (defaults to pre-configured token)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  'vercel_blob_rw_O20ql1pn6R6cwj04_Wotzsv1Dqzgh0PpiW69vd210jlHk0O';

export const CINEMATICS_REGISTRY = {
  crystal_heart: {
    destination: 'crystal_heart_shattering_1080p.mp4',
    title: 'Scene 1: Crystal Heart Shattering (Universal Prologue)',
    aliases: ['crystal_heart', 'shattering', 'crystalheart', 'detonates_in_space'],
  },
  solari_vanguard: {
    destination: 'awakening_solari_vanguard_1080p.mp4',
    title: 'Scene 2A: Solari Vanguard Knight Awakening',
    aliases: ['solari_vanguard', 'knight_awakening', 'solari_tank', 'vanguard', 'golden_knight', 'thrusts_greatsword'],
  },
  solari_dawnblade: {
    destination: 'awakening_solari_dawnblade_1080p.mp4',
    title: 'Scene 2B: Solari Dawnblade Awakening',
    aliases: ['solari_dawnblade', 'dawnblade', 'dawnwave', 'solari_melee', 'warrior_spinning', 'solar_scim', 'scim'],
  },
  umbri_reaper: {
    destination: 'awakening_umbri_reaper_1080p.mp4',
    title: 'Scene 2C: Umbri Reaper Awakening',
    aliases: ['umbri_reaper', 'reaper', 'umbri_harbinger', 'shadowy_harbinger', 'slashing_reali'],
  },
  umbri_shadowweaver: {
    destination: 'awakening_umbri_shadowweaver_1080p.mp4',
    title: 'Scene 2D: Umbri Shadowweaver Awakening',
    aliases: ['umbri_shadowweaver', 'shadowweaver', 'umbri_caster', 'sorcerer_weaving', 'purple_magic', 'magic_th'],
  },
  terra_ironroot: {
    destination: 'awakening_terra_ironroot_1080p.mp4',
    title: 'Scene 2E: Terra Ironroot Guardian Awakening',
    aliases: ['terra_ironroot', 'ironroot', 'terra_titan', 'terra_colossus', 'nature_titan'],
  },
  terra_bramble_warden: {
    destination: 'awakening_terra_bramble_warden_1080p.mp4',
    title: 'Scene 2F: Terra Bramble Warden Awakening',
    aliases: ['terra_bramble_warden', 'bramble_warden', 'bramble', 'terra_archer', 'archer', 'starlight_arrow'],
  },
  aether_chronomancer: {
    destination: 'awakening_aether_chronomancer_1080p.mp4',
    title: 'Scene 2G: Aether Chronomancer Awakening',
    aliases: ['aether_chronomancer', 'chronomancer', 'aether_mage', 'scholar', 'temporal_astrolabe', 'astrolabe'],
  },
  aether_tempest_sage: {
    destination: 'awakening_aether_tempest_sage_1080p.mp4',
    title: 'Scene 2H: Aether Tempest Sage Awakening',
    aliases: ['aether_tempest_sage', 'tempest_sage', 'tempest', 'aether_lightning', 'storm_sorcerer', 'storm'],
  },
  colossus_emergence: {
    destination: 'scene3_colossus_emergence_1080p.mp4',
    title: 'Scene 3: Colossus Emergence (World Boss Entrance)',
    aliases: ['colossus_emergence', 'colossus', 'scene3', 'world_boss', 'stone_titan', 'rises_from_magma', 'magma'],
  },
  boss_defeated: {
    destination: 'scene4_boss_defeated_1080p.mp4',
    title: 'Scene 4: Boss Defeated (Victory Fanfare & Spoils)',
    aliases: ['boss_defeated', 'scene4', 'boss_defeat', 'victory_fanfare', 'collapsing_in_defeat', 'in_defeat'],
  },
  monolith_explosion: {
    destination: 'scene5_monolith_explosion_1080p.mp4',
    title: 'Scene 5: Nexus Monolith Supernova Explosion',
    aliases: ['monolith_explosion', 'monolith', 'scene5', 'supernova', 'monolith_explodes'],
  },
};

function resolveRegistryKey(filename) {
  const lower = filename.toLowerCase();
  for (const [key, spec] of Object.entries(CINEMATICS_REGISTRY)) {
    if (lower.includes(key)) return key;
    for (const alias of spec.aliases) {
      if (lower.includes(alias)) return key;
    }
  }
  return null;
}

export async function uploadCinematicFile(filePath, targetKey = null, dryRun = false) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return null;
  }

  const baseName = path.basename(filePath);
  const matchedKey = targetKey || resolveRegistryKey(baseName);
  const spec = matchedKey ? CINEMATICS_REGISTRY[matchedKey] : null;
  const destName = spec?.destination || (baseName.endsWith('.mp4') ? baseName : `${baseName}.mp4`);
  const blobPath = `glimmerfall/cinematics/${destName}`;

  const stats = fs.statSync(filePath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎬 [${matchedKey ? 'MATCHED' : 'CUSTOM'}] [${sizeMb} MB]: ${baseName}`);
  console.log(`   Registry Target: ${spec?.title || 'Custom Video Clip'}`);
  console.log(`   Blob Destination: ${blobPath}`);

  if (dryRun) {
    console.log(`   [DRY RUN] Skipped upload.`);
    return `https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/${blobPath}`;
  }

  const buffer = fs.readFileSync(filePath);
  try {
    const blob = await put(blobPath, buffer, {
      access: 'public',
      token: DEFAULT_BLOB_TOKEN,
      contentType: 'video/mp4',
    });
    console.log(`   ✓ Uploaded successfully!`);
    console.log(`   🔗 Live CDN URL: ${blob.url}`);
    return blob.url;
  } catch (err) {
    console.error(`   ❌ Failed to upload: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isList = args.includes('--list');
  const isDryRun = args.includes('--dry-run');
  const isAll = args.includes('--all');
  const fileIdx = args.indexOf('--file');
  const targetFile = fileIdx !== -1 ? args[fileIdx + 1] : null;

  console.log('================================================================');
  console.log('🎬 GlimmerFall Online — Google Flow Cinematics Uploader');
  console.log('================================================================');

  if (isList) {
    console.log('\n📋 Target Cinematics Registry:');
    for (const [key, spec] of Object.entries(CINEMATICS_REGISTRY)) {
      console.log(`\n• [${key}] ${spec.title}`);
      console.log(`  Destination: ${spec.destination}`);
      console.log(`  Aliases: ${spec.aliases.join(', ')}`);
    }
    return;
  }

  if (targetFile) {
    await uploadCinematicFile(targetFile, null, isDryRun);
    return;
  }

  // Scan assets/cinematics
  const assetsDir = path.join(ROOT_DIR, 'assets', 'cinematics');
  const foundFiles = [];
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const f of files) {
      if (f.endsWith('.mp4')) {
        foundFiles.push(path.join(assetsDir, f));
      }
    }
  }

  if (foundFiles.length === 0) {
    console.log('\nℹ No .mp4 files found in assets/cinematics/.');
    console.log('  Place your Google Flow clips in assets/cinematics/ or upload via:');
    console.log('  node scripts/upload-blob-cinematics.mjs --file <path-to-mp4>');
    return;
  }

  console.log(`\nFound ${foundFiles.length} video clip(s) in assets/cinematics/.`);
  for (const f of foundFiles) {
    await uploadCinematicFile(f, null, isDryRun);
  }

  console.log('\n✨ Cinematics process finished.\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('Fatal upload error:', err);
    process.exit(1);
  });
}
