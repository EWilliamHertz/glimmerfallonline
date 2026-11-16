// ==========================================
// GlimmerFall Online — Summoner-Knight Echoes & Herald Postbox UI
// Harmonic Extractor, Construct Cradle, Familiar Roster & Offline/Online Mail
// ==========================================

import {
  EQUIPMENT_CATALOG,
  GLIMMER_CIPHERS_CATALOG,
  HARMONIC_EXTRACT_TABLE,
  NEXUS_FAMILIARS_CATALOG,
  MAIL_POSTAGE_GOLD,
  MAX_MAILBOX_ITEMS,
  computeFamiliarBonuses,
  normalizeFamiliarState,
  countBagItem,
  getProfessionLevelFromXp,
} from '../../shared/protocol.js';
import { getItemIconDataUrl } from '../itemSprites.js';
import { getPlayerGold } from '../equipmentUi.js';

function escHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCatalogItemMeta(itemId) {
  return EQUIPMENT_CATALOG[itemId] || GLIMMER_CIPHERS_CATALOG[itemId] || { id: itemId, name: itemId, icon: '📦', color: '#cbd5e1' };
}

function formatBonusBadges(bonuses) {
  const parts = [];
  if (bonuses.maxHp) parts.push(`+${bonuses.maxHp} Max HP`);
  if (bonuses.lanternRadius) parts.push(`+${bonuses.lanternRadius}px Lantern Aura`);
  if (bonuses.idleHpRegen) parts.push(`+${bonuses.idleHpRegen} HP/5s Regen`);
  if (bonuses.power) parts.push(`+${bonuses.power} Power`);
  if (bonuses.bastion) parts.push(`+${bonuses.bastion} Bastion`);
  if (bonuses.resonance) parts.push(`+${bonuses.resonance} Resonance`);
  if (bonuses.tempo) parts.push(`+${bonuses.tempo} Tempo`);
  if (bonuses.castSpeedPct) parts.push(`+${Math.round(bonuses.castSpeedPct * 100)}% Cast Speed`);
  if (bonuses.critDamagePct) parts.push(`+${Math.round(bonuses.critDamagePct * 100)}% Crit Dmg`);
  if (bonuses.killGlimmer) parts.push(`+${bonuses.killGlimmer} Glimmer/Kill`);
  if (bonuses.harvestBonusChance) parts.push(`+${Math.round(bonuses.harvestBonusChance * 100)}% Double Harvest`);
  if (bonuses.cipherBonusChance) parts.push(`+${Math.round(bonuses.cipherBonusChance * 100)}% Cipher Crit`);
  if (bonuses.skillXpPct) parts.push(`+${Math.round(bonuses.skillXpPct * 100)}% Artisan XP`);
  return parts;
}

function renderCipherWalletRow(inv) {
  return Object.values(GLIMMER_CIPHERS_CATALOG)
    .map((c) => {
      const qty = countBagItem(inv, c.id);
      const iconUrl = getItemIconDataUrl(c.id, 18);
      return `
        <div style="display:inline-flex; align-items:center; gap:5px; background:#090d1a; border:1px solid ${qty > 0 ? c.color : '#1e293b'}; border-radius:4px; padding:3px 7px;">
          ${iconUrl ? `<img class="pixel-art" src="${iconUrl}" width="16" height="16" style="image-rendering:pixelated;" alt="${escHtml(c.name)}" />` : `<span>${c.icon}</span>`}
          <span style="font-size:9px; color:#cbd5e1; font-weight:700;">${escHtml(c.name.replace(' Harmonic Cipher', ''))}:</span>
          <span style="font-size:10px; color:${qty > 0 ? c.color : '#64748b'}; font-weight:900;">${qty}</span>
        </div>
      `;
    })
    .join('');
}

