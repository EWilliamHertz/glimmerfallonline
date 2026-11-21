import { makeCanvas, px, rect, hash2d } from "./pixelCanvas.js";

export function buildTileSprites(sprites) {
  // ==========================================
  // 1. TERRAIN TILES (Sanctuary, Warzone, Arena + All 4 Faction Biomes)
  // ==========================================
  // Sanctuary Grass (richer moss speckles, clover & micro-pebbles)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#15342b');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 10 + v);
        if (r < 0.16) px(ctx, x, y, '#1d4739');
        else if (r < 0.25) px(ctx, x, y, '#0f261f');
        else if (r > 0.95) px(ctx, x, y, '#2b6a52');
        else if (r > 0.91 && r <= 0.93) px(ctx, x, y, '#193d31');
      }
    }
    const bx = (v * 5 + 3) % 13;
    const by = (v * 7 + 4) % 12;
    px(ctx, bx, by, '#34d399');
    px(ctx, bx + 1, by + 1, '#10b981');
    if (v === 1) {
      // Tiny moss-edged pebble
      px(ctx, 3, 11, '#334155');
      px(ctx, 4, 11, '#475569');
      px(ctx, 3, 12, '#0f261f');
    } else if (v === 2) {
      px(ctx, 11, 5, '#facc15');
      px(ctx, 11, 6, '#10b981');
      px(ctx, 4, 3, '#2b6a52');
    } else if (v === 3) {
      px(ctx, 10, 12, '#34d399');
      px(ctx, 11, 11, '#10b981');
    }
    sprites.tiles[`sanctuary_grass_${v}`] = c;
  }

  // Flagstone Path (chiseled bevel highlights, bottom mortar shadow & subtle speckles)
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#2a3142');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 25 + v);
        if (r < 0.10) px(ctx, x, y, '#232938');
        else if (r > 0.93) px(ctx, x, y, '#333c52');
      }
    }
    rect(ctx, 0, 0, 16, 1, '#151924');
    rect(ctx, 0, 8, 16, 1, '#151924');
    const seamTop = v === 0 ? 7 : 11;
    const seamBot = v === 0 ? 3 : 7;
    rect(ctx, seamTop, 0, 1, 8, '#151924');
    rect(ctx, seamBot, 8, 1, 8, '#151924');
    // Top bevel highlights & lower slab shade
    rect(ctx, 1, 1, 5, 1, '#3b455e');
    rect(ctx, (seamTop + 2) % 14, 1, 4, 1, '#3b455e');
    rect(ctx, 5, 9, 6, 1, '#3b455e');
    rect(ctx, 1, 7, 5, 1, '#1e2433');
    rect(ctx, 4, 15, 7, 1, '#1e2433');
    if (v === 0) {
      px(ctx, 12, 5, '#475569');
      px(ctx, 1, 13, '#1d4739'); // subtle crevice moss
    } else {
      px(ctx, 4, 4, '#ca8a04');
      px(ctx, 12, 12, '#eab308');
      px(ctx, 13, 3, '#475569');
    }
    sprites.tiles[`flagstone_${v}`] = c;
  }

  // Warzone Obsidian Slate (fractured basalt bevels & subtle cinder pebbles)
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#111625');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 40 + v);
        if (r < 0.18) px(ctx, x, y, '#182036');
        else if (r < 0.27) px(ctx, x, y, '#0b0e18');
        else if (r > 0.96) px(ctx, x, y, '#232e4d');
      }
    }
    if (v === 0) {
      rect(ctx, 2, 11, 4, 1, '#1e293b');
      px(ctx, 10, 4, '#334155');
    } else if (v === 1) {
      rect(ctx, 6, 3, 5, 1, '#1e293b');
      px(ctx, 4, 12, '#475569');
      px(ctx, 5, 12, '#0b0e18');
    } else if (v === 2) {
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
    for (let y = 1; y < 15; y++) {
      for (let x = 1; x < 15; x++) {
        const r = hash2d(x, y, 55 + v);
        if (r < 0.12) px(ctx, x, y, '#261f13');
        else if (r > 0.92) px(ctx, x, y, '#3b311f');
      }
    }
    rect(ctx, 0, 0, 16, 1, '#1c170d');
    rect(ctx, 0, 0, 1, 16, '#1c170d');
    rect(ctx, 1, 1, 14, 1, '#453922');
    rect(ctx, 1, 15, 14, 1, '#231d11');
    if (v === 1 || v === 3) {
      rect(ctx, 6, 6, 4, 4, '#713f12');
      rect(ctx, 7, 7, 2, 2, '#eab308');
      px(ctx, 7, 7, '#fef08a');
    } else if (v === 2) {
      px(ctx, 4, 11, '#ca8a04');
      px(ctx, 11, 4, '#facc15');
      px(ctx, 10, 11, '#57472a');
    } else {
      px(ctx, 3, 12, '#57472a');
      px(ctx, 12, 4, '#57472a');
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
        else if (r < 0.25) px(ctx, x, y, '#0c0717');
        else if (r > 0.96) px(ctx, x, y, '#2d1c4f');
      }
    }
    if (v === 0) {
      px(ctx, 4, 11, '#2d1c4f');
      px(ctx, 5, 11, '#4c1d95');
    } else if (v === 1) {
      px(ctx, 11, 4, '#334155');
      px(ctx, 12, 4, '#475569');
    } else if (v === 2) {
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
        else if (r < 0.29) px(ctx, x, y, '#0d1f10');
        else if (r > 0.95) px(ctx, x, y, '#275930');
      }
    }
    if (v === 0) {
      px(ctx, 3, 4, '#22c55e');
      px(ctx, 12, 11, '#3f6212');
    } else if (v === 1) {
      px(ctx, 5, 5, '#4ade80');
      px(ctx, 6, 6, '#22c55e');
      px(ctx, 11, 3, '#334155');
    } else if (v === 2) {
      px(ctx, 10, 9, '#fde047'); // Glimmer blossom
      px(ctx, 10, 10, '#4ade80');
    } else if (v === 3) {
      rect(ctx, 3, 12, 5, 2, '#3f6212');
      px(ctx, 4, 12, '#65a30d');
    }
    sprites.tiles[`terra_${v}`] = c;
  }

  // Biome 4: Aether — Mirrorgate Spire & Fractured Continuum
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#0b192e');
    for (let y = 1; y < 15; y++) {
      for (let x = 1; x < 15; x++) {
        const r = hash2d(x, y, 105 + v);
        if (r < 0.12) px(ctx, x, y, '#081324');
        else if (r > 0.93) px(ctx, x, y, '#163259');
      }
    }
    rect(ctx, 0, 0, 16, 1, '#07101f');
    rect(ctx, 0, 0, 1, 16, '#07101f');
    rect(ctx, 1, 1, 14, 1, '#132a4a');
    rect(ctx, 1, 15, 14, 1, '#091426');
    if (v === 1) {
      rect(ctx, 7, 7, 2, 2, '#0284c7');
      px(ctx, 7, 7, '#7dd3fc');
    } else if (v === 2) {
      px(ctx, 4, 5, '#38bdf8');
      px(ctx, 12, 11, '#818cf8');
    } else if (v === 3) {
      rect(ctx, 4, 8, 3, 1, '#1e3a5f');
      px(ctx, 11, 5, '#38bdf8');
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
        else if (r > 0.87 && r <= 0.90) px(ctx, x, y, '#31274a');
      }
    }
    if (v === 0) {
      px(ctx, 4, 11, '#475569');
      px(ctx, 5, 11, '#64748b');
    } else if (v === 1) {
      rect(ctx, 3, 6, 5, 1, '#ea580c');
      px(ctx, 5, 6, '#fde047');
    } else if (v === 2) {
      rect(ctx, 8, 10, 4, 1, '#0284c7');
      px(ctx, 9, 10, '#bae6fd');
    } else {
      px(ctx, 11, 4, '#334155');
      px(ctx, 12, 4, '#475569');
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
        else if (r > 0.88 && r <= 0.90) px(ctx, x, y, '#291a4d');
      }
    }
    if (v === 0) {
      rect(ctx, 3, 12, 3, 1, '#291a4d');
    } else if (v === 1) {
      rect(ctx, 2, 8, 6, 1, '#7e22ce');
      px(ctx, 4, 8, '#e879f9');
    } else if (v === 2) {
      px(ctx, 11, 10, '#0f766e');
      px(ctx, 12, 10, '#2dd4bf');
    } else if (v === 3) {
      rect(ctx, 9, 4, 4, 1, '#0d9488');
      px(ctx, 10, 4, '#5eead4');
    }
    sprites.tiles[`abyssal_${v}`] = c;
  }

  // Frostspire Glacier Snow & Permafrost Slate Tiles
  for (let v = 0; v < 4; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#dbeafe');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash2d(x, y, 620 + v);
        if (r < 0.25) px(ctx, x, y, '#bfdbfe');
        else if (r < 0.45) px(ctx, x, y, '#e0f2fe');
        else if (r > 0.92) px(ctx, x, y, '#ffffff');
        else if (r > 0.86 && r <= 0.90) px(ctx, x, y, '#93c5fd');
      }
    }
    if (v === 1) {
      rect(ctx, 3, 5, 4, 1, '#93c5fd');
      px(ctx, 4, 4, '#ffffff');
    } else if (v === 2) {
      rect(ctx, 9, 10, 5, 1, '#7dd3fc');
      px(ctx, 11, 9, '#e0f2fe');
    } else if (v === 3) {
      px(ctx, 5, 11, '#38bdf8');
      px(ctx, 6, 11, '#ffffff');
    }
    sprites.tiles[`frost_${v}`] = c;
  }

  // Glacial Clear Blue Ice Sheet Tiles
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#38bdf8');
    rect(ctx, 0, 0, 16, 16, 'rgba(186, 230, 253, 0.35)');
    rect(ctx, 2 + v * 3, 3, 6, 1, '#e0f2fe');
    rect(ctx, 7 - v * 2, 11, 5, 1, '#bae6fd');
    px(ctx, 12, 5 + v, '#ffffff');
    sprites.tiles[`frost_ice_${v}`] = c;
  }

  // ==========================================
  // 2. AUTOTILER CLIFF & SHORELINE TRIM TILES
  // ==========================================
  // 16x16 Vertical Granite Cliff Wall & Shadow Skirt for mountain ridge southern edges
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas(16, 16);
    // Base stratified granite cliff wall
    rect(ctx, 0, 0, 16, 16, '#1e2530');
    // Top crag rim & sunlit rock lip
    rect(ctx, 0, 0, 16, 2, '#374254');
    rect(ctx, 0, 1, 16, 1, '#4b5970');
    px(ctx, v === 0 ? 3 : 7, 0, '#64748b');
    px(ctx, v === 0 ? 11 : 13, 0, '#64748b');
    // Stratified rock face layers
    rect(ctx, 0, 3, 16, 4, '#28313e');
    rect(ctx, 0, 7, 16, 4, '#1e2530');
    rect(ctx, 0, 11, 16, 3, '#151b26');
    // Vertical cliff fissures & rocky highlights
    const f1 = v === 0 ? 4 : 6;
    const f2 = v === 0 ? 11 : 13;
    rect(ctx, f1, 2, 1, 11, '#0f172a');
    rect(ctx, f2, 3, 1, 10, '#0f172a');
    rect(ctx, f1 + 1, 3, 2, 1, '#4b5970');
    rect(ctx, (f2 + 2) % 14, 7, 3, 1, '#374254');
    if (v === 1) {
      // Subtle highland moss / lichen patch on cliff ledge
      px(ctx, 2, 2, '#1d4739');
      px(ctx, 3, 2, '#2b6a52');
      px(ctx, 9, 5, '#4b5970');
    } else {
      px(ctx, 8, 4, '#64748b');
      px(ctx, 1, 8, '#374254');
    }
    // Deep bottom shadow skirt grounding cliff into walkable terrain
    rect(ctx, 0, 14, 16, 2, '#090d16');
    rect(ctx, 0, 13, 16, 1, '#111622');
    sprites.tiles[`cliff_face_${v}`] = c;
  }

  // Subtle Sand/Stone Riverbank & Sea Edge Trim Strips (16x16 transparent overlay strips)
  {
    // North edge trim (land north of water)
    const { c: cn, ctx: ctxN } = makeCanvas(16, 16);
    rect(ctxN, 0, 0, 16, 1, '#1e293b');
    rect(ctxN, 0, 1, 16, 1, '#64748b');
    px(ctxN, 2, 1, '#94a3b8');
    px(ctxN, 8, 1, '#94a3b8');
    px(ctxN, 13, 1, '#94a3b8');
    rect(ctxN, 1, 2, 4, 1, '#bae6fd');
    rect(ctxN, 7, 2, 5, 1, '#bae6fd');
    px(ctxN, 14, 2, '#e0f2fe');
    px(ctxN, 3, 3, '#e0f2fe');
    px(ctxN, 10, 3, '#bae6fd');
    sprites.tiles.shore_foam_n = cn;

    // South edge trim (land south of water)
    const { c: cs, ctx: ctxS } = makeCanvas(16, 16);
    rect(ctxS, 0, 15, 16, 1, '#1e293b');
    rect(ctxS, 0, 14, 16, 1, '#64748b');
    px(ctxS, 3, 14, '#94a3b8');
    px(ctxS, 9, 14, '#94a3b8');
    px(ctxS, 14, 14, '#94a3b8');
    rect(ctxS, 2, 13, 4, 1, '#bae6fd');
    rect(ctxS, 8, 13, 5, 1, '#bae6fd');
    px(ctxS, 1, 13, '#e0f2fe');
    px(ctxS, 5, 12, '#e0f2fe');
    px(ctxS, 11, 12, '#bae6fd');
    sprites.tiles.shore_foam_s = cs;

    // West edge trim (land west of water)
    const { c: cw, ctx: ctxW } = makeCanvas(16, 16);
    rect(ctxW, 0, 0, 1, 16, '#1e293b');
    rect(ctxW, 1, 0, 1, 16, '#64748b');
    px(ctxW, 1, 3, '#94a3b8');
    px(ctxW, 1, 10, '#94a3b8');
    rect(ctxW, 2, 2, 1, 4, '#bae6fd');
    rect(ctxW, 2, 9, 1, 5, '#bae6fd');
    px(ctxW, 2, 7, '#e0f2fe');
    px(ctxW, 3, 4, '#e0f2fe');
    px(ctxW, 3, 11, '#bae6fd');
    sprites.tiles.shore_foam_w = cw;

    // East edge trim (land east of water)
    const { c: ce, ctx: ctxE } = makeCanvas(16, 16);
    rect(ctxE, 15, 0, 1, 16, '#1e293b');
    rect(ctxE, 14, 0, 1, 16, '#64748b');
    px(ctxE, 14, 4, '#94a3b8');
    px(ctxE, 14, 11, '#94a3b8');
    rect(ctxE, 13, 1, 1, 5, '#bae6fd');
    rect(ctxE, 13, 8, 1, 4, '#bae6fd');
    px(ctxE, 13, 14, '#e0f2fe');
    px(ctxE, 12, 3, '#e0f2fe');
    px(ctxE, 12, 10, '#bae6fd');
    sprites.tiles.shore_foam_e = ce;
  }

  // Interior Floors, Carpets, Wainscoted Walls, Void Surround & Exit Doormat
  for (let v = 0; v < 2; v++) {
    // Warm Oak Plank Floor
    const { c: wc, ctx: wctx } = makeCanvas(16, 16);
    rect(wctx, 0, 0, 16, 16, v === 0 ? '#6b4226' : '#633c22');
    for (let y = 0; y < 16; y += 4) {
      rect(wctx, 0, y, 16, 1, '#452715');
      rect(wctx, 0, y + 1, 16, 1, '#7c4d2e');
    }
    const seamX = v === 0 ? 5 : 11;
    rect(wctx, seamX, 0, 1, 4, '#3b1f10');
    rect(wctx, (seamX + 6) % 16, 4, 1, 4, '#3b1f10');
    rect(wctx, (seamX + 2) % 16, 8, 1, 4, '#3b1f10');
    rect(wctx, (seamX + 9) % 16, 12, 1, 4, '#3b1f10');
    sprites.tiles[`interior_wood_${v}`] = wc;

    // Polished Checkered Marble / Masonry Floor (Bank Hall, Smithy, Observatory)
    const { c: sc, ctx: sctx } = makeCanvas(16, 16);
    rect(sctx, 0, 0, 16, 16, v === 0 ? '#334155' : '#293548');
    rect(sctx, 0, 0, 8, 8, '#3e4c63');
    rect(sctx, 8, 8, 8, 8, '#3e4c63');
    rect(sctx, 0, 7, 16, 1, '#1e293b');
    rect(sctx, 7, 0, 1, 16, '#1e293b');
    rect(sctx, 1, 1, 6, 1, '#64748b');
    rect(sctx, 9, 9, 6, 1, '#64748b');
    sprites.tiles[`interior_stone_${v}`] = sc;

    // Wainscoted Timber & Plaster Wall Trim
    const { c: wallc, ctx: wallctx } = makeCanvas(16, 16);
    rect(wallctx, 0, 0, 16, 4, '#1a110d');
    rect(wallctx, 0, 4, 16, 6, v === 0 ? '#cbb89d' : '#c2ae92');
    rect(wallctx, 0, 10, 16, 6, '#57331c');
    rect(wallctx, 0, 10, 16, 1, '#855331');
    rect(wallctx, 3, 12, 1, 3, '#3b1f10');
    rect(wallctx, 11, 12, 1, 3, '#3b1f10');
    rect(wallctx, 0, 15, 16, 1, '#29150a');
    sprites.tiles[`interior_wall_${v}`] = wallc;

    // Atmospheric Dark Indoor Surround Void
    const { c: vc, ctx: vctx } = makeCanvas(16, 16);
    rect(vctx, 0, 0, 16, 16, v === 0 ? '#07050c' : '#09060f');
    px(vctx, v === 0 ? 4 : 11, 7, '#110d1a');
    sprites.tiles[`interior_void_${v}`] = vc;
  }

  // Ornate Interior Rugs (Red, Blue, Green, Purple)
  const carpetColors = {
    red: ['#7f1d1d', '#991b1b', '#facc15', '#b91c1c'],
    blue: ['#1e3a8a', '#1d4ed8', '#38bdf8', '#2563eb'],
    green: ['#14532d', '#166534', '#fde047', '#15803d'],
    purple: ['#4c1d95', '#5b21b6', '#e879f9', '#6d28d9'],
  };
  for (const [key, [dark, mid, trim, hi]] of Object.entries(carpetColors)) {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, mid);
    rect(ctx, 1, 1, 14, 14, dark);
    rect(ctx, 2, 2, 12, 12, mid);
    px(ctx, 4, 4, trim);
    px(ctx, 11, 4, trim);
    px(ctx, 4, 11, trim);
    px(ctx, 11, 11, trim);
    rect(ctx, 6, 6, 4, 4, hi);
    rect(ctx, 7, 7, 2, 2, trim);
    sprites.tiles[`interior_carpet_${key}`] = c;
  }

  // Welcoming Exit Doormat with South Arrow
  {
    const { c, ctx } = makeCanvas(16, 16);
    rect(ctx, 0, 0, 16, 16, '#452715');
    rect(ctx, 1, 2, 14, 12, '#92400e');
    rect(ctx, 2, 3, 12, 10, '#b45309');
    rect(ctx, 3, 4, 10, 8, '#78350f');
    // Glowing golden exit chevron pointing south
    rect(ctx, 7, 5, 2, 4, '#fde047');
    rect(ctx, 5, 8, 6, 1, '#fde047');
    rect(ctx, 6, 9, 4, 1, '#fef08a');
    rect(ctx, 7, 10, 2, 1, '#ffffff');
    sprites.tiles.interior_doormat = c;
  }

}
