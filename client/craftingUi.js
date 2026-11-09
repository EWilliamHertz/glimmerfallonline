// ==========================================
// GlimmerFall Online 2D — Cosmic Artisan Stations & Sanctuary Bounty Board UI
// Interactive Artisan Smelting, Smithing, Rite-Binding, Glimmerweaving & Bounties
// ==========================================

import {
  CRAFTING_STATIONS,
  CRAFTING_RECIPES,
  EQUIPMENT_CATALOG,
  PROFESSIONS_CATALOG,
  BOUNTY_CONTRACTS,
  getProfessionLevelFromXp,
  getXpForProfessionLevel,
} from '../shared/protocol.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { getRarityColor, formatItemStatsHtml } from './equipmentUi.js';

let activeStationId = 'cosmic_anvil';
let activeCategory = 'all';
let selectedRecipeId = 'smelt_bronze_bar';
let craftQueueTimer = null;
let craftQueueRemaining = 0;
let craftQueueRecipeId = null;

function getInventoryItemQty(inv, itemId) {
  if (!Array.isArray(inv)) return 0;
  let total = 0;
  for (const slot of inv) {
    const id = typeof slot === 'string' ? slot : slot?.id;
    if (id === itemId) {
      total += typeof slot === 'object' && slot?.qty ? Math.max(1, Number(slot.qty) || 1) : 1;
    }
  }
  return total;
}

export function getMaxCraftableCount(recipe, inv, profLevel) {
  if (!recipe) return 0;
  if ((profLevel || 1) < (recipe.reqLevel || 1)) return 0;
  let maxBatch = 999;
  for (const ing of recipe.ingredients || []) {
    const have = getInventoryItemQty(inv, ing.id);
    const possible = Math.floor(have / Math.max(1, ing.qty || 1));
    if (possible < maxBatch) maxBatch = possible;
  }
  if (maxBatch <= 0 || maxBatch === 999) return 0;
  return maxBatch;
}

export function stopCraftingQueue() {
  if (craftQueueTimer) {
    clearInterval(craftQueueTimer);
    craftQueueTimer = null;
  }
  craftQueueRemaining = 0;
  craftQueueRecipeId = null;
}

export function startCraftingBatch(recipeId, count = 1) {
  stopCraftingQueue();
  const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return;

  const stepCraft = () => {
    if (typeof window.performCraftRecipe !== 'function') {
      stopCraftingQueue();
      return;
    }
    const ok = window.performCraftRecipe(recipe.id);
    if (!ok) {
      stopCraftingQueue();
      renderCraftingModal();
      return;
    }
    craftQueueRemaining = Math.max(0, craftQueueRemaining - 1);
    if (craftQueueRemaining <= 0) {
      stopCraftingQueue();
    }
    renderCraftingModal();
  };

  craftQueueRecipeId = recipe.id;
  craftQueueRemaining = Math.max(1, Math.min(28, Math.floor(Number(count) || 1)));
  // Perform the first craft immediately if off cooldown, then tick every 1250ms (1.25s authoritative cadence)
  stepCraft();
  if (craftQueueRemaining > 0) {
    craftQueueTimer = setInterval(() => {
      const modal = document.getElementById('crafting-modal');
      if (!modal || modal.style.display === 'none') {
        stopCraftingQueue();
        return;
      }
      stepCraft();
    }, 1250);
  }
}

export function selectCraftingStation(stationId, category = 'all') {
  if (!CRAFTING_STATIONS[stationId]) return;
  stopCraftingQueue();
  activeStationId = stationId;
  activeCategory = category;
  const stationRecipes = CRAFTING_RECIPES.filter((r) => r.station === activeStationId);
  if (!stationRecipes.some((r) => r.id === selectedRecipeId)) {
    selectedRecipeId = stationRecipes[0]?.id || null;
  }
  renderCraftingModal();
}

export function selectCraftingCategory(catId) {
  activeCategory = catId || 'all';
  const visible = CRAFTING_RECIPES.filter(
    (r) => r.station === activeStationId && (activeCategory === 'all' || r.category === activeCategory)
  );
  if (visible.length > 0 && !visible.some((r) => r.id === selectedRecipeId)) {
    selectedRecipeId = visible[0].id;
  }
  renderCraftingModal();
}

export function selectCraftingRecipe(recipeId) {
  selectedRecipeId = recipeId;
  renderCraftingModal();
}

