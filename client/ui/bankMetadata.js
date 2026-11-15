// ==========================================
// GlimmerFall Online 2D — AetherVault Item Metadata, Skill Tagging & Gear Diffs
// Deterministic classification layer powering Bank filters, badges, recipe hints & comparisons
// ==========================================

import {
  EQUIPMENT_CATALOG,
  CRAFTING_RECIPES,
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  MYTHIC_DUNGEONS,
} from '../../shared/protocol.js';
import { getRarityRank } from './inventoryHelpers.js';

export const BANK_GEAR_SLOTS = new Set([
  'weapon', 'body', 'armor', 'legs', 'head', 'shield', 'offhand',
  'cape', 'neck', 'ring', 'hands', 'feet', 'ammo',
]);

export const BANK_CATEGORY_DEFS = [
  { key: 'all', icon: '🏛️', label: 'All Vault' },
  { key: 'gear', icon: '⚔️', label: 'Gear & Armory' },
  { key: 'material', icon: '🪨', label: 'Materials' },
  { key: 'consumable', icon: '🧪', label: 'Food & Potions' },
  { key: 'gems_keys', icon: '💎', label: 'Gems & Keys' },
  { key: 'currency', icon: '🪙', label: 'Currencies' },
];

export const BANK_SKILL_FILTERS = [
  { key: 'all', icon: '✨', label: 'All Skills', color: '#e2e8f0' },
  { key: 'resonance_extraction', icon: '⛏️', label: 'Extraction & Gathering', color: '#38bdf8' },
  { key: 'relic_forging', icon: '🔨', label: 'Relic-Forging', color: '#f97316' },
  { key: 'rite_binding', icon: '📜', label: 'Rite-Binding', color: '#a855f7' },
  { key: 'glimmerweaving', icon: '🧶', label: 'Weaving & Hearthcraft', color: '#10b981' },
  { key: 'combat_mastery', icon: '⚔️', label: 'Combat & Armory', color: '#ef4444' },
  { key: 'rites', icon: '☀️', label: 'Rites (Arcane/Heal)', color: '#f59e0b' },
  { key: 'flashes', icon: '⚡', label: 'Flashes (Tempo/Crit)', color: '#06b6d4' },
];

export const BANK_GEAR_SUBFILTERS = [
  { key: 'all', label: 'All Slots' },
  { key: 'weapons', label: 'Weapons' },
  { key: 'armor', label: 'Armor' },
  { key: 'jewelry', label: 'Jewelry' },
  { key: 'offhand_cape', label: 'Offhand / Cape' },
];

export const BANK_RARITY_FILTERS = [
  { key: 'all', label: 'All Rarities', minRank: 1 },
  { key: 'uncommon', label: 'Uncommon+', minRank: 2 },
  { key: 'rare', label: 'Rare+', minRank: 3 },
  { key: 'epic', label: 'Epic+', minRank: 4 },
  { key: 'legendary', label: 'Legendary / Mythic', minRank: 5 },
];

export const BANK_SORT_OPTIONS = [
  { key: 'smart', label: 'Smart Group' },
  { key: 'skill', label: 'Skill / Profession' },
  { key: 'rarity', label: 'Rarity (High→Low)' },
  { key: 'value', label: 'Total Gold Value' },
  { key: 'qty', label: 'Stack Quantity' },
  { key: 'name', label: 'Name (A→Z)' },
];

const WEAPON_SLOTS = new Set(['weapon']);
const ARMOR_SLOTS = new Set(['head', 'body', 'armor', 'legs', 'hands', 'feet']);
const JEWELRY_SLOTS = new Set(['neck', 'ring', 'ammo']);
const OFFHAND_CAPE_SLOTS = new Set(['shield', 'offhand', 'cape']);

const recipeIndex = new Map();
let recipeIndexBuilt = false;

