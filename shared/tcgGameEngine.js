// ==========================================
// GlimmerFallTCG.com — Authoritative 1v1 Card Game Engine (JavaScript Port)
// 1:1 port of GlimmerFall2/backend/game_engine.py + frontend/src/lib/factions.js
// ==========================================

import {
  TCG_FALLBACK_CARDS,
  TCG_FALLBACK_DECKS,
  TCG_FALLBACK_STARTER_DECKS,
} from './tcgCatalogFallback.js';

export const NEXUS_HP = 30;
export const HAND_START = 5;
export const DECK_SIZE = 40;
export const MAX_ENERGY = 12;
export const AI_NAME = 'GlimmerBot';

export const CARDBACK_URL = '/frames/cardback.webp';
export const FALLBACK_CARDBACK_URL =
  'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/baked_cardback-8Bh4M95RMoY2TSNhQzGI5YH3XZOsb0.png';

export const DESIGNER_CARDS = new Set([
  'aether_sprite',
  'aetheric_blast',
  'ancient_canopy',
  'arcane_intellect',
  'astral_cartographer',
  'blackout_edict',
  'blinding_radiance',
  'borrowed_face',
  'bramble_stag',
  'chrono_shift',
  'deepstone_miner',
  'duskblade_fiend',
  'eclipse_ritual',
  'emberwing_courier',
  'fading_memory',
  'firstlight_scout',
  'forest_warden',
  'formula_of_sparks',
  'gaia_the_world-soul',
  'gilded_pegasus',
  'granite_behemoth',
  'grasping_shadows',
  'graveglass_oracle',
  'haloed_bastion',
  'hollow_courtier',
  'mind_sculptor',
  'mirrorgate',
  'murkborn_informant',
  'mycelial_network',
  'nexus_weaver',
  'paradox_adept',
  'phasewing_drake',
  'prism_courier',
  'radiant_shield',
  'ravenous_echo',
  'reality_fracture',
  'renewal_spring',
  'shadow_cloak',
  'singularity_engine',
  'siphon_soul',
  'solar_flare',
  'solari_vanguard',
  'static_anomaly',
  'stormweaver',
  'the_infinite_loop',
  'the_nightfall_king',
  'umbral_assassin',
  'void_stalker',
  'voidling_swarm',
  'voltage_savant',
  'whispers_of_the_void',
  'zenith_inquisitor',
]);

export function getDesignerCardUrl(cardName) {
  if (!cardName) return null;
  const slug = String(cardName)
    .toLowerCase()
    .replace(/[',]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  if (DESIGNER_CARDS.has(slug)) {
    return `/cards/designer/${slug}.webp`;
  }
  return null;
}

export const TCG_FACTIONS = {
  Solari: {
    name: 'Solari',
    tag: 'Light · Aggro',
    color: '#F2A900',
    soft: '#FFD700',
    glow: 'rgba(242,169,0,0.55)',
    grad: 'linear-gradient(135deg,#4A3500 0%,#F2A900 100%)',
    symbol: '/solari_nobg.png',
  },
  Umbri: {
    name: 'Umbri',
    tag: 'Void · Control',
    color: '#9B30FF',
    soft: '#C77DFF',
    glow: 'rgba(155,48,255,0.55)',
    grad: 'linear-gradient(135deg,#1A0033 0%,#9B30FF 100%)',
    symbol: '/umbri_nobg.png',
  },
  Terra: {
    name: 'Terra',
    tag: 'Growth · Protection',
    color: '#22E07B',
    soft: '#6BFFB0',
    glow: 'rgba(34,224,123,0.5)',
    grad: 'linear-gradient(135deg,#012A16 0%,#22E07B 100%)',
    symbol: '/terra_nobg.png',
  },
  Aether: {
    name: 'Aether',
    tag: 'Spells · Tempo',
    color: '#00BFFF',
    soft: '#7FDBFF',
    glow: 'rgba(0,191,255,0.55)',
    grad: 'linear-gradient(135deg,#001133 0%,#00BFFF 100%)',
    symbol: '/aether_nobg.png',
  },
};

export const TCG_RARITY = {
  Common: { color: '#B0BEC5', glow: '0 0 8px rgba(176,190,197,0.4)' },
  Uncommon: { color: '#2196F3', glow: '0 0 12px rgba(33,150,243,0.55)' },
  Rare: { color: '#FFD700', glow: '0 0 16px rgba(255,215,0,0.7)' },
  Epic: { color: '#9B30FF', glow: '0 0 22px rgba(155,48,255,0.9)' },
  'Founders Foil': { color: '#E040FB', glow: '0 0 26px rgba(224,64,251,0.85)' },
};

export const TCG_RARITY_ICONS = {
  Common: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/rarity_common-tuHj85Rai6aSc8qW2RyEqhNeTxXptX.svg',
  Uncommon: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/rarity_uncommon-g7mzZv9t48OCGMfoDjfNqwFn1BGpxt.svg',
  Rare: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/rarity_mythic-QL9iyt009yFcmawQR0K0YaHbCyvCH1.svg',
  Epic: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/rarity_rare-4bDZ8wMiRhs2soTjHbD2aBJsMnMddj.svg',
  'Founders Foil': 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/rarity_rare-4bDZ8wMiRhs2soTjHbD2aBJsMnMddj.svg',
};

export function getTcgFactionConfig(faction) {
  return TCG_FACTIONS[faction] || TCG_FACTIONS.Aether;
}

export class TcgActionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TcgActionError';
  }
}

let _uidCounter = 0;
function uid(prefix = 'i') {
  _uidCounter = (_uidCounter + 1) % 1000000;
  const rand = Math.random().toString(16).slice(2, 9);
  return `${prefix}_${rand}${_uidCounter.toString(36)}`;
}

