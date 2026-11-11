// ==========================================
// GLIMMERFALL ONLINE: ACHIEVEMENTS & TCG LORE CODEX
// Day 20 & Day 21 Master Roadmap Specification
// ==========================================

export const ACHIEVEMENT_CATEGORIES = {
  skilling: { id: 'skilling', name: 'Arboreal & Skilling', icon: '🪵', color: '#22c55e' },
  exploration: { id: 'exploration', name: 'Continental Waygates', icon: '🧭', color: '#38bdf8' },
  combat: { id: 'combat', name: 'Vanquishing & Hunt', icon: '⚔️', color: '#f87171' },
  mastery: { id: 'mastery', name: 'Ascendance & Economy', icon: '👑', color: '#facc15' },
};

export const ACHIEVEMENTS_CATALOG = [
  // --- ARBOREAL TIMBERCRAFT & SKILLING ---
  {
    id: 'ach_crimson_feller',
    category: 'skilling',
    name: 'Crimson Arborist',
    icon: '🌸',
    desc: 'Fell 5 Crimson Blossom trees across Sanctuary or the Continental plazas.',
    statKey: 'trees_blossom_cut',
    targetCount: 5,
    rewardGold: 60,
    rewardXp: 80,
    unlockedTitle: 'Crimson Arborist',
  },
  {
    id: 'ach_timber_baron',
    category: 'skilling',
    name: 'Timber Baron',
    icon: '🪓',
    desc: 'Fell 20 trees of any species (Blossom, Pine, Oak, Glimmerwood, Ironbark) across the world.',
    statKey: 'trees_cut_total',
    targetCount: 20,
    rewardGold: 120,
    rewardXp: 150,
    unlockedTitle: 'Timber Baron',
  },
  {
    id: 'ach_ancient_oak_feller',
    category: 'skilling',
    name: 'Heart of the Ancient Oak',
    icon: '🌳',
    desc: 'Fell 5 Ancient Oaks across the Ironwood Timberlands or South Vale.',
    statKey: 'trees_oak_cut',
    targetCount: 5,
    rewardGold: 100,
    rewardXp: 140,
    unlockedTitle: 'Oakheart',
  },
  {
    id: 'ach_quarry_master',
    category: 'skilling',
    name: 'Deepdelver',
    icon: '⛏️',
    desc: 'Mine 15 Ore Veins (Copper, Tin, Iron, Coal, or Mithril).',
    statKey: 'veins_mined_total',
    targetCount: 15,
    rewardGold: 90,
    rewardXp: 110,
    unlockedTitle: 'Deepdelver',
  },
  {
    id: 'ach_master_angler',
    category: 'skilling',
    name: 'Continental Angler',
    icon: '🎣',
    desc: 'Catch 15 fresh fish from Shallows, Rivers, Reefs, or Abyss spots.',
    statKey: 'fish_caught_total',
    targetCount: 15,
    rewardGold: 100,
    rewardXp: 120,
    unlockedTitle: 'Master Angler',
  },
  {
    id: 'ach_hearth_tender',
    category: 'skilling',
    name: 'Hearth Tender',
    icon: '🔥',
    desc: 'Craft 3 Campfire Tinderbox Kits using gathered timber.',
    statKey: 'campfires_crafted',
    targetCount: 3,
    rewardGold: 50,
    rewardXp: 75,
    unlockedTitle: 'Hearth Tender',
  },

  // --- CONTINENTAL EXPLORATION & WAYGATES ---
  {
    id: 'ach_caldera_scout',
    category: 'exploration',
    name: 'Caldera Scout',
    icon: '🌋',
    desc: 'Cross into the open-world Nexus Warzone continent.',
    statKey: 'zone_nexus_warzone_visited',
    targetCount: 1,
    rewardGold: 50,
    rewardXp: 70,
    unlockedTitle: 'Caldera Scout',
  },
  {
    id: 'ach_starfall_pilgrim',
    category: 'exploration',
    name: 'Starlight Pilgrim',
    icon: '🌠',
    desc: 'Traverse the ancient crater ridge of Starfall Crater.',
    statKey: 'zone_starfall_crater_visited',
    targetCount: 1,
    rewardGold: 100,
    rewardXp: 150,
    unlockedTitle: 'Starlight Pilgrim',
  },
  {
    id: 'ach_continental_traveler',
    category: 'exploration',
    name: 'Realm Walker',
    icon: '🚪',
    desc: 'Travel through Waygates to 5 unique zones across GlimmerFall.',
    statKey: 'zones_discovered_count',
    targetCount: 5,
    rewardGold: 150,
    rewardXp: 200,
    unlockedTitle: 'Realm Walker',
  },

  // --- VANQUISHING & COMBAT HUNT ---
  {
    id: 'ach_first_blood',
    category: 'combat',
    name: 'Vanguard Initiate',
    icon: '🗡️',
    desc: 'Vanquish 10 hostile monsters anywhere in the wild.',
    statKey: 'monsters_slain_total',
    targetCount: 10,
    rewardGold: 60,
    rewardXp: 90,
    unlockedTitle: 'Vanguard Initiate',
  },
  {
    id: 'ach_apex_hunter',
    category: 'combat',
    name: 'Apex Champion Hunter',
    icon: '💠',
    desc: 'Defeat an Elite Champion monster bearing an ancient affix.',
    statKey: 'elites_slain_total',
    targetCount: 1,
    rewardGold: 120,
    rewardXp: 180,
    unlockedTitle: 'Apex Hunter',
  },
  {
    id: 'ach_titan_slayer',
    category: 'combat',
    name: 'Titan Slayer',
    icon: '👑',
    desc: 'Vanquish a Continental World Boss or Dungeon Titan.',
    statKey: 'bosses_slain_total',
    targetCount: 1,
    rewardGold: 250,
    rewardXp: 350,
    unlockedTitle: 'Titan Slayer',
  },
  {
    id: 'ach_arena_gladiator',
    category: 'combat',
    name: 'Arena Champion',
    icon: '🏆',
    desc: 'Win a 3v3 Ranked Arena or an Honorable Duel.',
    statKey: 'pvp_victories_total',
    targetCount: 1,
    rewardGold: 150,
    rewardXp: 200,
    unlockedTitle: 'Gladiator',
  },

  // --- MASTERY, ASCENDANCE & FACTION ---
  {
    id: 'ach_forest_warden',
    category: 'mastery',
    name: 'The Forest Warden',
    icon: '🌿',
    desc: 'Attain Level 10 or higher in Resonance Extraction or Glimmerweaving.',
    statKey: 'prof_extraction_level_10',
    targetCount: 1,
    rewardGold: 160,
    rewardXp: 220,
    unlockedTitle: 'The Forest Warden',
  },
  {
    id: 'ach_nexus_paragon',
    category: 'mastery',
    name: 'Nexus Paragon',
    icon: '✨',
    desc: 'Reach Combat Character Level 10.',
    statKey: 'character_level_10',
    targetCount: 1,
    rewardGold: 200,
    rewardXp: 300,
    unlockedTitle: 'Nexus Paragon',
  },
  {
    id: 'ach_merchant_prince',
    category: 'mastery',
    name: 'Merchant Prince',
    icon: '💰',
    desc: 'Conduct business at the Grand AetherSwap Exchange.',
    statKey: 'aetherswap_trades_total',
    targetCount: 1,
    rewardGold: 80,
    rewardXp: 100,
    unlockedTitle: 'Merchant Prince',
  },
];

