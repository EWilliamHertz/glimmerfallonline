import { CLASSES_CATALOG } from "./factionsAndClasses.js";
import { EQUIPMENT_CATALOG, getActiveSetBonuses, getActiveRuneword } from "./setsAndRunewords.js";
import { PROFESSIONS_CATALOG } from "./craftingAndSkilling.js";

export const MAX_BASE_LEVEL = 30;

export const PARAGON_AFFINITIES = {
  solari_radiance: {
    id: 'solari_radiance',
    name: 'Solari Radiant Wrath',
    icon: '☀️',
    color: '#facc15',
    desc: '+1.5% Critical Damage & Holy Radiance Burst on crits',
    maxRank: 50,
  },
  umbri_shadowcraft: {
    id: 'umbri_shadowcraft',
    name: 'Umbri Void Leech',
    icon: '🌑',
    color: '#c084fc',
    desc: '+0.8% Move Speed, +0.6% Dodge & +0.8% Life Leech on all hits',
    maxRank: 50,
  },
  terra_bulwark: {
    id: 'terra_bulwark',
    name: 'Terra Primal Bastion',
    icon: '🌿',
    color: '#4ade80',
    desc: '+6 Max Health, +0.5 HP/s Regen & +1% Damage Reduction per point',
    maxRank: 50,
  },
  aether_chronoflux: {
    id: 'aether_chronoflux',
    name: 'Aether Chrono-Surge',
    icon: '🔮',
    color: '#38bdf8',
    desc: '-0.8% Cooldowns, +1.2% Cast Speed & +5 Max Glimmer per point',
    maxRank: 50,
  },
};

export function calcCastSpeedMult(prog, equipment = {}) {
  const aetherPts = prog?.paragon?.aether_chronoflux || 0;
  const rw = getActiveRuneword(equipment);
  const rwCast = rw?.bonusCastSpeed || 0;
  return Math.max(0.4, 1 - aetherPts * 0.012 - rwCast);
}

export function calcCritDamageMult(prog) {
  const solariPts = prog?.paragon?.solari_radiance || 0;
  return 1.75 + solariPts * 0.015;
}

export function calcDodgeChance(prog) {
  const umbriPts = prog?.paragon?.umbri_shadowcraft || 0;
  return Math.min(0.40, umbriPts * 0.006);
}

export function calcDamageReduction(prog, equipment = {}) {
  const terraPts = prog?.paragon?.terra_bulwark || 0;
  const rw = getActiveRuneword(equipment);
  const rwDr = rw?.bonusDr || 0;
  return Math.min(0.40, terraPts * 0.01 + rwDr);
}

export function calcLifeLeechPct(prog, faction, equipment = {}) {
  const umbriPts = prog?.paragon?.umbri_shadowcraft || 0;
  const base = faction === 'Umbri' ? 0.08 : 0;
  const rw = getActiveRuneword(equipment);
  const rwLeech = rw?.bonusLeech || 0;
  return base + umbriPts * 0.008 + rwLeech;
}

export function calcHpRegenPerSec(prog, equipment = {}) {
  const terraPts = prog?.paragon?.terra_bulwark || 0;
  const rw = getActiveRuneword(equipment);
  const rwRegen = rw?.bonusRegen || 0;
  // Slow innate recovery: 1 HP every 3 seconds, plus 0.5 HP/s per Terra Bulwark point.
  return 1 / 3 + terraPts * 0.5 + rwRegen;
}

export function calcHolyRadianceBurstDmg(prog) {
  const solariPts = prog?.paragon?.solari_radiance || 0;
  if (solariPts <= 0) return 0;
  return Math.max(4, Math.round(4 + solariPts * 1.2));
}

export function calcMoveSpeedMult(prog) {
  const umbriPts = prog?.paragon?.umbri_shadowcraft || 0;
  return 1 + umbriPts * 0.008;
}

