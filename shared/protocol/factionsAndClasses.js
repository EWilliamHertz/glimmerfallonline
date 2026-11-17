import { ACTION_SLOTS } from "./constants.js";
import { ROOM_TYPES } from "./rooms.js";
import { ABILITIES_CATALOG, getAbilityRank } from "./abilitiesCatalog.js";

export const FACTIONS_META = {
  Solari: {
    id: 'Solari',
    name: 'Solari (The Light)',
    title: 'Solari Vanguard',
    icon: '☀️',
    logo: '/solari_nobg.png',
    color: '#facc15',
    accent: '#2563eb',
    homeBiome: ROOM_TYPES.SOLARI_CITADEL,
    mechanicName: 'Solar Charge & Zenith',
    mechanicDesc: 'Reaching 100 Solar Charge triggers Zenith State (6s): +25% DMG, heals allies/Nexus, and crits apply Sunbrand.',
    motto: 'May the Sunspire illuminate the darkness.',
  },
  Umbri: {
    id: 'Umbri',
    name: 'Umbri (The Shadow)',
    title: 'Umbral Assassin',
    icon: '🌑',
    logo: '/umbri_nobg.png',
    color: '#c084fc',
    accent: '#581c87',
    homeBiome: ROOM_TYPES.UMBRI_UNDERCITY,
    mechanicName: 'Dusk Marks & Void Harvest',
    mechanicDesc: 'Flashes & stealth strikes build up to 5 Dusk Marks; Rites consume Marks for +15% DMG & +6% Leech per Mark.',
    motto: 'In shadows we weave, in silence we strike.',
  },
  Terra: {
    id: 'Terra',
    name: 'Terra (The Earth)',
    title: 'Forest Warden',
    icon: '🌿',
    logo: '/terra_nobg.png',
    color: '#4ade80',
    accent: '#15803d',
    homeBiome: ROOM_TYPES.TERRA_ORCHARD,
    mechanicName: 'Rootguard & Thornbark',
    mechanicDesc: 'Earth skills & hits taken stack Rootguard (max 5): +6% DR, +8% Overwhelm cleave & 35% Thornbark reflection.',
    motto: 'Stand unyielding as ancient stone.',
  },
  Aether: {
    id: 'Aether',
    name: 'Aether (The Magic)',
    title: 'Chronomancer Sage',
    icon: '🔮',
    logo: '/aether_nobg.png',
    color: '#38bdf8',
    accent: '#0369a1',
    homeBiome: ROOM_TYPES.AETHER_SPIRE,
    mechanicName: 'Astral Resonance & Echo',
    mechanicDesc: '-12% faster cooldowns; every 4 Astral Resonance stacks make your next Rite instant-cast with a 65% Arcane Echo!',
    motto: 'Time and space bend to the arcane truth.',
  },
};

