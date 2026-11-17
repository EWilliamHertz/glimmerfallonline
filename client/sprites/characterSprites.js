import { EQUIPMENT_CATALOG, CLASSES_CATALOG } from "../../shared/protocol.js";
import { makeCanvas, px, rect, addPixelOutline } from "./pixelCanvas.js";

// ==========================================
// Dynamic 26x28 4-Directional Pixel Paperdoll Composer
// Canonical GlimmerFall V2.0 Heroic Sprite Sheet Design
// Official Palette Lineage: Pixel_art_animation_sheet
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

function clampByte(n) {
  return Math.max(0, Math.min(255, n | 0));
}

function shiftHex(hex, delta) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) return hex || '#94a3b8';
  const r = clampByte(parseInt(hex.slice(1, 3), 16) + delta);
  const g = clampByte(parseInt(hex.slice(3, 5), 16) + delta);
  const b = clampByte(parseInt(hex.slice(5, 7), 16) + delta);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const RARITY_ACCENTS = [
  { match: 'mythic', dark: '#581c87', mid: '#c084fc', hi: '#f5d0fe', trim: '#fde047' },
  { match: 'apex', dark: '#78350f', mid: '#facc15', hi: '#fef08a', trim: '#ffffff' },
  { match: 'legendary', dark: '#92400e', mid: '#f59e0b', hi: '#fde047', trim: '#ffffff' },
  { match: 'epic', dark: '#4c1d95', mid: '#9333ea', hi: '#d8b4fe', trim: '#38bdf8' },
  { match: 'set', dark: '#1e3a8a', mid: '#38bdf8', hi: '#bae6fd', trim: '#facc15' },
  { match: 'rare', dark: '#0369a1', mid: '#0ea5e9', hi: '#7dd3fc', trim: '#e2e8f0' },
  { match: 'uncommon', dark: '#14532d', mid: '#22c55e', hi: '#86efac', trim: '#cbd5e1' },
];

function getRarityColors(spec, fallbackDark, fallbackMid, fallbackHi) {
  const rar = String(spec?.rarity || '').toLowerCase();
  for (const entry of RARITY_ACCENTS) {
    if (rar.includes(entry.match)) return entry;
  }
  return { dark: fallbackDark, mid: fallbackMid, hi: fallbackHi, trim: '#cbd5e1' };
}

const CAPE_OVERRIDES = {
  fire_cape: { dark: '#7c2d12', mid: '#ea580c', hi: '#fde047', trim: '#facc15', pattern: 'magma' },
  radiant_cape: { dark: '#a16207', mid: '#eab308', hi: '#fef08a', trim: '#ffffff', pattern: 'radiant' },
  abyssal_cloak: { dark: '#0f172a', mid: '#3b0764', hi: '#9333ea', trim: '#c084fc', pattern: 'tattered' },
  linen_traveller_cloak: { dark: '#14532d', mid: '#15803d', hi: '#4ade80', trim: '#facc15', pattern: 'standard' },
  duskveil_silk_mantle: { dark: '#2e1065', mid: '#6d28d9', hi: '#c084fc', trim: '#e879f9', pattern: 'tattered' },
  celestial_gossamer_cloak: { dark: '#075985', mid: '#38bdf8', hi: '#e0f2fe', trim: '#fef08a', pattern: 'starlight' },
};

const LEG_OVERRIDES = {
  sunforged_greaves: { dark: '#a16207', mid: '#eab308', hi: '#fef08a', trim: '#ffffff', style: 'plate' },
  aurelius_starforged_greaves: { dark: '#92400e', mid: '#facc15', hi: '#ffffff', trim: '#38bdf8', style: 'plate' },
  ironwood_thighguards: { dark: '#451a03', mid: '#92400e', hi: '#d97706', trim: '#22c55e', style: 'bark' },
  chrono_astral_skirt: { dark: '#1e3a8a', mid: '#2563eb', hi: '#38bdf8', trim: '#fde047', style: 'skirt' },
  duskveil_void_chaps: { dark: '#1e1b4b', mid: '#4c1d95', hi: '#9333ea', trim: '#e879f9', style: 'chaps' },
  scout_leather_leggings: { dark: '#451a03', mid: '#78350f', hi: '#b45309', trim: '#d97706', style: 'chaps' },
};

const FEET_OVERRIDES = {
  boots_of_haste: { dark: '#0369a1', mid: '#0ea5e9', hi: '#7dd3fc', trim: '#ffffff', winged: true },
  granite_boots: { dark: '#1e293b', mid: '#475569', hi: '#94a3b8', trim: '#cbd5e1', heavy: true },
};

const HANDS_OVERRIDES = {
  barrows_gloves: { dark: '#334155', mid: '#64748b', hi: '#94a3b8', trim: '#facc15' },
  vanguard_gauntlets: { dark: '#1e293b', mid: '#475569', hi: '#cbd5e1', trim: '#94a3b8' },
};

const NECK_OVERRIDES = {
  amulet_of_fury: { chain: '#f59e0b', gem: '#ef4444', glint: '#fef08a' },
  amulet_of_glory: { chain: '#facc15', gem: '#0ea5e9', glint: '#ffffff' },
  celestial_talisman: { chain: '#cbd5e1', gem: '#38bdf8', glint: '#ffffff' },
};

const RING_COLORS = {
  ring_of_the_sun: '#fde047',
  ring_of_void_leech: '#e879f9',
  ring_of_stone: '#94a3b8',
  coral_ring: '#2dd4bf',
  copper_ring: '#fb923c',
};

const HEAD_STYLES = {
  sunforged_greathelm: 'greathelm',
  ironwood_horned_helm: 'horned_helm',
  chrono_astral_hood: 'astral_hood',
  duskveil_shadow_mask: 'shadow_mask',
  crown_of_dawn: 'crown',
};

function resolveCapeVisuals(capeSpec, armSpec, basePal) {
  const override = capeSpec ? CAPE_OVERRIDES[capeSpec.id] : null;
  const baseMid = capeSpec?.capeColor || capeSpec?.color || override?.mid || armSpec?.capeColor || basePal.capeMid;
  const isSkillcape = Boolean(capeSpec?.id?.startsWith('skillcape_'));
  const rarLower = String(capeSpec?.rarity || armSpec?.rarity || '').toLowerCase();
  const isHighTier = isSkillcape || rarLower.includes('mythic') || rarLower.includes('set') || rarLower.includes('apex') || rarLower.includes('legendary') || rarLower.includes('relic');

  return {
    dark: override?.dark || (capeSpec ? shiftHex(baseMid, -55) : basePal.capeDark),
    mid: baseMid,
    hi: override?.hi || (capeSpec ? shiftHex(baseMid, 45) : basePal.capeHi),
    trim: override?.trim || (isHighTier ? '#facc15' : null),
    pattern: isSkillcape ? 'skillcape' : (override?.pattern || 'standard'),
  };
}

function resolveArmorVisuals(armId, armSpec, basePal) {
  const dark = armSpec?.armorDark || basePal.armorDark;
  const hi = armSpec?.armorHi || basePal.armorHi;
  const idLower = String(armId || '').toLowerCase();
  let armorType = 'plate';
  if (idLower.includes('robe') || idLower.includes('vestment')) armorType = 'robe';
  else if (idLower.includes('shroud') || idLower.includes('garb') || idLower.includes('tunic')) armorType = 'stealth';
  else if (idLower.includes('ironwood') || idLower.includes('bark')) armorType = 'bark';

  return {
    dark,
    mid: hi,
    shade: shiftHex(dark, -28),
    glint: shiftHex(hi, 48),
    armorType,
  };
}

function resolveWeaponStyle(wepId, wepSpec, classId, defEquip) {
  const id = String(wepId || '').toLowerCase();
  const explicit = String(wepSpec?.style || '').toLowerCase();

  // Named canonical overrides where shared style values differ from item lore
  if (id === 'duskveil_twin_daggers' || id.includes('twin_dagger')) return 'twin_daggers';
  if (id === 'starmetal_meteor_hammer' || id.includes('hammer')) return 'hammer';
  if (id === 'abyssal_voidstar_scythe' || id.includes('scythe')) return 'scythe';
  if (id === 'tide_reaver_trident' || id.includes('trident')) return 'spear';

  // At Lv.1 starter gear, Umbral Assassin wears twin daggers while Graveglass Oracle wields the scythe
  if (classId === 'umbral_assassin' && wepId === defEquip.weapon) {
    return 'twin_daggers';
  }

  if (explicit === 'sword') return 'spellblade';
  const supported = new Set([
    'spellblade', 'greatsword', 'twin_daggers', 'daggers',
    'scythe', 'maul', 'spear', 'staff', 'scepter', 'wand', 'hammer', 'axe',
  ]);
  if (supported.has(explicit)) return explicit;

  if (id.includes('dagger')) return 'daggers';
  if (id.includes('greatsword') || id.includes('morningstar') || id.includes('cosmos_blade')) return 'greatsword';
  if (id.includes('staff') || id.includes('quarterstaff')) return 'staff';
  if (id.includes('scepter')) return 'scepter';
  if (id.includes('wand')) return 'wand';
  if (id.includes('spear')) return 'spear';
  if (id.includes('maul')) return 'maul';
  if (id.includes('axe')) return 'axe';
  return 'spellblade';
}

