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
  FOUNDER_ONLY_ROOMS,
  isRoomUnlockedForEdition,
  isSurfaceRoomType,
  getRegionAtWorldPos,
  clampSurfacePosition,
  migrateLegacyPosition,
  isSurfaceWaterTile,
  isSurfaceFootprintInWater,
  MOUNTS_CATALOG,
  MOUNT_CAST_DURATION_SEC,
  WAYPOINT_SHRINES_BY_ID,
  normalizeExplorationState,
  getDefaultMountIdForFaction,
  canRideMountInRoom,
  revealFogOfWarAt,
  findNearestWaypointShrine,
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
  isFounderEdition,
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
  isFootprintInWater,
  findNearestDryTile,
  isSameFactionProtectedMob,
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
  getSalvageYield,
  applyTemperingUpgrade,
  ACHIEVEMENTS_CATALOG,
  getMerchantWarePrice,
  getProfessionLevelCap,
  toggleDevotionInList,
  assignSlayerTask,
  skipSlayerTask,
  purchaseSlayerUnlock,
  normalizeClueState,
  startClueScroll,
  evaluateClueStep,
  rollClueCasketRewards,
} from '../../shared/protocol.js';
import { SIEGE_INTERVAL_MS, ARENA_WAIT_MS, nextThirtyMinBoundary } from './constants.js';

