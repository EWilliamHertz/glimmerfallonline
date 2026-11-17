// ==========================================
// GlimmerFall Online — Singleplayer Offline Combat Executor
// Mirrors authoritative server Flashes, Rites, Class Kits, and DoTs using shared combatRules.
// ==========================================

import {
  YARD_PX,
  ACTION_SLOTS,
  getClassPassive,
  resolveAbilityNumbers,
  isWaterTile,
  clampStepOutOfWater,
} from '../../shared/protocol.js';

function getHostiles(entities, isHostileEntity) {
  return entities.filter(
    (e) => !e.isDying && isHostileEntity(e) && e.type !== 'node' && e.type !== 'portal'
  );
}

function addOfflineSolarCharge(player, amount, spawnFCT) {
  player.solarCharge = Math.min(player.maxSolarCharge || 100, (player.solarCharge || 0) + amount);
  if (player.faction === 'Solari' && player.solarCharge >= 100 && (player.zenithTimer || 0) <= 0) {
    player.zenithTimer = 6.0;
    player.zenith = true;
    spawnFCT?.(player.x, player.y - 12, '☀️ ZENITH STATE! (+25% DMG)', '#fde047', true);
  }
}

export function executeOfflineAbility({
  spec,
  rank,
  slot,
  eff,
  critChance,
  duskMarksSpent = 0,
  player,
  localProfile,
  prog,
  entities,
  acquiredTarget,
  currentTarget,
  groundZones,
  projectiles,
  skyBeams,
  slashArcs,
  afterimages,
  mapBounds,
  cooldowns,
  currentRoomType,
  isHostileEntity,
  damageOfflineEntity,
  spawnSparkBurst,
  spawnSmokeBurst,
  spawnFCT,
  triggerScreenShake,
  audio,
  updatePlayerUI,
  getFacingVector,
}) {
  const isRite = Boolean(spec.tcgType?.includes('Rite'));
  const rangePx = (spec.rangeYards || 8) * YARD_PX;
  const hostiles = getHostiles(entities, isHostileEntity);
  const classPassive = getClassPassive(localProfile.classId);

  const computeNums = (target = null, forceCrit = false) => {
    const isCrit = forceCrit || Math.random() < critChance || Boolean(player.stealthed);
    return {
      isCrit,
      ...resolveAbilityNumbers({
        spec,
        rank,
        effStats: eff,
        prog,
        actor: player,
        target,
        isCrit,
        duskMarksSpent,
        isHexed: Boolean(target && (target.hexedTimer || 0) > 0),
        isFrozen: Boolean(target && (target.freezeTimer || 0) > 0),
      }),
    };
  };

  player.activeDuskMarksSpent = duskMarksSpent;

  if (spec.kind === 'cast_beam') {
    const tgt = (acquiredTarget && !acquiredTarget.isDying) ? acquiredTarget : currentTarget;
    if (tgt && !tgt.isDying) {
      audio.playSpell?.();
      skyBeams.push({ x: tgt.x, y: tgt.y, color: spec.color || '#38bdf8', age: 0, maxAge: 0.45 });
      if (spec.id === 'corona_cataclysm' || (spec.tier && spec.tier >= 7)) triggerScreenShake(0.4);
      const nums = computeNums(tgt, true);
      damageOfflineEntity(tgt, nums.dmg, true, true, spec.name);
      for (const near of hostiles) {
        if (near !== tgt && Math.hypot(near.x - tgt.x, near.y - tgt.y) <= 56) {
          damageOfflineEntity(near, Math.round(nums.dmg * 0.55), false, false, spec.name);
        }
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'projectile' || spec.kind === 'shardburst') {
    const tgt = (acquiredTarget && !acquiredTarget.isDying) ? acquiredTarget : hostiles[0] || null;
    if (tgt) {
      audio.playHammer?.();
      addOfflineSolarCharge(player, 18 + eff.resonance * 2, spawnFCT);
      const nums = computeNums(tgt, spec.kind === 'shardburst');
      projectiles.push({
        id: `off_prj_${Date.now()}_${Math.random()}`,
        type: spec.projType || 'orb',
        color: spec.color,
        spellName: spec.name,
        isRite,
        x: player.x,
        y: player.y - 8,
        targetId: tgt.id,
        speed: spec.projType === 'aether_orb' ? 265 : 225,
        rot: 0,
        dmg: nums.dmg,
      });
      if (spec.kind === 'shardburst') {
        const leachHeal = Math.max(2, Math.round(nums.dmg * 0.45));
        player.hp = Math.min(player.maxHp, player.hp + leachHeal);
        spawnFCT(player.x, player.y - 10, `+${leachHeal} SHARD SIPHON`, '#e879f9');
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'ground_zone') {
    const zx = acquiredTarget ? acquiredTarget.x : (currentTarget && !currentTarget.isDying ? currentTarget.x : player.x);
    const zy = acquiredTarget ? acquiredTarget.y : (currentTarget && !currentTarget.isDying ? currentTarget.y : player.y);
    groundZones.push({
      id: `off_gz_${Date.now()}`,
      type: spec.zoneType || 'consecration',
      color: spec.color,
      spellName: spec.name,
      x: zx,
      y: zy,
      radius: rangePx,
      tickDmg: Math.max(2, 2 + rank + Math.floor(eff.power * 0.5)),
      age: 0,
      maxAge: 6.2,
      tickTimer: 0.2,
    });
    spawnFCT(zx, zy - 6, spec.name.toUpperCase(), spec.color || '#38bdf8');
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'nova' || spec.kind === 'frost_nova') {
    groundZones.push({
      id: `off_ring_${Date.now()}`,
      type: spec.kind === 'frost_nova' ? 'frost_ring' : 'shockwave',
      color: spec.color,
      x: player.x,
      y: player.y,
      radius: rangePx,
      age: 0,
      maxAge: 0.45,
    });
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rangePx) {
        const nums = computeNums(e, true);
        damageOfflineEntity(e, nums.dmg, true, isRite, spec.name);
        if (!e.isDying && spec.kind === 'frost_nova') {
          e.frozen = true;
          e.freezeTimer = 3.2;
          spawnFCT(e.x, e.y - 10, '❄️ FROZEN!', '#bae6fd');
        }
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'dash' || spec.kind === 'shadow_step' || spec.kind === 'gale_spear') {
    const startX = player.x;
    const startY = player.y;
    let targetX = startX;
    let targetY = startY;

    if (spec.kind === 'shadow_step' && acquiredTarget) {
      const ang = Math.atan2(acquiredTarget.y - player.y, acquiredTarget.x - player.x);
      targetX = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, acquiredTarget.x + Math.cos(ang) * 18));
      targetY = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, acquiredTarget.y + Math.sin(ang) * 18));
      const nums = computeNums(acquiredTarget, true);
      damageOfflineEntity(acquiredTarget, nums.dmg, true, false, spec.name);
    } else {
      const { dx, dy } = getFacingVector();
      const dist = ((spec.rangeYards || 8.5) + rank * 0.35) * YARD_PX;
      targetX = Math.max(-mapBounds.halfW + 16, Math.min(mapBounds.halfW - 16, player.x + dx * dist));
      targetY = Math.max(-mapBounds.halfH + 16, Math.min(mapBounds.halfH - 16, player.y + dy * dist));
    }

    const safeStep = clampStepOutOfWater(startX, startY, targetX, targetY, currentRoomType, mapBounds.halfW, mapBounds.halfH);
    player.x = safeStep.x;
    player.y = safeStep.y;

    for (let s = 0; s < 4; s++) {
      afterimages.push({
        x: startX + (player.x - startX) * (s / 4),
        y: startY + (player.y - startY) * (s / 4),
        dir: player.dir,
        age: 0,
        maxAge: 0.28 + s * 0.04,
      });
    }
    if (spec.kind === 'gale_spear') {
      for (const e of hostiles) {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= 72) {
          const nums = computeNums(e, false);
          e.poisonTimer = 4.5;
          damageOfflineEntity(e, nums.dmg, nums.isCrit, false, spec.name);
        }
      }
    }
    addOfflineSolarCharge(player, 12, spawnFCT);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'shield' || spec.kind === 'thornbark') {
    const nums = computeNums(null, false);
    player.shield = nums.shield;
    player.shieldTimer = 8.0;
    if (spec.kind === 'thornbark') {
      player.thornbarkTimer = 8.0;
      player.thornbark = true;
    }
    if (classPassive.shieldGlimmerBonus) {
      addOfflineSolarCharge(player, classPassive.shieldGlimmerBonus, spawnFCT);
    }
    spawnFCT(player.x, player.y - 8, `+${nums.shield} SHIELD`, spec.color || '#38bdf8');
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'heal' || spec.kind === 'heal_glimmer' || spec.kind === 'starlight_mend' || spec.kind === 'solaris_apotheosis') {
    const nums = computeNums(null, false);
    const healAmt = spec.kind === 'solaris_apotheosis' ? nums.heal * 2 : nums.heal;
    const prevHp = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmt);
    const overheal = Math.max(0, (prevHp + healAmt) - player.maxHp);
    if (overheal > 0 && classPassive.overhealToShieldRatio) {
      const bonusShield = Math.round(overheal * classPassive.overhealToShieldRatio);
      player.shield = Math.min(player.maxHp, (player.shield || 0) + bonusShield);
      player.shieldTimer = Math.max(player.shieldTimer || 0, 8.0);
    }
    if (spec.kind === 'heal_glimmer' || spec.kind === 'solaris_apotheosis') {
      addOfflineSolarCharge(player, 25, spawnFCT);
    }
    if (spec.kind === 'solaris_apotheosis') {
      player.solarisDomeTimer = 6.0;
      groundZones.push({ id: `off_gz_${Date.now()}`, type: 'consecration', color: '#fde047', spellName: spec.name, x: player.x, y: player.y, radius: 14 * YARD_PX, tickDmg: 4 + rank, age: 0, maxAge: 6.0, tickTimer: 0.4 });
      spawnFCT(player.x, player.y - 14, `🌞 SOLARIS DOME (+${healAmt} HP)!`, '#fde047', true);
    } else {
      spawnFCT(player.x, player.y - 8, `+${healAmt} HP`, '#4ade80');
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'aurora_beam') {
    const nums = computeNums(acquiredTarget, true);
    const zx = acquiredTarget ? acquiredTarget.x : player.x;
    const zy = acquiredTarget ? acquiredTarget.y : player.y;
    skyBeams.push({ x: zx, y: zy, color: '#fef08a', age: 0, maxAge: 0.45 });
    for (const e of hostiles) {
      if (Math.hypot(e.x - zx, e.y - zy) <= 68) {
        damageOfflineEntity(e, nums.dmg, nums.isCrit, true, spec.name);
      }
    }
    player.hp = Math.min(player.maxHp, player.hp + Math.round(nums.heal * 0.6));
    spawnFCT(player.x, player.y - 10, `🌈 AURORA BEAM (+${Math.round(nums.heal * 0.6)} HP)`, '#fef08a');
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'purifying_halo') {
    player.slowTimer = 0; player.snareTimer = 0; player.weakenTimer = 0;
    player.auroraStrideTimer = 4.0;
    const nums = computeNums(null, false);
    player.hp = Math.min(player.maxHp, player.hp + Math.round(nums.heal * 0.5));
    groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#bae6fd', x: player.x, y: player.y, radius: 12 * YARD_PX, age: 0, maxAge: 0.4 });
    spawnSparkBurst(player.x, player.y - 8, ['#bae6fd', '#fde047', '#ffffff'], 18);
    spawnFCT(player.x, player.y - 12, '💫 PURIFYING HALO!', '#bae6fd', true);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'stealth' || spec.kind === 'smoke_bomb') {
    player.stealthedTimer = spec.kind === 'smoke_bomb' ? 6.0 : 3.5;
    player.stealthed = true;
    spawnSmokeBurst(player.x, player.y, spec.kind === 'smoke_bomb' ? 24 : 16);
    if (spec.kind === 'smoke_bomb') {
      for (const e of hostiles) {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= 8 * YARD_PX) e.weakenTimer = 5.0;
      }
      spawnFCT(player.x, player.y - 10, '💨 UMBRAL SMOKE BOMB!', '#a855f7', true);
    } else {
      spawnFCT(player.x, player.y - 10, '🌑 STEALTH', '#c084fc');
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'timeloop') {
    const rewindHp = Math.max(5, Math.round(player.maxHp * 0.25) + rank * 2);
    player.hp = Math.min(player.maxHp, player.hp + rewindHp);
    for (const s of ACTION_SLOTS) {
      if (s !== slot && cooldowns[s] > 0) cooldowns[s] = Math.max(0, cooldowns[s] - (2.2 + rank * 0.3));
    }
    player.echoPrimed = true;
    addOfflineSolarCharge(player, 15, spawnFCT);
    spawnSparkBurst(player.x, player.y - 8, ['#38bdf8', '#e0f2fe', '#c084fc'], 14);
    spawnFCT(player.x, player.y - 10, `⏳ REWIND +${rewindHp} HP & ECHO!`, '#7dd3fc', true);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'temporal_anchor') {
    if (player._temporalAnchor && (player.anchorTimer || 0) > 0) {
      const a = player._temporalAnchor;
      player.x = a.x;
      player.y = a.y;
      const healHp = Math.round(player.maxHp * 0.3);
      player.hp = Math.min(player.maxHp, Math.max(a.hp, player.hp + healHp));
      player._temporalAnchor = null;
      player.anchorTimer = 0;
      for (const s of ACTION_SLOTS) {
        if (s !== slot) cooldowns[s] = 0;
      }
      spawnSparkBurst(player.x, player.y - 8, ['#38bdf8', '#ffffff'], 18);
      spawnFCT(player.x, player.y - 12, `⚓ TEMPORAL RECALL (+${healHp} HP)!`, '#7dd3fc', true);
    } else {
      player._temporalAnchor = { x: player.x, y: player.y, hp: player.hp };
      player.anchorTimer = 6.0;
      cooldowns[slot] = 0.6; // Allow rapid recall press!
      spawnFCT(player.x, player.y - 12, '⚓ TIME ANCHOR SET (6s)!', '#38bdf8');
    }
    updatePlayerUI();
    return;
  }

  if ((spec.kind === 'drain_beam' || spec.kind === 'execute_beam' || spec.kind === 'harbingers_requiem') && (acquiredTarget || spec.kind === 'harbingers_requiem')) {
    if (spec.kind === 'harbingers_requiem') {
      let totalHeal = 0;
      groundZones.push({ id: `off_ring_${Date.now()}`, type: 'plague', color: '#a855f7', x: player.x, y: player.y, radius: 14 * YARD_PX, age: 0, maxAge: 0.65 });
      for (const e of hostiles) {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= 14 * YARD_PX) {
          const nums = computeNums(e, true);
          e.slowTimer = 4.0;
          skyBeams.push({ x: e.x, y: e.y, color: '#a855f7', age: 0, maxAge: 0.45 });
          damageOfflineEntity(e, nums.dmg, true, true, spec.name);
          totalHeal += Math.round(nums.dmg * 0.75);
        }
      }
      if (totalHeal > 0) {
        player.hp = Math.min(player.maxHp, player.hp + totalHeal);
        spawnFCT(player.x, player.y - 12, `💀 +${totalHeal} REQUIEM SIPHON!`, '#c084fc', true);
      }
    } else if (acquiredTarget) {
      const nums = computeNums(acquiredTarget, true);
      skyBeams.push({ x: acquiredTarget.x, y: acquiredTarget.y, color: spec.color || '#e11d48', age: 0, maxAge: 0.45 });
      damageOfflineEntity(acquiredTarget, nums.dmg, true, true, spec.name);
      if (spec.kind === 'drain_beam') {
        const drainHeal = Math.max(2, Math.round(nums.dmg * 0.6));
        player.hp = Math.min(player.maxHp, player.hp + drainHeal);
        spawnFCT(player.x, player.y - 8, `+${drainHeal} SIPHON`, '#4ade80');
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'reactive_barrier') {
    const nums = computeNums(null, false);
    player.shield = nums.shield + 4;
    player.shieldTimer = 8.0;
    player.rebukeTimer = 4.0;
    spawnSparkBurst(player.x, player.y - 8, ['#facc15', '#fef08a', '#ffffff'], 16);
    spawnFCT(player.x, player.y - 10, `☀️ REBUKE (+${player.shield})`, spec.color || '#facc15');
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'cleanse_sprint') {
    player.slowTimer = 0; player.snareTimer = 0; player.weakenTimer = 0;
    player.auroraStrideTimer = 4.0;
    spawnSparkBurst(player.x, player.y - 6, ['#fef08a', '#ffffff'], 12);
    spawnFCT(player.x, player.y - 10, '✨ AURORA STRIDE (+50% SPD)!', '#fef08a');
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'archon_form') {
    player.solarAscensionTimer = 8.0;
    for (const s of [9, 10, 11, 12]) cooldowns[s] = 0;
    spawnSparkBurst(player.x, player.y - 8, ['#fde047', '#facc15', '#ffffff'], 24);
    spawnFCT(player.x, player.y - 14, '👑 SOLAR ASCENSION APEX ARCHON!', '#fde047', true);
    triggerScreenShake(0.35);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'stealth_burst') {
    player.abyssalShroudTimer = 2.0;
    player.stealthedTimer = 2.0;
    player.stealthed = true;
    spawnSmokeBurst(player.x, player.y, 20);
    spawnFCT(player.x, player.y - 10, '🌫️ ABYSSAL SHROUD (100% DODGE)!', '#9333ea', true);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'dash_cleave') {
    const { dx, dy } = getFacingVector();
    const dist = 10 * YARD_PX;
    const startX = player.x;
    const startY = player.y;
    const safeDash = clampStepOutOfWater(startX, startY, player.x + dx * dist, player.y + dy * dist, currentRoomType, mapBounds.halfW, mapBounds.halfH);
    player.x = safeDash.x;
    player.y = safeDash.y;
    for (let s = 0; s < 4; s++) {
      afterimages.push({ x: startX + (player.x - startX) * (s / 4), y: startY + (player.y - startY) * (s / 4), dir: player.dir, age: 0, maxAge: 0.3 });
    }
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= 80) {
        const nums = computeNums(e, true);
        damageOfflineEntity(e, nums.dmg, true, false, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'voidform') {
    player.voidformTimer = 8.0;
    player.stealthedTimer = 8.0;
    player.stealthed = true;
    spawnSmokeBurst(player.x, player.y, 24);
    spawnFCT(player.x, player.y - 14, '👑 AVATAR OF THE VOID!', '#a855f7', true);
    triggerScreenShake(0.35);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'iron_fortify' || spec.kind === 'monolith_wall') {
    player.rootedBastionTimer = spec.kind === 'monolith_wall' ? 7.0 : 3.5;
    if (spec.kind === 'monolith_wall') {
      player.thornbarkTimer = 7.0;
      player.thornbark = true;
      player.shield = Math.max(player.shield || 0, 30 + eff.bastion * 4 + rank * 6);
      player.shieldTimer = 8.0;
      spawnFCT(player.x, player.y - 12, `🗿 MONOLITH (+${player.shield} SHIELD)!`, '#84cc16', true);
    } else {
      spawnFCT(player.x, player.y - 10, '🌳 ROOTED BASTION (-40% DMG / CC IMMUNE)!', '#15803d', true);
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'bramble_burst' || spec.kind === 'seismic_taunt') {
    const rad = (spec.kind === 'seismic_taunt' ? 12 : 8) * YARD_PX;
    groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#4ade80', x: player.x, y: player.y, radius: rad, age: 0, maxAge: 0.35 });
    spawnFCT(player.x, player.y - 10, spec.kind === 'seismic_taunt' ? '🪨 SEISMIC TAUNT!' : '🌿 BRAMBLE REVERSAL!', '#4ade80', true);
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rad) {
        const nums = computeNums(e, false);
        if (spec.kind === 'seismic_taunt') e.weakenTimer = 6.0;
        damageOfflineEntity(e, nums.dmg, nums.isCrit, false, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'colossus_stomp' || spec.kind === 'tectonic_cataclysm') {
    const rad = (spec.kind === 'tectonic_cataclysm' ? 15 : 10) * YARD_PX;
    if (spec.kind === 'tectonic_cataclysm') {
      player.shield = Math.max(player.shield || 0, 120 + eff.bastion * 4);
      player.shieldTimer = 10.0;
      triggerScreenShake(0.38);
    }
    groundZones.push({ id: `off_ring_${Date.now()}`, type: 'shockwave', color: '#22c55e', x: player.x, y: player.y, radius: rad, age: 0, maxAge: 0.55 });
    addOfflineSolarCharge(player, 25, spawnFCT);
    spawnFCT(player.x, player.y - 12, spec.kind === 'tectonic_cataclysm' ? '🌋 TECTONIC CATACLYSM!' : '🪨 IRONWOOD COLOSSUS!', '#84cc16', true);
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rad) {
        const nums = computeNums(e, true);
        if (spec.kind === 'tectonic_cataclysm') {
          e.frozen = true;
          e.freezeTimer = 2.5;
        }
        damageOfflineEntity(e, nums.dmg, true, spec.kind === 'tectonic_cataclysm', spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'treant_form') {
    player.shield = 250;
    player.shieldTimer = 8.0;
    player.thornbark = true;
    player.thornbarkTimer = 8.0;
    player.treantFormTimer = 8.0;
    spawnFCT(player.x, player.y - 14, '👑 AVATAR OF THE IRONWOOD!', '#22c55e', true);
    triggerScreenShake(0.35);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'ethereal_jaunt') {
    player.phaseShiftTimer = 1.2;
    spawnSparkBurst(player.x, player.y - 8, ['#7dd3fc', '#bae6fd'], 12);
    spawnFCT(player.x, player.y - 10, '🌌 PHASE SHIFT (UNTOUCHABLE)!', '#7dd3fc');
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'rift_teleport') {
    const { dx, dy } = getFacingVector();
    const dist = 11 * YARD_PX;
    const startX = player.x;
    const startY = player.y;
    const safeRift = clampStepOutOfWater(startX, startY, player.x + dx * dist, player.y + dy * dist, currentRoomType, mapBounds.halfW, mapBounds.halfH);
    player.x = safeRift.x;
    player.y = safeRift.y;
    groundZones.push({ id: `off_gz_${Date.now()}`, type: 'frost_ring', color: '#38bdf8', x: startX, y: startY, radius: 48, age: 0, maxAge: 4.0 });
    for (const e of hostiles) {
      if (Math.hypot(e.x - startX, e.y - startY) <= 52) {
        const nums = computeNums(e, false);
        damageOfflineEntity(e, nums.dmg, nums.isCrit, false, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'apotheosis') {
    player.temporalApotheosisTimer = 8.0;
    for (const s of ACTION_SLOTS) {
      if (s !== slot) cooldowns[s] = 0;
    }
    spawnSparkBurst(player.x, player.y - 8, ['#e0f2fe', '#38bdf8', '#c084fc'], 24);
    spawnFCT(player.x, player.y - 14, '👑 TEMPORAL APOTHEOSIS!', '#e0f2fe', true);
    triggerScreenShake(0.35);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'scythe_wave' || spec.kind === 'tempest_thorns') {
    const waveAngle = getFacingVector().angle;
    slashArcs.push({ x: player.x, y: player.y - 6, angle: waveAngle, color: spec.color || '#9333ea', age: 0, maxAge: 0.35 });
    const rad = (spec.rangeYards || 16) * YARD_PX;
    spawnFCT(player.x, player.y - 10, spec.kind === 'tempest_thorns' ? '🌪️ TEMPEST OF THORNS!' : '🌑 ECLIPSE HARVESTER!', spec.color || '#9333ea', true);
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rad) {
        const nums = computeNums(e, true);
        if (spec.kind === 'tempest_thorns') e.poisonTimer = 4.0;
        damageOfflineEntity(e, nums.dmg, true, true, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'singularity_collapse') {
    groundZones.push({ id: `off_gz_${Date.now()}`, type: 'gravity', color: '#c084fc', spellName: spec.name, x: player.x, y: player.y, radius: 16 * YARD_PX, tickDmg: 8 + rank * 2, age: 0, maxAge: 3.5, tickTimer: 0.2 });
    spawnFCT(player.x, player.y - 12, '🌌 VOID ANNIHILATION APEX!', '#c084fc', true);
    triggerScreenShake(0.4);
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= 16 * YARD_PX) {
        const nums = computeNums(e, true);
        damageOfflineEntity(e, nums.dmg, true, true, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'fissure_line') {
    const { dx, dy } = getFacingVector();
    spawnFCT(player.x, player.y - 8, '⛰️ TECTONIC FISSURE!', '#65a30d', true);
    for (let step = 1; step <= 5; step++) {
      const fx = player.x + dx * step * 28;
      const fy = player.y + dy * step * 28;
      groundZones.push({ id: `off_gz_${Date.now()}_${step}`, type: 'briar', color: '#65a30d', spellName: 'Tectonic Fissure', x: fx, y: fy, radius: 32, tickDmg: 4 + rank, age: 0, maxAge: 5.0, tickTimer: 0.3 });
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'continental_quake' || spec.kind === 'stasis_bubble') {
    const rad = (spec.kind === 'stasis_bubble' ? 14 : 16) * YARD_PX;
    groundZones.push({
      id: `off_ring_${Date.now()}`,
      type: spec.kind === 'stasis_bubble' ? 'frost_ring' : 'shockwave',
      color: spec.kind === 'stasis_bubble' ? '#0284c7' : '#4ade80',
      x: player.x,
      y: player.y,
      radius: rad,
      age: 0,
      maxAge: spec.kind === 'stasis_bubble' ? 3.5 : 0.6,
    });
    spawnFCT(player.x, player.y - 12, spec.kind === 'stasis_bubble' ? '🌌 CHRONO STASIS APEX!' : '🌳 WRATH OF GAIA APEX!', spec.color, true);
    triggerScreenShake(0.4);
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rad) {
        e.frozen = true;
        e.freezeTimer = spec.kind === 'stasis_bubble' ? 3.5 : 3.0;
        const nums = computeNums(e, true);
        damageOfflineEntity(e, nums.dmg, true, true, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'supernova' || spec.kind === 'judgement_verdict' || spec.kind === 'astral_supernova') {
    const cx = spec.kind === 'astral_supernova' ? player.x : (acquiredTarget ? acquiredTarget.x : player.x);
    const cy = spec.kind === 'astral_supernova' ? player.y : (acquiredTarget ? acquiredTarget.y : player.y);
    const rad = (spec.rangeYards || 14) * YARD_PX;
    groundZones.push({ id: `off_ring_${Date.now()}`, type: spec.kind === 'astral_supernova' ? 'frost_ring' : 'shockwave', color: spec.color, x: cx, y: cy, radius: rad, age: 0, maxAge: 0.55 });
    if (spec.kind === 'judgement_verdict') skyBeams.push({ x: cx, y: cy, color: '#fef08a', age: 0, maxAge: 0.45 });
    spawnFCT(cx, cy - 12, `${spec.icon || '💥'} ${spec.name.toUpperCase()}!`, spec.color, true);
    triggerScreenShake(0.35);
    for (const e of hostiles) {
      if (Math.hypot(e.x - cx, e.y - cy) <= rad) {
        if (spec.kind === 'astral_supernova') {
          e.frozen = true;
          e.freezeTimer = 2.5;
        }
        const nums = computeNums(e, true);
        damageOfflineEntity(e, nums.dmg, true, true, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  // Remaining class-exclusive Flashes & Rites
  if (spec.kind === 'aegis_slam' || spec.kind === 'sunfire_lance') {
    const tgt = acquiredTarget || hostiles.find((e) => Math.hypot(e.x - player.x, e.y - player.y) <= rangePx);
    if (spec.kind === 'sunfire_lance' && tgt) {
      const safeLance = clampStepOutOfWater(player.x, player.y, tgt.x - 16, tgt.y, currentRoomType, mapBounds.halfW, mapBounds.halfH);
      player.x = safeLance.x;
      player.y = safeLance.y;
    }
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= 64) {
        const nums = computeNums(e, false);
        e.freezeTimer = 1.5;
        e.frozen = true;
        if (spec.kind === 'sunfire_lance') e.sunbrandTimer = 4.0;
        damageOfflineEntity(e, nums.dmg, nums.isCrit, false, spec.name);
      }
    }
    addOfflineSolarCharge(player, 15, spawnFCT);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'bastion_banner') {
    player.bastionBannerTimer = 8.0;
    groundZones.push({ id: `off_gz_${Date.now()}`, type: 'consecration', color: '#facc15', spellName: spec.name, x: player.x, y: player.y, radius: 12 * YARD_PX, tickDmg: 3 + rank, age: 0, maxAge: 8.0, tickTimer: 0.4 });
    spawnFCT(player.x, player.y - 14, '🚩 BASTION BANNER (+25% DR)!', '#facc15', true);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'serrated_mutilate' || spec.kind === 'crimson_rupture' || spec.kind === 'phantom_sever') {
    const rad = spec.kind === 'phantom_sever' ? 14 * YARD_PX : rangePx + 14;
    let count = 0;
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rad) {
        if (spec.kind === 'phantom_sever' && count >= 5) break;
        count++;
        const nums = computeNums(e, spec.kind === 'phantom_sever');
        if (spec.kind === 'serrated_mutilate') {
          damageOfflineEntity(e, Math.round(nums.dmg * 0.65), nums.isCrit, false, spec.name);
          damageOfflineEntity(e, Math.round(nums.dmg * 0.55), nums.isCrit, false, `${spec.name} Offhand`);
        } else {
          if (spec.kind === 'crimson_rupture') e.bleedTimer = 8.0;
          damageOfflineEntity(e, nums.dmg, nums.isCrit, false, spec.name);
        }
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'hex_of_frailty') {
    const tgt = acquiredTarget || hostiles[0] || null;
    if (tgt && Math.hypot(tgt.x - player.x, tgt.y - player.y) <= rangePx) {
      tgt.hexedTimer = 8.0;
      tgt.weakenTimer = 8.0;
      spawnFCT(tgt.x, tgt.y - 12, '🧿 HEXED (+20% RITE DMG)!', '#c084fc');
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'soul_covenant') {
    const sac = Math.max(1, Math.round(player.hp * 0.12));
    player.hp = Math.max(1, player.hp - sac);
    player.shield = Math.min(Math.round(player.maxHp * 0.3), (player.shield || 0) + Math.round(sac * 2 + eff.resonance * 2));
    player.shieldTimer = 8.0;
    addOfflineSolarCharge(player, 45, spawnFCT);
    groundZones.push({ id: `off_ring_${Date.now()}`, type: 'plague', color: '#e11d48', x: player.x, y: player.y, radius: 10 * YARD_PX, age: 0, maxAge: 0.5 });
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= 10 * YARD_PX) {
        const nums = computeNums(e, true);
        damageOfflineEntity(e, nums.dmg, true, true, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'spore_volley' || spec.kind === 'pack_hunt') {
    for (const e of hostiles) {
      if (Math.hypot(e.x - player.x, e.y - player.y) <= rangePx) {
        e.poisonTimer = 6.0;
        const nums = computeNums(e, false);
        damageOfflineEntity(e, nums.dmg, nums.isCrit, isRite, spec.name);
      }
    }
    if (spec.kind === 'pack_hunt') {
      player.auroraStrideTimer = 4.0;
      addOfflineSolarCharge(player, 20, spawnFCT);
      spawnFCT(player.x, player.y - 12, '🐺 PACK HUNT (+35% SPD)!', '#86efac', true);
    } else {
      const nums = computeNums(null, false);
      player.hp = Math.min(player.maxHp, player.hp + Math.round(nums.heal * 0.5));
      spawnFCT(player.x, player.y - 10, '🍄 SPORE VOLLEY!', '#a3e635');
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'earthen_grasp') {
    for (const e of hostiles) {
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d <= 11 * YARD_PX) {
        if (d > 22) {
          e.x += ((player.x - e.x) / d) * Math.min(d - 20, 68);
          e.y += ((player.y - e.y) / d) * Math.min(d - 20, 68);
        }
        e.snareTimer = 2.5;
        const nums = computeNums(e, false);
        damageOfflineEntity(e, nums.dmg, nums.isCrit, true, spec.name);
      }
    }
    spawnFCT(player.x, player.y - 12, '🌿 EARTHEN GRASP!', '#4ade80', true);
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'echoing_paradox' || spec.kind === 'glacial_spike' || spec.kind === 'arcane_tether') {
    const tgt = acquiredTarget || hostiles.find((e) => Math.hypot(e.x - player.x, e.y - player.y) <= rangePx);
    if (spec.kind === 'echoing_paradox') {
      player.echoPrimed = true;
      for (const s of ACTION_SLOTS) {
        if (s !== slot && cooldowns[s] > 0) cooldowns[s] = Math.max(0, cooldowns[s] - 2.0);
      }
    } else if (spec.kind === 'arcane_tether') {
      addOfflineSolarCharge(player, 25, spawnFCT);
    }
    if (tgt) {
      skyBeams.push({ x: tgt.x, y: tgt.y, color: spec.color || '#38bdf8', age: 0, maxAge: 0.4 });
      if (spec.kind === 'glacial_spike' || spec.kind === 'arcane_tether') {
        tgt.frozen = true;
        tgt.freezeTimer = spec.kind === 'glacial_spike' ? 2.2 : 1.5;
      }
      const nums = computeNums(tgt, spec.kind === 'glacial_spike');
      damageOfflineEntity(tgt, nums.dmg, nums.isCrit, isRite, spec.name);
    }
    updatePlayerUI();
    return;
  }

  if (spec.kind === 'meteor_constellation' || spec.kind === 'fractured_timeline') {
    const cx = acquiredTarget ? acquiredTarget.x : player.x;
    const cy = acquiredTarget ? acquiredTarget.y : player.y;
    for (let k = 0; k < 3; k++) {
      skyBeams.push({ x: cx + (k - 1) * 18, y: cy + (k % 2 === 0 ? -8 : 8), color: spec.color || '#7dd3fc', age: 0, maxAge: 0.45 });
    }
    for (const e of hostiles) {
      if (Math.hypot(e.x - cx, e.y - cy) <= 78) {
        const nums = computeNums(e, true);
        damageOfflineEntity(e, Math.round(nums.dmg * 1.15), true, true, spec.name);
      }
    }
    updatePlayerUI();
    return;
  }

  // Default Melee Cleave (Flare Strike, Whisper of the Void, Tectonic Slam, Reality Fracture)
  let hitAny = false;
  const cleaveRad = rangePx + 14 + (classPassive.overwhelmRadiusBonus || 0);
  for (const e of hostiles) {
    if (Math.hypot(e.x - player.x, e.y - player.y) <= cleaveRad) {
      const nums = computeNums(e, false);
      damageOfflineEntity(e, nums.dmg, nums.isCrit, isRite, spec.name);
      if (classPassive.offhandStrikeRatio) {
        damageOfflineEntity(e, Math.max(1, Math.round(nums.dmg * classPassive.offhandStrikeRatio)), false, false, 'Twin-Fang Offhand');
      }
      if (localProfile.classId === 'forest_warden') {
        e.poisonTimer = 3.0;
      }
      hitAny = true;
    }
  }
  if (hitAny) {
    addOfflineSolarCharge(player, 14 + eff.resonance * 2, spawnFCT);
  }
  updatePlayerUI();
}

export function tickOfflineEntityDebuffsAndDoTs({ entities, dt, damageOfflineEntity }) {
  for (const e of entities) {
    if (!e || e.isDying) continue;
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (e.weakenTimer > 0) e.weakenTimer = Math.max(0, e.weakenTimer - dt);
    if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
    if (e.snareTimer > 0) e.snareTimer = Math.max(0, e.snareTimer - dt);
    if (e.hexedTimer > 0) e.hexedTimer = Math.max(0, e.hexedTimer - dt);
    if (e.staggerTimer > 0) e.staggerTimer = Math.max(0, e.staggerTimer - dt);
    if (e.freezeTimer > 0) {
      e.freezeTimer = Math.max(0, e.freezeTimer - dt);
      if (e.freezeTimer <= 0) e.frozen = false;
    }
    if ((e.sunbrandTimer || 0) > 0 || (e.poisonTimer || 0) > 0 || (e.bleedTimer || 0) > 0) {
      e.dotAccum = (e.dotAccum || 0) + dt;
      if (e.dotAccum >= 1.0 && e.type === 'mob') {
        e.dotAccum -= 1.0;
        let dotDmg = 0;
        let dotName = 'Affliction';
        if ((e.sunbrandTimer || 0) > 0) { dotDmg += 5; dotName = 'Sunbrand'; }
        if ((e.poisonTimer || 0) > 0) { dotDmg += 5; dotName = 'Venom Spores'; }
        if ((e.bleedTimer || 0) > 0) { dotDmg += 6; dotName = 'Crimson Rupture'; }
        if (dotDmg > 0) damageOfflineEntity(e, dotDmg, false, false, dotName);
      }
      if (e.sunbrandTimer > 0) e.sunbrandTimer = Math.max(0, e.sunbrandTimer - dt);
      if (e.poisonTimer > 0) e.poisonTimer = Math.max(0, e.poisonTimer - dt);
      if (e.bleedTimer > 0) e.bleedTimer = Math.max(0, e.bleedTimer - dt);
    }
  }
}