function renderExtractorPanel(inv, activeFamiliarId) {
  const bonuses = computeFamiliarBonuses(activeFamiliarId);
  const bonusPct = Math.round((0.12 + (bonuses.cipherBonusChance || 0)) * 100);

  const bagRows = [];
  for (const [itemId, spec] of Object.entries(HARMONIC_EXTRACT_TABLE)) {
    const have = countBagItem(inv, itemId);
    if (have > 0) bagRows.push({ itemId, have, spec });
  }
  bagRows.sort((a, b) => a.spec.tier - b.spec.tier || b.have - a.have);

  const bagHtml = bagRows.length
    ? bagRows
        .map(({ itemId, have, spec }) => {
          const srcItem = getCatalogItemMeta(itemId);
          const cipher = GLIMMER_CIPHERS_CATALOG[spec.cipherId];
          const srcImg = getItemIconDataUrl(itemId, 24);
          const cipherImg = getItemIconDataUrl(spec.cipherId, 20);
          const allCount = Math.min(25, have);
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:#0b1222; border:1px solid #1e293b; border-left:3px solid ${cipher?.color || '#38bdf8'}; border-radius:5px; padding:8px 10px;">
              <div style="display:flex; align-items:center; gap:9px; min-width:0;">
                <div style="width:32px; height:32px; background:#050811; border:1px solid #334155; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <img class="pixel-art" src="${srcImg}" width="24" height="24" style="image-rendering:pixelated;" alt="${escHtml(srcItem.name)}" />
                </div>
                <div style="min-width:0;">
                  <div style="font-size:10.5px; font-weight:800; color:#f8fafc;">
                    ${escHtml(srcItem.name)} <span style="color:#fde047;">(×${have} in bag)</span>
                  </div>
                  <div style="font-size:9px; color:#94a3b8; margin-top:2px; display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
                    <span>Decodes →</span>
                    ${cipherImg ? `<img class="pixel-art" src="${cipherImg}" width="14" height="14" style="image-rendering:pixelated;" alt="" />` : ''}
                    <strong style="color:${cipher?.color || '#38bdf8'};">+${spec.qty}× ${escHtml(cipher?.name || spec.cipherId)}</strong>
                    <span>• +${spec.xp} Extraction XP • ${escHtml(spec.note)}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:5px; flex-shrink:0;">
                <button type="button" class="util-btn" data-echo-extract="${escHtml(itemId)}" data-extract-count="1" style="border-color:#38bdf8; color:#e0f2fe; padding:4px 8px; font-size:9px;">DECODE ×1</button>
                ${have >= 5 ? `<button type="button" class="util-btn" data-echo-extract="${escHtml(itemId)}" data-extract-count="5" style="border-color:#c084fc; color:#f3e8ff; padding:4px 8px; font-size:9px;">×5</button>` : ''}
                ${have > 1 ? `<button type="button" class="util-btn" data-echo-extract="${escHtml(itemId)}" data-extract-count="${allCount}" style="border-color:#facc15; color:#fef08a; padding:4px 8px; font-size:9px;">ALL (×${allCount})</button>` : ''}
              </div>
            </div>
          `;
        })
        .join('')
    : `
      <div style="background:#090d1a; border:1px dashed #334155; border-radius:6px; padding:18px; text-align:center; color:#94a3b8; font-size:10.5px;">
        <div style="font-size:18px; margin-bottom:6px;">⚗️</div>
        <strong style="color:#e2e8f0;">No decodable raw materials currently in your backpack.</strong>
        <div style="margin-top:4px; font-size:9.5px;">
          Fish coastal waters, mine cosmic ores, harvest herbs &amp; blossoms, chop logs, or uncover Ancient Relic Fragments — then feed them into the Harmonic Extractor!
        </div>
      </div>
    `;

  const referenceRows = Object.entries(HARMONIC_EXTRACT_TABLE)
    .slice(0, 18)
    .map(([itemId, spec]) => {
      const m = getCatalogItemMeta(itemId);
      const c = GLIMMER_CIPHERS_CATALOG[spec.cipherId];
      return `<div style="font-size:8.5px; color:#94a3b8; background:#070b15; border:1px solid #1e293b; border-radius:4px; padding:4px 6px; display:flex; justify-content:space-between; gap:6px;">
        <span style="color:#e2e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(m.name)}</span>
        <span style="color:${c?.color || '#38bdf8'}; font-weight:700; flex-shrink:0;">+${spec.qty} ${escHtml(c?.icon || '')}</span>
      </div>`;
    })
    .join('');

  return `
    <div style="background:rgba(56, 189, 248, 0.08); border:1px solid rgba(56, 189, 248, 0.3); border-radius:5px; padding:8px 10px; margin-bottom:10px; font-size:9.5px; color:#bae6fd; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
      <span>⚗️ <strong>Harmonic Extractor:</strong> Convert raw fish, ores, herbs, fibers &amp; logs into element-tuned Ciphers for your Construct Cradle.</span>
      <span style="color:#fde047; font-weight:800;">Harmonic Crit (+1 Bonus Cipher): ${bonusPct}%</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:7px; max-height:34vh; overflow-y:auto; padding-right:4px;">
      ${bagHtml}
    </div>
    <div style="margin-top:12px; border-top:1px solid #1e293b; padding-top:8px;">
      <div style="font-size:9px; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
        Sample Decodable World Matter Reference
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(185px, 1fr)); gap:5px;">
        ${referenceRows}
      </div>
    </div>
  `;
}

export function renderEchoCradleModal({ container, tab = 'library', selectedFamiliarId = null, state, getFamiliarSpriteUrl, callbacks }) {
  if (!container) return;
  const { prog, profile } = state || {};
  const inv = Array.isArray(profile?.inventory) ? profile.inventory : [];
  const famState = normalizeFamiliarState(prog?.familiars);
  const bonuses = computeFamiliarBonuses(famState.activeId);
  const riteLvl = getProfessionLevelFromXp(prog?.professions?.rite_binding?.xp || 0);
  const extractLvl = getProfessionLevelFromXp(prog?.professions?.resonance_extraction?.xp || 0);

  const familiars = Object.values(NEXUS_FAMILIARS_CATALOG);
  if (tab === 'cradle') {
    familiars.sort((a, b) => {
      const aUnlocked = famState.unlockedIds.includes(a.id) ? 1 : 0;
      const bUnlocked = famState.unlockedIds.includes(b.id) ? 1 : 0;
      return aUnlocked - bUnlocked || a.reqLevel - b.reqLevel;
    });
  }
  const activeDef = famState.activeId ? NEXUS_FAMILIARS_CATALOG[famState.activeId] : null;
  const selDef =
    NEXUS_FAMILIARS_CATALOG[selectedFamiliarId] ||
    (activeDef && tab !== 'cradle' ? activeDef : null) ||
    familiars[0];

  const activeSpriteUrl = activeDef ? getFamiliarSpriteUrl?.(activeDef.spriteKey) : '';
  const bonusTags = formatBonusBadges(bonuses);

  let mainContentHtml = '';
  if (tab === 'extractor') {
    mainContentHtml = renderExtractorPanel(inv, famState.activeId);
  } else {
    const isUnlocked = famState.unlockedIds.includes(selDef.id);
    const isActive = famState.activeId === selDef.id;
    const canCompileIngredients = selDef.ingredients.every((ing) => countBagItem(inv, ing.id) >= ing.qty);
    const meetsLevel = riteLvl >= (selDef.reqLevel || 1);
    const canCompile = !isUnlocked && canCompileIngredients && meetsLevel;
    const selSprite = getFamiliarSpriteUrl?.(selDef.spriteKey);

    const gridHtml = familiars
      .map((def) => {
        const unlocked = famState.unlockedIds.includes(def.id);
        const active = famState.activeId === def.id;
        const selected = selDef.id === def.id;
        const readyToCompile =
          !unlocked &&
          riteLvl >= (def.reqLevel || 1) &&
          def.ingredients.every((ing) => countBagItem(inv, ing.id) >= ing.qty);
        const spriteUrl = getFamiliarSpriteUrl?.(def.spriteKey);
        const borderCol = selected ? '#fde047' : active ? '#4ade80' : readyToCompile ? '#c084fc' : '#1e293b';

        return `
          <div data-echo-select="${escHtml(def.id)}"
               style="cursor:pointer; background:${selected ? 'rgba(30,41,59,0.95)' : '#0b1222'}; border:1.5px solid ${borderCol}; border-left:3px solid ${def.color}; border-radius:5px; padding:8px; opacity:${unlocked || readyToCompile ? '1' : '0.82'};">
            <div style="display:flex; gap:8px; align-items:center;">
              <div style="width:36px; height:36px; background:#050811; border:1px solid ${def.color}; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                ${spriteUrl ? `<img class="pixel-art" src="${spriteUrl}" width="28" height="28" style="image-rendering:pixelated; ${unlocked ? '' : 'filter:grayscale(0.6) brightness(0.8);'}" alt="${escHtml(def.name)}" />` : '🐾'}
              </div>
              <div style="flex:1; min-width:0;">
                <div style="font-size:10px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${escHtml(def.name)}
                </div>
                <div style="font-size:8.5px; color:${def.color}; font-weight:700; margin-top:1px;">
                  ${escHtml(def.faction)} • ${escHtml(def.rarity)}
                </div>
                <div style="font-size:8px; margin-top:2px; font-weight:800; color:${active ? '#4ade80' : unlocked ? '#93c5fd' : readyToCompile ? '#e9d5ff' : '#94a3b8'};">
                  ${active ? '★ SUMMONED' : unlocked ? '✓ COMPILED' : readyToCompile ? '⚡ READY TO COMPILE' : `🔒 REQ RITE-BINDING LV.${def.reqLevel}`}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const ingredientsHtml = selDef.ingredients
      .map((ing) => {
        const meta = getCatalogItemMeta(ing.id);
        const have = countBagItem(inv, ing.id);
        const ok = have >= ing.qty;
        const iconUrl = getItemIconDataUrl(ing.id, 20);
        return `
          <div style="display:flex; align-items:center; justify-content:space-between; background:#060a14; border:1px solid ${ok ? '#14532d' : '#450a0a'}; border-radius:4px; padding:5px 8px;">
            <div style="display:flex; align-items:center; gap:7px;">
              ${iconUrl ? `<img class="pixel-art" src="${iconUrl}" width="18" height="18" style="image-rendering:pixelated;" alt="${escHtml(meta.name)}" />` : `<span>${meta.icon || '📦'}</span>`}
              <span style="font-size:9.5px; color:#f1f5f9; font-weight:700;">${escHtml(meta.name)}</span>
            </div>
            <span style="font-size:9.5px; font-weight:900; color:${ok ? '#4ade80' : '#f87171'};">${have} / ${ing.qty}</span>
          </div>
        `;
      })
      .join('');

    let actionBtnHtml = '';
    if (isUnlocked) {
      actionBtnHtml = isActive
        ? `<button type="button" id="echo-dismiss-btn" class="util-btn" style="width:100%; border-color:#f87171; color:#fecaca; padding:8px; font-size:10.5px; font-weight:800;">💤 DISMISS ACTIVE COMPANION</button>`
        : `<button type="button" data-echo-summon="${escHtml(selDef.id)}" class="util-btn" style="width:100%; border-color:#4ade80; color:#dcfce7; background:rgba(22, 163, 74, 0.25); padding:8px; font-size:10.5px; font-weight:800;">🐾 SUMMON NEXUS COMPANION</button>`;
    } else {
      actionBtnHtml = `
        <button type="button" data-echo-compile="${escHtml(selDef.id)}" ${canCompile ? '' : 'disabled'}
                class="util-btn"
                style="width:100%; border-color:${canCompile ? '#c084fc' : '#334155'}; color:${canCompile ? '#f3e8ff' : '#64748b'}; background:${canCompile ? 'rgba(147, 51, 234, 0.28)' : '#0f172a'}; padding:8px; font-size:10.5px; font-weight:800; cursor:${canCompile ? 'pointer' : 'not-allowed'};">
          ${canCompile ? `✨ COMPILE AT CONSTRUCT CRADLE (+${selDef.xp} RITE XP)` : (!meetsLevel ? `🔒 REQUIRES RITE-BINDING LV.${selDef.reqLevel}` : '📦 GATHER ECHO-PRINT & CIPHERS TO COMPILE')}
        </button>
      `;
    }

    mainContentHtml = `
      <div style="display:grid; grid-template-columns:1.25fr 1fr; gap:12px; align-items:start;">
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(195px, 1fr)); gap:8px; max-height:46vh; overflow-y:auto; padding-right:4px;">
          ${gridHtml}
        </div>
        <div style="background:#090d1a; border:1.5px solid ${selDef.color}; border-radius:6px; padding:12px;">
          <div style="display:flex; gap:10px; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:9px;">
            <div style="width:52px; height:52px; background:#050811; border:1.5px solid ${selDef.color}; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${selSprite ? `<img class="pixel-art" src="${selSprite}" width="40" height="40" style="image-rendering:pixelated;" alt="${escHtml(selDef.name)}" />` : '🐾'}
            </div>
            <div>
              <div style="font-size:12px; font-weight:900; color:#fde047; font-family:var(--font-header);">${escHtml(selDef.name)}</div>
              <div style="font-size:9px; color:${selDef.color}; font-weight:800; margin-top:2px;">${escHtml(selDef.faction)} • ${escHtml(selDef.elementPillar)}</div>
              <div style="font-size:8.5px; color:#94a3b8; margin-top:2px;">Rarity: ${escHtml(selDef.rarity)} • Req Rite-Binding Lv.${selDef.reqLevel}</div>
            </div>
          </div>

          <div style="margin-top:9px; background:rgba(74, 222, 128, 0.08); border:1px solid rgba(74, 222, 128, 0.25); border-radius:4px; padding:7px 8px;">
            <div style="font-size:8.5px; font-weight:800; color:#86efac; text-transform:uppercase;">Companion Aura &amp; Utility Passive</div>
            <div style="font-size:9.5px; color:#f1f5f9; font-weight:700; margin-top:3px;">${escHtml(selDef.passiveLabel)}</div>
          </div>

          <div style="font-size:9px; color:#94a3b8; margin-top:8px; line-height:1.4;">${escHtml(selDef.lore)}</div>

          <div style="margin-top:10px; border-top:1px solid #1e293b; padding-top:8px;">
            <div style="font-size:8.5px; font-weight:800; color:#cbd5e1; text-transform:uppercase; margin-bottom:6px;">
              Construct Cradle Covenant Recipe
            </div>
            <div style="display:flex; flex-direction:column; gap:5px;">
              ${ingredientsHtml}
            </div>
            <div style="font-size:8px; color:#64748b; margin-top:6px;">
              Find Echo-Prints from Starter Mail, Relic-Seeker Moira in Sanctuary Market, or zone Elites &amp; Bosses.
            </div>
          </div>

          <div style="margin-top:10px;">
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; background:#090d1a; border:1px solid #1e293b; border-radius:6px; padding:8px 10px; margin-bottom:9px;">
      <div style="display:flex; align-items:center; gap:9px;">
        <div style="width:36px; height:36px; background:#050811; border:1px solid ${activeDef ? activeDef.color : '#334155'}; border-radius:5px; display:flex; align-items:center; justify-content:center;">
          ${activeSpriteUrl ? `<img class="pixel-art" src="${activeSpriteUrl}" width="26" height="26" style="image-rendering:pixelated;" alt="" />` : '<span style="opacity:0.5;">🐾</span>'}
        </div>
        <div>
          <div style="font-size:10px; font-weight:800; color:${activeDef ? '#4ade80' : '#94a3b8'};">
            ${activeDef ? `ACTIVE: ${escHtml(activeDef.name.toUpperCase())}` : 'NO COMPANION SUMMONED'}
            <span style="color:#cbd5e1; font-weight:700;"> • Bound: ${famState.unlockedIds.length} / ${familiars.length}</span>
          </div>
          <div style="font-size:8.5px; color:#fde047; margin-top:2px;">
            ${bonusTags.length ? escHtml(bonusTags.join(' • ')) : 'Compile an Echo-Print & summon a familiar to gain lantern warmth and skilling utility.'}
          </div>
        </div>
      </div>
      <div style="font-size:8.5px; color:#94a3b8; text-align:right;">
        <div>Resonance Extraction: <strong style="color:#38bdf8;">Lv.${extractLvl}</strong></div>
        <div>Rite-Binding: <strong style="color:#c084fc;">Lv.${riteLvl}</strong></div>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" data-echo-tab="library" class="util-btn" style="border-color:${tab === 'library' ? '#4ade80' : '#334155'}; color:${tab === 'library' ? '#dcfce7' : '#94a3b8'}; padding:5px 10px; font-size:9.5px; font-weight:800;">🐾 NEXUS COMPANIONS</button>
        <button type="button" data-echo-tab="extractor" class="util-btn" style="border-color:${tab === 'extractor' ? '#38bdf8' : '#334155'}; color:${tab === 'extractor' ? '#e0f2fe' : '#94a3b8'}; padding:5px 10px; font-size:9.5px; font-weight:800;">⚗️ HARMONIC EXTRACTOR</button>
        <button type="button" data-echo-tab="cradle" class="util-btn" style="border-color:${tab === 'cradle' ? '#c084fc' : '#334155'}; color:${tab === 'cradle' ? '#f3e8ff' : '#94a3b8'}; padding:5px 10px; font-size:9.5px; font-weight:800;">🏗️ CONSTRUCT CRADLE</button>
      </div>
      <div style="display:flex; gap:5px; flex-wrap:wrap;">
        ${renderCipherWalletRow(inv)}
      </div>
    </div>

    ${mainContentHtml}
  `;

  container.onclick = (e) => {
    const tabBtn = e.target.closest('[data-echo-tab]');
    if (tabBtn) {
      callbacks?.onSwitchTab?.(tabBtn.getAttribute('data-echo-tab'));
      return;
    }
    const selCard = e.target.closest('[data-echo-select]');
    if (selCard) {
      callbacks?.onSelectFamiliar?.(selCard.getAttribute('data-echo-select'));
      return;
    }
    const extBtn = e.target.closest('[data-echo-extract]');
    if (extBtn) {
      const id = extBtn.getAttribute('data-echo-extract');
      const count = Number(extBtn.getAttribute('data-extract-count') || 1);
      callbacks?.onExtract?.(id, count);
      return;
    }
    const compBtn = e.target.closest('[data-echo-compile]');
    if (compBtn && !compBtn.disabled) {
      callbacks?.onCompile?.(compBtn.getAttribute('data-echo-compile'));
      return;
    }
    const sumBtn = e.target.closest('[data-echo-summon]');
    if (sumBtn) {
      callbacks?.onSummon?.(sumBtn.getAttribute('data-echo-summon'));
      return;
    }
    if (e.target.closest('#echo-dismiss-btn')) {
      callbacks?.onDismiss?.();
    }
  };
}

function formatMailTimestamp(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return 'Recent';
  }
}

