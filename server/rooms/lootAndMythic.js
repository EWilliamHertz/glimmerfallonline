// ==========================================
// RoomManager — Boss Loot Tables, Ground Drops & Mythic+ Keystones
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

export const lootAndMythicMethods = {
  getFactionBossSetDrop(room, ent) {
    if (ent?.dropGear && EQUIPMENT_CATALOG[ent.dropGear]) {
      return ent.dropGear;
    }
    const rType = String(room?.type || '').toLowerCase();
    const spKey = ent?.spriteKey || '';
    if (spKey === 'starfallBoss' || rType.includes('starfall')) {
      return 'starmetal_meteor_hammer';
    }
    if (spKey === 'abyssalArchitectBoss' || rType.includes('abyssal')) {
      return 'abyssal_voidstar_scythe';
    }
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
  },

  getBossAccessoryDrop(room, ent) {
    const accs = [
      'amulet_of_fury', 'amulet_of_glory', 'fire_cape', 'barrows_gloves',
      'crown_of_noon', 'chronocore_prism', 'radiant_shield_relic',
      'celestial_talisman', 'granite_boots', 'ring_of_the_sun',
      'ring_of_void_leech', 'ring_of_stone',
    ];
    return accs[Math.floor(Math.random() * accs.length)];
  },

  getBeginnerMobDrop(room) {
    const beginnerPool = [
      'iron_broadsword', 'novice_oak_staff', 'scout_leather_tunic',
      'scout_leather_leggings', 'iron_heater_shield', 'apprentice_focus_orb',
      'linen_traveller_cloak', 'copper_ring', 'radiant_cape',
      'vanguard_gauntlets', 'boots_of_haste',
    ];
    return beginnerPool[Math.floor(Math.random() * beginnerPool.length)];
  },

  getZoneCosmicMaterialDrop(room) {
    const rType = String(room?.type || '').toLowerCase();
    let pool = ['sun_copper_ore', 'star_tin_mineral', 'sunbloom_herb', 'starlight_flax', 'astral_mineral_dust'];
    if (rType.includes('abyssal') || rType.includes('celestial')) {
      pool = ['celestial_runite_ore', 'empyrean_starleaf', 'celestial_gossamer', 'adamant_terra_ore', 'chrono_lotus'];
    } else if (rType.includes('starfall') || rType.includes('ruins') || rType.includes('vault') || rType.includes('labyrinth') || rType.includes('grove') || rType.includes('archive')) {
      pool = ['mithril_astral_ore', 'adamant_terra_ore', 'chrono_lotus', 'shadow_silk', 'umbral_coal', 'astral_mineral_dust'];
    } else if (rType.includes('solari')) {
      pool = ['iron_ore', 'sun_copper_ore', 'umbral_coal', 'sunbloom_herb', 'astral_mineral_dust'];
    } else if (rType.includes('umbri')) {
      pool = ['iron_ore', 'umbral_coal', 'gloomcap_spore', 'shadow_silk', 'astral_mineral_dust'];
    } else if (rType.includes('terra')) {
      pool = ['iron_ore', 'adamant_terra_ore', 'sunbloom_herb', 'gloomcap_spore', 'starlight_flax'];
    } else if (rType.includes('aether')) {
      pool = ['mithril_astral_ore', 'chrono_lotus', 'astral_mineral_dust', 'shadow_silk'];
    } else if (rType.includes('warzone')) {
      pool = ['sun_copper_ore', 'star_tin_mineral', 'iron_ore', 'umbral_coal', 'sunbloom_herb', 'starlight_flax'];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  },

  spawnLootDrops(room, ent) {
    if (!room.loot) room.loot = [];
    const drops = [];

    // Vital / Glimmer recovery orbs (cleaner battlefield with reduced clutter)
    const count = ent.isBoss ? 2 : ent.eliteAffix ? 1 : Math.random() < 0.20 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      let kind = Math.random() < 0.5 ? 'vital' : 'glimmer';
      if (ent.isBoss && i === 0) kind = 'relic';
      drops.push({ kind, itemId: null, qty: 1 });
    }

    // 1. Stackable Currency: Solar Gold Sovereigns (all mobs drop gold; Elite Champions grant bonus bounty!)
    const eliteBonusGold = ent.eliteAffix ? 25 + Math.floor(Math.random() * 32) : 0;
    const goldQty = (ent.isBoss ? (150 + Math.floor(Math.random() * 200)) : (8 + Math.floor(Math.random() * 25))) + eliteBonusGold;
    drops.push({ kind: 'item', itemId: 'solar_gold', qty: goldQty });

    // 2. Faction elemental currency (40% mob chance or 100% boss/elite)
    if (ent.isBoss || ent.eliteAffix || Math.random() < 0.40) {
      const rType = String(room?.type || '').toLowerCase();
      let factionCurr = 'glimmer_shard';
      let factionCurrQty = ent.isBoss ? 15 + Math.floor(Math.random() * 20) : ent.eliteAffix ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
      if (rType.includes('aether') || rType.includes('starfall')) factionCurr = 'chrono_gem';
      else if (rType.includes('terra')) factionCurr = 'verdant_amber';
      else if (rType.includes('umbri') || rType.includes('abyssal')) factionCurr = 'void_essence';
      drops.push({ kind: 'item', itemId: factionCurr, qty: factionCurrQty });
    }

    // 2b. Cosmic Artisan Crafting Materials (30% on mobs, 100% on Elites & Bosses)
    if (ent.isBoss || ent.eliteAffix || Math.random() < 0.30) {
      const matId = this.getZoneCosmicMaterialDrop(room);
      const matQty = ent.isBoss ? 2 + Math.floor(Math.random() * 2) : ent.eliteAffix ? 2 : 1;
      if (matId && EQUIPMENT_CATALOG[matId]) {
        drops.push({ kind: 'item', itemId: matId, qty: matQty });
      }
    }

    // 2c. Elite Champion Bonus: 15% chance at a cut Leyline Socket Gem!
    if (ent.eliteAffix && Math.random() < 0.15) {
      const gemPool = ['gem_solar_ruby', 'gem_void_sapphire', 'gem_terra_emerald', 'gem_aether_diamond'];
      drops.push({ kind: 'item', itemId: gemPool[Math.floor(Math.random() * gemPool.length)], qty: 1 });
    }

    // 3. Consumables (healing salves / glimmer draughts - 12% on mobs, 100% on boss)
    if (ent.isBoss || Math.random() < 0.12) {
      const potId = Math.random() < 0.5 ? 'minor_healing_salve' : 'glimmer_draught';
      drops.push({ kind: 'item', itemId: potId, qty: ent.isBoss ? 2 : 1 });
    }

    // 4. Equipment Drops:
    // Set pieces drop ONLY on faction bosses (15%), non-bosses get beginner gear (6%)
    if (ent.isBoss) {
      // Day 2: every Continental boss guarantees a Legendary cache — one faction set piece + one relic.
      const setPieceId = this.getFactionBossSetDrop(room, ent);
      const accessoryId = this.getBossAccessoryDrop(room, ent);
      if (setPieceId) drops.push({ kind: 'item', itemId: setPieceId, qty: 1 });
      if (accessoryId) drops.push({ kind: 'item', itemId: accessoryId, qty: 1 });
      const keystoneId = this.getKeystoneDrop(room, ent);
      if (keystoneId) drops.push({ kind: 'item', itemId: keystoneId, qty: 1 });
    } else {
      if (Math.random() < 0.06) {
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
  },

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
  },

  // ==========================================
  // Day 3 — Mythic Leyline Keystone Runs
  // ==========================================
  getMythicDungeonForRoom(room) {
    if (!room) return null;
    return Object.values(MYTHIC_DUNGEONS).find((d) => d.roomType === room.type) || null;
  },

  getKeystoneDrop(room, ent) {
    if (!ent?.isBoss) return null;
    const cryptDungeon = this.getMythicDungeonForRoom(room);
    let dungeon = cryptDungeon;
    let tier;
    if (cryptDungeon) {
      // Crypt bosses drop entrance-tier keys so the loop can always restart.
      tier = 1 + Math.floor(Math.random() * 3);
    } else {
      const pool = Object.values(MYTHIC_DUNGEONS);
      dungeon = pool[Math.floor(Math.random() * pool.length)];
      const apex = String(room?.type || '').includes('celestial') || String(ent?.name || '').includes('Aurelius');
      tier = apex ? 6 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 4);
      if (apex && Math.random() < 0.25) tier = MYTHIC_KEYSTONE_MAX_TIER;
    }
    tier = Math.max(1, Math.min(MYTHIC_KEYSTONE_MAX_TIER, tier));
    return `keystone_${dungeon.id}_${tier}`;
  },

  handleUseKeystone(room, player, itemId) {
    if (!room || !player) return;
    const item = EQUIPMENT_CATALOG[itemId];
    const spec = item?.keystone;
    if (!spec) return;
    const dungeon = MYTHIC_DUNGEONS[spec.dungeonId];
    if (!dungeon) return;

    if (dungeon.roomType !== room.type) {
      player.send({
        type: 'sys_msg',
        category: 'quest',
        text: `🗝️ [MYTHIC] ${item.name} must be activated inside ${dungeon.name}.`,
      });
      return;
    }
    if (room.mythic?.active) {
      player.send({
        type: 'sys_msg',
        category: 'quest',
        text: '🗝️ [MYTHIC] A Mythic run is already active in this crypt. Finish it before activating another keystone.',
      });
      return;
    }

    const inv = player.inventory || [];
    const idx = inv.findIndex((it) => (typeof it === 'string' ? it : it?.id) === itemId);
    if (idx < 0) return;
    if (!this.accounts.removeItemFromInventory(player.id, idx, 1)) return;
    this.refreshClientFromAccount(player.id);

    const tier = spec.tier;
    const scale = getMythicEnemyScale(tier);
    for (const e of room.entities) {
      if (e.type !== 'mob' || e.isDying || e.mythicScaled) continue;
      e.maxHp = Math.max(1, Math.round(e.maxHp * scale));
      e.hp = e.maxHp;
      e.damage = Math.max(1, Math.ceil((e.damage || 3) * scale));
      e.xpReward = Math.round((e.xpReward || 30) * getMythicXpScale(tier));
      e.mythicScaled = true;
    }

    const affixes = getMythicAffixesForTier(tier);
    const duration = getMythicRunDuration(tier);
    room.mythic = {
      active: true,
      dungeonId: dungeon.id,
      tier,
      affixes,
      duration,
      timeLeft: duration,
      startedBy: player.displayName,
      volcanicTimer: 3,
      syncTimer: 0,
      completed: false,
      failed: false,
    };

    room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 16, text: `🗝️ TIER ${tier} MYTHIC RUN BEGINS!`, color: dungeon.color, isCrit: true });
    room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y, colors: [dungeon.color, '#fde047', '#ffffff'], count: 30 });
    this.broadcastMythicState(room);
    this.broadcastToRoom(room, {
      type: 'sys_msg',
      category: 'quest',
      text: `🗝️ [MYTHIC] ${player.displayName} activated a Tier ${tier} ${dungeon.name} Keystone! Affixes: ${affixes.map((a) => `${MYTHIC_AFFIXES[a].icon} ${MYTHIC_AFFIXES[a].name}`).join(', ')}. Clear the boss before the leyline timer expires!`,
    });
  },

  broadcastMythicState(room) {
    if (!room) return;
    const m = room.mythic;
    this.broadcastToRoom(room, {
      type: 'mythic_state',
      mythic: m ? {
        active: Boolean(m.active),
        dungeonId: m.dungeonId,
        tier: m.tier,
        affixes: m.affixes,
        duration: m.duration,
        timeLeft: Math.max(0, Math.round(m.timeLeft * 10) / 10),
        completed: Boolean(m.completed),
        failed: Boolean(m.failed),
      } : null,
    });
  },

  tickMythic(room, dt) {
    const m = room.mythic;
    if (!m?.active) return;
    m.timeLeft -= dt;

    if (m.timeLeft <= 0) {
      m.active = false;
      m.failed = true;
      m.timeLeft = 0;
      this.broadcastMythicState(room);
      this.broadcastToRoom(room, {
        type: 'sys_msg',
        category: 'quest',
        text: `⌛ [MYTHIC] The Tier ${m.tier} ${MYTHIC_DUNGEONS[m.dungeonId]?.name || 'crypt'} run has expired. The leyline cache faded into the void.`,
      });
      return;
    }

    if (m.affixes.includes('volcanic')) {
      m.volcanicTimer = (m.volcanicTimer ?? 3) - dt;
      if (m.volcanicTimer <= 0) {
        m.volcanicTimer = Math.max(2.4, 4.4 - m.tier * 0.15);
        const alive = [...room.players.values()].filter((p) => !p.isDead);
        if (alive.length) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          room.groundZones.push({
            id: `gz_${crypto.randomUUID().slice(0, 6)}`,
            type: 'telegraph',
            color: '#f97316',
            x: target.x,
            y: target.y,
            radius: 52,
            age: 0,
            maxAge: 1.15,
            damage: 8 + m.tier * 3,
            bossName: 'Volcanic Affix',
            label: 'ERUPTION',
            bossRef: null,
          });
        }
      }
    }

    if (m.affixes.includes('sanguine')) {
      for (const gz of room.groundZones) {
        if (gz.type !== 'sanguine_pool') continue;
        gz.tickTimer = (gz.tickTimer ?? 0) - dt;
        if (gz.tickTimer > 0) continue;
        gz.tickTimer = 1.2;
        for (const mob of room.entities) {
          if (mob.type !== 'mob' || mob.isDying) continue;
          if (Math.hypot(mob.x - gz.x, mob.y - gz.y) > gz.radius) continue;
          mob.hp = Math.min(mob.maxHp, mob.hp + mob.maxHp * 0.03);
        }
      }
    }

    m.syncTimer = (m.syncTimer || 0) + dt;
    if (m.syncTimer >= 2) {
      m.syncTimer = 0;
      this.broadcastMythicState(room);
    }
  },

  completeMythicRun(room, ent) {
    const m = room.mythic;
    if (!m?.active) return;
    const dungeon = MYTHIC_DUNGEONS[m.dungeonId];
    if (!dungeon || dungeon.roomType !== room.type) return;

    const tier = m.tier;
    const secondsLeft = Math.max(0, Math.ceil(m.timeLeft));
    m.active = false;
    m.completed = true;

    const currency =
      dungeon.faction === 'Solari' ? 'glimmer_shard' :
      dungeon.faction === 'Umbri' ? 'void_essence' :
      dungeon.faction === 'Terra' ? 'verdant_amber' : 'chrono_gem';

    const cache = [
      { itemId: 'solar_gold', qty: 400 + tier * 150 },
      { itemId: currency, qty: 30 + tier * 8 },
      { itemId: 'major_vitality_elixir', qty: 2 + Math.floor(tier / 2) },
      { itemId: this.getFactionBossSetDrop(room, ent), qty: 1 },
    ];
    if (tier < MYTHIC_KEYSTONE_MAX_TIER) {
      cache.push({ itemId: `keystone_${dungeon.id}_${tier + 1}`, qty: 1 });
    } else {
      cache.push({ itemId: this.getBossAccessoryDrop(room, ent), qty: 1 });
    }

    cache.forEach((d, i) => {
      if (!d.itemId) return;
      const ang = (Math.PI * 2 * i) / cache.length - Math.PI / 2;
      const dist = 34 + (i % 3) * 9;
      room.lootSeq = (room.lootSeq || 0) + 1;
      room.loot.push({
        id: `loot_${room.lootSeq}`,
        kind: 'item',
        itemId: d.itemId,
        qty: d.qty || 1,
        x: Math.round((ent.x + Math.cos(ang) * dist) * 10) / 10,
        y: Math.round((ent.y + Math.sin(ang) * dist * 0.65) * 10) / 10,
        ttl: 120,
        maxTtl: 120,
      });
    });

    for (const p of room.players.values()) {
      if (p.isDead) continue;
      this.awardPlayerXP(p, 120 + tier * 45, `Tier ${tier} Mythic Cache`);
    }

    this.broadcastMythicState(room);
    this.broadcastToRoom(room, {
      type: 'sys_msg',
      category: 'quest',
      text: `🏆 [MYTHIC COMPLETE] Tier ${tier} ${dungeon.name} cleared with ${secondsLeft}s remaining! A Mythic cache crystallized — ${tier < MYTHIC_KEYSTONE_MAX_TIER ? `a Tier ${tier + 1} keystone is inside.` : 'an apex relic is inside.'}`,
    });
    for (const c of this.clients.values()) {
      c.send({
        type: 'sys_msg',
        category: 'quest',
        text: `🗝️ [MYTHIC] ${dungeon.name} Tier ${tier} was conquered by ${m.startedBy}!`,
      });
    }
  },
};
