import { makeCanvas, px, rect, addPixelOutline } from "./pixelCanvas.js";

function buildFrames(count, w, h, drawFn) {
  const arr = [];
  for (let f = 0; f < count; f++) {
    const { c, ctx } = makeCanvas(w, h);
    drawFn(ctx, f, w, h);
    arr.push(addPixelOutline(c));
  }
  return arr;
}

function drawOrbitingShard(ctx, x, y, dark, mid, hi) {
  rect(ctx, x + 1, y, 2, 6, dark);
  rect(ctx, x, y + 1, 4, 4, mid);
  rect(ctx, x + 1, y + 1, 2, 3, hi);
  px(ctx, x + 1, y + 2, '#ffffff');
}

function drawSoulLantern(ctx, x, y, cageDark, flameOuter, flameInner) {
  rect(ctx, x + 2, y, 2, 1, '#94a3b8');
  rect(ctx, x + 1, y + 1, 4, 1, cageDark);
  rect(ctx, x, y + 2, 6, 6, '#1e1b4b');
  rect(ctx, x + 1, y + 3, 4, 4, flameOuter);
  rect(ctx, x + 2, y + 4, 2, 2, flameInner);
  px(ctx, x + 2, y + 4, '#ffffff');
  rect(ctx, x + 1, y + 8, 4, 1, cageDark);
}

function drawFeatherWingPair(ctx, lx, rx, y, flap, cDark, cMid, cHi, cTip) {
  // Left Wing (sweeping out to left)
  rect(ctx, lx - 6, y + 2 + flap, 8, 12, cDark);
  rect(ctx, lx - 9, y + flap, 6, 8, cMid);
  rect(ctx, lx - 10, y - 2 + flap, 4, 5, cHi);
  rect(ctx, lx - 8, y + 3 + flap, 7, 3, cHi);
  rect(ctx, lx - 6, y + 8 + flap, 5, 3, cMid);
  px(ctx, lx - 10, y - 2 + flap, cTip);
  px(ctx, lx - 8, y + 1 + flap, '#ffffff');
  px(ctx, lx - 5, y + 13 + flap, cTip);

  // Right Wing (sweeping out to right)
  rect(ctx, rx - 1, y + 2 + flap, 8, 12, cDark);
  rect(ctx, rx + 3, y + flap, 6, 8, cMid);
  rect(ctx, rx + 6, y - 2 + flap, 4, 5, cHi);
  rect(ctx, rx + 1, y + 3 + flap, 7, 3, cHi);
  rect(ctx, rx + 1, y + 8 + flap, 5, 3, cMid);
  px(ctx, rx + 9, y - 2 + flap, cTip);
  px(ctx, rx + 7, y + 1 + flap, '#ffffff');
  px(ctx, rx + 4, y + 13 + flap, cTip);
}

function drawVerticalGreatsword(ctx, x, topY, bladeH, hiltCol, bladeDark, bladeMid, bladeEdge) {
  // Pommel & grip
  rect(ctx, x + 1, topY + bladeH + 3, 2, 4, hiltCol);
  rect(ctx, x, topY + bladeH + 6, 4, 2, '#facc15');
  // Crossguard
  rect(ctx, x - 2, topY + bladeH + 1, 8, 2, hiltCol);
  rect(ctx, x - 1, topY + bladeH + 1, 6, 1, '#fef08a');
  // Broad fuller blade
  rect(ctx, x, topY + 2, 4, bladeH, bladeDark);
  rect(ctx, x + 1, topY + 1, 2, bladeH, bladeMid);
  rect(ctx, x + 1, topY + 2, 1, bladeH - 2, bladeEdge);
  px(ctx, x + 1, topY, '#ffffff');
  px(ctx, x + 2, topY + 1, '#ffffff');
}

/**
 * Generates an optional glowing telegraph cast variant from any boss frame.
 * Adds a 1px luminous aura halo outside the dark silhouette border.
 */
export function buildCastFrameVariant(srcCanvas, glowHex = '#fde047') {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const { c, ctx } = makeCanvas(w, h);
  ctx.drawImage(srcCanvas, 0, 0);

  const srcCtx = srcCanvas.getContext('2d');
  const img = srcCtx.getImageData(0, 0, w, h);
  const d = img.data;
  const outImg = ctx.getImageData(0, 0, w, h);
  const od = outImg.data;

  const gr = parseInt(glowHex.slice(1, 3), 16);
  const gg = parseInt(glowHex.slice(3, 5), 16);
  const gb = parseInt(glowHex.slice(5, 7), 16);

  const isOpaque = (pxX, pxY) => {
    if (pxX < 0 || pxY < 0 || pxX >= w || pxY >= h) return false;
    return d[(pxY * w + pxX) * 4 + 3] > 20;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (d[idx + 3] === 0) {
        const cardinal = isOpaque(x - 1, y) || isOpaque(x + 1, y) || isOpaque(x, y - 1) || isOpaque(x, y + 1);
        if (cardinal) {
          od[idx] = gr;
          od[idx + 1] = gg;
          od[idx + 2] = gb;
          od[idx + 3] = 205;
        }
      }
    }
  }
  outImg.data.set(od);
  ctx.putImageData(outImg, 0, 0);
  return c;
}

