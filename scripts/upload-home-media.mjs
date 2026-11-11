import fs from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';

const DEFAULT_BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  'vercel_blob_rw_O20ql1pn6R6cwj04_Wotzsv1Dqzgh0PpiW69vd210jlHk0O';

const SOURCE_DIR = '/home/ewilliamhe';

async function main() {
  const entries = fs.readdirSync(SOURCE_DIR);
  const mediaFiles = entries.filter((f) => /\.(mp4|m4a|mp3|wav)$/i.test(f));

  console.log(`🚀 Found ${mediaFiles.length} media files in ${SOURCE_DIR}`);
  const manifest = {};

  for (const file of mediaFiles) {
    const fullPath = path.join(SOURCE_DIR, file);
    const stat = fs.statSync(fullPath);
    const sizeMb = (stat.size / 1024 / 1024).toFixed(2);

    // Sanitize destination path in Blob
    const ext = path.extname(file).toLowerCase();
    const isAudio = ext === '.m4a' || ext === '.mp3' || ext === '.wav';
    const folder = isAudio ? 'glimmerfall/audio' : 'glimmerfall/cinematics';
    const cleanName = file.replace(/[\s—…]+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const blobPath = `${folder}/${cleanName}`;

    console.log(`\n⏳ Uploading ${file} (${sizeMb} MB) -> ${blobPath}...`);
    try {
      const fileStream = fs.createReadStream(fullPath);
      const blob = await put(blobPath, fileStream, {
        access: 'public',
        token: DEFAULT_BLOB_TOKEN,
        addRandomSuffix: false,
      });

      console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`);
      manifest[file] = {
        url: blob.url,
        pathname: blob.pathname,
        sizeMb: Number(sizeMb),
        uploadedAt: new Date().toISOString(),
      };

      // Safely delete from local root after successful upload
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted local file: ${fullPath}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message);
    }
  }

  // Save manifest
  const manifestPath = path.join(process.cwd(), 'blob-media-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n🎉 All media migrated to Vercel Blob! Manifest saved to ${manifestPath}`);
}

main().catch((err) => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
