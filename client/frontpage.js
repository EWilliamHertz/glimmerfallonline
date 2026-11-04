// ==========================================
// GlimmerFall Online 2D — Game Frontpage
// 1. Account / Login • Single Player & Multiplayer Realms • Champion Creation
// 4 Canonical Factions • 8 Archetypes • 24x26 Live Paperdoll Preview
// ==========================================

import {
  ROOM_TYPES,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  getEquipmentStatBonuses,
  createDefaultProgression,
} from '../shared/protocol.js';
import { getCharacterSprites } from './sprites.js';

const SP_STORAGE_KEY = 'glimmerfall_sp_roster_v2';
const SP_ACTIVE_KEY = 'glimmerfall_sp_active_id';

export class FrontpageController {
  constructor({ net, audio, onEnterWorld }) {
    this.net = net;
    this.audio = audio;
    this.onEnterWorld = onEnterWorld;
    if (typeof window !== 'undefined') {
      window._fp = this;
    }

    this.isOpen = true;
    this.previewAnimTimer = null;
    this.previewDirIdx = 0;
    this.previewFrame = 0;

    // Realm Mode: 'singleplayer' (zero lag / local) or 'multiplayer' (online authoritative)
    let savedMode = 'singleplayer';
    try {
      savedMode = localStorage.getItem('glimmerfall_play_mode') || 'singleplayer';
    } catch (_) {}
    this.playMode = savedMode;

    // Draft / Selected Character State
    this.editingCharacterId = null; // null = creating new
    this.name = 'Solari Vanguard';
    this.orderTag = 'SUN';
    this.faction = 'Solari';
    this.classId = 'solari_vanguard';
    this.equipment = { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment };
    this.loadout = { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout };
    this.startingRealm = ROOM_TYPES.SANCTUARY_HUB;
    this.authMessage = '';

    // Initialize Single Player default roster if none exists
    this.ensureSinglePlayerDefaults();
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
          progression: createDefaultProgression(),
          homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        };
        localStorage.setItem(SP_STORAGE_KEY, JSON.stringify([starter]));
        localStorage.setItem(SP_ACTIVE_KEY, starter.id);
        this.selectRosterCharacter(starter, false);
      } else {
        const activeId = localStorage.getItem(SP_ACTIVE_KEY);
        const activeChar = existing.find((c) => c.id === activeId) || existing[0];
        if (this.playMode === 'singleplayer' && activeChar) {
          this.selectRosterCharacter(activeChar, false);
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
      const active = spChars.find((c) => c.id === this.editingCharacterId) || spChars[0];
      if (active) this.selectRosterCharacter(active, false);
      else this.startNewCharacter(false);
    } else {
      // Connect to multiplayer server to load cloud characters
      if (this.net && !this.net.connected) {
        this.net.bootstrapAndConnect().then((prof) => {
          if (prof) this.syncFromProfile(prof);
        }).catch(() => {});
      }
      const mpChars = this.net?.profile?.characters || [];
      const active = mpChars.find((c) => c.id === this.net?.profile?.activeCharacterId) || mpChars[0];
      if (active) this.selectRosterCharacter(active, false);
      else this.startNewCharacter(false);
    }

    if (this.isOpen) this.render();
  }

  syncFromProfile(profile) {
    if (!profile) return;
    if (this.playMode === 'multiplayer') {
      const chars = profile.characters || [];
      const active = chars.find((c) => c.id === profile.activeCharacterId) || chars[0];
      if (active) {
        this.selectRosterCharacter(active, false);
      }
      if (this.isOpen) this.render();
    }
  }

  selectRosterCharacter(ch, rerender = true) {
    if (!ch) return;
    this.editingCharacterId = ch.id;
    this.name = ch.name || 'Champion';
    this.faction = ch.faction || 'Solari';
    this.classId = ch.classId || 'solari_vanguard';
    const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;
    this.equipment = { ...cls.defaultEquipment, ...(ch.equipment || {}) };
    this.loadout = { ...cls.defaultLoadout, ...(ch.loadout || {}) };
    this.orderTag = ch.orderTag || 'SUN';
    this.startingRealm = ch.homeBiome || ROOM_TYPES.SANCTUARY_HUB;

    if (this.playMode === 'singleplayer') {
      try {
        localStorage.setItem(SP_ACTIVE_KEY, ch.id);
      } catch (_) {}
    }

    if (rerender) {
      if (this.audio?.playChime) this.audio.playChime();
      this.render();
    }
  }

  startNewCharacter(playSfx = true) {
    this.editingCharacterId = null;
    this.faction = 'Solari';
    this.classId = 'solari_vanguard';
    const suffix = Math.floor(100 + Math.random() * 899);
    this.name = `Champion_${suffix}`;
    this.orderTag = 'SUN';
    this.equipment = { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment };
    this.loadout = { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout };
    this.startingRealm = ROOM_TYPES.SANCTUARY_HUB;
    if (playSfx && this.audio?.playChime) this.audio.playChime();
    if (this.isOpen) this.render();
  }

  pickFaction(facId) {
    if (!FACTIONS_META[facId]) return;
    this.faction = facId;
    const firstCls = Object.values(CLASSES_CATALOG).find((c) => c.faction === facId) || CLASSES_CATALOG.solari_vanguard;
    this.pickClass(firstCls.id, false);
    const defaultTags = { Solari: 'SUN', Umbri: 'VOID', Terra: 'ROOT', Aether: 'AETH' };
    this.orderTag = defaultTags[facId] || 'SUN';
    if (this.audio?.playChime) this.audio.playChime();
    this.render();
  }

  pickClass(classId, playSfx = true) {
    const cls = CLASSES_CATALOG[classId];
    if (!cls) return;
    this.classId = cls.id;
    this.faction = cls.faction;
    this.equipment = { ...cls.defaultEquipment };
    this.loadout = { ...cls.defaultLoadout };
    if (!this.editingCharacterId && (this.name.startsWith('Solari') || this.name.startsWith('Champion_') || Object.values(CLASSES_CATALOG).some((c) => c.name === this.name))) {
      this.name = cls.name;
    }
    if (playSfx && this.audio?.playChime) this.audio.playChime();
    this.render();
  }

  pickEquipment(slot, itemId) {
    if (!EQUIPMENT_CATALOG[itemId]) return;
    this.equipment = { ...this.equipment, [slot]: itemId };
    if (this.audio?.playShield) this.audio.playShield();
    this.render();
  }

  open() {
    this.isOpen = true;
    const el = document.getElementById('frontpage-overlay');
    if (el) el.style.display = 'flex';
    try {
      this.render();
    } catch (err) {
      console.error('[Frontpage] Error during render:', err);
    }
    this.startPreviewLoop();
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
    const dirs = ['down', 'right', 'up', 'left'];
    this.previewAnimTimer = setInterval(() => {
      if (!this.isOpen) return;
      this.previewFrame = (this.previewFrame + 1) % 12;
      if (this.previewFrame % 4 === 0) {
        this.previewDirIdx = (this.previewDirIdx + 1) % dirs.length;
      }
      this.drawPaperdollPreviewCanvas('fp-paperdoll-canvas', dirs[this.previewDirIdx], (this.previewFrame % 2) + 1);
    }, 240);
  }

  drawPaperdollPreviewCanvas(canvasId, dir = 'down', frameIdx = 0) {
    try {
      const cv = document.getElementById(canvasId);
      if (!cv || typeof cv.getContext !== 'function') return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#090f20';
      ctx.fillRect(0, 0, cv.width, cv.height);

      // Subtle faction floor sigil
      const fm = FACTIONS_META[this.faction] || FACTIONS_META.Solari;
      ctx.strokeStyle = fm.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, cv.width - 8, cv.height - 8);

      const set = getCharacterSprites(this.faction, this.classId, this.equipment);
      if (!set) return;
      const dirFrames = set[dir] || set.down;
      if (!dirFrames || !dirFrames.length) return;
      const img = dirFrames[frameIdx % dirFrames.length];
      if (!img) return;
      const scale = 3;
      const dw = (img.width || 24) * scale;
      const dh = (img.height || 26) * scale;
      ctx.drawImage(img, Math.round((cv.width - dw) / 2), Math.round((cv.height - dh) / 2) + 2, dw, dh);
    } catch (err) {
      console.warn('[Frontpage] Paperdoll preview draw warning:', err);
    }
  }

  async enterWorld() {
    if (this.audio?.init) this.audio.init();
    if (this.audio?.playPortal) this.audio.playPortal();

    const nameInput = document.getElementById('fp-char-name');
    const tagInput = document.getElementById('fp-order-tag');
    if (nameInput && nameInput.value.trim()) this.name = nameInput.value.trim();
    if (tagInput && tagInput.value.trim()) this.orderTag = tagInput.value.trim().toUpperCase();

    const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;

    // === SINGLE PLAYER (OFFLINE / 0ms) ===
    if (this.playMode === 'singleplayer') {
      const spRoster = this.getSinglePlayerRoster();
      let charObj = null;

      if (this.editingCharacterId) {
        charObj = spRoster.find((c) => c.id === this.editingCharacterId);
      }

      if (charObj) {
        charObj.name = this.name;
        charObj.faction = this.faction;
        charObj.classId = this.classId;
        charObj.orderTag = this.orderTag;
        charObj.equipment = { ...this.equipment };
        charObj.loadout = { ...cls.defaultLoadout, ...(charObj.loadout || {}) };
        charObj.homeBiome = this.startingRealm;
      } else {
        charObj = {
          id: `sp_char_${Date.now()}`,
          name: this.name,
          faction: this.faction,
          classId: this.classId,
          orderTag: this.orderTag,
          equipment: { ...this.equipment },
          loadout: { ...cls.defaultLoadout },
          progression: createDefaultProgression(),
          homeBiome: this.startingRealm,
        };
        spRoster.push(charObj);
        this.editingCharacterId = charObj.id;
      }

      this.saveSinglePlayerRoster(spRoster);
      try {
        localStorage.setItem(SP_ACTIVE_KEY, charObj.id);
      } catch (_) {}

      const singlePlayerProfile = {
        id: charObj.id,
        displayName: charObj.name,
        faction: charObj.faction,
        classId: charObj.classId,
        orderTag: charObj.orderTag,
        orderName: `Order of ${charObj.faction}`,
        loadout: charObj.loadout,
        equipment: charObj.equipment,
        progression: charObj.progression || createDefaultProgression(),
        characters: spRoster,
        activeCharacterId: charObj.id,
        isGuest: true,
      };

      this.close();
      if (this.onEnterWorld) {
        this.onEnterWorld({
          profile: singlePlayerProfile,
          startingRealm: this.startingRealm,
          playMode: 'singleplayer',
        });
      }
      return;
    }

    // === MULTIPLAYER (ONLINE REALM) ===
    let updatedProfile = null;
    try {
      const res = await this.net.saveOrSelectCharacter({
        characterId: this.editingCharacterId || undefined,
        name: this.name,
        faction: this.faction,
        classId: this.classId,
        orderTag: this.orderTag,
        loadout: cls.defaultLoadout,
        equipment: this.equipment,
        homeBiome: this.startingRealm,
        enterRealm: this.startingRealm,
      });
      updatedProfile = res.profile;
      if (updatedProfile && !updatedProfile.orderTag) {
        updatedProfile.orderTag = this.orderTag;
      }
      this.editingCharacterId = res.character?.id || this.editingCharacterId;
    } catch (_) {
      // Local fallback profile
      updatedProfile = {
        displayName: this.name,
        faction: this.faction,
        classId: this.classId,
        orderTag: this.orderTag,
        loadout: cls.defaultLoadout,
        equipment: this.equipment,
      };
    }

    this.close();
    if (this.onEnterWorld) {
      this.onEnterWorld({
        profile: updatedProfile,
        startingRealm: this.startingRealm,
        playMode: 'multiplayer',
      });
    }
  }

  async handleQuickAuth(mode) {
    const u = document.getElementById('fp-auth-user')?.value?.trim();
    const p = document.getElementById('fp-auth-pass')?.value || '';
    if (!u || !p) {
      this.authMessage = '⚠️ Enter Username & Password first.';
      this.render();
      return;
    }
    try {
      const prof = mode === 'login'
        ? await this.net.login({ username: u, password: p })
        : await this.net.register({
            username: u,
            password: p,
            displayName: this.name,
            faction: this.faction,
            classId: this.classId,
            orderTag: this.orderTag,
          });
      this.authMessage = `✓ Signed in as @${prof.username}!`;
      this.syncFromProfile(prof);
    } catch (err) {
      this.authMessage = `⚠️ ${err.message}`;
      this.render();
    }
  }

  handleLogout() {
    if (this.net?.logout) this.net.logout();
    this.authMessage = 'Logged out. Guest session active.';
    this.editingCharacterId = null;
    this.render();
  }

  async removeRosterChar(charId) {
    if (this.playMode === 'singleplayer') {
      let spRoster = this.getSinglePlayerRoster().filter((c) => c.id !== charId);
      if (spRoster.length === 0) {
        this.saveSinglePlayerRoster([]);
        this.ensureSinglePlayerDefaults();
        return;
      }
      this.saveSinglePlayerRoster(spRoster);
      if (this.editingCharacterId === charId) {
        this.selectRosterCharacter(spRoster[0], false);
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

  render() {
    const root = document.getElementById('frontpage-body');
    if (!root) return;

    const prof = this.net?.profile;
    const isSingle = this.playMode === 'singleplayer';

    // Roster depends strictly on selected realm mode!
    const spRoster = this.getSinglePlayerRoster();
    const mpRoster = prof?.characters || [];
    const activeRoster = isSingle ? spRoster : mpRoster;

    const fm = FACTIONS_META[this.faction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;
    const eqBonus = getEquipmentStatBonuses(this.equipment, this.classId);

    const weapons = Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'weapon');
    const armors = Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'armor');
    const offhands = Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'offhand');

    const factionClasses = Object.values(CLASSES_CATALOG).filter((c) => c.faction === this.faction);

    root.innerHTML = `
      <div class="fp-grid" style="grid-template-columns: 310px 1fr; gap: 14px;">
        <!-- LEFT COLUMN: 1. Login & Realm Selection & Roster -->
        <div class="fp-col">
          <!-- 1. LOGIN & ACCOUNT -->
          <div class="fp-section-title">1. GLIMMERFALL ACCOUNT &amp; REALM</div>

          ${prof && !prof.isGuest ? `
            <div style="background:#091224; border:1px solid #38bdf8; padding:8px 10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:11.5px; color:#38bdf8; font-weight:bold;">✓ CONNECTED: @${prof.username}</div>
                <div style="font-size:10px; color:#94a3b8;">Champion Profile Synced</div>
              </div>
              <button class="id-mini-btn" style="border-color:#ef4444; color:#fca5a5; font-size:10px;" onclick="window._fp.handleLogout()">LOGOUT</button>
            </div>
          ` : `
            <div style="background:#060a16; border:1px solid #1e293b; padding:8px 10px; margin-bottom:8px; display:flex; flex-direction:column; gap:6px;">
              <input id="fp-auth-user" class="pixel-input" placeholder="GlimmerFall ID Username" value="${prof?.username || ''}" maxlength="18" style="font-size:11.5px; padding:6px 8px;" />
              <input id="fp-auth-pass" class="pixel-input" type="password" placeholder="Password" maxlength="48" style="font-size:11.5px; padding:6px 8px;" />
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <button class="util-btn" style="font-size:10.5px; border-color:#facc15; color:#fde047; padding:5px;" onclick="window._fp.handleQuickAuth('register')">✨ REGISTER</button>
                <button class="util-btn" style="font-size:10.5px; border-color:#38bdf8; color:#bae6fd; padding:5px;" onclick="window._fp.handleQuickAuth('login')">🔑 LOGIN</button>
              </div>
              ${this.authMessage ? `<div style="font-size:10px; color:#fde047; margin-top:2px;">${this.authMessage}</div>` : ''}
            </div>
          `}

          <!-- REALM MODE SELECTOR: Single Player vs Multiplayer -->
          <div style="font-size:10.5px; color:#94a3b8; margin-bottom:5px; font-weight:bold; letter-spacing:0.02em;">SELECT ADVENTURE REALM:</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px;">
            <button class="util-btn ${isSingle ? 'active' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 4px; ${isSingle ? 'border-color:#38bdf8; background:#172554; color:#bae6fd;' : 'opacity:0.75;'}" onclick="window._fp.setPlayMode('singleplayer')">
              <span style="font-size:12.5px; font-weight:bold;">🕹️ SINGLE PLAYER</span>
              <span style="font-size:10px; color:${isSingle ? '#fde047' : '#94a3b8'}; font-weight:600;">0ms • ZERO LAG</span>
            </button>
            <button class="util-btn ${!isSingle ? 'active' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 4px; ${!isSingle ? 'border-color:#4ade80; background:#14532d; color:#bbf7d0;' : 'opacity:0.75;'}" onclick="window._fp.setPlayMode('multiplayer')">
              <span style="font-size:12.5px; font-weight:bold;">🌐 MULTIPLAYER</span>
              <span style="font-size:10px; color:${!isSingle ? '#fde047' : '#94a3b8'}; font-weight:600;">ONLINE REALM</span>
            </button>
          </div>

          <!-- REALM CHAMPION ROSTER -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div class="fp-section-title" style="margin-bottom:0;">
              ${isSingle ? '🕹️ SINGLE PLAYER ROSTER' : '🌐 MULTIPLAYER ROSTER'}
            </div>
            <div style="font-size:10px; font-weight:bold; color:${isSingle ? '#38bdf8' : '#4ade80'};">
              ${isSingle ? '● OFFLINE REALM' : '● ONLINE REALM'}
            </div>
          </div>

          <div class="fp-roster-list" style="max-height: 165px; margin-bottom:8px;">
            ${activeRoster.length ? activeRoster.map((ch) => {
              const cf = FACTIONS_META[ch.faction] || FACTIONS_META.Solari;
              const cCls = CLASSES_CATALOG[ch.classId] || CLASSES_CATALOG.solari_vanguard;
              const active = ch.id === this.editingCharacterId;
              const lvl = ch.progression?.level || ch.level || 1;
              return `
                <div class="fp-roster-item ${active ? 'active' : ''}" onclick="window._fp.selectRosterCharacterById('${ch.id}')">
                  <div>
                    <div style="font-size:12px; color:${cf.color}; font-weight:bold;">
                      ${cf.icon} ${ch.name} <span style="color:#fde047; font-size:11px;">Lv.${lvl}</span>
                    </div>
                    <div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">${cCls.name} • &lt;${ch.orderTag || 'SUN'}&gt;</div>
                  </div>
                  ${activeRoster.length > 1 ? `<button class="id-mini-btn" style="border-color:#ef4444; color:#fca5a5; font-size:10px;" onclick="event.stopPropagation(); window._fp.removeRosterChar('${ch.id}')" title="Delete Champion">✕</button>` : ''}
                </div>
              `;
            }).join('') : `
              <div style="text-align:center; padding:16px; font-size:11px; color:#94a3b8; border:1px dashed #334155;">
                No characters found on this realm. Click below to create one!
              </div>
            `}
          </div>

          <button class="util-btn" style="width:100%; border-color:#facc15; color:#fde047; font-size:11px; font-weight:bold; padding:7px;" onclick="window._fp.startNewCharacter()">
            ➕ CREATE NEW CHAMPION
          </button>
        </div>

        <!-- RIGHT COLUMN: Champion Creator, Faction, Archetype & Visage (Pure Factions & Characters) -->
        <div class="fp-col">
          <div class="fp-section-title">2. CHAMPION IDENTITY, FACTION &amp; ARCHETYPE</div>

          <div style="display:grid; grid-template-columns:1fr 96px; gap:8px; margin-bottom:8px;">
            <div>
              <label style="font-size:10.5px; color:#94a3b8; font-weight:bold;">CHARACTER NAME</label>
              <input id="fp-char-name" class="pixel-input" value="${this.name}" maxlength="18" oninput="window._fp.name = this.value" placeholder="Enter name..." style="font-size:11.5px; padding:6px 8px;" />
            </div>
            <div>
              <label style="font-size:10.5px; color:#94a3b8; font-weight:bold;">&lt;ORDER TAG&gt;</label>
              <input id="fp-order-tag" class="pixel-input" value="${this.orderTag}" maxlength="5" oninput="window._fp.orderTag = this.value.toUpperCase()" style="font-size:11.5px; padding:6px 8px;" />
            </div>
          </div>

          <label style="font-size:10.5px; color:#94a3b8; font-weight:bold;">CANONICAL GLIMMERFALL TCG FACTIONS:</label>
          <div class="faction-choice-grid" style="margin:5px 0 8px; display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
            ${Object.values(FACTIONS_META).map((f) => `
              <div class="faction-card-btn ${this.faction === f.id ? 'selected' : ''}" style="${this.faction === f.id ? `border-color:${f.color}; background:#0f1d3a;` : 'border-color:#1e293b;'}" onclick="window._fp.pickFaction('${f.id}')">
                <div style="font-size:18px;">${f.icon}</div>
                <b style="color:${f.color}; font-size:11px; font-family:var(--font-header);">${f.id.toUpperCase()}</b>
              </div>
            `).join('')}
          </div>

          <div style="background:#060a15; border-left:3px solid ${fm.color}; padding:8px 10px; margin-bottom:8px; font-size:11px; line-height:1.45;">
            <b style="color:${fm.color}; font-size:11.5px;">${fm.icon} ${fm.mechanicName}:</b>
            <span style="color:#cbd5e1;">${fm.mechanicDesc}</span>
          </div>

          <label style="font-size:10.5px; color:#94a3b8; font-weight:bold;">PLAYABLE CLASS ARCHETYPE (2 PER FACTION):</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:5px 0 10px;">
            ${factionClasses.map((c) => `
              <div class="fp-class-card ${this.classId === c.id ? 'selected' : ''}" onclick="window._fp.pickClass('${c.id}')" style="cursor:pointer; border:2px solid ${this.classId === c.id ? '#38bdf8' : '#1e293b'}; background:${this.classId === c.id ? '#172554' : '#090e1f'}; padding:8px 10px;">
                <div style="color:${fm.color}; font-weight:bold; font-size:12px; font-family:var(--font-header);">${c.name}</div>
                <div style="color:#94a3b8; font-size:10.5px; margin-top:2px;">${c.role}</div>
                <div style="color:#cbd5e1; font-size:10px; margin-top:3px; line-height:1.35;">${c.desc}</div>
              </div>
            `).join('')}
          </div>

          <!-- Pure Champion Visage & Archetype Profile (Item switchers isolated to in-game Hero Sheet [C]/[H]) -->
          <div style="display:flex; gap:12px; align-items:center; background:#060a15; border:2px solid #1e293b; padding:10px 12px; margin-bottom:10px;">
            <div style="text-align:center;">
              <canvas id="fp-paperdoll-canvas" width="92" height="96" style="border:2px solid ${fm.color}; background:#090f20;"></canvas>
              <div style="font-size:10px; color:#94a3b8; margin-top:4px; font-weight:bold;">LIVE 24×26 VISAGE</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; gap:4px; font-size:11px;">
              <div style="color:${fm.color}; font-weight:bold; font-size:12.5px; font-family:var(--font-header);">
                ${cls.name} <span style="color:#94a3b8; font-size:10.5px;">[${cls.role}]</span>
              </div>
              <div style="color:#cbd5e1; font-size:10.5px; line-height:1.45;">
                ${cls.desc}
              </div>
              <div style="background:#091224; border:1px solid #1e293b; padding:5px 8px; margin-top:3px; font-size:10.5px; color:#38bdf8;">
                🛡️ Canonical starter relics equipped • Customize &amp; switch relics in-game via Hero Sheet [C] / [I]
              </div>
            </div>
          </div>

          <!-- Starting Biome & Launch Button -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items:center; margin-top:6px;">
            <div>
              <label style="font-size:10.5px; color:#94a3b8; font-weight:bold;">STARTING BIOME:</label>
              <select class="pixel-input" style="margin-top:3px; padding:7px; font-size:11px;" onchange="window._fp.startingRealm = this.value">
                <option value="${ROOM_TYPES.SANCTUARY_HUB}" ${this.startingRealm === ROOM_TYPES.SANCTUARY_HUB ? 'selected' : ''}>🏛️ Awakening Sanctuary Hub (Safe Hub)</option>
                <option value="${fm.homeBiome}" ${this.startingRealm === fm.homeBiome ? 'selected' : ''}>${fm.icon} ${fm.id} Home Biome</option>
                <option value="${ROOM_TYPES.NEXUS_WARZONE}" ${this.startingRealm === ROOM_TYPES.NEXUS_WARZONE ? 'selected' : ''}>⚔️ Nexus Warzone (Open World)</option>
              </select>
            </div>

            <button class="fp-enter-btn" style="padding:12px 10px; font-size:12px; ${isSingle ? 'background:linear-gradient(180deg, #38bdf8, #0284c7); border-color:#bae6fd; color:#030712;' : 'background:linear-gradient(180deg, #eab308, #ca8a04); border-color:#fef08a; color:#05070f;'}" onclick="window._fp.enterWorld()">
              ${isSingle ? '🕹️ ENTER SINGLE PLAYER REALM (0ms) ▸' : '🌐 ENTER MULTIPLAYER REALM ▸'}
            </button>
          </div>
          <div style="font-size:10px; color:#94a3b8; text-align:right; margin-top:4px;">
            ${isSingle ? '⚡ 100% Offline Local Engine • Zero Latency • Instant 60 FPS' : '🌐 Shared Online Realm • Co-Op &amp; PvPvE Battles'}
          </div>
        </div>
      </div>
    `;

    this.drawPaperdollPreviewCanvas('fp-paperdoll-canvas', 'down', 0);
  }

  selectRosterCharacterById(id) {
    if (this.playMode === 'singleplayer') {
      const ch = this.getSinglePlayerRoster().find((c) => c.id === id);
      if (ch) this.selectRosterCharacter(ch, true);
    } else {
      const ch = (this.net?.profile?.characters || []).find((c) => c.id === id);
      if (ch) this.selectRosterCharacter(ch, true);
    }
  }
}

