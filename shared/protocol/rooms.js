import { TILE_SIZE } from "./constants.js";

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
  IRONWOOD_TIMBERLANDS: 'ironwood_timberlands',
  CORAL_COAST: 'coral_coast',
  STARLIGHT_GROVE: 'starlight_grove',
  CHRONOCORE_CITADEL: 'chronocore_citadel',
  SUNKEN_OASIS: 'sunken_oasis',
  SOLAR_HIGHLANDS: 'solar_highlands',
  MOONWELL_SANCTUM: 'moonwell_sanctum',
  INTERIOR_TAVERN: 'interior_tavern',
  INTERIOR_BANK_VAULT: 'interior_bank_vault',
  INTERIOR_SANCTUARY_COTTAGE: 'interior_sanctuary_cottage',
  INTERIOR_SOLARI_SMITHY: 'interior_solari_smithy',
  INTERIOR_TERRA_APOTHECARY: 'interior_terra_apothecary',
  INTERIOR_UMBRI_PARLOR: 'interior_umbri_parlor',
  INTERIOR_AETHER_OBSERVATORY: 'interior_aether_observatory',
  INTERIOR_MARINER_TAVERN: 'interior_mariner_tavern',
};

export const FOUNDER_ONLY_ROOMS = new Set([
  ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
  ROOM_TYPES.SOLARI_SUNKEN_VAULT,
  ROOM_TYPES.UMBRI_SHADOW_LABYRINTH,
  ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
  ROOM_TYPES.AETHER_FRACTURED_ARCHIVE,
  ROOM_TYPES.CORAL_COAST,
  ROOM_TYPES.SUNKEN_OASIS,
  ROOM_TYPES.SOLAR_HIGHLANDS,
  ROOM_TYPES.MOONWELL_SANCTUM,
  ROOM_TYPES.STARLIGHT_GROVE,
  ROOM_TYPES.STARFALL_CRATER,
  ROOM_TYPES.ABYSSAL_RIFT,
  ROOM_TYPES.CELESTIAL_ASCENT,
  ROOM_TYPES.CHRONOCORE_CITADEL,
]);

export function isRoomUnlockedForEdition(roomType, subjectOrTier) {
  if (!FOUNDER_ONLY_ROOMS.has(roomType)) return true;
  if (typeof subjectOrTier === 'string') return subjectOrTier === 'founder';
  return Boolean(
    subjectOrTier?.editionTier === 'founder' ||
      subjectOrTier?.statsMeta?.editionTier === 'founder' ||
      subjectOrTier?.redeemedSerialKey ||
      subjectOrTier?.statsMeta?.redeemedSerialKey ||
      subjectOrTier?.tcgLinked
  );
}