export const LORE_CODEX_ENTRIES = [
  {
    id: 'lore_nexus',
    title: 'The Primeval Nexus & The Great Fall',
    era: 'First Age of Radiance',
    icon: '💎',
    preview: 'Before the world fractured into four discordant realms, a solitary crystalline pillar stood at the pole of existence.',
    body: `Before the world fractured into four discordant realms, a solitary crystalline pillar stood at the pole of existence: the Primeval Nexus. From its core flowed pure, unfiltered Glimmer—the fundamental harmonic energy binding stone, flora, and mortal breath.

When the cataclysm known as The Fall shattered the spire, shards plunged across the continent, creating the Caldera Warzone and opening rifts into the Abyssal Void. The survivors gathered in Sanctuary Hub, seeking to reclaim the lost harmony through the Seven Sacred Professions.`,
  },
  {
    id: 'lore_solari',
    title: 'The Solari Citadel: Solar Zenith',
    era: 'Order of the Sun',
    icon: '☀️',
    preview: 'Perched upon high marble terraces bathed in eternal dawn, the Solari Knights uphold luminous justice and discipline.',
    body: `Perched upon high marble terraces bathed in eternal dawn, the Solari Citadel is the seat of the Sunspire Order. Harnessing the brilliance of solar flares and tempered gold, Solari paladins channel radiant smites and sunshields.

Their sacred oath is absolute: no shadow shall encroach upon the Sanctuary so long as the Solar Core burns bright.`,
  },
  {
    id: 'lore_terra',
    title: 'The Terra Orchard: The Primal Hearth',
    era: 'The Ironwood Watch',
    icon: '🌲',
    preview: 'Deep within ancient moss-draped canopies, the Terra Orchard guards the ancient trees and primordial beasts.',
    body: `Deep within ancient moss-draped canopies, the Terra Orchard guards the ancient trees and primordial beasts. Rooted in primal earth magic, Terra Forest Wardens and Druids revere the Crimson Blossom trees and towering Ancient Oaks.

To a Terra guardian, every felled log must be honored with a rekindled hearth, ensuring the lifeblood of the forest flows unbroken through generations.`,
  },
  {
    id: 'lore_umbri',
    title: 'The Umbri Undercity: The Abyssal Void',
    era: 'Shadow-Silk Syndicate',
    icon: '🌑',
    preview: 'Carved into subterranean obsidian caverns beneath the world, the Umbri master shadows and void currents.',
    body: `Carved into subterranean obsidian caverns beneath the world, the Umbri Undercity thrives in perpetual twilight. Masters of stealth, void daggers, and abyssal silk, the Umbri view the Fall not as a tragedy, but as an awakening to the cosmic depths.

In darkness, they whisper, all truths are stripped of pretense.`,
  },
  {
    id: 'lore_aether',
    title: 'The Aether Spire: The Chrono Weft',
    era: 'Astromancers of Chronos',
    icon: '🔮',
    preview: 'Floating above the clouds on antigravity leylines, the Astromancers observe the tapestry of cosmic time.',
    body: `Floating above the clouds on antigravity leylines, the Astromancers of the Aether Spire observe the tapestry of cosmic time. Through star-forged mithril and celestial runestones, they bend space, open dimensional waygates, and glimpse threads of futures yet unspun.`,
  },
  {
    id: 'lore_trees',
    title: 'Arboreal Resonances: Sacred Timbers of GlimmerFall',
    era: 'Codex of Forestry',
    icon: '🪵',
    preview: 'The eight sacred tree species of GlimmerFall each resonate with a distinct harmonic frequency.',
    body: `Throughout GlimmerFall, the living trees act as natural conduits for the planet's Glimmer currents:

1. Crimson Blossom Tree (Lv. 1): Delicate rose-grained timber with crimson blooms found across peaceful plazas. Burns with fragrant pink embers.
2. Glimmerwood Tree (Lv. 1): Aromatic softwood found along Sanctuary streams and meadows.
3. Alpine Pine (Lv. 10): Resinous evergreen thriving upon high mountain passes and Caldera cliffs.
4. Ancient Ironbark (Lv. 15): Diamond-dense bark that deflects stone axes without chipping.
5. Ancient Oak (Lv. 25): Sprawling titan of primal parklands; yields dense oak timber and hardened sap.
6. Duskveil Shadow-Willow (Lv. 40): Subterranean weeping willow that drinks umbral essence.
7. Sunforged Golden Cedar (Lv. 60): Imbued with solar rays; burns without leaving ash.
8. Empyrean Starlight Sequoia (Lv. 85): Colossal astral trees whose rings mirror the motion of galaxies.`,
  },
];

export function getUnlockedTitles(prog) {
  const titles = new Set();
  const completed = prog?.achievements?.completed || {};
  for (const ach of ACHIEVEMENTS_CATALOG) {
    if (completed[ach.id] && ach.unlockedTitle) {
      titles.add(ach.unlockedTitle);
    }
  }
  return Array.from(titles);
}

export function sanitizePlayerTitle(title) {
  if (!title || typeof title !== 'string') return null;
  const clean = title.replace(/[<>]/g, '').trim();
  const valid = ACHIEVEMENTS_CATALOG.some((a) => a.unlockedTitle === clean);
  return valid ? clean : null;
}
