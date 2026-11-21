// ==========================================
// GlimmerFall Online 2D — Viral Recruitment, Shareable 16-Bit Pixel Hero Cards
// & 15-Minute Dynamic World Event HUD Tracker
// ==========================================

import { getActiveWorldEvent } from '../../shared/worldEvents.js';
import {
  ROOM_TYPES,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  getTotalProfessionLevel,
} from '../../shared/protocol.js';

const REF_CLAIMED_KEY = 'glimmerfall_referral_bonus_claimed_v1';

export const RECOMMENDED_ACTIVITIES = [
  {
    roomType: ROOM_TYPES.SANCTUARY_HUB,
    title: '🏛️ Sanctuary Haven & Artisan Plaza (Lv. 1–10)',
    desc: 'Safe capital hub with all 7 Artisan Stations, Grand Exchange, Bank Vault, Vanguard Guildhall, and Hearthstone Inn.',
    badge: 'SAFE HUB & CRAFTING',
    color: '#4ade80',
  },
  {
    roomType: ROOM_TYPES.INTERIOR_TAVERN,
    title: '🃏 Hearthstone Inn 1v1 GlimmerFall TCG Arena (All Levels)',
    desc: 'Sit at the velvet duel table to battle GlimmerBot AI or online players with 40-card preconstructed & community decks!',
    badge: '1V1 CARD DUEL (+150✨)',
    color: '#facc15',
  },
  {
    roomType: ROOM_TYPES.LUMINOUS_CAVERN,
    title: '💎 CrystalEcho Caverns & Subterranean Grotto (Lv. 10–24)',
    desc: 'Bioluminescent caverns rich with Copper, Star-Iron, Mithril veins, glowing Crystal Geodes, and Echo Warden Crystallis.',
    badge: 'MINING & BOSS GROTTO',
    color: '#e879f9',
  },
  {
    roomType: ROOM_TYPES.CORAL_COAST,
    title: '🌊 Coral Coast & Brinelight Fishing Pier (Lv. 10–25)',
    desc: 'Cast lines for Silver Trout, Golden Koi, and Abyssal Eels along the twilight pier or visit Captain Brine in the Mariner Tavern.',
    badge: 'FISHING & COASTAL PVE',
    color: '#38bdf8',
  },
  {
    roomType: ROOM_TYPES.SUNKEN_OASIS,
    title: '🌴 Emerald Sunken Oasis & Mirage Springs (Lv. 12–28)',
    desc: 'Verdant desert spring teeming with Sunbloom Herbs, Chrono-Lotus, healing water pools, and Oasis Guardians.',
    badge: 'HERBALISM & OASIS',
    color: '#22e07b',
  },
  {
    roomType: ROOM_TYPES.SOLAR_HIGHLANDS,
    title: '☀️ Sunspire Highlands & Ambergris Crags (Lv. 16–32)',
    desc: 'High-altitude Solari peaks with rich ore seams, ancient sundials, and Starfall Meteor Shower events.',
    badge: 'HIGH-TIER MINING & PVE',
    color: '#f59e0b',
  },
  {
    roomType: ROOM_TYPES.INTERIOR_TCG_PAVILION,
    title: '🃏 Grand GlimmerFall TCG Pavilion & Dueling Hall (All Levels)',
    desc: 'Tournament hall in Northeast Sanctuary Haven with 3 interactive 1v1 TCG Duel Tables, Lucky Draw Totem & Card Lore Compendiums.',
    badge: 'TCG TOURNAMENT HALL',
    color: '#38bdf8',
  },
  {
    roomType: ROOM_TYPES.FROSTSPIRE_GLACIER,
    title: '❄️ Frostspire Glacier & Aurora Outlook (Lv. 22–38)',
    desc: 'Arctic frontier rich with Mithril veins, Ice-Melt fishing pools, Aurora Crystal Obelisks, Supply Sleds & Boss Borealis.',
    badge: 'ALPINE ENDGAME & MITHRIL',
    color: '#7dd3fc',
  },
  {
    roomType: ROOM_TYPES.MOONWELL_SANCTUM,
    title: '🌙 Silvermist Moonwell & Druid Sanctum (Lv. 20–38)',
    desc: 'Sacred moonlit grove with high-level botanical nodes, hidden treasure coffers, and restorative Moonwell waters.',
    badge: 'DRUID GROVE & LOOT',
    color: '#a855f7',
  },
  {
    roomType: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
    title: '🏛️ Forgotten First Nexus Ruins (Lv. 18–35)',
    desc: 'Ancient subterranean ruins with Covenant Rune Vault puzzles, elite constructs, and Relic Fragment drops.',
    badge: 'DUNGEON & RUNE PUZZLES',
    color: '#60a5fa',
  },
  {
    roomType: ROOM_TYPES.NEXUS_WARZONE,
    title: '⚔️ Continental Caldera Warzone & World Bosses (Lv. 15–50)',
    desc: 'Massive central battlefield featuring the 4 Covenant Outpost Nexuses, Shattered Nexus Siege events, and World Bosses.',
    badge: 'WORLD BOSSES & SIEGE',
    color: '#ef4444',
  },
];

