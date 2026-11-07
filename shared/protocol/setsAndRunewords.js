import { ROOM_TYPES } from "./rooms.js";
import { EQUIPMENT_GEAR } from "./equipmentGear.js";
import { EQUIPMENT_MATERIALS } from "./equipmentMaterials.js";

export const EQUIPMENT_CATALOG = {
  ...EQUIPMENT_GEAR,
  ...EQUIPMENT_MATERIALS,
};

// ==========================================
// Day 3 — Mythic Leyline Keystones & Dungeon Affixes
// ==========================================
export const MYTHIC_KEYSTONE_MAX_TIER = 10;

export const MYTHIC_AFFIXES = {
  volcanic: {
    id: 'volcanic',
    name: 'Volcanic',
    icon: '🌋',
    color: '#f97316',
    desc: 'Lava plumes erupt beneath champions who linger, forcing constant movement.',
  },
  bolstering: {
    id: 'bolstering',
    name: 'Bolstering',
    icon: '🔺',
    color: '#facc15',
    desc: 'Slaying a monster empowers nearby foes with +15% maximum Health and damage.',
  },
  sanguine: {
    id: 'sanguine',
    name: 'Sanguine',
    icon: '🩸',
    color: '#ef4444',
    desc: 'Fallen enemies leave blood pools that heal their surviving allies.',
  },
};

export const MYTHIC_DUNGEONS = {
  solari: { id: 'solari', faction: 'Solari', roomType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, name: 'Sunken Vault', color: '#facc15' },
  umbri: { id: 'umbri', faction: 'Umbri', roomType: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH, name: 'Shadow Labyrinth', color: '#c084fc' },
  terra: { id: 'terra', faction: 'Terra', roomType: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY, name: 'Overgrowth Sanctuary', color: '#4ade80' },
  aether: { id: 'aether', faction: 'Aether', roomType: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE, name: 'Fractured Archive', color: '#38bdf8' },
};

export const MYTHIC_AFFIX_IDS = ['volcanic', 'bolstering', 'sanguine'];

// 7:30 at Tier 1 up to 12:00 at Tier 10.
export function getMythicRunDuration(tier) {
  return 420 + Math.max(1, Math.min(MYTHIC_KEYSTONE_MAX_TIER, Number(tier) || 1)) * 30;
}

// +18% enemy Health & damage per tier (T10 = +162%).
export function getMythicEnemyScale(tier) {
  return 1 + (Math.max(1, Math.min(MYTHIC_KEYSTONE_MAX_TIER, Number(tier) || 1)) - 1) * 0.18;
}

// +12% enemy XP per tier so high keys stay worth running.
export function getMythicXpScale(tier) {
  return 1 + Math.max(1, Math.min(MYTHIC_KEYSTONE_MAX_TIER, Number(tier) || 1)) * 0.12;
}

