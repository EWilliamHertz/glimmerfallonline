// ==========================================
// GlimmerFall Online 2D — Viral Recruitment, Shareable 16-Bit Pixel Hero Cards
// & 15-Minute Dynamic World Event HUD Tracker
// ==========================================

import { getActiveWorldEvent } from '../../shared/worldEvents.js';
import {
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  getTotalProfessionLevel,
} from '../../shared/protocol.js';

const REF_CLAIMED_KEY = 'glimmerfall_referral_bonus_claimed_v1';

export function setupWorldEventsAndHeroShare({
  getPlayerProfile = () => ({}),
  getPlayerEntity = () => ({}),
  getCurrentRoomType = () => 'sanctuary_hub',
  getCharacterSpriteCanvas = () => null,
  onTeleportToEvent = () => {},
  onGrantReferralGold = () => {},
  onLogMessage = () => {},
} = {}) {
  // 1. Check incoming ?ref=<HeroName> referral deep-link
  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const refHero = (params.get('ref') || '').trim().slice(0, 32);
      if (refHero && !localStorage.getItem(REF_CLAIMED_KEY)) {
        localStorage.setItem(REF_CLAIMED_KEY, refHero);
        setTimeout(() => {
          onGrantReferralGold(100, refHero);
          onLogMessage(
            `🎁 [Recruit-a-Champion] Welcome to GlimmerFall! You arrived via ${refHero}'s referral link and received +100 Starter Solar Gold!`,
            'log-solari'
          );
        }, 1200);
      }
    }
  } catch (_) {}

  // 2. Mount 15-Minute Dynamic World Event HUD Pill
  let lastBucket = -1;
  function ensureEventBannerDom() {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById('dynamic-world-event-pill');
    if (el) return el;
    const hud = document.getElementById('hud') || document.body;
    el = document.createElement('div');
    el.id = 'dynamic-world-event-pill';
    el.style.cssText = [
      'position:fixed',
      'top:44px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:180',
      'background:rgba(9,13,24,0.9)',
      'border:1.5px solid #facc15',
      'border-radius:99px',
      'padding:4px 12px',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'font-size:10.5px',
      'color:#f8fafc',
      'cursor:pointer',
      'box-shadow:0 4px 16px rgba(0,0,0,0.75)',
      'touch-action:manipulation',
      'white-space:nowrap',
      'max-width:94vw',
      'overflow:hidden',
    ].join(';');
    el.title = 'Click to travel to the active Dynamic World Event zone!';
    el.addEventListener('click', () => {
      const ev = getActiveWorldEvent();
      onTeleportToEvent(ev);
    });
    hud.appendChild(el);
    return el;
  }

  function tickWorldEventHud() {
    const ev = getActiveWorldEvent();
    const pill = ensureEventBannerDom();
    if (!pill) return;
    const inZone = ev.rooms.includes(getCurrentRoomType());
    pill.style.borderColor = ev.color;
    pill.innerHTML = `
      <span style="font-weight:900; color:${ev.color};">${ev.shortTitle}</span>
      <span style="color:#cbd5e1;">${ev.primaryRoomLabel}</span>
      <span style="background:rgba(255,255,255,0.1); padding:1px 6px; border-radius:99px; font-weight:700; color:#fde047;">⏳ ${ev.countdownText}</span>
      <span style="color:${inZone ? '#4ade80' : '#38bdf8'}; font-weight:800; font-size:9.5px;">
        ${inZone ? '✓ ACTIVE HERE (+35% XP)' : '⚡ GO ▸'}
      </span>
    `;
    if (lastBucket !== -1 && lastBucket !== ev.bucket) {
      onLogMessage(`📢 [World Event] ${ev.title} has begun in ${ev.primaryRoomLabel}! (${ev.subtitle.trim()})`, 'log-solari');
    }
    lastBucket = ev.bucket;
  }

  if (typeof window !== 'undefined') {
    setTimeout(tickWorldEventHud, 600);
    setInterval(tickWorldEventHud, 1000);
  }

  // 3. Shareable 16-Bit Pixel Hero Card Modal
  function drawHeroCardCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 640;
    const H = 360;
    canvas.width = W;
    canvas.height = H;

    const prof = getPlayerProfile() || {};
    const ent = getPlayerEntity() || {};
    const name = prof.name || ent.name || 'Champion';
    const faction = prof.faction || ent.faction || 'Solari';
    const classId = prof.classId || ent.classId || 'solari_vanguard';
    const orderTag = prof.orderTag || ent.orderTag || 'SUN';
    const level = prof.progression?.level || ent.level || 1;
    const totalSkill = getTotalProfessionLevel(prof.progression?.professions || {});
    const fMeta = FACTIONS_META[faction] || FACTIONS_META.Solari;
    const clsMeta = CLASSES_CATALOG[classId] || CLASSES_CATALOG.solari_vanguard;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#090d18');
    grad.addColorStop(0.55, '#131c31');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle pixel grid overlay
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += 16) ctx.fillRect(0, y, W, 1);

    // Outer & inner faction border
    ctx.strokeStyle = fMeta.color || '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 14, W - 28, H - 28);

    // Pedestal box on left
    ctx.fillStyle = 'rgba(9, 13, 24, 0.85)';
    ctx.fillRect(28, 30, 176, 230);
    ctx.strokeStyle = fMeta.color || '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 30, 176, 230);

    // Glow under character sprite
    const rad = ctx.createRadialGradient(116, 175, 6, 116, 175, 68);
    rad.addColorStop(0, `${fMeta.color || '#facc15'}66`);
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.fillRect(36, 90, 160, 150);

    // Draw 16-bit character sprite scaled crisp
    const sprCanvas = getCharacterSpriteCanvas();
    if (sprCanvas) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprCanvas, 60, 72, 112, 112);
      ctx.restore();
    }

    // Level & Faction pill under pedestal
    ctx.fillStyle = fMeta.color || '#facc15';
    ctx.fillRect(42, 218, 148, 26);
    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LV.${level} ${faction.toUpperCase()}`, 116, 236);

    // Right column header & Hero Identity
    ctx.textAlign = 'left';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('GLIMMERFALL ONLINE • OFFICIAL CHAMPION CARD', 224, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${name} [${orderTag}]`, 224, 84);

    ctx.fillStyle = fMeta.color || '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${clsMeta?.name || classId} • Total Skill Lv. ${totalSkill}`, 224, 110);

    // Stats & Equipped Loadout Summary
    const eq = prof.equipment || ent.equipment || {};
    const weaponName = EQUIPMENT_CATALOG[eq.weapon]?.name || 'Starter Blade';
    const armorName = EQUIPMENT_CATALOG[eq.armor]?.name || 'Adventurer Vest';
    const relicName = EQUIPMENT_CATALOG[eq.accessory]?.name || 'Glimmer Charm';

    const rows = [
      `⚔️ Weapon: ${weaponName}`,
      `🛡️ Armor: ${armorName}`,
      `💍 Relic: ${relicName}`,
      `❤️ Max Health: ${Math.round(ent.maxHp || 120)} HP   •   ✨ Glimmer: ${Math.round(ent.maxSolarCharge || 100)}`,
    ];
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px sans-serif';
    rows.forEach((r, i) => {
      ctx.fillText(r, 224, 146 + i * 26);
    });

    // Bottom Call-to-Action & Referral Banner
    ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
    ctx.fillRect(28, 278, W - 56, 54);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.strokeRect(28, 278, W - 56, 54);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`🎮 JOIN MY PARTY FREE IN BROWSER (DESKTOP, PHONE & IPAD):`, 44, 300);
    ctx.fillStyle = '#7fdbff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`https://glimmerfall.online/?ref=${encodeURIComponent(name)}`, 44, 322);
  }

  function openHeroShareModal() {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('gf-hero-share-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gf-hero-share-modal';
      modal.style.cssText =
        'position:fixed; inset:0; z-index:9600; background:rgba(4,7,15,0.86); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:14px;';
      modal.innerHTML = `
        <div style="background:#0f172a; border:2px solid #facc15; border-radius:16px; padding:18px; max-width:690px; width:100%; color:#f8fafc; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.9);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h3 style="margin:0; font-size:17px; color:#fde047;">📸 SHARE 16-BIT PIXEL HERO CARD & RECRUIT FRIENDS</h3>
            <button type="button" id="gf-hero-share-close" style="background:transparent; border:1px solid #475569; color:#cbd5e1; border-radius:8px; padding:5px 10px; cursor:pointer;">✖ Close</button>
          </div>
          <p style="font-size:12px; color:#94a3b8; margin:0 0 12px;">Download your Pixel Champion Card or share your personal Recruit-a-Friend link (+100 Starter Solar Gold for new recruits!):</p>
          <canvas id="gf-hero-share-canvas" width="640" height="360" style="width:100%; max-width:640px; height:auto; border-radius:10px; border:1px solid rgba(255,255,255,0.2);"></canvas>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px;">
            <button type="button" id="gf-hero-dl-btn" style="background:linear-gradient(135deg,#f59e0b,#facc15); color:#090d16; font-weight:800; border:none; border-radius:10px; padding:9px 16px; cursor:pointer; font-size:12px;">📥 Download PNG Card</button>
            <button type="button" id="gf-hero-copy-btn" style="background:#0284c7; color:#fff; font-weight:800; border:none; border-radius:10px; padding:9px 16px; cursor:pointer; font-size:12px;">🔗 Copy Recruit Link</button>
            <button type="button" id="gf-hero-tweet-btn" style="background:#1e293b; color:#e2e8f0; font-weight:800; border:1px solid #475569; border-radius:10px; padding:9px 16px; cursor:pointer; font-size:12px;">🐦 Share on X</button>
          </div>
          <div id="gf-hero-share-status" style="font-size:11.5px; color:#4ade80; margin-top:8px; min-height:16px;"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
      document.getElementById('gf-hero-share-close')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      document.getElementById('gf-hero-dl-btn')?.addEventListener('click', () => {
        const cv = document.getElementById('gf-hero-share-canvas');
        if (!cv) return;
        const prof = getPlayerProfile() || {};
        const a = document.createElement('a');
        a.download = `GlimmerFall_${(prof.name || 'Champion').replace(/\s+/g, '_')}.png`;
        a.href = cv.toDataURL('image/png');
        a.click();
        const st = document.getElementById('gf-hero-share-status');
        if (st) st.textContent = '✓ Downloaded 16-Bit Pixel Hero Card (.PNG)!';
      });
      document.getElementById('gf-hero-copy-btn')?.addEventListener('click', () => {
        const prof = getPlayerProfile() || {};
        const name = prof.name || 'Champion';
        const url = `https://glimmerfall.online/?ref=${encodeURIComponent(name)}&room=${encodeURIComponent(getCurrentRoomType())}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        const st = document.getElementById('gf-hero-share-status');
        if (st) st.textContent = `✓ Copied Recruit Link: ${url}`;
      });
      document.getElementById('gf-hero-tweet-btn')?.addEventListener('click', () => {
        const prof = getPlayerProfile() || {};
        const name = prof.name || 'Champion';
        const text = `Join my party in GlimmerFall Online — a 16-bit 2D Action MMORPG + 1v1 Tavern TCG playable free in browser & iPad! ⚔️✨ https://glimmerfall.online/?ref=${encodeURIComponent(name)}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      });
    }

    modal.style.display = 'flex';
    const cv = document.getElementById('gf-hero-share-canvas');
    drawHeroCardCanvas(cv);
  }

  if (typeof window !== 'undefined') {
    window.openHeroShareCard = openHeroShareModal;
  }

  return {
    openHeroShareModal,
    tickWorldEventHud,
  };
}
