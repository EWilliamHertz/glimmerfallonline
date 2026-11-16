// ==========================================
// GlimmerFall Online — Covenant Rune Puzzles, Notice Boards & Living Interiors
// ==========================================

import { ROOM_TYPES } from '../../shared/protocol/rooms.js';

export const COVENANT_RUNES = [
  { id: 'terra', symbol: '🌿', title: 'Terra', sub: 'Root & Leaf', color: '#4ade80' },
  { id: 'solari', symbol: '☀️', title: 'Solari', sub: 'Solar Crest', color: '#facc15' },
  { id: 'aether', symbol: '✨', title: 'Aether', sub: 'Astral Prism', color: '#38bdf8' },
  { id: 'umbri', symbol: '🌙', title: 'Umbri', sub: 'Shadow Crescent', color: '#c084fc' },
];

export const PUZZLE_DEFINITIONS = {
  cottage_archive_vault: {
    id: 'cottage_archive_vault',
    roomType: ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE,
    title: 'SEALED ARCHIVE VAULT GRATE',
    subtitle: 'Archivist Aldric’s Iron Grate • Sanctum Cottage',
    hint: '“First woke the Root beneath snow, then the Sun that warmed the hearth, next the Prism that charted the vault, and last the Crescent that locked the night.”',
    solution: ['terra', 'solari', 'aether', 'umbri'],
    gateBounds: { minX: 94, maxX: 130, minY: -54, maxY: -28 },
    gatePos: { x: 112, y: -40 },
    rewardChestPos: { x: 112, y: -74 },
    reward: {
      gold: 180,
      xp: 140,
      title: 'Vault Cryptographer',
      itemName: 'Ancient Relic Fragment',
    },
  },
  ruins_nexus_seal: {
    id: 'ruins_nexus_seal',
    roomType: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
    title: 'FORGOTTEN NEXUS RUNE SEAL',
    subtitle: 'East Crypt Vault Grate • Forgotten Ruins',
    hint: '“In the Sundering Hour, Solari flared high before Aether split the sky; Terra caught the falling ember, and Umbri veiled the scar.”',
    solution: ['solari', 'aether', 'terra', 'umbri'],
    gateBounds: { minX: 190, maxX: 226, minY: -230, maxY: -204 },
    gatePos: { x: 208, y: -216 },
    rewardChestPos: { x: 208, y: -252 },
    reward: {
      gold: 320,
      xp: 260,
      title: 'CryptBreaker of the Nexus',
      itemName: 'First-Era Seal Shard',
    },
  },
};

export const NOTICE_BOARD_BULLETINS = {
  sanctuary_inn: {
    boardName: 'SANCTUARY INN NOTICE BOARD',
    entries: [
      '• CHEF BRAMWELL: Freshly stewed Glimmer Trout & Solstice Loaves inside the Hearth Inn. Resting indoors restores vigor cleanly!',
      '• COVENANT CENSUS: Green Covenant underfoot halos mark NPCs you can speak with cleanly — press [T] or click directly.',
      '• NIGHTFALL ADVISORY: Sanctuary lanterns ignite around 18:00; stay near hearths or torch-posts during coastal squalls.',
    ],
  },
  sanctuary_cottage: {
    boardName: 'SANCTUM COTTAGE ARCHIVE LEDGER',
    entries: [
      '• ARCHIVIST ALDRIC: My northern study contains the Sealed Iron Vault Grate. Only scholars who recall the Dawn-to-Nightfall order may unbar its relic chest:',
      '• CLUE VERSE: “First Root (Terra), then Sun (Solari), next Prism (Aether), and last Crescent (Umbri).”',
      '• STUDIO TIP: Cozy sleeping pets doze beside warm bookshelves—mind the slumbering familiar!',
    ],
  },
  terra_apothecary: {
    boardName: 'TERRA APOTHECARY HERBARIUM BOARD',
    entries: [
      '• HERBALIST WILLOW: Pass through the central conservatory arch to visit our indoor living atrium of blossoms and evergreens.',
      '• DISTILLATION HOURS: Infuse Sun-Dew Petals & Dusk Spores at the Alembic Crucible, or spin ward-cloaks at the Silk Loom.',
      '• GREENHOUSE CARE: Please keep boots clear of the terracotta urns framing the conservatory arch.',
    ],
  },
  coral_mariner: {
    boardName: 'BRINELIGHT MARINER TAVERN BOARD',
    entries: [
      '• ANGLER FINN: The North Boardwalk stretches cleanly to Umbri Undercity, and our new East L-Pier juts straight into the twilight shoals!',
      '• TIDE FORECAST: Expect periodic coastal showers rolling off the Coral Reef; warm pier lanterns guide late-night casters home.',
      '• TAVERN SPECIAL: Grilled Reef Salmon inside the Mariner Tavern!',
    ],
  },
};