function ensureRecipeIndex() {
  if (recipeIndexBuilt) return;
  recipeIndexBuilt = true;
  for (const r of CRAFTING_RECIPES) {
    if (!r) continue;
    if (r.outputId) {
      let entry = recipeIndex.get(r.outputId);
      if (!entry) {
        entry = { producedBy: [], usedIn: [] };
        recipeIndex.set(r.outputId, entry);
      }
      entry.producedBy.push({
        recipeId: r.id,
        profession: r.profession,
        reqLevel: r.reqLevel || 1,
        station: r.station || '',
      });
    }
    for (const ing of r.ingredients || []) {
      if (!ing?.id) continue;
      let entry = recipeIndex.get(ing.id);
      if (!entry) {
        entry = { producedBy: [], usedIn: [] };
        recipeIndex.set(ing.id, entry);
      }
      const outItem = EQUIPMENT_CATALOG[r.outputId];
      entry.usedIn.push({
        recipeId: r.id,
        outputId: r.outputId,
        outputName: outItem?.name || r.outputId,
        profession: r.profession,
        reqLevel: r.reqLevel || 1,
        qtyNeeded: ing.qty || 1,
      });
    }
  }
}

const capeProfessionByItemId = new Map(
  Object.entries(PROFESSION_MASTERY_CAPES || {}).map(([profId, itemId]) => [itemId, profId]),
);

const metadataCache = new Map();

function buildSummaryLine(it, recInfo) {
  const stats = it.stats || {};
  const parts = [];
  if (stats.power) parts.push(`+${stats.power} Pwr`);
  if (stats.bastion) parts.push(`+${stats.bastion} Bas`);
  if (stats.resonance) parts.push(`+${stats.resonance} Res`);
  if (stats.tempo) parts.push(`+${stats.tempo} Tmp`);
  if (stats.maxHp) parts.push(`+${stats.maxHp} HP`);
  if (stats.critPct) parts.push(`+${Math.round(stats.critPct * 100)}% Crit`);
  if (parts.length > 0) return parts.slice(0, 3).join(' · ');

  if (it.healHp && it.restoreGlimmer) return `+${it.healHp} HP · +${it.restoreGlimmer} Glimmer`;
  if (it.healHp) return `Restores ${it.healHp} HP`;
  if (it.restoreGlimmer) return `Restores ${it.restoreGlimmer} Glimmer`;
  if (it.temperTargetMax) return `Temper Gear (up to +${it.temperTargetMax})`;
  if (it.weaponImbue) {
    const im = it.weaponImbue;
    const buffs = [
      im.power ? `+${im.power} Pwr` : '',
      im.resonance ? `+${im.resonance} Res` : '',
      im.tempo ? `+${im.tempo} Tmp` : '',
      im.critPct ? `+${Math.round(im.critPct * 100)}% Crit` : '',
    ].filter(Boolean);
    return `Imbue (${Math.round((im.durationSec || 600) / 60)}m): ${buffs.join(' · ')}`;
  }
  if (it.wellFed) {
    const wf = it.wellFed;
    const buffs = [
      wf.power ? `+${wf.power} Pwr` : '',
      wf.bastion ? `+${wf.bastion} Bas` : '',
      wf.resonance ? `+${wf.resonance} Res` : '',
    ].filter(Boolean);
    return `Well-Fed (${Math.round((wf.durationSec || 600) / 60)}m): ${buffs.join(' · ')}`;
  }
  if (it.keystone) {
    const dungeon = MYTHIC_DUNGEONS?.[it.keystone.dungeonId];
    return `T${it.keystone.tier} ${dungeon?.name || 'Mythic Crypt'}`;
  }
  if (it.socketBonus) return it.socketBonus;
  if (recInfo.usedIn.length > 0) {
    const profName = PROFESSIONS_CATALOG[recInfo.usedIn[0].profession]?.name || 'Crafting';
    return `${profName} (${recInfo.usedIn.length} recipe${recInfo.usedIn.length > 1 ? 's' : ''})`;
  }
  if (it.slot === 'currency') return 'Realm Trade & Crafting Currency';
  return (it.desc || '').slice(0, 48);
}

