// ==========================================
// GlimmerFall Online 2D — Iconic RuneScape Loops Catalog & Pure Simulation Logic
// Vanguard Slayer System, Treasure Trails (Clue Scrolls), Collection Log & Drop Table Previews
// ==========================================

import { ROOM_TYPES } from './rooms.js';

export const OSRS_LOOPS_ITEMS = {
  slayer_helm: {
    id: 'slayer_helm',
    slot: 'head',
    name: 'Vanguard Slayer Helm',
    icon: '🪖',
    rarity: 'Legendary',
    stats: { power: 3, bastion: 3, resonance: 2 },
    slayerTaskBonus: 0.15,
    guidePrice: 4500,
    desc: 'Reinforced trophy visor forged by the Vanguard Slayer Order (+3 Power, +3 Bastion, +2 Resonance, +15% damage against active Slayer task targets).',
  },
  quest_point_cape: {
    id: 'quest_point_cape',
    slot: 'cape',
    name: 'Cape of Canonical Lore (Quest Cape)',
    icon: '📜',
    rarity: 'Skill Mastery',
    capeColor: '#38bdf8',
    stats: { power: 4, bastion: 4, resonance: 4, tempo: 4 },
    guidePrice: 5000,
    desc: 'Royal cobalt cloak stitched with silver filigree, awarded exclusively to Adventurers who complete every canonical quest across GlimmerFall (+4 All Stats).',
  },
  cluescroll_easy: {
    id: 'cluescroll_easy',
    slot: 'consumable',
    isClueScroll: true,
    clueTier: 'easy',
    name: 'Sealed Clue Scroll (Easy)',
    icon: '📜',
    rarity: 'Uncommon',
    stackable: false,
    guidePrice: 250,
    desc: 'A weatherworn parchment hiding a two-step Sanctuary & Coast Treasure Trail riddle. Click to inspect your next clue.',
  },
  cluescroll_medium: {
    id: 'cluescroll_medium',
    slot: 'consumable',
    isClueScroll: true,
    clueTier: 'medium',
    name: 'Sealed Clue Scroll (Medium)',
    icon: '📜',
    rarity: 'Rare',
    stackable: false,
    guidePrice: 750,
    desc: 'An Astral-sealed parchment charting a three-step Continental Treasure Trail. Rewards mid-tier caskets & Ranger gear.',
  },
  cluescroll_hard: {
    id: 'cluescroll_hard',
    slot: 'consumable',
    isClueScroll: true,
    clueTier: 'hard',
    name: 'Sealed Clue Scroll (Hard)',
    icon: '📜',
    rarity: 'Epic',
    stackable: false,
    guidePrice: 2200,
    desc: 'A gilded cipher scroll leading through dangerous Warzone & Boss territories across four Treasure Trail steps.',
  },
  casket_easy: {
    id: 'casket_easy',
    slot: 'consumable',
    isRewardCasket: true,
    clueTier: 'easy',
    name: 'Treasure Casket (Easy)',
    icon: '🎁',
    rarity: 'Uncommon',
    stackable: true,
    guidePrice: 400,
    desc: 'A brass-bound Treasure Trail coffer. Open to claim Solar Gold, Glimmer Shards, and rare Trimmed Cloaks.',
  },
  casket_medium: {
    id: 'casket_medium',
    slot: 'consumable',
    isRewardCasket: true,
    clueTier: 'medium',
    name: 'Treasure Casket (Medium)',
    icon: '🎁',
    rarity: 'Rare',
    stackable: true,
    guidePrice: 1200,
    desc: 'A jewel-inlaid Treasure Trail chest holding precious runes and a chance at iconic Ranger Boots.',
  },
  casket_hard: {
    id: 'casket_hard',
    slot: 'consumable',
    isRewardCasket: true,
    clueTier: 'hard',
    name: 'Treasure Casket (Hard)',
    icon: '👑',
    rarity: 'Epic',
    stackable: true,
    guidePrice: 3500,
    desc: 'An ornate Masterwork Treasure Trail strongbox prized by gilded hunters for Robin Hood Hats and Gilded Helms.',
  },
  gilded_sun_helm: {
    id: 'gilded_sun_helm',
    slot: 'head',
    name: 'Gilded Sunspire Greathelm',
    icon: '👑',
    rarity: 'Legendary',
    stats: { bastion: 3, power: 2 },
    guidePrice: 4200,
    desc: 'Rare gold-leaf parade armor recovered exclusively from Hard Treasure Trail caskets (+3 Bastion, +2 Power).',
  },
  ranger_boots: {
    id: 'ranger_boots',
    slot: 'feet',
    name: 'Greenweave Ranger Boots',
    icon: '🥾',
    rarity: 'Epic',
    stats: { tempo: 3, power: 2 },
    guidePrice: 3800,
    desc: 'Supple forest-dyed scout boots treasured from Medium & Hard Treasure Trail caskets (+3 Tempo, +2 Power).',
  },
  robin_hood_hat: {
    id: 'robin_hood_hat',
    slot: 'head',
    name: "Wayfarer's Feather Cap",
    icon: '🎩',
    rarity: 'Epic',
    stats: { tempo: 3, resonance: 2 },
    guidePrice: 3400,
    desc: 'Plumed sharpshooter beret unlocked through Continental Treasure Trails (+3 Tempo, +2 Resonance).',
  },
  trimmed_solari_cape: {
    id: 'trimmed_solari_cape',
    slot: 'cape',
    name: 'Gold-Trimmed Dawn Cape',
    icon: '🧣',
    rarity: 'Rare',
    capeColor: '#facc15',
    stats: { power: 2, bastion: 2 },
    guidePrice: 1600,
    desc: 'Ceremonial embroidered Treasure Trail mantle (+2 Power, +2 Bastion).',
  },
};

