// ==========================================
// GlimmerFall Online 2D — Interface Customization & Draggable HUD Controller
// Freeform layout editing, drag-and-drop HUD elements & persistent localStorage
// ==========================================

const STORAGE_KEY = 'glimmerfall_custom_ui_layout';
const UI_SCALE_KEY = 'glimmerfall_custom_ui_scale';
const SNAP_THRESHOLD = 15; // Pixel distance before magnetic snap triggers
const HUD_STACK_GAP = 8;

function getSavedUiLayout() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function setStyleIfChanged(el, prop, value) {
  if (!el || !el.style) return;
  if (el.style[prop] !== value) {
    el.style[prop] = value;
  }
}

function measureVisualRect(el, fallbackLeft, fallbackTop, fallbackW, fallbackH, scale = 1) {
  if (el && typeof el.getBoundingClientRect === 'function') {
    const r = el.getBoundingClientRect();
    if (r && (r.width > 0 || r.height > 0)) {
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    }
  }
  const left = Number.isFinite(parseFloat(el?.style?.left)) ? parseFloat(el.style.left) : fallbackLeft;
  const top = Number.isFinite(parseFloat(el?.style?.top)) ? parseFloat(el.style.top) : fallbackTop;
  const width = (el?.offsetWidth > 0 ? el.offsetWidth : fallbackW) * scale;
  const height = (el?.offsetHeight > 0 ? el.offsetHeight : fallbackH) * scale;
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

export function getUiScale() {
  const custom = (typeof localStorage !== 'undefined' ? localStorage.getItem(UI_SCALE_KEY) : null) || 'auto';
  if (custom === 'auto') {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 720;
    // Cap scale based on viewport height as well as width so left-column HUD widgets
    // (#player-unit-frame, #party-hud, #quest-tracker, #social-chat-panel) never collide on 720p/iPad screens.
    let widthScale = 1.0;
    if (w >= 1900 && h >= 1050) widthScale = 1.25;
    else if (w >= 1400) widthScale = 1.15;
    else if (w >= 1000) widthScale = 1.05;
    else if (w <= 640) widthScale = 0.82;
    else if (w <= 850) widthScale = 0.90;

    let heightCap = 1.25;
    if (h <= 560) heightCap = 0.78;
    else if (h <= 660) heightCap = 0.85;
    else if (h <= 760) heightCap = 0.92;
    else if (h <= 880) heightCap = 1.0;
    else if (h < 1050) heightCap = 1.15;

    const finalScale = Math.min(widthScale, heightCap);
    return { scale: finalScale, label: `Auto (${Math.round(finalScale * 100)}%)` };
  }
  const num = parseFloat(custom);
  if (Number.isFinite(num) && num >= 0.7 && num <= 1.5) {
    return { scale: num, label: `${Math.round(num * 100)}%` };
  }
  return { scale: 1.0, label: '100%' };
}

export function setUiScale(val = 'auto') {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(UI_SCALE_KEY, val);
  }
  const { scale, label } = getUiScale();
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--hud-scale', String(scale));
    const labelEl = document.getElementById('ui-scale-label');
    if (labelEl) labelEl.innerText = label;
  }
  if (typeof window !== 'undefined' && typeof window.fitDock === 'function') {
    window.fitDock();
  }
  reflowDefaultHudStack();
}

export function cycleUiScale() {
  const current = (typeof localStorage !== 'undefined' ? localStorage.getItem(UI_SCALE_KEY) : null) || 'auto';
  const steps = ['auto', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3'];
  let curIdx = steps.indexOf(current);
  if (curIdx === -1) curIdx = 0;
  const nextVal = steps[(curIdx + 1) % steps.length];
  setUiScale(nextVal);
}

export function applySavedUiScale() {
  const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem(UI_SCALE_KEY) || 'auto') : 'auto';
  setUiScale(saved);
}
let isDragging = false;
let isReflowing = false;
let hudReflowRafId = null;
let enforceBoundsTimerId = null;
let hudResizeObserver = null;
let currentDragEl = null;
let dragStartX = 0;
let dragStartY = 0;
let elemStartLeft = 0;
let elemStartTop = 0;

