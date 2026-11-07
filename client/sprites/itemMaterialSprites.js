// ==========================================
// 16-Bit Pixel Art Item Sprites — Currencies, Materials, Consumables, Gems & Runes
// ==========================================

export function drawMaterialItemPixels(ctx, id, px, rect) {
  switch (id) {
    // --- 8. CURRENCIES ---
    case 'solar_gold': {
      // Minted 24x24 Golden Sovereign with sun motif
      rect(ctx, 6, 4, 12, 16, '#ca8a04');
      rect(ctx, 4, 6, 16, 12, '#ca8a04');
      rect(ctx, 5, 5, 14, 14, '#eab308');
      rect(ctx, 6, 6, 12, 12, '#fde047');
      // Sunburst inner emblem
      rect(ctx, 10, 9, 4, 6, '#fef08a');
      rect(ctx, 9, 10, 6, 4, '#fef08a');
      rect(ctx, 11, 11, 2, 2, '#ffffff');
      px(ctx, 11, 8, '#ca8a04');
      px(ctx, 12, 8, '#ca8a04');
      px(ctx, 11, 15, '#ca8a04');
      px(ctx, 12, 15, '#ca8a04');
      break;
    }

    case 'glimmer_shard': {
      // Faceted luminous crystal diamond
      rect(ctx, 10, 3, 4, 3, '#c084fc');
      rect(ctx, 7, 6, 10, 5, '#a855f7');
      rect(ctx, 5, 11, 14, 4, '#7e22ce');
      rect(ctx, 7, 15, 10, 4, '#9333ea');
      rect(ctx, 9, 19, 6, 2, '#c084fc');
      rect(ctx, 11, 21, 2, 1, '#e9d5ff');
      // Brilliant facet shine
      rect(ctx, 9, 8, 4, 5, '#38bdf8');
      px(ctx, 10, 9, '#ffffff');
      px(ctx, 11, 9, '#ffffff');
      break;
    }

    case 'chrono_gem': {
      // Glowing sapphire sphere with time rings
      rect(ctx, 6, 6, 12, 12, '#0284c7');
      rect(ctx, 7, 7, 10, 10, '#0284c7');
      rect(ctx, 8, 8, 8, 8, '#38bdf8');
      rect(ctx, 10, 10, 4, 4, '#ffffff'); // core flash
      // Orbit rings
      px(ctx, 4, 11, '#fde047');
      px(ctx, 5, 12, '#fde047');
      px(ctx, 18, 12, '#fde047');
      px(ctx, 19, 11, '#fde047');
      break;
    }

    case 'verdant_amber': {
      // Golden-green amber with embedded leaf
      rect(ctx, 6, 5, 12, 14, '#a16207');
      rect(ctx, 7, 6, 10, 12, '#ca8a04');
      rect(ctx, 8, 7, 8, 10, '#eab308');
      // Preserved green leaf
      px(ctx, 11, 9, '#15803d');
      rect(ctx, 10, 10, 3, 3, '#22c55e');
      px(ctx, 11, 13, '#16a34a');
      px(ctx, 13, 8, '#ffffff'); // glass glint
      break;
    }

    case 'void_essence': {
      // Swirling violet black hole sphere
      rect(ctx, 6, 6, 12, 12, '#3b0764');
      rect(ctx, 7, 7, 10, 10, '#581c87');
      rect(ctx, 9, 9, 6, 6, '#05070f'); // black singularity
      px(ctx, 10, 10, '#c084fc');
      px(ctx, 13, 13, '#c084fc');
      // Tendrils
      px(ctx, 4, 8, '#a855f7');
      px(ctx, 19, 15, '#a855f7');
      px(ctx, 15, 4, '#c084fc');
      px(ctx, 8, 19, '#c084fc');
      break;
    }

    // --- 9. CONSUMABLES ---
    case 'minor_healing_salve': {
      // Glass potion bottle with red healing elixir
      rect(ctx, 10, 4, 4, 3, '#78350f'); // cork
      rect(ctx, 9, 7, 6, 2, '#94a3b8'); // bottle neck
      rect(ctx, 6, 9, 12, 11, '#cbd5e1'); // glass body
      rect(ctx, 7, 10, 10, 9, '#dc2626'); // red fluid
      rect(ctx, 8, 11, 8, 7, '#ef4444');
      px(ctx, 8, 12, '#ffffff'); // glass shine
      px(ctx, 8, 13, '#ffffff');
      px(ctx, 12, 14, '#fecaca'); // bubble
      break;
    }

    case 'glimmer_draught': {
      // Round potion flask with cyan fluid
      rect(ctx, 10, 4, 4, 3, '#78350f'); // cork
      rect(ctx, 9, 7, 6, 2, '#94a3b8'); // neck
      rect(ctx, 6, 9, 12, 11, '#cbd5e1');
      rect(ctx, 7, 10, 10, 9, '#0284c7');
      rect(ctx, 8, 11, 8, 7, '#38bdf8');
      px(ctx, 8, 12, '#ffffff');
      px(ctx, 8, 13, '#ffffff');
      px(ctx, 12, 14, '#e0f2fe'); // bubble
      break;
    }

    case 'major_vitality_elixir': {
      // Ornate flask with golden filigree and glowing ruby liquid
      rect(ctx, 10, 3, 4, 3, '#ca8a04'); // gold stopper
      rect(ctx, 9, 6, 6, 2, '#fde047'); // gold rim
      rect(ctx, 5, 8, 14, 13, '#cbd5e1'); // glass body
      rect(ctx, 6, 9, 12, 11, '#991b1b'); // deep red fluid
      rect(ctx, 7, 10, 10, 9, '#ef4444');
      rect(ctx, 8, 11, 8, 7, '#f87171');
      px(ctx, 7, 11, '#ffffff');
      px(ctx, 7, 12, '#ffffff');
      px(ctx, 13, 14, '#fecaca');
      break;
    }

    case 'sweet_apple': {
      // Crisp orchard apple with brown stem and green leaf
      rect(ctx, 11, 4, 2, 4, '#78350f'); // stem
      px(ctx, 13, 4, '#22c55e'); // leaf
      px(ctx, 14, 3, '#16a34a');
      rect(ctx, 6, 8, 12, 11, '#991b1b'); // apple body
      rect(ctx, 7, 7, 10, 13, '#dc2626');
      rect(ctx, 8, 8, 8, 11, '#ef4444');
      px(ctx, 8, 9, '#fca5a5'); // shine
      px(ctx, 9, 9, '#fca5a5');
      px(ctx, 8, 10, '#fca5a5');
      break;
    }

    case 'fresh_crusty_bread': {
      // Golden baked bread loaf with crust scoring
      rect(ctx, 5, 9, 14, 9, '#78350f'); // base crust
      rect(ctx, 4, 10, 16, 7, '#92400e');
      rect(ctx, 5, 8, 14, 8, '#b45309');
      rect(ctx, 6, 7, 12, 6, '#d97706');
      rect(ctx, 7, 8, 10, 4, '#f59e0b');
      // Slits in crust
      px(ctx, 8, 9, '#fef3c7');
      px(ctx, 9, 8, '#fef3c7');
      px(ctx, 11, 9, '#fef3c7');
      px(ctx, 12, 8, '#fef3c7');
      px(ctx, 14, 9, '#fef3c7');
      break;
    }

    case 'field_rations': {
      // Leather traveler pouch with dried jerky and trail bread
      rect(ctx, 7, 8, 10, 12, '#78350f'); // leather pouch
      rect(ctx, 6, 10, 12, 9, '#92400e');
      rect(ctx, 8, 7, 8, 3, '#ca8a04'); // twine tie
      // Smoked jerky strip sticking out
      rect(ctx, 8, 4, 3, 5, '#451a03');
      rect(ctx, 9, 4, 2, 4, '#7f1d1d');
      // Dried golden apricots
      px(ctx, 13, 5, '#f59e0b');
      px(ctx, 14, 6, '#d97706');
      break;
    }

    case 'iron_ore': {
      // Rough iron ore rock with metallic flecks
      rect(ctx, 6, 8, 12, 10, '#334155'); // stone core
      rect(ctx, 8, 6, 8, 13, '#475569');
      rect(ctx, 5, 10, 14, 7, '#1e293b');
      // Raw iron shiny veins
      px(ctx, 8, 8, '#94a3b8');
      px(ctx, 9, 8, '#cbd5e1');
      px(ctx, 13, 10, '#94a3b8');
      px(ctx, 14, 10, '#e2e8f0');
      px(ctx, 10, 14, '#cbd5e1');
      px(ctx, 11, 13, '#94a3b8');
      break;
    }

    case 'bronze_bar': {
      // Stackable bronze metal ingot with beveled gleam
      rect(ctx, 4, 9, 16, 8, '#78350f'); // shadow
      rect(ctx, 5, 8, 14, 8, '#92400e');
      rect(ctx, 6, 7, 12, 7, '#b45309');
      rect(ctx, 6, 7, 12, 2, '#d97706'); // top edge
      rect(ctx, 7, 8, 10, 2, '#f59e0b'); // gleam
      px(ctx, 8, 8, '#fef08a');
      px(ctx, 9, 8, '#fef08a');
      break;
    }

    case 'ancient_relic_fragment': {
      // Ancient stone tablet shard with glowing cyan runes
      rect(ctx, 6, 5, 12, 14, '#1e293b');
      rect(ctx, 7, 6, 10, 12, '#334155');
      rect(ctx, 8, 7, 8, 10, '#475569');
      // Chipped corners
      px(ctx, 6, 5, 'rgba(0,0,0,0)');
      px(ctx, 17, 18, 'rgba(0,0,0,0)');
      // Glowing aether runes
      px(ctx, 10, 8, '#38bdf8');
      px(ctx, 11, 9, '#7dd3fc');
      px(ctx, 11, 10, '#38bdf8');
      px(ctx, 12, 10, '#0284c7');
      px(ctx, 9, 12, '#38bdf8');
      px(ctx, 10, 13, '#7dd3fc');
      px(ctx, 11, 13, '#38bdf8');
      px(ctx, 11, 14, '#ffffff');
      break;
    }

    // --- COSMIC ORES & MINERALS ---
    case 'sun_copper_ore':
    case 'star_tin_mineral':
    case 'umbral_coal':
    case 'mithril_astral_ore':
    case 'adamant_terra_ore':
    case 'celestial_runite_ore': {
      const pal = {
        sun_copper_ore: ['#451a03', '#ea580c', '#fdba74'],
        star_tin_mineral: ['#334155', '#cbd5e1', '#ffffff'],
        umbral_coal: ['#0f172a', '#312e81', '#a855f7'],
        mithril_astral_ore: ['#1e3a8a', '#38bdf8', '#ffffff'],
        adamant_terra_ore: ['#064e3b', '#22c55e', '#bef264'],
        celestial_runite_ore: ['#3b0764', '#2dd4bf', '#f0abfc'],
      }[id];
      rect(ctx, 5, 8, 14, 10, '#334155');
      rect(ctx, 7, 6, 10, 11, '#475569');
      rect(ctx, 6, 10, 5, 5, pal[0]);
      rect(ctx, 7, 9, 4, 4, pal[1]);
      rect(ctx, 12, 7, 5, 7, pal[0]);
      rect(ctx, 13, 6, 3, 6, pal[1]);
      px(ctx, 14, 7, pal[2]);
      px(ctx, 8, 10, pal[2]);
      break;
    }

    case 'astral_mineral_dust': {
      rect(ctx, 6, 13, 12, 5, '#1e3a8a');
      rect(ctx, 8, 10, 8, 6, '#38bdf8');
      rect(ctx, 10, 8, 4, 4, '#bae6fd');
      px(ctx, 7, 8, '#fde047');
      px(ctx, 15, 7, '#e879f9');
      px(ctx, 11, 9, '#ffffff');
      break;
    }

    // --- SMELTED COSMIC INGOTS ---
    case 'star_iron_bar':
    case 'umbral_steel_bar':
    case 'astral_mithril_bar':
    case 'prismatic_adamant_bar':
    case 'celestial_starmetal_bar': {
      const barPal = {
        star_iron_bar: ['#334155', '#94a3b8', '#e0f2fe'],
        umbral_steel_bar: ['#1e1b4b', '#6366f1', '#c4b5fd'],
        astral_mithril_bar: ['#1e3a8a', '#0ea5e9', '#bae6fd'],
        prismatic_adamant_bar: ['#065f46', '#10b981', '#fde047'],
        celestial_starmetal_bar: ['#4c1d95', '#e879f9', '#67e8f9'],
      }[id];
      rect(ctx, 4, 11, 16, 6, barPal[0]);
      rect(ctx, 5, 9, 14, 6, barPal[1]);
      rect(ctx, 6, 8, 12, 3, barPal[2]);
      px(ctx, 8, 9, '#ffffff');
      break;
    }

    // --- BOTANICAL HERBS & LUMINESCENT FIBERS ---
    case 'sunbloom_herb':
    case 'chrono_lotus':
    case 'empyrean_starleaf': {
      const herbColor = id === 'sunbloom_herb' ? '#facc15' : id === 'chrono_lotus' ? '#38bdf8' : '#e879f9';
      rect(ctx, 11, 11, 2, 8, '#16a34a');
      rect(ctx, 7, 13, 4, 2, '#22c55e');
      rect(ctx, 13, 14, 4, 2, '#22c55e');
      rect(ctx, 8, 6, 8, 6, herbColor);
      rect(ctx, 10, 5, 4, 7, '#ffffff');
      px(ctx, 11, 8, herbColor);
      break;
    }

    case 'gloomcap_spore': {
      rect(ctx, 10, 12, 4, 7, '#cbd5e1');
      rect(ctx, 6, 7, 12, 6, '#6b21a8');
      rect(ctx, 8, 5, 8, 4, '#a855f7');
      px(ctx, 8, 9, '#5eead4');
      px(ctx, 14, 8, '#5eead4');
      px(ctx, 11, 6, '#f0abfc');
      break;
    }

    case 'starlight_flax':
    case 'shadow_silk':
    case 'celestial_gossamer': {
      const skein = id === 'starlight_flax' ? ['#0284c7', '#bae6fd'] : id === 'shadow_silk' ? ['#581c87', '#c084fc'] : ['#0d9488', '#fef08a'];
      rect(ctx, 6, 6, 12, 12, skein[0]);
      rect(ctx, 7, 8, 10, 8, skein[1]);
      rect(ctx, 9, 10, 6, 4, '#f59e0b'); // Gold band wrap
      px(ctx, 8, 9, '#ffffff');
      break;
    }

    // --- LEYLINE SOCKET GEMS ---
    case 'gem_solar_ruby':
    case 'gem_void_sapphire':
    case 'gem_terra_emerald':
    case 'gem_aether_diamond': {
      const gemPal = {
        gem_solar_ruby: ['#991b1b', '#ef4444', '#fde047'],
        gem_void_sapphire: ['#3b0764', '#8b5cf6', '#38bdf8'],
        gem_terra_emerald: ['#065f46', '#10b981', '#bef264'],
        gem_aether_diamond: ['#0c4a6e', '#38bdf8', '#ffffff'],
      }[id];
      rect(ctx, 8, 5, 8, 14, gemPal[0]);
      rect(ctx, 6, 7, 12, 10, gemPal[0]);
      rect(ctx, 8, 7, 8, 10, gemPal[1]);
      rect(ctx, 10, 8, 4, 6, gemPal[2]);
      px(ctx, 10, 8, '#ffffff');
      break;
    }

    // --- ARTISAN CONSUMABLES & FEASTS ---
    case 'astral_battle_tonic':
    case 'chrono_overdrive_draught':
    case 'empyrean_nectar': {
      const liq = id === 'astral_battle_tonic' ? '#a855f7' : id === 'chrono_overdrive_draught' ? '#38bdf8' : '#facc15';
      rect(ctx, 9, 4, 6, 3, '#d97706');
      rect(ctx, 10, 7, 4, 3, '#cbd5e1');
      rect(ctx, 6, 10, 12, 9, '#1e293b');
      rect(ctx, 7, 11, 10, 7, liq);
      rect(ctx, 9, 12, 4, 4, '#ffffff');
      break;
    }

    case 'spiced_orchard_pie':
    case 'starfire_banquet_feast': {
      rect(ctx, 4, 12, 16, 6, '#78350f');
      rect(ctx, 5, 9, 14, 6, id === 'spiced_orchard_pie' ? '#f59e0b' : '#dc2626');
      rect(ctx, 7, 8, 10, 3, '#fde047');
      px(ctx, 9, 6, '#ffffff');
      px(ctx, 14, 5, '#bae6fd');
      break;
    }

    // --- ANCIENT LEYLINE RUNES (RUNEWORDS) ---
    case 'rune_sol':
    case 'rune_umb':
    case 'rune_ter':
    case 'rune_aet':
    case 'rune_zod': {
      const stoneDark = id === 'rune_zod' ? '#312e81' : '#1e293b';
      const stoneMid = id === 'rune_zod' ? '#4338ca' : '#334155';
      const stoneRim = id === 'rune_zod' ? '#facc15' : '#64748b';
      const glowMap = {
        rune_sol: ['#d97706', '#facc15', '#fef08a'],
        rune_umb: ['#7e22ce', '#c084fc', '#f3e8ff'],
        rune_ter: ['#15803d', '#4ade80', '#dcfce7'],
        rune_aet: ['#0284c7', '#38bdf8', '#e0f2fe'],
        rune_zod: ['#c026d3', '#f0abfc', '#ffffff'],
      };
      const [gDark, gBright, gCore] = glowMap[id];
      // Carved stone tablet body
      rect(ctx, 6, 3, 12, 18, stoneDark);
      rect(ctx, 5, 5, 14, 14, stoneDark);
      rect(ctx, 7, 4, 10, 16, stoneMid);
      rect(ctx, 6, 6, 12, 12, stoneMid);
      // Beveled stone highlight rim
      rect(ctx, 7, 4, 10, 1, stoneRim);
      px(ctx, 6, 5, stoneRim);
      px(ctx, 17, 5, stoneRim);
      // Distinct faction runic glyph
      if (id === 'rune_sol') {
        rect(ctx, 10, 8, 4, 8, gDark);
        rect(ctx, 8, 10, 8, 4, gDark);
        rect(ctx, 10, 9, 4, 6, gBright);
        rect(ctx, 9, 11, 6, 2, gBright);
        rect(ctx, 11, 11, 2, 2, gCore);
        px(ctx, 11, 6, gBright);
        px(ctx, 12, 17, gBright);
      } else if (id === 'rune_umb') {
        rect(ctx, 9, 7, 6, 2, gBright);
        rect(ctx, 8, 9, 3, 6, gBright);
        rect(ctx, 9, 15, 6, 2, gBright);
        rect(ctx, 13, 10, 2, 4, gDark);
        px(ctx, 12, 11, gCore);
        px(ctx, 9, 11, gCore);
      } else if (id === 'rune_ter') {
        rect(ctx, 11, 6, 2, 12, gBright);
        rect(ctx, 8, 8, 8, 2, gBright);
        rect(ctx, 9, 12, 6, 2, gDark);
        px(ctx, 8, 10, gCore);
        px(ctx, 15, 10, gCore);
        px(ctx, 11, 8, gCore);
      } else if (id === 'rune_aet') {
        rect(ctx, 8, 7, 8, 2, gBright);
        rect(ctx, 10, 9, 4, 2, gDark);
        rect(ctx, 11, 11, 2, 2, gCore);
        rect(ctx, 10, 13, 4, 2, gDark);
        rect(ctx, 8, 15, 8, 2, gBright);
      } else {
        // Zod apex cosmic star glyph
        rect(ctx, 8, 7, 8, 2, gBright);
        rect(ctx, 12, 9, 2, 2, gBright);
        rect(ctx, 10, 11, 4, 2, gCore);
        rect(ctx, 9, 13, 2, 2, gBright);
        rect(ctx, 8, 15, 8, 2, gBright);
        px(ctx, 7, 11, '#fde047');
        px(ctx, 16, 11, '#fde047');
      }
      break;
    }

    // Default Fallback (including Mythic Leyline Keystones)
    default: {
      if (String(id).startsWith('keystone_')) {
        const kc = id.includes('solari') ? '#facc15' : id.includes('umbri') ? '#c084fc' : id.includes('terra') ? '#4ade80' : '#38bdf8';
        rect(ctx, 8, 4, 8, 7, kc);
        rect(ctx, 10, 6, 4, 3, '#0f172a');
        rect(ctx, 11, 11, 2, 9, kc);
        rect(ctx, 13, 15, 3, 2, kc);
        rect(ctx, 13, 18, 3, 2, kc);
        px(ctx, 9, 5, '#ffffff');
        break;
      }
      rect(ctx, 6, 6, 12, 12, '#ca8a04');
      rect(ctx, 7, 7, 10, 10, '#facc15');
      px(ctx, 11, 11, '#ffffff');
      break;
    }
  }
}
