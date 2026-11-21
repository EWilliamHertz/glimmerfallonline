// ==========================================
// 28-Slot Backpack Inventory Modal & Currency/Item Stack Helpers
// ==========================================

import { EQUIPMENT_CATALOG, MYTHIC_DUNGEONS, CANONICAL_SETS, isGearSalvageable } from '../../shared/protocol.js';
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
  if (item.temperTargetMax) {
    lines.push(`<span style="color:#fbbf24; font-weight:bold;">🔨 Tempers gear (+${item.temperMinRank || 0} → up to +${item.temperTargetMax})</span>`);
  }
  if (item.weaponImbue) {
    const im = item.weaponImbue;
    const imStats = [
      im.power ? `+${im.power} Power` : '',
      im.resonance ? `+${im.resonance} Res` : '',
      im.tempo ? `+${im.tempo} Tempo` : '',
      im.critPct ? `+${Math.round(im.critPct * 100)}% Crit` : '',
      im.critLeechPct ? `${Math.round(im.critLeechPct * 100)}% Crit Leech` : '',
    ].filter(Boolean).join(', ');
    lines.push(`<span style="color:${im.color || '#facc15'}; font-weight:bold;">🗡️ Imbue (${Math.round((im.durationSec || 600) / 60)}m): ${imStats}</span>`);
  }
  if (item.wellFed) {
    const wf = item.wellFed;
    const wfStats = [
      wf.power ? `+${wf.power} Power` : '',
      wf.bastion ? `+${wf.bastion} Bastion` : '',
      wf.resonance ? `+${wf.resonance} Res` : '',
    ].filter(Boolean).join(', ');
    lines.push(`<span style="color:${wf.color || '#fde047'}; font-weight:bold;">🍲 Well-Fed (${Math.round((wf.durationSec || 600) / 60)}m): ${wfStats}</span>`);
  }
  if (item.keystone) {
    const dungeon = MYTHIC_DUNGEONS[item.keystone.dungeonId];
    lines.push(`<span style="color:#fb923c; font-weight:bold;">🗝️ Tier ${item.keystone.tier} Mythic Key — activate inside ${dungeon?.name || 'its faction crypt'}</span>`);
  }

  let setHtml = '';
  if (showSet && item.set && CANONICAL_SETS[item.set]) {
    const s = CANONICAL_SETS[item.set];
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

export function getRarityRank(rarity = '') {
  const r = String(rarity || '');
  if (r.includes('Skill Mastery') || r.includes('Continental Set') || r.includes('Continental Relic') || r.includes('Ancient Set')) return 7;
  if (r.includes('Mythic') || r.includes('Apex')) return 6;
  if (r.includes('Legendary')) return 5;
  if (r.includes('Epic')) return 4;
  if (r.includes('Rare') || r.includes('Caldera Relic') || r.includes('Relic') || r.includes('Awakened')) return 3;
  if (r.includes('Uncommon')) return 2;
  return 1;
}

export function getRarityColor(rarity = '') {
  const r = String(rarity || '');
  if (r.includes('Skill Mastery') || r.includes('Continental Set') || r.includes('Continental Relic') || r.includes('Ancient Set')) return '#fde047';
  if (r.includes('Mythic') || r.includes('Apex')) return '#f59e0b';
  if (r.includes('Legendary')) return '#fb923c';
  if (r.includes('Epic')) return '#c084fc';
  if (r.includes('Rare')) return '#38bdf8';
  if (r.includes('Caldera Relic') || r.includes('Solari Relic') || r.includes('Aether Relic') || r.includes('Umbri Relic') || r.includes('Terra Relic') || r.includes('Awakened')) return '#2dd4bf';
  if (r.includes('Uncommon')) return '#4ade80';
  if (r.includes('Elemental Currency') || r.includes('Aether Currency')) return '#67e8f9';
  if (r.includes('Terra Currency')) return '#4ade80';
  if (r.includes('Umbri Currency')) return '#a78bfa';
  if (r.includes('Common Currency')) return '#facc15';
  return '#94a3b8';
}

// ==========================================
// 2. CONTINENTAL 28-SLOT INVENTORY BACKPACK [B]
// ==========================================
let currentInvTab = 'all';
let salvageModeActive = false;

if (typeof window !== 'undefined') {
  window.setInventoryFilterTab = function (tab) {
    currentInvTab = tab || 'all';
    if (typeof window.renderInventoryModal === 'function' && window.localProfile) {
      window.renderInventoryModal({ profile: window.localProfile });
    }
  };
  window.toggleInventorySalvageMode = function () {
    salvageModeActive = !salvageModeActive;
    if (typeof window.renderInventoryModal === 'function' && window.localProfile) {
      window.renderInventoryModal({ profile: window.localProfile });
    }
  };
  window.isInventorySalvageMode = () => salvageModeActive;
}

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

  const goldTotal = getPlayerGold(profile);
  const pct = Math.min(100, Math.round((inv.length / capacity) * 100));
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'gear', label: 'Gear' },
    { id: 'consumable', label: 'Potions' },
    { id: 'material', label: 'Materials' },
    { id: 'gem', label: 'Gems/Runes' },
  ];

  const matchesTab = (item) => {
    if (!item || currentInvTab === 'all') return true;
    if (currentInvTab === 'gear') return !['currency', 'consumable', 'material', 'socket_gem', 'keystone'].includes(item.slot);
    if (currentInvTab === 'consumable') return item.slot === 'consumable';
    if (currentInvTab === 'material') return item.slot === 'material';
    if (currentInvTab === 'gem') return item.slot === 'socket_gem' || item.slot === 'keystone' || item.slot === 'currency';
    return true;
  };

  container.innerHTML = `
    <div style="background:#0c0a09; border:1px solid #44403c; border-radius:4px; padding:7px 9px; margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px;">
        <span style="color:#fde047; font-family:var(--font-header);">
          🎒 BACKPACK: <b style="color:${inv.length >= 28 ? '#ef4444' : '#4ade80'};">${inv.length} / ${capacity}</b>
        </span>
        <span style="color:#fde047; font-weight:700;">🪙 ${goldTotal.toLocaleString()} Solar Gold</span>
      </div>
      <div style="height:4px; background:#1c1917; border-radius:2px; overflow:hidden; margin-top:5px;">
        <div style="height:100%; width:${pct}%; background:${inv.length >= 26 ? '#ef4444' : inv.length >= 20 ? '#f59e0b' : '#4ade80'};"></div>
      </div>
      <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-top:7px;">
        <div style="display:flex; gap:4px; flex-wrap:wrap;">
          ${tabs.map((t) => `
            <button type="button" class="id-mini-btn"
                    style="font-size:8px; padding:2px 7px; border-color:${currentInvTab === t.id ? '#fde047' : '#334155'}; color:${currentInvTab === t.id ? '#fde047' : '#94a3b8'}; background:${currentInvTab === t.id ? '#1c1917' : 'transparent'};"
                    onclick="window.setInventoryFilterTab && window.setInventoryFilterTab('${t.id}')">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <button type="button" class="id-mini-btn"
                title="Toggle Salvage Mode to dismantle unwanted gear into Dust, Bars & Gold"
                style="font-size:8px; padding:2px 8px; border-color:${salvageModeActive ? '#fb923c' : '#475569'}; color:${salvageModeActive ? '#ffedd5' : '#cbd5e1'}; background:${salvageModeActive ? '#7c2d12' : '#1e293b'}; font-weight:700;"
                onclick="window.toggleInventorySalvageMode && window.toggleInventorySalvageMode()">
          ${salvageModeActive ? '🔨 SALVAGE: ON' : '🔨 Salvage Gear'}
        </button>
      </div>
    </div>

    <div style="color:${salvageModeActive ? '#fdba74' : '#94a3b8'}; font-size:8px; margin-bottom:6px; text-align:center; font-weight:${salvageModeActive ? '700' : '400'};">
      ${salvageModeActive
        ? '🔨 SALVAGE MODE ACTIVE — Click any highlighted gear piece to dismantle it into materials & Gold!'
        : 'Left-Click to Equip/Use • Drag to Action Bar • Right-Click to Drop'}
    </div>

    <!-- 4x7 Continental Grid = 28 Slots -->
    <div class="rs-inv-grid">
      ${Array.from({ length: capacity }).map((_, i) => {
        const itemObj = inv[i];
        const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id;
        const item = itemId ? EQUIPMENT_CATALOG[itemId] : null;
        const visible = item && matchesTab(item);

        if (item && visible) {
          const canSalvage = isGearSalvageable(item.id);
          const borderCol = salvageModeActive ? (canSalvage ? '#fb923c' : '#334155') : getRarityColor(item.rarity);
          const clickFn = salvageModeActive
            ? (canSalvage ? `window.salvageInventorySlot && window.salvageInventorySlot(${i})` : '')
            : `window.equipInventorySlot(${i})`;
          const dimStyle = salvageModeActive && !canSalvage ? 'opacity:0.35; cursor:not-allowed;' : `cursor:${salvageModeActive ? 'crosshair' : 'grab'};`;
          return `
            <div class="rs-inv-slot"
                 style="border-color:${borderCol}; ${dimStyle}"
                 draggable="${salvageModeActive ? 'false' : 'true'}"
                 ondragstart="window.beginActionDrag(event, 'item', '${item.id}')"
                 onclick="${clickFn}"
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
          <div class="rs-inv-slot empty" style="${item && !visible ? 'opacity:0.25;' : ''}">
            <span style="color:#44403c; font-size:9px; font-family:var(--font-header);">${i + 1}</span>
          </div>
        `;
      }).join('')}
    </div>

    <div style="display:flex; justify-content:space-between; gap:8px; margin-top:12px;">
      <button class="util-btn" style="flex:1; border-color:#fb923c; color:#fed7aa;" onclick="document.getElementById('gearbag-modal')?.style.display === 'block' && window.switchGearBagPane ? window.switchGearBagPane(window.innerWidth < 860 ? 'equip' : 'both') : toggleModal('equipment-modal')">
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