// All 8 Playable Archetypes across the 4 Canonical Factions
export const CLASSES_CATALOG = {
  solari_vanguard: {
    id: 'solari_vanguard',
    name: 'Solari Vanguard',
    faction: 'Solari',
    role: 'Radiant Tank • Aegis & Verdict',
    passiveName: 'Aegis of the Citadel',
    passiveDesc: 'Shields generate +10 Solar Charge & 3.5x Threat on nearby enemies.',
    desc: 'Sun-forged frontline bulwark chaining foes with Sunfire Lance, rallying behind Bastion Banner, and executing with Judgement Verdict.',
    bonusStats: { power: 1, bastion: 2, resonance: 0, tempo: 0 },
    defaultEquipment: { weapon: 'solari_spellblade', armor: 'sunforged_plate', offhand: 'radiant_shield' },
    defaultLoadout: { 1: 'flare_strike' },
    legacyDefaultLoadout: {
      1: 'flare_strike', 2: 'solar_flare', 3: 'bastion_banner', 4: 'judgement_verdict',
      9: 'aegis_slam', 10: 'radiant_bulwark', 11: 'sunfire_lance', 12: 'blinding_radiance',
    },
  },
  aurora_marshal: {
    id: 'aurora_marshal',
    name: 'Aurora Marshal',
    faction: 'Solari',
    role: 'Celestial Healer • Starlight Sanctuary',
    passiveName: 'Beacon of Dawn',
    passiveDesc: '+25% Healing power; 50% of overheal converts into a Radiant Barrier.',
    desc: 'Herald of Dawn mending allies with bouncing Starlight Mend, purifying debuffs with Purifying Halo, and raising Solaris Apotheosis domes.',
    bonusStats: { power: 0, bastion: 1, resonance: 2, tempo: 0 },
    defaultEquipment: { weapon: 'dawn_scepter', armor: 'sunforged_plate', offhand: 'mirror_shield' },
    defaultLoadout: { 1: 'flare_strike' },
    legacyDefaultLoadout: {
      1: 'flare_strike', 2: 'starlight_mend', 3: 'aurora_beam', 4: 'solaris_apotheosis',
      9: 'purifying_halo', 10: 'daybreak', 11: 'decree_of_the_sun', 12: 'blinding_radiance',
    },
  },
  umbral_assassin: {
    id: 'umbral_assassin',
    name: 'Umbral Assassin',
    faction: 'Umbri',
    role: 'Stealth Executioner • Dusk Marks',
    passiveName: 'Twin-Fang Precision',
    passiveDesc: 'Melee Flashes strike twice and award +2 Dusk Marks (+25% Stealth Crit DMG).',
    desc: 'Duskveil stalker shredding foes with Serrated Mutilate, detonating Crimson Rupture bleeds, and blitzing through Phantom Sever clones.',
    bonusStats: { power: 2, bastion: 0, resonance: 0, tempo: 1 },
    defaultEquipment: { weapon: 'nightblade_twin_daggers', armor: 'duskveil_shroud', offhand: 'shadow_buckler' },
    defaultLoadout: { 1: 'whisper_of_the_void' },
    legacyDefaultLoadout: {
      1: 'whisper_of_the_void', 2: 'unmake', 3: 'soul_tithe', 4: 'nightfall_plague',
      9: 'serrated_mutilate', 10: 'crimson_rupture', 11: 'smoke_bomb', 12: 'phantom_sever',
    },
  },
  graveglass_oracle: {
    id: 'graveglass_oracle',
    name: 'Graveglass Oracle',
    faction: 'Umbri',
    role: 'Blood-Hex Caster • Sepulcher Drain',
    passiveName: 'Sepulcher Conduit',
    passiveDesc: 'Leech overheals forge a Blood Phylactery barrier; hexed foes take +20% Rite DMG.',
    desc: 'Sepulcher mystic crippling enemies with Hex of Frailty, hurling Graveglass Shardbursts, and channeling Harbinger\'s Requiem.',
    bonusStats: { power: 1, bastion: 0, resonance: 2, tempo: 0 },
    defaultEquipment: { weapon: 'scythe_soulreaper', armor: 'duskveil_shroud', offhand: 'graveglass_lantern' },
    defaultLoadout: { 1: 'whisper_of_the_void' },
    legacyDefaultLoadout: {
      1: 'whisper_of_the_void', 2: 'graveglass_shardburst', 3: 'soul_covenant', 4: 'harbingers_requiem',
      9: 'hex_of_frailty', 10: 'siphon_soul', 11: 'graveglass_ward', 12: 'shadow_step',
    },
  },
  forest_warden: {
    id: 'forest_warden',
    name: 'Forest Warden',
    faction: 'Terra',
    role: 'Primal Bruiser • Spear & Spores',
    passiveName: 'Predator\'s Stride',
    passiveDesc: '+10% Move Speed; Flashes apply Venom Spores and widen Overwhelm cleave.',
    desc: 'Agile guardian impaling foes with Gale Spear, saturating battlefields with Spore Volley, and unleashing Pack Hunt wolves.',
    bonusStats: { power: 1, bastion: 1, resonance: 0, tempo: 1 },
    defaultEquipment: { weapon: 'rootdeep_thorn_spear', armor: 'ironwood_armor', offhand: 'bramble_buckler' },
    defaultLoadout: { 1: 'tectonic_slam' },
    legacyDefaultLoadout: {
      1: 'tectonic_slam', 2: 'spore_volley', 3: 'briar_snare', 4: 'tempest_of_thorns',
      9: 'gale_spear', 10: 'pack_hunt', 11: 'wildshape_surge', 12: 'verdant_renewal',
    },
  },
  stonekin_elder: {
    id: 'stonekin_elder',
    name: 'Stonekin Elder',
    faction: 'Terra',
    role: 'Colossal Tank • Seismic Control',
    passiveName: 'Mountain\'s Weight',
    passiveDesc: 'Knockback immune; converts 20% Bastion into Thornbark reflection & 3.5x Threat.',
    desc: 'Unstoppable Rootdeep titan commanding Seismic Taunt, raising Monolith Bulwarks, and crushing packs with Tectonic Cataclysm.',
    bonusStats: { power: 1, bastion: 2, resonance: 0, tempo: 0 },
    defaultEquipment: { weapon: 'ironwood_maul', armor: 'ironwood_armor', offhand: 'granite_tower_shield' },
    defaultLoadout: { 1: 'tectonic_slam' },
    legacyDefaultLoadout: {
      1: 'tectonic_slam', 2: 'monolith_wall', 3: 'earthen_grasp', 4: 'tectonic_cataclysm',
      9: 'seismic_taunt', 10: 'barkskin_infusion', 11: 'rooted_bastion', 12: 'overwhelm_roar',
    },
  },
  chronomancer_sage: {
    id: 'chronomancer_sage',
    name: 'Chronomancer Sage',
    faction: 'Aether',
    role: 'Time-Bender • Anchor & Paradox',
    passiveName: 'Temporal Continuum',
    passiveDesc: 'Every 3rd Flash primes Chrono-Snap (0.0s next Rite cast) & shaves 0.6s off CDs.',
    desc: 'Mirrorgate scholar rewinding combat via Temporal Anchor, dilating foes in Sands of Lethargy, and firing Fractured Timelines.',
    bonusStats: { power: 0, bastion: 0, resonance: 1, tempo: 2 },
    defaultEquipment: { weapon: 'chronocore_staff', armor: 'starweave_robe', offhand: 'chrono_pocketwatch' },
    defaultLoadout: { 1: 'reality_fracture' },
    legacyDefaultLoadout: {
      1: 'reality_fracture', 2: 'sands_of_lethargy', 3: 'time_loop_paradox', 4: 'fractured_timeline',
      9: 'temporal_anchor', 10: 'echoing_paradox', 11: 'chrono_shift', 12: 'mirror_barrier',
    },
  },
  nexus_weaver: {
    id: 'nexus_weaver',
    name: 'Nexus Weaver',
    faction: 'Aether',
    role: 'Starfall Battlemage • Shatter Combo',
    passiveName: 'Prismatic Shatter',
    passiveDesc: 'Hitting frozen/chilled targets with Rites triggers Starburst (+45% AoE Crit DMG).',
    desc: 'Leyline battlemage freezing foes with Glacial Spike, chaining enemies with Arcane Tether, and shattering them under Meteor Constellations.',
    bonusStats: { power: 1, bastion: 0, resonance: 2, tempo: 0 },
    defaultEquipment: { weapon: 'starfall_focus_wand', armor: 'starweave_robe', offhand: 'mirror_shield' },
    defaultLoadout: { 1: 'reality_fracture' },
    legacyDefaultLoadout: {
      1: 'reality_fracture', 2: 'glacial_spike', 3: 'meteor_constellation', 4: 'astral_supernova',
      9: 'arcane_tether', 10: 'frost_nova', 11: 'astral_convergence', 12: 'mirror_barrier',
    },
  },
};

