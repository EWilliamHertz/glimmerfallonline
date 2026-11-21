// ==========================================
// GlimmerFall Online 2D — Canonical AetherVault Depository (Bank System)
// Resonant leyline storage network connecting all Citadels and Sanctums
// Inspired by RuneScape Tabs/Qty, WoW Inspector/Ledger, Terraria Quick-Stack & MC Clarity
// ==========================================

import {
  EQUIPMENT_CATALOG,
  PROFESSIONS_CATALOG,
  getBankCapacityCap,
  isFounderEdition,
  FOUNDER_MAX_BANK_SLOTS,
} from '../shared/protocol.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { getRarityColor, formatItemStatsHtml, getItemGuidePrice } from './equipmentUi.js';
import {
  BANK_CATEGORY_DEFS,
  BANK_SKILL_FILTERS,
  BANK_GEAR_SUBFILTERS,
  BANK_RARITY_FILTERS,
  BANK_SORT_OPTIONS,
  classifyBankItem,
  compareGearWithEquipped,
  formatCompactQty,
} from './ui/bankMetadata.js';

let currentBankTab = 'all';
let currentBankSkill = 'all';
let currentBankGearSub = 'all';
let currentBankRarity = 'all';
let currentBankSort = 'smart';
let currentBankViewMode = 'grid'; // 'grid' | 'ledger'
let currentBankQtyMode = '1'; // 'inspect' | '1' | '5' | '10' | 'all'
let currentBankFilter = '';
let inspectedEntry = null; // { source: 'bank' | 'inventory', itemId, index, qty }

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getEffectiveBankCapacity(profile) {
  const editionSource = (typeof window !== 'undefined' && window.isLocalFounderEdition?.()) ? 'founder' : profile;
  return getBankCapacityCap(editionSource);
}

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
  if (typeof window !== 'undefined') {
    try {
      const charId = profile.activeCharacterId || profile.id || 'default';
      const cacheKey = `glimmerfall_bank_cache_${charId}`;
      localStorage.setItem(cacheKey, JSON.stringify(bankItems));
    } catch (_) {}
    if (typeof window.saveProgressionLocal === 'function') {
      window.saveProgressionLocal();
    }
  }
}

function sendAuthoritativeBankOp(op, payload = {}) {
  if (typeof window !== 'undefined' && window.net?.connected) {
    window.net.send({ type: 'bank_op', op, ...payload });
    return true;
  }
  return false;
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
  const depositQty = qty === 'all' ? inBagQty : Math.min(inBagQty, Math.max(1, Number(qty) || 1));

  if (sendAuthoritativeBankOp('deposit', { slotIndex: idx, qty })) {
    safePlay('playShield');
    safeFCT(`DEPOSITED ${itemDef.name.toUpperCase()} (x${depositQty})`, '#38bdf8');
    return;
  }

  const bank = getBankItems(profile);

  let existing = bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId);
  if (existing) {
    if (typeof existing === 'string') {
      const bIdx = bank.indexOf(existing);
      bank[bIdx] = { id: itemId, qty: 1 + depositQty };
    } else {
      existing.qty = (existing.qty || 1) + depositQty;
    }
  } else {
    const bankCap = getEffectiveBankCapacity(profile);
    if (bank.length >= bankCap) {
      const upgradeHint = !isFounderEdition(typeof window !== 'undefined' && window.isLocalFounderEdition?.() ? 'founder' : profile)
        ? ` (TRIAL ${bankCap}/${bankCap} — FOUNDER UNLOCKS ${FOUNDER_MAX_BANK_SLOTS})`
        : '';
      if (typeof window.spawnFCT === 'function' && window.player) {
        window.spawnFCT(window.player.x, window.player.y - 14, `🏛️ AETHERVAULT IS FULL (${bankCap}/${bankCap})${upgradeHint}!`, '#ef4444');
      }
      return;
    }
    bank.push({ id: itemId, qty: depositQty });
  }

  if (depositQty >= inBagQty) {
    inv.splice(idx, 1);
  } else if (typeof itemObj === 'object') {
    itemObj.qty -= depositQty;
  }

  profile.inventory = inv;
  saveBank(profile, bank);

  safePlay('playShield');
  safeFCT(`DEPOSITED ${itemDef.name.toUpperCase()} (x${depositQty})`, '#38bdf8');

  if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
    window.clearHoveredEquipment();
  }
  renderBankModal({ profile });
  safeRenderInventory(profile);
}

/**
 * Terraria-style Quick Stack: deposits ONLY backpack stacks whose item ID already exists in the Vault.
 */
export function quickStackBackpackToBank(profile) {
  if (!profile || !Array.isArray(profile.inventory) || profile.inventory.length === 0) return 0;
  if (sendAuthoritativeBankOp('quick_stack')) {
    safePlay('playShield');
    return 1;
  }
  const bank = getBankItems(profile);
  const bankById = new Map();
  for (let i = 0; i < bank.length; i++) {
    const entry = bank[i];
    const id = typeof entry === 'string' ? entry : entry?.id;
    if (id) bankById.set(id, i);
  }
  if (bankById.size === 0) {
    safeFCT('NO MATCHING STACKS IN VAULT TO QUICK-STACK', '#94a3b8');
    return 0;
  }

  const inv = [...profile.inventory];
  let stackedTypes = 0;
  let stackedQty = 0;

  for (let i = inv.length - 1; i >= 0; i--) {
    const itemObj = inv[i];
    const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
    const itemDef = itemId ? EQUIPMENT_CATALOG[itemId] : null;
    if (!itemDef || !bankById.has(itemId)) continue;

    const bIdx = bankById.get(itemId);
    const inBagQty = typeof itemObj === 'object' && itemObj.qty ? itemObj.qty : 1;
    if (typeof bank[bIdx] === 'string') {
      bank[bIdx] = { id: itemId, qty: 1 + inBagQty };
    } else {
      bank[bIdx].qty = (bank[bIdx].qty || 1) + inBagQty;
    }
    inv.splice(i, 1);
    stackedTypes++;
    stackedQty += inBagQty;
  }

  if (stackedTypes > 0) {
    profile.inventory = inv;
    saveBank(profile, bank);
    safePlay('playShield');
    safeFCT(`🧲 QUICK-STACKED ${stackedQty} ITEMS (${stackedTypes} TYPES)`, '#4ade80');
    if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
      window.clearHoveredEquipment();
    }
    renderBankModal({ profile });
    safeRenderInventory(profile);
  } else {
    safeFCT('NO MATCHING STACKS IN BACKPACK', '#94a3b8');
  }
  return stackedTypes;
}

