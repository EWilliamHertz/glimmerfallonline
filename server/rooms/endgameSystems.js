// ==========================================
// RoomManager — Phase 4 Endgame Loop:
//   - Ranked 3v3 Arena Elo MMR, Combat Scoreboard & Scrying Pool Spectator Mode
//   - Role Trinity LFG Queue (1 Tank / 1 Healer / 3 DPS) & Ready Check
//   - 10-Player Apex Raid ("Fall of the Primeval Nexus")
//   - Capturable Warzone Outposts (30m Influence Cycle + Realm Buffs)
// ==========================================

import crypto from 'node:crypto';
import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  EQUIPMENT_CATALOG,
  isRoomUnlockedForEdition,
  DEFAULT_ARENA_MMR,
  getArenaTierForMmr,
  calculateArenaEloDelta,
  TRINITY_ROLES,
  getDefaultRoleForClassId,
  canClassPerformRole,
  matchTrinityPartyFromQueue,
  PRIMEVAL_RAID_CONFIG,
  getNextHarbingerImmunity,
  WARZONE_INFLUENCE_CYCLE_MS,
  WARZONE_OUTPOST_DEFS,
  computeOutpostRealmBuffs,
} from '../../shared/protocol.js';

const FACTION_NEXUS_SPRITES = {
  Solari: 'nexusGold',
  Umbri: 'nexusPurple',
  Terra: 'nexusGreen',
  Aether: 'nexusCyan',
};