/**
 * Coalesce frequent HUD resize/update triggers into a single animation-frame layout pass.
 */
export function scheduleHudStackReflow() {
  if (typeof requestAnimationFrame !== 'function') {
    reflowDefaultHudStack();
    return;
  }
  if (hudReflowRafId !== null) return;
  hudReflowRafId = requestAnimationFrame(() => {
    hudReflowRafId = null;
    reflowDefaultHudStack();
  });
}

/**
 * Dynamically stacks default (un-customized) top-left HUD widgets
 * (#player-unit-frame -> #party-hud -> #quest-tracker -> invite toasts)
 * based on actual scaled rendered bounds so they never overlap out of the box.
 */
export function reflowDefaultHudStack() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (isDragging || isReflowing || document.body?.classList?.contains('ui-edit-mode')) return;

  isReflowing = true;
  try {
    const savedLayout = getSavedUiLayout();
    const { scale } = getUiScale();
    const hudScale = scale || 1;
    const winW = window.innerWidth || 1280;
    const winH = window.innerHeight || 720;

    const avatarEl = document.getElementById('player-unit-frame');
    const partyEl = document.getElementById('party-hud');
    const questEl = document.getElementById('quest-tracker');
    const chatEl = document.getElementById('social-chat-panel');
    const topRightEl = document.getElementById('top-right-hud');
    const menuEl = document.getElementById('micro-menu');
    const menuBtnEl = document.getElementById('micro-btn-menu');
    const partyToastEl = document.getElementById('party-invite-toast');
    const arenaToastEl = document.getElementById('arena-invite-toast');

    if (avatarEl && !savedLayout['player-unit-frame']) {
      setStyleIfChanged(avatarEl, 'left', '12px');
      setStyleIfChanged(avatarEl, 'top', '12px');
      setStyleIfChanged(avatarEl, 'right', '');
      setStyleIfChanged(avatarEl, 'bottom', '');
      setStyleIfChanged(avatarEl, 'transform', '');
    }
    const avatarRect = measureVisualRect(avatarEl, 12, 12, 262, 134, hudScale);

    const topRightRect = measureVisualRect(topRightEl, winW - 184 * hudScale, 12, 172, 240, hudScale);
    const topRightLeft = topRightEl ? topRightRect.left : winW - 190;

    // Anchor #party-hud directly underneath #micro-menu's right-most MENU button (unless moved elsewhere)
    const savedPartyPos = savedLayout['party-hud'];
    const partyRectRaw = measureVisualRect(partyEl, winW * 0.5, 52, 252, 92, hudScale);
    const partyW = Math.max(180, partyRectRaw.width || 252 * hudScale);
    const partyH = Math.max(60, partyRectRaw.height || 92 * hudScale);

    let menuBtnRect = null;
    if (menuBtnEl && typeof menuBtnEl.getBoundingClientRect === 'function') {
      const r = menuBtnEl.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) menuBtnRect = r;
    }
    if (!menuBtnRect && menuEl && typeof menuEl.getBoundingClientRect === 'function') {
      const r = menuEl.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) menuBtnRect = r;
    }
    const menuAnchorRight = menuBtnRect ? menuBtnRect.right : Math.min(topRightLeft - 12, winW * 0.5 + 340 * hudScale);
    const menuAnchorBottom = menuBtnRect ? menuBtnRect.bottom : Math.round(10 + 34 * hudScale);

    // Migrate old left-column auto-saved party positions if they still sit inside the left HUD stack
    const partyIsLegacyLeftOverlap = Boolean(
      savedPartyPos &&
      (parseFloat(savedPartyPos.left) || 0) <= 24
    );

    if (partyEl && (!savedPartyPos || partyIsLegacyLeftOverlap)) {
      const minLeft = Math.ceil(avatarRect.right + 12);
      const maxLeft = Math.floor(topRightLeft - 12 - partyW);
      let partyLeft = Math.round(menuAnchorRight - partyW);
      let partyTop = Math.ceil(menuAnchorBottom + HUD_STACK_GAP);

      if (maxLeft >= minLeft) {
        partyLeft = Math.max(minLeft, Math.min(maxLeft, partyLeft));
      } else {
        partyLeft = Math.max(12, Math.min(winW - partyW - 12, partyLeft));
      }

      // Avoid colliding with visible top-center banners (Target / Arena / Siege / Mythic)
      const centerBannerIds = ['target-unit-frame', 'arena-banner', 'siege-banner', 'mythic-run-hud'];
      for (const bid of centerBannerIds) {
        const bEl = document.getElementById(bid);
        if (!bEl || bEl.style?.display === 'none' || bEl.style?.display === '') continue;
        const bRect = typeof bEl.getBoundingClientRect === 'function' ? bEl.getBoundingClientRect() : null;
        if (!bRect || bRect.width <= 0 || bRect.height <= 0) continue;
        const horizOverlap = !(partyLeft + partyW <= bRect.left - 8 || partyLeft >= bRect.right + 8);
        const vertOverlap = !(partyTop + partyH <= bRect.top - 4 || partyTop >= bRect.bottom + 4);
        if (horizOverlap && vertOverlap) {
          const shiftRight = Math.ceil(bRect.right + 10);
          if (shiftRight <= maxLeft) {
            partyLeft = shiftRight;
          } else {
            partyTop = Math.ceil(Math.max(partyTop, bRect.bottom + HUD_STACK_GAP));
          }
        }
      }

      setStyleIfChanged(partyEl, 'left', `${partyLeft}px`);
      setStyleIfChanged(partyEl, 'top', `${partyTop}px`);
      setStyleIfChanged(partyEl, 'right', 'auto');
      setStyleIfChanged(partyEl, 'bottom', 'auto');
      setStyleIfChanged(partyEl, 'transform', '');
    }
    const partyRect = measureVisualRect(partyEl, Math.round(menuAnchorRight - partyW), Math.ceil(menuAnchorBottom + HUD_STACK_GAP), 252, 92, hudScale);

    // Left HUD column now stacks ONLY Avatar -> Quest Tracker -> Social Chat
    const combatLogEl = document.getElementById('combat-log');
    if (combatLogEl && !savedLayout['social-chat-panel']) {
      const roughRemaining = winH - avatarRect.bottom - 30;
      if (roughRemaining < 260) {
        setStyleIfChanged(combatLogEl, 'maxHeight', `${Math.max(48, Math.floor((roughRemaining - 95) / hudScale))}px`);
      } else {
        setStyleIfChanged(combatLogEl, 'maxHeight', '');
      }
    }

    const leftColRight = avatarRect.right;
    const chatRect = chatEl ? measureVisualRect(chatEl, 12, winH - 220 * hudScale, 292, 208, hudScale) : null;
    const chatSharesLeftCol = chatRect && chatRect.left < leftColRight + 24 && chatRect.top > 120;
    const stackBottomLimit = chatSharesLeftCol ? chatRect.top - HUD_STACK_GAP : winH - 12;

    const questTop = Math.ceil(avatarRect.bottom + HUD_STACK_GAP + 2);
    const availBelowAvatar = stackBottomLimit - questTop;

    const savedQuestPos = savedLayout['quest-tracker'];
    const questIsLegacyOverlap = Boolean(
      savedQuestPos &&
      (parseFloat(savedQuestPos.left) || 0) <= 24 &&
      (parseFloat(savedQuestPos.top) || 0) < questTop
    );

    if (questEl && (!savedQuestPos || questIsLegacyOverlap)) {
      const sideLeft = Math.round(leftColRight + 12);
      const targetEl = document.getElementById('target-unit-frame');
      const targetVisible = targetEl && targetEl.style.display !== 'none' && targetEl.style.display !== '';
      const centerAvoidLeft = targetVisible ? (winW / 2 - 145) : partyRect.left;
      const rightFence = Math.min(topRightLeft, centerAvoidLeft, partyRect.left > sideLeft ? partyRect.left : topRightLeft);
      const canPlaceSideColumn = availBelowAvatar < 72 && (rightFence - 12 - sideLeft) >= 210 * hudScale;

      if (canPlaceSideColumn) {
        setStyleIfChanged(questEl, 'left', `${sideLeft}px`);
        setStyleIfChanged(questEl, 'top', '52px');
        setStyleIfChanged(questEl, 'right', 'auto');
        setStyleIfChanged(questEl, 'bottom', 'auto');
        setStyleIfChanged(questEl, 'transform', '');
        setStyleIfChanged(questEl, 'maxHeight', `${Math.max(88, Math.floor((winH - 180) / hudScale))}px`);
      } else {
        setStyleIfChanged(questEl, 'left', '12px');
        setStyleIfChanged(questEl, 'top', `${questTop}px`);
        setStyleIfChanged(questEl, 'right', 'auto');
        setStyleIfChanged(questEl, 'bottom', 'auto');
        setStyleIfChanged(questEl, 'transform', '');
        const strictMaxUnscaled = Math.floor(availBelowAvatar / hudScale);
        setStyleIfChanged(questEl, 'maxHeight', `${Math.max(36, strictMaxUnscaled)}px`);
      }
    }

    const questRect = measureVisualRect(questEl, 12, questTop, 280, 140, hudScale);
    const questInLeftCol = questRect.left < 120;
    const toastAnchorBottom = questInLeftCol ? Math.max(avatarRect.bottom, questRect.bottom) : avatarRect.bottom;
    const baseToastTop = Math.min(Math.ceil(toastAnchorBottom + HUD_STACK_GAP), Math.max(12, winH - 150));

    if (partyToastEl) {
      setStyleIfChanged(partyToastEl, 'left', '12px');
      setStyleIfChanged(partyToastEl, 'top', `${baseToastTop}px`);
    }
    if (arenaToastEl) {
      const partyToastVisible = partyToastEl && partyToastEl.style.display !== 'none' && partyToastEl.style.display !== '';
      const arenaToastTop = partyToastVisible ? baseToastTop + 76 : baseToastTop;
      setStyleIfChanged(arenaToastEl, 'left', '12px');
      setStyleIfChanged(arenaToastEl, 'top', `${Math.min(arenaToastTop, Math.max(12, winH - 80))}px`);
    }
  } finally {
    isReflowing = false;
  }
}

