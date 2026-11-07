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
    if (ent && this.canDamageEntity(room, player, ent)) {
      return { kind: 'entity', ref: ent };
    }
    return null;
  },

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
  },

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
  },

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
      this.awardProfessionXP(player, 'rites', Math.max(12, 10 + rank * 4), spec.name);
      return;
    }

    // FLASHES EXECUTE INSTANTLY (castTime === 0)
    if (isFlash) {
      this.awardProfessionXP(player, 'flashes', Math.max(8, 6 + rank * 2), spec.name);
    }
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
  },
};
