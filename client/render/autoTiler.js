// ==========================================
// GlimmerFall Online — Deterministic Terrain Chunk Auto-Tiler
// Bakes terrain transitions, shoreline bank rims, and 2.5D cliff faces
// once per 16x16 tile chunk with zero per-frame object allocations.
// ==========================================

const NATURAL_TERRAIN_PALETTES = {
  grass: { dark: '#0f261f', mid: '#15342b', light: '#2b6a52', shadow: 'rgba(6, 12, 18, 0.32)' },
  sanctuary: { dark: '#0f261f', mid: '#15342b', light: '#2b6a52', shadow: 'rgba(6, 12, 18, 0.32)' },
  terra: { dark: '#0d1f10', mid: '#132a17', light: '#22c55e', shadow: 'rgba(6, 14, 8, 0.34)' },
  terra_grove: { dark: '#0d1f10', mid: '#132a17', light: '#22c55e', shadow: 'rgba(6, 14, 8, 0.34)' },
  solari: { dark: '#1c170d', mid: '#2d2618', light: '#713f12', shadow: 'rgba(12, 9, 4, 0.30)' },
  umbri: { dark: '#0c0717', mid: '#140d24', light: '#4c1d95', shadow: 'rgba(8, 4, 18, 0.36)' },
  umbri_labyrinth: { dark: '#0c0717', mid: '#140d24', light: '#4c1d95', shadow: 'rgba(8, 4, 18, 0.36)' },
  aether: { dark: '#07101f', mid: '#0b192e', light: '#132a4a', shadow: 'rgba(4, 10, 22, 0.34)' },
  aether_archive: { dark: '#07101f', mid: '#0b192e', light: '#132a4a', shadow: 'rgba(4, 10, 22, 0.34)' },
  starfall: { dark: '#0f0c19', mid: '#171324', light: '#31274a', shadow: 'rgba(8, 6, 16, 0.36)' },
  abyssal: { dark: '#070510', mid: '#0d091c', light: '#3b0764', shadow: 'rgba(5, 2, 12, 0.38)' },
};

const DEFAULT_TILE_META = { category: 'biome', biome: '', isWall: false };

function tileHash(x, y, seed) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function resolveNaturalPalette(meta) {
  if (!meta) return null;
  const cat = meta.category;
  if (cat === 'grass') {
    return NATURAL_TERRAIN_PALETTES[meta.biome] || NATURAL_TERRAIN_PALETTES.grass;
  }
  if (cat === 'biome') {
    return NATURAL_TERRAIN_PALETTES[meta.biome] || null;
  }
  return NATURAL_TERRAIN_PALETTES[cat] || null;
}

function isAquatic(meta) {
  return Boolean(meta && (meta.category === 'water' || meta.category === 'void_sea'));
}

function isShoreLand(meta) {
  return Boolean(meta && !isAquatic(meta) && meta.category !== 'interior' && meta.category !== 'bridge');
}

function isMountain(meta) {
  return Boolean(meta && meta.category === 'mountain');
}

function isWalkableGround(meta) {
  return Boolean(
    meta &&
    !isMountain(meta) &&
    !meta.isWall &&
    meta.category !== 'void_sea' &&
    meta.category !== 'interior'
  );
}

