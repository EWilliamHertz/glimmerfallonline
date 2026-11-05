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
  TORMENT_LEVELS,
  getTormentConfig,
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
    this.getOrCreatePublicRoom(ROOM_TYPES.CELESTIAL_ASCENT);

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
          y: 52,
          origX: 0,
          origY: 52,
          hp: 30,
          maxHp: 30,
          xpReward: 30,
          radius: 14,
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
          id: 'dummy_2',
          name: 'Armored Training Post',
          sub: 'Lv.5 Resilient Training Post',
          type: 'dummy',
          spriteKey: 'dummy',
          x: 0,
          y: -45,
          origX: 0,
          origY: -45,
          hp: 120,
          maxHp: 120,
          xpReward: 65,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
    } else if (room.type === ROOM_TYPES.NEXUS_WARZONE) {
      // 4 Faction 300-HP Outpost Nexuses anchored in the 4 continental quadrants (Late-Game Torment)
      const outposts = [
        { id: 'outpost_Terra', faction: 'Terra', name: 'Terra Forest Outpost Nexus', spriteKey: 'nexusGreen', x: -850, y: -650 },
        { id: 'outpost_Umbri', faction: 'Umbri', name: 'Umbri Shadow Outpost Nexus', spriteKey: 'nexusPurple', x: 850, y: -650 },
        { id: 'outpost_Solari', faction: 'Solari', name: 'Solari Radiant Outpost Nexus', spriteKey: 'nexusGold', x: -850, y: 650 },
        { id: 'outpost_Aether', faction: 'Aether', name: 'Aether Astral Outpost Nexus', spriteKey: 'nexusCyan', x: 850, y: 650 },
      ];
      for (const op of outposts) {
        room.entities.push({
          id: op.id,
          name: op.name,
          sub: `300 HP ${op.faction} Outpost Nexus [Torment]`,
          type: 'outpost_nexus',
          faction: op.faction,
          spriteKey: op.spriteKey,
          x: op.x,
          y: op.y,
          origX: op.x,
          origY: op.y,
          hp: 300,
          maxHp: 300,
          xpReward: 1200,
          radius: 24,
          hitFlash: 0,
          dammers: new Set(),
        });
      }

      // Central Caldera: Shattered Nexus Shard (Torment Core)
      room.entities.push({
        id: 'siege_shard',
        name: 'Shattered Nexus Shard',
        sub: '⚡ Continental Nexus Core (Torment PvPvE)',
        type: 'siege_shard',
        isBoss: true,
        spriteKey: 'siegeShard',
        x: 0,
        y: 0,
        origX: 0,
        origY: 0,
        hp: 850,
        maxHp: 850,
        xpReward: 2500,
        radius: 24,
        hitFlash: 0,
        dammers: new Set(),
      });

      // Vanguard Colossus Training Post
      room.entities.push({
        id: 'val_dummy',
        name: 'Vanguard Colossus Post',
        sub: 'Lv.30 Torment Target Post',
        type: 'dummy',
        spriteKey: 'dummy',
        x: 60,
        y: 1440,
        origX: 60,
        origY: 1440,
        hp: 600,
        maxHp: 600,
        xpReward: 200,
        radius: 16,
        hitFlash: 0,
      });

      // 4 Grand Regional World Bosses across the Open World Continent (Late-Game Torment)
      room.entities.push(
        {
          id: 'terra_world_boss',
          name: 'Elder Ironwood Colossus',
          sub: '★ Lv.32 Terra Continent World Boss',
          type: 'mob',
          isBoss: true,
          dropGear: 'ironwood_armor',
          spriteKey: 'graniteBoss',
          x: -950,
          y: -850,
          origX: -950,
          origY: -850,
          hp: 1250,
          maxHp: 1250,
          damage: 42,
          xpReward: 2600,
          speed: 38,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'umbri_world_boss',
          name: 'Malakor the Soulreaper',
          sub: '★ Lv.32 Umbri Continent World Boss',
          type: 'mob',
          isBoss: true,
          dropGear: 'scythe_soulreaper',
          spriteKey: 'umbriBoss',
          x: 950,
          y: -850,
          origX: 950,
          origY: -850,
          hp: 1150,
          maxHp: 1150,
          damage: 46,
          xpReward: 2600,
          speed: 42,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'solari_world_boss',
          name: 'High Sunfire Juggernaut',
          sub: '★ Lv.32 Solari Continent World Boss',
          type: 'mob',
          isBoss: true,
          dropGear: 'sunfire_greatsword',
          spriteKey: 'solariBoss',
          x: -950,
          y: 850,
          origX: -950,
          origY: 850,
          hp: 1250,
          maxHp: 1250,
          damage: 44,
          xpReward: 2600,
          speed: 39,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'aether_world_boss',
          name: 'Continuum Singularity Paradox',
          sub: '★ Lv.32 Aether Continent World Boss',
          type: 'mob',
          isBoss: true,
          dropGear: 'chronos_singularity_core',
          spriteKey: 'aetherBoss',
          x: 950,
          y: 850,
          origX: 950,
          origY: 850,
          hp: 1180,
          maxHp: 1180,
          damage: 48,
          xpReward: 2600,
          speed: 42,
          aggroRange: 135,
          attackRange: 34,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        }
      );

      // Strategic Glimmer Leyline Nodes across valleys, mountain passes, and wilderness
      const continentalNodes = [
        { id: 'node_sanctuary', name: 'Sanctuary Vale Font', x: 0, y: 1380 },
        { id: 'node_pass', name: 'Whispering Pass Font', x: 0, y: 700 },
        { id: 'node_center_s', name: 'Caldera South Font', x: 0, y: 180 },
        { id: 'node_center_n', name: 'Caldera North Font', x: 0, y: -180 },
        { id: 'node_ruins', name: 'Forgotten Ruins Keystone Font', x: 0, y: -900 },
        { id: 'node_terra', name: 'Terra Blossom Spire', x: -1100, y: -700 },
        { id: 'node_umbri', name: 'Sepulcher Shadow Spire', x: 1100, y: -700 },
        { id: 'node_solari', name: 'Dawnfire Solar Font', x: -1100, y: 700 },
        { id: 'node_aether', name: 'Aether Resonance Crystal', x: 1100, y: 700 },
      ];
      for (const nd of continentalNodes) {
        room.entities.push({
          id: nd.id,
          name: nd.name,
          sub: 'Aether Leyline Crystal [E]',
          type: 'node',
          spriteKey: 'node',
          x: nd.x,
          y: nd.y,
          charges: 5,
          maxCharges: 5,
          rechargeTimer: 0,
          radius: 15,
          hitFlash: 0,
        });
      }

      // 4 Ancient Leyline Shrines [E]
      const continentalShrines = [
        { id: 'shrine_solari', name: 'Solari Radiant Shrine', sub: 'Ancient Leyline [E] • Radiant Wrath', affinity: 'solari', buffName: 'Solar Wrath', x: -550, y: 550 },
        { id: 'shrine_umbri', name: 'Umbri Void Obelisk', sub: 'Ancient Leyline [E] • Void Leech', affinity: 'umbri', buffName: 'Void Step', x: 550, y: -550 },
        { id: 'shrine_terra', name: 'Terra Bastion Monolith', sub: 'Ancient Leyline [E] • Primal Bastion', affinity: 'terra', buffName: 'Stone Ward', x: -550, y: -550 },
        { id: 'shrine_aether', name: 'Aether Chrono Spire', sub: 'Ancient Leyline [E] • Chrono Surge', affinity: 'aether', buffName: 'Chrono Surge', x: 550, y: 550 },
      ];
      for (const sh of continentalShrines) {
        room.entities.push({
          id: sh.id,
          name: sh.name,
          sub: sh.sub,
          type: 'shrine',
          affinity: sh.affinity,
          buffName: sh.buffName,
          spriteKey: 'crystalPillar',
          x: sh.x,
          y: sh.y,
          charges: 5,
          maxCharges: 5,
          rechargeTimer: 0,
          radius: 20,
          hitFlash: 0,
        });
      }

      // Roaming Mob Packs across the Mountains, Ruins, Wilderness, and Caldera (10x Late-Game Scaling)
      const openWorldMobs = [
        // Whispering Mountain Pass Mobs (Hike north through the crags)
        { id: 'pass_mob_1', name: 'Granite Ridge Sentinel', sub: 'Lv.28 Mountain Golem', spriteKey: 'graniteBoss', x: -60, y: 880, hp: 420, maxHp: 420, damage: 24, xpReward: 750, speed: 40, aggroRange: 110, attackRange: 30, radius: 18 },
        { id: 'pass_mob_2', name: 'Whispering Pass Raider', sub: 'Lv.29 Highland Marauder', spriteKey: 'voidStalker', x: 70, y: 640, hp: 380, maxHp: 380, damage: 26, xpReward: 800, speed: 52, aggroRange: 115, attackRange: 28, radius: 15 },
        { id: 'pass_mob_3', name: 'High Crag Behemoth', sub: 'Lv.30 Ridge Colossus', spriteKey: 'graniteBoss', x: -80, y: 460, hp: 540, maxHp: 540, damage: 32, xpReward: 1000, speed: 38, aggroRange: 120, attackRange: 32, radius: 20 },
        // North Forgotten Ruins Plateau (Ancient Megaliths)
        { id: 'ruin_guard_1', name: 'Ancient Keystone Golem', sub: 'Lv.30 Forgotten Golem', spriteKey: 'graniteBoss', x: -90, y: -750, hp: 520, maxHp: 520, damage: 32, xpReward: 1050, speed: 40, aggroRange: 115, attackRange: 30, radius: 18 },
        { id: 'ruin_guard_2', name: 'Lost Shard Sentinel', sub: 'Lv.30 Keystone Sentinel', spriteKey: 'mobSolari', x: 90, y: -750, hp: 500, maxHp: 500, damage: 32, xpReward: 1000, speed: 52, aggroRange: 115, attackRange: 30, radius: 16 },
        { id: 'ruin_boss_field', name: 'The Prismatic Overlord', sub: '★ Lv.34 Megalith World Boss', isBoss: true, dropGear: 'prismatic_keystone', spriteKey: 'graniteBoss', x: 0, y: -1150, hp: 1300, maxHp: 1300, damage: 46, xpReward: 2750, speed: 38, aggroRange: 135, attackRange: 34, radius: 24 },
        // Terra Ironwood Wilds (NW)
        { id: 'ter_mob_1', name: 'Bramble Treant', sub: 'Lv.29 Terra Guardian', spriteKey: 'terraWarden', x: -680, y: -520, hp: 440, maxHp: 440, damage: 28, xpReward: 850, speed: 52, aggroRange: 115, attackRange: 28, radius: 16 },
        { id: 'ter_mob_2', name: 'Ironwood Stonekin', sub: 'Lv.30 Forest Sentinel', spriteKey: 'terraWarden', x: -1020, y: -480, hp: 480, maxHp: 480, damage: 30, xpReward: 950, speed: 50, aggroRange: 115, attackRange: 28, radius: 16 },
        { id: 'ter_mob_3', name: 'Rootdeep Vanguard', sub: 'Lv.31 Ancient Ironbark', spriteKey: 'graniteBoss', x: -780, y: -880, hp: 520, maxHp: 520, damage: 32, xpReward: 1050, speed: 40, aggroRange: 120, attackRange: 32, radius: 20 },
        // Umbri Shadow Fens (NE)
        { id: 'umb_mob_1', name: 'Void Stalker Vanguard', sub: 'Lv.29 Umbri Assassin', spriteKey: 'voidStalker', x: 680, y: -520, hp: 420, maxHp: 420, damage: 30, xpReward: 850, speed: 56, aggroRange: 115, attackRange: 28, radius: 15 },
        { id: 'umb_mob_2', name: 'Graveglass Phantom', sub: 'Lv.30 Gloom Specter', spriteKey: 'duskFiend', x: 1020, y: -480, hp: 460, maxHp: 460, damage: 32, xpReward: 950, speed: 56, aggroRange: 115, attackRange: 28, radius: 15 },
        { id: 'umb_mob_3', name: 'Sepulcher Reaver', sub: 'Lv.31 Shadow Knight', spriteKey: 'voidStalker', x: 780, y: -880, hp: 500, maxHp: 500, damage: 34, xpReward: 1050, speed: 54, aggroRange: 120, attackRange: 30, radius: 16 },
        // Solari Sun-Canyon (SW)
        { id: 'sol_mob_1', name: 'Sunforged Sentinel', sub: 'Lv.29 Solari Construct', spriteKey: 'solariSentinel', x: -680, y: 520, hp: 450, maxHp: 450, damage: 28, xpReward: 850, speed: 52, aggroRange: 115, attackRange: 28, radius: 15 },
        { id: 'sol_mob_2', name: 'Dawnblade Crusader', sub: 'Lv.30 Radiant Paladin', spriteKey: 'solariSentinel', x: -1020, y: 480, hp: 480, maxHp: 480, damage: 30, xpReward: 950, speed: 54, aggroRange: 115, attackRange: 30, radius: 15 },
        { id: 'sol_mob_3', name: 'Sunfire Automaton', sub: 'Lv.31 Citadel Colossus', spriteKey: 'solariSentinel', x: -780, y: 880, hp: 520, maxHp: 520, damage: 32, xpReward: 1050, speed: 48, aggroRange: 120, attackRange: 30, radius: 16 },
        // Aether Astral Plateau (SE)
        { id: 'aeth_mob_1', name: 'Chrono Echo', sub: 'Lv.29 Astral Sentinel', spriteKey: 'aetherWeaver', x: 680, y: 520, hp: 420, maxHp: 420, damage: 30, xpReward: 850, speed: 54, aggroRange: 115, attackRange: 28, radius: 15 },
        { id: 'aeth_mob_2', name: 'Continuum Weaver', sub: 'Lv.30 Singularity Mage', spriteKey: 'aetherWeaver', x: 1020, y: 480, hp: 460, maxHp: 460, damage: 32, xpReward: 950, speed: 55, aggroRange: 115, attackRange: 30, radius: 15 },
        { id: 'aeth_mob_3', name: 'Fractured Paradox', sub: 'Lv.31 Time Archon', spriteKey: 'aetherWeaver', x: 780, y: 880, hp: 500, maxHp: 500, damage: 36, xpReward: 1050, speed: 52, aggroRange: 120, attackRange: 30, radius: 16 },
        // Central Caldera Skirmishers
        { id: 'void_mid_1', name: 'Void Stalker Raider', sub: 'Lv.28 Warzone Invader', spriteKey: 'voidStalker', x: -140, y: -60, hp: 360, maxHp: 360, damage: 24, xpReward: 700, speed: 52, aggroRange: 112, attackRange: 28, radius: 15 },
        { id: 'void_mid_2', name: 'Duskblade Marauder', sub: 'Lv.28 Warzone Invader', spriteKey: 'duskFiend', x: 140, y: -60, hp: 340, maxHp: 340, damage: 26, xpReward: 700, speed: 56, aggroRange: 112, attackRange: 26, radius: 14 },
        { id: 'void_mid_3', name: 'Warzone Scavenger', sub: 'Lv.29 Chaos Entity', spriteKey: 'graniteBoss', x: 0, y: -130, hp: 460, maxHp: 460, damage: 30, xpReward: 850, speed: 40, aggroRange: 115, attackRange: 30, radius: 18 },
      ];
      for (const m of openWorldMobs) {
        room.entities.push({
          ...m,
          origX: m.x,
          origY: m.y,
          type: 'mob',
          hitFlash: 0,
          dammers: new Set(),
        });
      }
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
      room.type === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE ||
      room.type === ROOM_TYPES.CELESTIAL_ASCENT
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

    room.entities.push(
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
  }

  populateSubZoneDungeon(room) {
    if (room.type === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      room.entities.push(
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
    } else if (room.type === ROOM_TYPES.CELESTIAL_ASCENT) {
      room.entities.push(
        {
          id: 'celestial_font_1',
          name: 'Font of the Morning Star',
          sub: 'Empyrean Glimmer Spire [E]',
          type: 'node',
          spriteKey: 'node',
          x: -120,
          y: 600,
          charges: 6,
          maxCharges: 6,
          rechargeTimer: 0,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'celestial_font_2',
          name: 'Shrine of Empyrean Resonance',
          sub: 'Ancient Leyline Shrine [E]',
          type: 'node',
          spriteKey: 'node',
          x: 120,
          y: 600,
          charges: 6,
          maxCharges: 6,
          rechargeTimer: 0,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'celestial_font_summit',
          name: 'Apex Keystone Font',
          sub: 'Titan Glimmer Core [E]',
          type: 'node',
          spriteKey: 'node',
          x: 0,
          y: -450,
          charges: 8,
          maxCharges: 8,
          rechargeTimer: 0,
          radius: 18,
          hitFlash: 0,
        },
        {
          id: 'celestial_mob_1',
          name: 'Empyrean Star-Knight',
          sub: 'Lv.28 Celestial Construct',
          type: 'mob',
          spriteKey: 'solariSentinel',
          x: -90,
          y: 450,
          origX: -90,
          origY: 450,
          hp: 280,
          maxHp: 280,
          damage: 16,
          xpReward: 320,
          speed: 48,
          aggroRange: 120,
          attackRange: 30,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'celestial_mob_2',
          name: 'Empyrean Star-Knight',
          sub: 'Lv.28 Celestial Construct',
          type: 'mob',
          spriteKey: 'solariSentinel',
          x: 90,
          y: 450,
          origX: 90,
          origY: 450,
          hp: 280,
          maxHp: 280,
          damage: 16,
          xpReward: 320,
          speed: 48,
          aggroRange: 120,
          attackRange: 30,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'celestial_mob_3',
          name: 'Astral Chrono-Seraph',
          sub: 'Lv.30 Celestial Seraph',
          type: 'mob',
          spriteKey: 'aetherWeaver',
          x: -120,
          y: 100,
          origX: -120,
          origY: 100,
          hp: 260,
          maxHp: 260,
          damage: 18,
          xpReward: 360,
          speed: 54,
          aggroRange: 130,
          attackRange: 36,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'celestial_mob_4',
          name: 'Astral Chrono-Seraph',
          sub: 'Lv.30 Celestial Seraph',
          type: 'mob',
          spriteKey: 'aetherWeaver',
          x: 120,
          y: 100,
          origX: 120,
          origY: 100,
          hp: 260,
          maxHp: 260,
          damage: 18,
          xpReward: 360,
          speed: 54,
          aggroRange: 130,
          attackRange: 36,
          radius: 16,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'celestial_mob_5',
          name: 'Void Annihilator',
          sub: 'Lv.32 Apex Infiltrator',
          type: 'mob',
          spriteKey: 'mobUmbri',
          x: 0,
          y: -250,
          origX: 0,
          origY: -250,
          hp: 420,
          maxHp: 420,
          damage: 22,
          xpReward: 480,
          speed: 50,
          aggroRange: 140,
          attackRange: 32,
          radius: 18,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'celestial_titan_boss',
          name: 'Aurelius the Empyrean Sovereign',
          sub: '★ Lv.35 Ancient Titan of the Nexus',
          type: 'mob',
          isBoss: true,
          dropGear: 'crown_of_dawn',
          spriteKey: 'celestialTitanBoss',
          x: 0,
          y: -750,
          origX: 0,
          origY: -750,
          hp: 3200,
          maxHp: 3200,
          damage: 32,
          xpReward: 1600,
          speed: 46,
          aggroRange: 180,
          attackRange: 42,
          radius: 28,
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

  attachConnection(ws, account, preferredRoom = null, reqX = null, reqY = null) {
    const existing = this.clients.get(account.id);
    if (existing && existing.ws !== ws) {
      try {
        existing.send({ type: 'sys_msg', category: 'system', text: '[System] Logged in from another window.' });
        existing.ws.close(4001, 'Logged in from another window');
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
      inventory: account.inventory || [],
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

    this.joinRoom(client, preferredRoom || ROOM_TYPES.SANCTUARY_HUB, null, reqX, reqY);
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
    client.inventory = acc.inventory || [];
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
        const target = msg.roomId || msg.roomType || ROOM_TYPES.NEXUS_WARZONE;
        if (client.portalCooldown > 0.4 && (client.roomType === target || client.roomId === target || client.roomId?.startsWith(target))) {
          break;
        }
        this.joinRoom(client, target, null, msg.x ?? null, msg.y ?? null, msg.dir ?? null);
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

      case 'cancel_cast':
        client.castState = null;
        break;

      case 'harvest_node':
        if (room) this.handleHarvestNode(room, client, msg.nodeId);
        break;

      case 'plant_banner':
        if (room) this.handlePlantBanner(room, client);
        break;

      case 'equip_item': {
        let item = null;
        if (msg.slotIndex !== undefined) {
          const res = this.accounts.equipFromInventory(client.id, Number(msg.slotIndex));
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
              this.accounts.equipFromInventory(client.id, idx);
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

      case 'set_torment':
        this.handleSetTorment(client, Number(msg.tormentLevel));
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
    if (!isSlotUnlocked(player.prog, slot)) return;
    const spec = getSlotAbilitySpec(player.loadout, slot);
    if (!spec) return;
    if ((player.cooldowns[slot] || 0) > 0.05) return;

    // Diablo 2 requirement: Unlearned spells (rank 0) cannot be cast!
    const rank = getAbilityRank(player.prog, spec.id);
    if (rank < 1) return;

    if (['up', 'down', 'left', 'right'].includes(facingDir)) {
      player.dir = facingDir;
    }

    const effStats = getEffectiveStats(player.prog, player.equipment, player.classId);
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

    if (spec.cost > 0 && player.solarCharge < spec.cost) return;

    // RITES REQUIRE CASTING TIME WHILE FLASHES ARE INSTANT!
    if (isRite && (spec.castTime || 0) > 0) {
      if (player.castState) return; // Already channeling a Rite

      const needsTarget = ['cast_beam', 'projectile', 'drain_beam', 'execute_beam'].includes(spec.kind);
      let tgt = null;
      if (needsTarget) {
        const rangePx = (spec.rangeYards || 21) * YARD_PX;
        tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
        if (!tgt || Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) > rangePx + 16) return;
        if (Math.abs(tgt.ref.x - player.x) > Math.abs(tgt.ref.y - player.y)) {
          player.dir = tgt.ref.x >= player.x ? 'right' : 'left';
        } else {
          player.dir = tgt.ref.y >= player.y ? 'down' : 'up';
        }
      }

      const castSpeedMult = calcCastSpeedMult(player.prog) * (player.temporalApotheosisTimer > 0 ? 0.25 : 1.0);
      const effectiveCastTime = Math.max(0.3, (spec.castTime || 1.0) * castSpeedMult);

      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.castState = {
        slot,
        specId: spec.id,
        spellName: spec.name,
        color: spec.color,
        targetId: tgt ? (tgt.kind === 'player' ? `p_${tgt.ref.id}` : tgt.ref.id) : targetId,
        remaining: effectiveCastTime,
        totalDuration: effectiveCastTime,
        effPower,
        effBastion: effStats.bastion,
        effResonance: effStats.resonance,
        critChance,
        rank,
        castX: player.x,
        castY: player.y,
        facingDir: player.dir,
      };

      room.fxQueue.push({
        kind: 'cast_start',
        actorId: player.id,
        spellName: spec.name,
        duration: effectiveCastTime,
        color: spec.color,
      });
      return;
    }

    // FLASHES EXECUTE INSTANTLY (castTime === 0)
    const wasStealthed = player.stealthedTimer > 0;
    if (spec.kind !== 'stealth' && spec.kind !== 'stealth_burst') {
      player.stealthedTimer = 0; // Attacking breaks stealth
    }

    // 1. MELEE CLEAVE (Flare Strike, Whisper of the Void, Tectonic Slam, Reality Fracture)
    if (spec.kind === 'melee_cleave') {
      const rangePx = (spec.rangeYards || 6.5) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      let { angle } = getDirAngle(player.dir);
      if (tgt && Math.hypot(tgt.ref.x - player.x, tgt.ref.y - player.y) <= rangePx + 12) {
        angle = Math.atan2(tgt.ref.y - player.y, tgt.ref.x - player.x);
      }

      player.cooldowns[slot] = spec.baseCd * cdMult;
      this.addPlayerGlimmer(room, player, 6);
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle, color: spec.color, actorId: player.id });

      let hitAny = false;
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rangePx + 10)) {
        const eAng = Math.atan2(h.ref.y - player.y, h.ref.x - player.x);
        const diff = Math.abs(Math.atan2(Math.sin(eAng - angle), Math.cos(eAng - angle)));
        if ((tgt && h.ref === tgt.ref) || diff < 1.25) {
          let base = Math.max(2, Math.floor(Math.random() * 4) + 3 + effPower + rank * 2);
          if (wasStealthed) base = Math.round(base * 1.45);
          const isCrit = wasStealthed || Math.random() < critChance;
          const critMult = isCrit ? calcCritDamageMult(player.prog) : 1.0;
          const finalDmg = isCrit ? Math.round(base * critMult) : base;
          this.applyAuthoritativeDamage(room, player, h, finalDmg, isCrit, spec.name, false);
          if (wasStealthed) {
            room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 12, text: 'AMBUSH!', color: '#c084fc', isCrit: true });
          }
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

    // 2. SHIELD & THORNBARK (Radiant Bulwark, Graveglass Ward, Mirror Barrier, Barkskin Infusion)
    if (spec.kind === 'shield' || spec.kind === 'thornbark') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      this.addPlayerGlimmer(room, player, 6);
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

    // 3. FROST NOVA (Aether Instant Frost Ring Freeze)
    if (spec.kind === 'frost_nova') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const novaRad = (spec.rangeYards || 8) * YARD_PX;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'frost_ring',
        color: spec.color,
        ownerId: player.id,
        x: player.x,
        y: player.y,
        radius: novaRad,
        age: 0,
        maxAge: 0.45,
      });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: `${spec.name.toUpperCase()}!`, color: spec.color, isCrit: true });

      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, novaRad)) {
        const dmg = Math.max(3, Math.floor(Math.random() * 4) + 6 + Math.round(effPower * 1.2) + rank * 2);
        this.applyAuthoritativeDamage(room, player, h, dmg, true, spec.name, false);
        if ((h.kind === 'entity' && h.ref.isDying) || (h.kind === 'player' && h.ref.isDead)) continue;
        h.ref.freezeTimer = 3.2;
        room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 10, text: '❄️ FROZEN!', color: '#bae6fd' });
      }
      return;
    }

    // 4. DASH / BLINK / WILDSHAPE SURGE / SOLAR INTERVENE
    if (spec.kind === 'dash') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      this.addPlayerGlimmer(room, player, spec.id === 'wildshape_surge' ? 15 : 12);
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
        } else if (spec.id === 'solar_intervene') {
          player.shield = Math.max(player.shield, 12 + rank * 3);
          player.shieldTimer = 6;
        }
      }
      return;
    }

    // 5. SHADOW STEP (Umbri Signature Instant Teleport Behind Target!)
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

    // 6. VEIL OF DUSK (Umbri Instant Stealth Vanish!)
    if (spec.kind === 'stealth') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.stealthedTimer = 3.6;
      this.addPlayerGlimmer(room, player, 12);
      room.fxQueue.push({ kind: 'smoke', x: player.x, y: player.y, count: 16 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🌑 STEALTH (3.5s)', color: '#c084fc' });
      return;
    }

    // 7. REACTIVE BARRIER (Sun Aegis Rebuke)
    if (spec.kind === 'reactive_barrier') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const shieldVal = 18 + effStats.bastion * 3 + rank * 4;
      player.shield = shieldVal;
      player.shieldTimer = 8;
      player.rebukeTimer = 4.0;
      this.addPlayerGlimmer(room, player, 15);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#facc15', '#fef08a', '#ffffff'], count: 16 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: `☀️ SUN AEGIS REBUKE (+${shieldVal})`, color: '#facc15' });
      return;
    }

    // 8. CLEANSE SPRINT (Aurora Stride)
    if (spec.kind === 'cleanse_sprint') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.slowTimer = 0;
      player.snareTimer = 0;
      player.weakenTimer = 0;
      player.auroraStrideTimer = 4.0;
      this.addPlayerGlimmer(room, player, 15);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 6, colors: ['#fef08a', '#ffffff'] });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '✨ AURORA STRIDE (+50% SPD)!', color: '#fef08a' });
      return;
    }

    // 9. ARCHON FORM (Solar Ascension Apex)
    if (spec.kind === 'archon_form') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.solarAscensionTimer = 8.0;
      for (const s of [9, 10, 11, 12]) player.cooldowns[s] = 0;
      this.addPlayerGlimmer(room, player, 40);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#fde047', '#facc15', '#ffffff'], count: 24 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '👑 SOLAR ASCENSION APEX ARCHON!', color: '#fde047', isCrit: true });
      return;
    }

    // 10. STEALTH BURST (Abyssal Shroud)
    if (spec.kind === 'stealth_burst') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.abyssalShroudTimer = 2.0;
      player.stealthedTimer = 2.0;
      this.addPlayerGlimmer(room, player, 15);
      room.fxQueue.push({ kind: 'smoke', x: player.x, y: player.y, count: 20 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🌫️ ABYSSAL SHROUD (100% DODGE)!', color: '#9333ea', isCrit: true });
      return;
    }

    // 11. DASH CLEAVE (Eclipse Reap)
    if (spec.kind === 'dash_cleave') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const { dx, dy } = getDirAngle(player.dir);
      const dist = 10 * YARD_PX;
      const startX = player.x;
      const startY = player.y;
      player.x = Math.max(-room.halfW + 16, Math.min(room.halfW - 16, player.x + dx * dist));
      player.y = Math.max(-room.halfH + 16, Math.min(room.halfH - 16, player.y + dy * dist));
      room.fxQueue.push({ kind: 'dash', actorId: player.id, fromX: startX, fromY: startY, toX: player.x, toY: player.y, dir: player.dir, color: '#c084fc' });
      this.addPlayerGlimmer(room, player, 18);
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 80)) {
        const reapDmg = Math.max(5, 12 + effPower * 2 + rank * 3);
        this.applyAuthoritativeDamage(room, player, h, reapDmg, true, 'Eclipse Reap', false);
      }
      return;
    }

    // 12. VOIDFORM (Avatar of the Void Apex)
    if (spec.kind === 'voidform') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.voidformTimer = 8.0;
      player.stealthedTimer = 8.0;
      this.addPlayerGlimmer(room, player, 40);
      room.fxQueue.push({ kind: 'smoke', x: player.x, y: player.y, count: 24 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '👑 AVATAR OF THE VOID!', color: '#a855f7', isCrit: true });
      return;
    }

    // 13. IRON FORTIFY (Rooted Bastion)
    if (spec.kind === 'iron_fortify') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.rootedBastionTimer = 3.5;
      player.slowTimer = 0;
      player.snareTimer = 0;
      this.addPlayerGlimmer(room, player, 16);
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🌳 ROOTED BASTION (-40% DMG / CC IMMUNE)!', color: '#15803d', isCrit: true });
      return;
    }

    // 14. BRAMBLE BURST (Bramble Reversal)
    if (spec.kind === 'bramble_burst') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const burstRad = 8 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#4ade80', ownerId: player.id, x: player.x, y: player.y, radius: burstRad, age: 0, maxAge: 0.35 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🌿 BRAMBLE REVERSAL!', color: '#4ade80' });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, burstRad)) {
        h.ref.snareTimer = 4.0;
        const d = Math.hypot(h.ref.x - player.x, h.ref.y - player.y);
        if (h.kind === 'entity' && h.ref.type === 'mob' && d > 1) {
          h.ref.x += ((h.ref.x - player.x) / d) * 28;
          h.ref.y += ((h.ref.y - player.y) / d) * 28;
        }
        this.applyAuthoritativeDamage(room, player, h, 8 + effPower + rank * 2, false, 'Bramble Reversal', false);
      }
      return;
    }

    // 15. COLOSSUS STOMP (Ironwood Colossus)
    if (spec.kind === 'colossus_stomp') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const stompRad = 10 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#84cc16', ownerId: player.id, x: player.x, y: player.y, radius: stompRad, age: 0, maxAge: 0.4 });
      this.addPlayerGlimmer(room, player, 25);
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🪨 IRONWOOD COLOSSUS!', color: '#84cc16', isCrit: true });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, stompRad)) {
        this.applyAuthoritativeDamage(room, player, h, 14 + effPower * 2 + rank * 3, true, 'Ironwood Colossus', false);
      }
      return;
    }

    // 16. TREANT FORM (Avatar of the Ironwood Apex)
    if (spec.kind === 'treant_form') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.shield = 250;
      player.shieldTimer = 12;
      player.thornbarkTimer = 8.0;
      player.treantFormTimer = 8.0;
      this.addPlayerGlimmer(room, player, 40);
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '👑 AVATAR OF THE IRONWOOD!', color: '#22c55e', isCrit: true });
      return;
    }

    // 17. ETHEREAL JAUNT (Phase Shift)
    if (spec.kind === 'ethereal_jaunt') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.phaseShiftTimer = 1.2;
      this.addPlayerGlimmer(room, player, 16);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#7dd3fc', '#bae6fd'] });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: '🌌 PHASE SHIFT (UNTOUCHABLE)!', color: '#7dd3fc' });
      return;
    }

    // 18. RIFT TELEPORT (Chrono Rift)
    if (spec.kind === 'rift_teleport') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      const { dx, dy } = getDirAngle(player.dir);
      const riftDist = 11 * YARD_PX;
      const startX = player.x;
      const startY = player.y;
      player.x = Math.max(-room.halfW + 16, Math.min(room.halfW - 16, player.x + dx * riftDist));
      player.y = Math.max(-room.halfH + 16, Math.min(room.halfH - 16, player.y + dy * riftDist));
      room.fxQueue.push({ kind: 'dash', actorId: player.id, fromX: startX, fromY: startY, toX: player.x, toY: player.y, dir: player.dir, color: '#38bdf8' });
      this.addPlayerGlimmer(room, player, 20);
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'frost_ring', color: '#38bdf8', ownerId: player.id, x: startX, y: startY, radius: 48, age: 0, maxAge: 4.0 });
      for (const h of this.getAllHostilesInRadius(room, player, startX, startY, 52)) {
        h.ref.slowTimer = 3.5;
        this.applyAuthoritativeDamage(room, player, h, 8 + effPower + rank * 2, false, 'Chrono Rift', false);
      }
      return;
    }

    // 19. APOTHEOSIS (Temporal Apotheosis Apex)
    if (spec.kind === 'apotheosis') {
      player.cooldowns[slot] = spec.baseCd * cdMult;
      player.temporalApotheosisTimer = 8.0;
      for (const s of ACTION_SLOTS) {
        if (s !== slot) player.cooldowns[s] = 0;
      }
      this.addPlayerGlimmer(room, player, 40);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#e0f2fe', '#38bdf8', '#c084fc'], count: 24 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '👑 TEMPORAL APOTHEOSIS!', color: '#e0f2fe', isCrit: true });
      return;
    }
  }

  executeAuthoritativeRite(room, player, cs) {
    if (!cs || player.isDead) return;
    const spec = ABILITIES_CATALOG[cs.specId];
    if (!spec) return;

    const rank = cs.rank || 1;
    const effPower = cs.effPower || 2;
    const effBastion = cs.effBastion || 2;
    const effResonance = cs.effResonance || 1;
    const critChance = cs.critChance || 0.05;

    // 1. BEAM RITE (Solar Flare, Astral Convergence)
    if (spec.kind === 'cast_beam') {
      const tgt = this.findHostileTargetById(room, player, cs.targetId);
      if (tgt) {
        room.fxQueue.push({ kind: 'skyBeam', x: tgt.ref.x, y: tgt.ref.y, color: cs.color });
        const isCrit = Math.random() < critChance || player.stealthedTimer > 0;
        const baseDmg = Math.max(5, Math.floor(Math.random() * 5) + 10 + effPower * 2 + rank * 3);
        const dmg = isCrit ? Math.round(baseDmg * 1.7) : baseDmg;
        this.applyAuthoritativeDamage(room, player, tgt, dmg, isCrit, cs.spellName, true);
        for (const splash of this.getAllHostilesInRadius(room, player, tgt.ref.x, tgt.ref.y, 56)) {
          if (splash.ref !== tgt.ref) {
            this.applyAuthoritativeDamage(room, player, splash, Math.round(dmg * 0.55), false, cs.spellName, false);
          }
        }
      }
      return;
    }

    // 2. PROJECTILE RITE (Judgement of the Sun, Soul Tithe, Ancient Boulder, Temporal Lance)
    if (spec.kind === 'projectile') {
      const tgt = this.findHostileTargetById(room, player, cs.targetId);
      if (tgt) {
        this.addPlayerGlimmer(room, player, (spec.id === 'soul_tithe' ? 24 : 18) + effResonance * 2);
        room.fxQueue.push({ kind: 'sfx', sfx: 'hammer', x: player.x, y: player.y, actorId: player.id });
        room.projectiles.push({
          id: `prj_${crypto.randomUUID().slice(0, 6)}`,
          type: spec.projType || 'orb',
          spellName: spec.name,
          isRite: true,
          color: spec.color,
          ownerId: player.id,
          x: player.x,
          y: player.y - 8,
          targetKey: tgt.kind === 'player' ? `p_${tgt.ref.id}` : tgt.ref.id,
          speed: spec.projType === 'aether_orb' ? 265 : 225,
          rot: 0,
          dmg: Math.max(3, Math.floor(Math.random() * 4) + 6 + effPower + rank * 2),
        });
      }
      return;
    }

    // 3. GROUND ZONE RITE (Consecrated Ground, Nightfall Plague, Briar Snare, Gravity Well)
    if (spec.kind === 'ground_zone') {
      const tgt = cs.targetId ? this.findHostileTargetById(room, player, cs.targetId) : null;
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

    // 4. HEAL RITE (Blessing of Dawn, Verdant Renewal, Daybreak)
    if (spec.kind === 'heal' || spec.kind === 'heal_glimmer') {
      const healAmt = 7 + effBastion * 2 + rank * 3;
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

    // 5. NOVA RITE (Wrath of the Daystar, Decree of the Sun, Earthshatter, Overwhelm Roar)
    if (spec.kind === 'nova') {
      const novaRad = (spec.rangeYards || 12) * YARD_PX;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'shockwave',
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
        this.applyAuthoritativeDamage(room, player, h, dmg, true, spec.name, true);
        if ((h.kind === 'entity' && h.ref.isDying) || (h.kind === 'player' && h.ref.isDead)) continue;
        if (spec.id === 'overwhelm_roar') {
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

    // 6. DRAIN / EXECUTE BEAM RITE (Siphon Soul, Unmake)
    if (spec.kind === 'drain_beam' || spec.kind === 'execute_beam') {
      const tgt = this.findHostileTargetById(room, player, cs.targetId);
      if (tgt) {
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
      }
      return;
    }

    // 7. TIMELOOP PARADOX RITE (Aether Chrono Rewind)
    if (spec.kind === 'timeloop') {
      const rewindHp = Math.max(5, Math.round(player.maxHp * 0.25) + rank * 2);
      player.hp = Math.min(player.maxHp, player.hp + rewindHp);
      for (const s of ACTION_SLOTS) {
        if (s !== cs.slot && player.cooldowns[s] > 0) {
          player.cooldowns[s] = Math.max(0, player.cooldowns[s] - (2.2 + rank * 0.3));
        }
      }
      player.echoPrimed = true;
      this.addPlayerGlimmer(room, player, 15);
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#38bdf8', '#e0f2fe', '#c084fc'] });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 10, text: `⏳ REWIND +${rewindHp} HP & ECHO!`, color: '#7dd3fc', isCrit: true });
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    // 8. SCYTHE WAVE RITE (Eclipse Harvester)
    if (spec.kind === 'scythe_wave') {
      const tgt = this.findHostileTargetById(room, player, cs.targetId);
      const waveAngle = tgt ? Math.atan2(tgt.ref.y - player.y, tgt.ref.x - player.x) : (player.dir === 'up' ? -Math.PI/2 : player.dir === 'down' ? Math.PI/2 : player.dir === 'left' ? Math.PI : 0);
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle: waveAngle, color: '#9333ea', actorId: player.id });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: '🌑 ECLIPSE HARVESTER!', color: '#9333ea', isCrit: true });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 20 * YARD_PX)) {
        const ang = Math.atan2(h.ref.y - player.y, h.ref.x - player.x);
        if (Math.abs(Math.atan2(Math.sin(ang - waveAngle), Math.cos(ang - waveAngle))) < 1.35) {
          const dmg = Math.max(6, 14 + Math.round(effPower * 1.6) + rank * 3);
          this.applyAuthoritativeDamage(room, player, h, dmg, true, spec.name, true);
        }
      }
      return;
    }

    // 9. SINGULARITY COLLAPSE RITE (Void Annihilation Apex)
    if (spec.kind === 'singularity_collapse') {
      const zx = player.x;
      const zy = player.y;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'gravity',
        color: '#c084fc',
        spellName: spec.name,
        ownerId: player.id,
        x: zx,
        y: zy,
        radius: 16 * YARD_PX,
        tickDmg: 8 + rank * 2,
        age: 0,
        maxAge: 3.5,
        tickTimer: 0.2,
      });
      room.fxQueue.push({ kind: 'fct', x: zx, y: zy - 12, text: '🌌 VOID ANNIHILATION APEX!', color: '#c084fc', isCrit: true });
      for (const h of this.getAllHostilesInRadius(room, player, zx, zy, 16 * YARD_PX)) {
        const d = Math.hypot(h.ref.x - zx, h.ref.y - zy);
        if (h.kind === 'entity' && h.ref.type === 'mob' && d > 4) {
          h.ref.x += ((zx - h.ref.x) / d) * 32;
          h.ref.y += ((zy - h.ref.y) / d) * 32;
        }
        const apexDmg = Math.max(10, 50 + effPower * 3 + rank * 4);
        this.applyAuthoritativeDamage(room, player, h, apexDmg, true, spec.name, true);
      }
      return;
    }

    // 10. FISSURE LINE RITE (Tectonic Fissure)
    if (spec.kind === 'fissure_line') {
      const getDirAngle = (dir) => {
        if (dir === 'up') return { dx: 0, dy: -1 };
        if (dir === 'down') return { dx: 0, dy: 1 };
        if (dir === 'left') return { dx: -1, dy: 0 };
        return { dx: 1, dy: 0 };
      };
      const { dx, dy } = getDirAngle(player.dir);
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 8, text: '⛰️ TECTONIC FISSURE!', color: '#65a30d', isCrit: true });
      for (let step = 1; step <= 5; step++) {
        const fx = player.x + dx * step * 28;
        const fy = player.y + dy * step * 28;
        room.groundZones.push({
          id: `gz_${crypto.randomUUID().slice(0, 6)}`,
          type: 'briar',
          color: '#65a30d',
          spellName: 'Tectonic Fissure',
          ownerId: player.id,
          x: fx,
          y: fy,
          radius: 32,
          tickDmg: 4 + rank + Math.floor(effPower * 0.4),
          age: 0,
          maxAge: 5.0,
          tickTimer: 0.3,
        });
        for (const h of this.getAllHostilesInRadius(room, player, fx, fy, 32)) {
          this.applyAuthoritativeDamage(room, player, h, 10 + effPower + rank * 2, false, 'Tectonic Fissure', true);
        }
      }
      return;
    }

    // 11. CONTINENTAL QUAKE RITE (Wrath of Gaia Apex)
    if (spec.kind === 'continental_quake') {
      const quakeRad = 16 * YARD_PX;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'shockwave',
        color: '#4ade80',
        ownerId: player.id,
        x: player.x,
        y: player.y,
        radius: quakeRad,
        age: 0,
        maxAge: 0.6,
      });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '🌳 WRATH OF GAIA APEX!', color: '#4ade80', isCrit: true });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, quakeRad)) {
        const apexDmg = Math.max(10, 48 + effPower * 3 + rank * 4);
        this.applyAuthoritativeDamage(room, player, h, apexDmg, true, spec.name, true);
        if (h.kind === 'entity' && h.ref.type === 'mob') {
          h.ref.freezeTimer = 3.0;
          room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 10, text: 'STUNNED (3s)!', color: '#86efac' });
        }
      }
      return;
    }

    // 12. SUPERNOVA RITE (Supernova Collapse)
    if (spec.kind === 'supernova') {
      const tgt = this.findHostileTargetById(room, player, cs.targetId);
      const cx = tgt ? tgt.ref.x : player.x;
      const cy = tgt ? tgt.ref.y : player.y;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'shockwave',
        color: '#38bdf8',
        ownerId: player.id,
        x: cx,
        y: cy,
        radius: 13 * YARD_PX,
        age: 0,
        maxAge: 0.5,
      });
      room.fxQueue.push({ kind: 'fct', x: cx, y: cy - 10, text: '💥 SUPERNOVA COLLAPSE!', color: '#38bdf8', isCrit: true });
      for (const h of this.getAllHostilesInRadius(room, player, cx, cy, 13 * YARD_PX)) {
        const dmg = Math.max(8, 16 + Math.round(effPower * 1.8) + rank * 3);
        this.applyAuthoritativeDamage(room, player, h, dmg, true, spec.name, true);
      }
      return;
    }

    // 13. STASIS BUBBLE RITE (Chrono Stasis Singularity Apex)
    if (spec.kind === 'stasis_bubble') {
      const stasisRad = 14 * YARD_PX;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'frost_ring',
        color: '#0284c7',
        ownerId: player.id,
        x: player.x,
        y: player.y,
        radius: stasisRad,
        age: 0,
        maxAge: 3.5,
      });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '🌌 CHRONO STASIS APEX!', color: '#7dd3fc', isCrit: true });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, stasisRad)) {
        if (h.kind === 'entity' && h.ref.type === 'mob') {
          h.ref.freezeTimer = 3.5;
          room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 10, text: '⏳ TIME STOP!', color: '#38bdf8' });
        }
        const apexDmg = Math.max(10, 50 + effPower * 3 + rank * 4);
        this.applyAuthoritativeDamage(room, player, h, apexDmg, true, spec.name, true);
      }
      return;
    }
  }

  handleHarvestNode(room, player, nodeId) {
    if (player.isDead) return;
    // 1. Check for interactive Ancient Leyline Shrines
    let shrine = nodeId ? room.entities.find((e) => e.id === nodeId && e.type === 'shrine') : null;
    if (!shrine) {
      shrine = room.entities.find((e) => e.type === 'shrine' && Math.hypot(e.x - player.x, e.y - player.y) <= 7.2 * YARD_PX);
    }
    if (shrine && Math.hypot(shrine.x - player.x, shrine.y - player.y) <= 7.5 * YARD_PX) {
      if (shrine.charges <= 0) return;
      shrine.charges--;
      if (shrine.charges === 0) shrine.rechargeTimer = 45.0;
      player.shrineBuff = { affinity: shrine.affinity, name: shrine.buffName, timer: 60 };
      room.fxQueue.push({ kind: 'spark', x: shrine.x, y: shrine.y - 12, colors: ['#facc15', '#ffffff', '#38bdf8'] });
      room.fxQueue.push({ kind: 'fct', x: shrine.x, y: shrine.y - 10, text: `✨ ${shrine.buffName.toUpperCase()}!`, color: '#facc15' });
      player.send({
        type: 'sys_msg',
        category: 'combat',
        text: `✨ [SHRINE] Received ${shrine.buffName} Blessing (+Stats for 60s)!`,
      });
      return;
    }

    // 2. Otherwise harvest Glimmer Node
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

    // Solari Paragon: Holy Radiance Burst on critical strike!
    if (attackerPlayer && isCrit) {
      const burstDmg = calcHolyRadianceBurstDmg(attackerPlayer.prog);
      if (burstDmg > 0) {
        room.fxQueue.push({ kind: 'spark', x: t.x, y: t.y, colors: ['#facc15', '#fef08a', '#ffffff'], count: 14 });
        room.fxQueue.push({ kind: 'fct', x: t.x, y: t.y - 14, text: `☀️ HOLY BURST +${burstDmg}!`, color: '#facc15', isCrit: true });
        for (const nearby of this.getAllHostilesInRadius(room, attackerPlayer, t.x, t.y, 48)) {
          if (nearby.ref !== t) {
            this.applyAuthoritativeDamage(room, attackerPlayer, nearby, burstDmg, false, 'Holy Radiance', false);
          }
        }
      }
    }

    // Umbri Paragon: Void Leech on all damage dealt!
    if (attackerPlayer && !attackerPlayer.isDead) {
      const leechPct = calcLifeLeechPct(attackerPlayer.prog, attackerPlayer.faction) * (attackerPlayer.voidformTimer > 0 ? 2 : 1);
      if (leechPct > 0) {
        const leech = Math.max(1, Math.round(dmg * leechPct));
        attackerPlayer.hp = Math.min(attackerPlayer.maxHp, attackerPlayer.hp + leech);
        this.parties.syncPlayerVitals(attackerPlayer.id);
      }
    }

    // Aether Faction Mechanic: Spell Echo!
    if (attackerPlayer && isRite && !String(spellName).includes('Echo')) {
      this.triggerSpellEchoIfEligible(room, attackerPlayer, targetWrap, dmg, spellName);
    }
  }

  damagePlayerSession(room, targetPlayer, amount, attackerName, isCrit = false, attackerRef = null) {
    if (targetPlayer.isDead || targetPlayer.hp <= 0) return;

    // Umbri Paragon: Dodge Chance!
    const dodgeChance = targetPlayer.abyssalShroudTimer > 0 ? 1.0 : calcDodgeChance(targetPlayer.prog);
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y - 12, text: '💨 DODGE!', color: '#c084fc', isCrit: true });
      return;
    }

    // Terra Paragon & Buffs: Damage Reduction!
    const dmgRedPct = calcDamageReduction(targetPlayer.prog) + (targetPlayer.rootedBastionTimer > 0 ? 0.40 : 0);
    if (dmgRedPct > 0) {
      amount = Math.max(1, Math.round(amount * (1 - Math.min(0.70, dmgRedPct))));
    }

    // Solari Sun Aegis Rebuke Reactive Counter
    if (targetPlayer.rebukeTimer > 0 && attackerRef) {
      const reb = Math.max(2, Math.round(amount * 0.4));
      if (attackerRef.hp !== undefined && attackerRef.type === 'mob') {
        this.applyAuthoritativeDamage(room, targetPlayer, { kind: 'entity', ref: attackerRef }, reb, false, 'Sun Rebuke', false);
        attackerRef.weakenTimer = 4.0;
      } else if (attackerRef.ws) {
        attackerRef.hp = Math.max(1, attackerRef.hp - reb);
        attackerRef.weakenTimer = 4.0;
        room.fxQueue.push({ kind: 'fct', x: attackerRef.x, y: attackerRef.y - 8, text: `☀️ -${reb} REBUKE`, color: '#facc15' });
      }
    }

    // Terra Faction Mechanic: Thornbark damage reflection!
    const reflectPct = targetPlayer.thornbarkTimer > 0 ? (targetPlayer.treantFormTimer > 0 ? 0.60 : 0.35) : targetPlayer.faction === 'Terra' ? 0.15 : 0;
    if (reflectPct > 0 && attackerRef) {
      const refl = Math.max(1, Math.round(amount * reflectPct));
      if (attackerRef.hp !== undefined && attackerRef.type === 'mob') {
        this.applyAuthoritativeDamage(room, targetPlayer, { kind: 'entity', ref: attackerRef }, refl, false, 'Thornbark', false);
      } else if (attackerRef.ws) {
        attackerRef.hp = Math.max(1, attackerRef.hp - refl);
        room.fxQueue.push({ kind: 'fct', x: attackerRef.x, y: attackerRef.y - 8, text: `🌿 -${refl} THORNS`, color: '#4ade80' });
      }
    }

    // Cast Interruption on Heavy Hit or Crit
    if (targetPlayer.castState && (isCrit || amount >= targetPlayer.maxHp * 0.18)) {
      targetPlayer.castState = null;
      targetPlayer.send({ type: 'cast_cancel' });
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y - 12, text: 'INTERRUPTED!', color: '#f87171' });
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
      room.fxQueue.push({ kind: 'smoke', x: targetPlayer.x, y: targetPlayer.y, count: 32, isDeath: true });
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y, text: 'FALLEN', color: '#ef4444', isCrit: true });
      this.broadcastToRoom(room, {
        type: 'sys_msg',
        category: 'combat',
        text: `[Combat] ${targetPlayer.displayName} was cast into the Fall by ${attackerName}!`,
      });
    }
  }

  getFactionBossSetDrop(room, ent) {
    const rType = String(room?.type || '').toLowerCase();
    const spKey = ent?.spriteKey || '';
    if (spKey === 'solariBoss' || rType.includes('solari')) {
      return ['sunforged_greathelm', 'sunforged_hauberk', 'sunforged_greaves', 'sunforged_warhammer'][Math.floor(Math.random() * 4)];
    }
    if (spKey === 'graniteBoss' || rType.includes('terra')) {
      return ['ironwood_horned_helm', 'ironwood_bark_chest', 'ironwood_thighguards', 'ironwood_spear'][Math.floor(Math.random() * 4)];
    }
    if (spKey === 'aetherBoss' || rType.includes('aether')) {
      return ['chrono_astral_hood', 'chrono_astral_robes', 'chrono_astral_skirt', 'chrono_warp_staff'][Math.floor(Math.random() * 4)];
    }
    if (spKey === 'umbriBoss' || rType.includes('umbri')) {
      return ['duskveil_shadow_mask', 'duskveil_assassin_garb', 'duskveil_void_chaps', 'duskveil_twin_daggers'][Math.floor(Math.random() * 4)];
    }
    if (rType.includes('celestial') || ent?.name?.includes('Aurelius')) {
      return ['crown_of_dawn', 'aurelius_sovereign_plate', 'aurelius_starforged_greaves', 'aurelius_morningstar_blade'][Math.floor(Math.random() * 4)];
    }
    const allSets = [
      'sunforged_greathelm', 'sunforged_hauberk', 'sunforged_greaves', 'sunforged_warhammer',
      'ironwood_horned_helm', 'ironwood_bark_chest', 'ironwood_thighguards', 'ironwood_spear',
      'chrono_astral_hood', 'chrono_astral_robes', 'chrono_astral_skirt', 'chrono_warp_staff',
      'duskveil_shadow_mask', 'duskveil_assassin_garb', 'duskveil_void_chaps', 'duskveil_twin_daggers',
      'crown_of_dawn', 'aurelius_sovereign_plate', 'aurelius_starforged_greaves', 'aurelius_morningstar_blade',
    ];
    return allSets[Math.floor(Math.random() * allSets.length)];
  }

  getBossAccessoryDrop(room, ent) {
    const accs = [
      'amulet_of_fury', 'amulet_of_glory', 'fire_cape', 'barrows_gloves',
      'crown_of_noon', 'chronocore_prism', 'radiant_shield_relic',
      'celestial_talisman', 'granite_boots', 'ring_of_the_sun',
      'ring_of_void_leech', 'ring_of_stone',
    ];
    return accs[Math.floor(Math.random() * accs.length)];
  }

  getBeginnerMobDrop(room) {
    const beginnerPool = [
      'iron_broadsword', 'novice_oak_staff', 'scout_leather_tunic',
      'scout_leather_leggings', 'iron_heater_shield', 'apprentice_focus_orb',
      'linen_traveller_cloak', 'copper_ring', 'radiant_cape',
      'vanguard_gauntlets', 'boots_of_haste',
    ];
    return beginnerPool[Math.floor(Math.random() * beginnerPool.length)];
  }

  spawnLootDrops(room, ent) {
    if (!room.loot) room.loot = [];
    const drops = [];

    // Vital / Glimmer recovery orbs
    const count = ent.isBoss ? 4 : Math.random() < 0.45 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      let kind = Math.random() < 0.5 ? 'vital' : 'glimmer';
      if (ent.isBoss && i === 0) kind = 'relic';
      drops.push({ kind, itemId: null, qty: 1 });
    }

    // 1. Stackable Currency: Solar Gold Sovereigns (all mobs drop gold!)
    const goldQty = ent.isBoss ? (150 + Math.floor(Math.random() * 200)) : (8 + Math.floor(Math.random() * 25));
    drops.push({ kind: 'item', itemId: 'solar_gold', qty: goldQty });

    // 2. Faction elemental currency
    const rType = String(room?.type || '').toLowerCase();
    let factionCurr = 'glimmer_shard';
    let factionCurrQty = ent.isBoss ? 15 + Math.floor(Math.random() * 20) : 1 + Math.floor(Math.random() * 3);
    if (rType.includes('aether')) factionCurr = 'chrono_gem';
    else if (rType.includes('terra')) factionCurr = 'verdant_amber';
    else if (rType.includes('umbri')) factionCurr = 'void_essence';
    drops.push({ kind: 'item', itemId: factionCurr, qty: factionCurrQty });

    // 3. Consumables (healing salves / glimmer draughts)
    if (ent.isBoss || Math.random() < 0.25) {
      const potId = Math.random() < 0.5 ? 'minor_healing_salve' : 'glimmer_draught';
      drops.push({ kind: 'item', itemId: potId, qty: ent.isBoss ? 2 : 1 });
    }

    // 4. Equipment Drops:
    // User rule: set pieces drop ONLY on faction bosses (rare 15%), non-bosses get beginner gear (10%)
    if (ent.isBoss) {
      const isRareSet = Math.random() < 0.15;
      const dropId = isRareSet ? this.getFactionBossSetDrop(room, ent) : this.getBossAccessoryDrop(room, ent);
      if (dropId) drops.push({ kind: 'item', itemId: dropId, qty: 1 });
    } else {
      if (Math.random() < 0.10) {
        const dropId = this.getBeginnerMobDrop(room);
        if (dropId) drops.push({ kind: 'item', itemId: dropId, qty: 1 });
      }
    }

    drops.forEach((d, i) => {
      const ang = (Math.PI * 2 * i) / Math.max(1, drops.length) - Math.PI / 2;
      const dist = drops.length > 1 ? 28 + (i % 2) * 8 : 0;
      room.lootSeq = (room.lootSeq || 0) + 1;
      room.loot.push({
        id: `loot_${room.lootSeq}`,
        kind: d.kind,
        itemId: d.itemId || null,
        qty: d.qty || 1,
        x: Math.round((ent.x + Math.cos(ang) * dist) * 10) / 10,
        y: Math.round((ent.y + Math.sin(ang) * dist * 0.65) * 10) / 10,
        ttl: d.kind === 'item' ? 55 : 28,
        maxTtl: d.kind === 'item' ? 55 : 28,
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

      if (l.kind === 'item') {
        const itemDef = EQUIPMENT_CATALOG[l.itemId];
        if (itemDef) {
          const added = this.accounts.addItemToInventory(taker.id, l.itemId, l.qty || 1);
          if (added) {
            room.loot.splice(i, 1);
            this.refreshClientFromAccount(taker.id);
            const isSet = itemDef.rarity.includes('Set') || itemDef.rarity.includes('Apex');
            let fctText = `✦ ${itemDef.name.toUpperCase()}`;
            if (itemDef.slot === 'currency') fctText = `+${l.qty || 1} ${itemDef.name.toUpperCase()}`;
            else if (itemDef.slot === 'consumable') fctText = `+${l.qty || 1} ${itemDef.name.toUpperCase()}`;
            else if (isSet) fctText = `✦ ${itemDef.name.toUpperCase()} (SET PIECE)`;

            room.fxQueue.push({
              kind: 'fct',
              x: taker.x,
              y: taker.y - 14,
              text: fctText,
              color: isSet ? '#facc15' : itemDef.slot === 'currency' ? '#fde047' : itemDef.slot === 'consumable' ? '#4ade80' : '#38bdf8',
              isCrit: isSet,
            });
            room.fxQueue.push({
              kind: 'spark',
              x: l.x,
              y: l.y,
              colors: isSet ? ['#facc15', '#fef08a', '#ffffff'] : ['#38bdf8', '#bae6fd', '#ffffff'],
              count: 12,
            });
          } else {
            // Inventory is full! Do not splice, let player know
            room.fxQueue.push({
              kind: 'fct',
              x: taker.x,
              y: taker.y - 14,
              text: `🎒 BAG FULL: ${itemDef.name.toUpperCase()}`,
              color: '#ef4444',
            });
          }
        } else {
          room.loot.splice(i, 1);
        }
      } else {
        room.loot.splice(i, 1);
        if (l.kind === 'vital') {
          const heal = Math.max(3, Math.round(taker.maxHp * 0.25));
          taker.hp = Math.min(taker.maxHp, taker.hp + heal);
          this.parties.syncPlayerVitals(taker.id);
          room.fxQueue.push({ kind: 'fct', x: taker.x, y: taker.y - 14, text: `+${heal} VITAL SHARD`, color: '#f87171' });
          room.fxQueue.push({ kind: 'spark', x: l.x, y: l.y, colors: ['#f87171', '#fecaca', '#ffffff'], count: 8 });
        } else if (l.kind === 'glimmer') {
          this.addPlayerGlimmer(room, taker, 30);
          room.fxQueue.push({ kind: 'fct', x: taker.x, y: taker.y - 14, text: '+30 GLIMMER SHARD', color: '#38bdf8' });
          room.fxQueue.push({ kind: 'spark', x: l.x, y: l.y, colors: ['#38bdf8', '#bae6fd', '#ffffff'], count: 8 });
        } else {
          this.awardPlayerXP(taker, 60, 'Relic Shard');
          room.fxQueue.push({ kind: 'fct', x: taker.x, y: taker.y - 14, text: '✦ RELIC SHARD +60 XP', color: '#fde047', isCrit: true });
          room.fxQueue.push({ kind: 'spark', x: l.x, y: l.y, colors: ['#fde047', '#fef08a', '#ffffff'], count: 12 });
        }
      }
    }
  }

  handleEntityDeath(room, ent, killerPlayer, killerSpell) {
    if (ent.isDying) return;
    ent.isDying = true;
    ent.deathAge = 0;

    room.fxQueue.push({ kind: 'smoke', x: ent.x, y: ent.y, count: ent.isBoss ? 44 : 28, isDeath: true });

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
          p.send({
            type: 'mob_killed',
            mobId: ent.id,
            mobName: ent.name,
            roomType: room.type,
            isBoss: Boolean(ent.isBoss),
          });
          if (ent.isBoss && ent.dropGear && EQUIPMENT_CATALOG[ent.dropGear]) {
            p.send({
              type: 'sys_msg',
              category: 'quest',
              text: `✨ [BOSS RELIC] ${ent.name} dropped ${EQUIPMENT_CATALOG[ent.dropGear].name}! Equip it in [I] Paperdoll!`,
            });
          }
        }
      }

      if (ent.isBoss) {
        this.broadcastToRoom(room, {
          type: 'chat',
          channel: 'world',
          sender: 'WORLD EVENT',
          text: `🏆 CONTINENTAL VICTORY: ${ent.name} has been vanquished! The Leylines surge with an Ancient Paragon Cache!`,
        });
        for (const pid of recipients) {
          const p = room.players.get(pid);
          if (p && p.prog && (p.prog.level || 1) >= 30) {
            this.awardPlayerXP(p, 450, 'Ancient Paragon Cache');
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
  // Authoritative Progression (XP, Levels, Stats, Ranks & Paragon)
  // ==========================================
  awardPlayerXP(player, amount, reason = '', statsMetaPatch = null) {
    if (amount <= 0) return;
    const tCfg = getTormentConfig(player.prog?.tormentLevel || 0);
    if (tCfg.xpMult && tCfg.xpMult > 1) {
      amount = Math.round(amount * tCfg.xpMult);
    }
    let leveled = false;
    let paragonLeveled = false;

    if ((player.prog.level || 1) < MAX_BASE_LEVEL) {
      player.prog.xp = (player.prog.xp || 0) + amount;
      while ((player.prog.level || 1) < MAX_BASE_LEVEL && player.prog.xp >= xpForNextLevel(player.prog.level)) {
        player.prog.xp -= xpForNextLevel(player.prog.level);
        player.prog.level++;
        player.prog.statPoints = (player.prog.statPoints || 0) + 3;
        player.prog.skillPoints = (player.prog.skillPoints || 0) + 1;
        leveled = true;
      }
    } else {
      // Late Game: XP overflows into Paragon Resonance!
      if (!player.prog.paragon) {
        player.prog.paragon = { solari_radiance: 0, umbri_shadowcraft: 0, terra_bulwark: 0, aether_chronoflux: 0 };
      }
      player.prog.paragonLevel = player.prog.paragonLevel || 0;
      player.prog.paragonPoints = player.prog.paragonPoints || 0;
      player.prog.paragonXp = (player.prog.paragonXp || 0) + amount;
      while (player.prog.paragonXp >= paragonXpForLevel(player.prog.paragonLevel)) {
        player.prog.paragonXp -= paragonXpForLevel(player.prog.paragonLevel);
        player.prog.paragonLevel++;
        player.prog.paragonPoints++;
        paragonLeveled = true;
      }
    }

    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    if (leveled || paragonLeveled) {
      player.hp = player.maxHp;
      const room = this.rooms.get(player.roomId);
      if (room) {
        room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#fde047', '#38bdf8', '#4ade80', '#c084fc', '#ffffff'] });
        const lvlTxt = paragonLeveled ? `PARAGON ${player.prog.paragonLevel}!` : `LEVEL ${player.prog.level}!`;
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: lvlTxt, color: paragonLeveled ? '#c084fc' : '#fde047', isCrit: true });
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
      leveled: leveled || paragonLeveled,
    });
    this.parties.syncPlayerVitals(player.id);
  }

  handleUpgradeParagon(player, affinityId) {
    if (!canUpgradeParagon(player.prog, affinityId)) return;
    if (!player.prog.paragon) {
      player.prog.paragon = { solari_radiance: 0, umbri_shadowcraft: 0, terra_bulwark: 0, aether_chronoflux: 0 };
    }
    player.prog.paragonPoints = (player.prog.paragonPoints || 0) - 1;
    player.prog.paragon[affinityId] = (player.prog.paragon[affinityId] || 0) + 1;
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

  handleSetTorment(player, tormentLevel) {
    if (!player.prog) return;
    const tLevel = Math.max(0, Math.min(TORMENT_LEVELS.length - 1, Math.floor(tormentLevel || 0)));
    if (tLevel > 0 && (player.prog.level || 1) < 30) {
      player.send({
        type: 'sys_msg',
        category: 'combat',
        text: '⚠️ Leyline Torment requires Level 30 Champion status!',
      });
      return;
    }
    player.prog.tormentLevel = tLevel;
    const tCfg = getTormentConfig(tLevel);
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
      xpGained: 0,
      reason: `Torment: ${tCfg.name}`,
      leveled: false,
    });
    player.send({
      type: 'sys_msg',
      category: 'combat',
      text: `🔥 [TORMENT] Difficulty set to ${tCfg.name}! ${tCfg.desc}`,
    });
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

  handleUpgradeSkill(player, abilityId) {
    if (!abilityId) return;
    const spec = ABILITIES_CATALOG[abilityId];
    if (!spec) return;
    if (!canUpgradeAbility(player.prog, abilityId)) return;

    player.prog.skillPoints = Math.max(0, (player.prog.skillPoints || 0) - 1);
    if (!player.prog.skills) player.prog.skills = {};
    player.prog.skills[abilityId] = Math.min(spec.maxRank || 5, (player.prog.skills[abilityId] || 0) + 1);

    for (const [slotStr, abId] of Object.entries(player.loadout || {})) {
      if (abId === abilityId) {
        player.prog.ranks[slotStr] = player.prog.skills[abilityId];
      }
    }

    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
  }

  handleUpgradeRank(player, slot) {
    const spec = getSlotAbilitySpec(player.loadout, slot);
    if (spec && spec.id) {
      return this.handleUpgradeSkill(player, spec.id);
    }
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
    // Early exit for unoccupied rooms (except Warzone to process siege timers)
    if (room.players.size === 0 && room.type !== ROOM_TYPES.NEXUS_WARZONE) return;

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
      if (p.rebukeTimer > 0) p.rebukeTimer = Math.max(0, p.rebukeTimer - dt);
      if (p.auroraStrideTimer > 0) p.auroraStrideTimer = Math.max(0, p.auroraStrideTimer - dt);
      if (p.solarAscensionTimer > 0) {
        p.solarAscensionTimer = Math.max(0, p.solarAscensionTimer - dt);
        p.ascensionPulse = (p.ascensionPulse || 0) + dt;
        if (p.ascensionPulse >= 1.2) {
          p.ascensionPulse = 0;
          room.fxQueue.push({ kind: 'spark', x: p.x, y: p.y - 6, colors: ['#facc15', '#fef08a', '#ffffff'], count: 12 });
          for (const h of this.getAllHostilesInRadius(room, p, p.x, p.y, 64)) {
            this.applyAuthoritativeDamage(room, p, h, 6, false, 'Solar Radiance Pulse', false);
          }
        }
      }
      if (p.abyssalShroudTimer > 0) p.abyssalShroudTimer = Math.max(0, p.abyssalShroudTimer - dt);
      if (p.voidformTimer > 0) p.voidformTimer = Math.max(0, p.voidformTimer - dt);
      if (p.rootedBastionTimer > 0) p.rootedBastionTimer = Math.max(0, p.rootedBastionTimer - dt);
      if (p.treantFormTimer > 0) p.treantFormTimer = Math.max(0, p.treantFormTimer - dt);
      if (p.phaseShiftTimer > 0) p.phaseShiftTimer = Math.max(0, p.phaseShiftTimer - dt);
      if (p.temporalApotheosisTimer > 0) p.temporalApotheosisTimer = Math.max(0, p.temporalApotheosisTimer - dt);

      // Terra Primal Bastion Passive Health Regeneration (0.5 HP/s per point)
      const hpRegen = calcHpRegenPerSec(p.prog);
      if (hpRegen > 0 && !p.isDead && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + hpRegen * dt);
      }

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
        if (p.isDead || p.freezeTimer > 0) {
          p.castState = null;
          p.send({ type: 'cast_cancel' });
        } else if (Math.hypot(p.x - p.castState.castX, p.y - p.castState.castY) > 16) {
          p.castState = null;
          p.send({ type: 'cast_cancel' });
          room.fxQueue.push({ kind: 'fct', x: p.x, y: p.y - 12, text: 'INTERRUPTED!', color: '#f87171' });
        } else {
          p.castState.remaining -= dt;
          if (p.castState.remaining <= 0) {
            const cs = p.castState;
            p.castState = null;
            this.executeAuthoritativeRite(room, p, cs);
          }
        }
      }

      // Check Waygate / Rift Portals & Seamless Boundary Transitions in Room
      if (p.portalCooldown <= 0) {
        // Seamless Boundary Transitions across the expanded 48x48 perimeter (Center Border Crossing)
        if (room.edgeTransitions) {
          const pad = 14;
          const GATE_HALF_WIDTH = 72; // Center road opening
          if (p.x >= room.halfW - pad && room.edgeTransitions.east && Math.abs(p.y) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.east;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = targetCfg ? -targetCfg.halfW + 56 : 56;
            const newY = Math.max(-36, Math.min(36, p.y));
            this.joinRoom(p, dest, null, newX, newY, 'right');
            continue;
          }
          if (p.x <= -room.halfW + pad && room.edgeTransitions.west && Math.abs(p.y) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.west;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = targetCfg ? targetCfg.halfW - 56 : -56;
            const newY = Math.max(-36, Math.min(36, p.y));
            this.joinRoom(p, dest, null, newX, newY, 'left');
            continue;
          }
          if (p.y <= -room.halfH + pad && room.edgeTransitions.north && Math.abs(p.x) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.north;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = Math.max(-36, Math.min(36, p.x));
            const newY = targetCfg ? targetCfg.halfH - 56 : -56;
            this.joinRoom(p, dest, null, newX, newY, 'up');
            continue;
          }
          if (p.y >= room.halfH - pad && room.edgeTransitions.south && Math.abs(p.x) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.south;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = Math.max(-36, Math.min(36, p.x));
            const newY = targetCfg ? -targetCfg.halfH + 56 : 56;
            this.joinRoom(p, dest, null, newX, newY, 'down');
            continue;
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
          if (e.isBoss && !e.isDying) {
            const hpPercent = (e.hp / e.maxHp) * 100;
            e.phase = e.phase || 1;

            // Phase 2: Frenzy & Minions at 65% HP
            if (hpPercent <= 65 && e.phase === 1) {
              e.phase = 2;
              e.baseDamage = e.baseDamage || e.damage || 7;
              e.damage = Math.floor(e.baseDamage * 1.35);
              e.speed = Math.floor((e.speed || 38) * 1.15);
              this.broadcastToRoom(room, {
                type: 'chat',
                channel: 'world',
                sender: 'WORLD EVENT',
                text: `⚡ ${e.name} roars into Phase 2, summoning guardians!`,
              });
              room.fxQueue.push({ kind: 'smoke', x: e.x, y: e.y, count: 32 });
              for (let m = 0; m < 3; m++) {
                const minion = {
                  id: `${e.id}_m_${Date.now()}_${m}`,
                  name: `${e.name} Guardian`,
                  sub: 'Boss Minion',
                  type: 'mob',
                  isMinion: true,
                  spriteKey: e.spriteKey === 'solariBoss' ? 'solariSentinel' : e.spriteKey === 'umbriBoss' ? 'duskFiend' : 'voidStalker',
                  x: e.x + (Math.random() * 40 - 20),
                  y: e.y + (Math.random() * 40 - 20),
                  origX: e.x,
                  origY: e.y,
                  hp: Math.max(15, Math.round(e.maxHp * 0.18)),
                  maxHp: Math.max(15, Math.round(e.maxHp * 0.18)),
                  damage: Math.max(2, Math.round((e.damage || 6) * 0.5)),
                  xpReward: 35,
                  speed: 52,
                  aggroRange: 150,
                  attackRange: 28,
                  radius: 14,
                  hitFlash: 0,
                  dammers: new Set(),
                };
                room.entities.push(minion);
                room.fxQueue.push({ kind: 'smoke', x: minion.x, y: minion.y, count: 16 });
              }
            }

            // Phase 3: Enrage & Area Shockwaves at 25% HP (Shattered Nexus cannot enrage)
            const isNexusShard = e.type === 'siege_shard' || e.id === 'siege_shard' || (e.name && e.name.includes('Nexus'));
            if (isNexusShard) {
              e.enraged = false;
            } else if (hpPercent <= 25 && e.phase === 2) {
              e.phase = 3;
              e.enraged = true;
              e.baseDamage = e.baseDamage || e.damage || 7;
              e.damage = Math.floor(e.baseDamage * 1.6);
              e.speed = Math.floor((e.speed || 38) * 1.25);
              this.broadcastToRoom(room, {
                type: 'chat',
                channel: 'world',
                sender: 'WORLD EVENT',
                text: `🔥 BEWARE: ${e.name} has ENRAGED! Ground shockwaves inbound!`,
              });
              room.fxQueue.push({ kind: 'smoke', x: e.x, y: e.y, count: 48 });
            }

            // Boss Telegraphed AoE Ability (1.4-1.7s warning circle)
            e.abilityCooldown = (e.abilityCooldown ?? (e.enraged ? 3.5 : 5.8)) - dt;
            if (e.abilityCooldown <= 0) {
              e.abilityCooldown = e.enraged ? 3.5 : 5.8;
              let telLabel = e.enraged ? '💥 ENRAGED CATACLYSM' : '⚡ TITAN SLAM';
              let telColor = e.enraged ? '#ef4444' : '#f59e0b';
              let shockRadius = e.enraged ? 98 : 70;
              let warnDuration = 1.6;

              if (e.spriteKey === 'solariBoss') {
                telLabel = e.enraged ? '🔥 CORONA CATACLYSM' : '☀️ SOLAR FLARE BURST';
                telColor = '#facc15';
                shockRadius = e.enraged ? 102 : 74;
              } else if (e.spriteKey === 'umbriBoss') {
                telLabel = e.enraged ? '💀 VOID SINGULARITY' : '🌑 SHADOW RIFT';
                telColor = '#a855f7';
                shockRadius = e.enraged ? 94 : 68;
                warnDuration = 1.5;
              } else if (e.spriteKey === 'graniteBoss') {
                telLabel = e.enraged ? '🪨 TECTONIC COLLAPSE' : '🌿 IRONWOOD SLAM';
                telColor = '#4ade80';
                shockRadius = e.enraged ? 106 : 78;
                warnDuration = 1.7;
              } else if (e.spriteKey === 'aetherBoss') {
                telLabel = e.enraged ? '🌀 CHRONO SINGULARITY' : '⚡ TEMPORAL DISRUPTION';
                telColor = '#38bdf8';
                shockRadius = e.enraged ? 96 : 70;
                warnDuration = 1.4;
              }

              const shockDmg = Math.round((e.damage || 7) * (e.enraged ? 1.9 : 1.35));
              const tgtX = nearestPlayer && Math.random() < 0.65 ? nearestPlayer.x : e.x;
              const tgtY = nearestPlayer && Math.random() < 0.65 ? nearestPlayer.y : e.y;

              room.fxQueue.push({
                kind: 'fct',
                x: tgtX,
                y: tgtY - 14,
                text: `⚠️ ${telLabel}!`,
                color: telColor,
                isCrit: true,
              });

              room.groundZones.push({
                id: `tel_${crypto.randomUUID().slice(0, 6)}`,
                type: 'telegraph',
                color: telColor,
                label: telLabel,
                x: tgtX,
                y: tgtY,
                radius: shockRadius,
                age: 0,
                maxAge: warnDuration,
                damage: shockDmg,
                bossName: e.name,
                bossRef: e,
                snare: e.spriteKey === 'graniteBoss' ? 2.0 : 0,
              });
            }
          }

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
            const nextMobX = e.x + ((nearestPlayer.x - e.x) / bestD) * e.speed * speedMult * dt;
            const nextMobY = e.y + ((nearestPlayer.y - e.y) / bestD) * e.speed * speedMult * dt;
            if (!isWaterTile(nextMobX, nextMobY, room.type)) {
              e.x = nextMobX;
              e.y = nextMobY;
            } else if (!isWaterTile(nextMobX, e.y, room.type)) {
              e.x = nextMobX;
            } else if (!isWaterTile(e.x, nextMobY, room.type)) {
              e.y = nextMobY;
            }
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
      if (gz.age >= gz.maxAge) {
        if (gz.type === 'telegraph') {
          // Detonation shockwave
          room.groundZones.push({
            id: `shock_${crypto.randomUUID().slice(0, 6)}`,
            type: 'shockwave',
            color: gz.color || '#ef4444',
            x: gz.x,
            y: gz.y,
            radius: gz.radius,
            age: 0,
            maxAge: 0.35,
          });
          room.fxQueue.push({ kind: 'smoke', x: gz.x, y: gz.y, count: 28 });
          for (const p of room.players.values()) {
            if (p.isDead || p.stealthed) continue;
            const distP = Math.hypot(gz.x - p.x, gz.y - p.y);
            if (distP <= gz.radius) {
              this.damagePlayerSession(room, p, gz.damage || 14, `${gz.bossName || 'Boss'} ${gz.label || 'Cataclysm'}`, false, gz.bossRef);
              const ang = Math.atan2(p.y - gz.y, p.x - gz.x);
              p.x = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, p.x + Math.cos(ang) * 24));
              p.y = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, p.y + Math.sin(ang) * 24));
              if (gz.snare) p.snareTimer = Math.max(p.snareTimer || 0, gz.snare);
            }
          }
        }
        room.groundZones.splice(i, 1);
      }
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
      targetRoom: e.targetRoom,
      faction: e.faction,
      team: e.team,
      isBoss: e.isBoss || false,
      affinity: e.affinity,
      buffName: e.buffName,
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
      label: gz.label || '',
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
      loot: (room.loot || []).map((l) => ({ id: l.id, kind: l.kind, itemId: l.itemId || null, x: l.x, y: l.y, ttl: Math.round(l.ttl * 10) / 10 })),
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
