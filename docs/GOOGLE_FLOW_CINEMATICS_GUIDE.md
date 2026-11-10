# 🎬 GlimmerFall Online — Google Flow (Veo) Cinematics Production Guide

A production guide for generating cinematic sequences for **GlimmerFall Online** using **Google Flow** (Google Veo).

---

## ⚡ Google Flow API vs. Web Interface

| Attribute | Google Flow Web Interface | Google Cloud Vertex AI Veo API |
| :--- | :--- | :--- |
| **Model** | Google Veo / Veo 2 | `veo-2.0-generate-001` (Vertex AI) |
| **Credits** | Uses your **1,000+ Google Flow Credits** | Billed per second to a GCP Cloud Project |
| **Workflow** | Paste prompts, click generate, download MP4 | Requires Python/Node script + GCP Service Account |
| **Recommendation** | **Use your 1,000+ Flow credits on the web UI!** Download the `.mp4` and drop them into the project. The agent uploads them to Vercel Blob and wires them into the game automatically. | Optional future upgrade for fully automated backend generation. |

---

## 🎥 Recommended Generation Specs in Google Flow

For seamless integration into GlimmerFall Online:
- **Aspect Ratio**:
  - **In-Game Cinematics**: `16:9` (Widescreen Landscape)
  - **Social / TikTok / YouTube Shorts**: `9:16` (Vertical)
- **Quality / Resolution**: `1080p` Full HD (or `720p` upscaled)
- **Framerate**: `24 FPS` (Cinematic film look) or `30/60 FPS` (High-tempo action)
- **Duration**: **6 to 8 seconds** (Optimal for pacing, file size, and fast web streaming)

---

## 📋 Copy-Paste Prompts for Google Flow

---

### Scene 1: Prologue — The Shattered Crystal Heart
> **When it plays**: Triggered once before Hero Selection on new accounts / characters, with an instant **"⏩ Skip to Hero Selection"** button.

- **Duration**: `8 seconds`
- **Aspect Ratio**: `16:9` (1080p)
- **Camera Movement**: Slow 360-degree orbital rotation moving upward, followed by a sudden violent push-in upon fracture.
- **Prompt to copy into Google Flow**:
```text
Cinematic dark fantasy prologue, 1080p masterpiece. A colossal iridescent anatomical Crystal Heart floats in the cosmic void between a blazing golden sun and deep purple nebula. The crystal heart pulses with internal prismatic starlight. Suddenly, violent violet lightning fissures crack across its glass chambers. In an apocalyptic slow-motion detonation, the Crystal Heart shatters into thousands of glowing crystalline meteors trailing radiant gold and teal stardust, raining downward into an ancient continental crater below. Volumetric god rays, ethereal starlight embers, Unreal Engine 5 cinematic render, photorealistic crystal refraction, 8k resolution, highly detailed fantasy concept art.
```

---

### Scene 2: Awakening & Spawning in Sanctuary Haven
> **When it plays**: Triggered when a newly created summoner knight enters the game world at Sanctuary Haven for the very first time. Always skippable with `[ESC]` or `[Space]`.

- **Duration**: `6 seconds`
- **Aspect Ratio**: `16:9` (1080p)
- **Camera Movement**: Low-angle slow pedestal tilt upward from cobblestone to the hero's face.
- **Prompt to copy into Google Flow**:
```text
Cinematic fantasy character awakening sequence. Inside a grand ancient stone cathedral with sunlight streaming through stained glass, a glowing starlight crystal stasis pillar begins to dissolve into iridescent motes of dust. A heroic knight clad in ornate gold and deep obsidian armor materializes on a glowing marble sigil. The knight's eyes open with a piercing cyan Glimmer glow. They raise a consecrated glowing spellblade as holy golden runes pulse across the cathedral floor. Cinematic camera tilting up from floor to hero's face, atmospheric dust motes, volumetric lighting, epic MMORPG intro cinematic, 1080p, hyper-detailed fantasy armor.
```

---

### Scene 3: Boss Defeat — Solaris Core Colossus
> **When it plays**: Plays in a triumphant 5-second cinematic window upon defeating the World Boss inside the Sunken Vault.