export const endgameSystemsMethods = {
  // ------------------------------------------
  // 1. 3v3 Ranked Arena Elo MMR, Scoreboard & Spectator Pool
  // ------------------------------------------
  ensureArenaMatchMeta(room, bluePlayers = [], redPlayers = []) {
    const allHumans = [...bluePlayers, ...redPlayers];
    const getMmr = (p) => Number(this.accounts?.accountsById?.get(p.id)?.statsMeta?.arenaMmr ?? DEFAULT_ARENA_MMR);
    const blueAvgMmr = bluePlayers.length
      ? Math.round(bluePlayers.reduce((s, p) => s + getMmr(p), 0) / bluePlayers.length)
      : DEFAULT_ARENA_MMR;
    const redAvgMmr = redPlayers.length
      ? Math.round(redPlayers.reduce((s, p) => s + getMmr(p), 0) / redPlayers.length)
      : DEFAULT_ARENA_MMR;

    const stats = new Map();
    for (const p of allHumans) {
      stats.set(p.id, {
        id: p.id,
        name: p.displayName || 'Champion',
        faction: p.faction || 'Solari',
        team: p.team || (bluePlayers.includes(p) ? 'blue' : 'red'),
        mmrBefore: getMmr(p),
        damage: 0,
        healing: 0,
        kills: 0,
        deaths: 0,
      });
    }

    room.arenaMeta = {
      isBotMatch: bluePlayers.length < 3 || redPlayers.length < 3,
      blueAvgMmr,
      redAvgMmr,
      stats,
      spectators: new Set(),
      startedAt: Date.now(),
    };
  },

  recordArenaCombatStat(room, playerId, field, amount = 0) {
    if (!room || room.type !== ROOM_TYPES.ARENA_3V3 || !room.arenaMeta || !playerId) return;
    const entry = room.arenaMeta.stats.get(playerId);
    if (!entry) return;
    const val = Math.max(0, Math.round(Number(amount) || 0));
    entry[field] = (entry[field] || 0) + val;
  },

  finalizeArenaMatchResults(room, winningTeam, killerPlayer = null) {
    const meta = room.arenaMeta;
    const scoreboard = [];
    const resultsByPlayer = new Map();

    for (const p of room.players.values()) {
      if (p.isSpectator) continue;
      const won = (p.team || 'blue') === winningTeam;
      const st = meta?.stats?.get(p.id) || {
        id: p.id,
        name: p.displayName || 'Champion',
        faction: p.faction || 'Solari',
        team: p.team || 'blue',
        mmrBefore: Number(this.accounts?.accountsById?.get(p.id)?.statsMeta?.arenaMmr ?? DEFAULT_ARENA_MMR),
        damage: 0,
        healing: 0,
        kills: 0,
        deaths: 0,
      };
      const oppAvgMmr = (p.team || 'blue') === 'blue'
        ? (meta?.redAvgMmr ?? DEFAULT_ARENA_MMR)
        : (meta?.blueAvgMmr ?? DEFAULT_ARENA_MMR);
      const elo = calculateArenaEloDelta({
        playerMmr: st.mmrBefore,
        opponentAvgMmr: oppAvgMmr,
        won,
        isBotMatch: Boolean(meta?.isBotMatch),
      });

      this.accounts?.saveProgression(p.id, p.prog, {
        addArenaWins: won ? 1 : 0,
        addArenaLosses: won ? 0 : 1,
        setArenaMmr: elo.newMmr,
      });
      if (won) this.awardPlayerXP(p, 120, '3v3 Arena Victory');

      const row = {
        id: p.id,
        name: st.name,
        faction: st.faction,
        team: st.team,
        won,
        damage: st.damage || 0,
        healing: st.healing || 0,
        kills: st.kills || 0,
        deaths: st.deaths || 0,
        oldMmr: elo.oldMmr,
        newMmr: elo.newMmr,
        delta: elo.delta,
        tierName: elo.tier.name,
        tierBadge: elo.tier.badge,
      };
      scoreboard.push(row);
      resultsByPlayer.set(p.id, row);
    }

    scoreboard.sort((a, b) => (b.damage - a.damage) || (b.kills - a.kills));

    for (const p of room.players.values()) {
      const won = !p.isSpectator && (p.team || 'blue') === winningTeam;
      const mine = resultsByPlayer.get(p.id) || null;
      p.send({
        type: 'arena_result',
        won,
        spectator: Boolean(p.isSpectator),
        winningTeam,
        lastHitBy: killerPlayer?.displayName || null,
        newMmr: mine?.newMmr ?? null,
        mmrDelta: mine?.delta ?? 0,
        tierName: mine?.tierName ?? null,
        tierBadge: mine?.tierBadge ?? null,
        scoreboard,
      });
      if (killerPlayer) {
        p.send({
          type: 'sys_msg',
          category: 'combat',
          text: `💥 [3v3 Arena] ${killerPlayer.displayName} landed the LAST HIT to claim ${winningTeam.toUpperCase()} victory!`,
        });
      }
    }
    return scoreboard;
  },

  listActiveArenaMatches() {
    const out = [];
    for (const r of this.rooms.values()) {
      if (r.type !== ROOM_TYPES.ARENA_3V3 || r.matchEnded) continue;
      let blueCount = 0;
      let redCount = 0;
      const names = [];
      for (const p of r.players.values()) {
        if (p.isSpectator) continue;
        if (p.team === 'red') redCount++;
        else blueCount++;
        names.push(p.displayName);
      }
      out.push({
        roomId: r.id,
        title: r.title,
        blueCount,
        redCount,
        spectators: r.arenaMeta?.spectators?.size || 0,
        players: names.slice(0, 6),
      });
    }
    return out;
  },

  handleSpectateArena(client, targetRoomId = null) {
    if (!client || client.isDead) return;
    if (client.roomType === ROOM_TYPES.ARENA_3V3) {
      client.send({ type: 'sys_msg', category: 'combat', text: '👁️ You are already inside the 3v3 Arena!' });
      return;
    }
    const candidates = Array.from(this.rooms.values()).filter((r) => r.type === ROOM_TYPES.ARENA_3V3 && !r.matchEnded);
    const arenaRoom = targetRoomId
      ? candidates.find((r) => r.id === targetRoomId)
      : candidates[0];
    if (!arenaRoom) {
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: '🔮 [Scrying Pool] No active 3v3 Arena matches right now. Queue for 3v3 or check back soon!',
      });
      client.send({ type: 'arena_matches_list', matches: [] });
      return;
    }

    if (!client.preArenaSpot && client.roomType !== ROOM_TYPES.ARENA_3V3) {
      client.preArenaSpot = { roomId: client.roomId, roomType: client.roomType, x: client.x, y: client.y };
    }
    client.isSpectator = true;
    client.mountId = null;
    client.mountCast = null;
    arenaRoom.arenaMeta?.spectators?.add(client.id);
    this.joinRoom(client, arenaRoom.id, 'spectator', 0, 0, 'down');
    client.send({
      type: 'spectator_state',
      spectating: true,
      arenaRoomId: arenaRoom.id,
      matches: this.listActiveArenaMatches(),
    });
    client.send({
      type: 'sys_msg',
      category: 'zone',
      text: `🔮 [Scrying Pool] Now spectating live 3v3 Arena (${arenaRoom.id}). Type /leavespectate or click Leave Scrying anytime!`,
    });
  },

  handleLeaveSpectate(client) {
    if (!client || !client.isSpectator) return;
    const room = this.rooms.get(client.roomId);
    if (room?.arenaMeta?.spectators) room.arenaMeta.spectators.delete(client.id);
    client.isSpectator = false;
    const ret = client.preArenaSpot || { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 96 };
    client.preArenaSpot = null;
    this.joinRoom(client, ret.roomType || ROOM_TYPES.SANCTUARY_HUB, null, ret.x, ret.y, 'down');
    client.send({ type: 'spectator_state', spectating: false });
  },

  // ------------------------------------------
  // 2. Role Trinity LFG Dungeon Queue (1 Tank / 1 Healer / 3 DPS)
  // ------------------------------------------
  getLfgStatusPayload() {
    const counts = { tank: 0, healer: 0, dps: 0 };
    for (const q of this.lfgQueue || []) {
      if (q.role === TRINITY_ROLES.TANK) counts.tank++;
      else if (q.role === TRINITY_ROLES.HEALER) counts.healer++;
      else counts.dps++;
    }
    return {
      total: (this.lfgQueue || []).length,
      counts,
      entries: (this.lfgQueue || []).map((q) => ({
        accountId: q.accountId,
        name: q.name,
        classId: q.classId,
        role: q.role,
        dungeonType: q.dungeonType,
      })),
    };
  },

  broadcastLfgStatus() {
    const payload = { type: 'lfg_status', ...this.getLfgStatusPayload() };
    for (const q of this.lfgQueue || []) {
      const c = this.clients.get(q.accountId);
      if (c) {
        c.send({
          ...payload,
          queued: true,
          myRole: q.role,
          dungeonType: q.dungeonType,
        });
      }
    }
  },

  handleLfgJoin(client, msg = {}) {
    if (!client || client.isDead) return;
    if (!this.lfgQueue) this.lfgQueue = [];
    if (!this.lfgPendingChecks) this.lfgPendingChecks = new Map();

    if (client.roomType === ROOM_TYPES.ARENA_3V3) {
      client.send({ type: 'sys_msg', category: 'combat', text: 'Cannot queue LFG while inside 3v3 Arena!' });
      return;
    }

    const reqRole = msg.role && canClassPerformRole(client.classId, msg.role)
      ? msg.role
      : getDefaultRoleForClassId(client.classId);
    const dungeonType = ROOM_CONFIGS[msg.dungeonType]?.isCrypt
      ? msg.dungeonType
      : ROOM_TYPES.SOLARI_SUNKEN_VAULT;

    if (!isRoomUnlockedForEdition(dungeonType, client)) {
      client.send({
        type: 'trial_gate',
        feature: 'zone',
        roomType: dungeonType,
        zoneTitle: ROOM_CONFIGS[dungeonType]?.shortTitle || 'Mythic Crypt',
      });
      return;
    }

    this.lfgQueue = this.lfgQueue.filter((q) => q.accountId !== client.id);
    this.lfgQueue.push({
      accountId: client.id,
      name: client.displayName,
      classId: client.classId,
      faction: client.faction,
      role: reqRole,
      dungeonType,
      tier: Math.max(1, Math.min(10, Math.floor(Number(msg.tier) || 1))),
      queuedAt: Date.now(),
    });

    client.send({
      type: 'lfg_status',
      queued: true,
      myRole: reqRole,
      dungeonType,
      ...this.getLfgStatusPayload(),
    });
    this.tryProcessLfgQueue();
  },

  handleLfgLeave(client) {
    if (!client || !this.lfgQueue) return;
    this.lfgQueue = this.lfgQueue.filter((q) => q.accountId !== client.id);
    client.send({
      type: 'lfg_status',
      queued: false,
      myRole: getDefaultRoleForClassId(client.classId),
      ...this.getLfgStatusPayload(),
    });
    this.broadcastLfgStatus();
  },

  tryProcessLfgQueue() {
    if (!this.lfgQueue || this.lfgQueue.length < 5) return false;
    this.lfgQueue = this.lfgQueue.filter((q) => this.clients.has(q.accountId));
    const { matched, remaining } = matchTrinityPartyFromQueue(this.lfgQueue);
    if (!matched) return false;

    this.lfgQueue = remaining;
    const checkId = `lfg_rc_${crypto.randomUUID().slice(0, 6)}`;
    const leaderEntry = matched[0];
    const check = {
      id: checkId,
      members: matched,
      acceptedIds: new Set(),
      dungeonType: leaderEntry.dungeonType || ROOM_TYPES.SOLARI_SUNKEN_VAULT,
      tier: leaderEntry.tier || 1,
      expiresAt: Date.now() + 30000,
    };
    this.lfgPendingChecks.set(checkId, check);

    for (const m of matched) {
      const c = this.clients.get(m.accountId);
      if (c) {
        c.send({
          type: 'lfg_ready_check',
          checkId,
          dungeonType: check.dungeonType,
          dungeonName: ROOM_CONFIGS[check.dungeonType]?.shortTitle || 'Mythic Crypt',
          tier: check.tier,
          roster: matched.map((x) => ({ name: x.name, role: x.role, classId: x.classId })),
          expiresAt: check.expiresAt,
        });
      }
    }
    this.broadcastLfgStatus();
    return true;
  },

  handleLfgReadyResponse(client, msg = {}) {
    if (!client || !this.lfgPendingChecks) return;
    const check = this.lfgPendingChecks.get(String(msg.checkId || ''));
    if (!check) return;
    const inCheck = check.members.some((m) => m.accountId === client.id);
    if (!inCheck) return;

    if (!msg.accept) {
      this.lfgPendingChecks.delete(check.id);
      for (const m of check.members) {
        const c = this.clients.get(m.accountId);
        if (!c) continue;
        c.send({ type: 'lfg_ready_cancelled', checkId: check.id, declinedBy: client.displayName });
        if (m.accountId !== client.id) this.lfgQueue.push(m);
      }
      this.broadcastLfgStatus();
      return;
    }

    check.acceptedIds.add(client.id);
    const liveMembers = check.members.filter((m) => this.clients.has(m.accountId));
    if (check.acceptedIds.size < liveMembers.length) {
      for (const m of liveMembers) {
        this.clients.get(m.accountId)?.send({
          type: 'lfg_ready_progress',
          checkId: check.id,
          acceptedCount: check.acceptedIds.size,
          totalCount: liveMembers.length,
        });
      }
      return;
    }

    // All accepted! Form party & warp straight into a shared Mythic Crypt instance!
    this.lfgPendingChecks.delete(check.id);
    const instId = `${check.dungeonType}_lfg_${crypto.randomUUID().slice(0, 6)}`;
    const instRoom = this.createRoomInstance(check.dungeonType, instId);
    instRoom.isPrivateLfg = true;

    const leaderClient = this.clients.get(liveMembers[0].accountId);
    for (const m of liveMembers) {
      const c = this.clients.get(m.accountId);
      if (!c) continue;
      if (!c.preArenaSpot) c.preArenaSpot = { roomId: c.roomId, roomType: c.roomType, x: c.x, y: c.y };
      c.mountId = null;
      c.mountCast = null;
      c.send({ type: 'lfg_status', queued: false, ...this.getLfgStatusPayload() });
      c.send({ type: 'lfg_ready_complete', checkId: check.id, roomId: instRoom.id, roomType: check.dungeonType });
      this.joinRoom(c, instRoom.id, null, 0, ROOM_CONFIGS[check.dungeonType]?.spawnY ?? 120, 'up');
    }
    if (this.parties && liveMembers.length > 0 && typeof this.parties.formGroup === 'function') {
      const partyClients = liveMembers
        .map((m) => this.clients.get(m.accountId))
        .filter(Boolean);
      this.parties.formGroup(partyClients, 5);
    }
  },

  // ------------------------------------------
  // 3. 10-Player Apex Raid — "Fall of the Primeval Nexus"
  // ------------------------------------------
  getOrCreateRaidInstance(customId = 'primeval_nexus_raid_1') {
    let room = this.rooms.get(customId);
    if (!room) {
      room = this.createRoomInstance(ROOM_TYPES.PRIMEVAL_NEXUS_RAID, customId);
    }
    return room;
  },

  populatePrimevalRaidEntities(room) {
    room.raidState = {
      completed: false,
      startedAt: Date.now(),
    };
    room.entities.push({
      id: PRIMEVAL_RAID_CONFIG.bossId,
      name: PRIMEVAL_RAID_CONFIG.bossName,
      sub: '★ 10-Player Apex Raid Boss',
      type: 'mob',
      isBoss: true,
      isRaidBoss: true,
      spriteKey: 'abyssalArchitectBoss',
      x: 0,
      y: -140,
      origX: 0,
      origY: -140,
      hp: PRIMEVAL_RAID_CONFIG.bossMaxHp,
      maxHp: PRIMEVAL_RAID_CONFIG.bossMaxHp,
      damage: 18,
      baseDamage: 18,
      xpReward: 1500,
      speed: 44,
      baseSpeed: 44,
      aggroRange: 320,
      attackRange: 44,
      radius: 30,
      hitFlash: 0,
      phase: 1,
      immuneFaction: PRIMEVAL_RAID_CONFIG.attunementRotation[0],
      nextImmunityAt: Date.now() + 20000,
      pylonShield: false,
      enraged: false,
      dammers: new Set(),
      threatTable: {},
    });
  },

  handleJoinRaid(client) {
    if (!client || client.isDead) return;
    if (client.roomType === ROOM_TYPES.ARENA_3V3) {
      client.send({ type: 'sys_msg', category: 'combat', text: 'Cannot enter Raid while inside 3v3 Arena!' });
      return;
    }
    let raidRoom = null;
    for (const r of this.rooms.values()) {
      if (r.type === ROOM_TYPES.PRIMEVAL_NEXUS_RAID && r.players.size < PRIMEVAL_RAID_CONFIG.maxPlayers && !r.raidState?.completed) {
        raidRoom = r;
        break;
      }
    }
    if (!raidRoom) {
      const idx = 1 + Array.from(this.rooms.values()).filter((r) => r.type === ROOM_TYPES.PRIMEVAL_NEXUS_RAID).length;
      raidRoom = this.getOrCreateRaidInstance(`primeval_nexus_raid_${idx}`);
    }
    if (!client.preArenaSpot) {
      client.preArenaSpot = { roomId: client.roomId, roomType: client.roomType, x: client.x, y: client.y };
    }
    client.mountId = null;
    client.mountCast = null;
    this.joinRoom(client, raidRoom.id, null, 0, 460, 'up');
    client.send({
      type: 'sys_msg',
      category: 'zone',
      text: `🐉 [10-Player Raid] Entered ${PRIMEVAL_RAID_CONFIG.name}! Watch ${PRIMEVAL_RAID_CONFIG.bossName}'s rotating elemental immunity and destroy all 4 corner Pylons in Phase 2!`,
    });
  },

  tickRaidBossMechanics(room, boss, now = Date.now()) {
    if (!room || room.type !== ROOM_TYPES.PRIMEVAL_NEXUS_RAID || !boss || !boss.isRaidBoss || boss.isDying) return;
    const hpPct = (boss.hp / Math.max(1, boss.maxHp)) * 100;

    // Phase 1/2/3 rotating Elemental Immunity Attunement every 20s
    if (now >= (boss.nextImmunityAt || 0)) {
      boss.nextImmunityAt = now + 20000;
      boss.immuneFaction = getNextHarbingerImmunity(boss.immuneFaction);
      boss.sub = `★ Immune: ${boss.immuneFaction}${boss.pylonShield ? ' • 90% PYLON SHIELD' : ''}`;
      room.fxQueue.push({
        kind: 'fct',
        x: boss.x,
        y: boss.y - 26,
        text: `🛡️ ATTUNED: ${boss.immuneFaction.toUpperCase()} IMMUNE!`,
        color: '#e879f9',
        isCrit: true,
      });
    }

    // Phase 2 (<= 70% HP): Summon 4 Corner Leyline Siphon Pylons
    if (hpPct <= 70 && (boss.phase || 1) < 2) {
      boss.phase = 2;
      boss.pylonShield = true;
      boss.sub = `★ Immune: ${boss.immuneFaction} • 90% PYLON SHIELD`;
      for (const py of PRIMEVAL_RAID_CONFIG.pylonOffsets) {
        if (room.entities.some((e) => e.id === py.id && !e.isDying)) continue;
        room.entities.push({
          id: py.id,
          name: py.name,
          sub: 'Destroy Pylons to shatter Harbinger Shield!',
          type: 'mob',
          isPylon: true,
          spriteKey: 'nexusCyan',
          x: py.x,
          y: py.y,
          origX: py.x,
          origY: py.y,
          hp: 650,
          maxHp: 650,
          damage: 0,
          xpReward: 180,
          speed: 0,
          aggroRange: 0,
          attackRange: 0,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        });
      }
      this.broadcastToRoom(room, {
        type: 'chat',
        channel: 'world',
        sender: 'APEX RAID',
        text: `⚡ [Phase 2] ${boss.name} raised 4 Corner Leyline Siphon Pylons (-90% DMG taken until all 4 fall)!`,
      });
    }

    if (boss.pylonShield) {
      const alivePylons = room.entities.filter((e) => e.isPylon && !e.isDying && e.hp > 0).length;
      if (alivePylons === 0) {
        boss.pylonShield = false;
        boss.sub = `★ Immune: ${boss.immuneFaction}`;
        room.fxQueue.push({
          kind: 'fct',
          x: boss.x,
          y: boss.y - 24,
          text: '💥 PYLON SHIELD SHATTERED!',
          color: '#38bdf8',
          isCrit: true,
        });
      }
    }

    // Phase 3 (<= 30% HP): Supernova Enrage
    if (hpPct <= 30 && !boss.enraged) {
      boss.phase = 3;
      boss.enraged = true;
      boss.damage = Math.round((boss.baseDamage || 18) * 1.45);
      boss.speed = Math.round((boss.baseSpeed || 44) * 1.25);
      this.broadcastToRoom(room, {
        type: 'chat',
        channel: 'world',
        sender: 'APEX RAID',
        text: `🔥 [Phase 3: SUPERNOVA ENRAGE] ${boss.name} burns with cataclysmic fury!`,
      });
    }
  },

  completeRaidEncounter(room, boss, killerPlayer = null) {
    if (!room || room.raidState?.completed) return;
    room.raidState = room.raidState || {};
    room.raidState.completed = true;
    const now = Date.now();
    const lockoutUntil = now + PRIMEVAL_RAID_CONFIG.lockoutMs;

    for (const p of room.players.values()) {
      if (p.isSpectator) continue;
      p.prog.raidLockouts = p.prog.raidLockouts || {};
      const locked = Number(p.prog.raidLockouts[PRIMEVAL_RAID_CONFIG.id] || 0) > now;
      if (!locked) {
        p.prog.raidLockouts[PRIMEVAL_RAID_CONFIG.id] = lockoutUntil;
        this.awardPlayerXP(p, boss.xpReward || 1500, 'Fall of the Primeval Nexus Clear');
        const lootPool = PRIMEVAL_RAID_CONFIG.mythicLootIds;
        const awardedItemId = lootPool[Math.floor(Math.random() * lootPool.length)];
        const gotItem = this.accounts?.addItemToInventory(p.id, awardedItemId, 1);
        this.accounts?.addGold?.(p.id, 350);
        this.accounts?.recordCollectionUnlock?.(p.id, [awardedItemId]);
        this.accounts?.saveProgression(p.id, p.prog, { addKills: 1 });
        this.refreshClientFromAccount(p.id);
        p.send({
          type: 'raid_completed',
          raidId: PRIMEVAL_RAID_CONFIG.id,
          lootItemId: gotItem ? awardedItemId : null,
          lootItemName: gotItem ? (EQUIPMENT_CATALOG[awardedItemId]?.name || awardedItemId) : null,
          gold: 350,
          lockoutUntil,
        });
      } else {
        this.awardPlayerXP(p, 250, 'Primeval Nexus Assist');
        p.send({
          type: 'sys_msg',
          category: 'quest',
          text: '🐉 [Apex Raid] Weekly Raid Loot Lockout already claimed this week (+250 Assist XP awarded).',
        });
      }
    }
  },

  // ------------------------------------------
  // 4. Capturable Warzone Outposts & 30m Influence Cycle
  // ------------------------------------------
  captureWarzoneOutpost(room, outpostEnt, killerPlayer) {
    if (!room || !outpostEnt || !killerPlayer?.faction) return;
    const nextFaction = killerPlayer.faction;
    outpostEnt.faction = nextFaction;
    outpostEnt.spriteKey = FACTION_NEXUS_SPRITES[nextFaction] || 'nexusCyan';
    outpostEnt.sub = `300 HP ${nextFaction} Outpost Nexus [Captured]`;
    this.warzoneOutposts[outpostEnt.id] = nextFaction;

    const respawnOutpost = setTimeout(() => {
      if (!this.rooms.has(room.id)) return;
      outpostEnt.isDying = false;
      outpostEnt.deathAge = 0;
      outpostEnt.hp = outpostEnt.maxHp;
      outpostEnt.dammers = new Set();
      if (!room.entities.includes(outpostEnt)) room.entities.push(outpostEnt);
    }, 6000);
    if (typeof respawnOutpost?.unref === 'function') respawnOutpost.unref();

    const opBuff = computeOutpostRealmBuffs(this.warzoneOutposts, nextFaction);
    this.broadcastToAll({
      type: 'outpost_sync',
      outposts: { ...this.warzoneOutposts },
      nextCycleAt: this.warzoneNextCycleAt,
    });
    this.broadcastToAll({
      type: 'chat',
      channel: 'world',
      sender: 'WARZONE OUTPOST',
      text: `🏴 ${killerPlayer.displayName} (${nextFaction}) captured ${outpostEnt.name}! (${opBuff.controlledCount}/4 Outposts${opBuff.hasBuff ? ' — +15% XP & +10% Harvest Yield ACTIVE!' : ''})`,
    });
  },

  tickWarzoneInfluenceCycle(now = Date.now()) {
    if (!this.warzoneNextCycleAt) {
      this.warzoneNextCycleAt = now + WARZONE_INFLUENCE_CYCLE_MS;
      return;
    }
    if (now < this.warzoneNextCycleAt) return;
    this.warzoneNextCycleAt = now + WARZONE_INFLUENCE_CYCLE_MS;

    const dominantFactions = ['Solari', 'Umbri', 'Terra', 'Aether'].filter(
      (fac) => computeOutpostRealmBuffs(this.warzoneOutposts, fac).hasBuff
    );
    for (const p of this.clients.values()) {
      if (dominantFactions.includes(p.faction)) {
        this.awardPlayerXP(p, 120, 'Warzone Outpost Influence Cycle');
      }
    }
    this.broadcastToAll({
      type: 'outpost_sync',
      outposts: { ...this.warzoneOutposts },
      nextCycleAt: this.warzoneNextCycleAt,
      dominantFactions,
    });
  },

  getPlayerOutpostBuffs(player) {
    if (!player?.faction) return { xpMult: 1.0, yieldMult: 1.0, hasBuff: false, controlledCount: 0 };
    return computeOutpostRealmBuffs(this.warzoneOutposts, player.faction);
  },
};
