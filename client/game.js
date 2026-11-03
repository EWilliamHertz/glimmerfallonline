// ==========================================
// GlimmerFall Online 2D — Top-Down Pixel Art MMORPG Client Engine
// Authoritative 20Hz WebSocket Sync + Neon PostgreSQL Roster + All 4 Factions
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
  ROOM_TYPES,
  ROOM_CONFIGS,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  ABILITIES_CATALOG,
  EMOTES_CATALOG,
  getSlotAbilitySpec,
  getEffectiveStats,
  createDefaultProgression,
  xpForNextLevel,
  calcMaxHp,
  calcMaxGlimmer,
  calcCritChance,
  calcCdMult,
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
  portal_solari: ROOM_TYPES.SOLARI_CITADEL,
  portal_umbri: ROOM_TYPES.UMBRI_UNDERCITY,
  portal_terra: ROOM_TYPES.TERRA_ORCHARD,
  portal_aether: ROOM_TYPES.AETHER_SPIRE,
  portal_hub: ROOM_TYPES.SANCTUARY_HUB,
};

const AWAKENING_DIALOGUE = [
  {
    speaker: 'AURORA MARSHAL • SOLARI HERALD',
    text: 'Awake at last, Summoner-Knight! Centuries have passed since the Great Nexus shattered between the Glimmer and the Fall, scattering its crystal shards across four warring realms.',
  },
  {
    speaker: 'AURORA MARSHAL • SOLARI HERALD',
    text: 'Explore all 4 Faction Biome Waygates around this Sanctuary, customize your Paperdoll Gear [I] & TCG Loadout [👤 HERO], or form a 3-player Squad [O]!',
  },
  {
    speaker: 'AURORA MARSHAL • SOLARI HERALD',
    text: 'Strike the Dummy with [1], channel the Glimmer Node [E], then step into the North Rift to clash in the 4-Faction Nexus Warzone Siege!',
  },
];

