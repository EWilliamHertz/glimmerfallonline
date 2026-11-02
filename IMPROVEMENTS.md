# GlimmerFall Online — 2D Pixel MMORPG & TCG Commercial Roadmap

> **Vision**: Evolve *GlimmerFall Online* into a flagship, zero-install **16-Bit 2D Pixel Art MMORPG** where players live inside the shattered realms of **GlimmerFall TCG** ([glimmerfalltcg.com](https://www.glimmerfalltcg.com))—experiencing real cards, Entities, Rites, Flashes, and Relics in real-time combat, and seamlessly converting into passionate *GlimmerFall TCG* collectors and competitive deckbuilders.

---

## 1. Multiplayer 2D MMORPG Foundation (`server/`)
Right now combat and zones run authoritatively at 20 Hz on the server with smooth 60 FPS client interpolation:

- [x] **Authoritative WebSocket Game Server (`ws` in `server/`)**:
  - 20 Hz tick state synchronization for player positions, facing directions, Rite/Flash casts, projectiles, and Nexus HP.
  - Room instances for **Awakening Sanctuary Hub** (up to 60 concurrent players chatting/trading, auto-sharding overflow instances), **Nexus Warzone** (open-world faction PvPvE), and **3v3 Ranked Nexus Arena** lobbies.
- [x] **Persistent Accounts & Unified GlimmerFall ID**:
  - Single Sign-On bridge (`/api/auth/sso/glimmerfall`, shared HS256 JWT / Supabase / Clerk + Summoner handle link) shared with `glimmerfalltcg.com`, plus persistent `scrypt` GlimmerFall ID accounts (`server/accountsStore.js`).
- [x] **Social MMO Layer**:
  - Pixel speech bubbles above characters' heads, Faction chat (`/f`), Party system (`3-player` squads with co-op XP, squad heals/shields & squad 3v3 queue), Guild/Order banners (`<TAG>` nameplates + plantable `+1 Power` War Standards `[B]`), and pixel emotes (`[V]`).

---

## 2. Direct Commercial & Funnel Integration for *GlimmerFall TCG*
Every mechanic in the 2D MMORPG should reinforce recognition, desire, and curiosity for the 322+ real cards in *The Awakening (AWK)* set:

- [ ] **Live `/api/cards` Relic & Loot Drops**:
  - Defeating World Bosses (*Granite Behemoth*, *Sunfire Colossus*, *Crypt Lord Malakor*, *Rift Titan*) drops **Card Shards / Sealed Booster Relics** that flip open with a 16-bit pack-opening animation—revealing the real high-res + pixel-art card from `glimmerfalltcg.com/api/cards` alongside a **"View Card & Build Deck on GlimmerFallTCG.com ↗"** button.
- [ ] **1:1 Card-to-Skill Loadout Deckbuilder ("Deck-Driven Action Bar")**:
  - Instead of fixed class abilities, let players build an **8-Card Rite & Flash Loadout** + **3 Equipped Relics** from cards they unlock in-game (e.g., slotting *Soul Siphon*, *Chrono Shift*, *Earthshatter*, or *Wrath of the Daystar*). Playing the MMO naturally teaches players the exact card names, costs, factions, and synergies of the physical/digital TCG!
- [ ] **Cross-Game Promo Codes & Rewards**:
  - Reaching **Level 10** or winning a **3v3 Nexus Match** in *GlimmerFall Online* awards a claimable **Promo Code / Account Unlock** (e.g., *Alternate-Art Pixel Solari Vanguard* cosmetic or starter pack discount on `glimmerfalltcg.com`).
  - Conversely, owning physical/digital *GlimmerFall TCG* starter decks grants matching **Pixel Relic Skins & Titles** in the MMO.
- [ ] **In-World Sanctuary Tavern Card Tables**:
  - Place interactive pixel card tables inside the Sanctuary Hub where two MMO players can sit down and launch directly into a live 1v1 *GlimmerFall TCG* match!

---

## 3. All 4 Factions & Playable Classes (Character Creation — COMPLETED ✓)
Expanded character creation and the new **Game Frontpage** (`client/frontpage.js`) to all four canonical *GlimmerFall TCG* factions and 8 playable archetypes, persisted in **Neon PostgreSQL** (`glimmerfall_accounts` & `glimmerfall_characters`), each with custom 24×26 pixel paperdoll spritesheets and signature TCG mechanics:

| Faction | Playable Archetypes | Signature TCG Rites & Flashes | Faction Mechanic |
| :--- | :--- | :--- | :--- |
| **☀️ Solari** *(The Light)* | *Solari Vanguard*, *Aurora Marshal* | *Flare Strike*, *Solar Flare*, *Radiant Bulwark*, *Decree of the Sun*, *Daybreak* | **Guard & Zenith** (Shield barriers & Nexus healing) |
| **🌑 Umbri** *(The Shadow)* | *Umbral Assassin*, *Graveglass Oracle* | *Shadow Step*, *Soul Tithe*, *Siphon Soul*, *Nightfall Plague*, *Unmake* | **Stealth & Void Harvest** (Vanish & life-drain) |
| **🌿 Terra** *(The Earth)* | *Forest Warden*, *Stonekin Elder* | *Tectonic Slam*, *Earthshatter*, *Barkskin Infusion*, *Briar Snare*, *Wildshape Surge* | **Overwhelm & Thornbark** (Roots, summons & damage reflect) |
| **🔮 Aether** *(The Magic)* | *Chronomancer Sage*, *Nexus Weaver* | *Chrono Shift*, *Gravity Well*, *Frost Nova*, *Astral Convergence*, *Time Loop Paradox* | **Flash Tempo & Echo** (Blinks, freezes & spell recasting) |

---

## 4. Deepening RPG Progression, World & Content
- [x] **4 Distinct Faction Biomes & Dungeons**:
  1. *Lantern District & Golden Citadel* (Solari — Boss: *Sunfire Colossus*)
  2. *Sepulcher Undercity & Duskveil Bog* (Umbri — Boss: *Crypt Lord Malakor*)
  3. *Glimmer Orchard & Rootdeep Expanse* (Terra — Boss: *Ancient Brambleheart*)
  4. *Mirrorgate Spire & Fractured Continuum* (Aether — Boss: *Rift Titan*)
- [x] **Equipment & Pixel Paperdoll Visuals**:
  - Equipping weapons/armor/relics like *Solari Spellblade*, *Scythe of the Soulreaper*, *Ironwood Armor*, or *Mirror Shield* visibly updates your 24×26 2D character sprite in real time across all connected clients.
- [x] **Faction Nexus Siege Events (Scheduled PvPvE)**:
  - Every 30 minutes (or on-demand via `/siege`), a **Shattered Nexus Shard** spawns in the center of the Warzone; all 4 factions clash to claim it while defending their own 25-HP Outpost Nexus.
- [x] **16-Bit Chiptune Soundtrack (BGM)**:
  - Procedural Web Audio / Tracker chiptune themes for *Awakening Isle* (ethereal arpeggios), *Nexus Warzone* (driving battle pulse), and *World Boss / Siege / 3v3 Climax* (with a HUD mute toggle `[M]`).

---

## 5. Polish, Accessibility & Viral Distribution
- [ ] **Hand-Crafted PNG Pixel Atlas Pipeline**:
  - Complement procedural pixel sprites with an artist-editable PNG spritesheet & Tiled (`.tmj`) map loader for rapid zone authoring.
- [ ] **Mobile & Tablet Touch Controls**:
  - Virtual pixel thumbstick + tap-to-cast Rite/Flash radial buttons so TCG fans clicking links from TikTok, Discord, X, or QR codes on physical card packs can play instantly on mobile browsers.
- [ ] **Streamable 60s "Play Now" Embed Widget**:
  - Embed *Awakening Isle* directly as an interactive hero banner or iframe on `glimmerfalltcg.com` ("Don't just read the lore—play a Solari Vanguard in 2 seconds").
