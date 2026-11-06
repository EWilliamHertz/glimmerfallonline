// ==========================================
// GlimmerFall Online 2D — Canonical Market Merchants & Wares System
// Interactive Stall Merchants with Lore Conversations & Direct Store Purchasing
// ==========================================

import { EQUIPMENT_CATALOG } from '../shared/protocol.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { getPlayerGold, deductPlayerGold, addItemToBackpack, getRarityColor } from './equipmentUi.js';

let currentActiveMerchantId = 'merchant_apothecary';

export const MERCHANT_CATALOGS = {
  merchant_apothecary: {
    id: 'merchant_apothecary',
    name: 'Alchemist Faye',
    title: 'Apothecary & Potions Merchant',
    icon: '⚖️',
    spriteKey: 'merchantApothecaryNpc',
    badgeColor: '#38bdf8',
    greeting: 'Welcome to my Apothecary stall! Here I distill mountain roots and concentrated aether into restorative elixirs.',
    loreIntro: 'Vitality salves mend flesh wounds and heal HP, while Leyline Glimmer Draughts restore ability charge. You can drink them directly from your 28-slot backpack during battle.',
    wares: [
      { itemId: 'minor_healing_salve', price: 10, note: 'Mends wounds immediately. Restores +35 HP on use.' },
      { itemId: 'glimmer_draught', price: 12, note: 'Effervescent tonic. Restores +40 Glimmer Charge.' },
      { itemId: 'major_vitality_elixir', price: 25, note: 'Concentrated brew. Restores +80 HP on use.' },
    ],
  },
  merchant_provisions: {
    id: 'merchant_provisions',
    name: 'Farmer Bran',
    title: 'Provisions & Rations Merchant',
    icon: '🍎',
    spriteKey: 'merchantProvisionsNpc',
    badgeColor: '#4ade80',
    greeting: 'Hail and well met! An adventurer cannot venture into the ruins on an empty stomach. Stock up on hearty sustenance!',
    loreIntro: 'Eating baked bread loaves, fresh orchard apples, or smoked trail rations recovers your Health between skirmishes. Click any food in your backpack to consume it.',
    wares: [
      { itemId: 'sweet_apple', price: 3, note: 'Crisp orchard fruit. Restores +15 HP on use.' },
      { itemId: 'fresh_crusty_bread', price: 6, note: 'Warm crusty loaf. Restores +25 HP on use.' },
      { itemId: 'field_rations', price: 10, note: 'Smoked jerky and trail fruits. Restores +35 HP on use.' },
    ],
  },
  merchant_smith: {
    id: 'merchant_smith',
    name: 'Blacksmith Torvin',
    title: 'Smithing & Ore Wares Merchant',
    icon: '⚒️',
    spriteKey: 'merchantSmithNpc',
    badgeColor: '#fb923c',
    greeting: 'Ho there! Blacksmith Torvin at your service. Reliable metalwork is what separates champions from fallen recruits!',
    loreIntro: 'I supply raw iron ore, smelted bronze bars, and tempered beginner weapons and shields. Equip gear from your backpack to boost your Power and Bastion.',
    wares: [
      { itemId: 'iron_ore', price: 6, note: 'Quarried iron ore rock ready for smelting.' },
      { itemId: 'bronze_bar', price: 14, note: 'Smelted bronze ingot for smithing and crafting.' },
      { itemId: 'iron_broadsword', price: 28, note: 'Forged combat blade (+2 Power).' },
      { itemId: 'iron_heater_shield', price: 24, note: 'Reinforced defense shield (+2 Bastion).' },
    ],
  },
  merchant_relics: {
    id: 'merchant_relics',
    name: 'Relic-Seeker Moira',
    title: 'Aether Curios & Relics Merchant',
    icon: '✨',
    spriteKey: 'merchantRelicsNpc',
    badgeColor: '#c084fc',
    greeting: 'Greetings, seeker. I unearth remnants of the First Nexus across the continental ruins. What curios do you seek?',
    loreIntro: 'First Nexus relic fragments, raw glimmer shards, and temporal chrono-gems pulse with leyline power and command great value in the AetherSwap Market.',
    wares: [
      { itemId: 'ancient_relic_fragment', price: 18, note: 'Carved First Nexus keystone shard.' },
      { itemId: 'glimmer_shard', price: 22, note: 'Raw continental aether crystal valued by traders.' },
      { itemId: 'chrono_gem', price: 32, note: 'Temporal jewel channeling chronomantic resonance.' },
      { itemId: 'apprentice_focus_orb', price: 28, note: 'Arcane off-hand orb (+2 Resonance).' },
    ],
  },
};

