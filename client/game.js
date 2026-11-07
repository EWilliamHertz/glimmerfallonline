import { setupSkillGuidesUi } from './game/skillGuidesUi.js';
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
  renderEquipmentModal,
  renderInventoryModal,
  renderExchangeModal,
  setExchangeTab,
  setExchangeFilterQuery,
  setExchangeCategoryFilter,
  setExchangeOrderDialog,
  getActiveOrderDialog,
  getExchangeOffers,
  saveExchangeOffers,
  tickExchangeOffers,
  getPlayerGold,
  deductPlayerGold,
  addPlayerGold,
  addItemToBackpack,
  removeItemFromBackpack,
  getItemGuidePrice,
  countItemInBackpack,
  setHoveredEquipment,
  clearHoveredEquipment,
  updateFloatingGearTooltipPos,
  hideFloatingGearTooltip,
} from './equipmentUi.js';
import { getItemCanvas, getItemIconDataUrl } from './itemSprites.js';
import {
  MYTHIC_DUNGEONS,
  MYTHIC_AFFIXES,
  MYTHIC_KEYSTONE_MAX_TIER,
  getMythicRunDuration,
  getMythicEnemyScale,
  getMythicXpScale,
  getMythicAffixesForTier,
  CRAFTING_STATIONS,
  CRAFTING_RECIPES,
  SKILLING_NODE_TYPES,
  SKILLING_LAYOUTS,
  ELITE_AFFIXES,
  BOUNTY_CONTRACTS,
} from '../shared/protocol.js';
import { renderBankModal } from './bankUi.js';
import {
  renderCraftingModal,
  selectCraftingStation,
  selectCraftingCategory,
  selectCraftingRecipe,
  startCraftingBatch,
  stopCraftingQueue,
  renderBountyModal,
} from './craftingUi.js';
import {
  renderMerchantModal,
  MERCHANT_CATALOGS,
  getMerchantDialoguePages,
  openMerchantShop,
  buyMerchantItem,
} from './merchantUi.js';
import { initUiLayout, toggleUiEditMode, saveAndLockUiLayout, resetDefaultUiLayout } from './uiLayout.js';
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
  GRAND_FONT_POSITIONS,
  HARVEST_COOLDOWN_MS,
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
  resolveFactionAndClass,
  sanitizeLoadout,
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
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  getProfessionLevelFromXp,
  getXpForProfessionLevel,
  getTotalProfessionLevel,
} from '../shared/protocol.js';

