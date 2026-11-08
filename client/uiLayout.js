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
  });

  // 3. Bind global mouse movement
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
}

export function applySavedUiLayout() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const layout = JSON.parse(raw);
    if (typeof layout !== 'object' || !layout) return;

    for (const [id, pos] of Object.entries(layout)) {
      const el = document.getElementById(id);
      if (el && pos && pos.left && pos.top) {
        // Parse the stored coordinates safely
        const savedLeft = parseInt(pos.left, 10) || 0;
        const savedTop = parseInt(pos.top, 10) || 0;
        
        // Ensure at least 50px of the panel remains visible inside the current window bounds
        const boundedLeft = Math.max(0, Math.min(savedLeft, window.innerWidth - 50));
        const boundedTop = Math.max(0, Math.min(savedTop, window.innerHeight - 50));

        el.style.left = `${boundedLeft}px`;
        el.style.top = `${boundedTop}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.transform = 'none';
      }
    }
  } catch (err) {
    console.warn('[UiLayout] Failed to apply saved layout:', err);
  }
}
function onPanelMouseDown(e, panel) {
  if (!document.body.classList.contains('ui-edit-mode')) return;
  // Ignore clicks on buttons inside the banner
  if (e.target.closest('#ui-edit-banner') || e.target.closest('button') || e.target.closest('input')) {
    return;
  }

  e.preventDefault();
  isDragging = true;
  currentDragEl = panel;
  dragStartX = e.clientX;
  dragStartY = e.clientY;

  const rect = panel.getBoundingClientRect();
  elemStartLeft = rect.left;
  elemStartTop = rect.top;

  panel.style.cursor = 'grabbing';
}

function onWindowMouseMove(e) {
  if (!isDragging || !currentDragEl) return;
  e.preventDefault();

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

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
      // Snap left edge to their right edge
      if (Math.abs(newLeft - rect.right) < SNAP_THRESHOLD) { newLeft = rect.right; snappedX = true; }
      // Snap right edge to their left edge
      else if (Math.abs((newLeft + elWidth) - rect.left) < SNAP_THRESHOLD) { newLeft = rect.left - elWidth; snappedX = true; }
      // Align left edges
      else if (Math.abs(newLeft - rect.left) < SNAP_THRESHOLD) { newLeft = rect.left; snappedX = true; }
      // Align right edges
      else if (Math.abs((newLeft + elWidth) - rect.right) < SNAP_THRESHOLD) { newLeft = rect.right - elWidth; snappedX = true; }
    }

    // Evaluate Y-Axis Snapping
    if (!snappedY) {
      // Snap top edge to their bottom edge
      if (Math.abs(newTop - rect.bottom) < SNAP_THRESHOLD) { newTop = rect.bottom; snappedY = true; }
      // Snap bottom edge to their top edge
      else if (Math.abs((newTop + elHeight) - rect.top) < SNAP_THRESHOLD) { newTop = rect.top - elHeight; snappedY = true; }
      // Align top edges
      else if (Math.abs(newTop - rect.top) < SNAP_THRESHOLD) { newTop = rect.top; snappedY = true; }
      // Align bottom edges
      else if (Math.abs((newTop + elHeight) - rect.bottom) < SNAP_THRESHOLD) { newTop = rect.bottom - elHeight; snappedY = true; }
    }
  });

  // Apply final coordinates
  currentDragEl.style.left = `${Math.round(newLeft)}px`;
  currentDragEl.style.top = `${Math.round(newTop)}px`;
  currentDragEl.style.right = 'auto';
  currentDragEl.style.bottom = 'auto';
  currentDragEl.style.transform = 'none';
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
