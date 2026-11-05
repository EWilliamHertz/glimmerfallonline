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
                   title="${item ? `${item.name} (${item.rarity})\n${item.desc}\n\n👉 Click to Unequip to Backpack` : `Empty ${s.label} Slot`}">
                ${item ? `
                  <div style="font-size:20px; line-height:1;">${item.icon}</div>
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
      <div style="display:flex; flex-direction:column; gap:12px;">
        <!-- Combat Stat Bonuses Breakdown -->
        <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:10px 12px;">
          <div style="font-family:var(--font-header); font-size:10px; color:#fde047; margin-bottom:8px; border-bottom:1px solid #292524; padding-bottom:4px;">
            📊 COMBAT STAT BONUSES
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
        Left-Click to Equip / Swap • Right-Click to Drop
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
                 style="border-color:${borderCol};"
                 onclick="window.equipInventorySlot(${i})"
                 oncontextmenu="event.preventDefault(); window.dropInventorySlot(${i});"
                 title="${item.name} (${item.rarity})\nSlot: ${item.slot.toUpperCase()}\n${item.desc}\n\n👉 Left-click: Equip / Swap\n👉 Right-click: Drop on ground">
              <div style="font-size:22px; line-height:1;">${item.icon}</div>
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

    <div style="display:flex; justify-content:space-between; gap:10px; margin-top:12px;">
      <button class="util-btn" style="flex:1; border-color:#fb923c; color:#fed7aa;" onclick="toggleModal('equipment-modal')">
        ⚔️ WORN GEAR [K]
      </button>
      <button class="util-btn" style="flex:1; border-color:#38bdf8; color:#7dd3fc;" onclick="toggleModal('exchange-modal')">
        🌀 AETHERSWAP [X]
      </button>
    </div>
  `;
}

// ==========================================
// 3. AETHERSWAP CONTINENTAL EXCHANGE [X]
// ==========================================
let currentExchangeFilter = '';

