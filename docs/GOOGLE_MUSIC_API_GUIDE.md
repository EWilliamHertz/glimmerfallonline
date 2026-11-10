# Google DeepMind Lyria Music Generation & Seamless Room Audio Guide

This guide details how **GlimmerFall Online** generates, integrates, and plays zonal soundtrack music using **Google DeepMind Lyria** (available via Google Cloud Vertex AI Model Garden & Google AI Studio Lyria RealTime) and persists playback across room transitions.

---

## 1. Google Music Generation Architecture

### Model: Google DeepMind Lyria
- **Family**: Google DeepMind Lyria / Lyria RealTime / MusicFX
- **Capabilities**: High-fidelity stereo audio generation, bpm-accurate instrumental arrangements, seamless loop generation, and stem separation.
- **Integration**:
  - **Vertex AI Model Garden**: Endpoint `projects/{project}/locations/{region}/publishers/google/models/lyria:predict`
  - **Google AI Studio / Gemini API**: `models/lyria-realtime:generateAudio`
  - **Direct Upload Pipeline**: Automatic upload to Vercel Blob (`glimmerfall/audio/<theme>.mp3`) with public CDN URLs.

---

## 2. In-Game Room Music Resume Engine

The player can enter any continental zone (Sanctuary Haven, Golden Citadel, Umbri Undercity, Terra Deepwoods, Mirrorgate Spire, Starfall Crater, Nexus Warzone, or World Boss Arenas), leave, and return—and the soundtrack resumes seamlessly from the exact second and measure where they left off.

### Configuration & Settings
Players can configure how room music transitions behave via:
1. **ESC -> Settings Modal -> Sound & Volume -> Room Music Transition**
2. **Sound Mixer Modal (`[🎚️ SOUND MIXER]`) -> Room Resume Mode**

Options available:
- **`always` (Default - Seamless)**: Always resumes playback at the previous timestamp whenever re-entering any zone.
- **`within_5m`**: Resumes playback if the zone was exited within the last 5 minutes. If more than 5 minutes have elapsed, the track restarts cleanly from `0:00`.
- **`within_15m`**: Resumes playback if exited within 15 minutes.
- **`restart`**: Always restarts the room's music track from the beginning upon entering.

Saved persistently in browser `localStorage` under `glimmerfall_bgm_resume_mode`.

---

## 3. Four-Channel Polyphonic Procedural Tracker Fallback

For instant, zero-latency playback (even before network audio streams buffer or in offline single-player), `client/audio.js` features an authentic 16-bit polyphonic chiptune engine with 4 concurrent channels:
1. **Lead**: Melodic chiptune lead (square or triangle waveforms)
2. **Harmony**: Counter-melodies and pad chord progressions (sine/triangle)
3. **Bass**: Grounding sub-basslines (sine or sawtooth)
4. **Percussion**: Procedural 16-bit drum synthesis (`kick`, `snare`, `hat`, `cymbal`)

---

## 4. Running the Lyria Music Generator Script

The project includes an automated runner script: `scripts/generate-google-music.mjs`.

### Commands
```bash
# 1. List all 8 zonal themes and prompt specs
node scripts/generate-google-music.mjs --list

# 2. Test generation payloads without network calls
node scripts/generate-google-music.mjs --dry-run
node scripts/generate-google-music.mjs --theme solari --dry-run

# 3. Generate and upload to Vercel Blob (using BLOB_READ_WRITE_TOKEN)
node scripts/generate-google-music.mjs --theme sanctuary --upload
node scripts/generate-google-music.mjs --all --upload
```

### Environment Variables
- `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob read/write token (pre-configured with `store_O20ql1pn6R6cwj04`).
- `GEMINI_API_KEY`: API key from Google AI Studio.
- `GCP_PROJECT_ID`: Google Cloud Project ID (if calling Vertex AI Model Garden).
- `GCP_REGION`: Google Cloud Region (defaults to `us-central1`).

---

## 5. Zonal Soundtrack Directory & Prompts

| Zone / Room | BPM | Scale / Key | Lead Style | Atmosphere |
| :--- | :---: | :---: | :--- | :--- |
| **Sanctuary Haven** | 85 | D major / B minor | Harp + Celesta | Ethereal starlight, peaceful sanctuary |
| **Solari Citadel** | 128 | D mixolydian | French Horn + Strings | Triumphant sun cathedral, heroic march |
| **Umbri Undercity** | 95 | F# minor | Cello + Harpsichord | Dark gothic dungeon crawler, crypt mystery |
| **Terra Deepwoods** | 110 | E minor | Acoustic Guitar + Flute | Druidic forest hymn, organic bodhran drums |
| **Aether Spire** | 140 | A minor | Glass Glockenspiel + Sine | Cosmic quantum tempo, shimmering starlight |
| **Starfall Abyss** | 80 | Eb minor | Sawtooth Bass Drone | Cosmic dread, descending dissonant tension |
| **Nexus Warzone** | 135 | A minor | Taiko Drums + Brass | Martial battle pulse, heroic continental clash |
| **World Boss / Siege** | 150 | E minor | String Ostinato + Timpani | Relentless cataclysmic battle climax |