export const SLAYER_MASTERS = {
  scout_vaelen: {
    id: 'scout_vaelen',
    name: 'Novice Scout Vaelen',
    title: 'Sanctuary Frontier Tracker',
    icon: '🏹',
    minLevel: 1,
    color: '#4ade80',
    desc: 'Assigns introductory hunts in faction dungeons and outer realms (Lv. 1+).',
  },
  stalker_kael: {
    id: 'stalker_kael',
    name: 'Caldera Stalker Kael',
    title: 'Vanguard Hunter Veteran',
    icon: '⚔️',
    minLevel: 12,
    color: '#38bdf8',
    desc: 'Dispatches high-yield Nexus Warzone & Elemental Realm hunts (Lv. 12+).',
  },
  master_nyx: {
    id: 'master_nyx',
    name: 'Mythic Taskmaster Nyx',
    title: 'Grand Vanguard Arbiter',
    icon: '💀',
    minLevel: 26,
    color: '#c084fc',
    desc: 'Issues perilous World Boss & Caldera Elite extermination contracts (Lv. 26+).',
  },
};

export const SLAYER_TASK_POOLS = {
  scout_vaelen: [
    { id: 'slay_solari_citadel', name: 'Sunforged Sentinels & Zealots', keywords: ['sunforged', 'sentinel', 'inquisitor'], roomHint: 'Solari Citadel', minQty: 5, maxQty: 9, points: 5, xpPerKill: 24 },
    { id: 'slay_umbri_shades', name: 'Sepulcher Stalkers & Bog Fiends', keywords: ['sepulcher', 'stalker', 'bog fiend', 'phantom'], roomHint: 'Umbri Undercity', minQty: 5, maxQty: 9, points: 5, xpPerKill: 24 },
    { id: 'slay_terra_beasts', name: 'Briarback Prowlers & Stonekin', keywords: ['briarback', 'prowler', 'stonekin', 'treant'], roomHint: 'Terra Orchard', minQty: 5, maxQty: 9, points: 5, xpPerKill: 24 },
    { id: 'slay_aether_anomalies', name: 'Continuum Wraiths & Chrono Constructs', keywords: ['continuum', 'wraith', 'chrono', 'construct'], roomHint: 'Aether Spire', minQty: 5, maxQty: 9, points: 5, xpPerKill: 24 },
  ],
  stalker_kael: [
    { id: 'slay_granite_crags', name: 'Granite Sentinels & Crag Behemoths', keywords: ['granite', 'behemoth', 'golem', 'keystone'], roomHint: 'Nexus Warzone / Pass', minQty: 8, maxQty: 14, points: 10, xpPerKill: 45 },
    { id: 'slay_warzone_raiders', name: 'Void & Duskblade Raiders', keywords: ['raider', 'marauder', 'scavenger', 'reaver'], roomHint: 'Nexus Warzone', minQty: 8, maxQty: 14, points: 10, xpPerKill: 45 },
    { id: 'slay_citadel_constructs', name: 'Dawnblade & Sunfire Constructs', keywords: ['dawnblade', 'sunfire', 'automaton', 'sunforged'], roomHint: 'Caldera / Citadel', minQty: 8, maxQty: 14, points: 10, xpPerKill: 45 },
    { id: 'slay_time_archons', name: 'Paradoxes & Continuum Weavers', keywords: ['paradox', 'weaver', 'echo'], roomHint: 'Aether Quadrant', minQty: 8, maxQty: 14, points: 10, xpPerKill: 45 },
  ],
  master_nyx: [
    { id: 'slay_world_bosses', name: 'World Boss Titans & Overlords', keywords: ['colossus', 'malakor', 'juggernaut', 'paradox', 'overlord', 'brambleheart', 'titan'], roomHint: 'Warzone Quadrants / Dungeons', minQty: 2, maxQty: 3, points: 22, xpPerKill: 180, isBossTask: true },
    { id: 'slay_abyssal_furies', name: 'Abyssal & Starfall Guardians', keywords: ['abyssal', 'starfall', 'sepulcher', 'rootdeep', 'prism'], roomHint: 'Abyssal Rift / Starfall Crater', minQty: 10, maxQty: 16, points: 16, xpPerKill: 75 },
    { id: 'slay_caldera_elites', name: 'Warzone Caldera Champions', keywords: ['sentinel', 'reaver', 'crusader', 'stonekin', 'paradox'], roomHint: 'Nexus Warzone', minQty: 12, maxQty: 18, points: 15, xpPerKill: 65 },
  ],
};