export function renderCraftingModal(stationOverride = null) {
  if (stationOverride && CRAFTING_STATIONS[stationOverride] && stationOverride !== activeStationId) {
    activeStationId = stationOverride;
    activeCategory = 'all';
    const first = CRAFTING_RECIPES.find((r) => r.station === activeStationId);
    if (first) selectedRecipeId = first.id;
  }

  const modal = document.getElementById('crafting-modal');
  const body = document.getElementById('crafting-modal-body');
  const titleEl = document.getElementById('crafting-modal-title');
  const subEl = document.getElementById('crafting-modal-subtitle');
  if (!modal || !body) return;

  const station = CRAFTING_STATIONS[activeStationId] || CRAFTING_STATIONS.cosmic_anvil;
  const profMeta = PROFESSIONS_CATALOG[station.professionId] || PROFESSIONS_CATALOG.relic_forging;
  if (titleEl) {
    titleEl.innerHTML = `${station.icon} ${station.name.toUpperCase()}`;
    titleEl.style.color = station.color;
  }
  if (subEl) {
    subEl.textContent = station.subtitle;
  }

  const profile = window.localProfile || {};
  const inv = Array.isArray(profile.inventory) ? profile.inventory : [];
  const prog = window.getLocalProgression ? window.getLocalProgression() : (profile.progression || {});
  const profState = prog?.professions?.[station.professionId] || { xp: 0, level: 1 };
  const xp = Math.max(0, Math.floor(Number(profState.xp) || 0));
  const lvl = Math.max(profState.level || 1, getProfessionLevelFromXp(xp));
  const curFloor = getXpForProfessionLevel(lvl);
  const nextCeil = lvl >= 99 ? curFloor : getXpForProfessionLevel(lvl + 1);
  const pct = lvl >= 99 ? 100 : Math.max(0, Math.min(100, Math.round(((xp - curFloor) / Math.max(1, nextCeil - curFloor)) * 100)));

  const recipes = CRAFTING_RECIPES.filter(
    (r) => r.station === station.id && (activeCategory === 'all' || r.category === activeCategory)
  );
  if (recipes.length > 0 && !recipes.some((r) => r.id === selectedRecipeId)) {
    selectedRecipeId = recipes[0].id;
  }
  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0] || null;
  const selectedItem = selectedRecipe ? EQUIPMENT_CATALOG[selectedRecipe.outputId] : null;
  const maxMake = selectedRecipe ? getMaxCraftableCount(selectedRecipe, inv, lvl) : 0;
  const isQueueActive = craftQueueRemaining > 0 && craftQueueRecipeId === selectedRecipe?.id;

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; font-family:var(--font-body); color:#e2e8f0;">
      <!-- Live Skill Progress Bar -->
      <div style="background:#090d18; border:1px solid ${station.color}; border-left:4px solid ${station.color}; border-radius:5px; padding:8px 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="font-size:11px; font-weight:800; color:${station.color}; font-family:var(--font-header);">
            ${profMeta.icon} ${profMeta.name.toUpperCase()} — LEVEL ${lvl} / 99
          </div>
          <div style="font-size:9.5px; color:#cbd5e1;">
            <b>${xp.toLocaleString()} XP</b> • ${lvl >= 99 ? '<span style="color:#fde047;">★ 99 MASTERY CAPE UNLOCKED!</span>' : `${(nextCeil - xp).toLocaleString()} XP to Lv. ${lvl + 1}`}
          </div>
        </div>
        <div style="margin-top:5px; height:7px; background:#050811; border:1px solid #1e293b; border-radius:3px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${station.color}; transition:width 0.2s;"></div>
        </div>
      </div>

      <!-- Category Filter Pills & Backpack Counter -->
      <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
        ${station.categories.map((cat) => {
          const isCat = activeCategory === cat.id;
          return `
            <button class="id-mini-btn"
                    style="padding:4px 10px; font-size:9px; border-color:${isCat ? station.color : '#334155'}; color:${isCat ? '#fde047' : '#cbd5e1'}; background:${isCat ? '#1e293b' : '#0b1120'}; font-weight:${isCat ? '800' : '600'};"
                    onclick="window.selectCraftingCategory('${cat.id}')">
              ${cat.label}
            </button>
          `;
        }).join('')}
        <div style="margin-left:auto; display:flex; align-items:center; gap:8px; font-size:9.5px; color:#94a3b8;">
          <span>🎒 Backpack: <b style="color:${inv.length >= 28 ? '#ef4444' : '#38bdf8'};">${inv.length}/28</b></span>
        </div>
      </div>

      <!-- Two-Column Split: Recipe Grid (Left) + Selected Recipe Anvil Inspector (Right) -->
      <div style="display:grid; grid-template-columns: 1.35fr 1fr; gap:12px; align-items:start;">
        <!-- LEFT: Artisan Recipe Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(195px, 1fr)); gap:8px; max-height:46vh; overflow-y:auto; padding-right:4px;">
          ${recipes.map((r) => {
            const outItem = EQUIPMENT_CATALOG[r.outputId];
            if (!outItem) return '';
            const rCol = getRarityColor(outItem.rarity);
            const unlocked = lvl >= r.reqLevel;
            const craftable = getMaxCraftableCount(r, inv, lvl);
            const isSel = selectedRecipe?.id === r.id;
            return `
              <div onclick="window.selectCraftingRecipe('${r.id}')"
                   style="cursor:pointer; background:${isSel ? 'rgba(30,41,59,0.95)' : '#0b1222'}; border:1.5px solid ${isSel ? station.color : (craftable > 0 ? '#22c55e' : '#1e293b')}; border-left:3px solid ${rCol}; border-radius:4px; padding:8px; opacity:${unlocked ? '1' : '0.68'}; transition:border-color 0.12s;">
                <div style="display:flex; gap:8px; align-items:center;">
                  <div style="width:34px; height:34px; background:#050811; border:1px solid ${rCol}; border-radius:4px; display:flex; align-items:center; justify-content:center; position:relative; flex-shrink:0;">
                    <img class="pixel-art" src="${getItemIconDataUrl(outItem.id, 24)}" width="24" height="24" style="image-rendering:pixelated;" alt="${outItem.name}" />
                    ${r.outputQty > 1 ? `<span style="position:absolute; bottom:1px; right:2px; font-size:7.5px; font-weight:800; color:#fde047;">×${r.outputQty}</span>` : ''}
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:10px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${outItem.name}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px; font-size:8.5px;">
                      <span style="color:${unlocked ? '#4ade80' : '#f87171'}; font-weight:700;">
                        ${unlocked ? `Lv. ${r.reqLevel}` : `🔒 Lv. ${r.reqLevel}`}
                      </span>
                      <span style="color:${station.color}; font-weight:700;">+${r.xp} XP</span>
                    </div>
                    <div style="font-size:8px; margin-top:2px; color:${craftable > 0 ? '#86efac' : '#64748b'}; font-weight:${craftable > 0 ? '700' : '500'};">
                      ${craftable > 0 ? `✓ Ready (×${craftable})` : (unlocked ? 'Need materials' : `Requires Lv. ${r.reqLevel}`)}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- RIGHT: Selected Recipe Inspector & Craft Controls -->
        <div style="background:#090d1a; border:1.5px solid ${station.color}; border-radius:5px; padding:12px;">
          ${selectedRecipe && selectedItem ? `
            <div style="display:flex; gap:10px; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:8px;">
              <img class="pixel-art" src="${getItemIconDataUrl(selectedItem.id, 32)}" width="36" height="36" style="image-rendering:pixelated; background:#050811; border:1.5px solid ${getRarityColor(selectedItem.rarity)}; border-radius:4px; padding:3px;" alt="${selectedItem.name}" />
              <div style="flex:1;">
                <div style="font-size:11.5px; font-weight:800; color:#fde047; font-family:var(--font-header);">
                  ${selectedItem.name} ${selectedRecipe.outputQty > 1 ? `(×${selectedRecipe.outputQty})` : ''}
                </div>
                <div style="font-size:8.5px; color:${getRarityColor(selectedItem.rarity)}; font-weight:700;">
                  ${selectedItem.rarity || 'Common'} • Req. Lv. ${selectedRecipe.reqLevel} ${profMeta.name} • +${selectedRecipe.xp} XP
                </div>
              </div>
            </div>

            ${formatItemStatsHtml(selectedItem, false) ? `
              <div style="margin-top:6px;">
                ${formatItemStatsHtml(selectedItem, false)}
              </div>
            ` : ''}

            <div style="font-size:9px; color:#94a3b8; margin-top:5px; line-height:1.35;">
              ${selectedItem.desc || ''}
            </div>

            <!-- Ingredients Checklist -->
            <div style="margin-top:10px; border-top:1px solid #1e293b; padding-top:8px;">
              <div style="font-size:9px; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                Required Materials (In Backpack)
              </div>
              <div style="display:flex; flex-direction:column; gap:5px;">
                ${selectedRecipe.ingredients.map((ing) => {
                  const ingItem = EQUIPMENT_CATALOG[ing.id];
                  const have = getInventoryItemQty(inv, ing.id);
                  const ok = have >= ing.qty;
                  return `
                    <div style="display:flex; align-items:center; justify-content:space-between; background:#050811; border:1px solid ${ok ? '#15803d' : '#334155'}; border-radius:3px; padding:4px 8px; font-size:9.5px;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <img class="pixel-art" src="${getItemIconDataUrl(ing.id, 24)}" width="18" height="18" style="image-rendering:pixelated;" alt="${ingItem?.name || ing.id}" />
                        <span style="color:${ok ? '#e2e8f0' : '#94a3b8'}; font-weight:600;">${ingItem?.name || ing.id}</span>
                      </div>
                      <span style="font-weight:800; color:${ok ? '#4ade80' : '#f87171'};">
                        ${have} / ${ing.qty} ${ok ? '✓' : '✗'}
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Craft Batch Buttons -->
            <div style="margin-top:12px; display:flex; flex-direction:column; gap:6px;">
              ${lvl < selectedRecipe.reqLevel ? `
                <div style="background:rgba(127,29,29,0.35); border:1px solid #ef4444; color:#fca5a5; font-size:9.5px; font-weight:700; padding:7px; border-radius:4px; text-align:center;">
                  🔒 Requires Level ${selectedRecipe.reqLevel} ${profMeta.name} (You are Lv. ${lvl})
                </div>
              ` : isQueueActive ? `
                <div style="background:#1e293b; border:1px solid ${station.color}; border-radius:4px; padding:7px 10px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:9.5px; color:#fde047; font-weight:800;">⚡ ${station.actionVerb}... (${craftQueueRemaining} left • 1.25s cadence)</span>
                  <button class="id-mini-btn" style="border-color:#ef4444; color:#fca5a5; font-weight:800;" onclick="window.stopCraftingQueue()">⏹ STOP</button>
                </div>
              ` : `
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                  <button class="util-btn"
                          style="font-size:9.5px; padding:7px 6px; border-color:${maxMake >= 1 ? station.color : '#334155'}; color:${maxMake >= 1 ? '#fff' : '#64748b'}; background:${maxMake >= 1 ? '#1e293b' : '#0b1120'}; font-weight:800;"
                          ${maxMake < 1 ? 'disabled' : ''}
                          onclick="window.startCraftingBatch('${selectedRecipe.id}', 1)">
                    ${station.icon} MAKE 1
                  </button>
                  <button class="util-btn"
                          style="font-size:9.5px; padding:7px 6px; border-color:${maxMake >= 2 ? station.color : '#334155'}; color:${maxMake >= 2 ? '#fde047' : '#64748b'}; background:${maxMake >= 2 ? '#1e293b' : '#0b1120'}; font-weight:800;"
                          ${maxMake < 1 ? 'disabled' : ''}
                          onclick="window.startCraftingBatch('${selectedRecipe.id}', ${Math.min(5, maxMake)})">
                    MAKE 5
                  </button>
                  <button class="util-btn"
                          style="font-size:9.5px; padding:7px 6px; border-color:${maxMake >= 1 ? '#22c55e' : '#334155'}; color:${maxMake >= 1 ? '#86efac' : '#64748b'}; background:${maxMake >= 1 ? '#052e16' : '#0b1120'}; font-weight:800;"
                          ${maxMake < 1 ? 'disabled' : ''}
                          onclick="window.startCraftingBatch('${selectedRecipe.id}', ${Math.min(28, maxMake)})">
                    ⚡ ALL (${Math.min(28, maxMake)})
                  </button>
                </div>
              `}
            </div>
          ` : ''}
        </div>
      </div>

      <div style="font-size:9px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:6px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
        <span>💡 Gather raw ores, herbs &amp; flax from glowing world veins with <b style="color:#fde047;">[E]</b>, monster drops, or Sanctuary market stalls!</span>
        <button class="id-mini-btn" onclick="window.closeCraftingModal()" style="padding:2px 10px;">CLOSE [ESC]</button>
      </div>
    </div>
  `;
}

// ==========================================
// Sanctuary Vanguard Bounty Board UI
// ==========================================
export function renderBountyModal() {
  const modal = document.getElementById('bounty-modal');
  const body = document.getElementById('bounty-modal-body');
  if (!modal || !body) return;

  const bountyState = typeof window.getBountyBoardState === 'function' ? window.getBountyBoardState() : {};
  const coinGlyph = '<span class="coin-glyph" aria-label="Gold"></span>';

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; font-family:var(--font-body); color:#e2e8f0;">
      <div style="background:rgba(15,23,42,0.8); border:1px solid #ca8a04; border-left:4px solid #facc15; border-radius:4px; padding:9px 12px; font-size:9.5px; color:#cbd5e1; line-height:1.45;">
        <b style="color:#fde047;">⚔️ REPEATABLE VANGUARD &amp; ARTISAN CONTRACTS:</b> Accept any contract below, complete its objective in the world, and return to claim Gold, Character XP, Skill XP, and Cosmic Crafting Materials! Completed contracts immediately refresh for another run.
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(330px, 1fr)); gap:10px;">
        ${BOUNTY_CONTRACTS.map((b) => {
          const entry = bountyState[b.id] || { active: false, progress: 0, completions: 0 };
          const progress = Math.min(b.targetCount, Math.max(0, Number(entry.progress) || 0));
          const isReady = entry.active && progress >= b.targetCount;
          const pct = Math.round((progress / Math.max(1, b.targetCount)) * 100);
          const profMeta = PROFESSIONS_CATALOG[b.rewardProf?.id];

          return `
            <div style="background:#0b1222; border:1.5px solid ${isReady ? '#22c55e' : entry.active ? '#38bdf8' : '#334155'}; border-radius:5px; padding:11px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <span style="font-size:11px; font-weight:800; color:#fde047; font-family:var(--font-header);">${b.icon} ${b.title}</span>
                  <span style="font-size:8px; padding:2px 6px; border-radius:3px; background:#1e293b; color:#7dd3fc; font-weight:700;">${b.category.toUpperCase()}</span>
                </div>
                <div style="font-size:9.5px; color:#cbd5e1; margin-top:4px; line-height:1.35;">
                  ${b.desc}
                </div>

                <!-- Rewards Pill Strip -->
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; font-size:8.5px;">
                  <span style="background:#050811; border:1px solid #ca8a04; color:#fde047; padding:2px 6px; border-radius:3px; font-weight:700;">${coinGlyph} +${b.rewardGold} Gold</span>
                  <span style="background:#050811; border:1px solid #0284c7; color:#7dd3fc; padding:2px 6px; border-radius:3px; font-weight:700;">✨ +${b.rewardXp} XP</span>
                  ${profMeta ? `<span style="background:#050811; border:1px solid ${profMeta.color}; color:${profMeta.color}; padding:2px 6px; border-radius:3px; font-weight:700;">${profMeta.icon} +${b.rewardProf.xp} ${profMeta.name} XP</span>` : ''}
                  ${(b.rewardItems || []).map((ri) => {
                    const it = EQUIPMENT_CATALOG[ri.id];
                    return `<span style="background:#050811; border:1px solid #475569; color:#e2e8f0; padding:2px 6px; border-radius:3px;">+${ri.qty}× ${it?.name || ri.id}</span>`;
                  }).join('')}
                </div>
              </div>

              <div>
                ${entry.active ? `
                  <div style="display:flex; justify-content:space-between; font-size:8.5px; color:#94a3b8; margin-bottom:3px;">
                    <span>Progress: <b style="color:${isReady ? '#4ade80' : '#f8fafc'};">${progress} / ${b.targetCount}</b></span>
                    <span>Completed: ${entry.completions || 0}×</span>
                  </div>
                  <div style="height:6px; background:#050811; border:1px solid #1e293b; border-radius:3px; overflow:hidden; margin-bottom:7px;">
                    <div style="width:${pct}%; height:100%; background:${isReady ? '#22c55e' : '#38bdf8'};"></div>
                  </div>
                ` : ''}

                ${isReady ? `
                  <button class="util-btn" style="width:100%; border-color:#22c55e; background:#052e16; color:#86efac; font-weight:800; font-size:9.5px; padding:6px;" onclick="window.claimBountyContract('${b.id}')">
                    🏆 CLAIM BOUNTY REWARD!
                  </button>
                ` : entry.active ? `
                  <div style="text-align:center; font-size:9px; color:#38bdf8; font-weight:700; padding:5px; background:rgba(14,165,233,0.1); border:1px dashed #0284c7; border-radius:4px;">
                    ⚡ CONTRACT ACTIVE (${progress}/${b.targetCount})
                  </div>
                ` : `
                  <button class="util-btn" style="width:100%; border-color:#facc15; color:#fde047; font-weight:800; font-size:9.5px; padding:6px;" onclick="window.acceptBountyContract('${b.id}')">
                    📜 ACCEPT CONTRACT ${entry.completions > 0 ? `(Done ${entry.completions}×)` : ''}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
