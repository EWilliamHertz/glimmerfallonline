// ==========================================
// Friendly Player Dueling Manager & Non-Lethal Surrender Engine
// ==========================================

import crypto from 'node:crypto';
import { ROOM_TYPES } from '../shared/protocol.js';

export const DUEL_RING_RADIUS_PX = 200;
export const DUEL_COUNTDOWN_SEC = 3.0;
export const DUEL_OUT_OF_BOUNDS_MAX_SEC = 5.0;

export class DuelManager {
  constructor({ getClientById, findClientByName, getRoomById, broadcastToRoom }) {
    this.getClientById = getClientById;
    this.findClientByName = findClientByName;
    this.getRoomById = getRoomById;
    this.broadcastToRoom = broadcastToRoom;

    // duelId -> DuelSession
    this.duels = new Map();
    // playerId -> duelId
    this.playerDuel = new Map();
    // inviteId -> { inviteId, senderId, senderName, targetId, roomId, expiresAt }
    this.pendingInvites = new Map();
  }

  isPlayerDueling(playerId) {
    return this.playerDuel.has(playerId);
  }

  hasActiveDuel(playerId) {
    const did = this.playerDuel.get(playerId);
    if (!did) return false;
    const d = this.duels.get(did);
    return Boolean(d && d.state === 'active');
  }

  isDuelActiveBetween(idA, idB) {
    if (!idA || !idB || idA === idB) return false;
    const didA = this.playerDuel.get(idA);
    const didB = this.playerDuel.get(idB);
    if (!didA || didA !== didB) return false;
    const d = this.duels.get(didA);
    return Boolean(d && d.state === 'active');
  }

  getDuelForPlayer(playerId) {
    const did = this.playerDuel.get(playerId);
    return did ? this.duels.get(did) || null : null;
  }

  handleRequest(sender, targetQuery) {
    if (!sender) return;
    const q = String(targetQuery || '').trim();
    if (!q) {
      sender.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] Specify a player name to challenge.' });
      return;
    }

    const target = this.getClientById(q) || this.findClientByName(q);
    if (!target) {
      sender.send({ type: 'sys_msg', category: 'combat', text: `⚔️ [Duel] Player "${q}" is not online.` });
      return;
    }

