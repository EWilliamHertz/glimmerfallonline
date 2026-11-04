// ==========================================
// GlimmerFall Online 2D — Game Frontpage (Character Roster, All 4 Factions,
// 8 Playable Archetypes, Live Pixel Paperdoll & 8-Slot TCG Loadout Builder)
// ==========================================

import {
  ACTION_SLOTS,
  ROOM_TYPES,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  ABILITIES_CATALOG,
  getSlotAbilitySpec,
  getEquipmentStatBonuses,
} from '../shared/protocol.js';
import { getCharacterSprites } from './sprites.js';

const SLOT_LABELS = {
  1: '1', 2: '2', 3: '3', 4: '4',
  9: 'Q', 10: 'R', 11: 'F', 12: 'Z',
};

export class FrontpageController {
  constructor({ net, audio, onEnterWorld }) {
    this.net = net;
    this.audio = audio;
    this.onEnterWorld = onEnterWorld;

    this.isOpen = true;
    this.previewAnimTimer = null;
    this.previewDirIdx = 0;
    this.previewFrame = 0;

    // Draft Character State
    this.editingCharacterId = null; // null = creating new, or existing char id
    this.name = 'Solari Vanguard';
    this.orderTag = 'SUN';
    this.faction = 'Solari';
    this.classId = 'solari_vanguard';
    this.equipment = { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment };
    this.loadout = { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout };
    this.selectedSlot = 1;
    this.startingRealm = ROOM_TYPES.SANCTUARY_HUB;
    this.authMessage = '';
  }

  syncFromProfile(profile) {
    if (!profile) return;
    const chars = profile.characters || [];
    const active = chars.find((c) => c.id === profile.activeCharacterId) || chars[0];
    if (active) {
      this.selectRosterCharacter(active, false);
    } else {
      this.name = profile.displayName || 'Solari Vanguard';
      this.faction = profile.faction || 'Solari';
      this.classId = profile.classId || 'solari_vanguard';
      const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;
      this.equipment = { ...cls.defaultEquipment, ...(profile.equipment || {}) };
      this.loadout = { ...cls.defaultLoadout, ...(profile.loadout || {}) };
      this.orderTag = profile.orderTag || 'SUN';
    }
    if (this.isOpen) this.render();
  }

  selectRosterCharacter(ch, rerender = true) {
    this.editingCharacterId = ch.id;
    this.name = ch.name || 'Vanguard';
    this.faction = ch.faction || 'Solari';
    this.classId = ch.classId || 'solari_vanguard';
    const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;
    this.equipment = { ...cls.defaultEquipment, ...(ch.equipment || {}) };
    this.loadout = { ...cls.defaultLoadout, ...(ch.loadout || {}) };
    this.orderTag = ch.orderTag || 'SUN';
    this.startingRealm = ch.homeBiome || ROOM_TYPES.SANCTUARY_HUB;
    if (rerender) {
      this.audio.playChime();
      this.render();
    }
  }

  startNewCharacter() {
    this.editingCharacterId = null;
    this.faction = 'Solari';
    this.classId = 'solari_vanguard';
    const suffix = Math.floor(100 + Math.random() * 899);
    this.name = `Champion_${suffix}`;
    this.orderTag = 'SUN';
    this.equipment = { ...CLASSES_CATALOG.solari_vanguard.defaultEquipment };
    this.loadout = { ...CLASSES_CATALOG.solari_vanguard.defaultLoadout };
    this.startingRealm = ROOM_TYPES.SANCTUARY_HUB;
    this.audio.playChime();
    this.render();
  }

  pickFaction(facId) {
    if (!FACTIONS_META[facId]) return;
    this.faction = facId;
    const firstCls = Object.values(CLASSES_CATALOG).find((c) => c.faction === facId) || CLASSES_CATALOG.solari_vanguard;
    this.pickClass(firstCls.id, false);
    const defaultTags = { Solari: 'SUN', Umbri: 'VOID', Terra: 'ROOT', Aether: 'AETH' };
    this.orderTag = defaultTags[facId] || 'SUN';
    this.audio.playChime();
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
    if (playSfx) this.audio.playChime();
    this.render();
  }

