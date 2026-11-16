// ==========================================
// GlimmerFall Online — RuneLite-Style Right-Side Skilling XP Tracker
// ==========================================

import {
  PROFESSIONS_CATALOG,
  getProfessionLevelFromXp,
  getXpForProfessionLevel,
} from '../../shared/protocol.js';
import { getSkillIconSvg } from '../ui/skillIcons.js';

export const SKILLING_PROFESSION_IDS = new Set([
  'resonance_extraction',
  'relic_forging',
  'rite_binding',
  'glimmerweaving',
]);

export const DEFAULT_XP_TRACKER_IDLE_MS = 45_000;

export function formatCompactXp(value) {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

export function formatDurationShort(totalSeconds) {
  const secs = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${String(remMins).padStart(2, '0')}m`;
}

/**
 * Compute exact level, XP bracket, remaining XP, and % progress toward next level.
 */
export function computeSkillProgressSnapshot(professionId, totalXp, levelCap = 99) {
  const cap = Math.max(1, Math.min(99, Math.floor(Number(levelCap) || 99)));
  const safeXp = Math.max(0, Math.floor(Number(totalXp) || 0));
  const rawLevel = getProfessionLevelFromXp(safeXp);
  const level = Math.min(cap, Math.max(1, rawLevel));
  const isMaxed = level >= cap;
  const nextLevel = isMaxed ? cap : level + 1;

  const currentLevelXp = getXpForProfessionLevel(level);
  const nextLevelXp = isMaxed ? currentLevelXp : getXpForProfessionLevel(nextLevel);
  const xpSpan = isMaxed ? 1 : Math.max(1, nextLevelXp - currentLevelXp);
  const xpIntoLevel = isMaxed ? xpSpan : Math.max(0, safeXp - currentLevelXp);
  const xpRemaining = isMaxed ? 0 : Math.max(0, nextLevelXp - safeXp);
  const rawPct = isMaxed ? 100 : (xpIntoLevel / xpSpan) * 100;
  const percent = isMaxed ? 100 : Math.min(99.9, Math.max(0, Number(rawPct.toFixed(1))));

  return {
    professionId,
    totalXp: safeXp,
    level,
    nextLevel,
    levelCap: cap,
    isMaxed,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpSpan,
    xpRemaining,
    percent,
  };
}

export function createXpTrackerState(filterMode = 'skilling') {
  return {
    filterMode: filterMode === 'all' ? 'all' : 'skilling',
    entries: {},
  };
}

/**
 * Record an XP gain into a RuneLite tracker session entry without mutating the input object.
 */
export function recordXpGain(
  state,
  { professionId, amount, totalXpAfter, levelCap = 99, nowMs = Date.now(), reason = '' }
) {
  if (!professionId || !(Number(amount) > 0)) return state;
  const base = state && typeof state === 'object' ? state : createXpTrackerState();
  const prev = base.entries?.[professionId];
  const gain = Math.round(Number(amount));
  const afterXp = Math.max(0, Math.floor(Number(totalXpAfter) || 0));
  const beforeXp = Math.max(0, afterXp - gain);
  const beforeLevel = Math.min(levelCap, getProfessionLevelFromXp(beforeXp));

  const nextEntry = prev
    ? {
        ...prev,
        totalXp: afterXp,
        levelCap,
        sessionXp: prev.sessionXp + gain,
        lastGainXp: gain,
        lastReason: reason || prev.lastReason || '',
        lastGainAt: nowMs,
        actionsCount: prev.actionsCount + 1,
      }
    : {
        professionId,
        startXp: beforeXp,
        startLevel: beforeLevel,
        totalXp: afterXp,
        levelCap,
        sessionXp: gain,
        lastGainXp: gain,
        lastReason: reason || '',
        firstGainAt: nowMs,
        lastGainAt: nowMs,
        actionsCount: 1,
        pinned: false,
        dismissedAt: 0,
      };

  return {
    ...base,
    entries: {
      ...(base.entries || {}),
      [professionId]: nextEntry,
    },
  };
}

export function toggleTrackerPin(state, professionId, nowMs = Date.now(), snapshot = null) {
  const base = state && typeof state === 'object' ? state : createXpTrackerState();
  const existing = base.entries?.[professionId];
  if (existing) {
    return {
      ...base,
      entries: {
        ...base.entries,
        [professionId]: {
          ...existing,
          pinned: !existing.pinned,
          dismissedAt: 0,
          lastGainAt: existing.lastGainAt || nowMs,
        },
      },
    };
  }
  if (!snapshot) return base;
  return {
    ...base,
    entries: {
      ...base.entries,
      [professionId]: {
        professionId,
        startXp: snapshot.totalXp,
        startLevel: snapshot.level,
        totalXp: snapshot.totalXp,
        levelCap: snapshot.levelCap,
        sessionXp: 0,
        lastGainXp: 0,
        lastReason: '',
        firstGainAt: nowMs,
        lastGainAt: nowMs,
        actionsCount: 0,
        pinned: true,
        dismissedAt: 0,
      },
    },
  };
}

export function dismissTrackerEntry(state, professionId, nowMs = Date.now()) {
  const base = state && typeof state === 'object' ? state : createXpTrackerState();
  const existing = base.entries?.[professionId];
  if (!existing) return base;
  return {
    ...base,
    entries: {
      ...base.entries,
      [professionId]: {
        ...existing,
        pinned: false,
        dismissedAt: nowMs,
      },
    },
  };
}

export function resetTrackerEntry(state, professionId, currentXp, levelCap = 99, nowMs = Date.now()) {
  const base = state && typeof state === 'object' ? state : createXpTrackerState();
  const existing = base.entries?.[professionId];
  if (!existing) return base;
  const safeXp = Math.max(0, Math.floor(Number(currentXp) || 0));
  return {
    ...base,
    entries: {
      ...base.entries,
      [professionId]: {
        ...existing,
        startXp: safeXp,
        startLevel: Math.min(levelCap, getProfessionLevelFromXp(safeXp)),
        totalXp: safeXp,
        levelCap,
        sessionXp: 0,
        lastGainXp: 0,
        firstGainAt: nowMs,
        lastGainAt: nowMs,
        actionsCount: 0,
      },
    },
  };
}

/**
 * Compute derived RuneLite statistics (XP/hr, actions remaining, ETA, from -> to levels).
 */
export function computeTrackerDerivedStats(entry, nowMs = Date.now()) {
  const snapshot = computeSkillProgressSnapshot(entry.professionId, entry.totalXp, entry.levelCap || 99);
  // Floor session elapsed window to 10s when freshly started so XP/hr never spikes to infinity on the first click
  const rawElapsedMs = Math.max(0, nowMs - (entry.firstGainAt || nowMs));
  const effectiveElapsedHrs = Math.max(10_000, rawElapsedMs) / 3_600_000;
  const xpPerHour = entry.sessionXp > 0 ? Math.round(entry.sessionXp / effectiveElapsedHrs) : 0;

  const actionsRemaining =
    !snapshot.isMaxed && entry.lastGainXp > 0 && snapshot.xpRemaining > 0
      ? Math.ceil(snapshot.xpRemaining / entry.lastGainXp)
      : 0;

  const etaSeconds =
    !snapshot.isMaxed && xpPerHour > 0 && snapshot.xpRemaining > 0
      ? Math.round((snapshot.xpRemaining / xpPerHour) * 3600)
      : null;

  return {
    ...snapshot,
    startLevel: entry.startLevel || snapshot.level,
    startXp: entry.startXp ?? snapshot.totalXp,
    levelsGained: Math.max(0, snapshot.level - (entry.startLevel || snapshot.level)),
    sessionXp: entry.sessionXp || 0,
    lastGainXp: entry.lastGainXp || 0,
    lastReason: entry.lastReason || '',
    actionsCount: entry.actionsCount || 0,
    pinned: Boolean(entry.pinned),
    xpPerHour,
    actionsRemaining,
    etaSeconds,
    lastGainAt: entry.lastGainAt || nowMs,
  };
}

/**
 * Select active trackers for the right-side dock ("only while skilling" unless pinned/all).
 */
export function getVisibleTrackers(
  state,
  nowMs = Date.now(),
  { idleTimeoutMs = DEFAULT_XP_TRACKER_IDLE_MS, maxVisible = 4 } = {}
) {
  const base = state && typeof state === 'object' ? state : createXpTrackerState();
  const mode = base.filterMode || 'skilling';
  const list = [];

  for (const entry of Object.values(base.entries || {})) {
    if (!entry || !entry.professionId) continue;
    const isSkilling = SKILLING_PROFESSION_IDS.has(entry.professionId);
    if (mode === 'skilling' && !isSkilling && !entry.pinned) continue;
    if (entry.dismissedAt && entry.lastGainAt <= entry.dismissedAt && !entry.pinned) continue;
    if (!entry.pinned && nowMs - (entry.lastGainAt || 0) > idleTimeoutMs) continue;
    list.push(computeTrackerDerivedStats(entry, nowMs));
  }

  list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.lastGainAt - a.lastGainAt;
  });

  return list.slice(0, maxVisible);
}

/**
 * Bind and render the RuneLite-style XP tracker cards inside `#xp-tracker-dock`
 * plus the anchored hover detail tooltip (`#xp-tracker-tooltip`).
 */
export function setupXpTrackerHud({ doc, getProgression, getLevelCap }) {
  if (!doc) return null;
  const dock = doc.getElementById('xp-tracker-dock');
  const tooltip = doc.getElementById('xp-tracker-tooltip');
  if (!dock) return null;

  let state = createXpTrackerState('skilling');
  let hoveredProfId = null;
  let lastRenderKey = '';

  const buildTooltipHtml = (stat) => {
    const info = PROFESSIONS_CATALOG[stat.professionId] || { name: stat.professionId, icon: '✨', color: '#38bdf8' };
    const fromToCurrent = stat.isMaxed
      ? `Lv. ${stat.level} (MAX)`
      : `Lv. ${stat.level} → Lv. ${stat.nextLevel}`;
    const sessionLevelsText =
      stat.levelsGained > 0
        ? `Lv. ${stat.startLevel} → Lv. ${stat.level} (+${stat.levelsGained})`
        : `Started Lv. ${stat.startLevel}`;
    const xpRatioText = stat.isMaxed
      ? `${stat.totalXp.toLocaleString('en-US')} XP (Cap Reached)`
      : `${stat.xpIntoLevel.toLocaleString('en-US')} / ${stat.xpSpan.toLocaleString('en-US')} XP`;
    const actionsText = stat.isMaxed
      ? 'Maxed!'
      : stat.actionsRemaining > 0
        ? `~${stat.actionsRemaining.toLocaleString('en-US')} actions (+${stat.lastGainXp} XP ea)`
        : '—';
    const etaText = stat.etaSeconds !== null ? formatDurationShort(stat.etaSeconds) : '—';
    const iconSvg = getSkillIconSvg(stat.professionId, 24) || info.icon;
    const sourceRow = stat.lastReason
      ? `<span>Last Action</span><strong>${String(stat.lastReason).replace(/</g, '&lt;').slice(0, 28)}</strong>`
      : '';

    return `
      <div class="xpt-tt-head" style="border-bottom-color:${info.color}55;">
        <span class="xpt-tt-icon">${iconSvg}</span>
        <div>
          <div class="xpt-tt-name" style="color:${info.color}">${info.name}</div>
          <div class="xpt-tt-sub">${fromToCurrent} • ${stat.percent.toFixed(1)}%</div>
        </div>
      </div>
      <div class="xpt-tt-grid">
        <span>Level Goal</span><strong>${fromToCurrent}</strong>
        <span>Current Bracket</span><strong>${xpRatioText}</strong>
        <span>Remaining to Lv.${stat.nextLevel}</span><strong>${stat.isMaxed ? '0 XP' : `${stat.xpRemaining.toLocaleString('en-US')} XP`}</strong>
        <span>Total Skill XP</span><strong>${stat.totalXp.toLocaleString('en-US')} XP</strong>
        <span>Session Gain</span><strong>${sessionLevelsText} (+${stat.sessionXp.toLocaleString('en-US')} XP)</strong>
        <span>Training Rate</span><strong>${stat.xpPerHour > 0 ? `${formatCompactXp(stat.xpPerHour)} XP/hr` : '—'}</strong>
        <span>Actions Left</span><strong>${actionsText}</strong>
        <span>Est. Time to Level</span><strong>${etaText}</strong>
        ${sourceRow}
      </div>
    `;
  };

  const positionTooltip = (cardEl, stat) => {
    if (!tooltip || !cardEl || !stat) return;
    tooltip.innerHTML = buildTooltipHtml(stat);
    tooltip.style.display = 'block';
    const rect = cardEl.getBoundingClientRect();
    const ttW = tooltip.offsetWidth || 236;
    const ttH = tooltip.offsetHeight || 156;
    const left = Math.max(10, rect.left - ttW - 10);
    const maxTop = Math.max(12, (doc.defaultView?.innerHeight || 720) - ttH - 12);
    const top = Math.min(maxTop, Math.max(12, rect.top - 4));
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  };

  const hideTooltip = () => {
    if (tooltip) tooltip.style.display = 'none';
  };

  const render = (force = false, pulseProfId = null, pulseAmount = 0) => {
    const nowMs = Date.now();
    const visible = getVisibleTrackers(state, nowMs);

    if (visible.length === 0) {
      if (lastRenderKey !== 'empty' || force) {
        lastRenderKey = 'empty';
        dock.innerHTML = '';
        dock.style.display = 'none';
        hoveredProfId = null;
        hideTooltip();
      }
      return;
    }

    const renderKey = `${state.filterMode}|${visible
      .map((s) => `${s.professionId}:${s.totalXp}:${s.level}:${s.pinned ? 1 : 0}:${s.xpPerHour}:${s.actionsRemaining}`)
      .join(',')}`;

    if (renderKey === lastRenderKey && !force && !pulseProfId) return;
    lastRenderKey = renderKey;
    dock.style.display = 'flex';

    dock.innerHTML = '';

    // Compact RuneLite Header Bar
    const header = doc.createElement('div');
    header.className = 'xpt-header';
    const modeLabel = state.filterMode === 'skilling' ? '⚒️ SKILLING' : '🌐 ALL SKILLS';
    header.innerHTML = `
      <span class="xpt-header-title">📈 XP TRACKER</span>
      <div class="xpt-header-actions">
        <button type="button" class="xpt-mini-btn" data-xpt-mode title="Toggle Skilling-Only / All Skills">${modeLabel}</button>
        <button type="button" class="xpt-mini-btn" data-xpt-clear title="Reset &amp; Clear Trackers">↺</button>
      </div>
    `;
    header.querySelector('[data-xpt-mode]')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      state = { ...state, filterMode: state.filterMode === 'skilling' ? 'all' : 'skilling' };
      render(true);
    });
    header.querySelector('[data-xpt-clear]')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      state = createXpTrackerState(state.filterMode);
      hoveredProfId = null;
      hideTooltip();
      render(true);
    });
    dock.appendChild(header);

    for (const stat of visible) {
      const info = PROFESSIONS_CATALOG[stat.professionId] || { name: stat.professionId, icon: '✨', color: '#38bdf8' };
      const card = doc.createElement('div');
      card.className = 'xpt-card' + (stat.pinned ? ' pinned' : '') + (pulseProfId === stat.professionId ? ' pulse' : '');
      card.style.borderLeftColor = info.color;
      card.dataset.profId = stat.professionId;

      const lvlBadge = stat.isMaxed ? `Lv.${stat.level} MAX` : `Lv.${stat.level}→${stat.nextLevel}`;
      const rateBadge = stat.xpPerHour > 0 ? `${formatCompactXp(stat.xpPerHour)}/hr` : 'Tracked';
      const actionsShort =
        !stat.isMaxed && stat.actionsRemaining > 0
          ? `• ~${stat.actionsRemaining} left`
          : stat.sessionXp > 0
            ? `• +${formatCompactXp(stat.sessionXp)}`
            : '';

      const cardIconSvg = getSkillIconSvg(stat.professionId, 16) || info.icon;

      card.innerHTML = `
        <div class="xpt-row-top">
          <div class="xpt-skill-id">
            <span class="xpt-icon">${cardIconSvg}</span>
            <span class="xpt-name">${info.name}</span>
          </div>
          <div class="xpt-controls">
            <span class="xpt-lvl" style="color:${info.color}">${lvlBadge}</span>
            <button type="button" class="xpt-card-btn${stat.pinned ? ' active' : ''}" data-pin title="${stat.pinned ? 'Unpin' : 'Pin tracker on HUD'}">📌</button>
            <button type="button" class="xpt-card-btn" data-close title="Hide tracker (Ctrl+Click to Reset)">✕</button>
          </div>
        </div>
        <div class="xpt-bar-wrap">
          <div class="xpt-bar-fill" style="width:${stat.percent}%; background: linear-gradient(90deg, ${info.color}cc, ${info.color});"></div>
          <span class="xpt-bar-pct">${stat.percent.toFixed(1)}%</span>
        </div>
        <div class="xpt-row-meta">
          <span>${rateBadge} ${actionsShort}</span>
          <span>${stat.isMaxed ? 'MASTER' : `${formatCompactXp(stat.xpRemaining)} XP left`}</span>
        </div>
      `;

      if (pulseProfId === stat.professionId && pulseAmount > 0) {
        const dropEl = doc.createElement('div');
        dropEl.className = 'xpt-xp-drop';
        dropEl.style.color = info.color;
        dropEl.textContent = `+${pulseAmount} ${info.icon} XP`;
        card.appendChild(dropEl);
      }

      card.addEventListener('mouseenter', () => {
        hoveredProfId = stat.professionId;
        positionTooltip(card, stat);
      });
      card.addEventListener('mouseleave', () => {
        if (hoveredProfId === stat.professionId) {
          hoveredProfId = null;
          hideTooltip();
        }
      });

      card.querySelector('[data-pin]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        state = toggleTrackerPin(state, stat.professionId);
        render(true);
      });
      card.querySelector('[data-close]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (ev.ctrlKey || ev.metaKey) {
          state = resetTrackerEntry(state, stat.professionId, stat.totalXp, stat.levelCap);
        } else {
          state = dismissTrackerEntry(state, stat.professionId);
          if (hoveredProfId === stat.professionId) {
            hoveredProfId = null;
            hideTooltip();
          }
        }
        render(true);
      });

      dock.appendChild(card);

      if (hoveredProfId === stat.professionId) {
        positionTooltip(card, stat);
      }
    }
  };

  return {
    recordGain({ professionId, amount, totalXpAfter, reason = '' }) {
      const cap = typeof getLevelCap === 'function' ? getLevelCap() : 99;
      state = recordXpGain(state, {
        professionId,
        amount,
        totalXpAfter,
        levelCap: cap,
        nowMs: Date.now(),
        reason,
      });
      render(true, professionId, Math.round(Number(amount) || 0));
    },
    pinProfession(professionId) {
      const prog = typeof getProgression === 'function' ? getProgression() : null;
      const cap = typeof getLevelCap === 'function' ? getLevelCap() : 99;
      const xp = Number(prog?.professions?.[professionId]?.xp) || 0;
      const snap = computeSkillProgressSnapshot(professionId, xp, cap);
      state = { ...state, filterMode: SKILLING_PROFESSION_IDS.has(professionId) ? state.filterMode : 'all' };
      state = toggleTrackerPin(state, professionId, Date.now(), snap);
      render(true);
    },
    syncSnapshotsFromProgression() {
      const prog = typeof getProgression === 'function' ? getProgression() : null;
      const cap = typeof getLevelCap === 'function' ? getLevelCap() : 99;
      if (!prog?.professions) return;
      let changed = false;
      const nextEntries = { ...(state.entries || {}) };
      for (const [id, entry] of Object.entries(nextEntries)) {
        const curXp = Math.max(0, Math.floor(Number(prog.professions?.[id]?.xp) || 0));
        if (curXp !== entry.totalXp || cap !== entry.levelCap) {
          nextEntries[id] = { ...entry, totalXp: curXp, levelCap: cap };
          changed = true;
        }
      }
      if (changed) {
        state = { ...state, entries: nextEntries };
        render(true);
      }
    },
    tick() {
      render(false);
    },
    getState() {
      return state;
    },
  };
}