export function renderMailModal({ container, tab = 'inbox', selectedMailId = null, composePrefill = null, statusMsg = null, state, callbacks }) {
  if (!container) return;
  const { mailbox = [], unreadCount = 0, profile } = state || {};
  const gold = getPlayerGold(profile || {});
  const inv = Array.isArray(profile?.inventory) ? profile.inventory : [];

  const selMail = mailbox.find((m) => m.id === selectedMailId) || mailbox[0] || null;
  if (selMail && !selMail.read && tab === 'inbox') {
    callbacks?.onMarkRead?.(selMail.id);
  }

  let bodyHtml = '';
  if (tab === 'compose') {
    const bagOptions = inv
      .map((slot) => {
        const id = typeof slot === 'string' ? slot : slot?.id;
        const qty = typeof slot === 'string' ? 1 : Math.max(1, Number(slot?.qty) || 1);
        if (!id || id === 'solar_gold') return '';
        const meta = getCatalogItemMeta(id);
        return `<option value="${escHtml(id)}">${escHtml(meta.name)} (×${qty} in bag)</option>`;
      })
      .join('');

    bodyHtml = `
      <form id="herald-compose-form" style="background:#090d1a; border:1px solid #334155; border-radius:6px; padding:12px; display:flex; flex-direction:column; gap:9px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="display:block; font-size:9px; font-weight:800; color:#fde047; margin-bottom:4px;">RECIPIENT CHAMPION NAME</label>
            <input id="mail-to-input" type="text" maxlength="28" required placeholder="Exact champion name (online or offline)" value="${escHtml(composePrefill?.to || '')}"
                   style="width:100%; box-sizing:border-box; background:#050811; border:1px solid #334155; color:#f8fafc; padding:6px 8px; border-radius:4px; font-size:11px;" />
          </div>
          <div>
            <label style="display:block; font-size:9px; font-weight:800; color:#fde047; margin-bottom:4px;">SUBJECT</label>
            <input id="mail-subject-input" type="text" maxlength="64" required placeholder="Letter subject..." value="${escHtml(composePrefill?.subject || '')}"
                   style="width:100%; box-sizing:border-box; background:#050811; border:1px solid #334155; color:#f8fafc; padding:6px 8px; border-radius:4px; font-size:11px;" />
          </div>
        </div>

        <div>
          <label style="display:block; font-size:9px; font-weight:800; color:#cbd5e1; margin-bottom:4px;">MESSAGE PROSE</label>
          <textarea id="mail-body-input" rows="4" maxlength="400" placeholder="Write a message for the Sanctuary Herald..."
                    style="width:100%; box-sizing:border-box; background:#050811; border:1px solid #334155; color:#f8fafc; padding:7px 8px; border-radius:4px; font-size:11px; resize:vertical;">${escHtml(composePrefill?.body || '')}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:140px 1fr 90px; gap:10px; align-items:end; background:#060a14; border:1px solid #1e293b; border-radius:5px; padding:8px;">
          <div>
            <label style="display:block; font-size:8.5px; font-weight:800; color:#facc15; margin-bottom:4px;">ATTACH GOLD</label>
            <input id="mail-gold-input" type="number" min="0" max="${Math.max(0, gold - MAIL_POSTAGE_GOLD)}" value="0"
                   style="width:100%; box-sizing:border-box; background:#050811; border:1px solid #334155; color:#fde047; padding:5px 7px; border-radius:4px; font-size:11px; font-weight:800;" />
          </div>
          <div>
            <label style="display:block; font-size:8.5px; font-weight:800; color:#93c5fd; margin-bottom:4px;">ATTACH ITEM FROM BACKPACK</label>
            <select id="mail-item-select" style="width:100%; box-sizing:border-box; background:#050811; border:1px solid #334155; color:#f8fafc; padding:5px 7px; border-radius:4px; font-size:10.5px;">
              <option value="">— No Item Attached —</option>
              ${bagOptions}
            </select>
          </div>
          <div>
            <label style="display:block; font-size:8.5px; font-weight:800; color:#93c5fd; margin-bottom:4px;">QTY</label>
            <input id="mail-qty-input" type="number" min="1" max="999" value="1"
                   style="width:100%; box-sizing:border-box; background:#050811; border:1px solid #334155; color:#f8fafc; padding:5px 7px; border-radius:4px; font-size:11px;" />
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:2px;">
          <span style="font-size:9.5px; color:#94a3b8;">Flat Herald Postage: <strong style="color:#fde047;">${MAIL_POSTAGE_GOLD} Solar Gold</strong> • Your Gold: <strong style="color:#4ade80;">${gold}g</strong></span>
          <button type="submit" class="util-btn" style="border-color:#facc15; color:#fef08a; background:rgba(202, 138, 4, 0.25); padding:7px 14px; font-size:10.5px; font-weight:900;">
            📮 DISPATCH HERALD POST (-${MAIL_POSTAGE_GOLD}g)
          </button>
        </div>
      </form>
    `;
  } else {
    const listHtml = mailbox.length
      ? mailbox
          .map((m) => {
            const selected = selMail?.id === m.id;
            const hasUnclaimed = !m.claimed && (m.gold > 0 || (m.items && m.items.length > 0));
            return `
              <div data-mail-select="${escHtml(m.id)}"
                   style="cursor:pointer; background:${selected ? 'rgba(30,41,59,0.95)' : '#0b1222'}; border:1.5px solid ${selected ? '#fde047' : !m.read ? '#f59e0b' : '#1e293b'}; border-radius:5px; padding:8px; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <span style="font-size:10px; font-weight:${!m.read ? '900' : '700'}; color:${!m.read ? '#fde047' : '#e2e8f0'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${!m.read ? '● ' : ''}${escHtml(m.subject)}
                  </span>
                  ${hasUnclaimed ? '<span style="font-size:10px;" title="Unclaimed Gold / Item Parcel">🎁</span>' : ''}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:8.5px; color:#94a3b8; margin-top:3px;">
                  <span>From: <strong style="color:#cbd5e1;">${escHtml(m.fromName)}</strong></span>
                  <span>${escHtml(formatMailTimestamp(m.createdAt))}</span>
                </div>
              </div>
            `;
          })
          .join('')
      : `
        <div style="background:#090d1a; border:1px dashed #334155; border-radius:5px; padding:22px 12px; text-align:center; color:#94a3b8; font-size:10px;">
          📭 Your Herald Postbox is empty.
        </div>
      `;

    const hasAttachments = Boolean(selMail && (selMail.gold > 0 || (selMail.items && selMail.items.length > 0)));
    const canClaim = Boolean(selMail && hasAttachments && !selMail.claimed);

    const detailHtml = selMail
      ? `
        <div style="background:#090d1a; border:1.5px solid #ca8a04; border-radius:6px; padding:12px;">
          <div style="border-bottom:1px solid #1e293b; padding-bottom:8px;">
            <div style="font-size:12px; font-weight:900; color:#fde047;">${escHtml(selMail.subject)}</div>
            <div style="font-size:9px; color:#cbd5e1; margin-top:3px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
              <span>From: <strong>${escHtml(selMail.fromName)}</strong></span>
              <span style="color:#94a3b8;">${escHtml(formatMailTimestamp(selMail.createdAt))}</span>
            </div>
          </div>

          <div style="font-size:10.5px; color:#e2e8f0; line-height:1.5; margin-top:10px; min-height:70px; white-space:pre-wrap;">${escHtml(selMail.body || '(No message written)')}</div>

          ${
            hasAttachments
              ? `
                <div style="margin-top:10px; background:#050811; border:1px solid ${selMail.claimed ? '#1e293b' : '#ca8a04'}; border-radius:5px; padding:9px;">
                  <div style="font-size:8.5px; font-weight:800; color:${selMail.claimed ? '#64748b' : '#fde047'}; text-transform:uppercase; margin-bottom:6px;">
                    ${selMail.claimed ? '✓ Parcel Contents Claimed' : '🎁 Enclosed Parcel Attachments'}
                  </div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                    ${selMail.gold > 0 ? `<div style="background:#0f172a; border:1px solid #ca8a04; border-radius:4px; padding:4px 8px; font-size:10px; font-weight:900; color:#fde047;">🪙 ${selMail.gold} Solar Gold</div>` : ''}
                    ${(selMail.items || [])
                      .map((it) => {
                        const meta = getCatalogItemMeta(it.id);
                        const imgUrl = getItemIconDataUrl(it.id, 20);
                        return `
                          <div style="display:inline-flex; align-items:center; gap:6px; background:#0f172a; border:1px solid #334155; border-radius:4px; padding:4px 8px;">
                            ${imgUrl ? `<img class="pixel-art" src="${imgUrl}" width="18" height="18" style="image-rendering:pixelated;" alt="" />` : ''}
                            <span style="font-size:9.5px; color:#f1f5f9; font-weight:700;">${escHtml(meta.name)}</span>
                            <span style="font-size:9.5px; color:#4ade80; font-weight:900;">×${it.qty}</span>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                </div>
              `
              : ''
          }

          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-top:12px;">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${canClaim ? `<button type="button" data-mail-claim="${escHtml(selMail.id)}" class="util-btn" style="border-color:#4ade80; color:#dcfce7; background:rgba(22, 163, 74, 0.25); padding:6px 12px; font-size:10px; font-weight:900;">🎁 CLAIM PARCEL</button>` : ''}
              ${selMail.fromAccountId ? `<button type="button" data-mail-reply="${escHtml(selMail.id)}" class="util-btn" style="border-color:#38bdf8; color:#e0f2fe; padding:6px 10px; font-size:9.5px; font-weight:800;">↩️ REPLY</button>` : ''}
            </div>
            <button type="button" data-mail-delete="${escHtml(selMail.id)}" class="util-btn" style="border-color:#ef4444; color:#fecaca; padding:6px 10px; font-size:9.5px; font-weight:800;">🗑️ DELETE</button>
          </div>
        </div>
      `
      : `
        <div style="background:#090d1a; border:1px solid #1e293b; border-radius:6px; padding:24px; text-align:center; color:#94a3b8; font-size:10.5px;">
          Select a Herald letter on the left or compose a parcel to another champion.
        </div>
      `;

    bodyHtml = `
      <div style="display:grid; grid-template-columns:1fr 1.35fr; gap:12px; align-items:start;">
        <div style="max-height:46vh; overflow-y:auto; padding-right:4px;">
          ${listHtml}
        </div>
        <div>
          ${detailHtml}
        </div>
      </div>
    `;
  }

  const bannerColor = statusMsg?.ok === false ? '#ef4444' : '#4ade80';
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:#090d1a; border:1px solid #1e293b; border-radius:6px; padding:8px 10px; margin-bottom:10px;">
      <div style="display:flex; gap:6px;">
        <button type="button" data-mail-tab="inbox" class="util-btn" style="border-color:${tab === 'inbox' ? '#fde047' : '#334155'}; color:${tab === 'inbox' ? '#fef08a' : '#94a3b8'}; padding:5px 10px; font-size:9.5px; font-weight:800;">
          📥 INBOX (${mailbox.length}/${MAX_MAILBOX_ITEMS})${unreadCount > 0 ? ` • ${unreadCount} NEW` : ''}
        </button>
        <button type="button" data-mail-tab="compose" class="util-btn" style="border-color:${tab === 'compose' ? '#38bdf8' : '#334155'}; color:${tab === 'compose' ? '#e0f2fe' : '#94a3b8'}; padding:5px 10px; font-size:9.5px; font-weight:800;">
          ✉️ COMPOSE &amp; SEND PARCEL
        </button>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:10px; font-weight:800; color:#fde047;">🪙 ${gold}g</span>
        <button type="button" id="mail-refresh-btn" class="util-btn" style="border-color:#475569; color:#cbd5e1; padding:4px 8px; font-size:9px;">🔄 REFRESH</button>
      </div>
    </div>

    ${
      statusMsg?.text
        ? `<div style="margin-bottom:9px; padding:7px 10px; border-radius:5px; font-size:9.5px; font-weight:700; background:rgba(15,23,42,0.9); border:1px solid ${bannerColor}; color:${bannerColor};">${escHtml(statusMsg.text)}</div>`
        : ''
    }

    ${bodyHtml}
  `;

  container.onclick = (e) => {
    const tabBtn = e.target.closest('[data-mail-tab]');
    if (tabBtn) {
      callbacks?.onSwitchTab?.(tabBtn.getAttribute('data-mail-tab'));
      return;
    }
    const selEl = e.target.closest('[data-mail-select]');
    if (selEl) {
      callbacks?.onSelectMail?.(selEl.getAttribute('data-mail-select'));
      return;
    }
    const claimBtn = e.target.closest('[data-mail-claim]');
    if (claimBtn) {
      callbacks?.onClaim?.(claimBtn.getAttribute('data-mail-claim'));
      return;
    }
    const delBtn = e.target.closest('[data-mail-delete]');
    if (delBtn) {
      callbacks?.onDelete?.(delBtn.getAttribute('data-mail-delete'));
      return;
    }
    const replyBtn = e.target.closest('[data-mail-reply]');
    if (replyBtn && selMail) {
      const senderClean = String(selMail.fromName || '').replace(/\s*•.*$/, '');
      const reSubj = selMail.subject?.startsWith('Re:') ? selMail.subject : `Re: ${selMail.subject || ''}`;
      callbacks?.onSwitchTab?.('compose', { to: senderClean, subject: reSubj.slice(0, 64), body: '' });
      return;
    }
    if (e.target.closest('#mail-refresh-btn')) {
      callbacks?.onRefresh?.();
    }
  };

  const form = container.querySelector('#herald-compose-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const to = form.querySelector('#mail-to-input')?.value?.trim() || '';
      const subject = form.querySelector('#mail-subject-input')?.value?.trim() || '';
      const body = form.querySelector('#mail-body-input')?.value || '';
      const attachGold = Math.max(0, Math.floor(Number(form.querySelector('#mail-gold-input')?.value) || 0));
      const itemId = form.querySelector('#mail-item-select')?.value || null;
      const itemQty = Math.max(1, Math.floor(Number(form.querySelector('#mail-qty-input')?.value) || 1));
      callbacks?.onSend?.({ to, subject, body, gold: attachGold, itemId, itemQty });
    };
  }
}
