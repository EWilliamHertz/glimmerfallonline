// ==========================================
// GlimmerFall Online 2D — Phase 4 Endgame & PvPvE Loop Protocol
// Ranked 3v3 Arena Elo MMR + Role Trinity LFG + 10-Player Primeval Nexus Raid + Outpost Control
// ==========================================

import { TANK_CLASSES } from './constants.js';

export const DEFAULT_ARENA_MMR = 1200;
export const MIN_ARENA_MMR = 100;

export const ARENA_SEASON_TIERS = [
  { id: 'gladiator', name: 'Gladiator', minMmr: 1900, badge: '👑', color: '#f43f5e' },
  { id: 'diamond', name: 'Diamond', minMmr: 1700, badge: '💠', color: '#818cf8' },
  { id: 'platinum', name: 'Platinum', minMmr: 1500, badge: '💎', color: '#38bdf8' },
  { id: 'gold', name: 'Gold', minMmr: 1300, badge: '🥇', color: '#facc15' },
  { id: 'silver', name: 'Silver', minMmr: 1150, badge: '🥈', color: '#cbd5e1' },
  { id: 'bronze', name: 'Bronze', minMmr: 0, badge: '🥉', color: '#cd7f32' },
];

export function getArenaTierForMmr(mmr = DEFAULT_ARENA_MMR) {
  const safeMmr = Math.max(MIN_ARENA_MMR, Math.floor(Number(mmr) || DEFAULT_ARENA_MMR));
  for (const tier of ARENA_SEASON_TIERS) {
    if (safeMmr >= tier.minMmr) return tier;
  }
  return ARENA_SEASON_TIERS[ARENA_SEASON_TIERS.length - 1];
}

export function calculateArenaEloDelta({
  playerMmr = DEFAULT_ARENA_MMR,
  opponentAvgMmr = DEFAULT_ARENA_MMR,
  won = true,
  isBotMatch = false,
  kFactor = null,
} = {}) {
  const cur = Math.max(MIN_ARENA_MMR, Math.round(Number(playerMmr) || DEFAULT_ARENA_MMR));
  const opp = Math.max(MIN_ARENA_MMR, Math.round(Number(opponentAvgMmr) || DEFAULT_ARENA_MMR));
  const k = kFactor ?? (isBotMatch ? 16 : 32);
  const expected = 1 / (1 + Math.pow(10, (opp - cur) / 400));
  const actual = won ? 1 : 0;
  let delta = Math.round(k * (actual - expected));
  if (won && delta < 4) delta = 4;
  if (!won && delta > -4 && !isBotMatch) delta = -4;
  const newMmr = Math.max(MIN_ARENA_MMR, cur + delta);
  return {
    oldMmr: cur,
    newMmr,
    delta: newMmr - cur,
    tier: getArenaTierForMmr(newMmr),
  };
}

// ==========================================
// Role Trinity Group / Dungeon Finder (1 Tank / 1 Healer / 3 DPS)
// ==========================================
export const TRINITY_ROLES = {
  TANK: 'tank',
  HEALER: 'healer',
  DPS: 'dps',
};

export const HEALER_CLASSES = new Set([
  'aurora_marshal',
  'graveglass_oracle',
  'chronomancer_sage',
]);

export function getDefaultRoleForClassId(classId = 'solari_vanguard') {
  if (TANK_CLASSES.has(classId)) return TRINITY_ROLES.TANK;
  if (classId === 'aurora_marshal') return TRINITY_ROLES.HEALER;
  return TRINITY_ROLES.DPS;
}

export function getAllowedRolesForClassId(classId = 'solari_vanguard') {
  const roles = [TRINITY_ROLES.DPS];
  if (TANK_CLASSES.has(classId)) roles.unshift(TRINITY_ROLES.TANK);
  if (HEALER_CLASSES.has(classId)) roles.unshift(TRINITY_ROLES.HEALER);
  return roles;
}

export function canClassPerformRole(classId, role) {
  return getAllowedRolesForClassId(classId).includes(role);
}

/**
 * Matches an exact Role Trinity group (1 Tank / 1 Healer / 3 DPS) from queued entries.
 */