function drawRoadOverhangEdge(cctx, px, py, tileSize, wxTile, wyTile, side, palette) {
  // side: 0=N, 1=S, 2=W, 3=E
  const seedBase = side * 31 + 7;
  for (let i = 0; i < tileSize; i++) {
    const h = tileHash(wxTile, wyTile, seedBase + i * 3);
    if (h > 0.74) continue;
    const depth = h < 0.38 ? 2 : 1;
    const accent = h < 0.16;

    if (side === 0) {
      cctx.fillStyle = palette.shadow;
      cctx.fillRect(px + i, py + depth, 1, 1);
      cctx.fillStyle = accent ? palette.light : palette.mid;
      cctx.fillRect(px + i, py, 1, depth);
      if (depth === 2 && !accent) {
        cctx.fillStyle = palette.dark;
        cctx.fillRect(px + i, py + 1, 1, 1);
      }
    } else if (side === 1) {
      cctx.fillStyle = palette.shadow;
      cctx.fillRect(px + i, py + tileSize - depth - 1, 1, 1);
      cctx.fillStyle = accent ? palette.light : palette.mid;
      cctx.fillRect(px + i, py + tileSize - depth, 1, depth);
    } else if (side === 2) {
      cctx.fillStyle = palette.shadow;
      cctx.fillRect(px + depth, py + i, 1, 1);
      cctx.fillStyle = accent ? palette.light : palette.mid;
      cctx.fillRect(px, py + i, depth, 1);
    } else {
      cctx.fillStyle = palette.shadow;
      cctx.fillRect(px + tileSize - depth - 1, py + i, 1, 1);
      cctx.fillStyle = accent ? palette.light : palette.mid;
      cctx.fillRect(px + tileSize - depth, py + i, depth, 1);
    }
  }
}

function drawLandShoreBankEdge(cctx, px, py, tileSize, wxTile, wyTile, side) {
  // Crisp sand/slate bank bevel & subtle water-contact foam on land tiles facing water/void_sea
  if (side === 1) {
    // South edge of land faces water below: deepest 2.5D bank drop
    cctx.fillStyle = '#475569';
    cctx.fillRect(px, py + tileSize - 3, tileSize, 1);
    cctx.fillStyle = '#1e293b';
    cctx.fillRect(px, py + tileSize - 2, tileSize, 1);
    cctx.fillStyle = '#0f172a';
    cctx.fillRect(px, py + tileSize - 1, tileSize, 1);
    for (let i = 1; i < tileSize - 1; i += 3) {
      const h = tileHash(wxTile, wyTile, 111 + i);
      if (h < 0.55) {
        cctx.fillStyle = '#94a3b8';
        cctx.fillRect(px + i, py + tileSize - 3, 2, 1);
      }
      if (h > 0.45) {
        cctx.fillStyle = 'rgba(186, 230, 253, 0.60)';
        cctx.fillRect(px + i, py + tileSize - 1, 2, 1);
      }
    }
  } else if (side === 0) {
    cctx.fillStyle = '#334155';
    cctx.fillRect(px, py, tileSize, 1);
    cctx.fillStyle = '#64748b';
    cctx.fillRect(px, py + 1, tileSize, 1);
    for (let i = 2; i < tileSize - 1; i += 4) {
      if (tileHash(wxTile, wyTile, 127 + i) < 0.6) {
        cctx.fillStyle = 'rgba(186, 230, 253, 0.50)';
        cctx.fillRect(px + i, py, 2, 1);
      }
    }
  } else if (side === 2) {
    cctx.fillStyle = '#334155';
    cctx.fillRect(px, py, 1, tileSize);
    cctx.fillStyle = '#64748b';
    cctx.fillRect(px + 1, py, 1, tileSize);
    for (let i = 2; i < tileSize - 1; i += 4) {
      if (tileHash(wxTile, wyTile, 141 + i) < 0.6) {
        cctx.fillStyle = 'rgba(186, 230, 253, 0.50)';
        cctx.fillRect(px, py + i, 1, 2);
      }
    }
  } else {
    cctx.fillStyle = '#334155';
    cctx.fillRect(px + tileSize - 1, py, 1, tileSize);
    cctx.fillStyle = '#64748b';
    cctx.fillRect(px + tileSize - 2, py, 1, tileSize);
    for (let i = 2; i < tileSize - 1; i += 4) {
      if (tileHash(wxTile, wyTile, 157 + i) < 0.6) {
        cctx.fillStyle = 'rgba(186, 230, 253, 0.50)';
        cctx.fillRect(px + tileSize - 1, py + i, 1, 2);
      }
    }
  }
}