export function initUiLayout() {
  if (typeof document === 'undefined') return;

  // 1. Restore saved layout & UI scale
  applySavedUiScale();
  applySavedUiLayout();

  // 2. Attach drag listeners to all draggable panels
  const panels = document.querySelectorAll('.ui-draggable-panel');
  panels.forEach((panel) => {
    panel.addEventListener('mousedown', (e) => onPanelMouseDown(e, panel));
    panel.addEventListener('touchstart', (e) => onPanelMouseDown(e, panel), { passive: false });
  });

  // 3. Observe size changes on left-column HUD panels (coalesced to 1 RAF per frame)
  if (typeof ResizeObserver !== 'undefined') {
    if (hudResizeObserver) hudResizeObserver.disconnect();
    hudResizeObserver = new ResizeObserver(() => {
      scheduleHudStackReflow();
    });
    ['player-unit-frame', 'party-hud', 'social-chat-panel', 'micro-menu'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) hudResizeObserver.observe(el);
    });
  }

  // 4. Bind global mouse/touch movement & auto-scaling
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
  window.addEventListener('touchmove', onWindowMouseMove, { passive: false });
  window.addEventListener('touchend', onWindowMouseUp);
  window.addEventListener('resize', () => {
    const mode = typeof localStorage !== 'undefined' ? localStorage.getItem(UI_SCALE_KEY) : 'auto';
    if (!mode || mode === 'auto') {
      setUiScale('auto');
    } else {
      reflowDefaultHudStack();
    }
  });
}
export function applySavedUiLayout() {
  if (typeof localStorage === 'undefined' || typeof document === 'undefined' || typeof window === 'undefined') return;
  try {
    const layout = getSavedUiLayout();
    const hasCustomEntries = Object.keys(layout).length > 0;

    const enforceBounds = () => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      for (const [id, pos] of Object.entries(layout)) {
        const el = document.getElementById(id);
        if (!el || !pos) continue;

        if (id === 'bottom-bar-dock') {
          // Bottom action bar dock is centered at the bottom by default.
          // Discard legacy/stale absolute coordinates unless explicitly marked isCustomFloating.
          if (!pos.isCustomFloating) {
            el.style.left = '50%';
            el.style.top = '';
            el.style.right = '';
            el.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
            el.style.transform = 'translateX(-50%)';
            delete el.dataset.customFloating;
            continue;
          }
        }

        if (id === 'party-hud' && (parseFloat(pos.left) || 0) <= 24) {
          // Legacy left-column party placement is migrated underneath #micro-btn-menu by reflowDefaultHudStack().
          continue;
        }

        if (pos.left && pos.top) {
          const savedLeft = parseInt(pos.left, 10) || 0;
          const savedTop = parseInt(pos.top, 10) || 0;
          
          // Use actual width/height to ensure the ENTIRE element is on-screen
          // Fallback to 350px (approx menu width) if styles haven't painted yet
          const elWidth = el.offsetWidth > 0 ? el.offsetWidth : 350;
          const elHeight = el.offsetHeight > 0 ? el.offsetHeight : 50;

          const boundedLeft = Math.max(0, Math.min(savedLeft, window.innerWidth - elWidth));
          const boundedTop = Math.max(0, Math.min(savedTop, window.innerHeight - elHeight));

          el.style.left = `${boundedLeft}px`;
          el.style.top = `${boundedTop}px`;
          el.style.right = 'auto';
          el.style.bottom = 'auto';
          el.style.transform = 'none';
        }
      }
      reflowDefaultHudStack();
    };

    // Apply immediately (including non-overlapping default HUD stack for un-customized panels)
    enforceBounds();
    
    // Re-apply once the window has fully loaded so rendered heights are 100% accurate
    if (enforceBoundsTimerId !== null) {
      clearTimeout(enforceBoundsTimerId);
      enforceBoundsTimerId = null;
    }
    if (document.readyState === 'complete') {
      enforceBoundsTimerId = setTimeout(() => {
        enforceBoundsTimerId = null;
        enforceBounds();
      }, 100);
    } else if (hasCustomEntries || typeof window !== 'undefined') {
      window.addEventListener('load', enforceBounds);
    }
  } catch (err) {
    console.warn('[UiLayout] Failed to apply saved layout:', err);
  }
}
function onPanelMouseDown(e, panel) {
  if (!document.body.classList.contains('ui-edit-mode')) return;
  
  // Removed e.target.closest('button') so the menu bar can be dragged
  if (e.target.closest('#ui-edit-banner') || e.target.closest('input')) {
    return;
  }

  if (e.cancelable) e.preventDefault();
  
  isDragging = true;
  currentDragEl = panel;
  
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
  
  dragStartX = clientX;
  dragStartY = clientY;

  const rect = panel.getBoundingClientRect();
  elemStartLeft = rect.left;
  elemStartTop = rect.top;

  panel.style.cursor = 'grabbing';
}

