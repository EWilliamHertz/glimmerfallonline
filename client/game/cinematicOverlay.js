// ==========================================
// GlimmerFall Online — In-Game Skippable 1080p Flow Cinematic Overlay
// ==========================================
import { FLOW_CINEMATICS } from './mediaCatalog.js';

let activeOverlayEl = null;

export function isCinematicPlaying() {
  return Boolean(activeOverlayEl);
}

export function closeActiveCinematic() {
  if (!activeOverlayEl) return;
  const el = activeOverlayEl;
  activeOverlayEl = null;
  const video = el.querySelector('video');
  if (video) {
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (_) {}
  }
  if (el._escHandler) {
    window.removeEventListener('keydown', el._escHandler, true);
  }
  el.remove();
  if (typeof el._onComplete === 'function') {
    el._onComplete();
  }
}

export function playInGameCinematic(cinematicKey, { audio = null, onComplete = null } = {}) {
  if (typeof document === 'undefined') return false;
  const spec = FLOW_CINEMATICS[cinematicKey];
  if (!spec || !spec.url) return false;
  if (localStorage.getItem('glimmerfall_disable_cinematics') === '1') return false;

  if (activeOverlayEl) closeActiveCinematic();

  const overlay = document.createElement('div');
  overlay.id = 'gf-cinematic-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:99990',
    'background:rgba(4,6,14,0.94)',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'padding:20px',
    'backdrop-filter:blur(6px)',
    'animation:fadeIn 0.25s ease',
  ].join(';');

  const volume = audio && !audio.muted
    ? Math.max(0, Math.min(1, (audio.bgmVolume ?? 0.5) * (audio.masterVolume ?? 0.8)))
    : 0;

  overlay.innerHTML = `
    <div style="width:min(960px, 95vw); display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-size:11px; letter-spacing:1.4px; text-transform:uppercase; color:#facc15; font-weight:700;">🎬 ${spec.subtitle || 'GlimmerFall Cinematic'}</div>
          <div style="font-size:18px; font-weight:800; color:#f8fafc;">${spec.title}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button id="gf-cinematic-mute" class="pixel-btn" style="font-size:11px; padding:6px 10px;">${volume > 0 ? '🔊 Sound On' : '🔇 Muted'}</button>
          <button id="gf-cinematic-skip" class="pixel-btn" style="font-size:12px; padding:6px 14px; background:#7c3aed; border-color:#c084fc; color:#fff;">Skip [Esc] ⏭</button>
        </div>
      </div>
      <div style="position:relative; width:100%; aspect-ratio:16/9; background:#000; border:2px solid rgba(250,204,21,0.45); border-radius:8px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.75);">
        <video id="gf-cinematic-video" src="${spec.url}" playsinline autoplay style="width:100%; height:100%; object-fit:cover; display:block;"></video>
      </div>
    </div>
  `;

  overlay._onComplete = onComplete;
  const escHandler = (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      closeActiveCinematic();
    }
  };
  overlay._escHandler = escHandler;
  window.addEventListener('keydown', escHandler, true);

  document.body.appendChild(overlay);
  activeOverlayEl = overlay;

  const video = overlay.querySelector('#gf-cinematic-video');
  const skipBtn = overlay.querySelector('#gf-cinematic-skip');
  const muteBtn = overlay.querySelector('#gf-cinematic-mute');

  if (video) {
    video.volume = volume;
    video.muted = volume === 0;
    video.addEventListener('ended', () => closeActiveCinematic());
    video.addEventListener('error', () => closeActiveCinematic());
    video.play().catch(() => {
      // iPad/Safari autoplay fallback: mute and retry
      video.muted = true;
      if (muteBtn) muteBtn.textContent = '🔇 Muted';
      video.play().catch(() => {});
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => closeActiveCinematic());
  }
  if (muteBtn && video) {
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 0.6;
      muteBtn.textContent = video.muted ? '🔇 Muted' : '🔊 Sound On';
    });
  }

  return true;
}