// Normalizes a stored loadout, preserving player abilities across all slots
// without duplication, and ensuring starter ability in slot 1 for empty bars.
// When `prog` is provided, strips any ability that has not been learned (rank < 1).
export function sanitizeLoadout(rawLoadout, classId, prog = null) {
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const raw = rawLoadout && typeof rawLoadout === 'object' ? rawLoadout : null;

  const out = {};
  const seen = new Set();
  if (raw) {
    for (const slot of ACTION_SLOTS) {
      const candidate = raw[slot] ?? raw[String(slot)];
      const spec = candidate ? ABILITIES_CATALOG[candidate] : null;
      if (spec && !seen.has(candidate)) {
        if (spec.classId && spec.classId !== cls.id) continue;
        if (prog && typeof prog === 'object') {
          if (spec.faction && spec.faction !== 'All' && spec.faction !== cls.faction) continue;
          if (getAbilityRank(prog, candidate) < 1) continue;
        }
        out[slot] = candidate;
        seen.add(candidate);
      }
    }
  }
  if (Object.keys(out).length === 0 && cls.defaultLoadout[1]) {
    out[1] = cls.defaultLoadout[1];
  }
  return out;
}

// ==========================================
// Canonical Faction & Archetype Resolution
// ==========================================
export function resolveFactionAndClass({ faction = null, classId = null, loadout = null, orderTag = null } = {}) {
  // Normalize faction name (handle case-insensitivity, whitespace, and typos like 'terro')
  const cleanFac = String(faction || '').trim().toLowerCase();
  let canonicalFac = null;
  if (cleanFac === 'solari' || cleanFac === 'sun') canonicalFac = 'Solari';
  else if (cleanFac === 'umbri' || cleanFac === 'shadow' || cleanFac === 'void') canonicalFac = 'Umbri';
  else if (cleanFac === 'terra' || cleanFac === 'terro' || cleanFac === 'earth' || cleanFac === 'root') canonicalFac = 'Terra';
  else if (cleanFac === 'aether' || cleanFac === 'magic' || cleanFac === 'arcane') canonicalFac = 'Aether';

  // 1. Authoritative classId if valid and matches faction (or if no faction explicitly specified)
  let cls = CLASSES_CATALOG[classId];
  if (cls && (!canonicalFac || cls.faction === canonicalFac)) {
    return { faction: cls.faction, classId: cls.id };
  }

  // 2. Authoritative faction: pick the primary archetype for this faction
  if (canonicalFac) {
    const byFac = Object.values(CLASSES_CATALOG).find((c) => c.faction === canonicalFac);
    if (byFac) return { faction: byFac.faction, classId: byFac.id };
  }

  // 3. If classId is valid (even without faction), use its faction
  if (cls) {
    return { faction: cls.faction, classId: cls.id };
  }

  // 4. Canonical Order Tag checks
  const tag = String(orderTag || '').toUpperCase();
  if (tag === 'VOID') return { faction: 'Umbri', classId: 'umbral_assassin' };
  if (tag === 'ROOT') return { faction: 'Terra', classId: 'forest_warden' };
  if (tag === 'AETH') return { faction: 'Aether', classId: 'chronomancer_sage' };
  if (tag === 'SUN') return { faction: 'Solari', classId: 'solari_vanguard' };

  // 5. Fallback for legacy v0 records without faction or class: inspect canonical ability on action bar
  let firstEquipped = null;
  if (loadout && typeof loadout === 'object') {
    for (const slot of ACTION_SLOTS) {
      const cand = loadout[slot] ?? loadout[String(slot)];
      if (cand && ABILITIES_CATALOG[cand]?.faction && ABILITIES_CATALOG[cand].faction !== 'All') {
        firstEquipped = cand;
        break;
      }
    }
  }
  if (firstEquipped) {
    const abFac = ABILITIES_CATALOG[firstEquipped].faction;
    const defClass = abFac === 'Umbri' ? 'umbral_assassin' : abFac === 'Terra' ? 'forest_warden' : abFac === 'Aether' ? 'chronomancer_sage' : 'solari_vanguard';
    return { faction: abFac, classId: defClass };
  }

  // 6. Absolute default
  return { faction: 'Solari', classId: 'solari_vanguard' };
}
