import { ACTION_SLOTS } from "./constants.js";
import { ROOM_TYPES } from "./rooms.js";
import { ABILITIES_CATALOG } from "./abilitiesCatalog.js";

export const FACTIONS_META = {
  Solari: {
    id: 'Solari',
    name: 'Solari (The Light)',
    title: 'Solari Vanguard',
    icon: '☀️',
    logo: '/solari_nobg.png',
    color: '#facc15',
    accent: '#2563eb',
    homeBiome: ROOM_TYPES.SOLARI_CITADEL,
    mechanicName: 'Guard & Zenith',
    mechanicDesc: 'Reaching 100 Glimmer triggers Zenith State (+25% DMG & heals nearby allies/Outpost Nexus).',
    motto: 'May the Sunspire illuminate the darkness.',
  },
  Umbri: {
    id: 'Umbri',
    name: 'Umbri (The Shadow)',
    title: 'Umbral Assassin',
    icon: '🌑',
    logo: '/umbri_nobg.png',
    color: '#c084fc',
    accent: '#581c87',
    homeBiome: ROOM_TYPES.UMBRI_UNDERCITY,
    mechanicName: 'Stealth & Void Harvest',
    mechanicDesc: 'Shadow vanish grants +45% Ambush Crit, and Void Harvest leeches 20% of Rite DMG as HP.',
    motto: 'In shadows we weave, in silence we strike.',
  },
  Terra: {
    id: 'Terra',
    name: 'Terra (The Earth)',
    title: 'Forest Warden',
    icon: '🌿',
    logo: '/terra_nobg.png',
    color: '#4ade80',
    accent: '#15803d',
    homeBiome: ROOM_TYPES.TERRA_ORCHARD,
    mechanicName: 'Overwhelm & Thornbark',
    mechanicDesc: 'Overwhelm cleaves nearby enemies and Thornbark reflects 35% of incoming melee hits.',
    motto: 'Stand unyielding as ancient stone.',
  },
  Aether: {
    id: 'Aether',
    name: 'Aether (The Magic)',
    title: 'Chronomancer Sage',
    icon: '🔮',
    logo: '/aether_nobg.png',
    color: '#38bdf8',
    accent: '#0369a1',
    homeBiome: ROOM_TYPES.AETHER_SPIRE,
    mechanicName: 'Flash Tempo & Echo',
    mechanicDesc: '-12% faster Rite/Flash cooldowns and 35% chance for Rites to Echo for +45% bonus arcane DMG.',
    motto: 'Time and space bend to the arcane truth.',
  },
};

