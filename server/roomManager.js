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
  FOUNDER_ONLY_ROOMS,
  isRoomUnlockedForEdition,
  isFounderEdition,
  GRAND_FONT_POSITIONS,
  SURFACE_ROOM_TYPES,
  SURFACE_ZONE_PLACEMENT,
  SURFACE_WORLD_BOUNDS,
  isSurfaceRoomType,
  localToWorld,
  getRegionAtWorldPos,
  clampSurfacePosition,
  migrateLegacyPosition,
  isSurfaceWaterTile,
  isSurfaceFootprintInWater,
  normalizeExplorationState,
  revealFogOfWarAt,
  canRideMountInRoom,
  buildClientSnapshotPacket,
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
  WARZONE_INFLUENCE_CYCLE_MS,
  WARZONE_OUTPOST_DEFS,
  computeOutpostRealmBuffs,
  ensureActorFactionState,
  createSnapCache,
} from '../shared/protocol.js';

import { SIEGE_INTERVAL_MS, nextThirtyMinBoundary } from './rooms/constants.js';
import { worldPopulationMethods } from './rooms/worldPopulation.js';
import { dungeonSubZonesMethods } from './rooms/dungeonSubZones.js';
import { dungeonEndgameAndSkillingMethods } from './rooms/dungeonEndgameAndSkilling.js';
import { endgameSystemsMethods } from './rooms/endgameSystems.js';
import { familiarDuelsMethods } from './rooms/familiarDuels.js';
import { arenaAndPacketsMethods } from './rooms/arenaAndPackets.js';
import { combatCastMethods } from './rooms/combatCast.js';
import { combatRitesAndDamageMethods } from './rooms/combatRitesAndDamage.js';
import { gatheringAndCraftingMethods } from './rooms/gatheringAndCrafting.js';
import { lootAndMythicMethods } from './rooms/lootAndMythic.js';
import { entityDeathAndProgressionMethods } from './rooms/entityDeathAndProgression.js';
import { socialAndTickMethods } from './rooms/socialAndTick.js';
import { getOrderPresetForFaction } from './accountsStore.js';
import { TcgManager } from './tcgManager.js';

export class RoomManager {
  constructor(opts = {}) {
    const config = (opts && (opts.accountsStore !== undefined || opts.partyManager !== undefined || opts.exchangeManager !== undefined || opts.guildManager !== undefined))
      ? opts
      : { accountsStore: opts };
    const { accountsStore, partyManager, exchangeManager, tradeManager, duelManager, tcgManager, guildManager } = config;
    this.accounts = accountsStore;
    this.parties = partyManager;
    this.exchange = exchangeManager;
    this.trades = tradeManager;
    this.duels = duelManager;
    this.guilds = guildManager || null;
    this.tcg = tcgManager || new TcgManager({
      getClientById: (id) => this.getClientById(id),
      findClientByName: (name) => this.findClientByName(name),
      getRoomById: (id) => this.rooms.get(id),
      broadcastToRoom: (room, msg) => this.broadcastToRoom(room, msg),
    });
    this.clients = new Map(); // playerId -> PlayerSession
    this.rooms = new Map();   // roomId -> RoomInstance
    this.arenaQueue = [];     // Array of { leaderId, memberIds, queuedAt }
    this.lfgQueue = [];
    this.lfgPendingChecks = new Map();
    this.familiarDuels = new Map();
    this.famDuelInvites = new Map();
    this.warzoneOutposts = Object.fromEntries(WARZONE_OUTPOST_DEFS.map((op) => [op.id, op.defaultFaction]));
    this.warzoneNextCycleAt = Date.now() + WARZONE_INFLUENCE_CYCLE_MS;
    this.tickSamples = [];    // Rolling tick durations (ms) for /api/metrics

    // Path B: Build unified continuous Surface Overworld plus standalone entered/instanced realms
    this.getOrCreateOverworldRoom();
    this.getOrCreatePublicRoom(ROOM_TYPES.SOLARI_SUNKEN_VAULT);
    this.getOrCreatePublicRoom(ROOM_TYPES.UMBRI_SHADOW_LABYRINTH);
    this.getOrCreatePublicRoom(ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY);
    this.getOrCreatePublicRoom(ROOM_TYPES.AETHER_FRACTURED_ARCHIVE);
    this.getOrCreatePublicRoom(ROOM_TYPES.LUMINOUS_CAVERN);

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
      isInterior: Boolean(cfg.isInterior),
      exitDestination: cfg.exitDestination || null,
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
    this.ensureWorldEventStrayEcho?.(room, Date.now());
    if (room.type === ROOM_TYPES.NEXUS_WARZONE) {
      // Spawn opening Shattered Nexus Shard Siege so Warzone is immediately alive,
      // then follow the recurring 30-minute wall-clock siege schedule!
      this.spawnWarzoneSiegeShard(room, false);
    }
    this.rooms.set(id, room);
    return room;
  }

