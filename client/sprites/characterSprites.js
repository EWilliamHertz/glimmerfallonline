import { EQUIPMENT_CATALOG, CLASSES_CATALOG } from "../../shared/protocol.js";
import { makeCanvas, px, rect, addPixelOutline } from "./pixelCanvas.js";

// ==========================================
// Dynamic 26x28 4-Directional Pixel Paperdoll Composer
// Canonical GlimmerFall V1.0 Heroic Sprite Sheet Design
// ==========================================
const paperdollCache = new Map();

export const BASE_FACTION_PALETTES = {
  Solari: {
    // Official Palette from Pixel_art_animation_sheet: Cyan hair, Gold plate, Purple cape
    capeDark: '#4c1d95', capeMid: '#a855f8', capeHi: '#c084fc',
    bootDark: '#451a03', armorDark: '#ca8a04', armorHi: '#facc15',
    armorShade: '#78350f', armorGlint: '#fef08a',
    pauldron: '#ca8a04', pauldronHi: '#fef08a',
    helmDark: '#a16207', helmHi: '#facc15',
    hairDark: '#0284c7', hairMid: '#38bdf8', hairHi: '#7dd3fc',
    plume: '#38bdf8', plumeHi: '#7dd3fc', eye: '#38bdf8',
    circlet: '#facc15', circletHi: '#fef08a',
    skin: '#fed7aa', skinHi: '#ffedd5',
  },
  Umbri: {
    capeDark: '#1e1b4b', capeMid: '#6b21a8', capeHi: '#a855f8',
    bootDark: '#0f172a', armorDark: '#1e1b4b', armorHi: '#4338ca',
    armorShade: '#0f172a', armorGlint: '#c084fc',
    pauldron: '#4c1d95', pauldronHi: '#d8b4fe',
    helmDark: '#1e1b4b', helmHi: '#6366f1',
    hairDark: '#4a044e', hairMid: '#c026d3', hairHi: '#f0abfc',
    plume: '#e879f9', plumeHi: '#f5d0fe', eye: '#f43f5e',
    circlet: '#9333ea', circletHi: '#d8b4fe',
    skin: '#e2e8f0', skinHi: '#f8fafc',
  },
  Terra: {
    capeDark: '#14532d', capeMid: '#16a34a', capeHi: '#4ade80',
    bootDark: '#365314', armorDark: '#365314', armorHi: '#65a30d',
    armorShade: '#1a2e05', armorGlint: '#bef264',
    pauldron: '#4d7c0f', pauldronHi: '#d9f99d',
    helmDark: '#365314', helmHi: '#84cc16',
    hairDark: '#78350f', hairMid: '#b45309', hairHi: '#fde047',
    plume: '#84cc16', plumeHi: '#bef264', eye: '#fde047',
    circlet: '#65a30d', circletHi: '#bef264',
    skin: '#fde68a', skinHi: '#fef3c7',
  },
  Aether: {
    capeDark: '#1e3a8a', capeMid: '#2563eb', capeHi: '#60a5fa',
    bootDark: '#0f172a', armorDark: '#0369a1', armorHi: '#0284c7',
    armorShade: '#082f49', armorGlint: '#e0f2fe',
    pauldron: '#0284c7', pauldronHi: '#bae6fd',
    helmDark: '#075985', helmHi: '#38bdf8',
    hairDark: '#334155', hairMid: '#94a3b8', hairHi: '#f8fafc',
    plume: '#38bdf8', plumeHi: '#bae6fd', eye: '#67e8f9',
    circlet: '#0284c7', circletHi: '#e0f2fe',
    skin: '#fed7aa', skinHi: '#ffedd5',
  },
};

