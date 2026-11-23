// ==========================================
// GlimmerFall Online 2D — Overland Mounts, Fog of War & Waypoint Shrines
// Phase 3 Exploration Systems built atop the unified (wx, wy) overworld grid
// ==========================================

import { localToWorld, isSurfaceRoomType, SURFACE_ROOM_TYPES } from './overworldGrid.js';
import { ROOM_TYPES } from './rooms.js';

export const MOUNT_CAST_DURATION_SEC = 1.5;
export const MOUNT_SPEED_MULT = 1.48; // +48% overland movement speed
export const EXPLORATION_CHUNK_PX = 384;
export const MAX_DISCOVERED_CHUNKS = 800;

export const MOUNTS_CATALOG = {
  starlight_charger: {
    id: 'starlight_charger',
    name: 'Starlight Charger',
    faction: 'Solari',
    subtitle: 'Celestial Dawn Steed',
    speedMult: MOUNT_SPEED_MULT,
    castSec: MOUNT_CAST_DURATION_SEC,
    primaryColor: '#facc15',
    trimColor: '#fef08a',
    darkColor: '#b45309',
  },
  voidfang_prowler: {
    id: 'voidfang_prowler',
    name: 'Voidfang Prowler',
    faction: 'Umbri',
    subtitle: 'Duskveil Shadow Panther',
    speedMult: MOUNT_SPEED_MULT,
    castSec: MOUNT_CAST_DURATION_SEC,
    primaryColor: '#a855f7',
    trimColor: '#e879f9',
    darkColor: '#4c1d95',
  },
  ironwood_elk: {
    id: 'ironwood_elk',
    name: 'Ironwood Elk',
    faction: 'Terra',
    subtitle: 'Ancient Antlered Stag',
    speedMult: MOUNT_SPEED_MULT,
    castSec: MOUNT_CAST_DURATION_SEC,
    primaryColor: '#22c55e',
    trimColor: '#86efac',
    darkColor: '#14532d',
  },
  chrono_drake: {
    id: 'chrono_drake',
    name: 'Chrono Drake',
    faction: 'Aether',
    subtitle: 'Astral Continuum Drake',
    speedMult: MOUNT_SPEED_MULT,
    castSec: MOUNT_CAST_DURATION_SEC,
    primaryColor: '#38bdf8',
    trimColor: '#bae6fd',
    darkColor: '#0c4a6e',
  },
};

const FACTION_DEFAULT_MOUNTS = {
  Solari: 'starlight_charger',
  Umbri: 'voidfang_prowler',
  Terra: 'ironwood_elk',
  Aether: 'chrono_drake',
};

export function getDefaultMountIdForFaction(faction = 'Solari') {
  return FACTION_DEFAULT_MOUNTS[faction] || 'starlight_charger';
}

export function canRideMountInRoom(roomType) {
  return isSurfaceRoomType(roomType);
}

export function getMountSpeedBonus(mountId, roomType) {
  if (!mountId || !canRideMountInRoom(roomType)) return 1.0;
  return MOUNTS_CATALOG[mountId]?.speedMult || 1.0;
}

const RAW_WAYPOINT_SHRINES = [
  { id: 'wp_sanctuary_hub', name: 'Sanctuary Plaza Waystone', roomType: ROOM_TYPES.SANCTUARY_HUB, lx: 0, ly: -86, defaultUnlocked: true },
  { id: 'wp_solari_citadel', name: 'Solari Dawnspire Gate', roomType: ROOM_TYPES.SOLARI_CITADEL, lx: 0, ly: 132 },
  { id: 'wp_umbri_undercity', name: 'Umbri Sepulcher Crossing', roomType: ROOM_TYPES.UMBRI_UNDERCITY, lx: 0, ly: 132 },
  { id: 'wp_terra_orchard', name: 'Terra Ironwood Heart', roomType: ROOM_TYPES.TERRA_ORCHARD, lx: 0, ly: 132 },
  { id: 'wp_aether_spire', name: 'Aether Observatory Terrace', roomType: ROOM_TYPES.AETHER_SPIRE, lx: 0, ly: 132 },
  { id: 'wp_forgotten_ruins', name: 'First Nexus Waystone', roomType: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, lx: 0, ly: 120 },
  { id: 'wp_nexus_warzone', name: 'Caldera Warfront Beacon', roomType: ROOM_TYPES.NEXUS_WARZONE, lx: 0, ly: 310 },
  { id: 'wp_celestial_ascent', name: 'Titan Summit Anchor', roomType: ROOM_TYPES.CELESTIAL_ASCENT, lx: 0, ly: 160 },
  { id: 'wp_abyssal_rift', name: 'Abyssal Brink Waystone', roomType: ROOM_TYPES.ABYSSAL_RIFT, lx: 0, ly: 160 },
  { id: 'wp_ironwood_timberlands', name: 'Ironwood Camp Waypoint', roomType: ROOM_TYPES.IRONWOOD_TIMBERLANDS, lx: 0, ly: 120 },
  { id: 'wp_coral_coast', name: 'Coral Boardwalk Beacon', roomType: ROOM_TYPES.CORAL_COAST, lx: 0, ly: -156 },
  { id: 'wp_sunken_oasis', name: 'Luminous Oasis Waystone', roomType: ROOM_TYPES.SUNKEN_OASIS, lx: 0, ly: 120 },
  { id: 'wp_solar_highlands', name: 'Sunspire Ridge Waystone', roomType: ROOM_TYPES.SOLAR_HIGHLANDS, lx: 0, ly: 120 },
  { id: 'wp_moonwell_sanctum', name: 'Silvermist Moonwell Stone', roomType: ROOM_TYPES.MOONWELL_SANCTUM, lx: 0, ly: 120 },
  { id: 'wp_frostspire_glacier', name: 'Frostspire Summit Anchor', roomType: ROOM_TYPES.FROSTSPIRE_GLACIER, lx: 0, ly: 120 },
  { id: 'wp_starfall_crater', name: 'Starfall Basin Waystone', roomType: ROOM_TYPES.STARFALL_CRATER, lx: 0, ly: 120 },
  { id: 'wp_starlight_grove', name: 'Starlight Canopy Anchor', roomType: ROOM_TYPES.STARLIGHT_GROVE, lx: 0, ly: 120 },
  { id: 'wp_chronocore_citadel', name: 'Chronocore Temporal Beacon', roomType: ROOM_TYPES.CHRONOCORE_CITADEL, lx: 0, ly: 120 },
];