- **Duration**: `6 seconds`
- **Aspect Ratio**: `16:9` (1080p)
- **Camera Movement**: Dynamic low-angle tracking shot zooming back as the colossus falls.
- **Prompt to copy into Google Flow**:
```text
Cinematic epic boss defeat climax. A gigantic ancient mechanical colossus forged of solar gold plates and burning starlight cores stumbles backward in a cavernous stone ruin. Cracks of blinding golden light erupt through its heavy armor plates. With a deafening roar, the colossus collapses to its knees and explodes into a radiant shockwave of golden sparks and floating solar embers. The dust clears to reveal a gleaming golden chest radiating divine light on the ancient altar. Cinematic slow-motion explosion, dramatic rim lighting, particles and smoke simulation, cinematic film still, 1080p.
```

---

### Scene 4: Boss Defeat — The Abyssal Devourer (Undercity)
> **When it plays**: Plays upon slaying the subterranean void terror inside the Umbri Shadow Labyrinth.

- **Duration**: `6 seconds`
- **Aspect Ratio**: `16:9` (1080p)
- **Camera Movement**: Crane shot rising above the collapsing abyss.
- **Prompt to copy into Google Flow**:
```text
Cinematic dark fantasy boss vanquish. A terrifying multi-eyed shadow leviathan made of liquid smoke and amethyst crystal coils shrieks as ethereal cyan energy blades impale its core. The shadow beast collapses into a swirling purple gravitational singularity, imploding into ethereal mist and leaving behind a floating, glowing purple Graveglass relic core pulsing on the damp obsidian stone floor. Dark ethereal fantasy aesthetic, bioluminescent purple lighting, volumetric shadow smoke, dramatic camera pull back, 1080p cinematic render.
```

---

### Scene 5: Outpost Nexus Shattering (3v3 Warzone Victory)
> **When it plays**: Victory sequence when a rival faction's 25-HP Outpost Nexus reaches 0 HP in competitive Warzones.

- **Duration**: `5 seconds`
- **Aspect Ratio**: `16:9` (1080p)
- **Camera Movement**: Fast dramatic whip pan towards the exploding monolith crystal.
- **Prompt to copy into Google Flow**:
```text
High-tempo cinematic battle finale. A massive floating crystalline monolith nexus on an ancient battlefield fractures under a final barrage of magical arrows and lightning spells. The monolith core detonates in an awe-inspiring shockwave of rainbow prismatic energy, sending shockwaves across the grassy plains. A grand faction war banner unfurls triumphantly in the wind as celebratory golden firework sparks fill the sky. Fast camera motion, dynamic motion blur, hyper-detailed explosion simulation, cinematic fantasy action movie still.
```

---

### Scene 6: Viral TikTok / YouTube Shorts Marketing Teaser
> **When it plays**: Used for social media advertising, TikTok, YouTube Shorts, and Instagram Reels.

- **Duration**: `8 to 10 seconds`
- **Aspect Ratio**: `9:16` (Vertical Mobile, 1080x1920)
- **Camera Movement**: Fast, relentless forward push-in with dynamic rotation.
- **Prompt to copy into Google Flow**:
```text
Viral fantasy action game trailer cinematic in 9:16 vertical format. Fast-paced montage: first, an iridescent magical crystal heart detonates in deep space; cut to a heroic pixel knight in radiant armor drawing a blazing spellblade; cut to four distinct elemental warriors (solar gold, void purple, nature emerald, arcane cyan) clashing on an ancient battlefield; cut to a gigantic ancient stone titan roaring under a cosmic aurora. High saturation, neon glow accents, epic cinematic trailer lighting, intense motion, 60fps aesthetic, photorealistic VFX.
```

---

## 🚀 How to Ingest Generated Clips into GlimmerFall

1. **Generate in Google Flow**: Paste any of the prompts above into Google Flow, select **16:9 (or 9:16)**, generate, and click **Download MP4**.
2. **Drop into Workspace**: Drop the downloaded `.mp4` into the project root (e.g. `glimmerfall_prologue.mp4`).
3. **Automated Cloud Hosting**: The system uploads it directly to your Vercel Blob store (`store_O20ql1pn6R6cwj04`) using your `BLOB_READ_WRITE_TOKEN`.
4. **Instant In-Game Integration**: The video is assigned an authoritative URL and registered into `window.playCinematicModal(type)` and the hero selection flow with an always-skippable `[Skip]` button!
