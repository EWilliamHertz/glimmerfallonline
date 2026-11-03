# GlimmerFall Online — 16-Bit 2D Pixel Art MMORPG

> Set in the canonical **GlimmerFall TCG** universe ([glimmerfalltcg.com](https://www.glimmerfalltcg.com))

A fast-paced, shared-world **16-bit 2D Pixel Art MMORPG** powered by an **Authoritative 20 Hz WebSocket Server** (`server/`) and **Neon PostgreSQL** (`DATABASE_URL`), featuring all 4 canonical *GlimmerFall TCG* Factions, 8 Playable Archetypes, 35 TCG Rites & Flashes, real-time 24×26 Pixel Paperdoll equipment, 4 Faction Biome Dungeons, 30-minute Scheduled Nexus Siege Events, and a procedural 16-bit Chiptune Soundtrack.

---

## 🌟 Key Features

1. **Interactive Game Frontpage & Multi-Character Roster (`client/frontpage.js`)**:
   - Create and switch between multiple Champions persisted in **PostgreSQL** (`glimmerfall_accounts` & `glimmerfall_characters`).
   - Choose your **Name**, **Order Tag (`<SUN>`)**, **Canonical Faction**, **Playable Class**, **Paperdoll Gear**, and custom **8-Slot Rite/Flash Loadout** before entering the realm (or anytime via `👤 HERO` in the HUD).

2. **All 4 Canonical GlimmerFall TCG Factions & 8 Playable Classes**:
   - **☀️ Solari *(The Light)*** — *Solari Vanguard*, *Aurora Marshal* | **Guard & Zenith** (100 Glimmer triggers Zenith State +25% DMG & heals allied Outpost Nexus).
   - **🌑 Umbri *(The Shadow)*** — *Umbral Assassin*, *Graveglass Oracle* | **Stealth & Void Harvest** (Vanish from hostile sight +45% Ambush crit & 20% Rite life-drain).
   - **🌿 Terra *(The Earth)*** — *Forest Warden*, *Stonekin Elder* | **Overwhelm & Thornbark** (Cleave splash, roots & 15–35% melee damage reflection).
   - **🔮 Aether *(The Magic)*** — *Chronomancer Sage*, *Nexus Weaver* | **Flash Tempo & Echo** (-12% cooldowns, blinks, freezes & 35% Spell Echo double-cast).

3. **Real-Time 24×26 Pixel Paperdoll Visuals (`[I]`)**:
   - Equipping weapons, armor, and relics (*Solari Spellblade*, *Scythe of the Soulreaper*, *Ironwood Armor*, *Mirror Shield*, *Sunfire Colossus Greatsword*, etc.) visibly updates your 4-directional 2D character sprite in real time for every player in the room.

4. **Shared World Realms, 4 Faction Biomes & Scheduled Siege Events**:
   - **Awakening Sanctuary Hub** (up to 60 players per instance, calm starlight island + 4 Biome Waygates).
   - **Nexus Warzone (4-Faction Siege PvPvE)**: Defend your faction's **25-HP Outpost Nexus**, shatter rival Outposts, and clash every 30 minutes over the central **Shattered Nexus Shard** (or trigger on demand with `/siege`).
   - **4 Faction Biome Dungeons**: *Golden Citadel* (*Sunfire Colossus*), *Sepulcher Undercity & Duskveil Bog* (*Crypt Lord Malakor*), *Glimmer Orchard* (*Ancient Brambleheart*), and *Mirrorgate Spire* (*Rift Titan*).
   - **3v3 Ranked Nexus Arena**: Solo or 3-player Squad matchmaking.

5. **Social MMO Layer & 16-Bit Chiptune BGM (`[M]`)**:
   - Overhead pixel speech bubbles (`[Enter]`), Faction (`/f`), Squad (`/p`), and Order (`/o`) chat, 3-player Squads (`[O]`), plantable Guild/Order War Standards (`[B]`), pixel emotes (`[V]`), and 3 procedural 16-bit tracker BGM themes (*Awakening Isle*, *Warzone*, and *Boss/Siege Climax*).

---

## 🚀 Setup & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure PostgreSQL (optional — falls back cleanly to local JSON if omitted)
cp .env.example .env
# Edit .env and set DATABASE_URL="postgresql://..."

# 3. Start both the 20Hz Authoritative MMO Server (:3001) + Vite Client (:8080)
npm start
```

## Hosting online multiplayer for free (Vercel + Render)

Vercel can serve the web client and the login/character `/api`, but serverless functions cannot hold the 20 Hz
WebSocket game loop. Run the game server (`server/index.js`) on a free Node host and point the Vercel client at it:

1. **Render** (free): *New → Blueprint →* this repo (uses [render.yaml](render.yaml)). Paste your Neon `DATABASE_URL`.
   You get e.g. `https://glimmerfall-online.onrender.com` — this URL alone is already a full playable site.
2. **Vercel**: *Settings → Environment Variables →* `DATABASE_URL` (same Neon string) and
   `VITE_GAME_SERVER_URL=https://glimmerfall-online.onrender.com`, then redeploy.
3. *(Optional)* GitHub → *Settings → Variables → Actions →* `GAME_SERVER_URL` = the Render URL. The
   [keepalive](.github/workflows/keepalive.yml) workflow pings it every 10 min so it doesn't sleep.

Because both hosts share the same `DATABASE_URL`, accounts and characters made on either one work on the other.
If the free server is asleep, login falls back to Vercel's `/api` and the game connects as soon as it wakes (~30–50 s).
Players can also override the server from the `[O]` Social modal or `?server=https://...`.
