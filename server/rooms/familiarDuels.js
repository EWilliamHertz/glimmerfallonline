// ==========================================
// RoomManager — Phase 5: Echo Familiar Duels (/famduel) & Wild Stray Echoes
// ==========================================

import crypto from 'node:crypto';
import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  EQUIPMENT_CATALOG,
  GLIMMER_CIPHERS_CATALOG,
  NEXUS_FAMILIARS_CATALOG,
  SURFACE_ZONE_PLACEMENT,
  localToWorld,
  FAMILIAR_VARIANTS_CATALOG,
  FAMILIAR_BATTLE_KITS,
  createFamiliarDuelSession,
  executeFamiliarDuelMove,
  resolveFamiliarDuelTimeout,
  pickBotFamiliarDuelMove,
  isFamiliarDuelRoomAllowed,
  normalizeFamiliarState,
  WILD_STRAY_ECHOES_CATALOG,
  pickWildStrayEchoForZone,
  countBagItem,
  deductBagItems,
  addBagItem,
} from '../../shared/protocol.js';
import { getActiveWorldEvent } from '../../shared/worldEvents.js';

const FACTION_STARTER_FAMILIAR = {
  Solari: 'dawnkit_ember_fox',
  Terra: 'mossback_ankyloling',
  Umbri: 'graveglass_wisp_imp',
  Aether: 'chrono_prism_sprite',
};