export function getMerchantDialoguePages(merchantId) {
  const cat = MERCHANT_CATALOGS[merchantId] || MERCHANT_CATALOGS.merchant_apothecary;
  // Mark inspection in quest state if active
  if (typeof window !== 'undefined' && window.questState) {
    if (cat.id === 'merchant_smith') window.questState.smithInspected = true;
    if (cat.id === 'merchant_apothecary') window.questState.apothecaryInspected = true;
    if (cat.id === 'merchant_provisions') window.questState.provisionsInspected = true;
    if (cat.id === 'merchant_relics') window.questState.relicsInspected = true;
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
          return `• ${it?.name || w.itemId} (🪙 ${w.price} Gold): ${w.note}`;
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
            <div style="font-size:13px; font-weight:800; color:#fde047;">🪙 ${gold.toLocaleString()} <span style="font-size:9px; color:#cbd5e1;">Gold</span></div>
          </div>
          <div style="background:#090d16; border:1px solid #475569; border-radius:4px; padding:6px 12px; text-align:center;">
            <div style="font-size:8px; color:#94a3b8; text-transform:uppercase; font-weight:700;">BACKPACK</div>
            <div style="font-size:13px; font-weight:800; color:${invCount >= 28 ? '#ef4444' : '#38bdf8'};">🎒 ${invCount}/28 <span style="font-size:9px; color:#cbd5e1;">Slots</span></div>
          </div>
        </div>
      </div>

      <!-- Merchant Tabs to switch easily between Sanctuary market stands -->
      <div style="display:flex; gap:6px; border-bottom:1px solid #1e293b; padding-bottom:6px; flex-wrap:wrap;">
        ${Object.values(MERCHANT_CATALOGS).map((m) => {
          const isActive = m.id === cat.id;
          return `
            <button class="util-btn"
                    style="font-size:9.5px; padding:4px 10px; border-color:${isActive ? m.badgeColor : '#334155'}; color:${isActive ? '#fff' : '#94a3b8'}; background:${isActive ? 'rgba(30, 41, 59, 0.85)' : '#0d1527'}; font-weight:${isActive ? '800' : '600'};"
                    onclick="window.openMerchantShop('${m.id}')">
              ${m.icon} ${m.name.split(' ')[0]} (${m.title.split(' ')[0]})
            </button>
          `;
        }).join('')}
      </div>

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
                  🪙 ${w.price} <span style="font-size:8px; color:#94a3b8;">Gold</span>
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
                      BUY 5 (🪙 ${w.price * 5})
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
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
      window.spawnFCT(window.player.x, window.player.y - 14, `NOT ENOUGH GOLD (NEED 🪙 ${totalCost})!`, '#ef4444');
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

  // Sync to server if connected
  if (window.net?.connected) {
    window.net.send({
      type: 'buy_merchant_item',
      merchantId: cat.id,
      itemId,
      qty,
      unitPrice: ware.price,
    });
  }

  // Sound and visual feedback
  if (window.audio?.playPickup) window.audio.playPickup();
  if (window.audio?.playChime) window.audio.playChime();
  if (typeof window.spawnFCT === 'function' && window.player) {
    window.spawnFCT(window.player.x, window.player.y - 14, `+${qty}x ${item.name.toUpperCase()} (-🪙 ${totalCost})`, '#4ade80', true);
  }
  if (typeof window.logMessage === 'function') {
    window.logMessage(`🛒 Purchased ${qty}x ${item.name} from ${cat.name} for ${totalCost} Solar Gold.`, 'log-gain', 'combat');
  }

  // Award respective artisan profession XP & update quest inspection flags
  if (typeof window !== 'undefined') {
    if (window.questState) {
      if (cat.id === 'merchant_smith') window.questState.smithInspected = true;
      if (cat.id === 'merchant_apothecary') window.questState.apothecaryInspected = true;
      if (cat.id === 'merchant_provisions') window.questState.provisionsInspected = true;
      if (cat.id === 'merchant_relics') window.questState.relicsInspected = true;
      if (typeof window.saveQuestState === 'function') window.saveQuestState();
      if (typeof window.updateQuestTrackerHUD === 'function') window.updateQuestTrackerHUD();
    }
    if (typeof window.awardProfessionXP === 'function') {
      if (cat.id === 'merchant_smith') window.awardProfessionXP('relic_forging', 35, 'Smithing Craft');
      if (cat.id === 'merchant_apothecary') window.awardProfessionXP('rite_binding', 35, 'Alchemy & Draught Craft');
      if (cat.id === 'merchant_provisions') window.awardProfessionXP('glimmerweaving', 35, 'Provisions & Weaving');
      if (cat.id === 'merchant_relics') window.awardProfessionXP('resonance_extraction', 35, 'Relic Resonance');
    }
  }

  // Update UI
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
  window.renderMerchantModal = renderMerchantModal;
}
