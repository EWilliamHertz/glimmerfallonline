// Complete Authentic GlimmerFall TCG Rites & Flashes Catalog (All 4 Factions)
export const ABILITIES_CATALOG = {
  // === SOLARI ===
  flare_strike: {
    id: 'flare_strike', faction: 'Solari', name: 'Flare Strike', short: 'Flare',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '⚔️', kind: 'melee_cleave', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0.85, castTime: 0, color: '#facc15',
    desc: 'Radiant cleave dealing (4-7 + Power + 2×Rank) DMG & generating Glimmer.',
    lore: 'AWK #11: "A beacon of unwavering light against the encroaching shadow."',
  },
  radiant_bulwark: {
    id: 'radiant_bulwark', faction: 'Solari', name: 'Radiant Bulwark', short: 'Bulwark',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'flare_strike',
    icon: '🛡️', kind: 'shield', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#38bdf8',
    desc: 'Summons starlight Guard shields absorbing (14 + 3×Bastion + 4×Rank) DMG.',
    lore: 'AWK: "Prevent incoming damage to your Guardian and friendly units."',
  },
  solar_intervene: {
    id: 'solar_intervene', faction: 'Solari', name: 'Solar Intervene', short: 'Intervene',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'radiant_bulwark',
    icon: '⚡', kind: 'dash', range: '8.0y Flash', rangeYards: 8.0,
    cost: 0, baseCd: 5.0, castTime: 0, color: '#fde047',
    desc: 'Instant 8y radiant flash leap granting +15 Glimmer and a momentary barrier.',
    lore: 'AWK: "Cross the battlefield in the beat of a solar pulse."',
  },
  blinding_radiance: {
    id: 'blinding_radiance', faction: 'Solari', name: 'Blinding Radiance', short: 'Blind',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'solar_intervene',
    icon: '💨', kind: 'dash', range: '8.5y Dash', rangeYards: 8.5,
    cost: 0, baseCd: 4.0, castTime: 0, color: '#bae6fd',
    desc: 'Flash-dashes 8.5y in starlight & blinds nearby foes (-2 ATK for 5s).',
    lore: 'AWK #2: "Blinding Radiance brings order to chaos."',
  },
  sun_aegis_rebuke: {
    id: 'sun_aegis_rebuke', faction: 'Solari', name: 'Sun Aegis Rebuke', short: 'Rebuke',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'blinding_radiance',
    icon: '☀️', kind: 'reactive_barrier', range: 'Self/Aura', rangeYards: 6,
    cost: 0, baseCd: 8.0, castTime: 0, color: '#facc15',
    desc: 'Reactive solar flash: absorbs damage, reflects 40% back & blinds attackers for 4s!',
    lore: 'AWK: "Those who strike the sun are blinded by its light."',
  },
  aurora_stride: {
    id: 'aurora_stride', faction: 'Solari', name: 'Aurora Stride', short: 'Stride',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'sun_aegis_rebuke',
    icon: '✨', kind: 'cleanse_sprint', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 6.5, castTime: 0, color: '#fef08a',
    desc: 'Instant celestial stride: +50% movement speed for 4s, breaks all snares and cleanses debuffs!',
    lore: 'AWK: "Run across the dawn, untouched by worldly chains."',
  },
  solar_ascension: {
    id: 'solar_ascension', faction: 'Solari', name: 'Solar Ascension', short: 'Ascend',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'aurora_stride',
    icon: '👑', kind: 'archon_form', range: 'Self/Aura', rangeYards: 12,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#fde047',
    desc: 'Apex Archon Avatar: for 8s, resets all Flash cooldowns and pulses continuous Holy Radiance (12y)!',
    lore: 'AWK #1: "The Champion transcends mortal form, embodying the immortal Sun itself."',
  },
  solar_flare: {
    id: 'solar_flare', faction: 'Solari', name: 'Solar Flare', short: 'Solar',
    tcgType: 'Solari Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: null,
    icon: '☀️', kind: 'cast_beam', range: '25y', rangeYards: 25,
    cost: 25, baseCd: 3.5, castTime: 1.0, color: '#fbbf24',
    desc: '1.0s sun-pillar Rite dealing (11-15 + 2×Power + 3×Rank) CRIT DMG + splash.',
    lore: 'AWK #12: "The unbridled fury of the sun, reduced to a single blinding flash."',
  },
  judgement_of_the_sun: {
    id: 'judgement_of_the_sun', faction: 'Solari', name: 'Judgement of the Sun', short: 'Judge',
    tcgType: 'Solari Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'solar_flare',
    icon: '🔨', kind: 'projectile', projType: 'hammer', range: '20y', rangeYards: 20,
    cost: 0, baseCd: 4.5, castTime: 0.85, color: '#facc15',
    desc: 'Hurls a solar hammer for (7-10 + Power + 2×Rank) DMG (+25 bonus Glimmer on kill!).',
    lore: 'AWK: "Deal damage to target enemy. If it dies, gain bonus Solar Energy."',
  },
  blessing_of_dawn: {
    id: 'blessing_of_dawn', faction: 'Solari', name: 'Blessing of Dawn', short: 'Bless',
    tcgType: 'Solari Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: null,
    icon: '✨', kind: 'heal', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 6.0, castTime: 0.9, color: '#4ade80',
    desc: 'Restores (8 + 2×Bastion + 3×Rank) HP to you and nearby squadmates.',
    lore: 'AWK: "Give target friendly entity vitality and restore Health."',
  },
  consecrated_ground: {
    id: 'consecrated_ground', faction: 'Solari', name: 'Consecrated Ground', short: 'Ground',
    tcgType: 'Solari Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'judgement_of_the_sun',
    icon: '🔥', kind: 'ground_zone', zoneType: 'consecration', range: '7.5y AoE', rangeYards: 7.5,
    cost: 0, baseCd: 8.0, castTime: 1.0, color: '#fb923c',
    desc: 'Sanctifies ground for 6s: burns foes & grants +2 Power to allies inside.',
    lore: 'AWK: "Friendly entities gain Power; enemies take damage each turn."',
  },
  decree_of_the_sun: {
    id: 'decree_of_the_sun', faction: 'Solari', name: 'Decree of the Sun', short: 'Decree',
    tcgType: 'Solari Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'consecrated_ground',
    icon: '👑', kind: 'nova', range: '12y Edict', rangeYards: 12,
    cost: 20, baseCd: 9.0, castTime: 1.2, color: '#fde047', healNexus: true,
    desc: 'Solar edict scorching foes in 12y & restoring +3 HP to allied Outpost/Sanctuary Nexus!',
    lore: 'AWK: "By sovereign Decree of the Sun, the Citadel stands unbroken."',
  },
  daybreak: {
    id: 'daybreak', faction: 'Solari', name: 'Daybreak', short: 'Dawn',
    tcgType: 'Solari Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'blessing_of_dawn',
    icon: '🌅', kind: 'heal_glimmer', range: 'Self/Squad', rangeYards: 14,
    cost: 0, baseCd: 8.5, castTime: 1.1, color: '#fef08a',
    desc: 'Restores HP, grants +25 Glimmer, and cleanses all slows/weakness.',
    lore: 'AWK: "When Daybreak crests the spire, every shadow retreats."',
  },
  wrath_of_the_daystar: {
    id: 'wrath_of_the_daystar', faction: 'Solari', name: 'Wrath of the Daystar', short: 'Daystar',
    tcgType: 'Solari Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'decree_of_the_sun',
    icon: '⚡', kind: 'nova', range: '14y Nova', rangeYards: 14,
    cost: 30, baseCd: 11.0, castTime: 1.4, color: '#fde047',
    desc: 'Spends 30 Glimmer for a 14y solar nova dealing heavy CRIT DMG & knockback.',
    lore: 'AWK: "Wrath of the Daystar commands sovereign radiance against all foes."',
  },
  corona_cataclysm: {
    id: 'corona_cataclysm', faction: 'Solari', name: 'Corona Cataclysm', short: 'Cataclysm',
    tcgType: 'Solari Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'wrath_of_the_daystar',
    icon: '☀️', kind: 'cast_beam', range: '28y Apex', rangeYards: 28,
    cost: 35, baseCd: 15.0, castTime: 1.6, color: '#fde047',
    desc: 'Apex Solari Rite: summons an orbital solar cataclysm beam dealing catastrophic damage (45+ base) in 16y!',
    lore: 'AWK: "The full majesty of the primordial star descends upon the battlefield."',
  },

  // === UMBRI ===
  whisper_of_the_void: {
    id: 'whisper_of_the_void', faction: 'Umbri', name: 'Whisper of the Void', short: 'Whisper',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '🗡️', kind: 'melee_cleave', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0.8, castTime: 0, color: '#c084fc',
    desc: 'Twin shadow-scythe slash generating Glimmer (+45% CRIT from Stealth!).',
    lore: 'AWK: "A silent cut from the Duskveil dark."',
  },
  graveglass_ward: {
    id: 'graveglass_ward', faction: 'Umbri', name: 'Graveglass Ward', short: 'Ward',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'whisper_of_the_void',
    icon: '🔮', kind: 'shield', range: 'Self/Squad', rangeYards: 10,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#c084fc',
    desc: 'Shrouds you in spectral Graveglass absorbing incoming damage.',
    lore: 'AWK: "Forged from shattered sepulcher crystal."',
  },
  veil_of_dusk: {
    id: 'veil_of_dusk', faction: 'Umbri', name: 'Veil of Dusk', short: 'Stealth',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'graveglass_ward',
    icon: '👤', kind: 'stealth', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 9.0, castTime: 0, color: '#7e22ce',
    desc: 'Vanish into Stealth for 3.5s: mobs drop aggro, +35% speed & Ambush CRIT!',
    lore: 'AWK: "Unseen by sun or star."',
  },
  shadow_step: {
    id: 'shadow_step', faction: 'Umbri', name: 'Shadow Step', short: 'Step',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'veil_of_dusk',
    icon: '🌑', kind: 'shadow_step', range: '16y Blink', rangeYards: 16,
    cost: 0, baseCd: 4.5, castTime: 0, color: '#a855f7',
    desc: 'Teleports through shadow directly behind your target & empowers next strike!',
    lore: 'AWK: "Step into the gloom; emerge behind their heart."',
  },
  abyssal_shroud: {
    id: 'abyssal_shroud', faction: 'Umbri', name: 'Abyssal Shroud', short: 'Shroud',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'shadow_step',
    icon: '🌫️', kind: 'stealth_burst', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 8.0, castTime: 0, color: '#9333ea',
    desc: 'Envelops you in abyssal mist: guarantees 100% Dodge for 2.0s & poisons attackers for 4s!',
    lore: 'AWK: "Strike the mist, and bleed for your presumption."',
  },
  eclipse_reap: {
    id: 'eclipse_reap', faction: 'Umbri', name: 'Eclipse Reap', short: 'Reap',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'abyssal_shroud',
    icon: '⚡', kind: 'dash_cleave', range: '10y Scythe Dash', rangeYards: 10,
    cost: 0, baseCd: 5.5, castTime: 0, color: '#c084fc',
    desc: 'Instant void scythe dash through enemies dealing heavy execution shadow cleave & +18 Glimmer!',
    lore: 'AWK: "Where the scythe passes, only silence remains."',
  },
  avatar_of_the_void: {
    id: 'avatar_of_the_void', faction: 'Umbri', name: 'Avatar of the Void', short: 'Voidform',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'eclipse_reap',
    icon: '👑', kind: 'voidform', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#a855f7',
    desc: 'Apex Void Avatar: for 8s, Life Leech is doubled, movement speed is +40%, and all hits are Critical Strikes!',
    lore: 'AWK #3: "You do not walk with the shadows; you are the abyss itself."',
  },
  soul_tithe: {
    id: 'soul_tithe', faction: 'Umbri', name: 'Soul Tithe', short: 'Tithe',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: null,
    icon: '💀', kind: 'projectile', projType: 'void_orb', range: '22y', rangeYards: 22,
    cost: 0, baseCd: 4.2, castTime: 0.85, color: '#e879f9',
    desc: 'Fires a Void bolt dealing shadow DMG, draining HP & granting +24 Glimmer.',
    lore: 'AWK: "Every soul owes its tithe to the Undercity."',
  },
  siphon_soul: {
    id: 'siphon_soul', faction: 'Umbri', name: 'Siphon Soul', short: 'Siphon',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'soul_tithe',
    icon: '🩸', kind: 'drain_beam', range: '20y', rangeYards: 20,
    cost: 15, baseCd: 5.5, castTime: 1.0, color: '#f43f5e',
    desc: 'Rips vitality from target enemy, healing you for 60% of all DMG dealt!',
    lore: 'AWK: "Drink deep of fading Glimmer."',
  },
  nightfall_plague: {
    id: 'nightfall_plague', faction: 'Umbri', name: 'Nightfall Plague', short: 'Plague',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'siphon_soul',
    icon: '☠️', kind: 'ground_zone', zoneType: 'plague', range: '8y AoE', rangeYards: 8,
    cost: 0, baseCd: 8.5, castTime: 1.1, color: '#9333ea',
    desc: 'Spreads Duskveil miasma for 6s: deals Void DMG/tick & slows enemies by 45%.',
    lore: 'AWK: "Where Nightfall settles, light withers."',
  },
  unmake: {
    id: 'unmake', faction: 'Umbri', name: 'Unmake', short: 'Unmake',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'nightfall_plague',
    icon: '💥', kind: 'execute_beam', range: '22y', rangeYards: 22,
    cost: 25, baseCd: 7.5, castTime: 1.3, color: '#e11d48',
    desc: 'Obliterates target with Void collapse (+50% Execution DMG if target < 50% HP!).',
    lore: 'AWK: "Erase them from the tapestry of reality."',
  },
  eclipse_harvester: {
    id: 'eclipse_harvester', faction: 'Umbri', name: 'Eclipse Harvester', short: 'Harvester',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'unmake',
    icon: '🌑', kind: 'scythe_wave', range: '20y Arc', rangeYards: 20,
    cost: 30, baseCd: 10.5, castTime: 1.4, color: '#9333ea',
    desc: '1.4s Rite hurling a crescent dark-energy wave in a wide 20y arc, dealing massive shadow DMG and draining HP.',
    lore: 'AWK: "When the eclipse falls, harvest the living."',
  },
  void_annihilation: {
    id: 'void_annihilation', faction: 'Umbri', name: 'Void Annihilation', short: 'Annihilate',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'eclipse_harvester',
    icon: '🌌', kind: 'singularity_collapse', range: '24y Singularity', rangeYards: 24,
    cost: 35, baseCd: 16.0, castTime: 1.6, color: '#c084fc',
    desc: 'Apex Umbri Rite: opens a black hole singularity pulling in all enemies within 16y and imploding for catastrophic damage (50+ base)!',
    lore: 'AWK #4: "The final cessation of all light and matter."',
  },

  // === TERRA ===
  tectonic_slam: {
    id: 'tectonic_slam', faction: 'Terra', name: 'Tectonic Slam', short: 'Slam',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '🪨', kind: 'melee_cleave', range: '7y', rangeYards: 7,
    cost: 0, baseCd: 0.9, castTime: 0, color: '#4ade80',
    desc: 'Crushing earth cleave triggering Overwhelm splash & generating Glimmer.',
    lore: 'AWK: "The mountain answers when Rootdeep strikes."',
  },
  barkskin_infusion: {
    id: 'barkskin_infusion', faction: 'Terra', name: 'Barkskin Infusion', short: 'Barkskin',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'tectonic_slam',
    icon: '🛡️', kind: 'thornbark', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#22c55e',
    desc: 'Grants Ironwood Shield + Thornbark (reflects 35% melee DMG back at attackers!).',
    lore: 'AWK: "Ironwood bark turns blade and claw alike."',
  },
  rooted_bastion: {
    id: 'rooted_bastion', faction: 'Terra', name: 'Rooted Bastion', short: 'Bastion',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'barkskin_infusion',
    icon: '🌳', kind: 'iron_fortify', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 8.5, castTime: 0, color: '#15803d',
    desc: 'Roots into deep earth: gains 40% Damage Reduction and Crowd Control immunity for 3.5s!',
    lore: 'AWK: "Deep roots anchor the titan when storms rage."',
  },
  wildshape_surge: {
    id: 'wildshape_surge', faction: 'Terra', name: 'Wildshape Surge', short: 'Surge',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'rooted_bastion',
    icon: '🐾', kind: 'dash', range: '9y Charge', rangeYards: 9,
    cost: 0, baseCd: 4.5, castTime: 0, color: '#86efac',
    desc: 'Primal beast-charge 9y forward, trampling foes & granting +15 Glimmer!',
    lore: 'AWK: "Channel the untamed apex of Rootdeep."',
  },
  bramble_reversal: {
    id: 'bramble_reversal', faction: 'Terra', name: 'Bramble Reversal', short: 'Reversal',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'wildshape_surge',
    icon: '🌿', kind: 'bramble_burst', range: '8y Burst', rangeYards: 8,
    cost: 0, baseCd: 7.5, castTime: 0, color: '#4ade80',
    desc: 'Explosive thorn ring: knocks back surrounding enemies, snares them for 4s & reflects incoming damage!',
    lore: 'AWK: "Push against the bramble, and find yourself pinned."',
  },
  ironwood_colossus: {
    id: 'ironwood_colossus', faction: 'Terra', name: 'Ironwood Colossus', short: 'Colossus',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'bramble_reversal',
    icon: '🪨', kind: 'colossus_stomp', range: '10y Stomp', rangeYards: 10,
    cost: 0, baseCd: 6.0, castTime: 0, color: '#84cc16',
    desc: 'Instant seismic stomp: deals crushing physical damage around player, generates +25 Glimmer & knocks down foes!',
    lore: 'AWK: "When the elder walks, mountains shake."',
  },
  avatar_of_the_ironwood: {
    id: 'avatar_of_the_ironwood', faction: 'Terra', name: 'Avatar of the Ironwood', short: 'Treant',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'ironwood_colossus',
    icon: '👑', kind: 'treant_form', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#22c55e',
    desc: 'Apex Ironwood Avatar: for 8s, gains +250 Shield, Thornbark reflect increased to 60%, and Overwhelm radius +50%!',
    lore: 'AWK #5: "Become the primeval heartwood that weathered the First Fall."',
  },
  ancient_boulder: {
    id: 'ancient_boulder', faction: 'Terra', name: 'Stonekin Boulder', short: 'Boulder',
    tcgType: 'Terra Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: null,
    icon: '☄️', kind: 'projectile', projType: 'boulder', range: '20y', rangeYards: 20,
    cost: 0, baseCd: 4.6, castTime: 0.9, color: '#a3e635',
    desc: 'Hurls a mossy monolith boulder dealing heavy Overwhelm DMG.',
    lore: 'AWK: "Carved from the elder peaks."',
  },
  briar_snare: {
    id: 'briar_snare', faction: 'Terra', name: 'Briar Snare', short: 'Snare',
    tcgType: 'Terra Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'ancient_boulder',
    icon: '🌿', kind: 'ground_zone', zoneType: 'briar', range: '8y Roots', rangeYards: 8,
    cost: 0, baseCd: 8.0, castTime: 1.0, color: '#16a34a',
    desc: 'Entangling roots for 6s: snares enemy movement by 65% & deals thorn DMG!',
    lore: 'AWK: "The Orchard claims trespassers."',
  },
  verdant_renewal: {
    id: 'verdant_renewal', faction: 'Terra', name: 'Verdant Renewal', short: 'Renew',
    tcgType: 'Terra Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: null,
    icon: '🌸', kind: 'heal', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 6.2, castTime: 0.95, color: '#4ade80',
    desc: 'Blooms Glimmer flora restoring (9 + 2×Bastion + 3×Rank) HP to self & squad.',
    lore: 'AWK: "Life springs eternal from ancient roots."',
  },
  overwhelm_roar: {
    id: 'overwhelm_roar', faction: 'Terra', name: 'Primal Overwhelm', short: 'Roar',
    tcgType: 'Terra Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'briar_snare',
    icon: '🦁', kind: 'nova', range: '11y Roar', rangeYards: 11,
    cost: 20, baseCd: 9.0, castTime: 1.1, color: '#bef264',
    desc: 'Thunderous roar damaging & weakening nearby enemies (-2 ATK for 5s).',
    lore: 'AWK: "None stand before the stampede."',
  },
  earthshatter: {
    id: 'earthshatter', faction: 'Terra', name: 'Earthshatter', short: 'Shatter',
    tcgType: 'Terra Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'overwhelm_roar',
    icon: '🌋', kind: 'nova', range: '13y Quake', rangeYards: 13,
    cost: 25, baseCd: 8.5, castTime: 1.3, color: '#84cc16',
    desc: 'Ruptures the earth in 13y for massive Overwhelm CRIT DMG & knockback!',
    lore: 'AWK: "Split stone and scatter their ranks."',
  },
  tectonic_fissure: {
    id: 'tectonic_fissure', faction: 'Terra', name: 'Tectonic Fissure', short: 'Fissure',
    tcgType: 'Terra Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'earthshatter',
    icon: '⛰️', kind: 'fissure_line', range: '18y Line', rangeYards: 18,
    cost: 30, baseCd: 10.5, castTime: 1.4, color: '#65a30d',
    desc: '1.4s Rite cleaving a seismic trench in a line: deals crushing physical damage and leaves rocky spikes that bleed and slow enemies by 50%!',
    lore: 'AWK: "The earth itself tears open, devouring the unyielding."',
  },
  wrath_of_gaia: {
    id: 'wrath_of_gaia', faction: 'Terra', name: 'Wrath of Gaia', short: 'Gaia',
    tcgType: 'Terra Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'tectonic_fissure',
    icon: '🌳', kind: 'continental_quake', range: '16y Cataclysm', rangeYards: 16,
    cost: 35, baseCd: 16.0, castTime: 1.6, color: '#4ade80',
    desc: 'Apex Terra Rite: triggers a continental earthquake in 16y, dealing extreme physical/earth damage (48+ base) and stunning all enemies for 3.0s!',
    lore: 'AWK #6: "Awaken the slumbering mantle; let the ancient earth claim its tithe."',
  },

  // === AETHER ===
  reality_fracture: {
    id: 'reality_fracture', faction: 'Aether', name: 'Reality Fracture', short: 'Fracture',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 1, reqLevel: 1, maxRank: 5, prereq: null,
    icon: '💠', kind: 'melee_cleave', range: '7.5y', rangeYards: 7.5,
    cost: 0, baseCd: 0.8, castTime: 0, color: '#38bdf8',
    desc: 'Slices spacetime in a 7.5y arc, generating Astral Glimmer.',
    lore: 'AWK: "Even steel bends when space itself cracks."',
  },
  arcane_bolt: {
    id: 'arcane_bolt', faction: 'Aether', name: 'Temporal Lance', short: 'Lance',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'reality_fracture',
    icon: '🔹', kind: 'projectile', projType: 'aether_orb', range: '24y', rangeYards: 24,
    cost: 0, baseCd: 3.2, castTime: 0, color: '#38bdf8',
    desc: 'Fires an accelerating orb of distorted time dealing Arcane DMG +20 Glimmer.',
    lore: 'AWK: "Strike from three seconds in the future."',
  },
  mirror_barrier: {
    id: 'mirror_barrier', faction: 'Aether', name: 'Mirror Barrier', short: 'Mirror',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'reality_fracture',
    icon: '🪞', kind: 'shield', range: 'Self/Squad', rangeYards: 12,
    cost: 0, baseCd: 9.0, castTime: 0, color: '#7dd3fc',
    desc: 'Refractive prism shield absorbing damage for you & nearby squadmates.',
    lore: 'AWK: "Mirrorgate glass bends fury into starlight."',
  },
  chrono_shift: {
    id: 'chrono_shift', faction: 'Aether', name: 'Chrono Shift', short: 'Blink',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 3, reqLevel: 6, maxRank: 5, prereq: 'mirror_barrier',
    icon: '⏩', kind: 'dash', range: '9.5y Blink', rangeYards: 9.5,
    cost: 0, baseCd: 3.6, castTime: 0, color: '#7dd3fc',
    desc: 'Instant temporal blink 9.5y leaving time-afterimages & +12 Glimmer.',
    lore: 'AWK: "Step between ticks of the cosmic clock."',
  },
  frost_nova: {
    id: 'frost_nova', faction: 'Aether', name: 'Frost Nova', short: 'Frost',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'chrono_shift',
    icon: '❄️', kind: 'frost_nova', range: '11y Freeze', rangeYards: 11,
    cost: 15, baseCd: 7.5, castTime: 0, color: '#bae6fd',
    desc: 'Shatters star-ice in 11y, dealing CRIT DMG & freezing/chilling foes for 3.5s!',
    lore: 'AWK: "Absolute zero between the stars."',
  },
  phase_shift: {
    id: 'phase_shift', faction: 'Aether', name: 'Phase Shift', short: 'Phase',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'frost_nova',
    icon: '🌌', kind: 'ethereal_jaunt', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 8.5, castTime: 0, color: '#7dd3fc',
    desc: 'Instant timeline slip: slips into the ether for 1.2s, becoming completely untargetable and invulnerable!',
    lore: 'AWK: "Step out of reality when destruction knocks."',
  },
  chrono_rift: {
    id: 'chrono_rift', faction: 'Aether', name: 'Chrono Rift', short: 'Rift',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'phase_shift',
    icon: '⚡', kind: 'rift_teleport', range: '11y Rift', rangeYards: 11,
    cost: 0, baseCd: 6.0, castTime: 0, color: '#38bdf8',
    desc: 'Instant 11y spacetime leap leaving an astral rift that slows enemies by 50% and generates +20 Glimmer!',
    lore: 'AWK: "Fissure the continuum to leap past danger."',
  },
  temporal_apotheosis: {
    id: 'temporal_apotheosis', faction: 'Aether', name: 'Temporal Apotheosis', short: 'ChronoForm',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'chrono_rift',
    icon: '👑', kind: 'apotheosis', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 18.0, castTime: 0, color: '#e0f2fe',
    desc: 'Apex Aether Avatar: resets all non-apex cooldowns, reduces Rite cast times by 75%, and grants +50% movement speed for 8s!',
    lore: 'AWK #7: "Master of the cosmic timeline, where past and future bow to your will."',
  },
  astral_convergence: {
    id: 'astral_convergence', faction: 'Aether', name: 'Astral Convergence', short: 'Starfall',
    tcgType: 'Aether Rite', tree: 'rites', tier: 3, reqLevel: 6, maxRank: 5, prereq: null,
    icon: '🌠', kind: 'cast_beam', range: '26y', rangeYards: 26,
    cost: 25, baseCd: 3.8, castTime: 1.0, color: '#38bdf8',
    desc: '1.0s Rite calling down cosmic starfall beams (+35% chance to Echo twice!).',
    lore: 'AWK: "When the constellations align, empires fall."',
  },
  gravity_well: {
    id: 'gravity_well', faction: 'Aether', name: 'Gravity Well', short: 'Gravity',
    tcgType: 'Aether Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'astral_convergence',
    icon: '🌀', kind: 'ground_zone', zoneType: 'gravity', range: '8.5y Vortex', rangeYards: 8.5,
    cost: 0, baseCd: 8.5, castTime: 1.1, color: '#0ea5e9',
    desc: 'Spawns a cosmic vortex for 6s that pulls enemies inward & ticks arcane DMG!',
    lore: 'AWK: "No light—nor shadow—escapes the singularity."',
  },
  time_loop_paradox: {
    id: 'time_loop_paradox', faction: 'Aether', name: 'Time Loop Paradox', short: 'TimeLoop',
    tcgType: 'Aether Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'gravity_well',
    icon: '⏳', kind: 'timeloop', range: 'Self', rangeYards: 0,
    cost: 0, baseCd: 9.0, castTime: 1.2, color: '#e0f2fe',
    desc: 'Rewinds wounds (+HP), shaves 2.5s off active cooldowns & primes Spell Echo!',
    lore: 'AWK: "Why suffer a wound that hasn\'t happened yet?"',
  },
  supernova_collapse: {
    id: 'supernova_collapse', faction: 'Aether', name: 'Supernova Collapse', short: 'Supernova',
    tcgType: 'Aether Rite', tree: 'rites', tier: 6, reqLevel: 24, maxRank: 5, prereq: 'time_loop_paradox',
    icon: '💥', kind: 'supernova', range: '13y Implosion', rangeYards: 13,
    cost: 30, baseCd: 10.5, castTime: 1.4, color: '#38bdf8',
    desc: '1.4s Rite causing an astral supernova implosion in 13y, dealing heavy arcane CRIT DMG and generating +25 Glimmer!',
    lore: 'AWK: "The death of a star is born in brilliant devastation."',
  },
  chrono_stasis_singularity: {
    id: 'chrono_stasis_singularity', faction: 'Aether', name: 'Chrono Stasis Singularity', short: 'Stasis',
    tcgType: 'Aether Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'supernova_collapse',
    icon: '🌌', kind: 'stasis_bubble', range: '14y Sphere', rangeYards: 14,
    cost: 35, baseCd: 16.0, castTime: 1.6, color: '#0284c7',
    desc: 'Apex Aether Rite: freezes spacetime in a 14y sphere, immobilizing all enemies for 3.5s before shattering for catastrophic damage (50+ base)!',
    lore: 'AWK #8: "Freeze the clock of destiny, and shatter their existence."',
  },

  // ==========================================
  // CLASS SPECIALIZATION ABILITIES (32 Exclusive Spells Across 8 Classes)
  // ==========================================

  // --- SOLARI VANGUARD (Main Tank / Radiant Juggernaut) ---
  aegis_slam: {
    id: 'aegis_slam', faction: 'Solari', classId: 'solari_vanguard',
    name: 'Aegis Slam', short: 'AegisSlam',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'flare_strike',
    icon: '🛡️', kind: 'aegis_slam', range: '6.5y Slam', rangeYards: 6.5,
    cost: 0, baseCd: 5.5, castTime: 0, color: '#facc15',
    desc: 'Vanguard Exclusive Flash: Shield-slams target, stunning for 1.5s, generating 3.5x Taunt threat & +15 Solar Charge.',
    lore: 'Vanguard Codex: "Hold the Sunspire threshold; let none pass."',
  },
  sunfire_lance: {
    id: 'sunfire_lance', faction: 'Solari', classId: 'solari_vanguard',
    name: 'Sunfire Lance', short: 'SunLance',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'aegis_slam',
    icon: '🔱', kind: 'sunfire_lance', range: '14y Leap', rangeYards: 14,
    cost: 0, baseCd: 7.0, castTime: 0, color: '#fbbf24',
    desc: 'Vanguard Exclusive Flash: Radiant spear leap to target, pulling nearby foes inward & applying Sunbrand.',
    lore: 'Vanguard Codex: "Pierce the vanguard with dawnlight steel."',
  },
  bastion_banner: {
    id: 'bastion_banner', faction: 'Solari', classId: 'solari_vanguard',
    name: 'Bastion Banner', short: 'Banner',
    tcgType: 'Solari Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'sunfire_lance',
    icon: '🚩', kind: 'bastion_banner', range: '12y Aura', rangeYards: 12,
    cost: 20, baseCd: 12.0, castTime: 0.9, color: '#facc15',
    desc: 'Vanguard Exclusive Rite: Plants a Sunspire War-Standard granting squadmates +25% DR and pulsing radiant damage for 8s.',
    lore: 'Vanguard Codex: "Beneath golden silk, the line never breaks."',
  },
  judgement_verdict: {
    id: 'judgement_verdict', faction: 'Solari', classId: 'solari_vanguard',
    name: 'Judgement Verdict', short: 'Verdict',
    tcgType: 'Solari Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'bastion_banner',
    icon: '⚖️', kind: 'judgement_verdict', range: '12y Verdict', rangeYards: 12,
    cost: 35, baseCd: 15.0, castTime: 1.4, color: '#fef08a',
    desc: 'Vanguard Apex Rite: Drops a colossal radiant hammer dealing massive damage scaled by Shield + Bastion!',
    lore: 'Vanguard Codex: "Weighed in starlight, found wanting."',
  },

  // --- AURORA MARSHAL (Celestial Healer / Ranged Support) ---
  starlight_mend: {
    id: 'starlight_mend', faction: 'Solari', classId: 'aurora_marshal',
    name: 'Starlight Mend', short: 'StarMend',
    tcgType: 'Solari Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'flare_strike',
    icon: '🌟', kind: 'starlight_mend', range: '16y Chain', rangeYards: 16,
    cost: 0, baseCd: 3.8, castTime: 0.85, color: '#fde047',
    desc: 'Marshal Exclusive Rite: Radiant surge healing self and bouncing to the lowest-HP ally (overheal becomes Radiant Barrier!).',
    lore: 'Marshal Codex: "Not a single soul fades beneath the Marshal\'s watch."',
  },
  aurora_beam: {
    id: 'aurora_beam', faction: 'Solari', classId: 'aurora_marshal',
    name: 'Aurora Beam', short: 'AuroraBeam',
    tcgType: 'Solari Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'starlight_mend',
    icon: '🌈', kind: 'aurora_beam', range: '22y Beam', rangeYards: 22,
    cost: 15, baseCd: 5.5, castTime: 1.0, color: '#fef08a',
    desc: 'Marshal Exclusive Rite: Fires a searing solar prism beam scorching foes & healing nearby squadmates.',
    lore: 'Marshal Codex: "Light refracted through faith burns corruption to ash."',
  },
  purifying_halo: {
    id: 'purifying_halo', faction: 'Solari', classId: 'aurora_marshal',
    name: 'Purifying Halo', short: 'Purify',
    tcgType: 'Solari Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'aurora_beam',
    icon: '💫', kind: 'purifying_halo', range: '12y Cleanse', rangeYards: 12,
    cost: 0, baseCd: 8.5, castTime: 0, color: '#bae6fd',
    desc: 'Marshal Exclusive Flash: Instant AoE cleanse purging all snares/weakens on squad & granting +30% speed for 4s.',
    lore: 'Marshal Codex: "A single chime unbinds every shadow curse."',
  },
  solaris_apotheosis: {
    id: 'solaris_apotheosis', faction: 'Solari', classId: 'aurora_marshal',
    name: 'Solaris Apotheosis', short: 'Sanctuary',
    tcgType: 'Solari Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'purifying_halo',
    icon: '🌞', kind: 'solaris_apotheosis', range: '14y Dome', rangeYards: 14,
    cost: 35, baseCd: 16.0, castTime: 1.3, color: '#fde047', healNexus: true,
    desc: 'Marshal Apex Rite: Summons a golden Sanctuary Dome for 6s surging ally HP/Glimmer & mending allied Outpost Nexus!',
    lore: 'Marshal Codex: "Let the eternal dawn crown the Citadel."',
  },

  // --- UMBRAL ASSASSIN (Melee Stealth Burst / Executioner) ---
  serrated_mutilate: {
    id: 'serrated_mutilate', faction: 'Umbri', classId: 'umbral_assassin',
    name: 'Serrated Mutilate', short: 'Mutilate',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'whisper_of_the_void',
    icon: '🗡️', kind: 'serrated_mutilate', range: '6.5y Twin', rangeYards: 6.5,
    cost: 0, baseCd: 3.2, castTime: 0, color: '#e879f9',
    desc: 'Assassin Exclusive Flash: Instant twin-fang strike dealing double-hit shadow DMG & granting +2 Dusk Marks.',
    lore: 'Syndicate Codex: "Two blades enter the ribs before the breath escapes."',
  },
  crimson_rupture: {
    id: 'crimson_rupture', faction: 'Umbri', classId: 'umbral_assassin',
    name: 'Crimson Rupture', short: 'Rupture',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'serrated_mutilate',
    consumesDuskMarks: true,
    icon: '🩸', kind: 'crimson_rupture', range: '7.0y Bleed', rangeYards: 7.0,
    cost: 0, baseCd: 5.5, castTime: 0, color: '#f43f5e',
    desc: 'Assassin Exclusive Finisher: Consumes all Dusk Marks for a ferocious shadow bleed (+25% DMG per Mark!).',
    lore: 'Syndicate Codex: "Bleed out the light, drop by crimson drop."',
  },
  smoke_bomb: {
    id: 'smoke_bomb', faction: 'Umbri', classId: 'umbral_assassin',
    name: 'Umbral Smoke Bomb', short: 'SmokeBomb',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'crimson_rupture',
    icon: '💨', kind: 'smoke_bomb', range: '8y Cloud', rangeYards: 8,
    cost: 0, baseCd: 9.5, castTime: 0, color: '#a855f7',
    desc: 'Assassin Exclusive Flash: Drops a 6s twilight smoke veil granting Stealth, +100% Ambush Crit & blinding nearby foes.',
    lore: 'Syndicate Codex: "Vanish inside the ink between heartbeats."',
  },
  phantom_sever: {
    id: 'phantom_sever', faction: 'Umbri', classId: 'umbral_assassin',
    name: 'Phantom Sever', short: 'Sever',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'smoke_bomb',
    icon: '🌑', kind: 'phantom_sever', range: '14y Blitz', rangeYards: 14,
    cost: 30, baseCd: 15.0, castTime: 0, color: '#c084fc',
    desc: 'Assassin Apex Flash: Shadow clones omni-slash up to 5 enemies within 14y for guaranteed Critical Strikes!',
    lore: 'Syndicate Codex: "Five blades, one shadow, zero survivors."',
  },

  // --- GRAVEGLASS ORACLE (Blood-Hex Reaper / Drain Caster) ---
  hex_of_frailty: {
    id: 'hex_of_frailty', faction: 'Umbri', classId: 'graveglass_oracle',
    name: 'Hex of Frailty', short: 'Hex',
    tcgType: 'Umbri Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'whisper_of_the_void',
    icon: '🧿', kind: 'hex_of_frailty', range: '20y Curse', rangeYards: 20,
    cost: 0, baseCd: 4.5, castTime: 0, color: '#c084fc',
    desc: 'Oracle Exclusive Flash: Curses target for 8s (-20% ATK, +20% incoming Rite DMG) & grants +1 Dusk Mark.',
    lore: 'Sepulcher Codex: "Speak their true name in broken mirror-glass."',
  },
  graveglass_shardburst: {
    id: 'graveglass_shardburst', faction: 'Umbri', classId: 'graveglass_oracle',
    name: 'Graveglass Shardburst', short: 'Shards',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'hex_of_frailty',
    icon: '🔮', kind: 'shardburst', projType: 'void_orb', range: '22y Volley', rangeYards: 22,
    cost: 15, baseCd: 5.5, castTime: 0.95, color: '#e879f9',
    desc: 'Oracle Exclusive Rite: Hurls homing graveglass shards shattering for heavy shadow DMG & siphoning 45% as HP.',
    lore: 'Sepulcher Codex: "Every shard drinks deep and remembers."',
  },
  soul_covenant: {
    id: 'soul_covenant', faction: 'Umbri', classId: 'graveglass_oracle',
    name: 'Soul Covenant', short: 'Covenant',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'graveglass_shardburst',
    icon: '🩸', kind: 'soul_covenant', range: '10y Pact', rangeYards: 10,
    cost: 0, baseCd: 9.0, castTime: 0.9, color: '#e11d48',
    desc: 'Oracle Exclusive Rite: Sacrifices 12% current HP for a massive blood-nova, +45 Glimmer & Blood Phylactery shield!',
    lore: 'Sepulcher Codex: "Power demands tribute; pay in crimson."',
  },
  harbingers_requiem: {
    id: 'harbingers_requiem', faction: 'Umbri', classId: 'graveglass_oracle',
    name: "Harbinger's Requiem", short: 'Requiem',
    tcgType: 'Umbri Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'soul_covenant',
    icon: '💀', kind: 'harbingers_requiem', range: '14y Drain', rangeYards: 14,
    cost: 35, baseCd: 15.5, castTime: 1.4, color: '#a855f7',
    desc: 'Oracle Apex Rite: Drains all foes in 14y simultaneously, healing 75% of total damage & slowing by 50%!',
    lore: 'Sepulcher Codex: "Sing the final chord of dusk over silent bone."',
  },

  // --- FOREST WARDEN (Primal Bruiser / Spear & Poison) ---
  gale_spear: {
    id: 'gale_spear', faction: 'Terra', classId: 'forest_warden',
    name: 'Gale Spear', short: 'GaleSpear',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'tectonic_slam',
    icon: '🔱', kind: 'gale_spear', projType: 'spear', range: '16y Dash', rangeYards: 16,
    cost: 0, baseCd: 4.5, castTime: 0, color: '#4ade80',
    desc: 'Warden Exclusive Flash: Hurls an emerald spear and surges forward, poisoning foes & stacking +1 Rootguard.',
    lore: 'Rootdeep Codex: "Swift as wind through ironwood boughs."',
  },
  spore_volley: {
    id: 'spore_volley', faction: 'Terra', classId: 'forest_warden',
    name: 'Spore Volley', short: 'Spores',
    tcgType: 'Terra Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'gale_spear',
    icon: '🍄', kind: 'spore_volley', range: '12y Cone', rangeYards: 12,
    cost: 15, baseCd: 6.5, castTime: 0.9, color: '#a3e635',
    desc: 'Warden Exclusive Rite: Unleashes toxic Rootdeep spores dealing nature damage over time & healing self.',
    lore: 'Rootdeep Codex: "Even beauty in the Orchard bears a venomous thorn."',
  },
  pack_hunt: {
    id: 'pack_hunt', faction: 'Terra', classId: 'forest_warden',
    name: 'Pack Hunt', short: 'PackHunt',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'spore_volley',
    icon: '🐺', kind: 'pack_hunt', range: '12y Rush', rangeYards: 12,
    cost: 0, baseCd: 9.0, castTime: 0, color: '#86efac',
    desc: 'Warden Exclusive Flash: Unleashes phantom Ironwood Wolves shredding enemies in 10y, +35% speed & +20 Glimmer!',
    lore: 'Rootdeep Codex: "The pack runs wherever the Warden points the spear."',
  },
  tempest_of_thorns: {
    id: 'tempest_of_thorns', faction: 'Terra', classId: 'forest_warden',
    name: 'Tempest of Thorns', short: 'Tempest',
    tcgType: 'Terra Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'pack_hunt',
    icon: '🌪️', kind: 'tempest_thorns', range: '14y Whirl', rangeYards: 14,
    cost: 35, baseCd: 15.0, castTime: 1.3, color: '#22c55e',
    desc: 'Warden Apex Rite: Whirlwind razor-leaf storm cleaving all enemies in 14y for devastating nature CRIT damage!',
    lore: 'Rootdeep Codex: "Every leaf becomes a blade in the emerald gale."',
  },

  // --- STONEKIN ELDER (Colossal Tank / Seismic Control) ---
  seismic_taunt: {
    id: 'seismic_taunt', faction: 'Terra', classId: 'stonekin_elder',
    name: 'Seismic Taunt', short: 'Seismic',
    tcgType: 'Terra Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'tectonic_slam',
    icon: '🪨', kind: 'seismic_taunt', range: '12y Taunt', rangeYards: 12,
    cost: 0, baseCd: 6.0, castTime: 0, color: '#4ade80',
    desc: 'Elder Exclusive Flash: Earth-tremor challenge forcing 3.5x Taunt threat in 12y, weakening foes & +1 Rootguard!',
    lore: 'Elder Codex: "Strike the bedrock, and every beast turns toward the mountain."',
  },
  monolith_wall: {
    id: 'monolith_wall', faction: 'Terra', classId: 'stonekin_elder',
    name: 'Monolith Bulwark', short: 'Monolith',
    tcgType: 'Terra Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'seismic_taunt',
    icon: '🗿', kind: 'monolith_wall', range: 'Self/10y', rangeYards: 10,
    cost: 15, baseCd: 10.0, castTime: 0.85, color: '#84cc16',
    desc: 'Elder Exclusive Rite: Encases Elder in living granite (+30 + 4×Bastion Shield & 50% Thornbark reflect for 7s)!',
    lore: 'Elder Codex: "Shatter your blade upon the unyielding cliff."',
  },
  earthen_grasp: {
    id: 'earthen_grasp', faction: 'Terra', classId: 'stonekin_elder',
    name: 'Earthen Grasp', short: 'Grasp',
    tcgType: 'Terra Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'monolith_wall',
    icon: '🌿', kind: 'earthen_grasp', range: '11y Pull', rangeYards: 11,
    cost: 20, baseCd: 9.5, castTime: 1.0, color: '#16a34a',
    desc: 'Elder Exclusive Rite: Stony roots erupt to drag all foes in 11y to your feet and stun/snare for 2.5s!',
    lore: 'Elder Codex: "The deep earth pulls all trespassers down."',
  },
  tectonic_cataclysm: {
    id: 'tectonic_cataclysm', faction: 'Terra', classId: 'stonekin_elder',
    name: 'Tectonic Cataclysm', short: 'Cataclysm',
    tcgType: 'Terra Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'earthen_grasp',
    icon: '🌋', kind: 'tectonic_cataclysm', range: '15y Quake', rangeYards: 15,
    cost: 35, baseCd: 16.0, castTime: 1.4, color: '#22c55e',
    desc: 'Elder Apex Rite: Triple-shockwave seismic slam dealing colossal earth damage & fortifying +120 Shield!',
    lore: 'Elder Codex: "When the Stonekin strikes in wrath, continents split."',
  },

  // --- CHRONOMANCER SAGE (Time Control / Cooldown & Echo Maestro) ---
  temporal_anchor: {
    id: 'temporal_anchor', faction: 'Aether', classId: 'chronomancer_sage',
    name: 'Temporal Anchor', short: 'Anchor',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'reality_fracture',
    icon: '⚓', kind: 'temporal_anchor', range: 'Self/Recall', rangeYards: 16,
    cost: 0, baseCd: 8.5, castTime: 0, color: '#38bdf8',
    desc: 'Chronomancer Exclusive Flash: Sets a Time Anchor (6s); cast again to rewind position, heal 30% HP & reset Flash CDs!',
    lore: 'Mirrorgate Codex: "Always keep a foothold three seconds in the past."',
  },
  sands_of_lethargy: {
    id: 'sands_of_lethargy', faction: 'Aether', classId: 'chronomancer_sage',
    name: 'Sands of Lethargy', short: 'TimeField',
    tcgType: 'Aether Rite', tree: 'rites', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'temporal_anchor',
    icon: '⌛', kind: 'ground_zone', zoneType: 'gravity', range: '9.5y Field', rangeYards: 9.5,
    cost: 15, baseCd: 8.0, castTime: 0.95, color: '#7dd3fc',
    desc: 'Chronomancer Exclusive Rite: Creates a 6s chrono-dilation field slowing enemies by 55% & ticking arcane DMG.',
    lore: 'Mirrorgate Codex: "To the trapped, each heartbeat stretches into an hour."',
  },
  echoing_paradox: {
    id: 'echoing_paradox', faction: 'Aether', classId: 'chronomancer_sage',
    name: 'Echoing Paradox', short: 'Paradox',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'sands_of_lethargy',
    icon: '🪞', kind: 'echoing_paradox', range: '22y Echo', rangeYards: 22,
    cost: 15, baseCd: 7.5, castTime: 0, color: '#e0f2fe',
    desc: 'Chronomancer Exclusive Flash: Fires an instant arcane echo beam, primes guaranteed Spell Echo & shaves 2s off all CDs!',
    lore: 'Mirrorgate Codex: "Borrow tomorrow\'s spell to finish today\'s battle."',
  },
  fractured_timeline: {
    id: 'fractured_timeline', faction: 'Aether', classId: 'chronomancer_sage',
    name: 'Fractured Timeline', short: 'Timeline',
    tcgType: 'Aether Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'echoing_paradox',
    icon: '🕰️', kind: 'fractured_timeline', range: '20y Barrage', rangeYards: 20,
    cost: 35, baseCd: 15.5, castTime: 1.35, color: '#38bdf8',
    desc: 'Chronomancer Apex Rite: Unleashes 3 staggered temporal echo blasts from alternate timelines!',
    lore: 'Mirrorgate Codex: "Three versions of you cast as one."',
  },

  // --- NEXUS WEAVER (Elemental Starfall Battlemage / Shatter Combo) ---
  glacial_spike: {
    id: 'glacial_spike', faction: 'Aether', classId: 'nexus_weaver',
    name: 'Glacial Spike', short: 'Glacial',
    tcgType: 'Aether Rite', tree: 'rites', tier: 2, reqLevel: 3, maxRank: 5, prereq: 'reality_fracture',
    icon: '🧊', kind: 'glacial_spike', projType: 'aether_orb', range: '24y Lance', rangeYards: 24,
    cost: 0, baseCd: 3.6, castTime: 0.8, color: '#bae6fd',
    desc: 'Weaver Exclusive Rite: Fires a star-ice spear that freezes target for 2.2s and primes Prismatic Shatter!',
    lore: 'Mirrorgate Codex: "Starlight cooled to absolute stillness."',
  },
  arcane_tether: {
    id: 'arcane_tether', faction: 'Aether', classId: 'nexus_weaver',
    name: 'Arcane Tether', short: 'Tether',
    tcgType: 'Aether Flash', tree: 'flashes', tier: 4, reqLevel: 12, maxRank: 5, prereq: 'glacial_spike',
    icon: '⚡', kind: 'arcane_tether', range: '18y Chain', rangeYards: 18,
    cost: 0, baseCd: 6.0, castTime: 0, color: '#38bdf8',
    desc: 'Weaver Exclusive Flash: Lightning-tethers nearby foes, stunning for 1.5s & restoring +25 Glimmer!',
    lore: 'Mirrorgate Codex: "Bind their soul to the leyline current."',
  },
  meteor_constellation: {
    id: 'meteor_constellation', faction: 'Aether', classId: 'nexus_weaver',
    name: 'Meteor Constellation', short: 'Meteors',
    tcgType: 'Aether Rite', tree: 'rites', tier: 5, reqLevel: 18, maxRank: 5, prereq: 'arcane_tether',
    icon: '☄️', kind: 'meteor_constellation', range: '16y Starfall', rangeYards: 16,
    cost: 25, baseCd: 9.0, castTime: 1.1, color: '#7dd3fc',
    desc: 'Weaver Exclusive Rite: Calls down cascading star-meteors (+45% Shatter bonus vs frozen targets)!',
    lore: 'Mirrorgate Codex: "Pull the heavens down upon fractured stone."',
  },
  astral_supernova: {
    id: 'astral_supernova', faction: 'Aether', classId: 'nexus_weaver',
    name: 'Astral Supernova', short: 'Supernova',
    tcgType: 'Aether Rite', tree: 'rites', tier: 7, reqLevel: 30, maxRank: 5, prereq: 'meteor_constellation',
    icon: '✨', kind: 'astral_supernova', range: '15y Shatter', rangeYards: 15,
    cost: 35, baseCd: 15.5, castTime: 1.4, color: '#e0f2fe',
    desc: 'Weaver Apex Rite: Pulls enemies into a prismatic core, freezing & shattering for colossal Arcane CRIT damage!',
    lore: 'Mirrorgate Codex: "Witness the birth and shatter of a star."',
  },

  // === CORE RULE ===
  harvest: {
    id: 'harvest', faction: 'All', name: 'Ready Glimmer Node', short: 'Glimmer',
    tcgType: 'TCG Core Rule', tree: 'core', tier: 1, reqLevel: 1, maxRank: 1, prereq: null,
    icon: '🔮', kind: 'harvest', range: '6.5y', rangeYards: 6.5,
    cost: 0, baseCd: 0, castTime: 0.6, color: '#c084fc',
    desc: 'Draws raw leyline energy from a Glimmer Node (+18+ Glimmer & +3 XP; Grand Fonts give 60+ Glimmer & +7 XP).',
    lore: 'Summoners channel Glimmer Nodes to fuel Rites and Flashes.',
  },
};

