// ==========================================
// GlimmerFall Online 2D — Canonical Market Merchants & Wares System
// Interactive Stall Merchants with Lore Conversations & Direct Store Purchasing
// ==========================================

import { EQUIPMENT_CATALOG, MERCHANT_CATALOGS, getMerchantSellPrice } from '../shared/protocol.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { getPlayerGold, deductPlayerGold, addPlayerGold, addItemToBackpack, getRarityColor } from './equipmentUi.js';

export { MERCHANT_CATALOGS };
let currentActiveMerchantId = 'merchant_apothecary';

export function getMerchantDialoguePages(merchantId) {
  const cat = MERCHANT_CATALOGS[merchantId] || MERCHANT_CATALOGS.merchant_apothecary;
  // Mark inspection in quest state if active
  if (typeof window !== 'undefined' && window.questState) {
    if (cat.id === 'merchant_smith') window.questState.smithInspected = true;
    if (cat.id === 'merchant_apothecary') window.questState.apothecaryInspected = true;
    if (cat.id === 'merchant_provisions') window.questState.provisionsInspected = true;
    if (cat.id === 'merchant_relics') window.questState.relicsInspected = true;
    if (cat.id === 'merchant_tailor') window.questState.provisionsInspected = true;
    if (typeof window.saveQuestState === 'function') window.saveQuestState();
    if (typeof window.updateQuestTrackerHUD === 'function') window.updateQuestTrackerHUD();
  }
  return [
    {
      speaker: `${cat.name.toUpperCase()} • ${cat.title.toUpperCase()}`,
      spriteKey: cat.spriteKey,
      merchantId: cat.id,
      text: `${cat.greeting}\n\n${cat.loreIntro}\n\nWould you like to inspect my available wares or learn about how to use them?`,
      actions: [
        { label: '🛒 BROWSE WARES & BUY', action: 'openShop', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
        { label: '📖 WHAT DO YOU RECOMMEND?', action: 'advance' },
        { label: '👋 FAREWELL', action: 'close' },
      ],
    },
    {
      speaker: `${cat.name.toUpperCase()} • ${cat.title.toUpperCase()}`,
      spriteKey: cat.spriteKey,
      merchantId: cat.id,
      text: `Here is a breakdown of my current stock:\n\n` +
        cat.wares.map((w) => {
          const it = EQUIPMENT_CATALOG[w.itemId];
          return `• ${it?.name || w.itemId} (${w.price} Gold): ${w.note}`;
        }).join('\n\n'),
      actions: [
        { label: '🛒 BROWSE WARES & BUY', action: 'openShop', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
        { label: '← BACK', action: 'prev' },
        { label: '👋 FAREWELL', action: 'close' },
      ],
    },
  ];
}

export function renderMerchantModal(merchantId = null) {
  if (merchantId) {
    currentActiveMerchantId = merchantId;
  }
  const cat = MERCHANT_CATALOGS[currentActiveMerchantId] || MERCHANT_CATALOGS.merchant_apothecary;
  const modal = document.getElementById('merchant-modal');
  const body = document.getElementById('merchant-modal-body');
  const title = document.getElementById('merchant-modal-title');
  if (!modal || !body) return;

  if (title) {
    title.innerHTML = `${cat.icon} ${cat.name.toUpperCase()} — ${cat.title.toUpperCase()}`;
    title.style.color = cat.badgeColor || '#fde047';
  }

  const profile = window.localProfile || {};
  const gold = getPlayerGold(profile);
  const inv = Array.isArray(profile.inventory) ? profile.inventory : [];
  const invCount = inv.length;

  const coinGlyph = '<span class="coin-glyph" aria-label="Gold"></span>';

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; font-family:var(--font-body); color:#e2e8f0;">
      <!-- Merchant Lore Banner -->
      <div style="background:rgba(15, 23, 42, 0.75); border:1px solid #334155; border-left:3px solid ${cat.badgeColor}; padding:10px 14px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="flex:1; min-width:240px;">
          <div style="font-size:12px; font-weight:800; color:${cat.badgeColor}; font-family:var(--font-header); letter-spacing:0.5px;">
            ${cat.icon} ${cat.name} — ${cat.title}
          </div>
          <div style="font-size:10px; color:#cbd5e1; margin-top:3px; line-height:1.4;">
            ${cat.loreIntro}
          </div>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <div style="background:#090d16; border:1px solid #ca8a04; border-radius:4px; padding:6px 12px; text-align:center;">
            <div style="font-size:8px; color:#94a3b8; text-transform:uppercase; font-weight:700;">YOUR PURSE</div>
            <div style="font-size:13px; font-weight:800; color:#fde047;">${coinGlyph} ${gold.toLocaleString()} <span style="font-size:9px; color:#cbd5e1;">Gold</span></div>
          </div>
          <div style="background:#090d16; border:1px solid #475569; border-radius:4px; padding:6px 12px; text-align:center;">
            <div style="font-size:8px; color:#94a3b8; text-transform:uppercase; font-weight:700;">BACKPACK</div>
            <div style="font-size:13px; font-weight:800; color:${invCount >= 28 ? '#ef4444' : '#38bdf8'};">🎒 ${invCount}/28 <span style="font-size:9px; color:#cbd5e1;">Slots</span></div>
          </div>
        </div>
      </div>

      <!-- Nearby World Artisan Station Callout (Replaces Shop Gold-Training) -->
      ${cat.stationId ? `
        <div style="background:#090d16; border:1px solid ${cat.badgeColor}; border-left:4px solid ${cat.badgeColor}; border-radius:5px; padding:9px 12px; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:220px;">
            <div style="font-size:10.5px; font-weight:800; color:${cat.badgeColor}; font-family:var(--font-header); letter-spacing:0.4px;">
              ✨ WORLD ARTISAN STATION NEARBY
            </div>
            <div style="font-size:9.5px; color:#cbd5e1; margin-top:2px;">
              ${cat.stationHint}
            </div>
          </div>
          <button class="util-btn"
                  style="font-size:9.5px; padding:6px 12px; border-color:${cat.badgeColor}; color:#fff; background:#1e293b; font-weight:800;"
                  onclick="document.getElementById('merchant-modal').style.display='none'; if (window.openCraftingModal) window.openCraftingModal('${cat.stationId}');">
            🔨 USE NEARBY STATION
          </button>
        </div>
      ` : ''}

      <!-- Wares Showcase Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px; max-height:50vh; overflow-y:auto; padding-right:4px;">
        ${cat.wares.map((w) => {
          const item = EQUIPMENT_CATALOG[w.itemId];
          if (!item) return '';
          const rarityCol = getRarityColor(item.rarity);
          const canAfford1 = gold >= w.price;
          const canAfford5 = gold >= w.price * 5;
          const hasSpace = invCount < 28 || item.stackable;

          return `
            <div style="background:#0d1527; border:1px solid #1e293b; border-left:3px solid ${rarityCol}; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
              <div style="display:flex; gap:10px; align-items:flex-start;">
                <div style="width:40px; height:40px; background:#050811; border:1px solid ${rarityCol}; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <img class="pixel-art" src="${getItemIconDataUrl(item.id, 32)}" width="32" height="32" style="image-rendering:pixelated;" alt="${item.name}" />
                </div>
                <div style="flex:1;">
                  <div style="font-size:11px; font-weight:800; color:${rarityCol}; font-family:var(--font-header);">
                    ${item.name}
                  </div>
                  <div style="font-size:8px; color:#94a3b8; text-transform:uppercase; margin-top:1px;">
                    ${item.rarity || 'Common'} • ${item.slot.toUpperCase()}
                  </div>
                  <div style="font-size:9.5px; color:#cbd5e1; margin-top:4px; line-height:1.3;">
                    ${w.note}
                  </div>
                </div>
              </div>

              <!-- Price & Buy Buttons -->
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1e293b; padding-top:6px; margin-top:4px;">
                <div style="font-size:11px; font-weight:800; color:#fde047;">
                  ${coinGlyph} ${w.price} <span style="font-size:8px; color:#94a3b8;">Gold</span>
                </div>
                <div style="display:flex; gap:6px;">
                  <button class="util-btn"
                          style="font-size:9px; padding:4px 8px; border-color:${canAfford1 && hasSpace ? '#ca8a04' : '#475569'}; color:${canAfford1 && hasSpace ? '#fde047' : '#64748b'}; background:${canAfford1 && hasSpace ? '#1e1b4b' : '#0f172a'};"
                          ${!canAfford1 || !hasSpace ? 'disabled' : ''}
                          onclick="window.buyMerchantItem('${cat.id}', '${item.id}', 1)">
                    BUY 1
                  </button>
                  ${item.stackable ? `
                    <button class="util-btn"
                            style="font-size:9px; padding:4px 8px; border-color:${canAfford5 && hasSpace ? '#38bdf8' : '#475569'}; color:${canAfford5 && hasSpace ? '#7dd3fc' : '#64748b'}; background:${canAfford5 && hasSpace ? '#0c4a6e' : '#0f172a'};"
                            ${!canAfford5 || !hasSpace ? 'disabled' : ''}
                            onclick="window.buyMerchantItem('${cat.id}', '${item.id}', 5)">
                      BUY 5 <span style="font-size:8px;">(${w.price * 5})</span>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Sell Backpack Items Strip -->
      <div style="background:#080e1d; border:1px solid #1e293b; border-radius:4px; padding:8px 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:10px; font-weight:800; color:#fbbf24; font-family:var(--font-header);">🪙 SELL BACKPACK ITEMS (40% VALUE)</span>
          <span style="font-size:8.5px; color:#94a3b8;">Click to sell 1 or All from your bag</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:110px; overflow-y:auto;">
          ${inv.map((entry, idx) => {
            const id = typeof entry === 'string' ? entry : entry?.id;
            const qty = typeof entry === 'object' && entry?.qty ? entry.qty : 1;
            const sellVal = getMerchantSellPrice(id);
            const it = id ? EQUIPMENT_CATALOG[id] : null;
            if (!it || sellVal <= 0) return '';
            const col = getRarityColor(it.rarity);
            return `
              <div style="display:inline-flex; align-items:center; gap:5px; background:#0d1527; border:1px solid ${col}66; border-radius:4px; padding:3px 6px;">
                <img class="pixel-art" src="${getItemIconDataUrl(id, 18)}" width="18" height="18" style="image-rendering:pixelated;" alt="${it.name}" />
                <span style="font-size:9px; color:${col}; font-weight:700;">${it.name}${qty > 1 ? ` ×${qty}` : ''}</span>
                <button type="button" class="id-mini-btn" style="font-size:8px; padding:2px 5px; border-color:#ca8a04; color:#fde047;" onclick="window.sellMerchantItem('${cat.id}', ${idx}, 1)">+${sellVal}g</button>
                ${qty > 1 ? `<button type="button" class="id-mini-btn" style="font-size:8px; padding:2px 5px; border-color:#4ade80; color:#86efac;" onclick="window.sellMerchantItem('${cat.id}', ${idx}, ${qty})">All (+${sellVal * qty}g)</button>` : ''}
              </div>
            `;
          }).join('') || '<span style="font-size:9px; color:#64748b;">No sellable items in backpack.</span>'}
        </div>
      </div>

      <!-- Footer Info -->
      <div style="font-size:8.5px; color:#94a3b8; text-align:center; margin-top:4px; border-top:1px solid #1e293b; padding-top:6px;">
        💡 Purchased items are placed directly into your 28-slot backpack [B] / [I]. Consumables heal HP or restore charge when left-clicked!
      </div>
    </div>
  `;
}

export function buyMerchantItem(merchantId, itemId, qty = 1) {
  const cat = MERCHANT_CATALOGS[merchantId] || MERCHANT_CATALOGS.merchant_apothecary;
  const ware = cat.wares.find((w) => w.itemId === itemId);
  const item = EQUIPMENT_CATALOG[itemId];
  if (!ware || !item) return;

  const totalCost = ware.price * qty;
  const profile = window.localProfile;
  if (!profile) return;

  const currentGold = getPlayerGold(profile);
  if (currentGold < totalCost) {
    if (typeof window.spawnFCT === 'function' && window.player) {
      window.spawnFCT(window.player.x, window.player.y - 14, `NOT ENOUGH GOLD (NEED ${totalCost} GOLD)!`, '#ef4444');
    }
    if (window.audio?.playHurt) window.audio.playHurt();
    return;
  }

  const inv = Array.isArray(profile.inventory) ? profile.inventory : [];
  if (!item.stackable && inv.length + qty > 28) {
    if (typeof window.spawnFCT === 'function' && window.player) {
      window.spawnFCT(window.player.x, window.player.y - 14, '🎒 BACKPACK IS FULL (28/28)!', '#ef4444');
    }
    if (window.audio?.playHurt) window.audio.playHurt();
    return;
  }

  // Deduct gold
  deductPlayerGold(profile, totalCost);

  // Add item
  addItemToBackpack(profile, itemId, qty);

  // Persist locally
  if (typeof window.saveProgressionLocal === 'function') {
    window.saveProgressionLocal();
  }

  // Sync to server if connected (server resolves canonical merchant price authoritatively)
  if (window.net?.connected) {
    window.net.send({
      type: 'buy_merchant_item',
      merchantId: cat.id,
      itemId,
      qty,
    });
  }

  // Sound and visual feedback
  if (window.audio?.playPickup) window.audio.playPickup();
  if (window.audio?.playChime) window.audio.playChime();
  if (typeof window.spawnFCT === 'function' && window.player) {
    window.spawnFCT(window.player.x, window.player.y - 14, `+${qty}x ${item.name.toUpperCase()} (-${totalCost} GOLD)`, '#4ade80', true);
  }
  if (typeof window.logMessage === 'function') {
    window.logMessage(`🛒 Purchased ${qty}x ${item.name} from ${cat.name} for ${totalCost} Solar Gold.`, 'log-gain', 'combat');
  }

  // Update quest inspection flags when browsing/purchasing starter supplies
  if (typeof window !== 'undefined' && window.questState) {
    if (cat.id === 'merchant_smith') window.questState.smithInspected = true;
    if (cat.id === 'merchant_apothecary') window.questState.apothecaryInspected = true;
    if (cat.id === 'merchant_provisions') window.questState.provisionsInspected = true;
    if (cat.id === 'merchant_relics') window.questState.relicsInspected = true;
    if (typeof window.saveQuestState === 'function') window.saveQuestState();
    if (typeof window.updateQuestTrackerHUD === 'function') window.updateQuestTrackerHUD();
  }

  // Update UI
  if (typeof window.updatePlayerUI === 'function') window.updatePlayerUI();
  if (typeof window.renderInventoryModal === 'function') window.renderInventoryModal({ profile });
  renderMerchantModal(cat.id);
}

export function sellMerchantItem(merchantId, slotIndex, qty = 1) {
  const cat = MERCHANT_CATALOGS[merchantId] || MERCHANT_CATALOGS.merchant_apothecary;
  const profile = window.localProfile;
  if (!profile || !Array.isArray(profile.inventory)) return;
  const idx = Number(slotIndex);
  if (idx < 0 || idx >= profile.inventory.length) return;

  const entry = profile.inventory[idx];
  const itemId = typeof entry === 'string' ? entry : entry?.id;
  const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
  const unitVal = getMerchantSellPrice(itemId);
  if (!item || unitVal <= 0) return;

  const inSlotQty = typeof entry === 'object' && entry?.qty ? entry.qty : 1;
  const sellQty = Math.max(1, Math.min(inSlotQty, Number(qty) || 1));
  const totalGold = unitVal * sellQty;

  if (window.net?.connected) {
    window.net.send({
      type: 'sell_merchant_item',
      merchantId: cat.id,
      slotIndex: idx,
      itemId,
      qty: sellQty,
    });
    return;
  }

  if (sellQty >= inSlotQty) {
    profile.inventory.splice(idx, 1);
  } else if (typeof entry === 'object') {
    entry.qty -= sellQty;
  }
  addPlayerGold(profile, totalGold);
  if (typeof window.saveProgressionLocal === 'function') window.saveProgressionLocal();
  if (window.audio?.playPickup) window.audio.playPickup();
  if (typeof window.spawnFCT === 'function' && window.player) {
    window.spawnFCT(window.player.x, window.player.y - 14, `+${totalGold} GOLD (${sellQty}x ${item.name.toUpperCase()})`, '#fde047', true);
  }
  if (typeof window.logMessage === 'function') {
    window.logMessage(`🪙 Sold ${sellQty}x ${item.name} to ${cat.name} for ${totalGold} Solar Gold.`, 'log-gain', 'combat');
  }
  if (typeof window.updatePlayerUI === 'function') window.updatePlayerUI();
  if (typeof window.renderInventoryModal === 'function') window.renderInventoryModal({ profile });
  renderMerchantModal(cat.id);
}

export function openMerchantShop(merchantId) {
  currentActiveMerchantId = merchantId || 'merchant_apothecary';
  renderMerchantModal(currentActiveMerchantId);
  if (typeof window.toggleModal === 'function') {
    window.toggleModal('merchant-modal');
  }
}

// Attach globals for inline onclicks and engine hooks
if (typeof window !== 'undefined') {
  window.openMerchantShop = openMerchantShop;
  window.buyMerchantItem = buyMerchantItem;
  window.sellMerchantItem = sellMerchantItem;
  window.renderMerchantModal = renderMerchantModal;
}
