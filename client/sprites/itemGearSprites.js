// ==========================================
// 16-Bit Pixel Art Item Sprites — Weapons, Armor, Accessories & Relics
// ==========================================

export function drawGearItemPixels(ctx, id, px, rect) {
  switch (id) {
    // --- 1. WEAPONS ---
    case 'solari_spellblade': {
      // Golden glowing short blade with sunburst pommel
      rect(ctx, 4, 18, 4, 2, '#78350f'); // grip
      rect(ctx, 3, 20, 2, 2, '#f59e0b'); // pommel
      rect(ctx, 6, 16, 7, 2, '#fde047'); // crossguard
      rect(ctx, 8, 14, 3, 3, '#fbbf24');
      for (let i = 0; i < 9; i++) {
        rect(ctx, 9 + i, 13 - i, 2, 2, '#fef08a');
        px(ctx, 10 + i, 12 - i, '#ffffff');
        px(ctx, 9 + i, 14 - i, '#f59e0b');
      }
      px(ctx, 18, 4, '#ffffff'); // blade tip sparkle
      break;
    }

    case 'sunfire_greatsword': {
      // Massive fiery broadsword
      rect(ctx, 3, 19, 3, 3, '#78350f');
      rect(ctx, 2, 21, 2, 2, '#d97706');
      rect(ctx, 5, 16, 8, 3, '#f59e0b'); // wide guard
      for (let i = 0; i < 11; i++) {
        rect(ctx, 8 + i, 14 - i, 4, 3, '#ea580c');
        rect(ctx, 9 + i, 13 - i, 2, 2, '#fde047');
        px(ctx, 10 + i, 12 - i, '#ffffff');
      }
      px(ctx, 20, 2, '#fef08a');
      break;
    }

    case 'sunforged_warhammer': {
      // Heavy golden square warhammer
      rect(ctx, 4, 18, 3, 4, '#78350f');
      rect(ctx, 7, 14, 2, 5, '#92400e');
      rect(ctx, 9, 11, 2, 4, '#b45309');
      rect(ctx, 11, 8, 2, 4, '#d97706');
      // Hammer head
      rect(ctx, 11, 4, 9, 7, '#f59e0b');
      rect(ctx, 12, 5, 7, 5, '#fbbf24');
      rect(ctx, 14, 6, 3, 3, '#ffffff'); // core shine
      rect(ctx, 19, 5, 2, 5, '#fde047'); // striking face
      rect(ctx, 9, 6, 2, 3, '#b45309'); // back spike
      break;
    }

    case 'aurelius_morningstar_blade': {
      // Morningstar flail blade with star spikes
      rect(ctx, 3, 19, 3, 3, '#78350f');
      rect(ctx, 5, 16, 2, 4, '#cbd5e1');
      rect(ctx, 7, 13, 2, 4, '#94a3b8');
      // Flail head
      rect(ctx, 12, 4, 8, 8, '#ffffff');
      rect(ctx, 13, 5, 6, 6, '#fde047');
      rect(ctx, 14, 6, 4, 4, '#f59e0b');
      // Radiating spikes
      px(ctx, 15, 2, '#ffffff');
      px(ctx, 16, 2, '#ffffff');
      px(ctx, 15, 13, '#ffffff');
      px(ctx, 16, 13, '#ffffff');
      px(ctx, 10, 7, '#ffffff');
      px(ctx, 10, 8, '#ffffff');
      px(ctx, 21, 7, '#ffffff');
      px(ctx, 21, 8, '#ffffff');
      break;
    }

    case 'scythe_soulreaper': {
      // Curved obsidian scythe
      rect(ctx, 5, 18, 2, 4, '#334155');
      rect(ctx, 7, 14, 2, 5, '#1e293b');
      rect(ctx, 9, 10, 2, 5, '#0f172a');
      rect(ctx, 11, 6, 2, 5, '#1e293b');
      // Blade
      rect(ctx, 11, 4, 8, 3, '#7e22ce');
      rect(ctx, 15, 6, 5, 3, '#a855f7');
      rect(ctx, 18, 8, 3, 5, '#c084fc');
      px(ctx, 19, 13, '#e9d5ff');
      px(ctx, 12, 3, '#c084fc');
      break;
    }

    case 'void_soulblade': {
      // Deep purple shadow rapier
      rect(ctx, 4, 18, 3, 3, '#1e1b4b');
      rect(ctx, 3, 17, 4, 2, '#4c1d95');
      rect(ctx, 6, 15, 5, 2, '#6d28d9');
      for (let i = 0; i < 11; i++) {
        rect(ctx, 8 + i, 13 - i, 2, 2, '#a855f7');
        px(ctx, 9 + i, 12 - i, '#c084fc');
      }
      px(ctx, 19, 2, '#f3e8ff');
      break;
    }

    case 'duskveil_twin_daggers': {
      // Crossed shadow daggers
      // Dagger 1 (bottom-left to top-right)
      rect(ctx, 4, 18, 3, 3, '#1e1b4b');
      rect(ctx, 6, 15, 4, 2, '#6b21a8');
      for (let i = 0; i < 6; i++) {
        rect(ctx, 8 + i, 14 - i, 2, 2, '#9333ea');
        px(ctx, 9 + i, 13 - i, '#c084fc');
      }
      // Dagger 2 (top-left to bottom-right)
      rect(ctx, 4, 5, 3, 3, '#1e1b4b');
      rect(ctx, 6, 7, 4, 2, '#6b21a8');
      for (let i = 0; i < 6; i++) {
        rect(ctx, 8 + i, 9 + i, 2, 2, '#9333ea');
        px(ctx, 9 + i, 10 + i, '#c084fc');
      }
      break;
    }

    case 'ironwood_maul': {
      // Heavy vine-wrapped stone club
      rect(ctx, 5, 17, 3, 4, '#713f12');
      rect(ctx, 8, 13, 3, 5, '#854d0e');
      rect(ctx, 11, 9, 3, 5, '#a16207');
      // Maul rock
      rect(ctx, 11, 4, 9, 8, '#475569');
      rect(ctx, 12, 5, 7, 6, '#64748b');
      px(ctx, 14, 7, '#22c55e'); // embedded moss
      px(ctx, 15, 7, '#4ade80');
      px(ctx, 16, 8, '#16a34a');
      break;
    }

    case 'ironwood_spear': {
      // Wooden spear with leaf-wrapped flint tip
      rect(ctx, 3, 19, 2, 3, '#713f12');
      for (let i = 0; i < 11; i++) {
        px(ctx, 5 + i, 17 - i, '#854d0e');
        px(ctx, 6 + i, 17 - i, '#a16207');
      }
      // Flint tip
      rect(ctx, 15, 6, 4, 4, '#15803d');
      rect(ctx, 17, 4, 3, 3, '#22c55e');
      px(ctx, 19, 2, '#86efac');
      px(ctx, 14, 8, '#4ade80');
      break;
    }

    case 'chronocore_staff': {
      // Astrolabe brass staff with rotating cyan crystal
      rect(ctx, 4, 18, 2, 4, '#78350f');
      for (let i = 0; i < 8; i++) {
        px(ctx, 6 + i, 16 - i, '#92400e');
        px(ctx, 7 + i, 16 - i, '#d97706');
      }
      // Rings and Core
      rect(ctx, 12, 4, 8, 8, '#0284c7');
      rect(ctx, 14, 5, 4, 6, '#38bdf8');
      rect(ctx, 15, 6, 2, 4, '#e0f2fe');
      px(ctx, 11, 7, '#fde047');
      px(ctx, 20, 7, '#fde047');
      break;
    }

    case 'chrono_warp_staff': {
      // Deep celestial staff with time crescent
      rect(ctx, 4, 18, 2, 4, '#1e1b4b');
      for (let i = 0; i < 9; i++) {
        px(ctx, 6 + i, 16 - i, '#312e81');
        px(ctx, 7 + i, 16 - i, '#4338ca');
      }
      // Crescent moon head
      rect(ctx, 13, 3, 7, 3, '#0284c7');
      rect(ctx, 17, 5, 4, 6, '#38bdf8');
      rect(ctx, 13, 9, 6, 3, '#0284c7');
      rect(ctx, 14, 6, 3, 3, '#ffffff'); // floating warp orb
      break;
    }

    case 'iron_broadsword': {
      // Classic steel broadsword
      rect(ctx, 4, 18, 3, 3, '#78350f');
      rect(ctx, 3, 20, 2, 2, '#d97706');
      rect(ctx, 6, 15, 7, 2, '#64748b'); // steel crossguard
      for (let i = 0; i < 9; i++) {
        rect(ctx, 8 + i, 13 - i, 3, 2, '#94a3b8');
        px(ctx, 9 + i, 12 - i, '#cbd5e1');
        px(ctx, 10 + i, 12 - i, '#ffffff');
      }
      px(ctx, 18, 3, '#f8fafc');
      break;
    }

    case 'novice_oak_staff': {
      // Simple carved oak staff with amber head
      rect(ctx, 4, 19, 2, 3, '#78350f');
      for (let i = 0; i < 11; i++) {
        px(ctx, 6 + i, 17 - i, '#854d0e');
        px(ctx, 7 + i, 17 - i, '#a16207');
      }
      rect(ctx, 16, 4, 4, 4, '#d97706');
      rect(ctx, 17, 5, 2, 2, '#fde047');
      break;
    }

    // --- 2. SHIELDS & OFFHANDS ---
    case 'radiant_shield':
    case 'dawnfire_crest': {
      // Golden kite shield with sun emblem
      rect(ctx, 5, 3, 14, 4, '#ca8a04');
      rect(ctx, 6, 7, 12, 6, '#eab308');
      rect(ctx, 7, 13, 10, 5, '#facc15');
      rect(ctx, 9, 18, 6, 3, '#eab308');
      rect(ctx, 11, 21, 2, 2, '#ca8a04');
      // Center sun
      rect(ctx, 10, 8, 4, 4, '#ffffff');
      break;
    }

    case 'mirror_shield': {
      // Silver tower shield with cyan reflect
      rect(ctx, 6, 3, 12, 17, '#64748b');
      rect(ctx, 7, 4, 10, 15, '#cbd5e1');
      rect(ctx, 8, 5, 8, 13, '#38bdf8');
      rect(ctx, 9, 6, 3, 11, '#ffffff');
      break;
    }

    case 'graveglass_lantern': {
      // Wrought iron lantern with violet flame
      rect(ctx, 9, 3, 6, 2, '#334155');
      rect(ctx, 7, 5, 10, 3, '#475569');
      rect(ctx, 8, 8, 8, 9, '#1e1b4b');
      // Flame
      rect(ctx, 10, 10, 4, 5, '#a855f7');
      rect(ctx, 11, 11, 2, 3, '#f3e8ff');
      rect(ctx, 7, 17, 10, 3, '#475569');
      break;
    }

    case 'bramble_buckler': {
      // Round wooden shield with green vines
      rect(ctx, 6, 5, 12, 14, '#78350f');
      rect(ctx, 7, 6, 10, 12, '#92400e');
      rect(ctx, 10, 9, 4, 4, '#475569'); // iron center boss
      px(ctx, 11, 10, '#94a3b8');
      // Vines
      rect(ctx, 6, 11, 4, 2, '#16a34a');
      rect(ctx, 14, 8, 3, 2, '#22c55e');
      break;
    }

    case 'prismatic_keystone':
    case 'chronos_singularity_core': {
      // Floating cyan & violet geometric crystal
      rect(ctx, 10, 3, 4, 4, '#38bdf8');
      rect(ctx, 7, 7, 10, 8, '#0284c7');
      rect(ctx, 9, 8, 6, 6, '#c084fc');
      rect(ctx, 10, 9, 4, 4, '#ffffff');
      rect(ctx, 9, 15, 6, 4, '#1e40af');
      rect(ctx, 11, 19, 2, 2, '#38bdf8');
      break;
    }

    case 'iron_heater_shield': {
      // Classic iron heater shield
      rect(ctx, 6, 4, 12, 4, '#475569');
      rect(ctx, 6, 8, 12, 6, '#64748b');
      rect(ctx, 7, 14, 10, 4, '#94a3b8');
      rect(ctx, 9, 18, 6, 3, '#64748b');
      rect(ctx, 11, 21, 2, 1, '#475569');
      // Gold cross
      rect(ctx, 11, 6, 2, 11, '#f59e0b');
      rect(ctx, 8, 9, 8, 2, '#f59e0b');
      break;
    }

    case 'apprentice_focus_orb': {
      // Glass orb in brass stand
      rect(ctx, 7, 5, 10, 10, '#0284c7');
      rect(ctx, 8, 6, 8, 8, '#38bdf8');
      rect(ctx, 9, 7, 4, 4, '#ffffff');
      // Tripod stand
      rect(ctx, 10, 15, 4, 3, '#b45309');
      rect(ctx, 8, 18, 2, 3, '#d97706');
      rect(ctx, 14, 18, 2, 3, '#d97706');
      break;
    }

    // --- 3. HELMETS & HEADWEAR ---
    case 'sunforged_greathelm': {
      // Golden crusader greathelm
      rect(ctx, 6, 4, 12, 15, '#eab308');
      rect(ctx, 7, 5, 10, 13, '#facc15');
      // Cross visor slit
      rect(ctx, 7, 10, 10, 2, '#05070f');
      rect(ctx, 11, 7, 2, 9, '#05070f');
      // Gold glint
      rect(ctx, 8, 6, 2, 2, '#ffffff');
      break;
    }

    case 'ironwood_horned_helm': {
      // Bark helm with stag horns
      rect(ctx, 7, 8, 10, 11, '#78350f');
      rect(ctx, 8, 9, 8, 9, '#92400e');
      rect(ctx, 9, 13, 6, 2, '#05070f'); // eye slit
      // Horns
      px(ctx, 5, 4, '#d97706');
      rect(ctx, 6, 5, 2, 3, '#b45309');
      px(ctx, 18, 4, '#d97706');
      rect(ctx, 16, 5, 2, 3, '#b45309');
      break;
    }

    case 'chrono_astral_hood': {
      // Celestial starlight cowl
      rect(ctx, 7, 4, 10, 14, '#1e3a8a');
      rect(ctx, 8, 5, 8, 12, '#1d4ed8');
      rect(ctx, 9, 9, 6, 6, '#05070f'); // face opening
      rect(ctx, 10, 11, 4, 2, '#fde047'); // glowing eyes/runes
      rect(ctx, 6, 17, 12, 3, '#3b82f6'); // mantle collar
      px(ctx, 11, 5, '#ffffff'); // star stitch
      break;
    }

    case 'duskveil_shadow_mask': {
      // Sleek dark ninja mask
      rect(ctx, 7, 6, 10, 12, '#3b0764');
      rect(ctx, 8, 7, 8, 10, '#581c87');
      rect(ctx, 9, 10, 6, 2, '#a855f7'); // purple slit eyes
      rect(ctx, 10, 10, 4, 2, '#f3e8ff');
      rect(ctx, 7, 14, 10, 4, '#2e1065'); // lower cowl wrap
      break;
    }

    case 'crown_of_dawn': {
      // Radiating golden crown
      rect(ctx, 6, 12, 12, 4, '#ca8a04');
      rect(ctx, 7, 13, 10, 2, '#facc15');
      // 5 Spikes
      rect(ctx, 6, 8, 2, 4, '#fde047');
      rect(ctx, 9, 6, 2, 6, '#fde047');
      rect(ctx, 11, 4, 2, 8, '#ffffff'); // center spike
      rect(ctx, 13, 6, 2, 6, '#fde047');
      rect(ctx, 16, 8, 2, 4, '#fde047');
      // Center jewel
      px(ctx, 11, 13, '#38bdf8');
      px(ctx, 12, 13, '#ffffff');
      break;
    }

    // --- 4. BODY ARMOR & CHEST ---
    case 'sunforged_plate':
    case 'sunforged_hauberk':
    case 'aurelius_sovereign_plate': {
      // Golden / Archon plate armor
      rect(ctx, 5, 4, 14, 5, '#ca8a04'); // pauldrons
      rect(ctx, 7, 5, 10, 13, '#eab308');
      rect(ctx, 8, 6, 8, 11, '#fde047');
      // Chest crest
      rect(ctx, 10, 8, 4, 5, '#ffffff');
      rect(ctx, 7, 16, 10, 3, '#a16207'); // belt
      rect(ctx, 11, 16, 2, 3, '#fef08a');
      break;
    }

    case 'ironwood_armor':
    case 'ironwood_bark_chest':
    case 'primordial_bark_chest': {
      // Bark armor with vine motif
      rect(ctx, 6, 5, 12, 13, '#78350f');
      rect(ctx, 7, 6, 10, 11, '#92400e');
      rect(ctx, 9, 8, 6, 7, '#15803d'); // leaf breastplate
      rect(ctx, 10, 9, 4, 5, '#22c55e');
      rect(ctx, 6, 16, 12, 3, '#451a03'); // belt
      break;
    }

    case 'starweave_robe':
    case 'chrono_astral_robes': {
      // Celestial blue robes
      rect(ctx, 6, 4, 12, 15, '#1e3a8a');
      rect(ctx, 7, 5, 10, 13, '#2563eb');
      rect(ctx, 9, 6, 6, 12, '#38bdf8');
      rect(ctx, 11, 7, 2, 10, '#ffffff'); // starlight center line
      rect(ctx, 7, 13, 10, 2, '#fde047'); // sash
      break;
    }

    case 'duskveil_shroud':
    case 'duskveil_assassin_garb': {
      // Midnight violet assassin garb
      rect(ctx, 6, 5, 12, 14, '#1e1b4b');
      rect(ctx, 7, 6, 10, 12, '#312e81');
      rect(ctx, 8, 7, 8, 10, '#4c1d95');
      rect(ctx, 10, 8, 4, 8, '#7e22ce');
      rect(ctx, 7, 14, 10, 2, '#a855f7'); // belt
      break;
    }

    case 'scout_leather_tunic': {
      // Brown leather vest
      rect(ctx, 6, 5, 12, 13, '#78350f');
      rect(ctx, 7, 6, 10, 11, '#92400e');
      rect(ctx, 9, 7, 6, 9, '#b45309');
      rect(ctx, 7, 14, 10, 2, '#451a03'); // belt
      px(ctx, 11, 14, '#fde047'); // belt buckle
      break;
    }

    // --- 5. LEGS ---
    case 'sunforged_greaves':
    case 'aurelius_starforged_greaves': {
      // Golden plate greaves
      rect(ctx, 6, 4, 5, 15, '#ca8a04');
      rect(ctx, 13, 4, 5, 15, '#ca8a04');
      rect(ctx, 7, 5, 3, 13, '#facc15');
      rect(ctx, 14, 5, 3, 13, '#facc15');
      rect(ctx, 7, 8, 3, 4, '#ffffff'); // knee glint
      rect(ctx, 14, 8, 3, 4, '#ffffff');
      break;
    }

    case 'ironwood_thighguards': {
      // Bark thigh guards
      rect(ctx, 6, 5, 5, 14, '#78350f');
      rect(ctx, 13, 5, 5, 14, '#78350f');
      rect(ctx, 7, 6, 3, 12, '#92400e');
      rect(ctx, 14, 6, 3, 12, '#92400e');
      rect(ctx, 6, 10, 5, 2, '#22c55e'); // vine wrap
      rect(ctx, 13, 10, 5, 2, '#22c55e');
      break;
    }

    case 'chrono_astral_skirt': {
      // Astral tiered battle skirt
      rect(ctx, 6, 4, 12, 4, '#1e3a8a');
      rect(ctx, 5, 8, 6, 11, '#2563eb');
      rect(ctx, 13, 8, 6, 11, '#2563eb');
      rect(ctx, 7, 9, 3, 9, '#38bdf8');
      rect(ctx, 14, 9, 3, 9, '#38bdf8');
      rect(ctx, 6, 4, 12, 2, '#fde047'); // gold waist
      break;
    }

    case 'duskveil_void_chaps': {
      // Violet dark assassin chaps
      rect(ctx, 6, 5, 5, 14, '#1e1b4b');
      rect(ctx, 13, 5, 5, 14, '#1e1b4b');
      rect(ctx, 7, 6, 3, 12, '#4c1d95');
      rect(ctx, 14, 6, 3, 12, '#4c1d95');
      rect(ctx, 6, 11, 5, 2, '#a855f7'); // purple straps
      rect(ctx, 13, 11, 5, 2, '#a855f7');
      break;
    }

    case 'scout_leather_leggings': {
      // Stitched leather breeches
      rect(ctx, 6, 5, 5, 14, '#78350f');
      rect(ctx, 13, 5, 5, 14, '#78350f');
      rect(ctx, 7, 6, 3, 12, '#92400e');
      rect(ctx, 14, 6, 3, 12, '#92400e');
      rect(ctx, 7, 10, 3, 3, '#a16207'); // knee patch
      rect(ctx, 14, 10, 3, 3, '#a16207');
      break;
    }

    // --- 6. CAPES ---
    case 'fire_cape': {
      // Animated lava magma mantle
      rect(ctx, 6, 4, 12, 3, '#b45309');
      rect(ctx, 5, 7, 14, 14, '#ea580c');
      rect(ctx, 6, 8, 12, 12, '#f97316');
      rect(ctx, 7, 10, 10, 9, '#fde047');
      px(ctx, 8, 14, '#ef4444');
      px(ctx, 13, 12, '#ef4444');
      px(ctx, 10, 16, '#ffffff');
      break;
    }

    case 'radiant_cape': {
      // Golden Order mantle
      rect(ctx, 7, 4, 10, 3, '#ca8a04');
      rect(ctx, 5, 7, 14, 14, '#eab308');
      rect(ctx, 6, 8, 12, 12, '#facc15');
      rect(ctx, 11, 8, 2, 10, '#ffffff'); // white stripe
      break;
    }

    case 'abyssal_cloak': {
      // Dark mist cloak
      rect(ctx, 7, 4, 10, 3, '#312e81');
      rect(ctx, 5, 7, 14, 14, '#1e1b4b');
      rect(ctx, 6, 8, 12, 11, '#3b0764');
      rect(ctx, 7, 16, 10, 3, '#581c87');
      break;
    }

    case 'linen_traveller_cloak': {
      // Green travel cloak
      rect(ctx, 7, 4, 10, 3, '#14532d');
      rect(ctx, 5, 7, 14, 14, '#166534');
      rect(ctx, 6, 8, 12, 12, '#15803d');
      px(ctx, 11, 5, '#fde047'); // gold clasp
      break;
    }

    // --- 7. AMULETS & RINGS ---
    case 'amulet_of_fury':
    case 'amulet_of_glory':
    case 'holy_blessing_relic': {
      // Golden necklace with red/blue gemstone
      rect(ctx, 7, 4, 10, 2, '#d97706');
      px(ctx, 6, 6, '#f59e0b');
      px(ctx, 17, 6, '#f59e0b');
      px(ctx, 7, 8, '#f59e0b');
      px(ctx, 16, 8, '#f59e0b');
      px(ctx, 9, 10, '#f59e0b');
      px(ctx, 14, 10, '#f59e0b');
      // Pendant
      rect(ctx, 10, 11, 4, 5, id === 'amulet_of_fury' ? '#dc2626' : '#0284c7');
      rect(ctx, 11, 12, 2, 3, id === 'amulet_of_fury' ? '#f87171' : '#38bdf8');
      px(ctx, 11, 12, '#ffffff');
      break;
    }

    case 'ring_of_the_sun':
    case 'ring_of_shadows':
    case 'ring_of_earth':
    case 'ring_of_time':
    case 'copper_ring': {
      // Golden / metallic ring with centered gem
      const bandCol = id === 'copper_ring' ? '#b45309' : id === 'ring_of_shadows' ? '#334155' : '#f59e0b';
      rect(ctx, 7, 8, 10, 9, bandCol);
      rect(ctx, 9, 10, 6, 5, '#05070f'); // center hole
      // Gem
      const gemCol = id === 'ring_of_the_sun' ? '#fde047' : id === 'ring_of_shadows' ? '#a855f7' : id === 'ring_of_earth' ? '#22c55e' : id === 'ring_of_time' ? '#38bdf8' : '#d97706';
      rect(ctx, 10, 6, 4, 4, gemCol);
      px(ctx, 11, 7, '#ffffff');
      break;
    }

    case 'barrows_gloves': {
      // Armored gauntlets
      rect(ctx, 6, 8, 12, 10, '#475569');
      rect(ctx, 7, 9, 10, 8, '#64748b');
      rect(ctx, 8, 11, 8, 2, '#ca8a04'); // brass knuckle band
      break;
    }

    case 'boots_of_haste': {
      // Winged boots
      rect(ctx, 5, 8, 14, 9, '#0284c7');
      rect(ctx, 6, 9, 12, 7, '#38bdf8');
      // Wings
      px(ctx, 3, 6, '#ffffff');
      rect(ctx, 4, 7, 2, 3, '#ffffff');
      px(ctx, 20, 6, '#ffffff');
      rect(ctx, 18, 7, 2, 3, '#ffffff');
      break;
    }

    // --- 10. ACCESSORIES & RELICS ---
    case 'celestial_talisman': {
      // Astral jewel choker with cyan star gem and silver chain
      rect(ctx, 7, 4, 10, 2, '#94a3b8');
      px(ctx, 6, 6, '#cbd5e1');
      px(ctx, 17, 6, '#cbd5e1');
      px(ctx, 7, 8, '#cbd5e1');
      px(ctx, 16, 8, '#cbd5e1');
      px(ctx, 9, 10, '#cbd5e1');
      px(ctx, 14, 10, '#cbd5e1');
      // Pendant
      rect(ctx, 9, 11, 6, 6, '#0284c7');
      rect(ctx, 10, 12, 4, 4, '#38bdf8');
      px(ctx, 11, 13, '#ffffff');
      px(ctx, 12, 13, '#ffffff');
      break;
    }

    case 'vanguard_gauntlets': {
      // Vanguard heavy steel battle grips
      rect(ctx, 6, 8, 12, 10, '#334155');
      rect(ctx, 7, 9, 10, 8, '#64748b');
      rect(ctx, 8, 9, 8, 2, '#94a3b8');
      rect(ctx, 9, 13, 6, 2, '#cbd5e1');
      break;
    }

    case 'granite_boots': {
      // Dense slate/granite heavy sabatons
      rect(ctx, 5, 9, 14, 9, '#334155');
      rect(ctx, 6, 10, 12, 7, '#475569');
      rect(ctx, 8, 12, 8, 3, '#64748b');
      px(ctx, 7, 14, '#94a3b8');
      px(ctx, 16, 14, '#94a3b8');
      break;
    }

    case 'ring_of_void_leech': {
      // Dark void ring with pulsing violet leech stone
      rect(ctx, 7, 8, 10, 9, '#1e1b4b');
      rect(ctx, 9, 10, 6, 5, '#05070f');
      rect(ctx, 10, 6, 4, 4, '#7e22ce');
      rect(ctx, 11, 7, 2, 2, '#c084fc');
      px(ctx, 11, 7, '#ffffff');
      break;
    }

    case 'ring_of_stone': {
      // Dense onyx stone ring
      rect(ctx, 7, 8, 10, 9, '#334155');
      rect(ctx, 9, 10, 6, 5, '#05070f');
      rect(ctx, 10, 6, 4, 4, '#0f172a');
      rect(ctx, 11, 7, 2, 2, '#475569');
      px(ctx, 12, 7, '#94a3b8');
      break;
    }

    case 'chronocore_prism': {
      // Glowing crystalline floating prism with cyan time energy
      rect(ctx, 11, 3, 2, 2, '#38bdf8');
      rect(ctx, 9, 5, 6, 4, '#0284c7');
      rect(ctx, 7, 9, 10, 6, '#0369a1');
      rect(ctx, 8, 10, 8, 4, '#38bdf8');
      rect(ctx, 9, 15, 6, 4, '#0284c7');
      rect(ctx, 11, 19, 2, 2, '#38bdf8');
      px(ctx, 11, 11, '#ffffff');
      px(ctx, 12, 12, '#ffffff');
      break;
    }

    case 'radiant_shield_relic': {
      // Golden miniature sun aegis crest
      rect(ctx, 8, 5, 8, 13, '#ca8a04');
      rect(ctx, 6, 7, 12, 9, '#eab308');
      rect(ctx, 8, 8, 8, 7, '#fde047');
      rect(ctx, 10, 10, 4, 3, '#fef08a');
      px(ctx, 11, 11, '#ffffff');
      break;
    }

    case 'crown_of_noon': {
      // Mythic radiant noon crown relic
      rect(ctx, 6, 14, 12, 4, '#ca8a04');
      rect(ctx, 7, 15, 10, 2, '#fde047');
      // 3 Crown peaks
      rect(ctx, 6, 8, 2, 6, '#facc15');
      rect(ctx, 11, 6, 2, 8, '#fde047');
      rect(ctx, 16, 8, 2, 6, '#facc15');
      px(ctx, 11, 5, '#ffffff'); // peak diamond
      px(ctx, 12, 5, '#ffffff');
      px(ctx, 6, 7, '#fef08a');
      px(ctx, 17, 7, '#fef08a');
      break;
    }

    case 'skillcape_extraction':
    case 'skillcape_forging':
    case 'skillcape_binding':
    case 'skillcape_weaving':
    case 'skillcape_combat':
    case 'skillcape_rites':
    case 'skillcape_flashes': {
      const capeColors = {
        skillcape_extraction: '#38bdf8',
        skillcape_forging: '#f97316',
        skillcape_binding: '#a855f7',
        skillcape_weaving: '#22c55e',
        skillcape_combat: '#ef4444',
        skillcape_rites: '#f59e0b',
        skillcape_flashes: '#06b6d4',
      };
      const capeColor = capeColors[id] || '#facc15';
      rect(ctx, 8, 4, 8, 4, '#0f172a');
      rect(ctx, 9, 5, 6, 2, capeColor);
      rect(ctx, 6, 8, 12, 3, capeColor);
      rect(ctx, 5, 10, 14, 8, '#0f172a');
      rect(ctx, 6, 11, 12, 6, capeColor);
      rect(ctx, 9, 11, 6, 5, '#111827');
      px(ctx, 11, 6, '#ffffff');
      px(ctx, 12, 7, '#fef08a');
      px(ctx, 7, 12, '#f8fafc');
      px(ctx, 16, 12, '#f8fafc');
      break;
    }

    // --- CRAFTED & LATE-GAME WEAPONS, ARMOR & CLOAKS ---
    case 'star_iron_scimitar':
    case 'astral_mithril_greatsword':
    case 'starmetal_cosmos_blade':
    case 'starmetal_meteor_hammer':
    case 'abyssal_voidstar_scythe': {
      const bladeC = id === 'star_iron_scimitar' ? '#bae6fd'
        : id === 'astral_mithril_greatsword' ? '#38bdf8'
        : id === 'starmetal_meteor_hammer' ? '#fb923c'
        : id === 'abyssal_voidstar_scythe' ? '#c084fc' : '#f0abfc';
      rect(ctx, 5, 16, 4, 4, '#78350f');
      rect(ctx, 7, 13, 6, 3, '#facc15');
      for (let i = 0; i < 9; i++) {
        rect(ctx, 9 + i, 12 - i, 3, 3, bladeC);
        px(ctx, 10 + i, 12 - i, '#ffffff');
      }
      if (id === 'starmetal_meteor_hammer') {
        rect(ctx, 12, 4, 7, 6, '#ea580c');
        rect(ctx, 14, 5, 4, 4, '#fde047');
      } else if (id === 'abyssal_voidstar_scythe') {
        rect(ctx, 10, 4, 8, 3, '#a855f7');
        rect(ctx, 8, 5, 4, 2, '#5eead4');
      }
      break;
    }

    case 'umbral_steel_platebody':
    case 'starmetal_cosmos_plate':
    case 'mystic_leystrand_robes': {
      const cDark = id === 'mystic_leystrand_robes' ? '#0f172a' : '#1e1b4b';
      const cMid = id === 'umbral_steel_platebody' ? '#6366f1' : id === 'starmetal_cosmos_plate' ? '#e879f9' : '#2dd4bf';
      rect(ctx, 5, 5, 14, 14, cDark);
      rect(ctx, 7, 6, 10, 12, cMid);
      rect(ctx, 10, 8, 4, 6, '#38bdf8');
      px(ctx, 11, 9, '#ffffff');
      break;
    }

    case 'adamant_bulwark_shield': {
      rect(ctx, 5, 4, 14, 15, '#064e3b');
      rect(ctx, 6, 5, 12, 12, '#10b981');
      rect(ctx, 9, 7, 6, 8, '#facc15');
      rect(ctx, 11, 9, 2, 4, '#ffffff');
      break;
    }

    case 'duskveil_silk_mantle':
    case 'celestial_gossamer_cloak': {
      const cCol = id === 'duskveil_silk_mantle' ? '#7e22ce' : '#38bdf8';
      rect(ctx, 6, 5, 12, 14, '#1e1b4b');
      rect(ctx, 7, 6, 10, 12, cCol);
      rect(ctx, 8, 5, 8, 2, '#facc15');
      px(ctx, 11, 9, '#ffffff');
      break;
    }

    default:
      return false;
  }
  return true;
}
