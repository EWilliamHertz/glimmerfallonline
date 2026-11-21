// ==========================================
// GlimmerFall Online 2D — OSRS-Style Right-Click Context Menu & Ground Markers
// Aggregates stacked world objects under cursor into layered RuneScape actions.
// ==========================================

function escHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getNodeActionVerb(ent) {
  const sk = String(ent?.skillingType || '').toLowerCase();
  if (sk.startsWith('tree_')) return 'Chop';
  if (sk.startsWith('fish_')) return 'Fish';
  if (sk.includes('vein') || sk.includes('ore')) return 'Mine';
  if (sk.includes('herb') || sk.includes('flax') || sk.includes('silk')) return 'Harvest';
  if (ent?.type === 'shrine') return 'Commune';
  return 'Channel';
}

export function buildContextMenuEntries({
  wx,
  wy,
  npcs = [],
  props = [],
  entities = [],
  remotePlayers = [],
  lootDrops = [],
  equipmentCatalog = {},
  isHostileEntity = () => false,
  isRemoteHostile = () => false,
  isClickOnNpc = (npc, x, y) => Math.hypot((npc.x || 0) - x, (npc.y || 0) - 16 - y) <= 28,
  isInteractiveWorldProp = () => false,
}) {
  const entries = [];

  // 1. Ground Loot Drops
  for (const drop of lootDrops) {
    if (Math.hypot((drop.x || 0) - wx, (drop.y || 0) - wy) <= 24) {
      const def = drop.itemId ? equipmentCatalog[drop.itemId] : null;
      const itemName = def?.name || (drop.kind === 'gold' ? 'Solar Gold' : 'Loot Shard');
      entries.push({
        verb: 'Take',
        subject: `${itemName}${drop.qty > 1 ? ` (×${drop.qty})` : ''}`,
        color: '#fde047',
        action: 'take_loot',
        payload: drop,
      });
      entries.push({
        verb: 'Examine',
        subject: itemName,
        color: '#94a3b8',
        action: 'examine',
        payload: { name: itemName, desc: def?.desc || 'A dropped glimmering treasure waiting to be claimed.' },
      });
    }
  }

  // 2. Remote Players
  const playerIter = typeof remotePlayers?.values === 'function' ? remotePlayers.values() : remotePlayers;
  for (const rp of playerIter) {
    if (!rp || rp.isDead || rp.stealthed) continue;
    if (Math.hypot((rp.renderX ?? rp.x ?? 0) - wx, (rp.renderY ?? rp.y ?? 0) - 10 - wy) <= 24) {
      const label = `${rp.name} (Lv.${rp.level || 1})`;
      if (isRemoteHostile(rp)) {
        entries.push({
          verb: 'Attack',
          subject: label,
          color: '#ef4444',
          action: 'attack_player',
          payload: rp,
        });
      }
      entries.push({ verb: 'Follow', subject: rp.name, color: '#e2e8f0', action: 'follow_player', payload: rp });
      entries.push({ verb: 'Trade with', subject: rp.name, color: '#4ade80', action: 'trade_player', payload: rp });
      entries.push({ verb: 'Inspect', subject: rp.name, color: '#38bdf8', action: 'inspect_player', payload: rp });
      entries.push({ verb: 'Whisper', subject: rp.name, color: '#67e8f9', action: 'whisper_player', payload: rp });
      entries.push({ verb: 'Add Friend', subject: rp.name, color: '#fde047', action: 'add_friend', payload: rp });
      entries.push({ verb: 'Challenge Duel', subject: rp.name, color: '#fb923c', action: 'duel_player', payload: rp });
      entries.push({ verb: 'Invite Squad', subject: rp.name, color: '#a78bfa', action: 'invite_player', payload: rp });
      entries.push({ verb: 'Report Abuse', subject: rp.name, color: '#f87171', action: 'report_player', payload: rp });
    }
  }

  // 3. World Entities (Monsters, Skilling Nodes, Shrines, Portals)
  for (const ent of entities) {
    if (!ent || ent.isDying || ent.type === 'ally_nexus') continue;
    const isTree = ent.type === 'node' && ent.skillingType && ent.skillingType.startsWith('tree_');
    const yOff = isTree ? 16 : 10;
    const rad = isTree ? 36 : 28;
    if (Math.hypot((ent.x || 0) - wx, (ent.y || 0) - yOff - wy) <= rad) {
      if (ent.type === 'portal') {
        entries.push({
          verb: 'Enter',
          subject: ent.name || 'Waygate',
          color: '#38bdf8',
          action: 'enter_portal',
          payload: ent,
        });
      } else if (ent.type === 'node' || ent.type === 'shrine') {
        entries.push({
          verb: getNodeActionVerb(ent),
          subject: ent.name || 'Leyline Node',
          color: '#38bdf8',
          action: 'harvest_node',
          payload: ent,
        });
      } else {
        const hostile = isHostileEntity(ent);
        entries.push({
          verb: hostile ? 'Attack' : 'Strike',
          subject: ent.name || 'Creature',
          color: hostile ? '#ef4444' : '#fde047',
          action: 'attack_entity',
          payload: ent,
        });
        if (ent.type === 'mob') {
          entries.push({
            verb: 'Drop Table',
            subject: ent.name || 'Creature',
            color: '#c084fc',
            action: 'drop_table',
            payload: ent,
          });
        }
      }
      entries.push({
        verb: 'Examine',
        subject: ent.name || 'Entity',
        color: '#94a3b8',
        action: 'examine',
        payload: {
          name: ent.name,
          desc: ent.sub || (ent.hp ? `${ent.hp}/${ent.maxHp} HP` : 'A curious feature of the GlimmerFall realm.'),
        },
      });
    }
  }

  // 4. NPCs
  for (const npc of npcs) {
    if (!npc || !isClickOnNpc(npc, wx, wy)) continue;
    entries.push({
      verb: 'Talk-to',
      subject: npc.name || 'Townsperson',
      color: '#fde047',
      action: 'talk_npc',
      payload: npc,
    });
    if (npc.isBank) {
      entries.push({ verb: 'Bank', subject: npc.name, color: '#4ade80', action: 'bank_npc', payload: npc });
    }
    if (npc.isExchange) {
      entries.push({ verb: 'Exchange', subject: 'AetherSwap Market', color: '#38bdf8', action: 'exchange_npc', payload: npc });
    }
    if (npc.isMerchant || npc.merchantType) {
      entries.push({ verb: 'Trade', subject: npc.name, color: '#fb923c', action: 'shop_npc', payload: npc });
    }
    entries.push({
      verb: 'Examine',
      subject: npc.name,
      color: '#94a3b8',
      action: 'examine',
      payload: { name: npc.name, desc: npc.role || 'A denizen of the Sanctuary realms.' },
    });
  }

  // 5. Interactive World Props & Stations
  for (const pr of props) {
    if (!pr) continue;
    const isSpecial = Boolean(
      pr.stationId || pr.isBountyBoard || pr.noticeBoardId || pr.puzzleId ||
      pr.specialStation || pr.isPostbox || pr.doorway || pr.exitDoor || isInteractiveWorldProp(pr)
    );
    if (!isSpecial) continue;
    const dx = Math.abs((pr.x || 0) - wx);
    const dy = wy - (pr.y || 0);
    if (dx <= 34 && dy >= -46 && dy <= 22) {
      const label = pr.label ? pr.label.replace(/\s*\[[^\]]+\]/g, '') : (pr.type || 'Object');
      entries.push({
        verb: pr.doorway || pr.exitDoor ? 'Enter' : 'Use',
        subject: label,
        color: '#fbbf24',
        action: 'use_prop',
        payload: pr,
      });
      entries.push({
        verb: 'Examine',
        subject: label,
        color: '#94a3b8',
        action: 'examine',
        payload: { name: label, desc: pr.desc || 'An interactive artisan or realm fixture.' },
      });
    }
  }

  // 6. Always append Walk here & Cancel
  entries.push({
    verb: 'Walk here',
    subject: '',
    color: '#f8fafc',
    action: 'walk_here',
    payload: { wx, wy },
  });
  entries.push({
    verb: 'Cancel',
    subject: '',
    color: '#94a3b8',
    action: 'cancel',
    payload: null,
  });

  return entries;
}