function resolveOffhandStyle(offId, offSpec, defEquip, wepStyle) {
  const id = String(offId || '').toLowerCase();
  const explicit = String(offSpec?.style || '').toLowerCase();

  if (wepStyle === 'twin_daggers' && (!offId || offId === defEquip.offhand)) {
    return 'offhand_dagger';
  }
  if (explicit === 'tower_shield' || explicit === 'pocketwatch' || explicit === 'lantern' || explicit === 'buckler' || explicit === 'mirror') {
    return explicit;
  }
  if (id === 'graveglass_lantern' || id.includes('lantern')) return 'lantern';
  if (id === 'bramble_buckler' || id.includes('buckler')) return 'buckler';
  if (id.includes('bulwark')) return 'tower_shield';
  if (id.includes('pocketwatch')) return 'pocketwatch';
  if (explicit === 'orb' || id.includes('orb') || id.includes('keystone') || id.includes('core')) return 'orb';
  if (explicit === 'mirror' || id.includes('mirror')) return 'mirror';
  return 'shield';
}

function getOffhandFallbackColors(offId, offSpec) {
  const id = String(offId || '').toLowerCase();
  if (offSpec?.mainColor && offSpec?.trimColor) {
    return { main: offSpec.mainColor, trim: offSpec.trimColor };
  }
  if (id === 'iron_heater_shield') return { main: '#64748b', trim: '#f59e0b' };
  if (id === 'ironbark_bulwark') return { main: '#78350f', trim: '#22c55e' };
  if (id === 'adamant_bulwark_shield') return { main: '#10b981', trim: '#facc15' };
  if (id === 'apprentice_focus_orb') return { main: '#0284c7', trim: '#7dd3fc' };
  const rar = getRarityColors(offSpec, '#475569', '#7e22ce', '#facc15');
  return { main: offSpec?.mainColor || rar.mid, trim: offSpec?.trimColor || rar.trim };
}

function drawCapeBehind(ctx, dir, bob, leanX, sway, pose, cape) {
  const isDash = pose === 'dash';
  const flare = pose === 'cast' ? 1 : 0;

  if (dir === 'down') {
    const ext = isDash ? 1 : 0;
    rect(ctx, 4 - flare + leanX, 11 + bob, 4 + flare, 12 + ext, cape.dark);
    rect(ctx, 5 - flare + leanX, 12 + bob, 3 + flare, 10 + ext, cape.mid);
    px(ctx, 5 + leanX, 13 + bob, cape.hi);

    rect(ctx, 18 + leanX, 11 + bob, 4 + flare, 12 + ext, cape.dark);
    rect(ctx, 18 + leanX, 12 + bob, 3 + flare, 10 + ext, cape.mid);
    px(ctx, 20 + leanX, 13 + bob, cape.hi);

    if (cape.trim) {
      rect(ctx, 4 - flare + leanX, 22 + bob + ext, 4 + flare, 1, cape.trim);
      rect(ctx, 18 + leanX, 22 + bob + ext, 4 + flare, 1, cape.trim);
    }
    if (cape.pattern === 'magma') {
      px(ctx, 5 + leanX, 17 + bob, '#fde047');
      px(ctx, 20 + leanX, 18 + bob, '#fde047');
    } else if (cape.pattern === 'tattered') {
      px(ctx, 4 + leanX, 22 + bob, '#070a12');
      px(ctx, 21 + leanX, 22 + bob, '#070a12');
    }
  } else if (dir === 'right') {
    const dashPull = isDash ? -2 : 0;
    const xBase = Math.max(1, 2 + sway + dashPull);
    const wBase = isDash ? 10 : 8;
    rect(ctx, xBase, 11 + bob, wBase, 12 - (isDash ? 2 : 0), cape.dark);
    rect(ctx, xBase + 1, 12 + bob, wBase - 2, 10 - (isDash ? 2 : 0), cape.mid);
    rect(ctx, xBase + 2, 13 + bob, 3, 7, cape.hi);
    if (cape.trim) rect(ctx, xBase, 21 + bob - (isDash ? 2 : 0), wBase - 1, 1, cape.trim);
    if (cape.pattern === 'magma') {
      px(ctx, xBase + 2, 16 + bob, '#fde047');
      px(ctx, xBase + 4, 19 + bob, '#f97316');
    } else if (cape.pattern === 'starlight') {
      px(ctx, xBase + 2, 15 + bob, '#ffffff');
      px(ctx, xBase + 5, 18 + bob, '#fef08a');
    }
  } else if (dir === 'left') {
    const dashPull = isDash ? 2 : 0;
    const wBase = isDash ? 10 : 8;
    const xBase = Math.min(25 - wBase, 16 + sway + dashPull);
    rect(ctx, xBase, 11 + bob, wBase, 12 - (isDash ? 2 : 0), cape.dark);
    rect(ctx, xBase + 1, 12 + bob, wBase - 2, 10 - (isDash ? 2 : 0), cape.mid);
    rect(ctx, xBase + wBase - 5, 13 + bob, 3, 7, cape.hi);
    if (cape.trim) rect(ctx, xBase + 1, 21 + bob - (isDash ? 2 : 0), wBase - 1, 1, cape.trim);
    if (cape.pattern === 'magma') {
      px(ctx, xBase + wBase - 3, 16 + bob, '#fde047');
      px(ctx, xBase + wBase - 5, 19 + bob, '#f97316');
    } else if (cape.pattern === 'starlight') {
      px(ctx, xBase + wBase - 3, 15 + bob, '#ffffff');
      px(ctx, xBase + wBase - 6, 18 + bob, '#fef08a');
    }
  }
}

function drawLegsAndBoots(ctx, dir, bob, leanX, stepL, stepR, pose, legPal, feetPal, armor) {
  const stanceWide = pose === 'guard' || pose === 'slash' ? 1 : 0;
  const isSkirt = legPal.style === 'skirt' || (armor.armorType === 'robe' && !legPal.equipped);
  const footW = feetPal.heavy ? 5 : 4;

  if (dir === 'down' || dir === 'up') {
    const offL = pose === 'dash' ? 1 : Math.max(0, stepL);
    const offR = pose === 'dash' ? 0 : Math.max(0, stepR);
    const lx = 8 + leanX - stanceWide;
    const rx = 14 + leanX + stanceWide;

    if (isSkirt) {
      rect(ctx, 7 + leanX, 19 + bob, 12, 5, legPal.dark);
      rect(ctx, 8 + leanX, 19 + bob, 10, 4, legPal.mid);
      rect(ctx, 10 + leanX, 20 + bob, 2, 3, legPal.hi);
      rect(ctx, 14 + leanX, 20 + bob, 2, 3, legPal.hi);
      if (legPal.trim) rect(ctx, 8 + leanX, 19 + bob, 10, 1, legPal.trim);
      // Boots peeking beneath skirt
      rect(ctx, lx, 23 + offL, footW, 3, feetPal.dark);
      rect(ctx, lx + 1, 23 + offL, footW - 2, 2, feetPal.mid);
      rect(ctx, rx, 23 + offR, footW, 3, feetPal.dark);
      rect(ctx, rx + 1, 23 + offR, footW - 2, 2, feetPal.mid);
    } else {
      // Greaves / chaps
      rect(ctx, lx, 19 + offL, 4, 5, legPal.dark);
      rect(ctx, lx + (dir === 'down' ? 0 : 1), 19 + offL, 3, 4, legPal.mid);
      px(ctx, lx + 1, 20 + offL, legPal.hi);
      if (legPal.trim) rect(ctx, lx, 21 + offL, 4, 1, legPal.trim);

      rect(ctx, rx, 19 + offR, 4, 5, legPal.dark);
      rect(ctx, rx + (dir === 'down' ? 1 : 0), 19 + offR, 3, 4, legPal.mid);
      px(ctx, rx + 2, 20 + offR, legPal.hi);
      if (legPal.trim) rect(ctx, rx, 21 + offR, 4, 1, legPal.trim);

      // Boots
      rect(ctx, lx - (feetPal.heavy ? 1 : 0), 23 + offL, footW, 3, feetPal.dark);
      rect(ctx, lx, 23 + offL, footW - 1, 2, feetPal.mid);
      px(ctx, lx + 1, 23 + offL, feetPal.hi);
      rect(ctx, rx, 23 + offR, footW, 3, feetPal.dark);
      rect(ctx, rx, 23 + offR, footW - 1, 2, feetPal.mid);
      px(ctx, rx + 1, 23 + offR, feetPal.hi);
    }

    if (feetPal.winged) {
      px(ctx, lx - 1, 23 + offL, '#ffffff');
      px(ctx, rx + footW, 23 + offR, '#ffffff');
    }
  } else if (dir === 'right') {
    const stride = pose === 'slash' || pose === 'dash' ? 1 : 0;
    const x1 = 9 + leanX + stepL - stride;
    const x2 = 13 + leanX + stepR + stride;
    if (isSkirt) {
      rect(ctx, 8 + leanX, 19 + bob, 10, 4, legPal.dark);
      rect(ctx, 10 + leanX, 19 + bob, 6, 4, legPal.mid);
      if (legPal.trim) rect(ctx, 9 + leanX, 19 + bob, 8, 1, legPal.trim);
    } else {
      rect(ctx, x1, 20 + bob, 4, 4, legPal.dark);
      rect(ctx, x1 + 1, 20 + bob, 3, 3, legPal.mid);
      rect(ctx, x2, 20 + bob, 4, 4, legPal.dark);
      rect(ctx, x2 + 1, 20 + bob, 3, 3, legPal.mid);
      if (legPal.trim) px(ctx, x2 + 2, 21 + bob, legPal.trim);
    }
    rect(ctx, x1, 24 + bob, footW, 2, feetPal.dark);
    rect(ctx, x1 + 1, 23 + bob, 3, 2, feetPal.mid);
    rect(ctx, x2, 24 + bob, footW + 1, 2, feetPal.dark);
    rect(ctx, x2 + 1, 23 + bob, 3, 2, feetPal.mid);
    if (feetPal.winged) px(ctx, x1 - 1, 23 + bob, '#ffffff');
  } else if (dir === 'left') {
    const stride = pose === 'slash' || pose === 'dash' ? 1 : 0;
    const x1 = 13 + leanX - stepL + stride;
    const x2 = 9 + leanX - stepR - stride;
    if (isSkirt) {
      rect(ctx, 8 + leanX, 19 + bob, 10, 4, legPal.dark);
      rect(ctx, 10 + leanX, 19 + bob, 6, 4, legPal.mid);
      if (legPal.trim) rect(ctx, 9 + leanX, 19 + bob, 8, 1, legPal.trim);
    } else {
      rect(ctx, x1, 20 + bob, 4, 4, legPal.dark);
      rect(ctx, x1, 20 + bob, 3, 3, legPal.mid);
      rect(ctx, x2, 20 + bob, 4, 4, legPal.dark);
      rect(ctx, x2, 20 + bob, 3, 3, legPal.mid);
      if (legPal.trim) px(ctx, x2 + 1, 21 + bob, legPal.trim);
    }
    rect(ctx, x1 - 1, 24 + bob, footW + 1, 2, feetPal.dark);
    rect(ctx, x1, 23 + bob, 3, 2, feetPal.mid);
    rect(ctx, x2 - 1, 24 + bob, footW, 2, feetPal.dark);
    rect(ctx, x2, 23 + bob, 3, 2, feetPal.mid);
    if (feetPal.winged) px(ctx, x1 + footW, 23 + bob, '#ffffff');
  }
}

