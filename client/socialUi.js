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
  bubble = null,
  emote = null,
  globalTime = 0,
}) {
  ctx.save();

  // 1. Remote Player Health Bar (above head)
  if (!isSelf) {
    const bw = 20;
    const bx = Math.round(sx - bw / 2);
    const by = Math.round(topY - 5);
    ctx.fillStyle = '#070a12';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = shield > 0 ? '#38bdf8' : isHostile ? '#ef4444' : isParty ? '#4ade80' : '#22c55e';
    ctx.fillRect(bx, by, Math.max(0, Math.round((hp / Math.max(1, maxHp)) * bw)), 2);
  }

  // 2. Bold, High-Contrast Pixel Nameplate + <ORDER> Tag (dark plaque + thick outline)
  ctx.font = 'bold 8px "Silkscreen", "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const tagPrefix = orderTag && orderTag !== 'NONE' ? `<${orderTag}> ` : '';
  const tcgStar = tcgLinked ? '⚡' : '';
  const label = `${tcgStar}${tagPrefix}${name}`;
  const ny = isSelf ? topY - 5 : topY - 10;
  const labelW = Math.ceil(ctx.measureText(label).width);
  const facColor = FACTIONS_META[faction]?.color || orderColor || '#facc15';
  const textColor = isHostile ? '#fecaca' : isParty ? '#bbf7d0' : '#ffffff';
  const accentColor = isHostile ? '#ef4444' : isParty ? '#4ade80' : facColor;

  // Dark semi-opaque plaque with faction-colored underline for instant legibility
  const plateW = labelW + 8;
  const plateX = Math.round(sx - plateW / 2);
  ctx.fillStyle = 'rgba(5, 7, 15, 0.82)';
  ctx.fillRect(plateX, ny - 8, plateW, 11);
  ctx.fillStyle = accentColor;
  ctx.fillRect(plateX, ny + 3, plateW, 1);

  // Thick 8-direction black outline
  ctx.fillStyle = '#000000';
  for (const [ox, oy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
    ctx.fillText(label, sx + ox, ny + oy);
  }
  // Bright fill (white by default, tinted when hostile/party) so name never washes out
  ctx.fillStyle = textColor;
  ctx.fillText(label, sx, ny);
  // Faction-colored name overlay for the actual character name (keeps faction identity)
  if (!isHostile && !isParty) {
    const nameW = Math.ceil(ctx.measureText(name).width);
    const prefixW = labelW - nameW;
    ctx.textAlign = 'left';
    ctx.fillStyle = facColor;
    ctx.fillText(name, Math.round(sx - labelW / 2 + prefixW), ny);
    ctx.textAlign = 'center';
  }

  // 3. Pixel Emote Badge (bouncing above nameplate)
  if (emote && EMOTES_CATALOG[emote]) {
    const em = EMOTES_CATALOG[emote];
    const bounce = Math.round(Math.sin(globalTime * 10) * 2);
    const ey = ny - 19 + bounce;
    ctx.fillStyle = '#05070f';
    ctx.fillRect(sx - 8, ey - 7, 16, 12);
    ctx.fillStyle = em.color || '#fde047';
    ctx.fillRect(sx - 7, ey - 6, 14, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 6, ey - 5, 12, 8);
    ctx.font = '7px sans-serif';
    ctx.fillText(em.icon, sx, ey + 2);
  }

  // 4. 16-Bit Pixel Speech Bubble (above character's head!)
  if (bubble) {
    ctx.font = 'bold 7px "Silkscreen", "Press Start 2P", monospace';
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
    const padX = 5;
    const lineH = 9;
    const boxW = maxLineW + padX * 2;
    const boxH = lines.length * lineH + 5;
    const bx = Math.round(sx - boxW / 2);
    const by = Math.round((emote ? ny - 32 : ny - 13) - boxH);
    const accent = FACTIONS_META[faction]?.color || '#38bdf8';

    // Outer pixel outline
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
      ctx.fillText(ln, sx, by + 8 + idx * lineH);
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
            <span style="color:#94a3b8;">Lv.${m.level} • ${m.hp}/${m.maxHp}</span>
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
    displayName: 'Solari Vanguard',
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
          <label style="font-size:8px; color:#94a3b8;">DISPLAY NAME</label>
          <input id="prof-display-name" class="pixel-input" value="${p.displayName || ''}" maxlength="18" />
        </div>
        <div>
          <label style="font-size:8px; color:#94a3b8;">&lt;TAG&gt;</label>
          <input id="prof-order-tag" class="pixel-input" value="${p.orderTag || 'SUN'}" maxlength="5" />
        </div>
        <div>
          <label style="font-size:8px; color:#94a3b8;">GUILD / ORDER NAME</label>
          <input id="prof-order-name" class="pixel-input" value="${p.orderName || 'Order of Dawn'}" maxlength="18" />
        </div>
      </div>

      <label style="font-size:8px; color:#94a3b8;">CHOOSE GLIMMERFALL TCG FACTION (UPDATES 2D SPRITE &amp; /f CHAT):</label>
      <div class="faction-choice-grid" style="margin-bottom:8px;">
        ${Object.values(FACTIONS_META).map((f) => `
          <div class="faction-card-btn ${p.faction === f.id ? 'selected' : ''}" onclick="selectProfileFaction('${f.id}')">
            <div style="font-size:13px;">${f.icon}</div>
            <b style="color:${f.color};">${f.id.toUpperCase()}</b>
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
      <div style="background:#080c18; border:2px solid #1e293b; padding:9px 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-family:var(--font-header); font-size:7.5px; color:#facc15;">2. PERSISTENT GLIMMERFALL ID</span>
          <div style="display:flex; gap:3px;">
            <button class="chat-tab ${authTab === 'register' ? 'active' : ''}" onclick="switchAccountAuthTab('register')">REGISTER</button>
            <button class="chat-tab ${authTab === 'login' ? 'active' : ''}" onclick="switchAccountAuthTab('login')">LOGIN</button>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <input id="auth-username" class="pixel-input" placeholder="GlimmerFall ID Username" maxlength="18" />
          <input id="auth-password" class="pixel-input" type="password" placeholder="Password (min 4 chars)" maxlength="48" />
          <button class="util-btn" style="border-color:#facc15; color:#fde047;" onclick="submitGlimmerFallAuth('${authTab}')">
            ${authTab === 'register' ? '✨ CLAIM / REGISTER ID (KEEPS XP)' : '🔑 SIGN IN TO GLIMMERFALL ID'}
          </button>
        </div>
      </div>

      <div style="background:#080c18; border:2px solid #1e293b; padding:9px 10px;">
        <div style="font-family:var(--font-header); font-size:7.5px; color:#38bdf8; margin-bottom:5px;">
          3. GLIMMERFALLTCG.COM SSO LINK
        </div>
        <p style="font-size:8.5px; color:#cbd5e1; line-height:1.35; margin-bottom:6px;">
          Link your <b>glimmerfalltcg.com</b> Summoner handle/email (or shared OAuth/Supabase JWT) to unify your MMO Hero &amp; Card Collection!
        </p>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <input id="sso-tcg-handle" class="pixel-input" placeholder="glimmerfalltcg.com Handle or Email" value="${p.tcgHandle || ''}" />
          <button class="util-btn" style="border-color:#38bdf8; color:#bae6fd;" onclick="submitTcgSsoLink()">
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
      <div style="background:#080c18; border:2px solid #1e293b; padding:9px;">
        <div style="font-family:var(--font-header); font-size:7.5px; color:#facc15; margin-bottom:6px;">
          🌐 LIVE 20Hz REALM INSTANCES
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
            <div style="display:flex; justify-content:space-between; align-items:center; background:#0d1324; border:1px solid ${r.id === currentRoomId ? '#facc15' : '#334155'}; padding:5px 7px; font-size:8.5px;">
              <div>
                <b style="color:${r.pvp ? '#f87171' : '#38bdf8'};">${r.title}</b>
                ${r.siegeActive ? '<span style="color:#fde047; font-size:7.5px;"> ⚡SIEGE</span>' : ''}
                <div style="color:#94a3b8; font-size:8px;">${r.players} / ${r.maxPlayers} Players • ${r.pvp ? 'PvPvE' : 'Co-op / Hub'}</div>
              </div>
              ${r.id === currentRoomId
                ? '<span style="color:#4ade80; font-size:8px; font-weight:bold;">HERE</span>'
                : `<button class="id-mini-btn" onclick="switchServerRoom('${r.id}')">JOIN ▸</button>`}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Nearby Players & 3-Player Squad Invites -->
      <div style="background:#080c18; border:2px solid #1e293b; padding:9px;">
        <div style="font-family:var(--font-header); font-size:7.5px; color:#4ade80; margin-bottom:6px;">
          🛡️ PLAYERS IN THIS INSTANCE (${roomPlayers.length})
        </div>
        <div style="display:flex; gap:4px; margin-bottom:6px;">
          <input id="manual-invite-input" class="pixel-input" placeholder="Invite player by name..." />
          <button class="util-btn" style="font-size:8px; border-color:#4ade80; color:#4ade80;" onclick="inviteByInput()">+INVITE</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; max-height:135px; overflow-y:auto;">
          ${others.length === 0
            ? '<div style="font-size:8.5px; color:#94a3b8;">No other champions in this room right now — share your tunnel URL to quest together!</div>'
            : others.map((pl) => {
                const fm = FACTIONS_META[pl.faction] || FACTIONS_META.Solari;
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0d1324; border:1px solid #334155; padding:4px 6px; font-size:8.5px;">
                    <div>
                      <span>${fm.icon} <b style="color:${fm.color};">${pl.name}</b></span>
                      <span style="color:#94a3b8;"> Lv.${pl.level} ${pl.orderTag ? `&lt;${pl.orderTag}&gt;` : ''}</span>
                    </div>
                    <button class="id-mini-btn" style="border-color:#4ade80; color:#86efac;" onclick="sendPartyInviteTo('${pl.id}')">+SQUAD</button>
                  </div>
                `;
              }).join('')}
        </div>
      </div>
    </div>

    <!-- Emotes & Chat Slash Commands -->
    <div style="background:#080c18; border:2px solid #1e293b; padding:8px 10px; font-size:8.5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:5px;">
        <b style="color:#fde047;">PIXEL EMOTES [V] &amp; ORDER BANNER [B]:</b>
        <div style="display:flex; gap:4px; flex-wrap:wrap;">
          ${Object.values(EMOTES_CATALOG).map((em) => `
            <button class="id-mini-btn" onclick="triggerEmote('${em.id}'); toggleModal('social-modal');">
              ${em.icon} ${em.label}
            </button>
          `).join('')}
          <button class="id-mini-btn" style="border-color:#facc15; color:#fde047;" onclick="plantOrderBanner(); toggleModal('social-modal');">
            ⚑ PLANT BANNER [B]
          </button>
        </div>
      </div>
      <div style="color:#94a3b8;">
        <b>Chat Slash Commands:</b>
        <code>/s</code> Zone Bubble •
        <code>/f</code> Faction Chat •
        <code>/p</code> 3-Player Squad •
        <code>/o</code> Guild/Order •
        <code>/invite &lt;name&gt;</code> •
        <code>/wave</code> <code>/cheer</code> <code>/gg</code>
      </div>
    </div>

    <!-- Multiplayer Server (Optional for Vercel Deployments) -->
    <div style="background:#080c18; border:2px solid #1e293b; padding:8px 10px; font-size:8.5px; margin-top:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <b style="color:#38bdf8;">🌐 MULTIPLAYER SERVER (OPTIONAL):</b>
        <span style="color:#94a3b8;">Default: Vercel / Same Origin</span>
      </div>
      <div style="display:flex; gap:6px;">
        <input id="custom-server-inp" class="pixel-input" placeholder="e.g. https://your-server.ngrok-free.dev" value="${(typeof localStorage !== 'undefined' && localStorage.getItem('glimmerfall_server_url')) || ''}" style="flex:1;" />
        <button class="util-btn" style="border-color:#38bdf8; color:#38bdf8; font-size:8px;" onclick="saveCustomServerUrl()">CONNECT</button>
        <button class="util-btn" style="border-color:#64748b; color:#94a3b8; font-size:8px;" onclick="resetCustomServerUrl()">RESET</button>
      </div>
    </div>
  `;
}