export const SLAYER_UNLOCKS = {
  slayer_helm_craft: {
    id: 'slayer_helm_craft',
    name: 'Forge Vanguard Slayer Helm',
    icon: '🪖',
    cost: 25,
    grantItemId: 'slayer_helm',
    desc: 'Permanently unlocks and forges the Vanguard Slayer Helm (+15% damage against assigned Slayer task foes).',
  },
  boss_slayer: {
    id: 'boss_slayer',
    name: 'Like a Boss! Contracts',
    icon: '💀',
    cost: 35,
    desc: 'Permits Mythic Taskmaster Nyx to roll World Boss & Dungeon Boss bonus contracts with doubled point yields.',
  },
  expedited_drops: {
    id: 'expedited_drops',
    name: 'Treasure Seeker Instinct',
    icon: '📜',
    cost: 20,
    desc: 'Doubles Sealed Clue Scroll drop probability while slaying monsters on an active Slayer task.',
  },
  block_slot_expand: {
    id: 'block_slot_expand',
    name: 'Task Veto Ledger',
    icon: '🚫',
    cost: 15,
    desc: 'Unlocks an additional Slayer Task Block slot to permanently skip unfavorable contracts.',
  },
};

export function normalizeSlayerState(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    masterId: SLAYER_MASTERS[s.masterId] ? s.masterId : 'scout_vaelen',
    task: s.task && typeof s.task === 'object' ? { ...s.task } : null,
    points: Math.max(0, Number(s.points) || 0),
    streak: Math.max(0, Number(s.streak) || 0),
    completedTasks: Math.max(0, Number(s.completedTasks) || 0),
    unlockedPerks: Array.isArray(s.unlockedPerks) ? [...new Set(s.unlockedPerks)] : [],
    blockedTaskIds: Array.isArray(s.blockedTaskIds) ? [...new Set(s.blockedTaskIds)] : [],
  };
}

