// ==========================================
// GlimmerFall Online 2D — Authoritative 20Hz Multi-Room Game Engine
// Supports:
//   - All 4 Canonical GlimmerFall TCG Factions & 8 Playable Archetypes
//   - All 35 Authentic TCG Rites & Flashes + Custom 8-Slot Loadouts
//   - Real-Time Equipment & Pixel Paperdoll Synchronization
//   - 6 Persistent World Zones (Sanctuary Hub, Nexus Warzone + 4 Faction Biomes)
//   - Scheduled Faction Nexus Siege Events (Shattered Nexus Shard + 4 Outpost Nexuses)
//   - 3v3 Ranked Nexus Arena Lobbies
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
} from '../shared/protocol.js';

import { SIEGE_INTERVAL_MS, nextThirtyMinBoundary } from './rooms/constants.js';
import { worldPopulationMethods } from './rooms/worldPopulation.js';
import { dungeonSubZonesMethods } from './rooms/dungeonSubZones.js';
import { dungeonEndgameAndSkillingMethods } from './rooms/dungeonEndgameAndSkilling.js';
import { arenaAndPacketsMethods } from './rooms/arenaAndPackets.js';
import { combatCastMethods } from './rooms/combatCast.js';
import { combatRitesAndDamageMethods } from './rooms/combatRitesAndDamage.js';
import { gatheringAndCraftingMethods } from './rooms/gatheringAndCrafting.js';
import { lootAndMythicMethods } from './rooms/lootAndMythic.js';
import { entityDeathAndProgressionMethods } from './rooms/entityDeathAndProgression.js';
import { socialAndTickMethods } from './rooms/socialAndTick.js';

export class RoomManager {
  constructor(opts = {}) {
    const config = (opts && (opts.accountsStore !== undefined || opts.partyManager !== undefined || opts.exchangeManager !== undefined))
      ? opts
      : { accountsStore: opts };
    const { accountsStore, partyManager, exchangeManager, tradeManager, duelManager } = config;
    this.accounts = accountsStore;
    this.parties = partyManager;
    this.exchange = exchangeManager;
    this.trades = tradeManager;
    this.duels = duelManager;
    this.clients = new Map(); // playerId -> PlayerSession
    this.rooms = new Map();   // roomId -> RoomInstance
    this.arenaQueue = [];     // Array of { leaderId, memberIds, queuedAt }

    // Create default persistent instances for Sanctuary, Warzone, 4 Faction Biomes, and 5 Explorable Sub-Zones/Ruins
    this.getOrCreatePublicRoom(ROOM_TYPES.SANCTUARY_HUB);
    this.getOrCreatePublicRoom(ROOM_TYPES.NEXUS_WARZONE);
    this.getOrCreatePublicRoom(ROOM_TYPES.SOLARI_CITADEL);
    this.getOrCreatePublicRoom(ROOM_TYPES.UMBRI_UNDERCITY);
    this.getOrCreatePublicRoom(ROOM_TYPES.TERRA_ORCHARD);
    this.getOrCreatePublicRoom(ROOM_TYPES.AETHER_SPIRE);
    this.getOrCreatePublicRoom(ROOM_TYPES.NEXUS_FORGOTTEN_RUINS);
    this.getOrCreatePublicRoom(ROOM_TYPES.SOLARI_SUNKEN_VAULT);
    this.getOrCreatePublicRoom(ROOM_TYPES.UMBRI_SHADOW_LABYRINTH);
    this.getOrCreatePublicRoom(ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY);
    this.getOrCreatePublicRoom(ROOM_TYPES.AETHER_FRACTURED_ARCHIVE);
    this.getOrCreatePublicRoom(ROOM_TYPES.STARFALL_CRATER);
    this.getOrCreatePublicRoom(ROOM_TYPES.ABYSSAL_RIFT);
    this.getOrCreatePublicRoom(ROOM_TYPES.CELESTIAL_ASCENT);
    this.getOrCreatePublicRoom(ROOM_TYPES.IRONWOOD_TIMBERLANDS);
    this.getOrCreatePublicRoom(ROOM_TYPES.CORAL_COAST);

    this.tickInterval = setInterval(() => this.tickAllRooms(), TICK_MS);
  }

  stop() {
    clearInterval(this.tickInterval);
  }

  getClientById(id) {
    return this.clients.get(id) || null;
  }

  findClientByName(query) {
    const lower = String(query || '').trim().toLowerCase();
    for (const c of this.clients.values()) {
      if (c.displayName.toLowerCase() === lower || (c.username && c.username.toLowerCase() === lower)) {
        return c;
      }
    }
    return null;
  }

