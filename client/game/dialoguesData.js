// ==========================================
// GlimmerFall Online — Dialogues & Keybind Constants
// ==========================================

const DEFAULT_KEYBINDS = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  harvest: 'e',
  9: 'q',
  10: 'r',
  11: 'f',
  12: 'z',
};

const PORTAL_ID_TO_ROOM = {
  portal_main: ROOM_TYPES.NEXUS_WARZONE,
  portal_warzone: ROOM_TYPES.NEXUS_WARZONE,
  portal_sanctuary: ROOM_TYPES.SANCTUARY_HUB,
  portal_hub: ROOM_TYPES.SANCTUARY_HUB,
  portal_solari: ROOM_TYPES.SOLARI_CITADEL,
  portal_citadel: ROOM_TYPES.SOLARI_CITADEL,
  portal_umbri: ROOM_TYPES.UMBRI_UNDERCITY,
  portal_undercity: ROOM_TYPES.UMBRI_UNDERCITY,
  portal_terra: ROOM_TYPES.TERRA_ORCHARD,
  portal_orchard: ROOM_TYPES.TERRA_ORCHARD,
  portal_aether: ROOM_TYPES.AETHER_SPIRE,
  portal_spire: ROOM_TYPES.AETHER_SPIRE,
  portal_ruins: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
  portal_solari_vault: ROOM_TYPES.SOLARI_SUNKEN_VAULT,
  portal_umbri_lab: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH,
  portal_terra_sanctuary: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
  portal_aether_archive: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE,
};

const AWAKENING_DIALOGUE = [
  {
    speaker: 'HERALD LYRA • SOLARI SUNSPIRE HERALD',
    spriteKey: 'heraldNpc',
    text: 'Awake at last, Summoner-Knight! Centuries have passed since the Great Nexus shattered between the Glimmer and the Fall, scattering its crystal shards across four warring realms.',
  },
  {
    speaker: 'HERALD LYRA • SOLARI SUNSPIRE HERALD',
    spriteKey: 'heraldNpc',
    text: 'Explore all 4 Faction Biomes around Sanctuary (North, South, East, West). Venture North through Aether Spire into the Forgotten Ruins, customize your Gear [I] & Loadout [👤 HERO], or form a Squad [O]!',
  },
  {
    speaker: 'HERALD LYRA • SOLARI SUNSPIRE HERALD',
    spriteKey: 'heraldNpc',
    text: 'Strike the Dummy with [1] and channel Glimmer with [E]. When you grow stronger, journey North into the high-level Caldera and Celestial Ascent!',
  },
];

const WARZONE_DIALOGUE = [
  {
    speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
    spriteKey: 'warzoneArchonNpc',
    text: 'Welcome to the Nexus Warzone! Every 30 minutes, a Shattered Nexus Shard spawns in the center (or type /siege to rally an instant clash)!',
  },
  {
    speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
    spriteKey: 'warzoneArchonNpc',
    text: 'Defend your Faction’s 25-HP Outpost Nexus, shatter rival Outposts, plant your Order Banner [B] (+1 Power), or venture North into the Forgotten Ruins!',
  },
];

const RUINS_DIALOGUE = [
  {
    speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
    spriteKey: 'cartographerNpc',
    text: 'Hail, seeker of antiquity! You stand at the First Nexus—the ancient axis where Solari, Umbri, Terra, and Aether once convened in unbroken harmony before the Shattering.',
  },
  {
    speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
    spriteKey: 'cartographerNpc',
    text: 'Look beneath your boots: the four quadrant stones converge right here. Beware the sleeping Prismatic Keystone Guardian at the center—vanquishing it yields a legendary omni-relic!',
  },
  {
    speaker: 'ATLAS • KEYSTONE CARTOGRAPHER',
    spriteKey: 'cartographerNpc',
    text: 'High-density Glimmer nodes flourish here. Channel them with [E] to replenish your energy and advance your summoner ranks!',
  },
];

const SOLARI_VAULT_DIALOGUE = [
  {
    speaker: 'PYREMASTER LUCIAN • SUNKEN VAULT FLAMEKEEPER',
    spriteKey: 'solariFlamekeeperNpc',
    text: 'Tread with honor, Knight. This Sunken Vault enshrines the ancient solar pyres that ignited the First Lantern of the Golden Citadel.',
  },
  {
    speaker: 'PYREMASTER LUCIAN • SUNKEN VAULT FLAMEKEEPER',
    spriteKey: 'solariFlamekeeperNpc',
    text: 'Deep within slumbers the Solaris Core Colossus. Defeat this radiant guardian to claim the Sunfire Greatsword and the sacred Dawnfire Crest!',
  },
];

