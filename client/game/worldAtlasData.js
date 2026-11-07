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
        north: 'SOLARI_SUNKEN_VAULT',
        south: null,
        west: 'STARFALL_CRATER',
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
        south: null,
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
        south: null,
        west: null,
        east: null
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
        west: null,
        east: 'STARFALL_CRATER'
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
        north: 'ABYSSAL_RIFT',
        south: 'NEXUS_WARZONE',
        west: null,
        east: null
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
        south: null,
        west: 'NEXUS_FORGOTTEN_RUINS',
        east: 'SOLARI_CITADEL'
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
        south: 'CELESTIAL_ASCENT',
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
    }
  };


export { WORLD_ATLAS_REGIONS };
