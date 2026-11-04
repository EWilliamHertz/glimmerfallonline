// ==========================================
// GlimmerFall Online 2D — 16-Bit Pixel Art Sprite, Biome Tileset & Paperdoll Synthesizer
// ==========================================

import { EQUIPMENT_CATALOG } from '../shared/protocol.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

function addPixelOutline(canvas, outlineHex = '#070a12') {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);

  const r = parseInt(outlineHex.slice(1, 3), 16);
  const g = parseInt(outlineHex.slice(3, 5), 16);
  const b = parseInt(outlineHex.slice(5, 7), 16);

  const isSolid = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return d[(y * w + x) * 4 + 3] > 20;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (d[idx + 3] === 0) {
        if (isSolid(x - 1, y) || isSolid(x + 1, y) || isSolid(x, y - 1) || isSolid(x, y + 1)) {
          out[idx] = r;
          out[idx + 1] = g;
          out[idx + 2] = b;
          out[idx + 3] = 255;
        }
      }
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function hash2d(x, y, seed = 1) {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

// ==========================================
// Dynamic 24x26 4-Directional Pixel Paperdoll Composer
// ==========================================
const paperdollCache = new Map();

const BASE_FACTION_PALETTES = {
  Solari: {
    capeDark: '#991b1b', capeMid: '#dc2626', capeHi: '#ef4444',
    bootDark: '#92400e', armorDark: '#d97706', armorHi: '#facc15',
    pauldron: '#f59e0b', pauldronHi: '#fef08a',
    helmDark: '#ca8a04', helmHi: '#fde047',
    plume: '#ef4444', plumeHi: '#fca5a5', eye: '#38bdf8',
  },
  Umbri: {
    capeDark: '#2e1065', capeMid: '#581c87', capeHi: '#7e22ce',
    bootDark: '#1e1b4b', armorDark: '#312e81', armorHi: '#7c3aed',
    pauldron: '#6b21a8', pauldronHi: '#d8b4fe',
    helmDark: '#3b0764', helmHi: '#9333ea',
    plume: '#e11d48', plumeHi: '#fda4af', eye: '#f43f5e',
  },
  Terra: {
    capeDark: '#14532d', capeMid: '#15803d', capeHi: '#22c55e',
    bootDark: '#422006', armorDark: '#3f6212', armorHi: '#4ade80',
    pauldron: '#65a30d', pauldronHi: '#bef264',
    helmDark: '#365314', helmHi: '#84cc16',
    plume: '#f59e0b', plumeHi: '#fef08a', eye: '#fde047',
  },
  Aether: {
    capeDark: '#1e3a8a', capeMid: '#1d4ed8', capeHi: '#3b82f6',
    bootDark: '#0c4a6e', armorDark: '#0369a1', armorHi: '#38bdf8',
    pauldron: '#0284c7', pauldronHi: '#bae6fd',
    helmDark: '#075985', helmHi: '#7dd3fc',
    plume: '#c084fc', plumeHi: '#f5d0fe', eye: '#fef08a',
  },
};

export function getCharacterSprites(faction = 'Solari', classId = 'solari_vanguard', equipment = {}) {
  const wepId = equipment?.weapon || 'solari_spellblade';
  const armId = equipment?.armor || 'sunforged_plate';
  const offId = equipment?.offhand || 'radiant_shield';
  const cacheKey = `${faction}|${classId}|${wepId}|${armId}|${offId}`;
  if (paperdollCache.has(cacheKey)) return paperdollCache.get(cacheKey);

  const basePal = BASE_FACTION_PALETTES[faction] || BASE_FACTION_PALETTES.Solari;
  const armSpec = EQUIPMENT_CATALOG[armId];
  const wepSpec = EQUIPMENT_CATALOG[wepId] || EQUIPMENT_CATALOG.solari_spellblade;
  const offSpec = EQUIPMENT_CATALOG[offId] || EQUIPMENT_CATALOG.radiant_shield;

  const armorDark = armSpec?.armorDark || basePal.armorDark;
  const armorHi = armSpec?.armorHi || basePal.armorHi;
  const capeMid = armSpec?.capeColor || basePal.capeMid;

  const out = { down: [], up: [], left: [], right: [] };
  const dirs = ['down', 'up', 'left', 'right'];

  for (const dir of dirs) {
    for (let f = 0; f < 3; f++) {
      const { c, ctx } = makeCanvas(24, 26);
      const stepL = f === 1 ? -1 : f === 2 ? 1 : 0;
      const stepR = -stepL;
      const bob = f === 0 ? 0 : -1;

      if (dir !== 'up') {
        rect(ctx, 7, 11 + bob, 10, 10, basePal.capeDark);
        rect(ctx, 8, 12 + bob, 8, 8, capeMid);
      }

      // Boots
      rect(ctx, 8, 21 + Math.max(0, stepL), 3, 4, basePal.bootDark);
      rect(ctx, 13, 21 + Math.max(0, stepR), 3, 4, basePal.bootDark);
      rect(ctx, 8, 21 + Math.max(0, stepL), 2, 2, armorHi);
      rect(ctx, 13, 21 + Math.max(0, stepR), 2, 2, armorHi);

      // Paperdoll Armor Chestplate / Robes
      rect(ctx, 7, 12 + bob, 10, 9, armorDark);
      rect(ctx, 8, 13 + bob, 8, 7, armorHi);
      if (dir === 'down') {
        rect(ctx, 11, 15 + bob, 2, 2, basePal.eye);
        rect(ctx, 9, 19 + bob, 6, 2, basePal.bootDark);
      }

      // Pauldrons
      rect(ctx, 5, 11 + bob, 4, 4, armorDark);
      rect(ctx, 6, 11 + bob, 2, 2, basePal.pauldronHi);
      rect(ctx, 15, 11 + bob, 4, 4, armorDark);
      rect(ctx, 16, 11 + bob, 2, 2, basePal.pauldronHi);

      // Class-Distinct Headgear Silhouette!
      rect(ctx, 7, 4 + bob, 10, 8, basePal.helmDark);
      rect(ctx, 8, 5 + bob, 8, 6, basePal.helmHi);

      if (classId === 'aurora_marshal') {
        // Radiant Halo + Winglets
        rect(ctx, 9, 1 + bob, 6, 2, '#fef08a');
        rect(ctx, 5, 5 + bob, 2, 4, '#ffffff');
        rect(ctx, 17, 5 + bob, 2, 4, '#ffffff');
      } else if (classId === 'umbral_assassin') {
        // Pointed Shadow Hood
        rect(ctx, 8, 2 + bob, 8, 3, '#3b0764');
        rect(ctx, 10, 1 + bob, 4, 2, '#581c87');
      } else if (classId === 'graveglass_oracle') {
        // Twin Void Horns
        rect(ctx, 6, 1 + bob, 2, 4, '#e879f9');
        rect(ctx, 16, 1 + bob, 2, 4, '#e879f9');
      } else if (classId === 'forest_warden') {
        // Verdant Stag Antlers
        rect(ctx, 5, 1 + bob, 2, 4, '#a3e635');
        px(ctx, 7, 2 + bob, '#bef264');
        rect(ctx, 17, 1 + bob, 2, 4, '#a3e635');
        px(ctx, 16, 2 + bob, '#bef264');
      } else if (classId === 'stonekin_elder') {
        // Heavy Granite Crest
        rect(ctx, 7, 2 + bob, 10, 3, '#64748b');
        rect(ctx, 9, 1 + bob, 6, 2, '#4ade80');
      } else if (classId === 'chronomancer_sage') {
        // Astral Spire Wizard Hat
        rect(ctx, 6, 4 + bob, 12, 2, '#1e3a8a');
        rect(ctx, 9, 1 + bob, 6, 3, '#0284c7');
        rect(ctx, 11, 0 + bob, 2, 2, '#7dd3fc');
      } else if (classId === 'nexus_weaver') {
        // Floating Star Crown
        rect(ctx, 9, 2 + bob, 6, 2, '#38bdf8');
        px(ctx, 11, 0 + bob, '#ffffff');
      } else {
        // Solari Vanguard Plume
        rect(ctx, 10, 1 + bob, 4, 3, basePal.plume);
        rect(ctx, 11, 0 + bob, 2, 2, basePal.plumeHi);
      }

      // Eyes / Visor
      if (dir === 'down') {
        rect(ctx, 9, 7 + bob, 6, 2, '#0f172a');
        px(ctx, 9, 7 + bob, basePal.eye);
        px(ctx, 14, 7 + bob, basePal.eye);
      } else if (dir === 'left') {
        rect(ctx, 7, 7 + bob, 4, 2, '#0f172a');
        px(ctx, 8, 7 + bob, basePal.eye);
      } else if (dir === 'right') {
        rect(ctx, 13, 7 + bob, 4, 2, '#0f172a');
        px(ctx, 15, 7 + bob, basePal.eye);
      }

      if (dir === 'up') {
        rect(ctx, 7, 11 + bob, 10, 11, basePal.capeDark);
        rect(ctx, 9, 12 + bob, 6, 9, capeMid);
        rect(ctx, 10, 14 + bob, 4, 4, offSpec.trimColor || '#fde047');
      }

      // Paperdoll Weapon & Offhand Positioning
      const wepOnRight = dir === 'down' || dir === 'right';
      const wx = wepOnRight ? 19 : 3;
      const ox = wepOnRight ? 3 : 17;

      // Render Equipped Weapon Style!
      const wCol = wepSpec.bladeColor || '#fde047';
      const hCol = wepSpec.hiltColor || '#92400e';
      if (wepSpec.style === 'scythe') {
        rect(ctx, wx, 3 + bob, 2, 14, hCol);
        if (wepOnRight) {
          rect(ctx, wx - 4, 2 + bob, 6, 3, wCol);
          rect(ctx, wx - 5, 4 + bob, 2, 3, '#ffffff');
        } else {
          rect(ctx, wx, 2 + bob, 6, 3, wCol);
          rect(ctx, wx + 5, 4 + bob, 2, 3, '#ffffff');
        }
      } else if (wepSpec.style === 'maul') {
        rect(ctx, wx, 6 + bob, 2, 11, hCol);
        rect(ctx, wx - 2, 3 + bob, 6, 5, '#475569');
        rect(ctx, wx - 1, 4 + bob, 4, 3, wCol);
      } else if (wepSpec.style === 'staff') {
        rect(ctx, wx, 5 + bob, 2, 13, hCol);
        rect(ctx, wx - 1, 2 + bob, 4, 4, wCol);
        rect(ctx, wx, 3 + bob, 2, 2, '#ffffff');
      } else if (wepSpec.style === 'greatsword') {
        rect(ctx, wx - 1, 2 + bob, 3, 13, wCol);
        rect(ctx, wx, 2 + bob, 1, 11, '#ffffff');
        rect(ctx, wx - 2, 14 + bob, 5, 2, hCol);
      } else {
        // Spellblade
        rect(ctx, wx, 4 + bob, 2, 11, wCol);
        rect(ctx, wx, 3 + bob, 1, 9, '#ffffff');
        rect(ctx, wx - 1, 14 + bob, 4, 1, hCol);
      }

      // Render Equipped Offhand / Shield / Focus!
      const oMain = offSpec.mainColor || '#0284c7';
      const oTrim = offSpec.trimColor || '#facc15';
      if (offSpec.style === 'orb') {
        rect(ctx, ox, 13 + bob, 4, 4, oMain);
        rect(ctx, ox + 1, 14 + bob, 2, 2, oTrim);
        px(ctx, ox + 1, 12 + bob, '#ffffff');
      } else if (offSpec.style === 'mirror') {
        rect(ctx, ox, 12 + bob, 4, 7, oTrim);
        rect(ctx, ox + 1, 13 + bob, 2, 5, '#ffffff');
      } else {
        rect(ctx, ox, 13 + bob, 4, 6, oMain);
        rect(ctx, ox + 1, 14 + bob, 2, 4, oTrim);
      }

      out[dir].push(addPixelOutline(c));
    }
  }

  paperdollCache.set(cacheKey, out);
  return out;
}

export function buildSpriteSheet() {
  const sprites = {
    tiles: {},
    hero: null,
    heroByFaction: {},
    heraldNpc: [],
    cartographerNpc: [],
    warzoneArchonNpc: [],
    solariCaptainNpc: [],
    solariFlamekeeperNpc: [],
    shadowBrokerNpc: [],
    shadowWraithmotherNpc: [],
    terraHerbalistNpc: [],
    terraElderDruidNpc: [],
    aetherAstromancerNpc: [],
    aetherChronosNpc: [],
    shadowNpc: [],
    druidNpc: [],
    chronoNpc: [],
    npcPortraits: {},
    allyPaladin: [],
    allyMage: [],
    dummy: [],
    node: [],
    nodeEmpty: null,
    portal: [],
    nexusBlue: [],
    nexusRed: [],
    nexusCyan: [],
    nexusGold: [],
    nexusPurple: [],
    nexusGreen: [],
    siegeShard: [],
    voidStalker: [],
    duskFiend: [],
    mobSolari: [],
    mobTerra: [],
    mobAether: [],
    graniteBoss: [],
    bossSolari: [],
    bossUmbri: [],
    bossAether: [],
    props: {},
  };

  // ==========================================
  // 1. TERRAIN TILES (Sanctuary, Warzone, Arena + All 4 Faction Biomes)
  // ==========================================
  // Sanctuary Grass
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#15342b');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 10 + v);
        if (r < 0.16) px(ctx, x, y, '#1d4739');
        else if (r < 0.24) px(ctx, x, y, '#0f261f');
        else if (r > 0.96) px(ctx, x, y, '#2b6a52');
      }
    }
    const bx = (v * 5 + 3) % 13;
    const by = (v * 7 + 4) % 12;
    px(ctx, bx, by, '#34d399');
    px(ctx, bx + 1, by + 1, '#10b981');
    if (v === 2) {
      px(ctx, 11, 5, '#facc15');
      px(ctx, 11, 6, '#10b981');
    }
    sprites.tiles[`sanctuary_grass_${v}`] = c;
  }

  // Flagstone Path
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#2a3142');
    rect(ctx, 0, 0, 16, 1, '#151924');
    rect(ctx, 0, 8, 16, 1, '#151924');
    rect(ctx, v === 0 ? 7 : 11, 0, 1, 8, '#151924');
    rect(ctx, v === 0 ? 3 : 7, 8, 1, 8, '#151924');
    rect(ctx, 1, 1, 5, 1, '#3b455e');
    rect(ctx, 5, 9, 6, 1, '#3b455e');
    if (v === 1) {
      px(ctx, 4, 4, '#ca8a04');
      px(ctx, 12, 12, '#eab308');
    }
    sprites.tiles[`flagstone_${v}`] = c;
  }

  // Warzone Obsidian Slate
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#111625');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 40 + v);
        if (r < 0.18) px(ctx, x, y, '#182036');
        else if (r < 0.26) px(ctx, x, y, '#0b0e18');
      }
    }
    if (v === 2) {
      px(ctx, 3, 4, '#0284c7');
      px(ctx, 4, 4, '#38bdf8');
      px(ctx, 5, 5, '#0284c7');
    } else if (v === 3) {
      px(ctx, 11, 10, '#6b21a8');
      px(ctx, 12, 10, '#a855f7');
    }
    sprites.tiles[`warzone_${v}`] = c;
  }

  // Biome 1: Solari — Lantern District & Golden Citadel (Sunforged Ivory/Gold Marble)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#2d2618');
    rect(ctx, 0, 0, 16, 1, '#1c170d');
    rect(ctx, 0, 0, 1, 16, '#1c170d');
    rect(ctx, 1, 1, 14, 1, '#453922');
    if (v === 1 || v === 3) {
      rect(ctx, 6, 6, 4, 4, '#713f12');
      rect(ctx, 7, 7, 2, 2, '#eab308');
    } else if (v === 2) {
      px(ctx, 4, 11, '#ca8a04');
      px(ctx, 11, 4, '#facc15');
    }
    sprites.tiles[`solari_${v}`] = c;
  }

  // Biome 2: Umbri — Sepulcher Undercity & Duskveil Bog
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#140d24');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 70 + v);
        if (r < 0.16) px(ctx, x, y, '#1f1438');
        else if (r < 0.24) px(ctx, x, y, '#0c0717');
      }
    }
    if (v === 2) {
      rect(ctx, 4, 8, 5, 3, '#3b0764');
      px(ctx, 6, 9, '#a855f7');
    } else if (v === 3) {
      px(ctx, 10, 5, '#7e22ce');
      px(ctx, 11, 6, '#c084fc');
    }
    sprites.tiles[`umbri_${v}`] = c;
  }

  // Biome 3: Terra — Glimmer Orchard & Rootdeep Expanse
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#132a17');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 90 + v);
        if (r < 0.2) px(ctx, x, y, '#1b3d22');
        else if (r < 0.28) px(ctx, x, y, '#0d1f10');
      }
    }
    if (v === 1) {
      px(ctx, 5, 5, '#4ade80');
      px(ctx, 6, 6, '#22c55e');
    } else if (v === 2) {
      px(ctx, 10, 9, '#fde047'); // Glimmer blossom
      px(ctx, 10, 10, '#4ade80');
    } else if (v === 3) {
      rect(ctx, 3, 12, 5, 2, '#3f6212');
    }
    sprites.tiles[`terra_${v}`] = c;
  }

  // Biome 4: Aether — Mirrorgate Spire & Fractured Continuum
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0b192e');
    rect(ctx, 0, 0, 16, 1, '#07101f');
    rect(ctx, 0, 0, 1, 16, '#07101f');
    rect(ctx, 1, 1, 14, 1, '#132a4a');
    if (v === 1) {
      rect(ctx, 7, 7, 2, 2, '#0284c7');
      px(ctx, 7, 7, '#7dd3fc');
    } else if (v === 2) {
      px(ctx, 4, 5, '#38bdf8');
      px(ctx, 12, 11, '#818cf8');
    }
    sprites.tiles[`aether_${v}`] = c;
  }

  // Arena Tiles
  const makeArenaTile = (base, hi, accent) => {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, base);
    rect(ctx, 0, 0, 16, 1, '#0b0f1a');
    rect(ctx, 0, 0, 1, 16, '#0b0f1a');
    rect(ctx, 1, 1, 14, 1, hi);
    px(ctx, 7, 7, accent);
    px(ctx, 8, 7, accent);
    px(ctx, 7, 8, accent);
    px(ctx, 8, 8, accent);
    return c;
  };
  sprites.tiles.arena_neutral = makeArenaTile('#1b2234', '#28324c', '#475569');
  sprites.tiles.arena_blue = makeArenaTile('#132946', '#1d3e69', '#38bdf8');
  sprites.tiles.arena_red = makeArenaTile('#3b1622', '#592032', '#ef4444');

  // Calm Deep Astral Water Border (NO bright strobing pixels — completely flash-free!)
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#060c1a');
    for (let y = 0; y < 16; y += 4) {
      const shift = (y + f * 4) % 12;
      rect(ctx, shift, y, 5, 1, '#0f2042');
      px(ctx, (shift + 2) % 16, y + 1, '#173161');
    }
    sprites.tiles[`void_sea_${f}`] = c;
  }

  // Granite Mountain Crag Tiles (Rugged Mountain Ranges & Passes)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#28313e');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 120 + v);
        if (r < 0.22) px(ctx, x, y, '#1e2530');
        else if (r < 0.35) px(ctx, x, y, '#374254');
        else if (r > 0.88) px(ctx, x, y, '#4b5970');
      }
    }
    // Jagged facet ridges
    if (v === 0) {
      rect(ctx, 2, 4, 6, 2, '#4b5970');
      rect(ctx, 8, 8, 5, 2, '#1e2530');
    } else if (v === 1) {
      rect(ctx, 4, 10, 8, 2, '#4b5970');
      px(ctx, 11, 3, '#64748b');
    } else if (v === 2) {
      rect(ctx, 3, 2, 7, 2, '#374254');
      rect(ctx, 7, 9, 6, 2, '#1e2530');
    } else {
      px(ctx, 5, 5, '#64748b');
      px(ctx, 12, 12, '#1e2530');
    }
    sprites.tiles[`mountain_rock_${v}`] = c;
  }

  // Snow-Dusted High Mountain Peaks
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#334155');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 150 + v);
        if (r < 0.25) px(ctx, x, y, '#1e293b');
        else if (r < 0.45) px(ctx, x, y, '#475569');
        else if (r > 0.82) px(ctx, x, y, '#cbd5e1'); // Snow dusting
      }
    }
    if (v === 0 || v === 2) {
      rect(ctx, 4, 2, 8, 2, '#f1f5f9');
      rect(ctx, 5, 4, 5, 1, '#cbd5e1');
    } else {
      rect(ctx, 6, 6, 6, 2, '#f1f5f9');
    }
    sprites.tiles[`mountain_peak_${v}`] = c;
  }

  // Rushing Valley River Water (Flowing Streams & Valley Basins)
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0284c7');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 200 + f);
        if (r < 0.28) px(ctx, x, y, '#0369a1');
        else if (r > 0.88) px(ctx, x, y, '#38bdf8');
      }
    }
    // Flowing foam ripples
    const offset = f * 3;
    rect(ctx, (2 + offset) % 16, 3, 5, 1, '#bae6fd');
    rect(ctx, (8 + offset) % 16, 8, 6, 1, '#e0f2fe');
    rect(ctx, (1 + offset) % 16, 13, 4, 1, '#bae6fd');
    sprites.tiles[`river_water_${f}`] = c;
  }

  // Wooden Bridge Planks (Crossing Mountain Chasm & Rivers)
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#78350f');
    // Horizontal wood planks
    rect(ctx, 0, 0, 16, 1, '#451a03');
    rect(ctx, 0, 4, 16, 1, '#451a03');
    rect(ctx, 0, 8, 16, 1, '#451a03');
    rect(ctx, 0, 12, 16, 1, '#451a03');
    // Wood grain highlights
    rect(ctx, 2, 2, 12, 1, '#92400e');
    rect(ctx, 3, 6, 10, 1, '#92400e');
    rect(ctx, 1, 10, 14, 1, '#92400e');
    rect(ctx, 4, 14, 8, 1, '#92400e');
    // Iron bolts / rivets on plank ends
    px(ctx, 1, 2, '#d97706');
    px(ctx, 14, 2, '#d97706');
    px(ctx, 1, 10, '#d97706');
    px(ctx, 14, 10, '#d97706');
    sprites.tiles[`bridge_wood_${v}`] = c;
  }

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

  // ==========================================
  // 3. DEFAULT FACTION HERO SPRITES (Via Paperdoll Composer)
  // ==========================================
  sprites.heroByFaction.Solari = getCharacterSprites('Solari', 'solari_vanguard', {
    weapon: 'solari_spellblade', armor: 'sunforged_plate', offhand: 'radiant_shield',
  });
  sprites.heroByFaction.Umbri = getCharacterSprites('Umbri', 'umbral_assassin', {
    weapon: 'scythe_soulreaper', armor: 'duskveil_shroud', offhand: 'graveglass_lantern',
  });
  sprites.heroByFaction.Terra = getCharacterSprites('Terra', 'forest_warden', {
    weapon: 'ironwood_maul', armor: 'ironwood_armor', offhand: 'bramble_buckler',
  });
  sprites.heroByFaction.Aether = getCharacterSprites('Aether', 'chronomancer_sage', {
    weapon: 'chronocore_staff', armor: 'starweave_robe', offhand: 'mirror_shield',
  });
  sprites.hero = sprites.heroByFaction.Solari;

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

  // Portrait Aliases
  sprites.npcPortraits.shadowNpc = sprites.npcPortraits.shadowBrokerNpc;
  sprites.npcPortraits.druidNpc = sprites.npcPortraits.terraHerbalistNpc;
  sprites.npcPortraits.chronoNpc = sprites.npcPortraits.aetherAstromancerNpc;

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

  // Seamless Aliases for Mobs & Bosses (Both offline and server authoritative names)
  sprites.solariSentinel = sprites.mobSolari;
  sprites.terraWarden = sprites.mobTerra;
  sprites.aetherWeaver = sprites.mobAether;
  sprites.solariBoss = sprites.bossSolari;
  sprites.umbriBoss = sprites.bossUmbri;
  sprites.aetherBoss = sprites.bossAether;

  return sprites;
}

