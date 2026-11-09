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
  validateCharacterName,
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
  { id: 'solari_spellblade', name: 'Solari Spellblade', slot: 'Weapon', rarity: 'Awakened', icon: '🗡️', stat: '+24 Radiant Dmg • +8% Holy Crit', color: '#F2A900', desc: 'Forged from Starfall meteorite and quenched in the solar well of the Sunspire.' },
  { id: 'radiant_shield', name: 'Radiant Shield', slot: 'Shield', rarity: 'Solari Relic', icon: '🛡️', stat: '+45 Armor • +60 Block Value', color: '#F2A900', desc: 'Imbued with the Zenith core. Emits blinding retaliation flashes.' },
  { id: 'scythe_soulreaper', name: 'Scythe of the Soulreaper', slot: 'Weapon', rarity: 'Epic Relic', icon: '⛏️', stat: '+28 Void Dmg • +20% Life Leech', color: '#9B30FF', desc: 'Forged in the Umbri Undercity to harvest dying essence and replenish vitals.' },
  { id: 'duskveil_shroud', name: 'Duskveil Shadowmail', slot: 'Armor', rarity: 'Awakened', icon: '🦹', stat: '+14 Agility • +12% Stealth Opener', color: '#9B30FF', desc: 'Woven with Graveglass filament that drinks ambient illumination.' },
  { id: 'ironwood_maul', name: 'Ironwood Greathammer', slot: 'Weapon', rarity: 'Awakened', icon: '🔨', stat: '+32 Physical Dmg • Stun Chance', color: '#22E07B', desc: 'Carved from heartwood of Glimmer Orchard ancient boughs.' },
  { id: 'bramble_buckler', name: 'Thornbark Buckler', slot: 'Shield', rarity: 'Terra Relic', icon: '🪵', stat: '+35 Armor • +35% Reflect', color: '#22E07B', desc: 'Reflects incoming melee damage back at attackers through barbed briars.' },
  { id: 'chronocore_staff', name: 'Astral Chrono-Staff', slot: 'Weapon', rarity: 'Awakened', icon: '🔮', stat: '+26 Arcane • -12% Cooldowns', color: '#00BFFF', desc: 'Allows the wielder to perceive temporal currents and accelerate spell rites.' },
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic Relic', icon: '💎', stat: 'World Nexus Anchor (25 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
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

const FACTION_ELEMENTS = {
  Solari: { aspect: 'Solar Light / Gold', element: 'Solar Light', badgeColor: '#facc15' },
  Umbri: { aspect: 'Void / Amethyst', element: 'Void', badgeColor: '#c084fc' },
  Terra: { aspect: 'Verdant Root / Emerald', element: 'Verdant Root', badgeColor: '#4ade80' },
  Aether: { aspect: 'Celestial Mist / Cyan', element: 'Celestial Mist', badgeColor: '#38bdf8' },
};

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

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.playSfx('click');
    this.render();
  }

  setTab(tabId) {
    this.activeTab = tabId;
    this.playSfx('click');
    if (typeof document !== 'undefined') {
      const targetEl = document.getElementById(tabId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
    this.render();
  }

  open(initialTab = null) {
    this.isOpen = true;
    if (initialTab) {
      this.activeTab = initialTab;
    }

    if (this.frontpage) {
      this.frontpage.close();
    }
    if (typeof document !== 'undefined') {
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

      if (initialTab) {
        const targetEl = document.getElementById(initialTab);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  close() {
    this.isOpen = false;
    if (typeof document !== 'undefined') {
      const overlay = document.getElementById('landing-overlay');
      if (overlay) overlay.style.display = 'none';
      const fpOverlay = document.getElementById('frontpage-overlay');
      if (fpOverlay && (!this.frontpage || !this.frontpage.isOpen)) {
        fpOverlay.style.display = 'none';
      }
    }
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

  async launchGame() {
    this.playSfx('launch');
    const rawName = (this.characterName || 'Vanguard').trim();
    const vRes = validateCharacterName(rawName);
    if (!vRes.valid) {
      alert(`⚠️ ${vRes.error}`);
      return;
    }
    const finalName = vRes.cleanName;
    const order = ORDER_PRESETS.find((o) => o.tag === this.selectedOrderTag) || ORDER_PRESETS[0];
    const cls = CLASSES_CATALOG[this.selectedClassId] || CLASSES_CATALOG.solari_vanguard;

    try {
      localStorage.setItem(PLAY_MODE_KEY, this.playMode);
    } catch (_) {}

    this.close();

    if (this.frontpage) {
      this.frontpage.close();
      this.frontpage.playMode = this.playMode;
      try {
        await this.frontpage.createCharacter({
          name: finalName,
          faction: this.selectedFaction,
          classId: cls.id,
          orderTag: order.tag,
          startingRealm: ROOM_TYPES.SANCTUARY_HUB,
        });
      } catch (err) {
        console.warn('[Landing] createCharacter fallback to playSelectedCharacter:', err);
        await this.frontpage.playSelectedCharacter();
      }
    } else if (this.onEnterWorld) {
      this.onEnterWorld({
        playMode: this.playMode,
        profile: {
          id: `char_${Date.now()}`,
          displayName: finalName,
          faction: this.selectedFaction,
          classId: cls.id,
          orderTag: order.tag,
          homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        },
        startingRealm: ROOM_TYPES.SANCTUARY_HUB,
      });
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
    const fe = FACTION_ELEMENTS[this.selectedFaction] || FACTION_ELEMENTS.Solari;
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
                      class="sidebar-mode-btn ${!isSingle ? 'active multi' : ''}"
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
              <a href="#lore-chronicle" class="sidebar-nav-link" onclick="document.getElementById('lore-chronicle')?.scrollIntoView({behavior:'smooth'})">
                <span>📜 World Lore &amp; Chronicle</span>
                <span style="color:#c084fc;">▸</span>
              </a>
              <a href="#tcg-cards" class="sidebar-nav-link" onclick="document.getElementById('tcg-cards')?.scrollIntoView({behavior:'smooth'})">
                <span>🃏 Authentic TCG Cards</span>
                <span style="color:#38bdf8;">▸</span>
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
              <a href="#settings" class="sidebar-nav-link" onclick="document.getElementById('settings')?.scrollIntoView({behavior:'smooth'})">
                <span>⚙️ Settings &amp; Display</span>
                <span style="color:#facc15;">▸</span>
              </a>
              <a href="/landing" class="sidebar-nav-link" style="border-left:3px solid #a855f7; color:#c084fc;">
                <span>🌟 Next.js Marketing Site</span>
                <span style="color:#c084fc;">↗</span>
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
              <div style="font-size:9.5px; color:#94a3b8; text-align:center; margin-top:8px; font-style:italic;">
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
              <a href="/landing" style="color:#c084fc; font-weight:bold;">Next.js Page ↗</a>
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
                Before the continent formed, the celestial <b>Crystal Heart shattered</b>, fracturing unified light into four elemental aspects:
                <b style="color:#facc15;">Solar Light</b>, <b style="color:#c084fc;">Void</b>, <b style="color:#4ade80;">Verdant Root</b>, and <b style="color:#38bdf8;">Celestial Mist</b>.
                Harvest living Glimmer leylines, socket authentic trading card relics from
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
                    <span style="font-size:10px; color:#94a3b8;">${this.characterName.length}/18</span>
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
                    2. CANONICAL FACTION ALLEGIANCE &bull; 4 ELEMENTAL ASPECTS
                  </label>
                  <div class="factions-cards-grid">
                    ${Object.keys(FACTIONS_META).map((facKey) => {
                      const f = FACTIONS_META[facKey];
                      const elem = FACTION_ELEMENTS[facKey] || FACTION_ELEMENTS.Solari;
                      const isSel = this.selectedFaction === facKey;
                      return `
                        <div class="faction-select-card ${isSel ? 'active' : ''}"
                             style="${isSel ? `border-color:${f.color}; background:${f.color}18;` : ''}"
                             onclick="window._landing.setFaction('${facKey}')">
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-family:var(--font-header); font-size:13px; font-weight:bold; color:${f.color};">
                              ${facKey}
                            </span>
                            <span style="font-size:14px;">${f.icon}</span>
                          </div>
                          <div style="font-size:10px; color:${elem.badgeColor}; font-weight:bold; margin-top:3px;">${elem.aspect}</div>
                          <div style="font-size:9.5px; color:#94a3b8; margin-top:2px;">${f.name}</div>
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
                            <span style="font-size:9.5px; padding:1px 6px; border-radius:4px; background:#080e1c; border:1px solid #1e293b; color:#94a3b8;">${c.defaultEquipment?.armor?.replace(/_/g, ' ') || 'Armor'}</span>
                          </div>
                          <div style="font-size:10.5px; font-weight:600; color:${fm.color}; margin-top:3px;">${c.role}</div>
                          <p style="font-size:10.5px; color:#cbd5e1; margin-top:6px; line-height:1.4;">${c.desc}</p>
                          <div style="display:flex; gap:8px; font-size:9.5px; color:#94a3b8; margin-top:8px;">
                            <span>🗡️ ${c.defaultEquipment?.weapon?.replace(/_/g, ' ') || 'Weapon'}</span>
                            <span>🛡️ ${c.defaultEquipment?.offhand?.replace(/_/g, ' ') || 'Shield'}</span>
                          </div>
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
                          <div style="font-family:monospace; font-weight:900; font-size:11px;">[${o.tag}] ${o.emblem || ''}</div>
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
                  <div style="font-size:9.5px; color:#94a3b8; font-weight:bold; text-transform:uppercase; letter-spacing:0.6px;">
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
                    ${fm.name} (${fe.aspect})
                  </div>

                  <div class="pedestal-vitals-grid">
                    <div class="pedestal-vital-box">
                      <div style="font-size:9.5px; color:#94a3b8; font-weight:bold;">HEALTH</div>
                      <div style="color:#4ade80; font-weight:bold; font-size:12px;">❤️ 40 / 40 HP</div>
                    </div>
                    <div class="pedestal-vital-box">
                      <div style="font-size:9.5px; color:#94a3b8; font-weight:bold;">GLIMMER</div>
                      <div style="color:#38bdf8; font-weight:bold; font-size:12px;">🔮 100 Glimmer</div>
                    </div>
                  </div>

                  <button type="button" class="sidebar-cta-btn" style="padding:14px; font-size:12px;" onclick="window._landing.launchGame()">
                    ⚡ AWAKEN IN GLIMMERFALL
                  </button>

                  <!-- 60 FPS Sprite Animation Reel -->
                  <div style="margin-top:14px; background:#060a16; border:1px solid #1e293b; border-radius:10px; overflow:hidden;">
                    <div style="padding:7px 10px; background:#0a1224; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b;">
                      <span style="font-size:10px; font-weight:bold; color:#38bdf8;">🎬 HERO SPRITE REEL (60 FPS)</span>
                      <button type="button" class="id-mini-btn" style="font-size:9px; padding:2px 6px; cursor:pointer;" onclick="window.playCinematicModal && window.playCinematicModal('sprite_sheet')">⛶ Cinema</button>
                    </div>
                    <video
                      src="https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/pixel_art_animation_sheet_1080p.mp4"
                      poster="/GlimmerFall_official_multicolor_logo.png"
                      controls
                      playsinline
                      preload="metadata"
                      style="width:100%; max-height:220px; object-fit:contain; display:block; background:#000;"
                    ></video>
                    <div style="padding:6px 8px; font-size:9.5px; color:#94a3b8; line-height:1.35;">
                      60 FPS pixel art animation sheet: 8-dir tactical sprints, combat slashes, and spellcasting rites.
                    </div>
                  </div>
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

          <!-- WORLD LORE & CHRONICLE -->
          <section id="lore-chronicle" class="landing-section-box">
            <a id="lore-tcg" style="display:none;"></a>
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(155,48,255,0.15); color:#c084fc; border:1px solid rgba(155,48,255,0.3);">
                  CANONICAL UNIVERSE LORE
                </span>
                <h2 class="section-heading">📜 WORLD LORE &amp; CHRONICLE</h2>
              </div>
              <div class="enc-tab-strip">
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'shattering' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('shattering')">
                  🌌 Chapter I: The Shattered Crystal Heart
                </button>
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'creeds' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('creeds')">
                  🏛️ Chapter II: 4 Faction Creeds
                </button>
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'cards' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('cards')">
                  🃏 TCG Card Relics
                </button>
                <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'stasis' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('stasis')">
                  📜 Chapter III: Stasis Awakening
                </button>
              </div>
            </div>

            <div class="enc-body-wrapper">
              ${this.renderLoreEncSection()}
            </div>
          </section>

          <!-- AUTHENTIC TCG CARDS SECTION -->
          <section id="tcg-cards" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
                  glimmerfalltcg.com INTEGRATION
                </span>
                <h2 class="section-heading">🃏 AUTHENTIC TCG CARD RELICS</h2>
              </div>
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="font-size:11px; color:#38bdf8; text-decoration:underline; font-weight:bold;">
                Explore glimmerfalltcg.com ↗
              </a>
            </div>

            <p style="font-size:12px; color:#cbd5e1; margin-bottom:14px; line-height:1.5;">
              Authentic trading card relics sourced directly from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>. Socket these rare physical card relics into your MMORPG champion's weapon and armor sockets for unique combat bonuses and active synergies.
            </p>

            <div class="tcg-deck-grid">
              ${[
                { name: 'Solari Vanguard', stat: '+15% Radiant Slash Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
                { name: 'Dawnblade Templar', stat: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
                { name: 'Mana Crystal', stat: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
                { name: 'Granite Behemoth', stat: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
                { name: 'Void Stalker', stat: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
                { name: 'Chronocore Prism', stat: 'World Nexus Monolith (25 HP Rule)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
              ].map((c) => `
                <div class="tcg-card-item">
                  <img src="${c.img}" alt="${c.name}" class="tcg-card-img" onerror="this.style.display='none'" />
                  <div>
                    <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#fff;">${c.name}</div>
                    <div style="font-size:10.5px; font-weight:bold; color:#38bdf8; margin-top:2px;">${c.stat}</div>
                    <span style="font-size:9px; color:#4ade80; font-weight:bold; display:block; margin-top:2px;">Socketable TCG Relic</span>
                  </div>
                </div>
              `).join('')}
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
                  <p style="font-size:10px; color:#cbd5e1; margin-top:6px; line-height:1.4;">${item.desc}</p>
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

            <div class="arena-feature-grid">
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

            <div class="atlas-realms-grid">
              ${[
                { name: 'Sanctuary Haven', tag: 'Neutral Hub', color: '#facc15', desc: 'Central city housing the Grand Exchange pavilion, AetherVault banks, and artisans.' },
                { name: 'Solari Citadel', tag: 'Sunspire Territory', color: '#facc15', desc: 'Marble sun-temples harvesting celestial dawn radiation.' },
                { name: 'Umbri Undercity', tag: 'Duskveil Syndicate', color: '#c084fc', desc: 'Subterranean obsidian caverns lit by violet graveglass lanterns.' },
                { name: 'Glimmer Orchard', tag: 'Rootdeep Collective', color: '#4ade80', desc: 'Towering ancient trees with sentient moss and stonekin elders.' },
                { name: 'Mirrorgate Spire', tag: 'Astral Conclave', color: '#38bdf8', desc: 'Floating crystal pinnacles bending temporal currents.' },
                { name: 'Starfall Crater', tag: 'Warzone PvPvE', color: '#f87171', desc: 'Impact site where all 4 factions clash over primal leyline shards.' },
                { name: 'Abyssal Rift', tag: 'High-Level Dungeon', color: '#a855f7', desc: 'Endgame chasm where elite void abominations and corrupted keystones lurk.' },
              ].map((r) => `
                <div class="enc-article-card">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <b style="color:#fff;">${r.name}</b>
                    <span style="color:${r.color}; font-size:9.5px; font-weight:bold;">${r.tag}</span>
                  </div>
                  <p style="color:#cbd5e1; font-size:11px;">${r.desc}</p>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- SETTINGS & CONFIGURATION -->
          <section id="settings" class="landing-section-box">
            <div class="section-header-row">
              <div>
                <span class="section-tag" style="background:rgba(242,169,0,0.15); color:#facc15; border:1px solid rgba(242,169,0,0.3);">
                  PREFERENCES &amp; DISPLAY
                </span>
                <h2 class="section-heading">⚙️ SETTINGS &amp; CONFIGURATION</h2>
              </div>
              <span style="font-size:11px; color:#94a3b8;">Stored Locally in Browser</span>
            </div>

            <div class="settings-grid">
              <div class="settings-card">
                <h4 style="color:#facc15; font-family:var(--font-header); font-size:13px; margin-bottom:8px;">🎮 Startup &amp; Audio</h4>

                <div class="settings-toggle-row">
                  <div>
                    <b style="color:#fff; font-size:11.5px; display:block;">Start on this site (Hero Loadout)</b>
                    <span style="font-size:10px; color:#94a3b8;">Skip marketing landing page and launch directly into character loadout on visit.</span>
                  </div>
                  <label class="sidebar-pref-toggle" style="margin:0;">
                    <input type="checkbox"
                           class="start-on-site-cb"
                           ${startOnLoadout ? 'checked' : ''}
                           onchange="window._landing.setStartOnLoadout(this.checked)" />
                  </label>
                </div>

                <div class="settings-toggle-row">
                  <div>
                    <b style="color:#fff; font-size:11.5px; display:block;">Sound Effects Audio</b>
                    <span style="font-size:10px; color:#94a3b8;">Synthesizer click audio, spell feedback, and launch fanfares.</span>
                  </div>
                  <button type="button"
                          class="enc-switch-btn ${this.soundEnabled ? 'active' : ''}"
                          style="padding:5px 12px; font-size:10.5px;"
                          onclick="window._landing.toggleSound()">
                    ${this.soundEnabled ? '🔊 Enabled' : '🔇 Muted'}
                  </button>
                </div>

                <div class="settings-toggle-row">
                  <div>
                    <b style="color:#fff; font-size:11.5px; display:block;">Default Play Mode</b>
                    <span style="font-size:10px; color:#94a3b8;">Choose 0ms Singleplayer or 20Hz Online Multiplayer.</span>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button"
                            class="sidebar-mode-btn ${isSingle ? 'active single' : ''}"
                            style="margin:0; padding:4px 8px;"
                            onclick="window._landing.setPlayMode('singleplayer')">
                      🕹️ Offline
                    </button>
                    <button type="button"
                            class="sidebar-mode-btn ${!isSingle ? 'active multi' : ''}"
                            style="margin:0; padding:4px 8px;"
                            onclick="window._landing.setPlayMode('multiplayer')">
                      🌐 Online
                    </button>
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <h4 style="color:#38bdf8; font-family:var(--font-header); font-size:13px; margin-bottom:8px;">🖥️ Engine &amp; Display Specs</h4>
                <div style="display:flex; flex-direction:column; gap:8px; font-size:11px;">
                  <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                    <span style="color:#cbd5e1;">Rendering Pipeline:</span>
                    <b style="color:#fff;">HD Pixel Anti-Aliased Canvas</b>
                  </div>
                  <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                    <span style="color:#cbd5e1;">Network Sync:</span>
                    <b style="color:#4ade80;">20Hz Authoritative Tick Loop</b>
                  </div>
                  <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                    <span style="color:#cbd5e1;">Artisan Cadence:</span>
                    <b style="color:#facc15;">1.25s Crystalheart Cooldown</b>
                  </div>
                  <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                    <span style="color:#cbd5e1;">Action Bar Dock:</span>
                    <b style="color:#38bdf8;">Persistent Viewport Center Dock</b>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- FOOTER -->
          <footer style="text-align:center; padding:30px 0; border-top:1px solid #1e293b; color:#94a3b8; font-size:11px;">
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
              <h4 style="color:#facc15;">☀️ Solari: Solar Charge &bull; Zenith State (Solar Light / Gold)</h4>
              <p>Striking targets builds Solar Charge (0-100). Reaching 100 unlocks the blinding Zenith State, boosting movement speed, granting holy radiance bursts, and resetting Solar Flare cooldowns.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">🌙 Umbri: Void Resonance &bull; Dusk Shroud (Void / Amethyst)</h4>
              <p>Harnessing nether spells builds Void Resonance. Consuming resonance cloaks the assassin in Dusk Shroud, dropping enemy targeting and granting guaranteed critical strikes.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">🌿 Terra: Root Armor &bull; Bramble Retaliation (Verdant Root / Emerald)</h4>
              <p>Absorbing damage weaves living root bark around the champion. Shattering Root Armor roots surrounding enemies and releases thorn shockwaves.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">🌀 Aether: Chronoflux &bull; Temporal Acceleration (Celestial Mist / Cyan)</h4>
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
              <div style="font-size:10px; color:#facc15; font-weight:bold; margin-bottom:4px;">Aspect: Solar Light / Gold</div>
              <p>Devout sentinels worshipping the Daystar and channeling the dawn-fire facets of the Crystal Heart. Constructing golden Sunspires to channel radiant energy, they burn away void corruption with steadfast faith and Zenith empowerment.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">The Duskveil Syndicate &bull; "In shadows we weave, in silence we strike"</h4>
              <div style="font-size:10px; color:#c084fc; font-weight:bold; margin-bottom:4px;">Aspect: Void / Amethyst</div>
              <p>Subterranean reapers operating from the Umbri Undercity who bound the shadow facets. Reaping void resonance through Graveglass Lanterns, they capture escaping souls as dark weapons and strike unseen from Dusk Shroud.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">The Rootdeep Collective &bull; "Stand unyielding as ancient stone"</h4>
              <div style="font-size:10px; color:#4ade80; font-weight:bold; margin-bottom:4px;">Aspect: Verdant Root / Emerald</div>
              <p>Dwelling beneath the giant canopies of Glimmer Orchard, they commune with ancient stone and the ironwood facets. Defending planetary leylines from reckless exploitation, they crush enemies with Overwhelm and Thornbark reflect.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">The Astral Conclave &bull; "Time and space bend to the arcane truth"</h4>
              <div style="font-size:10px; color:#38bdf8; font-weight:bold; margin-bottom:4px;">Aspect: Celestial Mist / Cyan</div>
              <p>Scholars of the Mirrorgate Spire harnessing the celestial mist and chronoflux facets. Viewing all moments as a vast harmonic lattice, they manipulate temporal frequencies to accelerate cooldowns, echo spell rites, and rewrite cause and effect.</p>
            </div>
          </div>
        `;

      case 'cards':
        return `
          <div style="margin-bottom:10px; font-size:11px; color:#cbd5e1;">
            Authentic trading card relics sourced from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>. Socket these into your champion's gear for passive traits.
          </div>
          <div class="tcg-deck-grid">
            ${[
              { name: 'Solari Vanguard', stat: '+15% Radiant Slash Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
              { name: 'Dawnblade Templar', stat: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
              { name: 'Mana Crystal', stat: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
              { name: 'Granite Behemoth', stat: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
              { name: 'Void Stalker', stat: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
              { name: 'Chronocore Prism', stat: 'World Nexus Monolith (25 HP Rule)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
            ].map((c) => `
              <div class="tcg-card-item">
                <img src="${c.img}" alt="${c.name}" class="tcg-card-img" onerror="this.style.display='none'" />
                <div>
                  <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#fff;">${c.name}</div>
                  <div style="font-size:10px; font-weight:bold; color:#38bdf8; margin-top:2px;">${c.stat}</div>
                  <span style="font-size:9px; color:#4ade80; font-weight:bold; display:block; margin-top:2px;">Socketable TCG Relic</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;

      case 'stasis':
      case 'legends':
        return `
          <div class="enc-article-card" style="padding:22px; border-left:4px solid #38bdf8;">
            <div style="font-size:10px; color:#38bdf8; font-weight:bold; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:4px;">
              CHAPTER III • STASIS AWAKENING
            </div>
            <h4 style="color:#38bdf8; font-size:15px; margin-bottom:8px; font-family:var(--font-header);">
              Awakening from Stasis in Sanctuary Haven
            </h4>
            <p style="font-size:12px; line-height:1.6; color:#cbd5e1; margin-bottom:8px;">
              Sealed in crystalline stasis since the Shattering, you awaken in the heart of Sanctuary Haven as a Summoner-Knight. Under the guidance of <b>Herald Lyra</b> and <b>Commander Valerius</b>, you re-learn the ancient martial arts, channel raw Glimmer fonts [E], and master the 1.25s cadence at Master Artisan Aldric's forge.
            </p>
            <p style="font-size:12px; line-height:1.6; color:#94a3b8;">
              Beyond the gates lie the contested zones: Starfall Crater, the Abyssal Rift, and the 3v3 Outpost Nexus arenas. Arm yourself with socketed gear, assemble your 3-player squad [O], and reforge the balance of GlimmerFall!
            </p>
          </div>
        `;

      case 'shattering':
      default:
        return `
          <div class="enc-article-card" style="padding:22px; border-left:4px solid #facc15;">
            <div style="font-size:10px; color:#facc15; font-weight:bold; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:4px;">
              CHAPTER I • COSMIC ORIGIN &amp; THE FALL
            </div>
            <h4 style="color:#facc15; font-size:15px; margin-bottom:8px; font-family:var(--font-header);">
              The Shattered Crystal Heart &amp; The Great Glimmer Fracture
            </h4>
            <p style="font-size:12.5px; line-height:1.6; color:#cbd5e1; margin-bottom:12px;">
              Before the continental caldera took shape, cosmic reality hung in perfect equilibrium between the radiant Golden Sun and the deep Abyssal Void. At the exact nexus of these primordial forces beat a solitary celestial organ: the <b>Crystal Heart</b>—an iridescent, multi-faceted anatomical heart glowing with pure rainbow prismatic light.
            </p>
            <p style="font-size:12.5px; line-height:1.6; color:#cbd5e1; margin-bottom:12px;">
              As cosmic tensions escalated, violent purple lightning fissures ruptured across the crystalline chambers. In an apocalyptic detonation known as the <b>Crystalheart Shattering</b>, the Crystal Heart shattered into a rain of flaming iridescent meteor shards that forged our continent. With the Heart destroyed, the unified white Glimmer fractured into the four elemental aspects:
            </p>

            <!-- 1080p Video Embed: Crystal Heart Shattering -->
            <div style="margin:14px 0; border-radius:10px; overflow:hidden; border:2px solid rgba(250,204,21,0.5); box-shadow:0 0 25px rgba(250,204,21,0.2), 0 8px 30px rgba(0,0,0,0.8); background:#040711;">
              <video
                src="https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/crystal_heart_shattering_1080p.mp4"
                poster="/GlimmerFall_official_multicolor_logo.png"
                controls
                playsinline
                preload="metadata"
                style="width:100%; max-height:360px; object-fit:contain; display:block; background:#000;"
              ></video>
              <div style="padding:8px 14px; background:#080e1c; border-top:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="font-size:11px; font-weight:bold; color:#fde047;">🎬 1080p Cinematic • The Shattered Crystal Heart</span>
                <button type="button" class="id-mini-btn" style="font-size:10px; padding:3px 10px; border-color:#facc15; color:#fde047; cursor:pointer;" onclick="window.playCinematicModal && window.playCinematicModal('crystal_heart')">
                  ⛶ Open Theater Mode
                </button>
              </div>
            </div>

            <div class="elemental-aspects-grid">
              <div style="background:#080e1c; border-left:3px solid #facc15; padding:8px 10px; border-radius:4px;">
                <b style="color:#facc15; font-size:11px;">☀️ Solari — Solar Light / Gold</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Claimed the dawn-fire facets. Sentinels of the Sunspire Dominion wielding Guard &amp; Zenith state.</div>
              </div>
              <div style="background:#080e1c; border-left:3px solid #c084fc; padding:8px 10px; border-radius:4px;">
                <b style="color:#c084fc; font-size:11px;">🌑 Umbri — Void / Amethyst</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Channeled the necrotic shadow facets. Reapers of the Duskveil Syndicate wielding Stealth &amp; Void Harvest.</div>
              </div>
              <div style="background:#080e1c; border-left:3px solid #4ade80; padding:8px 10px; border-radius:4px;">
                <b style="color:#4ade80; font-size:11px;">🌿 Terra — Verdant Root / Emerald</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Bound the root and ironwood facets. Guardians of the Rootdeep Collective wielding Overwhelm &amp; Thornbark.</div>
              </div>
              <div style="background:#080e1c; border-left:3px solid #38bdf8; padding:8px 10px; border-radius:4px;">
                <b style="color:#38bdf8; font-size:11px;">🔮 Aether — Celestial Mist / Cyan</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Harnessed the star-weaving chronoflux facets. Scholars of the Astral Conclave wielding Flash Tempo &amp; Echo.</div>
              </div>
            </div>
            <p style="font-size:11.5px; line-height:1.5; color:#94a3b8; margin-top:10px; font-style:italic;">
              The Glimmer singing in your blood is not ordinary magic—it is the living life-blood of the shattered Crystal Heart.
            </p>
          </div>
        `;
    }
  }
}
