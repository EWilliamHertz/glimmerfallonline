// ==========================================
// GlimmerFall Online — Shared Deterministic Combat Core
// Consumed identically by Authoritative 20Hz Server (server/rooms/)
// and Zero-Lag Single Player Client (client/engine/offlineCombat.js)
// ==========================================

import { calcCritDamageMult } from '../protocol/progressionAndStats.js';

export const FACTION_RESOURCE_CONFIG = {
  Solari: {
    id: 'Solari',
    name: 'Solar Charge',
    short: 'ZENITH',
    mechanic: 'Guard & Zenith',
    mode: 'bar',
    max: 100,
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.55)',
    desc: 'Reaching 100 Solar Charge triggers Zenith State (6s): +25% DMG & heals allies/Nexus. Crits apply Sunbrand.',
  },
  Umbri: {
    id: 'Umbri',
    name: 'Dusk Marks',
    short: 'DUSK MARKS',
    mechanic: 'Stealth & Void Harvest',
    mode: 'pips',
    max: 5,
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.55)',
    desc: 'Flashes & stealth strikes build up to 5 Dusk Marks. Rites consume Marks for +15% DMG & +6% Leech per Mark.',
  },
  Terra: {
    id: 'Terra',
    name: 'Rootguard',
    short: 'ROOTGUARD',
    mechanic: 'Overwhelm & Thornbark',
    mode: 'pips',
    max: 5,
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.55)',
    desc: 'Hits taken & earth skills stack Rootguard (max 5): +6% DR & +8% Overwhelm cleave splash per stack.',
  },
  Aether: {
    id: 'Aether',
    name: 'Astral Resonance',
    short: 'RESONANCE',
    mechanic: 'Flash Tempo & Echo',
    mode: 'pips',
    max: 4,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.55)',
    desc: 'Casting abilities builds up to 4 Astral Resonance. At 4 stacks, next Rite casts instantly with a 65% Arcane Echo.',
  },
};

export const CLASS_PASSIVES = {
  solari_vanguard: {
    id: 'aegis_of_the_citadel',
    name: 'Aegis of the Citadel',
    desc: 'Blocking or raising shields grants +10 Solar Charge and generates 3.5x Threat on all nearby foes.',
    threatMult: 3.5,
    shieldGlimmerBonus: 10,
  },
  aurora_marshal: {
    id: 'beacon_of_dawn',
    name: 'Beacon of Dawn',
    desc: 'Healing Rites are +25% stronger, and 50% of overhealing converts into a protective Radiant Barrier.',
    healMult: 1.25,
    overhealToShieldRatio: 0.5,
  },
  umbral_assassin: {
    id: 'twin_fang_precision',
    name: 'Twin-Fang Precision',
    desc: 'Melee Flashes strike with an offhand twin-blade follow-up and grant +2 Dusk Marks (+25% Crit DMG from Stealth).',
    offhandStrikeRatio: 0.4,
    stealthCritBonus: 0.25,
    bonusMarksOnMelee: 1,
  },
  graveglass_oracle: {
    id: 'sepulcher_conduit',
    name: 'Sepulcher Conduit',
    desc: 'Life-leech overheals forge a Blood Phylactery barrier (up to 30% Max HP); hexed foes take +20% Rite damage.',
    phylacteryCapRatio: 0.3,
    hexRiteBonusMult: 1.2,
  },
  forest_warden: {
    id: 'predators_stride',
    name: "Predator's Stride",
    desc: '+10% base move speed; Flashes apply Venom Spores (3s poison DoT) and widen Overwhelm cleave.',
    moveSpeedBonus: 0.1,
    overwhelmRadiusBonus: 14,
  },
  stonekin_elder: {
    id: 'mountains_weight',
    name: "Mountain's Weight",
    desc: 'Immune to boss knockbacks; converts 20% of Bastion into bonus Thornbark reflection & 3.5x Threat.',
    knockbackImmune: true,
    threatMult: 3.5,
    bastionThornBonus: 0.2,
  },
  chronomancer_sage: {
    id: 'temporal_continuum',
    name: 'Temporal Continuum',
    desc: 'Every 3rd Flash cast primes Chrono-Snap (next Rite has 0.0s cast time) and shaves 0.6s off active cooldowns.',
    flashComboTarget: 3,
    flashCdShaveSec: 0.6,
  },
  nexus_weaver: {
    id: 'prismatic_shatter',
    name: 'Prismatic Shatter',
    desc: 'Hitting chilled or frozen foes with Rites triggers Starburst (+45% bonus AoE Arcane Crit damage).',
    shatterCritBonusMult: 1.45,
  },
};

export function getFactionResourceConfig(faction) {
  return FACTION_RESOURCE_CONFIG[faction] || FACTION_RESOURCE_CONFIG.Solari;
}

export function getClassPassive(classId) {
  return CLASS_PASSIVES[classId] || CLASS_PASSIVES.solari_vanguard;
}