  spawnWarzoneSiegeShard(room, announce = true, origin = null) {
    if (!room || (room.type !== ROOM_TYPES.NEXUS_WARZONE && !room.isOverworld)) return;
    const existing = room.entities.find((e) => e.id === 'siege_shard' && !e.isDying);
    if (existing) return;

    const ox = origin?.originX ?? (room.isOverworld ? SURFACE_ZONE_PLACEMENT[ROOM_TYPES.NEXUS_WARZONE].originX : 0);
    const oy = origin?.originY ?? (room.isOverworld ? SURFACE_ZONE_PLACEMENT[ROOM_TYPES.NEXUS_WARZONE].originY : 0);

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
      zoneType: ROOM_TYPES.NEXUS_WARZONE,
      name: 'Shattered Nexus Shard',
      sub: '★ FACTION SIEGE OBJECTIVE (CLAIM FOR FACTION!)',
      type: 'siege_shard',
      isBoss: true,
      spriteKey: 'siegeShard',
      x: ox,
      y: oy - 12,
      origX: ox,
      origY: oy - 12,
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
        x: ox,
        y: oy - 24,
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

  getOrCreateOverworldRoom() {
    if (this.rooms.has('overworld_1')) {
      return this.rooms.get('overworld_1');
    }
    const overworld = {
      id: 'overworld_1',
      type: 'overworld',
      index: 1,
      isOverworld: true,
      title: 'GLIMMERFALL CONTINENT (SEAMLESS OVERWORLD)',
      biomeTheme: 'sanctuary',
      bgm: 'sanctuary',
      maxPlayers: 250,
      halfW: SURFACE_WORLD_BOUNDS.halfW,
      halfH: SURFACE_WORLD_BOUNDS.halfH,
      pvp: false,
      isInterior: false,
      exitDestination: null,
      edgeTransitions: null,
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
      siege: {
        active: false,
        nextSiegeAt: nextThirtyMinBoundary(),
        lastWinnerFaction: null,
        lastClaimedBy: null,
      },
    };

    for (const zoneType of SURFACE_ROOM_TYPES) {
      const cfg = ROOM_CONFIGS[zoneType];
      const place = SURFACE_ZONE_PLACEMENT[zoneType];
      if (!cfg || !place) continue;
      const stage = {
        id: `stage_${zoneType}`,
        type: zoneType,
        halfW: cfg.halfW,
        halfH: cfg.halfH,
        pvp: cfg.pvp,
        entities: [],
        allies: [],
        projectiles: [],
        groundZones: [],
        loot: [],
        fxQueue: [],
        siege: zoneType === ROOM_TYPES.NEXUS_WARZONE ? overworld.siege : null,
      };
      this.populateRoomEntities(stage);
      this.populateGrandGlimmerFont(stage);
      this.populateWorldSkillingNodes(stage);
      this.applyEliteChampionsToRoom(stage);
      if (zoneType === ROOM_TYPES.NEXUS_WARZONE) {
        this.spawnWarzoneSiegeShard(stage, false);
      }
      for (const ent of stage.entities) {
        ent.zoneType = zoneType;
        if (Number.isFinite(ent.x)) ent.x += place.originX;
        if (Number.isFinite(ent.y)) ent.y += place.originY;
        if (Number.isFinite(ent.origX)) ent.origX += place.originX;
        if (Number.isFinite(ent.origY)) ent.origY += place.originY;
        overworld.entities.push(ent);
      }
    }

    this.rooms.set(overworld.id, overworld);
    return overworld;
  }

  createSurfaceZoneView(overworld, zoneType) {
    const cfg = ROOM_CONFIGS[zoneType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    const entitiesProxy = new Proxy([], {
      get: (_target, prop) => {
        const filtered = overworld.entities.filter((e) => e.zoneType === zoneType);
        if (prop === 'push') {
          return (...items) => {
            for (const it of items) {
              if (it && typeof it === 'object' && !it.zoneType) it.zoneType = zoneType;
              overworld.entities.push(it);
            }
            return overworld.entities.length;
          };
        }
        if (prop === 'splice') {
          return (start, deleteCount, ...items) => {
            const targetEnts = filtered.slice(start, deleteCount === undefined ? undefined : start + deleteCount);
            for (const removed of targetEnts) {
              const idx = overworld.entities.indexOf(removed);
              if (idx !== -1) overworld.entities.splice(idx, 1);
            }
            for (const it of items) {
              if (it && typeof it === 'object' && !it.zoneType) it.zoneType = zoneType;
              overworld.entities.push(it);
            }
            return targetEnts;
          };
        }
        const val = Reflect.get(filtered, prop);
        return typeof val === 'function' ? val.bind(filtered) : val;
      },
    });

    return {
      id: zoneType,
      type: zoneType,
      _overworldRoom: overworld,
      isOverworld: true,
      title: cfg.shortTitle,
      biomeTheme: cfg.biomeTheme || 'sanctuary',
      bgm: cfg.bgm || 'sanctuary',
      maxPlayers: overworld.maxPlayers,
      halfW: cfg.halfW,
      halfH: cfg.halfH,
      pvp: Boolean(cfg.pvp),
      isInterior: false,
      exitDestination: null,
      edgeTransitions: cfg.edgeTransitions || null,
      get players() { return overworld.players; },
      get entities() { return entitiesProxy; },
      set entities(nextList) {
        const replacement = Array.isArray(nextList) ? nextList : [];
        for (let i = overworld.entities.length - 1; i >= 0; i--) {
          if (overworld.entities[i]?.zoneType === zoneType) {
            overworld.entities.splice(i, 1);
          }
        }
        for (const it of replacement) {
          if (it && typeof it === 'object' && !it.zoneType) it.zoneType = zoneType;
          overworld.entities.push(it);
        }
      },
      get allies() { return overworld.allies; },
      get projectiles() { return overworld.projectiles; },
      get groundZones() { return overworld.groundZones; },
      get banners() { return overworld.banners; },
      get loot() { return overworld.loot; },
      set loot(v) { overworld.loot = v; },
      get lootSeq() { return overworld.lootSeq; },
      set lootSeq(v) { overworld.lootSeq = v; },
      get fxQueue() { return overworld.fxQueue; },
      get siege() { return overworld.siege; },
    };
  }

  getRoomByPlayerOrId(roomOrId) {
    if (!roomOrId) return null;
    if (this.rooms.has(roomOrId)) return this.rooms.get(roomOrId);
    if (isSurfaceRoomType(roomOrId)) return this.getOrCreateOverworldRoom();
    return null;
  }

  getOrCreatePublicRoom(roomType) {
    if (isSurfaceRoomType(roomType)) {
      const overworld = this.getOrCreateOverworldRoom();
      return this.createSurfaceZoneView(overworld, roomType);
    }
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
    const migratedLast = lastPos ? migrateLegacyPosition(lastPos) : null;
    const spawnRoom = (preferredRoom && preferredRoom !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[preferredRoom])
      ? preferredRoom
      : (migratedLast?.roomType && migratedLast.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[migratedLast.roomType])
      ? migratedLast.roomType
      : ROOM_TYPES.SANCTUARY_HUB;
    const cfgDefault = ROOM_CONFIGS[spawnRoom] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    const hasValidReqCoords = reqX !== null && reqX !== '' && reqY !== null && reqY !== '' && Number.isFinite(Number(reqX)) && Number.isFinite(Number(reqY));
    const canUseLastPosCoords = (!preferredRoom || preferredRoom === migratedLast?.roomType)
      && typeof migratedLast?.x === 'number' && Number.isFinite(migratedLast.x)
      && typeof migratedLast?.y === 'number' && Number.isFinite(migratedLast.y);
    let spawnX = hasValidReqCoords
      ? Number(reqX)
      : canUseLastPosCoords
      ? migratedLast.x
      : (cfgDefault?.spawnX ?? 0);
    let spawnY = hasValidReqCoords
      ? Number(reqY)
      : canUseLastPosCoords
      ? migratedLast.y
      : (cfgDefault?.spawnY ?? 96);
    if (!hasValidReqCoords && !canUseLastPosCoords && isSurfaceRoomType(spawnRoom)) {
      const worldSpawn = localToWorld(spawnRoom, spawnX, spawnY);
      spawnX = worldSpawn.wx;
      spawnY = worldSpawn.wy;
    }

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

    const editionTier = isFounderEdition({
      editionTier: ch?.statsMeta?.editionTier || account.statsMeta?.editionTier,
      redeemedSerialKey: ch?.statsMeta?.redeemedSerialKey || account.statsMeta?.redeemedSerialKey,
      tcgLinked: account.tcgLinked,
    })
      ? 'founder'
      : 'free';

    const client = {
      id: account.id,
      activeCharacterId: account.activeCharacterId,
      ws,
      username: account.username,
      displayName: ch?.name || account.displayName,
      isGuest: account.isGuest,
      tcgLinked: account.tcgLinked,
      tcgHandle: account.tcgHandle,
      editionTier,
      faction,
      classId,
      loadout,
      equipment,
      inventory: ch?.inventory || account.inventory || [],
      bank: ch?.bank || account.bank || [],
      orderTag: ch?.orderTag || account.orderTag || getOrderPresetForFaction(faction, ch?.orderTag || account.orderTag).tag,
      orderName: ch?.orderName || account.orderName || getOrderPresetForFaction(faction, ch?.orderTag || account.orderTag).name,
      orderColor: ch?.orderColor || account.orderColor || getOrderPresetForFaction(faction, ch?.orderTag || account.orderTag).color,
      prog,
      questState: ch?.questState || account.questState || {},
      mountId: null,
      mountCast: null,
      _lastFogRevealX: spawnX,
      _lastFogRevealY: spawnY,
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
      duskMarks: 0,
      rootguardStacks: 0,
      astralResonance: 0,
      flashComboCount: 0,
      chronoSnapReady: false,
      echoPrimed: false,
      slashTimer: 0,
      bastionBannerTimer: 0,
      solarisDomeTimer: 0,
      anchorState: null,
      anchorTimer: 0,
      skull: null,
      skullTimer: 0,
      pkCount: 0,
      activeTombstone: null,
      cooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      gcdTimer: 0,
      gcdTotal: 0,
      queuedAbility: null,
      castState: null,
      team: null,
      roomId: null,
      roomType: null,
      portalCooldown: 0,
      lastMoveSeq: 0,
      posOverrideSeq: 0,
      lastMovePacketAt: 0,
      portalQuestDone: false,
      speechBubble: null,
      activeEmote: null,
      activeDevotions: [],
      _snapCache: createSnapCache(),
      send(packet) {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(packet));
        }
      },
    };

    ensureActorFactionState(client, faction);
    this.clients.set(client.id, client);

    client.send({
      type: 'welcome',
      playerId: client.id,
      profile: this.accounts.toPublicProfile(account),
      tickRate: 20,
      rooms: this.listPublicRooms(),
    });

    this.joinRoom(client, spawnRoom, null, spawnX, spawnY);
    client.send({
      type: 'outpost_sync',
      outposts: { ...this.warzoneOutposts },
      nextCycleAt: this.warzoneNextCycleAt,
    });
    return client;
  }