export const arenaAndPacketsMethods = {
  checkActionRateLimit(client, actionKey, minIntervalMs = 250) {
    if (!client) return false;
    client._actionCooldowns = client._actionCooldowns || {};
    const now = Date.now();
    const last = client._actionCooldowns[actionKey] || 0;
    if (now - last < minIntervalMs) return false;
    client._actionCooldowns[actionKey] = now;
    return true;
  },

  handleClueAttempt(room, client, reqItemId = null, extraCtx = {}) {
    const acc = this.accounts.accountsById.get(client.id);
    if (!acc || client.isDead) return;
    this.accounts.ensureDefaultCharacter(acc);
    const inv = acc.inventory || [];
    const scrollIdx = inv.findIndex((entry) => {
      const id = typeof entry === 'string' ? entry : entry?.id;
      if (reqItemId && id !== reqItemId) return false;
      return Boolean(EQUIPMENT_CATALOG[id]?.isClueScroll);
    });
    if (scrollIdx < 0) {
      client.send({ type: 'sys_msg', category: 'quest', text: '📜 [Treasure Trails] You do not carry a Sealed Clue Scroll in your backpack.' });
      return;
    }
    const scrollId = typeof inv[scrollIdx] === 'string' ? inv[scrollIdx] : inv[scrollIdx]?.id;
    const item = EQUIPMENT_CATALOG[scrollId];
    const prog = client.prog || acc.progression || createDefaultProgression();
    let clue = normalizeClueState(prog.clue);

    if (!clue.activeTier || clue.activeTier !== item.clueTier || !clue.steps.length) {
      clue = startClueScroll(clue, item.clueTier);
      prog.clue = clue;
      this.accounts.saveProgression(client.id, prog);
      client.send({ type: 'clue_state', clue, started: true });
      client.send({ type: 'progression_sync', progression: prog, hp: client.hp, maxHp: client.maxHp, maxSolarCharge: client.maxSolarCharge });
      return;
    }

    const evalRes = evaluateClueStep(clue, {
      roomType: room?.type,
      x: client.x,
      y: client.y,
      npcId: extraCtx.npcId || null,
      talkedNpcs: acc.questState?.talkedNpcs,
      emoteId: extraCtx.emoteId || client._lastEmoteId,
      lastEmoteId: client._lastEmoteId,
    });
    if (!evalRes.advanced) {
      client.send({ type: 'clue_state', clue: evalRes.state, message: evalRes.reason });
      return;
    }

    prog.clue = evalRes.state;
    this.accounts.saveProgression(client.id, prog);
    if (evalRes.completed) {
      this.accounts.removeItemFromInventory(client.id, scrollIdx, 1);
      this.accounts.addItemToInventory(client.id, evalRes.casketItemId, 1);
      this.refreshClientFromAccount(client.id);
      if (room) {
        room.fxQueue.push({ kind: 'spark', x: client.x, y: client.y - 8, colors: ['#fde047', '#38bdf8', '#ffffff'], count: 22 });
        room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 16, text: `🎁 TREASURE CASKET (${evalRes.completedTier.toUpperCase()})!`, color: '#fde047', isCrit: true });
      }
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: `🎁 [Treasure Trails] Solved all steps! Claimed a ${EQUIPMENT_CATALOG[evalRes.casketItemId]?.name || 'Reward Casket'}!`,
      });
    } else if (room) {
      room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 16, text: `📜 CLUE STEP ${evalRes.stepNumber}/${evalRes.totalSteps}!`, color: '#38bdf8', isCrit: true });
    }
    client.send({ type: 'clue_state', clue: prog.clue, completed: Boolean(evalRes.completed) });
    client.send({ type: 'progression_sync', progression: prog, hp: client.hp, maxHp: client.maxHp, maxSolarCharge: client.maxSolarCharge });
  },

  syncSocialState(client) {
    if (!client || !this.guilds) return;
    client.send({
      type: 'social_relations',
      ...this.guilds.getSocialSnapshot(client.id),
    });
  },

  handleOpenCasket(room, client, slotIdx, item) {
    const acc = this.accounts.accountsById.get(client.id);
    if (!acc) return;
    if ((acc.inventory?.length || 0) >= 27) {
      client.send({ type: 'sys_msg', category: 'trade', text: '🎒 [Treasure Trails] Keep at least 2 free backpack slots to open this Reward Casket.' });
      return;
    }
    if (!this.accounts.removeItemFromInventory(client.id, slotIdx, 1)) return;
    const rewards = rollClueCasketRewards(item.clueTier || 'easy');
    const newlyClaimed = [];
    for (const rw of rewards) {
      if (this.accounts.addItemToInventory(client.id, rw.itemId, rw.qty || 1)) {
        newlyClaimed.push(rw);
      }
    }
    this.accounts.recordCollectionUnlock(client.id, newlyClaimed.map((r) => r.itemId));
    this.awardPlayerXP(client, 85, `Treasure Casket (${item.clueTier})`);
    this.refreshClientFromAccount(client.id);
    const summary = newlyClaimed.map((r) => `${r.qty}x ${EQUIPMENT_CATALOG[r.itemId]?.name || r.itemId}`).join(', ');
    if (room) {
      room.fxQueue.push({ kind: 'spark', x: client.x, y: client.y - 10, colors: ['#fde047', '#f59e0b', '#ffffff'], count: 24 });
      room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 18, text: '👑 CASKET OPENED!', color: '#fde047', isCrit: true });
    }
    client.send({ type: 'sys_msg', category: 'quest', text: `🎁 [Treasure Casket] Unsealed loot: ${summary}!` });
    client.send({ type: 'casket_opened', tier: item.clueTier, rewards: newlyClaimed });
  },
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

    this.ensureArenaMatchMeta?.(room, bluePlayers, redPlayers);
    for (const p of bluePlayers) {
      if (!p.preArenaSpot && p.roomType !== ROOM_TYPES.ARENA_3V3) {
        p.preArenaSpot = { roomId: p.roomId, roomType: p.roomType, x: p.x, y: p.y };
      }
      p.isSpectator = false;
      p.hp = p.maxHp;
      p.send({ type: 'queue_state', queueing: false });
      this.joinRoom(p, room.id, 'blue');
      p.send({ type: 'sys_msg', category: 'zone', text: summary });
    }
    for (const p of redPlayers) {
      if (!p.preArenaSpot && p.roomType !== ROOM_TYPES.ARENA_3V3) {
        p.preArenaSpot = { roomId: p.roomId, roomType: p.roomType, x: p.x, y: p.y };
      }
      p.isSpectator = false;
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
    const pvpEnabled = room?.isOverworld
      ? Boolean(ROOM_CONFIGS[pA.roomType]?.pvp && ROOM_CONFIGS[pB.roomType]?.pvp)
      : Boolean(room?.pvp);
    if (!pvpEnabled) return true;
    if (room.type === ROOM_TYPES.ARENA_3V3) return pA.team === pB.team;
    if (this.parties.areInSameParty(pA.id, pB.id)) return true;
    return pA.faction === pB.faction;
  },

  canDamageEntity(room, player, ent, primaryTargetId = null) {
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
    } else if (ent.type === 'mob' && player && isSameFactionProtectedMob(ent.zoneType || room.type, ent, player.faction, player.id)) {
      // Unprovoked same-faction creeps in faction cities are only damaged if explicitly targeted
      if (primaryTargetId && ent.id === primaryTargetId) return true;
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

        if (room.isOverworld) {
          let targetX = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, nx));
          let targetY = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, ny));
          const dist = Math.hypot(targetX - client.x, targetY - client.y);
          const MAX_STEP = 260;
          if (dist > MAX_STEP) {
            const ratio = MAX_STEP / dist;
            targetX = client.x + (targetX - client.x) * ratio;
            targetY = client.y + (targetY - client.y) * ratio;
          }

          const prevRoomType = client.roomType || ROOM_TYPES.SANCTUARY_HUB;
          const moveRes = clampSurfacePosition(client.x, client.y, targetX, targetY, {
            founderRooms: FOUNDER_ONLY_ROOMS,
            founderChecker: (rt) => isRoomUnlockedForEdition(rt, client),
            isWaterAt: (wx, wy) => isSurfaceFootprintInWater(wx, wy, 4, 3),
          });
          client.x = moveRes.x;
          client.y = moveRes.y;

          if (moveRes.blockedByBarrier) {
            client.posOverrideSeq = (client.posOverrideSeq || 0) + 1;
            const nowBarrier = Date.now();
            if (nowBarrier - (client._lastBarrierWarnAt || 0) > 1500) {
              client._lastBarrierWarnAt = nowBarrier;
              const bCfg = ROOM_CONFIGS[moveRes.barrierRoomType];
              const zoneTitle = bCfg?.shortTitle || 'Founder Realm';
              client.send?.({
                type: 'trial_gate',
                feature: 'zone',
                roomType: moveRes.barrierRoomType,
                zoneTitle,
              });
              client.send?.({
                type: 'sys_msg',
                category: 'combat',
                text: `🔒 [Astral Resonance Barrier] ${zoneTitle} requires Founder's Edition. Keep playing Trial Realms or redeem a Serial Key!`,
              });
              room.fxQueue.push({
                kind: 'fct',
                x: client.x,
                y: client.y - 14,
                text: '🔒 ASTRAL BARRIER',
                color: '#f43f5e',
              });
            }
          } else {
            const newZone = moveRes.region?.roomType || prevRoomType;
            client.roomType = newZone;
            if (newZone !== prevRoomType) {
              const zoneCfg = ROOM_CONFIGS[newZone];
              if (!client.portalQuestDone && newZone === ROOM_TYPES.NEXUS_WARZONE) {
                client.portalQuestDone = true;
                this.awardPlayerXP(client, 40, 'Entered Nexus Warzone');
              }
              client.send?.({
                type: 'region_changed',
                roomType: newZone,
                inTransition: Boolean(moveRes.region?.inTransition),
                fromRoom: moveRes.region?.fromRoom || null,
                toRoom: moveRes.region?.toRoom || null,
                pvp: Boolean(zoneCfg?.pvp),
                x: Math.round(client.x),
                y: Math.round(client.y),
              });
            }
          }
        } else {
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
            const ratio = MAX_STEP / dist;
            targetX = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, client.x + (targetX - client.x) * ratio));
            targetY = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, client.y + (targetY - client.y) * ratio));
          }

          if (!isFootprintInWater(targetX, targetY, room.type, 4, 3)) {
            client.x = targetX;
            client.y = targetY;
          } else if (!isFootprintInWater(targetX, client.y, room.type, 4, 3)) {
            client.x = targetX;
          } else if (!isFootprintInWater(client.x, targetY, room.type, 4, 3)) {
            client.y = targetY;
          } else if (isWaterTile(client.x, client.y, room.type)) {
            const dry = findNearestDryTile(client.x, client.y, room.type, room.halfW, room.halfH);
            client.x = dry.x;
            client.y = dry.y;
          }
        }

        client.z = Math.max(0, Math.min(80, Number(msg.z) || 0));
        if (['up', 'down', 'left', 'right'].includes(msg.dir)) {
          client.dir = msg.dir;
        }
        client.isMoving = Boolean(msg.isMoving);
        if (client.mountCast && (client.isMoving || Math.hypot(nx - client.x, ny - client.y) > 2)) {
          client.mountCast = null;
          client.send?.({ type: 'mount_synced', mountId: client.mountId || null, reason: 'move' });
        }
        if (client.mountId && !canRideMountInRoom(client.roomType)) {
          client.mountId = null;
          client.send?.({ type: 'mount_synced', mountId: null, reason: 'indoors' });
        }
        const fogMovedDist = Math.hypot(
          (client.x || 0) - (client._lastFogRevealX ?? client.x),
          (client.y || 0) - (client._lastFogRevealY ?? client.y)
        );
        if (fogMovedDist >= 120 || !client.prog?.exploration?.discoveredZones?.includes(client.roomType)) {
          client.prog.exploration = normalizeExplorationState(client.prog?.exploration, client.faction);
          const fogRes = revealFogOfWarAt(client.prog.exploration, client.x, client.y, client.roomType, 1, client.faction);
          client.prog.exploration = fogRes.state;
          client._lastFogRevealX = client.x;
          client._lastFogRevealY = client.y;
          if (fogRes.changed) {
            this.accounts.saveProgression(client.id, client.prog);
            client.send?.({
              type: 'exploration_sync',
              exploration: client.prog.exploration,
              newlyDiscoveredZone: fogRes.newlyDiscoveredZone,
            });
          }
        }
        client.lastMovePacketAt = Date.now();
        if (Number.isFinite(Number(msg.seq))) {
          client.lastMoveSeq = Math.max(client.lastMoveSeq || 0, Math.floor(Number(msg.seq)));
        }
        {
          const nowMs = Date.now();
          const roundedX = Math.round(Number(client.x) || 0);
          const roundedY = Math.round(Number(client.y) || 0);
          const roomChangedSinceSave = client.roomType !== client._lastSavedRoomType;
          const movedDistSinceSave = Math.hypot(
            roundedX - (Number.isFinite(client._lastSavedX) ? client._lastSavedX : roundedX),
            roundedY - (Number.isFinite(client._lastSavedY) ? client._lastSavedY : roundedY)
          );
          const stoppedAtNewSpot = !client.isMoving && (roomChangedSinceSave || movedDistSinceSave >= 1);
          const movedFarEnough = movedDistSinceSave >= 120 && (nowMs - (client._lastSavedAt || 0)) >= 1200;
          if (roomChangedSinceSave || stoppedAtNewSpot) {
            this.saveClientState(client, { immediate: true });
          } else if (movedFarEnough) {
            // Avoid blocking/saturating Postgres on every continuous walk step while keeping memory current
            this.saveClientState(client, { immediate: false });
          }
        }
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
        if (client.mountCast) {
          client.mountCast = null;
          client.send?.({ type: 'mount_synced', mountId: client.mountId || null, reason: 'cancelled' });
        }
        break;

      case 'toggle_mount': {
        if (!room || client.isDead || client.freezeTimer > 0) break;
        if (client.mountId) {
          client.mountId = null;
          client.mountCast = null;
          client.send({ type: 'mount_synced', mountId: null, reason: 'manual' });
          break;
        }
        if (client.mountCast) {
          client.mountCast = null;
          client.send({ type: 'mount_synced', mountId: null, reason: 'cancelled' });
          break;
        }
        const activeZone = client.roomType || room.type;
        if (!canRideMountInRoom(activeZone)) {
          client.send({
            type: 'sys_msg',
            category: 'combat',
            text: '🐴 Mounts can only be summoned outdoors on the overland continent.',
          });
          break;
        }
        client.prog.exploration = normalizeExplorationState(client.prog?.exploration, client.faction);
        const requestedMount = msg.mountId && MOUNTS_CATALOG[msg.mountId]
          ? msg.mountId
          : (client.prog.exploration.preferredMountId || getDefaultMountIdForFaction(client.faction));
        const unlockedSet = new Set(client.prog.exploration.unlockedMountIds || []);
        const mountId = unlockedSet.has(requestedMount)
          ? requestedMount
          : getDefaultMountIdForFaction(client.faction);
        client.mountCast = {
          mountId,
          remaining: MOUNT_CAST_DURATION_SEC,
          total: MOUNT_CAST_DURATION_SEC,
        };
        client.send({
          type: 'mount_cast_started',
          mountId,
          duration: MOUNT_CAST_DURATION_SEC,
          name: MOUNTS_CATALOG[mountId]?.name || 'Faction Mount',
        });
        break;
      }

      case 'select_mount': {
        client.prog.exploration = normalizeExplorationState(client.prog?.exploration, client.faction);
        const targetId = String(msg.mountId || '');
        if (MOUNTS_CATALOG[targetId] && client.prog.exploration.unlockedMountIds.includes(targetId)) {
          client.prog.exploration.preferredMountId = targetId;
          this.accounts.saveProgression(client.id, client.prog);
          client.send({ type: 'exploration_sync', exploration: client.prog.exploration });
        }
        break;
      }

      case 'discover_waypoint': {
        if (!room || client.isDead || !canRideMountInRoom(client.roomType || room.type)) break;
        const candidate = (msg.shrineId && WAYPOINT_SHRINES_BY_ID[msg.shrineId]) || findNearestWaypointShrine(client.x, client.y, 135);
        if (!candidate) break;
        const distWp = Math.hypot(client.x - candidate.wx, client.y - candidate.wy);
        if (distWp > 140) {
          client.send({ type: 'sys_msg', category: 'quest', text: `🧭 Move closer to ${candidate.name} to attune the Waypoint Shrine.` });
          break;
        }
        client.prog.exploration = normalizeExplorationState(client.prog?.exploration, client.faction);
        const already = client.prog.exploration.unlockedShrines.includes(candidate.id);
        if (!already) {
          client.prog.exploration.unlockedShrines.push(candidate.id);
          this.accounts.saveProgression(client.id, client.prog);
          this.awardPlayerXP(client, 40, `Attuned ${candidate.name}`);
          room.fxQueue.push({ kind: 'spark', x: candidate.wx, y: candidate.wy - 12, colors: ['#38bdf8', '#fde047', '#ffffff'], count: 28 });
          room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 18, text: `🧭 WAYPOINT ATTUNED!`, color: '#38bdf8', isCrit: true });
          client.send({ type: 'waypoint_unlocked', shrineId: candidate.id, name: candidate.name });
        }
        client.send({ type: 'exploration_sync', exploration: client.prog.exploration });
        break;
      }

      case 'teleport_waypoint': {
        if (!room || client.isDead || client.freezeTimer > 0) break;
        if (room.type === ROOM_TYPES.ARENA_3V3) {
          client.send({ type: 'sys_msg', category: 'combat', text: '⚔️ Cannot Waypoint travel while inside an Arena match!' });
          break;
        }
        const wp = WAYPOINT_SHRINES_BY_ID[String(msg.shrineId || '')];
        if (!wp) break;
        client.prog.exploration = normalizeExplorationState(client.prog?.exploration, client.faction);
        if (!client.prog.exploration.unlockedShrines.includes(wp.id)) {
          client.send({ type: 'sys_msg', category: 'quest', text: `🔒 ${wp.name} is still unattuned! Discover it on foot first.` });
          break;
        }
        if (!isRoomUnlockedForEdition(wp.roomType, client)) {
          client.send({ type: 'trial_gate', feature: 'zone', roomType: wp.roomType, zoneTitle: wp.name });
          break;
        }
        client.mountId = null;
        client.mountCast = null;
        this.joinRoom(client, wp.roomType, null, wp.wx, wp.wy, 'down');
        client.send({ type: 'waypoint_teleported', shrineId: wp.id, name: wp.name, roomType: wp.roomType, x: wp.wx, y: wp.wy });
        break;
      }

      case 'harvest_node':
        if (room) this.handleHarvestNode(room, client, msg.nodeId);
        break;

      case 'craft_recipe':
        this.handleCraftRecipe(room, client, String(msg.recipeId || '').trim());
        break;

      case 'extract_cipher':
        this.handleExtractCipher(room, client, msg.itemId, msg.count);
        break;

      case 'compile_familiar':
        this.handleCompileFamiliar(room, client, msg.familiarId);
        break;

      case 'set_active_familiar':
        this.handleSetActiveFamiliar(room, client, msg.familiarId);
        break;

      case 'set_familiar_variant':
        this.handleSetFamiliarVariant(client, msg.familiarId, msg.variant);
        break;

      case 'fam_duel_challenge':
        this.handleFamDuelChallenge(client, msg);
        break;

      case 'fam_duel_respond':
        this.handleFamDuelRespond(client, msg);
        break;

      case 'fam_duel_move':
        this.handleFamDuelMove(client, msg);
        break;

      case 'fam_duel_forfeit':
        this.handleFamDuelForfeit(client, msg);
        break;

      case 'soothe_wild_echo':
        if (room) this.handleSootheWildEcho(room, client, msg.entityId);
        break;

      case 'mail_list': {
        const mb = this.accounts.getMailbox(client.id);
        client.send({ type: 'mailbox_sync', ...mb });
        break;
      }

      case 'mail_send': {
        if (!this.checkActionRateLimit(client, 'mail_send', 1200)) break;
        const mailAcc = this.accounts?.accountsById?.get(client.id);
        if (this.accounts?.isAccountMuted?.(mailAcc)) {
          client.send({ type: 'mail_action_res', ok: false, action: 'send', error: 'Muted accounts cannot send mail.' });
          break;
        }
        this.accounts
          .sendMailParcel({
            senderAccountId: client.id,
            recipientName: msg.to,
            subject: msg.subject,
            body: msg.body,
            attachGold: msg.gold,
            attachItemId: msg.itemId || null,
            attachItemQty: msg.itemQty || 1,
          })
          .then((res) => {
            if (res.error) {
              client.send({ type: 'mail_action_res', ok: false, action: 'send', error: res.error });
              return;
            }
            this.refreshClientFromAccount(client.id);
            const senderMb = this.accounts.getMailbox(client.id);
            client.send({
              type: 'mail_action_res',
              ok: true,
              action: 'send',
              message: `Delivered Herald Post to ${res.recipientName}! (-${res.postagePaid}g postage)`,
              ...senderMb,
            });
            client.send({
              type: 'sys_msg',
              category: 'trade',
              text: `📬 [Herald Post] Dispatched letter to ${res.recipientName}.`,
            });
            const recClient = this.getClientById(res.recipientAccountId);
            if (recClient) {
              recClient.send({ type: 'mailbox_sync', ...this.accounts.getMailbox(res.recipientAccountId) });
              recClient.send({
                type: 'sys_msg',
                category: 'quest',
                text: `📬 [Herald Post] New mail arrived from ${client.displayName}: "${res.parcel.subject}"`,
              });
            }
          })
          .catch((err) => {
            client.send({ type: 'mail_action_res', ok: false, action: 'send', error: err.message || 'Mail dispatch failed' });
          });
        break;
      }

      case 'mail_claim': {
        const res = this.accounts.claimMailParcel(client.id, String(msg.mailId || '').trim());
        if (res.error) {
          client.send({ type: 'mail_action_res', ok: false, action: 'claim', error: res.error });
          break;
        }
        this.refreshClientFromAccount(client.id);
        client.send({
          type: 'mail_action_res',
          ok: true,
          action: 'claim',
          message: 'Claimed parcel contents into your backpack!',
          mailbox: res.mailbox,
          unreadCount: res.unreadCount,
        });
        if (room) {
          room.fxQueue.push({ kind: 'spark', x: client.x, y: client.y - 10, colors: ['#fde047', '#4ade80', '#ffffff'], count: 16 });
          room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 18, text: '📬 PARCEL CLAIMED!', color: '#fde047', isCrit: true });
        }
        break;
      }

      case 'mail_mark_read': {
        const res = this.accounts.markMailRead(client.id, String(msg.mailId || '').trim());
        client.send({ type: 'mailbox_sync', ...res });
        break;
      }

      case 'mail_delete': {
        const res = this.accounts.deleteMailParcel(client.id, String(msg.mailId || '').trim());
        if (res.error) {
          client.send({ type: 'mail_action_res', ok: false, action: 'delete', error: res.error });
          break;
        }
        client.send({
          type: 'mail_action_res',
          ok: true,
          action: 'delete',
          message: 'Mail deleted.',
          mailbox: res.mailbox,
          unreadCount: res.unreadCount,
        });
        break;
      }

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
              this.refreshClientFromAccount(client.id);
            } else {
              const clsDefaults = Object.values(CLASSES_CATALOG[client.classId]?.defaultEquipment || {});
              if (clsDefaults.includes(item.id)) {
                const targetSlot = item.slot === 'armor' ? 'body' : item.slot === 'offhand' ? 'shield' : item.slot;
                const nextEquip = { ...(client.equipment || {}), [targetSlot]: item.id };
                this.accounts.updateProfile(client.id, { equipment: nextEquip });
                this.refreshClientFromAccount(client.id);
              } else {
                item = null;
                client.send({ type: 'sys_msg', category: 'combat', text: '❌ You must own this item in your backpack to equip it.' });
              }
            }
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

      case 'use_consumable': {
        const acc = this.accounts.accountsById.get(client.id);
        if (!acc || client.isDead) break;
        this.accounts.ensureDefaultCharacter(acc);
        const inv = acc.inventory || [];
        let slotIdx = msg.slotIndex !== undefined ? Number(msg.slotIndex) : -1;
        const reqItemId = msg.itemId ? String(msg.itemId).trim() : null;
        if (slotIdx < 0 || slotIdx >= inv.length || (reqItemId && (typeof inv[slotIdx] === 'string' ? inv[slotIdx] : inv[slotIdx]?.id) !== reqItemId)) {
          slotIdx = reqItemId ? inv.findIndex((it) => (typeof it === 'string' ? it : it?.id) === reqItemId) : -1;
        }
        if (slotIdx < 0 || slotIdx >= inv.length) break;
        const slotEntry = inv[slotIdx];
        const itId = typeof slotEntry === 'string' ? slotEntry : slotEntry?.id;
        const item = itId ? EQUIPMENT_CATALOG[itId] : null;
        if (!item || item.slot !== 'consumable') break;

        if (item.isClueScroll) {
          this.handleClueAttempt(room, client, itId, msg);
          break;
        }
        if (item.isRewardCasket) {
          this.handleOpenCasket(room, client, slotIdx, item);
          break;
        }

        if (item.temperTargetMax) {
          const ch = this.accounts.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
          const prog = ch?.progression || acc.progression || client.prog;
          const equip = ch?.equipment || acc.equipment || client.equipment || {};
          const preferredSlot = msg.preferredSlot ? String(msg.preferredSlot).trim() : null;
          const res = applyTemperingUpgrade(prog, equip, item, preferredSlot);
          if (!res.ok) {
            client.send({ type: 'sys_msg', category: 'combat', text: `🔨 [Tempering] ${res.reason}.` });
            if (room) room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 12, text: res.reason.toUpperCase(), color: '#ef4444' });
            break;
          }
          if (!this.accounts.removeItemFromInventory(client.id, slotIdx, 1)) break;
          if (acc.progression) acc.progression.tempering = { ...(prog.tempering || {}) };
          if (ch?.progression) ch.progression.tempering = { ...(prog.tempering || {}) };
          this.accounts.schedulePersist(acc.id, ch?.id);
          this.refreshClientFromAccount(client.id);
          client.send({
            type: 'sys_msg',
            category: 'quest',
            text: `🔨 [Gear Tempering] ${EQUIPMENT_CATALOG[res.itemId]?.name || res.slotKey} tempered to +${res.newRank}!`,
          });
          if (room) {
            room.fxQueue.push({ kind: 'spark', x: client.x, y: client.y - 8, colors: ['#fb923c', '#fde047', '#38bdf8'], count: 16 });
            room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 16, text: `🔨 ${res.slotKey.toUpperCase()} +${res.newRank}!`, color: '#fbbf24', isCrit: true });
          }
          break;
        }

        if (item.weaponImbue) {
          if (!this.accounts.removeItemFromInventory(client.id, slotIdx, 1)) break;
          client.weaponImbue = { ...item.weaponImbue, timer: item.weaponImbue.durationSec || 600 };
          this.refreshClientFromAccount(client.id);
          client.send({
            type: 'sys_msg',
            category: 'combat',
            text: `🗡️ [Weapon Imbue] Coated your weapon with ${item.name}!`,
          });
          if (room) {
            room.fxQueue.push({ kind: 'spark', x: client.x, y: client.y - 8, colors: [item.weaponImbue.color || '#facc15', '#ffffff'], count: 16 });
            room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 16, text: `🗡️ ${item.weaponImbue.name.toUpperCase()}`, color: item.weaponImbue.color || '#facc15', isCrit: true });
          }
          break;
        }

        if (item.healHp || item.restoreGlimmer || item.wellFed) {
          if (!this.accounts.removeItemFromInventory(client.id, slotIdx, 1)) break;
          if (item.healHp && client.hp < client.maxHp) {
            client.hp = Math.min(client.maxHp, client.hp + item.healHp);
            if (room) room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 14, text: `+${item.healHp} HP`, color: '#4ade80', isCrit: true });
          }
          if (item.restoreGlimmer && client.solarCharge < client.maxSolarCharge) {
            client.solarCharge = Math.min(client.maxSolarCharge, client.solarCharge + item.restoreGlimmer);
            if (room) room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 26, text: `+${item.restoreGlimmer} GLIMMER`, color: '#38bdf8', isCrit: true });
          }
          if (item.wellFed) {
            client.wellFedBuff = { ...item.wellFed, timer: item.wellFed.durationSec || 600 };
            if (room) room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 36, text: `🍲 ${item.wellFed.name.toUpperCase()}`, color: item.wellFed.color || '#fde047', isCrit: true });
          }
          this.parties?.syncPlayerVitals?.(client.id);
          this.refreshClientFromAccount(client.id);
        }
        break;
      }

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

      case 'salvage_inventory_item': {
        const slotIdx = Number(msg.slotIndex);
        const inv = client.inventory || [];
        if (slotIdx >= 0 && slotIdx < inv.length) {
          const it = inv[slotIdx];
          const itId = typeof it === 'string' ? it : it?.id;
          const yieldSpec = getSalvageYield(itId);
          if (!yieldSpec) {
            if (room) {
              room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 10, text: 'CANNOT SALVAGE THAT ITEM', color: '#ef4444' });
            }
            break;
          }
          const removed = this.accounts.removeItemFromInventory(client.id, slotIdx, 1);
          if (!removed) break;
          if (yieldSpec.gold > 0) {
            const addedGold = this.accounts.addItemToInventory(client.id, 'solar_gold', yieldSpec.gold);
            if (!addedGold && room) {
              room.lootSeq = (room.lootSeq || 0) + 1;
              room.loot.push({ id: `loot_${room.lootSeq}`, kind: 'item', itemId: 'solar_gold', qty: yieldSpec.gold, x: client.x, y: client.y, ttl: 60, maxTtl: 60 });
            }
          }
          for (const mat of yieldSpec.materials) {
            const addedMat = this.accounts.addItemToInventory(client.id, mat.id, mat.qty);
            if (!addedMat && room) {
              room.lootSeq = (room.lootSeq || 0) + 1;
              room.loot.push({ id: `loot_${room.lootSeq}`, kind: 'item', itemId: mat.id, qty: mat.qty, x: client.x, y: client.y, ttl: 60, maxTtl: 60 });
            }
          }
          this.awardProfessionXP(client, yieldSpec.profId, yieldSpec.xp, `Salvaged ${EQUIPMENT_CATALOG[itId]?.name || itId}`);
          this.refreshClientFromAccount(client.id);
          if (room) {
            room.fxQueue.push({
              kind: 'fct',
              x: client.x,
              y: client.y - 12,
              text: `🔨 SALVAGED +${yieldSpec.gold}g & MATS`,
              color: '#fb923c',
            });
            room.fxQueue.push({
              kind: 'spark',
              x: client.x,
              y: client.y - 8,
              colors: ['#fb923c', '#fde047', '#ffffff'],
              count: 10,
            });
          }
        }
        break;
      }

      case 'buy_merchant_item': {
        if (!this.checkActionRateLimit(client, 'merchant_buy', 80)) break;
        const merchantId = msg.merchantId ? String(msg.merchantId).trim() : null;
        const itemId = String(msg.itemId || '').trim();
        const qty = Math.max(1, Math.min(50, Math.floor(Number(msg.qty) || 1)));
        const canonicalPrice = getMerchantWarePrice(merchantId, itemId);
        if (itemId && canonicalPrice && canonicalPrice > 0) {
          const res = this.accounts.buyMerchantItem(client.id, itemId, canonicalPrice, qty);
          if (res.success) {
            this.refreshClientFromAccount(client.id);
            if (room) {
              room.fxQueue.push({
                kind: 'fct',
                x: client.x,
                y: client.y - 12,
                text: `+${qty}x ${res.item?.name?.toUpperCase() || itemId} (-${canonicalPrice * qty}g)`,
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
        } else if (room) {
          room.fxQueue.push({
            kind: 'fct',
            x: client.x,
            y: client.y - 12,
            text: '❌ ITEM NOT SOLD BY MERCHANT',
            color: '#ef4444',
          });
        }
        break;
      }

      case 'sell_merchant_item': {
        if (!this.checkActionRateLimit(client, 'merchant_sell', 80)) break;
        const slotIdx = Number(msg.slotIndex);
        const qty = Math.max(1, Math.min(999, Math.floor(Number(msg.qty) || 1)));
        const res = this.accounts.sellMerchantItem(client.id, slotIdx, qty);
        if (res.success) {
          this.refreshClientFromAccount(client.id);
          if (room) {
            room.fxQueue.push({
              kind: 'fct',
              x: client.x,
              y: client.y - 12,
              text: `+${res.totalGold}G (${res.qty}x ${res.item?.name?.toUpperCase() || res.itemId})`,
              color: '#fde047',
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
        break;
      }

      case 'bank_op': {
        if (!this.checkActionRateLimit(client, 'bank_op', 80)) break;
        const op = String(msg.op || '').trim();
        let res = { ok: false };
        if (op === 'deposit') {
          res = this.accounts.depositToBank(client.id, msg.slotIndex, msg.qty ?? 'all');
        } else if (op === 'withdraw') {
          res = this.accounts.withdrawFromBank(client.id, msg.bankIndex, msg.qty ?? 1);
        } else if (op === 'deposit_all') {
          res = this.accounts.depositAllToBank(client.id, { onlyMaterials: false });
        } else if (op === 'deposit_materials') {
          res = this.accounts.depositAllToBank(client.id, { onlyMaterials: true });
        } else if (op === 'quick_stack') {
          res = this.accounts.depositAllToBank(client.id, { quickStackOnly: true });
        } else if (op === 'deposit_worn') {
          res = this.accounts.depositWornGearToBank(client.id);
        } else if (op === 'sort') {
          res = this.accounts.sortBank(client.id, msg.orderedItemIds);
        }
        if (res.ok) {
          this.refreshClientFromAccount(client.id);
        } else if (res.reason) {
          client.send({ type: 'sys_msg', category: 'trade', text: `🏛️ [AetherVault] ${res.reason}.` });
          this.refreshClientFromAccount(client.id);
        }
        break;
      }

      case 'sync_bank': {
        // Legacy full-array bank overwrite is disabled in multiplayer for anti-dupe security;
        // resync the client back to authoritative server storage.
        this.refreshClientFromAccount(client.id);
        break;
      }

      case 'complete_quest': {
        if (!this.checkActionRateLimit(client, 'complete_quest', 400)) break;
        const questId = String(msg.questId || '').trim();
        const res = this.accounts.completeCanonicalQuest(client.id, questId);
        if (res.ok) {
          const rw = res.spec.rewards || {};
          if (rw.xp > 0) this.awardPlayerXP(client, rw.xp, res.spec.title);
          if (rw.glimmer > 0) {
            client.solarCharge = Math.min(client.maxSolarCharge, (client.solarCharge || 0) + rw.glimmer);
          }
          if (rw.professionXp && typeof rw.professionXp === 'object') {
            for (const [profId, amt] of Object.entries(rw.professionXp)) {
              if (amt > 0) this.awardProfessionXP(client, profId, amt, res.spec.title);
            }
          }
          if (res.questCapeAwarded) {
            client.send({
              type: 'sys_msg',
              category: 'quest',
              text: '📜 [GRANDMASTER MILESTONE] You completed every canonical quest and earned the Cape of Canonical Lore (Quest Cape)!',
            });
            if (room) {
              room.fxQueue.push({ kind: 'fct', x: client.x, y: client.y - 22, text: '📜 QUEST POINT CAPE UNLOCKED!', color: '#38bdf8', isCrit: true });
            }
          }
          this.refreshClientFromAccount(client.id);
        } else if (res.reason && !res.alreadyCompleted) {
          client.send({ type: 'sys_msg', category: 'quest', text: `[Quest] ${res.reason}.` });
        }
        break;
      }

      case 'sync_quest_state': {
        if (msg.questState && typeof msg.questState === 'object') {
          // completedQuests is strictly server-authoritative via complete_quest
          const existingCompleted = { ...(client.questState?.completedQuests || {}) };
          const mergedState = {
            ...msg.questState,
            completedQuests: existingCompleted,
          };
          this.accounts.saveQuestState(client.id, mergedState);
          client.questState = mergedState;
        }
        break;
      }

      case 'sync_profession_progress': {
        if (!this.checkActionRateLimit(client, 'sync_prof', 800)) break;
        if (msg.professions && typeof msg.professions === 'object') {
          const profCap = getProfessionLevelCap(client);
          const bounded = {};
          for (const profId of Object.keys(PROFESSIONS_CATALOG)) {
            const inc = msg.professions[profId];
            if (!inc || typeof inc !== 'object') continue;
            const curXp = Math.max(0, Math.floor(Number(client.prog?.professions?.[profId]?.xp) || 0));
            const incXp = Math.max(0, Math.floor(Number(inc.xp) || 0));
            // Bound arbitrary client profession XP delta to <= 60 XP per sync to block XP spoofing
            const delta = Math.max(0, Math.min(60, incXp - curXp));
            if (delta > 0 && getProfessionLevelFromXp(curXp) < profCap) {
              bounded[profId] = { xp: curXp + delta };
            }
          }
          if (Object.keys(bounded).length > 0) {
            const updated = this.accounts.saveProfessionProgress(client.id, bounded);
            if (updated) {
              client.prog = updated;
              for (const professionId of Object.keys(PROFESSION_MASTERY_CAPES)) {
                this.grantProfessionMasteryCape(client, professionId);
              }
              client.send({ type: 'progression_sync', progression: updated });
            }
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
          let safePos = msg.lastPosition;
          if (room?.isOverworld && isSurfaceRoomType(client.roomType)) {
            const sx = Number(safePos.worldX ?? safePos.x);
            const sy = Number(safePos.worldY ?? safePos.y);
            const isActivelyWalking = client.isMoving || (Date.now() - (client.lastMovePacketAt || 0)) < 2500;
            if (
              !isActivelyWalking &&
              Number.isFinite(sx) && Number.isFinite(sy) &&
              Math.hypot(sx - client.x, sy - client.y) <= 240 &&
              !isSurfaceWaterTile(sx, sy)
            ) {
              const clamped = clampSurfacePosition(client.x, client.y, sx, sy, {
                founderRooms: FOUNDER_ONLY_ROOMS,
                founderChecker: (rt) => isRoomUnlockedForEdition(rt, client),
                isWaterAt: (wx, wy) => isSurfaceWaterTile(wx, wy),
              });
              if (!clamped.blockedByBarrier) {
                client.x = clamped.x;
                client.y = clamped.y;
                client.roomType = clamped.region?.roomType || client.roomType;
              }
            }
            client.lastPosition = {
              roomType: client.roomType,
              x: Math.round(client.x),
              y: Math.round(client.y),
              worldX: Math.round(client.x),
              worldY: Math.round(client.y),
            };
          } else {
            if (safePos.roomType === client.roomType) {
              const roomCfg = ROOM_CONFIGS[client.roomType];
              const halfW = roomCfg?.halfW || 280;
              const halfH = roomCfg?.halfH || 280;
              const sx = Number(safePos.x);
              const sy = Number(safePos.y);
              const isActivelyWalking = client.isMoving || (Date.now() - (client.lastMovePacketAt || 0)) < 2500;
              if (
                !isActivelyWalking &&
                Number.isFinite(sx) && Number.isFinite(sy) &&
                Math.hypot(sx - client.x, sy - client.y) <= 240 &&
                !isWaterTile(sx, sy, client.roomType)
              ) {
                client.x = Math.max(-halfW + 14, Math.min(halfW - 14, sx));
                client.y = Math.max(-halfH + 14, Math.min(halfH - 14, sy));
              }
            }
            client.lastPosition = {
              roomType: client.roomType,
              x: Math.round(client.x),
              y: Math.round(client.y),
            };
          }
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

      case 'respec_skills':
        this.handleRespecSkills(client);
        break;

      case 'upgrade_rank':
        this.handleUpgradeRank(client, Number(msg.slot));
        break;

      case 'unlock_achievement': {
        const ach = ACHIEVEMENTS_CATALOG.find((a) => a.id === msg.achievementId);
        if (ach && client.prog) {
          client.prog.achievements = client.prog.achievements || { completed: {}, unlockedTitles: [] };
          client.prog.achievements.completed = client.prog.achievements.completed || {};
          client.prog.achievements.unlockedTitles = client.prog.achievements.unlockedTitles || [];
          if (!client.prog.achievements.completed[ach.id]) {
            client.prog.achievements.completed[ach.id] = { unlockedAt: new Date().toISOString() };
          }
          if (ach.unlockedTitle && !client.prog.achievements.unlockedTitles.includes(ach.unlockedTitle)) {
            client.prog.achievements.unlockedTitles.push(ach.unlockedTitle);
          }
          this.accounts.saveProgression(client.id, client.prog);
        }
        break;
      }

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

      case 'toggle_devotion': {
        if (!this.checkActionRateLimit(client, 'devotion', 120)) break;
        const devId = String(msg.devotionId || '').trim();
        const res = toggleDevotionInList(
          client.activeDevotions || [],
          devId,
          client.prog?.level || 1,
          client.solarCharge || 0
        );
        if (!res.ok) {
          client.send({ type: 'sys_msg', category: 'combat', text: `🙏 [Devotion] ${res.reason}.` });
          client.send({ type: 'devotion_sync', activeDevotions: client.activeDevotions || [] });
          break;
        }
        client.activeDevotions = res.list;
        client.send({ type: 'devotion_sync', activeDevotions: client.activeDevotions });
        if (room && res.devotion) {
          room.fxQueue.push({
            kind: 'fct',
            x: client.x,
            y: client.y - 16,
            text: res.active ? `${res.devotion.icon} ${res.devotion.shortName.toUpperCase()} ON` : `${res.devotion.icon} ${res.devotion.shortName.toUpperCase()} OFF`,
            color: res.active ? res.devotion.color : '#94a3b8',
          });
        }
        break;
      }

      case 'slayer_assign': {
        if (!this.checkActionRateLimit(client, 'slayer', 250)) break;
        const prog = client.prog || createDefaultProgression();
        const res = assignSlayerTask(prog.slayer, String(msg.masterId || 'scout_vaelen'), prog.level || 1);
        if (!res.ok) {
          client.send({ type: 'sys_msg', category: 'quest', text: `⚔️ [Slayer] ${res.reason}.` });
          break;
        }
        prog.slayer = res.state;
        client.prog = prog;
        this.accounts.saveProgression(client.id, prog);
        client.send({ type: 'progression_sync', progression: prog, hp: client.hp, maxHp: client.maxHp, maxSolarCharge: client.maxSolarCharge });
        client.send({
          type: 'sys_msg',
          category: 'quest',
          text: `⚔️ [Vanguard Slayer] New Task: Slay ${res.task.targetCount}x ${res.task.name} in ${res.task.roomHint}!`,
        });
        break;
      }

      case 'slayer_skip': {
        if (!this.checkActionRateLimit(client, 'slayer', 250)) break;
        const prog = client.prog || createDefaultProgression();
        const res = skipSlayerTask(prog.slayer, Boolean(msg.blockToo));
        if (!res.ok) {
          client.send({ type: 'sys_msg', category: 'quest', text: `⚔️ [Slayer] ${res.reason}.` });
          break;
        }
        prog.slayer = res.state;
        client.prog = prog;
        this.accounts.saveProgression(client.id, prog);
        client.send({ type: 'progression_sync', progression: prog, hp: client.hp, maxHp: client.maxHp, maxSolarCharge: client.maxSolarCharge });
        client.send({
          type: 'sys_msg',
          category: 'quest',
          text: `⚔️ [Vanguard Slayer] ${Boolean(msg.blockToo) ? 'Blocked' : 'Skipped'} "${res.skippedName}"${res.resetStreak ? ' (Streak reset to 0)' : ` (-${res.cost} Slayer Pts)`}.`,
        });
        break;
      }

      case 'slayer_unlock': {
        if (!this.checkActionRateLimit(client, 'slayer', 250)) break;
        const prog = client.prog || createDefaultProgression();
        const res = purchaseSlayerUnlock(prog.slayer, String(msg.unlockId || '').trim());
        if (!res.ok) {
          client.send({ type: 'sys_msg', category: 'quest', text: `⚔️ [Slayer] ${res.reason}.` });
          break;
        }
        prog.slayer = res.state;
        client.prog = prog;
        if (res.grantItemId) {
          this.accounts.addItemToInventory(client.id, res.grantItemId, 1);
          this.accounts.recordCollectionUnlock(client.id, [res.grantItemId]);
        }
        this.accounts.saveProgression(client.id, prog);
        this.refreshClientFromAccount(client.id);
        client.send({ type: 'progression_sync', progression: prog, hp: client.hp, maxHp: client.maxHp, maxSolarCharge: client.maxSolarCharge });
        client.send({
          type: 'sys_msg',
          category: 'quest',
          text: `🏆 [Vanguard Slayer] Unlocked perk: ${res.perk.name}!`,
        });
        break;
      }

      case 'clue_attempt': {
        if (!this.checkActionRateLimit(client, 'clue', 250)) break;
        this.handleClueAttempt(room, client, msg.itemId || null, msg);
        break;
      }

      case 'party_invite': {
        const tgt = this.getClientById?.(msg.target) || this.findClientByName?.(msg.target);
        if (tgt && this.guilds?.isIgnored(tgt.id, client.id, client.displayName)) break;
        this.parties.invitePlayer(client, msg.target);
        break;
      }

      case 'social_relations_sync':
      case 'guild_state':
        this.syncSocialState(client);
        break;

      case 'guild_create': {
        if (!this.checkActionRateLimit(client, 'guild', 500)) break;
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.createGuild(acc, msg.name, msg.tag, msg.color);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'Guild service unavailable.'}` });
          break;
        }
        this.refreshClientFromAccount(client.id);
        this.syncSocialState(client);
        client.send({ type: 'sys_msg', category: 'quest', text: `🏰 [Guild] Founded <${res.guild.tag}> ${res.guild.name}!` });
        break;
      }

      case 'guild_invite': {
        if (!this.checkActionRateLimit(client, 'guild', 400)) break;
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.inviteMember(acc, msg.target);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'Could not invite.'}` });
          break;
        }
        res.targetClient.send({ type: 'guild_invite', ...res.invite });
        client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] Sent invite to ${res.targetClient.displayName}.` });
        break;
      }

      case 'guild_accept': {
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.acceptInvite(acc, String(msg.guildId || ''));
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'Could not join.'}` });
          break;
        }
        this.refreshClientFromAccount(client.id);
        for (const mid of res.guild.members.keys()) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        client.send({ type: 'sys_msg', category: 'quest', text: `🏰 [Guild] Joined <${res.guild.tag}> ${res.guild.name}!` });
        break;
      }

      case 'guild_leave': {
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.leaveGuild(acc);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'Failed to leave.'}` });
          break;
        }
        this.syncSocialState(client);
        for (const mid of res.guild?.members?.keys() || []) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] Left ${res.guildName}.` });
        break;
      }

      case 'guild_rank': {
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.setMemberRank(acc, String(msg.targetId || ''), String(msg.rank || ''));
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'Rank update failed.'}` });
          break;
        }
        for (const mid of res.guild.members.keys()) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        break;
      }

      case 'guild_kick': {
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.kickMember(acc, String(msg.targetId || ''));
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'Kick failed.'}` });
          break;
        }
        const kickedClient = this.clients.get(msg.targetId);
        if (kickedClient) {
          this.syncSocialState(kickedClient);
          kickedClient.send({ type: 'sys_msg', category: 'combat', text: `🏰 [Guild] You were removed from ${res.guild.name}.` });
        }
        for (const mid of res.guild.members.keys()) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        break;
      }

      case 'guild_motd': {
        const acc = this.accounts?.accountsById?.get(client.id);
        const res = this.guilds?.setMotd(acc, msg.motd);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `🏰 [Guild] ${res?.reason || 'MOTD update failed.'}` });
          break;
        }
        for (const mid of res.guild.members.keys()) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        break;
      }

      case 'guild_bank_deposit': {
        if (!this.checkActionRateLimit(client, 'guild_bank', 200)) break;
        const res = this.guilds?.depositGuildBank(client.id, msg.slotIndex, msg.qty || 1);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'trade', text: `🏛️ [Guild Vault] ${res?.reason || 'Deposit failed.'}` });
          break;
        }
        this.refreshClientFromAccount(client.id);
        for (const mid of res.guild.members.keys()) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        break;
      }

      case 'guild_bank_withdraw': {
        if (!this.checkActionRateLimit(client, 'guild_bank', 200)) break;
        const res = this.guilds?.withdrawGuildBank(client.id, msg.bankIndex, msg.qty || 1);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'trade', text: `🏛️ [Guild Vault] ${res?.reason || 'Withdraw failed.'}` });
          break;
        }
        this.refreshClientFromAccount(client.id);
        for (const mid of res.guild.members.keys()) {
          const online = this.clients.get(mid);
          if (online) this.syncSocialState(online);
        }
        break;
      }

      case 'friend_add':
      case 'ignore_add': {
        if (!this.checkActionRateLimit(client, 'relation', 200)) break;
        const relation = msg.type === 'ignore_add' ? 'ignore' : 'friend';
        const res = this.guilds?.addRelation(client.id, msg.target, relation);
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'chat', text: `[Social] ${res?.reason || 'Failed to update list.'}` });
          break;
        }
        this.syncSocialState(client);
        client.send({ type: 'sys_msg', category: 'quest', text: `[Social] Added ${res.target.name} to your ${relation === 'ignore' ? 'Ignore' : 'Friends'} list.` });
        break;
      }

      case 'friend_remove':
      case 'ignore_remove': {
        const relation = msg.type === 'ignore_remove' ? 'ignore' : 'friend';
        const res = this.guilds?.removeRelation(client.id, msg.target, relation);
        if (res?.ok) this.syncSocialState(client);
        break;
      }

      case 'report_player': {
        if (!this.checkActionRateLimit(client, 'report_player', 3000)) {
          client.send({ type: 'sys_msg', category: 'combat', text: '[Report] Please wait a moment before filing another report.' });
          break;
        }
        const chatCtx = Array.isArray(room?.recentChatLog) ? room.recentChatLog.slice(-15) : [];
        const res = this.guilds?.submitReport({
          reporter: client,
          targetName: msg.targetName,
          reason: msg.reason,
          chatContext: chatCtx,
        });
        if (!res?.ok) {
          client.send({ type: 'sys_msg', category: 'combat', text: `[Report] ${res?.reason || 'Unable to submit report.'}` });
          break;
        }
        client.send({ type: 'sys_msg', category: 'quest', text: `🛡️ [Moderation] Report logged for ${res.report.targetName}. Thank you for keeping the realm safe.` });
        break;
      }

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
        if (!this.checkActionRateLimit(client, 'exchange_place', 400)) break;
        if (this.accounts?.isAccountMuted?.(this.accounts.accountsById.get(client.id))) {
          client.send?.({ type: 'sys_msg', category: 'combat', text: '🔇 [Moderation] Muted accounts cannot place AetherSwap orders.' });
          break;
        }
        if (!isFounderEdition(client)) {
          client.send?.({
            type: 'sys_msg',
            category: 'combat',
            text: "🔒 [AetherSwap Exchange] Placing market orders requires Founder's Edition (€6.99). Redeem a GF-XXXX-XXXX-XXXX Serial Key in Account or Pre-Game!",
          });
          client.send?.({ type: 'trial_gate', feature: 'exchange' });
          break;
        }
        this.exchange?.handlePlaceOrder(client, msg);
        break;

      case 'exchange_collect':
        this.exchange?.handleCollect(client, msg.slot);
        break;

      case 'exchange_abort':
        this.exchange?.handleAbort(client, msg.slot);
        break;

      // Direct Player Trading
      case 'trade_request': {
        if (!this.checkActionRateLimit(client, 'trade_request', 800)) break;
        const trTgt = this.getClientById?.(msg.target) || this.findClientByName?.(msg.target);
        if (trTgt && this.guilds?.isIgnored(trTgt.id, client.id, client.displayName)) break;
        if (!isFounderEdition(client)) {
          client.send?.({
            type: 'sys_msg',
            category: 'combat',
            text: "🔒 [Direct Trading] Player-to-player trading requires Founder's Edition (€6.99). Redeem a GF-XXXX-XXXX-XXXX Serial Key in Account or Pre-Game!",
          });
          client.send?.({ type: 'trial_gate', feature: 'trade' });
          break;
        }
        this.trades?.handleRequest(client, msg.target);
        break;
      }

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

      // 1v1 GlimmerFallTCG.com Tavern Card Duels
      case 'tcg_challenge_invite':
        this.tcg?.handleChallengeInvite(client, msg).catch((err) => {
          client.send?.({ type: 'sys_msg', category: 'combat', text: `🃏 [Tavern TCG] ${err.message}` });
        });
        break;

      case 'tcg_challenge_respond':
        this.tcg?.handleChallengeRespond(client, msg).catch((err) => {
          client.send?.({ type: 'sys_msg', category: 'combat', text: `🃏 [Tavern TCG] ${err.message}` });
        });
        break;

      case 'tcg_start_match':
        this.tcg?.startMatch({
          username: client.displayName || msg.username || 'Summoner',
          playerId: client.id,
          deckId: msg.deckId,
          deckName: msg.deckName,
          faction: msg.faction,
          deckCards: msg.deckCards,
          vsAI: Boolean(msg.vsAI),
          aiDeckName: msg.aiDeckName,
          roomCode: msg.roomCode,
        }).then((res) => {
          client.send?.({
            type: 'tcg_match_joined',
            ...res,
          });
        }).catch((err) => {
          client.send?.({
            type: 'tcg_error',
            error: err.message || 'Could not start TCG match.',
          });
        });
        break;

      case 'tcg_action':
        this.tcg?.performAction({
          matchId: msg.matchId,
          slot: msg.slot || 1,
          action: msg.action,
          payload: msg.payload || {},
        }).catch((err) => {
          client.send?.({
            type: 'tcg_error',
            error: err.message || 'Illegal TCG move.',
          });
        });
        break;

      // Player Profile & Gear Inspect
      case 'inspect_player':
        this.handleInspectPlayer(client, msg.target);
        break;

      case 'list_arena_matches':
        client.send({ type: 'arena_matches_list', matches: this.listActiveArenaMatches() });
        break;

      case 'spectate_arena':
        this.handleSpectateArena(client, msg.roomId || null);
        break;

      case 'leave_spectate':
        this.handleLeaveSpectate(client);
        break;

      case 'lfg_join':
        this.handleLfgJoin(client, msg);
        break;

      case 'lfg_leave':
        this.handleLfgLeave(client);
        break;

      case 'lfg_ready_response':
        this.handleLfgReadyResponse(client, msg);
        break;

      case 'join_raid':
        this.handleJoinRaid(client);
        break;

      case 'outpost_status':
        client.send({
          type: 'outpost_sync',
          outposts: { ...this.warzoneOutposts },
          nextCycleAt: this.warzoneNextCycleAt,
        });
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
      const prevCharId = client.activeCharacterId;
      if (prevCharId && payload.characterId && prevCharId !== payload.characterId) {
        this.saveClientState(client);
      }
      await this.accounts.ensureFreshFromPostgres({ id: client.id });
      const charObj = this.accounts.createOrSelectCharacter(client.id, payload);
      const hasPayloadCoords =
        payload.x !== null &&
        payload.x !== undefined &&
        payload.y !== null &&
        payload.y !== undefined &&
        Number.isFinite(Number(payload.x)) &&
        Number.isFinite(Number(payload.y));
      const lp = charObj.lastPosition;
      const lpIsDefaultSpawn =
        !lp ||
        !lp.roomType ||
        (lp.roomType === ROOM_TYPES.SANCTUARY_HUB && Math.round(Number(lp.x || 0)) === 0 && Math.round(Number(lp.y || 0)) === 96);
      if (
        lpIsDefaultSpawn &&
        payload.enterRealm &&
        payload.enterRealm !== ROOM_TYPES.ARENA_3V3 &&
        ROOM_CONFIGS[payload.enterRealm] &&
        hasPayloadCoords &&
        (payload.enterRealm !== ROOM_TYPES.SANCTUARY_HUB || Math.round(Number(payload.x)) !== 0 || Math.round(Number(payload.y)) !== 96)
      ) {
        charObj.lastPosition = {
          roomType: payload.enterRealm,
          x: Math.round(Number(payload.x)),
          y: Math.round(Number(payload.y)),
        };
      }
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(client.id);
      let targetRoom = null;
      let targetX = null;
      let targetY = null;
      if (charObj.lastPosition?.roomType && charObj.lastPosition.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[charObj.lastPosition.roomType]) {
        const migrated = migrateLegacyPosition(charObj.lastPosition);
        targetRoom = migrated.roomType;
        targetX = migrated.x;
        targetY = migrated.y;
      } else if (payload.enterRealm && ROOM_CONFIGS[payload.enterRealm]) {
        targetRoom = payload.enterRealm;
        targetX = hasPayloadCoords ? Number(payload.x) : null;
        targetY = hasPayloadCoords ? Number(payload.y) : null;
      }
      if (targetRoom) {
        const distFromTarget =
          targetX !== null && targetY !== null
            ? Math.hypot((client.x || 0) - targetX, (client.y || 0) - targetY)
            : 0;
        if (prevCharId !== charObj.id || client.roomType !== targetRoom || distFromTarget > 24) {
          this.joinRoom(client, targetRoom, null, targetX, targetY);
        }
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