/**
 * Classifies any EQUIPMENT_CATALOG item with category, matching skills/professions,
 * readable role label/icon, tier badge, and crafting recipe usage hints.
 */
export function classifyBankItem(itemId) {
  if (!itemId) return null;
  if (metadataCache.has(itemId)) return metadataCache.get(itemId);

  const it = EQUIPMENT_CATALOG[itemId];
  if (!it) return null;

  ensureRecipeIndex();
  const recInfo = recipeIndex.get(itemId) || { producedBy: [], usedIn: [] };
  const skills = new Set();
  const idLower = String(itemId).toLowerCase();
  const nameLower = String(it.name || '').toLowerCase();

  let category = 'gear';
  let equipSlotGroup = 'none';
  let roleIcon = '⚔️';
  let roleLabel = it.slot || 'Item';
  let tierLabel = '';

  if (BANK_GEAR_SLOTS.has(it.slot)) {
    category = 'gear';
    skills.add('combat_mastery');
    if (WEAPON_SLOTS.has(it.slot)) {
      equipSlotGroup = 'weapons';
      roleIcon = '⚔️';
      roleLabel = 'Weapon';
    } else if (ARMOR_SLOTS.has(it.slot)) {
      equipSlotGroup = 'armor';
      roleIcon = it.slot === 'head' ? '🪖' : it.slot === 'legs' ? '👖' : it.slot === 'hands' ? '🧤' : it.slot === 'feet' ? '🥾' : '🛡️';
      roleLabel = it.slot === 'armor' || it.slot === 'body' ? 'Chest Armor' : `${it.slot[0].toUpperCase()}${it.slot.slice(1)} Armor`;
    } else if (JEWELRY_SLOTS.has(it.slot)) {
      equipSlotGroup = 'jewelry';
      roleIcon = it.slot === 'ring' ? '💍' : it.slot === 'neck' ? '📿' : '✨';
      roleLabel = it.slot === 'ammo' ? 'Relic Slot' : `${it.slot[0].toUpperCase()}${it.slot.slice(1)}`;
    } else if (OFFHAND_CAPE_SLOTS.has(it.slot)) {
      equipSlotGroup = 'offhand_cape';
      roleIcon = it.slot === 'cape' ? '🧥' : '🛡️';
      roleLabel = it.slot === 'cape' ? 'Cape / Cloak' : 'Shield / Offhand';
    }

    const capeProf = capeProfessionByItemId.get(itemId);
    if (capeProf) {
      skills.add(capeProf);
      roleIcon = PROFESSIONS_CATALOG[capeProf]?.icon || '🧥';
      roleLabel = 'Lv.99 Skillcape';
      tierLabel = 'Lv.99';
    }
    if (it.stats?.resonance || it.stats?.maxGlimmer) skills.add('rites');
    if (it.stats?.tempo || it.stats?.critPct) skills.add('flashes');
    for (const r of recInfo.producedBy) {
      if (r.profession) skills.add(r.profession);
    }
    if (!tierLabel && it.reqLevel) tierLabel = `Lv.${it.reqLevel}`;
    if (!tierLabel && it.set) tierLabel = 'Set';
  } else if (it.slot === 'material') {
    category = 'material';
    if (idLower.includes('_bar') || idLower.includes('ingot')) {
      skills.add('relic_forging');
      roleIcon = '🧱';
      roleLabel = 'Smelted Alloy';
    } else if (idLower.includes('ore') || idLower.includes('coal') || idLower.includes('mineral') || idLower.includes('tin') || idLower.includes('fragment')) {
      skills.add('resonance_extraction');
      skills.add('relic_forging');
      roleIcon = '⛏️';
      roleLabel = 'Ore & Mineral';
    } else if (idLower.includes('logs') || idLower.includes('heartwood')) {
      skills.add('resonance_extraction');
      skills.add('glimmerweaving');
      roleIcon = '🪵';
      roleLabel = 'Timber Logs';
    } else if (idLower.includes('resin') || idLower.includes('sap') || idLower.includes('amber')) {
      skills.add('resonance_extraction');
      skills.add('rite_binding');
      roleIcon = '💧';
      roleLabel = 'Tree Resin';
    } else if (idLower.startsWith('raw_')) {
      skills.add('resonance_extraction');
      skills.add('glimmerweaving');
      roleIcon = '🐟';
      roleLabel = 'Raw Catch';
    } else if (idLower.includes('clam') || idLower.includes('pearl') || idLower.includes('scale') || idLower.includes('shell')) {
      skills.add('resonance_extraction');
      roleIcon = '🐚';
      roleLabel = 'Aquatic Trophy';
    } else if (idLower.includes('herb') || idLower.includes('spore') || idLower.includes('lotus') || idLower.includes('starleaf')) {
      skills.add('resonance_extraction');
      skills.add('rite_binding');
      roleIcon = '🌿';
      roleLabel = 'Alchemy Herb';
    } else if (idLower.includes('flax') || idLower.includes('silk') || idLower.includes('gossamer')) {
      skills.add('resonance_extraction');
      skills.add('glimmerweaving');
      roleIcon = '🧶';
      roleLabel = 'Weaving Fiber';
    } else {
      skills.add('resonance_extraction');
      roleIcon = '🪨';
      roleLabel = 'Material';
    }
    for (const r of recInfo.usedIn) {
      if (r.profession) skills.add(r.profession);
    }
    for (const r of recInfo.producedBy) {
      if (r.profession) skills.add(r.profession);
    }
    const minReq = recInfo.usedIn[0]?.reqLevel || recInfo.producedBy[0]?.reqLevel;
    if (minReq && minReq > 1) tierLabel = `Sk.${minReq}`;
  } else if (it.slot === 'consumable') {
    category = 'consumable';
    if (it.temperTargetMax) {
      skills.add('relic_forging');
      skills.add('combat_mastery');
      roleIcon = '🔨';
      roleLabel = 'Temper Sigil';
      tierLabel = `+${it.temperTargetMax}`;
    } else if (it.weaponImbue) {
      skills.add('rite_binding');
      skills.add('combat_mastery');
      roleIcon = '🗡️';
      roleLabel = 'Weapon Imbue';
    } else if (it.wellFed || idLower.includes('apple') || idLower.includes('bread') || idLower.includes('rations') || idLower.includes('pie') || idLower.includes('minnow') || idLower.includes('trout') || idLower.includes('salmon') || idLower.includes('eel') || idLower.includes('koi') || idLower.includes('feast') || idLower.includes('banquet') || idLower.includes('chowder')) {
      skills.add('glimmerweaving');
      skills.add('combat_mastery');
      roleIcon = '🍲';
      roleLabel = it.wellFed ? 'Combat Feast' : 'Cooked Food';
    } else if (idLower.includes('campfire')) {
      skills.add('glimmerweaving');
      roleIcon = '🔥';
      roleLabel = 'Campfire Kit';
    } else {
      skills.add('rite_binding');
      skills.add('combat_mastery');
      if (it.restoreGlimmer) skills.add('rites');
      roleIcon = '🧪';
      roleLabel = it.restoreGlimmer && !it.healHp ? 'Glimmer Elixir' : 'Vitality Potion';
    }
    for (const r of recInfo.producedBy) {
      if (r.profession) skills.add(r.profession);
    }
  } else if (it.slot === 'socket_gem' || it.slot === 'keystone') {
    category = 'gems_keys';
    skills.add('rite_binding');
    skills.add('combat_mastery');
    if (it.slot === 'keystone') {
      roleIcon = '🗝️';
      roleLabel = 'Mythic Keystone';
      tierLabel = it.keystone?.tier ? `T${it.keystone.tier}` : '';
    } else if (idLower.startsWith('rune_')) {
      roleIcon = '🗿';
      roleLabel = 'Ancient Rune';
    } else {
      skills.add('relic_forging');
      roleIcon = '💎';
      roleLabel = 'Socket Gem';
    }
    for (const r of recInfo.producedBy) {
      if (r.profession) skills.add(r.profession);
    }
  } else if (it.slot === 'currency') {
    category = 'currency';
    skills.add('resonance_extraction');
    if (idLower === 'glimmer_shard' || idLower === 'chrono_gem' || idLower === 'verdant_amber' || idLower === 'void_essence') {
      skills.add('rite_binding');
      skills.add('relic_forging');
    }
    roleIcon = idLower === 'solar_gold' ? '🪙' : '✨';
    roleLabel = idLower === 'solar_gold' ? 'Gold Currency' : 'Realm Essence';
  }

  // Fallback skill assignment for anything crafted/general
  if (skills.size === 0) skills.add('combat_mastery');
  for (const profId of Object.keys(PROFESSIONS_CATALOG)) {
    if (nameLower.includes(PROFESSIONS_CATALOG[profId].name.toLowerCase())) {
      skills.add(profId);
    }
  }

  const skillOrder = [
    'relic_forging',
    'rite_binding',
    'glimmerweaving',
    'resonance_extraction',
    'combat_mastery',
    'rites',
    'flashes',
  ];
  const orderedSkills = skillOrder.filter((s) => skills.has(s));
  const primarySkill = orderedSkills[0] || 'combat_mastery';

  const meta = {
    itemId,
    category,
    equipSlotGroup,
    skills: orderedSkills,
    primarySkill,
    primarySkillMeta: PROFESSIONS_CATALOG[primarySkill] || PROFESSIONS_CATALOG.combat_mastery,
    roleIcon,
    roleLabel,
    tierLabel,
    rarityRank: getRarityRank(it.rarity),
    usedInRecipes: recInfo.usedIn,
    producedByRecipes: recInfo.producedBy,
    summaryLine: buildSummaryLine(it, recInfo),
  };

  metadataCache.set(itemId, meta);
  return meta;
}

