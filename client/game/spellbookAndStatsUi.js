// ==========================================
// GlimmerFall Online 2D — Spellbook, Keybinds, Class Guide, Stats & Social UI
// Extracted from client/game.js for modular maintainability
// ==========================================

import { getAbilityIconHtml } from '../ui/abilityIcons.js';
import { getItemIconDataUrl } from '../itemSprites.js';
import { renderSocialModal } from '../socialUi.js';
import { updateTouchUiButtons } from '../touch.js';
import {
  ACTION_SLOTS,
  SLOT_UNLOCK_LEVELS,
  isSlotUnlocked,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  ABILITIES_CATALOG,
  getSlotAbilitySpec,
  getAbilityRank,
  canUpgradeAbility,
  getRankStats,
  getEffectiveStats,
  xpForNextLevel,
  MAX_BASE_LEVEL,
  PARAGON_AFFINITIES,
  paragonXpForLevel,
  canUpgradeParagon,
  resolveFactionAndClass,
  calcMaxHp,
  calcMaxGlimmer,
  calcCritChance,
  calcCdMult,
  calcCastSpeedMult,
  calcCritDamageMult,
  calcDodgeChance,
  calcDamageReduction,
  calcLifeLeechPct,
  calcHpRegenPerSec,
  calcMoveSpeedMult,
  getClassPassive,
  getFactionResourceConfig,
} from '../../shared/protocol.js';

