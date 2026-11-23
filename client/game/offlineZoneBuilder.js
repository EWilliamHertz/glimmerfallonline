// ==========================================
// GlimmerFall Online 2D — Offline Zone Entities & Elite/Skilling Population
// Extracted from client/game.js for modular maintainability
// ==========================================

import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  GRAND_FONT_POSITIONS,
  SKILLING_LAYOUTS,
  SKILLING_NODE_TYPES,
  ELITE_AFFIXES,
  GLIMMER_CIPHERS_CATALOG,
  pickWildStrayEchoForZone,
  SURFACE_ROOM_TYPES,
  SURFACE_ZONE_PLACEMENT,
  SURFACE_WORLD_BOUNDS,
  isSurfaceRoomType,
  localToWorld,
} from '../../shared/protocol.js';
import { getActiveWorldEvent } from '../../shared/worldEvents.js';

export function createOfflineZoneBuilder({
  setupZoneDecor,
  getCurrentRoomType,
  getProps,
  getPlayer,
  getCamera,
  net = null,
  getNet = null,
  isSinglePlayer,
  hasEnteredWorld,
  saveProgressionLocal,
  applyOfflineZoneState,
}) {
  let lastBuiltSurfaceMode = false;
  let lastOfflineEntities = [];

  function populateSingleOfflineZone(zoneType, zoneEntities, propsList, zonePlayer, hasCustomSpawn, setPlayerPos = true) {
    const pushEntityList = [];
    const curType = zoneType;
    const player = setPlayerPos ? zonePlayer : { x: 0, y: 0 };

    if (curType === ROOM_TYPES.SANCTUARY_HUB) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 96;
      }
      pushEntityList.push(
        { id: 'dummy_1', name: 'Sanctuary Dummy', sub: 'Lv.1 Awakening Training Post', type: 'dummy', spriteKey: 'dummy', x: 0, y: 52, origX: 0, origY: 52, hp: 30, maxHp: 30, xpReward: 30, radius: 14, hitFlash: 0 },
        { id: 'dummy_2', name: 'Armored Training Post', sub: 'Lv.5 Resilient Training Post', type: 'dummy', spriteKey: 'dummy', x: 165, y: 20, origX: 165, origY: 20, hp: 120, maxHp: 120, xpReward: 65, radius: 15, hitFlash: 0 },
        { id: 'dummy_titan', name: 'Titan Training Dummy', sub: 'Lv.50 Endless Damage Trial (No XP)', type: 'dummy', spriteKey: 'dummy', x: 225, y: 20, origX: 225, origY: 20, hp: 25000, maxHp: 25000, xpReward: 0, noHitXp: true, radius: 20, hitFlash: 0 },
        { id: 'tut_font', name: 'Awakening Glimmer Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -88, y: 22, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'tut_font_2', name: 'East Glimmer Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 88, y: 22, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.ARENA_3V3) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 175;
      }
      pushEntityList.push(
        { id: 'blue_nexus', name: 'Solari Sanctuary Nexus', sub: '2500 HP Ally Core', type: 'ally_nexus', spriteKey: 'nexusBlue', x: 0, y: 220, hp: 2500, maxHp: 2500, radius: 22, hitFlash: 0 },
        { id: 'red_nexus', name: 'Umbri Dominion Nexus', sub: '2500 HP Enemy Core', type: 'nexus', spriteKey: 'nexusRed', x: 0, y: -215, hp: 2500, maxHp: 2500, xpReward: 220, radius: 22, hitFlash: 0 },
        { id: 'enemy_1', name: 'Void Stalker [Umbri]', sub: 'Enemy Vanguard', type: 'mob', spriteKey: 'voidStalker', x: -64, y: -85, origX: -64, origY: -85, hp: 25, maxHp: 25, damage: 4, xpReward: 65, speed: 54, aggroRange: 230, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'enemy_2', name: 'Gloam Reaper [Umbri]', sub: 'Enemy Harvester', type: 'mob', spriteKey: 'voidStalker', x: 0, y: -105, origX: 0, origY: -105, hp: 22, maxHp: 22, damage: 4, xpReward: 65, speed: 60, aggroRange: 230, attackRange: 26, radius: 14, hitFlash: 0 },
        { id: 'enemy_3', name: 'Brambleheart Behemoth', sub: 'Enemy Terra Titan', type: 'mob', isBoss: true, spriteKey: 'graniteBoss', x: 64, y: -85, origX: 64, origY: -85, hp: 34, maxHp: 34, damage: 5, xpReward: 110, speed: 42, aggroRange: 230, attackRange: 32, radius: 20, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.SOLARI_CITADEL) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      pushEntityList.push(
        { id: 'sol_mob_1', name: 'Sunforged Sentinel', sub: 'Lv.3 Solari Construct', type: 'mob', spriteKey: 'solariSentinel', x: -75, y: 35, origX: -75, origY: 35, hp: 36, maxHp: 36, damage: 4, xpReward: 65, speed: 52, aggroRange: 112, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_mob_2', name: 'Lantern Inquisitor', sub: 'Lv.4 Radiant Zealot', type: 'mob', spriteKey: 'solariSentinel', x: 75, y: 25, origX: 75, origY: 25, hp: 38, maxHp: 38, damage: 5, xpReward: 75, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_node_1', name: 'Solari Dawn Well', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'sol_boss', name: 'High Sunfire Colossus', sub: '★ Lv.6 Golden Citadel Boss', type: 'mob', isBoss: true, dropGear: 'sunfire_greatsword', spriteKey: 'solariBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 85, maxHp: 85, damage: 6, xpReward: 185, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.UMBRI_UNDERCITY) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      pushEntityList.push(
        { id: 'umb_mob_1', name: 'Duskveil Stalker', sub: 'Lv.3 Umbri Assassin', type: 'mob', spriteKey: 'voidStalker', x: -80, y: 30, origX: -80, origY: 30, hp: 34, maxHp: 34, damage: 5, xpReward: 65, speed: 55, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_mob_2', name: 'Duskveil Bog Fiend', sub: 'Lv.4 Graveglass Reaper', type: 'mob', spriteKey: 'duskFiend', x: 80, y: 25, origX: 80, origY: 25, hp: 36, maxHp: 36, damage: 5, xpReward: 75, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_node_1', name: 'Duskveil Shadow Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'umb_boss', name: 'Graveglass Archlich', sub: '★ Lv.6 Sepulcher Boss', type: 'mob', isBoss: true, dropGear: 'scythe_soulreaper', spriteKey: 'umbriBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 80, maxHp: 80, damage: 7, xpReward: 185, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.TERRA_ORCHARD) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      pushEntityList.push(
        { id: 'ter_mob_1', name: 'Bramble Treant', sub: 'Lv.3 Terra Guardian', type: 'mob', spriteKey: 'terraWarden', x: -78, y: 32, origX: -78, origY: 32, hp: 40, maxHp: 40, damage: 4, xpReward: 65, speed: 52, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_mob_2', name: 'Rootdeep Stonekin', sub: 'Lv.4 Ironwood Guardian', type: 'mob', spriteKey: 'terraWarden', x: 78, y: 25, origX: 78, origY: 25, hp: 42, maxHp: 42, damage: 5, xpReward: 75, speed: 50, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_node_1', name: 'Terra Root Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'ter_boss', name: 'Elder Rootdeep Behemoth', sub: '★ Lv.6 Orchard Boss', type: 'mob', isBoss: true, dropGear: 'ironwood_armor', spriteKey: 'graniteBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 95, maxHp: 95, damage: 6, xpReward: 185, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.AETHER_SPIRE) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 170;
      }
      pushEntityList.push(
        { id: 'aeth_mob_1', name: 'Chrono Anomaly', sub: 'Lv.3 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: -78, y: 32, origX: -78, origY: 32, hp: 34, maxHp: 34, damage: 5, xpReward: 65, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_mob_2', name: 'Chrono Construct', sub: 'Lv.4 Fractured Sentinel', type: 'mob', spriteKey: 'aetherWeaver', x: 78, y: 25, origX: 78, origY: 25, hp: 36, maxHp: 36, damage: 5, xpReward: 75, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_node_1', name: 'Mirrorgate Star Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 40, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'aeth_boss', name: 'Archon of the Continuum', sub: '★ Lv.6 Mirrorgate Boss', type: 'mob', isBoss: true, dropGear: 'mirror_shield', spriteKey: 'aetherBoss', x: 0, y: -115, origX: 0, origY: -115, hp: 82, maxHp: 82, damage: 7, xpReward: 185, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 190;
      }
      pushEntityList.push(
        { id: 'ruin_mob_1', name: 'Ancient Ruin Golem', sub: 'Lv.4 Keystone Construct', type: 'mob', spriteKey: 'graniteBoss', x: -90, y: 40, origX: -90, origY: 40, hp: 44, maxHp: 44, damage: 4, xpReward: 75, speed: 42, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ruin_mob_2', name: 'Ancient Ruin Golem', sub: 'Lv.4 Keystone Construct', type: 'mob', spriteKey: 'graniteBoss', x: 90, y: 40, origX: 90, origY: 40, hp: 44, maxHp: 44, damage: 4, xpReward: 75, speed: 42, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ruin_mob_3', name: 'Lost Shard Sentinel', sub: 'Lv.5 Prismatic Sentinel', type: 'mob', spriteKey: 'mobSolari', x: -75, y: -50, origX: -75, origY: -50, hp: 48, maxHp: 48, damage: 5, xpReward: 85, speed: 52, aggroRange: 120, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'ruin_mob_4', name: 'Lost Shard Sentinel', sub: 'Lv.5 Prismatic Sentinel', type: 'mob', spriteKey: 'mobAether', x: 75, y: -50, origX: 75, origY: -50, hp: 48, maxHp: 48, damage: 5, xpReward: 85, speed: 52, aggroRange: 120, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'ruin_boss', name: 'The Prismatic Golem', sub: '★ Lv.7 First Nexus Guardian', type: 'mob', isBoss: true, dropGear: 'prismatic_keystone', spriteKey: 'graniteBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 88, maxHp: 88, damage: 7, xpReward: 210, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'tut_font_ruins_c', name: 'Prismatic Keystone Spire', sub: 'Ancient Prismatic Node [E]', type: 'node', spriteKey: 'node', x: 0, y: 0, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'tut_font_ruins_w', name: 'West Ruin Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -140, y: -30, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'tut_font_ruins_e', name: 'East Ruin Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 140, y: -30, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.SOLARI_SUNKEN_VAULT) {
      if (setPlayerPos && !hasCustomSpawn) { player.x = 0; player.y = 180; }
      pushEntityList.push(
        { id: 'vault_mob_1', name: 'Sunfire Automaton', sub: 'Lv.4 Solari Automaton', type: 'mob', spriteKey: 'solariSentinel', x: -85, y: 30, origX: -85, origY: 30, hp: 42, maxHp: 42, damage: 5, xpReward: 80, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'vault_mob_2', name: 'Sunfire Automaton', sub: 'Lv.4 Solari Automaton', type: 'mob', spriteKey: 'solariSentinel', x: 85, y: 30, origX: 85, origY: 30, hp: 42, maxHp: 42, damage: 5, xpReward: 80, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'vault_mob_3', name: 'Dawnblade Crusader', sub: 'Lv.5 Solari Elite Guard', type: 'mob', spriteKey: 'solariSentinel', x: -60, y: -50, origX: -60, origY: -50, hp: 46, maxHp: 46, damage: 5, xpReward: 90, speed: 55, aggroRange: 118, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'vault_boss', name: 'Solaris Core Colossus', sub: '★ Lv.8 Sunken Dawn Titan', type: 'mob', isBoss: true, dropGear: 'dawnfire_crest', spriteKey: 'solariBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 96, maxHp: 96, damage: 7, xpReward: 240, speed: 40, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'vault_node_1', name: 'Dawnstone Glimmer Well', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'vault_node_2', name: 'Solar Core Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.UMBRI_SHADOW_LABYRINTH) {
      if (setPlayerPos && !hasCustomSpawn) { player.x = 0; player.y = 180; }
      pushEntityList.push(
        { id: 'lab_mob_1', name: 'Graveglass Phantom', sub: 'Lv.4 Umbri Specter', type: 'mob', spriteKey: 'voidStalker', x: -90, y: 30, origX: -90, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'lab_mob_2', name: 'Graveglass Phantom', sub: 'Lv.4 Umbri Specter', type: 'mob', spriteKey: 'voidStalker', x: 90, y: 30, origX: 90, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'lab_mob_3', name: 'Gloam Assassin', sub: 'Lv.5 Umbri Elite', type: 'mob', spriteKey: 'duskFiend', x: -65, y: -60, origX: -65, origY: -60, hp: 42, maxHp: 42, damage: 6, xpReward: 90, speed: 60, aggroRange: 120, attackRange: 30, radius: 14, hitFlash: 0 },
        { id: 'lab_boss', name: 'Abyssal Devourer', sub: '★ Lv.8 Shade of the Void', type: 'mob', isBoss: true, dropGear: 'void_soulblade', spriteKey: 'umbriBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 92, maxHp: 92, damage: 8, xpReward: 240, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'lab_node_1', name: 'Graveglass Leyline Shroud', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'lab_node_2', name: 'Void Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY) {
      if (setPlayerPos && !hasCustomSpawn) { player.x = 0; player.y = 180; }
      pushEntityList.push(
        { id: 'hollow_mob_1', name: 'Ironwood Barkkin', sub: 'Lv.4 Terra Forestkin', type: 'mob', spriteKey: 'terraWarden', x: -85, y: 30, origX: -85, origY: 30, hp: 48, maxHp: 48, damage: 4, xpReward: 80, speed: 50, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'hollow_mob_2', name: 'Ironwood Barkkin', sub: 'Lv.4 Terra Forestkin', type: 'mob', spriteKey: 'terraWarden', x: 85, y: 30, origX: 85, origY: 30, hp: 48, maxHp: 48, damage: 4, xpReward: 80, speed: 50, aggroRange: 112, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'hollow_mob_3', name: 'Sporeling Stalker', sub: 'Lv.5 Terra Beast', type: 'mob', spriteKey: 'terraWarden', x: 70, y: -60, origX: 70, origY: -60, hp: 44, maxHp: 44, damage: 5, xpReward: 90, speed: 55, aggroRange: 118, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'hollow_boss', name: 'Primordial Ironbark', sub: '★ Lv.8 Elder Treant of the Hollow', type: 'mob', isBoss: true, dropGear: 'primordial_bark_chest', spriteKey: 'graniteBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 110, maxHp: 110, damage: 7, xpReward: 250, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'hollow_node_1', name: 'Ironwood Blossom Node', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'hollow_node_2', name: 'Rootdeep Heart Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE) {
      if (setPlayerPos && !hasCustomSpawn) { player.x = 0; player.y = 180; }
      pushEntityList.push(
        { id: 'archive_mob_1', name: 'Chrono Echo', sub: 'Lv.4 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: -85, y: 30, origX: -85, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'archive_mob_2', name: 'Chrono Echo', sub: 'Lv.4 Aether Construct', type: 'mob', spriteKey: 'aetherWeaver', x: 85, y: 30, origX: 85, origY: 30, hp: 38, maxHp: 38, damage: 6, xpReward: 80, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'archive_mob_3', name: 'Astral Weaver', sub: 'Lv.5 Continuum Mage', type: 'mob', spriteKey: 'aetherWeaver', x: -70, y: -60, origX: -70, origY: -60, hp: 42, maxHp: 42, damage: 6, xpReward: 90, speed: 56, aggroRange: 118, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'archive_boss', name: 'Continuum Singularity', sub: '★ Lv.8 Paradox Titan', type: 'mob', isBoss: true, dropGear: 'chronos_singularity_core', spriteKey: 'aetherBoss', x: 0, y: -120, origX: 0, origY: -120, hp: 94, maxHp: 94, damage: 8, xpReward: 240, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'archive_node_1', name: 'Continuum Time Spire', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: -125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 },
        { id: 'archive_node_2', name: 'Astral Mirrorgate Font', sub: 'Glimmer Leyline Spire [E]', type: 'node', spriteKey: 'node', x: 125, y: 20, charges: 3, maxCharges: 3, radius: 15, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.CELESTIAL_ASCENT) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 1040;
      }
      pushEntityList.push(
        { id: 'cel_node_1', name: 'Font of the Morning Star', sub: 'Empyrean Glimmer Spire [E]', type: 'node', spriteKey: 'node', x: -120, y: 600, charges: 6, maxCharges: 6, radius: 18, hitFlash: 0 },
        { id: 'cel_node_2', name: 'Shrine of Empyrean Resonance', sub: 'Ancient Leyline Shrine [E]', type: 'node', spriteKey: 'node', x: 120, y: 600, charges: 6, maxCharges: 6, radius: 18, hitFlash: 0 },
        { id: 'cel_node_summit', name: 'Apex Keystone Font', sub: 'Titan Glimmer Core [E]', type: 'node', spriteKey: 'node', x: 0, y: -450, charges: 8, maxCharges: 8, radius: 18, hitFlash: 0 },
        { id: 'cel_mob_1', name: 'Empyrean Star-Knight', sub: 'Lv.28 Celestial Construct', type: 'mob', spriteKey: 'solariSentinel', x: -90, y: 450, origX: -90, origY: 450, hp: 280, maxHp: 280, damage: 16, xpReward: 320, speed: 48, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_2', name: 'Empyrean Star-Knight', sub: 'Lv.28 Celestial Construct', type: 'mob', spriteKey: 'solariSentinel', x: 90, y: 450, origX: 90, origY: 450, hp: 280, maxHp: 280, damage: 16, xpReward: 320, speed: 48, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_3', name: 'Astral Chrono-Seraph', sub: 'Lv.30 Celestial Seraph', type: 'mob', spriteKey: 'aetherWeaver', x: -120, y: 100, origX: -120, origY: 100, hp: 260, maxHp: 260, damage: 18, xpReward: 360, speed: 54, aggroRange: 130, attackRange: 36, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_4', name: 'Astral Chrono-Seraph', sub: 'Lv.30 Celestial Seraph', type: 'mob', spriteKey: 'aetherWeaver', x: 120, y: 100, origX: 120, origY: 100, hp: 260, maxHp: 260, damage: 18, xpReward: 360, speed: 54, aggroRange: 130, attackRange: 36, radius: 16, hitFlash: 0 },
        { id: 'cel_mob_5', name: 'Void Annihilator', sub: 'Lv.32 Apex Infiltrator', type: 'mob', spriteKey: 'mobUmbri', x: 0, y: -250, origX: 0, origY: -250, hp: 420, maxHp: 420, damage: 22, xpReward: 480, speed: 50, aggroRange: 140, attackRange: 32, radius: 18, hitFlash: 0 },
        { id: 'cel_titan_boss', name: 'Aurelius the Empyrean Sovereign', sub: '★ Lv.35 Ancient Titan of the Nexus', type: 'mob', isBoss: true, dropGear: 'crown_of_dawn', spriteKey: 'celestialTitanBoss', x: 0, y: -750, origX: 0, origY: -750, hp: 3200, maxHp: 3200, damage: 32, xpReward: 1600, speed: 46, aggroRange: 180, attackRange: 42, radius: 28, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.STARFALL_CRATER) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 220;
      }
      pushEntityList.push(
        { id: 'sf_mob_1', name: 'Starforged Automaton', sub: 'Lv.22 Astral Construct', type: 'mob', spriteKey: 'starforgedAutomaton', x: -135, y: 55, origX: -135, origY: 55, hp: 190, maxHp: 190, damage: 13, xpReward: 220, speed: 50, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_mob_2', name: 'Starforged Automaton', sub: 'Lv.22 Astral Construct', type: 'mob', spriteKey: 'starforgedAutomaton', x: 135, y: 55, origX: 135, origY: 55, hp: 190, maxHp: 190, damage: 13, xpReward: 220, speed: 50, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_mob_3', name: 'Molten Meteor Elemental', sub: 'Lv.25 Crater Elemental', type: 'mob', spriteKey: 'meteorElemental', x: -155, y: -95, origX: -155, origY: -95, hp: 230, maxHp: 230, damage: 15, xpReward: 265, speed: 54, aggroRange: 125, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_mob_4', name: 'Molten Meteor Elemental', sub: 'Lv.25 Crater Elemental', type: 'mob', spriteKey: 'meteorElemental', x: 155, y: -95, origX: 155, origY: -95, hp: 230, maxHp: 230, damage: 15, xpReward: 265, speed: 54, aggroRange: 125, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'sf_node_1', name: 'Starfall Impact Conduit', sub: 'Astral Glimmer Spire [E]', type: 'node', spriteKey: 'node', x: 0, y: -40, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'sf_boss', name: 'Ignis-Core the Starfall Colossus', sub: '★ Lv.28 Molten Starmetal Boss', type: 'mob', isBoss: true, dropGear: 'starmetal_meteor_hammer', spriteKey: 'starfallBoss', x: 0, y: -260, origX: 0, origY: -260, hp: 980, maxHp: 980, damage: 24, xpReward: 950, speed: 42, aggroRange: 150, attackRange: 38, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.ABYSSAL_RIFT) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 260;
      }
      pushEntityList.push(
        { id: 'aby_mob_1', name: 'Gloam-Silk Widow', sub: 'Lv.34 Rift Arachnid', type: 'mob', spriteKey: 'gloamWidow', x: -150, y: 80, origX: -150, origY: 80, hp: 340, maxHp: 340, damage: 20, xpReward: 390, speed: 58, aggroRange: 128, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'aby_mob_2', name: 'Gloam-Silk Widow', sub: 'Lv.34 Rift Arachnid', type: 'mob', spriteKey: 'gloamWidow', x: 150, y: 80, origX: 150, origY: 80, hp: 340, maxHp: 340, damage: 20, xpReward: 390, speed: 58, aggroRange: 128, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'aby_mob_3', name: 'Paradox Sentinel', sub: 'Lv.37 Singularity Guard', type: 'mob', spriteKey: 'paradoxSentinel', x: -165, y: -90, origX: -165, origY: -90, hp: 430, maxHp: 430, damage: 24, xpReward: 460, speed: 52, aggroRange: 132, attackRange: 32, radius: 17, hitFlash: 0 },
        { id: 'aby_mob_4', name: 'Paradox Sentinel', sub: 'Lv.37 Singularity Guard', type: 'mob', spriteKey: 'paradoxSentinel', x: 165, y: -90, origX: 165, origY: -90, hp: 430, maxHp: 430, damage: 24, xpReward: 460, speed: 52, aggroRange: 132, attackRange: 32, radius: 17, hitFlash: 0 },
        { id: 'aby_mob_5', name: 'Voidborne Harbinger', sub: 'Lv.39 Architect Vanguard', type: 'mob', spriteKey: 'mobUmbri', x: 0, y: -155, origX: 0, origY: -155, hp: 480, maxHp: 480, damage: 26, xpReward: 520, speed: 54, aggroRange: 135, attackRange: 32, radius: 18, hitFlash: 0 },
        { id: 'aby_node_1', name: 'Abyssal Singularity Font', sub: 'Voidstar Glimmer Spire [E]', type: 'node', spriteKey: 'node', x: 0, y: -30, charges: 6, maxCharges: 6, radius: 18, hitFlash: 0 },
        { id: 'aby_boss', name: 'Xal\'Korath the Void Architect', sub: '★ Lv.42 Sovereign of the Rift', type: 'mob', isBoss: true, dropGear: 'abyssal_voidstar_scythe', spriteKey: 'abyssalArchitectBoss', x: 0, y: -340, origX: 0, origY: -340, hp: 3800, maxHp: 3800, damage: 38, xpReward: 2200, speed: 45, aggroRange: 175, attackRange: 42, radius: 28, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.IRONWOOD_TIMBERLANDS) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 180;
      }
      pushEntityList.push(
        { id: 'iw_mob_1', name: 'Treant Sapling', sub: 'Lv.9 Primordial Treant', type: 'mob', spriteKey: 'treantSapling', x: -125, y: 45, origX: -125, origY: 45, hp: 95, maxHp: 95, damage: 8, xpReward: 95, speed: 48, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'iw_mob_2', name: 'Treant Sapling', sub: 'Lv.9 Primordial Treant', type: 'mob', spriteKey: 'treantSapling', x: 125, y: 45, origX: 125, origY: 45, hp: 95, maxHp: 95, damage: 8, xpReward: 95, speed: 48, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'iw_mob_3', name: 'Ironbark Prowler', sub: 'Lv.12 Ancient Forest Beast', type: 'mob', spriteKey: 'ironbarkTreant', x: -140, y: -85, origX: -140, origY: -85, hp: 135, maxHp: 135, damage: 10, xpReward: 145, speed: 52, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'iw_mob_4', name: 'Ironbark Prowler', sub: 'Lv.12 Ancient Forest Beast', type: 'mob', spriteKey: 'ironbarkTreant', x: 140, y: -85, origX: 140, origY: -85, hp: 135, maxHp: 135, damage: 10, xpReward: 145, speed: 52, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'iw_node_1', name: 'Ironwood Primeval Font', sub: 'Ancient Arboreal Font [E]', type: 'node', spriteKey: 'node', x: 0, y: -40, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'iw_boss', name: 'Elder Barkhide the Primeval Treant', sub: '★ Lv.16 Ancient Timberlands Boss', type: 'mob', isBoss: true, dropGear: 'ironwood_quarterstaff', spriteKey: 'elderBarkhide', x: 0, y: -240, origX: 0, origY: -240, hp: 580, maxHp: 580, damage: 16, xpReward: 540, speed: 40, aggroRange: 140, attackRange: 34, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.CORAL_COAST) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 180;
      }
      pushEntityList.push(
        { id: 'cc_mob_1', name: 'Brine Crawler', sub: 'Lv.13 Tidal Scuttler', type: 'mob', spriteKey: 'brineCrawler', x: -130, y: 50, origX: -130, origY: 50, hp: 140, maxHp: 140, damage: 10, xpReward: 145, speed: 50, aggroRange: 118, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'cc_mob_2', name: 'Brine Crawler', sub: 'Lv.13 Tidal Scuttler', type: 'mob', spriteKey: 'brineCrawler', x: 130, y: 50, origX: 130, origY: 50, hp: 140, maxHp: 140, damage: 10, xpReward: 145, speed: 50, aggroRange: 118, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'cc_mob_3', name: 'Coral Siren', sub: 'Lv.16 Reef Enchantress', type: 'mob', spriteKey: 'coralSiren', x: -145, y: -80, origX: -145, origY: -80, hp: 175, maxHp: 175, damage: 12, xpReward: 185, speed: 54, aggroRange: 125, attackRange: 32, radius: 16, hitFlash: 0 },
        { id: 'cc_mob_4', name: 'Coral Siren', sub: 'Lv.16 Reef Enchantress', type: 'mob', spriteKey: 'coralSiren', x: 145, y: -80, origX: 145, origY: -80, hp: 175, maxHp: 175, damage: 12, xpReward: 185, speed: 54, aggroRange: 125, attackRange: 32, radius: 16, hitFlash: 0 },
        { id: 'cc_node_1', name: 'Brinelight Abyssal Font', sub: 'Tidal Glimmer Font [E]', type: 'node', spriteKey: 'node', x: 0, y: -40, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'cc_boss', name: 'Triton the Tide-Reaver', sub: '★ Lv.20 Sovereign of the Reef', type: 'mob', isBoss: true, dropGear: 'tide_reaver_trident', spriteKey: 'tideReaverBoss', x: 0, y: -240, origX: 0, origY: -240, hp: 760, maxHp: 760, damage: 19, xpReward: 700, speed: 46, aggroRange: 150, attackRange: 36, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.STARLIGHT_GROVE) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 180;
      }
      pushEntityList.push(
        { id: 'sg_node_1', name: 'Starlight Heartwood Font', sub: 'Astral Grove Spire [E]', type: 'node', spriteKey: 'node', x: 0, y: -35, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'sg_mob_1', name: 'Starlight Treant', sub: 'Lv.24 Ancient Guardian', type: 'mob', spriteKey: 'terraWarden', x: -130, y: 40, origX: -130, origY: 40, hp: 220, maxHp: 220, damage: 15, xpReward: 210, speed: 48, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'sg_mob_2', name: 'Starlight Treant', sub: 'Lv.24 Ancient Guardian', type: 'mob', spriteKey: 'terraWarden', x: 130, y: 40, origX: 130, origY: 40, hp: 220, maxHp: 220, damage: 15, xpReward: 210, speed: 48, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'sg_boss', name: 'Elder Canopy Colossus', sub: '★ Lv.35 Starlight Grove Sovereign', type: 'mob', isBoss: true, dropGear: 'ironwood_armor', spriteKey: 'terraBoss', x: 0, y: -260, origX: 0, origY: -260, hp: 1150, maxHp: 1150, damage: 24, xpReward: 950, speed: 44, aggroRange: 150, attackRange: 36, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.CHRONOCORE_CITADEL) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 200;
      }
      pushEntityList.push(
        { id: 'ccit_shrine_rites', name: 'Chronocore Rite Shrine', sub: 'Skill Shrine (Req: Rites Lv.15) [E]', type: 'shrine', affinity: 'Aether', buffName: 'Astral Rite Supremacy', reqSkill: 'rites', reqLevel: 15, spriteKey: 'shrine', x: 0, y: 0, charges: 5, maxCharges: 5, radius: 18, hitFlash: 0 },
        { id: 'ccit_anvil', name: 'Chronocore Star-Anvil', sub: 'Relic-Forging Station [E]', type: 'crafting_station', stationId: 'star_anvil', spriteKey: 'anvil', x: -120, y: 120, radius: 16, hitFlash: 0 },
        { id: 'ccit_runeforge', name: 'Chronocore Runeforge', sub: 'Runecrafting & Leyline Station [E]', type: 'crafting_station', stationId: 'leyline_runeforge', spriteKey: 'runeforge', x: 120, y: 120, radius: 16, hitFlash: 0 },
        { id: 'ccit_node_1', name: 'Chronocore Singularity Spire', sub: 'Temporal Core [E]', type: 'node', spriteKey: 'node', x: 0, y: -55, charges: 6, maxCharges: 6, radius: 16, hitFlash: 0 },
        { id: 'ccit_mob_1', name: 'Chronocore Warden', sub: 'Lv.44 Astral Guardian', type: 'mob', spriteKey: 'aetherWeaver', x: -190, y: -120, origX: -190, origY: -120, hp: 460, maxHp: 460, damage: 24, xpReward: 380, speed: 50, aggroRange: 125, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'ccit_mob_2', name: 'Riftweaver Automaton', sub: 'Lv.52 Temporal Construct', type: 'mob', spriteKey: 'aetherWeaver', x: 190, y: -120, origX: 190, origY: -120, hp: 620, maxHp: 620, damage: 28, xpReward: 520, speed: 52, aggroRange: 130, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'ccit_mob_3', name: 'Temporal Singularity Vanguard', sub: 'Lv.58 Paradox Arbiter', type: 'mob', spriteKey: 'paradoxSentinel', x: -180, y: -250, origX: -180, origY: -250, hp: 780, maxHp: 780, damage: 32, xpReward: 690, speed: 54, aggroRange: 135, attackRange: 32, radius: 17, hitFlash: 0 },
        { id: 'ccit_mob_4', name: 'Empyrean Void-Paradox', sub: 'Lv.64 Citadel Apex Harbinger', type: 'mob', spriteKey: 'mobUmbri', x: 180, y: -250, origX: 180, origY: -250, hp: 940, maxHp: 940, damage: 35, xpReward: 860, speed: 56, aggroRange: 140, attackRange: 32, radius: 18, hitFlash: 0 },
        { id: 'ccit_boss', name: 'Grand Chronocore Sovereign', sub: '★ Lv.68 Temporal Apex Boss', type: 'mob', isBoss: true, dropGear: 'chronos_singularity_core', spriteKey: 'aetherBoss', x: 0, y: -360, origX: 0, origY: -360, hp: 2800, maxHp: 2800, damage: 38, xpReward: 2400, speed: 50, aggroRange: 165, attackRange: 40, radius: 25, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.SUNKEN_OASIS) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 180;
      }
      pushEntityList.push(
        { id: 'oasis_node_1', name: 'Whispering Oasis Font', sub: 'Verdant Spring Leyline [E]', type: 'node', spriteKey: 'node', x: 0, y: -25, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'oasis_mob_1', name: 'Oasis Bloomwarden', sub: 'Lv.15 Spring Guardian', type: 'mob', spriteKey: 'terraWarden', x: -115, y: 35, origX: -115, origY: 35, hp: 155, maxHp: 155, damage: 11, xpReward: 165, speed: 50, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'oasis_mob_2', name: 'Oasis Bloomwarden', sub: 'Lv.15 Spring Guardian', type: 'mob', spriteKey: 'terraWarden', x: 115, y: 35, origX: 115, origY: 35, hp: 155, maxHp: 155, damage: 11, xpReward: 165, speed: 50, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'oasis_mob_3', name: 'Mistwater Strider', sub: 'Lv.18 Oasis Sentinel', type: 'mob', spriteKey: 'mobTerra', x: -95, y: -90, origX: -95, origY: -90, hp: 185, maxHp: 185, damage: 13, xpReward: 195, speed: 52, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'oasis_boss', name: 'Sylphira the Spring Matriarch', sub: '★ Lv.24 Sovereign of the Sunken Oasis', type: 'mob', isBoss: true, dropGear: 'primordial_bark_chest', spriteKey: 'elderBarkhide', x: 0, y: -225, origX: 0, origY: -225, hp: 720, maxHp: 720, damage: 18, xpReward: 680, speed: 42, aggroRange: 140, attackRange: 34, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.SOLAR_HIGHLANDS) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 180;
      }
      pushEntityList.push(
        { id: 'highlands_node_1', name: 'Sunspire Zenith Conduit', sub: 'Radiant Crag Spire [E]', type: 'node', spriteKey: 'node', x: 0, y: -25, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'highlands_mob_1', name: 'Sunspire Crag-Watcher', sub: 'Lv.18 Highland Sentinel', type: 'mob', spriteKey: 'solariSentinel', x: -120, y: 40, origX: -120, origY: 40, hp: 180, maxHp: 180, damage: 13, xpReward: 190, speed: 52, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'highlands_mob_2', name: 'Sunspire Crag-Watcher', sub: 'Lv.18 Highland Sentinel', type: 'mob', spriteKey: 'solariSentinel', x: 120, y: 40, origX: 120, origY: 40, hp: 180, maxHp: 180, damage: 13, xpReward: 190, speed: 52, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'highlands_mob_3', name: 'Ambergris Sun-Drake', sub: 'Lv.22 Solar Construct', type: 'mob', spriteKey: 'mobSolari', x: 95, y: -90, origX: 95, origY: -90, hp: 215, maxHp: 215, damage: 15, xpReward: 230, speed: 54, aggroRange: 120, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'highlands_boss', name: 'Helios-Vanguard the Sunspire Titan', sub: '★ Lv.28 Lord of Ambergris Crags', type: 'mob', isBoss: true, dropGear: 'sunfire_greatsword', spriteKey: 'solariBoss', x: 0, y: -230, origX: 0, origY: -230, hp: 890, maxHp: 890, damage: 21, xpReward: 820, speed: 42, aggroRange: 145, attackRange: 36, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.MOONWELL_SANCTUM) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 185;
      }
      pushEntityList.push(
        { id: 'moonwell_node_1', name: 'Silvermist Moonwell Conduit', sub: 'Sacred Druid Leyline [E]', type: 'node', spriteKey: 'node', x: 0, y: -25, charges: 6, maxCharges: 6, radius: 16, hitFlash: 0 },
        { id: 'moonwell_mob_1', name: 'Silvermist Grove-Keeper', sub: 'Lv.22 Moonwell Sentinel', type: 'mob', spriteKey: 'terraWarden', x: -125, y: 35, origX: -125, origY: 35, hp: 210, maxHp: 210, damage: 14, xpReward: 230, speed: 52, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'moonwell_mob_2', name: 'Silvermist Grove-Keeper', sub: 'Lv.22 Moonwell Sentinel', type: 'mob', spriteKey: 'terraWarden', x: 125, y: 35, origX: 125, origY: 35, hp: 210, maxHp: 210, damage: 14, xpReward: 230, speed: 52, aggroRange: 118, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'moonwell_mob_3', name: 'Lunar Briar-Stalker', sub: 'Lv.26 Wilds Guardian', type: 'mob', spriteKey: 'mobTerra', x: -95, y: -95, origX: -95, origY: -95, hp: 245, maxHp: 245, damage: 16, xpReward: 270, speed: 55, aggroRange: 122, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'moonwell_boss', name: 'Archdruid Elaria of the Silvermist', sub: '★ Lv.32 Matriarch of the Moonwell Sanctum', type: 'mob', isBoss: true, dropGear: 'elder_treant_staff', spriteKey: 'elderBarkhide', x: 0, y: -235, origX: 0, origY: -235, hp: 960, maxHp: 960, damage: 22, xpReward: 920, speed: 44, aggroRange: 145, attackRange: 36, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.LUMINOUS_CAVERN) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 185;
      }
      pushEntityList.push(
        { id: 'cavern_node_1', name: 'CrystalEcho Resonance Spire', sub: 'Subterranean Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: -35, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'cavern_mob_1', name: 'CrystalEcho Geode-Stalker', sub: 'Lv.12 Subterranean Construct', type: 'mob', spriteKey: 'mobAether', x: -115, y: 45, origX: -115, origY: 45, hp: 130, maxHp: 130, damage: 9, xpReward: 135, speed: 50, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'cavern_mob_2', name: 'CrystalEcho Geode-Stalker', sub: 'Lv.12 Subterranean Construct', type: 'mob', spriteKey: 'mobAether', x: 115, y: 45, origX: 115, origY: 45, hp: 130, maxHp: 130, damage: 9, xpReward: 135, speed: 50, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'cavern_mob_3', name: 'Prism-Shell Golem', sub: 'Lv.16 Cavern Sentinel', type: 'mob', spriteKey: 'graniteBoss', x: -95, y: -95, origX: -95, origY: -95, hp: 175, maxHp: 175, damage: 12, xpReward: 185, speed: 44, aggroRange: 118, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'cavern_boss', name: 'Crystallis the Echo Warden', sub: '★ Lv.20 Sovereign of CrystalEcho Caverns', type: 'mob', isBoss: true, dropGear: 'mirror_shield', spriteKey: 'bossAether', x: 0, y: -225, origX: 0, origY: -225, hp: 650, maxHp: 650, damage: 17, xpReward: 620, speed: 42, aggroRange: 140, attackRange: 34, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.FROSTSPIRE_GLACIER) {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 185;
      }
      pushEntityList.push(
        { id: 'frost_node_1', name: 'Aurora Resonance Spire', sub: 'Glacial Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: -35, charges: 5, maxCharges: 5, radius: 16, hitFlash: 0 },
        { id: 'frost_mob_1', name: 'Frostfang Tundra-Stalker', sub: 'Lv.24 Glacial Beast', type: 'mob', spriteKey: 'terraWarden', x: -125, y: 45, origX: -125, origY: 45, hp: 240, maxHp: 240, damage: 16, xpReward: 260, speed: 55, aggroRange: 120, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'frost_mob_2', name: 'Frostfang Tundra-Stalker', sub: 'Lv.24 Glacial Beast', type: 'mob', spriteKey: 'terraWarden', x: 125, y: 45, origX: 125, origY: 45, hp: 240, maxHp: 240, damage: 16, xpReward: 260, speed: 55, aggroRange: 120, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'frost_mob_3', name: 'Rimeforged Glacier Sentinel', sub: 'Lv.28 Ice Golem', type: 'mob', spriteKey: 'graniteBoss', x: -95, y: -105, origX: -95, origY: -105, hp: 295, maxHp: 295, damage: 19, xpReward: 320, speed: 44, aggroRange: 125, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'frost_boss', name: 'Borealis, Crown of Eternal Rime', sub: '★ Lv.34 Sovereign of Frostspire Glacier', type: 'mob', isBoss: true, dropGear: 'chronos_singularity_core', spriteKey: 'bossAether', x: 0, y: -235, origX: 0, origY: -235, hp: 1080, maxHp: 1080, damage: 25, xpReward: 1050, speed: 44, aggroRange: 145, attackRange: 36, radius: 24, hitFlash: 0 }
      );
    } else if (curType === ROOM_TYPES.PRIMEVAL_NEXUS_RAID) {
      if (setPlayerPos && !hasCustomSpawn) { player.x = 0; player.y = 320; }
      pushEntityList.push(
        { id: 'raid_sentinel_w', name: 'Nexus Gatebound Guardian', sub: 'Lv.35 Raid Guardian', type: 'mob', spriteKey: 'graniteBoss', x: -180, y: 120, origX: -180, origY: 120, hp: 520, maxHp: 520, damage: 24, xpReward: 480, speed: 46, aggroRange: 130, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'raid_sentinel_e', name: 'Siphonbound Star-Warden', sub: 'Lv.35 Raid Warden', type: 'mob', spriteKey: 'aetherWeaver', x: 180, y: 120, origX: 180, origY: 120, hp: 480, maxHp: 480, damage: 26, xpReward: 480, speed: 50, aggroRange: 130, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'primeval_harbinger', name: 'The Primeval Harbinger', sub: '★ 10P Apex Raid Boss • Phase I', type: 'mob', isBoss: true, isRaidBoss: true, dropGear: 'harbinger_worldbreaker', spriteKey: 'bossAether', x: 0, y: -120, origX: 0, origY: -120, hp: 2800, maxHp: 2800, damage: 34, xpReward: 3200, speed: 44, aggroRange: 180, attackRange: 40, radius: 28, hitFlash: 0 }
      );
    } else if (ROOM_CONFIGS[curType]?.isInterior) {
      if (setPlayerPos && !hasCustomSpawn) {
        const icfg = ROOM_CONFIGS[curType];
        player.x = icfg?.spawnX ?? 0;
        player.y = icfg?.spawnY ?? 96;
      }
    } else {
      if (setPlayerPos && !hasCustomSpawn) {
        player.x = 0;
        player.y = 1740;
      }
      pushEntityList.push(
        // Vanguard Colossus Training Post
        { id: 'val_dummy', name: 'Vanguard Colossus Post', sub: 'Lv.30 Target Post', type: 'dummy', spriteKey: 'dummy', x: 60, y: 1440, origX: 60, origY: 1440, hp: 600, maxHp: 600, xpReward: 200, radius: 16, hitFlash: 0 },
        // 4 Continental Faction Outposts
        { id: 'outpost_Terra', faction: 'Terra', name: 'Terra Forest Outpost Nexus', sub: '300 HP Terra Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusGreen', x: -850, y: -650, origX: -850, origY: -650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Umbri', faction: 'Umbri', name: 'Umbri Shadow Outpost Nexus', sub: '300 HP Umbri Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusPurple', x: 850, y: -650, origX: 850, origY: -650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Solari', faction: 'Solari', name: 'Solari Radiant Outpost Nexus', sub: '300 HP Solari Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusGold', x: -850, y: 650, origX: -850, origY: 650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        { id: 'outpost_Aether', faction: 'Aether', name: 'Aether Astral Outpost Nexus', sub: '300 HP Aether Outpost Nexus [Continental]', type: 'outpost_nexus', spriteKey: 'nexusCyan', x: 850, y: 650, origX: 850, origY: 650, hp: 300, maxHp: 300, xpReward: 1200, radius: 24, hitFlash: 0 },
        // Shattered Nexus Shard
        { id: 'siege_shard', name: 'Shattered Nexus Shard', sub: '⚡ Continental Nexus Core (PvPvE)', type: 'siege_shard', isBoss: true, spriteKey: 'siegeShard', x: 0, y: 0, origX: 0, origY: 0, hp: 850, maxHp: 850, xpReward: 2500, radius: 24, hitFlash: 0 },
        // 4 Ancient Leyline Shrines [E]
        { id: 'shrine_solari', name: 'Solari Radiant Shrine', sub: 'Ancient Leyline [E] • Radiant Wrath', type: 'shrine', affinity: 'solari', buffName: 'Solar Wrath', x: -550, y: 550, origX: -550, origY: 550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_umbri', name: 'Umbri Void Obelisk', sub: 'Ancient Leyline [E] • Void Leech', type: 'shrine', affinity: 'umbri', buffName: 'Void Step', x: 550, y: -550, origX: 550, origY: -550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_terra', name: 'Terra Bastion Monolith', sub: 'Ancient Leyline [E] • Primal Bastion', type: 'shrine', affinity: 'terra', buffName: 'Stone Ward', x: -550, y: -550, origX: -550, origY: -550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        { id: 'shrine_aether', name: 'Aether Chrono Spire', sub: 'Ancient Leyline [E] • Chrono Surge', type: 'shrine', affinity: 'aether', buffName: 'Chrono Surge', x: 550, y: 550, origX: 550, origY: 550, charges: 5, maxCharges: 5, radius: 20, hitFlash: 0 },
        // 4 Grand World Bosses
        { id: 'terra_world_boss', name: 'Elder Ironwood Colossus', sub: '★ Lv.32 Terra Continent World Boss', type: 'mob', isBoss: true, dropGear: 'ironwood_armor', spriteKey: 'graniteBoss', x: -950, y: -850, origX: -950, origY: -850, hp: 1250, maxHp: 1250, damage: 42, xpReward: 2600, speed: 38, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'umbri_world_boss', name: 'Malakor the Soulreaper', sub: '★ Lv.32 Umbri Continent World Boss', type: 'mob', isBoss: true, dropGear: 'scythe_soulreaper', spriteKey: 'umbriBoss', x: 950, y: -850, origX: 950, origY: -850, hp: 1150, maxHp: 1150, damage: 46, xpReward: 2600, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'solari_world_boss', name: 'High Sunfire Juggernaut', sub: '★ Lv.32 Solari Continent World Boss', type: 'mob', isBoss: true, dropGear: 'sunfire_greatsword', spriteKey: 'solariBoss', x: -950, y: 850, origX: -950, origY: 850, hp: 1250, maxHp: 1250, damage: 44, xpReward: 2600, speed: 39, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        { id: 'aether_world_boss', name: 'Continuum Singularity Paradox', sub: '★ Lv.32 Aether Continent World Boss', type: 'mob', isBoss: true, dropGear: 'chronos_singularity_core', spriteKey: 'aetherBoss', x: 950, y: 850, origX: 950, origY: 850, hp: 1180, maxHp: 1180, damage: 48, xpReward: 2600, speed: 42, aggroRange: 135, attackRange: 34, radius: 22, hitFlash: 0 },
        // Strategic Glimmer Nodes across valleys, mountain passes, and wilderness
        { id: 'node_sanctuary', name: 'Sanctuary Vale Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: 1380, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_pass', name: 'Whispering Pass Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: 700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_center_s', name: 'Caldera South Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: 180, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_center_n', name: 'Caldera North Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: -180, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_ruins', name: 'Forgotten Ruins Keystone Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 0, y: -900, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_terra', name: 'Terra Blossom Spire', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: -1100, y: -700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_umbri', name: 'Sepulcher Shadow Spire', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 1100, y: -700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_solari', name: 'Dawnfire Solar Font', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: -1100, y: 700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        { id: 'node_aether', name: 'Aether Resonance Crystal', sub: 'Aether Leyline Crystal [E]', type: 'node', spriteKey: 'node', x: 1100, y: 700, charges: 5, maxCharges: 5, radius: 15, hitFlash: 0 },
        // Whispering Mountain Pass Mobs
        { id: 'pass_mob_1', name: 'Granite Ridge Sentinel', sub: 'Lv.28 Mountain Golem', type: 'mob', spriteKey: 'graniteBoss', x: -60, y: 880, origX: -60, origY: 880, hp: 420, maxHp: 420, damage: 24, xpReward: 750, speed: 40, aggroRange: 110, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'pass_mob_2', name: 'Whispering Pass Raider', sub: 'Lv.29 Highland Marauder', type: 'mob', spriteKey: 'voidStalker', x: 70, y: 640, origX: 70, origY: 640, hp: 380, maxHp: 380, damage: 26, xpReward: 800, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'pass_mob_3', name: 'High Crag Behemoth', sub: 'Lv.30 Ridge Colossus', type: 'mob', spriteKey: 'graniteBoss', x: -80, y: 460, origX: -80, origY: 460, hp: 540, maxHp: 540, damage: 32, xpReward: 1000, speed: 38, aggroRange: 120, attackRange: 32, radius: 20, hitFlash: 0 },
        // North Forgotten Ruins Plateau (Ancient Megaliths)
        { id: 'ruin_guard_1', name: 'Ancient Keystone Golem', sub: 'Lv.30 Forgotten Golem', type: 'mob', spriteKey: 'graniteBoss', x: -90, y: -750, origX: -90, origY: -750, hp: 520, maxHp: 520, damage: 32, xpReward: 1050, speed: 40, aggroRange: 115, attackRange: 30, radius: 18, hitFlash: 0 },
        { id: 'ruin_guard_2', name: 'Lost Shard Sentinel', sub: 'Lv.30 Keystone Sentinel', type: 'mob', spriteKey: 'mobSolari', x: 90, y: -750, origX: 90, origY: -750, hp: 500, maxHp: 500, damage: 32, xpReward: 1000, speed: 52, aggroRange: 115, attackRange: 30, radius: 16, hitFlash: 0 },
        { id: 'ruin_boss_field', name: 'The Prismatic Overlord', sub: '★ Lv.34 Megalith World Boss', type: 'mob', isBoss: true, dropGear: 'prismatic_keystone', spriteKey: 'graniteBoss', x: 0, y: -1150, origX: 0, origY: -1150, hp: 1300, maxHp: 1300, damage: 46, xpReward: 2750, speed: 38, aggroRange: 135, attackRange: 34, radius: 24, hitFlash: 0 },
        // Roaming Mob Packs across the 4 Continents & Central Caldera (10x Stats)
        { id: 'ter_mob_1', name: 'Bramble Treant', sub: 'Lv.29 Terra Guardian', type: 'mob', spriteKey: 'terraWarden', x: -680, y: -520, origX: -680, origY: -520, hp: 440, maxHp: 440, damage: 28, xpReward: 850, speed: 52, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'ter_mob_2', name: 'Ironwood Stonekin', sub: 'Lv.30 Forest Sentinel', type: 'mob', spriteKey: 'terraWarden', x: -1020, y: -480, origX: -1020, origY: -480, hp: 480, maxHp: 480, damage: 30, xpReward: 950, speed: 50, aggroRange: 115, attackRange: 28, radius: 16, hitFlash: 0 },
        { id: 'umb_mob_1', name: 'Void Stalker Vanguard', sub: 'Lv.29 Umbri Assassin', type: 'mob', spriteKey: 'voidStalker', x: 680, y: -520, origX: 680, origY: -520, hp: 420, maxHp: 420, damage: 30, xpReward: 850, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'umb_mob_2', name: 'Graveglass Phantom', sub: 'Lv.30 Gloom Specter', type: 'mob', spriteKey: 'duskFiend', x: 1020, y: -480, origX: 1020, origY: -480, hp: 460, maxHp: 460, damage: 32, xpReward: 950, speed: 56, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_mob_1', name: 'Sunforged Sentinel', sub: 'Lv.29 Solari Construct', type: 'mob', spriteKey: 'solariSentinel', x: -680, y: 520, origX: -680, origY: 520, hp: 450, maxHp: 450, damage: 28, xpReward: 850, speed: 52, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'sol_mob_2', name: 'Dawnblade Crusader', sub: 'Lv.30 Radiant Paladin', type: 'mob', spriteKey: 'solariSentinel', x: -1020, y: 480, origX: -1020, origY: 480, hp: 480, maxHp: 480, damage: 30, xpReward: 950, speed: 54, aggroRange: 115, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'aeth_mob_1', name: 'Chrono Echo', sub: 'Lv.29 Astral Sentinel', type: 'mob', spriteKey: 'aetherWeaver', x: 680, y: 520, origX: 680, origY: 520, hp: 420, maxHp: 420, damage: 30, xpReward: 850, speed: 54, aggroRange: 115, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'aeth_mob_2', name: 'Continuum Weaver', sub: 'Lv.30 Singularity Mage', type: 'mob', spriteKey: 'aetherWeaver', x: 1020, y: 480, origX: 1020, origY: 480, hp: 460, maxHp: 460, damage: 32, xpReward: 950, speed: 55, aggroRange: 115, attackRange: 30, radius: 15, hitFlash: 0 },
        { id: 'void_mid_1', name: 'Void Stalker Raider', sub: 'Lv.28 Warzone Invader', type: 'mob', spriteKey: 'voidStalker', x: -140, y: -60, origX: -140, origY: -60, hp: 360, maxHp: 360, damage: 24, xpReward: 700, speed: 52, aggroRange: 112, attackRange: 28, radius: 15, hitFlash: 0 },
        { id: 'void_mid_2', name: 'Duskblade Marauder', sub: 'Lv.28 Warzone Invader', type: 'mob', spriteKey: 'duskFiend', x: 140, y: -60, origX: 140, origY: -60, hp: 340, maxHp: 340, damage: 26, xpReward: 700, speed: 56, aggroRange: 112, attackRange: 26, radius: 14, hitFlash: 0 }
      );
    }

    if (curType !== ROOM_TYPES.ARENA_3V3 && !ROOM_CONFIGS[curType]?.isInterior) {
      const positions = GRAND_FONT_POSITIONS[curType]?.length
        ? GRAND_FONT_POSITIONS[curType]
        : [{ x: 0, y: 130 }];
      positions.forEach((gp, index) => {
        pushEntityList.push({
          id: `grand_font_${curType}_${index + 1}`,
          name: 'Grand Glimmer Font',
          sub: 'GRAND LEYLINE FONT • 25 SHARED CHARGES [E]',
          type: 'node',
          spriteKey: 'grandNode',
          isGrand: true,
          x: gp.x,
          y: gp.y,
          charges: 25,
          maxCharges: 25,
          radius: 90,
          hitFlash: 0,
        });
      });
    }

    populateWorldSkillingNodes(curType, pushEntityList);
    applyEliteChampionsToZone(curType, pushEntityList);
    const activeEv = getActiveWorldEvent(Date.now());
    if (curType === ROOM_TYPES.SANCTUARY_HUB || activeEv?.rooms?.includes(curType)) {
      const straySpec = pickWildStrayEchoForZone(curType);
      const sx = curType === ROOM_TYPES.SANCTUARY_HUB ? 165 : -90;
      const sy = curType === ROOM_TYPES.SANCTUARY_HUB ? 155 : 80;
      pushEntityList.push({
        id: `wild_echo_${curType}`,
        strayId: straySpec.id,
        name: straySpec.name,
        sub: `✨ Wild Stray Echo • Soothe [E] (${GLIMMER_CIPHERS_CATALOG[straySpec.requiredCipherId]?.name || 'Cipher'})`,
        type: 'wild_echo',
        zoneType: curType,
        familiarId: straySpec.familiarId,
        spriteKey: straySpec.spriteKey,
        faction: straySpec.faction,
        requiredCipherId: straySpec.requiredCipherId,
        rewardPrintId: straySpec.rewardPrintId,
        titleUnlock: straySpec.titleUnlock,
        variantPool: straySpec.variantPool,
        variantChance: straySpec.variantChance,
        x: sx,
        y: sy,
        origX: sx,
        origY: sy,
        hp: 100,
        maxHp: 100,
        charges: 1,
        maxCharges: 1,
        radius: 22,
        hitFlash: 0,
      });
    }
    for (const e of pushEntityList) {
      e.zoneType = curType;
      zoneEntities.push(e);
    }
  }

  function convertTreePropsToNodes(propsList, targetEntities) {
    for (let i = propsList.length - 1; i >= 0; i--) {
      const pr = propsList[i];
      let skKey = null;
      if (pr.type === 'blossomTree') skKey = 'tree_blossom';
      else if (pr.type === 'pineTree') skKey = 'tree_pine';
      else if (pr.type === 'ancientOak') skKey = 'tree_ancient_oak';

      if (skKey && SKILLING_NODE_TYPES[skKey]) {
        const existing = targetEntities.find((e) => e.type === 'node' && Math.hypot(e.x - pr.x, e.y - pr.y) <= 24);
        if (!existing) {
          const spec = SKILLING_NODE_TYPES[skKey];
          const zTag = pr.zoneType || getCurrentRoomType();
          targetEntities.push({
            id: `sknode_${zTag}_prop_tree_${i + 1}`,
            zoneType: zTag,
            name: spec.name,
            sub: `${spec.sub || 'Sacred Timber Node [E]'} • Req Lv.${spec.reqLevel}`,
            type: 'node',
            skillingType: skKey,
            spriteKey: spec.spriteReady,
            x: pr.x,
            y: pr.y,
            charges: spec.charges || 3,
            maxCharges: spec.charges || 3,
            radius: 16,
            hitFlash: 0,
          });
        }
        propsList.splice(i, 1);
      }
    }
  }

  function buildOfflineZone(zone, spawnX = null, spawnY = null) {
    setupZoneDecor(zone);
    const currentRoomType = getCurrentRoomType();
    const props = getProps();
    const player = getPlayer();
    const camera = getCamera();
    const isSurface = isSurfaceRoomType(currentRoomType);
    const hasCustomSpawn = spawnX !== null && spawnY !== null && Number.isFinite(Number(spawnX)) && Number.isFinite(Number(spawnY));

    if (isSurface && lastBuiltSurfaceMode && lastOfflineEntities.length > 0) {
      if (hasCustomSpawn) {
        const zCfg = ROOM_CONFIGS[currentRoomType];
        const rx = Number(spawnX);
        const ry = Number(spawnY);
        const isLocalSized = zCfg && currentRoomType !== ROOM_TYPES.SANCTUARY_HUB && Math.abs(rx) <= zCfg.halfW && Math.abs(ry) <= zCfg.halfH;
        const wp = isLocalSized ? localToWorld(currentRoomType, rx, ry) : { wx: rx, wy: ry };
        player.x = wp.wx;
        player.y = wp.wy;
      } else {
        const defCfg = ROOM_CONFIGS[currentRoomType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
        const wp = localToWorld(currentRoomType, defCfg.spawnX ?? 0, defCfg.spawnY ?? 96);
        player.x = wp.wx;
        player.y = wp.wy;
      }
      camera.x = player.x;
      camera.y = player.y;
      const activeNet = typeof getNet === 'function' ? getNet() : net;
      if (activeNet) {
        activeNet.preferredRoom = currentRoomType;
        activeNet.currentCoords = { x: player.x, y: player.y };
      }
      return;
    }

    const entities = [];
    const allies = [];
    const projectiles = [];
    const groundZones = [];
    const lootDrops = [];
    applyOfflineZoneState({
      entities,
      allies,
      projectiles,
      groundZones,
      lootDrops,
      offlineMythic: null,
    });

    if (isSurface) {
      for (const sRoom of SURFACE_ROOM_TYPES) {
        const place = SURFACE_ZONE_PLACEMENT[sRoom];
        if (!place) continue;
        const zEnts = [];
        populateSingleOfflineZone(sRoom, zEnts, props, player, hasCustomSpawn, sRoom === currentRoomType);
        for (const e of zEnts) {
          e.zoneType = sRoom;
          if (Number.isFinite(e.x)) e.x += place.originX;
          if (Number.isFinite(e.y)) e.y += place.originY;
          if (Number.isFinite(e.origX)) e.origX += place.originX;
          if (Number.isFinite(e.origY)) e.origY += place.originY;
          entities.push(e);
        }
      }
      if (hasCustomSpawn) {
        const zCfg = ROOM_CONFIGS[currentRoomType];
        const rx = Number(spawnX);
        const ry = Number(spawnY);
        const isLocalSized = zCfg && currentRoomType !== ROOM_TYPES.SANCTUARY_HUB && Math.abs(rx) <= zCfg.halfW && Math.abs(ry) <= zCfg.halfH;
        const wp = isLocalSized ? localToWorld(currentRoomType, rx, ry) : { wx: rx, wy: ry };
        player.x = wp.wx;
        player.y = wp.wy;
      } else {
        const defCfg = ROOM_CONFIGS[currentRoomType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
        const wp = localToWorld(currentRoomType, defCfg.spawnX ?? 0, defCfg.spawnY ?? 96);
        player.x = wp.wx;
        player.y = wp.wy;
      }
      convertTreePropsToNodes(props, entities);
      lastBuiltSurfaceMode = true;
      lastOfflineEntities = entities;
    } else {
      lastBuiltSurfaceMode = false;
      lastOfflineEntities = [];
      populateSingleOfflineZone(currentRoomType, entities, props, player, hasCustomSpawn, true);
      if (hasCustomSpawn) {
        player.x = Number(spawnX);
        player.y = Number(spawnY);
      }
      convertTreePropsToNodes(props, entities);
    }

    camera.x = player.x;
    camera.y = player.y;
    const activeNet = typeof getNet === 'function' ? getNet() : net;
    if (activeNet) {
      activeNet.preferredRoom = currentRoomType;
      activeNet.currentCoords = { x: player.x, y: player.y };
    }
    if (isSinglePlayer() && hasEnteredWorld()) saveProgressionLocal();
  }

  function populateWorldSkillingNodes(roomType, targetList) {
    const entries = SKILLING_LAYOUTS[roomType] || [];
    entries.forEach(([skKey, x, y], idx) => {
      const spec = SKILLING_NODE_TYPES[skKey];
      if (!spec) return;
      targetList.push({
        id: `sknode_${roomType}_${idx + 1}`,
        name: spec.name,
        sub: `${spec.sub || 'Cosmic Skilling Vein [E]'} • Req Lv.${spec.reqLevel}`,
        type: 'node',
        skillingType: skKey,
        spriteKey: spec.spriteReady,
        x,
        y,
        charges: spec.charges || 3,
        maxCharges: spec.charges || 3,
        radius: 16,
        hitFlash: 0,
      });
    });
  }

  function applyEliteChampionsToZone(roomType, targetList) {
    if (roomType === ROOM_TYPES.SANCTUARY_HUB || roomType === ROOM_TYPES.ARENA_3V3 || ROOM_CONFIGS[roomType]?.isInterior) return;
    const affixKeys = Object.keys(ELITE_AFFIXES);
    if (!affixKeys.length) return;
    const candidates = targetList.filter((e) => e.type === 'mob' && !e.isBoss);
    if (!candidates.length) return;
    // Promote 1 deterministic / semi-random champion per dungeon/zone (2 in Warzone/Abyssal/Starfall)
    const maxElites = (roomType === ROOM_TYPES.NEXUS_WARZONE || roomType === ROOM_TYPES.ABYSSAL_RIFT || roomType === ROOM_TYPES.STARFALL_CRATER || roomType === ROOM_TYPES.IRONWOOD_TIMBERLANDS || roomType === ROOM_TYPES.CORAL_COAST) ? 2 : 1;
    for (let i = 0; i < Math.min(maxElites, candidates.length); i++) {
      const mob = candidates[candidates.length - 1 - i];
      if (!mob || mob.eliteAffix) continue;
      const afKey = affixKeys[(i + roomType.length) % affixKeys.length];
      const af = ELITE_AFFIXES[afKey];
      if (!af) continue;
      mob.eliteAffix = afKey;
      mob.name = `${af.label || af.prefix || 'Elite'} ${mob.name}`;
      mob.sub = `★ ELITE CHAMPION • ${mob.sub}`;
      mob.maxHp = Math.round(mob.maxHp * af.hpMult);
      mob.hp = mob.maxHp;
      mob.damage = Math.max(2, Math.round((mob.damage || 4) * af.dmgMult));
      mob.xpReward = Math.round((mob.xpReward || 65) * af.xpMult);
    }
  }


  return {
    buildOfflineZone,
    populateWorldSkillingNodes,
    applyEliteChampionsToZone,
  };
}