const UMBRI_LABYRINTH_DIALOGUE = [
  {
    speaker: 'WRAITHMOTHER VESPERA • WEAVER OF GRAVEGLASS',
    spriteKey: 'shadowWraithmotherNpc',
    text: 'Hush... do not disturb the Graveglass mists. In this Labyrinth of Shadows, forgotten echoes wander between the twilight and the abyss.',
  },
  {
    speaker: 'WRAITHMOTHER VESPERA • WEAVER OF GRAVEGLASS',
    spriteKey: 'shadowWraithmotherNpc',
    text: 'The Abyssal Devourer lurks at the labyrinth’s dark core. Wield your Umbral Flashes with precision, or forfeit your soul to the void!',
  },
];

const TERRA_GROVE_DIALOGUE = [
  {
    speaker: 'ELDER DRUID SYLVANUS • VOICE OF IRONBARK',
    spriteKey: 'terraElderDruidNpc',
    text: 'Welcome to the Primordial Hollow. Listen to the deep pulse of the mycorrhizal roots humming beneath the emerald moss.',
  },
  {
    speaker: 'ELDER DRUID SYLVANUS • VOICE OF IRONBARK',
    spriteKey: 'terraElderDruidNpc',
    text: 'The ancient Elder Treant, Primordial Ironbark, stands guard over the heartbloom. Fulfill the rites of Terra to earn living Ironbark armor!',
  },
];

const AETHER_ARCHIVE_DIALOGUE = [
  {
    speaker: 'CHRONOS SAGE ZEPHYR • CHRONOCORE ARCHON',
    spriteKey: 'aetherChronosNpc',
    text: 'Greetings across time, Summoner! This fractured archive floats beyond conventional causality, recording every timeline of the Great Nexus.',
  },
  {
    speaker: 'CHRONOS SAGE ZEPHYR • CHRONOCORE ARCHON',
    spriteKey: 'aetherChronosNpc',
    text: 'The Continuum Singularity at the center bends cooldowns and gravitational planes. Strike decisively before temporal paradoxes engulf the chamber!',
  },
];

const SOLARI_CITADEL_DIALOGUE = [
  {
    speaker: 'CAPTAIN VAELEN • LANTERN DISTRICT TEMPLAR',
    spriteKey: 'solariCaptainNpc',
    text: 'Glory to the Dawn! The Lantern District stands as an unyielding fortress against the dark. The north portal leads into our deepest Sunken Vault!',
  },
];

const UMBRI_UNDERCITY_DIALOGUE = [
  {
    speaker: 'SHADOW BROKER NYX • DUSKVEIL SMUGGLER',
    spriteKey: 'shadowBrokerNpc',
    text: 'Keep your voice down, friend... The north Gloomgate leads straight to the Shadow Labyrinth. Few who enter return unchanged.',
  },
];

const TERRA_ORCHARD_DIALOGUE = [
  {
    speaker: 'GROVE TENDER ROWAN • ROOTDEEP HERBALIST',
    spriteKey: 'terraHerbalistNpc',
    text: 'May the canopy shelter you! The north Waygate connects directly to the Primordial Hollow where ancient Ironbark treants slumber.',
  },
];

const AETHER_SPIRE_DIALOGUE = [
  {
    speaker: 'ASTROMANCER KAELEN • MIRRORGATE STARGAZER',
    spriteKey: 'aetherAstromancerNpc',
    text: 'The celestial mirrors resonate tonight! Ascend to the north rift to enter the Fractured Chrono-Archive and witness the Continuum.',
  },
];

const CELESTIAL_ASCENT_DIALOGUE = [
  {
    speaker: 'GRAND ARBITER AURELIA • EMPYREAN TITAN KEEPER',
    spriteKey: 'celestialArbiterNpc',
    text: 'Halt, mortal Summoner! You tread upon the Celestial Ascent—the sacred mountain terrace forged by the Ancient Titans before the Shattering.',
  },
  {
    speaker: 'GRAND ARBITER AURELIA • EMPYREAN TITAN KEEPER',
    spriteKey: 'celestialArbiterNpc',
    text: 'At the northern summit slumbers Aurelius the Empyrean Sovereign, corrupted by encroaching void rifts. Ascend the starlight terraces, attune the Morning Star fonts, and cleanse the Titan’s throne!',
  },
];


export {
  DEFAULT_KEYBINDS,
  PORTAL_ID_TO_ROOM,
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
};