  saveClientState(client, options = {}) {
    if (!client || !client.id || typeof this.accounts?.saveCharacterState !== 'function') return;
    const safeRoom = (client.roomType && client.roomType !== ROOM_TYPES.ARENA_3V3 && ROOM_CONFIGS[client.roomType])
      ? client.roomType
      : (client.preArenaSpot?.roomType || ROOM_TYPES.SANCTUARY_HUB);
    const safeX = (client.roomType === ROOM_TYPES.ARENA_3V3 && client.preArenaSpot?.x != null)
      ? client.preArenaSpot.x
      : Math.round(Number(client.x) || 0);
    const safeY = (client.roomType === ROOM_TYPES.ARENA_3V3 && client.preArenaSpot?.y != null)
      ? client.preArenaSpot.y
      : Math.round(Number(client.y) || 0);

    const lastPosition = isSurfaceRoomType(safeRoom)
      ? { roomType: safeRoom, x: safeX, y: safeY, worldX: safeX, worldY: safeY }
      : { roomType: safeRoom, x: safeX, y: safeY };

    this.accounts.saveCharacterState(client.id, client.activeCharacterId, {
      hp: client.hp,
      solarCharge: client.solarCharge,
      isDead: client.isDead,
      lastPosition,
      immediate: options.immediate !== false,
    });
    client._lastSavedRoomType = safeRoom;
    client._lastSavedX = safeX;
    client._lastSavedY = safeY;
    client._lastSavedAt = Date.now();
  }