export function closeOsrsContextMenu() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('gf-osrs-context-menu');
  if (el) el.style.display = 'none';
}

export function openOsrsContextMenu({ clientX, clientY, entries, onSelect }) {
  if (typeof document === 'undefined' || !Array.isArray(entries) || entries.length === 0) return;
  let menu = document.getElementById('gf-osrs-context-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'gf-osrs-context-menu';
    menu.className = 'osrs-context-menu';
    document.body.appendChild(menu);
  }

  menu.innerHTML = `
    <div class="osrs-ctx-header">Choose Option</div>
    ${entries.map((e, i) => `
      <button type="button" class="osrs-ctx-item" data-ctx-idx="${i}">
        <span class="osrs-ctx-verb">${escHtml(e.verb)}</span>
        ${e.subject ? `<span class="osrs-ctx-subj" style="color:${e.color || '#fde047'};">${escHtml(e.subject)}</span>` : ''}
      </button>
    `).join('')}
  `;

  menu.style.display = 'block';
  menu.style.left = `${Math.max(6, clientX)}px`;
  menu.style.top = `${Math.max(6, clientY)}px`;

  // Clamp inside viewport cleanly
  const rect = menu.getBoundingClientRect();
  const maxL = Math.max(6, window.innerWidth - rect.width - 8);
  const maxT = Math.max(6, window.innerHeight - rect.height - 8);
  menu.style.left = `${Math.min(maxL, Math.max(6, clientX))}px`;
  menu.style.top = `${Math.min(maxT, Math.max(6, clientY))}px`;

  menu.querySelectorAll('.osrs-ctx-item').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const idx = Number(btn.getAttribute('data-ctx-idx'));
      const chosen = entries[idx];
      closeOsrsContextMenu();
      if (chosen && chosen.action !== 'cancel') {
        onSelect?.(chosen);
      }
    });
  });
}
