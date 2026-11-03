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
};

export const ROOM_CONFIGS = {
  [ROOM_TYPES.SANCTUARY_HUB]: {
    type: ROOM_TYPES.SANCTUARY_HUB,
    title: 'AWAKENING SANCTUARY HUB',
    shortTitle: 'SANCTUARY HUB',
    biomeTheme: 'sanctuary',
    bgm: 'sanctuary',
    maxPlayers: 60,
    halfW: 288,
    halfH: 240,
    pvp: false,
    spawnX: 0,
    spawnY: 96,
  },
  [ROOM_TYPES.NEXUS_WARZONE]: {
    type: ROOM_TYPES.NEXUS_WARZONE,
    title: 'THE NEXUS CONTINENT (OPEN WORLD REALM)',
    shortTitle: 'OPEN WORLD REALM',
    biomeTheme: 'warzone',
    bgm: 'warzone',
    maxPlayers: 60,
    halfW: 2400,
    halfH: 1800,
    pvp: true,
    spawnX: 0,
    spawnY: 1450,
  },
  [ROOM_TYPES.SOLARI_CITADEL]: {
    type: ROOM_TYPES.SOLARI_CITADEL,
    title: 'LANTERN DISTRICT & GOLDEN CITADEL',
    shortTitle: 'GOLDEN CITADEL',
    biomeTheme: 'solari',
    bgm: 'warzone',
    maxPlayers: 30,
    halfW: 320,
    halfH: 272,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.UMBRI_UNDERCITY]: {
    type: ROOM_TYPES.UMBRI_UNDERCITY,
    title: 'SEPULCHER UNDERCITY & DUSKVEIL BOG',
    shortTitle: 'DUSKVEIL BOG',
    biomeTheme: 'umbri',
    bgm: 'warzone',
    maxPlayers: 30,
    halfW: 320,
    halfH: 272,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.TERRA_ORCHARD]: {
    type: ROOM_TYPES.TERRA_ORCHARD,
    title: 'GLIMMER ORCHARD & ROOTDEEP EXPANSE',
    shortTitle: 'GLIMMER ORCHARD',
    biomeTheme: 'terra',
    bgm: 'warzone',
    maxPlayers: 30,
    halfW: 320,
    halfH: 272,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.AETHER_SPIRE]: {
    type: ROOM_TYPES.AETHER_SPIRE,
    title: 'MIRRORGATE SPIRE & CONTINUUM',
    shortTitle: 'MIRRORGATE SPIRE',
    biomeTheme: 'aether',
    bgm: 'warzone',
    maxPlayers: 30,
    halfW: 320,
    halfH: 272,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.ARENA_3V3]: {
    type: ROOM_TYPES.ARENA_3V3,
    title: '3v3 RANKED NEXUS ARENA',
    shortTitle: '3v3 NEXUS ARENA',
    biomeTheme: 'arena',
    bgm: 'boss',
    maxPlayers: 6,
    halfW: 240,
    halfH: 272,
    pvp: true,
    spawnX: 0,
    spawnY: 175,
  },
  [ROOM_TYPES.NEXUS_FORGOTTEN_RUINS]: {
    type: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
    title: 'THE SHATTERED FIRST NEXUS & FORGOTTEN RUINS',
    shortTitle: 'FORGOTTEN RUINS',
    biomeTheme: 'ruins',
    bgm: 'sanctuary',
    maxPlayers: 35,
    halfW: 360,
    halfH: 300,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.SOLARI_SUNKEN_VAULT]: {
    type: ROOM_TYPES.SOLARI_SUNKEN_VAULT,
    title: 'SUNKEN VAULT OF THE DAWN',
    shortTitle: 'SUNKEN VAULT',
    biomeTheme: 'solari_vault',
    bgm: 'boss',
    maxPlayers: 25,
    halfW: 320,
    halfH: 272,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.UMBRI_SHADOW_LABYRINTH]: {
    type: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH,
    title: 'DUSKVEIL SHADOW LABYRINTH',
    shortTitle: 'SHADOW LABYRINTH',
    biomeTheme: 'umbri_labyrinth',
    bgm: 'boss',
    maxPlayers: 25,
    halfW: 340,
    halfH: 290,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY]: {
    type: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
    title: 'ROOTDEEP PRIMORDIAL HOLLOW',
    shortTitle: 'PRIMORDIAL HOLLOW',
    biomeTheme: 'terra_grove',
    bgm: 'warzone',
    maxPlayers: 25,
    halfW: 320,
    halfH: 272,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
  [ROOM_TYPES.AETHER_FRACTURED_ARCHIVE]: {
    type: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE,
    title: 'FRACTURED CHRONO-ARCHIVE',
    shortTitle: 'CHRONO-ARCHIVE',
    biomeTheme: 'aether_archive',
    bgm: 'boss',
    maxPlayers: 25,
    halfW: 340,
    halfH: 280,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
  },
};

export const FACTIONS_META = {
  Solari: {
    id: 'Solari',
    name: 'Solari (The Light)',
    title: 'Solari Vanguard',
    icon: '☀️',
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
    defaultLoadout: {
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
    defaultLoadout: {
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
    defaultLoadout: {
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
    defaultLoadout: {
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
    defaultLoadout: {
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
    defaultLoadout: {
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
    defaultLoadout: {
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
    defaultLoadout: {
      1: 'reality_fracture', 2: 'arcane_bolt', 3: 'astral_convergence', 4: 'gravity_well',
      9: 'mirror_barrier', 10: 'time_loop_paradox', 11: 'frost_nova', 12: 'chrono_shift',
    },
  },
};

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
    slot: 'offhand',
    name: 'Chronos Singularity Core',
    icon: '🔮',
    rarity: 'Mythic Relic',
    style: 'orb',
    mainColor: '#0ea5e9',
    trimColor: '#e0e7ff',
    stats: { resonance: 3, tempo: 2 },
    desc: 'Pulsing temporal anomaly core from the Fractured Archive (+3 Resonance, +2 Tempo).',
  },
};

// Complete Authentic GlimmerFall TCG Rites & Flashes Catalog (All 4 Factions)
export const ABILITIES_CATALOG = {
  // === SOLARI ===
  flare_strike: {
    id: 'flare_strike', faction: 'Solari', name: 'Flare Strike', short: 'Flare',
    tcgType: 'Solari Flash', icon: '⚔️', kind: 'melee_cleave', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0.85, color: '#facc15',
    desc: 'Radiant cleave dealing (4-7 + Power + 2×Rank) DMG & generating Glimmer.',
    lore: 'AWK #11: "A beacon of unwavering light against the encroaching shadow."',
  },
  solar_flare: {
    id: 'solar_flare', faction: 'Solari', name: 'Solar Flare', short: 'Solar',
    tcgType: 'Solari Rite', icon: '☀️', kind: 'cast_beam', range: '25y', rangeYards: 25,
    cost: 25, baseCd: 3.5, castTime: 1.0, color: '#fbbf24',
    desc: '1.0s sun-pillar Rite dealing (11-15 + 2×Power + 3×Rank) CRIT DMG + splash.',
    lore: 'AWK #12: "The unbridled fury of the sun, reduced to a single blinding flash."',
  },
  judgement_of_the_sun: {
    id: 'judgement_of_the_sun', faction: 'Solari', name: 'Judgement of the Sun', short: 'Judge',
    tcgType: 'Solari Rite', icon: '🔨', kind: 'projectile', projType: 'hammer', range: '20y', rangeYards: 20,
    cost: 0, baseCd: 4.5, color: '#facc15',
    desc: 'Hurls a solar hammer for (7-10 + Power + 2×Rank) DMG (+25 bonus Glimmer on kill!).',
    lore: 'AWK: "Deal damage to target enemy. If it dies, gain bonus Solar Energy."',
  },
  consecrated_ground: {
    id: 'consecrated_ground', faction: 'Solari', name: 'Consecrated Ground', short: 'Ground',
    tcgType: 'Solari Rite', icon: '🔥', kind: 'ground_zone', zoneType: 'consecration', range: '7.5y AoE', rangeYards: 7.5,
    cost: 0, baseCd: 8.0, color: '#fb923c',
    desc: 'Sanctifies ground for 6s: burns foes & grants +2 Power to allies inside.',
    lore: 'AWK: "Friendly entities gain Power; enemies take damage each turn."',
  },
  radiant_bulwark: {
    id: 'radiant_bulwark', faction: 'Solari', name: 'Radiant Bulwark', short: 'Bulwark',
    tcgType: 'Solari Flash', icon: '🛡️', kind: 'shield', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.5, color: '#38bdf8',
    desc: 'Summons starlight Guard shields absorbing (14 + 3×Bastion + 4×Rank) DMG.',
    lore: 'AWK: "Prevent incoming damage to your Guardian and friendly units."',
  },
  blessing_of_dawn: {
    id: 'blessing_of_dawn', faction: 'Solari', name: 'Blessing of Dawn', short: 'Bless',
    tcgType: 'Solari Rite', icon: '✨', kind: 'heal', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 6.0, color: '#4ade80',
    desc: 'Restores (8 + 2×Bastion + 3×Rank) HP to you and nearby squadmates.',
    lore: 'AWK: "Give target friendly entity vitality and restore Health."',
  },
  decree_of_the_sun: {
    id: 'decree_of_the_sun', faction: 'Solari', name: 'Decree of the Sun', short: 'Decree',
    tcgType: 'Solari Rite', icon: '👑', kind: 'nova', range: '12y Edict', rangeYards: 12,
    cost: 20, baseCd: 9.0, color: '#fde047', healNexus: true,
    desc: 'Solar edict scorching foes in 12y & restoring +3 HP to allied Outpost/Sanctuary Nexus!',
    lore: 'AWK: "By sovereign Decree of the Sun, the Citadel stands unbroken."',
  },
  daybreak: {
    id: 'daybreak', faction: 'Solari', name: 'Daybreak', short: 'Dawn',
    tcgType: 'Solari Rite', icon: '🌅', kind: 'heal_glimmer', range: 'Self/Squad', rangeYards: 14,
    cost: 0, baseCd: 8.5, color: '#fef08a',
    desc: 'Restores HP, grants +25 Glimmer, and cleanses all slows/weakness.',
    lore: 'AWK: "When Daybreak crests the spire, every shadow retreats."',
  },
  wrath_of_the_daystar: {
    id: 'wrath_of_the_daystar', faction: 'Solari', name: 'Wrath of the Daystar', short: 'Daystar',
    tcgType: 'Solari Rite', icon: '⚡', kind: 'nova', range: '14y Nova', rangeYards: 14,
    cost: 30, baseCd: 11.0, color: '#fde047',
    desc: 'Spends 30 Glimmer for a 14y solar nova dealing heavy CRIT DMG & knockback.',
    lore: 'AWK: "Wrath of the Daystar commands sovereign radiance against all foes."',
  },
  blinding_radiance: {
    id: 'blinding_radiance', faction: 'Solari', name: 'Blinding Radiance', short: 'Blind',
    tcgType: 'Solari Flash', icon: '💨', kind: 'dash', range: '8.5y Dash', rangeYards: 8.5,
    cost: 0, baseCd: 4.0, color: '#bae6fd',
    desc: 'Flash-dashes 8.5y in starlight & blinds nearby foes (-2 ATK for 5s).',
    lore: 'AWK #2: "Blinding Radiance brings order to chaos."',
  },

  // === UMBRI ===
  whisper_of_the_void: {
    id: 'whisper_of_the_void', faction: 'Umbri', name: 'Whisper of the Void', short: 'Whisper',
    tcgType: 'Umbri Flash', icon: '🗡️', kind: 'melee_cleave', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0.8, color: '#c084fc',
    desc: 'Twin shadow-scythe slash generating Glimmer (+45% CRIT from Stealth!).',
    lore: 'AWK: "A silent cut from the Duskveil dark."',
  },
  shadow_step: {
    id: 'shadow_step', faction: 'Umbri', name: 'Shadow Step', short: 'Step',
    tcgType: 'Umbri Flash', icon: '🌑', kind: 'shadow_step', range: '16y Blink', rangeYards: 16,
    cost: 0, baseCd: 4.5, color: '#a855f7',
    desc: 'Teleports through shadow directly behind your target & empowers next strike!',
    lore: 'AWK: "Step into the gloom; emerge behind their heart."',
  },
  soul_tithe: {
    id: 'soul_tithe', faction: 'Umbri', name: 'Soul Tithe', short: 'Tithe',
    tcgType: 'Umbri Rite', icon: '💀', kind: 'projectile', projType: 'void_orb', range: '22y', rangeYards: 22,
    cost: 0, baseCd: 4.2, color: '#e879f9',
    desc: 'Fires a Void bolt dealing shadow DMG, draining HP & granting +24 Glimmer.',
    lore: 'AWK: "Every soul owes its tithe to the Undercity."',
  },
  siphon_soul: {
    id: 'siphon_soul', faction: 'Umbri', name: 'Siphon Soul', short: 'Siphon',
    tcgType: 'Umbri Rite', icon: '🩸', kind: 'drain_beam', range: '20y', rangeYards: 20,
    cost: 15, baseCd: 5.5, color: '#f43f5e',
    desc: 'Rips vitality from target enemy, healing you for 60% of all DMG dealt!',
    lore: 'AWK: "Drink deep of fading Glimmer."',
  },
  nightfall_plague: {
    id: 'nightfall_plague', faction: 'Umbri', name: 'Nightfall Plague', short: 'Plague',
    tcgType: 'Umbri Rite', icon: '☠️', kind: 'ground_zone', zoneType: 'plague', range: '8y AoE', rangeYards: 8,
    cost: 0, baseCd: 8.5, color: '#9333ea',
    desc: 'Spreads Duskveil miasma for 6s: deals Void DMG/tick & slows enemies by 45%.',
    lore: 'AWK: "Where Nightfall settles, light withers."',
  },
  unmake: {
    id: 'unmake', faction: 'Umbri', name: 'Unmake', short: 'Unmake',
    tcgType: 'Umbri Rite', icon: '💥', kind: 'execute_beam', range: '22y', rangeYards: 22,
    cost: 25, baseCd: 7.5, color: '#e11d48',
    desc: 'Obliterates target with Void collapse (+50% Execution DMG if target < 50% HP!).',
    lore: 'AWK: "Erase them from the tapestry of reality."',
  },
  veil_of_dusk: {
    id: 'veil_of_dusk', faction: 'Umbri', name: 'Veil of Dusk', short: 'Stealth',
    tcgType: 'Umbri Flash', icon: '👤', kind: 'stealth', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 9.0, color: '#7e22ce',
    desc: 'Vanish into Stealth for 3.5s: mobs drop aggro, +35% speed & Ambush CRIT!',
    lore: 'AWK: "Unseen by sun or star."',
  },
  graveglass_ward: {
    id: 'graveglass_ward', faction: 'Umbri', name: 'Graveglass Ward', short: 'Ward',
    tcgType: 'Umbri Flash', icon: '🔮', kind: 'shield', range: 'Self/Squad', rangeYards: 10,
    cost: 0, baseCd: 9.5, color: '#c084fc',
    desc: 'Shrouds you in spectral Graveglass absorbing incoming damage.',
    lore: 'AWK: "Forged from shattered sepulcher crystal."',
  },

  // === TERRA ===
  tectonic_slam: {
    id: 'tectonic_slam', faction: 'Terra', name: 'Tectonic Slam', short: 'Slam',
    tcgType: 'Terra Flash', icon: '🪨', kind: 'melee_cleave', range: '7y', rangeYards: 7,
    cost: 0, baseCd: 0.9, color: '#4ade80',
    desc: 'Crushing earth cleave triggering Overwhelm splash & generating Glimmer.',
    lore: 'AWK: "The mountain answers when Rootdeep strikes."',
  },
  earthshatter: {
    id: 'earthshatter', faction: 'Terra', name: 'Earthshatter', short: 'Shatter',
    tcgType: 'Terra Rite', icon: '🌋', kind: 'nova', range: '13y Quake', rangeYards: 13,
    cost: 25, baseCd: 8.5, color: '#84cc16',
    desc: 'Ruptures the earth in 13y for massive Overwhelm CRIT DMG & knockback!',
    lore: 'AWK: "Split stone and scatter their ranks."',
  },
  barkskin_infusion: {
    id: 'barkskin_infusion', faction: 'Terra', name: 'Barkskin Infusion', short: 'Barkskin',
    tcgType: 'Terra Flash', icon: '🛡️', kind: 'thornbark', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.5, color: '#22c55e',
    desc: 'Grants Ironwood Shield + Thornbark (reflects 35% melee DMG back at attackers!).',
    lore: 'AWK: "Ironwood bark turns blade and claw alike."',
  },
  briar_snare: {
    id: 'briar_snare', faction: 'Terra', name: 'Briar Snare', short: 'Snare',
    tcgType: 'Terra Rite', icon: '🌿', kind: 'ground_zone', zoneType: 'briar', range: '8y Roots', rangeYards: 8,
    cost: 0, baseCd: 8.0, color: '#16a34a',
    desc: 'Entangling roots for 6s: snares enemy movement by 65% & deals thorn DMG!',
    lore: 'AWK: "The Orchard claims trespassers."',
  },
  wildshape_surge: {
    id: 'wildshape_surge', faction: 'Terra', name: 'Wildshape Surge', short: 'Surge',
    tcgType: 'Terra Flash', icon: '🐾', kind: 'dash', range: '9y Charge', rangeYards: 9,
    cost: 0, baseCd: 4.5, color: '#86efac',
    desc: 'Primal beast-charge 9y forward, trampling foes & granting +15 Glimmer!',
    lore: 'AWK: "Channel the untamed apex of Rootdeep."',
  },
  ancient_boulder: {
    id: 'ancient_boulder', faction: 'Terra', name: 'Stonekin Boulder', short: 'Boulder',
    tcgType: 'Terra Rite', icon: '☄️', kind: 'projectile', projType: 'boulder', range: '20y', rangeYards: 20,
    cost: 0, baseCd: 4.6, color: '#a3e635',
    desc: 'Hurls a mossy monolith boulder dealing heavy Overwhelm DMG.',
    lore: 'AWK: "Carved from the elder peaks."',
  },
  verdant_renewal: {
    id: 'verdant_renewal', faction: 'Terra', name: 'Verdant Renewal', short: 'Renew',
    tcgType: 'Terra Rite', icon: '🌸', kind: 'heal', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 6.2, color: '#4ade80',
    desc: 'Blooms Glimmer flora restoring (9 + 2×Bastion + 3×Rank) HP to self & squad.',
    lore: 'AWK: "Life springs eternal from ancient roots."',
  },
  overwhelm_roar: {
    id: 'overwhelm_roar', faction: 'Terra', name: 'Primal Overwhelm', short: 'Roar',
    tcgType: 'Terra Rite', icon: '🦁', kind: 'nova', range: '11y Roar', rangeYards: 11,
    cost: 20, baseCd: 9.0, color: '#bef264',
    desc: 'Thunderous roar damaging & weakening nearby enemies (-2 ATK for 5s).',
    lore: 'AWK: "None stand before the stampede."',
  },

  // === AETHER ===
  reality_fracture: {
    id: 'reality_fracture', faction: 'Aether', name: 'Reality Fracture', short: 'Fracture',
    tcgType: 'Aether Flash', icon: '💠', kind: 'melee_cleave', range: '7.5y', rangeYards: 7.5,
    cost: 0, baseCd: 0.8, color: '#38bdf8',
    desc: 'Slices spacetime in a 7.5y arc, generating Astral Glimmer.',
    lore: 'AWK: "Even steel bends when space itself cracks."',
  },
  chrono_shift: {
    id: 'chrono_shift', faction: 'Aether', name: 'Chrono Shift', short: 'Blink',
    tcgType: 'Aether Flash', icon: '⏩', kind: 'dash', range: '9.5y Blink', rangeYards: 9.5,
    cost: 0, baseCd: 3.6, color: '#7dd3fc',
    desc: 'Instant temporal blink 9.5y leaving time-afterimages & +12 Glimmer.',
    lore: 'AWK: "Step between ticks of the cosmic clock."',
  },
  gravity_well: {
    id: 'gravity_well', faction: 'Aether', name: 'Gravity Well', short: 'Gravity',
    tcgType: 'Aether Rite', icon: '🌀', kind: 'ground_zone', zoneType: 'gravity', range: '8.5y Vortex', rangeYards: 8.5,
    cost: 0, baseCd: 8.5, color: '#0ea5e9',
    desc: 'Spawns a cosmic vortex for 6s that pulls enemies inward & ticks arcane DMG!',
    lore: 'AWK: "No light—nor shadow—escapes the singularity."',
  },
  frost_nova: {
    id: 'frost_nova', faction: 'Aether', name: 'Frost Nova', short: 'Frost',
    tcgType: 'Aether Flash', icon: '❄️', kind: 'frost_nova', range: '11y Freeze', rangeYards: 11,
    cost: 15, baseCd: 7.5, color: '#bae6fd',
    desc: 'Shatters star-ice in 11y, dealing CRIT DMG & freezing/chilling foes for 3.5s!',
    lore: 'AWK: "Absolute zero between the stars."',
  },
  astral_convergence: {
    id: 'astral_convergence', faction: 'Aether', name: 'Astral Convergence', short: 'Starfall',
    tcgType: 'Aether Rite', icon: '🌠', kind: 'cast_beam', range: '26y', rangeYards: 26,
    cost: 25, baseCd: 3.8, castTime: 0.9, color: '#38bdf8',
    desc: '0.9s Rite calling down cosmic starfall beams (+35% chance to Echo twice!).',
    lore: 'AWK: "When the constellations align, empires fall."',
  },
  time_loop_paradox: {
    id: 'time_loop_paradox', faction: 'Aether', name: 'Time Loop Paradox', short: 'TimeLoop',
    tcgType: 'Aether Rite', icon: '⏳', kind: 'timeloop', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 9.0, color: '#e0f2fe',
    desc: 'Rewinds wounds (+HP), shaves 2.5s off active cooldowns & primes Spell Echo!',
    lore: 'AWK: "Why suffer a wound that hasn\'t happened yet?"',
  },
  arcane_bolt: {
    id: 'arcane_bolt', faction: 'Aether', name: 'Temporal Lance', short: 'Lance',
    tcgType: 'Aether Flash', icon: '🔹', kind: 'projectile', projType: 'aether_orb', range: '24y', rangeYards: 24,
    cost: 0, baseCd: 3.2, color: '#38bdf8',
    desc: 'Fires an accelerating orb of distorted time dealing Arcane DMG +20 Glimmer.',
    lore: 'AWK: "Strike from three seconds in the future."',
  },
  mirror_barrier: {
    id: 'mirror_barrier', faction: 'Aether', name: 'Mirror Barrier', short: 'Mirror',
    tcgType: 'Aether Flash', icon: '🪞', kind: 'shield', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.0, color: '#7dd3fc',
    desc: 'Refractive prism shield absorbing damage for you & nearby squadmates.',
    lore: 'AWK: "Mirrorgate glass bends fury into starlight."',
  },

  // === CORE RULE ===
  harvest: {
    id: 'harvest', faction: 'All', name: 'Ready Glimmer Node', short: 'Glimmer',
    tcgType: 'TCG Core Rule', icon: '🔮', kind: 'harvest', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0, color: '#c084fc',
    desc: 'Draws raw leyline energy from a Glimmer Node (+35 Glimmer & +25 XP).',
    lore: 'Summoners channel Glimmer Nodes to fuel Rites and Flashes.',
  },
};

// Backwards-compatible slot map helper
export function getSlotAbilitySpec(loadout, slot) {
  if (slot === 'harvest') return ABILITIES_CATALOG.harvest;
  const abilId = loadout?.[slot] || CLASSES_CATALOG.solari_vanguard.defaultLoadout[slot];
  return ABILITIES_CATALOG[abilId] || ABILITIES_CATALOG.flare_strike;
}

export const ORDER_PRESETS = [
  { tag: 'SUN', name: 'Order of Dawn', color: '#facc15', emblem: '☀️' },
  { tag: 'VOID', name: 'Duskveil Cabal', color: '#c084fc', emblem: '🌑' },
  { tag: 'ROOT', name: 'Ironwood Watch', color: '#4ade80', emblem: '🌿' },
  { tag: 'AETH', name: 'Chronocore Wardens', color: '#38bdf8', emblem: '🔮' },
  { tag: 'GLIM', name: 'GlimmerFall Founders', color: '#fb923c', emblem: '⚡' },
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

export function createDefaultProgression() {
  return {
    level: 1,
    xp: 0,
    statPoints: 2,
    skillPoints: 1,
    stats: { power: 2, bastion: 2, resonance: 1, tempo: 1 },
    ranks: { 1: 1, 2: 1, 3: 1, 4: 1, 9: 1, 10: 1, 11: 1, 12: 1 },
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
  return 80 + (Math.max(1, lvl) - 1) * 55;
}

export function calcMaxHp(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  return 25 + ((prog?.level || 1) - 1) * 3 + (eff.bastion - 2) * 3;
}

export function calcMaxGlimmer(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  return 100 + (eff.resonance - 1) * 8;
}

export function calcCritChance(prog, equipment = {}, classId = 'solari_vanguard') {
  const eff = getEffectiveStats(prog, equipment, classId);
  return Math.min(0.7, 0.2 + eff.tempo * 0.025);
}

export function calcCdMult(prog, equipment = {}, classId = 'solari_vanguard', faction = 'Solari') {
  const eff = getEffectiveStats(prog, equipment, classId);
  const aetherBonus = faction === 'Aether' ? 0.12 : 0;
  return Math.max(0.55, 1 - eff.tempo * 0.02 - aetherBonus);
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
