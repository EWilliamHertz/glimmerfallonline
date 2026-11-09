// ==========================================
// Direct Player-to-Player Trading & Inspect Profile UI
// ==========================================

import { EQUIPMENT_CATALOG, FACTIONS_META, getEffectiveStats } from '../../shared/protocol.js';
import { getItemIconDataUrl } from '../itemSprites.js';
import { getRarityColor, getPlayerGold, countItemInBackpack, formatItemStatsHtml } from './inventoryHelpers.js';

export function renderTradeModal({ session, profile }) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('trade-modal-body');
  if (!container || !session) return;

  const yourOffer = session.yourOffer || { items: [], gold: 0, accepted: false };
  const partnerOffer = session.partnerOffer || { items: [], gold: 0, accepted: false };
  const bagItems = Array.isArray(profile?.inventory) ? profile.inventory : [];
  const playerGold = getPlayerGold(profile);

  // Subtitle info
  const subEl = document.getElementById('trade-modal-sub');
  if (subEl) {
    subEl.innerText = `Trading with ${partnerOffer.name || 'Partner'} • Dual-confirmation prevents trade modifications.`;
  }

  let warningHtml = '';
  if (session.modifiedBy) {
    warningHtml = `
      <div style="background:#451a03; border:1px solid #f59e0b; color:#fde047; font-size:9.5px; font-weight:bold; padding:6px 10px; border-radius:4px; margin-bottom:10px; text-align:center; animation:pulse 1s infinite alternate;">
        ⚠️ ${session.modifiedBy} modified the trade offer! Both acceptance locks have been reset.
      </div>
    `;
  }

  container.innerHTML = `
    ${warningHtml}

    <!-- Two-Sided Trade Arena Grid -->
    <div style="display:grid; grid-template-columns: 1fr 40px 1fr; gap:12px; align-items:start; margin-bottom:12px;">
      
      <!-- LEFT: YOUR OFFER -->
      <div style="background:#090f21; border:2px solid ${yourOffer.accepted ? '#22c55e' : '#38bdf8'}; border-radius:6px; padding:10px 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:6px; margin-bottom:8px;">
          <span style="font-family:var(--font-header); font-size:11px; font-weight:800; color:#7dd3fc;">
            YOUR OFFER (${yourOffer.items.length}/8 SLOTS)
          </span>
          <span style="font-size:9px; font-weight:bold; padding:2px 6px; border-radius:3px; background:${yourOffer.accepted ? '#14532d' : '#1e293b'}; color:${yourOffer.accepted ? '#4ade80' : '#94a3b8'}; border:1px solid ${yourOffer.accepted ? '#22c55e' : '#475569'};">
            ${yourOffer.accepted ? 'ACCEPTED ✓' : 'OFFERING...'}
          </span>
        </div>

        <!-- 8 Offer Slots Grid -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin-bottom:10px;">
          ${Array.from({ length: 8 }).map((_, i) => {
            const entry = yourOffer.items[i];
            const item = entry ? EQUIPMENT_CATALOG[entry.id] : null;
            if (!item) {
              return `
                <div style="border:1px dashed #334155; background:#050914; height:46px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#475569; font-size:8px;">
                  SLOT ${i + 1}
                </div>
              `;
            }
            const borderCol = getRarityColor(item.rarity);
            return `
              <div style="border:1.5px solid ${borderCol}; background:#080e1f; height:46px; border-radius:4px; padding:3px; display:flex; flex-direction:column; align-items:center; justify-content:space-between; cursor:pointer;"
                   onclick="window.removeTradeItem(${i})"
                   title="Click to remove from trade"
                   onmouseenter="window.setHoveredEquipment('${item.id}', 'trade', event)"
                   onmousemove="window.updateHoveredEquipmentPos(event)"
                   onmouseleave="window.clearHoveredEquipment()">
                <img class="pixel-art" src="${getItemIconDataUrl(item.id, 24)}" width="24" height="24" alt="${item.name}" />
                <span style="font-size:7.5px; color:#fde047; font-weight:bold;">${entry.qty > 1 ? `x${entry.qty}` : '1'} ✕</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Gold Offer Input -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:#060b18; border:1px solid #1e293b; padding:6px 10px; border-radius:4px; margin-bottom:10px;">
          <span style="font-size:9.5px; color:#cbd5e1;">🪙 Offer Sovereigns:</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <input id="trade-gold-input" type="number" min="0" max="${playerGold}" value="${yourOffer.gold || 0}"
                   onchange="window.setTradeGold(this.value)"
                   style="background:#090f21; border:1px solid #334155; color:#fde047; text-align:right; width:90px; padding:3px 6px; font-size:10px; font-weight:bold; border-radius:3px;" />
            <button class="id-mini-btn" style="padding:2px 6px; font-size:8px;" onclick="window.setTradeGold(${playerGold})">MAX</button>
          </div>
        </div>

        <!-- Acceptance Action -->
        <button class="util-btn"
                style="width:100%; padding:6px; font-size:10px; font-weight:bold; border-color:${yourOffer.accepted ? '#22c55e' : '#38bdf8'}; color:${yourOffer.accepted ? '#86efac' : '#ffffff'}; background:${yourOffer.accepted ? '#14532d' : '#0284c7'};"
                onclick="window.acceptTradeOffer()"
                ${yourOffer.accepted ? 'disabled' : ''}>
          ${yourOffer.accepted ? '✓ ACCEPTED (WAITING FOR PARTNER)' : '🤝 ACCEPT TRADE OFFER ▸'}
        </button>
      </div>

      <!-- CENTER: SWAP SYMBOL -->
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding-top:80px;">
        <span style="font-size:24px; color:#64748b;">⇄</span>
      </div>

      <!-- RIGHT: PARTNER'S OFFER -->
      <div style="background:#090f21; border:2px solid ${partnerOffer.accepted ? '#22c55e' : '#f59e0b'}; border-radius:6px; padding:10px 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:6px; margin-bottom:8px;">
          <span style="font-family:var(--font-header); font-size:11px; font-weight:800; color:#fde047;">
            ${partnerOffer.name ? partnerOffer.name.toUpperCase() : 'PARTNER'}'S OFFER
          </span>
          <span style="font-size:9px; font-weight:bold; padding:2px 6px; border-radius:3px; background:${partnerOffer.accepted ? '#14532d' : '#1e293b'}; color:${partnerOffer.accepted ? '#4ade80' : '#fde047'}; border:1px solid ${partnerOffer.accepted ? '#22c55e' : '#475569'};">
            ${partnerOffer.accepted ? 'ACCEPTED ✓' : 'CONSIDERING...'}
          </span>
        </div>

        <!-- 8 Partner Slots Grid -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin-bottom:10px;">
          ${Array.from({ length: 8 }).map((_, i) => {
            const entry = partnerOffer.items[i];
            const item = entry ? EQUIPMENT_CATALOG[entry.id] : null;
            if (!item) {
              return `
                <div style="border:1px dashed #334155; background:#050914; height:46px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#475569; font-size:8px;">
                  SLOT ${i + 1}
                </div>
              `;
            }
            const borderCol = getRarityColor(item.rarity);
            return `
              <div style="border:1.5px solid ${borderCol}; background:#080e1f; height:46px; border-radius:4px; padding:3px; display:flex; flex-direction:column; align-items:center; justify-content:space-between;"
                   onmouseenter="window.setHoveredEquipment('${item.id}', 'trade', event)"
                   onmousemove="window.updateHoveredEquipmentPos(event)"
                   onmouseleave="window.clearHoveredEquipment()">
                <img class="pixel-art" src="${getItemIconDataUrl(item.id, 24)}" width="24" height="24" alt="${item.name}" />
                <span style="font-size:7.5px; color:#93c5fd; font-weight:bold;">${entry.qty > 1 ? `x${entry.qty}` : '1'}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Partner Gold Offer -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:#060b18; border:1px solid #1e293b; padding:8px 10px; border-radius:4px; margin-bottom:10px;">
          <span style="font-size:9.5px; color:#cbd5e1;">🪙 Sovereigns Offered:</span>
          <span style="color:#fde047; font-weight:bold; font-size:11px;">${(partnerOffer.gold || 0).toLocaleString()} 🪙</span>
        </div>

        <!-- Partner Status Box -->
        <div style="background:#060a16; border:1px solid #1e293b; padding:7px 10px; border-radius:4px; text-align:center; font-size:9px; color:${partnerOffer.accepted ? '#4ade80' : '#94a3b8'};">
          ${partnerOffer.accepted ? '✓ Partner has locked in their offer' : 'Waiting for partner to finalize offer...'}
        </div>
      </div>
    </div>

    <!-- BOTTOM DRAWER: YOUR BACKPACK ITEMS TO OFFER -->
    <div style="background:#070b18; border:1px solid #1e293b; border-radius:5px; padding:10px 12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:9.5px; font-weight:bold; color:#cbd5e1;">
          🎒 CLICK ITEM IN BACKPACK TO ADD TO TRADE OFFER:
        </span>
        <button class="id-mini-btn" style="padding:3px 8px; border-color:#ef4444; color:#fca5a5;" onclick="window.cancelActiveTrade()">
          ✕ CANCEL TRADE
        </button>
      </div>

      <div style="display:grid; grid-template-columns: repeat(14, 1fr); gap:4px; max-height:100px; overflow-y:auto;">
        ${bagItems.map((it, idx) => {
          if (!it) return '';
          const itId = typeof it === 'string' ? it : it.id;
          const qty = typeof it === 'object' && it.qty ? it.qty : 1;
          const item = EQUIPMENT_CATALOG[itId];
          if (!item || itId === 'solar_gold') return '';
          const borderCol = getRarityColor(item.rarity);

          return `
            <div style="border:1px solid ${borderCol}; background:#080e1f; width:34px; height:34px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative;"
                 onclick="window.addBackpackItemToTrade('${itId}')"
                 title="Click to add ${item.name} to trade"
                 onmouseenter="window.setHoveredEquipment('${item.id}', 'inventory', event)"
                 onmousemove="window.updateHoveredEquipmentPos(event)"
                 onmouseleave="window.clearHoveredEquipment()">
              <img class="pixel-art" src="${getItemIconDataUrl(item.id, 20)}" width="20" height="20" alt="${item.name}" />
              ${qty > 1 ? `<span style="position:absolute; bottom:1px; right:2px; font-size:7px; color:#fde047; font-weight:bold; text-shadow:0 1px 2px black;">${qty}</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderInspectModal({ targetData }) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('inspect-modal-body');
  if (!container || !targetData) return;

  const fMeta = FACTIONS_META[targetData.faction] || FACTIONS_META.Solari;
  const equip = targetData.equipment || {};
  const stats = targetData.stats || {};
  const prog = targetData.professions || {};
  const paragon = targetData.paragon || {};

  const subEl = document.getElementById('inspect-modal-sub');
  if (subEl) {
    subEl.innerText = `${targetData.faction} ${targetData.className || targetData.classId} • Paragon Rank ${paragon.rank || 0}`;
  }

  // Equipment slots catalog mapping
  const SLOTS = [
    { key: 'head', label: 'HELM' },
    { key: 'neck', label: 'AMULET' },
    { key: 'cape', label: 'CLOAK' },
    { key: 'ammo', label: 'QUIVER' },
    { key: 'weapon', label: 'WEAPON' },
    { key: 'body', label: 'ARMOR' },
    { key: 'shield', label: 'OFFHAND' },
    { key: 'hands', label: 'GLOVES' },
    { key: 'legs', label: 'LEGS' },
    { key: 'feet', label: 'BOOTS' },
    { key: 'ring', label: 'RING' },
    { key: 'rune1', label: 'RUNE I' },
    { key: 'rune2', label: 'RUNE II' },
    { key: 'rune3', label: 'RUNE III' },
  ];

  const professionsList = [
    { id: 'resonance_extraction', name: 'Resonance Extraction', icon: '⛏️' },
    { id: 'relic_forging', name: 'Relic-Forging', icon: '⚒️' },
    { id: 'rite_binding', name: 'Rite-Binding', icon: '⚗️' },
    { id: 'glimmerweaving', name: 'Glimmerweaving', icon: '🧵' },
    { id: 'combat_mastery', name: 'Combat Mastery', icon: '⚔️' },
  ];

  container.innerHTML = `
    <!-- Top Identity Header Banner -->
    <div style="display:flex; justify-content:space-between; align-items:center; background:#070d1e; border:2px solid ${fMeta.color || '#38bdf8'}; border-radius:6px; padding:10px 14px; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="font-size:28px;">${fMeta.icon || '☀️'}</div>
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-family:var(--font-header); font-size:13px; font-weight:800; color:#f8fafc;">
              ${targetData.name}
            </span>
            ${targetData.orderTag ? `
              <span style="font-size:8.5px; font-weight:bold; background:${targetData.orderColor || '#facc15'}22; color:${targetData.orderColor || '#facc15'}; border:1px solid ${targetData.orderColor || '#facc15'}; padding:1px 5px; border-radius:3px;">
                &lt;${targetData.orderTag}&gt;
              </span>
            ` : ''}
          </div>
          <div style="color:#cbd5e1; font-size:9.5px; margin-top:2px;">
            <b style="color:${fMeta.color};">Lv. ${targetData.level} ${targetData.className || targetData.classId}</b> • ${targetData.faction} Alliance
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="color:#fde047; font-weight:bold; font-size:10.5px;">🌟 PARAGON RANK ${paragon.rank || 0}</div>
        <div style="color:#94a3b8; font-size:8.5px; margin-top:2px;">${paragon.affinity ? `Affinity: ${paragon.affinity}` : 'Unattuned'}</div>
      </div>
    </div>

    <!-- Main Grid: Left Paperdoll Gear Grid, Right Stats & Skills -->
    <div style="display:grid; grid-template-columns: 280px 1fr; gap:14px; align-items:start;">
      
      <!-- LEFT: EQUIPPED PAPERDOLL GEAR -->
      <div style="background:#080e1f; border:1px solid #1e293b; border-radius:6px; padding:10px;">
        <div style="font-family:var(--font-header); font-size:10px; font-weight:bold; color:#7dd3fc; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:4px;">
          EQUIPPED GEAR &amp; RUNES
        </div>

        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px;">
          ${SLOTS.map((s) => {
            const itId = equip[s.key];
            const item = itId ? EQUIPMENT_CATALOG[itId] : null;
            if (!item) {
              return `
                <div style="background:#050914; border:1px dashed #334155; border-radius:4px; padding:6px; display:flex; align-items:center; gap:6px; min-height:38px;">
                  <span style="font-size:8px; color:#475569; font-weight:bold;">${s.label}</span>
                </div>
              `;
            }

            const borderCol = getRarityColor(item.rarity);
            return `
              <div style="background:#060a16; border:1.5px solid ${borderCol}; border-radius:4px; padding:4px 6px; display:flex; align-items:center; gap:6px; min-height:38px; cursor:help;"
                   onmouseenter="window.setHoveredEquipment('${item.id}', 'inspect', event)"
                   onmousemove="window.updateHoveredEquipmentPos(event)"
                   onmouseleave="window.clearHoveredEquipment()">
                <img class="pixel-art" src="${getItemIconDataUrl(item.id, 24)}" width="24" height="24" alt="${item.name}" />
                <div style="line-height:1.2; overflow:hidden;">
                  <b style="color:#f8fafc; font-size:8.5px; display:block; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;" title="${item.name}">${item.name}</b>
                  <span style="color:${borderCol}; font-size:7px;">${s.label}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- RIGHT: ATTRIBUTES & PROFESSION PROGRESSION -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        
        <!-- Combat Attributes Panel -->
        <div style="background:#080e1f; border:1px solid #1e293b; border-radius:6px; padding:10px;">
          <div style="font-family:var(--font-header); font-size:10px; font-weight:bold; color:#fde047; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:4px;">
            COMBAT ATTRIBUTES
          </div>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; font-size:9.5px;">
            <div style="color:#cbd5e1;">⚔️ Power: <b style="color:#fde047;">${stats.power || 0}</b></div>
            <div style="color:#cbd5e1;">🛡️ Bastion: <b style="color:#4ade80;">${stats.bastion || 0}</b></div>
            <div style="color:#cbd5e1;">🔮 Resonance: <b style="color:#38bdf8;">${stats.resonance || 0}</b></div>
            <div style="color:#cbd5e1;">⚡ Tempo: <b style="color:#c084fc;">${stats.tempo || 0}</b></div>
            <div style="color:#cbd5e1;">❤️ Max Health: <b style="color:#f87171;">${stats.maxHp || 100}</b></div>
            <div style="color:#cbd5e1;">✨ Max Glimmer: <b style="color:#fde047;">${stats.maxGlimmer || 100}</b></div>
            <div style="color:#cbd5e1;">🎯 Critical Rate: <b style="color:#fbbf24;">${Math.round((stats.critChance || 0.05) * 100)}%</b></div>
          </div>
        </div>

        <!-- 5 Profession Masteries -->
        <div style="background:#080e1f; border:1px solid #1e293b; border-radius:6px; padding:10px;">
          <div style="font-family:var(--font-header); font-size:10px; font-weight:bold; color:#4ade80; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:4px;">
            PROFESSION MASTERIES (LV. 1 - 99)
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            ${professionsList.map((p) => {
              const data = prog[p.id] || { level: 1, xp: 0 };
              const lvl = data.level || 1;
              return `
                <div style="background:#060a16; border:1px solid #1e293b; border-radius:4px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:9px; color:#cbd5e1;">
                    ${p.icon} <b>${p.name}</b>
                  </span>
                  <span style="font-size:9px; font-weight:bold; color:${lvl >= 99 ? '#facc15' : '#4ade80'};">
                    Lv. ${lvl} / 99
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}
