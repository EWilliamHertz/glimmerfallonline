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

export function canUpgradeAbility(prog, abilityId) {
  const spec = ABILITIES_CATALOG[abilityId];
  if (!spec) return false;
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