export function paragonXpForLevel(paragonLvl = 0) {
  const p = Math.max(0, Math.floor(paragonLvl));
  // Authentic ARPG late-game scaling:
  // Paragon 0 -> 1: 2,500 XP (~25 elite mobs / 8 World Bosses)
  // Paragon 5: 6,625 XP
  // Paragon 10: 12,500 XP
  // Paragon 25: 35,000 XP
  // Paragon 50: 122,500 XP
  // Paragon 100: 417,500 XP
  return 2500 + p * 650 + Math.floor(p * p * 35);
}

export function canUpgradeParagon(prog, affinityId) {
  const spec = PARAGON_AFFINITIES[affinityId];
  if (!spec) return false;
  if ((prog?.paragonPoints || 0) <= 0) return false;
  const cur = prog?.paragon?.[affinityId] || 0;
  if (cur >= (spec.maxRank || 50)) return false;
  return true;
}

const RS_XP_TABLE_99 = [0];
let _rsTotal = 0;
let _rsDelta = 50;
for (let lvl = 2; lvl <= 99; lvl++) {
  if (lvl <= 7) {
    _rsDelta = Math.round(_rsDelta * 1.55); // ~55% more experience required each level
  } else if (lvl <= 20) {
    _rsDelta = Math.round(_rsDelta * 1.155);
  } else if (lvl <= 40) {
    _rsDelta = Math.round(_rsDelta * 1.09);
  } else if (lvl <= 70) {
    _rsDelta = Math.round(_rsDelta * 1.055);
  } else {
    _rsDelta = Math.round(_rsDelta * 1.042);
  }
  _rsTotal += _rsDelta;
  RS_XP_TABLE_99.push(_rsTotal);
}

export function getProfessionLevelFromXp(xp) {
  const safeXp = Math.max(0, Math.floor(Number(xp) || 0));
  for (let lvl = 99; lvl >= 1; lvl--) {
    if (safeXp >= (RS_XP_TABLE_99[lvl - 1] || 0)) {
      return lvl;
    }
  }
  return 1;
}

export function getXpForProfessionLevel(lvl) {
  const clamped = Math.max(1, Math.min(99, Math.floor(Number(lvl) || 1)));
  return RS_XP_TABLE_99[clamped - 1] || 0;
}

export function getTotalProfessionLevel(professions) {
  if (!professions || typeof professions !== 'object') return 7;
  let total = 0;
  for (const profId of Object.keys(PROFESSIONS_CATALOG)) {
    const prof = professions[profId];
    const lvl = Math.max(prof?.level || 1, getProfessionLevelFromXp(prof?.xp || 0));
    total += Math.max(1, Math.min(99, Math.floor(Number(lvl) || 1)));
  }
  return total;
}

export function calcEntityLevel(progression) {
  if (!progression) return 3;
  const profs = progression.professions || {};
  const getLvl = (id) => Math.max(1, Math.min(99, Math.floor(Number(profs[id]?.level) || getProfessionLevelFromXp(profs[id]?.xp || 0))));

  const combat = getLvl('combat_mastery');
  const rites = getLvl('rites');
  const flashes = getLvl('flashes');
  const extraction = getLvl('resonance_extraction');
  const forging = getLvl('relic_forging');
  const binding = getLvl('rite_binding');
  const weaving = getLvl('glimmerweaving');
  const baseLvl = Math.max(1, Math.min(30, Math.floor(Number(progression.level) || 1)));
  const paragonLvl = Math.max(0, Math.floor(Number(progression.paragonLevel) || 0));

  // Continental Entity Level Algorithm (Scales from 3 to 126, and up to 138 with Paragon):
  // 1. Foundation Base: Armor forging, leyline resonance extraction, and core champion level
  const base = 0.25 * (forging + extraction + Math.floor(baseLvl * 3.25));

  // 2. Offense Specialization: Highest of Martial Combat, Channeled Rites, or Instant Flashes
  const offense = 0.325 * (Math.max(combat, rites, flashes) * 1.35);

  // 3. Artisan Support Synergy: Alchemy distillation & Glimmerweaving vestments
  const synergy = 0.045 * (binding + weaving);

  // 4. Late-game Paragon Resonance
  const paragonBonus = Math.min(12, Math.floor(paragonLvl * 0.12));

  const raw = Math.floor(base + offense + synergy + paragonBonus);
  return Math.max(3, Math.min(138, raw));
}

