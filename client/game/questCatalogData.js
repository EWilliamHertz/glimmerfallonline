// ==========================================
// GlimmerFall Online — Canonical Quest Catalog Data
// ==========================================

  const QUEST_CATALOG = {
    quest_awakening: {
      id: 'quest_awakening',
      title: 'Awakening from Stasis',
      giverId: 'npc_aurora',
      turnInId: 'npc_aurora',
      questPoints: 1,
      unlocks: ['Next Quest: Vanguard Orders', 'Sanctuary Gateway Portals'],
      description: 'Break stasis by moving [WASD], strike the training dummy [1], and channel the Glimmer Node [E].',
      isComplete: () => Boolean(questState.stasisBroken && questState.dummyDamaged && questState.nodeHarvested),
      tasks: [
        { text: 'Break stasis: Move [WASD]', done: () => Boolean(questState.stasisBroken) },
        { text: 'Cast Flare Strike [1] on Dummy', done: () => Boolean(questState.dummyDamaged) },
        { text: 'Channel Glimmer Node [E]', done: () => Boolean(questState.nodeHarvested) },
      ],
      rewards: { xp: 140, glimmer: 70, gold: 75 },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Awake at last, Summoner-Knight! The Great Nexus shattered long ago. Take your first steps [WASD], strike the Sanctuary Dummy with Flare Strike [1], and channel the Glimmer Node [E]!',
        },
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Return to me once your strength is restored to claim your rites and prepare for the Continental Warzone.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'You are recovering well, Knight. Strike the training dummy and channel the Glimmer Node before speaking with me again.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Splendidly done! The Glimmer sings through your veins once more. Take these vital shards and experience!',
        },
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Now, report to Commander Valerius at the North Vanguard Post to receive your frontline combat rites.',
        },
      ],
      nextQuestId: 'quest_into_the_warzone',
    },

    quest_into_the_warzone: {
      id: 'quest_into_the_warzone',
      title: 'Vanguard Orders',
      giverId: 'npc_aurora',
      turnInId: 'npc_archon',
      prereqQuestId: 'quest_awakening',
      questPoints: 1,
      unlocks: ['Next Quest: Banish Void Invaders', 'North Vanguard Command Post Access'],
      description: 'Report to Commander Valerius at the North Vanguard Post.',
      isComplete: () => questNpcTalked('quest_into_the_warzone', 'npc_archon'),
      tasks: [
        { text: 'Report to Commander Valerius', done: () => questNpcTalked('quest_into_the_warzone', 'npc_archon') },
      ],
      rewards: { xp: 180, glimmer: 90, gold: 75 },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Commander Valerius awaits you at the Vanguard Command Post to your north. Speak with him to begin your trial!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Welcome to the frontline, Summoner. Have you reported in with your awakening credentials?',
        },
      ],
      completeDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Welcome, Summoner! Herald Lyra sent word of your awakening. You carry yourself with true steel.',
        },
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'We face dire threats beyond the sanctuary borders. The Void corrupts the outer gates, and monsters roam the wild perimeter.',
        },
      ],
      nextQuestId: 'quest_void_banish',
    },

    quest_void_banish: {
      id: 'quest_void_banish',
      title: 'Banish Void Invaders',
      giverId: 'npc_archon',
      turnInId: 'npc_archon',
      prereqQuestId: 'quest_into_the_warzone',
      questPoints: 1,
      unlocks: ['Next Quest: First Nexus Secrets', 'Vanguard Frontline Cache'],
      description: 'Banish 3 hostile foes roaming outside the Sanctuary. Training dummies do not count.',
      isComplete: () => questCounter('quest_void_banish', 'warzoneKills') >= 3,
      tasks: [
        {
          text: 'Banish Hostile Foes (not dummies)',
          done: () => questCounter('quest_void_banish', 'warzoneKills') >= 3,
          counter: () => `${Math.min(3, questCounter('quest_void_banish', 'warzoneKills'))} / 3`,
        },
      ],
      rewards: { xp: 350, glimmer: 150, gold: 140 },
      acceptDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Void entities stalk outside our gates. Step into any outer domain, cut down 3 real foes, and report back to prove your steel. Training dummies do not count.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Keep hunting, soldier! The void creeps ever closer until all 3 real threats are banished. Practice dummies do not count.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Outstanding work! The perimeter holds thanks to your blade. Accept this vanguard cache and the gratitude of the Order.',
        },
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'When you are ready for deeper mysteries, journey North through the Aether Astral Spire into the Forgotten Ruins and seek Atlas the Cartographer!',
        },
      ],
      nextQuestId: 'quest_first_nexus',
    },

    quest_first_nexus: {
      id: 'quest_first_nexus',
      title: 'First Nexus Secrets',
      giverId: 'npc_atlas',
      turnInId: 'npc_atlas',
      questPoints: 1,
      unlocks: ['Next Quest: Ascent to the Empyrean', 'Quadrant Waystone Secrets'],
      description: 'Banish 2 ruin horrors in the Forgotten First Nexus Ruins.',
      isComplete: () => questCounter('quest_first_nexus', 'ruinsKills') >= 2,
      tasks: [
        {
          text: 'Banish Ancient Ruin Horrors',
          done: () => questCounter('quest_first_nexus', 'ruinsKills') >= 2,
          counter: () => `${Math.min(2, questCounter('quest_first_nexus', 'ruinsKills'))} / 2`,
        },
      ],
      rewards: { xp: 500, glimmer: 200, gold: 180 },
      acceptDialogue: [
        {
          speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
          spriteKey: 'cartographerNpc',
          text: 'The ancient runes pulse with latent energy, but void horrors taint the First Nexus. Cleanse 2 corrupted stalkers so I can safely read the quadrant stones!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
          spriteKey: 'cartographerNpc',
          text: 'The readings are still muffled by dark resonance. Vanquish the remaining ruin stalkers!',
        },
      ],
      completeDialogue: [
        {
          speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
          spriteKey: 'cartographerNpc',
          text: 'Marvelous! The leyline frequency cleared instantly! Look here—the quadrant stones reveal pathways to all four elemental sanctuaries. Take this antique relic!',
        },
      ],
      nextQuestId: 'quest_celestial_ascent',
    },

    quest_caldera_siege: {
      id: 'quest_caldera_siege',
      title: 'The Continental Nexus Shard',
      giverId: 'npc_archon',
      turnInId: 'npc_archon',
      prereqQuestId: 'quest_void_banish',
      questPoints: 2,
      unlocks: ['Grand Vanguard Cache', 'Continental Caldera Outpost Access'],
      description: 'Venture into the Continental Nexus Caldera and vanquish a Caldera foe or contest an Outpost.',
      isComplete: () => Boolean(questCounter('quest_caldera_siege', 'calderaKills') >= 1 || questCounter('quest_caldera_siege', 'warzoneKills') >= 4),
      tasks: [
        {
          text: 'Vanquish a Continental Caldera foe',
          done: () => Boolean(questCounter('quest_caldera_siege', 'calderaKills') >= 1 || questCounter('quest_caldera_siege', 'warzoneKills') >= 4),
          counter: () => `${Math.min(1, questCounter('quest_caldera_siege', 'calderaKills') + (questCounter('quest_caldera_siege', 'warzoneKills') >= 4 ? 1 : 0))} / 1`,
        },
      ],
      rewards: { xp: 700, glimmer: 300, gold: 250 },
      acceptDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Beyond the Forgotten Ruins lies the Continental Caldera—a brutal high-level warzone where rival factions clash! Enter the Caldera and strike down a creature to prove your mastery.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Steel your resolve in the Caldera! The foes hit hard, but the rewards are unmatched.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Triumph in the Caldera! You have conquered the Continental Caldera and stood against the horde! Take this Grand Vanguard Cache!',
        },
      ],
    },

    quest_celestial_ascent: {
      id: 'quest_celestial_ascent',
      title: 'Ascent to the Empyrean',
      giverId: 'npc_atlas',
      turnInId: 'npc_aurelia',
      prereqQuestId: 'quest_first_nexus',
      questPoints: 2,
      unlocks: ['Next Quest: The Slumbering Sovereign', 'Empyrean Summit Colonnade'],
      description: 'Climb past the northern boundary of the Continental Caldera and seek Grand Arbiter Aurelia at the Celestial Ascent.',
      isComplete: () => Boolean(questFlag('quest_celestial_ascent', 'ascentReached') || questNpcTalked('quest_celestial_ascent', 'npc_aurelia')),
      tasks: [
        {
          text: 'Reach the Celestial Ascent Summit',
          done: () => Boolean(questFlag('quest_celestial_ascent', 'ascentReached') || questNpcTalked('quest_celestial_ascent', 'npc_aurelia')),
        },
      ],
      rewards: { xp: 900, glimmer: 350, gold: 350 },
      acceptDialogue: [
        {
          speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
          spriteKey: 'cartographerNpc',
          text: 'The quadrant stones point further north—high into the clouds beyond the Caldera plateau! The Ancient Titans carved a mountain colonnade called the Celestial Ascent. Climb to the peak and confer with Grand Arbiter Aurelia.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
          spriteKey: 'cartographerNpc',
          text: 'Follow the northern leylines past the Caldera pass to locate the grand ascent stairway.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'GRAND ARBITER AURELIA • TITAN KEEPER',
          spriteKey: 'celestialArbiterNpc',
          text: 'A mortal champion ascends the starlight stairs! Welcome to the Celestial Ascent, Summoner. The leylines of the Ancients recognize your courage.',
        },
      ],
      nextQuestId: 'quest_titan_cleansing',
    },

    quest_titan_cleansing: {
      id: 'quest_titan_cleansing',
      title: 'The Slumbering Sovereign',
      giverId: 'npc_aurelia',
      turnInId: 'npc_aurelia',
      prereqQuestId: 'quest_celestial_ascent',
      questPoints: 3,
      unlocks: ['Titan Sovereign Favor', 'Apex Starlight Champion Title'],
      description: 'Challenge Aurelius the Empyrean Sovereign at the Northern Summit Throne.',
      isComplete: () => questCounter('quest_titan_cleansing', 'titanChallenges') >= 1,
      tasks: [
        {
          text: 'Strike Aurelius the Empyrean Sovereign',
          done: () => questCounter('quest_titan_cleansing', 'titanChallenges') >= 1,
        },
      ],
      rewards: { xp: 1500, glimmer: 500, gold: 600 },
      acceptDialogue: [
        {
          speaker: 'GRAND ARBITER AURELIA • TITAN KEEPER',
          spriteKey: 'celestialArbiterNpc',
          text: 'At the northern summit slumbers our titan lord, Aurelius the Empyrean Sovereign. Corrupted by the Fall, he strikes down all who approach. Ascend to his throne, engage the Sovereign in combat, and awaken his dormant light!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'GRAND ARBITER AURELIA • TITAN KEEPER',
          spriteKey: 'celestialArbiterNpc',
          text: 'The Sovereign awaits at the northern starlight dais. Approach with reverence and prepared steel!',
        },
      ],
      completeDialogue: [
        {
          speaker: 'GRAND ARBITER AURELIA • TITAN KEEPER',
          spriteKey: 'celestialArbiterNpc',
          text: 'Glorious! You have matched blades with the Titan Sovereign and cleansed the encroaching void rifts from his throne! The Empyrean hosts salute your ascension!',
        },
      ],
    },

    quest_elemental_pilgrimage: {
      id: 'quest_elemental_pilgrimage',
      title: 'The Four Leyline Sanctuaries',
      giverId: 'npc_aurora',
      turnInId: 'npc_aurora',
      prereqQuestId: 'quest_awakening',
      questPoints: 2,
      unlocks: ['Elemental Quad-Attunement', 'Cross-Domain Travel Mastery'],
      description: 'Attune to the leylines of all 4 elemental domains: Solari, Umbri, Terra, and Aether.',
      isComplete: () => Boolean(
        questVisited('quest_elemental_pilgrimage', 'solari') &&
        questVisited('quest_elemental_pilgrimage', 'umbri') &&
        questVisited('quest_elemental_pilgrimage', 'terra') &&
        questVisited('quest_elemental_pilgrimage', 'aether')
      ),
      tasks: [
        { text: 'Visit Solari Sun-Citadel (West)', done: () => questVisited('quest_elemental_pilgrimage', 'solari') },
        { text: 'Visit Umbri Undercity (East)', done: () => questVisited('quest_elemental_pilgrimage', 'umbri') },
        { text: 'Visit Terra Ironwood Wilds (South)', done: () => questVisited('quest_elemental_pilgrimage', 'terra') },
        { text: 'Visit Aether Astral Spire (North)', done: () => questVisited('quest_elemental_pilgrimage', 'aether') },
      ],
      rewards: { xp: 600, glimmer: 250, gold: 250 },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'The four elemental orders—Solari, Umbri, Terra, and Aether—maintain sovereign domains surrounding our Sanctuary. Journey through all four cardinal gates to attune your astral signature to each elemental power!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Walk through each cardinal gateway from Sanctuary Haven to complete your elemental pilgrimage.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'All four elemental affinities now resonate within your core! You are truly a champion of the Glimmerfall.',
        },
      ],
    },

    quest_stargazer_chronos: {
      id: 'quest_stargazer_chronos',
      title: "Astromancer's Continuum",
      giverId: 'npc_kaelen',
      turnInId: 'npc_kaelen',
      prereqQuestId: 'quest_awakening',
      questPoints: 1,
      unlocks: ['Mirrorgate Portal Attunement', 'Chrono-Archive Astral Path'],
      description: 'Ascend the Astral Waygate to the Aether Spire, channel the Mirrorgate Star Font [E], and vanquish a Chrono Anomaly.',
      isComplete: () => Boolean(questCounter('quest_stargazer_chronos', 'aetherFontChannels') >= 1 && questCounter('quest_stargazer_chronos', 'chronoKills') >= 1),
      tasks: [
        {
          text: 'Channel Star Font in Aether Spire',
          done: () => questCounter('quest_stargazer_chronos', 'aetherFontChannels') >= 1,
        },
        {
          text: 'Banish Chrono Anomaly in Spire',
          done: () => questCounter('quest_stargazer_chronos', 'chronoKills') >= 1,
          counter: () => `${Math.min(1, questCounter('quest_stargazer_chronos', 'chronoKills'))} / 1`,
        },
        {
          text: 'Return to Astromancer Kaelen',
          done: () => Boolean(questCounter('quest_stargazer_chronos', 'aetherFontChannels') >= 1 && questCounter('quest_stargazer_chronos', 'chronoKills') >= 1),
        },
      ],
      rewards: {
        xp: 350,
        glimmer: 120,
        gold: 150,
        professionXp: { resonance_extraction: 60 },
      },
      acceptDialogue: [
        {
          speaker: 'ASTROMANCER KAELEN • MIRRORGATE STARGAZER',
          spriteKey: 'aetherAstromancerNpc',
          text: 'Greetings, traveler! The celestial mirrors resonate tonight. Temporal fractures ripple through the Aether Spire from the Chrono-Archive above! Channel the Mirrorgate Star Font [E] and banish a Chrono Anomaly to stabilize our timeline!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'ASTROMANCER KAELEN • MIRRORGATE STARGAZER',
          spriteKey: 'aetherAstromancerNpc',
          text: 'The temporal rifts still fluctuate! Channel the Mirrorgate Star Font [E] and banish a Chrono Anomaly to calm the spire.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'ASTROMANCER KAELEN • MIRRORGATE STARGAZER',
          spriteKey: 'aetherAstromancerNpc',
          text: 'Magnificent! The mirrors have stabilized, and the celestial resonance sings pure once more. Take this astral reward, Champion of the Continuum!',
        },
      ],
    },

    quest_skill_extraction: {
      id: 'quest_skill_extraction',
      title: 'Resonance: First Extraction',
      giverId: 'merchant_relics',
      turnInId: 'merchant_relics',
      questPoints: 1,
      unlocks: ['Resonance Extraction Lv. 2 Recipes', 'Moira\'s Curio & Relic Trade'],
      description: 'Channel 2 Glimmer or Leyline Nodes around Sanctuary to harvest raw resonant crystals.',
      isComplete: () => questCounter('quest_skill_extraction', 'extractionNodesHarvested') >= 2,
      tasks: [
        {
          text: 'Channel Leyline / Glimmer Nodes',
          done: () => questCounter('quest_skill_extraction', 'extractionNodesHarvested') >= 2,
          counter: () => `${Math.min(2, questCounter('quest_skill_extraction', 'extractionNodesHarvested'))} / 2`,
        },
        {
          text: 'Return to Relic-Seeker Moira',
          done: () => questCounter('quest_skill_extraction', 'extractionNodesHarvested') >= 2,
        },
      ],
      rewards: {
        xp: 180,
        glimmer: 60,
        gold: 120,
        professionXp: { resonance_extraction: 75 },
      },
      acceptDialogue: [
        {
          speaker: 'RELIC-SEEKER MOIRA • AETHER CURIOS',
          spriteKey: 'merchantRelicsNpc',
          text: 'Greetings, traveler! The earth beneath Sanctuary pulses with raw Glimmer. To survive the wild realms, one must learn Resonance Extraction. Step to any Glimmer node or ancient shrine and press [E] to channel its frequency twice. Bring back the resonant crystals!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'RELIC-SEEKER MOIRA • AETHER CURIOS',
          spriteKey: 'merchantRelicsNpc',
          text: 'Channel 2 Glimmer nodes or ancient shrines with [E] to tune your extraction technique! Press [N] anytime to inspect your Skills tab.',
          actions: [
            { label: '🛒 BROWSE WARES & RELICS', action: 'openShop', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
            { label: '👋 I WILL GATHER THEM', action: 'close' },
          ],
        },
      ],
      completeDialogue: [
        {
          speaker: 'RELIC-SEEKER MOIRA • AETHER CURIOS',
          spriteKey: 'merchantRelicsNpc',
          text: 'Incredible resonance! The crystals hum in your hands. You have mastered the fundamentals of Resonance Extraction! Continue tapping nodes across the continent to gather rare gems, leyline essence, and ancient relics.',
          actions: [
            { label: '🛒 BROWSE MOIRA\'S RELICS', action: 'openShop', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
          ],
        },
      ],
    },

    quest_skill_forging: {
      id: 'quest_skill_forging',
      title: 'Forging: The Cosmic Star-Anvil',
      giverId: 'merchant_smith',
      turnInId: 'merchant_smith',
      questPoints: 1,
      unlocks: ['Cosmic Star-Anvil Alloy Recipes', 'Leyline Jewel Cutting'],
      description: 'Mine Sun-Copper & Star-Tin from a world Ore Vein (or buy starter ore from Torvin), then smelt or forge an item at the Cosmic Star-Anvil!',
      isComplete: () => artisanQuestDone('quest_skill_forging', 'smithInspected', ['bronze_bar', 'copper_ring', 'star_iron_bar', 'iron_broadsword', 'iron_heater_shield'], 'relic_forging'),
      tasks: [
        {
          text: 'Smelt an Ingot or Forge Gear at the Cosmic Star-Anvil',
          done: () => artisanQuestDone('quest_skill_forging', 'smithInspected', ['bronze_bar', 'copper_ring', 'star_iron_bar', 'iron_broadsword', 'iron_heater_shield'], 'relic_forging'),
        },
        {
          text: 'Confer with Blacksmith Torvin',
          done: () => artisanQuestDone('quest_skill_forging', 'smithInspected', ['bronze_bar', 'copper_ring', 'star_iron_bar', 'iron_broadsword', 'iron_heater_shield'], 'relic_forging'),
        },
      ],
      rewards: {
        xp: 180,
        glimmer: 50,
        gold: 120,
        professionXp: { relic_forging: 75 },
      },
      acceptDialogue: [
        {
          speaker: 'BLACKSMITH TORVIN • SMITHING & ORE WARES',
          spriteKey: 'merchantSmithNpc',
          text: 'Hmph! Real smiths don\'t pay coin to skip the hammer—they work the Cosmic Star-Anvil right beside my stall! Mine Sun-Copper and Star-Tin from ore veins around Sanctuary (or grab a starter pair from my shop), then smelt a Bronze Bar on the Cosmic Star-Anvil!',
          actions: [
            { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
            { label: '🛒 BUY STARTER ORES', action: 'openShop', style: 'border-color:#38bdf8; color:#7dd3fc;' },
            { label: '👋 I WILL SMELT IT', action: 'close' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'BLACKSMITH TORVIN • SMITHING & ORE WARES',
          spriteKey: 'merchantSmithNpc',
          text: 'Step to the glowing Cosmic Star-Anvil right next to my stall and smelt Sun-Copper + Star-Tin into a Bronze Bar (or forge any metal piece)!',
          actions: [
            { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
            { label: '🛒 BROWSE RAW ORES', action: 'openShop' },
            { label: '👋 FAREWELL', action: 'close' },
          ],
        },
      ],
      completeDialogue: [
        {
          speaker: 'BLACKSMITH TORVIN • SMITHING & ORE WARES',
          spriteKey: 'merchantSmithNpc',
          text: 'Aye, hear the Cosmic Star-Anvil ring! Combine terrestrial ores with astral minerals to smelt Star-Iron, Umbral Steel, Astral Mithril, and Celestial Starmetal—and cut Leyline Socket Gems for your gear!',
          actions: [
            { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
          ],
        },
      ],
    },

    quest_skill_binding: {
      id: 'quest_skill_binding',
      title: 'Binding: The Aetherial Crucible',
      giverId: 'merchant_apothecary',
      turnInId: 'merchant_apothecary',
      questPoints: 1,
      unlocks: ['Aetherial Crucible Elixir Formulas', 'Keystone & Focus Orb Binding'],
      description: 'Forage Sunbloom Herbs (or buy starter herbs from Faye) and brew an elixir at the bubbling Aetherial Crucible!',
      isComplete: () => artisanQuestDone('quest_skill_binding', 'apothecaryInspected', ['minor_healing_salve', 'glimmer_draught', 'major_vitality_elixir', 'astral_battle_tonic'], 'rite_binding'),
      tasks: [
        {
          text: 'Distill a Salve or Draught at the Aetherial Crucible',
          done: () => artisanQuestDone('quest_skill_binding', 'apothecaryInspected', ['minor_healing_salve', 'glimmer_draught', 'major_vitality_elixir', 'astral_battle_tonic'], 'rite_binding'),
        },
        {
          text: 'Confer with Alchemist Faye',
          done: () => artisanQuestDone('quest_skill_binding', 'apothecaryInspected', ['minor_healing_salve', 'glimmer_draught', 'major_vitality_elixir', 'astral_battle_tonic'], 'rite_binding'),
        },
      ],
      rewards: {
        xp: 180,
        glimmer: 50,
        gold: 120,
        professionXp: { rite_binding: 75 },
      },
      acceptDialogue: [
        {
          speaker: 'ALCHEMIST FAYE • APOTHECARY & POTIONS',
          spriteKey: 'merchantApothecaryNpc',
          text: 'Welcome, seeker! True Rite-Binding happens at the bubbling Aetherial Crucible beside my stall. Forage Sunbloom Herbs in Sanctuary or Terra Orchard (or pick up starter herbs from my shelf), then brew a Minor Healing Salve in the Crucible!',
          actions: [
            { label: '⚗️ OPEN AETHERIAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
            { label: '🛒 BUY STARTER HERBS', action: 'openShop', style: 'border-color:#38bdf8; color:#7dd3fc;' },
            { label: '👋 I WILL BREW IT', action: 'close' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'ALCHEMIST FAYE • APOTHECARY & POTIONS',
          spriteKey: 'merchantApothecaryNpc',
          text: 'Click the glowing purple Aetherial Crucible beside my stall to distill herbs and astral dust into salves, tonics, focus orbs, and Mythic Keystones!',
          actions: [
            { label: '⚗️ OPEN AETHERIAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
            { label: '🛒 BROWSE HERBS & POTIONS', action: 'openShop' },
            { label: '👋 FAREWELL', action: 'close' },
          ],
        },
      ],
      completeDialogue: [
        {
          speaker: 'ALCHEMIST FAYE • APOTHECARY & POTIONS',
          spriteKey: 'merchantApothecaryNpc',
          text: 'Exquisite distillation! As your Rite-Binding ascends, you can compound Chrono Overdrive Draughts, Empyrean Nectar, Socket Sapphires, and Mythic Leyline Keystones!',
          actions: [
            { label: '⚗️ OPEN AETHERIAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
          ],
        },
      ],
    },

    quest_skill_weaving: {
      id: 'quest_skill_weaving',
      title: 'Weaving: The Celestial Loom',
      giverId: 'merchant_provisions',
      turnInId: 'merchant_provisions',
      questPoints: 1,
      unlocks: ['Celestial Loom Cloak & Robe Patterns', 'Artisan Banquet Hearth'],
      description: 'Gather Starlight Flax or Sweet Apples and weave a cloak or bake rations at the Celestial Loom & Hearth!',
      isComplete: () => artisanQuestDone('quest_skill_weaving', 'provisionsInspected', ['fresh_crusty_bread', 'linen_traveller_cloak', 'field_rations', 'spiced_orchard_pie'], 'glimmerweaving'),
      tasks: [
        {
          text: 'Weave Cloth or Bake Sustenance at the Celestial Loom',
          done: () => artisanQuestDone('quest_skill_weaving', 'provisionsInspected', ['fresh_crusty_bread', 'linen_traveller_cloak', 'field_rations', 'spiced_orchard_pie'], 'glimmerweaving'),
        },
        {
          text: 'Confer with Farmer Bran',
          done: () => artisanQuestDone('quest_skill_weaving', 'provisionsInspected', ['fresh_crusty_bread', 'linen_traveller_cloak', 'field_rations', 'spiced_orchard_pie'], 'glimmerweaving'),
        },
      ],
      rewards: {
        xp: 180,
        glimmer: 50,
        gold: 120,
        professionXp: { glimmerweaving: 75 },
      },
      acceptDialogue: [
        {
          speaker: 'FARMER BRAN • PROVISIONS & RATIONS',
          spriteKey: 'merchantProvisionsNpc',
          text: 'Good day to ye! Glimmerweaving turns Starlight Flax, Shadow-Silk, and orchard harvest into enchanted cloaks, robes, and hearty feasts right on the Celestial Loom & Hearth beside my stall!',
          actions: [
            { label: '🧵 OPEN CELESTIAL LOOM', action: 'openStation_celestial_loom', style: 'border-color:#4ade80; color:#dcfce7; font-weight:bold;' },
            { label: '🛒 BUY STARTER FLAX & APPLES', action: 'openShop', style: 'border-color:#38bdf8; color:#7dd3fc;' },
            { label: '👋 I WILL WEAVE IT', action: 'close' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'FARMER BRAN • PROVISIONS & RATIONS',
          spriteKey: 'merchantProvisionsNpc',
          text: 'Step to the golden Celestial Loom & Hearth next to my stall to weave a Traveller\'s Cloak or bake Fresh Crusty Bread!',
          actions: [
            { label: '🧵 OPEN CELESTIAL LOOM', action: 'openStation_celestial_loom', style: 'border-color:#4ade80; color:#dcfce7; font-weight:bold;' },
            { label: '🛒 BROWSE FLAX & FRUIT', action: 'openShop' },
            { label: '👋 FAREWELL', action: 'close' },
          ],
        },
      ],
      completeDialogue: [
        {
          speaker: 'FARMER BRAN • PROVISIONS & RATIONS',
          spriteKey: 'merchantProvisionsNpc',
          text: 'Well look at that stitchwork! Keep harvesting Shadow-Silk and Celestial Gossamer across the realms to weave Duskveil Mantles, Mystic Robes, and Starfire Banquets!',
          actions: [
            { label: '🧵 OPEN CELESTIAL LOOM', action: 'openStation_celestial_loom', style: 'border-color:#4ade80; color:#dcfce7; font-weight:bold;' },
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
          ],
        },
      ],
    },

    quest_skill_combat: {
      id: 'quest_skill_combat',
      title: 'Combat: First Blood',
      giverId: 'npc_archon',
      turnInId: 'npc_archon',
      prereqQuestId: 'quest_awakening',
      questPoints: 1,
      unlocks: ['Combat Mastery Lv. 2 Drills', 'Vanguard Sparring Rites'],
      description: 'Prove your combat discipline by banishing 3 foes or landing 15 strikes on a training dummy.',
      isComplete: () => questCounter('quest_skill_combat', 'combatKills') >= 3 || questCounter('quest_skill_combat', 'combatTrainingHits') >= 15,
      tasks: [
        {
          text: 'Banish Hostile Foes (not dummies)',
          done: () => questCounter('quest_skill_combat', 'combatKills') >= 3,
          counter: () => `${Math.min(3, questCounter('quest_skill_combat', 'combatKills'))} / 3`,
        },
        {
          text: 'Strike a Training Dummy',
          done: () => questCounter('quest_skill_combat', 'combatTrainingHits') >= 15,
          counter: () => `${Math.min(15, questCounter('quest_skill_combat', 'combatTrainingHits'))} / 15`,
        },
      ],
      rewards: {
        xp: 220,
        glimmer: 60,
        gold: 100,
        professionXp: { combat_mastery: 75 },
      },
      acceptDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Steel is nothing without discipline. Banish three real foes in the outer realms, or drill your forms against the Sanctuary training dummies, and I will mark your first combat rank. Dummy kills do not count as hostile kills.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Keep your guard high. Three clean kills of real foes or fifteen solid dummy strikes will prove your readiness. Dummy kills do not count toward the kill task.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Good. Your footwork is no longer a liability. Carry that discipline into every fight and your Combat Mastery will grow quickly.',
        },
      ],
    },

    quest_skill_training: {
      id: 'quest_skill_training',
      title: "The Artisan's First Rank",
      giverId: 'npc_aurora',
      turnInId: 'npc_aurora',
      prereqQuestId: 'quest_awakening',
      questPoints: 1,
      unlocks: ['Artisan Training Drills', 'Skill Mentor Guidance'],
      description: 'Raise one artisan profession — Relic-Forging, Rite-Binding, or Glimmerweaving — by 1 level after accepting. Press [N] to open Skills and follow its green HOW TO TRAIN steps.',
      isComplete: () => ARTISAN_PROFESSION_IDS.some((profId) => questProfessionGain('quest_skill_training', profId) >= 1),
      tasks: [
        {
          text: 'Gain 1 Relic-Forging, Rite-Binding, or Glimmerweaving level',
          done: () => ARTISAN_PROFESSION_IDS.some((profId) => questProfessionGain('quest_skill_training', profId) >= 1),
        },
      ],
      rewards: {
        xp: 240,
        glimmer: 80,
        gold: 120,
        professionXp: {
          relic_forging: 75,
          rite_binding: 75,
          glimmerweaving: 75,
        },
      },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'A champion must hone more than the blade. Press [N], click an artisan skill, and read the green HOW TO TRAIN box. Raise Relic-Forging, Rite-Binding, or Glimmerweaving by one level after accepting this task, then return to me. Combat and extraction training do not count for this artisan rank.',
          actions: [
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
            { label: '👋 I WILL START NOW', action: 'close' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Open Skills [N], choose Relic-Forging, Rite-Binding, or Glimmerweaving, and follow its green HOW TO TRAIN box. Only levels gained after you accepted this task count. Combat and extraction training do not count for this artisan rank.',
          actions: [
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
            { label: '👋 I WILL KEEP TRAINING', action: 'close' },
          ],
        },
      ],
      completeDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Your first rank is earned. Keep training, and the artisan masters will open rarer recipes and stronger gear to you.',
          actions: [
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
          ],
        },
      ],
    },

    quest_artisan_capstone: {
      id: 'quest_artisan_capstone',
      title: "The Artisan's Path",
      giverId: 'npc_aurora',
      turnInId: 'npc_aurora',
      prereqQuestIds: ['quest_skill_extraction', 'quest_skill_forging', 'quest_skill_binding', 'quest_skill_weaving'],
      questPoints: 2,
      unlocks: ['Artisan Guild Recognition', 'Master Crafting Commission'],
      description: 'Complete the four artisan initiation trials and prove that every Sanctuary craft is within your reach.',
      isComplete: () => Boolean(
        questState.completedQuests?.quest_skill_extraction &&
        questState.completedQuests?.quest_skill_forging &&
        questState.completedQuests?.quest_skill_binding &&
        questState.completedQuests?.quest_skill_weaving
      ),
      tasks: [
        { text: 'Complete Resonance: First Extraction', done: () => Boolean(questState.completedQuests?.quest_skill_extraction) },
        { text: "Complete Forging: The Anvil's Spark", done: () => Boolean(questState.completedQuests?.quest_skill_forging) },
        { text: 'Complete Binding: The Alchemical Draught', done: () => Boolean(questState.completedQuests?.quest_skill_binding) },
        { text: 'Complete Weaving: The Luminescent Thread', done: () => Boolean(questState.completedQuests?.quest_skill_weaving) },
      ],
      rewards: {
        xp: 800,
        glimmer: 220,
        gold: 300,
        professionXp: {
          resonance_extraction: 40,
          relic_forging: 40,
          rite_binding: 40,
          glimmerweaving: 40,
        },
      },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'You have walked every artisan path: extraction, forging, binding, and weaving. The Guild has taken notice. Accept their recognition and carry the mark of a true maker.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'The four initiation trials are complete. Return to me to claim the Artisan Guild recognition.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'All four crafts now answer to your hand. The Artisan Guild recognizes you as a Master of the Sanctuary trades!',
          actions: [
            { label: '✨ OPEN SKILLS TAB [N]', action: 'openSkills' },
          ],
        },
      ],
    },

    quest_starfall_forge: {
      id: 'quest_starfall_forge',
      title: 'The Fallen Astral Forge',
      giverId: 'npc_orion',
      turnInId: 'npc_orion',
      questPoints: 2,
      unlocks: ['Starfall Astral Forge Mastery', 'Celestial Starmetal Smelting Lore'],
      description: 'In Starfall Crater, shatter 4 Starforged Constructs or Meteor Elementals and mine 2 Astral Mithril or Starmetal veins.',
      isComplete: () => questCounter('quest_starfall_forge', 'starfallKills') >= 4 && questCounter('quest_starfall_forge', 'starfallVeins') >= 2,
      tasks: [
        {
          text: 'Shatter Starfall Constructs or Meteor Elementals',
          done: () => questCounter('quest_starfall_forge', 'starfallKills') >= 4,
          counter: () => `${Math.min(4, questCounter('quest_starfall_forge', 'starfallKills'))} / 4`,
        },
        {
          text: 'Mine Astral Mithril or Starmetal Veins in Crater',
          done: () => questCounter('quest_starfall_forge', 'starfallVeins') >= 2,
          counter: () => `${Math.min(2, questCounter('quest_starfall_forge', 'starfallVeins'))} / 2`,
        },
      ],
      rewards: {
        xp: 850,
        glimmer: 300,
        gold: 360,
        professionXp: { relic_forging: 220, resonance_extraction: 180 },
      },
      acceptDialogue: [
        {
          speaker: 'FORGE-KEEPER ORION • STARFALL CRATER',
          spriteKey: 'solariFlamekeeperNpc',
          text: 'Meteors of pure Celestial Starmetal tore this crater open west of the Golden Citadel! Rogue Starforged Automatons and molten Meteor Elementals guard the veins. Shatter 4 of them and mine 2 crater ore veins so we can reignite the Astral Forge!',
          actions: [
            { label: '🔨 INSPECT ASTRAL STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
            { label: '⚔️ TO THE CRATER!', action: 'close' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'FORGE-KEEPER ORION • STARFALL CRATER',
          spriteKey: 'solariFlamekeeperNpc',
          text: 'Shatter 4 Starfall constructs and mine 2 Mithril or Starmetal veins [E] around the molten basin!',
          actions: [
            { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
            { label: '👋 CONTINUE HUNT', action: 'close' },
          ],
        },
      ],
      completeDialogue: [
        {
          speaker: 'FORGE-KEEPER ORION • STARFALL CRATER',
          spriteKey: 'solariFlamekeeperNpc',
          text: 'By the Morning Star—feel the heat of that Starmetal! The Astral Forge roars anew! Challenge Ignis-Core at the crater heart if you dare claim the Starmetal Meteor Hammer!',
          actions: [
            { label: '🔨 WORK THE ASTRAL FORGE', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
          ],
        },
      ],
    },

    quest_abyssal_breach: {
      id: 'quest_abyssal_breach',
      title: 'Breach of the Void Architect',
      giverId: 'npc_nihilus',
      turnInId: 'npc_nihilus',
      questPoints: 3,
      unlocks: ['Abyssal Rift Vanguard Honor', 'Voidstar Relic Mastery'],
      description: 'Venture into the Abyssal Rift and banish 5 Gloam-Silk Widows, Paradox Sentinels, or Xal\'Korath\'s Voidborne.',
      isComplete: () => questCounter('quest_abyssal_breach', 'abyssalKills') >= 5,
      tasks: [
        {
          text: 'Banish Abyssal Rift Horrors',
          done: () => questCounter('quest_abyssal_breach', 'abyssalKills') >= 5,
          counter: () => `${Math.min(5, questCounter('quest_abyssal_breach', 'abyssalKills'))} / 5`,
        },
      ],
      rewards: {
        xp: 1350,
        glimmer: 450,
        gold: 520,
        professionXp: { combat_mastery: 320, rite_binding: 200 },
      },
      acceptDialogue: [
        {
          speaker: 'RIFT-WATCHER NIHILUS • ABYSSAL RIFT',
          spriteKey: 'shadowWraithmotherNpc',
          text: 'You stand upon the fractured threshold where Xal\'Korath, the Void Architect, unravels reality itself! Banish 5 Rift horrors prowling these obsidian spires before the breach swallows the Caldera!',
          actions: [
            { label: '⚗️ OPEN ABYSSAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
            { label: '⚔️ ENTER THE BREACH', action: 'close' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'RIFT-WATCHER NIHILUS • ABYSSAL RIFT',
          spriteKey: 'shadowWraithmotherNpc',
          text: 'Banish 5 Gloam-Silk Widows or Paradox Sentinels across the Rift—and beware Xal\'Korath at the northern singularity!',
        },
      ],
      completeDialogue: [
        {
          speaker: 'RIFT-WATCHER NIHILUS • ABYSSAL RIFT',
          spriteKey: 'shadowWraithmotherNpc',
          text: 'The singularity recoils before your blade! Take this sovereign bounty—and when your squad is ready, strike down Xal\'Korath for the Abyssal Voidstar Scythe!',
        },
      ],
    },

    quest_crystalheart_shattering: {
      id: 'quest_crystalheart_shattering',
      title: 'The Shattered Crystal Heart',
      giverId: 'npc_aurora',
      turnInId: 'npc_aurora',
      prereqQuestId: 'quest_awakening',
      questPoints: 2,
      unlocks: ['Next Quest: The Great Glimmer Fracture', 'Crystalheart Chronicle Lore'],
      description: 'Discover the foundational origin of the GlimmerFall universe: channel a Glimmer Font [E] and confer with Herald Lyra regarding the Shattered Crystal Heart.',
      isComplete: () => Boolean(questState.nodeHarvested || questCounter('quest_crystalheart_shattering', 'leylineHarvests') >= 1),
      tasks: [
        {
          text: 'Channel a Glimmer Font in Sanctuary [E]',
          done: () => Boolean(questState.nodeHarvested || questCounter('quest_crystalheart_shattering', 'leylineHarvests') >= 1),
        },
        {
          text: 'Confer with Herald Lyra on the Crystal Heart',
          done: () => questNpcTalked('quest_crystalheart_shattering', 'npc_aurora'),
        },
      ],
      rewards: { xp: 450, glimmer: 160, gold: 120 },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Look up into the astral heavens, Summoner. Before the continental realms existed, reality was held in balance by a solitary celestial relic: the Crystal Heart.',
        },
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'It was an iridescent anatomical crystal beating in the silence between the radiant Golden Sun and the abyssal Void. But cosmic discord tore through its chambers. Violet lightning fissures fractured the crystal, and the Crystal Heart shattered into a rain of flaming meteors that formed our continent.',
        },
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Channel one of the Sanctuary Glimmer Fonts [E] to attune your senses to its heartbeat, then speak with me once more!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Channel the glowing Glimmer Font [E] in Sanctuary Plaza. Can you feel the ancient crystalline pulse beneath the stone?',
        },
      ],
      completeDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'You felt it, did you not? The Glimmer singing in your blood is not ordinary magic—it is the living life-blood of the shattered Crystal Heart.',
        },
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'When the Heart broke, the single, unified white light of creation fractured into four distinct elemental splinters. We must inspect these splinters across the realms!',
        },
      ],
      nextQuestId: 'quest_the_four_splinters',
    },

    quest_the_four_splinters: {
      id: 'quest_the_four_splinters',
      title: 'The Great Glimmer Fracture',
      giverId: 'npc_aurora',
      turnInId: 'npc_archon',
      prereqQuestId: 'quest_crystalheart_shattering',
      questPoints: 2,
      unlocks: ['Next Quest: Reforging the Crystal Core', 'Factional Splinter Attunement'],
      description: 'The unified Glimmer split into four elemental aspects during the Crystal Heart fall. Cross an Astral Waygate into the outer realm and banish 3 fractured entities.',
      isComplete: () => Boolean(questState.portalTraveled && questCounter('quest_the_four_splinters', 'warzoneKills') >= 3),
      tasks: [
        {
          text: 'Cross an Astral Waygate into the Outer Realms',
          done: () => Boolean(questState.portalTraveled),
        },
        {
          text: 'Banish 3 Fractured Glimmer Entities',
          done: () => questCounter('quest_the_four_splinters', 'warzoneKills') >= 3,
          counter: () => `${Math.min(3, questCounter('quest_the_four_splinters', 'warzoneKills'))} / 3`,
        },
        {
          text: 'Report to Commander Valerius at North Post',
          done: () => questNpcTalked('quest_the_four_splinters', 'npc_archon'),
        },
      ],
      rewards: { xp: 680, glimmer: 240, gold: 200 },
      acceptDialogue: [
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'As the Crystal Heart fragmented into thousands of falling meteors, the unified light split into four prismatic wavelengths:\n\n☀️ Solari claimed the dawn-fire facets;\n🌑 Umbri channeled the necrotic shadow facets;\n🌿 Terra bound the root and ironwood facets;\n🔮 Aether harnessed the star-weaving chronoflux!',
        },
        {
          speaker: 'HERALD LYRA • SUNSPIRE HERALD',
          spriteKey: 'heraldNpc',
          text: 'Take the Astral Waygate north to the frontier, defeat 3 entities infused with these fractured energies, and report what you find to Commander Valerius!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'The four factions wage war over every fallen shard of the Crystal Heart. Have you crossed the gate and engaged the fractured beasts outside?',
        },
      ],
      completeDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Well fought! You have observed the fracture firsthand. The beasts out there burn with fragmented Glimmer, driven mad by the loss of the primal Heart.',
        },
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Master Artisan Aldric believes we can synthesize and re-harmonize these splinters in the Sanctuary Workshop. Speak with him immediately.',
        },
      ],
      nextQuestId: 'quest_reforge_crystalheart_shard',
    },

    quest_reforge_crystalheart_shard: {
      id: 'quest_reforge_crystalheart_shard',
      title: 'Reforging the Crystal Core',
      giverId: 'npc_artisan_aldric',
      turnInId: 'npc_artisan_aldric',
      prereqQuestId: 'quest_the_four_splinters',
      questPoints: 3,
      unlocks: ['Artisan Master Resonance', 'Harmonic Crystalheart Talisman Recipe'],
      description: 'Master Artisan Aldric has unlocked the secret to channeling the Crystal Heart\'s memory. Respect the 1.25s artisan cadence and craft 2 items at any Artisan Station.',
      isComplete: () => questCounter('quest_reforge_crystalheart_shard', 'craftsCompleted') >= 2,
      tasks: [
        {
          text: 'Perform 2 Artisan Crafts (1.25s cadence)',
          done: () => questCounter('quest_reforge_crystalheart_shard', 'craftsCompleted') >= 2,
          counter: () => `${Math.min(2, questCounter('quest_reforge_crystalheart_shard', 'craftsCompleted'))} / 2`,
        },
        {
          text: 'Consult Artisan Master Aldric in Sanctuary',
          done: () => questNpcTalked('quest_reforge_crystalheart_shard', 'npc_artisan_aldric'),
        },
      ],
      rewards: {
        xp: 850,
        glimmer: 320,
        gold: 260,
        professionXp: { relic_forging: 150, rite_binding: 150, glimmerweaving: 150 },
      },
      acceptDialogue: [
        {
          speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
          spriteKey: 'merchantSmithNpc',
          text: 'Listen closely, Knight! Crafting is not a hurried hacking of buttons. The living remnants of the Crystal Heart beat with an exact frequency: 1.25 seconds per pulse.',
        },
        {
          speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
          spriteKey: 'merchantSmithNpc',
          text: 'Step to the Cosmic Star-Anvil, Aether Crucible, or Celestial Loom. Complete 2 artisan crafts, allowing each 1.25-second cycle to settle properly, and witness how the material harmonizes!',
          actions: [
            { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
            { label: '⚗️ OPEN AETHERIAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff;' },
            { label: '🧵 OPEN CELESTIAL LOOM', action: 'openStation_celestial_loom', style: 'border-color:#38bdf8; color:#bae6fd;' },
          ],
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
          spriteKey: 'merchantSmithNpc',
          text: 'Respect the 1.25-second artisan cadence! Forge or brew 2 items at the station to stabilize your resonance.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
          spriteKey: 'merchantSmithNpc',
          text: 'Masterful work! By honoring the 1.25s cadence of the Crystal Heart, you have created flawless goods free from instability and corruption.',
        },
        {
          speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
          spriteKey: 'merchantSmithNpc',
          text: 'Take this bounty of artisan experience and Glimmer shards. You now walk as a true Guardian of the Crystalheart!',
        },
      ],
    },
  };


export { QUEST_CATALOG };