function drawTorsoAndNeck(ctx, dir, bob, leanX, pose, pal, clsId, armor, cape, neckSpec) {
  if (dir === 'up') {
    // Cascading cape covering back from shoulders to calves
    const isDash = pose === 'dash';
    const w = 14 + (pose === 'cast' ? 2 : 0);
    const x0 = 6 - (pose === 'cast' ? 1 : 0) + leanX;
    rect(ctx, x0, 9 + bob, w, 15 - (isDash ? 2 : 0), cape.dark);
    rect(ctx, x0 + 1, 10 + bob, w - 2, 13 - (isDash ? 2 : 0), cape.mid);
    rect(ctx, x0 + 4, 11 + bob, 3, 10, cape.hi);
    rect(ctx, x0 + 9, 11 + bob, 2, 10, cape.hi);

    if (cape.trim) {
      rect(ctx, x0 + 1, 9 + bob, w - 2, 1, cape.trim);
      rect(ctx, x0 + 1, 22 + bob - (isDash ? 2 : 0), w - 2, 1, cape.trim);
    }
    if (cape.pattern === 'skillcape') {
      rect(ctx, x0 + 1, 10 + bob, 1, 12, '#facc15');
      rect(ctx, x0 + w - 2, 10 + bob, 1, 12, '#facc15');
      rect(ctx, 12 + leanX, 13 + bob, 2, 4, '#ffffff');
      px(ctx, 11 + leanX, 14 + bob, '#fde047');
      px(ctx, 14 + leanX, 14 + bob, '#fde047');
    } else if (cape.pattern === 'magma') {
      rect(ctx, 10 + leanX, 13 + bob, 2, 6, '#fde047');
      rect(ctx, 14 + leanX, 15 + bob, 2, 5, '#f97316');
      px(ctx, 12 + leanX, 18 + bob, '#ffffff');
    } else if (cape.pattern === 'radiant') {
      rect(ctx, 12 + leanX, 11 + bob, 2, 10, '#ffffff');
    } else if (cape.pattern === 'starlight') {
      px(ctx, 10 + leanX, 13 + bob, '#ffffff');
      px(ctx, 15 + leanX, 16 + bob, '#fef08a');
      px(ctx, 12 + leanX, 19 + bob, '#ffffff');
    } else if (cape.pattern === 'tattered') {
      px(ctx, x0 + 3, 22 + bob, '#070a12');
      px(ctx, x0 + 7, 23 + bob, '#070a12');
      px(ctx, x0 + 11, 22 + bob, '#070a12');
    } else {
      px(ctx, 12 + leanX, 13 + bob, '#ffffff');
    }
    return;
  }

  if (dir === 'down') {
    const x = 7 + leanX;
    // Waistbelt & Faulds
    rect(ctx, x + 1, 17 + bob, 10, 4, armor.shade);
    rect(ctx, x + 2, 18 + bob, 8, 2, armor.dark);
    rect(ctx, x + 4, 18 + bob, 4, 2, armor.mid);

    // Chestplate / Tunic / Robe
    const chestH = armor.armorType === 'robe' ? 9 : 8;
    rect(ctx, x, 10 + bob, 12, chestH, armor.dark);
    rect(ctx, x + 1, 11 + bob, 10, chestH - 2, armor.mid);
    rect(ctx, x + 3, 11 + bob, 6, chestH - 3, armor.glint);

    // Armor silhouette & Class chest signature
    if (clsId === 'aurora_marshal') {
      rect(ctx, x + 4, 11 + bob, 4, 7, '#ffffff');
      rect(ctx, x + 5, 12 + bob, 2, 5, '#fde047');
    } else if (clsId === 'umbral_assassin') {
      // Sleek cross-strap stealth bandolier
      rect(ctx, x + 1, 11 + bob, 10, 7, shiftHex(armor.dark, -18));
      for (let i = 0; i < 6; i++) {
        px(ctx, x + 2 + i, 11 + bob + i, '#a855f7');
        px(ctx, x + 3 + i, 11 + bob + i, '#f43f5e');
      }
    } else if (clsId === 'graveglass_oracle') {
      // Draped oracle collar & soul-shard core
      rect(ctx, x + 3, 10 + bob, 6, 2, '#581c87');
      rect(ctx, x + 5, 12 + bob, 2, 4, '#e879f9');
      px(ctx, x + 5, 13 + bob, '#ffffff');
    } else if (clsId === 'forest_warden') {
      // Leafy ranger mantle scarf & quiver strap
      rect(ctx, x + 1, 10 + bob, 10, 2, '#15803d');
      rect(ctx, x + 2, 11 + bob, 4, 2, '#4ade80');
      px(ctx, x + 7, 13 + bob, '#78350f');
      px(ctx, x + 8, 14 + bob, '#78350f');
    } else if (clsId === 'stonekin_elder') {
      // Heavy granite girdle & emerald earth core
      rect(ctx, x + 1, 16 + bob, 10, 3, '#475569');
      rect(ctx, x + 4, 12 + bob, 4, 3, '#334155');
      rect(ctx, x + 5, 12 + bob, 2, 2, '#4ade80');
    } else if (clsId === 'chronomancer_sage') {
      // Gold-trimmed astral scholar tunic + hourglass sigil
      rect(ctx, x + 4, 11 + bob, 4, 7, '#1e3a8a');
      px(ctx, x + 5, 12 + bob, '#fde047');
      px(ctx, x + 6, 12 + bob, '#fde047');
      px(ctx, x + 5, 14 + bob, '#38bdf8');
      px(ctx, x + 6, 14 + bob, '#38bdf8');
    } else if (clsId === 'nexus_weaver') {
      // Radiant leyline star sigil
      rect(ctx, x + 4, 12 + bob, 4, 4, '#0284c7');
      px(ctx, x + 5, 13 + bob, '#ffffff');
      px(ctx, x + 6, 13 + bob, '#38bdf8');
      px(ctx, x + 5, 14 + bob, '#e879f9');
    } else {
      // Solari Vanguard heroic V-crest & starlight core
      rect(ctx, x + 5, 12 + bob, 2, 3, '#ffffff');
      px(ctx, x + 5, 13 + bob, pal.eye);
    }

    // Neck Amulet (when neck equipped)
    if (neckSpec) {
      const nPal = NECK_OVERRIDES[neckSpec.id] || { chain: '#facc15', gem: '#38bdf8', glint: '#ffffff' };
      px(ctx, x + 4, 10 + bob, nPal.chain);
      px(ctx, x + 7, 10 + bob, nPal.chain);
      rect(ctx, x + 5, 11 + bob, 2, 2, nPal.gem);
      px(ctx, x + 5, 11 + bob, nPal.glint);
    }
    return;
  }

  // Profile torso (left / right)
  const isRight = dir === 'right';
  const tx = (isRight ? 9 : 8) + leanX;
  rect(ctx, tx, 11 + bob, 9, 9, armor.dark);
  rect(ctx, tx + (isRight ? 2 : 1), 12 + bob, 6, 7, armor.mid);
  px(ctx, tx + (isRight ? 4 : 3), 13 + bob, armor.glint);
  rect(ctx, tx + (isRight ? 0 : 2), 18 + bob, 7, 3, armor.shade);

  if (clsId === 'aurora_marshal') {
    rect(ctx, tx + (isRight ? 5 : 2), 12 + bob, 2, 6, '#ffffff');
  } else if (clsId === 'umbral_assassin') {
    rect(ctx, tx + 2, 14 + bob, 5, 1, '#f43f5e');
  } else if (clsId === 'forest_warden') {
    rect(ctx, tx + 1, 11 + bob, 7, 2, '#15803d');
  }

  if (neckSpec) {
    const nPal = NECK_OVERRIDES[neckSpec.id] || { chain: '#facc15', gem: '#38bdf8', glint: '#ffffff' };
    px(ctx, tx + (isRight ? 6 : 2), 11 + bob, nPal.gem);
    px(ctx, tx + (isRight ? 6 : 2), 10 + bob, nPal.chain);
  }
}

