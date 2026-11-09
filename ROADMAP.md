# GlimmerFall Online 2D — Master Development Roadmap

> **Daily Sprint Schedule**: Minimum **1 Hour of Active Development Every Single Day**  
> **Core Direction**: Top-Down 2D Retro Pixel MMORPG inspired by Diablo 2 skill trees, GlimmerFall TCG faction mechanics, open landscape exploration, and fast-paced 60 FPS action.  
> **Repo Policy**: Strictly Local Work — `DONT PUSH TO GITHUB`.

---

## 🏛️ Project Vision & Design Pillars

1. **Diablo 2-Inspired Manual Progression & Dopamine Hits**
   - No automatic unlocking of spells. Players level up by slaying monsters and harvesting leylines, earning **Stat Points (3/lvl)** and **Skill Points (1/lvl)**.
   - Authentic Diablo 2 style Skill Trees with prerequisite trees, level requirements (Lv. 1, 3, 6, 12, 18, 24, 30), and multi-rank upgrades (Ranks 1 to 5).
   - Instant Flashes (0.0s cast time for mobility, interrupts, defensive counters) paired with Cast-Time Rites (authoritative casting bar, vulnerable to interrupts and movement cancel).

2. **Late-Game Paragon Resonance Beyond Level 30**
   - Reaching Level 30 unlocks the **Paragon Mastery System** (Paragon 1 to 100+).
   - XP feeds into Paragon Levels, granting Paragon Points to invest across 4 Ancient Leyline Affinities:
     * **Solari Radiant Wrath**: +% Critical Strike Damage & Holy Radiance Burst.
     * **Umbri Void Leech**: +% Movement Speed, Dodge & Life Leech.
     * **Terra Primal Bastion**: +Max Health, Health Regeneration & Damage Reduction.
     * **Aether Chrono-Surge**: -% Cooldown Reduction, Cast Speed & Max Glimmer.

3. **Seamless World Traversal (Foot Travel Only)**
   - All artificial waygate portals have been eliminated. Players travel exclusively by foot across contiguous border zones.
   - Walking into the center edge road smoothly transfers the champion into neighboring biomes with predictive client interpolation and zero rubberbanding.

4. **Zero-Lag Dual Realm Architecture**
   - **Single Player Realm (0ms)**: 100% offline local simulation. No servers, zero ping, instant 60 FPS client responsiveness.
   - **Multiplayer Realm**: Authoritative 20Hz tick server, client-side movement prediction, smooth lag compensation, and persistent cloud save state.

5. **Crystal-Clear Retro Visuals**
   - High-fidelity typography with antialiased fonts (`Outfit`, `Cinzel`, pixel badges).
   - Zero technical or database terminology in the user interface (no infrastructure references).
   - Clean character creation frontpage showing only **Factions and Characters** (item paperdoll switching isolated to in-game Hero Sheet `[C]`/`[H]`).

---

## 📅 Daily 1-Hour Sprint Schedule (30-Day Master Plan)

Every day contains one dedicated, realistic, high-impact 60-minute sprint.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GLIMMERFALL ONLINE 30-DAY SPRINT                      │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ PHASE 1: DAYS 1-7 │ PHASE 2: DAYS 8-14│ PHASE 3: DAYS 15-21│ PHASE 4: DAYS 22+│
│ Late-Game & Stats │ Biomes & Dungeons │ Economy & Crafting│ Raids & Polish  │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

---

### Phase 1: Combat Depth, Progression & Late Game Foundations (Days 1–7)

#### Day 1 — Paragon Resonance Mastery System & Deep Stats *(COMPLETED)*
- [x] Implement `MAX_BASE_LEVEL = 30` with Paragon XP rollover.
- [x] Author 4 Paragon Affinities (`solari_radiance`, `umbri_shadowcraft`, `terra_bulwark`, `aether_chronoflux`).
- [x] Add interactive Paragon Mastery investment UI to the Character Sheet (`[C]`).
- [x] Synchronize Paragon stats authoritatively across both Single Player and Multiplayer realms.
- [x] Remove room transition lag & rubberbanding (client prediction preserved, movement packets unlocked during transitions).

#### Day 1B — Canonical Equipment Paperdoll & Continental Faction Sets *(COMPLETED)*
- [x] Replaced legacy Relic modal with authentic Canonical Worn Equipment screen on key `[K]`.
- [x] Implemented all 11 paperdoll slots (`head`, `cape`, `neck`, `ammo`, `weapon`, `body`, `shield`, `legs`, `hands`, `feet`, `ring`) with silhouette placeholders.
- [x] Authored 5 canonical GlimmerFall faction sets with 4-piece set perks and bonus combat stats:
  * **Sunforged Daystar Bulwark (Solari)**: `sunforged_greathelm`, `sunforged_hauberk`, `sunforged_greaves`, `sunforged_warhammer` (Perk: +75% damage as HP drops; below 25% HP triggers 40% Max HP absorption shield).
  * **Primordial Ironwood Bastion (Terra)**: `ironwood_horned_helm`, `ironwood_bark_chest`, `ironwood_thighguards`, `ironwood_spear` (Perk: 25% chance to leech 100% damage as instant HP + 25% melee damage reflection).
  * **Chrono-Weaver Astral Vestments (Aether)**: `chrono_astral_hood`, `chrono_astral_robes`, `chrono_astral_skirt`, `chrono_warp_staff` (Perk: -25% cooldowns, -25% cast time, 25% chance for spell duplicate echo).
  * **Duskveil Shadow Reaver (Umbri)**: `duskveil_shadow_mask`, `duskveil_assassin_garb`, `duskveil_void_chaps`, `duskveil_twin_daggers` (Perk: +18% crit, +15% move speed, slaying enemies summons a Shadow Wraith minion).
  * **Aurelius Sovereign Titan (Apex)**: `crown_of_dawn`, `aurelius_sovereign_plate`, `aurelius_starforged_greaves`, `aurelius_morningstar_blade` (Perk: Radiating Archon Holy Aura 25 DMG/s, +150 Max HP, +30% Glimmer generation).
