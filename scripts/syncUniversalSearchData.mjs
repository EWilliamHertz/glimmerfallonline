// ==========================================
// Generator Script: Compile Authoritative GlimmerFall Online Encyclopedia Data
// Outputs landing/src/data/universalSearchData.js (zero external imports, Vercel-safe)
// Run with: node scripts/syncUniversalSearchData.mjs
// ==========================================

import fs from 'node:fs';
import path from 'node:path';
import {
  ABILITIES_CATALOG,
  BARROWS_SETS,
  BOUNTY_CONTRACTS,
  CANONICAL_SETS,
  CLASSES_CATALOG,
  CRAFTING_RECIPES,
  CRAFTING_STATIONS,
  EQUIPMENT_CATALOG,
  FACTIONS_META,
  GLIMMER_CIPHERS_CATALOG,
  HARMONIC_EXTRACT_TABLE,
  NEXUS_FAMILIARS_CATALOG,
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  ROOM_CONFIGS,
  RUNEWORD_SYNERGIES,
  SKILLING_LAYOUTS,
  SKILLING_NODE_TYPES,
} from '../shared/protocol.js';
import { QUEST_CATALOG } from '../client/game/questCatalogData.js';
import { WORLD_ATLAS_REGIONS } from '../client/game/worldAtlasData.js';
import { MERCHANT_CATALOGS } from '../client/merchantUi.js';
import {
  AWAKENING_DIALOGUE,
  WARZONE_DIALOGUE,
  RUINS_DIALOGUE,
  SOLARI_VAULT_DIALOGUE,
  UMBRI_LABYRINTH_DIALOGUE,
  TERRA_GROVE_DIALOGUE,
  AETHER_ARCHIVE_DIALOGUE,
  SOLARI_CITADEL_DIALOGUE,
  UMBRI_UNDERCITY_DIALOGUE,
  TERRA_ORCHARD_DIALOGUE,
  AETHER_SPIRE_DIALOGUE,
  CELESTIAL_ASCENT_DIALOGUE,
} from '../client/game/dialoguesData.js';
import { SKILL_GUIDES } from '../landing/src/data/skillGuidesData.js';

