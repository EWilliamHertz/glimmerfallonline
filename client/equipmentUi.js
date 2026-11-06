// ==========================================
// GlimmerFall Online 2D — Canonical Equipment, 28-Slot Inventory & AetherSwap Continental Exchange UI
// Supports:
//   - 11 Classic Paperdoll Slots (Head, Cape, Neck, Ammo, Weapon, Body, Shield, Legs, Hands, Feet, Ring)
//   - 5 Canonical Faction Sets (Sunforged, Primordial, Chrono-Weaver, Duskveil, Aurelius Titan) with active set perks
//   - 28-Slot Classic Backpack with click-to-equip, item swapping & ground drops
//   - AetherSwap Continental Trading Market Replica with 8 order slots and guide prices
// ==========================================

import {
  EQUIPMENT_CATALOG,
  BARROWS_SETS,
  getActiveSetBonuses,
  getEquipmentStatBonuses,
  CLASSES_CATALOG,
} from '../shared/protocol.js';
import { getCharacterSprites } from './sprites.js';
import { getItemIconDataUrl, getItemCanvas } from './itemSprites.js';

let currentHoveredItemId = null;
let currentHoveredSource = 'equipped';

export function formatItemStatsHtml(item, showSet = true) {
  if (!item) return '';
  const stats = item.stats || {};
  const lines = [];
  if (stats.power) lines.push(`<span style="color:#fde047; font-weight:bold;">⚔️ +${stats.power} Power</span>`);
  if (stats.bastion) lines.push(`<span style="color:#4ade80; font-weight:bold;">🛡️ +${stats.bastion} Bastion</span>`);
  if (stats.resonance) lines.push(`<span style="color:#38bdf8; font-weight:bold;">🔮 +${stats.resonance} Resonance</span>`);
  if (stats.tempo) lines.push(`<span style="color:#c084fc; font-weight:bold;">⚡ +${stats.tempo} Tempo</span>`);
  if (stats.maxHp) lines.push(`<span style="color:#f87171; font-weight:bold;">❤️ +${stats.maxHp} Max HP</span>`);
  if (stats.maxGlimmer) lines.push(`<span style="color:#fde047; font-weight:bold;">✨ +${stats.maxGlimmer} Glimmer</span>`);
  if (stats.critPct) lines.push(`<span style="color:#fbbf24; font-weight:bold;">🎯 +${Math.round(stats.critPct * 100)}% Crit</span>`);
  if (item.healHp) lines.push(`<span style="color:#4ade80; font-weight:bold;">🧪 Restores +${item.healHp} Health</span>`);
  if (item.restoreGlimmer) lines.push(`<span style="color:#38bdf8; font-weight:bold;">⚗️ Restores +${item.restoreGlimmer} Glimmer</span>`);

  let setHtml = '';
  if (showSet && item.set && BARROWS_SETS[item.set]) {
    const s = BARROWS_SETS[item.set];
    setHtml = `
      <div style="margin-top:6px; padding:4px 7px; background:#1c1917; border-left:3px solid ${s.color}; border-radius:3px; font-size:8px;">
        <b style="color:${s.color};">👑 ${s.name}</b>
        <div style="color:#fde047; font-weight:bold; margin-top:2px;">${s.perkTitle}</div>
        <div style="color:#cbd5e1; font-size:7.5px; margin-top:1px; line-height:1.3;">${s.perkDesc}</div>
      </div>
    `;
  }

  const statsPart = lines.length > 0 ? `
    <div style="display:flex; flex-wrap:wrap; gap:6px; font-size:8.5px; margin:4px 0;">
      ${lines.join(' • ')}
    </div>
  ` : '';

  return `${statsPart}${setHtml}`.trim();
}

export function getHoveredCardHtml(itemId, source = 'equipped') {
  const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
  if (!item) {
    return `
      <div style="text-align:center; padding:10px 8px; color:#78716c; font-size:8.5px; border:1px dashed #44403c; border-radius:4px;">
        🔍 Hover over any worn gear slot or backpack item to inspect its combat bonuses and set synergies.
      </div>
    `;
  }

  const borderCol = getRarityColor(item.rarity);
  const actionTip = source === 'equipped'
    ? '👉 Click slot to Unequip to Backpack'
    : source === 'inventory'
    ? '👉 Left-click to Equip • Right-click to Drop'
    : source === 'bank'
    ? '👉 Left-click to Withdraw 1 • Right-click to Withdraw All'
    : '👉 AetherSwap Catalog Entry';

  const statsHtml = formatItemStatsHtml(item, true);
  const statsSection = statsHtml ? `
    <div style="margin-top:6px; border-top:1px solid #1e293b; padding-top:4px;">
      ${statsHtml}
    </div>
  ` : '';

  return `
    <div style="background:#090d1c; border:1.5px solid ${borderCol}; border-radius:4px; padding:8px 10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <img class="pixel-art" src="${getItemIconDataUrl(item.id, 32)}" width="32" height="32" style="image-rendering:pixelated; background:#070b18; border:1px solid ${borderCol}; border-radius:3px; padding:2px;" alt="${item.name}" />
        <div style="line-height:1.25; overflow:hidden;">
          <b style="color:#f8fafc; font-size:10.5px; display:block; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${item.name}</b>
          <div style="font-size:8px; color:${borderCol}; font-weight:bold;">${item.rarity} • ${item.slot.toUpperCase()}</div>
        </div>
      </div>
      ${statsSection}
      <div style="font-size:7.5px; color:#94a3b8; font-style:italic; margin-top:4px; line-height:1.3;">
        ${item.desc || ''}
      </div>
      <div style="font-size:7.5px; color:#38bdf8; font-weight:bold; margin-top:5px; border-top:1px solid #1e293b; padding-top:3px;">
        ${actionTip}
      </div>
    </div>
  `;
}

export function updateHoveredEquipmentDisplay() {
  if (typeof document === 'undefined') return;
  const gearCard = document.getElementById('hovered-gear-card');
  if (gearCard) {
    gearCard.innerHTML = getHoveredCardHtml(currentHoveredItemId, currentHoveredSource);
  }
  const bagCard = document.getElementById('bag-hovered-gear-card');
  if (bagCard) {
    bagCard.innerHTML = getHoveredCardHtml(currentHoveredItemId, currentHoveredSource);
  }
}

export function setHoveredEquipment(itemId, source = 'equipped', evt = null) {
  currentHoveredItemId = itemId || null;
  currentHoveredSource = source;
  updateHoveredEquipmentDisplay();
  if (evt && itemId) {
    showFloatingGearTooltip(itemId, source, evt);
  }
}

export function clearHoveredEquipment() {
  currentHoveredItemId = null;
  currentHoveredSource = 'equipped';
  updateHoveredEquipmentDisplay();
  hideFloatingGearTooltip();
}

