// ==========================================
// GlimmerFall Online — Continental World Atlas Regions Data
// ==========================================

  const WORLD_ATLAS_REGIONS = {
    SANCTUARY_HUB: {
      id: 'SANCTUARY_HUB',
      name: 'Sanctuary Haven',
      sub: 'Awakening Sanctum & Continental Axis',
      level: 'Lv. 1 – 5',
      dangerTag: 'SANCTUARY HAVEN',
      color: '#38bdf8',
      borderColor: '#7dd3fc',
      faction: 'Order of the Sunspire (Neutral Sanctuary)',
      desc: 'The peaceful haven where Summoner-Knights awaken from stasis. Connects the four outer elemental domains and leads North through the Aether Spire into the high-level continental frontier.',
      gridPos: { col: 1, row: 4 },
      neighbors: {
        north: 'AETHER_SPIRE',
        south: 'TERRA_ORCHARD',
        west: 'SOLARI_CITADEL',
        east: 'UMBRI_UNDERCITY'
      },
      landmarks: [
        { x: 63, y: 41, icon: '🏛️', name: 'The Grand AetherVault Bank', sub: 'AetherVault Depository (City Bank)', desc: 'Neoclassical stone bank building. Speak to Banker Trove-Master Orin at the teller booth to manage your cross-realm item vault.' },
        { x: 50, y: 49, icon: '⛲', name: 'Grand Sanctuary Fountain', sub: 'Central Plaza', desc: 'Tiered stone water fountain at the heart of the metropolis.' },
        { x: 37, y: 41, icon: '⚖️', name: 'Continental Market Square', sub: 'Merchant Quarter', desc: 'Canopied stalls offering potions, provisions, and curios.' },
        { x: 55, y: 65, icon: '🛡️', name: 'Herald Lyra', sub: 'Sunspire Mentor', desc: 'Awakening guide and primary quest mentor.' },
        { x: 44, y: 36, icon: '⚔️', name: 'Commander Valerius', sub: 'Sunspire Warlord', desc: 'Frontline commander directing border defense.' },
        { x: 50, y: 52, icon: '🎯', name: 'Training Grounds', sub: 'Sanctuary Dummy', desc: 'Training post for honing Rites and Flashes.' },
        { x: 36, y: 53, icon: '💎', name: 'Awakening Glimmer Font', sub: 'Leyline Font [E]', desc: 'Channel with [E] to replenish energy.' },
        { x: 64, y: 53, icon: '💎', name: 'East Glimmer Font', sub: 'Leyline Font [E]', desc: 'Channel with [E] to replenish energy.' },
        { x: 50, y: 8, icon: '▲', name: 'Astral Waygate', sub: 'To Aether Spire [North]', desc: 'Walk North across the Astral threshold.' },
        { x: 50, y: 92, icon: '▼', name: 'Ironwood Arch', sub: 'To Terra Wilds [South]', desc: 'Walk South into the Ironwood Wilds.' },
        { x: 8, y: 50, icon: '◀', name: 'Sunspire Arch', sub: 'To Solari Citadel [West]', desc: 'Walk West into the Golden Citadel.' },
        { x: 92, y: 50, icon: '▶', name: 'Sepulcher Gate', sub: 'To Umbri Undercity [East]', desc: 'Walk East into the Duskveil Bog.' }
      ],
      entities: [
        { name: 'Training Dummy', type: 'Neutral Target', hp: '35 HP', desc: 'Safe target for honing Rites and Flashes.' },
        { name: 'Glimmer Leyline Node', type: 'Harvest Node', hp: '3 Charges', desc: 'Channel with [E] to restore Solar Charge.' },
        { name: 'Herald Lyra', type: 'Sunspire Herald', hp: 'Immortal', desc: 'Awakening mentor & primary quest giver.' },
        { name: 'Commander Valerius', type: 'Vanguard Warlord', hp: 'Immortal', desc: 'Frontline commander directing border defense.' }
      ],
      objectives: 'Tutorial Rites, Glimmer Harvesting, Gear customization [I], Squad recruitment [O].',
      travel: 'You awaken here! Gateways lead North to Aether Spire, West to Solari Citadel, East to Umbri Undercity, and South to Terra Orchard.'
    },
    SOLARI_CITADEL: {
      id: 'SOLARI_CITADEL',
      name: 'Solari Sun-Citadel',
      sub: 'Western Radiant Bastion',
      level: 'Lv. 6 – 15',
      dangerTag: 'SOLARI REALM',
      color: '#facc15',
      borderColor: '#fde047',
      faction: '☀️ Solari (The Light)',
      desc: 'Towering golden parapets and solar obelisks basking in perpetual dawn. Daystar paladins channel burning solar wrath and unbreakable bulwark shields.',
      gridPos: { col: 0, row: 4 },
      neighbors: {
        north: 'STARFALL_CRATER',
        south: 'SOLAR_HIGHLANDS',
        west: null,
        east: 'SANCTUARY_HUB'
      },
      landmarks: [
        { x: 62, y: 40, icon: '🏛️', name: 'Solari Citadel Depository', sub: 'Citadel Bank', desc: 'Neoclassical depository bank. Speak to the Solari Vault-Master to access your vault.' },
        { x: 50, y: 38, icon: '☀️', name: 'Pyremaster Lucian', sub: 'Solari Emissary', desc: 'Master of Sun Aegis and Daystar rites.' },
        { x: 34, y: 60, icon: '🛡️', name: 'Solari Sentinels', sub: 'Lv.6 Radiant Guards', desc: 'Golden armored paladins with Daystar strikes.' },
        { x: 66, y: 60, icon: '💎', name: 'Dawnforged Monolith', sub: 'Sunspire Font [E]', desc: 'Power font channeling holy radiance.' },
        { x: 92, y: 50, icon: '▶', name: 'Eastern Gate', sub: 'To Sanctuary Haven [East]', desc: 'Walk East into Sanctuary Haven.' }
      ],
      entities: [
        { name: 'Solari Sentinels', type: 'Hostile Mob', hp: '120 HP', desc: 'Golden armored guards with Daystar strikes.' },
        { name: 'Pyremaster Lucian', type: 'Solari Emissary', hp: 'Immortal', desc: 'Master of Sun Aegis and Daystar rites.' },
        { name: 'Dawnforged Monolith', type: 'Faction Shard', hp: 'Leyline', desc: 'Sunspire power font channeling holy radiance.' }
      ],
      objectives: 'Radiant Bulwark training, Solari faction allegiance, Sunken Vault entrance.',
      travel: 'From Sanctuary Haven, walk West through the Sunspire Archway into the Golden Citadel.'
    },
    UMBRI_UNDERCITY: {
      id: 'UMBRI_UNDERCITY',
      name: 'Umbri Sepulcher Undercity',
      sub: 'Eastern Shadow Fens & Catacombs',
      level: 'Lv. 6 – 15',
      dangerTag: 'UMBRI REALM',
      color: '#c084fc',
      borderColor: '#e879f9',
      faction: '🌑 Umbri (The Shadow)',
      desc: 'Sunken mausoleums shrouded in abyssal mist and void whispers. Duskveil assassins stalk the shadows, draining lifeforce from unsuspecting wanderers.',
      gridPos: { col: 2, row: 4 },
      neighbors: {
        north: null,
        south: 'CORAL_COAST',
        west: 'SANCTUARY_HUB',
        east: null
      },
      landmarks: [
        { x: 50, y: 38, icon: '🌑', name: 'Wraithmother Vespera', sub: 'Shadow Mystic', desc: 'Mistress of Abyssal Shroud and Soul Tithes.' },
        { x: 34, y: 60, icon: '🌫️', name: 'Dusk Fiends', sub: 'Lv.6 Shadow Stalkers', desc: 'Stealthed ambushers with life drain strikes.' },
        { x: 66, y: 60, icon: '💎', name: 'Abyssal Wellspring', sub: 'Void Font [E]', desc: 'Void font empowering shadow leach affinity.' },
        { x: 8, y: 50, icon: '◀', name: 'Western Gate', sub: 'To Sanctuary Haven [West]', desc: 'Walk West into Sanctuary Haven.' }
      ],
      entities: [
        { name: 'Dusk Fiends & Shadow Stalkers', type: 'Hostile Mob', hp: '110 HP', desc: 'Stealthed ambushers with life drain strikes.' },
        { name: 'Wraithmother Vespera', type: 'Shadow Mystic', hp: 'Immortal', desc: 'Mistress of Abyssal Shroud and Soul Tithes.' },
        { name: 'Abyssal Wellspring', type: 'Faction Shard', hp: 'Leyline', desc: 'Void font empowering shadow leach affinity.' }
      ],
      objectives: 'Shadow Labyrinth delve, Void Leach mastery, Umbri stealth training.',
      travel: 'From Sanctuary Haven, walk East past the Sepulcher braziers into the Undercity.'
    },
    TERRA_ORCHARD: {
      id: 'TERRA_ORCHARD',
      name: 'Terra Ironwood Wilds',
      sub: 'Southern Primal Canopies',
      level: 'Lv. 6 – 15',
      dangerTag: 'TERRA REALM',
      color: '#4ade80',
      borderColor: '#86efac',
      faction: '🌿 Terra (The Earth)',
      desc: 'Colossal ironwood groves tangled with thornbark and living moss. Stone behemoths and treants safeguard the wild roots from void corruption.',
      gridPos: { col: 1, row: 5 },
      neighbors: {
        north: 'SANCTUARY_HUB',
        south: 'IRONWOOD_TIMBERLANDS',
        west: 'SOLAR_HIGHLANDS',
        east: 'CORAL_COAST'
      },
      landmarks: [
        { x: 50, y: 40, icon: '🌿', name: 'Elder Druid Sylvanus', sub: 'Primal Shaman', desc: 'Teacher of Rooted Bastion and Bramble Reversals.' },
        { x: 34, y: 60, icon: '🌲', name: 'Ironwood Treants', sub: 'Lv.6 Primal Guardians', desc: 'High armor beasts reflecting melee damage via Thorns.' },
        { x: 66, y: 60, icon: '💎', name: 'Verdant Heartstone', sub: 'Primal Font [E]', desc: 'Primal nexus crystal boosting maximum health.' },
        { x: 50, y: 8, icon: '▲', name: 'Northern Archway', sub: 'To Sanctuary Haven [North]', desc: 'Walk North into Sanctuary Haven.' }
      ],
      entities: [
        { name: 'Ironwood Treants & Bramble Hounds', type: 'Hostile Mob', hp: '160 HP', desc: 'High armor beasts reflecting melee damage via Thorns.' },
        { name: 'Elder Druid Sylvanus', type: 'Primal Shaman', hp: 'Immortal', desc: 'Teacher of Rooted Bastion and Bramble Reversals.' },
        { name: 'Verdant Heartstone', type: 'Faction Shard', hp: 'Leyline', desc: 'Primal nexus crystal boosting maximum health.' }
      ],
      objectives: 'Overgrowth Sanctuary delve, Thornbark defense, Terra Colossus rites.',
      travel: 'From Sanctuary Haven, walk South through the Orchard archway into the Ironwood Wilds.'
    },
    AETHER_SPIRE: {
      id: 'AETHER_SPIRE',
      name: 'Aether Astral Spire',
      sub: 'Northern Floating Terraces',
      level: 'Lv. 6 – 15',
      dangerTag: 'AETHER REALM',
      color: '#38bdf8',
      borderColor: '#7dd3fc',
      faction: '🔮 Aether (The Magic)',
      desc: 'Glacial starlight terraces suspended over the astral void. Time-bending scholars harness chronomancy to fracture reality and slow enemy actions. The northern threshold leads to the Forgotten Ruins.',
      gridPos: { col: 1, row: 3 },
      neighbors: {
        north: 'NEXUS_FORGOTTEN_RUINS',
        south: 'SANCTUARY_HUB',
        west: null,
        east: null
      },
      landmarks: [
        { x: 50, y: 35, icon: '🔮', name: 'Archon of the Continuum', sub: '★ Lv.6 Mirrorgate Boss', desc: 'Temporal master casting Frost Nova and slow pulses.' },
        { x: 30, y: 55, icon: '✨', name: 'Chrono Anomalies', sub: 'Lv.3 Aether Construct', desc: 'Hostile astral wisps.' },
        { x: 70, y: 55, icon: '💎', name: 'Mirrorgate Star Font', sub: 'Glimmer Font [E]', desc: 'High-yield astral glimmer node.' },
        { x: 50, y: 72, icon: '👤', name: 'Astromancer Kaelen', sub: 'Stargazer NPC', desc: 'Scholar of ancient continuum leylines.' },
        { x: 50, y: 8, icon: '▲', name: 'Northern Ruin Threshold', sub: 'To Forgotten Ruins [North]', desc: 'Walk North into the First Nexus Ruins.' },
        { x: 50, y: 92, icon: '▼', name: 'Sanctuary Gate', sub: 'To Sanctuary Haven [South]', desc: 'Walk South back to Sanctuary.' }
      ],
      entities: [
        { name: 'Astral Wisps & Starforged Golems', type: 'Hostile Mob', hp: '105 HP', desc: 'Casts Frost Nova chilling and slowing players.' },
        { name: 'Chronos Sage Zephyr', type: 'Time Weaver', hp: 'Immortal', desc: 'Master of Chrono Warp and Temporal Apotheosis.' },
        { name: 'Chrono Crystal Font', type: 'Faction Shard', hp: 'Leyline', desc: 'Astral prism accelerating cooldowns and cast speed.' }
      ],
      objectives: 'Chronomancy training, Aether Spire trials, Northern gateway to the Forgotten Ruins.',
      travel: 'From Sanctuary Haven, walk North through the Astral Gate into Mirrorgate Spire. Continue walking North to enter the Forgotten Ruins.'
    },
    NEXUS_FORGOTTEN_RUINS: {
      id: 'NEXUS_FORGOTTEN_RUINS',
      name: 'Forgotten First Nexus Ruins',
      sub: 'Sunken Leyline Plateau',
      level: 'Lv. 15 – 25',
      dangerTag: 'CONTESTED RUINS',
      color: '#818cf8',
      borderColor: '#a5b4fc',
      faction: 'Ancient Leyline Keepers (Contested)',
      desc: 'The sunken site where the First Nexus shattered centuries ago. Corrupted stalkers roam the pillars, guarding ancient quadrant runestones and the gateway to the Continental Caldera.',
      gridPos: { col: 1, row: 2 },
      neighbors: {
        north: 'NEXUS_WARZONE',
        south: 'AETHER_SPIRE',
        west: 'STARFALL_CRATER',
        east: null
      },
      landmarks: [
        { x: 50, y: 30, icon: '🗿', name: 'The Prismatic Golem', sub: '★ Lv.7 First Nexus Guardian', desc: 'Ancient megalith guarding quadrant runestones.' },
        { x: 50, y: 68, icon: '📜', name: 'Atlas the Cartographer', sub: 'Keystone Seeker NPC', desc: 'Ancient surveyor mapping continental leylines.' },
        { x: 30, y: 50, icon: '👾', name: 'Corrupted Stalkers', sub: 'Lv.4 Keystone Constructs', desc: 'Lingering void constructs around ruined pillars.' },
        { x: 70, y: 50, icon: '💎', name: 'Prismatic Leyline Node', sub: 'Glimmer Font [E]', desc: 'Omni-resonance energy node.' },
        { x: 50, y: 8, icon: '▲', name: 'Continental Boundary Gate', sub: 'To Continental Caldera [North]', desc: 'Walk North across the continental threshold.' },
        { x: 50, y: 92, icon: '▼', name: 'Aether Archway', sub: 'To Aether Spire [South]', desc: 'Walk South back into Aether Spire.' }
      ],
      entities: [
        { name: 'Corrupted Ruin Stalkers', type: 'Hostile Mob', hp: '220 HP', desc: 'Void spikes & lingering ruin curse.' },
        { name: 'Atlas the Cartographer', type: 'Keystone Seeker', hp: 'Immortal', desc: 'Ancient surveyor with deep knowledge of the leylines.' },
        { name: 'First Nexus Altar', type: 'Ancient Relic', hp: 'Indestructible', desc: 'Central altar anchoring continental transitions.' }
      ],
      objectives: 'Ruin Horrors quest, Cartographer research, Gateway North to Continental Caldera.',
      travel: 'From Sanctuary Haven, walk North into Aether Spire, then continue North through the threshold into the Forgotten Ruins.'
    },
    NEXUS_WARZONE: {
      id: 'NEXUS_WARZONE',
      name: 'The Continental Nexus Caldera',
      sub: 'Continental Caldera • Open Warzone',
      level: 'Lv. 30+',
      dangerTag: 'OPEN WARZONE • HIGH-LEVEL PvPvE',
      color: '#f97316',
      borderColor: '#fdba74',
      faction: '⚔️ Contested All-Faction Warzone',
      desc: 'A massive 4800×3600 continental warzone where rival factions fight for domination across the Open World!',
      gridPos: { col: 1, row: 1 },
      neighbors: {
        north: 'CELESTIAL_ASCENT',
        south: 'NEXUS_FORGOTTEN_RUINS',
        west: null,
        east: 'ABYSSAL_RIFT'
      },
      landmarks: [
        { x: 50, y: 45, icon: '🌋', name: 'Shattered Nexus Shard', sub: 'Continental Siege Objective', desc: '30-minute continental siege shard granting +250 XP.' },
        { x: 25, y: 30, icon: '⚔️', name: 'Terra Forest Outpost', sub: '300 HP Strategic Outpost', desc: 'Green faction capture point.' },
        { x: 75, y: 30, icon: '⚔️', name: 'Umbri Shadow Outpost', sub: '300 HP Strategic Outpost', desc: 'Purple faction capture point.' },
        { x: 25, y: 70, icon: '⚔️', name: 'Solari Radiant Outpost', sub: '300 HP Strategic Outpost', desc: 'Gold faction capture point.' },
        { x: 75, y: 70, icon: '⚔️', name: 'Aether Astral Outpost', sub: '300 HP Strategic Outpost', desc: 'Cyan faction capture point.' },
        { x: 50, y: 80, icon: '🛡️', name: 'Commander Valerius', sub: 'Vanguard Outpost Commander', desc: 'Directs frontline continental bounties.' },
        { x: 50, y: 8, icon: '▲', name: 'Ascent Mountain Colonnade', sub: 'To Celestial Titan Summit [North]', desc: 'Walk North through the Ascent Gate.' },
        { x: 50, y: 92, icon: '▼', name: 'Continental Boundary Gate', sub: 'To Forgotten Ruins [South]', desc: 'Walk South back to Forgotten Ruins.' }
      ],
      entities: [
        { name: 'Caldera Void Fiends', type: 'Caldera Mob', hp: '340 – 420 HP', desc: 'Vicious stalkers dealing 24-28 damage.' },
        { name: 'Continental Faction Bosses', type: 'World Bosses', hp: '1150 – 1250 HP', desc: 'Elite warlords casting faction apex abilities.' },
        { name: '4 Outpost Nexuses', type: 'Strategic Outposts', hp: '300 HP each', desc: 'Capture points for Solari, Umbri, Terra, and Aether.' },
        { name: 'Shattered Nexus Shard', type: 'Siege Objective', hp: '850 HP', desc: '30-minute continental siege shard granting +250 XP.' },
        { name: 'Commander Valerius', type: 'Sunspire Warlord', hp: 'Immortal', desc: 'Vanguard post commander offering frontline bounties.' }
      ],
      objectives: 'Continental Faction Siege, Outpost control, Ancient Paragon Caches, Gateway North to Celestial Titan Summit.',
      travel: 'Walk North from Sanctuary through Aether Spire and the Forgotten Ruins into the Caldera.'
    },
    CELESTIAL_ASCENT: {
      id: 'CELESTIAL_ASCENT',
      name: 'Celestial Ascent & Titan Summit',
      sub: 'Empyrean Titan Keep & Throne',
      level: 'Lv. 35+',
      dangerTag: 'TITAN APEX RAID',
      color: '#fde047',
      borderColor: '#ffffff',
      faction: 'Empyrean Titan Keepers',
      desc: 'Sacred starlight terraces towering above the continental clouds. The highest peak in Glimmerfall, where Grand Arbiter Aurelia guards the throne of the Empyrean Sovereign.',
      gridPos: { col: 1, row: 0 },
      neighbors: {
        north: null,
        south: 'NEXUS_WARZONE',
        west: null,
        east: 'CHRONOCORE_CITADEL'
      },
      landmarks: [
        { x: 50, y: 35, icon: '👑', name: 'AURELIUS THE SOVEREIGN', sub: '★ Lv.35 World Raid Boss', desc: '3200 HP Apex Sovereign dealing 65 holy DMG. Drops Crown of Dawn!' },
        { x: 50, y: 65, icon: '✨', name: 'Grand Arbiter Aurelia', sub: 'Empyrean Keeper NPC', desc: 'Guardian of the Morning Star Colonnade.' },
        { x: 28, y: 50, icon: '🏛️', name: 'Morning Star Colonnade', sub: 'Ancient Starlight Terrace', desc: 'Towering colonnades above the clouds.' },
        { x: 72, y: 50, icon: '💎', name: 'Apex Glimmer Font', sub: 'Titan Glimmer Core [E]', desc: 'High-density titan crystal node.' },
        { x: 50, y: 92, icon: '▼', name: 'Ascent Descent Gate', sub: 'To Caldera Warzone [South]', desc: 'Walk South down the mountain stairs.' }
      ],
      entities: [
        { name: 'AURELIUS THE EMPYREAN SOVEREIGN', type: 'World Raid Boss', hp: '3200 HP', desc: 'Lv. 35 Titan Sovereign dealing 65 holy starlight DMG. Drops Crown of Dawn!' },
        { name: 'Grand Arbiter Aurelia', type: 'Empyrean Keeper', hp: 'Immortal', desc: 'Guardian of the Morning Star Colonnade.' },
        { name: 'Morning Star Terraces', type: 'Starlight Colonnade', hp: 'Ancient Monument', desc: 'Sacred terrace fonts resonant with celestial glimmer.' }
      ],
      objectives: 'Vanquish Aurelius the Empyrean Sovereign, claim the Crown of Dawn, attune Empyrean resonance.',
      travel: 'From the northernmost plateau of Continental Nexus Caldera (y: -1760), walk North through the Ascent Gate up the mountain stairs.'
    },
    STARFALL_CRATER: {
      id: 'STARFALL_CRATER',
      name: 'Starfall Meteorite Crater',
      sub: 'Astral Impact Basin & Cosmic Forge',
      level: 'Lv. 20 – 32',
      dangerTag: 'STARFALL BASIN',
      color: '#fb923c',
      borderColor: '#fdba74',
      faction: '☄️ Order of the Astral Forge',
      desc: 'A glowing meteorite impact crater west of the Golden Citadel rich with Astral Mithril and Celestial Starmetal veins, guarded by Starforged Automatons and Ignis-Core.',
      gridPos: { col: 0, row: 2 },
      neighbors: {
        north: null,
        south: 'SOLARI_CITADEL',
        west: null,
        east: 'NEXUS_FORGOTTEN_RUINS'
      },
      landmarks: [
        { x: 50, y: 30, icon: '☄️', name: 'Ignis-Core the Starfall Colossus', sub: '★ Lv.28 Crater World Boss', desc: 'Molten starmetal colossus guarding the Meteor Hammer.' },
        { x: 55, y: 68, icon: '🔨', name: 'Forge-Keeper Orion & Astral Anvil', sub: 'Master Cosmic Smith', desc: 'Smelt Starmetal & Mithril right inside the crater.' },
        { x: 26, y: 46, icon: '⛏️', name: 'Celestial Starmetal Veins', sub: 'High-Tier Ore Veins [E]', desc: 'Rich veins of Astral Mithril & Celestial Runite.' },
        { x: 92, y: 50, icon: '▶', name: 'Citadel Canyon Pass', sub: 'To Solari Citadel [East]', desc: 'Walk East back to the Golden Citadel.' }
      ],
      entities: [
        { name: 'Ignis-Core the Starfall Colossus', type: 'Crater Boss', hp: '980 HP', desc: 'Drops the Mythic Starmetal Meteor Hammer.' },
        { name: 'Starforged Automatons & Meteor Elementals', type: 'Hostile Construct', hp: '190 – 230 HP', desc: 'Guard cosmic ore veins and drop Astral Mineral Dust.' },
        { name: 'Forge-Keeper Orion', type: 'Astral Smith', hp: 'Immortal', desc: 'Keeper of The Fallen Astral Forge quest.' }
      ],
      objectives: 'Mine Astral Mithril & Starmetal, smelt cosmic alloys, defeat Ignis-Core for the Starmetal Meteor Hammer.',
      travel: 'Walk West from Solari Sun-Citadel (or East from the Forgotten First Nexus Ruins).'
    },
    ABYSSAL_RIFT: {
      id: 'ABYSSAL_RIFT',
      name: 'The Abyssal Rift',
      sub: 'Primeval Void Singularity & Late-Game Sanctum',
      level: 'Lv. 32 – 45',
      dangerTag: 'APEX VOID BREACH',
      color: '#e879f9',
      borderColor: '#f0abfc',
      faction: '🌌 Rift-Watchers of the Edge',
      desc: 'A shattered reality breach east of the Continental Caldera where obsidian islands float above the Fall, prowled by Gloam-Silk Widows, Paradox Sentinels, and Xal\'Korath the Void Architect.',
      gridPos: { col: 2, row: 1 },
      neighbors: {
        north: null,
        south: null,
        west: 'NEXUS_WARZONE',
        east: null
      },
      landmarks: [
        { x: 50, y: 26, icon: '🌌', name: 'Xal\'Korath the Void Architect', sub: '★ Lv.42 Apex Raid Boss', desc: '3,800 HP Void Sovereign dropping the Abyssal Voidstar Scythe.' },
        { x: 45, y: 72, icon: '⚗️', name: 'Rift-Watcher Nihilus & Crucible', sub: 'Abyssal Vanguard', desc: 'Oversees Breach quests & high-tier Rite-Binding.' },
        { x: 74, y: 48, icon: '🕸️', name: 'Celestial Gossamer & Starleaf', sub: 'Endgame Skilling Nodes [E]', desc: 'Harvest Empyrean Starleaf & Celestial Gossamer.' },
        { x: 8, y: 50, icon: '◀', name: 'Caldera Breach Gate', sub: 'To Nexus Caldera [West]', desc: 'Walk West back into the Continental Caldera.' }
      ],
      entities: [
        { name: 'Xal\'Korath the Void Architect', type: 'Apex Raid Boss', hp: '3800 HP', desc: 'Lv. 42 Void Architect dropping Abyssal Voidstar Scythe!' },
        { name: 'Paradox Sentinels & Gloam-Silk Widows', type: 'Endgame Rift Mob', hp: '340 – 460 HP', desc: 'Drop Celestial Gossamer, Void Essence & Empyrean Starleaf.' },
        { name: 'Rift-Watcher Nihilus', type: 'Void Watcher', hp: 'Immortal', desc: 'Issues Breach of the Void Architect quest.' }
      ],
      objectives: 'Harvest Empyrean Starleaf & Celestial Gossamer, conquer Elite Rift Champions, vanquish Xal\'Korath.',
      travel: 'Walk East across the eastern edge of the Continental Nexus Caldera (or North beyond the Celestial Ascent).'
    },
    IRONWOOD_TIMBERLANDS: {
      id: 'IRONWOOD_TIMBERLANDS',
      name: 'Ironwood Timberlands',
      sub: 'Ancient Primordial Forest & Woodcraft Haven',
      level: 'Lv. 8 – 18',
      dangerTag: 'ARBOREAL GROVE',
      color: '#22c55e',
      borderColor: '#4ade80',
      faction: '🌲 Order of the Green Bough',
      desc: 'Dense primordial woodland south of Terra Orchard teeming with towering Glimmerwood, ancient Ironbark oaks, and Duskveil willows. Home to Forester Silas and the Lumberjack Camp.',
      gridPos: { col: 1, row: 6 },
      neighbors: {
        north: 'TERRA_ORCHARD',
        south: 'MOONWELL_SANCTUM',
        west: 'STARLIGHT_GROVE',
        east: 'CORAL_COAST'
      },
      landmarks: [
        { x: 50, y: 32, icon: '🪵', name: 'Elder Barkhide the Treant', sub: '★ Lv.16 Forest Boss', desc: 'Ancient primordial treant dropping the Ironwood Quarterstaff.' },
        { x: 42, y: 70, icon: '🪓', name: 'Forester Silas & Lumberjack Camp', sub: 'Master Woodcrafter', desc: 'Oversees timbercraft bounties & campfire recipes.' },
        { x: 68, y: 52, icon: '🌲', name: 'Ancient Ironbark Groves', sub: 'High-Tier Timber Nodes [E]', desc: 'Fell Glimmerwood, Ironbark & Duskveil trees for logs & resins.' },
        { x: 50, y: 8, icon: '▲', name: 'Orchard Ridge Pass', sub: 'To Terra Orchard [North]', desc: 'Walk North back to Terra Orchard.' },
        { x: 92, y: 50, icon: '▶', name: 'Coastal Forest Trail', sub: 'To Coral Coast [East]', desc: 'Walk East along the coast into the Coral Coast.' }
      ],
      entities: [
        { name: 'Elder Barkhide the Treant', type: 'Forest Boss', hp: '580 HP', desc: 'Drops the Primeval Ironwood Quarterstaff and Hardened Sap.' },
        { name: 'Treant Saplings & Ironbark Prowlers', type: 'Forest Mob', hp: '95 – 135 HP', desc: 'Defend the timber groves and drop Glimmerwood logs & amber resin.' },
        { name: 'Forester Silas', type: 'Woodcraft Mentor', hp: 'Immortal', desc: 'Issues timber bounties and guides campfire crafting.' }
      ],
      objectives: 'Fell Glimmerwood & Ironbark trees, build campfires, vanquish Elder Barkhide.',
      travel: 'Walk South from Terra Orchard (or West from Coral Coast).'
    },
    CORAL_COAST: {
      id: 'CORAL_COAST',
      name: 'Coral Coast & Maritime Docks',
      sub: 'Tidal Atolls & Cosmic Angler Haven',
      level: 'Lv. 12 – 24',
      dangerTag: 'OCEANIC SHALLOWS',
      color: '#06b6d4',
      borderColor: '#38bdf8',
      faction: '🌊 Tide-Seekers of the Deep',
      desc: 'Sunlit maritime coastline east of Umbri Undercity where gentle tides lap against living coral reefs. Angler Finn teaches cosmic fishing at the oceanic boardwalk pier.',
      gridPos: { col: 2, row: 5 },
      neighbors: {
        north: 'UMBRI_UNDERCITY',
        south: 'SUNKEN_OASIS',
        west: 'IRONWOOD_TIMBERLANDS',
        east: null
      },
      landmarks: [
        { x: 50, y: 28, icon: '🔱', name: 'Triton the Tide-Reaver', sub: '★ Lv.20 Reef World Boss', desc: 'Sovereign of the Atoll dropping the Coral Tide-Reaver Trident.' },
        { x: 38, y: 68, icon: '🎣', name: 'Angler Finn & Pier Docks', sub: 'Master Cosmic Angler', desc: 'Teaches angling, baiting, and coastal bounties.' },
        { x: 70, y: 50, icon: '🐟', name: 'Prismatic Coral Reefs', sub: 'Tidal Angling Pools [E]', desc: 'Angle Minnows, Solar Trout & Prismatic Salmon.' },
        { x: 50, y: 8, icon: '▲', name: 'Sepulcher Coastal Path', sub: 'To Umbri Undercity [North]', desc: 'Walk North back into the Duskveil Bog.' },
        { x: 8, y: 50, icon: '◀', name: 'Forest Ridge Way', sub: 'To Ironwood Timberlands [West]', desc: 'Walk West into the ancient timber groves.' }
      ],
      entities: [
        { name: 'Triton the Tide-Reaver', type: 'Reef Boss', hp: '760 HP', desc: 'Drops the Coral Tide-Reaver Trident & Shimmering Atoll Ring.' },
        { name: 'Brine Crawlers & Coral Sirens', type: 'Oceanic Mob', hp: '140 – 175 HP', desc: 'Guard tidal pools and drop pearls, minnows & shells.' },
        { name: 'Angler Finn', type: 'Angling Mentor', hp: 'Immortal', desc: 'Guides cosmic fishing and coastal fish recipes.' }
      ],
      objectives: 'Angle raw minnows & solar trout, cook feasts on campfire hearths, vanquish Triton.',
      travel: 'Walk East from Umbri Undercity (or East from Ironwood Timberlands).'
    },
    SUNKEN_OASIS: {
      id: 'SUNKEN_OASIS',
      name: 'Whispering Springs & Sunken Oasis',
      sub: 'Lush Oasis Pools, Healing Springs & Timber Groves',
      level: 'Lv. 12 – 28',
      dangerTag: 'TERRA SANCTUM',
      color: '#38bdf8',
      borderColor: '#4ade80',
      faction: '🌿 Terra (The Earth)',
      desc: 'A tranquil sunken oasis east of Terra Orchard and south of Coral Coast fed by crystal restorative springs, flowering lily-pads, and choppable glimmerwood groves.',
      gridPos: { col: 2, row: 6 },
      neighbors: {
        north: 'CORAL_COAST',
        south: null,
        west: 'IRONWOOD_TIMBERLANDS',
        east: null
      },
      landmarks: [
        { x: 50, y: 26, icon: '🪷', name: 'Sylphira the Spring Matriarch', sub: '★ Lv.24 Oasis Boss', desc: 'Guardian of the Sunken Oasis dropping Primordial Bark Armor.' },
        { x: 35, y: 55, icon: '💧', name: 'Luminous Restorative Springs', sub: 'Healing Spring [E] (+HP & Glimmer)', desc: 'Stand near to regenerate +6 HP/s & +6 Glimmer/s, or channel [E].' },
        { x: 70, y: 52, icon: '🌳', name: 'Oasis Timber Groves', sub: 'Choppable Blossom & Glimmerwood [E]', desc: 'Lush oasis trees doubling as scenery and timber nodes.' }
      ],
      entities: [
        { name: 'Sylphira the Spring Matriarch', type: 'Oasis Boss', hp: '720 HP', desc: 'Drops Primordial Bark Chestplate.' },
        { name: 'Oasis Bloomwardens & Mistwater Striders', type: 'Terra Protector', hp: '155 – 185 HP', desc: 'Peaceful toward Terra heroes unless provoked.' }
      ],
      objectives: 'Rest by the Luminous Healing Springs, fell glimmerwood trees, defeat Sylphira.',
      travel: 'Walk East from Terra Orchard or South from Coral Coast.'
    },
    SOLAR_HIGHLANDS: {
      id: 'SOLAR_HIGHLANDS',
      name: 'Ambergris Crags & Sunspire Highlands',
      sub: 'Radiant Mountain Ridges & Thermal Springs',
      level: 'Lv. 16 – 32',
      dangerTag: 'SOLARI HIGHLANDS',
      color: '#facc15',
      borderColor: '#fde047',
      faction: '☀️ Solari (The Light)',
      desc: 'Sun-drenched plateau cliffs south of Solari Sun-Citadel lined with golden Sunforged trees, crag veins of Mithril and Starmetal, and warm thermal springs.',
      gridPos: { col: 0, row: 5 },
      neighbors: {
        north: 'SOLARI_CITADEL',
        south: 'STARLIGHT_GROVE',
        west: null,
        east: 'TERRA_ORCHARD'
      },
      landmarks: [
        { x: 50, y: 26, icon: '☀️', name: 'Helios-Vanguard the Sunspire Titan', sub: '★ Lv.28 Highlands Boss', desc: 'Towering golden guardian dropping the Sunfire Greatsword.' },
        { x: 36, y: 60, icon: '💧', name: 'Thermal Healing Springs', sub: 'Healing Spring [E] (+HP & Glimmer)', desc: 'Mineral thermal pools restoring HP & Glimmer.' },
        { x: 70, y: 48, icon: '🌲', name: 'Sunforged & Pine Timberlands', sub: 'Highland Timber [E]', desc: 'Chop radiant Sunforged trees and Alpine Pines.' }
      ],
      entities: [
        { name: 'Helios-Vanguard the Sunspire Titan', type: 'Highlands Boss', hp: '890 HP', desc: 'Drops the Sunfire Greatsword.' },
        { name: 'Sunspire Crag-Watchers', type: 'Solari Protector', hp: '180 – 215 HP', desc: 'Allied with Solari champions unless attacked.' }
      ],
      objectives: 'Mine highlands Mithril/Starmetal, chop Sunforged timber, challenge Helios-Vanguard.',
      travel: 'Walk South from Solari Sun-Citadel or East from Starfall Crater.'
    },
    STARLIGHT_GROVE: {
      id: 'STARLIGHT_GROVE',
      name: 'Starlight Grove & Ancient Timber Sanctuary',
      sub: 'Luminous Druid Groves & Whispering Canopies',
      level: 'Lv. 22 – 45',
      dangerTag: 'PRIMAL SANCTUARY',
      color: '#86efac',
      borderColor: '#4ade80',
      faction: '🌿 Terra (The Earth)',
      desc: 'A silver-lit starlight forest southwest of Ironwood Timberlands brimming with celestial timber, ancient oaks, and restorative glades.',
      gridPos: { col: 0, row: 6 },
      neighbors: {
        north: 'SOLAR_HIGHLANDS',
        south: 'FROSTSPIRE_GLACIER',
        west: null,
        east: 'IRONWOOD_TIMBERLANDS'
      },
      landmarks: [
        { x: 50, y: 28, icon: '🌟', name: 'Arch-Treant Sylvanor', sub: '★ Lv.36 Grove Sovereign', desc: 'Ancient canopy warden.' },
        { x: 65, y: 55, icon: '🌲', name: 'Starlight Timber Groves', sub: 'Choppable Starlight Trees [E]', desc: 'Harvest luminous starlight timber and healing spring herbs.' }
      ],
      entities: [
        { name: 'Starlight Guardians & Elder Dryads', type: 'Terra Protector', hp: '240 – 380 HP', desc: 'Protect the grove; peaceful toward Terra heroes unless provoked.' }
      ],
      objectives: 'Harvest Starlight timber, channel sacred springs, conquer the Grove Sovereign.',
      travel: 'Walk West from Ironwood Timberlands or South from Sunken Oasis.'
    },
    CHRONOCORE_CITADEL: {
      id: 'CHRONOCORE_CITADEL',
      name: 'Chronocore Citadel & Astral Trial Spire',
      sub: 'High-Altitude Temporal Fortress',
      level: 'Lv. 32 – 60',
      dangerTag: 'AETHER CITADEL',
      color: '#38bdf8',
      borderColor: '#a5b4fc',
      faction: '🔮 Aether (The Magic)',
      desc: 'A suspended citadel of crystalline astrolabes east of Celestial Ascent where Aether chronomancers temper spacetime anomalies.',
      gridPos: { col: 2, row: 0 },
      neighbors: {
        north: null,
        south: null,
        west: 'CELESTIAL_ASCENT',
        east: null
      },
      landmarks: [
        { x: 50, y: 28, icon: '⏳', name: 'Chrono-Archon Vaelen', sub: '★ Lv.48 Temporal Boss', desc: 'Master of temporal rifts.' },
        { x: 50, y: 65, icon: '💧', name: 'Chronal Restorative Spring', sub: 'Healing Spring [E]', desc: 'Restores HP & Glimmer rapidly.' }
      ],
      entities: [
        { name: 'Chronocore Construct Sentinels', type: 'Aether Protector', hp: '360 – 520 HP', desc: 'Friendly toward Aether heroes unless attacked.' }
      ],
      objectives: 'Extract Starmetal veins, temper Chronal springs, challenge Chrono-Archon Vaelen.',
      travel: 'Walk East from Celestial Ascent or step through the Chronocore Citadel gateway.'
    },
    MOONWELL_SANCTUM: {
      id: 'MOONWELL_SANCTUM',
      name: 'Silvermist Moonwell & Druid Sanctum',
      sub: 'Moonlit Healing Springs & Sacred Timber Glades',
      level: 'Lv. 20 – 38',
      dangerTag: 'MOONWELL SANCTUM',
      color: '#4ade80',
      borderColor: '#7dd3fc',
      faction: '🌿 Terra (The Earth)',
      desc: 'A serene glade ringed by silver-leaf Starlight and Crimson Blossom trees, fed by four Luminous Restorative Springs and guarded by Archdruid Elaria.',
      gridPos: { col: 1, row: 7 },
      neighbors: {
        north: 'IRONWOOD_TIMBERLANDS',
        south: null,
        west: 'FROSTSPIRE_GLACIER',
        east: null
      },
      landmarks: [
        { x: 50, y: 26, icon: '🌙', name: 'Archdruid Elaria of the Silvermist', sub: '★ Lv.32 Moonwell Matriarch', desc: 'Druid Sovereign dropping the Elder Treant Staff.' },
        { x: 35, y: 56, icon: '💧', name: 'Four Moonwell Healing Springs', sub: 'Sacred Healing Springs [E]', desc: 'Channel [E] or rest beside the waters for rapid +6 HP/s & +6 Glimmer/s regen.' },
        { x: 68, y: 52, icon: '🌳', name: 'Silvermist Blossom & Starlight Groves', sub: 'Choppable Scenic Trees [E]', desc: 'Ringed with choppable Starlight, Blossom, Glimmerwood & Ironbark trees.' }
      ],
      entities: [
        { name: 'Archdruid Elaria of the Silvermist', type: 'Moonwell Boss', hp: '960 HP', desc: 'Drops Elder Treant Staff.' },
        { name: 'Silvermist Grove-Keepers', type: 'Terra Protector', hp: '210 – 245 HP', desc: 'Friendly toward Terra heroes unless provoked.' }
      ],
      objectives: 'Channel Moonwell Healing Springs, harvest Starlight timber & herbs, challenge Archdruid Elaria.',
      travel: 'Walk South from Starlight Grove or East from Ambergris Crags (Sunspire Highlands).'
    },
    LUMINOUS_CAVERN: {
      id: 'LUMINOUS_CAVERN',
      name: 'CrystalEcho Caverns & Subterranean Grotto',
      sub: 'Bioluminescent Geode Grotto & Underground Streams',
      level: 'Lv. 10 – 24',
      dangerTag: 'CRYSTAL GROTTO',
      color: '#38bdf8',
      borderColor: '#e879f9',
      faction: '💎 Order of the Sunspire Delvers (Open Realm)',
      desc: 'A shimmering subterranean cavern network beneath Sanctuary Gardens and Sunken Oasis, rich with Copper, Star-Iron, and Mithril seams, glowing Crystal Geodes, and subterranean angling pools.',
      gridPos: { col: 2, row: 7 },
      neighbors: {
        north: null,
        south: 'SANCTUARY_HUB',
        west: null,
        east: null
      },
      landmarks: [
        { x: 50, y: 26, icon: '💎', name: 'Crystallis the Echo Warden', sub: '★ Lv.20 Cavern Boss', desc: 'Subterranean crystal guardian dropping the Mirror Shield.' },
        { x: 50, y: 68, icon: '🧭', name: 'Explorer Korin & Hearth', sub: 'CrystalEcho Geologist', desc: 'Guides subterranean mining, geode tapping & cavern bounties.' },
        { x: 32, y: 50, icon: '⛏️', name: 'Bioluminescent Geodes & Ore Seams', sub: 'Copper, Iron & Mithril [E]', desc: 'Mine mineral veins and tap glowing Crystal Geodes.' }
      ],
      entities: [
        { name: 'Crystallis the Echo Warden', type: 'Cavern Boss', hp: '650 HP', desc: 'Drops the Mirror Shield & Astral Mineral Dust.' },
        { name: 'CrystalEcho Geode-Stalkers & Prism-Shell Golems', type: 'Cavern Construct', hp: '130 – 175 HP', desc: 'Guard mineral seams and drop Glimmer Shards.' },
        { name: 'Explorer Korin', type: 'Geologist Mentor', hp: 'Immortal', desc: 'Oversees subterranean expeditions and campfire cooking.' }
      ],
      objectives: 'Mine Copper, Iron & Mithril veins, tap Crystal Geodes, angle subterranean trout, defeat Crystallis.',
      travel: 'Enter the CrystalEcho Cavern Archway in South Sanctuary Gardens or walk East from Sunken Oasis.'
    },
    FROSTSPIRE_GLACIER: {
      id: 'FROSTSPIRE_GLACIER',
      name: 'Frostspire Glacier & Aurora Outlook',
      sub: 'Aurora Leyline Peaks, Mithril Ridges & Alpine TCG Camp',
      level: 'Lv. 22 – 38',
      dangerTag: 'AURORA GLACIER',
      color: '#7dd3fc',
      borderColor: '#38bdf8',
      faction: '❄️ Alpine Expedition Frontier (Open Realm)',
      desc: 'A high-altitude crystalline glacier bathed in shimmering aurora light, featuring rich Mithril deposits, an unfrozen Thermal Healing Spring, Alpine Supply Sleds, Aurora Crystal Obelisks, and the sovereign frost spirit Borealis.',
      gridPos: { col: 0, row: 7 },
      neighbors: {
        north: 'STARLIGHT_GROVE',
        south: null,
        west: null,
        east: 'MOONWELL_SANCTUM'
      },
      landmarks: [
        { x: 50, y: 24, icon: '❄️', name: 'Borealis, Crown of Eternal Rime', sub: '★ Lv.34 Glacier Boss', desc: 'Ancient alpine spirit dropping the Chronos Singularity Core.' },
        { x: 50, y: 66, icon: '🔮', name: 'Aurora Crystal Obelisk & Thermal Spring', sub: 'Restorative Leyline [E]', desc: 'Touch the crystal obelisk for 90s Frostward Blessing & +40 Glimmer.' },
        { x: 30, y: 50, icon: '🛷', name: 'Glacial Expedition Camp & Supply Sleds', sub: '1v1 TCG Table & Alpine Loot', desc: 'Challenge Skald Thrym to alpine 1v1 TCG duels and loot supply sleds.' }
      ],
      entities: [
        { name: 'Borealis, Crown of Eternal Rime', type: 'Glacier Boss', hp: '1,080 HP', desc: 'Drops high-tier Mithril loot & Chronos Singularity Core.' },
        { name: 'Frostfang Tundra-Stalkers & Glacier Sentinels', type: 'Alpine Guardians', hp: '240 – 295 HP', desc: 'High-XP endgame beasts patrolling Mithril veins.' },
        { name: 'Glaciologist Vael & Skald Thrym', type: 'Expedition Camp', hp: 'Immortal', desc: 'Offer alpine bounties, Hearth cooking & 1v1 TCG challenges.' }
      ],
      objectives: 'Mine 4 Mithril Seams, harvest Ice-Melt pools, tap Aurora Crystal Obelisks, duel Skald Thrym, conquer Borealis.',
      travel: 'Walk South from Silvermist Moonwell or North from CrystalEcho Caverns (or warp via Activity Finder).'
    },
    SOLARI_SUNKEN_VAULT: {
      id: 'SOLARI_SUNKEN_VAULT',
      name: 'Sunken Vault of the Dawn',
      sub: 'Solari Mythic Keystone Crypt (Lv. 6–70)',
      level: 'Lv. 6 – 20+',
      dangerTag: 'SOLARI CRYPT',
      color: '#facc15',
      borderColor: '#fde047',
      faction: '☀️ Solari (Founder Keystone Crypt)',
      desc: 'An ancient solar catacomb beneath the Golden Citadel where Sunfire Automatons and Dawnblade Crusaders guard the Solaris Core Colossus.',
      gridPos: { col: 0, row: 3 },
      neighbors: {
        north: null,
        south: 'SOLARI_CITADEL',
        west: null,
        east: null
      },
      landmarks: [
        { x: 50, y: 24, icon: '☀️', name: 'Solaris Core Colossus', sub: '★ Crypt Boss', desc: 'Drops Dawnfire Crest & Tier 1–3 Solari Keystones.' },
        { x: 30, y: 56, icon: '💎', name: 'Dawnstone Glimmer Well', sub: 'Leyline Font [E]', desc: 'Restores Glimmer inside the vault.' }
      ],
      entities: [
        { name: 'Solaris Core Colossus', type: 'Crypt Boss', hp: '96+ HP (Mythic Scaling)', desc: 'Sunken Dawn Titan dropping Dawnfire Crest.' },
        { name: 'Sunfire Automatons & Dawnblade Crusaders', type: 'Solari Construct', hp: '42 – 46+ HP', desc: 'Patrol the solar crypt chambers.' }
      ],
      objectives: 'Clear Sunfire Automatons, conquer Solaris Core Colossus, push Tier 1–10 Solari Keystones.',
      travel: 'Walk North through the Solari Citadel crypt gate (Founder Edition).'
    },
    UMBRI_SHADOW_LABYRINTH: {
      id: 'UMBRI_SHADOW_LABYRINTH',
      name: 'Duskveil Shadow Labyrinth',
      sub: 'Umbri Mythic Keystone Crypt (Lv. 6–70)',
      level: 'Lv. 6 – 20+',
      dangerTag: 'UMBRI CRYPT',
      color: '#c084fc',
      borderColor: '#e879f9',
      faction: '🌑 Umbri (Founder Keystone Crypt)',
      desc: 'Shrouded subterranean labyrinth north of Sepulcher Undercity, prowled by Graveglass Phantoms, Gloam Assassins, and the Abyssal Devourer.',
      gridPos: { col: 2, row: 3 },
      neighbors: {
        north: null,
        south: 'UMBRI_UNDERCITY',
        west: null,
        east: null
      },
      landmarks: [
        { x: 50, y: 24, icon: '💀', name: 'Abyssal Devourer', sub: '★ Crypt Boss', desc: 'Drops Void Soulblade & Tier 1–3 Umbri Keystones.' },
        { x: 30, y: 56, icon: '💎', name: 'Graveglass Leyline Shroud', sub: 'Leyline Font [E]', desc: 'Restores Glimmer in the shadow labyrinth.' }
      ],
      entities: [
        { name: 'Abyssal Devourer', type: 'Crypt Boss', hp: '92+ HP (Mythic Scaling)', desc: 'Shade of the Void dropping Void Soulblade.' },
        { name: 'Graveglass Phantoms & Gloam Assassins', type: 'Umbri Specter', hp: '38 – 42+ HP', desc: 'Ambush intruders in the dark.' }
      ],
      objectives: 'Survive shadow ambushes, defeat the Abyssal Devourer, push Tier 1–10 Umbri Keystones.',
      travel: 'Walk North from Umbri Sepulcher Undercity (Founder Edition).'
    },
    TERRA_OVERGROWTH_SANCTUARY: {
      id: 'TERRA_OVERGROWTH_SANCTUARY',
      name: 'Rootdeep Primordial Hollow',
      sub: 'Terra Mythic Keystone Crypt (Lv. 6–70)',
      level: 'Lv. 6 – 20+',
      dangerTag: 'TERRA CRYPT',
      color: '#4ade80',
      borderColor: '#86efac',
      faction: '🌿 Terra (Founder Keystone Crypt)',
      desc: 'An overgrown living root-cavern west of Glimmer Orchard guarded by Ironwood Barkkin, Sporeling Stalkers, and Primordial Ironbark.',
      gridPos: { col: 0, row: 8 },
      neighbors: {
        north: null,
        south: null,
        west: null,
        east: 'TERRA_ORCHARD'
      },
      landmarks: [
        { x: 50, y: 24, icon: '🌳', name: 'Primordial Ironbark', sub: '★ Crypt Boss', desc: 'Drops Primordial Bark Armor & Terra Keystones.' },
        { x: 30, y: 56, icon: '💎', name: 'Rootdeep Heart Font', sub: 'Leyline Font [E]', desc: 'Primal root wellspring.' }
      ],
      entities: [
        { name: 'Primordial Ironbark', type: 'Crypt Boss', hp: '110+ HP (Mythic Scaling)', desc: 'Elder Treant dropping Primordial Bark Chestplate.' },
        { name: 'Ironwood Barkkin & Sporeling Stalkers', type: 'Terra Guardian', hp: '44 – 48+ HP', desc: 'Ancient hollow defenders.' }
      ],
      objectives: 'Break Ironwood defenders, conquer Primordial Ironbark, push Tier 1–10 Terra Keystones.',
      travel: 'Walk West from Terra Glimmer Orchard (Founder Edition).'
    },
    AETHER_FRACTURED_ARCHIVE: {
      id: 'AETHER_FRACTURED_ARCHIVE',
      name: 'Fractured Chrono-Archive',
      sub: 'Aether Mythic Keystone Crypt (Lv. 6–70)',
      level: 'Lv. 6 – 20+',
      dangerTag: 'AETHER CRYPT',
      color: '#38bdf8',
      borderColor: '#7dd3fc',
      faction: '🔮 Aether (Founder Keystone Crypt)',
      desc: 'Shattered astral archive floating east of Mirrorgate Spire, patrolled by Chrono Echoes, Astral Weavers, and the Continuum Singularity.',
      gridPos: { col: 2, row: 2 },
      neighbors: {
        north: null,
        south: 'AETHER_SPIRE',
        west: null,
        east: null
      },
      landmarks: [
        { x: 50, y: 24, icon: '⏳', name: 'Continuum Singularity', sub: '★ Crypt Boss', desc: 'Drops Chronos Singularity Core & Aether Keystones.' },
        { x: 30, y: 56, icon: '💎', name: 'Continuum Time Spire', sub: 'Leyline Font [E]', desc: 'Replenishes Glimmer across fractured walkways.' }
      ],
      entities: [
        { name: 'Continuum Singularity', type: 'Crypt Boss', hp: '94+ HP (Mythic Scaling)', desc: 'Paradox Titan dropping Chronos Singularity Core.' },
        { name: 'Chrono Echoes & Astral Weavers', type: 'Aether Construct', hp: '38 – 42+ HP', desc: 'Guard floating archive islands.' }
      ],
      objectives: 'Navigate floating archive bridges, defeat Continuum Singularity, push Tier 1–10 Aether Keystones.',
      travel: 'Walk East from Mirrorgate Spire (Founder Edition).'
    },
    ARENA_3V3: {
      id: 'ARENA_3V3',
      name: '3v3 Ranked Nexus Arena',
      sub: 'Competitive Squad Skirmish & Nexus Destruction',
      level: 'All Levels (Ranked)',
      dangerTag: '3V3 ARENA',
      color: '#fb7185',
      borderColor: '#f43f5e',
      faction: '⚔️ Competitive Arena Lobby',
      desc: 'Instanced 3v3 battleground where two squads clash across symmetrical lanes to shatter the opposing team\'s 2,500 HP Nexus core.',
      gridPos: { col: 0, row: 1 },
      neighbors: {
        north: null,
        south: null,
        west: null,
        east: 'NEXUS_WARZONE'
      },
      landmarks: [
        { x: 50, y: 20, icon: '🔴', name: 'Umbri Dominion Nexus', sub: '2,500 HP Red Core', desc: 'Shatter the enemy Nexus to win the match.' },
        { x: 50, y: 80, icon: '🔵', name: 'Solari Sanctuary Nexus', sub: '2,500 HP Blue Core', desc: 'Defend your allied Nexus from enemy pushes.' }
      ],
      entities: [
        { name: 'Enemy Squad & AI Vanguard', type: 'PvP / Arena Champions', hp: 'Scaled', desc: 'Compete for Arena Wins and Hiscores.' }
      ],
      objectives: 'Queue via the 3v3 Arena button [HUD], coordinate Tank/Healer/DPS roles, shatter the enemy Nexus.',
      travel: 'Queue via the HUD Arena button or enter from the western border of Continental Caldera.'
    }
  };


export { WORLD_ATLAS_REGIONS };
