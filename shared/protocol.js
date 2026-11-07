// ==========================================
// GlimmerFall Online 2D — Shared Protocol, All 4 Factions, 8 Classes,
// Authentic TCG Rites/Flashes, Biomes, Equipment Paperdoll & RPG Math
// ==========================================

export const TICK_RATE = 20;
export const TICK_MS = 1000 / TICK_RATE;
export const TILE_SIZE = 16;
export const YARD_PX = 12;

export const ACTION_SLOTS = [1, 2, 3, 4, 9, 10, 11, 12];

export const ROOM_TYPES = {
  SANCTUARY_HUB: 'sanctuary_hub',
  NEXUS_WARZONE: 'nexus_warzone',
  SOLARI_CITADEL: 'solari_citadel',
  UMBRI_UNDERCITY: 'umbri_undercity',
  TERRA_ORCHARD: 'terra_orchard',
  AETHER_SPIRE: 'aether_spire',
  ARENA_3V3: 'arena_3v3',
  NEXUS_FORGOTTEN_RUINS: 'nexus_forgotten_ruins',
  SOLARI_SUNKEN_VAULT: 'solari_sunken_vault',
  UMBRI_SHADOW_LABYRINTH: 'umbri_shadow_labyrinth',
  TERRA_OVERGROWTH_SANCTUARY: 'terra_overgrowth_sanctuary',
  AETHER_FRACTURED_ARCHIVE: 'aether_fractured_archive',
  CELESTIAL_ASCENT: 'celestial_ascent',
  STARFALL_CRATER: 'starfall_crater',
  ABYSSAL_RIFT: 'abyssal_rift',
};

// Per-character delay between node harvests. Grand Fonts take longer to channel.
export const HARVEST_COOLDOWN_MS = {
  normal: 250,
  grand: 1250,
};

// Three shared Grand Fonts per realm, placed away from spawn crowds and quest NPCs.
export const GRAND_FONT_POSITIONS = {
  [ROOM_TYPES.SANCTUARY_HUB]: [
    { x: -470, y: 60 },
    { x: 470, y: 60 },
    { x: 0, y: -320 },
  ],
  [ROOM_TYPES.NEXUS_WARZONE]: [
    { x: 0, y: 380 },
    { x: -680, y: 1180 },
    { x: 680, y: 1180 },
  ],
  [ROOM_TYPES.SOLARI_CITADEL]: [
    { x: 0, y: 270 },
    { x: -330, y: 170 },
    { x: 330, y: 170 },
  ],
  [ROOM_TYPES.UMBRI_UNDERCITY]: [
    { x: 0, y: 270 },
    { x: -330, y: 170 },
    { x: 330, y: 170 },
  ],
  [ROOM_TYPES.TERRA_ORCHARD]: [
    { x: 0, y: 270 },
    { x: -330, y: 170 },
    { x: 330, y: 170 },
  ],
  [ROOM_TYPES.AETHER_SPIRE]: [
    { x: 0, y: 270 },
    { x: -330, y: 170 },
    { x: 330, y: 170 },
  ],
  [ROOM_TYPES.NEXUS_FORGOTTEN_RUINS]: [
    { x: 0, y: 280 },
    { x: -320, y: 140 },
    { x: 320, y: 140 },
  ],
  [ROOM_TYPES.SOLARI_SUNKEN_VAULT]: [
    { x: 0, y: 280 },
    { x: -320, y: 140 },
    { x: 320, y: 140 },
  ],
  [ROOM_TYPES.UMBRI_SHADOW_LABYRINTH]: [
    { x: 0, y: 280 },
    { x: -320, y: 140 },
    { x: 320, y: 140 },
  ],
  [ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY]: [
    { x: 0, y: 130 },
    { x: -250, y: 80 },
    { x: 250, y: 80 },
  ],
  [ROOM_TYPES.AETHER_FRACTURED_ARCHIVE]: [
    { x: 0, y: 130 },
    { x: -250, y: 80 },
    { x: 250, y: 80 },
  ],
  [ROOM_TYPES.CELESTIAL_ASCENT]: [
    { x: 0, y: 900 },
    { x: -350, y: 800 },
    { x: 350, y: 800 },
  ],
  [ROOM_TYPES.STARFALL_CRATER]: [
    { x: 0, y: -260 },
    { x: -380, y: 180 },
    { x: 380, y: 180 },
  ],
  [ROOM_TYPES.ABYSSAL_RIFT]: [
    { x: 0, y: -320 },
    { x: -420, y: 200 },
    { x: 420, y: 200 },
  ],
  [ROOM_TYPES.ARENA_3V3]: [],
};

export const ROOM_CONFIGS = {
  [ROOM_TYPES.SANCTUARY_HUB]: {
    type: ROOM_TYPES.SANCTUARY_HUB,
    title: 'AWAKENING SANCTUARY HAVEN & METROPOLIS',
    shortTitle: 'SANCTUARY METROPOLIS',
    biomeTheme: 'sanctuary',
    bgm: 'sanctuary',
    maxPlayers: 80,
    width: 140,
    height: 120,
    halfW: 1120,
    halfH: 960,
    pvp: false,
    spawnX: 0,
    spawnY: 96,
    edgeTransitions: {
      north: ROOM_TYPES.AETHER_SPIRE,
      south: ROOM_TYPES.TERRA_ORCHARD,
      east: ROOM_TYPES.UMBRI_UNDERCITY,
      west: ROOM_TYPES.SOLARI_CITADEL,
    },
  },
  [ROOM_TYPES.NEXUS_WARZONE]: {
    type: ROOM_TYPES.NEXUS_WARZONE,
    title: 'THE CONTINENTAL CALDERA (OPEN WARZONE • LV. 30+)',
    shortTitle: 'CONTINENTAL CALDERA',
    biomeTheme: 'warzone',
    bgm: 'warzone',
    maxPlayers: 60,
    width: 300,
    height: 225,
    halfW: 2400,
    halfH: 1800,
    pvp: true,
    spawnX: 0,
    spawnY: 1740,
    edgeTransitions: {
      south: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
      north: ROOM_TYPES.CELESTIAL_ASCENT,
      west: ROOM_TYPES.ARENA_3V3,
      east: ROOM_TYPES.ABYSSAL_RIFT,
    },
  },
  [ROOM_TYPES.SOLARI_CITADEL]: {
    type: ROOM_TYPES.SOLARI_CITADEL,
    title: 'LANTERN DISTRICT & GOLDEN CITADEL',
    shortTitle: 'GOLDEN CITADEL',
    biomeTheme: 'solari',
    bgm: 'warzone',
    maxPlayers: 50,
    width: 120,
    height: 100,
    halfW: 960,
    halfH: 800,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      east: ROOM_TYPES.SANCTUARY_HUB,
      north: ROOM_TYPES.SOLARI_SUNKEN_VAULT,
      west: ROOM_TYPES.STARFALL_CRATER,
    },
  },
  [ROOM_TYPES.UMBRI_UNDERCITY]: {
    type: ROOM_TYPES.UMBRI_UNDERCITY,
    title: 'SEPULCHER UNDERCITY & DUSKVEIL BOG',
    shortTitle: 'DUSKVEIL BOG',
    biomeTheme: 'umbri',
    bgm: 'warzone',
    maxPlayers: 30,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      west: ROOM_TYPES.SANCTUARY_HUB,
      north: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH,
    },
  },
  [ROOM_TYPES.TERRA_ORCHARD]: {
    type: ROOM_TYPES.TERRA_ORCHARD,
    title: 'GLIMMER ORCHARD & ROOTDEEP EXPANSE',
    shortTitle: 'GLIMMER ORCHARD',
    biomeTheme: 'terra',
    bgm: 'warzone',
    maxPlayers: 30,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      north: ROOM_TYPES.SANCTUARY_HUB,
      west: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
    },
  },
  [ROOM_TYPES.AETHER_SPIRE]: {
    type: ROOM_TYPES.AETHER_SPIRE,
    title: 'MIRRORGATE SPIRE & CONTINUUM',
    shortTitle: 'MIRRORGATE SPIRE',
    biomeTheme: 'aether',
    bgm: 'warzone',
    maxPlayers: 30,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      south: ROOM_TYPES.SANCTUARY_HUB,
      north: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
      east: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE,
    },
  },
  [ROOM_TYPES.ARENA_3V3]: {
    type: ROOM_TYPES.ARENA_3V3,
    title: '3v3 RANKED NEXUS ARENA',
    shortTitle: '3v3 NEXUS ARENA',
    biomeTheme: 'arena',
    bgm: 'boss',
    maxPlayers: 6,
    width: 32,
    height: 36,
    halfW: 256,
    halfH: 288,
    pvp: true,
    spawnX: 0,
    spawnY: 175,
    edgeTransitions: {
      east: ROOM_TYPES.NEXUS_WARZONE,
    },
  },
  [ROOM_TYPES.NEXUS_FORGOTTEN_RUINS]: {
    type: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
    title: 'THE SHATTERED FIRST NEXUS & FORGOTTEN RUINS',
    shortTitle: 'FORGOTTEN RUINS',
    biomeTheme: 'ruins',
    bgm: 'sanctuary',
    maxPlayers: 35,
    width: 54,
    height: 54,
    halfW: 432,
    halfH: 432,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      south: ROOM_TYPES.AETHER_SPIRE,
      north: ROOM_TYPES.NEXUS_WARZONE,
      east: ROOM_TYPES.STARFALL_CRATER,
    },
  },
  [ROOM_TYPES.CELESTIAL_ASCENT]: {
    type: ROOM_TYPES.CELESTIAL_ASCENT,
    title: 'CELESTIAL ASCENT & EMPYREAN TITAN SUMMIT (LV. 35+)',
    shortTitle: 'APEX TITAN SUMMIT',
    biomeTheme: 'celestial',
    bgm: 'boss',
    maxPlayers: 40,
    width: 140,
    height: 140,
    halfW: 1120,
    halfH: 1120,
    pvp: true,
    spawnX: 0,
    spawnY: 1040,
    edgeTransitions: {
      south: ROOM_TYPES.NEXUS_WARZONE,
      north: ROOM_TYPES.ABYSSAL_RIFT,
    },
  },
  [ROOM_TYPES.SOLARI_SUNKEN_VAULT]: {
    type: ROOM_TYPES.SOLARI_SUNKEN_VAULT,
    title: 'SUNKEN VAULT OF THE DAWN',
    shortTitle: 'SUNKEN VAULT',
    biomeTheme: 'solari_vault',
    bgm: 'boss',
    maxPlayers: 25,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      south: ROOM_TYPES.SOLARI_CITADEL,
    },
  },
  [ROOM_TYPES.UMBRI_SHADOW_LABYRINTH]: {
    type: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH,
    title: 'DUSKVEIL SHADOW LABYRINTH',
    shortTitle: 'SHADOW LABYRINTH',
    biomeTheme: 'umbri_labyrinth',
    bgm: 'boss',
    maxPlayers: 25,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      south: ROOM_TYPES.UMBRI_UNDERCITY,
    },
  },
  [ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY]: {
    type: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
    title: 'ROOTDEEP PRIMORDIAL HOLLOW',
    shortTitle: 'PRIMORDIAL HOLLOW',
    biomeTheme: 'terra_grove',
    bgm: 'warzone',
    maxPlayers: 25,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      east: ROOM_TYPES.TERRA_ORCHARD,
    },
  },
  [ROOM_TYPES.AETHER_FRACTURED_ARCHIVE]: {
    type: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE,
    title: 'FRACTURED CHRONO-ARCHIVE',
    shortTitle: 'CHRONO-ARCHIVE',
    biomeTheme: 'aether_archive',
    bgm: 'boss',
    maxPlayers: 25,
    width: 48,
    height: 48,
    halfW: 384,
    halfH: 384,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      west: ROOM_TYPES.AETHER_SPIRE,
      south: ROOM_TYPES.AETHER_SPIRE,
    },
  },
  [ROOM_TYPES.STARFALL_CRATER]: {
    type: ROOM_TYPES.STARFALL_CRATER,
    title: 'STARFALL METEORITE CRATER & ASTRAL FORGE (LV. 20–32)',
    shortTitle: 'STARFALL CRATER',
    biomeTheme: 'starfall',
    bgm: 'warzone',
    maxPlayers: 40,
    width: 80,
    height: 80,
    halfW: 640,
    halfH: 640,
    pvp: false,
    spawnX: 0,
    spawnY: 220,
    edgeTransitions: {
      east: ROOM_TYPES.SOLARI_CITADEL,
      west: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
    },
  },
  [ROOM_TYPES.ABYSSAL_RIFT]: {
    type: ROOM_TYPES.ABYSSAL_RIFT,
    title: 'THE ABYSSAL RIFT & PRIMEVAL SANCTUM (LV. 32–45)',
    shortTitle: 'ABYSSAL RIFT',
    biomeTheme: 'abyssal',
    bgm: 'boss',
    maxPlayers: 45,
    width: 90,
    height: 90,
    halfW: 720,
    halfH: 720,
    pvp: false,
    spawnX: 0,
    spawnY: 260,
    edgeTransitions: {
      west: ROOM_TYPES.NEXUS_WARZONE,
      south: ROOM_TYPES.CELESTIAL_ASCENT,
    },
  },
};

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

