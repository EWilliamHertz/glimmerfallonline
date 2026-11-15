import { CLASSES_CATALOG } from "./factionsAndClasses.js";
import { EQUIPMENT_CATALOG, getActiveSetBonuses, getActiveRuneword } from "./setsAndRunewords.js";
import { PROFESSIONS_CATALOG } from "./craftingAndSkilling.js";

export const TRIAL_MAX_LEVEL = 10;
export const TRIAL_MAX_PROFESSION_LEVEL = 30;
export const TRIAL_MAX_BANK_SLOTS = 30;
export const FOUNDER_MAX_BANK_SLOTS = 140;
export const MAX_BASE_LEVEL = 70;
export const FOUNDER_MAX_LEVEL = MAX_BASE_LEVEL;

export function isFounderEdition(subject) {
  if (!subject) return false;
  if (typeof subject === 'string') return subject === 'founder';
  return Boolean(
    subject.editionTier === 'founder' ||
      subject.statsMeta?.editionTier === 'founder' ||
      subject.redeemedSerialKey ||
      subject.statsMeta?.redeemedSerialKey ||
      subject.tcgLinked
  );
}

export function getCharacterLevelCap(subject) {
  return isFounderEdition(subject) ? MAX_BASE_LEVEL : TRIAL_MAX_LEVEL;
}

export function getProfessionLevelCap(subject) {
  return isFounderEdition(subject) ? 99 : TRIAL_MAX_PROFESSION_LEVEL;
}

export function getBankCapacityCap(subject) {
  return isFounderEdition(subject) ? FOUNDER_MAX_BANK_SLOTS : TRIAL_MAX_BANK_SLOTS;
}

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
  const baseLvl = Math.max(1, Math.min(MAX_BASE_LEVEL, Math.floor(Number(progression.level) || 1)));
  const paragonLvl = Math.max(0, Math.floor(Number(progression.paragonLevel) || 0));

  // Continental Entity Level Algorithm (Scales from 3 to 126 at Lv.30+Skills, 138 w/ Paragon, up to 150 at Lv.70+Paragon):
  // 1. Foundation Base: Armor forging, leyline resonance extraction, and core champion level
  const baseLevelFactor = baseLvl <= 30 ? Math.floor(baseLvl * 3.25) : 97 + Math.floor((baseLvl - 30) * 1.2);
  const base = 0.25 * (forging + extraction + baseLevelFactor);

  // 2. Offense Specialization: Highest of Martial Combat, Channeled Rites, or Instant Flashes
  const offense = 0.325 * (Math.max(combat, rites, flashes) * 1.35);

  // 3. Artisan Support Synergy: Alchemy distillation & Glimmerweaving vestments
  const synergy = 0.045 * (binding + weaving);

  // 4. Late-game Paragon Resonance
  const paragonBonus = Math.min(12, Math.floor(paragonLvl * 0.12));

  const raw = Math.floor(base + offense + synergy + paragonBonus);
  return Math.max(3, Math.min(150, raw));
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
    tempering: {},
    achievements: { completed: {}, unlockedTitles: [] },
    equippedTitle: null,
  };
}

export const MAX_TEMPER_RANK = 5;
export const TEMPERABLE_SLOTS = [
  'weapon', 'body', 'head', 'shield', 'legs', 'hands', 'feet', 'neck', 'ring', 'cape',
];

export function normalizeTemperSlotKey(slotKey) {
  if (slotKey === 'armor') return 'body';
  if (slotKey === 'offhand') return 'shield';
  return slotKey;
}

export function getTemperSlotRank(prog, slotKey) {
  const key = normalizeTemperSlotKey(slotKey);
  const raw = Number(prog?.tempering?.[key]) || 0;
  return Math.max(0, Math.min(MAX_TEMPER_RANK, Math.floor(raw)));
}

