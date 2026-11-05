// ==========================================
// GlimmerFall Online 2D — Interface Customization & Draggable HUD Controller
// Freeform layout editing, drag-and-drop HUD elements & persistent localStorage
// ==========================================

const STORAGE_KEY = 'glimmerfall_custom_ui_layout';

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
        el.style.left = pos.left;
        el.style.top = pos.top;
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

  const newLeft = Math.max(0, Math.min(window.innerWidth - currentDragEl.offsetWidth, elemStartLeft + dx));
  const newTop = Math.max(0, Math.min(window.innerHeight - currentDragEl.offsetHeight, elemStartTop + dy));

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