export function getEntityCombatArchetype(progression) {
  if (!progression) return 'Initiate';
  const profs = progression.professions || {};
  const getLvl = (id) => Math.max(1, Math.min(99, Math.floor(Number(profs[id]?.level) || getProfessionLevelFromXp(profs[id]?.xp || 0))));
  const combat = getLvl('combat_mastery');
  const rites = getLvl('rites');
  const flashes = getLvl('flashes');
  if (combat >= 99 && rites >= 99 && flashes >= 99) return 'Grandmaster Ascendant';
  const max = Math.max(combat, rites, flashes);
  const min = Math.min(combat, rites, flashes);
  if (max - min <= 5 && max >= 10) return 'All-Rounder Paragon';
  if (combat === max) return 'Martial Vanguard';
  if (rites === max) return 'Cosmic Hierophant';
  return 'Tempest Duelist';
}

export function createDefaultProgression() {
  return {
    level: 1,
    xp: 0,
    statPoints: 2,
    skillPoints: 1, // Starts with 1 unallocated Skill Point for the level 1 dopamine hit!
    stats: { power: 2, bastion: 2, resonance: 1, tempo: 1 },
    ranks: { 1: 1, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
    skills: {
      flare_strike: 1,
      whisper_of_the_void: 1,
      tectonic_slam: 1,
      reality_fracture: 1,
    }, // abilityId -> rank (0 to 5); Tier 1 starter abilities start at Rank 1
    professions: {
      combat_mastery: { xp: 0, level: 1 },
      rites: { xp: 0, level: 1 },
      flashes: { xp: 0, level: 1 },
      resonance_extraction: { xp: 0, level: 1 },
      relic_forging: { xp: 0, level: 1 },
      rite_binding: { xp: 0, level: 1 },
      glimmerweaving: { xp: 0, level: 1 },
    },
    paragonLevel: 0,
    paragonXp: 0,
    paragonPoints: 0,
    paragon: {
      solari_radiance: 0,
      umbri_shadowcraft: 0,
      terra_bulwark: 0,
      aether_chronoflux: 0,
    },
  };
}

export function getEquipmentStatBonuses(equipment = {}, classId = 'solari_vanguard') {
  const bonus = { power: 0, bastion: 0, resonance: 0, tempo: 0 };
  const cls = CLASSES_CATALOG[classId];
  if (cls?.bonusStats) {
    for (const k of Object.keys(bonus)) bonus[k] += cls.bonusStats[k] || 0;
  }
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats) {
      for (const [k, v] of Object.entries(item.stats)) {
        if (k in bonus) bonus[k] += v;
      }
    }
  }
  // Add Canonical Faction full set bonus stats!
  const { active } = getActiveSetBonuses(equipment);
  for (const s of active) {
    if (s.bonusStats) {
      for (const [k, v] of Object.entries(s.bonusStats)) {
        if (k in bonus) bonus[k] += v;
      }
    }
  }
  // Add Day 4 Runeword Synergy bonus stats!
  const rw = getActiveRuneword(equipment);
  if (rw?.bonusStats) {
    for (const [k, v] of Object.entries(rw.bonusStats)) {
      if (k in bonus) bonus[k] += v;
    }
  }
  return bonus;
}