function getRoomLabel(roomId) {
  const up = String(roomId || '').toUpperCase();
  if (WORLD_ATLAS_REGIONS[up]?.name) return WORLD_ATLAS_REGIONS[up].name;
  const cfg = ROOM_CONFIGS[roomId] || ROOM_CONFIGS[String(roomId || '').toLowerCase()];
  if (cfg?.title) return cfg.title;
  return String(roomId || 'Realm')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatsSummary(stats = {}) {
  const parts = [];
  if (stats.power) parts.push(`+${stats.power} Power`);
  if (stats.bastion) parts.push(`+${stats.bastion} Bastion`);
  if (stats.resonance) parts.push(`+${stats.resonance} Resonance`);
  if (stats.tempo) parts.push(`+${stats.tempo} Tempo`);
  return parts;
}

function buildWhatItDoes(item, setMap) {
  const effects = [];
  if (item.healHp) effects.push(`Restores +${item.healHp} HP`);
  if (item.restoreGlimmer) effects.push(`Restores +${item.restoreGlimmer} Glimmer`);
  if (item.wellFed) {
    const wf = item.wellFed;
    const wfStats = formatStatsSummary(wf.stats || wf).join(', ');
    effects.push(`Well-Fed Feast Buff${wfStats ? ` (${wfStats})` : ''}`);
  }
  if (item.weaponImbue) {
    const imb = item.weaponImbue;
    const imbStats = formatStatsSummary(imb.stats || imb).join(', ');
    effects.push(`Weapon Imbue${imbStats ? ` (${imbStats})` : ''}`);
  }
  if (item.temperTargetMax) {
    effects.push(`Tempers weapon/armor up to +${item.temperTargetMax} Masterwork`);
  }
  if (item.placeCampfire) effects.push('Deploys a portable crackling Campfire Hearth');
  if (item.keystone) {
    effects.push(`Opens Tier ${item.keystone.tier || 1} Mythic+ Dungeon Challenge`);
  }
  const statList = formatStatsSummary(item.stats);
  if (statList.length > 0) effects.push(`Equip Stats: ${statList.join(', ')}`);
  if (item.set && setMap[item.set]) {
    effects.push(`Set Piece: ${setMap[item.set].name}`);
  }
  return effects.length > 0 ? effects.join(' • ') : (item.desc || 'GlimmerFall relic & material.');
}

// Build reverse maps for gathering nodes -> zones
const nodeZonesMap = {};
for (const [roomKey, entries] of Object.entries(SKILLING_LAYOUTS || {})) {
  const zoneLabel = getRoomLabel(roomKey);
  const atlasKey = String(roomKey).toUpperCase();
  const seen = new Set();
  for (const row of entries || []) {
    const nodeTypeId = Array.isArray(row) ? row[0] : row?.nodeType;
    if (!nodeTypeId || seen.has(nodeTypeId)) continue;
    seen.add(nodeTypeId);
    if (!nodeZonesMap[nodeTypeId]) nodeZonesMap[nodeTypeId] = [];
    nodeZonesMap[nodeTypeId].push({ zoneId: atlasKey, zoneName: zoneLabel });
  }
}

// Map harvested itemId -> node + zone sources
const itemHarvestSources = {};
for (const [nodeId, nodeDef] of Object.entries(SKILLING_NODE_TYPES || {})) {
  const yields = nodeDef.yields || nodeDef.drops || [];
  const zones = nodeZonesMap[nodeId] || [];
  for (const drop of yields) {
    if (!itemHarvestSources[drop.id]) itemHarvestSources[drop.id] = [];
    itemHarvestSources[drop.id].push({
      nodeId,
      nodeName: nodeDef.name,
      reqLevel: nodeDef.reqLevel || 1,
      xp: nodeDef.xp || 20,
      chancePct: Math.round((drop.chance ?? 1) * 100),
      zones: zones.slice(0, 8),
    });
  }
}

// Map recipe crafts & ingredient usage
const itemCraftedBy = {};
const itemUsedIn = {};
for (const recipe of Object.values(CRAFTING_RECIPES || {})) {
  const station = CRAFTING_STATIONS[recipe.station] || { shortName: recipe.station, icon: '🛠️' };
  const prof = PROFESSIONS_CATALOG[recipe.profession] || { name: recipe.profession };
  const outItem = EQUIPMENT_CATALOG[recipe.outputId];
  const recipeInfo = {
    recipeId: recipe.id,
    outputId: recipe.outputId,
    outputName: recipe.name || outItem?.name || recipe.outputId,
    outputQty: recipe.outputQty || 1,
    professionId: recipe.profession,
    professionName: prof.name,
    stationId: recipe.station,
    stationName: station.shortName || station.name || recipe.station,
    stationIcon: station.icon || '🛠️',
    reqLevel: recipe.reqLevel || 1,
    xp: recipe.xp || 20,
    ingredients: (recipe.ingredients || []).map((ing) => ({
      id: ing.id,
      name: EQUIPMENT_CATALOG[ing.id]?.name || GLIMMER_CIPHERS_CATALOG[ing.id]?.name || ing.id,
      icon: EQUIPMENT_CATALOG[ing.id]?.icon || GLIMMER_CIPHERS_CATALOG[ing.id]?.icon || '📦',
      qty: ing.qty || 1,
    })),
  };

  if (!itemCraftedBy[recipe.outputId]) itemCraftedBy[recipe.outputId] = [];
  itemCraftedBy[recipe.outputId].push(recipeInfo);

  for (const ing of recipe.ingredients || []) {
    if (!itemUsedIn[ing.id]) itemUsedIn[ing.id] = [];
    itemUsedIn[ing.id].push({
      outputId: recipe.outputId,
      outputName: recipeInfo.outputName,
      outputIcon: outItem?.icon || '🛠️',
      professionId: recipe.profession,
      professionName: prof.name,
      stationName: recipeInfo.stationName,
      reqLevel: recipe.reqLevel || 1,
      xp: recipe.xp || 20,
      qtyNeeded: ing.qty || 1,
    });
  }
}

// Also link NEXUS_FAMILIARS_CATALOG ingredient usage & extraction yields
for (const fam of Object.values(NEXUS_FAMILIARS_CATALOG || {})) {
  for (const ing of fam.ingredients || []) {
    if (!itemUsedIn[ing.id]) itemUsedIn[ing.id] = [];
    itemUsedIn[ing.id].push({
      outputId: fam.id,
      outputName: `${fam.name} (Familiar)`,
      outputIcon: '🐾',
      professionId: 'rite_binding',
      professionName: 'Rite-Binding (Construct Cradle)',
      stationName: 'Construct Cradle',
      reqLevel: fam.reqLevel || 1,
      xp: fam.xp || 90,
      qtyNeeded: ing.qty || 1,
    });
  }
}

// Merchant reverse index
const itemSoldBy = {};
const MERCHANT_ZONE_MAP = {
  merchant_apothecary: 'Glimmer Orchard & Sanctuary Market',
  merchant_provisions: 'Sanctuary Market',
  merchant_smith: 'Golden Citadel & Sanctuary Market',
  merchant_relics: 'Mirrorgate Spire & Sanctuary Market',
  merchant_tailor: 'Umbri Sepulcher Undercity',
  merchant_tavern: 'Hearthstone Inn & Brinelight Tavern',
};
for (const m of Object.values(MERCHANT_CATALOGS || {})) {
  for (const w of m.wares || []) {
    if (!itemSoldBy[w.itemId]) itemSoldBy[w.itemId] = [];
    itemSoldBy[w.itemId].push({
      merchantId: m.id,
      merchantName: m.name,
      location: MERCHANT_ZONE_MAP[m.id] || 'Sanctuary Haven',
      price: w.price,
      note: w.note,
    });
  }
}

// Bounty rewards reverse index
const itemBountyRewards = {};
for (const b of Object.values(BOUNTY_CONTRACTS || {})) {
  for (const rew of b.rewardItems || []) {
    if (!itemBountyRewards[rew.id]) itemBountyRewards[rew.id] = [];
    itemBountyRewards[rew.id].push({
      bountyId: b.id,
      title: b.title,
      qty: rew.qty || 1,
      category: b.category,
    });
  }
}

// Combat / Boss drops attribution based on lootAndSalvage.js & lootAndMythic.js
const STATIC_DROPS_MAP = {
  glimmer_shard: ['Monsters, Elites & Bosses across Solari / Caldera (+Bounty Contracts)'],
  chrono_gem: ['Monsters, Elites & Bosses across Aether Spire / Starfall Crater / Chronocore Citadel'],
  verdant_amber: ['Monsters & Bosses across Terra Orchard / Ironwood / Starlight Grove / Oasis'],
  void_essence: ['Monsters & Bosses across Umbri Undercity / Shadow Labyrinth / Abyssal Rift'],
  ancient_relic_fragment: ['100% World & Dungeon Bosses • 28% Elites • 6% Lv. 18+ Monsters'],
  starmetal_meteor_hammer: ['Boss Drop: Ignis-Core the Starfall Colossus (Starfall Crater)'],
  abyssal_voidstar_scythe: ["Boss Drop: Xal'Korath the Void Architect (Abyssal Rift)"],
  echo_print_ember_fox: ['Monsters & Bosses (Solari / Warzone) • Sold by Relic-Seeker Moira'],
  echo_print_ankyloling: ['Monsters & Bosses (Terra / Ironwood / Oasis / Coral Coast) • Sold by Relic-Seeker Moira'],
  echo_print_wisp_imp: ['Monsters & Bosses (Umbri / Labyrinth / Abyssal Rift) • Sold by Relic-Seeker Moira'],
  echo_print_prism_sprite: ['Monsters & Bosses (Aether Spire / Starfall / Chronocore) • Sold by Relic-Seeker Moira'],
  echo_print_starfall_owl: ['Lv. 25+ Elites & Bosses across Starfall Crater & Chronocore Citadel'],
  echo_print_pyre_drake: ['Lv. 30+ World & Dungeon Bosses'],
  gem_solar_ruby: ['20% Elites & Lv. 20+ Monsters • Craftable at Relic-Forging Lv. 22'],
  gem_void_sapphire: ['20% Elites & Lv. 20+ Monsters • Craftable at Rite-Binding Lv. 25'],
  gem_terra_emerald: ['20% Elites & Lv. 20+ Monsters • Craftable at Relic-Forging Lv. 46'],
  gem_aether_diamond: ['20% Elites & Lv. 20+ Monsters • Craftable at Rite-Binding Lv. 48'],
  rune_sol: ['35% Bosses (Lv. 28+) & 6% Elites (Lv. 30+) • Inscribe at Rite-Binding Lv. 28'],
  rune_ter: ['35% Bosses (Lv. 28+) & 6% Elites (Lv. 30+) • Inscribe at Rite-Binding Lv. 30'],
  rune_umb: ['35% Bosses (Lv. 28+) & 6% Elites (Lv. 30+) • Inscribe at Rite-Binding Lv. 36'],
  rune_aet: ['35% Bosses (Lv. 28+) & 6% Elites (Lv. 30+) • Inscribe at Rite-Binding Lv. 40'],
  rune_zod: ['Mythic+ High-Tier Caches & Endgame Bosses • Inscribe at Rite-Binding Lv. 65'],
  solar_gold: ['All Monsters, Elites, Bosses, Bounties & Quests'],
};

const allSetMap = { ...CANONICAL_SETS, ...BARROWS_SETS };

// Helper: zone material drop pools mirrored from server/rooms/lootAndMythic.js
const ZONE_MOB_MAT_DROPS = [
  { ids: ['sun_copper_ore', 'star_tin_mineral', 'sunbloom_herb', 'starlight_flax', 'astral_mineral_dust'], source: 'Common Zone Monster Loot (Sanctuary Outskirts & Warzone)' },
  { ids: ['iron_ore', 'umbral_coal', 'gloomcap_spore', 'shadow_silk'], source: 'Faction Biome Monsters & Elites (Solari / Umbri / Terra)' },
  { ids: ['mithril_astral_ore', 'adamant_terra_ore', 'chrono_lotus'], source: 'Dungeon & Crater Mobs (Aether Spire, Ruins, Starfall Crater)' },
  { ids: ['celestial_runite_ore', 'empyrean_starleaf', 'celestial_gossamer'], source: 'Endgame Monsters & Bosses (Abyssal Rift & Celestial Ascent)' },
];

// Build Cape skill mapping
const capeToSkillId = {};
for (const [skId, capeId] of Object.entries(PROFESSION_MASTERY_CAPES || {})) {
  capeToSkillId[capeId] = skId;
}

// 1. ITEMS CATALOG
const SEARCH_ITEMS = [];
const allCatalogItems = { ...EQUIPMENT_CATALOG };
// Ensure Ciphers exist as searchable items too
for (const c of Object.values(GLIMMER_CIPHERS_CATALOG || {})) {
  if (!allCatalogItems[c.id]) {
    allCatalogItems[c.id] = {
      id: c.id,
      name: c.name,
      icon: c.icon,
      slot: 'material',
      rarity: 'Harmonic Cipher',
      faction: c.faction,
      desc: `Harmonic Essence extracted from raw fish, ores, herbs, or timber at the Harmonic Extractor. Required to compile ${c.faction}-attuned Nexus Familiars at the Construct Cradle.`,
    };
  }
}

for (const item of Object.values(allCatalogItems)) {
  if (!item || !item.id) continue;
  const drops = [...(STATIC_DROPS_MAP[item.id] || [])];
  for (const pool of ZONE_MOB_MAT_DROPS) {
    if (pool.ids.includes(item.id)) drops.push(pool.source);
  }
  if (capeToSkillId[item.id]) {
    const sk = PROFESSIONS_CATALOG[capeToSkillId[item.id]];
    drops.push(`Achievement Reward: Reach Lv. 99 in ${sk?.name || capeToSkillId[item.id]} (9,477,643 XP)`);
  }
  if (item.set && allSetMap[item.set]) {
    drops.push(`Boss Set Drop: ${allSetMap[item.set].name} (${allSetMap[item.set].faction || 'Continental'} Bosses & Dungeon Vaults)`);
  }

  const ext = HARMONIC_EXTRACT_TABLE[item.id];
  const cipherObj = ext ? GLIMMER_CIPHERS_CATALOG[ext.cipherId] : null;

  // Also check if item is a cipher produced by extracting raw materials
  const decodedFrom = [];
  if (GLIMMER_CIPHERS_CATALOG[item.id]) {
    for (const [rawId, info] of Object.entries(HARMONIC_EXTRACT_TABLE)) {
      if (info.cipherId === item.id) {
        decodedFrom.push({
          rawId,
          rawName: EQUIPMENT_CATALOG[rawId]?.name || rawId,
          qty: info.qty,
          xp: info.xp,
        });
      }
    }
  }

  SEARCH_ITEMS.push({
    type: 'item',
    id: item.id,
    name: item.name,
    icon: item.icon || '📦',
    slot: item.slot || 'item',
    rarity: item.rarity || 'Common',
    faction: item.faction || null,
    desc: item.desc || '',
    whatItDoes: buildWhatItDoes(item, allSetMap),
    guidePrice: item.guidePrice || null,
    craftedBy: itemCraftedBy[item.id] || [],
    usedInRecipes: itemUsedIn[item.id] || [],
    harvestSources: itemHarvestSources[item.id] || [],
    soldBy: itemSoldBy[item.id] || [],
    droppedBy: drops,
    bountyRewards: itemBountyRewards[item.id] || [],
    extractsTo: ext
      ? {
          cipherId: ext.cipherId,
          cipherName: cipherObj?.name || ext.cipherId,
          qty: ext.qty,
          xp: ext.xp,
          note: ext.note,
        }
      : null,
    decodedFrom: decodedFrom.slice(0, 12),
    runewordCombos: Object.values(RUNEWORD_SYNERGIES || {})
      .filter((rw) => (rw.runes || []).includes(item.id))
      .map((rw) => ({ id: rw.id, name: rw.name, bonus: rw.bonusLabel || rw.desc || '' })),
  });
}

// 2. QUESTS & BOUNTIES
const NPC_DISPLAY_NAMES = {
  merchant_relics: 'Relic-Seeker Moira',
  merchant_smith: 'Blacksmith Torvin',
  merchant_apothecary: 'Alchemist Faye',
  merchant_provisions: 'Farmer Bran',
  merchant_tailor: 'Shadow Stitcher Silvan',
  npc_aurora: 'Herald Lyra',
  npc_archon: 'Commander Valerius',
  npc_atlas: 'Atlas the Cartographer',
  npc_aurelia: 'Grand Arbiter Aurelia',
  npc_lucian: 'Pyremaster Lucian',
  npc_vespera: 'Wraithmother Vespera',
  npc_sylvanus: 'Elder Druid Sylvanus',
  npc_zephyr: 'Chronos Sage Zephyr',
  npc_vael: 'Captain Vaelen',
  npc_nyx: 'Shadow Broker Nyx',
  npc_rowan: 'Grove Tender Rowan',
  npc_kaelen: 'Astromancer Kaelen',
  npc_orion: 'Forge-Keeper Orion',
  npc_nihilus: 'Rift-Watcher Nihilus',
  npc_artisan_aldric: 'Artisan Master Aldric',
  npc_silas: 'Forester Silas',
  npc_finn: 'Angler Finn',
  npc_innkeeper_garrick: 'Innkeeper Garrick',
  npc_bard_melody: 'Minstrel Lyra-Song',
  npc_archivist_elara: 'Archivist Elara',
  npc_smith_solon: 'Master Smith Solon',
  npc_herbalist_willow: 'Herbalist Willow',
  npc_mistress_vexis: 'Mistress Vexis',
  npc_magister_orionis: 'Magister Orionis',
  npc_captain_brine: 'Captain Brine',
};

const SEARCH_QUESTS = [];
for (const q of Object.values(QUEST_CATALOG || {})) {
  const dialogues = [];
  for (const line of [...(q.acceptDialogue || []), ...(q.completeDialogue || [])]) {
    if (line?.text) dialogues.push({ speaker: line.speaker || 'Quest', text: line.text });
  }
  const profXpFormatted = q.rewards?.professionXp
    ? Object.entries(q.rewards.professionXp).map(([pid, amt]) => ({
        professionId: pid,
        professionName: PROFESSIONS_CATALOG[pid]?.name || pid,
        xp: amt,
      }))
    : [];
  SEARCH_QUESTS.push({
    type: 'quest',
    kind: 'Story Quest',
    id: q.id,
    name: q.title,
    icon: '📜',
    giverId: q.giverId,
    giverName: NPC_DISPLAY_NAMES[q.giverId] || q.giverId,
    turnInId: q.turnInId,
    turnInName: NPC_DISPLAY_NAMES[q.turnInId] || q.turnInId,
    prereqTitle: q.prereqQuestId ? (QUEST_CATALOG[q.prereqQuestId]?.title || q.prereqQuestId) : null,
    desc: q.description || '',
    tasks: (q.tasks || []).map((t) => t.text),
    rewards: {
      xp: q.rewards?.xp || 0,
      glimmer: q.rewards?.glimmer || 0,
      gold: q.rewards?.gold || 0,
      professionXp: profXpFormatted,
      unlocks: q.unlocks || [],
      items: [],
    },
    dialogues,
  });
}

for (const b of Object.values(BOUNTY_CONTRACTS || {})) {
  SEARCH_QUESTS.push({
    type: 'quest',
    kind: `Bounty (${b.category})`,
    id: b.id,
    name: b.title,
    icon: b.icon || '📌',
    giverId:
      b.id === 'bounty_timber_harvest'
        ? 'npc_silas'
        : b.id === 'bounty_coastal_catch'
          ? 'npc_finn'
          : 'npc_archon',
    giverName:
      b.id === 'bounty_timber_harvest'
        ? 'Forester Silas'
        : b.id === 'bounty_coastal_catch'
          ? 'Angler Finn'
          : 'Vanguard Bounty Board / Commander Valerius',
    turnInId: null,
    turnInName: 'Any Bounty Board',
    prereqTitle: null,
    desc: b.desc,
    tasks: [`Objective Count: ${b.targetCount || 1} (${b.desc})`],
    rewards: {
      xp: b.rewardXp || 0,
      glimmer: 0,
      gold: b.rewardGold || 0,
      professionXp: b.rewardProf
        ? [{
            professionId: b.rewardProf.id,
            professionName: PROFESSIONS_CATALOG[b.rewardProf.id]?.name || b.rewardProf.id,
            xp: b.rewardProf.xp,
          }]
        : [],
      unlocks: [],
      items: (b.rewardItems || []).map((it) => ({
        id: it.id,
        name: EQUIPMENT_CATALOG[it.id]?.name || it.id,
        icon: EQUIPMENT_CATALOG[it.id]?.icon || '📦',
        qty: it.qty || 1,
      })),
    },
    dialogues: [],
  });
}

// 3. NPCS CATALOG (Verbatim Dialogue, Quests/Rewards Held, Shop Wares, Location & Teaches)
const NPC_DEFINITIONS = [
  {
    id: 'npc_aurora',
    name: 'Herald Lyra',
    role: 'Sunspire Herald & Rites Mentor',
    icon: '☀️',
    faction: 'Solari',
    zoneId: 'SANCTUARY_HUB',
    location: 'Sanctuary Haven (Spawn Courtyard)',
    color: '#facc15',
    teachesProfessionId: 'rites',
    dialogues: AWAKENING_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_archon',
    name: 'Commander Valerius',
    role: 'Sunspire Warlord & Combat Mentor',
    icon: '⚔️',
    faction: 'Solari',
    zoneId: 'SANCTUARY_HUB',
    location: 'Sanctuary Haven (North Vanguard Post) & Continental Caldera',
    color: '#ef4444',
    teachesProfessionId: 'combat_mastery',
    dialogues: WARZONE_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_artisan_aldric',
    name: 'Artisan Master Aldric',
    role: 'Sanctuary Guild Forgemaster',
    icon: '🔨',
    faction: 'Neutral',
    zoneId: 'SANCTUARY_HUB',
    location: 'Sanctuary Haven (West Artisan Workshop)',
    color: '#fb923c',
    teachesProfessionId: 'relic_forging',
    dialogues: [
      'Hail, adventurer! Right here in the Sanctuary Workshop you can train all three crafting professions: smelt ores at the Cosmic Star-Anvil, brew elixirs at the Aetherial Crucible, or spin cloaks at the Celestial Loom.',
      'When you travel the four cardinal roads to the peaceful faction capitals, seek out our regional guild merchants—Blacksmith Torvin in the Golden Citadel, Alchemist Faye in Glimmer Orchard, Shadow Stitcher Silvan in the Undercity, and Relic-Seeker Moira at Mirrorgate Spire!',
    ],
  },
  {
    id: 'merchant_apothecary',
    name: 'Alchemist Faye',
    role: 'Apothecary & Rite-Binding Mentor',
    icon: '⚗️',
    faction: 'Terra',
    zoneId: 'TERRA_ORCHARD',
    alsoZoneIds: ['SANCTUARY_HUB'],
    location: 'Glimmer Orchard (West Apothecary) & Sanctuary West',
    color: '#a855f7',
    teachesProfessionId: 'rite_binding',
    merchantId: 'merchant_apothecary',
    dialogues: [],
  },
  {
    id: 'merchant_smith',
    name: 'Blacksmith Torvin',
    role: 'Sunforged Armorer & Relic-Forging Mentor',
    icon: '⚒️',
    faction: 'Solari',
    zoneId: 'SOLARI_CITADEL',
    alsoZoneIds: ['SANCTUARY_HUB'],
    location: 'Solari Golden Citadel & Sanctuary West Workshop',
    color: '#f97316',
    teachesProfessionId: 'relic_forging',
    merchantId: 'merchant_smith',
    dialogues: [],
  },
  {
    id: 'merchant_provisions',
    name: 'Farmer Bran',
    role: 'Provisions Merchant & Glimmerweaving Mentor',
    icon: '🧵',
    faction: 'Neutral',
    zoneId: 'SANCTUARY_HUB',
    location: 'Sanctuary Market Square & West Workshop',
    color: '#22c55e',
    teachesProfessionId: 'glimmerweaving',
    merchantId: 'merchant_provisions',
    dialogues: [],
  },
  {
    id: 'merchant_relics',
    name: 'Relic-Seeker Moira',
    role: 'Aether Curios Merchant & Extraction Mentor',
    icon: '💎',
    faction: 'Aether',
    zoneId: 'AETHER_SPIRE',
    alsoZoneIds: ['SANCTUARY_HUB'],
    location: 'Mirrorgate Spire & Sanctuary South Docks',
    color: '#38bdf8',
    teachesProfessionId: 'resonance_extraction',
    merchantId: 'merchant_relics',
    dialogues: [],
  },
  {
    id: 'merchant_tailor',
    name: 'Shadow Stitcher Silvan',
    role: 'Glimmerweaving & Duskveil Silk Merchant',
    icon: '🕸️',
    faction: 'Umbri',
    zoneId: 'UMBRI_UNDERCITY',
    location: 'Umbri Sepulcher Undercity Market',
    color: '#a855f7',
    teachesProfessionId: 'glimmerweaving',
    merchantId: 'merchant_tailor',
    dialogues: [],
  },
  {
    id: 'npc_innkeeper_garrick',
    name: 'Innkeeper Garrick',
    role: 'Hearthstone Innkeeper & Brewmaster',
    icon: '🍺',
    faction: 'Neutral',
    zoneId: 'SANCTUARY_HUB',
    location: 'The Hearthstone Inn & Tavern (Sanctuary Haven)',
    color: '#fbbf24',
    merchantId: 'merchant_tavern',
    dialogues: [
      'Welcome inside out of the wind! Pull up a chair by the roaring hearth, grab a tankard of golden cider, or cook your fresh catch on our inn griddle. Adventurers always recover their strength fastest indoors!',
    ],
  },
  {
    id: 'npc_bard_melody',
    name: 'Minstrel Lyra-Song',
    role: 'Tavern Bard & Chronicler',
    icon: '🎵',
    faction: 'Neutral',
    zoneId: 'SANCTUARY_HUB',
    location: 'The Hearthstone Inn & Tavern',
    color: '#f472b6',
    dialogues: [
      'Every champion needs a warm refuge when twilight or autumn rain sweeps across Sanctuary Haven. Travel west to the Solari Smithy or south to the Rootdeep Apothecary House to visit our guildmasters indoors!',
      'Watch the waystone lanterns as evening deepens: each flame marks the safe border roads between the four Covenants—while dusk raiders stir beyond the glow.',
    ],
  },
  {
    id: 'npc_archivist_elara',
    name: 'Archivist Elara',
    role: 'Sanctuary Scholar & Summoner Chronicler',
    icon: '📖',
    faction: 'Aether',
    zoneId: 'SANCTUARY_HUB',
    location: "Archivist Elara's Scholar Cottage (Sanctuary Haven)",
    color: '#38bdf8',
    dialogues: [
      'Ah, a quiet refuge to study the First Nexus chronicles! Outside, Sanctuary teems with recruits, while inside these walls you can rest, inspect continental charts, and prepare your loadouts safely.',
      'Have you wondered why the ancients called us Summoner-Knights? When the Nexus shattered, beast-spirits did not vanish—their memory settled inside wild herbs, star-copper veins, and Silver Koi scales, awaiting a Harmonic Extractor to sing them whole again.',
    ],
  },
  {
    id: 'npc_smith_solon',
    name: 'Master Smith Solon',
    role: 'Sunforged Guildmaster',
    icon: '🔥',
    faction: 'Solari',
    zoneId: 'SOLARI_CITADEL',
    location: 'Solari Sunforged Guild Hall & Smithy',
    color: '#fb923c',
    teachesProfessionId: 'relic_forging',
    merchantId: 'merchant_smith',
    dialogues: [
      'Feel that heat from the Sunforged hearth! My apprentice Torvin watches the courtyard stall outside while I temper high-grade alloys right here inside the hall.',
    ],
  },
  {
    id: 'npc_herbalist_willow',
    name: 'Herbalist Willow',
    role: 'Rootdeep Apothecary Hostess',
    icon: '🌿',
    faction: 'Terra',
    zoneId: 'TERRA_ORCHARD',
    location: 'Rootdeep Botanical Apothecary House',
    color: '#4ade80',
    teachesProfessionId: 'rite_binding',
    merchantId: 'merchant_apothecary',
    dialogues: [
      'Step softly — dried sunblooms and moon-moss bundles scent every rafters beam! Brew salves at my crucible, weave flax at the loom, or rest beside the herbal drying hearth.',
      'Grass, Tidewater, Rich Soil, and Living Stone—those four elements uphold every Terra guardian. Pure strength, restorative waters, clear vision, and an unwavering instinct to shelter the realm.',
    ],
  },
  {
    id: 'npc_mistress_vexis',
    name: 'Mistress Vexis',
    role: 'Velvet Veil Proprietor',
    icon: '🕷️',
    faction: 'Umbri',
    zoneId: 'UMBRI_UNDERCITY',
    location: 'The Velvet Veil Undercity Parlor',
    color: '#c084fc',
    teachesProfessionId: 'glimmerweaving',
    merchantId: 'merchant_tailor',
    dialogues: [
      'Hush... leave the graveyard fog at the threshold. Inside the Velvet Veil, brokers trade rare twilight silks and tired blades regain their edge.',
    ],
  },
  {
    id: 'npc_magister_orionis',
    name: 'Magister Orionis',
    role: 'Observatory Savant',
    icon: '🔭',
    faction: 'Aether',
    zoneId: 'AETHER_SPIRE',
    location: 'Mirrorgate Astral Observatory Tower',
    color: '#38bdf8',
    merchantId: 'merchant_relics',
    dialogues: [
      'Notice how the starlight charts reflect the Leylines directly overhead! Take a moment inside our observatory to commune with the astrolabe, fuse arcane potions, or inspect recovered relics.',
    ],
  },
  {
    id: 'npc_captain_brine',
    name: 'Captain Brine',
    role: 'Mariner Innkeeper & Tidewatcher',
    icon: '⚓',
    faction: 'Neutral',
    zoneId: 'CORAL_COAST',
    location: 'Brinelight Mariner Tavern & Galley (Coral Coast)',
    color: '#38bdf8',
    merchantId: 'merchant_tavern',
    dialogues: [
      'Ahoy! Wipe the Coral Coast sea spray off your boots and warm up by our driftwood fireplace. Pan-sear your fresh catch right here at the galley skillet!',
      'When squalls blow off Brinelight Shallows at dusk, keep one eye on the bamboo pier lanterns—and if you delve into the pitch-black Vaults or Labyrinths inland, watch for glowing ore veins and the silver cone of surface light marking your exit!',
    ],
  },
  {
    id: 'npc_atlas',
    name: 'Atlas the Cartographer',
    role: 'First Nexus Keystone Seeker',
    icon: '🧭',
    faction: 'Aether',
    zoneId: 'NEXUS_FORGOTTEN_RUINS',
    location: 'Forgotten First Nexus Ruins',
    color: '#38bdf8',
    dialogues: RUINS_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_aurelia',
    name: 'Grand Arbiter Aurelia',
    role: 'Empyrean Titan Keeper',
    icon: '👑',
    faction: 'Solari',
    zoneId: 'CELESTIAL_ASCENT',
    location: 'Celestial Ascent & Empyrean Titan Summit',
    color: '#fde047',
    dialogues: CELESTIAL_ASCENT_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_lucian',
    name: 'Pyremaster Lucian',
    role: 'Sunken Vault Flamekeeper',
    icon: '🔥',
    faction: 'Solari',
    zoneId: 'SOLARI_CITADEL',
    location: 'Sunken Vault of the Dawn',
    color: '#fb923c',
    dialogues: SOLARI_VAULT_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_vespera',
    name: 'Wraithmother Vespera',
    role: 'Weaver of Graveglass',
    icon: '🌑',
    faction: 'Umbri',
    zoneId: 'UMBRI_UNDERCITY',
    location: 'Duskveil Shadow Labyrinth',
    color: '#c084fc',
    dialogues: UMBRI_LABYRINTH_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_sylvanus',
    name: 'Elder Druid Sylvanus',
    role: 'Voice of Ironbark',
    icon: '🌳',
    faction: 'Terra',
    zoneId: 'TERRA_ORCHARD',
    location: 'Rootdeep Primordial Hollow',
    color: '#4ade80',
    dialogues: TERRA_GROVE_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_zephyr',
    name: 'Chronos Sage Zephyr',
    role: 'Chronocore Archon',
    icon: '⏳',
    faction: 'Aether',
    zoneId: 'AETHER_SPIRE',
    location: 'Fractured Chrono-Archive',
    color: '#38bdf8',
    dialogues: AETHER_ARCHIVE_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_vael',
    name: 'Captain Vaelen',
    role: 'Lantern District Templar',
    icon: '🛡️',
    faction: 'Solari',
    zoneId: 'SOLARI_CITADEL',
    location: 'Solari Golden Citadel (South Square)',
    color: '#facc15',
    dialogues: SOLARI_CITADEL_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_nyx',
    name: 'Shadow Broker Nyx',
    role: 'Duskveil Smuggler',
    icon: '🗝️',
    faction: 'Umbri',
    zoneId: 'UMBRI_UNDERCITY',
    location: 'Umbri Sepulcher Undercity',
    color: '#a855f7',
    dialogues: UMBRI_UNDERCITY_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_rowan',
    name: 'Grove Tender Rowan',
    role: 'Rootdeep Herbalist',
    icon: '🌱',
    faction: 'Terra',
    zoneId: 'TERRA_ORCHARD',
    location: 'Glimmer Orchard',
    color: '#22c55e',
    dialogues: TERRA_ORCHARD_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_kaelen',
    name: 'Astromancer Kaelen',
    role: 'Mirrorgate Stargazer',
    icon: '✨',
    faction: 'Aether',
    zoneId: 'AETHER_SPIRE',
    location: 'Mirrorgate Spire',
    color: '#38bdf8',
    dialogues: AETHER_SPIRE_DIALOGUE.map((d) => d.text),
  },
  {
    id: 'npc_orion',
    name: 'Forge-Keeper Orion',
    role: 'Master Astral Smith',
    icon: '☄️',
    faction: 'Solari',
    zoneId: 'STARFALL_CRATER',
    location: 'Starfall Meteorite Crater',
    color: '#f97316',
    teachesProfessionId: 'relic_forging',
    dialogues: [
      'Welcome to the Starfall Impact Basin! Celestial Starmetal and Astral Mithril veins ring the molten crater. Smelt your cosmic ingots right here on the Astral Star-Anvil!',
    ],
  },
  {
    id: 'npc_nihilus',
    name: 'Rift-Watcher Nihilus',
    role: 'Void Singularity Warden',
    icon: '🌌',
    faction: 'Umbri',
    zoneId: 'ABYSSAL_RIFT',
    location: 'The Abyssal Rift',
    color: '#c084fc',
    dialogues: [
      "Beyond these fractured obsidian spires waits Xal'Korath, the Void Architect. Harvest Celestial Gossamer and Empyrean Starleaf along the rift edge before challenging his singularity!",
    ],
  },
  {
    id: 'npc_silas',
    name: 'Forester Silas',
    role: 'Master Woodcrafter',
    icon: '🪓',
    faction: 'Terra',
    zoneId: 'IRONWOOD_TIMBERLANDS',
    location: 'Ironwood Timberlands & Lumberjack Camp',
    color: '#4ade80',
    teachesProfessionId: 'resonance_extraction',
    dialogues: [
      'Welcome to the Ironwood Timberlands! Grab your axe and fell Glimmerwood, ancient Ironbark, and Duskveil willows across the grove. Bundle logs into Campfire Kits or roast fresh fish over our crackling campfire hearth!',
    ],
  },
  {
    id: 'npc_finn',
    name: 'Angler Finn',
    role: 'Master Cosmic Angler',
    icon: '🎣',
    faction: 'Neutral',
    zoneId: 'CORAL_COAST',
    location: 'Coral Coast & Brinelight Pier',
    color: '#06b6d4',
    teachesProfessionId: 'glimmerweaving',
    dialogues: [
      'Cast your line into these shimmering tidal currents! From silvery Glimmer Minnows to radiant Solar Trout and Prismatic Reef Salmon, the ocean provides for patient souls. Roast your catch right here at our seaside hearth!',
    ],
  },
];

const SEARCH_NPCS = NPC_DEFINITIONS.map((def) => {
  const m = def.merchantId ? MERCHANT_CATALOGS[def.merchantId] : null;
  const quotes = [...def.dialogues];
  if (m) {
    if (m.greeting) quotes.push(m.greeting);
    if (m.loreIntro) quotes.push(m.loreIntro);
    if (m.stationHint) quotes.push(m.stationHint);
  }
  const heldQuests = SEARCH_QUESTS.filter(
    (q) => q.giverId === def.id || q.turnInId === def.id
  ).map((q) => ({
    id: q.id,
    title: q.name,
    kind: q.kind,
    relation:
      q.giverId === def.id && q.turnInId === def.id
        ? 'Gives & Completes'
        : q.giverId === def.id
          ? 'Gives Quest'
          : 'Turn-In Target',
    desc: q.desc,
    rewards: q.rewards,
  }));

  // Also capture quest accept/complete spoken lines attributed to this NPC
  for (const q of Object.values(QUEST_CATALOG || {})) {
    if (q.giverId === def.id) {
      for (const l of q.acceptDialogue || []) {
        if (l?.text && !quotes.includes(l.text)) quotes.push(l.text);
      }
    }
    if (q.turnInId === def.id) {
      for (const l of q.completeDialogue || []) {
        if (l?.text && !quotes.includes(l.text)) quotes.push(l.text);
      }
    }
  }

  const taughtSkill = def.teachesProfessionId
    ? SKILL_GUIDES.find((s) => s.id === def.teachesProfessionId)
    : null;

  return {
    type: 'npc',
    id: def.id,
    name: def.name,
    role: def.role,
    icon: def.icon,
    faction: def.faction,
    zoneId: def.zoneId,
    alsoZoneIds: def.alsoZoneIds || [],
    location: def.location,
    color: def.color,
    whatTheySay: quotes,
    quests: heldQuests,
    shopWares: m
      ? (m.wares || []).map((w) => ({
          itemId: w.itemId,
          itemName: EQUIPMENT_CATALOG[w.itemId]?.name || w.itemId,
          icon: EQUIPMENT_CATALOG[w.itemId]?.icon || '📦',
          price: w.price,
          note: w.note,
        }))
      : [],
    teachesSkill: taughtSkill
      ? { id: taughtSkill.id, name: taughtSkill.name, icon: taughtSkill.icon }
      : null,
  };
});

// 4. CHARACTERS (8 Hero Classes + 6 Nexus Familiars)
const SEARCH_CHARACTERS = [];
for (const cls of Object.values(CLASSES_CATALOG || {})) {
  const fMeta = FACTIONS_META[cls.faction] || { color: '#38bdf8', icon: '⚔️' };
  const sigAbilityIds = Object.values(cls.legacyDefaultLoadout || cls.defaultLoadout || {});
  const abilities = [...new Set(sigAbilityIds)]
    .map((abId) => ABILITIES_CATALOG[abId])
    .filter(Boolean)
    .map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.castTime > 0 ? 'Rite' : 'Flash',
      reqLevel: a.reqLevel || 1,
      desc: a.desc || '',
    }));

  const starterGear = Object.entries(cls.defaultEquipment || {}).map(([slot, eqId]) => ({
    slot,
    id: eqId,
    name: EQUIPMENT_CATALOG[eqId]?.name || eqId,
    icon: EQUIPMENT_CATALOG[eqId]?.icon || '⚔️',
  }));

  SEARCH_CHARACTERS.push({
    type: 'character',
    kind: 'Hero Class',
    id: cls.id,
    name: cls.name,
    faction: cls.faction,
    role: cls.role,
    icon: fMeta.icon || '⚔️',
    color: fMeta.color || '#38bdf8',
    desc: cls.desc,
    bonusStats: cls.bonusStats || {},
    starterGear,
    abilities,
    ingredients: [],
    passiveLabel: formatStatsSummary(cls.bonusStats || {}).join(' • ') || 'Balanced Faction Kit',
  });
}

