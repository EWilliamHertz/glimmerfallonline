// ==========================================
// GlimmerFall Online 2D — Authoritative 3-Player Party / Squad Manager
// ==========================================

import crypto from 'node:crypto';

export const MAX_PARTY_SIZE = 3;

export class PartyManager {
  constructor(getClientById, findClientByName) {
    this.getClientById = getClientById;
    this.findClientByName = findClientByName;
    this.parties = new Map(); // partyId -> { id, leaderId, memberIds: string[] }
    this.partyByPlayer = new Map(); // playerId -> partyId
    this.pendingInvites = new Map(); // inviteId -> { id, partyId, inviterId, inviterName, targetId, expiresAt }
  }

  getPartyForPlayer(playerId) {
    const pid = this.partyByPlayer.get(playerId);
    if (!pid) return null;
    return this.parties.get(pid) || null;
  }

  areInSameParty(idA, idB) {
    if (!idA || !idB) return false;
    if (idA === idB) return true;
    const pA = this.partyByPlayer.get(idA);
    return Boolean(pA && pA === this.partyByPlayer.get(idB));
  }

  getPartyMembers(playerId) {
    const party = this.getPartyForPlayer(playerId);
    if (!party) {
      const solo = this.getClientById(playerId);
      return solo ? [solo] : [];
    }
    return party.memberIds.map((id) => this.getClientById(id)).filter(Boolean);
  }

  invitePlayer(inviterClient, targetQuery) {
    if (!inviterClient) return;
    const q = String(targetQuery || '').trim();
    if (!q) {
      inviterClient.send({ type: 'sys_msg', category: 'party', text: '[Party] Specify a player name to invite.' });
      return;
    }

    let target = this.getClientById(q) || this.findClientByName(q);
    if (!target) {
      inviterClient.send({ type: 'sys_msg', category: 'party', text: `[Party] Player "${q}" is not online.` });
      return;
    }
    if (target.id === inviterClient.id) {
      inviterClient.send({ type: 'sys_msg', category: 'party', text: '[Party] You cannot invite yourself!' });
      return;
    }
    if (this.partyByPlayer.has(target.id)) {
      inviterClient.send({
        type: 'sys_msg',
        category: 'party',
        text: `[Party] ${target.displayName} is already in a squad.`,
      });
      return;
    }

    let party = this.getPartyForPlayer(inviterClient.id);
    if (party && party.memberIds.length >= MAX_PARTY_SIZE) {
      inviterClient.send({
        type: 'sys_msg',
        category: 'party',
        text: `[Party] Squad is full (${MAX_PARTY_SIZE}/${MAX_PARTY_SIZE})!`,
      });
      return;
    }

    const inviteId = `inv_${crypto.randomUUID().slice(0, 8)}`;
    this.pendingInvites.set(inviteId, {
      id: inviteId,
      inviterId: inviterClient.id,
      inviterName: inviterClient.displayName,
      inviterFaction: inviterClient.faction,
      targetId: target.id,
      expiresAt: Date.now() + 45000,
    });

    inviterClient.send({
      type: 'sys_msg',
      category: 'party',
      text: `[Party] Sent squad invite to ${target.displayName}!`,
    });

    target.send({
      type: 'party_invite',
      inviteId,
      inviterId: inviterClient.id,
      inviterName: inviterClient.displayName,
      inviterFaction: inviterClient.faction,
      inviterLevel: inviterClient.prog.level,
    });
  }

