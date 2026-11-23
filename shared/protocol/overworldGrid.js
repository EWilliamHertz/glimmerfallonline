// ==========================================
// GlimmerFall Online 2D — Unified Overworld Grid & Transitioning Buffer Zones
// Path B: Single continuous Euclidean surface coordinate space (wx, wy)
// Keeps building interiors, Arena 3v3, Mythic Crypts, and CrystalEcho Caverns separate
// ==========================================

import { TILE_SIZE } from './constants.js';

export const TRANSITION_BUFFER_TILES = 20; // 16-24 tile transitioning buffer biome strip
export const TRANSITION_BUFFER_PX = TRANSITION_BUFFER_TILES * TILE_SIZE; // 320px
export const CORRIDOR_HALF_WIDTH_PX = 192; // 24-tile wide seamless overland crossing avenue

export const SURFACE_ROOM_TYPES = new Set([
  'sanctuary_hub',
  'aether_spire',
  'nexus_forgotten_ruins',
  'nexus_warzone',
  'celestial_ascent',
  'chronocore_citadel',
  'abyssal_rift',
  'starfall_crater',
  'solari_citadel',
  'umbri_undercity',
  'terra_orchard',
  'solar_highlands',
  'coral_coast',
  'ironwood_timberlands',
  'starlight_grove',
  'sunken_oasis',
  'frostspire_glacier',
  'moonwell_sanctum',
]);

export const ENTERED_ROOM_TYPES = new Set([
  'luminous_cavern',
  'arena_3v3',
  'primeval_nexus_raid',
  'solari_sunken_vault',
  'umbri_shadow_labyrinth',
  'terra_overgrowth_sanctuary',
  'aether_fractured_archive',
  'interior_tavern',
  'interior_bank_vault',
  'interior_sanctuary_cottage',
  'interior_guild_hall',
  'interior_tcg_pavilion',
  'interior_solari_smithy',
  'interior_terra_apothecary',
  'interior_umbri_parlor',
  'interior_aether_observatory',
  'interior_mariner_tavern',
]);

// Canonical non-overlapping Euclidean centers (originX, originY) anchored at SANCTUARY_HUB = (0, 0)
export const SURFACE_ZONE_DEFINITIONS = {
  sanctuary_hub:        { originX: 0,     originY: 0,     halfW: 576,  halfH: 512 },
  aether_spire:         { originX: 0,     originY: -1216, halfW: 384,  halfH: 384 },
  nexus_forgotten_ruins:{ originX: 0,     originY: -2352, halfW: 432,  halfH: 432 },
  starfall_crater:      { originX: -1392, originY: -2352, halfW: 640,  halfH: 640 },
  solari_citadel:       { originX: -1376, originY: 0,     halfW: 480,  halfH: 448 },
  umbri_undercity:      { originX: 1280,  originY: 0,     halfW: 384,  halfH: 384 },
  terra_orchard:        { originX: 0,     originY: 1216,  halfW: 384,  halfH: 384 },
  nexus_warzone:        { originX: 0,     originY: -5112, halfW: 2400, halfH: 1800 },
  celestial_ascent:     { originX: 0,     originY: -8352, halfW: 1120, halfH: 1120 },
  chronocore_citadel:   { originX: 2080,  originY: -8352, halfW: 640,  halfH: 640 },
  abyssal_rift:         { originX: 3440,  originY: -5112, halfW: 720,  halfH: 720 },
  solar_highlands:      { originX: -1296, originY: 1360,  halfW: 592,  halfH: 592 },
  coral_coast:          { originX: 1472,  originY: 1480,  halfW: 576,  halfH: 608 },
  ironwood_timberlands: { originX: 0,     originY: 2496,  halfW: 576,  halfH: 576 },
  starlight_grove:      { originX: -1504, originY: 2880,  halfW: 608,  halfH: 608 },
  sunken_oasis:         { originX: 1488,  originY: 2968,  halfW: 592,  halfH: 592 },
  moonwell_sanctum:     { originX: 0,     originY: 3984,  halfW: 592,  halfH: 592 },
  frostspire_glacier:   { originX: -1520, originY: 4416,  halfW: 608,  halfH: 608 },
};

