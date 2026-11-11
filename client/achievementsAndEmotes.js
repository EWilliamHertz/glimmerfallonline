// ==========================================
// GLIMMERFALL ONLINE: ACHIEVEMENTS, TITLES & EMOTE WHEEL
// Day 20 & Day 21 Master Roadmap Implementation
// ==========================================

import {
  EMOTES_CATALOG,
  ACHIEVEMENTS_CATALOG,
  ACHIEVEMENT_CATEGORIES,
  LORE_CODEX_ENTRIES,
  getUnlockedTitles,
  sanitizePlayerTitle,
} from '../shared/protocol.js';

let activeCategoryFilter = 'all';
let activeCodexEntryId = null;
let activeModalTab = 'achievements';
let isEmoteWheelOpen = false;

// ------------------------------------------
// 1. RADIAL EMOTE WHEEL [V]
// ------------------------------------------

export function initEmoteWheel(onSelectEmote) {
  let overlay = document.getElementById('emote-wheel-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'emote-wheel-overlay';
    overlay.className = 'emote-wheel-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
  }

  const emoteList = Object.values(EMOTES_CATALOG);
  const total = emoteList.length;
  const radius = 135; // Distance from center in px

  let petalsHtml = '';
  emoteList.forEach((em, idx) => {
    const angle = (idx / total) * (2 * Math.PI) - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    petalsHtml += `
      <div class="emote-wheel-petal" data-emote-id="${em.id}" style="--petal-x: ${x}px; --petal-y: ${y}px; --petal-color: ${em.color || '#facc15'};" title="${em.label}: ${em.text}">
        <span class="petal-icon">${em.icon}</span>
        <span class="petal-label">${em.label}</span>
      </div>
    `;
  });

  overlay.innerHTML = `
    <div class="emote-wheel-backdrop" id="emote-wheel-backdrop"></div>
    <div class="emote-wheel-container">
      <div class="emote-wheel-hub" title="Close Emote Wheel [ESC / V]">
        <span class="hub-icon">🎭</span>
        <span class="hub-label">EMOTE [V]</span>
      </div>
      <div class="emote-wheel-petals">
        ${petalsHtml}
      </div>
    </div>
  `;

  // Click on petal activates emote
  overlay.querySelectorAll('.emote-wheel-petal').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const emoteId = el.dataset.emoteId;
      if (emoteId && typeof onSelectEmote === 'function') {
        onSelectEmote(emoteId);
      }
      closeEmoteWheel();
    });
  });

  // Click on hub or backdrop closes wheel
  overlay.querySelector('#emote-wheel-backdrop')?.addEventListener('click', closeEmoteWheel);
  overlay.querySelector('.emote-wheel-hub')?.addEventListener('click', closeEmoteWheel);
}