export function setupWorldEventsAndHeroShare({
  getPlayerProfile = () => ({}),
  getPlayerEntity = () => ({}),
  getCurrentRoomType = () => 'sanctuary_hub',
  getCharacterSpriteCanvas = () => null,
  onTeleportToEvent = () => {},
  onTravelToRoom = () => {},
  onOpenTcgDuel = () => {},
  onGrantReferralGold = () => {},
  onLogMessage = () => {},
} = {}) {
  // 1. Check incoming ?ref=<HeroName> referral deep-link & ?instant=1 ad funnel
  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('instant') === '1' || params.get('quickplay') === '1') {
        window._pendingPlayOnBoot = true;
      }
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

  // 2. Mount 15-Minute Dynamic World Event HUD Banner directly above the XP bar
  let lastBucket = -1;
  function wireEventBannerEvents(pill) {
    if (!pill || pill.dataset.weWired === '1') return;
    pill.dataset.weWired = '1';
    const stopBubble = (e) => {
      e.stopPropagation();
    };
    pill.addEventListener('mousedown', stopBubble);
    pill.addEventListener('pointerdown', stopBubble);
    pill.addEventListener('touchstart', stopBubble, { passive: true });
    const goBtn = pill.querySelector('#gf-we-go-btn');
    if (goBtn) {
      goBtn.addEventListener('mousedown', stopBubble);
      goBtn.addEventListener('pointerdown', stopBubble);
      goBtn.addEventListener('touchstart', stopBubble, { passive: true });
      goBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ev = getActiveWorldEvent();
        if (getCurrentRoomType() === ev.primaryRoom) {
          openActivityFinderModal();
        } else {
          onTeleportToEvent(ev);
        }
      });
    }
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ev = getActiveWorldEvent();
      if (getCurrentRoomType() === ev.primaryRoom) {
        openActivityFinderModal();
      } else {
        onTeleportToEvent(ev);
      }
    });
  }

  function ensureEventBannerDom() {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById('dynamic-world-event-pill');
    if (el) {
      if (!el.querySelector('#gf-we-go-btn')) {
        el.innerHTML = `
          <span id="gf-we-title"></span>
          <span id="gf-we-room"></span>
          <span id="gf-we-timer"></span>
          <button type="button" id="gf-we-go-btn">⚡ GO ▸</button>
        `;
      }
      wireEventBannerEvents(el);
      return el;
    }
    const dock = document.getElementById('bottom-bar-dock');
    const xpWrap = document.getElementById('xp-bar-wrap');
    const host = dock || document.getElementById('hud') || document.body;
    el = document.createElement('div');
    el.id = 'dynamic-world-event-pill';
    el.className = 'world-event-xp-banner';
    if (!dock) {
      el.style.cssText = 'position:fixed; bottom:86px; left:50%; transform:translateX(-50%); z-index:180;';
    }
    el.title = 'Click GO to travel to the active Dynamic World Event zone!';
    el.innerHTML = `
      <span id="gf-we-title"></span>
      <span id="gf-we-room"></span>
      <span id="gf-we-timer"></span>
      <button type="button" id="gf-we-go-btn">⚡ GO ▸</button>
    `;
    if (dock && xpWrap && xpWrap.parentElement === dock) {
      dock.insertBefore(el, xpWrap);
    } else {
      host.appendChild(el);
    }
    wireEventBannerEvents(el);
    return el;
  }

  function tickWorldEventHud() {
    const ev = getActiveWorldEvent();
    const pill = ensureEventBannerDom();
    if (!pill) return;
    const curRoom = getCurrentRoomType();
    const inPrimary = curRoom === ev.primaryRoom;
    const inBonusRoom = ev.rooms.includes(curRoom);
    pill.style.borderColor = ev.color;
    const titleEl = pill.querySelector('#gf-we-title');
    const roomEl = pill.querySelector('#gf-we-room');
    const timerEl = pill.querySelector('#gf-we-timer');
    const goBtn = pill.querySelector('#gf-we-go-btn');
    if (titleEl) {
      titleEl.textContent = ev.shortTitle;
      titleEl.style.color = ev.color;
    }
    if (roomEl) {
      roomEl.textContent = ev.primaryRoomLabel;
    }
    if (timerEl) {
      timerEl.textContent = `⏳ ${ev.countdownText}`;
    }
    if (goBtn) {
      if (inPrimary) {
        goBtn.textContent = '✓ ACTIVE (+35% XP)';
        goBtn.classList.add('in-zone');
      } else if (inBonusRoom) {
        goBtn.textContent = '⚡ MAIN HUB ▸';
        goBtn.classList.remove('in-zone');
      } else {
        goBtn.textContent = '⚡ GO ▸';
        goBtn.classList.remove('in-zone');
      }
    }
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

  function openActivityFinderModal() {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('gf-activity-finder-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gf-activity-finder-modal';
      modal.style.cssText =
        'position:fixed; inset:0; z-index:9550; background:rgba(4,7,15,0.86); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:12px;';
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    const ev = getActiveWorldEvent();
    const curRoom = getCurrentRoomType();

    modal.innerHTML = `
      <div style="background:#0f172a; border:2px solid #facc15; border-radius:16px; padding:16px; max-width:780px; width:100%; max-height:90vh; overflow-y:auto; color:#f8fafc; box-shadow:0 20px 60px rgba(0,0,0,0.92);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; border-bottom:1px solid rgba(148,163,184,0.2); padding-bottom:10px; margin-bottom:12px;">
          <div>
            <h3 style="margin:0; font-size:17px; color:#fde047;">🧭 GLIMMERFALL ACTIVITY, WORLD EVENT & REALM FINDER</h3>
            <p style="margin:2px 0 0; font-size:11.5px; color:#94a3b8;">Jump directly into live 15-minute World Events, 1v1 Tavern TCG Duels, or recommended zones!</p>
          </div>
          <button type="button" id="gf-act-finder-close" style="background:transparent; border:1px solid #475569; color:#cbd5e1; border-radius:8px; padding:5px 10px; cursor:pointer;">✖ Close</button>
        </div>

        <!-- Featured Live 15-Minute World Event -->
        <div style="background:linear-gradient(135deg, rgba(30,27,75,0.9), rgba(15,23,42,0.95)); border:2px solid ${ev.color}; border-radius:12px; padding:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          <div style="flex:1; min-width:220px;">
            <div style="font-size:10px; font-weight:900; color:${ev.color}; letter-spacing:1px;">⚡ ACTIVE 15-MINUTE REALM EVENT (⏳ ${ev.countdownText} REMAINING)</div>
            <div style="font-size:16px; font-weight:900; color:#fff; margin-top:2px;">${ev.title} — ${ev.primaryRoomLabel}</div>
            <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px;">${ev.subtitle}</div>
          </div>
          <button type="button" id="gf-act-go-event" style="background:linear-gradient(135deg,#f59e0b,#facc15); color:#090d16; font-weight:900; border:none; border-radius:10px; padding:10px 16px; cursor:pointer; font-size:12px;">
            ⚡ Travel to ${ev.primaryRoomLabel} ▸
          </button>
        </div>

        <!-- Quick Feature Buttons -->
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
          <button type="button" id="gf-act-open-tcg" style="flex:1; min-width:190px; background:rgba(250,204,21,0.15); border:1.5px solid #facc15; color:#fde047; font-weight:800; border-radius:10px; padding:9px 12px; cursor:pointer; font-size:12px;">
            🃏 Play 1v1 GlimmerFall TCG Duel
          </button>
          <button type="button" id="gf-act-open-share" style="flex:1; min-width:190px; background:rgba(56,189,248,0.15); border:1.5px solid #38bdf8; color:#bae6fd; font-weight:800; border-radius:10px; padding:9px 12px; cursor:pointer; font-size:12px;">
            📸 Share Pixel Hero Card &amp; Recruit Link
          </button>
        </div>

        <!-- Recommended Continental Zones & Activities -->
        <div style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">
          Continental Zones, Dungeons &amp; Gathering Hotspots
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(330px, 1fr)); gap:8px;">
          ${RECOMMENDED_ACTIVITIES.map((act) => {
            const isHere = curRoom === act.roomType;
            return `
              <div style="background:rgba(9,13,24,0.82); border:1px solid ${isHere ? '#4ade80' : 'rgba(148,163,184,0.22)'}; border-radius:11px; padding:10px 12px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span style="font-size:13px; font-weight:800; color:${act.color};">${act.title}</span>
                  </div>
                  <span style="display:inline-block; margin-top:3px; font-size:9.5px; font-weight:800; background:${act.color}22; color:${act.color}; border:1px solid ${act.color}55; padding:1px 6px; border-radius:99px;">${act.badge}</span>
                  <p style="font-size:11px; color:#94a3b8; margin:5px 0 0; line-height:1.38;">${act.desc}</p>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                  <button
                    type="button"
                    data-gf-travel-room="${act.roomType}"
                    style="background:${isHere ? 'rgba(74,222,128,0.18)' : 'rgba(56,189,248,0.18)'}; border:1px solid ${isHere ? '#4ade80' : '#38bdf8'}; color:${isHere ? '#86efac' : '#bae6fd'}; font-weight:800; font-size:11px; padding:5px 12px; border-radius:8px; cursor:pointer;"
                  >
                    ${isHere ? '✓ Currently Here' : '🧭 Travel Here ▸'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    document.getElementById('gf-act-finder-close')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    document.getElementById('gf-act-go-event')?.addEventListener('click', () => {
      modal.style.display = 'none';
      onTeleportToEvent(ev);
    });
    document.getElementById('gf-act-open-tcg')?.addEventListener('click', () => {
      modal.style.display = 'none';
      onOpenTcgDuel();
    });
    document.getElementById('gf-act-open-share')?.addEventListener('click', () => {
      modal.style.display = 'none';
      openHeroShareModal();
    });
    modal.querySelectorAll('[data-gf-travel-room]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetRoom = btn.getAttribute('data-gf-travel-room');
        modal.style.display = 'none';
        if (targetRoom) onTravelToRoom(targetRoom);
      });
    });
  }

  if (typeof window !== 'undefined') {
    window.openHeroShareCard = () => {
      if (typeof window.openMenuHub === 'function' && document.getElementById('adventure-hub-modal')) {
        window.openMenuHub('share');
      } else {
        openHeroShareModal();
      }
    };
    window.openActivityFinder = openActivityFinderModal;
  }

  return {
    openHeroShareModal,
    openActivityFinderModal,
    drawHeroCardCanvas,
    tickWorldEventHud,
  };
}
