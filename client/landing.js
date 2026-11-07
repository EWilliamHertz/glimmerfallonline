// ==========================================
// GlimmerFall Online 2D — Premier Landing Page & Interactive Encyclopedias
// Features:
//   - Full-Screen Pixelated Heaven with Sticky Left Sidebar Nav
//   - Pixelated Items, Armor, Relics, Currencies & 7 Skills to Lv. 99
//   - Official Multicolor Logo (/GlimmerFall_official_multicolor_logo.png)
//   - Massive Modern CSS Inputs for Immediate Character Forging
//   - Dual-Mode Toggle (Single Player 0ms vs Multiplayer 20Hz)
//   - "Start on this site" (Character Loadout vs Landing Page) Persistence
//   - Game Systems Encyclopedia (Combat Formulas, 4 Resources, 8 Classes, 7 Skills, Atlas, 3v3 Arena)
//   - Cosmic Lore & TCG Encyclopedia (Authentic lore & Card Oracle from glimmerfalltcg.com)
//   - Full Smooth Scrolling from Top to Bottom
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

const LOGO_PATH = '/GlimmerFall_official_multicolor_logo.png';
const START_ON_LOADOUT_KEY = 'glimmerfall_start_on_loadout';
const SP_ROSTER_KEY = 'glimmerfall_sp_roster_v2';
const SP_ACTIVE_KEY = 'glimmerfall_sp_active_id';
const PLAY_MODE_KEY = 'glimmerfall_play_mode';

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