export const WAYPOINT_SHRINES_CATALOG = RAW_WAYPOINT_SHRINES.map((entry) => {
  const world = localToWorld(entry.roomType, entry.lx, entry.ly);
  return {
    ...entry,
    wx: Math.round(world.wx),
    wy: Math.round(world.wy),
  };
});

export const WAYPOINT_SHRINES_BY_ID = Object.fromEntries(
  WAYPOINT_SHRINES_CATALOG.map((w) => [w.id, w])
);

export function normalizeExplorationState(raw = null, faction = null) {
  const defaultMount = faction ? getDefaultMountIdForFaction(faction) : null;
  const src = raw && typeof raw === 'object' ? raw : {};

  const mountSet = new Set(defaultMount ? [defaultMount] : []);
  if (Array.isArray(src.unlockedMountIds)) {
    for (const id of src.unlockedMountIds) {
      if (MOUNTS_CATALOG[id]) mountSet.add(id);
    }
  }
  const preferredMountId = (src.preferredMountId && MOUNTS_CATALOG[src.preferredMountId] && mountSet.has(src.preferredMountId))
    ? src.preferredMountId
    : (defaultMount || Array.from(mountSet)[0] || null);

  const zoneSet = new Set([ROOM_TYPES.SANCTUARY_HUB]);
  if (Array.isArray(src.discoveredZones)) {
    for (const z of src.discoveredZones) {
      if (typeof z === 'string' && z.length <= 64) zoneSet.add(z);
    }
  }

  const chunkSet = new Set(['0,0']);
  if (Array.isArray(src.discoveredChunks)) {
    for (const c of src.discoveredChunks) {
      if (typeof c === 'string' && /^-?\d+,-?\d+$/.test(c)) {
        chunkSet.add(c);
        if (chunkSet.size >= MAX_DISCOVERED_CHUNKS) break;
      }
    }
  }

  const shrineSet = new Set(['wp_sanctuary_hub']);
  if (Array.isArray(src.unlockedShrines)) {
    for (const sid of src.unlockedShrines) {
      if (WAYPOINT_SHRINES_BY_ID[sid]) shrineSet.add(sid);
    }
  }

  return {
    unlockedMountIds: Array.from(mountSet),
    preferredMountId,
    discoveredZones: Array.from(zoneSet),
    discoveredChunks: Array.from(chunkSet),
    unlockedShrines: Array.from(shrineSet),
  };
}

export function revealFogOfWarAt(explorationState, wx, wy, roomType, radiusChunks = 1, faction = 'Solari') {
  const state = normalizeExplorationState(explorationState, faction);
  let changed = false;
  let newlyDiscoveredZone = null;
  const addedChunks = [];

  if (roomType && !state.discoveredZones.includes(roomType)) {
    state.discoveredZones.push(roomType);
    newlyDiscoveredZone = roomType;
    changed = true;
  }

  if (isSurfaceRoomType(roomType) && Number.isFinite(Number(wx)) && Number.isFinite(Number(wy))) {
    const cx = Math.floor(Number(wx) / EXPLORATION_CHUNK_PX);
    const cy = Math.floor(Number(wy) / EXPLORATION_CHUNK_PX);
    const existing = new Set(state.discoveredChunks);
    for (let dy = -radiusChunks; dy <= radiusChunks; dy++) {
      for (let dx = -radiusChunks; dx <= radiusChunks; dx++) {
        if (existing.size >= MAX_DISCOVERED_CHUNKS) break;
        const key = `${cx + dx},${cy + dy}`;
        if (!existing.has(key)) {
          existing.add(key);
          state.discoveredChunks.push(key);
          addedChunks.push(key);
          changed = true;
        }
      }
    }
  }

  return {
    state,
    changed,
    newlyDiscoveredZone,
    addedChunks,
    totalSurfaceZones: SURFACE_ROOM_TYPES.size,
  };
}

export function findNearestWaypointShrine(wx, wy, maxRadius = 135) {
  const px = Number(wx);
  const py = Number(wy);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  let best = null;
  let bestDist = maxRadius;
  for (const wp of WAYPOINT_SHRINES_CATALOG) {
    const d = Math.hypot(wp.wx - px, wp.wy - py);
    if (d <= bestDist) {
      bestDist = d;
      best = wp;
    }
  }
  return best;
}
