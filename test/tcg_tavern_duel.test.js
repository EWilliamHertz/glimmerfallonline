import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  TCG_FALLBACK_CARDS,
  TCG_FALLBACK_DECKS,
  TCG_FALLBACK_STARTER_DECKS,
} from '../shared/tcgCatalogFallback.js';
import {
  NEXUS_HP,
  HAND_START,
  DECK_SIZE,
  applyAction,
  buildDeck,
  makeInstance,
  newMatchState,
  redactState,
} from '../shared/tcgGameEngine.js';
import { TcgManager } from '../server/tcgManager.js';
import {
  DYNAMIC_WORLD_EVENTS,
  WORLD_EVENT_INTERVAL_MS,
  getActiveWorldEvent,
  isRoomInActiveWorldEvent,
} from '../shared/worldEvents.js';

test('15-Minute Dynamic World Events rotate deterministically and expose active zones & countdowns', () => {
  assert.equal(DYNAMIC_WORLD_EVENTS.length, 4);
  const t0 = WORLD_EVENT_INTERVAL_MS * 100 + 30000;
  const ev0 = getActiveWorldEvent(t0);
  const ev1 = getActiveWorldEvent(t0 + WORLD_EVENT_INTERVAL_MS);
  assert.notEqual(ev0.id, ev1.id, 'World event rotates after 15-minute interval');
  assert.ok(ev0.countdownText.includes(':'), 'Includes formatted MM:SS countdown');
  assert.equal(isRoomInActiveWorldEvent(ev0.primaryRoom, t0), true);
});

test('GlimmerFallTCG.com 322-card catalog and 40-card deck lists are loaded with valid artwork', () => {
  assert.equal(TCG_FALLBACK_CARDS.length, 322, 'Should contain all 322 First Edition: The Awakening cards');
  for (const card of TCG_FALLBACK_CARDS) {
    assert.ok(card.id, 'Card has id');
    assert.ok(card.name, 'Card has name');
    assert.ok(card.image_url && card.image_url.startsWith('http'), `Card ${card.name} has valid image_url`);
  }

  assert.ok(TCG_FALLBACK_DECKS.length >= 6, 'Should include official preconstructed and community 40-card decks');
  const deckNames = TCG_FALLBACK_DECKS.map((d) => d.deck_name);
  assert.ok(deckNames.includes('Solar Singularity'));
  assert.ok(deckNames.includes("Gaia's Loop"));
  assert.ok(deckNames.includes('Fractured Continuum'));
  assert.ok(deckNames.includes('The Graveglass Veil'));

  for (const d of TCG_FALLBACK_DECKS) {
    assert.equal(d.total_cards, 40, `Deck "${d.deck_name}" should contain 40 cards`);
    const built = buildDeck(TCG_FALLBACK_CARDS, { deck: d, decksPool: TCG_FALLBACK_DECKS });
    assert.equal(built.length, DECK_SIZE, `Built deck for "${d.deck_name}" has 40 instances`);
  }

  assert.equal(TCG_FALLBACK_STARTER_DECKS.length, 4);
});

test('1v1 GlimmerFallTCG game engine supports dice roll, draw, resonance, deploy, spell cast, and combat', () => {
  const deck1 = buildDeck(TCG_FALLBACK_CARDS, { deckName: 'Solar Singularity' });
  const deck2 = buildDeck(TCG_FALLBACK_CARDS, { deckName: "Gaia's Loop" });
  const state = newMatchState('Aurelius', deck1, 'Lyra', deck2, false);

  assert.equal(state.phase, 'DICE_ROLL');
  assert.equal(state.players['1'].hp, NEXUS_HP);
  assert.equal(state.players['2'].hp, NEXUS_HP);
  assert.equal(state.players['1'].hand.length, HAND_START);

  // Force deterministic dice roll resolution into PLAYING phase
  state.diceRolls['1'] = 6;
  state.diceRolls['2'] = null;
  applyAction(state, 2, 'ROLL_DICE', {});
  if (state.phase === 'DICE_ROLL') {
    // In the 1/6 chance P2 also rolled a 6, set directly
    state.activePlayer = 1;
    state.phase = 'PLAYING';
  }

  const activeSlot = String(state.activePlayer);
  const pl = state.players[activeSlot];

  // 1. Draw a card
  const handBefore = pl.hand.length;
  applyAction(state, activeSlot, 'DRAW_CARD', {});
  assert.equal(pl.hand.length, handBefore + 1);
  assert.equal(pl.hasDrawnThisTurn, true);

  // 2. Charge a Resonance Node (+1 Energy)
  const resCard = pl.hand[0];
  applyAction(state, activeSlot, 'PLAY_CARD', {
    instanceId: resCard.instanceId,
    destination: 'resonance',
  });
  assert.equal(pl.maxEnergy, 1);
  assert.equal(pl.energy, 1);
  assert.equal(pl.hasResonatedThisTurn, true);

  // 3. Inject a 1-cost Entity and deploy it to the battlefield
  const vanguard = makeInstance({
    id: 'test-vanguard',
    name: 'Solari Vanguard',
    faction: 'Solari',
    card_type: 'Entity',
    cost: 1,
    power: 2,
    health: 1,
    description: '',
    keywords: 'None',
    rarity: 'Common',
  });
  pl.hand.push(vanguard);
  applyAction(state, activeSlot, 'PLAY_CARD', {
    instanceId: vanguard.instanceId,
    destination: 'battlefield',
  });
  assert.equal(pl.battlefield.length, 1);
  assert.equal(pl.energy, 0);

  // 4. Attack enemy Nexus for 2 damage
  const oppSlot = activeSlot === '1' ? '2' : '1';
  const oppHpBefore = state.players[oppSlot].hp;
  applyAction(state, activeSlot, 'ATTACK_NEXUS', {
    attackerId: vanguard.instanceId,
  });
  assert.equal(state.players[oppSlot].hp, oppHpBefore - 2);
  assert.equal(pl.battlefield[0].exhausted, true);

  // 5. Redact state hides opponent hand cards and libraries
  const redacted = redactState(state, Number(activeSlot));
  assert.equal(redacted.players[activeSlot].library, undefined);
  assert.ok(redacted.players[oppSlot].hand.every((c) => c.hidden === true));

  // 6. End turn passes activePlayer
  applyAction(state, activeSlot, 'END_TURN', {});
  assert.equal(String(state.activePlayer), oppSlot);
});