function drawWaterFoamEdge(cctx, px, py, tileSize, side, sprites) {
  const tiles = sprites && sprites.tiles;
  if (side === 0 && tiles && tiles.shore_foam_n) {
    cctx.drawImage(tiles.shore_foam_n, 0, 0, tiles.shore_foam_n.width, tiles.shore_foam_n.height, px, py, tileSize, tileSize);
    return;
  }
  if (side === 1 && tiles && tiles.shore_foam_s) {
    cctx.drawImage(tiles.shore_foam_s, 0, 0, tiles.shore_foam_s.width, tiles.shore_foam_s.height, px, py, tileSize, tileSize);
    return;
  }
  if (side === 2 && tiles && tiles.shore_foam_w) {
    cctx.drawImage(tiles.shore_foam_w, 0, 0, tiles.shore_foam_w.width, tiles.shore_foam_w.height, px, py, tileSize, tileSize);
    return;
  }
  if (side === 3 && tiles && tiles.shore_foam_e) {
    cctx.drawImage(tiles.shore_foam_e, 0, 0, tiles.shore_foam_e.width, tiles.shore_foam_e.height, px, py, tileSize, tileSize);
    return;
  }

  // Fallback pixel foam rim if trim sprites are absent
  cctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
  if (side === 0) cctx.fillRect(px + 1, py + 1, tileSize - 2, 1);
  else if (side === 1) cctx.fillRect(px + 1, py + tileSize - 2, tileSize - 2, 1);
  else if (side === 2) cctx.fillRect(px + 1, py + 1, 1, tileSize - 2);
  else cctx.fillRect(px + tileSize - 2, py + 1, 1, tileSize - 2);
}

/**
 * Bake terrain transitions, riverbank/sea shore ledges, and 2.5D mountain cliff faces
 * onto an offscreen 16x16 tile chunk canvas.
 */