// Backwards-compatible slot map helper
export function getSlotAbilitySpec(loadout, slot) {
  if (slot === 'harvest') return ABILITIES_CATALOG.harvest;
  const abilId = loadout?.[slot] ?? loadout?.[String(slot)];
  return abilId ? ABILITIES_CATALOG[abilId] || null : null;
}

export function getAbilityRank(prog, abilityId) {
  if (!abilityId) return 0;
  if (abilityId === 'harvest') return 1;
  const spec = ABILITIES_CATALOG[abilityId];
  if (!spec) return 0;
  const r = prog?.skills?.[abilityId];
  if (r !== undefined && r !== null) {
    const rankVal = Math.max(0, Math.min(spec.maxRank || 5, Math.floor(Number(r) || 0)));
    // Tier 1 starter abilities are always at least Rank 1 so players are never soft-locked
    if ((spec.tier || 1) === 1) return Math.max(1, rankVal);
    return rankVal;
  }
  // Check prog?.ranks?.[abilityId]
  if (prog?.ranks?.[abilityId] !== undefined && prog?.ranks?.[abilityId] !== null) {
    const rankVal = Math.max(0, Math.min(spec.maxRank || 5, Math.floor(Number(prog.ranks[abilityId]) || 0)));
    if ((spec.tier || 1) === 1) return Math.max(1, rankVal);
    return rankVal;
  }
  // Tier 1 basic attacks (whisper_of_the_void, flare_strike, tectonic_slam, reality_fracture) default to Rank 1
  if ((spec.tier || 1) === 1) return 1;
  return 0;
}