function drawClassShouldersAndHands(ctx, dir, bob, leanX, pose, pal, clsId, armor, handsSpec, ringSpec) {
  const drawPauldronPair = (lx, rx, w, h, mainC, hiC, trimC) => {
    rect(ctx, lx, 10 + bob, w, h, mainC);
    rect(ctx, lx + 1, 10 + bob, Math.max(1, w - 2), Math.max(1, h - 1), hiC);
    px(ctx, lx + 1, 10 + bob, trimC);
    rect(ctx, rx, 10 + bob, w, h, mainC);
    rect(ctx, rx + 1, 10 + bob, Math.max(1, w - 2), Math.max(1, h - 1), hiC);
    px(ctx, rx + w - 2, 10 + bob, trimC);
  };

  if (dir === 'down' || dir === 'up') {
    const lx = 4 + leanX;
    const rx = 17 + leanX;
    if (clsId === 'aurora_marshal') {
      // Angelic shoulder winglets sweeping upward
      drawPauldronPair(lx + 1, rx, 4, 4, '#ca8a04', '#fef08a', '#ffffff');
      rect(ctx, lx - 1, 7 + bob, 3, 5, '#ffffff');
      px(ctx, lx - 1, 6 + bob, '#fef08a');
      rect(ctx, rx + 3, 7 + bob, 3, 5, '#ffffff');
      px(ctx, rx + 5, 6 + bob, '#fef08a');
    } else if (clsId === 'umbral_assassin') {
      // Sleek narrow dark cowl-shoulders with sharp tip
      drawPauldronPair(lx + 1, rx, 4, 4, '#1e1b4b', '#581c87', '#c084fc');
      px(ctx, lx, 10 + bob, '#a855f7');
      px(ctx, rx + 4, 10 + bob, '#a855f7');
    } else if (clsId === 'graveglass_oracle') {
      // High upturned mystic oracle mantle collar
      drawPauldronPair(lx + 1, rx, 4, 5, '#3b0764', '#7e22ce', '#e879f9');
      rect(ctx, lx + 2, 8 + bob, 2, 2, '#e879f9');
      rect(ctx, rx + 1, 8 + bob, 2, 2, '#e879f9');
    } else if (clsId === 'forest_warden') {
      // Leafy scout mantle pads
      drawPauldronPair(lx + 1, rx, 4, 4, '#14532d', '#22c55e', '#bef264');
      px(ctx, lx, 12 + bob, '#15803d');
      px(ctx, rx + 4, 12 + bob, '#15803d');
    } else if (clsId === 'stonekin_elder') {
      // Hulking granite & moss shoulder boulders
      drawPauldronPair(lx - 1, rx, 6, 6, '#334155', '#64748b', '#4ade80');
      rect(ctx, lx, 10 + bob, 3, 2, '#16a34a');
      rect(ctx, rx + 2, 10 + bob, 3, 2, '#16a34a');
    } else if (clsId === 'chronomancer_sage') {
      // Astral scholar pauldrons + floating golden hourglass / chrono-ring motes
      drawPauldronPair(lx + 1, rx, 4, 4, '#1e3a8a', '#38bdf8', '#fde047');
      px(ctx, lx - 1, 8 + bob, '#fde047');
      px(ctx, lx - 1, 10 + bob, '#38bdf8');
      px(ctx, rx + 5, 8 + bob, '#fde047');
      px(ctx, rx + 5, 10 + bob, '#38bdf8');
    } else if (clsId === 'nexus_weaver') {
      // Floating crystalline shoulder runes
      drawPauldronPair(lx + 1, rx, 4, 4, '#0369a1', '#38bdf8', '#ffffff');
      rect(ctx, lx - 1, 7 + bob, 2, 3, '#38bdf8');
      px(ctx, lx - 1, 8 + bob, '#ffffff');
      rect(ctx, rx + 4, 7 + bob, 2, 3, '#38bdf8');
      px(ctx, rx + 5, 8 + bob, '#ffffff');
    } else {
      // Solari Vanguard broad armored pauldrons
      drawPauldronPair(lx, rx, 5, 5, pal.pauldron, pal.pauldronHi, armor.glint);
    }
  } else {
    const px0 = (dir === 'right' ? 11 : 10) + leanX;
    if (clsId === 'aurora_marshal') {
      rect(ctx, px0, 10 + bob, 5, 5, '#ca8a04');
      rect(ctx, px0 - 2, 7 + bob, 3, 4, '#ffffff');
    } else if (clsId === 'stonekin_elder') {
      rect(ctx, px0 - 1, 9 + bob, 6, 6, '#475569');
      rect(ctx, px0, 9 + bob, 3, 3, '#22c55e');
    } else if (clsId === 'nexus_weaver') {
      rect(ctx, px0, 10 + bob, 5, 4, '#0284c7');
      rect(ctx, px0 + 1, 7 + bob, 2, 3, '#7dd3fc');
    } else if (clsId === 'chronomancer_sage') {
      rect(ctx, px0, 10 + bob, 5, 4, '#1e3a8a');
      px(ctx, px0 + 2, 8 + bob, '#fde047');
    } else {
      rect(ctx, px0, 10 + bob, 5, 5, pal.pauldron);
      rect(ctx, px0 + 1, 10 + bob, 3, 4, pal.pauldronHi);
      px(ctx, px0 + 2, 10 + bob, armor.glint);
    }
  }

  // Gauntlets / Gloves & Ring Glint
  const hOverride = handsSpec ? HANDS_OVERRIDES[handsSpec.id] : null;
  const hPal = handsSpec
    ? (hOverride || getRarityColors(handsSpec, '#334155', '#64748b', '#cbd5e1'))
    : null;
  const ringCol = ringSpec ? (RING_COLORS[ringSpec.id] || '#fde047') : null;

  const drawFist = (fx, fy, isMain) => {
    if (hPal) {
      rect(ctx, fx, fy, 3, 3, hPal.dark);
      rect(ctx, fx, fy, 2, 2, hPal.mid);
      px(ctx, fx + 1, fy, hPal.trim);
    } else {
      rect(ctx, fx, fy, 2, 2, pal.skin);
    }
    if (isMain && ringCol) {
      px(ctx, fx + 1, fy + 1, ringCol);
    }
  };

  const castLift = pose === 'cast' ? -3 : 0;
  if (dir === 'down') {
    drawFist(19 + leanX, 14 + bob + castLift, true);
    drawFist(4 + leanX, 14 + bob + (pose === 'guard' ? -1 : 0), false);
  } else if (dir === 'up') {
    drawFist(4 + leanX, 14 + bob + castLift, true);
    drawFist(19 + leanX, 14 + bob, false);
  } else if (dir === 'right') {
    drawFist(16 + leanX, 14 + bob + castLift, true);
  } else if (dir === 'left') {
    drawFist(7 + leanX, 14 + bob + castLift, true);
  }
}

