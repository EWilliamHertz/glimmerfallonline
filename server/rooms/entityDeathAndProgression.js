// ==========================================
// RoomManager — Entity Death, Quest/Bounty Credits, XP, Paragon & Skill Upgrades
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

export const entityDeathAndProgressionMethods = {
  handleEntityDeath(room, ent, killerPlayer, killerSpell) {
    if (ent.isDying) return;
    ent.isDying = true;
    ent.deathAge = 0;

    room.fxQueue.push({ kind: 'smoke', x: ent.x, y: ent.y, count: ent.isBoss ? 44 : 28, isDeath: true });

    // Day 3 Mythic affixes: Bolstering empowers survivors, Sanguine leaves healing blood pools.
    if (room.mythic?.active && ent.type === 'mob' && !ent.isBoss) {
      if (room.mythic.affixes.includes('bolstering')) {
        for (const m of room.entities) {
          if (m === ent || m.type !== 'mob' || m.isDying) continue;
          if ((m.bolsterStacks || 0) >= 8) continue;
          if (Math.hypot(m.x - ent.x, m.y - ent.y) > 420) continue;
          const prevMax = m.maxHp;
          m.maxHp = Math.max(1, Math.round(m.maxHp * 1.15));
          m.hp = Math.min(m.maxHp, (m.hp || 0) + (m.maxHp - prevMax));
          m.damage = Math.max(1, Math.ceil((m.damage || 3) * 1.15));
          m.bolsterStacks = (m.bolsterStacks || 0) + 1;
        }
      }
      if (room.mythic.affixes.includes('sanguine')) {
        room.groundZones.push({
          id: `gz_${crypto.randomUUID().slice(0, 6)}`,
          type: 'sanguine_pool',
          color: '#ef4444',
          x: ent.x,
          y: ent.y,
          radius: 62,
          age: 0,
          maxAge: 8,
          tickTimer: 0,
        });
      }
    }

    if (killerPlayer && killerSpell === 'Judgement of the Sun') {
      this.addPlayerGlimmer(room, killerPlayer, 25);
      room.fxQueue.push({ kind: 'fct', x: killerPlayer.x, y: killerPlayer.y - 10, text: '+25 JUDGEMENT GLIMMER', color: '#fde047' });
    }

    // Scheduled Faction Nexus Siege Shard Claim!
    if (ent.type === 'siege_shard' && room.type === ROOM_TYPES.NEXUS_WARZONE) {
      const winnerFac = killerPlayer?.faction || 'Solari';
      const claimerName = killerPlayer?.displayName || 'A Champion';
      if (room.siege) {
        room.siege.active = false;
        room.siege.lastWinnerFaction = winnerFac;
        room.siege.lastClaimedBy = claimerName;
        room.siege.nextSiegeAt = nextThirtyMinBoundary();
      }
      room.fxQueue.push({
        kind: 'fct',
        x: ent.x,
        y: ent.y - 14,
        text: `🏆 ${winnerFac.toUpperCase()} CLAIMED THE NEXUS SHARD!`,
        color: FACTIONS_META[winnerFac]?.color || '#fde047',
        isCrit: true,
      });

      for (const p of room.players.values()) {
        if (p.faction === winnerFac) {
          this.awardPlayerXP(p, 250, `${winnerFac} Siege Victory!`, { addSiegeClaims: 1 });
          p.hp = p.maxHp;
        }
      }
      for (const c of this.clients.values()) {
        c.send({
          type: 'sys_msg',
          category: 'quest',
          text: `🏆 [NEXUS SIEGE] ${claimerName} (${winnerFac}) claimed the Shattered Nexus Shard! All ${winnerFac} champions in Warzone gained +250 XP!`,
        });
      }
      return;
    }

    // Award XP to contributors + co-op Party members in room
    if (ent.xpReward) {
      const recipients = new Set();
      if (ent.dammers) {
        for (const pid of ent.dammers) {
          if (room.players.has(pid)) recipients.add(pid);
          for (const member of this.parties.getPartyMembers(pid)) {
            if (room.players.has(member.id)) recipients.add(member.id);
          }
        }
      }
      if (killerPlayer) recipients.add(killerPlayer.id);

      const squadBonusMult = recipients.size > 1 ? 1.25 : 1.0;
      const xpAmt = Math.round(ent.xpReward * squadBonusMult);
      const isTrainingDummy = ent.type === 'dummy';

      for (const pid of recipients) {
        const p = room.players.get(pid);
        if (p) {
          this.awardPlayerXP(
            p,
            xpAmt,
            recipients.size > 1 ? `${ent.name} • +25% Co-op` : ent.name,
            isTrainingDummy ? null : { addKills: 1 }
          );
          this.awardProfessionXP(p, 'combat_mastery', Math.max(20, Math.round(xpAmt * 0.75)), ent.name);
          if (!isTrainingDummy) {
            p.send({
              type: 'mob_killed',
              mobId: ent.id,
              mobName: ent.name,
              roomType: room.type,
              isBoss: Boolean(ent.isBoss),
              mobType: ent.type,
            });
          }
          if (ent.isBoss && ent.dropGear && EQUIPMENT_CATALOG[ent.dropGear]) {
            p.send({
              type: 'sys_msg',
              category: 'quest',
              text: `✨ [BOSS RELIC] ${ent.name} dropped ${EQUIPMENT_CATALOG[ent.dropGear].name}! Equip it in [I] Paperdoll!`,
            });
          }
        }
      }

      if (ent.isBoss) {
        const victoryText = `🏆 CONTINENTAL VICTORY: ${ent.name} has been vanquished! The Leylines surge with an Ancient Paragon Cache!`;
        this.broadcastToRoom(room, {
          type: 'chat',
          channel: 'world',
          sender: 'WORLD EVENT',
          text: victoryText,
        });
        // World-wide announcement across every realm, not just the boss room.
        for (const c of this.clients.values()) {
          c.send({ type: 'sys_msg', category: 'quest', text: victoryText });
        }
        for (const pid of recipients) {
          const p = room.players.get(pid);
          if (p && p.prog && (p.prog.level || 1) >= 30) {
            this.awardPlayerXP(p, 450, 'Ancient Paragon Cache');
          }
        }
      }
    }

    // 3v3 Arena Victory Condition
    if (room.type === ROOM_TYPES.ARENA_3V3 && (ent.id === 'red_nexus' || ent.id === 'blue_nexus') && !room.matchEnded) {
      room.matchEnded = true;
      const winningTeam = ent.id === 'red_nexus' ? 'blue' : 'red';
      room.fxQueue.push({
        kind: 'fct',
        x: ent.x,
        y: ent.y,
        text: `${winningTeam.toUpperCase()} TEAM VICTORY!`,
        color: '#facc15',
        isCrit: true,
      });

      for (const p of room.players.values()) {
        const won = (p.team || 'blue') === winningTeam;
        p.send({ type: 'arena_result', won, winningTeam });
        if (won) this.awardPlayerXP(p, 120, '3v3 Arena Victory', { addArenaWins: 1 });
      }

      setTimeout(() => {
        for (const p of Array.from(room.players.values())) {
          this.joinRoom(p, ROOM_TYPES.NEXUS_WARZONE);
        }
        this.rooms.delete(room.id);
      }, 3000);
      return;
    }

    // Outpost / Warzone Nexus Respawn
    if (ent.type === 'outpost_nexus' || ent.type === 'nexus') {
      room.fxQueue.push({ kind: 'fct', x: ent.x, y: ent.y, text: `${ent.name.toUpperCase()} SHATTERED!`, color: '#38bdf8', isCrit: true });
      setTimeout(() => {
        if (!this.rooms.has(room.id)) return;
        ent.isDying = false;
        ent.deathAge = 0;
        ent.hp = ent.maxHp;
        ent.dammers = new Set();
        if (!room.entities.includes(ent)) room.entities.push(ent);
      }, 10000);
      return;
    }

    if (ent.type === 'mob') this.spawnLootDrops(room, ent);

    // Day 3: clearing the crypt boss completes an active Mythic run and crystallizes the cache.
    if (ent.isBoss && room.mythic?.active) this.completeMythicRun(room, ent);

    // Standard Mob / Dummy / Dungeon Boss Respawn
    const template = {
      ...ent,
      hp: ent.maxHp,
      isDying: false,
      deathAge: 0,
      inCombat: false,
      weakenTimer: 0,
      slowTimer: 0,
      snareTimer: 0,
      freezeTimer: 0,
      hitFlash: 0,
      x: ent.origX ?? ent.x,
      y: ent.origY ?? ent.y,
      dammers: new Set(),
    };
    setTimeout(() => {
      if (!this.rooms.has(room.id)) return;
      if ((template.type === 'dummy' || template.type === 'mob') && !template.isMinion) {
        room.entities.push(template);
        room.fxQueue.push({ kind: 'smoke', x: template.x, y: template.y, count: 16 });
      }
    }, ent.isBoss ? 11000 : 6500);
  },

  // ==========================================
  // Authoritative Progression (XP, Levels, Stats, Ranks & Paragon)
  // ==========================================
  awardPlayerXP(player, amount, reason = '', statsMetaPatch = null) {
    if (amount <= 0) return;
    let leveled = false;
    let paragonLeveled = false;

    if ((player.prog.level || 1) < MAX_BASE_LEVEL) {
      player.prog.xp = (player.prog.xp || 0) + amount;
      while ((player.prog.level || 1) < MAX_BASE_LEVEL && player.prog.xp >= xpForNextLevel(player.prog.level)) {
        player.prog.xp -= xpForNextLevel(player.prog.level);
        player.prog.level++;
        player.prog.statPoints = (player.prog.statPoints || 0) + 3;
        player.prog.skillPoints = (player.prog.skillPoints || 0) + 1;
        leveled = true;
      }
    } else {
      // Late Game: XP overflows into Paragon Resonance!
      if (!player.prog.paragon) {
        player.prog.paragon = { solari_radiance: 0, umbri_shadowcraft: 0, terra_bulwark: 0, aether_chronoflux: 0 };
      }
      player.prog.paragonLevel = player.prog.paragonLevel || 0;
      player.prog.paragonPoints = player.prog.paragonPoints || 0;
      player.prog.paragonXp = (player.prog.paragonXp || 0) + amount;
      while (player.prog.paragonXp >= paragonXpForLevel(player.prog.paragonLevel)) {
        player.prog.paragonXp -= paragonXpForLevel(player.prog.paragonLevel);
        player.prog.paragonLevel++;
        player.prog.paragonPoints++;
        paragonLeveled = true;
      }
    }

    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    if (leveled || paragonLeveled) {
      player.hp = player.maxHp;
      const room = this.rooms.get(player.roomId);
      if (room) {
        room.fxQueue.push({ kind: 'spark', x: player.x, y: player.y - 8, colors: ['#fde047', '#38bdf8', '#4ade80', '#c084fc', '#ffffff'] });
        const lvlTxt = paragonLeveled ? `PARAGON ${player.prog.paragonLevel}!` : `LEVEL ${player.prog.level}!`;
        room.fxQueue.push({ kind: 'fct', x: player.x, y: player.y - 12, text: lvlTxt, color: paragonLeveled ? '#c084fc' : '#fde047', isCrit: true });
      }
    }

    this.accounts.saveProgression(player.id, player.prog, statsMetaPatch);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
      xpGained: amount,
      reason,
      leveled: leveled || paragonLeveled,
    });
    this.parties.syncPlayerVitals(player.id);
  },

  handleUpgradeParagon(player, affinityId) {
    if (!canUpgradeParagon(player.prog, affinityId)) return;
    if (!player.prog.paragon) {
      player.prog.paragon = { solari_radiance: 0, umbri_shadowcraft: 0, terra_bulwark: 0, aether_chronoflux: 0 };
    }
    player.prog.paragonPoints = (player.prog.paragonPoints || 0) - 1;
    player.prog.paragon[affinityId] = (player.prog.paragon[affinityId] || 0) + 1;
    const prevMax = player.maxHp;
    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - prevMax));
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
    this.parties.syncPlayerVitals(player.id);
  },

  handleAllocateStat(player, statKey) {
    if (player.prog.statPoints <= 0 || !(statKey in player.prog.stats)) return;
    player.prog.statPoints--;
    player.prog.stats[statKey]++;
    const prevMax = player.maxHp;
    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - prevMax));
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
    this.parties.syncPlayerVitals(player.id);
  },

  handleUpgradeSkill(player, abilityId) {
    if (!abilityId) return;
    const spec = ABILITIES_CATALOG[abilityId];
    if (!spec) return;
    if (!canUpgradeAbility(player.prog, abilityId)) return;

    player.prog.skillPoints = Math.max(0, (player.prog.skillPoints || 0) - 1);
    if (!player.prog.skills) player.prog.skills = {};
    player.prog.skills[abilityId] = Math.min(spec.maxRank || 5, (player.prog.skills[abilityId] || 0) + 1);

    for (const [slotStr, abId] of Object.entries(player.loadout || {})) {
      if (abId === abilityId) {
        player.prog.ranks[slotStr] = player.prog.skills[abilityId];
      }
    }

    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
  },

  handleUpgradeRank(player, slot) {
    const spec = getSlotAbilitySpec(player.loadout, slot);
    if (spec && spec.id) {
      return this.handleUpgradeSkill(player, spec.id);
    }
    if (player.prog.skillPoints <= 0 || !(slot in player.prog.ranks)) return;
    if (player.prog.ranks[slot] >= 5) return;
    player.prog.skillPoints--;
    player.prog.ranks[slot]++;
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
  },

  handleResetProgression(player) {
    player.prog = createDefaultProgression();
    player.maxHp = calcMaxHp(player.prog, player.equipment, player.classId);
    player.hp = player.maxHp;
    player.maxSolarCharge = calcMaxGlimmer(player.prog, player.equipment, player.classId);
    this.accounts.saveProgression(player.id, player.prog);
    player.send({
      type: 'progression_sync',
      progression: player.prog,
      hp: player.hp,
      maxHp: player.maxHp,
      maxSolarCharge: player.maxSolarCharge,
    });
  },
};
