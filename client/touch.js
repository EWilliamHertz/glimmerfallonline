// ==========================================
// GlimmerFall Online 2D — Mobile & Tablet Touch Controls
// Pixel virtual thumbstick + SPRINT / TARGET / GLIMMER buttons.
// Toggleable in Settings/HUD, saved in localStorage ('glimmerfall_touch_controls').
// ==========================================

export function shouldEnableTouch() {
  try {
    const stored = localStorage.getItem('glimmerfall_touch_controls');
    if (stored === '1') return true;
    if (stored === '0') return false;
    const q = new URLSearchParams(window.location.search);
    if (q.get('touch') === '0') return false;
    if (q.get('touch') === '1') return true;
    return (
      window.matchMedia?.('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      (navigator.maxTouchPoints || 0) > 0
    );
  } catch (_) {
    return false;
  }
}

const TOUCH_CSS = `
  body.touch-mode #minimap-panel { transform: scale(0.62); transform-origin: top right; top: 6px; right: 6px; }
  body.touch-mode #bottom-bar-dock { bottom: 6px; transform-origin: bottom center; }
  body.touch-mode .action-button { width: 48px; height: 52px; }
  body.touch-mode #canvas-container { touch-action: none; }
  #touch-layer { position: fixed; inset: 0; z-index: 40; pointer-events: none; display: none; font-family: var(--font-header, monospace); }
  body.touch-mode #touch-layer { display: block; }
  #touch-stick {
    position: absolute; left: 18px; bottom: 96px; width: 104px; height: 104px;
    background: rgba(8, 12, 24, 0.55); border: 3px solid #38bdf8;
    box-shadow: 0 0 0 2px #05070f, 4px 4px 0 rgba(0,0,0,0.7);
    border-radius: 50%; pointer-events: auto; touch-action: none;
  }
  #touch-stick::before, #touch-stick::after {
    content: ''; position: absolute; background: rgba(56,189,248,0.35);
  }
  #touch-stick::before { left: 50%; top: 8px; bottom: 8px; width: 2px; margin-left: -1px; }
  #touch-stick::after { top: 50%; left: 8px; right: 8px; height: 2px; margin-top: -1px; }
  #touch-knob {
    position: absolute; left: 50%; top: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px;
    background: #0f172a; border: 3px solid #facc15; box-shadow: 0 0 0 2px #05070f;
    border-radius: 50%; image-rendering: pixelated;
  }
  .touch-btn {
    position: absolute; width: 54px; height: 54px; pointer-events: auto; touch-action: none;
    background: rgba(8, 12, 24, 0.72); border: 3px solid #475569; color: #f8fafc;
    box-shadow: 0 0 0 2px #05070f, 3px 3px 0 rgba(0,0,0,0.7);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    font-size: 6px; text-shadow: 1px 1px 0 #000; user-select: none; -webkit-user-select: none;
  }
  .touch-btn .ti { font-size: 18px; line-height: 1; }
  .touch-btn.active { border-color: #facc15; background: rgba(51, 38, 6, 0.85); transform: translate(1px, 1px); }
  #touch-btn-sprint { right: 18px; bottom: 96px; border-color: #38bdf8; }
  #touch-btn-target { right: 82px; bottom: 112px; border-color: #ef4444; }
  #touch-btn-harvest { right: 18px; bottom: 160px; border-color: #c084fc; }
  #touch-btn-chat { right: 82px; bottom: 176px; border-color: #94a3b8; }
`;

export function updateTouchUiButtons(enabled) {
  const btn = document.getElementById('btn-touch-toggle');
  if (btn) {
    btn.innerHTML = `📱 TOUCH <span style="color:${enabled ? '#4ade80' : '#94a3b8'};">${enabled ? 'ON' : 'OFF'}</span>`;
    btn.style.borderColor = enabled ? '#38bdf8' : '#475569';
  }
  const modalBtn = document.getElementById('modal-touch-toggle-btn');
  if (modalBtn) {
    modalBtn.innerHTML = `VIRTUAL TOUCHPAD: <b style="color:${enabled ? '#4ade80' : '#ef4444'};">${enabled ? 'ON' : 'OFF'}</b>`;
    modalBtn.style.borderColor = enabled ? '#4ade80' : '#64748b';
  }
}

export function toggleTouchControls(force) {
  const isCurrentlyOn = document.body.classList.contains('touch-mode');
  const next = typeof force === 'boolean' ? force : !isCurrentlyOn;
  if (next) {
    document.body.classList.add('touch-mode');
    localStorage.setItem('glimmerfall_touch_controls', '1');
  } else {
    document.body.classList.remove('touch-mode');
    localStorage.setItem('glimmerfall_touch_controls', '0');
  }
  updateTouchUiButtons(next);
  return next;
}

export function initTouchControls({ inputs, cycleTarget, harvestTarget, onFirstTouch }) {
  const style = document.createElement('style');
  style.textContent = TOUCH_CSS;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'touch-layer';
  layer.innerHTML = `
    <div id="touch-stick"><div id="touch-knob"></div></div>
    <div class="touch-btn" id="touch-btn-sprint"><span class="ti">💨</span>SPRINT</div>
    <div class="touch-btn" id="touch-btn-target"><span class="ti">🎯</span>TARGET</div>
    <div class="touch-btn" id="touch-btn-harvest"><span class="ti">🔮</span>GLIMMER</div>
    <div class="touch-btn" id="touch-btn-chat"><span class="ti">💬</span>CHAT</div>
  `;
  document.body.appendChild(layer);

  const initialEnabled = shouldEnableTouch();
  if (initialEnabled) {
    document.body.classList.add('touch-mode');
  }
  window.toggleTouchControls = toggleTouchControls;
  updateTouchUiButtons(initialEnabled);

  const stick = layer.querySelector('#touch-stick');
  const knob = layer.querySelector('#touch-knob');
  const RADIUS = 40;
  const DEAD = 0.18;
  let stickPointer = null;

  function setAxis(dx, dy) {
    let len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
      len = RADIUS;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const nx = dx / RADIUS;
    const ny = dy / RADIUS;
    const mag = Math.hypot(nx, ny);
    if (mag < DEAD) {
      inputs.axisX = 0;
      inputs.axisY = 0;
    } else {
      inputs.axisX = nx;
      inputs.axisY = ny;
    }
  }

  function resetStick() {
    stickPointer = null;
    knob.style.transform = 'translate(0px, 0px)';
    inputs.axisX = 0;
    inputs.axisY = 0;
  }

  function stickEvent(e) {
    const r = stick.getBoundingClientRect();
    setAxis(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  }

  stick.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onFirstTouch?.();
    stickPointer = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    stickEvent(e);
  });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId === stickPointer) stickEvent(e);
  });
  const endStick = (e) => {
    if (e.pointerId === stickPointer) resetStick();
  };
  stick.addEventListener('pointerup', endStick);
  stick.addEventListener('pointercancel', endStick);

  function bindTap(id, handler) {
    const el = layer.querySelector(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onFirstTouch?.();
      el.classList.add('active');
      handler(el);
    });
    const off = () => el.classList.remove('active');
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
    return el;
  }

  let sprintLatched = false;
  bindTap('#touch-btn-sprint', (el) => {
    sprintLatched = !sprintLatched;
    inputs.shift = sprintLatched;
    // keep the latched look after pointerup
    setTimeout(() => el.classList.toggle('active', sprintLatched), 0);
  });
  bindTap('#touch-btn-target', () => cycleTarget());
  bindTap('#touch-btn-harvest', () => harvestTarget());
  bindTap('#touch-btn-chat', () => {
    const inp = document.getElementById('chat-input');
    if (inp) inp.focus();
  });

  // Fit the action bar to narrow screens
  function fitDock() {
    const dock = document.getElementById('bottom-bar-dock');
    const cluster = document.getElementById('action-bar-cluster');
    if (!dock || !cluster) return;
    dock.style.transform = 'translateX(-50%)';
    const need = cluster.scrollWidth + 8;
    const avail = window.innerWidth - 12;
    const s = Math.min(1, avail / need);
    dock.style.transform = `translateX(-50%) scale(${s})`;

    // Lift the thumbstick / buttons above the action bar
    const lift = Math.round(dock.getBoundingClientRect().height + 14);
    layer.querySelectorAll('#touch-stick, .touch-btn').forEach((el) => {
      if (!el.dataset.baseBottom) el.dataset.baseBottom = parseInt(getComputedStyle(el).bottom, 10) - 96;
      el.style.bottom = `${lift + Number(el.dataset.baseBottom)}px`;
    });
  }
  window.addEventListener('resize', fitDock);
  window.addEventListener('orientationchange', () => setTimeout(fitDock, 250));
  setTimeout(fitDock, 50);
  setTimeout(fitDock, 800);

  // Block page pinch-zoom / scroll while playing
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.target.closest?.('.modal, #chat-log, input, textarea')) return;
    e.preventDefault();
  }, { passive: false });

  return { enabled: true, resetStick, toggle: toggleTouchControls };
}
