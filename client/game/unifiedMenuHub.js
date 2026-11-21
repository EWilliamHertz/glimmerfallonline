// ==========================================
// Unified Menu Hub & Combined Gear + Bag Controller
// De-cramps the top HUD dock into clean primary buttons while housing all
// secondary character/social/system panels in one spacious tabbed Hub Modal.
// ==========================================

import { EMOTES_CATALOG } from '../../shared/protocol.js';

export const HUB_TAB_SPECS = [
  { id: 'spells', label: 'Spells', icon: '📖', key: 'P', legacyModalId: 'spellbook-modal' },
  { id: 'stats', label: 'Stats', icon: '📊', key: 'C', legacyModalId: 'char-modal' },
  { id: 'skills', label: 'Skills', icon: '✨', key: 'N', legacyModalId: 'skills-modal' },
  { id: 'social', label: 'Social', icon: '👥', key: 'O', legacyModalId: 'social-modal' },
  { id: 'echoes', label: 'Echoes', icon: '🐾', key: 'G', legacyModalId: 'echo-cradle-modal' },
  { id: 'mail', label: 'Mail', icon: '📬', key: 'POST', legacyModalId: 'mail-modal' },
  { id: 'awards', label: 'Awards', icon: '🏆', key: 'Y', legacyModalId: 'achievements-modal' },
  { id: 'emote', label: 'Emotes', icon: '🎭', key: 'V', legacyModalId: null },
  { id: 'share', label: 'Share', icon: '📸', key: 'PNG', legacyModalId: null },
  { id: 'menu', label: 'Menu', icon: '⚙️', key: 'ESC', legacyModalId: 'settings-modal' },
];

export const LEGACY_MODAL_TO_HUB_TAB = Object.fromEntries(
  HUB_TAB_SPECS.filter((t) => t.legacyModalId).map((t) => [t.legacyModalId, t.id])
);