export function createSpellbookAndStatsUi({
  ITEM_ACTION_SLOTS,
  getLocalProfile,
  getProg,
  getPlayer,
  getCurrentSkillTreeTab,
  getPendingAssign,
  getListeningSlot,
  getRebindFeedbackMsg,
  getKeybinds,
  getActionBarItems,
  getCurrentRoomId,
  getPublicRoomsList,
  getCurrentParty,
  findEquippedSlotForAbility,
  formatKeyLabel,
  remotePlayers,
  net,
}) {
  function renderSkillTreeUI() {
    const container = document.getElementById('skill-tree-content');
    if (!container) return;

    const currentSkillTreeTab = getCurrentSkillTreeTab();
    const pendingAssign = getPendingAssign();
    const localProfile = getLocalProfile();
    const prog = getProg();
    const isFlashesTab = currentSkillTreeTab === 'flashes';
    const targetTree = isFlashesTab ? 'flashes' : 'rites';
    const resolved = resolveFactionAndClass({
      faction: localProfile.faction,
      classId: localProfile.classId,
      loadout: localProfile.loadout,
      orderTag: localProfile.orderTag,
    });
    localProfile.faction = resolved.faction;
    localProfile.classId = resolved.classId;
    const myFaction = resolved.faction;
    const myClassId = resolved.classId;
    const clsMeta = CLASSES_CATALOG[myClassId] || CLASSES_CATALOG.solari_vanguard;
    const passiveSpec = getClassPassive(myClassId);
    const resCfg = getFactionResourceConfig(myFaction);
    const sp = prog.skillPoints || 0;

    const spBadge = document.getElementById('sp-count-txt');
    if (spBadge) spBadge.innerText = String(sp);

    const banner = document.getElementById('skill-points-banner');
    if (banner) {
      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="color:#fde047; font-size:12.5px; font-weight:800; letter-spacing:0.02em;">⚡ UNSPENT SKILL POINTS: <span id="sp-count-txt" class="skill-pts-badge" style="font-size:12px; padding:3px 9px;">${sp}</span></span>
            ${sp > 0 ? '<span style="color:#4ade80; font-weight:800; font-size:11px; animation:pulseAlloc 1.4s infinite alternate;">★ READY TO INVEST!</span>' : '<span style="color:#94a3b8; font-size:11px;">(Slay monsters or level up to earn +1 SP/level)</span>'}
            <button type="button" class="util-btn" style="padding:3px 7px; font-size:9px; border-color:#a16207; color:#fde047;" onclick="autoEquipLearnedAbilities()" title="Fill every empty Rite/Flash slot with abilities you have learned">⚡ AUTO-EQUIP LEARNED</button>
            <button type="button" id="btn-free-respec" class="util-btn" style="padding:3px 8px; font-size:9px; border-color:#38bdf8; color:#7dd3fc;" onclick="respecSkills()" title="Reset all spent Skill Points for free and refund them immediately">↺ FREE RESPEC</button>
          </div>
          <div style="font-size:11px; color:#cbd5e1; font-family:var(--font-clean);">
            CHAMPION LV. <b style="color:#facc15;">${prog.level || 1}</b> • <b style="color:${resCfg.color};">${clsMeta.name.toUpperCase()} (${myFaction.toUpperCase()})</b>
          </div>
        </div>
      `;
    }

    // Filter skills for this tree, faction, and class specialization
    const treeSkills = Object.values(ABILITIES_CATALOG).filter(
      (ab) => ab.tree === targetTree && (ab.faction === myFaction || ab.faction === 'All') && (!ab.classId || ab.classId === myClassId)
    );

    // Group by Tier (1 to 7)
    const tiers = [
      { tier: 1, reqLevel: 1, name: 'NOVICE' },
      { tier: 2, reqLevel: 3, name: 'INITIATE' },
      { tier: 3, reqLevel: 6, name: 'ADEPT' },
      { tier: 4, reqLevel: 12, name: 'VANGUARD' },
      { tier: 5, reqLevel: 18, name: 'MASTER' },
      { tier: 6, reqLevel: 24, name: 'CHAMPION' },
      { tier: 7, reqLevel: 30, name: 'APEX ULTIMATE' },
    ];

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; background:rgba(8,14,32,0.92); border:1px solid ${resCfg.color}; border-radius:4px; padding:8px 10px; margin-bottom:10px;">
        <div style="font-size:10px; color:#e2e8f0; flex:1; min-width:220px;">
          <span style="color:${resCfg.color}; font-weight:800;">✦ CLASS PASSIVE — ${passiveSpec.name.toUpperCase()}:</span> ${passiveSpec.desc}
        </div>
        <div style="font-size:10px; color:#bae6fd; display:flex; align-items:center; gap:6px;">
          ${getFactionCrestSvg(myFaction, 16)}
          <span><b>${resCfg.name}:</b> ${resCfg.desc}</span>
        </div>
      </div>
    `;

    for (const t of tiers) {
      const skillsInTier = treeSkills.filter((s) => (s.tier || 1) === t.tier);
      if (skillsInTier.length === 0) continue;

      const tierUnlocked = (prog.level || 1) >= t.reqLevel;

      html += `
        <div class="d2-tier-row" style="${t.tier === 7 ? 'border: 2px solid #ca8a04; background: rgba(30, 20, 5, 0.85); box-shadow: 0 0 15px rgba(234, 179, 8, 0.2);' : ''}">
          <div class="d2-tier-header" style="${t.tier === 7 ? 'border-bottom-color: #854d0e;' : ''}">
            <div>
              <span style="color:${t.tier === 7 ? '#fde047' : '#facc15'}; font-weight:800;">${t.tier === 7 ? '★ ' : ''}TIER ${t.tier}: ${t.name}</span>
              <span style="color:#94a3b8; margin-left:8px;">(Requires Champion Level ${t.reqLevel})</span>
            </div>
            <div>
              ${tierUnlocked
                ? `<span style="color:#4ade80; font-size:10px; font-weight:bold;">✓ UNLOCKED</span>`
                : `<span style="color:#ef4444; font-size:10px; font-weight:bold;">🔒 LOCKED (Level ${t.reqLevel})</span>`}
            </div>
          </div>
          <div class="d2-skills-grid">
      `;

      for (const ab of skillsInTier) {
        const curRank = getAbilityRank(prog, ab.id);
        const canUp = canUpgradeAbility(prog, ab.id, myClassId);
        const isMax = curRank >= (ab.maxRank || 5);
        const isLearned = curRank >= 1;
        const rankNow = getRankStats(ab, Math.max(1, curRank));
        const rankNext = getRankStats(ab, Math.min(5, Math.max(1, curRank) + 1));

        let cardClass = 'd2-skill-card';
        if (pendingAssign?.id === ab.id) cardClass += ' picked';
        if (isMax) cardClass += ' maxed';
        else if (isLearned) cardClass += ' learned';
        else if (!tierUnlocked) cardClass += ' locked';

        const castTimeTxt = ab.castTime > 0 ? `☀️ ${ab.castTime.toFixed(1)}s Cast Rite` : `⚡ Instant Flash`;
        const classTag = ab.classId ? `<span style="font-size:8.5px; color:${resCfg.color}; border:1px solid ${resCfg.color}; border-radius:2px; padding:0 4px; margin-left:4px;">CLASS</span>` : '';

        let prereqName = '';
        let prereqMet = true;
        if (ab.prereq) {
          const pSpec = ABILITIES_CATALOG[ab.prereq];
          prereqName = pSpec?.name || ab.prereq;
          prereqMet = getAbilityRank(prog, ab.prereq) >= 1;
        }

        // Check if currently equipped in loadout across ALL 8 ability slots
        const equippedSlot = findEquippedSlotForAbility(ab.id);
        const equippedKeyLabel = equippedSlot ? formatKeyLabel(keybinds[equippedSlot]) : null;

        // Allow choosing ANY of the 8 ability slots ([1, 2, 3, 4, 9, 10, 11, 12]) on any learned ability
        const equipSlots = ACTION_SLOTS;

        html += `
          <div class="${cardClass}" data-ability-id="${ab.id}" draggable="${isLearned}" ondragstart="window.beginActionDrag(event, 'ability', '${ab.id}')" title="${isLearned ? 'Click a slot button below, click to pick, or drag to the action bar' : 'Unlearned'}${equippedSlot ? ` • Equipped in Slot ${equippedSlot} [${equippedKeyLabel}]` : ''}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="display:inline-flex; align-items:center;">${getAbilityIconHtml(ab, 24)}</span>
                <div>
                  <div style="font-weight:700; font-size:11.5px; color:${ab.color || '#facc15'};">${ab.name}${classTag}</div>
                  <div style="font-size:9.5px; color:#38bdf8;">${castTimeTxt}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; justify-content:flex-end;">
                ${equippedSlot ? `<span class="d2-equipped-badge" title="Currently active on your Action Bar in Slot ${equippedSlot} [${equippedKeyLabel}]">✓ ADDED [${equippedKeyLabel}]</span>` : ''}
                <div class="d2-rank-badge ${isMax ? 'is-max' : curRank > 0 ? 'has-points' : ''}">
                  ${isMax ? 'MAX RANK (5/5)' : `RANK ${curRank}/5`}
                </div>
              </div>
            </div>

            <div style="font-size:10px; color:#cbd5e1; line-height:1.4; margin-top:2px;">
              ${ab.desc}
            </div>

            ${prereqName ? `
              <div style="font-size:9.5px; color:${prereqMet ? '#4ade80' : '#f87171'};">
                ${prereqMet ? '✓' : '🔒'} Requires: ${prereqName} (Rank 1+)
              </div>
            ` : ''}

            ${curRank < 5 ? `
              <div style="font-size:9.5px; color:#facc15; background:rgba(15,23,42,0.6); padding:3px 6px; border-radius:3px; border-left:2px solid #facc15;">
                NEXT RANK ${Math.min(5, Math.max(1, curRank) + 1)}/5: +3 Power • CD ${rankNow.effectiveBaseCd.toFixed(1)}s → ${rankNext.effectiveBaseCd.toFixed(1)}s
              </div>
            ` : ''}

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; gap:6px; flex-wrap:wrap;">
              <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
                ${isLearned ? `<button type="button" class="util-btn" style="padding:2px 6px; font-size:9px; border-color:${equippedSlot ? '#4ade80' : '#facc15'}; color:${equippedSlot ? '#86efac' : '#fde047'};" onclick="pickAbilityForBar('${ab.id}')">🎯 ${pendingAssign?.id === ab.id ? 'PICKED…' : equippedSlot ? `MOVE SLOT (IN [${equippedKeyLabel}])` : 'PLACE IN BAR'}</button>` : ''}
                ${canUp
                  ? `<button type="button" class="d2-alloc-btn can-alloc" onclick="upgradeAbilityInTree('${ab.id}')">+ INVEST 1 POINT</button>`
                  : isMax
                    ? `<button type="button" class="d2-alloc-btn" disabled>★ MAXED</button>`
                    : !tierUnlocked
                      ? `<button type="button" class="d2-alloc-btn" disabled>REQ LV. ${t.reqLevel}</button>`
                      : !prereqMet
                        ? `<button type="button" class="d2-alloc-btn" disabled>REQ PREREQ</button>`
                        : `<button type="button" class="d2-alloc-btn" disabled>0 POINTS</button>`}
              </div>

              ${isLearned ? `
                <div style="display:flex; align-items:center; gap:3px; flex-wrap:wrap;">
                  <span style="font-size:9px; color:#94a3b8; font-weight:700;">SLOT:</span>
                  ${equipSlots.map((s) => {
                    const isCur = Number(equippedSlot) === Number(s);
                    const keyLabel = formatKeyLabel(keybinds[s]);
                    return `
                      <button type="button" class="util-btn" style="padding:2px 5px; font-size:8.5px; ${isCur ? 'border-color:#4ade80; color:#4ade80; background:#14532d; font-weight:800;' : 'border-color:#334155; color:#cbd5e1;'}"
                        onclick="assignSlotAbilityInGame(${s}, '${ab.id}')" title="${isCur ? `Currently in Slot ${s} [${keyLabel}]` : `Move/Equip ${ab.name} to Slot ${s} [${keyLabel}]`}">
                        ${isCur ? `✓ [${keyLabel}]` : `[${keyLabel}]`}
                      </button>
                    `;
                  }).join('')}
                </div>
              ` : `
                <div style="font-size:9px; color:#ef4444; font-weight:600;">🔒 UNLEARNED</div>
              `}
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Click-to-place: click a learned card, then click the action-bar slot that should hold it.
    container.querySelectorAll('[data-ability-id]').forEach((card) => {
      card.addEventListener('click', (ev) => {
        if (ev.target.closest('button, select, input, a')) return;
        window.pickAbilityForBar(card.dataset.abilityId);
      });
    });
  }

  function renderKeybindUI() {
    const localProfile = getLocalProfile();
    const listeningSlot = getListeningSlot();
    const rebindFeedbackMsg = getRebindFeedbackMsg();
    const keybinds = getKeybinds();
    const actionBarItems = getActionBarItems();
    const container = document.getElementById('keybind-list-container');
    if (!container) return;
    const ptsHeader = document.getElementById('skill-points-banner');
    if (ptsHeader) {
      const sp = prog.skillPoints || 0;
      if (listeningSlot !== null) {
        const lSpec = getSlotAbilitySpec(localProfile.loadout, listeningSlot);
        const lItemId = ITEM_ACTION_SLOTS.includes(Number(listeningSlot)) ? actionBarItems[listeningSlot] : null;
        const lName = lSpec?.name || (lItemId ? EQUIPMENT_CATALOG[lItemId]?.name : null) || `Slot ${listeningSlot}`;
        ptsHeader.innerHTML = `
          <div style="color:#fde047; font-size:12px; font-weight:800;">
            ⌨️ PRESS ANY KEY TO BIND "${lName.toUpperCase()}" (OR [ESC] TO CANCEL)...
          </div>
        `;
      } else if (rebindFeedbackMsg) {
        ptsHeader.innerHTML = `
          <div style="color:#4ade80; font-size:12px; font-weight:800;">
            ${rebindFeedbackMsg}
          </div>
        `;
      } else {
        ptsHeader.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#fde047; font-size:12.5px; font-weight:800;">⚡ UNSPENT SKILL POINTS: <span class="skill-pts-badge" style="font-size:12px; padding:3px 9px;">${sp}</span></span>
              ${sp > 0 ? '<span style="color:#4ade80; font-weight:800; font-size:11px;">★ READY TO INVEST!</span>' : ''}
            </div>
            <div style="font-size:11px; color:#cbd5e1;">
              <button type="button" class="util-btn" style="padding:3px 7px; font-size:9px; border-color:#a16207; color:#fde047;" onclick="autoEquipLearnedAbilities()" title="Fill every empty Rite/Flash slot with abilities you have learned">⚡ AUTO-EQUIP LEARNED</button>
              CLICK ANY <b style="color:#38bdf8;">[KEY]</b> TO REBIND • SHIFT+CLICK A BAR SLOT TO REBIND FAST
            </div>
          </div>
        `;
      }
    }
    container.innerHTML = '';
    const cdMult = calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction);
    const myFaction = localProfile.faction || 'Solari';

    for (const slot of [1, 2, 3, 4, 'harvest', 5, 6, 7, 8, 9, 10, 11, 12]) {
      const isItemSlot = typeof slot === 'number' && ITEM_ACTION_SLOTS.includes(slot);
      const slotItemId = isItemSlot ? actionBarItems[slot] : null;
      const slotItem = slotItemId ? EQUIPMENT_CATALOG[slotItemId] : null;
      const equippedSpec = isItemSlot
        ? (slotItem
            ? {
                id: null,
                name: slotItem.name,
                icon: slotItem.icon || '🎒',
                color: '#fb923c',
                tcgType: slotItem.slot === 'consumable' ? 'Consumable' : 'Gear',
                castTime: 0,
                baseCd: 0,
                range: 'Item Slot',
                desc: `Press the key to ${slotItem.slot === 'consumable' ? 'use this item' : 'equip this gear'}. Right-click the slot to clear it, or change it with the dropdown below.`,
              }
            : {
                id: null,
                name: `Empty Item Slot ${slot}`,
                icon: '＋',
                color: '#94a3b8',
                tcgType: 'Item Slot',
                castTime: 0,
                baseCd: 0,
                range: 'Item Slot',
                desc: 'Assign a potion, food, or gear piece with the dropdown below, or drag one from your bag onto the slot.',
              })
        : getSlotAbilitySpec(localProfile.loadout, slot);
      const isEmptySlot = !equippedSpec && typeof slot === 'number';
      const spec = equippedSpec || {
        id: null,
        name: `Empty Slot ${slot}`,
        icon: '＋',
        color: '#94a3b8',
        tcgType: 'Empty Slot',
        castTime: 0,
        baseCd: 0,
        range: '—',
        desc: 'Pick a learned Rite or Flash in the Skill Tree and click this slot (or drag one here).',
      };
      const bound = formatKeyLabel(keybinds[slot]);
      const isListening = listeningSlot === slot;
      const isRankable = typeof slot === 'number' && !isItemSlot;
      const curRank = isRankable && equippedSpec ? getAbilityRank(prog, spec.id) : 0;
      const isLearned = isRankable ? curRank >= 1 : true;
      const canUpgrade = isRankable && canUpgradeAbility(prog, spec.id, localProfile.classId);

      // Available choices for this slot: all learned abilities of the player's faction & class!
      const allowedChoices = isItemSlot
        ? Array.from(new Set((localProfile.inventory || []).map((it) => (typeof it === 'string' ? it : it?.id))))
            .map((id) => EQUIPMENT_CATALOG[id])
            .filter((it) => it && it.slot !== 'currency')
        : Object.values(ABILITIES_CATALOG)
            .filter((ab) => ab.id !== 'harvest' && ab.faction === myFaction && (!ab.classId || ab.classId === localProfile.classId) && getAbilityRank(prog, ab.id) >= 1)
            .sort((a, b) => (a.tier || 1) - (b.tier || 1));

      const castTimeTxt = spec.castTime > 0 ? `${spec.castTime.toFixed(1)}s Cast` : 'Instant';

      const row = document.createElement('div');
      row.className = 'keybind-row';
      row.innerHTML = `
        <div style="flex:1; padding-right:10px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="display:inline-flex; align-items:center;">${isLearned ? (equippedSpec ? getAbilityIconHtml(spec, 18) : spec.icon) : '🔒'}</span>
            <b style="color:${spec.color}; font-size:12px;">${spec.name}</b>
            <span class="spec-pill">${spec.tcgType}</span>
            ${isRankable ? `<span class="rank-pill">${isLearned ? `RANK ${curRank}/5` : isEmptySlot ? 'EMPTY' : '🔒 UNLEARNED'}</span>` : ''}
            <span style="font-size:10px; color:#94a3b8;">${castTimeTxt} • CD: ${spec.baseCd > 0 ? (spec.baseCd * cdMult).toFixed(1) + 's' : '0s'} • ${spec.range}</span>
          </div>
          <div style="font-size:10.5px; color:#e2e8f0; margin-top:3px; line-height:1.4;">${spec.desc}</div>
          ${isRankable || isItemSlot ? `
            <div style="margin-top:5px;">
              <select class="pixel-input" style="width:auto; padding:3px 8px; font-size:10.5px;" onchange="${isItemSlot ? `assignItemToSlot(${slot}, this.value)` : `assignSlotAbilityInGame(${slot}, this.value)`}; this.blur();">
                ${allowedChoices.length > 0
                  ? `<option value="" ${(isItemSlot ? slotItemId : spec.id) ? '' : 'selected'}>— EMPTY SLOT —</option>` +
                    allowedChoices.map((choice) => {
                      const selected = isItemSlot ? slotItemId === choice.id : spec.id === choice.id;
                      const existingSlot = !isItemSlot ? findEquippedSlotForAbility(choice.id) : null;
                      const slotNote = existingSlot ? (Number(existingSlot) === Number(slot) ? ` • ✓ Active Here` : ` • In [${formatKeyLabel(keybinds[existingSlot])}]`) : '';
                      const label = isItemSlot ? choice.name : `${choice.icon} ${choice.name} (Rank ${getAbilityRank(prog, choice.id)}/5${slotNote})`;
                      return `<option value="${choice.id}" ${selected ? 'selected' : ''}>${label}</option>`;
                    }).join('')
                  : `<option disabled selected>${isItemSlot ? '🎒 Bag is empty — buy potions or gear first!' : `🔒 No abilities learned yet — allocate points in Spellbook [P]!`}</option>`}
              </select>
            </div>
          ` : ''}
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${isRankable && isLearned ? `
            <button type="button" class="upgrade-btn ${canUpgrade ? 'ready' : ''}" ${canUpgrade ? '' : 'disabled'} onclick="upgradeAbilityInTree('${spec.id}')">
              ${curRank >= 5 ? 'MAX' : '+RANK'}
            </button>
          ` : ''}
          <button type="button" id="rebind-btn-${slot}" class="keybind-btn ${isListening ? 'listening' : ''}">
            ${isListening ? 'KEY?' : `[${bound}]`}
          </button>
        </div>
      `;
      const rbBtn = row.querySelector(`#rebind-btn-${slot}`);
      if (rbBtn) {
        rbBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          window.startRebinding(slot);
        });
      }
      container.appendChild(row);
    }
  }

  window.selectGuideClass = function () {
    renderClassGuideUI();
  };

  function renderClassGuideUI() {
    const localProfile = getLocalProfile();
    const container = document.getElementById('class-guide-content');
    if (!container) return;

    const resolved = resolveFactionAndClass({
      faction: localProfile.faction,
      classId: localProfile.classId,
      loadout: localProfile.loadout,
      orderTag: localProfile.orderTag,
    });
    const currentClass = resolved.classId;
    const myFaction = resolved.faction;
    const clsMeta = CLASSES_CATALOG[currentClass] || Object.values(CLASSES_CATALOG)[0];
    const facMeta = FACTIONS_META[myFaction] || {};
    const resCfg = getFactionResourceConfig(myFaction);
    const passiveSpec = getClassPassive(currentClass);
    const facColor = facMeta.color || '#facc15';

    const factionAbilities = Object.values(ABILITIES_CATALOG)
      .filter((ab) => ab.id !== 'harvest' && ab.faction === myFaction && (!ab.classId || ab.classId === currentClass))
      .sort((a, b) => (a.tier || 1) - (b.tier || 1) || (a.reqLevel || 1) - (b.reqLevel || 1));

    const slotLabels = ['[1]', '[2]', '[3]', '[4]', '[Q]', '[E]', '[R]', '[F]'];
    const recSource = clsMeta?.legacyDefaultLoadout || clsMeta?.defaultLoadout || {};
    const recIds = [1, 2, 3, 4, 9, 10, 11, 12]
      .map((s) => recSource?.[s])
      .filter((id) => id && ABILITIES_CATALOG[id] && ABILITIES_CATALOG[id].faction === myFaction && (!ABILITIES_CATALOG[id].classId || ABILITIES_CATALOG[id].classId === currentClass));
    for (const ab of factionAbilities) {
      if (recIds.length >= 8) break;
      if (!recIds.includes(ab.id)) recIds.push(ab.id);
    }

    const slotRowsHtml = recIds.slice(0, 8).map((id, idx) => {
      const ab = ABILITIES_CATALOG[id];
      if (!ab) return '';
      return `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1e293b; padding:3px 0; gap:8px; align-items:center;">
          <span style="color:${ab.color || facColor}; display:flex; align-items:center; gap:5px;">${getAbilityIconHtml(ab, 16)}<b>${slotLabels[idx] || `[${idx + 1}]`} ${ab.name}</b> <small style="color:#94a3b8;">(${ab.tcgType} • Lv.${ab.reqLevel || 1})</small></span>
          <span style="color:#94a3b8; text-align:right;">${ab.cost > 0 ? `${ab.cost} Glimmer` : 'Generates Glimmer'} • ${ab.baseCd || 0}s CD</span>
        </div>
      `;
    }).join('');

    const tier1Flash = factionAbilities.find((a) => a.tcgType?.includes('Flash') && (a.tier || 1) === 1) || factionAbilities[0];
    const tier1Rite = factionAbilities.find((a) => a.tcgType?.includes('Rite') && (a.tier || 1) <= 2) || factionAbilities[1] || tier1Flash;
    const midFlashes = factionAbilities.filter((a) => a.tcgType?.includes('Flash') && (a.tier || 1) >= 2 && (a.tier || 1) <= 5);
    const highRites = factionAbilities.filter((a) => a.tcgType?.includes('Rite') && (a.tier || 1) >= 3 && (a.tier || 1) <= 6);
    const apexAbilities = factionAbilities.filter((a) => (a.tier || 1) >= 7);

    const html = `
      <div style="background:rgba(15,23,42,0.85); border:2px solid ${facColor}; border-radius:6px; padding:12px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--font-header); font-size:14px; font-weight:800; color:${facColor}; letter-spacing:0.5px;">
              ${facMeta.icon || '⚔️'} ${(clsMeta?.name || currentClass).toUpperCase()} — ${myFaction.toUpperCase()} TACTICAL CODEX
            </div>
            <div style="font-size:10.5px; color:#e2e8f0; margin-top:2px;">
              Faction: <b>${facMeta.icon || ''} ${myFaction} (${facMeta.title || ''})</b> • Role: <b>${clsMeta?.role || 'Champion'}</b>
            </div>
          </div>
          <div style="background:#0f172a; border:1px solid ${facColor}; padding:4px 8px; border-radius:4px; font-size:9.5px; color:#facc15;">
            EXCLUSIVE TO YOUR ${myFaction.toUpperCase()} PATH
          </div>
        </div>
        <div style="font-size:10px; color:#94a3b8; margin-top:6px; line-height:1.4;">
          ${clsMeta?.desc || ''}
        </div>
        <div style="margin-top:8px; padding:6px 8px; background:rgba(8,14,32,0.9); border:1px solid #334155; border-radius:4px; font-size:9.5px; color:#e2e8f0; display:flex; flex-direction:column; gap:3px;">
          <div><b style="color:${facColor};">✦ CLASS PASSIVE — ${passiveSpec.name}:</b> ${passiveSpec.desc}</div>
          <div><b style="color:#38bdf8;">✦ FACTION RESOURCE — ${resCfg.name}:</b> ${resCfg.desc}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <div style="background:#090d1a; border:1px solid #334155; padding:10px; border-radius:4px;">
          <div style="font-weight:700; color:#facc15; font-size:11px; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
            ⚡ RECOMMENDED ${myFaction.toUpperCase()} 8-SLOT LOADOUT
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; font-size:9.5px;">
            ${slotRowsHtml}
          </div>
        </div>

        <div style="background:#090d1a; border:1px solid #334155; padding:10px; border-radius:4px;">
          <div style="font-weight:700; color:#38bdf8; font-size:11px; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
            📊 STAT ALLOCATION &amp; SCALING (${clsMeta?.name || currentClass})
          </div>
          <div style="display:flex; flex-direction:column; gap:5px; font-size:9.5px; color:#cbd5e1; line-height:1.4;">
            <div>
              <b style="color:#facc15;">Power (Lv.1 ${(clsMeta?.bonusStats?.power || 0) + 2}):</b> Directly amplifies damage dealt by all ${myFaction} Flashes and heavy physical/elemental strikes.
            </div>
            <div>
              <b style="color:#c084fc;">Resonance (Lv.1 ${(clsMeta?.bonusStats?.resonance || 0) + 1}):</b> Scales ${myFaction} Rite potency, healing/shielding strength, and expands your Maximum Glimmer pool.
            </div>
            <div>
              <b style="color:#4ade80;">Bastion (Lv.1 ${(clsMeta?.bonusStats?.bastion || 0) + 2}):</b> Increases Maximum Health and fortifies your defensive mitigation against boss telegraphs.
            </div>
            <div>
              <b style="color:#38bdf8;">Tempo (Lv.1 ${(clsMeta?.bonusStats?.tempo || 0) + 1}):</b> Accelerates Rite channel speed, lowers cooldowns, and boosts critical strike cadence.
            </div>
          </div>
        </div>
      </div>

      <div style="background:#090d1a; border:1px solid #1e293b; padding:12px; border-radius:4px; margin-bottom:8px;">
        <div style="font-weight:700; color:#fde047; font-size:11.5px; margin-bottom:8px; font-family:var(--font-header);">
          ⚔️ ${myFaction.toUpperCase()} COMBAT ROTATION &amp; SPELLBOOK PROGRESSION
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; font-size:10px; color:#cbd5e1; line-height:1.45;">
          <div>
            <b style="color:#facc15;">1. Glimmer Builder (Lv. 1 Starter Flash):</b>
            Open with <b>${tier1Flash?.name || 'Starter Flash'} [1]</b> to strike immediately and build your ${resCfg.name} &amp; Glimmer reserves without cast time.
          </div>
          <div>
            <b style="color:#38bdf8;">2. Core Channeled Rite (Lv. ${tier1Rite?.reqLevel || 1}+):</b>
            Spend your Glimmer channeling <b>${tier1Rite?.name || 'Core Rite'}</b> (${tier1Rite?.desc || ''}).
          </div>
          <div>
            <b style="color:#4ade80;">3. Class Specialization &amp; Mobility Flashes (Lv. 3–18):</b>
            Unlock ${midFlashes.map((a) => `<b>${a.name}</b> (Lv.${a.reqLevel || 1})`).join(', ') || `mid-tier ${myFaction} Flashes`} in the <b>⚡ Flashes</b> tab to dodge boss telegraphs, shield yourself, and control positioning.
          </div>
          <div>
            <b style="color:#c084fc;">4. High-Tier ${myFaction} Rites (Lv. 6–24):</b>
            Invest Skill Points into ${highRites.map((a) => `<b>${a.name}</b> (Lv.${a.reqLevel || 1})`).join(', ') || `high-tier ${myFaction} Rites`} in the <b>☀️ Rites</b> tab to dominate dungeon elites and multi-phase bosses.
          </div>
          <div>
            <b style="color:#ef4444;">5. Level 70 Capstone &amp; Paragon:</b>
            Unlock your ultimate ${clsMeta?.name || myFaction} capstones (${apexAbilities.map((a) => `<b>${a.name}</b> (${a.tcgType})`).join(' &amp; ') || 'Tier 7 Apex Spells'}) and climb up to Level 70 + Paragon 100 in Founder's Edition!
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function renderStatsModal() {
    const localProfile = getLocalProfile();
    const prog = getProg();
    const player = getPlayer();
    const body = document.getElementById('stats-modal-body');
    if (!body) return;
    const eff = getEffectiveStats(prog, localProfile.equipment, localProfile.classId);
    const fm = FACTIONS_META[localProfile.faction] || FACTIONS_META.Solari;
    const statDefs = [
      { key: 'power', icon: '⚔️', name: 'POWER', base: prog.stats.power, total: eff.power, desc: '+1 Base Damage on all Rites & Flashes' },
      { key: 'bastion', icon: '🛡️', name: 'BASTION', base: prog.stats.bastion, total: eff.bastion, desc: '+3 Max HP, +3 Shield Barriers, +2 Healing' },
      { key: 'resonance', icon: '🔮', name: 'RESONANCE', base: prog.stats.resonance, total: eff.resonance, desc: '+8 Max Glimmer & bonus Glimmer generation' },
      { key: 'tempo', icon: '⚡', name: 'TEMPO (FLASH)', base: prog.stats.tempo, total: eff.tempo, desc: '+2.5% Crit, +3% Move Speed, -2% Cooldowns' },
    ];
    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#080c18; border:2px solid #1e293b; padding:10px 12px; margin-bottom:10px; font-size:12px;">
        <div>CHAMPION LEVEL: <b style="color:#facc15; font-size:13px;">LV. ${prog.level}</b> <span style="color:#94a3b8; font-size:11px;">(${prog.xp}/${xpForNextLevel(prog.level)} XP)</span></div>
        <div style="color:${prog.statPoints > 0 ? '#4ade80' : '#94a3b8'}; font-weight:bold; font-size:12px;">
          UNSPENT STAT POINTS: <span class="skill-pts-badge" style="font-size:12px; padding:2px 7px;">${prog.statPoints}</span>
        </div>
      </div>
      <div style="background:#080c18; border-left:3px solid ${fm.color}; padding:8px 10px; margin-bottom:10px; font-size:11px; line-height:1.45; display:flex; align-items:center; gap:8px;">
        <img src="${fm.logo}" alt="${fm.id}" style="width:22px; height:22px; object-fit:contain; filter:drop-shadow(0 0 3px ${fm.color}); flex-shrink:0;" />
        <div>
          <b style="color:${fm.color}; font-size:12px;">${fm.mechanicName}:</b> ${fm.mechanicDesc}
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
        ${statDefs.map((s) => `
          <div class="keybind-row" style="margin-bottom:0; padding:8px 10px;">
            <div>
              <div style="font-size:12px; color:#f8fafc;">
                ${s.icon} <b style="letter-spacing:0.02em;">${s.name}</b>: <span style="color:#facc15; font-weight:800; font-size:13px;">${s.total}</span>
                <span style="font-size:10.5px; color:#94a3b8;">(Base ${s.base} + Gear ${s.total - s.base})</span>
              </div>
              <div style="font-size:10.5px; color:#cbd5e1; margin-top:3px;">${s.desc}</div>
            </div>
            <button class="upgrade-btn ${prog.statPoints > 0 ? 'ready' : ''}" style="font-size:11px; padding:6px 12px;" ${prog.statPoints > 0 ? '' : 'disabled'} onclick="allocateStat('${s.key}')">
              +1 STAT
            </button>
          </div>
        `).join('')}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11.5px; background:#080c18; border:2px solid #1e293b; padding:10px 12px; margin-bottom:10px;">
        <div>MAX HEALTH: <b style="color:#4ade80;">${player.maxHp} HP</b></div>
        <div>MAX GLIMMER: <b style="color:#facc15;">${player.maxSolarCharge}</b></div>
        <div>CRIT CHANCE: <b style="color:#fde047;">${(calcCritChance(prog, localProfile.equipment, localProfile.classId) * 100).toFixed(1)}%</b></div>
        <div>COOLDOWN MULT: <b style="color:#38bdf8;">${Math.round(calcCdMult(prog, localProfile.equipment, localProfile.classId, localProfile.faction) * 100)}%</b></div>
      </div>

      <!-- Late Game Paragon Resonance Mastery -->
      <div style="background:#090618; border:2px solid #581c87; padding:10px 12px; margin-top:8px; font-size:11px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <span style="color:#c084fc; font-weight:bold; font-size:12px; font-family:var(--font-header);">🔮 PARAGON RESONANCE:</span>
            <b style="color:#facc15; font-size:12px;">PARAGON ${prog.paragonLevel || 0}</b>
            <span style="font-size:10px; color:#94a3b8;">(${prog.paragonXp || 0}/${paragonXpForLevel(prog.paragonLevel || 0)} XP)</span>
          </div>
          <div style="color:${(prog.paragonPoints || 0) > 0 ? '#4ade80' : '#94a3b8'}; font-weight:bold; font-size:11px;">
            PARAGON PTS: <span class="skill-pts-badge" style="font-size:11px; padding:2px 6px;">${prog.paragonPoints || 0}</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${Object.values(PARAGON_AFFINITIES).map((aff) => {
            const curRank = prog.paragon?.[aff.id] || 0;
            const canUp = canUpgradeParagon(prog, aff.id);
            return `
              <div class="keybind-row" style="margin-bottom:0; padding:6px 10px; border-color:#3b0764; background:#0f0926;">
                <div>
                  <div style="font-size:11.5px; color:${aff.color}; font-weight:bold;">
                    ${aff.icon} ${aff.name} <span style="color:#f8fafc; font-size:10px;">[Rank ${curRank}/${aff.maxRank}]</span>
                  </div>
                  <div style="font-size:10px; color:#cbd5e1; margin-top:2px;">${aff.desc}</div>
                </div>
                <button class="upgrade-btn ${canUp ? 'ready' : ''}" style="padding:5px 10px; font-size:10.5px;" ${canUp ? '' : 'disabled'} onclick="upgradeParagon('${aff.id}')">
                  ${curRank >= aff.maxRank ? 'MAX' : '+INVEST'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function refreshSocialModalView() {
    const localProfile = getLocalProfile();
    const prog = getProg();
    const player = getPlayer();
    const currentRoomId = getCurrentRoomId();
    const publicRoomsList = getPublicRoomsList();
    const currentParty = getCurrentParty();
    const roomPlayers = [
      {
        id: net.playerId || localProfile.id,
        name: localProfile.displayName,
        faction: localProfile.faction,
        orderTag: localProfile.orderTag,
        level: prog.level,
        hp: player.hp,
        maxHp: player.maxHp,
      },
      ...Array.from(remotePlayers.values()),
    ];
    renderSocialModal({
      rooms: publicRoomsList,
      currentRoomId,
      roomPlayers,
      selfId: net.playerId || localProfile.id,
      party: currentParty,
    });
    updateTouchUiButtons(document.body.classList.contains('touch-mode'));
  }


  return {
    renderSkillTreeUI,
    renderKeybindUI,
    renderClassGuideUI,
    renderStatsModal,
    refreshSocialModalView,
  };
}