export function sanitizeProgressionSkills(prog, classId = null) {
  if (!prog || typeof prog !== 'object') return prog;
  if (!prog.skills || typeof prog.skills !== 'object') prog.skills = {};
  const charLevel = Math.max(1, Math.floor(Number(prog.level) || 1));

  // 1. Strip unknown abilities, mismatched classId abilities, and over-level skills
  for (const [abId, rawRank] of Object.entries(prog.skills)) {
    const spec = ABILITIES_CATALOG[abId];
    if (!spec) {
      delete prog.skills[abId];
      continue;
    }
    if (classId && spec.classId && spec.classId !== classId) {
      delete prog.skills[abId];
      continue;
    }
    const rank = Math.max(0, Math.min(spec.maxRank || 5, Math.floor(Number(rawRank) || 0)));
    if ((spec.tier || 1) === 1) {
      prog.skills[abId] = Math.max(1, rank);
    } else if (charLevel < (spec.reqLevel || 1) || rank <= 0) {
      delete prog.skills[abId];
    } else {
      prog.skills[abId] = rank;
    }
  }

  // 2. Enforce prerequisite chain from Tier 2 -> Tier 7
  const nonStarters = Object.keys(prog.skills)
    .map((id) => ABILITIES_CATALOG[id])
    .filter((s) => s && (s.tier || 1) > 1)
    .sort((a, b) => (a.tier || 1) - (b.tier || 1));

  for (const spec of nonStarters) {
    if (spec.prereq) {
      const preSpec = ABILITIES_CATALOG[spec.prereq];
      const preRank = (preSpec?.tier || 1) === 1 ? Math.max(1, prog.skills[spec.prereq] || 1) : (prog.skills[spec.prereq] || 0);
      if (preRank < 1) {
        delete prog.skills[spec.prereq ? spec.id : ''];
      }
    }
  }

  // 3. Enforce total skill point budget (charLevel total points earned across levels 1..charLevel)
  const unspent = Math.max(0, Math.floor(Number(prog.skillPoints) || 0));
  const maxSpent = Math.max(0, charLevel - unspent);

  const calcSpent = () => {
    let total = 0;
    for (const [abId, r] of Object.entries(prog.skills)) {
      const s = ABILITIES_CATALOG[abId];
      if (!s) continue;
      total += (s.tier || 1) === 1 ? Math.max(0, r - 1) : Math.max(0, r);
    }
    return total;
  };

  if (calcSpent() > maxSpent) {
    const candidates = Object.keys(prog.skills)
      .reverse()
      .map((id) => ABILITIES_CATALOG[id])
      .filter(Boolean)
      .sort((a, b) => (b.tier || 1) - (a.tier || 1) || (b.reqLevel || 1) - (a.reqLevel || 1));

    for (const spec of candidates) {
      while (calcSpent() > maxSpent) {
        const cur = prog.skills[spec.id] || 0;
        const minAllowed = (spec.tier || 1) === 1 ? 1 : 0;
        if (cur <= minAllowed) break;
        if (cur - 1 <= 0 && minAllowed === 0) {
          delete prog.skills[spec.id];
          break;
        } else {
          prog.skills[spec.id] = cur - 1;
        }
      }
      if (calcSpent() <= maxSpent) break;
    }
  }

  return prog;
}