export const SURFACE_ZONE_PLACEMENT = Object.fromEntries(
  Object.entries(SURFACE_ZONE_DEFINITIONS).map(([id, def]) => [
    id,
    {
      id,
      originX: def.originX,
      originY: def.originY,
      halfW: def.halfW,
      halfH: def.halfH,
      minX: def.originX - def.halfW,
      maxX: def.originX + def.halfW,
      minY: def.originY - def.halfH,
      maxY: def.originY + def.halfH,
    },
  ])
);

function buildCorridor(fromRoom, toRoom, axis, fixedCoord, minAlong, maxAlong, requestedHalfWidth = CORRIDOR_HALF_WIDTH_PX) {
  const isX = axis === 'x';
  const zA = SURFACE_ZONE_PLACEMENT[fromRoom];
  const zB = SURFACE_ZONE_PLACEMENT[toRoom];

  // Orient gradient strictly along ascending world coordinates: minRoom (t=0) -> maxRoom (t=1)
  const aIsMin = isX ? (zA.originX <= zB.originX) : (zA.originY <= zB.originY);
  const minRoom = aIsMin ? fromRoom : toRoom;
  const maxRoom = aIsMin ? toRoom : fromRoom;

  // Clamp perpendicular half-width safely inside the shared overlap of both zones so mouths never overhang
  let halfWidth = requestedHalfWidth;
  if (zA && zB) {
    const overlapMin = isX ? Math.max(zA.minY, zB.minY) : Math.max(zA.minX, zB.minX);
    const overlapMax = isX ? Math.min(zA.maxY, zB.maxY) : Math.min(zA.maxX, zB.maxX);
    const maxAllowed = Math.floor(Math.min(fixedCoord - overlapMin, overlapMax - fixedCoord) / 16) * 16;
    if (Number.isFinite(maxAllowed) && maxAllowed >= 48) {
      halfWidth = Math.max(48, Math.min(requestedHalfWidth, maxAllowed));
    }
  }

  return {
    id: `${fromRoom}__${toRoom}`,
    fromRoom,
    toRoom,
    minRoom,
    maxRoom,
    axis,
    halfWidth,
    minX: isX ? minAlong : fixedCoord - halfWidth,
    maxX: isX ? maxAlong : fixedCoord + halfWidth,
    minY: isX ? fixedCoord - halfWidth : minAlong,
    maxY: isX ? fixedCoord + halfWidth : maxAlong,
    midX: isX ? (minAlong + maxAlong) / 2 : fixedCoord,
    midY: isX ? fixedCoord : (minAlong + maxAlong) / 2,
  };
}

// All 24 walkable Transitioning Buffer Corridors linking adjacent surface biomes seamlessly
export const SURFACE_TRANSITION_CORRIDORS = [
  buildCorridor('sanctuary_hub', 'aether_spire', 'y', 0, -832, -512),
  buildCorridor('aether_spire', 'nexus_forgotten_ruins', 'y', 0, -1920, -1600),
  buildCorridor('nexus_forgotten_ruins', 'nexus_warzone', 'y', 0, -3312, -2784),
  buildCorridor('nexus_warzone', 'celestial_ascent', 'y', 0, -7232, -6912),
  buildCorridor('celestial_ascent', 'chronocore_citadel', 'x', -8352, 1120, 1440),
  buildCorridor('nexus_warzone', 'abyssal_rift', 'x', -5112, 2400, 2720),
  buildCorridor('starfall_crater', 'nexus_forgotten_ruins', 'x', -2352, -752, -432),
  buildCorridor('starfall_crater', 'solari_citadel', 'y', -1376, -1712, -448),
  buildCorridor('solari_citadel', 'sanctuary_hub', 'x', 0, -896, -576),
  buildCorridor('sanctuary_hub', 'umbri_undercity', 'x', 0, 576, 896),
  buildCorridor('sanctuary_hub', 'terra_orchard', 'y', 0, 512, 832),
  buildCorridor('solari_citadel', 'solar_highlands', 'y', -1376, 448, 768),
  buildCorridor('solar_highlands', 'terra_orchard', 'x', 1216, -704, -384),
  buildCorridor('umbri_undercity', 'coral_coast', 'y', 1472, 384, 872),
  buildCorridor('terra_orchard', 'coral_coast', 'x', 1216, 384, 896),
  buildCorridor('terra_orchard', 'ironwood_timberlands', 'y', 0, 1600, 1920),
  buildCorridor('ironwood_timberlands', 'coral_coast', 'x', 2004, 576, 896),
  buildCorridor('solar_highlands', 'starlight_grove', 'y', -1504, 1952, 2272),
  buildCorridor('starlight_grove', 'ironwood_timberlands', 'x', 2672, -896, -576),
  buildCorridor('ironwood_timberlands', 'sunken_oasis', 'x', 2724, 576, 896),
  buildCorridor('coral_coast', 'sunken_oasis', 'y', 1488, 2088, 2376),
  buildCorridor('starlight_grove', 'frostspire_glacier', 'y', -1520, 3488, 3808),
  buildCorridor('ironwood_timberlands', 'moonwell_sanctum', 'y', 0, 3072, 3392),
  buildCorridor('frostspire_glacier', 'moonwell_sanctum', 'x', 4200, -912, -592),
];