export function getEffectiveStats(prog, equipment = {}, classId = 'solari_vanguard') {
  const b = getEquipmentStatBonuses(equipment, classId);
  return {
    power: (prog?.stats?.power || 2) + b.power,
    bastion: (prog?.stats?.bastion || 2) + b.bastion,
    resonance: (prog?.stats?.resonance || 1) + b.resonance,
    tempo: (prog?.stats?.tempo || 1) + b.tempo,
  };
}

export function xpForNextLevel(lvl) {
  const l = Math.max(1, Math.floor(Number(lvl) || 1));
  if (l === 1) return 80;
  if (l <= 8) return Math.round(80 * Math.pow(1.52, l - 1)); // ~52% incremental increase per level
  if (l <= 20) return Math.round(80 * Math.pow(1.52, 7) * Math.pow(1.22, l - 8));
  return Math.round(80 * Math.pow(1.52, 7) * Math.pow(1.22, 12) * Math.pow(1.10, l - 20));
}

export function calcMaxHp(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonHp = (prog?.paragon?.terra_bulwark || 0) * 6;
  const { active } = getActiveSetBonuses(equipment);
  const titanHp = active.some((s) => s.id === 'aurelius_titan') ? 150 : 0;
  const rwHp = getActiveRuneword(equipment)?.bonusHp || 0;
  let flatEquipHp = 0;
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats?.maxHp) flatEquipHp += Number(item.stats.maxHp) || 0;
  }
  return 25 + ((prog?.level || 1) - 1) * 3 + (eff.bastion - 2) * 3 + paragonHp + titanHp + rwHp + flatEquipHp;
}

export function calcMaxGlimmer(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonGlimmer = (prog?.paragon?.aether_chronoflux || 0) * 5;
  const { active } = getActiveSetBonuses(equipment);
  const titanGlimmer = active.some((s) => s.id === 'aurelius_titan') ? 40 : 0;
  const rwGlimmer = getActiveRuneword(equipment)?.bonusGlimmer || 0;
  let flatEquipGlimmer = 0;
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats?.maxGlimmer) flatEquipGlimmer += Number(item.stats.maxGlimmer) || 0;
  }
  return 100 + (eff.resonance - 1) * 8 + paragonGlimmer + titanGlimmer + rwGlimmer + flatEquipGlimmer;
}

export function calcCritChance(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonCrit = (prog?.paragon?.solari_radiance || 0) * 0.005;
  const { active } = getActiveSetBonuses(equipment);
  const duskveilCrit = active.some((s) => s.id === 'duskveil_reaver') ? 0.18 : 0;
  const rwCrit = getActiveRuneword(equipment)?.bonusCrit || 0;
  return Math.min(0.85, 0.2 + eff.tempo * 0.025 + paragonCrit + duskveilCrit + rwCrit);
}

export function calcCdMult(prog, equipment = {}, classId = 'solari_vanguard', faction = 'Solari') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const aetherBonus = faction === 'Aether' ? 0.12 : 0;
  const paragonCd = (prog?.paragon?.aether_chronoflux || 0) * 0.008;
  const { active } = getActiveSetBonuses(equipment);
  const chronoCd = active.some((s) => s.id === 'chrono_astral') ? 0.25 : 0;
  const rwCd = getActiveRuneword(equipment)?.bonusCdr || 0;
  return Math.max(0.35, 1 - eff.tempo * 0.02 - aetherBonus - paragonCd - chronoCd - rwCd);
}