// Two affixes below Tier 7, all three from Tier 7 upward.
export function getMythicAffixesForTier(tier) {
  const t = Math.max(1, Math.min(MYTHIC_KEYSTONE_MAX_TIER, Number(tier) || 1));
  const count = t >= 7 ? MYTHIC_AFFIX_IDS.length : 2;
  const pool = [...MYTHIC_AFFIX_IDS];
  const picked = [];
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

for (const dungeon of Object.values(MYTHIC_DUNGEONS)) {
  for (let tier = 1; tier <= MYTHIC_KEYSTONE_MAX_TIER; tier++) {
    const duration = getMythicRunDuration(tier);
    const durationLabel = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
    EQUIPMENT_CATALOG[`keystone_${dungeon.id}_${tier}`] = {
      id: `keystone_${dungeon.id}_${tier}`,
      slot: 'keystone',
      name: `${dungeon.name} Keystone • Tier ${tier}`,
      icon: '🗝️',
      rarity: tier >= 9 ? 'Mythic Keystone' : tier >= 5 ? 'Legendary Keystone' : 'Rare Keystone',
      stackable: true,
      guidePrice: 200 + tier * 85,
      keystone: { dungeonId: dungeon.id, tier },
      desc: `A humming leyline key attuned to ${dungeon.name}. Activate it inside the crypt to raise a Tier ${tier} Mythic run: enemies gain +${Math.round((getMythicEnemyScale(tier) - 1) * 100)}% Health and damage, with ${tier >= 7 ? 'three' : 'two'} random affixes. Clear the boss within ${durationLabel} to crystallize the Mythic cache.`,
    };
  }
}

// Ensure all items across GlimmerFall Online are canonical stackable items (up to 99,999)
for (const item of Object.values(EQUIPMENT_CATALOG)) {
  item.stackable = true;
}

export const CANONICAL_SETS = {
  sunforged_daystar: {
    id: 'sunforged_daystar',
    name: 'Sunforged Daystar Bulwark',
    color: '#facc15',
    faction: 'Solari',
    pieces: ['sunforged_greathelm', 'sunforged_hauberk', 'sunforged_greaves', 'sunforged_warhammer'],
    bonusStats: { power: 4, bastion: 4 },
    perkTitle: 'Sunforged Daystar Wrath (4/4)',
    perkDesc: 'Deal up to +75% increased damage as your health drops. Below 25% HP, triggers an absorption shield equal to 40% Max HP.'
  },
  ironwood_primordial: {
    id: 'ironwood_primordial',
    name: 'Primordial Ironwood Bastion',
    color: '#4ade80',
    faction: 'Terra',
    pieces: ['ironwood_horned_helm', 'ironwood_bark_chest', 'ironwood_thighguards', 'ironwood_spear'],
    bonusStats: { bastion: 6, power: 2 },
    perkTitle: 'Primordial Thorn Leech (4/4)',
    perkDesc: 'Attacks have a 25% chance to leech 100% damage back as instant Health, and permanently reflects 25% melee damage to attackers.'
  },
  chrono_astral: {
    id: 'chrono_astral',
    name: 'Chrono-Weaver Astral Vestments',
    color: '#38bdf8',
    faction: 'Aether',
    pieces: ['chrono_astral_hood', 'chrono_astral_robes', 'chrono_astral_skirt', 'chrono_warp_staff'],
    bonusStats: { resonance: 5, tempo: 4 },
    perkTitle: 'Chrono-Weaver Temporal Cascade (4/4)',
    perkDesc: 'Cast speed +25%, ability cooldowns reduced by 25%, and Rites have a 25% chance to cast an instant duplicate echo.'
  },
  duskveil_reaver: {
    id: 'duskveil_reaver',
    name: 'Duskveil Shadow Reaver',
    color: '#c084fc',
    faction: 'Umbri',
    pieces: ['duskveil_shadow_mask', 'duskveil_assassin_garb', 'duskveil_void_chaps', 'duskveil_twin_daggers'],
    bonusStats: { power: 5, tempo: 3 },
    perkTitle: 'Duskveil Void Wraith (4/4)',
    perkDesc: 'Critical strike chance +18%, movement speed +15%, and slaying an enemy summons a Shadow Wraith minion for 15 seconds.'
  },
  aurelius_titan: {
    id: 'aurelius_titan',
    name: 'Aurelius Sovereign Titan',
    color: '#fde047',
    faction: 'Empyrean',
    pieces: ['crown_of_dawn', 'aurelius_sovereign_plate', 'aurelius_starforged_greaves', 'aurelius_morningstar_blade'],
    bonusStats: { power: 6, bastion: 6, resonance: 4, tempo: 3 },
    perkTitle: 'Empyrean Titan Sovereign (4/4)',
    perkDesc: 'Permanent radiating Archon Aura dealing 25 Holy damage/sec to nearby enemies, +150 Max Health, and +30% Glimmer generation.'
  }
};

export const BARROWS_SETS = CANONICAL_SETS;

export function getActiveSetBonuses(equipment = {}) {
  const active = [];
  const progress = [];
  const equippedIds = new Set(Object.values(equipment || {}));
  for (const setKey of Object.keys(BARROWS_SETS)) {
    const s = BARROWS_SETS[setKey];
    const matchCount = s.pieces.filter((p) => equippedIds.has(p)).length;
    if (matchCount === s.pieces.length) {
      active.push(s);
    } else if (matchCount >= 2) {
      progress.push({ set: s, count: matchCount, total: s.pieces.length });
    }
  }
  return { active, progress };
}

// ==========================================
// Day 4 — Canonical 3-Socket Runeword Synergies (Helm + Chest + Weapon Sockets)
// ==========================================
export const RUNEWORD_SYNERGIES = [
  {
    id: 'runeword_sovereign_trinity',
    name: 'Sovereign Trinity',
    formulaLabel: 'SOL + UMB + ZOD',
    requiredSockets: ['rune_sol', 'rune_umb', 'rune_zod'],
    color: '#fde047',
    bonusStats: { power: 8, bastion: 6, resonance: 6, tempo: 6 },
    bonusHp: 50,
    bonusGlimmer: 30,
    bonusCrit: 0.06,
    dmgMult: 1.12,
    perkDesc: '+8 Power, +6 Bastion/Resonance/Tempo, +50 Max HP, +6% Crit Chance & +12% All Damage.',
  },
  {
    id: 'runeword_dawnbreaker',
    name: 'Dawnbreaker Radiance',
    formulaLabel: 'SOL + Solar Ruby + AET',
    requiredSockets: ['rune_sol', 'gem_solar_ruby', 'rune_aet'],
    color: '#facc15',
    bonusStats: { power: 7, resonance: 6 },
    bonusHp: 35,
    bonusGlimmer: 20,
    dmgMult: 1.10,
    perkDesc: '+7 Power, +6 Resonance, +35 Max HP, +20 Max Glimmer & +10% Radiant Ability Damage.',
  },
  {
    id: 'runeword_eclipse_reaper',
    name: 'Eclipse Reaper',
    formulaLabel: 'UMB + Void Sapphire + ZOD',
    requiredSockets: ['rune_umb', 'gem_void_sapphire', 'rune_zod'],
    color: '#c084fc',
    bonusStats: { power: 7, tempo: 7 },
    bonusCrit: 0.08,
    bonusLeech: 0.07,
    perkDesc: '+7 Power, +7 Tempo, +8% Critical Strike Chance & +7% Life Leech on hit.',
  },
  {
    id: 'runeword_worldtree_aegis',
    name: 'Worldtree Aegis',
    formulaLabel: 'TER + Terra Emerald + SOL',
    requiredSockets: ['rune_ter', 'gem_terra_emerald', 'rune_sol'],
    color: '#4ade80',
    bonusStats: { bastion: 10, power: 3 },
    bonusHp: 75,
    bonusDr: 0.07,
    bonusRegen: 2.0,
    perkDesc: '+10 Bastion, +75 Max HP, +7% Damage Reduction & +2.0 HP/s Regeneration.',
  },
  {
    id: 'runeword_chrono_infinity',
    name: 'Chrono Infinity',
    formulaLabel: 'AET + Aether Diamond + ZOD',
    requiredSockets: ['rune_aet', 'gem_aether_diamond', 'rune_zod'],
    color: '#38bdf8',
    bonusStats: { resonance: 9, tempo: 6 },
    bonusGlimmer: 45,
    bonusCdr: 0.10,
    bonusCastSpeed: 0.10,
    perkDesc: '+9 Resonance, +6 Tempo, +45 Max Glimmer, -10% Cooldowns & +10% Faster Cast Speed.',
  },
  {
    id: 'runeword_prismatic_convergence',
    name: 'Prismatic Convergence',
    formulaLabel: 'Any 3 Distinct Cut Leyline Gems',
    anyThreeDistinctFrom: ['gem_solar_ruby', 'gem_void_sapphire', 'gem_terra_emerald', 'gem_aether_diamond'],
    color: '#2dd4bf',
    bonusStats: { power: 4, bastion: 4, resonance: 4, tempo: 4 },
    bonusHp: 30,
    bonusGlimmer: 20,
    perkDesc: '+4 All Combat Stats, +30 Max HP & +20 Max Glimmer when socketing 3 distinct Cut Leyline Gems.',
  },
];

export function getActiveRuneword(equipment = {}) {
  if (!equipment) return null;
  const s1 = equipment.socket_head || equipment.socket_1;
  const s2 = equipment.socket_body || equipment.socket_2;
  const s3 = equipment.socket_weapon || equipment.socket_3;
  if (!s1 || !s2 || !s3) return null;
  const socketArr = [s1, s2, s3];
  const socketSet = new Set(socketArr);

  for (const rw of RUNEWORD_SYNERGIES) {
    if (Array.isArray(rw.requiredSockets)) {
      if (
        socketSet.size === rw.requiredSockets.length &&
        rw.requiredSockets.every((reqId) => socketSet.has(reqId))
      ) {
        return rw;
      }
    } else if (Array.isArray(rw.anyThreeDistinctFrom)) {
      if (
        socketSet.size === 3 &&
        socketArr.every((id) => rw.anyThreeDistinctFrom.includes(id))
      ) {
        return rw;
      }
    }
  }
  return null;
}
