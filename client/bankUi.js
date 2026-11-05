// ==========================================
// GlimmerFall Online 2D — Canonical AetherVault Depository (Bank System)
// Resonant leyline storage network connecting all Citadels and Sanctums
// ==========================================

import { EQUIPMENT_CATALOG, FACTIONS_META } from '../shared/protocol.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { getRarityColor, formatItemStatsHtml, getHoveredCardHtml, getItemGuidePrice } from './equipmentUi.js';

let currentBankTab = 'all';
let currentBankFilter = '';
const MAX_BANK_CAPACITY = 240;

function safeFCT(text, col, isCrit) {
  if (typeof window !== 'undefined' && typeof window.spawnFCT === 'function' && window.player) {
    window.spawnFCT(window.player.x, window.player.y - 14, text, col, isCrit);
  }
}

function safePlay(fn) {
  if (typeof window !== 'undefined' && typeof window.audio?.[fn] === 'function') {
    window.audio[fn]();
  }
}

function safeRenderInventory(profile) {
  if (typeof window !== 'undefined' && typeof window.renderInventoryModal === 'function') {
    window.renderInventoryModal({ profile });
  }
}

function safeRenderEquipment(profile) {
  if (typeof window !== 'undefined' && typeof window.renderEquipmentModal === 'function') {
    window.renderEquipmentModal({ profile });
  }
}

function safeRecalc() {
  if (typeof window === 'undefined') return;
  if (typeof window.recalcVitalsFromProfile === 'function') window.recalcVitalsFromProfile();
  if (typeof window.refreshHeroPortrait === 'function') window.refreshHeroPortrait();
  if (typeof window.updatePlayerUI === 'function') window.updatePlayerUI();
}

export function getBankItems(profile) {
  if (!profile) return [];
  if (!Array.isArray(profile.bank)) {
    profile.bank = [];
  }
  return profile.bank;
}

export function saveBank(profile, bankItems) {
  if (!profile) return;
  profile.bank = bankItems;
  if (typeof window !== 'undefined' && typeof window.saveProgressionLocal === 'function') {
    window.saveProgressionLocal();
  }
}

export function calculateBankValue(profile) {
  const bank = getBankItems(profile);
  let total = 0;
  for (const entry of bank) {
    const id = typeof entry === 'string' ? entry : entry?.id;
    const qty = typeof entry === 'object' && entry?.qty ? entry.qty : 1;
    total += getItemGuidePrice(id) * qty;
  }
  return total;
}

export function depositInventoryItemToBank(profile, invIndex, qty = 'all') {
  if (!profile || !profile.inventory) return;
  const inv = profile.inventory;
  const idx = Number(invIndex);
  if (idx < 0 || idx >= inv.length) return;

  const itemObj = inv[idx];
  const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
  const itemDef = EQUIPMENT_CATALOG[itemId];
  if (!itemDef) return;

  const inBagQty = typeof itemObj === 'object' && itemObj.qty ? itemObj.qty : 1;
  const depositQty = qty === 'all' ? inBagQty : Math.min(inBagQty, Number(qty) || 1);

  const bank = getBankItems(profile);

  // If stackable item, search existing bank slot
  let existing = itemDef.stackable ? bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId) : null;
  if (existing) {
    if (typeof existing === 'string') {
      const bIdx = bank.indexOf(existing);
      bank[bIdx] = { id: itemId, qty: 1 + depositQty };
    } else {
      existing.qty = (existing.qty || 1) + depositQty;
    }
  } else {
    if (bank.length >= MAX_BANK_CAPACITY) {
      if (typeof window.spawnFCT === 'function' && window.player) {
        window.spawnFCT(window.player.x, window.player.y - 14, '🏛️ AETHERVAULT IS FULL (240/240)!', '#ef4444');
      }
      return;
    }
    bank.push({ id: itemId, qty: depositQty });
  }

  // Deduct from backpack
  if (depositQty >= inBagQty) {
    inv.splice(idx, 1);
  } else if (typeof itemObj === 'object') {
    itemObj.qty -= depositQty;
  }

  profile.inventory = inv;
  saveBank(profile, bank);

  safePlay('playShield');
  safeFCT(`DEPOSITED ${itemDef.name.toUpperCase()} (x${depositQty})`, '#38bdf8');

  renderBankModal({ profile });
  safeRenderInventory(profile);
}