  refreshClientFromAccount(accountId) {
    const client = this.clients.get(accountId);
    const acc = this.accounts.accountsById.get(accountId);
    if (!client || !acc) return;
    if (client.activeCharacterId && acc.activeCharacterId && client.activeCharacterId !== acc.activeCharacterId) {
      this.saveClientState(client);
    }
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
    client.editionTier = isFounderEdition({
      editionTier: ch?.statsMeta?.editionTier || acc.statsMeta?.editionTier,
      redeemedSerialKey: ch?.statsMeta?.redeemedSerialKey || acc.statsMeta?.redeemedSerialKey,
      tcgLinked: acc.tcgLinked,
    })
      ? 'founder'
      : 'free';
    client.faction = resolved.faction;
    client.classId = resolved.classId;
    client.loadout = ch?.loadout || acc.loadout || CLASSES_CATALOG[client.classId]?.defaultLoadout || {};
    client.equipment = ch?.equipment || acc.equipment || CLASSES_CATALOG[client.classId]?.defaultEquipment || {};
    client.inventory = ch?.inventory || acc.inventory || [];
    client.bank = ch?.bank || acc.bank || [];
    const preset = getOrderPresetForFaction(resolved.faction, ch?.orderTag || acc.orderTag);
    client.orderTag = ch?.orderTag || acc.orderTag || preset.tag;
    client.orderName = ch?.orderName || acc.orderName || preset.name;
    client.orderColor = ch?.orderColor || acc.orderColor || preset.color;
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

    const requestedZoneType = isSurfaceRoomType(targetRoomOrType)
      ? targetRoomOrType
      : (targetRoomOrType === 'overworld_1' || targetRoomOrType === 'overworld')
      ? (client.roomType && isSurfaceRoomType(client.roomType) ? client.roomType : ROOM_TYPES.SANCTUARY_HUB)
      : null;

    let room = requestedZoneType
      ? this.getOrCreateOverworldRoom()
      : this.rooms.get(targetRoomOrType);
    if (!room) {
      const rType = ROOM_CONFIGS[targetRoomOrType] ? targetRoomOrType : ROOM_TYPES.SANCTUARY_HUB;
      if (isSurfaceRoomType(rType)) {
        room = this.getOrCreateOverworldRoom();
      } else {
        room = this.getOrCreatePublicRoom(rType);
      }
    }

    const effectiveZoneType = room.isOverworld
      ? (requestedZoneType || ROOM_TYPES.SANCTUARY_HUB)
      : room.type;

    if (!isRoomUnlockedForEdition(effectiveZoneType, client)) {
      const lockedCfg = ROOM_CONFIGS[effectiveZoneType];
      const zoneTitle = lockedCfg?.shortTitle || room.title || 'Endgame Realm';
      client.portalCooldown = 1.6;
      client.send?.({
        type: 'sys_msg',
        category: 'combat',
        text: `🔒 [${zoneTitle}] requires Founder's Edition (€6.99). Keep playing up to Lv. 10 in Starter Realms, or redeem a GF-XXXX-XXXX-XXXX Serial Key!`,
      });
      client.send?.({
        type: 'trial_gate',
        feature: 'zone',
        roomType: effectiveZoneType,
        zoneTitle,
      });
      if (client.roomId && this.rooms.has(client.roomId)) {
        return;
      }
      room = this.getOrCreateOverworldRoom();
    }

    const safeZoneType = (!isRoomUnlockedForEdition(effectiveZoneType, client) && !client.roomId)
      ? ROOM_TYPES.SANCTUARY_HUB
      : effectiveZoneType;

    const prevRoomId = client.roomId;
    if (prevRoomId && this.rooms.has(prevRoomId) && prevRoomId !== room.id) {
      const prev = this.rooms.get(prevRoomId);
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

    const cfg = ROOM_CONFIGS[safeZoneType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    client.roomId = room.id;
    client.isOverworld = Boolean(room.isOverworld);
    client.team = teamOverride;
    client.castState = null;
    client.portalCooldown = 1.0;
    client.roomEpoch = (client.roomEpoch || 0) + 1;
    client._snapCache = createSnapCache();

    const hasReqCoords = reqX !== null && reqY !== null && Number.isFinite(Number(reqX)) && Number.isFinite(Number(reqY));
    if (room.isOverworld) {
      if (hasReqCoords) {
        const rawX = Number(reqX);
        const rawY = Number(reqY);
        const migrated = migrateLegacyPosition({
          roomType: safeZoneType,
          x: rawX,
          y: rawY,
          worldX: (safeZoneType === ROOM_TYPES.SANCTUARY_HUB || Math.abs(rawX) > cfg.halfW || Math.abs(rawY) > cfg.halfH) ? rawX : undefined,
          worldY: (safeZoneType === ROOM_TYPES.SANCTUARY_HUB || Math.abs(rawX) > cfg.halfW || Math.abs(rawY) > cfg.halfH) ? rawY : undefined,
        });
        const clamped = clampSurfacePosition(migrated.worldX, migrated.worldY, migrated.worldX, migrated.worldY, {
          founderRooms: FOUNDER_ONLY_ROOMS,
          founderChecker: (rt) => isRoomUnlockedForEdition(rt, client),
          isWaterAt: (wx, wy) => isSurfaceFootprintInWater(wx, wy, 4, 3),
        });
        client.x = clamped.x;
        client.y = clamped.y;
      } else {
        const wp = localToWorld(safeZoneType, cfg.spawnX, cfg.spawnY);
        client.x = wp.wx;
        client.y = wp.wy;
      }
      if (reqDir && ['up', 'down', 'left', 'right'].includes(reqDir)) {
        client.dir = reqDir;
      } else {
        client.dir = client.dir || 'up';
      }
      client.roomType = getRegionAtWorldPos(client.x, client.y, safeZoneType).roomType;
    } else {
      client.roomType = room.type;
      if (hasReqCoords) {
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
        client.dir = client.dir || 'up';
      }
    }

    client.posOverrideSeq = (client.posOverrideSeq || 0) + 1;
    if (!canRideMountInRoom(client.roomType)) {
      client.mountId = null;
      client.mountCast = null;
    }
    client.prog.exploration = normalizeExplorationState(client.prog?.exploration, client.faction);
    const fogInit = revealFogOfWarAt(client.prog.exploration, client.x, client.y, client.roomType, 1, client.faction);
    client.prog.exploration = fogInit.state;
    client._lastFogRevealX = client.x;
    client._lastFogRevealY = client.y;
    if (fogInit.changed) {
      this.accounts.saveProgression(client.id, client.prog);
    }
    room.players.set(client.id, client);
    this.saveClientState(client, { immediate: true });

    const activeCfg = ROOM_CONFIGS[client.roomType] || cfg;
    const initSnapshot = buildClientSnapshotPacket({
      roomId: room.id,
      onlineTotal: this.clients.size,
      fullSnapshot: this.buildSnapshot(room),
      viewer: client,
      clientSnapCache: createSnapCache(),
    });

    client.send({
      type: 'room_joined',
      roomId: room.id,
      isOverworld: Boolean(room.isOverworld),
      roomType: client.roomType,
      epoch: client.roomEpoch,
      roomTitle: activeCfg?.shortTitle || room.title,
      biomeTheme: activeCfg?.biomeTheme || room.biomeTheme,
      bgm: activeCfg?.bgm || room.bgm,
      maxPlayers: room.maxPlayers,
      halfW: room.halfW,
      halfH: room.halfH,
      pvp: Boolean(activeCfg?.pvp),
      team: client.team,
      x: client.x,
      y: client.y,
      dir: client.dir,
      lastMoveSeq: client.lastMoveSeq || 0,
      posOverrideSeq: client.posOverrideSeq,
      snapshot: initSnapshot,
    });
    client.send({
      type: 'exploration_sync',
      exploration: client.prog.exploration,
      mountId: client.mountId || null,
    });

    if (prevRoomId !== room.id) {
      this.broadcastToRoom(
        room,
        {
          type: 'sys_msg',
          category: 'zone',
          text: `[${activeCfg?.shortTitle || room.title}] ${FACTIONS_META[client.faction]?.icon || '☀️'} ${client.displayName} entered the realm.`,
        },
        client.id
      );
    }

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

  getTickStats() {
    const samples = this.tickSamples || [];
    if (samples.length === 0) {
      return { avgMs: 0, p95Ms: 0, maxMs: 0, sampleCount: 0 };
    }
    let sum = 0;
    let maxMs = 0;
    for (const s of samples) {
      sum += s;
      if (s > maxMs) maxMs = s;
    }
    const sorted = samples.slice().sort((a, b) => a - b);
    const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    return {
      avgMs: Number((sum / samples.length).toFixed(2)),
      p95Ms: Number(sorted[p95Idx].toFixed(2)),
      maxMs: Number(maxMs.toFixed(2)),
      sampleCount: samples.length,
    };
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
  endgameSystemsMethods,
  familiarDuelsMethods,
);