// All 8 Playable Archetypes across the 4 Canonical Factions
export const CLASSES_CATALOG = {
  solari_vanguard: {
    id: 'solari_vanguard',
    name: 'Solari Vanguard',
    faction: 'Solari',
    role: 'Radiant Frontliner • Guard & Zenith',
    desc: 'Sun-forged champion wielding radiant steel, starlight barriers, and Daystar novas.',
    bonusStats: { power: 1, bastion: 2, resonance: 0, tempo: 0 },
    defaultEquipment: { weapon: 'solari_spellblade', armor: 'sunforged_plate', offhand: 'radiant_shield' },
    // Only the primary attack starts equipped. Every other action slot is an
    // empty target the player fills by dragging Rites/Flashes onto the bar.
    defaultLoadout: { 1: 'flare_strike' },
    legacyDefaultLoadout: {
      1: 'flare_strike', 2: 'solar_flare', 3: 'judgement_of_the_sun', 4: 'consecrated_ground',
      9: 'radiant_bulwark', 10: 'blessing_of_dawn', 11: 'wrath_of_the_daystar', 12: 'blinding_radiance',
    },
  },
  aurora_marshal: {
    id: 'aurora_marshal',
    name: 'Aurora Marshal',
    faction: 'Solari',
    role: 'Celestial Commander • Nexus Healer',
    desc: 'Herald of Dawn commanding Decree of the Sun and Daybreak to mend allies and Outpost Nexuses.',
    bonusStats: { power: 1, bastion: 1, resonance: 1, tempo: 0 },
    defaultEquipment: { weapon: 'solari_spellblade', armor: 'sunforged_plate', offhand: 'mirror_shield' },
    defaultLoadout: { 1: 'flare_strike' },
    legacyDefaultLoadout: {
      1: 'flare_strike', 2: 'solar_flare', 3: 'decree_of_the_sun', 4: 'consecrated_ground',
      9: 'radiant_bulwark', 10: 'daybreak', 11: 'wrath_of_the_daystar', 12: 'blinding_radiance',
    },
  },
  umbral_assassin: {
    id: 'umbral_assassin',
    name: 'Umbral Assassin',
    faction: 'Umbri',
    role: 'Stealth Executioner • Void Harvest',
    desc: 'Duskveil stalker vanishing in shadow, teleporting with Shadow Step, and executing foes with Unmake.',
    bonusStats: { power: 2, bastion: 0, resonance: 0, tempo: 1 },
    defaultEquipment: { weapon: 'scythe_soulreaper', armor: 'duskveil_shroud', offhand: 'graveglass_lantern' },
    defaultLoadout: { 1: 'whisper_of_the_void' },
    legacyDefaultLoadout: {
      1: 'whisper_of_the_void', 2: 'unmake', 3: 'soul_tithe', 4: 'nightfall_plague',
      9: 'veil_of_dusk', 10: 'siphon_soul', 11: 'graveglass_ward', 12: 'shadow_step',
    },
  },
  graveglass_oracle: {
    id: 'graveglass_oracle',
    name: 'Graveglass Oracle',
    faction: 'Umbri',
    role: 'Blood-Hex Reaper • Life Drain',
    desc: 'Sepulcher mystic draining life-force via Siphon Soul, Soul Tithe, and Nightfall Plague.',
    bonusStats: { power: 1, bastion: 0, resonance: 2, tempo: 0 },
    defaultEquipment: { weapon: 'scythe_soulreaper', armor: 'duskveil_shroud', offhand: 'graveglass_lantern' },
    defaultLoadout: { 1: 'whisper_of_the_void' },
    legacyDefaultLoadout: {
      1: 'whisper_of_the_void', 2: 'siphon_soul', 3: 'soul_tithe', 4: 'nightfall_plague',
      9: 'graveglass_ward', 10: 'veil_of_dusk', 11: 'unmake', 12: 'shadow_step',
    },
  },
  forest_warden: {
    id: 'forest_warden',
    name: 'Forest Warden',
    faction: 'Terra',
    role: 'Primal Bruiser • Overwhelm & Roots',
    desc: 'Guardian of Glimmer Orchard snaring enemies in Briar Snare and charging with Wildshape Surge.',
    bonusStats: { power: 1, bastion: 1, resonance: 0, tempo: 1 },
    defaultEquipment: { weapon: 'ironwood_maul', armor: 'ironwood_armor', offhand: 'bramble_buckler' },
    defaultLoadout: { 1: 'tectonic_slam' },
    legacyDefaultLoadout: {
      1: 'tectonic_slam', 2: 'earthshatter', 3: 'ancient_boulder', 4: 'briar_snare',
      9: 'barkskin_infusion', 10: 'verdant_renewal', 11: 'overwhelm_roar', 12: 'wildshape_surge',
    },
  },
  stonekin_elder: {
    id: 'stonekin_elder',
    name: 'Stonekin Elder',
    faction: 'Terra',
    role: 'Colossal Tank • Thornbark Reflect',
    desc: 'Ancient Rootdeep juggernaut encased in Barkskin Infusion, shattering battlefields with Tectonic Slam.',
    bonusStats: { power: 1, bastion: 2, resonance: 0, tempo: 0 },
    defaultEquipment: { weapon: 'ironwood_maul', armor: 'ironwood_armor', offhand: 'bramble_buckler' },
    defaultLoadout: { 1: 'tectonic_slam' },
    legacyDefaultLoadout: {
      1: 'tectonic_slam', 2: 'ancient_boulder', 3: 'earthshatter', 4: 'briar_snare',
      9: 'barkskin_infusion', 10: 'verdant_renewal', 11: 'overwhelm_roar', 12: 'wildshape_surge',
    },
  },
  chronomancer_sage: {
    id: 'chronomancer_sage',
    name: 'Chronomancer Sage',
    faction: 'Aether',
    role: 'Time-Bender • Flash Tempo & Echo',
    desc: 'Mirrorgate scholar bending spacetime with Chrono Shift, Gravity Well, and Time Loop Paradox.',
    bonusStats: { power: 1, bastion: 0, resonance: 1, tempo: 1 },
    defaultEquipment: { weapon: 'chronocore_staff', armor: 'starweave_robe', offhand: 'mirror_shield' },
    defaultLoadout: { 1: 'reality_fracture' },
    legacyDefaultLoadout: {
      1: 'reality_fracture', 2: 'astral_convergence', 3: 'arcane_bolt', 4: 'gravity_well',
      9: 'mirror_barrier', 10: 'time_loop_paradox', 11: 'frost_nova', 12: 'chrono_shift',
    },
  },
  nexus_weaver: {
    id: 'nexus_weaver',
    name: 'Nexus Weaver',
    faction: 'Aether',
    role: 'Arcane Battlemage • Starfall & Freeze',
    desc: 'Weaver of cosmic leylines freezing foes with Frost Nova and calling down Astral Convergence.',
    bonusStats: { power: 1, bastion: 0, resonance: 2, tempo: 0 },
    defaultEquipment: { weapon: 'chronocore_staff', armor: 'starweave_robe', offhand: 'mirror_shield' },
    defaultLoadout: { 1: 'reality_fracture' },
    legacyDefaultLoadout: {
      1: 'reality_fracture', 2: 'arcane_bolt', 3: 'astral_convergence', 4: 'gravity_well',
      9: 'mirror_barrier', 10: 'time_loop_paradox', 11: 'frost_nova', 12: 'chrono_shift',
    },
  },
};