function drawHeadAndCrest(ctx, dir, bob, leanX, pal, clsId, headSpec) {
  const headStyle = headSpec ? (HEAD_STYLES[headSpec.id] || 'generic_helm') : null;

  // Full Helms / Hoods replace standard hair & face
  if (headStyle && headStyle !== 'crown') {
    const xBase = (dir === 'right' ? 10 : dir === 'left' ? 8 : 8) + leanX;
    if (headStyle === 'greathelm') {
      rect(ctx, xBase, 2 + bob, 10, 8, '#ca8a04');
      rect(ctx, xBase + 1, 3 + bob, 8, 6, '#facc15');
      rect(ctx, xBase + 2, 3 + bob, 4, 2, '#fef08a');
      rect(ctx, xBase + 3, 1 + bob, 4, 2, pal.plume); // helm crest plume
      if (dir === 'down') {
        rect(ctx, xBase + 1, 6 + bob, 8, 2, '#070a12');
        rect(ctx, xBase + 4, 4 + bob, 2, 5, '#070a12');
        px(ctx, xBase + 2, 6 + bob, '#38bdf8');
        px(ctx, xBase + 7, 6 + bob, '#38bdf8');
      } else if (dir === 'right') {
        rect(ctx, xBase + 5, 6 + bob, 5, 2, '#070a12');
        px(ctx, xBase + 7, 6 + bob, '#38bdf8');
      } else if (dir === 'left') {
        rect(ctx, xBase, 6 + bob, 5, 2, '#070a12');
        px(ctx, xBase + 2, 6 + bob, '#38bdf8');
      }
      return;
    }

    if (headStyle === 'horned_helm') {
      rect(ctx, xBase + 1, 3 + bob, 8, 7, '#78350f');
      rect(ctx, xBase + 2, 4 + bob, 6, 5, '#92400e');
      rect(ctx, xBase + 3, 3 + bob, 4, 1, '#22c55e'); // living moss crown
      // Curved stag horns
      rect(ctx, xBase - 2, 1 + bob, 2, 3, '#d97706');
      px(ctx, xBase, 3 + bob, '#fef08a');
      rect(ctx, xBase + 10, 1 + bob, 2, 3, '#d97706');
      px(ctx, xBase + 9, 3 + bob, '#fef08a');
      if (dir === 'down') {
        rect(ctx, xBase + 2, 6 + bob, 6, 2, '#070a12');
        px(ctx, xBase + 3, 6 + bob, '#fde047');
        px(ctx, xBase + 6, 6 + bob, '#fde047');
      } else if (dir === 'right') {
        rect(ctx, xBase + 5, 6 + bob, 4, 2, '#070a12');
        px(ctx, xBase + 7, 6 + bob, '#fde047');
      } else if (dir === 'left') {
        rect(ctx, xBase + 1, 6 + bob, 4, 2, '#070a12');
        px(ctx, xBase + 2, 6 + bob, '#fde047');
      }
      return;
    }

    if (headStyle === 'astral_hood') {
      rect(ctx, xBase, 2 + bob, 10, 8, '#1e3a8a');
      rect(ctx, xBase + 1, 3 + bob, 8, 6, '#2563eb');
      rect(ctx, xBase + 3, 1 + bob, 4, 2, '#1d4ed8'); // pointed hood peak
      px(ctx, xBase + 4, 2 + bob, '#ffffff'); // star stitch
      if (dir === 'down') {
        rect(ctx, xBase + 2, 5 + bob, 6, 4, '#070a12');
        px(ctx, xBase + 3, 7 + bob, '#fde047');
        px(ctx, xBase + 6, 7 + bob, '#fde047');
      } else if (dir === 'right') {
        rect(ctx, xBase + 5, 5 + bob, 4, 4, '#070a12');
        px(ctx, xBase + 7, 7 + bob, '#fde047');
      } else if (dir === 'left') {
        rect(ctx, xBase + 1, 5 + bob, 4, 4, '#070a12');
        px(ctx, xBase + 2, 7 + bob, '#fde047');
      }
      return;
    }

    if (headStyle === 'shadow_mask') {
      rect(ctx, xBase, 2 + bob, 10, 8, '#1e1b4b');
      rect(ctx, xBase + 1, 3 + bob, 8, 6, '#4c1d95');
      rect(ctx, xBase + 2, 7 + bob, 6, 3, '#3b0764'); // stealth face wrap
      if (dir === 'down') {
        rect(ctx, xBase + 2, 6 + bob, 6, 1, '#070a12');
        px(ctx, xBase + 3, 6 + bob, '#f43f5e');
        px(ctx, xBase + 6, 6 + bob, '#f43f5e');
      } else if (dir === 'right') {
        px(ctx, xBase + 7, 6 + bob, '#f43f5e');
      } else if (dir === 'left') {
        px(ctx, xBase + 2, 6 + bob, '#f43f5e');
      }
      return;
    }

    // Generic fallback helm
    const gPal = getRarityColors(headSpec, '#334155', '#64748b', '#cbd5e1');
    rect(ctx, xBase + 1, 3 + bob, 8, 7, gPal.dark);
    rect(ctx, xBase + 2, 4 + bob, 6, 5, gPal.mid);
    if (dir === 'down') rect(ctx, xBase + 2, 6 + bob, 6, 2, '#070a12');
    return;
  }

  // Standard Hair, Face & Circlet (also shown beneath Crown of Dawn & Class Crests)
  const isAssassinUnhelmed = clsId === 'umbral_assassin';
  if (dir === 'down') {
    rect(ctx, 9 + leanX, 1 + bob, 8, 4, isAssassinUnhelmed ? '#1e1b4b' : pal.hairDark);
    rect(ctx, 10 + leanX, 1 + bob, 6, 3, isAssassinUnhelmed ? '#4c1d95' : pal.hairMid);
    rect(ctx, 11 + leanX, 1 + bob, 4, 2, isAssassinUnhelmed ? '#7e22ce' : pal.hairHi);

    rect(ctx, 9 + leanX, 4 + bob, 8, 6, pal.skin);
    rect(ctx, 10 + leanX, 4 + bob, 6, 5, pal.skinHi);

    if (isAssassinUnhelmed) {
      // Sleek dark cowl & lower stealth face mask
      rect(ctx, 8 + leanX, 3 + bob, 10, 3, '#3b0764');
      rect(ctx, 9 + leanX, 8 + bob, 8, 2, '#1e1b4b');
    } else {
      rect(ctx, 8 + leanX, 4 + bob, 10, 2, pal.circlet);
      rect(ctx, 11 + leanX, 4 + bob, 4, 1, pal.circletHi);
      rect(ctx, 7 + leanX, 5 + bob, 2, 4, pal.hairMid);
      rect(ctx, 17 + leanX, 5 + bob, 2, 4, pal.hairMid);
    }

    rect(ctx, 10 + leanX, 7 + bob, 2, 1, '#0f172a');
    px(ctx, 11 + leanX, 7 + bob, pal.eye);
    rect(ctx, 14 + leanX, 7 + bob, 2, 1, '#0f172a');
    px(ctx, 14 + leanX, 7 + bob, pal.eye);
  } else if (dir === 'up') {
    rect(ctx, 9 + leanX, 2 + bob, 8, 8, isAssassinUnhelmed ? '#1e1b4b' : pal.hairDark);
    rect(ctx, 10 + leanX, 3 + bob, 6, 6, isAssassinUnhelmed ? '#4c1d95' : pal.hairMid);
    rect(ctx, 11 + leanX, 3 + bob, 4, 4, isAssassinUnhelmed ? '#7e22ce' : pal.hairHi);
    rect(ctx, 9 + leanX, 5 + bob, 8, 2, isAssassinUnhelmed ? '#a855f7' : pal.circlet);
    px(ctx, 12 + leanX, 5 + bob, pal.circletHi);
  } else if (dir === 'right') {
    rect(ctx, 11 + leanX, 4 + bob, 6, 6, pal.skin);
    rect(ctx, 13 + leanX, 5 + bob, 4, 4, pal.skinHi);
    if (isAssassinUnhelmed) rect(ctx, 12 + leanX, 8 + bob, 5, 2, '#1e1b4b');
    px(ctx, 15 + leanX, 6 + bob, '#0f172a');
    px(ctx, 16 + leanX, 6 + bob, pal.eye);
    rect(ctx, 11 + leanX, 4 + bob, 6, 2, isAssassinUnhelmed ? '#4c1d95' : pal.circlet);
    px(ctx, 15 + leanX, 4 + bob, pal.circletHi);
    rect(ctx, 4 + leanX, 2 + bob, 8, 4, isAssassinUnhelmed ? '#1e1b4b' : pal.hairDark);
    rect(ctx, 5 + leanX, 2 + bob, 7, 3, isAssassinUnhelmed ? '#4c1d95' : pal.hairMid);
    rect(ctx, 6 + leanX, 1 + bob, 5, 2, isAssassinUnhelmed ? '#7e22ce' : pal.hairHi);
    rect(ctx, 2 + leanX, 4 + bob, 4, 3, isAssassinUnhelmed ? '#4c1d95' : pal.hairMid);
  } else if (dir === 'left') {
    rect(ctx, 9 + leanX, 4 + bob, 6, 6, pal.skin);
    rect(ctx, 9 + leanX, 5 + bob, 4, 4, pal.skinHi);
    if (isAssassinUnhelmed) rect(ctx, 9 + leanX, 8 + bob, 5, 2, '#1e1b4b');
    px(ctx, 10 + leanX, 6 + bob, '#0f172a');
    px(ctx, 9 + leanX, 6 + bob, pal.eye);
    rect(ctx, 9 + leanX, 4 + bob, 6, 2, isAssassinUnhelmed ? '#4c1d95' : pal.circlet);
    px(ctx, 10 + leanX, 4 + bob, pal.circletHi);
    rect(ctx, 14 + leanX, 2 + bob, 8, 4, isAssassinUnhelmed ? '#1e1b4b' : pal.hairDark);
    rect(ctx, 14 + leanX, 2 + bob, 7, 3, isAssassinUnhelmed ? '#4c1d95' : pal.hairMid);
    rect(ctx, 15 + leanX, 1 + bob, 5, 2, isAssassinUnhelmed ? '#7e22ce' : pal.hairHi);
    rect(ctx, 20 + leanX, 4 + bob, 4, 3, isAssassinUnhelmed ? '#4c1d95' : pal.hairMid);
  }

  // Crown of Dawn overlay
  const topY = Math.max(0, bob);
  if (headStyle === 'crown') {
    const cx = (dir === 'right' ? 10 : dir === 'left' ? 8 : 8) + leanX;
    rect(ctx, cx, 3 + bob, 10, 2, '#ca8a04');
    rect(ctx, cx + 1, 3 + bob, 8, 1, '#facc15');
    px(ctx, cx + 1, 1 + bob, '#fde047');
    px(ctx, cx + 4, 1 + topY, '#ffffff');
    px(ctx, cx + 5, 1 + topY, '#ffffff');
    rect(ctx, cx + 4, 2 + topY, 2, 1, '#fde047');
    px(ctx, cx + 8, 1 + bob, '#fde047');
    px(ctx, cx + 4, 3 + bob, '#38bdf8');
    return;
  }

  // Distinct Level-1 Class Head Crests
  if (clsId === 'aurora_marshal') {
    rect(ctx, 10 + leanX, 1 + topY, 6, 1, '#fef08a');
    px(ctx, 9 + leanX, 1 + bob, '#ffffff');
    px(ctx, 16 + leanX, 1 + bob, '#ffffff');
  } else if (clsId === 'umbral_assassin') {
    rect(ctx, 8 + leanX, 2 + bob, 10, 2, '#3b0764');
    rect(ctx, 11 + leanX, 1 + topY, 4, 2, '#581c87');
  } else if (clsId === 'graveglass_oracle') {
    rect(ctx, 7 + leanX, 1 + bob, 2, 4, '#e879f9');
    px(ctx, 6 + leanX, 1 + topY, '#f5d0fe');
    rect(ctx, 17 + leanX, 1 + bob, 2, 4, '#e879f9');
    px(ctx, 19 + leanX, 1 + topY, '#f5d0fe');
  } else if (clsId === 'forest_warden') {
    rect(ctx, 6 + leanX, 1 + bob, 2, 4, '#a3e635');
    px(ctx, 5 + leanX, 1 + topY, '#bef264');
    px(ctx, 8 + leanX, 2 + bob, '#bef264');
    rect(ctx, 18 + leanX, 1 + bob, 2, 4, '#a3e635');
    px(ctx, 20 + leanX, 1 + topY, '#bef264');
    px(ctx, 17 + leanX, 2 + bob, '#bef264');
  } else if (clsId === 'stonekin_elder') {
    rect(ctx, 8 + leanX, 2 + bob, 10, 2, '#475569');
    px(ctx, 8 + leanX, 1 + topY, '#94a3b8');
    px(ctx, 17 + leanX, 1 + topY, '#94a3b8');
    px(ctx, 12 + leanX, 1 + topY, '#4ade80');
  } else if (clsId === 'chronomancer_sage') {
    rect(ctx, 7 + leanX, 3 + bob, 12, 2, '#1e3a8a');
    rect(ctx, 9 + leanX, 2 + bob, 8, 1, '#facc15');
    rect(ctx, 11 + leanX, 1 + topY, 4, 2, '#0284c7');
    px(ctx, 12 + leanX, 1 + topY, '#7dd3fc');
  } else if (clsId === 'nexus_weaver') {
    px(ctx, 7 + leanX, 2 + bob, '#38bdf8');
    px(ctx, 12 + leanX, 1 + topY, '#ffffff');
    px(ctx, 13 + leanX, 1 + topY, '#7dd3fc');
    px(ctx, 18 + leanX, 2 + bob, '#38bdf8');
  }
}