export function buildEntityAndMonsterSprites(sprites) {
  // ==========================================
  // 5. TRAINING DUMMY & GLIMMER NODE
  // ==========================================
  sprites.dummy = [];
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

  sprites.node = [];
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
  sprites.treeBlossom = buildTreeNode('#271b12', '#451a03', '#831843', '#be185d', '#ec4899', '#fbcfe8');
  sprites.treeGlimmerwood = buildTreeNode('#451a03', '#78350f', '#14532d', '#16a34a', '#4ade80', '#fde047');
  sprites.treePine = buildTreeNode('#1c1917', '#44403c', '#14532d', '#166534', '#22c55e', '#86efac');
  sprites.treeIronbark = buildTreeNode('#1c1917', '#44403c', '#15803d', '#166534', '#86efac', '#a16207');
  sprites.treeAncientOak = buildTreeNode('#271b12', '#451a03', '#166534', '#15803d', '#4ade80', '#ca8a04');
  sprites.treeDuskveil = buildTreeNode('#1e1b4b', '#312e81', '#3b0764', '#7e22ce', '#c084fc', '#e879f9');
  sprites.treeSunforged = buildTreeNode('#78350f', '#b45309', '#a16207', '#d97706', '#facc15', '#ffffff');
  sprites.treeStarlight = buildTreeNode('#0f172a', '#1e293b', '#0369a1', '#0284c7', '#38bdf8', '#ffffff');
  sprites.blossomTree = sprites.treeBlossom;
  sprites.pineTree = sprites.treePine;
  sprites.ancientOak = sprites.treeAncientOak;
  {
    const { c, ctx } = makeCanvas(28, 32);
    rect(ctx, 9, 22, 10, 8, '#451a03');
    rect(ctx, 10, 20, 8, 4, '#78350f');
    rect(ctx, 12, 21, 4, 2, '#d97706');
    sprites.treeEmpty = addPixelOutline(c);
  }
  {
    const { c, ctx } = makeCanvas(28, 32);
    rect(ctx, 9, 22, 10, 8, '#271b12');
    rect(ctx, 10, 22, 8, 7, '#451a03');
    rect(ctx, 7, 28, 3, 2, '#271b12');
    rect(ctx, 18, 28, 3, 2, '#271b12');
    rect(ctx, 10, 20, 8, 3, '#9d174d');
    rect(ctx, 11, 20, 6, 2, '#be185d');
    rect(ctx, 12, 21, 4, 1, '#f472b6');
    px(ctx, 6, 27, '#ec4899');
    px(ctx, 7, 29, '#fbcfe8');
    px(ctx, 20, 27, '#be185d');
    px(ctx, 21, 29, '#fbcfe8');
    px(ctx, 14, 29, '#ec4899');
    sprites.treeBlossomEmpty = addPixelOutline(c);
  }

  const buildFishingSpot = (waterDark, waterMid, rippleColor, fishGlint) => {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const glint = f === 1 ? 1 : -1;
      const { c, ctx } = makeCanvas(26, 24);
      rect(ctx, 3, 11, 20, 8, waterDark);
      rect(ctx, 5, 12, 16, 6, waterMid);
      rect(ctx, 8 + glint, 13, 10, 4, rippleColor);
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

  // Luminous Restorative Springs — mossy stone basin + glowing aqua/emerald spring water + rising wisps
  sprites.healingSpring = [0, 1].map((f) => {
    const bob = f === 1 ? -1 : 0;
    const { c, ctx } = makeCanvas(30, 28);
    rect(ctx, 3, 14, 24, 9, '#334155');
    rect(ctx, 5, 13, 20, 9, '#475569');
    rect(ctx, 4, 14, 4, 3, '#15803d');
    rect(ctx, 21, 15, 5, 3, '#166534');
    rect(ctx, 12, 5, 6, 9, '#64748b');
    rect(ctx, 13, 3, 4, 4, '#7dd3fc');
    px(ctx, 14, 4, '#ffffff');
    rect(ctx, 6, 15, 18, 6, '#0284c7');
    rect(ctx, 8, 16, 14, 4, '#38bdf8');
    rect(ctx, 10 + f, 16, 8, 2, '#6ee7b7');
    rect(ctx, 13, 12, 4, 4, '#7dd3fc');
    px(ctx, 9, 9 + bob, '#86efac');
    px(ctx, 20, 8 - bob, '#7dd3fc');
    px(ctx, 15, 6 + bob, '#fde047');
    return addPixelOutline(c);
  });
  {
    const { c, ctx } = makeCanvas(30, 28);
    rect(ctx, 3, 14, 24, 9, '#1e293b');
    rect(ctx, 5, 13, 20, 9, '#334155');
    rect(ctx, 12, 6, 6, 8, '#475569');
    rect(ctx, 6, 15, 18, 6, '#0f172a');
    rect(ctx, 9, 16, 12, 3, '#1e293b');
    sprites.healingSpringEmpty = addPixelOutline(c);
  }

  // ==========================================
  // 6. CALM ASTRAL WAYGATE PORTAL (Smooth, Zero Strobe!)
  // ==========================================
  sprites.portal = [];
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

  sprites.siegeShard = [];
  for (let f = 0; f < 3; f++) {
    const hover = f === 1 ? -2 : 0;
    const { c, ctx } = makeCanvas(44, 50);
    rect(ctx, 8, 42, 28, 6, '#1e293b');
    rect(ctx, 12, 38, 20, 5, '#475569');
    rect(ctx, 18, 3 + hover, 8, 32, '#eab308');
    rect(ctx, 15, 9 + hover, 14, 22, '#a855f7');
    rect(ctx, 17, 11 + hover, 10, 18, '#38bdf8');
    rect(ctx, 19, 13 + hover, 6, 14, '#ffffff');
    rect(ctx, 6, 15 - hover, 5, 11, '#facc15');
    rect(ctx, 33, 15 - hover, 5, 11, '#c084fc');
    rect(ctx, 10, 28 + hover, 4, 8, '#4ade80');
    rect(ctx, 30, 28 + hover, 4, 8, '#38bdf8');
    sprites.siegeShard.push(addPixelOutline(c));
  }

  // ==========================================
  // 8. HAND-CRAFTED 16-BIT BIOME MOBS
  // ==========================================
  // Umbri Void Stalker (Digitigrade shadow predator with dorsal spines, curled tail & glowing claws)
  sprites.voidStalker = buildFrames(3, 28, 28, (ctx, f) => {
    const bob = f === 1 ? -1 : 0;
    const stride = f === 1 ? 1 : f === 2 ? -1 : 0;
    // Whipping void tail
    rect(ctx, 20, 15 + bob, 4, 2, '#4c1d95');
    rect(ctx, 23, 12 + bob, 3, 4, '#7e22ce');
    px(ctx, 24, 11 + bob, '#c084fc');
    // Digitigrade legs
    rect(ctx, 7, 19 + Math.max(0, stride), 4, 6, '#1e1b4b');
    rect(ctx, 8, 20 + Math.max(0, stride), 2, 4, '#581c87');
    rect(ctx, 17, 19 + Math.max(0, -stride), 4, 6, '#1e1b4b');
    rect(ctx, 18, 20 + Math.max(0, -stride), 2, 4, '#581c87');
    // Hunched muscular torso & dorsal spines
    rect(ctx, 6, 10 + bob, 15, 10, '#2e1065');
    rect(ctx, 8, 11 + bob, 11, 8, '#581c87');
    rect(ctx, 10, 12 + bob, 6, 5, '#7e22ce');
    rect(ctx, 11, 13 + bob, 4, 2, '#c084fc'); // chest void rift
    px(ctx, 12, 13 + bob, '#f43f5e');
    // Spiked spine crest
    rect(ctx, 12, 2 + bob, 3, 3, '#7e22ce');
    px(ctx, 13, 1 + bob, '#e879f9');
    // Horned predator head
    rect(ctx, 8, 4 + bob, 12, 7, '#1e1b4b');
    rect(ctx, 10, 5 + bob, 8, 5, '#3b0764');
    rect(ctx, 5, 2 + bob, 3, 4, '#7e22ce');
    px(ctx, 5, 2 + bob, '#e879f9');
    rect(ctx, 20, 2 + bob, 3, 4, '#7e22ce');
    px(ctx, 22, 2 + bob, '#e879f9');
    // Slit eyes + specular gleam
    rect(ctx, 10, 7 + bob, 3, 2, '#f43f5e');
    px(ctx, 12, 7 + bob, '#ffffff');
    rect(ctx, 15, 7 + bob, 3, 2, '#f43f5e');
    px(ctx, 15, 7 + bob, '#ffffff');
    // Curved razor fore-claws
    rect(ctx, 2, 12 + bob - stride, 4, 4, '#4c1d95');
    rect(ctx, 1, 15 + bob - stride, 3, 3, '#c084fc');
    px(ctx, 1, 17 + bob - stride, '#ffffff');
    rect(ctx, 21, 12 + bob + stride, 4, 4, '#4c1d95');
    rect(ctx, 23, 15 + bob + stride, 3, 3, '#c084fc');
    px(ctx, 25, 17 + bob + stride, '#ffffff');
  });

  // Duskblade Fiend (Winged crimson-obsidian imp assassin with twin dusk-daggers)
  sprites.duskFiend = buildFrames(3, 26, 28, (ctx, f) => {
    const bob = f === 1 ? -1 : f === 2 ? 1 : 0;
    const flap = f === 1 ? -2 : 0;
    // Pointed bat wings
    rect(ctx, 2, 7 + bob + flap, 5, 8, '#450a0a');
    rect(ctx, 3, 8 + bob + flap, 3, 5, '#991b1b');
    px(ctx, 2, 6 + bob + flap, '#ef4444');
    rect(ctx, 19, 7 + bob + flap, 5, 8, '#450a0a');
    rect(ctx, 20, 8 + bob + flap, 3, 5, '#991b1b');
    px(ctx, 23, 6 + bob + flap, '#ef4444');
    // Lithe legs
    rect(ctx, 8, 20 + bob, 3, 5, '#1e1b4b');
    rect(ctx, 15, 20 + bob, 3, 5, '#1e1b4b');
    px(ctx, 9, 24 + bob, '#dc2626');
    px(ctx, 16, 24 + bob, '#dc2626');
    // Crimson armored torso & sash
    rect(ctx, 7, 10 + bob, 12, 10, '#450a0a');
    rect(ctx, 9, 11 + bob, 8, 8, '#991b1b');
    rect(ctx, 10, 12 + bob, 6, 4, '#dc2626');
    rect(ctx, 8, 17 + bob, 10, 2, '#f87171');
    // Horned dusk cowl
    rect(ctx, 8, 3 + bob, 10, 7, '#0f172a');
    rect(ctx, 9, 4 + bob, 8, 5, '#1e1b4b');
    px(ctx, 7, 2 + bob, '#dc2626');
    px(ctx, 18, 2 + bob, '#dc2626');
    rect(ctx, 10, 6 + bob, 2, 2, '#fde047');
    rect(ctx, 14, 6 + bob, 2, 2, '#fde047');
    px(ctx, 10, 6 + bob, '#ffffff');
    // Twin serrated dusk-daggers
    rect(ctx, 3, 14 + bob, 4, 2, '#7f1d1d');
    rect(ctx, 1, 15 + bob, 3, 4, '#f87171');
    px(ctx, 1, 18 + bob, '#ffffff');
    rect(ctx, 19, 14 + bob, 4, 2, '#7f1d1d');
    rect(ctx, 22, 15 + bob, 3, 4, '#f87171');
    px(ctx, 24, 18 + bob, '#ffffff');
  });

  // Solari Biome Mob (Sunforged Automaton Knight with halberd, kite shield & radiant chest core)
  sprites.mobSolari = buildFrames(3, 28, 30, (ctx, f) => {
    const step = f === 1 ? -1 : f === 2 ? 1 : 0;
    const bob = f === 1 ? -1 : 0;
    // Armored greaves
    rect(ctx, 8, 21 + Math.max(0, step), 4, 6, '#78350f');
    rect(ctx, 9, 22 + Math.max(0, step), 2, 4, '#d97706');
    rect(ctx, 15, 21 + Math.max(0, -step), 4, 6, '#78350f');
    rect(ctx, 16, 22 + Math.max(0, -step), 2, 4, '#d97706');
    // Gold-brass cuirass + pauldrons
    rect(ctx, 6, 10 + bob, 15, 11, '#92400e');
    rect(ctx, 8, 11 + bob, 11, 9, '#d97706');
    rect(ctx, 9, 11 + bob, 9, 5, '#facc15');
    rect(ctx, 4, 10 + bob, 4, 5, '#b45309');
    rect(ctx, 5, 10 + bob, 2, 3, '#fef08a');
    rect(ctx, 19, 10 + bob, 4, 5, '#b45309');
    rect(ctx, 20, 10 + bob, 2, 3, '#fef08a');
    // Glowing cyan sun-furnace core
    rect(ctx, 11, 13 + bob, 5, 4, '#0284c7');
    rect(ctx, 12, 14 + bob, 3, 2, '#7dd3fc');
    px(ctx, 13, 14 + bob, '#ffffff');
    // Crested solar automaton helm
    rect(ctx, 9, 3 + bob, 9, 7, '#a16207');
    rect(ctx, 10, 4 + bob, 7, 5, '#facc15');
    rect(ctx, 12, 1 + bob, 3, 3, '#38bdf8');
    px(ctx, 13, 1 + bob, '#ffffff');
    rect(ctx, 10, 6 + bob, 7, 2, '#070a12');
    rect(ctx, 11, 6 + bob, 5, 1, '#38bdf8');
    // Kite shield on left arm
    rect(ctx, 2, 12 + bob, 5, 9, '#b45309');
    rect(ctx, 3, 13 + bob, 3, 7, '#fde047');
    px(ctx, 4, 15 + bob, '#ffffff');
    // Solar halberd in right hand
    rect(ctx, 22, 4 + bob, 2, 21, '#78350f');
    rect(ctx, 21, 2 + bob, 4, 5, '#facc15');
    rect(ctx, 24, 4 + bob, 2, 4, '#fef08a');
    px(ctx, 23, 1 + bob, '#ffffff');
  });

  // Terra Biome Mob (Briarback Beast — gnarled horned thornbeast with mossy carapace)
  sprites.mobTerra = buildFrames(3, 30, 28, (ctx, f) => {
    const bob = f === 1 ? -1 : 0;
    const step = f === 1 ? 1 : f === 2 ? -1 : 0;
    // Heavy root legs
    rect(ctx, 7, 19 + Math.max(0, step), 5, 6, '#271202');
    rect(ctx, 8, 20 + Math.max(0, step), 3, 4, '#78350f');
    rect(ctx, 18, 19 + Math.max(0, -step), 5, 6, '#271202');
    rect(ctx, 19, 20 + Math.max(0, -step), 3, 4, '#78350f');
    // Hunched mossy carapace & thorn spikes
    rect(ctx, 5, 8 + bob, 20, 12, '#1a2e05');
    rect(ctx, 7, 9 + bob, 16, 10, '#365314');
    rect(ctx, 8, 7 + bob, 14, 6, '#15803d');
    rect(ctx, 10, 8 + bob, 10, 3, '#4ade80');
    px(ctx, 11, 8 + bob, '#bbf7d0');
    // Jagged back thorns
    px(ctx, 8, 5 + bob, '#b45309');
    px(ctx, 14, 4 + bob, '#d97706');
    px(ctx, 21, 5 + bob, '#b45309');
    // Gnarled face & amber eyes
    rect(ctx, 9, 10 + bob, 12, 7, '#451a03');
    rect(ctx, 11, 11 + bob, 8, 5, '#78350f');
    rect(ctx, 10, 12 + bob, 3, 2, '#fde047');
    px(ctx, 11, 12 + bob, '#ffffff');
    rect(ctx, 17, 12 + bob, 3, 2, '#fde047');
    px(ctx, 18, 12 + bob, '#ffffff');
    // Stag-bark antlers
    rect(ctx, 6, 4 + bob, 2, 5, '#92400e');
    px(ctx, 5, 3 + bob, '#fde047');
    rect(ctx, 22, 4 + bob, 2, 5, '#92400e');
    px(ctx, 24, 3 + bob, '#fde047');
    // Overhanging root-claws
    rect(ctx, 2, 12 + bob - step, 4, 7, '#451a03');
    rect(ctx, 3, 13 + bob - step, 2, 5, '#16a34a');
    rect(ctx, 24, 12 + bob + step, 4, 7, '#451a03');
    rect(ctx, 25, 13 + bob + step, 2, 5, '#16a34a');
  });

  // Aether Biome Mob (Continuum Wraith — floating astral specter with orbiting prism shards)
  sprites.mobAether = buildFrames(3, 28, 30, (ctx, f) => {
    const hover = f === 1 ? -2 : f === 2 ? 1 : 0;
    // Ethereal tapering tail wisps
    rect(ctx, 9, 21 + hover, 10, 4, '#082f49');
    rect(ctx, 10, 24 + hover, 3, 3, '#0284c7');
    rect(ctx, 15, 24 + hover, 3, 3, '#38bdf8');
    px(ctx, 13, 27 + hover, '#7dd3fc');
    // Flowing astral mantle & specular folds
    rect(ctx, 7, 9 + hover, 14, 13, '#0369a1');
    rect(ctx, 9, 10 + hover, 10, 11, '#0ea5e9');
    rect(ctx, 11, 11 + hover, 6, 9, '#38bdf8');
    rect(ctx, 12, 12 + hover, 4, 5, '#bae6fd');
    rect(ctx, 10, 10 + hover, 8, 2, '#facc15'); // astrolabe collar
    // Deep cowl & glowing arcane visor
    rect(ctx, 9, 2 + hover, 10, 8, '#0f172a');
    rect(ctx, 10, 3 + hover, 8, 6, '#1e3a8a');
    rect(ctx, 11, 6 + hover, 2, 2, '#ffffff');
    rect(ctx, 15, 6 + hover, 2, 2, '#ffffff');
    px(ctx, 13, 4 + hover, '#7dd3fc');
    // Orbiting prism focus shards
    drawOrbitingShard(ctx, 2, 10 - hover, '#0369a1', '#38bdf8', '#e0f2fe');
    drawOrbitingShard(ctx, 22, 11 + hover, '#6b21a8', '#c084fc', '#f5d0fe');
  });

  // Dedicated Pixel Art Mobs: Void Annihilator (mobUmbri), Starforged Automaton, Meteor Elemental, Gloam-Widow & Paradox Sentinel
  sprites.mobUmbri = buildFrames(3, 28, 30, (ctx, f) => {
    const hover = f === 1 ? -2 : f === 2 ? 1 : 0;
    // Tattered void cloak skirt
    rect(ctx, 8, 21 + hover, 12, 4, '#1e1b4b');
    rect(ctx, 9, 24 + hover, 3, 3, '#4c1d95');
    rect(ctx, 16, 24 + hover, 3, 3, '#4c1d95');
    // Dark armor torso & crimson chest rift
    rect(ctx, 7, 9 + hover, 14, 13, '#1e1b4b');
    rect(ctx, 9, 10 + hover, 10, 10, '#4c1d95');
    rect(ctx, 12, 12 + hover, 4, 5, '#7e22ce');
    rect(ctx, 13, 13 + hover, 2, 3, '#f43f5e');
    px(ctx, 13, 14 + hover, '#ffffff');
    // Spiked pauldrons
    rect(ctx, 5, 8 + hover, 4, 4, '#581c87');
    px(ctx, 5, 7 + hover, '#c084fc');
    rect(ctx, 19, 8 + hover, 4, 4, '#581c87');
    px(ctx, 22, 7 + hover, '#c084fc');
    // Horned abyssal helm
    rect(ctx, 9, 3 + hover, 10, 7, '#0f172a');
    rect(ctx, 10, 4 + hover, 8, 5, '#312e81');
    px(ctx, 8, 2 + hover, '#a855f7');
    px(ctx, 19, 2 + hover, '#a855f7');
    rect(ctx, 11, 6 + hover, 2, 2, '#f43f5e');
    rect(ctx, 15, 6 + hover, 2, 2, '#f43f5e');
    // Twin plasma-violet void scythe-blades
    rect(ctx, 2, 10 + hover, 5, 3, '#9333ea');
    rect(ctx, 1, 12 + hover, 3, 7, '#e879f9');
    px(ctx, 1, 17 + hover, '#ffffff');
    rect(ctx, 21, 10 + hover, 5, 3, '#9333ea');
    rect(ctx, 24, 12 + hover, 3, 7, '#e879f9');
    px(ctx, 26, 17 + hover, '#ffffff');
  });

  // ==========================================
  // 9. BESPOKE MULTI-PART DUNGEON & WORLD BOSSES (7 UNIQUE DESIGNS!)
  // ==========================================

  // 1) Sunfire Colossus (bossSolari) — Radiant golden-winged colossus wielding Sun-Greatsword
  sprites.bossSolari = buildFrames(3, 46, 46, (ctx, f) => {
    const bob = f === 1 ? -1 : 0;
    const flap = f === 1 ? -2 : f === 2 ? 1 : 0;
    const stompL = f === 1 ? -1 : 0;
    const stompR = f === 2 ? -1 : 0;

    // Sweeping Flame-Gold Wings behind torso
    drawFeatherWingPair(ctx, 13, 32, 9 + bob, flap, '#92400e', '#f59e0b', '#fde047', '#ffffff');

    // Heavy armored greaves & sabatons
    rect(ctx, 14, 31 + stompL, 7, 11, '#78350f');
    rect(ctx, 15, 32 + stompL, 5, 8, '#ca8a04');
    rect(ctx, 16, 33 + stompL, 3, 4, '#fef08a');
    rect(ctx, 25, 31 + stompR, 7, 11, '#78350f');
    rect(ctx, 26, 32 + stompR, 5, 8, '#ca8a04');
    rect(ctx, 27, 33 + stompR, 3, 4, '#fef08a');

    // Broad plated solar torso & crimson war-tunic
    rect(ctx, 13, 13 + bob, 20, 19, '#92400e');
    rect(ctx, 15, 14 + bob, 16, 16, '#eab308');
    rect(ctx, 17, 15 + bob, 12, 12, '#facc15');
    rect(ctx, 19, 28 + bob, 8, 6, '#dc2626'); // crimson waist tabard
    // Blazing molten sun-heart core
    rect(ctx, 19, 17 + bob, 8, 8, '#ea580c');
    rect(ctx, 20, 18 + bob, 6, 6, '#fde047');
    rect(ctx, 21, 19 + bob, 4, 4, '#ffffff');
    // Broad horned pauldrons
    rect(ctx, 10, 12 + bob, 6, 7, '#b45309');
    rect(ctx, 11, 13 + bob, 4, 5, '#fef08a');
    rect(ctx, 30, 12 + bob, 6, 7, '#b45309');
    rect(ctx, 31, 13 + bob, 4, 5, '#fef08a');

    // Crowned solar helm
    rect(ctx, 17, 4 + bob, 12, 9, '#92400e');
    rect(ctx, 18, 5 + bob, 10, 7, '#facc15');
    rect(ctx, 21, 2 + bob, 4, 3, '#fb923c'); // helm crest plume
    px(ctx, 22, 1 + bob, '#ffffff');
    rect(ctx, 19, 8 + bob, 8, 2, '#070a12');
    rect(ctx, 20, 8 + bob, 2, 2, '#38bdf8');
    rect(ctx, 24, 8 + bob, 2, 2, '#38bdf8');

    // Left heavy armored gauntlet
    rect(ctx, 9, 20 + bob, 5, 8, '#92400e');
    rect(ctx, 10, 21 + bob, 3, 6, '#facc15');

    // Colossal Sun-Greatsword held upright on right
    drawVerticalGreatsword(ctx, 37, 3 + bob, 22, '#92400e', '#ea580c', '#fde047', '#ffffff');
    rect(ctx, 34, 21 + bob, 5, 5, '#b45309');
    rect(ctx, 35, 22 + bob, 3, 3, '#facc15');
  });

  // 2) Crypt Lord Malakor (bossUmbri) — Floating skeletal reaper lich with scythe & soul-lanterns
  sprites.bossUmbri = buildFrames(3, 44, 46, (ctx, f) => {
    const hover = f === 1 ? -2 : f === 2 ? 1 : 0;
    const lanternBob = f === 1 ? 1 : -1;

    // Tattered floating necromantic lich robes (no legs!)
    rect(ctx, 11, 24 + hover, 20, 13, '#1e1b4b');
    rect(ctx, 13, 25 + hover, 16, 11, '#3b0764');
    rect(ctx, 11, 35 + hover, 4, 7, '#3b0764');
    rect(ctx, 17, 36 + hover, 4, 8, '#581c87');
    rect(ctx, 23, 35 + hover, 4, 7, '#3b0764');
    rect(ctx, 28, 34 + hover, 3, 6, '#1e1b4b');
    px(ctx, 18, 42 + hover, '#a855f7');

    // Dark armored shoulders & mantle
    rect(ctx, 10, 12 + hover, 22, 13, '#1e1b4b');
    rect(ctx, 12, 13 + hover, 18, 10, '#3b0764');
    rect(ctx, 8, 11 + hover, 6, 6, '#4c1d95');
    px(ctx, 8, 10 + hover, '#e879f9');
    rect(ctx, 28, 11 + hover, 6, 6, '#4c1d95');
    px(ctx, 33, 10 + hover, '#e879f9');

    // Skeletal ribcage & glowing crimson phylactery heart
    rect(ctx, 15, 14 + hover, 12, 10, '#0f172a');
    rect(ctx, 16, 15 + hover, 10, 2, '#cbd5e1');
    rect(ctx, 17, 18 + hover, 8, 2, '#94a3b8');
    rect(ctx, 18, 21 + hover, 6, 2, '#cbd5e1');
    rect(ctx, 19, 16 + hover, 4, 5, '#f43f5e');
    rect(ctx, 20, 17 + hover, 2, 3, '#fde047');

    // Horned Lich Skull & Midnight Hood
    rect(ctx, 14, 3 + hover, 14, 10, '#1e1b4b');
    rect(ctx, 16, 5 + hover, 10, 7, '#cbd5e1');
    rect(ctx, 17, 5 + hover, 8, 5, '#f8fafc');
    rect(ctx, 12, 1 + hover, 3, 4, '#7e22ce'); // lich crown horns
    px(ctx, 12, 1 + hover, '#e879f9');
    rect(ctx, 27, 1 + hover, 3, 4, '#7e22ce');
    px(ctx, 29, 1 + hover, '#e879f9');
    // Hollow eye sockets with glowing soulfire
    rect(ctx, 17, 7 + hover, 3, 2, '#070a12');
    px(ctx, 18, 7 + hover, '#f43f5e');
    rect(ctx, 22, 7 + hover, 3, 2, '#070a12');
    px(ctx, 23, 7 + hover, '#f43f5e');
    rect(ctx, 18, 10 + hover, 6, 2, '#475569');

    // Giant sweeping Reaper Scythe on right
    rect(ctx, 33, 6 + hover, 2, 33, '#312e81');
    rect(ctx, 22, 2 + hover, 15, 4, '#7e22ce');
    rect(ctx, 20, 4 + hover, 13, 3, '#c084fc');
    rect(ctx, 18, 6 + hover, 5, 3, '#e879f9');
    px(ctx, 18, 8 + hover, '#ffffff');
    px(ctx, 27, 2 + hover, '#ffffff');

    // Two Floating Soul-Lanterns
    drawSoulLantern(ctx, 2, 15 + lanternBob, '#64748b', '#a855f7', '#f43f5e');
    drawSoulLantern(ctx, 36, 22 - lanternBob, '#64748b', '#a855f7', '#f43f5e');
  });

  // 3) Rift Titan (bossAether) — Floating prism-sharded temporal titan
  sprites.bossAether = buildFrames(3, 44, 44, (ctx, f) => {
    const hover = f === 1 ? -2 : f === 2 ? 1 : 0;
    const orbit = f === 1 ? 2 : f === 2 ? -2 : 0;

    // Levitating faceted lower monolith spike (no stubby feet!)
    rect(ctx, 16, 28 + hover, 12, 8, '#1e3a8a');
    rect(ctx, 18, 35 + hover, 8, 5, '#0284c7');
    rect(ctx, 20, 39 + hover, 4, 3, '#7dd3fc');
    px(ctx, 21, 41 + hover, '#ffffff');

    // Geometric faceted torso plates split around temporal singularity core
    rect(ctx, 11, 13 + hover, 22, 16, '#0f172a');
    rect(ctx, 12, 14 + hover, 8, 13, '#0369a1');
    rect(ctx, 13, 15 + hover, 5, 10, '#38bdf8');
    rect(ctx, 24, 14 + hover, 8, 13, '#0369a1');
    rect(ctx, 26, 15 + hover, 5, 10, '#38bdf8');
    // Hollowed glowing Singularity Heart
    rect(ctx, 19, 16 + hover, 6, 8, '#7e22ce');
    rect(ctx, 20, 17 + hover, 4, 6, '#c084fc');
    rect(ctx, 21, 18 + hover, 2, 4, '#ffffff');

    // Diamond Prism Head & Floating Chrono-Halo
    rect(ctx, 14, 1 + hover, 16, 2, '#facc15'); // halo arc
    px(ctx, 21, 1 + hover, '#ffffff');
    rect(ctx, 16, 4 + hover, 12, 8, '#1e3a8a');
    rect(ctx, 18, 3 + hover, 8, 9, '#0ea5e9');
    rect(ctx, 20, 4 + hover, 4, 7, '#bae6fd');
    rect(ctx, 19, 7 + hover, 6, 2, '#ffffff'); // radiant slit

    // Disembodied floating prism gauntlets
    rect(ctx, 4, 17 + hover - orbit, 6, 9, '#0369a1');
    rect(ctx, 5, 18 + hover - orbit, 4, 7, '#38bdf8');
    px(ctx, 6, 19 + hover - orbit, '#ffffff');
    rect(ctx, 34, 17 + hover + orbit, 6, 9, '#0369a1');
    rect(ctx, 35, 18 + hover + orbit, 4, 7, '#38bdf8');
    px(ctx, 37, 19 + hover + orbit, '#ffffff');

    // Orbiting temporal prism shards
    drawOrbitingShard(ctx, 5 + orbit, 6 + hover, '#1e3a8a', '#38bdf8', '#e0f2fe');
    drawOrbitingShard(ctx, 35 - orbit, 6 + hover, '#581c87', '#c084fc', '#f5d0fe');
    drawOrbitingShard(ctx, 8 - orbit, 30 + hover, '#1e3a8a', '#38bdf8', '#ffffff');
    drawOrbitingShard(ctx, 32 + orbit, 30 + hover, '#581c87', '#c084fc', '#ffffff');
  });

  // 4) Elder Rootdeep Behemoth (graniteBoss) — Gnarled horned treant-boulder giant
  sprites.graniteBoss = buildFrames(3, 44, 44, (ctx, f) => {
    const bob = f === 0 ? 0 : 1;
    const stompL = f === 1 ? -2 : 0;
    const stompR = f === 2 ? -2 : 0;

    // Massive stomping boulder legs
    rect(ctx, 10, 31 + stompL, 9, 10, '#1e293b');
    rect(ctx, 11, 32 + stompL, 7, 8, '#475569');
    rect(ctx, 25, 31 + stompR, 9, 10, '#1e293b');
    rect(ctx, 26, 32 + stompR, 7, 8, '#475569');

    // Asymmetric craggy granite & bark torso
    rect(ctx, 10, 12 + bob, 24, 20, '#1e293b');
    rect(ctx, 12, 13 + bob, 20, 17, '#334155');
    rect(ctx, 14, 14 + bob, 14, 12, '#475569');
    // Lush emerald moss overgrowth on shoulder & chest
    rect(ctx, 10, 11 + bob, 11, 6, '#14532d');
    rect(ctx, 11, 12 + bob, 8, 4, '#22c55e');
    rect(ctx, 13, 12 + bob, 4, 2, '#86efac');
    // Glowing amber leyline fissure cracks & chest rune
    rect(ctx, 19, 18 + bob, 6, 7, '#b45309');
    rect(ctx, 20, 19 + bob, 4, 5, '#f59e0b');
    rect(ctx, 21, 20 + bob, 2, 3, '#fde047');
    px(ctx, 26, 17 + bob, '#f59e0b');
    px(ctx, 16, 25 + bob, '#f59e0b');

    // Gnarled bark-stone head + wide branching antlers
    rect(ctx, 15, 5 + bob, 14, 8, '#292524');
    rect(ctx, 16, 6 + bob, 12, 6, '#44403c');
    rect(ctx, 17, 5 + bob, 10, 2, '#16a34a'); // mossy brow
    // Left & right antlers
    rect(ctx, 9, 2 + bob, 4, 5, '#78350f');
    rect(ctx, 12, 4 + bob, 4, 3, '#92400e');
    px(ctx, 8, 1 + bob, '#4ade80');
    rect(ctx, 31, 2 + bob, 4, 5, '#78350f');
    rect(ctx, 28, 4 + bob, 4, 3, '#92400e');
    px(ctx, 35, 1 + bob, '#4ade80');
    // Fierce amber eyes
    rect(ctx, 17, 9 + bob, 3, 2, '#fde047');
    px(ctx, 18, 9 + bob, '#ffffff');
    rect(ctx, 24, 9 + bob, 3, 2, '#fde047');
    px(ctx, 25, 9 + bob, '#ffffff');

    // Oversized granite smash-fists
    rect(ctx, 2, 16 + bob - stompL, 9, 15, '#1e293b');
    rect(ctx, 3, 17 + bob - stompL, 7, 13, '#475569');
    rect(ctx, 4, 17 + bob - stompL, 5, 4, '#16a34a');
    rect(ctx, 33, 16 + bob - stompR, 9, 15, '#1e293b');
    rect(ctx, 34, 17 + bob - stompR, 7, 13, '#475569');
    rect(ctx, 35, 25 + bob - stompR, 5, 3, '#64748b');
  });

  // 5) Aurelius the Empyrean Sovereign (celestialTitanBoss) — Winged crown-seraph
  sprites.celestialTitanBoss = buildFrames(3, 46, 46, (ctx, f) => {
    const bob = f === 1 ? -1 : 0;
    const flap = f === 1 ? -2 : f === 2 ? 1 : 0;

    // Triple-tiered Seraphic Wings (ivory, sky-cyan & gold tips)
    drawFeatherWingPair(ctx, 13, 32, 8 + bob, flap, '#0284c7', '#7dd3fc', '#ffffff', '#fde047');
    drawFeatherWingPair(ctx, 14, 31, 18 + bob, -flap, '#1e3a8a', '#38bdf8', '#e0f2fe', '#facc15');

    // Sovereign greaves
    rect(ctx, 15, 31 + bob, 6, 12, '#451a03');
    rect(ctx, 16, 32 + bob, 4, 10, '#facc15');
    px(ctx, 17, 34 + bob, '#ffffff');
    rect(ctx, 25, 31 + bob, 6, 12, '#451a03');
    rect(ctx, 26, 32 + bob, 4, 10, '#facc15');
    px(ctx, 27, 34 + bob, '#ffffff');

    // Empyrean bronze-gold chestplate & indigo-white royal tabard
    rect(ctx, 14, 14 + bob, 18, 18, '#451a03');
    rect(ctx, 16, 15 + bob, 14, 15, '#ca8a04');
    rect(ctx, 18, 16 + bob, 10, 10, '#fef08a');
    rect(ctx, 20, 26 + bob, 6, 8, '#1e1b4b');
    rect(ctx, 21, 27 + bob, 4, 6, '#ffffff');
    // Radiant starlight heart crest
    rect(ctx, 20, 17 + bob, 6, 6, '#0284c7');
    rect(ctx, 21, 18 + bob, 4, 4, '#ffffff');
    // Winged gold pauldrons
    rect(ctx, 11, 13 + bob, 5, 6, '#ca8a04');
    rect(ctx, 12, 14 + bob, 3, 4, '#ffffff');
    rect(ctx, 30, 13 + bob, 5, 6, '#ca8a04');
    rect(ctx, 31, 14 + bob, 3, 4, '#ffffff');

    // Floating Celestial Halo + Crown of Dawn + Sovereign Visage
    rect(ctx, 17, 1, 12, 1, '#fef08a');
    px(ctx, 16, 2, '#ffffff');
    px(ctx, 29, 2, '#ffffff');
    // 5-spike Crown of Dawn
    rect(ctx, 17, 6 + bob, 12, 3, '#ca8a04');
    rect(ctx, 18, 7 + bob, 10, 1, '#fde047');
    rect(ctx, 17, 4 + bob, 2, 2, '#fde047');
    rect(ctx, 20, 3 + bob, 2, 3, '#fde047');
    rect(ctx, 22, 2 + bob, 2, 4, '#ffffff');
    rect(ctx, 24, 3 + bob, 2, 3, '#fde047');
    rect(ctx, 27, 4 + bob, 2, 2, '#fde047');
    // Helm face & cyan eyes
    rect(ctx, 18, 9 + bob, 10, 5, '#451a03');
    rect(ctx, 19, 9 + bob, 8, 4, '#facc15');
    rect(ctx, 20, 10 + bob, 2, 2, '#38bdf8');
    rect(ctx, 24, 10 + bob, 2, 2, '#38bdf8');

    // Left hand channeling radiant star-orb
    rect(ctx, 9, 20 + bob, 5, 5, '#ca8a04');
    rect(ctx, 6, 17 + bob, 4, 4, '#38bdf8');
    rect(ctx, 7, 18 + bob, 2, 2, '#ffffff');

    // Morning Star Sovereign Greatsword on right
    drawVerticalGreatsword(ctx, 37, 4 + bob, 22, '#ca8a04', '#facc15', '#fef08a', '#ffffff');
    rect(ctx, 35, 22 + bob, 4, 5, '#ca8a04');
  });

  // 6) Ignis-Core, Fallen Star Construct (starfallBoss) — Fractured volcanic meteor colossus
  sprites.starfallBoss = buildFrames(3, 44, 44, (ctx, f) => {
    const pulse = f === 1 ? -1 : 0;
    const stompL = f === 1 ? -1 : 0;
    const stompR = f === 2 ? -1 : 0;

    // Heavy basalt legs with magma ankle veins
    rect(ctx, 11, 31 + stompL, 8, 10, '#1c1917');
    rect(ctx, 12, 32 + stompL, 6, 8, '#431407');
    px(ctx, 14, 35 + stompL, '#f97316');
    rect(ctx, 25, 31 + stompR, 8, 10, '#1c1917');
    rect(ctx, 26, 32 + stompR, 6, 8, '#431407');
    px(ctx, 28, 35 + stompR, '#f97316');

    // Craggy obsidian-basalt torso split by molten lava seams
    rect(ctx, 10, 12 + pulse, 24, 20, '#1c1917');
    rect(ctx, 12, 13 + pulse, 20, 17, '#431407');
    rect(ctx, 14, 14 + pulse, 16, 14, '#7c2d12');
    // Incandescent magma crack veins
    rect(ctx, 13, 16 + pulse, 4, 2, '#ea580c');
    rect(ctx, 27, 23 + pulse, 4, 2, '#f97316');
    px(ctx, 15, 25 + pulse, '#fde047');
    // Superheated cyan-and-flame star-reactor chest core
    rect(ctx, 17, 16 + pulse, 10, 9, '#ea580c');
    rect(ctx, 18, 17 + pulse, 8, 7, '#fde047');
    rect(ctx, 20, 18 + pulse, 4, 5, '#0284c7');
    rect(ctx, 21, 19 + pulse, 2, 3, '#ffffff');

    // Starmetal cyan crystal clusters erupting from volcanic shoulders
    rect(ctx, 9, 8 + pulse, 5, 7, '#0369a1');
    rect(ctx, 10, 7 + pulse, 3, 6, '#38bdf8');
    px(ctx, 11, 6 + pulse, '#ffffff');
    rect(ctx, 30, 8 + pulse, 5, 7, '#0369a1');
    rect(ctx, 31, 7 + pulse, 3, 6, '#38bdf8');
    px(ctx, 32, 6 + pulse, '#ffffff');

    // Jagged obsidian crater head with glowing magma eyes
    rect(ctx, 16, 4 + pulse, 12, 9, '#1c1917');
    rect(ctx, 17, 5 + pulse, 10, 7, '#431407');
    px(ctx, 18, 3 + pulse, '#f97316');
    px(ctx, 25, 3 + pulse, '#f97316');
    rect(ctx, 18, 8 + pulse, 3, 2, '#fde047');
    rect(ctx, 23, 8 + pulse, 3, 2, '#fde047');

    // Heavy volcanic fists + orbiting molten meteor chunks
    rect(ctx, 3, 17 + pulse - stompL, 8, 13, '#271b12');
    rect(ctx, 4, 18 + pulse - stompL, 6, 10, '#7c2d12');
    rect(ctx, 5, 22 + pulse - stompL, 4, 4, '#f97316');
    rect(ctx, 33, 17 + pulse - stompR, 8, 13, '#271b12');
    rect(ctx, 34, 18 + pulse - stompR, 6, 10, '#7c2d12');
    rect(ctx, 35, 22 + pulse - stompR, 4, 4, '#f97316');
    // Orbiting fallen star fragments
    drawOrbitingShard(ctx, 2, 5 - pulse, '#9a3412', '#fb923c', '#fde047');
    drawOrbitingShard(ctx, 38, 6 + pulse, '#0369a1', '#38bdf8', '#ffffff');
  });

  // 7) Xal'Korath, Rift-Weaver (abyssalArchitectBoss) — Multi-eyed dimensional void architect
  sprites.abyssalArchitectBoss = buildFrames(3, 46, 46, (ctx, f) => {
    const hover = f === 1 ? -2 : f === 2 ? 1 : 0;
    const writhe = f === 1 ? 1 : f === 2 ? -1 : 0;

    // Cosmic voidstar crescent aura behind shoulders
    rect(ctx, 11, 5 + hover, 24, 3, '#581c87');
    rect(ctx, 9, 8 + hover, 3, 7, '#7e22ce');
    rect(ctx, 34, 8 + hover, 3, 7, '#7e22ce');
    px(ctx, 10, 7 + hover, '#2dd4bf');
    px(ctx, 35, 7 + hover, '#2dd4bf');

    // Writhing void-tendril lower robes
    rect(ctx, 13, 26 + hover, 20, 9, '#0f172a');
    rect(ctx, 15, 27 + hover, 16, 7, '#3b0764');
    rect(ctx, 11 + writhe, 34 + hover, 4, 9, '#1e1b4b');
    px(ctx, 12 + writhe, 42 + hover, '#2dd4bf');
    rect(ctx, 17 - writhe, 35 + hover, 4, 9, '#4c1d95');
    px(ctx, 18 - writhe, 43 + hover, '#c084fc');
    rect(ctx, 24 + writhe, 35 + hover, 4, 9, '#4c1d95');
    px(ctx, 25 + writhe, 43 + hover, '#c084fc');
    rect(ctx, 30 - writhe, 34 + hover, 4, 8, '#1e1b4b');
    px(ctx, 31 - writhe, 41 + hover, '#2dd4bf');

    // Layered eldritch mantle & dimensional chest rift
    rect(ctx, 12, 13 + hover, 22, 14, '#090d1c');
    rect(ctx, 14, 14 + hover, 18, 12, '#1e1b4b');
    rect(ctx, 16, 15 + hover, 14, 9, '#581c87');
    rect(ctx, 20, 16 + hover, 6, 7, '#0f766e');
    rect(ctx, 21, 17 + hover, 4, 5, '#2dd4bf');
    rect(ctx, 22, 18 + hover, 2, 3, '#ffffff');
    // Jagged void shoulder plates
    rect(ctx, 9, 12 + hover, 5, 6, '#3b0764');
    px(ctx, 9, 11 + hover, '#c084fc');
    rect(ctx, 32, 12 + hover, 5, 6, '#3b0764');
    px(ctx, 36, 11 + hover, '#c084fc');

    // Towering Horned Crown & 5 Glowing Dimensional Eyes
    rect(ctx, 16, 3 + hover, 14, 10, '#090d1c');
    rect(ctx, 17, 4 + hover, 12, 8, '#1e1b4b');
    rect(ctx, 14, 1 + hover, 3, 5, '#7e22ce');
    px(ctx, 14, 1 + hover, '#2dd4bf');
    rect(ctx, 29, 1 + hover, 3, 5, '#7e22ce');
    px(ctx, 31, 1 + hover, '#2dd4bf');
    // 5 dimensional eyes (large central teal eye + 4 flanking violet/rose eyes)
    rect(ctx, 22, 5 + hover, 2, 2, '#2dd4bf');
    px(ctx, 22, 5 + hover, '#ffffff');
    px(ctx, 19, 6 + hover, '#e879f9');
    px(ctx, 26, 6 + hover, '#e879f9');
    rect(ctx, 19, 9 + hover, 2, 2, '#f43f5e');
    rect(ctx, 25, 9 + hover, 2, 2, '#f43f5e');

    // Outstretched multi-jointed gauntlets channeling swirling dimensional rifts
    rect(ctx, 6, 17 + hover, 6, 5, '#1e1b4b');
    drawOrbitingShard(ctx, 2, 14 + hover - writhe, '#0f766e', '#2dd4bf', '#ffffff');
    rect(ctx, 34, 17 + hover, 6, 5, '#1e1b4b');
    drawOrbitingShard(ctx, 40, 14 + hover + writhe, '#6b21a8', '#c084fc', '#ffffff');
  });

  // ==========================================
  // 10. DEDICATED ZONE MOBS & SUB-BOSSES
  // ==========================================
  sprites.starforgedAutomaton = [];
  for (let f = 0; f < 3; f++) {
    const step = f === 1 ? -1 : f === 2 ? 1 : 0;
    const { c, ctx } = makeCanvas(28, 30);
    rect(ctx, 7, 21 + step, 5, 7, '#475569');
    rect(ctx, 16, 21 - step, 5, 7, '#475569');
    rect(ctx, 6, 9, 16, 13, '#78350f');
    rect(ctx, 8, 11, 12, 9, '#d97706');
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
    rect(ctx, 2, 11 - pulse, 3, 5, '#ea580c');
    rect(ctx, 23, 11 + pulse, 3, 5, '#38bdf8');
    sprites.meteorElemental.push(addPixelOutline(c));
  }

  sprites.gloamWidow = [];
  for (let f = 0; f < 3; f++) {
    const skitter = f === 1 ? 1 : f === 2 ? -1 : 0;
    const { c, ctx } = makeCanvas(28, 24);
    rect(ctx, 8, 6, 12, 9, '#3b0764');
    rect(ctx, 10, 7, 8, 6, '#6b21a8');
    rect(ctx, 12, 8, 4, 3, '#c084fc');
    rect(ctx, 9, 13, 10, 6, '#1e1b4b');
    px(ctx, 11, 16, '#f43f5e');
    px(ctx, 13, 17, '#e879f9');
    px(ctx, 15, 17, '#e879f9');
    px(ctx, 17, 16, '#f43f5e');
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
    rect(ctx, 2, 6 + wing, 7, 12, '#0284c7');
    rect(ctx, 4, 8 + wing, 4, 8, '#7dd3fc');
    rect(ctx, 21, 6 + wing, 7, 12, '#7e22ce');
    rect(ctx, 22, 8 + wing, 4, 8, '#e879f9');
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
    rect(ctx, 6, 4 + bob, 12, 8, '#15803d');
    rect(ctx, 8, 2 + bob, 8, 4, '#4ade80');
    px(ctx, 9, 13 + bob, '#facc15');
    px(ctx, 14, 13 + bob, '#facc15');
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
    rect(ctx, 14, 18 + breathe, 8, 8, '#15803d');
    rect(ctx, 6, 2 + breathe, 24, 12, '#14532d');
    rect(ctx, 9, 1 + breathe, 18, 5, '#22c55e');
    px(ctx, 15, 2 + breathe, '#86efac');
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
    rect(ctx, 2, 6 + scuttle, 4, 5, '#38bdf8');
    rect(ctx, 20, 6 - scuttle, 4, 5, '#38bdf8');
    px(ctx, 9, 7, '#ffffff');
    px(ctx, 16, 7, '#ffffff');
    rect(ctx, 4, 18, 3, 4, '#0369a1');
    rect(ctx, 19, 18, 3, 4, '#0369a1');
    sprites.brineCrawler.push(addPixelOutline(c));
  }

  sprites.coralSiren = [];
  for (let f = 0; f < 3; f++) {
    const finSway = f === 1 ? 1 : 0;
    const { c, ctx } = makeCanvas(26, 28);
    rect(ctx, 10, 8, 6, 10, '#0d9488');
    rect(ctx, 11, 18, 4, 8, '#0f766e');
    rect(ctx, 8 + finSway, 24, 10, 4, '#2dd4bf');
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
    px(ctx, 13, 7 + wave, '#ffffff');
    px(ctx, 19, 7 + wave, '#ffffff');
    rect(ctx, 24, 2 + wave, 3, 28, '#0891b2');
    rect(ctx, 21, 1 + wave, 9, 3, '#67e8f9');
    rect(ctx, 9, 28, 5, 8, '#155e75');
    rect(ctx, 18, 28, 5, 8, '#155e75');
    sprites.tideReaverBoss.push(addPixelOutline(c));
  }

  // Optional Boss Telegraph Cast Glow Variants
  sprites.bossCastGlow = {
    bossSolari: buildCastFrameVariant(sprites.bossSolari[0], '#fef08a'),
    bossUmbri: buildCastFrameVariant(sprites.bossUmbri[0], '#e879f9'),
    bossAether: buildCastFrameVariant(sprites.bossAether[0], '#38bdf8'),
    graniteBoss: buildCastFrameVariant(sprites.graniteBoss[0], '#4ade80'),
    celestialTitanBoss: buildCastFrameVariant(sprites.celestialTitanBoss[0], '#ffffff'),
    starfallBoss: buildCastFrameVariant(sprites.starfallBoss[0], '#fb923c'),
    abyssalArchitectBoss: buildCastFrameVariant(sprites.abyssalArchitectBoss[0], '#2dd4bf'),
    tideReaverBoss: buildCastFrameVariant(sprites.tideReaverBoss[0], '#67e8f9'),
    elderBarkhide: buildCastFrameVariant(sprites.elderBarkhide[0], '#86efac'),
  };

  // Seamless Aliases for Mobs & Bosses (Both offline and server authoritative names)
  sprites.solariSentinel = sprites.mobSolari;
  sprites.terraWarden = sprites.mobTerra;
  sprites.aetherWeaver = sprites.mobAether;
  sprites.aetherSentinel = sprites.mobAether;
  sprites.forestSpirit = sprites.mobTerra;
  sprites.celestialKnight = sprites.solariSentinel;
  sprites.solariBoss = sprites.bossSolari;
  sprites.umbriBoss = sprites.bossUmbri;
  sprites.aetherBoss = sprites.bossAether;
  sprites.terraBoss = sprites.graniteBoss;
  sprites.celestialArbiterNpc = sprites.aetherChronosNpc || sprites.heraldNpc;
  sprites.foresterSilasNpc = sprites.terraDruidNpc || sprites.heraldNpc;
  sprites.anglerFinnNpc = sprites.solariFlamekeeperNpc || sprites.heraldNpc;
}