export const SURFACE_WORLD_BOUNDS = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const z of Object.values(SURFACE_ZONE_PLACEMENT)) {
    if (z.minX < minX) minX = z.minX;
    if (z.maxX > maxX) maxX = z.maxX;
    if (z.minY < minY) minY = z.minY;
    if (z.maxY > maxY) maxY = z.maxY;
  }
  const halfW = Math.max(Math.abs(minX), Math.abs(maxX)) + 160;
  const halfH = Math.max(Math.abs(minY), Math.abs(maxY)) + 160;
  return { minX, maxX, minY, maxY, halfW, halfH };
})();

export function isSurfaceRoomType(roomType) {
  return SURFACE_ROOM_TYPES.has(roomType);
}

export function isEnteredRealm(roomType) {
  return ENTERED_ROOM_TYPES.has(roomType);
}

export function localToWorld(roomType, lx = 0, ly = 0) {
  const z = SURFACE_ZONE_PLACEMENT[roomType];
  if (!z) return { wx: Number(lx) || 0, wy: Number(ly) || 0 };
  return {
    wx: z.originX + (Number(lx) || 0),
    wy: z.originY + (Number(ly) || 0),
  };
}

export function worldToLocal(roomType, wx = 0, wy = 0) {
  const z = SURFACE_ZONE_PLACEMENT[roomType];
  if (!z) return { lx: Number(wx) || 0, ly: Number(wy) || 0 };
  return {
    lx: (Number(wx) || 0) - z.originX,
    ly: (Number(wy) || 0) - z.originY,
  };
}

/**
 * Resolve which surface zone or transitioning buffer corridor owns `(wx, wy)`.
 * Also returns blend weights (`fromRoom`, `toRoom`, `blendT`) for smooth visual/tile blending across
 * 16-24 tile border strips.
 */