/**
 * Compares a vaulted/bag gear item against the player's currently equipped item in that slot.
 */
export function compareGearWithEquipped(itemId, profile) {
  const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
  if (!item || !BANK_GEAR_SLOTS.has(item.slot)) return null;

  const targetSlot = item.slot === 'armor' ? 'body' : item.slot === 'offhand' ? 'shield' : item.slot;
  const equippedId = profile?.equipment?.[targetSlot] || null;
  if (equippedId === itemId) {
    return { sameItem: true, targetSlot, equippedItem: item, diffs: [] };
  }
  const equippedItem = equippedId ? EQUIPMENT_CATALOG[equippedId] : null;
  const keys = [
    ['power', 'Pwr'],
    ['bastion', 'Bas'],
    ['resonance', 'Res'],
    ['tempo', 'Tmp'],
    ['maxHp', 'HP'],
    ['maxGlimmer', 'Glimmer'],
  ];
  const diffs = [];
  for (const [k, label] of keys) {
    const nextVal = Number(item.stats?.[k] || 0);
    const curVal = Number(equippedItem?.stats?.[k] || 0);
    const delta = nextVal - curVal;
    if (delta !== 0) diffs.push({ key: k, label, delta });
  }
  const nextCrit = Math.round(Number(item.stats?.critPct || 0) * 100);
  const curCrit = Math.round(Number(equippedItem?.stats?.critPct || 0) * 100);
  if (nextCrit !== curCrit) {
    diffs.push({ key: 'critPct', label: '% Crit', delta: nextCrit - curCrit });
  }
  return { sameItem: false, targetSlot, equippedItem, diffs };
}

export function formatCompactQty(qty) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10000) return `${Math.floor(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}
