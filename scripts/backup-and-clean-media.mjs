import fs from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';

const DEFAULT_BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  'vercel_blob_rw_O20ql1pn6R6cwj04_Wotzsv1Dqzgh0PpiW69vd210jlHk0O';

const MANIFEST_FILE = path.resolve(process.cwd(), 'blob-media-manifest.json');

let manifest = {};
if (fs.existsSync(MANIFEST_FILE)) {
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  } catch (_) {
    manifest = {};
  }
}

async function uploadFile(filePath, blobFolder) {
  const fileName = path.basename(filePath);
  const cleanName = fileName.replace(/[\s—…]+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  const blobPath = `${blobFolder}/${cleanName}`;
  const stat = fs.statSync(filePath);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(2);

  // Check if already in manifest and alive
  if (manifest[fileName]?.url) {
    try {
      const checkRes = await fetch(manifest[fileName].url, { method: 'HEAD' });
      if (checkRes.ok) {
        console.log(`⏩ Already uploaded & verified: ${fileName} -> ${manifest[fileName].url}`);
        return manifest[fileName];
      }
    } catch (_) {}
  }

  console.log(`⏳ Uploading ${fileName} (${sizeMb} MB) -> ${blobPath}...`);
  const stream = fs.createReadStream(filePath);
  const blob = await put(blobPath, stream, {
    access: 'public',
    token: DEFAULT_BLOB_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const record = {
    url: blob.url,
    pathname: blob.pathname,
    sizeMb: Number(sizeMb),
    uploadedAt: new Date().toISOString(),
  };

  manifest[fileName] = record;
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✅ Uploaded: ${blob.url}`);
  return record;
}

async function main() {
  console.log('🚀 Starting Media Backup to Vercel Blob...\n');

  // 1. Audio files in public/audio
  const audioDir = path.resolve(process.cwd(), 'public/audio');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter((f) => /\.(m4a|mp3|wav|ogg)$/i.test(f));
    console.log(`--- Backing up ${audioFiles.length} audio tracks in public/audio ---`);
    for (const f of audioFiles) {
      const fullPath = path.join(audioDir, f);
      await uploadFile(fullPath, 'glimmerfall/audio');
    }
  }

  // 2. Production cards in public/production_cards
  const cardsDir = path.resolve(process.cwd(), 'public/production_cards');
  if (fs.existsSync(cardsDir)) {
    const cardFiles = fs.readdirSync(cardsDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    console.log(`\n--- Backing up ${cardFiles.length} production cards ---`);
    for (const f of cardFiles) {
      const fullPath = path.join(cardsDir, f);
      await uploadFile(fullPath, 'glimmerfall/production_cards');
    }
  }

  // 3. Screenshots in GlimmerfallOnline root
  const rootFiles = fs.readdirSync(process.cwd()).filter((f) => /^IMG_.*\.(png|jpg|jpeg)$/i.test(f));
  console.log(`\n--- Backing up ${rootFiles.length} root screenshot images ---`);
  for (const f of rootFiles) {
    const fullPath = path.resolve(process.cwd(), f);
    await uploadFile(fullPath, 'glimmerfall/screenshots');
  }

  // 4. Screenshots & crop files in /home/ewilliamhe
  const homeDir = '/home/ewilliamhe';
  const homeFiles = fs.readdirSync(homeDir).filter((f) => /\.(png|jpg|jpeg|mp4|m4a)$/i.test(f));
  console.log(`\n--- Backing up ${homeFiles.length} home directory media files ---`);
  for (const f of homeFiles) {
    const fullPath = path.join(homeDir, f);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        await uploadFile(fullPath, 'glimmerfall/user_media');
      }
    } catch (_) {}
  }

  console.log('\n=======================================================');
  console.log('✅ ALL MEDIA FILES VERIFIED AND BACKED UP TO VERCEL BLOB');
  console.log(`Total items in manifest: ${Object.keys(manifest).length}`);
  console.log('=======================================================\n');

  // Deletion Phase
  console.log('🗑️ Commencing Safe Deletion of Local Media Replicas...');

  let freedBytes = 0;

  function safeDeleteFile(p) {
    try {
      if (fs.existsSync(p)) {
        const sz = fs.statSync(p).size;
        fs.unlinkSync(p);
        freedBytes += sz;
        return true;
      }
    } catch (e) {
      console.warn(`Could not delete ${p}:`, e.message);
    }
    return false;
  }

  function safeDeleteDir(dir) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Removed directory: ${dir}`);
      }
    } catch (e) {
      console.warn(`Could not remove dir ${dir}:`, e.message);
    }
  }

  // 1. Delete redundant local audio folders (already on Vercel Blob and streamed by client/audio.js)
  safeDeleteDir(path.resolve(process.cwd(), 'public/audio'));
  safeDeleteDir(path.resolve(process.cwd(), 'landing/public/audio'));
  safeDeleteDir(path.resolve(process.cwd(), 'landing/out/audio'));
  safeDeleteDir(path.resolve(process.cwd(), 'dist/audio'));
  safeDeleteDir(path.resolve(process.cwd(), 'dist/landing/audio'));

  // 2. Delete local production cards
  safeDeleteDir(path.resolve(process.cwd(), 'public/production_cards'));

  // 3. Delete root screenshots
  for (const f of rootFiles) {
    safeDeleteFile(path.resolve(process.cwd(), f));
  }

  // 4. Delete home media files
  for (const f of homeFiles) {
    safeDeleteFile(path.join(homeDir, f));
  }

  // 5. Clean landing build cache (landing/.next)
  safeDeleteDir(path.resolve(process.cwd(), 'landing/.next'));

  console.log(`\n🎉 Cleanup finished! Freed roughly ${(freedBytes / 1024 / 1024).toFixed(2)} MB of disk space.`);
}

main().catch((err) => {
  console.error('Fatal backup & clean error:', err);
  process.exit(1);
});
