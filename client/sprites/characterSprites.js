import { EQUIPMENT_CATALOG } from "../../shared/protocol.js";
import { makeCanvas, px, rect, addPixelOutline } from "./pixelCanvas.js";

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
  const armId = equipment?.body || equipment?.armor || 'sunforged_plate';
  const offId = equipment?.shield || equipment?.offhand || 'radiant_shield';
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

