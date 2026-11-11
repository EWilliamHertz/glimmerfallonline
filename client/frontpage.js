// ==========================================
// GlimmerFall Online 2D — Game Frontpage & Character Management
// Vanguard Character Selection & Strict State Machine (Select vs Create)
// 4 Canonical Factions • 8 Archetypes • Live Pedestal Visage Preview
// ==========================================

import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  getEquipmentStatBonuses,
  createDefaultProgression,
  validateCharacterName,
} from '../shared/protocol.js';
import { getCharacterSprites } from './sprites.js';
import { renderEquipmentModal } from './equipmentUi.js';

const SP_STORAGE_KEY = 'glimmerfall_sp_roster_v2';
const SP_ACTIVE_KEY = 'glimmerfall_sp_active_id';

export const FRONTPAGE_STATES = {
  CHARACTER_SELECT: 'CHARACTER_SELECT', // Default View: Vanguard Character Loadout & Pedestal
  CHARACTER_CREATE: 'CHARACTER_CREATE', // Distinct View: Champion Forge & Archetype Picker
};

export class FrontpageController {
  constructor({ net, audio, onEnterWorld }) {
    this.net = net;
    this.audio = audio;
    this.onEnterWorld = onEnterWorld;
    if (typeof window !== 'undefined') {
      window._fp = this;
    }

    this.isOpen = false;
    this.state = FRONTPAGE_STATES.CHARACTER_SELECT;

    this.previewAnimTimer = null;
    this.previewDirIdx = 0;
    this.previewFrame = 0;
    this._lastRenderSig = '';

    // Realm Mode: 'singleplayer' (zero lag / local) or 'multiplayer' (online authoritative)
    let savedMode = 'singleplayer';
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramMode = urlParams?.get('mode');
      if (paramMode === 'singleplayer' || paramMode === 'multiplayer') {
        savedMode = paramMode;
      } else {
        savedMode = localStorage.getItem('glimmerfall_play_mode') || 'singleplayer';
      }
      if (urlParams?.get('autostart') === '1') {
        window._pendingPlayOnBoot = true;
      }
    } catch (_) {}
    this.playMode = savedMode;

    // Selection State: Pointer to selected character (STRICTLY IMMUTABLE)
    this.selectedCharacterId = null;

    // Creation State Draft: Completely isolated, created only during CHARACTER_CREATE
    this.creationDraft = null;
    this.creationError = '';
    this.authMessage = '';
    this.renameMessage = '';
    this.renameError = '';

    // Remember Me & Saved Credentials
    try {
      const storedRemember = localStorage.getItem('glimmerfall_remember_me');
      this.rememberMe = storedRemember !== null ? storedRemember === 'true' : true;
      this.savedUsername = localStorage.getItem('glimmerfall_saved_username') || '';
      this.savedPassword = localStorage.getItem('glimmerfall_saved_password') || '';
    } catch (_) {
      this.rememberMe = true;
      this.savedUsername = '';
      this.savedPassword = '';
    }
    this.isAutoLoggingIn = false;