- [x] Equipment screen dynamically hides unequipped sets: only equipped sets (1-4 pieces) appear with progress, keeping the UI clean.
- [x] Late-game boss drop rates: set pieces drop ONLY on faction bosses (rare 15%), while regular mobs drop beginner pixelated equipment (10%) and stackable currencies.
- [x] Real-time 24x26 pixel paperdoll animation reflecting equipped weapons and armors.
- [x] Combat Stat Bonuses window calculating Attack/Power, Defense/Bastion, Magic/Resonance, Speed/Tempo, Crit %, HP, and Damage Reduction.

#### Day 1C — 28-Slot Inventory System, Stackable Currencies & Consumables *(COMPLETED)*
- [x] 10th Micro-Menu Dock Slot: `🎒 BAG [B]` positioned in the bottom-right corner of the 2x5 micro-menu.
- [x] 28-Slot backpack grid (4 columns x 7 rows) with capacity counter and quantity stack badges.
- [x] Multi-Currency Economy: Invented canon `Solar Gold Sovereign` (`solar_gold` 🪙) alongside faction currencies (`glimmer_shard`, `chrono_gem`, `verdant_amber`, `void_essence`).
- [x] Stackable Consumables: Added `minor_healing_salve` (🧪 heals +35 HP) and `glimmer_draught` (⚗️ restores +40 Glimmer).
- [x] Beginner Gear Grinding: Pixelated iron weapons, scout leathers, novice staves, and focus orbs for starter progression.
- [x] Item tooltips with rarity borders, slot types, set membership, stat breakdowns, and lore descriptions.
- [x] Left-click to equip or atomic swap with currently equipped piece; click consumables to use.
- [x] Right-click / context action to drop items onto the ground with quantity counter indicators.
- [x] Biome-specific monster and world boss equipment drops (Solari, Terra, Aether, Umbri, Warzone).
- [x] Authoritative server & offline single-player drop roll, ground loot rendering, pickup detection, and full inventory guardrails.

#### Day 1D — Diablo 2 Skill Tree Architecture, 8 Faction Archetypes, Rites vs Flashes & Manual Progression *(COMPLETED)*
- [x] **Diablo 2 Spellbook & Skill Tree Modal (`[P]`)**:
  - Authored a dedicated full-screen Skill Tree UI (`renderSkillTreeUI`) inspired by classic Diablo 2 skill trees with authentic gold borders, dark slate parchment, and tiered progression.
  - Divided into 3 active sub-views: **⚡ FLASH SPELLS**, **☀️ RITE SPELLS**, and **⌨️ KEYBINDS / ACTION SLOTS**.
  - Dynamic skill tree filtering automatically aligns to the champion's canonical faction (`Solari`, `Umbri`, `Terra`, `Aether`) based on equipped loadout and faction identity.
- [x] **7 Progression Tiers & Prerequisite Trees**:
  - **Tier 1 (Novice — Lv. 1)**: Starter basic attacks and baseline utility.
  - **Tier 2 (Initiate — Lv. 3)**: Secondary tactical abilities.
  - **Tier 3 (Adept — Lv. 6)**: Advanced area and crowd-control spells.
  - **Tier 4 (Vanguard — Lv. 12)**: Signature offensive and defensive spikes.
  - **Tier 5 (Master — Lv. 18)**: High-tier tactical and healing rites.
  - **Tier 6 (Champion — Lv. 24)**: Elite mobility, crowd-control, and execution tools.
  - **Tier 7 (Apex Ultimate — Lv. 30)**: Mythic screen-clearing ultimates (*Corona Cataclysm*, *Daystar*, *Unmake*, *Time Loop Paradox*).
  - Explicit prerequisite gates (`ab.prereq`): Higher-tier abilities strictly require investing at least Rank 1 into their precursor skills before unlocking.
- [x] **Rites (Heavy Cast-Time Spells) vs Flashes (Instant Off-GCD Abilities)**:
  - **Rites (Slots 1–4)**: High-impact canonical abilities with authentic cast times (0.6s to 1.8s), visible casting bar HUD, movement cancel penalties, and massive damage or area healing.
  - **Flashes (Slots 9–12)**: Instant (0.0s cast time) off-GCD abilities designed for high-tempo mobility (Blinks, Shadow Steps), stuns, shields, interrupts, and life-drains.
- [x] **8 Canonical Playable Archetypes Across 4 Factions**:
  - **☀️ Solari (The Light)**:
    * *Solari Vanguard*: Radiant Frontliner • Guard & Zenith (*Flare Strike*, *Solar Flare*, *Judgement of the Sun*, *Consecrated Ground*, *Radiant Bulwark*).
    * *Aurora Marshal*: Celestial Commander • Nexus Healer (*Flare Strike*, *Solar Flare*, *Decree of the Sun*, *Daybreak*, *Wrath of the Daystar*).
  - **🌑 Umbri (The Shadow)**:
    * *Umbral Assassin*: Stealth Executioner • Void Harvest (*Whisper of the Void*, *Unmake*, *Soul Tithe*, *Nightfall Plague*, *Shadow Step*).
    * *Graveglass Oracle*: Blood-Hex Reaper • Life Drain (*Whisper of the Void*, *Siphon Soul*, *Soul Tithe*, *Graveglass Ward*, *Veil of Dusk*).
  - **🌿 Terra (The Earth)**:
    * *Forest Warden*: Primal Bruiser • Overwhelm & Roots (*Tectonic Slam*, *Earthshatter*, *Ancient Boulder*, *Briar Snare*, *Wildshape Surge*).
    * *Stonekin Elder*: Colossal Tank • Thornbark Reflect (*Tectonic Slam*, *Ancient Boulder*, *Barkskin Infusion*, *Overwhelm Roar*).
  - **🔮 Aether (The Magic)**:
    * *Chronomancer Sage*: Time-Bender • Flash Tempo & Echo (*Reality Fracture*, *Astral Convergence*, *Arcane Bolt*, *Gravity Well*, *Chrono Shift*).
    * *Nexus Weaver*: Arcane Battlemage • Starfall & Freeze (*Reality Fracture*, *Arcane Bolt*, *Astral Convergence*, *Frost Nova*, *Mirror Barrier*).