  createRoomInstance(roomType, customId = null) {
    const cfg = ROOM_CONFIGS[roomType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    let index = 1;
    if (!customId) {
      while (this.rooms.has(`${roomType}_${index}`)) index++;
    }
    const id = customId || `${roomType}_${index}`;

    const room = {
      id,
      type: roomType,
      index,
      title: roomType === ROOM_TYPES.ARENA_3V3 ? '3v3 NEXUS ARENA' : `${cfg.shortTitle} #${index}`,
      biomeTheme: cfg.biomeTheme || 'sanctuary',
      bgm: cfg.bgm || 'sanctuary',
      maxPlayers: cfg.maxPlayers,
      halfW: cfg.halfW,
      halfH: cfg.halfH,
      pvp: cfg.pvp,
      edgeTransitions: cfg.edgeTransitions || null,
      players: new Map(),
      entities: [],
      allies: [],
      projectiles: [],
      groundZones: [],
      banners: [],
      loot: [],
      lootSeq: 0,
      fxQueue: [],
      createdAt: Date.now(),
      matchEnded: false,
      mythic: null,
      siege: roomType === ROOM_TYPES.NEXUS_WARZONE
        ? {
            active: false,
            nextSiegeAt: nextThirtyMinBoundary(),
            lastWinnerFaction: null,
            lastClaimedBy: null,
          }
        : null,
    };

    this.populateRoomEntities(room);
    this.populateGrandGlimmerFont(room);
    this.populateWorldSkillingNodes(room);
    this.applyEliteChampionsToRoom(room);
    if (room.type === ROOM_TYPES.NEXUS_WARZONE) {
      // Spawn opening Shattered Nexus Shard Siege so Warzone is immediately alive,
      // then follow the recurring 30-minute wall-clock siege schedule!
      this.spawnWarzoneSiegeShard(room, false);
    }
    this.rooms.set(id, room);
    return room;
  }

  spawnWarzoneSiegeShard(room, announce = true) {
    if (!room || room.type !== ROOM_TYPES.NEXUS_WARZONE) return;
    const existing = room.entities.find((e) => e.id === 'siege_shard' && !e.isDying);
    if (existing) return;

    // Also restore any fallen Outpost Nexuses for the new Siege clash
    for (const fac of ['Solari', 'Umbri', 'Terra', 'Aether']) {
      const outId = `outpost_${fac}`;
      let outEnt = room.entities.find((e) => e.id === outId);
      if (outEnt) {
        outEnt.hp = outEnt.maxHp;
        outEnt.isDying = false;
      }
    }

    room.entities.push({
      id: 'siege_shard',
      name: 'Shattered Nexus Shard',
      sub: '★ FACTION SIEGE OBJECTIVE (CLAIM FOR FACTION!)',
      type: 'siege_shard',
      isBoss: true,
      spriteKey: 'siegeShard',
      x: 0,
      y: -12,
      origX: 0,
      origY: -12,
      hp: 85,
      maxHp: 85,
      xpReward: 240,
      radius: 24,
      hitFlash: 0,
      dammers: new Set(),
    });

    if (room.siege) {
      room.siege.active = true;
      room.siege.nextSiegeAt = nextThirtyMinBoundary();
    }

    if (announce) {
      room.fxQueue.push({
        kind: 'fct',
        x: 0,
        y: -24,
        text: '⚡ SHATTERED NEXUS SHARD SPAWNED!',
        color: '#fde047',
        isCrit: true,
      });
      for (const c of this.clients.values()) {
        c.send({
          type: 'sys_msg',
          category: 'quest',
          text: '⚡ [NEXUS SIEGE EVENT] A Shattered Nexus Shard has materialized in the center of Nexus Warzone! All 4 Factions clash to claim it!',
        });
      }
    }
  }

  getOrCreatePublicRoom(roomType) {
    for (const room of this.rooms.values()) {
      if (room.type === roomType && room.players.size < room.maxPlayers) {
        return room;
      }
    }
    return this.createRoomInstance(roomType);
  }

  listPublicRooms() {
    const out = [];
    for (const r of this.rooms.values()) {
      out.push({
        id: r.id,
        type: r.type,
        title: r.title,
        biomeTheme: r.biomeTheme,
        players: r.players.size,
        maxPlayers: r.maxPlayers,
        pvp: r.pvp,
        siegeActive: Boolean(r.siege?.active),
      });
    }
    return out;
  }

  attachConnection(ws, account, preferredRoom = null, reqX = null, reqY = null, reqCharId = null) {
    const existing = this.clients.get(account.id);
    if (existing && existing.ws !== ws) {
      try {
        existing.isSuperseded = true;
        existing.send({
          type: 'session_superseded',
          reason: 'Your account was logged in from another window or device.',
        });
        existing.send({ type: 'sys_msg', category: 'system', text: '[System] Logged in from another window.' });
        if (existing.ws.readyState === 1) {
          existing.ws.close(4001, 'Logged in from another window');
        }
      } catch (_) {}
      this.removeClient(existing);
    }

    if (reqCharId && this.accounts.charactersByAccount.get(account.id)?.has(reqCharId)) {
      account.activeCharacterId = reqCharId;
    }
    this.accounts.ensureDefaultCharacter(account);
    this.accounts.syncAccountFromActiveChar(account);
    const ch = this.accounts.charactersByAccount.get(account.id)?.get(account.activeCharacterId);

    const prog = ch?.progression || account.progression || createDefaultProgression();
    const resolved = resolveFactionAndClass({
      faction: ch?.faction || account.faction,
      classId: ch?.classId || account.classId,
      loadout: ch?.loadout || account.loadout,
      orderTag: ch?.orderTag || account.orderTag,
    });
    const classId = resolved.classId;
    const faction = resolved.faction;
    const equipment = ch?.equipment || account.equipment || CLASSES_CATALOG[classId]?.defaultEquipment || {};
    const loadout = ch?.loadout || account.loadout || CLASSES_CATALOG[classId]?.defaultLoadout || {};
    const maxHp = calcMaxHp(prog, equipment, classId);
    const maxGlimmer = calcMaxGlimmer(prog, equipment, classId);

    const lastPos = ch?.lastPosition || account.lastPosition;
    const spawnRoom = (preferredRoom && preferredRoom !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[preferredRoom])
      ? preferredRoom
      : (lastPos?.roomType && lastPos.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[lastPos.roomType])
      ? lastPos.roomType
      : ROOM_TYPES.SANCTUARY_HUB;
    const spawnX = reqX !== null && Number.isFinite(reqX)
      ? Number(reqX)
      : (typeof lastPos?.x === 'number' && Number.isFinite(lastPos.x))
      ? lastPos.x
      : 0;
    const spawnY = reqY !== null && Number.isFinite(reqY)
      ? Number(reqY)
      : (typeof lastPos?.y === 'number' && Number.isFinite(lastPos.y))
      ? lastPos.y
      : 96;

    const initialHp = (typeof ch?.hp === 'number' && !ch.isDead && ch.hp > 0)
      ? Math.min(maxHp, Math.max(1, ch.hp))
      : (typeof account.hp === 'number' && !account.isDead && account.hp > 0)
      ? Math.min(maxHp, Math.max(1, account.hp))
      : maxHp;
    const initialGlimmer = (typeof ch?.solarCharge === 'number' && ch.solarCharge >= 0)
      ? Math.min(maxGlimmer, Math.max(0, ch.solarCharge))
      : (typeof account.solarCharge === 'number' && account.solarCharge >= 0)
      ? Math.min(maxGlimmer, Math.max(0, account.solarCharge))
      : 0;

    const client = {
      id: account.id,
      activeCharacterId: account.activeCharacterId,
      ws,
      username: account.username,
      displayName: ch?.name || account.displayName,
      isGuest: account.isGuest,
      tcgLinked: account.tcgLinked,
      tcgHandle: account.tcgHandle,
      faction,
      classId,
      loadout,
      equipment,
      inventory: ch?.inventory || account.inventory || [],
      bank: ch?.bank || account.bank || [],
      orderTag: ch?.orderTag || account.orderTag || 'SUN',
      orderName: ch?.orderName || account.orderName || 'Order of Dawn',
      orderColor: ch?.orderColor || account.orderColor || '#facc15',
      prog,
      questState: ch?.questState || account.questState || {},
      x: spawnX,
      y: spawnY,
      z: 0,
      dir: 'up',
      isMoving: false,
      hp: initialHp,
      maxHp,
      shield: 0,
      shieldTimer: 0,
      solarCharge: initialGlimmer,
      maxSolarCharge: maxGlimmer,
      isDead: false,
      respawnTimer: 0,
      weakenTimer: 0,
      slowTimer: 0,
      snareTimer: 0,
      freezeTimer: 0,
      stealthedTimer: 0,
      thornbarkTimer: 0,
      zenithTimer: 0,
      echoPrimed: false,
      skull: null,
      skullTimer: 0,
      pkCount: 0,
      activeTombstone: null,
      cooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      castState: null,
      team: null,
      roomId: null,
      roomType: null,
      portalCooldown: 0,
      portalQuestDone: false,
      speechBubble: null,
      activeEmote: null,
      send(packet) {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(packet));
        }
      },
    };

