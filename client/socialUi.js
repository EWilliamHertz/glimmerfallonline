// ==========================================
// GlimmerFall Online 2D — Social MMO Layer, GlimmerFall ID Modal & Pixel Bubbles
// ==========================================

import {
  FACTIONS_META,
  ORDER_PRESETS,
  EMOTES_CATALOG,
} from '../shared/protocol.js';

export function drawPixelNameplateAndBubbles(ctx, {
  sx,
  topY,
  name,
  title = '',
  faction = 'Solari',
  orderTag = '',
  orderColor = '#facc15',
  level = 1,
  hp = 25,
  maxHp = 25,
  shield = 0,
  isSelf = false,
  isParty = false,
  isHostile = false,
  tcgLinked = false,
  skull = null,
  bubble = null,
  emote = null,
  globalTime = 0,
  isHd = false,
}) {
  ctx.save();

  // 1. Remote Player Health Bar (above head)
  if (!isSelf) {
    const bw = isHd ? 28 : 20;
    const bx = Math.round(sx - bw / 2);
    const by = Math.round(topY - (isHd ? 7 : 5));
    const bh = isHd ? 3 : 2;
    ctx.fillStyle = '#070a12';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = shield > 0 ? '#38bdf8' : isHostile ? '#ef4444' : isParty ? '#4ade80' : '#22c55e';
    ctx.fillRect(bx, by, Math.max(0, Math.round((hp / Math.max(1, maxHp)) * bw)), bh);
  }

  // 2. Crisp, High-Contrast Nameplate + <ORDER> Tag
  const fontPx = isHd ? 12.5 : 11;
  ctx.font = `700 ${fontPx}px "Outfit", system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const tagPrefix = orderTag && orderTag !== 'NONE' ? `<${orderTag}> ` : '';
  const tcgStar = tcgLinked ? '⚡ ' : '';
  const label = `${tcgStar}${tagPrefix}${name}`;
  const rx = Math.round(sx);
  const ny = Math.round(isSelf ? topY - (isHd ? 8 : 6) : topY - (isHd ? 14 : 11));
  const labelW = Math.ceil(ctx.measureText(label).width);
  const facColor = FACTIONS_META[faction]?.color || orderColor || '#facc15';
  const textColor = isHostile ? '#fecaca' : isParty ? '#bbf7d0' : '#ffffff';
  const accentColor = isHostile ? '#ef4444' : isParty ? '#4ade80' : facColor;

  // Dark high-contrast plaque with faction accent line
  const padX = isHd ? 10 : 8;
  const plateW = labelW + padX;
  const plateH = isHd ? 17 : 14;
  const plateX = Math.round(rx - plateW / 2);
  const plateY = Math.round(ny - (isHd ? 13 : 11));
  ctx.fillStyle = 'rgba(5, 7, 15, 0.92)';
  ctx.fillRect(plateX, plateY, plateW, plateH);
  ctx.fillStyle = accentColor;
  ctx.fillRect(plateX, plateY + plateH - 1, plateW, isHd ? 1.5 : 1);

  // Sharp, anti-aliased typography (smooth vector shadow when in HD mode)
  if (isHd) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 2.5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = isHostile ? textColor : isParty ? textColor : facColor;
    ctx.fillText(label, rx, ny);
    ctx.shadowColor = 'transparent';
  } else {
    ctx.fillStyle = '#05070f';
    ctx.fillText(label, rx + 1, ny + 1);
    ctx.fillStyle = isHostile ? textColor : isParty ? textColor : facColor;
    ctx.fillText(label, rx, ny);
  }

  // 2b. Cosmetic Player Title (<The Forest Warden>, <Crimson Arborist>, etc.)
  let topBadgeY = plateY;
  if (title) {
    const titleFontPx = isHd ? 9.5 : 8.5;
    ctx.font = `600 italic ${titleFontPx}px "Outfit", system-ui, -apple-system, sans-serif`;
    const titleLabel = `<${title}>`;
    const titleW = Math.ceil(ctx.measureText(titleLabel).width);
    const titlePadX = isHd ? 8 : 6;
    const titlePlateW = titleW + titlePadX;
    const titlePlateH = isHd ? 12 : 10;
    const titlePlateX = Math.round(rx - titlePlateW / 2);
    const titlePlateY = Math.round(plateY - titlePlateH - 2);

    ctx.fillStyle = 'rgba(5, 7, 15, 0.88)';
    ctx.fillRect(titlePlateX, titlePlateY, titlePlateW, titlePlateH);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(titlePlateX, titlePlateY, titlePlateW, 1);
    ctx.fillStyle = '#fde047';
    ctx.fillText(titleLabel, rx, titlePlateY + titlePlateH - (isHd ? 2 : 1));
    topBadgeY = titlePlateY;
  }

  // 2c. Tibia Infamy Skull Badge (above nameplate & title)
  if (skull === 'white' || skull === 'red') {
    const isRed = skull === 'red';
    const skullColor = isRed ? '#ef4444' : '#f8fafc';
    const skullBorder = isRed ? '#7f1d1d' : '#475569';
    const eyeColor = '#05070f';
    const skY = Math.round(topBadgeY - (isHd ? 12 : 10));
    const skX = Math.round(rx - 6);

    ctx.fillStyle = 'rgba(5, 7, 15, 0.95)';
    ctx.fillRect(skX - 2, skY - 1, 16, 11);
    ctx.fillStyle = skullBorder;
    ctx.fillRect(skX - 1, skY, 14, 9);
    ctx.fillStyle = skullColor;

    // Skull forehead & jaw
    ctx.fillRect(skX + 1, skY + 1, 10, 4);
    ctx.fillRect(skX + 3, skY + 5, 6, 2);
    // Eye sockets & nose
    ctx.fillStyle = eyeColor;
    ctx.fillRect(skX + 3, skY + 2, 2, 2);
    ctx.fillRect(skX + 7, skY + 2, 2, 2);
    ctx.fillRect(skX + 5, skY + 4, 2, 1);
    // Teeth slits
    if (isRed) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(skX + 4, skY + 6, 1, 1);
      ctx.fillRect(skX + 6, skY + 6, 1, 1);
      const pulseAlpha = 0.35 + Math.sin(globalTime * 8) * 0.25;
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha.toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(skX - 3, skY - 2, 18, 13);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(skX + 4, skY + 6, 1, 1);
      ctx.fillRect(skX + 6, skY + 6, 1, 1);
    }
  }

  // 3. Pixel Emote Badge (bouncing above nameplate & title)
  if (emote && EMOTES_CATALOG[emote]) {
    const em = EMOTES_CATALOG[emote];
    const bounce = Math.round(Math.sin(globalTime * 10) * 2);
    const ey = topBadgeY - 12 + bounce;
    ctx.fillStyle = '#05070f';
    ctx.fillRect(sx - 8, ey - 7, 16, 12);
    ctx.fillStyle = em.color || '#fde047';
    ctx.fillRect(sx - 7, ey - 6, 14, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 6, ey - 5, 12, 8);
    ctx.font = '10px sans-serif';
    ctx.fillText(em.icon, sx, ey + 2);
  }

  // 4. Speech Bubble (above character's head)
  if (bubble) {
    const bubbleFontPx = isHd ? 12 : 11;
    ctx.font = `600 ${bubbleFontPx}px "Outfit", system-ui, sans-serif`;
    const cleanText = String(bubble).slice(0, 64);
    // Wrap up to 2 lines of ~22 chars
    const lines = [];
    if (cleanText.length <= 22) {
      lines.push(cleanText);
    } else {
      const splitAt = cleanText.lastIndexOf(' ', 22);
      const idx = splitAt > 8 ? splitAt : 22;
      lines.push(cleanText.slice(0, idx).trim());
      lines.push(cleanText.slice(idx).trim().slice(0, 24));
    }

    let maxLineW = 24;
    for (const ln of lines) {
      maxLineW = Math.max(maxLineW, Math.ceil(ctx.measureText(ln).width));
    }
    const padX = isHd ? 8 : 5;
    const lineH = isHd ? 14 : 9;
    const boxW = maxLineW + padX * 2;
    const boxH = lines.length * lineH + (isHd ? 8 : 5);
    const bx = Math.round(sx - boxW / 2);
    const by = Math.round((emote ? ny - (isHd ? 38 : 32) : ny - (isHd ? 18 : 13)) - boxH);
    const accent = FACTIONS_META[faction]?.color || '#38bdf8';

    // Outer outline
    ctx.fillStyle = '#05070f';
    ctx.fillRect(bx - 1, by - 1, boxW + 2, boxH + 2);
    // Faction border
    ctx.fillStyle = accent;
    ctx.fillRect(bx, by, boxW, boxH);
    // Dark parchment interior
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 1, by + 1, boxW - 2, boxH - 2);
    // Speech pointer tail
    ctx.fillStyle = '#05070f';
    ctx.fillRect(sx - 2, by + boxH, 5, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(sx - 1, by + boxH, 3, 2);

    ctx.fillStyle = '#f8fafc';
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, Math.round(sx), Math.round(by + (isHd ? 12 : 8) + idx * lineH));
    });
  }

  ctx.restore();
}

export function renderPartyHud(party, selfId) {
  const header = document.getElementById('party-header-txt');
  const leaveBtn = document.getElementById('btn-party-leave');
  const listEl = document.getElementById('party-members-list');
  if (!header || !listEl) return;

  if (!party || !party.members || party.members.length <= 1) {
    header.innerText = '🛡️ SQUAD (SOLO • MAX 3)';
    if (leaveBtn) leaveBtn.style.display = 'none';
    listEl.innerHTML = 'Click any player or press <b>[O]</b> to form a 3-player squad (+25% Co-op XP)!';
    return;
  }

  header.innerText = `🛡️ 3-PLAYER SQUAD (${party.members.length}/3)`;
  if (leaveBtn) leaveBtn.style.display = 'inline-block';

  listEl.innerHTML = party.members
    .map((m) => {
      const fMeta = FACTIONS_META[m.faction] || FACTIONS_META.Solari;
      const pct = Math.max(0, Math.min(100, Math.round((m.hp / Math.max(1, m.maxHp)) * 100)));
      const crown = m.id === party.leaderId ? '👑 ' : '';
      const youTag = m.id === selfId ? ' (You)' : '';
      return `
        <div class="party-member-row">
          <div style="display:flex; justify-content:space-between; color:#f8fafc; font-size:8.5px;">
            <span>${crown}${fMeta.icon} <b>${m.name}</b>${youTag}</span>
            <span style="color:#94a3b8;">Lv.${m.level} • ${Math.round(m.hp)}/${Math.round(m.maxHp)}</span>
          </div>
          <div class="bar-bg" style="height:6px; margin-top:2px;">
            <div class="bar-hp ${m.shield > 0 ? 'shielded' : ''}" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderAccountModal({ profile, authTab = 'register', statusMsg = '' }) {
  const container = document.getElementById('account-modal-body');
  if (!container) return;

  const p = profile || {
    displayName: 'Champion',
    isGuest: true,
    faction: 'Solari',
    orderTag: 'SUN',
    orderName: 'Order of Dawn',
    orderColor: '#facc15',
    tcgLinked: false,
    tcgHandle: null,
    statsMeta: { kills: 0, arenaWins: 0 },
  };

  container.innerHTML = `
    <div style="background:#080c18; border:2px solid #1e293b; padding:9px 10px; margin-bottom:10px; font-size:9.5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <div>
          ACCOUNT STATUS:
          <b style="color:${p.isGuest ? '#fbbf24' : '#4ade80'};">
            ${p.isGuest ? '⚡ GUEST SESSION (UNCLAIMED)' : `✓ GLIMMERFALL ID (@${p.username || p.displayName})`}
          </b>
        </div>
        <div>
          TCG LINK:
          <b style="color:${p.tcgLinked ? '#38bdf8' : '#94a3b8'};">
            ${p.tcgLinked ? `⚡ LINKED (${p.tcgHandle})` : 'NOT LINKED'}
          </b>
        </div>
      </div>
      <div style="margin-top:4px; color:#94a3b8; font-size:8.5px;">
        VOID BANISHES: <b style="color:#f8fafc;">${p.statsMeta?.kills || 0}</b> &nbsp;•&nbsp;
        3v3 RANKED ARENA WINS: <b style="color:#facc15;">${p.statsMeta?.arenaWins || 0}</b>
      </div>
      ${statusMsg ? `<div style="margin-top:6px; color:#fde047; font-weight:bold;">${statusMsg}</div>` : ''}
    </div>

    <!-- 1. Character Identity, Faction & Guild/Order Banner -->
    <div style="background:#080c18; border:2px solid #1e293b; padding:9px 10px; margin-bottom:10px;">
      <div style="font-family:var(--font-header); font-size:8px; color:#38bdf8; margin-bottom:6px;">
        1. CHAMPION IDENTITY, FACTION &amp; GUILD/ORDER BANNER
      </div>
      <div style="display:grid; grid-template-columns:1fr 90px 1fr; gap:6px; margin-bottom:6px;">
        <div>
          <label style="font-size:8px; color:#94a3b8;">CHARACTER NAME (PERMANENT)</label>
          <div style="font-family:var(--font-header); font-size:11px; color:#fde047; padding:4px 7px; background:#0b1120; border:1px solid #334155; border-radius:3px; display:flex; align-items:center; gap:5px; height:24px; box-sizing:border-box;">
            <span style="font-size:10px;">🔒</span>
            <span>${p.displayName || p.name || 'Champion'}</span>
          </div>
        </div>
        <div>
          <label style="font-size:8px; color:#94a3b8;">&lt;TAG&gt;</label>
          <input id="prof-order-tag" class="pixel-input" value="${p.orderTag || (p.faction === 'Umbri' ? 'VOID' : p.faction === 'Terra' ? 'ROOT' : p.faction === 'Aether' ? 'AETH' : 'SUN')}" maxlength="5" />
        </div>
        <div>
          <label style="font-size:8px; color:#94a3b8;">GUILD / ORDER NAME</label>
          <input id="prof-order-name" class="pixel-input" value="${p.orderName || (p.faction === 'Umbri' ? 'Duskveil Cabal' : p.faction === 'Terra' ? 'Ironwood Watch' : p.faction === 'Aether' ? 'Chronocore Wardens' : 'Order of Dawn')}" maxlength="18" />
        </div>
      </div>

      <label style="font-size:8px; color:#94a3b8;">CHOOSE GLIMMERFALL TCG FACTION (UPDATES 2D SPRITE &amp; /f CHAT):</label>
      <div class="faction-choice-grid" style="margin-bottom:8px;">
        ${Object.values(FACTIONS_META).map((f) => `
          <div class="faction-card-btn ${p.faction === f.id ? 'selected' : ''}" onclick="selectProfileFaction('${f.id}')">
            <img src="${f.logo}" alt="${f.id}" style="width:26px; height:26px; object-fit:contain; display:block; margin:0 auto 3px; filter:drop-shadow(0 0 3px ${f.color});" />
            <b style="color:${f.color}; font-size:9.5px;">${f.id.toUpperCase()}</b>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
        <div style="display:flex; gap:4px; align-items:center; font-size:8px; color:#94a3b8;">
          PRESET ORDERS:
          ${ORDER_PRESETS.map((o) => `
            <button class="id-mini-btn" style="border-color:${o.color}; color:${o.color};" onclick="applyOrderPreset('${o.tag}', '${o.name}', '${o.color}')">
              &lt;${o.tag}&gt;
            </button>
          `).join('')}
        </div>
        <button class="util-btn" style="border-color:#4ade80; color:#4ade80; font-size:8.5px;" onclick="saveProfileChanges()">
          💾 SAVE PROFILE &amp; BANNER
        </button>
      </div>
    </div>

    <!-- 2. Unified GlimmerFall ID Registration / Login & glimmerfalltcg.com SSO -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div style="background:#080c18; border:2px solid #1e293b; padding:10px 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-family:var(--font-header); font-size:12px; font-weight:700; color:#facc15;">2. PERSISTENT GLIMMERFALL ID</span>
          <div style="display:flex; gap:4px;">
            <button class="chat-tab ${authTab === 'register' ? 'active' : ''}" style="font-size:10px;" onclick="switchAccountAuthTab('register')">REGISTER</button>
            <button class="chat-tab ${authTab === 'login' ? 'active' : ''}" style="font-size:10px;" onclick="switchAccountAuthTab('login')">LOGIN</button>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <input id="auth-username" class="pixel-input" placeholder="GlimmerFall ID Username" maxlength="18" style="font-size:11px; padding:6px 8px;" />
          <input id="auth-password" class="pixel-input" type="password" placeholder="Password (min 4 chars)" maxlength="48" style="font-size:11px; padding:6px 8px;" />
          <button class="util-btn" style="border-color:#facc15; color:#fde047; font-size:11px; padding:6px;" onclick="submitGlimmerFallAuth('${authTab}')">
            ${authTab === 'register' ? '✨ CLAIM / REGISTER ID (KEEPS XP)' : '🔑 SIGN IN TO GLIMMERFALL ID'}
          </button>
        </div>
      </div>

      <div style="background:#080c18; border:2px solid #1e293b; padding:10px 12px;">
        <div style="font-family:var(--font-header); font-size:12px; font-weight:700; color:#38bdf8; margin-bottom:6px;">
          3. GLIMMERFALLTCG.COM SSO LINK
        </div>
        <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin-bottom:8px;">
          Link your <b>glimmerfalltcg.com</b> Summoner handle/email to unify your MMO Champion &amp; Card Collection!
        </p>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <input id="sso-tcg-handle" class="pixel-input" placeholder="glimmerfalltcg.com Handle or Email" value="${p.tcgHandle || ''}" style="font-size:11px; padding:6px 8px;" />
          <button class="util-btn" style="border-color:#38bdf8; color:#bae6fd; font-size:11px; padding:6px;" onclick="submitTcgSsoLink()">
            ⚡ LINK GLIMMERFALLTCG.COM ID
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderSocialModal({ rooms = [], currentRoomId = '', roomPlayers = [], selfId = '' }) {
  const container = document.getElementById('social-modal-body');
  if (!container) return;

  const others = roomPlayers.filter((p) => p.id !== selfId);

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
      <!-- Room Instances Browser -->
      <div style="background:#080c18; border:2px solid #1e293b; padding:10px;">
        <div style="font-family:var(--font-header); font-size:12px; font-weight:700; color:#facc15; margin-bottom:8px;">
          🌐 LIVE REALM INSTANCES
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          ${(rooms.length ? rooms : [
            { id: 'sanctuary_hub_1', title: 'SANCTUARY HUB #1', players: 1, maxPlayers: 60, pvp: false },
            { id: 'nexus_warzone_1', title: 'NEXUS WARZONE #1', players: 0, maxPlayers: 40, pvp: true, siegeActive: true },
            { id: 'solari_citadel_1', title: 'GOLDEN CITADEL #1', players: 0, maxPlayers: 30, pvp: false },
            { id: 'umbri_undercity_1', title: 'DUSKVEIL BOG #1', players: 0, maxPlayers: 30, pvp: false },
            { id: 'terra_orchard_1', title: 'GLIMMER ORCHARD #1', players: 0, maxPlayers: 30, pvp: false },
            { id: 'aether_spire_1', title: 'MIRRORGATE SPIRE #1', players: 0, maxPlayers: 30, pvp: false },
          ]).map((r) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#0d1324; border:1px solid ${r.id === currentRoomId ? '#facc15' : '#334155'}; padding:6px 8px; font-size:11px;">
              <div>
                <b style="color:${r.pvp ? '#f87171' : '#38bdf8'}; font-size:11.5px;">${r.title}</b>
                ${r.siegeActive ? '<span style="color:#fde047; font-size:10px; font-weight:bold;"> ⚡SIEGE</span>' : ''}
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">${r.players} / ${r.maxPlayers} Players • ${r.pvp ? 'PvPvE' : 'Co-op / Hub'}</div>
              </div>
              ${r.id === currentRoomId
                ? '<span style="color:#4ade80; font-size:11px; font-weight:bold;">HERE</span>'
                : `<button class="id-mini-btn" style="font-size:10px; padding:3px 7px;" onclick="switchServerRoom('${r.id}')">JOIN ▸</button>`}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Nearby Players & 3-Player Squad Invites -->
      <div style="background:#080c18; border:2px solid #1e293b; padding:10px;">
        <div style="font-family:var(--font-header); font-size:12px; font-weight:700; color:#4ade80; margin-bottom:8px;">
          🛡️ PLAYERS IN THIS INSTANCE (${roomPlayers.length})
        </div>
        <div style="display:flex; gap:6px; margin-bottom:8px;">
          <input id="manual-invite-input" class="pixel-input" placeholder="Invite player by name..." style="font-size:11px; padding:5px 8px; flex:1;" />
          <button class="util-btn" style="font-size:10.5px; border-color:#4ade80; color:#4ade80; padding:4px 8px;" onclick="inviteByInput()">+INVITE</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px; max-height:145px; overflow-y:auto;">
          ${others.length === 0
            ? '<div style="font-size:11px; color:#94a3b8; padding:8px 0;">No other champions in this room right now — invite friends by name to quest together!</div>'
            : others.map((pl) => {
                const fm = FACTIONS_META[pl.faction] || FACTIONS_META.Solari;
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0d1324; border:1px solid #334155; padding:5px 7px; font-size:11px;">
                    <div>
                      <span>${fm.icon} <b style="color:${fm.color};">${pl.name}</b></span>
                      <span style="color:#94a3b8; font-size:10px;"> Lv.${pl.level} ${pl.orderTag ? `&lt;${pl.orderTag}&gt;` : ''}</span>
                    </div>
                    <button class="id-mini-btn" style="border-color:#4ade80; color:#86efac; font-size:10px; padding:2px 6px;" onclick="sendPartyInviteTo('${pl.id}')">+SQUAD</button>
                  </div>
                `;
              }).join('')}
        </div>
      </div>
    </div>

    <!-- Emotes & Chat Slash Commands -->
    <div style="background:#080c18; border:2px solid #1e293b; padding:10px 12px; font-size:11px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
        <b style="color:#fde047; font-size:11.5px;">PIXEL EMOTES [V]:</b>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          ${Object.values(EMOTES_CATALOG).map((em) => `
            <button class="id-mini-btn" style="font-size:10.5px; padding:3px 7px;" onclick="triggerEmote('${em.id}'); toggleModal('social-modal');">
              ${em.icon} ${em.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div style="color:#94a3b8; font-size:10.5px;">
        <b>Chat Slash Commands:</b>
        <code>/s</code> Zone Bubble •
        <code>/f</code> Faction Chat •
        <code>/p</code> 3-Player Squad •
        <code>/o</code> Guild/Order •
        <code>/invite &lt;name&gt;</code> •
        <code>/wave</code> <code>/cheer</code> <code>/gg</code>
      </div>
    </div>

    <!-- Controls & Touchpad Settings -->
    <div style="background:#080c18; border:2px solid #1e293b; padding:10px 12px; font-size:11px; margin-top:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <b style="color:#fde047; font-size:11.5px;">📱 MOBILE / VIRTUAL TOUCHPAD:</b>
          <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Enables on-screen virtual joystick and touch action buttons</div>
        </div>
        <button id="modal-touch-toggle-btn" class="util-btn" style="border-color:#38bdf8; color:#38bdf8; font-size:10px; padding:5px 9px;" onclick="toggleTouchControls()">
          TOGGLE TOUCHPAD
        </button>
      </div>
    </div>

    <!-- Multiplayer Realm Gateway (Optional) -->
    <div style="background:#080c18; border:2px solid #1e293b; padding:10px 12px; font-size:11px; margin-top:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <b style="color:#38bdf8; font-size:11.5px;">🌐 REALM GATEWAY (ADVANCED):</b>
        <span style="color:#94a3b8; font-size:10px;">Default: Official Realm</span>
      </div>
      <div style="display:flex; gap:6px;">
        <input id="custom-server-inp" class="pixel-input" placeholder="e.g. custom realm URL or leave blank" value="${(typeof localStorage !== 'undefined' && localStorage.getItem('glimmerfall_server_url')) || ''}" style="flex:1; font-size:11px; padding:5px 8px;" />
        <button class="util-btn" style="border-color:#38bdf8; color:#38bdf8; font-size:10px; padding:4px 8px;" onclick="saveCustomServerUrl()">CONNECT</button>
        <button class="util-btn" style="border-color:#64748b; color:#94a3b8; font-size:10px; padding:4px 8px;" onclick="resetCustomServerUrl()">RESET</button>
      </div>
    </div>
  `;
}