export function ensureActorFactionState(actor, faction) {
  if (!actor || typeof actor !== 'object') return actor;
  if (actor.duskMarks === undefined) actor.duskMarks = 0;
  if (actor.rootguardStacks === undefined) actor.rootguardStacks = 0;
  if (actor.astralResonance === undefined) actor.astralResonance = 0;
  if (actor.flashComboCount === undefined) actor.flashComboCount = 0;
  if (actor.chronoSnapReady === undefined) actor.chronoSnapReady = false;
  if (actor.echoPrimed === undefined) actor.echoPrimed = false;
  if (actor.maxSolarCharge === undefined) actor.maxSolarCharge = 100;
  if (actor.solarCharge === undefined) actor.solarCharge = 0;
  actor.factionResourceMax = getFactionResourceConfig(faction).max;
  return actor;
}

export function getActorFactionResourceSnapshot(actor, faction) {
  const cfg = getFactionResourceConfig(faction);
  ensureActorFactionState(actor, faction);
  let value = 0;
  if (faction === 'Umbri') value = Math.max(0, Math.min(cfg.max, Math.floor(actor.duskMarks || 0)));
  else if (faction === 'Terra') value = Math.max(0, Math.min(cfg.max, Math.floor(actor.rootguardStacks || 0)));
  else if (faction === 'Aether') value = Math.max(0, Math.min(cfg.max, Math.floor(actor.astralResonance || 0)));
  else value = Math.max(0, Math.min(actor.maxSolarCharge || 100, Math.round(actor.solarCharge || 0)));

  return {
    faction: cfg.id,
    name: cfg.name,
    short: cfg.short,
    mode: cfg.mode,
    value,
    max: faction === 'Solari' ? (actor.maxSolarCharge || 100) : cfg.max,
    color: cfg.color,
    glow: cfg.glow,
    zenithActive: (actor.zenithTimer || 0) > 0,
    chronoSnapReady: Boolean(actor.chronoSnapReady),
    echoPrimed: Boolean(actor.echoPrimed),
  };
}

/**
 * Shared ability damage/heal/shield computation used by both server and singleplayer.
 */
export function resolveAbilityNumbers({
  spec,
  rank = 1,
  effStats = {},
  prog = null,
  actor = {},
  target = null,
  isCrit = false,
  duskMarksSpent = 0,
  isHexed = false,
  isFrozen = false,
}) {
  const r = Math.max(1, Math.min(5, Math.floor(Number(rank) || 1)));
  const power = Math.max(1, Number(effStats.power) || 2);
  const bastion = Math.max(1, Number(effStats.bastion) || 2);
  const resonance = Math.max(1, Number(effStats.resonance) || 1);
  const isRite = Boolean(spec?.tcgType?.includes('Rite'));
  const classPassive = getClassPassive(actor?.classId);

  const zenithMult = (actor?.zenithTimer || 0) > 0 ? 1.25 : 1.0;
  const duskMult = isRite && duskMarksSpent > 0 ? (1 + duskMarksSpent * 0.15) : 1.0;
  const hexMult = isRite && isHexed && classPassive.hexRiteBonusMult ? classPassive.hexRiteBonusMult : 1.0;
  const shatterMult = isRite && isFrozen && classPassive.shatterCritBonusMult ? classPassive.shatterCritBonusMult : 1.0;

  let baseDmg = 0;
  const kind = spec?.kind || 'melee_cleave';
  if (kind === 'melee_cleave') {
    baseDmg = 4 + power + r * 2;
  } else if (kind === 'cast_beam' || kind === 'aurora_beam') {
    baseDmg = 12 + power * 2 + r * 3;
  } else if (kind === 'projectile' || kind === 'shardburst' || kind === 'glacial_spike' || kind === 'gale_spear') {
    baseDmg = 7 + power + Math.round(resonance * 0.5) + r * 2;
  } else if (kind === 'nova' || kind === 'frost_nova' || kind === 'supernova' || kind === 'meteor_constellation') {
    baseDmg = 12 + Math.round(power * 1.7) + r * 3;
  } else if (kind === 'drain_beam' || kind === 'execute_beam' || kind === 'harbingers_requiem') {
    baseDmg = 8 + Math.round(power * 1.5) + r * 3;
    if (kind === 'execute_beam' && target && target.hp <= (target.maxHp || 1) * 0.5) {
      baseDmg = Math.round(baseDmg * 1.5);
    }
  } else if (kind === 'judgement_verdict') {
    const shieldBonus = Math.round((actor?.shield || 0) * 0.35);
    baseDmg = 28 + power * 2 + bastion * 2 + shieldBonus + r * 4;
  } else if (kind === 'phantom_sever' || kind === 'tempest_thorns' || kind === 'tectonic_cataclysm' || kind === 'astral_supernova') {
    baseDmg = 34 + power * 2 + Math.round(resonance * 1.2) + r * 4;
  } else if (kind === 'singularity_collapse' || kind === 'continental_quake' || kind === 'stasis_bubble') {
    baseDmg = 48 + power * 3 + r * 4;
  } else if (kind === 'soul_covenant') {
    baseDmg = 18 + Math.round(resonance * 2.2) + r * 4;
  } else if (kind === 'dash_cleave' || kind === 'colossus_stomp' || kind === 'scythe_wave') {
    baseDmg = 12 + power * 2 + r * 3;
  } else if (kind === 'aegis_slam' || kind === 'seismic_taunt' || kind === 'bramble_burst' || kind === 'shadow_step' || kind === 'rift_teleport' || kind === 'serrated_mutilate' || kind === 'crimson_rupture' || kind === 'sunfire_lance' || kind === 'arcane_tether') {
    baseDmg = 7 + power + r * 2;
  }

  let critMult = isCrit ? calcCritDamageMult(prog) : 1.0;
  if (isCrit && (actor?.stealthedTimer || 0) > 0 && classPassive.stealthCritBonus) {
    critMult += classPassive.stealthCritBonus;
  }

  const rawScaled = baseDmg * zenithMult * duskMult * hexMult * shatterMult * critMult;
  const dmg = Math.max(1, Math.round(rawScaled));

  const baseHeal = Math.round((8 + bastion * 2 + resonance + r * 3) * (classPassive.healMult || 1));
  const baseShield = Math.round(14 + bastion * 3 + r * 4);

  return {
    dmg,
    heal: baseHeal,
    shield: baseShield,
    duskLeechBonus: duskMarksSpent * 0.06,
  };
}