export function getTemperBonusesForSlot(slotKey, rank) {
  const r = Math.max(0, Math.min(MAX_TEMPER_RANK, Math.floor(Number(rank) || 0)));
  if (r <= 0) return null;
  const key = normalizeTemperSlotKey(slotKey);
  if (key === 'weapon') {
    return { power: r * 2, bastion: 0, resonance: 0, tempo: r, maxHp: 0, maxGlimmer: 0, critPct: r * 0.01 };
  }
  if (key === 'body' || key === 'head' || key === 'shield') {
    return { power: 0, bastion: r * 2, resonance: 0, tempo: 0, maxHp: r * 8, maxGlimmer: 0, critPct: 0 };
  }
  if (key === 'legs' || key === 'hands' || key === 'feet') {
    return { power: r, bastion: r, resonance: 0, tempo: 0, maxHp: r * 4, maxGlimmer: 0, critPct: 0 };
  }
  if (key === 'neck' || key === 'ring' || key === 'cape') {
    return { power: 0, bastion: 0, resonance: r * 2, tempo: r, maxHp: 0, maxGlimmer: r * 6, critPct: 0 };
  }
  return null;
}

export function getTotalTemperBonuses(prog, equipment = {}) {
  const tot = { power: 0, bastion: 0, resonance: 0, tempo: 0, maxHp: 0, maxGlimmer: 0, critPct: 0 };
  if (!prog?.tempering) return tot;
  for (const slotKey of TEMPERABLE_SLOTS) {
    const equippedId = equipment?.[slotKey] || (slotKey === 'body' ? equipment?.armor : slotKey === 'shield' ? equipment?.offhand : null);
    if (!equippedId) continue;
    const rank = getTemperSlotRank(prog, slotKey);
    const b = getTemperBonusesForSlot(slotKey, rank);
    if (!b) continue;
    for (const k of Object.keys(tot)) tot[k] += b[k] || 0;
  }
  return tot;
}

export function pickBestTemperTarget(prog, equipment = {}, minRank = 0, maxRank = MAX_TEMPER_RANK, preferredSlot = null) {
  const minR = Math.max(0, Math.floor(Number(minRank) || 0));
  const maxR = Math.min(MAX_TEMPER_RANK, Math.floor(Number(maxRank) || MAX_TEMPER_RANK));
  const candidates = preferredSlot
    ? [normalizeTemperSlotKey(preferredSlot)]
    : TEMPERABLE_SLOTS;

  for (const slotKey of candidates) {
    if (!TEMPERABLE_SLOTS.includes(slotKey)) continue;
    const equippedId = equipment?.[slotKey] || (slotKey === 'body' ? equipment?.armor : slotKey === 'shield' ? equipment?.offhand : null);
    if (!equippedId || !EQUIPMENT_CATALOG[equippedId]) continue;
    const curRank = getTemperSlotRank(prog, slotKey);
    if (curRank >= minR && curRank < maxR) {
      return { slotKey, itemId: equippedId, curRank, nextRank: curRank + 1 };
    }
  }
  return null;
}

export function applyTemperingUpgrade(prog, equipment = {}, sigilItem, preferredSlot = null) {
  if (!prog || !sigilItem?.temperTargetMax) {
    return { ok: false, reason: 'Invalid Tempering Sigil' };
  }
  const minR = sigilItem.temperMinRank ?? 0;
  const maxR = sigilItem.temperTargetMax;
  const target = pickBestTemperTarget(prog, equipment, minR, maxR, preferredSlot);
  if (!target) {
    if (preferredSlot) {
      const slotKey = normalizeTemperSlotKey(preferredSlot);
      const curRank = getTemperSlotRank(prog, slotKey);
      const hasGear = Boolean(equipment?.[slotKey] || (slotKey === 'body' ? equipment?.armor : slotKey === 'shield' ? equipment?.offhand : null));
      if (!hasGear) return { ok: false, reason: `Equip an item in ${slotKey.toUpperCase()} first` };
      if (curRank < minR) return { ok: false, reason: `Temper ${slotKey.toUpperCase()} to +${minR} before using ${sigilItem.name}` };
      return { ok: false, reason: `${slotKey.toUpperCase()} is already at +${curRank} (max +${maxR} for this sigil)` };
    }
    return { ok: false, reason: `No worn gear eligible (+${minR} to +${maxR - 1})` };
  }
  if (!prog.tempering || typeof prog.tempering !== 'object') prog.tempering = {};
  prog.tempering[target.slotKey] = target.nextRank;
  return {
    ok: true,
    slotKey: target.slotKey,
    itemId: target.itemId,
    newRank: target.nextRank,
  };
}