    if (target.id === sender.id) {
      sender.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] You cannot duel yourself!' });
      return;
    }

    if (sender.isDead) {
      sender.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] You cannot duel while fallen.' });
      return;
    }

    if (target.isDead) {
      sender.send({ type: 'sys_msg', category: 'combat', text: `⚔️ [Duel] ${target.displayName} is currently fallen.` });
      return;
    }

    if (sender.roomId !== target.roomId) {
      sender.send({ type: 'sys_msg', category: 'combat', text: `⚔️ [Duel] ${target.displayName} is in a different zone.` });
      return;
    }

    if (sender.roomType === ROOM_TYPES.ARENA_3V3) {
      sender.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] Dueling challenges are not permitted inside Ranked 3v3 Arena.' });
      return;
    }

    if (this.isPlayerDueling(sender.id)) {
      sender.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] You are already in an active duel!' });
      return;
    }

    if (this.isPlayerDueling(target.id)) {
      sender.send({ type: 'sys_msg', category: 'combat', text: `⚔️ [Duel] ${target.displayName} is already in another duel!` });
      return;
    }

    const dist = Math.hypot(sender.x - target.x, sender.y - target.y);
    if (dist > 350) {
      sender.send({ type: 'sys_msg', category: 'combat', text: `⚔️ [Duel] Move closer to ${target.displayName} to issue a challenge.` });
      return;
    }

    const inviteId = `duel_inv_${crypto.randomUUID().slice(0, 8)}`;
    this.pendingInvites.set(inviteId, {
      inviteId,
      senderId: sender.id,
      senderName: sender.displayName,
      targetId: target.id,
      roomId: sender.roomId,
      expiresAt: Date.now() + 30000,
    });

    target.send({
      type: 'duel_incoming',
      inviteId,
      senderId: sender.id,
      senderName: sender.displayName,
    });

    sender.send({
      type: 'sys_msg',
      category: 'combat',
      text: `⚔️ [Duel] Challenged ${target.displayName} to honorable combat! Awaiting response...`,
    });
  }

  handleRespond(target, inviteId, accept) {
    if (!target) return;
    const inv = this.pendingInvites.get(inviteId);
    if (!inv || inv.targetId !== target.id) {
      target.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] Challenge invitation has expired.' });
      return;
    }

    this.pendingInvites.delete(inviteId);
    const sender = this.getClientById(inv.senderId);

    if (!accept) {
      if (sender) {
        sender.send({
          type: 'sys_msg',
          category: 'combat',
          text: `⚔️ [Duel] ${target.displayName} declined your duel challenge.`,
        });
      }
      return;
    }

    if (!sender) {
      target.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] Challenger is no longer online.' });
      return;
    }

    if (this.isPlayerDueling(sender.id) || this.isPlayerDueling(target.id)) {
      target.send({ type: 'sys_msg', category: 'combat', text: '⚔️ [Duel] One of the champions is already dueling.' });
      return;
    }

    // Midpoint duel center
    const centerX = Math.round((sender.x + target.x) / 2);
    const centerY = Math.round((sender.y + target.y) / 2);
    const duelId = `duel_${crypto.randomUUID().slice(0, 8)}`;

    const session = {
      duelId,
      roomId: sender.roomId,
      centerX,
      centerY,
      radius: DUEL_RING_RADIUS_PX,
      p1: {
        id: sender.id,
        name: sender.displayName,
        outOfBoundsTimer: 0,
      },
      p2: {
        id: target.id,
        name: target.displayName,
        outOfBoundsTimer: 0,
      },
      state: 'countdown', // 'countdown' | 'active' | 'finished'
      countdown: DUEL_COUNTDOWN_SEC,
      lastWholeSecond: Math.ceil(DUEL_COUNTDOWN_SEC),
      createdAt: Date.now(),
    };

    this.duels.set(duelId, session);
    this.playerDuel.set(sender.id, duelId);
    this.playerDuel.set(target.id, duelId);

    const room = this.getRoomById(sender.roomId);
    if (room) {
      room.fxQueue.push({
        kind: 'fct',
        x: centerX,
        y: centerY - 14,
        text: '⚔️ DUEL CHALLENGE ACCEPTED!',
        color: '#facc15',
        isCrit: true,
      });
    }

    const payload = {
      type: 'duel_start',
      duelId,
      p1Id: sender.id,
      p1Name: sender.displayName,
      p2Id: target.id,
      p2Name: target.displayName,
      centerX,
      centerY,
      radius: DUEL_RING_RADIUS_PX,
      countdown: DUEL_COUNTDOWN_SEC,
    };

    sender.send(payload);
    target.send(payload);

    this.broadcastToRoom(room, {
      type: 'sys_msg',
      category: 'combat',
      text: `⚔️ [Duel] ${sender.displayName} and ${target.displayName} prepare for honorable duel! 3-second countdown...`,
    });
  }

  tick(dt) {
    for (const [duelId, d] of this.duels.entries()) {
      const c1 = this.getClientById(d.p1.id);
      const c2 = this.getClientById(d.p2.id);

      if (!c1 || !c2) {
        this.concludeDuel(
          c1 ? d.p2.id : d.p1.id,
          c1 ? d.p1.id : d.p2.id,
          'forfeit',
          'Duelist disconnected.'
        );
        continue;
      }

      if (c1.roomId !== d.roomId || c2.roomId !== d.roomId) {
        this.concludeDuel(
          c1.roomId !== d.roomId ? d.p1.id : d.p2.id,
          c1.roomId !== d.roomId ? d.p2.id : d.p1.id,
          'forfeit',
          'Left dueling zone.'
        );
        continue;
      }

      if (d.state === 'countdown') {
        d.countdown -= dt;
        const wholeSec = Math.ceil(d.countdown);
        if (wholeSec > 0 && wholeSec < d.lastWholeSecond) {
          d.lastWholeSecond = wholeSec;
          const tickPayload = { type: 'duel_countdown', seconds: wholeSec };
          c1.send(tickPayload);
          c2.send(tickPayload);
        }

        if (d.countdown <= 0) {
          d.state = 'active';
          const fightPayload = { type: 'duel_fight' };
          c1.send(fightPayload);
          c2.send(fightPayload);

          const room = this.getRoomById(d.roomId);
          if (room) {
            room.fxQueue.push({
              kind: 'fct',
              x: d.centerX,
              y: d.centerY - 16,
              text: '⚔️ FIGHT!',
              color: '#ef4444',
              isCrit: true,
            });
          }
        }
      } else if (d.state === 'active') {
        // Ring boundary check (200px)
        const d1 = Math.hypot(c1.x - d.centerX, c1.y - d.centerY);
        const d2 = Math.hypot(c2.x - d.centerX, c2.y - d.centerY);

        if (d1 > d.radius) {
          d.p1.outOfBoundsTimer += dt;
          if (d.p1.outOfBoundsTimer >= DUEL_OUT_OF_BOUNDS_MAX_SEC) {
            this.concludeDuel(d.p1.id, d.p2.id, 'out_of_bounds', `${c1.displayName} fled the dueling ring!`);
            continue;
          } else {
            c1.send({
              type: 'duel_out_of_bounds',
              remaining: Math.max(0, DUEL_OUT_OF_BOUNDS_MAX_SEC - d.p1.outOfBoundsTimer).toFixed(1),
            });
          }
        } else {
          d.p1.outOfBoundsTimer = Math.max(0, d.p1.outOfBoundsTimer - dt * 2);
        }

        if (d2 > d.radius) {
          d.p2.outOfBoundsTimer += dt;
          if (d.p2.outOfBoundsTimer >= DUEL_OUT_OF_BOUNDS_MAX_SEC) {
            this.concludeDuel(d.p2.id, d.p1.id, 'out_of_bounds', `${c2.displayName} fled the dueling ring!`);
            continue;
          } else {
            c2.send({
              type: 'duel_out_of_bounds',
              remaining: Math.max(0, DUEL_OUT_OF_BOUNDS_MAX_SEC - d.p2.outOfBoundsTimer).toFixed(1),
            });
          }
        } else {
          d.p2.outOfBoundsTimer = Math.max(0, d.p2.outOfBoundsTimer - dt * 2);
        }
      }
    }
  }

  concludeDuel(loserId, winnerId, reason = 'defeat', customText = null) {
    const duelId = this.playerDuel.get(loserId) || this.playerDuel.get(winnerId);
    if (!duelId) return;
    const d = this.duels.get(duelId);
    if (!d) return;

    d.state = 'finished';

    const winnerClient = this.getClientById(winnerId);
    const loserClient = this.getClientById(loserId);
    const room = this.getRoomById(d.roomId);

    // Safeguard: Heal defeated duelist to 35% Max HP (no death, no XP loss!)
    if (loserClient) {
      const safeHp = Math.max(10, Math.floor(loserClient.maxHp * 0.35));
      loserClient.hp = Math.max(loserClient.hp, safeHp);
      loserClient.isDead = false;
      loserClient.castState = null;
    }

    const winnerName = winnerClient?.displayName || 'Champion';
    const loserName = loserClient?.displayName || 'Challenger';

    let announcement = customText;
    if (!announcement) {
      if (reason === 'defeat') {
        announcement = `🏆 [Duel] ${winnerName} has vanquished ${loserName} in honorable combat!`;
      } else if (reason === 'forfeit') {
        announcement = `🏳️ [Duel] ${loserName} surrendered the duel to ${winnerName}.`;
      } else if (reason === 'out_of_bounds') {
        announcement = `🚩 [Duel] ${loserName} fled the dueling ring! ${winnerName} wins by forfeit!`;
      }
    }

    if (room) {
      room.fxQueue.push({
        kind: 'fct',
        x: d.centerX,
        y: d.centerY - 14,
        text: `VICTOR: ${winnerName.toUpperCase()} 🏆`,
        color: '#facc15',
        isCrit: true,
      });
      this.broadcastToRoom(room, {
        type: 'sys_msg',
        category: 'combat',
        text: announcement,
      });
    }

    const payload = {
      type: 'duel_concluded',
      winnerId,
      winnerName,
      loserId,
      loserName,
      reason,
      text: announcement,
    };

    if (winnerClient) winnerClient.send(payload);
    if (loserClient) loserClient.send(payload);

    this.playerDuel.delete(d.p1.id);
    this.playerDuel.delete(d.p2.id);
    this.duels.delete(duelId);
  }

  handleForfeit(client) {
    if (!client) return;
    const did = this.playerDuel.get(client.id);
    if (!did) return;
    const d = this.duels.get(did);
    if (!d) return;
    const opponentId = d.p1.id === client.id ? d.p2.id : d.p1.id;
    this.concludeDuel(client.id, opponentId, 'forfeit');
  }

  onPlayerDisconnect(playerId) {
    const did = this.playerDuel.get(playerId);
    if (did) {
      const d = this.duels.get(did);
      if (d) {
        const opponentId = d.p1.id === playerId ? d.p2.id : d.p1.id;
        this.concludeDuel(playerId, opponentId, 'forfeit', 'Duelist disconnected.');
      }
    }
    for (const [invId, inv] of this.pendingInvites.entries()) {
      if (inv.senderId === playerId || inv.targetId === playerId) {
        this.pendingInvites.delete(invId);
      }
    }
  }
}
