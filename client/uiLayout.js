// ==========================================
// GlimmerFall Online 2D — Interface Customization & Draggable HUD Controller
// Freeform layout editing, drag-and-drop HUD elements & persistent localStorage
// ==========================================

const STORAGE_KEY = 'glimmerfall_custom_ui_layout';
const SNAP_THRESHOLD = 15; // Pixel distance before magnetic snap triggers
let isDragging = false;
let currentDragEl = null;
let dragStartX = 0;
let dragStartY = 0;
let elemStartLeft = 0;
let elemStartTop = 0;

export function initUiLayout() {
  if (typeof document === 'undefined') return;

  // 1. Restore saved layout if any
  applySavedUiLayout();

  // 2. Attach drag listeners to all draggable panels
  const panels = document.querySelectorAll('.ui-draggable-panel');
  panels.forEach((panel) => {
    panel.addEventListener('mousedown', (e) => onPanelMouseDown(e, panel));
    panel.addEventListener('touchstart', (e) => onPanelMouseDown(e, panel), { passive: false });
  });

  // 3. Bind global mouse/touch movement
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
  window.addEventListener('touchmove', onWindowMouseMove, { passive: false });
  window.addEventListener('touchend', onWindowMouseUp);
}
export function applySavedUiLayout() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const layout = JSON.parse(raw);
    if (typeof layout !== 'object' || !layout) return;

    const enforceBounds = () => {
      for (const [id, pos] of Object.entries(layout)) {
        const el = document.getElementById(id);
        if (!el || !pos) continue;

        if (id === 'bottom-bar-dock' && pos.isDefaultCenter) {
          el.style.left = '50%';
          el.style.top = '';
          el.style.right = '';
          el.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
          el.style.transform = 'translateX(-50%)';
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
    };

    // Apply immediately
    enforceBounds();
    
    // Re-apply once the window has fully loaded to ensure offsetWidth is 100% accurate
    if (document.readyState === 'complete') {
      setTimeout(enforceBounds, 100);
    } else {
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
    if (Math.abs(dockCenterX - winWidth / 2) < 45) {
      newLeft = (winWidth - elWidth) / 2;
    }
    if (winHeight - (newTop + elHeight) < 45) {
      newTop = winHeight - elHeight - 12;
    }
  }

  // Apply final coordinates
  if (currentDragEl.id === 'bottom-bar-dock' && Math.abs((newLeft + elWidth / 2) - winWidth / 2) < 3) {
    currentDragEl.style.left = '50%';
    currentDragEl.style.transform = 'translateX(-50%)';
    currentDragEl.style.top = `${Math.round(newTop)}px`;
    currentDragEl.style.bottom = 'auto';
  } else {
    currentDragEl.style.left = `${Math.round(newLeft)}px`;
    currentDragEl.style.top = `${Math.round(newTop)}px`;
    currentDragEl.style.right = 'auto';
    currentDragEl.style.bottom = 'auto';
    currentDragEl.style.transform = 'none';
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
        const isNearCenter = Math.abs(centerX - window.innerWidth / 2) < 45;
        const isNearBottom = (window.innerHeight - rect.bottom) < 55;
        if (isNearCenter && isNearBottom) {
          layout[panel.id] = { isDefaultCenter: true };
          return;
        }
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
  });

  const dock = document.getElementById('bottom-bar-dock');
  if (dock) {
    dock.style.left = '50%';
    dock.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
    dock.style.transform = 'translateX(-50%)';
  }

  toggleUiEditMode(false);

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
}
