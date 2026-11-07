// ==========================================
// RoomManager — Gathering Nodes, Cosmic Artisan Crafting, Bounties & Professions
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

export const gatheringAndCraftingMethods = {
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
      this.awardProfessionXP(player, 'resonance_extraction', 45, `${shrine.name} Channeling`);

      player.questState = player.questState || {};
      player.questState.extractionNodesHarvested = (player.questState.extractionNodesHarvested || 0) + 1;
      if (room.type === ROOM_TYPES.AETHER_SPIRE || shrine.id === 'aeth_node_1') {
        player.questState.aetherFontChanneled = true;
      }
      this.accounts.saveQuestState(player.id, player.questState);
      return;
    }

    // 2. Otherwise harvest World Skilling Vein / Herb / Fiber or Glimmer Node
    let node = nodeId ? room.entities.find((e) => e.id === nodeId && e.type === 'node') : null;
    if (!node) {
      node = room.entities.find((e) => e.type === 'node' && Math.hypot(e.x - player.x, e.y - player.y) <= 7.2 * YARD_PX);
    }
    if (!node || Math.hypot(node.x - player.x, node.y - player.y) > 7.5 * YARD_PX) return;
    if (node.charges <= 0) return;

    const now = Date.now();
    if (now < (player.harvestReadyAt || 0)) return;
    const isGrand = Boolean(node.isGrand);
    player.harvestReadyAt = now + (node.skillingType ? 450 : (isGrand ? HARVEST_COOLDOWN_MS.grand : HARVEST_COOLDOWN_MS.normal));

    // 2A. Authoritative World Skilling Vein / Herb Cluster / Silk Bloom
    if (node.skillingType && SKILLING_NODE_TYPES[node.skillingType]) {
      const skSpec = SKILLING_NODE_TYPES[node.skillingType];
      const profXpCur = Number(player.prog?.professions?.[skSpec.profession]?.xp) || 0;
      const profLvl = getProfessionLevelFromXp(profXpCur);
      if (profLvl < (skSpec.reqLevel || 1)) {
        const profName = PROFESSIONS_CATALOG[skSpec.profession]?.name || skSpec.profession;
        player.send({
          type: 'sys_msg',
          category: 'combat',
          text: `🔒 Requires Lv.${skSpec.reqLevel} ${profName} to harvest ${skSpec.name} (Current: Lv.${profLvl})!`,
        });
        return;
      }
      node.charges--;
      if (node.charges === 0) node.rechargeTimer = skSpec.respawnSec || 12.0;

      const yields = skSpec.yields || [];
      const totalChance = yields.reduce((sum, y) => sum + (y.chance || 1), 0) || 1;
      let roll = Math.random() * totalChance;
      let chosen = yields[0] || { id: 'sun_copper_ore', qty: 1 };
      for (const y of yields) {
        roll -= (y.chance || 1);
        if (roll <= 0) {
          chosen = y;
          break;
        }
      }
      const chosenId = chosen.id || 'sun_copper_ore';
      const qty = chosen.qty || 1;

      this.addPlayerGlimmer(room, player, skSpec.glimmer || 12);
      const added = this.accounts.addItemToInventory(player.id, chosenId, qty);
      const itemDef = EQUIPMENT_CATALOG[chosenId];

      room.fxQueue.push({
        kind: 'spark',
        x: node.x,
        y: node.y - 10,
        colors: skSpec.sparkColors || ['#fde047', '#38bdf8', '#ffffff'],
      });
      room.fxQueue.push({
        kind: 'fct',
        x: node.x,
        y: node.y - 6,
        text: added ? `+${qty}x ${itemDef?.name || chosenId}` : 'BACKPACK FULL (28/28)',
        color: added ? ((skSpec.sparkColors && skSpec.sparkColors[0]) || '#fde047') : '#ef4444',
        isCrit: added,
      });

      this.awardPlayerXP(player, 4, skSpec.name);
      this.awardProfessionXP(player, skSpec.profession, skSpec.xp || 25, skSpec.name);
      if (skSpec.secondaryProfession) {
        this.awardProfessionXP(player, skSpec.secondaryProfession, Math.max(8, Math.round((skSpec.xp || 25) * 0.35)), skSpec.name);
      }

      player.questState = player.questState || {};
      player.questState.extractionNodesHarvested = (player.questState.extractionNodesHarvested || 0) + 1;
      if (room.type === ROOM_TYPES.STARFALL_CRATER && (node.skillingType === 'mithril_vein' || node.skillingType === 'starmetal_vein')) {
        player.questState.starfallVeins = (player.questState.starfallVeins || 0) + 1;
      }
      this.accounts.saveQuestState(player.id, player.questState);
      this.refreshClientFromAccount(player.id);
      return;
    }

    node.charges--;
    if (node.charges === 0) node.rechargeTimer = isGrand ? 45.0 : 11.0;

    const eff = getEffectiveStats(player.prog, player.equipment, player.classId);
    const gain = isGrand ? 60 + eff.resonance * 6 : 18 + Math.floor(eff.resonance * 1.5);
    this.addPlayerGlimmer(room, player, gain);
    room.fxQueue.push({ kind: 'spark', x: node.x, y: node.y - 10, colors: isGrand ? ['#fde047', '#c084fc', '#38bdf8'] : ['#c084fc', '#e879f9', '#38bdf8'] });
    room.fxQueue.push({ kind: 'fct', x: node.x, y: node.y, text: isGrand ? `+${gain} GLIMMER • GRAND FONT` : `+${gain} GLIMMER`, color: isGrand ? '#fde047' : '#c084fc', isCrit: isGrand });
    // Nodes are primarily a Glimmer/Extraction grind: character (combat) XP is intentionally small.
    this.awardPlayerXP(player, isGrand ? 7 : 3, isGrand ? 'Grand Glimmer Font' : 'Glimmer Node');
    this.awardProfessionXP(player, 'resonance_extraction', isGrand ? 100 : 25, isGrand ? 'Grand Glimmer Font Channeling' : 'Glimmer Node Channeling');

    if (isGrand || Math.random() < 0.45) {
      const bonusMat = Math.random() < 0.5 ? 'glimmer_shard' : 'astral_mineral_dust';
      if (this.accounts.addItemToInventory(player.id, bonusMat, 1)) {
        this.refreshClientFromAccount(player.id);
      }
    }

    player.questState = player.questState || {};
    player.questState.extractionNodesHarvested = (player.questState.extractionNodesHarvested || 0) + 1;
    if (room.type === ROOM_TYPES.AETHER_SPIRE || node.id === 'aeth_node_1') {
      player.questState.aetherFontChanneled = true;
    }
    this.accounts.saveQuestState(player.id, player.questState);
  },

  handleCraftRecipe(room, player, recipeId) {
    if (!player || !player.prog || !recipeId) return;
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    const outItem = EQUIPMENT_CATALOG[recipe.outputId];
    if (!outItem) return;

    const acc = this.accounts.accountsById.get(player.id);
    if (!acc) return;
    this.accounts.ensureDefaultCharacter(acc);
    if (!Array.isArray(acc.inventory)) acc.inventory = [];

    const profXp = Math.max(0, Math.floor(Number(player.prog?.professions?.[recipe.profession]?.xp) || 0));
    const profLvl = getProfessionLevelFromXp(profXp);
    if (profLvl < (recipe.reqLevel || 1)) {
      const pName = PROFESSIONS_CATALOG[recipe.profession]?.name || recipe.profession;
      player.send({
        type: 'sys_msg',
        category: 'combat',
        text: `🔒 Requires Lv.${recipe.reqLevel} ${pName} to craft ${outItem.name}!`,
      });
      return;
    }

    // Verify all ingredients exist in acc.inventory
    let freedSlots = 0;
    for (const ing of recipe.ingredients) {
      let have = 0;
      for (const slot of acc.inventory) {
        const id = typeof slot === 'string' ? slot : slot?.id;
        if (id === ing.id) have += typeof slot === 'object' && slot.qty ? slot.qty : 1;
      }
      if (have < ing.qty) {
        player.send({
          type: 'sys_msg',
          category: 'combat',
          text: `[Artisan Station] Missing ${EQUIPMENT_CATALOG[ing.id]?.name || ing.id} (${have}/${ing.qty}).`,
        });
        return;
      }
      if (have === ing.qty) freedSlots++;
    }

    const outQty = recipe.outputQty || 1;
    const existingOut = outItem.stackable
      ? acc.inventory.find((s) => (typeof s === 'string' ? s : s?.id) === recipe.outputId)
      : null;
    const neededSlots = existingOut ? 0 : (outItem.stackable ? 1 : outQty);
    if (acc.inventory.length - freedSlots + neededSlots > 28) {
      player.send({
        type: 'sys_msg',
        category: 'combat',
        text: '🎒 Backpack is full (28/28)! Clear space before crafting.',
      });
      return;
    }

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      let rem = ing.qty;
      for (let i = acc.inventory.length - 1; i >= 0 && rem > 0; i--) {
        const slot = acc.inventory[i];
        const id = typeof slot === 'string' ? slot : slot?.id;
        if (id !== ing.id) continue;
        const curQty = typeof slot === 'object' && slot.qty ? slot.qty : 1;
        if (curQty > rem) {
          if (typeof slot === 'string') acc.inventory[i] = { id, qty: curQty - rem };
          else slot.qty = curQty - rem;
          rem = 0;
        } else {
          rem -= curQty;
          acc.inventory.splice(i, 1);
        }
      }
    }

    // Grant crafted output
    if (outItem.stackable) {
      const existing = acc.inventory.find((s) => (typeof s === 'string' ? s : s?.id) === recipe.outputId);
      if (existing) {
        if (typeof existing === 'string') {
          const idx = acc.inventory.indexOf(existing);
          acc.inventory[idx] = { id: recipe.outputId, qty: 1 + outQty };
        } else {
          existing.qty = (existing.qty || 1) + outQty;
        }
      } else {
        acc.inventory.push({ id: recipe.outputId, qty: outQty });
      }
    } else {
      for (let k = 0; k < outQty && acc.inventory.length < 28; k++) {
        acc.inventory.push({ id: recipe.outputId, qty: 1 });
      }
    }

    const ch = this.accounts.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) ch.inventory = acc.inventory;
    this.accounts.schedulePersist(acc.id, ch?.id);

    player.questState = player.questState || {};
    player.questState.craftsCompleted = (player.questState.craftsCompleted || 0) + 1;
    if (recipe.station === 'cosmic_anvil') player.questState.smithInspected = true;
    if (recipe.station === 'aether_crucible') player.questState.apothecaryInspected = true;
    if (recipe.station === 'celestial_loom') player.questState.provisionsInspected = true;
    this.accounts.saveQuestState(player.id, player.questState);

    this.awardProfessionXP(player, recipe.profession, recipe.xp || 30, outItem.name);
    this.refreshClientFromAccount(player.id);

    if (room) {
      const stColor = CRAFTING_STATIONS[recipe.station]?.color || '#fde047';
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 10, colors: [stColor, '#fde047', '#ffffff'], count: 14 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 20, text: `✦ +${outQty}x ${outItem.name.toUpperCase()}`, color: stColor, isCrit: true });
    }
  },

  handleClaimBounty(room, player, bountyId) {
    if (!player || !player.prog || !bountyId) return;
    const contract = BOUNTY_CONTRACTS.find((b) => b.id === bountyId);
    if (!contract) return;
    const now = Date.now();
    if (now < (player.nextBountyClaimAt || 0)) return;
    player.nextBountyClaimAt = now + 1500;

    if (contract.rewardGold > 0) {
      this.accounts.addItemToInventory(player.id, 'solar_gold', contract.rewardGold);
    }
    for (const ri of (contract.rewardItems || [])) {
      if (ri?.id && EQUIPMENT_CATALOG[ri.id]) {
        this.accounts.addItemToInventory(player.id, ri.id, ri.qty || 1);
      }
    }
    this.awardPlayerXP(player, contract.rewardXp || 50, `Bounty: ${contract.title}`);
    if (contract.rewardProf?.id && contract.rewardProf?.xp) {
      this.awardProfessionXP(player, contract.rewardProf.id, contract.rewardProf.xp, contract.title);
    }
    this.refreshClientFromAccount(player.id);

    if (room) {
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 12, colors: ['#fde047', '#4ade80', '#38bdf8'], count: 24 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 18, text: `🏆 BOUNTY CLAIMED! +${contract.rewardGold} GOLD`, color: '#fde047', isCrit: true });
    }
  },

  awardProfessionXP(player, professionId, amount, reason = '') {
    if (!player || !player.prog || amount <= 0) return;
    if (!player.prog.professions) {
      player.prog.professions = {
        combat_mastery: { xp: 0, level: 1 },
        rites: { xp: 0, level: 1 },
        flashes: { xp: 0, level: 1 },
        resonance_extraction: { xp: 0, level: 1 },
        relic_forging: { xp: 0, level: 1 },
        rite_binding: { xp: 0, level: 1 },
        glimmerweaving: { xp: 0, level: 1 },
      };
    }
    const prof = player.prog.professions[professionId];
    if (!prof) return;

    const oldLevel = prof.level || getProfessionLevelFromXp(prof.xp || 0);
    prof.xp = (prof.xp || 0) + amount;
    const newLevel = getProfessionLevelFromXp(prof.xp);
    prof.level = newLevel;

    const leveled = newLevel > oldLevel;
    if (leveled) {
      const pInfo = PROFESSIONS_CATALOG[professionId];
      const profName = pInfo?.name || professionId;
      const room = this.rooms.get(player.roomId);
      if (room) {
        room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 12, colors: [pInfo?.color || '#38bdf8', '#ffffff', '#fde047'] });
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 16, text: `🎉 ${profName.toUpperCase()} LVL ${newLevel}!`, color: pInfo?.color || '#38bdf8', isCrit: true });
      }
      this.broadcastToRoom(room, {
        type: 'sys_msg',
        category: 'chat',
        text: `✨ ${player.displayName} has achieved level ${newLevel} in ${profName}!`,
      });
    }

    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      professionGained: {
        id: professionId,
        amount,
        newLevel,
        leveled,
        reason,
      },
    });
    this.grantProfessionMasteryCape(player, professionId);
  },

  grantProfessionMasteryCape(player, professionId) {
    if (!player || !player.prog) return false;
    const prof = player.prog.professions?.[professionId];
    const capeId = PROFESSION_MASTERY_CAPES[professionId];
    if (!prof || !capeId || prof.masteryCapeAwarded) return false;
    if (getProfessionLevelFromXp(prof.xp || 0) < 99) return false;

    const inventory = Array.isArray(player.inventory) ? player.inventory : [];
    const ownsCape = inventory.some((it) => (typeof it === 'string' ? it : it?.id) === capeId);
    if (!ownsCape && !this.accounts.addItemToInventory(player.id, capeId, 1)) {
      player.send({
        type: 'sys_msg',
        category: 'chat',
        text: `[Mastery] Your backpack is full. Free a slot and train once more to claim the ${EQUIPMENT_CATALOG[capeId]?.name || 'skillcape'}.`,
      });
      return false;
    }

    prof.masteryCapeAwarded = true;
    this.accounts.saveProgression(player.id, player.prog);
    const cape = EQUIPMENT_CATALOG[capeId];
    const room = this.rooms.get(player.roomId);
    if (room) {
      room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 14, colors: ['#facc15', '#ffffff', '#38bdf8'] });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 20, text: `🏆 ${cape?.name?.toUpperCase() || 'SKILLCAPE'}!`, color: '#facc15', isCrit: true });
    }
    this.broadcastToRoom(room, {
      type: 'sys_msg',
      category: 'quest',
      text: `🏆 ${player.displayName} reached Level 99 in ${PROFESSIONS_CATALOG[professionId]?.name || professionId} and claimed the ${cape?.name || 'Skillcape'}!`,
    });
    this.refreshClientFromAccount(player.id);
    return true;
  },
};
