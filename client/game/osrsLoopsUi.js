// ==========================================
// GlimmerFall Online 2D — OSRS Loops UI Module
// Vanguard Slayer Contracts, Treasure Trails Clue Dialog, Collection Log & Drop Table Viewer
// ==========================================

import {
  EQUIPMENT_CATALOG,
  SLAYER_MASTERS,
  SLAYER_UNLOCKS,
  normalizeSlayerState,
  normalizeClueState,
  getCollectionSummary,
  getMobDropTablePreview,
} from '../../shared/protocol.js';

function esc(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSlayerPanelHtml(prog = {}) {
  const sl = normalizeSlayerState(prog.slayer);
  const lvl = prog.level || 1;
  const pct = sl.task ? Math.min(100, Math.round(((sl.task.progress || 0) / Math.max(1, sl.task.targetCount)) * 100)) : 0;

  return `
    <div style="background:#080d1e; border:2px solid #fb923c; border-radius:6px; padding:10px 12px; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; border-bottom:1px solid #1e293b; padding-bottom:6px; margin-bottom:8px;">
        <div>
          <span style="font-family:var(--font-header); font-size:12px; font-weight:800; color:#fb923c;">
            🗡️ VANGUARD SLAYER CONTRACTS
          </span>
          <span style="font-size:9.5px; color:#94a3b8; margin-left:6px;">
            Slayer Points: <b style="color:#fde047;">${sl.points}</b> · Streak: <b style="color:#4ade80;">${sl.streak}</b> · Completed: <b>${sl.completedTasks}</b>
          </span>
        </div>
        ${sl.task ? `
          <div style="display:flex; gap:4px;">
            <button type="button" class="id-mini-btn" style="border-color:#f59e0b; color:#fde047;" onclick="skipSlayerContract(false)" title="Skip Task (10 Pts or resets streak)">
              SKIP (${sl.points >= 10 ? '10 Pts' : 'Reset Streak'})
            </button>
            <button type="button" class="id-mini-btn" style="border-color:#ef4444; color:#fca5a5;" onclick="skipSlayerContract(true)" title="Block permanently for 25 Slayer Points">
              🚫 BLOCK (25 Pts)
            </button>
          </div>
        ` : ''}
      </div>

      ${sl.task ? `
        <div style="background:#050814; border:1px solid #334155; border-radius:4px; padding:8px 10px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <b style="color:#fde047; font-size:11px;">🎯 Current Task: ${esc(sl.task.name)}</b>
            <span style="font-size:10px; font-weight:bold; color:#4ade80;">${sl.task.progress} / ${sl.task.targetCount} (${pct}%)</span>
          </div>
          <div style="width:100%; height:7px; background:#0f172a; border-radius:4px; overflow:hidden; margin-bottom:4px;">
            <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #f97316, #facc15);"></div>
          </div>
          <div style="font-size:9px; color:#94a3b8; display:flex; justify-content:space-between;">
            <span>Zone Hint: <b style="color:#7dd3fc;">${esc(sl.task.roomHint)}</b></span>
            <span>Reward: <b style="color:#fde047;">+${sl.task.pointsReward} Slayer Pts</b> (+Streak Bonus at 5/10/25/50)</span>
          </div>
        </div>
      ` : `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:6px; margin-bottom:8px;">
          ${Object.values(SLAYER_MASTERS).map((m) => {
            const locked = lvl < m.minLevel;
            return `
              <div style="background:#050814; border:1px solid ${locked ? '#334155' : m.color}; border-radius:4px; padding:7px 9px; display:flex; flex-direction:column; justify-content:space-between; gap:4px; opacity:${locked ? 0.65 : 1};">
                <div>
                  <div style="font-size:10.5px; font-weight:bold; color:${m.color};">${m.icon} ${esc(m.name)} (Lv.${m.minLevel}+)</div>
                  <div style="font-size:8.5px; color:#94a3b8; line-height:1.35;">${esc(m.desc)}</div>
                </div>
                <button type="button" class="util-btn" ${locked ? 'disabled' : ''} style="font-size:9px; padding:3px 6px; border-color:${m.color}; color:${m.color};" onclick="assignSlayerContract('${m.id}')">
                  ${locked ? `Requires Lv.${m.minLevel}` : '📜 ASSIGN CONTRACT ▸'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${Object.values(SLAYER_UNLOCKS).map((u) => {
          const unlocked = sl.unlockedPerks.includes(u.id);
          return `
            <button type="button" class="id-mini-btn"
              style="padding:3px 7px; font-size:8.5px; border-color:${unlocked && !u.grantItemId ? '#22c55e' : '#38bdf8'}; color:${unlocked && !u.grantItemId ? '#4ade80' : '#bae6fd'};"
              onclick="buySlayerUnlock('${u.id}')"
              title="${esc(u.desc)}">
              ${u.icon} ${esc(u.name)} (${unlocked && !u.grantItemId ? 'UNLOCKED ✓' : `${u.cost} Pts`})
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderCollectionLogView(body, prog = {}) {
  if (!body) return;
  const summary = getCollectionSummary(prog.collectionLog || {});
  const pct = summary.total > 0 ? Math.round((summary.obtained / summary.total) * 100) : 0;

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div style="background:#080d1e; border:2px solid #facc15; border-radius:6px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-family:var(--font-header); font-size:13px; color:#fde047; font-weight:800;">
            📖 ADVENTURER COLLECTION LOG
          </div>
          <div style="font-size:10px; color:#94a3b8;">
            Permanent trophy ledger across World Bosses, Treasure Trails, Slayer &amp; 99 Mastery Capes.
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px; font-weight:800; color:#4ade80;">${summary.obtained} / ${summary.total} (${pct}%)</div>
          <div style="font-size:8.5px; color:#cbd5e1;">Collected Uniques</div>
        </div>
      </div>

      ${summary.categories.map((cat) => `
        <div style="background:#080c18; border:1px solid ${cat.obtained === cat.total ? '#22c55e' : '#1e293b'}; border-radius:6px; padding:9px 11px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; border-bottom:1px solid #1e293b; padding-bottom:4px;">
            <b style="font-size:11px; color:#f8fafc;">${cat.icon} ${esc(cat.name)}</b>
            <span style="font-size:9.5px; font-weight:bold; color:${cat.obtained === cat.total ? '#4ade80' : '#facc15'};">
              ${cat.obtained} / ${cat.total} ${cat.obtained === cat.total ? 'GREEN LOG ✓' : ''}
            </span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:6px;">
            ${cat.entries.map((entry) => {
              const def = EQUIPMENT_CATALOG[entry.id] || { name: entry.id, icon: '📦', desc: '' };
              return `
                <div style="background:${entry.obtained ? 'rgba(34,197,94,0.12)' : '#050814'}; border:1px solid ${entry.obtained ? '#22c55e' : '#1e293b'}; border-radius:4px; padding:6px 8px; opacity:${entry.obtained ? 1 : 0.48}; display:flex; align-items:center; gap:6px;" title="${esc(def.desc || def.name)}">
                  <span style="font-size:15px;">${def.icon || '📦'}</span>
                  <div style="min-width:0; flex:1;">
                    <div style="font-size:9.5px; font-weight:bold; color:${entry.obtained ? '#86efac' : '#94a3b8'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(def.name)}</div>
                    <div style="font-size:8px; color:${entry.obtained ? '#fde047' : '#64748b'};">${entry.obtained ? `Obtained ×${entry.count}` : 'Not yet found'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderDropTableModal(ent) {
  const modal = document.getElementById('drop-table-modal');
  const body = document.getElementById('drop-table-modal-body');
  if (!modal || !body || !ent) return;
  const rows = getMobDropTablePreview(ent);
  body.innerHTML = `
    <div style="margin-bottom:8px; background:#080d1e; border:1px solid #334155; border-radius:5px; padding:8px 10px;">
      <div style="font-family:var(--font-header); font-size:12px; color:#fde047; font-weight:800;">
        👾 ${esc(ent.name)}
      </div>
      <div style="font-size:9.5px; color:#94a3b8; margin-top:2px;">
        ${esc(ent.sub || (ent.isBoss ? 'World Boss' : 'Continental Creature'))} · Max HP: <b style="color:#4ade80;">${ent.maxHp || ent.hp || '?'}</b>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; gap:5px;">
      ${rows.map((r) => {
        const def = EQUIPMENT_CATALOG[r.itemId] || {};
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:#050814; border:1px solid #1e293b; border-radius:4px; padding:6px 9px;">
            <div style="display:flex; align-items:center; gap:7px;">
              <span style="font-size:14px;">${def.icon || '🎁'}</span>
              <div>
                <div style="font-size:10px; font-weight:bold; color:#f8fafc;">${esc(def.name || r.label)}</div>
                <div style="font-size:8.5px; color:#94a3b8;">${esc(r.label)}</div>
              </div>
            </div>
            <span style="font-size:9px; font-weight:bold; color:#fde047; background:#0f172a; border:1px solid #334155; padding:2px 6px; border-radius:3px;">
              ${esc(r.rate)}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  if (typeof window.toggleModal === 'function' && modal.style.display !== 'block') {
    window.toggleModal('drop-table-modal');
  }
}

export function renderClueScrollModal({ clue, itemId = null, roomType = '', x = 0, y = 0, feedback = '' }) {
  const modal = document.getElementById('clue-scroll-modal');
  const body = document.getElementById('clue-scroll-modal-body');
  if (!modal || !body) return;
  const st = normalizeClueState(clue);
  const step = st.steps?.[st.stepIndex] || null;
  const tierLabel = String(st.activeTier || 'easy').toUpperCase();

  body.innerHTML = `
    <div style="background:linear-gradient(180deg, #422006 0%, #271303 100%); border:2px solid #f59e0b; border-radius:6px; padding:12px 14px; color:#fef3c7;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(251,191,36,0.3); padding-bottom:6px; margin-bottom:8px;">
        <span style="font-family:var(--font-header); font-size:12px; font-weight:800; color:#fde047;">
          📜 TREASURE TRAIL (${tierLabel})
        </span>
        <span style="font-size:9.5px; color:#fcd34d; font-weight:bold;">
          Step ${st.stepIndex + 1} / ${Math.max(1, st.steps.length)} · Trails Solved: ${st.completedCount}
        </span>
      </div>
      ${step ? `
        <div style="font-size:11px; line-height:1.5; color:#fffbeb; margin-bottom:10px; background:rgba(0,0,0,0.28); padding:9px 10px; border-radius:4px; border:1px solid rgba(251,191,36,0.25);">
          ${esc(step.prompt)}
        </div>
        <div style="font-size:9px; color:#fde68a; margin-bottom:10px; display:flex; justify-content:space-between;">
          <span>Your Location: <b>${esc(roomType)}</b> (${Math.round(x)}, ${Math.round(y)})</span>
          ${step.kind === 'coord' ? `<span>Target: (${step.x}, ${step.y})</span>` : ''}
        </div>
      ` : `
        <div style="font-size:10.5px; color:#fde68a; margin-bottom:10px;">
          Click below to unseal your Clue Scroll and reveal the first step!
        </div>
      `}
      ${feedback ? `<div style="font-size:9.5px; color:#fca5a5; margin-bottom:8px; font-weight:bold;">⚠️ ${esc(feedback)}</div>` : ''}
      <button type="button" class="util-btn" style="width:100%; padding:7px 10px; border-color:#facc15; background:#854d0e; color:#fffbeb; font-weight:bold;" onclick="attemptActiveClueScroll('${esc(itemId || '')}')">
        ⛏️ ATTEMPT / EXCAVATE CLUE STEP ▸
      </button>
    </div>
  `;
  if (typeof window.toggleModal === 'function' && modal.style.display !== 'block') {
    window.toggleModal('clue-scroll-modal');
  }
}