export function depositAllInventoryToBank(profile) {
  if (!profile || !profile.inventory || profile.inventory.length === 0) return;
  const inv = [...profile.inventory];
  let depositedCount = 0;

  for (let i = inv.length - 1; i >= 0; i--) {
    const itemObj = inv[i];
    const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
    const itemDef = EQUIPMENT_CATALOG[itemId];
    if (!itemDef) continue;

    const inBagQty = typeof itemObj === 'object' && itemObj.qty ? itemObj.qty : 1;
    const bank = getBankItems(profile);

    let existing = itemDef.stackable ? bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId) : null;
    if (existing) {
      if (typeof existing === 'string') {
        const bIdx = bank.indexOf(existing);
        bank[bIdx] = { id: itemId, qty: 1 + inBagQty };
      } else {
        existing.qty = (existing.qty || 1) + inBagQty;
      }
      inv.splice(i, 1);
      depositedCount++;
    } else if (bank.length < MAX_BANK_CAPACITY) {
      bank.push({ id: itemId, qty: inBagQty });
      inv.splice(i, 1);
      depositedCount++;
    }
  }

  profile.inventory = inv;
  saveBank(profile, getBankItems(profile));

  safePlay('playShield');
  safeFCT(`DEPOSITED ${depositedCount} ITEMS TO VAULT`, '#38bdf8');

  renderBankModal({ profile });
  safeRenderInventory(profile);
}

export function depositWornGearToBank(profile) {
  if (!profile || !profile.equipment) return;
  const eq = { ...profile.equipment };
  const bank = getBankItems(profile);
  let unequippedCount = 0;

  for (const [slotKey, itemId] of Object.entries(eq)) {
    if (!itemId || !EQUIPMENT_CATALOG[itemId]) continue;
    if (bank.length >= MAX_BANK_CAPACITY) break;

    const itemDef = EQUIPMENT_CATALOG[itemId];
    let existing = itemDef.stackable ? bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId) : null;
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      bank.push({ id: itemId, qty: 1 });
    }

    delete eq[slotKey];
    unequippedCount++;
  }

  profile.equipment = eq;
  saveBank(profile, bank);

  safePlay('playHurt');
  safeRecalc();
  safeFCT(`STORED ${unequippedCount} WORN ITEMS IN VAULT`, '#fde047');

  renderBankModal({ profile });
  safeRenderEquipment(profile);
}

export function withdrawBankItemToInventory(profile, bankIndex, qty = 1) {
  if (!profile) return;
  const bank = getBankItems(profile);
  const idx = Number(bankIndex);
  if (idx < 0 || idx >= bank.length) return;

  const bankObj = bank[idx];
  const itemId = typeof bankObj === 'string' ? bankObj : bankObj?.id;
  const itemDef = EQUIPMENT_CATALOG[itemId];
  if (!itemDef) return;

  const inv = Array.isArray(profile.inventory) ? profile.inventory : [];
  const inBankQty = typeof bankObj === 'object' && bankObj.qty ? bankObj.qty : 1;
  const withdrawQty = qty === 'all' ? inBankQty : Math.min(inBankQty, Number(qty) || 1);

  // Check if backpack can accept it
  let existingInBag = itemDef.stackable ? inv.find((it) => (typeof it === 'string' ? it : it.id) === itemId) : null;
  if (!existingInBag && inv.length >= 28) {
    safeFCT('🎒 BACKPACK IS FULL (28/28)!', '#ef4444');
    return;
  }

  // Add to backpack
  if (existingInBag) {
    if (typeof existingInBag === 'string') {
      const iIdx = inv.indexOf(existingInBag);
      inv[iIdx] = { id: itemId, qty: 1 + withdrawQty };
    } else {
      existingInBag.qty = (existingInBag.qty || 1) + withdrawQty;
    }
  } else {
    inv.push({ id: itemId, qty: withdrawQty });
  }

  // Deduct from bank
  if (withdrawQty >= inBankQty) {
    bank.splice(idx, 1);
  } else if (typeof bankObj === 'object') {
    bankObj.qty -= withdrawQty;
  }

  profile.inventory = inv;
  saveBank(profile, bank);

  safePlay('playPickup');
  safeFCT(`WITHDREW ${itemDef.name.toUpperCase()} (x${withdrawQty})`, '#4ade80');

  renderBankModal({ profile });
  safeRenderInventory(profile);
}

export function setBankCategoryTab(tab) {
  currentBankTab = tab;
}

export function setBankSearchFilter(q) {
  currentBankFilter = q;
}

