import { EQUIPMENT_CATALOG } from "./setsAndRunewords.js";

export const MERCHANT_CATALOGS = {
  merchant_apothecary: {
    id: 'merchant_apothecary',
    name: 'Alchemist Faye',
    title: 'Apothecary & Potions Merchant',
    icon: '⚖️',
    spriteKey: 'merchantApothecaryNpc',
    badgeColor: '#38bdf8',
    greeting: 'Welcome to my Apothecary stall! Here I distill mountain roots and concentrated aether into restorative elixirs.',
    loreIntro: 'Vitality salves mend flesh wounds and heal HP, while Leyline Glimmer Draughts restore ability charge. You can drink them directly from your 28-slot backpack during battle.',
    stationId: 'aether_crucible',
    stationHint: 'Train Rite-Binding at the bubbling Aetherial Crucible right beside my apothecary stall using herbs + essences!',
    wares: [
      { itemId: 'sunbloom_herb', price: 7, note: 'Fresh golden herb for Rite-Binding at the Aetherial Crucible.' },
      { itemId: 'astral_mineral_dust', price: 12, note: 'Leyline mineral flux for draughts & Star-Iron smelting.' },
      { itemId: 'minor_healing_salve', price: 10, note: 'Mends wounds immediately. Restores +35 HP on use.' },
      { itemId: 'glimmer_draught', price: 12, note: 'Effervescent tonic. Restores +40 Glimmer Charge.' },
      { itemId: 'major_vitality_elixir', price: 25, note: 'Concentrated brew. Restores +80 HP on use.' },
    ],
  },
  merchant_provisions: {
    id: 'merchant_provisions',
    name: 'Farmer Bran',
    title: 'Provisions & Rations Merchant',
    icon: '🍎',
    spriteKey: 'merchantProvisionsNpc',
    badgeColor: '#4ade80',
    greeting: 'Hail and well met! An adventurer cannot venture into the ruins on an empty stomach. Stock up on hearty sustenance!',
    loreIntro: 'Eating baked bread loaves, fresh orchard apples, or smoked trail rations recovers your Health between skirmishes. Click any food in your backpack to consume it.',
    stationId: 'celestial_loom',
    stationHint: 'Train Glimmerweaving at the Celestial Loom & Hearth right beside my stall using Starlight Flax, Shadow-Silk & orchard fruit!',
    wares: [
      { itemId: 'starlight_flax', price: 7, note: 'Silky grove fiber spun into cloaks & tunics on the Celestial Loom.' },
      { itemId: 'sweet_apple', price: 3, note: 'Crisp orchard fruit. Restores +15 HP or bakes into pies & rations.' },
      { itemId: 'fresh_crusty_bread', price: 6, note: 'Warm crusty loaf. Restores +25 HP on use.' },
      { itemId: 'field_rations', price: 10, note: 'Smoked jerky and trail fruits. Restores +35 HP on use.' },
    ],
  },
  merchant_smith: {
    id: 'merchant_smith',
    name: 'Blacksmith Torvin',
    title: 'Smithing & Ore Wares Merchant',
    icon: '⚒️',
    spriteKey: 'merchantSmithNpc',
    badgeColor: '#fb923c',
    greeting: 'Ho there! Blacksmith Torvin at your service. Reliable metalwork is what separates champions from fallen recruits!',
    loreIntro: 'I supply raw ores and beginner blades. To train Relic-Forging, smelt ores + cosmic minerals and hammer gear at the Cosmic Star-Anvil right beside my forge!',
    stationId: 'cosmic_anvil',
    stationHint: 'Train Relic-Forging at the glowing Cosmic Star-Anvil right beside my stall — combine Ores + Minerals into bars, blades & gems!',
    wares: [
      { itemId: 'sun_copper_ore', price: 6, note: 'Warm copper ore — alloy with Star-Tin at the Cosmic Star-Anvil.' },
      { itemId: 'star_tin_mineral', price: 6, note: 'Crystalline star-tin mineral for smelting Bronze Bars.' },
      { itemId: 'iron_ore', price: 8, note: 'Quarried iron ore rock ready for Star-Iron & Steel smelting.' },
      { itemId: 'iron_broadsword', price: 28, note: 'Forged combat blade (+2 Power).' },
      { itemId: 'iron_heater_shield', price: 24, note: 'Reinforced defense shield (+2 Bastion).' },
    ],
  },
  merchant_relics: {
    id: 'merchant_relics',
    name: 'Relic-Seeker Moira',
    title: 'Aether Curios & Relics Merchant',
    icon: '✨',
    spriteKey: 'merchantRelicsNpc',
    badgeColor: '#c084fc',
    greeting: 'Greetings, seeker. I unearth remnants of the First Nexus across the continental ruins. What curios do you seek?',
    loreIntro: 'First Nexus relic fragments, raw glimmer shards, and temporal chrono-gems pulse with leyline power and command great value in the AetherSwap Market.',
    wares: [
      { itemId: 'ancient_relic_fragment', price: 18, note: 'Carved First Nexus keystone shard.' },
      { itemId: 'glimmer_shard', price: 22, note: 'Raw continental aether crystal valued by traders.' },
      { itemId: 'chrono_gem', price: 32, note: 'Temporal jewel channeling chronomantic resonance.' },
      { itemId: 'apprentice_focus_orb', price: 28, note: 'Arcane off-hand orb (+2 Resonance).' },
      { itemId: 'echo_print_ember_fox', price: 65, note: 'Solari Construct Blueprint • Compile Dawnkit Ember-Fox at Construct Cradle.' },
      { itemId: 'echo_print_ankyloling', price: 70, note: 'Terra Construct Blueprint • Compile Mossback Ankyloling at Construct Cradle.' },
      { itemId: 'echo_print_wisp_imp', price: 85, note: 'Umbri Construct Blueprint • Compile Graveglass Wisp-Imp at Construct Cradle.' },
      { itemId: 'echo_print_prism_sprite', price: 110, note: 'Aether Construct Blueprint • Compile Chrono-Prism Sprite at Construct Cradle.' },
    ],
  },
  merchant_tailor: {
    id: 'merchant_tailor',
    name: 'Shadow Stitcher Silvan',
    title: 'Glimmerweaving & Silk Merchant',
    icon: '🧵',
    spriteKey: 'shadowBrokerNpc',
    badgeColor: '#a855f7',
    greeting: 'Step into the twilight, wanderer. In the Umbri Undercity, we spin silence and void-threads into garments that turn blades.',
    loreIntro: 'I stock starlight flax, dark umbral coal, and raw fibers. You can weave protective travel mantles, cowls, and mystic vestments right at the Celestial Loom in our market district.',
    stationId: 'celestial_loom',
    stationHint: 'Train Glimmerweaving at the Celestial Loom right beside my stall in the Umbri Undercity using botanical fibers and shadow silks!',
    wares: [
      { itemId: 'starlight_flax', price: 6, note: 'Luminescent fiber ready for spinning into fine yarn.' },
      { itemId: 'umbral_coal', price: 8, note: 'Subterranean void fuel for forging dark alloys and dyes.' },
      { itemId: 'scout_leather_tunic', price: 26, note: 'Lightweight scouting tunic (+2 Bastion, +1 Tempo).' },
      { itemId: 'cloth_cape', price: 22, note: 'Flowing traveler mantle (+1 Bastion).' },
    ],
  },
  merchant_tavern: {
    id: 'merchant_tavern',
    name: 'Innkeeper Garrick',
    title: 'Hearthstone Innkeeper & Brewmaster',
    icon: '🍺',
    spriteKey: 'merchantProvisionsNpc',
    badgeColor: '#fbbf24',
    greeting: 'Pull up a stool by the hearthfire, traveler! Nothing beats crusty loaves, sweet orchard apples, and restorative tonics after an expedition.',
    loreIntro: 'My tavern cellar is stocked with hot rations for health and frothy glimmer draughts for rapid ability recovery.',
    stationId: 'campfire_hearth',
    stationHint: 'Cook freshly caught Coral Coast fish & savory traveler feasts right on the tavern hearth!',
    wares: [
      { itemId: 'sweet_apple', price: 3, note: 'Crisp orchard fruit (+15 HP).' },
      { itemId: 'fresh_crusty_bread', price: 6, note: 'Oven-warm loaf straight from the brick hearth (+25 HP).' },
      { itemId: 'field_rations', price: 10, note: 'Hearty smoked traveler feast (+35 HP).' },
      { itemId: 'minor_healing_salve', price: 10, note: 'Soothing herbal tonic (+35 HP).' },
      { itemId: 'glimmer_draught', price: 12, note: 'Sparkling golden brew (+40 Glimmer Charge).' },
      { itemId: 'major_vitality_elixir', price: 25, note: 'Reserve vintage elixir (+80 HP).' },
    ],
  },
};