/**
 * Normalize persisted puzzle progress into a clean state object.
 */
export function createPuzzleProgress(saved = null) {
  const src = saved && typeof saved === 'object' ? saved : {};
  return {
    solved: { ...(src.solved || {}) },
    claimed: { ...(src.claimed || {}) },
    activeAttempt: Array.isArray(src.activeAttempt) ? [...src.activeAttempt] : [],
  };
}

/**
 * Returns true when the specified puzzle grate has been unbarred.
 */
export function isPuzzleUnlocked(progress, puzzleId) {
  return Boolean(progress && progress.solved && progress.solved[puzzleId]);
}

/**
 * Returns true when the reward chest behind the puzzle has already been looted.
 */
export function isPuzzleRewardClaimed(progress, puzzleId) {
  return Boolean(progress && progress.claimed && progress.claimed[puzzleId]);
}

/**
 * Submit a Covenant rune into the active sequence for `puzzleId`.
 * @returns {{ status: 'already_unlocked'|'progress'|'unlocked'|'mismatch', attempt: string[], progress: object }}
 */
export function submitPuzzleRune(progress, puzzleId, runeId) {
  const state = createPuzzleProgress(progress);
  const def = PUZZLE_DEFINITIONS[puzzleId];
  if (!def) {
    return { status: 'progress', attempt: [], progress: state };
  }
  if (isPuzzleUnlocked(state, puzzleId)) {
    return { status: 'already_unlocked', attempt: [...def.solution], progress: state };
  }

  const nextAttempt = [...state.activeAttempt, runeId];
  if (nextAttempt.length < def.solution.length) {
    state.activeAttempt = nextAttempt;
    return { status: 'progress', attempt: nextAttempt, progress: state };
  }

  const isMatch = def.solution.every((expected, idx) => nextAttempt[idx] === expected);
  if (isMatch) {
    state.solved[puzzleId] = true;
    state.activeAttempt = [];
    return { status: 'unlocked', attempt: [...def.solution], progress: state };
  }

  state.activeAttempt = [];
  return { status: 'mismatch', attempt: nextAttempt, progress: state };
}

/**
 * Clear an in-progress rune attempt.
 */
export function resetPuzzleAttempt(progress) {
  const state = createPuzzleProgress(progress);
  state.activeAttempt = [];
  return state;
}

/**
 * Mark an unlocked puzzle's treasure chest reward as claimed.
 */
export function claimPuzzleReward(progress, puzzleId) {
  const state = createPuzzleProgress(progress);
  const def = PUZZLE_DEFINITIONS[puzzleId];
  if (!def || !isPuzzleUnlocked(state, puzzleId) || isPuzzleRewardClaimed(state, puzzleId)) {
    return { granted: false, reward: null, progress: state };
  }
  state.claimed[puzzleId] = true;
  return { granted: true, reward: def.reward, progress: state };
}

/**
 * Returns the blocking `PUZZLE_DEFINITIONS` entry if `(x, y)` collides with a locked iron vault grate.
 */
export function isBlockedByPuzzleGate(x, y, roomType, progress) {
  for (const def of Object.values(PUZZLE_DEFINITIONS)) {
    if (def.roomType !== roomType) continue;
    if (isPuzzleUnlocked(progress, def.id)) continue;
    const b = def.gateBounds;
    if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) {
      return def;
    }
  }
  return null;
}

/**
 * Build dialogue pages for an outdoor building Notice Board.
 */
export function buildNoticeBoardDialogue(boardId) {
  const board = NOTICE_BOARD_BULLETINS[boardId];
  if (!board) return [];
  return [
    {
      speaker: board.boardName,
      spriteKey: null,
      text: board.entries.join('\n\n'),
      actions: [{ label: '📌 STEP BACK', action: 'close' }],
    },
  ];
}