export function canUpgradeAbility(prog, abilityId, classId = null) {
  const spec = ABILITIES_CATALOG[abilityId];
  if (!spec) return false;
  if (classId && spec.classId && spec.classId !== classId) return false;
  const curRank = getAbilityRank(prog, abilityId);
  if (curRank >= (spec.maxRank || 5)) return false;
  if ((prog?.skillPoints || 0) <= 0) return false;
  if ((prog?.level || 1) < (spec.reqLevel || 1)) return false;
  if (spec.prereq) {
    const prereqRank = getAbilityRank(prog, spec.prereq);
    if (prereqRank < 1) return false;
  }
  return true;
}

export function shouldAutoRemasterRespec(prog) {
  if (!prog || typeof prog !== 'object' || prog.remasterRespecV2) return false;
  const skills = prog.skills || {};
  const hasPreRemasterInvestments = Object.entries(skills).some(([id, rank]) => {
    const spec = ABILITIES_CATALOG[id];
    if (!spec || spec.classId) return false;
    return (spec.tier || 1) > 1 ? Number(rank) > 0 : Number(rank) > 1;
  });
  const hasClassSpecSkill = Object.keys(skills).some((id) => Boolean(ABILITIES_CATALOG[id]?.classId));
  return hasPreRemasterInvestments && !hasClassSpecSkill;
}