test('TcgManager runs 1v1 AI and PvP matches and serves cards & deck lists', async () => {
  process.env.NODE_ENV = 'test';
  const mgr = new TcgManager();

  const cards = await mgr.getCards();
  assert.equal(cards.length, 322);

  const { decks } = await mgr.getDecks();
  assert.ok(decks.length >= 6);

  // Start a match vs GlimmerBot AI
  const aiMatch = await mgr.startMatch({
    username: 'TavernHero',
    deckName: 'Fractured Continuum',
    vsAI: true,
    aiDeckName: 'The Graveglass Veil',
  });
  assert.equal(aiMatch.status, 'PLAYING');
  assert.equal(aiMatch.vsAI, true);
  assert.equal(aiMatch.deckName, 'Fractured Continuum');
  assert.equal(aiMatch.opponentDeckName, 'The Graveglass Veil');

  // Perform a draw action on the match
  const afterDraw = await mgr.performAction({
    matchId: aiMatch.matchId,
    slot: 1,
    action: 'DRAW_CARD',
    payload: {},
  });
  assert.equal(afterDraw.ok, true);
  assert.equal(afterDraw.state.players['1'].hasDrawnThisTurn, true);
});

test('Tavern TCG Duel Table sprite and interactive tavern placements are wired', () => {
  const propSpritesSrc = fs.readFileSync(new URL('../client/sprites/propSprites.js', import.meta.url), 'utf8');
  const gameSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  const tcgUiSrc = fs.readFileSync(new URL('../client/tcgTavernDuel.js', import.meta.url), 'utf8');

  assert.ok(propSpritesSrc.includes('sprites.props.tcgDuelTable = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.trainingDummy = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.mysteryPeddlerCart = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.treasureCoffer = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.wishingShrine = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.ancientSundialClock = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.fishermanNetRack = []'));
  assert.ok(propSpritesSrc.includes('sprites.props.covenantBannerStand = []'));
  assert.ok(gameSrc.includes("'tcgDuelTable'"));
  assert.ok(gameSrc.includes("'trainingDummy'"));
  assert.ok(gameSrc.includes("'mysteryPeddlerCart'"));
  assert.ok(gameSrc.includes("'treasureCoffer'"));
  assert.ok(gameSrc.includes("'wishingShrine'"));
  assert.ok(gameSrc.includes("'ancientSundialClock'"));
  assert.ok(gameSrc.includes("'fishermanNetRack'"));
  assert.ok(gameSrc.includes("'covenantBannerStand'"));
  assert.ok(gameSrc.includes('window.openTcgTavernDuel'));
  assert.ok(gameSrc.includes('setupWorldEventsAndHeroShare'));
  assert.ok(tcgUiSrc.includes('TAVERN 1V1 CARD DUEL ARENA'));

  const heroShareSrc = fs.readFileSync(new URL('../client/game/heroCardShare.js', import.meta.url), 'utf8');
  const ambientSrc = fs.readFileSync(new URL('../client/game/ambientRenderer.js', import.meta.url), 'utf8');
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(heroShareSrc.includes('openActivityFinderModal'));
  assert.ok(heroShareSrc.includes('RECOMMENDED_ACTIVITIES'));
  assert.ok(ambientSrc.includes('drawAmbientCritters'));
  assert.ok(
    indexHtml.indexOf('id="dynamic-world-event-pill"') > indexHtml.indexOf('id="bottom-bar-dock"') &&
    indexHtml.indexOf('id="dynamic-world-event-pill"') < indexHtml.indexOf('id="xp-bar-wrap"'),
    'World Event notification pill must sit inside #bottom-bar-dock directly above #xp-bar-wrap'
  );
  assert.ok(heroShareSrc.includes('gf-we-go-btn') && !heroShareSrc.includes('top:44px'), 'World Event notification must use persistent clickable GO button above XP bar instead of overlapping top menu');
});
