import { EQUIPMENT_CATALOG } from "./setsAndRunewords.js";

const GEAR_SLOTS = new Set([
  'weapon', 'armor', 'body', 'offhand', 'shield', 'head', 'legs',
  'cape', 'neck', 'hands', 'feet', 'ring', 'ammo',
]);

const SOCKET_GEMS = ['gem_solar_ruby', 'gem_void_sapphire', 'gem_terra_emerald', 'gem_aether_diamond'];
const ANCIENT_RUNES = ['rune_sol', 'rune_umb', 'rune_ter', 'rune_aet'];

const TIER_1_GEAR = [
  'iron_broadsword', 'novice_oak_staff', 'scout_leather_tunic',
  'scout_leather_leggings', 'iron_heater_shield', 'apprentice_focus_orb',
  'linen_traveller_cloak', 'copper_ring', 'radiant_cape',
  'vanguard_gauntlets', 'boots_of_haste',
];

const TIER_2_GEAR = [
  'star_iron_scimitar', 'solari_spellblade', 'duskveil_shroud',
  'starweave_robe', 'radiant_shield', 'graveglass_lantern',
  'bramble_buckler', 'abyssal_cloak', 'duskveil_silk_mantle',
  'amulet_of_glory', 'ring_of_the_sun', 'ring_of_stone', 'granite_boots',
];

const TIER_3_GEAR = [
  'umbral_steel_platebody', 'astral_mithril_greatsword', 'mystic_leystrand_robes',
  'mirror_shield', 'adamant_bulwark_shield', 'celestial_talisman',
  'ring_of_void_leech', 'abyssal_cloak', 'granite_boots', 'amulet_of_glory',
];

const TIER_4_APEX_GEAR = [
  'starmetal_cosmos_blade', 'starmetal_cosmos_plate', 'celestial_gossamer_cloak',
  'amulet_of_fury', 'barrows_gloves', 'fire_cape',
];

export function parseEntityLevel(ent) {
  if (!ent) return 1;
  if (Number.isFinite(ent.level) && ent.level > 0) return Math.floor(ent.level);
  const sub = String(ent.sub || '');
  const m = sub.match(/Lv\.?\s*(\d+)/i);
  if (m) return Math.max(1, Math.min(99, parseInt(m[1], 10)));
  return ent.isBoss ? 12 : 1;
}

export function getMobLootGearPool(mobLv = 1) {
  if (mobLv >= 45) return TIER_3_GEAR;
  if (mobLv >= 29) return TIER_3_GEAR;
  if (mobLv >= 13) return TIER_2_GEAR;
  return TIER_1_GEAR;
}

export function getZoneFactionCurrency(roomType) {
  const rType = String(roomType || '').toLowerCase();
  if (rType.includes('aether') || rType.includes('starfall') || rType.includes('chronocore')) return 'chrono_gem';
  if (rType.includes('terra') || rType.includes('ironwood') || rType.includes('starlight') || rType.includes('oasis') || rType.includes('moonwell')) return 'verdant_amber';
  if (rType.includes('umbri') || rType.includes('abyssal')) return 'void_essence';
  return 'glimmer_shard';
}