export function matchTrinityPartyFromQueue(queueEntries = []) {
  if (!Array.isArray(queueEntries) || queueEntries.length < 5) {
    return { matched: null, remaining: queueEntries || [] };
  }
  const sorted = [...queueEntries].sort((a, b) => (a.queuedAt || 0) - (b.queuedAt || 0));
  const tankIdx = sorted.findIndex((e) => e.role === TRINITY_ROLES.TANK);
  if (tankIdx === -1) return { matched: null, remaining: sorted };
  const healerIdx = sorted.findIndex((e, idx) => idx !== tankIdx && e.role === TRINITY_ROLES.HEALER);
  if (healerIdx === -1) return { matched: null, remaining: sorted };

  const dpsIdxs = [];
  for (let i = 0; i < sorted.length && dpsIdxs.length < 3; i++) {
    if (i === tankIdx || i === healerIdx) continue;
    if (sorted[i].role === TRINITY_ROLES.DPS) dpsIdxs.push(i);
  }
  if (dpsIdxs.length < 3) return { matched: null, remaining: sorted };

  const pickedSet = new Set([tankIdx, healerIdx, ...dpsIdxs]);
  const matched = sorted.filter((_, idx) => pickedSet.has(idx));
  const remaining = sorted.filter((_, idx) => !pickedSet.has(idx));
  return { matched, remaining };
}

// ==========================================
// 10-Player Apex Raid — "Fall of the Primeval Nexus"
// ==========================================
export const PRIMEVAL_RAID_CONFIG = {
  id: 'primeval_nexus_raid',
  name: 'Fall of the Primeval Nexus',
  maxPlayers: 10,
  bossId: 'primeval_harbinger',
  bossName: 'The Primeval Harbinger',
  bossMaxHp: 18000,
  lockoutMs: 7 * 24 * 60 * 60 * 1000,
  attunementRotation: ['Solari', 'Umbri', 'Terra', 'Aether'],
  pylonOffsets: [
    { id: 'raid_pylon_nw', x: -340, y: -320, name: 'NW Leyline Siphon Pylon' },
    { id: 'raid_pylon_ne', x: 340, y: -320, name: 'NE Leyline Siphon Pylon' },
    { id: 'raid_pylon_sw', x: -340, y: 320, name: 'SW Leyline Siphon Pylon' },
    { id: 'raid_pylon_se', x: 340, y: 320, name: 'SE Leyline Siphon Pylon' },
  ],
  mythicLootIds: [
    'harbinger_worldbreaker',
    'primeval_nexus_crown',
    'siphonweave_aegis',
  ],
};

export function getNextHarbingerImmunity(currentFaction = 'Solari') {
  const rot = PRIMEVAL_RAID_CONFIG.attunementRotation;
  const idx = rot.indexOf(currentFaction);
  return rot[(idx + 1) % rot.length];
}

// ==========================================
// Capturable Warzone Outposts (30m Influence Cycle + Realm Buffs)
// ==========================================
export const WARZONE_INFLUENCE_CYCLE_MS = 30 * 60 * 1000;

export const WARZONE_OUTPOST_DEFS = [
  { id: 'outpost_Terra', defaultFaction: 'Terra', name: 'Timberlands Bastion Outpost', x: -850, y: -650 },
  { id: 'outpost_Umbri', defaultFaction: 'Umbri', name: 'Duskveil Ridge Outpost', x: 850, y: -650 },
  { id: 'outpost_Solari', defaultFaction: 'Solari', name: 'Sunspire Watch Outpost', x: -850, y: 650 },
  { id: 'outpost_Aether', defaultFaction: 'Aether', name: 'Chrono Pylon Outpost', x: 850, y: 650 },
];

export function computeOutpostRealmBuffs(outpostOwners = {}, faction = 'Solari') {
  if (!faction || !outpostOwners || typeof outpostOwners !== 'object') {
    return { controlledCount: 0, hasBuff: false, xpBonusPct: 0, yieldBonusPct: 0, xpMult: 1.0, yieldMult: 1.0 };
  }
  let controlledCount = 0;
  for (const op of WARZONE_OUTPOST_DEFS) {
    if ((outpostOwners[op.id] || op.defaultFaction) === faction) {
      controlledCount++;
    }
  }
  const hasBuff = controlledCount >= 2;
  return {
    controlledCount,
    hasBuff,
    xpBonusPct: hasBuff ? 15 : 0,
    yieldBonusPct: hasBuff ? 10 : 0,
    xpMult: hasBuff ? 1.15 : 1.0,
    yieldMult: hasBuff ? 1.10 : 1.0,
  };
}