export function doesMobMatchSlayerTask(task, mobName) {
  if (!task || !mobName) return false;
  const lower = String(mobName).toLowerCase();
  return Array.isArray(task.keywords) && task.keywords.some((kw) => lower.includes(String(kw).toLowerCase()));
}

export function assignSlayerTask(rawState, masterId = 'scout_vaelen', playerLevel = 1) {
  const state = normalizeSlayerState(rawState);
  const master = SLAYER_MASTERS[masterId];
  if (!master) return { ok: false, reason: 'Unknown Slayer Master', state };
  if (playerLevel < master.minLevel) {
    return { ok: false, reason: `${master.name} requires Champion Lv.${master.minLevel}`, state };
  }
  if (state.task) {
    return { ok: false, reason: `Complete or skip your active "${state.task.name}" contract first`, state };
  }
  const hasBossUnlock = state.unlockedPerks.includes('boss_slayer');
  const pool = (SLAYER_TASK_POOLS[masterId] || []).filter((t) => {
    if (state.blockedTaskIds.includes(t.id)) return false;
    if (t.isBossTask && !hasBossUnlock) return false;
    return true;
  });
  const candidates = pool.length > 0 ? pool : SLAYER_TASK_POOLS[masterId] || [];
  if (candidates.length === 0) return { ok: false, reason: 'No tasks available', state };

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const qty = picked.minQty + Math.floor(Math.random() * (picked.maxQty - picked.minQty + 1));
  state.masterId = masterId;
  state.task = {
    id: picked.id,
    masterId,
    name: picked.name,
    keywords: [...picked.keywords],
    roomHint: picked.roomHint,
    targetCount: qty,
    progress: 0,
    pointsReward: picked.points,
    xpPerKill: picked.xpPerKill,
  };
  return { ok: true, task: state.task, state };
}

export function advanceSlayerKill(rawState, mobName) {
  const state = normalizeSlayerState(rawState);
  if (!state.task || !doesMobMatchSlayerTask(state.task, mobName)) {
    return { matched: false, completed: false, xpGained: 0, pointsAwarded: 0, state };
  }
  state.task.progress = Math.min(state.task.targetCount, (state.task.progress || 0) + 1);
  const xpGained = state.task.xpPerKill || 25;
  if (state.task.progress < state.task.targetCount) {
    return {
      matched: true,
      completed: false,
      xpGained,
      pointsAwarded: 0,
      remaining: state.task.targetCount - state.task.progress,
      state,
    };
  }
  // Task Completed! Calculate OSRS milestone streak multiplier
  state.streak += 1;
  state.completedTasks += 1;
  let mult = 1;
  if (state.streak % 50 === 0) mult = 15;
  else if (state.streak % 25 === 0) mult = 10;
  else if (state.streak % 10 === 0) mult = 5;
  else if (state.streak % 5 === 0) mult = 2;

  const pointsAwarded = (state.task.pointsReward || 5) * mult;
  const completedName = state.task.name;
  state.points += pointsAwarded;
  state.task = null;
  return {
    matched: true,
    completed: true,
    completedName,
    xpGained: xpGained * 2,
    pointsAwarded,
    streak: state.streak,
    streakMult: mult,
    state,
  };
}