export function setupUnifiedMenuHub({
  getProfile,
  audio,
  renderEquipmentModal,
  renderInventoryModal,
  drawHeroCardCanvas,
  getCurrentRoomType,
  onPrepareTab,
  onSyncSettingsUi,
}) {
  let activeHubTab = 'menu';
  let mountedSourceModalId = null;
  let gearBagMounted = false;
  let gearBagPaneMode = 'both'; // 'both' | 'equip' | 'inv'

  function restoreMountedHubPanel() {
    if (!mountedSourceModalId) return;
    const viewport = document.getElementById('adventure-hub-viewport');
    const sourceEl = document.getElementById(mountedSourceModalId);
    if (viewport && sourceEl) {
      const dockedNodes = Array.from(viewport.querySelectorAll(`[data-hub-origin="${mountedSourceModalId}"]`));
      for (const node of dockedNodes) {
        node.removeAttribute('data-hub-origin');
        node.classList.remove('hub-mounted-body');
        sourceEl.appendChild(node);
      }
    }
    mountedSourceModalId = null;
  }

  function restoreGearBagPanels() {
    if (!gearBagMounted) return;
    const eqHost = document.getElementById('gearbag-equip-host');
    const invHost = document.getElementById('gearbag-inv-host');
    const eqModal = document.getElementById('equipment-modal');
    const invModal = document.getElementById('inventory-modal');
    const eqBody = document.getElementById('equipment-modal-body');
    const invBody = document.getElementById('inventory-modal-body');
    if (eqBody && eqModal && eqHost?.contains(eqBody)) eqModal.appendChild(eqBody);
    if (invBody && invModal && invHost?.contains(invBody)) invModal.appendChild(invBody);
    gearBagMounted = false;
  }

  function dockSourceModalIntoViewport(sourceModalId) {
    restoreMountedHubPanel();
    const viewport = document.getElementById('adventure-hub-viewport');
    const sourceEl = document.getElementById(sourceModalId);
    if (!viewport || !sourceEl) return false;
    viewport.innerHTML = '';
    const children = Array.from(sourceEl.children);
    for (const child of children) {
      child.setAttribute('data-hub-origin', sourceModalId);
      child.classList.add('hub-mounted-body');
      viewport.appendChild(child);
    }
    mountedSourceModalId = sourceModalId;
    return true;
  }

  function renderEmotePadInsideHub(viewport) {
    const profile = getProfile?.() || {};
    const name = profile?.displayName || profile?.name || 'Adventurer';
    viewport.innerHTML = `
      <div class="hub-inline-panel">
        <div class="hub-inline-header">
          <div>
            <div style="font-family:var(--font-header); font-size:14px; color:#f9a8d4;">🎭 EXPRESSIONS &amp; EMOTES [V]</div>
            <div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">Broadcast overhead animated pixel emotes to nearby champions as <b>${name}</b>. Press <b>[V]</b> anytime for quick radial access.</div>
          </div>
          <button type="button" class="util-btn" style="border-color:#ec4899; color:#fbcfe8; font-size:10px; padding:6px 10px;" onclick="window.closeMenuHub && window.closeMenuHub(); window.toggleEmoteWheel && window.toggleEmoteWheel();">
            ✨ Open Radial Wheel [V]
          </button>
        </div>
        <div class="hub-emote-grid">
          ${Object.values(EMOTES_CATALOG).map((em) => `
            <button type="button" class="hub-emote-card" style="border-color:${em.color || '#334155'}44;" onclick="window.triggerEmote && window.triggerEmote('${em.id}')">
              <span class="hub-emote-icon">${em.icon}</span>
              <span class="hub-emote-name" style="color:${em.color || '#fbcfe8'};">${em.label}</span>
              <span class="hub-emote-phrase">"${em.text}"</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderShareCardInsideHub(viewport) {
    const profile = getProfile?.() || {};
    const name = profile?.displayName || profile?.name || 'Champion';
    viewport.innerHTML = `
      <div class="hub-inline-panel" style="text-align:center;">
        <div class="hub-inline-header" style="text-align:left;">
          <div>
            <div style="font-family:var(--font-header); font-size:14px; color:#bae6fd;">📸 16-BIT PIXEL HERO CARD &amp; RECRUIT LINK</div>
            <div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">Download your pixel character portrait card or invite friends (+100 Starter Solar Gold bonus for recruits).</div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:8px;">
          <canvas id="gf-hub-share-canvas" width="640" height="360" style="width:100%; max-width:620px; height:auto; border-radius:10px; border:1px solid rgba(56,189,248,0.4); background:#070c18;"></canvas>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <button type="button" id="gf-hub-dl-btn" class="util-btn" style="background:linear-gradient(135deg,#f59e0b,#facc15); color:#090d16; font-weight:800; border:none; padding:8px 14px; font-size:11px;">📥 Download PNG Card</button>
            <button type="button" id="gf-hub-copy-btn" class="util-btn" style="background:#0284c7; color:#fff; font-weight:800; border:none; padding:8px 14px; font-size:11px;">🔗 Copy Recruit Link</button>
            <button type="button" id="gf-hub-tweet-btn" class="util-btn" style="background:#1e293b; color:#e2e8f0; font-weight:800; border:1px solid #475569; padding:8px 14px; font-size:11px;">🐦 Share on X</button>
            <button type="button" id="gf-hub-tcg-btn" class="util-btn" style="background:rgba(250,204,21,0.16); color:#fde047; font-weight:800; border:1px solid #facc15; padding:8px 14px; font-size:11px;">🃏 Launch 1v1 TCG Duel</button>
          </div>
          <div id="gf-hub-share-status" style="font-size:11px; color:#4ade80; min-height:16px;"></div>
        </div>
      </div>
    `;
    const cv = document.getElementById('gf-hub-share-canvas');
    if (cv && typeof drawHeroCardCanvas === 'function') drawHeroCardCanvas(cv);
    document.getElementById('gf-hub-dl-btn')?.addEventListener('click', () => {
      if (!cv) return;
      const a = document.createElement('a');
      a.download = `GlimmerFall_${String(name).replace(/\s+/g, '_')}.png`;
      a.href = cv.toDataURL('image/png');
      a.click();
      const st = document.getElementById('gf-hub-share-status');
      if (st) st.textContent = '✓ Downloaded 16-Bit Pixel Hero Card (.PNG)!';
    });
    document.getElementById('gf-hub-copy-btn')?.addEventListener('click', () => {
      const room = typeof getCurrentRoomType === 'function' ? getCurrentRoomType() : 'sanctuary_hub';
      const url = `https://glimmerfall.online/?ref=${encodeURIComponent(name)}&room=${encodeURIComponent(room)}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      const st = document.getElementById('gf-hub-share-status');
      if (st) st.textContent = `✓ Copied Recruit Link: ${url}`;
    });
    document.getElementById('gf-hub-tweet-btn')?.addEventListener('click', () => {
      const text = `Join my party in GlimmerFall Online — a 16-bit 2D Action MMORPG + 1v1 Tavern TCG playable free in browser & iPad! ⚔️✨ https://glimmerfall.online/?ref=${encodeURIComponent(name)}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    });
    document.getElementById('gf-hub-tcg-btn')?.addEventListener('click', () => {
      closeMenuHub();
      window.openTcgTavernDuel?.();
    });
  }

  function updateHubTabButtons() {
    document.querySelectorAll('#adventure-hub-tabs .hub-tab-btn').forEach((btn) => {
      const tid = btn.getAttribute('data-hub-tab');
      btn.classList.toggle('active', tid === activeHubTab);
    });
  }

  function syncHubAlertPip() {
    const pip = document.getElementById('hub-alert-pip');
    if (!pip) return;
    const sp = document.getElementById('skill-pt-pip');
    const stp = document.getElementById('stat-pt-pip');
    const mp = document.getElementById('mail-unread-pip');
    const parseCount = (el) => {
      if (!el || el.style.display === 'none') return 0;
      const num = parseInt(String(el.textContent || '').replace(/[^0-9]/g, ''), 10);
      return Number.isFinite(num) && num > 0 ? num : 0;
    };
    const total = parseCount(sp) + parseCount(stp) + parseCount(mp);
    if (total > 0) {
      pip.textContent = String(total);
      pip.style.display = 'inline-block';
    } else {
      pip.style.display = 'none';
    }
  }

  function switchHubTab(tabId = 'menu', { toggleIfAlreadyActive = false, playSound = true } = {}) {
    const hub = document.getElementById('adventure-hub-modal');
    if (!hub) return false;
    const valid = HUB_TAB_SPECS.some((t) => t.id === tabId) ? tabId : 'menu';
    const isCurrentlyOpen = hub.style.display === 'block';
    if (isCurrentlyOpen && toggleIfAlreadyActive && activeHubTab === valid) {
      closeMenuHub();
      return false;
    }

    document.querySelectorAll('.modal').forEach((m) => {
      if (m.id !== 'adventure-hub-modal') m.style.display = 'none';
    });
    restoreGearBagPanels();

    activeHubTab = valid;
    hub.style.display = 'block';
    updateHubTabButtons();

    const viewport = document.getElementById('adventure-hub-viewport');
    const spec = HUB_TAB_SPECS.find((t) => t.id === valid);
    if (spec?.legacyModalId) {
      dockSourceModalIntoViewport(spec.legacyModalId);
      onPrepareTab?.(valid);
    } else if (viewport) {
      restoreMountedHubPanel();
      if (valid === 'emote') renderEmotePadInsideHub(viewport);
      else if (valid === 'share') renderShareCardInsideHub(viewport);
    }

    if (valid === 'menu') onSyncSettingsUi?.();
    if (playSound) audio?.playChime?.();
    syncHubAlertPip();
    return true;
  }

  function closeMenuHub() {
    restoreMountedHubPanel();
    const hub = document.getElementById('adventure-hub-modal');
    if (hub) hub.style.display = 'none';
  }

  function syncGearBagPaneUi() {
    const modal = document.getElementById('gearbag-modal');
    if (!modal) return;
    modal.setAttribute('data-pane-mode', gearBagPaneMode);
    modal.querySelectorAll('[data-gb-pane]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-gb-pane') === gearBagPaneMode);
    });
  }

  function openGearAndBag(mode = 'both', { toggleIfOpen = false } = {}) {
    const modal = document.getElementById('gearbag-modal');
    if (!modal) return false;
    const currentlyOpen = modal.style.display === 'block';
    if (currentlyOpen && toggleIfOpen && (mode === 'both' || mode === gearBagPaneMode)) {
      closeGearAndBag();
      return false;
    }

    closeMenuHub();
    document.querySelectorAll('.modal').forEach((m) => {
      if (m.id !== 'gearbag-modal') m.style.display = 'none';
    });

    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 860;
    gearBagPaneMode = mode === 'both' ? (isNarrow ? 'inv' : 'both') : mode;
    if (mode === 'equip' || mode === 'inv') {
      gearBagPaneMode = isNarrow ? mode : 'both';
    }

    const eqHost = document.getElementById('gearbag-equip-host');
    const invHost = document.getElementById('gearbag-inv-host');
    const eqBody = document.getElementById('equipment-modal-body');
    const invBody = document.getElementById('inventory-modal-body');
    if (eqHost && eqBody) eqHost.appendChild(eqBody);
    if (invHost && invBody) invHost.appendChild(invBody);
    gearBagMounted = true;

    const prof = getProfile?.();
    if (prof) {
      renderEquipmentModal?.({ profile: prof });
      renderInventoryModal?.({ profile: prof });
    }

    syncGearBagPaneUi();
    modal.style.display = 'block';
    audio?.playInventory?.();
    return true;
  }

  function closeGearAndBag() {
    window.clearHoveredEquipment?.();
    restoreGearBagPanels();
    const modal = document.getElementById('gearbag-modal');
    if (modal) modal.style.display = 'none';
  }

  function switchGearBagPane(mode) {
    gearBagPaneMode = ['both', 'equip', 'inv'].includes(mode) ? mode : 'both';
    syncGearBagPaneUi();
    const prof = getProfile?.();
    if (prof) {
      if (gearBagPaneMode === 'both' || gearBagPaneMode === 'equip') renderEquipmentModal?.({ profile: prof });
      if (gearBagPaneMode === 'both' || gearBagPaneMode === 'inv') renderInventoryModal?.({ profile: prof });
    }
  }

  function isGearBagOpen() {
    return document.getElementById('gearbag-modal')?.style.display === 'block';
  }

  function isHubTabOpen(tabId) {
    return document.getElementById('adventure-hub-modal')?.style.display === 'block' && activeHubTab === tabId;
  }

  if (typeof window !== 'undefined') {
    window.openMenuHub = (tabId = 'menu', opts = {}) => switchHubTab(tabId, opts);
    window.closeMenuHub = closeMenuHub;
    window.openGearAndBag = (mode = 'both', opts = {}) => openGearAndBag(mode, opts);
    window.closeGearAndBag = closeGearAndBag;
    window.switchGearBagPane = switchGearBagPane;
  }

  // Observe pip changes so the top Menu button always reflects pending skill/stat/mail counts
  if (typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver(() => syncHubAlertPip());
    ['skill-pt-pip', 'stat-pt-pip', 'mail-unread-pip'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el, { attributes: true, childList: true, characterData: true, subtree: true });
    });
  }

  return {
    switchHubTab,
    closeMenuHub,
    openGearAndBag,
    closeGearAndBag,
    switchGearBagPane,
    restoreMountedHubPanel,
    restoreGearBagPanels,
    isGearBagOpen,
    isHubTabOpen,
    syncHubAlertPip,
    getActiveTab: () => activeHubTab,
  };
}