export function showFloatingGearTooltip(itemId, source, evt) {
  if (typeof document === 'undefined') return;
  const tip = document.getElementById('gear-floating-tooltip');
  if (!tip) return;
  if (source === 'bank') {
    const bModal = document.getElementById('bank-modal');
    if (!bModal || bModal.style.display !== 'block') {
      tip.style.display = 'none';
      return;
    }
  }
  const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
  if (!item) {
    tip.style.display = 'none';
    return;
  }
  tip.innerHTML = getHoveredCardHtml(itemId, source);
  tip.style.display = 'block';
  updateFloatingGearTooltipPos(evt);
}

export function updateFloatingGearTooltipPos(evt) {
  if (typeof document === 'undefined') return;
  const tip = document.getElementById('gear-floating-tooltip');
  if (!tip || tip.style.display === 'none') return;
  if (currentHoveredSource === 'bank') {
    const bModal = document.getElementById('bank-modal');
    if (!bModal || bModal.style.display !== 'block') {
      tip.style.display = 'none';
      return;
    }
  }
  const x = Math.min(window.innerWidth - 275, (evt?.clientX || 0) + 14);
  const y = Math.min(window.innerHeight - 200, (evt?.clientY || 0) + 14);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

export function hideFloatingGearTooltip() {
  if (typeof document === 'undefined') return;
  const tip = document.getElementById('gear-floating-tooltip');
  if (tip) tip.style.display = 'none';
}

export const RS_SLOTS_LAYOUT = [
  // Row 1
  { key: null, row: 1, col: 1 },
  { key: 'head', label: 'Head', placeholder: '🪖', row: 1, col: 2 },
  { key: null, row: 1, col: 3 },
  // Row 2
  { key: 'cape', label: 'Cape', placeholder: '🧣', row: 2, col: 1 },
  { key: 'neck', label: 'Neck', placeholder: '📿', row: 2, col: 2 },
  { key: 'ammo', label: 'Ammo/Relic', placeholder: '🏹', row: 2, col: 3 },
  // Row 3
  { key: 'weapon', label: 'Weapon', placeholder: '🗡️', row: 3, col: 1 },
  { key: 'body', label: 'Body', placeholder: '🥋', row: 3, col: 2 },
  { key: 'shield', label: 'Shield', placeholder: '🛡️', row: 3, col: 3 },
  // Row 4
  { key: null, row: 4, col: 1 },
  { key: 'legs', label: 'Legs', placeholder: '🦿', row: 4, col: 2 },
  { key: null, row: 4, col: 3 },
  // Row 5
  { key: 'hands', label: 'Hands', placeholder: '🧤', row: 5, col: 1 },
  { key: 'feet', label: 'Feet', placeholder: '👢', row: 5, col: 2 },
  { key: 'ring', label: 'Ring', placeholder: '💍', row: 5, col: 3 },
];

export function getRarityColor(rarity = '') {
  if (rarity.includes('Skill Mastery')) return '#fde047';
  if (rarity.includes('Continental Set') || rarity.includes('Barrows') || rarity.includes('Ancient Set')) return '#facc15';
  if (rarity.includes('Mythic') || rarity.includes('Apex')) return '#f59e0b';
  if (rarity.includes('Epic')) return '#c084fc';
  if (rarity.includes('Rare')) return '#38bdf8';
  return '#94a3b8';
}

// ==========================================
// 1. RUNESCAPE WORN EQUIPMENT MODAL [K]
// ==========================================
export function renderEquipmentModal({ profile }) {
  const container = document.getElementById('equipment-modal-body');
  if (!container) return;

  const faction = profile?.faction || 'Solari';
  const classId = profile?.classId || 'solari_vanguard';
  const cls = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;
  const equip = { ...cls.defaultEquipment, ...(profile?.equipment || {}) };
  // Normalise body/armor and shield/offhand
  if (equip.armor && !equip.body) equip.body = equip.armor;
  if (equip.offhand && !equip.shield) equip.shield = equip.offhand;

  const statBonuses = getEquipmentStatBonuses(equip, classId);
  const { active: activeSets, progress: setProgress } = getActiveSetBonuses(equip);

  container.innerHTML = `
    <div class="rs-paperdoll-wrapper">
      <!-- LEFT: RuneScape Paperdoll 11-Slot Grid -->
      <div>
        <div style="font-family:var(--font-header); font-size:10px; color:#d97706; text-align:center; margin-bottom:8px; letter-spacing:0.5px;">
          ✦ WORN EQUIPMENT SLOTS ✦
        </div>

        <div class="rs-paperdoll-grid">
          ${RS_SLOTS_LAYOUT.map((s, idx) => {
            if (!s.key) {
              return `<div style="width:56px; height:56px; opacity:0; pointer-events:none;"></div>`;
            }
            const equippedId = equip[s.key] || (s.key === 'body' ? equip.armor : s.key === 'shield' ? equip.offhand : null);
            const item = equippedId ? EQUIPMENT_CATALOG[equippedId] : null;
            const borderCol = item ? getRarityColor(item.rarity) : '#57534e';

            return `
              <div class="rs-equip-slot ${item ? 'filled' : ''}"
                   style="border-color:${borderCol};"
                   onclick="window.unequipSlot('${s.key}')"
                   onmouseenter="window.setHoveredEquipment('${item ? item.id : ''}', 'equipped', event)"
                   onmousemove="window.updateHoveredEquipmentPos(event)"
                   onmouseleave="window.clearHoveredEquipment()">
                ${item ? `
                  <img class="pixel-art" src="${getItemIconDataUrl(item.id, 24)}" width="24" height="24" style="image-rendering:pixelated; display:block; margin:0 auto;" alt="${item.name}" />
                  <div style="font-size:7.5px; color:${borderCol}; font-weight:700; max-width:52px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; margin-top:2px;">
                    ${item.name.replace(/^(Sunforged|Ironwood|Chrono|Duskveil|Aurelius)\s*/i, '')}
                  </div>
                ` : `
                  <div class="rs-slot-placeholder">${s.placeholder}</div>
                  <div class="rs-slot-label">${s.label}</div>
                `}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Live Player Animated Sprite Canvas -->
        <div style="display:flex; align-items:center; gap:10px; background:#141210; border:2px solid #57534e; border-radius:4px; padding:8px 12px; margin-top:10px;">
          <canvas id="rs-paperdoll-canvas" width="64" height="68" style="background:#090f20; border:2px solid #78350f; border-radius:3px; image-rendering:pixelated;"></canvas>
          <div style="font-size:9.5px; line-height:1.45;">
            <div style="color:#fde047; font-family:var(--font-header); font-weight:700;">${profile?.displayName || 'Champion'}</div>
            <div style="color:#94a3b8; font-size:8.5px;">${cls.name} • ${faction}</div>
            <div style="color:#4ade80; font-size:8px; margin-top:3px;">Sprites reflect equipped weapons &amp; armors in real time.</div>
          </div>
        </div>

        <button class="util-btn" style="width:100%; margin-top:10px; border-color:#d97706; color:#fed7aa;" onclick="toggleModal('inventory-modal')">
          🎒 OPEN 28-SLOT BACKPACK [B]
        </button>
      </div>

      <!-- RIGHT: Combat Bonuses & Canonical Faction Set Perks -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <!-- Hovered Equipment Bonus Inspection Card -->
        <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:8px 10px;">
          <div style="font-family:var(--font-header); font-size:9.5px; color:#fde047; margin-bottom:4px; border-bottom:1px solid #292524; padding-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
            <span>🔍 INSPECTED EQUIPMENT BONUSES</span>
            <span style="font-size:7.5px; color:#94a3b8;">HOVER PREVIEW</span>
          </div>
          <div id="hovered-gear-card">
            ${getHoveredCardHtml(currentHoveredItemId, currentHoveredSource)}
          </div>
        </div>

        <!-- Combat Stat Bonuses Breakdown -->
        <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:8px 12px;">
          <div style="font-family:var(--font-header); font-size:10px; color:#fde047; margin-bottom:6px; border-bottom:1px solid #292524; padding-bottom:4px;">
            📊 TOTAL COMBAT STAT BONUSES
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:9.5px;">
            <div style="background:#1c1917; border:1px solid #292524; padding:5px 8px; border-radius:3px;">
              <span style="color:#94a3b8;">⚔️ Attack / Power:</span>
              <b style="color:#fde047; float:right;">+${statBonuses.power}</b>
            </div>
            <div style="background:#1c1917; border:1px solid #292524; padding:5px 8px; border-radius:3px;">
              <span style="color:#94a3b8;">🛡️ Defense / Bastion:</span>
              <b style="color:#4ade80; float:right;">+${statBonuses.bastion}</b>
            </div>
            <div style="background:#1c1917; border:1px solid #292524; padding:5px 8px; border-radius:3px;">
              <span style="color:#94a3b8;">🔮 Magic / Resonance:</span>
              <b style="color:#38bdf8; float:right;">+${statBonuses.resonance}</b>
            </div>
            <div style="background:#1c1917; border:1px solid #292524; padding:5px 8px; border-radius:3px;">
              <span style="color:#94a3b8;">⚡ Speed / Tempo:</span>
              <b style="color:#c084fc; float:right;">+${statBonuses.tempo}</b>
            </div>
          </div>
        </div>

        <!-- Canonical Ancient Faction Set Bonuses -->
        <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:10px 12px; flex:1;">
          <div style="font-family:var(--font-header); font-size:10px; color:#facc15; margin-bottom:8px; border-bottom:1px solid #292524; padding-bottom:4px; display:flex; justify-content:space-between;">
            <span>🛡️ ANCIENT FACTION SET BONUSES</span>
            <span style="color:${activeSets.length > 0 ? '#4ade80' : '#78716c'}; font-size:8.5px;">
              ${activeSets.length > 0 ? `✨ ${activeSets.length} ACTIVE` : 'NONE ACTIVE'}
            </span>
          </div>

          ${activeSets.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">
              ${activeSets.map((s) => `
                <div style="background:radial-gradient(circle, #292524 0%, #1c1917 100%); border:2px solid ${s.color}; border-radius:4px; padding:8px 10px; box-shadow:0 0 12px rgba(250,204,21,0.2);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="color:${s.color}; font-size:10.5px;">✨ ${s.name} (4/4 COMPLETE)</b>
                    <span style="background:#14532d; color:#4ade80; border:1px solid #22c55e; font-size:7.5px; font-weight:700; padding:1px 5px; border-radius:3px;">ACTIVE PERK</span>
                  </div>
                  <div style="color:#fde047; font-size:9px; font-weight:700; margin-top:3px;">${s.perkTitle}</div>
                  <div style="color:#e2e8f0; font-size:8.5px; line-height:1.4; margin-top:2px;">${s.perkDesc}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Equipped In-Progress Sets (Only show if at least 1 piece is worn!) -->
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${(() => {
              const equippedIds = new Set(Object.values(equip));
              const inProgressSets = Object.values(BARROWS_SETS).filter((s) => {
                const count = s.pieces.filter((p) => equippedIds.has(p)).length;
                return count > 0 && count < s.pieces.length;
              });

              if (inProgressSets.length === 0 && activeSets.length === 0) {
                return `
                  <div style="color:#78716c; font-size:9px; text-align:center; padding:16px 8px; font-style:italic; line-height:1.5;">
                    No ancient faction set pieces currently equipped.<br/>
                    <span style="color:#a8a29e; font-size:8px;">Defeat Continental World Bosses to forge 4-piece set synergies!</span>
                  </div>
                `;
              }

              return inProgressSets.map((s) => {
                const matchCount = s.pieces.filter((p) => equippedIds.has(p)).length;
                return `
                  <div style="background:#181512; border:1px solid #78350f; border-radius:3px; padding:6px 8px; font-size:8.5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="color:${s.color}; font-weight:700;">${s.name}</span>
                      <span style="color:#fde047; font-weight:700;">${matchCount} / ${s.pieces.length} Pieces Equipped</span>
                    </div>
                    <div style="color:#94a3b8; font-size:7.5px; margin-top:3px; display:flex; flex-wrap:wrap; gap:4px;">
                      ${s.pieces.map((pid) => {
                        const hasPiece = equippedIds.has(pid);
                        const def = EQUIPMENT_CATALOG[pid];
                        const pieceName = def?.name?.replace(/^(Sunforged|Ironwood|Chrono|Duskveil|Aurelius|Morning Star|Starforged)\s*/i, '') || pid;
                        return `<span style="color:${hasPiece ? '#4ade80' : '#57534e'}; font-weight:${hasPiece ? '700' : '400'}; background:#0c0a09; padding:1px 4px; border-radius:2px; border:1px solid ${hasPiece ? '#15803d' : '#292524'};">${hasPiece ? '✓' : '○'} ${pieceName}</span>`;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('');
            })()}
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw paperdoll sprite canvas
  const cv = document.getElementById('rs-paperdoll-canvas');
  if (cv && typeof cv.getContext === 'function') {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#090f20';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const sprites = getCharacterSprites(faction, classId, equip);
    if (sprites && sprites.down && sprites.down[0]) {
      ctx.drawImage(sprites.down[0], 4, 3, 56, 62);
    }
  }
}

// ==========================================
// 2. RUNESCAPE 28-SLOT INVENTORY BACKPACK [B]
// ==========================================
export function renderInventoryModal({ profile }) {
  const container = document.getElementById('inventory-modal-body');
  if (!container) return;

  const inv = Array.isArray(profile?.inventory) ? profile.inventory : [];
  const capacity = 28;
  const countPip = document.getElementById('inv-count-pip');
  if (countPip) {
    countPip.textContent = String(inv.length);
    countPip.style.display = inv.length > 0 ? 'inline-block' : 'none';
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:9.5px;">
      <span style="color:#fde047; font-family:var(--font-header);">
        🎒 BACKPACK SLOTS: <b style="color:${inv.length >= 28 ? '#ef4444' : '#4ade80'};">${inv.length} / ${capacity}</b>
      </span>
      <span style="color:#94a3b8; font-size:8.5px;">
        Left-Click to Equip • Drag to Action Bar • Right-Click to Drop
      </span>
    </div>

    <!-- 4x7 RuneScape Grid = 28 Slots -->
    <div class="rs-inv-grid">
      ${Array.from({ length: capacity }).map((_, i) => {
        const itemObj = inv[i];
        const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
        const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;

        if (item) {
          const borderCol = getRarityColor(item.rarity);
          return `
            <div class="rs-inv-slot"
                 style="border-color:${borderCol}; cursor:grab;"
                 draggable="true"
                 ondragstart="window.beginActionDrag(event, 'item', '${item.id}')"
                 onclick="window.equipInventorySlot(${i})"
                 oncontextmenu="event.preventDefault(); window.dropInventorySlot(${i});"
                 onmouseenter="window.setHoveredEquipment('${item.id}', 'inventory', event)"
                 onmousemove="window.updateHoveredEquipmentPos(event)"
                 onmouseleave="window.clearHoveredEquipment()">
              <img class="pixel-art" src="${getItemIconDataUrl(item.id, 24)}" width="24" height="24" style="image-rendering:pixelated; display:block; margin:0 auto;" alt="${item.name}" />
              <div style="font-size:7px; color:${borderCol}; font-weight:700; max-width:48px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; margin-top:2px;">
                ${item.name.replace(/^(Sunforged|Ironwood|Chrono|Duskveil|Aurelius)\s*/i, '')}
              </div>
              ${itemObj?.qty > 1 ? `<div style="position:absolute; bottom:2px; right:4px; font-size:8px; font-weight:bold; color:#fde047;">${itemObj.qty}</div>` : ''}
            </div>
          `;
        }

        return `
          <div class="rs-inv-slot empty">
            <span style="color:#44403c; font-size:9px; font-family:var(--font-header);">${i + 1}</span>
          </div>
        `;
      }).join('')}
    </div>

    <div style="display:flex; justify-content:space-between; gap:8px; margin-top:12px;">
      <button class="util-btn" style="flex:1; border-color:#fb923c; color:#fed7aa;" onclick="toggleModal('equipment-modal')">
        ⚔️ WORN GEAR [K]
      </button>
    </div>
  `;
}

// ==========================================
// 3. AETHERSWAP CONTINENTAL EXCHANGE [X]
// ==========================================
let currentExchangeTab = 'listings'; // 'listings' | 'search' | 'popular'
let currentExchangeFilter = '';
let currentExchangeCategory = 'all';
let activeOrderDialog = null; // null | { mode: 'BUY'|'SELL', slot: number, itemId: string, qty: number, unitPrice: number }

export const POPULAR_EXCHANGE_PRODUCTS = [
  { id: 'minor_healing_salve', trend: '🔥 SURGING DEMAND', tag: 'Dungeon Runs & Boss Raids', volume: '1,840 trades' },
  { id: 'glimmer_draught', trend: '🔥 HIGH DEMAND', tag: 'Sanctuary Spellcasters', volume: '1,220 trades' },
  { id: 'solar_gold', trend: '⚡ CONTINENTAL STANDARD', tag: 'Primary Currency Standard', volume: '45,000 trades' },
  { id: 'glimmer_shard', trend: '📈 STEADY DEMAND', tag: 'Leyline Infusion & Rites', volume: '3,400 trades' },
  { id: 'chrono_gem', trend: '📈 HIGH DEMAND', tag: 'Aether Chronoflux Crafting', volume: '850 trades' },
  { id: 'verdant_amber', trend: '📈 STEADY DEMAND', tag: 'Terra Primordial Hardening', volume: '790 trades' },
  { id: 'void_essence', trend: '📈 STEADY DEMAND', tag: 'Umbri Shadow Reforging', volume: '650 trades' },
  { id: 'chrono_astral_hood', trend: '🌟 LEGENDARY DEMAND', tag: 'Chrono-Weaver Set Piece', volume: '120 trades' },
  { id: 'sunforged_greathelm', trend: '🌟 LEGENDARY DEMAND', tag: 'Daystar Bulwark Set Piece', volume: '140 trades' },
  { id: 'duskveil_twin_daggers', trend: '🌟 LEGENDARY DEMAND', tag: 'Shadow Reaver Set Piece', volume: '110 trades' },
  { id: 'ironwood_spear', trend: '🌟 HIGH DEMAND', tag: 'Ironwood Bastion Set Piece', volume: '95 trades' },
  { id: 'iron_broadsword', trend: '⚔️ STARTER POPULAR', tag: 'Novice Starter Blade', volume: '420 trades' },
  { id: 'scout_leather_tunic', trend: '🥋 STARTER POPULAR', tag: 'Novice Mobility Tunic', volume: '380 trades' },
  { id: 'crown_of_dawn', trend: '👑 APEX TITAN DEMAND', tag: 'Aurelius Sovereign Titan', volume: '45 trades' },
];

export function getItemGuidePrice(itemId) {
  const it = EQUIPMENT_CATALOG[itemId];
  if (!it) return 50;
  if (it.guidePrice) return it.guidePrice;
  if (it.rarity?.includes('Apex') || it.rarity?.includes('Mythic')) return 1250;
  if (it.rarity?.includes('Continental Set') || it.rarity?.includes('Ancient Set') || it.set) return 500;
  if (it.slot === 'currency') {
    if (itemId === 'solar_gold') return 1;
    if (itemId === 'glimmer_shard') return 8;
    if (itemId === 'chrono_gem') return 25;
    if (itemId === 'verdant_amber') return 22;
    if (itemId === 'void_essence') return 30;
    return 10;
  }
  if (it.slot === 'consumable') {
    if (itemId === 'minor_healing_salve') return 10;
    if (itemId === 'glimmer_draught') return 12;
    if (itemId === 'major_vitality_elixir') return 25;
    if (itemId === 'sweet_apple') return 3;
    if (itemId === 'fresh_crusty_bread') return 6;
    if (itemId === 'field_rations') return 10;
    return 15;
  }
  if (it.slot === 'material') {
    if (itemId === 'iron_ore') return 6;
    if (itemId === 'bronze_bar') return 14;
    if (itemId === 'ancient_relic_fragment') return 18;
    return 10;
  }
  if (it.id?.startsWith('iron_') || it.id?.startsWith('scout_') || it.id?.startsWith('novice_')) return 45;
  if (it.slot === 'ring' || it.slot === 'cape' || it.slot === 'neck') return 110;
  return 75;
}

export function getExchangeOffers() {
  try {
    const raw = localStorage.getItem('glimmerfall_aetherswap_offers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 8) return parsed;
    }
  } catch (_) {}

  const defaults = [
    { slot: 1, type: 'BUY', itemId: 'chrono_astral_hood', qty: 1, filledQty: 1, unitPrice: 520, totalPrice: 520, progress: 100, completed: true, createdAt: Date.now() - 60000 },
    { slot: 2, type: 'SELL', itemId: 'minor_healing_salve', qty: 5, filledQty: 3, unitPrice: 15, totalPrice: 75, progress: 65, completed: false, createdAt: Date.now() - 30000 },
    { slot: 3, type: null, itemId: null, qty: 0, filledQty: 0, unitPrice: 0, totalPrice: 0, progress: 0, completed: false },
    { slot: 4, type: null, itemId: null, qty: 0, filledQty: 0, unitPrice: 0, totalPrice: 0, progress: 0, completed: false },
    { slot: 5, type: null, itemId: null, qty: 0, filledQty: 0, unitPrice: 0, totalPrice: 0, progress: 0, completed: false },
    { slot: 6, type: null, itemId: null, qty: 0, filledQty: 0, unitPrice: 0, totalPrice: 0, progress: 0, completed: false },
    { slot: 7, type: null, itemId: null, qty: 0, filledQty: 0, unitPrice: 0, totalPrice: 0, progress: 0, completed: false },
    { slot: 8, type: null, itemId: null, qty: 0, filledQty: 0, unitPrice: 0, totalPrice: 0, progress: 0, completed: false },
  ];
  saveExchangeOffers(defaults);
  return defaults;
}

export function saveExchangeOffers(offers) {
  try {
    localStorage.setItem('glimmerfall_aetherswap_offers', JSON.stringify(offers));
  } catch (_) {}
}

export function getPlayerGold(profile) {
  let total = 0;
  for (const it of (profile?.inventory || [])) {
    if (!it) continue;
    const id = typeof it === 'string' ? it : it.id;
    const qty = typeof it === 'object' && it.qty ? it.qty : 1;
    if (id === 'solar_gold') total += qty;
  }
  return total + (profile?.gold || 0);
}

export function deductPlayerGold(profile, amount) {
  let needed = amount;
  if (!profile.inventory) profile.inventory = [];
  for (let i = 0; i < profile.inventory.length; i++) {
    const it = profile.inventory[i];
    if (!it) continue;
    const id = typeof it === 'string' ? it : it.id;
    if (id === 'solar_gold') {
      const currentQty = typeof it === 'object' && it.qty ? it.qty : 1;
      if (currentQty <= needed) {
        needed -= currentQty;
        profile.inventory.splice(i, 1);
        i--;
      } else {
        it.qty -= needed;
        needed = 0;
        break;
      }
    }
  }
  if (needed > 0 && profile.gold) {
    profile.gold = Math.max(0, profile.gold - needed);
  }
}

export function addPlayerGold(profile, amount) {
  if (amount <= 0) return;
  if (!profile.inventory) profile.inventory = [];
  const existing = profile.inventory.find((it) => (typeof it === 'object' ? it.id : it) === 'solar_gold');
  if (existing && typeof existing === 'object') {
    existing.qty = (existing.qty || 1) + amount;
  } else {
    if (profile.inventory.length < 28) {
      profile.inventory.push({ id: 'solar_gold', qty: amount });
    } else {
      profile.gold = (profile.gold || 0) + amount;
    }
  }
}

export function addItemToBackpack(profile, itemId, qty = 1) {
  if (!profile.inventory) profile.inventory = [];
  const existing = profile.inventory.find((it) => (typeof it === 'object' ? it.id : it) === itemId);
  if (existing) {
    if (typeof existing === 'string') {
      const idx = profile.inventory.indexOf(existing);
      profile.inventory[idx] = { id: itemId, qty: 1 + qty };
    } else {
      existing.qty = (existing.qty || 1) + qty;
    }
    return true;
  }
  if (profile.inventory.length >= 28) return false;
  profile.inventory.push({ id: itemId, qty });
  return true;
}

export function removeItemFromBackpack(profile, itemId, qty = 1) {
  if (!profile.inventory) return false;
  let remaining = qty;
  for (let i = profile.inventory.length - 1; i >= 0; i--) {
    const it = profile.inventory[i];
    if (!it) continue;
    const id = typeof it === 'string' ? it : it.id;
    if (id === itemId) {
      const currentQty = typeof it === 'object' && it.qty ? it.qty : 1;
      if (currentQty <= remaining) {
        remaining -= currentQty;
        profile.inventory.splice(i, 1);
      } else {
        it.qty -= remaining;
        remaining = 0;
      }
      if (remaining <= 0) return true;
    }
  }
  return remaining <= 0;
}

export function countItemInBackpack(profile, itemId) {
  let count = 0;
  for (const it of (profile?.inventory || [])) {
    if (!it) continue;
    const id = typeof it === 'string' ? it : it.id;
    const qty = typeof it === 'object' && it.qty ? it.qty : 1;
    if (id === itemId) count += qty;
  }
  return count;
}

export function tickExchangeOffers(profile) {
  const offers = getExchangeOffers();
  let changed = false;
  for (const o of offers) {
    if (o.type && !o.completed && o.progress < 100) {
      o.progress = Math.min(100, (o.progress || 0) + Math.floor(Math.random() * 18) + 12);
      if (o.progress >= 100) {
        o.completed = true;
        o.filledQty = o.qty;
      }
      changed = true;
    }
  }
  if (changed) {
    saveExchangeOffers(offers);
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('exchange-modal');
      if (modal && modal.style.display !== 'none') {
        renderExchangeModal({ profile });
      }
    }
  }
}

export function renderExchangeModal({ profile }) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('exchange-modal-body');
  if (!container) return;

  const offers = getExchangeOffers();
  const playerGold = getPlayerGold(profile);
  const playerGlimmer = profile?.glimmer || 0;

  // Render top header banner
  const headerHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#070d1e; border:2px solid #0284c7; border-radius:5px; padding:10px 14px; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="font-size:30px;">🌀</div>
        <div>
          <div style="font-family:var(--font-header); font-size:12px; font-weight:800; color:#7dd3fc; letter-spacing:0.5px;">
            AETHERSWAP CONTINENTAL EXCHANGE
          </div>
          <div style="color:#94a3b8; font-size:9px; margin-top:2px; max-width:540px; line-height:1.35;">
            An inter-faction commerce alliance developed by the Aether Astral Enclave. Buy and sell weapons, armors, faction sets, and goods across all continental realms in the Shattered Nexus.
          </div>
        </div>
      </div>
      <div style="text-align:right; font-family:var(--font-header); font-size:10px; background:#0a1326; border:1px solid #1e293b; padding:6px 10px; border-radius:4px;">
        <div style="color:#fde047; font-weight:bold;">🪙 ${playerGold.toLocaleString()} SOVEREIGNS</div>
        <div style="color:#38bdf8; font-size:9px; margin-top:2px;">✦ ${playerGlimmer} GLIMMER</div>
      </div>
    </div>

    <!-- Navigation Tabs Bar -->
    <div style="display:flex; gap:6px; margin-bottom:12px; border-bottom:1px solid #1e293b; padding-bottom:6px;">
      <button type="button" class="util-btn" style="flex:1; border-color:${currentExchangeTab === 'listings' ? '#38bdf8' : '#334155'}; background:${currentExchangeTab === 'listings' ? '#0c1b33' : 'transparent'}; color:${currentExchangeTab === 'listings' ? '#7dd3fc' : '#94a3b8'}; font-weight:bold; font-size:10px;" onclick="window.switchExchangeTab('listings')">
        📋 YOUR LISTINGS (8 SLOTS)
      </button>
      <button type="button" class="util-btn" style="flex:1; border-color:${currentExchangeTab === 'search' ? '#38bdf8' : '#334155'}; background:${currentExchangeTab === 'search' ? '#0c1b33' : 'transparent'}; color:${currentExchangeTab === 'search' ? '#7dd3fc' : '#94a3b8'}; font-weight:bold; font-size:10px;" onclick="window.switchExchangeTab('search')">
        🔍 BUY MARKET &amp; SEARCH ENGINE
      </button>
      <button type="button" class="util-btn" style="flex:1; border-color:${currentExchangeTab === 'popular' ? '#f59e0b' : '#334155'}; background:${currentExchangeTab === 'popular' ? '#241406' : 'transparent'}; color:${currentExchangeTab === 'popular' ? '#fde047' : '#94a3b8'}; font-weight:bold; font-size:10px;" onclick="window.switchExchangeTab('popular')">
        🔥 POPULAR PRODUCTS IN DEMAND
      </button>
    </div>
  `;

  // TAB 1: 📋 YOUR LISTINGS
  function renderListingsTab() {
    let orderDialogHtml = '';
    if (activeOrderDialog) {
      const d = activeOrderDialog;
      const isBuy = d.mode === 'BUY';
      const itemDef = EQUIPMENT_CATALOG[d.itemId];
      const totalCost = d.qty * d.unitPrice;
      const canAfford = isBuy ? playerGold >= totalCost : countItemInBackpack(profile, d.itemId) >= d.qty;

      orderDialogHtml = `
        <div style="background:#091224; border:2px solid ${isBuy ? '#38bdf8' : '#f59e0b'}; border-radius:6px; padding:12px 14px; margin-bottom:14px; box-shadow:0 0 16px rgba(2,132,199,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-family:var(--font-header); font-size:11px; font-weight:800; color:${isBuy ? '#7dd3fc' : '#fed7aa'};">
              🌀 CONFIGURE NEW ${d.mode} OFFER (OFFER BOX #${d.slot})
            </span>
            <button class="id-mini-btn" onclick="window.closeExchangeOrderDialog()" style="padding:2px 8px;">✕ CANCEL</button>
          </div>

          <div style="display:grid; grid-template-columns: 240px 1fr; gap:16px; align-items:center;">
            <!-- Left: Item Card -->
            <div style="background:#060b18; border:1px solid #1e293b; border-radius:4px; padding:10px; display:flex; align-items:center; gap:10px;">
              <img class="pixel-art" src="${getItemIconDataUrl(d.itemId, 32)}" alt="${itemDef?.name || d.itemId}" style="width:32px; height:32px; object-fit:contain; border:1px solid #1e293b; background:#040711; border-radius:4px; padding:2px;" />
              <div>
                <b style="color:#f8fafc; font-size:11px; display:block;">${itemDef?.name || d.itemId}</b>
                <span style="color:#38bdf8; font-size:8.5px;">${itemDef?.rarity || 'Common'} • ${itemDef?.slot?.toUpperCase() || 'ITEM'}</span>
                <div style="color:#fde047; font-size:9px; margin-top:3px;">Guide Price: <b>${getItemGuidePrice(d.itemId)} 🪙</b></div>
              </div>
            </div>

            <!-- Right: Controls -->
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; gap:12px; align-items:center;">
                <!-- Quantity -->
                <div style="flex:1;">
                  <label style="font-size:8.5px; color:#94a3b8; display:block; margin-bottom:2px;">QUANTITY</label>
                  <div style="display:flex; align-items:center; gap:4px;">
                    <button class="util-btn" style="padding:2px 6px; font-size:10px;" onclick="window.adjustOrderQty(-1)">-</button>
                    <input type="number" min="1" max="999" value="${d.qty}" onchange="window.setOrderQty(this.value)" style="background:#060a16; border:1px solid #334155; color:#f8fafc; text-align:center; width:60px; font-size:10px; padding:3px;" />
                    <button class="util-btn" style="padding:2px 6px; font-size:10px;" onclick="window.adjustOrderQty(1)">+</button>
                    <button class="id-mini-btn" style="font-size:8px; padding:2px 5px;" onclick="window.adjustOrderQty(5)">+5</button>
                    <button class="id-mini-btn" style="font-size:8px; padding:2px 5px;" onclick="window.adjustOrderQty(10)">+10</button>
                  </div>
                </div>

                <!-- Price per Item -->
                <div style="flex:1;">
                  <label style="font-size:8.5px; color:#94a3b8; display:block; margin-bottom:2px;">PRICE EACH (SOVEREIGNS)</label>
                  <div style="display:flex; align-items:center; gap:4px;">
                    <button class="util-btn" style="padding:2px 6px; font-size:10px;" onclick="window.adjustOrderPrice(-5)">-</button>
                    <input type="number" min="1" value="${d.unitPrice}" onchange="window.setOrderPrice(this.value)" style="background:#060a16; border:1px solid #334155; color:#fde047; text-align:center; width:70px; font-size:10px; padding:3px; font-weight:bold;" />
                    <button class="util-btn" style="padding:2px 6px; font-size:10px;" onclick="window.adjustOrderPrice(5)">+</button>
                    <button class="id-mini-btn" style="font-size:8px; padding:2px 5px;" onclick="window.resetOrderToGuidePrice()">GUIDE</button>
                  </div>
                </div>
              </div>

              <!-- Total calculation and Confirm -->
              <div style="display:flex; justify-content:space-between; align-items:center; background:#060a16; border:1px solid #1e293b; padding:6px 10px; border-radius:4px;">
                <span style="font-size:9.5px; color:#cbd5e1;">
                  Total ${isBuy ? 'Deposit Required' : 'Proceeds Expected'}: <b style="color:#fde047; font-size:11px;">${totalCost.toLocaleString()} 🪙</b>
                </span>
                <button class="util-btn"
                  style="border-color:${canAfford ? (isBuy ? '#38bdf8' : '#f59e0b') : '#ef4444'}; color:${canAfford ? '#ffffff' : '#fca5a5'}; background:${canAfford ? (isBuy ? '#0284c7' : '#d97706') : '#7f1d1d'}; font-weight:bold; font-size:9.5px; padding:4px 12px;"
                  ${canAfford ? `onclick="window.confirmExchangeOrder()"` : 'disabled'}>
                  ${canAfford ? `CONFIRM ${d.mode} OFFER ▸` : (isBuy ? 'INSUFFICIENT GOLD ✕' : 'INSUFFICIENT ITEMS ✕')}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      ${orderDialogHtml}
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px;">
        ${offers.map((o) => {
          if (!o.type) {
            return `
              <div class="rs-ge-box" style="border:1.5px dashed #475569; background:#070b18; min-height:130px; display:flex; flex-direction:column; justify-content:space-between; padding:10px 8px; border-radius:5px;">
                <div style="text-align:center;">
                  <span style="font-size:22px; opacity:0.35;">📦</span>
                  <div style="color:#94a3b8; font-size:8.5px; font-weight:bold; margin-top:4px;">SLOT #${o.slot} (EMPTY)</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                  <button class="util-btn" style="border-color:#0284c7; color:#7dd3fc; font-size:8px; padding:3px;" onclick="window.startExchangeBuy(${o.slot})">
                    🛒 + BUY OFFER
                  </button>
                  <button class="util-btn" style="border-color:#d97706; color:#fed7aa; font-size:8px; padding:3px;" onclick="window.startExchangeSell(${o.slot})">
                    🏷️ + SELL OFFER
                  </button>
                </div>
              </div>
            `;
          }

          const isBuy = o.type === 'BUY';
          const itemDef = EQUIPMENT_CATALOG[o.itemId];
          const borderCol = o.completed ? '#22c55e' : isBuy ? '#38bdf8' : '#f59e0b';

          return `
            <div class="rs-ge-box" style="border:2px solid ${borderCol}; background:#080d1e; min-height:130px; display:flex; flex-direction:column; justify-content:space-between; padding:8px 10px; border-radius:5px;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:8px; font-weight:800; background:${isBuy ? '#172554' : '#7c2d12'}; color:${isBuy ? '#93c5fd' : '#fed7aa'}; padding:1px 5px; border-radius:3px;">
                    ${o.type} #${o.slot}
                  </span>
                  <span style="font-size:8px; font-weight:800; color:${o.completed ? '#4ade80' : '#fde047'};">
                    ${o.completed ? 'COMPLETED ✓' : `${o.progress}% FILLING`}
                  </span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin:6px 0;">
                  <img class="pixel-art" src="${getItemIconDataUrl(o.itemId, 28)}" alt="${itemDef?.name || o.itemId}" style="width:28px; height:28px; object-fit:contain; border:1px solid #1e293b; background:#040711; border-radius:4px; padding:2px;" />
                  <div style="overflow:hidden; line-height:1.25;">
                    <div style="font-size:9.5px; font-weight:bold; color:#f8fafc; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${itemDef?.name || o.itemId}">
                      ${itemDef?.name || o.itemId}
                    </div>
                    <div style="font-size:8px; color:#cbd5e1;">Qty: <b>${o.qty}</b> @ <b style="color:#fde047;">${o.unitPrice} 🪙</b></div>
                    <div style="font-size:8px; color:#94a3b8;">Total: <b style="color:#fde047;">${o.totalPrice} 🪙</b></div>
                  </div>
                </div>
              </div>

              <div>
                <div style="background:#050811; border-radius:2px; height:6px; overflow:hidden; border:1px solid #1e293b; margin-bottom:6px;">
                  <div style="background:${o.completed ? '#22c55e' : '#38bdf8'}; width:${o.progress}%; height:100%; transition:width 0.3s ease;"></div>
                </div>
                ${o.completed ? `
                  <button class="util-btn" style="width:100%; padding:3px; font-size:8px; font-weight:bold; border-color:#22c55e; color:#4ade80; background:rgba(34,197,94,0.15);" onclick="window.collectExchangeOffer(${o.slot})">
                    📦 COLLECT ${isBuy ? itemDef?.name?.slice(0, 12) : `${o.totalPrice} 🪙`}
                  </button>
                ` : `
                  <button class="util-btn" style="width:100%; padding:2px; font-size:7.5px; border-color:#ef4444; color:#fca5a5;" onclick="window.abortExchangeOffer(${o.slot})">
                    ABORT OFFER ✕
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // TAB 2: 🔍 BUY MARKET & SEARCH ENGINE
  function renderSearchTab() {
    const allItems = Object.values(EQUIPMENT_CATALOG);
    const filtered = allItems.filter((it) => {
      if (currentExchangeCategory !== 'all') {
        if (currentExchangeCategory === 'weapon' && it.slot !== 'weapon') return false;
        if (currentExchangeCategory === 'armor' && !['head', 'body', 'legs', 'shield'].includes(it.slot)) return false;
        if (currentExchangeCategory === 'set' && !it.set) return false;
        if (currentExchangeCategory === 'consumable' && it.slot !== 'consumable') return false;
        if (currentExchangeCategory === 'currency' && it.slot !== 'currency') return false;
        if (currentExchangeCategory === 'accessories' && !['cape', 'neck', 'ring', 'hands', 'feet', 'ammo'].includes(it.slot)) return false;
      }
      if (!currentExchangeFilter) return true;
      const q = currentExchangeFilter.toLowerCase();
      return it.name.toLowerCase().includes(q) || (it.slot && it.slot.toLowerCase().includes(q)) || (it.desc && it.desc.toLowerCase().includes(q));
    });

    return `
      <!-- Category Filters & Search Input Bar -->
      <div style="background:#091024; border:1px solid #1e293b; border-radius:5px; padding:10px 12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
          <input id="rs-ge-search-input"
                 type="text"
                 placeholder="Search weapon, armor, faction set, potion, currency..."
                 value="${currentExchangeFilter}"
                 oninput="window.setExchangeFilter(this.value)"
                 style="flex:1; background:#060b18; border:1px solid #334155; color:#f8fafc; padding:5px 10px; font-size:10px; border-radius:4px;" />
          <button class="id-mini-btn" style="padding:4px 8px;" onclick="window.setExchangeFilter('')">CLEAR</button>
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          ${[
            { key: 'all', label: 'ALL GOODS' },
            { key: 'weapon', label: '⚔️ WEAPONS' },
            { key: 'armor', label: '🛡️ ARMORS' },
            { key: 'set', label: '👑 FACTION SETS' },
            { key: 'consumable', label: '🧪 CONSUMABLES' },
            { key: 'currency', label: '🪙 CURRENCIES' },
            { key: 'accessories', label: '📿 ACCESSORIES' },
          ].map(cat => `
            <button type="button" class="id-mini-btn" style="font-size:8px; padding:2px 7px; border-color:${currentExchangeCategory === cat.key ? '#38bdf8' : '#334155'}; color:${currentExchangeCategory === cat.key ? '#7dd3fc' : '#94a3b8'}; background:${currentExchangeCategory === cat.key ? '#0c1b33' : 'transparent'};" onclick="window.setExchangeCategory('${cat.key}')">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Items Grid -->
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; max-height:360px; overflow-y:auto; padding-right:4px;">
        ${filtered.map((it) => {
          const borderCol = getRarityColor(it.rarity);
          const guidePrice = getItemGuidePrice(it.id);
          const inBagCount = countItemInBackpack(profile, it.id);

          return `
            <div style="background:#080d1e; border:1px solid ${borderCol}; border-radius:4px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;"
                 onmouseenter="window.setHoveredEquipment('${it.id}', 'exchange', event)"
                 onmousemove="window.updateHoveredEquipmentPos(event)"
                 onmouseleave="window.clearHoveredEquipment()">
              <div style="display:flex; align-items:center; gap:10px;">
                <img class="pixel-art" src="${getItemIconDataUrl(it.id, 26)}" alt="${it.name}" style="width:26px; height:26px; object-fit:contain; border:1px solid ${borderCol}; background:#040711; border-radius:4px; padding:2px;" />
                <div style="font-size:9px; line-height:1.35;">
                  <b style="color:#f8fafc;">${it.name}</b>
                  <div style="color:${borderCol}; font-size:7.5px;">${it.rarity || 'Common'} • ${it.slot.toUpperCase()}</div>
                  <div style="color:#94a3b8; font-size:7.5px;">In Backpack: <b style="color:${inBagCount > 0 ? '#4ade80' : '#64748b'};">${inBagCount}</b></div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="color:#fde047; font-weight:bold; font-size:10px;">${guidePrice} 🪙</div>
                <div style="display:flex; gap:4px; margin-top:4px;">
                  <button class="util-btn" style="padding:2px 6px; font-size:7.5px; border-color:#38bdf8; color:#7dd3fc;" onclick="window.startExchangeBuyWithItem('${it.id}')">BUY</button>
                  <button class="util-btn" style="padding:2px 6px; font-size:7.5px; border-color:${inBagCount > 0 ? '#fb923c' : '#475569'}; color:${inBagCount > 0 ? '#fed7aa' : '#64748b'};" ${inBagCount > 0 ? `onclick="window.startExchangeSellWithItem('${it.id}')"` : 'disabled'}>SELL</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // TAB 3: 🔥 POPULAR PRODUCTS IN DEMAND
  function renderPopularTab() {
    return `
      <div style="background:#091024; border:1px solid #d97706; border-radius:5px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-family:var(--font-header); font-size:10.5px; font-weight:800; color:#fde047;">
            🔥 CONTINENTAL REALM DEMAND &amp; HIGH-VOLUME COMMODITIES
          </span>
          <div style="font-size:8.5px; color:#cbd5e1; margin-top:2px;">
            High-volume items actively traded across Sanctuary Hub, Solari Citadel, Umbri Undercity, Terra Orchard, and Aether Spire.
          </div>
        </div>
        <div style="color:#4ade80; font-size:9px; font-weight:bold;">
          TELEMETRY: LIVE
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; max-height:360px; overflow-y:auto; padding-right:4px;">
        ${POPULAR_EXCHANGE_PRODUCTS.map((p) => {
          const it = EQUIPMENT_CATALOG[p.id];
          if (!it) return '';
          const guidePrice = getItemGuidePrice(p.id);
          const borderCol = getRarityColor(it.rarity);
          const inBagCount = countItemInBackpack(profile, it.id);

          return `
            <div style="background:#090e1f; border:1.5px solid ${borderCol}; border-radius:4px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;"
                 onmouseenter="window.setHoveredEquipment('${it.id}', 'exchange', event)"
                 onmousemove="window.updateHoveredEquipmentPos(event)"
                 onmouseleave="window.clearHoveredEquipment()">
              <div style="display:flex; align-items:center; gap:10px;">
                <img class="pixel-art" src="${getItemIconDataUrl(it.id, 28)}" alt="${it.name}" style="width:28px; height:28px; object-fit:contain; border:1px solid ${borderCol}; background:#040711; border-radius:4px; padding:2px;" />
                <div style="line-height:1.3;">
                  <b style="color:#f8fafc; font-size:9.5px;">${it.name}</b>
                  <div style="font-size:8px; color:#f59e0b; font-weight:bold;">${p.trend}</div>
                  <div style="font-size:7.5px; color:#94a3b8;">${p.tag} • Vol: <b>${p.volume}</b></div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="color:#fde047; font-weight:bold; font-size:10.5px;">${guidePrice} 🪙</div>
                <div style="display:flex; gap:4px; margin-top:4px;">
                  <button class="util-btn" style="padding:2px 6px; font-size:8px; border-color:#38bdf8; color:#7dd3fc;" onclick="window.startExchangeBuyWithItem('${it.id}')">BUY</button>
                  <button class="util-btn" style="padding:2px 6px; font-size:8px; border-color:${inBagCount > 0 ? '#fb923c' : '#475569'}; color:${inBagCount > 0 ? '#fed7aa' : '#64748b'};" ${inBagCount > 0 ? `onclick="window.startExchangeSellWithItem('${it.id}')"` : 'disabled'}>SELL</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render container based on current tab
  container.innerHTML = `
    ${headerHtml}
    ${currentExchangeTab === 'listings' ? renderListingsTab() : currentExchangeTab === 'search' ? renderSearchTab() : renderPopularTab()}
  `;
}

// Dialog openers and setters
export function setExchangeTab(tab) {
  currentExchangeTab = tab;
}

export function setExchangeFilterQuery(q) {
  currentExchangeFilter = q;
}

export function setExchangeCategoryFilter(cat) {
  currentExchangeCategory = cat;
}

export function setExchangeOrderDialog(dlg) {
  activeOrderDialog = dlg;
}

export function getActiveOrderDialog() {
  return activeOrderDialog;
}

if (typeof window !== 'undefined') {
  window.setHoveredEquipment = setHoveredEquipment;
  window.clearHoveredEquipment = clearHoveredEquipment;
  window.updateHoveredEquipmentPos = updateFloatingGearTooltipPos;
  window.hideHoveredEquipmentTooltip = hideFloatingGearTooltip;
}