export function getItemGuidePrice(itemId) {
  const it = EQUIPMENT_CATALOG[itemId];
  if (!it) return 50;
  if (it.guidePrice) return it.guidePrice;
  if (it.rarity?.includes('Apex') || it.rarity?.includes('Mythic')) return 1250;
  if (it.rarity?.includes('Continental Set') || it.rarity?.includes('Ancient Set') || it.set) return 500;
  if (it.slot === 'currency') {
    if (itemId === 'solar_gold') return 1;
    if (itemId === 'glimmer_shard') return 8;
    if (itemId === 'chrono_gem') return 25;
    if (itemId === 'verdant_amber') return 22;
    if (itemId === 'void_essence') return 30;
    return 10;
  }
  if (it.slot === 'consumable') {
    if (itemId === 'minor_healing_salve') return 10;
    if (itemId === 'glimmer_draught') return 12;
    if (itemId === 'major_vitality_elixir') return 25;
    if (itemId === 'sweet_apple') return 3;
    if (itemId === 'fresh_crusty_bread') return 6;
    if (itemId === 'field_rations') return 10;
    return 15;
  }
  if (it.slot === 'material') {
    if (itemId === 'iron_ore') return 6;
    if (itemId === 'bronze_bar') return 14;
    if (itemId === 'ancient_relic_fragment') return 18;
    return 10;
  }
  if (it.id?.startsWith('iron_') || it.id?.startsWith('scout_') || it.id?.startsWith('novice_')) return 45;
  if (it.slot === 'ring' || it.slot === 'cape' || it.slot === 'neck') return 110;
  return 75;
}