// ==========================================
// Day 20 & Day 21 — Unlockable Champion Titles & Achievements Catalog
// ==========================================
export const CHAMPION_TITLES = {
  awakened: { id: 'awakened', label: 'Awakened', color: '#fde047' },
  leyline_harvester: { id: 'leyline_harvester', label: 'Leyline Harvester', color: '#38bdf8' },
  star_forger: { id: 'star_forger', label: 'Star-Forger', color: '#fb923c' },
  bounty_hunter: { id: 'bounty_hunter', label: 'Vanguard Hunter', color: '#4ade80' },
  runeword_savant: { id: 'runeword_savant', label: 'Runeword Savant', color: '#c084fc' },
  realm_cartographer: { id: 'realm_cartographer', label: 'Realm Cartographer', color: '#2dd4bf' },
  starfall_vanquisher: { id: 'starfall_vanquisher', label: 'Starfall Vanquisher', color: '#f97316' },
  void_bane: { id: 'void_bane', label: 'Void-Bane', color: '#e879f9' },
  paragon_ascendant: { id: 'paragon_ascendant', label: 'Paragon Ascendant', color: '#facc15' },
  grandmaster_artisan: { id: 'grandmaster_artisan', label: 'Grandmaster Artisan', color: '#fef08a' },
};

export const ACHIEVEMENTS_CATALOG = [
  {
    id: 'ach_first_awakening',
    title: 'Awakened of Sanctuary',
    category: 'Progression',
    icon: '☀️',
    desc: 'Reach Champion Level 5 by banishing foes and channeling leylines.',
    rewardTitle: 'awakened',
  },
  {
    id: 'ach_leyline_harvester',
    title: 'Channeler of the Leylines',
    category: 'Gathering',
    icon: '⚡',
    desc: 'Harvest 25 Glimmer Nodes, Ore Veins, Herb Clusters, or Shrines across GlimmerFall.',
    rewardTitle: 'leyline_harvester',
  },
  {
    id: 'ach_cosmic_craftsman',
    title: 'Sparks of the Star-Anvil',
    category: 'Crafting',
    icon: '⚒️',
    desc: 'Craft 10 items across the Cosmic Star-Anvil, Aetherial Crucible, or Celestial Loom.',
    rewardTitle: 'star_forger',
  },
  {
    id: 'ach_vanguard_bounty',
    title: 'Sworn of the Bounty Board',
    category: 'Combat',
    icon: '📜',
    desc: 'Complete 3 Vanguard Bounty Contracts from Sanctuary Haven or Continental Caldera.',
    rewardTitle: 'bounty_hunter',
  },
  {
    id: 'ach_runeword_awakened',
    title: 'Savant of Ancient Runewords',
    category: 'Equipment',
    icon: '🔮',
    desc: 'Activate any 3-Socket Runeword Synergy across your Helm, Chest, and Weapon sockets.',
    rewardTitle: 'runeword_savant',
  },
  {
    id: 'ach_world_cartographer',
    title: 'Cartographer of the Shattered Nexus',
    category: 'Exploration',
    icon: '🗺️',
    desc: 'Discover at least 8 distinct realms across GlimmerFall on foot.',
    rewardTitle: 'realm_cartographer',
  },
  {
    id: 'ach_starfall_slayer',
    title: 'Conqueror of Starfall Crater',
    category: 'Bosses',
    icon: '☄️',
    desc: 'Slay foes in Starfall Crater (10 kills) or wield the Ignis-Core Meteor Maul.',
    rewardTitle: 'starfall_vanquisher',
  },
  {
    id: 'ach_abyssal_slayer',
    title: 'Breaker of the Abyssal Rift',
    category: 'Bosses',
    icon: '🌌',
    desc: 'Slay Rift horrors in the Abyssal Rift (10 kills) or wield the Xal\'Korath Voidstar Reaver.',
    rewardTitle: 'void_bane',
  },
  {
    id: 'ach_paragon_ascendant',
    title: 'Paragon of the First Nexus',
    category: 'Progression',
    icon: '👑',
    desc: 'Reach Champion Level 30 and unlock Paragon Resonance Mastery.',
    rewardTitle: 'paragon_ascendant',
  },
  {
    id: 'ach_grandmaster_artisan',
    title: 'Grandmaster of Five Disciplines',
    category: 'Skilling',
    icon: '🏆',
    desc: 'Achieve Total Skill Level 150+ across all five GlimmerFall professions.',
    rewardTitle: 'grandmaster_artisan',
  },
];