- [x] **Manual Progression & Level-Up Dopamine**:
  - Defeating monsters awards character XP. Leveling up grants **+3 Stat Points** and **+1 Skill Point** per level.
  - Slaying monsters and clicking `[+]` upgrades abilities from Rank 1 to 5, granting bonus damage (`+3/rank`), cooldown reduction (`-0.35s/rank`), and increased shield/heal magnitudes.
  - Level-up fanfare: Gold sparks, screen chime, and floating combat text celebrating champion empowerment.
- [x] **Starter Rank 1 Auto-Unlock & Anti-Softlock Guarantee**:
  - Guaranteed starter attacks (`flare_strike`, `whisper_of_the_void`, `tectonic_slam`, `reality_fracture`) default to minimum Rank 1 so champions can always cast their primary basic attack without being soft-locked.
  - Implemented `resolveFactionAndClass` across database loading, WebSocket packets, and client profile synchronization—preventing characters from ever having mismatched factions or uncastable hotbars.
- [x] **Dynamic Keybind & Action Slot Remapping**:
  - Players can click any learned ability in the Spellbook or Keybinds tab to assign it to any unlocked action slot (Slots 1–4 or 9–12).
  - Action bar badges dynamically update with ability names, keybinds, rank indicators, and cooldown overlays.
  - Full server-authoritative validation preventing unlearned (Rank 0) abilities from executing.

#### Day 1E — Action Bar Overhaul, Rites/Flash Placement & Combat Polish *(COMPLETED)*
- [x] **Clean-Slate Action Bar**: New champions start with only their basic attack in slot 1 (plus `E` for extraction); the old eight-slot auto-fill is gone.
- [x] **Click-to-Place Assignment**: Click a learned Rite or Flash card (or its `🎯 PLACE IN BAR` button), the Spellbook closes, matching slots pulse gold, then click a slot (or press its key) to place it. `ESC` cancels, and wrong-family placements (Rite → 9–12, Flash → 1–4) are refused.
- [x] **Legacy Champion Rescue**: Level 5+ characters receive a one-time restore from their old slot-keyed progression, recovering every ability they had instead of showing only two.
- [x] **Manual & Automatic Filling**: `⚡ AUTO-EQUIP LEARNED` fills empty Rite (1–4) / Flash (9–12) slots with the highest-rank learned abilities, persists locally, and syncs authoritatively.
- [x] **Real Rank-Up Telemetry**: Skill cards show the actual `NEXT RANK n/5` power gain and cooldown drop instead of a hardcoded line.
- [x] **Full Keybinding Coverage**: The Keybinds tab lists all 13 slots, including item slots 5–8 with bag dropdowns; `SHIFT+click` any action-bar slot rebinds straight from the HUD; empty slots are bindable; `ESC` cancels; defaults reset.
- [x] **Item Action Slots**: Potions, food, and gear on 5–8 are stored per character, usable by keypress, draggable from the bag, and cleared by right-click.
- [x] **Combat & UI Polish**: Umbral Assassin regeneration corrected to 1 HP per 3 seconds (+Terra Bulwark scaling), Grand Font positions pulled inward in every zone, merchant coin glyph replaced with crisp CSS, and the quest-banner pulse removed.
- [x] **Titan Training Dummy**: Restored the strongest training dummy — a Lv.50 / 25,000 HP damage-test post in Sanctuary Haven beside the training grounds. It awards no XP per hit or on death, so it cannot be farmed.

#### Day 2 — Multi-Phase Continental World Bosses *(COMPLETE)*
- [x] Add dynamic AoE telegraph rings (solar bursts, void pools, earth tremors) to the 4 Continental World Bosses.
  - Faction-themed `telegraph` zones warn for 1.4–1.7s, then detonate into a shockwave with knockback (Terra slams also snare). Enrage shortens the cadence to 3.5s.
- [x] Implement Phase 2 Enrage mechanics (<40% HP: +35% attack speed, summoning faction minions).
  - Phase 2 at 65% HP summons three faction guardians. Phase 3 at 40% HP enrages the boss: +35% attack speed, +60% damage, and a faster cataclysm cycle. The Shattered Nexus Shard is exempt.
- [x] Add world-wide boss kill announcements and guaranteed Legendary drop chests.
  - Continental Victory now broadcasts to every connected champion, not just the boss room. Every world boss guarantees a faction set piece plus a relic accessory from its cache.
- [x] *Sprint Target*: High Sunfire Juggernaut (Solari) and Malakor the Soulreaper (Umbri) multi-phase encounters.
  - Both now run the full telegraph → guardian → enrage loop in online and offline realms.

#### Day 3 — Mythic Leyline Keystones & Dungeon Modifiers *(COMPLETE)*
- [x] Introduce Keystone items (Tier 1 to 10) for faction crypts (Sunken Vault, Shadow Labyrinth, Overgrowth Sanctuary, Fractured Archive).
  - Authored 40 canonical keystones (`keystone_<faction>_<tier>`), each tightly bound to its crypt. Crypt bosses drop entrance tiers (1–3); Continental and Apex world bosses drop Tier 4–9, with a 25% chance at Tier 10 from the Empyrean summit.
  - Using a key from the backpack inside its crypt consumes it and raises the run for that room instance: enemies scale **+18% Health and damage per tier**, with XP scaling +12% per tier.
  - A top-centre **Mythic Run HUD** shows the dungeon, tier, affixes, a live countdown and a draining leyline bar in both realms.
- [x] Implement dynamic dungeon affixes:
  * **Volcanic**: Erupting lava plumes spawn beneath players every few seconds, with a 1.15s telegraphed ring that must be dodged.
  * **Bolstering**: Slaying regular monsters empowers nearby enemies by +15% HP and Damage (stacking up to 8 times).
  * **Sanguine**: Defeated enemies leave blood pools that heal remaining foes for 3% max HP per 1.2s.
  - Tier 1–6 rolls two affixes; Tier 7–10 rolls all three, so high keys demand movement, kill priority and sustain.