export function skipSlayerTask(rawState, blockPermanently = false) {
  const state = normalizeSlayerState(rawState);
  if (!state.task) return { ok: false, reason: 'No active Slayer task to skip', state };
  const cost = blockPermanently ? 25 : 10;
  const maxBlocks = state.unlockedPerks.includes('block_slot_expand') ? 2 : 1;
  if (blockPermanently && state.blockedTaskIds.length >= maxBlocks) {
    return { ok: false, reason: `Task Block limit (${maxBlocks}) reached`, state };
  }
  if (state.points >= cost) {
    state.points -= cost;
    if (blockPermanently) state.blockedTaskIds.push(state.task.id);
    const skipped = state.task.name;
    state.task = null;
    return { ok: true, skippedName: skipped, cost, resetStreak: false, state };
  }
  if (blockPermanently) {
    return { ok: false, reason: `Blocking a task requires ${cost} Slayer Points`, state };
  }
  // Free reset if low points, resets streak just like OSRS Turael skip
  const skipped = state.task.name;
  state.task = null;
  state.streak = 0;
  return { ok: true, skippedName: skipped, cost: 0, resetStreak: true, state };
}

export function purchaseSlayerUnlock(rawState, unlockId) {
  const state = normalizeSlayerState(rawState);
  const perk = SLAYER_UNLOCKS[unlockId];
  if (!perk) return { ok: false, reason: 'Unknown Slayer unlock', state };
  if (state.unlockedPerks.includes(unlockId) && !perk.grantItemId) {
    return { ok: false, reason: 'Already unlocked', state };
  }
  if (state.points < perk.cost) {
    return { ok: false, reason: `Need ${perk.cost} Slayer Points (you have ${state.points})`, state };
  }
  state.points -= perk.cost;
  if (!state.unlockedPerks.includes(unlockId)) {
    state.unlockedPerks.push(unlockId);
  }
  return { ok: true, perk, grantItemId: perk.grantItemId || null, state };
}

// ==========================================
// TREASURE TRAILS — CLUE SCROLLS & CASKETS
// ==========================================

export const CLUE_STEPS_CATALOG = {
  easy: [
    {
      id: 'easy_riddle_aurora',
      tier: 'easy',
      kind: 'riddle',
      npcId: 'npc_aurora',
      npcName: 'Archivist Aurora',
      prompt: 'Cryptic Riddle: Speak with the keeper of awakening chronicles in Sanctuary Hub to prove your bond.',
      hintRoom: 'Sanctuary Hub',
    },
    {
      id: 'easy_coord_coast',
      tier: 'easy',
      kind: 'coord',
      roomType: ROOM_TYPES.CORAL_COAST,
      x: 120,
      y: 80,
      tolerance: 120,
      prompt: 'Coordinate Scroll: Travel to Coral Coast near the southern pier (+120, +80) and click Excavate!',
    },
    {
      id: 'easy_emote_cheer',
      tier: 'easy',
      kind: 'emote',
      emoteId: 'cheer',
      prompt: 'Emote Clue: Perform the "Praise Glimmer" (/cheer) emote beneath the stars!',
    },
    {
      id: 'easy_riddle_garrick',
      tier: 'easy',
      kind: 'riddle',
      npcId: 'npc_innkeeper_garrick',
      npcName: 'Innkeeper Garrick',
      prompt: 'Cryptic Riddle: Consult the warmhearted barkeep pouring Tankards in the Sanctuary Tavern.',
      hintRoom: 'Sanctuary Tavern',
    },
  ],
  medium: [
    {
      id: 'med_coord_ironwood',
      tier: 'medium',
      kind: 'coord',
      roomType: ROOM_TYPES.IRONWOOD_TIMBERLANDS,
      x: -180,
      y: -120,
      tolerance: 125,
      prompt: 'Coordinate Scroll: Excavate among the ancient roots at Ironwood Timberlands (-180, -120).',
    },
    {
      id: 'med_emote_swords',
      tier: 'medium',
      kind: 'emote',
      emoteId: 'swords',
      prompt: 'Emote Clue: Flourish your blade using the Challenge (/swords) emote anywhere in the realm!',
    },
    {
      id: 'med_riddle_caelum',
      tier: 'medium',
      kind: 'riddle',
      npcId: 'npc_exchange_caelum',
      npcName: 'Broker Caelum',
      prompt: 'Cryptic Riddle: Seek the AetherSwap Grand Exchange Broker in Sanctuary Hub.',
      hintRoom: 'Sanctuary Hub',
    },
    {
      id: 'med_coord_oasis',
      tier: 'medium',
      kind: 'coord',
      roomType: ROOM_TYPES.SUNKEN_OASIS,
      x: 60,
      y: -90,
      tolerance: 125,
      prompt: 'Coordinate Scroll: Dig beside the mirage palms of Sunken Oasis (+60, -90).',
    },
  ],
  hard: [
    {
      id: 'hard_coord_warzone_ruins',
      tier: 'hard',
      kind: 'coord',
      roomType: ROOM_TYPES.NEXUS_WARZONE,
      x: 0,
      y: -780,
      tolerance: 135,
      prompt: 'Coordinate Scroll: Venture into north Nexus Warzone before Forgotten Ruins (0, -780) and Excavate!',
    },
    {
      id: 'hard_emote_shield',
      tier: 'hard',
      kind: 'emote',
      emoteId: 'shield',
      prompt: 'Emote Clue: Raise the Guard Nexus (/shield) stance against incoming Void.',
    },
    {
      id: 'hard_riddle_thorne',
      tier: 'hard',
      kind: 'riddle',
      npcId: 'npc_guildmaster_thorne',
      npcName: 'Guildmaster Thorne',
      prompt: 'Cryptic Riddle: Salute the commander inside the Adventurers Vanguard Guildhall.',
      hintRoom: 'Vanguard Guildhall',
    },
    {
      id: 'hard_coord_starfall',
      tier: 'hard',
      kind: 'coord',
      roomType: ROOM_TYPES.STARFALL_CRATER,
      x: -110,
      y: 70,
      tolerance: 135,
      prompt: 'Coordinate Scroll: Excavate an iridescent crater shard at Starfall Crater (-110, +70).',
    },
  ],
};