export function drawTileChunkTransitions({
  cctx,
  chunkX,
  chunkY,
  tileChunkTiles = 16,
  tileSize = 16,
  getTileMeta,
  sprites,
}) {
  if (!cctx || typeof getTileMeta !== 'function') return;
  const tilesDict = sprites && sprites.tiles;

  for (let ty = 0; ty < tileChunkTiles; ty++) {
    const wyTile = chunkY * tileChunkTiles + ty;
    const py = ty * tileSize;

    for (let tx = 0; tx < tileChunkTiles; tx++) {
      const wxTile = chunkX * tileChunkTiles + tx;
      const px = tx * tileSize;

      const center = getTileMeta(wxTile, wyTile) || DEFAULT_TILE_META;
      const north = getTileMeta(wxTile, wyTile - 1) || DEFAULT_TILE_META;
      const south = getTileMeta(wxTile, wyTile + 1) || DEFAULT_TILE_META;
      const west = getTileMeta(wxTile - 1, wyTile) || DEFAULT_TILE_META;
      const east = getTileMeta(wxTile + 1, wyTile) || DEFAULT_TILE_META;

      // 1. Soft 2px grass / biome overhang borders where natural terrain meets flagstone road
      if (center.category === 'road') {
        const palN = resolveNaturalPalette(north);
        if (palN) drawRoadOverhangEdge(cctx, px, py, tileSize, wxTile, wyTile, 0, palN);
        const palS = resolveNaturalPalette(south);
        if (palS) drawRoadOverhangEdge(cctx, px, py, tileSize, wxTile, wyTile, 1, palS);
        const palW = resolveNaturalPalette(west);
        if (palW) drawRoadOverhangEdge(cctx, px, py, tileSize, wxTile, wyTile, 2, palW);
        const palE = resolveNaturalPalette(east);
        if (palE) drawRoadOverhangEdge(cctx, px, py, tileSize, wxTile, wyTile, 3, palE);
      }

      // 2. Crisp shoreline bank ledges & foam rim accents where land borders water or void_sea
      if (isAquatic(center)) {
        if (isShoreLand(north)) drawWaterFoamEdge(cctx, px, py, tileSize, 0, sprites);
        else if (north.category === 'bridge') {
          cctx.fillStyle = 'rgba(5, 8, 18, 0.45)';
          cctx.fillRect(px, py, tileSize, 2);
        }
        if (isShoreLand(south)) drawWaterFoamEdge(cctx, px, py, tileSize, 1, sprites);
        if (isShoreLand(west)) drawWaterFoamEdge(cctx, px, py, tileSize, 2, sprites);
        if (isShoreLand(east)) drawWaterFoamEdge(cctx, px, py, tileSize, 3, sprites);
      } else if (isShoreLand(center)) {
        if (isAquatic(north)) drawLandShoreBankEdge(cctx, px, py, tileSize, wxTile, wyTile, 0);
        if (isAquatic(south)) drawLandShoreBankEdge(cctx, px, py, tileSize, wxTile, wyTile, 1);
        if (isAquatic(west)) drawLandShoreBankEdge(cctx, px, py, tileSize, wxTile, wyTile, 2);
        if (isAquatic(east)) drawLandShoreBankEdge(cctx, px, py, tileSize, wxTile, wyTile, 3);
      }

      // 3. 2.5D cliff drop-shadow & rock strata trim on south/east face of mountains
      if (isMountain(center)) {
        if (isWalkableGround(south)) {
          const cliffKey = ((wxTile + wyTile) & 1) === 0 ? 'cliff_face_0' : 'cliff_face_1';
          const cliffImg = tilesDict && tilesDict[cliffKey];
          if (cliffImg) {
            const srcOffset = Math.max(2, Math.floor(cliffImg.height * 0.3125));
            const dstOffset = Math.max(2, Math.floor(tileSize * 0.3125));
            cctx.drawImage(
              cliffImg,
              0,
              srcOffset,
              cliffImg.width,
              cliffImg.height - srcOffset,
              px,
              py + dstOffset,
              tileSize,
              tileSize - dstOffset
            );
            cctx.fillStyle = '#64748b';
            cctx.fillRect(px, py + dstOffset, tileSize, 1);
          } else {
            cctx.fillStyle = '#374254';
            cctx.fillRect(px, py + tileSize - 8, tileSize, 3);
            cctx.fillStyle = '#1e2530';
            cctx.fillRect(px, py + tileSize - 5, tileSize, 3);
            cctx.fillStyle = '#090d16';
            cctx.fillRect(px, py + tileSize - 2, tileSize, 2);
          }
        }
        if (isWalkableGround(east)) {
          cctx.fillStyle = '#374254';
          cctx.fillRect(px + tileSize - 3, py, 1, tileSize);
          cctx.fillStyle = '#151b26';
          cctx.fillRect(px + tileSize - 2, py, 2, tileSize);
        }
      } else if (isWalkableGround(center)) {
        if (isMountain(north)) {
          cctx.fillStyle = 'rgba(5, 8, 18, 0.56)';
          cctx.fillRect(px, py, tileSize, 2);
          cctx.fillStyle = 'rgba(5, 8, 18, 0.28)';
          cctx.fillRect(px, py + 2, tileSize, 2);
          cctx.fillStyle = 'rgba(5, 8, 18, 0.12)';
          cctx.fillRect(px, py + 4, tileSize, 1);
          // Occasional loose cliff scree pebbles at mountain foot
          const screeH = tileHash(wxTile, wyTile, 211);
          if (screeH < 0.45) {
            const sx = px + 2 + Math.floor(screeH * 22);
            cctx.fillStyle = '#334155';
            cctx.fillRect(sx, py + 2, 2, 1);
            cctx.fillStyle = '#475569';
            cctx.fillRect(sx, py + 1, 1, 1);
          }
        }
        if (isMountain(west)) {
          cctx.fillStyle = 'rgba(5, 8, 18, 0.42)';
          cctx.fillRect(px, py, 2, tileSize);
          cctx.fillStyle = 'rgba(5, 8, 18, 0.20)';
          cctx.fillRect(px + 2, py, 1, tileSize);
        }
      }
    }
  }
}