- [x] Add Keystone timer and completion reward cache.
  - Timer runs **7:30 at Tier 1 → 12:00 at Tier 10**; expiry broadcasts a realm-wide failure message and clears the run.
  - Killing the crypt boss in time crystallizes a cache: tier-scaled Solar Gold, faction currency, Greater Vitality Elixirs, a guaranteed faction set piece, a bonus Apex relic at Tier 10, and the **next tier's keystone** (T1–T9) so the loop can continue.
  - Completion awards bonus XP, announces the clear to every connected champion, and persists across the authoritative server and the offline realm.

#### Day 4 — Legendary Relic Infusion, Leyline Socketing & Ancient Runewords *(COMPLETED)*
- [x] Expand Hero Equipment (`[K]`) with Leyline Relic Socket slots on Helm (`socket_head`), Armor (`socket_body`), and Weapon (`socket_weapon`).
- [x] Add socketable cut Leyline Gems (`gem_solar_ruby`, `gem_void_sapphire`, `gem_terra_emerald`, `gem_aether_diamond`) crafted at the Cosmic Star-Anvil / Aetherial Crucible and dropped by Elite Champions & World Bosses, granting Power, Crit, Max HP, Resonance, Tempo, and Max Glimmer.
- [x] Implemented Ancient Leyline Runes (`rune_sol`, `rune_umb`, `rune_ter`, `rune_aet`, `rune_zod`) with 16-bit pixel stone glyph sprites and Aetherial Crucible inscription recipes.
- [x] Authored 6 canonical 3-socket Runeword Synergies (`Sovereign Trinity`, `Dawnbreaker Radiance`, `Eclipse Reaper`, `Worldtree Aegis`, `Chrono Infinity`, `Prismatic Convergence`) with active runeword detection, stat boosts, and damage multipliers (`getActiveRuneword`).
- [x] Added Ancient Runeword Codex & Active Synergy Banner to the Equipment modal (`[K]`).
- [x] Integrated one-click Leyline Gem and Rune socketing & unsocketing UI directly in Equipment `[K]` and Backpack `[B]`.

#### Codebase Architecture & Modularization Sprint *(COMPLETED)*
- [x] **Monolith Split**: Decoupled monolithic files into clean, focused ES modules while maintaining 100% backward compatibility and 25/25 passing test coverage:
  - `index.html` (3,037 → 701 lines): Extracted inline styles to `client/styles/{base,hud,modals,main}.css`.
  - `shared/protocol.js` (4,192 → 11 lines): Sliced into 9 domain modules under `shared/protocol/`.
  - `client/sprites.js` (2,772 → 92 lines): Sliced into 6 sprite synthesizers under `client/sprites/`.
  - `server/roomManager.js` (6,077 → 535 lines): Decoupled into 10 authoritative server modules under `server/rooms/`.
  - `client/equipmentUi.js` (1,073 → 424 lines): Extracted inventory & exchange into `client/ui/`.
  - `client/itemSprites.js` (1,204 → 113 lines): Extracted gear & materials into `client/sprites/item*.js`.
  - `client/game.js` (14,296 → 12,110 lines): Extracted static data and skill guides into `client/game/`.
- [x] **New Pixelated Sprite Decorations**: Added 7 new custom pixel-art props in `client/sprites/propSprites.js` (`solariSundial`, animated `umbriBrazierAltar`, `terraMenhir`, `aetherArmillary`, `ancientWell`, `marketStallTailor`, `flowerBed`) and rendered across all realm hubs.
- [x] **Peaceful City Merchant Redistribution**:
  - Relocated Blacksmith Torvin (`merchant_smith`) to the Solari Citadel Forge Courtyard.
  - Established Shadow Stitcher Silvan (`merchant_tailor`) in the Umbri Undercity Silk Grotto.
  - Relocated Alchemist Faye (`merchant_apothecary`) to the blossoming Terra Orchard Arboretum.
  - Relocated Relic-Seeker Moira (`merchant_relics`) to the Aether Spire Celestial Observatory.
  - Maintained Farmer Bran (`merchant_provisions`), Grand Exchange Broker Caelum, and Banker Orin in Sanctuary Haven.
- [x] **Spatially Spread-Out Skilling Areas**: Added authoritative `SKILLING_LAYOUTS` in `shared/protocol/craftingAndSkilling.js`, establishing dedicated quarries, mineral seams, and botanical gardens across all continental zones with 100% parity across Single Player and Multiplayer.

#### Day 5 — Faction Territory Control & Warzone Outpost Siege Battles
- [ ] Expand the 4 Outpost Nexuses in Nexus Warzone into capturable faction strongholds.
- [ ] Implement a 30-minute territory influence cycle with visual faction flags and border banners.
- [ ] Control of 2+ outposts grants realm-wide passive buffs (+15% XP, +10% Glimmer harvest yield) to all members of that faction.
- [ ] Add mini-map territory ownership indicators.

#### Day 6 — Guild Architecture, Outpost Heralds & Shared Stashes
- [ ] Implement in-game Guild creation (`/guild create <Name> <Tag>`).
- [ ] Guild member roster modal with online status, level, faction, and guild ranks (Leader, Officer, Member).
- [ ] Shared Guild Bank Stash (24-slot persistent chest in Sanctuary Hub).
- [ ] Guild Outpost heralds placing custom banners on the battlefield.

#### Day 7 — 3v3 Arena Competitive Ladder & Gladiator Seasons
- [ ] Implement ELO MMR calculation for 3v3 Arena matches.
- [ ] Add Seasonal Leaderboard tab in the Arena Lobby UI with Tier badges (Bronze, Silver, Gold, Platinum, Diamond, Gladiator).
- [ ] Arena season reward titles and exclusive cosmetic weapon enchant glows.
- [ ] End-of-match combat statistics screen (Damage Done, Healing, Damage Taken, Kills, Deaths).

---

### Phase 2: World Expansion & Procedural Content (Days 8–14)

#### Day 8 — Deep Biome Expansion: Solari Sunken Vault & Dawn Spire Catacombs
- [ ] Expand the Solari Citadel north entrance into a multi-room dungeon layout.
- [ ] Add puzzle doors opened by harvesting Dawnstone Leyline Nodes.
- [ ] Add new monster types: *Dawnblade Inquisitor* and *Solar Flare Automaton*.
- [ ] Custom ambient soundscape for Sunken Vault.

