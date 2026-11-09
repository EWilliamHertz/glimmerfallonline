// ==========================================
// RoomManager — 3v3 Ranked Arena Matchmaking & Client Packet Router
// ==========================================

import crypto from 'node:crypto';
import {
  TICK_MS,
  YARD_PX,
  ACTION_SLOTS,
  SLOT_UNLOCK_LEVELS,
  isSlotUnlocked,
  ROOM_TYPES,
  ROOM_CONFIGS,
  GRAND_FONT_POSITIONS,
  HARVEST_COOLDOWN_MS,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  ABILITIES_CATALOG,
  EMOTES_CATALOG,
  getSlotAbilitySpec,
  getAbilityRank,
  canUpgradeAbility,
  getRankStats,
  getEffectiveStats,
  createDefaultProgression,
  xpForNextLevel,
  MAX_BASE_LEVEL,
  PARAGON_AFFINITIES,
  paragonXpForLevel,
  canUpgradeParagon,
  resolveFactionAndClass,
  calcMaxHp,
  calcMaxGlimmer,
  calcCritChance,
  calcCdMult,
  calcCastSpeedMult,
  calcCritDamageMult,
  calcDodgeChance,
  calcDamageReduction,
  calcLifeLeechPct,
  calcHpRegenPerSec,
  calcHolyRadianceBurstDmg,
  calcMoveSpeedMult,
  isWaterTile,
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  getProfessionLevelFromXp,
  getTotalProfessionLevel,
  MYTHIC_DUNGEONS,
  MYTHIC_AFFIXES,
  MYTHIC_KEYSTONE_MAX_TIER,
  getMythicRunDuration,
  getMythicEnemyScale,
  getMythicXpScale,
  getMythicAffixesForTier,
  CRAFTING_STATIONS,
  CRAFTING_RECIPES,
  SKILLING_NODE_TYPES,
  ELITE_AFFIXES,
  BOUNTY_CONTRACTS,
} from '../../shared/protocol.js';
import { SIEGE_INTERVAL_MS, ARENA_WAIT_MS, nextThirtyMinBoundary } from './constants.js';

