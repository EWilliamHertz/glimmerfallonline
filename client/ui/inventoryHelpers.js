// ==========================================
// 28-Slot Backpack Inventory Modal & Currency/Item Stack Helpers
// ==========================================

import { EQUIPMENT_CATALOG, MYTHIC_DUNGEONS, BARROWS_SETS } from '../../shared/protocol.js';
import { getItemIconDataUrl } from '../itemSprites.js';

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
  if (item.keystone) {
    const dungeon = MYTHIC_DUNGEONS[item.keystone.dungeonId];
    lines.push(`<span style="color:#fb923c; font-weight:bold;">🗝️ Tier ${item.keystone.tier} Mythic Key — activate inside ${dungeon?.name || 'its faction crypt'}</span>`);
  }

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

export function getRarityColor(rarity = '') {
  if (rarity.includes('Skill Mastery')) return '#fde047';
  if (rarity.includes('Continental Set') || rarity.includes('Continental Relic') || rarity.includes('Ancient Set')) return '#facc15';
  if (rarity.includes('Mythic') || rarity.includes('Apex')) return '#f59e0b';
  if (rarity.includes('Epic')) return '#c084fc';
  if (rarity.includes('Rare')) return '#38bdf8';
  return '#94a3b8';
}

// ==========================================
// 2. CONTINENTAL 28-SLOT INVENTORY BACKPACK [B]
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

    <!-- 4x7 Continental Grid = 28 Slots -->
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