export function openEmoteWheel() {
  const overlay = document.getElementById('emote-wheel-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  isEmoteWheelOpen = true;
}

export function closeEmoteWheel() {
  const overlay = document.getElementById('emote-wheel-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  isEmoteWheelOpen = false;
}

export function toggleEmoteWheel(onSelectEmote) {
  if (isEmoteWheelOpen) {
    closeEmoteWheel();
  } else {
    initEmoteWheel(onSelectEmote || window.triggerEmote);
    openEmoteWheel();
  }
}

// ------------------------------------------
// 2. ACHIEVEMENTS & TCG LORE CODEX MODAL [Y]
// ------------------------------------------

export function renderAchievementsModal({
  prog,
  profile,
  activeTab = activeModalTab,
  category = activeCategoryFilter,
  onEquipTitle,
  onClaimAchievement,
}) {
  activeModalTab = activeTab;
  activeCategoryFilter = category;

  const modal = document.getElementById('achievements-modal');
  if (!modal) return;

  const completedMap = prog?.achievements?.completed || {};
  const statsMap = prog?.stats || {};
  const totalAch = ACHIEVEMENTS_CATALOG.length;
  const completedCount = Object.keys(completedMap).length;
  const compPct = Math.round((completedCount / Math.max(1, totalAch)) * 100);

  const equippedTitle = profile?.title || prog?.equippedTitle || null;
  const unlockedTitles = getUnlockedTitles(prog);

  // Tab Header Bar
  const tabsHtml = `
    <div class="ach-tabs-strip">
      <button class="ach-tab-btn ${activeTab === 'achievements' ? 'active' : ''}" onclick="window.switchAchievementsTab('achievements')">
        🏆 ACHIEVEMENTS (${completedCount}/${totalAch})
      </button>
      <button class="ach-tab-btn ${activeTab === 'codex' ? 'active' : ''}" onclick="window.switchAchievementsTab('codex')">
        📜 TCG LORE CODEX (${LORE_CODEX_ENTRIES.length})
      </button>
      <button class="ach-tab-btn ${activeTab === 'titles' ? 'active' : ''}" onclick="window.switchAchievementsTab('titles')">
        👑 COSMETIC TITLES (${unlockedTitles.length})
      </button>
    </div>
  `;

  let bodyContent = '';

  if (activeTab === 'achievements') {
    // 1. Overview Banner & Progress
    const bannerHtml = `
      <div class="ach-hero-banner">
        <div class="ach-hero-summary">
          <div class="ach-hero-tag">CONTINENTAL PARAGON DIRECTIVE</div>
          <div class="ach-hero-title">ACHIEVEMENT COMPLETION: <span style="color:#fde047;">${compPct}%</span></div>
          <div class="ach-prog-bar-wrap">
            <div class="ach-prog-bar-fill" style="width: ${compPct}%;"></div>
          </div>
          <div class="ach-hero-subtitle">
            <span>${completedCount} of ${totalAch} Milestones Claimed</span>
            <span style="color:#38bdf8;">Equipped Title: ${equippedTitle ? `&lt;${equippedTitle}&gt;` : 'None'}</span>
          </div>
        </div>
      </div>
      <div class="ach-filter-row">
        <button class="ach-filter-pill ${category === 'all' ? 'active' : ''}" onclick="window.filterAchievementsCategory('all')">
          ALL MILESTONES (${totalAch})
        </button>
        ${Object.values(ACHIEVEMENT_CATEGORIES).map((cat) => {
          const catCount = ACHIEVEMENTS_CATALOG.filter((a) => a.category === cat.id).length;
          return `
            <button class="ach-filter-pill ${category === cat.id ? 'active' : ''}" onclick="window.filterAchievementsCategory('${cat.id}')">
              ${cat.icon} ${cat.name} (${catCount})
            </button>
          `;
        }).join('')}
      </div>
    `;

    // 2. Filtered Cards List
    const filteredList = category === 'all'
      ? ACHIEVEMENTS_CATALOG
      : ACHIEVEMENTS_CATALOG.filter((a) => a.category === category);

    const cardsHtml = filteredList.map((ach) => {
      const isDone = Boolean(completedMap[ach.id]);
      const curCount = Math.min(ach.targetCount, Number(statsMap[ach.statKey] || 0));
      const pct = Math.min(100, Math.round((curCount / Math.max(1, ach.targetCount)) * 100));
      const catMeta = ACHIEVEMENT_CATEGORIES[ach.category] || ACHIEVEMENT_CATEGORIES.skilling;

      return `
        <div class="ach-card ${isDone ? 'completed' : ''}">
          <div class="ach-card-icon" style="border-color: ${catMeta.color};">
            <span>${ach.icon}</span>
          </div>
          <div class="ach-card-body">
            <div class="ach-card-top">
              <span class="ach-card-name">${ach.name}</span>
              <span class="ach-cat-badge" style="color: ${catMeta.color}; border-color: ${catMeta.color};">
                ${catMeta.icon} ${catMeta.name}
              </span>
            </div>
            <div class="ach-card-desc">${ach.desc}</div>
            <div class="ach-card-progress-row">
              <div class="ach-card-bar">
                <div class="ach-card-bar-fill" style="width: ${pct}%; background: ${isDone ? '#facc15' : catMeta.color};"></div>
              </div>
              <span class="ach-card-progress-txt">${curCount} / ${ach.targetCount} (${pct}%)</span>
            </div>
            <div class="ach-card-rewards">
              <span class="ach-reward-chip">🪙 +${ach.rewardGold} Gold</span>
              <span class="ach-reward-chip">✨ +${ach.rewardXp} XP</span>
              ${ach.unlockedTitle ? `<span class="ach-reward-title">&lt;${ach.unlockedTitle}&gt;</span>` : ''}
              ${isDone
                ? '<span class="ach-status-badge claimed">CLAIMED 🏆</span>'
                : curCount >= ach.targetCount
                  ? `<button class="ach-claim-btn" onclick="window.claimAchievementPrompt('${ach.id}')">CLAIM REWARD</button>`
                  : '<span class="ach-status-badge in-progress">IN PROGRESS</span>'
              }
            </div>
          </div>
        </div>
      `;
    }).join('');

    bodyContent = `
      ${bannerHtml}
      <div class="ach-cards-grid">
        ${cardsHtml}
      </div>
    `;
  } else if (activeTab === 'codex') {
    // TCG Lore Codex Reader
    const entryListHtml = LORE_CODEX_ENTRIES.map((entry) => {
      const isSel = entry.id === (activeCodexEntryId || LORE_CODEX_ENTRIES[0].id);
      return `
        <div class="codex-nav-card ${isSel ? 'active' : ''}" onclick="window.selectCodexEntry('${entry.id}')">
          <div class="codex-nav-icon">${entry.icon}</div>
          <div class="codex-nav-meta">
            <div class="codex-nav-era">${entry.era}</div>
            <div class="codex-nav-title">${entry.title}</div>
          </div>
        </div>
      `;
    }).join('');

    const curEntry = LORE_CODEX_ENTRIES.find((e) => e.id === (activeCodexEntryId || LORE_CODEX_ENTRIES[0].id)) || LORE_CODEX_ENTRIES[0];

    bodyContent = `
      <div class="codex-layout">
        <div class="codex-sidebar">
          <div class="codex-sidebar-head">CHRONICLES OF GLIMMERFALL</div>
          <div class="codex-nav-list">${entryListHtml}</div>
        </div>
        <div class="codex-reader-panel">
          <div class="codex-article-era">${curEntry.era}</div>
          <div class="codex-article-title">${curEntry.icon} ${curEntry.title}</div>
          <div class="codex-article-preview">${curEntry.preview}</div>
          <div class="codex-article-divider"></div>
          <div class="codex-article-body">${curEntry.body.replace(/\n\n/g, '<br><br>')}</div>
        </div>
      </div>
    `;
  } else if (activeTab === 'titles') {
    // Cosmetic Titles Wardrobe
    const titlesHtml = ACHIEVEMENTS_CATALOG.filter((a) => a.unlockedTitle).map((ach) => {
      const isUnlocked = Boolean(completedMap[ach.id]);
      const titleName = ach.unlockedTitle;
      const isEquipped = equippedTitle === titleName;

      return `
        <div class="title-wardrobe-card ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}">
          <div class="title-card-meta">
            <div class="title-card-preview">&lt;${titleName}&gt;</div>
            <div class="title-card-source">Earned via: <b>${ach.name}</b> (${ach.desc})</div>
          </div>
          <div class="title-card-actions">
            ${isEquipped
              ? `<button class="title-btn unequip" onclick="window.equipTitleAction(null)">UNEQUIP</button>`
              : isUnlocked
                ? `<button class="title-btn equip" onclick="window.equipTitleAction('${titleName}')">EQUIP TITLE</button>`
                : `<span class="title-locked-badge">🔒 LOCKED</span>`
            }
          </div>
        </div>
      `;
    }).join('');

    bodyContent = `
      <div class="titles-header-banner">
        <div class="titles-banner-tag">CHARACTER COSMETIC FLAIR</div>
        <div class="titles-banner-title">
          ACTIVE TITLE: <span style="color:#fde047;">${equippedTitle ? `&lt;${equippedTitle}&gt;` : 'None (No Title Equipped)'}</span>
        </div>
        <div class="titles-banner-desc">
          Cosmetic titles appear in gleaming gold directly above your character's nameplate throughout the continental world!
        </div>
      </div>
      <div class="titles-list-grid">
        ${titlesHtml}
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal-header" style="border-bottom: 1px solid rgba(250, 204, 21, 0.35); padding-bottom: 8px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">🏆</span>
        <div>
          <div class="modal-title" style="font-size: 14px; color: #fde047; font-family: var(--font-header); letter-spacing: 0.5px;">
            CONTINENTAL ACHIEVEMENTS &amp; TCG CODEX [Y]
          </div>
          <div style="font-size: 10px; color: #94a3b8;">
            Track historical milestones, unlock cosmetic titles, and delve into Primeval lore
          </div>
        </div>
      </div>
      <div class="modal-close" onclick="window.toggleAchievementsModal()">✕</div>
    </div>
    ${tabsHtml}
    <div class="ach-modal-scroll-body">
      ${bodyContent}
    </div>
  `;
}

// ------------------------------------------
// 3. STAT & ACHIEVEMENT RECORDING ENGINE
// ------------------------------------------

export function recordAchievementStat(prog, statKey, delta = 1, onUnlock) {
  if (!prog) return [];
  prog.stats = prog.stats || {};
  prog.stats[statKey] = (Number(prog.stats[statKey]) || 0) + delta;

  prog.achievements = prog.achievements || { completed: {}, unlockedTitles: [] };
  prog.achievements.completed = prog.achievements.completed || {};
  prog.achievements.unlockedTitles = prog.achievements.unlockedTitles || [];

  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS_CATALOG) {
    if (prog.achievements.completed[ach.id]) continue;
    if (ach.statKey === statKey) {
      const current = Number(prog.stats[statKey]) || 0;
      if (current >= ach.targetCount) {
        prog.achievements.completed[ach.id] = {
          unlockedAt: new Date().toISOString(),
        };
        if (ach.unlockedTitle && !prog.achievements.unlockedTitles.includes(ach.unlockedTitle)) {
          prog.achievements.unlockedTitles.push(ach.unlockedTitle);
        }
        newlyUnlocked.push(ach);
        if (typeof onUnlock === 'function') {
          onUnlock(ach);
        }
      }
    }
  }

  return newlyUnlocked;
}
