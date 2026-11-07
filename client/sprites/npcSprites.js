import { makeCanvas, px, rect, addPixelOutline } from "./pixelCanvas.js";

export function buildNpcSprites(sprites) {
  // ==========================================
  // 4. SOLARI HERALD NPC & ALLIED CHAMPIONS
  // ==========================================
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 28);
    rect(ctx, 2, 7 + bob, 6, 10, '#fef08a');
    rect(ctx, 3, 8 + bob, 4, 7, '#ffffff');
    rect(ctx, 20, 7 + bob, 6, 10, '#fef08a');
    rect(ctx, 21, 8 + bob, 4, 7, '#ffffff');
    rect(ctx, 9, 11 + bob, 10, 14, '#e2e8f0');
    rect(ctx, 11, 12 + bob, 6, 12, '#facc15');
    rect(ctx, 10, 1 + bob, 8, 2, '#fde047');
    rect(ctx, 10, 5 + bob, 8, 6, '#f59e0b');
    rect(ctx, 11, 6 + bob, 6, 4, '#fef9c3');
    px(ctx, 12, 7 + bob, '#0284c7');
    px(ctx, 15, 7 + bob, '#0284c7');
    rect(ctx, 22, 4 + bob, 2, 21, '#b45309');
    rect(ctx, 20, 3 + bob, 6, 4, '#38bdf8');
    rect(ctx, 22, 4 + bob, 2, 2, '#ffffff');
    sprites.heraldNpc.push(addPixelOutline(c));
  }

  // Distinguished AetherVault Banker NPC (22x26 px, 2-frame animation)
  sprites.bankerNpc = [];
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(22, 26);
    // Silver Hair & Head
    rect(ctx, 7, 2 + bob, 8, 4, '#cbd5e1');
    rect(ctx, 6, 4 + bob, 10, 6, '#fed7aa');
    // Gold Spectacles / Monocle
    rect(ctx, 8, 6 + bob, 3, 2, '#ca8a04');
    px(ctx, 9, 6 + bob, '#38bdf8');
    px(ctx, 12, 6 + bob, '#0f172a'); // Eye
    // Burgundy & Imperial Navy Velvet Coat
    rect(ctx, 5, 10 + bob, 12, 11, '#831843');
    rect(ctx, 7, 10 + bob, 8, 11, '#1e1b4b');
    // Gold braided frogging & buttons
    rect(ctx, 10, 11 + bob, 2, 9, '#facc15');
    px(ctx, 10, 12 + bob, '#ffffff');
    px(ctx, 10, 15 + bob, '#ffffff');
    // Hands & Ledger
    rect(ctx, 12, 13 + bob, 6, 6, '#451a03'); // Leather ledger
    rect(ctx, 13, 14 + bob, 4, 4, '#f8fafc'); // White parchment pages
    px(ctx, 15, 12 + bob, '#fed7aa'); // Hand
    // Dark Trousers & Boots
    rect(ctx, 7, 21 + bob, 4, 5, '#0f172a');
    rect(ctx, 11, 21 + bob, 4, 5, '#0f172a');

    sprites.bankerNpc.push(addPixelOutline(c));
  }

  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    {
      const { c, ctx } = makeCanvas(22, 24);
      rect(ctx, 7, 11 + bob, 8, 10, '#1d4ed8');
      rect(ctx, 8, 12 + bob, 6, 9, '#38bdf8');
      rect(ctx, 6, 4 + bob, 10, 7, '#1e3a8a');
      rect(ctx, 8, 6 + bob, 6, 4, '#0f172a');
      px(ctx, 9, 7 + bob, '#7dd3fc');
      px(ctx, 12, 7 + bob, '#7dd3fc');
      rect(ctx, 17, 5 + bob, 2, 16, '#92400e');
      rect(ctx, 16, 3 + bob, 4, 4, '#38bdf8');
      sprites.allyMage.push(addPixelOutline(c));
    }
    {
      const { c, ctx } = makeCanvas(24, 25);
      rect(ctx, 5, 10 + bob, 14, 11, '#15803d');
      rect(ctx, 7, 11 + bob, 10, 9, '#4ade80');
      rect(ctx, 7, 4 + bob, 10, 7, '#3f6212');
      px(ctx, 9, 7 + bob, '#fde047');
      px(ctx, 14, 7 + bob, '#fde047');
      rect(ctx, 7, 21, 4, 3, '#365314');
      rect(ctx, 13, 21, 4, 3, '#365314');
      sprites.allyPaladin.push(addPixelOutline(c));
    }
  }

  // ==========================================
  // 4B. CANONICAL GLIMMERFALL TCG NPCS (ALL 11 UNIQUE NPCS & PORTRAITS)
  // ==========================================

  // 1. ATLAS THE KEYSTONE CARTOGRAPHER (Ancient First Nexus Seeker)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Brown leather boots
    rect(ctx, 8, 21 + bob, 4, 4, '#451a03');
    rect(ctx, 14, 21 + bob, 4, 4, '#451a03');
    // Traveler Cloak & Tunic
    rect(ctx, 6, 10 + bob, 14, 11, '#78350f');
    rect(ctx, 8, 11 + bob, 10, 10, '#b45309');
    rect(ctx, 9, 12 + bob, 8, 8, '#d97706');
    // Back scroll pack & compass
    rect(ctx, 2, 8 + bob, 4, 9, '#92400e');
    rect(ctx, 3, 9 + bob, 2, 7, '#fef08a');
    // Cowl & Head
    rect(ctx, 7, 4 + bob, 12, 7, '#78350f');
    rect(ctx, 8, 5 + bob, 10, 5, '#fed7aa');
    px(ctx, 10, 7 + bob, '#451a03');
    px(ctx, 14, 7 + bob, '#451a03');
    // Brass Telescope / Map Staff
    rect(ctx, 20, 3 + bob, 2, 22, '#ca8a04');
    rect(ctx, 19, 2 + bob, 4, 3, '#facc15');
    px(ctx, 20, 3 + bob, '#ffffff');
    sprites.cartographerNpc.push(addPixelOutline(c));
  }

  // 2. ARCHON VALERIUS (Sunspire Warlord / Warzone Commander)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 28);
    // Billowing crimson war cape
    rect(ctx, 4, 9 + bob, 20, 15, '#991b1b');
    rect(ctx, 6, 12 + bob, 16, 13, '#dc2626');
    // Heavy golden war plate
    rect(ctx, 8, 10 + bob, 12, 12, '#b45309');
    rect(ctx, 9, 11 + bob, 10, 10, '#facc15');
    rect(ctx, 12, 13 + bob, 4, 4, '#ef4444'); // Ruby chest core
    // Winged crest war-helm
    rect(ctx, 8, 3 + bob, 12, 8, '#ca8a04');
    rect(ctx, 9, 4 + bob, 10, 6, '#fde047');
    rect(ctx, 10, 6 + bob, 8, 2, '#7f1d1d'); // Fiery slit visor
    px(ctx, 11, 6 + bob, '#f87171');
    px(ctx, 16, 6 + bob, '#f87171');
    // Twin golden helm wings
    rect(ctx, 6, 1 + bob, 3, 5, '#fde047');
    rect(ctx, 19, 1 + bob, 3, 5, '#fde047');
    // Planted Sun-Forged Greatblade
    rect(ctx, 22, 2 + bob, 3, 23, '#e2e8f0');
    rect(ctx, 21, 5 + bob, 5, 2, '#facc15'); // Crossguard
    px(ctx, 23, 2 + bob, '#ffffff');
    sprites.warzoneArchonNpc.push(addPixelOutline(c));
  }

  // 3. CAPTAIN VAELEN (Lantern District Templar)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Silver & gold templar cuirass
    rect(ctx, 7, 10 + bob, 12, 12, '#334155');
    rect(ctx, 8, 11 + bob, 10, 10, '#94a3b8');
    rect(ctx, 10, 11 + bob, 6, 10, '#facc15'); // Golden solar breastplate tabard
    // Red sash
    rect(ctx, 8, 17 + bob, 10, 2, '#dc2626');
    // Templar Knight Helm & Face
    rect(ctx, 8, 4 + bob, 10, 7, '#64748b');
    rect(ctx, 9, 5 + bob, 8, 5, '#fed7aa');
    px(ctx, 11, 7 + bob, '#0284c7');
    px(ctx, 14, 7 + bob, '#0284c7');
    rect(ctx, 9, 3 + bob, 8, 2, '#facc15'); // Gold crest
    // Hanging Dawnfire Lantern at waist
    rect(ctx, 19, 13 + bob, 5, 7, '#b45309');
    rect(ctx, 20, 14 + bob, 3, 5, '#fde047');
    px(ctx, 21, 15 + bob, '#ffffff');
    sprites.solariCaptainNpc.push(addPixelOutline(c));
  }

  // 4. PYREMASTER LUCIAN (Sunken Vault Flamekeeper)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Flowing ceremonial white-and-gold pyre robes
    rect(ctx, 6, 10 + bob, 14, 14, '#f8fafc');
    rect(ctx, 8, 12 + bob, 10, 11, '#fef08a');
    rect(ctx, 7, 21 + bob, 12, 3, '#ea580c'); // Flame-embroidered hem
    // Golden Sunburst Mask & Cowl
    rect(ctx, 7, 3 + bob, 12, 8, '#f59e0b');
    rect(ctx, 9, 4 + bob, 8, 6, '#fef08a');
    px(ctx, 11, 6 + bob, '#b45309');
    px(ctx, 14, 6 + bob, '#b45309');
    rect(ctx, 10, 1 + bob, 6, 2, '#fde047'); // Sunburst rays
    // Hovering Sacred Eternal Dawn Pyre Flame
    rect(ctx, 19, 9 + (f === 0 ? 0 : 2), 5, 7, '#f97316');
    rect(ctx, 20, 10 + (f === 0 ? 0 : 2), 3, 5, '#fef08a');
    px(ctx, 21, 11 + (f === 0 ? 0 : 2), '#ffffff');
    sprites.solariFlamekeeperNpc.push(addPixelOutline(c));
  }

  // 5. SHADOW BROKER NYX (Duskveil Syndicate Whisperer)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Obsidian stealth mantle
    rect(ctx, 6, 10 + bob, 14, 12, '#0f172a');
    rect(ctx, 8, 11 + bob, 10, 10, '#1e1b4b');
    rect(ctx, 10, 12 + bob, 6, 8, '#3b0764');
    // Leather boots
    rect(ctx, 8, 21 + bob, 4, 3, '#020617');
    rect(ctx, 14, 21 + bob, 4, 3, '#020617');
    // Hood & Rogue Domino Mask
    rect(ctx, 7, 3 + bob, 12, 8, '#1e1b4b');
    rect(ctx, 9, 5 + bob, 8, 5, '#020617');
    // Glowing Magenta Rogue Slit Eyes
    px(ctx, 10, 7 + bob, '#f43f5e');
    px(ctx, 11, 7 + bob, '#fb7185');
    px(ctx, 14, 7 + bob, '#fb7185');
    px(ctx, 15, 7 + bob, '#f43f5e');
    // Twin Poisoned Curved Daggers at hips
    rect(ctx, 4, 13 + bob, 2, 7, '#94a3b8');
    px(ctx, 4, 12 + bob, '#a855f7');
    rect(ctx, 20, 13 + bob, 2, 7, '#94a3b8');
    px(ctx, 20, 12 + bob, '#a855f7');
    sprites.shadowBrokerNpc.push(addPixelOutline(c));
  }

  // 6. WRAITHMOTHER VESPERA (Weaver of Graveglass)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Spectral floating robes
    rect(ctx, 7, 10 + bob, 12, 13, '#1e1b4b');
    rect(ctx, 8, 11 + bob, 10, 11, '#3b0764');
    rect(ctx, 9, 12 + bob, 8, 9, '#581c87');
    rect(ctx, 7, 3 + bob, 12, 8, '#2e1065');
    rect(ctx, 9, 5 + bob, 8, 5, '#0f172a');
    // Piercing glowing red void eyes
    rect(ctx, 10, 7 + bob, 2, 2, '#ef4444');
    rect(ctx, 14, 7 + bob, 2, 2, '#ef4444');
    // Shadow Mist Horns
    rect(ctx, 5, 1 + bob, 3, 3, '#7e22ce');
    rect(ctx, 18, 1 + bob, 3, 3, '#7e22ce');
    // Graveglass Skull Lantern with Soul Flame
    rect(ctx, 19, 9 + bob, 5, 8, '#581c87');
    rect(ctx, 20, 11 + bob, 3, 4, '#f472b6');
    px(ctx, 21, 12 + bob, '#ffffff');
    sprites.shadowWraithmotherNpc.push(addPixelOutline(c));
  }

  // 7. GROVE TENDER ROWAN (Rootdeep Herbalist)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Living vine tunic
    rect(ctx, 6, 11 + bob, 14, 11, '#15803d');
    rect(ctx, 8, 12 + bob, 10, 9, '#22c55e');
    rect(ctx, 9, 13 + bob, 8, 7, '#4ade80');
    // Woven wicker herb basket on back
    rect(ctx, 3, 9 + bob, 4, 9, '#92400e');
    rect(ctx, 3, 8 + bob, 4, 2, '#fde047'); // Glowing glimmer herbs in pack
    // Head & Flower Garland Crown
    rect(ctx, 8, 4 + bob, 10, 7, '#78350f');
    rect(ctx, 9, 5 + bob, 8, 5, '#fed7aa');
    px(ctx, 11, 7 + bob, '#15803d');
    px(ctx, 14, 7 + bob, '#15803d');
    rect(ctx, 8, 3 + bob, 10, 2, '#facc15'); // Blossom crown
    px(ctx, 9, 3 + bob, '#ef4444');
    px(ctx, 14, 3 + bob, '#ef4444');
    // Harvesting Sickle
    rect(ctx, 20, 8 + bob, 2, 12, '#78350f');
    rect(ctx, 19, 7 + bob, 4, 2, '#cbd5e1');
    sprites.terraHerbalistNpc.push(addPixelOutline(c));
  }

  // 8. ELDER DRUID SYLVANUS (Voice of Ironbark)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 28);
    // Petrified bark armor with moss
    rect(ctx, 7, 11 + bob, 14, 12, '#14532d');
    rect(ctx, 9, 12 + bob, 10, 10, '#166534');
    rect(ctx, 10, 13 + bob, 8, 8, '#22c55e');
    // Weathered Druid Head & Mossy Beard
    rect(ctx, 8, 4 + bob, 12, 7, '#451a03');
    rect(ctx, 10, 5 + bob, 8, 5, '#dcfce7');
    px(ctx, 11, 7 + bob, '#15803d');
    px(ctx, 15, 7 + bob, '#15803d');
    rect(ctx, 10, 9 + bob, 8, 3, '#16a34a'); // Green leafy beard
    // Grand Stag Antlers with dangling runestones
    rect(ctx, 5, 0 + bob, 3, 5, '#84cc16');
    rect(ctx, 20, 0 + bob, 3, 5, '#84cc16');
    px(ctx, 4, 3 + bob, '#86efac'); // Glowing hanging rune
    px(ctx, 23, 3 + bob, '#86efac');
    // Gnarled Ironwood Staff with pulsating sprout
    rect(ctx, 22, 3 + bob, 2, 23, '#78350f');
    rect(ctx, 21, 1 + bob, 4, 4, '#22c55e');
    px(ctx, 22, 2 + bob, '#fde047');
    sprites.terraElderDruidNpc.push(addPixelOutline(c));
  }

  // 9. ASTROMANCER KAELEN (Mirrorgate Stargazer)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Deep indigo starlight robes
    rect(ctx, 6, 11 + bob, 14, 12, '#0c4a6e');
    rect(ctx, 8, 12 + bob, 10, 10, '#0284c7');
    rect(ctx, 9, 13 + bob, 8, 8, '#38bdf8');
    px(ctx, 8, 14 + bob, '#ffffff'); // Star specks
    px(ctx, 15, 17 + bob, '#ffffff');
    // Stargazer Hood & Crescent Clasp
    rect(ctx, 7, 3 + bob, 12, 8, '#082f49');
    rect(ctx, 9, 5 + bob, 8, 5, '#e0f2fe');
    px(ctx, 11, 7 + bob, '#0369a1');
    px(ctx, 14, 7 + bob, '#0369a1');
    rect(ctx, 11, 2 + bob, 4, 2, '#38bdf8'); // Silver lunar crest
    // Floating Brass Armillary Astrolabe with orbiting star
    rect(ctx, 19, 8 + (f === 0 ? 0 : 2), 5, 5, '#ca8a04');
    rect(ctx, 20, 9 + (f === 0 ? 0 : 2), 3, 3, '#38bdf8');
    px(ctx, 21, 10 + (f === 0 ? 0 : 2), '#ffffff');
    sprites.aetherAstromancerNpc.push(addPixelOutline(c));
  }

  // 10. CHRONOS SAGE ZEPHYR (Chronocore Archon)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Floating cosmic cyan & white robes
    rect(ctx, 6, 11 + bob, 14, 12, '#0369a1');
    rect(ctx, 8, 12 + bob, 10, 10, '#0ea5e9');
    rect(ctx, 9, 13 + bob, 8, 8, '#e0f2fe');
    // Ethereal chronomancer head
    rect(ctx, 7, 4 + bob, 12, 7, '#082f49');
    rect(ctx, 9, 5 + bob, 8, 5, '#f0f9ff');
    px(ctx, 11, 7 + bob, '#0284c7');
    px(ctx, 14, 7 + bob, '#0284c7');
    // Concentric Temporal Clock Dial Ring
    rect(ctx, 6, 1 + bob, 14, 2, '#38bdf8');
    px(ctx, 13, 0 + bob, '#ffffff');
    // Floating Paradox Chrono-Hourglass
    rect(ctx, 19, 10 + (f === 0 ? 0 : -2), 5, 7, '#38bdf8');
    rect(ctx, 20, 11 + (f === 0 ? 0 : -2), 3, 5, '#bae6fd');
    px(ctx, 21, 13 + (f === 0 ? 0 : -2), '#ffffff');
    sprites.aetherChronosNpc.push(addPixelOutline(c));
  }

  // Backward-compatibility Aliases
  sprites.shadowNpc = sprites.shadowBrokerNpc;
  sprites.druidNpc = sprites.terraHerbalistNpc;
  sprites.chronoNpc = sprites.aetherAstromancerNpc;

  // ==========================================
  // 4C. HIGH-FIDELITY 32x32 CHAT & DIALOGUE NPC PORTRAITS
  // ==========================================
  function createBustPortrait({ border, bg, bustDraw }) {
    const { c, ctx } = makeCanvas(32, 32);
    // Frame background
    rect(ctx, 0, 0, 32, 32, border);
    rect(ctx, 1, 1, 30, 30, bg);
    // Corner accent studs
    rect(ctx, 1, 1, 2, 2, border);
    rect(ctx, 29, 1, 2, 2, border);
    rect(ctx, 1, 29, 2, 2, border);
    rect(ctx, 29, 29, 2, 2, border);
    // Custom bust
    bustDraw(ctx);
    return c;
  }

  // 1. Herald Lyra (Solari Awakening Mentor)
  sprites.npcPortraits.heraldNpc = createBustPortrait({
    border: '#facc15',
    bg: '#16162d',
    bustDraw(ctx) {
      // Golden Halo Corona
      rect(ctx, 9, 4, 14, 2, '#fde047');
      rect(ctx, 7, 6, 2, 4, '#facc15');
      rect(ctx, 23, 6, 2, 4, '#facc15');
      // Hair & Circlet
      rect(ctx, 10, 8, 12, 5, '#f59e0b');
      rect(ctx, 11, 8, 10, 2, '#fde047');
      // Face
      rect(ctx, 11, 11, 10, 8, '#fed7aa');
      px(ctx, 13, 14, '#0284c7'); // Blue eyes
      px(ctx, 18, 14, '#0284c7');
      // Gorget & Dawn Vanguard Plate
      rect(ctx, 8, 19, 16, 11, '#e2e8f0');
      rect(ctx, 11, 20, 10, 10, '#facc15');
      rect(ctx, 14, 22, 4, 6, '#ffffff'); // Solar emblem
      // Sun crystal staff top
      rect(ctx, 25, 9, 3, 18, '#b45309');
      rect(ctx, 24, 7, 5, 4, '#38bdf8');
      px(ctx, 26, 8, '#ffffff');
    },
  });

  // Banker Trove-Master Orin Portrait
  sprites.npcPortraits.bankerNpc = createBustPortrait({
    border: '#fde047',
    bg: '#1a1025',
    bustDraw(ctx) {
      // Golden Banker Crest
      rect(ctx, 10, 3, 12, 2, '#facc15');
      // Silver Dignified Hair
      rect(ctx, 9, 5, 14, 6, '#cbd5e1');
      // Face
      rect(ctx, 11, 9, 10, 9, '#fed7aa');
      // Gold Monocle
      rect(ctx, 12, 11, 3, 3, '#ca8a04');
      px(ctx, 13, 12, '#7dd3fc');
      px(ctx, 17, 12, '#0f172a');
      // Burgundy & Gold Robe
      rect(ctx, 7, 18, 18, 10, '#831843');
      rect(ctx, 13, 18, 6, 10, '#facc15');
      rect(ctx, 15, 18, 2, 10, '#ffffff');
    },
  });

  // 2. Atlas the Keystone Cartographer
  sprites.npcPortraits.cartographerNpc = createBustPortrait({
    border: '#f59e0b',
    bg: '#1e1308',
    bustDraw(ctx) {
      // Back pack with rolled map scrolls
      rect(ctx, 5, 6, 4, 12, '#92400e');
      rect(ctx, 6, 4, 3, 5, '#fef08a');
      // Traveler Cowl
      rect(ctx, 9, 6, 14, 8, '#78350f');
      rect(ctx, 10, 7, 12, 6, '#b45309');
      // Face & Eyes
      rect(ctx, 11, 12, 10, 7, '#fed7aa');
      px(ctx, 13, 14, '#451a03');
      px(ctx, 18, 14, '#451a03');
      // Cloak Mantle & Astrolabe Brooch
      rect(ctx, 7, 19, 18, 11, '#78350f');
      rect(ctx, 10, 20, 12, 10, '#b45309');
      rect(ctx, 14, 21, 4, 4, '#facc15'); // Brass compass
      px(ctx, 15, 22, '#ffffff');
      // Surveyor Rod
      rect(ctx, 26, 5, 2, 24, '#ca8a04');
      rect(ctx, 25, 3, 4, 4, '#facc15');
    },
  });

  // 3. Archon Valerius (Sunspire Warzone Commander)
  sprites.npcPortraits.warzoneArchonNpc = createBustPortrait({
    border: '#facc15',
    bg: '#210f13',
    bustDraw(ctx) {
      // Winged War Helm
      rect(ctx, 7, 5, 4, 8, '#fde047');
      rect(ctx, 21, 5, 4, 8, '#fde047');
      rect(ctx, 10, 6, 12, 9, '#ca8a04');
      rect(ctx, 11, 7, 10, 7, '#facc15');
      // Fierce Visor Slit
      rect(ctx, 12, 12, 8, 2, '#7f1d1d');
      px(ctx, 13, 12, '#f87171');
      px(ctx, 18, 12, '#f87171');
      // Massive Golden Gorget & Crimson Core
      rect(ctx, 6, 16, 20, 14, '#b45309');
      rect(ctx, 8, 17, 16, 13, '#facc15');
      rect(ctx, 13, 20, 6, 6, '#ef4444');
      px(ctx, 15, 22, '#fecaca');
      // Greatblade Hilt over shoulder
      rect(ctx, 24, 7, 3, 18, '#e2e8f0');
      rect(ctx, 23, 10, 5, 2, '#facc15');
    },
  });

  // 4. High Captain Vaelen (Lantern District Templar)
  sprites.npcPortraits.solariCaptainNpc = createBustPortrait({
    border: '#facc15',
    bg: '#18182e',
    bustDraw(ctx) {
      // Templar Helm Crest
      rect(ctx, 13, 4, 6, 3, '#facc15');
      rect(ctx, 10, 7, 12, 6, '#64748b');
      // Face
      rect(ctx, 11, 10, 10, 8, '#fed7aa');
      px(ctx, 13, 13, '#0284c7');
      px(ctx, 18, 13, '#0284c7');
      // Polished Silver Plate & Scarlet Sash
      rect(ctx, 7, 18, 18, 12, '#475569');
      rect(ctx, 9, 19, 14, 11, '#94a3b8');
      rect(ctx, 11, 19, 4, 11, '#dc2626'); // Scarlet ribbon
      // Dawnfire Lantern
      rect(ctx, 24, 14, 5, 8, '#b45309');
      rect(ctx, 25, 16, 3, 5, '#fde047');
      px(ctx, 26, 17, '#ffffff');
    },
  });

  // 5. Pyremaster Lucian (Sunken Vault Flamekeeper)
  sprites.npcPortraits.solariFlamekeeperNpc = createBustPortrait({
    border: '#f59e0b',
    bg: '#241208',
    bustDraw(ctx) {
      // Sunburst Mask Crown
      rect(ctx, 11, 3, 10, 3, '#fde047');
      px(ctx, 13, 2, '#fde047');
      px(ctx, 18, 2, '#fde047');
      rect(ctx, 9, 6, 14, 9, '#f59e0b');
      rect(ctx, 11, 8, 10, 6, '#fef08a');
      px(ctx, 13, 10, '#b45309');
      px(ctx, 18, 10, '#b45309');
      // Ceremonial White Pyre Vestments
      rect(ctx, 7, 17, 18, 13, '#f8fafc');
      rect(ctx, 10, 18, 12, 12, '#fef08a');
      rect(ctx, 8, 27, 16, 3, '#ea580c'); // Flame trim
      // Hovering Sacred Flame Sphere
      rect(ctx, 22, 10, 7, 7, '#f97316');
      rect(ctx, 23, 11, 5, 5, '#fef08a');
      px(ctx, 25, 13, '#ffffff');
    },
  });

  // 6. Shadow Broker Nyx (Duskveil Whisperer)
  sprites.npcPortraits.shadowBrokerNpc = createBustPortrait({
    border: '#c084fc',
    bg: '#140a20',
    bustDraw(ctx) {
      // Shadow Mantle Hood
      rect(ctx, 8, 6, 16, 8, '#1e1b4b');
      rect(ctx, 10, 7, 12, 6, '#0f172a');
      // Face with Domino Mask
      rect(ctx, 11, 11, 10, 8, '#fed7aa');
      rect(ctx, 11, 12, 10, 4, '#020617'); // Dark Mask
      px(ctx, 12, 13, '#f43f5e'); // Glowing Magenta Slit Eyes
      px(ctx, 13, 13, '#fb7185');
      px(ctx, 17, 13, '#fb7185');
      px(ctx, 18, 13, '#f43f5e');
      // Dark Leather Cuirass
      rect(ctx, 7, 19, 18, 11, '#1e1b4b');
      rect(ctx, 10, 20, 12, 10, '#3b0764');
      // Poisoned Dagger over shoulder
      rect(ctx, 24, 7, 2, 10, '#94a3b8');
      px(ctx, 24, 6, '#a855f7');
    },
  });

  // 7. Wraithmother Vespera (Weaver of Graveglass)
  sprites.npcPortraits.shadowWraithmotherNpc = createBustPortrait({
    border: '#a855f7',
    bg: '#0f0518',
    bustDraw(ctx) {
      // Ethereal Mist Horns
      rect(ctx, 6, 3, 4, 6, '#7e22ce');
      rect(ctx, 22, 3, 4, 6, '#7e22ce');
      // Ragged Shadow Shroud
      rect(ctx, 8, 7, 16, 10, '#2e1065');
      rect(ctx, 10, 8, 12, 8, '#0f172a');
      // Glowing Red Void Eyes
      rect(ctx, 12, 12, 3, 2, '#ef4444');
      rect(ctx, 17, 12, 3, 2, '#ef4444');
      // Floating Spectral Robes
      rect(ctx, 7, 18, 18, 12, '#1e1b4b');
      rect(ctx, 9, 19, 14, 11, '#3b0764');
      // Soul Skull Lantern
      rect(ctx, 23, 14, 6, 8, '#581c87');
      rect(ctx, 24, 16, 4, 5, '#f472b6');
      px(ctx, 25, 17, '#ffffff');
    },
  });

  // 8. Grove Tender Rowan (Rootdeep Herbalist)
  sprites.npcPortraits.terraHerbalistNpc = createBustPortrait({
    border: '#4ade80',
    bg: '#082012',
    bustDraw(ctx) {
      // Blossom Garland Crown
      rect(ctx, 9, 5, 14, 3, '#facc15');
      px(ctx, 10, 4, '#ef4444');
      px(ctx, 15, 4, '#f97316');
      px(ctx, 20, 4, '#ef4444');
      // Chestnut Hair & Kind Face
      rect(ctx, 10, 8, 12, 4, '#78350f');
      rect(ctx, 11, 11, 10, 8, '#fed7aa');
      px(ctx, 13, 14, '#15803d'); // Leaf green eyes
      px(ctx, 18, 14, '#15803d');
      // Living Flora Tunic
      rect(ctx, 7, 19, 18, 11, '#15803d');
      rect(ctx, 9, 20, 14, 10, '#22c55e');
      rect(ctx, 12, 21, 8, 8, '#4ade80');
      // Sprouting Glimmer Herbs in shoulder pack
      rect(ctx, 4, 11, 4, 7, '#92400e');
      rect(ctx, 4, 8, 3, 4, '#fde047');
    },
  });

  // 9. Elder Druid Sylvanus (Voice of Ironbark)
  sprites.npcPortraits.terraElderDruidNpc = createBustPortrait({
    border: '#22c55e',
    bg: '#051b0f',
    bustDraw(ctx) {
      // Magnificent Branching Stag Antlers
      rect(ctx, 4, 2, 4, 7, '#84cc16');
      rect(ctx, 24, 2, 4, 7, '#84cc16');
      px(ctx, 3, 5, '#86efac'); // Glowing runestone
      px(ctx, 28, 5, '#86efac');
      // Weathered Elder Face & Mossy Beard
      rect(ctx, 10, 7, 12, 6, '#451a03');
      rect(ctx, 11, 9, 10, 7, '#dcfce7');
      px(ctx, 13, 12, '#15803d');
      px(ctx, 18, 12, '#15803d');
      rect(ctx, 11, 16, 10, 5, '#16a34a'); // Leafy green beard
      // Petrified Bark Shoulders
      rect(ctx, 6, 20, 20, 10, '#14532d');
      rect(ctx, 8, 21, 16, 9, '#166534');
      // Sprouting Staff Top
      rect(ctx, 25, 8, 3, 20, '#78350f');
      rect(ctx, 24, 5, 5, 4, '#22c55e');
      px(ctx, 26, 6, '#fde047');
    },
  });

  // 10. Astromancer Kaelen (Mirrorgate Stargazer)
  sprites.npcPortraits.aetherAstromancerNpc = createBustPortrait({
    border: '#38bdf8',
    bg: '#071a2b',
    bustDraw(ctx) {
      // Midnight Hood with Lunar Brooch
      rect(ctx, 8, 5, 16, 9, '#082f49');
      rect(ctx, 10, 6, 12, 7, '#0c4a6e');
      rect(ctx, 14, 4, 4, 3, '#bae6fd'); // Silver Crescent
      // Face
      rect(ctx, 11, 11, 10, 8, '#e0f2fe');
      px(ctx, 13, 14, '#0284c7');
      px(ctx, 18, 14, '#0284c7');
      // Starlight Robes
      rect(ctx, 7, 19, 18, 11, '#0c4a6e');
      rect(ctx, 9, 20, 14, 10, '#0284c7');
      px(ctx, 10, 22, '#ffffff'); // Star constellation
      px(ctx, 15, 25, '#ffffff');
      px(ctx, 20, 23, '#ffffff');
      // Floating Celestial Astrolabe Ring
      rect(ctx, 23, 9, 6, 6, '#ca8a04');
      rect(ctx, 24, 10, 4, 4, '#38bdf8');
      px(ctx, 25, 11, '#ffffff');
    },
  });

  // 11. Chronos Sage Zephyr (Chronocore Archon)
  sprites.npcPortraits.aetherChronosNpc = createBustPortrait({
    border: '#0ea5e9',
    bg: '#041624',
    bustDraw(ctx) {
      // Spinning Temporal Dial Rings
      rect(ctx, 6, 3, 20, 2, '#38bdf8');
      rect(ctx, 8, 1, 16, 2, '#7dd3fc');
      px(ctx, 16, 0, '#ffffff');
      // Luminous Ethereal Head
      rect(ctx, 9, 7, 14, 8, '#082f49');
      rect(ctx, 11, 9, 10, 7, '#f0f9ff');
      px(ctx, 13, 12, '#38bdf8'); // Pure radiant eyes
      px(ctx, 18, 12, '#38bdf8');
      // Floating Cosmic Light Robes
      rect(ctx, 7, 18, 18, 12, '#0369a1');
      rect(ctx, 9, 19, 14, 11, '#0ea5e9');
      rect(ctx, 11, 20, 10, 10, '#e0f2fe');
      // Floating Paradox Hourglass
      rect(ctx, 23, 11, 6, 8, '#38bdf8');
      rect(ctx, 24, 12, 4, 6, '#bae6fd');
      px(ctx, 25, 15, '#ffffff');
    },
  });

  // 12. Alchemist Faye (Apothecary & Potions Merchant)
  sprites.npcPortraits.merchantApothecaryNpc = createBustPortrait({
    border: '#38bdf8',
    bg: '#082f49',
    bustDraw(ctx) {
      // Alchemist Cowl & Hood
      rect(ctx, 8, 4, 16, 9, '#0369a1');
      rect(ctx, 10, 5, 12, 7, '#0284c7');
      // Face
      rect(ctx, 11, 10, 10, 8, '#fed7aa');
      px(ctx, 13, 13, '#0369a1');
      px(ctx, 18, 13, '#0369a1');
      // Robes & Herb Satchel Strap
      rect(ctx, 8, 18, 16, 12, '#0c4a6e');
      rect(ctx, 10, 19, 12, 11, '#0284c7');
      rect(ctx, 9, 18, 3, 12, '#78350f'); // Leather strap
      // Glowing Potion Alembic
      rect(ctx, 23, 11, 6, 8, '#cbd5e1');
      rect(ctx, 24, 13, 4, 5, '#ef4444'); // Crimson potion core
      px(ctx, 25, 14, '#fde047');
      px(ctx, 25, 10, '#facc15'); // Cork
    },
  });

  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(22, 26);
    // Teal/Navy Alchemist Robes
    rect(ctx, 6, 9 + bob, 10, 12, '#0369a1');
    rect(ctx, 7, 10 + bob, 8, 10, '#0ea5e9');
    rect(ctx, 7, 3 + bob, 8, 7, '#0284c7');
    rect(ctx, 8, 5 + bob, 6, 5, '#fed7aa');
    px(ctx, 9, 7 + bob, '#0f172a');
    px(ctx, 12, 7 + bob, '#0f172a');
    // Leather Satchel
    rect(ctx, 6, 13 + bob, 3, 5, '#78350f');
    // Holding Glowing Flask
    rect(ctx, 15, 12 + bob, 4, 5, '#ef4444');
    px(ctx, 16, 11 + bob, '#cbd5e1');
    // Boots
    rect(ctx, 7, 21 + bob, 3, 5, '#0f172a');
    rect(ctx, 12, 21 + bob, 3, 5, '#0f172a');
    sprites.merchantApothecaryNpc.push(addPixelOutline(c));
  }

  // 13. Farmer Bran (Provisions & Rations Merchant)
  sprites.npcPortraits.merchantProvisionsNpc = createBustPortrait({
    border: '#4ade80',
    bg: '#14532d',
    bustDraw(ctx) {
      // Wide Brim Straw Hat
      rect(ctx, 4, 5, 24, 3, '#ca8a04');
      rect(ctx, 8, 2, 16, 4, '#eab308');
      rect(ctx, 9, 5, 14, 1, '#78350f'); // Ribbon band
      // Cheerful Face & Straw
      rect(ctx, 10, 8, 12, 9, '#fed7aa');
      px(ctx, 13, 11, '#15803d');
      px(ctx, 18, 11, '#15803d');
      rect(ctx, 12, 15, 5, 1, '#ca8a04'); // Straw stalk
      // Linen Tunic & Apron
      rect(ctx, 7, 17, 18, 13, '#15803d');
      rect(ctx, 10, 18, 12, 12, '#fef08a');
      // Red Apple in Hand
      rect(ctx, 23, 13, 6, 6, '#ef4444');
      px(ctx, 25, 12, '#22c55e'); // Leaf
    },
  });

  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(22, 26);
    // Green Tunic & Leather Breeches
    rect(ctx, 6, 9 + bob, 10, 11, '#15803d');
    rect(ctx, 8, 10 + bob, 6, 9, '#fef08a');
    rect(ctx, 6, 2 + bob, 10, 3, '#ca8a04'); // Straw hat
    rect(ctx, 4, 4 + bob, 14, 2, '#eab308');
    rect(ctx, 7, 6 + bob, 8, 4, '#fed7aa');
    px(ctx, 9, 7 + bob, '#15803d');
    px(ctx, 12, 7 + bob, '#15803d');
    // Basket of Apples
    rect(ctx, 14, 12 + bob, 6, 5, '#ca8a04');
    px(ctx, 16, 11 + bob, '#ef4444');
    px(ctx, 18, 11 + bob, '#22c55e');
    // Boots
    rect(ctx, 7, 20 + bob, 3, 6, '#78350f');
    rect(ctx, 12, 20 + bob, 3, 6, '#78350f');
    sprites.merchantProvisionsNpc.push(addPixelOutline(c));
  }

  // 14. Blacksmith Torvin (Smithing & Ore Wares Merchant)
  sprites.npcPortraits.merchantSmithNpc = createBustPortrait({
    border: '#fb923c',
    bg: '#271206',
    bustDraw(ctx) {
      // Rugged Hair & Headband
      rect(ctx, 9, 3, 14, 5, '#451a03');
      rect(ctx, 9, 7, 14, 2, '#ea580c'); // Red smithing bandana
      // Weathered Face & Thick Beard
      rect(ctx, 10, 9, 12, 6, '#fed7aa');
      px(ctx, 13, 11, '#ea580c');
      px(ctx, 18, 11, '#ea580c');
      px(ctx, 12, 10, '#334155'); // Soot smudge
      rect(ctx, 9, 14, 14, 5, '#291305'); // Full dark beard
      // Leather Smithing Apron over Muscular Shoulders
      rect(ctx, 6, 18, 20, 12, '#78350f');
      rect(ctx, 10, 18, 12, 12, '#451a03');
      // Heavy Forge Hammer Over Shoulder
      rect(ctx, 24, 6, 4, 6, '#475569');
      rect(ctx, 25, 11, 2, 17, '#92400e');
      px(ctx, 25, 7, '#cbd5e1'); // Highlight
    },
  });

  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(24, 26);
    // Dark Brown Apron
    rect(ctx, 6, 9 + bob, 12, 12, '#78350f');
    rect(ctx, 8, 10 + bob, 8, 10, '#451a03');
    rect(ctx, 8, 3 + bob, 8, 4, '#451a03');
    rect(ctx, 8, 6 + bob, 8, 2, '#ea580c'); // Red bandana
    rect(ctx, 9, 7 + bob, 6, 4, '#fed7aa');
    px(ctx, 10, 8 + bob, '#0f172a');
    px(ctx, 13, 8 + bob, '#0f172a');
    rect(ctx, 9, 10 + bob, 6, 3, '#291305'); // Beard
    // Hammer resting over shoulder
    rect(ctx, 18, 5 + bob, 4, 3, '#64748b');
    rect(ctx, 19, 8 + bob, 2, 10, '#92400e');
    // Boots
    rect(ctx, 8, 21 + bob, 3, 5, '#1e293b');
    rect(ctx, 13, 21 + bob, 3, 5, '#1e293b');
    sprites.merchantSmithNpc.push(addPixelOutline(c));
  }

  // 15. Relic-Seeker Moira (Aether Curios & Relics Merchant)
  sprites.npcPortraits.merchantRelicsNpc = createBustPortrait({
    border: '#c084fc',
    bg: '#1e082b',
    bustDraw(ctx) {
      // Velvet Cowl with Golden Circlet
      rect(ctx, 8, 4, 16, 9, '#581c87');
      rect(ctx, 10, 6, 12, 2, '#facc15'); // Gold brow circlet
      px(ctx, 15, 6, '#38bdf8'); // Cyan gem
      // Mystical Face & Glowing Violet Eyes
      rect(ctx, 11, 9, 10, 8, '#fed7aa');
      px(ctx, 13, 12, '#a855f7');
      px(ctx, 18, 12, '#a855f7');
      // Purple Velvet Robe with Gold Trim
      rect(ctx, 8, 18, 16, 12, '#4c1d95');
      rect(ctx, 11, 18, 10, 12, '#7e22ce');
      rect(ctx, 14, 18, 4, 12, '#facc15'); // Gold central stole
      // Glowing Aether Keyston Crystal
      rect(ctx, 23, 11, 6, 8, '#38bdf8');
      rect(ctx, 24, 12, 4, 6, '#7dd3fc');
      px(ctx, 25, 14, '#ffffff'); // Star glint
    },
  });

  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(22, 26);
    // Purple Velvet Robe
    rect(ctx, 6, 9 + bob, 10, 12, '#581c87');
    rect(ctx, 8, 10 + bob, 6, 10, '#7e22ce');
    rect(ctx, 7, 3 + bob, 8, 6, '#4c1d95'); // Hood
    rect(ctx, 8, 5 + bob, 6, 2, '#facc15'); // Circlet
    rect(ctx, 8, 6 + bob, 6, 4, '#fed7aa');
    px(ctx, 9, 7 + bob, '#a855f7');
    px(ctx, 12, 7 + bob, '#a855f7');
    // Glowing floating aether crystal
    rect(ctx, 15, 11 + bob, 4, 5, '#38bdf8');
    px(ctx, 16, 12 + bob, '#ffffff');
    // Boots
    rect(ctx, 7, 21 + bob, 3, 5, '#1e1b4b');
    rect(ctx, 12, 21 + bob, 3, 5, '#1e1b4b');
    sprites.merchantRelicsNpc.push(addPixelOutline(c));
  }

  // Portrait Aliases
  sprites.npcPortraits.shadowNpc = sprites.npcPortraits.shadowBrokerNpc;
  sprites.npcPortraits.druidNpc = sprites.npcPortraits.terraHerbalistNpc;
  sprites.npcPortraits.chronoNpc = sprites.npcPortraits.aetherAstromancerNpc;

}
