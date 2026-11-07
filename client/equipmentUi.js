// ==========================================
// GlimmerFall Online 2D — Paperdoll Equipment Modal, Leyline Runewords & Gear Tooltips
// ==========================================

import {
  EQUIPMENT_CATALOG,
  BARROWS_SETS,
  RUNEWORD_SYNERGIES,
  getActiveSetBonuses,
  getActiveRuneword,
  getEquipmentStatBonuses,
  CLASSES_CATALOG,
} from '../shared/protocol.js';
import { getCharacterSprites } from './sprites.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { formatItemStatsHtml, getRarityColor } from './ui/inventoryHelpers.js';

export * from './ui/inventoryHelpers.js';
export * from './ui/exchangeUi.js';

let currentHoveredItemId = null;
let currentHoveredSource = 'equipped';

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
    ? (item.slot === 'socket_gem' ? '👉 Left-click to Socket into Weapon/Chest/Helm • Right-click to Drop' : '👉 Left-click to Equip/Use • Right-click to Drop')
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

        <!-- Leyline Relic Gem Sockets (Helm • Chest • Weapon) -->
        <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:8px 10px; margin-top:10px;">
          <div style="font-family:var(--font-header); font-size:9px; color:#38bdf8; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>💎 LEYLINE RELIC SOCKETS</span>
            <span style="font-size:7.5px; color:#94a3b8;">CLICK GEM IN BAG TO SOCKET</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
            ${[
              { key: 'socket_head', label: 'HELM SOCKET', icon: '🪖' },
              { key: 'socket_body', label: 'CHEST SOCKET', icon: '🛡️' },
              { key: 'socket_weapon', label: 'WEAPON SOCKET', icon: '⚔️' },
            ].map((sock) => {
              const gemId = equip[sock.key];
              const gem = gemId ? EQUIPMENT_CATALOG[gemId] : null;
              const col = gem ? getRarityColor(gem.rarity) : '#44403c';
              return `
                <div style="background:#0c0a09; border:1.5px ${gem ? 'solid' : 'dashed'} ${col}; border-radius:4px; padding:5px 4px; text-align:center; cursor:pointer;"
                     onclick="${gem ? `window.unequipSlot('${sock.key}')` : `window.socketFirstAvailableGem ? window.socketFirstAvailableGem('${sock.key}') : toggleModal('inventory-modal')`}"
                     onmouseenter="window.setHoveredEquipment('${gem ? gem.id : ''}', 'equipped', event)"
                     onmousemove="window.updateHoveredEquipmentPos(event)"
                     onmouseleave="window.clearHoveredEquipment()">
                  ${gem ? `
                    <img class="pixel-art" src="${getItemIconDataUrl(gem.id, 24)}" width="22" height="22" style="image-rendering:pixelated; display:block; margin:0 auto;" alt="${gem.name}" />
                    <div style="font-size:7px; color:${col}; font-weight:800; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${gem.name.replace(/^Cut\s*/i, '')}</div>
                  ` : `
                    <div style="font-size:13px; opacity:0.55;">${sock.icon}</div>
                    <div style="font-size:6.5px; color:#78716c; font-weight:700; margin-top:2px;">${sock.label}</div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
          ${activeRuneword ? `
            <div style="margin-top:7px; background:linear-gradient(90deg, rgba(15,23,42,0.95), rgba(49,46,129,0.55)); border:1.5px solid ${activeRuneword.color}; border-radius:4px; padding:6px 8px; box-shadow:0 0 10px rgba(250,204,21,0.2);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <b style="color:${activeRuneword.color}; font-size:9px;">✨ RUNEWORD: ${activeRuneword.name.toUpperCase()}</b>
                <span style="background:#14532d; color:#4ade80; border:1px solid #22c55e; font-size:7px; font-weight:800; padding:1px 4px; border-radius:2px;">${activeRuneword.word}</span>
              </div>
              <div style="color:#fde047; font-size:8px; font-weight:700; margin-top:2px;">${activeRuneword.perkTitle}</div>
              <div style="color:#cbd5e1; font-size:7.5px; line-height:1.35; margin-top:1px;">${activeRuneword.perkDesc}</div>
            </div>
          ` : `
            <div style="margin-top:5px; font-size:7.5px; color:#94a3b8; text-align:center;">
              Socket 3 Ancient Runes in exact <b style="color:#fde047;">[1] → [2] → [3]</b> sequence to awaken a Runeword!
            </div>
          `}
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

        <!-- Canonical 3-Socket Runeword Codex -->
        <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:8px 10px;">
          <div style="font-family:var(--font-header); font-size:9.5px; color:#c084fc; margin-bottom:6px; border-bottom:1px solid #292524; padding-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
            <span>📜 ANCIENT RUNEWORD CODEX</span>
            <span style="font-size:7.5px; color:${activeRuneword ? '#4ade80' : '#94a3b8'};">${activeRuneword ? `ACTIVE: ${activeRuneword.word}` : '3-SOCKET ORDER'}</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; max-height:145px; overflow-y:auto;">
            ${Object.values(RUNEWORD_SYNERGIES).map((rw) => {
              const isMatched = activeRuneword?.id === rw.id;
              return `
                <div style="background:${isMatched ? '#1e1b4b' : '#181512'}; border:1px solid ${isMatched ? rw.color : '#292524'}; border-radius:3px; padding:4px 6px; font-size:7.5px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                    <b style="color:${rw.color}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${isMatched ? '✨ ' : ''}${rw.name}</b>
                    <span style="color:#fde047; font-weight:800; font-size:7px; white-space:nowrap;">${rw.word}</span>
                  </div>
                  <div style="color:#cbd5e1; font-size:7px; margin-top:2px; line-height:1.3;">${rw.perkDesc}</div>
                </div>
              `;
            }).join('')}
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