function drawWeaponForDirPose(ctx, style, dir, pose, bob, leanX, wCol, hCol, isTrident) {
  const isRightSide = dir === 'down' || dir === 'right';
  const wx = (isRightSide ? 20 : 3) + leanX;
  const edgeCol = '#ffffff';
  const steelMid = wCol || '#e2e8f0';
  const liftY = pose === 'cast' ? -3 : pose === 'guard' ? 1 : 0;

  // Horizontal slash overrides for active strike swing!
  if (pose === 'slash') {
    if (dir === 'right') {
      const len = style === 'greatsword' || style === 'spear' ? 6 : 5;
      rect(ctx, 16 + leanX, 13 + bob, 3, 2, hCol);
      rect(ctx, 19 + leanX, 13 + bob, len, 2, steelMid);
      rect(ctx, 19 + leanX, 13 + bob, len - 1, 1, edgeCol);
      // Motion trail glint arc
      px(ctx, 21 + leanX, 10 + bob, edgeCol);
      px(ctx, 23 + leanX, 11 + bob, steelMid);
      px(ctx, 23 + leanX, 16 + bob, steelMid);
      return;
    }
    if (dir === 'left') {
      const len = style === 'greatsword' || style === 'spear' ? 6 : 5;
      rect(ctx, 7 + leanX, 13 + bob, 3, 2, hCol);
      rect(ctx, 7 + leanX - len, 13 + bob, len, 2, steelMid);
      rect(ctx, 8 + leanX - len, 13 + bob, len - 1, 1, edgeCol);
      px(ctx, 4 + leanX, 10 + bob, edgeCol);
      px(ctx, 2 + leanX, 11 + bob, steelMid);
      px(ctx, 2 + leanX, 16 + bob, steelMid);
      return;
    }
    if (dir === 'down') {
      rect(ctx, 17 + leanX, 15 + bob, 3, 2, hCol);
      rect(ctx, 18 + leanX, 16 + bob, 6, 2, steelMid);
      rect(ctx, 19 + leanX, 16 + bob, 4, 1, edgeCol);
      // Sweeping slash trail beneath front
      px(ctx, 12 + leanX, 20 + bob, steelMid);
      px(ctx, 15 + leanX, 20 + bob, edgeCol);
      px(ctx, 18 + leanX, 19 + bob, edgeCol);
      return;
    }
    if (dir === 'up') {
      rect(ctx, 4 + leanX, 7 + bob, 2, 3, hCol);
      rect(ctx, 2 + leanX, 3 + bob, 6, 2, steelMid);
      rect(ctx, 3 + leanX, 3 + bob, 4, 1, edgeCol);
      px(ctx, 8 + leanX, 2 + bob, edgeCol);
      px(ctx, 11 + leanX, 2 + bob, steelMid);
      return;
    }
  }

  // Dash sweeps weapon angled backward
  if (pose === 'dash' && (dir === 'right' || dir === 'left')) {
    if (dir === 'right') {
      rect(ctx, 8 + leanX, 14 + bob, 2, 2, hCol);
      rect(ctx, 3 + leanX, 15 + bob, 5, 2, steelMid);
      px(ctx, 4 + leanX, 15 + bob, edgeCol);
      return;
    }
    rect(ctx, 16 + leanX, 14 + bob, 2, 2, hCol);
    rect(ctx, 18 + leanX, 15 + bob, 5, 2, steelMid);
    px(ctx, 21 + leanX, 15 + bob, edgeCol);
    return;
  }

  // Profile idle/walk/cast/guard weapons
  if (dir === 'right' || dir === 'left') {
    const isR = dir === 'right';
    const gripX = (isR ? 17 : 6) + leanX;
    const tipX = (isR ? 20 : 2) + leanX;
    const y0 = 13 + bob + liftY;

    if (style === 'staff' || style === 'scepter') {
      const sx = (isR ? 20 : 4) + leanX;
      rect(ctx, sx, 5 + bob + liftY, 2, 13, hCol);
      rect(ctx, sx - 1, 3 + bob + liftY, 4, 3, steelMid);
      px(ctx, sx, 4 + bob + liftY, edgeCol);
    } else if (style === 'wand') {
      rect(ctx, gripX, y0, 3, 1, hCol);
      rect(ctx, isR ? gripX + 3 : gripX - 4, y0 - 1, 4, 1, steelMid);
      px(ctx, isR ? gripX + 6 : gripX - 4, y0 - 2, edgeCol);
    } else if (style === 'twin_daggers' || style === 'daggers') {
      rect(ctx, gripX, y0 + 1, 2, 2, hCol);
      rect(ctx, isR ? gripX + 2 : gripX - 4, y0 + 1, 4, 2, steelMid);
      px(ctx, isR ? gripX + 5 : gripX - 4, y0 + 1, edgeCol);
    } else if (style === 'scythe') {
      const sx = (isR ? 20 : 4) + leanX;
      rect(ctx, sx, 4 + bob + liftY, 2, 15, hCol);
      rect(ctx, isR ? sx - 3 : sx, 3 + bob + liftY, 5, 2, steelMid);
      px(ctx, isR ? sx - 4 : sx + 5, 5 + bob + liftY, edgeCol);
    } else if (style === 'maul' || style === 'hammer') {
      const sx = (isR ? 20 : 4) + leanX;
      rect(ctx, sx, 7 + bob + liftY, 2, 11, hCol);
      rect(ctx, sx - 1, 4 + bob + liftY, 4, 4, '#475569');
      rect(ctx, sx, 5 + bob + liftY, 2, 2, steelMid);
    } else if (style === 'axe') {
      const sx = (isR ? 20 : 4) + leanX;
      rect(ctx, sx, 7 + bob + liftY, 2, 11, hCol);
      rect(ctx, isR ? sx + 1 : sx - 3, 5 + bob + liftY, 4, 5, steelMid);
      px(ctx, isR ? sx + 4 : sx - 3, 6 + bob + liftY, edgeCol);
    } else if (style === 'spear') {
      rect(ctx, isR ? 13 + leanX : 5 + leanX, y0 + 1, 9, 1, hCol);
      rect(ctx, isR ? 21 + leanX : 2 + leanX, y0, 3, 3, steelMid);
      px(ctx, isR ? 24 + leanX : 1 + leanX, y0 + 1, edgeCol);
    } else if (style === 'greatsword') {
      rect(ctx, gripX, y0, 3, 2, hCol);
      rect(ctx, isR ? tipX : tipX - 1, y0, 5, 3, steelMid);
      rect(ctx, isR ? tipX : tipX, y0, 4, 1, edgeCol);
    } else {
      // spellblade / default sword
      rect(ctx, gripX, y0, 3, 2, hCol);
      rect(ctx, tipX, y0 + 1, 4, 2, steelMid);
      rect(ctx, isR ? tipX : tipX + 1, y0 + 1, 3, 1, edgeCol);
    }
    return;
  }

  // Front/Back (down / up) vertical weapons
  const baseY = Math.max(0, bob + liftY);
  switch (style) {
    case 'scythe':
      rect(ctx, wx, 4 + baseY, 2, 14, hCol);
      rect(ctx, isRightSide ? wx - 4 : wx, 2 + baseY, 6, 3, steelMid);
      rect(ctx, isRightSide ? wx - 5 : wx + 5, 4 + baseY, 2, 3, edgeCol);
      break;
    case 'maul':
      rect(ctx, wx, 6 + baseY, 2, 12, hCol);
      rect(ctx, wx - 2, 3 + baseY, 6, 5, '#475569');
      rect(ctx, wx - 1, 4 + baseY, 4, 3, steelMid);
      px(ctx, wx, 4 + baseY, edgeCol);
      break;
    case 'hammer':
      rect(ctx, wx, 7 + baseY, 2, 11, hCol);
      rect(ctx, wx - 2, 4 + baseY, 6, 4, '#334155');
      rect(ctx, wx - 1, 5 + baseY, 4, 2, steelMid);
      px(ctx, wx + 3, 5 + baseY, edgeCol);
      break;
    case 'axe':
      rect(ctx, wx, 7 + baseY, 2, 11, hCol);
      rect(ctx, isRightSide ? wx + 1 : wx - 2, 5 + baseY, 4, 5, '#475569');
      rect(ctx, isRightSide ? wx + 2 : wx - 2, 6 + baseY, 3, 4, steelMid);
      px(ctx, isRightSide ? wx + 4 : wx - 2, 7 + baseY, edgeCol);
      break;
    case 'spear':
      rect(ctx, wx + 1, 5 + baseY, 1, 14, hCol);
      rect(ctx, wx, 2 + baseY, 3, 4, steelMid);
      px(ctx, wx + 1, 1 + baseY, edgeCol);
      if (isTrident) {
        px(ctx, wx - 1, 3 + baseY, edgeCol);
        px(ctx, wx + 3, 3 + baseY, edgeCol);
      }
      break;
    case 'staff':
      rect(ctx, wx, 4 + baseY, 2, 15, hCol);
      rect(ctx, wx - 1, 1 + baseY, 4, 4, steelMid);
      rect(ctx, wx, 2 + baseY, 2, 2, edgeCol);
      break;
    case 'scepter':
      rect(ctx, wx, 7 + baseY, 2, 10, hCol);
      rect(ctx, wx - 1, 4 + baseY, 4, 3, '#facc15');
      rect(ctx, wx, 5 + baseY, 2, 2, steelMid);
      px(ctx, wx, 3 + baseY, edgeCol);
      break;
    case 'wand':
      rect(ctx, wx + 1, 11 + baseY, 1, 6, hCol);
      rect(ctx, wx, 8 + baseY, 2, 3, steelMid);
      rect(ctx, wx, 6 + baseY, 2, 2, edgeCol);
      px(ctx, wx + 2, 7 + baseY, steelMid);
      break;
    case 'twin_daggers':
    case 'daggers':
      rect(ctx, wx, 14 + baseY, 2, 2, hCol);
      rect(ctx, wx, 9 + baseY, 2, 5, steelMid);
      px(ctx, wx + 1, 8 + baseY, edgeCol);
      break;
    case 'greatsword':
      rect(ctx, wx - 1, 13 + baseY, 5, 2, hCol);
      rect(ctx, wx, 3 + baseY, 3, 10, steelMid);
      rect(ctx, wx + 1, 2 + baseY, 1, 11, edgeCol);
      break;
    case 'spellblade':
    default:
      rect(ctx, wx, 13 + baseY, 3, 2, hCol);
      rect(ctx, wx + 1, 6 + baseY, 2, 8, steelMid);
      rect(ctx, wx + 1, 5 + baseY, 1, 9, edgeCol);
      break;
  }
}