const TIER_STEP_COUNT = { easy: 2, medium: 3, hard: 4 };

export function normalizeClueState(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  return {
    activeTier: ['easy', 'medium', 'hard'].includes(c.activeTier) ? c.activeTier : null,
    stepIndex: Math.max(0, Number(c.stepIndex) || 0),
    steps: Array.isArray(c.steps) ? c.steps : [],
    completedCount: Math.max(0, Number(c.completedCount) || 0),
  };
}

export function startClueScroll(rawState, tier = 'easy') {
  const cleanTier = TIER_STEP_COUNT[tier] ? tier : 'easy';
  const pool = [...(CLUE_STEPS_CATALOG[cleanTier] || CLUE_STEPS_CATALOG.easy)];
  const needed = TIER_STEP_COUNT[cleanTier];
  const steps = [];
  while (steps.length < needed && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    steps.push(pool.splice(idx, 1)[0]);
  }
  const base = normalizeClueState(rawState);
  return {
    ...base,
    activeTier: cleanTier,
    stepIndex: 0,
    steps,
  };
}

export function evaluateClueStep(rawState, context = {}) {
  const state = normalizeClueState(rawState);
  if (!state.activeTier || !state.steps.length) {
    return { advanced: false, completed: false, reason: 'No active Clue Scroll trail', state };
  }
  const step = state.steps[state.stepIndex];
  if (!step) {
    return { advanced: false, completed: false, reason: 'Invalid clue step', state };
  }

  let matched = false;
  if (step.kind === 'coord') {
    const roomOk = String(context.roomType || '').toLowerCase() === String(step.roomType).toLowerCase();
    const dist = Math.hypot((Number(context.x) || 0) - step.x, (Number(context.y) || 0) - step.y);
    matched = roomOk && dist <= (step.tolerance || 125);
    if (!matched) {
      return {
        advanced: false,
        completed: false,
        reason: `Head to ${step.prompt} (current offset: ${roomOk ? `${Math.round(dist)}px away` : 'wrong zone'})`,
        state,
      };
    }
  } else if (step.kind === 'riddle') {
    matched = Boolean(context.npcId && context.npcId === step.npcId) || Boolean(context.talkedNpcs?.[step.npcId]);
    if (!matched) {
      return {
        advanced: false,
        completed: false,
        reason: `Speak with ${step.npcName} (${step.hintRoom}) first, then inspect this Clue Scroll!`,
        state,
      };
    }
  } else if (step.kind === 'emote') {
    matched = String(context.emoteId || '') === step.emoteId || String(context.lastEmoteId || '') === step.emoteId;
    if (!matched) {
      return {
        advanced: false,
        completed: false,
        reason: `Use the /${step.emoteId} emote (top-left of Chat or [V] wheel) first!`,
        state,
      };
    }
  }

  state.stepIndex += 1;
  if (state.stepIndex >= state.steps.length) {
    const casketItemId = `casket_${state.activeTier}`;
    const completedTier = state.activeTier;
    state.activeTier = null;
    state.stepIndex = 0;
    state.steps = [];
    state.completedCount += 1;
    return {
      advanced: true,
      completed: true,
      completedTier,
      casketItemId,
      state,
    };
  }
  return {
    advanced: true,
    completed: false,
    nextStep: state.steps[state.stepIndex],
    stepNumber: state.stepIndex + 1,
    totalSteps: state.steps.length,
    state,
  };
}

