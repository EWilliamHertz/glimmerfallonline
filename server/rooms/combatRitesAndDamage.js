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
  TANK_THREAT_MULT,
  HEAL_THREAT_MULT,
  TAUNT_DURATION_SEC,
  TANK_CLASSES,
  INTERRUPT_VULN_MULT,
  getActiveCombatConsumableBonuses,
  resolveAbilityNumbers,
  getClassPassive,
  computeDevotionModifiers,
  doesMobMatchSlayerTask,
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
    const duskMarksSpent = cs.duskMarksSpent || 0;
    const duskMult = duskMarksSpent > 0 ? (1 + duskMarksSpent * 0.15) : 1.0;
    player.activeDuskMarksSpent = duskMarksSpent;

    // 1. BEAM RITE (Solar Flare, Astral Convergence)
    if (spec.kind === 'cast_beam') {
      const tgt = this.findHostileTargetById(room, player, cs.targetId);
      if (tgt) {
        room.fxQueue.push({ kind: 'skyBeam', x: tgt.ref.x, y: tgt.ref.y, color: cs.color });
        const isCrit = Math.random() < critChance || player.stealthedTimer > 0;
        const baseDmg = Math.max(5, Math.round((Math.floor(Math.random() * 5) + 10 + effPower * 2 + rank * 3) * duskMult));
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
      // Heals generate 0.5x threat on all engaged mobs in combat
      for (const ent of room.entities) {
        if (ent.type === 'mob' && ent.inCombat && !ent.isDying) {
          this.addMobThreat(room, ent, player, rewindHp, { isHeal: true });
        }
      }
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
      // Heals generate 0.5x threat on all engaged mobs in combat
      for (const ent of room.entities) {
        if (ent.type === 'mob' && ent.inCombat && !ent.isDying) {
          this.addMobThreat(room, ent, player, rewindHp, { isHeal: true });
        }
      }
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

    // 14. CLASS EXCLUSIVE RITES (All 8 Classes)
    const effStats = { power: effPower, bastion: effBastion, resonance: effResonance, tempo: 2 };
    const tgtWrap = cs.targetId ? this.findHostileTargetById(room, player, cs.targetId) : null;
    const tgtNums = resolveAbilityNumbers({
      spec,
      rank,
      effStats,
      prog: player.prog,
      actor: player,
      target: tgtWrap?.ref || null,
      isCrit: Math.random() < critChance,
      duskMarksSpent,
      isHexed: Boolean(tgtWrap?.ref?.hexedTimer > 0),
      isFrozen: Boolean(tgtWrap?.ref?.freezeTimer > 0),
    });

    if (spec.kind === 'bastion_banner') {
      player.bastionBannerTimer = 8.0;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'consecration', color: '#facc15', spellName: spec.name, ownerId: player.id, x: player.x, y: player.y, radius: 12 * YARD_PX, tickDmg: 3 + rank, age: 0, maxAge: 8.0, tickTimer: 0.4 });
      for (const ally of room.players.values()) {
        if (!ally.isDead && this.arePlayersAllied(room, player, ally) && Math.hypot(ally.x - player.x, ally.y - player.y) <= 12 * YARD_PX) {
          ally.bastionBannerTimer = 8.0;
        }
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🚩 BASTION BANNER (+25% DR)!', color: '#facc15', isCrit: true });
      return;
    }

    if (spec.kind === 'judgement_verdict') {
      const cx = tgtWrap ? tgtWrap.ref.x : player.x;
      const cy = tgtWrap ? tgtWrap.ref.y : player.y;
      room.fxQueue.push({ kind: 'skyBeam', x: cx, y: cy, color: '#fef08a' });
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#facc15', ownerId: player.id, x: cx, y: cy, radius: 12 * YARD_PX, age: 0, maxAge: 0.5 });
      for (const h of this.getAllHostilesInRadius(room, player, cx, cy, 12 * YARD_PX)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true, duskMarksSpent });
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: cx, y: cy - 16, text: '⚖️ JUDGEMENT VERDICT!', color: '#fef08a', isCrit: true });
      return;
    }

    if (spec.kind === 'starlight_mend' || spec.kind === 'solaris_apotheosis') {
      const healVal = Math.round(tgtNums.heal * (spec.kind === 'solaris_apotheosis' ? 1.6 : 1.0));
      const beforeSelf = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + healVal);
      const selfOverheal = Math.max(0, (beforeSelf + healVal) - player.maxHp);
      const classPassive = getClassPassive(player.classId);
      if (selfOverheal > 0 && classPassive.overhealToShieldRatio) {
        player.shield = Math.min(player.maxHp, (player.shield || 0) + Math.round(selfOverheal * classPassive.overhealToShieldRatio));
        player.shieldTimer = 8;
      }
      if (spec.kind === 'solaris_apotheosis') {
        player.solarisDomeTimer = 6.0;
        room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'consecration', color: '#fde047', spellName: spec.name, ownerId: player.id, x: player.x, y: player.y, radius: 14 * YARD_PX, tickDmg: 5 + rank, age: 0, maxAge: 6.0, tickTimer: 0.4 });
        this.healAlliedNexus(room, player, 4);
      }
      const allies = Array.from(room.players.values())
        .filter((a) => !a.isDead && this.arePlayersAllied(room, player, a) && Math.hypot(a.x - player.x, a.y - player.y) <= (spec.rangeYards || 16) * YARD_PX)
        .sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)));
      for (const ally of (spec.kind === 'starlight_mend' ? allies.slice(0, 2) : allies)) {
        if (ally.id === player.id) continue;
        const bHp = ally.hp;
        ally.hp = Math.min(ally.maxHp, ally.hp + healVal);
        const ov = Math.max(0, (bHp + healVal) - ally.maxHp);
        if (ov > 0 && classPassive.overhealToShieldRatio) {
          ally.shield = Math.min(ally.maxHp, (ally.shield || 0) + Math.round(ov * classPassive.overhealToShieldRatio));
          ally.shieldTimer = 8;
        }
        if (spec.kind === 'solaris_apotheosis') ally.solarisDomeTimer = 6.0;
        room.fxQueue.push({ kind: 'fct', x: ally.x, y: ally.y - 10, text: `+${healVal} DAWN MEND`, color: '#4ade80' });
        this.parties.syncPlayerVitals(ally.id);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: spec.kind === 'solaris_apotheosis' ? '🌞 SOLARIS APOTHEOSIS!' : `+${healVal} STARLIGHT MEND`, color: '#fde047', isCrit: true });
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    if (spec.kind === 'aurora_beam') {
      if (tgtWrap) {
        room.fxQueue.push({ kind: 'skyBeam', x: tgtWrap.ref.x, y: tgtWrap.ref.y, color: '#fef08a' });
        this.applyAuthoritativeDamage(room, player, tgtWrap, tgtNums.dmg, true, spec.name, true);
      }
      for (const ally of room.players.values()) {
        if (!ally.isDead && this.arePlayersAllied(room, player, ally) && Math.hypot(ally.x - player.x, ally.y - player.y) <= 16 * YARD_PX) {
          ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(tgtNums.heal * 0.65));
          this.parties.syncPlayerVitals(ally.id);
        }
      }
      return;
    }

    if (spec.kind === 'shardburst') {
      if (tgtWrap) {
        for (let s = 0; s < 3; s++) {
          setTimeout(() => {
            if (!this.rooms.has(room.id) || player.isDead) return;
            room.projectiles.push({
              id: `prj_${crypto.randomUUID().slice(0, 6)}`,
              type: 'void_orb',
              spellName: spec.name,
              isRite: true,
              color: '#e879f9',
              ownerId: player.id,
              x: player.x + (s - 1) * 6,
              y: player.y - 8,
              targetKey: tgtWrap.kind === 'player' ? `p_${tgtWrap.ref.id}` : tgtWrap.ref.id,
              speed: 255,
              rot: 0,
              dmg: Math.max(4, Math.round(tgtNums.dmg * 0.45)),
            });
          }, s * 110);
        }
        const leechHeal = Math.max(3, Math.round(tgtNums.dmg * 0.45));
        player.hp = Math.min(player.maxHp, player.hp + leechHeal);
        this.parties.syncPlayerVitals(player.id);
      }
      return;
    }

    if (spec.kind === 'soul_covenant') {
      const hpCost = Math.min(Math.max(1, player.hp - 1), Math.round(player.hp * 0.12));
      player.hp = Math.max(1, player.hp - hpCost);
      this.addPlayerGlimmer(room, player, 45);
      player.shield = Math.min(Math.round(player.maxHp * 0.30), (player.shield || 0) + 28 + rank * 5);
      player.shieldTimer = 10;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#e11d48', ownerId: player.id, x: player.x, y: player.y, radius: 10 * YARD_PX, age: 0, maxAge: 0.45 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, 10 * YARD_PX)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true, duskMarksSpent, isHexed: Boolean(h.ref.hexedTimer > 0) });
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🩸 SOUL COVENANT (+45 GLIMMER)!', color: '#e11d48', isCrit: true });
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    if (spec.kind === 'harbingers_requiem') {
      const rad = 14 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'plague', color: '#a855f7', spellName: spec.name, ownerId: player.id, x: player.x, y: player.y, radius: rad, tickDmg: 4 + rank, age: 0, maxAge: 3.0, tickTimer: 0.4 });
      let totalDrained = 0;
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true, duskMarksSpent, isHexed: Boolean(h.ref.hexedTimer > 0) });
        h.ref.slowTimer = 4.0;
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, true);
        totalDrained += nums.dmg;
      }
      if (totalDrained > 0) {
        const healVal = Math.max(4, Math.round(totalDrained * 0.35));
        player.hp = Math.min(player.maxHp, player.hp + healVal);
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: `💀 REQUIEM +${healVal} HP`, color: '#4ade80', isCrit: true });
        this.parties.syncPlayerVitals(player.id);
      }
      return;
    }

    if (spec.kind === 'spore_volley') {
      const rad = 12 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'briar', color: '#a3e635', spellName: spec.name, ownerId: player.id, x: player.x, y: player.y, radius: rad, tickDmg: 3 + rank, age: 0, maxAge: 5.0, tickTimer: 0.4 });
      player.hp = Math.min(player.maxHp, player.hp + Math.round(tgtNums.heal * 0.5));
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        if (h.kind === 'entity' && h.ref.type === 'mob') h.ref.poisonTimer = 6.0;
        this.applyAuthoritativeDamage(room, player, h, tgtNums.dmg, false, spec.name, true);
      }
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    if (spec.kind === 'tempest_thorns') {
      const rad = 14 * YARD_PX;
      room.fxQueue.push({ kind: 'slash', x: player.x, y: player.y - 6, angle: 0, color: '#22c55e', actorId: player.id });
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#22c55e', ownerId: player.id, x: player.x, y: player.y, radius: rad, age: 0, maxAge: 0.55 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true });
        if (h.kind === 'entity' && h.ref.type === 'mob') h.ref.bleedTimer = 5.0;
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🌪️ TEMPEST OF THORNS!', color: '#4ade80', isCrit: true });
      return;
    }

    if (spec.kind === 'monolith_wall') {
      const shieldVal = 30 + effBastion * 4 + rank * 6;
      player.shield = Math.max(player.shield || 0, shieldVal);
      player.shieldTimer = 10;
      player.thornbarkTimer = 7.0;
      player.rootedBastionTimer = 4.0;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#84cc16', ownerId: player.id, x: player.x, y: player.y, radius: 10 * YARD_PX, age: 0, maxAge: 0.45 });
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: `🗿 MONOLITH (+${shieldVal} SHIELD)!`, color: '#84cc16', isCrit: true });
      this.parties.syncPlayerVitals(player.id);
      return;
    }

    if (spec.kind === 'earthen_grasp') {
      const rad = 11 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'briar', color: '#16a34a', spellName: spec.name, ownerId: player.id, x: player.x, y: player.y, radius: rad, tickDmg: 3 + rank, age: 0, maxAge: 4.0, tickTimer: 0.5 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        if (h.kind === 'entity' && h.ref.type === 'mob') {
          const d = Math.hypot(player.x - h.ref.x, player.y - h.ref.y);
          if (d > 22) {
            h.ref.x += ((player.x - h.ref.x) / d) * Math.min(d - 18, 48);
            h.ref.y += ((player.y - h.ref.y) / d) * Math.min(d - 18, 48);
          }
          h.ref.freezeTimer = 2.0;
          h.ref.snareTimer = 3.5;
          this.addMobThreat(room, h.ref, player, 50 + effBastion * 4, { isTaunt: true });
        }
        this.applyAuthoritativeDamage(room, player, h, tgtNums.dmg, false, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🌿 EARTHEN GRASP!', color: '#4ade80', isCrit: true });
      return;
    }

    if (spec.kind === 'tectonic_cataclysm') {
      const rad = 15 * YARD_PX;
      player.shield = Math.max(player.shield || 0, 120 + effBastion * 4);
      player.shieldTimer = 10;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#22c55e', ownerId: player.id, x: player.x, y: player.y, radius: rad, age: 0, maxAge: 0.65 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true });
        if (h.kind === 'entity' && h.ref.type === 'mob') h.ref.freezeTimer = 2.5;
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🌋 TECTONIC CATACLYSM!', color: '#4ade80', isCrit: true });
      return;
    }

    if (spec.kind === 'fractured_timeline') {
      const tgt = tgtWrap || this.findNearestHostile(room, player, 20 * YARD_PX);
      if (tgt) {
        for (let k = 0; k < 3; k++) {
          setTimeout(() => {
            if (!this.rooms.has(room.id) || player.isDead) return;
            if (tgt.kind === 'entity' && (tgt.ref.isDying || tgt.ref.hp <= 0)) return;
            room.fxQueue.push({ kind: 'skyBeam', x: tgt.ref.x, y: tgt.ref.y, color: '#38bdf8' });
            this.applyAuthoritativeDamage(room, player, tgt, Math.max(6, Math.round(tgtNums.dmg * 0.42)), k === 2, `${spec.name}${k > 0 ? ' (Echo)' : ''}`, k === 0);
          }, k * 180);
        }
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '🕰️ FRACTURED TIMELINE!', color: '#38bdf8', isCrit: true });
      return;
    }

    if (spec.kind === 'glacial_spike') {
      if (tgtWrap) {
        room.fxQueue.push({ kind: 'skyBeam', x: tgtWrap.ref.x, y: tgtWrap.ref.y, color: '#bae6fd' });
        if (tgtWrap.kind === 'entity' && tgtWrap.ref.type === 'mob') {
          tgtWrap.ref.freezeTimer = 2.2;
        }
        this.applyAuthoritativeDamage(room, player, tgtWrap, tgtNums.dmg, true, spec.name, true);
      }
      return;
    }

    if (spec.kind === 'meteor_constellation') {
      const cx = tgtWrap ? tgtWrap.ref.x : player.x;
      const cy = tgtWrap ? tgtWrap.ref.y : player.y;
      for (let m = 0; m < 3; m++) {
        setTimeout(() => {
          if (!this.rooms.has(room.id) || player.isDead) return;
          const ox = cx + (m - 1) * 26;
          const oy = cy + (m % 2 === 0 ? -12 : 14);
          room.fxQueue.push({ kind: 'skyBeam', x: ox, y: oy, color: '#7dd3fc' });
          room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'shockwave', color: '#38bdf8', ownerId: player.id, x: ox, y: oy, radius: 64, age: 0, maxAge: 0.4 });
          for (const h of this.getAllHostilesInRadius(room, player, ox, oy, 72)) {
            const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true, isFrozen: Boolean(h.ref.freezeTimer > 0) });
            this.applyAuthoritativeDamage(room, player, h, Math.max(5, Math.round(nums.dmg * 0.55)), true, spec.name, m === 0);
          }
        }, m * 240);
      }
      return;
    }

    if (spec.kind === 'astral_supernova') {
      const rad = 15 * YARD_PX;
      room.groundZones.push({ id: `gz_${crypto.randomUUID().slice(0, 6)}`, type: 'frost_ring', color: '#e0f2fe', ownerId: player.id, x: player.x, y: player.y, radius: rad, age: 0, maxAge: 0.65 });
      for (const h of this.getAllHostilesInRadius(room, player, player.x, player.y, rad)) {
        if (h.kind === 'entity' && h.ref.type === 'mob') {
          const d = Math.hypot(player.x - h.ref.x, player.y - h.ref.y);
          if (d > 16) {
            h.ref.x += ((player.x - h.ref.x) / d) * 32;
            h.ref.y += ((player.y - h.ref.y) / d) * 32;
          }
          h.ref.freezeTimer = 2.5;
        }
        const nums = resolveAbilityNumbers({ spec, rank, effStats, prog: player.prog, actor: player, target: h.ref, isCrit: true, isFrozen: true });
        this.applyAuthoritativeDamage(room, player, h, nums.dmg, true, spec.name, true);
      }
      room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 14, text: '✨ ASTRAL SUPERNOVA!', color: '#e0f2fe', isCrit: true });
      return;
    }
  },

  addMobThreat(room, mob, player, rawAmount, { isTaunt = false, isHeal = false } = {}) {
    if (!mob || mob.type !== 'mob' || mob.isDying || !player) return;
    if (!mob.threatTable) mob.threatTable = {};
    const mult = isHeal ? HEAL_THREAT_MULT : (TANK_CLASSES.has(player.classId) ? TANK_THREAT_MULT : 1.0);
    const added = Math.max(1, Math.round(rawAmount * mult));

    if (isTaunt) {
      let maxThreat = 0;
      for (const val of Object.values(mob.threatTable)) {
        if (val > maxThreat) maxThreat = val;
      }
      mob.threatTable[player.id] = Math.max(Math.round(maxThreat * 1.1) + added, (mob.threatTable[player.id] || 0) + added);
      mob.tauntTargetId = player.id;
      mob.tauntTimer = TAUNT_DURATION_SEC;
      mob.inCombat = true;
      mob.targetPlayerId = player.id;
      room?.fxQueue?.push({ kind: 'fct', x: mob.x, y: mob.y - 16, text: 'TAUNTED!', color: '#facc15', isCrit: true });
    } else {
      mob.threatTable[player.id] = (mob.threatTable[player.id] || 0) + added;
    }
  },

  applyAuthoritativeDamage(room, attackerPlayer, targetWrap, dmg, isCrit, spellName, isRite = false) {
    if (attackerPlayer?.activeDevotions?.length) {
      const devMods = computeDevotionModifiers(attackerPlayer.activeDevotions);
      if (devMods.dmgMult > 1) dmg = Math.max(1, Math.round(dmg * devMods.dmgMult));
    }
    if (
      attackerPlayer?.equipment?.head === 'slayer_helm' &&
      targetWrap.kind === 'entity' &&
      doesMobMatchSlayerTask(attackerPlayer.prog?.slayer?.task, targetWrap.ref?.name)
    ) {
      dmg = Math.max(1, Math.round(dmg * 1.15));
    }
    const t = targetWrap.ref;
    if (targetWrap.kind === 'player') {
      this.damagePlayerSession(room, t, dmg, attackerPlayer ? attackerPlayer.displayName : spellName, isCrit, attackerPlayer, isRite);
    } else {
      if (!t || t.isDying) return;
      if ((t.staggerTimer || 0) > 0) {
        dmg = Math.max(1, Math.round(dmg * INTERRUPT_VULN_MULT));
      }
      t.hp = Math.max(0, t.hp - dmg);
      t.hitFlash = 0.14;
      if (t.type === 'mob') {
        if (attackerPlayer) {
          if (!t.provokedBy) t.provokedBy = new Set();
          t.provokedBy.add(attackerPlayer.id);
        }
        if (!t.inCombat) {
          room.fxQueue.push({ kind: 'fct', x: t.x, y: t.y - 12, text: 'AGGRO!', color: '#ef4444' });
        }
        t.inCombat = true;
        if (attackerPlayer) {
          this.addMobThreat(room, t, attackerPlayer, dmg);
        }
      }
      if (attackerPlayer && t.dammers) t.dammers.add(attackerPlayer.id);

      room.fxQueue.push({
        kind: 'hit',
        x: t.x,
        y: t.y,
        dmg,
        isCrit,
        targetId: t.id,
        attackerX: attackerPlayer ? attackerPlayer.x : undefined,
        attackerY: attackerPlayer ? attackerPlayer.y : undefined,
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

    // Solari Passive & Paragon: Sunbrand +4 Solar Charge & Holy Radiance Burst on critical strike!
    if (attackerPlayer && isCrit) {
      if (attackerPlayer.faction === 'Solari' && t) {
        t.sunbrandTimer = Math.max(t.sunbrandTimer || 0, 4.0);
        this.addPlayerGlimmer(room, attackerPlayer, 4);
      }
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

    // Umbri Paragon + Dusk Marks + Graveglass Sepulcher Conduit + Weapon Imbue Crit Leech!
    if (attackerPlayer && !attackerPlayer.isDead) {
      const imbueLeech = isCrit ? getActiveCombatConsumableBonuses(attackerPlayer).critLeechPct : 0;
      const duskBonusLeech = isRite ? (attackerPlayer.activeDuskMarksSpent || 0) * 0.06 : 0;
      const leechPct = calcLifeLeechPct(attackerPlayer.prog, attackerPlayer.faction) * (attackerPlayer.voidformTimer > 0 ? 2 : 1) + imbueLeech + duskBonusLeech;
      if (leechPct > 0) {
        const leech = Math.max(1, Math.round(dmg * leechPct));
        const overheal = (attackerPlayer.hp + leech) - attackerPlayer.maxHp;
        attackerPlayer.hp = Math.min(attackerPlayer.maxHp, attackerPlayer.hp + leech);
        if (overheal > 0 && attackerPlayer.classId === 'graveglass_oracle') {
          const cap = Math.round(attackerPlayer.maxHp * (getClassPassive('graveglass_oracle').phylacteryCapRatio || 0.30));
          attackerPlayer.shield = Math.min(cap, (attackerPlayer.shield || 0) + overheal);
          attackerPlayer.shieldTimer = Math.max(attackerPlayer.shieldTimer || 0, 8.0);
        }
        this.parties.syncPlayerVitals(attackerPlayer.id);
      }
    }

    // Nexus Weaver Class Passive: Prismatic Shatter Starburst against chilled/frozen foes!
    if (
      attackerPlayer &&
      attackerPlayer.classId === 'nexus_weaver' &&
      isRite &&
      !String(spellName).includes('Shatter') &&
      t &&
      ((t.freezeTimer || 0) > 0 || (t.slowTimer || 0) > 0 || (t.snareTimer || 0) > 0)
    ) {
      const shatterDmg = Math.max(4, Math.round(dmg * 0.45));
      room.fxQueue.push({ kind: 'spark', x: t.x, y: t.y, colors: ['#38bdf8', '#e0f2fe', '#c084fc'], count: 16 });
      room.fxQueue.push({ kind: 'fct', x: t.x, y: t.y - 18, text: `✨ PRISMATIC SHATTER +${shatterDmg}!`, color: '#7dd3fc', isCrit: true });
      for (const nearby of this.getAllHostilesInRadius(room, attackerPlayer, t.x, t.y, 64)) {
        this.applyAuthoritativeDamage(room, attackerPlayer, nearby, shatterDmg, true, 'Prismatic Shatter', false);
      }
    }

    // Aether Faction Mechanic: Spell Echo!
    if (attackerPlayer && isRite && !String(spellName).includes('Echo')) {
      this.triggerSpellEchoIfEligible(room, attackerPlayer, targetWrap, dmg, spellName);
    }
  },

  damagePlayerSession(room, targetPlayer, amount, attackerName, isCrit = false, attackerRef = null, isRite = false) {
    if (targetPlayer.isDead || targetPlayer.hp <= 0) return;

    // Covenant Devotions: Ward of Steel (-35% Melee) & Astral Aegis (-35% Rite/Spell)
    if (targetPlayer.activeDevotions?.length) {
      const devMods = computeDevotionModifiers(targetPlayer.activeDevotions);
      const isSpellOrZone = Boolean(isRite || (!attackerRef && attackerName));
      const prayerDr = isSpellOrZone ? (devMods.riteDr || 0) : (devMods.meleeDr || 0);
      if (prayerDr > 0) {
        amount = Math.max(1, Math.round(amount * (1 - prayerDr)));
      }
    }

    // Umbri Paragon: Dodge Chance!
    const dodgeChance = targetPlayer.abyssalShroudTimer > 0 ? 1.0 : calcDodgeChance(targetPlayer.prog);
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y - 12, text: '💨 DODGE!', color: '#c084fc', isCrit: true });
      return;
    }

    // Terra Faction Mechanic: Hits taken build Rootguard stacks
    if (targetPlayer.faction === 'Terra') {
      targetPlayer.rootguardStacks = Math.min(5, (targetPlayer.rootguardStacks || 0) + 1);
    }

    // Terra Paragon, Rootguard & Bastion Banner: Damage Reduction!
    const rootguardDr = targetPlayer.faction === 'Terra' ? (targetPlayer.rootguardStacks || 0) * 0.06 : 0;
    const bannerDr = targetPlayer.bastionBannerTimer > 0 ? 0.25 : 0;
    const dmgRedPct = calcDamageReduction(targetPlayer.prog) + (targetPlayer.rootedBastionTimer > 0 ? 0.40 : 0) + rootguardDr + bannerDr;
    if (dmgRedPct > 0) {
      amount = Math.max(1, Math.round(amount * (1 - Math.min(0.75, dmgRedPct))));
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

    // Terra Faction & Stonekin Elder Mechanic: Thornbark damage reflection!
    const reflectPct = targetPlayer.thornbarkTimer > 0 ? (targetPlayer.treantFormTimer > 0 ? 0.60 : 0.35) : targetPlayer.faction === 'Terra' ? 0.15 : 0;
    if (reflectPct > 0 && attackerRef) {
      const stonekinBonus = targetPlayer.classId === 'stonekin_elder'
        ? Math.max(1, Math.round((getEffectiveStats(targetPlayer.prog, targetPlayer.equipment, targetPlayer.faction, targetPlayer.classId).bastion || 2) * (getClassPassive('stonekin_elder').bastionThornBonus || 0.2)))
        : 0;
      const refl = Math.max(1, Math.round(amount * reflectPct) + stonekinBonus);
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

    const isDueling = this.duels && this.duels.hasActiveDuel(targetPlayer.id);

    if (rem > 0) {
      if ((targetPlayer.solarisDomeTimer || 0) > 0 && targetPlayer.hp - rem <= 1) {
        targetPlayer.hp = 1;
        room.fxQueue.push({ kind: 'fct', x: targetPlayer.x, y: targetPlayer.y - 14, text: '☀️ SOLARIS AEGIS!', color: '#fef08a', isCrit: true });
        this.parties?.syncPlayerVitals?.(targetPlayer.id);
        return;
      }
      if (isDueling && targetPlayer.hp - rem <= 1) {
        targetPlayer.hp = 1;
        room.fxQueue.push({
          kind: 'player_hit',
          playerId: targetPlayer.id,
          x: targetPlayer.x,
          y: targetPlayer.y,
          dmg: rem,
          isCrit,
          attackerName,
          attackerX: attackerRef ? attackerRef.x : undefined,
          attackerY: attackerRef ? attackerRef.y : undefined,
        });
        this.parties?.syncPlayerVitals?.(targetPlayer.id);
        this.duels.concludeDuel(targetPlayer.id, attackerRef?.id, 'defeat');
        return;
      }

      targetPlayer.hp = Math.max(0, targetPlayer.hp - rem);
      room.fxQueue.push({
        kind: 'player_hit',
        playerId: targetPlayer.id,
        x: targetPlayer.x,
        y: targetPlayer.y,
        dmg: rem,
        isCrit,
        attackerName,
        attackerX: attackerRef ? attackerRef.x : undefined,
        attackerY: attackerRef ? attackerRef.y : undefined,
      });

      // Tibia Infamy: Attacking an unflagged player in an open PvP zone flags attacker with White Skull (15m)
      const isAttackerPlayer = attackerRef && attackerRef.ws && attackerRef.id !== targetPlayer.id;
      if (isAttackerPlayer && room.pvp && room.type !== ROOM_TYPES.ARENA_3V3 && !isDueling) {
        if (!targetPlayer.skull) {
          if (attackerRef.skull !== 'red') {
            attackerRef.skull = 'white';
            attackerRef.skullTimer = 900;
            attackerRef.send({
              type: 'sys_msg',
              category: 'combat',
              text: '💀 [Tibia Infamy] You attacked an unflagged traveler! You have received a WHITE SKULL for 15 minutes.',
            });
            room.fxQueue.push({ kind: 'fct', x: attackerRef.x, y: attackerRef.y - 16, text: '💀 WHITE SKULL (15m)', color: '#ffffff', isCrit: true });
          } else {
            attackerRef.skullTimer = 1800;
          }
        }
      }
    }

    this.parties?.syncPlayerVitals?.(targetPlayer.id);

    if (targetPlayer.hp <= 0) {
      targetPlayer.isDead = true;
      targetPlayer.respawnTimer = 3.0;

      const isAttackerPlayer = attackerRef && attackerRef.ws && attackerRef.id !== targetPlayer.id;
      if (isAttackerPlayer && room.pvp && room.type !== ROOM_TYPES.ARENA_3V3 && !isDueling) {
        if (!targetPlayer.skull) {
          attackerRef.pkCount = (attackerRef.pkCount || 0) + 1;
          if (attackerRef.pkCount >= 3) {
            attackerRef.skull = 'red';
            attackerRef.skullTimer = 1800;
            attackerRef.send({
              type: 'sys_msg',
              category: 'combat',
              text: '☠️ [Tibia Infamy] RED SKULL ACQUIRED! Multiple unprovoked kills! You will forfeit all inventory upon death!',
            });
            room.fxQueue.push({ kind: 'fct', x: attackerRef.x, y: attackerRef.y - 18, text: '☠️ RED SKULL INFAMY!', color: '#ef4444', isCrit: true });
          }
        }
      }

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

      // Tibia Graveglass Tombstone Drop (outside 3v3 Arena)
      if (room.type !== ROOM_TYPES.ARENA_3V3) {
        const bag = Array.isArray(targetPlayer.inventory) ? targetPlayer.inventory : [];
        let droppedItems = [];
        let droppedGold = 0;
        const currentGold = targetPlayer.prog?.solarGold || 0;

        if (targetPlayer.skull === 'red') {
          droppedItems = [...bag];
          targetPlayer.inventory = [];
          droppedGold = Math.max(10, Math.round(currentGold * 0.20));
        } else if (targetPlayer.skull === 'white') {
          const dropCount = Math.min(bag.length, 3);
          for (let k = 0; k < dropCount; k++) {
            if (targetPlayer.inventory.length > 0) {
              const randIdx = Math.floor(Math.random() * targetPlayer.inventory.length);
              droppedItems.push(targetPlayer.inventory.splice(randIdx, 1)[0]);
            }
          }
          droppedGold = Math.max(10, Math.round(currentGold * 0.10));
        } else {
          const matIndices = [];
          for (let k = 0; k < targetPlayer.inventory.length; k++) {
            const itId = typeof targetPlayer.inventory[k] === 'string' ? targetPlayer.inventory[k] : targetPlayer.inventory[k]?.id;
            if (EQUIPMENT_CATALOG[itId]?.slot === 'material') {
              matIndices.push(k);
            }
          }
          matIndices.reverse();
          for (let k = 0; k < Math.min(3, matIndices.length); k++) {
            droppedItems.push(targetPlayer.inventory.splice(matIndices[k], 1)[0]);
          }
          droppedGold = currentGold > 0 ? Math.max(25, Math.round(currentGold * 0.05)) : 0;
        }

        if (droppedGold > 0 && targetPlayer.prog) {
          targetPlayer.prog.solarGold = Math.max(0, (targetPlayer.prog.solarGold || 0) - droppedGold);
        }

        const tombstoneId = `tomb_${crypto.randomUUID().slice(0, 8)}`;
        const tombstone = {
          id: tombstoneId,
          type: 'graveglass_tombstone',
          name: `${targetPlayer.displayName}'s Tombstone`,
          ownerId: targetPlayer.id,
          ownerName: targetPlayer.displayName,
          x: Math.round(targetPlayer.x),
          y: Math.round(targetPlayer.y),
          gold: droppedGold,
          items: droppedItems,
          roomType: room.type,
          createdAt: Date.now(),
          expiresAt: Date.now() + 900000,
        };
        room.entities.push(tombstone);

        targetPlayer.activeTombstone = {
          id: tombstone.id,
          x: tombstone.x,
          y: tombstone.y,
          roomType: room.type,
          roomId: room.id,
          gold: droppedGold,
          itemCount: droppedItems.length,
        };

        targetPlayer.send({
          type: 'corpse_tombstone_spawned',
          tombstone: targetPlayer.activeTombstone,
        });

        if (this.accounts?.syncBankAndInventory) {
          this.accounts.syncBankAndInventory(targetPlayer.id, targetPlayer.bank, targetPlayer.inventory, targetPlayer.equipment);
        }
      }
    }
  },
};
