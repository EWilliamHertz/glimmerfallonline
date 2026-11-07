// ==========================================
// GlimmerFall Online 2D — Premier Landing Page & Interactive Encyclopedias
// Features:
//   - Full-Screen Modern Glassmorphic Landing Experience
//   - Massive Modern CSS Inputs for Immediate Character Forging
//   - Dual-Mode Toggle (Single Player 0ms vs Multiplayer 20Hz)
//   - "Start on this site" (Character Loadout vs Landing Page) Persistence
//   - Game Systems Encyclopedia (Combat Formulas, 4 Resources, 8 Classes, 7 Skills, Atlas, 3v3 Arena)
//   - Cosmic Lore & TCG Encyclopedia (Authentic lore & Card Oracle from glimmerfalltcg.com)
// ==========================================

import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  FACTIONS_META,
  CLASSES_CATALOG,
  PROFESSIONS_CATALOG,
  ORDER_PRESETS,
  createDefaultProgression,
} from '../shared/protocol.js';

const START_ON_LOADOUT_KEY = 'glimmerfall_start_on_loadout';
const SP_ROSTER_KEY = 'glimmerfall_sp_roster_v2';
const SP_ACTIVE_KEY = 'glimmerfall_sp_active_id';
const PLAY_MODE_KEY = 'glimmerfall_play_mode';

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

export class LandingPageController {
  constructor({ frontpage, onEnterWorld }) {
    this.frontpage = frontpage;
    this.onEnterWorld = onEnterWorld;
    this.isOpen = false;

    // Active View / Tab: 'forge' | 'game_encyclopedia' | 'lore_encyclopedia' | 'arena' | 'realms'
    this.activeTab = 'forge';
    this.gameEncSection = 'combat';
    this.loreEncSection = 'shattering';

    // Character Forge State
    this.characterName = 'Aurelia';
    this.playMode = 'singleplayer';
    this.selectedFaction = 'Solari';
    this.selectedClassId = 'solari_vanguard';
    this.selectedOrderTag = 'SUN';
    this.soundEnabled = true;

    // Load initial playMode
    try {
      const savedMode = localStorage.getItem(PLAY_MODE_KEY);
      if (savedMode === 'multiplayer' || savedMode === 'singleplayer') {
        this.playMode = savedMode;
      }
    } catch (_) {}

    // Expose globally for inline event handlers
    if (typeof window !== 'undefined') {
      window._landing = this;
      window.openLandingPage = () => this.open();
      window.setStartOnSiteToggle = (checked) => this.setStartOnLoadout(checked);
    }
  }