export function getActiveCombatConsumableBonuses(actor) {
  const b = { power: 0, bastion: 0, resonance: 0, tempo: 0, critPct: 0, critLeechPct: 0 };
  if (actor?.weaponImbue && (actor.weaponImbue.timer || 0) > 0) {
    b.power += actor.weaponImbue.power || 0;
    b.resonance += actor.weaponImbue.resonance || 0;
    b.tempo += actor.weaponImbue.tempo || 0;
    b.critPct += actor.weaponImbue.critPct || 0;
    b.critLeechPct += actor.weaponImbue.critLeechPct || 0;
  }
  if (actor?.wellFedBuff && (actor.wellFedBuff.timer || 0) > 0) {
    b.power += actor.wellFedBuff.power || 0;
    b.bastion += actor.wellFedBuff.bastion || 0;
    b.resonance += actor.wellFedBuff.resonance || 0;
  }
  return b;
}

export function getEquipmentStatBonuses(equipment = {}, classId = 'solari_vanguard', prog = null) {
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
  // Add Artisan Gear Tempering (+1 to +5) bonus stats!
  if (prog) {
    const temper = getTotalTemperBonuses(prog, equipment);
    bonus.power += temper.power;
    bonus.bastion += temper.bastion;
    bonus.resonance += temper.resonance;
    bonus.tempo += temper.tempo;
  }
  return bonus;
}

export function getEffectiveStats(prog, equipment = {}, classId = 'solari_vanguard') {
  const b = getEquipmentStatBonuses(equipment, classId, prog);
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
  if (l <= 30) return Math.round(80 * Math.pow(1.52, 7) * Math.pow(1.22, 12) * Math.pow(1.10, l - 20));
  return Math.round(80 * Math.pow(1.52, 7) * Math.pow(1.22, 12) * Math.pow(1.10, 10) * Math.pow(1.05, l - 30));
}

export function calcMaxHp(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonHp = (prog?.paragon?.terra_bulwark || 0) * 6;
  const { active } = getActiveSetBonuses(equipment);
  const titanHp = active.some((s) => s.id === 'aurelius_titan') ? 150 : 0;
  const rwHp = getActiveRuneword(equipment)?.bonusHp || 0;
  const temperHp = getTotalTemperBonuses(prog, equipment).maxHp;
  let flatEquipHp = 0;
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats?.maxHp) flatEquipHp += Number(item.stats.maxHp) || 0;
  }
  return 25 + ((prog?.level || 1) - 1) * 3 + (eff.bastion - 2) * 3 + paragonHp + titanHp + rwHp + temperHp + flatEquipHp;
}

export function calcMaxGlimmer(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonGlimmer = (prog?.paragon?.aether_chronoflux || 0) * 5;
  const { active } = getActiveSetBonuses(equipment);
  const titanGlimmer = active.some((s) => s.id === 'aurelius_titan') ? 40 : 0;
  const rwGlimmer = getActiveRuneword(equipment)?.bonusGlimmer || 0;
  const temperGlimmer = getTotalTemperBonuses(prog, equipment).maxGlimmer;
  let flatEquipGlimmer = 0;
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats?.maxGlimmer) flatEquipGlimmer += Number(item.stats.maxGlimmer) || 0;
  }
  return 100 + (eff.resonance - 1) * 8 + paragonGlimmer + titanGlimmer + rwGlimmer + temperGlimmer + flatEquipGlimmer;
}

export function calcCritChance(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonCrit = (prog?.paragon?.solari_radiance || 0) * 0.005;
  const { active } = getActiveSetBonuses(equipment);
  const duskveilCrit = active.some((s) => s.id === 'duskveil_reaver') ? 0.18 : 0;
  const rwCrit = getActiveRuneword(equipment)?.bonusCrit || 0;
  const temperCrit = getTotalTemperBonuses(prog, equipment).critPct;
  return Math.min(0.85, 0.2 + eff.tempo * 0.025 + paragonCrit + duskveilCrit + rwCrit + temperCrit);
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