export function depositAllInventoryToBank(profile) {
  if (!profile || !profile.inventory || profile.inventory.length === 0) return;
  if (sendAuthoritativeBankOp('deposit_all')) {
    safePlay('playShield');
    return;
  }
  const inv = [...profile.inventory];
  let depositedCount = 0;

  for (let i = inv.length - 1; i >= 0; i--) {
    const itemObj = inv[i];
    const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
    const itemDef = EQUIPMENT_CATALOG[itemId];
    if (!itemDef) continue;

    const inBagQty = typeof itemObj === 'object' && itemObj.qty ? itemObj.qty : 1;
    const bank = getBankItems(profile);

    let existing = bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId);
    if (existing) {
      if (typeof existing === 'string') {
        const bIdx = bank.indexOf(existing);
        bank[bIdx] = { id: itemId, qty: 1 + inBagQty };
      } else {
        existing.qty = (existing.qty || 1) + inBagQty;
      }
      inv.splice(i, 1);
      depositedCount++;
    } else if (bank.length < getEffectiveBankCapacity(profile)) {
      bank.push({ id: itemId, qty: inBagQty });
      inv.splice(i, 1);
      depositedCount++;
    }
  }

  profile.inventory = inv;
  saveBank(profile, getBankItems(profile));

  safePlay('playShield');
  safeFCT(`DEPOSITED ${depositedCount} ITEMS TO VAULT`, '#38bdf8');

  if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
    window.clearHoveredEquipment();
  }
  renderBankModal({ profile });
  safeRenderInventory(profile);
}

export function depositAllMaterialsToBank(profile) {
  if (!profile || !profile.inventory || profile.inventory.length === 0) return;
  if (sendAuthoritativeBankOp('deposit_materials')) {
    safePlay('playShield');
    return;
  }
  const inv = [...profile.inventory];
  let depositedCount = 0;

  for (let i = inv.length - 1; i >= 0; i--) {
    const itemObj = inv[i];
    const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
    const itemDef = EQUIPMENT_CATALOG[itemId];
    if (!itemDef || itemDef.slot !== 'material') continue;

    const inBagQty = typeof itemObj === 'object' && itemObj.qty ? itemObj.qty : 1;
    const bank = getBankItems(profile);

    let existing = bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId);
    if (existing) {
      if (typeof existing === 'string') {
        const bIdx = bank.indexOf(existing);
        bank[bIdx] = { id: itemId, qty: 1 + inBagQty };
      } else {
        existing.qty = (existing.qty || 1) + inBagQty;
      }
      inv.splice(i, 1);
      depositedCount++;
    } else if (bank.length < getEffectiveBankCapacity(profile)) {
      bank.push({ id: itemId, qty: inBagQty });
      inv.splice(i, 1);
      depositedCount++;
    }
  }

  profile.inventory = inv;
  saveBank(profile, getBankItems(profile));

  if (depositedCount > 0) {
    safePlay('playShield');
    safeFCT(`DEPOSITED ${depositedCount} MATERIAL TYPES TO VAULT`, '#4ade80');
  } else {
    safeFCT('NO RAW MATERIALS IN BACKPACK', '#94a3b8');
  }

  if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
    window.clearHoveredEquipment();
  }
  renderBankModal({ profile });
  safeRenderInventory(profile);
}

export function depositWornGearToBank(profile) {
  if (!profile || !profile.equipment) return;
  if (sendAuthoritativeBankOp('deposit_worn')) {
    safePlay('playHurt');
    return;
  }
  const eq = { ...profile.equipment };
  const bank = getBankItems(profile);
  const bankCap = getEffectiveBankCapacity(profile);
  let unequippedCount = 0;

  for (const [slotKey, itemId] of Object.entries(eq)) {
    if (!itemId || !EQUIPMENT_CATALOG[itemId]) continue;
    if (bank.length >= bankCap) break;

    let existing = bank.find((b) => (typeof b === 'string' ? b : b.id) === itemId);
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

  if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
    window.clearHoveredEquipment();
  }
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
  const withdrawQty = qty === 'all' ? inBankQty : Math.min(inBankQty, Math.max(1, Number(qty) || 1));

  if (sendAuthoritativeBankOp('withdraw', { bankIndex: idx, qty })) {
    safePlay('playPickup');
    safeFCT(`WITHDREW ${itemDef.name.toUpperCase()} (x${withdrawQty})`, '#4ade80');
    return;
  }

  let existingInBag = inv.find((it) => (typeof it === 'string' ? it : it.id) === itemId);
  if (!existingInBag && inv.length >= 28) {
    safeFCT('🎒 BACKPACK IS FULL (28/28)!', '#ef4444');
    return;
  }

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

  if (withdrawQty >= inBankQty) {
    bank.splice(idx, 1);
    if (inspectedEntry?.source === 'bank' && inspectedEntry.index === idx) {
      inspectedEntry = null;
    }
  } else if (typeof bankObj === 'object') {
    bankObj.qty -= withdrawQty;
  }

  profile.inventory = inv;
  saveBank(profile, bank);

  safePlay('playPickup');
  safeFCT(`WITHDREW ${itemDef.name.toUpperCase()} (x${withdrawQty})`, '#4ade80');

  if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
    window.clearHoveredEquipment();
  }
  renderBankModal({ profile });
  safeRenderInventory(profile);
}