export function getRegionAtWorldPos(wx, wy, fallbackRoom = 'sanctuary_hub') {
  const px = Number(wx) || 0;
  const py = Number(wy) || 0;

  for (const cor of SURFACE_TRANSITION_CORRIDORS) {
    if (px >= cor.minX && px <= cor.maxX && py >= cor.minY && py <= cor.maxY) {
      const tRaw = cor.axis === 'x'
        ? (px - cor.minX) / Math.max(1, cor.maxX - cor.minX)
        : (py - cor.minY) / Math.max(1, cor.maxY - cor.minY);
      const t = Math.max(0, Math.min(1, tRaw));
      const roomType = t < 0.5 ? cor.minRoom : cor.maxRoom;
      const loc = worldToLocal(roomType, px, py);
      return {
        roomType,
        inTransition: true,
        fromRoom: cor.minRoom,
        toRoom: cor.maxRoom,
        blendT: t,
        corridor: cor,
        localX: loc.lx,
        localY: loc.ly,
      };
    }
  }

  for (const [id, z] of Object.entries(SURFACE_ZONE_PLACEMENT)) {
    if (px >= z.minX && px <= z.maxX && py >= z.minY && py <= z.maxY) {
      const loc = { lx: px - z.originX, ly: py - z.originY };
      return {
        roomType: id,
        inTransition: false,
        fromRoom: id,
        toRoom: id,
        blendT: 0,
        corridor: null,
        localX: loc.lx,
        localY: loc.ly,
      };
    }
  }

  // Fallback to closest biome if outside paved corridor margins
  let bestId = isSurfaceRoomType(fallbackRoom) ? fallbackRoom : 'sanctuary_hub';
  let bestDistSq = Infinity;
  for (const [id, z] of Object.entries(SURFACE_ZONE_PLACEMENT)) {
    const cx = Math.max(z.minX, Math.min(z.maxX, px));
    const cy = Math.max(z.minY, Math.min(z.maxY, py));
    const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestId = id;
    }
  }
  const loc = worldToLocal(bestId, px, py);
  return {
    roomType: bestId,
    inTransition: false,
    fromRoom: bestId,
    toRoom: bestId,
    blendT: 0,
    corridor: null,
    localX: loc.lx,
    localY: loc.ly,
  };
}

/**
 * Checks whether `(wx, wy)` stands inside walkable continent terrain (any surface zone core OR corridor).
 */
export function isWalkableSurfacePos(wx, wy, pad = 10) {
  const px = Number(wx);
  const py = Number(wy);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return false;

  for (const cor of SURFACE_TRANSITION_CORRIDORS) {
    const extMinX = cor.axis === 'x' ? cor.minX - 24 : cor.minX + 6;
    const extMaxX = cor.axis === 'x' ? cor.maxX + 24 : cor.maxX - 6;
    const extMinY = cor.axis === 'y' ? cor.minY - 24 : cor.minY + 6;
    const extMaxY = cor.axis === 'y' ? cor.maxY + 24 : cor.maxY - 6;
    if (px >= extMinX && px <= extMaxX && py >= extMinY && py <= extMaxY) {
      return true;
    }
  }

  for (const z of Object.values(SURFACE_ZONE_PLACEMENT)) {
    if (px >= z.minX + pad && px <= z.maxX - pad && py >= z.minY + pad && py <= z.maxY - pad) {
      return true;
    }
  }
  return false;
}

/**
 * Returns Euclidean distance in pixels outside the nearest walkable continent zone/corridor (0 if inside).
 * Used to taper soft grassland/border skirts cleanly before meeting the outer ocean.
 */
export function getDistanceOutsideWalkableSurface(wx, wy) {
  const px = Number(wx);
  const py = Number(wy);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return Infinity;
  let minD2 = Infinity;
  for (const z of Object.values(SURFACE_ZONE_PLACEMENT)) {
    const cx = Math.max(z.minX, Math.min(z.maxX, px));
    const cy = Math.max(z.minY, Math.min(z.maxY, py));
    const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (d2 === 0) return 0;
    if (d2 < minD2) minD2 = d2;
  }
  for (const cor of SURFACE_TRANSITION_CORRIDORS) {
    const cx = Math.max(cor.minX, Math.min(cor.maxX, px));
    const cy = Math.max(cor.minY, Math.min(cor.maxY, py));
    const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (d2 === 0) return 0;
    if (d2 < minD2) minD2 = d2;
  }
  return Math.sqrt(minD2);
}

/**
 * Enforces continent boundaries, Founder Astral Resonance Barriers, and water collision cleanly
 * along a movement vector from `(prevWx, prevWy)` to `(targetWx, targetWy)`.
 */