function drawOffhandForDirPose(ctx, style, wepStyle, dir, pose, bob, leanX, oMain, oTrim, wCol, hCol, castSigilCol) {
  const wepOnRight = dir === 'down' || dir === 'right';
  const ox = (wepOnRight ? 2 : 20) + leanX;
  const isGuard = pose === 'guard';
  const isCast = pose === 'cast';

  // Cast pose: glowing faction-colored casting sigil in offhand!
  if (isCast) {
    const sx = dir === 'right' ? 18 + leanX : dir === 'left' ? 5 + leanX : ox;
    const sy = 9 + bob;
    rect(ctx, sx, sy, 3, 3, castSigilCol);
    px(ctx, sx + 1, sy + 1, '#ffffff');
    px(ctx, sx + 1, sy - 1, castSigilCol);
    px(ctx, sx + 1, sy + 3, castSigilCol);
    px(ctx, sx - 1, sy + 1, castSigilCol);
    px(ctx, sx + 3, sy + 1, castSigilCol);
    return;
  }

  // Twin-dagger offhand matching blade (also pairs with wrist-buckler!)
  if (style === 'offhand_dagger' || (wepStyle === 'twin_daggers' && style === 'buckler')) {
    if (style === 'buckler') {
      const bx = dir === 'right' ? 8 + leanX : dir === 'left' ? 14 + leanX : ox;
      rect(ctx, bx, 12 + bob, 4, 5, oTrim);
      rect(ctx, bx + 1, 13 + bob, 2, 3, oMain);
      px(ctx, bx + 1, 14 + bob, '#ffffff');
    }
    if (pose === 'slash') {
      if (dir === 'right') {
        rect(ctx, 13 + leanX, 15 + bob, 2, 2, hCol);
        rect(ctx, 15 + leanX, 15 + bob, 5, 2, wCol);
        px(ctx, 20 + leanX, 15 + bob, '#ffffff');
      } else if (dir === 'left') {
        rect(ctx, 11 + leanX, 15 + bob, 2, 2, hCol);
        rect(ctx, 6 + leanX, 15 + bob, 5, 2, wCol);
        px(ctx, 5 + leanX, 15 + bob, '#ffffff');
      } else {
        rect(ctx, ox, 15 + bob, 2, 2, hCol);
        rect(ctx, ox - 1, 17 + bob, 4, 2, wCol);
        px(ctx, ox - 1, 18 + bob, '#ffffff');
      }
      return;
    }
    if (dir === 'right') {
      rect(ctx, 11 + leanX, 15 + bob, 2, 2, hCol);
      rect(ctx, 13 + leanX, 15 + bob, 4, 2, wCol);
      px(ctx, 17 + leanX, 15 + bob, '#ffffff');
    } else if (dir === 'left') {
      rect(ctx, 13 + leanX, 15 + bob, 2, 2, hCol);
      rect(ctx, 9 + leanX, 15 + bob, 4, 2, wCol);
      px(ctx, 8 + leanX, 15 + bob, '#ffffff');
    } else {
      rect(ctx, ox + 1, 14 + bob, 2, 2, hCol);
      rect(ctx, ox + 1, 9 + bob, 2, 5, wCol);
      px(ctx, ox + 1, 8 + bob, '#ffffff');
    }
    return;
  }

  // Position adjustments for guard pose (centrally forward brace!)
  let sx = ox;
  let sy = 11 + bob;
  if (isGuard) {
    if (dir === 'down') { sx = 10 + leanX; sy = 12 + bob; }
    else if (dir === 'up') { sx = 18 + leanX; sy = 9 + bob; }
    else if (dir === 'right') { sx = 14 + leanX; sy = 12 + bob; }
    else if (dir === 'left') { sx = 8 + leanX; sy = 12 + bob; }
  } else if (dir === 'right') {
    sx = 7 + leanX; sy = 12 + bob;
  } else if (dir === 'left') {
    sx = 15 + leanX; sy = 12 + bob;
  }

  switch (style) {
    case 'tower_shield': {
      rect(ctx, sx, sy - 1, 5, 10, oTrim);
      rect(ctx, sx + 1, sy, 3, 8, oMain);
      rect(ctx, sx + 2, sy + 2, 1, 4, '#ffffff');
      px(ctx, sx + 1, sy + 3, oTrim);
      px(ctx, sx + 3, sy + 3, oTrim);
      break;
    }
    case 'mirror': {
      rect(ctx, sx, sy, 4, 8, oTrim);
      rect(ctx, sx + 1, sy + 1, 2, 6, '#ffffff');
      px(ctx, sx + 2, sy + 2, oMain);
      px(ctx, sx + 1, sy + 5, '#7dd3fc');
      break;
    }
    case 'buckler': {
      rect(ctx, sx, sy + 1, 4, 5, oTrim);
      rect(ctx, sx + 1, sy + 2, 2, 3, oMain);
      px(ctx, sx + 1, sy + 3, '#ffffff');
      break;
    }
    case 'orb': {
      rect(ctx, sx, sy + 1, 4, 4, oMain);
      rect(ctx, sx + 1, sy + 2, 2, 2, oTrim);
      px(ctx, sx + 1, sy, '#ffffff');
      break;
    }
    case 'lantern': {
      rect(ctx, sx + 1, sy, 2, 1, '#475569');
      rect(ctx, sx, sy + 1, 4, 5, '#334155');
      rect(ctx, sx + 1, sy + 2, 2, 3, oMain);
      px(ctx, sx + 1, sy + 3, '#ffffff');
      px(ctx, sx + 2, sy + 2, oTrim);
      break;
    }
    case 'pocketwatch': {
      rect(ctx, sx, sy + 1, 4, 4, '#facc15');
      rect(ctx, sx + 1, sy + 2, 2, 2, '#38bdf8');
      px(ctx, sx + 1, sy, '#fde047');
      px(ctx, sx + 1, sy + 2, '#ffffff');
      break;
    }
    case 'shield':
    default: {
      rect(ctx, sx, sy, 4, 7, oTrim);
      rect(ctx, sx + 1, sy + 1, 2, 5, oMain);
      px(ctx, sx + 1, sy + 2, '#ffffff');
      px(ctx, sx + 1, sy + 4, '#7dd3fc');
      break;
    }
  }
}

