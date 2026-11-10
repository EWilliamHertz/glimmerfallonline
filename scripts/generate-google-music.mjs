#!/usr/bin/env node
/**
 * ============================================================================
 * GlimmerFall Online — Google DeepMind Lyria Music Generator & Vercel Blob Uploader
 * ============================================================================
 *
 * Generates orchestral & chiptune game soundtracks using Google DeepMind Lyria
 * (available via Google Cloud Vertex AI Model Garden & Google AI Studio Lyria RealTime)
 * and uploads them directly to Vercel Blob storage.
 *
 * Usage:
 *   node scripts/generate-google-music.mjs --list
 *   node scripts/generate-google-music.mjs --dry-run
 *   node scripts/generate-google-music.mjs --theme sanctuary --dry-run
 *   node scripts/generate-google-music.mjs --theme solari --upload
 *   node scripts/generate-google-music.mjs --all --upload
 *
 * Environment variables:
 *   BLOB_READ_WRITE_TOKEN   Vercel Blob RW token (defaults to pre-configured token)
 *   GEMINI_API_KEY          Google AI Studio API Key (or GOOGLE_GENAI_API_KEY)
 *   GCP_PROJECT_ID          Google Cloud Project ID (for Vertex AI Lyria endpoints)
 *   GCP_REGION              Google Cloud Region (default: 'us-central1')
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

// ============================================================================
// Google DeepMind Lyria Prompt Catalog for all 8 GlimmerFall Zones
// ============================================================================
export const MUSIC_PROMPT_CATALOG = {
  sanctuary: {
    name: 'Awakening Sanctuary Haven (Pixel Overloop)',
    bpm: 85,
    key: 'D major / B minor',
    timeSignature: '4/4',
    durationSeconds: 96,
    loopable: true,
    audioFile: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/sanctuary_pixel_overloop.m4a',
    prompt:
      'Lush, ethereal video game soundtrack for a peaceful starlight sanctuary. ' +
      'Warm acoustic concert harp, gentle celesta arpeggios, soft ambient starlight synth pad, ' +
      'melodic 16-bit chiptune triangle lead, distant choir humming, peaceful contemplative atmosphere. ' +
      'Seamless loop, studio master quality, warm low end, pristine high frequencies, 85 BPM.',
    negativePrompt:
      'harsh distortion, aggressive drums, electric guitars, vocals, talking, abrupt silence, clipping',
  },
  solari: {
    name: 'Daybreak at the Sunspire (Golden Citadel)',
    bpm: 128,
    key: 'D mixolydian / D major',
    timeSignature: '4/4',
    durationSeconds: 90,
    loopable: true,
    prompt:
      'Heroic, triumphant medieval fantasy orchestral march with crisp 16-bit square wave accents. ' +
      'Golden french horn fanfares, soaring symphonic violins, radiant cathedral choir chords, ' +
      'martial snare drum roll, crisp timpani hits, radiant solar energy, uplifting adventure anthem. ' +
      'Seamless loop, bright triumphant mix, wide stereo brass, 128 BPM.',
    negativePrompt:
      'dark, gloomy, minor key, horror, speech, heavy metal, low bitrate, mono',
  },
  umbri: {
    name: 'Shadows in the Sepulcher (Umbri Undercity)',
    bpm: 95,
    key: 'F# minor / C# minor',
    timeSignature: '4/4',
    durationSeconds: 105,
    loopable: true,
    prompt:
      'Atmospheric gothic dark-fantasy dungeon crawler soundtrack. Haunting solo cello melody, ' +
      'echoing cavern water droplets, subtle detuned harpsichord runs, deep sub-bass drone, ' +
      'distant ethereal whispers, melancholic violet mystery, brooding tension, medieval crypt ambience. ' +
      'Seamless loop, cavernous reverb, dynamic dark mix, 95 BPM.',
    negativePrompt:
      'upbeat pop, celebratory brass, bright sunshine, dance EDM, loud screaming, modern synths',
  },
  terra: {
    name: 'The Rootdeep Hymn (Terra Orchard & Deepwoods)',
    bpm: 110,
    key: 'E minor / G major',
    timeSignature: '4/4',
    durationSeconds: 100,
    loopable: true,
    prompt:
      'Organic druidic ancient forest video game soundtrack. Warm fingerpicked acoustic guitar, ' +
      'wooden pan flute melody, earthy bodhran and djembe hand percussion, gentle wind chimes, ' +
      'lush natural foliage atmosphere, ancient titan trees, emerald sunlight filtering through boughs. ' +
      'Seamless loop, organic warm acoustic timbre, 110 BPM.',
    negativePrompt:
      'heavy synths, aggressive distortion, 808 sub, metallic industrial noise, screeching',
  },
  aether: {
    name: 'Mirrorgate Continuum (Aether Spire)',
    bpm: 140,
    key: 'A minor / C major',
    timeSignature: '4/4',
    durationSeconds: 88,
    loopable: true,
    prompt:
      'Cosmic celestial sci-fantasy progressive soundtrack. Shimmering glass glockenspiel, ' +
      'fast quantum arpeggios, swirling analog sine leads, crystalline reverberation, ' +
      'hypnotic forward momentum, starry nebula expanse, temporal distortion swells, wonder and speed. ' +
      'Seamless loop, sparkling pristine high end, immersive stereo panning, 140 BPM.',
    negativePrompt:
      'muddy bass, muffled, acoustic guitar, dark gothic horror, heavy metal drums',
  },
  abyss: {
    name: 'Cataclysm at Starfall (Abyssal Rift)',
    bpm: 80,
    key: 'Eb minor / diminished',
    timeSignature: '4/4',
    durationSeconds: 110,
    loopable: true,
    prompt:
      'Dark ambient cosmic horror and cataclysmic rift soundtrack. Distorted sawtooth sub-bass drones, ' +
      'ominous descending orchestral dissonance, crushing meteor impact pulses, discordant strings, ' +
      'alien void frequencies, deep dread, slow heavy industrial percussion, cosmic void emptiness. ' +
      'Seamless loop, massive deep sub-frequencies, cinematic tension, 80 BPM.',
    negativePrompt:
      'happy, bright, acoustic folk, pop song, vocals, fast techno, cheesy synth',
  },
  warzone: {
    name: 'Continental Caldera (Heroic Battle March)',
    bpm: 135,
    key: 'A minor / D minor',
    timeSignature: '4/4',
    durationSeconds: 96,
    loopable: true,
    prompt:
      'Pounding cinematic battle music for an epic faction warzone clash. Massive taiko and orchestral war drums, ' +
      'soaring brass horn motifs, aggressive rhythmic cello ostinatos, clashing shields and steel accents, ' +
      'driving chiptune arpeggios, adrenaline-pumping heroic battle pulse. ' +
      'Seamless loop, punchy transient percussion, wide epic mix, 135 BPM.',
    negativePrompt:
      'silent, slow lullaby, solo acoustic, romantic, talking, modern trap beats',
  },
  boss: {
    name: 'Nexus Climax (World Boss & Siege Supernova)',
    bpm: 150,
    key: 'E minor / G harmonic minor',
    timeSignature: '4/4',
    durationSeconds: 84,
    loopable: true,
    prompt:
      'Relentless apocalyptic boss fight climax soundtrack. Rapid sixteenth-note string ostinatos, ' +
      'blistering double-time timpani and percussion, catastrophic brass fanfares, gothic choir chanting in Latin, ' +
      'desperate heroic battle against impossible odds, frantic tempo, monumental power. ' +
      'Seamless loop, maximum orchestral dynamic range, intense climax, 150 BPM.',
    negativePrompt:
      'quiet, casual elevator music, chillhop, lo-fi, acoustic ballads, slow tempo',
  },
};

// ============================================================================
// Google Music API Generation (Vertex AI Lyria & Google AI Studio Lyria RealTime)
// ============================================================================
async function generateTrackWithLyria(themeKey, spec, options = {}) {
  const { dryRun = false } = options;
  console.log(`\n🎵 [Google Lyria] Preparing generation for: ${themeKey.toUpperCase()} — ${spec.name}`);
  console.log(`   Tempo: ${spec.bpm} BPM | Key: ${spec.key} | Duration: ${spec.durationSeconds}s | Loop: ${spec.loopable}`);
  console.log(`   Prompt: "${spec.prompt}"`);

  if (dryRun) {
    console.log('   [DRY RUN] Skipping network calls. Payload simulation complete.');
    return {
      theme: themeKey,
      filename: `${themeKey}_lyria_master.mp3`,
      simulated: true,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  const gcpProject = process.env.GCP_PROJECT_ID;
  const gcpRegion = process.env.GCP_REGION || 'us-central1';

  // Strategy 1: Vertex AI Model Garden Lyria Endpoint
  if (gcpProject) {
    console.log(`   Attempting Vertex AI Lyria model endpoint (project: ${gcpProject}, region: ${gcpRegion})...`);
    try {
      const endpoint = `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/${gcpRegion}/publishers/google/models/lyria:predict`;
      const token = process.env.GCLOUD_ACCESS_TOKEN || (await getGcloudAccessToken());
      if (token) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [
              {
                prompt: spec.prompt,
                negativePrompt: spec.negativePrompt,
                durationSeconds: spec.durationSeconds,
                bpm: spec.bpm,
                loop: spec.loopable,
                audioFormat: 'mp3',
              },
            ],
            parameters: {
              temperature: 0.8,
              sampleRate: 48000,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const b64 = data?.predictions?.[0]?.audioContent;
          if (b64) {
            const buf = Buffer.from(b64, 'base64');
            const outPath = path.join(ROOT_DIR, 'assets', 'audio', `${themeKey}.mp3`);
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, buf);
            console.log(`   ✓ Lyria audio generated successfully -> ${outPath}`);
            return { theme: themeKey, buffer: buf, filePath: outPath };
          }
        }
      }
    } catch (err) {
      console.warn(`   Vertex AI Lyria call warning: ${err.message}.`);
    }
  }

  // Strategy 2: Google AI Studio Lyria RealTime API
  if (apiKey) {
    console.log('   Attempting Google AI Studio Lyria RealTime endpoint...');
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/lyria-realtime:generateAudio?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: spec.prompt }] }],
          generationConfig: {
            responseMimeType: 'audio/mp3',
            durationSeconds: spec.durationSeconds,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const b64 = data?.audioContent || data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) {
          const buf = Buffer.from(b64, 'base64');
          const outPath = path.join(ROOT_DIR, 'assets', 'audio', `${themeKey}.mp3`);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, buf);
          console.log(`   ✓ Lyria audio generated successfully -> ${outPath}`);
          return { theme: themeKey, buffer: buf, filePath: outPath };
        }
      }
    } catch (err) {
      console.warn(`   Google AI Studio Lyria warning: ${err.message}.`);
    }
  }

  console.log(`   ℹ Note: Direct Lyria API generation requires Vertex AI or Google AI Studio Lyria access.`);
  console.log(`   You can test offline with --dry-run or provide audio files in assets/audio/${themeKey}.mp3 to upload.`);
  return null;
}

async function getGcloudAccessToken() {
  try {
    const { execSync } = await import('node:child_process');
    return execSync('gcloud auth print-access-token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {
    return null;
  }
}

// ============================================================================
// Upload to Vercel Blob
// ============================================================================
async function uploadToVercelBlob(themeKey, audioBuffer, filename) {
  if (!DEFAULT_BLOB_TOKEN) {
    console.error('❌ Missing BLOB_READ_WRITE_TOKEN. Cannot upload to Vercel Blob.');
    return null;
  }

  const destinationPath = `glimmerfall/audio/${filename || `${themeKey}.mp3`}`;
  console.log(`☁️  Uploading to Vercel Blob: ${destinationPath}...`);

  try {
    const blob = await put(destinationPath, audioBuffer, {
      access: 'public',
      token: DEFAULT_BLOB_TOKEN,
      contentType: 'audio/mpeg',
    });
    console.log(`   ✓ Uploaded successfully!`);
    console.log(`   🔗 Live Public URL: ${blob.url}`);
    return blob.url;
  } catch (err) {
    console.error(`   ❌ Failed to upload to Vercel Blob: ${err.message}`);
    return null;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isUpload = args.includes('--upload');
  const isList = args.includes('--list');
  const themeIdx = args.indexOf('--theme');
  const targetTheme = themeIdx !== -1 ? args[themeIdx + 1] : null;

  console.log('================================================================');
  console.log('🌌 GlimmerFall Online — Google DeepMind Lyria Music Pipeline');
  console.log('================================================================');

  if (isList) {
    console.log('\n📋 Registered Zonal Themes & Music Catalog:');
    for (const [key, spec] of Object.entries(MUSIC_PROMPT_CATALOG)) {
      console.log(`\n• [${key.toUpperCase()}] ${spec.name}`);
      console.log(`  BPM: ${spec.bpm} | Key: ${spec.key} | Duration: ${spec.durationSeconds}s | Looping: ${spec.loopable}`);
      if (spec.audioFile) {
        console.log(`  Current Audio File: ${spec.audioFile}`);
      }
      console.log(`  Prompt: ${spec.prompt.slice(0, 110)}...`);
    }
    return;
  }

  const themesToProcess = targetTheme
    ? [targetTheme]
    : args.includes('--all')
      ? Object.keys(MUSIC_PROMPT_CATALOG)
      : ['sanctuary'];

  for (const themeKey of themesToProcess) {
    const spec = MUSIC_PROMPT_CATALOG[themeKey];
    if (!spec) {
      console.error(`❌ Unknown theme: "${themeKey}". Run with --list to see available themes.`);
      continue;
    }

    const res = await generateTrackWithLyria(themeKey, spec, { dryRun: isDryRun });

    if (isUpload && res?.buffer) {
      await uploadToVercelBlob(themeKey, res.buffer, `${themeKey}.mp3`);
    } else if (isUpload && !res?.buffer) {
      const localFile = path.join(ROOT_DIR, 'assets', 'audio', `${themeKey}.mp3`);
      if (fs.existsSync(localFile)) {
        const fileBuf = fs.readFileSync(localFile);
        await uploadToVercelBlob(themeKey, fileBuf, `${themeKey}.mp3`);
      } else {
        console.log(`   ℹ No local audio file found at ${localFile} to upload.`);
      }
    }
  }

  console.log('\n✨ Music pipeline execution completed.\n');
}

main().catch((err) => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
