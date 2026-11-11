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
  title: {
    name: 'The Dawn of Glimmer (Main Theme & Loadout)',
    bpm: 92,
    key: 'D major / B minor',
    timeSignature: '4/4',
    durationSeconds: 90,
    loopable: true,
    prompt:
      'Breathtaking fantasy RPG main theme soundtrack, studio master quality, 92 BPM. ' +
      'Sweeping symphonic strings building into an awe-inspiring melodic French horn anthem, ' +
      'warm acoustic concert harp arpeggios, shimmering celesta stardust drops, rich ambient low-end cellos, ' +
      'and delicate choral humming. Evokes ancient cosmic mystery, noble heroic awakening, and vast continental wonder. ' +
      'Seamless loop, wide stereo field, cinematic orchestral production, crystalline high end.',
    negativePrompt:
      'harsh distortion, electric guitars, aggressive drums, vocals, lyrics, speech, clipping, muddy bass, sudden stop',
  },
  sanctuary: {
    name: 'Awakening Sanctuary Haven (Pixel Overloop & Starlight Stasis)',
    bpm: 85,
    key: 'D major / B minor',
    timeSignature: '4/4',
    durationSeconds: 96,
    loopable: true,
    audioFile: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/sanctuary_pixel_overloop.m4a',
    prompt:
      'Peaceful, restorative video game soundtrack for a celestial safe haven, 85 BPM. ' +
      'Gentle fingerstyle acoustic nylon guitar paired with warm concert harp glissandos, crystalline glass bells, ' +
      'soft analog synth pads, and subtle 16-bit melodic triangle wave accents. Ethereal, contemplative, ' +
      'and soothing atmosphere of starlight stasis and ancient sanctuary. Seamless loop, warm sub-bass, immaculate dynamic range.',
    negativePrompt:
      'heavy drums, aggressive percussion, dark minor key, horror, distortion, techno, modern trap, loud brass',
  },
  solari: {
    name: 'Daybreak at the Sunspire (Golden Citadel)',
    bpm: 126,
    key: 'D mixolydian / D major',
    timeSignature: '4/4',
    durationSeconds: 90,
    loopable: true,
    prompt:
      'Triumphant, uplifting medieval fantasy orchestral march, 126 BPM. ' +
      'Soaring golden French horn fanfares, heroic first violin section melodies, regal brass counterpoint, ' +
      'radiant cathedral choir chords, crisp marching snare drum rolls, and resonant orchestral timpani strikes. ' +
      'Blazing with the radiant warmth of morning sunfire and noble valor. Seamless loop, punchy percussion, majestic stereo brass mix.',
    negativePrompt:
      'gloomy, dark, melancholic, horror, screams, modern EDM, heavy metal guitars, muddy bass, mono',
  },
  umbri: {
    name: 'Shadows in the Nether Sepulcher (Umbri Undercity)',
    bpm: 94,
    key: 'F# minor / C# minor',
    timeSignature: '4/4',
    durationSeconds: 105,
    loopable: true,
    prompt:
      'Atmospheric gothic dark fantasy dungeon soundtrack, 94 BPM. ' +
      'Haunting solo cello playing an expressive, melancholic melody, echoing subterranean water droplets, ' +
      'delicate detuned baroque harpsichord runs, deep resonant sub-bass drones, and distant ethereal whispering choral textures. ' +
      'Brooding violet mystery and forgotten subterranean tombs. Seamless loop, cavernous natural reverb, dynamic dark cinematic mix.',
    negativePrompt:
      'upbeat pop, bright trumpet, happy sunshine, dance music, loud distorted beats, modern synthwave, clipping',
  },
  terra: {
    name: 'The Rootdeep Hymn (Terra Deepwoods & Glimmer Orchard)',
    bpm: 108,
    key: 'E minor / G major',
    timeSignature: '4/4',
    durationSeconds: 100,
    loopable: true,
    prompt:
      'Lush organic Celtic druidic forest soundtrack, 108 BPM. ' +
      'Warm fingerpicked acoustic 12-string guitar, enchanting wooden Irish low whistle flute melody, ' +
      'earthy bodhran hand drums, gentle willow wood chimes, and deep cello basslines. ' +
      'Sunbeams filtering through massive ancient titan pines and glowing moss. Seamless loop, rich organic woody timbres, warm analog recording.',
    negativePrompt:
      'electronic synths, autotune, 808 sub, industrial metallic sounds, screeching electric guitars, distortion',
  },
  aether: {
    name: 'Mirrorgate Continuum (Aether Spire)',
    bpm: 138,
    key: 'A minor / C major',
    timeSignature: '4/4',
    durationSeconds: 88,
    loopable: true,
    prompt:
      'Cosmic progressive sci-fantasy adventure soundtrack, 138 BPM. ' +
      'Shimmering glass glockenspiel arpeggios, swirling analog sine wave leads, crystalline starlight reverb, ' +
      'driving rhythmic pizzicato strings, and hypnotic upward-flowing momentum. Wonder, astronomical equations, ' +
      'and dimensional portals across a starry nebula. Seamless loop, sparkling pristine high frequencies, immersive stereo panning.',
    negativePrompt:
      'muffled, muddy low end, acoustic folk, gloomy gothic horror, heavy metal drums, abrupt stop',
  },
  abyss: {
    name: 'Cataclysm at Starfall (Abyssal Rift)',
    bpm: 78,
    key: 'Eb minor / diminished',
    timeSignature: '4/4',
    durationSeconds: 110,
    loopable: true,
    prompt:
      'Deep cinematic cosmic dread and abyssal rift soundtrack, 78 BPM. ' +
      'Low distorted sawtooth sub-bass drones, slow menacing orchestral cello ostinatos, eerie descending microtonal string dissonance, ' +
      'distant subterranean meteor rumbles, and cavernous industrial pulse hits. The crushing void of fractured cosmic gravity. ' +
      'Seamless loop, massive deep sub-frequencies, intense cinematic tension.',
    negativePrompt:
      'cheerful, upbeat, acoustic pop, happy brass, vocals, fast dance beat, video game chiptune bleeps',
  },
  warzone: {
    name: 'Caldera Battle March (Nexus Continental Warzone)',
    bpm: 136,
    key: 'A minor / D minor',
    timeSignature: '4/4',
    durationSeconds: 96,
    loopable: true,
    prompt:
      'Adrenaline-pumping cinematic battle march for an epic fantasy warzone, 136 BPM. ' +
      'Thunderous Japanese taiko drums and colossal orchestral war drums, aggressive rhythmic cello and double-bass ostinatos, ' +
      'heroic brass horn section countermelodies, clashing shields and steel accents, and driving momentum. ' +
      'Epic clash of continental armies fighting for supreme glory. Seamless loop, punchy transient percussion, wide cinematic stereo master.',
    negativePrompt:
      'peaceful, romantic, solo piano, lullaby, speech, hip hop trap beats, silence, lo-fi',
  },
  boss: {
    name: 'Supernova Climax (World Boss & Nexus Monolith)',
    bpm: 152,
    key: 'E minor / G harmonic minor',
    timeSignature: '4/4',
    durationSeconds: 84,
    loopable: true,
    prompt:
      'Relentless, apocalyptic orchestral boss fight climax soundtrack, 152 BPM. ' +
      'Rapid sixteenth-note violin and viola ostinatos, furious double-kick orchestral timpani, ' +
      'catastrophic brass horn and trombone fanfares, epic gothic choir chanting Latin incantations, ' +
      'and monumental climactic battle tension against impossible cosmic odds. Frantic high tempo, maximum dynamic impact, seamless loop.',
    negativePrompt:
      'elevator music, chillhop, acoustic guitar, quiet, slow tempo, happy pop, lo-fi, silence',
  },
  victory: {
    name: 'Spoils of the Stars (Victory Fanfare)',
    bpm: 118,
    key: 'C major / G major',
    timeSignature: '4/4',
    durationSeconds: 24,
    loopable: false,
    prompt:
      'Triumphant, short heroic fantasy victory fanfare, 118 BPM. ' +
      'Soaring golden trumpet fanfare over rolling symphonic timpani, cascading celestial harp glissandos, ' +
      'sparkling starlight celesta, and rich celebratory orchestral brass cadence resolving in radiant major harmony. ' +
      'Evokes legendary conquest, celestial loot prisms, and epic MMORPG reward celebration. Studio master quality, crisp stereo reverb tail.',
    negativePrompt:
      'defeat, sad minor key, horror, distortion, techno, speech, screeching',
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

  const cleanName = filename || `${themeKey}.mp3`;
  const destinationPath = `glimmerfall/audio/${cleanName}`;
  const ext = path.extname(cleanName).toLowerCase();
  const contentType = ext === '.m4a' ? 'audio/mp4' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg';

  console.log(`☁️  Uploading to Vercel Blob: ${destinationPath} (${contentType})...`);

  try {
    const blob = await put(destinationPath, audioBuffer, {
      access: 'public',
      token: DEFAULT_BLOB_TOKEN,
      contentType,
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
      const candidateExts = ['.m4a', '.mp3', '.wav', '.ogg'];
      let foundPath = null;
      let foundExt = null;
      for (const ext of candidateExts) {
        const candidate = path.join(ROOT_DIR, 'assets', 'audio', `${themeKey}${ext}`);
        if (fs.existsSync(candidate)) {
          foundPath = candidate;
          foundExt = ext;
          break;
        }
      }

      // Also search root directory or assets/audio for filenames containing the theme key
      if (!foundPath) {
        const audioDir = path.join(ROOT_DIR, 'assets', 'audio');
        if (fs.existsSync(audioDir)) {
          const files = fs.readdirSync(audioDir);
          const match = files.find((f) => f.toLowerCase().includes(themeKey.toLowerCase()));
          if (match) {
            foundPath = path.join(audioDir, match);
            foundExt = path.extname(match);
          }
        }
      }

      if (foundPath) {
        const fileBuf = fs.readFileSync(foundPath);
        const destFilename = `${themeKey}${foundExt || '.m4a'}`;
        await uploadToVercelBlob(themeKey, fileBuf, destFilename);
      } else {
        console.log(`   ℹ No local audio file found for ${themeKey} (.m4a, .mp3, .wav) in assets/audio/ to upload.`);
      }
    }
  }

  console.log('\n✨ Music pipeline execution completed.\n');
}

main().catch((err) => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