export function respecCharacterSkills(prog) {
  if (!prog || typeof prog !== 'object') return { respecced: false, refunded: 0, skillPoints: 1 };
  const charLevel = Math.max(1, Math.floor(Number(prog.level) || 1));
  const prevUnspent = Math.max(0, Math.floor(Number(prog.skillPoints) || 0));
  prog.skills = {
    flare_strike: 1,
    whisper_of_the_void: 1,
    tectonic_slam: 1,
    reality_fracture: 1,
  };
  prog.ranks = { 1: 1, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
  prog.skillPoints = charLevel;
  prog.remasterRespecV2 = true;
  return {
    respecced: true,
    refunded: Math.max(0, charLevel - prevUnspent),
    skillPoints: prog.skillPoints,
  };
}

export function getRankStats(ability, rank = 1) {
  const r = Math.max(1, Math.min(5, rank || 1));
  const rankBonusDmg = (r - 1) * 3;
  const rankCdReduction = (r - 1) * 0.35;
  const effectiveBaseCd = Math.max(0.4, (ability?.baseCd || 1) - rankCdReduction);
  const rankShield = (r - 1) * 5;
  const rankHeal = (r - 1) * 4;
  return {
    rank: r,
    bonusDmg: rankBonusDmg,
    effectiveBaseCd,
    bonusShield: rankShield,
    bonusHeal: rankHeal,
  };
}