export function renderExchangeModal({ profile }) {
  const container = document.getElementById('exchange-modal-body');
  if (!container) return;

  const allItems = Object.values(EQUIPMENT_CATALOG);
  const filtered = currentExchangeFilter
    ? allItems.filter((it) => it.name.toLowerCase().includes(currentExchangeFilter.toLowerCase()) || it.slot.toLowerCase().includes(currentExchangeFilter.toLowerCase()))
    : allItems.slice(0, 20);

  // Simulated player active AetherSwap offers (8 slots)
  const offers = [
    { slot: 1, type: 'BUY', item: EQUIPMENT_CATALOG.sunforged_greathelm, qty: 1, totalQty: 1, price: 350, completed: true },
    { slot: 2, type: 'SELL', item: EQUIPMENT_CATALOG.boots_of_haste, qty: 1, totalQty: 1, price: 120, completed: false },
    { slot: 3, type: null },
    { slot: 4, type: null },
    { slot: 5, type: null },
    { slot: 6, type: null },
    { slot: 7, type: null },
    { slot: 8, type: null },
  ];

  container.innerHTML = `
    <!-- AetherSwap Enclave Dialogue & Market Banner -->
    <div style="display:flex; justify-content:space-between; align-items:center; background:#0b1329; border:2px solid #0284c7; border-radius:4px; padding:10px 14px; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="font-size:28px;">🌀</div>
        <div style="font-size:10px; line-height:1.45;">
          <b style="color:#7dd3fc; font-family:var(--font-header);">AetherSwap Continental Exchange (All Factions Alliance)</b>
          <div style="color:#cbd5e1; font-size:8.5px;">An invention of the Aether Astral Enclave to broker seamless trading and alliance commerce across all factions in the Shattered Nexus. Trade faction armor, weapons, currencies, and rare relics with champions from all realms. (2% Glimmer sales tax applied)</div>
        </div>
      </div>
      <div style="text-align:right;">
        <span style="font-size:8.5px; color:#94a3b8;">Continental Economy:</span>
        <div style="color:#4ade80; font-weight:700; font-size:10px;">🟢 ACTIVE (ALL FACTIONS)</div>
      </div>
    </div>

    <!-- 8 Exchange Offer Slots Grid (2x4) -->
    <div style="margin-bottom:14px;">
      <div style="font-family:var(--font-header); font-size:9.5px; color:#d97706; margin-bottom:6px;">
        ✦ YOUR ACTIVE TRADING OFFERS (8 SLOTS)
      </div>
      <div class="rs-ge-grid">
        ${offers.map((o) => {
          if (!o.item) {
            return `
              <div class="rs-ge-box" style="align-items:center; justify-content:center; cursor:pointer;" onclick="document.getElementById('rs-ge-search-input')?.focus();">
                <span style="font-size:24px; opacity:0.3;">📦</span>
                <span style="color:#78716c; font-size:8.5px; font-weight:700; margin-top:4px;">+ EMPTY SLOT</span>
              </div>
            `;
          }

          const isBuy = o.type === 'BUY';
          return `
            <div class="rs-ge-box" style="border-color:${o.completed ? '#22c55e' : '#57534e'};">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:7.5px; font-weight:700; background:${isBuy ? '#172554' : '#7c2d12'}; color:${isBuy ? '#7dd3fc' : '#fed7aa'}; padding:1px 4px; border-radius:2px;">
                  ${o.type}
                </span>
                <span style="font-size:7.5px; color:${o.completed ? '#4ade80' : '#fde047'}; font-weight:700;">
                  ${o.completed ? 'COMPLETED' : 'SEARCHING...'}
                </span>
              </div>
              <div style="display:flex; align-items:center; gap:6px; margin:6px 0;">
                <span style="font-size:20px;">${o.item.icon}</span>
                <div style="font-size:8px; line-height:1.2; overflow:hidden;">
                  <b style="color:#f8fafc; display:block; text-overflow:ellipsis; white-space:nowrap;">${o.item.name}</b>
                  <span style="color:#fde047;">${o.price} Glimmer</span>
                </div>
              </div>
              <div style="background:#090f20; border-radius:2px; height:6px; overflow:hidden;">
                <div style="background:${o.completed ? '#22c55e' : '#38bdf8'}; width:${o.completed ? '100%' : '50%'}; height:100%;"></div>
              </div>
              <button class="util-btn" style="margin-top:6px; padding:2px 4px; font-size:7.5px; border-color:${o.completed ? '#22c55e' : '#64748b'}; color:${o.completed ? '#4ade80' : '#cbd5e1'};"
                      onclick="window.collectExchangeOffer(${o.slot})">
                ${o.completed ? 'COLLECT ITEM' : 'ABORT OFFER'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Live Market Guide Price Catalog & Search -->
    <div style="background:#141210; border:2px solid #57534e; border-radius:4px; padding:10px 12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-family:var(--font-header); font-size:10px; color:#fde047;">
          🔍 MARKET GUIDE PRICES &amp; SEARCH
        </span>
        <input id="rs-ge-search-input"
               type="text"
               placeholder="Search weapon, set, currency, armor, potion..."
               value="${currentExchangeFilter}"
               oninput="window.setExchangeFilter(this.value)"
               style="background:#090f20; border:1px solid #57534e; color:#f8fafc; padding:3px 8px; font-size:9px; border-radius:3px; width:220px;" />
      </div>

      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; max-height:220px; overflow-y:auto; padding-right:4px;">
        ${filtered.map((it) => {
          const borderCol = getRarityColor(it.rarity);
          const guidePrice = it.rarity.includes('Set') ? 480 : it.rarity.includes('Apex') ? 1200 : it.rarity.includes('Relic') ? 320 : it.slot === 'currency' ? 10 : 95;

          return `
            <div style="background:#1c1917; border:1px solid ${borderCol}; border-radius:3px; padding:6px 8px; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:20px;">${it.icon}</span>
                <div style="font-size:8.5px; line-height:1.3;">
                  <b style="color:#f8fafc;">${it.name}</b>
                  <div style="color:${borderCol}; font-size:7.5px;">${it.rarity} • ${it.slot.toUpperCase()}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="color:#fde047; font-weight:700; font-size:9px;">${guidePrice} ✦</div>
                <div style="display:flex; gap:4px; margin-top:2px;">
                  <button class="util-btn" style="padding:1px 4px; font-size:7px; border-color:#38bdf8; color:#7dd3fc;" onclick="window.placeExchangeBuy('${it.id}', ${guidePrice})">BUY</button>
                  <button class="util-btn" style="padding:1px 4px; font-size:7px; border-color:#fb923c; color:#fed7aa;" onclick="window.placeExchangeSell('${it.id}', ${guidePrice})">SELL</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