  getStartOnLoadout() {
    try {
      return localStorage.getItem(START_ON_LOADOUT_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  setStartOnLoadout(checked) {
    try {
      localStorage.setItem(START_ON_LOADOUT_KEY, checked ? 'true' : 'false');
    } catch (_) {}

    // Sync all checkboxes on page
    if (typeof document !== 'undefined') {
      const cbs = document.querySelectorAll('.start-on-site-cb');
      cbs.forEach((cb) => {
        cb.checked = Boolean(checked);
      });
    }
  }

  playSfx(type = 'click') {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'launch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (_) {}
  }

  open(initialTab = null) {
    this.isOpen = true;
    if (initialTab) this.activeTab = initialTab;

    // Close in-game character loadout overlay if open
    const fpOverlay = document.getElementById('frontpage-overlay');
    if (fpOverlay) fpOverlay.style.display = 'none';

    let overlay = document.getElementById('landing-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'landing-overlay';
      overlay.className = 'landing-overlay';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';

    this.render();
  }

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('landing-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  openLoadout() {
    this.playSfx('click');
    this.close();
    if (this.frontpage) {
      this.frontpage.open();
    }
  }

  setTab(tab) {
    this.activeTab = tab;
    this.playSfx('click');
    this.render();
  }

  setGameEncSection(section) {
    this.gameEncSection = section;
    this.playSfx('click');
    this.render();
  }

  setLoreEncSection(section) {
    this.loreEncSection = section;
    this.playSfx('click');
    this.render();
  }

  setFaction(fac) {
    this.selectedFaction = fac;
    // Set default class for faction
    const classes = Object.values(CLASSES_CATALOG).filter((c) => c.faction === fac);
    if (classes.length > 0) {
      this.selectedClassId = classes[0].id;
    }
    this.playSfx('click');
    this.render();
  }

  setClass(classId) {
    this.selectedClassId = classId;
    this.playSfx('click');
    this.render();
  }

  setOrder(tag) {
    this.selectedOrderTag = tag;
    this.playSfx('click');
    this.render();
  }

  setPlayMode(mode) {
    this.playMode = mode;
    try {
      localStorage.setItem(PLAY_MODE_KEY, mode);
    } catch (_) {}
    if (this.frontpage) {
      this.frontpage.playMode = mode;
    }
    this.playSfx('click');
    this.render();
  }

  randomizeName() {
    const pick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(Math.random() * 89 + 10);
    this.characterName = `${pick}_${num}`;
    this.playSfx('click');
    this.render();
  }

  launchGame() {
    this.playSfx('launch');
    const finalName = (this.characterName || 'Vanguard').trim().slice(0, 18);
    const order = ORDER_PRESETS.find((o) => o.tag === this.selectedOrderTag) || ORDER_PRESETS[0];
    const cls = CLASSES_CATALOG[this.selectedClassId] || CLASSES_CATALOG.solari_vanguard;

    // Seed local storage with configured character so game loads it immediately
    try {
      localStorage.setItem(PLAY_MODE_KEY, this.playMode);

      const newCharId = `char_${Date.now()}`;
      const newChar = {
        id: newCharId,
        name: finalName,
        faction: this.selectedFaction,
        classId: cls.id,
        orderTag: order.tag,
        orderName: order.name,
        orderColor: order.color,
        homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        hp: 40,
        solarCharge: this.selectedFaction === 'Solari' ? 0 : 20,
        lastPosition: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 96 },
        loadout: { ...cls.defaultLoadout },
        equipment: { ...cls.defaultEquipment },
        inventory: [
          { id: 'solar_gold', qty: 60 },
          { id: 'boots_of_haste', qty: 1 },
        ],
        bank: [],
        progression: createDefaultProgression(),
      };

      const rawRoster = localStorage.getItem(SP_ROSTER_KEY);
      let roster = [];
      try {
        roster = rawRoster ? JSON.parse(rawRoster) : [];
      } catch (_) {}

      const existingIdx = roster.findIndex((c) => c.name.toLowerCase() === finalName.toLowerCase());
      if (existingIdx >= 0) {
        roster[existingIdx] = { ...roster[existingIdx], ...newChar };
        localStorage.setItem(SP_ACTIVE_KEY, roster[existingIdx].id);
      } else {
        roster.unshift(newChar);
        localStorage.setItem(SP_ACTIVE_KEY, newCharId);
      }
      localStorage.setItem(SP_ROSTER_KEY, JSON.stringify(roster));
    } catch (e) {
      console.error(e);
    }

    this.close();

    // If frontpage is available, play selected character
    if (this.frontpage) {
      this.frontpage.playMode = this.playMode;
      this.frontpage.selectedCharacterId = localStorage.getItem(SP_ACTIVE_KEY);
      this.frontpage.playSelectedCharacter();
    }
  }

  // ==========================================
  // Render Function & View Templates
  // ==========================================
  render() {
    if (typeof document === 'undefined') return '';
    const overlay = document.getElementById('landing-overlay');
    if (!overlay) return '';

    const startOnLoadout = this.getStartOnLoadout();
    const isSingle = this.playMode === 'singleplayer';
    const fm = FACTIONS_META[this.selectedFaction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[this.selectedClassId] || CLASSES_CATALOG.solari_vanguard;
    const order = ORDER_PRESETS.find((o) => o.tag === this.selectedOrderTag) || ORDER_PRESETS[0];

    overlay.innerHTML = `
      <div class="landing-page-shell">
        <!-- TOP NAVIGATION BAR -->
        <header class="landing-nav">
          <div class="landing-nav-inner">
            <div class="landing-brand">
              <span class="brand-title">GLIMMER<span class="text-gold">FALL</span></span>
              <span class="brand-badge">2D PIXEL MMORPG</span>
              <span class="server-status-pill">
                <span class="status-dot"></span>
                20Hz Authoritative &bull; 0ms Offline
              </span>
            </div>

            <!-- Navigation Tabs -->
            <nav class="landing-tabs">
              <button class="nav-tab ${this.activeTab === 'forge' ? 'active' : ''}" onclick="window._landing.setTab('forge')">
                ⚔️ Character Forge
              </button>
              <button class="nav-tab ${this.activeTab === 'game_encyclopedia' ? 'active' : ''}" onclick="window._landing.setTab('game_encyclopedia')">
                🎮 Game Encyclopedia
              </button>
              <button class="nav-tab ${this.activeTab === 'lore_encyclopedia' ? 'active' : ''}" onclick="window._landing.setTab('lore_encyclopedia')">
                📜 Lore &amp; TCG Oracle
              </button>
              <button class="nav-tab ${this.activeTab === 'arena' ? 'active' : ''}" onclick="window._landing.setTab('arena')">
                ⚡ 3v3 Arena
              </button>
              <button class="nav-tab ${this.activeTab === 'realms' ? 'active' : ''}" onclick="window._landing.setTab('realms')">
                🗺️ World Atlas
              </button>
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" class="nav-tab tcg-link">
                🃏 GlimmerfallTCG.com ↗
              </a>
            </nav>

            <!-- Actions & Preferences -->
            <div class="landing-nav-actions">
              <label class="landing-pref-toggle" title="When enabled, visiting the game boots directly into the loadout view.">
                <input type="checkbox" class="start-on-site-cb" ${startOnLoadout ? 'checked' : ''} onchange="window._landing.setStartOnLoadout(this.checked)">
                <span>Start on this site</span>
              </label>

              <button class="btn-loadout-link" onclick="window._landing.openLoadout()" title="Open In-Game Character Roster & Pedestal">
                👤 Character Loadout
              </button>
            </div>
          </div>
        </header>

        <!-- MAIN BODY CONTENT ROUTER -->
        <main class="landing-main">
          ${this.renderActiveTabContent()}
        </main>

        <!-- FOOTER -->
        <footer class="landing-footer">
          <div class="footer-inner">
            <div class="footer-brand">
              <b class="text-gold">GLIMMERFALL ONLINE</b> &bull; 16-Bit Top-Down Action MMORPG
              <p class="footer-sub">Based on the Glimmerfall TCG Universe &bull; <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer">glimmerfalltcg.com</a></p>
            </div>
            <div class="footer-links">
              <a href="https://glimmerfalltcg.com/rules" target="_blank" rel="noreferrer">Rulebook</a>
              <a href="https://glimmerfalltcg.com/cards" target="_blank" rel="noreferrer">Card Oracle</a>
              <a href="https://glimmerfalltcg.com/community" target="_blank" rel="noreferrer">Community</a>
              <a href="https://glimmerfalltcg.com/stores" target="_blank" rel="noreferrer">Store Locator</a>
            </div>
            <div class="footer-copy">&copy; 2026 GlimmerFall. All rights reserved.</div>
          </div>
        </footer>
      </div>
    `;
  }

  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'game_encyclopedia':
        return this.renderGameEncyclopedia();
      case 'lore_encyclopedia':
        return this.renderLoreEncyclopedia();
      case 'arena':
        return this.renderArenaSpotlight();
      case 'realms':
        return this.renderRealmsAtlas();
      case 'forge':
      default:
        return this.renderForgeAndOverview();
    }
  }

  // ==========================================
  // VIEW 1: HERO & INTERACTIVE CHARACTER FORGE
  // ==========================================
  renderForgeAndOverview() {
    const isSingle = this.playMode === 'singleplayer';
    const fm = FACTIONS_META[this.selectedFaction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[this.selectedClassId] || CLASSES_CATALOG.solari_vanguard;
    const order = ORDER_PRESETS.find((o) => o.tag === this.selectedOrderTag) || ORDER_PRESETS[0];
    const factionClasses = Object.values(CLASSES_CATALOG).filter((c) => c.faction === this.selectedFaction);

    return `
      <!-- HERO BANNER -->
      <section class="landing-hero-banner">
        <div class="hero-badge-row">
          <span class="hero-chip">✨ OFFICIAL 16-BIT 2D PIXEL MMORPG</span>
          <span class="hero-chip alt">4 FACTIONS &bull; 8 CLASSES &bull; 7 PROFESSIONS</span>
        </div>
        <h1 class="hero-headline">
          AWAKEN YOUR <span class="text-gold">CHAMPION</span> IN THE REALM OF GLIMMER
        </h1>
        <p class="hero-subtext">
          Enter an authentic top-down action MMORPG inspired by classic 16-bit RPGs. Harvest cosmic Glimmer leylines, socket authentic trading card relics, master 7 professions to Level 99, and battle in 3v3 Nexus Destruction arenas.
        </p>

        <div class="hero-specs-row">
          <div class="spec-card">
            <span class="spec-val">0ms</span>
            <span class="spec-label">Singleplayer Latency</span>
          </div>
          <div class="spec-card">
            <span class="spec-val">20 Hz</span>
            <span class="spec-label">Authoritative Server</span>
          </div>
          <div class="spec-card">
            <span class="spec-val">99</span>
            <span class="spec-label">Max Skill Level</span>
          </div>
          <div class="spec-card">
            <span class="spec-val">25 HP</span>
            <span class="spec-label">Nexus Destruction Rule</span>
          </div>
        </div>
      </section>

      <!-- MASSIVE MODERN CHARACTER LOADOUT FORGE -->
      <section class="landing-forge-section" id="forge-anchor">
        <div class="forge-container panel">
          <div class="forge-header">
            <div>
              <h2 class="forge-title">⚔️ FORGE CHAMPION LOADOUT</h2>
              <p class="forge-sub">Configure your moniker, realm mode, faction, and class with massive modern controls, then step into the world.</p>
            </div>
            <div class="forge-header-right">
              <label class="landing-pref-toggle">
                <input type="checkbox" class="start-on-site-cb" ${this.getStartOnLoadout() ? 'checked' : ''} onchange="window._landing.setStartOnLoadout(this.checked)">
                <span>Start on this site</span>
              </label>
            </div>
          </div>

          <div class="forge-grid">
            <!-- LEFT COLUMN: MASSIVE CONTROLS -->
            <div class="forge-controls">
              <!-- INPUT 1: MASSIVE MODERN MONIKER INPUT -->
              <div class="form-group">
                <div class="form-label-row">
                  <label class="massive-label">CHAMPION MONIKER &amp; COGNOMEN</label>
                  <span class="char-count">${this.characterName.length}/18</span>
                </div>
                <div class="massive-input-wrap">
                  <input
                    type="text"
                    class="massive-text-input"
                    maxlength="18"
                    value="${this.escapeHtml(this.characterName)}"
                    placeholder="Enter champion moniker..."
                    oninput="window._landing.characterName = this.value; document.getElementById('pedestal-name-display').textContent = this.value || 'Vanguard';"
                  />
                  <button type="button" class="btn-dice" onclick="window._landing.randomizeName()" title="Randomize Fantasy Name">
                    🎲 Randomize
                  </button>
                </div>
              </div>

              <!-- INPUT 2: PLAY MODE TOGGLE (SINGLE VS MULTI) -->
              <div class="form-group">
                <label class="massive-label">SELECT REALM PLAY MODE</label>
                <div class="mode-cards-grid">
                  <button type="button"
                          class="mode-card ${isSingle ? 'active' : ''}"
                          onclick="window._landing.setPlayMode('singleplayer')">
                    <div class="mode-card-header">
                      <span class="mode-title">🕹️ Single Player Realm</span>
                      ${isSingle ? '<span class="mode-pill active">ACTIVE</span>' : ''}
                    </div>
                    <p class="mode-desc"><b>0ms local latency</b> &bull; Private offline world running completely client-side in browser storage.</p>
                  </button>

                  <button type="button"
                          class="mode-card ${!isSingle ? 'active' : ''}"
                          onclick="window._landing.setPlayMode('multiplayer')">
                    <div class="mode-card-header">
                      <span class="mode-title">🌐 Multiplayer MMO</span>
                      ${!isSingle ? '<span class="mode-pill active">ACTIVE</span>' : ''}
                    </div>
                    <p class="mode-desc">Authoritative <b>20Hz server</b> &bull; Real-time player sync, open-world Nexus PvP &amp; 3v3 Arena.</p>
                  </button>
                </div>
              </div>

              <!-- INPUT 3: FACTION SELECTOR -->
              <div class="form-group">
                <label class="massive-label">CHOOSE CANONICAL FACTION ALLEGIANCE</label>
                <div class="factions-pill-grid">
                  ${Object.keys(FACTIONS_META).map((facKey) => {
                    const f = FACTIONS_META[facKey];
                    const isSelected = this.selectedFaction === facKey;
                    return `
                      <button type="button"
                              class="faction-pill-btn ${isSelected ? 'selected' : ''}"
                              style="border-color:${isSelected ? f.color : '#334155'}; ${isSelected ? `background:${f.color}22; box-shadow:0 0 16px ${f.color}44;` : ''}"
                              onclick="window._landing.setFaction('${facKey}')">
                        <span class="fac-name" style="color:${f.color}; font-weight:800;">${f.name}</span>
                        <span class="fac-sub">${f.homeBiome.replace('_', ' ')}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- INPUT 4: CLASS & ARCHETYPE SELECTOR -->
              <div class="form-group">
                <label class="massive-label">SELECT PLAYABLE ARCHETYPE (${this.selectedFaction})</label>
                <div class="classes-choice-grid">
                  ${factionClasses.map((c) => {
                    const isSelected = this.selectedClassId === c.id;
                    return `
                      <button type="button"
                              class="class-choice-card ${isSelected ? 'selected' : ''}"
                              style="border-color:${isSelected ? fm.color : '#334155'}; ${isSelected ? `background:${fm.color}18;` : ''}"
                              onclick="window._landing.setClass('${c.id}')">
                        <div class="class-choice-top">
                          <b class="class-choice-name">${c.name}</b>
                          <span class="class-choice-armor">${c.defaultEquipment?.armor?.replace('_', ' ') || 'Armor'}</span>
                        </div>
                        <div class="class-choice-role" style="color:${fm.color};">${c.role}</div>
                        <p class="class-choice-desc">${c.desc}</p>
                        <div class="class-starter-box">
                          <span>Primary Starter:</span>
                          <b>${Object.values(c.defaultLoadout || {})[0]?.replace('_', ' ') || 'Flare Strike'}</b>
                        </div>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- INPUT 5: ORDER CREST TAG SELECTOR -->
              <div class="form-group">
                <label class="massive-label">ORDER CREST &bull; HERALDRY TAG</label>
                <div class="order-tags-grid">
                  ${ORDER_PRESETS.map((o) => {
                    const isSelected = this.selectedOrderTag === o.tag;
                    return `
                      <button type="button"
                              class="order-tag-btn ${isSelected ? 'selected' : ''}"
                              style="border-color:${isSelected ? o.color : '#334155'}; color:${isSelected ? o.color : '#cbd5e1'}; ${isSelected ? `background:${o.color}20;` : ''}"
                              onclick="window._landing.setOrder('${o.tag}')">
                        <b>[${o.tag}]</b>
                        <span>${o.name}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: PEDESTAL PREVIEW & LAUNCH -->
            <div class="forge-pedestal-panel">
              <div class="pedestal-card">
                <span class="pedestal-eyebrow">CHAMPION VISAGE PREVIEW</span>

                <div class="pedestal-avatar-box">
                  <div class="pedestal-avatar-icon">⚔️</div>
                  <h3 id="pedestal-name-display" class="pedestal-name" style="color:#fff;">
                    ${this.escapeHtml(this.characterName || 'Vanguard')}
                  </h3>
                  <div class="pedestal-sub">
                    <span style="color:${order.color}; font-weight:bold;">[${order.tag}]</span>
                    <span>&bull;</span>
                    <span style="color:#f8fafc; font-weight:600;">${cls.name}</span>
                  </div>
                  <div class="pedestal-faction" style="color:${fm.color}; font-size:11px; margin-top:2px;">
                    ${fm.name} Dominion
                  </div>
                </div>

                <div class="pedestal-vitals-row">
                  <div class="vital-pill">
                    <span class="vital-label">Vital Integrity</span>
                    <span class="vital-val text-green">❤️ 40 / 40 HP</span>
                  </div>
                  <div class="vital-pill">
                    <span class="vital-label">Glimmer Reservoir</span>
                    <span class="vital-val text-blue">🔮 100 Glimmer</span>
                  </div>
                </div>

                <div class="pedestal-anchor-box">
                  <span>🏛️ Starting Leyline Anchor:</span>
                  <b>Awakening Sanctuary Hub</b>
                </div>

                <!-- Action Bar Preview -->
                <div class="pedestal-bar-preview">
                  <span class="bar-label">ACTION HOTBAR PREVIEW</span>
                  <div class="bar-slots-row">
                    <div class="mini-slot active"><span class="slot-num">[1]</span><span class="slot-ab">Primary</span></div>
                    <div class="mini-slot"><span class="slot-num">[2]</span><span class="slot-ab">Rite</span></div>
                    <div class="mini-slot"><span class="slot-num">[3]</span><span class="slot-ab">Spell</span></div>
                    <div class="mini-slot"><span class="slot-num">[4]</span><span class="slot-ab">Burst</span></div>
                  </div>
                </div>

                <!-- MASSIVE AWAKEN BUTTON -->
                <button type="button" class="btn-massive-awaken" onclick="window._landing.launchGame()">
                  ⚡ AWAKEN IN GLIMMERFALL
                </button>
                <div class="awaken-hint">Zero download &bull; Instant browser launch</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================
  // VIEW 2: GAME SYSTEMS ENCYCLOPEDIA
  // ==========================================
  renderGameEncyclopedia() {
    return `
      <section class="encyclopedia-container">
        <div class="enc-header panel">
          <div class="enc-badge">🎮 OFFICIAL GAME SYSTEMS ENCYCLOPEDIA</div>
          <h2 class="enc-title">Mechanics, Combat Formulas &amp; World Rules</h2>
          <p class="enc-sub">A definitive reference manual for GlimmerFall Online's 16-bit action combat, 4 faction resources, 8 classes, and 7 professions.</p>

          <!-- Section Switcher Tabs -->
          <div class="enc-nav-pills">
            <button class="enc-tab-btn ${this.gameEncSection === 'combat' ? 'active' : ''}" onclick="window._landing.setGameEncSection('combat')">
              ⚔️ Combat Dynamics
            </button>
            <button class="enc-tab-btn ${this.gameEncSection === 'resources' ? 'active' : ''}" onclick="window._landing.setGameEncSection('resources')">
              ⚡ Faction Resources
            </button>
            <button class="enc-tab-btn ${this.gameEncSection === 'classes' ? 'active' : ''}" onclick="window._landing.setGameEncSection('classes')">
              🛡️ 8 Playable Classes
            </button>
            <button class="enc-tab-btn ${this.gameEncSection === 'skills' ? 'active' : ''}" onclick="window._landing.setGameEncSection('skills')">
              📜 7 Skills to Lv. 99
            </button>
            <button class="enc-tab-btn ${this.gameEncSection === 'persistence' ? 'active' : ''}" onclick="window._landing.setGameEncSection('persistence')">
              💾 State Persistence
            </button>
          </div>
        </div>

        <div class="enc-body panel">
          ${this.renderGameEncSection()}
        </div>
      </section>
    `;
  }

  renderGameEncSection() {
    switch (this.gameEncSection) {
      case 'resources':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">The 4 Canonical Faction Resource Mechanics</h3>
            <p>Every faction in GlimmerFall possesses a dedicated mechanical engine that dictates playstyle and burst cycles:</p>

            <div class="enc-card-grid">
              <div class="enc-article-card" style="border-left:4px solid #facc15;">
                <h4 style="color:#facc15;">☀️ Solari: Solar Charge &amp; Zenith State</h4>
                <p><b>Meter:</b> 0 to 100 Solar Charge.<br>
                   <b>Generation:</b> Striking with Flare Strike and channelled Daystar abilities grants Solar Charge.<br>
                   <b>Zenith State:</b> Reaching 100 Solar Charge triggers the blinding <i>Zenith State</i>, granting <b>+25% movement speed</b>, <b>+15% damage reduction</b>, and unleashing pulsing holy radiance that damages adjacent enemies every second.</p>
              </div>

              <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
                <h4 style="color:#38bdf8;">🔮 Aether: Astral Resonance &amp; Spacetime Warp</h4>
                <p><b>Meter:</b> 0 to 4 Astral Resonance Stacks + Mana Pool.<br>
                   <b>Generation:</b> Casting Reality Fractures and temporal spells generates resonance.<br>
                   <b>Mechanic:</b> Each stack increases Cast Speed by 6% and accelerates cooldown recovery. At 4 stacks, Chronomancers can open <i>Gravity Singularities</i> that pull and freeze groups of foes.</p>
              </div>

              <div class="enc-article-card" style="border-left:4px solid #4ade80;">
                <h4 style="color:#4ade80;">🌿 Terra: Primal Fury &amp; Living Stoneplate</h4>
                <p><b>Meter:</b> 0 to 100 Primal Fury + Living Stoneplate Defense.<br>
                   <b>Generation:</b> Absorbing damage and striking with heavy stone mauls builds Primal Fury.<br>
                   <b>Thornbark Reflect:</b> When active, stoneplate armor reflects <b>20% melee damage</b> back to attackers and unleashes seismic shockwaves that stun targets.</p>
              </div>

              <div class="enc-article-card" style="border-left:4px solid #c084fc;">
                <h4 style="color:#c084fc;">🌙 Umbri: Shadow Energy &amp; Dusk Points</h4>
                <p><b>Meter:</b> Shadow Energy (100 Cap) + Dusk Combo Points (1 to 5).<br>
                   <b>Generation:</b> Striking from stealth generates 2 instant Dusk Points; Siphon Soul builds additional points.<br>
                   <b>Finisher:</b> Consuming 5 Dusk Points detonates the target with <i>Unmake</i>, dealing up to <b>350% critical damage</b>.</p>
              </div>
            </div>
          </div>
        `;

      case 'classes':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">All 8 Playable Archetypes &bull; Combat Roles &amp; Loadouts</h3>
            <p>Each class starts equipped with specialized faction armor, weapons, and a clean Action Bar configured with their signature starting ability:</p>

            <div class="enc-card-grid">
              ${Object.values(CLASSES_CATALOG).map((c) => {
                const fm = FACTIONS_META[c.faction] || FACTIONS_META.Solari;
                return `
                  <div class="enc-article-card" style="border-top:3px solid ${fm.color};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <h4 style="color:#f8fafc; font-size:14px;">${c.name}</h4>
                      <span style="color:${fm.color}; font-size:10.5px; font-weight:bold;">${c.faction}</span>
                    </div>
                    <div style="font-size:11px; color:#cbd5e1; margin:4px 0 8px 0;"><b>${c.role}</b></div>
                    <p style="font-size:11px; color:#94a3b8; line-height:1.5;">${c.desc}</p>
                    <div style="margin-top:10px; font-size:10px; background:#080e1c; padding:6px 8px; border:1px solid #1e293b; border-radius:4px;">
                      <span>Weapon: <b style="color:#fff;">${c.defaultEquipment?.weapon?.replace('_', ' ') || 'None'}</b></span><br>
                      <span>Armor: <b style="color:#fff;">${c.defaultEquipment?.armor?.replace('_', ' ') || 'None'}</b></span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;

      case 'skills':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">The 7 Authentic Skills &bull; 99-Level Progression &amp; Skillcapes</h3>
            <p>Every skill features dedicated interactive training nodes, recipe tables, and prestigious Level 99 Mastery Capes:</p>

            <div class="enc-card-grid">
              ${Object.values(PROFESSIONS_CATALOG).map((p) => `
                <div class="enc-article-card" style="border-left:4px solid ${p.color};">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="color:#f8fafc; font-size:14px;">${p.icon} ${p.name}</h4>
                    <span style="font-size:10px; color:${p.color}; font-weight:bold;">${p.category}</span>
                  </div>
                  <div style="font-size:11px; color:#facc15; margin:3px 0 6px 0;">${p.passiveSummary}</div>
                  <p style="font-size:11px; color:#94a3b8; line-height:1.4;">${p.description}</p>
                  <div style="margin-top:8px; font-size:10px; background:#080e1c; padding:6px 8px; border:1px solid #1e293b; border-radius:4px;">
                    <span style="color:#38bdf8; font-weight:bold;">Training:</span> ${p.training?.howTo || p.quickStart}<br>
                    <span style="color:#4ade80; font-weight:bold;">Milestones:</span> ${p.training?.milestones || 'Level 99 Mastery Cape'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

      case 'persistence':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">Architectural State Persistence &amp; Anti-Aggro Protocol</h3>
            <p>GlimmerFall Online implements complete persistence across login, logout, and server restart events:</p>

            <div class="enc-card-grid">
              <div class="enc-article-card">
                <h4>❤️ Exact Health &amp; Glimmer Persistence</h4>
                <p>When you log out, disconnect, or return to the character loadout, your current <b>HP</b> and <b>Glimmer (Solar Charge)</b> are saved down to the single unit. Upon re-logging, you return with the exact same vitals.</p>
              </div>

              <div class="enc-article-card">
                <h4>🏛️ Exact World Coordinate Resuming</h4>
                <p>Your character's exact world position <code>lastPosition: { roomType, x, y }</code> is recorded on both singleplayer browser storage and PostgreSQL. You always spawn right where you stepped out of the world.</p>
              </div>

              <div class="enc-article-card">
                <h4>🛡️ Clean Monster Respawn &amp; Aggro Reset</h4>
                <p>Respawned monsters enforce a <b>2.0-second spawn grace period</b>. When a mob respawns or a player dies, all previous aggro tethers, dammer lists, and combat targets are wiped completely clean.</p>
              </div>

              <div class="enc-article-card">
                <h4>⚡ 3v3 Arena Safe Return Teleport</h4>
                <p>Upon winning or losing a 3v3 Nexus match, you are automatically teleported back to the exact pre-arena coordinate where you queued, retaining all rewards and trophies.</p>
              </div>
            </div>
          </div>
        `;

      case 'combat':
      default:
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">Action Combat System &amp; Damage Formulas</h3>
            <p>GlimmerFall utilizes real-time top-down 8-directional action combat with client-side prediction and authoritative server confirmation:</p>

            <div class="enc-card-grid">
              <div class="enc-article-card">
                <h4>🗡️ Attack Cleave Arcs &amp; Hitboxes</h4>
                <p>Melee attacks strike within a 90-degree front arc extending 34 pixels. Projectiles travel along directional vectors with 16px radius hit detection. Holding mouse or using WASD provides fluid omni-directional targeting.</p>
              </div>

              <div class="enc-article-card">
                <h4>⏱️ 1.5s Global Cooldown &amp; Spell Queueing</h4>
                <p>All casted Rites and instant Flashes obey a 1.5s GCD. If an ability is pressed within 0.3s of GCD completion, it is queued automatically, enabling seamless, zero-lag combo chains.</p>
              </div>

              <div class="enc-article-card">
                <h4>🛡️ Armor &amp; Damage Mitigation</h4>
                <p>Armor mitigates physical strikes using the hyperbolic curve <code>Reduction = Armor / (Armor + 100)</code>. Heavy plate wearers achieve up to 65% passive mitigation against physical cleaves.</p>
              </div>

              <div class="enc-article-card">
                <h4>💥 Critical Strike Scaling</h4>
                <p>Base critical strikes inflict 150% damage. Investing in the Flashes skill and socketing TCG relics elevates critical chance by up to +11.8% and critical damage multipliers beyond 220%.</p>
              </div>
            </div>
          </div>
        `;
    }
  }

  // ==========================================
  // VIEW 3: LORE & TCG ENCYCLOPEDIA (from glimmerfalltcg.com)
  // ==========================================
  renderLoreEncyclopedia() {
    return `
      <section class="encyclopedia-container">
        <div class="enc-header panel" style="border-color:#38bdf8;">
          <div class="enc-badge" style="background:#0284c722; color:#38bdf8; border-color:#0284c7;">
            📜 COSMIC LORE &amp; TCG ORACLE
          </div>
          <h2 class="enc-title">Chronicles of the Shattered Leylines</h2>
          <p class="enc-sub">Authentic universe lore, faction doctrines, and trading card relics sourced directly from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#7dd3fc; text-decoration:underline;">glimmerfalltcg.com</a>.</p>

          <div class="enc-nav-pills">
            <button class="enc-tab-btn ${this.loreEncSection === 'shattering' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('shattering')">
              🌌 The Great Shattering
            </button>
            <button class="enc-tab-btn ${this.loreEncSection === 'creeds' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('creeds')">
              🏛️ The 4 Faction Creeds
            </button>
            <button class="enc-tab-btn ${this.loreEncSection === 'cards' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('cards')">
              🃏 TCG Card Relics Oracle
            </button>
            <button class="enc-tab-btn ${this.loreEncSection === 'legends' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('legends')">
              👑 Celestial Legends &amp; NPCs
            </button>
          </div>
        </div>

        <div class="enc-body panel">
          ${this.renderLoreEncSection()}
        </div>
      </section>
    `;
  }

  renderLoreEncSection() {
    switch (this.loreEncSection) {
      case 'creeds':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">The 4 Faction Creeds &bull; Philosophy &amp; Doctrine</h3>

            <div class="enc-card-grid">
              <div class="enc-article-card" style="border-left:4px solid #facc15;">
                <h4 style="color:#facc15;">The Sunspire Dominion &bull; "May the Sunspire illuminate the darkness"</h4>
                <p>The Solari believe the descent of the Starfall was a divine covenant. By constructing gilded Sunspires, they channel pure radiant energy to burn away void taint. Their warriors embrace the <i>Oath of the Daystar</i>, fighting without retreat.</p>
              </div>

              <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
                <h4 style="color:#38bdf8;">The Astral Conclave &bull; "Time and space bend to the arcane truth"</h4>
                <p>Operating from Mirrorgate Spire, the Chronomancers view the cosmos as an intricate lattice of leylines. They believe all moments coexist simultaneously and that manipulating Glimmer frequencies allows rewriting cause and effect.</p>
              </div>

              <div class="enc-article-card" style="border-left:4px solid #4ade80;">
                <h4 style="color:#4ade80;">The Rootdeep Collective &bull; "Stand unyielding as ancient stone"</h4>
                <p>Dwelling beneath the giant canopies of Glimmer Orchard, the Terra shamans commune with the living earth. They regard stone and briar as sentient ancestors and oppose technological extraction of leylines, defending nature with crushing fury.</p>
              </div>

              <div class="enc-article-card" style="border-left:4px solid #c084fc;">
                <h4 style="color:#c084fc;">The Duskveil Syndicate &bull; "In shadows we weave, in silence we strike"</h4>
                <p>In the subterranean depths of the Umbri Undercity, the Syndicate reaps void resonance. They hold that darkness is not evil, but the ultimate shroud of truth. Through Graveglass Lanterns, they capture escaping soul remnants.</p>
              </div>
            </div>
          </div>
        `;

      case 'cards':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">Official TCG Card Relics Oracle (glimmerfalltcg.com)</h3>
            <p>Every trading card in the Glimmerfall universe can be socketed into your champion's relic slots to awaken passive traits:</p>

            <div class="enc-card-grid">
              <div class="enc-article-card" style="display:flex; gap:12px; align-items:center;">
                <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp" style="width:60px; height:84px; border-radius:6px; object-fit:cover;">
                <div>
                  <h4 style="color:#facc15;">Solari Vanguard</h4>
                  <span style="font-size:10px; color:#38bdf8; font-weight:bold;">+15% Radiant Slash Damage</span>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:3px;">"Frontline sentinel of the Sunspire Dominion. Unyielding in faith and unshakeable in battle."</p>
                </div>
              </div>

              <div class="enc-article-card" style="display:flex; gap:12px; align-items:center;">
                <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp" style="width:60px; height:84px; border-radius:6px; object-fit:cover;">
                <div>
                  <h4 style="color:#facc15;">Dawnblade Templar</h4>
                  <span style="font-size:10px; color:#38bdf8; font-weight:bold;">+10% Critical Strike Chance</span>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:3px;">"Their consecrated steel shines brighter than the morning star."</p>
                </div>
              </div>

              <div class="enc-article-card" style="display:flex; gap:12px; align-items:center;">
                <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp" style="width:60px; height:84px; border-radius:6px; object-fit:cover;">
                <div>
                  <h4 style="color:#38bdf8;">Mana Crystal</h4>
                  <span style="font-size:10px; color:#38bdf8; font-weight:bold;">+25 Max Glimmer &amp; Rapid Regen</span>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:3px;">"Pure crystallized Aether vibrating with celestial harmonics."</p>
                </div>
              </div>

              <div class="enc-article-card" style="display:flex; gap:12px; align-items:center;">
                <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp" style="width:60px; height:84px; border-radius:6px; object-fit:cover;">
                <div>
                  <h4 style="color:#4ade80;">Granite Behemoth</h4>
                  <span style="font-size:10px; color:#38bdf8; font-weight:bold;">+350 Max Armor &amp; Threat</span>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:3px;">"Carved from the bedrock of the ancient continent."</p>
                </div>
              </div>

              <div class="enc-article-card" style="display:flex; gap:12px; align-items:center;">
                <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp" style="width:60px; height:84px; border-radius:6px; object-fit:cover;">
                <div>
                  <h4 style="color:#c084fc;">Void Stalker</h4>
                  <span style="font-size:10px; color:#38bdf8; font-weight:bold;">+25% Stealth Opener Damage</span>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:3px;">"A whisper in the shadows before the scythe descends."</p>
                </div>
              </div>

              <div class="enc-article-card" style="display:flex; gap:12px; align-items:center;">
                <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp" style="width:60px; height:84px; border-radius:6px; object-fit:cover;">
                <div>
                  <h4 style="color:#38bdf8;">Chronocore Prism</h4>
                  <span style="font-size:10px; color:#38bdf8; font-weight:bold;">World Nexus Monolith (25 HP Rule)</span>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:3px;">"The beating heart of the dimensional anchor."</p>
                </div>
              </div>
            </div>
          </div>
        `;

      case 'legends':
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">Celestial Legends &amp; Sanctuary NPCs</h3>
            <p>Sanctuary Haven is home to venerable instructors and legendary artisans who guide your path:</p>

            <div class="enc-card-grid">
              <div class="enc-article-card">
                <h4>✨ Herald Aurora &bull; Voice of the Leylines</h4>
                <p>The celestial emissary standing at Sanctuary spawn. She guides new champions through the Awakening Isle tutorial and grants their first Rite blessings.</p>
              </div>

              <div class="enc-article-card">
                <h4>💎 Moira the Relic-Seeker</h4>
                <p>Grandmaster of Resonance Extraction. Stationed beside the mineral seams south of Sanctuary Haven, she teaches the arts of extracting pure Glimmer.</p>
              </div>

              <div class="enc-article-card">
                <h4>🔨 Blacksmith Torvin</h4>
                <p>Master of the Cosmic Star-Anvil. Smelts celestial ores into alloy ingots and hammers masterwork platebodies, blades, and socketed armor.</p>
              </div>

              <div class="enc-article-card">
                <h4>🧵 Artisan Aldric &bull; The Loomweaver</h4>
                <p>Keeper of the Celestial Loom. Spins starry fibres into enchanted bags, satchels, and arcane starweave vestments.</p>
              </div>
            </div>
          </div>
        `;

      case 'shattering':
      default:
        return `
          <div class="enc-content-block">
            <h3 class="enc-heading">The Great Shattering &amp; The Descent of Glimmer</h3>
            <p>In the first age of the cosmos, a monolithic crystal known as the <b>First Leyline</b> floated in equilibrium above the world, anchoring light, time, matter, and void in harmony.</p>
            <p>During the catastrophic event remembered as <i>The Glimmerfall</i>, a fracture ripped across the cosmic firmament. The monolith shattered into a celestial shower of starry meteors that struck the continents, forming the <b>Starfall Crater</b> and releasing liquid crystalline Glimmer deep into the earth.</p>
            <p>From the crater emerged the four primal alignments. Now, as the Abyssal Rift deepens, the factions must awaken their champions to secure the Shattered Nexus Shard before the cosmos succumbs to eternal unmaking.</p>
          </div>
        `;
    }
  }

  // ==========================================
  // VIEW 4: 3v3 ARENA SPOTLIGHT
  // ==========================================
  renderArenaSpotlight() {
    return `
      <section class="encyclopedia-container">
        <div class="enc-header panel" style="border-color:#ef4444;">
          <div class="enc-badge" style="background:#ef444422; color:#ef4444; border-color:#ef4444;">
            ⚔️ RANKED 3v3 ARENA MODE
          </div>
          <h2 class="enc-title">Nexus Destruction Arena &bull; 25 HP Monolith Clash</h2>
          <p class="enc-sub">Team-based competitive combat with automated post-match return teleportation.</p>
        </div>

        <div class="enc-body panel">
          <div class="enc-content-block">
            <h3 class="enc-heading">Match Objective &amp; Mechanics</h3>
            <div class="enc-card-grid">
              <div class="enc-article-card">
                <h4 style="color:#38bdf8;">The 25-HP Nexus Rule</h4>
                <p>Both teams defend their own faction Monolith possessing exactly <b>25 Hit Points</b>. Spells and melee strikes chip away at monolith integrity. The first squad to shatter the rival Nexus claims continental victory.</p>
              </div>

              <div class="enc-article-card">
                <h4 style="color:#facc15;">Energy Font Control</h4>
                <p>Controlling the central Aether Font grants your squad rapid Glimmer replenishment, allowing your caster to channel continuous Rites and barriers.</p>
              </div>

              <div class="enc-article-card">
                <h4 style="color:#4ade80;">Exact Spot Return Teleport</h4>
                <p>Whether victorious or defeated, the moment the match concludes your champion is <b>teleported back to the exact world location</b> where you clicked the arena queue portal.</p>
              </div>
            </div>

            <div style="text-align:center; margin-top:20px;">
              <button class="btn-massive-awaken" onclick="window._landing.setTab('forge')" style="max-width:320px; margin:0 auto;">
                ⚔️ Forge Champion &amp; Enter Queue
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================
  // VIEW 5: CONTINENTAL REALMS ATLAS
  // ==========================================
  renderRealmsAtlas() {
    return `
      <section class="encyclopedia-container">
        <div class="enc-header panel" style="border-color:#4ade80;">
          <div class="enc-badge" style="background:#4ade8022; color:#4ade80; border-color:#4ade80;">
            🗺️ CONTINENTAL ATLAS
          </div>
          <h2 class="enc-title">Realms, Strongholds &amp; Seamless Dungeons</h2>
          <p class="enc-sub">Traverse safe havens, faction biomes, and seamless edge-boundary dungeons.</p>
        </div>

        <div class="enc-body panel">
          <div class="enc-card-grid">
            ${Object.values(ROOM_CONFIGS).map((r) => `
              <div class="enc-article-card">
                <h4>🏛️ ${r.title}</h4>
                <span style="font-size:10px; color:#38bdf8; font-weight:bold;">${r.roomType || 'Continental Realm'}</span>
                <p style="font-size:11px; color:#94a3b8; margin-top:4px;">
                  Zone Dimensions: ${r.width || 800}px &times; ${r.height || 600}px<br>
                  BGM Theme: <code>${r.bgm || 'sanctuary'}</code><br>
                  Spawn Spot: (${r.spawnX || 0}, ${r.spawnY || 96})
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
