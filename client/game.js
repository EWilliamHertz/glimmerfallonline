// ==========================================
// GlimmerFall Online 2D — Top-Down Pixel Art MMORPG Client Engine
// Real-Time Realm Sync + Persistent Cloud Roster + All 4 Factions
// ==========================================

import { PixelSoundEngine } from './audio.js';
import {
  buildSpriteSheet,
  pixelateCardImage,
  getOrderBannerSprites,
  getCharacterSprites,
} from './sprites.js';
import { MultiplayerClient } from './network.js';
import { initTouchControls, updateTouchUiButtons, toggleTouchControls } from './touch.js';
import { FrontpageController, renderInGamePaperdollModal } from './frontpage.js';
import {
  drawPixelNameplateAndBubbles,
  renderPartyHud,
  renderAccountModal,
  renderSocialModal,
} from './socialUi.js';
import {
  TILE_SIZE,
  YARD_PX,
  ACTION_SLOTS,
  SLOT_UNLOCK_LEVELS,
  isSlotUnlocked,
  ROOM_TYPES,
  ROOM_CONFIGS,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  ABILITIES_CATALOG,
  EMOTES_CATALOG,
  getSlotAbilitySpec,
  getAbilityRank,
  canUpgradeAbility,
  getRankStats,
  getEffectiveStats,
  createDefaultProgression,
  xpForNextLevel,
  MAX_BASE_LEVEL,
  PARAGON_AFFINITIES,
  paragonXpForLevel,
  canUpgradeParagon,
  TORMENT_LEVELS,
  getTormentConfig,
  calcMaxHp,
  calcMaxGlimmer,
  calcCritChance,
  calcCdMult,
  calcCastSpeedMult,
  calcCritDamageMult,
  calcDodgeChance,
  calcDamageReduction,
  calcLifeLeechPct,
  calcHpRegenPerSec,
  calcHolyRadianceBurstDmg,
  calcMoveSpeedMult,
  isWaterTile,
} from '../shared/protocol.js';

const DEFAULT_KEYBINDS = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
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

export function initGame() {
  const audio = new PixelSoundEngine();
  const sprites = buildSpriteSheet();

  document.querySelectorAll('canvas[data-card-url]').forEach((cv) => {
    pixelateCardImage(cv.getAttribute('data-card-url'), cv);
  });

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimap-canvas');
  const mmCtx = minimapCanvas.getContext('2d');
  const fctContainer = document.getElementById('fct-container');

  let zoom = 3;
  try {
    const savedZoom = parseInt(localStorage.getItem('glimmerfall_pixel_zoom'), 10);
    if (savedZoom >= 2 && savedZoom <= 4) zoom = savedZoom;
  } catch (_) {}
  let viewW = 320;
  let viewH = 180;

  function setPixelZoom(val) {
    zoom = Math.max(2, Math.min(4, Math.round(val)));
    try {
      localStorage.setItem('glimmerfall_pixel_zoom', String(zoom));
    } catch (_) {}
    resizeCanvas();
    const zBtn = document.getElementById('zoom-label');
    if (zBtn) zBtn.innerText = `${zoom}x`;
  }

  function resizeCanvas() {
    viewW = Math.max(240, Math.ceil(window.innerWidth / zoom));
    viewH = Math.max(160, Math.ceil(window.innerHeight / zoom));
    canvas.width = viewW;
    canvas.height = viewH;
    ctx.imageSmoothingEnabled = false;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  const initialZoomBtn = document.getElementById('zoom-label');
  if (initialZoomBtn) initialZoomBtn.innerText = `${zoom}x`;

  const camera = { x: 0, y: 0 };
  let currentZone = 'tutorial';
  let currentRoomType = ROOM_TYPES.SANCTUARY_HUB;
  let currentBiomeTheme = 'sanctuary';
  let currentRoomId = 'sanctuary_hub_1';
  let currentRoomMax = 60;
  let onlineTotal = 1;
  let publicRoomsList = [];
  const mapBounds = { halfW: 384, halfH: 384 };
  let portalCooldown = 0;
  let portalMistTimer = 0;
  let currentEpoch = 1;

  function triggerPortalMist(duration = 0.5) {
    portalMistTimer = duration;
    const fx = document.getElementById('portal-mist-fx');
    if (fx) {
      fx.classList.add('active');
      clearTimeout(fx._mistTimeout);
      fx._mistTimeout = setTimeout(() => {
        fx.classList.remove('active');
      }, duration * 1000);
    }
  }

  // ==========================================
  // Progression, Class, Loadout & Equipment State
  // ==========================================
  let prog = createDefaultProgression();
  try {
    const savedProg = localStorage.getItem('glimmerfall_prog_v2');
    if (savedProg) {
      const parsed = JSON.parse(savedProg);
      prog = {
        ...createDefaultProgression(),
        ...parsed,
        stats: { ...createDefaultProgression().stats, ...(parsed.stats || {}) },
        ranks: { ...createDefaultProgression().ranks, ...(parsed.ranks || {}) },
      };
    }
  } catch (_) {}

  let localProfile = {
    id: 'local_hero',
    username: null,
    displayName: 'Solari Vanguard',
    isGuest: true,
    tcgLinked: false,
    tcgHandle: null,
    faction: 'Solari',
    classId: 'solari_vanguard',
    loadout: { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout },
    equipment: { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment },
    orderTag: 'SUN',
    orderName: 'Order of Dawn',
    orderColor: '#facc15',
    statsMeta: { kills: 0, arenaWins: 0 },
  };

  function saveProgressionLocal() {
    try {
      localStorage.setItem('glimmerfall_prog_v2', JSON.stringify(prog));
      if (isSinglePlayer && localProfile?.id) {
        const raw = localStorage.getItem('glimmerfall_sp_roster_v2');
        const roster = raw ? JSON.parse(raw) : [];
        const idx = roster.findIndex((c) => c.id === localProfile.id);
        if (idx >= 0) {
          roster[idx].progression = prog;
          roster[idx].equipment = localProfile.equipment;
          roster[idx].loadout = localProfile.loadout;
          localStorage.setItem('glimmerfall_sp_roster_v2', JSON.stringify(roster));
        }
      }
    } catch (_) {}
  }

  // Single Player (Offline Local Realm) vs Multiplayer (Online Authoritative Realm)
  let isSinglePlayer = false;

  const player = {
    x: 0,
    y: 96,
    z: 0,
    vz: 0,
    dir: 'up',
    team: null,
    hp: calcMaxHp(prog, localProfile.equipment, localProfile.classId),
    maxHp: calcMaxHp(prog, localProfile.equipment, localProfile.classId),
    shield: 0,
    solarCharge: 0,
    maxSolarCharge: calcMaxGlimmer(prog, localProfile.equipment, localProfile.classId),
    baseSpeed: 96,
    sprintMult: 1.55,
    isMoving: false,
    walkTimer: 0,
    slashTimer: 0,
    slashAngle: -Math.PI / 2,
    isDead: false,
    stealthed: false,
    zenith: false,
    thornbark: false,
    frozen: false,
    bubble: null,
    bubbleTimer: 0,
    emote: null,
    emoteTimer: 0,
  };

  const remotePlayers = new Map();
  let currentParty = null;
  let pendingPartyInvite = null;
  let accountAuthTab = 'register';
  let accountStatusMsg = '';
  let chatChannel = 'say';
  let activeChatFilter = 'all';

  const cooldowns = { 1: 0, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 };

  let entities = [];
  let npcs = [];
  let allies = [];
  let props = [];
  let projectiles = [];
  let groundZones = [];
  let worldBanners = [];
  let lootDrops = [];
  let particles = [];
  let afterimages = [];
  let slashArcs = [];
  let skyBeams = [];

  let currentTarget = null;
  let isQueueing = false;
  let queueTimer = null;
  let isCasting = false;
  let castProgress = 0;
  let castDuration = 0;
  let currentSpell = null;
  let globalTime = 0;
  let footstepAccum = 0;
  let moveSyncAccum = 0;
  let lastSentMove = { x: null, y: null, z: null, dir: null, isMoving: null, time: 0 };

  let activeDialoguePages = [];
  let dialogueIdx = 0;
  let activeDialogueSpriteKey = 'heraldNpc';
  let activeDialogueNpcId = null;
  let introShown = false;

  // ==========================================
  // MMORPG Quest & State Persistence Engine
  // ==========================================
  let questState = {
    stasisBroken: false,
    dummyDamaged: false,
    nodeHarvested: false,
    portalTraveled: false,
    warzoneKills: 0,
    ruinsKills: 0,
    calderaKills: 0,
    titanChallenged: false,
    ascentReached: false,
    visitedBiomes: {},
    activeQuests: {},
    trackedQuests: {},
    completedQuests: {},
    talkedNpcs: {},
    introShown: false,
  };

  function getQuestStorageKey() {
    const id = localProfile?.id || (localProfile?.displayName ? `${localProfile.faction}_${localProfile.displayName}` : 'default');
    return `glimmerfall_quest_state_${id}`;
  }

  function saveQuestState() {
    try {
      const key = getQuestStorageKey();
      localStorage.setItem(key, JSON.stringify(questState));
      if (isSinglePlayer && localProfile?.id) {
        const raw = localStorage.getItem('glimmerfall_sp_roster_v2');
        if (raw) {
          const roster = JSON.parse(raw);
          const idx = roster.findIndex((c) => c.id === localProfile.id);
          if (idx >= 0) {
            roster[idx].questState = questState;
            localStorage.setItem('glimmerfall_sp_roster_v2', JSON.stringify(roster));
          }
        }
      }
    } catch (_) {}
  }

  function loadQuestState() {
    try {
      const key = getQuestStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        questState = {
          stasisBroken: Boolean(parsed.stasisBroken),
          dummyDamaged: Boolean(parsed.dummyDamaged),
          nodeHarvested: Boolean(parsed.nodeHarvested),
          portalTraveled: Boolean(parsed.portalTraveled),
          warzoneKills: Number(parsed.warzoneKills || 0),
          ruinsKills: Number(parsed.ruinsKills || 0),
          calderaKills: Number(parsed.calderaKills || 0),
          titanChallenged: Boolean(parsed.titanChallenged),
          ascentReached: Boolean(parsed.ascentReached),
          visitedBiomes: parsed.visitedBiomes || {},
          activeQuests: parsed.activeQuests || {},
          trackedQuests: parsed.trackedQuests || {},
          completedQuests: parsed.completedQuests || {},
          talkedNpcs: parsed.talkedNpcs || {},
          introShown: Boolean(parsed.introShown),
        };
      } else {
        const isExperienced = (prog.level || 1) >= 2 || (prog.xp || 0) > 0;
        questState = {
          stasisBroken: isExperienced,
          dummyDamaged: isExperienced,
          nodeHarvested: isExperienced,
          portalTraveled: isExperienced,
          warzoneKills: 0,
          ruinsKills: 0,
          calderaKills: 0,
          titanChallenged: false,
          ascentReached: false,
          visitedBiomes: {},
          activeQuests: isExperienced ? { quest_into_the_warzone: { accepted: true } } : {},
          trackedQuests: isExperienced ? { quest_into_the_warzone: true } : {},
          completedQuests: isExperienced ? { quest_awakening: true } : {},
          talkedNpcs: isExperienced ? { npc_aurora: true } : {},
          introShown: isExperienced,
        };
        saveQuestState();
      }
    } catch (_) {}

    // By default, any active quest without explicit false is tracked
    if (!questState.trackedQuests || Object.keys(questState.trackedQuests).length === 0) {
      questState.trackedQuests = {};
      for (const qId of Object.keys(questState.activeQuests || {})) {
        questState.trackedQuests[qId] = true;
      }
    }

    introShown = questState.introShown || Boolean(questState.talkedNpcs?.npc_aurora);
    updateQuestTrackerHUD();
  }

  // Backward compatibility proxy for any direct references to 'quests'
  const quests = {
    get moved() { return questState.stasisBroken; },
    set moved(val) { questState.stasisBroken = Boolean(val); },
    get damaged() { return questState.dummyDamaged; },
    set damaged(val) { questState.dummyDamaged = Boolean(val); },
    get harvested() { return questState.nodeHarvested; },
    set harvested(val) { questState.nodeHarvested = Boolean(val); },
    get portalReady() { return questState.portalTraveled; },
    set portalReady(val) { questState.portalTraveled = Boolean(val); },
  };

  const QUEST_CATALOG = {
    quest_awakening: {
      id: 'quest_awakening',
      title: 'Awakening from Stasis',
      giverId: 'npc_aurora',
      turnInId: 'npc_aurora',
      description: 'Break stasis by moving [WASD], strike the training dummy [1], and channel the Glimmer Node [E].',
      isComplete: () => Boolean(questState.stasisBroken && questState.dummyDamaged && questState.nodeHarvested),
      tasks: [
        { text: 'Break stasis: Move [WASD]', done: () => Boolean(questState.stasisBroken) },
        { text: 'Cast Flare Strike [1] on Dummy', done: () => Boolean(questState.dummyDamaged) },
        { text: 'Channel Glimmer Node [E]', done: () => Boolean(questState.nodeHarvested) },
      ],
      rewards: { xp: 120, glimmer: 60 },
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
      description: 'Report to Commander Valerius at the North Vanguard Post.',
      isComplete: () => true,
      tasks: [
        { text: 'Report to Commander Valerius', done: () => Boolean(questState.completedQuests.quest_into_the_warzone) },
      ],
      rewards: { xp: 160, glimmer: 80 },
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
      description: 'Banish 3 Void foes roaming outside the Sanctuary.',
      isComplete: () => (questState.warzoneKills || 0) >= 3,
      tasks: [
        {
          text: 'Banish Hostile Foes',
          done: () => (questState.warzoneKills || 0) >= 3,
          counter: () => `${Math.min(3, questState.warzoneKills || 0)} / 3`,
        },
      ],
      rewards: { xp: 320, glimmer: 150 },
      acceptDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Void entities stalk outside our gates. Step into any outer domain, cut down 3 foes, and report back to prove your steel!',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Keep hunting, soldier! The void creeps ever closer until all 3 threats are banished.',
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
      description: 'Banish 2 ruin horrors in the Forgotten First Nexus Ruins.',
      isComplete: () => (questState.ruinsKills || 0) >= 2,
      tasks: [
        {
          text: 'Banish Ancient Ruin Horrors',
          done: () => (questState.ruinsKills || 0) >= 2,
          counter: () => `${Math.min(2, questState.ruinsKills || 0)} / 2`,
        },
      ],
      rewards: { xp: 450, glimmer: 200 },
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
      description: 'Venture into the Continental Nexus Caldera Torment Realm and vanquish a Torment foe or contest an Outpost.',
      isComplete: () => Boolean((questState.calderaKills || 0) >= 1 || (questState.warzoneKills || 0) >= 4),
      tasks: [
        {
          text: 'Vanquish a Torment Caldera foe',
          done: () => Boolean((questState.calderaKills || 0) >= 1 || (questState.warzoneKills || 0) >= 4),
          counter: () => `${Math.min(1, (questState.calderaKills || 0) + ((questState.warzoneKills || 0) >= 4 ? 1 : 0))} / 1`,
        },
      ],
      rewards: { xp: 600, glimmer: 300 },
      acceptDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Beyond the Forgotten Ruins lies the Continental Caldera—a brutal Torment Realm where foes possess ten times their normal strength! Enter the Caldera and strike down a Torment creature to prove your mastery.',
        },
      ],
      ongoingDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Steel your resolve in the Caldera! The Torment foes hit hard, but the rewards are unmatched.',
        },
      ],
      completeDialogue: [
        {
          speaker: 'COMMANDER VALERIUS • SUNSPIRE WARLORD',
          spriteKey: 'warzoneArchonNpc',
          text: 'Triumph in the Caldera! You have conquered the Torment Realm and stood against the continental horde! Take this Grand Vanguard Cache!',
        },
      ],
    },

    quest_celestial_ascent: {
      id: 'quest_celestial_ascent',
      title: 'Ascent to the Empyrean',
      giverId: 'npc_atlas',
      turnInId: 'npc_aurelia',
      prereqQuestId: 'quest_first_nexus',
      description: 'Climb past the northern boundary of the Continental Caldera and seek Grand Arbiter Aurelia at the Celestial Ascent.',
      isComplete: () => Boolean(questState.ascentReached || currentRoomType === ROOM_TYPES.CELESTIAL_ASCENT),
      tasks: [
        {
          text: 'Reach the Celestial Ascent Summit',
          done: () => Boolean(questState.ascentReached || currentRoomType === ROOM_TYPES.CELESTIAL_ASCENT),
        },
      ],
      rewards: { xp: 750, glimmer: 350 },
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
      description: 'Challenge Aurelius the Empyrean Sovereign at the Northern Summit Throne.',
      isComplete: () => Boolean(questState.titanChallenged),
      tasks: [
        {
          text: 'Strike Aurelius the Empyrean Sovereign',
          done: () => Boolean(questState.titanChallenged),
        },
      ],
      rewards: { xp: 1200, glimmer: 500 },
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
      description: 'Attune to the leylines of all 4 elemental domains: Solari, Umbri, Terra, and Aether.',
      isComplete: () => Boolean(
        questState.visitedBiomes?.solari &&
        questState.visitedBiomes?.umbri &&
        questState.visitedBiomes?.terra &&
        questState.visitedBiomes?.aether
      ),
      tasks: [
        { text: 'Visit Solari Sun-Citadel (West)', done: () => Boolean(questState.visitedBiomes?.solari) },
        { text: 'Visit Umbri Undercity (East)', done: () => Boolean(questState.visitedBiomes?.umbri) },
        { text: 'Visit Terra Ironwood Wilds (South)', done: () => Boolean(questState.visitedBiomes?.terra) },
        { text: 'Visit Aether Astral Spire (North)', done: () => Boolean(questState.visitedBiomes?.aether) },
      ],
      rewards: { xp: 500, glimmer: 250 },
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
  };

  function getNpcName(npcId) {
    const map = {
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
    };
    return map[npcId] || 'Quest Giver';
  }

  function getNpcQuestStatus(npc) {
    if (!npc) return 'none';
    const npcId = npc.id;

    // 1. Check for ANY finished quest ready to turn in to THIS npc
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.turnInId === npcId) {
        const isCompleted = Boolean(questState.completedQuests[qId]);
        const isActive = Boolean(questState.activeQuests[qId]);
        if (!isCompleted) {
          if (isActive && q.isComplete()) return 'finished';
          if (qId === 'quest_awakening' && q.isComplete()) return 'finished';
        }
      }
    }

    // 2. Check for ongoing (in-progress) quests to turn in to THIS npc
    for (const qId of Object.keys(questState.activeQuests)) {
      const q = QUEST_CATALOG[qId];
      if (q && q.turnInId === npcId) {
        if (!q.isComplete()) return 'ongoing';
      }
    }

    // 3. Check for available quests that THIS npc gives
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.giverId === npcId) {
        const isCompleted = Boolean(questState.completedQuests[qId]);
        const isActive = Boolean(questState.activeQuests[qId]);
        const prereqMet = !q.prereqQuestId || Boolean(questState.completedQuests[q.prereqQuestId]);
        if (!isCompleted && !isActive && prereqMet) return 'available';
      }
    }

    // 4. Check if this is an NPC who hasn't been talked to yet
    if (!questState.talkedNpcs[npcId]) {
      return 'talk_available';
    }

    // 5. Otherwise, nothing above their head
    return 'none';
  }

  function getFinishedQuestForNpc(npcId) {
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.turnInId === npcId) {
        const isCompleted = Boolean(questState.completedQuests[qId]);
        const isActive = Boolean(questState.activeQuests[qId]);
        if (!isCompleted) {
          if (isActive && q.isComplete()) return q;
          if (qId === 'quest_awakening' && q.isComplete()) return q;
        }
      }
    }
    return null;
  }

  function getAvailableQuestForNpc(npcId) {
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.giverId === npcId) {
        const isCompleted = Boolean(questState.completedQuests[qId]);
        const isActive = Boolean(questState.activeQuests[qId]);
        const prereqMet = !q.prereqQuestId || Boolean(questState.completedQuests[q.prereqQuestId]);
        if (!isCompleted && !isActive && prereqMet) return q;
      }
    }
    return null;
  }

  function getOngoingQuestForNpc(npcId) {
    for (const qId of Object.keys(questState.activeQuests)) {
      const q = QUEST_CATALOG[qId];
      if (q && q.turnInId === npcId) {
        if (!q.isComplete()) return q;
      }
    }
    for (const qId of Object.keys(questState.activeQuests)) {
      const q = QUEST_CATALOG[qId];
      if (q && q.giverId === npcId && !q.isComplete()) return q;
    }
    return null;
  }

  function completeQuest(quest, npc) {
    questState.completedQuests[quest.id] = true;
    delete questState.activeQuests[quest.id];
    questState.talkedNpcs[npc.id] = true;

    if (quest.rewards?.xp) awardXP(quest.rewards.xp, quest.title);
    if (quest.rewards?.glimmer) {
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + quest.rewards.glimmer);
    }

    spawnSparkBurst(player.x, player.y - 10, ['#fde047', '#ffffff', '#38bdf8', '#86efac'], 20);
    spawnFCT(player.x, player.y - 16, `✨ QUEST COMPLETE: ${quest.title.toUpperCase()}!`, '#facc15', true);
    logMessage(`[Quest Complete] ${quest.title} finished! Received +${quest.rewards.xp} XP and +${quest.rewards.glimmer || 0} Glimmer!`, 'log-quest');

    if (quest.nextQuestId && QUEST_CATALOG[quest.nextQuestId]) {
      const nextQ = QUEST_CATALOG[quest.nextQuestId];
      questState.activeQuests[nextQ.id] = { accepted: true, acceptedAt: Date.now() };
    }

    saveQuestState();
    updateQuestTrackerHUD();
    openDialogue(quest.completeDialogue || npc.dialogue, npc.spriteKey, npc.id);
  }

  function acceptQuest(quest, npc) {
    questState.activeQuests[quest.id] = { accepted: true, acceptedAt: Date.now() };
    questState.talkedNpcs[npc.id] = true;

    spawnFCT(player.x, player.y - 16, `📜 ACCEPTED: ${quest.title.toUpperCase()}`, '#38bdf8', true);
    logMessage(`[Quest Accepted] ${quest.title}: ${quest.description}`, 'log-quest');

    saveQuestState();
    updateQuestTrackerHUD();
    openDialogue(quest.acceptDialogue || npc.dialogue, npc.spriteKey, npc.id);
  }

  function interactWithNpc(npc) {
    if (!npc) return;
    audio.playDialogue();
    const status = getNpcQuestStatus(npc);

    if (status === 'finished') {
      const q = getFinishedQuestForNpc(npc.id);
      if (q) {
        completeQuest(q, npc);
        return;
      }
    }

    if (status === 'available') {
      const q = getAvailableQuestForNpc(npc.id);
      if (q) {
        acceptQuest(q, npc);
        return;
      }
    }

    if (status === 'ongoing') {
      const q = getOngoingQuestForNpc(npc.id);
      if (q && q.ongoingDialogue) {
        openDialogue(q.ongoingDialogue, npc.spriteKey, npc.id);
        return;
      }
    }

    // Lore / Standard dialogue
    questState.talkedNpcs[npc.id] = true;
    saveQuestState();
    openDialogue(npc.dialogue, npc.spriteKey, npc.id);
    updateQuestTrackerHUD();
  }

  // ==========================================
  // Continental Atlas & Regions Data
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
        { x: 50, y: 34, icon: '🛡️', name: 'Herald Lyra', sub: 'Sunspire Mentor', desc: 'Awakening guide and primary quest mentor.' },
        { x: 50, y: 58, icon: '🎯', name: 'Training Grounds', sub: 'Sanctuary Dummies', desc: 'Training posts for honing Rites and Flashes.' },
        { x: 28, y: 46, icon: '💎', name: 'Awakening Glimmer Font', sub: 'Leyline Font [E]', desc: 'Channel with [E] to replenish energy.' },
        { x: 72, y: 46, icon: '💎', name: 'East Glimmer Font', sub: 'Leyline Font [E]', desc: 'Channel with [E] to replenish energy.' },
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
        north: null,
        south: null,
        west: null,
        east: 'SANCTUARY_HUB'
      },
      landmarks: [
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
        east: null
      },
      landmarks: [
        { x: 50, y: 30, icon: '🗿', name: 'The Prismatic Golem', sub: '★ Lv.7 First Nexus Guardian', desc: 'Ancient megalith guarding quadrant runestones.' },
        { x: 50, y: 68, icon: '📜', name: 'Atlas the Cartographer', sub: 'Keystone Seeker NPC', desc: 'Ancient surveyor mapping continental leylines.' },
        { x: 30, y: 50, icon: '👾', name: 'Corrupted Stalkers', sub: 'Lv.4 Keystone Constructs', desc: 'Lingering void constructs around ruined pillars.' },
        { x: 70, y: 50, icon: '💎', name: 'Prismatic Leyline Node', sub: 'Glimmer Font [E]', desc: 'Omni-resonance energy node.' },
        { x: 50, y: 8, icon: '▲', name: 'Torment Boundary Gate', sub: 'To Continental Caldera [North]', desc: 'Walk North across the Torment threshold.' },
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
      sub: 'Torment Realm • Continental Warzone',
      level: 'Lv. 30+',
      dangerTag: 'TORMENT REALM • 10× STATS',
      color: '#f97316',
      borderColor: '#fdba74',
      faction: '⚔️ Contested All-Faction Warzone',
      desc: 'A massive 4800×3600 continental warzone where rival factions fight for domination. All creatures possess 10× health and damage in this brutal Torment Realm!',
      gridPos: { col: 1, row: 1 },
      neighbors: {
        north: 'CELESTIAL_ASCENT',
        south: 'NEXUS_FORGOTTEN_RUINS',
        west: null,
        east: null
      },
      landmarks: [
        { x: 50, y: 45, icon: '🌋', name: 'Shattered Nexus Shard', sub: 'Continental Siege Objective', desc: '30-minute continental siege shard granting +250 XP.' },
        { x: 25, y: 30, icon: '⚔️', name: 'Terra Forest Outpost', sub: '300 HP Strategic Outpost', desc: 'Green faction capture point.' },
        { x: 75, y: 30, icon: '⚔️', name: 'Umbri Shadow Outpost', sub: '300 HP Strategic Outpost', desc: 'Purple faction capture point.' },
        { x: 25, y: 70, icon: '⚔️', name: 'Solari Radiant Outpost', sub: '300 HP Strategic Outpost', desc: 'Gold faction capture point.' },
        { x: 75, y: 70, icon: '⚔️', name: 'Aether Astral Outpost', sub: '300 HP Strategic Outpost', desc: 'Cyan faction capture point.' },
        { x: 50, y: 80, icon: '🛡️', name: 'Commander Valerius', sub: 'Vanguard Outpost Commander', desc: 'Directs frontline continental bounties.' },
        { x: 50, y: 8, icon: '▲', name: 'Ascent Mountain Colonnade', sub: 'To Celestial Titan Summit [North]', desc: 'Walk North through the Ascent Gate.' },
        { x: 50, y: 92, icon: '▼', name: 'Torment Boundary Gate', sub: 'To Forgotten Ruins [South]', desc: 'Walk South back to Forgotten Ruins.' }
      ],
      entities: [
        { name: 'Torment Void Fiends', type: 'Torment Mob', hp: '340 – 420 HP', desc: 'Vicious stalkers dealing 24-28 damage.' },
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
    }
  };

  let currentLoreTab = 'quests';
  let currentAtlasView = 'square'; // 'square' | 'grid'
  let selectedMapRegionId = 'SANCTUARY_HUB';
  let edgeScrollTimer = null;

  window.switchLoreTab = function (tab) {
    currentLoreTab = tab;
    renderLoreModal();
  };

  window.openQuestLog = function () {
    currentLoreTab = 'quests';
    if (document.getElementById('lore-modal')?.style.display !== 'block') {
      window.toggleModal('lore-modal');
    }
    renderLoreModal();
  };

  window.openWorldMap = function () {
    currentLoreTab = 'map';
    if (WORLD_ATLAS_REGIONS[currentRoomType]) {
      selectedMapRegionId = currentRoomType;
    }
    if (document.getElementById('lore-modal')?.style.display !== 'block') {
      window.toggleModal('lore-modal');
    }
    renderLoreModal();
  };

  window.toggleWorldAtlas = function () {
    const modal = document.getElementById('lore-modal');
    if (modal && modal.style.display === 'block' && currentLoreTab === 'map') {
      window.toggleModal('lore-modal');
    } else {
      window.openWorldMap();
    }
  };

  window.setAtlasViewMode = function (mode) {
    currentAtlasView = mode;
    const body = document.getElementById('lore-modal-body');
    if (body && currentLoreTab === 'map') {
      renderWorldAtlasView(body);
    }
  };

  window.centerMapOnPlayer = function () {
    if (WORLD_ATLAS_REGIONS[currentRoomType]) {
      window.selectMapRegion(currentRoomType, true);
    }
  };

  window.edgeHoverScroll = function (direction) {
    if (edgeScrollTimer) clearTimeout(edgeScrollTimer);
    const reg = WORLD_ATLAS_REGIONS[selectedMapRegionId];
    if (!reg || !reg.neighbors || !reg.neighbors[direction]) return;
    const targetId = reg.neighbors[direction];
    edgeScrollTimer = setTimeout(() => {
      window.selectMapRegion(targetId, true);
    }, 200);
  };

  window.cancelEdgeHoverScroll = function () {
    if (edgeScrollTimer) {
      clearTimeout(edgeScrollTimer);
      edgeScrollTimer = null;
    }
  };

  window.selectMapRegion = function (regId, playSound = false) {
    if (!WORLD_ATLAS_REGIONS[regId]) return;
    selectedMapRegionId = regId;
    if (playSound && audio && audio.playChime) {
      audio.playChime();
    }
    const body = document.getElementById('lore-modal-body');
    if (body && currentLoreTab === 'map') {
      renderWorldAtlasView(body);
    }
  };

  window.inspectMapRegion = function (regId) {
    window.selectMapRegion(regId, false);
  };

  window.toggleQuestTracking = function (qId) {
    if (!questState.trackedQuests) questState.trackedQuests = {};
    const currentlyTracked = questState.trackedQuests[qId] !== false;
    questState.trackedQuests[qId] = !currentlyTracked;
    saveQuestState();
    updateQuestTrackerHUD();
    renderLoreModal();
  };

  window.setAllQuestTracking = function (track) {
    if (!questState.trackedQuests) questState.trackedQuests = {};
    for (const qId of Object.keys(questState.activeQuests || {})) {
      questState.trackedQuests[qId] = Boolean(track);
    }
    saveQuestState();
    updateQuestTrackerHUD();
    renderLoreModal();
  };

  function getRegionInspectorHtml(regId) {
    const reg = WORLD_ATLAS_REGIONS[regId] || WORLD_ATLAS_REGIONS.SANCTUARY_HUB;
    const isPlayerHere = currentRoomType === reg.id;
    const n = reg.neighbors || {};

    return `
      <div style="background:#070b18; border:2px solid ${reg.borderColor}; border-radius:6px; padding:12px; height:100%; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:6px;">
          <div>
            <div style="font-family:var(--font-header); font-size:14px; font-weight:800; color:${reg.color}; letter-spacing:0.5px;">
              ${reg.name.toUpperCase()}
            </div>
            <div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">${reg.sub}</div>
          </div>
          <div style="text-align:right;">
            <span style="display:inline-block; font-size:9.5px; font-weight:bold; background:#0f172a; border:1px solid ${reg.color}; color:${reg.color}; padding:2px 7px; border-radius:3px;">
              ${reg.dangerTag}
            </span>
            <div style="font-size:10px; color:#facc15; font-weight:bold; margin-top:3px;">${reg.level}</div>
          </div>
        </div>

        ${isPlayerHere ? `
          <div style="background:rgba(34, 197, 94, 0.15); border:1px solid #22c55e; color:#86efac; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>📍</span><span>YOU ARE CURRENTLY IN THIS REALM (${Math.round(player.x)}, ${Math.round(player.y)})</span>
          </div>
        ` : ''}

        <!-- Connected Edge Boundaries (Click to Navigate) -->
        <div style="margin-bottom:8px; background:#0b1120; border:1px solid #1e293b; border-radius:4px; padding:6px 8px;">
          <div style="font-size:9px; color:#64748b; font-weight:bold; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">
            🧭 Connected Territory Boundaries
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-size:9.5px;">
            ${n.north ? `
              <button type="button" onclick="selectMapRegion('${n.north}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ▲ North: ${WORLD_ATLAS_REGIONS[n.north]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">▲ North: None (Edge)</div>'}
            ${n.south ? `
              <button type="button" onclick="selectMapRegion('${n.south}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ▼ South: ${WORLD_ATLAS_REGIONS[n.south]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">▼ South: None (Edge)</div>'}
            ${n.west ? `
              <button type="button" onclick="selectMapRegion('${n.west}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ◀ West: ${WORLD_ATLAS_REGIONS[n.west]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">◀ West: None (Edge)</div>'}
            ${n.east ? `
              <button type="button" onclick="selectMapRegion('${n.east}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ▶ East: ${WORLD_ATLAS_REGIONS[n.east]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">▶ East: None (Edge)</div>'}
          </div>
        </div>

        <div style="margin-bottom:8px;">
          <div style="font-size:10px; font-weight:bold; text-transform:uppercase; margin-bottom:2px; color:#38bdf8;">
            🏛️ Faction &amp; Affiliation
          </div>
          <div style="font-size:10.5px; color:#f8fafc; font-weight:600;">${reg.faction}</div>
          <div style="font-size:9.5px; color:#94a3b8; margin-top:2px; line-height:1.4;">${reg.desc}</div>
        </div>

        <div style="margin-bottom:8px;">
          <div style="font-size:10px; font-weight:bold; text-transform:uppercase; margin-bottom:3px; color:#fde047;">
            👾 Entities &amp; Inhabitants
          </div>
          <div style="display:flex; flex-direction:column; gap:3px; max-height:120px; overflow-y:auto; padding-right:2px;">
            ${reg.entities.map((e) => `
              <div style="background:#0c1222; border-left:2px solid ${reg.color}; padding:3px 6px; font-size:9.5px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <b style="color:#f1f5f9;">${e.name}</b>
                  <span style="color:#facc15; font-size:9px; font-weight:bold;">${e.hp}</span>
                </div>
                <div style="color:#94a3b8; font-size:8.5px; margin-top:1px;">${e.type} • ${e.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="background:#090d1c; border:1px solid #1e293b; border-radius:4px; padding:5px 8px;">
          <div style="font-size:9.5px; color:#facc15; font-weight:bold; text-transform:uppercase; margin-bottom:2px;">
            🧭 Pathfinding Route (From Sanctuary)
          </div>
          <div style="font-size:9.5px; color:#cbd5e1; line-height:1.4;">${reg.travel}</div>
        </div>
      </div>
    `;
  }

  function renderSquareZoneView(reg) {
    const isPlayerHere = currentRoomType === reg.id;
    const n = reg.neighbors || {};
    const northReg = n.north ? WORLD_ATLAS_REGIONS[n.north] : null;
    const southReg = n.south ? WORLD_ATLAS_REGIONS[n.south] : null;
    const westReg = n.west ? WORLD_ATLAS_REGIONS[n.west] : null;
    const eastReg = n.east ? WORLD_ATLAS_REGIONS[n.east] : null;

    // Player position percentage on current map
    let playerMarkerX = 50;
    let playerMarkerY = 50;
    if (isPlayerHere && mapBounds.halfW && mapBounds.halfH) {
      playerMarkerX = Math.max(10, Math.min(90, 50 + (player.x / mapBounds.halfW) * 40));
      playerMarkerY = Math.max(10, Math.min(90, 50 + (player.y / mapBounds.halfH) * 40));
    }

    return `
      <div style="display:flex; flex-direction:column; gap:0; background:#060a14; border:2px solid ${reg.borderColor}; border-radius:6px; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.8);">
        <!-- TOP EDGE SCROLL BAR (NORTH) -->
        <div class="map-edge-scroll north"
          onmouseenter="edgeHoverScroll('north')"
          onmouseleave="cancelEdgeHoverScroll()"
          onclick="if ('${n.north || ''}') selectMapRegion('${n.north}', true)"
          style="
            height: 26px;
            background: ${northReg ? '#0b162c' : '#05070f'};
            border-bottom: 1px solid ${northReg ? '#38bdf8' : '#1e293b'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${northReg ? 'pointer' : 'default'};
            font-size: 10px;
            font-weight: bold;
            color: ${northReg ? '#38bdf8' : '#475569'};
            transition: all 0.15s ease;
            user-select: none;
            letter-spacing: 0.5px;
          "
          title="${northReg ? 'Hover or click to scroll North into ' + northReg.name : 'Northern Boundary'}">
          ${northReg ? `▲ HOVER EDGE TO SCROLL NORTH: ${northReg.name.toUpperCase()} [${northReg.level}] ▲` : '— NORTHERN SEA BOUNDARY (THE FALL) —'}
        </div>

        <!-- MIDDLE ROW: WEST BAR + SQUARE MAP CANVAS + EAST BAR -->
        <div style="display:flex; height: 340px; position:relative;">
          <!-- LEFT EDGE SCROLL BAR (WEST) -->
          <div class="map-edge-scroll west"
            onmouseenter="edgeHoverScroll('west')"
            onmouseleave="cancelEdgeHoverScroll()"
            onclick="if ('${n.west || ''}') selectMapRegion('${n.west}', true)"
            style="
              width: 26px;
              background: ${westReg ? '#0b162c' : '#05070f'};
              border-right: 1px solid ${westReg ? '#38bdf8' : '#1e293b'};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: ${westReg ? 'pointer' : 'default'};
              font-size: 10px;
              font-weight: bold;
              color: ${westReg ? '#38bdf8' : '#475569'};
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              transition: all 0.15s ease;
              user-select: none;
              letter-spacing: 0.5px;
            "
            title="${westReg ? 'Hover or click to scroll West into ' + westReg.name : 'Western Boundary'}">
            ${westReg ? `◀ WEST: ${westReg.name.toUpperCase()}` : '— WEST BOUNDARY —'}
          </div>

          <!-- THE SQUARE MAP INTERIOR CANVAS -->
          <div style="
            flex: 1;
            position: relative;
            background:
              radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(5, 8, 16, 0.95) 75%),
              repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,0.03) 31px, rgba(255,255,255,0.03) 32px),
              repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,0.03) 31px, rgba(255,255,255,0.03) 32px),
              #080d1a;
            border-radius: 0;
            overflow: hidden;
          ">
            <!-- Compass Rose in Top-Right Corner -->
            <div style="position:absolute; top:8px; right:8px; background:rgba(6,10,20,0.85); border:1px solid #334155; border-radius:50%; width:34px; height:34px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:8px; font-weight:800; color:#cbd5e1; user-select:none; z-index:10; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
              <span style="color:#facc15; font-size:9px; margin-top:-2px;">N</span>
              <span style="font-size:7px; color:#64748b; margin-top:-1px;">W • E</span>
              <span style="font-size:7px; color:#64748b; margin-top:-1px;">S</span>
            </div>

            <!-- Regional Banner in Top-Left -->
            <div style="position:absolute; top:8px; left:8px; background:rgba(7,11,22,0.9); border:1px solid ${reg.color}; border-radius:4px; padding:3px 8px; z-index:10; box-shadow:0 2px 8px rgba(0,0,0,0.6);">
              <div style="font-family:var(--font-header); font-size:11px; font-weight:800; color:${reg.color};">
                ${reg.name}
              </div>
              <div style="font-size:8.5px; color:#cbd5e1;">${reg.sub} • <b style="color:#facc15;">${reg.level}</b></div>
            </div>

            <!-- Road/Pathway Leyline Overlays -->
            <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;">
              <!-- Central Leyline Convergence -->
              <circle cx="50%" cy="50%" r="22" fill="none" stroke="${reg.color}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.4" />
              ${n.north ? `<line x1="50%" y1="50%" x2="50%" y2="0%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
              ${n.south ? `<line x1="50%" y1="50%" x2="50%" y2="100%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
              ${n.west ? `<line x1="50%" y1="50%" x2="0%" y2="50%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
              ${n.east ? `<line x1="50%" y1="50%" x2="100%" y2="50%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
            </svg>

            <!-- Landmark Pins on Square Map -->
            ${(reg.landmarks || []).map((lm, idx) => `
              <div class="rs-map-pin"
                style="
                  position: absolute;
                  left: ${lm.x}%;
                  top: ${lm.y}%;
                  transform: translate(-50%, -50%);
                  cursor: pointer;
                  z-index: 5;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  transition: transform 0.15s ease;
                "
                title="${lm.name} • ${lm.sub}&#10;${lm.desc}">
                <div style="
                  background: rgba(10, 15, 30, 0.95);
                  border: 1.5px solid ${reg.color};
                  border-radius: 4px;
                  width: 22px;
                  height: 22px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  box-shadow: 0 0 8px rgba(0,0,0,0.8);
                ">
                  ${lm.icon}
                </div>
                <div style="
                  font-size: 8px;
                  font-weight: bold;
                  color: #e2e8f0;
                  background: rgba(4, 7, 15, 0.85);
                  border: 1px solid #334155;
                  border-radius: 2px;
                  padding: 1px 4px;
                  margin-top: 2px;
                  white-space: nowrap;
                  text-shadow: 0 1px 2px #000;
                  pointer-events: none;
                ">
                  ${lm.name}
                </div>
              </div>
            `).join('')}

            <!-- Player Location Pulse Marker -->
            ${isPlayerHere ? `
              <div style="
                position: absolute;
                left: ${playerMarkerX}%;
                top: ${playerMarkerY}%;
                transform: translate(-50%, -50%);
                z-index: 8;
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
              ">
                <div style="
                  width: 14px;
                  height: 14px;
                  background: #ffffff;
                  border: 2px solid #38bdf8;
                  border-radius: 50%;
                  box-shadow: 0 0 14px #ffffff, 0 0 24px #38bdf8;
                  animation: pulse 1.4s infinite;
                "></div>
                <div style="
                  font-size: 8px;
                  font-weight: 800;
                  color: #ffffff;
                  background: rgba(2, 132, 199, 0.9);
                  border: 1px solid #7dd3fc;
                  border-radius: 3px;
                  padding: 1px 5px;
                  margin-top: 2px;
                  white-space: nowrap;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.8);
                ">
                  📍 YOU ARE HERE
                </div>
              </div>
            ` : ''}

            <!-- Map Scale indicator in bottom-left -->
            <div style="position:absolute; bottom:6px; left:8px; font-size:8px; color:#64748b; font-family:monospace; user-select:none; z-index:10; background:rgba(6,10,20,0.7); padding:1px 5px; border-radius:2px; border:1px solid #1e293b;">
              SCALE: 100px ≈ 20 YARDS
            </div>
          </div>

          <!-- RIGHT EDGE SCROLL BAR (EAST) -->
          <div class="map-edge-scroll east"
            onmouseenter="edgeHoverScroll('east')"
            onmouseleave="cancelEdgeHoverScroll()"
            onclick="if ('${n.east || ''}') selectMapRegion('${n.east}', true)"
            style="
              width: 26px;
              background: ${eastReg ? '#0b162c' : '#05070f'};
              border-left: 1px solid ${eastReg ? '#38bdf8' : '#1e293b'};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: ${eastReg ? 'pointer' : 'default'};
              font-size: 10px;
              font-weight: bold;
              color: ${eastReg ? '#38bdf8' : '#475569'};
              writing-mode: vertical-rl;
              transition: all 0.15s ease;
              user-select: none;
              letter-spacing: 0.5px;
            "
            title="${eastReg ? 'Hover or click to scroll East into ' + eastReg.name : 'Eastern Boundary'}">
            ${eastReg ? `▶ EAST: ${eastReg.name.toUpperCase()}` : '— EAST BOUNDARY —'}
          </div>
        </div>

        <!-- BOTTOM EDGE SCROLL BAR (SOUTH) -->
        <div class="map-edge-scroll south"
          onmouseenter="edgeHoverScroll('south')"
          onmouseleave="cancelEdgeHoverScroll()"
          onclick="if ('${n.south || ''}') selectMapRegion('${n.south}', true)"
          style="
            height: 26px;
            background: ${southReg ? '#0b162c' : '#05070f'};
            border-top: 1px solid ${southReg ? '#38bdf8' : '#1e293b'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${southReg ? 'pointer' : 'default'};
            font-size: 10px;
            font-weight: bold;
            color: ${southReg ? '#38bdf8' : '#475569'};
            transition: all 0.15s ease;
            user-select: none;
            letter-spacing: 0.5px;
          "
          title="${southReg ? 'Hover or click to scroll South into ' + southReg.name : 'Southern Boundary'}">
          ${southReg ? `▼ HOVER EDGE TO SCROLL SOUTH: ${southReg.name.toUpperCase()} [${southReg.level}] ▼` : '— SOUTHERN FRONTIER BOUNDARY —'}
        </div>
      </div>
    `;
  }

  function renderContinentalGridView() {
    const realmOrder = [
      'CELESTIAL_ASCENT',
      'NEXUS_WARZONE',
      'NEXUS_FORGOTTEN_RUINS',
      'AETHER_SPIRE',
      'SANCTUARY_HUB',
      'SOLARI_CITADEL',
      'UMBRI_UNDERCITY',
      'TERRA_ORCHARD'
    ];

    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:10px; color:#94a3b8; margin-bottom:2px;">
          Click any continental realm below to zoom directly into its RuneScape Square Map:
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; max-height:380px; overflow-y:auto; padding-right:4px;">
          ${realmOrder.map((regId) => {
            const reg = WORLD_ATLAS_REGIONS[regId];
            if (!reg) return '';
            const isHere = currentRoomType === regId;
            const isSelected = selectedMapRegionId === regId;
            return `
              <div onclick="selectMapRegion('${reg.id}', true); setAtlasViewMode('square');"
                style="
                  background: #090e1d;
                  border: 2px solid ${isSelected ? '#ffffff' : reg.borderColor};
                  border-radius: 5px;
                  padding: 8px 10px;
                  cursor: pointer;
                  transition: all 0.15s ease;
                  ${isSelected ? 'box-shadow:0 0 14px rgba(255,255,255,0.25);' : ''}
                ">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <b style="font-family:var(--font-header); font-size:11.5px; color:${reg.color};">${reg.name}</b>
                  <span style="font-size:9px; color:${reg.color}; background:#070c18; border:1px solid ${reg.color}; padding:1px 5px; border-radius:3px; font-weight:bold;">
                    ${reg.dangerTag}
                  </span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:9.5px; color:#94a3b8;">
                  <span>${reg.level}</span>
                  ${isHere ? '<b style="color:#4ade80; background:rgba(34,197,94,0.2); padding:1px 5px; border-radius:3px; border:1px solid #22c55e;">📍 HERE</b>' : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderWorldAtlasView(body) {
    const currentReg = WORLD_ATLAS_REGIONS[selectedMapRegionId] || WORLD_ATLAS_REGIONS.SANCTUARY_HUB;

    body.innerHTML = `
      <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:var(--font-header); font-size:12.5px; color:#facc15; font-weight:bold; letter-spacing:0.5px;">
            🗺️ RUNESCAPE STYLE WORLD ATLAS
          </span>
          <div style="display:inline-flex; background:#070c18; border:1px solid #334155; border-radius:4px; overflow:hidden;">
            <button type="button" onclick="setAtlasViewMode('square')" style="background:${currentAtlasView === 'square' ? '#1e293b' : 'transparent'}; border:none; color:${currentAtlasView === 'square' ? '#facc15' : '#94a3b8'}; padding:3px 8px; font-size:9.5px; font-weight:bold; cursor:pointer;">
              🔲 SQUARE ZONE VIEW
            </button>
            <button type="button" onclick="setAtlasViewMode('grid')" style="background:${currentAtlasView === 'grid' ? '#1e293b' : 'transparent'}; border:none; color:${currentAtlasView === 'grid' ? '#facc15' : '#94a3b8'}; padding:3px 8px; font-size:9.5px; font-weight:bold; cursor:pointer;">
              🌐 CONTINENTAL GRID
            </button>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" onclick="centerMapOnPlayer()" style="background:#0f172a; border:1px solid #22c55e; color:#86efac; font-size:9.5px; font-weight:bold; padding:2px 8px; border-radius:3px; cursor:pointer;" title="Jump map directly to your character's active realm">
            📍 YOU ARE HERE (${WORLD_ATLAS_REGIONS[currentRoomType]?.name || currentRoomType})
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 340px; gap:12px; align-items:start;">
        <!-- Left: RuneScape Square Map Viewport with 4 Edge-Hover Scroll Bars OR Grid Overview -->
        <div>
          ${currentAtlasView === 'square' ? renderSquareZoneView(currentReg) : renderContinentalGridView()}
        </div>

        <!-- Right: Real-time Region Codex & Entity Inspector -->
        <div id="atlas-inspector-panel">
          ${getRegionInspectorHtml(selectedMapRegionId)}
        </div>
      </div>
    `;
  }

  function renderQuestLogView(body) {
    const activeList = [];
    for (const qId of Object.keys(questState.activeQuests || {})) {
      if (QUEST_CATALOG[qId]) activeList.push(QUEST_CATALOG[qId]);
    }
    if (activeList.length === 0 && !questState.completedQuests?.quest_awakening) {
      activeList.push(QUEST_CATALOG.quest_awakening);
    }

    const completedList = [];
    for (const qId of Object.keys(questState.completedQuests || {})) {
      if (QUEST_CATALOG[qId]) completedList.push(QUEST_CATALOG[qId]);
    }

    const availableList = [];
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      const isCompleted = Boolean(questState.completedQuests?.[qId]);
      const isActive = Boolean(questState.activeQuests?.[qId]);
      const prereqMet = !q.prereqQuestId || Boolean(questState.completedQuests?.[q.prereqQuestId]);
      if (!isCompleted && !isActive && prereqMet) {
        availableList.push(q);
      }
    }

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #1e293b; padding-bottom:6px;">
        <div>
          <span style="font-family:var(--font-header); font-size:13px; color:#facc15; font-weight:bold;">
            📜 SUMMONER QUEST JOURNAL
          </span>
          <span style="font-size:10px; color:#94a3b8; margin-left:8px;">
            Active: <b style="color:#38bdf8;">${activeList.length}</b> | Available: <b style="color:#fde047;">${availableList.length}</b> | Completed: <b style="color:#4ade80;">${completedList.length}</b>
          </span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="id-mini-btn" onclick="setAllQuestTracking(true)" title="Pin all active quests to HUD" style="font-size:9.5px; padding:3px 8px;">
            👁️ PIN ALL TO HUD
          </button>
          <button class="id-mini-btn" onclick="setAllQuestTracking(false)" title="Hide all quests from HUD" style="font-size:9.5px; padding:3px 8px;">
            UNPIN ALL
          </button>
        </div>
      </div>

      <!-- Section 1: Active Quests (In Progress) -->
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:11px; font-weight:bold; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">
            ⚔️ Active Quests in Progress (${activeList.length})
          </span>
          <span style="font-size:9.5px; color:#94a3b8;">Check the box to pin/display on your HUD tracker</span>
        </div>

        ${activeList.length === 0 ? `
          <div style="background:#090d1c; border:1px dashed #334155; padding:12px; text-align:center; color:#94a3b8; font-size:10.5px;">
            No quests currently in progress. Speak with NPCs with a golden <b style="color:#facc15;">[ ! ]</b> mark in the world to accept quests!
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${activeList.map((q) => {
              const isReady = q.isComplete();
              const isTracked = questState.trackedQuests?.[q.id] !== false;
              const completedTasks = q.tasks.filter(t => t.done()).length;
              return `
                <div style="background:#080d1e; border:2px solid ${isReady ? '#facc15' : isTracked ? '#38bdf8' : '#1e293b'}; border-radius:6px; padding:10px 12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; font-weight:bold; color:${isTracked ? '#38bdf8' : '#64748b'}; background:#0c1326; border:1px solid ${isTracked ? '#38bdf8' : '#334155'}; padding:2px 6px; border-radius:3px;">
                        <input type="checkbox" ${isTracked ? 'checked' : ''} onchange="toggleQuestTracking('${q.id}')" style="cursor:pointer; margin:0;">
                        <span>${isTracked ? '👁️ DISPLAYED ON HUD' : 'PIN TO HUD'}</span>
                      </label>
                      <span style="font-family:var(--font-header); font-size:12px; font-weight:bold; color:#fde047;">
                        📜 ${q.title.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span style="font-size:10px; font-weight:bold; background:${isReady ? 'rgba(250,204,21,0.2)' : 'rgba(56,189,248,0.15)'}; border:1px solid ${isReady ? '#facc15' : '#38bdf8'}; color:${isReady ? '#facc15' : '#38bdf8'}; padding:2px 7px; border-radius:3px;">
                        ${isReady ? '✨ READY TO TURN IN' : `PROGRESS: ${completedTasks}/${q.tasks.length}`}
                      </span>
                    </div>
                  </div>

                  <div style="font-size:10.5px; color:#cbd5e1; margin-bottom:8px; line-height:1.45;">
                    ${q.description}
                  </div>

                  <!-- Tasks Checklist -->
                  <div style="background:#050814; border:1px solid #1e293b; border-radius:4px; padding:6px 8px; margin-bottom:8px; display:flex; flex-direction:column; gap:4px;">
                    ${q.tasks.map((t) => {
                      const done = t.done();
                      const countStr = t.counter ? ` (${t.counter()})` : '';
                      return `
                        <div style="display:flex; align-items:center; gap:6px; font-size:10px;">
                          <span style="width:14px; height:14px; display:inline-flex; align-items:center; justify-content:center; border:1px solid ${done ? '#86efac' : '#38bdf8'}; background:${done ? '#15803d' : '#0a1020'}; color:#ffffff; font-weight:bold; font-size:9.5px; border-radius:2px;">
                            ${done ? '✓' : ''}
                          </span>
                          <span style="${done ? 'color:#94a3b8; text-decoration:line-through;' : 'color:#f8fafc;'}">
                            ${t.text}${countStr}
                          </span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px; color:#94a3b8;">
                    <span>Turn in to: <b style="color:#f1f5f9;">${getNpcName(q.turnInId)}</b></span>
                    <span style="color:#facc15; font-weight:bold;">
                      🎁 REWARDS: +${q.rewards.xp} XP | +${q.rewards.glimmer || 0} GLIMMER
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Section 2: Available Quests in the Realm -->
      ${availableList.length > 0 ? `
        <div style="margin-bottom:14px;">
          <div style="font-size:11px; font-weight:bold; color:#facc15; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            ⭐ Available Quests in the Realm (${availableList.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${availableList.map((q) => `
              <div style="background:#090e1d; border:1px solid #334155; border-radius:5px; padding:8px 10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                  <span style="font-family:var(--font-header); font-size:11px; font-weight:bold; color:#facc15;">
                    ⭐ ${q.title}
                  </span>
                  <span style="font-size:9.5px; color:#94a3b8;">
                    Giver: <b style="color:#38bdf8;">${getNpcName(q.giverId)}</b>
                  </span>
                </div>
                <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;">${q.description}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#64748b;">
                  <span>Speak with ${getNpcName(q.giverId)} to accept</span>
                  <span style="color:#fde047;">+${q.rewards.xp} XP | +${q.rewards.glimmer || 0} Glimmer</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section 3: Completed Quests Archive -->
      ${completedList.length > 0 ? `
        <div>
          <div style="font-size:11px; font-weight:bold; color:#4ade80; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            ✓ Completed Quests Archive (${completedList.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; max-height:120px; overflow-y:auto;">
            ${completedList.map((q) => `
              <div style="background:#070b16; border-left:3px solid #22c55e; padding:5px 8px; font-size:10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <b style="color:#86efac;">✓ ${q.title}</b>
                  <span style="color:#64748b; margin-left:6px;">— Turn-in: ${getNpcName(q.turnInId)}</span>
                </div>
                <span style="color:#4ade80; font-size:9px;">+${q.rewards.xp} XP CLAIMED</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function renderChronicleView(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="background:#080c18; border:2px solid #1e293b; padding:10px; border-radius:4px;">
          <b style="color:#facc15; display:block; margin-bottom:4px; font-family:var(--font-header); font-size:12px;">
            I. THE GLIMMER, THE FALL &amp; THE SHATTERED NEXUS
          </b>
          Before time took shape, reality hung between the radiance of the <b>Glimmer</b> and the silence of the <b>Fall</b>. Between them stood the crystalline <b>Nexus</b>, holding the Void at bay—until the Great Shattering scattered its shards across the continental caldera.
        </div>
        <div style="background:#080c18; border:2px solid #1e293b; padding:10px; border-radius:4px;">
          <b style="color:#38bdf8; display:block; margin-bottom:4px; font-family:var(--font-header); font-size:12px;">
            II. YOUR AWAKENING FROM STASIS
          </b>
          Sealed in starlight crystal in <b>Sanctuary Haven</b> since the Fall, you awaken as a <b>Summoner-Knight</b>. Train with <b>Herald Lyra</b>, form 3-player squads [O], and venture into the outer realms—banishing enemies into Void smoke, defending our Sanctuary, and shattering rival Monoliths!
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:10px;">
          <div style="background:#080c18; border-left:3px solid #facc15; padding:8px; border-radius:3px;">
            <b style="color:#facc15;">☀️ SOLARI (The Light)</b><br/>Radiant citadels, angelic heralds, Bulwark shields &amp; burning Daystar Rites.
          </div>
          <div style="background:#080c18; border-left:3px solid #a855f7; padding:8px; border-radius:3px;">
            <b style="color:#c084fc;">🌑 UMBRI (The Shadow)</b><br/>Duskveil assassins, Soul Tithes, Stealth strikes &amp; whispers from the Void.
          </div>
          <div style="background:#080c18; border-left:3px solid #22c55e; padding:8px; border-radius:3px;">
            <b style="color:#4ade80;">🌿 TERRA (The Earth)</b><br/>Ancient stone Behemoths, Overwhelm stampedes &amp; Ironwood resilience.
          </div>
          <div style="background:#080c18; border-left:3px solid #38bdf8; padding:8px; border-radius:3px;">
            <b style="color:#38bdf8;">🔮 AETHER (The Magic)</b><br/>Starforged scholars bending time with Chrono Shifts &amp; Reality Fractures.
          </div>
        </div>
        <div style="text-align:center; padding-top:6px;">
          <a href="https://www.glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#facc15; font-family:var(--font-header); font-size:10.5px; text-decoration:none;">
            ▸ EXPLORE ALL 322 CARDS AT GLIMMERFALLTCG.COM ◂
          </a>
        </div>
      </div>
    `;
  }

  function renderLoreModal() {
    const modal = document.getElementById('lore-modal');
    if (!modal) return;
    const body = document.getElementById('lore-modal-body');
    if (!body) return;

    const tabQuestsBtn = document.getElementById('lore-tab-quests');
    const tabMapBtn = document.getElementById('lore-tab-map');
    const tabChronicleBtn = document.getElementById('lore-tab-chronicle');
    if (tabQuestsBtn) tabQuestsBtn.className = `st-tab-btn ${currentLoreTab === 'quests' ? 'active' : ''}`;
    if (tabMapBtn) tabMapBtn.className = `st-tab-btn ${currentLoreTab === 'map' ? 'active' : ''}`;
    if (tabChronicleBtn) tabChronicleBtn.className = `st-tab-btn ${currentLoreTab === 'chronicle' ? 'active' : ''}`;

    if (currentLoreTab === 'quests') {
      renderQuestLogView(body);
    } else if (currentLoreTab === 'map') {
      renderWorldAtlasView(body);
    } else {
      renderChronicleView(body);
    }
  }

  function updateQuestTrackerHUD() {
    const container = document.getElementById('quest-tracker');
    if (!container) return;

    const activeList = [];
    for (const qId of Object.keys(questState.activeQuests || {})) {
      if (QUEST_CATALOG[qId]) activeList.push(QUEST_CATALOG[qId]);
    }

    if (activeList.length === 0 && !questState.completedQuests?.quest_awakening) {
      activeList.push(QUEST_CATALOG.quest_awakening);
    }

    const trackedList = activeList.filter((q) => questState.trackedQuests?.[q.id] !== false);

    if (trackedList.length === 0) {
      container.innerHTML = `
        <div class="quest-title" style="margin-bottom:2px;">
          <span>📜 QUEST TRACKER</span>
          <button class="id-mini-btn" onclick="openQuestLog()" style="font-size:9.5px; padding:1px 6px;">LOG [L]</button>
        </div>
        <div style="color:#94a3b8; font-size:9.5px; padding:4px 0;">
          ${activeList.length > 0 ? `${activeList.length} quest(s) active, but unpinned from HUD.` : 'No active quests.'}<br/>
          <a href="javascript:void(0)" onclick="openQuestLog()" style="color:#38bdf8; font-weight:bold;">Open Quest Log [L]</a> to select quests to display.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:4px; margin-bottom:5px;">
        <span style="font-family:var(--font-header); font-size:10.5px; color:#facc15; font-weight:bold;">
          📜 TRACKED QUESTS (${trackedList.length}/${activeList.length})
        </span>
        <button class="id-mini-btn" onclick="openQuestLog()" title="Open Quest Log &amp; Atlas [L]" style="font-size:9.5px; padding:2px 6px;">
          LOG [L]
        </button>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${trackedList.map((q) => {
          const isReady = q.isComplete();
          const tasksHtml = q.tasks.map((t, idx) => {
            const isDone = t.done();
            const countStr = t.counter ? ` (${t.counter()})` : '';
            return `
              <div class="quest-task" style="margin-bottom:2px;">
                <div class="quest-check ${isDone ? 'done' : ''}" style="width:13px; height:13px; font-size:9px;">${isDone ? '✓' : ''}</div>
                <span style="${isDone ? 'color:#94a3b8; text-decoration:line-through;' : 'color:#f1f5f9; font-size:9.5px;'}">${t.text}${countStr}</span>
              </div>
            `;
          }).join('');

          const turnInPrompt = isReady ? `
            <div class="quest-turnin-banner" style="margin-top:3px; padding:3px 6px; font-size:9.5px;">
              <span>✨</span><span>Ready! Return to ${getNpcName(q.turnInId)}</span>
            </div>
          ` : '';

          const completedCount = q.tasks.filter((t) => t.done()).length;

          return `
            <div class="quest-block" style="padding-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.08);">
              <div class="quest-title" style="font-size:10.5px; margin-bottom:3px;">
                <span style="color:#fde047;">${q.title.toUpperCase()}</span>
                <span style="color:${isReady ? '#facc15' : '#38bdf8'}; font-size:9.5px; font-weight:800;">
                  ${isReady ? 'READY ✓' : `${completedCount} / ${q.tasks.length}`}
                </span>
              </div>
              ${tasksHtml}
              ${turnInPrompt}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  const inputs = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false, shift: false, axisX: 0, axisY: 0 };

  let keybinds = { ...DEFAULT_KEYBINDS };
  try {
    const savedKb = localStorage.getItem('glimmerfall_keybinds');
    if (savedKb) keybinds = { ...DEFAULT_KEYBINDS, ...JSON.parse(savedKb) };
  } catch (_) {}
  let listeningSlot = null;

  // ==========================================
  // Portrait, Paperdoll & Profile Sync
  // ==========================================
  function syncBgmButtonLabel() {
    const btn = document.getElementById('btn-bgm-toggle');
    if (btn) btn.innerText = audio.bgmMuted ? '🔇 BGM' : '🎵 BGM';
  }
  syncBgmButtonLabel();

  window.toggleBgmMute = function (force) {
    let playing;
    if (typeof force === 'boolean') {
      audio.setBgmEnabled(force);
      playing = force;
    } else {
      playing = audio.toggleBgm();
    }
    const btn = document.getElementById('btn-bgm-toggle');
    if (btn) btn.innerText = playing ? '🎵 BGM' : '🔇 BGM';
    const cb = document.getElementById('settings-bgm-checkbox');
    if (cb) cb.checked = playing;
  };

  function refreshHeroPortrait() {
    const portraitCanvas = document.getElementById('portrait-canvas');
    if (!portraitCanvas) return;
    const pctx = portraitCanvas.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.fillStyle = '#0d152c';
    pctx.fillRect(0, 0, 28, 28);
    const heroSet = getCharacterSprites(localProfile.faction, localProfile.classId, localProfile.equipment);
    pctx.drawImage(heroSet.down[0], 2, 1);
  }

  function recalcVitalsFromProfile() {
    player.maxHp = calcMaxHp(prog, localProfile.equipment, localProfile.classId);
    player.hp = Math.min(player.maxHp, player.hp);
    player.maxSolarCharge = calcMaxGlimmer(prog, localProfile.equipment, localProfile.classId);
  }

  function applyProfile(prof) {
    if (!prof) return;
    const cls = CLASSES_CATALOG[prof.classId || localProfile.classId] || CLASSES_CATALOG.solari_vanguard;
    localProfile = {
      ...localProfile,
      ...prof,
      classId: cls.id,
      loadout: { ...cls.defaultLoadout, ...(prof.loadout || localProfile.loadout || {}) },
      equipment: { ...cls.defaultEquipment, ...(prof.equipment || localProfile.equipment || {}) },
    };
    if (prof.progression) {
      prog = {
        ...prog,
        ...prof.progression,
        stats: { ...prog.stats, ...(prof.progression.stats || {}) },
        ranks: { ...prog.ranks, ...(prof.progression.ranks || {}) },
        paragon: { ...(prog.paragon || {}), ...(prof.progression.paragon || {}) },
      };
      saveProgressionLocal();
    }
    loadQuestState();
    recalcVitalsFromProfile();
    refreshHeroPortrait();
    updatePlayerUI();
    updateActionBarBadges();
    if (document.getElementById('paperdoll-modal')?.style.display === 'block') {
      renderInGamePaperdollModal({ profile: localProfile });
    }
  }

  // ==========================================
  // Coordinate, FCT, Chat & Logging Helpers
  // ==========================================
  function worldToScreen(wx, wy, wz = 0) {
    return {
      sx: (wx - camera.x + viewW / 2) * zoom,
      sy: (wy - wz - camera.y + viewH / 2) * zoom,
    };
  }

  function screenToWorld(clientX, clientY) {
    const rectBounds = canvas.getBoundingClientRect();
    const pxX = ((clientX - rectBounds.left) / rectBounds.width) * viewW;
    const pxY = ((clientY - rectBounds.top) / rectBounds.height) * viewH;
    return {
      wx: pxX - viewW / 2 + camera.x,
      wy: pxY - viewH / 2 + camera.y,
    };
  }

  function spawnFCT(wx, wy, text, color = '#facc15', isCrit = false) {
    if (!fctContainer) return;
    const { sx, sy } = worldToScreen(wx, wy - 14);
    const el = document.createElement('div');
    el.className = isCrit ? 'fct-text fct-crit' : 'fct-text';
    el.style.left = `${sx}px`;
    el.style.top = `${sy}px`;
    el.style.color = color;
    el.innerText = isCrit ? `★${text}!` : text;
    fctContainer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function logMessage(msg, className = '', category = 'combat') {
    const log = document.getElementById('combat-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = `log-entry ${className}`;
    if (div.dataset) div.dataset.cat = category;
    div.setAttribute('data-cat', category);
    if (activeChatFilter !== 'all' && activeChatFilter !== category) {
      div.style.display = 'none';
    }
    div.innerText = msg;
    log.appendChild(div);
    while (log.children.length > 60) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }

  window.setChatFilter = function (filter) {
    activeChatFilter = filter;
    document.querySelectorAll('.chat-tabs .chat-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    const log = document.getElementById('combat-log');
    if (!log) return;
    Array.from(log.children).forEach((el) => {
      const cat = el.dataset.cat || 'combat';
      el.style.display = filter === 'all' || filter === cat ? '' : 'none';
    });
    log.scrollTop = log.scrollHeight;
  };

  window.cycleChatChannel = function () {
    const order = ['say', 'faction', 'party', 'order'];
    chatChannel = order[(order.indexOf(chatChannel) + 1) % order.length];
    const labels = { say: 'SAY', faction: 'FAC', party: 'PTY', order: 'ORD' };
    const btn = document.getElementById('chat-chan-btn');
    if (btn) btn.innerText = labels[chatChannel];
  };

  window.submitChatInput = function () {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    input.value = '';
    input.blur();
    if (!text) return;

    if (net.connected) {
      net.send({ type: 'chat', channel: chatChannel, text });
    } else {
      player.bubble = text.slice(0, 64);
      player.bubbleTimer = 5.5;
      audio.playChatPop();
      logMessage(`[SAY] ${localProfile.displayName}: ${text}`, 'log-chat-say', 'chat');
    }
  };

  window.triggerEmote = function (emoteId) {
    const em = EMOTES_CATALOG[emoteId] || EMOTES_CATALOG.wave;
    audio.playEmote();
    if (net.connected) {
      net.send({ type: 'emote', emoteId: em.id });
    } else {
      player.emote = em.id;
      player.emoteTimer = 3.6;
      logMessage(`${em.icon} ${localProfile.displayName} ${em.text}`, 'log-solari', 'chat');
    }
  };

  window.plantOrderBanner = function () {
    audio.playBannerPlant();
    if (net.connected) {
      net.send({ type: 'plant_banner' });
    } else {
      worldBanners = [
        {
          id: 'local_bnr',
          ownerName: localProfile.displayName,
          orderTag: localProfile.orderTag || 'SUN',
          orderName: localProfile.orderName || 'Order of Dawn',
          color: localProfile.orderColor || '#facc15',
          x: player.x,
          y: player.y - 4,
          age: 0,
          maxAge: 20,
        },
      ];
      spawnFCT(player.x, player.y - 14, `⚑ <${localProfile.orderTag || 'SUN'}> STANDARD!`, '#facc15', true);
      logMessage(`⚑ Planted <${localProfile.orderTag || 'SUN'}> Order Banner (+1 Power Aura)!`, 'log-solari', 'chat');
    }
  };

  window.equipPaperdollItem = function (itemId) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (!item) return;
    localProfile.equipment = { ...(localProfile.equipment || {}), [item.slot]: item.id };
    audio.playShield();
    recalcVitalsFromProfile();
    refreshHeroPortrait();
    updatePlayerUI();
    renderInGamePaperdollModal({ profile: localProfile });
    renderStatsModal();
    if (net.connected) {
      net.send({ type: 'equip_item', itemId: item.id });
    }
    logMessage(`🛡️ Equipped ${item.name} (${item.desc})!`, 'log-solari', 'combat');
  };

  window.assignSlotAbilityInGame = function (slot, abilityId) {
    const ab = ABILITIES_CATALOG[abilityId];
    if (!ab) return;
    const rank = getAbilityRank(prog, ab.id);
    if (rank < 1) {
      logMessage(`🔒 Must allocate a Skill Point in ${ab.name} in the Skill Tree [P] before equipping!`, 'log-combat');
      audio.playHurt();
      return;
    }
    localProfile.loadout = { ...(localProfile.loadout || {}), [slot]: ab.id };
    if (prog.ranks) {
      prog.ranks[slot] = rank;
    }
    audio.playSpell();
    updateActionBarBadges();
    renderKeybindUI();
    if (typeof renderSkillTreeUI === 'function') renderSkillTreeUI();
    if (net.connected) {
      net.send({ type: 'update_loadout', loadout: localProfile.loadout });
    }
  };

  // ==========================================
  // Party / Squad & Account UI Handlers
  // ==========================================
  window.sendPartyInviteTo = function (targetIdOrName) {
    if (!net.connected) {
      logMessage('[Squad] Enter Multiplayer Realm to invite players.', 'log-combat', 'party');
      return;
    }
    net.send({ type: 'party_invite', target: targetIdOrName });
  };

  window.inviteByInput = function () {
    const inp = document.getElementById('manual-invite-input');
    if (inp && inp.value.trim()) {
      window.sendPartyInviteTo(inp.value.trim());
      inp.value = '';
    }
  };

  window.inviteTargetedPlayer = function () {
    if (currentTarget && currentTarget.isRemotePlayer) {
      window.sendPartyInviteTo(currentTarget.playerId);
    }
  };

  window.respondPartyInvite = function (accept) {
    const toast = document.getElementById('party-invite-toast');
    if (toast) toast.style.display = 'none';
    if (pendingPartyInvite && net.connected) {
      net.send({ type: 'party_respond', inviteId: pendingPartyInvite.inviteId, accept });
    }
    pendingPartyInvite = null;
  };

  window.leaveSquad = function () {
    if (net.connected) net.send({ type: 'party_leave' });
  };

  window.switchServerRoom = function (roomId) {
    if (net.connected) {
      portalCooldown = 2.0;
      triggerPortalMist(0.5);
      inputs.up = inputs.down = inputs.left = inputs.right = false;
      player.isMoving = false;
      moveSyncAccum = 0;
      audio.playPortal();
      net.send({ type: 'switch_room', roomId, epoch: currentEpoch });
      document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    }
  };

  window.selectProfileFaction = async function (factionId) {
    localProfile.faction = factionId;
    const firstCls = Object.values(CLASSES_CATALOG).find((c) => c.faction === factionId);
    if (firstCls) {
      localProfile.classId = firstCls.id;
      localProfile.loadout = { ...firstCls.defaultLoadout };
      localProfile.equipment = { ...firstCls.defaultEquipment };
    }
    refreshHeroPortrait();
    updatePlayerUI();
    updateActionBarBadges();
    renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: `Switched Faction to ${factionId}!` });
    try {
      const updated = await net.updateProfile({
        faction: factionId,
        classId: localProfile.classId,
        loadout: localProfile.loadout,
        equipment: localProfile.equipment,
      });
      applyProfile(updated);
    } catch (_) {}
  };

  window.applyOrderPreset = function (tag, name, color) {
    const tEl = document.getElementById('prof-order-tag');
    const nEl = document.getElementById('prof-order-name');
    if (tEl) tEl.value = tag;
    if (nEl) nEl.value = name;
    localProfile.orderColor = color;
  };

  window.saveProfileChanges = async function () {
    const displayName = document.getElementById('prof-display-name')?.value?.trim();
    const orderTag = document.getElementById('prof-order-tag')?.value?.trim();
    const orderName = document.getElementById('prof-order-name')?.value?.trim();
    try {
      const updated = await net.updateProfile({
        displayName,
        faction: localProfile.faction,
        orderTag,
        orderName,
        orderColor: localProfile.orderColor,
      });
      applyProfile(updated);
      audio.playChime();
      accountStatusMsg = '✓ Profile, Faction & Order Banner saved!';
    } catch (err) {
      localProfile.displayName = displayName || localProfile.displayName;
      localProfile.orderTag = (orderTag || 'SUN').toUpperCase();
      localProfile.orderName = orderName || localProfile.orderName;
      updatePlayerUI();
      accountStatusMsg = err.message || 'Saved locally.';
    }
    renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: accountStatusMsg });
  };

  window.switchAccountAuthTab = function (tab) {
    accountAuthTab = tab;
    renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: '' });
  };

  window.submitGlimmerFallAuth = async function (mode) {
    const username = document.getElementById('auth-username')?.value?.trim();
    const password = document.getElementById('auth-password')?.value || '';
    try {
      let updated;
      if (mode === 'login') {
        updated = await net.login({ username, password });
        accountStatusMsg = `✓ Signed in as @${updated.username}!`;
      } else {
        updated = await net.register({
          username,
          password,
          displayName: document.getElementById('prof-display-name')?.value?.trim() || username,
          faction: localProfile.faction,
          classId: localProfile.classId,
          orderTag: document.getElementById('prof-order-tag')?.value?.trim() || localProfile.orderTag,
          orderName: document.getElementById('prof-order-name')?.value?.trim() || localProfile.orderName,
          clientProgression: prog,
        });
        accountStatusMsg = `✓ Claimed GlimmerFall ID @${updated.username}!`;
      }
      audio.playLevelUp();
      applyProfile(updated);
      frontpage.syncFromProfile(updated);
      renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: accountStatusMsg });
    } catch (err) {
      renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: `⚠️ ${err.message}` });
    }
  };

  window.submitTcgSsoLink = async function () {
    const val = document.getElementById('sso-tcg-handle')?.value?.trim() || '';
    try {
      const isEmail = val.includes('@');
      const updated = await net.linkTcgSso({
        tcgHandle: isEmail ? val.split('@')[0] : val,
        tcgEmail: isEmail ? val : undefined,
      });
      audio.playLevelUp();
      applyProfile(updated);
      renderAccountModal({
        profile: localProfile,
        authTab: accountAuthTab,
        statusMsg: `⚡ Unified with glimmerfalltcg.com (${updated.tcgHandle})!`,
      });
      logMessage(`[SSO] Linked glimmerfalltcg.com account: ${updated.tcgHandle}!`, 'log-solari', 'chat');
    } catch (err) {
      renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: `⚠️ ${err.message}` });
    }
  };

  window.saveCustomServerUrl = function () {
    const inp = document.getElementById('custom-server-inp');
    const val = inp?.value?.trim() || '';
    if (!val) {
      alert('Please enter a valid realm address');
      return;
    }
    net.setServerBase(val);
    logMessage(`[Realm] Connecting to custom realm address: ${val}`, 'log-solari', 'chat');
  };

  window.resetCustomServerUrl = function () {
    net.setServerBase('');
    const inp = document.getElementById('custom-server-inp');
    if (inp) inp.value = '';
    logMessage(`[Realm] Reset to official realm gateway.`, 'log-system', 'chat');
  };

  // ==========================================
  // Dialogue Helpers & Unique NPC Portrait Renderer
  // ==========================================

  function updateNpcPortrait(spriteKey) {
    const canvas = document.getElementById('npc-portrait-canvas');
    if (!canvas) return;
    const pctx = canvas.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, canvas.width, canvas.height);
    const key = spriteKey || activeDialogueSpriteKey || 'heraldNpc';
    const portrait = (sprites.npcPortraits && sprites.npcPortraits[key]) ||
                     (sprites[key] && sprites[key][0]) ||
                     sprites.npcPortraits?.heraldNpc ||
                     sprites.heraldNpc?.[0];
    if (portrait) {
      pctx.drawImage(portrait, 0, 0, canvas.width, canvas.height);
    }
  }

  function openDialogue(pages, customSpriteKey = null, npcId = null) {
    activeDialoguePages = pages || [];
    dialogueIdx = 0;
    activeDialogueNpcId = npcId || null;
    if (customSpriteKey) {
      activeDialogueSpriteKey = customSpriteKey;
    } else if (pages && pages[0] && pages[0].spriteKey) {
      activeDialogueSpriteKey = pages[0].spriteKey;
    } else {
      activeDialogueSpriteKey = 'heraldNpc';
    }
    if (npcId) {
      questState.talkedNpcs[npcId] = true;
      questState.introShown = true;
      introShown = true;
      saveQuestState();
    }
    renderDialogueBox();
  }

  function renderDialogueBox() {
    const box = document.getElementById('lore-dialogue-box');
    if (!box) return;
    if (!activeDialoguePages.length || dialogueIdx >= activeDialoguePages.length) {
      box.style.display = 'none';
      return;
    }
    const page = activeDialoguePages[dialogueIdx];
    box.style.display = 'flex';
    document.getElementById('dlg-speaker').innerText = page.speaker;
    document.getElementById('dlg-text').innerText = page.text;
    const btn = document.getElementById('dlg-next-btn');
    if (btn) {
      btn.innerText = dialogueIdx < activeDialoguePages.length - 1
        ? `NEXT (${dialogueIdx + 1}/${activeDialoguePages.length}) ▸`
        : 'BEGIN TRAINING ✓';
    }
    const key = page.spriteKey || activeDialogueSpriteKey || 'heraldNpc';
    updateNpcPortrait(key);
  }

  window.advanceDialogue = function () {
    audio.playDialogue();
    dialogueIdx++;
    if (dialogueIdx >= activeDialoguePages.length) {
      if (activeDialogueNpcId) {
        questState.talkedNpcs[activeDialogueNpcId] = true;
        questState.introShown = true;
        introShown = true;
        saveQuestState();
      }
    }
    renderDialogueBox();
  };

  window.closeDialogue = function () {
    if (activeDialogueNpcId) {
      questState.talkedNpcs[activeDialogueNpcId] = true;
      questState.introShown = true;
      introShown = true;
      saveQuestState();
    }
    activeDialoguePages = [];
    renderDialogueBox();
  };

  // ==========================================
  // XP, Stats & Skill Ranks
  // ==========================================
  function awardXP(amount, reason = '') {
    if (amount <= 0) return;
    const tCfg = getTormentConfig(prog.tormentLevel || 0);
    if (tCfg.xpMult && tCfg.xpMult > 1) {
      amount = Math.round(amount * tCfg.xpMult);
    }
    let leveled = false;
    let paragonLeveled = false;

    if ((prog.level || 1) < MAX_BASE_LEVEL) {
      prog.xp = (prog.xp || 0) + amount;
      while ((prog.level || 1) < MAX_BASE_LEVEL && prog.xp >= xpForNextLevel(prog.level)) {
        prog.xp -= xpForNextLevel(prog.level);
        prog.level++;
        prog.statPoints = (prog.statPoints || 0) + 3;
        prog.skillPoints = (prog.skillPoints || 0) + 1;
        leveled = true;
      }
    } else {
      if (!prog.paragon) {
        prog.paragon = { solari_radiance: 0, umbri_shadowcraft: 0, terra_bulwark: 0, aether_chronoflux: 0 };
      }
      prog.paragonLevel = prog.paragonLevel || 0;
      prog.paragonPoints = prog.paragonPoints || 0;
      prog.paragonXp = (prog.paragonXp || 0) + amount;
      while (prog.paragonXp >= paragonXpForLevel(prog.paragonLevel)) {
        prog.paragonXp -= paragonXpForLevel(prog.paragonLevel);
        prog.paragonLevel++;
        prog.paragonPoints++;
        paragonLeveled = true;
      }
    }

    recalcVitalsFromProfile();

    if (leveled || paragonLeveled) {
      player.hp = player.maxHp;
      audio.playLevelUp();
      spawnSparkBurst(player.x, player.y - 8, ['#fde047', '#38bdf8', '#4ade80', '#c084fc', '#ffffff'], 26);
      const lvlTxt = paragonLeveled ? `PARAGON ${prog.paragonLevel}!` : `LEVEL ${prog.level}!`;
      spawnFCT(player.x, player.y - 12, lvlTxt, paragonLeveled ? '#c084fc' : '#fde047', true);
      if (paragonLeveled) {
        logMessage(`[PARAGON RESONANCE!] Attained Paragon Level ${prog.paragonLevel}! +1 Paragon Point!`, 'log-solari');
      } else {
        logMessage(`[LEVEL UP!] Reached Level ${prog.level}! +3 Stat Pts & +1 Spell Pt!`, 'log-solari');
      }
      renderStatsModal();
      renderKeybindUI();
    } else if (reason) {
      logMessage(`[XP] +${amount} XP (${reason})`, 'log-gain');
    }

    saveProgressionLocal();
    updatePlayerUI();
  }

  window.allocateStat = function (statKey) {
    if (prog.statPoints <= 0 || !(statKey in prog.stats)) return;
    if (net.connected) {
      audio.playChime();
      net.send({ type: 'allocate_stat', statKey });
      return;
    }
    prog.statPoints--;
    prog.stats[statKey]++;
    const prevMax = player.maxHp;
    recalcVitalsFromProfile();
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - prevMax));
    audio.playChime();
    saveProgressionLocal();
    updatePlayerUI();
    renderStatsModal();
  };

  window.upgradeParagon = function (affinityId) {
    if (!canUpgradeParagon(prog, affinityId)) return;
    audio.playChime();
    if (net.connected) {
      net.send({ type: 'upgrade_paragon', affinityId });
      return;
    }
    if (!prog.paragon) {
      prog.paragon = { solari_radiance: 0, umbri_shadowcraft: 0, terra_bulwark: 0, aether_chronoflux: 0 };
    }
    prog.paragonPoints = (prog.paragonPoints || 0) - 1;
    prog.paragon[affinityId] = (prog.paragon[affinityId] || 0) + 1;
    const prevMax = player.maxHp;
    recalcVitalsFromProfile();
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - prevMax));
    saveProgressionLocal();
    updatePlayerUI();
    renderStatsModal();
  };

  window.setTormentLevel = function (level) {
    const tLevel = Math.max(0, Math.min(TORMENT_LEVELS.length - 1, Math.floor(Number(level) || 0)));
    if (tLevel > 0 && (prog.level || 1) < 30) {
      logMessage('⚠️ Leyline Torment difficulty requires Level 30 Champion status!', 'log-combat');
      audio.playWarning?.() || audio.playHit(false);
      return;
    }
    prog.tormentLevel = tLevel;
    const tCfg = getTormentConfig(tLevel);
    saveProgressionLocal();
    updateNetStatusPill();
    renderStatsModal();
    audio.playChime();
    spawnSparkBurst(player.x, player.y - 10, [tCfg.color, '#facc15', '#ffffff'], 20);
    spawnFCT(player.x, player.y - 14, `🔥 TORMENT: ${tCfg.name.toUpperCase()}`, tCfg.color, true);
    logMessage(`[Torment] Realm difficulty set to ${tCfg.name}! ${tCfg.desc}`, 'log-solari');

    if (net.connected) {
      net.send({ type: 'set_torment', tormentLevel: tLevel });
    }
  };

  window.upgradeSkillRank = function (slot) {
    const s = Number(slot);
    if (prog.skillPoints <= 0 || !(s in prog.ranks)) return;
    if (prog.ranks[s] >= 5) return;
    if (net.connected) {
      audio.playChime();
      net.send({ type: 'upgrade_rank', slot: s });
      return;
    }
    prog.skillPoints--;
    prog.ranks[s]++;
    audio.playChime();
    saveProgressionLocal();
    updatePlayerUI();
    updateActionBarBadges();
    renderKeybindUI();
  };

  window.resetCharacterProgression = function () {
    if (net.connected) {
      audio.playChime();
      net.send({ type: 'reset_progression' });
      return;
    }
    prog = createDefaultProgression();
    recalcVitalsFromProfile();
    player.hp = player.maxHp;
    audio.playChime();
    saveProgressionLocal();
    updatePlayerUI();
    updateActionBarBadges();
    renderStatsModal();
    renderKeybindUI();
  };

  // ==========================================
  // Particles & Visual FX
  // ==========================================
  const SMOKE_PURPLE_PALETTE = [
    { color: '#581c87', darkColor: '#1e0836', highlightColor: '#a855f7' },
    { color: '#7e22ce', darkColor: '#2e1065', highlightColor: '#c084fc' },
    { color: '#9333ea', darkColor: '#3b0764', highlightColor: '#d8b4fe' },
    { color: '#a855f7', darkColor: '#3b0764', highlightColor: '#e9d5ff' },
    { color: '#3b0764', darkColor: '#18022e', highlightColor: '#7e22ce' },
    { color: '#c084fc', darkColor: '#4c1d95', highlightColor: '#f3e8ff' },
  ];

  function spawnSmokeBurst(wx, wy, count = 32, isBoss = false) {
    const total = isBoss ? Math.max(count, 56) : count;
    for (let i = 0; i < total; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (isBoss ? 14 : 9) + Math.random() * (isBoss ? 42 : 28);
      const pTheme = SMOKE_PURPLE_PALETTE[(Math.random() * SMOKE_PURPLE_PALETTE.length) | 0];
      const baseSize = (isBoss ? 5 : 4) + Math.random() * (isBoss ? 5.5 : 4.0);
      particles.push({
        type: 'smoke',
        x: wx + (Math.random() - 0.5) * (isBoss ? 26 : 14),
        y: wy + (Math.random() - 0.5) * (isBoss ? 18 : 10),
        z: 4 + Math.random() * 12,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.45,
        vz: 18 + Math.random() * (isBoss ? 36 : 26),
        baseSize,
        size: baseSize,
        color: pTheme.color,
        darkColor: pTheme.darkColor,
        highlightColor: pTheme.highlightColor,
        age: 0,
        maxAge: 0.65 + Math.random() * 0.55,
      });
    }
  }

  function triggerEntityDeathEffect(wx, wy, isBoss = false) {
    audio.playSmokePuff();
    spawnSmokeBurst(wx, wy, isBoss ? 64 : 36, isBoss);
  }

  function spawnSparkBurst(wx, wy, colors = ['#facc15', '#fef08a', '#ffffff'], count = 12) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 16 + Math.random() * 42;
      particles.push({
        x: wx,
        y: wy,
        z: 8 + Math.random() * 8,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.65,
        vz: (Math.random() - 0.2) * 24,
        size: Math.random() < 0.5 ? 2 : 3,
        color: colors[(Math.random() * colors.length) | 0],
        age: 0,
        maxAge: 0.28 + Math.random() * 0.22,
      });
    }
  }

  function spawnFootstepDust(wx, wy) {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: wx + (Math.random() - 0.5) * 6,
        y: wy + 2,
        z: 1,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 6,
        vz: 6 + Math.random() * 6,
        size: 2,
        color: '#94a3b8',
        age: 0,
        maxAge: 0.28,
      });
    }
  }

  // ==========================================
  // Zone Setup (All 7 Room Types: Hub, Warzone, 4 Biomes & 3v3 Arena)
  // ==========================================
  let lastDecorRoomType = null;
  let isTransitioningZone = false;

  function setupZoneDecor(zoneType, roomTitleOverride = null) {
    const resolvedRoomType = ROOM_CONFIGS[zoneType]
      ? zoneType
      : zoneType === 'tutorial'
        ? ROOM_TYPES.SANCTUARY_HUB
        : zoneType === 'arena_3v3'
          ? ROOM_TYPES.ARENA_3V3
          : ROOM_TYPES.NEXUS_WARZONE;

    if (lastDecorRoomType === resolvedRoomType && !roomTitleOverride) {
      return;
    }
    lastDecorRoomType = resolvedRoomType;

    const cfg = ROOM_CONFIGS[resolvedRoomType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    currentRoomType = resolvedRoomType;
    currentBiomeTheme = cfg.biomeTheme || 'sanctuary';
    currentZone =
      resolvedRoomType === ROOM_TYPES.SANCTUARY_HUB
        ? 'tutorial'
        : resolvedRoomType === ROOM_TYPES.ARENA_3V3
          ? 'arena_3v3'
          : 'main_world';

    mapBounds.halfW = cfg.halfW;
    mapBounds.halfH = cfg.halfH;
    audio.setBgmTheme(cfg.bgm || 'sanctuary');

    if (!questState.visitedBiomes) questState.visitedBiomes = {};
    if (resolvedRoomType === ROOM_TYPES.SOLARI_CITADEL) questState.visitedBiomes.solari = true;
    if (resolvedRoomType === ROOM_TYPES.UMBRI_UNDERCITY) questState.visitedBiomes.umbri = true;
    if (resolvedRoomType === ROOM_TYPES.TERRA_ORCHARD) questState.visitedBiomes.terra = true;
    if (resolvedRoomType === ROOM_TYPES.AETHER_SPIRE) questState.visitedBiomes.aether = true;
    if (resolvedRoomType === ROOM_TYPES.CELESTIAL_ASCENT) questState.ascentReached = true;
    saveQuestState();
    updateQuestTrackerHUD();

    npcs = [];
    props = [];
    particles = [];
    afterimages = [];
    slashArcs = [];
    skyBeams = [];
    setTarget(null);

    const hudEl = document.getElementById('hud');
    const zoneTitle = document.getElementById('minimap-zone-title');
    const zoneLabel = document.getElementById('zone-label');
    const arenaBanner = document.getElementById('arena-banner');
    const siegeBanner = document.getElementById('siege-banner');
    const tutQuestBody = document.getElementById('quest-tasks-tutorial');
    const warzoneQuestBody = document.getElementById('quest-tasks-warzone');

    hudEl.classList.toggle('in-arena', resolvedRoomType === ROOM_TYPES.ARENA_3V3);
    hudEl.classList.toggle('in-siege', resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE);
    if (siegeBanner) {
      siegeBanner.style.display = resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE ? 'block' : 'none';
    }

    if (resolvedRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'SANCTUARY HUB #1';
      if (zoneLabel) zoneLabel.innerText = 'Sanctuary Haven';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'block';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'none';

      props.push(
        { type: 'brazier', x: -48, y: 74 },
        { type: 'brazier', x: 48, y: 74 },
        { type: 'brazier', x: -48, y: -74 },
        { type: 'brazier', x: 48, y: -74 },
        { type: 'pillar', x: -120, y: -48 },
        { type: 'pillar', x: 120, y: -48 },
        { type: 'pillar', x: -120, y: 56 },
        { type: 'pillar', x: 120, y: 56 }
      );
      npcs.push(
        {
          id: 'npc_aurora',
          name: 'Herald Lyra',
          role: 'Sunspire Herald [Click / T]',
          spriteKey: 'heraldNpc',
          x: 38,
          y: 82,
          dialogue: AWAKENING_DIALOGUE,
        },
        {
          id: 'npc_archon',
          name: 'Commander Valerius',
          role: 'Sunspire Warlord [Click / T]',
          spriteKey: 'warzoneArchonNpc',
          x: -42,
          y: -74,
          dialogue: WARZONE_DIALOGUE,
        }
      );
      if (!introShown && !questState.introShown && !questState.talkedNpcs?.npc_aurora && !frontpage.isOpen) {
        introShown = true;
        questState.introShown = true;
        saveQuestState();
        openDialogue(AWAKENING_DIALOGUE, 'heraldNpc', 'npc_aurora');
      }
    } else if (resolvedRoomType === ROOM_TYPES.ARENA_3V3) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || '3v3 NEXUS ARENA';
      if (zoneLabel) zoneLabel.innerText = 'Exit Arena';
      arenaBanner.style.display = 'flex';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      props.push(
        { type: 'brazier', x: -64, y: 180 },
        { type: 'brazier', x: 64, y: 180 },
        { type: 'brazier', x: -64, y: -180 },
        { type: 'brazier', x: 64, y: -180 },
        { type: 'pillar', x: -110, y: 0 },
        { type: 'pillar', x: 110, y: 0 }
      );
    } else if (resolvedRoomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'FORGOTTEN FIRST NEXUS RUINS';
      if (zoneLabel) zoneLabel.innerText = 'To Caldera';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'crystalPillar', x: -140, y: 60 },
        { type: 'crystalPillar', x: 140, y: 60 },
        { type: 'brazier', x: -70, y: 140 },
        { type: 'brazier', x: 70, y: 140 },
        { type: 'brazier', x: -70, y: -140 },
        { type: 'brazier', x: 70, y: -140 },
        { type: 'pillar', x: -160, y: -90 },
        { type: 'pillar', x: 160, y: -90 },
        // Grand North Waygate to Continental Caldera Torment Realm
        { type: 'ruinedArch', x: 0, y: -380 },
        { type: 'crystalPillar', x: -80, y: -380 },
        { type: 'crystalPillar', x: 80, y: -380 },
        { type: 'brazier', x: -48, y: -390 },
        { type: 'brazier', x: 48, y: -390 }
      );
      npcs.push({
        id: 'npc_atlas',
        name: 'Atlas the Cartographer',
        role: 'Keystone Seeker [Click / T]',
        spriteKey: 'cartographerNpc',
        x: 42,
        y: 135,
        dialogue: RUINS_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.CELESTIAL_ASCENT) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'CELESTIAL ASCENT & EMPYREAN TITAN SUMMIT';
      if (zoneLabel) zoneLabel.innerText = 'To Caldera';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      // Grand Summit Props (Stairway colonnade, terrace monuments, throne braziers)
      props.push(
        // South Entrance Threshold & Greeting Colonnade
        { type: 'ruinedArch', x: 0, y: 1040 },
        { type: 'brazier', x: -50, y: 1020 },
        { type: 'brazier', x: 50, y: 1020 },
        { type: 'crystalPillar', x: -90, y: 980 },
        { type: 'crystalPillar', x: 90, y: 980 },
        { type: 'crystalPillar', x: -90, y: 780 },
        { type: 'crystalPillar', x: 90, y: 780 },
        { type: 'crystalPillar', x: -90, y: 580 },
        { type: 'crystalPillar', x: 90, y: 580 },
        { type: 'brazier', x: -50, y: 580 },
        { type: 'brazier', x: 50, y: 580 },

        // Mid-Ascent Grand Stargate Terrace (y: 200 to -200)
        { type: 'monument', x: 0, y: 0 },
        { type: 'ruinedArch', x: 0, y: 220 },
        { type: 'ruinedArch', x: 0, y: -220 },
        { type: 'crystalPillar', x: -180, y: 0 },
        { type: 'crystalPillar', x: 180, y: 0 },
        { type: 'brazier', x: -120, y: -120 },
        { type: 'brazier', x: 120, y: -120 },
        { type: 'brazier', x: -120, y: 120 },
        { type: 'brazier', x: 120, y: 120 },

        // Northern Titan Colosseum Throne Platform (y: -500 to -950)
        { type: 'ruinedArch', x: 0, y: -580 },
        { type: 'crystalPillar', x: -220, y: -750 },
        { type: 'crystalPillar', x: 220, y: -750 },
        { type: 'crystalPillar', x: -220, y: -920 },
        { type: 'crystalPillar', x: 220, y: -920 },
        { type: 'brazier', x: -100, y: -650 },
        { type: 'brazier', x: 100, y: -650 },
        { type: 'brazier', x: -100, y: -880 },
        { type: 'brazier', x: 100, y: -880 },
        { type: 'monument', x: 0, y: -940 }
      );

      npcs.push({
        id: 'npc_aurelia',
        name: 'Grand Arbiter Aurelia',
        role: 'Empyrean Titan Keeper [Click / T]',
        spriteKey: 'celestialArbiterNpc',
        x: 42,
        y: 980,
        dialogue: CELESTIAL_ASCENT_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.SOLARI_SUNKEN_VAULT) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'SUNKEN VAULT OF THE DAWN';
      if (zoneLabel) zoneLabel.innerText = 'To Golden Citadel';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      props.push(
        { type: 'crystalPillar', x: -110, y: -40 },
        { type: 'crystalPillar', x: 110, y: -40 },
        { type: 'pillar', x: -130, y: 90 },
        { type: 'pillar', x: 130, y: 90 },
        { type: 'brazier', x: -45, y: 130 },
        { type: 'brazier', x: 45, y: 130 },
        { type: 'brazier', x: -45, y: 40 },
        { type: 'brazier', x: 45, y: 40 },
        { type: 'brazier', x: -45, y: -50 },
        { type: 'brazier', x: 45, y: -50 }
      );
      npcs.push({
        id: 'npc_lucian',
        name: 'Pyremaster Lucian',
        role: 'Sunken Vault Flamekeeper [Click / T]',
        spriteKey: 'solariFlamekeeperNpc',
        x: 36,
        y: 130,
        dialogue: SOLARI_VAULT_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.UMBRI_SHADOW_LABYRINTH) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'DUSKVEIL SHADOW LABYRINTH';
      if (zoneLabel) zoneLabel.innerText = 'To Undercity';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'pillar', x: -130, y: 80 },
        { type: 'pillar', x: 130, y: 80 },
        { type: 'pillar', x: -130, y: -80 },
        { type: 'pillar', x: 130, y: -80 },
        { type: 'brazier', x: -60, y: 140 },
        { type: 'brazier', x: 60, y: 140 },
        { type: 'brazier', x: -60, y: -40 },
        { type: 'brazier', x: 60, y: -40 }
      );
      npcs.push({
        id: 'npc_vespera',
        name: 'Wraithmother Vespera',
        role: 'Weaver of Graveglass [Click / T]',
        spriteKey: 'shadowWraithmotherNpc',
        x: -36,
        y: 130,
        dialogue: UMBRI_LABYRINTH_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'ROOTDEEP PRIMORDIAL HOLLOW';
      if (zoneLabel) zoneLabel.innerText = 'To Glimmer Orchard';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'crystalPillar', x: -120, y: 70 },
        { type: 'crystalPillar', x: 120, y: 70 },
        { type: 'pillar', x: -140, y: -80 },
        { type: 'pillar', x: 140, y: -80 },
        { type: 'brazier', x: -50, y: 130 },
        { type: 'brazier', x: 50, y: 130 },
        { type: 'brazier', x: -50, y: 0 },
        { type: 'brazier', x: 50, y: 0 }
      );
      npcs.push({
        id: 'npc_sylvanus',
        name: 'Elder Druid Sylvanus',
        role: 'Voice of Ironbark [Click / T]',
        spriteKey: 'terraElderDruidNpc',
        x: 36,
        y: 130,
        dialogue: TERRA_GROVE_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'FRACTURED CHRONO-ARCHIVE';
      if (zoneLabel) zoneLabel.innerText = 'To Mirrorgate Spire';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      props.push(
        { type: 'crystalPillar', x: -120, y: 70 },
        { type: 'crystalPillar', x: 120, y: 70 },
        { type: 'crystalPillar', x: -120, y: -70 },
        { type: 'crystalPillar', x: 120, y: -70 },
        { type: 'monument', x: 0, y: -30 },
        { type: 'brazier', x: -55, y: 135 },
        { type: 'brazier', x: 55, y: 135 }
      );
      npcs.push({
        id: 'npc_zephyr',
        name: 'Chronos Sage Zephyr',
        role: 'Chronocore Archon [Click / T]',
        spriteKey: 'aetherChronosNpc',
        x: -36,
        y: 130,
        dialogue: AETHER_ARCHIVE_DIALOGUE,
      });
    } else {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || cfg.shortTitle || 'NEXUS WARZONE';
      if (zoneLabel) zoneLabel.innerText = 'To Sanctuary';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      if (resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE) {
        // Decorate the massive 4800x3600 Open World Continent
        // 1. South Sanctuary Vale (Meadows, Campfires, Ancient Oaks, River Bridges)
        props.push(
          { type: 'campfire', x: 0, y: 1490 },
          { type: 'campfire', x: 130, y: 1380 },
          { type: 'ancientOak', x: -160, y: 1520 },
          { type: 'ancientOak', x: 160, y: 1520 },
          { type: 'ancientOak', x: -260, y: 1380 },
          { type: 'ancientOak', x: 260, y: 1380 },
          { type: 'ancientOak', x: -100, y: 1620 },
          { type: 'ancientOak', x: 100, y: 1620 },
          // River Bridge Torches
          { type: 'brazier', x: -38, y: 1220 },
          { type: 'brazier', x: 38, y: 1220 },
          { type: 'brazier', x: -38, y: 1270 },
          { type: 'brazier', x: 38, y: 1270 }
        );

        // 2. Whispering Mountain Pass (Pines, Granite Crags, Waystation Campfires)
        props.push(
          { type: 'campfire', x: -45, y: 740 },
          { type: 'campfire', x: 50, y: 490 },
          // Evergreen Pines along the Pass
          { type: 'pineTree', x: -85, y: 1020 },
          { type: 'pineTree', x: 85, y: 1020 },
          { type: 'pineTree', x: -95, y: 860 },
          { type: 'pineTree', x: 95, y: 860 },
          { type: 'pineTree', x: -80, y: 690 },
          { type: 'pineTree', x: 100, y: 700 },
          { type: 'pineTree', x: -85, y: 530 },
          { type: 'pineTree', x: 90, y: 530 },
          { type: 'pineTree', x: -90, y: 400 },
          { type: 'pineTree', x: 85, y: 400 },
          // Granite Boulders & Crags
          { type: 'mountainCrag', x: -135, y: 960 },
          { type: 'mountainCrag', x: 140, y: 960 },
          { type: 'mountainCrag', x: -150, y: 780 },
          { type: 'mountainCrag', x: 155, y: 780 },
          { type: 'mountainCrag', x: -160, y: 590 },
          { type: 'mountainCrag', x: 165, y: 590 },
          { type: 'mountainCrag', x: -140, y: 440 },
          { type: 'mountainCrag', x: 145, y: 440 }
        );

        // 3. Central Caldera Bastion (Arches, Braziers, Obelisks)
        props.push(
          { type: 'ruinedArch', x: 0, y: 260 },
          { type: 'ruinedArch', x: 0, y: -260 },
          { type: 'ruinedArch', x: -260, y: 0 },
          { type: 'ruinedArch', x: 260, y: 0 },
          { type: 'brazier', x: -90, y: 90 },
          { type: 'brazier', x: 90, y: 90 },
          { type: 'brazier', x: -90, y: -90 },
          { type: 'brazier', x: 90, y: -90 },
          { type: 'pillar', x: -140, y: 0 },
          { type: 'pillar', x: 140, y: 0 }
        );

        // 4. North Forgotten Ruins Plateau (Ruined Arches, Ancient Monuments, Stone Pillars & Ascension Gateway)
        props.push(
          { type: 'ruinedArch', x: 0, y: -520 },
          { type: 'ruinedArch', x: 0, y: -960 },
          { type: 'ruinedArch', x: 0, y: -1380 },
          { type: 'ruinedArch', x: 0, y: -1580 },
          { type: 'ruinedArch', x: 0, y: -1760 },
          { type: 'monument', x: 0, y: -740 },
          { type: 'monument', x: -110, y: -1150 },
          { type: 'monument', x: 110, y: -1150 },
          { type: 'pillar', x: -75, y: -620 },
          { type: 'pillar', x: 75, y: -620 },
          { type: 'pillar', x: -75, y: -860 },
          { type: 'pillar', x: 75, y: -860 },
          { type: 'pillar', x: -75, y: -1250 },
          { type: 'pillar', x: 75, y: -1250 },
          { type: 'crystalPillar', x: -80, y: -1580 },
          { type: 'crystalPillar', x: 80, y: -1580 },
          { type: 'crystalPillar', x: -80, y: -1750 },
          { type: 'crystalPillar', x: 80, y: -1750 },
          { type: 'brazier', x: -48, y: -1680 },
          { type: 'brazier', x: 48, y: -1680 },
          { type: 'brazier', x: -48, y: -1760 },
          { type: 'brazier', x: 48, y: -1760 }
        );

        // 5. Regional Wilderness Features
        // NW Terra Ironwood Wilds
        props.push(
          { type: 'ancientOak', x: -650, y: -450 },
          { type: 'ancientOak', x: -900, y: -480 },
          { type: 'ancientOak', x: -1150, y: -680 },
          { type: 'pineTree', x: -780, y: -720 },
          { type: 'pineTree', x: -1020, y: -880 }
        );
        // NE Umbri Shadow Fens
        props.push(
          { type: 'monument', x: 880, y: -450 },
          { type: 'brazier', x: 700, y: -550 },
          { type: 'brazier', x: 1050, y: -750 },
          { type: 'pillar', x: 920, y: -820 }
        );
        // SW Solari Sun-Canyon
        props.push(
          { type: 'mountainCrag', x: -720, y: 420 },
          { type: 'mountainCrag', x: -1050, y: 620 },
          { type: 'brazier', x: -880, y: 480 },
          { type: 'monument', x: -920, y: 820 }
        );
        // SE Aether Astral Plateau
        props.push(
          { type: 'crystalPillar', x: 720, y: 420 },
          { type: 'crystalPillar', x: 1050, y: 620 },
          { type: 'crystalPillar', x: -880, y: 480 },
          { type: 'monument', x: 920, y: 820 }
        );

        npcs.push({
          id: 'npc_archon',
          name: 'Commander Valerius',
          role: 'Sunspire Warlord [Click / T]',
          spriteKey: 'warzoneArchonNpc',
          x: -36,
          y: 1420, // Waystation in South Sanctuary Vale
          dialogue: WARZONE_DIALOGUE,
        });
      } else {
        [[-90, 95], [90, 95], [-145, -20], [145, -20], [-75, -135], [75, -135]].forEach(([pxX, pxY], idx) => {
          props.push({ type: idx % 2 === 0 ? 'pillar' : 'brazier', x: pxX, y: pxY });
        });
      }

      if (resolvedRoomType === ROOM_TYPES.SOLARI_CITADEL) {
        npcs.push({
          id: 'npc_vael',
          name: 'Captain Vaelen',
          role: 'Lantern District Templar [Click / T]',
          spriteKey: 'solariCaptainNpc',
          x: -45,
          y: 125,
          dialogue: SOLARI_CITADEL_DIALOGUE,
        });
      } else if (resolvedRoomType === ROOM_TYPES.UMBRI_UNDERCITY) {
        npcs.push({
          id: 'npc_nyx',
          name: 'Shadow Broker Nyx',
          role: 'Duskveil Smuggler [Click / T]',
          spriteKey: 'shadowBrokerNpc',
          x: 45,
          y: 125,
          dialogue: UMBRI_UNDERCITY_DIALOGUE,
        });
      } else if (resolvedRoomType === ROOM_TYPES.TERRA_ORCHARD) {
        npcs.push({
          id: 'npc_rowan',
          name: 'Grove Tender Rowan',
          role: 'Rootdeep Herbalist [Click / T]',
          spriteKey: 'terraHerbalistNpc',
          x: -45,
          y: 125,
          dialogue: TERRA_ORCHARD_DIALOGUE,
        });
      } else if (resolvedRoomType === ROOM_TYPES.AETHER_SPIRE) {
        npcs.push({
          id: 'npc_kaelen',
          name: 'Astromancer Kaelen',
          role: 'Mirrorgate Stargazer [Click / T]',
          spriteKey: 'aetherAstromancerNpc',
          x: 45,
          y: 125,
          dialogue: AETHER_SPIRE_DIALOGUE,
        });
      }
    }
  }

  function buildOfflineZone(zone, spawnX = null, spawnY = null) {
    setupZoneDecor(zone);
    entities = [];
    allies = [];
    projectiles = [];
    groundZones = [];
    worldBanners = [];
    lootDrops = [];

    const hasCustomSpawn = spawnX !== null && spawnY !== null && Number.isFinite(Number(spawnX)) && Number.isFinite(Number(spawnY));
    if (hasCustomSpawn) {
      player.x = Number(spawnX);
      player.y = Number(spawnY);
    }

    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 96;
      }
      entities.push(
        { id: 'dummy_1', name: 'Sanctuary Dummy', sub: 'Lv.1 Awakening Training Post', type: 'dummy', spriteKey: 'dummy', x: 0, y: 12, origX: 0, origY: 12, hp: 30, maxHp: 30, xpReward: 30, radius: 14, hitFlash: 0 },
        { id: 'dummy_2', name: 'Armored Training Post', sub: 'Lv.5 Resilient Training Post', type: 'dummy', spriteKey: 'dummy', x: 0, y: -45, origX: 0, origY: -45, hp: 120, maxHp: 120, xpReward: 65, radius: 15, hitFlash: 0 },
        { id: 'tut_font', name: 'Awakening Glimmer Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -88, y: 22, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'tut_font_2', name: 'East Glimmer Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 88, y: 22, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.ARENA_3V3) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 175;
      }
      entities.push(
        { id: 'blue_nexus', name: 'Solari Sanctuary Nexus', sub: '25 HP Ally Core', type: 'ally_nexus', spriteKey: 'nexusBlue', x: 0, y: 220, hp: 25, maxHp: 25, radius: 22, hitFlash: 0 },
        { id: 'red_nexus', name: 'Umbri Dominion Nexus', sub: '25 HP Enemy Core', type: 'nexus', spriteKey: 'nexusRed', x: 0, y: -215, hp: 25, maxHp: 25, xpReward: 220, radius: 22, hitFlash: 0 },
        { id: 'enemy_1', name: 'Void Stalker [Umbri]', sub: 'Enemy Vanguard', type: 'mob', spriteKey: 'voidStalker', x: -64, y: -85, origX: -64, origY: -85, hp: 25, maxHp: 25, damage: 4, xpReward: 65, speed: 54, aggroRange: 230, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'enemy_2', name: 'Gloam Reaper [Umbri]', sub: 'Enemy Harvester', type: 'mob', spriteKey: 'voidStalker', x: 0, y: -105, origX: 0, origY: -105, hp: 22, maxHp: 22, damage: 4, xpReward: 65, speed: 60, aggroRange: 230, attackRange: 26, radius: 14, hitFlash: 0 },
        { id: 'enemy_3', name: 'Brambleheart Behemoth', sub: 'Enemy Terra Titan', type: 'mob', isBoss: true, spriteKey: 'graniteBoss', x: 64, y: -85, origX: 64, origY: -85, hp: 34, maxHp: 34, damage: 5, xpReward: 110, speed: 42, aggroRange: 230, attackRange: 32, radius: 20, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.SOLARI_CITADEL) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      entities.push(
        { id: 'sol_mob_1', name: 'Sunforged Sentinel', sub: 'Lv.3 Solari Construct', type: 'mob', spriteKey: 'solariSentinel', x: -75, y: 35, origX: -75, origY: 35, hp: 36, maxHp: 36, damage: 4, xpReward: 65, speed: 52, aggroRange: 112, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_mob_2', name: 'Lantern Inquisitor', sub: 'Lv.4 Radiant Zealot', type: 'mob', spriteKey: 'solariSentinel', x: 75, y: 25, origX: 75, origY: 25, hp: 38, maxHp: 38, damage: 5, xpReward: 75, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_node_1', name: 'Solari Dawn Well', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'sol_boss', name: 'High Sunfire Colossus', sub: '★ Lv.6 Golden Citadel Boss', type: 'mob', isBoss: true, dropGear: 'sunfire_greatsword', spriteKey: 'solariBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 85, maxHp: 85, damage: 6, xpReward: 185, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.UMBRI_UNDERCITY) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      entities.push(
        { id: 'umb_mob_1', name: 'Duskveil Stalker', sub: 'Lv.3 Umbri Assassin', type: 'mob', spriteKey: 'voidStalker', x: -80, y: 30, origX: -80, origY: 30, hp: 34, maxHp: 34, damage: 5, xpReward: 65, speed: 55, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_mob_2', name: 'Duskveil Bog Fiend', sub: 'Lv.4 Graveglass Reaper', type: 'mob', spriteKey: 'duskFiend', x: 80, y: 25, origX: 80, origY: 25, hp: 36, maxHp: 36, damage: 5, xpReward: 75, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_node_1', name: 'Duskveil Shadow Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'umb_boss', name: 'Graveglass Archlich', sub: '★ Lv.6 Sepulcher Boss', type: 'mob', isBoss: true, dropGear: 'scythe_soulreaper', spriteKey: 'umbriBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 80, maxHp: 80, damage: 7, xpReward: 185, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.TERRA_ORCHARD) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      entities.push(
        { id: 'ter_mob_1', name: 'Bramble Treant', sub: 'Lv.3 Terra Guardian', type: 'mob', spriteKey: 'terraWarden', x: -78, y: 32, origX: -78, origY: 32, hp: 40, maxHp: 40, damage: 4, xpReward: 65, speed: 52, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_mob_2', name: 'Rootdeep Stonekin', sub: 'Lv.4 Ironwood Guardian', type: 'mob', spriteKey: 'terraWarden', x: 78, y: 25, origX: 78, origY: 25, hp: 42, maxHp: 42, damage: 5, xpReward: 75, speed: 50, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_node_1', name: 'Terra Root Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'ter_boss', name: 'Elder Rootdeep Behemoth', sub: '★ Lv.6 Orchard Boss', type: 'mob', isBoss: true, dropGear: 'ironwood_armor', spriteKey: 'graniteBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 95, maxHp: 95, damage: 6, xpReward: 185, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.AETHER_SPIRE) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      entities.push(
        { id: 'aeth_mob_1', name: 'Chrono Anomaly', sub: 'Lv.3 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: -78, y: 32, origX: -78, origY: 32, hp: 34, maxHp: 34, damage: 5, xpReward: 65, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_mob_2', name: 'Chrono Construct', sub: 'Lv.4 Fractured Sentinel', type: 'mob', spriteKey: 'aetherWeaver', x: 78, y: 25, origX: 78, origY: 25, hp: 36, maxHp: 36, damage: 5, xpReward: 75, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_node_1', name: 'Mirrorgate Star Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'aeth_boss', name: 'Archon of the Continuum', sub: '★ Lv.6 Mirrorgate Boss', type: 'mob', isBoss: true, dropGear: 'mirror_shield', spriteKey: 'aetherBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 82, maxHp: 82, damage: 7, xpReward: 185, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 190;
      }
      entities.push(
        { id: 'ruin_mob_1', name: 'Ancient Ruin Golem', sub: 'Lv.4 Keystone Construct', type: 'mob', spriteKey: 'graniteBoss', x: -90, y: 40, origX: -90, origY: 40, hp: 44, maxHp: 44, damage: 4, xpReward: 75, speed: 42, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ruin_mob_2', name: 'Ancient Ruin Golem', sub: 'Lv.4 Keystone Construct', type: 'mob', spriteKey: 'graniteBoss', x: 90, y: 40, origX: 90, origY: 40, hp: 44, maxHp: 44, damage: 4, xpReward: 75, speed: 42, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ruin_mob_3', name: 'Lost Shard Sentinel', sub: 'Lv.5 Prismatic Sentinel', type: 'mob', spriteKey: 'mobSolari', x: -75, y: -50, origX: -75, origY: -50, hp: 48, maxHp: 48, damage: 5, xpReward: 85, speed: 52, aggroRange: 120, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'ruin_mob_4', name: 'Lost Shard Sentinel', sub: 'Lv.5 Prismatic Sentinel', type: 'mob', spriteKey: 'mobAether', x: 75, y: -50, origX: 75, origY: -50, hp: 48, maxHp: 48, damage: 5, xpReward: 85, speed: 52, aggroRange: 120, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'ruin_boss', name: 'The Prismatic Golem', sub: '★ Lv.7 First Nexus Guardian', type: 'mob', isBoss: true, dropGear: 'prismatic_keystone', spriteKey: 'graniteBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 88, maxHp: 88, damage: 7, xpReward: 210, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'tut_font_ruins_c', name: 'Prismatic Keystone Spire', sub: 'Ancient Prismatic Node [E]', type: 'node', spriteKey: 'node', x: 0, y: 0, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'tut_font_ruins_w', name: 'West Ruin Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -140, y: -30, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'tut_font_ruins_e', name: 'East Ruin Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 140, y: -30, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.SOLARI_SUNKEN_VAULT) {
      player.x = 0;
      player.y = 180;
      entities.push(
        { id: 'vault_mob_1', name: 'Sunfire Automaton', sub: 'Lv.4 Solari Automaton', type: 'mob', spriteKey: 'solariSentinel', x: -85, y: 30, origX: -85, origY: 30, hp: 42, maxHp: 42, damage: 5, xpReward: 80, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'vault_mob_2', name: 'Sunfire Automaton', sub: 'Lv.4 Solari Automaton', type: 'mob', spriteKey: 'solariSentinel', x: 85, y: 30, origX: 85, origY: 30, hp: 42, maxHp: 42, damage: 5, xpReward: 80, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'vault_mob_3', name: 'Dawnblade Crusader', sub: 'Lv.5 Solari Elite Guard', type: 'mob', spriteKey: 'solariSentinel', x: -60, y: -50, origX: -60, origY: -50, hp: 46, maxHp: 46, damage: 5, xpReward: 90, speed: 55, aggroRange: 118, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'vault_boss', name: 'Solaris Core Colossus', sub: '★ Lv.8 Sunken Dawn Titan', type: 'mob', isBoss: true, dropGear: 'dawnfire_crest', spriteKey: 'solariBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 96, maxHp: 96, damage: 7, xpReward: 240, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'vault_node_1', name: 'Dawnstone Glimmer Well', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'vault_node_2', name: 'Solar Core Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.UMBRI_SHADOW_LABYRINTH) {
      player.x = 0;
      player.y = 180;
      entities.push(
        { id: 'lab_mob_1', name: 'Graveglass Phantom', sub: 'Lv.4 Umbri Specter', type: 'mob', spriteKey: 'voidStalker', x: -90, y: 30, origX: -90, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'lab_mob_2', name: 'Graveglass Phantom', sub: 'Lv.4 Umbri Specter', type: 'mob', spriteKey: 'voidStalker', x: 90, y: 30, origX: 90, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'lab_mob_3', name: 'Gloam Assassin', sub: 'Lv.5 Umbri Elite', type: 'mob', spriteKey: 'duskFiend', x: -65, y: -60, origX: -65, origY: -60, hp: 42, maxHp: 42, damage: 6, xpReward: 90, speed: 60, aggroRange: 120, attackRange: 30, radius: 14, hitFlash: 0 },
        { id: 'lab_boss', name: 'Abyssal Devourer', sub: '★ Lv.8 Shade of the Void', type: 'mob', isBoss: true, dropGear: 'void_soulblade', spriteKey: 'umbriBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 92, maxHp: 92, damage: 8, xpReward: 240, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'lab_node_1', name: 'Graveglass Leyline Shroud', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'lab_node_2', name: 'Void Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY) {
      player.x = 0;
      player.y = 180;
      entities.push(
        { id: 'hollow_mob_1', name: 'Ironwood Barkkin', sub: 'Lv.4 Terra Forestkin', type: 'mob', spriteKey: 'terraWarden', x: -85, y: 30, origX: -85, origY: 30, hp: 48, maxHp: 48, damage: 4, xpReward: 80, speed: 50, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'hollow_mob_2', name: 'Ironwood Barkkin', sub: 'Lv.4 Terra Forestkin', type: 'mob', spriteKey: 'terraWarden', x: 85, y: 30, origX: 85, origY: 30, hp: 48, maxHp: 48, damage: 4, xpReward: 80, speed: 50, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'hollow_mob_3', name: 'Sporeling Stalker', sub: 'Lv.5 Terra Beast', type: 'mob', spriteKey: 'terraWarden', x: 70, y: -60, origX: 70, origY: -60, hp: 44, maxHp: 44, damage: 5, xpReward: 90, speed: 55, aggroRange: 118, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'hollow_boss', name: 'Primordial Ironbark', sub: '★ Lv.8 Elder Treant of the Hollow', type: 'mob', isBoss: true, dropGear: 'primordial_bark_chest', spriteKey: 'graniteBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 110, maxHp: 110, damage: 7, xpReward: 250, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'hollow_node_1', name: 'Ironwood Blossom Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'hollow_node_2', name: 'Rootdeep Heart Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE) {
      player.x = 0;
      player.y = 180;
      entities.push(
        { id: 'archive_mob_1', name: 'Chrono Echo', sub: 'Lv.4 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: -85, y: 30, origX: -85, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'archive_mob_2', name: 'Chrono Echo', sub: 'Lv.4 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: 85, y: 30, origX: 85, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'archive_mob_3', name: 'Astral Weaver', sub: 'Lv.5 Continuum Mage', type: 'mob', spriteKey: 'aetherWeaver', x: -70, y: -60, origX: -70, origY: -60, hp: 42, maxHp: 42, damage: 6, xpReward: 90, speed: 56, aggroRange: 118, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'archive_boss', name: 'Continuum Singularity', sub: '★ Lv.8 Paradox Titan', type: 'mob', isBoss: true, dropGear: 'chronos_singularity_core', spriteKey: 'aetherBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 94, maxHp: 94, damage: 8, xpReward: 240, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'archive_node_1', name: 'Continuum Time Spire', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'archive_node_2', name: 'Astral Mirrorgate Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.CELESTIAL_ASCENT) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 1040;
      }
      entities.push(
        { id: 'cel_node_1', name: 'Font of the Morning Star', sub: 'Empyrean Glimmer Spire [E]', type: 'node', spriteKey: 'node', x: -120, y: 600, charges: 6, maxCharges: 6, radius: 18, hitFlash: 0 },
        { id: 'cel_node_2', name: 'Shrine of Empyrean Resonance', sub: 'Ancient Leyline Shrine [E]', type: 'node', spriteKey: 'node', x: 120, y: 600, charges: 6, maxCharges: 6, radius: 18, hitFlash: 0 },
        { id: 'cel_node_summit', name: 'Apex Keystone Font', sub: 'Titan Glimmer Core [E]', type: 'node', spriteKey: 'node', x: 0, y: -450, charges: 8, maxCharges: 8, radius: 18, hitFlash: 0 },
        { id: 'cel_mob_1', name: 'Empyrean Star-Knight', sub: 'Lv.28 Celestial Construct', type: 'mob', spriteKey: 'solariSentinel', x: -90, y: 450, origX: -90, origY: 450, hp: 280, maxHp: 280, damage: 16, xpReward: 320, speed: 48, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_2', name: 'Empyrean Star-Knight', sub: 'Lv.28 Celestial Construct', type: 'mob', spriteKey: 'solariSentinel', x: 90, y: 450, origX: 90, origY: 450, hp: 280, maxHp: 280, damage: 16, xpReward: 320, speed: 48, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_3', name: 'Astral Chrono-Seraph', sub: 'Lv.30 Celestial Seraph', type: 'mob', spriteKey: 'aetherWeaver', x: -120, y: 100, origX: -120, origY: 100, hp: 260, maxHp: 260, damage: 18, xpReward: 360, speed: 54, aggroRange: 130, attackRange: 36, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_4', name: 'Astral Chrono-Seraph', sub: 'Lv.30 Celestial Seraph', type: 'mob', spriteKey: 'aetherWeaver', x: 120, y: 100, origX: 120, origY: 100, hp: 260, maxHp: 260, damage: 18, xpReward: 360, speed: 54, aggroRange: 130, attackRange: 36, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_5', name: 'Void Annihilator', sub: 'Lv.32 Apex Infiltrator', type: 'mob', spriteKey: 'mobUmbri', x: 0, y: -250, origX: 0, origY: -250, hp: 420, maxHp: 420, damage: 22, xpReward: 480, speed: 50, aggroRange: 140, attackRange: 32, radius: 18, hitFlash: 0 },
        { id: 'cel_titan_boss', name: 'Aurelius the Empyrean Sovereign', sub: '★ Lv.35 Ancient Titan of the Nexus', type: 'mob', isBoss: true, dropGear: 'crown_of_dawn', spriteKey: 'celestialTitanBoss', x: 0, y: -750, origX: 0, origY: -750, hp: 3200, maxHp: 3200, damage: 32, xpReward: 1600, speed: 46, aggroRange: 180, attackRange: 42, radius: 28, hitFlash: 0 }
      );
    } else {
      player.x = 0;
      player.y = 1740;
      entities.push(
        // Vanguard Colossus Training Post
        { id: 'val_dummy', name: 'Vanguard Colossus Post', sub: 'Lv.30 Torment Target Post', type: 'dummy', spriteKey: 'dummy', x: 60, y: 1440, origX: 60, origY: 1440, hp: 600, maxHp: 600, xpReward: 200, radius: 16, hitFlash: 0 },
        // 4 Continental Faction Outposts (Late-Game Torment: 300 HP)
        { id: 'outpost_Terra', faction: 'Terra', name: 'Terra Forest Outpost Nexus', sub: '300 HP Terra Outpost Nexus [Torment]', type: 'outpost_nexus', spriteKey: 'nexusGreen', x: -850, y: -650, origX: -850, origY: -650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Umbri', faction: 'Umbri', name: 'Umbri Shadow Outpost Nexus', sub: '300 HP Umbri Outpost Nexus [Torment]', type: 'outpost_nexus', spriteKey: 'nexusPurple', x: 850, y: -650, origX: 850, origY: -650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Solari', faction: 'Solari', name: 'Solari Radiant Outpost Nexus', sub: '300 HP Solari Outpost Nexus [Torment]', type: 'outpost_nexus', spriteKey: 'nexusGold', x: -850, y: 650, origX: -850, origY: 650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Aether', faction: 'Aether', name: 'Aether Astral Outpost Nexus', sub: '300 HP Aether Outpost Nexus [Torment]', type: 'outpost_nexus', spriteKey: 'nexusCyan', x: 850, y: 650, origX: 850, origY: 650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        // Shattered Nexus Shard (Torment Core)
        { id: 'siege_shard', name: 'Shattered Nexus Shard', sub: '⚡ Continental Nexus Core (Torment PvPvE)', type: 'siege_shard', isBoss: true, spriteKey: 'siegeShard', x: 0, y: 0, origX: 0, origY: 0, hp: 850, maxHp: 850, xpReward: 2500, radius: 24, hitFlash: 0 },
        // 4 Ancient Leyline Shrines [E]
        { id: 'shrine_solari', name: 'Solari Radiant Shrine', sub: 'Ancient Leyline [E] • Radiant Wrath', type: 'shrine', affinity: 'solari', buffName: 'Solar Wrath', x: -550, y: 550, origX: -550, origY: 550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_umbri', name: 'Umbri Void Obelisk', sub: 'Ancient Leyline [E] • Void Leech', type: 'shrine', affinity: 'umbri', buffName: 'Void Step', x: 550, y: -550, origX: 550, origY: -550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_terra', name: 'Terra Bastion Monolith', sub: 'Ancient Leyline [E] • Primal Bastion', type: 'shrine', affinity: 'terra', buffName: 'Stone Ward', x: -550, y: -550, origX: -550, origY: -550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_aether', name: 'Aether Chrono Spire', sub: 'Ancient Leyline [E] • Chrono Surge', type: 'shrine', affinity: 'aether', buffName: 'Chrono Surge', x: 550, y: 550, origX: 550, origY: 550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        // 4 Grand World Bosses (Late-Game Torment: 10x Stats)
        { id: 'terra_world_boss', name: 'Elder Ironwood Colossus', sub: '★ Lv.32 Terra Continent World Boss', type: 'mob', isBoss: true, dropGear: 'ironwood_armor', spriteKey: 'graniteBoss', x: -950, y: -850, origX: -950, origY: -850, hp: 1250, maxHp: 1250, damage: 42, xpReward: 2600, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'umbri_world_boss', name: 'Malakor the Soulreaper', sub: '★ Lv.32 Umbri Continent World Boss', type: 'mob', isBoss: true, dropGear: 'scythe_soulreaper', spriteKey: 'umbriBoss', x: 950, y: -850, origX: 950, origY: -850, hp: 1150, maxHp: 1150, damage: 46, xpReward: 2600, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'solari_world_boss', name: 'High Sunfire Juggernaut', sub: '★ Lv.32 Solari Continent World Boss', type: 'mob', isBoss: true, dropGear: 'sunfire_greatsword', spriteKey: 'solariBoss', x: -950, y: 850, origX: -950, origY: 850, hp: 1250, maxHp: 1250, damage: 44, xpReward: 2600, speed: 39, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'aether_world_boss', name: 'Continuum Singularity Paradox', sub: '★ Lv.32 Aether Continent World Boss', type: 'mob', isBoss: true, dropGear: 'chronos_singularity_core', spriteKey: 'aetherBoss', x: 950, y: 850, origX: 950, origY: 850, hp: 1180, maxHp: 1180, damage: 48, xpReward: 2600, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        // Strategic Glimmer Nodes across valleys, mountain passes, and wilderness
        { id: 'node_sanctuary', name: 'Sanctuary Vale Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: 1380, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_pass', name: 'Whispering Pass Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: 700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_center_s', name: 'Caldera South Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: 180, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_center_n', name: 'Caldera North Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: -180, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_ruins', name: 'Forgotten Ruins Keystone Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: -900, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_terra', name: 'Terra Blossom Spire', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: -1100, y: -700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_umbri', name: 'Sepulcher Shadow Spire', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 1100, y: -700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_solari', name: 'Dawnfire Solar Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: -1100, y: 700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_aether', name: 'Aether Resonance Crystal', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 1100, y: 700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        // Whispering Mountain Pass Mobs (Late-Game Torment: 10x Stats)
        { id: 'pass_mob_1', name: 'Granite Ridge Sentinel', sub: 'Lv.28 Mountain Golem', type: 'mob', spriteKey: 'graniteBoss', x: -60, y: 880, origX: -60, origY: 880, hp: 420, maxHp: 420, damage: 24, xpReward: 750, speed: 40, aggroRange: 110, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'pass_mob_2', name: 'Whispering Pass Raider', sub: 'Lv.29 Highland Marauder', type: 'mob', spriteKey: 'voidStalker', x: 70, y: 640, origX: 70, origY: 640, hp: 380, maxHp: 380, damage: 26, xpReward: 800, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'pass_mob_3', name: 'High Crag Behemoth', sub: 'Lv.30 Ridge Colossus', type: 'mob', spriteKey: 'graniteBoss', x: -80, y: 460, origX: -80, origY: 460, hp: 540, maxHp: 540, damage: 32, xpReward: 1000, speed: 38, aggroRange: 120, attackRange: 32, radius: 20, hitFlash: 0 },
        // North Forgotten Ruins Plateau (Ancient Megaliths)
        { id: 'ruin_guard_1', name: 'Ancient Keystone Golem', sub: 'Lv.30 Forgotten Golem', type: 'mob', spriteKey: 'graniteBoss', x: -90, y: -750, origX: -90, origY: -750, hp: 520, maxHp: 520, damage: 32, xpReward: 1050, speed: 40, aggroRange: 115, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'ruin_guard_2', name: 'Lost Shard Sentinel', sub: 'Lv.30 Keystone Sentinel', type: 'mob', spriteKey: 'mobSolari', x: 90, y: -750, origX: 90, origY: -750, hp: 500, maxHp: 500, damage: 32, xpReward: 1000, speed: 52, aggroRange: 115, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'ruin_boss_field', name: 'The Prismatic Overlord', sub: '★ Lv.34 Megalith World Boss', type: 'mob', isBoss: true, dropGear: 'prismatic_keystone', spriteKey: 'graniteBoss', x: 0, y: -1150, origX: 0, origY: -1150, hp: 1300, maxHp: 1300, damage: 46, xpReward: 2750, speed: 38, aggroRange: 135, attackRange: 34, radius: 24, hitFlash: 0 },
        // Roaming Mob Packs across the 4 Continents & Central Caldera (10x Stats)
        { id: 'ter_mob_1', name: 'Bramble Treant', sub: 'Lv.29 Terra Guardian', type: 'mob', spriteKey: 'terraWarden', x: -680, y: -520, origX: -680, origY: -520, hp: 440, maxHp: 440, damage: 28, xpReward: 850, speed: 52, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_mob_2', name: 'Ironwood Stonekin', sub: 'Lv.30 Forest Sentinel', type: 'mob', spriteKey: 'terraWarden', x: -1020, y: -480, origX: -1020, origY: -480, hp: 480, maxHp: 480, damage: 30, xpReward: 950, speed: 50, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'umb_mob_1', name: 'Void Stalker Vanguard', sub: 'Lv.29 Umbri Assassin', type: 'mob', spriteKey: 'voidStalker', x: 680, y: -520, origX: 680, origY: -520, hp: 420, maxHp: 420, damage: 30, xpReward: 850, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_mob_2', name: 'Graveglass Phantom', sub: 'Lv.30 Gloom Specter', type: 'mob', spriteKey: 'duskFiend', x: 1020, y: -480, origX: 1020, origY: -480, hp: 460, maxHp: 460, damage: 32, xpReward: 950, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_mob_1', name: 'Sunforged Sentinel', sub: 'Lv.29 Solari Construct', type: 'mob', spriteKey: 'solariSentinel', x: -680, y: 520, origX: -680, origY: 520, hp: 450, maxHp: 450, damage: 28, xpReward: 850, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_mob_2', name: 'Dawnblade Crusader', sub: 'Lv.30 Radiant Paladin', type: 'mob', spriteKey: 'solariSentinel', x: -1020, y: 480, origX: -1020, origY: 480, hp: 480, maxHp: 480, damage: 30, xpReward: 950, speed: 54, aggroRange: 115, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'aeth_mob_1', name: 'Chrono Echo', sub: 'Lv.29 Astral Sentinel', type: 'mob', spriteKey: 'aetherWeaver', x: 680, y: 520, origX: 680, origY: 520, hp: 420, maxHp: 420, damage: 30, xpReward: 850, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_mob_2', name: 'Continuum Weaver', sub: 'Lv.30 Singularity Mage', type: 'mob', spriteKey: 'aetherWeaver', x: 1020, y: 480, origX: 1020, origY: 480, hp: 460, maxHp: 460, damage: 32, xpReward: 950, speed: 55, aggroRange: 115, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'void_mid_1', name: 'Void Stalker Raider', sub: 'Lv.28 Warzone Invader', type: 'mob', spriteKey: 'voidStalker', x: -140, y: -60, origX: -140, origY: -60, hp: 360, maxHp: 360, damage: 24, xpReward: 700, speed: 52, aggroRange: 112, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'void_mid_2', name: 'Duskblade Marauder', sub: 'Lv.28 Warzone Invader', type: 'mob', spriteKey: 'duskFiend', x: 140, y: -60, origX: 140, origY: -60, hp: 340, maxHp: 340, damage: 26, xpReward: 700, speed: 56, aggroRange: 112, attackRange: 26, radius: 14, hitFlash: 0 }
      );
    }
    camera.x = player.x;
    camera.y = player.y;
  }

  // ==========================================
  // Real-Time Authoritative Server Packet Handling
  // ==========================================
  function getZoneDangerTag() {
    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      return ` • <span style="color:#4ade80; font-weight:800;">[SANCTUARY]</span>`;
    }
    if (currentRoomType === ROOM_TYPES.NEXUS_WARZONE) {
      return ` • <span style="color:#f97316; font-weight:800;">[TORMENT REALM]</span>`;
    }
    if (currentRoomType === ROOM_TYPES.CELESTIAL_ASCENT) {
      return ` • <span style="color:#facc15; font-weight:800;">[TITAN APEX]</span>`;
    }
    if (currentRoomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      return ` • <span style="color:#38bdf8; font-weight:800;">[FIRST NEXUS]</span>`;
    }
    return ` • <span style="color:#a855f7; font-weight:800;">[DUNGEON]</span>`;
  }

  function updateNetStatusPill() {
    const pill = document.getElementById('net-status-pill');
    if (!pill) return;
    const dangerTag = getZoneDangerTag();

    if (isSinglePlayer) {
      pill.innerHTML = `
        <div class="net-pill-line1" style="color:#38bdf8;">● SINGLE PLAYER • 0ms${dangerTag}</div>
        <div class="net-pill-line2">OFFLINE REALM • LOCAL INSTANT</div>
      `;
      return;
    }
    if (!net.connected) {
      pill.innerHTML = `
        <div class="net-pill-line1" style="color:#fbbf24;">● CONNECTING...</div>
        <div class="net-pill-line2">ENTERING CONTINENTAL REALM</div>
      `;
      return;
    }
    const roomPop = remotePlayers.size + 1;
    const ping = net.pingMs || 1;
    const pingColor = ping < 55 ? '#4ade80' : ping < 130 ? '#facc15' : '#f87171';
    pill.innerHTML = `
      <div class="net-pill-line1" style="color:${pingColor};">● ONLINE • ${ping}ms${dangerTag}</div>
      <div class="net-pill-line2">${roomPop}/${currentRoomMax} IN ZONE • ${onlineTotal} ONLINE</div>
    `;
  }

  function isRemoteHostile(rp) {
    const cfg = ROOM_CONFIGS[currentRoomType];
    if (!cfg || !cfg.pvp) return false;
    if (currentRoomType === ROOM_TYPES.ARENA_3V3) return rp.team && player.team && rp.team !== player.team;
    if (currentParty && currentParty.members?.some((m) => m.id === rp.id)) return false;
    return rp.faction !== localProfile.faction;
  }

  function updateSiegeBanner(siegeState) {
    const banner = document.getElementById('siege-banner');
    if (!banner || currentRoomType !== ROOM_TYPES.NEXUS_WARZONE || !siegeState) return;
    const titleEl = document.getElementById('siege-banner-title');
    const subEl = document.getElementById('siege-banner-sub');
    if (!titleEl || !subEl) return;

    if (siegeState.active) {
      banner.style.borderColor = '#facc15';
      titleEl.style.color = '#fde047';
      titleEl.innerText = `⚡ NEXUS SIEGE ACTIVE: SHATTERED SHARD (${siegeState.shardHp} / ${siegeState.shardMaxHp} HP)!`;
      subEl.innerText = `All 4 Factions clash at Warzone Center • Defend your 25-HP ${localProfile.faction} Outpost Nexus!`;
      audio.setBgmTheme('boss');
    } else {
      const mins = Math.floor((siegeState.nextInSec || 0) / 60);
      const secs = String((siegeState.nextInSec || 0) % 60).padStart(2, '0');
      banner.style.borderColor = '#38bdf8';
      titleEl.style.color = '#38bdf8';
      titleEl.innerText = `⏳ NEXT SHATTERED NEXUS SHARD SIEGE IN ${mins}:${secs}`;
      const lastTxt = siegeState.lastWinnerFaction
        ? `Last Claimed: ${siegeState.lastWinnerFaction} (${siegeState.lastClaimedBy})`
        : 'Defend your 25-HP Outpost Nexus';
      subEl.innerText = `${lastTxt} • Type /siege in chat to rally an instant clash!`;
      audio.setBgmTheme('warzone');
    }
  }

  // ==========================================
  // Death Screen (live countdown + guaranteed dismissal)
  // ==========================================
  let deathScreenVisible = false;
  let deathCountdownTimer = null;
  let deathHideTimer = null;

  function showDeathScreen(seconds = 3) {
    const ds = document.getElementById('death-screen');
    if (!ds) return;
    clearTimeout(deathHideTimer);
    clearInterval(deathCountdownTimer);
    deathScreenVisible = true;
    ds.style.display = 'flex';
    ds.style.opacity = '1';
    const txt = document.getElementById('death-timer-txt');
    const endAt = performance.now() + seconds * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAt - performance.now()) / 1000));
      if (txt) {
        txt.innerText = remaining > 0
          ? `RE-ANCHORING AT SANCTUARY IN ${remaining}S...`
          : 'RE-ANCHORING...';
      }
    };
    tick();
    deathCountdownTimer = setInterval(tick, 200);
    // Safety net: never leave the black screen up if the server respawn packet is lost
    clearTimeout(deathHideTimer);
    deathHideTimer = setTimeout(() => {
      if (deathScreenVisible && !player.isDead) hideDeathScreen();
    }, seconds * 1000 + 4000);
  }

  function hideDeathScreen() {
    clearInterval(deathCountdownTimer);
    deathCountdownTimer = null;
    clearTimeout(deathHideTimer);
    deathScreenVisible = false;
    const ds = document.getElementById('death-screen');
    if (!ds) return;
    ds.style.opacity = '0';
    deathHideTimer = setTimeout(() => {
      if (!deathScreenVisible) ds.style.display = 'none';
    }, 250);
  }

  function applyServerSnapshot(snap) {
    if (!snap) return;

    const seenRemoteIds = new Set();
    for (const sp of snap.players || []) {
      if (sp.id === net.playerId) {
        player.hp = sp.hp;
        player.maxHp = sp.maxHp;
        player.shield = sp.shield;
        player.solarCharge = sp.solarCharge;
        player.maxSolarCharge = sp.maxSolarCharge;
        player.team = sp.team;
        player.stealthed = Boolean(sp.stealthed);
        player.zenith = Boolean(sp.zenith);
        player.thornbark = Boolean(sp.thornbark);
        player.frozen = Boolean(sp.frozen);
        player.bubble = sp.bubble;
        player.emote = sp.emote;

        if (sp.isDead && !player.isDead) {
          player.isDead = true;
          triggerEntityDeathEffect(player.x, player.y, true);
          showDeathScreen(3);
        } else if (!sp.isDead && (player.isDead || deathScreenVisible)) {
          player.isDead = false;
          hideDeathScreen();
        }
        const errDist = Math.hypot(sp.x - player.x, sp.y - player.y);
        if (errDist > 180 && !isTransitioningZone) {
          // Hard teleport / respawn
          player.x = sp.x;
          player.y = sp.y;
          camera.x = player.x;
          camera.y = player.y;
        } else if (!player.isMoving && errDist > 4) {
          // Smooth settling when standing still (no jitter while walking)
          player.x += (sp.x - player.x) * 0.35;
          player.y += (sp.y - player.y) * 0.35;
        } else if (player.isMoving && errDist > 85) {
          // Gentle drift correction while moving without hitching
          player.x += (sp.x - player.x) * 0.15;
          player.y += (sp.y - player.y) * 0.15;
        }
        updatePlayerUI();
      } else {
        seenRemoteIds.add(sp.id);
        const existing = remotePlayers.get(sp.id);
        if (!existing) {
          remotePlayers.set(sp.id, {
            ...sp,
            renderX: sp.x,
            renderY: sp.y,
            walkTimer: 0,
          });
        } else {
          Object.assign(existing, sp);
        }
      }
    }
    for (const rid of Array.from(remotePlayers.keys())) {
      if (!seenRemoteIds.has(rid)) remotePlayers.delete(rid);
    }

    const prevById = new Map(entities.map((e) => [e.id, e]));
    entities = (snap.entities || []).map((se) => {
      const prev = prevById.get(se.id);
      if (prev) {
        if (Math.hypot(se.x - prev.x, se.y - prev.y) > 60) {
          prev.x = se.x;
          prev.y = se.y;
        } else {
          prev.x = prev.x + (se.x - prev.x) * 0.45;
          prev.y = prev.y + (se.y - prev.y) * 0.45;
        }
        if (Math.abs(se.x - prev.x) > 0.5) {
          prev.facingDir = se.x < prev.x ? -1 : 1;
        }
        prev.hp = se.hp;
        prev.maxHp = se.maxHp;
        prev.charges = se.charges;
        prev.maxCharges = se.maxCharges;
        prev.frozen = se.frozen;
        prev.inCombat = Boolean(se.inCombat);
        if (se.isDying && !prev.isDying && (se.type === 'mob' || se.type === 'nexus')) {
          triggerEntityDeathEffect(se.x, se.y, se.isBoss);
          const distToPlayer = Math.hypot(se.x - player.x, se.y - player.y);
          if (distToPlayer < 400 || (currentTarget && currentTarget.id === se.id)) {
            onPlayerKilledMob(currentRoomType, se.name, se.isBoss);
          }
        }
        prev.isDying = Boolean(se.isDying);
        prev.deathAge = se.isDying ? Math.max(prev.deathAge || 0, se.deathAge || 0) : 0;
        return prev;
      }
      return { ...se, hitFlash: 0 };
    });

    if (currentTarget && !currentTarget.isRemotePlayer) {
      const updatedTgt = entities.find((e) => e.id === currentTarget.id && !e.isDying);
      if (updatedTgt) {
        currentTarget = updatedTgt;
        updateTargetUI();
      } else {
        setTarget(null);
      }
    } else if (currentTarget && currentTarget.isRemotePlayer) {
      const rp = remotePlayers.get(currentTarget.playerId);
      if (rp && !rp.isDead && !rp.stealthed) {
        currentTarget.x = rp.renderX;
        currentTarget.y = rp.renderY;
        currentTarget.hp = rp.hp;
        currentTarget.maxHp = rp.maxHp;
        updateTargetUI();
      } else {
        setTarget(null);
      }
    }

    if (currentRoomType === ROOM_TYPES.ARENA_3V3) {
      const blueN = entities.find((e) => e.id === 'blue_nexus');
      const redN = entities.find((e) => e.id === 'red_nexus');
      if (blueN) document.getElementById('blue-nexus-hp').innerText = `${blueN.hp} / 25`;
      if (redN) document.getElementById('red-nexus-hp').innerText = `${redN.hp} / 25`;
    }

    if (snap.siegeState) {
      updateSiegeBanner(snap.siegeState);
    }

    allies = snap.allies || [];
    projectiles = snap.projectiles || [];
    groundZones = snap.groundZones || [];
    worldBanners = snap.banners || [];
    lootDrops = snap.loot || [];

    for (const fx of snap.fx || []) {
      if (fx.kind === 'slash') {
        slashArcs.push({ x: fx.x, y: fx.y, angle: fx.angle, color: fx.color || '#facc15', age: 0, maxAge: 0.22 });
        if (fx.actorId !== net.playerId) audio.playSlash();
      } else if (fx.kind === 'skyBeam') {
        audio.playSpell();
        skyBeams.push({ x: fx.x, y: fx.y, color: fx.color || '#facc15', age: 0, maxAge: 0.45 });
      } else if (fx.kind === 'cast_start') {
        if (fx.actorId === net.playerId) {
          isCasting = true;
          castDuration = fx.duration || 0.95;
          castProgress = 0;
          document.getElementById('cast-bar-container').style.display = 'block';
          document.getElementById('cast-name').innerText = `RITE: ${(fx.spellName || 'SOLAR FLARE').toUpperCase()}`;
          document.getElementById('cast-time').innerText = `${castDuration.toFixed(1)}s`;
        }
      } else if (fx.kind === 'dash') {
        if (fx.actorId === net.playerId) {
          player.x = fx.toX;
          player.y = fx.toY;
        }
        for (let s = 0; s < 4; s++) {
          afterimages.push({
            x: fx.fromX + (fx.toX - fx.fromX) * (s / 4),
            y: fx.fromY + (fx.toY - fx.fromY) * (s / 4),
            dir: fx.dir || 'up',
            age: 0,
            maxAge: 0.28 + s * 0.04,
          });
        }
      } else if (fx.kind === 'hit') {
        audio.playHit(fx.isCrit);
        const hitEnt = entities.find((e) => Math.hypot(e.x - fx.x, e.y - fx.y) < 22);
        if (hitEnt) hitEnt.hitFlash = 0.14;
        spawnSparkBurst(fx.x, fx.y - 8, fx.isCrit ? ['#fde047', '#ffffff', '#f97316'] : ['#ef4444', '#fca5a5', '#facc15'], fx.isCrit ? 12 : 7);
        spawnFCT(fx.x, fx.y, `-${fx.dmg}`, fx.isCrit ? '#facc15' : '#f87171', fx.isCrit);
        if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !questState.dummyDamaged) {
          questState.dummyDamaged = true;
          saveQuestState();
          updateQuestTrackerHUD();
        }
      } else if (fx.kind === 'player_hit') {
        audio.playHit(fx.isCrit);
        spawnFCT(fx.x, fx.y, `-${fx.dmg} HP`, '#ef4444', fx.isCrit);
        if (fx.playerId === net.playerId) {
          const vig = document.getElementById('damage-vignette');
          if (vig) {
            vig.style.display = 'block';
            vig.style.opacity = '0.6';
            setTimeout(() => {
              vig.style.opacity = '0';
              setTimeout(() => (vig.style.display = 'none'), 160);
            }, 140);
          }
          logMessage(`[Combat] ${fx.attackerName} struck you for ${fx.dmg}!`, 'log-combat', 'combat');
        }
      } else if (fx.kind === 'smoke') {
        if (fx.isDeath) {
          triggerEntityDeathEffect(fx.x, fx.y, Boolean(fx.isBoss || (fx.count && fx.count > 35)));
        } else {
          spawnSmokeBurst(fx.x, fx.y, fx.count || 24, Boolean(fx.isBoss || (fx.count && fx.count > 35)));
        }
      } else if (fx.kind === 'spark') {
        spawnSparkBurst(fx.x, fx.y, fx.colors || ['#facc15', '#ffffff'], 14);
      } else if (fx.kind === 'fct') {
        spawnFCT(fx.x, fx.y, fx.text, fx.color || '#facc15', Boolean(fx.isCrit));
        if (typeof fx.text === 'string' && fx.text.includes('SHARD')) audio.playPickup();
      } else if (fx.kind === 'sfx') {
        if (fx.sfx === 'hammer') audio.playHammer();
        else if (fx.sfx === 'freeze') audio.playFreeze();
        else if (fx.sfx === 'stealth') audio.playStealth();
        else if (fx.sfx === 'drain') audio.playDrain();
        else if (fx.sfx === 'zenith') audio.playZenith();
      }
    }

    updateNetStatusPill();
  }

  const net = new MultiplayerClient({
    onStatusChange(connected, reason) {
      updateNetStatusPill();
      if (connected) {
        logMessage('[Realm] Connected to GlimmerFall Online Realm!', 'log-gain', 'chat');
      } else {
        remotePlayers.clear();
        if (!isSinglePlayer) {
          if (reason === 'superseded') {
            logMessage('[Account] Session active in another window/tab. This window is now running offline.', 'log-solari', 'chat');
          } else {
            logMessage('[Realm] Connection lost — reconnecting...', 'log-combat', 'chat');
          }
        }
      }
    },
    onPacket(msg) {
      switch (msg.type) {
        case 'welcome':
          applyProfile(msg.profile);
          frontpage.syncFromProfile(msg.profile);
          publicRoomsList = msg.rooms || [];
          break;

        case 'profile_updated':
          applyProfile(msg.profile);
          frontpage.syncFromProfile(msg.profile);
          break;

        case 'room_joined': {
          isTransitioningZone = false;
          const roomChanged = currentRoomId !== msg.roomId || currentRoomType !== msg.roomType;
          currentRoomId = msg.roomId;
          currentRoomType = msg.roomType;
          currentRoomMax = msg.maxPlayers || 60;
          currentEpoch = msg.epoch || (currentEpoch + 1);
          if (msg.halfW && msg.halfH) {
            mapBounds.halfW = msg.halfW;
            mapBounds.halfH = msg.halfH;
          }
          net.preferredRoom = msg.roomType;
          remotePlayers.clear();

          // Smooth Client Prediction Preservation:
          // If player already walked forward into the new zone, avoid rubberbanding back to the gate line
          const distFromSpawn = Math.hypot(player.x - msg.x, player.y - msg.y);
          if (distFromSpawn > 100 || roomChanged) {
            if (distFromSpawn > 140) {
              player.x = msg.x;
              player.y = msg.y;
            }
          }
          player.z = 0;
          player.vz = 0;
          player.isJumping = false;
          if (msg.team) player.team = msg.team;
          portalCooldown = Math.max(portalCooldown, 0.8);
          if (player.isDead) player.isDead = false;
          hideDeathScreen();
          if (msg.roomType === ROOM_TYPES.ARENA_3V3) {
            const am = document.getElementById('arena-modal');
            if (am) am.style.display = 'none';
            window.dismissArenaInvite?.();
          }
          if (Math.hypot(camera.x - player.x, camera.y - player.y) > 160) {
            camera.x = player.x;
            camera.y = player.y;
          }
          lastSentMove = {
            x: player.x,
            y: player.y,
            z: 0,
            dir: player.dir,
            isMoving: Boolean(inputs.up || inputs.down || inputs.left || inputs.right),
            time: performance.now(),
          };
          if (roomChanged) {
            setupZoneDecor(msg.roomType, msg.roomTitle);
          }
          if (msg.roomType !== ROOM_TYPES.SANCTUARY_HUB && !questState.portalTraveled) {
            questState.portalTraveled = true;
            saveQuestState();
            updateQuestTrackerHUD();
          }
          applyServerSnapshot(msg.snapshot);
          updateNetStatusPill();
          break;
        }

        case 'world_state':
          if (currentRoomId && msg.roomId === currentRoomId && !isTransitioningZone) {
            onlineTotal = msg.onlineTotal || 1;
            applyServerSnapshot(msg);
          }
          break;

        case 'progression_sync':
          prog = {
            ...prog,
            ...msg.progression,
            stats: { ...prog.stats, ...(msg.progression.stats || {}) },
            ranks: { ...prog.ranks, ...(msg.progression.ranks || {}) },
            paragon: { ...(prog.paragon || {}), ...(msg.progression.paragon || {}) },
          };
          player.hp = msg.hp ?? player.hp;
          player.maxHp = msg.maxHp ?? calcMaxHp(prog, localProfile.equipment, localProfile.classId);
          player.maxSolarCharge = msg.maxSolarCharge ?? calcMaxGlimmer(prog, localProfile.equipment, localProfile.classId);
          saveProgressionLocal();
          if (msg.leveled) {
            audio.playLevelUp();
            logMessage(`[LEVEL UP!] Reached Level ${prog.level}! +3 Stat Pts & +1 Spell Pt!`, 'log-solari', 'combat');
          } else if (msg.xpGained && msg.reason) {
            logMessage(`[XP] +${msg.xpGained} XP (${msg.reason})`, 'log-gain', 'combat');
          }
          updatePlayerUI();
          updateActionBarBadges();
          renderStatsModal();
          renderKeybindUI();
          if (typeof renderSkillTreeUI === 'function') renderSkillTreeUI();
          if (msg.xpGained && msg.reason && !msg.reason.includes('Siege') && !msg.reason.includes('Arena') && !msg.reason.includes('Entered') && !msg.reason.includes('Stasis') && !msg.reason.includes('Node')) {
            onPlayerKilledMob(currentRoomType, msg.reason, false);
          }
          break;

        case 'mob_killed': {
          onPlayerKilledMob(msg.roomType, msg.mobName, msg.isBoss);
          const deadEnt = entities.find((e) => e.name === msg.mobName);
          if (deadEnt) {
            triggerEntityDeathEffect(deadEnt.x, deadEnt.y, msg.isBoss);
          }
          break;
        }

        case 'cast_cancel':
          isCasting = false;
          castProgress = 0;
          document.getElementById('cast-bar-container').style.display = 'none';
          currentSpell = null;
          break;

        case 'player_respawned':
          player.x = msg.x;
          player.y = msg.y;
          player.hp = msg.hp;
          player.isDead = false;
          hideDeathScreen();
          audio.playChime();
          updatePlayerUI();
          break;

        case 'queue_state': {
          isQueueing = Boolean(msg.queueing);
          const btn = document.getElementById('btn-queue');
          if (btn) btn.innerText = isQueueing ? '⏳ IN LOBBY...' : '⚔️ 3v3 ARENA';
          if (document.getElementById('arena-modal')?.style.display === 'block') renderArenaModal();
          break;
        }

        case 'arena_lobby':
          applyArenaLobby(msg);
          break;

        case 'arena_invite': {
          if (isQueueing || currentRoomType === ROOM_TYPES.ARENA_3V3) break;
          const toast = document.getElementById('arena-invite-toast');
          const txt = document.getElementById('arena-invite-txt');
          if (toast && txt) {
            const fm = FACTIONS_META[msg.fromFaction] || FACTIONS_META.Solari;
            txt.innerText = `${fm.icon} ${msg.fromName} is queueing for 3v3 Arena — ${msg.total}/${msg.capacity} champions ready!`;
            toast.style.display = 'block';
            audio.playPartyInvite();
            clearTimeout(arenaInviteTimer);
            arenaInviteTimer = setTimeout(() => (toast.style.display = 'none'), 18000);
          }
          break;
        }

        case 'arena_result':
          audio.playLevelUp();
          logMessage(
            msg.won
              ? '[3v3 VICTORY!] Enemy Nexus shattered! +1 Ranked Arena Win!'
              : '[3v3 DEFEAT] Your Sanctuary Nexus fell — regroup in the Warzone!',
            msg.won ? 'log-solari' : 'log-combat',
            'combat'
          );
          break;

        case 'chat_msg': {
          audio.playChatPop();
          const fm = FACTIONS_META[msg.faction] || FACTIONS_META.Solari;
          const tag = msg.orderTag && msg.orderTag !== 'NONE' ? `<${msg.orderTag}> ` : '';
          if (msg.channel === 'faction') {
            logMessage(`[${fm.icon} ${msg.faction.toUpperCase()}] ${tag}${msg.senderName}: ${msg.text}`, 'log-chat-faction', 'faction');
          } else if (msg.channel === 'party') {
            logMessage(`[🛡️ SQUAD] ${msg.senderName}: ${msg.text}`, 'log-chat-party', 'party');
          } else if (msg.channel === 'order') {
            logMessage(`[⚑ <${msg.orderTag}>] ${msg.senderName}: ${msg.text}`, 'log-chat-order', 'chat');
          } else {
            logMessage(`[SAY] ${tag}${msg.senderName}: ${msg.text}`, 'log-chat-say', 'chat');
          }
          break;
        }

        case 'emote_fx':
          audio.playEmote();
          logMessage(`${msg.icon} ${msg.playerName} ${msg.emoteText}`, 'log-solari', 'chat');
          break;

        case 'party_invite': {
          audio.playPartyInvite();
          pendingPartyInvite = msg;
          const toast = document.getElementById('party-invite-toast');
          const txt = document.getElementById('party-invite-txt');
          if (toast && txt) {
            txt.innerText = `${msg.inviterName} (Lv.${msg.inviterLevel} ${msg.inviterFaction}) invited you to a 3-player squad!`;
            toast.style.display = 'block';
          }
          break;
        }

        case 'party_state':
          currentParty = msg.party;
          renderPartyHud(currentParty, net.playerId || localProfile.id);
          break;

        case 'rooms_list':
          publicRoomsList = msg.rooms || [];
          if (document.getElementById('social-modal')?.style.display === 'block') {
            refreshSocialModalView();
          }
          break;

        case 'sys_msg':
          logMessage(msg.text, 'log-gain', msg.category || 'chat');
          break;
      }
    },
  });
  net.onPing = () => updateNetStatusPill();

  // ==========================================
  // Game Frontpage Controller (Character Select, Faction, Class & Loadout)
  // ==========================================
  const frontpage = new FrontpageController({
    net,
    audio,
    onEnterWorld({ profile, startingRealm, playMode }) {
      isSinglePlayer = playMode === 'singleplayer';
      if (profile) applyProfile(profile);
      audio.setBgmTheme(ROOM_CONFIGS[startingRealm]?.bgm || 'sanctuary');

      if (isSinglePlayer) {
        net.disconnect();
        portalCooldown = 2.0;
        triggerPortalMist(0.5);
        inputs.up = inputs.down = inputs.left = inputs.right = false;
        player.isMoving = false;
        moveSyncAccum = 0;
        buildOfflineZone(startingRealm);
        updateNetStatusPill();
        logMessage('[Realm] Entered Single Player Realm (Offline • 0ms). Instant local response!', 'log-solari', 'chat');
      } else {
        if (net.connected && startingRealm && !currentRoomId.startsWith(startingRealm)) {
          portalCooldown = 2.0;
          triggerPortalMist(0.5);
          inputs.up = inputs.down = inputs.left = inputs.right = false;
          player.isMoving = false;
          moveSyncAccum = 0;
          net.send({ type: 'switch_room', roomType: startingRealm, epoch: currentEpoch });
        } else if (!net.connected) {
          net.bootstrapAndConnect(prog);
        }
        updateNetStatusPill();
      }

      if (!introShown && !questState.introShown && !questState.talkedNpcs?.npc_aurora && currentRoomType === ROOM_TYPES.SANCTUARY_HUB) {
        introShown = true;
        questState.introShown = true;
        saveQuestState();
        openDialogue(AWAKENING_DIALOGUE, 'heraldNpc', 'npc_aurora');
      }
    },
  });
  window._fp = frontpage;
  window.openFrontpage = function () {
    document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    frontpage.open();
  };

  // ==========================================
  // Targeting & UI Updates
  // ==========================================
  function isHostileEntity(ent) {
    if (!ent || ent.isDying || ent.type === 'ally_nexus') return false;
    if (ent.type === 'outpost_nexus' && ent.faction === localProfile.faction) return false;
    return true;
  }

  function getTargetableEntities() {
    const list = entities.filter((e) => !e.isDying && e.type !== 'ally_nexus');
    for (const rp of remotePlayers.values()) {
      if (!rp.isDead && !rp.stealthed && isRemoteHostile(rp)) {
        list.push({
          id: `p_${rp.id}`,
          playerId: rp.id,
          isRemotePlayer: true,
          name: rp.name,
          sub: `Lv.${rp.level} ${rp.faction} Champion`,
          x: rp.renderX,
          y: rp.renderY,
          hp: rp.hp,
          maxHp: rp.maxHp,
          radius: 14,
        });
      }
    }
    return list;
  }

  function setTarget(ent) {
    currentTarget = ent;
    const frame = document.getElementById('target-unit-frame');
    const actRow = document.getElementById('target-player-actions');
    if (!ent) {
      frame.style.display = 'none';
      if (actRow) actRow.style.display = 'none';
      return;
    }
    frame.style.display = 'block';
    document.getElementById('target-name').innerText = ent.name;
    document.getElementById('target-sub').innerText = ent.sub || 'World Entity';
    if (actRow) {
      actRow.style.display = ent.isRemotePlayer ? 'block' : 'none';
    }
    updateTargetUI();
  }

  function cycleTarget() {
    const list = getTargetableEntities().filter((e) => e.type !== 'portal' && e.type !== 'node');
    if (list.length === 0) return;
    list.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    if (!currentTarget) setTarget(list[0]);
    else {
      const idx = list.findIndex((item) => item.id === currentTarget.id);
      setTarget(list[(idx + 1) % list.length]);
    }
  }

  function updateTargetUI() {
    if (!currentTarget) return;
    const hp = currentTarget.hp ?? currentTarget.charges ?? 0;
    const max = currentTarget.maxHp ?? currentTarget.maxCharges ?? 1;
    const pct = Math.max(0, Math.round((hp / max) * 100));
    document.getElementById('target-hp-txt').innerText = `${hp} / ${max} (${pct}%)`;
    document.getElementById('target-hp-fill').style.width = `${pct}%`;
  }

  function updatePlayerUI() {
    const fm = FACTIONS_META[localProfile.faction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[localProfile.classId] || CLASSES_CATALOG.solari_vanguard;
    const nameEl = document.getElementById('player-name-label');
    if (nameEl) {
      nameEl.innerText = localProfile.displayName.toUpperCase();
      nameEl.style.color = fm.color;
    }
    const subEl = document.getElementById('player-sub-label');
    if (subEl) {
      const orderStr = localProfile.orderTag && localProfile.orderTag !== 'NONE' ? `<${localProfile.orderTag}> ` : '';
      const tcgBadge = localProfile.tcgLinked ? ' • ⚡TCG' : '';
      subEl.innerText = `${fm.icon} ${cls.name} • ${orderStr}${tcgBadge}`;
    }
    const qFac = document.getElementById('quest-faction-pill');
    if (qFac) {
      qFac.innerText = localProfile.faction.toUpperCase();
      qFac.style.color = fm.color;
    }

    document.getElementById('player-level-badge').innerText = prog.level;
    const hpTxt = player.shield > 0
      ? `${player.hp}/${player.maxHp} (+${player.shield}🛡)`
      : `${player.hp} / ${player.maxHp}`;
    document.getElementById('player-hp-txt').innerText = hpTxt;
    document.getElementById('player-hp-fill').style.width = `${Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100)}%`;
    document.getElementById('player-hp-fill').className = player.shield > 0 ? 'bar-hp shielded' : 'bar-hp';

    document.getElementById('player-res-txt').innerText = `${player.solarCharge} / ${player.maxSolarCharge}`;
    document.getElementById('player-res-fill').style.width = `${Math.min(100, (player.solarCharge / Math.max(1, player.maxSolarCharge)) * 100)}%`;

    const needXp = xpForNextLevel(prog.level);
    document.getElementById('xp-bar-txt').innerText = `LV.${prog.level} ${cls.name.toUpperCase()}  •  XP ${prog.xp} / ${needXp}`;
    document.getElementById('xp-bar-fill').style.width = `${Math.min(100, (prog.xp / needXp) * 100)}%`;

    const spBadge = document.getElementById('skill-pt-pip');
    if (spBadge) {
      spBadge.style.display = prog.skillPoints > 0 ? 'inline-block' : 'none';
      spBadge.innerText = `+${prog.skillPoints}`;
    }
    const stBadge = document.getElementById('stat-pt-pip');
    if (stBadge) {
      stBadge.style.display = prog.statPoints > 0 ? 'inline-block' : 'none';
      stBadge.innerText = `+${prog.statPoints}`;
    }
  }

  // ==========================================
  // Casting All 35 TCG Rites & Flashes
  // ==========================================
  function getFacingVector() {
    if (player.dir === 'up') return { dx: 0, dy: -1, angle: -Math.PI / 2 };
    if (player.dir === 'down') return { dx: 0, dy: 1, angle: Math.PI / 2 };
    if (player.dir === 'left') return { dx: -1, dy: 0, angle: Math.PI };
    return { dx: 1, dy: 0, angle: 0 };
  }

  function faceToward(tx, ty) {
    const dx = tx - player.x;
    const dy = ty - player.y;
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx >= 0 ? 'right' : 'left';
    else player.dir = dy >= 0 ? 'down' : 'up';
  }

  function autoAcquireNearestHostile(maxDist) {
    if (currentTarget && !currentTarget.isDying && currentTarget.type !== 'node' && currentTarget.type !== 'portal') {
      if (currentTarget.isRemotePlayer) {
        if (isRemoteHostile(remotePlayers.get(currentTarget.playerId) || {})) return currentTarget;
      } else if (isHostileEntity(currentTarget)) {
        return currentTarget;
      }
    }
    let best = null;
    let bestD = maxDist;
    for (const e of getTargetableEntities()) {
      if (e.type === 'node' || e.type === 'portal') continue;
      if (!e.isRemotePlayer && !isHostileEntity(e)) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d <= bestD) {
        bestD = d;
        best = e;
      }
    }
    if (best) setTarget(best);
    return best;
  }

  let offlineEchoPrimed = false;

  // ==========================================
  // Loot Shards (Vital / Glimmer / Relic) — offline simulation mirror of server loot
  // ==========================================
  let lootSeq = 0;
  function spawnOfflineLoot(ent) {
    const count = ent.isBoss ? 4 : Math.random() < 0.55 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      let kind = Math.random() < 0.5 ? 'vital' : 'glimmer';
      if (ent.isBoss && i === 0) kind = 'relic';
      const ang = (Math.PI * 2 * i) / Math.max(1, count) + Math.random() * 0.8;
      const dist = count > 1 ? 14 + Math.random() * 8 : 0;
      lootSeq++;
      lootDrops.push({
        id: `loot_off_${lootSeq}`,
        kind,
        x: ent.x + Math.cos(ang) * dist,
        y: ent.y + Math.sin(ang) * dist * 0.6,
        ttl: 28,
        age: 0,
      });
    }
  }

  function updateOfflineLoot(dt) {
    for (let i = lootDrops.length - 1; i >= 0; i--) {
      const l = lootDrops[i];
      l.ttl -= dt;
      l.age = (l.age || 0) + dt;
      if (l.ttl <= 0) {
        lootDrops.splice(i, 1);
        continue;
      }
      if (player.isDead || l.age < 0.6) continue;
      if (Math.hypot(player.x - l.x, player.y - l.y) > 18) continue;
      lootDrops.splice(i, 1);
      audio.playPickup();
      if (l.kind === 'vital') {
        const heal = Math.max(3, Math.round(player.maxHp * 0.25));
        player.hp = Math.min(player.maxHp, player.hp + heal);
        spawnFCT(player.x, player.y - 14, `+${heal} VITAL SHARD`, '#f87171');
        spawnSparkBurst(l.x, l.y, ['#f87171', '#fecaca', '#ffffff'], 8);
      } else if (l.kind === 'glimmer') {
        player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 30);
        spawnFCT(player.x, player.y - 14, '+30 GLIMMER SHARD', '#38bdf8');
        spawnSparkBurst(l.x, l.y, ['#38bdf8', '#bae6fd', '#ffffff'], 8);
      } else {
        awardXP(60, 'Relic Shard');
        spawnFCT(player.x, player.y - 14, '✦ RELIC SHARD +60 XP', '#fde047', true);
        spawnSparkBurst(l.x, l.y, ['#fde047', '#fef08a', '#ffffff'], 12);
      }
      updatePlayerUI();
    }
  }

  const LOOT_STYLE = {
    vital: { core: '#ef4444', light: '#fecaca', dark: '#7f1d1d' },
    glimmer: { core: '#38bdf8', light: '#e0f2fe', dark: '#0c4a6e' },
    relic: { core: '#facc15', light: '#fffbeb', dark: '#854d0e' },
  };

  function drawLootShard(l, sx, sy) {
    const st = LOOT_STYLE[l.kind] || LOOT_STYLE.glimmer;
    const age = l.age ?? (28 - l.ttl);
    // pop-out arc on spawn
    const pop = age < 0.6 ? Math.sin((age / 0.6) * Math.PI) * 9 : 0;
    const bob = Math.round(Math.sin(globalTime * 4 + (l.x + l.y) * 0.05) * 1.5);
    const blink = l.ttl < 6 && Math.floor(globalTime * 8) % 2 === 0;
    if (blink) return;
    const cy = sy - 6 - Math.round(pop) + bob;
    drawPixelEllipseShadow(sx, sy, 4, 2);
    // 7px pixel diamond
    ctx.fillStyle = '#05070f';
    ctx.fillRect(sx - 1, cy - 5, 3, 1);
    ctx.fillRect(sx - 3, cy - 4, 7, 1);
    ctx.fillRect(sx - 4, cy - 3, 9, 6);
    ctx.fillRect(sx - 3, cy + 3, 7, 1);
    ctx.fillRect(sx - 1, cy + 4, 3, 1);
    ctx.fillStyle = st.dark;
    ctx.fillRect(sx - 3, cy - 3, 7, 5);
    ctx.fillStyle = st.core;
    ctx.fillRect(sx - 2, cy - 3, 5, 5);
    ctx.fillRect(sx - 1, cy - 4, 3, 1);
    ctx.fillRect(sx - 1, cy + 2, 3, 1);
    ctx.fillStyle = st.light;
    ctx.fillRect(sx - 2, cy - 3, 2, 2);
    // twinkle
    if (Math.floor(globalTime * 3 + l.x) % 3 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 3, cy - 5, 1, 1);
      ctx.fillRect(sx + 2, cy - 4, 3, 1);
      ctx.fillRect(sx + 3, cy - 3, 1, 1);
    }
    if (l.kind === 'relic') {
      ctx.fillStyle = 'rgba(250,204,21,0.35)';
      ctx.fillRect(sx - 6, cy - 1, 13, 1);
    }
  }

  function killOfflineEntity(ent) {
    if (!ent || ent.isDying) return;
    ent.isDying = true;
    ent.deathAge = 0;

    if (currentTarget && currentTarget.id === ent.id) {
      setTarget(null);
    }

    triggerEntityDeathEffect(ent.x, ent.y, ent.isBoss);
    logMessage(`[Void Banish] ${ent.name} was cast into the Void!`, 'log-gain', 'combat');
    awardXP(ent.xpReward || 30, ent.name);
    if (ent.isBoss) {
      logMessage(`🏆 CONTINENTAL VICTORY: ${ent.name} has been vanquished! The Leylines surge with an Ancient Paragon Cache!`, 'log-solari', 'combat');
      if ((prog.level || 1) >= 30) {
        awardXP(450, 'Ancient Paragon Cache');
      }
    }
    if (ent.type === 'mob') {
      spawnOfflineLoot(ent);
      if (currentRoomType === ROOM_TYPES.NEXUS_WARZONE) {
        questState.warzoneKills = (questState.warzoneKills || 0) + 1;
        saveQuestState();
        updateQuestTrackerHUD();
        if (questState.warzoneKills === 3) {
          logMessage('📜 [Quest Objective] Void threats banished! Return to Commander Valerius!', 'log-quest');
          spawnFCT(player.x, player.y - 14, '✨ OBJECTIVE COMPLETE!', '#facc15', true);
        }
      } else if (currentRoomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
        questState.ruinsKills = (questState.ruinsKills || 0) + 1;
        saveQuestState();
        updateQuestTrackerHUD();
        if (questState.ruinsKills === 2) {
          logMessage('📜 [Quest Objective] Ruin horrors banished! Return to Atlas!', 'log-quest');
          spawnFCT(player.x, player.y - 14, '✨ OBJECTIVE COMPLETE!', '#facc15', true);
        }
      }
    }

    const deathRoom = currentRoomType;
    const respawnTemplate = {
      ...ent,
      hp: ent.maxHp,
      isDying: false,
      deathAge: 0,
      frozen: false,
      freezeTimer: 0,
      hitFlash: 0,
      x: ent.origX ?? ent.x,
      y: ent.origY ?? ent.y,
    };

    const delayMs =
      ent.type === 'nexus' || ent.type === 'outpost_nexus' || ent.type === 'siege_shard'
        ? 10000
        : ent.isBoss
        ? 11000
        : 6500;

    setTimeout(() => {
      if (net.connected || currentRoomType !== deathRoom) return;
      if (entities.some((existing) => existing.id === respawnTemplate.id)) return;
      entities.push(respawnTemplate);
      spawnSmokeBurst(respawnTemplate.x, respawnTemplate.y, 16);
    }, delayMs);
  }

  function damageOfflineEntity(ent, dmg, isCrit = false, isRite = false, spellName = '') {
    if (!ent || ent.isDying || ent.type === 'node' || ent.type === 'portal') return;
    ent.hp = Math.max(0, ent.hp - dmg);
    ent.hitFlash = 0.14;
    if (ent.type === 'mob') {
      if (!ent.inCombat) {
        spawnFCT(ent.x, ent.y - 12, 'AGGRO!', '#ef4444');
      }
      ent.inCombat = true;
    }
    audio.playHit(isCrit);
    spawnSparkBurst(
      ent.x,
      ent.y - 8,
      isCrit ? ['#fde047', '#ffffff', '#38bdf8'] : ['#ef4444', '#fca5a5', '#facc15'],
      isCrit ? 12 : 7
    );
    spawnFCT(ent.x, ent.y, `-${dmg}`, isCrit ? '#facc15' : '#f87171', isCrit);

    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !questState.dummyDamaged) {
      questState.dummyDamaged = true;
      saveQuestState();
      updateQuestTrackerHUD();
    }

    if (ent.id === 'celestial_boss' || (ent.name && ent.name.includes('Aurelius'))) {
      if (!questState.titanChallenged) {
        questState.titanChallenged = true;
        saveQuestState();
        updateQuestTrackerHUD();
        spawnFCT(player.x, player.y - 14, '✨ TITAN ENGAGED!', '#fde047', true);
      }
    }

    if (currentTarget && currentTarget.id === ent.id) {
      updateTargetUI();
    }

    if (ent.type === 'dummy' && ent.hp > 0) {
      awardXP(8, '');
    }

    // Solari Paragon: Holy Radiance Burst on critical strike!
    if (isCrit) {
      const burstDmg = calcHolyRadianceBurstDmg(prog);
      if (burstDmg > 0) {
        spawnSparkBurst(ent.x, ent.y - 8, ['#facc15', '#fef08a', '#ffffff'], 14);
        spawnFCT(ent.x, ent.y - 14, `☀️ HOLY BURST +${burstDmg}!`, '#facc15', true);
        for (const near of entities) {
          if (near !== ent && !near.isDying && isHostileEntity(near) && near.type !== 'node' && near.type !== 'portal') {
            if (Math.hypot(near.x - ent.x, near.y - ent.y) <= 48) {
              damageOfflineEntity(near, burstDmg, false, false, 'Holy Radiance');
            }
          }
        }
      }
    }

    // Umbri Paragon: Void Leech on all damage dealt!
    const leechPct = calcLifeLeechPct(prog, localProfile.faction) * (player.voidformTimer > 0 ? 2 : 1);
    if (leechPct > 0 && !player.isDead) {
      const leechHeal = Math.max(1, Math.round(dmg * leechPct));
      player.hp = Math.min(player.maxHp, player.hp + leechHeal);
    }

    if (ent.hp <= 0) {
      killOfflineEntity(ent);
    } else if (isRite && !String(spellName).includes('Echo')) {
      const shouldEcho = offlineEchoPrimed || (localProfile.faction === 'Aether' && Math.random() < 0.35);
      if (shouldEcho) {
        offlineEchoPrimed = false;
        const echoDmg = Math.max(2, Math.round(dmg * 0.45));
        setTimeout(() => {
          if (net.connected || ent.isDying || ent.hp <= 0) return;
          spawnFCT(ent.x, ent.y - 14, `🔮 ECHO +${echoDmg}`, '#38bdf8', true);
          damageOfflineEntity(ent, echoDmg, true, false, `${spellName} (Echo)`);
        }, 220);
      }
    }
  }

  function damageOfflinePlayer(amount, attackerName, attackerRef = null, isCrit = false) {
    if (player.isDead || player.hp <= 0) return;

    // Umbri Paragon: Dodge Chance!
    const dodgeChance = player.abyssalShroudTimer > 0 ? 1.0 : calcDodgeChance(prog);
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      spawnFCT(player.x, player.y - 12, '💨 DODGE!', '#c084fc', true);
      return;
    }

    // Terra Paragon & Buffs: Damage Reduction!
    const dmgRedPct = calcDamageReduction(prog) + (player.rootedBastionTimer > 0 ? 0.40 : 0);
    if (dmgRedPct > 0) {
      amount = Math.max(1, Math.round(amount * (1 - Math.min(0.70, dmgRedPct))));
    }

    // Solari Sun Aegis Rebuke Reactive Counter
    if (player.rebukeTimer > 0 && attackerRef && attackerRef.hp !== undefined) {
      const reb = Math.max(2, Math.round(amount * 0.4));
      damageOfflineEntity(attackerRef, reb, false, false, 'Sun Rebuke');
      attackerRef.weakenTimer = 4.0;
      spawnFCT(attackerRef.x, attackerRef.y - 8, `☀️ -${reb} REBUKE`, '#facc15');
    }

    // Terra Faction Mechanic: Thornbark damage reflection!
    const reflectPct = player.thornbark ? (player.treantFormTimer > 0 ? 0.60 : 0.35) : localProfile.faction === 'Terra' ? 0.15 : 0;
    if (reflectPct > 0 && attackerRef && attackerRef.hp !== undefined) {
      const refl = Math.max(1, Math.round(amount * reflectPct));
      damageOfflineEntity(attackerRef, refl, false, false, 'Thornbark');
      spawnFCT(attackerRef.x, attackerRef.y - 8, `🌿 -${refl} THORNS`, '#4ade80');
    }

    // Cast Interruption on Heavy Hit or Crit
    if (isCasting && (isCrit || amount >= player.maxHp * 0.18)) {
      isCasting = false;
      castProgress = 0;
      document.getElementById('cast-bar-container').style.display = 'none';
      currentSpell = null;
      spawnFCT(player.x, player.y - 12, 'INTERRUPTED!', '#f87171');
      logMessage('🚫 Rite channeling interrupted by damage!', 'log-combat');
    }

    let rem = amount;
    if (player.shield > 0) {
      const absorbed = Math.min(player.shield, rem);
      player.shield -= absorbed;
      rem -= absorbed;
      spawnFCT(player.x, player.y - 12, `GUARD ${absorbed}`, '#38bdf8');
    }

    if (rem > 0) {
      player.hp = Math.max(0, player.hp - rem);
      audio.playHit(false);
      spawnSparkBurst(player.x, player.y - 8, ['#ef4444', '#f87171', '#facc15'], 8);
      spawnFCT(player.x, player.y - 10, `-${rem} HP`, '#ef4444');

      const vig = document.getElementById('damage-vignette');
      if (vig) {
        vig.style.opacity = '0.65';
        setTimeout(() => {
          vig.style.opacity = '0';
        }, 180);
      }

      logMessage(`[Combat] ${attackerName} strikes you for ${rem} damage!`, 'log-combat');

      if (player.hp <= 0) {
        player.isDead = true;
        triggerEntityDeathEffect(player.x, player.y, true);
        logMessage(`[Defeat] Slain by ${attackerName}! Re-anchoring at Sanctuary...`, 'log-danger', 'combat');
        showDeathScreen(3);
        setTimeout(() => {
          player.isDead = false;
          player.hp = player.maxHp;
          player.shield = 0;
          player.solarCharge = 0;
          hideDeathScreen();
          const cfg = ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
          player.x = cfg.spawnX;
          player.y = cfg.spawnY;
          if (currentRoomType !== ROOM_TYPES.SANCTUARY_HUB) {
            buildOfflineZone(ROOM_TYPES.SANCTUARY_HUB);
          }
          updatePlayerUI();
          logMessage(`[Awakening] Re-anchored at Sanctuary!`, 'log-solari', 'quest');
        }, 3000);
      }
    }
    updatePlayerUI();
  }

  window.castAbility = function (slot) {
    if (player.isDead || player.frozen) return;
    if (!isSlotUnlocked(prog, slot)) {
      const reqLvl = SLOT_UNLOCK_LEVELS[slot] || 1;
      logMessage(`🔒 Slot locked! Reach Level ${reqLvl} to unlock this ${slot >= 9 ? 'Flash' : 'Rite'}.`, 'log-combat');
      return;
    }
    const spec = getSlotAbilitySpec(localProfile.loadout, slot);
    if (!spec) return;

    // Diablo 2 Requirement: Abilities with 0 points allocated cannot be cast!
    const abilityRank = getAbilityRank(prog, spec.id);
    if (abilityRank < 1) {
      logMessage(`🔒 ${spec.name} is not learned yet! Open Spellbook [P] to allocate your Skill Point!`, 'log-combat');
      audio.playHurt();
      return;
    }

    if (isCasting) {
      logMessage('⏳ Already channeling a Rite!', 'log-combat');
      return;
    }

    if (cooldowns[slot] > 0) {
      logMessage(`[Cooldown] ${spec.name} ready in ${cooldowns[slot].toFixed(1)}s`, 'log-combat');
      return;
    }

    if (spec.cost > 0 && player.solarCharge < spec.cost) {
      logMessage(`[Glimmer] ${spec.name} requires ${spec.cost} Glimmer!`, 'log-combat');
      return;
    }

    const isRite = spec.tcgType.includes('Rite');
    const isFlash = spec.tcgType.includes('Flash');
    const cdMult = calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction);
    const rangePx = (spec.rangeYards || 8) * YARD_PX;
    const needsTarget = [
      'cast_beam',
      'projectile',
      'drain_beam',
      'execute_beam',
      'drain_bolt',
      'execute_bolt',
      'shadow_step',
    ].includes(spec.kind);

    let acquiredTarget = null;
    if (needsTarget) {
      const tgt = autoAcquireNearestHostile(rangePx);
      if (!tgt) {
        logMessage(`[Target] Select a hostile target within ${spec.range} for ${spec.name}!`, 'log-combat');
        return;
      }
      if (Math.hypot(tgt.x - player.x, tgt.y - player.y) > rangePx + 10) {
        logMessage(`[Range] Target out of range (${spec.range})!`, 'log-combat');
        return;
      }
      faceToward(tgt.x, tgt.y);
      acquiredTarget = tgt;
    } else if (spec.kind === 'melee_cleave') {
      const tgt = autoAcquireNearestHostile(rangePx);
      if (tgt && Math.hypot(tgt.x - player.x, tgt.y - player.y) <= rangePx + 8) {
        faceToward(tgt.x, tgt.y);
        acquiredTarget = tgt;
      }
    }

    cooldowns[slot] = spec.baseCd * cdMult;

    // Rites channel for castTime; Flashes fire instantly!
    if (isRite && (spec.castTime || 0) > 0) {
      const castSpeedMult = calcCastSpeedMult(prog) * (player.temporalApotheosisTimer > 0 ? 0.25 : 1.0);
      const effectiveDuration = Math.max(0.3, spec.castTime * castSpeedMult);
      isCasting = true;
      castDuration = effectiveDuration;
      castProgress = 0;
      document.getElementById('cast-bar-container').style.display = 'block';
      document.getElementById('cast-name').innerText = `RITE: ${spec.name.toUpperCase()}`;
      document.getElementById('cast-time').innerText = `${castDuration.toFixed(1)}s`;
    }

    if (spec.kind === 'melee_cleave') {
      audio.playSlash();
      player.slashTimer = 0.22;
      slashArcs.push({
        x: player.x,
        y: player.y - 6,
        angle: getFacingVector().angle,
        color: spec.color || '#facc15',
        age: 0,
        maxAge: 0.22,
      });
    } else if (spec.kind === 'shield' || spec.kind === 'thornbark' || spec.kind === 'reactive_barrier' || spec.kind === 'iron_fortify' || spec.kind === 'treant_form') {
      audio.playShield();
    } else if (spec.kind === 'heal' || spec.kind === 'heal_glimmer' || spec.kind === 'timeloop') {
      audio.playChime();
    } else if (spec.kind === 'stealth' || spec.kind === 'stealth_burst' || spec.kind === 'voidform') {
      audio.playStealth();
    } else if (spec.kind === 'frost_nova' || spec.kind === 'stasis_bubble') {
      audio.playFreeze();
    } else if (spec.kind === 'dash' || spec.kind === 'shadow_step' || spec.kind === 'dash_cleave' || spec.kind === 'rift_teleport') {
      audio.playDash();
    } else if (spec.kind === 'nova' || spec.kind === 'cleanse_sprint' || spec.kind === 'archon_form' || spec.kind === 'colossus_stomp' || spec.kind === 'apotheosis' || spec.kind === 'continental_quake' || spec.kind === 'singularity_collapse' || spec.kind === 'supernova') {
      audio.playZenith();
    }

    if (net.connected) {
      net.send({
        type: 'move',
        x: player.x,
        y: player.y,
        z: player.z,
        dir: player.dir,
        isMoving: player.isMoving,
      });
      net.send({
        type: 'cast_ability',
        slot,
        targetId: currentTarget ? currentTarget.id : null,
        dir: player.dir,
      });
      return;
    }

    // Offline single-player simulation (full support for all 4 Factions & Rites/Flashes)
    const rank = prog.ranks[slot] || 1;
    const eff = getEffectiveStats(prog, localProfile.equipment, localProfile.classId);
    const critChance = calcCritChance(prog, localProfile.equipment, localProfile.classId);

    if (spec.cost > 0) {
      player.solarCharge = Math.max(0, player.solarCharge - spec.cost);
    }
    if (isFlash) {
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 8);
    }

    if (spec.kind === 'cast_beam' && acquiredTarget) {
      isCasting = true;
      castDuration = spec.castTime || 0.95;
      castProgress = 0;
      document.getElementById('cast-bar-container').style.display = 'block';
      document.getElementById('cast-name').innerText = `RITE: ${spec.name.toUpperCase()}`;
      document.getElementById('cast-time').innerText = `${castDuration.toFixed(1)}s`;
      const beamTargetId = acquiredTarget.id;
      currentSpell = {
        onComplete() {
          const tgt = entities.find((e) => e.id === beamTargetId && !e.isDying);
          if (!tgt) return;
          audio.playSpell();
          skyBeams.push({ x: tgt.x, y: tgt.y, color: spec.color || '#38bdf8', age: 0, maxAge: 0.45 });
          const dmg = Math.max(5, Math.floor(Math.random() * 5) + 10 + eff.power * 2 + rank * 3);
          damageOfflineEntity(tgt, dmg, true, true, spec.name);
          for (const near of entities) {
            if (near !== tgt && !near.isDying && isHostileEntity(near) && near.type !== 'node' && near.type !== 'portal') {
              if (Math.hypot(near.x - tgt.x, near.y - tgt.y) <= 56) {
                damageOfflineEntity(near, Math.round(dmg * 0.55), false, false, spec.name);
              }
            }
          }
          updatePlayerUI();
        },
      };
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'projectile' && acquiredTarget) {
      audio.playHammer();
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 18 + eff.resonance * 2);
      projectiles.push({
        id: `off_prj_${Date.now()}_${Math.random()}`,
        type: spec.projType || 'orb',
        color: spec.color,
        spellName: spec.name,
        isRite,
        x: player.x,
        y: player.y - 8,
        targetId: acquiredTarget.id,
        speed: spec.projType === 'aether_orb' ? 265 : 225,
        rot: 0,
        dmg: Math.max(3, Math.floor(Math.random() * 4) + 6 + eff.power + rank * 2),
      });
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'ground_zone') {
      const zx = acquiredTarget ? acquiredTarget.x : currentTarget && !currentTarget.isDying ? currentTarget.x : player.x;
      const zy = acquiredTarget ? acquiredTarget.y : currentTarget && !currentTarget.isDying ? currentTarget.y : player.y;
      groundZones.push({
        id: `off_gz_${Date.now()}`,
        type: spec.zoneType || 'consecration',
        color: spec.color,
        spellName: spec.name,
        x: zx,
        y: zy,
        radius: rangePx,
        tickDmg: Math.max(2, 2 + rank + Math.floor(eff.power * 0.5)),
        age: 0,
        maxAge: 6.2,
        tickTimer: 0.2,
      });
      spawnFCT(zx, zy - 6, spec.name.toUpperCase(), spec.color || '#38bdf8');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'nova' || spec.kind === 'frost_nova') {
      groundZones.push({
        id: `off_ring_${Date.now()}`,
        type: spec.kind === 'frost_nova' ? 'frost_ring' : 'shockwave',
        color: spec.color,
        x: player.x,
        y: player.y,
        radius: rangePx,
        age: 0,
        maxAge: 0.45,
      });
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= rangePx) {
            const dmg = Math.max(5, 11 + Math.round(eff.power * 1.7) + rank * 3);
            damageOfflineEntity(e, dmg, true, isRite, spec.name);
            if (!e.isDying && spec.kind === 'frost_nova') {
              e.frozen = true;
              e.freezeTimer = 3.2;
              spawnFCT(e.x, e.y - 10, '❄️ FROZEN!', '#bae6fd');
            }
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'dash' || spec.kind === 'shadow_step') {
      const startX = player.x;
      const startY = player.y;
      let targetX = startX;
      let targetY = startY;

      if (spec.kind === 'shadow_step' && acquiredTarget) {
        const ang = Math.atan2(acquiredTarget.y - player.y, acquiredTarget.x - player.x);
        targetX = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, acquiredTarget.x + Math.cos(ang) * 18));
        targetY = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, acquiredTarget.y + Math.sin(ang) * 18));
        damageOfflineEntity(acquiredTarget, 6 + eff.power + rank * 2, true, false, spec.name);
      } else {
        const { dx, dy } = getFacingVector();
        const dist = ((spec.rangeYards || 8.5) + rank * 0.35) * YARD_PX;
        targetX = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, player.x + dx * dist));
        targetY = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, player.y + dy * dist));
      }

      // If landing in deep water, step back towards starting point until dry ground or bridge
      if (!isWaterTile(startX, startY, currentRoomType) && isWaterTile(targetX, targetY, currentRoomType)) {
        for (let step = 1; step <= 12; step++) {
          const frac = 1 - step * 0.08;
          const testX = startX + (targetX - startX) * frac;
          const testY = startY + (targetY - startY) * frac;
          if (!isWaterTile(testX, testY, currentRoomType)) {
            targetX = testX;
            targetY = testY;
            break;
          }
        }
      }

      player.x = targetX;
      player.y = targetY;

      for (let s = 0; s < 4; s++) {
        afterimages.push({
          x: startX + (player.x - startX) * (s / 4),
          y: startY + (player.y - startY) * (s / 4),
          dir: player.dir,
          age: 0,
          maxAge: 0.28 + s * 0.04,
        });
      }
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 12);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'shield' || spec.kind === 'thornbark') {
      const absorb = 13 + eff.bastion * 3 + rank * 4;
      player.shield = absorb;
      player.thornbark = spec.kind === 'thornbark';
      spawnFCT(player.x, player.y - 8, `+${absorb} SHIELD`, spec.color || '#38bdf8');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'heal' || spec.kind === 'heal_glimmer') {
      const healAmt = 7 + eff.bastion * 2 + rank * 3;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      if (spec.kind === 'heal_glimmer') {
        player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 25);
      }
      spawnFCT(player.x, player.y - 8, `+${healAmt} HP`, '#4ade80');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'stealth') {
      player.stealthed = true;
      setTimeout(() => {
        if (!net.connected) player.stealthed = false;
      }, 3500);
      spawnSmokeBurst(player.x, player.y, 16);
      spawnFCT(player.x, player.y - 10, '🌑 STEALTH', '#c084fc');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'timeloop') {
      const rewindHp = Math.max(5, Math.round(player.maxHp * 0.25) + rank * 2);
      player.hp = Math.min(player.maxHp, player.hp + rewindHp);
      for (const s of ACTION_SLOTS) {
        if (s !== slot && cooldowns[s] > 0) cooldowns[s] = Math.max(0, cooldowns[s] - (2.2 + rank * 0.3));
      }
      offlineEchoPrimed = true;
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 15);
      spawnSparkBurst(player.x, player.y - 8, ['#38bdf8', '#e0f2fe', '#c084fc'], 14);
      spawnFCT(player.x, player.y - 10, `⏳ REWIND +${rewindHp} HP & ECHO!`, '#7dd3fc', true);
      updatePlayerUI();
      return;
    }

    if ((spec.kind === 'drain_beam' || spec.kind === 'execute_beam') && acquiredTarget) {
      let dmg = Math.max(4, 8 + Math.round(eff.power * 1.5) + rank * 3);
      if (spec.kind === 'execute_beam' && acquiredTarget.hp <= acquiredTarget.maxHp * 0.5) {
        dmg = Math.round(dmg * 1.5);
      }
      skyBeams.push({ x: acquiredTarget.x, y: acquiredTarget.y, color: spec.color || '#e11d48', age: 0, maxAge: 0.45 });
      damageOfflineEntity(acquiredTarget, dmg, true, true, spec.name);
      if (spec.kind === 'drain_beam') {
        const drainHeal = Math.max(2, Math.round(dmg * 0.6));
        player.hp = Math.min(player.maxHp, player.hp + drainHeal);
        spawnFCT(player.x, player.y - 8, `+${drainHeal} SIPHON`, '#4ade80');
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'reactive_barrier') {
      const shieldVal = 18 + eff.bastion * 3 + rank * 4;
      player.shield = shieldVal;
      player.rebukeTimer = 4.0;
      spawnSparkBurst(player.x, player.y - 8, ['#facc15', '#fef08a', '#ffffff'], 16);
      spawnFCT(player.x, player.y - 10, `☀️ REBUKE (+${shieldVal})`, spec.color || '#facc15');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'cleanse_sprint') {
      player.slowTimer = 0; player.snareTimer = 0; player.weakenTimer = 0;
      player.auroraStrideTimer = 4.0;
      spawnSparkBurst(player.x, player.y - 6, ['#fef08a', '#ffffff'], 12);
      spawnFCT(player.x, player.y - 10, '✨ AURORA STRIDE (+50% SPD)!', '#fef08a');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'archon_form') {
      player.solarAscensionTimer = 8.0;
      for (const s of [9, 10, 11, 12]) cooldowns[s] = 0;
      spawnSparkBurst(player.x, player.y - 8, ['#fde047', '#facc15', '#ffffff'], 24);
      spawnFCT(player.x, player.y - 14, '👑 SOLAR ASCENSION APEX ARCHON!', '#fde047', true);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'stealth_burst') {
      player.abyssalShroudTimer = 2.0;
      player.stealthed = true;
      setTimeout(() => { if (!net.connected) player.stealthed = false; }, 2000);
      spawnSmokeBurst(player.x, player.y, 20);
      spawnFCT(player.x, player.y - 10, '🌫️ ABYSSAL SHROUD (100% DODGE)!', '#9333ea', true);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'dash_cleave') {
      const { dx, dy } = getFacingVector();
      const dist = 10 * YARD_PX;
      const startX = player.x;
      const startY = player.y;
      player.x = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, player.x + dx * dist));
      player.y = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, player.y + dy * dist));
      for (let s = 0; s < 4; s++) {
        afterimages.push({ x: startX + (player.x - startX) * (s / 4), y: startY + (player.y - startY) * (s / 4), dir: player.dir, age: 0, maxAge: 0.3 });
      }
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 80) {
            damageOfflineEntity(e, Math.max(5, 12 + eff.power * 2 + rank * 3), true, false, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'voidform') {
      player.voidformTimer = 8.0;
      player.stealthed = true;
      setTimeout(() => { if (!net.connected) player.stealthed = false; }, 8000);
      spawnSmokeBurst(player.x, player.y, 24);
      spawnFCT(player.x, player.y - 14, '👑 AVATAR OF THE VOID!', '#a855f7', true);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'iron_fortify') {
      player.rootedBastionTimer = 3.5;
      spawnFCT(player.x, player.y - 10, '🌳 ROOTED BASTION (-40% DMG / CC IMMUNE)!', '#15803d', true);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'bramble_burst') {
      const burstRad = 8 * YARD_PX;
      groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#4ade80', x: player.x, y: player.y, radius: burstRad, age: 0, maxAge: 0.35 });
      spawnFCT(player.x, player.y - 10, '🌿 BRAMBLE REVERSAL!', '#4ade80');
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= burstRad) {
            damageOfflineEntity(e, 8 + eff.power + rank * 2, false, false, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'colossus_stomp') {
      const stompRad = 10 * YARD_PX;
      groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#84cc16', x: player.x, y: player.y, radius: stompRad, age: 0, maxAge: 0.4 });
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 25);
      spawnFCT(player.x, player.y - 10, '🪨 IRONWOOD COLOSSUS!', '#84cc16', true);
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= stompRad) {
            damageOfflineEntity(e, 14 + eff.power * 2 + rank * 3, true, false, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'treant_form') {
      player.shield = 250;
      player.thornbark = true;
      player.treantFormTimer = 8.0;
      spawnFCT(player.x, player.y - 14, '👑 AVATAR OF THE IRONWOOD!', '#22c55e', true);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'ethereal_jaunt') {
      player.phaseShiftTimer = 1.2;
      spawnSparkBurst(player.x, player.y - 8, ['#7dd3fc', '#bae6fd'], 12);
      spawnFCT(player.x, player.y - 10, '🌌 PHASE SHIFT (UNTOUCHABLE)!', '#7dd3fc');
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'rift_teleport') {
      const { dx, dy } = getFacingVector();
      const dist = 11 * YARD_PX;
      const startX = player.x;
      const startY = player.y;
      player.x = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, player.x + dx * dist));
      player.y = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, player.y + dy * dist));
      groundZones.push({ id: `off_gz_${Date.now()}`, type: 'frost_ring', color: '#38bdf8', x: startX, y: startY, radius: 48, age: 0, maxAge: 4.0 });
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - startX, e.y - startY) <= 52) {
            damageOfflineEntity(e, 8 + eff.power + rank * 2, false, false, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'apotheosis') {
      player.temporalApotheosisTimer = 8.0;
      for (const s of ACTION_SLOTS) {
        if (s !== slot) cooldowns[s] = 0;
      }
      spawnSparkBurst(player.x, player.y - 8, ['#e0f2fe', '#38bdf8', '#c084fc'], 24);
      spawnFCT(player.x, player.y - 14, '👑 TEMPORAL APOTHEOSIS!', '#e0f2fe', true);
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'scythe_wave') {
      const waveAngle = getFacingVector().angle;
      slashArcs.push({ x: player.x, y: player.y - 6, angle: waveAngle, color: '#9333ea', age: 0, maxAge: 0.35 });
      spawnFCT(player.x, player.y - 8, '🌑 ECLIPSE HARVESTER!', '#9333ea', true);
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 20 * YARD_PX) {
            damageOfflineEntity(e, 14 + eff.power * 2 + rank * 3, true, true, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'singularity_collapse') {
      groundZones.push({ id: `off_gz_${Date.now()}`, type: 'gravity', color: '#c084fc', spellName: spec.name, x: player.x, y: player.y, radius: 16 * YARD_PX, tickDmg: 8 + rank * 2, age: 0, maxAge: 3.5, tickTimer: 0.2 });
      spawnFCT(player.x, player.y - 12, '🌌 VOID ANNIHILATION APEX!', '#c084fc', true);
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 16 * YARD_PX) {
            damageOfflineEntity(e, 50 + eff.power * 3 + rank * 4, true, true, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'fissure_line') {
      const { dx, dy } = getFacingVector();
      spawnFCT(player.x, player.y - 8, '⛰️ TECTONIC FISSURE!', '#65a30d', true);
      for (let step = 1; step <= 5; step++) {
        const fx = player.x + dx * step * 28;
        const fy = player.y + dy * step * 28;
        groundZones.push({ id: `off_gz_${Date.now()}_${step}`, type: 'briar', color: '#65a30d', spellName: 'Tectonic Fissure', x: fx, y: fy, radius: 32, tickDmg: 4 + rank, age: 0, maxAge: 5.0, tickTimer: 0.3 });
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'continental_quake') {
      const quakeRad = 16 * YARD_PX;
      groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#4ade80', x: player.x, y: player.y, radius: quakeRad, age: 0, maxAge: 0.6 });
      spawnFCT(player.x, player.y - 12, '🌳 WRATH OF GAIA APEX!', '#4ade80', true);
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= quakeRad) {
            e.frozen = true;
            e.freezeTimer = 3.0;
            damageOfflineEntity(e, 48 + eff.power * 3 + rank * 4, true, true, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'supernova') {
      const cx = acquiredTarget ? acquiredTarget.x : player.x;
      const cy = acquiredTarget ? acquiredTarget.y : player.y;
      groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#38bdf8', x: cx, y: cy, radius: 13 * YARD_PX, age: 0, maxAge: 0.5 });
      spawnFCT(cx, cy - 10, '💥 SUPERNOVA COLLAPSE!', '#38bdf8', true);
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - cx, e.y - cy) <= 13 * YARD_PX) {
            damageOfflineEntity(e, 16 + Math.round(eff.power * 1.8) + rank * 3, true, true, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    if (spec.kind === 'stasis_bubble') {
      const stasisRad = 14 * YARD_PX;
      groundZones.push({ id: `off_gz_${Date.now()}`, type: 'frost_ring', color: '#0284c7', x: player.x, y: player.y, radius: stasisRad, age: 0, maxAge: 3.5 });
      spawnFCT(player.x, player.y - 12, '🌌 CHRONO STASIS APEX!', '#7dd3fc', true);
      for (const e of [...entities]) {
        if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
          if (Math.hypot(e.x - player.x, e.y - player.y) <= stasisRad) {
            e.frozen = true;
            e.freezeTimer = 3.5;
            damageOfflineEntity(e, 50 + eff.power * 3 + rank * 4, true, true, spec.name);
          }
        }
      }
      updatePlayerUI();
      return;
    }

    // Default Melee Cleave (Flare Strike, Whisper of the Void, Tectonic Slam, Reality Fracture)
    let hitAny = false;
    for (const e of [...entities]) {
      if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= rangePx + 14) {
          const isCrit = Math.random() < critChance;
          const base = Math.max(2, Math.floor(Math.random() * 4) + 3 + eff.power + rank * 2);
          const dmg = isCrit ? Math.round(base * 1.75) : base;
          damageOfflineEntity(e, dmg, isCrit, isRite, spec.name);
          hitAny = true;
        }
      }
    }
    if (hitAny) {
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 14 + eff.resonance * 2);
    }
    updatePlayerUI();
  };

  window.harvestTarget = function () {
    // 1. Check for interactive Ancient Leyline Shrines first
    let shrine = currentTarget && currentTarget.type === 'shrine' ? currentTarget : null;
    if (!shrine) {
      shrine = entities.find((e) => e.type === 'shrine' && Math.hypot(e.x - player.x, e.y - player.y) <= 7.0 * YARD_PX);
      if (shrine) setTarget(shrine);
    }
    if (shrine && Math.hypot(shrine.x - player.x, shrine.y - player.y) <= 7.2 * YARD_PX) {
      if (shrine.charges <= 0) {
        logMessage(`[Shrine] ${shrine.name} is currently depleted. Wait for it to resonate.`, 'log-combat');
        return;
      }
      audio.playChime();
      audio.playZenith?.();
      shrine.charges--;
      player.shrineBuff = { affinity: shrine.affinity, name: shrine.buffName, timer: 60 };
      spawnSparkBurst(shrine.x, shrine.y - 12, ['#facc15', '#ffffff', '#38bdf8', '#c084fc'], 32);
      spawnFCT(player.x, player.y - 14, `✨ ${shrine.buffName.toUpperCase()} BLESSING!`, '#facc15', true);
      logMessage(`✨ [LEYLINE BLESSING] ${shrine.name} granted ${shrine.buffName} (+Stats for 60s)!`, 'log-solari');
      if (net.connected) {
        net.send({ type: 'harvest_node', nodeId: shrine.id });
      }
      return;
    }

    // 2. Otherwise harvest Glimmer Node
    let node = currentTarget && currentTarget.type === 'node' ? currentTarget : null;
    if (!node) {
      node = entities.find((e) => e.type === 'node' && Math.hypot(e.x - player.x, e.y - player.y) <= 6.8 * YARD_PX);
      if (node) setTarget(node);
    }
    if (!node || Math.hypot(node.x - player.x, node.y - player.y) > 7.0 * YARD_PX) {
      logMessage('[Glimmer Node] Step near a purple Glimmer Node or Ancient Shrine first!', 'log-combat');
      return;
    }
    audio.playChime();
    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !questState.nodeHarvested) {
      questState.nodeHarvested = true;
      saveQuestState();
      updateQuestTrackerHUD();
    }
    if (net.connected) {
      net.send({ type: 'harvest_node', nodeId: node.id });
    } else if (node.charges > 0) {
      node.charges--;
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 35);
      awardXP(25, 'Glimmer Node');
    }
  };

  window.interactNearestNpc = function () {
    if (npcs.length === 0) return;
    let best = npcs[0];
    let bestDist = Infinity;
    for (const n of npcs) {
      const d = Math.hypot(n.x - player.x, n.y - player.y);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    interactWithNpc(best);
  };

  window.teleportWorld = function () {
    audio.playPortal();
    portalCooldown = 2.0;
    triggerPortalMist(0.5);
    inputs.up = inputs.down = inputs.left = inputs.right = false;
    player.isMoving = false;
    moveSyncAccum = 0;
    const nextType = currentRoomType === ROOM_TYPES.SANCTUARY_HUB ? ROOM_TYPES.NEXUS_WARZONE : ROOM_TYPES.SANCTUARY_HUB;
    if (net.connected) {
      net.send({ type: 'switch_room', roomType: nextType, epoch: currentEpoch });
    } else {
      buildOfflineZone(nextType);
    }
  };

  // ==========================================
  // 3v3 Arena Multiplayer Lobby Modal (announce in chat, queue, or play vs computer entities)
  // ==========================================
  let arenaLobby = { players: [], total: 0, capacity: 6, waitMs: 45000, autoFillEnd: null };
  let arenaInviteTimer = null;

  function escHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function applyArenaLobby(msg) {
    arenaLobby = {
      players: msg.players || [],
      total: msg.total || 0,
      capacity: msg.capacity || 6,
      waitMs: msg.waitMs || 45000,
      autoFillEnd: msg.autoFillInMs != null ? performance.now() + msg.autoFillInMs : null,
    };
    if (document.getElementById('arena-modal')?.style.display === 'block') renderArenaModal();
  }

  function renderArenaModal() {
    const body = document.getElementById('arena-modal-body');
    if (!body) return;
    const online = net.connected;
    const myId = net.playerId || localProfile.id;
    const players = arenaLobby.players;
    const slots = [];
    for (let i = 0; i < arenaLobby.capacity; i++) {
      const pl = players[i];
      if (pl) {
        const fm = FACTIONS_META[pl.faction] || FACTIONS_META.Solari;
        slots.push(`
          <div class="arena-slot filled" style="border-color:${fm.color};">
            <div style="font-size:14px;">${fm.icon}</div>
            <b style="color:${fm.color};">${escHtml(pl.name)}${pl.id === myId ? ' (You)' : ''}</b>
            <span style="color:#94a3b8;">Lv.${pl.level}${pl.partySize > 1 ? ` • Squad ${pl.partySize}` : ''}</span>
          </div>`);
      } else {
        slots.push(`
          <div class="arena-slot">
            <div style="font-size:14px;">🤖</div>
            <span>OPEN SLOT</span>
            <span style="font-size:7.5px;">Computer entity fills</span>
          </div>`);
      }
    }

    const others = players.filter((p) => p.id !== myId).length;
    let actions = '';
    if (!online) {
      actions = `
        <div style="font-size:11px; color:#fbbf24; margin:6px 0;">Multiplayer realm resting — solo training matches are available.</div>
        <button class="util-btn arena-btn-primary" style="border-color:#4ade80; color:#4ade80;" onclick="arenaPlayWithComputer()">🤖 PLAY WITH COMPUTER ENTITIES</button>`;
    } else if (isQueueing) {
      actions = `
        <button class="util-btn arena-btn-primary" style="border-color:#4ade80; color:#4ade80;" onclick="arenaFillNow()">🤖 FILL EMPTY SLOTS WITH COMPUTER ENTITIES & START NOW</button>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px;">
          <button class="util-btn" style="border-color:#facc15; color:#fde047;" onclick="arenaAnnounce()">📢 RE-ANNOUNCE IN CHAT</button>
          <button class="util-btn" style="border-color:#ef4444; color:#f87171;" onclick="arenaLeaveQueue()">✕ LEAVE QUEUE</button>
        </div>`;
    } else {
      actions = `
        <button class="util-btn arena-btn-primary" style="border-color:#facc15; color:#fde047;" onclick="arenaOpenLobby()">
          📢 ${others > 0 ? `JOIN LOBBY (${others} WAITING)` : 'OPEN LOBBY & ANNOUNCE IN CHAT'}
        </button>
        <button class="util-btn arena-btn-primary" style="border-color:#4ade80; color:#4ade80;" onclick="arenaPlayWithComputer()">🤖 PLAY WITH COMPUTER ENTITIES</button>`;
    }

    body.innerHTML = `
      <div style="font-size:9px; color:#cbd5e1; line-height:1.45; background:#080c18; border:2px solid #1e293b; padding:8px 10px;">
        Shatter the enemy <b style="color:#f87171;">25-HP Nexus</b> while defending yours. Open a lobby to announce it in chat and gather
        up to <b style="color:#fde047;">6 champions</b> — or jump in right now against <b style="color:#4ade80;">computer entities</b>.
        Empty slots are always filled automatically.
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:9px;">
        <b style="color:#38bdf8;">LOBBY: ${arenaLobby.total} / ${arenaLobby.capacity} CHAMPIONS</b>
        <span id="arena-timer-txt" style="color:#94a3b8;"></span>
      </div>
      <div class="arena-timer-bar"><div class="arena-timer-fill" id="arena-timer-fill"></div></div>
      <div class="arena-slot-grid">${slots.join('')}</div>
      ${actions}
    `;
    updateArenaTimer();
  }

  function updateArenaTimer() {
    const txt = document.getElementById('arena-timer-txt');
    const fill = document.getElementById('arena-timer-fill');
    if (!txt || !fill) return;
    if (arenaLobby.autoFillEnd == null || arenaLobby.total === 0) {
      txt.innerText = arenaLobby.total === 0 ? 'No open lobby' : '';
      fill.style.width = '0%';
      return;
    }
    const remMs = Math.max(0, arenaLobby.autoFillEnd - performance.now());
    txt.innerText = `Computer entities fill in ${Math.ceil(remMs / 1000)}s`;
    fill.style.width = `${Math.min(100, (1 - remMs / arenaLobby.waitMs) * 100)}%`;
  }
  setInterval(() => {
    if (document.getElementById('arena-modal')?.style.display === 'block') updateArenaTimer();
  }, 250);

  window.arenaOpenLobby = function () {
    audio.playChime();
    net.send({ type: 'queue_arena', join: true, mode: 'wait' });
  };
  window.arenaPlayWithComputer = function () {
    audio.playPortal();
    if (net.connected) {
      net.send({ type: 'queue_arena', join: true, mode: 'bots' });
      return;
    }
    const btn = document.getElementById('btn-queue');
    isQueueing = true;
    if (btn) btn.innerText = '⏳ STARTING...';
    clearTimeout(queueTimer);
    queueTimer = setTimeout(() => {
      isQueueing = false;
      if (btn) btn.innerText = '⚔️ 3v3 ARENA';
      document.getElementById('arena-modal').style.display = 'none';
      buildOfflineZone(ROOM_TYPES.ARENA_3V3);
    }, 900);
  };
  window.arenaFillNow = function () {
    audio.playChime();
    net.send({ type: 'arena_fill' });
  };
  window.arenaAnnounce = function () {
    net.send({ type: 'arena_announce' });
  };
  window.arenaLeaveQueue = function () {
    audio.playChime();
    net.send({ type: 'queue_arena', join: false });
  };
  window.joinArenaFromInvite = function () {
    window.dismissArenaInvite();
    if (document.getElementById('arena-modal')?.style.display !== 'block') window.toggleModal('arena-modal');
  };
  window.dismissArenaInvite = function () {
    clearTimeout(arenaInviteTimer);
    const toast = document.getElementById('arena-invite-toast');
    if (toast) toast.style.display = 'none';
  };

  window.toggleMatchmaking = function () {
    if (net.connected) net.send({ type: 'arena_lobby_info' });
    window.toggleModal('arena-modal');
  };

  window.cyclePixelZoom = function () {
    const nextZoom = zoom === 3 ? 4 : zoom === 4 ? 2 : 3;
    setPixelZoom(nextZoom);
  };

  // ==========================================
  // Action Bar & Modals: Rites [P], Stats [C], Gear [I], ID [G], Social [O]
  // ==========================================
  const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock']);

  function normalizeKeyEvent(e) {
    if (!e) return '';
    if (e.code && e.code.startsWith('Digit') && e.code.length === 6) {
      return e.code.slice(5);
    }
    if (e.code === 'Space' || e.key === ' ') return 'space';
    return String(e.key || '').toLowerCase();
  }

  function formatKeyLabel(rawKey) {
    const k = String(rawKey || '').toLowerCase();
    if (!k) return '?';
    if (k === 'space') return 'SPC';
    if (k === 'arrowup') return '↑';
    if (k === 'arrowdown') return '↓';
    if (k === 'arrowleft') return '←';
    if (k === 'arrowright') return '→';
    return k.toUpperCase();
  }

  function updateActionBarBadges() {
    for (const slot of ACTION_SLOTS) {
      const spec = getSlotAbilitySpec(localProfile.loadout, slot);
      const unlocked = isSlotUnlocked(prog, slot);
      const reqLvl = SLOT_UNLOCK_LEVELS[slot] || 1;
      const abilityRank = getAbilityRank(prog, spec?.id);
      const isLearned = abilityRank >= 1;

      const badge = document.getElementById(`badge-${slot}`);
      if (badge && keybinds[slot]) badge.innerText = formatKeyLabel(keybinds[slot]);
      const rk = document.getElementById(`rank-${slot}`);
      if (rk) {
        if (!unlocked) {
          rk.innerText = `Lv.${reqLvl}`;
          rk.style.color = '#94a3b8';
        } else if (!isLearned) {
          rk.innerText = `LOCK`;
          rk.style.color = '#ef4444';
        } else {
          rk.innerText = abilityRank >= 5 ? 'MAX' : `R${abilityRank}`;
          rk.style.color = abilityRank >= 5 ? '#facc15' : '#38bdf8';
        }
      }
      const iconEl = document.getElementById(`icon-${slot}`);
      if (iconEl) iconEl.innerText = (!unlocked || !isLearned) ? '🔒' : (spec?.icon || '⚔️');
      const nameEl = document.getElementById(`name-${slot}`);
      if (nameEl) {
        if (!unlocked) {
          nameEl.innerText = `Lv.${reqLvl}`;
          nameEl.style.color = '#94a3b8';
        } else if (!isLearned) {
          nameEl.innerText = spec?.short || 'Rite';
          nameEl.style.color = '#ef4444';
        } else {
          nameEl.innerText = spec?.short || 'Rite';
          nameEl.style.color = spec?.color || '#ffffff';
        }
      }
      const btnEl = document.getElementById(`btn-slot-${slot}`);
      if (btnEl) {
        if (!unlocked) {
          btnEl.title = `Locked: Reach Level ${reqLvl} to unlock this ${slot >= 9 ? 'Flash' : 'Rite'}!`;
          btnEl.classList.add('slot-locked');
          btnEl.classList.remove('flash-card', 'rite-card');
        } else if (!isLearned) {
          btnEl.title = `🔒 [Unlearned] ${spec.name} — Allocate skill points in Spellbook [P] to unlock!`;
          btnEl.classList.add('slot-locked');
          btnEl.classList.remove('flash-card', 'rite-card');
        } else if (spec) {
          const castTxt = spec.castTime > 0 ? `${spec.castTime.toFixed(1)}s Cast` : 'Instant Flash';
          btnEl.title = `${spec.name} (${spec.tcgType} • Rank ${abilityRank}/5 • ${castTxt}) — ${spec.desc}`;
          btnEl.classList.remove('slot-locked');
          btnEl.classList.toggle('flash-card', spec.tcgType.includes('Flash'));
          btnEl.classList.toggle('rite-card', spec.tcgType.includes('Rite'));
        }
      }
    }
    const hb = document.getElementById('badge-harvest');
    if (hb && keybinds.harvest) hb.innerText = formatKeyLabel(keybinds.harvest);
  }

  let rebindFeedbackMsg = '';
  let currentSkillTreeTab = 'flashes';

  window.switchSkillTreeTab = function (tab) {
    currentSkillTreeTab = tab;
    document.querySelectorAll('.st-tab-btn').forEach((btn) => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`st-tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    const treeContent = document.getElementById('skill-tree-content');
    const kbContainer = document.getElementById('keybind-list-container');

    if (tab === 'keybinds') {
      if (treeContent) treeContent.style.display = 'none';
      if (kbContainer) kbContainer.style.display = 'block';
      renderKeybindUI();
    } else {
      if (treeContent) treeContent.style.display = 'block';
      if (kbContainer) kbContainer.style.display = 'none';
      renderSkillTreeUI();
    }
  };

  window.upgradeAbilityInTree = function (abilityId) {
    const spec = ABILITIES_CATALOG[abilityId];
    if (!spec) return;
    if (!canUpgradeAbility(prog, abilityId)) {
      audio.playHurt();
      return;
    }

    prog.skillPoints = Math.max(0, (prog.skillPoints || 0) - 1);
    if (!prog.skills) prog.skills = {};
    const newRank = Math.min(spec.maxRank || 5, (prog.skills[abilityId] || 0) + 1);
    prog.skills[abilityId] = newRank;

    for (const [slotStr, abId] of Object.entries(localProfile.loadout || {})) {
      if (abId === abilityId) {
        prog.ranks[slotStr] = newRank;
      }
    }

    // Audio chime fanfare for dopamine hit!
    audio.playChime();
    spawnSparkBurst(player.x, player.y - 8, [spec.color || '#fde047', '#ffffff', '#facc15'], 24);
    spawnFCT(player.x, player.y - 14, `★ ${spec.name.toUpperCase()} (RANK ${newRank}/5)!`, spec.color || '#facc15', true);
    logMessage(`🌟 Upgraded ${spec.name} to Rank ${newRank}/5!`, 'log-gain', 'combat');

    updateActionBarBadges();
    renderSkillTreeUI();
    renderKeybindUI();

    if (net.connected) {
      net.send({ type: 'upgrade_skill', abilityId });
    }
  };

  function renderSkillTreeUI() {
    const container = document.getElementById('skill-tree-content');
    if (!container) return;

    const isFlashesTab = currentSkillTreeTab === 'flashes';
    const targetTree = isFlashesTab ? 'flashes' : 'rites';
    const myFaction = localProfile.faction || 'Solari';
    const sp = prog.skillPoints || 0;

    const spBadge = document.getElementById('sp-count-txt');
    if (spBadge) spBadge.innerText = String(sp);

    const banner = document.getElementById('skill-points-banner');
    if (banner) {
      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#fde047; font-size:12.5px; font-weight:800; letter-spacing:0.02em;">⚡ UNSPENT SKILL POINTS: <span id="sp-count-txt" class="skill-pts-badge" style="font-size:12px; padding:3px 9px;">${sp}</span></span>
            ${sp > 0 ? '<span style="color:#4ade80; font-weight:800; font-size:11px; animation:pulseAlloc 1.4s infinite alternate;">★ READY TO INVEST!</span>' : '<span style="color:#94a3b8; font-size:11px;">(Slay monsters or level up to earn +1 SP/level)</span>'}
          </div>
          <div style="font-size:11px; color:#cbd5e1; font-family:var(--font-clean);">
            CHAMPION LV. <b style="color:#facc15;">${prog.level || 1}</b> • <b style="color:${myFaction === 'Solari' ? '#facc15' : myFaction === 'Umbri' ? '#c084fc' : myFaction === 'Terra' ? '#4ade80' : '#38bdf8'};">${myFaction.toUpperCase()}</b>
          </div>
        </div>
      `;
    }

    // Filter skills for this tree and faction
    const treeSkills = Object.values(ABILITIES_CATALOG).filter(
      (ab) => ab.tree === targetTree && (ab.faction === myFaction || ab.faction === 'All')
    );

    // Group by Tier (1 to 7)
    const tiers = [
      { tier: 1, reqLevel: 1, name: 'NOVICE' },
      { tier: 2, reqLevel: 3, name: 'INITIATE' },
      { tier: 3, reqLevel: 6, name: 'ADEPT' },
      { tier: 4, reqLevel: 12, name: 'VANGUARD' },
      { tier: 5, reqLevel: 18, name: 'MASTER' },
      { tier: 6, reqLevel: 24, name: 'CHAMPION' },
      { tier: 7, reqLevel: 30, name: 'APEX ULTIMATE' },
    ];

    let html = '';

    for (const t of tiers) {
      const skillsInTier = treeSkills.filter((s) => (s.tier || 1) === t.tier);
      if (skillsInTier.length === 0) continue;

      const tierUnlocked = (prog.level || 1) >= t.reqLevel;

      html += `
        <div class="d2-tier-row" style="${t.tier === 7 ? 'border: 2px solid #ca8a04; background: rgba(30, 20, 5, 0.85); box-shadow: 0 0 15px rgba(234, 179, 8, 0.2);' : ''}">
          <div class="d2-tier-header" style="${t.tier === 7 ? 'border-bottom-color: #854d0e;' : ''}">
            <div>
              <span style="color:${t.tier === 7 ? '#fde047' : '#facc15'}; font-weight:800;">${t.tier === 7 ? '★ ' : ''}TIER ${t.tier}: ${t.name}</span>
              <span style="color:#94a3b8; margin-left:8px;">(Requires Champion Level ${t.reqLevel})</span>
            </div>
            <div>
              ${tierUnlocked
                ? `<span style="color:#4ade80; font-size:10px; font-weight:bold;">✓ UNLOCKED</span>`
                : `<span style="color:#ef4444; font-size:10px; font-weight:bold;">🔒 LOCKED (Level ${t.reqLevel})</span>`}
            </div>
          </div>
          <div class="d2-skills-grid">
      `;

      for (const ab of skillsInTier) {
        const curRank = getAbilityRank(prog, ab.id);
        const canUp = canUpgradeAbility(prog, ab.id);
        const isMax = curRank >= (ab.maxRank || 5);
        const isLearned = curRank >= 1;

        let cardClass = 'd2-skill-card';
        if (isMax) cardClass += ' maxed';
        else if (isLearned) cardClass += ' learned';
        else if (!tierUnlocked) cardClass += ' locked';

        const castTimeTxt = ab.castTime > 0 ? `☀️ ${ab.castTime.toFixed(1)}s Cast Rite` : `⚡ Instant Flash`;

        let prereqName = '';
        let prereqMet = true;
        if (ab.prereq) {
          const pSpec = ABILITIES_CATALOG[ab.prereq];
          prereqName = pSpec?.name || ab.prereq;
          prereqMet = getAbilityRank(prog, ab.prereq) >= 1;
        }

        // Check if currently equipped in loadout
        let equippedSlot = null;
        for (const [s, id] of Object.entries(localProfile.loadout || {})) {
          if (id === ab.id) {
            equippedSlot = s;
            break;
          }
        }

        // Available slots for quick equipping
        const equipSlots = isFlashesTab ? [9, 10, 11, 12] : [1, 2, 3, 4];

        html += `
          <div class="${cardClass}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:18px;">${ab.icon}</span>
                <div>
                  <div style="font-weight:700; font-size:11.5px; color:${ab.color || '#facc15'};">${ab.name}</div>
                  <div style="font-size:9.5px; color:#38bdf8;">${castTimeTxt}</div>
                </div>
              </div>
              <div class="d2-rank-badge ${isMax ? 'is-max' : curRank > 0 ? 'has-points' : ''}">
                ${isMax ? 'MAX RANK (5/5)' : `RANK ${curRank}/5`}
              </div>
            </div>

            <div style="font-size:10px; color:#cbd5e1; line-height:1.4; margin-top:2px;">
              ${ab.desc}
            </div>

            ${prereqName ? `
              <div style="font-size:9.5px; color:${prereqMet ? '#4ade80' : '#f87171'};">
                ${prereqMet ? '✓' : '🔒'} Requires: ${prereqName} (Rank 1+)
              </div>
            ` : ''}

            ${curRank < 5 ? `
              <div style="font-size:9.5px; color:#facc15; background:rgba(15,23,42,0.6); padding:3px 6px; border-radius:3px; border-left:2px solid #facc15;">
                Next Rank: +3 Base DMG / Effect scaling, -0.35s Cooldown
              </div>
            ` : ''}

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; gap:6px; flex-wrap:wrap;">
              <div>
                ${canUp
                  ? `<button type="button" class="d2-alloc-btn can-alloc" onclick="upgradeAbilityInTree('${ab.id}')">+ INVEST 1 POINT</button>`
                  : isMax
                    ? `<button type="button" class="d2-alloc-btn" disabled>★ MAXED</button>`
                    : !tierUnlocked
                      ? `<button type="button" class="d2-alloc-btn" disabled>REQ LV. ${t.reqLevel}</button>`
                      : !prereqMet
                        ? `<button type="button" class="d2-alloc-btn" disabled>REQ PREREQ</button>`
                        : `<button type="button" class="d2-alloc-btn" disabled>0 POINTS</button>`}
              </div>

              ${isLearned ? `
                <div style="display:flex; align-items:center; gap:4px;">
                  <span style="font-size:9.5px; color:#94a3b8;">EQUIP:</span>
                  ${equipSlots.map((s) => {
                    const isCur = equippedSlot == s;
                    const keyLabel = formatKeyLabel(keybinds[s]);
                    return `
                      <button type="button" class="util-btn" style="padding:2px 5px; font-size:9px; ${isCur ? 'border-color:#4ade80; color:#4ade80; background:#14532d;' : 'border-color:#334155; color:#cbd5e1;'}"
                        onclick="assignSlotAbilityInGame(${s}, '${ab.id}')" title="Equip to Slot ${s} [${keyLabel}]">
                        ${isCur ? `✓ [${keyLabel}]` : `[${keyLabel}]`}
                      </button>
                    `;
                  }).join('')}
                </div>
              ` : `
                <div style="font-size:9px; color:#ef4444; font-weight:600;">🔒 UNLEARNED</div>
              `}
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderKeybindUI() {
    const container = document.getElementById('keybind-list-container');
    if (!container) return;
    const ptsHeader = document.getElementById('skill-points-banner');
    if (ptsHeader) {
      const sp = prog.skillPoints || 0;
      if (listeningSlot !== null) {
        const lSpec = getSlotAbilitySpec(localProfile.loadout, listeningSlot);
        ptsHeader.innerHTML = `
          <div style="color:#fde047; font-size:12px; font-weight:800;">
            ⌨️ PRESS ANY KEY TO BIND "${(lSpec?.name || 'SLOT').toUpperCase()}" (OR [ESC] TO CANCEL)...
          </div>
        `;
      } else if (rebindFeedbackMsg) {
        ptsHeader.innerHTML = `
          <div style="color:#4ade80; font-size:12px; font-weight:800;">
            ${rebindFeedbackMsg}
          </div>
        `;
      } else {
        ptsHeader.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#fde047; font-size:12.5px; font-weight:800;">⚡ UNSPENT SKILL POINTS: <span class="skill-pts-badge" style="font-size:12px; padding:3px 9px;">${sp}</span></span>
              ${sp > 0 ? '<span style="color:#4ade80; font-weight:800; font-size:11px;">★ READY TO INVEST!</span>' : ''}
            </div>
            <div style="font-size:11px; color:#cbd5e1;">
              CLICK ANY <b style="color:#38bdf8;">[KEY]</b> BUTTON BELOW TO REBIND ACTION BAR
            </div>
          </div>
        `;
      }
    }
    container.innerHTML = '';
    const cdMult = calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction);
    const myFaction = localProfile.faction || 'Solari';

    for (const slot of [1, 2, 3, 4, 'harvest', 9, 10, 11, 12]) {
      const spec = getSlotAbilitySpec(localProfile.loadout, slot);
      if (!spec) continue;
      const bound = formatKeyLabel(keybinds[slot]);
      const isListening = listeningSlot === slot;
      const isRankable = typeof slot === 'number';
      const curRank = isRankable ? getAbilityRank(prog, spec.id) : null;
      const isLearned = isRankable ? curRank >= 1 : true;
      const canUpgrade = isRankable && canUpgradeAbility(prog, spec.id);

      // Available choices for this slot: only learned spells matching tree type!
      const isFlashSlot = typeof slot === 'number' && slot >= 9;
      const allowedChoices = Object.values(ABILITIES_CATALOG).filter(
        (ab) => ab.faction !== 'All' &&
          (isFlashSlot ? ab.tree === 'flashes' : ab.tree === 'rites') &&
          getAbilityRank(prog, ab.id) >= 1
      );

      const castTimeTxt = spec.castTime > 0 ? `${spec.castTime.toFixed(1)}s Cast` : 'Instant';

      const row = document.createElement('div');
      row.className = 'keybind-row';
      row.innerHTML = `
        <div style="flex:1; padding-right:10px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:16px;">${isLearned ? spec.icon : '🔒'}</span>
            <b style="color:${spec.color}; font-size:12px;">${spec.name}</b>
            <span class="spec-pill">${spec.tcgType}</span>
            ${isRankable ? `<span class="rank-pill">${isLearned ? `RANK ${curRank}/5` : '🔒 UNLEARNED'}</span>` : ''}
            <span style="font-size:10px; color:#94a3b8;">${castTimeTxt} • CD: ${spec.baseCd > 0 ? (spec.baseCd * cdMult).toFixed(1) + 's' : '0s'} • ${spec.range}</span>
          </div>
          <div style="font-size:10.5px; color:#e2e8f0; margin-top:3px; line-height:1.4;">${spec.desc}</div>
          ${isRankable ? `
            <div style="margin-top:5px;">
              <select class="pixel-input" style="width:auto; padding:3px 8px; font-size:10.5px;" onchange="assignSlotAbilityInGame(${slot}, this.value); this.blur();">
                ${allowedChoices.length > 0
                  ? allowedChoices.map((ab) => `<option value="${ab.id}" ${spec.id === ab.id ? 'selected' : ''}>${ab.icon} ${ab.name} (Rank ${getAbilityRank(prog, ab.id)}/5)</option>`).join('')
                  : `<option disabled selected>🔒 No ${isFlashSlot ? 'Flashes' : 'Rites'} learned yet — allocate points in Spellbook [P]!</option>`}
              </select>
            </div>
          ` : ''}
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${isRankable && isLearned ? `
            <button type="button" class="upgrade-btn ${canUpgrade ? 'ready' : ''}" ${canUpgrade ? '' : 'disabled'} onclick="upgradeAbilityInTree('${spec.id}')">
              ${curRank >= 5 ? 'MAX' : '+RANK'}
            </button>
          ` : ''}
          <button type="button" id="rebind-btn-${slot}" class="keybind-btn ${isListening ? 'listening' : ''}">
            ${isListening ? 'KEY?' : `[${bound}]`}
          </button>
        </div>
      `;
      const rbBtn = row.querySelector(`#rebind-btn-${slot}`);
      if (rbBtn) {
        rbBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          window.startRebinding(slot);
        });
      }
      container.appendChild(row);
    }
  }

  function renderStatsModal() {
    const body = document.getElementById('stats-modal-body');
    if (!body) return;
    const eff = getEffectiveStats(prog, localProfile.equipment, localProfile.classId);
    const fm = FACTIONS_META[localProfile.faction] || FACTIONS_META.Solari;
    const statDefs = [
      { key: 'power', icon: '⚔️', name: 'POWER', base: prog.stats.power, total: eff.power, desc: '+1 Base Damage on all Rites & Flashes' },
      { key: 'bastion', icon: '🛡️', name: 'BASTION', base: prog.stats.bastion, total: eff.bastion, desc: '+3 Max HP, +3 Shield Barriers, +2 Healing' },
      { key: 'resonance', icon: '🔮', name: 'RESONANCE', base: prog.stats.resonance, total: eff.resonance, desc: '+8 Max Glimmer & bonus Glimmer generation' },
      { key: 'tempo', icon: '⚡', name: 'TEMPO (FLASH)', base: prog.stats.tempo, total: eff.tempo, desc: '+2.5% Crit, +3% Move Speed, -2% Cooldowns' },
    ];
    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#080c18; border:2px solid #1e293b; padding:10px 12px; margin-bottom:10px; font-size:12px;">
        <div>CHAMPION LEVEL: <b style="color:#facc15; font-size:13px;">LV. ${prog.level}</b> <span style="color:#94a3b8; font-size:11px;">(${prog.xp}/${xpForNextLevel(prog.level)} XP)</span></div>
        <div style="color:${prog.statPoints > 0 ? '#4ade80' : '#94a3b8'}; font-weight:bold; font-size:12px;">
          UNSPENT STAT POINTS: <span class="skill-pts-badge" style="font-size:12px; padding:2px 7px;">${prog.statPoints}</span>
        </div>
      </div>
      <div style="background:#080c18; border-left:3px solid ${fm.color}; padding:8px 10px; margin-bottom:10px; font-size:11px; line-height:1.45;">
        <b style="color:${fm.color}; font-size:12px;">${fm.icon} ${fm.mechanicName}:</b> ${fm.mechanicDesc}
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
        ${statDefs.map((s) => `
          <div class="keybind-row" style="margin-bottom:0; padding:8px 10px;">
            <div>
              <div style="font-size:12px; color:#f8fafc;">
                ${s.icon} <b style="letter-spacing:0.02em;">${s.name}</b>: <span style="color:#facc15; font-weight:800; font-size:13px;">${s.total}</span>
                <span style="font-size:10.5px; color:#94a3b8;">(Base ${s.base} + Gear ${s.total - s.base})</span>
              </div>
              <div style="font-size:10.5px; color:#cbd5e1; margin-top:3px;">${s.desc}</div>
            </div>
            <button class="upgrade-btn ${prog.statPoints > 0 ? 'ready' : ''}" style="font-size:11px; padding:6px 12px;" ${prog.statPoints > 0 ? '' : 'disabled'} onclick="allocateStat('${s.key}')">
              +1 STAT
            </button>
          </div>
        `).join('')}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11.5px; background:#080c18; border:2px solid #1e293b; padding:10px 12px; margin-bottom:10px;">
        <div>MAX HEALTH: <b style="color:#4ade80;">${player.maxHp} HP</b></div>
        <div>MAX GLIMMER: <b style="color:#facc15;">${player.maxSolarCharge}</b></div>
        <div>CRIT CHANCE: <b style="color:#fde047;">${(calcCritChance(prog, localProfile.equipment, localProfile.classId) * 100).toFixed(1)}%</b></div>
        <div>COOLDOWN MULT: <b style="color:#38bdf8;">${Math.round(calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction) * 100)}%</b></div>
      </div>

      <!-- Late Game Paragon Resonance Mastery -->
      <div style="background:#090618; border:2px solid #581c87; padding:10px 12px; margin-top:8px; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <span style="color:#c084fc; font-weight:bold; font-size:12px; font-family:var(--font-header);">🔮 PARAGON RESONANCE:</span>
            <b style="color:#facc15; font-size:12px;">PARAGON ${prog.paragonLevel || 0}</b>
            <span style="font-size:10px; color:#94a3b8;">(${prog.paragonXp || 0}/${paragonXpForLevel(prog.paragonLevel || 0)} XP)</span>
          </div>
          <div style="color:${(prog.paragonPoints || 0) > 0 ? '#4ade80' : '#94a3b8'}; font-weight:bold; font-size:11px;">
            PARAGON PTS: <span class="skill-pts-badge" style="font-size:11px; padding:2px 6px;">${prog.paragonPoints || 0}</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${Object.values(PARAGON_AFFINITIES).map((aff) => {
            const curRank = prog.paragon?.[aff.id] || 0;
            const canUp = canUpgradeParagon(prog, aff.id);
            return `
              <div class="keybind-row" style="margin-bottom:0; padding:6px 10px; border-color:#3b0764; background:#0f0926;">
                <div>
                  <div style="font-size:11.5px; color:${aff.color}; font-weight:bold;">
                    ${aff.icon} ${aff.name} <span style="color:#f8fafc; font-size:10px;">[Rank ${curRank}/${aff.maxRank}]</span>
                  </div>
                  <div style="font-size:10px; color:#cbd5e1; margin-top:2px;">${aff.desc}</div>
                </div>
                <button class="upgrade-btn ${canUp ? 'ready' : ''}" style="padding:5px 10px; font-size:10.5px;" ${canUp ? '' : 'disabled'} onclick="upgradeParagon('${aff.id}')">
                  ${curRank >= aff.maxRank ? 'MAX' : '+INVEST'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Leyline Torment Difficulty Selection -->
      <div style="background:#130b1c; border:2px solid #854d0e; padding:10px 12px; margin-top:8px; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div>
            <span style="color:#fbbf24; font-weight:bold; font-size:12px; font-family:var(--font-header);">🔥 LEYLINE TORMENT:</span>
            <b style="color:${getTormentConfig(prog.tormentLevel || 0).color}; font-size:12px;">${getTormentConfig(prog.tormentLevel || 0).name}</b>
          </div>
          <div style="font-size:10.5px; font-weight:700;">
            ${(prog.level || 1) >= 30 ? '<span style="color:#4ade80;">UNLOCKED</span>' : '<span style="color:#94a3b8;">REQUIRES LV. 30</span>'}
          </div>
        </div>
        <div style="font-size:10px; color:#cbd5e1; margin-bottom:8px; line-height:1.4;">
          ${getTormentConfig(prog.tormentLevel || 0).desc}
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          ${TORMENT_LEVELS.map((t) => {
            const isCur = t.level === (prog.tormentLevel || 0);
            const isUnlocked = t.level === 0 || (prog.level || 1) >= 30;
            return `
              <button class="upgrade-btn ${isCur ? 'ready' : ''}"
                style="padding:5px 9px; font-size:10.5px; border-color:${t.color}; color:${isCur ? '#05070f' : t.color}; background:${isCur ? t.color : '#0f172a'};"
                ${isUnlocked ? '' : 'disabled'}
                onclick="setTormentLevel(${t.level})">
                ${t.name}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function refreshSocialModalView() {
    const roomPlayers = [
      {
        id: net.playerId || localProfile.id,
        name: localProfile.displayName,
        faction: localProfile.faction,
        orderTag: localProfile.orderTag,
        level: prog.level,
      },
      ...Array.from(remotePlayers.values()),
    ];
    renderSocialModal({
      rooms: publicRoomsList,
      currentRoomId,
      roomPlayers,
      selfId: net.playerId || localProfile.id,
    });
    updateTouchUiButtons(document.body.classList.contains('touch-mode'));
  }

  window.startRebinding = function (slot) {
    const parsed = isNaN(Number(slot)) ? slot : Number(slot);
    rebindFeedbackMsg = '';
    if (listeningSlot === parsed) {
      listeningSlot = null;
      renderKeybindUI();
      return;
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    listeningSlot = parsed;
    renderKeybindUI();
    window.focus();
    const activeBtn = document.getElementById(`rebind-btn-${parsed}`);
    if (activeBtn) activeBtn.focus({ preventScroll: true });
  };

  window.resetDefaultKeybinds = function () {
    listeningSlot = null;
    rebindFeedbackMsg = '✓ Restored default Rite & Flash hotkeys!';
    keybinds = { ...DEFAULT_KEYBINDS };
    try { localStorage.removeItem('glimmerfall_keybinds'); } catch (_) {}
    audio.playChime();
    updateActionBarBadges();
    renderKeybindUI();
  };

  window.toggleTouchControls = toggleTouchControls;
  window.toggleScanlines = function (enabled) {
    const crt = document.getElementById('crt-overlay');
    if (crt) crt.style.display = enabled ? 'block' : 'none';
    const cb = document.getElementById('settings-crt-checkbox');
    if (cb) cb.checked = enabled;
  };

  window.toggleModal = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const opening = el.style.display !== 'block';
    listeningSlot = null;
    rebindFeedbackMsg = '';
    document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    if (opening) {
      if (id === 'char-modal') renderStatsModal();
      if (id === 'spellbook-modal') switchSkillTreeTab(currentSkillTreeTab || 'flashes');
      if (id === 'arena-modal') renderArenaModal();
      if (id === 'paperdoll-modal') renderInGamePaperdollModal({ profile: localProfile });
      if (id === 'account-modal') {
        renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: accountStatusMsg });
      }
      if (id === 'social-modal') {
        if (net.connected) net.send({ type: 'list_rooms' });
        refreshSocialModalView();
      }
      if (id === 'lore-modal') {
        renderLoreModal();
      }
      if (id === 'settings-modal') {
        const touchCb = document.getElementById('settings-touch-checkbox');
        if (touchCb) touchCb.checked = document.body.classList.contains('touch-mode');
        const crtCb = document.getElementById('settings-crt-checkbox');
        if (crtCb) crtCb.checked = document.getElementById('crt-overlay')?.style.display === 'block';
        const zLbl = document.getElementById('zoom-label');
        if (zLbl) zLbl.innerText = `${zoom}x`;
      }
      el.style.display = 'block';
    }
  };

  // ==========================================
  // Input Listeners
  // ==========================================
  function enterPortalEntity(ent) {
    const dest = ent.targetRoom || PORTAL_ID_TO_ROOM[ent.id] || ROOM_TYPES.NEXUS_WARZONE;
    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && dest !== ROOM_TYPES.SANCTUARY_HUB) {
      questState.portalTraveled = true;
      saveQuestState();
      updateQuestTrackerHUD();
    }
    portalCooldown = 0.9;
    triggerPortalMist(0.25);
    audio.playPortal();
    setupZoneDecor(dest);
    if (net.connected) {
      isTransitioningZone = true;
      currentRoomType = dest;
      currentRoomId = null;
      net.send({ type: 'switch_room', roomType: dest, epoch: currentEpoch });
    } else {
      buildOfflineZone(dest);
    }
  }

  canvas.addEventListener('mousedown', (e) => {
    if (frontpage.isOpen) return;
    audio.init();
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);

    for (const npc of npcs) {
      if (Math.hypot(npc.x - wx, npc.y - 12 - wy) < 22) {
        interactWithNpc(npc);
        return;
      }
    }

    for (const rp of remotePlayers.values()) {
      if (!rp.isDead && !rp.stealthed && Math.hypot(rp.renderX - wx, rp.renderY - 10 - wy) < 20) {
        setTarget({
          id: `p_${rp.id}`,
          playerId: rp.id,
          isRemotePlayer: true,
          name: rp.name,
          sub: `Lv.${rp.level} ${rp.faction} ${rp.orderTag ? `<${rp.orderTag}>` : ''}`,
          x: rp.renderX,
          y: rp.renderY,
          hp: rp.hp,
          maxHp: rp.maxHp,
          radius: 14,
        });
        if (e.button === 2 && isRemoteHostile(rp)) {
          faceToward(rp.renderX, rp.renderY);
          window.castAbility(1);
        }
        return;
      }
    }

    let clicked = null;
    let bestD = 26;
    for (const ent of entities) {
      if (ent.isDying || ent.type === 'ally_nexus') continue;
      const d = Math.hypot(ent.x - wx, ent.y - 10 - wy);
      if (d < bestD) {
        bestD = d;
        clicked = ent;
      }
    }

    if (clicked) {
      if (clicked.type === 'portal') {
        if (Math.hypot(clicked.x - player.x, clicked.y - player.y) <= 95 || e.button === 2) {
          enterPortalEntity(clicked);
        } else {
          setTarget(clicked);
          logMessage(`[Waygate] Step closer or right-click ${clicked.name} to travel!`, 'log-quest', 'chat');
        }
        return;
      }
      setTarget(clicked);
      faceToward(clicked.x, clicked.y);
      if (e.button === 2 || clicked.type === 'node') {
        if (clicked.type === 'node') window.harvestTarget();
        else window.castAbility(1);
      }
    } else if (e.button === 2) {
      faceToward(wx, wy);
      window.castAbility(1);
    }
  });

  window.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('wheel', (e) => {
    if (frontpage.isOpen) return;
    e.preventDefault();
    if (e.deltaY < 0 && zoom < 4) setPixelZoom(zoom + 1);
    else if (e.deltaY > 0 && zoom > 2) setPixelZoom(zoom - 1);
  }, { passive: false });

  function resetInputs() {
    for (const k in inputs) inputs[k] = k === 'axisX' || k === 'axisY' ? 0 : false;
  }
  window.addEventListener('blur', resetInputs);
  document.addEventListener('visibilitychange', resetInputs);

  initTouchControls({
    inputs,
    cycleTarget: () => cycleTarget(),
    harvestTarget: () => window.harvestTarget(),
    onFirstTouch: () => audio.init(),
  });

  window.addEventListener('keydown', (e) => {
    // 1. PRIORITY CAPTURE: Rebinding a Rite/Flash hotkey inside [P] Rites!
    if (listeningSlot !== null) {
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat || MODIFIER_KEYS.has(e.key)) {
        return; // Wait for the actual non-modifier key press
      }
      const pressed = normalizeKeyEvent(e);
      if (pressed && pressed !== 'escape') {
        const targetSlot = listeningSlot;
        const prevKey = keybinds[targetSlot];
        // Swap if another slot already uses this key so no two slots ever collide!
        for (const [otherSlot, existingKey] of Object.entries(keybinds)) {
          const parsedOther = isNaN(Number(otherSlot)) ? otherSlot : Number(otherSlot);
          if (parsedOther !== targetSlot && existingKey === pressed) {
            keybinds[parsedOther] = prevKey;
          }
        }
        keybinds[targetSlot] = pressed;
        try { localStorage.setItem('glimmerfall_keybinds', JSON.stringify(keybinds)); } catch (_) {}
        const boundSpec = getSlotAbilitySpec(localProfile.loadout, targetSlot);
        rebindFeedbackMsg = `✓ Bound ${boundSpec?.name || 'Slot'} to [${formatKeyLabel(pressed)}]!`;
        audio.playChime();
        updateActionBarBadges();
      } else {
        rebindFeedbackMsg = '';
      }
      listeningSlot = null;
      renderKeybindUI();
      return;
    }

    if (frontpage.isOpen) {
      if (e.key === 'Escape' && introShown) frontpage.close();
      return;
    }

    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
      if (e.key === 'Enter' && document.activeElement.id === 'chat-input') {
        e.preventDefault();
        window.submitChatInput();
      } else if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const chatInp = document.getElementById('chat-input');
      if (chatInp) chatInp.focus();
      return;
    }

    const key = e.key.toLowerCase();
    const normKey = normalizeKeyEvent(e);

    if (key === 'escape') {
      const openModal = Array.from(document.querySelectorAll('.modal')).find((m) => m.style.display === 'block');
      if (openModal || currentTarget || dialogueOpen) {
        setTarget(null);
        window.closeDialogue();
        document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
      } else {
        window.toggleModal('settings-modal');
      }
      return;
    }

    if (key === 'tab') {
      e.preventDefault();
      cycleTarget();
      return;
    }

    // Check custom Rite/Flash hotkeys BEFORE Space/menu shortcuts so any bound key works!
    if (!e.repeat) {
      for (const [slot, boundKey] of Object.entries(keybinds)) {
        if (boundKey && (key === boundKey || normKey === boundKey)) {
          e.preventDefault();
          if (slot === 'harvest') window.harvestTarget();
          else window.castAbility(Number(slot));
          return;
        }
      }
    }

    if (key === 'w') inputs.w = true;
    if (key === 'a') inputs.a = true;
    if (key === 's') inputs.s = true;
    if (key === 'd') inputs.d = true;
    if (key === 'arrowup') inputs.up = true;
    if (key === 'arrowdown') inputs.down = true;
    if (key === 'arrowleft') inputs.left = true;
    if (key === 'arrowright') inputs.right = true;
    if (e.shiftKey) inputs.shift = true;

    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat && activeDialoguePages.length && dialogueIdx < activeDialoguePages.length) {
        window.advanceDialogue();
        return;
      }
      if (player.z <= 0 && !player.isDead && !player.frozen) {
        player.vz = 115;
        audio.playJump();
      }
      return;
    }

    if (e.repeat) return;

    if (key === 't') window.interactNearestNpc();
    if (key === 'v') window.triggerEmote('cheer');
    if (key === 'b') window.plantOrderBanner();
    if (key === 'i') window.toggleModal('paperdoll-modal');
    if (key === 'm') window.toggleWorldAtlas();
    if (key === 'p') window.toggleModal('spellbook-modal');
    if (key === 'c') window.toggleModal('char-modal');
    if (key === 'g') window.toggleModal('account-modal');
    if (key === 'o') window.toggleModal('social-modal');
    if (key === 'h') window.openFrontpage();
    if (key === 'k') window.toggleModal('cards-modal');
    if (key === 'l') window.openQuestLog();
  }, true);

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') inputs.w = false;
    if (key === 'a') inputs.a = false;
    if (key === 's') inputs.s = false;
    if (key === 'd') inputs.d = false;
    if (key === 'arrowup') inputs.up = false;
    if (key === 'arrowdown') inputs.down = false;
    if (key === 'arrowleft') inputs.left = false;
    if (key === 'arrowright') inputs.right = false;
    if (!e.shiftKey) inputs.shift = false;
  });

  // ==========================================
  // 60 FPS Simulation & Interpolation Loop
  // ==========================================
  let netStatusTimer = 0;

  function update(dt) {
    globalTime += dt;
    netStatusTimer += dt;
    if (netStatusTimer >= 0.5) {
      netStatusTimer = 0;
      updateNetStatusPill();
    }
    if (portalCooldown > 0) portalCooldown = Math.max(0, portalCooldown - dt);
    if (portalMistTimer > 0) portalMistTimer = Math.max(0, portalMistTimer - dt);

    for (const slot in cooldowns) {
      if (cooldowns[slot] > 0) {
        cooldowns[slot] = Math.max(0, cooldowns[slot] - dt);
        const ov = document.getElementById(`cd-${slot}`);
        if (ov) {
          ov.style.opacity = cooldowns[slot] > 0 ? '1' : '0';
          ov.innerText = cooldowns[slot] > 0 ? cooldowns[slot].toFixed(1) : '';
        }
      }
    }

    if (!net.connected) {
      if (player.bubbleTimer > 0) {
        player.bubbleTimer -= dt;
        if (player.bubbleTimer <= 0) player.bubble = null;
      }
      if (player.emoteTimer > 0) {
        player.emoteTimer -= dt;
        if (player.emoteTimer <= 0) player.emote = null;
      }
    }

    if (player.rebukeTimer > 0) player.rebukeTimer = Math.max(0, player.rebukeTimer - dt);
    if (player.auroraStrideTimer > 0) player.auroraStrideTimer = Math.max(0, player.auroraStrideTimer - dt);
    if (player.solarAscensionTimer > 0) {
      player.solarAscensionTimer = Math.max(0, player.solarAscensionTimer - dt);
      player.ascensionPulse = (player.ascensionPulse || 0) + dt;
      if (player.ascensionPulse >= 1.2) {
        player.ascensionPulse = 0;
        spawnSparkBurst(player.x, player.y - 6, ['#facc15', '#fef08a', '#ffffff'], 12);
        for (const e of entities) {
          if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
            if (Math.hypot(e.x - player.x, e.y - player.y) <= 64) {
              damageOfflineEntity(e, 6, false, false, 'Solar Radiance Pulse');
            }
          }
        }
      }
    }
    if (player.abyssalShroudTimer > 0) player.abyssalShroudTimer = Math.max(0, player.abyssalShroudTimer - dt);
    if (player.voidformTimer > 0) player.voidformTimer = Math.max(0, player.voidformTimer - dt);
    if (player.rootedBastionTimer > 0) player.rootedBastionTimer = Math.max(0, player.rootedBastionTimer - dt);
    if (player.treantFormTimer > 0) player.treantFormTimer = Math.max(0, player.treantFormTimer - dt);
    if (player.phaseShiftTimer > 0) player.phaseShiftTimer = Math.max(0, player.phaseShiftTimer - dt);
    if (player.temporalApotheosisTimer > 0) player.temporalApotheosisTimer = Math.max(0, player.temporalApotheosisTimer - dt);

    // Terra Primal Bastion Passive Health Regeneration (0.5 HP/s per point)
    const hpRegen = calcHpRegenPerSec(prog);
    if (hpRegen > 0 && !player.isDead && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + hpRegen * dt);
    }

    if (player.slashTimer > 0) player.slashTimer = Math.max(0, player.slashTimer - dt);

    if (isCasting) {
      castProgress += dt;
      document.getElementById('cast-fill').style.width = `${Math.min(100, (castProgress / castDuration) * 100)}%`;
      if (castProgress >= castDuration) {
        isCasting = false;
        document.getElementById('cast-bar-container').style.display = 'none';
        if (!net.connected && currentSpell && currentSpell.onComplete) currentSpell.onComplete();
      }
    }

    if (player.z > 0 || player.vz > 0) {
      player.z += player.vz * dt;
      player.vz -= 360 * dt;
      if (player.z <= 0) {
        player.z = 0;
        player.vz = 0;
      }
    }

    if (!player.isDead && !player.frozen && !frontpage.isOpen) {
      let mx = 0;
      let my = 0;
      if (inputs.w || inputs.up) my -= 1;
      if (inputs.s || inputs.down) my += 1;
      if (inputs.a || inputs.left) mx -= 1;
      if (inputs.d || inputs.right) mx += 1;
      if (inputs.axisX || inputs.axisY) {
        mx += inputs.axisX;
        my += inputs.axisY;
      }

      if (mx !== 0 || my !== 0) {
        if (isCasting) {
          isCasting = false;
          castProgress = 0;
          document.getElementById('cast-bar-container').style.display = 'none';
          currentSpell = null;
          logMessage('🚫 Rite channeling interrupted by movement!', 'log-combat');
          if (net.connected) {
            net.send({ type: 'cancel_cast' });
          }
        }
        const len = Math.hypot(mx, my);
        mx /= len;
        my /= len;

        const eff = getEffectiveStats(prog, localProfile.equipment, localProfile.classId);
        const umbriSpeedMult = calcMoveSpeedMult(prog);
        const sprintBonus = player.auroraStrideTimer > 0 || player.temporalApotheosisTimer > 0 ? 1.5 : (inputs.shift ? player.sprintMult : 1);
        const tempoSpeed = player.baseSpeed * (1 + eff.tempo * 0.03) * umbriSpeedMult;
        const spd = tempoSpeed * sprintBonus;
        const stepDist = spd * dt;

        const GATE_HALF_WIDTH = 72;
        const edgeTransitions = ROOM_CONFIGS[currentRoomType]?.edgeTransitions;
        const canPassEastWest = (edgeTransitions?.east || edgeTransitions?.west) && Math.abs(player.y) <= GATE_HALF_WIDTH;
        const canPassNorthSouth = (edgeTransitions?.north || edgeTransitions?.south) && Math.abs(player.x) <= GATE_HALF_WIDTH;
        const padX = canPassEastWest ? 4 : 14;
        const padY = canPassNorthSouth ? 4 : 14;
        const targetX = Math.max(-mapBounds.halfW + padX, Math.min(mapBounds.halfW - padX, player.x + mx * stepDist));
        const targetY = Math.max(-mapBounds.halfH + padY, Math.min(mapBounds.halfH - padY, player.y + my * stepDist));

        // Water & Chasm Collision: Cannot walk on water unless crossing a bridge!
        const currentlyInWater = isWaterTile(player.x, player.y, currentRoomType);
        const colRadius = 8;
        const testX = targetX + Math.sign(mx) * colRadius;
        const testY = targetY + Math.sign(my) * colRadius;

        const canMoveX = currentlyInWater || !isWaterTile(testX, player.y, currentRoomType);
        const canMoveY = currentlyInWater || !isWaterTile(player.x, testY, currentRoomType);

        if (canMoveX && canMoveY && mx !== 0 && my !== 0) {
          if (!currentlyInWater && isWaterTile(testX, testY, currentRoomType)) {
            // Corner hit! Smoothly slide along primary axis
            if (Math.abs(mx) >= Math.abs(my)) {
              player.x = targetX;
            } else {
              player.y = targetY;
            }
          } else {
            player.x = targetX;
            player.y = targetY;
          }
        } else {
          if (canMoveX) player.x = targetX;
          if (canMoveY) player.y = targetY;
        }

        // Spawn gentle water droplet ripple when moving against the water's edge
        if ((!canMoveX && mx !== 0) || (!canMoveY && my !== 0)) {
          if (Math.random() < 0.15) {
            particles.push({
              x: player.x + mx * 8 + (Math.random() - 0.5) * 6,
              y: player.y + my * 8 + (Math.random() - 0.5) * 4,
              z: 1 + Math.random() * 3,
              vx: (Math.random() - 0.5) * 14,
              vy: (Math.random() - 0.5) * 14,
              vz: 7 + Math.random() * 9,
              size: 2,
              color: '#38bdf8',
              age: 0,
              maxAge: 0.28,
            });
          }
        }
        player.isMoving = true;
        player.walkTimer += dt * (inputs.shift ? 13 : 9);

        if (player.slashTimer <= 0) {
          if (Math.abs(mx) > Math.abs(my)) player.dir = mx > 0 ? 'right' : 'left';
          else player.dir = my > 0 ? 'down' : 'up';
        }

        footstepAccum += dt;
        if (footstepAccum > (inputs.shift ? 0.16 : 0.24) && player.z <= 0) {
          footstepAccum = 0;
          spawnFootstepDust(player.x, player.y);
        }

        if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !questState.stasisBroken) {
          questState.stasisBroken = true;
          saveQuestState();
          updateQuestTrackerHUD();
          if (net.connected) net.send({ type: 'award_quest_xp' });
          else awardXP(20, 'Stasis Broken');
          logMessage('[Quest] Limbs restored! Strike the Sanctuary Dummy with [1]!', 'log-quest');
        }

        // Step-into-portal seamless travel!
        if (portalCooldown <= 0) {
          // Seamless Boundary Walking Transitions across 48x48 perimeter
          const cfg = ROOM_CONFIGS[currentRoomType];
          if (cfg && cfg.edgeTransitions) {
            const edgePad = 12;
            let dest = null;
            let nextX = player.x;
            let nextY = player.y;

            const GATE_HALF_WIDTH = 72; // Center boundary road opening
            if (player.x >= mapBounds.halfW - edgePad && cfg.edgeTransitions.east && Math.abs(player.y) <= GATE_HALF_WIDTH) {
              dest = cfg.edgeTransitions.east;
              const nextCfg = ROOM_CONFIGS[dest];
              nextX = nextCfg ? -nextCfg.halfW + 56 : 56;
              nextY = Math.max(-36, Math.min(36, player.y));
            } else if (player.x <= -mapBounds.halfW + edgePad && cfg.edgeTransitions.west && Math.abs(player.y) <= GATE_HALF_WIDTH) {
              dest = cfg.edgeTransitions.west;
              const nextCfg = ROOM_CONFIGS[dest];
              nextX = nextCfg ? nextCfg.halfW - 56 : -56;
              nextY = Math.max(-36, Math.min(36, player.y));
            } else if (player.y <= -mapBounds.halfH + edgePad && cfg.edgeTransitions.north && Math.abs(player.x) <= GATE_HALF_WIDTH) {
              dest = cfg.edgeTransitions.north;
              const nextCfg = ROOM_CONFIGS[dest];
              nextX = Math.max(-36, Math.min(36, player.x));
              nextY = nextCfg ? nextCfg.halfH - 56 : -56;
            } else if (player.y >= mapBounds.halfH - edgePad && cfg.edgeTransitions.south && Math.abs(player.x) <= GATE_HALF_WIDTH) {
              dest = cfg.edgeTransitions.south;
              const nextCfg = ROOM_CONFIGS[dest];
              nextX = Math.max(-36, Math.min(36, player.x));
              nextY = nextCfg ? -nextCfg.halfH + 56 : 56;
            }

            if (dest) {
              portalCooldown = 0.9;
              triggerPortalMist(0.25);
              moveSyncAccum = 0;
              audio.playPortal();
              player.x = nextX;
              player.y = nextY;
              camera.x = player.x;
              camera.y = player.y;
              lastSentMove = { x: Math.round(nextX * 10) / 10, y: Math.round(nextY * 10) / 10, z: 0, dir: player.dir, isMoving: player.isMoving, time: performance.now() };
              if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && dest !== ROOM_TYPES.SANCTUARY_HUB) {
                questState.portalTraveled = true;
                saveQuestState();
                updateQuestTrackerHUD();
              }
              setupZoneDecor(dest);
              if (net.connected) {
                // Optimistic client switch: zero waiting, zero screen freezes across ngrok
                isTransitioningZone = true;
                currentRoomType = dest;
                currentRoomId = null;
                net.send({ type: 'switch_room', roomType: dest, x: nextX, y: nextY, dir: player.dir, epoch: currentEpoch });
              } else {
                buildOfflineZone(dest, nextX, nextY);
              }
            }
          }
        }
      } else {
        player.isMoving = false;
      }
    } else {
      player.isMoving = false;
    }

    net.currentCoords = { x: player.x, y: player.y };
    net.preferredRoom = currentRoomType;

    if (net.connected) {
      moveSyncAccum += dt;
      if (moveSyncAccum >= 0.05) {
        moveSyncAccum = 0;
        const curX = Math.round(player.x * 10) / 10;
        const curY = Math.round(player.y * 10) / 10;
        const curZ = Math.round(player.z);
        const now = performance.now();
        const changed = curX !== lastSentMove.x || curY !== lastSentMove.y || curZ !== lastSentMove.z || player.dir !== lastSentMove.dir || player.isMoving !== lastSentMove.isMoving;
        if (changed || player.isMoving || now - lastSentMove.time > 1200) {
          lastSentMove = { x: curX, y: curY, z: curZ, dir: player.dir, isMoving: player.isMoving, time: now };
          net.send({
            type: 'move',
            x: curX,
            y: curY,
            z: curZ,
            dir: player.dir,
            isMoving: player.isMoving,
            epoch: currentEpoch,
          });
        }
      }
    }

    for (const rp of remotePlayers.values()) {
      rp.renderX += (rp.x - rp.renderX) * Math.min(1, 14 * dt);
      rp.renderY += (rp.y - rp.renderY) * Math.min(1, 14 * dt);
      if (rp.isMoving) rp.walkTimer = (rp.walkTimer || 0) + dt * 9.5;
    }

    camera.x += (player.x - camera.x) * Math.min(1, 10 * dt);
    camera.y += (player.y - camera.y) * Math.min(1, 10 * dt);
    if (Math.abs(player.x - camera.x) < 0.2) camera.x = player.x;
    if (Math.abs(player.y - camera.y) < 0.2) camera.y = player.y;

    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (!net.connected && e.freezeTimer > 0) {
        e.freezeTimer = Math.max(0, e.freezeTimer - dt);
        if (e.freezeTimer <= 0) e.frozen = false;
      }
      if (e.isDying) {
        e.deathAge = (e.deathAge || 0) + dt;
        e.y -= 22 * dt;
        if (currentTarget && currentTarget.id === e.id) {
          setTarget(null);
        }
        // Continuous billowing purple smoke dissolution
        if (Math.random() < 0.5) {
          const pTheme = SMOKE_PURPLE_PALETTE[(Math.random() * SMOKE_PURPLE_PALETTE.length) | 0];
          particles.push({
            type: 'smoke',
            x: e.x + (Math.random() - 0.5) * 14,
            y: e.y + (Math.random() - 0.5) * 10,
            z: 6 + Math.random() * 12,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 8,
            vz: 22 + Math.random() * 20,
            baseSize: 3.5 + Math.random() * 3.5,
            size: 4,
            color: pTheme.color,
            darkColor: pTheme.darkColor,
            highlightColor: pTheme.highlightColor,
            age: 0,
            maxAge: 0.55 + Math.random() * 0.35,
          });
        }
        if (e.deathAge >= 0.65) {
          entities.splice(i, 1);
        }
        continue;
      }

      // Offline Mob AI: Aggro detection, pursuit, and combat attacks against the player
      if (!net.connected && e.type === 'mob' && e.hp > 0) {
        if (e.freezeTimer > 0) continue; // Frozen by Frost Nova

        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        const aggroRange = e.aggroRange || (e.isBoss ? 130 : 110);
        const attackRange = e.attackRange || (e.isBoss ? 34 : 28);
        const speed = e.speed || (e.isBoss ? 38 : 52);
        const playerStealthed = Boolean(player.stealthed);

        // Proximity aggro trigger
        if (!e.inCombat && !player.isDead && !playerStealthed && dist <= aggroRange) {
          e.inCombat = true;
          spawnFCT(e.x, e.y - 12, 'AGGRO!', '#ef4444');
          audio.playHit(false);
          logMessage(`[Aggro] ${e.name} targets you!`, 'log-combat');
        }

        if (e.inCombat) {
          if (player.isDead || playerStealthed) {
            e.inCombat = false;
          }

          // Leash check: return home if dragged too far
          const origX = e.origX ?? e.x;
          const origY = e.origY ?? e.y;
          const distHome = Math.hypot(origX - e.x, origY - e.y);

          if (distHome > 240) {
            e.inCombat = false;
            e.x = origX;
            e.y = origY;
            e.hp = e.maxHp;
            spawnFCT(e.x, e.y - 12, 'EVADED', '#94a3b8');
            logMessage(`[Combat] ${e.name} reset and returned to territory.`, 'log-combat');
            continue;
          }

          if (e.inCombat) {
            if (e.isBoss && !e.isDying) {
              const hpPercent = (e.hp / e.maxHp) * 100;
              e.phase = e.phase || 1;

              // Phase 2: Frenzy & Minions at 65% HP
              if (hpPercent <= 65 && e.phase === 1) {
                e.phase = 2;
                e.baseDamage = e.baseDamage || e.damage || 7;
                e.damage = Math.floor(e.baseDamage * 1.35);
                logMessage(`⚡ ${e.name} roars into Phase 2, summoning guardians!`, 'log-combat');
                spawnSparkBurst(e.x, e.y, ['#ef4444', '#f59e0b', '#facc15'], 28);
                for (let m = 0; m < 3; m++) {
                  entities.push({
                    id: `${e.id}_m_${Date.now()}_${m}`,
                    name: `${e.name} Guardian`,
                    sub: 'Boss Minion',
                    type: 'mob',
                    isMinion: true,
                    spriteKey: e.spriteKey === 'solariBoss' ? 'solariSentinel' : e.spriteKey === 'umbriBoss' ? 'duskFiend' : 'voidStalker',
                    x: e.x + (Math.random() * 40 - 20),
                    y: e.y + (Math.random() * 40 - 20),
                    origX: e.x,
                    origY: e.y,
                    hp: Math.max(15, Math.round(e.maxHp * 0.18)),
                    maxHp: Math.max(15, Math.round(e.maxHp * 0.18)),
                    damage: Math.max(2, Math.round((e.damage || 6) * 0.5)),
                    xpReward: 35,
                    speed: 52,
                    aggroRange: 150,
                    attackRange: 28,
                    radius: 14,
                    hitFlash: 0,
                  });
                }
              }

              // Phase 3: Enrage & Area Shockwaves at 25% HP
              if (hpPercent <= 25 && e.phase === 2) {
                e.phase = 3;
                e.enraged = true;
                e.baseDamage = e.baseDamage || e.damage || 7;
                e.damage = Math.floor(e.baseDamage * 1.6);
                logMessage(`🔥 BEWARE: ${e.name} has ENRAGED! Ground shockwaves inbound!`, 'log-combat');
                spawnSparkBurst(e.x, e.y, ['#dc2626', '#b91c1c', '#7f1d1d'], 36);
              }

              // Boss Telegraphed AoE Ability (1.4-1.7s warning circle to dodge out of)
              e.abilityCooldown = (e.abilityCooldown ?? (e.enraged ? 3.5 : 5.8)) - dt;
              if (e.abilityCooldown <= 0) {
                e.abilityCooldown = e.enraged ? 3.5 : 5.8;
                let telLabel = e.enraged ? '💥 ENRAGED CATACLYSM' : '⚡ TITAN SLAM';
                let telColor = e.enraged ? '#ef4444' : '#f59e0b';
                let shockRad = e.enraged ? 98 : 70;
                let warnDuration = 1.6;

                if (e.spriteKey === 'solariBoss') {
                  telLabel = e.enraged ? '🔥 CORONA CATACLYSM' : '☀️ SOLAR FLARE BURST';
                  telColor = '#facc15';
                  shockRad = e.enraged ? 102 : 74;
                } else if (e.spriteKey === 'umbriBoss') {
                  telLabel = e.enraged ? '💀 VOID SINGULARITY' : '🌑 SHADOW RIFT';
                  telColor = '#a855f7';
                  shockRad = e.enraged ? 94 : 68;
                  warnDuration = 1.5;
                } else if (e.spriteKey === 'graniteBoss') {
                  telLabel = e.enraged ? '🪨 TECTONIC COLLAPSE' : '🌿 IRONWOOD SLAM';
                  telColor = '#4ade80';
                  shockRad = e.enraged ? 106 : 78;
                  warnDuration = 1.7;
                } else if (e.spriteKey === 'aetherBoss') {
                  telLabel = e.enraged ? '🌀 CHRONO SINGULARITY' : '⚡ TEMPORAL DISRUPTION';
                  telColor = '#38bdf8';
                  shockRad = e.enraged ? 96 : 70;
                  warnDuration = 1.4;
                }

                const shockDmg = Math.round((e.damage || 7) * (e.enraged ? 1.9 : 1.35));
                const tgtX = Math.random() < 0.65 ? player.x : e.x;
                const tgtY = Math.random() < 0.65 ? player.y : e.y;

                spawnFCT(tgtX, tgtY - 14, `⚠️ ${telLabel}!`, telColor, true);

                groundZones.push({
                  id: `off_tel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  type: 'telegraph',
                  color: telColor,
                  label: telLabel,
                  x: tgtX,
                  y: tgtY,
                  radius: shockRad,
                  age: 0,
                  maxAge: warnDuration,
                  damage: shockDmg,
                  bossName: e.name,
                  bossRef: e,
                  snare: e.spriteKey === 'graniteBoss' ? 2.0 : 0,
                });
              }
            }

            const speedMult = e.snareTimer > 0 ? 0.35 : e.slowTimer > 0 ? 0.55 : 1.0;
            e.facingDir = player.x < e.x ? -1 : 1;

            if (dist > attackRange) {
              e.x += ((player.x - e.x) / dist) * speed * speedMult * dt;
              e.y += ((player.y - e.y) / dist) * speed * speedMult * dt;
            } else {
              e.atkTimer = (e.atkTimer || 0) + dt;
              if (e.atkTimer >= 1.85) {
                e.atkTimer = 0;
                const rawDmg = Math.max(1, (e.damage || (e.isBoss ? 6 : 4)) - (e.weakenTimer > 0 ? 2 : 0));
                damageOfflinePlayer(rawDmg, e.name, e);
                e.hitFlash = 0.12;
              }
            }
          }
        } else if (currentRoomType === ROOM_TYPES.ARENA_3V3) {
          const blueNexus = entities.find((n) => n.id === 'blue_nexus' && !n.isDying);
          if (blueNexus) {
            const dn = Math.hypot(blueNexus.x - e.x, blueNexus.y - e.y);
            const speedMult = e.snareTimer > 0 ? 0.35 : e.slowTimer > 0 ? 0.55 : 1.0;
            if (dn > 32) {
              e.x += ((blueNexus.x - e.x) / dn) * speed * speedMult * dt;
              e.y += ((blueNexus.y - e.y) / dn) * speed * speedMult * dt;
            } else {
              e.atkTimer = (e.atkTimer || 0) + dt;
              if (e.atkTimer >= 2.0) {
                e.atkTimer = 0;
                damageOfflineEntity(blueNexus, 2, false, false, e.name);
              }
            }
          }
        }
      }
    }

    // Advance offline projectiles & ground zones when running in local fallback
    if (!net.connected) {
      updateOfflineLoot(dt);
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const prj = projectiles[i];
        const tgt = entities.find((e) => e.id === prj.targetId && !e.isDying);
        if (!tgt) {
          projectiles.splice(i, 1);
          continue;
        }
        const dx = tgt.x - prj.x;
        const dy = tgt.y - 8 - prj.y;
        const d = Math.hypot(dx, dy);
        prj.rot = (prj.rot || 0) + 18 * dt;
        if (d < 12) {
          damageOfflineEntity(tgt, prj.dmg || 8, false, Boolean(prj.isRite), prj.spellName || 'Arcane Bolt');
          projectiles.splice(i, 1);
          updatePlayerUI();
        } else {
          prj.x += (dx / d) * (prj.speed || 235) * dt;
          prj.y += (dy / d) * (prj.speed || 235) * dt;
        }
      }

      for (let i = groundZones.length - 1; i >= 0; i--) {
        const gz = groundZones[i];
        gz.age = (gz.age || 0) + dt;
        if (['consecration', 'plague', 'briar', 'gravity'].includes(gz.type)) {
          if (gz.type === 'gravity') {
            for (const e of entities) {
              if (!e.isDying && e.type === 'mob') {
                const dist = Math.hypot(gz.x - e.x, gz.y - e.y);
                if (dist > 10 && dist <= gz.radius) {
                  e.x += ((gz.x - e.x) / dist) * 28 * dt;
                  e.y += ((gz.y - e.y) / dist) * 28 * dt;
                }
              }
            }
          }
          gz.tickTimer = (gz.tickTimer ?? 0.25) - dt;
          if (gz.tickTimer <= 0) {
            gz.tickTimer = 1.4;
            for (const e of [...entities]) {
              if (!e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal') {
                if (Math.hypot(e.x - gz.x, e.y - gz.y) <= gz.radius) {
                  damageOfflineEntity(e, gz.tickDmg || 4, false, true, gz.spellName || 'Ground Rite');
                }
              }
            }
            updatePlayerUI();
          }
        }
        if (gz.age >= (gz.maxAge || 0.45)) {
          if (gz.type === 'telegraph') {
            // Detonate boss telegraph
            groundZones.push({
              id: `off_shock_${Date.now()}`,
              type: 'shockwave',
              color: gz.color || '#ef4444',
              x: gz.x,
              y: gz.y,
              radius: gz.radius,
              age: 0,
              maxAge: 0.35,
            });
            spawnSparkBurst(gz.x, gz.y, [gz.color || '#ef4444', '#fde047', '#ffffff'], 24);
            audio.playHit(true);
            if (!player.isDead && !player.stealthed && Math.hypot(player.x - gz.x, player.y - gz.y) <= gz.radius) {
              damageOfflinePlayer(gz.damage || 14, `${gz.bossName || 'Boss'} ${gz.label || 'Cataclysm'}`, gz.bossRef);
              const ang = Math.atan2(player.y - gz.y, player.x - gz.x);
              player.x = Math.max(-mapBounds.halfW + 14, Math.min(mapBounds.halfW - 14, player.x + Math.cos(ang) * 24));
              player.y = Math.max(-mapBounds.halfH + 14, Math.min(mapBounds.halfH - 14, player.y + Math.sin(ang) * 24));
              if (gz.snare) player.snareTimer = Math.max(player.snareTimer || 0, gz.snare);
            }
          }
          groundZones.splice(i, 1);
        }
      }
    }

    if (player.shrineBuff) {
      player.shrineBuff.timer -= dt;
      if (player.shrineBuff.timer <= 0) {
        logMessage(`[Blessing] Your ${player.shrineBuff.name} Leyline blessing has faded.`, 'log-combat');
        player.shrineBuff = null;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.type === 'smoke') {
        p.vx *= (1 - 0.75 * dt);
        p.vy *= (1 - 0.75 * dt);
        p.vz += 14 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z = Math.max(0, p.z + p.vz * dt);
      if (p.age >= p.maxAge) particles.splice(i, 1);
    }
    for (let i = afterimages.length - 1; i >= 0; i--) {
      afterimages[i].age += dt;
      if (afterimages[i].age >= afterimages[i].maxAge) afterimages.splice(i, 1);
    }
    for (let i = slashArcs.length - 1; i >= 0; i--) {
      slashArcs[i].age += dt;
      if (slashArcs[i].age >= slashArcs[i].maxAge) slashArcs.splice(i, 1);
    }
    for (let i = skyBeams.length - 1; i >= 0; i--) {
      skyBeams[i].age += dt;
      if (skyBeams[i].age >= skyBeams[i].maxAge) skyBeams.splice(i, 1);
    }
  }

  // ==========================================
  // 2D Pixel World Renderer (Zero Strobe / All 4 Biomes / Paperdoll)
  // ==========================================
  function pickTile(tx, ty) {
    const wx = tx * TILE_SIZE;
    const wy = ty * TILE_SIZE;

    // Calm, non-flashing static deep sea outside island bounds!
    if (wx < -mapBounds.halfW || wx >= mapBounds.halfW || wy < -mapBounds.halfH || wy >= mapBounds.halfH) {
      const seaIdx = Math.abs(tx * 3 + ty * 5) % 2;
      return sprites.tiles[`void_sea_${seaIdx}`];
    }

    const isAtCenterGate = (Math.abs(tx) <= 2 && (wy === -mapBounds.halfH || wy === mapBounds.halfH - TILE_SIZE)) ||
                           (Math.abs(ty) <= 2 && (wx === -mapBounds.halfW || wx === mapBounds.halfW - TILE_SIZE));

    const onRim =
      wx === -mapBounds.halfW || wx === mapBounds.halfW - TILE_SIZE ||
      wy === -mapBounds.halfH || wy === mapBounds.halfH - TILE_SIZE;

    if (onRim) {
      if (isAtCenterGate) return sprites.tiles.flagstone_1 || sprites.tiles.flagstone_0;
      return sprites.tiles.mountain_rock_0 || sprites.tiles.flagstone_0;
    }

    if (currentBiomeTheme === 'sanctuary') {
      // Grand 4-way crossroads leading to the North, South, East & West border gates!
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`];
    }

    if (currentBiomeTheme === 'arena') {
      if (Math.abs(tx) <= 2) return sprites.tiles.flagstone_1;
      if (wy > 64) return sprites.tiles.arena_blue;
      if (wy < -64) return sprites.tiles.arena_red;
      return sprites.tiles.arena_neutral;
    }

    if (currentBiomeTheme === 'ruins') {
      // Grand cross crossroads in ancient flagstone
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      // 4 quadrant elemental convergence: Terra (NW), Umbri (NE), Solari (SW), Aether (SE)
      if (tx < 0 && ty < 0) return sprites.tiles[`terra_${Math.abs(tx * 7 + ty * 11) % 4}`];
      if (tx > 0 && ty < 0) return sprites.tiles[`umbri_${Math.abs(tx * 7 + ty * 11) % 4}`];
      if (tx < 0 && ty > 0) return sprites.tiles[`solari_${Math.abs(tx * 7 + ty * 11) % 4}`];
      return sprites.tiles[`aether_${Math.abs(tx * 7 + ty * 11) % 4}`];
    }

    if (currentBiomeTheme === 'solari_vault') {
      // Center ceremonial altar
      if (Math.abs(tx) <= 3 && Math.abs(ty) <= 3) {
        return sprites.tiles[`flagstone_${Math.abs(tx * 3 + ty * 5) % 2}`];
      }
      // Geometric diamond sun rays
      if ((Math.abs(tx) + Math.abs(ty)) % 5 === 0 || Math.abs(tx) <= 1) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      return sprites.tiles[`solari_${Math.abs(tx * 11 + ty * 17) % 4}`];
    }

    if (currentBiomeTheme === 'umbri_labyrinth') {
      // Winding maze corridors
      const cellX = Math.floor(tx / 4);
      const cellY = Math.floor(ty / 4);
      if ((cellX + cellY) % 2 === 0 || Math.abs(tx) <= 1 || Math.abs(ty) <= 1) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      return sprites.tiles[`umbri_${Math.abs(tx * 13 + ty * 19) % 4}`];
    }

    if (currentBiomeTheme === 'terra_grove') {
      // Concentric organic rings
      const d2 = tx * tx + ty * ty;
      if ((d2 >= 25 && d2 <= 49) || (d2 >= 144 && d2 <= 196) || Math.abs(tx) <= 1) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      if (d2 < 25) {
        return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`] || sprites.tiles.flagstone_0;
      }
      return sprites.tiles[`terra_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
    }

    if (currentBiomeTheme === 'aether_archive') {
      // Astral geometric platforms over deep rift chasms
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) {
        return sprites.tiles.flagstone_1 || sprites.tiles.flagstone_0;
      }
      if (Math.abs(tx) % 6 <= 1 && Math.abs(ty) % 6 <= 1) {
        return sprites.tiles[`void_sea_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      return sprites.tiles[`aether_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
    }

    if (['solari', 'umbri', 'terra', 'aether'].includes(currentBiomeTheme)) {
      if (Math.abs(tx) <= 1) return sprites.tiles[`flagstone_${Math.abs(ty) % 2}`] || sprites.tiles.flagstone_0;
      return sprites.tiles[`${currentBiomeTheme}_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.warzone_0 || sprites.tiles.flagstone_0;
    }

    // ==========================================
    // THE NEXUS CONTINENT (MASSIVE OPEN WORLD REALM)
    // ==========================================
    // 1. South Sanctuary River & Tributary Streams
    // River meanders horizontally between ty: 75 and 80 (wy: 1200 - 1280)
    const southRiverY = 77 + Math.round(Math.sin(tx * 0.08) * 2.5);
    const isSouthRiver = Math.abs(ty - southRiverY) <= 1;

    // Northwest Mountain Gorge Stream flowing down through Terra Ironwood Wilds
    const streamX = -65 + Math.round(Math.cos(ty * 0.08) * 4);
    const isNWStream = tx >= streamX - 1 && tx <= streamX + 1 && ty >= -85 && ty <= 20;

    // Bridges crossing rivers
    const isMainSouthBridge = isSouthRiver && Math.abs(tx) <= 3;
    const isWestTimberBridge = isSouthRiver && Math.abs(tx - (-80)) <= 2;
    const isEastTimberBridge = isSouthRiver && Math.abs(tx - 80) <= 2;
    const isNWGorgeBridge = isNWStream && Math.abs(ty - (-35)) <= 2;

    if (isMainSouthBridge || isWestTimberBridge || isEastTimberBridge || isNWGorgeBridge) {
      return sprites.tiles[`bridge_wood_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    }

    if (isSouthRiver || isNWStream) {
      const waterFrame = Math.floor(globalTime * 2.2 + (tx + ty) * 0.25) % 2;
      return sprites.tiles[`river_water_${Math.abs(waterFrame)}`];
    }

    // 2. Whispering Mountain Pass Trail (Cuts through the grand central mountain ridge)
    // Mountain ridge spans ty: 22 to 70 (wy: 352 to 1120)
    const passCurveX = Math.round(Math.sin(ty * 0.07) * 7);
    const isWhisperingPass = ty >= 22 && ty <= 70 && Math.abs(tx - passCurveX) <= 3;
    if (isWhisperingPass) {
      return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    }

    // 3. Imperial Cross-Continental Highways (3 tiles wide, connects Caldera to all regions)
    if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) {
      return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    }

    // 4. Diagonal Arterial Trails to the 4 Faction Outposts & Highlands
    if (Math.abs(Math.abs(tx) - Math.abs(ty)) <= 1 && Math.abs(tx) >= 14 && Math.abs(tx) <= 75) {
      return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
    }

    // 5. South Sanctuary Vale (Peaceful green meadow valley south of the mountain range)
    if (ty >= 70) {
      return sprites.tiles[`sanctuary_grass_${Math.abs(tx * 7 + ty * 13) % 4}`];
    }

    // 6. Granite Mountain Ridge & Whispering Peaks (ty: 22 to 70)
    if (ty >= 22 && ty < 70) {
      // High mountain snow peaks on outer flanks
      if (Math.abs(tx) >= 55 || (Math.abs(tx) >= 28 && ((tx * 3 + ty * 5) % 7 === 0))) {
        return sprites.tiles[`mountain_peak_${Math.abs(tx * 7 + ty * 11) % 4}`];
      }
      return sprites.tiles[`mountain_rock_${Math.abs(tx * 11 + ty * 17) % 4}`];
    }

    // 7. North Forgotten Ruins & Megalith Plateau (ty < -22 and central corridor)
    if (ty <= -22 && Math.abs(tx) <= 26) {
      return sprites.tiles[`flagstone_${Math.abs(tx * 3 + ty * 5) % 2}`] || sprites.tiles.flagstone_0;
    }

    // 8. Central Caldera / Siege Crater (Dark obsidian slate around the Shattered Nexus Shard)
    if (Math.abs(tx) <= 18 && Math.abs(ty) <= 16) {
      return sprites.tiles[`warzone_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
    }

    // 9. Four Regional Wilderness Quadrants
    // Northwest Quadrant: Terra Ironwood Wilds (Lush forest moss & emerald flora)
    if (tx < -14 && ty < -8) {
      return sprites.tiles[`terra_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    }
    // Northeast Quadrant: Umbri Shadow Fens (Abyssal violet mire & fog-shrouded swamp)
    if (tx > 14 && ty < -8) {
      return sprites.tiles[`umbri_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    }
    // Southwest Quadrant: Solari Sun-Canyon (Golden marble, sandstone & scorched mesas)
    if (tx < -14 && ty >= -8 && ty < 70) {
      return sprites.tiles[`solari_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    }
    // Southeast Quadrant: Aether Astral Plateau (Crystalline cosmic indigo platforms)
    if (tx > 14 && ty >= -8 && ty < 70) {
      return sprites.tiles[`aether_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.flagstone_0;
    }

    // Buffer zones: Dark warzone obsidian slate
    return sprites.tiles[`warzone_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.flagstone_0;
  }

  function drawPixelEllipseShadow(cx, cy, rx, ry) {
    ctx.fillStyle = 'rgba(4, 6, 14, 0.55)';
    ctx.fillRect(Math.round(cx - rx), Math.round(cy - ry + 1), Math.round(rx * 2), Math.round(ry * 2 - 2));
    ctx.fillRect(Math.round(cx - rx + 2), Math.round(cy - ry), Math.round(rx * 2 - 4), Math.round(ry * 2));
  }

  function drawPortalMist() {
    if (portalMistTimer <= 0) return;
    const progress = Math.min(1, portalMistTimer / 0.5);
    const alpha = progress * 0.75;
    const cx = viewW / 2;
    const cy = viewH / 2;
    const maxR = Math.hypot(cx, cy);

    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, maxR * 0.28, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(14, 165, 233, 0)');
    grad.addColorStop(0.65, `rgba(56, 189, 248, ${0.35 * alpha})`);
    grad.addColorStop(1, `rgba(2, 132, 199, ${0.75 * alpha})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Drifting edge vapor particles
    ctx.fillStyle = `rgba(186, 230, 253, ${0.45 * alpha})`;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (globalTime * 0.8);
      const r = maxR * 0.78 + Math.sin(globalTime * 3 + i) * 16;
      const vx = cx + Math.cos(angle) * r;
      const vy = cy + Math.sin(angle) * r;
      ctx.fillRect(Math.round(vx - 2), Math.round(vy - 2), 4, 4);
    }
    ctx.restore();
  }

  function drawWorld() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#070b19';
    ctx.fillRect(0, 0, viewW, viewH);

    const camLeft = Math.floor(camera.x - viewW / 2);
    const camTop = Math.floor(camera.y - viewH / 2);

    const startTx = Math.floor(camLeft / TILE_SIZE) - 1;
    const endTx = Math.ceil((camLeft + viewW) / TILE_SIZE) + 1;
    const startTy = Math.floor(camTop / TILE_SIZE) - 1;
    const endTy = Math.ceil((camTop + viewH) / TILE_SIZE) + 1;

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        ctx.drawImage(pickTile(tx, ty), tx * TILE_SIZE - camLeft, ty * TILE_SIZE - camTop);
      }
    }

    // Active Edge Transition Waygate Threshold Beams
    const activeCfg = ROOM_CONFIGS[currentRoomType];
    if (activeCfg && activeCfg.edgeTransitions) {
      const GATE_HW = 72;
      const pulse = 0.5 + 0.5 * Math.sin(globalTime * 3.5);
      ctx.save();
      if (activeCfg.edgeTransitions.north) {
        const lineY = Math.round(-mapBounds.halfH - camTop);
        const x1 = Math.round(-GATE_HW - camLeft);
        const x2 = Math.round(GATE_HW - camLeft);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 + 0.35 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, lineY + 1);
        ctx.lineTo(x2, lineY + 1);
        ctx.stroke();
        ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + 0.1 * pulse})`;
        ctx.fillRect(x1, lineY + 1, x2 - x1, 14);
      }
      if (activeCfg.edgeTransitions.south) {
        const lineY = Math.round(mapBounds.halfH - camTop);
        const x1 = Math.round(-GATE_HW - camLeft);
        const x2 = Math.round(GATE_HW - camLeft);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 + 0.35 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, lineY - 1);
        ctx.lineTo(x2, lineY - 1);
        ctx.stroke();
        ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + 0.1 * pulse})`;
        ctx.fillRect(x1, lineY - 15, x2 - x1, 14);
      }
      if (activeCfg.edgeTransitions.east) {
        const lineX = Math.round(mapBounds.halfW - camLeft);
        const y1 = Math.round(-GATE_HW - camTop);
        const y2 = Math.round(GATE_HW - camTop);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 + 0.35 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lineX - 1, y1);
        ctx.lineTo(lineX - 1, y2);
        ctx.stroke();
        ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + 0.1 * pulse})`;
        ctx.fillRect(lineX - 15, y1, 14, y2 - y1);
      }
      if (activeCfg.edgeTransitions.west) {
        const lineX = Math.round(-mapBounds.halfW - camLeft);
        const y1 = Math.round(-GATE_HW - camTop);
        const y2 = Math.round(GATE_HW - camTop);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 + 0.35 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lineX + 1, y1);
        ctx.lineTo(lineX + 1, y2);
        ctx.stroke();
        ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + 0.1 * pulse})`;
        ctx.fillRect(lineX + 1, y1, 14, y2 - y1);
      }
      ctx.restore();
    }

    // Order Banner +1 Power Aura Rings
    for (const b of worldBanners) {
      const bx = Math.round(b.x - camLeft);
      const by = Math.round(b.y - camTop);
      ctx.strokeStyle = b.color || '#facc15';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(bx, by, 56, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ground Zones (Consecration, Nightfall Plague, Briar Snare, Gravity Well, Frost Ring, Shockwave)
    for (const gz of groundZones) {
      const gx = Math.round(gz.x - camLeft);
      const gy = Math.round(gz.y - camTop);
      if (gz.type === 'consecration') {
        const r = Math.round(gz.radius);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx - r, gy - Math.round(r * 0.65), r * 2, Math.round(r * 1.3));
        ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
        ctx.fillRect(gx - r + 2, gy - Math.round(r * 0.65) + 2, r * 2 - 4, Math.round(r * 1.3) - 4);
      } else if (gz.type === 'plague') {
        const r = Math.round(gz.radius);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, Math.round(r * 0.65), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (gz.type === 'briar') {
        const r = Math.round(gz.radius);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, Math.round(r * 0.65), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (gz.type === 'gravity') {
        const r = Math.round(gz.radius * (0.88 + Math.sin(globalTime * 5) * 0.08));
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, Math.round(r * 0.65), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (gz.type === 'frost_ring' || gz.type === 'shockwave') {
        const progW = gz.age / Math.max(0.01, gz.maxAge);
        const r = Math.round(gz.radius * progW);
        ctx.strokeStyle = gz.type === 'frost_ring' ? '#7dd3fc' : (gz.color || '#fde047');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(gx, gy, Math.max(4, r), Math.max(3, Math.round(r * 0.68)), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (gz.type === 'telegraph') {
        const r = Math.round(gz.radius || 70);
        const ry = Math.round(r * 0.65);
        const fillProg = Math.min(1, (gz.age || 0) / Math.max(0.1, gz.maxAge || 1.5));
        const color = gz.color || '#ef4444';

        // 1. Hazard floor aura
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Filling charge disk
        const cr = Math.max(2, Math.round(r * fillProg));
        const cry = Math.max(2, Math.round(ry * fillProg));
        ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, cr, cry, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Dashed boundary ring
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Countdown warning label
        const remain = Math.max(0, (gz.maxAge || 1.5) - (gz.age || 0));
        ctx.font = '700 10.5px Outfit, system-ui, sans-serif';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ ${(remain).toFixed(1)}s`, gx, gy - ry - 4);
        if (gz.label) {
          ctx.font = '800 9.5px Cinzel, serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(gz.label, gx, gy + 3);
        }
      }
    }

    // Crisp steady Target Reticle (no flashing jitter)
    if (currentTarget && !currentTarget.isDying) {
      const tx = Math.round(currentTarget.x - camLeft);
      const ty = Math.round(currentTarget.y - camTop);
      const rr = currentTarget.radius || 14;
      const h = Math.round(rr * 0.6);
      ctx.fillStyle = currentTarget.type === 'node' ? '#e879f9' : '#38bdf8';
      ctx.fillRect(tx - rr, ty - h, 5, 2);
      ctx.fillRect(tx - rr, ty - h, 2, 4);
      ctx.fillRect(tx + rr - 5, ty - h, 5, 2);
      ctx.fillRect(tx + rr - 2, ty - h, 2, 4);
      ctx.fillRect(tx - rr, ty + h - 2, 5, 2);
      ctx.fillRect(tx - rr, ty + h - 4, 2, 4);
      ctx.fillRect(tx + rr - 5, ty + h - 2, 5, 2);
      ctx.fillRect(tx + rr - 2, ty + h - 4, 2, 4);
    }

    const renderables = [];

    for (const pr of props) {
      renderables.push({
        y: pr.y,
        draw: () => {
          const sx = Math.round(pr.x - camLeft);
          const sy = Math.round(pr.y - camTop);
          let img = sprites.props.pillar;
          let shadowRx = 7;
          let shadowRy = 3;

          if (pr.type === 'brazier') {
            img = sprites.props.brazier[Math.floor(globalTime * 1.8 + Math.abs(pr.x)) % 2];
            shadowRx = 6; shadowRy = 3;
          } else if (pr.type === 'monument') {
            img = sprites.props.monument || sprites.props.pillar;
            shadowRx = 9; shadowRy = 3;
          } else if (pr.type === 'crystalPillar') {
            img = (sprites.props.crystalPillar && sprites.props.crystalPillar[Math.floor(globalTime * 2.0 + Math.abs(pr.x)) % sprites.props.crystalPillar.length]) || sprites.props.pillar;
            shadowRx = 8; shadowRy = 3;
          } else if (pr.type === 'pineTree') {
            img = sprites.props.pineTree || sprites.props.pillar;
            shadowRx = 9; shadowRy = 4;
          } else if (pr.type === 'ancientOak') {
            img = sprites.props.ancientOak || sprites.props.pillar;
            shadowRx = 14; shadowRy = 5;
          } else if (pr.type === 'mountainCrag') {
            img = sprites.props.mountainCrag || sprites.props.pillar;
            shadowRx = 11; shadowRy = 4;
          } else if (pr.type === 'campfire') {
            img = (sprites.props.campfire && sprites.props.campfire[Math.floor(globalTime * 3.5 + Math.abs(pr.x)) % sprites.props.campfire.length]) || sprites.props.brazier[0];
            shadowRx = 7; shadowRy = 3;
          } else if (pr.type === 'ruinedArch') {
            img = sprites.props.ruinedArch || sprites.props.pillar;
            shadowRx = 13; shadowRy = 4;
          } else if (pr.type === 'woodenSign') {
            img = sprites.props.woodenSign || sprites.props.pillar;
            shadowRx = 5; shadowRy = 2;
          }

          if (img) {
            drawPixelEllipseShadow(sx, sy, shadowRx, shadowRy);
            ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 2);
            if (pr.label) {
              const dist = Math.hypot(player.x - pr.x, player.y - pr.y);
              if (dist < 220) {
                const alpha = Math.min(1, Math.max(0, (220 - dist) / 60));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = '700 11px "Outfit", system-ui, sans-serif';
                ctx.textAlign = 'center';
                const tw = Math.ceil(ctx.measureText(pr.label).width);
                const px = Math.round(sx - (tw + 12) / 2);
                const py = sy - img.height - 15;
                ctx.fillStyle = 'rgba(7, 10, 20, 0.92)';
                ctx.fillRect(px, py, tw + 12, 16);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, tw + 12, 16);
                ctx.fillStyle = '#f0f9ff';
                ctx.fillText(pr.label, sx, py + 12);
                ctx.restore();
              }
            }
          }
        },
      });
    }

    for (const b of worldBanners) {
      renderables.push({
        y: b.y,
        draw: () => {
          const sx = Math.round(b.x - camLeft);
          const sy = Math.round(b.y - camTop);
          const frames = getOrderBannerSprites(b.color || '#facc15');
          const img = frames[Math.floor(globalTime * 3.5) % frames.length];
          drawPixelEllipseShadow(sx, sy, 6, 3);
          ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 2);

          // Clear, High-Contrast Order Banner Plaque
          ctx.font = '700 11.5px "Outfit", system-ui, sans-serif';
          ctx.textAlign = 'center';
          const bannerTag = `<${b.orderTag || 'STANDARD'}>`;
          const bw = Math.ceil(ctx.measureText(bannerTag).width);
          const bpx = Math.round(sx - (bw + 8) / 2);
          const bpy = sy - img.height - 10;
          ctx.fillStyle = 'rgba(5, 7, 15, 0.88)';
          ctx.fillRect(bpx, bpy, bw + 8, 14);
          ctx.fillStyle = b.color || '#fde047';
          ctx.fillRect(bpx, bpy + 13, bw + 8, 1.5);
          ctx.strokeStyle = '#05070f';
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';
          ctx.strokeText(bannerTag, sx, bpy + 11);
          ctx.fillStyle = b.color || '#fde047';
          ctx.fillText(bannerTag, sx, bpy + 11);
        },
      });
    }

    for (const npc of npcs) {
      renderables.push({
        y: npc.y,
        draw: () => {
          const sx = Math.round(npc.x - camLeft);
          const sy = Math.round(npc.y - camTop);
          const sprList = (npc.spriteKey && sprites[npc.spriteKey]) || sprites.heraldNpc;
          const img = sprList[Math.floor(globalTime * 2.2) % sprList.length];
          drawPixelEllipseShadow(sx, sy, 9, 3);
          ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 3);

          // Animated MMORPG quest marker above head (Golden !, Silver ?, Golden ?, or none)
          const qStatus = getNpcQuestStatus(npc);
          if (qStatus !== 'none') {
            const isFinished = qStatus === 'finished';
            const isOngoing = qStatus === 'ongoing';
            const bounce = Math.floor(Math.sin(globalTime * (isFinished ? 5.2 : 3.2)) * (isFinished ? 2.5 : 1.8));
            const qy = sy - img.height - 24 + bounce;

            if (isFinished) {
              // Radiant pulsing golden halo for finished quest ready to turn in
              const pulse = Math.sin(globalTime * 6) * 2;
              const rad = 8 + pulse;
              const grad = ctx.createRadialGradient(sx, qy, 2, sx, qy, rad);
              grad.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
              grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
              grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(sx, qy, rad, 0, Math.PI * 2);
              ctx.fill();
            }

            // High-contrast, sharp typography for overhead quest glyph
            ctx.save();
            ctx.font = '900 15px "Cinzel", "Outfit", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';

            const symbol = (isFinished || isOngoing) ? '?' : '!';
            const fillColor = isFinished ? '#fef08a' : (isOngoing ? '#cbd5e1' : '#fde047');
            const strokeColor = isFinished ? '#78350f' : (isOngoing ? '#0f172a' : '#05070f');

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 4;
            ctx.strokeText(symbol, sx, qy);
            ctx.fillStyle = fillColor;
            ctx.fillText(symbol, sx, qy);
            ctx.restore();
          }

          // Overhead High-Contrast NPC Badge
          ctx.font = '700 12px "Outfit", system-ui, sans-serif';
          ctx.textAlign = 'center';
          const npcName = npc.name || 'Herald Lyra';
          const nw = Math.ceil(ctx.measureText(npcName).width);
          const npx = Math.round(sx - (nw + 10) / 2);
          const npy = sy - img.height - 11;
          ctx.fillStyle = 'rgba(5, 7, 18, 0.92)';
          ctx.fillRect(npx, npy - 1, nw + 10, 15);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(npx, npy + 13, nw + 10, 1.5);
          ctx.strokeStyle = '#05070f';
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';
          ctx.strokeText(npcName, sx, npy + 11);
          ctx.fillStyle = '#fde047';
          ctx.fillText(npcName, sx, npy + 11);
        },
      });
    }

    for (const ai of afterimages) {
      renderables.push({
        y: ai.y - 1,
        draw: () => {
          const heroSet = getCharacterSprites(localProfile.faction, localProfile.classId, localProfile.equipment);
          const img = (heroSet[ai.dir || 'up'] || heroSet.down)[1];
          ctx.save();
          ctx.globalAlpha = Math.max(0, 0.45 * (1 - ai.age / ai.maxAge));
          ctx.drawImage(img, Math.round(ai.x - camLeft - img.width / 2), Math.round(ai.y - camTop - img.height + 2));
          ctx.restore();
        },
      });
    }

    for (const al of allies) {
      renderables.push({
        y: al.y,
        draw: () => {
          const frames = sprites[al.spriteKey] || sprites.allyPaladin;
          const img = frames[Math.floor(globalTime * 3.5) % frames.length];
          const sx = Math.round(al.x - camLeft);
          const sy = Math.round(al.y - camTop);
          drawPixelEllipseShadow(sx, sy, 8, 3);
          ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 2);
        },
      });
    }

    for (const l of lootDrops) {
      renderables.push({
        y: l.y,
        draw: () => drawLootShard(l, Math.round(l.x - camLeft), Math.round(l.y - camTop)),
      });
    }

    for (const ent of entities) {
      renderables.push({
        y: ent.y,
        draw: () => {
          const sx = Math.round(ent.x - camLeft);
          const sy = Math.round(ent.y - camTop);
          let img = null;
          if (ent.type === 'node') {
            img = ent.charges > 0 ? sprites.node[Math.floor(globalTime * 2.5) % sprites.node.length] : sprites.nodeEmpty;
          } else if (ent.type === 'shrine') {
            const list = sprites.props.crystalPillar || sprites.node;
            img = list[Math.floor(globalTime * 3.0) % list.length];
          } else if (ent.type === 'dummy') {
            img = sprites.dummy[ent.hitFlash > 0 ? 1 : 0];
          } else {
            const arr = sprites[ent.spriteKey] || sprites.voidStalker;
            img = arr[Math.floor(globalTime * (ent.type === 'portal' ? 1.8 : 3.5)) % arr.length];
          }
          if (!img) return;
          drawPixelEllipseShadow(sx, sy, Math.round(img.width * 0.36), 4);

          const isEnraged = Boolean(ent.enraged || ((ent.hp / (ent.maxHp || 1)) <= 0.35));
          if (ent.isBoss && isEnraged && !ent.isDying) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(sx, sy, Math.round(img.width * 0.46), 5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          const shakeX = ent.hitFlash > 0 && ent.type !== 'dummy' ? 1 : 0;

          ctx.save();
          if (ent.isDying) {
            const sc = Math.max(0.08, 1 - (ent.deathAge || 0) / 0.65);
            ctx.globalAlpha = sc;
            ctx.translate(sx, sy - img.height / 2);
            ctx.scale(sc, sc);
            ctx.rotate((ent.deathAge || 0) * 3.5);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
          } else {
            if (ent.facingDir === -1) {
              ctx.save();
              ctx.translate(sx, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(img, Math.round(-img.width / 2), sy - img.height + 3);
              ctx.restore();
            } else {
              ctx.drawImage(img, Math.round(sx + shakeX - img.width / 2), sy - img.height + 3);
            }
            if (ent.frozen) {
              ctx.strokeStyle = '#7dd3fc';
              ctx.strokeRect(sx - 9, sy - img.height + 4, 18, img.height - 2);
            }
          }
          ctx.restore();

          // Portal destination badge & interact prompt
          if (ent.type === 'portal') {
            ctx.font = '700 12px "Outfit", system-ui, sans-serif';
            ctx.textAlign = 'center';
            const nameStr = ent.name;
            const subStr = ent.sub || 'Step In [W]';
            const nw = Math.ceil(ctx.measureText(nameStr).width);
            const badgeW = Math.max(nw + 14, 70);
            const badgeH = 19;
            const bx = Math.round(sx - badgeW / 2);
            const by = Math.round(sy - img.height - 19);

            // Dark plaque with cyan cybernetic border
            ctx.fillStyle = 'rgba(5, 9, 24, 0.92)';
            ctx.fillRect(bx, by, badgeW, badgeH);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(bx, by, badgeW, 1);
            ctx.fillRect(bx, by + badgeH - 1, badgeW, 1);
            ctx.fillRect(bx, by, 1, badgeH);
            ctx.fillRect(bx + badgeW - 1, by, 1, badgeH);

            // Nameplate text with clean crisp stroke
            ctx.strokeStyle = '#05070f';
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.strokeText(nameStr, sx, by + 10);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillText(nameStr, sx, by + 10);

            // Subtitle prompt
            ctx.font = '600 10.5px "Outfit", system-ui, sans-serif';
            ctx.strokeStyle = '#05070f';
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.strokeText(subStr, sx, by + 17);
            ctx.fillStyle = '#fde047';
            ctx.fillText(subStr, sx, by + 17);
          } else if (!ent.isDying) {
            const val = ent.hp ?? ent.charges ?? 0;
            const max = ent.maxHp ?? ent.maxCharges ?? 1;
            const isBossOrCore = ent.isBoss || ent.type === 'nexus' || ent.type === 'ally_nexus' || ent.type === 'outpost_nexus' || ent.type === 'siege_shard';
            const bw = isBossOrCore ? 34 : 22;
            const bx = Math.round(sx - bw / 2);
            const by = Math.round(sy - img.height - 5);

            // Dark border & healthbar fill
            ctx.fillStyle = '#070a12';
            ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(bx, by, bw, 3);
            ctx.fillStyle =
              ent.type === 'node' ? '#c084fc' :
              ent.type === 'siege_shard' ? '#fde047' :
              ent.type === 'outpost_nexus' ? (FACTIONS_META[ent.faction]?.color || '#38bdf8') :
              ent.type === 'ally_nexus' ? '#38bdf8' :
              '#ef4444';
            ctx.fillRect(bx, by, Math.round((val / max) * bw), 3);

            // Overhead entity label for Bosses, Objectives, Targeted entity, Dummy, or nearby entities
            const isTargeted = currentTarget && currentTarget.id === ent.id;
            const dPlayer = Math.hypot(ent.x - player.x, ent.y - player.y);
            const showName = isBossOrCore || isTargeted || dPlayer < 95 || ent.type === 'dummy' || (ent.type === 'node' && dPlayer < 120);

            if (showName) {
              ctx.font = isBossOrCore ? '700 12px "Outfit", system-ui, sans-serif' : '600 10.5px "Outfit", system-ui, sans-serif';
              ctx.textAlign = 'center';
              const label = ent.type === 'dummy'
                ? 'Training Dummy'
                : ent.type === 'shrine'
                  ? (ent.charges > 0 ? `${ent.name} [E]` : `${ent.name} (Depleted)`)
                  : ent.type === 'node'
                    ? (ent.charges > 0 ? `${ent.name} [E]` : 'Depleted Node')
                    : ent.isBoss
                      ? (isEnraged ? `★ ${ent.name} 🔥 ENRAGED` : `★ ${ent.name}`)
                      : ent.name;

              const lw = Math.ceil(ctx.measureText(label).width);
              const lpx = Math.round(sx - (lw + 8) / 2);
              const lpy = Math.round(by - (isBossOrCore ? 14 : 12));
              const badgeColor = isBossOrCore ? (isEnraged ? '#ef4444' : '#facc15') : isTargeted ? '#38bdf8' : ent.type === 'shrine' ? '#facc15' : ent.type === 'node' ? '#c084fc' : '#ffffff';

              ctx.fillStyle = 'rgba(5, 7, 16, 0.88)';
              ctx.fillRect(lpx, lpy, lw + 8, isBossOrCore ? 14 : 12);
              if (isBossOrCore || isTargeted) {
                ctx.fillStyle = badgeColor;
                ctx.fillRect(lpx, lpy + (isBossOrCore ? 13 : 11), lw + 8, 1.5);
              }

              ctx.strokeStyle = '#05070f';
              ctx.lineWidth = 2.5;
              ctx.lineJoin = 'round';
              const textY = lpy + (isBossOrCore ? 10.5 : 9);
              ctx.strokeText(label, sx, textY);
              ctx.fillStyle = badgeColor;
              ctx.fillText(label, sx, textY);
            }
          }
        },
      });
    }

    // Remote Live Players with Real-Time 24x26 Paperdoll Sprites!
    for (const rp of remotePlayers.values()) {
      if (rp.isDead) continue;
      const inSquad = Boolean(currentParty && currentParty.members?.some((m) => m.id === rp.id));
      const hostile = isRemoteHostile(rp);
      if (rp.stealthed && hostile) continue; // Hostile Umbri stealth is hidden!

      renderables.push({
        y: rp.renderY,
        draw: () => {
          const sx = Math.round(rp.renderX - camLeft);
          const sy = Math.round(rp.renderY - camTop);

          if (inSquad) {
            ctx.strokeStyle = '#4ade80';
            ctx.strokeRect(sx - 9, sy - 4, 18, 8);
          } else if (hostile) {
            ctx.strokeStyle = '#ef4444';
            ctx.strokeRect(sx - 9, sy - 4, 18, 8);
          }
          if (rp.zenith) {
            ctx.strokeStyle = '#fde047';
            ctx.strokeRect(sx - 11, sy - 5, 22, 10);
          }
          if (rp.thornbark) {
            ctx.strokeStyle = '#22c55e';
            ctx.strokeRect(sx - 10, sy - 16, 20, 16);
          }

          drawPixelEllipseShadow(sx, sy, 8, 3);
          const heroSet = getCharacterSprites(rp.faction, rp.classId, rp.equipment);
          const frames = heroSet[rp.dir || 'down'] || heroSet.down;
          const img = frames[rp.isMoving ? (Math.floor(rp.walkTimer || 0) % 2) + 1 : 0];

          ctx.save();
          if (rp.stealthed) ctx.globalAlpha = 0.45;
          ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - (rp.z || 0) - img.height + 3));
          if (rp.frozen) {
            ctx.strokeStyle = '#7dd3fc';
            ctx.strokeRect(sx - 9, sy - img.height + 4, 18, img.height - 2);
          }
          ctx.restore();

          if (rp.shield > 0) {
            for (let k = 0; k < 4; k++) {
              const ang = globalTime * 4.5 + (k * Math.PI) / 2;
              const ox = Math.round(sx + Math.cos(ang) * 14);
              const oy = Math.round(sy - (rp.z || 0) - 10 + Math.sin(ang) * 8);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(ox - 2, oy - 2, 4, 4);
            }
          }

          drawPixelNameplateAndBubbles(ctx, {
            sx,
            topY: sy - (rp.z || 0) - img.height + 2,
            name: rp.name,
            faction: rp.faction,
            orderTag: rp.orderTag,
            orderColor: rp.orderColor,
            level: rp.level,
            hp: rp.hp,
            maxHp: rp.maxHp,
            shield: rp.shield,
            isSelf: false,
            isParty: inSquad,
            isHostile: hostile,
            tcgLinked: rp.tcgLinked,
            bubble: rp.bubble,
            emote: rp.emote,
            globalTime,
          });
        },
      });
    }

    // Local Hero with Real-Time 24x26 Paperdoll Sprite + Faction States!
    if (!player.isDead) {
      renderables.push({
        y: player.y,
        draw: () => {
          const sx = Math.round(player.x - camLeft);
          const sy = Math.round(player.y - camTop);
          drawPixelEllipseShadow(sx, sy, Math.max(4, 8 - Math.floor(player.z * 0.15)), 3);

          const heroSet = getCharacterSprites(localProfile.faction, localProfile.classId, localProfile.equipment);
          const frames = heroSet[player.dir] || heroSet.down;
          const img = frames[player.isMoving ? (Math.floor(player.walkTimer) % 2) + 1 : 0];

          if (isCasting || player.zenith) {
            ctx.strokeStyle = '#fde047';
            ctx.strokeRect(sx - 12, sy - 6, 24, 12);
          }
          if (player.thornbark) {
            ctx.strokeStyle = '#4ade80';
            ctx.strokeRect(sx - 11, sy - 18, 22, 18);
          }

          ctx.save();
          if (player.stealthed) ctx.globalAlpha = 0.48;
          ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - player.z - img.height + 3));
          if (player.frozen) {
            ctx.strokeStyle = '#7dd3fc';
            ctx.strokeRect(sx - 9, sy - player.z - img.height + 4, 18, img.height - 2);
          }
          ctx.restore();

          if (player.shield > 0) {
            for (let k = 0; k < 4; k++) {
              const ang = globalTime * 4.5 + (k * Math.PI) / 2;
              const ox = Math.round(sx + Math.cos(ang) * 14);
              const oy = Math.round(sy - player.z - 10 + Math.sin(ang) * 8);
              ctx.fillStyle = '#070a12';
              ctx.fillRect(ox - 3, oy - 3, 6, 6);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(ox - 2, oy - 2, 4, 4);
              ctx.fillStyle = '#fef047';
              ctx.fillRect(ox - 1, oy - 1, 2, 2);
            }
          }

          drawPixelNameplateAndBubbles(ctx, {
            sx,
            topY: sy - player.z - img.height + 2,
            name: localProfile.displayName,
            faction: localProfile.faction,
            orderTag: localProfile.orderTag,
            orderColor: localProfile.orderColor,
            level: prog.level,
            isSelf: true,
            tcgLinked: localProfile.tcgLinked,
            bubble: player.bubble,
            emote: player.emote,
            globalTime,
          });
        },
      });
    }

    renderables.sort((a, b) => a.y - b.y);
    for (const r of renderables) r.draw();

    for (const sa of slashArcs) {
      const sx = Math.round(sa.x - camLeft);
      const sy = Math.round(sa.y - camTop);
      const rad = 18 + (sa.age / sa.maxAge) * 8;
      for (let step = -4; step <= 4; step++) {
        const a = sa.angle + step * 0.2;
        ctx.fillStyle = Math.abs(step) <= 1 ? '#ffffff' : (sa.color || '#facc15');
        ctx.fillRect(Math.round(sx + Math.cos(a) * rad) - 2, Math.round(sy + Math.sin(a) * rad * 0.8) - 2, 4, 4);
      }
    }

    for (const sb of skyBeams) {
      const sx = Math.round(sb.x - camLeft);
      const sy = Math.round(sb.y - camTop);
      const w = Math.max(2, Math.round(16 * (1 - sb.age / sb.maxAge)));
      ctx.fillStyle = sb.color === '#38bdf8' ? 'rgba(56, 189, 248, 0.42)' : 'rgba(250, 204, 21, 0.42)';
      ctx.fillRect(Math.round(sx - w), 0, w * 2, sy);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(sx - w / 2), 0, w, sy);
    }

    // All 4 Faction Projectile Visuals
    for (const p of projectiles) {
      const sx = Math.round(p.x - camLeft);
      const sy = Math.round(p.y - camTop);
      if (p.type === 'hammer') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-1, -5, 2, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -6, 10, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -5, 8, 2);
        ctx.restore();
      } else if (p.type === 'boulder') {
        ctx.fillStyle = '#070a12';
        ctx.fillRect(sx - 5, sy - 5, 10, 10);
        ctx.fillStyle = '#78716c';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx - 2, sy - 2, 4, 3);
      } else if (p.type === 'void_orb') {
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      } else {
        ctx.fillStyle = '#070a12';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = p.color || '#38bdf8';
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }
    }

    for (const pt of particles) {
      const sx = Math.round(pt.x - camLeft);
      const sy = Math.round(pt.y - pt.z - camTop);
      if (pt.type === 'smoke') {
        const prog = Math.min(1, pt.age / pt.maxAge);
        const alpha = Math.max(0, (1 - prog) * (prog < 0.12 ? prog / 0.12 : 1) * 0.88);
        const scale = 0.85 + prog * 1.55;
        const r = Math.max(2, Math.round((pt.baseSize || 5) * scale));

        ctx.save();
        ctx.globalAlpha = alpha;
        // Outer dark perimeter halo
        ctx.fillStyle = pt.darkColor || '#1e0836';
        ctx.beginPath();
        ctx.arc(sx, sy, r + 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Main vibrant purple smoke puff cloud
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        // Starlight lavender highlight core (offset top-left)
        if (r >= 3.5) {
          ctx.fillStyle = pt.highlightColor || '#e9d5ff';
          ctx.beginPath();
          ctx.arc(sx - r * 0.28, sy - r * 0.28, Math.max(1, r * 0.42), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        const prog = Math.min(1, pt.age / pt.maxAge);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - prog * 0.6);
        ctx.fillStyle = '#070a12';
        ctx.fillRect(sx - 1, sy - 1, pt.size + 2, pt.size + 2);
        ctx.fillStyle = pt.color;
        ctx.fillRect(sx, sy, pt.size, pt.size);
        ctx.restore();
      }
    }

    if (portalMistTimer > 0) {
      drawPortalMist();
    }
  }

  function getOpenWorldSubRegion(px, py) {
    if (py <= -1550 && Math.abs(px) <= 120) return 'RUINS WAYGATE PASS';
    if (py >= 1100) return 'SANCTUARY MEADOW VALE';
    if (py >= 350 && py < 1100) {
      if (Math.abs(px) <= 220) return 'WHISPERING MOUNTAIN PASS';
      if (px < -220) return 'SOLARI SUN-CANYON';
      return 'AETHER ASTRAL PLATEAU';
    }
    if (Math.abs(px) <= 280 && Math.abs(py) <= 260) return 'THE NEXUS CALDERA';
    if (py <= -350 && Math.abs(px) <= 380) return 'FORGOTTEN RUINS PLATEAU';
    if (px < -260 && py < -100) return 'TERRA IRONWOOD WILDS';
    if (px > 260 && py < -100) return 'UMBRI SHADOW FENS';
    if (px < -260) return 'SOLARI SUN-CANYON';
    if (px > 260) return 'AETHER ASTRAL PLATEAU';
    return 'IMPERIAL HIGHWAY';
  }

  function renderMinimap() {
    mmCtx.imageSmoothingEnabled = false;
    const mw = minimapCanvas.width || 168;
    const mh = minimapCanvas.height || 130;
    mmCtx.fillStyle = '#070b18';
    mmCtx.fillRect(0, 0, mw, mh);

    const isContinent = mapBounds.halfW >= 1000;
    const cx = mw / 2;
    const cy = mh / 2;
    const scale = isContinent ? 0.026 : Math.min(0.18, (mw - 16) / (mapBounds.halfW * 2));

    // Real-Time Continental Sub-Region Banner Update
    if (currentRoomType === ROOM_TYPES.NEXUS_WARZONE) {
      const sub = getOpenWorldSubRegion(player.x, player.y);
      const zoneTitle = document.getElementById('minimap-zone-title');
      const zoneLabel = document.getElementById('zone-label');
      if (zoneTitle) zoneTitle.innerText = `TORMENT REALM • ${sub}`;
      if (zoneLabel) zoneLabel.innerText = sub;
    }

    // Draw continent geographic zones on minimap
    if (isContinent) {
      // NW Terra Wilds
      mmCtx.fillStyle = 'rgba(34, 197, 94, 0.14)';
      mmCtx.fillRect(Math.round(cx + (-mapBounds.halfW - player.x) * scale), Math.round(cy + (-mapBounds.halfH - player.y) * scale), Math.round((mapBounds.halfW - 300) * scale), Math.round((mapBounds.halfH - 200) * scale));

      // NE Umbri Fens
      mmCtx.fillStyle = 'rgba(168, 85, 247, 0.14)';
      mmCtx.fillRect(Math.round(cx + (300 - player.x) * scale), Math.round(cy + (-mapBounds.halfH - player.y) * scale), Math.round((mapBounds.halfW - 300) * scale), Math.round((mapBounds.halfH - 200) * scale));

      // SW Solari Canyon
      mmCtx.fillStyle = 'rgba(234, 179, 8, 0.14)';
      mmCtx.fillRect(Math.round(cx + (-mapBounds.halfW - player.x) * scale), Math.round(cy + (-100 - player.y) * scale), Math.round((mapBounds.halfW - 300) * scale), Math.round(1200 * scale));

      // SE Aether Plateau
      mmCtx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      mmCtx.fillRect(Math.round(cx + (300 - player.x) * scale), Math.round(cy + (-100 - player.y) * scale), Math.round((mapBounds.halfW - 300) * scale), Math.round(1200 * scale));

      // North Forgotten Ruins Plateau
      mmCtx.fillStyle = 'rgba(148, 163, 184, 0.18)';
      mmCtx.fillRect(Math.round(cx + (-380 - player.x) * scale), Math.round(cy + (-mapBounds.halfH - player.y) * scale), Math.round(760 * scale), Math.round(1400 * scale));

      // Central Mountain Ridge (Granite Crags & Whispering Pass)
      mmCtx.fillStyle = 'rgba(71, 85, 105, 0.32)';
      mmCtx.fillRect(Math.round(cx + (-mapBounds.halfW - player.x) * scale), Math.round(cy + (350 - player.y) * scale), Math.round(mapBounds.halfW * 2 * scale), Math.round(750 * scale));

      // Whispering Pass Opening in Mountains
      mmCtx.fillStyle = 'rgba(203, 213, 225, 0.28)';
      mmCtx.fillRect(Math.round(cx + (-140 - player.x) * scale), Math.round(cy + (350 - player.y) * scale), Math.round(280 * scale), Math.round(750 * scale));

      // South Sanctuary Vale (Meadow Basin)
      mmCtx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      mmCtx.fillRect(Math.round(cx + (-mapBounds.halfW - player.x) * scale), Math.round(cy + (1100 - player.y) * scale), Math.round(mapBounds.halfW * 2 * scale), Math.round((mapBounds.halfH - 1100) * scale));

      // South River Blue Shimmer Line
      mmCtx.fillStyle = 'rgba(2, 132, 199, 0.6)';
      mmCtx.fillRect(Math.round(cx + (-mapBounds.halfW - player.x) * scale), Math.round(cy + (1230 - player.y) * scale), Math.round(mapBounds.halfW * 2 * scale), Math.max(2, Math.round(40 * scale)));

      // Imperial Highway Roads on Minimap
      mmCtx.fillStyle = 'rgba(226, 232, 240, 0.35)';
      mmCtx.fillRect(Math.round(cx + (0 - player.x) * scale) - 1, 0, 3, mh);
      mmCtx.fillRect(0, Math.round(cy + (0 - player.y) * scale) - 1, mw, 3);
    } else {
      mmCtx.fillStyle = '#111c33';
      for (let gx = 16; gx < mw; gx += 16) {
        mmCtx.fillRect(gx, 0, 1, mh);
      }
      for (let gy = 16; gy < mh; gy += 16) {
        mmCtx.fillRect(0, gy, mw, 1);
      }
    }

    mmCtx.strokeStyle = '#1e3a8a';
    mmCtx.strokeRect(
      Math.round(cx + (-mapBounds.halfW - player.x) * scale),
      Math.round(cy + (-mapBounds.halfH - player.y) * scale),
      Math.round(mapBounds.halfW * 2 * scale),
      Math.round(mapBounds.halfH * 2 * scale)
    );

    for (const b of worldBanners) {
      mmCtx.fillStyle = b.color || '#fde047';
      mmCtx.fillRect(Math.round(cx + (b.x - player.x) * scale) - 2, Math.round(cy + (b.y - player.y) * scale) - 2, 4, 4);
    }

    for (const e of entities) {
      if (e.isDying) continue;
      const ex = Math.round(cx + (e.x - player.x) * scale);
      const ey = Math.round(cy + (e.y - player.y) * scale);
      if (ex < 2 || ex > mw - 4 || ey < 2 || ey > mh - 4) continue;
      if (e.type === 'shrine') {
        mmCtx.fillStyle = e.affinity === 'solari' ? '#facc15' : e.affinity === 'umbri' ? '#c084fc' : e.affinity === 'terra' ? '#4ade80' : '#38bdf8';
        mmCtx.beginPath();
        mmCtx.moveTo(ex, ey - 4);
        mmCtx.lineTo(ex + 4, ey);
        mmCtx.lineTo(ex, ey + 4);
        mmCtx.lineTo(ex - 4, ey);
        mmCtx.closePath();
        mmCtx.fill();
        continue;
      }
      mmCtx.fillStyle =
        e.type === 'siege_shard' ? '#fde047' :
        e.type === 'outpost_nexus' ? (FACTIONS_META[e.faction]?.color || '#38bdf8') :
        e.type === 'ally_nexus' ? '#3b82f6' :
        e.type === 'node' ? '#c084fc' :
        e.type === 'portal' ? '#7dd3fc' :
        e.isBoss ? '#facc15' :
        '#ef4444';
      const sz = e.isBoss || e.type === 'nexus' || e.type === 'outpost_nexus' || e.type === 'siege_shard' ? (isContinent ? 5 : 6) : (isContinent ? 3 : 4);
      mmCtx.fillRect(ex - (sz >> 1), ey - (sz >> 1), sz, sz);
    }

    for (const rp of remotePlayers.values()) {
      if (rp.isDead || (rp.stealthed && isRemoteHostile(rp))) continue;
      const rx = Math.round(cx + (rp.renderX - player.x) * scale);
      const ry = Math.round(cy + (rp.renderY - player.y) * scale);
      if (rx < 2 || rx > mw - 4 || ry < 2 || ry > mh - 4) continue;
      const inSquad = Boolean(currentParty && currentParty.members?.some((m) => m.id === rp.id));
      mmCtx.fillStyle = inSquad ? '#4ade80' : isRemoteHostile(rp) ? '#fb923c' : '#38bdf8';
      mmCtx.fillRect(rx - 2, ry - 2, 4, 4);
    }

    // Local Player Blip (Glowing Gold + White Core)
    mmCtx.fillStyle = '#facc15';
    mmCtx.fillRect(cx - 2, cy - 2, 5, 5);
    mmCtx.fillStyle = '#ffffff';
    mmCtx.fillRect(cx - 1, cy - 1, 3, 3);
  }

  loadQuestState();
  buildOfflineZone(ROOM_TYPES.SANCTUARY_HUB);
  refreshHeroPortrait();
  updatePlayerUI();
  updateActionBarBadges();
  renderKeybindUI();
  renderStatsModal();
  renderPartyHud(null, localProfile.id);
  updateQuestTrackerHUD();

  // Open Character Select / Loadout Frontpage
  try {
    frontpage.open();
  } catch (err) {
    console.error('[Frontpage] Failed to open on startup:', err);
  }
  if (frontpage.playMode === 'multiplayer') {
    net.bootstrapAndConnect(prog);
  } else {
    isSinglePlayer = true;
    updateNetStatusPill();
  }

  let lastTs = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.08, Math.max(0.001, (now - lastTs) / 1000));
    lastTs = now;
    update(dt);
    drawWorld();
    renderMinimap();
  }
  requestAnimationFrame(frame);
}
