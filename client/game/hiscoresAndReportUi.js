// ==========================================
// GlimmerFall Online 2D — Persistent Guilds, Friends/Ignore, Global Hiscores & Report UI
// ==========================================

import { EQUIPMENT_CATALOG, PROFESSIONS_CATALOG, MAX_GUILD_BANK_SLOTS } from '../../shared/protocol.js';

function esc(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderGuildAndRelationsHtml({ socialState = {}, profile = null } = {}) {
  const guild = socialState.guild || null;
  const friends = Array.isArray(socialState.friends) ? socialState.friends : [];
  const ignores = Array.isArray(socialState.ignores) ? socialState.ignores : [];
  const myId = profile?.id;
  const myMember = guild?.members?.find((m) => m.accountId === myId);
  const canManage = myMember && (myMember.rank === 'Leader' || myMember.rank === 'Officer');
  const isLeader = myMember && myMember.rank === 'Leader';
  const bagItems = Array.isArray(profile?.inventory) ? profile.inventory : [];

  return `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
      <!-- FRIENDS & IGNORE LIST -->
      <div style="background:#080c18; border:2px solid #1e293b; padding:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-family:var(--font-header); font-size:12px; font-weight:700; color:#fde047;">
            💛 FRIENDS &amp; IGNORE (${friends.length})
          </span>
          <button type="button" class="id-mini-btn" style="border-color:#facc15; color:#fde047;" onclick="openHiscoresModal()">
            🏆 HISCORES
          </button>
        </div>
        <div style="display:flex; gap:5px; margin-bottom:7px;">
          <input id="friend-name-input" class="pixel-input" placeholder="Player name..." style="flex:1; font-size:10.5px; padding:4px 7px;" />
          <button type="button" class="id-mini-btn" style="border-color:#4ade80; color:#86efac;" onclick="addFriendByInput()">+FRIEND</button>
          <button type="button" class="id-mini-btn" style="border-color:#f87171; color:#fca5a5;" onclick="addIgnoreByInput()">IGNORE</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; max-height:110px; overflow-y:auto; margin-bottom:7px;">
          ${friends.length === 0
            ? '<div style="font-size:10px; color:#64748b;">No friends added yet. Right-click players or add by name above.</div>'
            : friends.map((f) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#0d1324; border:1px solid ${f.online ? '#22c55e' : '#334155'}; padding:4px 7px; font-size:10.5px;">
                <div>
                  <span style="color:${f.online ? '#4ade80' : '#64748b'};">●</span>
                  <b style="color:${f.online ? '#f8fafc' : '#94a3b8'};">${esc(f.name)}</b>
                  <span style="font-size:9px; color:#38bdf8; margin-left:4px;">${f.online ? esc(f.roomType || 'Online') : 'Offline'}</span>
                </div>
                <div style="display:flex; gap:4px;">
                  ${f.online ? `<button type="button" class="id-mini-btn" onclick="openWhisperTo('${esc(f.name)}')" title="Private Whisper (/w)">/w</button>` : ''}
                  <button type="button" class="id-mini-btn" style="color:#fca5a5;" onclick="removeFriend('${esc(f.name)}')">✕</button>
                </div>
              </div>
            `).join('')}
        </div>
        ${ignores.length > 0 ? `
          <div style="font-size:9px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:5px;">
            <b>Ignored (${ignores.length}):</b>
            ${ignores.map((ig) => `<span style="display:inline-flex; align-items:center; gap:3px; background:#1e1b4b; padding:1px 5px; border-radius:3px; margin:2px;">${esc(ig.name)} <a href="javascript:void(0)" style="color:#f87171;" onclick="removeIgnore('${esc(ig.name)}')">✕</a></span>`).join('')}
          </div>
        ` : ''}
      </div>

      <!-- PERSISTENT GUILD & 24-SLOT VAULT -->
      <div style="background:#080c18; border:2px solid #1e293b; padding:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:7px;">
          <span style="font-family:var(--font-header); font-size:12px; font-weight:700; color:#38bdf8;">
            🏰 PERSISTENT GUILD ${guild ? `<${esc(guild.tag)}> ${esc(guild.name)}` : '(NONE)'}
          </span>
          ${guild ? `<button type="button" class="id-mini-btn" style="color:#fca5a5; border-color:#ef4444;" onclick="guildLeave()">LEAVE</button>` : ''}
        </div>
        ${!guild ? `
          <div style="display:flex; flex-direction:column; gap:6px; font-size:10px;">
            <div style="color:#94a3b8;">Found a persistent Guild for your squad, unlock shared <code>/g</code> chat, rank promotions &amp; a 24-slot Guild Bank Vault!</div>
            <div style="display:flex; gap:5px;">
              <input id="guild-create-name" class="pixel-input" placeholder="Guild Name..." maxlength="20" style="flex:1; font-size:10.5px; padding:4px 7px;" />
              <input id="guild-create-tag" class="pixel-input" placeholder="TAG" maxlength="4" style="width:62px; font-size:10.5px; padding:4px 6px; text-transform:uppercase;" />
              <button type="button" class="util-btn" style="border-color:#facc15; color:#fde047; font-size:10px; padding:4px 8px;" onclick="guildCreate()">FOUND</button>
            </div>
          </div>
        ` : `
          <div style="font-size:9.5px; color:#cbd5e1; background:#050814; border:1px solid #1e293b; padding:5px 7px; border-radius:4px; margin-bottom:6px;">
            <b style="color:#fde047;">MOTD:</b> ${esc(guild.motd || 'Type /g to chat!')}
            ${canManage ? `
              <div style="display:flex; gap:4px; margin-top:4px;">
                <input id="guild-motd-input" class="pixel-input" placeholder="Update MOTD..." style="flex:1; font-size:9.5px; padding:2px 5px;" />
                <button type="button" class="id-mini-btn" onclick="guildSetMotd()">SET</button>
              </div>
              <div style="display:flex; gap:4px; margin-top:4px;">
                <input id="guild-invite-input" class="pixel-input" placeholder="Invite champion..." style="flex:1; font-size:9.5px; padding:2px 5px;" />
                <button type="button" class="id-mini-btn" style="border-color:#4ade80; color:#86efac;" onclick="guildInvite()">+GUILD</button>
              </div>
            ` : ''}
          </div>
          <div style="max-height:85px; overflow-y:auto; display:flex; flex-direction:column; gap:3px; margin-bottom:6px;">
            ${guild.members.map((m) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#0d1324; border:1px solid #1e293b; padding:3px 6px; font-size:9.5px;">
                <div>
                  <span style="color:${m.online ? '#4ade80' : '#64748b'};">●</span>
                  <b style="color:#f8fafc;">${esc(m.name)}</b>
                  <span style="color:#facc15; font-size:8.5px; margin-left:3px;">[${esc(m.rank)}]</span>
                </div>
                <div style="display:flex; gap:3px;">
                  ${isLeader && m.accountId !== myId ? `<button type="button" class="id-mini-btn" onclick="guildSetRank('${m.accountId}', '${m.rank === 'Officer' ? 'Member' : 'Officer'}')">${m.rank === 'Officer' ? 'DEMOTE' : 'PROMOTE'}</button>` : ''}
                  ${canManage && m.accountId !== myId && m.rank !== 'Leader' ? `<button type="button" class="id-mini-btn" style="color:#fca5a5;" onclick="guildKick('${m.accountId}')">KICK</button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div style="border-top:1px solid #1e293b; padding-top:5px;">
            <div style="display:flex; justify-content:space-between; font-size:9.5px; color:#facc15; margin-bottom:4px;">
              <b>🏛️ Guild Bank Vault (${guild.bank?.length || 0}/${MAX_GUILD_BANK_SLOTS})</b>
              ${bagItems.length > 0 ? `
                <button type="button" class="id-mini-btn" onclick="guildDepositFirstBag()">+DEPOSIT SLOT 1</button>
              ` : ''}
            </div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; max-height:60px; overflow-y:auto;">
              ${(guild.bank || []).length === 0
                ? '<span style="font-size:9px; color:#64748b;">Vault empty — click +DEPOSIT SLOT 1 or click an item to withdraw.</span>'
                : guild.bank.map((b, bi) => {
                  const def = EQUIPMENT_CATALOG[b.id] || { name: b.id, icon: '📦' };
                  return `<button type="button" class="id-mini-btn" onclick="guildWithdraw(${bi})" title="Withdraw ${esc(def.name)}">${def.icon || '📦'} ${esc(def.name)}${b.qty > 1 ? ` ×${b.qty}` : ''}</button>`;
                }).join('')}
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

export function renderHiscoresModal({ board, category = 'overall' } = {}) {
  const modal = document.getElementById('hiscores-modal');
  const body = document.getElementById('hiscores-modal-body');
  if (!modal || !body) return;

  const cats = [
    { id: 'overall', label: '🌐 Overall' },
    ...Object.values(PROFESSIONS_CATALOG).map((p) => ({ id: p.id, label: `${p.icon} ${p.name}` })),
    { id: 'quest_points', label: '📜 Quests' },
    { id: 'collection_log', label: '📖 Collection' },
    { id: 'boss_kills', label: '💀 Boss Kills' },
    { id: 'arena_mmr', label: '⚔️ 3v3 Arena' },
  ];
  const rows = Array.isArray(board?.rows) ? board.rows : [];

  body.innerHTML = `
    <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px;">
      ${cats.map((c) => `
        <button type="button" class="st-tab-btn ${category === c.id ? 'active' : ''}" style="font-size:9.5px; padding:4px 8px;" onclick="loadHiscoresCategory('${c.id}')">${esc(c.label)}</button>
      `).join('')}
    </div>
    <div style="display:flex; gap:6px; margin-bottom:8px;">
      <input id="hiscores-search-input" class="pixel-input" placeholder="Lookup champion or guild tag..." style="flex:1; font-size:10.5px; padding:4px 8px;" />
      <button type="button" class="id-mini-btn" style="border-color:#38bdf8; color:#7dd3fc;" onclick="searchHiscoresByInput()">SEARCH</button>
    </div>
    <div style="display:flex; flex-direction:column; gap:4px; max-height:360px; overflow-y:auto;">
      ${rows.length === 0
        ? '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:10.5px;">No ranked champions matched yet. Enter the realm to set your rank!</div>'
        : rows.map((r) => `
          <div style="display:grid; grid-template-columns:46px 1fr 90px 110px; align-items:center; background:#080d1e; border:1px solid ${r.rank <= 3 ? '#facc15' : '#1e293b'}; border-radius:4px; padding:5px 9px; font-size:10.5px;">
            <b style="color:${r.rank === 1 ? '#fde047' : r.rank === 2 ? '#e2e8f0' : r.rank === 3 ? '#fb923c' : '#94a3b8'};">#${r.rank}</b>
            <div>
              <b style="color:#f8fafc;">${esc(r.name)}</b>
              ${r.orderTag ? `<span style="color:#38bdf8; font-size:9px; margin-left:4px;">&lt;${esc(r.orderTag)}&gt;</span>` : ''}
            </div>
            <span style="color:#94a3b8; font-size:9.5px;">${esc(r.faction)} Lv.${r.championLevel}</span>
            <b style="color:#4ade80; text-align:right;">${esc(r.primaryLabel)}</b>
          </div>
        `).join('')}
    </div>
  `;
}

export function renderReportModalHtml({ targetName = '' } = {}) {
  const modal = document.getElementById('report-modal');
  const body = document.getElementById('report-modal-body');
  if (!modal || !body) return;
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; font-size:10.5px; color:#e2e8f0;">
      <div>Reporting Champion: <b id="report-target-label" style="color:#fca5a5;">${esc(targetName || 'Unknown')}</b></div>
      <label style="font-size:9.5px; color:#94a3b8;">Select violation category:</label>
      <select id="report-category-select" class="pixel-input" style="font-size:10.5px; padding:5px 7px;">
        <option value="Harassment or Offensive Language">Harassment or Offensive Language</option>
        <option value="Macroing / Botting / Unfair Automation">Macroing / Botting / Unfair Automation</option>
        <option value="Scamming / Item Fraud">Scamming / Item Fraud</option>
        <option value="Bug Exploitation">Bug Exploitation</option>
      </select>
      <textarea id="report-details-input" class="pixel-input" rows="3" maxlength="200" placeholder="Optional details (last 15 zone chat messages are automatically included for review)..." style="font-size:10.5px; padding:6px;"></textarea>
      <div style="display:flex; justify-content:flex-end; gap:6px;">
        <button type="button" class="id-mini-btn" onclick="toggleModal('report-modal')">CANCEL</button>
        <button type="button" class="util-btn" style="border-color:#ef4444; color:#fca5a5;" onclick="submitPlayerReport('${esc(targetName)}')">🛡️ SUBMIT REPORT</button>
      </div>
    </div>
  `;
}