/**
 * Updates faction-specific secondary resource pools and class combo states on ability cast.
 */
export function advanceFactionResourceOnCast(actor, faction, classId, spec) {
  ensureActorFactionState(actor, faction);
  const res = {
    duskMarksSpent: 0,
    echoFromResonance: false,
    chronoSnapConsumed: false,
    chronoSnapTriggered: false,
  };
  if (!spec || !actor) return res;

  const isFlash = Boolean(spec.tcgType?.includes('Flash'));
  const isRite = Boolean(spec.tcgType?.includes('Rite'));

  if (faction === 'Umbri') {
    if (isFlash) {
      const gain = spec.kind === 'melee_cleave' || spec.kind === 'serrated_mutilate'
        ? 1 + (getClassPassive(classId).bonusMarksOnMelee || 0)
        : 1;
      actor.duskMarks = Math.min(5, (actor.duskMarks || 0) + gain);
    } else if (isRite || spec.consumesDuskMarks) {
      res.duskMarksSpent = actor.duskMarks || 0;
      actor.duskMarks = 0;
    }
  } else if (faction === 'Terra') {
    if (isFlash || spec.kind === 'thornbark' || spec.kind === 'iron_fortify' || spec.kind === 'seismic_taunt') {
      actor.rootguardStacks = Math.min(5, (actor.rootguardStacks || 0) + 1);
    }
  } else if (faction === 'Aether') {
    if (isFlash) {
      actor.astralResonance = Math.min(4, (actor.astralResonance || 0) + 1);
    } else if (isRite) {
      if ((actor.astralResonance || 0) >= 4) {
        actor.astralResonance = 0;
        actor.echoPrimed = true;
        res.echoFromResonance = true;
      } else {
        actor.astralResonance = Math.min(4, (actor.astralResonance || 0) + 1);
      }
    }
  }

  // Class Passive: Chronomancer Sage — every 3rd Flash primes instant next Rite & shaves CDs
  if (classId === 'chronomancer_sage') {
    if (isFlash) {
      actor.flashComboCount = (actor.flashComboCount || 0) + 1;
      if (actor.flashComboCount >= 3) {
        actor.flashComboCount = 0;
        actor.chronoSnapReady = true;
        res.chronoSnapTriggered = true;
      }
    } else if (isRite && actor.chronoSnapReady) {
      actor.chronoSnapReady = false;
      res.chronoSnapConsumed = true;
    }
  }

  return res;
}

/**
 * Shared combat timer decay for both server player sessions and offline player.
 */
export function tickActorCombatTimers(actor, dt) {
  if (!actor || dt <= 0) return;
  const timerKeys = [
    'weakenTimer',
    'slowTimer',
    'snareTimer',
    'freezeTimer',
    'stealthedTimer',
    'thornbarkTimer',
    'zenithTimer',
    'rebukeTimer',
    'auroraStrideTimer',
    'solarAscensionTimer',
    'abyssalShroudTimer',
    'voidformTimer',
    'rootedBastionTimer',
    'treantFormTimer',
    'phaseShiftTimer',
    'temporalApotheosisTimer',
    'bastionBannerTimer',
    'anchorTimer',
    'solarisDomeTimer',
    'hexedTimer',
    'sunbrandTimer',
    'poisonTimer',
    'bleedTimer',
    'staggerTimer',
  ];
  for (const key of timerKeys) {
    if ((actor[key] || 0) > 0) {
      actor[key] = Math.max(0, actor[key] - dt);
    }
  }
}
