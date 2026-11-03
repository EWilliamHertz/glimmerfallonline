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
  ROOM_TYPES,
  ROOM_CONFIGS,
  FACTIONS_META,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  ABILITIES_CATALOG,
  EMOTES_CATALOG,
  getSlotAbilitySpec,
  getEffectiveStats,
  createDefaultProgression,
  xpForNextLevel,
  calcMaxHp,
  calcMaxGlimmer,
  calcCritChance,
  calcCdMult,
} from '../shared/protocol.js';

const SIEGE_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes per roadmap spec
const ARENA_WAIT_MS = 45 * 1000; // Open 3v3 lobby waits this long before computer entities fill empty slots

function nextThirtyMinBoundary(now = Date.now()) {
  const next = Math.ceil((now + 5000) / SIEGE_INTERVAL_MS) * SIEGE_INTERVAL_MS;
  return next - now < 45000 ? next + SIEGE_INTERVAL_MS : next;
}

export class RoomManager {
  constructor({ accountsStore, partyManager }) {
    this.accounts = accountsStore;
    this.parties = partyManager;
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

  populateRoomEntities(room) {
    if (room.type === ROOM_TYPES.SANCTUARY_HUB) {
      room.entities.push(
        {
          id: 'dummy_1',
          name: 'Sanctuary Dummy',
          sub: 'Lv.1 Awakening Training Post',
          type: 'dummy',
          spriteKey: 'dummy',
          x: 0,
          y: 12,
          origX: 0,
          origY: 12,
          hp: 30,
          maxHp: 30,
          xpReward: 30,
          radius: 14,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'tut_stalker_1',
          name: 'Void Stalker Scout',
          sub: 'Lv.1 Umbri Minion (Training)',
          type: 'mob',
          spriteKey: 'voidStalker',
          x: -85,
          y: -45,
          origX: -85,
          origY: -45,
          hp: 20,
          maxHp: 20,
          damage: 3,
          xpReward: 35,
          speed: 48,
          aggroRange: 105,
          attackRange: 26,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'tut_stalker_2',
          name: 'Void Stalker Raider',
          sub: 'Lv.2 Umbri Minion (Training)',
          type: 'mob',
          spriteKey: 'voidStalker',
          x: 85,
          y: -45,
          origX: 85,
          origY: -45,
          hp: 25,
          maxHp: 25,
          damage: 3,
          xpReward: 45,
          speed: 50,
          aggroRange: 105,
          attackRange: 26,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'tut_behemoth',
          name: 'Granite Bouldergut',
          sub: '★ Lv.3 Terra Training Golem',
          type: 'mob',
          isBoss: true,
          spriteKey: 'graniteBoss',
          x: 0,
          y: -90,
          origX: 0,
          origY: -90,
          hp: 45,
          maxHp: 45,
          damage: 5,
          xpReward: 85,
          speed: 36,
          aggroRange: 115,
          attackRange: 32,
          radius: 20,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'tut_font',
          name: 'Awakening Glimmer Node',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -88,
          y: 22,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'tut_font_2',
          name: 'East Glimmer Node',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: 88,
          y: 22,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'portal_main',
          name: 'Nexus Warzone Rift',
          sub: 'Step In -> Nexus Warzone (PvPvE)',
          type: 'portal',
          targetRoom: ROOM_TYPES.NEXUS_WARZONE,
          spriteKey: 'portal',
          x: 0,
          y: -158,
          hp: 1,
          maxHp: 1,
          radius: 20,
          hitFlash: 0,
        },
        {
          id: 'portal_solari',
          name: 'Golden Citadel Waygate',
          sub: '☀️ Solari Biome Dungeon',
          type: 'portal',
          targetRoom: ROOM_TYPES.SOLARI_CITADEL,
          spriteKey: 'portal',
          x: -185,
          y: -95,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_umbri',
          name: 'Duskveil Bog Waygate',
          sub: '🌑 Umbri Biome Dungeon',
          type: 'portal',
          targetRoom: ROOM_TYPES.UMBRI_UNDERCITY,
          spriteKey: 'portal',
          x: 185,
          y: -95,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_terra',
          name: 'Glimmer Orchard Waygate',
          sub: '🌿 Terra Biome Dungeon',
          type: 'portal',
          targetRoom: ROOM_TYPES.TERRA_ORCHARD,
          spriteKey: 'portal',
          x: -185,
          y: 95,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_aether',
          name: 'Mirrorgate Spire Waygate',
          sub: '🔮 Aether Biome Dungeon',
          type: 'portal',
          targetRoom: ROOM_TYPES.AETHER_SPIRE,
          spriteKey: 'portal',
          x: 185,
          y: 95,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_ruins',
          name: 'First Nexus Ruins Gate',
          sub: '🏛️ Forgotten Ruins',
          type: 'portal',
          targetRoom: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
          spriteKey: 'portal',
          x: 0,
          y: 195,
          hp: 1,
          maxHp: 1,
          radius: 19,
          hitFlash: 0,
        }
      );
    } else if (room.type === ROOM_TYPES.NEXUS_WARZONE) {
      // 4 Faction 25-HP Outpost Nexuses (Defend yours, shatter rivals!)
      const outposts = [
        { id: 'outpost_Solari', faction: 'Solari', name: 'Solari Outpost Nexus', spriteKey: 'nexusGold', x: -240, y: 170 },
        { id: 'outpost_Umbri', faction: 'Umbri', name: 'Umbri Outpost Nexus', spriteKey: 'nexusPurple', x: 240, y: -170 },
        { id: 'outpost_Terra', faction: 'Terra', name: 'Terra Outpost Nexus', spriteKey: 'nexusGreen', x: -240, y: -170 },
        { id: 'outpost_Aether', faction: 'Aether', name: 'Aether Outpost Nexus', spriteKey: 'nexusCyan', x: 240, y: 170 },
      ];
      for (const op of outposts) {
        room.entities.push({
          id: op.id,
          name: op.name,
          sub: `25 HP ${op.faction} Outpost Nexus`,
          type: 'outpost_nexus',
          faction: op.faction,
          spriteKey: op.spriteKey,
          x: op.x,
          y: op.y,
          origX: op.x,
          origY: op.y,
          hp: 25,
          maxHp: 25,
          xpReward: 165,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        });
      }

      [[-135, -75], [135, -75], [-155, 80], [155, 80]].forEach(([nx, ny], idx) => {
        room.entities.push({
          id: `node_${idx}`,
          name: `Glimmer Node #${idx + 1}`,
          sub: 'Aether Leyline Crystal [E]',
          type: 'node',
          spriteKey: 'node',
          x: nx,
          y: ny,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        });
      });

      room.entities.push(
        {
          id: 'umbri_1',
          name: 'Void Stalker',
          sub: 'Lv.2 Umbri Entity (AWK)',
          type: 'mob',
          spriteKey: 'voidStalker',
          x: -95,
          y: -25,
          origX: -95,
          origY: -25,
          hp: 30,
          maxHp: 30,
          damage: 4,
          xpReward: 55,
          speed: 52,
          aggroRange: 112,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'umbri_2',
          name: 'Duskblade Fiend',
          sub: 'Lv.3 Umbri Entity (AWK)',
          type: 'mob',
          spriteKey: 'duskFiend',
          x: 75,
          y: 35,
          origX: 75,
          origY: 35,
          hp: 26,
          maxHp: 26,
          damage: 4,
          xpReward: 60,
          speed: 58,
          aggroRange: 108,
          attackRange: 26,
          radius: 13,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'terra_boss',
          name: 'Granite Behemoth',
          sub: '★ Lv.5 Warzone World Boss',
          type: 'mob',
          isBoss: true,
          spriteKey: 'graniteBoss',
          x: 0,
          y: -185,
          origX: 0,
          origY: -185,
          hp: 65,
          maxHp: 65,
          damage: 6,
          xpReward: 150,
          speed: 38,
          aggroRange: 125,
          attackRange: 34,
          radius: 21,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'portal_ruins',
          name: 'First Nexus Ruins Gate',
          sub: '🏛️ Forgotten Ruins',
          type: 'portal',
          targetRoom: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
          spriteKey: 'portal',
          x: 0,
          y: -250,
          hp: 1,
          maxHp: 1,
          radius: 19,
          hitFlash: 0,
        },
        {
          id: 'portal_hub',
          name: 'Sanctuary Hub Rift',
          sub: 'Step In -> Sanctuary Hub',
          type: 'portal',
          targetRoom: ROOM_TYPES.SANCTUARY_HUB,
          spriteKey: 'portal',
          x: 0,
          y: 215,
          hp: 1,
          maxHp: 1,
          radius: 20,
          hitFlash: 0,
        }
      );
    } else if (
      room.type === ROOM_TYPES.SOLARI_CITADEL ||
      room.type === ROOM_TYPES.UMBRI_UNDERCITY ||
      room.type === ROOM_TYPES.TERRA_ORCHARD ||
      room.type === ROOM_TYPES.AETHER_SPIRE
    ) {
      this.populateFactionBiomeDungeon(room);
    } else if (
      room.type === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS ||
      room.type === ROOM_TYPES.SOLARI_SUNKEN_VAULT ||
      room.type === ROOM_TYPES.UMBRI_SHADOW_LABYRINTH ||
      room.type === ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY ||
      room.type === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE
    ) {
      this.populateSubZoneDungeon(room);
    } else if (room.type === ROOM_TYPES.ARENA_3V3) {
      room.entities.push(
        {
          id: 'blue_nexus',
          name: 'Solari Sanctuary Nexus',
          sub: '25 HP Blue Team Core',
          type: 'ally_nexus',
          team: 'blue',
          spriteKey: 'nexusBlue',
          x: 0,
          y: 220,
          hp: 25,
          maxHp: 25,
          xpReward: 220,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'red_nexus',
          name: 'Umbri Dominion Nexus',
          sub: '25 HP Red Team Core',
          type: 'nexus',
          team: 'red',
          spriteKey: 'nexusRed',
          x: 0,
          y: -215,
          hp: 25,
          maxHp: 25,
          xpReward: 220,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'arena_node_l',
          name: 'West Glimmer Node',
          sub: 'Leyline Crystal [E]',
          type: 'node',
          spriteKey: 'node',
          x: -155,
          y: 0,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'arena_node_r',
          name: 'East Glimmer Node',
          sub: 'Leyline Crystal [E]',
          type: 'node',
          spriteKey: 'node',
          x: 155,
          y: 0,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        }
      );
    }
  }

  populateFactionBiomeDungeon(room) {
    const specs = {
      [ROOM_TYPES.SOLARI_CITADEL]: {
        mob1: { name: 'Sunforged Sentinel', sub: 'Lv.3 Golden Citadel Guard', spriteKey: 'mobSolari', hp: 32, dmg: 4, xp: 65 },
        mob2: { name: 'Lantern Inquisitor', sub: 'Lv.4 Radiant Zealot', spriteKey: 'mobSolari', hp: 36, dmg: 5, xp: 75 },
        boss: { name: 'Sunfire Colossus', sub: '★ Lv.7 Golden Citadel Dungeon Boss', spriteKey: 'bossSolari', hp: 82, dmg: 7, xp: 185, dropGear: 'sunfire_greatsword' },
      },
      [ROOM_TYPES.UMBRI_UNDERCITY]: {
        mob1: { name: 'Sepulcher Stalker', sub: 'Lv.3 Undercity Shade', spriteKey: 'voidStalker', hp: 30, dmg: 5, xp: 65 },
        mob2: { name: 'Duskveil Bog Fiend', sub: 'Lv.4 Graveglass Reaper', spriteKey: 'duskFiend', hp: 34, dmg: 5, xp: 75 },
        boss: { name: 'Crypt Lord Malakor', sub: '★ Lv.7 Sepulcher Dungeon Boss', spriteKey: 'bossUmbri', hp: 78, dmg: 7, xp: 185, dropGear: 'scythe_soulreaper' },
      },
      [ROOM_TYPES.TERRA_ORCHARD]: {
        mob1: { name: 'Briarback Prowler', sub: 'Lv.3 Glimmer Orchard Beast', spriteKey: 'mobTerra', hp: 35, dmg: 4, xp: 65 },
        mob2: { name: 'Rootdeep Stonekin', sub: 'Lv.4 Ironwood Guardian', spriteKey: 'mobTerra', hp: 40, dmg: 5, xp: 75 },
        boss: { name: 'Ancient Brambleheart', sub: '★ Lv.7 Rootdeep Dungeon Boss', spriteKey: 'graniteBoss', hp: 90, dmg: 7, xp: 185, dropGear: 'ironwood_armor' },
      },
      [ROOM_TYPES.AETHER_SPIRE]: {
        mob1: { name: 'Continuum Wraith', sub: 'Lv.3 Mirrorgate Anomaly', spriteKey: 'mobAether', hp: 29, dmg: 5, xp: 65 },
        mob2: { name: 'Chrono Construct', sub: 'Lv.4 Fractured Sentinel', spriteKey: 'mobAether', hp: 34, dmg: 5, xp: 75 },
        boss: { name: 'Rift Titan', sub: '★ Lv.7 Mirrorgate Dungeon Boss', spriteKey: 'bossAether', hp: 80, dmg: 7, xp: 185, dropGear: 'mirror_shield' },
      },
    };

    const s = specs[room.type] || specs[ROOM_TYPES.SOLARI_CITADEL];

    // Return Portal to Sanctuary + North Portal to Warzone
    room.entities.push(
      {
        id: 'portal_sanctuary',
        name: 'Sanctuary Return Gate',
        sub: 'Step In -> Sanctuary Hub',
        type: 'portal',
        targetRoom: ROOM_TYPES.SANCTUARY_HUB,
        spriteKey: 'portal',
        x: 0,
        y: 222,
        hp: 1,
        maxHp: 1,
        radius: 19,
        hitFlash: 0,
      },
      {
        id: 'biome_node_1',
        name: 'Biome Glimmer Node',
        sub: 'Leyline Crystal [E]',
        type: 'node',
        spriteKey: 'node',
        x: -140,
        y: 60,
        charges: 3,
        maxCharges: 3,
        rechargeTimer: 0,
        radius: 15,
        hitFlash: 0,
      },
      {
        id: 'biome_node_2',
        name: 'Sanctum Glimmer Node',
        sub: 'Leyline Crystal [E]',
        type: 'node',
        spriteKey: 'node',
        x: 140,
        y: -40,
        charges: 3,
        maxCharges: 3,
        rechargeTimer: 0,
        radius: 15,
        hitFlash: 0,
      },
      {
        id: 'biome_mob_1',
        name: s.mob1.name,
        sub: s.mob1.sub,
        type: 'mob',
        spriteKey: s.mob1.spriteKey,
        x: -95,
        y: 45,
        origX: -95,
        origY: 45,
        hp: s.mob1.hp,
        maxHp: s.mob1.hp,
        damage: s.mob1.dmg,
        xpReward: s.mob1.xp,
        speed: 52,
        aggroRange: 112,
        attackRange: 28,
        radius: 15,
        hitFlash: 0,
        dammers: new Set(),
      },
      {
        id: 'biome_mob_2',
        name: s.mob2.name,
        sub: s.mob2.sub,
        type: 'mob',
        spriteKey: s.mob2.spriteKey,
        x: 95,
        y: 20,
        origX: 95,
        origY: 20,
        hp: s.mob2.hp,
        maxHp: s.mob2.hp,
        damage: s.mob2.dmg,
        xpReward: s.mob2.xp,
        speed: 55,
        aggroRange: 115,
        attackRange: 28,
        radius: 15,
        hitFlash: 0,
        dammers: new Set(),
      },
      {
        id: 'biome_mob_3',
        name: s.mob1.name,
        sub: s.mob1.sub,
        type: 'mob',
        spriteKey: s.mob1.spriteKey,
        x: -60,
        y: -75,
        origX: -60,
        origY: -75,
        hp: s.mob1.hp,
        maxHp: s.mob1.hp,
        damage: s.mob1.dmg,
        xpReward: s.mob1.xp,
        speed: 52,
        aggroRange: 112,
        attackRange: 28,
        radius: 15,
        hitFlash: 0,
        dammers: new Set(),
      },
      {
        id: 'biome_boss',
        name: s.boss.name,
        sub: s.boss.sub,
        type: 'mob',
        isBoss: true,
        dropGear: s.boss.dropGear,
        spriteKey: s.boss.spriteKey,
        x: 0,
        y: -155,
        origX: 0,
        origY: -155,
        hp: s.boss.hp,
        maxHp: s.boss.hp,
        damage: s.boss.dmg,
        xpReward: s.boss.xp,
        speed: 40,
        aggroRange: 135,
        attackRange: 34,
        radius: 22,
        hitFlash: 0,
        dammers: new Set(),
      }
    );

    const subZonePortals = {
      [ROOM_TYPES.SOLARI_CITADEL]: {
        id: 'portal_solari_vault',
        name: 'Sunken Vault Waygate',
        sub: '☀️ Solari Secret Crypt',
        targetRoom: ROOM_TYPES.SOLARI_SUNKEN_VAULT,
      },
      [ROOM_TYPES.UMBRI_UNDERCITY]: {
        id: 'portal_umbri_lab',
        name: 'Shadow Labyrinth Gloomgate',
        sub: '🌑 Twisted Umbri Crypt',
        targetRoom: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH,
      },
      [ROOM_TYPES.TERRA_ORCHARD]: {
        id: 'portal_terra_sanctuary',
        name: 'Primordial Hollow Rootgate',
        sub: '🌿 Sacred Ironwood Grove',
        targetRoom: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY,
      },
      [ROOM_TYPES.AETHER_SPIRE]: {
        id: 'portal_aether_archive',
        name: 'Chrono-Archive Rift',
        sub: '🔮 Astral Archive',
        targetRoom: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE,
      },
    };
    const subPortal = subZonePortals[room.type];
    if (subPortal) {
      room.entities.push({
        id: subPortal.id,
        name: subPortal.name,
        sub: subPortal.sub,
        type: 'portal',
        targetRoom: subPortal.targetRoom,
        spriteKey: 'portal',
        x: 0,
        y: -215,
        hp: 1,
        maxHp: 1,
        radius: 19,
        hitFlash: 0,
      });
    }
  }

  populateSubZoneDungeon(room) {
    if (room.type === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      room.entities.push(
        {
          id: 'portal_hub',
          name: 'Sanctuary Hub Gate',
          sub: 'Step In -> Sanctuary Hub',
          type: 'portal',
          targetRoom: ROOM_TYPES.SANCTUARY_HUB,
          spriteKey: 'portal',
          x: 0,
          y: 240,
          hp: 1,
          maxHp: 1,
          radius: 19,
          hitFlash: 0,
        },
        {
          id: 'portal_warzone',
          name: 'Warzone North Rift',
          sub: 'Step In -> Nexus Warzone',
          type: 'portal',
          targetRoom: ROOM_TYPES.NEXUS_WARZONE,
          spriteKey: 'portal',
          x: 0,
          y: -240,
          hp: 1,
          maxHp: 1,
          radius: 19,
          hitFlash: 0,
        },
        {
          id: 'tut_font_ruins_c',
          name: 'Prismatic Keystone Spire',
          sub: 'Ancient Prismatic Node [E]',
          type: 'node',
          spriteKey: 'node',
          x: 0,
          y: 0,
          charges: 5,
          maxCharges: 5,
          rechargeTimer: 0,
          radius: 16,
          hitFlash: 0,
        },
        {
          id: 'tut_font_ruins_w',
          name: 'West Ruin Font',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -140,
          y: -30,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'tut_font_ruins_e',
          name: 'East Ruin Font',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: 140,
          y: -30,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'ruin_mob_1',
          name: 'Ancient Ruin Golem',
          sub: 'Lv.4 Keystone Construct',
          type: 'mob',
          spriteKey: 'graniteBoss',
          x: -90,
          y: 40,
          origX: -90,
          origY: 40,
          hp: 44,
          maxHp: 44,
          damage: 4,
          xpReward: 75,
          speed: 42,
          aggroRange: 115,
          attackRange: 28,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'ruin_mob_2',
          name: 'Ancient Ruin Golem',
          sub: 'Lv.4 Keystone Construct',
          type: 'mob',
          spriteKey: 'graniteBoss',
          x: 90,
          y: 40,
          origX: 90,
          origY: 40,
          hp: 44,
          maxHp: 44,
          damage: 4,
          xpReward: 75,
          speed: 42,
          aggroRange: 115,
          attackRange: 28,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'ruin_mob_3',
          name: 'Lost Shard Sentinel',
          sub: 'Lv.5 Prismatic Sentinel',
          type: 'mob',
          spriteKey: 'mobSolari',
          x: -75,
          y: -50,
          origX: -75,
          origY: -50,
          hp: 48,
          maxHp: 48,
          damage: 5,
          xpReward: 85,
          speed: 52,
          aggroRange: 120,
          attackRange: 30,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'ruin_mob_4',
          name: 'Lost Shard Sentinel',
          sub: 'Lv.5 Prismatic Sentinel',
          type: 'mob',
          spriteKey: 'mobAether',
          x: 75,
          y: -50,
          origX: 75,
          origY: -50,
          hp: 48,
          maxHp: 48,
          damage: 5,
          xpReward: 85,
          speed: 52,
          aggroRange: 120,
          attackRange: 30,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'ruin_boss',
          name: 'The Prismatic Golem',
          sub: '★ Lv.7 First Nexus Guardian',
          type: 'mob',
          isBoss: true,
          dropGear: 'prismatic_keystone',
          spriteKey: 'graniteBoss',
          x: 0,
          y: -120,
          origX: 0,
          origY: -120,
          hp: 88,
          maxHp: 88,
          damage: 7,
          xpReward: 210,
          speed: 38,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
    } else if (room.type === ROOM_TYPES.SOLARI_SUNKEN_VAULT) {
      room.entities.push(
        {
          id: 'portal_citadel',
          name: 'Return to Golden Citadel',
          sub: 'Step In -> Golden Citadel',
          type: 'portal',
          targetRoom: ROOM_TYPES.SOLARI_CITADEL,
          spriteKey: 'portal',
          x: 0,
          y: 220,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_hub',
          name: 'Sanctuary Return Gate',
          sub: 'Step In -> Sanctuary Hub',
          type: 'portal',
          targetRoom: ROOM_TYPES.SANCTUARY_HUB,
          spriteKey: 'portal',
          x: -180,
          y: 180,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'vault_node_1',
          name: 'Dawnstone Glimmer Well',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'vault_node_2',
          name: 'Solar Core Font',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: 125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'vault_mob_1',
          name: 'Sunfire Automaton',
          sub: 'Lv.4 Solari Automaton',
          type: 'mob',
          spriteKey: 'mobSolari',
          x: -85,
          y: 30,
          origX: -85,
          origY: 30,
          hp: 42,
          maxHp: 42,
          damage: 5,
          xpReward: 80,
          speed: 52,
          aggroRange: 115,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'vault_mob_2',
          name: 'Sunfire Automaton',
          sub: 'Lv.4 Solari Automaton',
          type: 'mob',
          spriteKey: 'mobSolari',
          x: 85,
          y: 30,
          origX: 85,
          origY: 30,
          hp: 42,
          maxHp: 42,
          damage: 5,
          xpReward: 80,
          speed: 52,
          aggroRange: 115,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'vault_mob_3',
          name: 'Dawnblade Crusader',
          sub: 'Lv.5 Solari Elite Guard',
          type: 'mob',
          spriteKey: 'mobSolari',
          x: -60,
          y: -50,
          origX: -60,
          origY: -50,
          hp: 46,
          maxHp: 46,
          damage: 5,
          xpReward: 90,
          speed: 55,
          aggroRange: 118,
          attackRange: 30,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'vault_boss',
          name: 'Solaris Core Colossus',
          sub: '★ Lv.8 Sunken Dawn Titan',
          type: 'mob',
          isBoss: true,
          dropGear: 'dawnfire_crest',
          spriteKey: 'bossSolari',
          x: 0,
          y: -120,
          origX: 0,
          origY: -120,
          hp: 96,
          maxHp: 96,
          damage: 7,
          xpReward: 240,
          speed: 40,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
    } else if (room.type === ROOM_TYPES.UMBRI_SHADOW_LABYRINTH) {
      room.entities.push(
        {
          id: 'portal_undercity',
          name: 'Return to Sepulcher Undercity',
          sub: 'Step In -> Undercity',
          type: 'portal',
          targetRoom: ROOM_TYPES.UMBRI_UNDERCITY,
          spriteKey: 'portal',
          x: 0,
          y: 220,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_hub',
          name: 'Sanctuary Return Gate',
          sub: 'Step In -> Sanctuary Hub',
          type: 'portal',
          targetRoom: ROOM_TYPES.SANCTUARY_HUB,
          spriteKey: 'portal',
          x: 180,
          y: 180,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'lab_node_1',
          name: 'Graveglass Leyline Shroud',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'lab_node_2',
          name: 'Void Font',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: 125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'lab_mob_1',
          name: 'Graveglass Phantom',
          sub: 'Lv.4 Umbri Specter',
          type: 'mob',
          spriteKey: 'voidStalker',
          x: -90,
          y: 30,
          origX: -90,
          origY: 30,
          hp: 38,
          maxHp: 38,
          damage: 6,
          xpReward: 80,
          speed: 56,
          aggroRange: 115,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'lab_mob_2',
          name: 'Graveglass Phantom',
          sub: 'Lv.4 Umbri Specter',
          type: 'mob',
          spriteKey: 'voidStalker',
          x: 90,
          y: 30,
          origX: 90,
          origY: 30,
          hp: 38,
          maxHp: 38,
          damage: 6,
          xpReward: 80,
          speed: 56,
          aggroRange: 115,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'lab_mob_3',
          name: 'Gloam Assassin',
          sub: 'Lv.5 Umbri Elite',
          type: 'mob',
          spriteKey: 'duskFiend',
          x: -65,
          y: -60,
          origX: -65,
          origY: -60,
          hp: 42,
          maxHp: 42,
          damage: 6,
          xpReward: 90,
          speed: 60,
          aggroRange: 120,
          attackRange: 30,
          radius: 14,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'lab_boss',
          name: 'Abyssal Devourer',
          sub: '★ Lv.8 Shade of the Void',
          type: 'mob',
          isBoss: true,
          dropGear: 'void_soulblade',
          spriteKey: 'bossUmbri',
          x: 0,
          y: -120,
          origX: 0,
          origY: -120,
          hp: 92,
          maxHp: 92,
          damage: 8,
          xpReward: 240,
          speed: 42,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
    } else if (room.type === ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY) {
      room.entities.push(
        {
          id: 'portal_orchard',
          name: 'Return to Glimmer Orchard',
          sub: 'Step In -> Orchard',
          type: 'portal',
          targetRoom: ROOM_TYPES.TERRA_ORCHARD,
          spriteKey: 'portal',
          x: 0,
          y: 220,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_hub',
          name: 'Sanctuary Return Gate',
          sub: 'Step In -> Sanctuary Hub',
          type: 'portal',
          targetRoom: ROOM_TYPES.SANCTUARY_HUB,
          spriteKey: 'portal',
          x: -180,
          y: 180,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'hollow_node_1',
          name: 'Ironwood Blossom Node',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'hollow_node_2',
          name: 'Rootdeep Heart Font',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: 125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'hollow_mob_1',
          name: 'Ironwood Barkkin',
          sub: 'Lv.4 Terra Forestkin',
          type: 'mob',
          spriteKey: 'mobTerra',
          x: -85,
          y: 30,
          origX: -85,
          origY: 30,
          hp: 48,
          maxHp: 48,
          damage: 4,
          xpReward: 80,
          speed: 50,
          aggroRange: 112,
          attackRange: 28,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'hollow_mob_2',
          name: 'Ironwood Barkkin',
          sub: 'Lv.4 Terra Forestkin',
          type: 'mob',
          spriteKey: 'mobTerra',
          x: 85,
          y: 30,
          origX: 85,
          origY: 30,
          hp: 48,
          maxHp: 48,
          damage: 4,
          xpReward: 80,
          speed: 50,
          aggroRange: 112,
          attackRange: 28,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'hollow_mob_3',
          name: 'Sporeling Stalker',
          sub: 'Lv.5 Terra Beast',
          type: 'mob',
          spriteKey: 'mobTerra',
          x: 70,
          y: -60,
          origX: 70,
          origY: -60,
          hp: 44,
          maxHp: 44,
          damage: 5,
          xpReward: 90,
          speed: 55,
          aggroRange: 118,
          attackRange: 30,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'hollow_boss',
          name: 'Primordial Ironbark',
          sub: '★ Lv.8 Elder Treant of the Hollow',
          type: 'mob',
          isBoss: true,
          dropGear: 'primordial_bark_chest',
          spriteKey: 'graniteBoss',
          x: 0,
          y: -120,
          origX: 0,
          origY: -120,
          hp: 110,
          maxHp: 110,
          damage: 7,
          xpReward: 250,
          speed: 38,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
    } else if (room.type === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE) {
      room.entities.push(
        {
          id: 'portal_spire',
          name: 'Return to Mirrorgate Spire',
          sub: 'Step In -> Spire',
          type: 'portal',
          targetRoom: ROOM_TYPES.AETHER_SPIRE,
          spriteKey: 'portal',
          x: 0,
          y: 220,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'portal_hub',
          name: 'Sanctuary Return Gate',
          sub: 'Step In -> Sanctuary Hub',
          type: 'portal',
          targetRoom: ROOM_TYPES.SANCTUARY_HUB,
          spriteKey: 'portal',
          x: 180,
          y: 180,
          hp: 1,
          maxHp: 1,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'archive_node_1',
          name: 'Continuum Time Spire',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'archive_node_2',
          name: 'Astral Mirrorgate Font',
          sub: 'Glimmer Leyline Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: 125,
          y: 20,
          charges: 3,
          maxCharges: 3,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        },
        {
          id: 'archive_mob_1',
          name: 'Chrono Echo',
          sub: 'Lv.4 Aether Construct',
          type: 'mob',
          spriteKey: 'mobAether',
          x: -85,
          y: 30,
          origX: -85,
          origY: 30,
          hp: 38,
          maxHp: 38,
          damage: 6,
          xpReward: 80,
          speed: 54,
          aggroRange: 115,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'archive_mob_2',
          name: 'Chrono Echo',
          sub: 'Lv.4 Aether Construct',
          type: 'mob',
          spriteKey: 'mobAether',
          x: 85,
          y: 30,
          origX: 85,
          origY: 30,
          hp: 38,
          maxHp: 38,
          damage: 6,
          xpReward: 80,
          speed: 54,
          aggroRange: 115,
          attackRange: 28,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'archive_mob_3',
          name: 'Astral Weaver',
          sub: 'Lv.5 Continuum Mage',
          type: 'mob',
          spriteKey: 'mobAether',
          x: -70,
          y: -60,
          origX: -70,
          origY: -60,
          hp: 42,
          maxHp: 42,
          damage: 6,
          xpReward: 90,
          speed: 56,
          aggroRange: 118,
          attackRange: 30,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'archive_boss',
          name: 'Continuum Singularity',
          sub: '★ Lv.8 Paradox Titan',
          type: 'mob',
          isBoss: true,
          dropGear: 'chronos_singularity_core',
          spriteKey: 'bossAether',
          x: 0,
          y: -120,
          origX: 0,
          origY: -120,
          hp: 94,
          maxHp: 94,
          damage: 8,
          xpReward: 240,
          speed: 42,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
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

  attachConnection(ws, account, preferredRoom = null) {
    const existing = this.clients.get(account.id);
    if (existing && existing.ws !== ws) {
      try {
        existing.send({ type: 'sys_msg', category: 'system', text: '[System] Logged in from another window.' });
        existing.ws.close();
      } catch (_) {}
      this.removeClient(existing);
    }

    const prog = account.progression || createDefaultProgression();
    const classId = account.classId || 'solari_vanguard';
    const equipment = account.equipment || CLASSES_CATALOG[classId]?.defaultEquipment || {};
    const loadout = account.loadout || CLASSES_CATALOG[classId]?.defaultLoadout || {};
    const maxHp = calcMaxHp(prog, equipment, classId);
    const maxGlimmer = calcMaxGlimmer(prog, equipment, classId);

    const client = {
      id: account.id,
      ws,
      username: account.username,
      displayName: account.displayName,
      isGuest: account.isGuest,
      tcgLinked: account.tcgLinked,
      tcgHandle: account.tcgHandle,
      faction: account.faction || 'Solari',
      classId,
      loadout,
      equipment,
      orderTag: account.orderTag || 'SUN',
      orderName: account.orderName || 'Order of Dawn',
      orderColor: account.orderColor || '#facc15',
      prog,
      x: 0,
      y: 96,
      z: 0,
      dir: 'up',
      isMoving: false,
      hp: maxHp,
      maxHp,
      shield: 0,
      shieldTimer: 0,
      solarCharge: 0,
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
      cooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 9: 0, 10: 0, 11: 0, 12: 0, banner: 0 },
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

    this.joinRoom(client, preferredRoom || ROOM_TYPES.SANCTUARY_HUB);
    return client;
  }

  refreshClientFromAccount(accountId) {
    const client = this.clients.get(accountId);
    const acc = this.accounts.accountsById.get(accountId);
    if (!client || !acc) return;
    client.username = acc.username;
    client.displayName = acc.displayName;
    client.isGuest = acc.isGuest;
    client.tcgLinked = acc.tcgLinked;
    client.tcgHandle = acc.tcgHandle;
    client.faction = acc.faction;
    client.classId = acc.classId || 'solari_vanguard';
    client.loadout = acc.loadout || CLASSES_CATALOG[client.classId]?.defaultLoadout || {};
    client.equipment = acc.equipment || CLASSES_CATALOG[client.classId]?.defaultEquipment || {};
    client.orderTag = acc.orderTag;
    client.orderName = acc.orderName;
    client.orderColor = acc.orderColor;
    client.prog = acc.progression;
    client.maxHp = calcMaxHp(client.prog, client.equipment, client.classId);
    client.hp = Math.min(client.maxHp, client.hp);
    client.maxSolarCharge = calcMaxGlimmer(client.prog, client.equipment, client.classId);

    client.send({
      type: 'profile_updated',
      profile: this.accounts.toPublicProfile(acc),
    });
    this.parties.syncPlayerVitals(client.id);
  }

  removeClient(client) {
    if (!client) return;
    this.leaveArenaQueue(client);
    this.parties.leaveParty(client);
    if (client.roomId && this.rooms.has(client.roomId)) {
      const room = this.rooms.get(client.roomId);
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
    if (this.clients.get(client.id) === client) {
      this.clients.delete(client.id);
    }
  }

  joinRoom(client, targetRoomOrType, teamOverride = null) {
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
    client.portalCooldown = 1.6;

    const jitterX = Math.round((Math.random() - 0.5) * 28);
    if (room.type === ROOM_TYPES.ARENA_3V3 && teamOverride === 'red') {
      client.x = jitterX;
      client.y = -170;
      client.dir = 'down';
    } else {
      client.x = cfg.spawnX + jitterX;
      client.y = cfg.spawnY;
      client.dir = 'up';
    }

    room.players.set(client.id, client);

    client.send({
      type: 'room_joined',
      roomId: room.id,
      roomType: room.type,
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

    this.parties.syncPlayerVitals(client.id);
  }

  // ==========================================
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
  }

  broadcastArenaLobby() {
    const info = this.getArenaLobbyInfo();
    for (const c of this.clients.values()) c.send(info);
  }

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
  }

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
  }

  forceArenaFill(client) {
    const entry = this.arenaQueue.find((q) => q.memberIds.includes(client.id));
    if (!entry) return;
    entry.forceFill = true;
    this.broadcastToArenaQueue('[3v3 Arena] Filling empty slots with computer entities — match starting!');
  }

  broadcastToArenaQueue(text) {
    for (const q of this.arenaQueue) {
      for (const id of q.memberIds) {
        this.clients.get(id)?.send({ type: 'sys_msg', category: 'zone', text });
      }
    }
  }

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
  }

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
  }

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
      p.hp = p.maxHp;
      p.send({ type: 'queue_state', queueing: false });
      this.joinRoom(p, room.id, 'blue');
      p.send({ type: 'sys_msg', category: 'zone', text: summary });
    }
    for (const p of redPlayers) {
      p.hp = p.maxHp;
      p.send({ type: 'queue_state', queueing: false });
      this.joinRoom(p, room.id, 'red');
      p.send({ type: 'sys_msg', category: 'zone', text: summary });
    }
  }

  // ==========================================
  // Hostility & Ally Rules
  // ==========================================
  arePlayersAllied(room, pA, pB) {
    if (!pA || !pB) return true;
    if (pA.id === pB.id) return true;
    if (!room.pvp) return true;
    if (room.type === ROOM_TYPES.ARENA_3V3) return pA.team === pB.team;
    if (this.parties.areInSameParty(pA.id, pB.id)) return true;
    return pA.faction === pB.faction;
  }

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
  }

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
    for (const b of room.banners) {
      const owner = room.players.get(b.ownerId);
      if ((!owner || this.arePlayersAllied(room, player, owner)) && Math.hypot(player.x - b.x, player.y - b.y) <= 110) {
        bonus += 1;
        break;
      }
    }
    return bonus;
  }

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
        const nx = Number(msg.x);
        const ny = Number(msg.y);
        if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;

        const dist = Math.hypot(nx - client.x, ny - client.y);
        if (dist <= 110) {
          client.x = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, nx));
          client.y = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, ny));
        }
        client.z = Math.max(0, Math.min(80, Number(msg.z) || 0));
        if (['up', 'down', 'left', 'right'].includes(msg.dir)) {
          client.dir = msg.dir;
        }
        client.isMoving = Boolean(msg.isMoving);
        break;
      }

      case 'switch_room': {
        const target = msg.roomId || msg.roomType || ROOM_TYPES.NEXUS_WARZONE;
        this.joinRoom(client, target);
        break;
      }

      case 'queue_arena':
        if (msg.join) this.queueForArena(client, msg.mode === 'bots' ? 'bots' : 'wait');
        else this.leaveArenaQueue(client);
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

      case 'harvest_node':
        if (room) this.handleHarvestNode(room, client, msg.nodeId);
        break;

      case 'plant_banner':
        if (room) this.handlePlantBanner(room, client);
        break;

      case 'equip_item': {
        const item = EQUIPMENT_CATALOG[msg.itemId];
        if (!item) return;
        const nextEquip = { ...(client.equipment || {}), [item.slot]: item.id };
        this.accounts.updateProfile(client.id, { equipment: nextEquip });
        this.refreshClientFromAccount(client.id);
        if (room) {
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
  }

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
      await this.accounts.ensureFreshFromPostgres({ id: client.id });
      const charObj = this.accounts.createOrSelectCharacter(client.id, payload);
      await this.accounts.flushToPostgres();
      this.refreshClientFromAccount(client.id);
      if (payload.enterRealm) {
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
  }

  // ==========================================
  // Authoritative Combat & All 35 TCG Rites/Flashes
  // ==========================================
  findHostileTargetById(room, player, targetId) {
    if (!targetId) return null;
    if (String(targetId).startsWith('p_')) {
      const pid = String(targetId).slice(2);
      const other = room.players.get(pid);
      if (other && !other.isDead && other.stealthedTimer <= 0 && !this.arePlayersAllied(room, player, other)) {
        return { kind: 'player', ref: other };
      }
      return null;
    }
    const ent = room.entities.find((e) => e.id === targetId);
    if (ent && this.canDamageEntity(room, player, ent)) {
      return { kind: 'entity', ref: ent };
    }
    return null;
  }

  findNearestHostile(room, player, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const e of room.entities) {
      if (!this.canDamageEntity(room, player, e)) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d <= bestD) {
        bestD = d;
        best = { kind: 'entity', ref: e };
      }
    }
    if (room.pvp) {
      for (const other of room.players.values()) {
        if (other.isDead || other.stealthedTimer > 0 || this.arePlayersAllied(room, player, other)) continue;
        const d = Math.hypot(other.x - player.x, other.y - player.y);
        if (d <= bestD) {
          bestD = d;
          best = { kind: 'player', ref: other };
        }
      }
    }
    return best;
  }

  getAllHostilesInRadius(room, player, cx, cy, radius) {
    const out = [];
    for (const e of room.entities) {
      if (!this.canDamageEntity(room, player, e)) continue;
      if (Math.hypot(e.x - cx, e.y - cy) <= radius) {
        out.push({ kind: 'entity', ref: e });
      }
    }
    if (room.pvp) {
      for (const other of room.players.values()) {
        if (other.isDead || this.arePlayersAllied(room, player, other)) continue;
        if (Math.hypot(other.x - cx, other.y - cy) <= radius) {
          out.push({ kind: 'player', ref: other });
        }
      }
    }
    return out;
  }

  addPlayerGlimmer(room, player, amount) {
    player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + amount);
    // Solari Faction Mechanic: Guard & Zenith! Reaching 100+ Glimmer triggers Zenith State!
    if (player.faction === 'Solari' && player.solarCharge >= 100 && player.zenithTimer <= 0) {
      player.zenithTimer = 6.0;
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '☀️ ZENITH STATE! (+25% DMG)', color: '#fde047', isCrit: true });
      // Heal nearby allies & allied Outpost Nexus
      for (const ally of room.players.values()) {
        if (!ally.isDead && this.arePlayersAllied(room, player, ally) && Math.hypot(ally.x - player.x, ally.y - player.y) <= 150) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 4);
        }
      }
      this.healAlliedNexus(room, player, 2);
    }
  }

  healAlliedNexus(room, player, healAmt) {
    const targetNexus = room.entities.find((e) =>
      !e.isDying &&
      ((e.type === 'outpost_nexus' && e.faction === player.faction) ||
       (room.type === ROOM_TYPES.ARENA_3V3 && e.id === (player.team === 'red' ? 'red_nexus' : 'blue_nexus')))
    );
    if (targetNexus && targetNexus.hp < targetNexus.maxHp) {
      targetNexus.hp = Math.min(targetNexus.maxHp, targetNexus.hp + healAmt);
      room.fxQueue.push({ kind: 'fct', x: targetNexus.x, y: targetNexus.y - 14, text: `+${healAmt} NEXUS GUARD`, color: '#fde047' });
    }
  }

  triggerSpellEchoIfEligible(room, player, targetWrap, baseDmg, spellName) {
    if (!targetWrap) return;
    const shouldEcho = player.echoPrimed || (player.faction === 'Aether' && Math.random() < 0.35);
    if (!shouldEcho) return;
    player.echoPrimed = false;
    const echoDmg = Math.max(2, Math.round(baseDmg * 0.45));
    setTimeout(() => {
      if (!this.rooms.has(room.id)) return;
      if (targetWrap.kind === 'entity' && (!targetWrap.ref || targetWrap.ref.isDying || targetWrap.ref.hp <= 0)) return;
      if (targetWrap.kind === 'player' && (!targetWrap.ref || targetWrap.ref.isDead || targetWrap.ref.hp <= 0)) return;
      room.fxQueue.push({ kind: 'fct', x: targetWrap.ref.x, y: targetWrap.ref.y - 14, text: `🔮 ECHO +${echoDmg}`, color: '#38bdf8', isCrit: true });
      this.applyAuthoritativeDamage(room, player, targetWrap, echoDmg, true, `${spellName} (Echo)`, false);
    }, 220);
  }

  handleCastAbility(room, player, slot, targetId, facingDir) {
    if (player.isDead || player.freezeTimer > 0) return;
    if (!ACTION_SLOTS.includes(slot)) return;
    const spec = getSlotAbilitySpec(player.loadout, slot);
    if (!spec) return;
    if ((player.cooldowns[slot] || 0) > 0.05) return;

    if (['up', 'down', 'left', 'right'].includes(facingDir)) {
      player.dir = facingDir;
    }

    const effStats = getEffectiveStats(player.prog, player.equipment, player.classId);
    const rank = player.prog.ranks[slot] || 1;
    const zenithMult = player.zenithTimer > 0 ? 1.25 : 1.0;
    const effPower = Math.max(1, Math.round((effStats.power + this.getBonusPower(room, player) - (player.weakenTimer > 0 ? 2 : 0)) * zenithMult));
    const cdMult = calcCdMult(player.prog, player.equipment, player.classId, player.faction);
    const critChance = calcCritChance(player.prog, player.equipment, player.classId);
    const isFlash = spec.tcgType.includes('Flash');
    const isRite = spec.tcgType.includes('Rite');

    const getDirAngle = (dir) => {
      if (dir === 'up') return { dx: 0, dy: -1, angle: -Math.PI / 2 };
      if (dir === 'down') return { dx: 0, dy: 1, angle: Math.PI / 2 };
      if (dir === 'left') return { dx: -1, dy: 0, angle: Math.PI };
      return { dx: 1, dy: 0, angle: 0 };
    };

    const wasStealthed = player.stealthedTimer > 0;
    if (spec.kind !== 'stealth') {
      player.stealthedTimer = 0; // Attacking breaks stealth (with Ambush bonus!)
    }

    if (spec.cost > 0 && player.solarCharge < spec.cost) return;

    // 1. MELEE CLEAVE (Flare Strike, Whisper of the Void, Tectonic Slam, Reality Fracture)
    if (spec.kind === 'melee_cleave') {
      const rangePx = (spec.rangeYards || 6.5) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      let { angle } = getDirAngle(player.dir);
      if (tgt && Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) <= rangePx + 12) {
        angle = Math.atan2(tgt.ref.y - player.y, tgt.ref.x - player.x);
      }

      player.cooldowns[slot] = spec.baseCd * cdMult;
      if (isFlash) this.addPlayerGlimmer(room, player, 6);
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle, color: spec.color, actorId: player.id });

      let hitAny = false;
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rangePx + 10)) {
        const eAng = Math.atan2(h.ref.y - player.y, h.ref.x - player.x);
        const diff = Math.abs(Math.atan2(Math.sin(eAng - angle), Math.cos(eAng - angle)));
        if ((tgt && h.ref === tgt.ref) || diff < 1.25) {
          let base = Math.max(2, Math.floor(Math.random() * 4) + 3 + effPower + rank * 2);
          if (wasStealthed) base = Math.round(base * 1.45);
          const isCrit = wasStealthed || Math.random() < critChance;
          const finalDmg = isCrit ? Math.round(base * 1.75) : base;
          this.applyAuthoritativeDamage(room, player, h, finalDmg, isCrit, spec.name, isRite);
          if (wasStealthed) {
            room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 12, text: 'AMBUSH!', color: '#c084fc', isCrit: true });
          }
          // Terra Overwhelm splash
          if (player.faction === 'Terra') {
            for (const near of this.getAllHostilesInRadius(room, player, h.ref.x, h.ref.y, 44)) {
              if (near.ref !== h.ref) {
                this.applyAuthoritativeDamage(room, player, near, Math.max(2, Math.round(finalDmg * 0.35)), false, 'Overwhelm', false);
              }
            }
          }
          hitAny = true;
        }
      }
      if (hitAny) {
        this.addPlayerGlimmer(room, player, 14 + effStats.resonance * 2);
      }
      return;
    }

    // 2. CAST BEAM (Solar Flare, Astral Convergence)
    if (spec.kind === 'cast_beam') {
      const rangePx = (spec.rangeYards || 25) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      if (!tgt || Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) > rangePx + 14) return;
      if (player.castState) return;

      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.castState = {
        slot,
        specId: spec.id,
        spellName: spec.name,
        color: spec.color,
        targetId: tgt.kind === 'player' ? `p_${tgt.ref.id}` : tgt.ref.id,
        remaining: spec.castTime || 0.95,
        effPower,
        rank,
      };
      room.fxQueue.push({ kind: 'cast_start', actorId: player.id, spellName: spec.name, duration: spec.castTime || 0.95 });
      return;
    }

    // 3. PROJECTILE (Judgement of the Sun, Soul Tithe, Stonekin Boulder, Temporal Lance)
    if (spec.kind === 'projectile') {
      const rangePx = (spec.rangeYards || 21) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      if (!tgt || Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) > rangePx + 14) return;

      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;
      this.addPlayerGlimmer(room, player, (spec.id === 'soul_tithe' ? 24 : 18) + effStats.resonance * 2);
      room.fxQueue.push({ kind: 'sfx', sfx: 'hammer', x: player.x, y: player.y, actorId: player.id });

      room.projectiles.push({
        id: `prj_${crypto.randomUUID().slice(0, 6)}`,
        type: spec.projType || 'orb',
        spellName: spec.name,
        isRite,
        color: spec.color,
        ownerId: player.id,
        x: player.x,
        y: player.y - 8,
        targetKey: tgt.kind === 'player' ? `p_${tgt.ref.id}` : tgt.ref.id,
        speed: spec.projType === 'aether_orb' ? 265 : 225,
        rot: 0,
        dmg: Math.max(3, Math.floor(Math.random() * 4) + 6 + effPower + rank * 2),
      });
      return;
    }

    // 4. GROUND ZONE (Consecrated Ground, Nightfall Plague, Briar Snare, Gravity Well)
    if (spec.kind === 'ground_zone') {
      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const tgt = this.findHostileTargetById(room, player, targetId);
      const zx = tgt && Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) <= 180 ? tgt.ref.x : player.x;
      const zy = tgt && Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) <= 180 ? tgt.ref.y : player.y;

      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: spec.zoneType || 'consecration',
        color: spec.color,
        spellName: spec.name,
        ownerId: player.id,
        x: zx,
        y: zy,
        radius: (spec.rangeYards || 8) * YARD_PX,
        tickDmg: Math.max(2, 2 + rank + Math.floor(effPower * 0.5)),
        age: 0,
        maxAge: 6.2,
        tickTimer: 0.25,
      });
      room.fxQueue.push({ kind: 'fct', x: zx, y: zy - 6, text: spec.name.toUpperCase(), color: spec.color });
      return;
    }

    // 5. SHIELD & THORNBARK (Radiant Bulwark, Graveglass Ward, Mirror Barrier, Barkskin Infusion)
    if (spec.kind === 'shield' || spec.kind === 'thornbark') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      if (isFlash) this.addPlayerGlimmer(room, player, 6);
      const absorb = 13 + effStats.bastion * 3 + rank * 4;
      player.shield = absorb;
      player.shieldTimer = 10;
      if (spec.kind === 'thornbark') {
        player.thornbarkTimer = 8.5;
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: `+${absorb} THORNBARK (35% REFLECT)`, color: '#4ade80' });
      } else {
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: `+${absorb} ${spec.short.toUpperCase()}`, color: spec.color });
      }

      for (const other of room.players.values()) {
        if (other.id !== player.id && !other.isDead && this.parties.areInSameParty(player.id, other.id)) {
          if (Math.hypot(other.x - player.x, other.y - player.y) <= 12 * YARD_PX) {
            const allyShield = Math.round(absorb * 0.55);
            other.shield = Math.max(other.shield, allyShield);
            other.shieldTimer = 10;
            room.fxQueue.push({ kind: 'fct', x: other.x, y: other.y, text: `+${allyShield} SQUAD SHIELD`, color: spec.color });
          }
        }
      }
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    // 6. HEAL & DAYBREAK (Blessing of Dawn, Verdant Renewal, Daybreak)
    if (spec.kind === 'heal' || spec.kind === 'heal_glimmer') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const healAmt = 7 + effStats.bastion * 2 + rank * 3;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      if (spec.kind === 'heal_glimmer') {
        player.weakenTimer = 0;
        player.slowTimer = 0;
        player.snareTimer = 0;
        this.addPlayerGlimmer(room, player, 25);
      }
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 6, colors: ['#4ade80', '#fde047', '#ffffff'] });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y, text: `+${healAmt} HP`, color: '#4ade80' });

      for (const other of room.players.values()) {
        if (other.id !== player.id && !other.isDead && this.parties.areInSameParty(player.id, other.id)) {
          if (Math.hypot(other.x - player.x, other.y - player.y) <= 13 * YARD_PX) {
            const squadHeal = Math.round(healAmt * 0.75);
            other.hp = Math.min(other.maxHp, other.hp + squadHeal);
            room.fxQueue.push({ kind: 'fct', x: other.x, y: other.y, text: `+${squadHeal} HP`, color: '#4ade80' });
            this.parties.syncPlayerVitals(other.id);
          }
        }
      }
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    // 7. NOVA & FROST NOVA (Wrath of the Daystar, Decree of the Sun, Earthshatter, Primal Overwhelm, Frost Nova)
    if (spec.kind === 'nova' || spec.kind === 'frost_nova') {
      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const novaRad = (spec.rangeYards || 12) * YARD_PX;

      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: spec.kind === 'frost_nova' ? 'frost_ring' : 'shockwave',
        color: spec.color,
        ownerId: player.id,
        x: player.x,
        y: player.y,
        radius: novaRad,
        age: 0,
        maxAge: 0.45,
      });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: `${spec.name.toUpperCase()}!`, color: spec.color, isCrit: true });

      if (spec.healNexus) {
        this.healAlliedNexus(room, player, 3);
      }

      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, novaRad)) {
        const dmg = Math.max(5, Math.floor(Math.random() * 5) + 11 + Math.round(effPower * 1.7) + rank * 3);
        this.applyAuthoritativeDamage(room, player, h, dmg, true, spec.name, isRite);
        if ((h.kind === 'entity' && h.ref.isDying) || (h.kind === 'player' && h.ref.isDead)) continue;
        if (spec.kind === 'frost_nova') {
          h.ref.freezeTimer = 3.2;
          room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 10, text: '❄️ FROZEN!', color: '#bae6fd' });
        } else if (spec.id === 'overwhelm_roar') {
          h.ref.weakenTimer = 5.0;
        } else {
          const d = Math.hypot(h.ref.x - player.x, h.ref.y - player.y);
          if (h.kind === 'entity' && h.ref.type === 'mob' && d > 1) {
            h.ref.x += ((h.ref.x - player.x) / d) * 26;
            h.ref.y += ((h.ref.y - player.y) / d) * 26;
          }
        }
      }
      return;
    }

    // 8. DASH / BLINK / WILDSHAPE SURGE
    if (spec.kind === 'dash') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      if (isFlash) this.addPlayerGlimmer(room, player, spec.id === 'wildshape_surge' ? 15 : 12);
      const { dx, dy } = getDirAngle(player.dir);
      const dashDist = ((spec.rangeYards || 8.5) + rank * 0.35) * YARD_PX;
      const startX = player.x;
      const startY = player.y;

      player.x = Math.max(-room.halfW + 16, Math.min(room.halfW - 16, player.x + dx * dashDist));
      player.y = Math.max(-room.halfH + 16, Math.min(room.halfH - 16, player.y + dy * dashDist));

      room.fxQueue.push({
        kind: 'dash',
        actorId: player.id,
        fromX: startX,
        fromY: startY,
        toX: player.x,
        toY: player.y,
        dir: player.dir,
        color: spec.color,
      });

      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 72)) {
        if (spec.id === 'wildshape_surge') {
          const trample = Math.max(3, 5 + effPower + rank * 2);
          this.applyAuthoritativeDamage(room, player, h, trample, false, spec.name, false);
        } else if (spec.id === 'blinding_radiance') {
          h.ref.weakenTimer = 5.0;
          room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 8, text: 'BLINDED -2 ATK', color: '#bae6fd' });
        }
      }
      return;
    }

    // 9. SHADOW STEP (Umbri Signature Teleport Behind Target!)
    if (spec.kind === 'shadow_step') {
      const rangePx = (spec.rangeYards || 16) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      if (!tgt) return;

      player.cooldowns[slot] = spec.baseCd * cdMult;
      this.addPlayerGlimmer(room, player, 14);
      const startX = player.x;
      const startY = player.y;
      const ang = Math.atan2(tgt.ref.y - player.y, tgt.ref.x - player.x);
      player.x = Math.max(-room.halfW + 16, Math.min(room.halfW - 16, tgt.ref.x + Math.cos(ang) * 18));
      player.y = Math.max(-room.halfH + 16, Math.min(room.halfH - 16, tgt.ref.y + Math.sin(ang) * 18));

      room.fxQueue.push({
        kind: 'dash',
        actorId: player.id,
        fromX: startX,
        fromY: startY,
        toX: player.x,
        toY: player.y,
        dir: player.dir,
        color: '#a855f7',
      });
      const stepDmg = Math.max(4, 6 + effPower + rank * 2);
      this.applyAuthoritativeDamage(room, player, tgt, stepDmg, true, 'Shadow Step', false);
      return;
    }

    // 10. SIPHON SOUL / UNMAKE (Umbri Drain & Execute Beams)
    if (spec.kind === 'drain_beam' || spec.kind === 'execute_beam') {
      const rangePx = (spec.rangeYards || 21) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      if (!tgt || Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) > rangePx + 14) return;

      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;

      let dmg = Math.max(4, 8 + Math.round(effPower * 1.5) + rank * 3);
      let isExec = false;
      if (spec.kind === 'execute_beam' && tgt.ref.hp <= tgt.ref.maxHp * 0.5) {
        dmg = Math.round(dmg * 1.5);
        isExec = true;
      }

      room.fxQueue.push({ kind: 'skyBeam', x: tgt.ref.x, y: tgt.ref.y, color: spec.color });
      this.applyAuthoritativeDamage(room, player, tgt, dmg, isExec || spec.kind === 'execute_beam', spec.name, true);

      if (spec.kind === 'drain_beam') {
        const drainHeal = Math.max(2, Math.round(dmg * 0.6));
        player.hp = Math.min(player.maxHp, player.hp + drainHeal);
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: `+${drainHeal} SIPHON`, color: '#4ade80' });
        this.parties.syncPlayerVitals(player.id);
      }
      return;
    }

    // 11. VEIL OF DUSK (Umbri Stealth Vanish!)
    if (spec.kind === 'stealth') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.stealthedTimer = 3.6;
      this.addPlayerGlimmer(room, player, 12);
      room.fxQueue.push({ kind: 'smoke', x: player.x, y: player.y, count: 16 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🌑 STEALTH (3.5s)', color: '#c084fc' });
      return;
    }

    // 12. TIME LOOP PARADOX (Aether Rewind + Cooldown Shave + Echo Prime!)
    if (spec.kind === 'timeloop') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const rewindHp = Math.max(5, Math.round(player.maxHp * 0.25) + rank * 2);
      player.hp = Math.min(player.maxHp, player.hp + rewindHp);
      for (const s of ACTION_SLOTS) {
        if (s !== slot && player.cooldowns[s] > 0) {
          player.cooldowns[s] = Math.max(0, player.cooldowns[s] - (2.2 + rank * 0.3));
        }
      }
      player.echoPrimed = true;
      this.addPlayerGlimmer(room, player, 15);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#38bdf8', '#e0f2fe', '#c084fc'] });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: `⏳ REWIND +${rewindHp} HP & ECHO!`, color: '#7dd3fc', isCrit: true });
      this.parties.syncPlayerVitals(player.id);
    }
  }

  handleHarvestNode(room, player, nodeId) {
    if (player.isDead) return;
    let node = nodeId ? room.entities.find((e) => e.id === nodeId && e.type === 'node') : null;
    if (!node) {
      node = room.entities.find((e) => e.type === 'node' && Math.hypot(e.x - player.x, e.y - player.y) <= 7.2 * YARD_PX);
    }
    if (!node || Math.hypot(node.x - player.x, node.y - player.y) > 7.5 * YARD_PX) return;
    if (node.charges <= 0) return;

    node.charges--;
    if (node.charges === 0) node.rechargeTimer = 11.0;

    const eff = getEffectiveStats(player.prog, player.equipment, player.classId);
    const gain = 32 + eff.resonance * 4;
    this.addPlayerGlimmer(room, player, gain);
    room.fxQueue.push({ kind: 'spark', x: node.x, y: node.y - 10, colors: ['#c084fc', '#e879f9', '#38bdf8'] });
    room.fxQueue.push({ kind: 'fct', x: node.x, y: node.y, text: `+${gain} GLIMMER`, color: '#c084fc' });
    this.awardPlayerXP(player, 25, 'Glimmer Node');
  }

  handlePlantBanner(room, player) {
    if (player.isDead || (player.cooldowns.banner || 0) > 0) return;
    player.cooldowns.banner = 16.0;
    room.banners = room.banners.filter((b) => b.ownerId !== player.id);
    const tag = player.orderTag && player.orderTag !== 'NONE' ? player.orderTag : 'SOL';
    room.banners.push({
      id: `bnr_${crypto.randomUUID().slice(0, 6)}`,
      ownerId: player.id,
      ownerName: player.displayName,
      faction: player.faction,
      orderTag: tag,
      orderName: player.orderName || 'Vanguard Order',
      color: player.orderColor || FACTIONS_META[player.faction]?.color || '#facc15',
      x: player.x,
      y: player.y - 4,
      age: 0,
      maxAge: 20.0,
    });
    room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 12, colors: [player.orderColor || '#facc15', '#ffffff'] });
    room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: `⚑ <${tag}> STANDARD!`, color: player.orderColor || '#facc15', isCrit: true });
    this.broadcastToRoom(room, {
      type: 'sys_msg',
      category: 'chat',
      text: `⚑ ${player.displayName} planted the <${tag}> ${player.orderName} Banner (+1 Power Aura)!`,
    });
  }

  applyAuthoritativeDamage(room, attackerPlayer, targetWrap, dmg, isCrit, spellName, isRite = false) {
    const t = targetWrap.ref;
    if (targetWrap.kind === 'player') {
      this.damagePlayerSession(room, t, dmg, attackerPlayer ? attackerPlayer.displayName : spellName, isCrit, attackerPlayer);
    } else {
      if (!t || t.isDying) return;
      t.hp = Math.max(0, t.hp - dmg);
      t.hitFlash = 0.14;
      if (t.type === 'mob') {
        if (!t.inCombat) {
          room.fxQueue.push({ kind: 'fct', x: t.x, y: t.y - 12, text: 'AGGRO!', color: '#ef4444' });
        }
        t.inCombat = true;
      }
      if (attackerPlayer && t.dammers) t.dammers.add(attackerPlayer.id);

      room.fxQueue.push({
        kind: 'hit',
        x: t.x,
        y: t.y,
        dmg,
        isCrit,
        targetId: t.id,
      });

      if (attackerPlayer && t.type === 'dummy' && t.hp > 0) {
        this.awardPlayerXP(attackerPlayer, 8, '');
      }

      if (t.hp <= 0) {
        this.handleEntityDeath(room, t, attackerPlayer, spellName);
      }
    }

    // Umbri Faction Mechanic: Void Harvest (20% Rite life-leech!)
    if (attackerPlayer && isRite && attackerPlayer.faction === 'Umbri' && !attackerPlayer.isDead) {
      const leech = Math.max(1, Math.round(dmg * 0.2));
      attackerPlayer.hp = Math.min(attackerPlayer.maxHp, attackerPlayer.hp + leech);
      this.parties.syncPlayerVitals(attackerPlayer.id);
    }

    // Aether Faction Mechanic: Spell Echo!
    if (attackerPlayer && isRite && !String(spellName).includes('Echo')) {
      this.triggerSpellEchoIfEligible(room, attackerPlayer, targetWrap, dmg, spellName);
    }
  }

  damagePlayerSession(room, targetPlayer, amount, attackerName, isCrit = false, attackerRef = null) {
    if (targetPlayer.isDead || targetPlayer.hp <= 0) return;

    // Terra Faction Mechanic: Thornbark damage reflection!
    const reflectPct = targetPlayer.thornbarkTimer > 0 ? 0.35 : targetPlayer.faction === 'Terra' ? 0.15 : 0;
    if (reflectPct > 0 && attackerRef) {
      const refl = Math.max(1, Math.round(amount * reflectPct));
      if (attackerRef.hp !== undefined && attackerRef.type === 'mob') {
        this.applyAuthoritativeDamage(room, targetPlayer, { kind: 'entity', ref: attackerRef }, refl, false, 'Thornbark', false);
      } else if (attackerRef.ws) {
        attackerRef.hp = Math.max(1, attackerRef.hp - refl);
        room.fxQueue.push({ kind: 'fct', x: attackerRef.x, y: attackerRef.y - 8, text: `🌿 -${refl} THORNS`, color: '#4ade80' });
      }
    }

    let rem = amount;
    if (targetPlayer.shield > 0) {
      const absorbed = Math.min(targetPlayer.shield, rem);
      targetPlayer.shield -= absorbed;
      rem -= absorbed;
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y, text: `GUARD ${absorbed}`, color: '#38bdf8' });
    }

    if (rem > 0) {
      targetPlayer.hp = Math.max(0, targetPlayer.hp - rem);
      room.fxQueue.push({
        kind: 'player_hit',
        playerId: targetPlayer.id,
        x: targetPlayer.x,
        y: targetPlayer.y,
        dmg: rem,
        isCrit,
        attackerName,
      });
    }

    this.parties.syncPlayerVitals(targetPlayer.id);

    if (targetPlayer.hp <= 0) {
      targetPlayer.isDead = true;
      targetPlayer.respawnTimer = 3.0;
      room.fxQueue.push({ kind: 'smoke', x: targetPlayer.x, y: targetPlayer.y, count: 32 });
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y, text: 'FALLEN', color: '#ef4444', isCrit: true });
      this.broadcastToRoom(room, {
        type: 'sys_msg',
        category: 'combat',
        text: `[Combat] ${targetPlayer.displayName} was cast into the Fall by ${attackerName}!`,
      });
    }
  }

  spawnLootDrops(room, ent) {
    const count = ent.isBoss ? 4 : Math.random() < 0.55 ? 1 : 0;
    if (!room.loot) room.loot = [];
    const drops = [];
    for (let i = 0; i < count; i++) {
      let kind = Math.random() < 0.5 ? 'vital' : 'glimmer';
      if (ent.isBoss && i === 0) kind = 'relic';
      drops.push(kind);
    }
    drops.forEach((kind, i) => {
      const ang = (Math.PI * 2 * i) / Math.max(1, drops.length) + Math.random() * 0.8;
      const dist = drops.length > 1 ? 14 + Math.random() * 8 : 0;
      room.lootSeq = (room.lootSeq || 0) + 1;
      room.loot.push({
        id: `loot_${room.lootSeq}`,
        kind,
        x: Math.round((ent.x + Math.cos(ang) * dist) * 10) / 10,
        y: Math.round((ent.y + Math.sin(ang) * dist * 0.6) * 10) / 10,
        ttl: 28,
        maxTtl: 28,
      });
    });
  }

  tickLoot(room, dt) {
    if (!room.loot || room.loot.length === 0) return;
    for (let i = room.loot.length - 1; i >= 0; i--) {
      const l = room.loot[i];
      l.ttl -= dt;
      if (l.ttl <= 0) {
        room.loot.splice(i, 1);
        continue;
      }
      if (l.ttl > l.maxTtl - 0.6) continue; // brief spawn delay so the pop animation reads
      let taker = null;
      let bestD = 18;
      for (const p of room.players.values()) {
        if (p.isDead) continue;
        const d = Math.hypot(p.x - l.x, p.y - l.y);
        if (d <= bestD) {
          bestD = d;
          taker = p;
        }
      }
      if (!taker) continue;
      room.loot.splice(i, 1);
      if (l.kind === 'vital') {
        const heal = Math.max(3, Math.round(taker.maxHp * 0.25));
        taker.hp = Math.min(taker.maxHp, taker.hp + heal);
        this.parties.syncPlayerVitals(taker.id);
        room.fxQueue.push({ kind: 'fct', x: taker.x, y: taker.y - 14, text: `+${heal} VITAL SHARD`, color: '#f87171' });
      } else if (l.kind === 'glimmer') {
        this.addPlayerGlimmer(room, taker, 30);
        room.fxQueue.push({ kind: 'fct', x: taker.x, y: taker.y - 14, text: '+30 GLIMMER SHARD', color: '#38bdf8' });
      } else {
        this.awardPlayerXP(taker, 60, 'Relic Shard');
        room.fxQueue.push({ kind: 'fct', x: taker.x, y: taker.y - 14, text: '✦ RELIC SHARD +60 XP', color: '#fde047', isCrit: true });
      }
      room.fxQueue.push({ kind: 'smoke', x: l.x, y: l.y, count: 6 });
    }
  }

  handleEntityDeath(room, ent, killerPlayer, killerSpell) {
    if (ent.isDying) return;
    ent.isDying = true;
    ent.deathAge = 0;

    room.fxQueue.push({ kind: 'smoke', x: ent.x, y: ent.y, count: ent.isBoss ? 44 : 28 });

    if (killerPlayer && killerSpell === 'Judgement of the Sun') {
      this.addPlayerGlimmer(room, killerPlayer, 25);
      room.fxQueue.push({ kind: 'fct', x: killerPlayer.x, y: killerPlayer.y - 10, text: '+25 JUDGEMENT GLIMMER', color: '#fde047' });
    }

    // Scheduled Faction Nexus Siege Shard Claim!
    if (ent.type === 'siege_shard' && room.type === ROOM_TYPES.NEXUS_WARZONE) {
      const winnerFac = killerPlayer?.faction || 'Solari';
      const claimerName = killerPlayer?.displayName || 'A Champion';
      if (room.siege) {
        room.siege.active = false;
        room.siege.lastWinnerFaction = winnerFac;
        room.siege.lastClaimedBy = claimerName;
        room.siege.nextSiegeAt = nextThirtyMinBoundary();
      }
      room.fxQueue.push({
        kind: 'fct',
        x: ent.x,
        y: ent.y - 14,
        text: `🏆 ${winnerFac.toUpperCase()} CLAIMED THE NEXUS SHARD!`,
        color: FACTIONS_META[winnerFac]?.color || '#fde047',
        isCrit: true,
      });

      for (const p of room.players.values()) {
        if (p.faction === winnerFac) {
          this.awardPlayerXP(p, 250, `${winnerFac} Siege Victory!`, { addSiegeClaims: 1 });
          p.hp = p.maxHp;
        }
      }
      for (const c of this.clients.values()) {
        c.send({
          type: 'sys_msg',
          category: 'quest',
          text: `🏆 [NEXUS SIEGE] ${claimerName} (${winnerFac}) claimed the Shattered Nexus Shard! All ${winnerFac} champions in Warzone gained +250 XP!`,
        });
      }
      return;
    }

    // Award XP to contributors + co-op Party members in room
    if (ent.xpReward) {
      const recipients = new Set();
      if (ent.dammers) {
        for (const pid of ent.dammers) {
          if (room.players.has(pid)) recipients.add(pid);
          for (const member of this.parties.getPartyMembers(pid)) {
            if (room.players.has(member.id)) recipients.add(member.id);
          }
        }
      }
      if (killerPlayer) recipients.add(killerPlayer.id);

      const squadBonusMult = recipients.size > 1 ? 1.25 : 1.0;
      const xpAmt = Math.round(ent.xpReward * squadBonusMult);

      for (const pid of recipients) {
        const p = room.players.get(pid);
        if (p) {
          this.awardPlayerXP(
            p,
            xpAmt,
            recipients.size > 1 ? `${ent.name} • +25% Co-op` : ent.name,
            { addKills: 1 }
          );
          if (ent.isBoss && ent.dropGear && EQUIPMENT_CATALOG[ent.dropGear]) {
            p.send({
              type: 'sys_msg',
              category: 'quest',
              text: `✨ [BOSS RELIC] ${ent.name} dropped ${EQUIPMENT_CATALOG[ent.dropGear].name}! Equip it in [I] Paperdoll!`,
            });
          }
        }
      }
    }

    // 3v3 Arena Victory Condition
    if (room.type === ROOM_TYPES.ARENA_3V3 && (ent.id === 'red_nexus' || ent.id === 'blue_nexus') && !room.matchEnded) {
      room.matchEnded = true;
      const winningTeam = ent.id === 'red_nexus' ? 'blue' : 'red';
      room.fxQueue.push({
        kind: 'fct',
        x: ent.x,
        y: ent.y,
        text: `${winningTeam.toUpperCase()} TEAM VICTORY!`,
        color: '#facc15',
        isCrit: true,
      });

      for (const p of room.players.values()) {
        const won = (p.team || 'blue') === winningTeam;
        p.send({ type: 'arena_result', won, winningTeam });
        if (won) this.awardPlayerXP(p, 120, '3v3 Arena Victory', { addArenaWins: 1 });
      }

      setTimeout(() => {
        for (const p of Array.from(room.players.values())) {
          this.joinRoom(p, ROOM_TYPES.NEXUS_WARZONE);
        }
        this.rooms.delete(room.id);
      }, 3000);
      return;
    }

    // Outpost / Warzone Nexus Respawn
    if (ent.type === 'outpost_nexus' || ent.type === 'nexus') {
      room.fxQueue.push({ kind: 'fct', x: ent.x, y: ent.y, text: `${ent.name.toUpperCase()} SHATTERED!`, color: '#38bdf8', isCrit: true });
      setTimeout(() => {
        if (!this.rooms.has(room.id)) return;
        ent.isDying = false;
        ent.deathAge = 0;
        ent.hp = ent.maxHp;
        ent.dammers = new Set();
        if (!room.entities.includes(ent)) room.entities.push(ent);
      }, 10000);
      return;
    }

    if (ent.type === 'mob') this.spawnLootDrops(room, ent);

    // Standard Mob / Dummy / Dungeon Boss Respawn
    const template = {
      ...ent,
      hp: ent.maxHp,
      isDying: false,
      deathAge: 0,
      inCombat: false,
      weakenTimer: 0,
      slowTimer: 0,
      snareTimer: 0,
      freezeTimer: 0,
      hitFlash: 0,
      x: ent.origX ?? ent.x,
      y: ent.origY ?? ent.y,
      dammers: new Set(),
    };
    setTimeout(() => {
      if (!this.rooms.has(room.id)) return;
      if (template.type === 'dummy' || template.type === 'mob') {
        room.entities.push(template);
        room.fxQueue.push({ kind: 'smoke', x: template.x, y: template.y, count: 16 });
      }
    }, ent.isBoss ? 11000 : 6500);
  }

  // ==========================================
  // Authoritative Progression (XP, Levels, Stats, Ranks)
  // ==========================================
  awardPlayerXP(player, amount, reason = '', statsMetaPatch = null) {
    if (amount <= 0) return;
    player.prog.xp += amount;
    let leveled = false;

    while (player.prog.xp >= xpForNextLevel(player.prog.level)) {
      player.prog.xp -= xpForNextLevel(player.prog.level);
      player.prog.level++;
      player.prog.statPoints += 3;
      player.prog.skillPoints += 1;
      leveled = true;
    }

    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    if (leveled) {
      player.hp = player.maxHp;
      const room = this.rooms.get(player.roomId);
      if (room) {
        room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#fde047', '#38bdf8', '#4ade80', '#ffffff'] });
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: `LEVEL ${player.prog.level}!`, color: '#fde047', isCrit: true });
      }
    }

    this.accounts.saveProgression(player.id, player.prog, statsMetaPatch);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
      xpGained: amount,
      reason,
      leveled,
    });
    this.parties.syncPlayerVitals(player.id);
  }

  handleAllocateStat(player, statKey) {
    if (player.prog.statPoints <= 0 || !(statKey in player.prog.stats)) return;
    player.prog.statPoints--;
    player.prog.stats[statKey]++;
    const prevMax = player.maxHp;
    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - prevMax));
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
    this.parties.syncPlayerVitals(player.id);
  }

  handleUpgradeRank(player, slot) {
    if (player.prog.skillPoints <= 0 || !(slot in player.prog.ranks)) return;
    if (player.prog.ranks[slot] >= 5) return;
    player.prog.skillPoints--;
    player.prog.ranks[slot]++;
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
  }

  handleResetProgression(player) {
    player.prog = createDefaultProgression();
    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.hp = player.maxHp;
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
  }

  // ==========================================
  // Social Layer: Chat, Faction (/f), Party (/p), Order (/o), /siege & Emotes
  // ==========================================
  handleChat(room, sender, rawChannel, rawText) {
    let text = String(rawText || '').trim().slice(0, 140);
    if (!text) return;

    let channel = rawChannel || 'say';

    if (text.startsWith('/')) {
      const spaceIdx = text.indexOf(' ');
      const cmd = (spaceIdx === -1 ? text.slice(1) : text.slice(1, spaceIdx)).toLowerCase();
      const arg = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

      if (cmd === 'f' || cmd === 'faction') {
        channel = 'faction';
        text = arg;
      } else if (cmd === 'p' || cmd === 'party') {
        channel = 'party';
        text = arg;
      } else if (cmd === 'o' || cmd === 'g' || cmd === 'order' || cmd === 'guild') {
        channel = 'order';
        text = arg;
      } else if (cmd === 's' || cmd === 'say') {
        channel = 'say';
        text = arg;
      } else if (cmd === 'invite' || cmd === 'inv') {
        this.parties.invitePlayer(sender, arg);
        return;
      } else if (cmd === 'leave') {
        this.parties.leaveParty(sender);
        return;
      } else if (cmd === 'banner') {
        if (room) this.handlePlantBanner(room, sender);
        return;
      } else if (cmd === 'siege') {
        const wz = Array.from(this.rooms.values()).find((r) => r.type === ROOM_TYPES.NEXUS_WARZONE);
        if (wz) this.spawnWarzoneSiegeShard(wz, true);
        return;
      } else if (EMOTES_CATALOG[cmd]) {
        if (room) this.handleEmote(room, sender, cmd);
        return;
      }
    }

    if (!text) return;

    const packet = {
      type: 'chat_msg',
      channel,
      senderId: sender.id,
      senderName: sender.displayName,
      faction: sender.faction,
      orderTag: sender.orderTag,
      text,
      ts: Date.now(),
    };

    if (channel === 'faction') {
      for (const c of this.clients.values()) {
        if (c.faction === sender.faction) c.send(packet);
      }
    } else if (channel === 'party') {
      const party = this.parties.getPartyForPlayer(sender.id);
      if (!party) {
        sender.send({ type: 'sys_msg', category: 'party', text: '[Party] You are not in a squad yet! Click a player or type /invite <name>.' });
        return;
      }
      this.parties.broadcastToParty(party.id, packet);
    } else if (channel === 'order') {
      const tag = sender.orderTag;
      if (!tag || tag === 'NONE') {
        sender.send({ type: 'sys_msg', category: 'chat', text: '[Order] Set an Order Banner in [G] Account first!' });
        return;
      }
      for (const c of this.clients.values()) {
        if (c.orderTag === tag) c.send(packet);
      }
    } else {
      sender.speechBubble = {
        text: text.slice(0, 68),
        expiresAt: Date.now() + 5500,
      };
      if (room) this.broadcastToRoom(room, packet);
      else sender.send(packet);
    }
  }

  handleEmote(room, sender, emoteId) {
    const em = EMOTES_CATALOG[emoteId];
    if (!em) return;
    sender.activeEmote = { emoteId, expiresAt: Date.now() + 3600 };
    this.broadcastToRoom(room, {
      type: 'emote_fx',
      playerId: sender.id,
      playerName: sender.displayName,
      faction: sender.faction,
      emoteId,
      icon: em.icon,
      emoteText: em.text,
    });
  }

  // ==========================================
  // 20 Hz Tick Simulation Loop
  // ==========================================
  tickAllRooms() {
    this.processMatchmaking();
    const dt = TICK_MS / 1000;
    const now = Date.now();

    for (const room of this.rooms.values()) {
      this.tickRoom(room, dt, now);
    }
  }

  tickRoom(room, dt, now) {
    // Scheduled 30-Minute Warzone Siege Event Trigger
    if (room.type === ROOM_TYPES.NEXUS_WARZONE && room.siege) {
      if (!room.siege.active && now >= room.siege.nextSiegeAt) {
        this.spawnWarzoneSiegeShard(room, true);
      }
    }

    for (const p of room.players.values()) {
      for (const k in p.cooldowns) {
        if (p.cooldowns[k] > 0) p.cooldowns[k] = Math.max(0, p.cooldowns[k] - dt);
      }
      if (p.portalCooldown > 0) p.portalCooldown = Math.max(0, p.portalCooldown - dt);
      if (p.shield > 0) {
        p.shieldTimer -= dt;
        if (p.shieldTimer <= 0) p.shield = 0;
      }
      if (p.weakenTimer > 0) p.weakenTimer = Math.max(0, p.weakenTimer - dt);
      if (p.slowTimer > 0) p.slowTimer = Math.max(0, p.slowTimer - dt);
      if (p.snareTimer > 0) p.snareTimer = Math.max(0, p.snareTimer - dt);
      if (p.freezeTimer > 0) p.freezeTimer = Math.max(0, p.freezeTimer - dt);
      if (p.stealthedTimer > 0) p.stealthedTimer = Math.max(0, p.stealthedTimer - dt);
      if (p.thornbarkTimer > 0) p.thornbarkTimer = Math.max(0, p.thornbarkTimer - dt);
      if (p.zenithTimer > 0) p.zenithTimer = Math.max(0, p.zenithTimer - dt);

      if (p.speechBubble && p.speechBubble.expiresAt <= now) p.speechBubble = null;
      if (p.activeEmote && p.activeEmote.expiresAt <= now) p.activeEmote = null;

      if (p.isDead) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.isDead = false;
          p.hp = p.maxHp;
          p.shield = 0;
          p.solarCharge = 0;
          const cfg = ROOM_CONFIGS[room.type] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
          p.x = cfg.spawnX;
          p.y = room.type === ROOM_TYPES.ARENA_3V3 && p.team === 'red' ? -170 : cfg.spawnY;
          p.send({ type: 'player_respawned', x: p.x, y: p.y, hp: p.hp });
          this.parties.syncPlayerVitals(p.id);
        }
        continue;
      }

      if (p.castState) {
        p.castState.remaining -= dt;
        if (p.castState.remaining <= 0) {
          const cs = p.castState;
          p.castState = null;
          const tgt = this.findHostileTargetById(room, p, cs.targetId);
          if (tgt) {
            room.fxQueue.push({ kind: 'skyBeam', x: tgt.ref.x, y: tgt.ref.y, color: cs.color });
            const dmg = Math.max(5, Math.floor(Math.random() * 5) + 10 + cs.effPower * 2 + cs.rank * 3);
            this.applyAuthoritativeDamage(room, p, tgt, dmg, true, cs.spellName, true);
            for (const splash of this.getAllHostilesInRadius(room, p, tgt.ref.x, tgt.ref.y, 56)) {
              if (splash.ref !== tgt.ref) {
                this.applyAuthoritativeDamage(room, p, splash, Math.round(dmg * 0.55), false, cs.spellName, false);
              }
            }
          }
        }
      }

      // Check Waygate / Rift Portals in Room
      if (p.portalCooldown <= 0) {
        for (const ent of room.entities) {
          if (ent.type === 'portal' && ent.targetRoom && Math.hypot(p.x - ent.x, p.y - ent.y) < 22) {
            if (!p.portalQuestDone && ent.targetRoom === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            this.joinRoom(p, ent.targetRoom);
            break;
          }
        }
      }
    }

    if (room.players.size === 0) return;

    // 2. AI Allies in 3v3 Arena
    for (const ally of room.allies) {
      const foes = [];
      for (const e of room.entities) {
        if (!e.isDying && (e.type === 'mob' || e.id === 'red_nexus')) foes.push({ kind: 'entity', ref: e });
      }
      for (const p of room.players.values()) {
        if (!p.isDead && p.stealthedTimer <= 0 && p.team === 'red') foes.push({ kind: 'player', ref: p });
      }
      if (foes.length === 0) continue;
      foes.sort((a, b) => Math.hypot(a.ref.x - ally.x, a.ref.y - ally.y) - Math.hypot(b.ref.x - ally.x, b.ref.y - ally.y));
      const tgt = foes[0];
      const d = Math.hypot(tgt.ref.x - ally.x, tgt.ref.y - ally.y);
      if (d > ally.range) {
        ally.x += ((tgt.ref.x - ally.x) / d) * ally.speed * dt;
        ally.y += ((tgt.ref.y - ally.y) / d) * ally.speed * dt;
      } else {
        ally.cd -= dt;
        if (ally.cd <= 0) {
          ally.cd = 1.9 + Math.random() * 0.4;
          room.projectiles.push({
            id: `prj_${crypto.randomUUID().slice(0, 6)}`,
            type: 'orb',
            ownerId: null,
            team: 'blue',
            x: ally.x,
            y: ally.y - 8,
            targetKey: tgt.kind === 'player' ? `p_${tgt.ref.id}` : tgt.ref.id,
            speed: 195,
            color: ally.spriteKey === 'allyMage' ? '#38bdf8' : '#4ade80',
            dmg: ally.dmg || 2,
          });
        }
      }
    }

    // 3. Entities (Mobs, Bosses, Nodes)
    for (let i = room.entities.length - 1; i >= 0; i--) {
      const e = room.entities[i];
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.weakenTimer > 0) e.weakenTimer = Math.max(0, e.weakenTimer - dt);
      if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
      if (e.snareTimer > 0) e.snareTimer = Math.max(0, e.snareTimer - dt);
      if (e.freezeTimer > 0) e.freezeTimer = Math.max(0, e.freezeTimer - dt);

      if (e.type === 'node' && e.charges === 0 && e.rechargeTimer > 0) {
        e.rechargeTimer -= dt;
        if (e.rechargeTimer <= 0) e.charges = e.maxCharges;
      }

      if (e.isDying) {
        e.deathAge += dt;
        e.y -= 18 * dt;
        if (e.deathAge >= 0.65) room.entities.splice(i, 1);
        continue;
      }

      if (e.type === 'mob') {
        if (e.freezeTimer > 0) continue; // Frozen by Frost Nova!

        let nearestPlayer = null;
        let bestD = Infinity;
        for (const p of room.players.values()) {
          if (p.isDead || p.stealthedTimer > 0) continue; // Stealth drops mob aggro!
          if (room.type === ROOM_TYPES.ARENA_3V3 && p.team === 'red') continue;
          const d = Math.hypot(p.x - e.x, p.y - e.y);
          if (d < bestD) {
            bestD = d;
            nearestPlayer = p;
          }
        }

        if (!nearestPlayer && e.inCombat) {
          e.inCombat = false;
        } else if (nearestPlayer && !e.inCombat && bestD <= e.aggroRange) {
          e.inCombat = true;
          room.fxQueue.push({ kind: 'fct', x: e.x, y: e.y - 12, text: 'AGGRO!', color: '#ef4444' });
        }

        const speedMult = e.snareTimer > 0 ? 0.35 : e.slowTimer > 0 ? 0.55 : 1.0;

        if (e.inCombat && nearestPlayer) {
          const origX = e.origX ?? e.x;
          const origY = e.origY ?? e.y;
          const distHome = Math.hypot(origX - e.x, origY - e.y);
          if (room.type !== ROOM_TYPES.ARENA_3V3 && distHome > 240) {
            e.inCombat = false;
            e.x = origX;
            e.y = origY;
            e.hp = e.maxHp;
            e.dammers = new Set();
            room.fxQueue.push({ kind: 'fct', x: e.x, y: e.y, text: 'EVADED', color: '#94a3b8' });
            continue;
          }

          if (bestD > e.attackRange) {
            e.x += ((nearestPlayer.x - e.x) / bestD) * e.speed * speedMult * dt;
            e.y += ((nearestPlayer.y - e.y) / bestD) * e.speed * speedMult * dt;
          } else {
            e.atkTimer = (e.atkTimer || 0) + dt;
            if (e.atkTimer >= 1.85) {
              e.atkTimer = 0;
              const rawDmg = Math.max(1, (e.damage || 3) - (e.weakenTimer > 0 ? 2 : 0));
              this.damagePlayerSession(room, nearestPlayer, rawDmg, e.name, false, e);
            }
          }
        } else if (room.type === ROOM_TYPES.ARENA_3V3) {
          const blueNexus = room.entities.find((n) => n.id === 'blue_nexus' && !n.isDying);
          if (blueNexus) {
            const dn = Math.hypot(blueNexus.x - e.x, blueNexus.y - e.y);
            if (dn > 32) {
              e.x += ((blueNexus.x - e.x) / dn) * e.speed * speedMult * dt;
              e.y += ((blueNexus.y - e.y) / dn) * e.speed * speedMult * dt;
            } else {
              e.atkTimer = (e.atkTimer || 0) + dt;
              if (e.atkTimer >= 2.0) {
                e.atkTimer = 0;
                this.applyAuthoritativeDamage(room, null, { kind: 'entity', ref: blueNexus }, 2, false, e.name, false);
              }
            }
          }
        }
      }
    }

    // 4. Projectiles
    for (let i = room.projectiles.length - 1; i >= 0; i--) {
      const prj = room.projectiles[i];
      const owner = prj.ownerId ? room.players.get(prj.ownerId) : null;
      let targetObj = null;
      if (String(prj.targetKey).startsWith('p_')) {
        const tp = room.players.get(String(prj.targetKey).slice(2));
        if (tp && !tp.isDead) targetObj = { kind: 'player', ref: tp };
      } else {
        const te = room.entities.find((e) => e.id === prj.targetKey && !e.isDying);
        if (te) targetObj = { kind: 'entity', ref: te };
      }

      if (!targetObj) {
        room.projectiles.splice(i, 1);
        continue;
      }

      const dx = targetObj.ref.x - prj.x;
      const dy = targetObj.ref.y - 8 - prj.y;
      const d = Math.hypot(dx, dy);
      prj.rot = (prj.rot || 0) + 18 * dt;
      if (d < 12) {
        this.applyAuthoritativeDamage(
          room,
          owner,
          targetObj,
          prj.dmg,
          false,
          prj.spellName || 'Aetheric Blast',
          Boolean(prj.isRite)
        );
        if (owner && prj.type === 'boulder' && owner.faction === 'Terra') {
          for (const near of this.getAllHostilesInRadius(room, owner, targetObj.ref.x, targetObj.ref.y, 48)) {
            if (near.ref !== targetObj.ref) {
              this.applyAuthoritativeDamage(room, owner, near, Math.max(2, Math.round(prj.dmg * 0.4)), false, 'Overwhelm', false);
            }
          }
        }
        room.projectiles.splice(i, 1);
      } else {
        prj.x += (dx / d) * prj.speed * dt;
        prj.y += (dy / d) * prj.speed * dt;
      }
    }

    // 5. Ground Zones (Consecration, Nightfall Plague, Briar Snare, Gravity Well, Shockwaves)
    for (let i = room.groundZones.length - 1; i >= 0; i--) {
      const gz = room.groundZones[i];
      gz.age += dt;
      if (['consecration', 'plague', 'briar', 'gravity'].includes(gz.type)) {
        const caster = room.players.get(gz.ownerId) || null;
        if (caster && gz.type === 'gravity') {
          for (const h of this.getAllHostilesInRadius(room, caster, gz.x, gz.y, gz.radius)) {
            if (h.kind === 'entity' && h.ref.isDying) continue;
            const dist = Math.hypot(gz.x - h.ref.x, gz.y - h.ref.y);
            if (dist > 10 && (h.kind === 'player' || h.ref.type === 'mob')) {
              h.ref.x += ((gz.x - h.ref.x) / dist) * 28 * dt;
              h.ref.y += ((gz.y - h.ref.y) / dist) * 28 * dt;
            }
          }
        }
        gz.tickTimer -= dt;
        if (gz.tickTimer <= 0) {
          gz.tickTimer = 1.4;
          if (caster) {
            for (const h of this.getAllHostilesInRadius(room, caster, gz.x, gz.y, gz.radius)) {
              if (h.kind === 'entity' && h.ref.isDying) continue;
              if (gz.type === 'plague') h.ref.slowTimer = 1.8;
              if (gz.type === 'briar') h.ref.snareTimer = 1.8;
              this.applyAuthoritativeDamage(room, caster, h, gz.tickDmg, false, gz.spellName || 'Ground Rite', true);
            }
          }
        }
      }
      if (gz.age >= gz.maxAge) room.groundZones.splice(i, 1);
    }

    // 6. Planted Order Banners
    for (let i = room.banners.length - 1; i >= 0; i--) {
      room.banners[i].age += dt;
      if (room.banners[i].age >= room.banners[i].maxAge) {
        room.banners.splice(i, 1);
      }
    }

    // 6b. Loot Shard pickups
    this.tickLoot(room, dt);

    // 7. Broadcast 20 Hz Authoritative Snapshot
    const snapshot = this.buildSnapshot(room, now);
    const fx = room.fxQueue.length > 0 ? room.fxQueue.splice(0, room.fxQueue.length) : undefined;
    this.broadcastToRoom(room, {
      type: 'world_state',
      roomId: room.id,
      onlineTotal: this.clients.size,
      ...snapshot,
      fx,
    });
  }

  buildSnapshot(room, now = Date.now()) {
    const players = [];
    for (const p of room.players.values()) {
      players.push({
        id: p.id,
        name: p.displayName,
        faction: p.faction,
        classId: p.classId,
        equipment: p.equipment,
        orderTag: p.orderTag,
        orderColor: p.orderColor,
        tcgLinked: p.tcgLinked,
        level: p.prog.level,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        z: Math.round(p.z),
        dir: p.dir,
        isMoving: p.isMoving,
        hp: p.hp,
        maxHp: p.maxHp,
        shield: p.shield,
        solarCharge: p.solarCharge,
        maxSolarCharge: p.maxSolarCharge,
        isDead: p.isDead,
        isCasting: Boolean(p.castState),
        stealthed: p.stealthedTimer > 0,
        thornbark: p.thornbarkTimer > 0,
        zenith: p.zenithTimer > 0,
        frozen: p.freezeTimer > 0,
        team: p.team,
        bubble: p.speechBubble ? p.speechBubble.text : null,
        emote: p.activeEmote ? p.activeEmote.emoteId : null,
      });
    }

    const entities = room.entities.map((e) => ({
      id: e.id,
      name: e.name,
      sub: e.sub,
      type: e.type,
      faction: e.faction,
      team: e.team,
      isBoss: e.isBoss || false,
      spriteKey: e.spriteKey,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      hp: e.hp,
      maxHp: e.maxHp,
      charges: e.charges,
      maxCharges: e.maxCharges,
      radius: e.radius,
      frozen: (e.freezeTimer || 0) > 0,
      inCombat: Boolean(e.inCombat),
      isDying: Boolean(e.isDying),
      deathAge: e.deathAge ? Math.round(e.deathAge * 100) / 100 : 0,
    }));

    const allies = room.allies.map((a) => ({
      id: a.id,
      name: a.name,
      spriteKey: a.spriteKey,
      x: Math.round(a.x * 10) / 10,
      y: Math.round(a.y * 10) / 10,
    }));

    const projectiles = room.projectiles.map((prj) => ({
      id: prj.id,
      type: prj.type,
      x: Math.round(prj.x * 10) / 10,
      y: Math.round(prj.y * 10) / 10,
      rot: Math.round((prj.rot || 0) * 100) / 100,
      color: prj.color,
    }));

    const groundZones = room.groundZones.map((gz) => ({
      id: gz.id,
      type: gz.type,
      color: gz.color,
      x: Math.round(gz.x),
      y: Math.round(gz.y),
      radius: Math.round(gz.radius),
      age: Math.round(gz.age * 100) / 100,
      maxAge: gz.maxAge,
    }));

    const banners = room.banners.map((b) => ({
      id: b.id,
      ownerName: b.ownerName,
      orderTag: b.orderTag,
      orderName: b.orderName,
      color: b.color,
      x: Math.round(b.x),
      y: Math.round(b.y),
    }));

    let siegeState = undefined;
    if (room.siege) {
      const shard = room.entities.find((e) => e.id === 'siege_shard' && !e.isDying);
      siegeState = {
        active: Boolean(shard),
        shardHp: shard ? shard.hp : 0,
        shardMaxHp: shard ? shard.maxHp : 85,
        nextInSec: Math.max(0, Math.round((room.siege.nextSiegeAt - now) / 1000)),
        lastWinnerFaction: room.siege.lastWinnerFaction,
        lastClaimedBy: room.siege.lastClaimedBy,
      };
    }

    return {
      players,
      entities,
      allies,
      projectiles,
      groundZones,
      banners,
      loot: (room.loot || []).map((l) => ({ id: l.id, kind: l.kind, x: l.x, y: l.y, ttl: Math.round(l.ttl * 10) / 10 })),
      siegeState,
    };
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
}
