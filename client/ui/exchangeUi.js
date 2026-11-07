// ==========================================
// AetherSwap Continental Exchange UI & Offer Book
// ==========================================

import { EQUIPMENT_CATALOG } from '../../shared/protocol.js';
import { getItemIconDataUrl } from '../itemSprites.js';
import { getRarityColor, getPlayerGold, countItemInBackpack } from './inventoryHelpers.js';

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
