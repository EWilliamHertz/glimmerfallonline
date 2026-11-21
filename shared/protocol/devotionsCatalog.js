// ==========================================
// GlimmerFall Online 2D — Covenant Devotions (OSRS-Style Overhead Prayers)
// Powered by Glimmer Charge; mutually exclusive protection vows + overhead icons.
// ==========================================

export const DEVOTIONS_CATALOG = {
  ward_of_steel: {
    id: 'ward_of_steel',
    name: 'Ward of Steel',
    shortName: 'Steel Ward',
    icon: '🛡️',
    color: '#38bdf8',
    category: 'protection',
    reqLevel: 1,
    drainPerSec: 2.4,
    meleeDr: 0.35,
    riteDr: 0,
    dmgMult: 1.0,
    hpRegenPerSec: 0,
    desc: 'Overhead Protection Vow: Reduces incoming melee & monster strikes by 35%.',
  },
  astral_aegis: {
    id: 'astral_aegis',
    name: 'Astral Aegis',
    shortName: 'Astral Aegis',
    icon: '🔮',
    color: '#c084fc',
    category: 'protection',
    reqLevel: 6,
    drainPerSec: 2.6,
    meleeDr: 0,
    riteDr: 0.35,
    dmgMult: 1.0,
    hpRegenPerSec: 0,
    desc: 'Overhead Protection Vow: Reduces incoming Rites, spells & boss cataclysms by 35%.',
  },
  zealots_vow: {
    id: 'zealots_vow',
    name: "Zealot's Vow",
    shortName: 'Zealot Vow',
    icon: '⚔️',
    color: '#facc15',
    category: 'offense',
    reqLevel: 12,
    drainPerSec: 3.0,
    meleeDr: 0,
    riteDr: 0,
    dmgMult: 1.15,
    critBonus: 0.05,
    hpRegenPerSec: 0,
    desc: 'Overhead Offensive Vow: Boosts all weapon & Rite damage by +15% and Crit by +5%.',
  },
  sanctuary_grace: {
    id: 'sanctuary_grace',
    name: 'Sanctuary Grace',
    shortName: 'Grace',
    icon: '💚',
    color: '#4ade80',
    category: 'vitality',
    reqLevel: 18,
    drainPerSec: 2.0,
    meleeDr: 0,
    riteDr: 0,
    dmgMult: 1.0,
    hpRegenPerSec: 2.5,
    desc: 'Overhead Vitality Vow: Restores +2.5 HP every second while active.',
  },
};

export const MAX_ACTIVE_DEVOTIONS = 2;

export function toggleDevotionInList(currentList = [], devotionId, playerLevel = 1, currentGlimmer = 0) {
  const def = DEVOTIONS_CATALOG[devotionId];
  if (!def) return { ok: false, reason: 'Unknown devotion', list: currentList || [] };
  const cur = Array.isArray(currentList) ? [...currentList] : [];
  const existingIdx = cur.indexOf(devotionId);
  if (existingIdx !== -1) {
    cur.splice(existingIdx, 1);
    return { ok: true, active: false, list: cur, devotion: def };
  }
  if (playerLevel < def.reqLevel) {
    return { ok: false, reason: `Requires Champion Lv.${def.reqLevel}`, list: cur };
  }
  if (currentGlimmer < 3) {
    return { ok: false, reason: 'Not enough Glimmer Charge (need 3+)', list: cur };
  }
  // Mutual exclusion within the protection category (Ward of Steel vs Astral Aegis)
  const filtered = def.category === 'protection'
    ? cur.filter((id) => DEVOTIONS_CATALOG[id]?.category !== 'protection')
    : cur;
  if (filtered.length >= MAX_ACTIVE_DEVOTIONS) {
    filtered.shift();
  }
  filtered.push(devotionId);
  return { ok: true, active: true, list: filtered, devotion: def };
}

export function computeDevotionModifiers(activeDevotions = []) {
  let meleeDr = 0;
  let riteDr = 0;
  let dmgMult = 1.0;
  let critBonus = 0;
  let hpRegenPerSec = 0;
  let drainPerSec = 0;

  for (const id of activeDevotions || []) {
    const def = DEVOTIONS_CATALOG[id];
    if (!def) continue;
    meleeDr = Math.max(meleeDr, def.meleeDr || 0);
    riteDr = Math.max(riteDr, def.riteDr || 0);
    if (def.dmgMult && def.dmgMult > 1) dmgMult *= def.dmgMult;
    critBonus += def.critBonus || 0;
    hpRegenPerSec += def.hpRegenPerSec || 0;
    drainPerSec += def.drainPerSec || 0;
  }

  return { meleeDr, riteDr, dmgMult, critBonus, hpRegenPerSec, drainPerSec };
}