for (const fam of Object.values(NEXUS_FAMILIARS_CATALOG || {})) {
  SEARCH_CHARACTERS.push({
    type: 'character',
    kind: 'Nexus Familiar',
    id: fam.id,
    name: fam.name,
    faction: fam.faction,
    role: `Construct Cradle Familiar • Req Rite-Binding Lv. ${fam.reqLevel || 1}`,
    icon: '🐾',
    color: fam.color || '#c084fc',
    desc: fam.lore || '',
    bonusStats: fam.passiveStats || {},
    starterGear: [],
    abilities: [],
    passiveLabel: fam.passiveLabel || '',
    reqLevel: fam.reqLevel || 1,
    compileXp: fam.xp || 90,
    ingredients: (fam.ingredients || []).map((ing) => ({
      id: ing.id,
      name: EQUIPMENT_CATALOG[ing.id]?.name || GLIMMER_CIPHERS_CATALOG[ing.id]?.name || ing.id,
      icon: EQUIPMENT_CATALOG[ing.id]?.icon || GLIMMER_CIPHERS_CATALOG[ing.id]?.icon || '📦',
      qty: ing.qty || 1,
    })),
  });
}

// 5. MAP ZONES CATALOG (Enriched with gathering nodes & NPCs in each realm)
const SEARCH_ZONES = [];
for (const reg of Object.values(WORLD_ATLAS_REGIONS || {})) {
  const lowerKey = reg.id.toLowerCase();
  const layoutEntries = SKILLING_LAYOUTS[lowerKey] || [];
  const seenNodes = new Set();
  const gatheringNodes = [];
  for (const row of layoutEntries) {
    const nodeTypeId = Array.isArray(row) ? row[0] : row?.nodeType;
    if (!nodeTypeId || seenNodes.has(nodeTypeId)) continue;
    seenNodes.add(nodeTypeId);
    const nodeDef = SKILLING_NODE_TYPES[nodeTypeId];
    if (!nodeDef) continue;
    gatheringNodes.push({
      nodeId: nodeTypeId,
      nodeName: nodeDef.name,
      reqLevel: nodeDef.reqLevel || 1,
      xp: nodeDef.xp || 20,
      yields: (nodeDef.yields || nodeDef.drops || []).map((d) => ({
        id: d.id,
        name: EQUIPMENT_CATALOG[d.id]?.name || d.id,
        icon: EQUIPMENT_CATALOG[d.id]?.icon || '📦',
      })),
    });
  }

  const npcsHere = SEARCH_NPCS.filter(
    (n) => n.zoneId === reg.id || (n.alsoZoneIds && n.alsoZoneIds.includes(reg.id))
  ).map((n) => ({
    id: n.id,
    name: n.name,
    role: n.role,
    icon: n.icon,
  }));

  SEARCH_ZONES.push({
    type: 'zone',
    id: reg.id,
    name: reg.name,
    sub: reg.sub,
    level: reg.level,
    dangerTag: reg.dangerTag,
    faction: reg.faction,
    color: reg.color,
    borderColor: reg.borderColor,
    desc: reg.desc,
    travel: reg.travel,
    objectives: reg.objectives || '',
    neighbors: reg.neighbors || {},
    landmarks: reg.landmarks || [],
    entities: reg.entities || [],
    gatheringNodes,
    npcsHere,
  });
}