  pickEquipment(slot, itemId) {
    if (!EQUIPMENT_CATALOG[itemId]) return;
    this.equipment = { ...this.equipment, [slot]: itemId };
    this.audio.playShield();
    this.render();
  }

  pickSlotAbility(slot, abilityId) {
    if (!ABILITIES_CATALOG[abilityId]) return;
    this.loadout = { ...this.loadout, [slot]: abilityId };
    this.audio.playSpell();
    this.render();
  }

  resetClassLoadout() {
    const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;
    this.loadout = { ...cls.defaultLoadout };
    this.audio.playChime();
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

  async enterTestMode() {
    this.audio.init();
    if (this.audio.playLevelUp) this.audio.playLevelUp();
    else this.audio.playPortal();

    const nameInput = document.getElementById('fp-char-name');
    const tagInput = document.getElementById('fp-order-tag');
    if (nameInput && nameInput.value.trim()) this.name = nameInput.value.trim();
    if (tagInput && tagInput.value.trim()) this.orderTag = tagInput.value.trim().toUpperCase();

    const testProfile = {
      displayName: this.name,
      faction: this.faction,
      classId: this.classId,
      orderTag: this.orderTag,
      loadout: this.loadout,
      equipment: this.equipment,
    };

    this.close();
    if (this.onEnterWorld) {
      this.onEnterWorld({
        profile: testProfile,
        startingRealm: ROOM_TYPES.SANCTUARY_HUB,
        isTestMode: true,
      });
    }
  }

  async enterWorld() {
    this.audio.init();
    this.audio.playPortal();

    const nameInput = document.getElementById('fp-char-name');
    const tagInput = document.getElementById('fp-order-tag');
    if (nameInput && nameInput.value.trim()) this.name = nameInput.value.trim();
    if (tagInput && tagInput.value.trim()) this.orderTag = tagInput.value.trim().toUpperCase();

    let updatedProfile = null;
    try {
      const res = await this.net.saveOrSelectCharacter({
        characterId: this.editingCharacterId || undefined,
        name: this.name,
        faction: this.faction,
        classId: this.classId,
        orderTag: this.orderTag,
        loadout: this.loadout,
        equipment: this.equipment,
        homeBiome: this.startingRealm,
        enterRealm: this.startingRealm,
      });
      updatedProfile = res.profile;
      this.editingCharacterId = res.character?.id || this.editingCharacterId;
    } catch (_) {
      // Offline / local fallback profile
      updatedProfile = {
        displayName: this.name,
        faction: this.faction,
        classId: this.classId,
        orderTag: this.orderTag,
        loadout: this.loadout,
        equipment: this.equipment,
      };
    }

    this.close();
    if (this.onEnterWorld) {
      this.onEnterWorld({
        profile: updatedProfile,
        startingRealm: this.startingRealm,
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

  async removeRosterChar(charId) {
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

    const prof = this.net.profile;
    const chars = prof?.characters || [];
    const dbOk = prof?.dbConnected !== false;
    const fm = FACTIONS_META[this.faction] || FACTIONS_META.Solari;
    const cls = CLASSES_CATALOG[this.classId] || CLASSES_CATALOG.solari_vanguard;
    const eqBonus = getEquipmentStatBonuses(this.equipment, this.classId);

    const weapons = Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'weapon');
    const armors = Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'armor');
    const offhands = Object.values(EQUIPMENT_CATALOG).filter((i) => i.slot === 'offhand');

    // Available abilities for slot picker: selected Faction first, then other Factions
    const facAbilities = Object.values(ABILITIES_CATALOG).filter((a) => a.faction === this.faction);
    const crossAbilities = Object.values(ABILITIES_CATALOG).filter((a) => a.faction !== this.faction && a.faction !== 'All');
    const curSlotSpec = getSlotAbilitySpec(this.loadout, this.selectedSlot);

    const factionClasses = Object.values(CLASSES_CATALOG).filter((c) => c.faction === this.faction);

    root.innerHTML = `
      <div class="fp-grid">
        <!-- LEFT COLUMN: Character Roster & Cloud Realm Account -->
        <div class="fp-col">
          <div class="fp-section-title">1. CHAMPION ROSTER</div>
          <div style="font-size:8px; color:${dbOk ? '#4ade80' : '#fbbf24'}; margin-bottom:6px;">
            ${dbOk ? '● CLOUD REALM SYNCED' : '● LOCAL ADVENTURE'}
            ${prof && !prof.isGuest ? ` • @${prof.username}` : ' • Guest ID'}
          </div>

          <div class="fp-roster-list">
            ${chars.map((ch) => {
              const cf = FACTIONS_META[ch.faction] || FACTIONS_META.Solari;
              const cCls = CLASSES_CATALOG[ch.classId] || CLASSES_CATALOG.solari_vanguard;
              const active = ch.id === this.editingCharacterId;
              return `
                <div class="fp-roster-item ${active ? 'active' : ''}" onclick="window._fp.selectRosterCharacterById('${ch.id}')">
                  <div>
                    <div style="font-size:9.5px; color:${cf.color}; font-weight:bold;">
                      ${cf.icon} ${ch.name} <span style="color:#fde047;">Lv.${ch.progression?.level || 1}</span>
                    </div>
                    <div style="font-size:8px; color:#94a3b8;">${cCls.name} • &lt;${ch.orderTag || 'SUN'}&gt;</div>
                  </div>
                  ${chars.length > 1 ? `<button class="id-mini-btn" style="border-color:#ef4444; color:#fca5a5;" onclick="event.stopPropagation(); window._fp.removeRosterChar('${ch.id}')">✕</button>` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <button class="util-btn" style="width:100%; margin-top:6px; border-color:#4ade80; color:#4ade80;" onclick="window._fp.startNewCharacter()">
            ➕ CREATE NEW CHAMPION
          </button>

          <div class="fp-section-title" style="margin-top:12px;">GLIMMERFALL ID &amp; TCG LOGIN</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            <input id="fp-auth-user" class="pixel-input" placeholder="GlimmerFall ID Username" value="${prof?.username || ''}" maxlength="18" />
            <input id="fp-auth-pass" class="pixel-input" type="password" placeholder="Password" maxlength="48" />
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
              <button class="util-btn" style="font-size:8px; border-color:#facc15; color:#fde047;" onclick="window._fp.handleQuickAuth('register')">✨ REGISTER</button>
              <button class="util-btn" style="font-size:8px; border-color:#38bdf8; color:#bae6fd;" onclick="window._fp.handleQuickAuth('login')">🔑 LOGIN</button>
            </div>
            ${this.authMessage ? `<div style="font-size:8px; color:#fde047;">${this.authMessage}</div>` : ''}
          </div>
        </div>

        <!-- CENTER COLUMN: Faction, Archetype, Name & Live 24x26 Paperdoll -->
        <div class="fp-col">
          <div class="fp-section-title">2. IDENTITY, FACTION &amp; ARCHETYPE</div>
          <div style="display:grid; grid-template-columns:1fr 78px; gap:6px; margin-bottom:8px;">
            <div>
              <label style="font-size:8px; color:#94a3b8;">CHARACTER NAME</label>
              <input id="fp-char-name" class="pixel-input" value="${this.name}" maxlength="18" oninput="window._fp.name = this.value" />
            </div>
            <div>
              <label style="font-size:8px; color:#94a3b8;">&lt;ORDER&gt;</label>
              <input id="fp-order-tag" class="pixel-input" value="${this.orderTag}" maxlength="5" oninput="window._fp.orderTag = this.value.toUpperCase()" />
            </div>
          </div>

          <label style="font-size:8px; color:#94a3b8;">CANONICAL GLIMMERFALL TCG FACTION (ALL 4 PLAYABLE):</label>
          <div class="faction-choice-grid" style="margin-bottom:8px;">
            ${Object.values(FACTIONS_META).map((f) => `
              <div class="faction-card-btn ${this.faction === f.id ? 'selected' : ''}" style="${this.faction === f.id ? `border-color:${f.color};` : ''}" onclick="window._fp.pickFaction('${f.id}')">
                <div style="font-size:15px;">${f.icon}</div>
                <b style="color:${f.color}; font-size:8.5px;">${f.id.toUpperCase()}</b>
              </div>
            `).join('')}
          </div>

          <div style="background:#060a15; border-left:3px solid ${fm.color}; padding:6px 8px; margin-bottom:8px; font-size:8.5px;">
            <b style="color:${fm.color};">${fm.icon} ${fm.mechanicName}:</b>
            <span style="color:#cbd5e1;">${fm.mechanicDesc}</span>
          </div>

          <label style="font-size:8px; color:#94a3b8;">PLAYABLE CLASS ARCHETYPE:</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
            ${factionClasses.map((c) => `
              <div class="fp-class-card ${this.classId === c.id ? 'selected' : ''}" onclick="window._fp.pickClass('${c.id}')">
                <div style="color:${fm.color}; font-weight:bold; font-size:9px;">${c.name}</div>
                <div style="color:#94a3b8; font-size:7.5px; margin-top:2px;">${c.role}</div>
              </div>
            `).join('')}
          </div>

          <!-- Live Paperdoll Preview + Gear Selector -->
          <div style="display:flex; gap:10px; align-items:center; background:#060a15; border:2px solid #1e293b; padding:8px;">
            <div style="text-align:center;">
              <canvas id="fp-paperdoll-canvas" width="92" height="96" style="border:2px solid ${fm.color}; background:#090f20;"></canvas>
              <div style="font-size:7.5px; color:#94a3b8; margin-top:3px;">LIVE 24×26 SPRITE</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; gap:5px; font-size:8.5px;">
              <div>
                <label style="color:#94a3b8; font-size:7.5px;">🗡️ WEAPON PAPERDOLL</label>
                <select class="pixel-input" style="padding:3px 5px; font-size:8.5px;" onchange="window._fp.pickEquipment('weapon', this.value)">
                  ${weapons.map((w) => `<option value="${w.id}" ${this.equipment.weapon === w.id ? 'selected' : ''}>${w.icon} ${w.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="color:#94a3b8; font-size:7.5px;">🥋 ARMOR PAPERDOLL</label>
                <select class="pixel-input" style="padding:3px 5px; font-size:8.5px;" onchange="window._fp.pickEquipment('armor', this.value)">
                  ${armors.map((a) => `<option value="${a.id}" ${this.equipment.armor === a.id ? 'selected' : ''}>${a.icon} ${a.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="color:#94a3b8; font-size:7.5px;">🛡️ RELIC / SHIELD PAPERDOLL</label>
                <select class="pixel-input" style="padding:3px 5px; font-size:8.5px;" onchange="window._fp.pickEquipment('offhand', this.value)">
                  ${offhands.map((o) => `<option value="${o.id}" ${this.equipment.offhand === o.id ? 'selected' : ''}>${o.icon} ${o.name}</option>`).join('')}
                </select>
              </div>
              <div style="color:#4ade80; font-size:8px;">
                GEAR BONUS: +${eqBonus.power} PWR • +${eqBonus.bastion} BAS • +${eqBonus.resonance} RES • +${eqBonus.tempo} TMP
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: 8-Slot TCG Skill Loadout & Enter Realm -->
        <div class="fp-col">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="fp-section-title" style="margin-bottom:0;">3. CHARACTER RITE &amp; FLASH LOADOUT</div>
            <button class="id-mini-btn" onclick="window._fp.resetClassLoadout()">↺ DEFAULT</button>
          </div>
          <div style="font-size:8px; color:#94a3b8; margin:4px 0 6px;">
            Click any Action Slot below, then assign any GlimmerFall TCG Rite or Flash!
          </div>

          <div class="fp-loadout-bar">
            ${ACTION_SLOTS.map((slot) => {
              const sp = getSlotAbilitySpec(this.loadout, slot);
              const sel = this.selectedSlot === slot;
              return `
                <div class="fp-slot-btn ${sel ? 'selected' : ''}" onclick="window._fp.selectedSlot = ${slot}; window._fp.render();">
                  <span style="font-size:7px; color:#facc15;">[${SLOT_LABELS[slot]}]</span>
                  <span style="font-size:14px;">${sp.icon}</span>
                  <span style="font-size:7px; color:#cbd5e1;">${sp.short}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div style="background:#060a15; border:1px solid #38bdf8; padding:6px 8px; margin:6px 0; font-size:8.5px;">
            <div style="color:${curSlotSpec.color}; font-weight:bold;">
              SLOT [${SLOT_LABELS[this.selectedSlot]}]: ${curSlotSpec.icon} ${curSlotSpec.name}
              <span style="color:#94a3b8; font-weight:normal;">(${curSlotSpec.tcgType} • ${curSlotSpec.cost ? `${curSlotSpec.cost} Glimmer` : '0 Cost'})</span>
            </div>
            <div style="color:#e2e8f0; margin-top:2px;">${curSlotSpec.desc}</div>
          </div>

          <div class="fp-ability-picker">
            ${[...facAbilities, ...crossAbilities].map((ab) => {
              const isEquippedHere = this.loadout[this.selectedSlot] === ab.id;
              return `
                <div class="fp-ability-choice ${isEquippedHere ? 'equipped' : ''}" onclick="window._fp.pickSlotAbility(${this.selectedSlot}, '${ab.id}')">
                  <div>
                    <span>${ab.icon}</span>
                    <b style="color:${ab.color};">${ab.name}</b>
                    <span style="color:#64748b; font-size:7.5px;">(${ab.faction})</span>
                  </div>
                  <span style="font-size:7.5px; color:${isEquippedHere ? '#4ade80' : '#94a3b8'};">
                    ${isEquippedHere ? 'EQUIPPED' : `${ab.baseCd}s CD`}
                  </span>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top:8px;">
            <label style="font-size:8px; color:#94a3b8;">STARTING REALM / BIOME:</label>
            <select class="pixel-input" style="margin-top:3px; margin-bottom:8px;" onchange="window._fp.startingRealm = this.value">
              <option value="${ROOM_TYPES.SANCTUARY_HUB}" ${this.startingRealm === ROOM_TYPES.SANCTUARY_HUB ? 'selected' : ''}>🏛️ Awakening Sanctuary Hub (Safe Social Hub)</option>
              <option value="${fm.homeBiome}" ${this.startingRealm === fm.homeBiome ? 'selected' : ''}>${fm.icon} ${fm.id} Home Biome Dungeon</option>
              <option value="${ROOM_TYPES.NEXUS_WARZONE}" ${this.startingRealm === ROOM_TYPES.NEXUS_WARZONE ? 'selected' : ''}>⚔️ Nexus Warzone (4-Faction Siege PvPvE)</option>
            </select>

            <button class="fp-enter-btn" onclick="window._fp.enterWorld()">
              ⚔️ ENTER GLIMMERFALL ONLINE ▸
            </button>
            <button class="fp-enter-btn" style="background:linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); border-color:#818cf8; color:#e0e7ff; margin-top:6px;" onclick="window._fp.enterTestMode()">
              🧪 1-PLAYER TEST MODE (TRY ALL CHARACTERS &amp; ABILITIES) ▸
            </button>
          </div>
        </div>
      </div>
    `;

    this.drawPaperdollPreviewCanvas('fp-paperdoll-canvas', 'down', 0);
  }

  selectRosterCharacterById(id) {
    const ch = (this.net.profile?.characters || []).find((c) => c.id === id);
    if (ch) this.selectRosterCharacter(ch, true);
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
  if (cv) {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#090f20';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const set = getCharacterSprites(faction, classId, equip);
    ctx.drawImage(set.down[0], 6, 5, 72, 78);
  }
}