export function getCharacterSprites(faction = 'Solari', classId = 'solari_vanguard', equipment = {}) {
  const cleanFac = String(faction || '').trim().toLowerCase();
  let canonicalFac = 'Solari';
  if (cleanFac === 'terra' || cleanFac === 'terro' || cleanFac === 'earth' || cleanFac === 'root') canonicalFac = 'Terra';
  else if (cleanFac === 'umbri' || cleanFac === 'shadow' || cleanFac === 'void') canonicalFac = 'Umbri';
  else if (cleanFac === 'aether' || cleanFac === 'magic' || cleanFac === 'arcane') canonicalFac = 'Aether';

  const clsSpec = CLASSES_CATALOG[classId] || Object.values(CLASSES_CATALOG).find(c => c.faction === canonicalFac) || CLASSES_CATALOG.solari_vanguard;
  const defEquip = clsSpec?.defaultEquipment || {};

  const wepId = equipment?.weapon || defEquip.weapon || 'solari_spellblade';
  const armId = equipment?.body || equipment?.armor || defEquip.armor || 'sunforged_plate';
  const offId = equipment?.shield || equipment?.offhand || defEquip.offhand || 'radiant_shield';
  const cacheKey = `${canonicalFac}|${clsSpec.id}|${wepId}|${armId}|${offId}`;
  if (paperdollCache.has(cacheKey)) return paperdollCache.get(cacheKey);

  const basePal = BASE_FACTION_PALETTES[canonicalFac] || BASE_FACTION_PALETTES.Solari;
  const armSpec = EQUIPMENT_CATALOG[armId];
  const wepSpec = EQUIPMENT_CATALOG[wepId] || EQUIPMENT_CATALOG[defEquip.weapon] || EQUIPMENT_CATALOG.solari_spellblade;
  const offSpec = EQUIPMENT_CATALOG[offId] || EQUIPMENT_CATALOG[defEquip.offhand] || EQUIPMENT_CATALOG.radiant_shield;

  const armorDark = armSpec?.armorDark || basePal.armorDark;
  const armorHi = armSpec?.armorHi || basePal.armorHi;
  const armorShade = basePal.armorShade || '#78350f';
  const armorGlint = basePal.armorGlint || '#fef08a';
  const capeDark = basePal.capeDark || '#4c1d95';
  const capeMid = armSpec?.capeColor || basePal.capeMid;
  const capeHi = basePal.capeHi || '#c084fc';

  const out = { down: [], up: [], left: [], right: [] };
  const dirs = ['down', 'up', 'left', 'right'];

  for (const dir of dirs) {
    for (let f = 0; f < 3; f++) {
      const { c, ctx } = makeCanvas(26, 28);
      const isWalk = f > 0;
      const stepL = f === 1 ? -1 : f === 2 ? 1 : 0;
      const stepR = -stepL;
      const bob = isWalk ? -1 : 0;

      // ==========================================
      // 1. CAPE (Drawn behind body in Down & Side views)
      // ==========================================
      if (dir === 'down') {
        // Billowing royal purple cape visible flaring out behind both shoulders/hips
        rect(ctx, 4, 11 + bob, 4, 12, capeDark);
        rect(ctx, 5, 12 + bob, 3, 10, capeMid);
        px(ctx, 5, 13 + bob, capeHi);

        rect(ctx, 18, 11 + bob, 4, 12, capeDark);
        rect(ctx, 18, 12 + bob, 3, 10, capeMid);
        px(ctx, 20, 13 + bob, capeHi);
      } else if (dir === 'right') {
        // Dynamic wind-swept purple cape trailing behind to the left
        const sway = f === 1 ? -1 : f === 2 ? 1 : 0;
        rect(ctx, 2 + sway, 11 + bob, 8, 13, capeDark);
        rect(ctx, 3 + sway, 12 + bob, 6, 11, capeMid);
        rect(ctx, 4 + sway, 13 + bob, 3, 8, capeHi);
      } else if (dir === 'left') {
        // Dynamic wind-swept purple cape trailing behind to the right
        const sway = f === 1 ? 1 : f === 2 ? -1 : 0;
        rect(ctx, 16 + sway, 11 + bob, 8, 13, capeDark);
        rect(ctx, 17 + sway, 12 + bob, 6, 11, capeMid);
        rect(ctx, 19 + sway, 13 + bob, 3, 8, capeHi);
      }

      // ==========================================
      // 2. LEGS, GREAVES & BOOTS
      // ==========================================
      if (dir === 'down') {
        // Left boot & greave
        rect(ctx, 8, 20 + Math.max(0, stepL), 4, 6, armorDark);
        rect(ctx, 8, 20 + Math.max(0, stepL), 3, 5, armorHi);
        rect(ctx, 8, 24 + Math.max(0, stepL), 4, 2, basePal.bootDark);
        px(ctx, 8, 21 + Math.max(0, stepL), armorGlint);

        // Right boot & greave
        rect(ctx, 14, 20 + Math.max(0, stepR), 4, 6, armorDark);
        rect(ctx, 15, 20 + Math.max(0, stepR), 3, 5, armorHi);
        rect(ctx, 14, 24 + Math.max(0, stepR), 4, 2, basePal.bootDark);
        px(ctx, 17, 21 + Math.max(0, stepR), armorGlint);
      } else if (dir === 'up') {
        // Armored back sabatons
        rect(ctx, 8, 22 + Math.max(0, stepL), 4, 4, armorDark);
        rect(ctx, 9, 22 + Math.max(0, stepL), 2, 3, armorHi);
        rect(ctx, 8, 24 + Math.max(0, stepL), 4, 2, basePal.bootDark);

        rect(ctx, 14, 22 + Math.max(0, stepR), 4, 4, armorDark);
        rect(ctx, 15, 22 + Math.max(0, stepR), 2, 3, armorHi);
        rect(ctx, 14, 24 + Math.max(0, stepR), 4, 2, basePal.bootDark);
      } else if (dir === 'right') {
        // Staggered stride boots
        rect(ctx, 10 + stepL, 21 + bob, 4, 5, armorDark);
        rect(ctx, 11 + stepL, 21 + bob, 3, 4, armorHi);
        rect(ctx, 10 + stepL, 24 + bob, 5, 2, basePal.bootDark);

        rect(ctx, 14 + stepR, 21 + bob, 4, 5, armorDark);
        rect(ctx, 15 + stepR, 21 + bob, 3, 4, armorHi);
        rect(ctx, 14 + stepR, 24 + bob, 5, 2, basePal.bootDark);
      } else if (dir === 'left') {
        rect(ctx, 12 - stepL, 21 + bob, 4, 5, armorDark);
        rect(ctx, 12 - stepL, 21 + bob, 3, 4, armorHi);
        rect(ctx, 11 - stepL, 24 + bob, 5, 2, basePal.bootDark);

        rect(ctx, 8 - stepR, 21 + bob, 4, 5, armorDark);
        rect(ctx, 8 - stepR, 21 + bob, 3, 4, armorHi);
        rect(ctx, 7 - stepR, 24 + bob, 5, 2, basePal.bootDark);
      }

      // ==========================================
      // 3. TORSO & CHESTPLATE ARMOR
      // ==========================================
      if (dir === 'down') {
        // Waistbelt & Faulds
        rect(ctx, 8, 17 + bob, 10, 4, armorShade);
        rect(ctx, 9, 18 + bob, 8, 2, armorDark);
        rect(ctx, 11, 18 + bob, 4, 2, armorHi);

        // Gold Breastplate
        rect(ctx, 7, 10 + bob, 12, 8, armorDark);
        rect(ctx, 8, 11 + bob, 10, 6, armorHi);
        rect(ctx, 10, 11 + bob, 6, 5, armorGlint);

        // Central Starlight Gem / Solari Crest
        rect(ctx, 12, 12 + bob, 2, 3, '#ffffff');
        px(ctx, 12, 13 + bob, basePal.eye);
      } else if (dir === 'up') {
        // Full majestic cascading purple cape covering back from shoulders to calves!
        rect(ctx, 6, 9 + bob, 14, 15, capeDark);
        rect(ctx, 7, 10 + bob, 12, 13, capeMid);
        // Vertical pleats & starlight folds
        rect(ctx, 10, 11 + bob, 3, 11, capeHi);
        rect(ctx, 15, 11 + bob, 2, 11, capeHi);
        px(ctx, 12, 13 + bob, '#ffffff');
      } else if (dir === 'right') {
        rect(ctx, 9, 11 + bob, 9, 9, armorDark);
        rect(ctx, 11, 12 + bob, 6, 7, armorHi);
        px(ctx, 13, 13 + bob, armorGlint);
        rect(ctx, 9, 18 + bob, 7, 3, armorShade);
      } else if (dir === 'left') {
        rect(ctx, 8, 11 + bob, 9, 9, armorDark);
        rect(ctx, 9, 12 + bob, 6, 7, armorHi);
        px(ctx, 12, 13 + bob, armorGlint);
        rect(ctx, 10, 18 + bob, 7, 3, armorShade);
      }

      // ==========================================
      // 4. PAULDRONS (Heroic Golden Flared Shoulder Guards)
      // ==========================================
      if (dir === 'down' || dir === 'up') {
        // Left Pauldron
        rect(ctx, 4, 10 + bob, 5, 5, basePal.pauldron);
        rect(ctx, 5, 10 + bob, 3, 4, basePal.pauldronHi);
        px(ctx, 5, 10 + bob, armorGlint);

        // Right Pauldron
        rect(ctx, 17, 10 + bob, 5, 5, basePal.pauldron);
        rect(ctx, 18, 10 + bob, 3, 4, basePal.pauldronHi);
        px(ctx, 20, 10 + bob, armorGlint);
      } else if (dir === 'right') {
        // Prominent front shoulder guard
        rect(ctx, 11, 10 + bob, 5, 5, basePal.pauldron);
        rect(ctx, 12, 10 + bob, 3, 4, basePal.pauldronHi);
        px(ctx, 13, 10 + bob, armorGlint);
      } else if (dir === 'left') {
        rect(ctx, 10, 10 + bob, 5, 5, basePal.pauldron);
        rect(ctx, 11, 10 + bob, 3, 4, basePal.pauldronHi);
        px(ctx, 12, 10 + bob, armorGlint);
      }

      // ==========================================
      // 5. HEAD, HAIR & FACIAL FEATURES
      // ==========================================
      if (dir === 'down') {
        // High Ponytail & Hair Volume Behind Head
        rect(ctx, 9, 1 + bob, 8, 4, basePal.hairDark);
        rect(ctx, 10, 1 + bob, 6, 3, basePal.hairMid);
        rect(ctx, 11, 1 + bob, 4, 2, basePal.hairHi);

        // Face & Brow
        rect(ctx, 9, 4 + bob, 8, 6, basePal.skin);
        rect(ctx, 10, 4 + bob, 6, 5, basePal.skinHi);

        // Golden Headband / Circlet
        rect(ctx, 8, 4 + bob, 10, 2, basePal.circlet);
        rect(ctx, 11, 4 + bob, 4, 1, basePal.circletHi);

        // Flowing bangs framing the cheekbones
        rect(ctx, 7, 5 + bob, 2, 4, basePal.hairMid);
        rect(ctx, 17, 5 + bob, 2, 4, basePal.hairMid);

        // Piercing Eyes
        rect(ctx, 10, 7 + bob, 2, 1, '#0f172a');
        px(ctx, 11, 7 + bob, basePal.eye);

        rect(ctx, 14, 7 + bob, 2, 1, '#0f172a');
        px(ctx, 14, 7 + bob, basePal.eye);
      } else if (dir === 'up') {
        // Back of Head & Sweeping Cyan Ponytail Cascade
        rect(ctx, 9, 2 + bob, 8, 8, basePal.hairDark);
        rect(ctx, 10, 3 + bob, 6, 6, basePal.hairMid);
        rect(ctx, 11, 3 + bob, 4, 4, basePal.hairHi);

        // Gold clasp / Circlet across back of hair
        rect(ctx, 9, 5 + bob, 8, 2, basePal.circlet);
        px(ctx, 12, 5 + bob, basePal.circletHi);
      } else if (dir === 'right') {
        // Profile Face
        rect(ctx, 11, 4 + bob, 6, 6, basePal.skin);
        rect(ctx, 13, 5 + bob, 4, 4, basePal.skinHi);

        // Eye looking right
        px(ctx, 15, 6 + bob, '#0f172a');
        px(ctx, 16, 6 + bob, basePal.eye);

        // Golden Circlet on Forehead
        rect(ctx, 11, 4 + bob, 6, 2, basePal.circlet);
        px(ctx, 15, 4 + bob, basePal.circletHi);

        // Sweeping Long Cyan Ponytail trailing behind to the left (up & back)
        rect(ctx, 4, 2 + bob, 8, 4, basePal.hairDark);
        rect(ctx, 5, 2 + bob, 7, 3, basePal.hairMid);
        rect(ctx, 6, 1 + bob, 5, 2, basePal.hairHi);
        rect(ctx, 2, 4 + bob, 4, 3, basePal.hairMid);
      } else if (dir === 'left') {
        // Profile Face looking left
        rect(ctx, 9, 4 + bob, 6, 6, basePal.skin);
        rect(ctx, 9, 5 + bob, 4, 4, basePal.skinHi);

        // Eye looking left
        px(ctx, 10, 6 + bob, '#0f172a');
        px(ctx, 9, 6 + bob, basePal.eye);

        // Golden Circlet on Forehead
        rect(ctx, 9, 4 + bob, 6, 2, basePal.circlet);
        px(ctx, 10, 4 + bob, basePal.circletHi);

        // Sweeping Long Cyan Ponytail trailing behind to the right
        rect(ctx, 14, 2 + bob, 8, 4, basePal.hairDark);
        rect(ctx, 14, 2 + bob, 7, 3, basePal.hairMid);
        rect(ctx, 15, 1 + bob, 5, 2, basePal.hairHi);
        rect(ctx, 20, 4 + bob, 4, 3, basePal.hairMid);
      }

      // ==========================================
      // 6. CLASS SILHOUETTES & HEAD CRESTS
      // ==========================================
      if (classId === 'aurora_marshal') {
        // Radiant Golden Halo
        rect(ctx, 10, 0 + bob, 6, 1, '#fef08a');
        px(ctx, 9, 1 + bob, '#ffffff');
        px(ctx, 16, 1 + bob, '#ffffff');
      } else if (classId === 'umbral_assassin') {
        // Pointed Shadow Hood
        rect(ctx, 8, 2 + bob, 10, 3, '#3b0764');
        rect(ctx, 11, 1 + bob, 4, 2, '#581c87');
      } else if (classId === 'graveglass_oracle') {
        // Twin Void Horns
        rect(ctx, 7, 1 + bob, 2, 4, '#e879f9');
        rect(ctx, 17, 1 + bob, 2, 4, '#e879f9');
      } else if (classId === 'forest_warden') {
        // Verdant Antlers
        rect(ctx, 6, 1 + bob, 2, 4, '#a3e635');
        px(ctx, 8, 2 + bob, '#bef264');
        rect(ctx, 18, 1 + bob, 2, 4, '#a3e635');
        px(ctx, 17, 2 + bob, '#bef264');
      } else if (classId === 'stonekin_elder') {
        // Granite Horned Crown
        rect(ctx, 8, 2 + bob, 10, 2, '#64748b');
        px(ctx, 12, 1 + bob, '#4ade80');
      } else if (classId === 'chronomancer_sage') {
        // Astral Spire Wizard Brim
        rect(ctx, 7, 3 + bob, 12, 2, '#1e3a8a');
        rect(ctx, 11, 0 + bob, 4, 3, '#0284c7');
        px(ctx, 12, 0 + bob, '#7dd3fc');
      } else if (classId === 'nexus_weaver') {
        // Floating Star Shard Ring
        px(ctx, 7, 2 + bob, '#38bdf8');
        px(ctx, 12, 0 + bob, '#ffffff');
        px(ctx, 18, 2 + bob, '#38bdf8');
      }

      // ==========================================
      // 7. WEAPON & OFFHAND (Silver Sword & Heraldic Purple Shield)
      // ==========================================
      const wepOnRight = dir === 'down' || dir === 'right';
      const wx = wepOnRight ? 21 : 2;
      const ox = wepOnRight ? 2 : 21;

      // Weapon: Silver blade with gold crossguard
      const wCol = wepSpec.bladeColor || '#ffffff';
      const hCol = wepSpec.hiltColor || '#facc15';

      if (dir === 'right') {
        // Heroic forward blade pointing right
        rect(ctx, 17, 13 + bob, 3, 2, hCol);
        rect(ctx, 20, 14 + bob, 5, 2, '#e2e8f0');
        rect(ctx, 20, 14 + bob, 4, 1, '#ffffff');
        px(ctx, 25, 14 + bob, '#7dd3fc');
      } else if (dir === 'left') {
        // Forward blade pointing left
        rect(ctx, 6, 13 + bob, 3, 2, hCol);
        rect(ctx, 1, 14 + bob, 5, 2, '#e2e8f0');
        rect(ctx, 2, 14 + bob, 4, 1, '#ffffff');
        px(ctx, 0, 14 + bob, '#7dd3fc');
      } else if (wepSpec.style === 'scythe') {
        rect(ctx, wx, 3 + bob, 2, 15, hCol);
        rect(ctx, wx - 4, 2 + bob, 6, 3, wCol);
        rect(ctx, wx - 5, 4 + bob, 2, 3, '#ffffff');
      } else if (wepSpec.style === 'maul') {
        rect(ctx, wx, 6 + bob, 2, 12, hCol);
        rect(ctx, wx - 2, 3 + bob, 6, 5, '#475569');
        rect(ctx, wx - 1, 4 + bob, 4, 3, wCol);
      } else if (wepSpec.style === 'staff') {
        rect(ctx, wx, 4 + bob, 2, 15, hCol);
        rect(ctx, wx - 1, 1 + bob, 4, 4, wCol);
        rect(ctx, wx, 2 + bob, 2, 2, '#ffffff');
      } else {
        // Longsword / Spellblade: Gleaming double-edged silver blade + gold hilt
        rect(ctx, wx, 13 + bob, 3, 2, hCol);
        rect(ctx, wx + 1, 6 + bob, 2, 8, '#e2e8f0');
        rect(ctx, wx + 1, 5 + bob, 1, 9, '#ffffff');
        px(ctx, wx + 1, 4 + bob, '#7dd3fc');
      }

      // Offhand / Shield: Heraldic purple shield with golden trim
      const oMain = offSpec.mainColor || '#7e22ce';
      const oTrim = offSpec.trimColor || '#facc15';

      if (dir === 'right') {
        // Shield held defensively on offhand
        rect(ctx, 7, 12 + bob, 4, 7, oTrim);
        rect(ctx, 8, 13 + bob, 2, 5, oMain);
        px(ctx, 8, 14 + bob, '#ffffff');
      } else if (dir === 'left') {
        rect(ctx, 15, 12 + bob, 4, 7, oTrim);
        rect(ctx, 16, 13 + bob, 2, 5, oMain);
        px(ctx, 17, 14 + bob, '#ffffff');
      } else if (offSpec.style === 'orb') {
        rect(ctx, ox, 12 + bob, 4, 4, oMain);
        rect(ctx, ox + 1, 13 + bob, 2, 2, oTrim);
        px(ctx, ox + 1, 11 + bob, '#ffffff');
      } else if (offSpec.style === 'mirror') {
        rect(ctx, ox, 11 + bob, 4, 8, oTrim);
        rect(ctx, ox + 1, 12 + bob, 2, 6, '#ffffff');
      } else {
        // Heater Shield
        rect(ctx, ox, 11 + bob, 4, 8, oTrim);
        rect(ctx, ox + 1, 12 + bob, 2, 6, oMain);
        px(ctx, ox + 1, 14 + bob, '#ffffff');
        px(ctx, ox + 1, 15 + bob, '#7dd3fc');
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