export function rollClueCasketRewards(tier = 'easy') {
  const rewards = [];
  if (tier === 'easy') {
    rewards.push({ itemId: 'solar_gold', qty: 120 + Math.floor(Math.random() * 140) });
    rewards.push({ itemId: 'glimmer_shard', qty: 6 + Math.floor(Math.random() * 7) });
    if (Math.random() < 0.35) rewards.push({ itemId: 'trimmed_solari_cape', qty: 1 });
    else if (Math.random() < 0.35) rewards.push({ itemId: 'boots_of_haste', qty: 1 });
  } else if (tier === 'medium') {
    rewards.push({ itemId: 'solar_gold', qty: 320 + Math.floor(Math.random() * 280) });
    rewards.push({ itemId: 'chrono_gem', qty: 4 + Math.floor(Math.random() * 5) });
    if (Math.random() < 0.35) rewards.push({ itemId: 'ranger_boots', qty: 1 });
    else if (Math.random() < 0.4) rewards.push({ itemId: 'trimmed_solari_cape', qty: 1 });
    else rewards.push({ itemId: 'amulet_of_glory', qty: 1 });
  } else {
    rewards.push({ itemId: 'solar_gold', qty: 750 + Math.floor(Math.random() * 550) });
    rewards.push({ itemId: 'void_essence', qty: 8 + Math.floor(Math.random() * 8) });
    const rarePool = ['gilded_sun_helm', 'robin_hood_hat', 'ranger_boots', 'amulet_of_fury'];
    if (Math.random() < 0.55) {
      rewards.push({ itemId: rarePool[Math.floor(Math.random() * rarePool.length)], qty: 1 });
    } else {
      rewards.push({ itemId: 'barrows_gloves', qty: 1 });
    }
  }
  return rewards;
}

// ==========================================
// COLLECTION LOG & MONSTER DROP TABLE PREVIEW
// ==========================================

export const COLLECTION_LOG_CATEGORIES = [
  {
    id: 'treasure_trails',
    name: 'Treasure Trails',
    icon: '📜',
    items: ['trimmed_solari_cape', 'ranger_boots', 'robin_hood_hat', 'gilded_sun_helm', 'amulet_of_fury', 'barrows_gloves'],
  },
  {
    id: 'slayer_and_quests',
    name: 'Slayer & Grand Quests',
    icon: '🪖',
    items: ['slayer_helm', 'quest_point_cape', 'fire_cape', 'radiant_cape', 'abyssal_cloak'],
  },
  {
    id: 'boss_relics',
    name: 'Boss & Crypt Uniques',
    icon: '👑',
    items: [
      'sunfire_greatsword',
      'scythe_soulreaper',
      'ironwood_armor',
      'mirror_shield',
      'starmetal_meteor_hammer',
      'abyssal_voidstar_scythe',
      'crown_of_dawn',
      'aurelius_morningstar_blade',
    ],
  },
  {
    id: 'skill_capes',
    name: '99 Mastery Capes',
    icon: '🏆',
    items: [
      'skillcape_combat',
      'skillcape_rites',
      'skillcape_flashes',
      'skillcape_extraction',
      'skillcape_forging',
      'skillcape_binding',
      'skillcape_weaving',
    ],
  },
];