export const familiarDuelsMethods = {
  getDuelFamiliarForClient(client, allowStarterFallback = false) {
    const famState = normalizeFamiliarState(client?.prog?.familiars);
    const chosen = famState.activeId || famState.unlockedIds[0] || null;
    if (chosen && NEXUS_FAMILIARS_CATALOG[chosen]) {
      return {
        familiarId: chosen,
        variant: famState.activeVariants?.[chosen] || 'default',
      };
    }
    if (allowStarterFallback) {
      return {
        familiarId: FACTION_STARTER_FAMILIAR[client?.faction] || 'dawnkit_ember_fox',
        variant: 'default',
      };
    }
    return null;
  },

  findActiveFamiliarDuelForPlayer(playerId) {
    if (!this.familiarDuels || !playerId) return null;
    for (const duel of this.familiarDuels.values()) {
      if (duel.ended) continue;
      if (duel.fighters.a.ownerId === playerId || duel.fighters.b.ownerId === playerId) {
        return duel;
      }
    }
    return null;
  },

  sendFamDuelStateToParticipants(duel) {
    if (!duel) return;
    const payload = {
      type: 'fam_duel_state',
      duel: {
        id: duel.id,
        isBot: duel.isBot,
        startedAt: duel.startedAt,
        expiresAt: duel.expiresAt,
        ended: duel.ended,
        winnerOwnerId: duel.winnerOwnerId,
        winReason: duel.winReason,
        fighters: duel.fighters,
        log: duel.log,
      },
    };
    const cA = this.clients.get(duel.fighters.a.ownerId);
    const cB = duel.isBot ? null : this.clients.get(duel.fighters.b.ownerId);
    if (cA) cA.send(payload);
    if (cB && cB.id !== cA?.id) cB.send(payload);
  },

  handleFamDuelChallenge(client, msg = {}) {
    if (!client || client.isDead) return;
    if (!this.familiarDuels) this.familiarDuels = new Map();
    if (!this.famDuelInvites) this.famDuelInvites = new Map();

    if (!isFamiliarDuelRoomAllowed(client.roomType, ROOM_CONFIGS[client.roomType])) {
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: '🐾 [Familiar Skirmish] /famduel is only permitted inside Sanctuary Hub or Tavern interiors!',
      });
      return;
    }

    if (this.findActiveFamiliarDuelForPlayer(client.id)) {
      client.send({ type: 'sys_msg', category: 'quest', text: '🐾 You are already in an Echo Familiar Skirmish!' });
      return;
    }

    const cleanTarget = String(msg.targetName || '').trim();
    const isTrainerMode = msg.mode === 'trainer' || !cleanTarget || ['trainer', 'echo_keeper', 'sylvi', 'bot'].includes(cleanTarget.toLowerCase());

    if (isTrainerMode) {
      const famA = this.getDuelFamiliarForClient(client, true);
      const botOptions = Object.keys(NEXUS_FAMILIARS_CATALOG).filter((k) => k !== famA.familiarId);
      const botFamId = NEXUS_FAMILIARS_CATALOG[msg.trainerFamiliarId]
        ? msg.trainerFamiliarId
        : botOptions[Math.floor(Math.random() * botOptions.length)] || 'chrono_prism_sprite';

      const duelId = `famduel_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();
      const duel = createFamiliarDuelSession({
        id: duelId,
        isBot: true,
        startedAt: now,
        fighterA: {
          ownerId: client.id,
          ownerName: client.displayName || 'Summoner',
          familiarId: famA.familiarId,
          variant: famA.variant,
        },
        fighterB: {
          ownerId: `bot_trainer_${duelId}`,
          ownerName: 'Echo Keeper Sylvi',
          familiarId: botFamId,
          variant: 'starlight',
        },
      });
      duel.nextBotMoveAt = now + 1800;
      this.familiarDuels.set(duelId, duel);
      this.sendFamDuelStateToParticipants(duel);
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: `🐾 [Familiar Skirmish] Friendly 60s Echo Duel started vs Echo Keeper Sylvi's ${duel.fighters.b.familiarName}!`,
      });
      return;
    }

    const famA = this.getDuelFamiliarForClient(client, true);
    const target = this.findClientByName(cleanTarget);
    if (!target || target.id === client.id) {
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: `🐾 Could not find online summoner "${cleanTarget}". Try /famduel trainer for a friendly practice duel!`,
      });
      return;
    }
    if (!isFamiliarDuelRoomAllowed(target.roomType, ROOM_CONFIGS[target.roomType])) {
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: `🐾 ${target.displayName} must be in Sanctuary Hub or a Tavern/Interior to accept /famduel.`,
      });
      return;
    }
    if (this.findActiveFamiliarDuelForPlayer(target.id)) {
      client.send({ type: 'sys_msg', category: 'quest', text: `🐾 ${target.displayName} is already in a Familiar Skirmish!` });
      return;
    }

    const inviteId = `faminv_${crypto.randomUUID().slice(0, 6)}`;
    this.famDuelInvites.set(inviteId, {
      id: inviteId,
      fromId: client.id,
      fromName: client.displayName || 'Summoner',
      fromFam: famA,
      toId: target.id,
      expiresAt: Date.now() + 25000,
    });
    target.send({
      type: 'fam_duel_invite',
      inviteId,
      fromId: client.id,
      fromName: client.displayName,
      familiarName: NEXUS_FAMILIARS_CATALOG[famA.familiarId]?.name || 'Nexus Familiar',
    });
    client.send({
      type: 'sys_msg',
      category: 'quest',
      text: `🐾 Sent friendly /famduel invitation to ${target.displayName}!`,
    });
  },

  handleFamDuelRespond(client, msg = {}) {
    if (!client || !this.famDuelInvites) return;
    const inv = this.famDuelInvites.get(String(msg.inviteId || ''));
    if (!inv || inv.toId !== client.id) return;
    this.famDuelInvites.delete(inv.id);

    const challenger = this.clients.get(inv.fromId);
    if (!challenger) {
      client.send({ type: 'sys_msg', category: 'quest', text: '🐾 Challenger went offline.' });
      return;
    }
    if (!msg.accept) {
      challenger.send({ type: 'sys_msg', category: 'quest', text: `🐾 ${client.displayName} declined your /famduel challenge.` });
      return;
    }
    if (!isFamiliarDuelRoomAllowed(client.roomType, ROOM_CONFIGS[client.roomType]) ||
        !isFamiliarDuelRoomAllowed(challenger.roomType, ROOM_CONFIGS[challenger.roomType])) {
      challenger.send({ type: 'sys_msg', category: 'quest', text: '🐾 Both duelists must stay inside Sanctuary or a Tavern.' });
      return;
    }

    const famB = this.getDuelFamiliarForClient(client, true);
    const duelId = `famduel_${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();
    const duel = createFamiliarDuelSession({
      id: duelId,
      isBot: false,
      startedAt: now,
      fighterA: {
        ownerId: challenger.id,
        ownerName: challenger.displayName || 'Summoner',
        familiarId: inv.fromFam.familiarId,
        variant: inv.fromFam.variant,
      },
      fighterB: {
        ownerId: client.id,
        ownerName: client.displayName || 'Summoner',
        familiarId: famB.familiarId,
        variant: famB.variant,
      },
    });
    this.familiarDuels.set(duelId, duel);
    this.sendFamDuelStateToParticipants(duel);
  },

  handleFamDuelMove(client, msg = {}) {
    if (!client || !this.familiarDuels) return;
    const duel = msg.duelId
      ? this.familiarDuels.get(String(msg.duelId))
      : this.findActiveFamiliarDuelForPlayer(client.id);
    if (!duel || duel.ended) return;

    const sideKey = duel.fighters.a.ownerId === client.id
      ? 'a'
      : duel.fighters.b.ownerId === client.id
        ? 'b'
        : null;
    if (!sideKey) return;

    const now = Date.now();
    const res = executeFamiliarDuelMove(duel, sideKey, String(msg.moveKey || 'strike'), now);
    if (!res.ok) {
      client.send({ type: 'sys_msg', category: 'quest', text: `🐾 ${res.reason}` });
      return;
    }

    const room = this.rooms.get(client.roomId);
    if (room?.fxQueue) {
      room.fxQueue.push({
        kind: 'fct',
        x: client.x,
        y: client.y - 26,
        text: `🐾 ${res.moveName.toUpperCase()}${res.dmg > 0 ? ` -${res.dmg}` : ''}`,
        color: '#fde047',
      });
    }

    this.sendFamDuelStateToParticipants(duel);
    if (duel.ended) {
      this.finishFamiliarDuel(duel);
    }
  },

  handleFamDuelForfeit(client, msg = {}) {
    if (!client || !this.familiarDuels) return;
    const duel = msg.duelId
      ? this.familiarDuels.get(String(msg.duelId))
      : this.findActiveFamiliarDuelForPlayer(client.id);
    if (!duel || duel.ended) return;
    const isA = duel.fighters.a.ownerId === client.id;
    const isB = duel.fighters.b.ownerId === client.id;
    if (!isA && !isB) return;

    duel.ended = true;
    duel.winReason = 'forfeit';
    duel.winnerOwnerId = isA ? duel.fighters.b.ownerId : duel.fighters.a.ownerId;
    duel.log = [`🏳️ ${client.displayName} ended the friendly Echo Skirmish.`, ...(duel.log || [])].slice(0, 6);
    this.sendFamDuelStateToParticipants(duel);
    this.finishFamiliarDuel(duel);
  },

  finishFamiliarDuel(duel) {
    if (!duel) return;
    this.familiarDuels?.delete(duel.id);

    const participants = [duel.fighters.a.ownerId, duel.isBot ? null : duel.fighters.b.ownerId]
      .filter(Boolean)
      .map((id) => this.clients.get(id))
      .filter(Boolean);

    for (const p of participants) {
      const won = duel.winnerOwnerId && duel.winnerOwnerId === p.id;
      const draw = !duel.winnerOwnerId;
      const xpGain = won ? 80 : 35;
      const riteXp = won ? 35 : 15;
      this.awardPlayerXP(p, xpGain, won ? 'Echo Skirmish Victory' : 'Echo Skirmish Practice');
      this.awardProfessionXP(p, 'rite_binding', riteXp, 'Echo Familiar Skirmish');

      p.prog.familiars = normalizeFamiliarState(p.prog.familiars);
      if (won) p.prog.familiars.duelWins = (p.prog.familiars.duelWins || 0) + 1;

      p.questState = p.questState || {};
      p.questState.famDuelsCompleted = (p.questState.famDuelsCompleted || 0) + 1;
      this.accounts?.saveQuestState?.(p.id, p.questState);
      this.accounts?.saveProgression?.(p.id, p.prog);
      this.refreshClientFromAccount(p.id);

      p.send({
        type: 'fam_duel_ended',
        duelId: duel.id,
        won: Boolean(won),
        draw: Boolean(draw),
        winnerOwnerId: duel.winnerOwnerId,
        winReason: duel.winReason,
        xpGain,
        riteXp,
        log: duel.log,
      });
    }
  },

  tickFamiliarDuels(now = Date.now()) {
    if (!this.familiarDuels || this.familiarDuels.size === 0) return;
    for (const duel of Array.from(this.familiarDuels.values())) {
      if (duel.ended) {
        this.familiarDuels.delete(duel.id);
        continue;
      }
      if (resolveFamiliarDuelTimeout(duel, now)) {
        this.sendFamDuelStateToParticipants(duel);
        this.finishFamiliarDuel(duel);
        continue;
      }
      if (duel.isBot && now >= (duel.nextBotMoveAt || 0)) {
        duel.nextBotMoveAt = now + 2400;
        const botMove = pickBotFamiliarDuelMove(duel, now);
        executeFamiliarDuelMove(duel, 'b', botMove, now);
        this.sendFamDuelStateToParticipants(duel);
        if (duel.ended) {
          this.finishFamiliarDuel(duel);
        }
      }
    }
  },

  // ------------------------------------------
  // Wild Event Stray Echoes & Starlight / Prismatic Variants
  // ------------------------------------------
  ensureWorldEventStrayEcho(room, now = Date.now()) {
    if (!room) return;
    if (!room.isOverworld && room.type !== ROOM_TYPES.LUMINOUS_CAVERN) return;
    if (now < (room._nextStrayEchoCheckAt || 0)) return;
    room._nextStrayEchoCheckAt = now + 5000;

    const ev = getActiveWorldEvent(now);
    const activeZones = [...new Set([...(ev?.rooms || []), ROOM_TYPES.SANCTUARY_HUB])];
    for (const zType of activeZones) {
      if (room.isOverworld) {
        if (!SURFACE_ZONE_PLACEMENT[zType]) continue;
      } else if (room.type !== zType) {
        continue;
      }
      const echoEntId = `wild_echo_${zType}`;
      const existing = room.entities.find((e) => e.id === echoEntId);
      if (existing) {
        if (existing.isDying && now >= (existing.respawnAt || 0)) {
          existing.isDying = false;
          existing.deathAge = 0;
          existing.charges = 1;
        }
        continue;
      }
      const spec = pickWildStrayEchoForZone(zType);
      const offsetX = zType === ROOM_TYPES.SANCTUARY_HUB ? 165 : -90;
      const offsetY = zType === ROOM_TYPES.SANCTUARY_HUB ? 155 : 80;
      const wp = room.isOverworld ? localToWorld(zType, offsetX, offsetY) : { wx: offsetX, wy: offsetY };
      room.entities.push({
        id: echoEntId,
        strayId: spec.id,
        name: spec.name,
        sub: `✨ Wild Stray Echo • Soothe [E] (${GLIMMER_CIPHERS_CATALOG[spec.requiredCipherId]?.name || 'Cipher'})`,
        type: 'wild_echo',
        zoneType: zType,
        familiarId: spec.familiarId,
        spriteKey: spec.spriteKey,
        faction: spec.faction,
        requiredCipherId: spec.requiredCipherId,
        rewardPrintId: spec.rewardPrintId,
        titleUnlock: spec.titleUnlock,
        variantPool: spec.variantPool,
        variantChance: spec.variantChance,
        x: wp.wx,
        y: wp.wy,
        origX: wp.wx,
        origY: wp.wy,
        hp: 100,
        maxHp: 100,
        charges: 1,
        maxCharges: 1,
        radius: 22,
        hitFlash: 0,
        isDying: false,
      });
    }
  },

  handleSootheWildEcho(room, client, entityId, rng = Math.random) {
    if (!room || !client || client.isDead) return { ok: false, reason: 'Unavailable' };
    const ent = room.entities.find((e) => e.type === 'wild_echo' && (!entityId || e.id === entityId) && !e.isDying);
    if (!ent) {
      client.send({ type: 'sys_msg', category: 'quest', text: '✨ That Wild Stray Echo has already vanished into the leyline!' });
      return { ok: false, reason: 'Echo not found' };
    }
    if (Math.hypot((client.x || 0) - ent.x, (client.y || 0) - ent.y) > 190) {
      client.send({ type: 'sys_msg', category: 'quest', text: `✨ Step closer to ${ent.name} and press [E] to soothe it!` });
      return { ok: false, reason: 'Too far' };
    }

    const acc = this.accounts?.accountsById?.get(client.id);
    if (!acc) return { ok: false, reason: 'Account missing' };
    this.accounts.ensureDefaultCharacter(acc);
    if (!Array.isArray(acc.inventory)) acc.inventory = [];

    const reqCipher = ent.requiredCipherId || 'cipher_solar';
    const cipherMeta = GLIMMER_CIPHERS_CATALOG[reqCipher];
    if (countBagItem(acc.inventory, reqCipher) < 1) {
      client.send({
        type: 'sys_msg',
        category: 'quest',
        text: `✨ ${ent.name} trembles! Bring 1× ${cipherMeta?.name || reqCipher} (decode fish/ore/herbs in Harmonic Extractor) to soothe it.`,
      });
      return { ok: false, reason: 'Missing Harmonic Cipher' };
    }

    deductBagItems(acc.inventory, reqCipher, 1);
    const addedPrint = addBagItem(acc.inventory, ent.rewardPrintId, 1, true, 28);

    const famState = normalizeFamiliarState(client.prog?.familiars);
    if (ent.familiarId && !famState.unlockedIds.includes(ent.familiarId)) {
      famState.unlockedIds.push(ent.familiarId);
    }

    let unlockedVariant = null;
    const pool = Array.isArray(ent.variantPool) ? ent.variantPool : ['starlight', 'prismatic'];
    const existingVars = Array.isArray(famState.variants[ent.familiarId]) ? famState.variants[ent.familiarId] : [];
    const remainingVars = pool.filter((v) => !existingVars.includes(v));
    if (remainingVars.length > 0 && rng() < (ent.variantChance || 0.45)) {
      unlockedVariant = remainingVars[Math.floor(rng() * remainingVars.length)] || remainingVars[0];
      famState.variants[ent.familiarId] = [...existingVars, unlockedVariant];
      famState.activeVariants[ent.familiarId] = unlockedVariant;
    }
    client.prog.familiars = famState;

    const titleUnlock = ent.titleUnlock || 'Echo Whisperer';
    client.prog.achievements = client.prog.achievements || { completed: {}, unlockedTitles: [] };
    if (!Array.isArray(client.prog.achievements.unlockedTitles)) client.prog.achievements.unlockedTitles = [];
    if (!client.prog.achievements.unlockedTitles.includes(titleUnlock)) {
      client.prog.achievements.unlockedTitles.push(titleUnlock);
    }
    client.title = client.title || titleUnlock;

    client.questState = client.questState || {};
    client.questState.wildEchoesSoothed = (client.questState.wildEchoesSoothed || 0) + 1;
    const ch = this.accounts.charactersByAccount.get(acc.id)?.get(acc.activeCharacterId);
    if (ch) ch.inventory = acc.inventory;
    this.accounts.saveQuestState(client.id, client.questState);
    this.accounts.recordCollectionUnlock?.(client.id, [ent.rewardPrintId, ent.strayId]);
    this.accounts.saveProgression(client.id, client.prog);

    this.awardPlayerXP(client, 45, `Soothed ${ent.name}`);
    this.awardProfessionXP(client, 'resonance_extraction', 65, `Soothed ${ent.name}`);
    this.refreshClientFromAccount(client.id);

    ent.isDying = true;
    ent.charges = 0;
    ent.respawnAt = Date.now() + 90000;

    if (room.fxQueue) {
      room.fxQueue.push({
        kind: 'spark',
        x: ent.x,
        y: ent.y - 10,
        colors: unlockedVariant === 'prismatic' ? ['#f472b6', '#38bdf8', '#fde047'] : ['#93c5fd', '#c084fc', '#ffffff'],
        count: 28,
      });
      room.fxQueue.push({
        kind: 'fct',
        x: ent.x,
        y: ent.y - 18,
        text: unlockedVariant ? `🌟 SOOTHED! ${unlockedVariant.toUpperCase()} VARIANT UNLOCKED!` : `✨ SOOTHED! +1 ${EQUIPMENT_CATALOG[ent.rewardPrintId]?.name || 'Echo-Print'}`,
        color: unlockedVariant === 'prismatic' ? '#f472b6' : '#38bdf8',
        isCrit: true,
      });
    }

    const packet = {
      type: 'wild_echo_soothed',
      ok: true,
      echoName: ent.name,
      familiarId: ent.familiarId,
      rewardPrintId: addedPrint ? ent.rewardPrintId : null,
      unlockedVariant,
      titleUnlock,
      familiars: client.prog.familiars,
    };
    client.send(packet);
    return packet;
  },

  handleSetFamiliarVariant(client, familiarId, variant = 'default') {
    if (!client || !client.prog) return;
    const famState = normalizeFamiliarState(client.prog.familiars);
    if (!famState.unlockedIds.includes(familiarId)) {
      client.send({ type: 'sys_msg', category: 'quest', text: '🐾 Compile or soothe that Familiar before styling its aura!' });
      return;
    }
    if (variant === 'default' || !variant) {
      delete famState.activeVariants[familiarId];
    } else if (famState.variants[familiarId]?.includes(variant)) {
      famState.activeVariants[familiarId] = variant;
    } else {
      client.send({ type: 'sys_msg', category: 'quest', text: `🌟 Soothe Wild Event Stray Echoes to unlock the ${variant} variant!` });
      return;
    }
    client.prog.familiars = famState;
    this.accounts?.saveProgression(client.id, client.prog);
    this.refreshClientFromAccount(client.id);
    client.send({
      type: 'sys_msg',
      category: 'quest',
      text: `🌟 Familiar Aura updated to ${FAMILIAR_VARIANTS_CATALOG[variant]?.name || 'Classic Echo'}!`,
    });
  },
};