// Three shared Grand Fonts per realm, placed away from spawn crowds and quest NPCs.
export const GRAND_FONT_POSITIONS = {
  [ROOM_TYPES.SANCTUARY_HUB]: [
    { x: -340, y: 60 },
    { x: 340, y: 60 },
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
  [ROOM_TYPES.IRONWOOD_TIMBERLANDS]: [
    { x: 0, y: -240 },
    { x: -320, y: 140 },
    { x: 320, y: 140 },
  ],
  [ROOM_TYPES.CORAL_COAST]: [
    { x: 0, y: -260 },
    { x: -360, y: 160 },
    { x: 360, y: 160 },
  ],
  [ROOM_TYPES.STARLIGHT_GROVE]: [
    { x: 0, y: -220 },
    { x: -300, y: 140 },
    { x: 300, y: 140 },
  ],
  [ROOM_TYPES.CHRONOCORE_CITADEL]: [
    { x: 0, y: -240 },
    { x: -320, y: 160 },
    { x: 320, y: 160 },
  ],
  [ROOM_TYPES.SUNKEN_OASIS]: [
    { x: 0, y: -220 },
    { x: -320, y: 150 },
    { x: 320, y: 150 },
  ],
  [ROOM_TYPES.SOLAR_HIGHLANDS]: [
    { x: 0, y: -220 },
    { x: -320, y: 150 },
    { x: 320, y: 150 },
  ],
  [ROOM_TYPES.MOONWELL_SANCTUM]: [
    { x: 0, y: -240 },
    { x: -330, y: 150 },
    { x: 330, y: 150 },
  ],
  [ROOM_TYPES.ARENA_3V3]: [],
  [ROOM_TYPES.INTERIOR_TAVERN]: [],
  [ROOM_TYPES.INTERIOR_BANK_VAULT]: [],
  [ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE]: [],
  [ROOM_TYPES.INTERIOR_SOLARI_SMITHY]: [],
  [ROOM_TYPES.INTERIOR_TERRA_APOTHECARY]: [],
  [ROOM_TYPES.INTERIOR_UMBRI_PARLOR]: [],
  [ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY]: [],
  [ROOM_TYPES.INTERIOR_MARINER_TAVERN]: [],
};

export const ROOM_CONFIGS = {
  [ROOM_TYPES.SANCTUARY_HUB]: {
    type: ROOM_TYPES.SANCTUARY_HUB,
    title: 'AWAKENING SANCTUARY HAVEN & METROPOLIS',
    shortTitle: 'SANCTUARY METROPOLIS',
    biomeTheme: 'sanctuary',
    bgm: 'sanctuary',
    maxPlayers: 80,
    width: 72,
    height: 64,
    halfW: 576,
    halfH: 512,
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
    bgm: 'solari',
    maxPlayers: 50,
    width: 60,
    height: 56,
    halfW: 480,
    halfH: 448,
    pvp: false,
    spawnX: 0,
    spawnY: 110,
    edgeTransitions: {
      east: ROOM_TYPES.SANCTUARY_HUB,
      north: ROOM_TYPES.SOLARI_SUNKEN_VAULT,
      west: ROOM_TYPES.STARFALL_CRATER,
      south: ROOM_TYPES.SOLAR_HIGHLANDS,
    },
  },
  [ROOM_TYPES.UMBRI_UNDERCITY]: {
    type: ROOM_TYPES.UMBRI_UNDERCITY,
    title: 'SEPULCHER UNDERCITY & DUSKVEIL BOG',
    shortTitle: 'DUSKVEIL BOG',
    biomeTheme: 'umbri',
    bgm: 'umbri',
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
      east: ROOM_TYPES.CORAL_COAST,
    },
  },
  [ROOM_TYPES.TERRA_ORCHARD]: {
    type: ROOM_TYPES.TERRA_ORCHARD,
    title: 'GLIMMER ORCHARD & ROOTDEEP EXPANSE',
    shortTitle: 'GLIMMER ORCHARD',
    biomeTheme: 'terra',
    bgm: 'terra',
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
      south: ROOM_TYPES.IRONWOOD_TIMBERLANDS,
      east: ROOM_TYPES.SUNKEN_OASIS,
    },
  },
  [ROOM_TYPES.AETHER_SPIRE]: {
    type: ROOM_TYPES.AETHER_SPIRE,
    title: 'MIRRORGATE SPIRE & CONTINUUM',
    shortTitle: 'MIRRORGATE SPIRE',
    biomeTheme: 'aether',
    bgm: 'aether',
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
      east: ROOM_TYPES.CHRONOCORE_CITADEL,
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
    bgm: 'terra',
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
    bgm: 'abyss',
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
    bgm: 'abyss',
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
  [ROOM_TYPES.IRONWOOD_TIMBERLANDS]: {
    type: ROOM_TYPES.IRONWOOD_TIMBERLANDS,
    title: 'IRONWOOD TIMBERLANDS & LUMBERJACK GROVE (LV. 8–18)',
    shortTitle: 'IRONWOOD TIMBERLANDS',
    biomeTheme: 'terra_grove',
    bgm: 'terra',
    maxPlayers: 35,
    width: 72,
    height: 72,
    halfW: 576,
    halfH: 576,
    pvp: false,
    spawnX: 0,
    spawnY: 180,
    edgeTransitions: {
      north: ROOM_TYPES.TERRA_ORCHARD,
      east: ROOM_TYPES.CORAL_COAST,
      west: ROOM_TYPES.STARLIGHT_GROVE,
    },
  },
  [ROOM_TYPES.CORAL_COAST]: {
    type: ROOM_TYPES.CORAL_COAST,
    title: 'CORAL COAST & BRINELIGHT SHALLOWS (LV. 12–24)',
    shortTitle: 'CORAL COAST',
    biomeTheme: 'solari',
    bgm: 'solari',
    maxPlayers: 35,
    width: 72,
    height: 72,
    halfW: 576,
    halfH: 576,
    pvp: false,
    spawnX: 0,
    spawnY: 180,
    edgeTransitions: {
      north: ROOM_TYPES.UMBRI_UNDERCITY,
      west: ROOM_TYPES.IRONWOOD_TIMBERLANDS,
      south: ROOM_TYPES.SUNKEN_OASIS,
    },
  },
  [ROOM_TYPES.STARLIGHT_GROVE]: {
    type: ROOM_TYPES.STARLIGHT_GROVE,
    title: 'STARLIGHT GROVE & ANCIENT TIMBER SANCTUARY (LV. 22–45)',
    shortTitle: 'STARLIGHT GROVE',
    biomeTheme: 'terra_grove',
    bgm: 'terra',
    maxPlayers: 35,
    width: 76,
    height: 76,
    halfW: 608,
    halfH: 608,
    pvp: false,
    spawnX: 0,
    spawnY: 180,
    edgeTransitions: {
      east: ROOM_TYPES.IRONWOOD_TIMBERLANDS,
      north: ROOM_TYPES.SUNKEN_OASIS,
      south: ROOM_TYPES.MOONWELL_SANCTUM,
    },
  },
  [ROOM_TYPES.CHRONOCORE_CITADEL]: {
    type: ROOM_TYPES.CHRONOCORE_CITADEL,
    title: 'CHRONOCORE CITADEL & ASTRAL TRIAL SPIRE (LV. 42–70)',
    shortTitle: 'CHRONOCORE CITADEL',
    biomeTheme: 'aether_archive',
    bgm: 'aether',
    maxPlayers: 40,
    width: 80,
    height: 80,
    halfW: 640,
    halfH: 640,
    pvp: false,
    spawnX: 0,
    spawnY: 200,
    edgeTransitions: {
      west: ROOM_TYPES.CELESTIAL_ASCENT,
      south: ROOM_TYPES.AETHER_SPIRE,
    },
  },
  [ROOM_TYPES.SUNKEN_OASIS]: {
    type: ROOM_TYPES.SUNKEN_OASIS,
    title: 'WHISPERING SPRINGS & SUNKEN OASIS (LV. 14–28)',
    shortTitle: 'SUNKEN OASIS',
    biomeTheme: 'terra_grove',
    bgm: 'terra',
    maxPlayers: 35,
    width: 74,
    height: 74,
    halfW: 592,
    halfH: 592,
    pvp: false,
    spawnX: 0,
    spawnY: 180,
    edgeTransitions: {
      west: ROOM_TYPES.TERRA_ORCHARD,
      north: ROOM_TYPES.CORAL_COAST,
      south: ROOM_TYPES.STARLIGHT_GROVE,
    },
  },
  [ROOM_TYPES.SOLAR_HIGHLANDS]: {
    type: ROOM_TYPES.SOLAR_HIGHLANDS,
    title: 'AMBERGRIS CRAGS & SUNSPIRE HIGHLANDS (LV. 16–32)',
    shortTitle: 'SUNSPIRE HIGHLANDS',
    biomeTheme: 'solari',
    bgm: 'solari',
    maxPlayers: 35,
    width: 74,
    height: 74,
    halfW: 592,
    halfH: 592,
    pvp: false,
    spawnX: 0,
    spawnY: 180,
    edgeTransitions: {
      north: ROOM_TYPES.SOLARI_CITADEL,
      west: ROOM_TYPES.STARFALL_CRATER,
      east: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
    },
  },
  [ROOM_TYPES.MOONWELL_SANCTUM]: {
    type: ROOM_TYPES.MOONWELL_SANCTUM,
    title: 'SILVERMIST MOONWELL & DRUID SANCTUM (LV. 20–38)',
    shortTitle: 'SILVERMIST MOONWELL',
    biomeTheme: 'terra_grove',
    bgm: 'terra',
    maxPlayers: 35,
    width: 74,
    height: 74,
    halfW: 592,
    halfH: 592,
    pvp: false,
    spawnX: 0,
    spawnY: 185,
    edgeTransitions: {
      north: ROOM_TYPES.STARLIGHT_GROVE,
      east: ROOM_TYPES.CORAL_COAST,
      west: ROOM_TYPES.SOLAR_HIGHLANDS,
    },
  },
  [ROOM_TYPES.INTERIOR_TAVERN]: {
    type: ROOM_TYPES.INTERIOR_TAVERN,
    title: 'THE HEARTHSTONE INN & TAVERN',
    shortTitle: 'HEARTHSTONE INN',
    biomeTheme: 'interior_tavern',
    bgm: 'sanctuary',
    isInterior: true,
    maxPlayers: 40,
    width: 48,
    height: 36,
    halfW: 192,
    halfH: 144,
    pvp: false,
    spawnX: 0,
    spawnY: 102,
    exitDestination: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 275, y: 146, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_BANK_VAULT]: {
    type: ROOM_TYPES.INTERIOR_BANK_VAULT,
    title: 'THE GRAND AETHERVAULT HALL',
    shortTitle: 'AETHERVAULT HALL',
    biomeTheme: 'interior_vault',
    bgm: 'sanctuary',
    isInterior: true,
    maxPlayers: 40,
    width: 48,
    height: 36,
    halfW: 192,
    halfH: 144,
    pvp: false,
    spawnX: 0,
    spawnY: 102,
    exitDestination: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 115, y: -96, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE]: {
    type: ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE,
    title: "ARCHIVIST ELARA'S SCHOLAR COTTAGE",
    shortTitle: 'SCHOLAR COTTAGE',
    biomeTheme: 'interior_cottage',
    bgm: 'sanctuary',
    isInterior: true,
    maxPlayers: 25,
    width: 40,
    height: 32,
    halfW: 160,
    halfH: 128,
    pvp: false,
    spawnX: 0,
    spawnY: 88,
    exitDestination: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: -255, y: -88, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_SOLARI_SMITHY]: {
    type: ROOM_TYPES.INTERIOR_SOLARI_SMITHY,
    title: 'SOLARI SUNFORGED GUILD HALL & SMITHY',
    shortTitle: 'SUNFORGED SMITHY',
    biomeTheme: 'interior_solari',
    bgm: 'solari',
    isInterior: true,
    maxPlayers: 30,
    width: 44,
    height: 34,
    halfW: 176,
    halfH: 136,
    pvp: false,
    spawnX: 0,
    spawnY: 94,
    exitDestination: { roomType: ROOM_TYPES.SOLARI_CITADEL, x: -175, y: -96, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_TERRA_APOTHECARY]: {
    type: ROOM_TYPES.INTERIOR_TERRA_APOTHECARY,
    title: 'ROOTDEEP BOTANICAL APOTHECARY HOUSE',
    shortTitle: 'BOTANICAL HOUSE',
    biomeTheme: 'interior_terra',
    bgm: 'terra',
    isInterior: true,
    maxPlayers: 30,
    width: 44,
    height: 34,
    halfW: 176,
    halfH: 136,
    pvp: false,
    spawnX: 0,
    spawnY: 94,
    exitDestination: { roomType: ROOM_TYPES.TERRA_ORCHARD, x: -175, y: -96, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_UMBRI_PARLOR]: {
    type: ROOM_TYPES.INTERIOR_UMBRI_PARLOR,
    title: 'THE VELVET VEIL UNDERCITY PARLOR',
    shortTitle: 'VELVET VEIL PARLOR',
    biomeTheme: 'interior_umbri',
    bgm: 'umbri',
    isInterior: true,
    maxPlayers: 30,
    width: 44,
    height: 34,
    halfW: 176,
    halfH: 136,
    pvp: false,
    spawnX: 0,
    spawnY: 94,
    exitDestination: { roomType: ROOM_TYPES.UMBRI_UNDERCITY, x: -175, y: -96, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY]: {
    type: ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY,
    title: 'MIRRORGATE ASTRAL OBSERVATORY TOWER',
    shortTitle: 'ASTRAL OBSERVATORY',
    biomeTheme: 'interior_aether',
    bgm: 'aether',
    isInterior: true,
    maxPlayers: 30,
    width: 44,
    height: 34,
    halfW: 176,
    halfH: 136,
    pvp: false,
    spawnX: 0,
    spawnY: 94,
    exitDestination: { roomType: ROOM_TYPES.AETHER_SPIRE, x: -175, y: -96, dir: 'down' },
  },
  [ROOM_TYPES.INTERIOR_MARINER_TAVERN]: {
    type: ROOM_TYPES.INTERIOR_MARINER_TAVERN,
    title: 'BRINELIGHT MARINER TAVERN & GALLEY',
    shortTitle: 'MARINER TAVERN',
    biomeTheme: 'interior_tavern',
    bgm: 'terra',
    isInterior: true,
    maxPlayers: 35,
    width: 48,
    height: 36,
    halfW: 192,
    halfH: 144,
    pvp: false,
    spawnX: 0,
    spawnY: 102,
    exitDestination: { roomType: ROOM_TYPES.CORAL_COAST, x: 185, y: 132, dir: 'down' },
  },
};

export const ZONE_FACTION_ALLEGIANCE = {
  [ROOM_TYPES.SOLARI_CITADEL]: 'Solari',
  [ROOM_TYPES.SOLARI_SUNKEN_VAULT]: 'Solari',
  [ROOM_TYPES.SOLAR_HIGHLANDS]: 'Solari',
  [ROOM_TYPES.UMBRI_UNDERCITY]: 'Umbri',
  [ROOM_TYPES.UMBRI_SHADOW_LABYRINTH]: 'Umbri',
  [ROOM_TYPES.TERRA_ORCHARD]: 'Terra',
  [ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY]: 'Terra',
  [ROOM_TYPES.IRONWOOD_TIMBERLANDS]: 'Terra',
  [ROOM_TYPES.STARLIGHT_GROVE]: 'Terra',
  [ROOM_TYPES.SUNKEN_OASIS]: 'Terra',
  [ROOM_TYPES.MOONWELL_SANCTUM]: 'Terra',
  [ROOM_TYPES.AETHER_SPIRE]: 'Aether',
  [ROOM_TYPES.AETHER_FRACTURED_ARCHIVE]: 'Aether',
  [ROOM_TYPES.CHRONOCORE_CITADEL]: 'Aether',
};

export function getZoneFaction(roomType) {
  return ZONE_FACTION_ALLEGIANCE[roomType] || null;
}

export function getMobFaction(mob, roomType = null) {
  if (!mob) return getZoneFaction(roomType);
  if (mob.faction) return mob.faction;
  const sp = String(mob.spriteKey || '');
  if (sp === 'solariSentinel' || sp === 'solariBoss' || sp === 'mobSolari' || sp === 'bossSolari') return 'Solari';
  if (sp === 'duskFiend' || sp === 'umbriBoss' || sp === 'bossUmbri' || sp === 'voidStalker') {
    const zf = getZoneFaction(roomType);
    if (sp === 'voidStalker' && zf && zf !== 'Umbri') return null;
    return 'Umbri';
  }
  if (sp === 'terraWarden' || sp === 'graniteBoss' || sp === 'elderBarkhide' || sp === 'mobTerra') return 'Terra';
  if (sp === 'aetherWeaver' || sp === 'aetherBoss' || sp === 'mobAether' || sp === 'bossAether' || sp === 'aetherSentinel') return 'Aether';
  return getZoneFaction(roomType);
}

export function isMobProvokedByPlayer(mob, playerId = null) {
  if (!mob) return false;
  if (mob.provokedByLocalPlayer) return true;
  if (playerId) {
    if (mob.provokedBy instanceof Set && mob.provokedBy.has(playerId)) return true;
    if (Array.isArray(mob.provokedBy) && mob.provokedBy.includes(playerId)) return true;
    if (mob.dammers instanceof Set && mob.dammers.has(playerId)) return true;
    if (mob.threatTable && (mob.threatTable[playerId] || 0) > 0) return true;
    if (mob.inCombat && mob.targetPlayerId === playerId) return true;
  }
  return false;
}

export function isSameFactionProtectedMob(roomType, mob, playerFaction, playerId = null) {
  if (!mob || !playerFaction) return false;
  if (mob.type && mob.type !== 'mob') return false;
  const zoneFaction = getZoneFaction(roomType);
  if (!zoneFaction || zoneFaction !== playerFaction) return false;
  const mobFaction = getMobFaction(mob, roomType);
  if (mobFaction && mobFaction !== playerFaction) return false;
  if (isMobProvokedByPlayer(mob, playerId)) return false;
  return true;
}

/**
 * Returns true if the tile coordinate `(tx, ty)` lies on Coral Coast's
 * northern archway boardwalk pier (`y: -576..-177`) or the eastern twilight fishing L-pier.
 */
export function isCoralCoastPierTile(tx, ty) {
  const isNorthBoardwalk = tx >= -3 && tx <= 3 && ty >= -36 && ty <= -12;
  const isEastFishingSpur = tx >= 4 && tx <= 14 && ty >= -25 && ty <= -22;
  return isNorthBoardwalk || isEastFishingSpur;
}

/**
 * Returns true if the tile coordinate `(tx, ty)` lies in Coral Coast's open deep sea.
 */
export function isCoralCoastDeepSeaTile(tx, ty) {
  return ty <= -21 || tx >= 23;
}

/**
 * Returns true if `(tx, ty)` is a non-walkable cutout void tile in an L-shaped building interior.
 */
export function isInteriorVoidTile(tx, ty, roomType) {
  if (roomType === ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE) {
    return tx >= 5 && ty >= 3;
  }
  if (roomType === ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY) {
    return tx <= -5 && ty >= 3;
  }
  return false;
}

/**
 * Returns true if `(tx, ty)` is an internal partition wall (L-cutout wall, vault wall, or atrium divider).
 */
export function isInteriorPartitionWallTile(tx, ty, roomType) {
  if (roomType === ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE) {
    const isCutoutWall = (tx === 4 && ty >= 3) || (tx >= 4 && ty === 2);
    const isVaultWestWall = tx === 4 && ty >= -6 && ty <= -3;
    const isVaultSouthWall = ty === -3 && tx >= 4 && tx <= 9 && !(tx >= 6 && tx <= 7);
    return isCutoutWall || isVaultWestWall || isVaultSouthWall;
  }
  if (roomType === ROOM_TYPES.INTERIOR_TERRA_APOTHECARY) {
    // Horizontal conservatory divider with a 5-tile central archway (tx: -2..2)
    return ty === -1 && (tx <= -3 || tx >= 3);
  }
  if (roomType === ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY) {
    return (tx === -4 && ty >= 3) || (tx <= -4 && ty === 2);
  }
  if (roomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
    const inVaultBox = tx >= 10 && tx <= 15 && ty >= -18 && ty <= -14;
    if (!inVaultBox) return false;
    const isBorder = tx === 10 || tx === 15 || ty === -18 || ty === -14;
    const isSouthGrateGap = ty === -14 && (tx === 12 || tx === 13);
    return isBorder && !isSouthGrateGap;
  }
  return false;
}

/**
 * Returns true if `(tx, ty)` is part of the Terra Apothecary's indoor mossy herbarium atrium.
 */
export function isInteriorGardenTile(tx, ty, roomType) {
  if (roomType !== ROOM_TYPES.INTERIOR_TERRA_APOTHECARY) return false;
  return ty >= -6 && ty <= -2 && tx >= -9 && tx <= 8;
}

// Deep Water, Abyss, & Interior Partition Collision Detection
export function isWaterTile(x, y, roomType = ROOM_TYPES.NEXUS_WARZONE) {
  const tx = Math.floor(x / TILE_SIZE);
  const ty = Math.floor(y / TILE_SIZE);

  if (isInteriorVoidTile(tx, ty, roomType) || isInteriorPartitionWallTile(tx, ty, roomType)) {
    return true;
  }

  if (roomType === ROOM_TYPES.CORAL_COAST) {
    // Northern and Eastern open tidal sea blocks foot movement, except along the boardwalk & twilight fishing pier
    if (!isCoralCoastDeepSeaTile(tx, ty)) return false;
    if (isCoralCoastPierTile(tx, ty)) return false;
    return true;
  }
  if (roomType === ROOM_TYPES.NEXUS_WARZONE) {

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
    if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return false;
    return (Math.abs(tx) % 6 <= 1 && Math.abs(ty) % 6 <= 1);
  }

  if (roomType === ROOM_TYPES.ABYSSAL_RIFT) {
    return (
      Math.abs(tx) % 8 === 4 &&
      Math.abs(ty) % 8 === 4 &&
      Math.abs(tx) > 5 &&
      Math.abs(ty) > 5
    );
  }

  return false;
}

export function isFootprintInWater(px, py, roomType = ROOM_TYPES.NEXUS_WARZONE, rx = 5, ry = 4) {
  if (isWaterTile(px, py, roomType)) return true;
  if (rx <= 0 && ry <= 0) return false;
  return (
    isWaterTile(px - rx, py - ry, roomType) ||
    isWaterTile(px + rx, py - ry, roomType) ||
    isWaterTile(px - rx, py + ry, roomType) ||
    isWaterTile(px + rx, py + ry, roomType)
  );
}

export function findNearestDryTile(px, py, roomType = ROOM_TYPES.NEXUS_WARZONE, halfW = 1800, halfH = 1800) {
  const clampX = (v) => Math.max(-halfW + 16, Math.min(halfW - 16, v));
  const clampY = (v) => Math.max(-halfH + 16, Math.min(halfH - 16, v));
  const cx = clampX(px);
  const cy = clampY(py);
  if (!isFootprintInWater(cx, cy, roomType, 4, 4)) return { x: cx, y: cy };

  for (let radius = 1; radius <= 12; radius++) {
    const step = radius * TILE_SIZE;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const candX = clampX(cx + dx * TILE_SIZE);
        const candY = clampY(cy + dy * TILE_SIZE);
        if (!isFootprintInWater(candX, candY, roomType, 4, 4)) {
          return { x: candX, y: candY };
        }
      }
    }
    if (step > Math.max(halfW, halfH) * 2) break;
  }
  const cfg = ROOM_CONFIGS[roomType];
  return { x: cfg?.spawnX ?? 0, y: cfg?.spawnY ?? 96 };
}

export function clampStepOutOfWater(fromX, fromY, toX, toY, roomType = ROOM_TYPES.NEXUS_WARZONE, halfW = 1800, halfH = 1800, rx = 5, ry = 4) {
  const boundX = (v) => Math.max(-halfW + 16, Math.min(halfW - 16, v));
  const boundY = (v) => Math.max(-halfH + 16, Math.min(halfH - 16, v));
  const sx = boundX(Number(fromX) || 0);
  const sy = boundY(Number(fromY) || 0);
  const tx = boundX(Number(toX) || 0);
  const ty = boundY(Number(toY) || 0);

  const dist = Math.hypot(tx - sx, ty - sy);
  const steps = Math.max(4, Math.ceil(dist / 4));
  let safeX = sx;
  let safeY = sy;

  if (isFootprintInWater(safeX, safeY, roomType, rx, ry)) {
    const dry = findNearestDryTile(safeX, safeY, roomType, halfW, halfH);
    safeX = dry.x;
    safeY = dry.y;
  }

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cx = boundX(sx + (tx - sx) * t);
    const cy = boundY(sy + (ty - sy) * t);
    if (isFootprintInWater(cx, cy, roomType, rx, ry)) {
      return { x: safeX, y: safeY, blockedByWater: true };
    }
    safeX = cx;
    safeY = cy;
  }

  return { x: safeX, y: safeY, blockedByWater: false };
}