export const TRACKED_COLLECTION_IDS = new Set(
  COLLECTION_LOG_CATEGORIES.flatMap((cat) => cat.items)
);

export function normalizeCollectionLog(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === 'object') {
      out[k] = { count: Math.max(1, Number(v.count) || 1), unlockedAt: Number(v.unlockedAt) || Date.now() };
    } else if (v) {
      out[k] = { count: Math.max(1, Number(v) || 1), unlockedAt: Date.now() };
    }
  }
  return out;
}

export function recordCollectionItems(rawLog, itemIds = []) {
  const log = normalizeCollectionLog(rawLog);
  const newlyUnlocked = [];
  for (const itemId of itemIds) {
    if (!itemId || !TRACKED_COLLECTION_IDS.has(itemId)) continue;
    if (!log[itemId]) {
      log[itemId] = { count: 1, unlockedAt: Date.now() };
      newlyUnlocked.push(itemId);
    } else {
      log[itemId].count += 1;
    }
  }
  return { log, newlyUnlocked };
}

export function getCollectionSummary(rawLog) {
  const log = normalizeCollectionLog(rawLog);
  let obtained = 0;
  let total = 0;
  const categories = COLLECTION_LOG_CATEGORIES.map((cat) => {
    const entries = cat.items.map((id) => {
      total += 1;
      const rec = log[id] || null;
      if (rec) obtained += 1;
      return { id, obtained: Boolean(rec), count: rec?.count || 0 };
    });
    const catDone = entries.filter((e) => e.obtained).length;
    return {
      ...cat,
      obtained: catDone,
      total: entries.length,
      entries,
    };
  });
  return { obtained, total, categories };
}

export function getMobDropTablePreview(ent = {}) {
  const isBoss = Boolean(ent.isBoss);
  const isElite = Boolean(ent.eliteAffix);
  const rows = [
    { itemId: 'solar_gold', label: isBoss ? '140–260+ Coins' : isElite ? '35–120 Coins' : '8–50 Coins', rate: '100% Always' },
  ];
  if (ent.dropGear) {
    rows.push({ itemId: ent.dropGear, label: ent.dropGear, rate: isBoss ? '100% Guaranteed' : 'Rare' });
  }
  if (isBoss) {
    rows.push({ itemId: 'cluescroll_hard', label: 'Clue Scroll (Hard)', rate: '45% Common' });
    rows.push({ itemId: 'fire_cape', label: 'Boss Set & Accessories', rate: 'Guaranteed Roll' });
    rows.push({ itemId: 'amulet_of_fury', label: 'Amulet of Solar Fury / Relic', rate: 'Uncommon (1/12)' });
  } else if (isElite) {
    rows.push({ itemId: 'cluescroll_medium', label: 'Clue Scroll (Medium)', rate: '25% Uncommon' });
    rows.push({ itemId: 'star_iron_scimitar', label: 'Tier 2–3 Combat Gear', rate: '35% Uncommon' });
  } else {
    rows.push({ itemId: 'cluescroll_easy', label: 'Clue Scroll (Easy)', rate: '8% Drop' });
    rows.push({ itemId: 'glimmer_shard', label: 'Faction Currency & Mats', rate: '35–45% Common' });
    rows.push({ itemId: 'iron_broadsword', label: 'Tiered Armor / Weapons', rate: '12% Uncommon' });
  }
  return rows;
}
