// ==========================================
// RoomManager — Authoritative TCG Rites Execution & Damage Resolution
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

export const combatRitesAndDamageMethods = {
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
  },

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

      if (attackerPlayer && t.type === 'dummy' && t.hp > 0 && !t.noHitXp) {
        this.awardPlayerXP(attackerPlayer, 8, '');
        attackerPlayer.questState = attackerPlayer.questState || {};
        attackerPlayer.questState.combatTrainingHits = (attackerPlayer.questState.combatTrainingHits || 0) + 1;
        if (attackerPlayer.questState.combatTrainingHits % 5 === 0) {
          this.awardProfessionXP(attackerPlayer, 'combat_mastery', 15, '');
        }
        this.accounts.saveQuestState(attackerPlayer.id, attackerPlayer.questState);
      }

      // The Titan trial needs to register online as well as in the offline damage path.
      if (attackerPlayer && t.name && t.name.includes('Aurelius')) {
        attackerPlayer.questState = attackerPlayer.questState || {};
        if (!attackerPlayer.questState.titanChallenged) {
          attackerPlayer.questState.titanChallenged = true;
          this.accounts.saveQuestState(attackerPlayer.id, attackerPlayer.questState);
          this.refreshClientFromAccount(attackerPlayer.id);
        }
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
  },

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
      for (const ent of room.entities) {
        if (ent.type === 'mob') {
          if (ent.dammers) ent.dammers.delete(targetPlayer.id);
          if (ent.targetPlayerId === targetPlayer.id) {
            ent.targetPlayerId = null;
            ent.inCombat = false;
          }
        }
      }
      room.fxQueue.push({ kind: 'smoke', x: targetPlayer.x, y: targetPlayer.y, count: 32, isDeath: true });
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y, text: 'FALLEN', color: '#ef4444', isCrit: true });
      this.broadcastToRoom(room, {
        type: 'sys_msg',
        category: 'combat',
        text: `[Combat] ${targetPlayer.displayName} was cast into the Fall by ${attackerName}!`,
      });
    }
  },
};