  respondInvite(targetClient, inviteId, accept) {
    const inv = this.pendingInvites.get(inviteId);
    if (!inv || inv.targetId !== targetClient.id) {
      targetClient.send({ type: 'sys_msg', category: 'party', text: '[Party] Invite expired or invalid.' });
      return;
    }
    this.pendingInvites.delete(inviteId);

    const inviter = this.getClientById(inv.inviterId);
    if (!accept) {
      if (inviter) {
        inviter.send({
          type: 'sys_msg',
          category: 'party',
          text: `[Party] ${targetClient.displayName} declined the squad invite.`,
        });
      }
      return;
    }

    if (!inviter) {
      targetClient.send({ type: 'sys_msg', category: 'party', text: '[Party] Inviter went offline.' });
      return;
    }

    if (this.partyByPlayer.has(targetClient.id)) {
      this.leaveParty(targetClient);
    }

    let party = this.getPartyForPlayer(inviter.id);
    if (!party) {
      const partyId = `pty_${crypto.randomUUID().slice(0, 8)}`;
      party = {
        id: partyId,
        leaderId: inviter.id,
        memberIds: [inviter.id],
      };
      this.parties.set(partyId, party);
      this.partyByPlayer.set(inviter.id, partyId);
    }

    if (party.memberIds.length >= MAX_PARTY_SIZE) {
      targetClient.send({ type: 'sys_msg', category: 'party', text: '[Party] That squad is already full (3/3)!' });
      return;
    }

    party.memberIds.push(targetClient.id);
    this.partyByPlayer.set(targetClient.id, party.id);

    this.broadcastToParty(party.id, {
      type: 'sys_msg',
      category: 'party',
      text: `[Party] ${targetClient.displayName} joined the 3-Player Squad (${party.memberIds.length}/3)!`,
    });
    this.broadcastPartyState(party.id);
  }

  leaveParty(client) {
    if (!client) return;
    const party = this.getPartyForPlayer(client.id);
    if (!party) return;

    party.memberIds = party.memberIds.filter((id) => id !== client.id);
    this.partyByPlayer.delete(client.id);
    client.send({ type: 'party_state', party: null });
    client.send({ type: 'sys_msg', category: 'party', text: '[Party] You left the squad.' });

    if (party.memberIds.length <= 1) {
      // Dissolve 1-person remainder
      for (const remId of party.memberIds) {
        this.partyByPlayer.delete(remId);
        const remClient = this.getClientById(remId);
        if (remClient) {
          remClient.send({ type: 'party_state', party: null });
          remClient.send({
            type: 'sys_msg',
            category: 'party',
            text: `[Party] ${client.displayName} left — squad disbanded.`,
          });
        }
      }
      this.parties.delete(party.id);
      return;
    }

    if (party.leaderId === client.id) {
      party.leaderId = party.memberIds[0];
    }
    this.broadcastToParty(party.id, {
      type: 'sys_msg',
      category: 'party',
      text: `[Party] ${client.displayName} left the squad.`,
    });
    this.broadcastPartyState(party.id);
  }

  kickMember(leaderClient, targetId) {
    const party = this.getPartyForPlayer(leaderClient.id);
    if (!party || party.leaderId !== leaderClient.id) return;
    if (targetId === leaderClient.id) return;
    const target = this.getClientById(targetId);
    if (target && party.memberIds.includes(targetId)) {
      this.leaveParty(target);
    }
  }

  broadcastToParty(partyId, packet) {
    const party = this.parties.get(partyId);
    if (!party) return;
    for (const id of party.memberIds) {
      const c = this.getClientById(id);
      if (c) c.send(packet);
    }
  }

  broadcastPartyState(partyId) {
    const party = this.parties.get(partyId);
    if (!party) return;
    const members = party.memberIds
      .map((id) => {
        const c = this.getClientById(id);
        if (!c) return null;
        return {
          id: c.id,
          name: c.displayName,
          faction: c.faction,
          orderTag: c.orderTag,
          level: c.prog.level,
          hp: c.hp,
          maxHp: c.maxHp,
          shield: c.shield,
          roomId: c.roomId,
          roomType: c.roomType,
        };
      })
      .filter(Boolean);

    const payload = {
      type: 'party_state',
      party: {
        id: party.id,
        leaderId: party.leaderId,
        members,
      },
    };
    this.broadcastToParty(partyId, payload);
  }

  syncPlayerVitals(playerId) {
    const pid = this.partyByPlayer.get(playerId);
    if (pid) this.broadcastPartyState(pid);
  }
}