function drawDashSpeedLines(ctx, dir, bob, color) {
  if (dir === 'right') {
    rect(ctx, 1, 14 + bob, 3, 1, color);
    rect(ctx, 2, 21 + bob, 3, 1, '#ffffff');
  } else if (dir === 'left') {
    rect(ctx, 22, 14 + bob, 3, 1, color);
    rect(ctx, 21, 21 + bob, 3, 1, '#ffffff');
  } else if (dir === 'down') {
    px(ctx, 5, 5 + bob, color);
    px(ctx, 20, 5 + bob, color);
  } else {
    px(ctx, 6, 24 + bob, color);
    px(ctx, 19, 24 + bob, color);
  }
}

function renderCharacterFrame({
  dir, frame, pose, pal, clsId, armor, cape, headSpec, neckSpec,
  legPal, feetPal, handsSpec, ringSpec, wepStyle, wCol, hCol, isTrident,
  offStyle, oMain, oTrim,
}) {
  const { c, ctx } = makeCanvas(26, 28);
  const isWalk = pose === 'walk' && frame > 0;
  const stepL = isWalk ? (frame === 1 ? -1 : 1) : 0;
  const stepR = -stepL;
  const bob = isWalk ? -1 : (pose === 'guard' || pose === 'dash' ? 1 : 0);
  const leanX = pose === 'dash'
    ? (dir === 'right' ? 2 : dir === 'left' ? -2 : 0)
    : pose === 'slash'
      ? (dir === 'right' ? 1 : dir === 'left' ? -1 : 0)
      : 0;
  const sway = dir === 'right' ? (frame === 1 ? -1 : frame === 2 ? 1 : 0) : (frame === 1 ? 1 : frame === 2 ? -1 : 0);

  if (pose === 'dash') {
    drawDashSpeedLines(ctx, dir, bob, pal.plume);
  }

  // 1. Cape behind body in down & side views
  drawCapeBehind(ctx, dir, bob, leanX, sway, pose, cape);

  // 2. Legs, Greaves & Boots
  drawLegsAndBoots(ctx, dir, bob, leanX, stepL, stepR, pose, legPal, feetPal, armor);

  // 3. Torso, Chest Armor, Class Motif & Neck Amulet (or Back Cape in 'up')
  drawTorsoAndNeck(ctx, dir, bob, leanX, pose, pal, clsId, armor, cape, neckSpec);

  // 4. Class Shoulders / Pauldrons & Hands / Gauntlets / Ring Glint
  drawClassShouldersAndHands(ctx, dir, bob, leanX, pose, pal, clsId, armor, handsSpec, ringSpec);

  // 5. Head, Helms & Class Head Crests
  drawHeadAndCrest(ctx, dir, bob, leanX, pal, clsId, headSpec);

  // 6. Weapon & Offhand (Guard draws offhand last so shield sits cleanly in front)
  if (pose === 'guard') {
    drawWeaponForDirPose(ctx, wepStyle, dir, pose, bob, leanX, wCol, hCol, isTrident);
    drawOffhandForDirPose(ctx, offStyle, wepStyle, dir, pose, bob, leanX, oMain, oTrim, wCol, hCol, pal.eye);
  } else {
    drawOffhandForDirPose(ctx, offStyle, wepStyle, dir, pose, bob, leanX, oMain, oTrim, wCol, hCol, pal.eye);
    drawWeaponForDirPose(ctx, wepStyle, dir, pose, bob, leanX, wCol, hCol, isTrident);
  }

  return addPixelOutline(c);
}

export function getCharacterSprites(faction = 'Solari', classId = 'solari_vanguard', equipment = {}) {
  const cleanFac = String(faction || '').trim().toLowerCase();
  let canonicalFac = 'Solari';
  if (cleanFac === 'terra' || cleanFac === 'terro' || cleanFac === 'earth' || cleanFac === 'root') canonicalFac = 'Terra';
  else if (cleanFac === 'umbri' || cleanFac === 'shadow' || cleanFac === 'void') canonicalFac = 'Umbri';
  else if (cleanFac === 'aether' || cleanFac === 'magic' || cleanFac === 'arcane') canonicalFac = 'Aether';

  const clsSpec = CLASSES_CATALOG[classId] || Object.values(CLASSES_CATALOG).find((c) => c.faction === canonicalFac) || CLASSES_CATALOG.solari_vanguard;
  const defEquip = clsSpec?.defaultEquipment || {};
  const eq = equipment || {};

  const headId = eq.head || '';
  const capeId = eq.cape || '';
  const neckId = eq.neck || '';
  const wepId = eq.weapon || defEquip.weapon || 'solari_spellblade';
  const armId = eq.body || eq.armor || defEquip.armor || 'sunforged_plate';
  const offId = eq.shield || eq.offhand || defEquip.offhand || 'radiant_shield';
  const legsId = eq.legs || '';
  const handsId = eq.hands || '';
  const feetId = eq.feet || '';
  const ringId = eq.ring || '';

  const cacheKey = `${canonicalFac}|${clsSpec.id}|${headId}|${capeId}|${wepId}|${armId}|${offId}|${legsId}|${handsId}|${feetId}|${neckId}|${ringId}`;
  if (paperdollCache.has(cacheKey)) return paperdollCache.get(cacheKey);
  if (paperdollCache.size > 1200) paperdollCache.clear();

  const hasDomCanvas = typeof document !== 'undefined' && typeof document.createElement === 'function';
  if (!hasDomCanvas) {
    const stubFrame = () => ({ width: 26, height: 28, __headlessStub: true });
    const dirs = ['down', 'up', 'left', 'right'];
    const out = {
      down: [],
      up: [],
      left: [],
      right: [],
      poses: { slash: {}, cast: {}, guard: {}, dash: {} },
    };
    for (const dir of dirs) {
      out[dir] = [stubFrame(), stubFrame(), stubFrame()];
      for (const pose of ['slash', 'cast', 'guard', 'dash']) {
        out.poses[pose][dir] = stubFrame();
      }
    }
    return out;
  }

  const pal = BASE_FACTION_PALETTES[canonicalFac] || BASE_FACTION_PALETTES.Solari;
  const headSpec = headId ? EQUIPMENT_CATALOG[headId] : null;
  const capeSpec = capeId ? EQUIPMENT_CATALOG[capeId] : null;
  const neckSpec = neckId ? EQUIPMENT_CATALOG[neckId] : null;
  const armSpec = EQUIPMENT_CATALOG[armId];
  const wepSpec = EQUIPMENT_CATALOG[wepId] || EQUIPMENT_CATALOG[defEquip.weapon] || EQUIPMENT_CATALOG.solari_spellblade;
  const offSpec = EQUIPMENT_CATALOG[offId] || EQUIPMENT_CATALOG[defEquip.offhand] || EQUIPMENT_CATALOG.radiant_shield;
  const legsSpec = legsId ? EQUIPMENT_CATALOG[legsId] : null;
  const handsSpec = handsId ? EQUIPMENT_CATALOG[handsId] : null;
  const feetSpec = feetId ? EQUIPMENT_CATALOG[feetId] : null;
  const ringSpec = ringId ? EQUIPMENT_CATALOG[ringId] : null;

  const armor = resolveArmorVisuals(armId, armSpec, pal);
  const cape = resolveCapeVisuals(capeSpec, armSpec, pal);

  const legOverride = legsSpec ? LEG_OVERRIDES[legsSpec.id] : null;
  const legPal = legsSpec
    ? {
        equipped: true,
        ...(legOverride || getRarityColors(legsSpec, armor.dark, armor.mid, armor.glint)),
      }
    : { equipped: false, dark: armor.dark, mid: armor.mid, hi: armor.glint, trim: null, style: 'plate' };

  const feetOverride = feetSpec ? FEET_OVERRIDES[feetSpec.id] : null;
  const feetPal = feetSpec
    ? (feetOverride || getRarityColors(feetSpec, pal.bootDark, armor.dark, armor.glint))
    : { dark: pal.bootDark, mid: armor.dark, hi: armor.mid };

  const wepStyle = resolveWeaponStyle(wepId, wepSpec, clsSpec.id, defEquip);
  const wCol = wepSpec?.bladeColor || '#e2e8f0';
  const hCol = wepSpec?.hiltColor || '#facc15';
  const isTrident = String(wepId).includes('trident');

  const offStyle = resolveOffhandStyle(offId, offSpec, defEquip, wepStyle);
  const { main: oMain, trim: oTrim } = getOffhandFallbackColors(offId, offSpec);

  const renderOpts = {
    pal,
    clsId: clsSpec.id,
    armor,
    cape,
    headSpec,
    neckSpec,
    legPal,
    feetPal,
    handsSpec,
    ringSpec,
    wepStyle,
    wCol,
    hCol,
    isTrident,
    offStyle,
    oMain,
    oTrim,
  };

  const dirs = ['down', 'up', 'left', 'right'];
  const out = {
    down: [],
    up: [],
    left: [],
    right: [],
    poses: {
      slash: {},
      cast: {},
      guard: {},
      dash: {},
    },
  };

  for (const dir of dirs) {
    for (let f = 0; f < 3; f++) {
      out[dir].push(renderCharacterFrame({
        ...renderOpts,
        dir,
        frame: f,
        pose: f === 0 ? 'idle' : 'walk',
      }));
    }
    for (const pose of ['slash', 'cast', 'guard', 'dash']) {
      out.poses[pose][dir] = renderCharacterFrame({
        ...renderOpts,
        dir,
        frame: 0,
        pose,
      });
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