const bannerCache = new Map();
export function getOrderBannerSprites(colorHex = '#facc15') {
  const key = colorHex.toLowerCase();
  if (bannerCache.has(key)) return bannerCache.get(key);

  const frames = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(22, 34);
    rect(ctx, 7, 29, 8, 3, '#475569');
    rect(ctx, 9, 4, 2, 26, '#d97706');
    rect(ctx, 9, 4, 1, 25, '#fde047');
    rect(ctx, 8, 2, 4, 3, '#fef08a');
    px(ctx, 9, 1, '#ffffff');

    const wave = f === 0 ? 0 : 1;
    rect(ctx, 11, 6, 9, 15, colorHex);
    rect(ctx, 12, 7 + wave, 7, 11, '#0f172a');
    rect(ctx, 13, 8 + wave, 5, 9, colorHex);
    rect(ctx, 14, 11 + wave, 3, 3, '#ffffff');
    rect(ctx, 11, 21, 3, 3 - wave, colorHex);
    rect(ctx, 17, 21, 3, 2 + wave, colorHex);

    frames.push(addPixelOutline(c));
  }
  bannerCache.set(key, frames);
  return frames;
}

export function pixelateCardImage(imgUrl, targetCanvas) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const tmp = document.createElement('canvas');
    tmp.width = 48;
    tmp.height = 64;
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(img, 0, 0, 48, 64);

    const ctx = targetCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(tmp, 0, 0, targetCanvas.width, targetCanvas.height);
  };
  img.src = imgUrl;
}