// 6. SKILL GUIDE SUMMARY LINKS
const SEARCH_SKILLS = SKILL_GUIDES.map((sk) => ({
  type: 'skill',
  id: sk.id,
  name: sk.name,
  category: sk.category,
  role: sk.role,
  icon: sk.icon,
  color: sk.color,
  instructor: sk.instructor,
  trainerLocation: sk.trainerLocation,
  quickStart: sk.quickStart,
  passiveSummary: sk.passiveSummary,
  cape: sk.cape,
  brackets: sk.brackets.map((b) => ({ range: b.range, title: b.title, zone: b.zone, xpPerAction: b.xpPerAction })),
}));

const outPath = path.join(process.cwd(), 'landing', 'src', 'data', 'universalSearchData.js');
const banner = `// ==========================================
// Auto-generated Canonical Universal Search & Map Index for GlimmerFall Online
// Generated by: node scripts/syncUniversalSearchData.mjs
// Pure data + deterministic search/lookup helpers (Vercel standalone & Vite safe)
// ==========================================
`;

const fileContent = `${banner}
export const UNIVERSAL_SEARCH_ITEMS = ${JSON.stringify(SEARCH_ITEMS, null, 2)};

export const UNIVERSAL_SEARCH_NPCS = ${JSON.stringify(SEARCH_NPCS, null, 2)};

export const UNIVERSAL_SEARCH_CHARACTERS = ${JSON.stringify(SEARCH_CHARACTERS, null, 2)};

export const UNIVERSAL_SEARCH_QUESTS = ${JSON.stringify(SEARCH_QUESTS, null, 2)};

export const UNIVERSAL_SEARCH_ZONES = ${JSON.stringify(SEARCH_ZONES, null, 2)};

export const UNIVERSAL_SEARCH_SKILLS = ${JSON.stringify(SEARCH_SKILLS, null, 2)};

export const UNIVERSAL_SEARCH_ALL = [
  ...UNIVERSAL_SEARCH_ITEMS,
  ...UNIVERSAL_SEARCH_NPCS,
  ...UNIVERSAL_SEARCH_CHARACTERS,
  ...UNIVERSAL_SEARCH_QUESTS,
  ...UNIVERSAL_SEARCH_ZONES,
  ...UNIVERSAL_SEARCH_SKILLS,
];

function scoreMatch(entry, qLower, tokens) {
  const nameLower = String(entry.name || '').toLowerCase();
  const idLower = String(entry.id || '').toLowerCase();
  if (nameLower === qLower || idLower === qLower) return 1000;
  if (nameLower.startsWith(qLower) || idLower.startsWith(qLower)) return 820;

  let haystackParts = [
    entry.name,
    entry.id,
    entry.role,
    entry.sub,
    entry.desc,
    entry.whatItDoes,
    entry.location,
    entry.faction,
    entry.rarity,
    entry.passiveLabel,
    entry.travel,
    entry.giverName,
    entry.turnInName,
  ];
  if (Array.isArray(entry.whatTheySay)) haystackParts = haystackParts.concat(entry.whatTheySay);
  if (Array.isArray(entry.tasks)) haystackParts = haystackParts.concat(entry.tasks);
  if (Array.isArray(entry.droppedBy)) haystackParts = haystackParts.concat(entry.droppedBy);
  if (Array.isArray(entry.quests)) {
    for (const q of entry.quests) haystackParts.push(q.title, q.desc);
  }
  if (Array.isArray(entry.shopWares)) {
    for (const w of entry.shopWares) haystackParts.push(w.itemName, w.note);
  }
  if (Array.isArray(entry.craftedBy)) {
    for (const c of entry.craftedBy) {
      haystackParts.push(c.professionName, c.stationName);
      for (const ing of c.ingredients || []) haystackParts.push(ing.name, ing.id);
    }
  }
  if (Array.isArray(entry.usedInRecipes)) {
    for (const u of entry.usedInRecipes) haystackParts.push(u.outputName, u.professionName);
  }
  if (Array.isArray(entry.harvestSources)) {
    for (const h of entry.harvestSources) {
      haystackParts.push(h.nodeName);
      for (const z of h.zones || []) haystackParts.push(z.zoneName);
    }
  }
  if (Array.isArray(entry.ingredients)) {
    for (const ing of entry.ingredients) haystackParts.push(ing.name, ing.id);
  }
  if (Array.isArray(entry.gatheringNodes)) {
    for (const g of entry.gatheringNodes) {
      haystackParts.push(g.nodeName);
      for (const y of g.yields || []) haystackParts.push(y.name, y.id);
    }
  }
  if (Array.isArray(entry.npcsHere)) {
    for (const n of entry.npcsHere) haystackParts.push(n.name, n.role);
  }
  if (Array.isArray(entry.entities)) {
    for (const e of entry.entities) haystackParts.push(e.name, e.desc);
  }
  if (Array.isArray(entry.landmarks)) {
    for (const l of entry.landmarks) haystackParts.push(l.name, l.desc);
  }

  const hay = haystackParts.filter(Boolean).join(' ').toLowerCase();
  if (!tokens.every((t) => hay.includes(t))) return 0;

  let score = 200;
  if (nameLower.includes(qLower)) score += 350;
  if (idLower.includes(qLower)) score += 260;
  if (String(entry.role || entry.whatItDoes || '').toLowerCase().includes(qLower)) score += 90;
  return score;
}

/**
 * Search across items, NPCs, classes/familiars, quests/bounties, map zones, and skills.
 */
export function searchUniversalCatalog(query = '', categoryFilter = 'all', limit = 40) {
  const qClean = String(query || '').trim();
  const countsByType = {
    all: 0,
    item: 0,
    npc: 0,
    character: 0,
    quest: 0,
    zone: 0,
    skill: 0,
  };

  let scored = [];
  if (!qClean) {
    // Featured curated mix when query is empty
    const featuredIds = [
      'rite_binding', 'npc_aurora', 'npc_archon', 'merchant_apothecary',
      'chrono_lotus', 'sunbloom_herb', 'empyrean_starleaf', 'starfall_moon_owl',
      'echo_print_starfall_owl', 'chrono_starlight_imbue', 'chronocore_temper_sigil',
      'solari_vanguard', 'SANCTUARY_HUB', 'STARFALL_CRATER', 'quest_awakening',
    ];
    scored = UNIVERSAL_SEARCH_ALL.map((e, idx) => ({
      entry: e,
      score: featuredIds.includes(e.id) ? 500 : 100 - Math.min(90, idx * 0.1),
    }));
  } else {
    const qLower = qClean.toLowerCase();
    const tokens = qLower.split(/\\s+/).filter(Boolean);
    for (const entry of UNIVERSAL_SEARCH_ALL) {
      const s = scoreMatch(entry, qLower, tokens);
      if (s > 0) scored.push({ entry, score: s });
    }
    scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  }

  for (const row of scored) {
    countsByType.all += 1;
    if (countsByType[row.entry.type] !== undefined) countsByType[row.entry.type] += 1;
  }

  const filtered =
    !categoryFilter || categoryFilter === 'all'
      ? scored
      : scored.filter((r) => r.entry.type === categoryFilter);

  return {
    results: filtered.slice(0, limit).map((r) => r.entry),
    countsByType,
  };
}

/**
 * Resolve any exact entry by ID or best-scoring name (e.g. clicking an ingredient chip).
 */
export function resolveUniversalEntry(idOrName) {
  const raw = String(idOrName || '').trim();
  if (!raw) return null;
  const exactId = UNIVERSAL_SEARCH_ALL.find((e) => e.id.toLowerCase() === raw.toLowerCase());
  if (exactId) return exactId;
  const exactName = UNIVERSAL_SEARCH_ALL.find((e) => e.name.toLowerCase() === raw.toLowerCase());
  if (exactName) return exactName;
  const { results } = searchUniversalCatalog(raw, 'all', 1);
  return results[0] || null;
}

/**
 * Extract resolvable items, NPCs, or familiars mentioned in a skill guide snippet.
 * Matches snake_case IDs and multi-word item/NPC names deterministically.
 */
export function findUniversalMentions(text = '', maxItems = 10) {
  const raw = String(text || '');
  if (!raw.trim()) return [];
  const low = raw.toLowerCase();
  const seen = new Set();
  const found = [];

  const pushEntry = (e) => {
    if (!e || seen.has(e.id)) return;
    seen.add(e.id);
    found.push(e);
  };

  // 1. Exact snake_case IDs written directly in guide strings (e.g. sunbloom_herb, chrono_lotus)
  const idMatches = raw.match(/\\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\\b/gi) || [];
  for (const token of idMatches) {
    const hit = UNIVERSAL_SEARCH_ALL.find((e) => e.id.toLowerCase() === token.toLowerCase());
    if (hit) pushEntry(hit);
    if (found.length >= maxItems) return found;
  }

  // 2. Multi-word exact names for items, NPCs, and familiars (longest first to avoid partial collisions)
  const candidates = UNIVERSAL_SEARCH_ALL
    .filter((e) => (e.type === 'item' || e.type === 'npc' || e.type === 'character') && e.name.length >= 5)
    .sort((a, b) => b.name.length - a.name.length);
  for (const entry of candidates) {
    const nLow = entry.name.toLowerCase();
    if (low.includes(nLow)) {
      pushEntry(entry);
      if (found.length >= maxItems) return found;
    }
  }

  // 3. Fallback comma/bullet tokens (e.g. "Chrono-Lotus", "Moon-Owl")
  const chunks = raw.split(/[,•+()]+/).map((s) => s.trim()).filter((s) => s.length >= 4);
  for (const ch of chunks) {
    const clean = ch.replace(/^Lv\\.\\s*\\d+\\s*/i, '').replace(/\\s+\\d+%.*$/, '').trim();
    if (clean.length < 4 || /^\\d/.test(clean)) continue;
    const hit = UNIVERSAL_SEARCH_ALL.find(
      (e) => (e.type === 'item' || e.type === 'character' || e.type === 'npc') && e.name.toLowerCase().includes(clean.toLowerCase())
    );
    if (hit) pushEntry(hit);
    if (found.length >= maxItems) return found;
  }

  return found;
}

/**
 * Filter continental map zones by realm name, NPC, boss, landmark, faction, or harvestable resource.
 */
export function searchMapZones(query = '') {
  const qLower = String(query || '').trim().toLowerCase();
  if (!qLower) {
    return UNIVERSAL_SEARCH_ZONES.map((z) => ({ zone: z, matchReasons: [] }));
  }
  const tokens = qLower.split(/\\s+/).filter(Boolean);
  const out = [];

  for (const z of UNIVERSAL_SEARCH_ZONES) {
    const reasons = [];
    const check = (label, txt) => {
      const low = String(txt || '').toLowerCase();
      if (low.includes(qLower) && !reasons.includes(label)) reasons.push(label);
    };

    check(z.name, z.name);
    check(z.level, z.level);
    check(z.faction, z.faction);
    for (const n of z.npcsHere || []) check(\`NPC: \${n.name}\`, \`\${n.name} \${n.role}\`);
    for (const e of z.entities || []) check(\`Entity: \${e.name}\`, \`\${e.name} \${e.desc}\`);
    for (const l of z.landmarks || []) check(\`Landmark: \${l.name}\`, \`\${l.name} \${l.desc}\`);
    for (const g of z.gatheringNodes || []) {
      check(\`Node: \${g.nodeName} (Lv.\${g.reqLevel})\`, g.nodeName);
      for (const y of g.yields || []) {
        check(\`Drops: \${y.name} (\${g.nodeName})\`, \`\${y.name} \${y.id}\`);
      }
    }

    const fullText = [
      z.name, z.sub, z.level, z.faction, z.desc, z.travel,
      ...(z.npcsHere || []).map((n) => \`\${n.name} \${n.role}\`),
      ...(z.entities || []).map((e) => \`\${e.name} \${e.desc}\`),
      ...(z.landmarks || []).map((l) => \`\${l.name} \${l.desc}\`),
      ...(z.gatheringNodes || []).flatMap((g) => [g.nodeName, ...(g.yields || []).map((y) => \`\${y.name} \${y.id}\`)]),
    ].join(' ').toLowerCase();

    if (tokens.every((t) => fullText.includes(t))) {
      out.push({ zone: z, matchReasons: reasons.slice(0, 4) });
    }
  }
  return out;
}
`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log(
  `Generated universalSearchData.js: ${SEARCH_ITEMS.length} items, ${SEARCH_NPCS.length} NPCs, ${SEARCH_CHARACTERS.length} classes/familiars, ${SEARCH_QUESTS.length} quests/bounties, ${SEARCH_ZONES.length} map zones, ${SEARCH_SKILLS.length} skills.`
);