export function rollMobLootDrops({
  roomType,
  ent,
  getBossSetDrop,
  getBossAccessoryDrop,
  getKeystoneDrop,
  getZoneMaterialDrop,
}) {
  const drops = [];
  const mobLv = parseEntityLevel(ent);
  const isBoss = Boolean(ent?.isBoss);
  const isElite = Boolean(ent?.eliteAffix);

  // Bosses drop an Ancient Relic Cache (XP surge) alongside guaranteed gear.
  // Regular mobs and elites no longer clutter the battlefield with Vital/Glimmer orbs.
  if (isBoss) {
    drops.push({ kind: 'relic', itemId: null, qty: 1 });
  }

  // 1. Solar Gold Sovereigns — scaled cleanly with mob level, elite, and boss tier
  const goldQty = isBoss
    ? Math.round(140 + mobLv * 8 + Math.random() * (120 + mobLv * 3))
    : isElite
      ? Math.round(28 + mobLv * 3.2 + Math.random() * (24 + mobLv * 1.2))
      : Math.max(8, Math.round(6 + mobLv * 1.8 + Math.random() * (12 + mobLv * 0.9)));
  drops.push({ kind: 'item', itemId: 'solar_gold', qty: goldQty });

  // 2. Faction Elemental Currency (45% normal mobs, 100% elites & bosses)
  if (isBoss || isElite || Math.random() < 0.45) {
    const factionCurr = getZoneFactionCurrency(roomType);
    const factionCurrQty = isBoss
      ? 15 + Math.floor(mobLv * 0.4) + Math.floor(Math.random() * 15)
      : isElite
        ? 3 + Math.floor(mobLv / 12) + Math.floor(Math.random() * 3)
        : (mobLv >= 25 ? 2 : 1) + Math.floor(Math.random() * 2);
    drops.push({ kind: 'item', itemId: factionCurr, qty: factionCurrQty });
  }

  // 2b. Cosmic Artisan Crafting Materials (35% normal mobs, 100% elites & bosses)
  if (isBoss || isElite || Math.random() < 0.35) {
    const matId = typeof getZoneMaterialDrop === 'function' ? getZoneMaterialDrop() : null;
    const matQty = isBoss ? 2 + Math.floor(Math.random() * 3) : isElite ? 2 : 1;
    if (matId && EQUIPMENT_CATALOG[matId]) {
      drops.push({ kind: 'item', itemId: matId, qty: matQty });
    }
  }

  // 2c. Ancient Relic Fragments (100% bosses, 28% elites, 6% Lv.18+ mobs)
  if (isBoss || (isElite && Math.random() < 0.28) || (mobLv >= 18 && Math.random() < 0.06)) {
    const fragQty = isBoss ? 1 + Math.floor(mobLv / 25) : 1;
    drops.push({ kind: 'item', itemId: 'ancient_relic_fragment', qty: fragQty });
  }

  // 2d. Leyline Socket Gems & Ancient Runes
  if ((isElite && Math.random() < 0.20) || (!isBoss && !isElite && mobLv >= 20 && Math.random() < 0.03)) {
    const gemId = SOCKET_GEMS[Math.floor(Math.random() * SOCKET_GEMS.length)];
    drops.push({ kind: 'item', itemId: gemId, qty: 1, ttl: 60 });
  }
  if ((isBoss && mobLv >= 28 && Math.random() < 0.35) || (isElite && mobLv >= 30 && Math.random() < 0.06)) {
    const runeId = ANCIENT_RUNES[Math.floor(Math.random() * ANCIENT_RUNES.length)];
    drops.push({ kind: 'item', itemId: runeId, qty: 1, ttl: 70 });
  }

  // 2e. Summoner-Knight Echo-Prints (Companion blueprints dropped cleanly by Bosses, Elites & Zone Mobs)
  const echoChance = isBoss ? 0.45 : isElite ? 0.14 : mobLv >= 8 ? 0.035 : 0.02;
  if (Math.random() < echoChance) {
    const rType = String(roomType || '').toLowerCase();
    let echoId = 'echo_print_ember_fox';
    if (isBoss && mobLv >= 30 && Math.random() < 0.38) {
      echoId = 'echo_print_pyre_drake';
    } else if (rType.includes('terra') || rType.includes('ironwood') || rType.includes('starlight') || rType.includes('oasis') || rType.includes('coral') || rType.includes('moonwell')) {
      echoId = 'echo_print_ankyloling';
    } else if (rType.includes('umbri') || rType.includes('labyrinth') || rType.includes('abyssal')) {
      echoId = 'echo_print_wisp_imp';
    } else if (rType.includes('aether') || rType.includes('starfall') || rType.includes('chronocore')) {
      echoId = mobLv >= 25 && Math.random() < 0.45 ? 'echo_print_starfall_owl' : 'echo_print_prism_sprite';
    } else if (mobLv >= 25 && Math.random() < 0.25) {
      echoId = 'echo_print_starfall_owl';
    }
    if (EQUIPMENT_CATALOG[echoId]) {
      drops.push({ kind: 'item', itemId: echoId, qty: 1, ttl: isBoss ? 90 : 60 });
    }
  }

  // 3. Tiered Consumables (Alchemy Salves, Glimmer Draughts & Cooked Provisions)
  const consumableChance = isBoss ? 1.0 : isElite ? 0.32 : mobLv >= 15 ? 0.16 : 0.14;
  if (Math.random() < consumableChance) {
    let potPool = ['minor_healing_salve', 'glimmer_draught', 'fresh_crusty_bread'];
    if (mobLv >= 30) {
      potPool = ['major_vitality_elixir', 'astral_battle_tonic', 'glimmer_draught', 'pan_seared_prism_salmon'];
    } else if (mobLv >= 15) {
      potPool = ['spiced_orchard_pie', 'glimmer_draught', 'major_vitality_elixir', 'smoked_solar_trout'];
    }
    const potId = potPool[Math.floor(Math.random() * potPool.length)];
    drops.push({ kind: 'item', itemId: potId, qty: isBoss ? (mobLv >= 30 ? 3 : 2) : 1 });
  }

  // 4. Equipment Drops (Guaranteed Legendary Cache on Bosses, Level-Bracketed Smart Loot on Elites/Mobs)
  if (isBoss) {
    const setPieceId = typeof getBossSetDrop === 'function' ? getBossSetDrop() : null;
    const accessoryId = typeof getBossAccessoryDrop === 'function' ? getBossAccessoryDrop() : null;
    if (setPieceId) drops.push({ kind: 'item', itemId: setPieceId, qty: 1, ttl: 60 });
    if (accessoryId) drops.push({ kind: 'item', itemId: accessoryId, qty: 1, ttl: 60 });
    const keystoneId = typeof getKeystoneDrop === 'function' ? getKeystoneDrop() : null;
    if (keystoneId) drops.push({ kind: 'item', itemId: keystoneId, qty: 1, ttl: 90 });
  } else {
    const gearChance = isElite ? 0.25 : 0.07;
    if (Math.random() < gearChance) {
      let dropId;
      if (isElite && mobLv >= 45 && Math.random() < 0.16) {
        dropId = TIER_4_APEX_GEAR[Math.floor(Math.random() * TIER_4_APEX_GEAR.length)];
      } else {
        const pool = getMobLootGearPool(mobLv);
        dropId = pool[Math.floor(Math.random() * pool.length)];
      }
      if (dropId && EQUIPMENT_CATALOG[dropId]) {
        drops.push({ kind: 'item', itemId: dropId, qty: 1, ttl: isElite ? 55 : 40 });
      }
    }
  }

  return drops;
}