    // Initialize Single Player default roster if none exists
    this.ensureSinglePlayerDefaults();
  }

  toggleRememberMe(checked) {
    this.rememberMe = !!checked;
    try {
      localStorage.setItem('glimmerfall_remember_me', this.rememberMe ? 'true' : 'false');
      if (!this.rememberMe) {
        this.savedPassword = '';
        localStorage.removeItem('glimmerfall_saved_password');
      }
    } catch (_) {}
    if (this.isOpen) this.render();
  }

  async tryAutoLogin() {
    if (!this.rememberMe || !this.net) return false;
    if (this.net.profile && !this.net.profile.isGuest) {
      this.syncFromProfile(this.net.profile);
      return true;
    }
    if (this.isAutoLoggingIn) return false;
    this.isAutoLoggingIn = true;

    try {
      if (this.savedUsername && this.savedPassword) {
        let prof;
        // Authenticate cloud profile via REST API first without persistent WS overhead
        const data = await this.net.apiCall('/api/auth/login', 'POST', {
          username: this.savedUsername,
          password: this.savedPassword,
        });
        if (data?.token) this.net.saveStoredToken(data.token);
        if (data?.profile) {
          this.net.profile = data.profile;
          prof = data.profile;
        }
        if (prof && !prof.isGuest) {
          this.authMessage = `✓ Welcome back, @${prof.username}!`;
          this.syncFromProfile(prof);
          if (this.isOpen) this.render();
          return true;
        }
      } else if (this.net.token) {
        try {
          const data = await this.net.apiCall('/api/auth/me', 'GET');
          if (data?.profile && !data.profile.isGuest) {
            this.net.profile = data.profile;
            this.authMessage = `✓ Welcome back, @${data.profile.username}!`;
            this.syncFromProfile(data.profile);
            if (this.isOpen) this.render();
            return true;
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[Frontpage] Auto-login attempt failed:', err.message);
    } finally {
      this.isAutoLoggingIn = false;
    }
    return false;
  }

  ensureSinglePlayerDefaults() {
    try {
      const existing = this.getSinglePlayerRoster();
      if (!existing || existing.length === 0) {
        const starter = {
          id: 'sp_char_starter',
          name: 'Solari Vanguard',
          faction: 'Solari',
          classId: 'solari_vanguard',
          orderTag: 'SUN',
          equipment: { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment },
          loadout: { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout },
          inventory: [
            { id: 'ring_of_the_sun', qty: 1 },
            { id: 'boots_of_haste', qty: 1 },
            { id: 'vanguard_gauntlets', qty: 1 },
            { id: 'amulet_of_glory', qty: 1 },
          ],
          bank: [],
          progression: createDefaultProgression(),
          homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        };
        localStorage.setItem(SP_STORAGE_KEY, JSON.stringify([starter]));
        localStorage.setItem(SP_ACTIVE_KEY, starter.id);
        this.selectedCharacterId = starter.id;
      } else {
        const activeId = localStorage.getItem(SP_ACTIVE_KEY);
        const activeChar = existing.find((c) => c.id === activeId) || existing[0];
        if (activeChar) {
          this.selectedCharacterId = activeChar.id;
        }
      }
    } catch (_) {}
  }

  getSinglePlayerRoster() {
    try {
      const raw = localStorage.getItem(SP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveSinglePlayerRoster(list) {
    try {
      localStorage.setItem(SP_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  getActiveRoster() {
    if (this.playMode === 'singleplayer') {
      return this.getSinglePlayerRoster();
    }
    const mpChars = this.net?.profile?.characters;
    if (Array.isArray(mpChars) && mpChars.length > 0) {
      return mpChars;
    }
    // Fallback: If multiplayer profile is loaded or has an active character/profile, synthesize entry so buttons are NEVER disabled
    if (this.net?.profile) {
      const p = this.net.profile;
      return [{
        id: p.activeCharacterId || p.id || 'mp_char_default',
        name: p.displayName || p.username || 'Realm Champion',
        faction: p.faction || 'Solari',
        classId: p.classId || 'solari_vanguard',
        orderTag: p.orderTag || 'SUN',
        equipment: p.equipment || {},
        loadout: p.loadout || {},
        inventory: p.inventory || [],
        bank: p.bank || [],
        progression: p.progression || createDefaultProgression(),
        homeBiome: ROOM_TYPES.SANCTUARY_HUB,
      }];
    }
    // If still connecting, use cached local profile as placeholder so user is NEVER blocked with pointer-events:none
    if (typeof window !== 'undefined' && window.localProfile) {
      const lp = window.localProfile;
      return [{
        id: lp.id || 'mp_char_cached',
        name: lp.displayName || 'Champion',
        faction: lp.faction || 'Solari',
        classId: lp.classId || 'solari_vanguard',
        orderTag: lp.orderTag || 'SUN',
        equipment: lp.equipment || {},
        loadout: lp.loadout || {},
        inventory: lp.inventory || [],
        bank: lp.bank || [],
        progression: createDefaultProgression(),
        homeBiome: ROOM_TYPES.SANCTUARY_HUB,
      }];
    }
    // Fallback: Check cached network profile
    const cachedProfile = this.net?.loadCachedProfile?.();
    if (cachedProfile) {
      const cChars = cachedProfile.characters;
      if (Array.isArray(cChars) && cChars.length > 0) return cChars;
      return [{
        id: cachedProfile.activeCharacterId || cachedProfile.id || 'mp_char_cached',
        name: cachedProfile.displayName || cachedProfile.username || 'Realm Champion',
        faction: cachedProfile.faction || 'Solari',
        classId: cachedProfile.classId || 'solari_vanguard',
        orderTag: cachedProfile.orderTag || 'SUN',
        equipment: cachedProfile.equipment || {},
        loadout: cachedProfile.loadout || {},
        inventory: cachedProfile.inventory || [],
        bank: cachedProfile.bank || [],
        progression: cachedProfile.progression || createDefaultProgression(),
        homeBiome: ROOM_TYPES.SANCTUARY_HUB,
      }];
    }
    // Fallback to offline singleplayer roster so buttons are ALWAYS clickable
    const spFallback = this.getSinglePlayerRoster();
    if (Array.isArray(spFallback) && spFallback.length > 0) {
      return spFallback;
    }
    return [{
      id: 'sp_char_starter',
      name: 'Solari Vanguard',
      faction: 'Solari',
      classId: 'solari_vanguard',
      orderTag: 'SUN',
      equipment: { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment },
      loadout: { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout },
      inventory: [],
      bank: [],
      progression: createDefaultProgression(),
      homeBiome: ROOM_TYPES.SANCTUARY_HUB,
    }];
  }

  getSelectedCharacter() {
    const roster = this.getActiveRoster();
    if (!roster || roster.length === 0) return null;
    return roster.find((c) => c.id === this.selectedCharacterId) || roster[0] || null;
  }

  // ==========================================
  // State Machine Transitions
  // ==========================================
  beginCharacterCreation() {
    let seen = false;
    try {
      seen = localStorage.getItem('glimmerfall_seen_prologue') === 'true';
    } catch (_) {}

    if (!seen && typeof window !== 'undefined' && typeof window.playPrologueCinematic === 'function') {
      window.playPrologueCinematic({
        isReplay: false,
        onComplete: () => {
          this.transitionTo(FRONTPAGE_STATES.CHARACTER_CREATE);
        },
      });
      return;
    }

    this.transitionTo(FRONTPAGE_STATES.CHARACTER_CREATE);
  }

  playPrologueCinematic(isReplay = false) {
    if (typeof window !== 'undefined' && typeof window.playPrologueCinematic === 'function') {
      window.playPrologueCinematic({
        isReplay: Boolean(isReplay),
        onComplete: () => {
          if (!isReplay) {
            this.transitionTo(FRONTPAGE_STATES.CHARACTER_CREATE);
          } else if (this.isOpen) {
            this.render();
          }
        },
      });
    } else {
      try {
        localStorage.setItem('glimmerfall_seen_prologue', 'true');
      } catch (_) {}
      if (!isReplay) {
        this.transitionTo(FRONTPAGE_STATES.CHARACTER_CREATE);
      }
    }
  }

  transitionTo(newState, initialDraft = {}) {
    if (!Object.values(FRONTPAGE_STATES).includes(newState)) return;
    this.state = newState;
    this.creationError = '';
    this.authMessage = '';

    if (newState === FRONTPAGE_STATES.CHARACTER_CREATE) {
      // Build fresh, unattached draft object - DOES NOT bind to any existing character
      const defaultFaction = initialDraft.faction && FACTIONS_META[initialDraft.faction] ? initialDraft.faction : 'Solari';
      const firstCls = Object.values(CLASSES_CATALOG).find((c) => c.faction === defaultFaction) || CLASSES_CATALOG.solari_vanguard;
      const defaultTags = { Solari: 'SUN', Umbri: 'VOID', Terra: 'ROOT', Aether: 'AETH' };
      this.creationDraft = {
        name: initialDraft.name || '',
        faction: defaultFaction,
        classId: initialDraft.classId || firstCls.id,
        orderTag: initialDraft.orderTag || defaultTags[defaultFaction] || 'SUN',
        startingRealm: initialDraft.startingRealm || ROOM_TYPES.SANCTUARY_HUB,
      };
      if (this.audio?.playChime) this.audio.playChime();
    } else {
      // Return to selection - discard any temporary draft
      this.creationDraft = null;
      if (this.audio?.playChime) this.audio.playChime();
    }

    if (this.isOpen) this.render();
  }

  setPlayMode(mode) {
    this.playMode = mode === 'multiplayer' ? 'multiplayer' : 'singleplayer';
    try {
      localStorage.setItem('glimmerfall_play_mode', this.playMode);
    } catch (_) {}

    if (this.audio?.playChime) this.audio.playChime();

    // In Single Player, ensure network is disconnected so zero server lag occurs
    if (this.playMode === 'singleplayer') {
      if (this.net?.disconnect) this.net.disconnect();
      const spChars = this.getSinglePlayerRoster();
      const activeId = localStorage.getItem(SP_ACTIVE_KEY);
      const active = spChars.find((c) => c.id === activeId) || spChars[0];
      if (active) this.selectedCharacterId = active.id;
    } else {
      // Connect to multiplayer server to load cloud characters
      if (this.net && !this.net.connected) {
        this.net.bootstrapAndConnect().then((prof) => {
          if (prof) this.syncFromProfile(prof);
        }).catch(() => {});
      }
      const mpChars = this.net?.profile?.characters || [];
      const active = mpChars.find((c) => c.id === this.net?.profile?.activeCharacterId) || mpChars[0];
      if (active) this.selectedCharacterId = active.id;
    }

    if (this.isOpen) this.render();
  }

  buildRenderSignature(profile = null) {
    try {
      const p = profile || this.net?.profile || {};
      const chars = this.playMode === 'singleplayer'
        ? this.getSinglePlayerRoster()
        : (Array.isArray(p.characters) && p.characters.length > 0 ? p.characters : this.getActiveRoster());
      const charSummary = (chars || [])
        .map((c) => `${c.id}:${c.name || ''}:${c.faction || ''}:${c.classId || ''}:${c.progression?.level || c.level || 1}:${JSON.stringify(c.equipment || {})}`)
        .join('|');
      return [
        this.playMode,
        this.state,
        this.selectedCharacterId || '',
        p.isGuest === false ? 'auth' : 'guest',
        p.username || '',
        p.activeCharacterId || '',
        this.authMessage || '',
        this.renameMessage || '',
        this.renameError || '',
        this.creationError || '',
        this.rememberMe ? '1' : '0',
        this.creationDraft ? JSON.stringify(this.creationDraft) : '',
        charSummary,
      ].join('::');
    } catch (_) {
      return `${this.playMode}::${this.state}::${Date.now()}`;
    }
  }

  syncFromProfile(profile) {
    if (!profile) return;
    if (this.playMode === 'multiplayer') {
      const chars = profile.characters || [];
      const stillValid = this.selectedCharacterId && chars.some((c) => c.id === this.selectedCharacterId);
      if (!stillValid) {
        const active = chars.find((c) => c.id === profile.activeCharacterId) || chars[0];
        if (active) {
          this.selectedCharacterId = active.id;
        }
      }
      if (!this.isOpen) return;
      // Never blow away DOM while the user is actively typing in a frontpage input
      const root = document.getElementById('frontpage-body');
      const activeEl = document.activeElement;
      if (root && activeEl && root.contains(activeEl) && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      const nextSig = this.buildRenderSignature(profile);
      if (nextSig === this._lastRenderSig) return;
      this.render();
    }
  }

  // ==========================================
  // Character Selection (Strictly Read-Only)
  // ==========================================
  selectCharacter(charId) {
    if (!charId) return;
    this.selectedCharacterId = charId;
    this.renameMessage = '';
    this.renameError = '';
    if (this.playMode === 'singleplayer') {
      try {
        localStorage.setItem(SP_ACTIVE_KEY, charId);
      } catch (_) {}
    } else {
      try {
        localStorage.setItem('glimmerfall_active_char_id', charId);
      } catch (_) {}
      if (this.net) {
        this.net.preferredCharacterId = charId;
        this.net.selectedCharacterId = charId;
        if (this.net.profile) {
          this.net.profile.activeCharacterId = charId;
        }
      }
    }
    if (this.audio?.playChime) this.audio.playChime();
    if (this.isOpen) this.render();
  }

  async renameSelectedCharacter() {
    this.renameError = 'Champion names are permanent once registered.';
    this.render();
  }

  async playSelectedCharacter() {
    const chosenChar = this.getSelectedCharacter();
    if (!chosenChar) {
      // If no character exists on this realm, begin character creation (with prologue check)
      this.beginCharacterCreation();
      return;
    }

    if (this.audio?.init) this.audio.init();
    if (this.audio?.playPortal) this.audio.playPortal();

    // === SINGLE PLAYER (OFFLINE / 0ms) ===
    if (this.playMode === 'singleplayer') {
      const spRoster = this.getSinglePlayerRoster();
      const activeChar = spRoster.find((c) => c.id === chosenChar.id) || chosenChar;
      try {
        localStorage.setItem(SP_ACTIVE_KEY, activeChar.id);
      } catch (_) {}

      const lastPos = activeChar.lastPosition;
      const startRealm = (lastPos?.roomType && lastPos.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[lastPos.roomType])
        ? lastPos.roomType
        : (activeChar.homeBiome || ROOM_TYPES.SANCTUARY_HUB);
      const startX = typeof lastPos?.x === 'number' && Number.isFinite(lastPos.x) ? lastPos.x : 0;
      const startY = typeof lastPos?.y === 'number' && Number.isFinite(lastPos.y) ? lastPos.y : 96;

      // Strictly read-only copy passed to world runner without mutating existing character
      const singlePlayerProfile = {
        id: activeChar.id,
        displayName: activeChar.name,
        faction: activeChar.faction,
        classId: activeChar.classId,
        orderTag: activeChar.orderTag || 'SUN',
        orderName: `Order of ${activeChar.faction}`,
        loadout: activeChar.loadout,
        equipment: activeChar.equipment,
        inventory: activeChar.inventory || [],
        bank: activeChar.bank || [],
        progression: activeChar.progression || createDefaultProgression(),
        questState: activeChar.questState || null,
        hp: typeof activeChar.hp === 'number' ? activeChar.hp : null,
        solarCharge: typeof activeChar.solarCharge === 'number' ? activeChar.solarCharge : null,
        lastPosition: lastPos || null,
        characters: spRoster,
        activeCharacterId: activeChar.id,
        isGuest: true,
      };

      this.close();
      if (this.onEnterWorld) {
        this.onEnterWorld({
          profile: singlePlayerProfile,
          startingRealm: startRealm,
          playMode: 'singleplayer',
          startX,
          startY,
        });
      }
      return;
    }

    // === MULTIPLAYER (ONLINE REALM) ===
    const lastPos = chosenChar.lastPosition;
    const startRealm = (lastPos?.roomType && lastPos.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[lastPos.roomType])
      ? lastPos.roomType
      : (chosenChar.homeBiome || ROOM_TYPES.SANCTUARY_HUB);
    const startX = typeof lastPos?.x === 'number' && Number.isFinite(lastPos.x) ? lastPos.x : null;
    const startY = typeof lastPos?.y === 'number' && Number.isFinite(lastPos.y) ? lastPos.y : null;

    try {
      localStorage.setItem('glimmerfall_active_char_id', chosenChar.id);
    } catch (_) {}
    if (this.net) {
      this.net.preferredCharacterId = chosenChar.id;
      this.net.selectedCharacterId = chosenChar.id;
    }

    let targetProfile = {
      ...(this.net?.profile || {}),
      id: chosenChar.id,
      displayName: chosenChar.name,
      faction: chosenChar.faction,
      classId: chosenChar.classId,
      orderTag: chosenChar.orderTag || 'SUN',
      orderName: chosenChar.orderName || `Order of ${chosenChar.faction}`,
      orderColor: chosenChar.orderColor || '#facc15',
      loadout: chosenChar.loadout || CLASSES_CATALOG[chosenChar.classId]?.defaultLoadout || {},
      equipment: chosenChar.equipment || CLASSES_CATALOG[chosenChar.classId]?.defaultEquipment || {},
      inventory: chosenChar.inventory || [],
      bank: chosenChar.bank || [],
      progression: chosenChar.progression || createDefaultProgression(),
      questState: chosenChar.questState || null,
      activeCharacterId: chosenChar.id,
      hp: typeof chosenChar.hp === 'number' ? chosenChar.hp : null,
      solarCharge: typeof chosenChar.solarCharge === 'number' ? chosenChar.solarCharge : null,
      lastPosition: lastPos || null,
      characters: this.getActiveRoster(),
      isGuest: Boolean(this.net?.profile?.isGuest),
    };

    if (this.net?.profile) {
      this.net.profile = {
        ...this.net.profile,
        ...targetProfile,
      };
    }

    if (this.net?.connected) {
      try {
        const res = await this.net.wsRpc('save_character', {
          characterId: chosenChar.id,
          enterRealm: startRealm,
          x: startX,
          y: startY,
        }, 2500);
        if (res?.ok && res?.profile) {
          this.net.profile = res.profile;
          targetProfile = res.profile;
          if (typeof window !== 'undefined' && typeof window.applyProfile === 'function') {
            window.applyProfile(res.profile);
          }
        }
      } catch (err) {
        console.warn('[Frontpage] wsRpc character selection warning:', err?.message || err);
      }
    } else {
      this.net?.saveOrSelectCharacter({
        characterId: chosenChar.id,
        enterRealm: startRealm,
        x: startX,
        y: startY,
      }).catch(() => {});
      this.net?.connectWebSocket();
    }

    // Immediately close overlay and transition into realm - never trap the user
    this.close();
    if (this.onEnterWorld) {
      this.onEnterWorld({
        profile: targetProfile,
        startingRealm: startRealm,
        playMode: 'multiplayer',
        startX,
        startY,
      });
    }
  }

  // ==========================================
  // Character Creation (Strictly Isolated Draft)
  // ==========================================
  setCreationFaction(facId) {
    if (this.state !== FRONTPAGE_STATES.CHARACTER_CREATE || !this.creationDraft) return;
    if (!FACTIONS_META[facId]) return;
    this.creationDraft.faction = facId;
    const firstCls = Object.values(CLASSES_CATALOG).find((c) => c.faction === facId) || CLASSES_CATALOG.solari_vanguard;
    this.creationDraft.classId = firstCls.id;
    const defaultTags = { Solari: 'SUN', Umbri: 'VOID', Terra: 'ROOT', Aether: 'AETH' };
    this.creationDraft.orderTag = defaultTags[facId] || 'SUN';
    if (this.audio?.playChime) this.audio.playChime();
    this.render();
  }

  setCreationClass(classId) {
    if (this.state !== FRONTPAGE_STATES.CHARACTER_CREATE || !this.creationDraft) return;
    const cls = CLASSES_CATALOG[classId];
    if (!cls) return;
    this.creationDraft.classId = cls.id;
    this.creationDraft.faction = cls.faction;
    if (this.audio?.playChime) this.audio.playChime();
    this.render();
  }

  setCreationName(val) {
    if (!this.creationDraft) return;
    this.creationDraft.name = String(val || '').slice(0, 18);
  }

  setCreationOrderTag(val) {
    if (!this.creationDraft) return;
    this.creationDraft.orderTag = String(val || '').slice(0, 5).toUpperCase();
  }

  setCreationStartingRealm(val) {
    if (!this.creationDraft) return;
    this.creationDraft.startingRealm = val;
  }

  async createCharacter({ name, faction, classId, orderTag, startingRealm = ROOM_TYPES.SANCTUARY_HUB }) {
    const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
    let charName = (name || '').trim();
    if (!charName) {
      const suffix = Math.floor(100 + Math.random() * 899);
      charName = `${cls.name.replace(/\s+/g, '_')}_${suffix}`;
    }

    const vRes = validateCharacterName(charName);
    if (!vRes.valid) {
      this.creationError = `⚠️ ${vRes.error}`;
      if (this.isOpen) this.render();
      return null;
    }
    charName = vRes.cleanName;

    const tag = (orderTag || 'SUN').trim().toUpperCase() || 'SUN';
    const realm = startingRealm || ROOM_TYPES.SANCTUARY_HUB;

    if (this.audio?.init) this.audio.init();
    if (this.audio?.playPortal) this.audio.playPortal();

    // === SINGLE PLAYER (OFFLINE / 0ms) ===
    if (this.playMode === 'singleplayer') {
      const spRoster = this.getSinglePlayerRoster();
      let activeChar = spRoster.find((c) => c.name.toLowerCase() === charName.toLowerCase());
      if (activeChar) {
        activeChar.faction = faction || activeChar.faction;
        activeChar.classId = cls.id;
        activeChar.orderTag = tag;
        activeChar.loadout = { ...cls.defaultLoadout, ...(activeChar.loadout || {}) };
        activeChar.equipment = { ...cls.defaultEquipment, ...(activeChar.equipment || {}) };
      } else {
        if (spRoster.length >= 8) {
          this.creationError = 'Roster limit reached (8 max). Delete an existing champion first.';
          if (this.isOpen) this.render();
          return null;
        }
        activeChar = {
          id: `sp_char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: charName,
          faction: faction || 'Solari',
          classId: cls.id,
          orderTag: tag,
          equipment: { ...cls.defaultEquipment },
          loadout: { ...cls.defaultLoadout },
          inventory: [
            { id: 'ring_of_the_sun', qty: 1 },
            { id: 'boots_of_haste', qty: 1 },
            { id: 'vanguard_gauntlets', qty: 1 },
            { id: 'amulet_of_glory', qty: 1 },
          ],
          bank: [],
          progression: createDefaultProgression(),
          homeBiome: realm,
          lastPosition: { roomType: realm, x: 0, y: 96 },
        };
        spRoster.unshift(activeChar);
      }
      this.saveSinglePlayerRoster(spRoster);
      try {
        localStorage.setItem(SP_ACTIVE_KEY, activeChar.id);
      } catch (_) {}

      this.selectedCharacterId = activeChar.id;
      this.creationDraft = null;
      this.state = FRONTPAGE_STATES.CHARACTER_SELECT;

      this.close();
      if (typeof window !== 'undefined' && window._landing) {
        window._landing.close();
      }

      const enterSinglePlayer = () => {
        if (this.onEnterWorld) {
          this.onEnterWorld({
            profile: {
              id: activeChar.id,
              displayName: activeChar.name,
              faction: activeChar.faction,
              classId: activeChar.classId,
              orderTag: activeChar.orderTag,
              orderName: `Order of ${activeChar.faction}`,
              loadout: activeChar.loadout,
              equipment: activeChar.equipment,
              inventory: activeChar.inventory || [],
              bank: activeChar.bank || [],
              progression: activeChar.progression || createDefaultProgression(),
              questState: activeChar.questState || null,
              hp: typeof activeChar.hp === 'number' ? activeChar.hp : null,
              solarCharge: typeof activeChar.solarCharge === 'number' ? activeChar.solarCharge : null,
              lastPosition: activeChar.lastPosition || null,
              characters: spRoster,
              activeCharacterId: activeChar.id,
              isGuest: true,
            },
            startingRealm: realm,
            playMode: 'singleplayer',
            startX: activeChar.lastPosition?.x ?? 0,
            startY: activeChar.lastPosition?.y ?? 96,
          });
        }
      };

      const seenAwakeningKey = `glimmerfall_seen_awakening_${cls.id}`;
      let seenAwakening = false;
      try {
        seenAwakening = localStorage.getItem(seenAwakeningKey) === 'true';
      } catch (_) {}

      if (!seenAwakening && typeof window !== 'undefined' && typeof window.playClassAwakening === 'function') {
        try { localStorage.setItem(seenAwakeningKey, 'true'); } catch (_) {}
        window.playClassAwakening(cls.id, () => {
          enterSinglePlayer();
        });
      } else {
        enterSinglePlayer();
      }

      return activeChar;
    }

    // === MULTIPLAYER (ONLINE REALM) ===
    this.creationError = '⏳ Forging champion on realm...';
    if (this.isOpen) this.render();
    try {
      let res = null;
      if (this.net?.connected) {
        res = await this.net.wsRpc('save_character', {
          name: charName,
          faction: faction || 'Solari',
          classId: cls.id,
          orderTag: tag,
          loadout: cls.defaultLoadout,
          equipment: cls.defaultEquipment,
          homeBiome: realm,
          enterRealm: realm,
        }, 4000).catch(() => null);
      }

      if (!res && this.net?.saveOrSelectCharacter) {
        res = await this.net.saveOrSelectCharacter({
          name: charName,
          faction: faction || 'Solari',
          classId: cls.id,
          orderTag: tag,
          loadout: cls.defaultLoadout,
          equipment: cls.defaultEquipment,
          homeBiome: realm,
          enterRealm: realm,
        }).catch(() => null);
      }

      if (res?.character?.id) {
        this.selectedCharacterId = res.character.id;
      }
      this.creationDraft = null;
      this.state = FRONTPAGE_STATES.CHARACTER_SELECT;

      this.close();
      if (typeof window !== 'undefined' && window._landing) {
        window._landing.close();
      }

      const prof = (res && res.ok && res.profile) ? res.profile : {
        id: res?.character?.id || `mp_${Date.now()}`,
        displayName: charName,
        faction: faction || 'Solari',
        classId: cls.id,
        orderTag: tag,
        orderName: `Order of ${faction || 'Solari'}`,
        orderColor: '#facc15',
        loadout: cls.defaultLoadout,
        equipment: cls.defaultEquipment,
        inventory: [],
        bank: [],
        progression: createDefaultProgression(),
        activeCharacterId: res?.character?.id || `mp_${Date.now()}`,
        characters: this.getActiveRoster(),
      };

      const enterMultiplayer = () => {
        if (this.onEnterWorld) {
          this.onEnterWorld({
            profile: prof,
            startingRealm: realm,
            playMode: 'multiplayer',
            startX: 0,
            startY: 96,
          });
        }
      };

      const seenAwakeningKey = `glimmerfall_seen_awakening_${cls.id}`;
      let seenAwakening = false;
      try {
        seenAwakening = localStorage.getItem(seenAwakeningKey) === 'true';
      } catch (_) {}

      if (!seenAwakening && typeof window !== 'undefined' && typeof window.playClassAwakening === 'function') {
        try { localStorage.setItem(seenAwakeningKey, 'true'); } catch (_) {}
        window.playClassAwakening(cls.id, () => {
          enterMultiplayer();
        });
      } else {
        enterMultiplayer();
      }

      return res || prof;
    } catch (err) {
      this.creationError = `⚠️ Failed to create character: ${err.message}`;
      if (this.isOpen) this.render();
      throw err;
    }
  }

  async submitNewCharacter() {
    if (this.state !== FRONTPAGE_STATES.CHARACTER_CREATE || !this.creationDraft) return;
    const draft = this.creationDraft;
    return this.createCharacter({
      name: draft.name,
      faction: draft.faction,
      classId: draft.classId,
      orderTag: draft.orderTag,
      startingRealm: draft.startingRealm,
    });
  }

  // ==========================================
  // Quick Auth & Account Helpers
  // ==========================================
  async handleQuickAuth(mode) {
    const u = document.getElementById('fp-auth-user')?.value?.trim();
    const p = document.getElementById('fp-auth-pass')?.value || '';
    const remCb = document.getElementById('fp-remember-me');
    if (remCb) {
      this.rememberMe = remCb.checked;
      try {
        localStorage.setItem('glimmerfall_remember_me', this.rememberMe ? 'true' : 'false');
      } catch (_) {}
    }
    if (!u || !p) {
      this.authMessage = '⚠️ Enter Username & Password first.';
      this.render();
      return;
    }
    this.authMessage = mode === 'login' ? '⏳ Authenticating with realm...' : '⏳ Registering account on realm...';
    this.render();
    try {
      const selected = this.getSelectedCharacter();
      const targetFaction = this.creationDraft?.faction || selected?.faction || 'Solari';
      const targetClassId = this.creationDraft?.classId || selected?.classId || (targetFaction === 'Umbri' ? 'umbral_assassin' : targetFaction === 'Terra' ? 'forest_warden' : targetFaction === 'Aether' ? 'chronomancer_sage' : 'solari_vanguard');
      const targetTag = this.creationDraft?.orderTag || selected?.orderTag || (targetFaction === 'Umbri' ? 'VOID' : targetFaction === 'Terra' ? 'ROOT' : targetFaction === 'Aether' ? 'AETH' : 'SUN');
      const prof = mode === 'login'
        ? await this.net.login({ username: u, password: p })
        : await this.net.register({
            username: u,
            password: p,
            displayName: u,
            faction: targetFaction,
            classId: targetClassId,
            orderTag: targetTag,
          });

      if (this.rememberMe) {
        this.savedUsername = u;
        this.savedPassword = p;
        try {
          localStorage.setItem('glimmerfall_saved_username', u);
          localStorage.setItem('glimmerfall_saved_password', p);
        } catch (_) {}
      } else {
        this.savedUsername = '';
        this.savedPassword = '';
        try {
          localStorage.removeItem('glimmerfall_saved_username');
          localStorage.removeItem('glimmerfall_saved_password');
        } catch (_) {}
      }

      this.authMessage = `✓ Signed in as @${prof.username}!`;
      this.syncFromProfile(prof);
    } catch (err) {
      this.authMessage = `⚠️ ${err.message}`;
      this.render();
    }
  }

  handleLogout() {
    if (this.net?.logout) this.net.logout();
    if (typeof window !== 'undefined' && window.resetSessionState) {
      window.resetSessionState();
    }
    this.savedPassword = '';
    try {
      localStorage.removeItem('glimmerfall_saved_password');
      if (!this.rememberMe) {
        this.savedUsername = '';
        localStorage.removeItem('glimmerfall_saved_username');
      }
    } catch (_) {}
    this.authMessage = 'Logged out. Guest session active.';
    this.selectedCharacterId = null;
    this.render();
  }

  async removeRosterChar(charId) {
    if (!confirm('Are you sure you want to permanently delete this champion?')) return;

    if (this.playMode === 'singleplayer') {
      let spRoster = this.getSinglePlayerRoster().filter((c) => c.id !== charId);
      if (spRoster.length === 0) {
        this.saveSinglePlayerRoster([]);
        this.ensureSinglePlayerDefaults();
        this.render();
        return;
      }
      this.saveSinglePlayerRoster(spRoster);
      if (this.selectedCharacterId === charId) {
        this.selectedCharacterId = spRoster[0].id;
        try {
          localStorage.setItem(SP_ACTIVE_KEY, this.selectedCharacterId);
        } catch (_) {}
      }
      this.render();
      return;
    }

    try {
      const prof = await this.net.deleteCharacter(charId);
      this.syncFromProfile(prof);
    } catch (err) {
      this.authMessage = `⚠️ ${err.message}`;
      this.render();
    }
  }

  getStartOnSite() {
    try {
      return localStorage.getItem('glimmerfall_start_on_loadout') === 'true';
    } catch (_) {
      return false;
    }
  }

  setStartOnSite(checked) {
    try {
      localStorage.setItem('glimmerfall_start_on_loadout', checked ? 'true' : 'false');
    } catch (_) {}
    if (window._landing) {
      window._landing.setStartOnLoadout(checked);
    }
    const cbs = document.querySelectorAll('.start-on-site-cb');
    cbs.forEach((cb) => { cb.checked = checked; });
  }

  // ==========================================
  // Window Visibility & Preview Loop
  // ==========================================
  open() {
    this.isOpen = true;
    if (this.audio && typeof this.audio.setBgmTheme === 'function') {
      this.audio.setBgmTheme('title');
    }
    if (typeof window !== 'undefined' && window._landing && window._landing.isOpen) {
      window._landing.close();
    }
    this.state = FRONTPAGE_STATES.CHARACTER_SELECT;
    this.creationDraft = null;
    const el = document.getElementById('frontpage-overlay');
    if (el) el.style.display = 'flex';
    try {
      this.render();
    } catch (err) {
      console.error('[Frontpage] Error during render:', err);
    }
    this.startPreviewLoop();
    if (this.rememberMe && (!this.net?.profile || this.net.profile.isGuest)) {
      this.tryAutoLogin();
    }
  }

  close() {
    this.isOpen = false;
    const el = document.getElementById('frontpage-overlay');
    if (el) el.style.display = 'none';
    clearInterval(this.previewAnimTimer);
    this.previewAnimTimer = null;
  }

  startPreviewLoop() {
    clearInterval(this.previewAnimTimer);
    this.previewAnimTimer = setInterval(() => {
      if (!this.isOpen) return;
      this.previewFrame = (this.previewFrame + 1) % 12;
      // Heroic stance: facing camera (down) in neutral stance (frame 0) matching in-game idle
      this.drawPaperdollPreviewCanvas('fp-paperdoll-canvas', 'down', 0);
    }, 500);
  }

  drawPaperdollPreviewCanvas(canvasId, dir = 'down', frameIdx = 0) {
    try {
      if (typeof document === 'undefined') return;
      const cv = document.getElementById(canvasId);
      if (!cv || typeof cv.getContext !== 'function') return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      // Dark radial sanctuary pedestal background
      ctx.fillStyle = '#070c1a';
      ctx.fillRect(0, 0, cv.width, cv.height);

      let targetFaction = 'Solari';
      let targetClassId = 'solari_vanguard';
      let targetEquipment = CLASSES_CATALOG.solari_vanguard.defaultEquipment;

      if (this.state === FRONTPAGE_STATES.CHARACTER_CREATE && this.creationDraft) {
        targetFaction = this.creationDraft.faction;
        targetClassId = this.creationDraft.classId;
        targetEquipment = CLASSES_CATALOG[targetClassId]?.defaultEquipment || targetEquipment;
      } else {
        const ch = this.getSelectedCharacter();
        if (ch) {
          targetFaction = ch.faction || 'Solari';
          targetClassId = ch.classId || 'solari_vanguard';
          targetEquipment = ch.equipment || CLASSES_CATALOG[targetClassId]?.defaultEquipment || targetEquipment;
        }
      }

      const fm = FACTIONS_META[targetFaction] || FACTIONS_META.Solari;
      const cx = Math.floor(cv.width / 2);
      const cy = 92;

      // 1. Authentic stone pedestal dais with faction glow ring
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 36, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = fm.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 36, 11, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner rune ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 28, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. In-game character shadow
      ctx.fillStyle = 'rgba(4, 6, 14, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Exact in-game character sprite (down/front-facing, integer 3x scale)
      const set = getCharacterSprites(targetFaction, targetClassId, targetEquipment);
      if (!set) return;
      const dirFrames = set[dir] || set.down;
      if (!dirFrames || !dirFrames.length) return;
      const img = dirFrames[frameIdx % dirFrames.length];
      if (!img) return;

      const scale = 3;
      const dw = (img.width || 26) * scale;
      const dh = (img.height || 28) * scale;
      const dx = Math.round(cx - dw / 2);
      const dy = Math.round(cy - dh + 3);

      ctx.drawImage(img, dx, dy, dw, dh);
    } catch (err) {
      console.warn('[Frontpage] Paperdoll preview draw warning:', err);
    }
  }

  drawRosterAvatars() {
    try {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
      const roster = this.getActiveRoster();
      const canvases = document.querySelectorAll('.fp-roster-avatar-cv');
      canvases.forEach((cv) => {
        const charId = cv.getAttribute('data-char-id');
        const ch = roster.find((c) => c.id === charId);
        if (!ch) return;
        const ctx = cv.getContext ? cv.getContext('2d') : null;
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#080e1c';
        ctx.fillRect(0, 0, cv.width, cv.height);

        // Ground shadow
        ctx.fillStyle = 'rgba(4, 6, 14, 0.65)';
        ctx.beginPath();
        ctx.ellipse(17, 28, 11, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        const set = getCharacterSprites(ch.faction || 'Solari', ch.classId || 'solari_vanguard', ch.equipment || {});
        if (set && set.down && set.down[0]) {
          const spr = set.down[0];
          const dx = Math.round((cv.width - spr.width) / 2);
          const dy = Math.round(cv.height - spr.height - 2);
          ctx.drawImage(spr, dx, dy);
        }
      });
    } catch (err) {
      console.warn('[Frontpage] Roster avatar draw error:', err);
    }
  }

  drawClassAvatars() {
    try {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
      const canvases = document.querySelectorAll('.fp-class-avatar-cv');
      canvases.forEach((cv) => {
        const classId = cv.getAttribute('data-class-id');
        const faction = cv.getAttribute('data-faction') || 'Solari';
        const cls = CLASSES_CATALOG[classId];
        const ctx = cv.getContext ? cv.getContext('2d') : null;
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#080e1c';
        ctx.fillRect(0, 0, cv.width, cv.height);

        // Ground shadow
        ctx.fillStyle = 'rgba(4, 6, 14, 0.65)';
        ctx.beginPath();
        ctx.ellipse(17, 28, 11, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        const set = getCharacterSprites(faction, classId, cls?.defaultEquipment || {});
        if (set && set.down && set.down[0]) {
          const spr = set.down[0];
          const dx = Math.round((cv.width - spr.width) / 2);
          const dy = Math.round(cv.height - spr.height - 2);
          ctx.drawImage(spr, dx, dy);
        }
      });
    } catch (err) {
      console.warn('[Frontpage] Class avatar draw error:', err);
    }
  }

  // ==========================================
  // Render Router
  // ==========================================
  render() {
    const root = document.getElementById('frontpage-body');
    if (!root) return;

    if (this.state === FRONTPAGE_STATES.CHARACTER_CREATE) {
      root.innerHTML = this.renderCreationView();
      this.drawClassAvatars();
    } else {
      root.innerHTML = this.renderSelectionView();
      this.drawRosterAvatars();
    }

    this._lastRenderSig = this.buildRenderSignature();

    this.drawPaperdollPreviewCanvas('fp-paperdoll-canvas', 'down', 0);
  }

  // ==========================================
  // VIEW 1: Character Selection State (Default View - Vanguard Loadout Flow)
  // ==========================================
  renderSelectionView() {
    const prof = this.net?.profile;
    const isSingle = this.playMode === 'singleplayer';
    const activeRoster = this.getActiveRoster();
    const selectedChar = this.getSelectedCharacter();

    const selectedCls = selectedChar ? (CLASSES_CATALOG[selectedChar.classId] || CLASSES_CATALOG.solari_vanguard) : null;
    const selectedFm = selectedChar ? (FACTIONS_META[selectedChar.faction] || FACTIONS_META.Solari) : null;
    const selectedLvl = selectedChar ? (selectedChar.progression?.level || selectedChar.level || 1) : 1;

    return `
      <!-- UNIFIED HERO LOADOUT & REALM CONTROL HEADER -->
      <div class="fp-unified-header" style="background:#060a16; border:1px solid #1e293b; border-bottom:2px solid #ca8a04; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-radius:4px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="/GlimmerFall_official_multicolor_logo.png" alt="GlimmerFall" style="height:34px; width:auto; object-fit:contain; filter:drop-shadow(0 0 8px rgba(250,204,21,0.5));" />
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:var(--font-header); font-size:13px; font-weight:800; color:#facc15; letter-spacing:0.6px; text-shadow:1px 1px 0 #000;">
                GLIMMERFALL ONLINE
              </span>
              <span style="font-size:9px; padding:1px 5px; border-radius:3px; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; font-weight:bold;">
                2D PIXEL MMORPG
              </span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px; display:flex; align-items:center; gap:5px;">
              <span style="color:#fde047; font-weight:bold;">⚔️ CHARACTER SELECTION</span>
              <span>&bull;</span>
              <span>(${activeRoster.length}/8 Champions in ${isSingle ? 'Offline Realm' : 'Online Realm'})</span>
            </div>
          </div>
        </div>

        <!-- Realm Mode Selector (Single Player vs Multiplayer) -->
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="util-btn ${isSingle ? 'active' : ''}"
                  style="font-size:10px; padding:4px 10px; ${isSingle ? 'border-color:#38bdf8; background:#172554; color:#bae6fd;' : 'opacity:0.65;'}"
                  onclick="window._fp.setPlayMode('singleplayer')">
            🕹️ SINGLE PLAYER (OFFLINE)
          </button>
          <button class="util-btn ${!isSingle ? 'active' : ''}"
                  style="font-size:10px; padding:4px 10px; ${!isSingle ? 'border-color:#4ade80; background:#14532d; color:#bbf7d0;' : 'opacity:0.65;'}"
                  onclick="window._fp.setPlayMode('multiplayer')">
            🌐 MULTIPLAYER (ONLINE)
          </button>
        </div>

        <!-- Start on this site toggle, Landing Link, TCG & Auth Controls -->
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <label style="display:inline-flex; align-items:center; gap:5px; font-size:10px; color:#cbd5e1; cursor:pointer; background:#080e1c; padding:3px 8px; border:1px solid #334155; border-radius:3px;" title="When checked, visits go directly to this loadout. When unchecked, you start at the landing page.">
            <input type="checkbox" class="start-on-site-cb" ${this.getStartOnSite() ? 'checked' : ''} onchange="window._fp.setStartOnSite(this.checked)">
            <span>Start on this site</span>
          </label>
          <button type="button" class="util-btn" style="font-size:10px; padding:3px 8px; border-color:#38bdf8; color:#7dd3fc; font-weight:bold;" onclick="if(window.openLandingPage){window.openLandingPage();}else if(window._landing){window._landing.open();}else{var lp=document.getElementById('landing-overlay');var fp=document.getElementById('frontpage-overlay');if(fp)fp.style.display='none';if(lp)lp.style.display='block';}">
            📖 LANDING &amp; ENCYCLOPEDIAS
          </button>
          <a href="https://www.glimmerfalltcg.com" target="_blank" rel="noreferrer" class="util-btn" style="text-decoration:none; border-color:#facc15; color:#fde047; font-size:10px; padding:3px 8px; font-weight:bold;" title="Official GlimmerFall Trading Card Game">
            🃏 GLIMMERFALLTCG.COM ↗
          </a>

          <!-- Account Badge / Quick Auth -->
          ${prof && !prof.isGuest ? `
            <div style="display:flex; gap:8px; align-items:center; background:#0f172a; padding:3px 8px; border:1px solid #334155; border-radius:4px;">
              <div style="font-size:10.5px; color:#38bdf8; font-weight:bold;">
                👤 @${prof.username}
              </div>
              <button class="id-mini-btn" style="border-color:#ef4444; color:#fca5a5; font-size:9.5px; padding:2px 6px;" onclick="window._fp.handleLogout()">
                LOGOUT
              </button>
            </div>
          ` : `
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <input id="fp-auth-user" class="pixel-input" placeholder="GlimmerFall ID" value="${this.savedUsername || prof?.username || ''}" maxlength="18" style="font-size:10px; padding:3px 6px; width:100px;" />
              <input id="fp-auth-pass" class="pixel-input" type="password" placeholder="Password" value="${this.savedPassword || ''}" maxlength="48" style="font-size:10px; padding:3px 6px; width:80px;" />
              <button class="util-btn" style="font-size:9.5px; border-color:#38bdf8; color:#bae6fd; padding:3px 6px;" onclick="window._fp.handleQuickAuth('login')">LOGIN</button>
              <button class="util-btn" style="font-size:9.5px; border-color:#facc15; color:#fde047; padding:3px 6px;" onclick="window._fp.handleQuickAuth('register')">REGISTER</button>
              <label style="display:flex; align-items:center; gap:4px; font-size:10px; color:#cbd5e1; cursor:pointer; user-select:none; margin-left:3px; background:#080e1e; border:1px solid #1e293b; padding:2px 6px; border-radius:3px;" title="Remember login credentials and stay signed in">
                <input id="fp-remember-me" type="checkbox" ${this.rememberMe ? 'checked' : ''} onchange="window._fp.toggleRememberMe(this.checked)" style="accent-color:#38bdf8; cursor:pointer; width:12px; height:12px; margin:0;" />
                <span style="font-size:9.5px; color:${this.rememberMe ? '#38bdf8' : '#94a3b8'}; font-weight:600;">Remember me</span>
              </label>
            </div>
          `}
        </div>
      </div>

      ${this.authMessage ? `<div style="font-size:10.5px; color:#fde047; margin-bottom:8px; text-align:center;">${this.authMessage}</div>` : ''}

      <!-- VANGUARD CHARACTER LOADOUT & PEDESTAL GRID -->
      <div class="fp-grid" style="grid-template-columns: 360px 1fr; gap: 14px;">
        <!-- LEFT COLUMN: Character Loadout List (Strictly Read-Only) -->
        <div class="fp-col" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:6px;">
              <div class="fp-section-title" style="margin-bottom:0; font-size:11.5px;">
                1. SELECT HERO LOADOUT
              </div>
            </div>

            <!-- List of Previously Created Characters -->
            <div class="fp-roster-list" style="max-height: 290px; overflow-y:auto; gap:6px; margin-bottom:10px;">
              ${activeRoster.length ? activeRoster.map((ch) => {
                const cf = FACTIONS_META[ch.faction] || FACTIONS_META.Solari;
                const cCls = CLASSES_CATALOG[ch.classId] || CLASSES_CATALOG.solari_vanguard;
                const isSelected = selectedChar && ch.id === selectedChar.id;
                const lvl = ch.progression?.level || ch.level || 1;

                return `
                  <div class="fp-roster-item ${isSelected ? 'active' : ''}"
                       style="border:2px solid ${isSelected ? '#facc15' : '#334155'}; background:${isSelected ? '#172554' : '#0a1024'}; padding:8px 10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"
                       onclick="window._fp.selectCharacter('${ch.id}')">
                    <div style="display:flex; align-items:center; gap:8px; flex:1;">
                      <div style="position:relative; width:34px; height:34px; flex-shrink:0;">
                        <canvas class="fp-roster-avatar-cv" data-char-id="${ch.id}" width="34" height="34"
                                style="width:34px; height:34px; border:1px solid ${isSelected ? '#facc15' : cf.color}; background:#080e1c; image-rendering:pixelated; border-radius:3px; display:block;"></canvas>
                        <img src="${cf.logo}" alt="${cf.id}" style="position:absolute; bottom:-2px; right:-2px; width:12px; height:12px; object-fit:contain; filter:drop-shadow(0 0 2px #000);" />
                      </div>
                      <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span style="font-size:12.5px; font-weight:bold; color:${isSelected ? '#fde047' : cf.color}; font-family:var(--font-header);">
                            ${ch.name}
                          </span>
                          <span style="background:#091224; border:1px solid #ca8a04; color:#fde047; font-size:9px; padding:1px 5px; font-weight:bold; border-radius:2px;">
                            Lv. ${lvl}
                          </span>
                        </div>
                        <div style="display:flex; gap:8px; align-items:center; margin-top:3px; font-size:10px; color:#94a3b8;">
                          <span style="color:${cf.color}; font-weight:600;">${ch.faction}</span>
                          <span>•</span>
                          <span style="color:#cbd5e1;"><b>${cCls.name}</b> (${cCls.role})</span>
                          ${ch.hp != null ? `<span>•</span><span style="color:#4ade80;">❤️ ${ch.hp}</span>` : ''}
                          ${ch.solarCharge != null ? `<span style="color:#38bdf8;">🔮 ${ch.solarCharge}</span>` : ''}
                        </div>
                      </div>
                    </div>

                    ${activeRoster.length > 1 ? `
                      <button class="id-mini-btn"
                              style="border-color:#ef4444; color:#fca5a5; font-size:10px; padding:2px 6px;"
                              onclick="event.stopPropagation(); window._fp.removeRosterChar('${ch.id}')"
                              title="Delete Champion">
                        ✕
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('') : `
                <div style="text-align:center; padding:32px 14px; font-size:11px; color:#94a3b8; border:1px dashed #334155; background:#050812;">
                  No champions found on this realm.<br />Click below to forge your first hero!
                </div>
              `}
            </div>
          </div>

          <!-- "Create New Character" & "Replay Prologue" Buttons -->
          <div style="border-top:1px solid #1e293b; padding-top:10px; margin-top:6px; display:flex; flex-direction:column; gap:8px;">
            <button class="util-btn"
                    style="width:100%; border-color:#facc15; background:linear-gradient(180deg, #1e1b4b, #0f172a); color:#fde047; font-size:11.5px; font-weight:bold; padding:9px; display:flex; justify-content:center; align-items:center; gap:6px;"
                    onclick="window._fp.beginCharacterCreation()">
              <span>➕</span> CREATE NEW CHARACTER
            </button>
            <button class="util-btn"
                    style="width:100%; border:2px solid #facc15; background:linear-gradient(180deg, #451a03 0%, #1e1b4b 100%); color:#fde047; font-size:11px; font-weight:800; padding:8px; display:flex; justify-content:center; align-items:center; gap:6px; box-shadow:0 0 14px rgba(250,204,21,0.25); cursor:pointer;"
                    onclick="window._fp.playPrologueCinematic(true)">
              <span>🎬</span> REPLAY CRYSTAL HEART PROLOGUE (1080P)
            </button>
          </div>
        </div>

        <!-- RIGHT COLUMN: Pedestal Inspection & "Select/Play" Action -->
        <div class="fp-col" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="fp-section-title" style="margin-bottom:8px; font-size:11.5px;">
              2. CHAMPION PEDESTAL &amp; DEPLOYMENT
            </div>

            ${selectedChar ? `
              <!-- Vanguard Pedestal Canvas Area -->
              <div style="display:flex; gap:14px; align-items:center; background:#060a15; border:2px solid ${selectedFm.color}; padding:12px; margin-bottom:12px; box-shadow:0 0 15px rgba(0,0,0,0.8) inset;">
                <div style="text-align:center;">
                  <div style="position:relative; display:inline-block;">
                    <canvas id="fp-paperdoll-canvas" width="110" height="116" style="border:2px solid #ca8a04; background:radial-gradient(circle at 50% 60%, rgba(202,138,4,0.18), #070d1e); image-rendering:pixelated;"></canvas>
                  </div>
                  <div style="font-size:9.5px; color:#ca8a04; margin-top:4px; font-weight:bold; letter-spacing:0.5px;">
                    PEDESTAL VISAGE
                  </div>
                </div>

                <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline;">
                    <div style="font-family:var(--font-header); font-size:16px; color:#facc15; font-weight:800; text-shadow:2px 2px 0 #000;">
                      ${selectedChar.name}
                    </div>
                    <div style="font-size:11px; color:#fde047; font-weight:bold; background:#1e293b; padding:2px 7px; border:1px solid #ca8a04;">
                      Level ${selectedLvl}
                    </div>
                  </div>

                  <div style="font-size:10px; color:#94a3b8; display:flex; align-items:center; gap:5px; margin: 2px 0;">
                    <span>🔒 Permanent Registered Champion</span>
                  </div>

                  <div style="font-size:11px; color:${selectedFm.color}; font-weight:bold; display:flex; gap:6px; align-items:center;">
                    <img src="${selectedFm.logo}" alt="${selectedChar.faction}" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 0 3px ${selectedFm.color}); flex-shrink:0;" />
                    <span>Faction: ${selectedChar.faction}</span>
                    <span>•</span>
                    <span style="color:#cbd5e1;">Order &lt;${selectedChar.orderTag || 'SUN'}&gt;</span>
                  </div>

                  <div style="font-size:11px; color:#e2e8f0; font-weight:600;">
                    Archetype: <span style="color:#38bdf8;">${selectedCls.name}</span>
                    <span style="color:#94a3b8; font-size:10px; margin-left:4px;">[${selectedCls.role}]</span>
                  </div>

                  <div style="font-size:10px; color:#94a3b8; line-height:1.4; background:#0a1024; border:1px solid #1e293b; padding:6px 8px;">
                    ${selectedCls.desc}
                  </div>

                  <div style="font-size:10px; display:flex; gap:10px; align-items:center; background:#080e1c; padding:4px 8px; border:1px solid #1e293b; border-radius:2px;">
                    <span style="color:#4ade80; font-weight:700;">❤️ ${selectedChar.hp != null ? selectedChar.hp : 'FULL'} HP</span>
                    <span style="color:#38bdf8; font-weight:700;">🔮 ${selectedChar.solarCharge != null ? selectedChar.solarCharge : 0} Glimmer</span>
                  </div>

                  <div style="font-size:9.5px; color:#38bdf8; display:flex; align-items:center; gap:5px;">
                    <span>🏛️ Saved Realm Spot:</span>
                    <b style="color:#f8fafc;">${ROOM_CONFIGS[selectedChar.lastPosition?.roomType]?.title || ROOM_CONFIGS[selectedChar.homeBiome]?.title || 'Awakening Sanctuary Hub'}</b>
                  </div>

                  <div style="margin-top:6px;">
                    <button type="button" class="util-btn" style="width:100%; font-size:10px; padding:5px 8px; border-color:#38bdf8; color:#7dd3fc; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"
                            onclick="if(typeof window.playClassAwakening==='function'){window.playClassAwakening('${selectedCls.id}');}else if(typeof window.playCinematicModal==='function'){window.playCinematicModal('${selectedCls.id}');}">
                      <span>🎬</span> WATCH ${selectedCls.name.toUpperCase()} AWAKENING (1080P)
                    </button>
                  </div>
                </div>
              </div>

              <!-- Briefing Note: Character is strictly protected -->
              <div style="background:#091224; border-left:3px solid #38bdf8; padding:8px 10px; margin-bottom:12px; font-size:10px; color:#cbd5e1; line-height:1.4;">
                🛡️ <b>Character Loadout Locked:</b> Existing hero stats, progression, and inventories are immutable from the launcher. Gear, abilities, and passives are managed dynamically in-game via Hero Sheet [C] / Inventory [I].
              </div>
            ` : `
              <div style="text-align:center; padding:48px 20px; font-size:12px; color:#94a3b8; background:#060a15; border:1px solid #1e293b;">
                No champion selected. Create a character on the left to begin your journey.
              </div>
            `}
          </div>

          <!-- "Select/Play" Button -->
          <div style="border-top:1px solid #1e293b; padding-top:12px; margin-top:8px;">
            <button class="fp-enter-btn"
                    style="padding:14px; font-size:13px; font-weight:800; letter-spacing:0.8px; cursor:pointer;"
                    onclick="window._fp.playSelectedCharacter()">
              ${selectedChar ? `⚔️ SELECT & ENTER REALM (${selectedChar.name}) ▸` : '⚔️ ENTER REALM ▸'}
            </button>
            <div style="font-size:9.5px; color:#94a3b8; text-align:center; margin-top:5px;">
              ${isSingle ? '⚡ Offline Engine • Local Execution • Zero Server Latency' : '🌐 Authoritative Realm • Co-Op &amp; PvPvE Multiplayer'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // VIEW 2: Character Creation State (Distinct Creation Screen)
  // ==========================================
  renderCreationView() {
    const draft = this.creationDraft || {
      name: '',
      faction: 'Solari',
      classId: 'solari_vanguard',
      orderTag: 'SUN',
      startingRealm: ROOM_TYPES.SANCTUARY_HUB,
    };

    const isSingle = this.playMode === 'singleplayer';
    const fm = FACTIONS_META[draft.faction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[draft.classId] || CLASSES_CATALOG.solari_vanguard;
    const factionClasses = Object.values(CLASSES_CATALOG).filter((c) => c.faction === draft.faction);

    return `
      <!-- CREATION TOP BAR: Title & Cancel Navigation -->
      <div style="background:#060a16; border:1px solid #1e293b; border-bottom:2px solid #38bdf8; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-radius:4px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="/GlimmerFall_official_multicolor_logo.png" alt="GlimmerFall" style="height:32px; width:auto; object-fit:contain; filter:drop-shadow(0 0 8px rgba(56,189,248,0.5));" />
          <div>
            <div style="font-family:var(--font-header); font-size:13px; color:#38bdf8; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
              <span>✨ FORGE A NEW CHAMPION</span>
              <span style="font-size:9px; padding:1px 5px; border-radius:3px; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; font-weight:bold;">CREATION LAB</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">
              Isolated Creation State &bull; Choose your Faction, Role &amp; Name
            </div>
          </div>
        </div>

        <!-- "Back/Cancel" Button to return to Selection State -->
        <button class="util-btn"
                style="font-size:10px; padding:5px 12px; border-color:#94a3b8; color:#f1f5f9; background:#0f172a; font-weight:bold; display:flex; align-items:center; gap:4px;"
                onclick="window._fp.transitionTo('CHARACTER_SELECT')">
          ◀ CANCEL / BACK TO SELECTION
        </button>
      </div>

      ${this.creationError ? `<div style="font-size:11px; color:#ef4444; background:#450a0a; border:1px solid #dc2626; padding:6px 10px; margin-bottom:10px; text-align:center;">${this.creationError}</div>` : ''}

      <!-- CREATION FORM GRID -->
      <div class="fp-grid" style="grid-template-columns: 1fr 310px; gap: 14px;">
        <!-- LEFT COLUMN: Identity, Faction & Role Selection -->
        <div class="fp-col">
          <!-- Character Name & Order Tag Inputs -->
          <div class="fp-section-title" style="font-size:11.5px; margin-bottom:6px;">
            1. CHAMPION IDENTITY
          </div>
          <div style="display:grid; grid-template-columns: 1fr 110px; gap:8px; margin-bottom:12px;">
            <div>
              <label style="font-size:10px; color:#94a3b8; font-weight:bold;">CHARACTER NAME</label>
              <input id="fp-new-char-name"
                     class="pixel-input"
                     placeholder="Enter hero name..."
                     value="${draft.name}"
                     maxlength="18"
                     oninput="window._fp.setCreationName(this.value)"
                     style="font-size:11.5px; padding:6px 8px; margin-top:2px;" />
            </div>
            <div>
              <label style="font-size:10px; color:#94a3b8; font-weight:bold;">&lt;ORDER TAG&gt;</label>
              <input id="fp-new-order-tag"
                     class="pixel-input"
                     value="${draft.orderTag}"
                     maxlength="5"
                     oninput="window._fp.setCreationOrderTag(this.value)"
                     style="font-size:11.5px; padding:6px 8px; margin-top:2px;" />
            </div>
          </div>

          <!-- Faction Selection Elements -->
          <div class="fp-section-title" style="font-size:11.5px; margin-bottom:6px;">
            2. CHOOSE CANONICAL FACTION
          </div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:10px;">
            ${Object.values(FACTIONS_META).map((f) => `
              <div class="faction-card-btn ${draft.faction === f.id ? 'selected' : ''}"
                   style="border:2px solid ${draft.faction === f.id ? f.color : '#1e293b'}; background:${draft.faction === f.id ? '#0f1d3a' : '#080d1c'}; padding:8px 4px; text-align:center; cursor:pointer;"
                   onclick="window._fp.setCreationFaction('${f.id}')">
                <img src="${f.logo}" alt="${f.id}" style="width:34px; height:34px; object-fit:contain; display:block; margin:0 auto 3px; filter:drop-shadow(0 0 4px ${f.color});" />
                <div style="color:${f.color}; font-size:10.5px; font-weight:bold; font-family:var(--font-header); margin-top:2px;">
                  ${f.id.toUpperCase()}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Faction Mechanic Description -->
          <div style="background:#060a15; border-left:3px solid ${fm.color}; padding:8px 10px; margin-bottom:12px; font-size:10.5px; line-height:1.4; display:flex; align-items:center; gap:8px;">
            <img src="${fm.logo}" alt="${fm.id}" style="width:24px; height:24px; object-fit:contain; filter:drop-shadow(0 0 3px ${fm.color}); flex-shrink:0;" />
            <div>
              <b style="color:${fm.color};">${fm.mechanicName}:</b>
              <span style="color:#cbd5e1; margin-left:4px;">${fm.mechanicDesc}</span>
            </div>
          </div>

          <!-- Role / Archetype Selection Elements -->
          <div class="fp-section-title" style="font-size:11.5px; margin-bottom:6px;">
            3. SELECT PLAYABLE ROLE &amp; ARCHETYPE
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
            ${factionClasses.map((c) => `
              <div class="fp-class-card ${draft.classId === c.id ? 'selected' : ''}"
                   style="cursor:pointer; border:2px solid ${draft.classId === c.id ? '#38bdf8' : '#1e293b'}; background:${draft.classId === c.id ? '#172554' : '#090e1f'}; padding:8px 10px; display:flex; gap:10px; align-items:center;"
                   onclick="window._fp.setCreationClass('${c.id}')">
                <canvas class="fp-class-avatar-cv" data-class-id="${c.id}" data-faction="${c.faction}" width="34" height="34"
                        style="width:34px; height:34px; border:1px solid ${draft.classId === c.id ? '#38bdf8' : '#334155'}; background:#080e1c; image-rendering:pixelated; border-radius:3px; flex-shrink:0;"></canvas>
                <div style="flex:1;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline;">
                    <div style="color:${fm.color}; font-weight:bold; font-size:11.5px; font-family:var(--font-header);">
                      ${c.name}
                    </div>
                    <span style="color:#38bdf8; font-size:9.5px; font-weight:bold;">[${c.role}]</span>
                  </div>
                  <div style="color:#94a3b8; font-size:10px; margin-top:3px; line-height:1.35;">
                    ${c.desc}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- RIGHT COLUMN: New Champion Visage Preview & Submission -->
        <div class="fp-col" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="fp-section-title" style="font-size:11.5px; margin-bottom:8px;">
              4. DRAFT VISAGE PREVIEW
            </div>

            <div style="background:#060a15; border:2px solid ${fm.color}; padding:14px; text-align:center; margin-bottom:12px;">
              <canvas id="fp-paperdoll-canvas" width="110" height="116" style="border:2px solid #ca8a04; background:radial-gradient(circle at 50% 60%, rgba(56,189,248,0.18), #070d1e); image-rendering:pixelated;"></canvas>
              <div style="font-family:var(--font-header); font-size:13px; color:#facc15; font-weight:bold; margin-top:6px;">
                ${cls.name}
              </div>
              <div style="font-size:10px; color:${fm.color}; font-weight:600;">
                ${fm.icon} ${draft.faction} Faction • ${cls.role}
              </div>
              <div style="margin-top:10px;">
                <button type="button" class="util-btn" style="width:100%; font-size:10px; padding:5px 8px; border-color:#38bdf8; color:#7dd3fc; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"
                        onclick="if(typeof window.playClassAwakening==='function'){window.playClassAwakening('${cls.id}');}else if(typeof window.playCinematicModal==='function'){window.playCinematicModal('${cls.id}');}">
                  <span>🎬</span> PREVIEW ${cls.name.toUpperCase()} AWAKENING (1080P)
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons: Cancel or Forge -->
          <div style="display:flex; flex-direction:column; gap:6px; border-top:1px solid #1e293b; padding-top:10px;">
            <button class="fp-enter-btn"
                    style="padding:12px 10px; font-size:12px; background:linear-gradient(180deg, #38bdf8, #0284c7); border-color:#bae6fd; color:#030712;"
                    onclick="window._fp.submitNewCharacter()">
              ✨ FORGE CHAMPION &amp; ENTER WORLD ▸
            </button>
            <button class="util-btn"
                    style="font-size:10.5px; padding:6px; color:#94a3b8; border-color:#334155;"
                    onclick="window._fp.transitionTo('CHARACTER_SELECT')">
              Cancel / Back to Selection
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

export function renderInGamePaperdollModal({ profile, onEquip }) {
  renderEquipmentModal({ profile });
}