function onWindowMouseMove(e) {
  if (!isDragging || !currentDragEl) return;
  if (e.cancelable) e.preventDefault();

  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;

  const elWidth = currentDragEl.offsetWidth;
  const elHeight = currentDragEl.offsetHeight;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  // 1. Calculate raw bounds-checked coordinates
  let newLeft = Math.max(0, Math.min(winWidth - elWidth, elemStartLeft + dx));
  let newTop = Math.max(0, Math.min(winHeight - elHeight, elemStartTop + dy));

  // 2. Magnetic Snap to Screen Edges
  if (newLeft < SNAP_THRESHOLD) newLeft = 0;
  if (newLeft + elWidth > winWidth - SNAP_THRESHOLD) newLeft = winWidth - elWidth;
  if (newTop < SNAP_THRESHOLD) newTop = 0;
  if (newTop + elHeight > winHeight - SNAP_THRESHOLD) newTop = winHeight - elHeight;

  // 3. Magnetic Snap to other UI Panels
  const panels = document.querySelectorAll('.ui-draggable-panel');
  let snappedX = false;
  let snappedY = false;

  panels.forEach(panel => {
    if (panel === currentDragEl || panel.style.display === 'none') return;
    
    const rect = panel.getBoundingClientRect();
    
    // Evaluate X-Axis Snapping
    if (!snappedX) {
      if (Math.abs(newLeft - rect.right) < SNAP_THRESHOLD) { newLeft = rect.right; snappedX = true; }
      else if (Math.abs((newLeft + elWidth) - rect.left) < SNAP_THRESHOLD) { newLeft = rect.left - elWidth; snappedX = true; }
      else if (Math.abs(newLeft - rect.left) < SNAP_THRESHOLD) { newLeft = rect.left; snappedX = true; }
      else if (Math.abs((newLeft + elWidth) - rect.right) < SNAP_THRESHOLD) { newLeft = rect.right - elWidth; snappedX = true; }
    }

    // Evaluate Y-Axis Snapping
    if (!snappedY) {
      if (Math.abs(newTop - rect.bottom) < SNAP_THRESHOLD) { newTop = rect.bottom; snappedY = true; }
      else if (Math.abs((newTop + elHeight) - rect.top) < SNAP_THRESHOLD) { newTop = rect.top - elHeight; snappedY = true; }
      else if (Math.abs(newTop - rect.top) < SNAP_THRESHOLD) { newTop = rect.top; snappedY = true; }
      else if (Math.abs((newTop + elHeight) - rect.bottom) < SNAP_THRESHOLD) { newTop = rect.bottom - elHeight; snappedY = true; }
    }
  });

  // Dedicated Magnetic Snap for Action Bar (#bottom-bar-dock) to Default Bottom Center
  if (currentDragEl.id === 'bottom-bar-dock') {
    const dockCenterX = newLeft + elWidth / 2;
    if (Math.abs(dockCenterX - winWidth / 2) < 80) {
      newLeft = (winWidth - elWidth) / 2;
    }
    if (winHeight - (newTop + elHeight) < 80) {
      newTop = winHeight - elHeight - 12;
    }
  }

  // Apply final coordinates
  if (currentDragEl.id === 'bottom-bar-dock' && Math.abs((newLeft + elWidth / 2) - winWidth / 2) < 10) {
    currentDragEl.style.left = '50%';
    currentDragEl.style.transform = 'translateX(-50%)';
    currentDragEl.style.top = '';
    currentDragEl.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
    delete currentDragEl.dataset.customFloating;
  } else {
    currentDragEl.style.left = `${Math.round(newLeft)}px`;
    currentDragEl.style.top = `${Math.round(newTop)}px`;
    currentDragEl.style.right = 'auto';
    currentDragEl.style.bottom = 'auto';
    currentDragEl.style.transform = 'none';
    if (currentDragEl.id === 'bottom-bar-dock') {
      currentDragEl.dataset.customFloating = 'true';
    }
  }
}
function onWindowMouseUp() {
  if (!isDragging) return;
  if (currentDragEl) {
    currentDragEl.style.cursor = '';
  }
  isDragging = false;
  currentDragEl = null;
}