export function getLootRarityTier(itemId, kind = 'item') {
  if (kind === 'relic') return 'legendary';
  if (!itemId) return 'common';
  const def = EQUIPMENT_CATALOG[itemId];
  if (!def) return 'common';
  const r = String(def.rarity || '');
  if (
    r.includes('Mythic') || r.includes('Apex') || r.includes('Legendary') ||
    r.includes('Set') || r.includes('Skill Mastery') || r.includes('Continental Relic')
  ) {
    return 'legendary';
  }
  if (r.includes('Epic') || r.includes('Rune') || r.includes('Caldera')) return 'epic';
  if (r.includes('Rare') || r.includes('Relic') || def.slot === 'socket_gem' || def.slot === 'keystone') return 'rare';
  if (r.includes('Uncommon') || r.includes('Awakened')) return 'uncommon';
  return 'common';
}

export function isGearSalvageable(itemId) {
  const def = itemId ? EQUIPMENT_CATALOG[itemId] : null;
  if (!def) return false;
  return GEAR_SLOTS.has(def.slot);
}

export function isHighValueSalvage(itemId) {
  const tier = getLootRarityTier(itemId, 'item');
  return tier === 'legendary' || tier === 'epic';
}

export function getSalvageYield(itemId) {
  const def = itemId ? EQUIPMENT_CATALOG[itemId] : null;
  if (!def || !GEAR_SLOTS.has(def.slot)) return null;

  const tier = getLootRarityTier(itemId, 'item');
  if (tier === 'legendary') {
    return {
      tierLabel: 'Mythic / Set',
      gold: 150,
      xp: 140,
      profId: 'relic_forging',
      materials: [
        { id: 'astral_mineral_dust', qty: 4 },
        { id: 'ancient_relic_fragment', qty: 2 },
        { id: 'celestial_runite_ore', qty: 1 },
      ],
    };
  }
  if (tier === 'epic') {
    return {
      tierLabel: 'Epic',
      gold: 75,
      xp: 85,
      profId: 'relic_forging',
      materials: [
        { id: 'astral_mineral_dust', qty: 3 },
        { id: 'ancient_relic_fragment', qty: 1 },
        { id: 'chrono_gem', qty: 2 },
      ],
    };
  }
  if (tier === 'rare') {
    return {
      tierLabel: 'Rare',
      gold: 35,
      xp: 45,
      profId: 'relic_forging',
      materials: [
        { id: 'astral_mineral_dust', qty: 2 },
        { id: 'umbral_steel_bar', qty: 1 },
        { id: 'glimmer_shard', qty: 1 },
      ],
    };
  }
  if (tier === 'uncommon') {
    return {
      tierLabel: 'Uncommon',
      gold: 18,
      xp: 24,
      profId: 'relic_forging',
      materials: [
        { id: 'astral_mineral_dust', qty: 2 },
        { id: 'star_iron_bar', qty: 1 },
      ],
    };
  }
  return {
    tierLabel: 'Common',
    gold: 10,
    xp: 12,
    profId: 'relic_forging',
    materials: [
      { id: 'astral_mineral_dust', qty: 1 },
    ],
  };
}
