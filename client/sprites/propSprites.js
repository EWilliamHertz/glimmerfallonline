import { makeCanvas, px, rect, addPixelOutline, hash2d } from "./pixelCanvas.js";
import { buildFamiliarSprites } from "./familiarSprites.js";

export function buildPropSprites(sprites) {
  buildFamiliarSprites(sprites);
  // ==========================================
  // 2. WORLD PROPS (Gentle Warm Brazier & Pillar)
  // ==========================================
  sprites.props.brazier = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 24);
    rect(ctx, 5, 18, 6, 4, '#475569');
    rect(ctx, 4, 21, 8, 2, '#334155');
    rect(ctx, 4, 14, 8, 4, '#94a3b8');
    rect(ctx, 5, 15, 6, 2, '#cbd5e1');
    rect(ctx, 5, 10, 6, 4, '#ea580c');
    rect(ctx, 6, 7, 4, 5, '#f59e0b');
    rect(ctx, 7, 6 + f, 2, 3, '#fde047');
    sprites.props.brazier.push(addPixelOutline(c));
  }

  {
    const { c, ctx } = makeCanvas(20, 32);
    rect(ctx, 4, 26, 12, 5, '#334155');
    rect(ctx, 5, 6, 10, 20, '#64748b');
    rect(ctx, 6, 6, 3, 20, '#94a3b8');
    rect(ctx, 4, 4, 12, 3, '#cbd5e1');
    rect(ctx, 9, 10, 2, 10, '#38bdf8');
    px(ctx, 8, 13, '#7dd3fc');
    px(ctx, 11, 16, '#7dd3fc');
    sprites.props.pillar = addPixelOutline(c);
  }

  // Ancient Weathered Runic Monument
  {
    const { c, ctx } = makeCanvas(24, 34);
    rect(ctx, 3, 28, 18, 5, '#1e293b');
    rect(ctx, 5, 25, 14, 3, '#334155');
    rect(ctx, 6, 6, 12, 19, '#475569');
    rect(ctx, 7, 7, 10, 17, '#64748b');
    rect(ctx, 8, 4, 8, 3, '#94a3b8');
    rect(ctx, 10, 2, 4, 2, '#cbd5e1');
    // Glowing omni-elemental runes
    rect(ctx, 9, 9, 6, 2, '#38bdf8');
    rect(ctx, 11, 11, 2, 4, '#fde047');
    rect(ctx, 9, 15, 6, 2, '#4ade80');
    rect(ctx, 11, 17, 2, 3, '#c084fc');
    sprites.props.monument = addPixelOutline(c);
  }

  // Floating Astral Crystal Pillar
  sprites.props.crystalPillar = [];
  for (let f = 0; f < 2; f++) {
    const hover = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(20, 36);
    rect(ctx, 4, 30, 12, 4, '#1e293b');
    rect(ctx, 6, 28, 8, 2, '#334155');
    // Floating upper spire crystal
    rect(ctx, 8, 3 + hover, 4, 23, '#0284c7');
    rect(ctx, 6, 7 + hover, 8, 15, '#0ea5e9');
    rect(ctx, 7, 9 + hover, 6, 11, '#38bdf8');
    rect(ctx, 9, 11 + hover, 2, 7, '#ffffff');
    sprites.props.crystalPillar.push(addPixelOutline(c));
  }

  // Mountain Evergreen Pine Tree (22x34 px)
  {
    const { c, ctx } = makeCanvas(22, 34);
    // Tree trunk
    rect(ctx, 9, 24, 4, 10, '#451a03');
    rect(ctx, 10, 24, 2, 10, '#78350f');
    // Bottom boughs
    rect(ctx, 3, 20, 16, 5, '#14532d');
    rect(ctx, 5, 18, 12, 3, '#166534');
    rect(ctx, 7, 19, 8, 2, '#22c55e');
    // Middle boughs
    rect(ctx, 5, 13, 12, 5, '#14532d');
    rect(ctx, 7, 11, 8, 3, '#166534');
    rect(ctx, 8, 12, 6, 2, '#22c55e');
    // Top boughs
    rect(ctx, 7, 6, 8, 5, '#14532d');
    rect(ctx, 8, 4, 6, 3, '#166534');
    rect(ctx, 9, 3, 4, 2, '#22c55e');
    // Peak needle tip
    rect(ctx, 10, 1, 2, 3, '#4ade80');
    sprites.props.pineTree = addPixelOutline(c);
  }

  // Sprawling Valley Ancient Oak (32x40 px)
  {
    const { c, ctx } = makeCanvas(32, 40);
    // Sturdy root base & trunk
    rect(ctx, 11, 28, 10, 12, '#271b12');
    rect(ctx, 9, 36, 4, 4, '#271b12');
    rect(ctx, 19, 36, 4, 4, '#271b12');
    rect(ctx, 13, 28, 6, 10, '#451a03');
    rect(ctx, 14, 30, 4, 6, '#78350f');
    // Lower lush foliage tier
    rect(ctx, 4, 14, 24, 15, '#14532d');
    rect(ctx, 2, 17, 28, 9, '#14532d');
    rect(ctx, 6, 12, 20, 12, '#166534');
    rect(ctx, 8, 10, 16, 12, '#15803d');
    // Foliage highlights & leaf clumps
    rect(ctx, 9, 8, 14, 8, '#22c55e');
    rect(ctx, 11, 5, 10, 6, '#4ade80');
    rect(ctx, 7, 17, 7, 4, '#22c55e');
    rect(ctx, 18, 17, 7, 4, '#22c55e');
    px(ctx, 13, 7, '#86efac');
    px(ctx, 17, 11, '#86efac');
    sprites.props.ancientOak = addPixelOutline(c);
  }

  // Granite Mountain Crag / Boulder Formation (26x24 px)
  {
    const { c, ctx } = makeCanvas(26, 24);
    // Shadow / dark rock base
    rect(ctx, 3, 10, 20, 13, '#1e293b');
    rect(ctx, 2, 13, 22, 9, '#1e293b');
    // Angular rock facets
    rect(ctx, 5, 8, 16, 12, '#334155');
    rect(ctx, 7, 5, 12, 10, '#475569');
    rect(ctx, 9, 3, 8, 7, '#64748b');
    // Crisp facet ridges & light catch
    rect(ctx, 9, 3, 5, 4, '#94a3b8');
    rect(ctx, 11, 4, 2, 2, '#cbd5e1');
    rect(ctx, 6, 9, 6, 2, '#64748b');
    rect(ctx, 15, 11, 7, 2, '#334155');
    sprites.props.mountainCrag = addPixelOutline(c);
  }

  // Cozy Waystation Campfire (18x20 px, 2-frame animation)
  sprites.props.campfire = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(18, 20);
    // Crossed wood logs
    rect(ctx, 3, 14, 12, 3, '#451a03');
    rect(ctx, 4, 15, 10, 2, '#78350f');
    rect(ctx, 6, 13, 6, 5, '#271b12');
    rect(ctx, 7, 14, 4, 3, '#451a03');
    // Glowing hot embers
    rect(ctx, 7, 14, 4, 2, '#dc2626');
    px(ctx, 8, 14, '#f97316');
    // Dancing fire flame
    const flicker = f === 0 ? 0 : 1;
    rect(ctx, 6, 9 - flicker, 6, 5 + flicker, '#ea580c');
    rect(ctx, 7, 6 - flicker, 4, 6 + flicker, '#f59e0b');
    rect(ctx, 8, 3 - flicker, 2, 6, '#fde047');
    px(ctx, 8, 2 - flicker, '#ffffff');
    if (f === 1) {
      px(ctx, 6, 7, '#fde047');
      px(ctx, 11, 8, '#f59e0b');
    }
    sprites.props.campfire.push(addPixelOutline(c));
  }

  // Ancient Weathered Ruined Keystone Arch (28x36 px)
  {
    const { c, ctx } = makeCanvas(28, 36);
    // Base plinths
    rect(ctx, 2, 30, 8, 6, '#1e293b');
    rect(ctx, 18, 30, 8, 6, '#1e293b');
    rect(ctx, 3, 31, 6, 4, '#334155');
    rect(ctx, 19, 31, 6, 4, '#334155');
    // Left & Right stone columns
    rect(ctx, 4, 10, 6, 21, '#475569');
    rect(ctx, 5, 10, 3, 20, '#64748b');
    rect(ctx, 18, 10, 6, 21, '#475569');
    rect(ctx, 19, 10, 3, 20, '#64748b');
    // Keystone overhead arch
    rect(ctx, 3, 6, 22, 5, '#334155');
    rect(ctx, 4, 7, 20, 3, '#64748b');
    rect(ctx, 11, 4, 6, 6, '#94a3b8');
    rect(ctx, 12, 3, 4, 2, '#cbd5e1');
    // Ivy vine wrapping left pillar
    px(ctx, 4, 22, '#22c55e');
    px(ctx, 5, 23, '#15803d');
    px(ctx, 6, 18, '#22c55e');
    px(ctx, 4, 14, '#166534');
    px(ctx, 5, 13, '#4ade80');
    sprites.props.ruinedArch = addPixelOutline(c);
  }

  // Cosmic Star-Anvil & Astral Smeltery (30x32 px, 2-frame animation)
  sprites.props.cosmicAnvil = [];
  for (let f = 0; f < 2; f++) {
    const pulse = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(30, 32);
    // Obsidian & gold rune dais
    rect(ctx, 2, 25, 26, 5, '#1e1b4b');
    rect(ctx, 4, 23, 22, 3, '#312e81');
    rect(ctx, 6, 24, 18, 1, '#f59e0b');
    // Left mini star-furnace column
    rect(ctx, 3, 11, 9, 13, '#334155');
    rect(ctx, 4, 12, 7, 10, '#1e293b');
    rect(ctx, 5, 15, 5, 6, '#ea580c');
    rect(ctx, 6, 16 + pulse, 3, 4, '#fde047');
    px(ctx, 7, 17 + pulse, '#ffffff');
    // Heavy Starmetal Anvil (center-right)
    rect(ctx, 15, 20, 9, 4, '#334155');
    rect(ctx, 17, 16, 5, 4, '#475569');
    rect(ctx, 12, 13, 15, 4, '#64748b');
    rect(ctx, 13, 13, 12, 2, '#bae6fd'); // Starlight anvil face
    rect(ctx, 10, 14, 3, 2, '#94a3b8');  // Anvil horn
    // Floating cosmic star-spark above anvil
    rect(ctx, 18, 6 + pulse, 4, 4, '#38bdf8');
    rect(ctx, 19, 7 + pulse, 2, 2, '#ffffff');
    px(ctx, 16, 9, f === 0 ? '#facc15' : '#fb923c');
    px(ctx, 23, 8, f === 0 ? '#38bdf8' : '#fde047');
    sprites.props.cosmicAnvil.push(addPixelOutline(c));
  }

  // Aetherial Crucible & Rite Altar (28x32 px, 2-frame animation)
  sprites.props.aetherCrucible = [];
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 32);
    // Arcane stone plinth
    rect(ctx, 4, 25, 20, 5, '#1e1b4b');
    rect(ctx, 6, 23, 16, 3, '#4c1d95');
    // Ornate cauldron body
    rect(ctx, 6, 13, 16, 10, '#334155');
    rect(ctx, 5, 12, 18, 3, '#64748b');
    rect(ctx, 7, 15, 14, 6, '#1e293b');
    rect(ctx, 9, 17, 10, 2, '#a855f7');
    // Bubbling luminous brew
    rect(ctx, 7, 11, 14, 3, '#9333ea');
    rect(ctx, 9, 11, 10, 2, '#e879f9');
    px(ctx, 10 + (f * 3), 10, '#ffffff');
    px(ctx, 15 - (f * 2), 9, '#38bdf8');
    // Floating arcane focus crystal above brew
    rect(ctx, 12, 3 + bob, 4, 6, '#38bdf8');
    rect(ctx, 13, 4 + bob, 2, 4, '#ffffff');
    sprites.props.aetherCrucible.push(addPixelOutline(c));
  }

  // Celestial Loom & Sanctuary Hearth (30x32 px, 2-frame animation)
  sprites.props.celestialLoom = [];
  for (let f = 0; f < 2; f++) {
    const shimmer = f === 1 ? 1 : 0;
    const { c, ctx } = makeCanvas(30, 32);
    // Warm ironwood base
    rect(ctx, 3, 25, 24, 5, '#451a03');
    rect(ctx, 5, 23, 20, 3, '#78350f');
    // Upright carved golden-wood loom frame
    rect(ctx, 6, 6, 3, 18, '#92400e');
    rect(ctx, 21, 6, 3, 18, '#92400e');
    rect(ctx, 5, 5, 20, 3, '#d97706');
    rect(ctx, 7, 6, 16, 1, '#fde047');
    // Shimmering vertical starlight warp threads
    for (let tx = 10; tx <= 19; tx += 2) {
      rect(ctx, tx, 8, 1, 15, (tx + shimmer) % 4 === 0 ? '#bae6fd' : '#4ade80');
    }
    // Woven celestial cloth banner in middle
    rect(ctx, 9, 12, 12, 6, '#15803d');
    rect(ctx, 10, 13, 10, 4, '#22c55e');
    rect(ctx, 12, 14, 6, 2, '#fef08a');
    sprites.props.celestialLoom.push(addPixelOutline(c));
  }

  // Sanctuary Bounty Board (28x32 px, 2-frame animation)
  sprites.props.bountyBoard = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(28, 32);
    // Twin oak posts
    rect(ctx, 4, 10, 3, 20, '#451a03');
    rect(ctx, 21, 10, 3, 20, '#451a03');
    // Slanted royal blue & gold roof
    rect(ctx, 2, 6, 24, 5, '#1e3a8a');
    rect(ctx, 4, 4, 20, 3, '#2563eb');
    rect(ctx, 3, 10, 22, 2, '#facc15');
    // Cork & timber backing
    rect(ctx, 6, 12, 16, 12, '#78350f');
    rect(ctx, 7, 13, 14, 10, '#92400e');
    // Pinned parchment contracts with crimson wax seals
    rect(ctx, 8, 14, 5, 6, '#fef3c7');
    px(ctx, 11, 18, '#ef4444');
    rect(ctx, 15, 14, 5, 7, '#fde68a');
    px(ctx, 17, 19, '#a855f7');
    if (f === 1) {
      px(ctx, 13, 3, '#ffffff');
    }
    sprites.props.bountyBoard.push(addPixelOutline(c));
  }

  // Wooden Trail Guide Signpost (16x22 px)
  {
    const { c, ctx } = makeCanvas(16, 22);
    // Vertical stake
    rect(ctx, 7, 6, 3, 16, '#451a03');
    rect(ctx, 8, 7, 1, 14, '#78350f');
    // Upper direction plank
    rect(ctx, 2, 4, 11, 4, '#78350f');
    rect(ctx, 3, 5, 9, 2, '#b45309');
    px(ctx, 12, 5, '#fde047'); // Arrow pointer
    px(ctx, 13, 6, '#fde047');
    // Lower direction plank
    rect(ctx, 4, 10, 10, 4, '#78350f');
    rect(ctx, 5, 11, 8, 2, '#92400e');
    px(ctx, 4, 12, '#fde047'); // Arrow pointer
    px(ctx, 3, 11, '#fde047');
    sprites.props.woodenSign = addPixelOutline(c);
  }

  // Grand Neoclassical AetherVault Bank (64x58 px)
  {
    const { c, ctx } = makeCanvas(64, 58);
    // Triangular pediment cornice
    rect(ctx, 30, 2, 4, 3, '#facc15'); // Golden finial spire
    rect(ctx, 28, 5, 8, 2, '#eab308');
    for (let r = 0; r < 7; r++) {
      rect(ctx, 28 - r * 4, 7 + r * 2, 8 + r * 8, 2, '#475569');
    }
    // Raking cornice highlight & trim
    rect(ctx, 4, 19, 56, 3, '#64748b');
    rect(ctx, 3, 21, 58, 2, '#334155');
    // Tympanum golden vault crest
    rect(ctx, 26, 12, 12, 6, '#1e293b');
    rect(ctx, 28, 13, 8, 4, '#ca8a04');
    px(ctx, 31, 14, '#fde047');
    px(ctx, 32, 14, '#fde047');
    px(ctx, 31, 15, '#ffffff');

    // Entablature frieze banner ("AETHERVAULT")
    rect(ctx, 4, 23, 56, 4, '#1e293b');
    rect(ctx, 6, 24, 52, 2, '#0f172a');
    rect(ctx, 16, 24, 32, 2, '#ca8a04'); // Gold inscription strip

    // Background wall
    rect(ctx, 6, 27, 52, 23, '#334155');

    // Left Wing Arched Stained Glass Window
    rect(ctx, 11, 30, 7, 12, '#1e293b');
    rect(ctx, 12, 31, 5, 10, '#0284c7');
    rect(ctx, 13, 33, 3, 6, '#38bdf8');
    px(ctx, 14, 34, '#ffffff');

    // Right Wing Arched Stained Glass Window
    rect(ctx, 46, 30, 7, 12, '#1e293b');
    rect(ctx, 47, 31, 5, 10, '#0284c7');
    rect(ctx, 48, 33, 3, 6, '#38bdf8');
    px(ctx, 49, 34, '#ffffff');

    // Central Grand Vault Entrance Portal
    rect(ctx, 24, 28, 16, 22, '#0f172a'); // Arch portal frame
    rect(ctx, 26, 29, 12, 4, '#ca8a04'); // Golden fanlight transom
    px(ctx, 31, 30, '#fde047');
    px(ctx, 32, 30, '#fde047');
    // Heavy Double Vault Doors
    rect(ctx, 26, 33, 12, 17, '#1e293b');
    rect(ctx, 27, 34, 5, 15, '#334155'); // Left door
    rect(ctx, 32, 34, 5, 15, '#334155'); // Right door
    // Vault Bronze Rings & Lock Wheel
    rect(ctx, 29, 39, 6, 6, '#ca8a04');
    rect(ctx, 30, 40, 4, 4, '#facc15');
    px(ctx, 31, 41, '#78350f');
    px(ctx, 32, 41, '#78350f');
    // Vertical iron banding
    rect(ctx, 28, 35, 1, 14, '#475569');
    rect(ctx, 35, 35, 1, 14, '#475569');

    // 4 Classical Fluted Marble Columns
    const colX = [6, 18, 40, 52];
    for (const cx of colX) {
      // Capital
      rect(ctx, cx - 1, 26, 8, 3, '#cbd5e1');
      rect(ctx, cx, 27, 6, 2, '#94a3b8');
      // Shaft
      rect(ctx, cx, 29, 6, 19, '#64748b');
      rect(ctx, cx + 1, 29, 2, 19, '#cbd5e1'); // Marble highlight
      rect(ctx, cx + 4, 29, 2, 19, '#475569'); // Marble shade
      // Base Plinth
      rect(ctx, cx - 1, 48, 8, 3, '#94a3b8');
      rect(ctx, cx - 1, 49, 8, 2, '#475569');
    }

    // 3-Tiered Stone Entry Steps
    rect(ctx, 2, 50, 60, 3, '#475569');
    rect(ctx, 3, 50, 58, 1, '#94a3b8');
    rect(ctx, 1, 53, 62, 3, '#334155');
    rect(ctx, 2, 53, 60, 1, '#64748b');
    rect(ctx, 0, 56, 64, 2, '#1e293b');
    rect(ctx, 1, 56, 62, 1, '#475569');

    sprites.props.bankBuilding = addPixelOutline(c);
  }

  // Bank Teller Desk / Counter Booth (32x22 px)
  {
    const { c, ctx } = makeCanvas(32, 22);
    // Lower mahogany counter cabinetry
    rect(ctx, 2, 11, 28, 11, '#451a03');
    rect(ctx, 3, 13, 26, 8, '#271b12');
    rect(ctx, 5, 14, 6, 6, '#78350f'); // Cabinet panel left
    rect(ctx, 13, 14, 6, 6, '#78350f'); // Cabinet panel mid
    rect(ctx, 21, 14, 6, 6, '#78350f'); // Cabinet panel right
    // Polished Countertop Surface
    rect(ctx, 1, 9, 30, 3, '#78350f');
    rect(ctx, 2, 9, 28, 1, '#d97706'); // Highlight line
    rect(ctx, 1, 11, 30, 1, '#451a03');

    // Brass Teller Security Grille / Bars
    rect(ctx, 3, 1, 26, 9, '#78350f');
    rect(ctx, 4, 1, 24, 8, '#0f172a');
    // Top brass railing
    rect(ctx, 3, 0, 26, 2, '#ca8a04');
    rect(ctx, 4, 0, 24, 1, '#fde047');
    // Vertical brass bars
    for (let b = 5; b <= 27; b += 2) {
      if (b >= 13 && b <= 19) continue; // Teller window opening
      rect(ctx, b, 2, 1, 7, '#facc15');
    }
    // Teller arch opening
    rect(ctx, 13, 3, 7, 1, '#ca8a04');
    px(ctx, 13, 4, '#ca8a04');
    px(ctx, 19, 4, '#ca8a04');

    // Items on counter:
    // Gold Coins Stack
    rect(ctx, 6, 7, 4, 3, '#eab308');
    px(ctx, 7, 7, '#fde047');
    px(ctx, 8, 8, '#fde047');
    // Open Ledger Book & Quill
    rect(ctx, 21, 7, 6, 3, '#475569');
    rect(ctx, 22, 6, 4, 3, '#f8fafc');
    px(ctx, 23, 7, '#94a3b8');
    px(ctx, 27, 4, '#38bdf8'); // Quill feather tip
    px(ctx, 26, 5, '#0284c7');

    sprites.props.bankCounter = addPixelOutline(c);
  }

  // Grand City Plaza Water Fountain (36x36 px, 2-frame animation)
  sprites.props.grandFountain = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(36, 36);
    // Outer stone octagonal basin
    rect(ctx, 8, 4, 20, 28, '#334155');
    rect(ctx, 4, 8, 28, 20, '#334155');
    rect(ctx, 6, 6, 24, 24, '#475569');
    rect(ctx, 7, 7, 22, 22, '#64748b'); // Rim coping
    rect(ctx, 8, 8, 20, 20, '#1e293b'); // Basin shadow

    // Water pool interior
    rect(ctx, 9, 9, 18, 18, '#0284c7');
    rect(ctx, 10, 10, 16, 16, '#0ea5e9');

    // Water ripple waves (animates between f=0 and f=1)
    if (f === 0) {
      rect(ctx, 11, 11, 14, 14, '#38bdf8');
      rect(ctx, 12, 12, 12, 12, '#0ea5e9');
      px(ctx, 10, 14, '#7dd3fc');
      px(ctx, 25, 20, '#7dd3fc');
    } else {
      rect(ctx, 10, 10, 16, 16, '#38bdf8');
      rect(ctx, 12, 12, 12, 12, '#0ea5e9');
      px(ctx, 14, 10, '#7dd3fc');
      px(ctx, 21, 25, '#7dd3fc');
    }

    // Central 2-Tier Stone Pedestal
    rect(ctx, 14, 14, 8, 8, '#334155');
    rect(ctx, 15, 13, 6, 8, '#475569');
    rect(ctx, 16, 12, 4, 6, '#64748b');
    rect(ctx, 17, 10, 2, 4, '#94a3b8');

    // Bubbling Water Jet & Sprays
    const sprayY = f === 0 ? 5 : 4;
    rect(ctx, 17, sprayY, 2, 6, '#ffffff');
    px(ctx, 16, sprayY + 1, '#7dd3fc');
    px(ctx, 19, sprayY + 1, '#7dd3fc');
    px(ctx, 15, sprayY + 3, '#38bdf8');
    px(ctx, 20, sprayY + 3, '#38bdf8');

    sprites.props.grandFountain.push(addPixelOutline(c));
  }

  // Tudor Half-Timbered Townhouse (44x46 px)
  {
    const { c, ctx } = makeCanvas(44, 46);
    // Stone Chimney with Smoke
    rect(ctx, 33, 3, 5, 15, '#475569');
    rect(ctx, 32, 2, 7, 2, '#334155');
    px(ctx, 35, 0, '#94a3b8'); // Smoke puff
    px(ctx, 36, 1, '#cbd5e1');

    // Steep Pitched Red Terracotta Roof
    for (let r = 0; r < 10; r++) {
      rect(ctx, 22 - r * 2, 6 + r * 2, r * 4 + 2, 2, '#dc2626');
      rect(ctx, 22 - r * 2, 7 + r * 2, r * 4 + 2, 1, '#991b1b');
    }
    rect(ctx, 2, 24, 40, 2, '#7f1d1d'); // Roof fascia

    // Cream Sandstone Wall Body
    rect(ctx, 4, 26, 36, 17, '#fef3c7');
    rect(ctx, 3, 43, 38, 3, '#334155'); // Stone foundation

    // Dark Timber Cross Beams
    rect(ctx, 4, 26, 2, 17, '#451a03'); // Left post
    rect(ctx, 38, 26, 2, 17, '#451a03'); // Right post
    rect(ctx, 4, 34, 36, 2, '#451a03'); // Middle beam
    rect(ctx, 20, 26, 2, 17, '#451a03'); // Center post
    // Diagonal braces
    px(ctx, 6, 27, '#451a03'); px(ctx, 7, 28, '#451a03'); px(ctx, 8, 29, '#451a03');
    px(ctx, 18, 27, '#451a03'); px(ctx, 17, 28, '#451a03'); px(ctx, 16, 29, '#451a03');

    // Upper Floor Leaded Window (amber glowing)
    rect(ctx, 8, 27, 8, 6, '#1e293b');
    rect(ctx, 9, 28, 6, 4, '#fbbf24');
    px(ctx, 11, 29, '#fef08a');
    // Window Flower Box
    rect(ctx, 7, 33, 10, 2, '#15803d');
    px(ctx, 8, 32, '#ec4899'); px(ctx, 11, 32, '#fde047'); px(ctx, 14, 32, '#ec4899');

    // Arched Oak Door
    rect(ctx, 25, 30, 10, 14, '#1e293b');
    rect(ctx, 26, 31, 8, 13, '#78350f');
    rect(ctx, 27, 32, 6, 12, '#92400e');
    px(ctx, 32, 38, '#facc15'); // Brass handle
    rect(ctx, 27, 35, 6, 1, '#1e293b'); // Iron hinge strap
    rect(ctx, 27, 41, 6, 1, '#1e293b');

    sprites.props.cityHouseA = addPixelOutline(c);
  }

  // Slate-Roofed Stone Townhouse (48x44 px)
  {
    const { c, ctx } = makeCanvas(48, 44);
    // Slate Blue Mansard Roof
    rect(ctx, 6, 4, 36, 16, '#1e293b');
    rect(ctx, 4, 18, 40, 3, '#334155');
    // Slate tile pattern
    for (let y = 6; y <= 16; y += 3) {
      rect(ctx, 7, y, 34, 1, '#475569');
    }
    // Dormer Window on roof
    rect(ctx, 20, 6, 8, 10, '#334155');
    rect(ctx, 21, 7, 6, 8, '#475569');
    rect(ctx, 22, 9, 4, 5, '#38bdf8');
    px(ctx, 23, 10, '#ffffff');

    // Grey Ashlar Stone Walls
    rect(ctx, 4, 21, 40, 20, '#475569');
    rect(ctx, 3, 41, 42, 3, '#1e293b');
    // Stone block lines
    for (let y = 25; y <= 39; y += 4) {
      rect(ctx, 4, y, 40, 1, '#334155');
      const offset = (y % 8 === 1) ? 10 : 20;
      rect(ctx, offset, y - 4, 1, 4, '#334155');
      rect(ctx, offset + 18, y - 4, 1, 4, '#334155');
    }

    // Left Window with shutters
    rect(ctx, 7, 26, 8, 8, '#1e293b');
    rect(ctx, 8, 27, 6, 6, '#fbbf24');
    rect(ctx, 5, 26, 2, 8, '#15803d'); // Left shutter
    rect(ctx, 15, 26, 2, 8, '#15803d'); // Right shutter
    rect(ctx, 7, 34, 8, 2, '#166534'); // Flower box
    px(ctx, 8, 33, '#ef4444'); px(ctx, 11, 33, '#fde047'); px(ctx, 13, 33, '#38bdf8');

    // Right Window with shutters
    rect(ctx, 33, 26, 8, 8, '#1e293b');
    rect(ctx, 34, 27, 6, 6, '#fbbf24');
    rect(ctx, 31, 26, 2, 8, '#15803d');
    rect(ctx, 41, 26, 2, 8, '#15803d');
    rect(ctx, 33, 34, 8, 2, '#166534');
    px(ctx, 34, 33, '#ef4444'); px(ctx, 37, 33, '#fde047'); px(ctx, 39, 33, '#ec4899');

    // Center Arched Stone Doorway
    rect(ctx, 20, 26, 8, 16, '#1e293b');
    rect(ctx, 21, 27, 6, 15, '#78350f');
    px(ctx, 25, 34, '#fde047'); // Brass knob
    // Side Lantern
    px(ctx, 29, 29, '#fde047');
    px(ctx, 29, 30, '#f59e0b');

    sprites.props.cityHouseB = addPixelOutline(c);
  }

  // Helper function to create market stall base with canopy
  function createStallCanvas(primaryColor, secondaryColor, scallopDark, scallopLight, drapeColor) {
    const { c, ctx } = makeCanvas(32, 28);
    // Timber frame posts
    rect(ctx, 3, 10, 2, 17, '#451a03');
    rect(ctx, 27, 10, 2, 17, '#451a03');

    // Striped Fabric Canopy
    for (let s = 0; s < 6; s++) {
      const col = s % 2 === 0 ? primaryColor : secondaryColor;
      rect(ctx, 2 + s * 5, 2, 5, 11, col);
    }
    // Awning valence scallops
    for (let v = 0; v < 6; v++) {
      const col = v % 2 === 0 ? scallopDark : scallopLight;
      rect(ctx, 2 + v * 5, 12, 5, 2, col);
    }

    // Wooden Merchant Table Counter
    rect(ctx, 2, 15, 28, 4, '#78350f');
    rect(ctx, 3, 15, 26, 1, '#b45309');
    rect(ctx, 4, 19, 24, 7, drapeColor); // Table drape/cloth
    return { c, ctx };
  }

  // 1. Apothecary & Potion Stall (Teal / Indigo Awning, Potions, Mortar & Pestle, Hanging Herbs)
  {
    const { c, ctx } = createStallCanvas('#0284c7', '#a7f3d0', '#0369a1', '#6ee7b7', '#0c4a6e');
    // Hanging dried herbs from left pole
    rect(ctx, 1, 9, 2, 4, '#15803d');
    px(ctx, 2, 13, '#166534');
    // Potion Flasks on table
    // Red Health Salve
    rect(ctx, 5, 11, 3, 5, '#ef4444');
    px(ctx, 6, 10, '#cbd5e1'); // Cork
    px(ctx, 5, 12, '#ffffff'); // Glint
    // Cyan Glimmer Draught
    rect(ctx, 10, 12, 3, 4, '#0ea5e9');
    px(ctx, 11, 11, '#cbd5e1');
    px(ctx, 11, 13, '#e0f2fe');
    // Purple Greater Vitality Elixir
    rect(ctx, 15, 11, 3, 5, '#9333ea');
    px(ctx, 16, 10, '#fde047'); // Gold stopper
    // Stone Mortar & Pestle
    rect(ctx, 21, 13, 5, 3, '#475569');
    px(ctx, 23, 11, '#94a3b8'); // Pestle handle
    px(ctx, 22, 12, '#cbd5e1');
    sprites.props.marketStallPotions = addPixelOutline(c);
  }

  // 2. Provisions & Rations Stall (Forest Green / Wheat Awning, Fruit Basket, Bread Loaf, Jerky)
  {
    const { c, ctx } = createStallCanvas('#15803d', '#fef08a', '#166534', '#fde047', '#9a3412');
    // Fruit Basket with Apples
    rect(ctx, 4, 13, 7, 3, '#ca8a04'); // wicker basket
    px(ctx, 5, 12, '#ef4444'); // red apple
    px(ctx, 7, 12, '#22c55e'); // green apple
    px(ctx, 9, 12, '#dc2626'); // red apple
    px(ctx, 6, 11, '#ef4444');
    // Crusty Baked Bread Loaf
    rect(ctx, 13, 12, 6, 4, '#b45309');
    rect(ctx, 14, 11, 4, 2, '#d97706');
    px(ctx, 14, 12, '#fef3c7'); // slashed crust
    px(ctx, 16, 12, '#fef3c7');
    // Cheese Wedge & Smoked Jerky Rations
    rect(ctx, 21, 13, 4, 3, '#facc15'); // cheese
    px(ctx, 23, 12, '#fde047');
    rect(ctx, 26, 12, 3, 4, '#78350f'); // dried trail meat
    px(ctx, 27, 11, '#ca8a04');
    sprites.props.marketStallProvisions = addPixelOutline(c);
  }

  // 3. Smithing & Ore Wares Stall (Charcoal / Forge Orange Awning, Bronze Bars, Iron Ore, Blades)
  {
    const { c, ctx } = createStallCanvas('#1e293b', '#ea580c', '#0f172a', '#c2410c', '#334155');
    // Stack of Refined Bronze Bars
    rect(ctx, 5, 13, 6, 3, '#b45309');
    rect(ctx, 6, 11, 4, 2, '#d97706');
    px(ctx, 7, 11, '#fde047'); // metallic sheen
    // Raw Iron Ore Rock
    rect(ctx, 13, 12, 4, 4, '#475569');
    px(ctx, 14, 11, '#64748b');
    px(ctx, 15, 12, '#cbd5e1'); // silver ore fleck
    // Blacksmith's Heavy Hammer
    rect(ctx, 19, 14, 4, 2, '#64748b'); // hammer head
    rect(ctx, 20, 11, 1, 4, '#78350f'); // wood handle
    // Forged Steel Shortsword Blade Blank
    rect(ctx, 24, 11, 2, 5, '#e2e8f0');
    px(ctx, 24, 10, '#ffffff'); // tip
    rect(ctx, 23, 15, 4, 1, '#b45309'); // bronze crossguard
    sprites.props.marketStallSmith = addPixelOutline(c);
  }

  // 4. Aether Curios & Relics Stall (Royal Amethyst / Radiant Gold Awning, Glowing Crystals & Runes)
  {
    const { c, ctx } = createStallCanvas('#6b21a8', '#facc15', '#4c1d95', '#ca8a04', '#3b0764');
    // Table fringe trim
    rect(ctx, 4, 19, 24, 1, '#fde047');
    // Pulsing Crystalline Aether Shards
    rect(ctx, 5, 11, 3, 5, '#0284c7');
    px(ctx, 6, 10, '#38bdf8');
    px(ctx, 6, 12, '#ffffff'); // central star glint
    // Astral Chrono-Gem (Violet)
    rect(ctx, 10, 12, 3, 4, '#a855f7');
    px(ctx, 11, 11, '#c084fc');
    px(ctx, 11, 13, '#f5d0fe');
    // Carved Ancient Keystone Fragment
    rect(ctx, 15, 11, 5, 5, '#334155');
    px(ctx, 17, 12, '#38bdf8'); // glowing rune glyph
    px(ctx, 17, 14, '#7dd3fc');
    // Gilded Curio Jewelry Coffer
    rect(ctx, 22, 12, 6, 4, '#ca8a04');
    px(ctx, 24, 11, '#fde047'); // gold latch
    px(ctx, 23, 12, '#38bdf8'); // gem inside
    sprites.props.marketStallRelics = addPixelOutline(c);
  }

  // Fallback market stall
  sprites.props.marketStall = sprites.props.marketStallPotions;

  // Ornate Iron Street Lantern (12x30 px)
  {
    const { c, ctx } = makeCanvas(12, 30);
    // Stone plinth base
    rect(ctx, 2, 26, 8, 4, '#334155');
    rect(ctx, 3, 27, 6, 2, '#475569');
    // Wrought Iron Pole
    rect(ctx, 5, 8, 2, 18, '#0f172a');
    rect(ctx, 4, 24, 4, 2, '#1e293b');
    // Lantern hanger arm
    rect(ctx, 3, 7, 6, 2, '#1e293b');
    // Lantern Glass Housing
    rect(ctx, 3, 8, 6, 7, '#0f172a');
    rect(ctx, 4, 9, 4, 5, '#fde047');
    rect(ctx, 5, 10, 2, 3, '#ffffff'); // Center bright core
    px(ctx, 4, 11, '#f59e0b');
    px(ctx, 7, 11, '#f59e0b');
    // Lantern Hood Cap
    rect(ctx, 2, 6, 8, 2, '#1e293b');
    px(ctx, 5, 5, '#ca8a04');
    px(ctx, 6, 5, '#ca8a04');

    sprites.props.streetLantern = addPixelOutline(c);
  }

  // Carved Granite City Bench (22x14 px)
  {
    const { c, ctx } = makeCanvas(22, 14);
    // Granite Backrest
    rect(ctx, 2, 2, 18, 5, '#475569');
    rect(ctx, 3, 2, 16, 1, '#94a3b8');
    rect(ctx, 2, 5, 18, 1, '#334155');
    // Bench Seat Slab
    rect(ctx, 1, 7, 20, 3, '#64748b');
    rect(ctx, 2, 7, 18, 1, '#cbd5e1'); // Highlight line
    rect(ctx, 1, 9, 20, 1, '#334155');
    // Sturdy Carved Legs
    rect(ctx, 3, 10, 4, 4, '#334155');
    rect(ctx, 15, 10, 4, 4, '#334155');

    sprites.props.stoneBench = addPixelOutline(c);
  }

  // Starlight Cherry Blossom Tree (36x44 px)
  {
    const { c, ctx } = makeCanvas(36, 44);
    // Gnarled Tree Trunk & Roots
    rect(ctx, 15, 28, 6, 15, '#271b12');
    rect(ctx, 13, 39, 4, 4, '#271b12');
    rect(ctx, 19, 39, 4, 4, '#271b12');
    rect(ctx, 16, 28, 4, 13, '#451a03');
    rect(ctx, 17, 30, 2, 10, '#78350f');
    // Branching limbs
    rect(ctx, 12, 22, 4, 8, '#271b12');
    rect(ctx, 20, 22, 4, 8, '#271b12');

    // Lush Cherry Blossom Canopy
    // Base shadow tier
    rect(ctx, 6, 12, 24, 16, '#831843');
    rect(ctx, 3, 15, 30, 11, '#831843');
    // Mid pink foliage clumps
    rect(ctx, 5, 10, 26, 14, '#be185d');
    rect(ctx, 8, 7, 20, 14, '#db2777');
    rect(ctx, 10, 5, 16, 12, '#ec4899');
    // Bright blossom petal highlights
    rect(ctx, 11, 4, 14, 8, '#f472b6');
    rect(ctx, 13, 3, 10, 6, '#fbcfe8');
    px(ctx, 16, 4, '#ffffff');
    px(ctx, 18, 5, '#ffffff');
    // Scattered falling blossom petals
    px(ctx, 7, 29, '#f472b6');
    px(ctx, 28, 28, '#fbcfe8');
    px(ctx, 29, 33, '#ec4899');
    px(ctx, 6, 34, '#fbcfe8');

    sprites.props.blossomTree = addPixelOutline(c);
  }

  // 1. Solari Sundial Chronometer (24x26 px)
  {
    const { c, ctx } = makeCanvas(24, 26);
    // Marble plinth base
    rect(ctx, 4, 18, 16, 6, '#475569');
    rect(ctx, 5, 19, 14, 4, '#64748b');
    rect(ctx, 6, 21, 12, 3, '#94a3b8');
    // Sculpted column pillar
    rect(ctx, 9, 10, 6, 9, '#cbd5e1');
    rect(ctx, 10, 11, 4, 7, '#f8fafc');
    // Slanted circular dial face
    rect(ctx, 4, 5, 16, 6, '#b45309');
    rect(ctx, 5, 6, 14, 4, '#f59e0b');
    rect(ctx, 7, 7, 10, 2, '#fef08a');
    // Gnomon needle and sunburst rays
    rect(ctx, 11, 2, 2, 6, '#78350f');
    px(ctx, 11, 1, '#fde047');
    px(ctx, 6, 7, '#d97706');
    px(ctx, 17, 7, '#d97706');
    px(ctx, 11, 8, '#ffffff');

    sprites.props.solariSundial = addPixelOutline(c);
  }

  // 2. Umbri Gothic Brazier Altar (Animated 2 frames)
  {
    sprites.props.umbriBrazierAltar = [];
    for (let f = 0; f < 2; f++) {
      const { c, ctx } = makeCanvas(24, 28);
      // Obsidian stepped base
      rect(ctx, 5, 20, 14, 6, '#0f172a');
      rect(ctx, 6, 21, 12, 4, '#1e1b4b');
      rect(ctx, 7, 16, 10, 5, '#1e1b4b');
      // Claw brackets
      rect(ctx, 4, 12, 3, 6, '#312e81');
      rect(ctx, 17, 12, 3, 6, '#312e81');
      // Wrought iron fire bowl
      rect(ctx, 6, 12, 12, 5, '#0f172a');
      rect(ctx, 7, 13, 10, 3, '#3b0764');
      // Pulsing violet spirit flames
      if (f === 0) {
        rect(ctx, 8, 7, 8, 6, '#7e22ce');
        rect(ctx, 9, 5, 6, 5, '#a855f7');
        rect(ctx, 10, 3, 4, 4, '#c084fc');
        px(ctx, 11, 4, '#ffffff');
        px(ctx, 8, 9, '#d8b4fe');
        px(ctx, 15, 8, '#c084fc');
      } else {
        rect(ctx, 7, 8, 9, 5, '#7e22ce');
        rect(ctx, 8, 4, 7, 6, '#a855f7');
        rect(ctx, 10, 2, 4, 4, '#c084fc');
        px(ctx, 12, 3, '#ffffff');
        px(ctx, 9, 7, '#f3e8ff');
        px(ctx, 14, 6, '#d8b4fe');
      }
      sprites.props.umbriBrazierAltar.push(addPixelOutline(c));
    }
  }

  // 3. Ancient Terra Mossy Menhir (22x34 px)
  {
    const { c, ctx } = makeCanvas(22, 34);
    // Standing granite menhir
    rect(ctx, 5, 6, 12, 26, '#334155');
    rect(ctx, 6, 4, 10, 28, '#475569');
    rect(ctx, 7, 2, 8, 30, '#64748b');
    // Ancient spiral carved runes
    px(ctx, 10, 8, '#86efac');
    px(ctx, 11, 9, '#86efac');
    px(ctx, 11, 10, '#86efac');
    px(ctx, 10, 11, '#86efac');
    px(ctx, 9, 10, '#86efac');
    px(ctx, 10, 16, '#86efac');
    px(ctx, 10, 17, '#bbf7d0');
    px(ctx, 10, 22, '#86efac');
    // Green climbing ivy vines
    rect(ctx, 5, 20, 3, 10, '#15803d');
    rect(ctx, 14, 14, 3, 12, '#166534');
    px(ctx, 7, 18, '#22c55e');
    px(ctx, 13, 12, '#4ade80');
    px(ctx, 15, 10, '#22c55e');
    // Wildflowers at base
    px(ctx, 4, 31, '#38bdf8');
    px(ctx, 17, 31, '#fde047');
    px(ctx, 6, 32, '#ec4899');
    px(ctx, 14, 32, '#a855f7');

    sprites.props.terraMenhir = addPixelOutline(c);
  }

  // 4. Aether Floating Armillary Astrolabe (24x30 px)
  {
    const { c, ctx } = makeCanvas(24, 30);
    // Brass pedestal
    rect(ctx, 6, 24, 12, 4, '#78350f');
    rect(ctx, 7, 25, 10, 2, '#b45309');
    rect(ctx, 10, 18, 4, 7, '#b45309');
    rect(ctx, 11, 15, 2, 4, '#d97706');
    // Astrolabe concentric rings
    rect(ctx, 4, 4, 16, 12, '#ca8a04');
    rect(ctx, 6, 6, 12, 8, '#0f172a');
    rect(ctx, 2, 9, 20, 2, '#fde047');
    rect(ctx, 11, 2, 2, 16, '#fde047');
    // Floating glowing cyan chronocore
    rect(ctx, 9, 7, 6, 6, '#0284c7');
    rect(ctx, 10, 8, 4, 4, '#38bdf8');
    px(ctx, 11, 9, '#ffffff');
    px(ctx, 12, 10, '#ffffff');

    sprites.props.aetherArmillary = addPixelOutline(c);
  }

  // 5. Village Stone Well with Canopy (28x32 px)
  {
    const { c, ctx } = makeCanvas(28, 32);
    // Circular stone well basin
    rect(ctx, 4, 18, 20, 12, '#334155');
    rect(ctx, 5, 19, 18, 10, '#475569');
    rect(ctx, 6, 20, 16, 2, '#1e1b4b');
    // Shimmering water inside
    rect(ctx, 7, 21, 14, 3, '#0284c7');
    px(ctx, 9, 22, '#38bdf8');
    px(ctx, 15, 22, '#ffffff');
    // Wooden support posts
    rect(ctx, 5, 8, 2, 11, '#78350f');
    rect(ctx, 21, 8, 2, 11, '#78350f');
    // Winding axle, rope & bucket
    rect(ctx, 7, 8, 14, 2, '#b45309');
    rect(ctx, 13, 9, 1, 7, '#ca8a04');
    rect(ctx, 12, 15, 3, 3, '#78350f');
    // Wooden pitched roof
    rect(ctx, 2, 6, 24, 3, '#9a3412');
    rect(ctx, 4, 4, 20, 3, '#b45309');
    rect(ctx, 7, 2, 14, 3, '#d97706');
    px(ctx, 13, 1, '#fde047');

    sprites.props.ancientWell = addPixelOutline(c);
  }

  // 6. Glimmerweaving Tailor Stall (Violet / Teal Awning, Bolts of Cloth)
  {
    const { c, ctx } = createStallCanvas('#4c1d95', '#0d9488', '#2e1065', '#0f766e', '#134e4a');
    // Hanging woven scarf banner
    rect(ctx, 4, 19, 24, 1, '#2dd4bf');
    // Spools of glowing starlight thread
    rect(ctx, 5, 11, 4, 5, '#c084fc');
    px(ctx, 6, 10, '#f3e8ff');
    // Roll of Duskveil Silk
    rect(ctx, 11, 12, 5, 4, '#1e1b4b');
    rect(ctx, 12, 11, 3, 2, '#7e22ce');
    // Roll of Celestial Gossamer
    rect(ctx, 18, 11, 5, 5, '#38bdf8');
    px(ctx, 19, 10, '#e0f2fe');
    px(ctx, 20, 12, '#ffffff');
    // Tailor shears
    rect(ctx, 24, 12, 3, 4, '#cbd5e1');
    px(ctx, 25, 11, '#fde047');

    sprites.props.marketStallTailor = addPixelOutline(c);
  }

  // 7. Decorative City Garden Flowerbed (24x12 px)
  {
    const { c, ctx } = makeCanvas(24, 12);
    // Dark nutrient soil
    rect(ctx, 2, 3, 20, 8, '#271b12');
    rect(ctx, 3, 4, 18, 6, '#451a03');
    // Stone/timber raised border
    rect(ctx, 1, 3, 22, 1, '#78350f');
    rect(ctx, 1, 10, 22, 1, '#78350f');
    rect(ctx, 1, 4, 1, 6, '#78350f');
    rect(ctx, 22, 4, 1, 6, '#78350f');
    // Blooming flowers and greenery
    px(ctx, 4, 5, '#ef4444'); // red rose
    px(ctx, 5, 6, '#f87171');
    px(ctx, 8, 5, '#fde047'); // yellow marigold
    px(ctx, 9, 6, '#fef08a');
    px(ctx, 12, 5, '#a855f7'); // purple lavender
    px(ctx, 13, 6, '#c084fc');
    px(ctx, 16, 5, '#38bdf8'); // blue starflower
    px(ctx, 17, 6, '#7dd3fc');
    px(ctx, 20, 5, '#ec4899'); // pink blossom
    // Leaves & foliage
    px(ctx, 3, 7, '#15803d');
    px(ctx, 6, 8, '#22c55e');
    px(ctx, 10, 8, '#16a34a');
    px(ctx, 14, 7, '#15803d');
    px(ctx, 18, 8, '#22c55e');

    sprites.props.flowerBed = addPixelOutline(c);
  }

  // ==========================================
  // Tibia Graveglass Tombstone (24x28 pixel art)
  // Crystalline obsidian gravestone marking player fallen ground
  // ==========================================
  {
    const { c, ctx } = makeCanvas(24, 28);

    // Stone base pedestal
    rect(ctx, 4, 24, 16, 4, '#1e293b');
    rect(ctx, 5, 23, 14, 1, '#334155');
    rect(ctx, 6, 25, 12, 2, '#0f172a');

    // Rounded crystalline tombstone slab
    rect(ctx, 6, 4, 12, 19, '#1e1b4b');
    rect(ctx, 7, 2, 10, 2, '#2e1065');
    rect(ctx, 8, 1, 8, 1, '#3b0764');
    rect(ctx, 9, 0, 6, 1, '#581c87');

    // Inner bevel & highlight
    rect(ctx, 7, 4, 1, 18, '#4c1d95');
    rect(ctx, 8, 3, 8, 1, '#6b21a8');
    rect(ctx, 8, 5, 8, 17, '#0f172a');

    // Luminous Graveglass Leyline Cross / Rune
    rect(ctx, 11, 7, 2, 12, '#a855f7');
    rect(ctx, 8, 11, 8, 2, '#a855f7');
    rect(ctx, 11, 8, 2, 10, '#c084fc');
    rect(ctx, 9, 11, 6, 2, '#c084fc');

    // Glowing core crystal
    px(ctx, 11, 11, '#ffffff');
    px(ctx, 12, 11, '#fde047');
    px(ctx, 11, 12, '#38bdf8');
    px(ctx, 12, 12, '#ffffff');

    // Ancient runic notches on edges
    px(ctx, 6, 9, '#7e22ce');
    px(ctx, 17, 14, '#7e22ce');
    px(ctx, 6, 17, '#3b0764');
    px(ctx, 17, 8, '#3b0764');

    sprites.props.graveglassTombstone = addPixelOutline(c);
  }

  // ==========================================
  // 5. ENTERABLE TAVERN & INTERIOR FURNITURE PROPS
  // ==========================================
  // Cozy Timber Tavern & Inn Exterior with Hanging Ale-Mug Signboard (46x40)
  {
    const { c, ctx } = makeCanvas(46, 40);
    // Stone foundation
    rect(ctx, 4, 34, 38, 6, '#475569');
    rect(ctx, 5, 35, 36, 4, '#334155');
    // Half-timbered plaster walls
    rect(ctx, 5, 16, 36, 19, '#e7d7c1');
    rect(ctx, 5, 16, 3, 19, '#6b3e21');
    rect(ctx, 21, 16, 4, 19, '#6b3e21');
    rect(ctx, 38, 16, 3, 19, '#6b3e21');
    rect(ctx, 5, 24, 36, 2, '#6b3e21');
    // Stone chimney on right side
    rect(ctx, 34, 1, 6, 13, '#64748b');
    rect(ctx, 35, 2, 4, 11, '#475569');
    rect(ctx, 33, 0, 8, 2, '#94a3b8');
    // Pitched warm shingle roof
    rect(ctx, 2, 11, 42, 6, '#7f1d1d');
    rect(ctx, 5, 7, 36, 5, '#991b1b');
    rect(ctx, 9, 4, 28, 4, '#b91c1c');
    rect(ctx, 13, 2, 20, 3, '#dc2626');
    rect(ctx, 2, 16, 42, 2, '#451a03');
    // Warm glowing upper & side paned windows
    rect(ctx, 10, 18, 8, 5, '#fbbf24');
    rect(ctx, 11, 19, 6, 3, '#fef08a');
    rect(ctx, 13, 18, 2, 5, '#78350f');
    rect(ctx, 28, 18, 8, 5, '#fbbf24');
    rect(ctx, 29, 19, 6, 3, '#fef08a');
    rect(ctx, 31, 18, 2, 5, '#78350f');
    // Arched oak entrance door + warm welcome threshold
    rect(ctx, 18, 25, 10, 14, '#78350f');
    rect(ctx, 19, 24, 8, 2, '#92400e');
    rect(ctx, 20, 26, 6, 12, '#451a03');
    px(ctx, 25, 32, '#facc15');
    rect(ctx, 17, 38, 12, 2, '#fbbf24');
    // Swinging tavern signboard + foamy mug icon (left overhang)
    rect(ctx, 0, 20, 9, 2, '#334155');
    rect(ctx, 1, 22, 7, 8, '#92400e');
    rect(ctx, 2, 23, 5, 6, '#fbbf24');
    rect(ctx, 3, 23, 3, 2, '#ffffff');
    sprites.props.tavernBuilding = addPixelOutline(c);
  }

  // Welcoming Doorway Threshold Glow Rug (22x10)
  {
    const { c, ctx } = makeCanvas(22, 10);
    rect(ctx, 2, 2, 18, 6, '#78350f');
    rect(ctx, 3, 3, 16, 4, '#b45309');
    rect(ctx, 5, 4, 12, 2, '#fde047');
    px(ctx, 10, 4, '#ffffff');
    px(ctx, 11, 4, '#ffffff');
    sprites.props.doorThresholdGlow = addPixelOutline(c);
  }

  // Animated Stone Hearth Fireplace (2 frames, 32x34)
  sprites.props.hearthFireplace = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(32, 34);
    rect(ctx, 9, 0, 14, 12, '#475569');
    rect(ctx, 10, 1, 12, 10, '#64748b');
    rect(ctx, 3, 11, 26, 22, '#334155');
    rect(ctx, 4, 12, 24, 20, '#475569');
    // Timber mantlepiece with brass candle
    rect(ctx, 2, 12, 28, 3, '#78350f');
    rect(ctx, 3, 12, 26, 1, '#b45309');
    rect(ctx, 6, 9, 2, 3, '#fef08a');
    px(ctx, 6, 8 - f, '#fb923c');
    rect(ctx, 24, 9, 2, 3, '#fef08a');
    px(ctx, 24, 8 - (1 - f), '#fb923c');
    // Firebox & roaring flames
    rect(ctx, 8, 17, 16, 14, '#0f172a');
    rect(ctx, 10, 27, 12, 3, '#451a03');
    rect(ctx, 11, 21 + f, 10, 7 - f, '#ea580c');
    rect(ctx, 13, 19 + f, 6, 7 - f, '#fb923c');
    rect(ctx, 14, 22, 4, 4, '#fde047');
    px(ctx, 15, 18 + f, '#ffffff');
    sprites.props.hearthFireplace.push(addPixelOutline(c));
  }

  // Oak Tavern Bar Counter with Tankards & Bottles (42x22)
  {
    const { c, ctx } = makeCanvas(42, 22);
    rect(ctx, 2, 4, 38, 16, '#451a03');
    rect(ctx, 1, 4, 40, 5, '#92400e');
    rect(ctx, 2, 5, 38, 3, '#b45309');
    rect(ctx, 4, 10, 34, 8, '#78350f');
    // Brass foot rail
    rect(ctx, 2, 19, 38, 2, '#facc15');
    // Frothy mugs & emerald bottles on bar top
    rect(ctx, 7, 1, 3, 4, '#f59e0b');
    rect(ctx, 7, 0, 3, 1, '#ffffff');
    rect(ctx, 16, 0, 3, 5, '#16a34a');
    rect(ctx, 24, 1, 3, 4, '#dc2626');
    rect(ctx, 32, 1, 3, 4, '#f59e0b');
    rect(ctx, 32, 0, 3, 1, '#ffffff');
    sprites.props.tavernBar = addPixelOutline(c);
  }

  // Oak Ale Keg on Cradle (16x18)
  {
    const { c, ctx } = makeCanvas(16, 18);
    rect(ctx, 3, 3, 10, 12, '#78350f');
    rect(ctx, 4, 2, 8, 13, '#92400e');
    rect(ctx, 5, 4, 6, 9, '#b45309');
    rect(ctx, 3, 5, 10, 1, '#facc15');
    rect(ctx, 3, 11, 10, 1, '#facc15');
    rect(ctx, 7, 8, 2, 2, '#eab308');
    rect(ctx, 3, 15, 2, 2, '#451a03');
    rect(ctx, 11, 15, 2, 2, '#451a03');
    sprites.props.aleKeg = addPixelOutline(c);
  }

  // Tavern Dining Table with Candle & Tankards (28x22)
  {
    const { c, ctx } = makeCanvas(28, 22);
    // Stools
    rect(ctx, 2, 9, 4, 6, '#78350f');
    rect(ctx, 22, 9, 4, 6, '#78350f');
    // Tabletop & legs
    rect(ctx, 6, 4, 16, 11, '#b45309');
    rect(ctx, 7, 5, 14, 9, '#d97706');
    rect(ctx, 7, 15, 3, 5, '#451a03');
    rect(ctx, 18, 15, 3, 5, '#451a03');
    // Candle & plates
    rect(ctx, 13, 3, 2, 4, '#fef9c3');
    px(ctx, 13, 2, '#fb923c');
    rect(ctx, 8, 7, 3, 3, '#e2e8f0');
    rect(ctx, 17, 7, 3, 3, '#f59e0b');
    sprites.props.diningTable = addPixelOutline(c);
  }

  // Tall Library Bookshelf (24x28)
  {
    const { c, ctx } = makeCanvas(24, 28);
    rect(ctx, 2, 2, 20, 24, '#451a03');
    rect(ctx, 3, 3, 18, 22, '#78350f');
    for (let s = 0; s < 3; s++) {
      const sy = 5 + s * 7;
      rect(ctx, 4, sy, 16, 5, '#1e1b4b');
      rect(ctx, 4, sy + 5, 16, 1, '#92400e');
      const cols = ['#dc2626', '#2563eb', '#16a34a', '#eab308', '#a855f7', '#06b6d4'];
      for (let b = 0; b < 5; b++) {
        rect(ctx, 5 + b * 3, sy + 1, 2, 4, cols[(s * 5 + b) % cols.length]);
      }
    }
    sprites.props.bookshelf = addPixelOutline(c);
  }

  // Apothecary Potion & Herb Shelf (26x26)
  {
    const { c, ctx } = makeCanvas(26, 26);
    rect(ctx, 2, 2, 22, 22, '#3b2313');
    rect(ctx, 3, 3, 20, 20, '#5c3419');
    rect(ctx, 4, 9, 18, 2, '#92400e');
    rect(ctx, 4, 17, 18, 2, '#92400e');
    // Glowing potion bottles & hanging herbs
    rect(ctx, 5, 5, 3, 4, '#22c55e'); px(ctx, 6, 4, '#cbd5e1');
    rect(ctx, 10, 4, 3, 5, '#ef4444'); px(ctx, 11, 3, '#fde047');
    rect(ctx, 15, 5, 3, 4, '#38bdf8'); px(ctx, 16, 4, '#ffffff');
    rect(ctx, 6, 13, 3, 4, '#c084fc');
    rect(ctx, 12, 12, 4, 5, '#4ade80');
    rect(ctx, 18, 13, 3, 4, '#fbbf24');
    sprites.props.alchemyShelf = addPixelOutline(c);
  }

  // Blacksmith Weapon & Shield Display Rack (26x24)
  {
    const { c, ctx } = makeCanvas(26, 24);
    rect(ctx, 2, 4, 22, 18, '#451a03');
    rect(ctx, 4, 6, 18, 2, '#78350f');
    rect(ctx, 4, 18, 18, 2, '#78350f');
    // Swords & Solari shield
    rect(ctx, 6, 3, 2, 15, '#e2e8f0');
    rect(ctx, 5, 14, 4, 1, '#facc15');
    rect(ctx, 10, 3, 2, 15, '#cbd5e1');
    rect(ctx, 9, 14, 4, 1, '#facc15');
    rect(ctx, 15, 6, 6, 9, '#f59e0b');
    rect(ctx, 16, 7, 4, 7, '#fef08a');
    sprites.props.weaponRack = addPixelOutline(c);
  }

  // Quilted Oak Bed (22x26)
  {
    const { c, ctx } = makeCanvas(22, 26);
    rect(ctx, 3, 2, 16, 22, '#451a03');
    rect(ctx, 4, 3, 14, 4, '#78350f');
    // Pillow & blanket
    rect(ctx, 5, 7, 12, 4, '#f8fafc');
    rect(ctx, 5, 11, 12, 11, '#991b1b');
    rect(ctx, 5, 11, 12, 2, '#facc15');
    rect(ctx, 6, 14, 10, 7, '#b91c1c');
    sprites.props.cozyBed = addPixelOutline(c);
  }

  // Astral Star-Chart & Expedition Map Table (30x22)
  {
    const { c, ctx } = makeCanvas(30, 22);
    rect(ctx, 3, 5, 24, 12, '#451a03');
    rect(ctx, 4, 6, 22, 10, '#1e3a8a');
    // Glowing starlines & compass parchment
    rect(ctx, 6, 8, 18, 6, '#38bdf8');
    rect(ctx, 7, 9, 16, 4, '#0f172a');
    px(ctx, 10, 10, '#fde047');
    px(ctx, 15, 11, '#ffffff');
    px(ctx, 20, 10, '#e879f9');
    rect(ctx, 5, 17, 3, 4, '#451a03');
    rect(ctx, 22, 17, 3, 4, '#451a03');
    sprites.props.mapTable = addPixelOutline(c);
  }

  // Open Vault Treasure Chests & Gold Pile (24x18)
  {
    const { c, ctx } = makeCanvas(24, 18);
    rect(ctx, 2, 5, 20, 11, '#451a03');
    rect(ctx, 3, 3, 18, 5, '#78350f');
    rect(ctx, 3, 8, 18, 7, '#92400e');
    // Iron straps
    rect(ctx, 5, 3, 2, 12, '#64748b');
    rect(ctx, 17, 3, 2, 12, '#64748b');
    // Overflowing gold coins & sky gems
    rect(ctx, 6, 6, 12, 4, '#facc15');
    rect(ctx, 7, 5, 10, 3, '#fde047');
    px(ctx, 10, 6, '#38bdf8');
    px(ctx, 14, 7, '#e879f9');
    px(ctx, 11, 5, '#ffffff');
    sprites.props.goldChestPile = addPixelOutline(c);
  }

  // ==========================================
  // 8. PHASE 2 LIVING INTERIORS, VAULT GRATES & PROPS
  // ==========================================
  // Locked Iron Vault Grate (32x24)
  {
    const { c, ctx } = makeCanvas(32, 24);
    rect(ctx, 1, 2, 30, 3, '#334155');
    rect(ctx, 2, 3, 28, 1, '#64748b');
    rect(ctx, 1, 19, 30, 3, '#1e293b');
    // Heavy iron vertical bars
    for (let bx = 3; bx <= 27; bx += 4) {
      rect(ctx, bx, 4, 2, 16, '#475569');
      rect(ctx, bx, 5, 1, 14, '#94a3b8');
    }
    // Crossbrace + glowing 4-Covenant Seal Plate
    rect(ctx, 2, 11, 28, 2, '#334155');
    rect(ctx, 11, 8, 10, 8, '#0f172a');
    rect(ctx, 12, 9, 8, 6, '#334155');
    px(ctx, 14, 10, '#4ade80'); // Terra
    px(ctx, 17, 10, '#facc15'); // Solari
    px(ctx, 14, 13, '#38bdf8'); // Aether
    px(ctx, 17, 13, '#c084fc'); // Umbri
    sprites.props.ironVaultGrate = addPixelOutline(c);
  }

  // Unlocked Open Iron Vault Grate (32x24)
  {
    const { c, ctx } = makeCanvas(32, 24);
    rect(ctx, 1, 2, 30, 2, '#334155');
    // Retracted iron gate halves on outer edges
    rect(ctx, 2, 4, 4, 17, '#475569');
    rect(ctx, 3, 5, 1, 15, '#94a3b8');
    rect(ctx, 26, 4, 4, 17, '#475569');
    rect(ctx, 27, 5, 1, 15, '#94a3b8');
    px(ctx, 4, 11, '#4ade80');
    px(ctx, 27, 11, '#4ade80');
    sprites.props.ironVaultGrateOpen = addPixelOutline(c);
  }

  // Framed Interior Faction Crest Plaques (16x16)
  const buildCrest = (bg, accent, core) => {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 2, 1, 12, 14, '#451a03');
    rect(ctx, 3, 2, 10, 12, '#78350f');
    rect(ctx, 4, 3, 8, 10, bg);
    rect(ctx, 5, 4, 6, 8, accent);
    rect(ctx, 6, 5, 4, 5, core);
    px(ctx, 7, 6, '#ffffff');
    return addPixelOutline(c);
  };
  sprites.props.factionCrestLeaf = buildCrest('#14532d', '#16a34a', '#4ade80');
  sprites.props.factionCrestAether = buildCrest('#1e3a8a', '#0284c7', '#38bdf8');
  sprites.props.factionCrestSolari = buildCrest('#713f12', '#d97706', '#facc15');

  // Animated Sleeping Hearth Pets (2 frames)
  sprites.props.sleepingPetCat = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 12);
    rect(ctx, 3, 6 - (f % 2 ? 0 : 0), 9, 4, '#ea580c');
    rect(ctx, 4, 5, 7, 4 + (f === 1 ? 1 : 0), '#f97316');
    rect(ctx, 5, 6, 4, 2, '#fdba74');
    // Curled tail & triangular ears
    rect(ctx, 11, 7, 3, 2, '#ea580c');
    px(ctx, 4, 4, '#ea580c');
    px(ctx, 7, 4, '#ea580c');
    px(ctx, 5, 7, '#7c2d12'); // closed eye
    if (f === 1) {
      px(ctx, 10, 2, '#bae6fd');
      px(ctx, 12, 1, '#e0f2fe');
    }
    sprites.props.sleepingPetCat.push(addPixelOutline(c));
  }

  sprites.props.sleepingPetFox = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(18, 12);
    rect(ctx, 3, 5, 9, 5, '#d97706');
    rect(ctx, 4, 4, 7, 4 + (f === 1 ? 1 : 0), '#f59e0b');
    rect(ctx, 5, 6, 4, 2, '#fef3c7');
    rect(ctx, 11, 6, 4, 3, '#f8fafc'); // snowy fox tail tip
    px(ctx, 14, 6, '#38bdf8');
    px(ctx, 4, 3, '#b45309');
    px(ctx, 8, 3, '#b45309');
    if (f === 1) {
      px(ctx, 11, 2, '#ddd6fe');
      px(ctx, 13, 1, '#f3e8ff');
    }
    sprites.props.sleepingPetFox.push(addPixelOutline(c));
  }

  // Terracotta Decorative Urn (14x16)
  {
    const { c, ctx } = makeCanvas(14, 16);
    rect(ctx, 4, 2, 6, 2, '#b45309');
    rect(ctx, 5, 4, 4, 2, '#78350f');
    rect(ctx, 3, 6, 8, 6, '#b45309');
    rect(ctx, 4, 6, 6, 5, '#d97706');
    rect(ctx, 4, 7, 2, 3, '#f59e0b');
    rect(ctx, 4, 12, 6, 3, '#92400e');
    sprites.props.terracottaUrn = addPixelOutline(c);
  }

  // Mossy Fallen Log w/ Forest Mushroom (28x14)
  {
    const { c, ctx } = makeCanvas(28, 14);
    rect(ctx, 2, 5, 24, 7, '#451a03');
    rect(ctx, 3, 6, 22, 5, '#78350f');
    rect(ctx, 4, 6, 20, 2, '#92400e');
    // Exposed hollow trunk ring
    rect(ctx, 22, 6, 3, 5, '#b45309');
    rect(ctx, 23, 7, 2, 3, '#292524');
    // Moss tufts + red cap mushroom
    rect(ctx, 5, 4, 6, 3, '#16a34a');
    rect(ctx, 6, 4, 4, 2, '#4ade80');
    rect(ctx, 14, 5, 5, 2, '#22c55e');
    rect(ctx, 11, 3, 2, 3, '#fef3c7');
    rect(ctx, 10, 2, 4, 2, '#ef4444');
    px(ctx, 11, 2, '#ffffff');
    sprites.props.fallenLog = addPixelOutline(c);
  }

  // Wooden Mezzanine Balustrade Rail (32x12)
  {
    const { c, ctx } = makeCanvas(32, 12);
    rect(ctx, 1, 2, 30, 2, '#b45309');
    rect(ctx, 1, 3, 30, 1, '#d97706');
    rect(ctx, 1, 9, 30, 2, '#78350f');
    for (let x = 2; x <= 28; x += 5) {
      rect(ctx, x, 4, 2, 5, '#92400e');
      px(ctx, x, 5, '#b45309');
    }
    sprites.props.balustradeRail = addPixelOutline(c);
  }

  // Mezzanine Wooden Staircase (20x20)
  {
    const { c, ctx } = makeCanvas(20, 20);
    rect(ctx, 2, 2, 16, 17, '#451a03');
    for (let step = 0; step < 5; step++) {
      const sy = 3 + step * 3;
      rect(ctx, 4, sy, 12, 2, '#b45309');
      rect(ctx, 4, sy + 2, 12, 1, '#78350f');
    }
    rect(ctx, 2, 1, 2, 18, '#92400e');
    rect(ctx, 16, 1, 2, 18, '#92400e');
    px(ctx, 2, 1, '#f59e0b');
    px(ctx, 17, 1, '#f59e0b');
    sprites.props.woodStairs = addPixelOutline(c);
  }

  // Multi-Crystal Research Workstation Desk (26x20)
  {
    const { c, ctx } = makeCanvas(26, 20);
    rect(ctx, 2, 7, 22, 9, '#451a03');
    rect(ctx, 3, 8, 20, 7, '#78350f');
    // Glowing monitor slate & specimen vials
    rect(ctx, 5, 3, 10, 6, '#0f172a');
    rect(ctx, 6, 4, 8, 4, '#0284c7');
    px(ctx, 8, 5, '#7dd3fc');
    px(ctx, 11, 6, '#4ade80');
    rect(ctx, 17, 4, 3, 5, '#a855f7');
    px(ctx, 18, 3, '#e879f9');
    rect(ctx, 21, 5, 2, 4, '#22c55e');
    rect(ctx, 4, 16, 3, 3, '#451a03');
    rect(ctx, 19, 16, 3, 3, '#451a03');
    sprites.props.workstationConsole = addPixelOutline(c);
  }

  // Framed Botanical/Crystal Specimen Plaque (14x16)
  {
    const { c, ctx } = makeCanvas(14, 16);
    rect(ctx, 2, 1, 10, 12, '#78350f');
    rect(ctx, 3, 2, 8, 10, '#fef3c7');
    rect(ctx, 5, 4, 4, 5, '#16a34a');
    px(ctx, 6, 3, '#4ade80');
    px(ctx, 7, 7, '#38bdf8');
    rect(ctx, 6, 13, 2, 2, '#451a03');
    sprites.props.specimenFrame = addPixelOutline(c);
  }

  // Outdoor Wooden Notice Board (22x26)
  {
    const { c, ctx } = makeCanvas(22, 26);
    rect(ctx, 4, 16, 3, 9, '#451a03');
    rect(ctx, 15, 16, 3, 9, '#451a03');
    rect(ctx, 1, 3, 20, 3, '#78350f');
    rect(ctx, 3, 2, 16, 2, '#92400e');
    rect(ctx, 2, 6, 18, 11, '#78350f');
    rect(ctx, 3, 7, 16, 9, '#b45309');
    // Pinned parchment notices
    rect(ctx, 5, 8, 5, 6, '#fef3c7');
    px(ctx, 7, 8, '#ef4444');
    rect(ctx, 12, 9, 5, 5, '#fde68a');
    px(ctx, 14, 9, '#38bdf8');
    sprites.props.noticeBoard = addPixelOutline(c);
  }

  // Coastal Shoreline Cattail Reeds (12x20)
  {
    const { c, ctx } = makeCanvas(12, 20);
    rect(ctx, 3, 9, 1, 10, '#15803d');
    rect(ctx, 6, 6, 1, 13, '#16a34a');
    rect(ctx, 9, 10, 1, 9, '#22c55e');
    rect(ctx, 4, 12, 1, 7, '#4ade80');
    rect(ctx, 5, 3, 3, 4, '#78350f'); // cattail head
    rect(ctx, 2, 7, 2, 3, '#78350f');
    sprites.props.cattailReed = addPixelOutline(c);
  }

  // Winged-Sun Herald Postbox (18x26, 2 frames)
  sprites.props.heraldPostbox = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(18, 26);
    // Stone base & cast-iron post
    rect(ctx, 5, 21, 8, 4, '#334155');
    rect(ctx, 7, 15, 4, 7, '#475569');
    // Crimson/navy courier box & curved roof
    rect(ctx, 3, 7, 12, 9, '#991b1b');
    rect(ctx, 4, 6, 10, 8, '#dc2626');
    rect(ctx, 3, 5, 12, 2, '#f59e0b');
    rect(ctx, 5, 3, 8, 2, '#fde047');
    // Mail slot + tiny gold wing crest
    rect(ctx, 5, 8, 8, 2, '#1e293b');
    rect(ctx, 6, 11, 6, 3, '#fef3c7');
    px(ctx, 8, 12, '#dc2626'); // wax seal
    px(ctx, 15, 7 - f, '#fde047'); // floating courier spark
    sprites.props.heraldPostbox.push(addPixelOutline(c));
  }

  // Summoner-Knight Construct Cradle (26x24, 2 frames)
  sprites.props.constructCradle = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(26, 24);
    // Stone & gilded dais
    rect(ctx, 3, 18, 20, 4, '#334155');
    rect(ctx, 4, 17, 18, 2, '#b45309');
    // Twin crystalline rune pylons
    rect(ctx, 4, 6, 4, 11, '#0284c7');
    rect(ctx, 5, 5, 2, 10, '#38bdf8');
    rect(ctx, 18, 6, 4, 11, '#0284c7');
    rect(ctx, 19, 5, 2, 10, '#38bdf8');
    // Top prism arch & floating compilation core
    rect(ctx, 6, 3, 14, 3, '#f59e0b');
    rect(ctx, 10, 8 + f, 6, 6, '#a855f7');
    rect(ctx, 11, 9 + f, 4, 4, '#f0abfc');
    px(ctx, 12, 10 + f, '#ffffff');
    px(ctx, 9 - f, 6, '#fde047');
    px(ctx, 16 + f, 7, '#4ade80');
    sprites.props.constructCradle.push(addPixelOutline(c));
  }

  // ==========================================
  // 9. INTERACTIVE WORLD EXPANSION PROPS (Telescope, Obelisk, Archery Target, Supply Crate, Geode, Alembic, Harp, Cavern Arch)
  // ==========================================
  // Gilded Brass & Crystal Stargazer Telescope (28x32, 2 frames)
  sprites.props.arcaneTelescope = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(28, 32);
    // Stone base & mahogany tripod legs
    rect(ctx, 5, 27, 18, 4, '#334155');
    rect(ctx, 7, 20, 3, 8, '#78350f');
    rect(ctx, 13, 18, 2, 10, '#451a03');
    rect(ctx, 18, 20, 3, 8, '#78350f');
    // Brass mount gear
    rect(ctx, 11, 14, 6, 5, '#b45309');
    rect(ctx, 12, 15, 4, 3, '#facc15');
    // Angled telescope barrel (pointing up-right)
    rect(ctx, 5, 13, 6, 4, '#ca8a04');
    rect(ctx, 9, 10, 8, 5, '#d97706');
    rect(ctx, 15, 6, 8, 6, '#eab308');
    rect(ctx, 16, 7, 6, 2, '#fef08a');
    // Glowing astral objective lens
    rect(ctx, 21, 5, 4, 6, '#0284c7');
    rect(ctx, 22, 6, 2, 4, f === 0 ? '#38bdf8' : '#7dd3fc');
    px(ctx, 23, 6 + f, '#ffffff');
    px(ctx, 24, 3 - f, '#fde047');
    sprites.props.arcaneTelescope.push(addPixelOutline(c));
  }

  // Ancient First-Era Covenant Lore Obelisk (24x36, 2 frames)
  sprites.props.runicObelisk = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(24, 36);
    rect(ctx, 3, 30, 18, 5, '#1e293b');
    rect(ctx, 5, 27, 14, 3, '#334155');
    rect(ctx, 7, 6, 10, 21, '#1e1b4b');
    rect(ctx, 8, 7, 8, 19, '#312e81');
    rect(ctx, 9, 3, 6, 4, '#4c1d95');
    rect(ctx, 11, 1, 2, 2, '#fde047');
    // Pulsing 4-Covenant rune glyphs
    rect(ctx, 10, 8, 4, 2, f === 0 ? '#facc15' : '#fef08a');
    rect(ctx, 10, 12, 4, 2, f === 0 ? '#38bdf8' : '#bae6fd');
    rect(ctx, 10, 16, 4, 2, f === 0 ? '#4ade80' : '#bbf7d0');
    rect(ctx, 10, 20, 4, 2, f === 0 ? '#c084fc' : '#f3e8ff');
    px(ctx, 6, 14 - f, '#38bdf8');
    px(ctx, 17, 11 + f, '#fde047');
    sprites.props.runicObelisk.push(addPixelOutline(c));
  }

  // Straw Bullseye Archery Target Stand (24x28)
  {
    const { c, ctx } = makeCanvas(24, 28);
    // Timber easel legs
    rect(ctx, 5, 18, 3, 8, '#451a03');
    rect(ctx, 16, 18, 3, 8, '#451a03');
    rect(ctx, 11, 19, 2, 7, '#78350f');
    // Circular straw target & concentric rings
    rect(ctx, 4, 4, 16, 16, '#ca8a04');
    rect(ctx, 5, 5, 14, 14, '#f8fafc');
    rect(ctx, 7, 7, 10, 10, '#2563eb');
    rect(ctx, 9, 9, 6, 6, '#dc2626');
    rect(ctx, 11, 11, 2, 2, '#facc15');
    // Feathered arrow stuck in bullseye
    rect(ctx, 12, 9, 7, 1, '#78350f');
    px(ctx, 18, 8, '#f8fafc');
    px(ctx, 19, 9, '#ef4444');
    sprites.props.archeryTarget = addPixelOutline(c);
  }

  // Banded Oak Adventurer Supply Crate & Barrel Cache (24x22)
  {
    const { c, ctx } = makeCanvas(24, 22);
    // Oak crate on left
    rect(ctx, 2, 6, 13, 13, '#78350f');
    rect(ctx, 3, 7, 11, 11, '#b45309');
    rect(ctx, 2, 6, 13, 2, '#451a03');
    rect(ctx, 2, 17, 13, 2, '#451a03');
    rect(ctx, 4, 9, 9, 2, '#92400e');
    // Gold supply star badge
    rect(ctx, 7, 11, 3, 3, '#facc15');
    px(ctx, 8, 12, '#ffffff');
    // Small ration barrel on right
    rect(ctx, 14, 9, 8, 10, '#451a03');
    rect(ctx, 15, 10, 6, 8, '#92400e');
    rect(ctx, 14, 12, 8, 1, '#64748b');
    rect(ctx, 14, 16, 8, 1, '#64748b');
    sprites.props.supplyCrate = addPixelOutline(c);
  }

  // Bioluminescent Subterranean Crystal Geode (26x26, 2 frames)
  sprites.props.crystalGeode = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(26, 26);
    rect(ctx, 3, 15, 20, 9, '#1e293b');
    rect(ctx, 5, 11, 16, 11, '#334155');
    // Amethyst & cyan crystal cluster inside hollow rock
    rect(ctx, 7, 12, 12, 8, '#3b0764');
    rect(ctx, 8, 6, 4, 12, '#9333ea');
    rect(ctx, 9, 7, 2, 9, '#e879f9');
    rect(ctx, 13, 5, 4, 13, '#0284c7');
    rect(ctx, 14, 6, 2, 10, '#38bdf8');
    px(ctx, 10, 8 - f, '#ffffff');
    px(ctx, 14, 7 + f, '#ffffff');
    px(ctx, 6, 9 - f, '#fde047');
    px(ctx, 19, 10 + f, '#7dd3fc');
    sprites.props.crystalGeode.push(addPixelOutline(c));
  }

  // Alchemist's Copper Alembic & Retort Workbench (26x26, 2 frames)
  sprites.props.alchemistAlembic = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(26, 26);
    rect(ctx, 2, 14, 22, 10, '#451a03');
    rect(ctx, 3, 15, 20, 5, '#78350f');
    rect(ctx, 2, 13, 22, 2, '#b45309');
    // Copper distillation dome & coil
    rect(ctx, 5, 6, 6, 7, '#d97706');
    rect(ctx, 6, 4, 4, 3, '#f59e0b');
    rect(ctx, 11, 6, 5, 2, '#fb923c');
    // Glowing emerald receiving flask
    rect(ctx, 15, 8, 6, 5, '#15803d');
    rect(ctx, 16, 9, 4, 3, f === 0 ? '#4ade80' : '#86efac');
    px(ctx, 17, 7 - f, '#bbf7d0');
    sprites.props.alchemistAlembic.push(addPixelOutline(c));
  }

  // Gilded Tavern & Plaza Concert Harp Stand (20x26, 2 frames)
  sprites.props.bardHarpStand = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(20, 26);
    rect(ctx, 5, 21, 10, 3, '#78350f');
    rect(ctx, 6, 6, 2, 15, '#d97706');
    rect(ctx, 6, 5, 9, 3, '#facc15');
    rect(ctx, 13, 8, 2, 13, '#b45309');
    // Shimmering harp strings
    for (let sx = 9; sx <= 12; sx++) {
      rect(ctx, sx, 8, 1, 12, (sx + f) % 2 === 0 ? '#fef08a' : '#38bdf8');
    }
    px(ctx, 15, 3 - f, '#f472b6');
    px(ctx, 4, 4 + f, '#38bdf8');
    sprites.props.bardHarpStand.push(addPixelOutline(c));
  }

  // Bioluminescent CrystalEcho Cavern Entrance Archway (38x38, 2 frames)
  sprites.props.cavernEntrance = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(38, 38);
    // Craggy stone outer arch
    rect(ctx, 3, 14, 32, 22, '#1e293b');
    rect(ctx, 5, 8, 28, 26, '#334155');
    rect(ctx, 9, 4, 20, 6, '#475569');
    // Dark subterranean cave mouth with glowing crystal steps
    rect(ctx, 11, 14, 16, 22, '#090d16');
    rect(ctx, 13, 12, 12, 4, '#0f172a');
    rect(ctx, 13, 32, 12, 3, '#1e3a8a');
    rect(ctx, 15, 33, 8, 2, f === 0 ? '#38bdf8' : '#7dd3fc');
    // Protruding crystal shards around cave arch
    rect(ctx, 6, 18, 4, 8, '#0284c7');
    rect(ctx, 7, 19, 2, 6, '#38bdf8');
    rect(ctx, 28, 18, 4, 8, '#9333ea');
    rect(ctx, 29, 19, 2, 6, '#e879f9');
    rect(ctx, 17, 5, 4, 6, '#2dd4bf');
    px(ctx, 18, 6 + f, '#ffffff');
    sprites.props.cavernEntrance.push(addPixelOutline(c));
  }

  // 1v1 GlimmerFallTCG.com Tavern Duel Table & Playmat (34x26, 2 frames)
  sprites.props.tcgDuelTable = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(34, 26);
    // Left & right carved tavern stools
    rect(ctx, 1, 10, 4, 9, '#78350f');
    rect(ctx, 1, 9, 4, 3, '#b45309');
    rect(ctx, 29, 10, 4, 9, '#78350f');
    rect(ctx, 29, 9, 4, 3, '#b45309');
    // Heavy oak table legs & apron
    rect(ctx, 7, 17, 3, 6, '#451a03');
    rect(ctx, 24, 17, 3, 6, '#451a03');
    rect(ctx, 6, 6, 22, 13, '#78350f');
    rect(ctx, 7, 5, 20, 12, '#92400e');
    // Gold-trimmed royal arena playmat
    rect(ctx, 9, 6, 16, 10, '#facc15');
    rect(ctx, 10, 7, 14, 8, '#1e1b4b');
    // Center battlefield divider line
    rect(ctx, 10, 11, 14, 1, '#312e81');
    // P1 & P2 deck stacks + miniature cards in play
    rect(ctx, 11, 8, 2, 3, '#f59e0b'); // Solari deck
    rect(ctx, 15, 8, 2, 2, '#38bdf8'); // Aether card
    rect(ctx, 18, 8, 2, 2, '#4ade80'); // Terra card
    rect(ctx, 21, 12, 2, 3, '#a855f7'); // Umbri deck
    rect(ctx, 14, 12, 2, 2, '#facc15'); // Solari entity
    rect(ctx, 17, 12, 2, 2, '#c084fc'); // Umbri entity
    // Animated Resonance energy orbs on table corners
    px(ctx, 11, 13, f === 0 ? '#38bdf8' : '#7dd3fc');
    px(ctx, 22, 8, f === 0 ? '#facc15' : '#fef08a');
    sprites.props.tcgDuelTable.push(addPixelOutline(c));
  }

  // Vanguard Combat Target Dummy & DPS Meter Post (22x28, 2 frames)
  sprites.props.trainingDummy = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(22, 28);
    // Heavy oak base & central post
    rect(ctx, 5, 22, 12, 3, '#451a03');
    rect(ctx, 7, 20, 8, 3, '#78350f');
    rect(ctx, 9, 6, 4, 15, '#92400e');
    // Crossbar arms
    rect(ctx, 2, 10, 18, 3, '#78350f');
    // Padded straw & steel breastplate torso
    rect(ctx, 6, 9, 10, 10, '#d97706');
    rect(ctx, 7, 10, 8, 8, '#f59e0b');
    rect(ctx, 7, 11, 8, 5, '#64748b');
    rect(ctx, 8, 12, 6, 3, '#94a3b8');
    // Burlap head & target bullseye on chest
    rect(ctx, 7, 3, 8, 6, '#eab308');
    rect(ctx, 8, 4, 6, 4, '#fde047');
    px(ctx, 9, 5, '#451a03');
    px(ctx, 12, 5, '#451a03');
    // Round practice shield mounted on left arm
    rect(ctx, 1, 9, 4, 7, '#b91c1c');
    rect(ctx, 2, 10, 2, 5, '#facc15');
    // Hit spark glint
    px(ctx, 11, 13, f === 0 ? '#ef4444' : '#fde047');
    sprites.props.trainingDummy.push(addPixelOutline(c));
  }

  // Astral Mystery Peddler Curio Cart (32x26, 2 frames)
  sprites.props.mysteryPeddlerCart = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(32, 26);
    // Spoked wooden wagon wheels
    rect(ctx, 5, 17, 7, 7, '#451a03');
    rect(ctx, 6, 18, 5, 5, '#92400e');
    px(ctx, 8, 20, '#facc15');
    rect(ctx, 20, 17, 7, 7, '#451a03');
    rect(ctx, 21, 18, 5, 5, '#92400e');
    px(ctx, 23, 20, '#facc15');
    // Wagon bed & starlight purple/gold canopy
    rect(ctx, 3, 13, 26, 5, '#78350f');
    rect(ctx, 4, 4, 24, 10, '#4c1d95');
    rect(ctx, 5, 5, 22, 8, '#6d28d9');
    rect(ctx, 4, 11, 24, 2, '#facc15');
    // Glowing potion bottles & relic curios on counter
    rect(ctx, 8, 12, 3, 3, '#38bdf8');
    rect(ctx, 14, 11, 4, 4, '#f59e0b');
    rect(ctx, 20, 12, 3, 3, '#4ade80');
    // Hanging astral lantern
    rect(ctx, 27, 7, 3, 4, f === 0 ? '#fde047' : '#38bdf8');
    px(ctx, 11, 7, f === 0 ? '#fef08a' : '#e879f9');
    px(ctx, 19, 6, f === 0 ? '#7dd3fc' : '#fef08a');
    sprites.props.mysteryPeddlerCart.push(addPixelOutline(c));
  }

  // Hidden Covenant Treasure Coffer (20x18, 2 frames)
  sprites.props.treasureCoffer = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(20, 18);
    rect(ctx, 3, 6, 14, 9, '#78350f');
    rect(ctx, 4, 4, 12, 4, '#b45309');
    // Gold trim bands & ruby clasp
    rect(ctx, 3, 8, 14, 2, '#facc15');
    rect(ctx, 5, 4, 2, 11, '#eab308');
    rect(ctx, 13, 4, 2, 11, '#eab308');
    rect(ctx, 9, 7, 2, 4, f === 0 ? '#ef4444' : '#fde047');
    px(ctx, 10, 3 - f, '#fef08a');
    sprites.props.treasureCoffer.push(addPixelOutline(c));
  }

  // Celestial Wishing Shrine (24x28, 2 frames)
  sprites.props.wishingShrine = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(24, 28);
    // Marble stepped pedestal & basin
    rect(ctx, 4, 21, 16, 4, '#64748b');
    rect(ctx, 5, 19, 14, 3, '#94a3b8');
    rect(ctx, 6, 14, 12, 6, '#e2e8f0');
    rect(ctx, 7, 15, 10, 3, f === 0 ? '#38bdf8' : '#7dd3fc');
    // Twin golden pillars & arched crown
    rect(ctx, 6, 6, 2, 9, '#d97706');
    rect(ctx, 16, 6, 2, 9, '#d97706');
    rect(ctx, 5, 4, 14, 3, '#facc15');
    // Floating starlight crystal core
    rect(ctx, 10, 8 - f, 4, 4, '#fde047');
    px(ctx, 11, 9 - f, '#ffffff');
    px(ctx, 9, 16, '#fde047');
    px(ctx, 14, 16, '#fde047');
    sprites.props.wishingShrine.push(addPixelOutline(c));
  }

  // Chrono-Astrolabe Sundial Pillar (24x28, 2 frames)
  sprites.props.ancientSundialClock = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(24, 28);
    rect(ctx, 5, 22, 14, 3, '#334155');
    rect(ctx, 7, 14, 10, 8, '#475569');
    rect(ctx, 8, 12, 8, 10, '#64748b');
    // Brass astrolabe ring & glowing chrono-needle
    rect(ctx, 6, 4, 12, 10, '#b45309');
    rect(ctx, 7, 5, 10, 8, '#1e1b4b');
    rect(ctx, 11, 6, 2, 6, '#facc15');
    rect(ctx, 8 + f, 8, 7, 2, '#38bdf8');
    px(ctx, 11, 8, '#ffffff');
    sprites.props.ancientSundialClock.push(addPixelOutline(c));
  }

  // Mariner Drying Net Rack & Crab Trap (26x22, 2 frames)
  sprites.props.fishermanNetRack = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(26, 22);
    // Bamboo drying frame posts
    rect(ctx, 3, 4, 2, 15, '#78350f');
    rect(ctx, 21, 4, 2, 15, '#78350f');
    rect(ctx, 3, 5, 20, 2, '#92400e');
    // Draped sea-green mesh net & floats
    rect(ctx, 5, 7, 16, 8, '#0f766e');
    rect(ctx, 6, 8, 14, 6, '#14b8a6');
    px(ctx, 7, 6, '#f97316');
    px(ctx, 12, 6, '#f97316');
    px(ctx, 17, 6, '#f97316');
    // Wooden crab pot beside rack
    rect(ctx, 14, 14, 7, 5, '#b45309');
    rect(ctx, 15, 15, 5, 3, '#78350f');
    px(ctx, 9, 10 + f, '#38bdf8');
    sprites.props.fishermanNetRack.push(addPixelOutline(c));
  }

  // War-Order Covenant Rally Banner Stand (20x30, 2 frames)
  sprites.props.covenantBannerStand = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(20, 30);
    rect(ctx, 6, 25, 8, 3, '#475569');
    rect(ctx, 9, 3, 2, 23, '#d97706');
    rect(ctx, 4, 5, 12, 2, '#facc15');
    // Embroidered crimson/gold pennant
    rect(ctx, 5, 7, 10, 14 + f, '#991b1b');
    rect(ctx, 6, 8, 8, 12, '#dc2626');
    rect(ctx, 8, 10, 4, 4, '#facc15');
    px(ctx, 9, 11, '#ffffff');
    sprites.props.covenantBannerStand.push(addPixelOutline(c));
  }

  // Aurora Crystal Obelisk (22x34, 2 frames — Glacial Leyline Shrine)
  sprites.props.auroraCrystalObelisk = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(22, 34);
    rect(ctx, 4, 27, 14, 4, '#334155');
    rect(ctx, 5, 25, 12, 3, '#64748b');
    // Glacial spire crystal
    rect(ctx, 7, 10, 8, 16, '#0284c7');
    rect(ctx, 8, 6, 6, 19, '#38bdf8');
    rect(ctx, 9, 4, 4, 20, '#bae6fd');
    rect(ctx, 10, 2, 2, 18, '#ffffff');
    // Pulsing borealis rune band
    rect(ctx, 8, 14 + f, 6, 2, f === 0 ? '#a855f7' : '#5eead4');
    px(ctx, 10, 11 - f, '#f0abfc');
    sprites.props.auroraCrystalObelisk.push(addPixelOutline(c));
  }

  // Glacial Expedition Supply Sled (28x22, 2 frames)
  sprites.props.glacialSupplySled = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(28, 22);
    // Curved steel-shod ski runners
    rect(ctx, 2, 17, 23, 2, '#94a3b8');
    px(ctx, 1, 15, '#cbd5e1');
    px(ctx, 2, 16, '#cbd5e1');
    rect(ctx, 6, 14, 2, 3, '#78350f');
    rect(ctx, 19, 14, 2, 3, '#78350f');
    // Timber deck & bundled cargo crates
    rect(ctx, 4, 12, 20, 3, '#92400e');
    rect(ctx, 6, 6, 9, 6, '#b45309');
    rect(ctx, 7, 7, 7, 4, '#d97706');
    rect(ctx, 16, 8, 6, 4, '#0369a1');
    // Hanging warm expedition lantern
    rect(ctx, 22, 7, 3, 5, '#475569');
    px(ctx, 23, 9, f === 0 ? '#fde047' : '#fb923c');
    // Frost rim accents
    rect(ctx, 6, 6, 9, 1, '#e0f2fe');
    sprites.props.glacialSupplySled.push(addPixelOutline(c));
  }
}
