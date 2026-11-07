// ==========================================
// GlimmerFall Online 2D — Premier Landing Page & Interactive Encyclopedias
// Pixelated Heaven • Sticky Sidebar Navigation • Gear & Currencies
// 7 Disciplines to Lv. 99 • Official Logo • Smooth Scrolling
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
const LOGO_SRC = '/GlimmerFall_official_multicolor_logo.png';

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

export const PIXEL_ITEMS = [
  { id: 'dawnblade', name: 'Dawnblade Greatsword', slot: 'Weapon', rarity: 'Legendary', icon: '🗡️', stat: '+24 Radiant Dmg • +8% Holy Crit', color: '#F2A900', desc: 'Forged from Starfall meteorite and quenched in the solar well.' },
  { id: 'sun_shield', name: 'Sunforged Radiance Aegis', slot: 'Shield', rarity: 'Epic', icon: '🛡️', stat: '+45 Armor • +60 Block Value', color: '#F2A900', desc: 'Imbued with the Zenith core. Emits blinding retaliation flashes.' },
  { id: 'astral_crown', name: 'Chronomancer Crown', slot: 'Head', rarity: 'Legendary', icon: '👑', stat: '+18 Arcane • +20 Max Glimmer', color: '#00BFFF', desc: 'Allows the wearer to perceive 3 seconds into adjacent timelines.' },
  { id: 'shadow_cowl', name: 'Duskveil Shadow Cowl', slot: 'Head', rarity: 'Epic', icon: '🦹', stat: '+14 Agility • +12% Stealth Opener', color: '#9B30FF', desc: 'Woven with Graveglass filament that drinks ambient illumination.' },
  { id: 'leyline_boots', name: 'Boots of Leyline Striding', slot: 'Boots', rarity: 'Rare', icon: '🥾', stat: '+15% Move Speed • Zero Leyline Friction', color: '#22E07B', desc: 'Glides over rough cavern terrain and hazardous root tangles.' },
  { id: 'ring_solar', name: 'Ring of the Solar Core', slot: 'Ring', rarity: 'Epic', icon: '💍', stat: '+15 Solar Charge Max • +5 HP/s Regen', color: '#F2A900', desc: 'Warm to the touch even in the frost of the Abyssal Rift.' },
  { id: 'void_rune', name: 'Ancient Void Inscription', slot: 'Rune', rarity: 'Cosmic', icon: '📜', stat: 'Activates 3-Socket Synergy (+22% Dmg)', color: '#9B30FF', desc: 'Decoded from the monolith ruins deep inside Starfall Crater.' },
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic', icon: '💎', stat: 'World Nexus Anchor (25 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
];

export const LEYLINE_CURRENCIES = [
  { id: 'solar_gold', name: 'Solar Gold', val: '1,420,500', icon: '🪙', color: '#F2A900' },
  { id: 'glimmer_shards', name: 'Glimmer Shards', val: '350', icon: '🔮', color: '#00BFFF' },
  { id: 'chrono_cores', name: 'Chrono Cores', val: '28', icon: '🌀', color: '#38bdf8' },
  { id: 'void_remnants', name: 'Void Remnants', val: '115', icon: '🖤', color: '#9B30FF' },
  { id: 'root_stones', name: 'Root Stones', val: '42', icon: '🌿', color: '#22E07B' },
];

export const DISCIPLINES = [
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

    this.activeTab = 'forge';
    this.gameEncSection = 'combat';
    this.loreEncSection = 'shattering';
    this.hoveredItemId = null;

    // Character Forge State
    this.characterName = 'Aurelia';
    this.playMode = 'singleplayer';
    this.selectedFaction = 'Solari';
    this.selectedClassId = 'solari_vanguard';
    this.selectedOrderTag = 'SUN';
    this.soundEnabled = true;

    try {
      const savedMode = localStorage.getItem(PLAY_MODE_KEY);
      if (savedMode === 'multiplayer' || savedMode === 'singleplayer') {
        this.playMode = savedMode;
      }
    } catch (_) {}

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
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (_) {}
  }

  open(initialTab = null) {
    this.isOpen = true;
    if (initialTab) {
      this.activeTab = initialTab;
    }

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

    if (initialTab && typeof document !== 'undefined') {
      const targetEl = document.getElementById(initialTab);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
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
    } else if (typeof window !== 'undefined' && window.openFrontpage) {
      window.openFrontpage();
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

  setHoveredItem(itemId) {
    this.hoveredItemId = itemId;
    this.render();
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
    } else if (typeof window !== 'undefined') {
      window.location.href = `/?mode=${this.playMode}&autostart=1`;
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==========================================
  // Render Function
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
    const hoveredItemObj = PIXEL_ITEMS.find((it) => it.id === this.hoveredItemId);

    overlay.innerHTML = `
      <div class="landing-shell-layout">
        <!-- ========================================== -->
        <!-- 1. LEFT STICKY PIXEL SIDEBAR NAVIGATION -->
        <!-- ========================================== -->
        <aside class="landing-sidebar">
          <!-- Sidebar Header & Logo -->
          <div class="sidebar-header">
            <div class="sidebar-brand-row">
              <div class="sidebar-logo-box">
                <img src="${LOGO_SRC}" alt="GlimmerFall Official Logo" class="sidebar-logo-img" />
              </div>
              <div>
                <div class="sidebar-brand-name">
                  GLIMMER<span class="text-gold">FALL</span>
                </div>
                <div class="sidebar-server-pill">
                  <span class="sidebar-dot"></span>
                  20Hz Server &bull; 0ms Local
                </div>
              </div>
            </div>

            <!-- Single vs Multiplayer Mode -->
            <div class="sidebar-mode-grid">
              <button type="button"
                      class="sidebar-mode-btn ${isSingle ? 'active single' : ''}"
                      onclick="window._landing.setPlayMode('singleplayer')">
                🕹️ Offline 0ms
              </button>
              <button type="button"
                      class="sidebar-mode-btn ${!isSingle ? 'active' : ''}"
                      onclick="window._landing.setPlayMode('multiplayer')">
                🌐 Online 20Hz
              </button>
            </div>

            <!-- Quick Awaken CTA -->
            <button type="button" class="sidebar-cta-btn" onclick="window._landing.launchGame()">
              ⚡ AWAKEN IN REALM
            </button>
          </div>

          <!-- Navigation Links -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span>EXPLORE REALM</span>
            </div>
            <div class="sidebar-nav-list">
              <a href="#forge" class="sidebar-nav-link" onclick="document.getElementById('forge')?.scrollIntoView({behavior:'smooth'})">
                <span>⚔️ Character Forge</span>
                <span style="color:#facc15;">▸</span>
              </a>
              <a href="#game-encyclopedia" class="sidebar-nav-link" onclick="document.getElementById('game-encyclopedia')?.scrollIntoView({behavior:'smooth'})">
                <span>🎮 Game Systems Enc.</span>
                <span style="color:#38bdf8;">▸</span>
              </a>
              <a href="#lore-tcg" class="sidebar-nav-link" onclick="document.getElementById('lore-tcg')?.scrollIntoView({behavior:'smooth'})">
                <span>📜 Cosmic Lore &amp; TCG</span>
                <span style="color:#c084fc;">▸</span>
              </a>
              <a href="#armory" class="sidebar-nav-link" onclick="document.getElementById('armory')?.scrollIntoView({behavior:'smooth'})">
                <span>🛡️ Continental Armory</span>
                <span style="color:#4ade80;">▸</span>
              </a>
              <a href="#arena" class="sidebar-nav-link" onclick="document.getElementById('arena')?.scrollIntoView({behavior:'smooth'})">
                <span>⚡ 3v3 Nexus Arena</span>
                <span style="color:#f87171;">▸</span>
              </a>
              <a href="#atlas" class="sidebar-nav-link" onclick="document.getElementById('atlas')?.scrollIntoView({behavior:'smooth'})">
                <span>🗺️ World Atlas</span>
                <span style="color:#38bdf8;">▸</span>
              </a>
              <button type="button" class="sidebar-nav-link special" onclick="window._landing.openLoadout()">
                <span>👤 Open Hero Loadout</span>
                <span>⚙️</span>
              </button>
            </div>
          </div>

          <!-- Pixel Items Showcase -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span>PIXEL ARMORY</span>
              <span style="color:#facc15; font-size:9.5px;">HOVER INFO</span>
            </div>
            <div class="pixel-gear-grid">
              ${PIXEL_ITEMS.map((item) => `
                <div class="pixel-gear-slot"
                     style="${this.hoveredItemId === item.id ? `border-color:${item.color}; transform:scale(1.08);` : ''}"
                     onmouseenter="window._landing.setHoveredItem('${item.id}')"
                     onmouseleave="window._landing.setHoveredItem(null)">
                  <span>${item.icon}</span>
                  <span class="slot-corner-tag">${item.slot[0]}</span>
                </div>
              `).join('')}
            </div>

            ${hoveredItemObj ? `
              <div class="pixel-gear-tooltip">
                <div class="pixel-gear-tooltip-head" style="color:${hoveredItemObj.color}">
                  <span>${hoveredItemObj.name}</span>
                  <span style="font-size:8.5px; padding:1px 4px; background:rgba(255,255,255,0.1); border-radius:3px;">${hoveredItemObj.rarity}</span>
                </div>
                <div class="pixel-gear-tooltip-stat">${hoveredItemObj.stat}</div>
                <div class="pixel-gear-tooltip-desc">${hoveredItemObj.desc}</div>
              </div>
            ` : `
              <div style="font-size:9.5px; color:#64748b; text-align:center; margin-top:8px; font-style:italic;">
                Hover over slots to inspect stats
              </div>
            `}
          </div>

          <!-- Currencies Vault -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span style="color:#38bdf8;">CURRENCIES</span>
              <span style="font-size:9px; color:#94a3b8;">TREASURY</span>
            </div>
            <div class="sidebar-currency-list">
              ${LEYLINE_CURRENCIES.map((c) => `
                <div class="sidebar-currency-item">
                  <div class="currency-left">
                    <span>${c.icon}</span>
                    <span>${c.name}</span>
                  </div>
                  <span class="currency-val" style="color:${c.color}">${c.val}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 7 Disciplines Tracker -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <span style="color:#4ade80;">7 DISCIPLINES</span>
              <span style="color:#facc15; font-size:9.5px;">MAX 99</span>
            </div>
            <div class="sidebar-skills-list">
              ${DISCIPLINES.map((d) => `
                <div class="sidebar-skill-item">
                  <div class="sidebar-skill-header">
                    <span>${d.icon} ${d.name}</span>
                    <span style="color:${d.color}">Lv. ${d.lvl}/99</span>
                  </div>
                  <div class="sidebar-skill-bar-wrap">
                    <div class="sidebar-skill-bar-fill" style="width:${(d.lvl / 99) * 100}%; background:${d.color};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Sidebar Footer -->
          <div class="sidebar-footer">
            <label class="sidebar-pref-toggle">
              <input type="checkbox"
                     class="start-on-site-cb"
                     ${startOnLoadout ? 'checked' : ''}
                     onchange="window._landing.setStartOnLoadout(this.checked)" />
              <span>Start on this site</span>
            </label>
            <div class="sidebar-footer-links">
              <span>&copy; 2026 GlimmerFall</span>
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer">glimmerfalltcg.com ↗</a>
            </div>
          </div>
        </aside>

        <!-- ========================================== -->
        <!-- 2. MAIN SCROLLABLE CONTENT AREA -->
        <!-- ========================================== -->
        <main class="landing-main-scroll">
          <!-- HERO BANNER -->
          <section class="landing-hero-card">
            <div class="hero-content-wrap">
              <div class="hero-logo-row">
                <div class="hero-logo-badge">
                  <img src="${LOGO_SRC}" alt="GlimmerFall Logo" class="hero-logo-img" />
                </div>
                <div>
                  <span class="hero-chip-badge">✨ OFFICIAL 2D PIXEL MMORPG</span>
                  <h1 class="hero-title">
                    AWAKEN YOUR <span style="color:#facc15;">CHAMPION</span> IN THE REALM OF GLIMMER
                  </h1>
                </div>
              </div>

              <p class="hero-desc">
                Step into an authentic top-down action MMORPG inspired by classic 16-bit RPG masterworks.
                Harvest cosmic Glimmer leylines, socket authentic trading card relics from
                <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>,
                master 7 disciplines to Level 99, and battle in 3v3 Outpost Nexus destruction arenas.
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
                  <span>👤</span> OPEN HERO LOADOUT
                </button>
              </div>
            </div>
          </section>

          <!-- CHARACTER FORGE SECTION -->
          <section id="forge" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(242,169,0,0.15); color:#facc15; border:1px solid rgba(242,169,0,0.3);">
                  FORGE IDENTITY
                </span>
                <h2 class="section-heading">⚔️ CHAMPION LOADOUT FORGE</h2>
              </div>
              <div style="font-size:11px; color:#94a3b8;">
                Customize moniker, faction allegiance &amp; archetype
              </div>
            </div>

            <div class="forge-layout-grid">
              <div class="forge-controls-col">
                <!-- Moniker Input -->
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase;">
                      1. CHAMPION MONIKER &amp; COGNOMEN
                    </label>
                    <span style="font-size:10px; color:#64748b;">${this.characterName.length}/18</span>
                  </div>
                  <div class="massive-input-wrap">
                    <input
                      type="text"
                      class="massive-text-input"
                      maxlength="18"
                      value="${this.escapeHtml(this.characterName)}"
                      placeholder="Enter champion moniker..."
                      oninput="window._landing.characterName = this.value; const d = document.getElementById('pedestal-name-display'); if(d) d.textContent = this.value || 'Vanguard';"
                    />
                    <button type="button" class="btn-dice" onclick="window._landing.randomizeName()">
                      🎲 Random
                    </button>
                  </div>
                </div>

                <!-- Factions -->
                <div>
                  <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:block;">
                    2. CANONICAL FACTION ALLEGIANCE
                  </label>
                  <div class="factions-cards-grid">
                    ${Object.keys(FACTIONS_META).map((facKey) => {
                      const f = FACTIONS_META[facKey];
                      const isSel = this.selectedFaction === facKey;
                      return `
                        <div class="faction-select-card ${isSel ? 'active' : ''}"
                             style="${isSel ? `border-color:${f.color}; background:${f.color}18;` : ''}"
                             onclick="window._landing.setFaction('${facKey}')">
                          <div style="font-family:var(--font-header); font-size:13px; font-weight:bold; color:${f.color};">
                            ${facKey}
                          </div>
                          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">${f.name}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                <!-- Classes -->
                <div>
                  <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:block;">
                    3. PLAYABLE ARCHETYPE (${this.selectedFaction})
                  </label>
                  <div class="classes-cards-grid">
                    ${factionClasses.map((c) => {
                      const isSel = this.selectedClassId === c.id;
                      return `
                        <div class="class-select-card ${isSel ? 'active' : ''}"
                             style="${isSel ? `border-color:${fm.color}; background:${fm.color}15;` : ''}"
                             onclick="window._landing.setClass('${c.id}')">
                          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <span style="font-family:var(--font-header); font-size:13px; font-weight:bold; color:#fff;">${c.name}</span>
                            <span style="font-size:9.5px; padding:1px 6px; border-radius:4px; background:#080e1c; border:1px solid #1e293b; color:#94a3b8;">${c.defaultEquipment?.armor?.replace('_', ' ') || 'Armor'}</span>
                          </div>
                          <div style="font-size:10.5px; font-weight:600; color:${fm.color}; margin-top:3px;">${c.role}</div>
                          <p style="font-size:10.5px; color:#94a3b8; margin-top:6px; line-height:1.4;">${c.desc}</p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                <!-- Order Heraldry -->
                <div>
                  <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:block;">
                    4. ORDER CREST &bull; HERALDRY
                  </label>
                  <div class="order-tags-row">
                    ${ORDER_PRESETS.map((o) => {
                      const isSel = this.selectedOrderTag === o.tag;
                      return `
                        <button type="button"
                                class="order-select-btn ${isSel ? 'active' : ''}"
                                style="${isSel ? `border-color:${o.color}; color:${o.color};` : ''}"
                                onclick="window._landing.setOrder('${o.tag}')">
                          <div style="font-family:monospace; font-weight:900; font-size:11px;">[${o.tag}]</div>
                          <div style="font-size:9.5px; color:#94a3b8;">${o.name}</div>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>

              <!-- Pedestal Column -->
              <div class="forge-pedestal-col">
                <div class="pedestal-sticky-card">
                  <div style="font-size:9.5px; color:#64748b; font-weight:bold; text-transform:uppercase; letter-spacing:0.6px;">
                    VISAGE PREVIEW
                  </div>
                  <div class="pedestal-avatar-circle">
                    ⚔️
                  </div>
                  <div id="pedestal-name-display" class="pedestal-name-txt">
                    ${this.escapeHtml(this.characterName || 'Vanguard')}
                  </div>
                  <div style="font-size:11px; color:#38bdf8; font-weight:600; margin-top:2px;">
                    [${order.tag}] &bull; ${cls.name}
                  </div>
                  <div style="font-size:10.5px; color:${fm.color}; font-weight:bold; margin-top:2px;">
                    ${fm.name}
                  </div>

                  <div class="pedestal-vitals-grid">
                    <div class="pedestal-vital-box">
                      <div style="font-size:9.5px; color:#64748b; font-weight:bold;">HEALTH</div>
                      <div style="color:#4ade80; font-weight:bold; font-size:12px;">❤️ 40 / 40 HP</div>
                    </div>
                    <div class="pedestal-vital-box">
                      <div style="font-size:9.5px; color:#64748b; font-weight:bold;">GLIMMER</div>
                      <div style="color:#38bdf8; font-weight:bold; font-size:12px;">🔮 100 Glimmer</div>
                    </div>
                  </div>

                  <button type="button" class="sidebar-cta-btn" style="padding:14px; font-size:12px;" onclick="window._landing.launchGame()">
                    ⚡ AWAKEN IN GLIMMERFALL
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- GAME SYSTEMS ENCYCLOPEDIA -->
          <section id="game-encyclopedia" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
                  GAME SYSTEMS
                </span>
                <h2 class="section-heading">🎮 GAME SYSTEMS ENCYCLOPEDIA</h2>
              </div>
              <div class="enc-tab-strip">
                <button type="button" class="enc-switch-btn ${this.gameEncSection === 'combat' ? 'active' : ''}" onclick="window._landing.setGameEncSection('combat')">
                  ⚔️ Combat Dynamics
                </button>
                <button type="button" class="enc-switch-btn ${this.gameEncSection === 'resources' ? 'active' : ''}" onclick="window._landing.setGameEncSection('resources')">
                  ⚡ 4 Faction Resources
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
          <section id="lore-tcg" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(155,48,255,0.15); color:#c084fc; border:1px solid rgba(155,48,255,0.3);">
                  glimmerfalltcg.com LORE
                </span>
                <h2 class="section-heading">📜 COSMIC LORE &amp; TCG ORACLE</h2>
              </div>
              <div class="enc-tab-strip">
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'shattering' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('shattering')">
                  🌌 The Great Shattering
                </button>
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'creeds' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('creeds')">
                  🏛️ 4 Faction Creeds
                </button>
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'cards' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('cards')">
                  🃏 TCG Card Relics
                </button>
              </div>
            </div>

            <div class="enc-body-wrapper">
              ${this.renderLoreEncSection()}
            </div>
          </section>

          <!-- CONTINENTAL ARMORY -->
          <section id="armory" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3);">
                  EQUIPMENT CATALOG
                </span>
                <h2 class="section-heading">🛡️ CONTINENTAL ARMORY &amp; RELICS</h2>
              </div>
              <span style="font-size:11px; color:#94a3b8;">8 Item Slots &bull; Runeword Synergy</span>
            </div>

            <div class="armory-items-catalog">
              ${PIXEL_ITEMS.map((item) => `
                <div class="armory-catalog-card">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:24px; padding:6px; background:#080e1c; border-radius:8px; border:1px solid #1e293b;">${item.icon}</span>
                    <span style="font-size:9px; padding:2px 6px; border-radius:4px; font-weight:bold; background:${item.color}20; color:${item.color};">${item.rarity}</span>
                  </div>
                  <div style="font-family:var(--font-header); font-weight:bold; font-size:12.5px; color:#fff; margin-top:10px;">${item.name}</div>
                  <div style="font-size:10.5px; font-weight:bold; color:#38bdf8; margin-top:2px;">${item.stat}</div>
                  <p style="font-size:10px; color:#94a3b8; margin-top:6px; line-height:1.4;">${item.desc}</p>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- 3v3 ARENA -->
          <section id="arena" class="landing-section-box" style="border-color:rgba(248,113,113,0.3); background:radial-gradient(circle at 50% 50%, #150a0a, #070404);">
            <div class="section-header-row" style="border-color:rgba(248,113,113,0.2);">
              <div>
                <span class="section-tag" style="background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.3);">
                  RATED COMPETITIVE
                </span>
                <h2 class="section-heading">⚡ 3v3 OUTPOST NEXUS DESTRUCTION</h2>
              </div>
              <span style="font-family:monospace; font-weight:bold; color:#f87171; font-size:12px;">25-HP MONOLITH RULE</span>
            </div>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">
              <div class="enc-article-card">
                <h4 style="color:#f87171;">1. Squad Lineups</h4>
                <p>Clash in mirror-symmetric coliseums. Frontline tanks guard the lane while marshals provide radiance shields.</p>
              </div>
              <div class="enc-article-card">
                <h4 style="color:#f87171;">2. 25-HP Monolith Rule</h4>
                <p>Every team defends their 25-HP Outpost Nexus. Direct strikes deal 1 damage per hit. Destroy the opposing nexus to claim victory.</p>
              </div>
              <div class="enc-article-card">
                <h4 style="color:#f87171;">3. Safe Return Teleport</h4>
                <p>Upon match completion, you are automatically returned to your exact pre-arena world position with all bounties preserved.</p>
              </div>
            </div>
          </section>

          <!-- WORLD ATLAS -->
          <section id="atlas" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
                  SEAMLESS TRAVERSAL
                </span>
                <h2 class="section-heading">🗺️ CONTINENTAL REALMS ATLAS</h2>
              </div>
              <span style="font-size:11px; color:#94a3b8;">7 Continental Zones</span>
            </div>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:14px;">
              ${[
                { name: 'Sanctuary Haven', tag: 'Neutral Hub', color: '#facc15', desc: 'Central city housing the Grand Exchange pavilion, AetherVault banks, and artisans.' },
                { name: 'Solari Citadel', tag: 'Sunspire Territory', color: '#facc15', desc: 'Marble sun-temples harvesting celestial dawn radiation.' },
                { name: 'Umbri Undercity', tag: 'Duskveil Syndicate', color: '#c084fc', desc: 'Subterranean obsidian caverns lit by violet graveglass lanterns.' },
                { name: 'Glimmer Orchard', tag: 'Rootdeep Collective', color: '#4ade80', desc: 'Towering ancient trees with sentient moss and stonekin elders.' },
                { name: 'Mirrorgate Spire', tag: 'Astral Conclave', color: '#38bdf8', desc: 'Floating crystal pinnacles bending temporal currents.' },
                { name: 'Starfall Crater', tag: 'Warzone PvPvE', color: '#f87171', desc: 'Impact site where all 4 factions clash over primal leyline shards.' },
              ].map((r) => `
                <div class="enc-article-card">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <b style="color:#fff;">${r.name}</b>
                    <span style="color:${r.color}; font-size:9.5px; font-weight:bold;">${r.tag}</span>
                  </div>
                  <p style="color:#94a3b8; font-size:11px;">${r.desc}</p>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- FOOTER -->
          <footer style="text-align:center; padding:30px 0; border-top:1px solid #1e293b; color:#64748b; font-size:11px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;">
              <img src="${LOGO_SRC}" alt="GlimmerFall" style="height:24px; object-fit:contain;" />
              <b style="color:#fff; font-family:var(--font-header);">GLIMMERFALL ONLINE</b>
            </div>
            <p>Official 2D Pixel Action MMORPG based on the GlimmerFall Trading Card Game universe &bull; glimmerfalltcg.com</p>
            <div style="margin-top:6px;">&copy; 2026 GlimmerFall. All rights reserved.</div>
          </footer>
        </main>
      </div>
    `;
  }

  renderGameEncSection() {
    switch (this.gameEncSection) {
      case 'resources':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card" style="border-left:4px solid #facc15;">
              <h4 style="color:#facc15;">☀️ Solari: Solar Charge &bull; Zenith State</h4>
              <p>Striking targets builds Solar Charge (0-100). Reaching 100 unlocks the blinding Zenith State, boosting movement speed, granting holy radiance bursts, and resetting Solar Flare cooldowns.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">🌙 Umbri: Void Resonance &bull; Dusk Shroud</h4>
              <p>Harnessing nether spells builds Void Resonance. Consuming resonance cloaks the assassin in Dusk Shroud, dropping enemy targeting and granting guaranteed critical strikes.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">🌿 Terra: Root Armor &bull; Bramble Retaliation</h4>
              <p>Absorbing damage weaves living root bark around the champion. Shattering Root Armor roots surrounding enemies and releases thorn shockwaves.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">🌀 Aether: Chronoflux &bull; Temporal Acceleration</h4>
              <p>Chronoflux bends the dimensional lattice. Manipulating flux accelerates cooldown recovery, warps projectile vectors, and rewinds positioning.</p>
            </div>
          </div>
        `;

      case 'persistence':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">❤️ Exact Health &amp; Glimmer Persistence</h4>
              <p>Logging out or disconnecting preserves your exact current HP and Glimmer (Solar Charge) down to the single integer. Returning to the realm never resets your vitals.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">🏛️ Exact World Coordinate Resuming</h4>
              <p>Your coordinates (roomType, X, Y) are permanently committed to browser storage and PostgreSQL. You always spawn right where you stepped out of the world.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#facc15;">🛡️ Clean Monster Respawn &amp; Aggro Wipe</h4>
              <p>Respawning creatures enforce a 2.0-second spawn grace period. Aggro tethers, dammer lists, and combat targets are wiped completely clean upon respawn.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#c084fc;">⚡ 3v3 Arena Safe Return Teleport</h4>
              <p>Match conclusion automatically teleports players back to their exact pre-arena coordinates, depositing bounty trophies straight into their inventory.</p>
            </div>
          </div>
        `;

      case 'combat':
      default:
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#facc15;">🗡️ Attack Cleave Arcs &amp; Hitboxes</h4>
              <p>Melee strikes cover a 90-degree front arc extending 34 pixels. Projectiles track directional vectors with 16px radius hit detection, fully client-predicted.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">⏱️ 1.5s Global Cooldown &amp; Spell Queuing</h4>
              <p>All casted Rites and instant Flashes obey a 1.5s GCD. If an ability is pressed within 0.3s of GCD completion, it is queued automatically for zero-lag combos.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">🛡️ Hyperbolic Armor Mitigation</h4>
              <p>Physical attacks undergo hyperbolic reduction: <code>Damage Reduction = Armor / (Armor + 100)</code>. Heavy plate achieves up to 65% passive mitigation.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#c084fc;">💥 Critical Multipliers &amp; Flashes</h4>
              <p>Base critical strikes inflict 150% damage. Investing in the Flashes skill and socketing TCG relics elevates critical chance by up to +12% and damage beyond 220%.</p>
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
              <p>Devout sentinels worshipping the Daystar. Constructing golden Sunspires to channel pure radiant energy, they burn away void corruption with steadfast faith.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">The Duskveil Syndicate &bull; "In shadows we weave, in silence we strike"</h4>
              <p>Subterranean reapers operating from the Umbri Undercity. Reaping void resonance through Graveglass Lanterns, they capture escaping souls as dark weapons.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">The Rootdeep Collective &bull; "Stand unyielding as ancient stone"</h4>
              <p>Dwelling beneath the giant canopies of Glimmer Orchard, they commune with ancient stone and defend planetary leylines from technological exploitation.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">The Astral Conclave &bull; "Time and space bend to the arcane truth"</h4>
              <p>Scholars of the Mirrorgate Spire. Viewing all moments as a vast harmonic lattice, they manipulate temporal frequencies to rewrite cause and effect.</p>
            </div>
          </div>
        `;

      case 'cards':
        return `
          <div style="margin-bottom:10px; font-size:11px; color:#94a3b8;">
            Authentic trading card relics sourced from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>. Socket these into your champion's gear for passive traits.
          </div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
            ${[
              { name: 'Solari Vanguard', stat: '+15% Radiant Slash Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
              { name: 'Dawnblade Templar', stat: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
              { name: 'Mana Crystal', stat: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
              { name: 'Granite Behemoth', stat: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
              { name: 'Void Stalker', stat: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
              { name: 'Chronocore Prism', stat: 'World Nexus Monolith (25 HP Rule)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
            ].map((c) => `
              <div class="tcg-card-item">
                <img src="${c.img}" alt="${c.name}" class="tcg-card-img" />
                <div>
                  <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#fff;">${c.name}</div>
                  <div style="font-size:10px; font-weight:bold; color:#38bdf8; margin-top:2px;">${c.stat}</div>
                  <span style="font-size:9px; color:#64748b; display:block; margin-top:2px;">Socketable TCG Relic</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;

      case 'shattering':
      default:
        return `
          <div class="enc-article-card" style="padding:22px;">
            <h4 style="color:#facc15; font-size:15px; margin-bottom:8px;">The Cataclysm of the Shattered Leylines</h4>
            <p style="font-size:12.5px; line-height:1.6; color:#cbd5e1;">
              In the First Age of the continent, the celestial Starfall ripped across the firmament, embedding primal Glimmer crystals into the deep bedrock of the world.
              The planetary harmony fractured into four opposing resonances: the blinding fire of the Daystar, the bottomless void of the Undercity, the unbending bedrock of the Orchard, and the flux of Mirrorgate Spire.
              Awakening Sanctuary stands as the eternal crossroads where champions master these cosmic arts before daring the horrors of the Abyssal Rift.
            </p>
          </div>
        `;
    }
  }
}