#### Day 9 — Deep Biome Expansion: Umbri Abyssal Underchasm & Gloom River
- [ ] Expand the Sepulcher Undercity into dark subterranean catacombs.
- [ ] Implement creeping shadow darkness mechanic (stepping into light wards restores vision).
- [ ] Add new monster types: *Gloam Widow*, *Duskwraith*, and *Abyssal Devourer*.
- [ ] Ambient subterranean dripping water soundscape.

#### Day 10 — Deep Biome Expansion: Terra Ironwood Canopy & Ancient Rootways
- [ ] Expand Glimmer Orchard into an interconnected Ironwood Canopy with wooden rope bridges.
- [ ] Foliage wind sway effects and dynamic fallen leaf particles.
- [ ] Add new monster types: *Ironwood Thornkin*, *Spore Hydra*, and *Bramble Colossus*.
- [ ] Forest ambient breeze and insect soundscape.

#### Day 11 — Deep Biome Expansion: Aether Continuum Fractal Archives
- [ ] Expand Mirrorgate Spire into fractured floating astral platforms.
- [ ] Moving platforms and temporal rewind hazards.
- [ ] Add new monster types: *Paradox Sentinel*, *Chrono-Weaver*, and *Astral Remnant*.
- [ ] Cosmic resonant chime ambient soundscape.

#### Day 12 — Procedural Delves & Dynamic Warzone Encounters
- [ ] Add dynamic micro-events that spawn randomly in Nexus Warzone every 15 minutes (Glimmer Meteor Crash, Wandering Elite Caravan, Void Incursion).
- [ ] Mini-delve caves with randomized mob compositions and treasure chests.
- [ ] Realm-wide map announcement when a dynamic event triggers.

#### Day 13 — Elite Monster Affixes (Diablo 2 Champions) *(COMPLETE)*
- [x] Spawn rare Elite champions across hostile zones with glowing faction-tinted foot-auras, colored nameplates, and 4 cosmic affix archetypes:
  * **Solar-Charged**: +120% HP, +40% damage, +140% XP, blazing golden aura.
  * **Void-Touched**: +100% HP, +55% damage, +140% XP, umbral violet aura.
  * **Ironbark Bulwark**: +190% HP, +25% damage, +155% XP, emerald bastion aura.
  * **Chrono-Warped**: +110% HP, +45% damage, +150% XP, temporal cyan aura.
- [x] Elite champions grant bonus Solar Gold, guaranteed cosmic crafting materials, and a 15% drop chance at cut Leyline Socket Gems.

#### Day 14 — World Map Cartography, Fog of War & Discovery Waypoints
- [ ] Add full-screen interactive World Map (`[M]`).
- [ ] Fog of war uncovering as players explore continental territories.
- [ ] Waypoint Shrines: discoverable stone markers that can be activated on foot to mark waypoints on the map.
- [ ] Cartographer Atlas NPC dialogues and exploration milestone rewards.

---

### Phase 3: Player Economy, Crafting & Social Systems (Days 15–21)

#### Day 15 — Canonical Grindable Skilling System & Bottom-Right Skills Tab *(COMPLETE)*
- [x] **5 Canonical Grindable Skills (Levels 1–99, Authentic RuneScape XP Curve)**:
  * ⚡ **Resonance Extraction**: Channeling raw Glimmer and tapping leyline fissures across the world `[E]`.
  * 🔨 **Relic-Forging**: Smelting ores and forging enchanted weapons and armor with Blacksmith Torvin.
  * 📜 **Rite-Binding**: Distilling Glimmer, compounding restorative salves, and inscribing ceremonial rites with Alchemist Faye.
  * 🧵 **Glimmerweaving**: Spinning luminescent fibers, tailoring gear, and preparing provisions with Farmer Bran.
  * ⚔️ **Combat Mastery**: Battle prowess honed by banishing monsters and triumphing in 3v3 Arena.
- [x] **Bottom-Right Skills Tab `[N]` with Upward Pop-Up Animation**:
  * Integrated dedicated `✨ SKILLS [N]` button into bottom-right `#micro-menu` dock.
  * Anchored popup modal with smooth cubic-bezier upward pop-up animation directed towards the top-right 3v3 Arena Map / Minimap.
  * Real-time Total Level counter (5 to 495), per-skill level indicators (1–99), XP progress bars, and activity tooltips.
- [x] **Removed Order Banner Function**:
  * Fully decommissioned legacy banner button `[B]` from `#zone-controls` to eliminate keybind conflicts with `[B]` Backpack.
  * Cleared banner server handlers and client render loops.

#### Day 16 — Artisan Starter Quests & Skilling Integration *(COMPLETE)*
- [x] **4 Sanctuary Hub Artisan Starter Quests**:
  * ⚡ `Resonance: First Extraction` (Relic-Seeker Moira): Channel 2 Leyline / Glimmer Nodes around Sanctuary to harvest raw crystals. Awards 140 XP, 60 Glimmer, 100 Gold, and +75 Resonance Extraction XP.
  * 🔨 `Forging: The Anvil's Spark` (Blacksmith Torvin): Inspect Torvin's smithy or acquire forged iron wares. Awards 140 XP, 50 Glimmer, 100 Gold, and +75 Relic-Forging XP.
  * 📜 `Binding: The Alchemical Draught` (Alchemist Faye): Inspect Faye's apothecary formulas or acquire a healing salve. Awards 140 XP, 50 Glimmer, 100 Gold, and +75 Rite-Binding XP.
  * 🧵 `Weaving: The Luminescent Thread` (Farmer Bran): Inspect Bran's provisions or acquire field rations. Awards 140 XP, 50 Glimmer, 100 Gold, and +75 Glimmerweaving XP.
- [x] **Skilling Progression Integration & Authoritative Synchronization**:
  * Node harvesting awards +35 Extraction XP and updates quest task counters in real time.
  * Purchasing or crafting with artisans awards respective profession XP.
  * Monster kills award Combat Mastery XP.
  * Full persistence across sessions and database synchronization in PostgreSQL JSONB `progression.professions`.

