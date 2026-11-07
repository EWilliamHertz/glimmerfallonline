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