// Equipment & Pixel Paperdoll Catalog (visibly rendered on 24x26 character sprites!)
export const EQUIPMENT_CATALOG = {
  // Weapons
  solari_spellblade: {
    id: 'solari_spellblade',
    slot: 'weapon',
    name: 'Solari Spellblade',
    icon: '🗡️',
    rarity: 'Awakened',
    style: 'spellblade',
    bladeColor: '#fde047',
    hiltColor: '#92400e',
    stats: { power: 2 },
    desc: 'Sun-forged radiant blade (+2 Power).',
  },
  scythe_soulreaper: {
    id: 'scythe_soulreaper',
    slot: 'weapon',
    name: 'Scythe of the Soulreaper',
    icon: '⛏️',
    rarity: 'Epic Relic',
    style: 'scythe',
    bladeColor: '#e879f9',
    hiltColor: '#3b0764',
    stats: { power: 3, tempo: 1 },
    desc: 'Curved Umbri reaper scythe (+3 Power, +1 Tempo).',
  },
  ironwood_maul: {
    id: 'ironwood_maul',
    slot: 'weapon',
    name: 'Ironwood Greathammer',
    icon: '🔨',
    rarity: 'Awakened',
    style: 'maul',
    bladeColor: '#84cc16',
    hiltColor: '#78350f',
    stats: { power: 2, bastion: 2 },
    desc: 'Ancient stone-and-root war maul (+2 Power, +2 Bastion).',
  },
  chronocore_staff: {
    id: 'chronocore_staff',
    slot: 'weapon',
    name: 'Astral Chrono-Staff',
    icon: '🪄',
    rarity: 'Awakened',
    style: 'staff',
    bladeColor: '#38bdf8',
    hiltColor: '#1e3a8a',
    stats: { resonance: 2, tempo: 2 },
    desc: 'Crystal-crowned continuum staff (+2 Resonance, +2 Tempo).',
  },
  sunfire_greatsword: {
    id: 'sunfire_greatsword',
    slot: 'weapon',
    name: 'Sunfire Colossus Greatsword',
    icon: '🔥',
    rarity: 'Mythic Boss Drop',
    style: 'greatsword',
    bladeColor: '#fb923c',
    hiltColor: '#facc15',
    stats: { power: 4, bastion: 1 },
    desc: 'Blazing greatsword of the Golden Citadel (+4 Power, +1 Bastion).',
  },

  // Armor
  sunforged_plate: {
    id: 'sunforged_plate',
    slot: 'armor',
    name: 'Sunforged Plate',
    icon: '🥋',
    rarity: 'Awakened',
    armorDark: '#d97706',
    armorHi: '#facc15',
    capeColor: '#dc2626',
    stats: { bastion: 2 },
    desc: 'Gleaming Solari chestplate (+2 Bastion).',
  },
  duskveil_shroud: {
    id: 'duskveil_shroud',
    slot: 'armor',
    name: 'Duskveil Shadowmail',
    icon: '🧥',
    rarity: 'Awakened',
    armorDark: '#312e81',
    armorHi: '#7c3aed',
    capeColor: '#581c87',
    stats: { tempo: 2, power: 1 },
    desc: 'Woven twilight mantle (+2 Tempo, +1 Power).',
  },
  ironwood_armor: {
    id: 'ironwood_armor',
    slot: 'armor',
    name: 'Ironwood Armor',
    icon: '🌿',
    rarity: 'Epic Relic',
    armorDark: '#14532d',
    armorHi: '#4ade80',
    capeColor: '#15803d',
    stats: { bastion: 3 },
    desc: 'Living Ironwood bark-plate (+3 Bastion).',
  },
  starweave_robe: {
    id: 'starweave_robe',
    slot: 'armor',
    name: 'Starweave Vestments',
    icon: '🌌',
    rarity: 'Awakened',
    armorDark: '#0369a1',
    armorHi: '#38bdf8',
    capeColor: '#1d4ed8',
    stats: { resonance: 2, tempo: 1 },
    desc: 'Astral scholar regalia (+2 Resonance, +1 Tempo).',
  },

  // Offhands / Shields / Relics
  radiant_shield: {
    id: 'radiant_shield',
    slot: 'offhand',
    name: 'Radiant Shield',
    icon: '🛡️',
    rarity: 'Solari Relic',
    style: 'shield',
    mainColor: '#0284c7',
    trimColor: '#facc15',
    stats: { bastion: 2 },
    desc: 'AWK Solari Relic tower shield (+2 Bastion).',
  },
  mirror_shield: {
    id: 'mirror_shield',
    slot: 'offhand',
    name: 'Mirror Shield',
    icon: '🪞',
    rarity: 'Aether Relic',
    style: 'mirror',
    mainColor: '#bae6fd',
    trimColor: '#38bdf8',
    stats: { resonance: 2, bastion: 1 },
    desc: 'Refractive silver-cyan Mirror Shield (+2 Resonance, +1 Bastion).',
  },
  graveglass_lantern: {
    id: 'graveglass_lantern',
    slot: 'offhand',
    name: 'Graveglass Focus',
    icon: '🏮',
    rarity: 'Umbri Relic',
    style: 'orb',
    mainColor: '#a855f7',
    trimColor: '#f43f5e',
    stats: { power: 2 },
    desc: 'Soul-lit Graveglass cenotaph (+2 Power).',
  },
  bramble_buckler: {
    id: 'bramble_buckler',
    slot: 'offhand',
    name: 'Thornbark Buckler',
    icon: '🪵',
    rarity: 'Terra Relic',
    style: 'shield',
    mainColor: '#3f6212',
    trimColor: '#84cc16',
    stats: { bastion: 2, power: 1 },
    desc: 'Spiked Rootdeep buckler (+2 Bastion, +1 Power).',
  },

  // === NEW EXPLORABLE DUNGEON SUB-ZONE & RUINS BOSS RELICS ===
  prismatic_keystone: {
    id: 'prismatic_keystone',
    slot: 'offhand',
    name: 'Prismatic Keystone Focus',
    icon: '💎',
    rarity: 'Mythic Relic',
    style: 'orb',
    mainColor: '#facc15',
    trimColor: '#38bdf8',
    stats: { power: 2, resonance: 2, bastion: 2 },
    desc: 'Ancient omni-elemental keystone from the Forgotten First Nexus (+2 Power, +2 Resonance, +2 Bastion).',
  },
  dawnfire_crest: {
    id: 'dawnfire_crest',
    slot: 'offhand',
    name: 'Dawnfire Sun Crest',
    icon: '☀️',
    rarity: 'Mythic Relic',
    style: 'shield',
    mainColor: '#f59e0b',
    trimColor: '#fde047',
    stats: { bastion: 3, power: 1 },
    desc: 'Sunken Dawn titan blazing solar shield (+3 Bastion, +1 Power).',
  },
  void_soulblade: {
    id: 'void_soulblade',
    slot: 'weapon',
    name: 'Voidreaver Soulblade',
    icon: '🗡️',
    rarity: 'Mythic Relic',
    style: 'spellblade',
    bladeColor: '#c084fc',
    hiltColor: '#3b0764',
    stats: { power: 4, tempo: 2 },
    desc: 'Abyssal Devourer shadow-forged soul blade (+4 Power, +2 Tempo).',
  },
  primordial_bark_chest: {
    id: 'primordial_bark_chest',
    slot: 'armor',
    name: 'Primordial Ironbark Cuirass',
    icon: '🌳',
    rarity: 'Mythic Relic',
    armorDark: '#1c1917',
    armorHi: '#22c55e',
    capeColor: '#15803d',
    stats: { bastion: 4, power: 1 },
    desc: 'Living Ironbark armor hewn from the Elder Treant (+4 Bastion, +1 Power).',
  },
  chronos_singularity_core: {
    id: 'chronos_singularity_core',
    slot: 'shield',
    name: 'Chronos Singularity Core',
    icon: '🔮',
    rarity: 'Mythic Relic',
    style: 'orb',
    mainColor: '#0ea5e9',
    trimColor: '#e0e7ff',
    stats: { resonance: 3, tempo: 2 },
    desc: 'Pulsing temporal anomaly core from the Fractured Archive (+3 Resonance, +2 Tempo).',
  },

  // ==========================================
  // CANONICAL CONTINENTAL SETS & EQUIPMENT SLOTS
  // ==========================================

  // --- 1. SUNFORGED DAYSTAR BULWARK (SOLARI ANCIENT SET) ---
  sunforged_greathelm: {
    id: 'sunforged_greathelm',
    slot: 'head',
    name: 'Sunforged Greathelm',
    icon: '🪖',
    rarity: 'Continental Set',
    set: 'sunforged_daystar',
    stats: { bastion: 3, power: 1 },
    desc: 'Heavy fluted golden helm. Part of Sunforged Daystar Bulwark set (+3 Bastion, +1 Power).',
  },
  sunforged_hauberk: {
    id: 'sunforged_hauberk',
    slot: 'body',
    name: 'Sunforged Hauberk',
    icon: '🥋',
    rarity: 'Continental Set',
    set: 'sunforged_daystar',
    armorDark: '#d97706',
    armorHi: '#facc15',
    capeColor: '#dc2626',
    stats: { bastion: 4, power: 1 },
    desc: 'Reinforced solar cuirass. Part of Sunforged Daystar Bulwark set (+4 Bastion, +1 Power).',
  },
  sunforged_greaves: {
    id: 'sunforged_greaves',
    slot: 'legs',
    name: 'Sunforged Greaves',
    icon: '🦿',
    rarity: 'Continental Set',
    set: 'sunforged_daystar',
    stats: { bastion: 3, power: 1 },
    desc: 'Heavy platelegs forged under noon sun. Part of Sunforged Daystar Bulwark set (+3 Bastion, +1 Power).',
  },
  sunforged_warhammer: {
    id: 'sunforged_warhammer',
    slot: 'weapon',
    name: 'Sunforged War-Greathammer',
    icon: '🔨',
    rarity: 'Continental Set',
    set: 'sunforged_daystar',
    style: 'maul',
    bladeColor: '#fde047',
    hiltColor: '#92400e',
    stats: { power: 5, bastion: 2 },
    desc: 'Crushing daystar greathammer. Part of Sunforged Daystar Bulwark set (+5 Power, +2 Bastion).',
  },

  // --- 2. PRIMORDIAL IRONWOOD BASTION (TERRA ANCIENT SET) ---
  ironwood_horned_helm: {
    id: 'ironwood_horned_helm',
    slot: 'head',
    name: 'Ironwood Horned Greathelm',
    icon: '🦌',
    rarity: 'Continental Set',
    set: 'ironwood_primordial',
    stats: { bastion: 3, power: 1 },
    desc: 'Living thornwood horned helm. Part of Primordial Ironwood Bastion set (+3 Bastion, +1 Power).',
  },
  ironwood_bark_chest: {
    id: 'ironwood_bark_chest',
    slot: 'body',
    name: 'Ironwood Primordial Barkplate',
    icon: '🌿',
    rarity: 'Continental Set',
    set: 'ironwood_primordial',
    armorDark: '#14532d',
    armorHi: '#4ade80',
    capeColor: '#15803d',
    stats: { bastion: 5, power: 1 },
    desc: 'Thorned living bark cuirass. Part of Primordial Ironwood Bastion set (+5 Bastion, +1 Power).',
  },
  ironwood_thighguards: {
    id: 'ironwood_thighguards',
    slot: 'legs',
    name: 'Ironwood Root Cuisses',
    icon: '🪵',
    rarity: 'Continental Set',
    set: 'ironwood_primordial',
    stats: { bastion: 3, power: 1 },
    desc: 'Flexible petrified root legplates. Part of Primordial Ironwood Bastion set (+3 Bastion, +1 Power).',
  },
  ironwood_spear: {
    id: 'ironwood_spear',
    slot: 'weapon',
    name: 'Ironwood Leeching Spear',
    icon: '🔱',
    rarity: 'Continental Set',
    set: 'ironwood_primordial',
    style: 'spear',
    bladeColor: '#4ade80',
    hiltColor: '#78350f',
    stats: { power: 4, bastion: 3 },
    desc: 'Vampiric thornwood war-spear. Part of Primordial Ironwood Bastion set (+4 Power, +3 Bastion).',
  },

  // --- 3. CHRONO-WEAVER ASTRAL VESTMENTS (AETHER ANCIENT SET) ---
  chrono_astral_hood: {
    id: 'chrono_astral_hood',
    slot: 'head',
    name: 'Chrono-Weaver Starlight Cowl',
    icon: '🧙',
    rarity: 'Continental Set',
    set: 'chrono_astral',
    stats: { resonance: 3, tempo: 2 },
    desc: 'Star-stitched continuum cowl. Part of Chrono-Weaver Astral Vestments set (+3 Resonance, +2 Tempo).',
  },
  chrono_astral_robes: {
    id: 'chrono_astral_robes',
    slot: 'body',
    name: 'Chrono-Weaver Robe Top',
    icon: '🌌',
    rarity: 'Continental Set',
    set: 'chrono_astral',
    armorDark: '#0369a1',
    armorHi: '#38bdf8',
    capeColor: '#1d4ed8',
    stats: { resonance: 4, tempo: 2 },
    desc: 'Flowing astral continuum robes. Part of Chrono-Weaver Astral Vestments set (+4 Resonance, +2 Tempo).',
  },
  chrono_astral_skirt: {
    id: 'chrono_astral_skirt',
    slot: 'legs',
    name: 'Chrono-Weaver Robe Skirt',
    icon: '🥻',
    rarity: 'Continental Set',
    set: 'chrono_astral',
    stats: { resonance: 3, tempo: 1 },
    desc: 'Pleated starlight robe skirt. Part of Chrono-Weaver Astral Vestments set (+3 Resonance, +1 Tempo).',
  },
  chrono_warp_staff: {
    id: 'chrono_warp_staff',
    slot: 'weapon',
    name: 'Chrono-Warp Archon Staff',
    icon: '🪄',
    rarity: 'Continental Set',
    set: 'chrono_astral',
    style: 'staff',
    bladeColor: '#38bdf8',
    hiltColor: '#1e3a8a',
    stats: { resonance: 5, tempo: 3 },
    desc: 'Temporal continuum catalyst staff. Part of Chrono-Weaver Astral Vestments set (+5 Resonance, +3 Tempo).',
  },

  // --- 4. DUSKVEIL SHADOW REAVER (UMBRI ANCIENT SET) ---
  duskveil_shadow_mask: {
    id: 'duskveil_shadow_mask',
    slot: 'head',
    name: 'Duskveil Shadow Visage',
    icon: '🎭',
    rarity: 'Continental Set',
    set: 'duskveil_reaver',
    stats: { power: 3, tempo: 2 },
    desc: 'Abyssal cowl masking mortal features. Part of Duskveil Shadow Reaver set (+3 Power, +2 Tempo).',
  },
  duskveil_assassin_garb: {
    id: 'duskveil_assassin_garb',
    slot: 'body',
    name: 'Duskveil Shadowmail Garb',
    icon: '🧥',
    rarity: 'Continental Set',
    set: 'duskveil_reaver',
    armorDark: '#312e81',
    armorHi: '#7c3aed',
    capeColor: '#581c87',
    stats: { power: 4, tempo: 2 },
    desc: 'Sound-dampening dusk mailcoat. Part of Duskveil Shadow Reaver set (+4 Power, +2 Tempo).',
  },
  duskveil_void_chaps: {
    id: 'duskveil_void_chaps',
    slot: 'legs',
    name: 'Duskveil Void-Stalker Chaps',
    icon: '👖',
    rarity: 'Continental Set',
    set: 'duskveil_reaver',
    stats: { power: 3, tempo: 1 },
    desc: 'Shadow-woven stealth chaps. Part of Duskveil Shadow Reaver set (+3 Power, +1 Tempo).',
  },
  duskveil_twin_daggers: {
    id: 'duskveil_twin_daggers',
    slot: 'weapon',
    name: 'Duskveil Twin Soul Daggers',
    icon: '🗡️',
    rarity: 'Continental Set',
    set: 'duskveil_reaver',
    style: 'scythe',
    bladeColor: '#e879f9',
    hiltColor: '#3b0764',
    stats: { power: 5, tempo: 3 },
    desc: 'Paired serrated void daggers. Part of Duskveil Shadow Reaver set (+5 Power, +3 Tempo).',
  },

  // --- 5. AURELIUS THE SOVEREIGN: APEX TITAN SOVEREIGN SET ---
  crown_of_dawn: {
    id: 'crown_of_dawn',
    slot: 'head',
    name: 'Crown of Dawn',
    icon: '👑',
    rarity: 'Apex Titan Set',
    set: 'aurelius_titan',
    stats: { power: 4, bastion: 4, resonance: 3 },
    desc: 'The ancient radiant diadem of the Empyrean Sovereign (+4 Power, +4 Bastion, +3 Resonance).',
  },
  aurelius_sovereign_plate: {
    id: 'aurelius_sovereign_plate',
    slot: 'body',
    name: 'Aurelius Sovereign Aegis Plate',
    icon: '🛡️',
    rarity: 'Apex Titan Set',
    set: 'aurelius_titan',
    armorDark: '#451a03',
    armorHi: '#fef08a',
    capeColor: '#b45309',
    stats: { bastion: 6, power: 3, resonance: 2 },
    desc: 'Impenetrable starlight aegis plate of Aurelius (+6 Bastion, +3 Power, +2 Resonance).',
  },
  aurelius_starforged_greaves: {
    id: 'aurelius_starforged_greaves',
    slot: 'legs',
    name: 'Starforged Sovereign Greaves',
    icon: '✨',
    rarity: 'Apex Titan Set',
    set: 'aurelius_titan',
    stats: { bastion: 4, power: 2, tempo: 2 },
    desc: 'Celestial sabatons forged in starlight fire (+4 Bastion, +2 Power, +2 Tempo).',
  },
  aurelius_morningstar_blade: {
    id: 'aurelius_morningstar_blade',
    slot: 'weapon',
    name: 'Morning Star Sovereign Blade',
    icon: '⭐',
    rarity: 'Apex Titan Set',
    set: 'aurelius_titan',
    style: 'greatsword',
    bladeColor: '#fef08a',
    hiltColor: '#facc15',
    stats: { power: 7, bastion: 3, resonance: 3 },
    desc: 'The legendary greatsword of the Empyrean Sovereign (+7 Power, +3 Bastion, +3 Resonance).',
  },

  // --- CANONICAL ACCESSORIES (CAPES, AMULETS, RINGS, GLOVES, BOOTS, AMMO) ---
  skillcape_extraction: {
    id: 'skillcape_extraction',
    slot: 'cape',
    name: 'Skillcape of Extraction',
    icon: '🏆',
    rarity: 'Skill Mastery',
    capeColor: '#38bdf8',
    stats: { power: 5, bastion: 5, resonance: 5, tempo: 5 },
    guidePrice: 5000,
    desc: 'Woven from living leyline light. Awarded at Resonance Extraction Level 99 (+5 all stats).',
  },
  skillcape_forging: {
    id: 'skillcape_forging',
    slot: 'cape',
    name: 'Skillcape of Relic-Forging',
    icon: '🏆',
    rarity: 'Skill Mastery',
    capeColor: '#f97316',
    stats: { power: 5, bastion: 5, resonance: 5, tempo: 5 },
    guidePrice: 5000,
    desc: 'Hammered from starlit alloy. Awarded at Relic-Forging Level 99 (+5 all stats).',
  },
  skillcape_binding: {
    id: 'skillcape_binding',
    slot: 'cape',
    name: 'Skillcape of Rite-Binding',
    icon: '🏆',
    rarity: 'Skill Mastery',
    capeColor: '#a855f7',
    stats: { power: 5, bastion: 5, resonance: 5, tempo: 5 },
    guidePrice: 5000,
    desc: 'Inscribed with every canonical rite. Awarded at Rite-Binding Level 99 (+5 all stats).',
  },
  skillcape_weaving: {
    id: 'skillcape_weaving',
    slot: 'cape',
    name: 'Skillcape of Glimmerweaving',
    icon: '🏆',
    rarity: 'Skill Mastery',
    capeColor: '#22c55e',
    stats: { power: 5, bastion: 5, resonance: 5, tempo: 5 },
    guidePrice: 5000,
    desc: 'Spun from aurora-thread and starlight flax. Awarded at Glimmerweaving Level 99 (+5 all stats).',
  },
  skillcape_combat: {
    id: 'skillcape_combat',
    slot: 'cape',
    name: 'Skillcape of Combat Mastery',
    icon: '🏆',
    rarity: 'Skill Mastery',
    capeColor: '#ef4444',
    stats: { power: 5, bastion: 5, resonance: 5, tempo: 5 },
    guidePrice: 5000,
    desc: 'The mantle of a champion who has mastered every weapon. Awarded at Combat Mastery Level 99 (+5 all stats).',
  },
  fire_cape: {
    id: 'fire_cape',
    slot: 'cape',
    name: 'Caldera Inferno Mantle',
    icon: '🌋',
    rarity: 'Caldera Relic',
    stats: { power: 3, bastion: 2, tempo: 1 },
    desc: 'Flowing animated magma mantle awarded for braving the Continental Caldera (+3 Power, +2 Bastion, +1 Tempo).',
  },
  radiant_cape: {
    id: 'radiant_cape',
    slot: 'cape',
    name: 'Solari Radiant Cloak',
    icon: '🧣',
    rarity: 'Uncommon',
    stats: { bastion: 1, tempo: 1 },
    desc: 'Golden-trimmed linen mantle (+1 Bastion, +1 Tempo).',
  },
  abyssal_cloak: {
    id: 'abyssal_cloak',
    slot: 'cape',
    name: 'Abyssal Void Shroud',
    icon: '🌑',
    rarity: 'Rare',
    stats: { power: 2, tempo: 1 },
    desc: 'Tattered void mantle (+2 Power, +1 Tempo).',
  },
  amulet_of_fury: {
    id: 'amulet_of_fury',
    slot: 'neck',
    name: 'Amulet of Solar Fury',
    icon: '📿',
    rarity: 'Legendary Onyx',
    stats: { power: 3, bastion: 3, resonance: 3, tempo: 2 },
    desc: 'Dark solar talisman imbued with supreme combat fury (+3 All Stats, +2 Tempo).',
  },
  amulet_of_glory: {
    id: 'amulet_of_glory',
    slot: 'neck',
    name: 'Amulet of Radiant Glory',
    icon: '🏅',
    rarity: 'Rare Dragonstone',
    stats: { power: 2, bastion: 1, tempo: 1 },
    desc: 'Radiant sunstone pendant radiating heroic confidence (+2 Power, +1 Bastion, +1 Tempo).',
  },
  celestial_talisman: {
    id: 'celestial_talisman',
    slot: 'neck',
    name: 'Empyrean Starlight Choker',
    icon: '💠',
    rarity: 'Epic',
    stats: { resonance: 3, bastion: 2 },
    desc: 'Astral jewel channeling celestial harmony (+3 Resonance, +2 Bastion).',
  },
  barrows_gloves: {
    id: 'barrows_gloves',
    slot: 'hands',
    name: 'Continental Paragon Vambraces',
    icon: '🧤',
    rarity: 'Continental Relic',
    stats: { power: 3, bastion: 3, resonance: 2 },
    desc: 'Masterwork battle gauntlets forged by the Continental High Council for paragon slayers (+3 Power, +3 Bastion, +2 Resonance).',
  },
  vanguard_gauntlets: {
    id: 'vanguard_gauntlets',
    slot: 'hands',
    name: 'Vanguard Battle Grips',
    icon: '🥊',
    rarity: 'Uncommon',
    stats: { bastion: 2, power: 1 },
    desc: 'Sturdy steel gauntlets (+2 Bastion, +1 Power).',
  },
  boots_of_haste: {
    id: 'boots_of_haste',
    slot: 'feet',
    name: 'Boots of Starlight Haste',
    icon: '👢',
    rarity: 'Uncommon',
    stats: { tempo: 3, bastion: 1 },
    desc: 'Lightweight swift boots (+3 Tempo, +1 Bastion).',
  },
  granite_boots: {
    id: 'granite_boots',
    slot: 'feet',
    name: 'Heavy Granite Sabatons',
    icon: '🥾',
    rarity: 'Rare',
    stats: { bastion: 4 },
    desc: 'Dense granite greaves with immense stability (+4 Bastion).',
  },
  ring_of_the_sun: {
    id: 'ring_of_the_sun',
    slot: 'ring',
    name: 'Band of the Noon Sun',
    icon: '💍',
    rarity: 'Rare',
    stats: { power: 2 },
    desc: 'Golden band pulsing with radiant fury (+2 Power).',
  },
  ring_of_void_leech: {
    id: 'ring_of_void_leech',
    slot: 'ring',
    name: 'Abyssal Leech Ring',
    icon: '🔮',
    rarity: 'Rare',
    stats: { power: 1, tempo: 2 },
    desc: 'Dark void ring siphoning lifeforce (+1 Power, +2 Tempo).',
  },
  ring_of_stone: {
    id: 'ring_of_stone',
    slot: 'ring',
    name: 'Onyx Ring of Stone',
    icon: '💎',
    rarity: 'Rare',
    stats: { bastion: 3 },
    desc: 'Dense stone ring anchoring the soul (+3 Bastion).',
  },
  chronocore_prism: {
    id: 'chronocore_prism',
    slot: 'ammo',
    name: 'Chronocore Prism Relic',
    icon: '💎',
    rarity: 'Aether Relic',
    stats: { resonance: 2, tempo: 1 },
    desc: 'Equipped in Ammo/Relic slot. Flashes grant +6 Glimmer (+2 Resonance, +1 Tempo).',
  },
  radiant_shield_relic: {
    id: 'radiant_shield_relic',
    slot: 'ammo',
    name: 'Radiant Shield Relic',
    icon: '☀️',
    rarity: 'Solari Relic',
    stats: { bastion: 2, power: 1 },
    desc: 'Equipped in Ammo/Relic slot. Boosts guard absorption (+2 Bastion, +1 Power).',
  },
  crown_of_noon: {
    id: 'crown_of_noon',
    slot: 'ammo',
    name: 'Crown of Noon Relic',
    icon: '👑',
    rarity: 'Mythic Relic',
    stats: { power: 3, resonance: 1 },
    desc: 'Equipped in Ammo/Relic slot. Increases critical strike damage (+3 Power, +1 Resonance).',
  },

  // --- STACKABLE CONTINENTAL CURRENCIES ---
  solar_gold: {
    id: 'solar_gold',
    slot: 'currency',
    name: 'Solar Gold Sovereign',
    icon: '🪙',
    rarity: 'Common Currency',
    stackable: true,
    desc: 'Standard minted gold sovereign of the Continental Realm, accepted across all four factions and the AetherSwap Market.',
  },
  glimmer_shard: {
    id: 'glimmer_shard',
    slot: 'currency',
    name: 'Crystalline Glimmer Shard',
    icon: '💎',
    rarity: 'Elemental Currency',
    stackable: true,
    desc: 'Pulsing crystal facet of raw continental glimmer, valued by spellcasters and AetherSwap traders.',
  },
  chrono_gem: {
    id: 'chrono_gem',
    slot: 'currency',
    name: 'Astral Chrono-Gem',
    icon: '🔮',
    rarity: 'Aether Currency',
    stackable: true,
    desc: 'Pulsing violet temporal gem prized by the Aether Astral Enclave for temporal tuning and AetherSwap deals.',
  },
  verdant_amber: {
    id: 'verdant_amber',
    slot: 'currency',
    name: 'Verdant Ironwood Amber',
    icon: '🌿',
    rarity: 'Terra Currency',
    stackable: true,
    desc: 'Fragrant resin fossilized from ancient ironwood boughs, used for herbal alchemy and nature barter.',
  },
  void_essence: {
    id: 'void_essence',
    slot: 'currency',
    name: 'Abyssal Void Essence',
    icon: '🌑',
    rarity: 'Umbri Currency',
    stackable: true,
    desc: 'Condensed shadow matter harvested from banished void stalkers, highly sought after in the Umbri Undercity.',
  },

  // --- STACKABLE CONSUMABLES ---
  minor_healing_salve: {
    id: 'minor_healing_salve',
    slot: 'consumable',
    name: 'Minor Vitality Salve',
    icon: '🧪',
    rarity: 'Common',
    stackable: true,
    healHp: 35,
    desc: 'A soothing herbal balm brewed from dawn petals. Restores +35 Health when consumed.',
  },
  glimmer_draught: {
    id: 'glimmer_draught',
    slot: 'consumable',
    name: 'Leyline Glimmer Draught',
    icon: '⚗️',
    rarity: 'Common',
    stackable: true,
    restoreGlimmer: 40,
    desc: 'An effervescent distilled glimmer tonic. Restores +40 Glimmer charge when consumed.',
  },
  major_vitality_elixir: {
    id: 'major_vitality_elixir',
    slot: 'consumable',
    name: 'Greater Vitality Elixir',
    icon: '🍷',
    rarity: 'Uncommon',
    stackable: true,
    healHp: 80,
    desc: 'A concentrated potion distilled with glowing mountain flora. Restores +80 Health when consumed.',
  },
  sweet_apple: {
    id: 'sweet_apple',
    slot: 'consumable',
    name: 'Orchard Crisp Apple',
    icon: '🍎',
    rarity: 'Common',
    stackable: true,
    healHp: 15,
    desc: 'A freshly picked juicy red apple from the Sanctuary groves. Restores +15 Health when eaten.',
  },
  fresh_crusty_bread: {
    id: 'fresh_crusty_bread',
    slot: 'consumable',
    name: 'Hearth Baked Bread',
    icon: '🍞',
    rarity: 'Common',
    stackable: true,
    healHp: 25,
    desc: 'A warm crusty loaf baked from sun-ripened wheat. Restores +25 Health when eaten.',
  },
  field_rations: {
    id: 'field_rations',
    slot: 'consumable',
    name: 'Continental Trail Rations',
    icon: '🥩',
    rarity: 'Common',
    stackable: true,
    healHp: 35,
    desc: 'Smoked jerky strips, dried fruits, and trail nuts. Restores +35 Health when eaten.',
  },

  // --- STACKABLE CRAFTING & SMITHING MATERIALS ---
  iron_ore: {
    id: 'iron_ore',
    slot: 'material',
    name: 'Raw Iron Ore',
    icon: '🪨',
    rarity: 'Common',
    stackable: true,
    desc: 'Dense quarried iron rock laden with metallic ore, ready for furnace smelting and smithing.',
  },
  bronze_bar: {
    id: 'bronze_bar',
    slot: 'material',
    name: 'Refined Bronze Bar',
    icon: '🧱',
    rarity: 'Common',
    stackable: true,
    desc: 'A smelted bar of bronze alloy, the foundation of durable blades, shields, and armor.',
  },
  ancient_relic_fragment: {
    id: 'ancient_relic_fragment',
    slot: 'material',
    name: 'Ancient Relic Fragment',
    icon: '🏺',
    rarity: 'Uncommon',
    stackable: true,
    desc: 'A carved stone facet recovered from First Nexus ruins, humming with ancient leyline energy.',
  },

  // --- BEGINNER & INTERMEDIATE PIXELATED GEAR ---
  iron_broadsword: {
    id: 'iron_broadsword',
    slot: 'weapon',
    name: 'Iron Broadsword',
    icon: '🗡️',
    rarity: 'Common',
    stats: { power: 2 },
    style: 'sword',
    bladeColor: '#94a3b8',
    hiltColor: '#475569',
    desc: 'Standard forged iron blade carried by Sanctuary recruits (+2 Power).',
  },
  novice_oak_staff: {
    id: 'novice_oak_staff',
    slot: 'weapon',
    name: 'Novice Oak Staff',
    icon: '🪄',
    rarity: 'Common',
    stats: { resonance: 2 },
    style: 'staff',
    bladeColor: '#38bdf8',
    hiltColor: '#78350f',
    desc: 'Carved oak staff channeling basic leylines (+2 Resonance).',
  },
  scout_leather_tunic: {
    id: 'scout_leather_tunic',
    slot: 'body',
    name: 'Scout Leather Tunic',
    icon: '🥋',
    rarity: 'Common',
    stats: { bastion: 2 },
    armorDark: '#451a03',
    armorHi: '#92400e',
    desc: 'Supple boiled leather jerkin (+2 Bastion).',
  },
  scout_leather_leggings: {
    id: 'scout_leather_leggings',
    slot: 'legs',
    name: 'Scout Leather Leggings',
    icon: '👖',
    rarity: 'Common',
    stats: { bastion: 1, tempo: 1 },
    desc: 'Fitted leather trousers with reinforced kneepads (+1 Bastion, +1 Tempo).',
  },
  iron_heater_shield: {
    id: 'iron_heater_shield',
    slot: 'shield',
    name: 'Iron Heater Shield',
    icon: '🛡️',
    rarity: 'Common',
    stats: { bastion: 2 },
    desc: 'Traditional triangular shield with iron rim (+2 Bastion).',
  },
  apprentice_focus_orb: {
    id: 'apprentice_focus_orb',
    slot: 'shield',
    name: 'Apprentice Focus Orb',
    icon: '🔮',
    rarity: 'Common',
    stats: { resonance: 2 },
    desc: 'Pulsing arcane orb held in the off-hand (+2 Resonance).',
  },
  linen_traveller_cloak: {
    id: 'linen_traveller_cloak',
    slot: 'cape',
    name: 'Linen Traveller Cloak',
    icon: '🧣',
    rarity: 'Common',
    stats: { tempo: 1 },
    desc: 'Simple weathered wool cape shielding from wind (+1 Tempo).',
  },
  copper_ring: {
    id: 'copper_ring',
    slot: 'ring',
    name: 'Carved Copper Ring',
    icon: '💍',
    rarity: 'Common',
    stats: { power: 1 },
    desc: 'Simple copper band etched with beginner runes (+1 Power).',
  },

  // --- COSMIC ORES, MINERALS & SMELTED INGOTS ---
  sun_copper_ore: {
    id: 'sun_copper_ore',
    slot: 'material',
    name: 'Sun-Copper Ore',
    icon: '🟠',
    rarity: 'Common',
    guidePrice: 6,
    desc: 'Warm reddish-gold ore mined from Sanctuary and Solari mineral seams. Alloy with Star-Tin at a Cosmic Star-Anvil.',
  },
  star_tin_mineral: {
    id: 'star_tin_mineral',
    slot: 'material',
    name: 'Star-Tin Mineral',
    icon: '⚪',
    rarity: 'Common',
    guidePrice: 6,
    desc: 'Silvery crystalline mineral flecked with starlight. Combine with Sun-Copper Ore to smelt Refined Bronze Bars.',
  },
  umbral_coal: {
    id: 'umbral_coal',
    slot: 'material',
    name: 'Umbral Shadow-Coal',
    icon: '⚫',
    rarity: 'Uncommon',
    guidePrice: 14,
    desc: 'Dense dark fuel quarried from deep fissures that burns at astral temperatures for Steel and Mithril smelting.',
  },
  astral_mineral_dust: {
    id: 'astral_mineral_dust',
    slot: 'material',
    name: 'Astral Mineral Flux',
    icon: '✨',
    rarity: 'Uncommon',
    guidePrice: 12,
    desc: 'Iridescent leyline mineral dust sifted from Glimmer Fonts and meteorite veins, used to catalyze cosmic alloys.',
  },
  mithril_astral_ore: {
    id: 'mithril_astral_ore',
    slot: 'material',
    name: 'Astral Mithril Ore',
    icon: '🔷',
    rarity: 'Rare',
    guidePrice: 28,
    desc: 'Deep cobalt ore resonating with Mirrorgate and Starfall leylines (Lv. 25 Resonance Extraction).',
  },
  adamant_terra_ore: {
    id: 'adamant_terra_ore',
    slot: 'material',
    name: 'Terra Adamantite Ore',
    icon: '🟢',
    rarity: 'Rare',
    guidePrice: 46,
    desc: 'Unyielding emerald-veined stone harvested from high-pressure tectonic craters (Lv. 45 Resonance Extraction).',
  },
  celestial_runite_ore: {
    id: 'celestial_runite_ore',
    slot: 'material',
    name: 'Celestial Starmetal Ore',
    icon: '💠',
    rarity: 'Epic',
    guidePrice: 85,
    desc: 'Mythic cyan-violet meteorite ore fallen from the Empyrean Summit and Abyssal Rift (Lv. 60 Resonance Extraction).',
  },
  star_iron_bar: {
    id: 'star_iron_bar',
    slot: 'material',
    name: 'Star-Iron Ingot',
    icon: '🔩',
    rarity: 'Uncommon',
    guidePrice: 24,
    desc: 'Refined iron alloyed with Astral Mineral Flux at a Cosmic Star-Anvil.',
  },
  umbral_steel_bar: {
    id: 'umbral_steel_bar',
    slot: 'material',
    name: 'Umbral Steel Ingot',
    icon: '⬛',
    rarity: 'Uncommon',
    guidePrice: 42,
    desc: 'High-carbon shadow steel folded over Umbral Coal flames.',
  },
  astral_mithril_bar: {
    id: 'astral_mithril_bar',
    slot: 'material',
    name: 'Astral Mithril Ingot',
    icon: '🟦',
    rarity: 'Rare',
    guidePrice: 75,
    desc: 'Featherlight cobalt ingot humming with concentrated leyline power.',
  },
  prismatic_adamant_bar: {
    id: 'prismatic_adamant_bar',
    slot: 'material',
    name: 'Prismatic Adamant Ingot',
    icon: '🟩',
    rarity: 'Epic',
    guidePrice: 120,
    desc: 'Virtually indestructible emerald-gold alloy forged for masterwork bulwarks.',
  },
  celestial_starmetal_bar: {
    id: 'celestial_starmetal_bar',
    slot: 'material',
    name: 'Celestial Starmetal Ingot',
    icon: '💎',
    rarity: 'Legendary',
    guidePrice: 210,
    desc: 'Radiant starmetal bar singing with the harmony of the Cosmic Forge.',
  },

  // --- BOTANICAL HERBS & LUMINESCENT FIBERS ---
  sunbloom_herb: {
    id: 'sunbloom_herb',
    slot: 'material',
    name: 'Sunbloom Petal',
    icon: '🌼',
    rarity: 'Common',
    guidePrice: 7,
    desc: 'Golden medicinal blossom gathered from Sanctuary and Orchard herb clusters for Rite-Binding salves.',
  },
  gloomcap_spore: {
    id: 'gloomcap_spore',
    slot: 'material',
    name: 'Gloomcap Spore-Cluster',
    icon: '🍄',
    rarity: 'Uncommon',
    guidePrice: 18,
    desc: 'Bioluminescent violet mushroom cap thriving in Duskveil bogs and ancient ruins.',
  },
  chrono_lotus: {
    id: 'chrono_lotus',
    slot: 'material',
    name: 'Chrono-Lotus Blossom',
    icon: '🪷',
    rarity: 'Rare',
    guidePrice: 38,
    desc: 'Time-dewed crystalline flower blooming near Mirrorgate and Starfall fissures.',
  },
  empyrean_starleaf: {
    id: 'empyrean_starleaf',
    slot: 'material',
    name: 'Empyrean Starleaf',
    icon: '🌟',
    rarity: 'Epic',
    guidePrice: 78,
    desc: 'Sovereign astral herb found only in the Abyssal Rift and Celestial Ascent.',
  },
  starlight_flax: {
    id: 'starlight_flax',
    slot: 'material',
    name: 'Starlight Flax Fiber',
    icon: '🌾',
    rarity: 'Common',
    guidePrice: 7,
    desc: 'Silky silver-gold plant fiber spun at the Celestial Loom into cloaks and tunics.',
  },
  shadow_silk: {
    id: 'shadow_silk',
    slot: 'material',
    name: 'Duskveil Shadow-Silk',
    icon: '🕸️',
    rarity: 'Uncommon',
    guidePrice: 22,
    desc: 'Supple twilight gossamer harvested from Gloam-Widows and Duskveil blooms.',
  },
  celestial_gossamer: {
    id: 'celestial_gossamer',
    slot: 'material',
    name: 'Celestial Gossamer Thread',
    icon: '🧶',
    rarity: 'Epic',
    guidePrice: 72,
    desc: 'Pure starlight filament woven into legendary vestments on the Celestial Loom.',
  },

  // --- LEYLINE SOCKET GEMS (DAY 4 SOCKET SYSTEM) ---
  gem_solar_ruby: {
    id: 'gem_solar_ruby',
    slot: 'socket_gem',
    name: 'Cut Solar Ruby',
    icon: '♦️',
    rarity: 'Rare Gem',
    guidePrice: 140,
    stats: { power: 3 },
    desc: 'Leyline Relic Gem — Socket into Helm, Chest, or Weapon for +3 Power.',
  },
  gem_void_sapphire: {
    id: 'gem_void_sapphire',
    slot: 'socket_gem',
    name: 'Cut Void Sapphire',
    icon: '🔷',
    rarity: 'Rare Gem',
    guidePrice: 155,
    stats: { tempo: 3, power: 1 },
    desc: 'Leyline Relic Gem — Socket into Helm, Chest, or Weapon for +3 Tempo & +1 Power.',
  },
  gem_terra_emerald: {
    id: 'gem_terra_emerald',
    slot: 'socket_gem',
    name: 'Cut Terra Emerald',
    icon: '💚',
    rarity: 'Epic Gem',
    guidePrice: 195,
    stats: { bastion: 4, maxHp: 18 },
    desc: 'Leyline Relic Gem — Socket into Helm, Chest, or Weapon for +4 Bastion & +18 Max Health.',
  },
  gem_aether_diamond: {
    id: 'gem_aether_diamond',
    slot: 'socket_gem',
    name: 'Cut Aether Star-Diamond',
    icon: '💠',
    rarity: 'Epic Gem',
    guidePrice: 220,
    stats: { resonance: 4, maxGlimmer: 20 },
    desc: 'Leyline Relic Gem — Socket into Helm, Chest, or Weapon for +4 Resonance & +20 Max Glimmer.',
  },

  // --- ARTISAN CONSUMABLES & FEASTS ---
  spiced_orchard_pie: {
    id: 'spiced_orchard_pie',
    slot: 'consumable',
    name: 'Spiced Orchard Apple Pie',
    icon: '🥧',
    rarity: 'Uncommon',
    guidePrice: 28,
    healHp: 50,
    desc: 'Golden-baked orchard pastry infused with Sunbloom spice. Restores +50 Health when eaten.',
  },
  astral_battle_tonic: {
    id: 'astral_battle_tonic',
    slot: 'consumable',
    name: 'Astral Battle Tonic',
    icon: '🧪',
    rarity: 'Rare',
    guidePrice: 55,
    healHp: 65,
    restoreGlimmer: 50,
    desc: 'Dual-phase alchemical brew distilled in the Aetherial Crucible. Restores +65 Health & +50 Glimmer.',
  },
  chrono_overdrive_draught: {
    id: 'chrono_overdrive_draught',
    slot: 'consumable',
    name: 'Chrono-Overdrive Draught',
    icon: '⚗️',
    rarity: 'Epic',
    guidePrice: 95,
    healHp: 115,
    restoreGlimmer: 75,
    desc: 'Concentrated Chrono-Lotus elixir surging through the leylines. Restores +115 Health & +75 Glimmer.',
  },
  starfire_banquet_feast: {
    id: 'starfire_banquet_feast',
    slot: 'consumable',
    name: 'Starfire Banquet Roast',
    icon: '🍖',
    rarity: 'Epic',
    guidePrice: 110,
    healHp: 165,
    restoreGlimmer: 60,
    desc: 'Hearty gourmet feast woven with luminous herbs. Restores +165 Health & +60 Glimmer.',
  },
  empyrean_nectar: {
    id: 'empyrean_nectar',
    slot: 'consumable',
    name: 'Empyrean Starleaf Nectar',
    icon: '🏆',
    rarity: 'Legendary',
    guidePrice: 180,
    healHp: 220,
    restoreGlimmer: 100,
    desc: 'Supreme ambrosia of the Celestial Summit. Restores +220 Health & +100 Glimmer.',
  },

  // --- ARTISAN FORGED, WOVEN & LATE-GAME BOSS EQUIPMENT ---
  star_iron_scimitar: {
    id: 'star_iron_scimitar',
    slot: 'weapon',
    name: 'Star-Iron Scimitar',
    icon: '⚔️',
    rarity: 'Uncommon',
    guidePrice: 85,
    stats: { power: 4, tempo: 1 },
    style: 'sword',
    bladeColor: '#bae6fd',
    hiltColor: '#f59e0b',
    desc: 'Curved Star-Iron blade forged on the Cosmic Star-Anvil (+4 Power, +1 Tempo).',
  },
  umbral_steel_platebody: {
    id: 'umbral_steel_platebody',
    slot: 'body',
    name: 'Umbral Steel Cuirass',
    icon: '🛡️',
    rarity: 'Rare',
    guidePrice: 150,
    stats: { bastion: 5, power: 2 },
    armorDark: '#1e1b4b',
    armorHi: '#6366f1',
    desc: 'Tempered shadow-steel breastplate etched with ward-sigils (+5 Bastion, +2 Power).',
  },
  astral_mithril_greatsword: {
    id: 'astral_mithril_greatsword',
    slot: 'weapon',
    name: 'Astral Mithril Greatsword',
    icon: '🗡️',
    rarity: 'Rare',
    guidePrice: 240,
    stats: { power: 6, resonance: 3 },
    style: 'greatsword',
    bladeColor: '#38bdf8',
    hiltColor: '#1d4ed8',
    desc: 'Resonant cobalt two-hander forged from Starfall Mithril (+6 Power, +3 Resonance).',
  },
  adamant_bulwark_shield: {
    id: 'adamant_bulwark_shield',
    slot: 'shield',
    name: 'Prismatic Adamant Bulwark',
    icon: '🛡️',
    rarity: 'Epic',
    guidePrice: 340,
    stats: { bastion: 7, resonance: 2 },
    desc: 'Towering emerald-gold greatshield forged from Prismatic Adamant (+7 Bastion, +2 Resonance).',
  },
  starmetal_cosmos_blade: {
    id: 'starmetal_cosmos_blade',
    slot: 'weapon',
    name: 'Cosmos Starmetal Blade',
    icon: '✨',
    rarity: 'Legendary',
    guidePrice: 680,
    stats: { power: 9, resonance: 4, tempo: 3 },
    style: 'greatsword',
    bladeColor: '#e879f9',
    hiltColor: '#38bdf8',
    desc: 'Masterwork Relic-Forging blade singing with celestial starfire (+9 Power, +4 Resonance, +3 Tempo).',
  },
  starmetal_cosmos_plate: {
    id: 'starmetal_cosmos_plate',
    slot: 'body',
    name: 'Cosmos Starmetal Harness',
    icon: '👑',
    rarity: 'Legendary',
    guidePrice: 740,
    stats: { bastion: 9, power: 4, resonance: 3 },
    armorDark: '#1e1b4b',
    armorHi: '#38bdf8',
    desc: 'Masterwork Celestial Starmetal armor forged on the Cosmic Star-Anvil (+9 Bastion, +4 Power, +3 Resonance).',
  },
  duskveil_silk_mantle: {
    id: 'duskveil_silk_mantle',
    slot: 'cape',
    name: 'Duskveil Shadow-Silk Mantle',
    icon: '🧣',
    rarity: 'Rare',
    guidePrice: 145,
    stats: { tempo: 3, power: 2 },
    capeColor: '#6d28d9',
    desc: 'Whisper-light cloak tailored from Duskveil Shadow-Silk (+3 Tempo, +2 Power).',
  },
  mystic_leystrand_robes: {
    id: 'mystic_leystrand_robes',
    slot: 'body',
    name: 'Mystic Leystrand Vestments',
    icon: '👘',
    rarity: 'Rare',
    guidePrice: 235,
    stats: { resonance: 5, tempo: 3, bastion: 2 },
    armorDark: '#0f172a',
    armorHi: '#2dd4bf',
    desc: 'Luminous spellweaver robes tailored on the Celestial Loom (+5 Resonance, +3 Tempo, +2 Bastion).',
  },
  celestial_gossamer_cloak: {
    id: 'celestial_gossamer_cloak',
    slot: 'cape',
    name: 'Celestial Gossamer Mantle',
    icon: '🌌',
    rarity: 'Legendary',
    guidePrice: 620,
    stats: { resonance: 5, tempo: 5, bastion: 3 },
    capeColor: '#38bdf8',
    desc: 'Woven from pure starlight filaments on the Celestial Loom (+5 Resonance, +5 Tempo, +3 Bastion).',
  },
  starmetal_meteor_hammer: {
    id: 'starmetal_meteor_hammer',
    slot: 'weapon',
    name: 'Ignis-Core Meteor Maul',
    icon: '☄️',
    rarity: 'Epic Boss Relic',
    guidePrice: 460,
    stats: { power: 8, bastion: 4 },
    style: 'greatsword',
    bladeColor: '#fb923c',
    hiltColor: '#7c2d12',
    desc: 'Trophy of Ignis-Core, the Fallen Star Construct in Starfall Crater (+8 Power, +4 Bastion).',
  },
  abyssal_voidstar_scythe: {
    id: 'abyssal_voidstar_scythe',
    slot: 'weapon',
    name: 'Xal\'Korath Voidstar Reaver',
    icon: '🌙',
    rarity: 'Mythic Boss Relic',
    guidePrice: 880,
    stats: { power: 10, tempo: 4, resonance: 4 },
    style: 'greatsword',
    bladeColor: '#c084fc',
    hiltColor: '#0f172a',
    desc: 'Apex dimensional weapon dropped by Xal\'Korath the Rift-Weaver in the Abyssal Rift (+10 Power, +4 Tempo, +4 Resonance).',
  },
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

// Complete Authentic GlimmerFall TCG Rites & Flashes Catalog (All 4 Factions)
export const ABILITIES_CATALOG = {
  // === SOLARI ===
  flare_strike: {
    id: 'flare_strike', faction: 'Solari', name: 'Flare Strike', short: 'Flare',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '⚔️', kind: 'melee_cleave', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0.85, castTime: 0, color: '#facc15',
    desc: 'Radiant cleave dealing (4-7 + Power + 2×Rank) DMG & generating Glimmer.',
    lore: 'AWK #11: "A beacon of unwavering light against the encroaching shadow."',
  },
  radiant_bulwark: {
    id: 'radiant_bulwark', faction: 'Solari', name: 'Radiant Bulwark', short: 'Bulwark',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'flare_strike',
    icon: '🛡️', kind: 'shield', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#38bdf8',
    desc: 'Summons starlight Guard shields absorbing (14 + 3×Bastion + 4×Rank) DMG.',
    lore: 'AWK: "Prevent incoming damage to your Guardian and friendly units."',
  },
  solar_intervene: {
    id: 'solar_intervene', faction: 'Solari', name: 'Solar Intervene', short: 'Intervene',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'radiant_bulwark',
    icon: '⚡', kind: 'dash', range: '8.0y Flash', rangeYards: 8.0,
    cost: 0, baseCd: 5.0, castTime: 0, color: '#fde047',
    desc: 'Instant 8y radiant flash leap granting +15 Glimmer and a momentary barrier.',
    lore: 'AWK: "Cross the battlefield in the beat of a solar pulse."',
  },
  blinding_radiance: {
    id: 'blinding_radiance', faction: 'Solari', name: 'Blinding Radiance', short: 'Blind',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'solar_intervene',
    icon: '💨', kind: 'dash', range: '8.5y Dash', rangeYards: 8.5,
    cost: 0, baseCd: 4.0, castTime: 0, color: '#bae6fd',
    desc: 'Flash-dashes 8.5y in starlight & blinds nearby foes (-2 ATK for 5s).',
    lore: 'AWK #2: "Blinding Radiance brings order to chaos."',
  },
  sun_aegis_rebuke: {
    id: 'sun_aegis_rebuke', faction: 'Solari', name: 'Sun Aegis Rebuke', short: 'Rebuke',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'blinding_radiance',
    icon: '☀️', kind: 'reactive_barrier', range: 'Self/Aura', rangeYards: 6,
    cost: 0, baseCd: 8.0, castTime: 0, color: '#facc15',
    desc: 'Reactive solar flash: absorbs damage, reflects 40% back & blinds attackers for 4s!',
    lore: 'AWK: "Those who strike the sun are blinded by its light."',
  },
  aurora_stride: {
    id: 'aurora_stride', faction: 'Solari', name: 'Aurora Stride', short: 'Stride',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'sun_aegis_rebuke',
    icon: '✨', kind: 'cleanse_sprint', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 6.5, castTime: 0, color: '#fef08a',
    desc: 'Instant celestial stride: +50% movement speed for 4s, breaks all snares and cleanses debuffs!',
    lore: 'AWK: "Run across the dawn, untouched by worldly chains."',
  },
  solar_ascension: {
    id: 'solar_ascension', faction: 'Solari', name: 'Solar Ascension', short: 'Ascend',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'aurora_stride',
    icon: '👑', kind: 'archon_form', range: 'Self/Aura', rangeYards: 12,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#fde047',
    desc: 'Apex Archon Avatar: for 8s, resets all Flash cooldowns and pulses continuous Holy Radiance (12y)!',
    lore: 'AWK #1: "The Champion transcends mortal form, embodying the immortal Sun itself."',
  },
  solar_flare: {
    id: 'solar_flare', faction: 'Solari', name: 'Solar Flare', short: 'Solar',
    tcgType: 'Solari Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: null,
    icon: '☀️', kind: 'cast_beam', range: '25y', rangeYards: 25,
    cost: 25, baseCd: 3.5, castTime: 1.0, color: '#fbbf24',
    desc: '1.0s sun-pillar Rite dealing (11-15 + 2×Power + 3×Rank) CRIT DMG + splash.',
    lore: 'AWK #12: "The unbridled fury of the sun, reduced to a single blinding flash."',
  },
  judgement_of_the_sun: {
    id: 'judgement_of_the_sun', faction: 'Solari', name: 'Judgement of the Sun', short: 'Judge',
    tcgType: 'Solari Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'solar_flare',
    icon: '🔨', kind: 'projectile', projType: 'hammer', range: '20y', rangeYards: 20,
    cost: 0, baseCd: 4.5, castTime: 0.85, color: '#facc15',
    desc: 'Hurls a solar hammer for (7-10 + Power + 2×Rank) DMG (+25 bonus Glimmer on kill!).',
    lore: 'AWK: "Deal damage to target enemy. If it dies, gain bonus Solar Energy."',
  },
  blessing_of_dawn: {
    id: 'blessing_of_dawn', faction: 'Solari', name: 'Blessing of Dawn', short: 'Bless',
    tcgType: 'Solari Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: null,
    icon: '✨', kind: 'heal', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 6.0, castTime: 0.9, color: '#4ade80',
    desc: 'Restores (8 + 2×Bastion + 3×Rank) HP to you and nearby squadmates.',
    lore: 'AWK: "Give target friendly entity vitality and restore Health."',
  },
  consecrated_ground: {
    id: 'consecrated_ground', faction: 'Solari', name: 'Consecrated Ground', short: 'Ground',
    tcgType: 'Solari Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'judgement_of_the_sun',
    icon: '🔥', kind: 'ground_zone', zoneType: 'consecration', range: '7.5y AoE', rangeYards: 7.5,
    cost: 0, baseCd: 8.0, castTime: 1.0, color: '#fb923c',
    desc: 'Sanctifies ground for 6s: burns foes & grants +2 Power to allies inside.',
    lore: 'AWK: "Friendly entities gain Power; enemies take damage each turn."',
  },
  decree_of_the_sun: {
    id: 'decree_of_the_sun', faction: 'Solari', name: 'Decree of the Sun', short: 'Decree',
    tcgType: 'Solari Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'consecrated_ground',
    icon: '👑', kind: 'nova', range: '12y Edict', rangeYards: 12,
    cost: 20, baseCd: 9.0, castTime: 1.2, color: '#fde047', healNexus: true,
    desc: 'Solar edict scorching foes in 12y & restoring +3 HP to allied Outpost/Sanctuary Nexus!',
    lore: 'AWK: "By sovereign Decree of the Sun, the Citadel stands unbroken."',
  },
  daybreak: {
    id: 'daybreak', faction: 'Solari', name: 'Daybreak', short: 'Dawn',
    tcgType: 'Solari Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'blessing_of_dawn',
    icon: '🌅', kind: 'heal_glimmer', range: 'Self/Squad', rangeYards: 14,
    cost: 0, baseCd: 8.5, castTime: 1.1, color: '#fef08a',
    desc: 'Restores HP, grants +25 Glimmer, and cleanses all slows/weakness.',
    lore: 'AWK: "When Daybreak crests the spire, every shadow retreats."',
  },
  wrath_of_the_daystar: {
    id: 'wrath_of_the_daystar', faction: 'Solari', name: 'Wrath of the Daystar', short: 'Daystar',
    tcgType: 'Solari Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'decree_of_the_sun',
    icon: '⚡', kind: 'nova', range: '14y Nova', rangeYards: 14,
    cost: 30, baseCd: 11.0, castTime: 1.4, color: '#fde047',
    desc: 'Spends 30 Glimmer for a 14y solar nova dealing heavy CRIT DMG & knockback.',
    lore: 'AWK: "Wrath of the Daystar commands sovereign radiance against all foes."',
  },
  corona_cataclysm: {
    id: 'corona_cataclysm', faction: 'Solari', name: 'Corona Cataclysm', short: 'Cataclysm',
    tcgType: 'Solari Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'wrath_of_the_daystar',
    icon: '☀️', kind: 'cast_beam', range: '28y Apex', rangeYards: 28,
    cost: 35, baseCd: 15.0, castTime: 1.6, color: '#fde047',
    desc: 'Apex Solari Rite: summons an orbital solar cataclysm beam dealing catastrophic damage (45+ base) in 16y!',
    lore: 'AWK: "The full majesty of the primordial star descends upon the battlefield."',
  },

  // === UMBRI ===
  whisper_of_the_void: {
    id: 'whisper_of_the_void', faction: 'Umbri', name: 'Whisper of the Void', short: 'Whisper',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '🗡️', kind: 'melee_cleave', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0.8, castTime: 0, color: '#c084fc',
    desc: 'Twin shadow-scythe slash generating Glimmer (+45% CRIT from Stealth!).',
    lore: 'AWK: "A silent cut from the Duskveil dark."',
  },
  graveglass_ward: {
    id: 'graveglass_ward', faction: 'Umbri', name: 'Graveglass Ward', short: 'Ward',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'whisper_of_the_void',
    icon: '🔮', kind: 'shield', range: 'Self/Squad', rangeYards: 10,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#c084fc',
    desc: 'Shrouds you in spectral Graveglass absorbing incoming damage.',
    lore: 'AWK: "Forged from shattered sepulcher crystal."',
  },
  veil_of_dusk: {
    id: 'veil_of_dusk', faction: 'Umbri', name: 'Veil of Dusk', short: 'Stealth',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'graveglass_ward',
    icon: '👤', kind: 'stealth', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 9.0, castTime: 0, color: '#7e22ce',
    desc: 'Vanish into Stealth for 3.5s: mobs drop aggro, +35% speed & Ambush CRIT!',
    lore: 'AWK: "Unseen by sun or star."',
  },
  shadow_step: {
    id: 'shadow_step', faction: 'Umbri', name: 'Shadow Step', short: 'Step',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'veil_of_dusk',
    icon: '🌑', kind: 'shadow_step', range: '16y Blink', rangeYards: 16,
    cost: 0, baseCd: 4.5, castTime: 0, color: '#a855f7',
    desc: 'Teleports through shadow directly behind your target & empowers next strike!',
    lore: 'AWK: "Step into the gloom; emerge behind their heart."',
  },
  abyssal_shroud: {
    id: 'abyssal_shroud', faction: 'Umbri', name: 'Abyssal Shroud', short: 'Shroud',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'shadow_step',
    icon: '🌫️', kind: 'stealth_burst', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 8.0, castTime: 0, color: '#9333ea',
    desc: 'Envelops you in abyssal mist: guarantees 100% Dodge for 2.0s & poisons attackers for 4s!',
    lore: 'AWK: "Strike the mist, and bleed for your presumption."',
  },
  eclipse_reap: {
    id: 'eclipse_reap', faction: 'Umbri', name: 'Eclipse Reap', short: 'Reap',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'abyssal_shroud',
    icon: '⚡', kind: 'dash_cleave', range: '10y Scythe Dash', rangeYards: 10,
    cost: 0, baseCd: 5.5, castTime: 0, color: '#c084fc',
    desc: 'Instant void scythe dash through enemies dealing heavy execution shadow cleave & +18 Glimmer!',
    lore: 'AWK: "Where the scythe passes, only silence remains."',
  },
  avatar_of_the_void: {
    id: 'avatar_of_the_void', faction: 'Umbri', name: 'Avatar of the Void', short: 'Voidform',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'eclipse_reap',
    icon: '👑', kind: 'voidform', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#a855f7',
    desc: 'Apex Void Avatar: for 8s, Life Leech is doubled, movement speed is +40%, and all hits are Critical Strikes!',
    lore: 'AWK #3: "You do not walk with the shadows; you are the abyss itself."',
  },
  soul_tithe: {
    id: 'soul_tithe', faction: 'Umbri', name: 'Soul Tithe', short: 'Tithe',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: null,
    icon: '💀', kind: 'projectile', projType: 'void_orb', range: '22y', rangeYards: 22,
    cost: 0, baseCd: 4.2, castTime: 0.85, color: '#e879f9',
    desc: 'Fires a Void bolt dealing shadow DMG, draining HP & granting +24 Glimmer.',
    lore: 'AWK: "Every soul owes its tithe to the Undercity."',
  },
  siphon_soul: {
    id: 'siphon_soul', faction: 'Umbri', name: 'Siphon Soul', short: 'Siphon',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'soul_tithe',
    icon: '🩸', kind: 'drain_beam', range: '20y', rangeYards: 20,
    cost: 15, baseCd: 5.5, castTime: 1.0, color: '#f43f5e',
    desc: 'Rips vitality from target enemy, healing you for 60% of all DMG dealt!',
    lore: 'AWK: "Drink deep of fading Glimmer."',
  },
  nightfall_plague: {
    id: 'nightfall_plague', faction: 'Umbri', name: 'Nightfall Plague', short: 'Plague',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'siphon_soul',
    icon: '☠️', kind: 'ground_zone', zoneType: 'plague', range: '8y AoE', rangeYards: 8,
    cost: 0, baseCd: 8.5, castTime: 1.1, color: '#9333ea',
    desc: 'Spreads Duskveil miasma for 6s: deals Void DMG/tick & slows enemies by 45%.',
    lore: 'AWK: "Where Nightfall settles, light withers."',
  },
  unmake: {
    id: 'unmake', faction: 'Umbri', name: 'Unmake', short: 'Unmake',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'nightfall_plague',
    icon: '💥', kind: 'execute_beam', range: '22y', rangeYards: 22,
    cost: 25, baseCd: 7.5, castTime: 1.3, color: '#e11d48',
    desc: 'Obliterates target with Void collapse (+50% Execution DMG if target < 50% HP!).',
    lore: 'AWK: "Erase them from the tapestry of reality."',
  },
  eclipse_harvester: {
    id: 'eclipse_harvester', faction: 'Umbri', name: 'Eclipse Harvester', short: 'Harvester',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'unmake',
    icon: '🌑', kind: 'scythe_wave', range: '20y Arc', rangeYards: 20,
    cost: 30, baseCd: 10.5, castTime: 1.4, color: '#9333ea',
    desc: '1.4s Rite hurling a crescent dark-energy wave in a wide 20y arc, dealing massive shadow DMG and draining HP.',
    lore: 'AWK: "When the eclipse falls, harvest the living."',
  },
  void_annihilation: {
    id: 'void_annihilation', faction: 'Umbri', name: 'Void Annihilation', short: 'Annihilate',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'eclipse_harvester',
    icon: '🌌', kind: 'singularity_collapse', range: '24y Singularity', rangeYards: 24,
    cost: 35, baseCd: 16.0, castTime: 1.6, color: '#c084fc',
    desc: 'Apex Umbri Rite: opens a black hole singularity pulling in all enemies within 16y and imploding for catastrophic damage (50+ base)!',
    lore: 'AWK #4: "The final cessation of all light and matter."',
  },

  // === TERRA ===
  tectonic_slam: {
    id: 'tectonic_slam', faction: 'Terra', name: 'Tectonic Slam', short: 'Slam',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '🪨', kind: 'melee_cleave', range: '7y', rangeYards: 7,
    cost: 0, baseCd: 0.9, castTime: 0, color: '#4ade80',
    desc: 'Crushing earth cleave triggering Overwhelm splash & generating Glimmer.',
    lore: 'AWK: "The mountain answers when Rootdeep strikes."',
  },
  barkskin_infusion: {
    id: 'barkskin_infusion', faction: 'Terra', name: 'Barkskin Infusion', short: 'Barkskin',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'tectonic_slam',
    icon: '🛡️', kind: 'thornbark', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#22c55e',
    desc: 'Grants Ironwood Shield + Thornbark (reflects 35% melee DMG back at attackers!).',
    lore: 'AWK: "Ironwood bark turns blade and claw alike."',
  },
  rooted_bastion: {
    id: 'rooted_bastion', faction: 'Terra', name: 'Rooted Bastion', short: 'Bastion',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'barkskin_infusion',
    icon: '🌳', kind: 'iron_fortify', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 8.5, castTime: 0, color: '#15803d',
    desc: 'Roots into deep earth: gains 40% Damage Reduction and Crowd Control immunity for 3.5s!',
    lore: 'AWK: "Deep roots anchor the titan when storms rage."',
  },
  wildshape_surge: {
    id: 'wildshape_surge', faction: 'Terra', name: 'Wildshape Surge', short: 'Surge',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'rooted_bastion',
    icon: '🐾', kind: 'dash', range: '9y Charge', rangeYards: 9,
    cost: 0, baseCd: 4.5, castTime: 0, color: '#86efac',
    desc: 'Primal beast-charge 9y forward, trampling foes & granting +15 Glimmer!',
    lore: 'AWK: "Channel the untamed apex of Rootdeep."',
  },
  bramble_reversal: {
    id: 'bramble_reversal', faction: 'Terra', name: 'Bramble Reversal', short: 'Reversal',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'wildshape_surge',
    icon: '🌿', kind: 'bramble_burst', range: '8y Burst', rangeYards: 8,
    cost: 0, baseCd: 7.5, castTime: 0, color: '#4ade80',
    desc: 'Explosive thorn ring: knocks back surrounding enemies, snares them for 4s & reflects incoming damage!',
    lore: 'AWK: "Push against the bramble, and find yourself pinned."',
  },
  ironwood_colossus: {
    id: 'ironwood_colossus', faction: 'Terra', name: 'Ironwood Colossus', short: 'Colossus',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'bramble_reversal',
    icon: '🪨', kind: 'colossus_stomp', range: '10y Stomp', rangeYards: 10,
    cost: 0, baseCd: 6.0, castTime: 0, color: '#84cc16',
    desc: 'Instant seismic stomp: deals crushing physical damage around player, generates +25 Glimmer & knocks down foes!',
    lore: 'AWK: "When the elder walks, mountains shake."',
  },
  avatar_of_the_ironwood: {
    id: 'avatar_of_the_ironwood', faction: 'Terra', name: 'Avatar of the Ironwood', short: 'Treant',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'ironwood_colossus',
    icon: '👑', kind: 'treant_form', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#22c55e',
    desc: 'Apex Ironwood Avatar: for 8s, gains +250 Shield, Thornbark reflect increased to 60%, and Overwhelm radius +50%!',
    lore: 'AWK #5: "Become the primeval heartwood that weathered the First Fall."',
  },
  ancient_boulder: {
    id: 'ancient_boulder', faction: 'Terra', name: 'Stonekin Boulder', short: 'Boulder',
    tcgType: 'Terra Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: null,
    icon: '☄️', kind: 'projectile', projType: 'boulder', range: '20y', rangeYards: 20,
    cost: 0, baseCd: 4.6, castTime: 0.9, color: '#a3e635',
    desc: 'Hurls a mossy monolith boulder dealing heavy Overwhelm DMG.',
    lore: 'AWK: "Carved from the elder peaks."',
  },
  briar_snare: {
    id: 'briar_snare', faction: 'Terra', name: 'Briar Snare', short: 'Snare',
    tcgType: 'Terra Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'ancient_boulder',
    icon: '🌿', kind: 'ground_zone', zoneType: 'briar', range: '8y Roots', rangeYards: 8,
    cost: 0, baseCd: 8.0, castTime: 1.0, color: '#16a34a',
    desc: 'Entangling roots for 6s: snares enemy movement by 65% & deals thorn DMG!',
    lore: 'AWK: "The Orchard claims trespassers."',
  },
  verdant_renewal: {
    id: 'verdant_renewal', faction: 'Terra', name: 'Verdant Renewal', short: 'Renew',
    tcgType: 'Terra Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: null,
    icon: '🌸', kind: 'heal', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 6.2, castTime: 0.95, color: '#4ade80',
    desc: 'Blooms Glimmer flora restoring (9 + 2×Bastion + 3×Rank) HP to self & squad.',
    lore: 'AWK: "Life springs eternal from ancient roots."',
  },
  overwhelm_roar: {
    id: 'overwhelm_roar', faction: 'Terra', name: 'Primal Overwhelm', short: 'Roar',
    tcgType: 'Terra Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'briar_snare',
    icon: '🦁', kind: 'nova', range: '11y Roar', rangeYards: 11,
    cost: 20, baseCd: 9.0, castTime: 1.1, color: '#bef264',
    desc: 'Thunderous roar damaging & weakening nearby enemies (-2 ATK for 5s).',
    lore: 'AWK: "None stand before the stampede."',
  },
  earthshatter: {
    id: 'earthshatter', faction: 'Terra', name: 'Earthshatter', short: 'Shatter',
    tcgType: 'Terra Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'overwhelm_roar',
    icon: '🌋', kind: 'nova', range: '13y Quake', rangeYards: 13,
    cost: 25, baseCd: 8.5, castTime: 1.3, color: '#84cc16',
    desc: 'Ruptures the earth in 13y for massive Overwhelm CRIT DMG & knockback!',
    lore: 'AWK: "Split stone and scatter their ranks."',
  },
  tectonic_fissure: {
    id: 'tectonic_fissure', faction: 'Terra', name: 'Tectonic Fissure', short: 'Fissure',
    tcgType: 'Terra Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'earthshatter',
    icon: '⛰️', kind: 'fissure_line', range: '18y Line', rangeYards: 18,
    cost: 30, baseCd: 10.5, castTime: 1.4, color: '#65a30d',
    desc: '1.4s Rite cleaving a seismic trench in a line: deals crushing physical damage and leaves rocky spikes that bleed and slow enemies by 50%!',
    lore: 'AWK: "The earth itself tears open, devouring the unyielding."',
  },
  wrath_of_gaia: {
    id: 'wrath_of_gaia', faction: 'Terra', name: 'Wrath of Gaia', short: 'Gaia',
    tcgType: 'Terra Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'tectonic_fissure',
    icon: '🌳', kind: 'continental_quake', range: '16y Cataclysm', rangeYards: 16,
    cost: 35, baseCd: 16.0, castTime: 1.6, color: '#4ade80',
    desc: 'Apex Terra Rite: triggers a continental earthquake in 16y, dealing extreme physical/earth damage (48+ base) and stunning all enemies for 3.0s!',
    lore: 'AWK #6: "Awaken the slumbering mantle; let the ancient earth claim its tithe."',
  },

  // === AETHER ===
  reality_fracture: {
    id: 'reality_fracture', faction: 'Aether', name: 'Reality Fracture', short: 'Fracture',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '💠', kind: 'melee_cleave', range: '7.5y', rangeYards: 7.5,
    cost: 0, baseCd: 0.8, castTime: 0, color: '#38bdf8',
    desc: 'Slices spacetime in a 7.5y arc, generating Astral Glimmer.',
    lore: 'AWK: "Even steel bends when space itself cracks."',
  },
  arcane_bolt: {
    id: 'arcane_bolt', faction: 'Aether', name: 'Temporal Lance', short: 'Lance',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'reality_fracture',
    icon: '🔹', kind: 'projectile', projType: 'aether_orb', range: '24y', rangeYards: 24,
    cost: 0, baseCd: 3.2, castTime: 0, color: '#38bdf8',
    desc: 'Fires an accelerating orb of distorted time dealing Arcane DMG +20 Glimmer.',
    lore: 'AWK: "Strike from three seconds in the future."',
  },
  mirror_barrier: {
    id: 'mirror_barrier', faction: 'Aether', name: 'Mirror Barrier', short: 'Mirror',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'reality_fracture',
    icon: '🪞', kind: 'shield', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.0, castTime: 0, color: '#7dd3fc',
    desc: 'Refractive prism shield absorbing damage for you & nearby squadmates.',
    lore: 'AWK: "Mirrorgate glass bends fury into starlight."',
  },
  chrono_shift: {
    id: 'chrono_shift', faction: 'Aether', name: 'Chrono Shift', short: 'Blink',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'mirror_barrier',
    icon: '⏩', kind: 'dash', range: '9.5y Blink', rangeYards: 9.5,
    cost: 0, baseCd: 3.6, castTime: 0, color: '#7dd3fc',
    desc: 'Instant temporal blink 9.5y leaving time-afterimages & +12 Glimmer.',
    lore: 'AWK: "Step between ticks of the cosmic clock."',
  },
  frost_nova: {
    id: 'frost_nova', faction: 'Aether', name: 'Frost Nova', short: 'Frost',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'chrono_shift',
    icon: '❄️', kind: 'frost_nova', range: '11y Freeze', rangeYards: 11,
    cost: 15, baseCd: 7.5, castTime: 0, color: '#bae6fd',
    desc: 'Shatters star-ice in 11y, dealing CRIT DMG & freezing/chilling foes for 3.5s!',
    lore: 'AWK: "Absolute zero between the stars."',
  },
  phase_shift: {
    id: 'phase_shift', faction: 'Aether', name: 'Phase Shift', short: 'Phase',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'frost_nova',
    icon: '🌌', kind: 'ethereal_jaunt', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 8.5, castTime: 0, color: '#7dd3fc',
    desc: 'Instant timeline slip: slips into the ether for 1.2s, becoming completely untargetable and invulnerable!',
    lore: 'AWK: "Step out of reality when destruction knocks."',
  },
  chrono_rift: {
    id: 'chrono_rift', faction: 'Aether', name: 'Chrono Rift', short: 'Rift',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'phase_shift',
    icon: '⚡', kind: 'rift_teleport', range: '11y Rift', rangeYards: 11,
    cost: 0, baseCd: 6.0, castTime: 0, color: '#38bdf8',
    desc: 'Instant 11y spacetime leap leaving an astral rift that slows enemies by 50% and generates +20 Glimmer!',
    lore: 'AWK: "Fissure the continuum to leap past danger."',
  },
  temporal_apotheosis: {
    id: 'temporal_apotheosis', faction: 'Aether', name: 'Temporal Apotheosis', short: 'ChronoForm',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'chrono_rift',
    icon: '👑', kind: 'apotheosis', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#e0f2fe',
    desc: 'Apex Aether Avatar: resets all non-apex cooldowns, reduces Rite cast times by 75%, and grants +50% movement speed for 8s!',
    lore: 'AWK #7: "Master of the cosmic timeline, where past and future bow to your will."',
  },
  astral_convergence: {
    id: 'astral_convergence', faction: 'Aether', name: 'Astral Convergence', short: 'Starfall',
    tcgType: 'Aether Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: null,
    icon: '🌠', kind: 'cast_beam', range: '26y', rangeYards: 26,
    cost: 25, baseCd: 3.8, castTime: 1.0, color: '#38bdf8',
    desc: '1.0s Rite calling down cosmic starfall beams (+35% chance to Echo twice!).',
    lore: 'AWK: "When the constellations align, empires fall."',
  },
  gravity_well: {
    id: 'gravity_well', faction: 'Aether', name: 'Gravity Well', short: 'Gravity',
    tcgType: 'Aether Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'astral_convergence',
    icon: '🌀', kind: 'ground_zone', zoneType: 'gravity', range: '8.5y Vortex', rangeYards: 8.5,
    cost: 0, baseCd: 8.5, castTime: 1.1, color: '#0ea5e9',
    desc: 'Spawns a cosmic vortex for 6s that pulls enemies inward & ticks arcane DMG!',
    lore: 'AWK: "No light—nor shadow—escapes the singularity."',
  },
  time_loop_paradox: {
    id: 'time_loop_paradox', faction: 'Aether', name: 'Time Loop Paradox', short: 'TimeLoop',
    tcgType: 'Aether Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'gravity_well',
    icon: '⏳', kind: 'timeloop', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 9.0, castTime: 1.2, color: '#e0f2fe',
    desc: 'Rewinds wounds (+HP), shaves 2.5s off active cooldowns & primes Spell Echo!',
    lore: 'AWK: "Why suffer a wound that hasn\'t happened yet?"',
  },
  supernova_collapse: {
    id: 'supernova_collapse', faction: 'Aether', name: 'Supernova Collapse', short: 'Supernova',
    tcgType: 'Aether Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'time_loop_paradox',
    icon: '💥', kind: 'supernova', range: '13y Implosion', rangeYards: 13,
    cost: 30, baseCd: 10.5, castTime: 1.4, color: '#38bdf8',
    desc: '1.4s Rite causing an astral supernova implosion in 13y, dealing heavy arcane CRIT DMG and generating +25 Glimmer!',
    lore: 'AWK: "The death of a star is born in brilliant devastation."',
  },
  chrono_stasis_singularity: {
    id: 'chrono_stasis_singularity', faction: 'Aether', name: 'Chrono Stasis Singularity', short: 'Stasis',
    tcgType: 'Aether Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'supernova_collapse',
    icon: '🌌', kind: 'stasis_bubble', range: '14y Sphere', rangeYards: 14,
    cost: 35, baseCd: 16.0, castTime: 1.6, color: '#0284c7',
    desc: 'Apex Aether Rite: freezes spacetime in a 14y sphere, immobilizing all enemies for 3.5s before shattering for catastrophic damage (50+ base)!',
    lore: 'AWK #8: "Freeze the clock of destiny, and shatter their existence."',
  },

  // === CORE RULE ===
  harvest: {
    id: 'harvest', faction: 'All', name: 'Ready Glimmer Node', short: 'Glimmer',
    tcgType: 'TCG Core Rule', tree: 'core', tier: 1, reqLevel: 1, maxRank: 1, prereq: null,
    icon: '🔮', kind: 'harvest', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0, castTime: 0.6, color: '#c084fc',
    desc: 'Draws raw leyline energy from a Glimmer Node (+18+ Glimmer & +3 XP; Grand Fonts give 60+ Glimmer & +7 XP).',
    lore: 'Summoners channel Glimmer Nodes to fuel Rites and Flashes.',
  },
};

// Backwards-compatible slot map helper
export function getSlotAbilitySpec(loadout, slot) {
  if (slot === 'harvest') return ABILITIES_CATALOG.harvest;
  const abilId = loadout?.[slot];
  return abilId ? ABILITIES_CATALOG[abilId] || null : null;
}

export const ORDER_PRESETS = [
  { tag: 'SUN', name: 'Order of Dawn', color: '#facc15', emblem: '☀️', logo: '/solari_nobg.png' },
  { tag: 'VOID', name: 'Duskveil Cabal', color: '#c084fc', emblem: '🌑', logo: '/umbri_nobg.png' },
  { tag: 'ROOT', name: 'Ironwood Watch', color: '#4ade80', emblem: '🌿', logo: '/terra_nobg.png' },
  { tag: 'AETH', name: 'Chronocore Wardens', color: '#38bdf8', emblem: '🔮', logo: '/aether_nobg.png' },
  { tag: 'GLIM', name: 'GlimmerFall Founders', color: '#fb923c', emblem: '⚡', logo: '/solari_nobg.png' },
];

export const EMOTES_CATALOG = {
  wave: { id: 'wave', icon: '👋', label: 'WAVE', text: 'waves heartily!', color: '#fde047' },
  cheer: { id: 'cheer', icon: '☀️', label: 'PRAISE', text: 'praises the Glimmer!', color: '#facc15' },
  swords: { id: 'swords', icon: '⚔️', label: 'CHALLENGE', text: 'brandishes their weapon!', color: '#f87171' },
  shield: { id: 'shield', icon: '🛡️', label: 'GUARD', text: 'rallies to defend the Nexus!', color: '#38bdf8' },
  gg: { id: 'gg', icon: '🏆', label: 'GG', text: 'salutes: Good Game!', color: '#4ade80' },
  void: { id: 'void', icon: '🌑', label: 'VOID', text: 'points toward the Fall!', color: '#c084fc' },
  heart: { id: 'heart', icon: '❤️', label: 'THANKS', text: 'shares radiant gratitude!', color: '#fb7185' },
};

export const SLOT_UNLOCK_LEVELS = {
  1: 1,  // Primary Basic Strike (Lv. 1)
  9: 2,  // Primary Flash / Mobility (Lv. 2)
  2: 3,  // Secondary Rite / Cast (Lv. 3)
  10: 4, // Secondary Flash / Utility (Lv. 4)
  3: 5,  // Signature Rite / Heavy AoE (Lv. 5)
  11: 6, // Signature Flash / Control (Lv. 6)
  4: 7,  // Ultimate Rite / Finisher (Lv. 7)
  12: 8, // Ultimate Flash / Apex (Lv. 8)
};

export function isSlotUnlocked(prog, slot) {
  const req = SLOT_UNLOCK_LEVELS[slot] || 1;
  return (prog?.level || 1) >= req;
}

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

export function calcCastSpeedMult(prog) {
  const aetherPts = prog?.paragon?.aether_chronoflux || 0;
  return Math.max(0.4, 1 - aetherPts * 0.012);
}

export function calcCritDamageMult(prog) {
  const solariPts = prog?.paragon?.solari_radiance || 0;
  return 1.75 + solariPts * 0.015;
}

export function calcDodgeChance(prog) {
  const umbriPts = prog?.paragon?.umbri_shadowcraft || 0;
  return Math.min(0.40, umbriPts * 0.006);
}

export function calcDamageReduction(prog) {
  const terraPts = prog?.paragon?.terra_bulwark || 0;
  return Math.min(0.40, terraPts * 0.01);
}

export function calcLifeLeechPct(prog, faction) {
  const umbriPts = prog?.paragon?.umbri_shadowcraft || 0;
  const base = faction === 'Umbri' ? 0.08 : 0;
  return base + umbriPts * 0.008;
}

export function calcHpRegenPerSec(prog) {
  const terraPts = prog?.paragon?.terra_bulwark || 0;
  // Slow innate recovery: 1 HP every 3 seconds, plus 0.5 HP/s per Terra Bulwark point.
  return 1 / 3 + terraPts * 0.5;
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

export function canUpgradeParagon(prog, affinityId) {
  const spec = PARAGON_AFFINITIES[affinityId];
  if (!spec) return false;
  if ((prog?.paragonPoints || 0) <= 0) return false;
  const cur = prog?.paragon?.[affinityId] || 0;
  if (cur >= (spec.maxRank || 50)) return false;
  return true;
}

export const PROFESSIONS_CATALOG = {
  resonance_extraction: {
    id: 'resonance_extraction',
    name: 'Resonance Extraction',
    icon: '⚡',
    color: '#38bdf8',
    description: 'Channeling raw Glimmer, quarrying cosmic mineral seams, and harvesting crystalline leyline veins.',
    activity: 'Press [E] or click Glimmer Nodes, Grand Fonts, and glowing Ore/Mineral Veins across the realms.',
    instructor: 'Relic-Seeker Moira',
    starterQuestId: 'quest_skill_extraction',
    quickStart: 'Stand beside a Glimmer Node or Sun-Copper Mineral Vein and press [E]. Higher levels unlock Iron, Mithril, Adamantite, and Celestial Starmetal seams!',
    trainerLocation: 'Sanctuary Haven • mineral veins & Grand Font south of the spawn plaza',
  },
  relic_forging: {
    id: 'relic_forging',
    name: 'Relic-Forging',
    icon: '🔨',
    color: '#f97316',
    description: 'Smelting cosmic ores with star-minerals and hammering enchanted blades, bulwarks, and socket gems.',
    activity: 'Gather Ores + Minerals and click the Cosmic Star-Anvil next to Blacksmith Torvin (or in Starfall Crater).',
    instructor: 'Blacksmith Torvin',
    starterQuestId: 'quest_skill_forging',
    quickStart: 'Mine Sun-Copper Ore & Star-Tin Mineral from world veins (or buy starter ore from Torvin), then open the glowing Cosmic Star-Anvil to smelt bars and smith gear!',
    trainerLocation: 'Cosmic Star-Anvil • Sanctuary south-west smithy, Golden Citadel & Starfall Crater',
  },
  rite_binding: {
    id: 'rite_binding',
    name: 'Rite-Binding',
    icon: '📜',
    color: '#a855f7',
    description: 'Harvesting luminous flora, distilling Glimmer essences, and binding elixirs, keystones, and relic gems.',
    activity: 'Harvest Sunbloom & Chrono-Lotus herbs and brew at the Aetherial Crucible beside Alchemist Faye.',
    instructor: 'Alchemist Faye',
    starterQuestId: 'quest_skill_binding',
    quickStart: 'Gather Sunbloom Petals from wild herb clusters + Glimmer Shards, then interact with the bubbling Aetherial Crucible beside Alchemist Faye to distill potions & gems!',
    trainerLocation: 'Aetherial Crucible • Sanctuary north-west apothecary & Abyssal Sanctum',
  },
  glimmerweaving: {
    id: 'glimmerweaving',
    name: 'Glimmerweaving',
    icon: '🧵',
    color: '#22c55e',
    description: 'Spinning Starlight Flax and Shadow-Silk into enchanted cloaks, vestments, and gourmet trail feasts.',
    activity: 'Harvest Starlight Flax & Shadow-Silk blooms and craft at the Celestial Loom beside Farmer Bran.',
    instructor: 'Farmer Bran',
    starterQuestId: 'quest_skill_weaving',
    quickStart: 'Pick Starlight Flax from glowing grove blooms (or buy starter flax from Farmer Bran), then click the Celestial Loom & Hearth in Sanctuary Haven to weave cloaks and bake feasts!',
    trainerLocation: 'Celestial Loom & Hearth • Sanctuary west market grove',
  },
  combat_mastery: {
    id: 'combat_mastery',
    name: 'Combat Mastery',
    icon: '⚔️',
    color: '#ef4444',
    description: 'Mastery over the blade, staff, and war arts honed through defeating monsters, elites, and world bosses.',
    activity: 'Slay monsters, Elite Champions, and Sanctuary Bounty targets across the realms.',
    instructor: 'Commander Valerius',
    starterQuestId: null,
    quickStart: 'Fight monsters outside Sanctuary Haven, claim contracts at the Sanctuary Bounty Board, or strike the Sanctuary Dummy 15 times with [1].',
    trainerLocation: 'Outer realms • Sanctuary Bounty Board & training grounds',
  },
};

// ==========================================
// Cosmic Artisan Stations, Skilling Nodes, Recipes, Elites & Bounties
// ==========================================
export const CRAFTING_STATIONS = {
  cosmic_anvil: {
    id: 'cosmic_anvil',
    professionId: 'relic_forging',
    name: 'Cosmic Star-Anvil & Astral Smeltery',
    shortName: 'Cosmic Star-Anvil',
    icon: '🔨',
    color: '#f97316',
    subtitle: 'Smelt raw ores + cosmic minerals into ingots, then hammer weapons, armor & Leyline Gems.',
    actionVerb: 'Forging',
    categories: [
      { id: 'all', label: 'All Recipes' },
      { id: 'smelting', label: '🔥 Smelt Alloys' },
      { id: 'smithing', label: '⚔️ Weapons & Armor' },
      { id: 'gems', label: '💎 Cut Relic Gems' },
    ],
  },
  aether_crucible: {
    id: 'aether_crucible',
    professionId: 'rite_binding',
    name: 'Aetherial Crucible & Rite Altar',
    shortName: 'Aetherial Crucible',
    icon: '⚗️',
    color: '#a855f7',
    subtitle: 'Distill wild herbs and elemental essences into elixirs, focus orbs, Leyline Gems & Keystones.',
    actionVerb: 'Distilling',
    categories: [
      { id: 'all', label: 'All Recipes' },
      { id: 'potions', label: '🧪 Salves & Elixirs' },
      { id: 'binding', label: '🔮 Orbs, Gems & Keys' },
    ],
  },
  celestial_loom: {
    id: 'celestial_loom',
    professionId: 'glimmerweaving',
    name: 'Celestial Loom & Sanctuary Hearth',
    shortName: 'Celestial Loom',
    icon: '🧵',
    color: '#22c55e',
    subtitle: 'Spin Starlight Flax & Shadow-Silk into enchanted cloaks, robes, and nourishing gourmet feasts.',
    actionVerb: 'Weaving',
    categories: [
      { id: 'all', label: 'All Recipes' },
      { id: 'tailoring', label: '🧣 Cloaks & Vestments' },
      { id: 'culinary', label: '🥧 Hearth Feasts' },
    ],
  },
};

export const CRAFTING_RECIPES = [
  // --- COSMIC STAR-ANVIL: SMELTING ALLOYS (Relic-Forging) ---
  {
    id: 'smelt_bronze_bar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smelting',
    reqLevel: 1,
    xp: 24,
    outputId: 'bronze_bar',
    outputQty: 1,
    ingredients: [
      { id: 'sun_copper_ore', qty: 1 },
      { id: 'star_tin_mineral', qty: 1 },
    ],
  },
  {
    id: 'smelt_star_iron_bar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smelting',
    reqLevel: 10,
    xp: 42,
    outputId: 'star_iron_bar',
    outputQty: 1,
    ingredients: [
      { id: 'iron_ore', qty: 1 },
      { id: 'astral_mineral_dust', qty: 1 },
    ],
  },
  {
    id: 'smelt_umbral_steel_bar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smelting',
    reqLevel: 20,
    xp: 64,
    outputId: 'umbral_steel_bar',
    outputQty: 1,
    ingredients: [
      { id: 'iron_ore', qty: 1 },
      { id: 'umbral_coal', qty: 2 },
    ],
  },
  {
    id: 'smelt_astral_mithril_bar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smelting',
    reqLevel: 35,
    xp: 95,
    outputId: 'astral_mithril_bar',
    outputQty: 1,
    ingredients: [
      { id: 'mithril_astral_ore', qty: 1 },
      { id: 'umbral_coal', qty: 2 },
      { id: 'glimmer_shard', qty: 1 },
    ],
  },
  {
    id: 'smelt_prismatic_adamant_bar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smelting',
    reqLevel: 50,
    xp: 140,
    outputId: 'prismatic_adamant_bar',
    outputQty: 1,
    ingredients: [
      { id: 'adamant_terra_ore', qty: 1 },
      { id: 'astral_mineral_dust', qty: 2 },
      { id: 'verdant_amber', qty: 1 },
    ],
  },
  {
    id: 'smelt_celestial_starmetal_bar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smelting',
    reqLevel: 70,
    xp: 225,
    outputId: 'celestial_starmetal_bar',
    outputQty: 1,
    ingredients: [
      { id: 'celestial_runite_ore', qty: 1 },
      { id: 'chrono_gem', qty: 2 },
      { id: 'astral_mineral_dust', qty: 2 },
    ],
  },

  // --- COSMIC STAR-ANVIL: SMITHING WEAPONS, ARMOR & GEMS ---
  {
    id: 'forge_copper_ring',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 1,
    xp: 30,
    outputId: 'copper_ring',
    outputQty: 1,
    ingredients: [{ id: 'bronze_bar', qty: 1 }],
  },
  {
    id: 'forge_iron_broadsword',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 4,
    xp: 56,
    outputId: 'iron_broadsword',
    outputQty: 1,
    ingredients: [{ id: 'bronze_bar', qty: 2 }],
  },
  {
    id: 'forge_iron_heater_shield',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 7,
    xp: 70,
    outputId: 'iron_heater_shield',
    outputQty: 1,
    ingredients: [
      { id: 'bronze_bar', qty: 2 },
      { id: 'glimmer_shard', qty: 1 },
    ],
  },
  {
    id: 'forge_star_iron_scimitar',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 14,
    xp: 98,
    outputId: 'star_iron_scimitar',
    outputQty: 1,
    ingredients: [
      { id: 'star_iron_bar', qty: 2 },
      { id: 'glimmer_shard', qty: 1 },
    ],
  },
  {
    id: 'forge_solar_ruby_gem',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'gems',
    reqLevel: 22,
    xp: 125,
    outputId: 'gem_solar_ruby',
    outputQty: 1,
    ingredients: [
      { id: 'star_iron_bar', qty: 1 },
      { id: 'glimmer_shard', qty: 2 },
      { id: 'ancient_relic_fragment', qty: 1 },
    ],
  },
  {
    id: 'forge_umbral_steel_plate',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 26,
    xp: 160,
    outputId: 'umbral_steel_platebody',
    outputQty: 1,
    ingredients: [
      { id: 'umbral_steel_bar', qty: 3 },
      { id: 'void_essence', qty: 1 },
    ],
  },
  {
    id: 'forge_astral_mithril_greatsword',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 38,
    xp: 225,
    outputId: 'astral_mithril_greatsword',
    outputQty: 1,
    ingredients: [
      { id: 'astral_mithril_bar', qty: 3 },
      { id: 'ancient_relic_fragment', qty: 2 },
    ],
  },
  {
    id: 'forge_terra_emerald_gem',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'gems',
    reqLevel: 46,
    xp: 255,
    outputId: 'gem_terra_emerald',
    outputQty: 1,
    ingredients: [
      { id: 'astral_mithril_bar', qty: 1 },
      { id: 'verdant_amber', qty: 2 },
      { id: 'ancient_relic_fragment', qty: 1 },
    ],
  },
  {
    id: 'forge_adamant_bulwark_shield',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 54,
    xp: 330,
    outputId: 'adamant_bulwark_shield',
    outputQty: 1,
    ingredients: [
      { id: 'prismatic_adamant_bar', qty: 3 },
      { id: 'verdant_amber', qty: 2 },
    ],
  },
  {
    id: 'forge_starmetal_cosmos_blade',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 72,
    xp: 510,
    outputId: 'starmetal_cosmos_blade',
    outputQty: 1,
    ingredients: [
      { id: 'celestial_starmetal_bar', qty: 3 },
      { id: 'chrono_gem', qty: 3 },
      { id: 'void_essence', qty: 2 },
    ],
  },
  {
    id: 'forge_starmetal_cosmos_plate',
    station: 'cosmic_anvil',
    profession: 'relic_forging',
    category: 'smithing',
    reqLevel: 78,
    xp: 620,
    outputId: 'starmetal_cosmos_plate',
    outputQty: 1,
    ingredients: [
      { id: 'celestial_starmetal_bar', qty: 4 },
      { id: 'ancient_relic_fragment', qty: 3 },
      { id: 'chrono_gem', qty: 2 },
    ],
  },

  // --- AETHERIAL CRUCIBLE: RITE-BINDING & ALCHEMY ---
  {
    id: 'brew_minor_salve',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'potions',
    reqLevel: 1,
    xp: 28,
    outputId: 'minor_healing_salve',
    outputQty: 2,
    ingredients: [
      { id: 'sunbloom_herb', qty: 1 },
      { id: 'glimmer_shard', qty: 1 },
    ],
  },
  {
    id: 'brew_glimmer_draught',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'potions',
    reqLevel: 5,
    xp: 42,
    outputId: 'glimmer_draught',
    outputQty: 2,
    ingredients: [
      { id: 'sunbloom_herb', qty: 1 },
      { id: 'astral_mineral_dust', qty: 1 },
    ],
  },
  {
    id: 'bind_apprentice_orb',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'binding',
    reqLevel: 12,
    xp: 68,
    outputId: 'apprentice_focus_orb',
    outputQty: 1,
    ingredients: [
      { id: 'glimmer_shard', qty: 2 },
      { id: 'astral_mineral_dust', qty: 1 },
    ],
  },
  {
    id: 'brew_major_vitality_elixir',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'potions',
    reqLevel: 18,
    xp: 94,
    outputId: 'major_vitality_elixir',
    outputQty: 2,
    ingredients: [
      { id: 'gloomcap_spore', qty: 2 },
      { id: 'verdant_amber', qty: 1 },
    ],
  },
  {
    id: 'bind_void_sapphire_gem',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'binding',
    reqLevel: 25,
    xp: 138,
    outputId: 'gem_void_sapphire',
    outputQty: 1,
    ingredients: [
      { id: 'gloomcap_spore', qty: 2 },
      { id: 'void_essence', qty: 2 },
      { id: 'glimmer_shard', qty: 1 },
    ],
  },
  {
    id: 'brew_astral_battle_tonic',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'potions',
    reqLevel: 32,
    xp: 175,
    outputId: 'astral_battle_tonic',
    outputQty: 2,
    ingredients: [
      { id: 'chrono_lotus', qty: 2 },
      { id: 'glimmer_shard', qty: 1 },
      { id: 'void_essence', qty: 1 },
    ],
  },
  {
    id: 'bind_sunken_keystone',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'binding',
    reqLevel: 42,
    xp: 230,
    outputId: 'keystone_solari_1',
    outputQty: 1,
    ingredients: [
      { id: 'ancient_relic_fragment', qty: 2 },
      { id: 'glimmer_shard', qty: 2 },
      { id: 'chrono_lotus', qty: 1 },
    ],
  },
  {
    id: 'bind_aether_diamond_gem',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'binding',
    reqLevel: 48,
    xp: 280,
    outputId: 'gem_aether_diamond',
    outputQty: 1,
    ingredients: [
      { id: 'chrono_lotus', qty: 2 },
      { id: 'chrono_gem', qty: 2 },
      { id: 'ancient_relic_fragment', qty: 1 },
    ],
  },
  {
    id: 'brew_chrono_overdrive',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'potions',
    reqLevel: 58,
    xp: 350,
    outputId: 'chrono_overdrive_draught',
    outputQty: 2,
    ingredients: [
      { id: 'chrono_lotus', qty: 2 },
      { id: 'chrono_gem', qty: 2 },
    ],
  },
  {
    id: 'brew_empyrean_nectar',
    station: 'aether_crucible',
    profession: 'rite_binding',
    category: 'potions',
    reqLevel: 74,
    xp: 520,
    outputId: 'empyrean_nectar',
    outputQty: 2,
    ingredients: [
      { id: 'empyrean_starleaf', qty: 2 },
      { id: 'chrono_gem', qty: 2 },
      { id: 'verdant_amber', qty: 1 },
    ],
  },

  // --- CELESTIAL LOOM & HEARTH: GLIMMERWEAVING ---
  {
    id: 'weave_linen_cloak',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'tailoring',
    reqLevel: 1,
    xp: 28,
    outputId: 'linen_traveller_cloak',
    outputQty: 1,
    ingredients: [{ id: 'starlight_flax', qty: 2 }],
  },
  {
    id: 'bake_trail_rations',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'culinary',
    reqLevel: 4,
    xp: 38,
    outputId: 'field_rations',
    outputQty: 2,
    ingredients: [
      { id: 'starlight_flax', qty: 1 },
      { id: 'sweet_apple', qty: 1 },
    ],
  },
  {
    id: 'weave_scout_tunic',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'tailoring',
    reqLevel: 9,
    xp: 62,
    outputId: 'scout_leather_tunic',
    outputQty: 1,
    ingredients: [
      { id: 'starlight_flax', qty: 3 },
      { id: 'glimmer_shard', qty: 1 },
    ],
  },
  {
    id: 'bake_spiced_orchard_pie',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'culinary',
    reqLevel: 15,
    xp: 88,
    outputId: 'spiced_orchard_pie',
    outputQty: 2,
    ingredients: [
      { id: 'sweet_apple', qty: 2 },
      { id: 'sunbloom_herb', qty: 1 },
    ],
  },
  {
    id: 'weave_duskveil_mantle',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'tailoring',
    reqLevel: 24,
    xp: 145,
    outputId: 'duskveil_silk_mantle',
    outputQty: 1,
    ingredients: [
      { id: 'shadow_silk', qty: 3 },
      { id: 'void_essence', qty: 1 },
    ],
  },
  {
    id: 'weave_mystic_leystrand_robes',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'tailoring',
    reqLevel: 36,
    xp: 215,
    outputId: 'mystic_leystrand_robes',
    outputQty: 1,
    ingredients: [
      { id: 'shadow_silk', qty: 4 },
      { id: 'glimmer_shard', qty: 2 },
      { id: 'verdant_amber', qty: 1 },
    ],
  },
  {
    id: 'bake_starfire_banquet',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'culinary',
    reqLevel: 52,
    xp: 325,
    outputId: 'starfire_banquet_feast',
    outputQty: 2,
    ingredients: [
      { id: 'chrono_lotus', qty: 2 },
      { id: 'sweet_apple', qty: 2 },
      { id: 'verdant_amber', qty: 1 },
    ],
  },
  {
    id: 'weave_celestial_gossamer_cloak',
    station: 'celestial_loom',
    profession: 'glimmerweaving',
    category: 'tailoring',
    reqLevel: 68,
    xp: 495,
    outputId: 'celestial_gossamer_cloak',
    outputQty: 1,
    ingredients: [
      { id: 'celestial_gossamer', qty: 4 },
      { id: 'chrono_gem', qty: 2 },
      { id: 'empyrean_starleaf', qty: 2 },
    ],
  },
];

export const SKILLING_NODE_TYPES = {
  copper_tin_vein: {
    id: 'copper_tin_vein',
    name: 'Sun-Copper & Star-Tin Seam',
    sub: 'Cosmic Mineral Seam [E]',
    profession: 'resonance_extraction',
    reqLevel: 1,
    charges: 3,
    xp: 22,
    glimmer: 12,
    respawnSec: 7,
    sparkColors: ['#fb923c', '#fde047', '#ffffff'],
    spriteReady: 'oreCopper',
    spriteEmpty: 'oreEmpty',
    yields: [
      { id: 'sun_copper_ore', qty: 1, chance: 1.0 },
      { id: 'star_tin_mineral', qty: 1, chance: 1.0 },
    ],
  },
  iron_coal_vein: {
    id: 'iron_coal_vein',
    name: 'Star-Iron & Umbral Coal Vein',
    sub: 'Cosmic Ore Vein [E]',
    profession: 'resonance_extraction',
    reqLevel: 10,
    charges: 3,
    xp: 38,
    glimmer: 16,
    respawnSec: 9,
    sparkColors: ['#94a3b8', '#c084fc', '#f8fafc'],
    spriteReady: 'oreIron',
    spriteEmpty: 'oreEmpty',
    yields: [
      { id: 'iron_ore', qty: 1, chance: 1.0 },
      { id: 'umbral_coal', qty: 1, chance: 0.75 },
      { id: 'astral_mineral_dust', qty: 1, chance: 0.55 },
    ],
  },
  mithril_vein: {
    id: 'mithril_vein',
    name: 'Astral Mithril Meteorite Vein',
    sub: 'Meteorite Ore Vein [E]',
    profession: 'resonance_extraction',
    reqLevel: 25,
    charges: 4,
    xp: 65,
    glimmer: 24,
    respawnSec: 12,
    sparkColors: ['#38bdf8', '#7dd3fc', '#ffffff'],
    spriteReady: 'oreMithril',
    spriteEmpty: 'oreEmpty',
    yields: [
      { id: 'mithril_astral_ore', qty: 1, chance: 1.0 },
      { id: 'umbral_coal', qty: 1, chance: 0.85 },
      { id: 'astral_mineral_dust', qty: 1, chance: 0.65 },
    ],
  },
  starmetal_vein: {
    id: 'starmetal_vein',
    name: 'Celestial Starmetal & Adamant Seam',
    sub: 'Apex Starmetal Seam [E]',
    profession: 'resonance_extraction',
    reqLevel: 45,
    charges: 4,
    xp: 115,
    glimmer: 35,
    respawnSec: 16,
    sparkColors: ['#2dd4bf', '#fde047', '#ffffff'],
    spriteReady: 'oreRunite',
    spriteEmpty: 'oreEmpty',
    yields: [
      { id: 'adamant_terra_ore', qty: 1, chance: 1.0 },
      { id: 'celestial_runite_ore', qty: 1, chance: 0.65 },
      { id: 'astral_mineral_dust', qty: 1, chance: 0.8 },
    ],
  },
  herb_cluster_low: {
    id: 'herb_cluster_low',
    name: 'Sunbloom & Gloomcap Patch',
    sub: 'Alchemical Herb Patch [E]',
    profession: 'rite_binding',
    secondaryProfession: 'resonance_extraction',
    reqLevel: 1,
    charges: 3,
    xp: 24,
    glimmer: 14,
    respawnSec: 7,
    sparkColors: ['#4ade80', '#fde047', '#c084fc'],
    spriteReady: 'herbNode',
    spriteEmpty: 'herbEmpty',
    yields: [
      { id: 'sunbloom_herb', qty: 1, chance: 1.0 },
      { id: 'gloomcap_spore', qty: 1, chance: 0.45 },
    ],
  },
  herb_cluster_high: {
    id: 'herb_cluster_high',
    name: 'Chrono-Lotus & Starleaf Bloom',
    sub: 'Astral Botanical Cluster [E]',
    profession: 'rite_binding',
    secondaryProfession: 'resonance_extraction',
    reqLevel: 20,
    charges: 4,
    xp: 72,
    glimmer: 26,
    respawnSec: 11,
    sparkColors: ['#38bdf8', '#a855f7', '#fef08a'],
    spriteReady: 'herbNode',
    spriteEmpty: 'herbEmpty',
    yields: [
      { id: 'chrono_lotus', qty: 1, chance: 1.0 },
      { id: 'empyrean_starleaf', qty: 1, chance: 0.5 },
    ],
  },
  fiber_bloom_low: {
    id: 'fiber_bloom_low',
    name: 'Starlight Flax & Orchard Grove',
    sub: 'Weaving Fiber Bloom [E]',
    profession: 'glimmerweaving',
    secondaryProfession: 'resonance_extraction',
    reqLevel: 1,
    charges: 3,
    xp: 24,
    glimmer: 14,
    respawnSec: 7,
    sparkColors: ['#86efac', '#fef08a', '#ffffff'],
    spriteReady: 'fiberNode',
    spriteEmpty: 'fiberEmpty',
    yields: [
      { id: 'starlight_flax', qty: 2, chance: 1.0 },
      { id: 'sweet_apple', qty: 1, chance: 0.5 },
    ],
  },
  fiber_bloom_high: {
    id: 'fiber_bloom_high',
    name: 'Shadow-Silk & Celestial Gossamer Cocoon',
    sub: 'Luminescent Silk Cocoon [E]',
    profession: 'glimmerweaving',
    secondaryProfession: 'resonance_extraction',
    reqLevel: 20,
    charges: 4,
    xp: 72,
    glimmer: 26,
    respawnSec: 11,
    sparkColors: ['#e879f9', '#7dd3fc', '#ffffff'],
    spriteReady: 'fiberNode',
    spriteEmpty: 'fiberEmpty',
    yields: [
      { id: 'shadow_silk', qty: 2, chance: 1.0 },
      { id: 'celestial_gossamer', qty: 1, chance: 0.5 },
    ],
  },
};

export const ELITE_AFFIXES = {
  solar_charged: { id: 'solar_charged', label: 'Solar-Charged', color: '#facc15', hpMult: 1.85, dmgMult: 1.35, xpMult: 2.4 },
  void_touched: { id: 'void_touched', label: 'Void-Touched', color: '#c084fc', hpMult: 1.9, dmgMult: 1.4, xpMult: 2.5 },
  ironbark: { id: 'ironbark', label: 'Ironbark Bulwark', color: '#4ade80', hpMult: 2.2, dmgMult: 1.25, xpMult: 2.4 },
  chrono_warped: { id: 'chrono_warped', label: 'Chrono-Warped', color: '#38bdf8', hpMult: 1.8, dmgMult: 1.35, xpMult: 2.5 },
};

export const BOUNTY_CONTRACTS = [
  {
    id: 'bounty_outer_cull',
    title: 'Vanguard Patrol: Outer Realm Hostiles',
    category: 'Combat',
    icon: '⚔️',
    desc: 'Defeat any 8 hostile monsters across the outer biomes to secure Sanctuary trade routes.',
    kind: 'kills',
    targetCount: 8,
    rewardGold: 55,
    rewardXp: 95,
    rewardProf: { id: 'combat_mastery', xp: 85 },
    rewardItems: [{ id: 'glimmer_shard', qty: 2 }],
  },
  {
    id: 'bounty_prospecting_run',
    title: 'Artisan Supply: Mineral & Leyline Extraction',
    category: 'Skilling',
    icon: '⛏️',
    desc: 'Extract from 6 Glimmer Nodes, Mineral Veins, or Herb/Flax Blooms anywhere in the realm.',
    kind: 'harvests',
    targetCount: 6,
    rewardGold: 45,
    rewardXp: 70,
    rewardProf: { id: 'resonance_extraction', xp: 95 },
    rewardItems: [
      { id: 'sun_copper_ore', qty: 3 },
      { id: 'star_tin_mineral', qty: 3 },
    ],
  },
  {
    id: 'bounty_cosmic_craft',
    title: 'Sanctuary Quartermaster: Artisan Requisition',
    category: 'Artisan',
    icon: '🔨',
    desc: 'Forge, distill, or weave any 4 items at the Cosmic Star-Anvil, Aetherial Crucible, or Celestial Loom.',
    kind: 'crafts',
    targetCount: 4,
    rewardGold: 60,
    rewardXp: 85,
    rewardProf: { id: 'relic_forging', xp: 90 },
    rewardItems: [{ id: 'astral_mineral_dust', qty: 3 }],
  },
  {
    id: 'bounty_starfall_expedition',
    title: 'Starfall Expedition: Meteorite Constructs',
    category: 'Late-Game',
    icon: '☄️',
    desc: 'Venture into Starfall Crater (west of Golden Citadel or east of Forgotten Ruins) and slay 6 Starfall foes.',
    kind: 'starfall_kills',
    targetCount: 6,
    rewardGold: 130,
    rewardXp: 210,
    rewardProf: { id: 'combat_mastery', xp: 165 },
    rewardItems: [
      { id: 'mithril_astral_ore', qty: 3 },
      { id: 'ancient_relic_fragment', qty: 2 },
    ],
  },
  {
    id: 'bounty_abyssal_hunt',
    title: 'Apex Hunt: Champions of the Abyssal Rift',
    category: 'Endgame',
    icon: '🌌',
    desc: 'Slay 6 Rift horrors in the Abyssal Rift (east of Continental Caldera) or Elite Champions anywhere.',
    kind: 'abyssal_or_elite_kills',
    targetCount: 6,
    rewardGold: 220,
    rewardXp: 360,
    rewardProf: { id: 'combat_mastery', xp: 260 },
    rewardItems: [
      { id: 'celestial_runite_ore', qty: 2 },
      { id: 'chrono_gem', qty: 2 },
    ],
  },
  {
    id: 'bounty_titan_slayer',
    title: 'Paragon Directive: Continental Boss Vanquisher',
    category: 'Boss Hunt',
    icon: '👑',
    desc: 'Vanquish any 2 Dungeon, Crater, Rift, or Continental World Bosses across GlimmerFall.',
    kind: 'bosses',
    targetCount: 2,
    rewardGold: 260,
    rewardXp: 420,
    rewardProf: { id: 'combat_mastery', xp: 300 },
    rewardItems: [
      { id: 'ancient_relic_fragment', qty: 3 },
      { id: 'empyrean_starleaf', qty: 2 },
    ],
  },
];

// Level-99 mastery capes are the concrete reward behind each skill guide's final milestone.
export const PROFESSION_MASTERY_CAPES = {
  resonance_extraction: 'skillcape_extraction',
  relic_forging: 'skillcape_forging',
  rite_binding: 'skillcape_binding',
  glimmerweaving: 'skillcape_weaving',
  combat_mastery: 'skillcape_combat',
};

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
  if (!professions || typeof professions !== 'object') return 5;
  let total = 0;
  for (const profId of Object.keys(PROFESSIONS_CATALOG)) {
    const prof = professions[profId];
    const lvl = Math.max(prof?.level || 1, getProfessionLevelFromXp(prof?.xp || 0));
    total += Math.max(1, Math.min(99, Math.floor(Number(lvl) || 1)));
  }
  return total;
}

export function createDefaultProgression() {
  return {
    level: 1,
    xp: 0,
    statPoints: 2,
    skillPoints: 1, // Starts with 1 unallocated Skill Point for the level 1 dopamine hit!
    stats: { power: 2, bastion: 2, resonance: 1, tempo: 1 },
    ranks: { 1: 0, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
    skills: {}, // abilityId -> rank (0 to 5)
    professions: {
      resonance_extraction: { xp: 0, level: 1 },
      relic_forging: { xp: 0, level: 1 },
      rite_binding: { xp: 0, level: 1 },
      glimmerweaving: { xp: 0, level: 1 },
      combat_mastery: { xp: 0, level: 1 },
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

export function getAbilityRank(prog, abilityId) {
  if (!abilityId) return 0;
  if (abilityId === 'harvest') return 1;
  const spec = ABILITIES_CATALOG[abilityId];
  if (!spec) return 0;
  const r = prog?.skills?.[abilityId];
  if (r !== undefined && r !== null) {
    const rankVal = Math.max(0, Math.min(spec.maxRank || 5, Math.floor(Number(r) || 0)));
    // Tier 1 starter abilities are always at least Rank 1 so players are never soft-locked
    if ((spec.tier || 1) === 1) return Math.max(1, rankVal);
    return rankVal;
  }
  // Check prog?.ranks?.[abilityId]
  if (prog?.ranks?.[abilityId] !== undefined && prog?.ranks?.[abilityId] !== null) {
    const rankVal = Math.max(0, Math.min(spec.maxRank || 5, Math.floor(Number(prog.ranks[abilityId]) || 0)));
    if ((spec.tier || 1) === 1) return Math.max(1, rankVal);
    return rankVal;
  }
  // Tier 1 basic attacks (whisper_of_the_void, flare_strike, tectonic_slam, reality_fracture) default to Rank 1
  if ((spec.tier || 1) === 1) return 1;
  return 0;
}

export function canUpgradeAbility(prog, abilityId) {
  const spec = ABILITIES_CATALOG[abilityId];
  if (!spec) return false;
  const curRank = getAbilityRank(prog, abilityId);
  if (curRank >= (spec.maxRank || 5)) return false;
  if ((prog?.skillPoints || 0) <= 0) return false;
  if ((prog?.level || 1) < (spec.reqLevel || 1)) return false;
  if (spec.prereq) {
    const prereqRank = getAbilityRank(prog, spec.prereq);
    if (prereqRank < 1) return false;
  }
  return true;
}

export function getRankStats(ability, rank = 1) {
  const r = Math.max(1, Math.min(5, rank || 1));
  const rankBonusDmg = (r - 1) * 3;
  const rankCdReduction = (r - 1) * 0.35;
  const effectiveBaseCd = Math.max(0.4, (ability?.baseCd || 1) - rankCdReduction);
  const rankShield = (r - 1) * 5;
  const rankHeal = (r - 1) * 4;
  return {
    rank: r,
    bonusDmg: rankBonusDmg,
    effectiveBaseCd,
    bonusShield: rankShield,
    bonusHeal: rankHeal,
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
  let flatEquipHp = 0;
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats?.maxHp) flatEquipHp += Number(item.stats.maxHp) || 0;
  }
  return 25 + ((prog?.level || 1) - 1) * 3 + (eff.bastion - 2) * 3 + paragonHp + titanHp + flatEquipHp;
}

export function calcMaxGlimmer(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonGlimmer = (prog?.paragon?.aether_chronoflux || 0) * 5;
  const { active } = getActiveSetBonuses(equipment);
  const titanGlimmer = active.some((s) => s.id === 'aurelius_titan') ? 40 : 0;
  let flatEquipGlimmer = 0;
  for (const itemId of Object.values(equipment || {})) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (item?.stats?.maxGlimmer) flatEquipGlimmer += Number(item.stats.maxGlimmer) || 0;
  }
  return 100 + (eff.resonance - 1) * 8 + paragonGlimmer + titanGlimmer + flatEquipGlimmer;
}

export function calcCritChance(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const paragonCrit = (prog?.paragon?.solari_radiance || 0) * 0.005;
  const { active } = getActiveSetBonuses(equipment);
  const duskveilCrit = active.some((s) => s.id === 'duskveil_reaver') ? 0.18 : 0;
  return Math.min(0.85, 0.2 + eff.tempo * 0.025 + paragonCrit + duskveilCrit);
}

export function calcCdMult(prog, equipment = {}, classId = 'solari_vanguard', faction = 'Solari') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const aetherBonus = faction === 'Aether' ? 0.12 : 0;
  const paragonCd = (prog?.paragon?.aether_chronoflux || 0) * 0.008;
  const { active } = getActiveSetBonuses(equipment);
  const chronoCd = active.some((s) => s.id === 'chrono_astral') ? 0.25 : 0;
  return Math.max(0.35, 1 - eff.tempo * 0.02 - aetherBonus - paragonCd - chronoCd);
}

// Deep Water & Abyss Collision Detection
export function isWaterTile(x, y, roomType = ROOM_TYPES.NEXUS_WARZONE) {
  if (roomType === ROOM_TYPES.NEXUS_WARZONE) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);

    // 1. South Sanctuary River (meanders horizontally between ty: 75 and 80)
    const southRiverY = 77 + Math.round(Math.sin(tx * 0.08) * 2.5);
    const isSouthRiver = Math.abs(ty - southRiverY) <= 1;

    // 2. Northwest Mountain Gorge Stream flowing down through Terra Ironwood Wilds
    const streamX = -65 + Math.round(Math.cos(ty * 0.08) * 4);
    const isNWStream = tx >= streamX - 1 && tx <= streamX + 1 && ty >= -85 && ty <= 20;

    if (!isSouthRiver && !isNWStream) return false;

    // Bridges crossing rivers allow safe traversal on foot:
    const isMainSouthBridge = isSouthRiver && Math.abs(tx) <= 3;
    const isWestTimberBridge = isSouthRiver && Math.abs(tx - (-80)) <= 2;
    const isEastTimberBridge = isSouthRiver && Math.abs(tx - 80) <= 2;
    const isNWGorgeBridge = isNWStream && Math.abs(ty - (-35)) <= 2;

    if (isMainSouthBridge || isWestTimberBridge || isEastTimberBridge || isNWGorgeBridge) {
      return false; // Walkable bridge
    }

    return true; // Deep river water blocks movement
  }

  if (roomType === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return false;
    return (Math.abs(tx) % 6 <= 1 && Math.abs(ty) % 6 <= 1);
  }

  return false;
}