#### Day 16B — Incremental XP Progression Curves & OSRS-Style Skill Unlock Guides *(COMPLETE)*
- [x] **Incremental XP Curve Scaling (50%–55% Compounding Per Level)**:
  - Eliminated flat linear level-up deltas where Lv. 1->2 and 3->4 felt identical.
  - Scaled character level XP progression using a 52–53% compounding delta formula: Lv. 1->2 requires 80 XP, Lv. 2->3 requires 122 XP (+52.5%), Lv. 3->4 requires 185 XP (+51.6%), Lv. 4->5 requires 281 XP (+51.9%).
  - Retuned 99-level profession XP table (`RS_XP_TABLE_99`) in `shared/protocol.js` with early-level +55% incremental delta increases (Lv. 2: 78 XP, Lv. 3: 199 XP, Lv. 4: 387 XP, Lv. 5: 678 XP) smoothly transitioning to classic high-level mastery.
- [x] **Old School RuneScape-Style Skill Guide & Milestone Unlock Browser**:
  - Clicking any skill card in the `#skills-tab-popup` opens the dedicated `#skill-guide-modal`.
  - Authored comprehensive milestone unlock guides for all 5 skills (Resonance Extraction, Relic-Forging, Rite-Binding, Glimmerweaving, Combat Mastery) spanning Lv. 1 to 99 Skillcapes.
  - Interactive quick-switch skill navigation tabs (`.sg-tab-btn`) with faction/skill accent themes.
  - Real-time status header tracking Current Level (Lv. X / 99), Total XP, and exact XP required for next level.
  - Dynamic filter pills (`ALL`, `UNLOCKED`, `LOCKED`) showing unlocked milestones with green checkmarks (`✓ UNLOCKED`) and future unlocks with padlock badges (`🔒 REQ. LV. X`).
  - Milestone cards detail unlock icon, milestone title, lore description, crafting station/instructor, and XP rewards.
- [x] **Launcher UX Polish & Persistent "Remember Me" Toggle**:
  - Removed "Read-only roster" label from the hero selection header in `client/frontpage.js` for a clean presentation.
  - Added an integrated "Remember me" checkbox toggle immediately to the right of `LOGIN` / `REGISTER`.
  - Automatic credential and session persistence with background auto-login across sessions, so players never have to re-enter credentials every launch.

#### Day 16C — Cosmic Artisan Skilling Overhaul, Bounty Board & Starfall/Abyssal Realms *(COMPLETE)*
- [x] **Character Selection Loadout Freeze & Hyper-Spin Fix**:
  - Eliminated the `sync_quest_state` -> `profile_updated` echo loop that trapped Lv. 2+ champions in a 20–50 Hz WebSocket feedback cycle, causing the frontpage preview sprite to spin rapidly while wiping DOM click listeners mid-click.
  - Added signature-guarded DOM diffing (`buildRenderSignature`) in `client/frontpage.js`, preserved selected character state across background profile refreshes, and tuned paperdoll animation cadence.
- [x] **Removed NPC Shop Gold-for-XP Training & Built Cosmic Artisan Stations**:
  - Removed `TRAIN` gold-for-XP buttons and passive shop-purchase XP from NPC merchants (`client/merchantUi.js`).
  - Added harvestable world **Ore & Mineral Veins** (*Copper-Glint*, *Iron-Shard*, *Solaris Mythril*, *Abyssal Starmetal*), **Luminescent Herb Clusters**, and **Astral Flax & Void-Silk Blooms** across Sanctuary and outer biomes (`[E]` or click).
  - Built 3 interactive in-world pixel crafting stations (`client/craftingUi.js`) with **35 Cosmic Artisan Recipes** spanning Lv. 1–78:
    * ⚒️ **Cosmic Star-Anvil** (*Relic-Forging*): Smelts raw ores + cosmic minerals into *Bronze-Glint*, *Star-Iron*, *Sun-Mythril*, and *Abyssal Starmetal* ingots, then forges blades, greataxes, warplate, wardshields, and cut *Solar Ruby* / *Terra Emerald* socket gems.
    * ⚗️ **Aetherial Crucible** (*Rite-Binding*): Distills herbs, essences, and *Cosmic Stardust* into *Vitality*, *Chrono*, and *Sovereign Starlight* elixirs, *Spellscribed Focus Orbs*, *Void Sapphire* / *Aether Diamond* socket gems, and *Mythic Keystones*.
    * 🧵 **Celestial Loom & Hearth** (*Glimmerweaving*): Spins *Astral Linen* and *Umbral Void-Silk* into cloaks, vestments, assassin hoods, and *Hearty Starfruit* / *Celestial Banquet* feasts.
- [x] **Sanctuary & Caldera Vanguard Bounty Board**:
  - Interactive in-world **Bounty Board** props issuing 6 repeatable combat, gathering, crafting, elite-hunting, and boss-slaying contracts awarding Solar Gold, Champion XP, Profession XP, and rare materials.
- [x] **2 New Mid/Late-Game Seamless Biomes, Pixel Art Sprites & Quests**:
  - **☄️ Starfall Crater (Lv. 20–32)**: Connected west of Solari Citadel and east of First Nexus Ruins; features scorched meteoric basalt tiles, *Starforged Automatons*, *Meteor Elementals*, rich mythril/starmetal veins, quest *Forge of the Fallen Star* (`Star-Smith Orion`), and multi-phase world boss **Ignis-Core, Starfall Colossus** (drops *Starmetal Meteor Hammer*).
  - **🌌 The Abyssal Rift (Lv. 32–45)**: Connected east of Continental Caldera and north of Empyrean Summit; features fractured void-crystal tiles, *Gloam Widows*, *Paradox Sentinels*, high-tier starmetal/silk nodes, quest *Breach of the Void Architect* (`Rift-Watcher Nihilus`), and multi-phase apex boss **Xal'Korath, Void Architect** (drops *Abyssal Voidstar Scythe*).