const PIXEL_ITEMS = [
  { id: 'dawnblade', name: 'Dawnblade Greatsword', slot: 'Weapon', rarity: 'Legendary', icon: '🗡️', stat: '+24 Radiant Dmg • +8% Holy Crit', color: '#F2A900', desc: 'Forged from Starfall meteorite and quenched in the solar well.' },
  { id: 'sun_shield', name: 'Sunforged Radiance Aegis', slot: 'Shield', rarity: 'Epic', icon: '🛡️', stat: '+45 Armor • +60 Block Value', color: '#F2A900', desc: 'Imbued with the Zenith core. Emits blinding retaliation flashes.' },
  { id: 'astral_crown', name: 'Chronomancer Crown', slot: 'Head', rarity: 'Legendary', icon: '👑', stat: '+18 Arcane • +20 Max Glimmer', color: '#00BFFF', desc: 'Allows the wearer to perceive 3 seconds into adjacent timelines.' },
  { id: 'shadow_cowl', name: 'Duskveil Shadow Cowl', slot: 'Head', rarity: 'Epic', icon: '🦹', stat: '+14 Agility • +12% Stealth Opener', color: '#9B30FF', desc: 'Woven with Graveglass filament that drinks ambient illumination.' },
  { id: 'leyline_boots', name: 'Boots of Leyline Striding', slot: 'Boots', rarity: 'Rare', icon: '🥾', stat: '+15% Move Speed • Zero Leyline Friction', color: '#22E07B', desc: 'Glides over rough cavern terrain and hazardous root tangles.' },
  { id: 'ring_solar', name: 'Ring of the Solar Core', slot: 'Ring', rarity: 'Epic', icon: '💍', stat: '+15 Solar Charge Max • +5 HP/s Regen', color: '#F2A900', desc: 'Warm to the touch even in the frost of the Abyssal Rift.' },
  { id: 'void_rune', name: 'Ancient Void Inscription', slot: 'Rune', rarity: 'Cosmic', icon: '📜', stat: 'Activates 3-Socket Synergy (+22% Dmg)', color: '#9B30FF', desc: 'Decoded from the monolith ruins deep inside Starfall Crater.' },
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic', icon: '💎', stat: 'World Nexus Anchor (25 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
];

const CURRENCIES = [
  { id: 'solar_gold', name: 'Solar Gold', val: '1,420,500', icon: '🪙', color: '#F2A900', desc: 'Universal trade currency of Sanctuary Haven pavilion.' },
  { id: 'glimmer_shards', name: 'Glimmer Shards', val: '350', icon: '🔮', color: '#00BFFF', desc: 'Crystallized leyline resonance extracted from Grand Fonts.' },
  { id: 'chrono_cores', name: 'Chrono Cores', val: '28', icon: '🌀', color: '#38bdf8', desc: 'Pulsing temporal fragments dropped from Mirrorgate bosses.' },
  { id: 'void_remnants', name: 'Void Remnants', val: '115', icon: '🖤', color: '#9B30FF', desc: 'Reaped shadowy essence from the Undercity depths.' },
  { id: 'root_stones', name: 'Root Stones', val: '42', icon: '🌿', color: '#22E07B', desc: 'Ancient stone heart seeds blessed by the canopy elders.' },
];

const PROFESSIONS = [
  { id: 'mining', name: 'Resonance Extraction', lvl: 48, icon: '⛏️', color: '#00BFFF' },
  { id: 'smithing', name: 'Star-Forging', lvl: 35, icon: '🔨', color: '#F2A900' },
  { id: 'weaving', name: 'Leyline Weaving', lvl: 42, icon: '🧵', color: '#22E07B' },
  { id: 'inscription', name: 'Void Inscription', lvl: 29, icon: '📜', color: '#9B30FF' },
  { id: 'alchemy', name: 'Celestial Alchemy', lvl: 51, icon: '🧪', color: '#ec4899' },
  { id: 'rites', name: 'Rites Mastery', lvl: 64, icon: '⚔️', color: '#facc15' },
  { id: 'flashes', name: 'Flashes Mastery', lvl: 58, icon: '⚡', color: '#38bdf8' },
];

export class LandingPageController {
  constructor({ frontpage, onEnterWorld }) {
    this.frontpage = frontpage;
    this.onEnterWorld = onEnterWorld;
    this.isOpen = false;

    // Active View / Sub-sections
    this.activeTab = 'forge';
    this.gameEncSection = 'combat';
    this.loreEncSection = 'shattering';
    this.hoveredItem = null;

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
      window.openLandingPage = (initialTab = null) => this.open(initialTab);
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

    // Smooth scroll to requested section if provided
    if (initialTab && typeof document !== 'undefined') {
      setTimeout(() => {
        const target = document.getElementById(`landing-section-${initialTab}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
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
    } else {
      const fp = document.getElementById('frontpage-overlay');
      if (fp) fp.style.display = 'flex';
    }
  }

  scrollToSection(sectionId) {
    this.playSfx('click');
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
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

  setHoveredItem(item) {
    this.hoveredItem = item;
    const box = document.getElementById('sidebar-item-tooltip');
    if (box) {
      if (item) {
        box.innerHTML = `
          <div class="pixel-gear-tooltip">
            <div class="pixel-gear-tooltip-head">
              <span style="color:${item.color}">${item.name}</span>
              <span style="color:#94a3b8; font-size:9px;">${item.rarity}</span>
            </div>
            <div class="pixel-gear-tooltip-stat">${item.stat}</div>
            <div class="pixel-gear-tooltip-desc">${item.desc}</div>
          </div>
        `;
      } else {
        box.innerHTML = `<div style="text-align:center; font-size:10px; color:rgba(255,255,255,0.3); font-style:italic; margin-top:6px;">Hover item to inspect stats</div>`;
      }
    }
  }

  setFaction(fac) {
    this.selectedFaction = fac;
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

    if (this.frontpage) {
      this.frontpage.playMode = this.playMode;
      if (this.playMode === 'multiplayer') {
        this.frontpage.createCharacter({
          name: finalName,
          faction: this.selectedFaction,
          classId: cls.id,
          orderTag: order.tag,
        }).catch(() => {
          this.frontpage.playSelectedCharacter();
        });
      } else {
        this.frontpage.selectedCharacterId = localStorage.getItem(SP_ACTIVE_KEY);
        this.frontpage.playSelectedCharacter();
      }
    }
  }

  // ==========================================
  // RENDER COMPLETE PIXELATED HEAVEN
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
    const factionClasses = Object.values(CLASSES_CATALOG).filter((c) => c.faction === this.selectedFaction);

    overlay.innerHTML = `
      <div class="landing-shell-layout">
        <!-- ======================================================== -->
        <!-- 1. LEFT STICKY PIXEL SIDEBAR NAVIGATION -->
        <!-- ======================================================== -->
        <aside class="landing-sidebar">
          <!-- Brand Header with Official Logo -->
          <div class="sidebar-header">
            <div class="sidebar-brand-row">
              <div class="sidebar-logo-box">
                <img src="${LOGO_PATH}" alt="GlimmerFall Logo" class="sidebar-logo-img" />
              </div>
              <div>
                <div class="sidebar-brand-name">
                  GLIMMER<span class="text-gold">FALL</span>
                </div>
                <div class="sidebar-server-pill">
                  <span class="sidebar-dot"></span>
                  20Hz MMO &bull; 0ms Offline
                </div>
              </div>
            </div>

            <!-- Mode Selector -->
            <div class="sidebar-mode-grid">
              <button type="button" class="sidebar-mode-btn ${isSingle ? 'active single' : ''}" onclick="window._landing.setPlayMode('singleplayer')">
                🕹️ Offline 0ms
              </button>
              <button type="button" class="sidebar-mode-btn ${!isSingle ? 'active' : ''}" onclick="window._landing.setPlayMode('multiplayer')">
                🌐 Online 20Hz
              </button>
            </div>

            <!-- Quick Awaken CTA -->
            <button type="button" class="sidebar-cta-btn" onclick="window._landing.launchGame()">
              ⚡ AWAKEN IN REALM
            </button>
          </div>

          <!-- Section Nav Links -->
          <div class="sidebar-section">
            <div class="sidebar-nav-list">
              <button type="button" class="sidebar-nav-link" onclick="window._landing.scrollToSection('landing-section-forge')">
                <span>⚔️ Character Forge</span>
                <span style="color:#64748b;">▸</span>
              </button>
              <button type="button" class="sidebar-nav-link" onclick="window._landing.scrollToSection('landing-section-game-enc')">
                <span>🎮 Game Encyclopedia</span>
                <span style="color:#64748b;">▸</span>
              </button>
              <button type="button" class="sidebar-nav-link" onclick="window._landing.scrollToSection('landing-section-lore-enc')">
                <span>📜 Lore &amp; TCG Oracle</span>
                <span style="color:#64748b;">▸</span>
              </button>
              <button type="button" class="sidebar-nav-link" onclick="window._landing.scrollToSection('landing-section-armory')">
                <span>🛡️ Continental Armory</span>
                <span style="color:#64748b;">▸</span>
              </button>
              <button type="button" class="sidebar-nav-link" onclick="window._landing.scrollToSection('landing-section-arena')">
                <span>⚡ 3v3 Nexus Destruction</span>
                <span style="color:#64748b;">▸</span>
              </button>
              <button type="button" class="sidebar-nav-link" onclick="window._landing.scrollToSection('landing-section-atlas')">
                <span>🗺️ Continental World Atlas</span>
                <span style="color:#64748b;">▸</span>
              </button>
              <button type="button" class="sidebar-nav-link special" onclick="window._landing.openLoadout()">
                <span>👤 Open Hero Loadout</span>
                <span>➔</span>
              </button>
            </div>
          </div>

          <!-- Pixel Gear Showcase -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span style="color:#facc15;">🛡️ PIXEL ARMORY PREVIEW</span>
              <span style="font-size:9px; color:#64748b;">Hover slot</span>
            </div>
            <div class="pixel-gear-grid">
              ${PIXEL_ITEMS.map((item, idx) => `
                <div class="pixel-gear-slot"
                     style="border-color:${item.color};"
                     onmouseenter="window._landing.setHoveredItem(window._landing_pixel_items[${idx}])"
                     onmouseleave="window._landing.setHoveredItem(null)">
                  <span>${item.icon}</span>
                  <span class="slot-corner-tag">${item.slot[0]}</span>
                </div>
              `).join('')}
            </div>
            <div id="sidebar-item-tooltip">
              <div style="text-align:center; font-size:10px; color:rgba(255,255,255,0.3); font-style:italic; margin-top:6px;">
                Hover slot to inspect stats
              </div>
            </div>
          </div>

          <!-- Currencies Mini-Vault -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span style="color:#38bdf8;">🪙 LEYLINE VAULT</span>
            </div>
            <div class="sidebar-currency-list">
              ${CURRENCIES.map((curr) => `
                <div class="sidebar-currency-item">
                  <div class="currency-left">
                    <span>${curr.icon}</span>
                    <span>${curr.name}</span>
                  </div>
                  <span class="currency-val" style="color:${curr.color};">${curr.val}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 7 Disciplines Progress -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span style="color:#22e07b;">✨ 7 DISCIPLINES</span>
              <span style="font-size:9.5px; color:#facc15; font-weight:bold;">MAX 99</span>
            </div>
            <div class="sidebar-skills-list">
              ${PROFESSIONS.map((p) => `
                <div class="sidebar-skill-item">
                  <div class="sidebar-skill-header">
                    <span>${p.icon} ${p.name}</span>
                    <span style="color:${p.color};">Lv. ${p.lvl}/99</span>
                  </div>
                  <div class="sidebar-skill-bar-wrap">
                    <div class="sidebar-skill-bar-fill" style="width:${(p.lvl / 99) * 100}%; background-color:${p.color};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Footer & Preferences -->
          <div class="sidebar-footer">
            <label class="sidebar-pref-toggle" title="When checked, visits go directly to this loadout. When unchecked, you start at the landing page.">
              <input type="checkbox" class="start-on-site-cb" ${startOnLoadout ? 'checked' : ''} onchange="window._landing.setStartOnLoadout(this.checked)">
              <span>Start on Loadout view</span>
            </label>
            <div class="sidebar-footer-links">
              <span>&copy; 2026 GlimmerFall</span>
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer">glimmerfalltcg.com ↗</a>
            </div>
          </div>
        </aside>

        <!-- ======================================================== -->
        <!-- 2. MAIN SCROLLABLE PIXEL HEAVEN CONTENT -->
        <!-- ======================================================== -->
        <main class="landing-main-scroll">
          <!-- HERO CARD -->
          <section class="landing-hero-card">
            <div class="hero-content-wrap">
              <div class="hero-logo-row">
                <div class="hero-logo-badge">
                  <img src="${LOGO_PATH}" alt="GlimmerFall Official Logo" class="hero-logo-img" />
                </div>
                <div>
                  <span class="hero-chip-badge">✨ Official 16-Bit Action MMORPG</span>
                  <h1 class="hero-title">
                    GLIMMER<span style="color:#facc15;">FALL</span> ONLINE
                  </h1>
                </div>
              </div>

              <p class="hero-desc">
                Awaken your champion in a living 16-bit action universe. Harvest celestial Glimmer leylines, socket authentic trading card relics from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>, master 7 disciplines to Level 99, and battle in 3v3 Nexus Destruction arenas.
              </p>

              <div class="hero-specs-row">
                <div class="hero-spec-pill">
                  <div class="spec-val" style="color:#38bdf8;">0ms</div>
                  <div class="spec-lbl">Single Player</div>
                </div>
                <div class="hero-spec-pill">
                  <div class="spec-val" style="color:#4ade80;">20 Hz</div>
                  <div class="spec-lbl">Server MMO</div>
                </div>
                <div class="hero-spec-pill">
                  <div class="spec-val" style="color:#facc15;">Lv. 99</div>
                  <div class="spec-lbl">Max Mastery</div>
                </div>
                <div class="hero-spec-pill">
                  <div class="spec-val" style="color:#f87171;">25 HP</div>
                  <div class="spec-lbl">Nexus Rule</div>
                </div>
              </div>

              <div class="hero-cta-row">
                <button type="button" class="hero-btn-primary" onclick="window._landing.launchGame()">
                  <span>⚡</span> AWAKEN CHAMPION NOW
                </button>
                <button type="button" class="hero-btn-secondary" onclick="window._landing.openLoadout()">
                  👤 OPEN IN-GAME LOADOUT
                </button>
              </div>
            </div>
          </section>

          <!-- CHARACTER FORGE -->
          <section id="landing-section-forge" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:#facc1522; color:#facc15; border:1px solid #facc1555;">Forge Your Identity</span>
                <h2 class="section-heading">⚔️ CHAMPION LOADOUT FORGE</h2>
              </div>
              <button type="button" class="btn-dice" onclick="window._landing.randomizeName()">
                🎲 Random Moniker
              </button>
            </div>

            <div class="forge-layout-grid">
              <!-- Controls Column -->
              <div class="forge-controls-col">
                <div>
                  <label style="display:block; font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">
                    1. CHAMPION MONIKER &amp; TITLE
                  </label>
                  <div class="massive-input-wrap">
                    <input
                      type="text"
                      class="massive-text-input"
                      maxlength="18"
                      value="${this.escapeHtml(this.characterName)}"
                      placeholder="Enter champion moniker..."
                      oninput="window._landing.characterName = this.value; const d = document.getElementById('pedestal-display-name'); if (d) d.textContent = this.value || 'Vanguard';"
                    />
                  </div>
                </div>

                <div>
                  <label style="display:block; font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">
                    2. CANONICAL FACTION ALLEGIANCE
                  </label>
                  <div class="factions-cards-grid">
                    ${Object.keys(FACTIONS_META).map((facKey) => {
                      const f = FACTIONS_META[facKey];
                      const isSel = this.selectedFaction === facKey;
                      return `
                        <div class="faction-select-card ${isSel ? 'active' : ''}"
                             style="border-color:${isSel ? f.color : '#1e293b'}; ${isSel ? `background:${f.color}15;` : ''}"
                             onclick="window._landing.setFaction('${facKey}')">
                          <div style="font-family:var(--font-header); font-size:13px; font-weight:bold; color:${f.color};">${facKey}</div>
                          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">${f.name}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div>
                  <label style="display:block; font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">
                    3. PLAYABLE ARCHETYPE &amp; ROLE (${this.selectedFaction})
                  </label>
                  <div class="classes-cards-grid">
                    ${factionClasses.map((c) => {
                      const isSel = this.selectedClassId === c.id;
                      return `
                        <div class="class-select-card ${isSel ? 'active' : ''}"
                             style="border-color:${isSel ? fm.color : '#1e293b'}; ${isSel ? `background:${fm.color}15;` : ''}"
                             onclick="window._landing.setClass('${c.id}')">
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-family:var(--font-header); font-size:13.5px; font-weight:bold; color:#fff;">${c.name}</span>
                            <span style="font-size:9.5px; background:rgba(0,0,0,0.5); padding:1px 6px; border-radius:3px; color:#cbd5e1;">${c.defaultEquipment?.armor?.replace('_', ' ') || 'Armor'}</span>
                          </div>
                          <div style="font-size:11px; font-weight:600; color:${fm.color}; margin-top:3px;">${c.role}</div>
                          <p style="font-size:10.5px; color:#94a3b8; margin-top:4px; line-height:1.4;">${c.desc}</p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div>
                  <label style="display:block; font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">
                    4. ORDER CREST &bull; HERALDRY TAG
                  </label>
                  <div class="order-tags-row">
                    ${ORDER_PRESETS.map((o) => {
                      const isSel = this.selectedOrderTag === o.tag;
                      return `
                        <div class="order-select-btn ${isSel ? 'active' : ''}"
                             style="border-color:${isSel ? o.color : '#1e293b'}; color:${isSel ? o.color : '#cbd5e1'}; ${isSel ? `background:${o.color}18;` : ''}"
                             onclick="window._landing.setOrder('${o.tag}')">
                          <b>[${o.tag}]</b>
                          <div style="font-size:9.5px; opacity:0.8;">${o.name}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>

              <!-- Pedestal Column -->
              <div class="forge-pedestal-col">
                <div class="pedestal-sticky-card">
                  <span style="font-size:9.5px; color:#64748b; font-family:monospace; text-transform:uppercase;">Visage Pedestal Preview</span>
                  <div class="pedestal-avatar-circle">
                    ⚔️
                  </div>
                  <div id="pedestal-display-name" class="pedestal-name-txt">
                    ${this.escapeHtml(this.characterName || 'Vanguard')}
                  </div>
                  <div style="font-size:11.5px; color:#38bdf8; font-weight:600; margin-top:2px;">
                    [${order.tag}] &bull; ${cls.name}
                  </div>
                  <div style="font-size:11px; font-weight:bold; color:${fm.color}; margin-top:2px;">
                    ${fm.name}
                  </div>

                  <div class="pedestal-vitals-grid">
                    <div class="pedestal-vital-box">
                      <div style="font-size:9.5px; color:#64748b; font-weight:bold;">HEALTH</div>
                      <div style="font-family:monospace; font-weight:bold; font-size:13px; color:#4ade80;">❤️ 40 / 40 HP</div>
                    </div>
                    <div class="pedestal-vital-box">
                      <div style="font-size:9.5px; color:#64748b; font-weight:bold;">GLIMMER</div>
                      <div style="font-family:monospace; font-weight:bold; font-size:13px; color:#38bdf8;">🔮 100 Glimmer</div>
                    </div>
                  </div>

                  <div style="background:#091224; border:1px solid #1e293b; border-radius:10px; padding:10px; font-size:11px; color:#cbd5e1; text-align:left; margin-bottom:14px; line-height:1.5;">
                    <div style="display:flex; justify-content:space-between;"><span>Starting Leyline:</span><b>Sanctuary Haven</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>Armor Class:</span><b style="color:#facc15;">${cls.defaultEquipment?.armor?.replace('_', ' ') || 'Plate'}</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>Starter Rite:</span><b style="color:#38bdf8;">${Object.values(cls.defaultLoadout || {})[0]?.replace('_', ' ') || 'Strike'}</b></div>
                  </div>

                  <button type="button" class="sidebar-cta-btn" style="padding:14px; font-size:13px;" onclick="window._landing.launchGame()">
                    ⚡ ENTER GLIMMERFALL
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- GAME SYSTEMS ENCYCLOPEDIA -->
          <section id="landing-section-game-enc" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:#38bdf822; color:#38bdf8; border:1px solid #38bdf855;">Official Reference Manual</span>
                <h2 class="section-heading">🎮 GAME SYSTEMS ENCYCLOPEDIA</h2>
              </div>
              <div class="enc-tab-strip">
                <button type="button" class="enc-switch-btn ${this.gameEncSection === 'combat' ? 'active' : ''}" onclick="window._landing.setGameEncSection('combat')">
                  ⚔️ Combat Formulas
                </button>
                <button type="button" class="enc-switch-btn ${this.gameEncSection === 'resources' ? 'active' : ''}" onclick="window._landing.setGameEncSection('resources')">
                  ⚡ Faction Resources
                </button>
                <button type="button" class="enc-switch-btn ${this.gameEncSection === 'persistence' ? 'active' : ''}" onclick="window._landing.setGameEncSection('persistence')">
                  💾 State Persistence
                </button>
              </div>
            </div>

            <div class="enc-body-wrapper">
              ${this.renderGameEncSection()}
            </div>
          </section>

          <!-- COSMIC LORE & TCG ORACLE -->
          <section id="landing-section-lore-enc" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:#9b30ff22; color:#c084fc; border:1px solid #9b30ff55;">glimmerfalltcg.com Canonical Lore</span>
                <h2 class="section-heading">📜 COSMIC LORE &amp; TCG ORACLE</h2>
              </div>
              <div class="enc-tab-strip">
                <button type="button" class="enc-switch-btn ${this.loreEncSection === 'shattering' ? 'active lore' : ''}" onclick="window._landing.setLoreEncSection('shattering')">
                  🌌 The Great Shattering
                </button>
                <button type="button" class="enc-switch-btn ${this.loreEncSection === 'creeds' ? 'active lore' : ''}" onclick="window._landing.setLoreEncSection('creeds')">
                  🏛️ 4 Faction Creeds
                </button>
                <button type="button" class="enc-switch-btn ${this.loreEncSection === 'cards' ? 'active lore' : ''}" onclick="window._landing.setLoreEncSection('cards')">
                  🃏 TCG Card Relics
                </button>
                <button type="button" class="enc-switch-btn ${this.loreEncSection === 'legends' ? 'active lore' : ''}" onclick="window._landing.setLoreEncSection('legends')">
                  👑 Sanctuary Legends
                </button>
              </div>
            </div>

            <div class="enc-body-wrapper">
              ${this.renderLoreEncSection()}
            </div>
          </section>

          <!-- CONTINENTAL ARMORY -->
          <section id="landing-section-armory" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:#22e07b22; color:#4ade80; border:1px solid #22e07b55;">16-Bit Equipment Catalog</span>
                <h2 class="section-heading">🛡️ PIXEL ARMORY &amp; CRAFTING VAULT</h2>
              </div>
              <span style="font-size:12px; color:#94a3b8;">8 Slots &bull; Socketable Runewords</span>
            </div>

            <div class="armory-items-catalog">
              ${PIXEL_ITEMS.map((item) => `
                <div class="armory-catalog-card">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:24px;">${item.icon}</span>
                    <span style="font-size:9.5px; padding:2px 6px; border-radius:4px; font-weight:bold; background:${item.color}20; color:${item.color};">${item.rarity}</span>
                  </div>
                  <div style="font-family:var(--font-header); font-size:13.5px; font-weight:bold; color:#fff; margin-top:8px;">${item.name}</div>
                  <div style="font-size:11px; color:#38bdf8; font-weight:600; margin-top:3px;">${item.stat}</div>
                  <p style="font-size:10.5px; color:#94a3b8; margin-top:6px; line-height:1.4;">${item.desc}</p>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- 3v3 ARENA -->
          <section id="landing-section-arena" class="landing-section-box" style="border-color:rgba(248,113,113,0.3); background:radial-gradient(circle at 50% 20%, rgba(30,16,16,0.9), #050404);">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.4);">Competitive Rated PvP</span>
                <h2 class="section-heading">⚡ 3v3 OUTPOST NEXUS DESTRUCTION</h2>
              </div>
              <span style="font-family:monospace; font-weight:bold; color:#f87171; font-size:12px;">25-HP MONOLITH RULE</span>
            </div>

            <div class="enc-cards-grid">
              <div class="enc-article-card">
                <h4 style="color:#f87171;">⚔️ Rated Coliseums &amp; Team Synergies</h4>
                <p>Teams of 3 clash in mirror-symmetric coliseums. Coordination between Frontline Bulwarks, Support Marshals, and Burst Assassins dictates lane control and monolith safety.</p>
              </div>
              <div class="enc-article-card">
                <h4 style="color:#f87171;">🛡️ Safe Return Teleport Guarantee</h4>
                <p>Match conclusion automatically teleports players back to their exact pre-arena coordinates, depositing bounty trophies and rated MMR straight into their profiles.</p>
              </div>
            </div>
          </section>

          <!-- WORLD ATLAS -->
          <section id="landing-section-atlas" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:#38bdf822; color:#38bdf8; border:1px solid #38bdf855;">Seamless Continental Traversal</span>
                <h2 class="section-heading">🗺️ CONTINENTAL REALMS ATLAS</h2>
              </div>
              <span style="font-size:12px; color:#94a3b8;">7 Continental Biomes</span>
            </div>

            <div class="enc-cards-grid">
              <div class="enc-article-card" style="border-left:4px solid #facc15;">
                <h4 style="color:#facc15;">Sanctuary Haven &bull; Neutral Hub</h4>
                <p>The bustling city hub housing the Grand Exchange pavilion, AetherVault banks, Celestial Loom, and master crafting artisans.</p>
              </div>
              <div class="enc-article-card" style="border-left:4px solid #facc15;">
                <h4 style="color:#facc15;">Solari Citadel &bull; Sunspire Territory</h4>
                <p>Golden marble towers and sun-temples harvesting celestial dawn radiation to protect against encroaching shadow abominations.</p>
              </div>
              <div class="enc-article-card" style="border-left:4px solid #c084fc;">
                <h4 style="color:#c084fc;">Umbri Undercity &bull; Duskveil Syndicate</h4>
                <p>Subterranean obsidian caverns lit by glowing violet graveglass lanterns, where void resonance is reaped in silence.</p>
              </div>
              <div class="enc-article-card" style="border-left:4px solid #4ade80;">
                <h4 style="color:#4ade80;">Glimmer Orchard &bull; Rootdeep Collective</h4>
                <p>Towering ancient canopy trees with sentient moss, stonekin elders, and pristine untouched planetary leylines.</p>
              </div>
            </div>
          </section>

          <!-- FOOTER -->
          <footer style="text-align:center; padding-top:20px; border-top:1px solid #1e293b; color:#64748b; font-size:11px; line-height:1.6;">
            <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:6px;">
              <img src="${LOGO_PATH}" alt="GlimmerFall" style="height:24px; object-fit:contain;" />
              <b style="color:#fff;">GLIMMERFALL ONLINE</b>
            </div>
            <div>Official 2D Pixel Action MMORPG based on the GlimmerFall Trading Card Game universe.</div>
            <div style="margin-top:4px;">
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:none;">glimmerfalltcg.com</a> &bull;
              <a href="https://glimmerfalltcg.com/cards" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:none; margin:0 6px;">TCG Card Oracle</a> &bull;
              <a href="https://glimmerfalltcg.com/rules" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:none;">Rulebook</a>
            </div>
          </footer>
        </main>
      </div>
    `;

    // Expose pixel items to window for hover lookup
    if (typeof window !== 'undefined') {
      window._landing_pixel_items = PIXEL_ITEMS;
    }
  }

  renderGameEncSection() {
    switch (this.gameEncSection) {
      case 'resources':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card" style="border-left:4px solid #facc15;">
              <h4 style="color:#facc15;">☀️ Solari: Solar Charge &amp; Zenith State</h4>
              <p>Striking enemies accumulates Solar Charge (0-100). Reaching 100 unlocks the blinding Zenith State, boosting movespeed by +25%, generating holy radiance pulses, and resetting Solar Flare cooldown.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">🌙 Umbri: Void Resonance &amp; Dusk Shroud</h4>
              <p>Channeling shadow arts reaps Void Resonance. Spending resonance triggers Dusk Shroud, cloaking the champion from enemy unit frames and guaranteeing lethal critical strikes.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">🌿 Terra: Root Armor &amp; Bramble Retaliation</h4>
              <p>Absorbing physical damage strengthens Root Armor. When shattered by heavy blows, it releases a thorn shockwave that roots all adjacent assailants for 2.5 seconds.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">🌀 Aether: Chronoflux &amp; Reality Rifts</h4>
              <p>Chronoflux dynamically fluctuates across the lattice. Harnessing flux enables the sage to bend projectile paths, reverse ally positioning, and rewrite temporal damage.</p>
            </div>
          </div>
        `;

      case 'persistence':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">❤️ Exact Health &amp; Glimmer Persistence</h4>
              <p>Logging out, disconnecting, or opening the character loadout preserves your exact current HP and Glimmer reservoir down to the single integer. Re-logging returns you with identical charges.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">🏛️ Exact World Coordinate Resuming</h4>
              <p>Your coordinates (roomType, X, Y) are permanently committed to browser storage and PostgreSQL. You always spawn right where you stepped out of the world.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#facc15;">🛡️ Clean Monster Respawn &amp; Aggro Wipe</h4>
              <p>Respawned monsters enforce a 2.0-second spawn grace period. Aggro tethers, dammer lists, and combat targets are wiped completely clean upon respawn.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#c084fc;">⚡ 3v3 Arena Safe Return Teleport</h4>
              <p>Upon winning or losing a 3v3 match, champions are teleported safely back to their exact pre-arena coordinates, retaining all trophies, bounties, and rewards.</p>
            </div>
          </div>
        `;

      case 'combat':
      default:
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#facc15;">🗡️ Attack Cleave Arcs &amp; Hitboxes</h4>
              <p>Melee strikes cover a 90-degree frontal cleave arc spanning 34 pixels. Projectiles travel along omni-directional vectors with 16px radius hit detection.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">⏱️ 1.5s Global Cooldown &amp; Spell Queuing</h4>
              <p>All casted Rites and instant Flashes obey a 1.5s GCD. Inputs registered within 0.3s of GCD completion are queued automatically, enabling butter-smooth combo chains.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">🛡️ Hyperbolic Armor Mitigation</h4>
              <p>Incoming damage undergoes hyperbolic reduction: <code>Reduction = Armor / (Armor + 100)</code>. Heavy plate wearers achieve up to 65% passive physical mitigation.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#c084fc;">💥 Critical Strike Scaling</h4>
              <p>Base critical strikes inflict 150% damage. Investing in the Flashes skill and socketing TCG relics elevates critical chance by up to +12% and damage multipliers beyond 220%.</p>
            </div>
          </div>
        `;
    }
  }

  renderLoreEncSection() {
    switch (this.loreEncSection) {
      case 'creeds':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card" style="border-left:4px solid #facc15;">
              <h4 style="color:#facc15;">The Sunspire Dominion &bull; "May the Sunspire illuminate the darkness"</h4>
              <p>Sentinels of the eternal Daystar. Construct soaring gilded spires to capture raw solar leylines, burning away shadow taint with unyielding martial discipline.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">The Duskveil Syndicate &bull; "In shadows we weave, in silence we strike"</h4>
              <p>Operating in the subterranean Undercity, they wield void resonance and graveglass lanterns, maintaining that shadow is the ultimate truth and protection.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">The Rootdeep Collective &bull; "Stand unyielding as ancient stone"</h4>
              <p>Guardians of the giant canopy in Glimmer Orchard. They defend ancient stone bedrock and oppose reckless technological mining of planetary leylines.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">The Astral Conclave &bull; "Time and space bend to the arcane truth"</h4>
              <p>Scholars of the Mirrorgate Spire. Viewing all history as an intricate tapestry of threads, they accelerate time and tear reality rifts to rewrite battle outcomes.</p>
            </div>
          </div>
        `;

      case 'cards':
        return `
          <div class="enc-cards-grid">
            <div class="tcg-card-item">
              <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp" class="tcg-card-img" />
              <div>
                <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#facc15;">Solari Vanguard</div>
                <div style="font-size:10px; color:#38bdf8; font-weight:bold;">+15% Radiant Slash Damage</div>
                <div style="font-size:9.5px; color:#94a3b8; margin-top:3px;">Socketable TCG Relic (glimmerfalltcg.com)</div>
              </div>
            </div>

            <div class="tcg-card-item">
              <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp" class="tcg-card-img" />
              <div>
                <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#facc15;">Dawnblade Templar</div>
                <div style="font-size:10px; color:#38bdf8; font-weight:bold;">+10% Critical Strike Chance</div>
                <div style="font-size:9.5px; color:#94a3b8; margin-top:3px;">Socketable TCG Relic (glimmerfalltcg.com)</div>
              </div>
            </div>

            <div class="tcg-card-item">
              <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp" class="tcg-card-img" />
              <div>
                <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#38bdf8;">Mana Crystal</div>
                <div style="font-size:10px; color:#38bdf8; font-weight:bold;">+25 Max Glimmer &amp; Rapid Regen</div>
                <div style="font-size:9.5px; color:#94a3b8; margin-top:3px;">Socketable TCG Relic (glimmerfalltcg.com)</div>
              </div>
            </div>

            <div class="tcg-card-item">
              <img src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp" class="tcg-card-img" />
              <div>
                <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#38bdf8;">Chronocore Prism</div>
                <div style="font-size:10px; color:#38bdf8; font-weight:bold;">World Nexus Monolith (25 HP Rule)</div>
                <div style="font-size:9.5px; color:#94a3b8; margin-top:3px;">Socketable TCG Relic (glimmerfalltcg.com)</div>
              </div>
            </div>
          </div>
        `;

      case 'legends':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#facc15;">✨ Herald Aurora &bull; Voice of the Leylines</h4>
              <p>Celestial emissary standing at Sanctuary Haven spawn. Guides new champions through their first Rite awakenings and Awakening Isle quests.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">💎 Moira the Relic-Seeker</h4>
              <p>Grandmaster of Resonance Extraction. Stationed beside the mineral seams south of Sanctuary Haven, teaching extraction from Grand Fonts.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">🔨 Blacksmith Torvin</h4>
              <p>Master of the Cosmic Star-Anvil. Smelts celestial ores into alloy ingots and hammers masterwork platebodies, blades, and socketed armor.</p>
            </div>
          </div>
        `;

      case 'shattering':
      default:
        return `
          <div class="enc-article-card" style="padding:22px;">
            <h4 style="color:#facc15; font-size:15px;">The Cataclysm of the Shattered Leylines</h4>
            <p style="margin-top:8px; line-height:1.6; color:#cbd5e1;">
              In the First Age of the continent, the celestial Starfall tore through the astral canopy, embedding cosmic Glimmer veins into the bedrock of the world.
              The leyline harmonic split into four distinct frequencies: radiant Solar fire, subterranean Void resonance, enduring Living Root, and fluid Chronoflux.
              Sanctuary Haven stands as the sacred neutral haven where mortal champions master these cosmic powers to hold back the encroaching Abyssal Rift.
            </p>
          </div>
        `;
    }
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