    this.clients.set(client.id, client);

    client.send({
      type: 'welcome',
      playerId: client.id,
      profile: this.accounts.toPublicProfile(account),
      tickRate: 20,
      rooms: this.listPublicRooms(),
    });

    this.joinRoom(client, spawnRoom, null, spawnX, spawnY);
    return client;
  }

  saveClientState(client) {
    if (!client || !client.id) return;
    const safeRoom = (client.roomType && client.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[client.roomType])
      ? client.roomType
      : (client.preArenaSpot?.roomType || ROOM_TYPES.SANCTUARY_HUB);
    const safeX = (client.roomType === ROOM_TYPES.ARENA_3V3 && client.preArenaSpot?.x != null)
      ? client.preArenaSpot.x
      : Math.round(Number(client.x) || 0);
    const safeY = (client.roomType === ROOM_TYPES.ARENA_3V3 && client.preArenaSpot?.y != null)
      ? client.preArenaSpot.y
      : Math.round(Number(client.y) || 0);

    this.accounts.saveCharacterState(client.id, client.activeCharacterId, {
      hp: client.hp,
      solarCharge: client.solarCharge,
      isDead: client.isDead,
      lastPosition: { roomType: safeRoom, x: safeX, y: safeY },
    });
  }

  refreshClientFromAccount(accountId) {
    const client = this.clients.get(accountId);
    const acc = this.accounts.accountsById.get(accountId);
    if (!client || !acc) return;
    this.saveClientState(client);
    this.accounts.ensureDefaultCharacter(acc);
    this.accounts.syncAccountFromActiveChar(acc);
    const ch = this.accounts.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    const resolved = resolveFactionAndClass({
      faction: ch?.faction || acc.faction,
      classId: ch?.classId || acc.classId,
      loadout: ch?.loadout || acc.loadout,
      orderTag: ch?.orderTag || acc.orderTag,
    });
    client.username = acc.username;
    client.displayName = ch?.name || acc.displayName;
    client.isGuest = acc.isGuest;
    client.tcgLinked = acc.tcgLinked;
    client.tcgHandle = acc.tcgHandle;
    client.faction = resolved.faction;
    client.classId = resolved.classId;
    client.loadout = ch?.loadout || acc.loadout || CLASSES_CATALOG[client.classId]?.defaultLoadout || {};
    client.equipment = ch?.equipment || acc.equipment || CLASSES_CATALOG[client.classId]?.defaultEquipment || {};
    client.inventory = ch?.inventory || acc.inventory || [];
    client.bank = ch?.bank || acc.bank || [];
    client.orderTag = ch?.orderTag || acc.orderTag || 'SUN';
    client.orderName = ch?.orderName || acc.orderName || 'Order of Dawn';
    client.orderColor = ch?.orderColor || acc.orderColor || '#facc15';
    client.prog = ch?.progression || acc.progression;
    client.questState = ch?.questState || acc.questState || {};
    client.maxHp = calcMaxHp(client.prog, client.equipment, client.classId);
    client.maxSolarCharge = calcMaxGlimmer(client.prog, client.equipment, client.classId);

    if (client.activeCharacterId !== acc.activeCharacterId) {
      client.activeCharacterId = acc.activeCharacterId;
      client.hp = (typeof ch?.hp === 'number' && !ch.isDead && ch.hp > 0) ? Math.min(client.maxHp, ch.hp) : client.maxHp;
      client.solarCharge = (typeof ch?.solarCharge === 'number' && ch.solarCharge >= 0) ? Math.min(client.maxSolarCharge, ch.solarCharge) : 0;
    } else {
      client.hp = Math.min(client.maxHp, client.hp);
      client.solarCharge = Math.min(client.maxSolarCharge, client.solarCharge);
      if (ch) ch.solarCharge = client.solarCharge;
      acc.solarCharge = client.solarCharge;
    }

    client.send({
      type: 'profile_updated',
      profile: this.accounts.toPublicProfile(acc),
    });
    this.parties?.syncPlayerVitals(client.id);
  }

  removeClient(client) {
    if (!client || client._removed) return;
    client._removed = true;
    this.saveClientState(client);
    this.leaveArenaQueue(client);
    this.parties?.leaveParty(client);
    this.trades?.onPlayerDisconnect(client.id);
    this.duels?.onPlayerDisconnect(client.id);
    if (client.roomId && this.rooms.has(client.roomId)) {
      const room = this.rooms.get(client.roomId);
      if (room.players.get(client.id) === client) {
        room.players.delete(client.id);
        this.broadcastToRoom(room, {
          type: 'player_left',
          playerId: client.id,
          playerName: client.displayName,
        });
        if (room.type === ROOM_TYPES.ARENA_3V3 && room.players.size === 0) {
          this.rooms.delete(room.id);
        }
      }
    }
    if (this.clients.get(client.id) === client) {
      this.clients.delete(client.id);
    }
  }

  joinRoom(client, targetRoomOrType, teamOverride = null, reqX = null, reqY = null, reqDir = null) {
    if (typeof teamOverride === 'number') {
      reqDir = reqY;
      reqY = reqX;
      reqX = teamOverride;
      teamOverride = null;
    }
    if (client.roomId && this.rooms.has(client.roomId)) {
      const prev = this.rooms.get(client.roomId);
      prev.players.delete(client.id);
      this.broadcastToRoom(prev, {
        type: 'player_left',
        playerId: client.id,
        playerName: client.displayName,
      });
      if (prev.type === ROOM_TYPES.ARENA_3V3 && prev.players.size === 0) {
        this.rooms.delete(prev.id);
      }
    }

    let room = this.rooms.get(targetRoomOrType);
    if (!room) {
      const rType = ROOM_CONFIGS[targetRoomOrType] ? targetRoomOrType : ROOM_TYPES.SANCTUARY_HUB;
      room = this.getOrCreatePublicRoom(rType);
    }

    const cfg = ROOM_CONFIGS[room.type] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    client.roomId = room.id;
    client.roomType = room.type;
    client.team = teamOverride;
    client.castState = null;
    client.portalCooldown = 1.0;
    client.roomEpoch = (client.roomEpoch || 0) + 1;

    const hasReqCoords = reqX !== null && reqY !== null && Number.isFinite(Number(reqX)) && Number.isFinite(Number(reqY));
    if (hasReqCoords) {
      // Seamless reconnect position preservation
      client.x = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, Number(reqX)));
      client.y = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, Number(reqY)));
      if (reqDir && ['up', 'down', 'left', 'right'].includes(reqDir)) {
        client.dir = reqDir;
      }
    } else if (room.type === ROOM_TYPES.ARENA_3V3 && teamOverride === 'red') {
      client.x = 0;
      client.y = -170;
      client.dir = 'down';
    } else {
      client.x = cfg.spawnX;
      client.y = cfg.spawnY;
      client.dir = 'up';
    }

    room.players.set(client.id, client);

    client.send({
      type: 'room_joined',
      roomId: room.id,
      roomType: room.type,
      epoch: client.roomEpoch,
      roomTitle: room.title,
      biomeTheme: room.biomeTheme,
      bgm: room.bgm,
      maxPlayers: room.maxPlayers,
      halfW: room.halfW,
      halfH: room.halfH,
      pvp: room.pvp,
      team: client.team,
      x: client.x,
      y: client.y,
      dir: client.dir,
      snapshot: this.buildSnapshot(room),
    });

    this.broadcastToRoom(
      room,
      {
        type: 'sys_msg',
        category: 'zone',
        text: `[${room.title}] ${FACTIONS_META[client.faction]?.icon || '☀️'} ${client.displayName} entered the realm.`,
      },
      client.id
    );

    this.parties?.syncPlayerVitals(client.id);
  }

  broadcastToRoom(room, packet, excludePlayerId = null) {
    const encoded = JSON.stringify(packet);
    for (const p of room.players.values()) {
      if (excludePlayerId && p.id === excludePlayerId) continue;
      if (p.ws.readyState === 1) {
        p.ws.send(encoded);
      }
    }
  }

  broadcastToAll(packet) {
    const encoded = JSON.stringify(packet);
    for (const p of this.clients.values()) {
      if (p.ws && p.ws.readyState === 1) {
        p.ws.send(encoded);
      }
    }
  }
}

Object.assign(
  RoomManager.prototype,
  worldPopulationMethods,
  dungeonSubZonesMethods,
  dungeonEndgameAndSkillingMethods,
  arenaAndPacketsMethods,
  combatCastMethods,
  combatRitesAndDamageMethods,
  gatheringAndCraftingMethods,
  lootAndMythicMethods,
  entityDeathAndProgressionMethods,
  socialAndTickMethods,
);