#### Day 17 — Player-to-Player Trading & Secure Trade Windows *(COMPLETE)*
- [x] Target another player -> `[🤝 TRADE]` button or `/trade <name>` command.
- [x] Two-sided secure trade window with 8 item slots and Solar Gold Sovereign exchange.
- [x] Dual-confirmation trade accept button; any offer modification immediately resets both players' acceptance to prevent trade scams.
- [x] Authoritative server-side inventory atomic swap with capacity check.

#### Day 18 — AetherSwap Continental Exchange (Cross-Faction Trading Alliance) *(COMPLETE)*
- [x] Canonical Lore: An invention of the Aether Astral Enclave to broker peace and exchange across the Shattered Nexus.
- [x] Dedicated AetherSwap interface modal (`[X]`) with 8 Trading Offer Slots.
- [x] Market Guide Price catalog with live item search across all 50+ weapons, armors, currencies, and Canonical Faction sets.
- [x] Instant Buy Limit & Sell Limit order placement actions with Solar Gold Sovereign and Glimmer pricing.
- [x] AetherSwap Continental Arbiter dialog explaining cross-realm order matching and alliance trade health.
- [x] Multi-realm asynchronous order book matching engine across online and offline champions with price-time priority.
- [x] AetherSwap Continental Arbiter NPCs stationed in Sanctuary Hub and Grand Bazaar.
- [x] Alliance Depot Box with automated currency and item retrieval.
- [x] 2% Solar Gold trade tariff sink on completed sales to maintain healthy realm anti-inflation.

#### Day 19 — Expanded Chat Channels, Player Inspect & Dueling *(COMPLETE)*
- [x] Chat channel commands: `/say`, `/faction`, `/party`, `/order`, `/trade`, `/duel`, `/inspect`.
- [x] Target player -> `[🔍 INSPECT]` button or `/inspect <name>` to view equipped paperdoll, combat attributes, paragon affinity, and 5 profession masteries.
- [x] Friendly Dueling: `/duel <PlayerName>` anywhere in peaceful zones or click `[⚔️ DUEL]`.
- [x] 3-second countdown (3... 2... 1... FIGHT!) with screen shake and sound cues.
- [x] Glowing dueling ring boundary (200px) with 5-second out-of-bounds forfeit timer.
- [x] Non-lethal surrender protection: duelist is protected at 1 HP, duel ends cleanly, winner announced, and HP safely restored to 35% with zero death penalty or XP loss.

#### Day 20 — Emote Wheel, Character Flair & Cosmetic Titles
- [ ] Radial Emote Wheel (`[V]`) with pixel animations and floating overhead emotes.
- [ ] Unlockable player titles based on achievements (e.g. `<Sunforged Hero>`, `<Void Slayer>`, `<Gladiator>`).
- [ ] Custom cosmetic order standards and faction weapon glows.

#### Day 21 — In-Game Achievements & GlimmerFall TCG Lore Codex
- [ ] Comprehensive Achievement System (`[Y]`) covering Combat, Exploration, Dungeons, PvP, and Gathering.
- [ ] GlimmerFall TCG Lore Codex: unlockable lore entries and digital cards detailing the history of the First Nexus and the 4 Factions.
- [ ] Completionist rewards (exclusive character visages and title badges).

---

### Phase 4: Endgame Raids, Polish, Balance & Performance (Days 22–30+)

#### Day 22 — The Continental Apex Raid: "Fall of the Primeval Nexus"
- [ ] Design a 10-player cooperative raid encounter deep inside the First Nexus Ruins.
- [ ] 3-phase raid boss: **The Primeval Harbinger** (1,500 HP):
  * Phase 1: Elemental Attunement (cycles immunity through Solari, Umbri, Terra, Aether).
  * Phase 2: Leyline Siphon (players must destroy 4 corner pylons before the room wipes).
  * Phase 3: Total Supernova (enraged frenzy with cascading cosmic shockwaves).
- [ ] Raid-tier Legendary drops with unique set bonuses.

#### Day 23 — Class Balancing & Skill Tree Synergy Pass
- [ ] Comprehensive DPS and survivability telemetry across all 8 archetypes.
- [ ] Fine-tune casting times on Rites and cooldowns on Flashes.
- [ ] Enhance Diablo 2 style cross-skill synergies (e.g. upgrading Flash increases Rite critical multiplier).
- [ ] Balance Arena 3v3 team compositions.

#### Day 24 — Boss Encounter VFX & Retro Soundscape Mastery
- [ ] Custom 8-bit/16-bit retro synthesizers for unique boss battle themes.
- [ ] Dynamic boss health bar at the top of the screen with phase indicators.
- [ ] Dramatic screen shake and impact particle bursts on heavy boss attacks.
- [ ] Audible voice chimes on critical combat events.

#### Day 25 — Mobile & Controller Input Optimization
- [ ] Refine virtual analog stick and touch action buttons for tablet/mobile devices.
- [ ] Add full gamepad support (Xbox, PlayStation, Steam Deck) via Gamepad API.
- [ ] Intuitive gamepad button mappings (A: Attack, X/Y/B: Flashes, Bumpers: Rites).
- [ ] Controller vibration / haptic feedback on hits and critical strikes.

#### Day 26 — Anti-Cheat & Authoritative Combat Verification Hardening
- [ ] Server-side speed-hack and vector validation hardening.
- [ ] Cooldown and glimmer cheat verification.
- [ ] Line-of-sight obstruction checks on high-damage rites.
- [ ] Automated rate-limiting on incoming WebSocket frames.

#### Day 27 — Cross-Zone Audio Transitions & Dynamic Ambient Soundscapes
- [ ] Smooth cross-fade between biome audio tracks during foot transitions.
- [ ] Positional audio for nearby waterfalls, crackling braziers, and howling winds.
- [ ] Combat tension music layer that swells when entering combat and softens when peaceful.

#### Day 28 — Realm Stress Testing & 500+ Player Concurrency
- [ ] Headless bot simulator testing 500 simultaneous players fighting in Warzone.
- [ ] Memory leak audit and garbage collection spike reduction.
- [ ] Spatial partitioning optimization on the server 20Hz loop.
- [ ] Sub-5ms server tick duration under peak load.

