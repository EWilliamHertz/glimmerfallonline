// ==========================================
// RoomManager — Social Chat/Emotes, 20Hz World Simulation Tick & Snapshots
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
  ChatSpamFilter,
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

export const socialAndTickMethods = {
  // ==========================================
  // Social Layer: Chat, Faction (/f), Party (/p), Order (/o), /siege & Emotes
  // ==========================================
  handleChat(room, sender, rawChannel, rawText) {
    let text = String(rawText || '').trim().slice(0, 140);
    if (!text) return;

    let channel = rawChannel || 'say';

    if (text.startsWith('/')) {
      const spaceIdx = text.indexOf(' ');
      const cmd = (spaceIdx === -1 ? text.slice(1) : text.slice(1, spaceIdx)).toLowerCase();
      const arg = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

      if (cmd === 'f' || cmd === 'faction') {
        channel = 'faction';
        text = arg;
      } else if (cmd === 'p' || cmd === 'party') {
        channel = 'party';
        text = arg;
      } else if (cmd === 'o' || cmd === 'g' || cmd === 'order' || cmd === 'guild') {
        channel = 'order';
        text = arg;
      } else if (cmd === 's' || cmd === 'say') {
        channel = 'say';
        text = arg;
      } else if (cmd === 'invite' || cmd === 'inv') {
        this.parties.invitePlayer(sender, arg);
        return;
      } else if (cmd === 'leave') {
        this.parties.leaveParty(sender);
        return;
      } else if (cmd === 'trade' || cmd === 'tr') {
        this.trades?.handleRequest(sender, arg);
        return;
      } else if (cmd === 'duel') {
        this.duels?.handleRequest(sender, arg);
        return;
      } else if (cmd === 'inspect') {
        this.handleInspectPlayer(sender, arg);
        return;
      } else if (cmd === 'siege') {
        const wz = Array.from(this.rooms.values()).find((r) => r.type === ROOM_TYPES.NEXUS_WARZONE);
        if (wz) this.spawnWarzoneSiegeShard(wz, true);
        return;
      } else if (EMOTES_CATALOG[cmd]) {
        if (room) this.handleEmote(room, sender, cmd);
        return;
      }
    }

    if (!text) return;

    if (!this.chatSpamFilter) {
      this.chatSpamFilter = new ChatSpamFilter();
    }
    const checkRes = this.chatSpamFilter.checkMessage(sender.id, text);
    if (!checkRes.allow) {
      sender.send({
        type: 'sys_msg',
        category: 'combat',
        text: checkRes.reason,
      });
      return;
    }
    text = checkRes.text;

    const packet = {
      type: 'chat_msg',
      channel,
      senderId: sender.id,
      senderName: sender.displayName,
      faction: sender.faction,
      orderTag: sender.orderTag,
      text,
      ts: Date.now(),
    };

    if (channel === 'faction') {
      for (const c of this.clients.values()) {
        if (c.faction === sender.faction) c.send(packet);
      }
    } else if (channel === 'party') {
      const party = this.parties.getPartyForPlayer(sender.id);
      if (!party) {
        sender.send({ type: 'sys_msg', category: 'party', text: '[Party] You are not in a squad yet! Click a player or type /invite <name>.' });
        return;
      }
      this.parties.broadcastToParty(party.id, packet);
    } else if (channel === 'order') {
      const tag = sender.orderTag;
      if (!tag || tag === 'NONE') {
        sender.send({ type: 'sys_msg', category: 'chat', text: '[Order] Set an Order Banner in [G] Account first!' });
        return;
      }
      for (const c of this.clients.values()) {
        if (c.orderTag === tag) c.send(packet);
      }
    } else {
      sender.speechBubble = {
        text: text.slice(0, 68),
        expiresAt: Date.now() + 5500,
      };
      if (room) this.broadcastToRoom(room, packet);
      else sender.send(packet);
    }
  },

  handleEmote(room, sender, emoteId) {
    const em = EMOTES_CATALOG[emoteId];
    if (!em) return;
    sender.activeEmote = { emoteId, expiresAt: Date.now() + 3600 };
    this.broadcastToRoom(room, {
      type: 'emote_fx',
      playerId: sender.id,
      playerName: sender.displayName,
      faction: sender.faction,
      emoteId,
      icon: em.icon,
      emoteText: em.text,
    });
  },

  // ==========================================
  // 20 Hz Tick Simulation Loop
  // ==========================================
  tickAllRooms() {
    this.processMatchmaking();
    const dt = TICK_MS / 1000;
    const now = Date.now();
    this.duels?.tick(dt);

    for (const room of this.rooms.values()) {
      this.tickRoom(room, dt, now);
    }
  },

  tickRoom(room, dt, now) {
    // Early exit for unoccupied rooms (except Warzone to process siege timers)
    if (room.players.size === 0 && room.type !== ROOM_TYPES.NEXUS_WARZONE) return;

    // Scheduled 30-Minute Warzone Siege Event Trigger
    if (room.type === ROOM_TYPES.NEXUS_WARZONE && room.siege) {
      if (!room.siege.active && now >= room.siege.nextSiegeAt) {
        this.spawnWarzoneSiegeShard(room, true);
      }
    }

    // Day 3: timed Mythic keystone runs
    if (room.mythic?.active) this.tickMythic(room, dt);

    for (const p of room.players.values()) {
      for (const k in p.cooldowns) {
        if (p.cooldowns[k] > 0) p.cooldowns[k] = Math.max(0, p.cooldowns[k] - dt);
      }
      if (p.portalCooldown > 0) p.portalCooldown = Math.max(0, p.portalCooldown - dt);
      if (p.shield > 0) {
        p.shieldTimer -= dt;
        if (p.shieldTimer <= 0) p.shield = 0;
      }
      if (p.weakenTimer > 0) p.weakenTimer = Math.max(0, p.weakenTimer - dt);
      if (p.slowTimer > 0) p.slowTimer = Math.max(0, p.slowTimer - dt);
      if (p.snareTimer > 0) p.snareTimer = Math.max(0, p.snareTimer - dt);
      if (p.freezeTimer > 0) p.freezeTimer = Math.max(0, p.freezeTimer - dt);
      if (p.stealthedTimer > 0) p.stealthedTimer = Math.max(0, p.stealthedTimer - dt);
      if (p.thornbarkTimer > 0) p.thornbarkTimer = Math.max(0, p.thornbarkTimer - dt);
      if (p.zenithTimer > 0) p.zenithTimer = Math.max(0, p.zenithTimer - dt);
      if (p.rebukeTimer > 0) p.rebukeTimer = Math.max(0, p.rebukeTimer - dt);
      if (p.auroraStrideTimer > 0) p.auroraStrideTimer = Math.max(0, p.auroraStrideTimer - dt);
      if (p.solarAscensionTimer > 0) {
        p.solarAscensionTimer = Math.max(0, p.solarAscensionTimer - dt);
        p.ascensionPulse = (p.ascensionPulse || 0) + dt;
        if (p.ascensionPulse >= 1.2) {
          p.ascensionPulse = 0;
          room.fxQueue.push({ kind: 'spark', x: p.x, y: p.y - 6, colors: ['#facc15', '#fef08a', '#ffffff'], count: 12 });
          for (const h of this.getAllHostilesInRadius(room, p, p.x, p.y, 64)) {
            this.applyAuthoritativeDamage(room, p, h, 6, false, 'Solar Radiance Pulse', false);
          }
        }
      }
      if (p.abyssalShroudTimer > 0) p.abyssalShroudTimer = Math.max(0, p.abyssalShroudTimer - dt);
      if (p.voidformTimer > 0) p.voidformTimer = Math.max(0, p.voidformTimer - dt);
      if (p.rootedBastionTimer > 0) p.rootedBastionTimer = Math.max(0, p.rootedBastionTimer - dt);
      if (p.treantFormTimer > 0) p.treantFormTimer = Math.max(0, p.treantFormTimer - dt);
      if (p.phaseShiftTimer > 0) p.phaseShiftTimer = Math.max(0, p.phaseShiftTimer - dt);
      if (p.temporalApotheosisTimer > 0) p.temporalApotheosisTimer = Math.max(0, p.temporalApotheosisTimer - dt);

      // Vitality Health Regeneration (+2.5 HP/s baseline + 0.5 HP/s per Terra Bulwark point)
      const hpRegen = calcHpRegenPerSec(p.prog);
      if (hpRegen > 0 && !p.isDead && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + hpRegen * dt);
      }

      // Baseline Glimmer resonance recovery (+3.5 Glimmer/s)
      if (!p.isDead && p.solarCharge < p.maxSolarCharge) {
        p.solarCharge = Math.min(p.maxSolarCharge, p.solarCharge + 3.5 * dt);
      }

      if (p.speechBubble && p.speechBubble.expiresAt <= now) p.speechBubble = null;
      if (p.activeEmote && p.activeEmote.expiresAt <= now) p.activeEmote = null;

      if (p.isDead) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.isDead = false;
          p.hp = p.maxHp;
          p.shield = 0;
          p.solarCharge = 0;
          if (room.type === ROOM_TYPES.ARENA_3V3) {
            const cfg = ROOM_CONFIGS[room.type] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
            p.x = cfg.spawnX;
            p.y = p.team === 'red' ? -170 : cfg.spawnY;
            p.send({ type: 'player_respawned', x: p.x, y: p.y, hp: p.hp, roomType: room.type });
            this.parties?.syncPlayerVitals(p.id);
          } else {
            const sanctCfg = ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
            if (room.type !== ROOM_TYPES.SANCTUARY_HUB) {
              this.joinRoom(p, ROOM_TYPES.SANCTUARY_HUB, null, sanctCfg.spawnX, sanctCfg.spawnY, 'up');
              p.send({
                type: 'sys_msg',
                category: 'combat',
                text: '🛡️ [Awakening] Re-anchored at Sanctuary Hub!',
              });
            } else {
              p.x = sanctCfg.spawnX;
              p.y = sanctCfg.spawnY;
              p.dir = 'up';
              p.send({ type: 'player_respawned', x: p.x, y: p.y, hp: p.hp, roomType: ROOM_TYPES.SANCTUARY_HUB });
              this.parties?.syncPlayerVitals(p.id);
            }
          }
        }
        continue;
      }

      if (p.castState) {
        if (p.isDead || p.freezeTimer > 0) {
          p.castState = null;
          p.send({ type: 'cast_cancel' });
        } else if (Math.hypot(p.x - p.castState.castX, p.y - p.castState.castY) > 16) {
          p.castState = null;
          p.send({ type: 'cast_cancel' });
          room.fxQueue.push({ kind: 'fct', x: p.x, y: p.y - 12, text: 'INTERRUPTED!', color: '#f87171' });
        } else {
          p.castState.remaining -= dt;
          if (p.castState.remaining <= 0) {
            const cs = p.castState;
            p.castState = null;
            this.executeAuthoritativeRite(room, p, cs);
          }
        }
      }

      // Check Waygate / Rift Portals & Seamless Boundary Transitions in Room
      if (p.portalCooldown <= 0) {
        // Seamless Boundary Transitions across the expanded 48x48 perimeter (Center Border Crossing)
        if (room.edgeTransitions) {
          const pad = 14;
          const GATE_HALF_WIDTH = 72; // Center road opening
          if (p.x >= room.halfW - pad && room.edgeTransitions.east && Math.abs(p.y) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.east;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = targetCfg ? -targetCfg.halfW + 56 : 56;
            const newY = Math.max(-36, Math.min(36, p.y));
            this.joinRoom(p, dest, null, newX, newY, 'right');
            continue;
          }
          if (p.x <= -room.halfW + pad && room.edgeTransitions.west && Math.abs(p.y) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.west;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = targetCfg ? targetCfg.halfW - 56 : -56;
            const newY = Math.max(-36, Math.min(36, p.y));
            this.joinRoom(p, dest, null, newX, newY, 'left');
            continue;
          }
          if (p.y <= -room.halfH + pad && room.edgeTransitions.north && Math.abs(p.x) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.north;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = Math.max(-36, Math.min(36, p.x));
            const newY = targetCfg ? targetCfg.halfH - 56 : -56;
            this.joinRoom(p, dest, null, newX, newY, 'up');
            continue;
          }
          if (p.y >= room.halfH - pad && room.edgeTransitions.south && Math.abs(p.x) <= GATE_HALF_WIDTH) {
            p.portalCooldown = 1.0;
            const dest = room.edgeTransitions.south;
            if (!p.portalQuestDone && dest === ROOM_TYPES.NEXUS_WARZONE) {
              p.portalQuestDone = true;
              this.awardPlayerXP(p, 40, 'Entered Nexus Warzone');
            }
            const targetCfg = ROOM_CONFIGS[dest];
            const newX = Math.max(-36, Math.min(36, p.x));
            const newY = targetCfg ? -targetCfg.halfH + 56 : 56;
            this.joinRoom(p, dest, null, newX, newY, 'down');
            continue;
          }
        }
      }
    }

    if (room.players.size === 0) return;

    // 2. AI Allies in 3v3 Arena
    for (const ally of room.allies) {
      const foes = [];
      for (const e of room.entities) {
        if (!e.isDying && (e.type === 'mob' || e.id === 'red_nexus')) foes.push({ kind: 'entity', ref: e });
      }
      for (const p of room.players.values()) {
        if (!p.isDead && p.stealthedTimer <= 0 && p.team === 'red') foes.push({ kind: 'player', ref: p });
      }
      if (foes.length === 0) continue;
      foes.sort((a, b) => Math.hypot(a.ref.x - ally.x, a.ref.y - ally.y) - Math.hypot(b.ref.x - ally.x, b.ref.y - ally.y));
      const tgt = foes[0];
      const d = Math.hypot(tgt.ref.x - ally.x, tgt.ref.y - ally.y);
      if (d > ally.range) {
        ally.x += ((tgt.ref.x - ally.x) / d) * ally.speed * dt;
        ally.y += ((tgt.ref.y - ally.y) / d) * ally.speed * dt;
      } else {
        ally.cd -= dt;
        if (ally.cd <= 0) {
          ally.cd = 1.9 + Math.random() * 0.4;
          room.projectiles.push({
            id: `prj_${crypto.randomUUID().slice(0, 6)}`,
            type: 'orb',
            ownerId: null,
            team: 'blue',
            x: ally.x,
            y: ally.y - 8,
            targetKey: tgt.kind === 'player' ? `p_${tgt.ref.id}` : tgt.ref.id,
            speed: 195,
            color: ally.spriteKey === 'allyMage' ? '#38bdf8' : '#4ade80',
            dmg: ally.dmg || 2,
          });
        }
      }
    }

    // 3. Entities (Mobs, Bosses, Nodes)
    for (let i = room.entities.length - 1; i >= 0; i--) {
      const e = room.entities[i];
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.weakenTimer > 0) e.weakenTimer = Math.max(0, e.weakenTimer - dt);
      if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
      if (e.snareTimer > 0) e.snareTimer = Math.max(0, e.snareTimer - dt);
      if (e.freezeTimer > 0) e.freezeTimer = Math.max(0, e.freezeTimer - dt);

      if (e.type === 'node' && e.charges === 0 && e.rechargeTimer > 0) {
        e.rechargeTimer -= dt;
        if (e.rechargeTimer <= 0) e.charges = e.maxCharges;
      }

      if (e.isDying) {
        e.deathAge += dt;
        e.y -= 18 * dt;
        if (e.deathAge >= 0.65) room.entities.splice(i, 1);
        continue;
      }

      if (e.type === 'mob') {
        if (e.freezeTimer > 0) continue; // Frozen by Frost Nova!

        if (e.spawnAggroGrace > 0) {
          e.spawnAggroGrace = Math.max(0, e.spawnAggroGrace - dt);
          continue; // Grace period after respawn: completely peaceful
        }

        let nearestPlayer = null;
        let bestD = Infinity;
        for (const p of room.players.values()) {
          if (p.isDead || p.stealthedTimer > 0) continue; // Stealth drops mob aggro!
          if (room.type === ROOM_TYPES.ARENA_3V3 && p.team === 'red') continue;
          const d = Math.hypot(p.x - e.x, p.y - e.y);
          if (d < bestD) {
            bestD = d;
            nearestPlayer = p;
          }
        }

        const origX = e.origX ?? e.x;
        const origY = e.origY ?? e.y;
        const distHome = Math.hypot(origX - e.x, origY - e.y);

        if (!nearestPlayer && e.inCombat) {
          e.inCombat = false;
          e.targetPlayerId = null;
        } else if (e.inCombat && nearestPlayer && bestD > (e.aggroRange || 110) * 1.8 && distHome > 120) {
          // Player broke pursuit tether — drop aggro
          e.inCombat = false;
          e.targetPlayerId = null;
        } else if (nearestPlayer && !e.inCombat && bestD <= (e.aggroRange || 110)) {
          e.inCombat = true;
          e.targetPlayerId = nearestPlayer.id;
          room.fxQueue.push({ kind: 'fct', x: e.x, y: e.y - 12, text: 'AGGRO!', color: '#ef4444' });
        }

        const speedMult = e.snareTimer > 0 ? 0.35 : e.slowTimer > 0 ? 0.55 : 1.0;

        if (e.inCombat && nearestPlayer) {
          if (e.isBoss && !e.isDying) {
            const hpPercent = (e.hp / e.maxHp) * 100;
            e.phase = e.phase || 1;

            // Phase 2: Frenzy & Minions at 65% HP
            if (hpPercent <= 65 && e.phase === 1) {
              e.phase = 2;
              e.baseDamage = e.baseDamage || e.damage || 7;
              e.damage = Math.floor(e.baseDamage * 1.35);
              e.speed = Math.floor((e.speed || 38) * 1.15);
              this.broadcastToRoom(room, {
                type: 'chat',
                channel: 'world',
                sender: 'WORLD EVENT',
                text: `⚡ ${e.name} roars into Phase 2, summoning guardians!`,
              });
              room.fxQueue.push({ kind: 'smoke', x: e.x, y: e.y, count: 32 });
              for (let m = 0; m < 3; m++) {
                const minion = {
                  id: `${e.id}_m_${Date.now()}_${m}`,
                  name: `${e.name} Guardian`,
                  sub: 'Boss Minion',
                  type: 'mob',
                  isMinion: true,
                  spriteKey: e.spriteKey === 'solariBoss' ? 'solariSentinel' : e.spriteKey === 'umbriBoss' ? 'duskFiend' : 'voidStalker',
                  x: e.x + (Math.random() * 40 - 20),
                  y: e.y + (Math.random() * 40 - 20),
                  origX: e.x,
                  origY: e.y,
                  hp: Math.max(15, Math.round(e.maxHp * 0.18)),
                  maxHp: Math.max(15, Math.round(e.maxHp * 0.18)),
                  damage: Math.max(2, Math.round((e.damage || 6) * 0.5)),
                  xpReward: 35,
                  speed: 52,
                  aggroRange: 150,
                  attackRange: 28,
                  radius: 14,
                  hitFlash: 0,
                  dammers: new Set(),
                };
                room.entities.push(minion);
                room.fxQueue.push({ kind: 'smoke', x: minion.x, y: minion.y, count: 16 });
              }
            }

            // Phase 3: Enrage & Area Shockwaves at 40% HP (Shattered Nexus cannot enrage)
            const isNexusShard = e.type === 'siege_shard' || e.id === 'siege_shard' || (e.name && e.name.includes('Nexus'));
            if (isNexusShard) {
              e.enraged = false;
            } else if (hpPercent <= 40 && e.phase === 2) {
              e.phase = 3;
              e.enraged = true;
              e.baseDamage = e.baseDamage || e.damage || 7;
              e.damage = Math.floor(e.baseDamage * 1.6);
              e.speed = Math.floor((e.speed || 38) * 1.25);
              this.broadcastToRoom(room, {
                type: 'chat',
                channel: 'world',
                sender: 'WORLD EVENT',
                text: `🔥 BEWARE: ${e.name} has ENRAGED! Ground shockwaves inbound!`,
              });
              room.fxQueue.push({ kind: 'smoke', x: e.x, y: e.y, count: 48 });
            }

            // Boss Telegraphed AoE Ability (1.4-1.7s warning circle)
            e.abilityCooldown = (e.abilityCooldown ?? (e.enraged ? 3.5 : 5.8)) - dt;
            if (e.abilityCooldown <= 0) {
              e.abilityCooldown = e.enraged ? 3.5 : 5.8;
              let telLabel = e.enraged ? '💥 ENRAGED CATACLYSM' : '⚡ TITAN SLAM';
              let telColor = e.enraged ? '#ef4444' : '#f59e0b';
              let shockRadius = e.enraged ? 98 : 70;
              let warnDuration = 1.6;

              if (e.spriteKey === 'solariBoss') {
                telLabel = e.enraged ? '🔥 CORONA CATACLYSM' : '☀️ SOLAR FLARE BURST';
                telColor = '#facc15';
                shockRadius = e.enraged ? 102 : 74;
              } else if (e.spriteKey === 'umbriBoss') {
                telLabel = e.enraged ? '💀 VOID SINGULARITY' : '🌑 SHADOW RIFT';
                telColor = '#a855f7';
                shockRadius = e.enraged ? 94 : 68;
                warnDuration = 1.5;
              } else if (e.spriteKey === 'graniteBoss') {
                telLabel = e.enraged ? '🪨 TECTONIC COLLAPSE' : '🌿 IRONWOOD SLAM';
                telColor = '#4ade80';
                shockRadius = e.enraged ? 106 : 78;
                warnDuration = 1.7;
              } else if (e.spriteKey === 'aetherBoss') {
                telLabel = e.enraged ? '🌀 CHRONO SINGULARITY' : '⚡ TEMPORAL DISRUPTION';
                telColor = '#38bdf8';
                shockRadius = e.enraged ? 96 : 70;
                warnDuration = 1.4;
              } else if (e.spriteKey === 'starfallBoss') {
                telLabel = e.enraged ? '☄️ SUPERMASSIVE METEOR IMPACT' : '🔥 STARFALL ORBITAL STRIKE';
                telColor = '#fb923c';
                shockRadius = e.enraged ? 108 : 80;
                warnDuration = 1.55;
              } else if (e.spriteKey === 'abyssalArchitectBoss') {
                telLabel = e.enraged ? '🌌 ABYSSAL REALITY COLLAPSE' : '💀 VOIDSTAR ANNIHILATION';
                telColor = '#e879f9';
                shockRadius = e.enraged ? 112 : 84;
                warnDuration = 1.5;
              }

              const shockDmg = Math.round((e.damage || 7) * (e.enraged ? 1.9 : 1.35));
              const tgtX = nearestPlayer && Math.random() < 0.65 ? nearestPlayer.x : e.x;
              const tgtY = nearestPlayer && Math.random() < 0.65 ? nearestPlayer.y : e.y;

              room.fxQueue.push({
                kind: 'fct',
                x: tgtX,
                y: tgtY - 14,
                text: `⚠️ ${telLabel}!`,
                color: telColor,
                isCrit: true,
              });

              room.groundZones.push({
                id: `tel_${crypto.randomUUID().slice(0, 6)}`,
                type: 'telegraph',
                color: telColor,
                label: telLabel,
                x: tgtX,
                y: tgtY,
                radius: shockRadius,
                age: 0,
                maxAge: warnDuration,
                damage: shockDmg,
                bossName: e.name,
                bossRef: e,
                snare: e.spriteKey === 'graniteBoss' ? 2.0 : 0,
              });
            }
          } else if (e.eliteAffix || (e.maxHp >= 100 && e.type === 'mob')) {
            // High-tier / Elite Monster Telegraphed Ability (1.2-1.45s reactive dodge ring)
            e.eliteAbilityCooldown = (e.eliteAbilityCooldown ?? (5.0 + Math.random() * 3.5)) - dt;
            if (e.eliteAbilityCooldown <= 0) {
              e.eliteAbilityCooldown = 7.5 + Math.random() * 4.0;
              let telLabel = '⚡ LEYLINE SURGE';
              let telColor = '#facc15';
              let shockRadius = 46;
              let warnDuration = 1.35;
              let snare = 0;

              if (e.eliteAffix === 'molten' || e.spriteKey === 'solariSentinel') {
                telLabel = e.eliteAffix === 'molten' ? '🌋 MAGMA ERUPTION' : '☀️ SOLAR SMITE';
                telColor = '#f97316';
                shockRadius = 48;
                warnDuration = 1.3;
              } else if (e.eliteAffix === 'voidtouched' || e.spriteKey === 'voidStalker' || e.spriteKey === 'duskFiend') {
                telLabel = '🌑 VOID CONVERGENCE';
                telColor = '#c084fc';
                shockRadius = 50;
                warnDuration = 1.35;
              } else if (e.eliteAffix === 'frostweaver') {
                telLabel = '❄️ FROST NOVA';
                telColor = '#38bdf8';
                shockRadius = 52;
                warnDuration = 1.4;
                snare = 1.8;
              } else if (e.eliteAffix === 'electrified' || e.spriteKey === 'aetherWeaver') {
                telLabel = '⚡ LIGHTNING STRIKE';
                telColor = '#facc15';
                shockRadius = 45;
                warnDuration = 1.2;
              } else if (e.spriteKey === 'terraWarden') {
                telLabel = '🌿 SEISMIC TREMOR';
                telColor = '#4ade80';
                shockRadius = 50;
                warnDuration = 1.4;
                snare = 1.5;
              }

              const shockDmg = Math.max(3, Math.round((e.damage || 5) * 1.45));
              const tgtX = nearestPlayer ? nearestPlayer.x : e.x;
              const tgtY = nearestPlayer ? nearestPlayer.y : e.y;

              room.fxQueue.push({
                kind: 'fct',
                x: tgtX,
                y: tgtY - 14,
                text: `⚠️ ${telLabel}!`,
                color: telColor,
                isCrit: true,
              });

              room.groundZones.push({
                id: `tel_${crypto.randomUUID().slice(0, 6)}`,
                type: 'telegraph',
                color: telColor,
                label: telLabel,
                x: tgtX,
                y: tgtY,
                radius: shockRadius,
                age: 0,
                maxAge: warnDuration,
                damage: shockDmg,
                bossName: e.name,
                bossRef: e,
                snare,
              });
            }
          }

          const origX = e.origX ?? e.x;
          const origY = e.origY ?? e.y;
          const distHome = Math.hypot(origX - e.x, origY - e.y);
          if (room.type !== ROOM_TYPES.ARENA_3V3 && distHome > 240) {
            e.inCombat = false;
            e.x = origX;
            e.y = origY;
            e.hp = e.maxHp;
            e.dammers = new Set();
            room.fxQueue.push({ kind: 'fct', x: e.x, y: e.y, text: 'EVADED', color: '#94a3b8' });
            continue;
          }

          if (bestD > e.attackRange) {
            const nextMobX = e.x + ((nearestPlayer.x - e.x) / bestD) * e.speed * speedMult * dt;
            const nextMobY = e.y + ((nearestPlayer.y - e.y) / bestD) * e.speed * speedMult * dt;
            if (!isWaterTile(nextMobX, nextMobY, room.type)) {
              e.x = nextMobX;
              e.y = nextMobY;
            } else if (!isWaterTile(nextMobX, e.y, room.type)) {
              e.x = nextMobX;
            } else if (!isWaterTile(e.x, nextMobY, room.type)) {
              e.y = nextMobY;
            }
          } else {
            e.atkTimer = (e.atkTimer || 0) + dt;
            const bossAtkInterval = e.enraged ? 1.85 / 1.35 : 1.85; // Phase 3 enrage: +35% attack speed
            if (e.atkTimer >= bossAtkInterval) {
              e.atkTimer = 0;
              const rawDmg = Math.max(1, (e.damage || 3) - (e.weakenTimer > 0 ? 2 : 0));
              this.damagePlayerSession(room, nearestPlayer, rawDmg, e.name, false, e);
            }
          }
        } else if (room.type === ROOM_TYPES.ARENA_3V3) {
          const blueNexus = room.entities.find((n) => n.id === 'blue_nexus' && !n.isDying);
          if (blueNexus) {
            const dn = Math.hypot(blueNexus.x - e.x, blueNexus.y - e.y);
            if (dn > 32) {
              e.x += ((blueNexus.x - e.x) / dn) * e.speed * speedMult * dt;
              e.y += ((blueNexus.y - e.y) / dn) * e.speed * speedMult * dt;
            } else {
              e.atkTimer = (e.atkTimer || 0) + dt;
              if (e.atkTimer >= 2.0) {
                e.atkTimer = 0;
                this.applyAuthoritativeDamage(room, null, { kind: 'entity', ref: blueNexus }, 2, false, e.name, false);
              }
            }
          }
        }
      }
    }

    // 4. Projectiles
    for (let i = room.projectiles.length - 1; i >= 0; i--) {
      const prj = room.projectiles[i];
      const owner = prj.ownerId ? room.players.get(prj.ownerId) : null;
      let targetObj = null;
      if (String(prj.targetKey).startsWith('p_')) {
        const tp = room.players.get(String(prj.targetKey).slice(2));
        if (tp && !tp.isDead) targetObj = { kind: 'player', ref: tp };
      } else {
        const te = room.entities.find((e) => e.id === prj.targetKey && !e.isDying);
        if (te) targetObj = { kind: 'entity', ref: te };
      }

      if (!targetObj) {
        room.projectiles.splice(i, 1);
        continue;
      }

      const dx = targetObj.ref.x - prj.x;
      const dy = targetObj.ref.y - 8 - prj.y;
      const d = Math.hypot(dx, dy);
      prj.rot = (prj.rot || 0) + 18 * dt;
      if (d < 12) {
        this.applyAuthoritativeDamage(
          room,
          owner,
          targetObj,
          prj.dmg,
          false,
          prj.spellName || 'Aetheric Blast',
          Boolean(prj.isRite)
        );
        if (owner && prj.type === 'boulder' && owner.faction === 'Terra') {
          for (const near of this.getAllHostilesInRadius(room, owner, targetObj.ref.x, targetObj.ref.y, 48)) {
            if (near.ref !== targetObj.ref) {
              this.applyAuthoritativeDamage(room, owner, near, Math.max(2, Math.round(prj.dmg * 0.4)), false, 'Overwhelm', false);
            }
          }
        }
        room.projectiles.splice(i, 1);
      } else {
        prj.x += (dx / d) * prj.speed * dt;
        prj.y += (dy / d) * prj.speed * dt;
      }
    }

    // 5. Ground Zones (Consecration, Nightfall Plague, Briar Snare, Gravity Well, Shockwaves)
    for (let i = room.groundZones.length - 1; i >= 0; i--) {
      const gz = room.groundZones[i];
      gz.age += dt;
      if (['consecration', 'plague', 'briar', 'gravity'].includes(gz.type)) {
        const caster = room.players.get(gz.ownerId) || null;
        if (caster && gz.type === 'gravity') {
          for (const h of this.getAllHostilesInRadius(room, caster, gz.x, gz.y, gz.radius)) {
            if (h.kind === 'entity' && h.ref.isDying) continue;
            const dist = Math.hypot(gz.x - h.ref.x, gz.y - h.ref.y);
            if (dist > 10 && (h.kind === 'player' || h.ref.type === 'mob')) {
              h.ref.x += ((gz.x - h.ref.x) / dist) * 28 * dt;
              h.ref.y += ((gz.y - h.ref.y) / dist) * 28 * dt;
            }
          }
        }
        gz.tickTimer -= dt;
        if (gz.tickTimer <= 0) {
          gz.tickTimer = 1.4;
          if (caster) {
            for (const h of this.getAllHostilesInRadius(room, caster, gz.x, gz.y, gz.radius)) {
              if (h.kind === 'entity' && h.ref.isDying) continue;
              if (gz.type === 'plague') h.ref.slowTimer = 1.8;
              if (gz.type === 'briar') h.ref.snareTimer = 1.8;
              this.applyAuthoritativeDamage(room, caster, h, gz.tickDmg, false, gz.spellName || 'Ground Rite', true);
            }
          }
        }
      }
      if (gz.age >= gz.maxAge) {
        if (gz.type === 'telegraph') {
          // Detonation shockwave
          room.groundZones.push({
            id: `shock_${crypto.randomUUID().slice(0, 6)}`,
            type: 'shockwave',
            color: gz.color || '#ef4444',
            x: gz.x,
            y: gz.y,
            radius: gz.radius,
            age: 0,
            maxAge: 0.35,
          });
          room.fxQueue.push({ kind: 'smoke', x: gz.x, y: gz.y, count: 28 });
          for (const p of room.players.values()) {
            if (p.isDead || p.stealthed) continue;
            const distP = Math.hypot(gz.x - p.x, gz.y - p.y);
            if (distP <= gz.radius) {
              this.damagePlayerSession(room, p, gz.damage || 14, `${gz.bossName || 'Boss'} ${gz.label || 'Cataclysm'}`, false, gz.bossRef);
              const ang = Math.atan2(p.y - gz.y, p.x - gz.x);
              p.x = Math.max(-room.halfW + 14, Math.min(room.halfW - 14, p.x + Math.cos(ang) * 24));
              p.y = Math.max(-room.halfH + 14, Math.min(room.halfH - 14, p.y + Math.sin(ang) * 24));
              if (gz.snare) p.snareTimer = Math.max(p.snareTimer || 0, gz.snare);
            }
          }
        }
        room.groundZones.splice(i, 1);
      }
    }

    // 6b. Loot Shard pickups
    this.tickLoot(room, dt);

    // 7. Broadcast 20 Hz Authoritative Snapshot
    const snapshot = this.buildSnapshot(room, now);
    const fx = room.fxQueue.length > 0 ? room.fxQueue.splice(0, room.fxQueue.length) : undefined;
    this.broadcastToRoom(room, {
      type: 'world_state',
      roomId: room.id,
      onlineTotal: this.clients.size,
      ...snapshot,
      fx,
    });
  },

  buildSnapshot(room, now = Date.now()) {
    const players = [];
    for (const p of room.players.values()) {
      players.push({
        id: p.id,
        name: p.displayName,
        faction: p.faction,
        classId: p.classId,
        equipment: p.equipment,
        orderTag: p.orderTag,
        orderColor: p.orderColor,
        tcgLinked: p.tcgLinked,
        level: p.prog?.level || 1,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        z: Math.round(p.z),
        dir: p.dir,
        isMoving: p.isMoving,
        hp: p.hp,
        maxHp: p.maxHp,
        shield: p.shield,
        solarCharge: p.solarCharge,
        maxSolarCharge: p.maxSolarCharge,
        isDead: p.isDead,
        isCasting: Boolean(p.castState),
        stealthed: p.stealthedTimer > 0,
        thornbark: p.thornbarkTimer > 0,
        zenith: p.zenithTimer > 0,
        frozen: p.freezeTimer > 0,
        team: p.team,
        bubble: p.speechBubble ? p.speechBubble.text : null,
        emote: p.activeEmote ? p.activeEmote.emoteId : null,
      });
    }

    const entities = room.entities.map((e) => ({
      id: e.id,
      name: e.name,
      sub: e.sub,
      type: e.type,
      skillingType: e.skillingType || null,
      eliteAffix: e.eliteAffix || null,
      targetRoom: e.targetRoom,
      faction: e.faction,
      team: e.team,
      isBoss: e.isBoss || false,
      isGrand: Boolean(e.isGrand),
      affinity: e.affinity,
      buffName: e.buffName,
      spriteKey: e.spriteKey,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      hp: e.hp,
      maxHp: e.maxHp,
      charges: e.charges,
      maxCharges: e.maxCharges,
      radius: e.radius,
      frozen: (e.freezeTimer || 0) > 0,
      inCombat: Boolean(e.inCombat),
      isDying: Boolean(e.isDying),
      deathAge: e.deathAge ? Math.round(e.deathAge * 100) / 100 : 0,
    }));

    const allies = room.allies.map((a) => ({
      id: a.id,
      name: a.name,
      spriteKey: a.spriteKey,
      x: Math.round(a.x * 10) / 10,
      y: Math.round(a.y * 10) / 10,
    }));

    const projectiles = room.projectiles.map((prj) => ({
      id: prj.id,
      type: prj.type,
      x: Math.round(prj.x * 10) / 10,
      y: Math.round(prj.y * 10) / 10,
      rot: Math.round((prj.rot || 0) * 100) / 100,
      color: prj.color,
    }));

    const groundZones = room.groundZones.map((gz) => ({
      id: gz.id,
      type: gz.type,
      color: gz.color,
      label: gz.label || '',
      x: Math.round(gz.x),
      y: Math.round(gz.y),
      radius: Math.round(gz.radius),
      age: Math.round(gz.age * 100) / 100,
      maxAge: gz.maxAge,
    }));

    const banners = [];

    let siegeState = undefined;
    if (room.siege) {
      const shard = room.entities.find((e) => e.id === 'siege_shard' && !e.isDying);
      siegeState = {
        active: Boolean(shard),
        shardHp: shard ? shard.hp : 0,
        shardMaxHp: shard ? shard.maxHp : 85,
        nextInSec: Math.max(0, Math.round((room.siege.nextSiegeAt - now) / 1000)),
        lastWinnerFaction: room.siege.lastWinnerFaction,
        lastClaimedBy: room.siege.lastClaimedBy,
      };
    }

    return {
      players,
      entities,
      allies,
      projectiles,
      groundZones,
      banners,
      loot: (room.loot || []).map((l) => ({ id: l.id, kind: l.kind, itemId: l.itemId || null, x: l.x, y: l.y, ttl: Math.round(l.ttl * 10) / 10 })),
      siegeState,
    };
  },
};
