// ==========================================
// GlimmerFall Online 2D — Tile Selector & Chunk Canvas Cache
// Extracted from client/game.js for modular maintainability
// ==========================================

import {
  TILE_SIZE,
  ROOM_TYPES,
  ROOM_CONFIGS,
  SURFACE_ZONE_PLACEMENT,
  SURFACE_TRANSITION_CORRIDORS,
  isSurfaceRoomType,
  getRegionAtWorldPos,
  isWalkableSurfacePos,
  isCoralCoastPierTile,
  isCoralCoastDeepSeaTile,
  isInteriorVoidTile,
  isInteriorPartitionWallTile,
  isInteriorGardenTile,
} from '../../shared/protocol.js';
import { drawTileChunkTransitions } from '../render/autoTiler.js';

export function createTileMapRenderer({
  sprites,
  getMapBounds,
  getCurrentRoomType,
  getCurrentBiomeTheme,
  getGlobalTime,
}) {
  function pickSurfaceBiomeGround(zoneType, tx, ty) {
    const theme = ROOM_CONFIGS[zoneType]?.biomeTheme || 'sanctuary';
    const h = Math.abs(tx * 11 + ty * 17);
    if (theme === 'sanctuary') return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`];
    if (theme === 'ruins') {
      if (tx < 0 && ty < 0) return sprites.tiles[`terra_${Math.abs(tx * 7 + ty * 11) % 4}`];
      if (tx > 0 && ty < 0) return sprites.tiles[`umbri_${Math.abs(tx * 7 + ty * 11) % 4}`];
      if (tx < 0 && ty > 0) return sprites.tiles[`solari_${Math.abs(tx * 7 + ty * 11) % 4}`];
      return sprites.tiles[`aether_${Math.abs(tx * 7 + ty * 11) % 4}`];
    }
    if (theme === 'terra_grove') return sprites.tiles[`terra_${h % 4}`] || sprites.tiles.sanctuary_grass_0;
    if (theme === 'aether_archive') return sprites.tiles[`aether_${h % 4}`] || sprites.tiles.flagstone_0;
    if (theme === 'starfall') return sprites.tiles[`starfall_${h % 4}`] || sprites.tiles.solari_0;
    if (theme === 'abyssal') return sprites.tiles[`abyssal_${h % 4}`] || sprites.tiles.umbri_0;
    if (theme === 'frost') return sprites.tiles[`frost_${h % 4}`] || sprites.tiles.aether_0;
    if (theme === 'celestial') return sprites.tiles[`celestial_floor_${h % 4}`] || sprites.tiles.aether_0 || sprites.tiles.flagstone_0;
    if (theme === 'warzone') return sprites.tiles[`warzone_${h % 4}`] || sprites.tiles.flagstone_0;
    return sprites.tiles[`${theme}_${h % 4}`] || sprites.tiles.sanctuary_grass_0 || sprites.tiles.flagstone_0;
  }

  function pickLocalZoneTile(roomType, biomeTheme, halfW, halfH, tx, ty, globalTime, openRim = false) {
    const wx = tx * TILE_SIZE;
    const wy = ty * TILE_SIZE;

    if (roomType === ROOM_TYPES.CORAL_COAST) {
      if (isCoralCoastPierTile(tx, ty)) {
        return sprites.tiles[`bridge_wood_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      if (isCoralCoastDeepSeaTile(tx, ty)) {
        const waterFrame = Math.floor(globalTime * 2.2 + (tx + ty) * 0.25) % 2;
        return sprites.tiles[`river_water_${Math.abs(waterFrame)}`];
      }
    }

    const isAtCenterGate = (Math.abs(tx) <= 2 && (wy === -halfH || wy === halfH - TILE_SIZE)) ||
                           (Math.abs(ty) <= 2 && (wx === -halfW || wx === halfW - TILE_SIZE));

    const onRim = !openRim && (
      wx === -halfW || wx === halfW - TILE_SIZE ||
      wy === -halfH || wy === halfH - TILE_SIZE
    );

    if (onRim) {
      if (isAtCenterGate) return sprites.tiles.flagstone_1 || sprites.tiles.flagstone_0;
      return sprites.tiles.mountain_rock_0 || sprites.tiles.flagstone_0;
    }

    if (biomeTheme === 'sanctuary') {
      if (Math.abs(tx) <= 7 && ty >= -6 && ty <= 9) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      if (Math.abs(tx) <= 11 && ty >= -12 && ty <= -6) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      if (tx >= -16 && tx <= -7 && ty >= -5 && ty <= 6) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      if (tx >= 7 && tx <= 16 && ty >= -4 && ty <= 5) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`];
    }

    if (biomeTheme === 'arena') {
      if (Math.abs(tx) <= 2) return sprites.tiles.flagstone_1;
      if (wy > 64) return sprites.tiles.arena_blue;
      if (wy < -64) return sprites.tiles.arena_red;
      return sprites.tiles.arena_neutral;
    }

    if (biomeTheme === 'ruins') {
      if (isInteriorPartitionWallTile(tx, ty, roomType)) {
        return sprites.tiles[`interior_wall_${Math.abs(tx + ty) % 2}`] || sprites.tiles.mountain_rock_0 || sprites.tiles.flagstone_0;
      }
      if (tx >= 11 && tx <= 14 && ty >= -17 && ty <= -15) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      return pickSurfaceBiomeGround(roomType, tx, ty);
    }

    if (biomeTheme === 'solari_vault') {
      if (Math.abs(tx) <= 3 && Math.abs(ty) <= 3) return sprites.tiles[`flagstone_${Math.abs(tx * 3 + ty * 5) % 2}`];
      if ((Math.abs(tx) + Math.abs(ty)) % 5 === 0 || Math.abs(tx) <= 1) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      return sprites.tiles[`solari_${Math.abs(tx * 11 + ty * 17) % 4}`];
    }

    if (biomeTheme === 'umbri_labyrinth') {
      const cellX = Math.floor(tx / 4);
      const cellY = Math.floor(ty / 4);
      if ((cellX + cellY) % 2 === 0 || Math.abs(tx) <= 1 || Math.abs(ty) <= 1) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      return sprites.tiles[`umbri_${Math.abs(tx * 13 + ty * 19) % 4}`];
    }

    if (biomeTheme === 'terra_grove') {
      const d2 = tx * tx + ty * ty;
      if ((d2 >= 25 && d2 <= 49) || (d2 >= 144 && d2 <= 196) || Math.abs(tx) <= 1 || Math.abs(ty) <= 1) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      if (d2 < 25) return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`] || sprites.tiles.flagstone_0;
      return sprites.tiles[`terra_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
    }

    if (biomeTheme === 'aether_archive') {
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return sprites.tiles.flagstone_1 || sprites.tiles.flagstone_0;
      if (Math.abs(tx) % 6 <= 1 && Math.abs(ty) % 6 <= 1) return sprites.tiles[`void_sea_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      return sprites.tiles[`aether_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
    }

    if (biomeTheme === 'starfall') {
      const d2 = tx * tx + ty * ty;
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2 || (d2 >= 64 && d2 <= 100)) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      return sprites.tiles[`starfall_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.solari_0 || sprites.tiles.flagstone_0;
    }

    if (biomeTheme === 'abyssal') {
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return sprites.tiles.flagstone_1 || sprites.tiles.flagstone_0;
      if (Math.abs(tx) % 8 === 4 && Math.abs(ty) % 8 === 4 && Math.abs(tx) > 5 && Math.abs(ty) > 5) return sprites.tiles[`void_sea_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      return sprites.tiles[`abyssal_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.umbri_0 || sprites.tiles.flagstone_0;
    }

    if (biomeTheme === 'frost') {
      const d2 = tx * tx + ty * ty;
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      if (d2 >= 16 && d2 <= 36) return sprites.tiles[`frost_ice_${Math.abs(tx + ty) % 2}`] || sprites.tiles.frost_0;
      return sprites.tiles[`frost_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.aether_0 || sprites.tiles.flagstone_0;
    }

    if (['solari', 'umbri', 'terra', 'aether'].includes(biomeTheme)) {
      if (
        (Math.abs(tx) <= 5 && Math.abs(ty) <= 5) ||
        (tx >= -14 && tx <= -6 && ty >= 0 && ty <= 6) ||
        (tx >= 9 && tx <= 14 && ty >= -10 && ty <= -4) ||
        Math.abs(tx) <= 2 ||
        Math.abs(ty) <= 2
      ) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      return sprites.tiles[`${biomeTheme}_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.warzone_0 || sprites.tiles.flagstone_0;
    }

    // NEXUS_WARZONE / CELESTIAL_ASCENT
    const southRiverY = 77 + Math.round(Math.sin(tx * 0.08) * 2.5);
    const isSouthRiver = Math.abs(ty - southRiverY) <= 1;
    const streamX = -65 + Math.round(Math.cos(ty * 0.08) * 4);
    const isNWStream = tx >= streamX - 1 && tx <= streamX + 1 && ty >= -85 && ty <= 20;
    const isMainSouthBridge = isSouthRiver && Math.abs(tx) <= 3;
    const isWestTimberBridge = isSouthRiver && Math.abs(tx - (-80)) <= 2;
    const isEastTimberBridge = isSouthRiver && Math.abs(tx - 80) <= 2;
    const isNWGorgeBridge = isNWStream && Math.abs(ty - (-35)) <= 2;
    if (isMainSouthBridge || isWestTimberBridge || isEastTimberBridge || isNWGorgeBridge) {
      return sprites.tiles[`bridge_wood_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    }
    if (isSouthRiver || isNWStream) {
      const waterFrame = Math.floor(globalTime * 2.2 + (tx + ty) * 0.25) % 2;
      return sprites.tiles[`river_water_${Math.abs(waterFrame)}`];
    }
    const passCurveX = Math.round(Math.sin(ty * 0.07) * 7);
    if (ty >= 22 && ty <= 70 && Math.abs(tx - passCurveX) <= 3) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    if (Math.abs(Math.abs(tx) - Math.abs(ty)) <= 1 && Math.abs(tx) >= 14 && Math.abs(tx) <= 75) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    if (ty >= 70) return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`];
    if (ty >= 22 && ty < 70) {
      if (Math.abs(tx) >= 55 || (Math.abs(tx) >= 28 && ((tx * 3 + ty * 5) % 7 === 0))) return sprites.tiles[`mountain_peak_${Math.abs(tx * 7 + ty * 11) % 4}`];
      return sprites.tiles[`mountain_rock_${Math.abs(tx * 11 + ty * 17) % 4}`];
    }
    if (ty <= -22 && Math.abs(tx) <= 26) return sprites.tiles[`flagstone_${Math.abs(tx * 3 + ty * 5) % 2}`] || sprites.tiles.flagstone_0;
    if (Math.abs(tx) <= 18 && Math.abs(ty) <= 16) return sprites.tiles[`warzone_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
    if (tx < -14 && ty < -8) return sprites.tiles[`terra_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    if (tx > 14 && ty < -8) return sprites.tiles[`umbri_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    if (tx < -14 && ty >= -8 && ty < 70) return sprites.tiles[`solari_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    if (tx > 14 && ty >= -8 && ty < 70) return sprites.tiles[`aether_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    return sprites.tiles[`warzone_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
  }

  function isOpenCorridorMouthTile(wx, wy) {
    for (const cor of SURFACE_TRANSITION_CORRIDORS) {
      if (wx >= cor.minX - 16 && wx <= cor.maxX + 16 && wy >= cor.minY - 16 && wy <= cor.maxY + 16) {
        return true;
      }
    }
    return false;
  }

  function pickTile(tx, ty) {
    const mapBounds = getMapBounds();
    const currentRoomType = getCurrentRoomType();
    const currentBiomeTheme = getCurrentBiomeTheme();
    const globalTime = getGlobalTime();
    const wx = tx * TILE_SIZE;
    const wy = ty * TILE_SIZE;

    if (currentBiomeTheme.startsWith('interior_')) {
      if (wx < -mapBounds.halfW || wx >= mapBounds.halfW || wy < -mapBounds.halfH || wy >= mapBounds.halfH) {
        const voidIdx = Math.abs(tx * 3 + ty * 5) % 2;
        return sprites.tiles[`interior_void_${voidIdx}`] || sprites.tiles.void_sea_0;
      }
      if (isInteriorVoidTile(tx, ty, currentRoomType)) {
        const voidIdx = Math.abs(tx * 3 + ty * 5) % 2;
        return sprites.tiles[`interior_void_${voidIdx}`] || sprites.tiles.void_sea_0;
      }
      const minInteriorY = Math.ceil(-mapBounds.halfH / TILE_SIZE) * TILE_SIZE;
      const maxInteriorY = Math.floor((mapBounds.halfH - TILE_SIZE) / TILE_SIZE) * TILE_SIZE;
      if (wy === maxInteriorY && Math.abs(tx) <= 1) {
        return sprites.tiles.interior_doormat || sprites.tiles.flagstone_1;
      }
      const isNorthWall = wy === minInteriorY || wy === minInteriorY + TILE_SIZE;
      const isSideOrSouthWall = wx === -mapBounds.halfW || wx === mapBounds.halfW - TILE_SIZE || wy === maxInteriorY;
      if (isNorthWall || isSideOrSouthWall || isInteriorPartitionWallTile(tx, ty, currentRoomType)) {
        return sprites.tiles[`interior_wall_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      if (isInteriorGardenTile(tx, ty, currentRoomType)) {
        if (Math.abs(tx) <= 1) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
        return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`] || sprites.tiles.flagstone_0;
      }
      if (currentRoomType === ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY && ty <= -4) {
        return sprites.tiles[`interior_stone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      const carpetColor =
        currentBiomeTheme === 'interior_tavern' ? 'red' :
        currentBiomeTheme === 'interior_vault' || currentBiomeTheme === 'interior_aether' ? 'blue' :
        currentBiomeTheme === 'interior_terra' ? 'green' :
        currentBiomeTheme === 'interior_umbri' ? 'purple' : 'red';
      if ((Math.abs(tx) <= 4 && ty >= -4 && ty <= 5) || (Math.abs(tx) <= 1 && ty >= 5)) {
        return sprites.tiles[`interior_carpet_${carpetColor}`] || sprites.tiles.flagstone_1;
      }
      const useStone = currentBiomeTheme === 'interior_vault' || currentBiomeTheme === 'interior_solari' || currentBiomeTheme === 'interior_aether';
      return sprites.tiles[`${useStone ? 'interior_stone' : 'interior_wood'}_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    }

    // Path B Unified Surface Overworld (continuous 2D Euclidean continent + 20-tile transitioning buffers)
    if (isSurfaceRoomType(currentRoomType)) {
      if (!isWalkableSurfacePos(wx + 8, wy + 8, 0)) {
        const seaIdx = Math.abs(tx * 3 + ty * 5) % 2;
        return sprites.tiles[`void_sea_${seaIdx}`];
      }
      const reg = getRegionAtWorldPos(wx + 8, wy + 8, currentRoomType);
      if (reg.inTransition && reg.corridor) {
        const cor = reg.corridor;
        const perpDist = cor.axis === 'x' ? Math.abs(wy + 8 - cor.midY) : Math.abs(wx + 8 - cor.midX);
        if (perpDist <= 32) {
          return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
        }
        // 16-24 tile transitioning biome organic Bayer feathering
        const smoothT = reg.blendT * reg.blendT * (3 - 2 * reg.blendT);
        const cellHash = (Math.abs(tx * 73856093 ^ ty * 19349663) % 1000) / 1000;
        const chosenBiome = cellHash < smoothT ? cor.toRoom : cor.fromRoom;
        return pickSurfaceBiomeGround(chosenBiome, tx, ty);
      }

      const place = SURFACE_ZONE_PLACEMENT[reg.roomType];
      const zCfg = ROOM_CONFIGS[reg.roomType];
      if (place && zCfg) {
        const ltx = Math.floor((wx - place.originX) / TILE_SIZE);
        const lty = Math.floor((wy - place.originY) / TILE_SIZE);
        const openRim = isOpenCorridorMouthTile(wx + 8, wy + 8);
        return pickLocalZoneTile(reg.roomType, zCfg.biomeTheme, zCfg.halfW, zCfg.halfH, ltx, lty, globalTime, openRim);
      }
    }

    // Standalone Entered Realms (CrystalEcho Caverns, Arena 3v3, 4 Mythic Keystone Crypts)
    if (wx < -mapBounds.halfW || wx >= mapBounds.halfW || wy < -mapBounds.halfH || wy >= mapBounds.halfH) {
      const seaIdx = Math.abs(tx * 3 + ty * 5) % 2;
      return sprites.tiles[`void_sea_${seaIdx}`];
    }
    return pickLocalZoneTile(currentRoomType, currentBiomeTheme, mapBounds.halfW, mapBounds.halfH, tx, ty, globalTime, false);
  }
  // Static ground is baked into 256px chunk canvases once per room. This collapses
  // roughly a thousand per-frame tile blits into ~20 cached chunk blits.
  const TILE_CHUNK_TILES = 16;
  const TILE_CHUNK_PX = TILE_CHUNK_TILES * TILE_SIZE;
  const tileChunkCache = new Map();
  let tileChunkRoomKey = '';
  let animatedWaterTiles = null;

  const tileSpriteMetaMap = new WeakMap();
  if (sprites?.tiles) {
    for (const [key, tileCanvas] of Object.entries(sprites.tiles)) {
      if (!tileCanvas || typeof tileCanvas !== 'object') continue;
      let meta;
      if (key.startsWith('void_sea_') || key.startsWith('interior_void_')) {
        meta = { category: 'void_sea', biome: 'void', isWall: true };
      } else if (key.startsWith('river_water_')) {
        meta = { category: 'water', biome: 'water', isWall: false };
      } else if (key.startsWith('bridge_wood_')) {
        meta = { category: 'bridge', biome: 'bridge', isWall: false };
      } else if (key.startsWith('flagstone_') || key.startsWith('celestial_road_')) {
        meta = { category: 'road', biome: 'road', isWall: false };
      } else if (key.startsWith('mountain_rock_') || key.startsWith('mountain_peak_')) {
        meta = { category: 'mountain', biome: 'mountain', isWall: true };
      } else if (key.startsWith('sanctuary_grass_')) {
        meta = { category: 'grass', biome: 'grass', isWall: false };
      } else if (key.startsWith('interior_')) {
        meta = { category: 'interior', biome: 'interior', isWall: key.startsWith('interior_wall_') };
      } else {
        const biomePrefix = key.split('_')[0];
        meta = { category: 'biome', biome: biomePrefix, isWall: false };
      }
      tileSpriteMetaMap.set(tileCanvas, meta);
    }
  }
  const DEFAULT_META_FALLBACK = { category: 'biome', biome: 'grass', isWall: false };
  function getTileMeta(tx, ty) {
    const t = pickTile(tx, ty);
    return (t && tileSpriteMetaMap.get(t)) || DEFAULT_META_FALLBACK;
  }

  function getTileChunk(chunkX, chunkY) {
    const key = `${tileChunkRoomKey}:${chunkX},${chunkY}`;
    const cached = tileChunkCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = TILE_CHUNK_PX;
    canvas.height = TILE_CHUNK_PX;
    const cctx = canvas.getContext('2d');
    cctx.imageSmoothingEnabled = false;

    if (!animatedWaterTiles) {
      animatedWaterTiles = new Set(
        [sprites.tiles.river_water_0, sprites.tiles.river_water_1].filter(Boolean)
      );
    }

    const water = [];
    for (let ty = 0; ty < TILE_CHUNK_TILES; ty++) {
      for (let tx = 0; tx < TILE_CHUNK_TILES; tx++) {
        const tile = pickTile(chunkX * TILE_CHUNK_TILES + tx, chunkY * TILE_CHUNK_TILES + ty);
        if (!tile) continue;
        cctx.drawImage(tile, tx * TILE_SIZE, ty * TILE_SIZE);
        if (animatedWaterTiles.has(tile)) water.push({ tx, ty });
      }
    }

    drawTileChunkTransitions({
      cctx,
      chunkX,
      chunkY,
      tileChunkTiles: TILE_CHUNK_TILES,
      tileSize: TILE_SIZE,
      getTileMeta,
      sprites,
    });

    const chunk = { canvas, water };
    if (tileChunkCache.size >= 192) tileChunkCache.clear();
    tileChunkCache.set(key, chunk);
    return chunk;
  }


  function ensureTileChunkRoom(roomKey) {
    if (roomKey !== tileChunkRoomKey) {
      tileChunkRoomKey = roomKey;
      tileChunkCache.clear();
    }
  }

  return {
    TILE_CHUNK_TILES,
    TILE_CHUNK_PX,
    pickTile,
    getTileMeta,
    getTileChunk,
    ensureTileChunkRoom,
  };
}