export function clampSurfacePosition(
  prevWx,
  prevWy,
  targetWx,
  targetWy,
  { founderChecker = null, founderRooms = null, isWaterAt = null } = {}
) {
  const sx = Number(prevWx) || 0;
  const sy = Number(prevWy) || 0;
  const tx = Number.isFinite(Number(targetWx)) ? Number(targetWx) : sx;
  const ty = Number.isFinite(Number(targetWy)) ? Number(targetWy) : sy;

  const canEnterZone = (roomType) => {
    if (!founderRooms || !founderRooms.has(roomType)) return true;
    return typeof founderChecker === 'function' ? Boolean(founderChecker(roomType)) : false;
  };

  let nextX = sx;
  let nextY = sy;

  const checkWalkableAndWater = (candX, candY) => {
    if (!isWalkableSurfacePos(candX, candY, 10)) return false;
    if (typeof isWaterAt === 'function' && isWaterAt(candX, candY)) return false;
    return true;
  };

  if (checkWalkableAndWater(tx, ty)) {
    nextX = tx;
    nextY = ty;
  } else if (checkWalkableAndWater(tx, sy)) {
    nextX = tx;
  } else if (checkWalkableAndWater(sx, ty)) {
    nextY = ty;
  }

  const destRegion = getRegionAtWorldPos(nextX, nextY);
  if (!canEnterZone(destRegion.roomType)) {
    return {
      x: sx,
      y: sy,
      region: getRegionAtWorldPos(sx, sy),
      blockedByBarrier: true,
      barrierRoomType: destRegion.roomType,
    };
  }

  return {
    x: nextX,
    y: nextY,
    region: destRegion,
    blockedByBarrier: false,
    barrierRoomType: null,
  };
}

/**
 * Deterministically migrates legacy character positions (`{ lastRoom/roomType, x, y }`) onto
 * unified Path B global surface `(worldX, worldY)` coordinates, leaving interiors/caverns/arena untouched.
 */
export function migrateLegacyPosition(pos = null, fallbackRoom = 'sanctuary_hub') {
  const rawRoom = pos?.roomType || pos?.lastRoom || fallbackRoom;
  const roomType = SURFACE_ZONE_PLACEMENT[rawRoom] || ENTERED_ROOM_TYPES.has(rawRoom)
    ? rawRoom
    : 'sanctuary_hub';

  if (isSurfaceRoomType(roomType)) {
    if (Number.isFinite(Number(pos?.worldX)) && Number.isFinite(Number(pos?.worldY))) {
      const wx = Number(pos.worldX);
      const wy = Number(pos.worldY);
      const region = getRegionAtWorldPos(wx, wy, roomType);
      return {
        roomType: region.roomType,
        x: Math.round(wx),
        y: Math.round(wy),
        worldX: Math.round(wx),
        worldY: Math.round(wy),
        migrated: false,
      };
    }
    const z = SURFACE_ZONE_PLACEMENT[roomType];
    const hasCoords = Number.isFinite(Number(pos?.x ?? pos?.lastX)) && Number.isFinite(Number(pos?.y ?? pos?.lastY));
    const lx = hasCoords
      ? Math.max(-z.halfW + 16, Math.min(z.halfW - 16, Number(pos?.x ?? pos?.lastX)))
      : 0;
    const ly = hasCoords
      ? Math.max(-z.halfH + 16, Math.min(z.halfH - 16, Number(pos?.y ?? pos?.lastY)))
      : 96;
    const worldPos = localToWorld(roomType, lx, ly);
    return {
      roomType,
      x: Math.round(worldPos.wx),
      y: Math.round(worldPos.wy),
      worldX: Math.round(worldPos.wx),
      worldY: Math.round(worldPos.wy),
      migrated: true,
    };
  }

  // Entered / Instanced realms preserve local room-space coordinates
  return {
    roomType,
    x: Number.isFinite(Number(pos?.x ?? pos?.lastX)) ? Math.round(Number(pos?.x ?? pos?.lastX)) : 0,
    y: Number.isFinite(Number(pos?.y ?? pos?.lastY)) ? Math.round(Number(pos?.y ?? pos?.lastY)) : 96,
    worldX: Number.isFinite(Number(pos?.worldX)) ? Math.round(Number(pos.worldX)) : undefined,
    worldY: Number.isFinite(Number(pos?.worldY)) ? Math.round(Number(pos.worldY)) : undefined,
    migrated: false,
  };
}