export function keywordList(card) {
  const kw = card?.keywords;
  if (!kw || kw === 'None') return [];
  if (Array.isArray(kw)) return kw.map((k) => String(k).trim()).filter(Boolean);
  return String(kw)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export function makeInstance(card) {
  const hasPower = card?.power !== null && card?.power !== undefined && card?.power !== 'None';
  const hasHealth = card?.health !== null && card?.health !== undefined && card?.health !== 'None';
  return {
    instanceId: uid('c'),
    cardId: card.id,
    name: card.name,
    faction: card.faction || 'Aether',
    cardType: card.card_type || card.cardType || 'Entity',
    cost: Number(card.cost || 0),
    power: hasPower ? Number(card.power) : null,
    health: hasHealth ? Number(card.health) : null,
    curHealth: hasHealth ? Number(card.health) : null,
    description: card.description || '',
    keywords: keywordList(card),
    rarity: card.rarity || 'Common',
    image_url: card.image_url || null,
    collector_number: card.collector_number || null,
    set_code: card.set_code || 'AWK',
    lore: card.lore || '',
    exhausted: false,
  };
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function buildDeck(pool = TCG_FALLBACK_CARDS, options = {}) {
  const catalog = Array.isArray(pool) && pool.length > 0 ? pool : TCG_FALLBACK_CARDS;
  const byId = new Map();
  const byName = new Map();
  for (const c of catalog) {
    if (c.id) byId.set(String(c.id), c);
    if (c.name) byName.set(String(c.name).toLowerCase(), c);
  }

  let bag = [];

  // 1. Explicit cardIds or card names array
  if (Array.isArray(options.cardIds) && options.cardIds.length > 0) {
    for (const ref of options.cardIds) {
      const card = byId.get(String(ref)) || byName.get(String(ref).toLowerCase());
      if (card) bag.push(card);
    }
  }

  // 2. Deck object or deckId / deckName matching a known deck list
  if (bag.length === 0 && (options.deck || options.deckId || options.deckName)) {
    const deckPool = Array.isArray(options.decksPool) && options.decksPool.length > 0
      ? options.decksPool
      : TCG_FALLBACK_DECKS;
    let foundDeck = options.deck || null;
    if (!foundDeck && options.deckId) {
      foundDeck = deckPool.find((d) => String(d.id) === String(options.deckId)) || null;
    }
    if (!foundDeck && options.deckName) {
      const targetName = String(options.deckName).toLowerCase().trim();
      foundDeck =
        deckPool.find((d) => String(d.deck_name || d.name || '').toLowerCase().trim() === targetName) ||
        TCG_FALLBACK_STARTER_DECKS.find((d) => String(d.deck_name || '').toLowerCase().trim() === targetName) ||
        null;
    }
    if (foundDeck && Array.isArray(foundDeck.cards)) {
      for (const entry of foundDeck.cards) {
        const count = Math.max(1, Math.min(4, Number(entry.count) || 1));
        const card =
          (entry.card_id && byId.get(String(entry.card_id))) ||
          (entry.card_name && byName.get(String(entry.card_name).toLowerCase())) ||
          (entry.name && byName.get(String(entry.name).toLowerCase()));
        if (card) {
          for (let i = 0; i < count; i++) bag.push(card);
        }
      }
    }
  }

  // 3. Faction filter fallback
  if (bag.length === 0) {
    let cards = catalog;
    if (options.faction) {
      const factions = String(options.faction)
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      const filtered = catalog.filter((c) => factions.includes(c.faction));
      if (filtered.length >= 8) cards = filtered;
    }
    for (const c of cards) {
      for (let i = 0; i < 3; i++) bag.push(c);
    }
    shuffleInPlace(bag);
    bag = bag.slice(0, DECK_SIZE);
  } else {
    shuffleInPlace(bag);
  }

  return bag.map((c) => makeInstance(c));
}

export function newPlayer(username, deck, mmr = 1400, deckName = 'Custom') {
  const hand = deck.slice(0, HAND_START);
  const library = deck.slice(HAND_START);
  return {
    username: username || 'Summoner',
    mmr,
    deckName,
    hp: NEXUS_HP,
    energy: 0,
    maxEnergy: 0,
    library,
    hand,
    battlefield: [],
    resonanceRow: [],
    relics: [],
    void: [],
    hasDrawnThisTurn: false,
    hasResonatedThisTurn: false,
    spellsCastThisTurn: 0,
  };
}

export function opp(slot) {
  return String(slot) === '1' ? '2' : '1';
}

function findIn(zone, instanceId) {
  if (!Array.isArray(zone)) return [-1, null];
  for (let i = 0; i < zone.length; i++) {
    if (zone[i].instanceId === instanceId) return [i, zone[i]];
  }
  return [-1, null];
}

export function hasGuard(player) {
  if (!player || !Array.isArray(player.battlefield)) return false;
  return player.battlefield.some(
    (e) => Array.isArray(e.keywords) && e.keywords.includes('Guard') && !e.keywords.includes('Stealth')
  );
}

function log(state, msg) {
  const active = state.activePlayer ?? '0';
  state.log.push(`[P${active}] ${msg}`);
}

const WORDNUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
const GRANT_KEYWORDS = ['Guard', 'Evasive', 'Stealth', 'Lethal', 'Overwhelm', 'Swift'];

function numFromTok(tok) {
  const s = String(tok || '').trim().toLowerCase();
  if (/^\d+$/.test(s)) return Number(s);
  return WORDNUM[s] || 0;
}

export function makeToken(name, faction, power, health, keywords = []) {
  return {
    instanceId: uid('t'),
    cardId: null,
    name,
    faction: faction || 'Aether',
    cardType: 'Entity',
    cost: 0,
    power: Number(power),
    health: Number(health),
    curHealth: Number(health),
    description: 'Token.',
    keywords: Array.isArray(keywords) ? [...keywords] : [],
    rarity: 'Common',
    image_url: null,
    collector_number: null,
    exhausted: false,
    token: true,
  };
}

function drawCards(state, slot, n) {
  const pl = state.players[slot];
  for (let i = 0; i < n; i++) {
    if (pl.library.length > 0) {
      pl.hand.push(pl.library.shift());
    } else {
      pl.hp -= 1;
    }
  }
}

function parseBuff(desc) {
  const m = String(desc || '').match(/([+-]\s*\d+)\s*\/\s*([+-]\s*\d+)/);
  if (!m) return [0, 0];
  return [
    Number(m[1].replace(/\s+/g, '')),
    Number(m[2].replace(/\s+/g, '')),
  ];
}

function enemyEntities(state, slot) {
  return state.players[opp(slot)].battlefield;
}

function strongest(entities) {
  if (!Array.isArray(entities)) return null;
  const live = entities.filter((e) => (e.power ?? 0) >= 0);
  if (live.length === 0) return null;
  return live.reduce((best, cur) => ((cur.power ?? 0) > (best.power ?? 0) ? cur : best), live[0]);
}

function dealDamageEntity(entity, amount) {
  entity.curHealth = (entity.curHealth ?? 0) - amount;
}

function titleCase(str) {
  return String(str || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function applyEntersTrigger(state, slot, newEntity) {
  for (const e of state.players[slot].battlefield) {
    if (e.instanceId === newEntity.instanceId) continue;
    const low = String(e.description || '').toLowerCase();
    if (low.includes('whenever another') && low.includes('enters')) {
      const m = low.match(/whenever another\s+([a-z]+)\s+entity\s+enters/);
      if (m) {
        const reqFaction = titleCase(m[1]);
        if (newEntity.faction !== reqFaction) continue;
      }
      const effectPart = low.includes('enters,') ? low.split('enters,').pop().trim() : low;
      const hm = effectPart.match(/heal your nexus\s+(\d+)/);
      if (hm) {
        const amt = Number(hm[1]);
        state.players[slot].hp += amt;
        log(state, `${e.name}'s passive triggered: healed Nexus ${amt}`);
      }
    }
  }
}

function createTokens(state, slot, desc) {
  const msgs = [];
  const regex = /create\s+(a|an|one|two|three|\d+)?\s*(\d+)\s*\/\s*(\d+)\s+([A-Za-z ]+?)\s+tokens?(?:\s+with\s+([A-Za-z, .]+))?/gi;
  let m;
  while ((m = regex.exec(String(desc || ''))) !== null) {
    const n = numFromTok(m[1] || 'a') || 1;
    const p = Number(m[2]);
    const h = Number(m[3]);
    const tname = titleCase(m[4].trim());
    let kws = [];
    if (m[5]) {
      kws = m[5]
        .split(',')
        .map((k) => titleCase(k.replace(/\./g, '').trim()))
        .filter((k) => GRANT_KEYWORDS.includes(k));
    }
    let faction = 'Aether';
    for (const f of ['Solari', 'Terra', 'Aether', 'Umbri', 'Graveglass', 'Umbra']) {
      if (tname.includes(f)) {
        faction = f === 'Graveglass' || f === 'Umbra' ? 'Umbri' : f;
        break;
      }
    }
    for (let i = 0; i < n; i++) {
      const newToken = makeToken(tname, faction, p, h, kws);
      state.players[slot].battlefield.push(newToken);
      applyEntersTrigger(state, slot, newToken);
    }
    msgs.push(`created ${n} ${p}/${h} ${tname} token(s)`);
  }
  return msgs;
}

function resolveEffect(state, slot, card, payload = {}, auto = false) {
  const desc = card?.description || '';
  const low = desc.toLowerCase();
  const frags = [];
  const tgtType = payload?.targetType;
  const tgtId = payload?.targetId;
  const tgtSlot = payload?.targetSlot ? String(payload.targetSlot) : opp(slot);

  function resolveTargetEntity() {
    if (tgtId) {
      for (const s of ['1', '2']) {
        for (const e of state.players[s].battlefield) {
          if (e.instanceId === tgtId) return [s, e];
        }
      }
    }
    if (auto) {
      const e = strongest(enemyEntities(state, slot));
      if (e) return [opp(slot), e];
    }
    return [null, null];
  }

  // ---- damage ----
  const dm = low.match(/deal\s+(\d+)\s+damage/);
  if (low.includes('damage to all opposing entit') || low.includes('damage to all opposing')) {
    const amt = dm ? Number(dm[1]) : 2;
    for (const e of [...enemyEntities(state, slot)]) {
      dealDamageEntity(e, amt);
    }
    frags.push(`dealt ${amt} to all enemy Entities`);
  } else if (low.includes('damage to all non-terra')) {
    const amt = dm ? Number(dm[1]) : 3;
    for (const s of ['1', '2']) {
      for (const e of [...state.players[s].battlefield]) {
        if (e.faction !== 'Terra') dealDamageEntity(e, amt);
      }
    }
    frags.push(`dealt ${amt} to all non-Terra Entities`);
  } else if (dm || low.includes('deal damage')) {
    let amt = 2;
    if (dm) {
      amt = Number(dm[1]);
    } else if (low.includes('equal to cards in your hand')) {
      amt = state.players[slot].hand.length;
    }
    if (low.includes('nexus') && !low.includes('to target entity') && tgtType !== 'entity') {
      state.players[tgtSlot].hp -= amt;
      frags.push(`dealt ${amt} to ${state.players[tgtSlot].username}'s Nexus`);
    } else {
      const [, te] = resolveTargetEntity();
      if (te) {
        dealDamageEntity(te, amt);
        frags.push(`dealt ${amt} to ${te.name}`);
      } else if (tgtType === 'nexus') {
        state.players[tgtSlot].hp -= amt;
        frags.push(`dealt ${amt} to a Nexus`);
      } else if (auto) {
        state.players[opp(slot)].hp -= amt;
        frags.push(`dealt ${amt} to enemy Nexus`);
      }
    }
  }

  // ---- exile ----
  if (low.includes('exile target')) {
    const [ts, te] = resolveTargetEntity();
    if (te && ts) {
      state.players[ts].battlefield = state.players[ts].battlefield.filter((x) => x.instanceId !== te.instanceId);
      state.players[ts].void.push(te);
      frags.push(`exiled ${te.name}`);
    }
  }

  // ---- destroy ----
  if (low.includes('destroy target') || low.includes('destroy all entities')) {
    if (low.includes('destroy all entities with power')) {
      const mp = low.match(/power\s+(\d+)\s+or\s+greater/);
      const thr = mp ? Number(mp[1]) : 4;
      for (const s of ['1', '2']) {
        for (const e of [...state.players[s].battlefield]) {
          if ((e.power ?? 0) >= thr) e.curHealth = 0;
        }
      }
      frags.push('destroyed high-power Entities');
    } else {
      const [, te] = resolveTargetEntity();
      if (te) {
        te.curHealth = 0;
        frags.push(`destroyed ${te.name}`);
      }
    }
  }

  // ---- sacrifice ----
  if (low.includes('sacrifices an entity with the lowest power')) {
    const target = opp(slot);
    const entities = state.players[target].battlefield;
    if (entities.length > 0) {
      const lowest = entities.reduce((minE, cur) => ((cur.power ?? 0) < (minE.power ?? 0) ? cur : minE), entities[0]);
      lowest.curHealth = 0;
      frags.push(`forced ${state.players[target].username} to sacrifice ${lowest.name}`);
    }
  }

  if (low.includes('each player sacrifices two entities')) {
    for (const s of ['1', '2']) {
      const plEntities = state.players[s].battlefield;
      if (plEntities.length > 0) {
        const sorted = [...plEntities].sort((a, b) => (a.power ?? 0) - (b.power ?? 0));
        const sacrificed = [];
        for (const e of sorted.slice(0, 2)) {
          e.curHealth = 0;
          sacrificed.push(e.name);
        }
        if (sacrificed.length > 0) {
          frags.push(`${state.players[s].username} sacrificed ${sacrificed.join(', ')}`);
        }
      }
    }
  }

  // ---- bounce (return to hand) ----
  if (
    low.includes('return target entity to its owner') ||
    (low.includes('return target') && low.includes('to its owner') && low.includes('hand'))
  ) {
    const [ts, te] = resolveTargetEntity();
    if (te && ts) {
      state.players[ts].battlefield = state.players[ts].battlefield.filter((x) => x.instanceId !== te.instanceId);
      state.players[ts].hand.push(te);
      frags.push(`returned ${te.name} to hand`);
    }
  }

  if (low.includes('from your void to your hand')) {
    let costLimit = 99;
    const cm = low.match(/cost\s+(\d+)\s+or\s+less/);
    if (cm) costLimit = Number(cm[1]);
    const validCards = state.players[slot].void.filter(
      (c) => c.cardType === 'Entity' && (c.cost ?? 0) <= costLimit
    );
    if (validCards.length > 0) {
      validCards.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0) || (b.power ?? 0) - (a.power ?? 0));
      const bestCard = validCards[0];
      state.players[slot].void = state.players[slot].void.filter((x) => x.instanceId !== bestCard.instanceId);
      state.players[slot].hand.push(bestCard);
      frags.push(`returned ${bestCard.name} from the Void to hand`);
    }
  }

  // ---- exhaust ----
  if (low.includes('exhaust target') || low.includes('exhaust two target') || low.includes('exhaust it')) {
    const n = low.includes('two target') ? 2 : 1;
    if (tgtId) {
      const [, te] = resolveTargetEntity();
      if (te) {
        te.exhausted = true;
        frags.push(`exhausted ${te.name}`);
      }
    } else if (auto) {
      const enemies = [...enemyEntities(state, slot)].sort((a, b) => (b.power ?? 0) - (a.power ?? 0));
      for (const e of enemies.slice(0, n)) {
        e.exhausted = true;
      }
      if (enemies.length > 0) frags.push('exhausted enemy Entities');
    }
  }

  // ---- buffs on target ----
  const [dp, dh] = parseBuff(desc);
  if ((dp !== 0 || dh !== 0) && (low.includes('target entity') || !low.includes('attached entity'))) {
    let [, te] = resolveTargetEntity();
    if (!te && (dp > 0 || dh > 0)) {
      // Friendly auto-fallback if player cast a positive buff without clicking a specific friendly entity
      const myLive = state.players[slot].battlefield;
      if (myLive.length > 0) te = strongest(myLive) || myLive[0];
    }
    if (te) {
      te.power = Math.max(0, (te.power ?? 0) + dp);
      te.health = (te.health ?? 0) + dh;
      te.curHealth = (te.curHealth ?? 0) + dh;
      const granted = [];
      for (const kw of GRANT_KEYWORDS) {
        if (low.includes(kw.toLowerCase()) && !te.keywords.includes(kw)) {
          te.keywords.push(kw);
          granted.push(kw);
        }
      }
      if (low.includes('until end phase')) {
        if (!Array.isArray(te.tempBuffs)) te.tempBuffs = [];
        te.tempBuffs.push({ power: dp, health: dh, keywords: granted });
      }
      const verb = dp > 0 || dh > 0 ? 'buffed' : 'targeted';
      const sDp = dp >= 0 ? `+${dp}` : `${dp}`;
      const sDh = dh >= 0 ? `+${dh}` : `${dh}`;
      frags.push(`${verb} ${te.name} (${sDp}/${sDh})`);
    }
  }

  // ---- heal nexus ----
  const hm = low.match(/heal your nexus\s+(\d+)/);
  if (hm) {
    const amt = Number(hm[1]);
    state.players[slot].hp += amt;
    frags.push(`healed Nexus ${amt}`);
  }

  // ---- draw ----
  const drm = low.match(/draw\s+(a|an|one|two|three|\d+)\s+cards?/);
  if (drm) {
    const n = numFromTok(drm[1]);
    drawCards(state, slot, n);
    frags.push(`drew ${n}`);
  }

  // ---- tokens ----
  frags.push(...createTokens(state, slot, desc));

  // ---- resonance / glimmer nodes ----
  if (low.includes('put the top card of your deck face-down into your resonance row')) {
    if (state.players[slot].library.length > 0) {
      const c = state.players[slot].library.shift();
      state.players[slot].resonanceRow.push(c);
      state.players[slot].maxEnergy += 1;
      state.players[slot].energy += 1;
      frags.push('added a Glimmer Node from deck');
    }
  }

  // ---- look at top card / scry ----
  if (low.includes('look at the top card of your deck')) {
    if (state.players[slot].library.length > 0) {
      const topCard = state.players[slot].library.shift();
      if (state.isAI && slot === '2') {
        if ((topCard.cost ?? 0) > state.players[slot].maxEnergy + 1) {
          state.players[slot].library.push(topCard);
          frags.push(`looked at the top card and put ${topCard.name} on the bottom`);
        } else {
          state.players[slot].library.unshift(topCard);
          frags.push(`looked at the top card and left ${topCard.name} on top`);
        }
      } else {
        state.pendingChoice = {
          player: slot,
          prompt: `Looked at top card: ${topCard.name} (Cost ${topCard.cost ?? 0})`,
          type: 'scry_1',
          options: [
            { text: `Leave ${topCard.name} on Top`, payload: { card: topCard, action: 'top' } },
            { text: `Put ${topCard.name} on Bottom`, payload: { card: topCard, action: 'bottom' } },
          ],
        };
        return frags;
      }
    }
  }

  if (low.includes('look at the top two cards of your deck') && low.includes('void')) {
    const library = state.players[slot].library;
    if (library.length >= 2) {
      const c1 = library.shift();
      const c2 = library.shift();
      if (state.isAI && slot === '2') {
        const energy = state.players[slot].maxEnergy;
        const score = (c) => ((c.cost ?? 0) <= energy + 1 ? (c.cost ?? 0) + (c.power ?? 0) * 0.1 : -(c.cost ?? 0));
        const [keep, dump] = score(c1) >= score(c2) ? [c1, c2] : [c2, c1];
        library.unshift(keep);
        state.players[slot].void.push(dump);
        frags.push(`put ${dump.name} into the Void and left ${keep.name} on top of deck`);
      } else {
        state.pendingChoice = {
          player: slot,
          prompt: 'Choose a card to put into the Void',
          type: 'scry_2',
          options: [
            { text: `Void ${c1.name}, Keep ${c2.name}`, payload: { void: c1, keep: c2 } },
            { text: `Void ${c2.name}, Keep ${c1.name}`, payload: { void: c2, keep: c1 } },
          ],
        };
        return frags;
      }
    } else if (library.length === 1) {
      const dump = library.shift();
      state.players[slot].void.push(dump);
      frags.push(`put ${dump.name} into the Void`);
    }
  }

  if (low.includes('look at the top three cards of your deck') && low.includes('hand') && low.includes('bottom')) {
    const library = state.players[slot].library;
    if (library.length > 0) {
      const n = Math.min(3, library.length);
      const cards = [];
      for (let i = 0; i < n; i++) cards.push(library.shift());
      if (state.isAI && slot === '2') {
        const energy = state.players[slot].maxEnergy;
        const score = (c) => ((c.cost ?? 0) <= energy + 1 ? (c.cost ?? 0) + (c.power ?? 0) * 0.1 : -(c.cost ?? 0));
        cards.sort((a, b) => score(b) - score(a));
        const keep = cards[0];
        const rest = cards.slice(1);
        state.players[slot].hand.push(keep);
        library.push(...rest);
        frags.push(`looked at the top ${n} cards, put ${keep.name} in hand, and put the rest on the bottom`);
      } else {
        state.pendingChoice = {
          player: slot,
          prompt: 'Choose a card to put in your hand',
          type: 'scry_3',
          options: cards.map((c) => ({
            text: `Take ${c.name}`,
            payload: {
              keep: c,
              rest: cards.filter((x) => x.instanceId !== c.instanceId),
            },
          })),
        };
        return frags;
      }
    }
  }

  if (low.includes('look at your opponent') && low.includes('hand') && low.includes('discard')) {
    const enemySlot = opp(slot);
    const enemyHand = state.players[enemySlot].hand;
    if (enemyHand.length > 0) {
      const onlySpells = low.includes('spell');
      const validTargets = enemyHand.filter(
        (c) => !onlySpells || ['rite', 'flash'].includes(String(c.cardType || '').toLowerCase())
      );
      if (validTargets.length === 0) {
        frags.push(`looked at ${state.players[enemySlot].username}'s hand but found no valid cards to discard`);
      } else if (state.isAI && slot === '2') {
        validTargets.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
        const dump = validTargets[0];
        state.players[enemySlot].hand = enemyHand.filter((x) => x.instanceId !== dump.instanceId);
        state.players[enemySlot].void.push(dump);
        frags.push(`looked at ${state.players[enemySlot].username}'s hand and forced them to discard ${dump.name}`);
      } else {
        state.pendingChoice = {
          player: slot,
          prompt: `Choose a card from ${state.players[enemySlot].username}'s hand to discard`,
          type: 'discard',
          options: validTargets.map((c) => ({
            text: `Discard ${c.name} (${c.cardType}, Cost ${c.cost})`,
            payload: { dump: c },
          })),
        };
        return frags;
      }
    }
  }

  return frags;
}

function checkWin(state) {
  const p1 = state.players['1'];
  const p2 = state.players['2'];
  if (p1.hp <= 0 && p2.hp <= 0) {
    state.phase = 'ENDED';
    state.winner = 0;
  } else if (p2.hp <= 0) {
    state.phase = 'ENDED';
    state.winner = 1;
    log(state, `${p1.username} wins the match!`);
  } else if (p1.hp <= 0) {
    state.phase = 'ENDED';
    state.winner = 2;
    log(state, `${p2.username} wins the match!`);
  }
}

function applyDeathTrigger(state, slot, entity) {
  const low = String(entity?.description || '').toLowerCase();
  if (!low.includes('destroyed')) return;
  const frags = [];
  const dm = low.match(/deal\s+(\d+)\s+damage to the enemy nexus/);
  if (dm) {
    state.players[opp(slot)].hp -= Number(dm[1]);
    frags.push(`deals ${dm[1]} to enemy Nexus`);
  }
  const tm = low.match(/create\s+a\s+(\d+)\s*\/\s*(\d+)\s+([A-Za-z ]+?)\s+token/);
  if (tm) {
    state.players[slot].battlefield.push(
      makeToken(titleCase(tm[3].trim()), entity.faction, Number(tm[1]), Number(tm[2]))
    );
    frags.push('spawns a token');
  }
  if (low.includes('draw a card')) {
    drawCards(state, slot, 1);
    frags.push('draws a card');
  }
  if (low.includes('discard') && low.includes('opponent')) {
    const oh = state.players[opp(slot)].hand;
    if (oh.length > 0) {
      const idx = Math.floor(Math.random() * oh.length);
      const [discarded] = oh.splice(idx, 1);
      state.players[opp(slot)].void.push(discarded);
      frags.push('forces a discard');
    }
  }
  if (frags.length > 0) {
    log(state, `${entity.name}'s death: ${frags.join(', ')}.`);
  }
}

function cleanupDead(state) {
  for (const slot of ['1', '2']) {
    const pl = state.players[slot];
    const alive = [];
    const dead = [];
    for (const e of pl.battlefield) {
      if (e.curHealth !== null && e.curHealth !== undefined && e.curHealth <= 0) {
        dead.push(e);
      } else {
        alive.push(e);
      }
    }
    pl.battlefield = alive;
    for (const e of dead) {
      log(state, `${e.name} was destroyed.`);
      pl.void.push(e);
      applyDeathTrigger(state, slot, e);
    }
  }
}

export function startTurn(state, slot) {
  state.turnStartedAt = Date.now();
  const pl = state.players[slot];
  pl.energy = pl.maxEnergy;
  pl.hasDrawnThisTurn = false;
  pl.hasResonatedThisTurn = false;
  pl.spellsCastThisTurn = 0;
  for (const e of pl.battlefield) {
    e.exhausted = false;
  }
}

function doDraw(state, slot) {
  const pl = state.players[slot];
  if (pl.hasDrawnThisTurn) {
    throw new TcgActionError('You have already drawn a card this turn.');
  }
  if (pl.library.length === 0) {
    pl.hp -= 1;
    log(state, `${pl.username} has no cards left and takes 1 fatigue damage.`);
    pl.hasDrawnThisTurn = true;
    checkWin(state);
    return;
  }
  const card = pl.library.shift();
  pl.hand.push(card);
  pl.hasDrawnThisTurn = true;
  log(state, `${pl.username} drew a card.`);
}

function doPlayCard(state, slot, payload = {}) {
  const pl = state.players[slot];
  const dest = payload.destination || 'battlefield';
  const [idx, card] = findIn(pl.hand, payload.instanceId);
  if (!card) {
    throw new TcgActionError('Card not found in hand.');
  }

  if (dest === 'resonance') {
    if (pl.hasResonatedThisTurn) {
      throw new TcgActionError('You already played a Resonance Node this turn.');
    }
    if (pl.maxEnergy >= MAX_ENERGY) {
      throw new TcgActionError('Maximum Energy reached.');
    }
    pl.hand.splice(idx, 1);
    pl.resonanceRow.push(card);
    pl.maxEnergy += 1;
    pl.energy += 1;
    pl.hasResonatedThisTurn = true;

    const wardens = pl.battlefield.filter((e) => e.name === 'Forest Warden');
    for (const w of wardens) {
      w.power = (w.power ?? 0) + 1;
    }
    if (wardens.length > 0) {
      log(state, 'Forest Warden grew (+1/+0) due to Glimmer Node creation.');
    }
    log(state, `${pl.username} charged a Resonance Node (Energy ${pl.energy}/${pl.maxEnergy}).`);
    return;
  }

  if (card.cardType !== 'Entity' && card.cardType !== 'Relic') {
    throw new TcgActionError(`${card.cardType} cards cannot be placed on the battlefield. Cast them instead.`);
  }

  let cost = card.cost ?? 0;
  if (String(card.name || '').includes('Gaia')) {
    cost = Math.max(0, cost - pl.resonanceRow.length);
  }

  if (cost > pl.energy) {
    throw new TcgActionError('Not enough Energy.');
  }
  pl.energy -= cost;
  pl.hand.splice(idx, 1);

  if (card.cardType === 'Relic') {
    const low = String(card.description || '').toLowerCase();
    if (low.includes('attached entity')) {
      const targets = pl.battlefield.filter((e) => e.power !== null && e.power !== undefined);
      if (targets.length === 0) {
        pl.energy += cost;
        pl.hand.splice(idx, 0, card);
        throw new TcgActionError('Deploy an Entity first — this Relic attaches to one of your Entities.');
      }
      let tgt = null;
      if (payload.targetId) {
        tgt = targets.find((e) => e.instanceId === payload.targetId) || null;
      }
      if (!tgt) tgt = strongest(targets) || targets[0];
      const [dp, dh] = parseBuff(card.description || '');
      tgt.power = Math.max(0, (tgt.power ?? 0) + dp);
      tgt.health = (tgt.health ?? 0) + dh;
      tgt.curHealth = (tgt.curHealth ?? 0) + dh;
      const granted = [];
      for (const kw of GRANT_KEYWORDS) {
        if (low.includes(kw.toLowerCase()) && !tgt.keywords.includes(kw)) {
          tgt.keywords.push(kw);
          granted.push(kw);
        }
      }
      card.attachedTo = tgt.instanceId;
      if (!Array.isArray(tgt.attachments)) tgt.attachments = [];
      tgt.attachments.push(card.name);
      pl.relics.push(card);
      const extra = granted.length > 0 ? ` granting ${granted.join(', ')}` : '';
      const sDp = dp >= 0 ? `+${dp}` : `${dp}`;
      const sDh = dh >= 0 ? `+${dh}` : `${dh}`;
      log(state, `${pl.username} attached ${card.name} to ${tgt.name} (${sDp}/${sDh})${extra}.`);
    } else {
      pl.relics.push(card);
      log(state, `${pl.username} deployed Relic ${card.name}.`);
      const frags = resolveEffect(state, slot, card, payload, true);
      if (frags.length > 0) {
        log(state, `${card.name}: ${frags.join(', ')}.`);
      }
    }
  } else {
    card.exhausted = false;
    pl.battlefield.push(card);
    log(state, `${pl.username} deployed ${card.name}.`);

    if (card.faction === 'Solari') {
      const guides = pl.battlefield.filter(
        (e) => e.name === 'Luminous Guide' && e.instanceId !== card.instanceId
      );
      if (guides.length > 0) {
        const heal = guides.length;
        pl.hp += heal;
        log(state, `Luminous Guide healed Nexus ${heal} HP because ${card.name} entered.`);
      }
    }

    applyEntersTrigger(state, slot, card);
    const low = String(card.description || '').toLowerCase();
    if (low.includes('when deployed') || low.includes('when this entity is deployed')) {
      const frags = resolveEffect(state, slot, card, payload, true);
      if (frags.length > 0) {
        log(state, `${card.name}: ${frags.join(', ')}.`);
      }
    }
  }
  cleanupDead(state);
  checkWin(state);
}

function doCastSpell(state, slot, payload = {}) {
  const pl = state.players[slot];
  const [idx, card] = findIn(pl.hand, payload.instanceId);
  if (!card) {
    throw new TcgActionError('Spell not found in hand.');
  }
  if (card.cardType !== 'Rite' && card.cardType !== 'Flash') {
    throw new TcgActionError('That card is not a spell.');
  }
  if (card.cardType === 'Rite' && String(state.activePlayer) !== String(slot)) {
    throw new TcgActionError('Rite (slow) spells can only be cast on your own turn.');
  }
  let cost = card.cost ?? 0;

  const hasVoltage = pl.battlefield.some((e) => e.name === 'Voltage Savant');
  if (hasVoltage && (pl.spellsCastThisTurn || 0) === 0) {
    cost = Math.max(0, cost - 1);
  }
  if (cost > pl.energy) {
    throw new TcgActionError('Not enough Energy.');
  }

  if (payload.targetType === 'entity' && payload.targetId) {
    for (const e of enemyEntities(state, slot)) {
      if (e.instanceId === payload.targetId && e.keywords.includes('Stealth')) {
        if (String(card.description || '').toLowerCase().includes('target')) {
          throw new TcgActionError('Stealth entities cannot be targeted.');
        }
      }
    }
  }

  pl.spellsCastThisTurn = (pl.spellsCastThisTurn || 0) + 1;
  pl.energy -= cost;
  pl.hand.splice(idx, 1);

  const frags = resolveEffect(state, slot, card, payload, false) || [];

  // Echo keyword support
  if (Array.isArray(card.keywords) && card.keywords.includes('Echo') && !card._echoed) {
    const echoCopy = {
      ...makeInstance(card),
      cost: Math.min(MAX_ENERGY, (card.cost ?? 0) + 1),
      _echoed: true,
    };
    pl.hand.push(echoCopy);
    frags.push(`Echo returned a copy of ${card.name} (+1 cost) to hand`);
  }

  // Mirrorgate trigger
  if (!state.pendingChoice) {
    const hasMirrorgate = pl.battlefield.some((e) => e.name === 'Mirrorgate');
    if (hasMirrorgate && pl.library.length > 0) {
      const topCard = pl.library.shift();
      if (state.isAI && slot === '2') {
        pl.library.unshift(topCard);
      } else {
        state.pendingChoice = {
          player: slot,
          prompt: `Mirrorgate: Looked at top card: ${topCard.name} (Cost ${topCard.cost ?? 0})`,
          type: 'scry_1',
          options: [
            { text: `Leave ${topCard.name} on Top`, payload: { card: topCard, action: 'top' } },
            { text: `Put ${topCard.name} on Bottom`, payload: { card: topCard, action: 'bottom' } },
          ],
        };
      }
      frags.push('Mirrorgate triggered (Scry 1)');
    }
  }

  // Stormweaver trigger
  const stormweavers = pl.battlefield.filter((e) => e.name === 'Stormweaver');
  if (stormweavers.length > 0) {
    const dslot = opp(slot);
    const dmg = stormweavers.length;
    state.players[dslot].hp -= dmg;
    frags.push(`Stormweaver dealt ${dmg} damage to enemy Nexus`);
  }

  // Comet Array trigger
  const cometArrays = pl.battlefield.filter((e) => e.name === 'Comet Array');
  if (cometArrays.length > 0) {
    const dslot = opp(slot);
    const dp = state.players[dslot];
    for (let i = 0; i < cometArrays.length; i++) {
      const targets = [
        'nexus',
        ...dp.battlefield.filter((e) => !e.keywords.includes('Stealth')).map((e) => e.instanceId),
      ];
      const targetId = targets[Math.floor(Math.random() * targets.length)];
      if (targetId === 'nexus') {
        dp.hp -= 2;
        frags.push('Comet Array dealt 2 damage to enemy Nexus');
      } else {
        const [, tgt] = findIn(dp.battlefield, targetId);
        if (tgt) {
          tgt.curHealth = (tgt.curHealth ?? 0) - 2;
          frags.push(`Comet Array dealt 2 damage to ${tgt.name}`);
        }
      }
    }
  }

  if (frags.length > 0) {
    log(state, `${pl.username} cast ${card.name}: ${frags.join(', ')}.`);
  } else {
    log(state, `${pl.username} cast ${card.name}. (${card.description})`);
  }

  pl.void.push(card);
  cleanupDead(state);
  checkWin(state);
}

function triggerNexusDamage(state, slot, atk, dp) {
  const pl = state.players[slot];
  const activeDescs = [String(atk.description || '').toLowerCase()];
  for (const r of pl.relics || []) {
    if (r.attachedTo === atk.instanceId) {
      activeDescs.push(String(r.description || '').toLowerCase());
    }
  }

  for (const descLow of activeDescs) {
    if (descLow.includes('ready one glimmer node')) {
      pl.energy = Math.min(pl.maxEnergy, pl.energy + 1);
      log(state, `${atk.name} readied a Glimmer Node (+1 Energy).`);
    }
    if (descLow.includes('discards a card') || atk.name === 'Gloam Reaper') {
      if (dp.hand.length > 0) {
        const idx = Math.floor(Math.random() * dp.hand.length);
        const [discarded] = dp.hand.splice(idx, 1);
        dp.void.push(discarded);
        log(state, `${atk.name} caused ${dp.username} to discard ${discarded.name}.`);
      }
    }
    if (descLow.includes('reveals their hand')) {
      for (const c of dp.hand) {
        c.revealed = true;
      }
      log(state, `${dp.username}'s hand was revealed by ${atk.name}!`);
    }
    if ((descLow.includes('deals damage to a nexus') || descLow.includes('deals damage,')) && descLow.includes('create')) {
      const tfrags = createTokens(state, slot, descLow);
      if (tfrags.length > 0) {
        log(state, `${atk.name} ${tfrags.join(', ')}.`);
      }
    }
    if (descLow.includes('that player discards a card')) {
      if (dp.hand.length > 0) {
        const idx = Math.floor(Math.random() * dp.hand.length);
        const [discarded] = dp.hand.splice(idx, 1);
        dp.void.push(discarded);
        log(state, `${atk.name} forced ${dp.username} to discard ${discarded.name}!`);
      }
    }
    if (descLow.includes('sacrifice borrowed face')) {
      const bfIdx = (pl.relics || []).findIndex(
        (r) => r.attachedTo === atk.instanceId && r.name === 'Borrowed Face'
      );
      if (bfIdx !== -1) {
        const [bf] = pl.relics.splice(bfIdx, 1);
        pl.void.push(bf);
        log(state, `Borrowed Face was sacrificed after ${atk.name} struck the Nexus.`);
      }
    }
    if (descLow.includes('return target opposing relic')) {
      if (dp.relics && dp.relics.length > 0) {
        const idx = Math.floor(Math.random() * dp.relics.length);
        const [bounced] = dp.relics.splice(idx, 1);
        dp.hand.push(bounced);
        log(state, `${atk.name} bounced ${bounced.name} to ${dp.username}'s hand!`);
      }
    }
  }
}

function doAttackEntity(state, slot, payload = {}) {
  const pl = state.players[slot];
  const dslot = opp(slot);
  const dp = state.players[dslot];
  const [, atk] = findIn(pl.battlefield, payload.attackerId);
  const [, tgt] = findIn(dp.battlefield, payload.targetId);
  if (!atk) throw new TcgActionError('Attacker not found.');
  if (!tgt) throw new TcgActionError('Target not found.');
  if (atk.exhausted) throw new TcgActionError('That entity is exhausted and cannot attack.');
  if (tgt.keywords.includes('Stealth')) throw new TcgActionError('Stealth entities cannot be targeted.');
  if (hasGuard(dp) && !tgt.keywords.includes('Guard') && !atk.keywords.includes('Evasive')) {
    throw new TcgActionError('You must attack a Guard entity first.');
  }

  const atkPow = atk.power ?? 0;
  const tgtPow = tgt.power ?? 0;

  const descTgt = String(tgt.description || '').toLowerCase();
  if (descTgt.includes('whenever this entity is attacked, deal 1 damage to the attacker')) {
    atk.curHealth = (atk.curHealth ?? 0) - 1;
    log(state, `${tgt.name} dealt 1 damage to attacking ${atk.name}.`);
  }

  let overflow = 0;
  if (atk.keywords.includes('Lethal') && atkPow > 0) {
    if (atk.keywords.includes('Overwhelm')) {
      overflow = Math.max(0, atkPow - (tgt.curHealth ?? 0));
    }
    tgt.curHealth = 0;
  } else {
    const before = tgt.curHealth ?? 0;
    tgt.curHealth = before - atkPow;
    if (atk.keywords.includes('Overwhelm') && atkPow > before) {
      overflow = atkPow - before;
    }
  }
  if (overflow > 0) {
    dp.hp -= overflow;
    log(state, `${atk.name} overwhelms for ${overflow} spill damage to ${dp.username}'s Nexus.`);
    triggerNexusDamage(state, slot, atk, dp);
  }

  const descAtk = String(atk.description || '').toLowerCase();
  if (atkPow > 0 && descAtk.includes('deals damage,') && descAtk.includes('create')) {
    const tfrags = createTokens(state, slot, descAtk);
    if (tfrags.length > 0) {
      log(state, `${atk.name} dealt damage and ${tfrags.join(', ')}.`);
    }
  }

  // Target strikes back
  if (tgtPow > 0) {
    if (tgt.keywords.includes('Lethal')) {
      atk.curHealth = 0;
    } else {
      atk.curHealth = (atk.curHealth ?? 0) - tgtPow;
    }
  }

  if (atk.name === 'Ebon Duelist') {
    atk.power = (atk.power ?? 0) + 1;
    log(state, `${atk.name} struck and gained +1/+0.`);
  }
  if (tgt.name === 'Ebon Duelist') {
    tgt.power = (tgt.power ?? 0) + 1;
    log(state, `${tgt.name} was struck and gained +1/+0.`);
  }
  if (tgt.name === 'Thornweave Matron') {
    atk.curHealth -= 1;
    log(state, `Thornweave Matron dealt 1 damage to striking ${atk.name}.`);
  }
  if (atk.name === 'Thornweave Matron') {
    tgt.curHealth -= 1;
    log(state, `Thornweave Matron dealt 1 damage to striking ${tgt.name}.`);
  }

  atk.exhausted = true;
  if (atk.keywords.includes('Stealth')) {
    atk.keywords = atk.keywords.filter((k) => k !== 'Stealth');
  }
  log(state, `${atk.name} clashed with ${tgt.name}.`);
  cleanupDead(state);
  checkWin(state);
}

function doAttackNexus(state, slot, payload = {}) {
  const pl = state.players[slot];
  const dslot = opp(slot);
  const dp = state.players[dslot];
  const [, atk] = findIn(pl.battlefield, payload.attackerId);
  if (!atk) throw new TcgActionError('Attacker not found.');
  if (atk.exhausted) throw new TcgActionError('That entity is exhausted and cannot attack.');
  if (hasGuard(dp) && !atk.keywords.includes('Evasive')) {
    throw new TcgActionError('A Guard blocks the way — attack the Guard first.');
  }
  const dmg = atk.power ?? 0;
  dp.hp -= dmg;
  atk.exhausted = true;
  if (atk.keywords.includes('Stealth')) {
    atk.keywords = atk.keywords.filter((k) => k !== 'Stealth');
  }
  log(state, `${atk.name} struck ${dp.username}'s Nexus for ${dmg}.`);
  triggerNexusDamage(state, slot, atk, dp);
  checkWin(state);
}

function doEndTurn(state, slot) {
  const nxt = opp(slot);
  state.activePlayer = Number(nxt);
  state.turn += 1;

  for (const s of ['1', '2']) {
    for (const e of state.players[s].battlefield) {
      if (Array.isArray(e.tempBuffs) && e.tempBuffs.length > 0) {
        for (const buff of e.tempBuffs) {
          e.power = Math.max(0, (e.power ?? 0) - (buff.power || 0));
          e.health = Math.max(1, (e.health ?? 1) - (buff.health || 0));
          e.curHealth = Math.min(e.curHealth ?? 1, e.health ?? 1);
          for (const kw of buff.keywords || []) {
            e.keywords = e.keywords.filter((k) => k !== kw);
          }
        }
        e.tempBuffs = [];
      }
    }
  }

  startTurn(state, nxt);
  log(state, `${state.players[nxt].username}'s turn ${state.turn}.`);
}

export function updateAuras(state) {
  for (const s of ['1', '2']) {
    for (const e of state.players[s].battlefield) {
      const aura = e.aura_power || 0;
      if (aura) {
        e.power = Math.max(0, (e.power ?? 0) - aura);
        e.aura_power = 0;
      }
    }
  }
  for (const s of ['1', '2']) {
    const pl = state.players[s];
    if (String(state.activePlayer) !== s) continue;
    const marshals = pl.battlefield.filter((e) => e.name === 'Aurora Marshal' && (e.power ?? 0) >= 0);
    for (const m of marshals) {
      for (const e of pl.battlefield) {
        if (e.faction === 'Solari' && e.instanceId !== m.instanceId) {
          e.aura_power = (e.aura_power || 0) + 1;
          e.power = (e.power ?? 0) + 1;
        }
      }
    }
  }
}

export function aiTakeTurn(state) {
  const slot = '2';
  const ai = state.players[slot];
  const enemy = state.players['1'];

  if (!ai.hasDrawnThisTurn) {
    doDraw(state, slot);
  }
  if (state.phase === 'ENDED') return;

  // Play a resonance node using highest-cost card
  if (!ai.hasResonatedThisTurn && ai.hand.length > 0 && ai.maxEnergy < MAX_ENERGY) {
    const sortedByCost = [...ai.hand].sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
    const node = sortedByCost[0];
    try {
      doPlayCard(state, slot, { instanceId: node.instanceId, destination: 'resonance' });
    } catch (_) {}
  }

  // Deploy entities/relics while affordable
  const skip = new Set();
  while (true) {
    const playable = ai.hand.filter(
      (c) =>
        (c.cardType === 'Entity' || c.cardType === 'Relic') &&
        (c.cost ?? 0) <= ai.energy &&
        !skip.has(c.instanceId)
    );
    if (playable.length === 0) break;
    playable.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
    const pick = playable[0];
    try {
      doPlayCard(state, slot, { instanceId: pick.instanceId, destination: 'battlefield' });
    } catch (_) {
      skip.add(pick.instanceId);
    }
    if (state.phase === 'ENDED') return;
  }

  // Cast affordable spells intelligently (removal/damage at strongest enemy entity or enemy nexus, or draw/ramp)
  for (const c of [...ai.hand]) {
    if ((c.cardType === 'Rite' || c.cardType === 'Flash') && (c.cost ?? 0) <= ai.energy) {
      const low = String(c.description || '').toLowerCase();
      let payload = { instanceId: c.instanceId, targetType: 'nexus', targetSlot: '1' };
      const targetableEnemies = enemy.battlefield.filter((e) => !e.keywords.includes('Stealth'));
      if (
        (low.includes('target entity') || low.includes('destroy target') || low.includes('exile target') || low.includes('return target entity')) &&
        targetableEnemies.length > 0
      ) {
        const bestEnemy = strongest(targetableEnemies) || targetableEnemies[0];
        payload = {
          instanceId: c.instanceId,
          targetType: 'entity',
          targetId: bestEnemy.instanceId,
          targetSlot: '1',
        };
      } else if ((low.includes('+') && low.includes('target entity')) && ai.battlefield.length > 0) {
        const bestFriendly = strongest(ai.battlefield) || ai.battlefield[0];
        payload = {
          instanceId: c.instanceId,
          targetType: 'entity',
          targetId: bestFriendly.instanceId,
          targetSlot: '2',
        };
      }
      try {
        doCastSpell(state, slot, payload);
      } catch (_) {
        continue;
      }
      if (state.phase === 'ENDED') return;
    }
  }

  // Attack with ready entities
  for (const e of [...ai.battlefield]) {
    if (e.exhausted || !(e.power ?? 0)) continue;
    if (hasGuard(enemy) && !e.keywords.includes('Evasive')) {
      const guards = enemy.battlefield.filter(
        (g) => g.keywords.includes('Guard') && !g.keywords.includes('Stealth')
      );
      if (guards.length > 0) {
        try {
          doAttackEntity(state, slot, { attackerId: e.instanceId, targetId: guards[0].instanceId });
        } catch (_) {}
      }
    } else {
      try {
        doAttackNexus(state, slot, { attackerId: e.instanceId });
      } catch (_) {}
    }
    if (state.phase === 'ENDED') return;
  }

  doEndTurn(state, slot);
}

export function newMatchState(p1Name, deck1, p2Name, deck2, isAi = false, meta = {}) {
  const state = {
    players: {
      1: newPlayer(p1Name, deck1, meta.p1Mmr || 1400, meta.p1DeckName || 'Custom'),
      2: newPlayer(p2Name, deck2, meta.p2Mmr || 1400, meta.p2DeckName || 'Custom'),
    },
    turn: 1,
    activePlayer: 1,
    phase: 'DICE_ROLL',
    diceRolls: { 1: null, 2: null },
    winner: null,
    isAI: Boolean(isAi),
    log: [`Match begins! ${p1Name} vs ${p2Name}.`],
    turnStartedAt: Date.now(),
  };

  if (meta.p2DeckName && isAi) {
    state.log.push(`${p2Name} is piloting ${meta.p2DeckName}.`);
  }

  if (isAi) {
    let r1 = Math.floor(Math.random() * 6) + 1;
    let r2 = Math.floor(Math.random() * 6) + 1;
    while (r1 === r2) {
      r1 = Math.floor(Math.random() * 6) + 1;
      r2 = Math.floor(Math.random() * 6) + 1;
    }
    state.diceRolls = { 1: r1, 2: r2 };
    state.log.push(`${p1Name} rolled a ${r1}. ${p2Name} rolled a ${r2}.`);
    const winner = r1 > r2 ? 1 : 2;
    state.activePlayer = winner;
    state.phase = 'PLAYING';
    const firstPlayerName = winner === 1 ? p1Name : p2Name;
    state.log.push(`${firstPlayerName} goes first!`);
    state.log.push(`${firstPlayerName}'s turn 1.`);
    startTurn(state, String(winner));
    if (winner === 2) {
      aiTakeTurn(state);
    }
    updateAuras(state);
  }

  return state;
}

export function applyAction(state, rawSlot, actionType, payload = {}) {
  const slot = String(rawSlot);

  if (actionType === 'FORFEIT') {
    if (state.phase === 'ENDED') return state;
    const winnerSlot = opp(slot);
    state.phase = 'ENDED';
    state.winner = Number(winnerSlot);
    log(state, `${state.players[slot]?.username || 'Player'} conceded the duel. ${state.players[winnerSlot]?.username || 'Opponent'} wins!`);
    return state;
  }

  if (state.pendingChoice) {
    if (String(state.pendingChoice.player) !== slot) {
      throw new TcgActionError('Waiting for opponent to make a choice.');
    }
    if (actionType !== 'MAKE_CHOICE') {
      throw new TcgActionError('You must make a choice first.');
    }
    const choiceType = state.pendingChoice.type || 'scry_2';
    state.pendingChoice = null;

    if (choiceType === 'scry_2') {
      const keep = payload.keep;
      const dump = payload.void;
      if (keep) state.players[slot].library.unshift(keep);
      if (dump) state.players[slot].void.push(dump);
      log(state, `${state.players[slot].username} put ${dump?.name || 'a card'} into the Void and left ${keep?.name || 'a card'} on top of deck.`);
    } else if (choiceType === 'scry_3') {
      const keep = payload.keep;
      const rest = Array.isArray(payload.rest) ? payload.rest : [];
      if (keep) state.players[slot].hand.push(keep);
      state.players[slot].library.push(...rest);
      log(state, `${state.players[slot].username} put ${keep?.name || 'a card'} in hand and the rest on the bottom.`);
    } else if (choiceType === 'scry_1') {
      const action = payload.action;
      const card = payload.card;
      if (card) {
        if (action === 'top') {
          state.players[slot].library.unshift(card);
          log(state, `${state.players[slot].username} left ${card.name} on top.`);
        } else {
          state.players[slot].library.push(card);
          log(state, `${state.players[slot].username} put ${card.name} on the bottom.`);
        }
      }
    } else if (choiceType === 'discard') {
      const dump = payload.dump;
      const enemySlot = opp(slot);
      const [idx, c] = findIn(state.players[enemySlot].hand, dump?.instanceId);
      if (c) {
        state.players[enemySlot].hand.splice(idx, 1);
        state.players[enemySlot].void.push(c);
        log(state, `${state.players[slot].username} forced ${state.players[enemySlot].username} to discard ${c.name}.`);
      }
    }

    cleanupDead(state);
    checkWin(state);
    updateAuras(state);
    return state;
  }

  if (state.phase === 'ENDED') {
    throw new TcgActionError('The match has ended.');
  }

  if (actionType === 'ROLL_DICE') {
    if (state.phase !== 'DICE_ROLL') {
      throw new TcgActionError('Not in dice roll phase.');
    }
    if (state.diceRolls?.[slot] !== null && state.diceRolls?.[slot] !== undefined) {
      throw new TcgActionError('You already rolled.');
    }
    const roll = Math.floor(Math.random() * 6) + 1;
    state.diceRolls[slot] = roll;
    log(state, `${state.players[slot].username} rolled a ${roll}.`);

    const r1 = state.diceRolls['1'];
    const r2 = state.diceRolls['2'];
    if (r1 !== null && r1 !== undefined && r2 !== null && r2 !== undefined) {
      if (r1 === r2) {
        log(state, "It's a tie! Re-rolling...");
        state.diceRolls = { 1: null, 2: null };
      } else {
        const winner = r1 > r2 ? '1' : '2';
        state.activePlayer = Number(winner);
        state.phase = 'PLAYING';
        state.turnStartedAt = Date.now();
        log(state, `${state.players[winner].username} goes first!`);
        log(state, `${state.players[winner].username}'s turn 1.`);
        startTurn(state, winner);
        if (state.isAI && winner === '2') {
          aiTakeTurn(state);
        }
        updateAuras(state);
      }
    }
    return state;
  }

  const isFlash =
    actionType === 'CAST_SPELL' &&
    (() => {
      const [, c] = findIn(state.players[slot].hand, payload?.instanceId);
      return Boolean(c && c.cardType === 'Flash');
    })();

  if (!isFlash && String(state.activePlayer) !== slot) {
    throw new TcgActionError('It is not your turn.');
  }

  switch (actionType) {
    case 'DRAW_CARD':
      doDraw(state, slot);
      break;
    case 'PLAY_CARD':
      doPlayCard(state, slot, payload);
      break;
    case 'CAST_SPELL':
      doCastSpell(state, slot, payload);
      break;
    case 'ATTACK_ENTITY':
      doAttackEntity(state, slot, payload);
      break;
    case 'ATTACK_NEXUS':
      doAttackNexus(state, slot, payload);
      break;
    case 'END_TURN':
      doEndTurn(state, slot);
      break;
    default:
      throw new TcgActionError(`Unknown action ${actionType}.`);
  }

  if (state.isAI && state.phase !== 'ENDED' && String(state.activePlayer) === '2') {
    aiTakeTurn(state);
  }
  updateAuras(state);
  return state;
}

export function redactState(state, viewerSlot = 1) {
  if (!state) return null;
  if (state.phase === 'WAITING') {
    return {
      phase: 'WAITING',
      log: state.log || [],
      players: state.players || {},
    };
  }
  const s = JSON.parse(JSON.stringify(state));
  delete s.p1_deck;
  const v = String(viewerSlot);
  for (const slot of ['1', '2']) {
    const pl = s.players?.[slot];
    if (!pl) continue;
    pl.libraryCount = Array.isArray(pl.library) ? pl.library.length : (pl.libraryCount ?? 0);
    delete pl.library;
    if (v !== '0' && slot !== v) {
      pl.handCount = Array.isArray(pl.hand) ? pl.hand.length : (pl.handCount ?? 0);
      if (!pl.handRevealed && Array.isArray(pl.hand)) {
        pl.hand = pl.hand.map((c) =>
          c.revealed ? c : { instanceId: c.instanceId, hidden: true }
        );
      }
    } else {
      pl.handCount = Array.isArray(pl.hand) ? pl.hand.length : (pl.handCount ?? 0);
    }
  }
  return s;
}