const CATEGORY_SORT_ORDER = {
  currency: 0,
  gems_keys: 1,
  consumable: 2,
  material: 3,
  gear: 4,
};

export function sortBankItems(profile, sortKey = currentBankSort) {
  if (!profile) return [];
  const sorted = getBankItems(profile).slice().sort((a, b) => {
    const idA = typeof a === 'string' ? a : a?.id;
    const idB = typeof b === 'string' ? b : b?.id;
    const qtyA = typeof a === 'object' && a?.qty ? a.qty : 1;
    const qtyB = typeof b === 'object' && b?.qty ? b.qty : 1;
    const itA = EQUIPMENT_CATALOG[idA] || {};
    const itB = EQUIPMENT_CATALOG[idB] || {};
    const metaA = classifyBankItem(idA);
    const metaB = classifyBankItem(idB);

    if (sortKey === 'value') {
      const valDiff = (getItemGuidePrice(idB) * qtyB) - (getItemGuidePrice(idA) * qtyA);
      if (valDiff !== 0) return valDiff;
    } else if (sortKey === 'qty') {
      if (qtyB !== qtyA) return qtyB - qtyA;
    } else if (sortKey === 'rarity') {
      const rDiff = (metaB?.rarityRank || 0) - (metaA?.rarityRank || 0);
      if (rDiff !== 0) return rDiff;
    } else if (sortKey === 'skill') {
      const sA = metaA?.primarySkill || 'zzz';
      const sB = metaB?.primarySkill || 'zzz';
      if (sA !== sB) return sA.localeCompare(sB);
      const rDiff = (metaB?.rarityRank || 0) - (metaA?.rarityRank || 0);
      if (rDiff !== 0) return rDiff;
    } else if (sortKey === 'smart') {
      const cDiff = (CATEGORY_SORT_ORDER[metaA?.category] ?? 9) - (CATEGORY_SORT_ORDER[metaB?.category] ?? 9);
      if (cDiff !== 0) return cDiff;
      const sA = metaA?.primarySkill || 'zzz';
      const sB = metaB?.primarySkill || 'zzz';
      if (sA !== sB) return sA.localeCompare(sB);
      const rDiff = (metaB?.rarityRank || 0) - (metaA?.rarityRank || 0);
      if (rDiff !== 0) return rDiff;
    }
    return String(itA.name || '').localeCompare(String(itB.name || ''));
  });
  if (sendAuthoritativeBankOp('sort', {
    orderedItemIds: sorted.map((b) => (typeof b === 'string' ? b : b?.id)).filter(Boolean),
  })) {
    return sorted;
  }
  saveBank(profile, sorted);
  return sorted;
}

export function setBankCategoryTab(tab) {
  currentBankTab = tab || 'all';
  if (currentBankTab !== 'gear') currentBankGearSub = 'all';
}

export function setBankSkillFilter(skillId) {
  currentBankSkill = skillId || 'all';
}

export function setBankGearSubFilter(sub) {
  currentBankGearSub = sub || 'all';
}

export function setBankRarityFilter(rarityKey) {
  currentBankRarity = rarityKey || 'all';
}

export function setBankSortMode(sortKey) {
  currentBankSort = sortKey || 'smart';
}

export function setBankViewMode(viewMode) {
  currentBankViewMode = viewMode === 'ledger' ? 'ledger' : 'grid';
}

export function setBankQtyMode(qtyMode) {
  currentBankQtyMode = qtyMode || '1';
}

export function setBankSearchFilter(q) {
  currentBankFilter = q || '';
}

