// ==========================================
// RoomManager — Hostile Targeting & Ability Cast Initiation
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
  clampStepOutOfWater,
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
  BASE_GCD_SEC,
  MIN_GCD_SEC,
  SPELL_QUEUE_WINDOW_SEC,
  TANK_CLASSES,
  isAbilityOffGCD,
  canAbilityInterrupt,
  INTERRUPT_VULN_DURATION_SEC,
  INTERRUPT_STUN_SEC,
  getActiveCombatConsumableBonuses,
  ensureActorFactionState,
  advanceFactionResourceOnCast,
  resolveAbilityNumbers,
  getClassPassive,
} from '../../shared/protocol.js';
import { SIEGE_INTERVAL_MS, ARENA_WAIT_MS, nextThirtyMinBoundary } from './constants.js';

export const combatCastMethods = {
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
    if (ent && this.canDamageEntity(room, player, ent, targetId)) {
      return { kind: 'entity', ref: ent };
    }
    return null;
  },

  findNearestHostile(room, player, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const e of room.entities) {
      if (!this.canDamageEntity(room, player, e, null)) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d <= bestD) {
        bestD = d;
        best = { kind: 'entity', ref: e };
      }
    }
    const canPvpHere = room.isOverworld
      ? Boolean(ROOM_CONFIGS[player.roomType]?.pvp)
      : Boolean(room.pvp);
    if (canPvpHere || (this.duels && this.duels.hasActiveDuel(player.id))) {
      for (const other of room.players.values()) {
        if (other.isDead || other.stealthedTimer > 0 || this.arePlayersAllied(room, player, other)) continue;
        const d = Math.hypot(other.x - player.x, other.y - player.y);
        if (d <= bestD) {
          bestD = d;
          best = { kind: 'player', ref: other };
        }
      }
    }
    if (!best) {
      for (const e of room.entities) {
        if (!this.canDamageEntity(room, player, e, e.id)) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d <= bestD) {
          bestD = d;
          best = { kind: 'entity', ref: e };
        }
      }
    }
    return best;
  },

  getAllHostilesInRadius(room, player, cx, cy, radius, primaryTargetId = null) {
    const out = [];
    for (const e of room.entities) {
      if (!this.canDamageEntity(room, player, e, primaryTargetId)) continue;
      if (Math.hypot(e.x - cx, e.y - cy) <= radius) {
        out.push({ kind: 'entity', ref: e });
      }
    }
    const canPvpHere = room.isOverworld
      ? Boolean(ROOM_CONFIGS[player.roomType]?.pvp)
      : Boolean(room.pvp);
    if (canPvpHere || (this.duels && this.duels.hasActiveDuel(player.id))) {
      for (const other of room.players.values()) {
        if (other.isDead || other.isSpectator || this.arePlayersAllied(room, player, other)) continue;
        if (Math.hypot(other.x - cx, other.y - cy) <= radius) {
          out.push({ kind: 'player', ref: other });
        }
      }
    }
    return out;
  },

  addPlayerGlimmer(room, player, amount) {
    ensureActorFactionState(player, player.faction);
    player.solarCharge = Math.min(player.maxSolarCharge, player.solarCharge + amount);
    // Solari Faction Mechanic: Guard & Zenith! Reaching 100+ Glimmer triggers Zenith State!
    if (player.faction === 'Solari' && player.solarCharge >= 100 && player.zenithTimer <= 0) {
      player.zenithTimer = 6.0;
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '☀️ ZENITH STATE! (+25% DMG)', color: '#fde047', isCrit: true });
      for (const ally of room.players.values()) {
        if (!ally.isDead && this.arePlayersAllied(room, player, ally) && Math.hypot(ally.x - player.x, ally.y - player.y) <= 150) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 4);
        }
      }
      this.healAlliedNexus(room, player, 2);
    }
  },

  shavePlayerCooldowns(player, seconds, excludeSlot = null) {
    if (!player?.cooldowns || seconds <= 0) return;
    for (const s of ACTION_SLOTS) {
      if (s !== excludeSlot && (player.cooldowns[s] || 0) > 0) {
        player.cooldowns[s] = Math.max(0, player.cooldowns[s] - seconds);
      }
    }
  },

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
  },

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
  },

  tryInterruptEnemyCast(room, player, spec, targetId) {
    if (!room || !player || !canAbilityInterrupt(spec)) return null;
    const interruptRange = Math.max(150, ((spec.rangeYards || 8) + 4) * YARD_PX);
    let bestMob = null;
    if (targetId && !String(targetId).startsWith('p_')) {
      const explicit = room.entities.find((e) => e.id === targetId && e.type === 'mob' && !e.isDying && e.castState?.interruptible);
      if (explicit && Math.hypot(explicit.x - player.x, explicit.y - player.y) <= interruptRange) {
        bestMob = explicit;
      }
    }
    if (!bestMob) {
      let bestDist = interruptRange;
      for (const e of room.entities) {
        if (e.type !== 'mob' || e.isDying || !e.castState?.interruptible) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d <= bestDist) {
          bestDist = d;
          bestMob = e;
        }
      }
    }
    if (!bestMob) return null;

    const cast = bestMob.castState;
    bestMob.castState = null;
    bestMob.staggerTimer = Math.max(bestMob.staggerTimer || 0, INTERRUPT_VULN_DURATION_SEC);
    bestMob.freezeTimer = Math.max(bestMob.freezeTimer || 0, INTERRUPT_STUN_SEC);
    bestMob.inCombat = true;

    // Cancel any telegraphs linked to the interrupted cast!
    if (cast?.id && Array.isArray(room.groundZones)) {
      for (let i = room.groundZones.length - 1; i >= 0; i--) {
        if (room.groundZones[i].castId === cast.id) {
          room.groundZones.splice(i, 1);
        }
      }
    }

    this.addPlayerGlimmer(room, player, 18);
    this.awardProfessionXP(player, 'flashes', 35, `Interrupted ${cast?.spellName || bestMob.name}`);
    this.addMobThreat(room, bestMob, player, 40);

    room.fxQueue.push({
      kind: 'spark',
      x: bestMob.x,
      y: bestMob.y - 10,
      colors: ['#38bdf8', '#fde047', '#ffffff'],
      count: 22,
    });
    room.fxQueue.push({
      kind: 'fct',
      x: bestMob.x,
      y: bestMob.y - 22,
      text: '⚡ INTERRUPTED! (+35% VULN)',
      color: '#38bdf8',
      isCrit: true,
    });
    room.groundZones.push({
      id: `gz_${crypto.randomUUID().slice(0, 6)}`,
      type: 'shockwave',
      color: '#38bdf8',
      ownerId: player.id,
      x: bestMob.x,
      y: bestMob.y,
      radius: 42,
      age: 0,
      maxAge: 0.35,
    });
    player.send({
      type: 'sys_msg',
      category: 'combat',
      text: `⚡ [Counter-Flash] ${spec.name} interrupted ${bestMob.name}'s ${cast?.spellName || 'Cast'}! (+18 Glimmer, +35% DMG Vuln for 3s)`,
    });
    return bestMob;
  },

  handleCastAbility(room, player, slot, targetId, facingDir) {
    if (player.isDead || player.isSpectator || player.freezeTimer > 0) return;
    if (!ACTION_SLOTS.includes(slot)) return;
    if (!isSlotUnlocked(player.prog, slot)) return;
    const spec = getSlotAbilitySpec(player.loadout, slot);
    if (!spec) return;
    if ((player.cooldowns[slot] || 0) > 0.05) return;

    // Ability requirement: Unlearned spells (rank 0) or cross-class spells cannot be cast!
    if (spec.classId && spec.classId !== player.classId) return;
    const rank = getAbilityRank(player.prog, spec.id);
    if (rank < 1) return;

    // Casting a combat Rite/ability instantaneously dismounts
    if (player.mountId || player.mountCast) {
      player.mountId = null;
      player.mountCast = null;
      player.send?.({ type: 'mount_synced', mountId: null, reason: 'cast' });
    }

    if (['up', 'down', 'left', 'right'].includes(facingDir)) {
      player.dir = facingDir;
    }

    const baseEffStats = getEffectiveStats(player.prog, player.equipment, player.classId);
    const buffBonuses = getActiveCombatConsumableBonuses(player);
    const effStats = {
      power: baseEffStats.power + buffBonuses.power,
      bastion: baseEffStats.bastion + buffBonuses.bastion,
      resonance: baseEffStats.resonance + buffBonuses.resonance,
      tempo: baseEffStats.tempo + buffBonuses.tempo,
    };
    const zenithMult = player.zenithTimer > 0 ? 1.25 : 1.0;
    const effPower = Math.max(1, Math.round((effStats.power + this.getBonusPower(room, player) - (player.weakenTimer > 0 ? 2 : 0)) * zenithMult));
    const cdMult = calcCdMult(player.prog, player.equipment, player.classId, player.faction);
    const critChance = Math.min(0.95, calcCritChance(player.prog, player.equipment, player.classId) + buffBonuses.critPct);
    const isFlash = spec.tcgType.includes('Flash');
    const isRite = spec.tcgType.includes('Rite');
    const offGcd = isAbilityOffGCD(spec);
    const gcdDuration = Math.max(MIN_GCD_SEC, Math.min(BASE_GCD_SEC, BASE_GCD_SEC * cdMult));

    // Global Cooldown (GCD) + 400ms Server-Side Spell Queue Window
    if (!offGcd && ((player.gcdTimer || 0) > 0.01 || player.castState)) {
      const rem = Math.max(player.gcdTimer || 0, player.castState ? player.castState.remaining : 0);
      if (rem <= SPELL_QUEUE_WINDOW_SEC) {
        player.queuedAbility = { slot, targetId, facingDir, queuedAt: Date.now() };
      }
      return;
    }

    const getDirAngle = (dir) => {
      if (dir === 'up') return { dx: 0, dy: -1, angle: -Math.PI / 2 };
      if (dir === 'down') return { dx: 0, dy: 1, angle: Math.PI / 2 };
      if (dir === 'left') return { dx: -1, dy: 0, angle: Math.PI };
      return { dx: 1, dy: 0, angle: 0 };
    };

    if (spec.cost > 0 && player.solarCharge < spec.cost) return;

    // RITES REQUIRE CASTING TIME WHILE FLASHES ARE INSTANT (unless Chrono-Snap or Resonance Echo makes instant)!
    if (isRite && (spec.castTime || 0) > 0) {
      if (player.castState) return; // Already channeling a Rite

      const needsTarget = ['cast_beam', 'projectile', 'drain_beam', 'execute_beam', 'aurora_beam', 'shardburst', 'glacial_spike', 'fractured_timeline'].includes(spec.kind);
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

      const resGain = advanceFactionResourceOnCast(player, player.faction, player.classId, spec);
      const isInstantProcced = resGain.echoFromResonance || resGain.chronoSnapConsumed;
      const castSpeedMult = calcCastSpeedMult(player.prog) * (player.temporalApotheosisTimer > 0 ? 0.25 : 1.0);
      const effectiveCastTime = isInstantProcced ? 0 : Math.max(0.3, (spec.castTime || 1.0) * castSpeedMult);

      player.solarCharge -= spec.cost;
      player.cooldowns[slot] = spec.baseCd * cdMult;
      if (!offGcd) {
        player.gcdTotal = gcdDuration;
        player.gcdTimer = gcdDuration;
      }
      const cs = {
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
        duskMarksSpent: resGain.duskMarksSpent || 0,
        castX: player.x,
        castY: player.y,
        facingDir: player.dir,
      };
      this.awardProfessionXP(player, 'rites', Math.max(12, 10 + rank * 4), spec.name);
      if (effectiveCastTime <= 0) {
        room.fxQueue.push({
          kind: 'fct',
          x: player.x,
          y: player.y - 14,
          text: resGain.chronoSnapConsumed ? '⏳ CHRONO-SNAP INSTANT!' : '🔮 ASTRAL SURGE INSTANT!',
          color: '#38bdf8',
          isCrit: true,
        });
        this.executeAuthoritativeRite(room, player, cs);
        return;
      }
      player.castState = cs;
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
    if (spec.cost > 0) {
      player.solarCharge = Math.max(0, player.solarCharge - spec.cost);
    }
    const flashRes = advanceFactionResourceOnCast(player, player.faction, player.classId, spec);
    if (flashRes.chronoSnapTriggered) {
      this.shavePlayerCooldowns(player, getClassPassive(player.classId).flashCdShaveSec || 0.6, slot);
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 16, text: '⏳ CHRONO-SNAP READY!', color: '#7dd3fc', isCrit: true });
    }
    if (!offGcd) {
      player.gcdTotal = gcdDuration;
      player.gcdTimer = gcdDuration;
    }
    if (isFlash) {
      this.awardProfessionXP(player, 'flashes', Math.max(8, 6 + rank * 2), spec.name);
      if (canAbilityInterrupt(spec)) {
        this.tryInterruptEnemyCast(room, player, spec, targetId);
      }
    }
    const wasStealthed = player.stealthedTimer > 0;
    if (spec.kind !== 'stealth' && spec.kind !== 'stealth_burst' && spec.kind !== 'smoke_bomb') {
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
      player.slashTimer = 0.24;
      this.addPlayerGlimmer(room, player, 6);
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle, color: spec.color, actorId: player.id });

      const classPassive = getClassPassive(player.classId);
      let hitAny = false;
      const primaryId = tgt ? tgt.ref.id : targetId;
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rangePx + 10, primaryId)) {
        const eAng = Math.atan2(h.ref.y - player.y, h.ref.x - player.x);
        const diff = Math.abs(Math.atan2(Math.sin(eAng - angle), Math.cos(eAng - angle)));
        if ((tgt && h.ref === tgt.ref) || diff < 1.25) {
          let base = Math.max(2, Math.floor(Math.random() * 4) + 3 + effPower + rank * 2);
          if (wasStealthed) base = Math.round(base * 1.45);
          const isCrit = wasStealthed || Math.random() < critChance;
          let critMult = isCrit ? calcCritDamageMult(player.prog) : 1.0;
          if (isCrit && wasStealthed && classPassive.stealthCritBonus) {
            critMult += classPassive.stealthCritBonus;
          }
          const finalDmg = isCrit ? Math.round(base * critMult) : base;
          this.applyAuthoritativeDamage(room, player, h, finalDmg, isCrit, spec.name, false);
          if (wasStealthed) {
            room.fxQueue.push({ kind: 'fct', x: h.ref.x, y: h.ref.y - 12, text: 'AMBUSH!', color: '#c084fc', isCrit: true });
          }
          if (classPassive.offhandStrikeRatio) {
            const offDmg = Math.max(1, Math.round(finalDmg * classPassive.offhandStrikeRatio));
            this.applyAuthoritativeDamage(room, player, h, offDmg, false, 'Twin-Fang Offhand', false);
          }
          if (player.classId === 'forest_warden' && h.kind === 'entity' && h.ref.type === 'mob') {
            h.ref.poisonTimer = Math.max(h.ref.poisonTimer || 0, 3.0);
          }
          if (player.faction === 'Terra') {
            const owRadius = 44 + (classPassive.overwhelmRadiusBonus || 0);
            const owRatio = 0.35 + (player.rootguardStacks || 0) * 0.08;
            for (const near of this.getAllHostilesInRadius(room, player, h.ref.x, h.ref.y, owRadius)) {
              if (near.ref !== h.ref) {
                this.applyAuthoritativeDamage(room, player, near, Math.max(2, Math.round(finalDmg * owRatio)), false, 'Overwhelm', false);
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
      const shieldBonusGlimmer = getClassPassive(player.classId).shieldGlimmerBonus || 0;
      this.addPlayerGlimmer(room, player, 6 + shieldBonusGlimmer);
      const absorb = 13 + effStats.bastion * 3 + rank * 4;
      player.shield = Math.max(player.shield || 0, absorb);
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
      if (TANK_CLASSES.has(player.classId) && typeof this.addMobThreat === 'function') {
        for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 12 * YARD_PX)) {
          if (h.kind !== 'player' && h.ref?.type === 'mob') {
            this.addMobThreat(room, h.ref, player, 40 + effStats.bastion * 4, { isTaunt: true });
          }
        }
      }
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

      const safeDash = clampStepOutOfWater(
        startX,
        startY,
        player.x + dx * dashDist,
        player.y + dy * dashDist,
        room.type,
        room.halfW,
        room.halfH
      );
      player.x = safeDash.x;
      player.y = safeDash.y;
      player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;

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
      const safeStep = clampStepOutOfWater(
        startX,
        startY,
        tgt.ref.x + Math.cos(ang) * 18,
        tgt.ref.y + Math.sin(ang) * 18,
        room.type,
        room.halfW,
        room.halfH
      );
      player.x = safeStep.x;
      player.y = safeStep.y;
      player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;

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
      const safeReap = clampStepOutOfWater(startX, startY, player.x + dx * dist, player.y + dy * dist, room.type, room.halfW, room.halfH);
      player.x = safeReap.x;
      player.y = safeReap.y;
      player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;
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
      const safeRift = clampStepOutOfWater(startX, startY, player.x + dx * riftDist, player.y + dy * riftDist, room.type, room.halfW, room.halfH);
      player.x = safeRift.x;
      player.y = safeRift.y;
      player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;
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

    // 20. CLASS EXCLUSIVE FLASHES (All 8 Classes)
    player.cooldowns[slot] = spec.baseCd * cdMult;
    player.slashTimer = 0.24;

    if (spec.kind === 'aegis_slam') {
      const rangePx = (spec.rangeYards || 6.5) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      this.addPlayerGlimmer(room, player, 15);
      player.shield = Math.max(player.shield || 0, 12 + effStats.bastion * 2 + rank * 3);
      player.shieldTimer = 8;
      if (tgt) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: tgt.ref, isCrit: Math.random() < critChance });
        this.applyAuthoritativeDamage(room, player, tgt, nums.dmg, true, spec.name, false);
        if (tgt.kind === 'entity' && tgt.ref.type === 'mob') {
          tgt.ref.freezeTimer = Math.max(tgt.ref.freezeTimer || 0, 1.5);
          this.addMobThreat(room, tgt.ref, player, 60 + effStats.bastion * 6, { isTaunt: true });
        }
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '🛡️ AEGIS SLAM!', color: '#facc15', isCrit: true });
      return;
    }

    if (spec.kind === 'sunfire_lance') {
      const rangePx = (spec.rangeYards || 14) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      const startX = player.x;
      const startY = player.y;
      if (tgt) {
        const ang = Math.atan2(tgt.ref.y - player.y, tgt.ref.x - player.x);
        const safeLance = clampStepOutOfWater(startX, startY, tgt.ref.x - Math.cos(ang) * 20, tgt.ref.y - Math.sin(ang) * 20, room.type, room.halfW, room.halfH);
        player.x = safeLance.x;
        player.y = safeLance.y;
      } else {
        const { dx, dy } = getDirAngle(player.dir);
        const safeLance = clampStepOutOfWater(startX, startY, player.x + dx * 8 * YARD_PX, player.y + dy * 8 * YARD_PX, room.type, room.halfW, room.halfH);
        player.x = safeLance.x;
        player.y = safeLance.y;
      }
      player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;
      room.fxQueue.push({ kind: 'dash', actorId: player.id, fromX: startX, fromY: startY, toX: player.x, toY: player.y, dir: player.dir, color: '#fbbf24' });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 76)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref });
        if (h.kind === 'entity' && h.ref.type === 'mob') {
          const d = Math.hypot(h.ref.x - player.x, h.ref.y - player.y);
          if (d > 20) {
            h.ref.x += ((player.x - h.ref.x) / d) * 22;
            h.ref.y += ((player.y - h.ref.y) / d) * 22;
          }
          h.ref.sunbrandTimer = 4.0;
        }
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, false, spec.name, false);
      }
      return;
    }

    if (spec.kind === 'purifying_halo') {
      player.slowTimer = 0; player.snareTimer = 0; player.weakenTimer = 0;
      player.auroraStrideTimer = 4.0;
      this.addPlayerGlimmer(room, player, 12);
      for (const ally of room.players.values()) {
        if (!ally.isDead && this.arePlayersAllied(room, player, ally) && Math.hypot(ally.x - player.x, ally.y - player.y) <= 12 * YARD_PX) {
          ally.slowTimer = 0; ally.snareTimer = 0; ally.weakenTimer = 0;
          ally.auroraStrideTimer = 4.0;
          ally.hp = Math.min(ally.maxHp, ally.hp + 6 + rank * 2);
          room.fxQueue.push({ kind: 'fct', x: ally.x, y: ally.y - 10, text: '💫 PURIFIED (+30% SPD)', color: '#bae6fd' });
        }
      }
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    if (spec.kind === 'serrated_mutilate' || spec.kind === 'crimson_rupture') {
      const rangePx = (spec.rangeYards || 7) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      const { angle } = getDirAngle(player.dir);
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle, color: spec.color, actorId: player.id });
      if (!tgt) return;
      const marks = flashRes.duskMarksSpent || 0;
      const isCrit = wasStealthed || Math.random() < critChance;
      const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: tgt.ref, isCrit, duskMarksSpent: marks });
      const totalDmg = spec.kind === 'crimson_rupture' ? Math.round(nums.dmg * (1 + marks * 0.25)) : nums.dmg;
      this.applyAuthoritativeDamage(room, player, tgt, totalDmg, isCrit, spec.name, false);
      if (spec.kind === 'serrated_mutilate') {
        this.applyAuthoritativeDamage(room, player, tgt, Math.max(2, Math.round(totalDmg * 0.55)), false, `${spec.name} (Offhand)`, false);
      }
      if (tgt.kind === 'entity' && tgt.ref.type === 'mob') {
        tgt.ref.bleedTimer = spec.kind === 'crimson_rupture' ? 8.0 : 4.0;
      }
      if (spec.kind === 'crimson_rupture' && marks > 0) {
        room.fxQueue.push({ kind: 'fct', x: tgt.ref.x, y: tgt.ref.y - 16, text: `🩸 ${marks}x RUPTURE!`, color: '#f43f5e', isCrit: true });
      }
      return;
    }

    if (spec.kind === 'smoke_bomb') {
      player.stealthedTimer = 3.5;
      room.groundZones.push({
        id: `gz_${crypto.randomUUID().slice(0, 6)}`,
        type: 'plague',
        color: '#a855f7',
        spellName: spec.name,
        ownerId: player.id,
        x: player.x,
        y: player.y,
        radius: 8 * YARD_PX,
        tickDmg: Math.max(2, 2 + rank),
        age: 0,
        maxAge: 6.0,
        tickTimer: 0.4,
      });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 8 * YARD_PX)) {
        h.ref.weakenTimer = 4.0;
      }
      room.fxQueue.push({ kind: 'smoke', x: player.x, y: player.y, count: 24 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '💨 UMBRAL SMOKE BOMB!', color: '#c084fc', isCrit: true });
      return;
    }

    if (spec.kind === 'phantom_sever') {
      const targets = this.getAllHostilesInRadius(room, player, player.x, player.y, 14 * YARD_PX).slice(0, 5);
      const startX = player.x;
      const startY = player.y;
      for (const h of targets) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true });
        room.fxQueue.push({ kind: 'dash', actorId: player.id, fromX: startX, fromY: startY, toX: h.ref.x, toY: h.ref.y, dir: player.dir, color: '#c084fc' });
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, false);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🌑 PHANTOM SEVER!', color: '#c084fc', isCrit: true });
      return;
    }

    if (spec.kind === 'hex_of_frailty') {
      const rangePx = (spec.rangeYards || 20) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      if (!tgt) return;
      for (const h of this.getAllHostilesInRadius(room, player, tgt.ref.x, tgt.ref.y, 56)) {
        h.ref.hexedTimer = 8.0;
        h.ref.weakenTimer = 8.0;
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref });
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, false, spec.name, false);
      }
      room.fxQueue.push({ kind: 'fct', x: tgt.ref.x, y: tgt.ref.y - 14, text: '🧿 HEXED (-20% ATK / +20% RITE)', color: '#c084fc', isCrit: true });
      return;
    }

    if (spec.kind === 'gale_spear') {
      const { dx, dy, angle } = getDirAngle(player.dir);
      const startX = player.x;
      const startY = player.y;
      const safeSpear = clampStepOutOfWater(startX, startY, player.x + dx * 8 * YARD_PX, player.y + dy * 8 * YARD_PX, room.type, room.halfW, room.halfH);
      player.x = safeSpear.x;
      player.y = safeSpear.y;
      player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;
      room.fxQueue.push({ kind: 'dash', actorId: player.id, fromX: startX, fromY: startY, toX: player.x, toY: player.y, dir: player.dir, color: '#4ade80' });
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle, color: '#4ade80', actorId: player.id });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 72)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: Math.random() < critChance });
        if (h.kind === 'entity' && h.ref.type === 'mob') h.ref.poisonTimer = 4.5;
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, false);
      }
      return;
    }

    if (spec.kind === 'pack_hunt') {
      player.auroraStrideTimer = 4.0;
      this.addPlayerGlimmer(room, player, 20);
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#86efac', ownerId: player.id, x: player.x, y: player.y, radius: 10 * YARD_PX, age: 0, maxAge: 0.4 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 10 * YARD_PX)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true });
        if (h.kind === 'entity' && h.ref.type === 'mob') h.ref.bleedTimer = 4.0;
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, false);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '🐺 PACK HUNT (+35% SPD)!', color: '#86efac', isCrit: true });
      return;
    }

    if (spec.kind === 'seismic_taunt') {
      const rad = 12 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#4ade80', ownerId: player.id, x: player.x, y: player.y, radius: rad, age: 0, maxAge: 0.45 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref });
        h.ref.weakenTimer = 5.0;
        if (h.kind === 'entity' && h.ref.type === 'mob') {
          this.addMobThreat(room, h.ref, player, 70 + effStats.bastion * 6, { isTaunt: true });
        }
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, false, spec.name, false);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '🪨 SEISMIC TAUNT!', color: '#4ade80', isCrit: true });
      return;
    }

    if (spec.kind === 'temporal_anchor') {
      if ((player.anchorTimer || 0) > 0 && player.anchorState) {
        const fromX = player.x;
        const fromY = player.y;
        player.x = player.anchorState.x;
        player.y = player.anchorState.y;
        player.posOverrideSeq = (player.posOverrideSeq || 0) + 1;
        const healHp = Math.max(8, Math.round(player.maxHp * 0.30));
        player.hp = Math.min(player.maxHp, player.hp + healHp);
        player.anchorTimer = 0;
        player.anchorState = null;
        this.shavePlayerCooldowns(player, 4.0, slot);
        room.fxQueue.push({ kind: 'dash', actorId: player.id, fromX, fromY, toX: player.x, toY: player.y, dir: player.dir, color: '#38bdf8' });
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: `⚓ RECALLED (+${healHp} HP)!`, color: '#7dd3fc', isCrit: true });
        this.parties.syncPlayerVitals(player.id);
      } else {
        player.anchorState = { x: player.x, y: player.y };
        player.anchorTimer = 6.0;
        player.cooldowns[slot] = 0.8; // Quick recall window!
        room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 6, colors: ['#38bdf8', '#ffffff'], count: 14 });
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '⚓ TIME ANCHOR SET (6s)', color: '#38bdf8' });
      }
      return;
    }

    if (spec.kind === 'echoing_paradox') {
      const rangePx = (spec.rangeYards || 22) * YARD_PX;
      const tgt = this.findHostileTargetById(room, player, targetId) || this.findNearestHostile(room, player, rangePx);
      player.echoPrimed = true;
      this.shavePlayerCooldowns(player, 2.0, slot);
      if (tgt) {
        room.fxQueue.push({ kind: 'skyBeam', x: tgt.ref.x, y: tgt.ref.y, color: '#e0f2fe' });
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: tgt.ref, isCrit: true });
        this.applyAuthoritativeDamage(room, player, tgt, nums.dmg, true, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '🪞 PARADOX (-2s CD & ECHO)!', color: '#e0f2fe', isCrit: true });
      return;
    }

    if (spec.kind === 'arcane_tether') {
      const rad = (spec.rangeYards || 18) * YARD_PX;
      this.addPlayerGlimmer(room, player, 25);
      const targets = this.getAllHostilesInRadius(room, player, player.x, player.y, rad).slice(0, 4);
      for (const h of targets) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref });
        if (h.kind === 'entity' && h.ref.type === 'mob') h.ref.freezeTimer = Math.max(h.ref.freezeTimer || 0, 1.5);
        room.fxQueue.push({ kind: 'spark', x: h.ref.x, y: h.ref.y - 6, colors: ['#38bdf8', '#ffffff'], count: 10 });
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, false, spec.name, false);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: '⚡ ARCANE TETHER (+25 GLIMMER)!', color: '#38bdf8', isCrit: true });
      return;
    }
  },
};