// Normalizes a stored loadout. Characters still carrying an old eight-ability
// default are reset to the single starting Rite/Flash, and cleared slots stay
// cleared instead of silently falling back to the class default.
export function sanitizeLoadout(rawLoadout, classId) {
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const raw = rawLoadout && typeof rawLoadout === 'object' ? rawLoadout : null;
  const legacy = cls.legacyDefaultLoadout;
  const isLegacyDefault = Boolean(raw && legacy) &&
    ACTION_SLOTS.every((slot) => raw[slot] === legacy[slot]);
  if (isLegacyDefault) return { ...cls.defaultLoadout };

  const out = {};
  let hasExplicitSlotOne = false;
  if (raw) {
    if ('1' in raw) hasExplicitSlotOne = true;
    for (const slot of ACTION_SLOTS) {
      const candidate = raw[slot];
      if (candidate && ABILITIES_CATALOG[candidate]) out[slot] = candidate;
    }
  }
  if (!hasExplicitSlotOne && cls.defaultLoadout[1]) out[1] = cls.defaultLoadout[1];
  return out;
}

// ==========================================
// Canonical Faction & Archetype Resolution
// ==========================================
export function resolveFactionAndClass({ faction = null, classId = null, loadout = null, orderTag = null } = {}) {
  // If slot 1 is an explicit canonical ability, that determines the true faction
  const s1 = loadout?.[1] || loadout?.['1'];
  if (s1 && ABILITIES_CATALOG[s1]?.faction && ABILITIES_CATALOG[s1].faction !== 'All') {
    const abFac = ABILITIES_CATALOG[s1].faction;
    if (classId && CLASSES_CATALOG[classId] && CLASSES_CATALOG[classId].faction === abFac) {
      return { faction: abFac, classId };
    }
    const defClass = abFac === 'Umbri' ? 'umbral_assassin' : abFac === 'Terra' ? 'forest_warden' : abFac === 'Aether' ? 'chronomancer_sage' : 'solari_vanguard';
    return { faction: abFac, classId: defClass };
  }

  // Canonical Order Tag checks if slot 1 was not conclusive
  const tag = String(orderTag || '').toUpperCase();
  if (tag === 'VOID') {
    const cid = classId && CLASSES_CATALOG[classId]?.faction === 'Umbri' ? classId : 'umbral_assassin';
    return { faction: 'Umbri', classId: cid };
  }
  if (tag === 'ROOT') {
    const cid = classId && CLASSES_CATALOG[classId]?.faction === 'Terra' ? classId : 'forest_warden';
    return { faction: 'Terra', classId: cid };
  }
  if (tag === 'AETH') {
    const cid = classId && CLASSES_CATALOG[classId]?.faction === 'Aether' ? classId : 'chronomancer_sage';
    return { faction: 'Aether', classId: cid };
  }
  if (tag === 'SUN') {
    const cid = classId && CLASSES_CATALOG[classId]?.faction === 'Solari' ? classId : 'solari_vanguard';
    return { faction: 'Solari', classId: cid };
  }

  // Catalog normalization fallback
  let cls = CLASSES_CATALOG[classId];
  if (!cls) {
    cls = Object.values(CLASSES_CATALOG).find((c) => c.faction === faction) || CLASSES_CATALOG.solari_vanguard;
  }
  const resolvedFac = faction || cls.faction || 'Solari';
  if (cls.faction !== resolvedFac) {
    cls = Object.values(CLASSES_CATALOG).find((c) => c.faction === resolvedFac) || CLASSES_CATALOG.solari_vanguard;
  }
  return { faction: resolvedFac, classId: cls.id };
}