const WARZONE_DIALOGUE = [
  {
    speaker: 'SUNSPIRE ARCHON • WAR COMMANDER',
    text: 'Welcome to the Nexus Warzone! Every 30 minutes, a Shattered Nexus Shard spawns in the center (or type /siege to rally an instant clash)!',
  },
  {
    speaker: 'SUNSPIRE ARCHON • WAR COMMANDER',
    text: 'Defend your Faction’s 25-HP Outpost Nexus, shatter rival Outposts, plant your Order Banner [B] (+1 Power), and queue 3v3 Ranked Arena!',
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
  let viewW = 320;
  let viewH = 180;

  function resizeCanvas() {
    viewW = Math.max(240, Math.ceil(window.innerWidth / zoom));
    viewH = Math.max(160, Math.ceil(window.innerHeight / zoom));
    canvas.width = viewW;
    canvas.height = viewH;
    ctx.imageSmoothingEnabled = false;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const camera = { x: 0, y: 0 };
  let currentZone = 'tutorial';
  let currentRoomType = ROOM_TYPES.SANCTUARY_HUB;
  let currentBiomeTheme = 'sanctuary';
  let currentRoomId = 'sanctuary_hub_1';
  let currentRoomMax = 60;
  let onlineTotal = 1;
  let publicRoomsList = [];
  const mapBounds = { halfW: 288, halfH: 240 };
  let portalCooldown = 0;

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
    } catch (_) {}
  }

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

  let activeDialoguePages = [];
  let dialogueIdx = 0;
  let introShown = false;

  const quests = { moved: false, damaged: false, harvested: false, portalReady: false };
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

  window.toggleBgmMute = function () {
    const playing = audio.toggleBgm();
    const btn = document.getElementById('btn-bgm-toggle');
    if (btn) btn.innerText = playing ? '🎵 BGM' : '🔇 BGM';
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
      };
      saveProgressionLocal();
    }
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
    div.dataset.cat = category;
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
    localProfile.loadout = { ...(localProfile.loadout || {}), [slot]: ab.id };
    audio.playSpell();
    updateActionBarBadges();
    renderKeybindUI();
    if (net.connected) {
      net.send({ type: 'update_loadout', loadout: localProfile.loadout });
    }
  };

  // ==========================================
  // Party / Squad & Account UI Handlers
  // ==========================================
  window.sendPartyInviteTo = function (targetIdOrName) {
    if (!net.connected) {
      logMessage('[Party] Connect to the online server to invite players.', 'log-combat', 'party');
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
      audio.playPortal();
      net.send({ type: 'switch_room', roomId });
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
      alert('Please enter a valid server URL (e.g. https://your-server.ngrok-free.dev or http://localhost:3001)');
      return;
    }
    net.setServerBase(val);
    logMessage(`[Server] Connecting to multiplayer host: ${val}`, 'log-solari', 'chat');
  };

  window.resetCustomServerUrl = function () {
    net.setServerBase('');
    const inp = document.getElementById('custom-server-inp');
    if (inp) inp.value = '';
    logMessage(`[Server] Reset to default same-origin / Vercel serverless host.`, 'log-system', 'chat');
  };

  // ==========================================
  // Dialogue Helpers
  // ==========================================
  function openDialogue(pages) {
    activeDialoguePages = pages;
    dialogueIdx = 0;
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
  }

  window.advanceDialogue = function () {
    audio.playDialogue();
    dialogueIdx++;
    renderDialogueBox();
  };

  window.closeDialogue = function () {
    activeDialoguePages = [];
    renderDialogueBox();
  };

  // ==========================================
  // XP, Stats & Skill Ranks
  // ==========================================
  function awardXP(amount, reason = '') {
    if (amount <= 0) return;
    prog.xp += amount;
    let leveled = false;

    while (prog.xp >= xpForNextLevel(prog.level)) {
      prog.xp -= xpForNextLevel(prog.level);
      prog.level++;
      prog.statPoints += 3;
      prog.skillPoints += 1;
      leveled = true;
    }

    recalcVitalsFromProfile();

    if (leveled) {
      player.hp = player.maxHp;
      audio.playLevelUp();
      spawnSparkBurst(player.x, player.y - 8, ['#fde047', '#38bdf8', '#4ade80', '#ffffff'], 26);
      spawnFCT(player.x, player.y - 12, `LEVEL ${prog.level}!`, '#fde047', true);
      logMessage(`[LEVEL UP!] Reached Level ${prog.level}! +3 Stat Pts [C] & +1 Rite Pt [P]!`, 'log-solari');
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
  // Particles
  // ==========================================
  function spawnSmokeBurst(wx, wy, count = 28) {
    const palette = ['#3b0764', '#581c87', '#7e22ce', '#a855f7', '#475569', '#e9d5ff'];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 8 + Math.random() * 28;
      particles.push({
        x: wx + (Math.random() - 0.5) * 14,
        y: wy + (Math.random() - 0.5) * 10,
        z: 4 + Math.random() * 10,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.5,
        vz: 18 + Math.random() * 26,
        size: Math.random() < 0.45 ? 4 : 3,
        color: palette[(Math.random() * palette.length) | 0],
        age: 0,
        maxAge: 0.55 + Math.random() * 0.45,
      });
    }
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
  function setupZoneDecor(zoneType, roomTitleOverride = null) {
    const resolvedRoomType = ROOM_CONFIGS[zoneType]
      ? zoneType
      : zoneType === 'tutorial'
        ? ROOM_TYPES.SANCTUARY_HUB
        : zoneType === 'arena_3v3'
          ? ROOM_TYPES.ARENA_3V3
          : ROOM_TYPES.NEXUS_WARZONE;

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
      zoneTitle.innerText = roomTitleOverride || 'SANCTUARY HUB #1';
      zoneLabel.innerText = 'To Warzone';
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
      npcs.push({
        id: 'npc_aurora',
        name: 'Aurora Marshal',
        role: 'Solari Herald [Click / T]',
        x: 38,
        y: 82,
        dialogue: AWAKENING_DIALOGUE,
      });
      if (!introShown && !frontpage.isOpen) {
        introShown = true;
        openDialogue(AWAKENING_DIALOGUE);
      }
    } else if (resolvedRoomType === ROOM_TYPES.ARENA_3V3) {
      zoneTitle.innerText = roomTitleOverride || '3v3 NEXUS ARENA';
      zoneLabel.innerText = 'Exit Arena';
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
    } else {
      zoneTitle.innerText = roomTitleOverride || cfg.shortTitle || 'NEXUS WARZONE';
      zoneLabel.innerText = 'To Sanctuary';
      arenaBanner.style.display = 'none';
      if (tutQuestBody) tutQuestBody.style.display = 'none';
      if (warzoneQuestBody) warzoneQuestBody.style.display = 'block';

      [[-90, 95], [90, 95], [-145, -20], [145, -20], [-75, -135], [75, -135]].forEach(([pxX, pxY], idx) => {
        props.push({ type: idx % 2 === 0 ? 'pillar' : 'brazier', x: pxX, y: pxY });
      });

      if (resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE) {
        npcs.push({
          id: 'npc_archon',
          name: 'Sunspire Archon',
          role: 'War Commander [Click / T]',
          x: -38,
          y: 138,
          dialogue: WARZONE_DIALOGUE,
        });
      }
    }
  }

  function buildOfflineZone(zone) {
    setupZoneDecor(zone);
    entities = [];
    allies = [];
    projectiles = [];
    groundZones = [];
    worldBanners = [];
    lootDrops = [];

    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      player.x = 0;
      player.y = 96;
      entities.push(
        { id: 'dummy_1', name: 'Sanctuary Dummy', sub: 'Lv.1 Awakening Training Post', type: 'dummy', spriteKey: 'dummy', x: 0, y: 12, origX: 0, origY: 12, hp: 30, maxHp: 30, xpReward: 30, radius: 14, hitFlash: 0 },
        { id: 'tut_stalker_1', name: 'Void Stalker Scout', sub: 'Lv.1 Umbri Minion (Training)', type: 'mob', spriteKey: 'voidStalker', x: -85, y: -45, origX: -85, origY: -45, hp: 20, maxHp: 20, damage: 3, xpReward: 35, speed: 48, aggroRange: 105, attackRange: 26, radius: 15, hitFlash: 0 },
        { id: 'tut_stalker_2', name: 'Void Stalker Raider', sub: 'Lv.2 Umbri Minion (Training)', type: 'mob', spriteKey: 'voidStalker', x: 85, y: -45, origX: 85, origY: -45, hp: 25, maxHp: 25, damage: 3, xpReward: 45, speed: 50, aggroRange: 105, attackRange: 26, radius: 15, hitFlash: 0 },
        { id: 'tut_behemoth', name: 'Granite Bouldergut', sub: '★ Lv.3 Terra Training Golem', type: 'mob', isBoss: true, spriteKey: 'graniteBoss', x: 0, y: -90, origX: 0, origY: -90, hp: 45, maxHp: 45, damage: 5, xpReward: 85, speed: 36, aggroRange: 115, attackRange: 32, radius: 20, hitFlash: 0 },
        { id: 'tut_font', name: 'Awakening Glimmer Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -88, y: 22, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'tut_font_2', name: 'East Glimmer Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 88, y: 22, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'portal_main', name: 'Nexus Warzone Rift', sub: 'Step In -> Nexus Warzone', type: 'portal', targetRoom: ROOM_TYPES.NEXUS_WARZONE, spriteKey: 'portal', x: 0, y: -158, hp: 1, maxHp: 1, radius: 20, hitFlash: 0 },
        { id: 'portal_solari', name: 'Lantern District Gate', sub: '☀️ Solari Dungeon', type: 'portal', targetRoom: ROOM_TYPES.SOLARI_CITADEL, spriteKey: 'portal', x: -128, y: -136, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 },
        { id: 'portal_umbri', name: 'Sepulcher Undercity Rift', sub: '🌑 Umbri Dungeon', type: 'portal', targetRoom: ROOM_TYPES.UMBRI_UNDERCITY, spriteKey: 'portal', x: 128, y: -136, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 },
        { id: 'portal_terra', name: 'Glimmer Orchard Waygate', sub: '🌿 Terra Dungeon', type: 'portal', targetRoom: ROOM_TYPES.TERRA_ORCHARD, spriteKey: 'portal', x: -145, y: 112, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 },
        { id: 'portal_aether', name: 'Mirrorgate Spire Rift', sub: '🔮 Aether Dungeon', type: 'portal', targetRoom: ROOM_TYPES.AETHER_SPIRE, spriteKey: 'portal', x: 145, y: 112, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.ARENA_3V3) {
      player.x = 0;
      player.y = 175;
      entities.push(
        { id: 'blue_nexus', name: 'Solari Sanctuary Nexus', sub: '25 HP Ally Core', type: 'ally_nexus', spriteKey: 'nexusBlue', x: 0, y: 220, hp: 25, maxHp: 25, radius: 22, hitFlash: 0 },
        { id: 'red_nexus', name: 'Umbri Dominion Nexus', sub: '25 HP Enemy Core', type: 'nexus', spriteKey: 'nexusRed', x: 0, y: -215, hp: 25, maxHp: 25, xpReward: 220, radius: 22, hitFlash: 0 },
        { id: 'enemy_1', name: 'Void Stalker [Umbri]', sub: 'Enemy Vanguard', type: 'mob', spriteKey: 'voidStalker', x: -64, y: -85, origX: -64, origY: -85, hp: 25, maxHp: 25, damage: 4, xpReward: 65, speed: 54, aggroRange: 230, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'enemy_2', name: 'Gloam Reaper [Umbri]', sub: 'Enemy Harvester', type: 'mob', spriteKey: 'voidStalker', x: 0, y: -105, origX: 0, origY: -105, hp: 22, maxHp: 22, damage: 4, xpReward: 65, speed: 60, aggroRange: 230, attackRange: 26, radius: 14, hitFlash: 0 },
        { id: 'enemy_3', name: 'Brambleheart Behemoth', sub: 'Enemy Terra Titan', type: 'mob', isBoss: true, spriteKey: 'graniteBoss', x: 64, y: -85, origX: 64, origY: -85, hp: 34, maxHp: 34, damage: 5, xpReward: 110, speed: 42, aggroRange: 230, attackRange: 32, radius: 20, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.SOLARI_CITADEL) {
      player.x = 0;
      player.y = 170;
      entities.push(
        { id: 'sol_mob_1', name: 'Sunforged Sentinel', sub: 'Lv.3 Solari Construct', type: 'mob', spriteKey: 'solariSentinel', x: -75, y: 35, origX: -75, origY: 35, hp: 36, maxHp: 36, damage: 4, xpReward: 65, speed: 52, aggroRange: 112, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_boss', name: 'High Sunfire Colossus', sub: '★ Lv.6 Golden Citadel Boss', type: 'mob', isBoss: true, spriteKey: 'solariBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 85, maxHp: 85, damage: 6, xpReward: 185, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'portal_hub', name: 'Return to Sanctuary', sub: 'Step In -> Sanctuary Hub', type: 'portal', targetRoom: ROOM_TYPES.SANCTUARY_HUB, spriteKey: 'portal', x: 0, y: 205, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.UMBRI_UNDERCITY) {
      player.x = 0;
      player.y = 170;
      entities.push(
        { id: 'umb_mob_1', name: 'Duskveil Stalker', sub: 'Lv.3 Umbri Assassin', type: 'mob', spriteKey: 'voidStalker', x: -80, y: 30, origX: -80, origY: 30, hp: 34, maxHp: 34, damage: 5, xpReward: 65, speed: 55, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_boss', name: 'Graveglass Archlich', sub: '★ Lv.6 Sepulcher Boss', type: 'mob', isBoss: true, spriteKey: 'umbriBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 80, maxHp: 80, damage: 7, xpReward: 185, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'portal_hub', name: 'Return to Sanctuary', sub: 'Step In -> Sanctuary Hub', type: 'portal', targetRoom: ROOM_TYPES.SANCTUARY_HUB, spriteKey: 'portal', x: 0, y: 205, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.TERRA_ORCHARD) {
      player.x = 0;
      player.y = 170;
      entities.push(
        { id: 'ter_mob_1', name: 'Bramble Treant', sub: 'Lv.3 Terra Guardian', type: 'mob', spriteKey: 'terraWarden', x: -78, y: 32, origX: -78, origY: 32, hp: 40, maxHp: 40, damage: 4, xpReward: 65, speed: 52, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_boss', name: 'Elder Rootdeep Behemoth', sub: '★ Lv.6 Orchard Boss', type: 'mob', isBoss: true, spriteKey: 'graniteBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 95, maxHp: 95, damage: 6, xpReward: 185, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'portal_hub', name: 'Return to Sanctuary', sub: 'Step In -> Sanctuary Hub', type: 'portal', targetRoom: ROOM_TYPES.SANCTUARY_HUB, spriteKey: 'portal', x: 0, y: 205, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 }
      );
    } else if (currentRoomType === ROOM_TYPES.AETHER_SPIRE) {
      player.x = 0;
      player.y = 170;
      entities.push(
        { id: 'aeth_mob_1', name: 'Chrono Anomaly', sub: 'Lv.3 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: -78, y: 32, origX: -78, origY: 32, hp: 34, maxHp: 34, damage: 5, xpReward: 65, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_boss', name: 'Archon of the Continuum', sub: '★ Lv.6 Mirrorgate Boss', type: 'mob', isBoss: true, spriteKey: 'aetherBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 82, maxHp: 82, damage: 7, xpReward: 185, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'portal_hub', name: 'Return to Sanctuary', sub: 'Step In -> Sanctuary Hub', type: 'portal', targetRoom: ROOM_TYPES.SANCTUARY_HUB, spriteKey: 'portal', x: 0, y: 205, hp: 1, maxHp: 1, radius: 18, hitFlash: 0 }
      );
    } else {
      player.x = 0;
      player.y = 165;
      entities.push(
        { id: 'siege_shard', name: 'Shattered Nexus Shard', sub: '⚡ Siege Event Objective', type: 'siege_shard', isBoss: true, spriteKey: 'siegeShard', x: 0, y: -12, origX: 0, origY: -12, hp: 85, maxHp: 85, xpReward: 240, radius: 24, hitFlash: 0 },
        { id: 'umbri_1', name: 'Void Stalker', sub: 'Lv.2 Umbri Entity (AWK)', type: 'mob', spriteKey: 'voidStalker', x: -95, y: -25, origX: -95, origY: -25, hp: 30, maxHp: 30, damage: 4, xpReward: 55, speed: 52, aggroRange: 112, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umbri_2', name: 'Duskblade Fiend', sub: 'Lv.3 Umbri Entity (AWK)', type: 'mob', spriteKey: 'voidStalker', x: 75, y: 35, origX: 75, origY: 35, hp: 26, maxHp: 26, damage: 4, xpReward: 60, speed: 58, aggroRange: 108, attackRange: 26, radius: 13, hitFlash: 0 },
        { id: 'terra_boss', name: 'Granite Behemoth', sub: '★ Lv.5 Terra World Boss', type: 'mob', isBoss: true, spriteKey: 'graniteBoss', x: 120, y: -105, origX: 120, origY: -105, hp: 60, maxHp: 60, damage: 6, xpReward: 135, speed: 38, aggroRange: 130, attackRange: 34, radius: 21, hitFlash: 0 },
        { id: 'portal_hub', name: 'Sanctuary Hub Rift', sub: 'Step In -> Sanctuary Hub', type: 'portal', targetRoom: ROOM_TYPES.SANCTUARY_HUB, spriteKey: 'portal', x: 0, y: 215, hp: 1, maxHp: 1, radius: 20, hitFlash: 0 }
      );
    }
    camera.x = player.x;
    camera.y = player.y;
  }

  // ==========================================
  // Authoritative 20Hz Server Packet Handling
  // ==========================================
  function updateNetStatusPill() {
    const pill = document.getElementById('net-status-pill');
    if (!pill) return;
    if (!net.connected) {
      pill.style.color = '#fbbf24';
      pill.innerText = '● LOCAL / RECONNECTING...';
      return;
    }
    const roomPop = remotePlayers.size + 1;
    pill.style.color = '#4ade80';
    pill.innerText = `● 20Hz • ${roomPop}/${currentRoomMax} IN ROOM (${onlineTotal} ON)`;
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
          showDeathScreen(3);
        } else if (!sp.isDead && (player.isDead || deathScreenVisible)) {
          player.isDead = false;
          hideDeathScreen();
        }
        if (Math.hypot(sp.x - player.x, sp.y - player.y) > 75) {
          player.x = sp.x;
          player.y = sp.y;
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
        if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !quests.damaged) {
          quests.damaged = true;
          document.getElementById('qc-2').classList.add('done');
          document.getElementById('qc-2').innerText = '✓';
          document.getElementById('quest-stage-txt').innerText = '2 / 4';
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
        audio.playSmokePuff();
        spawnSmokeBurst(fx.x, fx.y, fx.count || 26);
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
    onStatusChange(connected) {
      updateNetStatusPill();
      if (connected) {
        logMessage('[Server] Connected to 20Hz Authoritative Server + Neon PostgreSQL!', 'log-heal', 'chat');
      } else {
        remotePlayers.clear();
        logMessage('[Server] Connection lost — running local fallback & reconnecting...', 'log-combat', 'chat');
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

        case 'room_joined':
          currentRoomId = msg.roomId;
          currentRoomMax = msg.maxPlayers || 60;
          remotePlayers.clear();
          player.x = msg.x;
          player.y = msg.y;
          player.dir = msg.dir || 'up';
          player.team = msg.team || null;
          if (player.isDead) player.isDead = false;
          hideDeathScreen();
          if (msg.roomType === ROOM_TYPES.ARENA_3V3) {
            const am = document.getElementById('arena-modal');
            if (am) am.style.display = 'none';
            window.dismissArenaInvite?.();
          }
          camera.x = player.x;
          camera.y = player.y;
          setupZoneDecor(msg.roomType, msg.roomTitle);
          if (msg.roomType !== ROOM_TYPES.SANCTUARY_HUB && !quests.portalReady) {
            quests.portalReady = true;
            const qc4 = document.getElementById('qc-4');
            if (qc4) {
              qc4.classList.add('done');
              qc4.innerText = '✓';
            }
          }
          applyServerSnapshot(msg.snapshot);
          break;

        case 'world_state':
          if (msg.roomId === currentRoomId) {
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
          };
          player.hp = msg.hp ?? player.hp;
          player.maxHp = msg.maxHp ?? calcMaxHp(prog, localProfile.equipment, localProfile.classId);
          player.maxSolarCharge = msg.maxSolarCharge ?? calcMaxGlimmer(prog, localProfile.equipment, localProfile.classId);
          saveProgressionLocal();
          if (msg.leveled) {
            audio.playLevelUp();
            logMessage(`[LEVEL UP!] Reached Level ${prog.level}! +3 Stat Pts [C] & +1 Rite Pt [P]!`, 'log-solari', 'combat');
          } else if (msg.xpGained && msg.reason) {
            logMessage(`[XP] +${msg.xpGained} XP (${msg.reason})`, 'log-gain', 'combat');
          }
          updatePlayerUI();
          updateActionBarBadges();
          renderStatsModal();
          renderKeybindUI();
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

  // ==========================================
  // Game Frontpage Controller (Character Select, Faction, Class & Loadout)
  // ==========================================
  const frontpage = new FrontpageController({
    net,
    audio,
    onEnterWorld({ profile, startingRealm }) {
      if (profile) applyProfile(profile);
      audio.setBgmTheme(ROOM_CONFIGS[startingRealm]?.bgm || 'sanctuary');
      if (net.connected && startingRealm && !currentRoomId.startsWith(startingRealm)) {
        net.send({ type: 'switch_room', roomType: startingRealm });
      } else if (!net.connected && startingRealm && startingRealm !== currentRoomType) {
        buildOfflineZone(startingRealm);
      } else if (!introShown && currentRoomType === ROOM_TYPES.SANCTUARY_HUB) {
        introShown = true;
        openDialogue(AWAKENING_DIALOGUE);
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
      } else if (l.kind === 'glimmer') {
        player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + 30);
        spawnFCT(player.x, player.y - 14, '+30 GLIMMER SHARD', '#38bdf8');
      } else {
        awardXP(60, 'Relic Shard');
        spawnFCT(player.x, player.y - 14, '✦ RELIC SHARD +60 XP', '#fde047', true);
      }
      spawnSmokeBurst(l.x, l.y, 6);
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

    audio.playSmokePuff();
    spawnSmokeBurst(ent.x, ent.y, ent.isBoss ? 44 : 28);
    logMessage(`[Void Banish] ${ent.name} was cast into the Void!`, 'log-gain', 'combat');
    awardXP(ent.xpReward || 30, ent.name);
    if (ent.type === 'mob') spawnOfflineLoot(ent);

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

    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !quests.damaged) {
      quests.damaged = true;
      const qc2 = document.getElementById('qc-2');
      if (qc2) {
        qc2.classList.add('done');
        qc2.innerText = '✓';
      }
      const qStage = document.getElementById('quest-stage-txt');
      if (qStage) qStage.innerText = '2 / 4';
    }

    if (currentTarget && currentTarget.id === ent.id) {
      updateTargetUI();
    }

    if (ent.type === 'dummy' && ent.hp > 0) {
      awardXP(8, '');
    }

    // Umbri Void Harvest life-leech
    if (isRite && localProfile.faction === 'Umbri') {
      player.hp = Math.min(player.maxHp, player.hp + Math.max(1, Math.round(dmg * 0.2)));
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

  function damageOfflinePlayer(amount, attackerName, attackerRef = null) {
    if (player.isDead || player.hp <= 0) return;

    // Terra Faction Mechanic: Thornbark damage reflection!
    const reflectPct = player.thornbark ? 0.35 : localProfile.faction === 'Terra' ? 0.15 : 0;
    if (reflectPct > 0 && attackerRef && attackerRef.hp !== undefined) {
      const refl = Math.max(1, Math.round(amount * reflectPct));
      damageOfflineEntity(attackerRef, refl, false, false, 'Thornbark');
      spawnFCT(attackerRef.x, attackerRef.y - 8, `🌿 -${refl} THORNS`, '#4ade80');
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
    const spec = getSlotAbilitySpec(localProfile.loadout, slot);
    if (!spec) return;

    if (cooldowns[slot] > 0) {
      logMessage(`[Cooldown] ${spec.name} ready in ${cooldowns[slot].toFixed(1)}s`, 'log-combat');
      return;
    }

    if (spec.cost > 0 && player.solarCharge < spec.cost) {
      logMessage(`[Glimmer] ${spec.name} requires ${spec.cost} Glimmer!`, 'log-combat');
      return;
    }

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
    } else if (spec.kind === 'shield' || spec.kind === 'thornbark') {
      audio.playShield();
    } else if (spec.kind === 'heal' || spec.kind === 'heal_glimmer' || spec.kind === 'timeloop') {
      audio.playChime();
    } else if (spec.kind === 'stealth') {
      audio.playStealth();
    } else if (spec.kind === 'frost_nova') {
      audio.playFreeze();
    } else if (spec.kind === 'dash' || spec.kind === 'shadow_step') {
      audio.playDash();
    } else if (spec.kind === 'nova') {
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
    const isRite = spec.tcgType.includes('Rite');
    const isFlash = spec.tcgType.includes('Flash');

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
      if (spec.kind === 'shadow_step' && acquiredTarget) {
        const ang = Math.atan2(acquiredTarget.y - player.y, acquiredTarget.x - player.x);
        player.x = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, acquiredTarget.x + Math.cos(ang) * 18));
        player.y = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, acquiredTarget.y + Math.sin(ang) * 18));
        damageOfflineEntity(acquiredTarget, 6 + eff.power + rank * 2, true, false, spec.name);
      } else {
        const { dx, dy } = getFacingVector();
        const dist = ((spec.rangeYards || 8.5) + rank * 0.35) * YARD_PX;
        player.x = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, player.x + dx * dist));
        player.y = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, player.y + dy * dist));
      }
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
    let node = currentTarget && currentTarget.type === 'node' ? currentTarget : null;
    if (!node) {
      node = entities.find((e) => e.type === 'node' && Math.hypot(e.x - player.x, e.y - player.y) <= 6.8 * YARD_PX);
      if (node) setTarget(node);
    }
    if (!node || Math.hypot(node.x - player.x, node.y - player.y) > 7.0 * YARD_PX) {
      logMessage('[Glimmer Node] Step near a purple Glimmer Node spire first!', 'log-combat');
      return;
    }
    audio.playChime();
    if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !quests.harvested) {
      quests.harvested = true;
      document.getElementById('qc-3').classList.add('done');
      document.getElementById('qc-3').innerText = '✓';
      document.getElementById('quest-stage-txt').innerText = '3 / 4';
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
    audio.playDialogue();
    openDialogue(npcs[0].dialogue);
  };

  window.teleportWorld = function () {
    audio.playPortal();
    const nextType = currentRoomType === ROOM_TYPES.SANCTUARY_HUB ? ROOM_TYPES.NEXUS_WARZONE : ROOM_TYPES.SANCTUARY_HUB;
    if (net.connected) {
      net.send({ type: 'switch_room', roomType: nextType });
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
        <div style="font-size:8.5px; color:#fbbf24; margin:6px 0;">Server offline — only single-player computer matches are available.</div>
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
    zoom = zoom === 3 ? 4 : zoom === 4 ? 2 : 3;
    resizeCanvas();
    const zBtn = document.getElementById('zoom-label');
    if (zBtn) zBtn.innerText = `${zoom}x`;
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
      const badge = document.getElementById(`badge-${slot}`);
      if (badge && keybinds[slot]) badge.innerText = formatKeyLabel(keybinds[slot]);
      const rk = document.getElementById(`rank-${slot}`);
      if (rk) rk.innerText = `R${prog.ranks[slot] || 1}`;
      const iconEl = document.getElementById(`icon-${slot}`);
      if (iconEl && spec) iconEl.innerText = spec.icon;
      const nameEl = document.getElementById(`name-${slot}`);
      if (nameEl && spec) nameEl.innerText = spec.short;
      const btnEl = document.getElementById(`btn-slot-${slot}`);
      if (btnEl && spec) {
        btnEl.title = `${spec.name} (${spec.tcgType}) — ${spec.desc}`;
        btnEl.classList.toggle('flash-card', spec.tcgType.includes('Flash'));
        btnEl.classList.toggle('rite-card', spec.tcgType.includes('Rite'));
      }
    }
    const hb = document.getElementById('badge-harvest');
    if (hb && keybinds.harvest) hb.innerText = formatKeyLabel(keybinds.harvest);
  }

  let rebindFeedbackMsg = '';

  function renderKeybindUI() {
    const container = document.getElementById('keybind-list-container');
    if (!container) return;
    const ptsHeader = document.getElementById('skill-points-banner');
    if (ptsHeader) {
      if (listeningSlot !== null) {
        const lSpec = getSlotAbilitySpec(localProfile.loadout, listeningSlot);
        ptsHeader.innerText = `⌨️ PRESS ANY KEY TO BIND "${(lSpec?.name || 'SLOT').toUpperCase()}" (OR [ESC] TO CANCEL)...`;
        ptsHeader.style.color = '#fde047';
      } else if (rebindFeedbackMsg) {
        ptsHeader.innerText = rebindFeedbackMsg;
        ptsHeader.style.color = '#4ade80';
      } else {
        ptsHeader.innerText = `SKILL POINTS AVAILABLE: ${prog.skillPoints}  •  CLICK ANY [KEY] BUTTON TO REBIND`;
        ptsHeader.style.color = prog.skillPoints > 0 ? '#fde047' : '#94a3b8';
      }
    }
    container.innerHTML = '';
    const cdMult = calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction);
    const allChoices = Object.values(ABILITIES_CATALOG).filter((a) => a.faction !== 'All');

    for (const slot of [1, 2, 3, 4, 'harvest', 9, 10, 11, 12]) {
      const spec = getSlotAbilitySpec(localProfile.loadout, slot);
      if (!spec) continue;
      const bound = formatKeyLabel(keybinds[slot]);
      const isListening = listeningSlot === slot;
      const isRankable = typeof slot === 'number';
      const curRank = isRankable ? (prog.ranks[slot] || 1) : null;
      const canUpgrade = isRankable && prog.skillPoints > 0 && curRank < 5;

      const row = document.createElement('div');
      row.className = 'keybind-row';
      row.innerHTML = `
        <div style="flex:1; padding-right:10px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:14px;">${spec.icon}</span>
            <b style="color:${spec.color}; font-size:11px;">${spec.name}</b>
            <span class="spec-pill">${spec.tcgType}</span>
            ${isRankable ? `<span class="rank-pill">RANK ${curRank}/5</span>` : ''}
            <span style="font-size:9px; color:#94a3b8;">CD:${spec.baseCd > 0 ? (spec.baseCd * cdMult).toFixed(1) + 's' : '0s'} | ${spec.range}</span>
          </div>
          <div style="font-size:10px; color:#e2e8f0; margin-top:3px; line-height:1.35;">${spec.desc}</div>
          ${isRankable ? `
            <div style="margin-top:4px;">
              <select class="pixel-input" style="width:auto; padding:2px 6px; font-size:8.5px;" onchange="assignSlotAbilityInGame(${slot}, this.value); this.blur();">
                ${allChoices.map((ab) => `<option value="${ab.id}" ${spec.id === ab.id ? 'selected' : ''}>${ab.icon} ${ab.name} (${ab.faction})</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${isRankable ? `
            <button type="button" class="upgrade-btn ${canUpgrade ? 'ready' : ''}" ${canUpgrade ? '' : 'disabled'} onclick="upgradeSkillRank(${slot})">
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
      <div style="display:flex; justify-content:space-between; align-items:center; background:#080c18; border:2px solid #1e293b; padding:8px 10px; margin-bottom:8px; font-size:10px;">
        <div>CHAMPION LEVEL: <b style="color:#facc15;">LV. ${prog.level}</b> (${prog.xp}/${xpForNextLevel(prog.level)} XP)</div>
        <div style="color:${prog.statPoints > 0 ? '#4ade80' : '#94a3b8'}; font-weight:bold;">
          UNSPENT STAT POINTS: ${prog.statPoints}
        </div>
      </div>
      <div style="background:#080c18; border-left:3px solid ${fm.color}; padding:6px 8px; margin-bottom:8px; font-size:9px;">
        <b style="color:${fm.color};">${fm.icon} ${fm.mechanicName}:</b> ${fm.mechanicDesc}
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
        ${statDefs.map((s) => `
          <div class="keybind-row" style="margin-bottom:0;">
            <div>
              <div style="font-size:11px; color:#f8fafc;">
                ${s.icon} <b>${s.name}</b>: <span style="color:#facc15;">${s.total}</span>
                <span style="font-size:9px; color:#94a3b8;">(Base ${s.base} + Gear ${s.total - s.base})</span>
              </div>
              <div style="font-size:9px; color:#94a3b8; margin-top:2px;">${s.desc}</div>
            </div>
            <button class="upgrade-btn ${prog.statPoints > 0 ? 'ready' : ''}" ${prog.statPoints > 0 ? '' : 'disabled'} onclick="allocateStat('${s.key}')">
              +1 STAT
            </button>
          </div>
        `).join('')}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:10px; background:#080c18; border:2px solid #1e293b; padding:8px 10px;">
        <div>MAX HEALTH: <b style="color:#4ade80;">${player.maxHp} HP</b></div>
        <div>MAX GLIMMER: <b style="color:#facc15;">${player.maxSolarCharge}</b></div>
        <div>CRIT CHANCE: <b style="color:#fde047;">${(calcCritChance(prog, localProfile.equipment, localProfile.classId) * 100).toFixed(1)}%</b></div>
        <div>COOLDOWN MULT: <b style="color:#38bdf8;">${Math.round(calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction) * 100)}%</b></div>
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

  window.toggleModal = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const opening = el.style.display !== 'block';
    listeningSlot = null;
    rebindFeedbackMsg = '';
    document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    if (opening) {
      if (id === 'char-modal') renderStatsModal();
      if (id === 'spellbook-modal') renderKeybindUI();
      if (id === 'arena-modal') renderArenaModal();
      if (id === 'paperdoll-modal') renderInGamePaperdollModal({ profile: localProfile });
      if (id === 'account-modal') {
        renderAccountModal({ profile: localProfile, authTab: accountAuthTab, statusMsg: accountStatusMsg });
      }
      if (id === 'social-modal') {
        if (net.connected) net.send({ type: 'list_rooms' });
        refreshSocialModalView();
      }
      el.style.display = 'block';
    }
  };

  // ==========================================
  // Input Listeners
  // ==========================================
  function enterPortalEntity(ent) {
    const dest = ent.targetRoom || PORTAL_ID_TO_ROOM[ent.id] || ROOM_TYPES.NEXUS_WARZONE;
    portalCooldown = 1.6;
    audio.playPortal();
    if (net.connected) {
      net.send({ type: 'switch_room', roomType: dest });
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
        audio.playDialogue();
        openDialogue(npc.dialogue);
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
    if (e.deltaY < 0 && zoom < 4) zoom++;
    else if (e.deltaY > 0 && zoom > 2) zoom--;
    resizeCanvas();
    const zBtn = document.getElementById('zoom-label');
    if (zBtn) zBtn.innerText = `${zoom}x`;
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
      setTarget(null);
      window.closeDialogue();
      document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
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
    if (key === 'm') window.toggleBgmMute();
    if (key === 'p') window.toggleModal('spellbook-modal');
    if (key === 'c') window.toggleModal('char-modal');
    if (key === 'g') window.toggleModal('account-modal');
    if (key === 'o') window.toggleModal('social-modal');
    if (key === 'k') window.toggleModal('cards-modal');
    if (key === 'l') window.toggleModal('lore-modal');
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
  function update(dt) {
    globalTime += dt;
    if (portalCooldown > 0) portalCooldown = Math.max(0, portalCooldown - dt);

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
        const len = Math.hypot(mx, my);
        mx /= len;
        my /= len;

        const eff = getEffectiveStats(prog, localProfile.equipment, localProfile.classId);
        const tempoSpeed = player.baseSpeed * (1 + eff.tempo * 0.03);
        const spd = tempoSpeed * (inputs.shift ? player.sprintMult : 1);
        player.x = Math.max(-mapBounds.halfW + 14, Math.min(mapBounds.halfW - 14, player.x + mx * spd * dt));
        player.y = Math.max(-mapBounds.halfH + 14, Math.min(mapBounds.halfH - 14, player.y + my * spd * dt));
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

        if (currentRoomType === ROOM_TYPES.SANCTUARY_HUB && !quests.moved) {
          quests.moved = true;
          document.getElementById('qc-1').classList.add('done');
          document.getElementById('qc-1').innerText = '✓';
          if (net.connected) net.send({ type: 'award_quest_xp' });
          else awardXP(20, 'Stasis Broken');
          logMessage('[Quest] Limbs restored! Strike the Sanctuary Dummy with [1]!', 'log-quest');
        }

        // Step-into-portal seamless travel!
        if (portalCooldown <= 0) {
          const hitPortal = entities.find((e) => e.type === 'portal' && Math.hypot(e.x - player.x, e.y - player.y) <= 18);
          if (hitPortal) {
            enterPortalEntity(hitPortal);
          }
        }
      } else {
        player.isMoving = false;
      }
    } else {
      player.isMoving = false;
    }

    if (net.connected) {
      moveSyncAccum += dt;
      if (moveSyncAccum >= 0.05) {
        moveSyncAccum = 0;
        net.send({
          type: 'move',
          x: Math.round(player.x * 10) / 10,
          y: Math.round(player.y * 10) / 10,
          z: Math.round(player.z),
          dir: player.dir,
          isMoving: player.isMoving,
        });
      }
    }

    for (const rp of remotePlayers.values()) {
      rp.renderX += (rp.x - rp.renderX) * Math.min(1, 14 * dt);
      rp.renderY += (rp.y - rp.renderY) * Math.min(1, 14 * dt);
      if (rp.isMoving) rp.walkTimer = (rp.walkTimer || 0) + dt * 9.5;
    }

    camera.x += (player.x - camera.x) * Math.min(1, 10 * dt);
    camera.y += (player.y - camera.y) * Math.min(1, 10 * dt);

    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (!net.connected && e.freezeTimer > 0) {
        e.freezeTimer = Math.max(0, e.freezeTimer - dt);
        if (e.freezeTimer <= 0) e.frozen = false;
      }
      if (e.isDying) {
        e.deathAge = (e.deathAge || 0) + dt;
        e.y -= 18 * dt;
        if (currentTarget && currentTarget.id === e.id) {
          setTarget(null);
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
          groundZones.splice(i, 1);
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
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

    const onRim =
      wx === -mapBounds.halfW || wx === mapBounds.halfW - TILE_SIZE ||
      wy === -mapBounds.halfH || wy === mapBounds.halfH - TILE_SIZE;
    if (onRim) return sprites.tiles.flagstone_0;

    if (currentBiomeTheme === 'sanctuary') {
      if (Math.abs(tx) <= 1 || (ty >= -1 && ty <= 2 && Math.abs(tx) <= 6)) {
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

    if (['solari', 'umbri', 'terra', 'aether'].includes(currentBiomeTheme)) {
      if (Math.abs(tx) <= 1) return sprites.tiles[`flagstone_${Math.abs(ty) % 2}`];
      return sprites.tiles[`${currentBiomeTheme}_${Math.abs(tx * 11 + ty * 17) % 4}`] || sprites.tiles.warzone_0;
    }

    // Nexus Warzone crossroad + dark slate terrain
    if (Math.abs(tx) <= 1 || Math.abs(ty) <= 1) return sprites.tiles[`flagstone_${Math.abs(tx + ty) % 2}`];
    return sprites.tiles[`warzone_${Math.abs(tx * 11 + ty * 17) % 4}`];
  }

  function drawPixelEllipseShadow(cx, cy, rx, ry) {
    ctx.fillStyle = 'rgba(4, 6, 14, 0.55)';
    ctx.fillRect(Math.round(cx - rx), Math.round(cy - ry + 1), Math.round(rx * 2), Math.round(ry * 2 - 2));
    ctx.fillRect(Math.round(cx - rx + 2), Math.round(cy - ry), Math.round(rx * 2 - 4), Math.round(ry * 2));
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
          const img = pr.type === 'brazier'
            ? sprites.props.brazier[Math.floor(globalTime * 1.8 + Math.abs(pr.x)) % 2]
            : sprites.props.pillar;
          drawPixelEllipseShadow(sx, sy, 7, 3);
          ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 2);
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
          ctx.font = 'bold 5px "Silkscreen", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#05070f';
          ctx.fillText(`<${b.orderTag}>`, sx + 1, sy - img.height);
          ctx.fillStyle = b.color || '#fde047';
          ctx.fillText(`<${b.orderTag}>`, sx, sy - img.height - 1);
        },
      });
    }

    for (const npc of npcs) {
      renderables.push({
        y: npc.y,
        draw: () => {
          const sx = Math.round(npc.x - camLeft);
          const sy = Math.round(npc.y - camTop);
          const img = sprites.heraldNpc[Math.floor(globalTime * 2.2) % sprites.heraldNpc.length];
          drawPixelEllipseShadow(sx, sy, 9, 3);
          ctx.drawImage(img, Math.round(sx - img.width / 2), sy - img.height + 3);
          const bounce = Math.floor(Math.sin(globalTime * 3.5) * 1.5);
          const qy = sy - img.height - 9 + bounce;
          ctx.fillStyle = '#070a12';
          ctx.fillRect(sx - 2, qy - 1, 4, 9);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(sx - 1, qy, 2, 4);
          ctx.fillRect(sx - 1, qy + 6, 2, 2);
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
          } else if (ent.type === 'dummy') {
            img = sprites.dummy[ent.hitFlash > 0 ? 1 : 0];
          } else {
            const arr = sprites[ent.spriteKey] || sprites.voidStalker;
            img = arr[Math.floor(globalTime * (ent.type === 'portal' ? 1.8 : 3.5)) % arr.length];
          }
          if (!img) return;
          drawPixelEllipseShadow(sx, sy, Math.round(img.width * 0.36), 4);

          const shakeX = ent.hitFlash > 0 && ent.type !== 'dummy' ? 1 : 0;

          ctx.save();
          if (ent.isDying) {
            const sc = Math.max(0.1, 1 - (ent.deathAge || 0) / 0.65);
            ctx.globalAlpha = sc;
            ctx.translate(sx, sy - img.height / 2);
            ctx.scale(sc, sc);
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

          // Portal destination label
          if (ent.type === 'portal') {
            ctx.font = 'bold 5px "Silkscreen", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#05070f';
            ctx.fillText(ent.name, sx + 1, sy - img.height);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillText(ent.name, sx, sy - img.height - 1);
          } else if (!ent.isDying) {
            const val = ent.hp ?? ent.charges ?? 0;
            const max = ent.maxHp ?? ent.maxCharges ?? 1;
            const bw = ent.isBoss || ent.type === 'nexus' || ent.type === 'ally_nexus' || ent.type === 'outpost_nexus' ? 30 : 20;
            const bx = Math.round(sx - bw / 2);
            const by = Math.round(sy - img.height - 5);
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
      ctx.fillStyle = '#070a12';
      ctx.fillRect(sx - 1, sy - 1, pt.size + 2, pt.size + 2);
      ctx.fillStyle = pt.color;
      ctx.fillRect(sx, sy, pt.size, pt.size);
    }
  }

  function renderMinimap() {
    mmCtx.imageSmoothingEnabled = false;
    mmCtx.fillStyle = '#070b18';
    mmCtx.fillRect(0, 0, 128, 128);

    mmCtx.fillStyle = '#111c33';
    for (let g = 16; g < 128; g += 16) {
      mmCtx.fillRect(g, 0, 1, 128);
      mmCtx.fillRect(0, g, 128, 1);
    }

    const cx = 64;
    const cy = 64;
    const scale = 0.16;

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
      if (ex < 2 || ex > 124 || ey < 2 || ey > 124) continue;
      mmCtx.fillStyle =
        e.type === 'siege_shard' ? '#fde047' :
        e.type === 'outpost_nexus' ? (FACTIONS_META[e.faction]?.color || '#38bdf8') :
        e.type === 'ally_nexus' ? '#3b82f6' :
        e.type === 'node' ? '#c084fc' :
        e.type === 'portal' ? '#7dd3fc' :
        '#ef4444';
      const sz = e.isBoss || e.type === 'nexus' || e.type === 'outpost_nexus' || e.type === 'siege_shard' ? 6 : 4;
      mmCtx.fillRect(ex - (sz >> 1), ey - (sz >> 1), sz, sz);
    }

    for (const rp of remotePlayers.values()) {
      if (rp.isDead || (rp.stealthed && isRemoteHostile(rp))) continue;
      const rx = Math.round(cx + (rp.renderX - player.x) * scale);
      const ry = Math.round(cy + (rp.renderY - player.y) * scale);
      if (rx < 2 || rx > 124 || ry < 2 || ry > 124) continue;
      const inSquad = Boolean(currentParty && currentParty.members?.some((m) => m.id === rp.id));
      mmCtx.fillStyle = inSquad ? '#4ade80' : isRemoteHostile(rp) ? '#fb923c' : '#38bdf8';
      mmCtx.fillRect(rx - 2, ry - 2, 4, 4);
    }

    mmCtx.fillStyle = '#facc15';
    mmCtx.fillRect(cx - 2, cy - 2, 5, 5);
    mmCtx.fillStyle = '#ffffff';
    mmCtx.fillRect(cx - 1, cy - 1, 3, 3);
  }

  buildOfflineZone(ROOM_TYPES.SANCTUARY_HUB);
  refreshHeroPortrait();
  updatePlayerUI();
  updateActionBarBadges();
  renderKeybindUI();
  renderStatsModal();
  renderPartyHud(null, localProfile.id);

  // Open Character Select / Loadout Frontpage and connect to 20Hz Server + PostgreSQL!
  frontpage.open();
  net.bootstrapAndConnect(prog);

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