export function renderInGamePaperdollModal({ profile, onEquip }) {
  const container = document.getElementById('paperdoll-modal-body');
  if (!container) return;

  const faction = profile?.faction || 'Solari';
  const classId = profile?.classId || 'solari_vanguard';
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const equip = { ...cls.defaultEquipment, ...(profile?.equipment || {}) };
  const bonuses = getEquipmentStatBonuses(equip, classId);

  const slots = [
    { key: 'weapon', title: '🗡️ WEAPON SLOT', items: Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'weapon') },
    { key: 'armor', title: '🥋 ARMOR SLOT', items: Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'armor') },
    { key: 'offhand', title: '🛡️ RELIC / SHIELD SLOT', items: Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'offhand') },
  ];

  container.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center; background:#080c18; border:2px solid #1e293b; padding:10px; margin-bottom:10px;">
      <canvas id="ingame-paperdoll-canvas" width="84" height="88" style="border:2px solid #facc15; background:#090f20;"></canvas>
      <div style="font-size:9px; line-height:1.5;">
        <div style="color:#facc15; font-family:var(--font-header); font-size:8.5px;">${profile?.displayName || 'Champion'} — ${cls.name}</div>
        <div style="color:#cbd5e1;">Equipping any weapon, armor, or relic immediately updates your 24×26 character sprite for all players in the realm!</div>
        <div style="color:#4ade80; margin-top:4px;">
          TOTAL BONUS: <b>+${bonuses.power} Power</b> • <b>+${bonuses.bastion} Bastion</b> • <b>+${bonuses.resonance} Resonance</b> • <b>+${bonuses.tempo} Tempo</b>
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
      ${slots.map((s) => `
        <div style="background:#080c18; border:2px solid #1e293b; padding:8px;">
          <div style="font-family:var(--font-header); font-size:7px; color:#38bdf8; margin-bottom:6px;">${s.title}</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            ${s.items.map((it) => {
              const active = equip[s.key] === it.id;
              return `
                <div style="background:${active ? '#172554' : '#0d1324'}; border:1px solid ${active ? '#facc15' : '#334155'}; padding:5px 6px; cursor:pointer; font-size:8.5px;" onclick="equipPaperdollItem('${it.id}')">
                  <div style="color:${active ? '#fde047' : '#f8fafc'}; font-weight:bold;">${it.icon} ${it.name}</div>
                  <div style="color:#94a3b8; font-size:7.5px;">${it.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const cv = document.getElementById('ingame-paperdoll-canvas');
  if (cv && typeof cv.getContext === 'function') {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#090f20';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const set = getCharacterSprites(faction, classId, equip);
    if (set && set.down && set.down[0]) {
      ctx.drawImage(set.down[0], 6, 5, 72, 78);
    }
  }
}