#### Day 29 — End-of-Season Tournament Engine
- [ ] Automated bracket tournament system for 3v3 Arena.
- [ ] Spectator mode: players in Sanctuary Hub can click a scrying pool to watch live tournament matches.
- [ ] In-game trophy pedestals displaying the reigning Gladiator champions of the season.

#### Day 30 — Live Operations & Continuous World Evolution
- [ ] Bi-weekly balance patches and community feedback integration.
- [ ] Global Seasonal Events (Solstice of Dawn, Night of the Eclipse, Bloom of the World Tree).
- [ ] End-of-season title distribution and realm-wide statue inaugurations in Sanctuary Haven.

---

### Phase 5: Global Expansion & Persistent World Architecture (Days 31–45)

#### Day 31 — Dynamic Day/Night Cycle & Biome Climate Shifts
- [ ] 24-minute game world day/night cycle (18 minutes daylight, 6 minutes eclipse/nightfall).
- [ ] Dynamic ambient lighting shifts: warm golden hues at dawn, deep twilight shadows during nightfall.
- [ ] Nocturnal creature spawns: Umbri Void Stalkers gain +15% movement and stealth during nightfall, while Solari Vanguard gain +15% holy radiance during peak midday.

#### Day 32 — Outpost Upgrade System & Tactical Warfare
- [ ] Factions can invest harvested Glimmer and Ironwood into upgrading captured Outposts in Continental Caldera.
- [ ] Tiered outpost upgrades:
  * Tier 1: Wooden Palisade & Basic Guard Sentry.
  * Tier 2: Stone Fortification & Faction Ballistas dealing defensive area damage.
  * Tier 3: Bastion Citadel with automated Leyline Shield Generators and Outpost Healers.

#### Day 33 — Multi-Floor Faction Dungeons & Keystone Affixes
- [ ] Expand each faction's ancestral dungeon into a 3-floor labyrinth with escalating challenges:
  * Solari: *Sunken Vault of the Daystar* (Boss: *Dawn Primarch Caelum*).
  * Umbri: *Sepulcher of the Endless Night* (Boss: *Arch-Lich Vesper*).
  * Terra: *The Hollow Heartwood* (Boss: *Yggdrasil Malform*).
  * Aether: *The Chrono-Fracture Abyss* (Boss: *Singularity Prime*).
- [ ] Dynamic dungeon affixes (Volcanic, Bolstering, Sanguine, Quaking, Inspiring).

#### Day 34 — Order Hall Citadels & Player Guild Castles
- [ ] High-ranking Guilds can claim abandoned ruins across the continent to establish their Order Citadel.
- [ ] Custom guild banners, trophy pedestals displaying slain World Boss heads, and shared Guild Stash chests.
- [ ] Guild-wide passive perks (e.g., +5% movement speed on roads, +10% vendor buy discounts).

#### Day 35 — Canonical Mount System & Overland Traversal
- [ ] Introduce pixel-art mounts for rapid foot travel across the 4800×3600 continental continent:
  * Solari: *Starlight Charger* (Armored radiant steed).
  * Umbri: *Voidfang Prowler* (Spectral shadow panther).
  * Terra: *Ironwood Elk* (Massive antlered forest stag).
  * Aether: *Chrono Drake* (Phase-shifting celestial drake).
- [ ] Mount summoning cast time (1.5s), dismounted upon taking player combat damage.

#### Day 36 — Cross-Faction Bounty Board & Renown Ranks
- [ ] Sanctuary Haven bounty board issuing daily high-value targets across the continent.
- [ ] 5 Faction Renown Ranks (Neutral, Recognized, Honored, Revered, Exalted) with exclusive cosmetic armor dyes and titles.

#### Day 37 — Fishing, Archeology & Ancient Relic Excavation
- [ ] Peaceful gathering sub-skills along continental rivers and ocean shores.
- [ ] Excavate ancient First Nexus relic fragments that assemble into collectible artifacts for the Lore Codex.

---

### Phase 6: Canonical GlimmerFall TCG Physical/Digital Convergence (Days 46–60)

#### Day 38 — In-World Sanctuary Tavern Card Tables
- [ ] Place interactive pixel card tables inside the Sanctuary Hub Tavern.
- [ ] Two players sitting across from each other can click the table to launch directly into an authentic 1v1 *GlimmerFall TCG* duel with their unlocked card decks.

#### Day 39 — Sealed Booster Pack Cracking & Relic Card Drops
- [ ] World Bosses and Mythic Dungeon chests drop sealed **Awakening Booster Packs**.
- [ ] Interactive 16-bit pack-cracking UI where cards flip open with foil shimmer VFX, revealing their real card art, card number, and TCG rarity.
- [ ] "View Card on GlimmerFallTCG.com ↗" instant link.

#### Day 40 — Unified GlimmerFall ID & Cross-Game Promotional Rewards
- [ ] Achievements unlocked in *GlimmerFall Online* award claimable promo codes for digital packs and starter deck discounts on `glimmerfalltcg.com`.
- [ ] Physical TCG card pack redeem codes unlock matching pixel paperdoll skins, titles, and weapon glows in the MMO.

#### Day 41 — Alternate-Art Pixel Card Skins & Foil Shimmer Shaders
- [ ] Custom WebGL shader rendering real-time holographic rainbow foil reflection on cards examined in the Codex.
- [ ] Collector binder UI displaying all 322 cards from *The Awakening* set with completion percentages.

#### Day 42 — Continental World Championship Spectator Amphitheater
- [ ] Dedicated spectator arena in the Aether Spire where players can watch high-ranked 3v3 Arena matches and seasonal TCG championship finals with live commentary chat.

---

## 🔒 Operating Rules & Constraints

- **STRICT**: `DONT PUSH TO GITHUB PLEASE`. All commits and changes remain local.
- **Minimum Daily Cadence**: 1 hour of focused coding and testing per calendar day.
- **Zero Jargon**: Never expose backend, database, or infrastructure terminology to players.
- **Purity of Experience**: Keep fonts crisp, combat snappy, and manual progression rewarding.
