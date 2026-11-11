import { makeCanvas, px, rect, addPixelOutline } from "./pixelCanvas.js";

export function buildEntityAndMonsterSprites(sprites) {
  // ==========================================
  // 5. TRAINING DUMMY & GLIMMER NODE
  // ==========================================
  for (let f = 0; f < 2; f++) {
    const tilt = f === 1 ? 1 : 0;
    const { c, ctx } = makeCanvas(24, 26);
    rect(ctx, 10, 17, 4, 8, '#78350f');
    rect(ctx, 7, 23, 10, 2, '#451a03');
    rect(ctx, 4 + tilt, 10, 16, 3, '#92400e');
    rect(ctx, 7 + tilt, 9, 10, 10, '#d97706');
    rect(ctx, 8 + tilt, 10, 8, 8, '#f59e0b');
    rect(ctx, 8 + tilt, 3, 8, 6, '#fbbf24');
    px(ctx, 9 + tilt, 5, '#451a03');
    px(ctx, 10 + tilt, 6, '#451a03');
    px(ctx, 13 + tilt, 5, '#451a03');
    px(ctx, 14 + tilt, 6, '#451a03');
    rect(ctx, 9 + tilt, 11, 6, 6, '#ef4444');
    rect(ctx, 10 + tilt, 12, 4, 4, '#f8fafc');
    rect(ctx, 11 + tilt, 13, 2, 2, '#ef4444');
    sprites.dummy.push(addPixelOutline(c));
  }

  for (let f = 0; f < 3; f++) {
    const hover = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(24, 30);
    rect(ctx, 5, 24, 14, 4, '#334155');
    rect(ctx, 7, 22, 10, 3, '#475569');
    rect(ctx, 10, 4 + hover, 4, 16, '#9333ea');
    rect(ctx, 8, 7 + hover, 8, 11, '#a855f7');
    rect(ctx, 9, 8 + hover, 4, 9, '#d8b4fe');
    rect(ctx, 10, 6 + hover, 2, 6, '#ffffff');
    rect(ctx, 4, 13, 3, 6, '#7e22ce');
    rect(ctx, 17, 12, 3, 6, '#7e22ce');
    sprites.node.push(addPixelOutline(c));
  }
  {
    const { c, ctx } = makeCanvas(24, 30);
    rect(ctx, 5, 24, 14, 4, '#1e293b');
    rect(ctx, 8, 12, 8, 10, '#334155');
    rect(ctx, 10, 9, 4, 12, '#475569');
    sprites.nodeEmpty = addPixelOutline(c);
  }

  // Grand Fonts use a 3x nearest-neighbour scale so their pixel art stays crisp.
  const scaleNodeFrame = (frame, scale = 3) => {
    const { c, ctx } = makeCanvas(frame.width * scale, frame.height * scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, 0, 0, c.width, c.height);
    return c;
  };
  sprites.grandNode = sprites.node.map((frame) => scaleNodeFrame(frame));
  sprites.grandNodeEmpty = scaleNodeFrame(sprites.nodeEmpty);

  // World Skilling Ore Veins, Herb Clusters & Luminescent Fiber Blooms
  const buildOreVein = (crystalDark, crystalMid, crystalHi) => {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const glint = f === 1 ? -1 : 0;
      const { c, ctx } = makeCanvas(24, 26);
      rect(ctx, 3, 14, 18, 9, '#1e293b');
      rect(ctx, 5, 10, 14, 11, '#334155');
      rect(ctx, 7, 8, 10, 9, '#475569');
      // Protruding ore seams & mineral crystals
      rect(ctx, 6, 11, 4, 6, crystalDark);
      rect(ctx, 7, 10, 3, 5, crystalMid);
      rect(ctx, 13, 7 + glint, 5, 8, crystalDark);
      rect(ctx, 14, 6 + glint, 3, 7, crystalMid);
      px(ctx, 15, 7 + glint, crystalHi);
      px(ctx, 8, 11, crystalHi);
      frames.push(addPixelOutline(c));
    }
    return frames;
  };
  sprites.oreCopper = buildOreVein('#9a3412', '#f97316', '#fed7aa');
  sprites.oreIron = buildOreVein('#374151', '#94a3b8', '#e0f2fe');
  sprites.oreMithril = buildOreVein('#1e3a8a', '#38bdf8', '#ffffff');
  sprites.oreRunite = buildOreVein('#065f46', '#2dd4bf', '#f0abfc');
  {
    const { c, ctx } = makeCanvas(24, 26);
    rect(ctx, 3, 15, 18, 8, '#1e293b');
    rect(ctx, 6, 12, 12, 9, '#334155');
    rect(ctx, 8, 14, 8, 5, '#475569');
    sprites.oreEmpty = addPixelOutline(c);
  }

  sprites.herbNode = [];
  for (let f = 0; f < 2; f++) {
    const sway = f === 1 ? 1 : 0;
    const { c, ctx } = makeCanvas(22, 24);
    rect(ctx, 4, 17, 14, 4, '#14532d');
    rect(ctx, 6, 13, 10, 6, '#15803d');
    rect(ctx, 5 + sway, 10, 4, 5, '#22c55e');
    rect(ctx, 12 + sway, 9, 5, 6, '#22c55e');
    // Glowing Sunbloom & Chrono-Lotus petals
    rect(ctx, 6 + sway, 7, 4, 4, '#facc15');
    px(ctx, 7 + sway, 8, '#ffffff');
    rect(ctx, 13 + sway, 6, 4, 4, '#c084fc');
    px(ctx, 14 + sway, 7, '#bae6fd');
    sprites.herbNode.push(addPixelOutline(c));
  }
  {
    const { c, ctx } = makeCanvas(22, 24);
    rect(ctx, 5, 18, 12, 3, '#14532d');
    rect(ctx, 8, 16, 6, 3, '#166534');
    sprites.herbEmpty = addPixelOutline(c);
  }

  sprites.fiberNode = [];
  for (let f = 0; f < 2; f++) {
    const sway = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(22, 24);
    rect(ctx, 5, 17, 12, 4, '#1e293b');
    rect(ctx, 7, 11, 2, 8, '#16a34a');
    rect(ctx, 11, 9, 2, 10, '#16a34a');
    rect(ctx, 14, 12, 2, 7, '#16a34a');
    // Silky silver-cyan Starlight Flax plumes
    rect(ctx, 5 + sway, 7, 4, 5, '#bae6fd');
    rect(ctx, 10 + sway, 5, 4, 5, '#e0f2fe');
    rect(ctx, 13 + sway, 8, 4, 5, '#ddd6fe');
    px(ctx, 11 + sway, 6, '#ffffff');
    sprites.fiberNode.push(addPixelOutline(c));
  }
  {
    const { c, ctx } = makeCanvas(22, 24);
    rect(ctx, 6, 18, 10, 3, '#1e293b');
    rect(ctx, 8, 15, 6, 3, '#334155');
    sprites.fiberEmpty = addPixelOutline(c);
  }

  // ==========================================
  // RUNESCAPE SKILLING: ARBOREAL TIMBERCRAFT & COSMIC ANGLING SPRITES
  // ==========================================
  const buildTreeNode = (trunkDark, trunkMid, leafDark, leafMid, leafHi, fruitColor) => {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const sway = f === 1 ? 1 : 0;
      const { c, ctx } = makeCanvas(28, 32);
      // Sturdy trunk & roots
      rect(ctx, 11, 18, 6, 12, trunkDark);
      rect(ctx, 12, 19, 4, 10, trunkMid);
      rect(ctx, 8, 28, 4, 3, trunkDark);
      rect(ctx, 16, 28, 4, 3, trunkDark);
      // Lush foliage crown with gentle leaf sway
      rect(ctx, 5 + sway, 10, 18, 10, leafDark);
      rect(ctx, 7 + sway, 6, 14, 12, leafMid);
      rect(ctx, 10 + sway, 4, 8, 6, leafHi);
      // Ambient glints or fruit
      if (fruitColor) {
        px(ctx, 8 + sway, 9, fruitColor);
        px(ctx, 18 + sway, 12, fruitColor);
        px(ctx, 13 + sway, 7, '#ffffff');
      }
      frames.push(addPixelOutline(c));
    }
    return frames;
  };
  sprites.treeGlimmerwood = buildTreeNode('#451a03', '#78350f', '#14532d', '#16a34a', '#4ade80', '#fde047');
  sprites.treeIronbark = buildTreeNode('#1c1917', '#44403c', '#15803d', '#166534', '#86efac', '#a16207');
  sprites.treeDuskveil = buildTreeNode('#1e1b4b', '#312e81', '#3b0764', '#7e22ce', '#c084fc', '#e879f9');
  sprites.treeSunforged = buildTreeNode('#78350f', '#b45309', '#a16207', '#d97706', '#facc15', '#ffffff');
  sprites.treeStarlight = buildTreeNode('#0f172a', '#1e293b', '#0369a1', '#0284c7', '#38bdf8', '#ffffff');
  {
    const { c, ctx } = makeCanvas(28, 32);
    // Tree stump with cut axe ring
    rect(ctx, 9, 22, 10, 8, '#451a03');
    rect(ctx, 10, 20, 8, 4, '#78350f');
    rect(ctx, 12, 21, 4, 2, '#d97706');
    sprites.treeEmpty = addPixelOutline(c);
  }

  const buildFishingSpot = (waterDark, waterMid, rippleColor, fishGlint) => {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const glint = f === 1 ? 1 : -1;
      const { c, ctx } = makeCanvas(26, 24);
      // Swirling tidal pool ripple rings
      rect(ctx, 3, 11, 20, 8, waterDark);
      rect(ctx, 5, 12, 16, 6, waterMid);
      rect(ctx, 8 + glint, 13, 10, 4, rippleColor);
      // Leaping / glistening minnow
      rect(ctx, 11 - glint, 8 + glint, 4, 3, fishGlint);
      px(ctx, 14 - glint, 9 + glint, '#ffffff');
      frames.push(addPixelOutline(c));
    }
    return frames;
  };
  sprites.fishShallows = buildFishingSpot('#0c4a6e', '#0284c7', '#38bdf8', '#bae6fd');
  sprites.fishRiver = buildFishingSpot('#1e3a8a', '#2563eb', '#60a5fa', '#fde047');
  sprites.fishReef = buildFishingSpot('#0f766e', '#0d9488', '#2dd4bf', '#f472b6');
  sprites.fishAbyss = buildFishingSpot('#1e1b4b', '#312e81', '#6366f1', '#c084fc');
  sprites.fishCelestial = buildFishingSpot('#0369a1', '#0ea5e9', '#7dd3fc', '#facc15');
  {
    const { c, ctx } = makeCanvas(26, 24);
    rect(ctx, 4, 12, 18, 6, '#0f172a');
    rect(ctx, 6, 13, 14, 4, '#1e293b');
    sprites.fishEmpty = addPixelOutline(c);
  }

  // ==========================================
  // 6. CALM ASTRAL WAYGATE PORTAL (Smooth, Zero Strobe!)
  // ==========================================
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(32, 36);
    rect(ctx, 4, 31, 24, 4, '#334155');
    rect(ctx, 6, 29, 20, 3, '#475569');
    rect(ctx, 6, 6, 20, 24, '#0369a1');
    rect(ctx, 8, 4, 16, 26, '#38bdf8');
    rect(ctx, 9, 7, 14, 21, '#1e1b4b');
    rect(ctx, 11, 9, 10, 17, '#312e81');
    rect(ctx, 13, 12 + f, 6, 10, '#0ea5e9');
    rect(ctx, 14, 14 + f, 4, 6, '#bae6fd');
    sprites.portal.push(addPixelOutline(c));
  }

  // ==========================================
  // 7. NEXUS MONOLITHS & SHATTERED NEXUS SIEGE SHARD
  // ==========================================
  const buildNexusFrames = (outer, mid, core, spark) => {
    const arr = [];
    for (let f = 0; f < 3; f++) {
      const hover = f === 1 ? -1 : 0;
      const { c, ctx } = makeCanvas(40, 48);
      rect(ctx, 6, 40, 28, 6, '#1e293b');
      rect(ctx, 9, 36, 22, 5, '#334155');
      rect(ctx, 12, 34, 16, 3, outer);
      rect(ctx, 17, 4 + hover, 6, 28, outer);
      rect(ctx, 14, 8 + hover, 12, 21, outer);
      rect(ctx, 12, 12 + hover, 16, 13, mid);
      rect(ctx, 15, 10 + hover, 10, 17, mid);
      rect(ctx, 17, 14 + hover, 6, 9, core);
      rect(ctx, 18, 16 + hover, 4, 5, '#ffffff');
      rect(ctx, 5, 16 - hover, 4, 10, outer);
      rect(ctx, 6, 18 - hover, 2, 6, core);
      rect(ctx, 31, 16 - hover, 4, 10, outer);
      rect(ctx, 32, 18 - hover, 2, 6, core);
      px(ctx, 10, 19, spark);
      px(ctx, 29, 19, spark);
      arr.push(addPixelOutline(c));
    }
    return arr;
  };
  sprites.nexusCyan = buildNexusFrames('#0369a1', '#0ea5e9', '#7dd3fc', '#38bdf8');
  sprites.nexusBlue = buildNexusFrames('#1d4ed8', '#3b82f6', '#93c5fd', '#38bdf8');
  sprites.nexusRed = buildNexusFrames('#991b1b', '#ef4444', '#fca5a5', '#fb923c');
  sprites.nexusGold = buildNexusFrames('#b45309', '#eab308', '#fef08a', '#ffffff');
  sprites.nexusPurple = buildNexusFrames('#581c87', '#9333ea', '#e9d5ff', '#f43f5e');
  sprites.nexusGreen = buildNexusFrames('#14532d', '#16a34a', '#86efac', '#fde047');

  // Shattered Nexus Shard (Warzone Siege Objective — Prismatic 4-Faction Crystal!)
  for (let f = 0; f < 3; f++) {
    const hover = f === 1 ? -2 : 0;
    const { c, ctx } = makeCanvas(44, 50);
    rect(ctx, 8, 42, 28, 6, '#1e293b');
    rect(ctx, 12, 38, 20, 5, '#475569');
    // Central Prismatic Crystal
    rect(ctx, 18, 3 + hover, 8, 32, '#eab308');
    rect(ctx, 15, 9 + hover, 14, 22, '#a855f7');
    rect(ctx, 17, 11 + hover, 10, 18, '#38bdf8');
    rect(ctx, 19, 13 + hover, 6, 14, '#ffffff');
    // 4 Faction Satellite Shards
    rect(ctx, 6, 15 - hover, 5, 11, '#facc15');
    rect(ctx, 33, 15 - hover, 5, 11, '#c084fc');
    rect(ctx, 10, 28 + hover, 4, 8, '#4ade80');
    rect(ctx, 30, 28 + hover, 4, 8, '#38bdf8');
    sprites.siegeShard.push(addPixelOutline(c));
  }

  // ==========================================
  // 8. BIOME MOBS & 4 FACTION DUNGEON BOSSES
  // ==========================================
  // Umbri Void Stalker & Duskblade Fiend
  for (let f = 0; f < 3; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 28);
    rect(ctx, 8, 18, 3, 6, '#3b0764');
    rect(ctx, 13, 19, 3, 6, '#3b0764');
    rect(ctx, 18, 18, 3, 6, '#3b0764');
    rect(ctx, 7, 9 + bob, 14, 11, '#581c87');
    rect(ctx, 9, 10 + bob, 10, 9, '#7e22ce');
    rect(ctx, 8, 4 + bob, 12, 8, '#3b0764');
    rect(ctx, 5, 2 + bob, 3, 4, '#a855f7');
    rect(ctx, 20, 2 + bob, 3, 4, '#a855f7');
    rect(ctx, 10, 7 + bob, 3, 2, '#f43f5e');
    rect(ctx, 15, 7 + bob, 3, 2, '#f43f5e');
    rect(ctx, 2, 11 + bob, 5, 3, '#c084fc');
    rect(ctx, 21, 11 + bob, 5, 3, '#c084fc');
    sprites.voidStalker.push(addPixelOutline(c));
  }

  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(24, 26);
    rect(ctx, 8, 20, 3, 4, '#450a0a');
    rect(ctx, 13, 20, 3, 4, '#450a0a');
    rect(ctx, 7, 10 + bob, 10, 10, '#7f1d1d');
    rect(ctx, 8, 11 + bob, 8, 8, '#dc2626');
    rect(ctx, 8, 4 + bob, 8, 7, '#1e1b4b');
    rect(ctx, 9, 7 + bob, 2, 2, '#fde047');
    rect(ctx, 13, 7 + bob, 2, 2, '#fde047');
    rect(ctx, 3, 12 + bob, 4, 2, '#f87171');
    rect(ctx, 17, 12 + bob, 4, 2, '#f87171');
    sprites.duskFiend.push(addPixelOutline(c));
  }

  // Solari Biome Mob (Sunforged Automaton)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    rect(ctx, 8, 20, 4, 6, '#92400e');
    rect(ctx, 14, 20, 4, 6, '#92400e');
    rect(ctx, 6, 9 + bob, 14, 12, '#d97706');
    rect(ctx, 8, 10 + bob, 10, 9, '#facc15');
    rect(ctx, 8, 3 + bob, 10, 7, '#eab308');
    rect(ctx, 10, 6 + bob, 6, 2, '#38bdf8');
    rect(ctx, 21, 5 + bob, 2, 16, '#fef08a');
    sprites.mobSolari.push(addPixelOutline(c));
  }

  // Terra Biome Mob (Briarback Beast)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 26);
    rect(ctx, 6, 19, 4, 5, '#422006');
    rect(ctx, 18, 19, 4, 5, '#422006');
    rect(ctx, 5, 9 + bob, 18, 11, '#365314');
    rect(ctx, 7, 10 + bob, 14, 8, '#16a34a');
    rect(ctx, 9, 5 + bob, 10, 5, '#4ade80');
    rect(ctx, 9, 12 + bob, 3, 2, '#fde047');
    rect(ctx, 16, 12 + bob, 3, 2, '#fde047');
    sprites.mobTerra.push(addPixelOutline(c));
  }

  // Aether Biome Mob (Continuum Wraith)
  for (let f = 0; f < 2; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    rect(ctx, 8, 9 + bob, 10, 14, '#0369a1');
    rect(ctx, 9, 10 + bob, 8, 11, '#38bdf8');
    rect(ctx, 8, 3 + bob, 10, 7, '#1e3a8a');
    rect(ctx, 10, 6 + bob, 2, 2, '#ffffff');
    rect(ctx, 14, 6 + bob, 2, 2, '#ffffff');
    rect(ctx, 3, 10 - bob, 4, 8, '#7dd3fc');
    rect(ctx, 19, 10 - bob, 4, 8, '#7dd3fc');
    sprites.mobAether.push(addPixelOutline(c));
  }

  // Boss Maker Helper (40x40 Colossal Dungeon Bosses)
  const buildColossusBoss = (dark, mid, core, eye) => {
    const arr = [];
    for (let f = 0; f < 3; f++) {
      const stompL = f === 1 ? -2 : 0;
      const stompR = f === 2 ? -2 : 0;
      const bob = f === 0 ? 0 : 1;
      const { c, ctx } = makeCanvas(40, 40);
      rect(ctx, 9, 29 + stompL, 8, 9, dark);
      rect(ctx, 23, 29 + stompR, 8, 9, dark);
      rect(ctx, 8, 10 + bob, 24, 20, dark);
      rect(ctx, 10, 12 + bob, 20, 16, mid);
      rect(ctx, 16, 17 + bob, 8, 8, core);
      rect(ctx, 18, 19 + bob, 4, 4, '#ffffff');
      rect(ctx, 14, 3 + bob, 12, 9, dark);
      rect(ctx, 15, 4 + bob, 10, 6, mid);
      rect(ctx, 16, 7 + bob, 3, 2, eye);
      rect(ctx, 21, 7 + bob, 3, 2, eye);
      rect(ctx, 1, 14 + bob - stompL, 8, 13, dark);
      rect(ctx, 31, 14 + bob - stompR, 8, 13, dark);
      arr.push(addPixelOutline(c));
    }
    return arr;
  };

  sprites.graniteBoss = buildColossusBoss('#334155', '#4ade80', '#f59e0b', '#fde047'); // Terra Boss
  sprites.bossSolari = buildColossusBoss('#92400e', '#facc15', '#fb923c', '#38bdf8');  // Sunfire Colossus
  sprites.bossUmbri = buildColossusBoss('#3b0764', '#9333ea', '#f43f5e', '#fde047');   // Crypt Lord Malakor
  sprites.bossAether = buildColossusBoss('#1e3a8a', '#38bdf8', '#c084fc', '#ffffff');  // Rift Titan
  sprites.celestialTitanBoss = buildColossusBoss('#1e1b4b', '#facc15', '#ffffff', '#38bdf8'); // Empyrean Sovereign
  sprites.starfallBoss = buildColossusBoss('#431407', '#fb923c', '#38bdf8', '#fde047'); // Ignis-Core, Fallen Star Construct
  sprites.abyssalArchitectBoss = buildColossusBoss('#1e1b4b', '#c084fc', '#2dd4bf', '#ffffff'); // Xal'Korath, Rift-Weaver

  // Dedicated Pixel Art Mobs: Void Annihilator (mobUmbri), Starforged Automaton, Meteor Elemental, Gloam-Widow & Paradox Sentinel
  sprites.mobUmbri = [];
  for (let f = 0; f < 3; f++) {
    const hover = f === 1 ? -2 : f === 2 ? 1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    rect(ctx, 7, 9 + hover, 12, 13, '#2e1065');
    rect(ctx, 9, 10 + hover, 8, 10, '#581c87');
    rect(ctx, 8, 3 + hover, 10, 7, '#1e1b4b');
    rect(ctx, 10, 6 + hover, 2, 2, '#f43f5e');
    rect(ctx, 14, 6 + hover, 2, 2, '#f43f5e');
    // Twin void scythe-claws
    rect(ctx, 2, 10 + hover, 5, 3, '#a855f7');
    rect(ctx, 1, 12 + hover, 3, 6, '#e879f9');
    rect(ctx, 19, 10 + hover, 5, 3, '#a855f7');
    rect(ctx, 22, 12 + hover, 3, 6, '#e879f9');
    rect(ctx, 9, 22 + hover, 3, 4, '#4c1d95');
    rect(ctx, 14, 22 + hover, 3, 4, '#4c1d95');
    sprites.mobUmbri.push(addPixelOutline(c));
  }

  sprites.starforgedAutomaton = [];
  for (let f = 0; f < 3; f++) {
    const step = f === 1 ? -1 : f === 2 ? 1 : 0;
    const { c, ctx } = makeCanvas(28, 30);
    rect(ctx, 7, 21 + step, 5, 7, '#475569');
    rect(ctx, 16, 21 - step, 5, 7, '#475569');
    rect(ctx, 6, 9, 16, 13, '#78350f');
    rect(ctx, 8, 11, 12, 9, '#d97706');
    // Glowing cyan star-core chest
    rect(ctx, 11, 13, 6, 5, '#0284c7');
    rect(ctx, 12, 14, 4, 3, '#bae6fd');
    rect(ctx, 9, 3, 10, 7, '#92400e');
    rect(ctx, 11, 5, 6, 2, '#38bdf8');
    rect(ctx, 2, 11 - step, 4, 10, '#64748b');
    rect(ctx, 22, 11 + step, 4, 10, '#64748b');
    sprites.starforgedAutomaton.push(addPixelOutline(c));
  }

  sprites.meteorElemental = [];
  for (let f = 0; f < 3; f++) {
    const pulse = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 28);
    rect(ctx, 6, 6 + pulse, 16, 16, '#271b12');
    rect(ctx, 8, 8 + pulse, 12, 12, '#7c2d12');
    rect(ctx, 10, 10 + pulse, 8, 8, '#f97316');
    rect(ctx, 12, 12 + pulse, 4, 4, '#fde047');
    px(ctx, 10, 9 + pulse, '#ffffff');
    px(ctx, 16, 9 + pulse, '#ffffff');
    // Orbiting meteor shards
    rect(ctx, 2, 11 - pulse, 3, 5, '#ea580c');
    rect(ctx, 23, 11 + pulse, 3, 5, '#38bdf8');
    sprites.meteorElemental.push(addPixelOutline(c));
  }

  sprites.gloamWidow = [];
  for (let f = 0; f < 3; f++) {
    const skitter = f === 1 ? 1 : f === 2 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 24);
    // Abdomen & thorax
    rect(ctx, 8, 6, 12, 9, '#3b0764');
    rect(ctx, 10, 7, 8, 6, '#6b21a8');
    rect(ctx, 12, 8, 4, 3, '#c084fc');
    rect(ctx, 9, 13, 10, 6, '#1e1b4b');
    // Glowing violet arachnid eyes
    px(ctx, 11, 16, '#f43f5e');
    px(ctx, 13, 17, '#e879f9');
    px(ctx, 15, 17, '#e879f9');
    px(ctx, 17, 16, '#f43f5e');
    // 8 jointed legs
    rect(ctx, 3, 9 + skitter, 5, 2, '#4c1d95');
    rect(ctx, 2, 13 - skitter, 6, 2, '#4c1d95');
    rect(ctx, 3, 17 + skitter, 5, 2, '#4c1d95');
    rect(ctx, 20, 9 - skitter, 5, 2, '#4c1d95');
    rect(ctx, 20, 13 + skitter, 6, 2, '#4c1d95');
    rect(ctx, 20, 17 - skitter, 5, 2, '#4c1d95');
    sprites.gloamWidow.push(addPixelOutline(c));
  }

  sprites.paradoxSentinel = [];
  for (let f = 0; f < 3; f++) {
    const wing = f === 1 ? -2 : 0;
    const { c, ctx } = makeCanvas(30, 30);
    // Astral wings
    rect(ctx, 2, 6 + wing, 7, 12, '#0284c7');
    rect(ctx, 4, 8 + wing, 4, 8, '#7dd3fc');
    rect(ctx, 21, 6 + wing, 7, 12, '#7e22ce');
    rect(ctx, 22, 8 + wing, 4, 8, '#e879f9');
    // Armored rift knight body
    rect(ctx, 10, 9, 10, 12, '#1e1b4b');
    rect(ctx, 11, 10, 8, 9, '#312e81');
    rect(ctx, 13, 12, 4, 5, '#2dd4bf');
    rect(ctx, 11, 3, 8, 6, '#0f172a');
    rect(ctx, 12, 5, 6, 2, '#5eead4');
    rect(ctx, 11, 21, 3, 6, '#1e293b');
    rect(ctx, 16, 21, 3, 6, '#1e293b');
    sprites.paradoxSentinel.push(addPixelOutline(c));
  }

  // --- IRONWOOD TIMBERLANDS & CORAL COAST MOBS & BOSSES ---
  sprites.treantSapling = [];
  for (let f = 0; f < 3; f++) {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(24, 26);
    rect(ctx, 8, 10 + bob, 8, 12, '#451a03');
    rect(ctx, 9, 12 + bob, 6, 8, '#78350f');
    // Foliage cap
    rect(ctx, 6, 4 + bob, 12, 8, '#15803d');
    rect(ctx, 8, 2 + bob, 8, 4, '#4ade80');
    // Glowing amber eyes
    px(ctx, 9, 13 + bob, '#facc15');
    px(ctx, 14, 13 + bob, '#facc15');
    // Wooden root legs
    rect(ctx, 8, 22, 3, 4, '#271202');
    rect(ctx, 13, 22, 3, 4, '#271202');
    sprites.treantSapling.push(addPixelOutline(c));
  }

  sprites.ironbarkTreant = [];
  for (let f = 0; f < 3; f++) {
    const stomp = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 30);
    rect(ctx, 8, 10 + stomp, 12, 14, '#1c1917');
    rect(ctx, 10, 12 + stomp, 8, 10, '#44403c');
    rect(ctx, 6, 3 + stomp, 16, 9, '#166534');
    rect(ctx, 9, 1 + stomp, 10, 4, '#86efac');
    px(ctx, 10, 14 + stomp, '#4ade80');
    px(ctx, 16, 14 + stomp, '#4ade80');
    rect(ctx, 7, 24, 4, 5, '#0c0a09');
    rect(ctx, 16, 24, 4, 5, '#0c0a09');
    sprites.ironbarkTreant.push(addPixelOutline(c));
  }

  sprites.elderBarkhide = [];
  for (let f = 0; f < 3; f++) {
    const breathe = f === 1 ? -2 : 0;
    const { c, ctx } = makeCanvas(36, 40);
    rect(ctx, 10, 12 + breathe, 16, 20, '#1c1917');
    rect(ctx, 12, 14 + breathe, 12, 16, '#292524');
    rect(ctx, 6, 2 + breathe, 24, 12, '#14532d');
    rect(ctx, 9, 0 + breathe, 18, 5, '#22c55e');
    px(ctx, 13, 16 + breathe, '#facc15');
    px(ctx, 21, 16 + breathe, '#facc15');
    rect(ctx, 9, 32, 6, 7, '#0c0a09');
    rect(ctx, 21, 32, 6, 7, '#0c0a09');
    sprites.elderBarkhide.push(addPixelOutline(c));
  }

  sprites.brineCrawler = [];
  for (let f = 0; f < 3; f++) {
    const scuttle = f === 1 ? 1 : 0;
    const { c, ctx } = makeCanvas(26, 24);
    rect(ctx, 6, 8, 14, 10, '#0284c7');
    rect(ctx, 8, 9, 10, 8, '#0ea5e9');
    // Crab pincers
    rect(ctx, 2, 6 + scuttle, 4, 5, '#38bdf8');
    rect(ctx, 20, 6 - scuttle, 4, 5, '#38bdf8');
    // Eyes
    px(ctx, 9, 7, '#ffffff');
    px(ctx, 16, 7, '#ffffff');
    // Legs
    rect(ctx, 4, 18, 3, 4, '#0369a1');
    rect(ctx, 19, 18, 3, 4, '#0369a1');
    sprites.brineCrawler.push(addPixelOutline(c));
  }

  sprites.coralSiren = [];
  for (let f = 0; f < 3; f++) {
    const finSway = f === 1 ? 1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    // Aquatic torso & fin
    rect(ctx, 10, 8, 6, 10, '#0d9488');
    rect(ctx, 11, 18, 4, 8, '#0f766e');
    rect(ctx, 8 + finSway, 24, 10, 4, '#2dd4bf');
    // Coral hair & crown
    rect(ctx, 8, 3, 10, 6, '#f472b6');
    rect(ctx, 10, 2, 6, 2, '#fb7185');
    px(ctx, 11, 7, '#38bdf8');
    px(ctx, 14, 7, '#38bdf8');
    sprites.coralSiren.push(addPixelOutline(c));
  }

  sprites.tideReaverBoss = [];
  for (let f = 0; f < 3; f++) {
    const wave = f === 1 ? -2 : 0;
    const { c, ctx } = makeCanvas(34, 38);
    rect(ctx, 10, 10 + wave, 14, 18, '#0e7490');
    rect(ctx, 12, 12 + wave, 10, 14, '#06b6d4');
    rect(ctx, 8, 3 + wave, 18, 8, '#164e63');
    rect(ctx, 10, 1 + wave, 14, 3, '#22d3ee');
    // Glowing cyan eyes
    px(ctx, 13, 7 + wave, '#ffffff');
    px(ctx, 19, 7 + wave, '#ffffff');
    // Massive coral trident in hand
    rect(ctx, 24, 2 + wave, 3, 28, '#0891b2');
    rect(ctx, 21, 1 + wave, 9, 3, '#67e8f9');
    rect(ctx, 9, 28, 5, 8, '#155e75');
    rect(ctx, 18, 28, 5, 8, '#155e75');
    sprites.tideReaverBoss.push(addPixelOutline(c));
  }

  // Seamless Aliases for Mobs & Bosses (Both offline and server authoritative names)
  sprites.solariSentinel = sprites.mobSolari;
  sprites.terraWarden = sprites.mobTerra;
  sprites.aetherWeaver = sprites.mobAether;
  sprites.celestialKnight = sprites.solariSentinel;
  sprites.solariBoss = sprites.bossSolari;
  sprites.umbriBoss = sprites.bossUmbri;
  sprites.aetherBoss = sprites.bossAether;
  sprites.celestialArbiterNpc = sprites.aetherChronosNpc || sprites.heraldNpc;
  sprites.foresterSilasNpc = sprites.terraDruidNpc || sprites.heraldNpc;
  sprites.anglerFinnNpc = sprites.solariFlamekeeperNpc || sprites.heraldNpc;
}