export const arenaAndPacketsMethods = {
  // 3v3 Ranked Nexus Arena Matchmaking
  // ==========================================
  getArenaLobbyInfo() {
    const now = Date.now();
    const players = [];
    for (const q of this.arenaQueue) {
      for (const id of q.memberIds) {
        const m = this.clients.get(id);
        if (!m) continue;
        players.push({
          id: m.id,
          name: m.displayName,
          faction: m.faction,
          level: m.prog?.level || 1,
          isLeader: m.id === q.leaderId,
          partySize: q.memberIds.length,
        });
      }
    }
    const oldest = this.arenaQueue.find((q) => q.mode === 'wait');
    return {
      type: 'arena_lobby',
      players,
      total: players.length,
      capacity: 6,
      waitMs: ARENA_WAIT_MS,
      autoFillInMs: oldest ? Math.max(0, ARENA_WAIT_MS - (now - oldest.queuedAt)) : null,
    };
  },

  broadcastArenaLobby() {
    const info = this.getArenaLobbyInfo();
    for (const c of this.clients.values()) c.send(info);
  },

  queueForArena(client, mode = 'wait') {
    if (!client) return;
    if (client.roomType === ROOM_TYPES.ARENA_3V3) {
      client.send({ type: 'sys_msg', category: 'zone', text: '[3v3 Arena] You are already inside a match!' });
      return;
    }
    const party = this.parties.getPartyForPlayer(client.id);
    if (party && party.leaderId !== client.id) {
      client.send({
        type: 'sys_msg',
        category: 'party',
        text: '[3v3 Queue] Only the Squad Leader can queue the party for Ranked Arena!',
      });
      return;
    }

    const memberIds = party ? [...party.memberIds] : [client.id];
    this.arenaQueue = this.arenaQueue.filter((q) => !q.memberIds.some((id) => memberIds.includes(id)));

    this.arenaQueue.push({
      leaderId: client.id,
      memberIds,
      queuedAt: Date.now(),
      mode: mode === 'bots' ? 'bots' : 'wait',
      forceFill: false,
      lastAnnounceAt: 0,
    });

    const groupLabel = memberIds.length === 1 ? 'Solo' : `${memberIds.length}-Player Squad`;
    for (const id of memberIds) {
      const m = this.clients.get(id);
      if (m) {
        m.send({ type: 'queue_state', queueing: true, partySize: memberIds.length, mode });
        m.send({
          type: 'sys_msg',
          category: 'zone',
          text:
            mode === 'bots'
              ? `[3v3 Arena] Starting a match vs. computer entities (${groupLabel})...`
              : `[3v3 Arena] Lobby open (${groupLabel}) — waiting for other champions. Computer entities fill empty slots after ${Math.round(ARENA_WAIT_MS / 1000)}s!`,
        });
      }
    }

    if (mode !== 'bots') {
      this.announceArenaLobby(client, true);
    }
    this.broadcastArenaLobby();
  },

  announceArenaLobby(client, auto = false) {
    const entry = this.arenaQueue.find((q) => q.memberIds.includes(client.id));
    if (!entry || entry.mode !== 'wait') return;
    const now = Date.now();
    if (now - entry.lastAnnounceAt < 20000) {
      if (!auto) {
        client.send({ type: 'sys_msg', category: 'zone', text: '[3v3 Arena] You can re-announce every 20 seconds.' });
      }
      return;
    }
    entry.lastAnnounceAt = now;
    const info = this.getArenaLobbyInfo();
    const icon = FACTIONS_META[client.faction]?.icon || '⚔️';
    const text = `📢 [3v3 ARENA LFG] ${icon} ${client.displayName} (Lv.${client.prog?.level || 1} ${client.faction}) is queueing — ${info.total}/6 champions ready! Click ⚔️ 3v3 ARENA to join the lobby (computer entities fill empty slots).`;
    for (const c of this.clients.values()) {
      c.send({ type: 'sys_msg', category: 'chat', text });
      if (c.id !== client.id && !entry.memberIds.includes(c.id) && c.roomType !== ROOM_TYPES.ARENA_3V3) {
        c.send({
          type: 'arena_invite',
          fromName: client.displayName,
          fromFaction: client.faction,
          total: info.total,
          capacity: 6,
        });
      }
    }
  },

  forceArenaFill(client) {
    const entry = this.arenaQueue.find((q) => q.memberIds.includes(client.id));
    if (!entry) return;
    entry.forceFill = true;
    this.broadcastToArenaQueue('[3v3 Arena] Filling empty slots with computer entities — match starting!');
  },

  broadcastToArenaQueue(text) {
    for (const q of this.arenaQueue) {
      for (const id of q.memberIds) {
        this.clients.get(id)?.send({ type: 'sys_msg', category: 'zone', text });
      }
    }
  },

  leaveArenaQueue(client) {
    if (!client) return;
    const idx = this.arenaQueue.findIndex((q) => q.memberIds.includes(client.id));
    if (idx === -1) return;
    const removed = this.arenaQueue.splice(idx, 1)[0];
    for (const id of removed.memberIds) {
      const m = this.clients.get(id);
      if (m) m.send({ type: 'queue_state', queueing: false });
    }
    this.broadcastArenaLobby();
  },

  processMatchmaking() {
    if (this.arenaQueue.length === 0) return;
    const now = Date.now();

    // 1. "Play with computer entities" — instant AI match for this group only
    const botIdx = this.arenaQueue.findIndex((q) => q.mode === 'bots');
    if (botIdx !== -1) {
      const [entry] = this.arenaQueue.splice(botIdx, 1);
      const members = entry.memberIds.map((id) => this.clients.get(id)).filter(Boolean).slice(0, 3);
      if (members.length > 0) this.startArenaMatch(members, []);
      this.broadcastArenaLobby();
      return;
    }

    // 2. Open lobby — start on 6 champions, forced fill, or after the wait window
    this.arenaQueue = this.arenaQueue.filter((q) => q.memberIds.some((id) => this.clients.has(id)));
    if (this.arenaQueue.length === 0) return;
    const totalPlayers = this.arenaQueue.reduce(
      (n, q) => n + q.memberIds.filter((id) => this.clients.has(id)).length,
      0
    );
    const forced = this.arenaQueue.some((q) => q.forceFill);
    const timedOut = now - this.arenaQueue[0].queuedAt >= ARENA_WAIT_MS;
    if (totalPlayers < 6 && !forced && !timedOut) return;

    // Balanced team assignment (largest squads first, always into the emptier team)
    const blue = [];
    const red = [];
    const groups = [...this.arenaQueue].sort((a, b) => b.memberIds.length - a.memberIds.length);
    const placed = [];
    for (const g of groups) {
      const members = g.memberIds.map((id) => this.clients.get(id)).filter(Boolean);
      if (members.length === 0) continue;
      const target = blue.length <= red.length ? blue : red;
      const other = target === blue ? red : blue;
      if (target.length + members.length <= 3) {
        target.push(...members);
        placed.push(g);
      } else if (other.length + members.length <= 3) {
        other.push(...members);
        placed.push(g);
      }
    }
    if (placed.length === 0) return;
    this.arenaQueue = this.arenaQueue.filter((q) => !placed.includes(q));
    this.startArenaMatch(blue, red);
    this.broadcastArenaLobby();
  },

  startArenaMatch(bluePlayers, redPlayers) {
    const matchId = `arena_3v3_${crypto.randomUUID().slice(0, 6)}`;
    const room = this.createRoomInstance(ROOM_TYPES.ARENA_3V3, matchId);

    const aiBlueTemplates = [
      { id: 'ally_1', name: 'Nexus Weaver', spriteKey: 'allyMage', x: -48, y: 165, speed: 50, range: 110, dmg: 3 },
      { id: 'ally_2', name: 'Forest Warden', spriteKey: 'allyPaladin', x: 48, y: 165, speed: 54, range: 28, dmg: 3 },
      { id: 'ally_3', name: 'Aurora Vanguard', spriteKey: 'allyPaladin', x: 0, y: 155, speed: 54, range: 28, dmg: 3 },
    ];
    for (let i = 0; i < Math.max(0, 3 - bluePlayers.length); i++) {
      room.allies.push({ ...aiBlueTemplates[i], team: 'blue', cd: 0.5 + i * 0.3 });
    }

    const aiRedTemplates = [
      {
        id: 'enemy_1', name: 'Void Stalker [Umbri]', sub: 'Enemy Vanguard', type: 'mob', team: 'red',
        spriteKey: 'voidStalker', x: -64, y: -85, origX: -64, origY: -85, hp: 25, maxHp: 25,
        damage: 4, xpReward: 65, speed: 54, aggroRange: 250, attackRange: 28, radius: 15, hitFlash: 0, dammers: new Set(),
      },
      {
        id: 'enemy_2', name: 'Gloam Reaper [Umbri]', sub: 'Enemy Harvester', type: 'mob', team: 'red',
        spriteKey: 'duskFiend', x: 0, y: -105, origX: 0, origY: -105, hp: 22, maxHp: 22,
        damage: 4, xpReward: 65, speed: 60, aggroRange: 250, attackRange: 26, radius: 14, hitFlash: 0, dammers: new Set(),
      },
      {
        id: 'enemy_3', name: 'Brambleheart Behemoth', sub: 'Enemy Terra Titan', type: 'mob', team: 'red', isBoss: true,
        spriteKey: 'graniteBoss', x: 64, y: -85, origX: 64, origY: -85, hp: 34, maxHp: 34,
        damage: 5, xpReward: 110, speed: 42, aggroRange: 250, attackRange: 32, radius: 20, hitFlash: 0, dammers: new Set(),
      },
    ];
    const redBots = Math.max(0, 3 - redPlayers.length);
    for (let i = 0; i < redBots; i++) {
      room.entities.push(aiRedTemplates[i]);
    }

    const blueBots = Math.max(0, 3 - bluePlayers.length);
    const summary =
      `[3v3 Arena] Match found! Blue: ${bluePlayers.length} champion(s)${blueBots ? ` + ${blueBots} computer ally` : ''}` +
      ` vs Red: ${redPlayers.length} champion(s)${redBots ? ` + ${redBots} computer foe` : ''}.`;

    for (const p of bluePlayers) {
      if (!p.preArenaSpot && p.roomType !== ROOM_TYPES.ARENA_3V3) {
        p.preArenaSpot = { roomId: p.roomId, roomType: p.roomType, x: p.x, y: p.y };
      }
      p.hp = p.maxHp;
      p.send({ type: 'queue_state', queueing: false });
      this.joinRoom(p, room.id, 'blue');
      p.send({ type: 'sys_msg', category: 'zone', text: summary });
    }
    for (const p of redPlayers) {
      if (!p.preArenaSpot && p.roomType !== ROOM_TYPES.ARENA_3V3) {
        p.preArenaSpot = { roomId: p.roomId, roomType: p.roomType, x: p.x, y: p.y };
      }
      p.hp = p.maxHp;
      p.send({ type: 'queue_state', queueing: false });
      this.joinRoom(p, room.id, 'red');
      p.send({ type: 'sys_msg', category: 'zone', text: summary });
    }
  },

  // ==========================================
  // Hostility & Ally Rules
  // ==========================================
  arePlayersAllied(room, pA, pB) {
    if (!pA || !pB) return true;
    if (pA.id === pB.id) return true;
    if (this.duels && this.duels.isDuelActiveBetween(pA.id, pB.id)) return false;
    if (!room.pvp) return true;
    if (room.type === ROOM_TYPES.ARENA_3V3) return pA.team === pB.team;
    if (this.parties.areInSameParty(pA.id, pB.id)) return true;
    return pA.faction === pB.faction;
  },

  canDamageEntity(room, player, ent) {
    if (!ent || ent.isDying || ent.type === 'node' || ent.type === 'portal') return false;
    if (room.type === ROOM_TYPES.ARENA_3V3) {
      const pTeam = player.team || 'blue';
      if (ent.team && ent.team === pTeam) return false;
      if (ent.id === 'blue_nexus' && pTeam === 'blue') return false;
      if (ent.id === 'red_nexus' && pTeam === 'red') return false;
    } else if (ent.type === 'ally_nexus') {
      return false;
    } else if (ent.type === 'outpost_nexus' && ent.faction === player.faction) {
      // Cannot damage your own Faction's Outpost Nexus!
      return false;
    }
    return true;
  },

  getBonusPower(room, player) {
    let bonus = 0;
    for (const gz of room.groundZones) {
      if (gz.type === 'consecration') {
        const caster = room.players.get(gz.ownerId);
        if ((!caster || this.arePlayersAllied(room, player, caster)) && Math.hypot(player.x - gz.x, player.y - gz.y) <= gz.radius) {
          bonus += 2;
          break;
        }
      }
    }
    return bonus;
  },

  // ==========================================
  // Incoming Client Packets
  // ==========================================
  handlePacket(client, msg) {
    if (!msg || typeof msg !== 'object') return;
    const room = this.rooms.get(client.roomId);

    switch (msg.type) {
      case 'ping':
        client.send({ type: 'pong', ts: msg.ts, serverTs: Date.now() });
        break;

      case 'move': {
        if (!room || client.isDead || client.freezeTimer > 0) return;
        if (msg.epoch && Number(msg.epoch) < client.roomEpoch - 1) return;
        const nx = Number(msg.x);
        const ny = Number(msg.y);
        if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;

        const GATE_HALF_WIDTH = 72;
        const canPassEastWest = (room.edgeTransitions?.east || room.edgeTransitions?.west) && Math.abs(ny) <= GATE_HALF_WIDTH;
        const canPassNorthSouth = (room.edgeTransitions?.north || room.edgeTransitions?.south) && Math.abs(nx) <= GATE_HALF_WIDTH;
        const padX = canPassEastWest ? 4 : 14;
        const padY = canPassNorthSouth ? 4 : 14;
        let targetX = Math.max(-room.halfW + padX, Math.min(room.halfW - padX, nx));
        let targetY = Math.max(-room.halfH + padY, Math.min(room.halfH - padY, ny));

        const dist = Math.hypot(targetX - client.x, targetY - client.y);
        const MAX_STEP = 240;
        if (dist > MAX_STEP) {
          // Graceful vector clamping on lag spikes / packet bunching
          const ratio = MAX_STEP / dist;
          targetX = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, client.x + (targetX - client.x) * ratio));
          targetY = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, client.y + (targetY - client.y) * ratio));
        }

        // Authoritative Water Collision Check: Cannot walk across deep water without bridges
        const currentlyInWater = isWaterTile(client.x, client.y, room.type);
        if (!currentlyInWater && isWaterTile(targetX, targetY, room.type)) {
          // Slide along unobstructed axis
          if (!isWaterTile(targetX, client.y, room.type)) {
            client.x = targetX;
          } else if (!isWaterTile(client.x, targetY, room.type)) {
            client.y = targetY;
          }
        } else {
          client.x = targetX;
          client.y = targetY;
        }

        client.z = Math.max(0, Math.min(80, Number(msg.z) || 0));
        if (['up', 'down', 'left', 'right'].includes(msg.dir)) {
          client.dir = msg.dir;
        }
        client.isMoving = Boolean(msg.isMoving);
        break;
      }

      case 'switch_room': {
        if (client.isDead) return;
        const target = msg.roomId || msg.roomType || ROOM_TYPES.NEXUS_WARZONE;
        if (client.portalCooldown > 0.4 && (client.roomType === target || client.roomId === target || client.roomId?.startsWith(target))) {
          break;
        }
        this.joinRoom(client, target, null, msg.x ?? null, msg.y ?? null, msg.dir ?? null);
        break;
      }

      case 'queue_arena':
        if (client.isDead) return;
        if (msg.join) {
          if (msg.returnRoom && Number.isFinite(Number(msg.returnX)) && Number.isFinite(Number(msg.returnY))) {
            client.preArenaSpot = {
              roomId: msg.returnRoom,
              roomType: msg.returnRoom,
              x: Number(msg.returnX),
              y: Number(msg.returnY),
            };
          } else if (client.roomType !== ROOM_TYPES.ARENA_3V3) {
            client.preArenaSpot = {
              roomId: client.roomId,
              roomType: client.roomType,
              x: client.x,
              y: client.y,
            };
          }
          this.queueForArena(client, msg.mode === 'bots' ? 'bots' : 'wait');
        } else {
          this.leaveArenaQueue(client);
        }
        break;

      case 'arena_fill':
        this.forceArenaFill(client);
        break;

      case 'arena_announce':
        this.announceArenaLobby(client, false);
        break;

      case 'arena_lobby_info':
        client.send(this.getArenaLobbyInfo());
        break;

      case 'cast_ability':
        if (room) this.handleCastAbility(room, client, Number(msg.slot), msg.targetId, msg.dir);
        break;

      case 'cancel_cast':
        client.castState = null;
        break;

      case 'harvest_node':
        if (room) this.handleHarvestNode(room, client, msg.nodeId);
        break;

      case 'craft_recipe':
        this.handleCraftRecipe(room, client, String(msg.recipeId || '').trim());
        break;

      case 'claim_bounty':
        this.handleClaimBounty(room, client, String(msg.bountyId || '').trim());
        break;

      case 'equip_item': {
        let item = null;
        const preferredSocket = msg.preferredSocket ? String(msg.preferredSocket).trim() : null;
        if (msg.slotIndex !== undefined) {
          const res = this.accounts.equipFromInventory(client.id, Number(msg.slotIndex), preferredSocket);
          if (res.success) {
            item = res.item;
            this.refreshClientFromAccount(client.id);
          }
        } else if (msg.itemId) {
          item = EQUIPMENT_CATALOG[msg.itemId];
          if (item) {
            const inv = client.inventory || [];
            const idx = inv.findIndex((it) => (typeof it === 'string' ? it : it?.id) === item.id);
            if (idx !== -1) {
              this.accounts.equipFromInventory(client.id, idx, preferredSocket);
            } else {
              const targetSlot = item.slot === 'armor' ? 'body' : item.slot === 'offhand' ? 'shield' : item.slot;
              const nextEquip = { ...(client.equipment || {}), [targetSlot]: item.id };
              this.accounts.updateProfile(client.id, { equipment: nextEquip });
            }
            this.refreshClientFromAccount(client.id);
          }
        }
        if (item && room) {
          room.fxQueue.push({
            kind: 'fct',
            x: client.x,
            y: client.y - 10,
            text: `EQUIPPED ${item.name.toUpperCase()}`,
            color: '#fde047',
          });
        }
        break;
      }

      case 'unequip_item': {
        const slotKey = String(msg.slotKey || '').trim().toLowerCase();
        if (slotKey) {
          const res = this.accounts.unequipToInventory(client.id, slotKey);
          if (res.success) {
            this.refreshClientFromAccount(client.id);
            if (room) {
              room.fxQueue.push({
                kind: 'fct',
                x: client.x,
                y: client.y - 10,
                text: `UNEQUIPPED ${res.item?.name?.toUpperCase() || slotKey.toUpperCase()}`,
                color: '#94a3b8',
              });
            }
          } else if (res.reason && room) {
            room.fxQueue.push({
              kind: 'fct',
              x: client.x,
              y: client.y - 10,
              text: `🎒 ${res.reason.toUpperCase()}`,
              color: '#ef4444',
            });
          }
        }
        break;
      }

      case 'use_keystone':
        if (room) this.handleUseKeystone(room, client, String(msg.itemId || '').trim());
        break;

      case 'drop_inventory_item': {
        const slotIdx = Number(msg.slotIndex);
        const inv = client.inventory || [];
        if (slotIdx >= 0 && slotIdx < inv.length) {
          const it = inv[slotIdx];
          const itId = typeof it === 'string' ? it : it?.id;
          this.accounts.removeItemFromInventory(client.id, slotIdx);
          this.refreshClientFromAccount(client.id);
          if (room && itId) {
            room.lootSeq = (room.lootSeq || 0) + 1;
            room.loot.push({
              id: `loot_${room.lootSeq}`,
              kind: 'item',
              itemId: itId,
              x: Math.round(client.x * 10) / 10,
              y: Math.round(client.y * 10) / 10,
              ttl: 60,
              maxTtl: 60,
            });
            room.fxQueue.push({
              kind: 'fct',
              x: client.x,
              y: client.y - 10,
              text: `DROPPED ${EQUIPMENT_CATALOG[itId]?.name?.toUpperCase() || 'ITEM'}`,
              color: '#94a3b8',
            });
          }
        }
        break;
      }

      case 'buy_merchant_item': {
        const itemId = String(msg.itemId || '').trim();
        const qty = Math.max(1, Math.min(50, Number(msg.qty) || 1));
        const price = Number(msg.unitPrice) || 0;
        if (itemId && price > 0) {
          const res = this.accounts.buyMerchantItem(client.id, itemId, price, qty);
          if (res.success) {
            this.refreshClientFromAccount(client.id);
            if (room) {
              room.fxQueue.push({
                kind: 'fct',
                x: client.x,
                y: client.y - 12,
                text: `+${qty}x ${res.item?.name?.toUpperCase() || itemId} (-${price * qty}g)`,
                color: '#4ade80',
              });
            }
          } else if (res.reason && room) {
            room.fxQueue.push({
              kind: 'fct',
              x: client.x,
              y: client.y - 12,
              text: `❌ ${res.reason.toUpperCase()}`,
              color: '#ef4444',
            });
          }
        }
        break;
      }

      case 'sync_bank': {
        this.accounts.syncBankAndInventory(client.id, msg.bank, msg.inventory, msg.equipment);
        this.refreshClientFromAccount(client.id);
        break;
      }

      case 'sync_quest_state': {
        if (msg.questState && typeof msg.questState === 'object') {
          this.accounts.saveQuestState(client.id, msg.questState);
          client.questState = msg.questState;
          // Do NOT echo refreshClientFromAccount(client.id) here — echoing profile_updated
          // on every quest state save triggers an infinite client<->server profile loop!
        }
        break;
      }

      case 'sync_profession_progress': {
        if (msg.professions && typeof msg.professions === 'object') {
          const updated = this.accounts.saveProfessionProgress(client.id, msg.professions);
          if (updated) {
            client.prog = updated;
            for (const professionId of Object.keys(PROFESSION_MASTERY_CAPES)) {
              this.grantProfessionMasteryCape(client, professionId);
            }
            client.send({ type: 'progression_sync', progression: updated });
          }
        }
        break;
      }

      case 'sync_vitals': {
        if (typeof msg.hp === 'number' && msg.hp > 0) {
          client.hp = Math.min(client.maxHp, Math.max(1, msg.hp));
        }
        if (typeof msg.solarCharge === 'number' && msg.solarCharge >= 0) {
          client.solarCharge = Math.min(client.maxSolarCharge, Math.max(0, msg.solarCharge));
        }
        if (msg.lastPosition && typeof msg.lastPosition === 'object') {
          client.lastPosition = msg.lastPosition;
        }
        this.saveClientState(client);
        break;
      }

      case 'update_loadout': {
        if (msg.loadout && typeof msg.loadout === 'object') {
          this.accounts.updateProfile(client.id, { loadout: msg.loadout });
          this.refreshClientFromAccount(client.id);
        }
        break;
      }

      case 'allocate_stat':
        this.handleAllocateStat(client, msg.statKey);
        break;

      case 'upgrade_paragon':
        this.handleUpgradeParagon(client, msg.affinityId);
        break;

      case 'upgrade_skill':
        this.handleUpgradeSkill(client, msg.abilityId);
        break;

      case 'upgrade_rank':
        this.handleUpgradeRank(client, Number(msg.slot));
        break;

      case 'reset_progression':
        this.handleResetProgression(client);
        break;

      case 'award_quest_xp':
        if (!client.stasisXpClaimed) {
          client.stasisXpClaimed = true;
          this.awardPlayerXP(client, 20, 'Stasis Broken');
        }
        break;

      case 'chat':
        this.handleChat(room, client, msg.channel, msg.text);
        break;

      case 'emote':
        if (room) this.handleEmote(room, client, msg.emoteId);
        break;

      case 'party_invite':
        this.parties.invitePlayer(client, msg.target);
        break;

      case 'party_respond':
        this.parties.respondInvite(client, msg.inviteId, Boolean(msg.accept));
        break;

      case 'party_leave':
        this.parties.leaveParty(client);
        break;

      case 'party_kick':
        this.parties.kickMember(client, msg.targetId);
        break;

      // AetherSwap Continental Exchange
      case 'exchange_open':
        this.exchange?.handleOpen(client);
        break;

      case 'exchange_place_order':
        this.exchange?.handlePlaceOrder(client, msg);
        break;

      case 'exchange_collect':
        this.exchange?.handleCollect(client, msg.slot);
        break;

      case 'exchange_abort':
        this.exchange?.handleAbort(client, msg.slot);
        break;

      // Direct Player Trading
      case 'trade_request':
        this.trades?.handleRequest(client, msg.target);
        break;

      case 'trade_respond':
        this.trades?.handleRespond(client, msg.inviteId, Boolean(msg.accept));
        break;

      case 'trade_offer':
        this.trades?.handleOfferUpdate(client, msg.items, msg.gold);
        break;

      case 'trade_accept':
        this.trades?.handleAccept(client);
        break;

      case 'trade_cancel':
        this.trades?.handleCancel(client);
        break;

      // Friendly Player Dueling
      case 'duel_request':
        this.duels?.handleRequest(client, msg.target);
        break;

      case 'duel_respond':
        this.duels?.handleRespond(client, msg.inviteId, Boolean(msg.accept));
        break;

      case 'duel_forfeit':
        this.duels?.handleForfeit(client);
        break;

      // Player Profile & Gear Inspect
      case 'inspect_player':
        this.handleInspectPlayer(client, msg.target);
        break;

      case 'list_rooms':
        client.send({ type: 'rooms_list', rooms: this.listPublicRooms() });
        break;

      case 'auth_rpc':
        this.handleWsAuthRpc(client, msg).catch((err) => {
          client.send({
            type: 'auth_rpc_res',
            reqId: msg.reqId,
            ok: false,
            error: err.message || 'Authentication request failed',
          });
        });
        break;
    }
  },

  async handleWsAuthRpc(client, msg) {
    const reqId = msg.reqId;
    const action = msg.action;
    const payload = msg.payload || {};

    if (action === 'register') {
      await this.accounts.ensureFreshFromPostgres({ id: client.id, username: payload.username });
      const { account, token } = this.accounts.registerAccount({
        ...payload,
        upgradeAccountId: client.id,
      });
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(account.id);
      client.send({
        type: 'auth_rpc_res',
        reqId,
        ok: true,
        token,
        profile: this.accounts.toPublicProfile(account),
      });
      return;
    }

    if (action === 'login') {
      await this.accounts.ensureFreshFromPostgres({ username: payload.username });
      const { account, token } = this.accounts.loginAccount(payload);
      await this.accounts.flushToPostgres();
      client.send({
        type: 'auth_rpc_res',
        reqId,
        ok: true,
        token,
        profile: this.accounts.toPublicProfile(account),
      });
      return;
    }

    if (action === 'save_character') {
      if (client.isDead) {
        client.send({
          type: 'auth_rpc_res',
          reqId,
          ok: false,
          error: 'Cannot switch characters while fallen! Please await resurrection at Sanctuary.',
        });
        return;
      }
      this.saveClientState(client);
      await this.accounts.ensureFreshFromPostgres({ id: client.id });
      const charObj = this.accounts.createOrSelectCharacter(client.id, payload);
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(client.id);
      if (charObj.lastPosition?.roomType && ROOM_CONFIGS[charObj.lastPosition.roomType]) {
        this.joinRoom(client, charObj.lastPosition.roomType, null, charObj.lastPosition.x, charObj.lastPosition.y);
      } else if (payload.enterRealm) {
        this.joinRoom(client, payload.enterRealm);
      }
      const acc = this.accounts.accountsById.get(client.id);
      client.send({
        type: 'auth_rpc_res',
        reqId,
        ok: true,
        character: charObj,
        profile: this.accounts.toPublicProfile(acc),
      });
      return;
    }

    if (action === 'delete_character') {
      this.accounts.deleteCharacter(client.id, payload.characterId);
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(client.id);
      const acc = this.accounts.accountsById.get(client.id);
      client.send({
        type: 'auth_rpc_res',
        reqId,
        ok: true,
        profile: this.accounts.toPublicProfile(acc),
      });
      return;
    }

    if (action === 'update_profile') {
      const updated = this.accounts.updateProfile(client.id, payload);
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(updated.id);
      client.send({
        type: 'auth_rpc_res',
        reqId,
        ok: true,
        profile: this.accounts.toPublicProfile(updated),
      });
      return;
    }

    if (action === 'link_tcg') {
      const updated = this.accounts.linkGlimmerFallTcgAccount(client.id, payload);
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(updated.id);
      client.send({
        type: 'auth_rpc_res',
        reqId,
        ok: true,
        token: this.accounts.signToken(updated.id),
        profile: this.accounts.toPublicProfile(updated),
      });
      return;
    }

    throw new Error(`Unknown auth action: ${action}`);
  },

  handleInspectPlayer(client, targetQuery) {
    if (!client) return;
    const q = String(targetQuery || '').trim();
    if (!q) {
      client.send({ type: 'sys_msg', category: 'social', text: '🔍 [Inspect] Specify a player name to inspect.' });
      return;
    }

    const target = this.getClientById(q) || this.findClientByName(q);
    if (!target) {
      client.send({ type: 'sys_msg', category: 'social', text: `🔍 [Inspect] Player "${q}" is not online.` });
      return;
    }

    const profile = this.accounts.getProfile(target.id);
    const equip = target.equipment || profile?.equipment || {};
    const prog = target.prog || profile?.progression || {};

    client.send({
      type: 'inspect_data',
      target: {
        id: target.id,
        name: target.displayName,
        faction: target.faction,
        classId: target.classId,
        className: target.className || target.classId,
        orderTag: target.orderTag,
        orderName: target.orderName,
        orderColor: target.orderColor,
        level: prog.level || 1,
        xp: prog.xp || 0,
        equipment: equip,
        paragon: prog.paragon || {},
        professions: prog.professions || {},
        statsMeta: target.statsMeta || profile?.statsMeta || {},
        stats: {
          power: target.effPower || 10,
          bastion: target.effBastion || 10,
          resonance: target.effResonance || 10,
          tempo: target.effTempo || 10,
          maxHp: target.maxHp || 100,
          maxGlimmer: target.maxSolarCharge || 100,
          critChance: target.critChance || 0.05,
        },
      },
    });
  },
};