export function getMerchantWarePrice(merchantId, itemId) {
  if (!itemId) return null;
  if (merchantId && MERCHANT_CATALOGS[merchantId]) {
    const ware = MERCHANT_CATALOGS[merchantId].wares.find((w) => w.itemId === itemId);
    if (ware) return ware.price;
  }
  if (!merchantId) {
    for (const cat of Object.values(MERCHANT_CATALOGS)) {
      const ware = cat.wares.find((w) => w.itemId === itemId);
      if (ware) return ware.price;
    }
  }
  return null;
}

export function getMerchantSellPrice(itemId) {
  if (!itemId || itemId === 'solar_gold' || !EQUIPMENT_CATALOG[itemId]) return 0;
  const warePrice = getMerchantWarePrice(null, itemId);
  const baseVal = warePrice != null ? warePrice : getItemGuidePrice(itemId);
  return Math.max(1, Math.floor(baseVal * 0.4));
}

export const QUEST_REWARDS_CATALOG = {
  quest_awakening: {
    title: 'Awakening from Stasis',
    prereqQuestId: null,
    questPoints: 1,
    rewards: { xp: 140, glimmer: 70, gold: 75 },
  },
  quest_into_the_warzone: {
    title: 'Vanguard Orders',
    prereqQuestId: 'quest_awakening',
    questPoints: 1,
    rewards: { xp: 180, glimmer: 90, gold: 75 },
  },
  quest_void_banish: {
    title: 'Banish Void Invaders',
    prereqQuestId: 'quest_into_the_warzone',
    questPoints: 1,
    rewards: { xp: 350, glimmer: 150, gold: 140 },
  },
  quest_first_nexus: {
    title: 'First Nexus Secrets',
    prereqQuestId: null,
    questPoints: 1,
    rewards: { xp: 500, glimmer: 200, gold: 180 },
  },
  quest_caldera_siege: {
    title: 'The Continental Nexus Shard',
    prereqQuestId: 'quest_void_banish',
    questPoints: 2,
    rewards: { xp: 700, glimmer: 300, gold: 250 },
  },
  quest_celestial_ascent: {
    title: 'Ascent to the Empyrean',
    prereqQuestId: 'quest_first_nexus',
    questPoints: 2,
    rewards: { xp: 900, glimmer: 350, gold: 350 },
  },
  quest_titan_cleansing: {
    title: 'The Slumbering Sovereign',
    prereqQuestId: 'quest_celestial_ascent',
    questPoints: 3,
    rewards: { xp: 1500, glimmer: 500, gold: 600 },
  },
  quest_elemental_pilgrimage: {
    title: 'The Four Leyline Sanctuaries',
    prereqQuestId: 'quest_awakening',
    questPoints: 2,
    rewards: { xp: 600, glimmer: 250, gold: 250 },
  },
  quest_stargazer_chronos: {
    title: "Astromancer's Continuum",
    prereqQuestId: 'quest_awakening',
    questPoints: 1,
    rewards: { xp: 350, glimmer: 120, gold: 150, professionXp: { resonance_extraction: 60 } },
  },
  quest_skill_extraction: {
    title: 'Resonance: First Extraction',
    prereqQuestId: null,
    questPoints: 1,
    rewards: { xp: 180, glimmer: 60, gold: 120, professionXp: { resonance_extraction: 75 } },
  },
  quest_skill_forging: {
    title: 'Forging: The Cosmic Star-Anvil',
    prereqQuestId: null,
    questPoints: 1,
    rewards: { xp: 180, glimmer: 50, gold: 120, professionXp: { relic_forging: 75 } },
  },
  quest_skill_binding: {
    title: 'Binding: The Aetherial Crucible',
    prereqQuestId: null,
    questPoints: 1,
    rewards: { xp: 180, glimmer: 50, gold: 120, professionXp: { rite_binding: 75 } },
  },
  quest_skill_weaving: {
    title: 'Weaving: The Celestial Loom',
    prereqQuestId: null,
    questPoints: 1,
    rewards: { xp: 180, glimmer: 50, gold: 120, professionXp: { glimmerweaving: 75 } },
  },
  quest_skill_combat: {
    title: 'Combat: First Blood',
    prereqQuestId: 'quest_awakening',
    questPoints: 1,
    rewards: { xp: 220, glimmer: 60, gold: 100, professionXp: { combat_mastery: 75 } },
  },
  quest_skill_training: {
    title: "The Artisan's First Rank",
    prereqQuestId: 'quest_awakening',
    questPoints: 1,
    rewards: {
      xp: 240,
      glimmer: 80,
      gold: 120,
      professionXp: { relic_forging: 75, rite_binding: 75, glimmerweaving: 75 },
    },
  },
  quest_artisan_capstone: {
    title: "The Artisan's Path",
    prereqQuestId: null,
    questPoints: 2,
    rewards: {
      xp: 800,
      glimmer: 220,
      gold: 300,
      professionXp: { resonance_extraction: 40, relic_forging: 40, rite_binding: 40, glimmerweaving: 40 },
    },
  },
  quest_starfall_forge: {
    title: 'The Fallen Astral Forge',
    prereqQuestId: null,
    questPoints: 2,
    rewards: { xp: 850, glimmer: 300, gold: 360, professionXp: { relic_forging: 220, resonance_extraction: 180 } },
  },
  quest_abyssal_breach: {
    title: 'Breach of the Void Architect',
    prereqQuestId: null,
    questPoints: 3,
    rewards: { xp: 1350, glimmer: 450, gold: 520, professionXp: { combat_mastery: 320, rite_binding: 200 } },
  },
  quest_crystalheart_shattering: {
    title: 'The Shattered Crystal Heart',
    prereqQuestId: 'quest_awakening',
    questPoints: 2,
    rewards: { xp: 450, glimmer: 160, gold: 120 },
  },
  quest_the_four_splinters: {
    title: 'The Great Glimmer Fracture',
    prereqQuestId: 'quest_crystalheart_shattering',
    questPoints: 2,
    rewards: { xp: 680, glimmer: 240, gold: 200 },
  },
  quest_reforge_crystalheart_shard: {
    title: 'Reforging the Crystal Core',
    prereqQuestId: 'quest_the_four_splinters',
    questPoints: 3,
    rewards: {
      xp: 850,
      glimmer: 320,
      gold: 260,
      professionXp: { relic_forging: 150, rite_binding: 150, glimmerweaving: 150 },
    },
  },
  quest_covenant_conclave: {
    title: 'Covenant Chapter I: The Fourfold Oath',
    prereqQuestId: 'quest_reforge_crystalheart_shard',
    questPoints: 3,
    rewards: { xp: 950, glimmer: 380, gold: 320 },
  },
  quest_starfall_meteor_convergence: {
    title: 'Covenant Chapter II: Starfall Meteor Convergence',
    prereqQuestId: 'quest_covenant_conclave',
    questPoints: 4,
    rewards: { xp: 1400, glimmer: 520, gold: 500, professionXp: { resonance_extraction: 300, relic_forging: 300 } },
  },
};