export function renderBankModal({ profile }) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('bank-modal-body');
  if (!container) return;

  const bank = getBankItems(profile);
  const inv = Array.isArray(profile?.inventory) ? profile.inventory : [];
  const totalValue = calculateBankValue(profile);

  // Filter bank items
  const filtered = bank.map((entry, idx) => ({ entry, originalIndex: idx })).filter(({ entry }) => {
    const id = typeof entry === 'string' ? entry : entry?.id;
    const it = EQUIPMENT_CATALOG[id];
    if (!it) return false;

    if (currentBankTab !== 'all') {
      if (currentBankTab === 'gear' && !['weapon', 'body', 'legs', 'head', 'shield', 'offhand', 'cape', 'neck', 'ring', 'hands', 'feet'].includes(it.slot)) return false;
      if (currentBankTab === 'currency' && it.slot !== 'currency') return false;
      if (currentBankTab === 'consumable' && it.slot !== 'consumable') return false;
    }

    if (currentBankFilter) {
      const q = currentBankFilter.toLowerCase();
      return it.name.toLowerCase().includes(q) || (it.slot && it.slot.toLowerCase().includes(q)) || (it.desc && it.desc.toLowerCase().includes(q));
    }
    return true;
  });

  container.innerHTML = `
    <!-- Top Telemetry & Controls Row -->
    <div style="background:#080d1e; border:1px solid #1e293b; border-radius:5px; padding:10px 12px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="font-family:var(--font-header); font-size:11px; font-weight:800; color:#fde047;">
            🏛️ SANCTUARY AETHERVAULT ARCHIVE
          </span>
          <div style="font-size:8.5px; color:#cbd5e1; margin-top:2px;">
            Synchronized Leyline Storage • Accessible at any Citadel Depository across the Continental Realm.
          </div>
        </div>
        <div style="display:flex; gap:14px; align-items:center;">
          <div style="font-size:9.5px; color:#94a3b8;">
            Capacity: <b style="color:${bank.length >= MAX_BANK_CAPACITY ? '#ef4444' : '#4ade80'};">${bank.length} / ${MAX_BANK_CAPACITY}</b>
          </div>
          <div style="font-size:9.5px; color:#fde047; font-weight:bold;">
            Net Worth: <b>${totalValue.toLocaleString()} 🪙</b>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons & Search Input -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:10px; flex-wrap:wrap;">
        <div style="display:flex; gap:6px;">
          <button class="util-btn" style="border-color:#38bdf8; color:#7dd3fc; font-size:8.5px; padding:4px 8px; font-weight:bold;" onclick="window.depositAllInventoryToBank()">
            🎒 DEPOSIT ALL INVENTORY
          </button>
          <button class="util-btn" style="border-color:#fb923c; color:#fed7aa; font-size:8.5px; padding:4px 8px; font-weight:bold;" onclick="window.depositWornGearToBank()">
            🛡️ DEPOSIT WORN GEAR
          </button>
        </div>

        <div style="display:flex; gap:6px; align-items:center; flex:1; max-width:320px;">
          <input type="text"
                 placeholder="Search vault items, sets, potions..."
                 value="${currentBankFilter}"
                 oninput="window.setBankFilterQuery(this.value)"
                 style="flex:1; background:#060a16; border:1px solid #334155; color:#f8fafc; padding:4px 8px; font-size:9.5px; border-radius:3px;" />
          <button class="id-mini-btn" style="padding:4px 8px; font-size:8.5px;" onclick="window.setBankFilterQuery('')">CLEAR</button>
        </div>
      </div>

      <!-- Bank Tabs Navigation -->
      <div style="display:flex; gap:6px; margin-top:10px; border-top:1px solid #1e293b; padding-top:8px;">
        ${[
          { key: 'all', label: '🌐 ALL ITEMS' },
          { key: 'gear', label: '⚔️ WEAPONS & ARMOR' },
          { key: 'currency', label: '🪙 CURRENCIES & GEMS' },
          { key: 'consumable', label: '🧪 CONSUMABLES & SUPPLIES' },
        ].map((t) => `
          <button type="button" class="id-mini-btn"
                  style="font-size:8.5px; padding:3px 10px; border-color:${currentBankTab === t.key ? '#fde047' : '#334155'}; color:${currentBankTab === t.key ? '#fde047' : '#94a3b8'}; background:${currentBankTab === t.key ? '#1c1917' : 'transparent'}; font-weight:bold;"
                  onclick="window.setBankTab('${t.key}')">
            ${t.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Main Vault Layout: 2 Columns (Vault Item Grid & Right-Hand Backpack Deposit) -->
    <div style="display:grid; grid-template-columns: 1fr 230px; gap:12px; align-items:start;">
      <!-- Left: Scrollable Vault Grid -->
      <div style="background:#060914; border:1px solid #1e293b; border-radius:5px; padding:10px; min-height:340px; max-height:420px; overflow-y:auto;">
        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:50px 20px; color:#64748b; font-size:10px;">
            <div style="font-size:28px; margin-bottom:8px;">🏛️</div>
            <b>Your AetherVault is empty in this category.</b>
            <div style="margin-top:4px;">Click any item in your backpack on the right or use 'DEPOSIT ALL INVENTORY' above!</div>
          </div>
        ` : `
          <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:8px;">
            ${filtered.map(({ entry, originalIndex }) => {
              const id = typeof entry === 'string' ? entry : entry?.id;
              const qty = typeof entry === 'object' && entry?.qty ? entry.qty : 1;
              const it = EQUIPMENT_CATALOG[id];
              const borderCol = getRarityColor(it.rarity);

              return `
                <div class="rs-inv-slot"
                     style="border:1.5px solid ${borderCol}; background:#080d1e; width:auto; height:58px; position:relative; padding:4px; display:flex; flex-direction:column; justify-content:space-between; align-items:center; cursor:pointer;"
                     onclick="window.withdrawBankItem(${originalIndex}, 1)"
                     oncontextmenu="event.preventDefault(); window.withdrawBankItem(${originalIndex}, 'all');"
                     onmouseenter="window.setHoveredEquipment('${it.id}', 'bank', event)"
                     onmousemove="window.updateHoveredEquipmentPos(event)"
                     onmouseleave="window.clearHoveredEquipment()">
                  <img class="pixel-art" src="${getItemIconDataUrl(it.id, 24)}" width="24" height="24" style="image-rendering:pixelated; margin-top:2px;" alt="${it.name}" />
                  <div style="font-size:7px; color:${borderCol}; font-weight:700; max-width:54px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;">
                    ${it.name.replace(/^(Sunforged|Ironwood|Chrono|Duskveil|Aurelius)\s*/i, '')}
                  </div>
                  ${qty > 1 ? `<div style="position:absolute; bottom:2px; right:4px; font-size:8px; font-weight:bold; color:#fde047;">${qty}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Right: Quick Backpack Deposit Column -->
      <div style="background:#090d1f; border:1px solid #334155; border-radius:5px; padding:10px;">
        <div style="font-family:var(--font-header); font-size:9.5px; color:#38bdf8; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:4px; display:flex; justify-content:space-between;">
          <span>🎒 BACKPACK (CLICK TO DEPOSIT)</span>
          <span style="color:#94a3b8;">${inv.length}/28</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:5px; max-height:280px; overflow-y:auto; padding-right:2px;">
          ${Array.from({ length: 28 }).map((_, i) => {
            const itemObj = inv[i];
            const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
            const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;

            if (item) {
              const borderCol = getRarityColor(item.rarity);
              return `
                <div class="rs-inv-slot"
                     style="border:1px solid ${borderCol}; width:auto; height:46px; cursor:pointer;"
                     onclick="window.depositInventoryItemToBank(${i}, 'all')"
                     onmouseenter="window.setHoveredEquipment('${item.id}', 'inventory', event)"
                     onmousemove="window.updateHoveredEquipmentPos(event)"
                     onmouseleave="window.clearHoveredEquipment()"
                     title="Click to Deposit ${item.name} into Vault">
                  <img class="pixel-art" src="${getItemIconDataUrl(item.id, 20)}" width="20" height="20" style="image-rendering:pixelated; margin-top:2px;" alt="${item.name}" />
                  ${itemObj?.qty > 1 ? `<div style="position:absolute; bottom:1px; right:3px; font-size:7.5px; font-weight:bold; color:#fde047;">${itemObj.qty}</div>` : ''}
                </div>
              `;
            }

            return `
              <div class="rs-inv-slot empty" style="width:auto; height:46px;">
                <span style="color:#334155; font-size:8px;">${i + 1}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:8px; font-size:7.5px; color:#94a3b8; line-height:1.3; text-align:center;">
          👉 Left-click vaulted item to Withdraw 1 • Right-click to Withdraw All. Click bag slot to Deposit.
        </div>
      </div>
    </div>
  `;
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.renderBankModal = renderBankModal;
  window.setBankTab = function (tab) {
    setBankCategoryTab(tab);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankFilterQuery = function (q) {
    setBankSearchFilter(q);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.depositInventoryItemToBank = function (invIndex, qty = 'all') {
    if (window.localProfile) depositInventoryItemToBank(window.localProfile, invIndex, qty);
  };
  window.depositAllInventoryToBank = function () {
    if (window.localProfile) depositAllInventoryToBank(window.localProfile);
  };
  window.depositWornGearToBank = function () {
    if (window.localProfile) depositWornGearToBank(window.localProfile);
  };
  window.withdrawBankItem = function (bankIndex, qty = 1) {
    if (window.localProfile) withdrawBankItemToInventory(window.localProfile, bankIndex, qty);
  };
}
