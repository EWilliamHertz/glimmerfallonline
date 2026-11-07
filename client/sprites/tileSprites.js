import { makeCanvas, px, rect, hash2d } from "./pixelCanvas.js";

export function buildTileSprites(sprites) {
  // ==========================================
  // 1. TERRAIN TILES (Sanctuary, Warzone, Arena + All 4 Faction Biomes)
  // ==========================================
  // Sanctuary Grass
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#15342b');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 10 + v);
        if (r < 0.16) px(ctx, x, y, '#1d4739');
        else if (r < 0.24) px(ctx, x, y, '#0f261f');
        else if (r > 0.96) px(ctx, x, y, '#2b6a52');
      }
    }
    const bx = (v * 5 + 3) % 13;
    const by = (v * 7 + 4) % 12;
    px(ctx, bx, by, '#34d399');
    px(ctx, bx + 1, by + 1, '#10b981');
    if (v === 2) {
      px(ctx, 11, 5, '#facc15');
      px(ctx, 11, 6, '#10b981');
    }
    sprites.tiles[`sanctuary_grass_${v}`] = c;
  }

  // Flagstone Path
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#2a3142');
    rect(ctx, 0, 0, 16, 1, '#151924');
    rect(ctx, 0, 8, 16, 1, '#151924');
    rect(ctx, v === 0 ? 7 : 11, 0, 1, 8, '#151924');
    rect(ctx, v === 0 ? 3 : 7, 8, 1, 8, '#151924');
    rect(ctx, 1, 1, 5, 1, '#3b455e');
    rect(ctx, 5, 9, 6, 1, '#3b455e');
    if (v === 1) {
      px(ctx, 4, 4, '#ca8a04');
      px(ctx, 12, 12, '#eab308');
    }
    sprites.tiles[`flagstone_${v}`] = c;
  }

  // Warzone Obsidian Slate
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#111625');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 40 + v);
        if (r < 0.18) px(ctx, x, y, '#182036');
        else if (r < 0.26) px(ctx, x, y, '#0b0e18');
      }
    }
    if (v === 2) {
      px(ctx, 3, 4, '#0284c7');
      px(ctx, 4, 4, '#38bdf8');
      px(ctx, 5, 5, '#0284c7');
    } else if (v === 3) {
      px(ctx, 11, 10, '#6b21a8');
      px(ctx, 12, 10, '#a855f7');
    }
    sprites.tiles[`warzone_${v}`] = c;
  }

  // Biome 1: Solari — Lantern District & Golden Citadel (Sunforged Ivory/Gold Marble)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#2d2618');
    rect(ctx, 0, 0, 16, 1, '#1c170d');
    rect(ctx, 0, 0, 1, 16, '#1c170d');
    rect(ctx, 1, 1, 14, 1, '#453922');
    if (v === 1 || v === 3) {
      rect(ctx, 6, 6, 4, 4, '#713f12');
      rect(ctx, 7, 7, 2, 2, '#eab308');
    } else if (v === 2) {
      px(ctx, 4, 11, '#ca8a04');
      px(ctx, 11, 4, '#facc15');
    }
    sprites.tiles[`solari_${v}`] = c;
  }

  // Biome 2: Umbri — Sepulcher Undercity & Duskveil Bog
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#140d24');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 70 + v);
        if (r < 0.16) px(ctx, x, y, '#1f1438');
        else if (r < 0.24) px(ctx, x, y, '#0c0717');
      }
    }
    if (v === 2) {
      rect(ctx, 4, 8, 5, 3, '#3b0764');
      px(ctx, 6, 9, '#a855f7');
    } else if (v === 3) {
      px(ctx, 10, 5, '#7e22ce');
      px(ctx, 11, 6, '#c084fc');
    }
    sprites.tiles[`umbri_${v}`] = c;
  }

  // Biome 3: Terra — Glimmer Orchard & Rootdeep Expanse
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#132a17');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 90 + v);
        if (r < 0.2) px(ctx, x, y, '#1b3d22');
        else if (r < 0.28) px(ctx, x, y, '#0d1f10');
      }
    }
    if (v === 1) {
      px(ctx, 5, 5, '#4ade80');
      px(ctx, 6, 6, '#22c55e');
    } else if (v === 2) {
      px(ctx, 10, 9, '#fde047'); // Glimmer blossom
      px(ctx, 10, 10, '#4ade80');
    } else if (v === 3) {
      rect(ctx, 3, 12, 5, 2, '#3f6212');
    }
    sprites.tiles[`terra_${v}`] = c;
  }

  // Biome 4: Aether — Mirrorgate Spire & Fractured Continuum
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0b192e');
    rect(ctx, 0, 0, 16, 1, '#07101f');
    rect(ctx, 0, 0, 1, 16, '#07101f');
    rect(ctx, 1, 1, 14, 1, '#132a4a');
    if (v === 1) {
      rect(ctx, 7, 7, 2, 2, '#0284c7');
      px(ctx, 7, 7, '#7dd3fc');
    } else if (v === 2) {
      px(ctx, 4, 5, '#38bdf8');
      px(ctx, 12, 11, '#818cf8');
    }
    sprites.tiles[`aether_${v}`] = c;
  }

  // Arena Tiles
  const makeArenaTile = (base, hi, accent) => {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, base);
    rect(ctx, 0, 0, 16, 1, '#0b0f1a');
    rect(ctx, 0, 0, 1, 16, '#0b0f1a');
    rect(ctx, 1, 1, 14, 1, hi);
    px(ctx, 7, 7, accent);
    px(ctx, 8, 7, accent);
    px(ctx, 7, 8, accent);
    px(ctx, 8, 8, accent);
    return c;
  };
  sprites.tiles.arena_neutral = makeArenaTile('#1b2234', '#28324c', '#475569');
  sprites.tiles.arena_blue = makeArenaTile('#132946', '#1d3e69', '#38bdf8');
  sprites.tiles.arena_red = makeArenaTile('#3b1622', '#592032', '#ef4444');

  // Calm Deep Astral Water Border (NO bright strobing pixels — completely flash-free!)
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#060c1a');
    for (let y = 0; y < 16; y += 4) {
      const shift = (y + f * 4) % 12;
      rect(ctx, shift, y, 5, 1, '#0f2042');
      px(ctx, (shift + 2) % 16, y + 1, '#173161');
    }
    sprites.tiles[`void_sea_${f}`] = c;
  }

  // Granite Mountain Crag Tiles (Rugged Mountain Ranges & Passes)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#28313e');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 120 + v);
        if (r < 0.22) px(ctx, x, y, '#1e2530');
        else if (r < 0.35) px(ctx, x, y, '#374254');
        else if (r > 0.88) px(ctx, x, y, '#4b5970');
      }
    }
    // Jagged facet ridges
    if (v === 0) {
      rect(ctx, 2, 4, 6, 2, '#4b5970');
      rect(ctx, 8, 8, 5, 2, '#1e2530');
    } else if (v === 1) {
      rect(ctx, 4, 10, 8, 2, '#4b5970');
      px(ctx, 11, 3, '#64748b');
    } else if (v === 2) {
      rect(ctx, 3, 2, 7, 2, '#374254');
      rect(ctx, 7, 9, 6, 2, '#1e2530');
    } else {
      px(ctx, 5, 5, '#64748b');
      px(ctx, 12, 12, '#1e2530');
    }
    sprites.tiles[`mountain_rock_${v}`] = c;
  }

  // Snow-Dusted High Mountain Peaks
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#334155');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 150 + v);
        if (r < 0.25) px(ctx, x, y, '#1e293b');
        else if (r < 0.45) px(ctx, x, y, '#475569');
        else if (r > 0.82) px(ctx, x, y, '#cbd5e1'); // Snow dusting
      }
    }
    if (v === 0 || v === 2) {
      rect(ctx, 4, 2, 8, 2, '#f1f5f9');
      rect(ctx, 5, 4, 5, 1, '#cbd5e1');
    } else {
      rect(ctx, 6, 6, 6, 2, '#f1f5f9');
    }
    sprites.tiles[`mountain_peak_${v}`] = c;
  }

  // Rushing Valley River Water (Flowing Streams & Valley Basins)
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0284c7');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 200 + f);
        if (r < 0.28) px(ctx, x, y, '#0369a1');
        else if (r > 0.88) px(ctx, x, y, '#38bdf8');
      }
    }
    // Flowing foam ripples
    const offset = f * 3;
    rect(ctx, (2 + offset) % 16, 3, 5, 1, '#bae6fd');
    rect(ctx, (8 + offset) % 16, 8, 6, 1, '#e0f2fe');
    rect(ctx, (1 + offset) % 16, 13, 4, 1, '#bae6fd');
    sprites.tiles[`river_water_${f}`] = c;
  }

  // Wooden Bridge Planks (Crossing Mountain Chasm & Rivers)
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#78350f');
    // Horizontal wood planks
    rect(ctx, 0, 0, 16, 1, '#451a03');
    rect(ctx, 0, 4, 16, 1, '#451a03');
    rect(ctx, 0, 8, 16, 1, '#451a03');
    rect(ctx, 0, 12, 16, 1, '#451a03');
    // Wood grain highlights
    rect(ctx, 2, 2, 12, 1, '#92400e');
    rect(ctx, 3, 6, 10, 1, '#92400e');
    rect(ctx, 1, 10, 14, 1, '#92400e');
    rect(ctx, 4, 14, 8, 1, '#92400e');
    // Iron bolts / rivets on plank ends
    px(ctx, 1, 2, '#d97706');
    px(ctx, 14, 2, '#d97706');
    px(ctx, 1, 10, '#d97706');
    px(ctx, 14, 10, '#d97706');
    sprites.tiles[`bridge_wood_${v}`] = c;
  }

  // Celestial Empyrean Summit Tiles (Opalescent Starlight Marble & Gold Inlays)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0f172a');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 310 + v);
        if (r < 0.28) px(ctx, x, y, '#1e293b');
        else if (r < 0.55) px(ctx, x, y, '#334155');
        else if (r > 0.88) px(ctx, x, y, '#e2e8f0');
      }
    }
    // Luminous cosmic veining & starlight
    rect(ctx, 0, 0, 16, 1, '#1e293b');
    rect(ctx, 0, 0, 1, 16, '#1e293b');
    if (v === 0) {
      rect(ctx, 6, 6, 4, 4, '#38bdf8');
      px(ctx, 7, 7, '#ffffff');
      px(ctx, 8, 8, '#facc15');
    } else if (v === 1) {
      px(ctx, 3, 3, '#facc15');
      px(ctx, 12, 12, '#38bdf8');
      rect(ctx, 5, 8, 6, 1, '#6366f1');
    } else if (v === 2) {
      rect(ctx, 2, 2, 12, 12, '#1e1b4b');
      rect(ctx, 4, 4, 8, 8, '#312e81');
      px(ctx, 7, 7, '#fef08a');
      px(ctx, 8, 8, '#ffffff');
    } else {
      px(ctx, 4, 11, '#38bdf8');
      px(ctx, 11, 4, '#facc15');
      rect(ctx, 7, 7, 2, 2, '#818cf8');
    }
    sprites.tiles[`celestial_${v}`] = c;
  }

  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#1e293b');
    rect(ctx, 1, 1, 14, 14, '#334155');
    rect(ctx, 2, 2, 12, 12, '#f8fafc');
    rect(ctx, 4, 4, 8, 8, '#facc15');
    rect(ctx, 6, 6, 4, 4, '#ffffff');
    if (v === 1) {
      px(ctx, 7, 7, '#38bdf8');
      px(ctx, 8, 8, '#38bdf8');
    }
    sprites.tiles[`celestial_road_${v}`] = c;
  }

  // Starfall Meteorite Crater Tiles (Scorched Basalt & Glowing Starfire Veins)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#171324');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 410 + v);
        if (r < 0.24) px(ctx, x, y, '#0f0c19');
        else if (r < 0.44) px(ctx, x, y, '#251e38');
        else if (r > 0.92) px(ctx, x, y, '#38bdf8');
      }
    }
    if (v === 1) {
      rect(ctx, 3, 6, 5, 1, '#ea580c');
      px(ctx, 5, 6, '#fde047');
    } else if (v === 2) {
      rect(ctx, 8, 10, 4, 1, '#0284c7');
      px(ctx, 9, 10, '#bae6fd');
    }
    sprites.tiles[`starfall_${v}`] = c;
  }

  // Abyssal Rift Tiles (Dimensional Void-Slate & Teal/Violet Ley-Cracks)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0d091c');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 510 + v);
        if (r < 0.26) px(ctx, x, y, '#070510');
        else if (r < 0.46) px(ctx, x, y, '#1c1236');
        else if (r > 0.92) px(ctx, x, y, '#a855f7');
      }
    }
    if (v === 1) {
      rect(ctx, 2, 8, 6, 1, '#7e22ce');
      px(ctx, 4, 8, '#e879f9');
    } else if (v === 3) {
      rect(ctx, 9, 4, 4, 1, '#0d9488');
      px(ctx, 10, 4, '#5eead4');
    }
    sprites.tiles[`abyssal_${v}`] = c;
  }

}