import {
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
} from "./game/dialoguesData.js";
import { QUEST_CATALOG } from "./game/questCatalogData.js";
import { WORLD_ATLAS_REGIONS } from "./game/worldAtlasData.js";

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
  window.addEventListener('orientationchange', resizeCanvas);
  if (window.visualViewport) {
    // Safari's dynamic toolbars resize the visual viewport without firing window.resize.
    window.visualViewport.addEventListener('resize', resizeCanvas);
  }
  const initialZoomBtn = document.getElementById('zoom-label');
  if (initialZoomBtn) initialZoomBtn.innerText = `${zoom}x`;

  const camera = { x: 0, y: 0 };

  // HUD elements are looked up once and reused. The render loop must never query
  // the DOM per frame (every lookup can force style/layout work).
  const uiElCache = new Map();
  function uiEl(id) {
    let el = uiElCache.get(id);
    if (!el || el.isConnected === false) {
      el = document.getElementById(id);
      if (el) uiElCache.set(id, el);
      else uiElCache.delete(id);
    }
    return el;
  }

  // Accumulator for DOM-only HUD work, kept separate from the simulation clock.
  let hudTickAccum = 0;

  let questCompassEnabled = true;
  try {
    questCompassEnabled = localStorage.getItem('glimmerfall_quest_compass') !== '0';
  } catch (_) {}
  window.toggleQuestCompass = function (enabled) {
    questCompassEnabled = Boolean(enabled);
    try { localStorage.setItem('glimmerfall_quest_compass', questCompassEnabled ? '1' : '0'); } catch (_) {}
  };

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
    inventory: [
      { id: 'solar_gold', qty: 60 },
      { id: 'ring_of_the_sun', qty: 1 },
      { id: 'boots_of_haste', qty: 1 },
      { id: 'vanguard_gauntlets', qty: 1 },
      { id: 'amulet_of_glory', qty: 1 },
    ],
    orderTag: 'SUN',
    orderName: 'Order of Dawn',
    orderColor: '#facc15',
    statsMeta: { kills: 0, arenaWins: 0 },
    bank: [],
  };
  window.localProfile = localProfile;

  function saveProgressionLocal() {
    try {
      localStorage.setItem('glimmerfall_prog_v2', JSON.stringify(prog));
      if (localProfile?.bank) {
        const charKey = localProfile.activeCharacterId || localProfile.id;
        if (charKey) {
          localStorage.setItem(`glimmerfall_bank_cache_${charKey}`, JSON.stringify(localProfile.bank));
        }
      }
      if (isSinglePlayer && localProfile?.id) {
        const raw = localStorage.getItem('glimmerfall_sp_roster_v2');
        const roster = raw ? JSON.parse(raw) : [];
        const idx = roster.findIndex((c) => c.id === localProfile.id);
        if (idx >= 0) {
          roster[idx].progression = prog;
          roster[idx].equipment = localProfile.equipment;
          roster[idx].loadout = localProfile.loadout;
          roster[idx].inventory = localProfile.inventory;
          roster[idx].bank = localProfile.bank || [];
          roster[idx].hp = player.isDead ? player.maxHp : Math.max(1, Math.round(player.hp));
          roster[idx].solarCharge = Math.max(0, Math.round(player.solarCharge || 0));
          if (currentRoomType && currentRoomType !== ROOM_TYPES.ARENA_3V3) {
            roster[idx].lastPosition = {
              roomType: currentRoomType,
              x: Math.round(player.x),
              y: Math.round(player.y),
            };
          } else if (preArenaSpot) {
            roster[idx].lastPosition = {
              roomType: preArenaSpot.roomType || ROOM_TYPES.SANCTUARY_HUB,
              x: Math.round(preArenaSpot.x || 0),
              y: Math.round(preArenaSpot.y || 96),
            };
          }
          localStorage.setItem('glimmerfall_sp_roster_v2', JSON.stringify(roster));
        }
      }
    } catch (_) {}
  }
  window.saveProgressionLocal = saveProgressionLocal;

  function saveCurrentVitals() {
    try {
      if (isSinglePlayer && localProfile?.id) {
        saveProgressionLocal();
      } else if (!isSinglePlayer && window.net?.connected) {
        const safeRoom = (currentRoomType && currentRoomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[currentRoomType])
          ? currentRoomType
          : (preArenaSpot?.roomType || ROOM_TYPES.SANCTUARY_HUB);
        const safeX = (currentRoomType === ROOM_TYPES.ARENA_3V3 && preArenaSpot?.x != null)
          ? preArenaSpot.x
          : Math.round(Number(player.x) || 0);
        const safeY = (currentRoomType === ROOM_TYPES.ARENA_3V3 && preArenaSpot?.y != null)
          ? preArenaSpot.y
          : Math.round(Number(player.y) || 0);
        window.net.send({
          type: 'sync_vitals',
          hp: player.isDead ? player.maxHp : Math.max(1, Math.round(player.hp)),
          solarCharge: Math.max(0, Math.round(player.solarCharge || 0)),
          lastPosition: { roomType: safeRoom, x: safeX, y: safeY },
        });
      }
    } catch (_) {}
  }
  window.saveCurrentVitals = saveCurrentVitals;
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => saveCurrentVitals());
    window.addEventListener('pagehide', () => saveCurrentVitals());
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
  window.player = player;

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
  let onlineMythic = null;
  let offlineMythic = null;
  let groundZones = [];
  let lootDrops = [];
  let particles = [];
  let afterimages = [];
  let slashArcs = [];
  let skyBeams = [];

  let currentTarget = null;
  let isQueueing = false;
  let queueTimer = null;
  let preArenaSpot = null;
  let offlineArenaEnded = false;
  let isCasting = false;
  let castProgress = 0;
  let castDuration = 0;
  let currentSpell = null;
  let globalTime = 0;
  let lastNodeHarvestAt = -Infinity;
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
  const QUEST_VERSION_KEY = 'glimmerfall_quest_version';
  const CURRENT_QUEST_VERSION = 'gf_quests_v5_wipe';

  function wipeAllStaleQuestData() {
    try {
      if (typeof localStorage === 'undefined') return;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('glimmerfall_quest_state_') || k === 'glimmerfall_quest_state')) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) localStorage.removeItem(k);

      const spRosterRaw = localStorage.getItem('glimmerfall_sp_roster_v2');
      if (spRosterRaw) {
        const roster = JSON.parse(spRosterRaw);
        if (Array.isArray(roster)) {
          for (const char of roster) {
            delete char.questState;
          }
          localStorage.setItem('glimmerfall_sp_roster_v2', JSON.stringify(roster));
        }
      }

      localStorage.setItem(QUEST_VERSION_KEY, CURRENT_QUEST_VERSION);
    } catch (_) {}
  }

  // Auto-wipe stale/stuck quest data across all accounts once
  if (typeof localStorage !== 'undefined' && localStorage.getItem(QUEST_VERSION_KEY) !== CURRENT_QUEST_VERSION) {
    wipeAllStaleQuestData();
  }

  function createDefaultQuestState() {
    return {
      stasisBroken: false,
      dummyDamaged: false,
      nodeHarvested: false,
      extractionNodesHarvested: 0,
      smithInspected: false,
      apothecaryInspected: false,
      provisionsInspected: false,
      portalTraveled: false,
      warzoneKills: 0,
      ruinsKills: 0,
      calderaKills: 0,
      chronoKills: 0,
      combatKills: 0,
      combatTrainingHits: 0,
      aetherFontChanneled: false,
      aetherFontChannels: 0,
      titanChallenged: false,
      titanChallenges: 0,
      ascentReached: false,
      visitedBiomes: {},
      questRuns: {},
      activeQuests: {
        quest_awakening: { accepted: true },
      },
      trackedQuests: {
        quest_awakening: true,
      },
      completedQuests: {},
      talkedNpcs: {},
      introShown: false,
      elementalPilgrimageAcknowledged: false,
    };
  }

  let questState = createDefaultQuestState();

  // Merchant UI and other modules read/write quest flags through these globals.
  try {
    Object.defineProperty(window, 'questState', { get: () => questState, configurable: true });
  } catch (_) {
    window.questState = questState;
  }
  window.saveQuestState = saveQuestState;
  window.updateQuestTrackerHUD = updateQuestTrackerHUD;

  function getQuestStorageKey() {
    const charId = localProfile?.activeCharacterId || (localProfile?.id && localProfile.id !== 'default' && localProfile.id !== 'local_hero' ? localProfile.id : null);
    if (charId) return `glimmerfall_quest_state_${charId}`;
    return null;
  }

  let isApplyingProfile = false;
  let lastSyncedQuestSig = '';

  function saveQuestState({ syncServer = true } = {}) {
    try {
      const charId = localProfile?.activeCharacterId || (localProfile?.id && localProfile.id !== 'default' && localProfile.id !== 'local_hero' ? localProfile.id : null);
      const serialized = JSON.stringify(questState);
      if (charId) {
        localStorage.setItem(`glimmerfall_quest_state_${charId}`, serialized);
      } else {
        localStorage.setItem('glimmerfall_quest_state_latest', serialized);
        localStorage.setItem('glimmerfall_quest_state_default', serialized);
      }

      if (localProfile) {
        localProfile.questState = JSON.parse(serialized);
      }

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
      if (syncServer && !isApplyingProfile && window.net?.connected) {
        const sig = `${charId || 'anon'}::${serialized}`;
        if (sig !== lastSyncedQuestSig) {
          lastSyncedQuestSig = sig;
          window.net.send({ type: 'sync_quest_state', questState });
        }
      }
    } catch (_) {}
  }

  function profileHasAnyItem(itemIds) {
    if (!itemIds || !Array.isArray(itemIds)) return false;
    const inv = Array.isArray(localProfile?.inventory) ? localProfile.inventory : [];
    return inv.some((it) => {
      const itId = typeof it === 'string' ? it : it?.id;
      return itemIds.includes(itId);
    });
  }

  const ARTISAN_PROFESSION_IDS = ['relic_forging', 'rite_binding', 'glimmerweaving'];
  const QUEST_RUN_COUNTERS = [
    'extractionNodesHarvested',
    'warzoneKills',
    'ruinsKills',
    'calderaKills',
    'chronoKills',
    'combatKills',
    'combatTrainingHits',
    'aetherFontChannels',
    'titanChallenges',
    'starfallKills',
    'starfallVeins',
    'abyssalKills',
    'craftsCompleted',
  ];
  const QUEST_RUN_FLAGS = [
    'stasisBroken',
    'dummyDamaged',
    'nodeHarvested',
    'smithInspected',
    'apothecaryInspected',
    'provisionsInspected',
    'portalTraveled',
    'aetherFontChanneled',
    'titanChallenged',
    'ascentReached',
  ];

  function countInventoryItems(itemIds) {
    const ids = Array.isArray(itemIds) ? itemIds : [];
    const inv = Array.isArray(localProfile?.inventory) ? localProfile.inventory : [];
    return inv.reduce((total, it) => {
      const id = typeof it === 'string' ? it : it?.id;
      if (!ids.includes(id)) return total;
      return total + Math.max(0, Number(it?.qty ?? 1) || 0);
    }, 0);
  }

  // A quest run freezes everything that existed when the quest was accepted.
  // Objectives then count only the change since that moment.
  function createQuestBaseline() {
    const counters = {};
    for (const key of QUEST_RUN_COUNTERS) {
      counters[key] = Math.max(0, Number(questState?.[key]) || 0);
    }
    const flags = {};
    for (const key of QUEST_RUN_FLAGS) {
      flags[key] = Boolean(questState?.[key]);
    }
    const professions = {};
    for (const profId of Object.keys(PROFESSIONS_CATALOG)) {
      professions[profId] = getProfessionLevelFromXp(prog?.professions?.[profId]?.xp || 0);
    }
    const inventory = {};
    for (const it of Array.isArray(localProfile?.inventory) ? localProfile.inventory : []) {
      const id = typeof it === 'string' ? it : it?.id;
      if (!id) continue;
      inventory[id] = (inventory[id] || 0) + Math.max(0, Number(it?.qty ?? 1) || 0);
    }
    return {
      acceptedAt: Date.now(),
      counters,
      flags,
      professions,
      inventory,
      talkedNpcs: { ...(questState?.talkedNpcs || {}) },
      visitedBiomes: { ...(questState?.visitedBiomes || {}) },
    };
  }

  function resetQuestObjectiveState(questId) {
    if (!questState.talkedNpcs) questState.talkedNpcs = {};
    if (questId === 'quest_into_the_warzone') {
      questState.talkedNpcs.npc_archon = false;
    } else if (questId === 'quest_celestial_ascent') {
      questState.ascentReached = false;
      questState.talkedNpcs.npc_aurelia = false;
    } else if (questId === 'quest_titan_cleansing') {
      questState.titanChallenged = false;
    } else if (questId === 'quest_elemental_pilgrimage') {
      questState.visitedBiomes = {};
    } else if (questId === 'quest_stargazer_chronos') {
      questState.aetherFontChanneled = false;
    } else if (questId === 'quest_skill_forging') {
      questState.smithInspected = false;
    } else if (questId === 'quest_skill_binding') {
      questState.apothecaryInspected = false;
    } else if (questId === 'quest_skill_weaving') {
      questState.provisionsInspected = false;
    }
  }

  function ensureQuestRuns() {
    if (!questState.questRuns || typeof questState.questRuns !== 'object') {
      questState.questRuns = {};
    }
    let changed = false;
    for (const questId of Object.keys(questState.activeQuests || {})) {
      // The Awakening quest starts with the character, so its existing progress is valid.
      if (questId === 'quest_awakening' || questState.questRuns[questId]) continue;
      resetQuestObjectiveState(questId);
      questState.questRuns[questId] = createQuestBaseline();
      changed = true;
    }
    return changed;
  }

  function questRun(questId) {
    return questState.questRuns?.[questId] || null;
  }

  function questCounter(questId, key) {
    const base = Math.max(0, Number(questRun(questId)?.counters?.[key]) || 0);
    return Math.max(0, (Number(questState?.[key]) || 0) - base);
  }

  function questFlag(questId, key) {
    const run = questRun(questId);
    if (!run) return Boolean(questState?.[key]);
    return Boolean(questState?.[key]) && !run.flags?.[key];
  }

  function questNpcTalked(questId, npcId) {
    const run = questRun(questId);
    const talked = Boolean(questState?.talkedNpcs?.[npcId]);
    return run ? talked && !run.talkedNpcs?.[npcId] : talked;
  }

  function questVisited(questId, biomeKey) {
    const run = questRun(questId);
    const visited = Boolean(questState?.visitedBiomes?.[biomeKey]);
    return run ? visited && !run.visitedBiomes?.[biomeKey] : visited;
  }

  function questProfessionGain(questId, profId) {
    const run = questRun(questId);
    if (!run) return 0;
    const current = getProfessionLevelFromXp(prog?.professions?.[profId]?.xp || 0);
    const base = Math.max(1, Number(run.professions?.[profId]) || 1);
    return Math.max(0, current - base);
  }

  function questHasNewItem(questId, itemIds) {
    const run = questRun(questId);
    if (!run) return false;
    const ids = Array.isArray(itemIds) ? itemIds : [];
    const now = countInventoryItems(ids);
    const before = ids.reduce((sum, id) => sum + Math.max(0, Number(run.inventory?.[id]) || 0), 0);
    return now > before;
  }

  function artisanQuestDone(questId, flagKey, itemIds, profId) {
    return Boolean(
      questFlag(questId, flagKey) ||
      questHasNewItem(questId, itemIds) ||
      questProfessionGain(questId, profId) >= 1
    );
  }

  function loadQuestState({ syncServer = true } = {}) {
    let needsSave = false;
    try {
      const charId = localProfile?.activeCharacterId || (localProfile?.id && localProfile.id !== 'default' && localProfile.id !== 'local_hero' ? localProfile.id : null);
      const charKey = charId ? `glimmerfall_quest_state_${charId}` : null;
      let raw = charKey ? localStorage.getItem(charKey) : null;

      // Single-player characters keep their canonical quest state in the roster.
      // Read that before falling back to the shared "latest" key so one character's
      // completed quests can never hide another character's markers.
      if (!raw && isSinglePlayer && charId) {
        const rosterRaw = localStorage.getItem('glimmerfall_sp_roster_v2');
        if (rosterRaw) {
          const roster = JSON.parse(rosterRaw);
          const rosterChar = Array.isArray(roster) ? roster.find((c) => c.id === charId) : null;
          if (rosterChar?.questState) raw = JSON.stringify(rosterChar.questState);
        }
      }

      // Multiplayer can use the shared fallback, but a fresh single-player character
      // must start with the clean Awakening state instead of inheriting old progress.
      if (!raw && !isSinglePlayer) {
        raw = localStorage.getItem('glimmerfall_quest_state_latest') || localStorage.getItem('glimmerfall_quest_state_default');
      }
      let parsed = raw ? JSON.parse(raw) : null;

      // Merge server-authoritative questState if present on profile
      const srvQuest = localProfile?.questState;
      if (srvQuest && typeof srvQuest === 'object') {
        parsed = {
          ...(parsed || {}),
          ...srvQuest,
          stasisBroken: Boolean(parsed?.stasisBroken || srvQuest.stasisBroken),
          dummyDamaged: Boolean(parsed?.dummyDamaged || srvQuest.dummyDamaged),
          nodeHarvested: Boolean(parsed?.nodeHarvested || srvQuest.nodeHarvested),
          extractionNodesHarvested: Math.max(Number(parsed?.extractionNodesHarvested || 0), Number(srvQuest.extractionNodesHarvested || 0)),
          warzoneKills: Math.max(Number(parsed?.warzoneKills || 0), Number(srvQuest.warzoneKills || 0)),
          ruinsKills: Math.max(Number(parsed?.ruinsKills || 0), Number(srvQuest.ruinsKills || 0)),
          calderaKills: Math.max(Number(parsed?.calderaKills || 0), Number(srvQuest.calderaKills || 0)),
          chronoKills: Math.max(Number(parsed?.chronoKills || 0), Number(srvQuest.chronoKills || 0)),
          combatKills: Math.max(Number(parsed?.combatKills || 0), Number(srvQuest.combatKills || 0)),
          combatTrainingHits: Math.max(Number(parsed?.combatTrainingHits || 0), Number(srvQuest.combatTrainingHits || 0)),
          aetherFontChanneled: Boolean(parsed?.aetherFontChanneled || srvQuest.aetherFontChanneled),
          aetherFontChannels: Math.max(Number(parsed?.aetherFontChannels || 0), Number(srvQuest.aetherFontChannels || 0)),
          titanChallenged: Boolean(parsed?.titanChallenged || srvQuest.titanChallenged),
          titanChallenges: Math.max(Number(parsed?.titanChallenges || 0), Number(srvQuest.titanChallenges || 0)),
          ascentReached: Boolean(parsed?.ascentReached || srvQuest.ascentReached),
          questRuns: {
            ...(parsed?.questRuns || {}),
            ...(srvQuest.questRuns || {}),
          },
          completedQuests: {
            ...(parsed?.completedQuests || {}),
            ...(srvQuest.completedQuests || {}),
          },
          activeQuests: {
            ...(parsed?.activeQuests || {}),
            ...(srvQuest.activeQuests || {}),
          },
          talkedNpcs: {
            ...(parsed?.talkedNpcs || {}),
            ...(srvQuest.talkedNpcs || {}),
          },
          visitedBiomes: {
            ...(parsed?.visitedBiomes || {}),
            ...(srvQuest.visitedBiomes || {}),
          },
        };
      }

      if (parsed) {
        // Ensure any completed quest is completely removed from active quests
        const active = { ...(parsed.activeQuests || {}) };
        const completed = { ...(parsed.completedQuests || {}) };
        for (const doneId of Object.keys(completed)) {
          delete active[doneId];
          if (parsed.trackedQuests) delete parsed.trackedQuests[doneId];
        }

        questState = {
          stasisBroken: Boolean(parsed.stasisBroken || completed.quest_awakening),
          dummyDamaged: Boolean(parsed.dummyDamaged || completed.quest_awakening),
          nodeHarvested: Boolean(parsed.nodeHarvested || completed.quest_awakening),
          extractionNodesHarvested: Number(parsed.extractionNodesHarvested || 0),
          smithInspected: Boolean(parsed.smithInspected),
          apothecaryInspected: Boolean(parsed.apothecaryInspected),
          provisionsInspected: Boolean(parsed.provisionsInspected),
          portalTraveled: Boolean(parsed.portalTraveled),
          warzoneKills: Number(parsed.warzoneKills || 0),
          ruinsKills: Number(parsed.ruinsKills || 0),
          calderaKills: Number(parsed.calderaKills || 0),
          chronoKills: Number(parsed.chronoKills || 0),
          combatKills: Number(parsed.combatKills || 0),
          combatTrainingHits: Number(parsed.combatTrainingHits || 0),
          starfallKills: Number(parsed.starfallKills || 0),
          starfallVeins: Number(parsed.starfallVeins || 0),
          abyssalKills: Number(parsed.abyssalKills || 0),
          craftsCompleted: Number(parsed.craftsCompleted || 0),
          bounties: parsed.bounties && typeof parsed.bounties === 'object' ? parsed.bounties : {},
          aetherFontChanneled: Boolean(parsed.aetherFontChanneled),
          aetherFontChannels: Number(parsed.aetherFontChannels || 0),
          titanChallenged: Boolean(parsed.titanChallenged),
          titanChallenges: Number(parsed.titanChallenges || 0),
          ascentReached: Boolean(parsed.ascentReached),
          visitedBiomes: parsed.visitedBiomes || {},
          questRuns: parsed.questRuns || {},
          activeQuests: active,
          trackedQuests: parsed.trackedQuests || {},
          completedQuests: completed,
          talkedNpcs: parsed.talkedNpcs || {},
          introShown: Boolean(parsed.introShown),
          elementalPilgrimageAcknowledged: Boolean(parsed.elementalPilgrimageAcknowledged),
        };
      } else {
        questState = createDefaultQuestState();
        needsSave = true;
      }
    } catch (_) {
      questState = createDefaultQuestState();
    }

    // High-level or experienced characters (like EWACH) should never be stuck on the Awakening tutorial:
    const charName = String(localProfile?.displayName || localProfile?.name || '').toUpperCase();
    const isExperienced = (prog && (prog.level || 1) >= 2) || charName === 'EWACH';
    if (isExperienced && !questState.completedQuests?.quest_awakening) {
      if (!questState.completedQuests) questState.completedQuests = {};
      questState.stasisBroken = true;
      questState.dummyDamaged = true;
      questState.nodeHarvested = true;
      questState.completedQuests.quest_awakening = true;
      if (questState.activeQuests) delete questState.activeQuests.quest_awakening;
      if (questState.trackedQuests) delete questState.trackedQuests.quest_awakening;
      needsSave = true;
    }

    // Legacy saves predate per-run baselines. Give every already-active quest a
    // fresh start so work done before this update cannot auto-complete it.
    if (ensureQuestRuns()) needsSave = true;

    if (needsSave) {
      saveQuestState({ syncServer });
    }

    // Clean up any completed quests from active & tracked sets
    if (questState.completedQuests) {
      for (const doneId of Object.keys(questState.completedQuests)) {
        if (questState.activeQuests) delete questState.activeQuests[doneId];
        if (questState.trackedQuests) delete questState.trackedQuests[doneId];
      }
    }

    // By default, any active quest without explicit false is tracked
    if (!questState.trackedQuests || Object.keys(questState.trackedQuests).length === 0) {
      questState.trackedQuests = {};
      for (const qId of Object.keys(questState.activeQuests || {})) {
        questState.trackedQuests[qId] = true;
      }
    }

    introShown = questState.introShown || Boolean(questState.talkedNpcs?.npc_aurora);
    try {
      updateQuestTrackerHUD();
    } catch (err) {
      console.warn('[QuestTracker] Error updating HUD:', err);
    }
  }

  window.resetSessionState = function () {
    questState = createDefaultQuestState();
    prog = createDefaultProgression();
    localProfile = {
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
      inventory: [
        { id: 'solar_gold', qty: 60 },
        { id: 'ring_of_the_sun', qty: 1 },
        { id: 'boots_of_haste', qty: 1 },
        { id: 'vanguard_gauntlets', qty: 1 },
        { id: 'amulet_of_glory', qty: 1 },
      ],
      bank: [],
      orderTag: 'SUN',
      orderName: 'Order of Dawn',
      orderColor: '#facc15',
      statsMeta: { kills: 0, arenaWins: 0 },
    };
    try {
      localStorage.removeItem('glimmerfall_auth_token');
      localStorage.removeItem('glimmerfall_prog_v2');
      localStorage.removeItem('glimmerfall_quest_state_default');
      localStorage.removeItem('glimmerfall_quest_state_local_hero');
    } catch (_) {}
    updateQuestTrackerHUD();
  };

  window.resetAllQuests = function (askConfirm = false) {
    if (askConfirm && typeof confirm === 'function' && !confirm('Restart all quests from Awakening? Your character stats, level, and items will be preserved.')) {
      return;
    }
    questState = createDefaultQuestState();
    saveQuestState();
    updateQuestTrackerHUD();
    if (document.getElementById('lore-modal')?.style.display === 'block') {
      renderLoreModal();
    }
    logMessage('📜 [Quest Reset] All quests have been reset to Awakening! Speak with Herald Lyra in Sanctuary Haven.', 'log-quest', 'chat');
    spawnFCT(player.x, player.y - 14, '↺ ALL QUESTS RESET!', '#facc15', true);
    if (audio && audio.playChime) audio.playChime();
  };

  window.turnInQuestRemote = function (questId) {
    const q = QUEST_CATALOG[questId];
    if (!q || !q.isComplete()) return;
    const targetNpcId = q.turnInId || q.giverId || 'npc_aurora';
    const foundNpc = npcs.find((n) => n.id === targetNpcId);
    const spriteMap = {
      npc_aurora: 'heraldNpc',
      npc_archon: 'warzoneArchonNpc',
      npc_atlas: 'cartographerNpc',
      npc_aurelia: 'celestialArbiterNpc',
      merchant_smith: 'merchantSmithNpc',
      merchant_apothecary: 'merchantApothecaryNpc',
      merchant_provisions: 'merchantProvisionsNpc',
      merchant_relics: 'merchantRelicsNpc',
    };
    const fakeNpc = {
      id: targetNpcId,
      name: getNpcName(targetNpcId),
      spriteKey: foundNpc?.spriteKey || spriteMap[targetNpcId] || 'heraldNpc'
    };
    completeQuest(q, fakeNpc);
  };

  const recentKillKeys = new Set();
  function onPlayerKilledMob(roomType, mobName, isBoss, mobId = null, mobType = 'mob') {
    // Training posts are practice targets, not hostile foes. Their kills must never
    // advance "Banish Hostile Foes" or the public kill counter.
    if (mobType === 'dummy' || /dummy|training post/i.test(mobName || '')) return;
    const dedupeKey = mobId ? String(mobId) : `${roomType}_${mobName}_${Math.floor(Date.now() / 1200)}`;
    if (recentKillKeys.has(dedupeKey)) return;
    recentKillKeys.add(dedupeKey);
    setTimeout(() => recentKillKeys.delete(dedupeKey), 8000);

    let changed = false;

    // Combat Mastery: every hostile kill advances the first-blood trial.
    questState.combatKills = (questState.combatKills || 0) + 1;
    changed = true;
    if (questCounter('quest_skill_combat', 'combatKills') === 3 && questState.activeQuests?.quest_skill_combat) {
      logMessage('📜 [Quest Objective] Combat foes banished (3/3)! Return to Commander Valerius!', 'log-quest', 'chat');
      spawnFCT(player.x, player.y - 14, '✨ COMBAT TRIAL COMPLETE (3/3)!', '#facc15', true);
      if (audio && audio.playChime) audio.playChime();
    }

    // 1. Commander Valerius's Void Invaders Quest:
    // Any hostile mob killed outside Sanctuary Haven (or explicitly void-aligned) counts towards warzoneKills!
    if (roomType !== ROOM_TYPES.SANCTUARY_HUB || (mobName && (mobName.includes('Void') || mobName.includes('Fiend') || mobName.includes('Stalker')))) {
      questState.warzoneKills = (questState.warzoneKills || 0) + 1;
      changed = true;
      if (questCounter('quest_void_banish', 'warzoneKills') === 3 && questState.activeQuests?.quest_void_banish) {
        logMessage('📜 [Quest Objective] Void threats banished (3/3)! Return to Commander Valerius!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ OBJECTIVE COMPLETE (3/3)!', '#facc15', true);
        if (audio && audio.playChime) audio.playChime();
      }
    }

    // 2. Atlas's Forgotten Ruins Quest:
    if (roomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS || (mobName && (mobName.includes('Ruin') || mobName.includes('Ancient') || mobName.includes('Horror')))) {
      questState.ruinsKills = (questState.ruinsKills || 0) + 1;
      changed = true;
      if (questCounter('quest_first_nexus', 'ruinsKills') === 2 && questState.activeQuests?.quest_first_nexus) {
        logMessage('📜 [Quest Objective] Ruin horrors banished (2/2)! Return to Atlas!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ OBJECTIVE COMPLETE (2/2)!', '#facc15', true);
        if (audio && audio.playChime) audio.playChime();
      }
    }

    // 3. Caldera Warzone Quest:
    if (roomType === ROOM_TYPES.NEXUS_WARZONE || (mobName && (mobName.includes('Caldera') || mobName.includes('Void Fiend') || mobName.includes('Titan')))) {
      questState.calderaKills = (questState.calderaKills || 0) + 1;
      changed = true;
      if (questCounter('quest_caldera_siege', 'calderaKills') === 1 && questState.activeQuests?.quest_caldera_siege) {
        logMessage('📜 [Quest Objective] Continental Caldera foe vanquished (1/1)! Return to Commander Valerius!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ OBJECTIVE COMPLETE (1/1)!', '#facc15', true);
        if (audio && audio.playChime) audio.playChime();
      }
    }

    // 4. Astromancer Kaelen's Aether Spire Chrono Quest:
    if (roomType === ROOM_TYPES.AETHER_SPIRE || (mobName && (mobName.includes('Chrono') || mobName.includes('Continuum') || mobName.includes('Anomaly') || mobName.includes('Wraith') || mobName.includes('Aether')))) {
      questState.chronoKills = (questState.chronoKills || 0) + 1;
      changed = true;
      if (questCounter('quest_stargazer_chronos', 'chronoKills') === 1 && questState.activeQuests?.quest_stargazer_chronos) {
        logMessage('📜 [Quest Objective] Chrono Anomaly banished (1/1)! Channel the Mirrorgate Star Font and return to Astromancer Kaelen!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ OBJECTIVE COMPLETE (1/1)!', '#facc15', true);
        if (audio && audio.playChime) audio.playChime();
      }
    }

    // 5. Starfall Crater Quest:
    if (roomType === ROOM_TYPES.STARFALL_CRATER || (mobName && (mobName.includes('Starforged') || mobName.includes('Meteor') || mobName.includes('Ignis-Core')))) {
      questState.starfallKills = (questState.starfallKills || 0) + 1;
      changed = true;
      if (questCounter('quest_starfall_forge', 'starfallKills') === 4 && questState.activeQuests?.quest_starfall_forge) {
        logMessage('📜 [Quest Objective] Starfall constructs shattered (4/4)!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ CONSTRUCTS SHATTERED (4/4)!', '#fb923c', true);
        if (audio && audio.playChime) audio.playChime();
      }
    }

    // 6. Abyssal Rift Quest:
    if (roomType === ROOM_TYPES.ABYSSAL_RIFT || (mobName && (mobName.includes('Abyssal') || mobName.includes('Paradox') || mobName.includes('Gloam') || mobName.includes('Xal')))) {
      questState.abyssalKills = (questState.abyssalKills || 0) + 1;
      changed = true;
      if (questCounter('quest_abyssal_breach', 'abyssalKills') === 5 && questState.activeQuests?.quest_abyssal_breach) {
        logMessage('📜 [Quest Objective] Abyssal Rift horrors banished (5/5)! Return to Rift-Watcher Nihilus!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ RIFT HORRORS BANISHED (5/5)!', '#c084fc', true);
        if (audio && audio.playChime) audio.playChime();
      }
    }

    // 7. Titan Summit:
    if ((roomType === ROOM_TYPES.CELESTIAL_ASCENT && isBoss) || (mobName && mobName.includes('Aurelius'))) {
      questState.titanChallenges = (questState.titanChallenges || 0) + 1;
      if (!questState.titanChallenged) {
        questState.titanChallenged = true;
        changed = true;
      }
    }

    // Advance active Vanguard Bounty Board contracts!
    if (typeof advanceBountyProgress === 'function') {
      advanceBountyProgress('kills', 1);
      if (isBoss) advanceBountyProgress('bosses', 1);
      if (roomType === ROOM_TYPES.STARFALL_CRATER) advanceBountyProgress('starfall_kills', 1);
      const isEliteKill = Object.values(ELITE_AFFIXES).some((af) => mobName && mobName.includes(af.label));
      if (roomType === ROOM_TYPES.ABYSSAL_RIFT || isEliteKill || isBoss) {
        advanceBountyProgress('abyssal_or_elite_kills', 1);
      }
    }

    if (changed) {
      saveQuestState();
      updateQuestTrackerHUD();
      if (document.getElementById('lore-modal')?.style.display === 'block') {
        renderLoreModal();
      }
    }
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

  function getNpcName(npcId) {
    const map = {
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
    };
    return map[npcId] || 'Quest Giver';
  }

  function formatProfessionName(profId) {
    const map = {
      resonance_extraction: 'Resonance Extraction',
      relic_forging: 'Relic-Forging',
      rite_binding: 'Rite-Binding',
      glimmerweaving: 'Glimmerweaving',
      combat_mastery: 'Combat Mastery',
    };
    return map[profId] || profId;
  }

  function getTotalCompletedQuestPoints() {
    let total = 0;
    for (const qId of Object.keys(questState.completedQuests || {})) {
      if (questState.completedQuests[qId] && QUEST_CATALOG[qId]) {
        total += (QUEST_CATALOG[qId].questPoints || 1);
      }
    }
    return total;
  }

  function getMaxQuestPoints() {
    let total = 0;
    for (const qId of Object.keys(QUEST_CATALOG)) {
      total += (QUEST_CATALOG[qId].questPoints || 1);
    }
    return total;
  }

  function isClickOnNpc(npc, wx, wy) {
    if (!npc) return false;
    // Horizontal distance from NPC center: up to 34px
    const dx = Math.abs(wx - npc.x);
    // Vertical offset relative to npc feet (npc.y):
    // Feet: dy = 0. Upper body: dy = -16. Head: dy = -30.
    // Nameplate: dy = -42. Quest icon: dy = -56.
    // Allow from 14px below feet up to 74px above feet (covers entire sprite, nameplate & quest glyph)
    const dy = wy - npc.y;
    return (dx <= 34 && dy >= -74 && dy <= 14);
  }

  function isQuestPrereqMet(q) {
    if (!q) return false;
    if (q.prereqQuestId && !questState.completedQuests?.[q.prereqQuestId]) return false;
    if (Array.isArray(q.prereqQuestIds) && q.prereqQuestIds.some((id) => !questState.completedQuests?.[id])) return false;
    return true;
  }

  function getNpcQuestStatus(npc) {
    if (!npc) return 'none';
    // Bankers and exchange brokers do not have quests
    if (npc.isBank || npc.isExchange) {
      return 'none';
    }
    const npcId = npc.id;

    // 1. Check for ANY finished quest ready to turn in to THIS npc
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.turnInId === npcId || q.giverId === npcId) {
        const isCompleted = Boolean(questState.completedQuests[qId]);
        const isActive = Boolean(questState.activeQuests[qId]);
        if (!isCompleted) {
          if (isActive && q.isComplete()) return 'finished';
          if (qId === 'quest_awakening' && q.isComplete()) return 'finished';
          if (q.turnInId === npcId && q.isComplete()) return 'finished';
        }
      }
    }

    // 2. Check for ongoing (in-progress) quests to turn in to THIS npc
    for (const qId of Object.keys(questState.activeQuests)) {
      const q = QUEST_CATALOG[qId];
      if (q && (q.turnInId === npcId || q.giverId === npcId)) {
        if (!q.isComplete()) return 'ongoing';
      }
    }

    // 3. Check for available quests that THIS npc gives
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.giverId === npcId) {
        const isCompleted = Boolean(questState.completedQuests[qId]);
        const isActive = Boolean(questState.activeQuests[qId]);
        const prereqMet = isQuestPrereqMet(q);
        if (!isCompleted && !isActive && prereqMet) return 'available';
      }
    }

    // 4. Otherwise, no quest marker above their head
    return 'none';
  }

  function getFinishedQuestForNpc(npcId) {
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      if (q.turnInId === npcId || q.giverId === npcId) {
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
        const prereqMet = isQuestPrereqMet(q);
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

  let pendingQuestCompleteDialogue = null;
  let pendingQuestCompleteNpc = null;
  let questCompleteModalOpenedAt = 0;

  function showQuestCompleteScroll(quest, npc, nextQuest) {
    const modal = document.getElementById('quest-complete-modal');
    if (!modal) return;
    questCompleteModalOpenedAt = Date.now();

    const titleEl = document.getElementById('qc-scroll-title');
    const subtitleEl = document.getElementById('qc-scroll-subtitle');
    const rewardsListEl = document.getElementById('qc-scroll-rewards-list');
    const qpEl = document.getElementById('qc-scroll-qp');

    const qpAwarded = quest.questPoints || 1;
    let totalQP = 0;
    let maxQP = 0;
    try { totalQP = getTotalCompletedQuestPoints(); } catch (_) {}
    try { maxQP = getMaxQuestPoints(); } catch (_) {}

    if (titleEl) titleEl.innerText = quest.title.toUpperCase();
    if (subtitleEl) subtitleEl.innerText = `Congratulations! You have completed ${quest.title}!`;
    if (qpEl) qpEl.innerText = `Quest Points: ${totalQP} / ${maxQP}`;

    if (rewardsListEl) {
      const items = [];
      // 1. Quest Points
      items.push(`
        <div class="rs-reward-row">
          <span class="rs-reward-badge">🛡️</span>
          <span><b>${qpAwarded} Quest Point${qpAwarded > 1 ? 's' : ''}</b></span>
        </div>
      `);
      // 2. Combat XP
      if (quest.rewards?.xp) {
        items.push(`
          <div class="rs-reward-row">
            <span class="rs-reward-badge">⚔️</span>
            <span><b>+${quest.rewards.xp} Combat Experience</b></span>
          </div>
        `);
      }
      // 3. Glimmer
      if (quest.rewards?.glimmer) {
        items.push(`
          <div class="rs-reward-row">
            <span class="rs-reward-badge">🔮</span>
            <span><b>+${quest.rewards.glimmer} Glimmer Energy</b></span>
          </div>
        `);
      }
      // 4. Gold
      if (quest.rewards?.gold) {
        items.push(`
          <div class="rs-reward-row">
            <span class="rs-reward-badge">💰</span>
            <span><b>+${quest.rewards.gold} Solar Gold</b></span>
          </div>
        `);
      }
      // 5. Profession XP
      if (quest.rewards?.professionXp) {
        for (const [profId, pAmt] of Object.entries(quest.rewards.professionXp)) {
          items.push(`
            <div class="rs-reward-row">
              <span class="rs-reward-badge">✨</span>
              <span><b>+${pAmt} ${formatProfessionName(profId)} Experience</b></span>
            </div>
          `);
        }
      }
      // 6. Unlocks & Next Quest
      if (quest.unlocks && quest.unlocks.length > 0) {
        for (const unl of quest.unlocks) {
          items.push(`
            <div class="rs-reward-row">
              <span class="rs-reward-badge">🔓</span>
              <span>${unl}</span>
            </div>
          `);
        }
      } else if (nextQuest) {
        items.push(`
          <div class="rs-reward-row">
            <span class="rs-reward-badge">🔓</span>
            <span>Unlocked Next Quest: <b>${nextQuest.title}</b></span>
          </div>
        `);
      }

      rewardsListEl.innerHTML = items.join('');
    }

    modal.style.display = 'flex';
  }

  window.closeQuestCompleteModal = function (force = false) {
    if (!force && Date.now() - questCompleteModalOpenedAt < 400) {
      return;
    }
    const modal = document.getElementById('quest-complete-modal');
    if (modal) modal.style.display = 'none';

    if (audio && audio.playDialogue) {
      audio.playDialogue();
    }

    updateQuestTrackerHUD();

    if (pendingQuestCompleteDialogue) {
      const dlg = pendingQuestCompleteDialogue;
      const spKey = pendingQuestCompleteNpc?.spriteKey || 'heraldNpc';
      const nId = pendingQuestCompleteNpc?.id || null;
      pendingQuestCompleteDialogue = null;
      pendingQuestCompleteNpc = null;
      openDialogue(dlg, spKey, nId);
    }
  };

  function completeQuest(quest, npc) {
    if (!quest) return;
    questState.completedQuests[quest.id] = true;
    delete questState.activeQuests[quest.id];
    if (questState.trackedQuests) {
      delete questState.trackedQuests[quest.id];
    }
    if (npc && npc.id) {
      questState.talkedNpcs[npc.id] = true;
    }

    const qpAwarded = quest.questPoints || 1;

    try {
      if (quest.rewards?.xp) awardXP(quest.rewards.xp, quest.title);
    } catch (e) {
      console.warn('[Quest] Error awarding XP:', e);
    }
    try {
      if (quest.rewards?.glimmer) {
        player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + quest.rewards.glimmer);
      }
    } catch (_) {}
    try {
      if (quest.rewards?.professionXp) {
        for (const [profId, pAmt] of Object.entries(quest.rewards.professionXp)) {
          awardProfessionXP(profId, pAmt, quest.title, true);
        }
      }
    } catch (_) {}
    try {
      if (quest.rewards?.gold && typeof addPlayerGold === 'function') {
        addPlayerGold(localProfile, quest.rewards.gold);
      }
    } catch (_) {}

    spawnSparkBurst(player.x, player.y - 12, ['#fde047', '#ffffff', '#38bdf8', '#86efac', '#ec4899', '#f97316'], 36);
    spawnFCT(player.x, player.y - 18, `★ QUEST COMPLETE: ${quest.title.toUpperCase()}! ★`, '#facc15', true);
    logMessage(`[Quest Complete] Congratulations! You have completed "${quest.title}"! (+${quest.rewards?.xp || 0} XP, +${quest.rewards?.glimmer || 0} Glimmer, +${qpAwarded} QP)`, 'log-quest');

    let nextQuest = null;
    if (quest.nextQuestId && QUEST_CATALOG[quest.nextQuestId]) {
      nextQuest = QUEST_CATALOG[quest.nextQuestId];
    }

    saveQuestState();
    updateQuestTrackerHUD();

    // Play iconic Quest Complete Fanfare sound!
    try {
      if (audio && audio.playQuestCompleteFanfare) {
        audio.playQuestCompleteFanfare();
      } else if (audio && audio.playLevelUp) {
        audio.playLevelUp();
      }
    } catch (_) {}

    // Save pending completion dialogue to open when modal is dismissed
    pendingQuestCompleteDialogue = quest.completeDialogue || (npc ? npc.dialogue : null);
    pendingQuestCompleteNpc = npc;

    // Show authentic Quest Complete Scroll modal!
    try {
      showQuestCompleteScroll(quest, npc, nextQuest);
    } catch (err) {
      console.error('[Quest] Error showing quest complete scroll:', err);
    }
  }

  function acceptQuest(quest, npc) {
    resetQuestObjectiveState(quest.id);
    if (!questState.questRuns || typeof questState.questRuns !== 'object') questState.questRuns = {};
    questState.questRuns[quest.id] = createQuestBaseline();
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
    if (npc.isBank) {
      questState.talkedNpcs[npc.id] = true;
      questState.bankVisited = true;
      saveQuestState();
      window.toggleModal('bank-modal');
      return;
    }
    if (npc.isExchange) {
      questState.talkedNpcs[npc.id] = true;
      saveQuestState();
      window.toggleModal('exchange-modal');
      return;
    }

    // 1. Immediately register talking/conferring with this NPC
    questState.talkedNpcs[npc.id] = true;
    if (npc.id === 'npc_archon') questState.talkedNpcs.npc_archon = true;
    if (npc.id === 'npc_atlas') questState.talkedNpcs.npc_atlas = true;
    if (npc.id === 'npc_aurelia') questState.talkedNpcs.npc_aurelia = true;
    saveQuestState();

    audio.playDialogue();

    // Special recovery for Leyline Pilgrimage completion if missed:
    if (npc.id === 'npc_aurora' && questState.completedQuests?.quest_elemental_pilgrimage && !questState.elementalPilgrimageAcknowledged) {
      questState.elementalPilgrimageAcknowledged = true;
      saveQuestState();
      if (audio && audio.playQuestCompleteFanfare) audio.playQuestCompleteFanfare();
      showQuestCompleteScroll(QUEST_CATALOG.quest_elemental_pilgrimage, npc, null);
      pendingQuestCompleteDialogue = QUEST_CATALOG.quest_elemental_pilgrimage.completeDialogue;
      pendingQuestCompleteNpc = npc;
      return;
    }

    // 2. Check for ANY finished quest ready to turn in to THIS npc
    let finishedQ = getFinishedQuestForNpc(npc.id);
    if (!finishedQ) {
      for (const qId of Object.keys(questState.activeQuests || {})) {
        const q = QUEST_CATALOG[qId];
        if (q && (q.turnInId === npc.id || q.giverId === npc.id) && q.isComplete()) {
          finishedQ = q;
          break;
        }
      }
    }

    if (finishedQ) {
      completeQuest(finishedQ, npc);
      return;
    }

    // 3. Check for available quests that THIS npc gives
    const availQ = getAvailableQuestForNpc(npc.id);
    if (availQ) {
      acceptQuest(availQ, npc);
      return;
    }

    // 4. Check for ongoing quests with THIS npc
    const ongoingQ = getOngoingQuestForNpc(npc.id);
    if (ongoingQ) {
      if (ongoingQ.isComplete()) {
        completeQuest(ongoingQ, npc);
        return;
      }
      if (ongoingQ.ongoingDialogue) {
        openDialogue(ongoingQ.ongoingDialogue, npc.spriteKey, npc.id);
        return;
      }
    }

    // 5. Market Stall Merchant interaction (when no quest is active/available/finished)
    if (npc.isMerchant || npc.merchantType || MERCHANT_CATALOGS[npc.id]) {
      const mId = npc.merchantType || npc.id;
      const pages = getMerchantDialoguePages(mId);
      openDialogue(pages, npc.spriteKey, npc.id);
      return;
    }

    // 6. Lore / Standard dialogue
    openDialogue(npc.dialogue, npc.spriteKey, npc.id);
    updateQuestTrackerHUD();
  }

  // ==========================================
  // Continental Atlas & Regions Data
  // ==========================================
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
    const curKey = String(currentRoomType || '').toUpperCase();
    if (WORLD_ATLAS_REGIONS[curKey]) {
      selectedMapRegionId = curKey;
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
    const curKey = String(currentRoomType || '').toUpperCase();
    if (WORLD_ATLAS_REGIONS[curKey]) {
      window.selectMapRegion(curKey, true);
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
    const isPlayerHere = String(currentRoomType || '').toUpperCase() === reg.id;
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
    const isPlayerHere = String(currentRoomType || '').toUpperCase() === reg.id;
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
      'ABYSSAL_RIFT',
      'CELESTIAL_ASCENT',
      'NEXUS_WARZONE',
      'STARFALL_CRATER',
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
          Click any continental realm below to inspect its Square Map:
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; max-height:380px; overflow-y:auto; padding-right:4px;">
          ${realmOrder.map((regId) => {
            const reg = WORLD_ATLAS_REGIONS[regId];
            if (!reg) return '';
            const isHere = String(currentRoomType || '').toUpperCase() === regId;
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
            🗺️ CONTINENTAL REALMS ATLAS
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
        <!-- Left: Square Map Viewport with 4 Edge-Hover Scroll Bars OR Grid Overview -->
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
      const charName = String(localProfile?.displayName || localProfile?.name || '').toUpperCase();
      const isExperienced = (prog && (prog.level || 1) >= 2) || charName === 'EWACH';
      if (!isExperienced) {
        activeList.push(QUEST_CATALOG.quest_awakening);
      }
    }

    const completedList = [];
    for (const qId of Object.keys(questState.completedQuests || {})) {
      if (QUEST_CATALOG[qId]) completedList.push(QUEST_CATALOG[qId]);
    }

    const availableList = [];
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      const isCompleted = Boolean(questState.completedQuests?.[qId]);
      const isActive = Boolean(questState.activeQuests?.[qId]);            const prereqMet = isQuestPrereqMet(q);
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
            Active: <b style="color:#38bdf8;">${activeList.length}</b> | Available: <b style="color:#fde047;">${availableList.length}</b> | Completed: <b style="color:#4ade80;">${completedList.length}</b> | 🛡️ Quest Points: <b style="color:#facc15;">${getTotalCompletedQuestPoints()} / ${getMaxQuestPoints()}</b>
          </span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="id-mini-btn" onclick="resetAllQuests(true)" title="Restart all quests from Awakening" style="font-size:9.5px; padding:3px 8px; border-color:#f59e0b; color:#fbbf24;">
            ↺ RESTART QUESTS
          </button>
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

    try {
      const activeList = [];
      for (const qId of Object.keys(questState.activeQuests || {})) {
        if (QUEST_CATALOG[qId]) activeList.push(QUEST_CATALOG[qId]);
      }

      if (activeList.length === 0 && !questState.completedQuests?.quest_awakening) {
        const charName = String(localProfile?.displayName || localProfile?.name || '').toUpperCase();
        const isExperienced = (prog && (prog.level || 1) >= 2) || charName === 'EWACH';
        if (!isExperienced) {
          activeList.push(QUEST_CATALOG.quest_awakening);
        }
      }

      const trackedList = activeList.filter((q) => questState.trackedQuests?.[q.id] !== false);

      if (trackedList.length === 0) {
        container.innerHTML = `
          <div class="quest-title" style="margin-bottom:2px;">
            <span style="text-shadow:0 1px 3px rgba(0,0,0,0.95), 1px 1px 0 #000;">📜 QUEST TRACKER</span>
            <button class="id-mini-btn" onclick="openQuestLog()" style="font-size:9.5px; padding:1px 6px;">LOG [L]</button>
          </div>
          <div style="color:#e2e8f0; font-size:9.5px; padding:4px 0; text-shadow:0 1px 3px rgba(0,0,0,0.95), 1px 1px 0 #000, -1px -1px 0 #000;">
            ${activeList.length > 0 ? `${activeList.length} quest(s) active, but unpinned from HUD.` : 'No active quests.'}<br/>
            <a href="javascript:void(0)" onclick="openQuestLog()" style="color:#38bdf8; font-weight:bold; text-shadow:1px 1px 0 #000;">Open Quest Log [L]</a> to select quests to display.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.18); padding-bottom:3px; margin-bottom:5px;">
          <span style="font-family:var(--font-header); font-size:10.5px; color:#facc15; font-weight:bold; text-shadow:0 1px 3px rgba(0,0,0,0.95), 1px 1px 0 #000, -1px -1px 0 #000;">
            📜 TRACKED QUESTS (${trackedList.length}/${activeList.length})
          </span>
          <button class="id-mini-btn" onclick="openQuestLog()" title="Open Quest Log &amp; Atlas [L]" style="font-size:9.5px; padding:2px 6px;">
            LOG [L]
          </button>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${trackedList.map((q) => {
            let isReady = false;
            try { isReady = Boolean(q.isComplete()); } catch (_) {}
            const tasksHtml = q.tasks.map((t, idx) => {
              let isDone = false;
              try { isDone = Boolean(t.done()); } catch (_) {}
              const countStr = t.counter ? ` (${t.counter()})` : '';
              return `
                <div class="quest-task" style="margin-bottom:2px;">
                  <div class="quest-check ${isDone ? 'done' : ''}" style="width:13px; height:13px; font-size:9px;">${isDone ? '✓' : ''}</div>
                  <span style="${isDone ? 'color:#94a3b8; text-decoration:line-through;' : 'color:#f8fafc; font-size:9.5px; font-weight:600;'} text-shadow:0 1px 2px #000, 1px 1px 0 #000, -1px -1px 0 #000;">${t.text}${countStr}</span>
                </div>
              `;
            }).join('');

            const turnInPrompt = isReady ? `
              <div class="quest-turnin-banner" style="margin-top:3px; padding:3px 6px; font-size:9.5px; background:rgba(234,179,8,0.25); border:1px solid #fde047; text-shadow:1px 1px 0 #000; display:flex; justify-content:center; align-items:center; gap:4px; font-weight:bold; color:#fde047;">
                <span>✨ Ready! Return to ${getNpcName(q.turnInId)}</span>
              </div>
            ` : '';

            let completedCount = 0;
            try { completedCount = q.tasks.filter((t) => Boolean(t.done())).length; } catch (_) {}

            return `
              <div class="quest-block" style="padding-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.12);">
                <div class="quest-title" style="font-size:10.5px; margin-bottom:3px;">
                  <span style="color:#fde047; text-shadow:0 1px 2px #000, 1px 1px 0 #000;">${q.title.toUpperCase()}</span>
                  <span style="color:${isReady ? '#facc15' : '#38bdf8'}; font-size:9.5px; font-weight:800; text-shadow:0 1px 2px #000, 1px 1px 0 #000;">
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
    } catch (err) {
      console.warn('[QuestTracker] Failed to render tracker HUD:', err);
    }
  }
  const inputs = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false, shift: false, axisX: 0, axisY: 0 };

  let keybinds = { ...DEFAULT_KEYBINDS };
  try {
    const savedKb = localStorage.getItem('glimmerfall_keybinds');
    if (savedKb) keybinds = { ...DEFAULT_KEYBINDS, ...JSON.parse(savedKb) };
  } catch (_) {}
  let listeningSlot = null;
  let pendingAssign = null; // { kind: 'ability', id } picked from the Skill Tree, awaiting an action-bar slot click

  // ==========================================
  // Portrait, Paperdoll & Profile Sync
  // ==========================================
  function syncBgmButtonLabel() {
    const btn = document.getElementById('btn-bgm-toggle');
    if (btn) btn.innerText = audio.bgmMuted ? '🔇 BGM' : '🎵 BGM';
  }
  syncBgmButtonLabel();
  syncAudioMixerUI();

  window.toggleBgmMute = function (force) {
    const playing = typeof force === 'boolean' ? audio.setBgmEnabled(force) : audio.toggleBgm();
    const btn = document.getElementById('btn-bgm-toggle');
    if (btn) btn.innerText = playing ? '🎵 BGM' : '🔇 BGM';
    const settingsCb = document.getElementById('settings-bgm-checkbox');
    if (settingsCb) settingsCb.checked = playing;
    const mixerCb = document.getElementById('mixer-bgm-checkbox');
    if (mixerCb) mixerCb.checked = playing;
    syncAudioMixerUI();
  };

  function syncAudioMixerUI() {
    const volumes = audio.getVolumes();
    for (const channel of ['master', 'music', 'sfx']) {
      const range = document.getElementById(`vol-${channel}-range`);
      const number = document.getElementById(`vol-${channel}-number`);
      if (range) range.value = String(volumes[channel]);
      if (number) number.value = String(volumes[channel]);
    }
    const mixerCb = document.getElementById('mixer-bgm-checkbox');
    if (mixerCb) mixerCb.checked = !audio.bgmMuted;
    const settingsCb = document.getElementById('settings-bgm-checkbox');
    if (settingsCb) settingsCb.checked = !audio.bgmMuted;
  }

  window.syncAudioMixerUI = syncAudioMixerUI;

  window.setAudioVolume = function (channel, value) {
    const applied = audio.setVolume(channel, value);
    if (applied !== null) {
      const range = document.getElementById(`vol-${channel}-range`);
      const number = document.getElementById(`vol-${channel}-number`);
      if (range) range.value = String(applied);
      if (number) number.value = String(applied);
    }
  };

  window.openAudioMixer = function () {
    window.toggleModal('audio-mixer-modal');
    syncAudioMixerUI();
  };

  window.muteAllAudio = function () {
    window.setAudioVolume('master', 0);
  };

  window.resetAudioVolumes = function () {
    audio.setVolume('master', 80);
    audio.setVolume('music', 65);
    audio.setVolume('sfx', 80);
    if (audio.bgmMuted) audio.setBgmEnabled(true);
    syncAudioMixerUI();
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

  function recalcVitalsFromProfile(initialProf = null) {
    player.maxHp = calcMaxHp(prog, localProfile.equipment, localProfile.classId);
    player.maxSolarCharge = calcMaxGlimmer(prog, localProfile.equipment, localProfile.classId);

    const targetHp = initialProf && typeof initialProf.hp === 'number' && initialProf.hp > 0
      ? initialProf.hp
      : typeof localProfile.hp === 'number' && localProfile.hp > 0
      ? localProfile.hp
      : player.hp > 0 ? player.hp : player.maxHp;
    player.hp = Math.min(player.maxHp, Math.max(1, targetHp));

    const targetGlimmer = initialProf && typeof initialProf.solarCharge === 'number' && initialProf.solarCharge >= 0
      ? initialProf.solarCharge
      : typeof localProfile.solarCharge === 'number' && localProfile.solarCharge >= 0
      ? localProfile.solarCharge
      : player.solarCharge >= 0 ? player.solarCharge : 0;
    player.solarCharge = Math.min(player.maxSolarCharge, Math.max(0, targetGlimmer));
  }

  function applyProfile(prof) {
    if (!prof) return;
    const resolved = resolveFactionAndClass({
      faction: prof.faction,
      classId: prof.classId,
      loadout: prof.loadout || localProfile.loadout,
      orderTag: prof.orderTag || localProfile.orderTag,
    });
    const cls = CLASSES_CATALOG[resolved.classId] || CLASSES_CATALOG.solari_vanguard;
    const pId = prof.activeCharacterId || prof.id || 'default';
    let resolvedBank = Array.isArray(prof.bank) ? [...prof.bank] : [];
    if (resolvedBank.length === 0 && typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`glimmerfall_bank_cache_${pId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            resolvedBank = parsed;
          }
        }
      } catch (_) {}
    } else if (resolvedBank.length > 0 && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`glimmerfall_bank_cache_${pId}`, JSON.stringify(resolvedBank));
      } catch (_) {}
    }

    localProfile = {
      ...localProfile,
      ...prof,
      faction: resolved.faction,
      classId: resolved.classId,
      loadout: sanitizeLoadout(prof.loadout, resolved.classId),
      equipment: { ...cls.defaultEquipment, ...(prof.equipment || {}) },
      inventory: Array.isArray(prof.inventory) ? prof.inventory : (localProfile.inventory || []),
      bank: resolvedBank,
      // Do not leak the previous character's quest state into this profile.
      questState: prof.questState || null,
      hp: typeof prof.hp === 'number' ? prof.hp : localProfile.hp,
      solarCharge: typeof prof.solarCharge === 'number' ? prof.solarCharge : localProfile.solarCharge,
      lastPosition: prof.lastPosition || localProfile.lastPosition || null,
    };
    window.localProfile = localProfile;
    loadActionBarItems();

    // Reset progression cleanly to default and apply the active character's progression
    prog = {
      ...createDefaultProgression(),
      ...(prof.progression || {}),
      stats: { ...createDefaultProgression().stats, ...(prof.progression?.stats || {}) },
      ranks: { ...createDefaultProgression().ranks, ...(prof.progression?.ranks || {}) },
      skills: { ...createDefaultProgression().skills, ...(prof.progression?.skills || {}) },
      professions: { ...createDefaultProgression().professions, ...(prof.progression?.professions || {}) },
      paragon: { ...(prof.progression?.paragon || {}) },
    };
    // Ensure starter ability in loadout is registered at least Rank 1 in prog.skills
    for (const [slotKey, abId] of Object.entries(localProfile.loadout || {})) {
      if (abId && ABILITIES_CATALOG[abId] && !prog.skills[abId]) {
        prog.skills[abId] = Math.max(1, getAbilityRank(prog, abId));
      }
      if (abId && prog.ranks) {
        prog.ranks[slotKey] = getAbilityRank(prog, abId);
      }
    }
    saveProgressionLocal();

    isApplyingProfile = true;
    try {
      loadQuestState({ syncServer: false });
    } finally {
      isApplyingProfile = false;
    }
    recalcVitalsFromProfile(prof);
    refreshHeroPortrait();
    updatePlayerUI();
    updateActionBarBadges();
    restoreLearnedBarOnce();
    if (document.getElementById('equipment-modal')?.style.display === 'block' || document.getElementById('paperdoll-modal')?.style.display === 'block') {
      renderEquipmentModal({ profile: localProfile });
    }
    if (document.getElementById('inventory-modal')?.style.display === 'block') {
      renderInventoryModal({ profile: localProfile });
    }
    if (document.getElementById('exchange-modal')?.style.display === 'block') {
      renderExchangeModal({ profile: localProfile });
    }
    if (document.getElementById('bank-modal')?.style.display === 'block') {
      renderBankModal({ profile: localProfile });
    }
    if (document.getElementById('merchant-modal')?.style.display === 'block') {
      renderMerchantModal();
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

  const recentFcts = [];

  function shortenFctText(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    // Common long phrases replacement to keep combat text concise and punchy
    str = str.replace(/RESONANCE EXTRACTION/gi, 'Resonance');
    str = str.replace(/COMBAT MASTERY/gi, 'Combat');
    str = str.replace(/GLIMMERWEAVING/gi, 'Weaving');
    str = str.replace(/RELIC FORGING/gi, 'Forging');
    str = str.replace(/RITE BINDING/gi, 'Binding');
    str = str.replace(/EXPERIENCE/gi, 'XP');
    str = str.replace(/OBJECTIVE COMPLETE/gi, 'Complete');
    str = str.replace(/COMBAT TRIAL COMPLETE/gi, 'Trial Complete');
    str = str.replace(/CONSTRUCTS SHATTERED/gi, 'Constructs Done');
    str = str.replace(/RIFT HORRORS BANISHED/gi, 'Horrors Banished');
    str = str.replace(/ASTRAL VEINS MINED/gi, 'Veins Mined');
    str = str.replace(/HEALTH ALREADY FULL/gi, 'HP Full');
    str = str.replace(/GLIMMER ALREADY FULL/gi, 'Glimmer Full');
    str = str.replace(/BACKPACK IS FULL/gi, 'Bag Full');
    str = str.replace(/BACKPACK FULL/gi, 'Bag Full');
    str = str.replace(/SOVEREIGNS/gi, 'Coins');
    str = str.replace(/CHRONO STASIS APEX/gi, 'Chrono Stasis');
    str = str.replace(/VOID ANNIHILATION APEX/gi, 'Void Annihilate');
    str = str.replace(/SOLAR ASCENSION APEX ARCHON/gi, 'Solar Ascension');
    str = str.replace(/TEMPORAL APOTHEOSIS/gi, 'Temporal Apotheosis');
    str = str.replace(/AVATAR OF THE IRONWOOD/gi, 'Ironwood Avatar');
    str = str.replace(/AVATAR OF THE VOID/gi, 'Void Avatar');
    str = str.replace(/ROOTED BASTION \(-40% DMG \/ CC IMMUNE\)/gi, 'Rooted Bastion');
    str = str.replace(/ABYSSAL SHROUD \(100% DODGE\)/gi, 'Abyssal Shroud');
    str = str.replace(/AURORA STRIDE \(\+50% SPD\)/gi, 'Aurora Stride');
    if (str.length > 25) {
      str = str.slice(0, 23).trim() + '…';
    }
    return str;
  }

  function spawnFCT(wx, wy, text, color = '#facc15', isCrit = false) {
    if (!fctContainer) return;
    const now = performance.now();
    // Clear out expired FCT records (> 850ms)
    while (recentFcts.length > 0 && now - recentFcts[0].time > 850) {
      recentFcts.shift();
    }

    const { sx, sy } = worldToScreen(wx, wy - 14);

    // Stagger overlapping FCTs vertically so text remains clear and flat
    const nearby = recentFcts.filter((f) => Math.hypot(f.sx - sx, f.sy - sy) < 48);
    const stackIndex = nearby.length;
    const stackOffsetY = stackIndex * 18;

    recentFcts.push({ sx, sy, time: now });

    const cleanText = shortenFctText(text);
    const labelText = isCrit ? `★ ${cleanText}!` : cleanText;

    const el = document.createElement('div');
    el.className = isCrit ? 'fct-text fct-crit' : 'fct-text';
    el.style.left = `${sx}px`;
    el.style.top = `${sy - stackOffsetY}px`;
    el.style.color = color;

    const inner = document.createElement('span');
    inner.className = 'fct-inner';
    inner.innerText = labelText;
    el.appendChild(inner);

    fctContainer.appendChild(el);
    setTimeout(() => el.remove(), 1050);
  }
  window.spawnFCT = spawnFCT;

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

  window.equipPaperdollItem = function (itemId) {
    const item = EQUIPMENT_CATALOG[itemId];
    if (!item) return;
    const targetSlot = item.slot === 'armor' ? 'body' : item.slot === 'offhand' ? 'shield' : item.slot;
    localProfile.equipment = { ...(localProfile.equipment || {}), [targetSlot]: item.id };
    audio.playShield();
    recalcVitalsFromProfile();
    refreshHeroPortrait();
    updatePlayerUI();
    renderEquipmentModal({ profile: localProfile });
    renderStatsModal();
    if (net.connected) {
      net.send({ type: 'equip_item', itemId: item.id });
    }
    logMessage(`🛡️ Equipped ${item.name} (${item.desc})!`, 'log-solari', 'combat');
  };

  // Shared by bag clicks and action-bar item slots.
  function consumeInventoryItem(itemId) {
    const inv = localProfile.inventory || [];
    const idx = inv.findIndex((it) => (typeof it === 'string' ? it : it?.id) === itemId);
    if (idx < 0) return 'missing';
    const itemObj = inv[idx];
    const item = EQUIPMENT_CATALOG[itemId];
    if (!item) return 'not-usable';
    if (item.slot === 'keystone') return useKeystoneItem(item, idx, inv);
    if (item.slot !== 'consumable') return 'not-consumable';

    if (item.healHp) {
      if (player.hp >= player.maxHp) {
        spawnFCT(player.x, player.y - 14, 'HEALTH ALREADY FULL!', '#94a3b8');
        return 'blocked';
      }
      player.hp = Math.min(player.maxHp, player.hp + item.healHp);
      spawnFCT(player.x, player.y - 14, `+${item.healHp} HEALTH!`, '#4ade80', true);
      const actionVerb = item.id.includes('bread') || item.id.includes('apple') || item.id.includes('ration') ? 'Ate' : 'Consumed';
      const actionIcon = item.id.includes('bread') ? '🍞' : item.id.includes('apple') ? '🍎' : item.id.includes('ration') ? '🥩' : '🧪';
      logMessage(`${actionIcon} ${actionVerb} ${item.name} (+${item.healHp} Health)!`, 'log-gain', 'combat');
    } else if (item.restoreGlimmer) {
      if (player.solarCharge >= player.maxSolarCharge) {
        spawnFCT(player.x, player.y - 14, 'GLIMMER ALREADY FULL!', '#94a3b8');
        return 'blocked';
      }
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + item.restoreGlimmer);
      spawnFCT(player.x, player.y - 14, `+${item.restoreGlimmer} GLIMMER!`, '#38bdf8', true);
      logMessage(`⚗️ Consumed ${item.name} (+${item.restoreGlimmer} Glimmer)!`, 'log-gain', 'combat');
    } else {
      return 'not-usable';
    }

    audio.playPickup();
    if (typeof itemObj === 'object' && itemObj.qty > 1) {
      itemObj.qty--;
    } else {
      inv.splice(idx, 1);
    }
    localProfile.inventory = inv;
    saveProgressionLocal();
    updatePlayerUI();
    if (document.getElementById('inventory-modal')?.style.display === 'block') {
      renderInventoryModal({ profile: localProfile });
    }
    return 'used';
  }

  function useKeystoneItem(item, idx, inv) {
    const spec = item?.keystone;
    const dungeon = spec ? MYTHIC_DUNGEONS[spec.dungeonId] : null;
    if (!dungeon) return 'not-usable';

    if (currentRoomType !== dungeon.roomType) {
      spawnFCT(player.x, player.y - 14, `USE INSIDE ${dungeon.name.toUpperCase()}!`, '#ef4444');
      logMessage(`🗝️ [Mythic] ${item.name} must be activated inside ${dungeon.name}.`, 'log-quest', 'combat');
      return 'blocked';
    }

    if (net.connected) {
      net.send({ type: 'use_keystone', itemId: item.id });
      return 'used';
    }

    if (offlineMythic?.active) {
      spawnFCT(player.x, player.y - 14, 'MYTHIC RUN ALREADY ACTIVE!', '#ef4444');
      return 'blocked';
    }

    startOfflineMythic(dungeon, spec.tier);

    if (idx >= 0 && idx < inv.length) {
      const itemObj = inv[idx];
      if (typeof itemObj === 'object' && itemObj.qty > 1) itemObj.qty--;
      else inv.splice(idx, 1);
      localProfile.inventory = inv;
      saveProgressionLocal();
      updatePlayerUI();
      if (document.getElementById('inventory-modal')?.style.display === 'block') {
        renderInventoryModal({ profile: localProfile });
      }
    }
    return 'used';
  }

  function startOfflineMythic(dungeon, tier) {
    const scale = getMythicEnemyScale(tier);
    for (const e of entities) {
      if (e.type !== 'mob' || e.isDying || e.mythicScaled) continue;
      e.maxHp = Math.max(1, Math.round(e.maxHp * scale));
      e.hp = e.maxHp;
      e.damage = Math.max(1, Math.ceil((e.damage || 3) * scale));
      e.xpReward = Math.round((e.xpReward || 30) * getMythicXpScale(tier));
      e.mythicScaled = true;
    }

    const affixes = getMythicAffixesForTier(tier);
    const duration = getMythicRunDuration(tier);
    offlineMythic = {
      active: true,
      dungeonId: dungeon.id,
      tier,
      affixes,
      duration,
      timeLeft: duration,
      volcanicTimer: 3,
      completed: false,
      failed: false,
    };

    spawnFCT(player.x, player.y - 16, `🗝️ TIER ${tier} MYTHIC RUN BEGINS!`, dungeon.color, true);
    spawnSparkBurst(player.x, player.y, [dungeon.color, '#fde047', '#ffffff'], 30);
    audio.playChime?.();
    logMessage(
      `🗝️ [MYTHIC] Tier ${tier} ${dungeon.name} run started! Affixes: ${affixes.map((a) => `${MYTHIC_AFFIXES[a].icon} ${MYTHIC_AFFIXES[a].name}`).join(', ')}. Clear the boss in ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}.`,
      'log-quest',
      'combat'
    );
    updateMythicHud();
  }

  function tickOfflineMythic(dt) {
    if (!offlineMythic?.active) return;
    offlineMythic.timeLeft -= dt;

    if (offlineMythic.timeLeft <= 0) {
      offlineMythic.active = false;
      offlineMythic.failed = true;
      offlineMythic.timeLeft = 0;
      spawnFCT(player.x, player.y - 14, 'MYTHIC RUN EXPIRED', '#94a3b8', true);
      logMessage('⌛ [MYTHIC] The leyline cache faded into the void. The run has expired.', 'log-quest', 'combat');
      updateMythicHud();
      return;
    }

    if (offlineMythic.affixes.includes('volcanic')) {
      offlineMythic.volcanicTimer = (offlineMythic.volcanicTimer ?? 3) - dt;
      if (offlineMythic.volcanicTimer <= 0) {
        offlineMythic.volcanicTimer = Math.max(2.4, 4.4 - offlineMythic.tier * 0.15);
        groundZones.push({
          id: `off_tel_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          type: 'telegraph',
          color: '#f97316',
          label: 'ERUPTION',
          x: player.x,
          y: player.y,
          radius: 52,
          age: 0,
          maxAge: 1.15,
          damage: 8 + offlineMythic.tier * 3,
          bossName: 'Volcanic Affix',
        });
        spawnFCT(player.x, player.y - 14, '⚠️ VOLCANIC ERUPTION!', '#f97316', true);
      }
    }

    if (offlineMythic.affixes.includes('sanguine')) {
      for (const gz of groundZones) {
        if (gz.type !== 'sanguine_pool') continue;
        gz.tickTimer = (gz.tickTimer ?? 0) - dt;
        if (gz.tickTimer > 0) continue;
        gz.tickTimer = 1.2;
        for (const mob of entities) {
          if (mob.type !== 'mob' || mob.isDying) continue;
          if (Math.hypot(mob.x - gz.x, mob.y - gz.y) > gz.radius) continue;
          mob.hp = Math.min(mob.maxHp, mob.hp + mob.maxHp * 0.03);
        }
      }
    }

    updateMythicHud();
  }

  function completeOfflineMythic(ent, dungeon) {
    const run = offlineMythic;
    if (!run?.active) return;
    const tier = run.tier;
    const secondsLeft = Math.max(0, Math.ceil(run.timeLeft));
    run.active = false;
    run.completed = true;

    const currency =
      dungeon.faction === 'Solari' ? 'glimmer_shard' :
      dungeon.faction === 'Umbri' ? 'void_essence' :
      dungeon.faction === 'Terra' ? 'verdant_amber' : 'chrono_gem';

    const cache = [
      { itemId: 'solar_gold', qty: 400 + tier * 150 },
      { itemId: currency, qty: 30 + tier * 8 },
      { itemId: 'major_vitality_elixir', qty: 2 + Math.floor(tier / 2) },
      { itemId: getFactionBossSetDrop(ent, currentRoomType), qty: 1 },
    ];
    if (tier < MYTHIC_KEYSTONE_MAX_TIER) {
      cache.push({ itemId: `keystone_${dungeon.id}_${tier + 1}`, qty: 1 });
    } else {
      cache.push({ itemId: getBossAccessoryDrop(ent, currentRoomType), qty: 1 });
    }

    cache.forEach((d, i) => {
      if (!d.itemId) return;
      const ang = (Math.PI * 2 * i) / cache.length - Math.PI / 2;
      const dist = 34 + (i % 3) * 9;
      lootSeq++;
      lootDrops.push({
        id: `loot_off_${lootSeq}`,
        kind: 'item',
        itemId: d.itemId,
        qty: d.qty || 1,
        x: Math.round(ent.x + Math.cos(ang) * dist),
        y: Math.round(ent.y + Math.sin(ang) * dist * 0.65),
        ttl: 120,
        age: 0,
      });
    });

    awardXP(120 + tier * 45, `Tier ${tier} Mythic Cache`);
    spawnFCT(ent.x, ent.y - 18, `🏆 TIER ${tier} MYTHIC CACHE!`, dungeon.color, true);
    spawnSparkBurst(ent.x, ent.y, [dungeon.color, '#fde047', '#ffffff'], 36);
    audio.playChime?.();
    logMessage(
      `🏆 [MYTHIC COMPLETE] Tier ${tier} ${dungeon.name} cleared with ${secondsLeft}s remaining! A Mythic cache crystallized — ${tier < MYTHIC_KEYSTONE_MAX_TIER ? `a Tier ${tier + 1} keystone is inside.` : 'an apex relic is inside.'}`,
      'log-quest',
      'combat'
    );
    updateMythicHud();
  }

  function updateMythicHud() {
    const el = document.getElementById('mythic-run-hud');
    if (!el) return;
    const raw = net.connected ? onlineMythic : offlineMythic;
    const dungeon = raw?.dungeonId ? MYTHIC_DUNGEONS[raw.dungeonId] : null;

    if (!raw?.active || !dungeon || dungeon.roomType !== currentRoomType) {
      el.style.display = 'none';
      return;
    }

    const elapsed = net.connected && Number.isFinite(raw._syncedAt) ? Math.max(0, globalTime - raw._syncedAt) : 0;
    const remain = Math.max(0, (raw.timeLeft || 0) - elapsed);
    el.style.display = 'block';

    const title = document.getElementById('mythic-run-title');
    if (title) {
      title.textContent = `🗝️ TIER ${raw.tier} MYTHIC — ${dungeon.name.toUpperCase()}`;
      title.style.color = dungeon.color;
    }
    const timer = document.getElementById('mythic-run-timer');
    if (timer) {
      timer.textContent = `${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`;
    }
    const affixEl = document.getElementById('mythic-run-affixes');
    if (affixEl) {
      affixEl.innerHTML = (raw.affixes || [])
        .map((a) => {
          const af = MYTHIC_AFFIXES[a];
          return af ? `<span style="color:${af.color};">${af.icon} ${af.name.toUpperCase()}</span>` : '';
        })
        .join('<span style="color:#475569;"> • </span>');
    }
    const fill = document.getElementById('mythic-run-bar-fill');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, (remain / (raw.duration || 1)) * 100))}%`;
  }

  window.equipInventorySlot = function (slotIndex) {
    const inv = localProfile.inventory || [];
    const idx = Number(slotIndex);
    if (idx < 0 || idx >= inv.length) return;
    const itemObj = inv[idx];
    const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
    const item = EQUIPMENT_CATALOG[itemId];
    if (!item) return;

    // Mythic Leyline Keystones are activated in their crypt, never equipped.
    if (item.slot === 'keystone') {
      useKeystoneItem(item, idx, inv);
      return;
    }

    // Handle consumables!
    if (item.slot === 'consumable') {
      consumeInventoryItem(itemId);
      return;
    }

    // Handle currency or crafting material click: display helpful station hint!
    if (item.slot === 'currency' || item.slot === 'material') {
      const count = typeof itemObj === 'object' && itemObj.qty ? itemObj.qty : 1;
      const hint = item.slot === 'material' ? ' • Craft at Cosmic Star-Anvil / Crucible / Loom!' : '';
      logMessage(`${item.slot === 'material' ? '⛏️' : '🪙'} ${item.name} (Count: ${count}): ${item.desc}${hint}`, 'log-solari', 'chat');
      spawnFCT(player.x, player.y - 14, `${count}x ${item.name}`, item.slot === 'material' ? '#38bdf8' : '#fde047');
      return;
    }

    const currentEquip = { ...(localProfile.equipment || {}) };
    let targetSlot = item.slot === 'armor' ? 'body' : item.slot === 'offhand' ? 'shield' : item.slot;
    if (item.slot === 'socket_gem') {
      const socketOrder = ['socket_weapon', 'socket_body', 'socket_head'];
      const preferred = window._preferredGemSocket;
      window._preferredGemSocket = null;
      if (preferred && socketOrder.includes(preferred)) {
        targetSlot = preferred;
      } else {
        targetSlot = socketOrder.find((sk) => !currentEquip[sk]) || 'socket_weapon';
      }
    }

    const oldId = currentEquip[targetSlot] || (targetSlot === 'body' ? currentEquip.armor : targetSlot === 'shield' ? currentEquip.offhand : null);
    if (oldId === item.id) {
      spawnFCT(player.x, player.y - 14, 'ALREADY EQUIPPED!', '#94a3b8');
      return;
    }

    if (net.connected) {
      net.send({ type: 'equip_item', slotIndex: idx, preferredSocket: item.slot === 'socket_gem' ? targetSlot : null });
    }

    currentEquip[targetSlot] = item.id;
    if (targetSlot === 'body') currentEquip.armor = item.id;
    if (targetSlot === 'shield') currentEquip.offhand = item.id;

    if (oldId && oldId !== item.id) {
      if (typeof itemObj === 'object' && itemObj.qty > 1) {
        itemObj.qty--;
        const existingOld = inv.find((it) => (typeof it === 'string' ? it : it?.id) === oldId);
        if (existingOld) {
          if (typeof existingOld === 'string') {
            const oIdx = inv.indexOf(existingOld);
            inv[oIdx] = { id: oldId, qty: 2 };
          } else {
            existingOld.qty = (existingOld.qty || 1) + 1;
          }
        } else {
          inv.push({ id: oldId, qty: 1 });
        }
      } else {
        inv[idx] = { id: oldId, qty: 1 };
      }
    } else {
      if (typeof itemObj === 'object' && itemObj.qty > 1) {
        itemObj.qty--;
      } else {
        inv.splice(idx, 1);
      }
    }
    localProfile.equipment = currentEquip;
    localProfile.inventory = inv;
    saveProgressionLocal();
    audio.playShield();
    recalcVitalsFromProfile();
    refreshHeroPortrait();
    updatePlayerUI();
    spawnFCT(player.x, player.y - 14, `EQUIPPED ${item.name.toUpperCase()}`, '#fde047');
    renderInventoryModal({ profile: localProfile });
    if (document.getElementById('equipment-modal')?.style.display === 'block') {
      renderEquipmentModal({ profile: localProfile });
    }
  };

  window.unequipSlot = function (slotKey) {
    const inv = localProfile.inventory || [];
    const currentEquip = { ...(localProfile.equipment || {}) };
    const itemId = currentEquip[slotKey] || (slotKey === 'body' ? currentEquip.armor : slotKey === 'shield' ? currentEquip.offhand : null);
    if (!itemId) return;

    const existingInBag = inv.find((it) => (typeof it === 'string' ? it : it?.id) === itemId);
    if (!existingInBag && inv.length >= 28) {
      spawnFCT(player.x, player.y - 14, '🎒 BACKPACK IS FULL (28/28)!', '#ef4444');
      audio.playHurt();
      return;
    }

    if (net.connected) {
      net.send({ type: 'unequip_item', slotKey });
    }

    delete currentEquip[slotKey];
    if (slotKey === 'body') delete currentEquip.armor;
    if (slotKey === 'armor') delete currentEquip.body;
    if (slotKey === 'shield') delete currentEquip.offhand;
    if (slotKey === 'offhand') delete currentEquip.shield;

    if (existingInBag) {
      if (typeof existingInBag === 'string') {
        const eIdx = inv.indexOf(existingInBag);
        inv[eIdx] = { id: itemId, qty: 2 };
      } else {
        existingInBag.qty = (existingInBag.qty || 1) + 1;
      }
    } else {
      inv.push({ id: itemId, qty: 1 });
    }
    localProfile.equipment = currentEquip;
    localProfile.inventory = inv;
    saveProgressionLocal();
    audio.playHurt();
    recalcVitalsFromProfile();
    refreshHeroPortrait();
    updatePlayerUI();
    const itemDef = EQUIPMENT_CATALOG[itemId];
    spawnFCT(player.x, player.y - 14, `UNEQUIPPED ${itemDef?.name?.toUpperCase() || slotKey.toUpperCase()}`, '#94a3b8');
    renderEquipmentModal({ profile: localProfile });
    if (document.getElementById('inventory-modal')?.style.display === 'block') {
      renderInventoryModal({ profile: localProfile });
    }
  };

  window.socketFirstAvailableGem = function (preferredSocket = 'socket_weapon') {
    const inv = localProfile.inventory || [];
    const gemIdx = inv.findIndex((it) => {
      const id = typeof it === 'string' ? it : it?.id;
      return EQUIPMENT_CATALOG[id]?.slot === 'socket_gem';
    });
    if (gemIdx === -1) {
      logMessage('💎 No Leyline Socket Gems in backpack! Cut Solar Rubies, Void Sapphires, Terra Emeralds, or Aether Diamonds at the Cosmic Star-Anvil or Aetherial Crucible.', 'log-solari', 'chat');
      spawnFCT(player.x, player.y - 14, '💎 CRAFT GEMS AT COSMIC ANVIL!', '#38bdf8');
      return;
    }
    window._preferredGemSocket = preferredSocket;
    window.equipInventorySlot(gemIdx);
  };

  window.dropInventorySlot = function (slotIndex) {
    const inv = localProfile.inventory || [];
    const idx = Number(slotIndex);
    if (idx < 0 || idx >= inv.length) return;
    const it = inv[idx];
    const itId = typeof it === 'string' ? it : it?.id;
    const def = EQUIPMENT_CATALOG[itId];

    if (net.connected) {
      net.send({ type: 'drop_inventory_item', slotIndex: idx });
    }

    inv.splice(idx, 1);
    localProfile.inventory = inv;
    saveProgressionLocal();
    lootSeq++;
    lootDrops.push({
      id: `loot_off_${lootSeq}`,
      kind: 'item',
      itemId: itId,
      x: player.x,
      y: player.y,
      ttl: 60,
      age: 0,
    });
    audio.playPickup();
    spawnFCT(player.x, player.y - 14, `DROPPED ${def?.name?.toUpperCase() || 'ITEM'}`, '#94a3b8');
    renderInventoryModal({ profile: localProfile });
  };

  // ==========================================
  // Functional AetherSwap Continental Exchange Handlers
  // ==========================================
  window.switchExchangeTab = function (tab) {
    setExchangeTab(tab);
    renderExchangeModal({ profile: localProfile });
  };

  window.setExchangeFilter = function (query) {
    setExchangeFilterQuery(query);
    renderExchangeModal({ profile: localProfile });
  };

  window.setExchangeCategory = function (cat) {
    setExchangeCategoryFilter(cat);
    renderExchangeModal({ profile: localProfile });
  };

  window.closeExchangeOrderDialog = function () {
    setExchangeOrderDialog(null);
    renderExchangeModal({ profile: localProfile });
  };

  window.adjustOrderQty = function (delta) {
    const d = getActiveOrderDialog();
    if (!d) return;
    d.qty = Math.max(1, (d.qty || 1) + delta);
    renderExchangeModal({ profile: localProfile });
  };

  window.setOrderQty = function (val) {
    const d = getActiveOrderDialog();
    if (!d) return;
    d.qty = Math.max(1, parseInt(val, 10) || 1);
    renderExchangeModal({ profile: localProfile });
  };

  window.adjustOrderPrice = function (delta) {
    const d = getActiveOrderDialog();
    if (!d) return;
    d.unitPrice = Math.max(1, (d.unitPrice || 1) + delta);
    renderExchangeModal({ profile: localProfile });
  };

  window.setOrderPrice = function (val) {
    const d = getActiveOrderDialog();
    if (!d) return;
    d.unitPrice = Math.max(1, parseInt(val, 10) || 1);
    renderExchangeModal({ profile: localProfile });
  };

  window.resetOrderToGuidePrice = function () {
    const d = getActiveOrderDialog();
    if (!d) return;
    d.unitPrice = getItemGuidePrice(d.itemId);
    renderExchangeModal({ profile: localProfile });
  };

  window.startExchangeBuy = function (slot) {
    setExchangeTab('search');
    renderExchangeModal({ profile: localProfile });
  };

  window.startExchangeBuyWithItem = function (itemId) {
    const offers = getExchangeOffers();
    const emptySlotObj = offers.find((o) => !o.type);
    const targetSlot = emptySlotObj ? emptySlotObj.slot : 1;
    setExchangeOrderDialog({
      mode: 'BUY',
      slot: targetSlot,
      itemId,
      qty: 1,
      unitPrice: getItemGuidePrice(itemId),
    });
    setExchangeTab('listings');
    renderExchangeModal({ profile: localProfile });
  };

  window.startExchangeSell = function (slot) {
    const tradable = (localProfile?.inventory || []).find((it) => {
      const id = typeof it === 'string' ? it : it?.id;
      return id && id !== 'solar_gold';
    });
    if (!tradable) {
      logMessage('🎒 [AetherSwap] No tradable items in your 28-slot backpack to sell!', 'log-combat');
      spawnFCT(player.x, player.y - 14, 'NO TRADABLE ITEMS', '#ef4444');
      return;
    }
    const id = typeof tradable === 'string' ? tradable : tradable.id;
    window.startExchangeSellWithItem(id, slot);
  };

  window.startExchangeSellWithItem = function (itemId, slot = null) {
    const offers = getExchangeOffers();
    const targetSlot = slot || (offers.find((o) => !o.type)?.slot || 1);
    const inBag = countItemInBackpack(localProfile, itemId);
    if (inBag <= 0) {
      logMessage(`🎒 [AetherSwap] You do not have any ${EQUIPMENT_CATALOG[itemId]?.name || itemId} in your backpack!`, 'log-combat');
      return;
    }
    setExchangeOrderDialog({
      mode: 'SELL',
      slot: targetSlot,
      itemId,
      qty: Math.min(inBag, 1),
      unitPrice: getItemGuidePrice(itemId),
    });
    setExchangeTab('listings');
    renderExchangeModal({ profile: localProfile });
  };

  window.confirmExchangeOrder = function () {
    const d = getActiveOrderDialog();
    if (!d) return;
    const offers = getExchangeOffers();
    const targetSlot = d.slot || (offers.find((o) => !o.type)?.slot || 1);
    const slotIdx = offers.findIndex((o) => o.slot === targetSlot);
    if (slotIdx === -1) return;

    const itemDef = EQUIPMENT_CATALOG[d.itemId];
    const totalCost = d.qty * d.unitPrice;

    if (d.mode === 'BUY') {
      const currentGold = getPlayerGold(localProfile);
      if (currentGold < totalCost) {
        logMessage(`❌ [AetherSwap] Insufficient Solar Gold Sovereigns (Need ${totalCost} 🪙, Have ${currentGold} 🪙)!`, 'log-combat');
        return;
      }
      deductPlayerGold(localProfile, totalCost);
      offers[slotIdx] = {
        slot: targetSlot,
        type: 'BUY',
        itemId: d.itemId,
        qty: d.qty,
        filledQty: 0,
        unitPrice: d.unitPrice,
        totalPrice: totalCost,
        progress: 10,
        completed: false,
        createdAt: Date.now(),
      };
      saveExchangeOffers(offers);
      setExchangeOrderDialog(null);
      audio.playShield();
      spawnFCT(player.x, player.y - 14, `BUY ORDER PLACED (${totalCost} 🪙)`, '#38bdf8');
      logMessage(`🌀 [AetherSwap] Placed Buy Offer in Box #${targetSlot}: ${d.qty}x ${itemDef?.name || d.itemId} @ ${d.unitPrice} 🪙 each.`, 'log-solari', 'chat');
    } else {
      const inBag = countItemInBackpack(localProfile, d.itemId);
      if (inBag < d.qty) {
        logMessage(`❌ [AetherSwap] Insufficient items in backpack (Need ${d.qty}, Have ${inBag})!`, 'log-combat');
        return;
      }
      removeItemFromBackpack(localProfile, d.itemId, d.qty);
      offers[slotIdx] = {
        slot: targetSlot,
        type: 'SELL',
        itemId: d.itemId,
        qty: d.qty,
        filledQty: 0,
        unitPrice: d.unitPrice,
        totalPrice: totalCost,
        progress: 15,
        completed: false,
        createdAt: Date.now(),
      };
      saveExchangeOffers(offers);
      setExchangeOrderDialog(null);
      audio.playShield();
      spawnFCT(player.x, player.y - 14, `SELL ORDER PLACED (${d.qty}x)`, '#f59e0b');
      logMessage(`🌀 [AetherSwap] Placed Sell Offer in Box #${targetSlot}: ${d.qty}x ${itemDef?.name || d.itemId} @ ${d.unitPrice} 🪙 each.`, 'log-solari', 'chat');
    }

    renderInventoryModal({ profile: localProfile });
    renderExchangeModal({ profile: localProfile });
  };

  window.collectExchangeOffer = function (slot) {
    const offers = getExchangeOffers();
    const o = offers.find((offer) => offer.slot === slot);
    if (!o || !o.completed || !o.type) return;

    const itemDef = EQUIPMENT_CATALOG[o.itemId];
    if (o.type === 'BUY') {
      const success = addItemToBackpack(localProfile, o.itemId, o.qty);
      if (!success) {
        logMessage('🎒 [AetherSwap] Backpack full! Clear space before collecting items.', 'log-combat');
        spawnFCT(player.x, player.y - 14, 'BACKPACK FULL (28/28)', '#ef4444');
        return;
      }
      logMessage(`🌀 [AetherSwap] Collected ${o.qty}x ${itemDef?.name || o.itemId} from Offer Box #${slot}!`, 'log-solari', 'chat');
      spawnFCT(player.x, player.y - 14, `+${o.qty}x ${itemDef?.name || 'ITEM'}`, '#4ade80', true);
    } else {
      addPlayerGold(localProfile, o.totalPrice);
      logMessage(`🌀 [AetherSwap] Collected ${o.totalPrice} Solar Gold Sovereigns from completed sale in Box #${slot}!`, 'log-solari', 'chat');
      spawnFCT(player.x, player.y - 14, `+${o.totalPrice} 🪙 SOVEREIGNS`, '#facc15', true);
    }

    o.type = null;
    o.itemId = null;
    o.qty = 0;
    o.filledQty = 0;
    o.unitPrice = 0;
    o.totalPrice = 0;
    o.progress = 0;
    o.completed = false;
    saveExchangeOffers(offers);

    audio.playPickup();
    renderInventoryModal({ profile: localProfile });
    renderExchangeModal({ profile: localProfile });
  };

  window.abortExchangeOffer = function (slot) {
    const offers = getExchangeOffers();
    const o = offers.find((offer) => offer.slot === slot);
    if (!o || !o.type) return;

    const itemDef = EQUIPMENT_CATALOG[o.itemId];
    if (o.type === 'BUY') {
      addPlayerGold(localProfile, o.totalPrice);
      logMessage(`🌀 [AetherSwap] Aborted Buy Offer #${slot}. Refunded ${o.totalPrice} Solar Gold Sovereigns.`, 'log-solari', 'chat');
      spawnFCT(player.x, player.y - 14, `REFUNDED ${o.totalPrice} 🪙`, '#38bdf8');
    } else {
      addItemToBackpack(localProfile, o.itemId, o.qty);
      logMessage(`🌀 [AetherSwap] Aborted Sell Offer #${slot}. Returned ${o.qty}x ${itemDef?.name || o.itemId} to backpack.`, 'log-solari', 'chat');
      spawnFCT(player.x, player.y - 14, `RETURNED ${itemDef?.name || 'ITEMS'}`, '#fed7aa');
    }

    o.type = null;
    o.itemId = null;
    o.qty = 0;
    o.filledQty = 0;
    o.unitPrice = 0;
    o.totalPrice = 0;
    o.progress = 0;
    o.completed = false;
    saveExchangeOffers(offers);

    audio.playHurt();
    renderInventoryModal({ profile: localProfile });
    renderExchangeModal({ profile: localProfile });
  };

  setInterval(() => {
    tickExchangeOffers(localProfile);
  }, 3000);

  window.setHoveredEquipment = setHoveredEquipment;
  window.clearHoveredEquipment = clearHoveredEquipment;
  window.updateHoveredEquipmentPos = updateFloatingGearTooltipPos;
  window.hideHoveredEquipmentTooltip = hideFloatingGearTooltip;

  window.assignSlotAbilityInGame = function (slot, abilityId) {
    const numericSlot = Number(slot);
    if (!ACTION_SLOTS.includes(numericSlot)) return;
    if (!abilityId) {
      window.clearActionSlot(numericSlot);
      return;
    }
    const ab = ABILITIES_CATALOG[abilityId];
    if (!ab) return;
    if (!slotAcceptsAbility(numericSlot, ab.id)) {
      audio.playHurt();
      return;
    }
    const rank = getAbilityRank(prog, ab.id);
    if (rank < 1) {
      logMessage(`🔒 Must allocate a Skill Point in ${ab.name} in the Skill Tree [P] before equipping!`, 'log-combat');
      audio.playHurt();
      return;
    }
    pendingAssign = null;
    quickPickSlot = null;

    const nextLoadout = { ...(localProfile.loadout || {}) };
    const displacedAbId = nextLoadout[numericSlot] ?? nextLoadout[String(numericSlot)] ?? null;

    // Find if this ability was already equipped in another slot so we move/swap instead of duplicating
    let prevSlot = null;
    for (const s of ACTION_SLOTS) {
      const curId = nextLoadout[s] ?? nextLoadout[String(s)];
      if (curId === ab.id && s !== numericSlot) {
        prevSlot = s;
        break;
      }
    }

    if (prevSlot !== null) {
      delete nextLoadout[prevSlot];
      delete nextLoadout[String(prevSlot)];
      if (displacedAbId && displacedAbId !== ab.id) {
        nextLoadout[prevSlot] = displacedAbId;
        if (prog.ranks) prog.ranks[prevSlot] = getAbilityRank(prog, displacedAbId);
      } else if (prog.ranks) {
        delete prog.ranks[prevSlot];
      }
    }

    delete nextLoadout[String(numericSlot)];
    nextLoadout[numericSlot] = ab.id;
    localProfile.loadout = nextLoadout;
    if (!prog.skills) prog.skills = {};
    if (!prog.skills[ab.id]) prog.skills[ab.id] = rank;
    if (prog.ranks) {
      prog.ranks[numericSlot] = rank;
    }
    actionBarSignature = '';
    audio.playSpell();
    updateActionBarBadges();
    renderKeybindUI();
    if (typeof renderSkillTreeUI === 'function') renderSkillTreeUI();
    saveProgressionLocal();
    if (net.connected) {
      net.send({ type: 'update_loadout', loadout: localProfile.loadout });
    }
    const keyTxt = formatKeyLabel(keybinds[numericSlot]);
    if (prevSlot !== null) {
      logMessage(`[Action Bar] Moved ${ab.name} from [${formatKeyLabel(keybinds[prevSlot])}] → Slot ${numericSlot} [${keyTxt}].`, 'log-gain');
    } else {
      logMessage(`[Action Bar] Equipped ${ab.name} in Slot ${numericSlot} [${keyTxt}].`, 'log-gain');
    }
  };

  window.assignItemToSlot = function (slot, itemId) {
    const s = Number(slot);
    if (!ITEM_ACTION_SLOTS.includes(s)) return;
    if (!itemId) {
      delete actionBarItems[s];
    } else {
      const item = EQUIPMENT_CATALOG[itemId];
      if (!item || item.slot === 'currency') return;
      actionBarItems[s] = itemId;
    }
    saveActionBarItems();
    actionBarSignature = '';
    updateActionBarBadges();
    renderKeybindUI();
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
    const orderTag = document.getElementById('prof-order-tag')?.value?.trim();
    const orderName = document.getElementById('prof-order-name')?.value?.trim();
    try {
      const updated = await net.updateProfile({
        faction: localProfile.faction,
        orderTag,
        orderName,
        orderColor: localProfile.orderColor,
      });
      applyProfile(updated);
      audio.playChime();
      accountStatusMsg = '✓ Order Banner & Faction saved!';
    } catch (err) {
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
        if (localStorage.getItem('glimmerfall_remember_me') !== 'false') {
          try {
            localStorage.setItem('glimmerfall_saved_username', username);
            localStorage.setItem('glimmerfall_saved_password', password);
          } catch (_) {}
        }
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
        if (localStorage.getItem('glimmerfall_remember_me') !== 'false') {
          try {
            localStorage.setItem('glimmerfall_saved_username', username);
            localStorage.setItem('glimmerfall_saved_password', password);
          } catch (_) {}
        }
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
      const isLast = dialogueIdx >= activeDialoguePages.length - 1;
      const hasShopAction = isLast && page.actions?.some((act) => act.action === 'openShop');
      btn.innerText = !isLast
        ? `NEXT (${dialogueIdx + 1}/${activeDialoguePages.length}) ▸`
        : hasShopAction ? 'BEGIN TRAINING ✓' : 'CLOSE ✓';
    }

    const actionsEl = document.getElementById('dlg-actions');
    if (actionsEl) {
      if (page.actions && page.actions.length > 0) {
        actionsEl.style.display = 'flex';
        actionsEl.innerHTML = page.actions.map((act, i) => `
          <button class="util-btn" style="${act.style || 'font-size:8.5px; padding:3px 7px;'}" onclick="window.handleDialogueAction(${i})">
            ${act.label}
          </button>
        `).join('');
      } else {
        actionsEl.style.display = 'none';
        actionsEl.innerHTML = '';
      }
    }

    const key = page.spriteKey || activeDialogueSpriteKey || 'heraldNpc';
    updateNpcPortrait(key);
  }

  window.handleDialogueAction = function (actIdx) {
    const page = activeDialoguePages[dialogueIdx];
    if (!page || !page.actions || !page.actions[actIdx]) return;
    const act = page.actions[actIdx];
    audio.playDialogue();
    if (act.action === 'openShop') {
      const merchantId = page.merchantId || activeDialogueNpcId || 'merchant_apothecary';
      if (merchantId === 'merchant_smith') questState.smithInspected = true;
      if (merchantId === 'merchant_apothecary') questState.apothecaryInspected = true;
      if (merchantId === 'merchant_provisions') questState.provisionsInspected = true;
      if (merchantId === 'merchant_relics') questState.relicsInspected = true;
      saveQuestState();
      updateQuestTrackerHUD();
      window.closeDialogue();
      openMerchantShop(merchantId);
    } else if (act.action && act.action.startsWith('openStation_')) {
      const stId = act.action.replace('openStation_', '');
      window.closeDialogue();
      if (typeof window.openCraftingModal === 'function') {
        window.openCraftingModal(stId);
      }
    } else if (act.action === 'openSkills') {
      window.closeDialogue();
      window.toggleSkillsTab();
    } else if (act.action === 'advance') {
      window.advanceDialogue();
    } else if (act.action === 'prev') {
      if (dialogueIdx > 0) {
        dialogueIdx--;
        renderDialogueBox();
      }
    } else if (act.action && act.action.startsWith('remoteTurnIn_')) {
      const qId = act.action.replace('remoteTurnIn_', '');
      window.closeDialogue();
      window.turnInQuestRemote(qId);
    } else if (act.action === 'close') {
      window.closeDialogue();
    }
  };

  window.advanceDialogue = function () {
    audio.playDialogue();
    const currentPage = activeDialoguePages[dialogueIdx];
    if (currentPage && dialogueIdx >= activeDialoguePages.length - 1) {
      const shopActionIdx = currentPage.actions?.findIndex((act) => act.action === 'openShop') ?? -1;
      if (shopActionIdx >= 0) {
        window.handleDialogueAction(shopActionIdx);
        return;
      }
    }
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
    updateQuestTrackerHUD();
  };

  // ==========================================
  // XP, Stats & Skill Ranks
  // ==========================================
  function awardXP(amount, reason = '') {
    if (amount <= 0) return;
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

  function grantProfessionMasteryCape(professionId, profName) {
    if (net.connected) return false;
    const prof = prog?.professions?.[professionId];
    const capeId = PROFESSION_MASTERY_CAPES[professionId];
    if (!prof || !capeId || prof.masteryCapeAwarded) return false;
    if (getProfessionLevelFromXp(prof.xp || 0) < 99) return false;
    const ownsCape = (localProfile.inventory || []).some((it) => (typeof it === 'string' ? it : it?.id) === capeId);
    if (!ownsCape && !addItemToBackpack(localProfile, capeId, 1)) {
      logMessage(`🏆 [Mastery] ${profName} reached Level 99, but your backpack is full. Free a slot and train once more to claim the skillcape.`, 'log-gain', 'chat');
      return false;
    }
    prof.masteryCapeAwarded = true;
    const cape = EQUIPMENT_CATALOG[capeId];
    spawnSparkBurst(player.x, player.y - 12, ['#facc15', '#ffffff', '#38bdf8'], 36);
    spawnFCT(player.x, player.y - 18, `🏆 ${cape?.name?.toUpperCase() || 'SKILLCAPE'} CLAIMED!`, '#facc15', true);
    logMessage(`🏆 [MASTERY] ${profName} Level 99 reached! ${cape?.name || 'Skillcape'} added to your backpack.`, 'log-gain', 'chat');
    if (audio?.playQuestCompleteFanfare) audio.playQuestCompleteFanfare();
    else audio?.playLevelUp?.();
    return true;
  }

  function awardProfessionXP(professionId, amount, reason = '', syncToServer = false) {
    if (!amount || amount <= 0) return;
    if (!prog.professions) {
      prog.professions = {
        resonance_extraction: { xp: 0, level: 1 },
        relic_forging: { xp: 0, level: 1 },
        rite_binding: { xp: 0, level: 1 },
        glimmerweaving: { xp: 0, level: 1 },
        combat_mastery: { xp: 0, level: 1 },
        rites: { xp: 0, level: 1 },
        flashes: { xp: 0, level: 1 },
      };
    }
    if (!prog.professions[professionId]) {
      prog.professions[professionId] = { xp: 0, level: 1 };
    }
    const prof = prog.professions[professionId];
    if (!prof) return;

    const oldLevel = prof.level || getProfessionLevelFromXp(prof.xp || 0);
    prof.xp = (prof.xp || 0) + amount;
    const newLevel = getProfessionLevelFromXp(prof.xp);
    prof.level = newLevel;

    const pInfo = PROFESSIONS_CATALOG[professionId];
    const profName = pInfo?.name || professionId;

    if (newLevel > oldLevel) {
      audio.playLevelUp?.();
      spawnSparkBurst(player.x, player.y - 12, [pInfo?.color || '#38bdf8', '#ffffff', '#fde047'], 28);
      spawnFCT(player.x, player.y - 16, `🎉 ${profName.toUpperCase()} LVL ${newLevel}!`, pInfo?.color || '#38bdf8', true);
      logMessage(`🎉 [SKILL LEVEL UP!] You achieved ${profName} Level ${newLevel}! Total Skill Level: ${getTotalProfessionLevel(prog.professions)}`, 'log-gain', 'chat');
    } else {
      spawnFCT(player.x, player.y - 14, `+${amount} ${profName} XP`, pInfo?.color || '#38bdf8', false);
      if (reason) {
        logMessage(`✨ Gained ${amount} ${profName} XP (${reason}).`, 'log-gain', 'combat');
      }
    }

    if (!net.connected) grantProfessionMasteryCape(professionId, profName);
    saveProgressionLocal();
    if (net.connected && syncToServer) {
      net.send({ type: 'sync_profession_progress', professions: prog.professions });
    }
    window.renderSkillsTabUI?.();
  }
  window.awardProfessionXP = awardProfessionXP;
  window.getLocalProgression = () => prog;

  // ==========================================
  // Cosmic Artisan Stations & Crafting Loop
  // ==========================================
  window.openCraftingModal = function (stationId = 'cosmic_anvil') {
    stopCraftingQueue();
    const modal = document.getElementById('crafting-modal');
    if (!modal) return;
    document.querySelectorAll('.modal').forEach((m) => {
      if (m.id !== 'crafting-modal') m.style.display = 'none';
    });
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.style.display = 'flex';
    modal.style.display = 'block';
    renderCraftingModal(stationId);
    audio.playChime?.();
  };

  window.closeCraftingModal = function () {
    stopCraftingQueue();
    const modal = document.getElementById('crafting-modal');
    if (modal) modal.style.display = 'none';
    const anyOpen = Array.from(document.querySelectorAll('.modal')).some((m) => m.style.display === 'block');
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop && !anyOpen) backdrop.style.display = 'none';
  };

  window.selectCraftingStation = selectCraftingStation;
  window.selectCraftingCategory = selectCraftingCategory;
  window.selectCraftingRecipe = selectCraftingRecipe;
  window.startCraftingBatch = startCraftingBatch;
  window.stopCraftingQueue = stopCraftingQueue;

  window.performCraftRecipe = function (recipeId) {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe || !localProfile) return false;
    const outItem = EQUIPMENT_CATALOG[recipe.outputId];
    if (!outItem) return false;

    const reqLvl = recipe.reqLevel || 1;
    const profXp = Math.max(0, Math.floor(Number(prog?.professions?.[recipe.profession]?.xp) || 0));
    const profLvl = getProfessionLevelFromXp(profXp);
    if (profLvl < reqLvl) {
      const pName = PROFESSIONS_CATALOG[recipe.profession]?.name || recipe.profession;
      spawnFCT(player.x, player.y - 14, `NEED ${pName.toUpperCase()} LV.${reqLvl}!`, '#ef4444');
      audio.playHurt?.();
      return false;
    }

    const inv = Array.isArray(localProfile.inventory) ? localProfile.inventory : [];
    // Verify all ingredients exist
    let freedSlots = 0;
    for (const ing of recipe.ingredients) {
      const ingId = ing.id || ing.itemId;
      let have = 0;
      for (const slot of inv) {
        const id = typeof slot === 'string' ? slot : slot?.id;
        if (id === ingId) have += typeof slot === 'object' && slot.qty ? slot.qty : 1;
      }
      if (have < ing.qty) {
        const iname = EQUIPMENT_CATALOG[ingId]?.name || ingId;
        spawnFCT(player.x, player.y - 14, `MISSING ${iname.toUpperCase()}!`, '#ef4444');
        audio.playHurt?.();
        return false;
      }
      if (have === ing.qty) freedSlots++;
    }

    const outQty = recipe.outputQty || 1;
    const existingOut = outItem.stackable && inv.some((s) => (typeof s === 'string' ? s : s?.id) === recipe.outputId);
    const neededSlots = existingOut ? 0 : (outItem.stackable ? 1 : outQty);
    if (inv.length - freedSlots + neededSlots > 28) {
      spawnFCT(player.x, player.y - 14, '🎒 BACKPACK IS FULL (28/28)!', '#ef4444');
      audio.playHurt?.();
      return false;
    }

    // Deduct ingredients from backpack
    for (const ing of recipe.ingredients) {
      const ingId = ing.id || ing.itemId;
      let rem = ing.qty;
      for (let i = inv.length - 1; i >= 0 && rem > 0; i--) {
        const slot = inv[i];
        const id = typeof slot === 'string' ? slot : slot?.id;
        if (id !== ingId) continue;
        const curQty = typeof slot === 'object' && slot.qty ? slot.qty : 1;
        if (curQty > rem) {
          if (typeof slot === 'string') inv[i] = { id, qty: curQty - rem };
          else slot.qty = curQty - rem;
          rem = 0;
        } else {
          rem -= curQty;
          inv.splice(i, 1);
        }
      }
    }

    // Add output item(s)
    addItemToBackpack(localProfile, recipe.outputId, outQty);

    // Update quest & bounty state
    questState.craftsCompleted = (questState.craftsCompleted || 0) + 1;
    if (recipe.station === 'cosmic_anvil') questState.smithInspected = true;
    if (recipe.station === 'aether_crucible') questState.apothecaryInspected = true;
    if (recipe.station === 'celestial_loom') questState.provisionsInspected = true;
    advanceBountyProgress('crafts', 1);

    if (net.connected) {
      net.send({ type: 'craft_recipe', recipeId: recipe.id });
    } else {
      awardProfessionXP(recipe.profession, recipe.xp, outItem.name, false);
    }

    saveQuestState();
    saveProgressionLocal();

    audio.playShield?.();
    audio.playChime?.();
    const stationColor = CRAFTING_STATIONS[recipe.station]?.color || '#fde047';
    spawnSparkBurst(player.x, player.y - 10, [stationColor, '#fde047', '#ffffff'], 16);
    spawnFCT(player.x, player.y - 22, `✦ +${outQty}x ${outItem.name.toUpperCase()}`, stationColor, true);
    logMessage(`🔨 [Artisan Craft] Created ${outQty}x ${outItem.name}!`, 'log-gain', 'combat');

    updatePlayerUI();
    updateQuestTrackerHUD();
    if (document.getElementById('inventory-modal')?.style.display === 'block') {
      renderInventoryModal({ profile: localProfile });
    }
    return true;
  };

  // ==========================================
  // Vanguard Bounty Board Contracts (Repeatable)
  // ==========================================
  function ensureBountyState() {
    if (!questState.bounties || typeof questState.bounties !== 'object') {
      questState.bounties = {};
    }
    return questState.bounties;
  }

  window.getBountyBoardState = function () {
    return ensureBountyState();
  };

  window.openBountyBoard = function () {
    const modal = document.getElementById('bounty-modal');
    if (!modal) return;
    document.querySelectorAll('.modal').forEach((m) => {
      if (m.id !== 'bounty-modal') m.style.display = 'none';
    });
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.style.display = 'flex';
    modal.style.display = 'block';
    renderBountyModal();
    audio.playChime?.();
  };

  window.acceptBountyContract = function (bountyId) {
    const contract = BOUNTY_CONTRACTS.find((c) => c.id === bountyId);
    if (!contract) return;
    const bs = ensureBountyState();
    const prev = bs[contract.id] || {};
    bs[contract.id] = {
      active: true,
      progress: 0,
      completions: Number(prev.completions) || 0,
    };
    saveQuestState();
    audio.playChime?.();
    spawnFCT(player.x, player.y - 14, `📜 CONTRACT: ${contract.title.toUpperCase()}`, '#facc15', true);
    logMessage(`📜 [Bounty Accepted] ${contract.title}: ${contract.desc}`, 'log-quest', 'chat');
    renderBountyModal();
  };

  function advanceBountyProgress(kind, amount = 1) {
    const bs = ensureBountyState();
    let updatedAny = false;
    for (const contract of BOUNTY_CONTRACTS) {
      if (contract.kind !== kind) continue;
      const entry = bs[contract.id];
      if (!entry || !entry.active) continue;
      const prev = Number(entry.progress) || 0;
      if (prev >= contract.targetCount) continue;
      entry.progress = Math.min(contract.targetCount, prev + amount);
      updatedAny = true;
      if (entry.progress >= contract.targetCount && prev < contract.targetCount) {
        audio.playChime?.();
        spawnFCT(player.x, player.y - 18, `🏆 BOUNTY READY: ${contract.title.toUpperCase()}!`, '#4ade80', true);
        logMessage(`🏆 [Bounty Complete] "${contract.title}" (${entry.progress}/${contract.targetCount})! Claim your reward at the Vanguard Bounty Board!`, 'log-quest', 'chat');
      }
    }
    if (updatedAny) {
      saveQuestState();
      if (document.getElementById('bounty-modal')?.style.display === 'block') {
        renderBountyModal();
      }
    }
  }

  window.claimBountyContract = function (bountyId) {
    const bs = ensureBountyState();
    const contract = BOUNTY_CONTRACTS.find((c) => c.id === bountyId);
    const entry = contract ? bs[contract.id] : null;
    if (!contract || !entry || !entry.active || (entry.progress || 0) < contract.targetCount) return;

    const inv = Array.isArray(localProfile?.inventory) ? localProfile.inventory : [];
    const rewardItems = Array.isArray(contract.rewardItems) ? contract.rewardItems : [];
    let newSlotsNeeded = 0;
    for (const ri of rewardItems) {
      const rDef = EQUIPMENT_CATALOG[ri.id];
      if (!rDef) continue;
      const hasStack = rDef.stackable && inv.some((s) => (typeof s === 'string' ? s : s?.id) === ri.id);
      if (!hasStack) newSlotsNeeded += rDef.stackable ? 1 : (ri.qty || 1);
    }
    if (inv.length + newSlotsNeeded > 28) {
      spawnFCT(player.x, player.y - 14, `🎒 FREE ${newSlotsNeeded} BACKPACK SLOT(S) TO CLAIM!`, '#ef4444');
      audio.playHurt?.();
      return;
    }

    entry.active = false;
    entry.progress = 0;
    entry.completions = (Number(entry.completions) || 0) + 1;
    saveQuestState();

    addPlayerGold(localProfile, contract.rewardGold || 0);
    for (const ri of rewardItems) {
      if (EQUIPMENT_CATALOG[ri.id]) {
        addItemToBackpack(localProfile, ri.id, ri.qty || 1);
      }
    }

    if (net.connected) {
      net.send({ type: 'claim_bounty', bountyId: contract.id });
    } else {
      awardXP(contract.rewardXp || 50, `Bounty: ${contract.title}`);
      if (contract.rewardProf?.id && contract.rewardProf?.xp) {
        awardProfessionXP(contract.rewardProf.id, contract.rewardProf.xp, contract.title, false);
      }
    }

    saveProgressionLocal();
    audio.playQuestCompleteFanfare ? audio.playQuestCompleteFanfare() : audio.playLevelUp?.();
    spawnSparkBurst(player.x, player.y - 12, ['#fde047', '#4ade80', '#38bdf8', '#ffffff'], 30);
    spawnFCT(player.x, player.y - 18, `🏆 BOUNTY CLAIMED! +${contract.rewardGold} GOLD`, '#fde047', true);
    const itemsSummary = rewardItems.map((ri) => `+${ri.qty}x ${EQUIPMENT_CATALOG[ri.id]?.name || ri.id}`).join(', ');
    logMessage(`🏆 [Bounty Claimed] Completed "${contract.title}" (+${contract.rewardXp} XP, +${contract.rewardGold} Solar Gold${itemsSummary ? `, ${itemsSummary}` : ''})!`, 'log-quest', 'chat');
    updatePlayerUI();
    renderBountyModal();
    if (document.getElementById('inventory-modal')?.style.display === 'block') {
      renderInventoryModal({ profile: localProfile });
    }
  };

  setupSkillGuidesUi({ getProg: () => prog, audio, toggleModal: (id) => window.toggleModal(id) });

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

    hudEl.classList.toggle('in-arena', resolvedRoomType === ROOM_TYPES.ARENA_3V3);
    hudEl.classList.toggle('in-siege', resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE);
    if (siegeBanner) {
      siegeBanner.style.display = resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE ? 'block' : 'none';
    }

    if (resolvedRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'SANCTUARY METROPOLIS #1';
      if (zoneLabel) zoneLabel.innerText = 'Sanctuary Haven';
      arenaBanner.style.display = 'none';

      // ==========================================
      // COZY, VIBRANT SANCTUARY HOMETOWN & HAVEN PROPS
      // ==========================================
      props.push(
        // 1. Awakening Homecoming Plaza & Spawn Courtyard (Right around spawn 0, 96)
        { type: 'ancientWell', x: 64, y: 112 },
        { type: 'solariSundial', x: 0, y: 152 },
        { type: 'flowerBed', x: -92, y: 72 },
        { type: 'flowerBed', x: 92, y: 72 },
        { type: 'flowerBed', x: -92, y: 138 },
        { type: 'flowerBed', x: 92, y: 138 },
        { type: 'streetLantern', x: -34, y: 62 },
        { type: 'streetLantern', x: 34, y: 62 },
        { type: 'streetLantern', x: -34, y: 142 },
        { type: 'streetLantern', x: 34, y: 142 },
        { type: 'blossomTree', x: -118, y: 58 },
        { type: 'blossomTree', x: 118, y: 58 },
        { type: 'blossomTree', x: -118, y: 152 },
        { type: 'blossomTree', x: 118, y: 152 },

        // 2. Grand Central Starlight Fountain Plaza (Center 0, -10)
        { type: 'grandFountain', x: 0, y: -10 },
        { type: 'stoneBench', x: -46, y: -32 },
        { type: 'stoneBench', x: 46, y: -32 },
        { type: 'stoneBench', x: -46, y: 16 },
        { type: 'stoneBench', x: 46, y: 16 },
        { type: 'brazier', x: -34, y: -58 },
        { type: 'brazier', x: 34, y: -58 },
        { type: 'brazier', x: -68, y: -10 },
        { type: 'brazier', x: 68, y: -10 },
        { type: 'streetLantern', x: -72, y: -52 },
        { type: 'streetLantern', x: 72, y: -52 },
        { type: 'bountyBoard', isBountyBoard: true, x: -54, y: -72, label: '📜 Vanguard Bounty Board [Click / E]' },
        { type: 'flowerBed', x: -108, y: -52 },
        { type: 'flowerBed', x: 108, y: -52 },

        // 3. North Civic Terrace: Grand AetherSwap Exchange & Grand AetherVault Bank
        { type: 'bankBuilding', x: -115, y: -155, label: '🏛️ The Grand AetherSwap Exchange' },
        { type: 'bankCounter', x: -115, y: -105 },
        { type: 'streetLantern', x: -155, y: -105 },
        { type: 'streetLantern', x: -75, y: -105 },
        { type: 'bankBuilding', x: 115, y: -155, label: '🏛️ The Grand AetherVault Bank' },
        { type: 'bankCounter', x: 115, y: -105 },
        { type: 'streetLantern', x: 75, y: -105 },
        { type: 'streetLantern', x: 155, y: -105 },
        { type: 'stoneBench', x: 0, y: -125 },
        { type: 'blossomTree', x: -185, y: -155 },
        { type: 'blossomTree', x: 185, y: -155 },

        // 4. Cozy Hometown Cottages & Guildhalls Framing the Town Square
        { type: 'cityHouseA', x: -255, y: -135 },
        { type: 'cityHouseB', x: 255, y: -135 },
        { type: 'cityHouseA', x: -275, y: 95 },
        { type: 'cityHouseB', x: 275, y: 95 },
        { type: 'cityHouseA', x: -175, y: -255 },
        { type: 'cityHouseB', x: -65, y: -255 },
        { type: 'cityHouseA', x: 65, y: -255 },
        { type: 'cityHouseB', x: 175, y: -255 },
        { type: 'streetLantern', x: -120, y: -215 },
        { type: 'streetLantern', x: 0, y: -215 },
        { type: 'streetLantern', x: 120, y: -215 },

        // 5. West Artisan Workshop & Market Courtyard (Spacious bays with paired crafting partners)
        // 5A. Textile & Provisions Bay (Loom & Pantry grouped together)
        { type: 'celestialLoom', stationId: 'celestial_loom', x: -225, y: -54, label: '🧵 Celestial Loom [Click / E]' },
        { type: 'marketStallProvisions', id: 'stall_provisions', x: -170, y: -54 },
        { type: 'streetLantern', x: -135, y: -54 },

        // 5B. Blacksmithing & Foundry Bay (Forge workbench & Cosmic Star-Anvil grouped together)
        { type: 'marketStallSmith', x: -225, y: 28 },
        { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: -170, y: 28, label: '🔨 Cosmic Star-Anvil [Click / E]' },
        { type: 'brazier', x: -260, y: 28 },

        // 5C. Alchemy & Crucible Terrace (Dedicated elixir station)
        { type: 'aetherCrucible', stationId: 'aether_crucible', x: -198, y: 110, label: '⚗️ Aetherial Crucible [Click / E]' },
        { type: 'streetLantern', x: -135, y: 110 },
        { type: 'brazier', x: -250, y: 110 },

        // 6. East Combat Trial Courtyard (Right beside Central Plaza!)
        { type: 'pillar', x: 145, y: -35 },
        { type: 'pillar', x: 235, y: -35 },
        { type: 'brazier', x: 145, y: 75 },
        { type: 'brazier', x: 235, y: 75 },
        { type: 'stoneBench', x: 190, y: -52 },

        // 7. South Memorial Gardens & Starter Skilling Groves
        { type: 'monument', x: 0, y: 245 },
        { type: 'stoneBench', x: -45, y: 245 },
        { type: 'stoneBench', x: 45, y: 245 },
        { type: 'blossomTree', x: -85, y: 215 },
        { type: 'blossomTree', x: 85, y: 215 },
        { type: 'ancientOak', x: -185, y: 235 },
        { type: 'ancientOak', x: 185, y: 235 },
        { type: 'mountainCrag', x: -245, y: 185 },
        { type: 'mountainCrag', x: 245, y: 185 },
        { type: 'flowerBed', x: -145, y: 245 },
        { type: 'flowerBed', x: 145, y: 245 },
        { type: 'streetLantern', x: -42, y: 205 },
        { type: 'streetLantern', x: 42, y: 205 },

        // 8. Four Cardinal City Gateways
        { type: 'ruinedArch', x: 0, y: -375 },
        { type: 'crystalPillar', x: -55, y: -375 },
        { type: 'crystalPillar', x: 55, y: -375 },
        { type: 'ruinedArch', x: 0, y: 375 },
        { type: 'ancientOak', x: -65, y: 375 },
        { type: 'ancientOak', x: 65, y: 375 },
        { type: 'ruinedArch', x: -410, y: 0 },
        { type: 'brazier', x: -410, y: -42 },
        { type: 'brazier', x: -410, y: 42 },
        { type: 'ruinedArch', x: 410, y: 0 },
        { type: 'umbriBrazierAltar', x: 410, y: -42 },
        { type: 'umbriBrazierAltar', x: 410, y: 42 }
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
          id: 'npc_exchange_caelum',
          name: 'Broker Caelum',
          role: 'Grand Exchange Broker [Click / T]',
          spriteKey: 'bankerNpc',
          x: -115,
          y: -105,
          isExchange: true,
        },
        {
          id: 'npc_bank_orin',
          name: 'Trove-Master Orin',
          role: 'AetherVault Chief Banker [Click / T]',
          spriteKey: 'bankerNpc',
          x: 115,
          y: -105,
          isBank: true,
        },
        {
          id: 'merchant_provisions',
          name: 'Farmer Bran',
          role: 'Provisions & Rations [Click / T]',
          spriteKey: 'merchantProvisionsNpc',
          stallId: 'stall_provisions',
          merchantType: 'merchant_provisions',
          isMerchant: true,
          x: -170,
          y: -24,
        },
        {
          id: 'npc_artisan_aldric',
          name: 'Artisan Master Aldric',
          role: 'Guild Forgemaster [Click / T]',
          spriteKey: 'merchantSmithNpc',
          x: -198,
          y: 52,
          dialogue: [
            {
              speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
              spriteKey: 'merchantSmithNpc',
              text: 'Hail, adventurer! Right here in the Sanctuary Workshop you can train all three crafting professions: smelt ores at the Cosmic Star-Anvil, brew elixirs at the Aetherial Crucible, or spin cloaks at the Celestial Loom.\n\nWhen you travel the four cardinal roads to the peaceful faction capitals, seek out our regional guild merchants—Blacksmith Torvin in the Golden Citadel, Alchemist Faye in Glimmer Orchard, Shadow Stitcher Silvan in the Undercity, and Relic-Seeker Moira at Mirrorgate Spire!',
              actions: [
                { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
                { label: '⚗️ OPEN AETHERIAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff;' },
                { label: '👋 FAREWELL', action: 'close' },
              ],
            },
          ],
        },
        {
          id: 'npc_archon',
          name: 'Commander Valerius',
          role: 'Sunspire Warlord [Click / T]',
          spriteKey: 'warzoneArchonNpc',
          x: 0,
          y: -48,
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

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'campfire', x: -38, y: 145, label: '🔥 Expedition Waystation Hearth' },
        { type: 'woodenSign', x: 78, y: 145, label: '🪧 N: Continental Caldera | S: Sanctuary Haven' },
        { type: 'ancientWell', x: -95, y: 135 },
        { type: 'crystalPillar', x: -140, y: 60 },
        { type: 'crystalPillar', x: 140, y: 60 },
        { type: 'brazier', x: -70, y: 140 },
        { type: 'brazier', x: 70, y: 140 },
        { type: 'brazier', x: -70, y: -140 },
        { type: 'brazier', x: 70, y: -140 },
        { type: 'pillar', x: -160, y: -90 },
        { type: 'pillar', x: 160, y: -90 },
        { type: 'mountainCrag', x: -240, y: 130 },
        { type: 'mountainCrag', x: 240, y: 130 },
        { type: 'ancientOak', x: -250, y: -140 },
        { type: 'ancientOak', x: 250, y: -140 },
        // Grand North Waygate to Continental Caldera Realm
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
    } else if (resolvedRoomType === ROOM_TYPES.STARFALL_CRATER) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'STARFALL METEORITE CRATER & ASTRAL FORGE';
      if (zoneLabel) zoneLabel.innerText = 'To Citadel';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: 56, y: 185, label: '🔨 Astral Star-Anvil [Click / E]' },
        { type: 'bountyBoard', isBountyBoard: true, x: -62, y: 185, label: '📜 Crater Bounty Board [Click / E]' },
        { type: 'campfire', x: -28, y: 205, label: '🔥 Astral Outpost Hearth' },
        { type: 'woodenSign', x: 95, y: 205, label: '🪧 N: Meteorite Impact Basin | S: Solari Citadel' },
        { type: 'mountainCrag', x: -180, y: 80 },
        { type: 'mountainCrag', x: 180, y: 80 },
        { type: 'mountainCrag', x: -210, y: -120 },
        { type: 'mountainCrag', x: 210, y: -120 },
        { type: 'crystalPillar', x: -120, y: -40 },
        { type: 'crystalPillar', x: 120, y: -40 },
        { type: 'brazier', x: -70, y: 160 },
        { type: 'brazier', x: 70, y: 160 },
        { type: 'brazier', x: -90, y: -210 },
        { type: 'brazier', x: 90, y: -210 },
        { type: 'ruinedArch', x: 0, y: -240 }
      );
      npcs.push({
        id: 'npc_orion',
        name: 'Forge-Keeper Orion',
        role: 'Master Astral Smith [Click / T]',
        spriteKey: 'solariFlamekeeperNpc',
        x: 0,
        y: 185,
        dialogue: [
          {
            speaker: 'FORGE-KEEPER ORION • STARFALL CRATER',
            spriteKey: 'solariFlamekeeperNpc',
            text: 'Welcome to the Starfall Impact Basin! Celestial Starmetal and Astral Mithril veins ring the molten crater. Smelt your cosmic ingots right here on the Astral Star-Anvil!',
            actions: [
              { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
              { label: '👋 FAREWELL', action: 'close' },
            ],
          },
        ],
      });
    } else if (resolvedRoomType === ROOM_TYPES.ABYSSAL_RIFT) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'THE ABYSSAL RIFT & PRIMEVAL SANCTUM';
      if (zoneLabel) zoneLabel.innerText = 'To Caldera';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'aetherCrucible', stationId: 'aether_crucible', x: -58, y: 235, label: '⚗️ Abyssal Crucible [Click / E]' },
        { type: 'celestialLoom', stationId: 'celestial_loom', x: 58, y: 235, label: '🧵 Voidstar Loom [Click / E]' },
        { type: 'bountyBoard', isBountyBoard: true, x: -105, y: 235, label: '📜 Rift Bounty Board [Click / E]' },
        { type: 'campfire', x: 0, y: 268, label: '🔥 Void-Warden Vigil Fire' },
        { type: 'ruinedArch', x: 0, y: 260 },
        { type: 'ruinedArch', x: 0, y: -260 },
        { type: 'crystalPillar', x: -160, y: 90 },
        { type: 'crystalPillar', x: 160, y: 90 },
        { type: 'crystalPillar', x: -180, y: -150 },
        { type: 'crystalPillar', x: 180, y: -150 },
        { type: 'monument', x: 0, y: -60 },
        { type: 'brazier', x: -85, y: 180 },
        { type: 'brazier', x: 85, y: 180 },
        { type: 'brazier', x: -110, y: -280 },
        { type: 'brazier', x: 110, y: -280 }
      );
      npcs.push({
        id: 'npc_nihilus',
        name: 'Rift-Watcher Nihilus',
        role: 'Void Singularity Warden [Click / T]',
        spriteKey: 'shadowWraithmotherNpc',
        x: 0,
        y: 235,
        dialogue: [
          {
            speaker: 'RIFT-WATCHER NIHILUS • ABYSSAL RIFT',
            spriteKey: 'shadowWraithmotherNpc',
            text: 'Beyond these fractured obsidian spires waits Xal\'Korath, the Void Architect. Harvest Celestial Gossamer and Empyrean Starleaf along the rift edge before challenging his singularity!',
            actions: [
              { label: '⚗️ OPEN ABYSSAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
              { label: '👋 STAND VIGIL', action: 'close' },
            ],
          },
        ],
      });
    } else {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || cfg.shortTitle || 'NEXUS WARZONE';
      if (zoneLabel) zoneLabel.innerText = 'To Sanctuary';
      arenaBanner.style.display = 'none';

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
        props.push({ type: 'bountyBoard', isBountyBoard: true, x: -92, y: 1420, label: '📜 Caldera Bounty Board [Click / E]' });
      } else {
        [[-90, 95], [90, 95], [-145, -20], [145, -20], [-75, -135], [75, -135]].forEach(([pxX, pxY], idx) => {
          props.push({ type: idx % 2 === 0 ? 'pillar' : 'brazier', x: pxX, y: pxY });
        });
      }

      if (resolvedRoomType === ROOM_TYPES.SOLARI_CITADEL) {
        props.push(
          { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: -200, y: 40, label: '🔨 Citadel Star-Anvil [Click / E]' },
          { type: 'marketStallSmith', id: 'stall_smith', x: -145, y: 40, label: '⚒️ Sunforged Weaponry Stall' },
          { type: 'bountyBoard', isBountyBoard: true, x: 95, y: 115, label: '📜 Citadel Bounty Board [Click / E]' },
          { type: 'campfire', x: -85, y: 125, label: '🔥 Sunspire Brazier Hearth' },
          { type: 'woodenSign', x: 38, y: 128, label: '🪧 W: Smithy & Quarry | E: Citadel Bank | S: Starfall Crater' },
          { type: 'solariSundial', x: 0, y: -70 },
          { type: 'flowerBed', x: -105, y: -50 },
          { type: 'flowerBed', x: 105, y: -50 },
          { type: 'flowerBed', x: -105, y: 15 },
          { type: 'flowerBed', x: 105, y: 15 },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Solari Citadel Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'grandFountain', x: 0, y: 0 },
          { type: 'cityHouseB', x: -175, y: -145 },
          { type: 'cityHouseA', x: -85, y: -155 },
          { type: 'cityHouseB', x: 85, y: -155 },
          { type: 'mountainCrag', x: -340, y: -110 },
          { type: 'mountainCrag', x: 340, y: -110 },
          { type: 'streetLantern', x: -58, y: 80 },
          { type: 'streetLantern', x: 58, y: 80 },
          { type: 'streetLantern', x: -58, y: -60 },
          { type: 'streetLantern', x: 58, y: -60 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 },
          { type: 'blossomTree', x: -125, y: -85 },
          { type: 'blossomTree', x: 125, y: -85 }
        );
        npcs.push(
          {
            id: 'merchant_smith',
            name: 'Blacksmith Torvin',
            role: 'Sunforged Armorer [Click / T]',
            spriteKey: 'merchantSmithNpc',
            stallId: 'stall_smith',
            merchantType: 'merchant_smith',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_solari_bank',
            name: 'Solari Vault-Master',
            role: 'Citadel Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_vael',
            name: 'Captain Vaelen',
            role: 'Lantern District Templar [Click / T]',
            spriteKey: 'solariCaptainNpc',
            x: -38,
            y: 125,
            dialogue: SOLARI_CITADEL_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.UMBRI_UNDERCITY) {
        props.push(
          { type: 'celestialLoom', stationId: 'celestial_loom', x: -200, y: 40, label: '🧵 Undercity Shadow Loom [Click / E]' },
          { type: 'marketStallTailor', id: 'stall_tailor', x: -145, y: 40, label: '🕸️ Duskveil Silk Stall' },
          { type: 'bountyBoard', isBountyBoard: true, x: -95, y: 115, label: '📜 Undercity Bounty Board [Click / E]' },
          { type: 'campfire', x: 0, y: 78, label: '🔥 Duskveil Smuggler Hearth' },
          { type: 'woodenSign', x: -38, y: 128, label: '🪧 W: Shadow Loom | E: Undercity Vault | N: Shadow Labyrinth' },
          { type: 'umbriBrazierAltar', x: -90, y: -50 },
          { type: 'umbriBrazierAltar', x: 90, y: -50 },
          { type: 'umbriBrazierAltar', x: -60, y: 110 },
          { type: 'umbriBrazierAltar', x: 60, y: 110 },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Umbri Shadow Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'cityHouseA', x: -175, y: -145 },
          { type: 'cityHouseB', x: 0, y: -155 },
          { type: 'pillar', x: -140, y: 0 },
          { type: 'pillar', x: 140, y: 0 },
          { type: 'streetLantern', x: -52, y: 75 },
          { type: 'streetLantern', x: 52, y: 75 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 }
        );
        npcs.push(
          {
            id: 'merchant_tailor',
            name: 'Shadow Stitcher Silvan',
            role: 'Glimmerweaving & Silks [Click / T]',
            spriteKey: 'shadowBrokerNpc',
            stallId: 'stall_tailor',
            merchantType: 'merchant_tailor',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_umbri_bank',
            name: 'Undercity Vault-Keeper',
            role: 'Duskveil Vault Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_nyx',
            name: 'Shadow Broker Nyx',
            role: 'Duskveil Smuggler [Click / T]',
            spriteKey: 'shadowBrokerNpc',
            x: 42,
            y: 125,
            dialogue: UMBRI_UNDERCITY_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.TERRA_ORCHARD) {
        props.push(
          { type: 'aetherCrucible', stationId: 'aether_crucible', x: -200, y: 40, label: '⚗️ Orchard Herbal Crucible [Click / E]' },
          { type: 'marketStallPotions', id: 'stall_potions', x: -145, y: 40, label: '🌿 Rootdeep Apothecary Stall' },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Rootdeep Grove Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'bountyBoard', isBountyBoard: true, x: 95, y: 115, label: '📜 Orchard Bounty Board [Click / E]' },
          { type: 'campfire', x: -85, y: 125, label: '🔥 Druid Circle Hearth' },
          { type: 'woodenSign', x: 38, y: 128, label: '🪧 W: Apothecary & Crucible | E: Orchard Bank & Spring' },
          { type: 'terraMenhir', x: 0, y: -80 },
          { type: 'ancientWell', x: 155, y: 45 },
          { type: 'cityHouseA', x: -175, y: -145 },
          { type: 'cityHouseB', x: -75, y: -155 },
          { type: 'flowerBed', x: -105, y: -50 },
          { type: 'flowerBed', x: 105, y: -50 },
          { type: 'flowerBed', x: 0, y: 25 },
          { type: 'ancientOak', x: -250, y: -155 },
          { type: 'ancientOak', x: 265, y: -155 },
          { type: 'blossomTree', x: -120, y: -70 },
          { type: 'blossomTree', x: 120, y: -70 },
          { type: 'blossomTree', x: -85, y: 155 },
          { type: 'blossomTree', x: 85, y: 155 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 }
        );
        npcs.push(
          {
            id: 'merchant_apothecary',
            name: 'Alchemist Faye',
            role: 'Rootdeep Apothecary [Click / T]',
            spriteKey: 'merchantApothecaryNpc',
            stallId: 'stall_potions',
            merchantType: 'merchant_apothecary',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_terra_bank',
            name: 'Orchard Vault-Keeper',
            role: 'Rootdeep Grove Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_rowan',
            name: 'Grove Tender Rowan',
            role: 'Rootdeep Herbalist [Click / T]',
            spriteKey: 'terraHerbalistNpc',
            x: -38,
            y: 125,
            dialogue: TERRA_ORCHARD_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.AETHER_SPIRE) {
        props.push(
          { type: 'aetherArmillary', x: 0, y: -80 },
          { type: 'marketStallRelics', id: 'stall_relics', x: -145, y: 40, label: '🔮 Mirrorgate Relic Stall' },
          { type: 'aetherCrucible', stationId: 'aether_crucible', x: -200, y: 40, label: '⚗️ Mirrorgate Transmuter [Click / E]' },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Mirrorgate Astral Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'bountyBoard', isBountyBoard: true, x: -95, y: 115, label: '📜 Mirrorgate Bounty Board [Click / E]' },
          { type: 'campfire', x: 0, y: 78, label: '🔥 Starlight Conduit Hearth' },
          { type: 'woodenSign', x: -38, y: 128, label: '🪧 W: Relic Stall & Transmuter | E: Astral Vault' },
          { type: 'cityHouseB', x: -175, y: -145 },
          { type: 'cityHouseA', x: 85, y: -155 },
          { type: 'crystalPillar', x: -130, y: 90 },
          { type: 'crystalPillar', x: 130, y: 90 },
          { type: 'crystalPillar', x: -130, y: -90 },
          { type: 'crystalPillar', x: 130, y: -90 },
          { type: 'flowerBed', x: -105, y: -50 },
          { type: 'flowerBed', x: 105, y: -50 },
          { type: 'streetLantern', x: -58, y: 75 },
          { type: 'streetLantern', x: 58, y: 75 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 }
        );
        npcs.push(
          {
            id: 'merchant_relics',
            name: 'Relic-Seeker Moira',
            role: 'Mirrorgate Curio Merchant [Click / T]',
            spriteKey: 'merchantRelicsNpc',
            stallId: 'stall_relics',
            merchantType: 'merchant_relics',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_aether_bank',
            name: 'Mirrorgate Vault-Keeper',
            role: 'Astral Spire Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_kaelen',
            name: 'Astromancer Kaelen',
            role: 'Mirrorgate Stargazer [Click / T]',
            spriteKey: 'aetherAstromancerNpc',
            x: 42,
            y: 125,
            dialogue: AETHER_SPIRE_DIALOGUE,
          }
        );
      }
    }
  }

  function buildOfflineZone(zone, spawnX = null, spawnY = null) {
    setupZoneDecor(zone);
    entities = [];
    allies = [];
    projectiles = [];
    groundZones = [];
    lootDrops = [];
    offlineMythic = null;

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
        { id: 'dummy_1', name: 'Sanctuary Dummy', sub: 'Lv.1 Awakening Training Post', type: 'dummy', spriteKey: 'dummy', x: 0, y: 52, origX: 0, origY: 52, hp: 30, maxHp: 30, xpReward: 30, radius: 14, hitFlash: 0 },
        { id: 'dummy_2', name: 'Armored Training Post', sub: 'Lv.5 Resilient Training Post', type: 'dummy', spriteKey: 'dummy', x: 165, y: 20, origX: 165, origY: 20, hp: 120, maxHp: 120, xpReward: 65, radius: 15, hitFlash: 0 },
        { id: 'dummy_titan', name: 'Titan Training Dummy', sub: 'Lv.50 Endless Damage Trial (No XP)', type: 'dummy', spriteKey: 'dummy', x: 225, y: 20, origX: 225, origY: 20, hp: 25000, maxHp: 25000, xpReward: 0, noHitXp: true, radius: 20, hitFlash: 0 },
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
    } else if (currentRoomType === ROOM_TYPES.STARFALL_CRATER) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 220;
      }
      entities.push(
        { id: 'sf_mob_1', name: 'Starforged Automaton', sub: 'Lv.22 Astral Construct', type: 'mob', spriteKey: 'starforgedAutomaton', x: -135, y: 55, origX: -135, origY: 55, hp: 190, maxHp: 190, damage: 13, xpReward: 220, speed: 50, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_mob_2', name: 'Starforged Automaton', sub: 'Lv.22 Astral Construct', type: 'mob', spriteKey: 'starforgedAutomaton', x: 135, y: 55, origX: 135, origY: 55, hp: 190, maxHp: 190, damage: 13, xpReward: 220, speed: 50, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_mob_3', name: 'Molten Meteor Elemental', sub: 'Lv.25 Crater Elemental', type: 'mob', spriteKey: 'meteorElemental', x: -155, y: -95, origX: -155, origY: -95, hp: 230, maxHp: 230, damage: 15, xpReward: 265, speed: 54, aggroRange: 125, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_mob_4', name: 'Molten Meteor Elemental', sub: 'Lv.25 Crater Elemental', type: 'mob', spriteKey: 'meteorElemental', x: 155, y: -95, origX: 155, origY: -95, hp: 230, maxHp: 230, damage: 15, xpReward: 265, speed: 54, aggroRange: 125, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_node_1', name: 'Starfall Impact Conduit', sub: 'Astral Glimmer Spire [E]', type: 'node', spriteKey: 'node', x: 0, y: -40, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'sf_boss', name: 'Ignis-Core the Starfall Colossus', sub: '★ Lv.28 Molten Starmetal Boss', type: 'mob', isBoss: true, dropGear: 'starmetal_meteor_hammer', spriteKey: 'starfallBoss', x: 0, y: -260, origX: 0, origY: -260, hp: 980, maxHp: 980, damage: 24, xpReward: 950, speed: 42, aggroRange: 150, attackRange: 38, radius: 24, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.ABYSSAL_RIFT) {
      if (!hasCustomSpawn) {
        player.x = 0;
        player.y = 260;
      }
      entities.push(
        { id: 'aby_mob_1', name: 'Gloam-Silk Widow', sub: 'Lv.34 Rift Arachnid', type: 'mob', spriteKey: 'gloamWidow', x: -150, y: 80, origX: -150, origY: 80, hp: 340, maxHp: 340, damage: 20, xpReward: 390, speed: 58, aggroRange: 128, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'aby_mob_2', name: 'Gloam-Silk Widow', sub: 'Lv.34 Rift Arachnid', type: 'mob', spriteKey: 'gloamWidow', x: 150, y: 80, origX: 150, origY: 80, hp: 340, maxHp: 340, damage: 20, xpReward: 390, speed: 58, aggroRange: 128, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'aby_mob_3', name: 'Paradox Sentinel', sub: 'Lv.37 Singularity Guard', type: 'mob', spriteKey: 'paradoxSentinel', x: -165, y: -90, origX: -165, origY: -90, hp: 430, maxHp: 430, damage: 24, xpReward: 460, speed: 52, aggroRange: 132, attackRange: 32, radius: 17, hitFlash: 0 },
        { id: 'aby_mob_4', name: 'Paradox Sentinel', sub: 'Lv.37 Singularity Guard', type: 'mob', spriteKey: 'paradoxSentinel', x: 165, y: -90, origX: 165, origY: -90, hp: 430, maxHp: 430, damage: 24, xpReward: 460, speed: 52, aggroRange: 132, attackRange: 32, radius: 17, hitFlash: 0 },
        { id: 'aby_mob_5', name: 'Voidborne Harbinger', sub: 'Lv.39 Architect Vanguard', type: 'mob', spriteKey: 'mobUmbri', x: 0, y: -155, origX: 0, origY: -155, hp: 480, maxHp: 480, damage: 26, xpReward: 520, speed: 54, aggroRange: 135, attackRange: 32, radius: 18, hitFlash: 0 },
        { id: 'aby_node_1', name: 'Abyssal Singularity Font', sub: 'Voidstar Glimmer Spire [E]', type: 'node', spriteKey: 'node', x: 0, y: -30, charges: 6, maxCharges: 6, radius: 18, hitFlash: 0 },
        { id: 'aby_boss', name: 'Xal\'Korath the Void Architect', sub: '★ Lv.42 Sovereign of the Rift', type: 'mob', isBoss: true, dropGear: 'abyssal_voidstar_scythe', spriteKey: 'abyssalArchitectBoss', x: 0, y: -340, origX: 0, origY: -340, hp: 3800, maxHp: 3800, damage: 38, xpReward: 2200, speed: 45, aggroRange: 175, attackRange: 42, radius: 28, hitFlash: 0 }
      );
    } else {
      player.x = 0;
      player.y = 1740;
      entities.push(
        // Vanguard Colossus Training Post
        { id: 'val_dummy', name: 'Vanguard Colossus Post', sub: 'Lv.30 Target Post', type: 'dummy', spriteKey: 'dummy', x: 60, y: 1440, origX: 60, origY: 1440, hp: 600, maxHp: 600, xpReward: 200, radius: 16, hitFlash: 0 },
        // 4 Continental Faction Outposts
        { id: 'outpost_Terra', faction: 'Terra', name: 'Terra Forest Outpost Nexus', sub: '300 HP Terra Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusGreen', x: -850, y: -650, origX: -850, origY: -650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Umbri', faction: 'Umbri', name: 'Umbri Shadow Outpost Nexus', sub: '300 HP Umbri Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusPurple', x: 850, y: -650, origX: 850, origY: -650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Solari', faction: 'Solari', name: 'Solari Radiant Outpost Nexus', sub: '300 HP Solari Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusGold', x: -850, y: 650, origX: -850, origY: 650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Aether', faction: 'Aether', name: 'Aether Astral Outpost Nexus', sub: '300 HP Aether Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusCyan', x: 850, y: 650, origX: 850, origY: 650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        // Shattered Nexus Shard
        { id: 'siege_shard', name: 'Shattered Nexus Shard', sub: '⚡ Continental Nexus Core (PvPvE)', type: 'siege_shard', isBoss: true, spriteKey: 'siegeShard', x: 0, y: 0, origX: 0, origY: 0, hp: 850, maxHp: 850, xpReward: 2500, radius: 24, hitFlash: 0 },
        // 4 Ancient Leyline Shrines [E]
        { id: 'shrine_solari', name: 'Solari Radiant Shrine', sub: 'Ancient Leyline [E] • Radiant Wrath', type: 'shrine', affinity: 'solari', buffName: 'Solar Wrath', x: -550, y: 550, origX: -550, origY: 550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_umbri', name: 'Umbri Void Obelisk', sub: 'Ancient Leyline [E] • Void Leech', type: 'shrine', affinity: 'umbri', buffName: 'Void Step', x: 550, y: -550, origX: 550, origY: -550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_terra', name: 'Terra Bastion Monolith', sub: 'Ancient Leyline [E] • Primal Bastion', type: 'shrine', affinity: 'terra', buffName: 'Stone Ward', x: -550, y: -550, origX: -550, origY: -550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_aether', name: 'Aether Chrono Spire', sub: 'Ancient Leyline [E] • Chrono Surge', type: 'shrine', affinity: 'aether', buffName: 'Chrono Surge', x: 550, y: 550, origX: 550, origY: 550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        // 4 Grand World Bosses
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
        // Whispering Mountain Pass Mobs
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

    // Three shared Grand Glimmer Fonts per realm. Each has 25 charges that are
    // global to the room, so parties can grind the same font together.
    if (currentRoomType !== ROOM_TYPES.ARENA_3V3) {
      const positions = GRAND_FONT_POSITIONS[currentRoomType]?.length
        ? GRAND_FONT_POSITIONS[currentRoomType]
        : [{ x: 0, y: 130 }];
      positions.forEach((gp, index) => {
        entities.push({
          id: `grand_font_${currentRoomType}_${index + 1}`,
          name: 'Grand Glimmer Font',
          sub: 'GRAND LEYLINE FONT • 25 SHARED CHARGES [E]',
          type: 'node',
          spriteKey: 'grandNode',
          isGrand: true,
          x: gp.x,
          y: gp.y,
          charges: 25,
          maxCharges: 25,
          radius: 90,
          hitFlash: 0,
        });
      });
    }

    // Populate Cosmic Skilling Veins, Herb Clusters & Silk Blooms + Elite Monster Champions
    populateWorldSkillingNodes(currentRoomType, entities);
    applyEliteChampionsToZone(currentRoomType, entities);

    camera.x = player.x;
    camera.y = player.y;
  }

  function populateWorldSkillingNodes(roomType, targetList) {
    const entries = SKILLING_LAYOUTS[roomType] || [];
    entries.forEach(([skKey, x, y], idx) => {
      const spec = SKILLING_NODE_TYPES[skKey];
      if (!spec) return;
      targetList.push({
        id: `sknode_${roomType}_${idx + 1}`,
        name: spec.name,
        sub: `${spec.sub || 'Cosmic Skilling Vein [E]'} • Req Lv.${spec.reqLevel}`,
        type: 'node',
        skillingType: skKey,
        spriteKey: spec.spriteReady,
        x,
        y,
        charges: spec.charges || 3,
        maxCharges: spec.charges || 3,
        radius: 16,
        hitFlash: 0,
      });
    });
  }

  function applyEliteChampionsToZone(roomType, targetList) {
    if (roomType === ROOM_TYPES.SANCTUARY_HUB || roomType === ROOM_TYPES.ARENA_3V3) return;
    const affixKeys = Object.keys(ELITE_AFFIXES);
    if (!affixKeys.length) return;
    const candidates = targetList.filter((e) => e.type === 'mob' && !e.isBoss);
    if (!candidates.length) return;
    // Promote 1 deterministic / semi-random champion per dungeon/zone (2 in Warzone/Abyssal/Starfall)
    const maxElites = (roomType === ROOM_TYPES.NEXUS_WARZONE || roomType === ROOM_TYPES.ABYSSAL_RIFT || roomType === ROOM_TYPES.STARFALL_CRATER) ? 2 : 1;
    for (let i = 0; i < Math.min(maxElites, candidates.length); i++) {
      const mob = candidates[candidates.length - 1 - i];
      if (!mob || mob.eliteAffix) continue;
      const afKey = affixKeys[(i + roomType.length) % affixKeys.length];
      const af = ELITE_AFFIXES[afKey];
      if (!af) continue;
      mob.eliteAffix = afKey;
      mob.name = `${af.label || af.prefix || 'Elite'} ${mob.name}`;
      mob.sub = `★ ELITE CHAMPION • ${mob.sub}`;
      mob.maxHp = Math.round(mob.maxHp * af.hpMult);
      mob.hp = mob.maxHp;
      mob.damage = Math.max(2, Math.round((mob.damage || 4) * af.dmgMult));
      mob.xpReward = Math.round((mob.xpReward || 65) * af.xpMult);
    }
  }

  // ==========================================
  // Real-Time Authoritative Server Packet Handling
  // ==========================================
  function getZoneDangerTag() {
    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      return ` • <span style="color:#4ade80; font-weight:800;">[SANCTUARY]</span>`;
    }
    if (currentRoomType === ROOM_TYPES.STARFALL_CRATER) {
      return ` • <span style="color:#fb923c; font-weight:800;">[STARFALL FORGE]</span>`;
    }
    if (currentRoomType === ROOM_TYPES.ABYSSAL_RIFT) {
      return ` • <span style="color:#e879f9; font-weight:800;">[ABYSSAL BREACH]</span>`;
    }
    if (currentRoomType === ROOM_TYPES.NEXUS_WARZONE) {
      return ` • <span style="color:#f97316; font-weight:800;">[OPEN WARZONE]</span>`;
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
    const pill = uiEl('net-status-pill');
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
      const attempt = net.reconnectAttempt || 0;
      pill.innerHTML = `
        <div class="net-pill-line1" style="color:#fbbf24;">● ${attempt > 0 ? `RECONNECTING (${attempt})` : 'CONNECTING...'}</div>
        <div class="net-pill-line2">${attempt > 0 ? 'RETRYING REALM LINK' : 'ENTERING CONTINENTAL REALM'}</div>
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
        if (se.skillingType) prev.skillingType = se.skillingType;
        if (se.eliteAffix) {
          prev.eliteAffix = se.eliteAffix;
          prev.name = se.name;
          prev.sub = se.sub;
        }
        if (se.isDying && !prev.isDying && (se.type === 'mob' || se.type === 'nexus')) {
          triggerEntityDeathEffect(se.x, se.y, se.isBoss);
          const distToPlayer = Math.hypot(se.x - player.x, se.y - player.y);
          if (distToPlayer < 400 || (currentTarget && currentTarget.id === se.id)) {
            onPlayerKilledMob(currentRoomType, se.name, se.isBoss, se.id, se.type);
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
        if (hitEnt?.type === 'dummy') {
          questState.combatTrainingHits = (questState.combatTrainingHits || 0) + 1;
          if (questCounter('quest_skill_combat', 'combatTrainingHits') === 15 && questState.activeQuests?.quest_skill_combat) {
            logMessage('📜 [Quest Objective] Training dummy strikes (15/15)! Return to Commander Valerius!', 'log-quest', 'chat');
            spawnFCT(player.x, player.y - 14, '✨ COMBAT DRILL COMPLETE (15/15)!', '#facc15', true);
            if (audio && audio.playChime) audio.playChime();
          }
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

        case 'mythic_state':
          onlineMythic = msg.mythic ? { ...msg.mythic, _syncedAt: globalTime } : null;
          updateMythicHud();
          break;

        case 'progression_sync':
          prog = {
            ...prog,
            ...msg.progression,
            stats: { ...prog.stats, ...(msg.progression.stats || {}) },
            ranks: { ...prog.ranks, ...(msg.progression.ranks || {}) },
            professions: { ...(prog.professions || {}), ...(msg.progression.professions || {}) },
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
          if (msg.professionGained) {
            const pg = msg.professionGained;
            const pInfo = PROFESSIONS_CATALOG[pg.id];
            const pName = pInfo?.name || pg.id;
            if (pg.leveled) {
              audio.playLevelUp?.();
              spawnSparkBurst(player.x, player.y - 12, [pInfo?.color || '#38bdf8', '#ffffff', '#fde047'], 28);
              spawnFCT(player.x, player.y - 16, `🎉 ${pName.toUpperCase()} LVL ${pg.newLevel}!`, pInfo?.color || '#38bdf8', true);
              logMessage(`🎉 [SKILL LEVEL UP!] You achieved ${pName} Level ${pg.newLevel}! Total Skill Level: ${getTotalProfessionLevel(prog.professions)}`, 'log-gain', 'chat');
            } else {
              spawnFCT(player.x, player.y - 14, `+${pg.amount} ${pName} XP`, pInfo?.color || '#38bdf8', false);
              if (pg.reason) {
                logMessage(`✨ Gained ${pg.amount} ${pName} XP (${pg.reason}).`, 'log-gain', 'combat');
              }
            }
          }
          updatePlayerUI();
          updateActionBarBadges();
          renderStatsModal();
          renderKeybindUI();
          window.renderSkillsTabUI?.();
          if (document.getElementById('crafting-modal')?.style.display === 'block') {
            renderCraftingModal();
          }
          if (typeof renderSkillTreeUI === 'function') renderSkillTreeUI();
          break;

        case 'mob_killed': {
          onPlayerKilledMob(msg.roomType, msg.mobName, msg.isBoss, msg.mobId, msg.mobType);
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
          if (msg.won) {
            if (audio && audio.playQuestCompleteFanfare) audio.playQuestCompleteFanfare();
            else if (audio && audio.playLevelUp) audio.playLevelUp();
          } else {
            audio.playHurt?.();
          }
          spawnFCT(player.x, player.y - 20, msg.won ? '🏆 3v3 ARENA VICTORY!' : '💀 3v3 ARENA DEFEAT', msg.won ? '#facc15' : '#ef4444', true);
          logMessage(
            msg.won
              ? '🏆 [3v3 VICTORY!] Enemy Nexus shattered! +1 Ranked Arena Win! Teleporting back in 3 seconds...'
              : '💀 [3v3 DEFEAT] Your Sanctuary Nexus fell! Teleporting back in 3 seconds...',
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
  window.net = net;

  // ==========================================
  // Game Frontpage Controller (Character Select, Faction, Class & Loadout)
  // ==========================================
  const frontpage = new FrontpageController({
    net,
    audio,
    onEnterWorld({ profile, startingRealm, playMode, startX, startY }) {
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
        buildOfflineZone(startingRealm, startX, startY);
        updateNetStatusPill();
        logMessage('[Realm] Entered Single Player Realm (Offline • 0ms). Instant local response!', 'log-solari', 'chat');
      } else {
        if (net.connected && startingRealm && !currentRoomId.startsWith(startingRealm)) {
          portalCooldown = 2.0;
          triggerPortalMist(0.5);
          inputs.up = inputs.down = inputs.left = inputs.right = false;
          player.isMoving = false;
          moveSyncAccum = 0;
          net.send({ type: 'switch_room', roomType: startingRealm, epoch: currentEpoch, x: startX, y: startY });
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
    saveCurrentVitals();
    document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    frontpage.open();
  };

  // Open Character Select / Loadout Frontpage IMMEDIATELY on boot
  try {
    frontpage.open();
  } catch (err) {
    console.error('[Frontpage] Failed to open on startup:', err);
  }

  // Handle instant enter click if triggered before engine mount
  if (typeof window !== 'undefined' && window._pendingPlayOnBoot) {
    window._pendingPlayOnBoot = false;
    setTimeout(() => {
      frontpage.playSelectedCharacter();
    }, 10);
  }

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
    document.getElementById('target-sub').innerText = getEntitySubtitle(ent);
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

  // Vitals are rounded for display only: regeneration stays fractional internally so
  // bars move smoothly, but the HUD must never print decimal HP or Glimmer.
  function updateVitalsUI() {
    const hpNow = Math.round(player.hp);
    const hpMax = Math.round(player.maxHp);
    const shieldNow = Math.round(player.shield);
    const hpTxtEl = uiEl('player-hp-txt');
    if (hpTxtEl) {
      hpTxtEl.innerText = shieldNow > 0
        ? `${hpNow}/${hpMax} (+${shieldNow} SHIELD)`
        : `${hpNow} / ${hpMax}`;
    }
    const hpFill = uiEl('player-hp-fill');
    if (hpFill) {
      hpFill.style.width = `${Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100)}%`;
      hpFill.className = shieldNow > 0 ? 'bar-hp shielded' : 'bar-hp';
    }
    const resTxt = uiEl('player-res-txt');
    if (resTxt) resTxt.innerText = `${Math.round(player.solarCharge)} / ${Math.round(player.maxSolarCharge)}`;
    const resFill = uiEl('player-res-fill');
    if (resFill) {
      resFill.style.width = `${Math.min(100, (player.solarCharge / Math.max(1, player.maxSolarCharge)) * 100)}%`;
    }
  }

  function updatePlayerUI() {
    const fm = FACTIONS_META[localProfile.faction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[localProfile.classId] || CLASSES_CATALOG.solari_vanguard;
    const nameEl = uiEl('player-name-label');
    if (nameEl) {
      nameEl.innerText = localProfile.displayName.toUpperCase();
      nameEl.style.color = fm.color;
    }
    const subEl = uiEl('player-sub-label');
    if (subEl) {
      const orderStr = localProfile.orderTag && localProfile.orderTag !== 'NONE' ? `<${localProfile.orderTag}> ` : '';
      const tcgBadge = localProfile.tcgLinked ? ' • ⚡TCG' : '';
      subEl.innerHTML = `<img src="${fm.logo}" alt="${fm.id}" style="width:13px; height:13px; object-fit:contain; vertical-align:middle; margin-right:3px; filter:drop-shadow(0 0 2px ${fm.color});" /> ${cls.name} • ${orderStr}${tcgBadge}`;
    }
    const qFac = uiEl('quest-faction-pill');
    if (qFac) {
      qFac.innerText = localProfile.faction.toUpperCase();
      qFac.style.color = fm.color;
    }

    const levelBadge = uiEl('player-level-badge');
    if (levelBadge) levelBadge.innerText = prog.level;
    updateVitalsUI();

    const needXp = xpForNextLevel(prog.level);
    const xpBarTxt = uiEl('xp-bar-txt');
    if (xpBarTxt) xpBarTxt.innerText = `LV.${prog.level} ${cls.name.toUpperCase()}  •  XP ${prog.xp} / ${needXp}`;
    const xpBarFill = uiEl('xp-bar-fill');
    if (xpBarFill) xpBarFill.style.width = `${Math.min(100, (prog.xp / needXp) * 100)}%`;

    const spBadge = uiEl('skill-pt-pip');
    if (spBadge) {
      spBadge.style.display = prog.skillPoints > 0 ? 'inline-block' : 'none';
      spBadge.innerText = `+${prog.skillPoints}`;
    }
    const stBadge = uiEl('stat-pt-pip');
    if (stBadge) {
      stBadge.style.display = prog.statPoints > 0 ? 'inline-block' : 'none';
      stBadge.innerText = `+${prog.statPoints}`;
    }
    const invBadge = uiEl('inv-count-pip');
    if (invBadge) {
      const invLen = (localProfile.inventory || []).length;
      invBadge.style.display = invLen > 0 ? 'inline-block' : 'none';
      invBadge.innerText = `${invLen}`;
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
  function getFactionBossSetDrop(ent, roomType) {
    if (ent?.dropGear && EQUIPMENT_CATALOG[ent.dropGear]) {
      return ent.dropGear;
    }
    const rType = String(roomType || '').toLowerCase();
    const spKey = ent?.spriteKey || '';
    if (spKey === 'starfallBoss' || rType.includes('starfall')) {
      return 'starmetal_meteor_hammer';
    }
    if (spKey === 'abyssalArchitectBoss' || rType.includes('abyssal')) {
      return 'abyssal_voidstar_scythe';
    }
    if (spKey === 'solariBoss' || rType.includes('solari')) {
      return ['sunforged_greathelm', 'sunforged_hauberk', 'sunforged_greaves', 'sunforged_warhammer'][Math.floor(Math.random() * 4)];
    }
    if (spKey === 'graniteBoss' || rType.includes('terra')) {
      return ['ironwood_horned_helm', 'ironwood_bark_chest', 'ironwood_thighguards', 'ironwood_spear'][Math.floor(Math.random() * 4)];
    }
    if (spKey === 'aetherBoss' || rType.includes('aether')) {
      return ['chrono_astral_hood', 'chrono_astral_robes', 'chrono_astral_skirt', 'chrono_warp_staff'][Math.floor(Math.random() * 4)];
    }
    if (spKey === 'umbriBoss' || rType.includes('umbri')) {
      return ['duskveil_shadow_mask', 'duskveil_assassin_garb', 'duskveil_void_chaps', 'duskveil_twin_daggers'][Math.floor(Math.random() * 4)];
    }
    if (rType.includes('celestial') || ent?.name?.includes('Aurelius')) {
      return ['crown_of_dawn', 'aurelius_sovereign_plate', 'aurelius_starforged_greaves', 'aurelius_morningstar_blade'][Math.floor(Math.random() * 4)];
    }
    const allSets = [
      'sunforged_greathelm', 'sunforged_hauberk', 'sunforged_greaves', 'sunforged_warhammer',
      'ironwood_horned_helm', 'ironwood_bark_chest', 'ironwood_thighguards', 'ironwood_spear',
      'chrono_astral_hood', 'chrono_astral_robes', 'chrono_astral_skirt', 'chrono_warp_staff',
      'duskveil_shadow_mask', 'duskveil_assassin_garb', 'duskveil_void_chaps', 'duskveil_twin_daggers',
      'crown_of_dawn', 'aurelius_sovereign_plate', 'aurelius_starforged_greaves', 'aurelius_morningstar_blade',
    ];
    return allSets[Math.floor(Math.random() * allSets.length)];
  }

  function getBossAccessoryDrop(ent, roomType) {
    const accs = [
      'amulet_of_fury', 'amulet_of_glory', 'fire_cape', 'barrows_gloves',
      'crown_of_noon', 'chronocore_prism', 'radiant_shield_relic',
      'celestial_talisman', 'granite_boots', 'ring_of_the_sun',
      'ring_of_void_leech', 'ring_of_stone',
    ];
    return accs[Math.floor(Math.random() * accs.length)];
  }

  function getBeginnerMobDrop(roomType) {
    const beginnerPool = [
      'iron_broadsword', 'novice_oak_staff', 'scout_leather_tunic',
      'scout_leather_leggings', 'iron_heater_shield', 'apprentice_focus_orb',
      'linen_traveller_cloak', 'copper_ring', 'radiant_cape',
      'vanguard_gauntlets', 'boots_of_haste',
    ];
    return beginnerPool[Math.floor(Math.random() * beginnerPool.length)];
  }

  function getOfflineKeystoneDrop(ent) {
    if (!ent?.isBoss) return null;
    const cryptDungeon = Object.values(MYTHIC_DUNGEONS).find((d) => d.roomType === currentRoomType);
    let dungeon = cryptDungeon;
    let tier;
    if (cryptDungeon) {
      tier = 1 + Math.floor(Math.random() * 3);
    } else {
      const pool = Object.values(MYTHIC_DUNGEONS);
      dungeon = pool[Math.floor(Math.random() * pool.length)];
      const apex = String(currentRoomType || '').includes('celestial') || String(ent.name || '').includes('Aurelius');
      tier = apex ? 6 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 4);
      if (apex && Math.random() < 0.25) tier = MYTHIC_KEYSTONE_MAX_TIER;
    }
    tier = Math.max(1, Math.min(MYTHIC_KEYSTONE_MAX_TIER, tier));
    return `keystone_${dungeon.id}_${tier}`;
  }

  function getZoneCosmicMaterialDrop(roomType) {
    const rType = String(roomType || '').toLowerCase();
    let pool = ['sun_copper_ore', 'star_tin_mineral', 'sunbloom_herb', 'starlight_flax', 'astral_mineral_dust'];
    if (rType.includes('abyssal') || rType.includes('celestial')) {
      pool = ['celestial_runite_ore', 'empyrean_starleaf', 'celestial_gossamer', 'adamant_terra_ore', 'chrono_lotus'];
    } else if (rType.includes('starfall') || rType.includes('ruins') || rType.includes('vault') || rType.includes('labyrinth') || rType.includes('grove') || rType.includes('archive')) {
      pool = ['mithril_astral_ore', 'adamant_terra_ore', 'chrono_lotus', 'shadow_silk', 'umbral_coal', 'astral_mineral_dust'];
    } else if (rType.includes('solari')) {
      pool = ['iron_ore', 'sun_copper_ore', 'umbral_coal', 'sunbloom_herb', 'astral_mineral_dust'];
    } else if (rType.includes('umbri')) {
      pool = ['iron_ore', 'umbral_coal', 'gloomcap_spore', 'shadow_silk', 'astral_mineral_dust'];
    } else if (rType.includes('terra')) {
      pool = ['iron_ore', 'adamant_terra_ore', 'sunbloom_herb', 'gloomcap_spore', 'starlight_flax'];
    } else if (rType.includes('aether')) {
      pool = ['mithril_astral_ore', 'chrono_lotus', 'astral_mineral_dust', 'shadow_silk'];
    } else if (rType.includes('warzone')) {
      pool = ['sun_copper_ore', 'star_tin_mineral', 'iron_ore', 'umbral_coal', 'sunbloom_herb', 'starlight_flax'];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnOfflineLoot(ent) {
    const pendingDrops = [];
    const count = ent.isBoss ? 2 : ent.eliteAffix ? 1 : Math.random() < 0.20 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      let kind = Math.random() < 0.5 ? 'vital' : 'glimmer';
      if (ent.isBoss && i === 0) kind = 'relic';
      pendingDrops.push({ kind, itemId: null, qty: 1 });
    }

    // 1. Stackable Currency: Solar Gold Sovereigns (all mobs drop gold; Elite Champions grant bonus bounty!)
    const eliteBonusGold = ent.eliteAffix ? 25 + Math.floor(Math.random() * 32) : 0;
    const goldQty = (ent.isBoss ? (150 + Math.floor(Math.random() * 200)) : (8 + Math.floor(Math.random() * 25))) + eliteBonusGold;
    pendingDrops.push({ kind: 'item', itemId: 'solar_gold', qty: goldQty });

    // 2. Faction elemental currency (40% mob chance or 100% boss/elite)
    if (ent.isBoss || ent.eliteAffix || Math.random() < 0.40) {
      const rType = String(currentRoomType || '').toLowerCase();
      let factionCurr = 'glimmer_shard';
      let factionCurrQty = ent.isBoss ? 15 + Math.floor(Math.random() * 20) : ent.eliteAffix ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
      if (rType.includes('aether') || rType.includes('starfall')) factionCurr = 'chrono_gem';
      else if (rType.includes('terra')) factionCurr = 'verdant_amber';
      else if (rType.includes('umbri') || rType.includes('abyssal')) factionCurr = 'void_essence';
      pendingDrops.push({ kind: 'item', itemId: factionCurr, qty: factionCurrQty });
    }

    // 2b. Cosmic Artisan Crafting Materials (30% on mobs, 100% on Elites & Bosses)
    if (ent.isBoss || ent.eliteAffix || Math.random() < 0.30) {
      const matId = getZoneCosmicMaterialDrop(currentRoomType);
      const matQty = ent.isBoss ? 2 + Math.floor(Math.random() * 2) : ent.eliteAffix ? 2 : 1;
      if (matId && EQUIPMENT_CATALOG[matId]) {
        pendingDrops.push({ kind: 'item', itemId: matId, qty: matQty });
      }
    }

    // 2c. Elite Champion Bonus: 15% chance at a cut Leyline Socket Gem!
    if (ent.eliteAffix && Math.random() < 0.15) {
      const gemPool = ['gem_solar_ruby', 'gem_void_sapphire', 'gem_terra_emerald', 'gem_aether_diamond'];
      pendingDrops.push({ kind: 'item', itemId: gemPool[Math.floor(Math.random() * gemPool.length)], qty: 1, ttl: 60 });
    }

    // 3. Consumables (healing salves / glimmer draughts - 12% on mobs, 100% on boss)
    if (ent.isBoss || Math.random() < 0.12) {
      const potId = Math.random() < 0.5 ? 'minor_healing_salve' : 'glimmer_draught';
      pendingDrops.push({ kind: 'item', itemId: potId, qty: ent.isBoss ? 2 : 1 });
    }

    // 4. Equipment Drops:
    // Set pieces drop ONLY on faction bosses (15%), non-bosses get beginner gear (6%)
    if (ent.isBoss) {
      // Day 2: every Continental boss guarantees a Legendary cache — one faction set piece + one relic.
      const setPieceId = getFactionBossSetDrop(ent, currentRoomType);
      const accessoryId = getBossAccessoryDrop(ent, currentRoomType);
      if (setPieceId) pendingDrops.push({ kind: 'item', itemId: setPieceId, qty: 1, ttl: 60 });
      if (accessoryId) pendingDrops.push({ kind: 'item', itemId: accessoryId, qty: 1, ttl: 60 });
      const keystoneId = getOfflineKeystoneDrop(ent);
      if (keystoneId) pendingDrops.push({ kind: 'item', itemId: keystoneId, qty: 1, ttl: 90 });
    } else {
      if (Math.random() < 0.06) {
        const dropId = getBeginnerMobDrop(currentRoomType);
        if (dropId) {
          pendingDrops.push({ kind: 'item', itemId: dropId, qty: 1, ttl: 35 });
        }
      }
    }

    // Radial spaced distribution so drops never overlap on the ground
    const n = pendingDrops.length;
    pendingDrops.forEach((d, i) => {
      const ang = (Math.PI * 2 * i) / Math.max(1, n) - Math.PI / 2;
      const dist = n > 1 ? 28 + (i % 2) * 8 : 0;
      const dropX = Math.round(ent.x + Math.cos(ang) * dist);
      const dropY = Math.round(ent.y + Math.sin(ang) * dist * 0.65);

      lootSeq++;
      lootDrops.push({
        id: `loot_off_${lootSeq}`,
        kind: d.kind,
        itemId: d.itemId,
        qty: d.qty || 1,
        x: dropX,
        y: dropY,
        ttl: d.ttl || (d.kind === 'item' ? 55 : 28),
        age: 0,
      });
    });
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

      if (l.kind === 'item') {
        const itemDef = EQUIPMENT_CATALOG[l.itemId];
        if (itemDef) {
          const inv = localProfile.inventory || [];
          const existing = inv.find((it) => (typeof it === 'string' ? it : it.id) === l.itemId);

          if (existing) {
            lootDrops.splice(i, 1);
            if (typeof existing === 'string') {
              const idx = inv.indexOf(existing);
              inv[idx] = { id: l.itemId, qty: 1 + (l.qty || 1) };
            } else {
              existing.qty = (existing.qty || 1) + (l.qty || 1);
            }
            localProfile.inventory = inv;
            saveProgressionLocal();
            audio.playPickup();

            let fctText = `✦ ${itemDef.name.toUpperCase()}`;
            if (itemDef.slot === 'currency') fctText = `+${l.qty || 1} ${itemDef.name.toUpperCase()}`;
            else if (itemDef.slot === 'consumable') fctText = `+${l.qty || 1} ${itemDef.name.toUpperCase()}`;

            spawnFCT(player.x, player.y - 14, fctText, itemDef.slot === 'currency' ? '#fde047' : '#4ade80');
            spawnSparkBurst(l.x, l.y, ['#fde047', '#ffffff'], 8);
            updatePlayerUI();
            if (document.getElementById('inventory-modal')?.style.display === 'block') {
              renderInventoryModal({ profile: localProfile });
            }
          } else if (inv.length < 28) {
            lootDrops.splice(i, 1);
            inv.push({ id: l.itemId, qty: l.qty || 1 });
            localProfile.inventory = inv;
            saveProgressionLocal();
            audio.playPickup();

            const isSet = itemDef.rarity.includes('Set') || itemDef.rarity.includes('Apex');
            let fctText = `✦ ${itemDef.name.toUpperCase()}`;
            if (itemDef.slot === 'currency') fctText = `+${l.qty || 1} ${itemDef.name.toUpperCase()}`;
            else if (itemDef.slot === 'consumable') fctText = `+${l.qty || 1} ${itemDef.name.toUpperCase()}`;
            else if (isSet) fctText = `✦ ${itemDef.name.toUpperCase()} (SET PIECE)`;

            spawnFCT(player.x, player.y - 14, fctText, isSet ? '#facc15' : itemDef.slot === 'currency' ? '#fde047' : itemDef.slot === 'consumable' ? '#4ade80' : '#38bdf8', isSet);
            spawnSparkBurst(l.x, l.y, isSet ? ['#facc15', '#fef08a', '#ffffff'] : ['#38bdf8', '#bae6fd', '#ffffff'], 12);
            updatePlayerUI();
            if (document.getElementById('inventory-modal')?.style.display === 'block') {
              renderInventoryModal({ profile: localProfile });
            }
          } else {
            spawnFCT(player.x, player.y - 14, `🎒 BAG FULL: ${itemDef.name.toUpperCase()}`, '#ef4444');
          }
        } else {
          lootDrops.splice(i, 1);
        }
      } else {
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
  }

  const LOOT_STYLE = {
    vital: { core: '#ef4444', light: '#fecaca', dark: '#7f1d1d' },
    glimmer: { core: '#38bdf8', light: '#e0f2fe', dark: '#0c4a6e' },
    relic: { core: '#facc15', light: '#fffbeb', dark: '#854d0e' },
    item: { core: '#f59e0b', light: '#fef3c7', dark: '#78350f' },
  };
  const LOOT_LABEL_FONT = 'bold 9px monospace';
  const LOOT_LABEL_H = 11;
  const LOOT_LABEL_GAP = 2;
  const LOOT_LABEL_STEP = LOOT_LABEL_H + LOOT_LABEL_GAP;

  function getLootLabel(l) {
    const def = l.itemId ? EQUIPMENT_CATALOG[l.itemId] : null;
    if (l.kind === 'item') {
      const isSet = def?.rarity?.includes('Set') || def?.rarity?.includes('Apex');
      return {
        text: `${def?.name || l.itemId}${l.qty > 1 ? ` x${l.qty}` : ''}`,
        color: isSet ? '#fde047' : def?.slot === 'currency' ? '#facc15' : def?.slot === 'consumable' ? '#4ade80' : (def ? (def.rarity === 'Epic' ? '#c084fc' : def.rarity === 'Rare' ? '#38bdf8' : def.rarity === 'Uncommon' ? '#4ade80' : '#f8fafc') : '#f8fafc'),
      };
    }
    if (l.kind === 'relic') return { text: 'Ancient Relic Cache', color: '#fde047' };
    if (l.kind === 'vital') return { text: 'Vital Shard', color: '#f87171' };
    if (l.kind === 'glimmer') return { text: 'Glimmer Shard', color: '#38bdf8' };
    return null;
  }

  // Lay out every ground-item label once per frame in screen space. A label that
  // would cover an already-placed box is lifted above it, so nearby drops read as
  // a clean vertical stack instead of overlapping text.
  function layoutLootLabels(camLeft, camTop) {
    const labels = [];
    for (const l of lootDrops) l._labelY = null;

    ctx.save();
    ctx.font = LOOT_LABEL_FONT;
    for (const l of lootDrops) {
      const label = getLootLabel(l);
      if (!label) continue;
      if (l.ttl < 6 && Math.floor(globalTime * 8) % 2 === 0) continue;
      const sx = Math.round(l.x - camLeft);
      const sy = Math.round(l.y - camTop);
      if (sx < -240 || sx > viewW + 240 || sy < -120 || sy > viewH + 120) continue;
      labels.push({ l, sx, sy, w: Math.ceil(ctx.measureText(label.text).width) + 8 });
    }
    ctx.restore();

    // Place the lowest drop first, then lift each overlapping label above it.
    labels.sort((a, b) => (b.sy - a.sy) || (a.sx - b.sx) || String(a.l.id).localeCompare(String(b.l.id)));
    const placed = [];
    for (const item of labels) {
      let y = Math.round(item.sy - 20);
      for (let guard = 0; guard < 200; guard++) {
        const hit = placed.find((p) =>
          Math.abs(item.sx - p.sx) * 2 < (item.w + p.w) &&
          Math.abs(y - p.y) < LOOT_LABEL_H
        );
        if (!hit) break;
        y = hit.y - LOOT_LABEL_STEP;
      }
      item.l._labelY = y;
      placed.push({ sx: item.sx, y, w: item.w });
    }
  }

  function shortenBadgeLabel(raw) {
    if (!raw) return '';
    return raw
      .replace(' [Click / E]', ' [E]')
      .replace(' [Click / T]', ' [T]')
      .replace('The Grand AetherSwap Exchange', 'AetherSwap Exchange')
      .replace('The Grand AetherVault Bank', 'AetherVault Bank')
      .replace('Celestial Loom & Hearth', 'Celestial Loom')
      .replace('Cosmic Star-Anvil', 'Star-Anvil')
      .replace('Aetherial Crucible', 'Crucible')
      .replace('Vanguard Bounty Board', 'Bounty Board')
      .replace('Sanctuary Provisions Stall', 'Provisions Stall')
      .replace('Sanctuary Forge Workbench', 'Forge Workbench')
      .replace('Citadel Bounty Board', 'Bounty Board')
      .replace('Undercity Bounty Board', 'Bounty Board')
      .replace('Orchard Bounty Board', 'Bounty Board')
      .replace('Mirrorgate Bounty Board', 'Bounty Board')
      .replace('Crater Bounty Board', 'Bounty Board')
      .replace('Rift Bounty Board', 'Bounty Board')
      .replace('Caldera Bounty Board', 'Bounty Board')
      .replace('Expedition Waystation Hearth', 'Waystation Hearth')
      .replace('Sanctuary Homecoming Hearth', 'Sanctuary Hearth');
  }

  const overheadBadges = [];

  function layoutOverheadBadges(camLeft, camTop) {
    overheadBadges.length = 0;

    // 1. Interactive Props with labels
    for (const pr of props) {
      if (!pr.label) continue;
      const dist = Math.hypot(player.x - pr.x, player.y - pr.y);
      if (dist >= 220) continue;
      const alpha = Math.min(1, Math.max(0, (220 - dist) / 60));
      const sx = Math.round(pr.x - camLeft);
      const sy = Math.round(pr.y - camTop);
      if (sx < -140 || sx > viewW + 140 || sy < -80 || sy > viewH + 80) continue;

      const shortTxt = shortenBadgeLabel(pr.label);
      ctx.save();
      ctx.font = '700 9.5px "Outfit", system-ui, sans-serif';
      const tw = Math.ceil(ctx.measureText(shortTxt).width);
      ctx.restore();

      overheadBadges.push({
        id: 'prop_' + pr.x + '_' + pr.y,
        kind: 'prop',
        wx: pr.x,
        wy: pr.y,
        sx,
        sy: sy - 36,
        text: shortTxt,
        tw,
        alpha,
        textColor: '#f0f9ff',
        borderColor: '#38bdf8',
        bg: 'rgba(7, 10, 20, 0.92)',
        rotDeg: 0,
        offsetY: 0,
      });
    }

    // 2. NPCs with names
    for (const npc of npcs) {
      const sx = Math.round(npc.x - camLeft);
      const sy = Math.round(npc.y - camTop);
      if (sx < -140 || sx > viewW + 140 || sy < -80 || sy > viewH + 80) continue;

      const npcName = npc.name || 'Herald Lyra';
      ctx.save();
      ctx.font = '700 9.5px "Outfit", system-ui, sans-serif';
      const tw = Math.ceil(ctx.measureText(npcName).width);
      ctx.restore();

      overheadBadges.push({
        id: npc.id || ('npc_' + npc.x + '_' + npc.y),
        kind: 'npc',
        wx: npc.x,
        wy: npc.y,
        sx,
        sy: sy - 32,
        text: npcName,
        tw,
        alpha: 1,
        textColor: '#fde047',
        borderColor: '#fde047',
        bg: 'rgba(5, 7, 18, 0.92)',
        rotDeg: 0,
        offsetY: 0,
      });
    }

    // Sort badges by geographical location:
    // Entities that are geographically higher up (further north / smaller wy, then smaller wx)
    // are sorted first so their labels sit on top of the vertical stack.
    overheadBadges.sort((a, b) => (a.wy - b.wy) || (a.wx - b.wx));

    // Non-overlapping vertical stacking:
    // When two or more labels collide horizontally, the geographically higher entity's label
    // stays above, and the lower entity's label stacks directly beneath it. No rotation!
    const placed = [];
    for (const badge of overheadBadges) {
      let targetY = badge.sy;
      for (const p of placed) {
        const xDist = Math.abs(badge.sx - p.sx);
        const minXDist = (badge.tw + p.tw) / 2 + 8;
        if (xDist < minXDist) {
          // Horizontal collision! Since badge is geographically lower than p,
          // badge must sit cleanly below p.
          if (targetY < p.renderY + 16) {
            targetY = p.renderY + 16;
          }
        }
      }
      badge.renderY = Math.round(targetY);
      placed.push(badge);
    }
  }

  function drawOverheadBadge(b) {
    ctx.save();
    ctx.globalAlpha = b.alpha !== undefined ? b.alpha : 1;
    ctx.font = '700 9.5px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bx = Math.round(b.sx);
    const by = Math.round(b.renderY !== undefined ? b.renderY : b.sy);

    ctx.translate(bx, by);

    const padX = 5;
    const boxW = b.tw + padX * 2;
    const boxH = 15;

    ctx.fillStyle = b.bg;
    ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.strokeStyle = b.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

    // Text shadow and main text
    ctx.fillStyle = '#05070f';
    ctx.fillText(b.text, 0.8, 1);
    ctx.fillStyle = b.textColor;
    ctx.fillText(b.text, 0, 0.2);

    ctx.restore();
  }

  function drawLootShard(l, sx, sy) {
    const st = LOOT_STYLE[l.kind] || LOOT_STYLE.glimmer;
    const blink = l.ttl < 6 && Math.floor(globalTime * 8) % 2 === 0;
    if (blink) return;
    // Ground drops rest stationary on their tile — no sine hop, bounce, or drift.
    const cy = sy - 6;
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
    if (l.kind === 'item') {
      const def = l.itemId ? EQUIPMENT_CATALOG[l.itemId] : null;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fillRect(sx - 8, cy - 2, 17, 1);
      const iconCv = l.itemId ? getItemCanvas(l.itemId, 16) : null;
      if (iconCv) {
        ctx.drawImage(iconCv, Math.round(sx - 8), Math.round(cy - 16), 16, 16);
      } else if (def?.icon) {
        ctx.font = '13px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icon, sx, cy - 8);
      }
    }

    // Ground Items Label. The Y position is computed once per frame
    // by layoutLootLabels() so nearby labels stack instead of overlapping.
    const label = getLootLabel(l);
    if (label) {
      const labelY = Number.isFinite(l._labelY) ? l._labelY : Math.round(cy - 20);
      const rx = Math.round(sx);

      ctx.save();
      ctx.font = LOOT_LABEL_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = Math.ceil(ctx.measureText(label.text).width);
      const boxW = tw + 8;
      const boxX = Math.round(rx - boxW / 2);
      const boxY = Math.round(labelY - LOOT_LABEL_H / 2);

      ctx.fillStyle = 'rgba(5, 8, 18, 0.90)';
      ctx.fillRect(boxX, boxY, boxW, LOOT_LABEL_H);
      ctx.strokeStyle = label.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxW, LOOT_LABEL_H);

      ctx.fillStyle = '#05070f';
      ctx.fillText(label.text, rx + 1, labelY + 1);
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, rx, labelY);
      ctx.restore();
    }
  }

  function handleOfflineArenaEnd(won, winningTeam = 'blue') {
    if (offlineArenaEnded) return;
    offlineArenaEnded = true;

    if (won) {
      if (audio && audio.playQuestCompleteFanfare) audio.playQuestCompleteFanfare();
      else if (audio && audio.playLevelUp) audio.playLevelUp();
      awardXP(120, '3v3 Arena Victory');
      if (localProfile?.statsMeta) {
        localProfile.statsMeta.arenaWins = (localProfile.statsMeta.arenaWins || 0) + 1;
      }
      saveProgressionLocal();
      spawnFCT(player.x, player.y - 20, '🏆 3v3 ARENA VICTORY!', '#facc15', true);
      logMessage('🏆 [3v3 VICTORY!] Enemy Nexus shattered! +1 Ranked Arena Win! Teleporting back in 3 seconds...', 'log-solari', 'combat');
    } else {
      audio.playHurt?.();
      spawnFCT(player.x, player.y - 20, '💀 3v3 ARENA DEFEAT', '#ef4444', true);
      logMessage('💀 [3v3 DEFEAT] Your Sanctuary Nexus fell! Teleporting back in 3 seconds...', 'log-danger', 'combat');
    }

    setTimeout(() => {
      if (currentRoomType !== ROOM_TYPES.ARENA_3V3) return;
      offlineArenaEnded = false;
      const returnSpot = preArenaSpot || { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 0 };
      preArenaSpot = null;
      buildOfflineZone(returnSpot.roomType, returnSpot.x, returnSpot.y);
      player.hp = player.maxHp;
      updatePlayerUI();
      spawnFCT(player.x, player.y - 18, '✨ RETURNED FROM ARENA', '#38bdf8', true);
      const zoneTitle = ROOM_CONFIGS[returnSpot.roomType]?.shortTitle || returnSpot.roomType;
      logMessage(`✨ [3v3 Arena] Teleported back to your previous location (${zoneTitle.toUpperCase()})!`, 'log-gain', 'chat');
      if (audio && audio.playPortal) audio.playPortal();
    }, 3000);
  }

  function killOfflineEntity(ent) {
    if (!ent || ent.isDying) return;
    ent.isDying = true;
    ent.deathAge = 0;

    if (currentTarget && currentTarget.id === ent.id) {
      setTarget(null);
    }

    if (currentRoomType === ROOM_TYPES.ARENA_3V3) {
      if (ent.id === 'red_nexus') {
        handleOfflineArenaEnd(true, 'blue');
        return;
      }
      if (ent.id === 'blue_nexus') {
        handleOfflineArenaEnd(false, 'red');
        return;
      }
      if (ent.type === 'mob') {
        const remainingFoes = entities.filter((e) => e.type === 'mob' && !e.isDying && e.id !== ent.id);
        if (remainingFoes.length === 0) {
          const redN = entities.find((e) => e.id === 'red_nexus');
          if (redN) {
            redN.hp = 0;
            redN.isDying = true;
          }
          handleOfflineArenaEnd(true, 'blue');
          return;
        }
      }
    }

    triggerEntityDeathEffect(ent.x, ent.y, ent.isBoss);
    logMessage(`[Void Banish] ${ent.name} was cast into the Void!`, 'log-gain', 'combat');

    // Day 3 Mythic affixes (offline mirror of the authoritative server).
    if (offlineMythic?.active && ent.type === 'mob' && !ent.isBoss) {
      if (offlineMythic.affixes.includes('bolstering')) {
        for (const m of entities) {
          if (m === ent || m.type !== 'mob' || m.isDying) continue;
          if ((m.bolsterStacks || 0) >= 8) continue;
          if (Math.hypot(m.x - ent.x, m.y - ent.y) > 420) continue;
          const prevMax = m.maxHp;
          m.maxHp = Math.max(1, Math.round(m.maxHp * 1.15));
          m.hp = Math.min(m.maxHp, (m.hp || 0) + (m.maxHp - prevMax));
          m.damage = Math.max(1, Math.ceil((m.damage || 3) * 1.15));
          m.bolsterStacks = (m.bolsterStacks || 0) + 1;
        }
      }
      if (offlineMythic.affixes.includes('sanguine')) {
        groundZones.push({
          id: `off_sang_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          type: 'sanguine_pool',
          color: '#ef4444',
          x: ent.x,
          y: ent.y,
          radius: 62,
          age: 0,
          maxAge: 8,
          tickTimer: 0,
        });
      }
    }
    awardXP(ent.xpReward ?? 30, ent.name);
    awardProfessionXP('combat_mastery', Math.max(20, Math.round((ent.xpReward ?? 30) * 0.75)), ent.name);
    if (ent.isBoss) {
      logMessage(`🏆 CONTINENTAL VICTORY: ${ent.name} has been vanquished! The Leylines surge with an Ancient Paragon Cache!`, 'log-solari', 'combat');
      if ((prog.level || 1) >= 30) {
        awardXP(450, 'Ancient Paragon Cache');
      }
      if (offlineMythic?.active) {
        const runDungeon = MYTHIC_DUNGEONS[offlineMythic.dungeonId];
        if (runDungeon && runDungeon.roomType === currentRoomType) {
          completeOfflineMythic(ent, runDungeon);
        }
      }
    }
    if (ent.type === 'mob') {
      spawnOfflineLoot(ent);
      onPlayerKilledMob(currentRoomType, ent.name, ent.isBoss, ent.id, ent.type);
    }

    ent.inCombat = false;
    ent.target = null;
    ent.targetPlayerId = null;

    if (ent.isMinion) return;

    const deathRoom = currentRoomType;
    const respawnTemplate = {
      ...ent,
      hp: ent.maxHp,
      isDying: false,
      deathAge: 0,
      frozen: false,
      freezeTimer: 0,
      hitFlash: 0,
      inCombat: false,
      target: null,
      targetPlayerId: null,
      spawnAggroGrace: 2.0,
      phase: 1,
      enraged: false,
      damage: ent.baseDamage || ent.damage,
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
      questState.titanChallenges = (questState.titanChallenges || 0) + 1;
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

    if (ent.type === 'dummy' && ent.hp > 0 && !ent.noHitXp) {
      awardXP(8, '');
      questState.combatTrainingHits = (questState.combatTrainingHits || 0) + 1;
      if (questState.combatTrainingHits % 5 === 0) {
        awardProfessionXP('combat_mastery', 15, '');
      }
      if (questCounter('quest_skill_combat', 'combatTrainingHits') === 15 && questState.activeQuests?.quest_skill_combat) {
        logMessage('📜 [Quest Objective] Training dummy strikes (15/15)! Return to Commander Valerius!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ COMBAT DRILL COMPLETE (15/15)!', '#facc15', true);
        if (audio && audio.playChime) audio.playChime();
      }
      saveQuestState();
      updateQuestTrackerHUD();
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
        for (const e of entities) {
          if (e.type === 'mob') {
            e.inCombat = false;
            e.target = null;
            e.targetPlayerId = null;
          }
        }
        triggerEntityDeathEffect(player.x, player.y, true);
        if (currentRoomType === ROOM_TYPES.ARENA_3V3) {
          logMessage(`[3v3 DEFEAT] Slain in the Arena! Teleporting back to your previous location in 3s...`, 'log-danger', 'combat');
          showDeathScreen(3);
          setTimeout(() => {
            player.isDead = false;
            player.hp = player.maxHp;
            player.shield = 0;
            player.solarCharge = 0;
            hideDeathScreen();
            const returnSpot = preArenaSpot || { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 0 };
            preArenaSpot = null;
            offlineArenaEnded = false;
            buildOfflineZone(returnSpot.roomType, returnSpot.x, returnSpot.y);
            updatePlayerUI();
            spawnFCT(player.x, player.y - 18, '✨ RETURNED FROM ARENA', '#38bdf8', true);
            logMessage(`✨ [3v3 Arena] Teleported back to your previous location!`, 'log-gain', 'chat');
            if (audio && audio.playPortal) audio.playPortal();
          }, 3000);
          return;
        }
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
    if (!spec) {
      logMessage(`[Action Bar] Slot ${slot} is empty — drag a Rite or Flash onto it first.`, 'log-combat');
      return;
    }

    // Ability Requirement: Abilities with 0 points allocated cannot be cast!
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

    if (isRite) {
      awardProfessionXP('rites', 18 + Math.round((spec.cost || 10) * 1.2), spec.name);
    } else if (isFlash) {
      awardProfessionXP('flashes', 14 + Math.round((spec.cost || 5) * 1.5), spec.name);
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
    // 0. Check for nearby Artisan Crafting Station or Bounty Board when nothing closer is targeted
    if (!currentTarget || (currentTarget.type !== 'shrine' && currentTarget.type !== 'node')) {
      const nearStation = props.find((pr) => (pr.stationId || pr.isBountyBoard) && Math.hypot(pr.x - player.x, pr.y - player.y) <= 78);
      if (nearStation) {
        if (nearStation.stationId) window.openCraftingModal(nearStation.stationId);
        else window.openBountyBoard();
        return;
      }
    }

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
      if (shrine.charges === 0) shrine.rechargeTimer = 15;
      player.shrineBuff = { affinity: shrine.affinity, name: shrine.buffName, timer: 60 };
      spawnSparkBurst(shrine.x, shrine.y - 12, ['#facc15', '#ffffff', '#38bdf8', '#c084fc'], 32);
      spawnFCT(player.x, player.y - 14, `✨ ${shrine.buffName.toUpperCase()} BLESSING!`, '#facc15', true);
      logMessage(`✨ [LEYLINE BLESSING] ${shrine.name} granted ${shrine.buffName} (+Stats for 60s)!`, 'log-solari');
      questState.extractionNodesHarvested = (questState.extractionNodesHarvested || 0) + 1;
      advanceBountyProgress('harvests', 1);
      if (currentRoomType === ROOM_TYPES.AETHER_SPIRE || shrine.id === 'aeth_node_1') {
        questState.aetherFontChannels = (questState.aetherFontChannels || 0) + 1;
        questState.aetherFontChanneled = true;
        if (questState.activeQuests?.quest_stargazer_chronos && questCounter('quest_stargazer_chronos', 'aetherFontChannels') === 1) {
          logMessage('📜 [Quest Objective] Mirrorgate Star Font channeled! Return to Astromancer Kaelen!', 'log-quest', 'chat');
          spawnFCT(player.x, player.y - 14, '✨ STAR FONT CHANNELED!', '#facc15', true);
        }
      }
      saveQuestState();
      updateQuestTrackerHUD();
      if (net.connected) {
        net.send({ type: 'harvest_node', nodeId: shrine.id });
      } else {
        awardProfessionXP('resonance_extraction', 45, `${shrine.name} Channeling`);
      }
      return;
    }

    // 2. Otherwise harvest World Skilling Vein / Herb / Fiber or Glimmer Node
    let node = currentTarget && currentTarget.type === 'node' ? currentTarget : null;
    if (!node) {
      node = entities.find((e) => e.type === 'node' && Math.hypot(e.x - player.x, e.y - player.y) <= 6.8 * YARD_PX);
    }
    if (!node || Math.hypot(node.x - player.x, node.y - player.y) > 7.0 * YARD_PX) {
      logMessage('[Gathering] Step near an Ore Vein, Herb Cluster, Glimmer Node, or Artisan Station first!', 'log-combat');
      return;
    }
    if (node.charges <= 0) {
      logMessage(`[Gathering] ${node.name || 'This node'} is depleted. Wait a moment for it to replenish.`, 'log-combat');
      return;
    }

    // 2A. World Skilling Vein / Herb Cluster / Silk Bloom (cosmic gathering)
    if (node.skillingType && SKILLING_NODE_TYPES[node.skillingType]) {
      const skSpec = SKILLING_NODE_TYPES[node.skillingType];
      const profXpCur = Number(prog?.professions?.[skSpec.profession]?.xp) || 0;
      const profLvl = getProfessionLevelFromXp(profXpCur);
      if (profLvl < (skSpec.reqLevel || 1)) {
        const profName = PROFESSIONS_CATALOG[skSpec.profession]?.name || skSpec.profession;
        logMessage(`🔒 Requires Lv.${skSpec.reqLevel} ${profName} to harvest ${skSpec.name} (Current: Lv.${profLvl})!`, 'log-combat');
        spawnFCT(player.x, player.y - 14, `🔒 LV.${skSpec.reqLevel} ${profName.toUpperCase()}`, '#ef4444');
        audio.playHurt();
        return;
      }
      const harvestNow = performance.now();
      if (harvestNow - lastNodeHarvestAt < 450) return;
      lastNodeHarvestAt = harvestNow;
      if (currentTarget !== node) setTarget(node);
      audio.playChime();
      node.charges--;
      if (node.charges === 0) node.rechargeTimer = skSpec.respawnSec || 14;
      questState.extractionNodesHarvested = (questState.extractionNodesHarvested || 0) + 1;
      if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !questState.nodeHarvested) {
        questState.nodeHarvested = true;
      }
      if (currentRoomType === ROOM_TYPES.STARFALL_CRATER && (node.skillingType === 'mithril_vein' || node.skillingType === 'starmetal_vein')) {
        questState.starfallVeins = (questState.starfallVeins || 0) + 1;
        if (questState.activeQuests?.quest_starfall_forge && questCounter('quest_starfall_forge', 'starfallVeins') === 3) {
          logMessage('📜 [Quest Objective] Starfall Astral Veins mined (3/3)!', 'log-quest', 'chat');
          spawnFCT(player.x, player.y - 14, '✨ ASTRAL VEINS MINED (3/3)!', '#facc15', true);
        }
      }
      advanceBountyProgress('harvests', 1);
      saveQuestState();
      updateQuestTrackerHUD();
      spawnSparkBurst(node.x, node.y - 8, skSpec.sparkColors || ['#facc15', '#ffffff'], 16);

      if (net.connected) {
        net.send({ type: 'harvest_node', nodeId: node.id });
      } else {
        const yields = skSpec.yields || [];
        const totalChance = yields.reduce((sum, y) => sum + (y.chance || 1), 0) || 1;
        let roll = Math.random() * totalChance;
        let chosen = yields[0] || { id: 'sun_copper_ore', qty: 1 };
        for (const y of yields) {
          roll -= (y.chance || 1);
          if (roll <= 0) {
            chosen = y;
            break;
          }
        }
        const chosenId = chosen.id || chosen.itemId || 'sun_copper_ore';
        const qty = chosen.qty || 1;
        player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + (skSpec.glimmer || 12));
        const added = addItemToBackpack(localProfile, chosenId, qty);
        if (added) {
          saveProgressionLocal();
          const itemDef = EQUIPMENT_CATALOG[chosenId];
          spawnFCT(player.x, player.y - 14, `+${qty}x ${itemDef?.name || chosenId}`, (skSpec.sparkColors && skSpec.sparkColors[0]) || '#fde047', true);
          logMessage(`⛏️ Harvested ${qty}x ${itemDef?.name || chosenId} (+${skSpec.glimmer || 12} Glimmer) from ${skSpec.name}!`, 'log-gain', 'combat');
        } else {
          spawnFCT(player.x, player.y - 14, 'BACKPACK FULL (28/28)', '#ef4444');
          logMessage('🎒 Backpack is full (28/28)! Deposit materials in your Bank or smelt them at an Artisan Station.', 'log-combat');
        }
        awardProfessionXP(skSpec.profession, skSpec.xp || 25, skSpec.name, false);
        if (skSpec.secondaryProfession) {
          awardProfessionXP(skSpec.secondaryProfession, Math.max(8, Math.round((skSpec.xp || 25) * 0.35)), skSpec.name, false);
        }
        awardXP(4, skSpec.name);
        if (document.getElementById('inventory-modal')?.style.display === 'block') {
          renderInventoryModal({ profile: localProfile });
        }
      }
      return;
    }

    const isGrand = Boolean(node.isGrand);
    const cooldownMs = isGrand ? HARVEST_COOLDOWN_MS.grand : HARVEST_COOLDOWN_MS.normal;
    const harvestNow = performance.now();
    if (harvestNow - lastNodeHarvestAt < cooldownMs) return;
    lastNodeHarvestAt = harvestNow;
    if (currentTarget !== node) setTarget(node);
    audio.playChime();
    const eff = getEffectiveStats(prog, localProfile.equipment, localProfile.classId);
    const gain = isGrand ? 60 + eff.resonance * 6 : 18 + Math.floor(eff.resonance * 1.5);
    // Character (combat) XP is deliberately minor; profession XP is the real node reward.
    const charXp = isGrand ? 7 : 3;
    const profXp = isGrand ? 100 : 25;
    node.charges--;
    if (node.charges === 0) node.rechargeTimer = isGrand ? 45 : 11;
    questState.extractionNodesHarvested = (questState.extractionNodesHarvested || 0) + 1;
    advanceBountyProgress('harvests', 1);
    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !questState.nodeHarvested) {
      questState.nodeHarvested = true;
    }
    if (currentRoomType === ROOM_TYPES.AETHER_SPIRE || node.id === 'aeth_node_1') {
      questState.aetherFontChannels = (questState.aetherFontChannels || 0) + 1;
      questState.aetherFontChanneled = true;
      if (questState.activeQuests?.quest_stargazer_chronos && questCounter('quest_stargazer_chronos', 'aetherFontChannels') === 1) {
        logMessage('📜 [Quest Objective] Mirrorgate Star Font channeled! Return to Astromancer Kaelen!', 'log-quest', 'chat');
        spawnFCT(player.x, player.y - 14, '✨ STAR FONT CHANNELED!', '#facc15', true);
      }
    }
    saveQuestState();
    updateQuestTrackerHUD();
    if (net.connected) {
      net.send({ type: 'harvest_node', nodeId: node.id });
    } else {
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + gain);
      spawnFCT(player.x, player.y - 14, `+${gain} GLIMMER`, isGrand ? '#fde047' : '#c084fc', isGrand);
      awardXP(charXp, isGrand ? 'Grand Glimmer Font' : 'Glimmer Node');
      awardProfessionXP('resonance_extraction', profXp, isGrand ? 'Grand Glimmer Font' : 'Channeling Leyline Node');
      if (isGrand || Math.random() < 0.45) {
        const bonusMat = Math.random() < 0.5 ? 'glimmer_shard' : 'astral_mineral_dust';
        if (addItemToBackpack(localProfile, bonusMat, 1)) {
          saveProgressionLocal();
          logMessage(`✨ Extracted +1 ${EQUIPMENT_CATALOG[bonusMat]?.name || bonusMat} from Leyline resonance!`, 'log-gain', 'combat');
        }
      }
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
            <img src="${fm.logo}" alt="${pl.faction}" style="width:20px; height:20px; object-fit:contain; display:block; margin:0 auto 2px; filter:drop-shadow(0 0 3px ${fm.color});" />
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
    if (!preArenaSpot && currentRoomType !== ROOM_TYPES.ARENA_3V3) {
      preArenaSpot = { roomType: currentRoomType, x: Math.round(player.x), y: Math.round(player.y) };
    }
    net.send({
      type: 'queue_arena',
      join: true,
      mode: 'wait',
      returnRoom: preArenaSpot?.roomType || currentRoomType,
      returnX: preArenaSpot?.x ?? Math.round(player.x),
      returnY: preArenaSpot?.y ?? Math.round(player.y),
    });
  };
  window.arenaPlayWithComputer = function () {
    audio.playPortal();
    if (!preArenaSpot && currentRoomType !== ROOM_TYPES.ARENA_3V3) {
      preArenaSpot = { roomType: currentRoomType, x: Math.round(player.x), y: Math.round(player.y) };
    }
    if (net.connected) {
      net.send({
        type: 'queue_arena',
        join: true,
        mode: 'bots',
        returnRoom: preArenaSpot?.roomType || currentRoomType,
        returnX: preArenaSpot?.x ?? Math.round(player.x),
        returnY: preArenaSpot?.y ?? Math.round(player.y),
      });
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
    if (!preArenaSpot && currentRoomType !== ROOM_TYPES.ARENA_3V3) {
      preArenaSpot = { roomType: currentRoomType, x: Math.round(player.x), y: Math.round(player.y) };
    }
    window.dismissArenaInvite();
    if (document.getElementById('arena-modal')?.style.display !== 'block') window.toggleModal('arena-modal');
  };
  window.dismissArenaInvite = function () {
    clearTimeout(arenaInviteTimer);
    const toast = document.getElementById('arena-invite-toast');
    if (toast) toast.style.display = 'none';
  };

  window.toggleMatchmaking = function () {
    if (!preArenaSpot && currentRoomType !== ROOM_TYPES.ARENA_3V3) {
      preArenaSpot = { roomType: currentRoomType, x: Math.round(player.x), y: Math.round(player.y) };
    }
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

  function getHarvestKeyLabel() {
    return formatKeyLabel(keybinds?.harvest || DEFAULT_KEYBINDS.harvest);
  }

  function getEntitySubtitle(ent) {
    if (!ent) return 'World Entity';
    const key = getHarvestKeyLabel();
    if ((ent.type === 'node' || ent.type === 'shrine') && (ent.charges ?? 0) <= 0) {
      return ent.type === 'shrine' ? 'Depleted Shrine' : `Depleted ${ent.isGrand ? 'Grand Font' : 'Node'}`;
    }
    const base = String(ent.sub || (ent.type === 'node' ? 'Glimmer Leyline Node' : ent.type === 'shrine' ? 'Ancient Leyline Shrine' : 'World Entity'));
    if (base.includes('[E]')) return base.replace(/\[E\]/g, `[${key}]`);
    if (ent.type === 'node' || ent.type === 'shrine') return `${base} • Channel [${key}]`;
    return base;
  }

  // ==========================================
  // Action Bar — drag & drop slots
  // ==========================================
  // Ability slots (1-4, 9-12) start empty except the class primary in slot 1.
  // Item slots (5-8) hold bag items the player drags down from the backpack.
  const ITEM_ACTION_SLOTS = [5, 6, 7, 8];
  let actionBarItems = {};
  let actionBarSignature = '';

  function getActionBarStorageKey() {
    const charKey = localProfile?.activeCharacterId || localProfile?.id || 'local_hero';
    return `glimmerfall_action_items_${charKey}`;
  }

  function loadActionBarItems() {
    actionBarItems = {};
    try {
      const raw = localStorage.getItem(getActionBarStorageKey());
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object') {
        for (const slot of ITEM_ACTION_SLOTS) {
          const id = parsed[slot];
          const def = id ? EQUIPMENT_CATALOG[id] : null;
          if (def && def.slot !== 'currency') actionBarItems[slot] = id;
        }
      }
    } catch (_) {
      actionBarItems = {};
    }
    actionBarSignature = '';
  }

  function saveActionBarItems() {
    try {
      localStorage.setItem(getActionBarStorageKey(), JSON.stringify(actionBarItems));
    } catch (_) {}
  }

  function countInventoryItem(itemId) {
    if (!itemId) return 0;
    const inv = localProfile.inventory || [];
    let total = 0;
    for (const it of inv) {
      const id = typeof it === 'string' ? it : it?.id;
      if (id !== itemId) continue;
      total += typeof it === 'object' && it?.qty ? it.qty : 1;
    }
    return total;
  }

  loadActionBarItems();

  let quickPickSlot = null;

  function abilityTreeForSlot(slot) {
    return Number(slot) >= 9 ? 'flashes' : 'rites';
  }

  function slotAcceptsAbility(slot, abilityId) {
    const ab = ABILITIES_CATALOG[abilityId];
    if (!ab || ab.id === 'harvest') return false;
    return ACTION_SLOTS.includes(Number(slot));
  }

  function findEquippedSlotForAbility(abilityId) {
    if (!abilityId || !localProfile?.loadout) return null;
    for (const s of ACTION_SLOTS) {
      const cur = localProfile.loadout[s] ?? localProfile.loadout[String(s)];
      if (cur === abilityId) return s;
    }
    return null;
  }

  function buildActionBarSignature() {
    const loadout = ACTION_SLOTS.map((s) => `${s}=${localProfile.loadout?.[s] ?? localProfile.loadout?.[String(s)] ?? ''}`).join(',');
    const ranks = ACTION_SLOTS.map((s) => getAbilityRank(prog, localProfile.loadout?.[s] ?? localProfile.loadout?.[String(s)])).join(',');
    const keys = [...ACTION_SLOTS, 'harvest', ...ITEM_ACTION_SLOTS]
      .map((s) => `${s}=${formatKeyLabel(keybinds[s])}`)
      .join(',');
    const items = ITEM_ACTION_SLOTS
      .map((s) => `${s}=${actionBarItems[s] || ''}:${countInventoryItem(actionBarItems[s])}`)
      .join(',');
    return `${loadout}|${ranks}|${keys}|${items}|LV${prog.level}|P:${pendingAssign?.id || ''}|Q:${quickPickSlot ?? ''}|B:${listeningSlot ?? ''}`;
  }

  function renderActionSlotButton(slot) {
    const spec = getSlotAbilitySpec(localProfile.loadout, slot);
    const unlocked = isSlotUnlocked(prog, slot);
    const rank = spec ? getAbilityRank(prog, spec.id) : 0;
    const learned = Boolean(spec) && rank >= 1;
    const keyLabel = formatKeyLabel(keybinds[slot]);
    let cls = 'action-button';
    let icon = '＋';
    let name = 'Assign';
    let nameColor = '#64748b';
    let title = '';

    if (!unlocked) {
      const reqLvl = SLOT_UNLOCK_LEVELS[slot] || 1;
      cls += ' slot-locked';
      icon = '🔒';
      name = `LV.${reqLvl}`;
      title = `Slot locked — reach Level ${reqLvl}.`;
    } else if (spec && learned) {
      cls += spec.tcgType?.includes('Flash') ? ' flash-card' : ' rite-card';
      icon = spec.icon || '⚔️';
      name = spec.short || 'Skill';
      nameColor = spec.color || '#e2e8f0';
      title = `${spec.name} (Rank ${rank}/5) • Press [${keyLabel}] or click to cast • Drag to move slot • Right-click to clear • Shift+click to rebind`;
    } else if (spec) {
      cls += ' slot-locked';
      icon = spec.icon || '⚔️';
      name = spec.short || 'Skill';
      nameColor = '#ef4444';
      title = `${spec.name} is unlearned — allocate a skill point in the Skill Tree or Spellbook first.`;
    } else {
      cls += ' slot-empty';
      if (quickPickSlot === slot) cls += ' pick-target';
      title = `Empty Slot [${keyLabel}] — Click to choose an ability for this slot, or drag a Rite/Flash here!`;
    }

    const pickTarget = Boolean(pendingAssign) && unlocked && ACTION_SLOTS.includes(slot) && slotAcceptsAbility(slot, pendingAssign.id);
    if (pickTarget) cls += ' pick-target';
    const pickTitle = pickTarget ? ` • Click to place ${ABILITIES_CATALOG[pendingAssign.id]?.name || 'this ability'} here` : '';
    const draggable = spec && learned ? 'true' : 'false';
    return `<div class="${cls}" id="btn-slot-${slot}" data-slot-kind="ability" data-slot="${slot}" draggable="${draggable}" title="${title}${pickTitle}">
      <span class="key-badge">${keyLabel}</span>
      <span class="action-icon">${icon}</span>
      <span class="action-name" style="color:${nameColor};">${name}</span>
      <div class="cooldown-overlay" id="cd-${slot}"></div>
    </div>`;
  }

  function renderActionItemSlot(slot) {
    const itemId = actionBarItems[slot];
    const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
    const qty = countInventoryItem(itemId);
    const keyLabel = formatKeyLabel(keybinds[slot]);
    const depleted = Boolean(item) && qty <= 0;
    let cls = 'action-button item-card';
    if (!item) cls += ' slot-empty';
    if (depleted) cls += ' slot-depleted';

    const icon = item
      ? `<img class="action-item-icon pixel-art" src="${getItemIconDataUrl(item.id, 22)}" width="22" height="22" alt="${item.name}" />`
      : '＋';
    const shortName = item
      ? item.name.replace(/^(Sunforged|Ironwood|Chrono|Duskveil|Aurelius)\s*/i, '').split(' ')[0]
      : 'Item';
    const title = item
      ? `${item.name}${qty >= 1 ? ` ×${qty}` : ''}${depleted ? ' — none left in your bag' : ''} • [${keyLabel}] to use • Right-click to clear`
      : `Empty item slot — drag a potion, food, or gear piece here from the bag. [${keyLabel}]`;

    return `<div class="${cls}" id="btn-item-${slot}" data-slot-kind="item" data-slot="${slot}" draggable="${item ? 'true' : 'false'}" title="${title}">
      <span class="key-badge">${keyLabel}</span>
      <span class="action-icon">${icon}</span>
      <span class="action-name">${shortName}</span>
      ${item && qty >= 1 ? `<span class="action-qty">${qty}</span>` : ''}
    </div>`;
  }

  function findFirstFreeAbilitySlot() {
    for (const s of ACTION_SLOTS) {
      if (!(localProfile.loadout?.[s] ?? localProfile.loadout?.[String(s)])) return s;
    }
    return null;
  }

  function findFirstFreeItemSlot() {
    for (const s of ITEM_ACTION_SLOTS) {
      if (!actionBarItems[s]) return s;
    }
    return ITEM_ACTION_SLOTS[0];
  }

  // Fills empty action bar slots with learned abilities of this character's faction.
  function autoFillLearnedSlots() {
    const resolved = resolveFactionAndClass({
      faction: localProfile.faction,
      classId: localProfile.classId,
      loadout: localProfile.loadout,
      orderTag: localProfile.orderTag,
    });
    const next = sanitizeLoadout(localProfile.loadout, resolved.classId);
    const equipped = new Set(Object.values(next).filter(Boolean));
    let added = 0;

    const pool = Object.values(ABILITIES_CATALOG)
      .filter((ab) => ab.id !== 'harvest' && ab.faction === resolved.faction)
      .filter((ab) => getAbilityRank(prog, ab.id) >= 1 && !equipped.has(ab.id))
      .sort((a, b) => (a.tier || 1) - (b.tier || 1) || (getAbilityRank(prog, b.id) - getAbilityRank(prog, a.id)));

    for (const slot of ACTION_SLOTS) {
      if (next[slot] || !isSlotUnlocked(prog, slot)) continue;
      const ab = pool.shift();
      if (!ab) break;
      next[slot] = ab.id;
      if (!prog.ranks) prog.ranks = {};
      prog.ranks[slot] = getAbilityRank(prog, ab.id);
      equipped.add(ab.id);
      added += 1;
    }

    localProfile.loadout = next;
    if (added > 0) {
      saveProgressionLocal();
      if (net.connected) net.send({ type: 'update_loadout', loadout: next });
      actionBarSignature = '';
      updateActionBarBadges();
      if (typeof renderSkillTreeUI === 'function') renderSkillTreeUI();
      if (document.getElementById('keybind-list-container')?.style.display === 'block') renderKeybindUI();
    }
    return added;
  }

  window.autoEquipLearnedAbilities = function () {
    const added = autoFillLearnedSlots();
    if (added > 0) {
      audio.playChime?.();
      logMessage(`[Action Bar] Auto-equipped ${added} learned Rite/Flash${added === 1 ? '' : 'es'} into empty slots.`, 'log-gain');
    } else {
      audio.playHurt?.();
      logMessage('[Action Bar] Every learned Rite/Flash is already on the bar — nothing to auto-equip.', 'log-combat');
    }
  };

  // One-time restore so characters created before the slot-1-only bar change get their learned kit back.
  function restoreLearnedBarOnce() {
    if (!localProfile || !prog) return;
    if ((prog.level || 1) < 5) return;
    const charKey = localProfile.activeCharacterId || localProfile.id || 'local_hero';
    const flagKey = `glimmerfall_bar_restored_${charKey}`;
    try {
      if (localStorage.getItem(flagKey)) return;
    } catch (_) {
      return;
    }
    // Recover learned ranks from the pre-migration slot progression so old
    // characters keep every ability they had, not just the ones they invested in.
    const cls = CLASSES_CATALOG[localProfile.classId] || CLASSES_CATALOG.solari_vanguard;
    const legacyMap = cls.legacyDefaultLoadout || {};
    if (!prog.skills) prog.skills = {};
    for (const [slotStr, abilityId] of Object.entries(legacyMap)) {
      const slotRank = Number(prog.ranks?.[slotStr] || 0);
      if (slotRank > 0) prog.skills[abilityId] = Math.max(prog.skills[abilityId] || 0, Math.min(5, slotRank));
    }

    const added = autoFillLearnedSlots();
    try {
      localStorage.setItem(flagKey, '1');
    } catch (_) {}
    if (added > 0) {
      logMessage(`[Action Bar] Restored ${added} learned Rite/Flash${added === 1 ? '' : 'es'} to your bar. Click a slot or press its key to cast, right-click to clear, SHIFT+click to rebind.`, 'log-gain');
    }
  }

  function handleActionBarDrop(ev, slotKind, slot) {
    const raw = (ev.dataTransfer?.getData('application/x-glimmerfall') || ev.dataTransfer?.getData('text/plain') || '').trim();
    const sep = raw.indexOf(':');
    const kind = sep >= 0 ? raw.slice(0, sep) : raw;
    const id = sep >= 0 ? raw.slice(sep + 1) : '';
    if (!id) return;

    if (kind === 'ability') {
      const target = slotKind === 'ability' ? slot : findFirstFreeAbilitySlot();
      if (target === null) {
        logMessage('[Action Bar] Every Rite/Flash slot is full — right-click one to clear it first.', 'log-combat');
        return;
      }
      window.assignSlotAbilityInGame(target, id);
      return;
    }

    if (kind === 'item') {
      const item = EQUIPMENT_CATALOG[id];
      if (!item || item.slot === 'currency') return;
      const target = slotKind === 'item' ? slot : findFirstFreeItemSlot();
      actionBarItems[target] = id;
      saveActionBarItems();
      actionBarSignature = '';
      updateActionBarBadges();
      audio.playPickup?.();
      logMessage(`[Action Bar] Bound ${item.name} to item slot ${target} [${formatKeyLabel(keybinds[target])}].`, 'log-gain');
    }
  }

  window.closeQuickSlotPicker = function () {
    if (quickPickSlot === null) return;
    quickPickSlot = null;
    actionBarSignature = '';
    updateActionBarBadges();
  };

  function renderQuickSlotPickerPopover(targetSlot) {
    const resolved = resolveFactionAndClass({
      faction: localProfile.faction,
      classId: localProfile.classId,
      loadout: localProfile.loadout,
      orderTag: localProfile.orderTag,
    });
    const myFaction = resolved.faction;
    const keyLabel = formatKeyLabel(keybinds[targetSlot]);
    const learnedSkills = Object.values(ABILITIES_CATALOG)
      .filter((ab) => ab.id !== 'harvest' && ab.faction === myFaction && getAbilityRank(prog, ab.id) >= 1)
      .sort((a, b) => (a.tier || 1) - (b.tier || 1));

    const buttonsHtml = learnedSkills
      .map((ab) => {
        const curSlot = findEquippedSlotForAbility(ab.id);
        const curSlotKey = curSlot ? formatKeyLabel(keybinds[curSlot]) : null;
        const r = getAbilityRank(prog, ab.id);
        return `<button type="button" class="quick-pick-ability-btn ${curSlot ? 'is-equipped' : ''}" onclick="assignSlotAbilityInGame(${targetSlot}, '${ab.id}')">
          <span class="qp-icon">${ab.icon}</span>
          <span class="qp-info">
            <span class="qp-name" style="color:${ab.color || '#facc15'};">${ab.name} <small style="color:#94a3b8;">(R${r}/5)</small></span>
            <span class="qp-status">${curSlot ? `✓ In Slot [${curSlotKey}] — Click to move to [${keyLabel}]` : `Click to equip in [${keyLabel}]`}</span>
          </span>
        </button>`;
      })
      .join('');

    return `
      <div class="bar-quick-picker" onclick="event.stopPropagation()">
        <div class="bqp-header">
          <span>⚡ CHOOSE ABILITY FOR SLOT ${targetSlot} <b>[${keyLabel}]</b></span>
          <div style="display:flex; gap:4px;">
            <button type="button" class="util-btn" style="padding:2px 6px; font-size:8.5px; border-color:#38bdf8; color:#7dd3fc;" onclick="closeQuickSlotPicker(); toggleModal('spellbook-modal')">📖 SPELLBOOK [P]</button>
            <button type="button" class="util-btn" style="padding:2px 6px; font-size:8.5px;" onclick="closeQuickSlotPicker()">✕</button>
          </div>
        </div>
        <div class="bqp-list">
          ${buttonsHtml || `<div style="font-size:10px; color:#94a3b8; padding:6px;">No abilities learned yet — open Spellbook [P] to invest points!</div>`}
        </div>
      </div>
    `;
  }

  function renderActionBar() {
    const cluster = document.getElementById('action-bar-cluster');
    if (!cluster) return;
    const harvestKey = getHarvestKeyLabel();
    const pickedSpec = pendingAssign ? ABILITIES_CATALOG[pendingAssign.id] : null;
    const listeningSpec = listeningSlot !== null ? getSlotAbilitySpec(localProfile.loadout, listeningSlot) : null;
    let pickHint = '';
    if (pickedSpec) {
      const curSlot = findEquippedSlotForAbility(pickedSpec.id);
      const curText = curSlot ? ` (currently in [${formatKeyLabel(keybinds[curSlot])}])` : '';
      pickHint = `<div class="bar-pick-hint">PLACING <b>${pickedSpec.name.toUpperCase()}</b>${curText} — click any glowing ability slot ([1]–[4] or [Q]/[R]/[F]/[C]) • ESC cancels</div>`;
    } else if (listeningSlot !== null) {
      const bindName = listeningSpec?.name || (ITEM_ACTION_SLOTS.includes(Number(listeningSlot)) ? `Item Slot ${listeningSlot}` : `Slot ${listeningSlot}`);
      pickHint = `<div class="bar-pick-hint">PRESS ANY KEY TO BIND <b>${bindName.toUpperCase()}</b> • ESC cancels</div>`;
    } else if (quickPickSlot !== null && ACTION_SLOTS.includes(Number(quickPickSlot))) {
      pickHint = renderQuickSlotPickerPopover(Number(quickPickSlot));
    }
    cluster.innerHTML = `${pickHint}
      <div class="action-section">
        <div class="action-section-label">PRIMARY SLOTS [1–4]</div>
        <div class="action-group">
          ${[1, 2, 3, 4].map(renderActionSlotButton).join('')}
        </div>
      </div>
      <div class="action-divider"></div>
      <div class="action-section">
        <div class="action-section-label">TACTICAL SLOTS [Q·R·F·C]</div>
        <div class="action-group">${[9, 10, 11, 12].map(renderActionSlotButton).join('')}</div>
      </div>
      <div class="action-divider"></div>
      <div class="action-section">
        <div class="action-section-label">LEYLINE</div>
        <div class="action-group">
          <div class="action-button harvest-card" id="btn-slot-harvest" data-slot-kind="harvest" title="Channel the nearest Glimmer node or Grand Font [${harvestKey}]">
            <span class="key-badge">${harvestKey}</span>
            <span class="action-icon">🔮</span>
            <span class="action-name">Glimmer</span>
          </div>
        </div>
      </div>
      <div class="action-divider"></div>
      <div class="action-section">
        <div class="action-section-label">BELT ITEMS [5–8]</div>
        <div class="action-group">${ITEM_ACTION_SLOTS.map(renderActionItemSlot).join('')}</div>
      </div>
    `;

    for (const el of cluster.querySelectorAll('[data-slot-kind]')) {
      const kind = el.dataset.slotKind;
      const slot = Number(el.dataset.slot);

      if (kind === 'harvest') {
        el.addEventListener('click', () => window.harvestTarget());
        continue;
      }

      el.addEventListener('click', (ev) => {
        if (ev.shiftKey) {
          window.startRebinding(slot);
          return;
        }
        if (pendingAssign) {
          window.placePendingInSlot(kind, slot);
          return;
        }
        if (kind === 'ability' && !getSlotAbilitySpec(localProfile.loadout, slot)) {
          quickPickSlot = quickPickSlot === slot ? null : slot;
          actionBarSignature = '';
          updateActionBarBadges();
          return;
        }
        quickPickSlot = null;
        window.activateActionSlot(slot);
      });
      el.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        window.clearActionSlot(slot);
      });
      el.addEventListener('dragstart', (ev) => {
        const id = kind === 'ability' ? (localProfile.loadout?.[slot] ?? localProfile.loadout?.[String(slot)]) : actionBarItems[slot];
        if (id) window.beginActionDrag(ev, kind, id);
      });
      el.addEventListener('dragover', (ev) => {
        if (!Array.from(ev.dataTransfer?.types || []).some((t) => t.startsWith('application/x-glimmerfall') || t === 'text/plain')) return;
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        el.classList.add('drop-hover');
      });
      el.addEventListener('dragleave', () => el.classList.remove('drop-hover'));
      el.addEventListener('drop', (ev) => {
        ev.preventDefault();
        el.classList.remove('drop-hover');
        handleActionBarDrop(ev, kind, slot);
      });
    }
  }

  window.beginActionDrag = function (ev, kind, id) {
    if (!ev?.dataTransfer || !id) return;
    ev.dataTransfer.effectAllowed = 'copy';
    ev.dataTransfer.setData('application/x-glimmerfall', `${kind}:${id}`);
    ev.dataTransfer.setData('text/plain', `${kind}:${id}`);
  };

  // Click-to-place: pick a learned Rite/Flash, then click the slot that should hold it.
  window.pickAbilityForBar = function (abilityId) {
    const ab = ABILITIES_CATALOG[abilityId];
    if (!ab) return;
    if (getAbilityRank(prog, ab.id) < 1) {
      logMessage(`🔒 ${ab.name} is unlearned — invest a skill point in the Skill Tree [P] first.`, 'log-combat');
      audio.playHurt?.();
      return;
    }
    quickPickSlot = null;
    if (pendingAssign?.id === abilityId) {
      pendingAssign = null;
      logMessage(`[Action Bar] Cancelled placement of ${ab.name}.`, 'log-combat');
    } else {
      pendingAssign = { kind: 'ability', id: abilityId };
      const curSlot = findEquippedSlotForAbility(abilityId);
      const curNote = curSlot ? ` (currently in Slot ${curSlot} [${formatKeyLabel(keybinds[curSlot])}])` : '';
      logMessage(`[Action Bar] Picked ${ab.name}${curNote} — click any ability slot ([1]–[4] or [Q]/[R]/[F]/[C]) on the action bar to place or move it, or press ESC to cancel.`, 'log-combat');
      // The Spellbook covers the bottom dock — close it so the action bar is clickable.
      const spellbookEl = document.getElementById('spellbook-modal');
      if (spellbookEl && spellbookEl.style.display === 'block') window.toggleModal('spellbook-modal');
    }
    actionBarSignature = '';
    updateActionBarBadges();
    renderSkillTreeUI();
    if (document.getElementById('keybind-list-container')?.style.display === 'block') renderKeybindUI();
  };

  window.placePendingInSlot = function (slotKind, slot) {
    if (!pendingAssign) return;
    const ab = ABILITIES_CATALOG[pendingAssign.id];
    if (!ab) {
      pendingAssign = null;
      return;
    }
    const s = Number(slot);
    if (slotKind !== 'ability' || !ACTION_SLOTS.includes(s)) {
      logMessage(`[Action Bar] Item slots 5–8 hold potions and gear — place ${ab.name} in any ability slot ([1]–[4] or [Q]/[R]/[F]/[C]).`, 'log-combat');
      audio.playHurt?.();
      return;
    }
    if (!isSlotUnlocked(prog, s)) {
      logMessage(`[Action Bar] Slot ${s} unlocks at Level ${SLOT_UNLOCK_LEVELS[s] || 1}.`, 'log-combat');
      audio.playHurt?.();
      return;
    }
    pendingAssign = null;
    window.assignSlotAbilityInGame(s, ab.id);
    actionBarSignature = '';
    updateActionBarBadges();
  };

  window.cancelPendingAssign = function () {
    if (quickPickSlot !== null) {
      quickPickSlot = null;
      actionBarSignature = '';
      updateActionBarBadges();
      return true;
    }
    if (!pendingAssign) return false;
    const ab = ABILITIES_CATALOG[pendingAssign.id];
    pendingAssign = null;
    actionBarSignature = '';
    updateActionBarBadges();
    renderSkillTreeUI();
    logMessage(`[Action Bar] Cancelled placement${ab ? ` of ${ab.name}` : ''}.`, 'log-combat');
    return true;
  };

  window.clearActionSlot = function (slot) {
    const s = Number(slot);
    if (ACTION_SLOTS.includes(s)) {
      const curId = localProfile.loadout?.[s] ?? localProfile.loadout?.[String(s)];
      if (!curId) return;
      const next = { ...(localProfile.loadout || {}) };
      delete next[s];
      delete next[String(s)];
      localProfile.loadout = next;
      if (prog.ranks) delete prog.ranks[s];
      saveProgressionLocal();
      if (net.connected) net.send({ type: 'update_loadout', loadout: next });
      logMessage(`[Action Bar] Cleared slot ${s} [${formatKeyLabel(keybinds[s])}].`, 'log-combat');
      if (typeof renderSkillTreeUI === 'function') renderSkillTreeUI();
      if (document.getElementById('keybind-list-container')?.style.display === 'block') renderKeybindUI();
    } else if (ITEM_ACTION_SLOTS.includes(s)) {
      if (!actionBarItems[s]) return;
      delete actionBarItems[s];
      saveActionBarItems();
    } else {
      return;
    }
    actionBarSignature = '';
    updateActionBarBadges();
    audio.playHurt?.();
  };

  window.activateActionSlot = function (slot) {
    const s = Number(slot);
    if (pendingAssign) {
      window.placePendingInSlot(ACTION_SLOTS.includes(s) ? 'ability' : 'item', s);
      return;
    }
    if (ACTION_SLOTS.includes(s)) {
      window.castAbility(s);
      return;
    }
    if (!ITEM_ACTION_SLOTS.includes(s)) return;

    const itemId = actionBarItems[s];
    if (!itemId) {
      logMessage(`[Action Bar] Item slot ${s} is empty — drag a potion or gear piece here from your bag, or assign it in Spellbook [P] → Keybinds.`, 'log-combat');
      return;
    }
    const item = EQUIPMENT_CATALOG[itemId];
    if (!item) {
      delete actionBarItems[s];
      saveActionBarItems();
      actionBarSignature = '';
      updateActionBarBadges();
      return;
    }
    if (countInventoryItem(itemId) <= 0) {
      spawnFCT(player.x, player.y - 14, `NO ${item.name.toUpperCase()} IN BAG!`, '#94a3b8');
      return;
    }

    if (item.slot === 'consumable') {
      consumeInventoryItem(itemId);
    } else {
      const inv = localProfile.inventory || [];
      const idx = inv.findIndex((it) => (typeof it === 'string' ? it : it?.id) === itemId);
      if (idx >= 0) window.equipInventorySlot(idx);
    }
    actionBarSignature = '';
    updateActionBarBadges();
  };

  function updateActionBarBadges() {
    const sig = buildActionBarSignature();
    if (sig !== actionBarSignature) {
      actionBarSignature = sig;
      renderActionBar();
    }
    const harvestHint = document.getElementById('harvest-key-hint');
    if (harvestHint) harvestHint.innerText = `[${getHarvestKeyLabel()}]`;
    if (currentTarget && (currentTarget.type === 'node' || currentTarget.type === 'shrine')) {
      const subEl = document.getElementById('target-sub');
      if (subEl) subEl.innerText = getEntitySubtitle(currentTarget);
    }
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
    const curRank = getAbilityRank(prog, abilityId);
    const newRank = Math.min(spec.maxRank || 5, curRank + 1);
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
    const resolved = resolveFactionAndClass({
      faction: localProfile.faction,
      classId: localProfile.classId,
      loadout: localProfile.loadout,
      orderTag: localProfile.orderTag,
    });
    localProfile.faction = resolved.faction;
    localProfile.classId = resolved.classId;
    const myFaction = resolved.faction;
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
            <button type="button" class="util-btn" style="padding:3px 7px; font-size:9px; border-color:#a16207; color:#fde047;" onclick="autoEquipLearnedAbilities()" title="Fill every empty Rite/Flash slot with abilities you have learned">⚡ AUTO-EQUIP LEARNED</button>
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
        const rankNow = getRankStats(ab, Math.max(1, curRank));
        const rankNext = getRankStats(ab, Math.min(5, Math.max(1, curRank) + 1));

        let cardClass = 'd2-skill-card';
        if (pendingAssign?.id === ab.id) cardClass += ' picked';
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

        // Check if currently equipped in loadout across ALL 8 ability slots
        const equippedSlot = findEquippedSlotForAbility(ab.id);
        const equippedKeyLabel = equippedSlot ? formatKeyLabel(keybinds[equippedSlot]) : null;

        // Allow choosing ANY of the 8 ability slots ([1, 2, 3, 4, 9, 10, 11, 12]) on any learned ability
        const equipSlots = ACTION_SLOTS;

        html += `
          <div class="${cardClass}" data-ability-id="${ab.id}" draggable="${isLearned}" ondragstart="window.beginActionDrag(event, 'ability', '${ab.id}')" title="${isLearned ? 'Click a slot button below, click to pick, or drag to the action bar' : 'Unlearned'}${equippedSlot ? ` • Equipped in Slot ${equippedSlot} [${equippedKeyLabel}]` : ''}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:18px;">${ab.icon}</span>
                <div>
                  <div style="font-weight:700; font-size:11.5px; color:${ab.color || '#facc15'};">${ab.name}</div>
                  <div style="font-size:9.5px; color:#38bdf8;">${castTimeTxt}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; justify-content:flex-end;">
                ${equippedSlot ? `<span class="d2-equipped-badge" title="Currently active on your Action Bar in Slot ${equippedSlot} [${equippedKeyLabel}]">✓ ADDED [${equippedKeyLabel}]</span>` : ''}
                <div class="d2-rank-badge ${isMax ? 'is-max' : curRank > 0 ? 'has-points' : ''}">
                  ${isMax ? 'MAX RANK (5/5)' : `RANK ${curRank}/5`}
                </div>
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
                NEXT RANK ${Math.min(5, Math.max(1, curRank) + 1)}/5: +3 Power • CD ${rankNow.effectiveBaseCd.toFixed(1)}s → ${rankNext.effectiveBaseCd.toFixed(1)}s
              </div>
            ` : ''}

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; gap:6px; flex-wrap:wrap;">
              <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
                ${isLearned ? `<button type="button" class="util-btn" style="padding:2px 6px; font-size:9px; border-color:${equippedSlot ? '#4ade80' : '#facc15'}; color:${equippedSlot ? '#86efac' : '#fde047'};" onclick="pickAbilityForBar('${ab.id}')">🎯 ${pendingAssign?.id === ab.id ? 'PICKED…' : equippedSlot ? `MOVE SLOT (IN [${equippedKeyLabel}])` : 'PLACE IN BAR'}</button>` : ''}
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
                <div style="display:flex; align-items:center; gap:3px; flex-wrap:wrap;">
                  <span style="font-size:9px; color:#94a3b8; font-weight:700;">SLOT:</span>
                  ${equipSlots.map((s) => {
                    const isCur = Number(equippedSlot) === Number(s);
                    const keyLabel = formatKeyLabel(keybinds[s]);
                    return `
                      <button type="button" class="util-btn" style="padding:2px 5px; font-size:8.5px; ${isCur ? 'border-color:#4ade80; color:#4ade80; background:#14532d; font-weight:800;' : 'border-color:#334155; color:#cbd5e1;'}"
                        onclick="assignSlotAbilityInGame(${s}, '${ab.id}')" title="${isCur ? `Currently in Slot ${s} [${keyLabel}]` : `Move/Equip ${ab.name} to Slot ${s} [${keyLabel}]`}">
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

    // Click-to-place: click a learned card, then click the action-bar slot that should hold it.
    container.querySelectorAll('[data-ability-id]').forEach((card) => {
      card.addEventListener('click', (ev) => {
        if (ev.target.closest('button, select, input, a')) return;
        window.pickAbilityForBar(card.dataset.abilityId);
      });
    });
  }

  function renderKeybindUI() {
    const container = document.getElementById('keybind-list-container');
    if (!container) return;
    const ptsHeader = document.getElementById('skill-points-banner');
    if (ptsHeader) {
      const sp = prog.skillPoints || 0;
      if (listeningSlot !== null) {
        const lSpec = getSlotAbilitySpec(localProfile.loadout, listeningSlot);
        const lItemId = ITEM_ACTION_SLOTS.includes(Number(listeningSlot)) ? actionBarItems[listeningSlot] : null;
        const lName = lSpec?.name || (lItemId ? EQUIPMENT_CATALOG[lItemId]?.name : null) || `Slot ${listeningSlot}`;
        ptsHeader.innerHTML = `
          <div style="color:#fde047; font-size:12px; font-weight:800;">
            ⌨️ PRESS ANY KEY TO BIND "${lName.toUpperCase()}" (OR [ESC] TO CANCEL)...
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
              <button type="button" class="util-btn" style="padding:3px 7px; font-size:9px; border-color:#a16207; color:#fde047;" onclick="autoEquipLearnedAbilities()" title="Fill every empty Rite/Flash slot with abilities you have learned">⚡ AUTO-EQUIP LEARNED</button>
              CLICK ANY <b style="color:#38bdf8;">[KEY]</b> TO REBIND • SHIFT+CLICK A BAR SLOT TO REBIND FAST
            </div>
          </div>
        `;
      }
    }
    container.innerHTML = '';
    const cdMult = calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction);
    const myFaction = localProfile.faction || 'Solari';

    for (const slot of [1, 2, 3, 4, 'harvest', 5, 6, 7, 8, 9, 10, 11, 12]) {
      const isItemSlot = typeof slot === 'number' && ITEM_ACTION_SLOTS.includes(slot);
      const slotItemId = isItemSlot ? actionBarItems[slot] : null;
      const slotItem = slotItemId ? EQUIPMENT_CATALOG[slotItemId] : null;
      const equippedSpec = isItemSlot
        ? (slotItem
            ? {
                id: null,
                name: slotItem.name,
                icon: slotItem.icon || '🎒',
                color: '#fb923c',
                tcgType: slotItem.slot === 'consumable' ? 'Consumable' : 'Gear',
                castTime: 0,
                baseCd: 0,
                range: 'Item Slot',
                desc: `Press the key to ${slotItem.slot === 'consumable' ? 'use this item' : 'equip this gear'}. Right-click the slot to clear it, or change it with the dropdown below.`,
              }
            : {
                id: null,
                name: `Empty Item Slot ${slot}`,
                icon: '＋',
                color: '#94a3b8',
                tcgType: 'Item Slot',
                castTime: 0,
                baseCd: 0,
                range: 'Item Slot',
                desc: 'Assign a potion, food, or gear piece with the dropdown below, or drag one from your bag onto the slot.',
              })
        : getSlotAbilitySpec(localProfile.loadout, slot);
      const isEmptySlot = !equippedSpec && typeof slot === 'number';
      const spec = equippedSpec || {
        id: null,
        name: `Empty Slot ${slot}`,
        icon: '＋',
        color: '#94a3b8',
        tcgType: 'Empty Slot',
        castTime: 0,
        baseCd: 0,
        range: '—',
        desc: 'Pick a learned Rite or Flash in the Skill Tree and click this slot (or drag one here).',
      };
      const bound = formatKeyLabel(keybinds[slot]);
      const isListening = listeningSlot === slot;
      const isRankable = typeof slot === 'number' && !isItemSlot;
      const curRank = isRankable && equippedSpec ? getAbilityRank(prog, spec.id) : 0;
      const isLearned = isRankable ? curRank >= 1 : true;
      const canUpgrade = isRankable && canUpgradeAbility(prog, spec.id);

      // Available choices for this slot: all learned abilities of the player's faction!
      const allowedChoices = isItemSlot
        ? Array.from(new Set((localProfile.inventory || []).map((it) => (typeof it === 'string' ? it : it?.id))))
            .map((id) => EQUIPMENT_CATALOG[id])
            .filter((it) => it && it.slot !== 'currency')
        : Object.values(ABILITIES_CATALOG)
            .filter((ab) => ab.id !== 'harvest' && ab.faction === myFaction && getAbilityRank(prog, ab.id) >= 1)
            .sort((a, b) => (a.tier || 1) - (b.tier || 1));

      const castTimeTxt = spec.castTime > 0 ? `${spec.castTime.toFixed(1)}s Cast` : 'Instant';

      const row = document.createElement('div');
      row.className = 'keybind-row';
      row.innerHTML = `
        <div style="flex:1; padding-right:10px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:16px;">${isLearned ? spec.icon : '🔒'}</span>
            <b style="color:${spec.color}; font-size:12px;">${spec.name}</b>
            <span class="spec-pill">${spec.tcgType}</span>
            ${isRankable ? `<span class="rank-pill">${isLearned ? `RANK ${curRank}/5` : isEmptySlot ? 'EMPTY' : '🔒 UNLEARNED'}</span>` : ''}
            <span style="font-size:10px; color:#94a3b8;">${castTimeTxt} • CD: ${spec.baseCd > 0 ? (spec.baseCd * cdMult).toFixed(1) + 's' : '0s'} • ${spec.range}</span>
          </div>
          <div style="font-size:10.5px; color:#e2e8f0; margin-top:3px; line-height:1.4;">${spec.desc}</div>
          ${isRankable || isItemSlot ? `
            <div style="margin-top:5px;">
              <select class="pixel-input" style="width:auto; padding:3px 8px; font-size:10.5px;" onchange="${isItemSlot ? `assignItemToSlot(${slot}, this.value)` : `assignSlotAbilityInGame(${slot}, this.value)`}; this.blur();">
                ${allowedChoices.length > 0
                  ? `<option value="" ${(isItemSlot ? slotItemId : spec.id) ? '' : 'selected'}>— EMPTY SLOT —</option>` +
                    allowedChoices.map((choice) => {
                      const selected = isItemSlot ? slotItemId === choice.id : spec.id === choice.id;
                      const existingSlot = !isItemSlot ? findEquippedSlotForAbility(choice.id) : null;
                      const slotNote = existingSlot ? (Number(existingSlot) === Number(slot) ? ` • ✓ Active Here` : ` • In [${formatKeyLabel(keybinds[existingSlot])}]`) : '';
                      const label = isItemSlot ? choice.name : `${choice.icon} ${choice.name} (Rank ${getAbilityRank(prog, choice.id)}/5${slotNote})`;
                      return `<option value="${choice.id}" ${selected ? 'selected' : ''}>${label}</option>`;
                    }).join('')
                  : `<option disabled selected>${isItemSlot ? '🎒 Bag is empty — buy potions or gear first!' : `🔒 No abilities learned yet — allocate points in Spellbook [P]!`}</option>`}
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
      <div style="background:#080c18; border-left:3px solid ${fm.color}; padding:8px 10px; margin-bottom:10px; font-size:11px; line-height:1.45; display:flex; align-items:center; gap:8px;">
        <img src="${fm.logo}" alt="${fm.id}" style="width:22px; height:22px; object-fit:contain; filter:drop-shadow(0 0 3px ${fm.color}); flex-shrink:0;" />
        <div>
          <b style="color:${fm.color}; font-size:12px;">${fm.mechanicName}:</b> ${fm.mechanicDesc}
        </div>
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
      actionBarSignature = '';
      updateActionBarBadges();
      return;
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    listeningSlot = parsed;
    renderKeybindUI();
    actionBarSignature = '';
    updateActionBarBadges();
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
    actionBarSignature = '';
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
    window.clearHoveredEquipment?.();
    document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    if (opening) {
      if (id === 'char-modal') renderStatsModal();
      if (id === 'spellbook-modal') switchSkillTreeTab(currentSkillTreeTab || 'flashes');
      if (id === 'arena-modal') renderArenaModal();
      if (id === 'equipment-modal' || id === 'paperdoll-modal' || id === 'cards-modal') {
        renderEquipmentModal({ profile: localProfile });
        const targetEl = document.getElementById('equipment-modal') || el;
        targetEl.style.display = 'block';
        return;
      }
      if (id === 'inventory-modal') {
        renderInventoryModal({ profile: localProfile });
      }
      if (id === 'exchange-modal') {
        renderExchangeModal({ profile: localProfile });
      }
      if (id === 'bank-modal') {
        renderBankModal({ profile: localProfile });
      }
      if (id === 'merchant-modal') {
        renderMerchantModal();
      }
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
      if (id === 'skills-modal') {
        window.renderSkillsModal?.();
      }
      if (id === 'skill-guide-modal') {
        window.renderSkillGuide?.();
      }
      if (id === 'skill-training-modal') {
        window.renderSkillTrainingGuide?.();
      }
      if (id === 'audio-mixer-modal') {
        syncAudioMixerUI();
      }
      if (id === 'settings-modal') {
        const touchCb = document.getElementById('settings-touch-checkbox');
        if (touchCb) touchCb.checked = document.body.classList.contains('touch-mode');
        const compassCb = document.getElementById('settings-compass-checkbox');
        if (compassCb) compassCb.checked = questCompassEnabled;
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
    window.clearHoveredEquipment?.();
    audio.init();
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);

    // Direct click on any NPC (covering head, nameplate, body, feet, and overhead quest glyph)
    let clickedNpc = null;
    let closestNpcDist = Infinity;
    for (const npc of npcs) {
      if (isClickOnNpc(npc, wx, wy)) {
        const dist = Math.hypot(npc.x - wx, (npc.y - 25) - wy);
        if (dist < closestNpcDist) {
          closestNpcDist = dist;
          clickedNpc = npc;
        }
      }
    }
    if (clickedNpc) {
      interactWithNpc(clickedNpc);
      return;
    }

    // Direct click on any Market Stall, Cosmic Artisan Station, or Bounty Board prop
    for (const pr of props) {
      if (pr.type.startsWith('marketStall')) {
        const dx = Math.abs(pr.x - wx);
        const dy = wy - pr.y;
        if (dx <= 36 && dy >= -48 && dy <= 20) {
          const merchant = npcs.find((n) => n.stallId === pr.id || Math.hypot(n.x - pr.x, n.y - pr.y) < 44);
          if (merchant) {
            interactWithNpc(merchant);
            return;
          }
        }
      } else if (pr.stationId || pr.isBountyBoard) {
        const dx = Math.abs(pr.x - wx);
        const dy = wy - pr.y;
        if (dx <= 34 && dy >= -44 && dy <= 18) {
          faceToward(pr.x, pr.y);
          if (Math.hypot(player.x - pr.x, player.y - pr.y) <= 135) {
            if (pr.stationId) window.openCraftingModal(pr.stationId);
            else window.openBountyBoard();
          } else {
            logMessage(`[Artisan] Step closer to use ${pr.label || 'this station'}!`, 'log-solari', 'chat');
            spawnFCT(pr.x, pr.y - 14, 'STEP CLOSER', '#38bdf8');
          }
          return;
        }
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
      actionBarSignature = '';
      updateActionBarBadges();
      return;
    }

    // Escape cancels a picked-but-not-yet-placed Rite/Flash.
    if (e.key === 'Escape' && pendingAssign) {
      e.preventDefault();
      e.stopPropagation();
      window.cancelPendingAssign();
      return;
    }

    if (frontpage.isOpen) {
      if (e.key === 'Escape') {
        if (frontpage.state === 'CHARACTER_CREATE') {
          frontpage.transitionTo('CHARACTER_SELECT');
        } else if (introShown) {
          frontpage.close();
        }
      }
      return;
    }

    // Dismiss Quest Complete scroll modal on Space, Enter, or Escape
    const qcModal = document.getElementById('quest-complete-modal');
    if (qcModal && qcModal.style.display === 'flex') {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.closeQuestCompleteModal(true);
        return;
      }
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
      const skPopup = document.getElementById('skills-tab-popup');
      const isSkOpen = skPopup && skPopup.style.display !== 'none' && skPopup.classList.contains('active');
      if (openModal || currentTarget || dialogueOpen || isSkOpen) {
        setTarget(null);
        window.closeDialogue();
        window.clearHoveredEquipment?.();
        if (skPopup) {
          skPopup.classList.remove('active');
          skPopup.style.display = 'none';
        }
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
          else if (ITEM_ACTION_SLOTS.includes(Number(slot))) window.activateActionSlot(Number(slot));
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
    if (key === 'v') {
      spawnFCT(player.x, player.y - 18, '🏛️ Visit an AetherVault Bank in the city!', '#fde047', true);
    }
    if (key === 'u') window.toggleUiEditMode();
    if (key === 'n') window.toggleSkillsTab();
    if (key === 'b') window.toggleModal('inventory-modal');
    if (key === 'i') window.toggleModal('inventory-modal');
    if (key === 'k') window.toggleModal('equipment-modal');
    if (key === 'x') {
      const broker = npcs.find((n) => n.isExchange);
      const dist = broker ? Math.hypot(player.x - broker.x, player.y - broker.y) : Infinity;
      if (dist < 80) {
        window.toggleModal('exchange-modal');
      } else {
        logMessage('🏛️ [Grand Exchange] Please visit the Grand AetherSwap Exchange Pavilion in Sanctuary Haven and speak with Broker Caelum!', 'log-solari', 'chat');
        spawnFCT(player.x, player.y - 18, '🏛️ Visit the Grand Exchange in Sanctuary Haven!', '#38bdf8', true);
      }
    }
    if (key === 'm') window.toggleWorldAtlas();
    if (key === 'p') window.toggleModal('spellbook-modal');
    if (key === 'c') window.toggleModal('char-modal');
    if (key === 'o') window.toggleModal('social-modal');
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

    // Cooldowns advance every frame; the DOM overlays refresh on the HUD tick below.
    for (const slot in cooldowns) {
      if (cooldowns[slot] > 0) cooldowns[slot] = Math.max(0, cooldowns[slot] - dt);
    }

    hudTickAccum += dt;
    if (hudTickAccum >= 0.1) {
      hudTickAccum = 0;

      // Safeguard: Ensure floating gear tooltip auto-dismisses if modal is closed
      const tip = uiEl('gear-floating-tooltip');
      if (tip && tip.style.display !== 'none') {
        const bModal = uiEl('bank-modal');
        const iModal = uiEl('inventory-modal');
        const eModal = uiEl('equipment-modal');
        const xModal = uiEl('exchange-modal');
        const mModal = uiEl('merchant-modal');
        if (bModal?.style.display !== 'block' &&
            iModal?.style.display !== 'block' &&
            eModal?.style.display !== 'block' &&
            xModal?.style.display !== 'block' &&
            mModal?.style.display !== 'block') {
          window.clearHoveredEquipment?.();
        }
      }

      for (const slot in cooldowns) {
        const ov = uiEl(`cd-${slot}`);
        if (!ov) continue;
        const cd = cooldowns[slot];
        ov.style.opacity = cd > 0 ? '1' : '0';
        ov.innerText = cd > 0 ? cd.toFixed(1) : '';
      }

      updateVitalsUI();
      updateMythicHud();
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

      // Offline leyline nodes and shrines replenish so gathering can be trained indefinitely.
      for (const e of entities) {
        if ((e.type !== 'node' && e.type !== 'shrine') || e.charges > 0) continue;
        e.rechargeTimer = Math.max(0, (e.rechargeTimer || 0) - dt);
        if (e.rechargeTimer <= 0) {
          e.charges = e.maxCharges || (e.type === 'shrine' ? 5 : 3);
          e.rechargeTimer = 0;
        }
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

    // Vitality Health Regeneration (+2.5 HP/s baseline + 0.5 HP/s per Terra Bulwark point)
    const hpRegen = calcHpRegenPerSec(prog);
    if (hpRegen > 0 && !player.isDead && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + hpRegen * dt);
    }

    // Baseline Glimmer resonance recovery (+3.5 Glimmer/s)
    if (!player.isDead && player.solarCharge < player.maxSolarCharge) {
      player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 3.5 * dt);
    }

    if (player.slashTimer > 0) player.slashTimer = Math.max(0, player.slashTimer - dt);

    if (isCasting) {
      castProgress += dt;
      const castFill = uiEl('cast-fill');
      if (castFill) castFill.style.width = `${Math.min(100, (castProgress / castDuration) * 100)}%`;
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

        // Auto-close bank/depository if walking away from banker NPC
        const bModal = document.getElementById('bank-modal');
        if (bModal && bModal.style.display === 'block') {
          const bankNpc = npcs.find((n) => n.isBank);
          const dist = bankNpc ? Math.hypot(player.x - bankNpc.x, player.y - bankNpc.y) : Infinity;
          if (dist > 95) {
            bModal.style.display = 'none';
            window.clearHoveredEquipment?.();
          }
        }

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
        if (e.spawnAggroGrace > 0) {
          e.spawnAggroGrace = Math.max(0, e.spawnAggroGrace - dt);
          continue;
        }

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

              // Phase 3: Enrage & Area Shockwaves at 40% HP (Shattered Nexus cannot enrage)
              const isNexusShard = e.type === 'siege_shard' || e.id === 'siege_shard' || (e.name && e.name.includes('Nexus'));
              if (isNexusShard) {
                e.enraged = false;
              } else if (hpPercent <= 40 && e.phase === 2) {
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
                } else if (e.spriteKey === 'starfallBoss') {
                  telLabel = e.enraged ? '☄️ SUPERMASSIVE METEOR IMPACT' : '🔥 STARFALL ORBITAL STRIKE';
                  telColor = '#fb923c';
                  shockRad = e.enraged ? 108 : 80;
                  warnDuration = 1.55;
                } else if (e.spriteKey === 'abyssalArchitectBoss') {
                  telLabel = e.enraged ? '🌌 ABYSSAL REALITY COLLAPSE' : '💀 VOIDSTAR ANNIHILATION';
                  telColor = '#e879f9';
                  shockRad = e.enraged ? 112 : 84;
                  warnDuration = 1.5;
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
              const bossAtkInterval = e.enraged ? 1.85 / 1.35 : 1.85; // Phase 3 enrage: +35% attack speed
              if (e.atkTimer >= bossAtkInterval) {
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
      tickOfflineMythic(dt);
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
      // Homecoming Town Square & Grand Central Fountain Plaza paved in flagstone
      if (Math.abs(tx) <= 7 && ty >= -6 && ty <= 9) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      // North Civic Terrace (Grand Exchange & Bank Plaza)
      if (Math.abs(tx) <= 11 && ty >= -12 && ty <= -6) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      // West Artisan & Homestead Courtyard
      if (tx >= -16 && tx <= -7 && ty >= -5 && ty <= 6) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      // East Combat Trial Courtyard
      if (tx >= 7 && tx <= 16 && ty >= -4 && ty <= 5) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
      }
      // Grand North-South and East-West Crossroads connecting gates to center
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

    if (currentBiomeTheme === 'starfall') {
      // Impact caldera ring & east-west meteorite highway
      const d2 = tx * tx + ty * ty;
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2 || (d2 >= 64 && d2 <= 100)) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      return sprites.tiles[`starfall_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.solari_0 || sprites.tiles.flagstone_0;
    }

    if (currentBiomeTheme === 'abyssal') {
      // Fractured reality causeways across deep void chasms
      if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) {
        return sprites.tiles.flagstone_1 || sprites.tiles.flagstone_0;
      }
      if (Math.abs(tx) % 8 === 4 && Math.abs(ty) % 8 === 4 && Math.abs(tx) > 5 && Math.abs(ty) > 5) {
        return sprites.tiles[`void_sea_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
      return sprites.tiles[`abyssal_${Math.abs(tx * 13 + ty * 19) % 4}`] || sprites.tiles.umbri_0 || sprites.tiles.flagstone_0;
    }

    if (['solari', 'umbri', 'terra', 'aether'].includes(currentBiomeTheme)) {
      // Central city plaza, artisan market square (west), and depository terrace (northeast)
      if (
        (Math.abs(tx) <= 5 && Math.abs(ty) <= 5) ||
        (tx >= -14 && tx <= -6 && ty >= 0 && ty <= 6) ||
        (tx >= 9 && tx <= 14 && ty >= -10 && ty <= -4) ||
        Math.abs(tx) <= 1 ||
        Math.abs(ty) <= 1
      ) {
        return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`] || sprites.tiles.flagstone_0;
      }
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

  // Pixel-art quest compass: a chunky arrow at the screen edge pointing toward the
  // nearest quest giver when they are off-screen. Drawn from canvas rects only.
  function drawQuestCompass() {
    if (!questCompassEnabled || frontpage.isOpen || player.isDead) return;

    let target = null;
    let bestScore = Infinity;
    for (const npc of npcs) {
      const status = getNpcQuestStatus(npc);
      if (status === 'none') continue;
      const priority = status === 'finished' ? 0 : status === 'ongoing' ? 2 : 1;
      const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
      const score = priority * 1000000 + dist;
      if (score < bestScore) {
        bestScore = score;
        target = { npc, dist };
      }
    }
    if (!target || target.dist < 140) return;

    const p = worldToScreen(target.npc.x, target.npc.y);
    const margin = 30;
    if (p.x >= margin && p.x <= viewW - margin && p.y >= margin && p.y <= viewH - margin) return;

    const ax = Math.max(margin, Math.min(viewW - margin, Math.round(p.x)));
    const ay = Math.max(margin, Math.min(viewH - margin, Math.round(p.y)));

    const dx = p.x - viewW / 2;
    const dy = p.y - viewH / 2;
    let dirX = 0;
    let dirY = 0;
    if (Math.abs(dx) > Math.abs(dy)) dirX = dx > 0 ? 1 : -1;
    else dirY = dy > 0 ? 1 : -1;

    // 5x5 triangle pointing right, rotated to the dominant direction.
    const base = [];
    for (let r = 0; r < 5; r += 1) {
      const span = Math.abs(2 - r);
      for (let c = 0; c < 5 - span; c += 1) base.push([c, r]);
    }
    const points = base.map(([c, r]) => {
      if (dirX === 1) return [c, r];
      if (dirX === -1) return [4 - c, r];
      if (dirY === 1) return [r, c];
      return [r, 4 - c];
    });

    const scale = 2;
    const ox = Math.round(ax - (5 * scale) / 2);
    const oy = Math.round(ay - (5 * scale) / 2);
    ctx.save();
    ctx.fillStyle = '#05070f';
    for (const [c, r] of points) {
      ctx.fillRect(ox + c * scale - 1, oy + r * scale - 1, scale + 2, scale + 2);
    }
    ctx.fillStyle = '#facc15';
    for (const [c, r] of points) {
      ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
    }
    const tip = points.reduce((best, [c, r]) => {
      const score = dirX === 1 ? c : dirX === -1 ? 4 - c : dirY === 1 ? r : 4 - r;
      return score > best.score ? { score, c, r } : best;
    }, { score: -1, c: 0, r: 0 });
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(ox + tip.c * scale, oy + tip.r * scale, scale, scale);
    ctx.restore();
  }

  // Static ground is baked into 256px chunk canvases once per room. This collapses
  // roughly a thousand per-frame tile blits into ~20 cached chunk blits.
  const TILE_CHUNK_TILES = 16;
  const TILE_CHUNK_PX = TILE_CHUNK_TILES * TILE_SIZE;
  const tileChunkCache = new Map();
  let tileChunkRoomKey = '';
  let animatedWaterTiles = null;

  function getTileChunk(chunkX, chunkY) {
    const key = `${tileChunkRoomKey}:${chunkX},${chunkY}`;
    const cached = tileChunkCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = TILE_CHUNK_PX;
    canvas.height = TILE_CHUNK_PX;
    const cctx = canvas.getContext('2d');
    cctx.imageSmoothingEnabled = false;

    if (!animatedWaterTiles) {
      animatedWaterTiles = new Set(
        [sprites.tiles.river_water_0, sprites.tiles.river_water_1].filter(Boolean)
      );
    }

    const water = [];
    for (let ty = 0; ty < TILE_CHUNK_TILES; ty++) {
      for (let tx = 0; tx < TILE_CHUNK_TILES; tx++) {
        const tile = pickTile(chunkX * TILE_CHUNK_TILES + tx, chunkY * TILE_CHUNK_TILES + ty);
        if (!tile) continue;
        cctx.drawImage(tile, tx * TILE_SIZE, ty * TILE_SIZE);
        if (animatedWaterTiles.has(tile)) water.push({ tx, ty });
      }
    }

    const chunk = { canvas, water };
    if (tileChunkCache.size >= 64) tileChunkCache.clear();
    tileChunkCache.set(key, chunk);
    return chunk;
  }

  // ==========================================
  // Animated Ambient Dressing
  // ==========================================
  // Deterministic per world cell, so scenery never pops between frames and needs
  // no room state. Only cells touching the current view are considered.
  const AMBIENT_SEA_CELL = 44;
  const AMBIENT_STACK_CELL = 190;
  const AMBIENT_GROUND_CELL = 46;
  const AMBIENT_MOTE_CELL = 68;

  function ambientHash(x, y, seed = 0) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function drawSeaStack(sx, sy, h, t) {
    const w = 8 + Math.floor(h * 10);
    const hgt = 7 + Math.floor(h * 12);
    const left = Math.round(sx - w / 2);
    const top = Math.round(sy - hgt);

    ctx.fillStyle = '#050b16';
    ctx.fillRect(left, top, w, hgt);
    ctx.fillRect(left - 2, sy - 3, w + 4, 3);
    ctx.fillStyle = '#12233b';
    ctx.fillRect(left + 2, top + 2, Math.max(1, w - 4), Math.max(1, hgt - 4));
    ctx.fillRect(left - 1, sy - 2, w + 2, 1);
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(left + Math.max(1, Math.floor(w / 2) - 1), top + 3, 2, Math.max(1, hgt - 5));
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(left + 2, top + 1, 3, 1);

    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + h * 30);
    ctx.fillStyle = `rgba(125, 211, 252, ${0.10 + pulse * 0.12})`;
    ctx.fillRect(left - 3, sy, w + 6, 1);
    ctx.fillRect(left - 1, sy + 2, w + 2, 1);
    if (h > 0.7) {
      ctx.fillStyle = `rgba(224, 242, 254, ${0.25 + pulse * 0.35})`;
      ctx.fillRect(left + Math.floor(w / 2), top + 2, 1, 1);
    }
  }

  function drawSeaAmbient(camLeft, camTop) {
    const t = globalTime;
    const halfW = mapBounds.halfW;
    const halfH = mapBounds.halfH;
    const step = 24;

    // Animated surf hugging each shoreline; the sea itself sits outside the rim.
    const northY = Math.round(-halfH - camTop);
    if (northY > -16 && northY < viewH + 16) {
      const from = Math.max(-halfW, camLeft - step);
      const to = Math.min(halfW, camLeft + viewW + step);
      for (let wx = Math.ceil(from / step) * step; wx <= to; wx += step) {
        const sx = Math.round(wx - camLeft);
        const ph = Math.sin(t * 2.3 + wx * 0.055);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(sx, northY - 3, 9 + Math.round((ph + 1) * 4), 1);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(sx + 3, northY - 5, 4 + Math.round((ph + 1) * 2), 1);
      }
    }
    const southY = Math.round(halfH - camTop);
    if (southY > -16 && southY < viewH + 16) {
      const from = Math.max(-halfW, camLeft - step);
      const to = Math.min(halfW, camLeft + viewW + step);
      for (let wx = Math.ceil(from / step) * step; wx <= to; wx += step) {
        const sx = Math.round(wx - camLeft);
        const ph = Math.sin(t * 2.3 + wx * 0.055 + 1.7);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(sx, southY + 2, 9 + Math.round((ph + 1) * 4), 1);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(sx + 3, southY + 4, 4 + Math.round((ph + 1) * 2), 1);
      }
    }
    const westX = Math.round(-halfW - camLeft);
    if (westX > -16 && westX < viewW + 16) {
      const from = Math.max(-halfH, camTop - step);
      const to = Math.min(halfH, camTop + viewH + step);
      for (let wy = Math.ceil(from / step) * step; wy <= to; wy += step) {
        const sy = Math.round(wy - camTop);
        const ph = Math.sin(t * 2.3 + wy * 0.055 + 3.1);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(westX - 3, sy, 1, 9 + Math.round((ph + 1) * 4));
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(westX - 5, sy + 3, 1, 4 + Math.round((ph + 1) * 2));
      }
    }
    const eastX = Math.round(halfW - camLeft);
    if (eastX > -16 && eastX < viewW + 16) {
      const from = Math.max(-halfH, camTop - step);
      const to = Math.min(halfH, camTop + viewH + step);
      for (let wy = Math.ceil(from / step) * step; wy <= to; wy += step) {
        const sy = Math.round(wy - camTop);
        const ph = Math.sin(t * 2.3 + wy * 0.055 + 4.6);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(eastX + 2, sy, 1, 9 + Math.round((ph + 1) * 4));
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(eastX + 4, sy + 3, 1, 4 + Math.round((ph + 1) * 2));
      }
    }

    // Sparse wave glints across the deep sea.
    const seaCell = AMBIENT_SEA_CELL;
    const sgx0 = Math.floor((camLeft - seaCell) / seaCell);
    const sgx1 = Math.floor((camLeft + viewW + seaCell) / seaCell);
    const sgy0 = Math.floor((camTop - seaCell) / seaCell);
    const sgy1 = Math.floor((camTop + viewH + seaCell) / seaCell);
    for (let gy = sgy0; gy <= sgy1; gy++) {
      for (let gx = sgx0; gx <= sgx1; gx++) {
        const h = ambientHash(gx, gy, 11);
        if (h > 0.22) continue;
        const wx = gx * seaCell + 5 + ambientHash(gx, gy, 12) * (seaCell - 10);
        const wy = gy * seaCell + 5 + ambientHash(gx, gy, 13) * (seaCell - 10);
        if (wx >= -halfW && wx < halfW && wy >= -halfH && wy < halfH) continue;
        const sx = Math.round(wx - camLeft);
        const sy = Math.round(wy - camTop);
        if (sx < -8 || sx > viewW + 8 || sy < -8 || sy > viewH + 8) continue;

        const shimmer = 0.5 + 0.5 * Math.sin(t * 1.7 + h * 37 + gx * 0.8);
        ctx.fillStyle = `rgba(125, 211, 252, ${0.06 + shimmer * 0.12})`;
        ctx.fillRect(sx, sy, 3 + Math.round(shimmer * 4), 1);
        if (shimmer > 0.86) {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
          ctx.fillRect(sx + 2, sy - 1, 1, 1);
        }
      }
    }

    // Distant sea stacks clustered near the shoreline.
    const stackCell = AMBIENT_STACK_CELL;
    const stx0 = Math.floor((camLeft - stackCell) / stackCell);
    const stx1 = Math.floor((camLeft + viewW + stackCell) / stackCell);
    const sty0 = Math.floor((camTop - stackCell) / stackCell);
    const sty1 = Math.floor((camTop + viewH + stackCell) / stackCell);
    for (let gy = sty0; gy <= sty1; gy++) {
      for (let gx = stx0; gx <= stx1; gx++) {
        const h = ambientHash(gx, gy, 21);
        if (h > 0.17) continue;
        const wx = gx * stackCell + 16 + ambientHash(gx, gy, 22) * (stackCell - 32);
        const wy = gy * stackCell + 16 + ambientHash(gx, gy, 23) * (stackCell - 32);
        if (wx >= -halfW && wx < halfW && wy >= -halfH && wy < halfH) continue;
        const shore = Math.max(-halfW - wx, wx - halfW, -halfH - wy, wy - halfH);
        if (shore < 20 || shore > 190) continue;
        const sx = Math.round(wx - camLeft);
        const sy = Math.round(wy - camTop);
        if (sx < -24 || sx > viewW + 24 || sy < -28 || sy > viewH + 12) continue;
        drawSeaStack(sx, sy, ambientHash(gx, gy, 24), t);
      }
    }
  }

  function ambientGroundKind() {
    switch (currentBiomeTheme) {
      case 'sanctuary':
      case 'terra':
      case 'terra_grove': return 'grass';
      case 'umbri':
      case 'abyssal':
      case 'umbri_labyrinth': return 'glowcap';
      case 'solari':
      case 'starfall':
      case 'solari_vault': return 'sunleaf';
      case 'aether':
      case 'aether_archive': return 'crystal';
      case 'celestial': return 'starlight';
      case 'ruins': return 'pebble';
      case 'warzone': return 'ash';
      default: return 'none';
    }
  }

  function ambientGroundAllowed(wx, wy) {
    const edge = Math.min(mapBounds.halfW - Math.abs(wx), mapBounds.halfH - Math.abs(wy));
    if (edge < 24) return false;
    // Keep the four gate approaches and the central crossroads clear.
    if (Math.abs(wx) < 56 || Math.abs(wy) < 56) return false;

    const tx = Math.floor(wx / TILE_SIZE);
    const ty = Math.floor(wy / TILE_SIZE);

    switch (currentBiomeTheme) {
      case 'sanctuary':
        if (Math.abs(tx) <= 3 || Math.abs(ty) <= 3) return false;
        if (Math.abs(tx) <= 7 && Math.abs(ty) <= 7) return false;
        if (tx >= 11 && tx <= 25 && ty >= -18 && ty <= -7) return false;
        if (tx >= -26 && tx <= -11 && ty >= -18 && ty <= -7) return false;
        if (ty >= -22 && ty <= -19 && Math.abs(tx) <= 35) return false;
        if (tx >= 14 && tx <= 28 && ty >= 10 && ty <= 18) return false;
        return true;
      case 'terra':
      case 'umbri':
      case 'solari':
      case 'aether':
      case 'starfall':
      case 'abyssal':
        return Math.abs(tx) > 2 && Math.abs(ty) > 2;
      case 'terra_grove': {
        const d2 = tx * tx + ty * ty;
        if ((d2 >= 25 && d2 <= 49) || (d2 >= 144 && d2 <= 196) || Math.abs(tx) <= 1) return false;
        return true;
      }
      case 'umbri_labyrinth': {
        const cellX = Math.floor(tx / 4);
        const cellY = Math.floor(ty / 4);
        return !((cellX + cellY) % 2 === 0 || Math.abs(tx) <= 1 || Math.abs(ty) <= 1);
      }
      case 'aether_archive':
        if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return false;
        if (Math.abs(tx) % 6 <= 1 && Math.abs(ty) % 6 <= 1) return false;
        return true;
      case 'solari_vault':
        if (Math.abs(tx) <= 3 && Math.abs(ty) <= 3) return false;
        if ((Math.abs(tx) + Math.abs(ty)) % 5 === 0 || Math.abs(tx) <= 1) return false;
        return true;
      case 'ruins':
      case 'celestial':
        return true;
      case 'warzone':
        return edge < 170;
      default:
        return false;
    }
  }

  function drawGroundDetail(kind, sx, sy, h, t) {
    switch (kind) {
      case 'grass': {
        const lush = currentBiomeTheme !== 'sanctuary';
        const sway = Math.round(Math.sin(t * 2.2 + h * 31));
        ctx.fillStyle = 'rgba(3, 8, 14, 0.38)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = lush ? '#166534' : '#14532d';
        ctx.fillRect(sx - 2 + sway, sy - 3, 1, 3);
        ctx.fillRect(sx + 1 - sway, sy - 5, 1, 5);
        ctx.fillRect(sx + 3, sy - 2, 1, 2);
        ctx.fillStyle = lush ? '#4ade80' : '#22c55e';
        ctx.fillRect(sx - 2 + sway, sy - 4, 1, 1);
        ctx.fillRect(sx + 1 - sway, sy - 6, 1, 1);
        ctx.fillRect(sx + 3, sy - 3, 1, 1);
        if (h > 0.78) {
          const petal = h > 0.89 ? '#7dd3fc' : '#fde047';
          ctx.fillStyle = petal;
          ctx.fillRect(sx, sy - 7, 1, 1);
          ctx.fillRect(sx - 1, sy - 6, 1, 1);
          ctx.fillRect(sx + 1, sy - 6, 1, 1);
          ctx.fillRect(sx, sy - 5, 1, 1);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(sx, sy - 6, 1, 1);
        }
        break;
      }
      case 'glowcap': {
        const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.6 + h * 40));
        ctx.fillStyle = `rgba(168, 85, 247, ${0.08 + pulse * 0.10})`;
        ctx.fillRect(sx - 5, sy - 6, 11, 1);
        ctx.fillRect(sx - 3, sy - 7, 7, 1);
        ctx.fillStyle = 'rgba(3, 8, 14, 0.42)';
        ctx.fillRect(sx - 4, sy, 9, 1);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(sx - 2, sy - 2, 1, 3);
        ctx.fillRect(sx + 2, sy - 3, 1, 4);
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(sx - 4, sy - 4, 4, 2);
        ctx.fillRect(sx, sy - 5, 5, 2);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(sx - 3, sy - 5, 2, 1);
        ctx.fillRect(sx + 1, sy - 6, 2, 1);
        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(sx - 3, sy - 5, 1, 1);
        ctx.fillRect(sx + 2, sy - 6, 1, 1);
        break;
      }
      case 'sunleaf': {
        const sway = Math.round(Math.sin(t * 2.4 + h * 23));
        ctx.fillStyle = 'rgba(3, 8, 14, 0.35)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = '#713f12';
        ctx.fillRect(sx - 2, sy - 3, 1, 3);
        ctx.fillRect(sx + 1, sy - 4, 1, 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(sx - 2 + sway, sy - 4, 1, 1);
        ctx.fillRect(sx + 1 - sway, sy - 5, 1, 1);
        const rise = (t * 7 + h * 30) % 18;
        const a = 1 - rise / 18;
        ctx.fillStyle = `rgba(251, 146, 60, ${0.15 + a * 0.55})`;
        ctx.fillRect(sx + 3, Math.round(sy - 6 - rise), 1, 1);
        break;
      }
      case 'crystal': {
        const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.0 + h * 27));
        const bob = Math.round(Math.sin(t * 1.6 + h * 14));
        ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
        ctx.fillRect(sx - 4, sy - 9 + bob, 9, 1);
        ctx.fillStyle = 'rgba(3, 8, 14, 0.42)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(sx - 2, sy - 6 + bob, 4, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx - 1, sy - 5 + bob, 2, 5);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(sx - 1, sy - 5 + bob, 1, 3);
        ctx.fillStyle = `rgba(125, 211, 252, ${0.30 + pulse * 0.45})`;
        ctx.fillRect(sx, sy - 8 + bob, 1, 1);
        break;
      }
      case 'starlight': {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.8 + h * 41));
        const bob = Math.round(Math.sin(t * 1.7 + h * 11) * 2);
        ctx.fillStyle = `rgba(254, 240, 138, ${0.08 + pulse * 0.10})`;
        ctx.fillRect(sx - 4, sy - 7 + bob, 9, 1);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx, sy - 7 + bob, 1, 5);
        ctx.fillRect(sx - 2, sy - 5 + bob, 5, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy - 5 + bob, 1, 1);
        break;
      }
      case 'pebble': {
        ctx.fillStyle = 'rgba(3, 8, 14, 0.40)';
        ctx.fillRect(sx - 2, sy, 5, 1);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx - 2, sy - 2, 4, 2);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx - 1, sy - 2, 2, 1);
        if (h > 0.7) {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.35)';
          ctx.fillRect(sx + 3, sy - 4, 1, 1);
        }
        break;
      }
      case 'ash': {
        const flicker = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 5.2 + h * 33));
        ctx.fillStyle = 'rgba(3, 6, 12, 0.48)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx - 2, sy - 1, 5, 2);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx - 1, sy - 2, 3, 1);
        ctx.fillStyle = `rgba(249, 115, 22, ${flicker})`;
        ctx.fillRect(sx + 1, sy - 3, 1, 1);
        break;
      }
      default:
        break;
    }
  }

  function drawGroundAmbient(camLeft, camTop) {
    const kind = ambientGroundKind();
    if (kind === 'none') return;
    const t = globalTime;
    const cell = AMBIENT_GROUND_CELL;
    const gx0 = Math.floor((camLeft - cell) / cell);
    const gx1 = Math.floor((camLeft + viewW + cell) / cell);
    const gy0 = Math.floor((camTop - cell) / cell);
    const gy1 = Math.floor((camTop + viewH + cell) / cell);

    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const h = ambientHash(gx, gy, 31);
        const h2 = ambientHash(gx, gy, 32);
        const wx = gx * cell + 5 + h2 * (cell - 10);
        const wy = gy * cell + 5 + ambientHash(gx, gy, 33) * (cell - 10);
        if (!ambientGroundAllowed(wx, wy)) continue;

        const edge = Math.min(mapBounds.halfW - Math.abs(wx), mapBounds.halfH - Math.abs(wy));
        const density = edge < 132 ? 0.46 : 0.18;
        if (h > density) continue;

        const sx = Math.round(wx - camLeft);
        const sy = Math.round(wy - camTop);
        if (sx < -12 || sx > viewW + 12 || sy < -16 || sy > viewH + 12) continue;
        drawGroundDetail(kind, sx, sy, h2, t);
      }
    }
  }

  function ambientMotePalette() {
    switch (currentBiomeTheme) {
      case 'sanctuary': return ['#fde68a', '#a7f3d0'];
      case 'terra':
      case 'terra_grove': return ['#bef264', '#86efac'];
      case 'umbri':
      case 'umbri_labyrinth': return ['#c084fc', '#e9d5ff'];
      case 'abyssal': return ['#e879f9', '#38bdf8'];
      case 'solari':
      case 'solari_vault': return ['#fbbf24', '#fef08a'];
      case 'starfall': return ['#fb923c', '#fde047'];
      case 'aether':
      case 'aether_archive': return ['#7dd3fc', '#e0f2fe'];
      case 'warzone': return ['#fb923c', '#fde68a'];
      case 'ruins': return ['#94a3b8', '#7dd3fc'];
      case 'celestial': return ['#fef08a', '#ffffff'];
      default: return ['#cbd5e1', '#7dd3fc'];
    }
  }

  function drawAirMotes(camLeft, camTop) {
    const t = globalTime;
    const palette = ambientMotePalette();
    const cell = AMBIENT_MOTE_CELL;
    const gx0 = Math.floor(camLeft / cell) - 1;
    const gx1 = Math.floor((camLeft + viewW) / cell) + 1;
    const gy0 = Math.floor(camTop / cell) - 1;
    const gy1 = Math.floor((camTop + viewH) / cell) + 1;

    ctx.save();
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const h = ambientHash(gx, gy, 51);
        if (h > 0.46) continue;
        const h2 = ambientHash(gx, gy, 52);
        const h3 = ambientHash(gx, gy, 53);
        const wx = gx * cell + 6 + h2 * (cell - 12);
        const wy = gy * cell + 6 + h3 * (cell - 12);
        const outside = wx < -mapBounds.halfW || wx >= mapBounds.halfW || wy < -mapBounds.halfH || wy >= mapBounds.halfH;

        const sx = Math.round(wx - camLeft + Math.sin(t * 0.55 + h * 20) * (outside ? 9 : 6));
        const sy = Math.round(wy - camTop + Math.cos(t * 0.70 + h2 * 20) * 4);
        if (sx < -4 || sx > viewW + 4 || sy < -4 || sy > viewH + 4) continue;

        const twinkle = 0.5 + 0.5 * Math.sin(t * 2.4 + h3 * 30);
        const color = outside ? (h2 > 0.5 ? '#7dd3fc' : '#e0f2fe') : palette[h2 > 0.5 ? 0 : 1];
        ctx.globalAlpha = outside ? 0.16 + twinkle * 0.20 : 0.28 + twinkle * 0.28;
        ctx.fillStyle = color;
        const big = h3 > 0.82;
        ctx.fillRect(sx, sy, big ? 2 : 1, 1);
        if (big) ctx.fillRect(sx, sy - 1, 1, 1);
      }
    }
    ctx.restore();
  }

  function drawWorld() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#070b19';
    ctx.fillRect(0, 0, viewW, viewH);

    const camLeft = Math.floor(camera.x - viewW / 2);
    const camTop = Math.floor(camera.y - viewH / 2);

    const roomKey = `${currentRoomId}|${currentRoomType}|${currentBiomeTheme}|${mapBounds.halfW}x${mapBounds.halfH}`;
    if (roomKey !== tileChunkRoomKey) {
      tileChunkRoomKey = roomKey;
      tileChunkCache.clear();
    }

    const startCx = Math.floor(camLeft / TILE_CHUNK_PX);
    const endCx = Math.floor((camLeft + viewW) / TILE_CHUNK_PX);
    const startCy = Math.floor(camTop / TILE_CHUNK_PX);
    const endCy = Math.floor((camTop + viewH) / TILE_CHUNK_PX);

    for (let cy = startCy; cy <= endCy; cy++) {
      for (let cx = startCx; cx <= endCx; cx++) {
        const chunk = getTileChunk(cx, cy);
        ctx.drawImage(chunk.canvas, cx * TILE_CHUNK_PX - camLeft, cy * TILE_CHUNK_PX - camTop);
        // Re-draw only the animated river tiles that were baked into this chunk.
        for (const w of chunk.water) {
          const tx = cx * TILE_CHUNK_TILES + w.tx;
          const ty = cy * TILE_CHUNK_TILES + w.ty;
          const tile = pickTile(tx, ty);
          if (tile) ctx.drawImage(tile, tx * TILE_SIZE - camLeft, ty * TILE_SIZE - camTop);
        }
      }
    }

    // Animated ambient dressing: sea beyond the rim, biome ground details, and drifting motes.
    drawSeaAmbient(camLeft, camTop);
    drawGroundAmbient(camLeft, camTop);
    drawAirMotes(camLeft, camTop);

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
      } else if (gz.type === 'sanguine_pool') {
        const r = Math.round(gz.radius || 62);
        const pulse = 0.75 + Math.sin(globalTime * 6) * 0.15;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.14 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, Math.round(r * 0.65), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
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
        ctx.font = '700 11px "Outfit", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const warnText = `⚠️ ${(remain).toFixed(1)}s`;
        const wy = Math.round(gy - ry - 4);
        ctx.fillStyle = '#05070f';
        ctx.fillText(warnText, gx + 1, wy + 1);
        ctx.fillStyle = '#fde047';
        ctx.fillText(warnText, gx, wy);
        if (gz.label) {
          ctx.font = '800 10px "Cinzel", serif';
          const ly = Math.round(gy + 3);
          ctx.fillStyle = '#05070f';
          ctx.fillText(gz.label, gx + 1, ly + 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(gz.label, gx, ly);
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
          } else if (pr.type === 'bankBuilding') {
            img = sprites.props.bankBuilding || sprites.props.pillar;
            shadowRx = 28; shadowRy = 8;
          } else if (pr.type === 'bankCounter') {
            img = sprites.props.bankCounter || sprites.props.pillar;
            shadowRx = 15; shadowRy = 5;
          } else if (pr.type === 'grandFountain') {
            const list = sprites.props.grandFountain;
            img = (list && list[Math.floor(globalTime * 3.0) % list.length]) || sprites.props.pillar;
            shadowRx = 16; shadowRy = 6;
          } else if (pr.type === 'cityHouseA') {
            img = sprites.props.cityHouseA || sprites.props.pillar;
            shadowRx = 20; shadowRy = 6;
          } else if (pr.type === 'cityHouseB') {
            img = sprites.props.cityHouseB || sprites.props.pillar;
            shadowRx = 22; shadowRy = 6;
          } else if (pr.type === 'marketStall' || pr.type.startsWith('marketStall')) {
            img = sprites.props[pr.type] || sprites.props.marketStall || sprites.props.pillar;
            shadowRx = 14; shadowRy = 5;
          } else if (pr.type === 'streetLantern') {
            img = sprites.props.streetLantern || sprites.props.pillar;
            shadowRx = 5; shadowRy = 2;
          } else if (pr.type === 'stoneBench') {
            img = sprites.props.stoneBench || sprites.props.pillar;
            shadowRx = 10; shadowRy = 3;
          } else if (pr.type === 'blossomTree') {
            img = sprites.props.blossomTree || sprites.props.ancientOak || sprites.props.pillar;
            shadowRx = 15; shadowRy = 5;
          } else if (pr.type === 'cosmicAnvil') {
            const list = sprites.props.cosmicAnvil;
            img = (list && list[Math.floor(globalTime * 3.0) % list.length]) || sprites.props.pillar;
            shadowRx = 13; shadowRy = 5;
          } else if (pr.type === 'aetherCrucible') {
            const list = sprites.props.aetherCrucible;
            img = (list && list[Math.floor(globalTime * 3.2) % list.length]) || sprites.props.pillar;
            shadowRx = 12; shadowRy = 4;
          } else if (pr.type === 'celestialLoom') {
            const list = sprites.props.celestialLoom;
            img = (list && list[Math.floor(globalTime * 2.8) % list.length]) || sprites.props.pillar;
            shadowRx = 13; shadowRy = 5;
          } else if (pr.type === 'bountyBoard') {
            img = sprites.props.bountyBoard || sprites.props.woodenSign || sprites.props.pillar;
            shadowRx = 12; shadowRy = 4;
          } else if (pr.type === 'solariSundial') {
            img = sprites.props.solariSundial || sprites.props.pillar;
            shadowRx = 9; shadowRy = 3;
          } else if (pr.type === 'umbriBrazierAltar') {
            const list = sprites.props.umbriBrazierAltar;
            img = (list && list[Math.floor(globalTime * 2.5 + Math.abs(pr.x)) % list.length]) || sprites.props.brazier?.[0] || sprites.props.pillar;
            shadowRx = 9; shadowRy = 4;
          } else if (pr.type === 'terraMenhir') {
            img = sprites.props.terraMenhir || sprites.props.monument || sprites.props.pillar;
            shadowRx = 9; shadowRy = 4;
          } else if (pr.type === 'aetherArmillary') {
            img = sprites.props.aetherArmillary || sprites.props.crystalPillar?.[0] || sprites.props.pillar;
            shadowRx = 8; shadowRy = 3;
          } else if (pr.type === 'ancientWell') {
            img = sprites.props.ancientWell || sprites.props.grandFountain?.[0] || sprites.props.pillar;
            shadowRx = 12; shadowRy = 5;
          } else if (pr.type === 'flowerBed') {
            img = sprites.props.flowerBed || sprites.props.stoneBench || sprites.props.pillar;
            shadowRx = 11; shadowRy = 3;
          }

          if (img) {
            drawPixelEllipseShadow(sx, sy, shadowRx, shadowRy);
            ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 2);
          }
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
            const qx = Math.round(sx);
            const qry = Math.round(qy);

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.strokeText(symbol, qx, qry);
            ctx.fillStyle = fillColor;
            ctx.fillText(symbol, qx, qry);
            ctx.restore();
          }
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

    layoutLootLabels(camLeft, camTop);
    for (const l of lootDrops) {
      renderables.push({
        y: l.y,
        draw: () => drawLootShard(l, Math.round(l.x - camLeft), Math.round(l.y - camTop)),
      });
    }

    layoutOverheadBadges(camLeft, camTop);
    for (const b of overheadBadges) {
      renderables.push({
        y: b.wy + 1500,
        draw: () => drawOverheadBadge(b),
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
            if (ent.skillingType && SKILLING_NODE_TYPES[ent.skillingType]) {
              const sk = SKILLING_NODE_TYPES[ent.skillingType];
              const readyArr = sprites[sk.spriteReady] || sprites.node;
              const emptyArr = sprites[sk.spriteEmpty] || [sprites.nodeEmpty];
              img = ent.charges > 0
                ? readyArr[Math.floor(globalTime * 2.4 + Math.abs(ent.x)) % readyArr.length]
                : (Array.isArray(emptyArr) ? emptyArr[0] : emptyArr);
            } else if (ent.isGrand && ent.charges > 0 && sprites.grandNode?.length) {
              img = sprites.grandNode[Math.floor(globalTime * 2.5) % sprites.grandNode.length];
            } else if (ent.isGrand && sprites.grandNodeEmpty) {
              img = sprites.grandNodeEmpty;
            } else {
              img = ent.charges > 0 ? sprites.node[Math.floor(globalTime * 2.5) % sprites.node.length] : sprites.nodeEmpty;
            }
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
          const isGrandNode = ent.type === 'node' && Boolean(ent.isGrand);
          if (isGrandNode) {
            const pulse = 0.82 + Math.sin(globalTime * 2.4) * 0.12;
            const auraW = Math.round(img.width * 1.05);
            const auraH = Math.round(img.height * 0.34);
            ctx.save();
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(sx, sy, auraW * pulse, auraH * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(192, 132, 252, 0.10)';
            ctx.beginPath();
            ctx.ellipse(sx, sy, (auraW - 8) * pulse, (auraH - 2) * pulse, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          drawPixelEllipseShadow(sx, sy, Math.round(img.width * 0.36), 4);

          const isNexusShard = ent.type === 'siege_shard' || ent.id === 'siege_shard' || (ent.name && ent.name.includes('Nexus'));
          const isEnraged = !isNexusShard && Boolean(ent.enraged || ((ent.hp / (ent.maxHp || 1)) <= 0.35));
          if (ent.isBoss && isEnraged && !ent.isDying) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(sx, sy, Math.round(img.width * 0.46), 5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          } else if (ent.eliteAffix && ELITE_AFFIXES[ent.eliteAffix] && !ent.isDying) {
            const eColor = ELITE_AFFIXES[ent.eliteAffix].color || '#facc15';
            const pulse = 0.88 + Math.sin(globalTime * 4.2 + Math.abs(ent.x)) * 0.14;
            ctx.save();
            ctx.strokeStyle = eColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(sx, sy, Math.round(img.width * 0.52 * pulse), 5, 0, 0, Math.PI * 2);
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
            const nameStr = ent.name;
            const subStr = ent.sub || 'Step In [W]';
            ctx.font = '700 10.5px "Outfit", system-ui, sans-serif';
            const nw = Math.ceil(ctx.measureText(nameStr).width);
            ctx.font = '600 9px "Outfit", system-ui, sans-serif';
            const sw = Math.ceil(ctx.measureText(subStr).width);
            const badgeW = Math.max(Math.max(nw, sw) + 14, 72);
            const badgeH = 25;
            const rx = Math.round(sx);
            const bx = Math.round(rx - badgeW / 2);
            const by = Math.round(sy - img.height - 24);

            // Dark plaque with cyan cybernetic border
            ctx.fillStyle = 'rgba(5, 9, 24, 0.92)';
            ctx.fillRect(bx, by, badgeW, badgeH);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(bx, by, badgeW, 1);
            ctx.fillRect(bx, by + badgeH - 1, badgeW, 1);
            ctx.fillRect(bx, by, 1, badgeH);
            ctx.fillRect(bx + badgeW - 1, by, 1, badgeH);

            // Nameplate text with crisp 1px shadow (separated cleanly so lines never overlap)
            ctx.font = '700 10.5px "Outfit", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#05070f';
            ctx.fillText(nameStr, rx + 1, by + 11);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillText(nameStr, rx, by + 10);

            // Subtitle prompt
            ctx.font = '600 9px "Outfit", system-ui, sans-serif';
            ctx.fillStyle = '#05070f';
            ctx.fillText(subStr, rx + 1, by + 21);
            ctx.fillStyle = '#fde047';
            ctx.fillText(subStr, rx, by + 20);
          } else if (!ent.isDying) {
            const val = ent.hp ?? ent.charges ?? 0;
            const max = ent.maxHp ?? ent.maxCharges ?? 1;
            const isBossOrCore = ent.isBoss || ent.type === 'nexus' || ent.type === 'ally_nexus' || ent.type === 'outpost_nexus' || ent.type === 'siege_shard';
            const bw = isBossOrCore || isGrandNode ? 34 : 22;
            const bx = Math.round(sx - bw / 2);
            const by = Math.round(sy - img.height - 5);

            // Dark border & healthbar fill
            ctx.fillStyle = '#070a12';
            ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(bx, by, bw, 3);
            const skSpecDraw = ent.type === 'node' && ent.skillingType ? SKILLING_NODE_TYPES[ent.skillingType] : null;
            const eliteSpecDraw = ent.eliteAffix ? ELITE_AFFIXES[ent.eliteAffix] : null;
            ctx.fillStyle =
              ent.type === 'node' ? (skSpecDraw?.sparkColors?.[0] || '#c084fc') :
              ent.type === 'siege_shard' ? '#fde047' :
              ent.type === 'outpost_nexus' ? (FACTIONS_META[ent.faction]?.color || '#38bdf8') :
              ent.type === 'ally_nexus' ? '#38bdf8' :
              eliteSpecDraw ? (eliteSpecDraw.color || '#facc15') :
              '#ef4444';
            ctx.fillRect(bx, by, Math.round((val / max) * bw), 3);

            // Overhead entity label for Bosses, Objectives, Targeted entity, Dummy, or nearby entities
            const isTargeted = currentTarget && currentTarget.id === ent.id;
            const dPlayer = Math.hypot(ent.x - player.x, ent.y - player.y);
            const showName = isBossOrCore || Boolean(eliteSpecDraw) || isTargeted || dPlayer < 95 || ent.type === 'dummy' || (ent.type === 'node' && dPlayer < (isGrandNode ? 220 : 125));

            if (showName) {
              ctx.font = isBossOrCore ? '700 10.5px "Outfit", system-ui, sans-serif' : '600 9.5px "Outfit", system-ui, sans-serif';
              ctx.textAlign = 'center';
              const label = ent.type === 'dummy'
                ? 'Training Dummy'
                : ent.type === 'shrine'
                  ? (ent.charges > 0 ? `${ent.name} [${getHarvestKeyLabel()}]` : `${ent.name} (Depleted)`)
                  : ent.type === 'node'
                    ? (ent.charges > 0 ? `${ent.isGrand ? 'Grand Font' : ent.name.replace(/Awakening |East /i, '')} [${getHarvestKeyLabel()}] (${ent.charges}/${ent.maxCharges})` : `Depleted ${skSpecDraw ? ent.name.replace(/Awakening |East /i, '') : ent.isGrand ? 'Grand Font' : 'Node'}`)
                    : ent.isBoss
                      ? (isEnraged ? `★ ${ent.name} 🔥 ENRAGED` : `★ ${ent.name}`)
                      : ent.name;

              const lw = Math.ceil(ctx.measureText(label).width);
              const rx = Math.round(sx);
              const lpx = Math.round(rx - (lw + 8) / 2);
              const lpy = Math.round(by - (isBossOrCore ? 14 : 12));
              const badgeColor = isBossOrCore
                ? (isEnraged ? '#ef4444' : '#facc15')
                : eliteSpecDraw
                  ? (eliteSpecDraw.color || '#facc15')
                  : isTargeted
                    ? '#38bdf8'
                    : ent.type === 'shrine'
                      ? '#facc15'
                      : ent.type === 'node'
                        ? (isGrandNode ? '#fde047' : (skSpecDraw?.sparkColors?.[0] || '#c084fc'))
                        : '#ffffff';

              ctx.fillStyle = 'rgba(5, 7, 16, 0.90)';
              ctx.fillRect(lpx, lpy, lw + 8, isBossOrCore ? 14 : 12);
              if (isBossOrCore || isTargeted || eliteSpecDraw) {
                ctx.fillStyle = badgeColor;
                ctx.fillRect(lpx, lpy + (isBossOrCore ? 13 : 11), lw + 8, 1);
              }

              const textY = Math.round(lpy + (isBossOrCore ? 10 : 9));
              ctx.fillStyle = '#05070f';
              ctx.fillText(label, rx + 1, textY + 1);
              ctx.fillStyle = badgeColor;
              ctx.fillText(label, rx, textY);
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
    for (const r of renderables) {
      try {
        r.draw();
      } catch (err) {
        console.error('[Render Error] Failed to draw renderable:', err);
      }
    }

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
      const zoneTitle = uiEl('minimap-zone-title');
      const zoneLabel = uiEl('zone-label');
      if (zoneTitle) zoneTitle.innerText = `CONTINENTAL CALDERA • ${sub}`;
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

    for (const n of npcs) {
      const nx = Math.round(cx + (n.x - player.x) * scale);
      const ny = Math.round(cy + (n.y - player.y) * scale);
      if (nx < 2 || nx > mw - 4 || ny < 2 || ny > mh - 4) continue;
      mmCtx.fillStyle = '#fde047';
      mmCtx.beginPath();
      mmCtx.arc(nx, ny, 3, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.strokeStyle = '#05070f';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
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
  if (!frontpage.isOpen) {
    buildOfflineZone(ROOM_TYPES.SANCTUARY_HUB);
  }
  refreshHeroPortrait();
  updatePlayerUI();
  updateActionBarBadges();
  renderKeybindUI();
  renderStatsModal();
  renderPartyHud(null, localProfile.id);
  updateQuestTrackerHUD();

  if (frontpage.playMode === 'multiplayer') {
    net.bootstrapAndConnect(prog).then((prof) => {
      if (prof) frontpage.syncFromProfile(prof);
    }).catch(() => {});
  } else {
    isSinglePlayer = true;
    updateNetStatusPill();
  }

  let lastTs = performance.now();
  let lastRenderTs = 0;
  let minimapAccum = 0;
  const MIN_RENDER_MS = 1000 / 60;
  function frame(now) {
    requestAnimationFrame(frame);
    if (frontpage.isOpen) {
      // While at character selection, do not burn 60 FPS CPU/GPU simulating world physics & rendering
      lastTs = now;
      return;
    }
    const dt = Math.min(0.08, Math.max(0.001, (now - lastTs) / 1000));
    lastTs = now;
    try {
      update(dt);
    } catch (err) {
      console.error('[Frame Error update]:', err);
    }
    // Cap world rendering at 60 FPS on high-refresh displays.
    if (now - lastRenderTs < MIN_RENDER_MS - 1) return;
    lastRenderTs = now;
    try {
      drawWorld();
      drawQuestCompass();
    } catch (err) {
      console.error('[Frame Error drawWorld]:', err);
    }
    minimapAccum += dt;
    if (minimapAccum >= 0.1) {
      minimapAccum = 0;
      try {
        renderMinimap();
      } catch (err) {
        console.error('[Frame Error renderMinimap]:', err);
      }
    }
  }
  requestAnimationFrame(frame);
}