function renderInspectorHtml(entry, profile) {
  if (!entry || !entry.itemId || !EQUIPMENT_CATALOG[entry.itemId]) {
    return `
      <div style="text-align:center; padding:18px 8px; color:#64748b; font-size:9px; line-height:1.45;">
        <div style="font-size:22px; margin-bottom:4px;">🔍</div>
        <b style="color:#cbd5e1;">Item Inspector</b>
        <div style="margin-top:3px;">Hover or click any vaulted or backpack item to inspect its <b>Skill Uses</b>, <b>Crafting Recipes</b>, and <b>Gear Comparison</b>.</div>
      </div>
    `;
  }

  const it = EQUIPMENT_CATALOG[entry.itemId];
  const meta = classifyBankItem(entry.itemId);
  const borderCol = getRarityColor(it.rarity);
  const qty = Math.max(1, Number(entry.qty) || 1);
  const unitVal = getItemGuidePrice(it.id);
  const stackVal = unitVal * qty;
  const statsHtml = formatItemStatsHtml(it, true);
  const gearDiff = compareGearWithEquipped(it.id, profile);

  const skillBadges = (meta?.skills || []).map((skId) => {
    const sk = PROFESSIONS_CATALOG[skId];
    if (!sk) return '';
    return `<span style="display:inline-flex; align-items:center; gap:3px; font-size:8px; padding:1px 6px; border-radius:3px; background:rgba(15,23,42,0.9); border:1px solid ${sk.color}55; color:${sk.color}; font-weight:700;">${sk.icon} ${sk.name}</span>`;
  }).join('');

  let recipeHtml = '';
  if (meta?.producedByRecipes?.length) {
    const src = meta.producedByRecipes[0];
    const pName = PROFESSIONS_CATALOG[src.profession]?.name || src.profession;
    recipeHtml += `<div style="font-size:8px; color:#cbd5e1; margin-top:3px;">⚒️ <b>Crafted via:</b> ${pName} (Lv.${src.reqLevel})</div>`;
  }
  if (meta?.usedInRecipes?.length) {
    const preview = meta.usedInRecipes.slice(0, 3).map((r) => escapeHtml(r.outputName)).join(', ');
    const extra = meta.usedInRecipes.length > 3 ? ` (+${meta.usedInRecipes.length - 3} more)` : '';
    recipeHtml += `<div style="font-size:8px; color:#93c5fd; margin-top:3px; line-height:1.35;">📜 <b>Used to craft:</b> ${preview}${extra}</div>`;
  }

  let diffHtml = '';
  if (gearDiff) {
    if (gearDiff.sameItem) {
      diffHtml = `<div style="margin-top:5px; padding:3px 6px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.35); border-radius:3px; font-size:8px; color:#7dd3fc;">✓ Currently equipped in your <b>${gearDiff.targetSlot.toUpperCase()}</b> slot</div>`;
    } else {
      const wornLabel = gearDiff.equippedItem ? escapeHtml(gearDiff.equippedItem.name) : 'Empty Slot';
      const deltaChips = gearDiff.diffs.length
        ? gearDiff.diffs.map((d) => {
            const pos = d.delta > 0;
            return `<span style="color:${pos ? '#4ade80' : '#f87171'}; font-weight:800;">${pos ? '+' : ''}${d.delta} ${d.label}</span>`;
          }).join(' · ')
        : `<span style="color:#94a3b8;">Same combat stats</span>`;
      diffHtml = `
        <div style="margin-top:5px; padding:4px 6px; background:#050914; border:1px solid #1e293b; border-radius:3px; font-size:8px;">
          <div style="color:#94a3b8;">vs. Worn (${wornLabel}):</div>
          <div style="margin-top:2px;">${deltaChips}</div>
        </div>
      `;
    }
  }

  const actionButtons = entry.source === 'bank' && entry.index >= 0
    ? `
      <div style="display:flex; gap:5px; margin-top:7px;">
        <button type="button" class="id-mini-btn" style="flex:1; border-color:#4ade80; color:#86efac; font-size:8.5px; padding:4px;" onclick="window.withdrawBankItem(${entry.index}, 1)">Withdraw 1</button>
        ${qty > 1 ? `<button type="button" class="id-mini-btn" style="flex:1; border-color:#38bdf8; color:#7dd3fc; font-size:8.5px; padding:4px;" onclick="window.withdrawBankItem(${entry.index}, 5)">W5</button>` : ''}
        <button type="button" class="id-mini-btn" style="flex:1; border-color:#fde047; color:#fde047; font-size:8.5px; padding:4px;" onclick="window.withdrawBankItem(${entry.index}, 'all')">All (${qty})</button>
      </div>
    `
    : entry.source === 'inventory' && entry.index >= 0
    ? `
      <div style="display:flex; gap:5px; margin-top:7px;">
        <button type="button" class="id-mini-btn" style="flex:1; border-color:#38bdf8; color:#7dd3fc; font-size:8.5px; padding:4px;" onclick="window.depositInventoryItemToBank(${entry.index}, 1)">Deposit 1</button>
        <button type="button" class="id-mini-btn" style="flex:1; border-color:#fde047; color:#fde047; font-size:8.5px; padding:4px;" onclick="window.depositInventoryItemToBank(${entry.index}, 'all')">Deposit All (${qty})</button>
      </div>
    `
    : '';

  return `
    <div>
      <div style="display:flex; gap:8px; align-items:center;">
        <div style="width:44px; height:44px; flex-shrink:0; background:#050814; border:1.5px solid ${borderCol}; border-radius:4px; display:flex; align-items:center; justify-content:center;">
          <img class="pixel-art" src="${getItemIconDataUrl(it.id, 32)}" width="34" height="34" style="image-rendering:pixelated;" alt="${escapeHtml(it.name)}" />
        </div>
        <div style="min-width:0; flex:1;">
          <div style="font-size:10.5px; font-weight:800; color:${borderCol}; line-height:1.2;">${escapeHtml(it.name)}</div>
          <div style="font-size:8px; color:#cbd5e1; margin-top:2px;">
            ${meta?.roleIcon || ''} ${escapeHtml(meta?.roleLabel || it.slot)} • <span style="color:${borderCol};">${escapeHtml(it.rarity)}</span>
            ${it.reqLevel ? ` • <b style="color:#fde047;">Req Lv.${it.reqLevel}</b>` : ''}
          </div>
        </div>
      </div>

      ${skillBadges ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">${skillBadges}</div>` : ''}
      ${statsHtml ? `<div style="margin-top:6px; border-top:1px solid #1e293b; padding-top:4px;">${statsHtml}</div>` : ''}
      ${recipeHtml}
      ${diffHtml}
      ${it.desc ? `<div style="font-size:7.5px; color:#94a3b8; font-style:italic; margin-top:5px; line-height:1.35;">${escapeHtml(it.desc)}</div>` : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; color:#fde047; margin-top:6px; padding-top:5px; border-top:1px solid #1e293b;">
        <span>Stack: <b>x${qty.toLocaleString()}</b> (${unitVal.toLocaleString()}g ea)</span>
        <span>Total: <b>${stackVal.toLocaleString()} 🪙</b></span>
      </div>
      ${actionButtons}
    </div>
  `;
}

export function renderBankModal({ profile }) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('bank-modal-body');
  if (!container) return;

  const prevSearch = document.getElementById('bank-search-input');
  const hadSearchFocus = document.activeElement === prevSearch;
  const selStart = prevSearch?.selectionStart ?? null;
  const selEnd = prevSearch?.selectionEnd ?? null;

  if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
    window.clearHoveredEquipment();
  }
  container.onmouseleave = () => {
    if (typeof window !== 'undefined' && window.clearHoveredEquipment) {
      window.clearHoveredEquipment();
    }
  };

  const bank = getBankItems(profile);
  const inv = Array.isArray(profile?.inventory) ? profile.inventory : [];
  const totalValue = calculateBankValue(profile);

  // Build counts per category and per skill across the whole bank
  const categoryCounts = { all: 0, gear: 0, material: 0, consumable: 0, gems_keys: 0, currency: 0 };
  const skillCounts = { all: 0 };
  for (const s of BANK_SKILL_FILTERS) {
    if (s.key !== 'all') skillCounts[s.key] = 0;
  }

  const bankIds = new Set();
  const classifiedBank = [];
  for (let idx = 0; idx < bank.length; idx++) {
    const entry = bank[idx];
    const id = typeof entry === 'string' ? entry : entry?.id;
    const it = id ? EQUIPMENT_CATALOG[id] : null;
    if (!it) continue;
    bankIds.add(id);
    const qty = typeof entry === 'object' && entry?.qty ? entry.qty : 1;
    const meta = classifyBankItem(id);
    categoryCounts.all++;
    categoryCounts[meta.category] = (categoryCounts[meta.category] || 0) + 1;
    skillCounts.all++;
    for (const sk of meta.skills) {
      skillCounts[sk] = (skillCounts[sk] || 0) + 1;
    }
    classifiedBank.push({ entry, originalIndex: idx, id, qty, it, meta });
  }

  const rarityObj = BANK_RARITY_FILTERS.find((r) => r.key === currentBankRarity) || BANK_RARITY_FILTERS[0];
  const minRarityRank = rarityObj.minRank;

  const filtered = classifiedBank.filter(({ it, meta }) => {
    if (currentBankTab !== 'all' && meta.category !== currentBankTab) return false;
    if (currentBankSkill !== 'all' && !meta.skills.includes(currentBankSkill)) return false;
    if (currentBankTab === 'gear' && currentBankGearSub !== 'all' && meta.equipSlotGroup !== currentBankGearSub) return false;
    if ((meta.rarityRank || 1) < minRarityRank) return false;
    if (currentBankFilter) {
      const q = currentBankFilter.toLowerCase();
      const skillNames = meta.skills.map((s) => PROFESSIONS_CATALOG[s]?.name || s).join(' ').toLowerCase();
      const recipeNames = meta.usedInRecipes.map((r) => r.outputName).join(' ').toLowerCase();
      return (
        it.name.toLowerCase().includes(q)
        || (meta.roleLabel || '').toLowerCase().includes(q)
        || (it.slot || '').toLowerCase().includes(q)
        || (it.rarity || '').toLowerCase().includes(q)
        || (it.desc || '').toLowerCase().includes(q)
        || skillNames.includes(q)
        || recipeNames.includes(q)
      );
    }
    return true;
  });

  // Count how many backpack items match existing bank stacks (Terraria Quick-Stack preview)
  let quickStackMatches = 0;
  for (const itemObj of inv) {
    const id = typeof itemObj === 'string' ? itemObj : itemObj?.id;
    if (id && bankIds.has(id)) quickStackMatches++;
  }

  const bankCap = getEffectiveBankCapacity(profile);
  const founderUnlocked = isFounderEdition((typeof window !== 'undefined' && window.isLocalFounderEdition?.()) ? 'founder' : profile);
  const capPct = Math.min(100, Math.round((bank.length / bankCap) * 100));

  // Default inspected item: preserve current valid selection, else pick first visible bank item
  if (inspectedEntry?.source === 'bank') {
    const stillAt = bank[inspectedEntry.index];
    const atId = typeof stillAt === 'string' ? stillAt : stillAt?.id;
    if (atId === inspectedEntry.itemId) {
      inspectedEntry.qty = typeof stillAt === 'object' && stillAt?.qty ? stillAt.qty : 1;
    } else {
      inspectedEntry = null;
    }
  }
  const activeInspect = inspectedEntry || (filtered[0]
    ? { source: 'bank', itemId: filtered[0].id, index: filtered[0].originalIndex, qty: filtered[0].qty }
    : null);

  const clickActionHint = currentBankQtyMode === 'inspect'
    ? 'Click item to Pin & Inspect'
    : `Left-click: Withdraw ${currentBankQtyMode === 'all' ? 'All' : currentBankQtyMode} • Right-click: Withdraw All`;

  container.innerHTML = `
    <!-- Top Telemetry & Global Actions -->
    <div class="bank-top-bar">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="font-family:var(--font-header); font-size:11px; font-weight:800; color:#fde047;">
            🏛️ AETHERVAULT ARCHIVE — ORGANIZED REALM STORAGE
          </span>
          <div style="font-size:8.5px; color:#cbd5e1; margin-top:2px;">
            Skill-tagged inventory • Recipe cross-references • Gear comparison • Terraria Quick-Stack
          </div>
        </div>
        <div style="display:flex; gap:14px; align-items:center;">
          <div style="font-size:9.5px; color:#94a3b8; min-width:148px;">
            Vault Slots: <b style="color:${bank.length >= bankCap ? '#ef4444' : '#4ade80'};">${bank.length} / ${bankCap}</b>${!founderUnlocked ? ` <span style="color:#facc15;">(Trial • ${FOUNDER_MAX_BANK_SLOTS} Founder)</span>` : ''}
            <div style="height:4px; background:#020617; border-radius:2px; overflow:hidden; margin-top:3px; border:1px solid #1e293b;">
              <div style="height:100%; width:${capPct}%; background:${bank.length >= Math.max(1, bankCap - 5) ? '#ef4444' : '#38bdf8'};"></div>
            </div>
          </div>
          <div style="font-size:9.5px; color:#fde047; font-weight:bold; background:#050814; border:1px solid #334155; padding:4px 8px; border-radius:4px;">
            Vault Worth: <b>${totalValue.toLocaleString()} 🪙</b>
          </div>
        </div>
      </div>

      <!-- Quick Deposit, Quick-Stack & Search -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:9px; flex-wrap:wrap;">
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button type="button" class="util-btn"
                  title="Deposit only backpack items that already have a matching stack in the Vault (Terraria-style)"
                  style="border-color:${quickStackMatches > 0 ? '#4ade80' : '#334155'}; color:${quickStackMatches > 0 ? '#bbf7d0' : '#94a3b8'}; background:${quickStackMatches > 0 ? 'rgba(22, 101, 52, 0.35)' : 'transparent'}; font-size:8.5px; padding:4px 8px; font-weight:800;"
                  onclick="window.quickStackBackpackToBank && window.quickStackBackpackToBank()">
            🧲 QUICK STACK (${quickStackMatches})
          </button>
          <button type="button" class="util-btn" style="border-color:#22c55e; color:#86efac; font-size:8.5px; padding:4px 8px; font-weight:bold;" onclick="window.depositAllMaterialsToBank()">
            🪨 + MATERIALS
          </button>
          <button type="button" class="util-btn" style="border-color:#38bdf8; color:#7dd3fc; font-size:8.5px; padding:4px 8px; font-weight:bold;" onclick="window.depositAllInventoryToBank()">
            🎒 + ALL BAG
          </button>
          <button type="button" class="util-btn" style="border-color:#fb923c; color:#fed7aa; font-size:8.5px; padding:4px 8px; font-weight:bold;" onclick="window.depositWornGearToBank()">
            🛡️ + WORN GEAR
          </button>
        </div>

        <div style="display:flex; gap:5px; align-items:center; flex:1; min-width:210px; max-width:340px;">
          <input id="bank-search-input"
                 type="text"
                 placeholder="Search item, skill, recipe (e.g. Forging, Ore)..."
                 value="${escapeHtml(currentBankFilter)}"
                 oninput="window.setBankFilterQuery(this.value)"
                 style="flex:1; background:#050814; border:1px solid #334155; color:#f8fafc; padding:5px 8px; font-size:9.5px; border-radius:4px;" />
          ${currentBankFilter ? `<button type="button" class="id-mini-btn" style="padding:4px 8px; font-size:8.5px;" onclick="window.setBankFilterQuery('')">✕</button>` : ''}
        </div>
      </div>
    </div>

    <!-- 3-Column Bank Workspace -->
    <div class="bank-layout">
      <!-- LEFT RAIL: Category Tabs + Skill/Profession Filters + Rarity -->
      <div class="bank-sidebar">
        <div class="bank-section-label">📦 Categories</div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${BANK_CATEGORY_DEFS.map((cat) => `
            <button type="button"
                    class="bank-filter-btn ${currentBankTab === cat.key ? 'active' : ''}"
                    onclick="window.setBankTab('${cat.key}')">
              <span>${cat.icon} ${cat.label}</span>
              <span class="bank-filter-count">${categoryCounts[cat.key] || 0}</span>
            </button>
          `).join('')}
        </div>

        <div class="bank-section-label" style="margin-top:4px;">🛠️ Filter by Skill</div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${BANK_SKILL_FILTERS.map((sk) => `
            <button type="button"
                    class="bank-filter-btn ${currentBankSkill === sk.key ? 'active' : ''}"
                    style="${currentBankSkill === sk.key ? '' : `border-left-color:${sk.color}66;`}"
                    onclick="window.setBankSkillFilter('${sk.key}')">
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sk.icon} ${sk.label}</span>
              <span class="bank-filter-count">${skillCounts[sk.key] || 0}</span>
            </button>
          `).join('')}
        </div>

        <div class="bank-section-label" style="margin-top:4px;">💎 Min Rarity</div>
        <select class="id-mini-btn"
                style="width:100%; text-align:left; background:#050814; color:#e2e8f0; padding:5px 6px; font-size:8.5px;"
                onchange="window.setBankRarityFilter(this.value)">
          ${BANK_RARITY_FILTERS.map((rf) => `
            <option value="${rf.key}" ${currentBankRarity === rf.key ? 'selected' : ''}>${rf.label}</option>
          `).join('')}
        </select>

        ${(currentBankTab !== 'all' || currentBankSkill !== 'all' || currentBankRarity !== 'all' || currentBankFilter) ? `
          <button type="button" class="id-mini-btn" style="width:100%; border-color:#f87171; color:#fca5a5; font-size:8.5px; padding:4px;" onclick="window.resetBankFilters()">
            ↺ Reset All Filters
          </button>
        ` : ''}
      </div>

      <!-- CENTER: Controls Bar + Grid / Ledger Storage View -->
      <div class="bank-center-pane">
        <div class="bank-subbar">
          <!-- RuneScape Quantity Mode -->
          <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
            <span style="font-size:8px; color:#94a3b8; font-weight:700;">CLICK:</span>
            <div class="bank-qty-pill-group">
              ${[
                { key: 'inspect', label: '👁️ Inspect' },
                { key: '1', label: '1' },
                { key: '5', label: '5' },
                { key: '10', label: '10' },
                { key: 'all', label: 'All' },
              ].map((qm) => `
                <button type="button"
                        class="bank-pill-btn ${currentBankQtyMode === qm.key ? 'active' : ''}"
                        onclick="window.setBankQtyMode('${qm.key}')">${qm.label}</button>
              `).join('')}
            </div>
          </div>

          <!-- Sort + View Toggle -->
          <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
            <select class="id-mini-btn"
                    style="background:#0b1120; color:#e9d5ff; border-color:#7e22ce; font-size:8.5px; padding:3px 6px;"
                    onchange="window.setBankSortMode(this.value)">
              ${BANK_SORT_OPTIONS.map((so) => `
                <option value="${so.key}" ${currentBankSort === so.key ? 'selected' : ''}>Sort: ${so.label}</option>
              `).join('')}
            </select>
            <button type="button" class="id-mini-btn"
                    style="border-color:#c084fc; color:#e9d5ff; font-size:8.5px; padding:3px 7px; font-weight:700;"
                    onclick="window.sortBankVault && window.sortBankVault()">
              ↕️ Apply Sort
            </button>
            <div class="bank-qty-pill-group">
              <button type="button" class="bank-pill-btn ${currentBankViewMode === 'grid' ? 'active' : ''}" onclick="window.setBankViewMode('grid')">⊞ Tiles</button>
              <button type="button" class="bank-pill-btn ${currentBankViewMode === 'ledger' ? 'active' : ''}" onclick="window.setBankViewMode('ledger')">☰ List</button>
            </div>
          </div>
        </div>

        ${currentBankTab === 'gear' ? `
          <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px;">
            ${BANK_GEAR_SUBFILTERS.map((gf) => `
              <button type="button"
                      class="bank-pill-btn ${currentBankGearSub === gf.key ? 'active' : ''}"
                      style="border:1px solid ${currentBankGearSub === gf.key ? '#fde047' : '#1e293b'};"
                      onclick="window.setBankGearSubFilter('${gf.key}')">${gf.label}</button>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; color:#94a3b8; margin-bottom:6px; padding:0 2px;">
          <span>Showing <b style="color:#f8fafc;">${filtered.length}</b> of ${bank.length} vault stacks</span>
          <span>${clickActionHint}</span>
        </div>

        <div class="bank-vault-scroll">
          ${filtered.length === 0 ? `
            <div style="text-align:center; padding:54px 20px; color:#64748b; font-size:10px;">
              <div style="font-size:28px; margin-bottom:8px;">🏛️</div>
              <b>No items match these filters.</b>
              <div style="margin-top:4px;">Try switching Skill / Category on the left, clearing search, or depositing items from your backpack.</div>
            </div>
          ` : currentBankViewMode === 'ledger' ? `
            <div class="bank-ledger-list">
              ${filtered.map(({ originalIndex, id, qty, it, meta }) => {
                const borderCol = getRarityColor(it.rarity);
                const isSelected = activeInspect?.source === 'bank' && activeInspect?.index === originalIndex;
                const stackVal = getItemGuidePrice(id) * qty;
                const skColor = meta.primarySkillMeta?.color || '#94a3b8';
                return `
                  <div class="bank-ledger-row ${isSelected ? 'selected' : ''}"
                       style="border-left-color:${borderCol};"
                       onclick="window.handleBankSlotClick(${originalIndex}, '${id}', ${qty})"
                       oncontextmenu="event.preventDefault(); window.withdrawBankItem(${originalIndex}, 'all');"
                       onmouseenter="window.previewBankInspector('${id}', 'bank', ${originalIndex}, ${qty})">
                    <div style="width:34px; height:34px; background:#050814; border:1px solid ${borderCol}; border-radius:4px; display:flex; align-items:center; justify-content:center;">
                      <img class="pixel-art" src="${getItemIconDataUrl(id, 24)}" width="26" height="26" style="image-rendering:pixelated;" alt="${escapeHtml(it.name)}" />
                    </div>
                    <div style="min-width:0;">
                      <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="font-size:9.5px; font-weight:800; color:${borderCol};">${escapeHtml(it.name)}</span>
                        <span style="font-size:7.5px; color:${skColor}; background:rgba(15,23,42,0.9); border:1px solid ${skColor}44; padding:0 5px; border-radius:3px;">${meta.roleIcon} ${escapeHtml(meta.roleLabel)}</span>
                        ${meta.tierLabel ? `<span class="bank-tier-chip">${meta.tierLabel}</span>` : ''}
                      </div>
                      <div style="font-size:8px; color:#94a3b8; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${escapeHtml(meta.summaryLine || it.rarity)}
                      </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                      <div style="text-align:right; line-height:1.25;">
                        <div style="font-size:9.5px; font-weight:800; color:#fde047;">x${qty.toLocaleString()}</div>
                        <div style="font-size:7.5px; color:#94a3b8;">${stackVal.toLocaleString()} 🪙</div>
                      </div>
                      <button type="button" class="id-mini-btn" style="padding:3px 6px; font-size:8px; border-color:#4ade80; color:#86efac;" onclick="event.stopPropagation(); window.withdrawBankItem(${originalIndex}, 1)">W1</button>
                      <button type="button" class="id-mini-btn" style="padding:3px 6px; font-size:8px; border-color:#38bdf8; color:#7dd3fc;" onclick="event.stopPropagation(); window.withdrawBankItem(${originalIndex}, 'all')">All</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="bank-tile-grid">
              ${filtered.map(({ originalIndex, id, qty, it, meta }) => {
                const borderCol = getRarityColor(it.rarity);
                const isSelected = activeInspect?.source === 'bank' && activeInspect?.index === originalIndex;
                return `
                  <div class="bank-tile ${isSelected ? 'selected' : ''}"
                       style="border-color:${borderCol};"
                       onclick="window.handleBankSlotClick(${originalIndex}, '${id}', ${qty})"
                       oncontextmenu="event.preventDefault(); window.withdrawBankItem(${originalIndex}, 'all');"
                       onmouseenter="window.previewBankInspector('${id}', 'bank', ${originalIndex}, ${qty})">
                    <div class="bank-tile-top">
                      <span class="bank-role-chip" title="${escapeHtml(meta.roleLabel)}">${meta.roleIcon} ${escapeHtml(meta.roleLabel.split(' ')[0])}</span>
                      ${meta.tierLabel ? `<span class="bank-tier-chip">${meta.tierLabel}</span>` : ''}
                    </div>
                    <div class="bank-sprite-wrap" style="box-shadow: inset 0 0 10px ${borderCol}33;">
                      <img class="pixel-art" src="${getItemIconDataUrl(id, 32)}" width="30" height="30" style="image-rendering:pixelated;" alt="${escapeHtml(it.name)}" />
                      ${qty > 1 ? `<span class="bank-qty-badge">${formatCompactQty(qty)}</span>` : ''}
                    </div>
                    <div class="bank-tile-name" style="color:${borderCol};">${escapeHtml(it.name)}</div>
                    <div class="bank-tile-sub">${escapeHtml(meta.summaryLine || it.rarity)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- RIGHT PANE: Pinned Inspector + 28-Slot Backpack -->
      <div class="bank-right-pane">
        <div id="bank-inspector-card" class="bank-inspector-box">
          ${renderInspectorHtml(activeInspect, profile)}
        </div>

        <div class="bank-bag-box">
          <div style="font-family:var(--font-header); font-size:9px; color:#38bdf8; margin-bottom:7px; border-bottom:1px solid #1e293b; padding-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
            <span>🎒 BACKPACK</span>
            <span style="color:#94a3b8; font-size:8.5px;">${inv.length}/28 • <span style="color:#4ade80;">●</span> Matches Vault</span>
          </div>
          <div class="bank-bag-grid">
            ${Array.from({ length: 28 }).map((_, i) => {
              const itemObj = inv[i];
              const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
              const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
              const inBagQty = typeof itemObj === 'object' && itemObj?.qty ? itemObj.qty : 1;

              if (item) {
                const borderCol = getRarityColor(item.rarity);
                const inVault = bankIds.has(item.id);
                const meta = classifyBankItem(item.id);
                return `
                  <div class="rs-inv-slot"
                       style="border:1.5px solid ${borderCol}; width:auto; height:48px; cursor:pointer; background:#090f20;"
                       onclick="window.handleBankBagClick(${i}, '${item.id}', ${inBagQty})"
                       oncontextmenu="event.preventDefault(); window.depositInventoryItemToBank(${i}, 'all');"
                       onmouseenter="window.previewBankInspector('${item.id}', 'inventory', ${i}, ${inBagQty})"
                       title="${escapeHtml(item.name)} — Click to deposit">
                    ${inVault ? `<span class="bank-quickstack-dot" title="Matches existing Vault stack (Quick-Stack eligible)"></span>` : ''}
                    <span style="position:absolute; top:1px; right:3px; font-size:8px; line-height:1;">${meta?.roleIcon || ''}</span>
                    <img class="pixel-art" src="${getItemIconDataUrl(item.id, 24)}" width="24" height="24" style="image-rendering:pixelated; margin-top:4px;" alt="${escapeHtml(item.name)}" />
                    ${inBagQty > 1 ? `<div style="position:absolute; bottom:1px; right:3px; font-size:7.5px; font-weight:bold; color:#fde047; text-shadow:1px 1px 0 #000;">${formatCompactQty(inBagQty)}</div>` : ''}
                  </div>
                `;
              }

              return `
                <div class="rs-inv-slot empty" style="width:auto; height:48px;">
                  <span style="color:#334155; font-size:8px;">${i + 1}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div style="margin-top:6px; font-size:7.5px; color:#94a3b8; line-height:1.3; text-align:center;">
            Bag: Left-click deposits ${currentBankQtyMode === 'inspect' ? 'Inspect' : currentBankQtyMode === 'all' ? 'All' : currentBankQtyMode} • Right-click deposits All
          </div>
        </div>
      </div>
    </div>
  `;

  if (hadSearchFocus) {
    const nextSearch = document.getElementById('bank-search-input');
    if (nextSearch) {
      nextSearch.focus();
      if (selStart !== null && selEnd !== null) {
        try {
          nextSearch.setSelectionRange(selStart, selEnd);
        } catch (_) {}
      }
    }
  }
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.renderBankModal = renderBankModal;
  window.setBankTab = function (tab) {
    setBankCategoryTab(tab);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankSkillFilter = function (skillId) {
    setBankSkillFilter(skillId);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankGearSubFilter = function (sub) {
    setBankGearSubFilter(sub);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankRarityFilter = function (rarityKey) {
    setBankRarityFilter(rarityKey);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankSortMode = function (sortKey) {
    setBankSortMode(sortKey);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankViewMode = function (mode) {
    setBankViewMode(mode);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankQtyMode = function (qtyMode) {
    setBankQtyMode(qtyMode);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.resetBankFilters = function () {
    currentBankTab = 'all';
    currentBankSkill = 'all';
    currentBankGearSub = 'all';
    currentBankRarity = 'all';
    currentBankFilter = '';
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.setBankFilterQuery = function (q) {
    setBankSearchFilter(q);
    if (window.localProfile) renderBankModal({ profile: window.localProfile });
  };
  window.previewBankInspector = function (itemId, source = 'bank', index = -1, qty = 1) {
    inspectedEntry = { source, itemId, index, qty };
    const card = document.getElementById('bank-inspector-card');
    if (card) {
      card.innerHTML = renderInspectorHtml(inspectedEntry, window.localProfile);
    }
  };
  window.handleBankSlotClick = function (bankIndex, itemId, qty) {
    inspectedEntry = { source: 'bank', itemId, index: bankIndex, qty };
    if (currentBankQtyMode === 'inspect') {
      if (window.localProfile) renderBankModal({ profile: window.localProfile });
      return;
    }
    const q = currentBankQtyMode === 'all' ? 'all' : Math.max(1, Number(currentBankQtyMode) || 1);
    if (window.localProfile) withdrawBankItemToInventory(window.localProfile, bankIndex, q);
  };
  window.handleBankBagClick = function (invIndex, itemId, qty) {
    inspectedEntry = { source: 'inventory', itemId, index: invIndex, qty };
    if (currentBankQtyMode === 'inspect') {
      if (window.localProfile) renderBankModal({ profile: window.localProfile });
      return;
    }
    const q = currentBankQtyMode === 'all' ? 'all' : Math.max(1, Number(currentBankQtyMode) || 1);
    if (window.localProfile) depositInventoryItemToBank(window.localProfile, invIndex, q);
  };
  window.depositInventoryItemToBank = function (invIndex, qty = 'all') {
    if (window.localProfile) depositInventoryItemToBank(window.localProfile, invIndex, qty);
  };
  window.quickStackBackpackToBank = function () {
    if (window.localProfile) quickStackBackpackToBank(window.localProfile);
  };
  window.depositAllInventoryToBank = function () {
    if (window.localProfile) depositAllInventoryToBank(window.localProfile);
  };
  window.depositAllMaterialsToBank = function () {
    if (window.localProfile) depositAllMaterialsToBank(window.localProfile);
  };
  window.depositWornGearToBank = function () {
    if (window.localProfile) depositWornGearToBank(window.localProfile);
  };
  window.withdrawBankItem = function (bankIndex, qty = 1) {
    if (window.localProfile) withdrawBankItemToInventory(window.localProfile, bankIndex, qty);
  };
  window.sortBankVault = function () {
    const profile = window.localProfile;
    if (!profile) return;
    sortBankItems(profile, currentBankSort);
    renderBankModal({ profile });
  };
}