/**
 * Wire `#rune-puzzle-modal` DOM controls and rendering.
 */
export function setupRunePuzzleUi({ doc, getProgress, saveProgress, onSolved, onFeedback }) {
  if (!doc) return null;
  const modal = doc.getElementById('rune-puzzle-modal');
  const titleEl = doc.getElementById('rune-puzzle-title');
  const subEl = doc.getElementById('rune-puzzle-sub');
  const hintEl = doc.getElementById('rune-puzzle-hint');
  const slotsEl = doc.getElementById('rune-puzzle-slots');
  const choicesEl = doc.getElementById('rune-puzzle-choices');
  const statusEl = doc.getElementById('rune-puzzle-status');
  const resetBtn = doc.getElementById('rune-puzzle-reset-btn');
  const closeBtn = doc.getElementById('rune-puzzle-close-btn');
  if (!modal || !slotsEl || !choicesEl) return null;

  let activePuzzleId = null;

  const render = (statusText = '', statusColor = '#94a3b8') => {
    const def = PUZZLE_DEFINITIONS[activePuzzleId];
    if (!def) return;
    const progress = getProgress();
    const unlocked = isPuzzleUnlocked(progress, def.id);
    const attempt = unlocked ? def.solution : (progress.activeAttempt || []);

    if (titleEl) titleEl.textContent = def.title;
    if (subEl) subEl.textContent = def.subtitle;
    if (hintEl) hintEl.textContent = def.hint;

    slotsEl.innerHTML = '';
    for (let i = 0; i < def.solution.length; i++) {
      const slot = doc.createElement('div');
      slot.className = 'rune-slot' + (attempt[i] ? ' filled' : '') + (unlocked ? ' unlocked' : '');
      const rune = COVENANT_RUNES.find((r) => r.id === attempt[i]);
      slot.innerHTML = rune
        ? `<span class="rune-glyph" style="color:${rune.color}">${rune.symbol}</span><span class="rune-slot-name">${rune.title}</span>`
        : `<span class="rune-slot-num">${i + 1}</span>`;
      slotsEl.appendChild(slot);
    }

    choicesEl.innerHTML = '';
    for (const rune of COVENANT_RUNES) {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'rune-choice-btn';
      btn.disabled = unlocked;
      btn.style.borderColor = unlocked ? 'rgba(148,163,184,0.25)' : rune.color;
      btn.innerHTML = `<span class="rune-glyph">${rune.symbol}</span><span>${rune.title}</span><small>${rune.sub}</small>`;
      btn.addEventListener('click', () => {
        const res = submitPuzzleRune(getProgress(), def.id, rune.id);
        saveProgress(res.progress);
        if (res.status === 'unlocked') {
          render('🔓 SEAL SHATTERED! The iron grate slides open!', '#4ade80');
          if (typeof onSolved === 'function') onSolved(def);
        } else if (res.status === 'mismatch') {
          render('⚠️ The runes flicker out—wrong covenant sequence! Try again.', '#f87171');
        } else {
          render(`Chisel ${res.attempt.length}/${def.solution.length} runes...`, '#38bdf8');
        }
        if (typeof onFeedback === 'function') onFeedback(res.status);
      });
      choicesEl.appendChild(btn);
    }

    if (statusEl) {
      if (statusText) {
        statusEl.textContent = statusText;
        statusEl.style.color = statusColor;
      } else if (unlocked) {
        statusEl.textContent = '🔓 This iron grate stands unbarred—step inside to claim the vault chest!';
        statusEl.style.color = '#4ade80';
      } else {
        statusEl.textContent = `Enter the ${def.solution.length}-rune Covenant sequence in exact order.`;
        statusEl.style.color = '#cbd5e1';
      }
    }
  };

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!activePuzzleId) return;
      saveProgress(resetPuzzleAttempt(getProgress()));
      render('Sequence cleared.', '#94a3b8');
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  return {
    open(puzzleId) {
      if (!PUZZLE_DEFINITIONS[puzzleId]) return;
      activePuzzleId = puzzleId;
      saveProgress(resetPuzzleAttempt(getProgress()));
      modal.style.display = 'flex';
      render();
    },
    close() {
      modal.style.display = 'none';
    },
  };
}
