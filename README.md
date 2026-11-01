# GlimmerFall Online (3D MMORPG)

> Based on the Glimmerfall TCG universe ([glimmerfalltcg.com](https://www.glimmerfalltcg.com))

An international, scalable 3D browser-based MMORPG powered by Three.js and an automated Meshy v7.1 AI 3D asset generation pipeline via Fal.ai.

---

## 🌟 Key Features

1. **Third-Person MMORPG Combat & Movement**:
   - `WASD` camera-relative directional movement with lerped orientation.
   - `Space` jumping with gravity and ground collision.
   - `Shift` sprinting (60% movement speed boost).
   - Right-click mouse drag orbit camera & mouse-wheel zoom.
   - `Tab` target cycling and Left-click entity targeting.

2. **Full MMORPG World of Warcraft HUD**:
   - **Player Unit Frame**: HP bar (25 HP rule), resource bar (Solar Charge / Mana), level badge, class indicator.
   - **Target Unit Frame**: Objective integrity bar, exact HP / percentage, target-of-target display.
   - **Dual Action Bar (24 Slots)**: Primary row (`1-8`, `E`), Secondary row (`Shift+1` to `Shift+4`) with cooldown radial sweeps.
   - **Centered Cast Bar**: Shows spell casting progress with cast time animations.
   - **Interactive Minimap Radar**: Real-time positional radar tracking player, Nexus objective, crystal fonts, and hostile mobs.
   - **Floating Combat Text**: Dynamic 3D damage numbers, crits, heals, and resource gains.
   - **Procedural Audio Synthesizer**: Web Audio API retro-MMO sound effects (swords, spells, impacts, chimes).

3. **World Entities & Mechanics**:
   - **Central Nexus Monolith**: 25 HP primary objective matching Glimmerfall rules.
   - **Aether Resonance Crystal Spires**: Harvestable resource fonts (press `[E]`).
   - **Umbri Voidstalkers & Terra Golems**: Hostile patrolling mobs.
   - **Card-Relic Sockets (`K`)**: Socket authentic Glimmerfall TCG cards from `glimmerfalltcg.com` for dynamic class passives.
   - **Spellbook (`P`)** & **Character Sheet (`C`)**.

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Batch generate 3D GLB assets with PBR textures via Fal.ai Meshy v7.1
npm run generate:assets

# 3. Start local dev server (binds to 0.0.0.0:8080)
npm run dev
```

---

## 🎨 Asset Generation Pipeline (`scripts/generate-meshy-assets.mjs`)

Uses Fal.ai's `meshy/v7.1/image-to-3d` model to compile full PBR textured `.glb` meshes (BaseColor, Metallic, Roughness, Normal) directly from authentic card art URLs on Vercel Blob:

- `solari_hero.glb`: Solari Vanguard (~12,000 tris)
- `nexus_core.glb`: Chronocore Prism (~6,000 tris)
- `resonance_node.glb`: Mana Crystal (~3,000 tris)
- `umbri_minion.glb`: Void Stalker (~8,000 tris)
- `terra_golem.glb`: Granite Behemoth (~10,000 tris)
- `solari_blade.glb`: Solari Spellblade (~2,500 tris)