export function toggleUiEditMode(forceState = null) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const shouldEnable = forceState !== null ? Boolean(forceState) : !body.classList.contains('ui-edit-mode');

  if (shouldEnable) {
    // Close any open modals to focus on HUD repositioning
    document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    body.classList.add('ui-edit-mode');
    const banner = document.getElementById('ui-edit-banner');
    if (banner) banner.style.display = 'block';
    if (typeof window.spawnFCT === 'function' && window.player) {
      window.spawnFCT(window.player.x, window.player.y - 14, '🎛️ DRAG HUD PANELS TO REPOSITION', '#38bdf8');
    }
  } else {
    body.classList.remove('ui-edit-mode');
    const banner = document.getElementById('ui-edit-banner');
    if (banner) banner.style.display = 'none';
  }
}

export function saveAndLockUiLayout() {
  if (typeof document === 'undefined') return;
  const panels = document.querySelectorAll('.ui-draggable-panel');
  const layout = {};

  panels.forEach((panel) => {
    if (panel.id) {
      if (panel.id === 'bottom-bar-dock') {
        const rect = panel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const isNearCenter = Math.abs(centerX - window.innerWidth / 2) < 80;
        const isNearBottom = (window.innerHeight - rect.bottom) < 90;
        if (isNearCenter || isNearBottom || panel.dataset.customFloating !== 'true') {
          layout[panel.id] = { isDefaultCenter: true, isCustomFloating: false };
          panel.style.left = '50%';
          panel.style.top = '';
          panel.style.right = '';
          panel.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
          panel.style.transform = 'translateX(-50%)';
          delete panel.dataset.customFloating;
          return;
        }
        layout[panel.id] = {
          isCustomFloating: true,
          left: `${Math.round(rect.left)}px`,
          top: `${Math.round(rect.top)}px`,
        };
        return;
      }
      const rect = panel.getBoundingClientRect();
      layout[panel.id] = {
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.top)}px`,
      };
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (err) {
    console.warn('[UiLayout] Failed to save layout to localStorage:', err);
  }

  toggleUiEditMode(false);

  if (typeof window.spawnFCT === 'function' && window.player) {
    window.spawnFCT(window.player.x, window.player.y - 14, '✓ I AM SATISFIED WITH MY UI (SAVED!)', '#4ade80', true);
  }
}

export function resetDefaultUiLayout() {
  if (enforceBoundsTimerId !== null) {
    clearTimeout(enforceBoundsTimerId);
    enforceBoundsTimerId = null;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }

  const panels = document.querySelectorAll('.ui-draggable-panel');
  panels.forEach((panel) => {
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
    panel.style.bottom = '';
    panel.style.transform = '';
    panel.style.maxHeight = '';
  });

  const dock = document.getElementById('bottom-bar-dock');
  const combatLogEl = document.getElementById('combat-log');
  if (combatLogEl) combatLogEl.style.maxHeight = '';
  if (dock) {
    delete dock.dataset.customFloating;
    dock.style.left = '50%';
    dock.style.top = '';
    dock.style.right = '';
    dock.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
    dock.style.transform = 'translateX(-50%)';
  }

  toggleUiEditMode(false);
  reflowDefaultHudStack();

  if (typeof window.spawnFCT === 'function' && window.player) {
    window.spawnFCT(window.player.x, window.player.y - 14, '↺ DEFAULT UI LAYOUT RESTORED', '#fde047');
  }
}

// Bind to window for direct HTML attribute calls
if (typeof window !== 'undefined') {
  window.initUiLayout = initUiLayout;
  window.toggleUiEditMode = toggleUiEditMode;
  window.saveAndLockUiLayout = saveAndLockUiLayout;
  window.resetDefaultUiLayout = resetDefaultUiLayout;
  window.reflowDefaultHudStack = reflowDefaultHudStack;
  window.scheduleHudStackReflow = scheduleHudStackReflow;
  window.setUiScale = setUiScale;
  window.cycleUiScale = cycleUiScale;
  window.getUiScale = getUiScale;
}
