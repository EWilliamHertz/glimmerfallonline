// ==========================================
// RoomManager — World & Faction Biome Population
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

export const worldPopulationMethods = {
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
          x: 165,
          y: 20,
          origX: 165,
          origY: 20,
          hp: 120,
          maxHp: 120,
          xpReward: 65,
          radius: 15,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          // The strongest training dummy: a 25,000 HP damage-test post that never feeds progression.
          id: 'dummy_titan',
          name: 'Titan Training Dummy',
          sub: 'Lv.50 Endless Damage Trial (No XP)',
          type: 'dummy',
          spriteKey: 'dummy',
          x: 225,
          y: 20,
          origX: 225,
          origY: 20,
          hp: 25000,
          maxHp: 25000,
          xpReward: 0,
          noHitXp: true,
          radius: 20,
          hitFlash: 0,
          dammers: new Set(),
        }
      );
    } else if (room.type === ROOM_TYPES.NEXUS_WARZONE) {
      // 4 Faction 300-HP Outpost Nexuses anchored in the 4 continental quadrants
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
          sub: `300 HP ${op.faction} Outpost Nexus [Continental]`,
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

      // Central Caldera: Shattered Nexus Shard
      room.entities.push({
        id: 'siege_shard',
        name: 'Shattered Nexus Shard',
        sub: '⚡ Continental Nexus Core (PvPvE)',
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
        sub: 'Lv.30 Target Post',
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

      // 4 Grand Regional World Bosses across the Open World Continent
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
      room.type === ROOM_TYPES.CELESTIAL_ASCENT ||
      room.type === ROOM_TYPES.STARFALL_CRATER ||
      room.type === ROOM_TYPES.ABYSSAL_RIFT ||
      room.type === ROOM_TYPES.IRONWOOD_TIMBERLANDS ||
      room.type === ROOM_TYPES.CORAL_COAST ||
      room.type === ROOM_TYPES.STARLIGHT_GROVE ||
      room.type === ROOM_TYPES.CHRONOCORE_CITADEL
    ) {
      this.populateSubZoneDungeon(room);
    } else if (room.type === ROOM_TYPES.ARENA_3V3) {
      room.entities.push(
        {
          id: 'blue_nexus',
          name: 'Solari Sanctuary Nexus',
          sub: '2500 HP Blue Team Core',
          type: 'ally_nexus',
          team: 'blue',
          spriteKey: 'nexusBlue',
          x: 0,
          y: 220,
          hp: 2500,
          maxHp: 2500,
          xpReward: 220,
          radius: 22,
          hitFlash: 0,
          dammers: new Set(),
        },
        {
          id: 'red_nexus',
          name: 'Umbri Dominion Nexus',
          sub: '2500 HP Red Team Core',
          type: 'nexus',
          team: 'red',
          spriteKey: 'nexusRed',
          x: 0,
          y: -215,
          hp: 2500,
          maxHp: 2500,
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
  },

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
  },
};
