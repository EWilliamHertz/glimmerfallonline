// ==========================================
// GlimmerFall Online 2D — 1v1 GlimmerFallTCG.com Tavern Duel Manager
// Connects to Neon PostgreSQL (TCG_DATABASE_URL) for cards, deck lists, and matches
// with real-time WebSocket push + instant 322-card fallback catalog
// ==========================================

import crypto from 'node:crypto';
import pg from 'pg';
import { loadDotEnv } from './db.js';
import {
  TCG_FALLBACK_CARDS,
  TCG_FALLBACK_DECKS,
  TCG_FALLBACK_STARTER_DECKS,
} from '../shared/tcgCatalogFallback.js';
import {
  AI_NAME,
  TcgActionError,
  applyAction,
  buildDeck,
  newMatchState,
  redactState,
} from '../shared/tcgGameEngine.js';

loadDotEnv();

const { Pool } = pg;

let tcgPool = null;

export function getTcgDbPool() {
  if (tcgPool) return tcgPool;
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_TCG_DB_IN_TEST !== '1') {
    return null;
  }
  const rawUrl =
    process.env.TCG_DATABASE_URL ||
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('ep-round-lab-atbehctx')
      ? process.env.DATABASE_URL
      : '');
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete('channel_binding');
    parsed.searchParams.set('uselibpqcompat', 'true');
    if (!parsed.searchParams.get('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }

    tcgPool = new Pool({
      connectionString: parsed.toString(),
      ssl: { rejectUnauthorized: false },
      max: 6,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    tcgPool.on('error', (err) => {
      console.error('[TCG PostgreSQL Pool Error]:', err.message);
    });
    return tcgPool;
  } catch (err) {
    console.error('[TCG PostgreSQL Init Error]:', err.message);
    return null;
  }
}

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export class TcgManager {
  constructor({
    getClientById = () => null,
    findClientByName = () => null,
    getRoomById = () => null,
    broadcastToRoom = () => {},
  } = {}) {
    this.getClientById = getClientById;
    this.findClientByName = findClientByName;
    this.getRoomById = getRoomById;
    this.broadcastToRoom = broadcastToRoom;

    this.cardsCache = null;
    this.cardsCachedAt = 0;
    this.decksCache = null;
    this.decksCachedAt = 0;

    // matchId -> MatchRecord
    this.matches = new Map();
    this.nextLocalMatchId = 10000;
    // inviteId -> { inviteId, senderId, senderName, senderDeckName, senderDeckId, targetId, targetName, roomCode, matchId, expiresAt }
    this.pendingInvites = new Map();
  }

  async getCards(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cardsCache && now - this.cardsCachedAt < 120000) {
      return this.cardsCache;
    }

    const db = getTcgDbPool();
    if (db) {
      try {
        const res = await db.query(`
          SELECT * FROM (
            SELECT id, name, card_type, cost, power, health, description,
                   image_url, faction, keywords, rarity,
                   COALESCE(set_name, 'The Awakening') as set_name,
                   collector_number, COALESCE(set_code, 'AWK') as set_code, lore
            FROM cards
            UNION ALL
            SELECT id, name, card_type, cost, power, health, description,
                   image_url, faction, keywords, rarity,
                   COALESCE(set_name, 'The Awakening') as set_name,
                   collector_number, COALESCE(set_code, 'AWK') as set_code, lore
            FROM cards2
          ) combined
          ORDER BY collector_number ASC NULLS LAST
        `);
        if (res.rows && res.rows.length > 0) {
          this.cardsCache = res.rows;
          this.cardsCachedAt = now;
          return this.cardsCache;
        }
      } catch (err) {
        console.warn('[TCG DB] Falling back to static 322-card catalog:', err.message);
      }
    }

    this.cardsCache = TCG_FALLBACK_CARDS;
    this.cardsCachedAt = now;
    return this.cardsCache;
  }

  async getDecks(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.decksCache && now - this.decksCachedAt < 60000) {
      return this.decksCache;
    }

    const cards = await this.getCards(forceRefresh);
    const cardByName = new Map();
    for (const c of cards) {
      if (c.name) cardByName.set(c.name.toLowerCase(), c);
    }

    const db = getTcgDbPool();
    if (db) {
      try {
        const decksRes = await db.query(`
          SELECT d.id, d.username, d.deck_name, d.created_at, d.is_preconstructed,
                 (SELECT COUNT(*) FROM deck_likes dl WHERE dl.deck_id = d.id) as likes_count
          FROM decks d
          ORDER BY d.is_preconstructed DESC, d.created_at DESC, d.id ASC
          LIMIT 100
        `);
        const dcRes = await db.query(`
          SELECT deck_id, card_name, count
          FROM deck_cards
          ORDER BY deck_id ASC, card_name ASC
        `);

        if (decksRes.rows && decksRes.rows.length > 0) {
          const decks = decksRes.rows.map((d) => {
            const entries = dcRes.rows
              .filter((r) => r.deck_id === d.id)
              .map((r) => {
                const c = cardByName.get(String(r.card_name || '').toLowerCase());
                return {
                  card_id: c ? c.id : null,
                  card_name: r.card_name,
                  count: Number(r.count) || 1,
                  faction: c ? c.faction : 'Neutral',
                  card_type: c ? c.card_type : 'Entity',
                  cost: c ? Number(c.cost || 0) : 0,
                  image_url: c ? c.image_url : null,
                };
              });
            const factions = [...new Set(entries.map((e) => e.faction).filter(Boolean))];
            return {
              id: d.id,
              username: d.username,
              deck_name: d.deck_name,
              is_preconstructed: Boolean(d.is_preconstructed),
              likes_count: Number(d.likes_count || 0),
              factions: factions.join(','),
              total_cards: entries.reduce((s, e) => s + e.count, 0),
              cards: entries,
            };
          });
          this.decksCache = {
            decks,
            starterDecks: TCG_FALLBACK_STARTER_DECKS,
            source: 'neon_postgres',
          };
          this.decksCachedAt = now;
          return this.decksCache;
        }
      } catch (err) {
        console.warn('[TCG DB] Falling back to static deck lists:', err.message);
      }
    }

    this.decksCache = {
      decks: TCG_FALLBACK_DECKS,
      starterDecks: TCG_FALLBACK_STARTER_DECKS,
      source: 'fallback_catalog',
    };
    this.decksCachedAt = now;
    return this.decksCache;
  }

  async saveDeck({ username = 'Summoner', deckName = 'Custom Tavern Deck', deckCards = [] }) {
    const cleanName = String(deckName || 'Custom Tavern Deck').trim().slice(0, 64) || 'Custom Tavern Deck';
    const cleanUser = String(username || 'Summoner').trim().slice(0, 40) || 'Summoner';
    const cards = await this.getCards();
    const byName = new Map();
    const byId = new Map();
    for (const c of cards) {
      byName.set(c.name.toLowerCase(), c);
      byId.set(String(c.id), c);
    }

    const normalizedEntries = [];
    let totalCount = 0;
    for (const item of Array.isArray(deckCards) ? deckCards : []) {
      const card =
        (item.card_id && byId.get(String(item.card_id))) ||
        (item.card_name && byName.get(String(item.card_name).toLowerCase())) ||
        (item.name && byName.get(String(item.name).toLowerCase()));
      if (!card) continue;
      const count = Math.max(1, Math.min(3, Number(item.count) || 1));
      normalizedEntries.push({
        card_id: card.id,
        card_name: card.name,
        count,
        faction: card.faction,
        card_type: card.card_type,
        cost: Number(card.cost || 0),
        image_url: card.image_url,
      });
      totalCount += count;
    }

    if (normalizedEntries.length === 0) {
      throw new Error('Deck must contain valid GlimmerFall TCG cards.');
    }

    let deckId = Date.now();
    const db = getTcgDbPool();
    if (db) {
      try {
        const res = await db.query(
          'INSERT INTO decks (username, deck_name, is_preconstructed) VALUES ($1, $2, FALSE) RETURNING id',
          [cleanUser, cleanName]
        );
        deckId = res.rows[0].id;
        for (const c of normalizedEntries) {
          await db.query(
            'INSERT INTO deck_cards (deck_id, card_name, count) VALUES ($1, $2, $3)',
            [deckId, c.card_name, c.count]
          );
        }
      } catch (err) {
        console.warn('[TCG DB] Saved deck locally (DB insert warning):', err.message);
      }
    }

    this.decksCachedAt = 0;
    const newDeckObj = {
      id: deckId,
      username: cleanUser,
      deck_name: cleanName,
      is_preconstructed: false,
      factions: [...new Set(normalizedEntries.map((e) => e.faction))].join(','),
      total_cards: totalCount,
      cards: normalizedEntries,
    };
    if (this.decksCache && Array.isArray(this.decksCache.decks)) {
      this.decksCache.decks.unshift(newDeckObj);
    }
    return newDeckObj;
  }

  async startMatch({
    username = 'Summoner',
    playerId = null,
    deckId = null,
    deckName = null,
    faction = null,
    deckCards = null,
    vsAI = false,
    aiDeckName = null,
    roomCode = null,
  }) {
    const cleanUser = String(username || 'Summoner').trim();
    const cardsPool = await this.getCards();
    const { decks } = await this.getDecks();

    const chosenDeckObj =
      (deckId && decks.find((d) => String(d.id) === String(deckId))) ||
      (deckName &&
        decks.find((d) => String(d.deck_name).toLowerCase() === String(deckName).toLowerCase())) ||
      null;

    const resolvedDeckName = chosenDeckObj?.deck_name || deckName || (faction ? `${faction} Deck` : "Gaia's Loop");
    const deck1 = buildDeck(cardsPool, {
      deck: chosenDeckObj,
      deckId,
      deckName: resolvedDeckName,
      faction,
      cardIds: deckCards,
      decksPool: decks,
    });

    // ---- 1. VS AI (GlimmerBot / Tavern Master) ----
    if (vsAI) {
      const precons = decks.filter((d) => d.is_preconstructed);
      const aiDeckPool = precons.length > 0 ? precons : decks;
      let aiDeckObj = null;
      if (aiDeckName) {
        aiDeckObj = aiDeckPool.find(
          (d) => String(d.deck_name).toLowerCase() === String(aiDeckName).toLowerCase()
        );
      }
      if (!aiDeckObj && aiDeckPool.length > 0) {
        aiDeckObj = aiDeckPool[Math.floor(Math.random() * aiDeckPool.length)];
      }
      const resolvedAiDeckName = aiDeckObj?.deck_name || 'Solar Singularity';
      const deck2 = buildDeck(cardsPool, {
        deck: aiDeckObj,
        deckName: resolvedAiDeckName,
        decksPool: decks,
      });

      const state = newMatchState(cleanUser, deck1, AI_NAME, deck2, true, {
        p1DeckName: resolvedDeckName,
        p2DeckName: resolvedAiDeckName,
      });

      const code = randomRoomCode();
      const matchRecord = await this._persistNewMatch({
        roomCode: code,
        player1: cleanUser,
        player1Id: playerId,
        player2: AI_NAME,
        player2Id: null,
        player1Deck: resolvedDeckName,
        player2Deck: resolvedAiDeckName,
        isRanked: false,
        vsAI: true,
        state,
      });

      return {
        matchId: matchRecord.id,
        slot: 1,
        roomCode: matchRecord.roomCode,
        status: matchRecord.status,
        vsAI: true,
        deckName: resolvedDeckName,
        opponentDeckName: resolvedAiDeckName,
        state: redactState(matchRecord.state, 1),
      };
    }

    // ---- 2. Join or Create 1v1 Multiplayer Room / Quick Queue ----
    const cleanRoom = String(roomCode || '').trim().toUpperCase();
    const isRanked = !cleanRoom;

    // Look for a waiting match in memory first, then DB
    let waiting = null;
    for (const m of this.matches.values()) {
      if (m.status !== 'WAITING' || m.player2) continue;
      if (cleanRoom) {
        if (m.roomCode === cleanRoom) {
          waiting = m;
          break;
        }
      } else if (m.isRanked && m.player1 !== cleanUser) {
        waiting = m;
        break;
      }
    }

    if (waiting) {
      if (waiting.player1 === cleanUser) {
        waiting.p1Deck = deck1;
        waiting.player1Deck = resolvedDeckName;
        waiting.player1Id = playerId || waiting.player1Id;
        return {
          matchId: waiting.id,
          slot: 1,
          roomCode: waiting.roomCode,
          status: 'WAITING',
          vsAI: false,
          deckName: resolvedDeckName,
          state: redactState(waiting.state, 1),
        };
      }

      // Join as Player 2!
      const deckP1 = waiting.p1Deck || buildDeck(cardsPool, { deckName: waiting.player1Deck, decksPool: decks });
      const state = newMatchState(waiting.player1, deckP1, cleanUser, deck1, false, {
        p1DeckName: waiting.player1Deck,
        p2DeckName: resolvedDeckName,
      });
      waiting.player2 = cleanUser;
      waiting.player2Id = playerId;
      waiting.player2Deck = resolvedDeckName;
      waiting.status = state.phase;
      waiting.state = state;
      waiting.updatedAt = Date.now();

      await this._saveMatchToDb(waiting);
      this._notifyMatchParticipants(waiting);

      return {
        matchId: waiting.id,
        slot: 2,
        roomCode: waiting.roomCode,
        status: waiting.status,
        vsAI: false,
        deckName: resolvedDeckName,
        opponentDeckName: waiting.player1Deck,
        state: redactState(waiting.state, 2),
      };
    }

    // Create new WAITING match
    const newCode = cleanRoom || randomRoomCode();
    const waitingState = {
      phase: 'WAITING',
      activePlayer: 1,
      turn: 1,
      players: {
        1: { username: cleanUser, deckName: resolvedDeckName, hp: 30 },
      },
      p1_deck: deck1,
      p1_deck_name: resolvedDeckName,
      log: [`${cleanUser} opened Tavern TCG Table [${newCode}] (${resolvedDeckName}). Waiting for challenger...`],
    };

    const matchRecord = await this._persistNewMatch({
      roomCode: newCode,
      player1: cleanUser,
      player1Id: playerId,
      player2: null,
      player2Id: null,
      player1Deck: resolvedDeckName,
      player2Deck: null,
      isRanked,
      vsAI: false,
      state: waitingState,
      p1Deck: deck1,
    });

    return {
      matchId: matchRecord.id,
      slot: 1,
      roomCode: matchRecord.roomCode,
      status: 'WAITING',
      vsAI: false,
      deckName: resolvedDeckName,
      state: redactState(matchRecord.state, 1),
    };
  }

  async getMatch(matchId, viewerSlot = 1, isSpectator = false) {
    let m = this.matches.get(Number(matchId)) || this.matches.get(String(matchId)) || null;

    if (!m) {
      const db = getTcgDbPool();
      if (db && /^\d+$/.test(String(matchId))) {
        try {
          const res = await db.query('SELECT * FROM matches WHERE id = $1', [Number(matchId)]);
          if (res.rows && res.rows[0]) {
            const row = res.rows[0];
            m = {
              id: row.id,
              roomCode: row.room_code,
              player1: row.player1,
              player2: row.player2,
              player1Deck: row.player1_deck,
              player2Deck: row.player2_deck,
              status: row.status,
              isRanked: Boolean(row.is_ranked),
              state: typeof row.state === 'string' ? JSON.parse(row.state) : row.state,
              updatedAt: Date.now(),
            };
            this.matches.set(Number(m.id), m);
          }
        } catch (_) {}
      }
    }

    if (!m) {
      throw new Error('TCG match not found.');
    }

    m.updatedAt = Date.now();
    const slotToRedact = m.status === 'ENDED' || isSpectator ? 0 : viewerSlot;
    return {
      matchId: m.id,
      roomCode: m.roomCode,
      status: m.state?.phase || m.status,
      turn: m.state?.turn || 1,
      activePlayer: m.state?.activePlayer || 1,
      player1: m.player1,
      player2: m.player2,
      player1Deck: m.player1Deck,
      player2Deck: m.player2Deck,
      is_ranked: m.isRanked,
      state: redactState(m.state, slotToRedact),
    };
  }

  async performAction({ matchId, slot = 1, action, payload = {} }) {
    const m = this.matches.get(Number(matchId)) || this.matches.get(String(matchId));
    if (!m) {
      // Attempt lazy load from DB
      await this.getMatch(matchId, slot);
    }
    const record = this.matches.get(Number(matchId)) || this.matches.get(String(matchId));
    if (!record) {
      throw new Error('TCG match not found.');
    }
    if (record.state.phase === 'WAITING') {
      throw new Error('Match has not started yet.');
    }

    const prevPhase = record.state.phase;
    const newState = applyAction(record.state, slot, action, payload || {});
    record.state = newState;
    record.status = newState.phase;
    record.updatedAt = Date.now();

    await this._saveMatchToDb(record);

    if (prevPhase !== 'ENDED' && newState.phase === 'ENDED') {
      this._handleMatchConcluded(record);
    }

    this._notifyMatchParticipants(record);

    return {
      ok: true,
      matchId: record.id,
      status: record.status,
      state: redactState(newState, slot),
    };
  }

  listLiveMatches() {
    const now = Date.now();
    const out = [];
    for (const m of this.matches.values()) {
      if (now - (m.updatedAt || 0) > 15 * 60 * 1000) continue;
      if (m.status === 'PLAYING' || m.status === 'DICE_ROLL' || m.status === 'WAITING') {
        out.push({
          id: m.id,
          room_code: m.roomCode,
          player1: m.player1,
          player2: m.player2 || 'Waiting for Challenger...',
          player1_deck: m.player1Deck,
          player2_deck: m.player2Deck,
          status: m.state?.phase || m.status,
          turn: m.state?.turn || 1,
        });
      }
    }
    return out.slice(0, 10);
  }

  // ---- WebSocket MMO Challenge Integration ----
  async handleChallengeInvite(sender, { targetName, deckId, deckName }) {
    if (!sender) return;
    const q = String(targetName || '').trim();
    if (!q) {
      sender.send({ type: 'sys_msg', category: 'social', text: '🃏 [Tavern TCG] Specify a player name to challenge to a 1v1 Card Duel.' });
      return;
    }
    const target = this.getClientById(q) || this.findClientByName(q);
    if (!target) {
      sender.send({ type: 'sys_msg', category: 'social', text: `🃏 [Tavern TCG] Player "${q}" is not online.` });
      return;
    }
    if (target.id === sender.id) {
      sender.send({ type: 'sys_msg', category: 'social', text: '🃏 [Tavern TCG] Choose "Play vs GlimmerBot (AI)" to practice solo!' });
      return;
    }

    // Create a waiting room for the sender so when target accepts, they join immediately
    const created = await this.startMatch({
      username: sender.displayName,
      playerId: sender.id,
      deckId,
      deckName,
      vsAI: false,
      roomCode: randomRoomCode(),
    });

    const inviteId = `tcg_inv_${crypto.randomUUID().slice(0, 8)}`;
    this.pendingInvites.set(inviteId, {
      inviteId,
      senderId: sender.id,
      senderName: sender.displayName,
      senderDeckName: created.deckName,
      targetId: target.id,
      targetName: target.displayName,
      roomCode: created.roomCode,
      matchId: created.matchId,
      expiresAt: Date.now() + 60000,
    });

    target.send({
      type: 'tcg_duel_invite',
      inviteId,
      senderId: sender.id,
      senderName: sender.displayName,
      senderDeckName: created.deckName,
      roomCode: created.roomCode,
      matchId: created.matchId,
    });

    sender.send({
      type: 'tcg_match_joined',
      matchId: created.matchId,
      slot: 1,
      roomCode: created.roomCode,
      status: 'WAITING',
      vsAI: false,
      deckName: created.deckName,
      state: created.state,
    });

    sender.send({
      type: 'sys_msg',
      category: 'social',
      text: `🃏 [Tavern TCG] Challenged ${target.displayName} to a 1v1 GlimmerFall TCG Duel (Room ${created.roomCode})!`,
    });
  }

  async handleChallengeRespond(target, { inviteId, accept, deckId, deckName }) {
    if (!target) return;
    const inv = this.pendingInvites.get(inviteId);
    if (!inv || inv.targetId !== target.id) {
      target.send({ type: 'sys_msg', category: 'social', text: '🃏 [Tavern TCG] Card duel invitation expired.' });
      return;
    }
    this.pendingInvites.delete(inviteId);
    const sender = this.getClientById(inv.senderId);

    if (!accept) {
      if (sender) {
        sender.send({
          type: 'sys_msg',
          category: 'social',
          text: `🃏 [Tavern TCG] ${target.displayName} declined your Tavern TCG challenge.`,
        });
      }
      return;
    }

    const joined = await this.startMatch({
      username: target.displayName,
      playerId: target.id,
      deckId,
      deckName,
      vsAI: false,
      roomCode: inv.roomCode,
    });

    target.send({
      type: 'tcg_match_joined',
      matchId: joined.matchId,
      slot: 2,
      roomCode: joined.roomCode,
      status: joined.status,
      vsAI: false,
      deckName: joined.deckName,
      opponentDeckName: joined.opponentDeckName,
      state: joined.state,
    });
  }

  async _persistNewMatch({
    roomCode,
    player1,
    player1Id,
    player2,
    player2Id,
    player1Deck,
    player2Deck,
    isRanked,
    vsAI,
    state,
    p1Deck = null,
  }) {
    let matchId = ++this.nextLocalMatchId;
    const db = getTcgDbPool();
    if (db) {
      try {
        const activeName =
          state.phase === 'PLAYING'
            ? state.players?.[String(state.activePlayer || 1)]?.username || player1
            : player1;
        const res = await db.query(
          `INSERT INTO matches (room_code, player1, player2, status, current_turn, active_player, state, player1_deck, player2_deck, is_ranked, history)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11::jsonb)
           RETURNING id`,
          [
            roomCode,
            player1,
            player2,
            state.phase || 'WAITING',
            state.turn || 1,
            activeName,
            JSON.stringify(state),
            player1Deck,
            player2Deck,
            Boolean(isRanked),
            JSON.stringify([state]),
          ]
        );
        if (res.rows?.[0]?.id) {
          matchId = res.rows[0].id;
        }
      } catch (err) {
        console.warn('[TCG DB] Created match in memory (DB insert warning):', err.message);
      }
    }

    const record = {
      id: matchId,
      roomCode,
      player1,
      player1Id,
      player2,
      player2Id,
      player1Deck,
      player2Deck,
      isRanked: Boolean(isRanked),
      vsAI: Boolean(vsAI),
      status: state.phase || 'WAITING',
      state,
      p1Deck,
      rewarded: false,
      updatedAt: Date.now(),
    };
    this.matches.set(Number(matchId), record);
    return record;
  }

  async _saveMatchToDb(record) {
    const db = getTcgDbPool();
    if (!db) return;
    try {
      const activeSlot = String(record.state.activePlayer || 1);
      const activeName = record.state.players?.[activeSlot]?.username || record.player1;
      await db.query(
        `UPDATE matches
         SET player2 = COALESCE($1, player2),
             player2_deck = COALESCE($2, player2_deck),
             state = $3::jsonb,
             status = $4,
             current_turn = $5,
             active_player = $6,
             last_polled = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          record.player2,
          record.player2Deck,
          JSON.stringify(record.state),
          record.state.phase,
          record.state.turn || 1,
          activeName,
          record.id,
        ]
      );
    } catch (_) {}
  }

  _notifyMatchParticipants(record) {
    const c1 =
      (record.player1Id && this.getClientById(record.player1Id)) ||
      (record.player1 && this.findClientByName(record.player1));
    const c2 =
      (record.player2Id && this.getClientById(record.player2Id)) ||
      (record.player2 && record.player2 !== AI_NAME && this.findClientByName(record.player2));

    if (c1) {
      c1.send({
        type: 'tcg_state_update',
        matchId: record.id,
        slot: 1,
        roomCode: record.roomCode,
        status: record.state.phase,
        player1: record.player1,
        player2: record.player2,
        player1Deck: record.player1Deck,
        player2Deck: record.player2Deck,
        state: redactState(record.state, record.state.phase === 'ENDED' ? 0 : 1),
      });
    }
    if (c2) {
      c2.send({
        type: 'tcg_state_update',
        matchId: record.id,
        slot: 2,
        roomCode: record.roomCode,
        status: record.state.phase,
        player1: record.player1,
        player2: record.player2,
        player1Deck: record.player1Deck,
        player2Deck: record.player2Deck,
        state: redactState(record.state, record.state.phase === 'ENDED' ? 0 : 2),
      });
    }
  }

  _handleMatchConcluded(record) {
    if (record.rewarded) return;
    record.rewarded = true;

    const w = record.state.winner;
    if (w !== 1 && w !== 2) return;

    const winnerName = w === 1 ? record.player1 : record.player2;
    const loserName = w === 1 ? record.player2 : record.player1;
    const winnerDeck = w === 1 ? record.player1Deck : record.player2Deck;
    const winnerId = w === 1 ? record.player1Id : record.player2Id;

    const winnerClient =
      (winnerId && this.getClientById(winnerId)) ||
      (winnerName && winnerName !== AI_NAME && this.findClientByName(winnerName));

    if (winnerClient) {
      const glimmerReward = record.vsAI ? 85 : 150;
      if (winnerClient.progression && typeof winnerClient.progression === 'object') {
        winnerClient.progression.currency = (Number(winnerClient.progression.currency) || 0) + glimmerReward;
      }
      winnerClient.send({
        type: 'sys_msg',
        category: 'loot',
        text: `🃏 [Tavern TCG Victory] You defeated ${loserName} using "${winnerDeck}"! Earned +${glimmerReward} ✨ Glimmer!`,
      });
      const room = this.getRoomById(winnerClient.roomId);
      if (room) {
        room.fxQueue.push({
          kind: 'fct',
          x: winnerClient.x,
          y: winnerClient.y - 18,
          text: `🃏 TCG VICTOR! +${glimmerReward}✨`,
          color: '#facc15',
          isCrit: true,
        });
        this.broadcastToRoom(room, {
          type: 'sys_msg',
          category: 'social',
          text: `🃏 [Tavern TCG] ${winnerName} defeated ${loserName} at the GlimmerFall TCG Table piloting "${winnerDeck}"!`,
        });
      }
    }
  }
}
