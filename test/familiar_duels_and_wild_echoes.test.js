import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  NEXUS_FAMILIARS_CATALOG,
  FAMILIAR_BATTLE_KITS,
  FAMILIAR_VARIANTS_CATALOG,
  FAMILIAR_DUEL_MAX_DURATION_MS,
  getFamiliarFactionMultiplier,
  createFamiliarDuelSession,
  executeFamiliarDuelMove,
  resolveFamiliarDuelTimeout,
  isFamiliarDuelRoomAllowed,
  normalizeFamiliarState,
  computeFamiliarBonuses,
  WILD_STRAY_ECHOES_CATALOG,
  pickWildStrayEchoForZone,
  createDefaultProgression,
} from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { RoomManager } from '../server/roomManager.js';

function createMockWs() {
  const sent = [];
  return {
    readyState: 1,
    sent,
    send(raw) {
      sent.push(JSON.parse(raw));
    },
  };
}

function clearStoreTimer(store) {
  if (store?.flushTimer) {
    clearTimeout(store.flushTimer);
    store.flushTimer = null;
  }
}

function connectPlayer(accounts, rooms, { name, faction, classId }) {
  const { account } = accounts.createGuestAccount({
    preferredName: name,
    faction,
    classId,
  });
  const ws = createMockWs();
  const client = rooms.attachConnection(ws, account);
  return { account, ws, client };
}

test('All 6 Familiars define 3-move Tactical Kits and symmetric 4-faction advantage wheel (+35% / -20%)', () => {
  const famIds = Object.keys(NEXUS_FAMILIARS_CATALOG);
  assert.equal(famIds.length, 6);
  for (const id of famIds) {
    const kit = FAMILIAR_BATTLE_KITS[id];
    assert.ok(kit && kit.moves.strike && kit.moves.ward && kit.moves.surge, `Familiar ${id} must define strike, ward, and surge`);
  }

  assert.equal(getFamiliarFactionMultiplier('Solari', 'Umbri').mult, 1.35);
  assert.equal(getFamiliarFactionMultiplier('Umbri', 'Solari').mult, 1.35);
  assert.equal(getFamiliarFactionMultiplier('Terra', 'Aether').mult, 1.35);
  assert.equal(getFamiliarFactionMultiplier('Aether', 'Terra').mult, 1.35);
  assert.equal(getFamiliarFactionMultiplier('Solari', 'Solari').mult, 0.80);
  assert.equal(getFamiliarFactionMultiplier('Solari', 'Terra').mult, 1.0);

  assert.equal(isFamiliarDuelRoomAllowed(ROOM_TYPES.SANCTUARY_HUB, ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB]), true);
  assert.equal(isFamiliarDuelRoomAllowed(ROOM_TYPES.INTERIOR_TAVERN, ROOM_CONFIGS[ROOM_TYPES.INTERIOR_TAVERN]), true);
  assert.equal(isFamiliarDuelRoomAllowed(ROOM_TYPES.NEXUS_WARZONE, ROOM_CONFIGS[ROOM_TYPES.NEXUS_WARZONE]), false);
  assert.equal(isFamiliarDuelRoomAllowed(ROOM_TYPES.ARENA_3V3, ROOM_CONFIGS[ROOM_TYPES.ARENA_3V3]), false);

  assert.equal(FAMILIAR_DUEL_MAX_DURATION_MS, 60000);
  const duel = createFamiliarDuelSession({
    id: 'test_duel_1',
    startedAt: 1000,
    fighterA: { ownerId: 'p1', ownerName: 'A', familiarId: 'dawnkit_ember_fox', variant: 'starlight' },
    fighterB: { ownerId: 'p2', ownerName: 'B', familiarId: 'graveglass_wisp_imp', variant: 'default' },
  });

  const wardRes = executeFamiliarDuelMove(duel, 'b', 'ward', 1100);
  assert.equal(wardRes.ok, true);
  assert.ok(duel.fighters.b.shield > 0);

  const surgeRes = executeFamiliarDuelMove(duel, 'a', 'surge', 1200);
  assert.equal(surgeRes.ok, true);
  assert.equal(surgeRes.relation, 'super', 'Solari surge vs Umbri must trigger +35% advantage');
  assert.ok(duel.fighters.b.hp < duel.fighters.b.maxHp || duel.fighters.b.shield < 18);

  duel.fighters.a.hp = 90;
  duel.fighters.b.hp = 40;
  assert.equal(resolveFamiliarDuelTimeout(duel, 1000 + FAMILIAR_DUEL_MAX_DURATION_MS + 10), true);
  assert.equal(duel.ended, true);
  assert.equal(duel.winnerOwnerId, 'p1');
});

test('Server /famduel in Sanctuary/Tavern runs non-lethal PvP skirmish, persists duelWins & quest counter', () => {
  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const alice = connectPlayer(accounts, rooms, { name: 'AliceSummoner', faction: 'Solari', classId: 'solari_vanguard' });
    const bob = connectPlayer(accounts, rooms, { name: 'BobSummoner', faction: 'Umbri', classId: 'umbral_assassin' });

    rooms.joinRoom(alice.client, ROOM_TYPES.INTERIOR_TAVERN, null, 0, 20, 'down');
    rooms.joinRoom(bob.client, ROOM_TYPES.INTERIOR_TAVERN, null, 40, 20, 'left');

    const aliceHpBefore = alice.client.hp;
    const bobHpBefore = bob.client.hp;

    rooms.handlePacket(alice.client, { type: 'chat', channel: 'say', text: `/famduel ${bob.client.displayName}` });
    const invite = bob.ws.sent.find((m) => m.type === 'fam_duel_invite');
    assert.ok(invite, '/famduel <player> must send fam_duel_invite');

    rooms.handlePacket(bob.client, { type: 'fam_duel_respond', inviteId: invite.inviteId, accept: true });
    const stateMsg = alice.ws.sent.find((m) => m.type === 'fam_duel_state');
    assert.ok(stateMsg && stateMsg.duel && !stateMsg.duel.ended);

    // Execute moves until knockout or forfeit to verify full end-to-end completion
    const duelObj = rooms.findActiveFamiliarDuelForPlayer(alice.client.id);
    assert.ok(duelObj);
    duelObj.fighters.b.hp = 10;
    rooms.handlePacket(alice.client, { type: 'fam_duel_move', duelId: duelObj.id, moveKey: 'surge' });

    const endedAlice = alice.ws.sent.find((m) => m.type === 'fam_duel_ended');
    const endedBob = bob.ws.sent.find((m) => m.type === 'fam_duel_ended');
    assert.ok(endedAlice && endedAlice.won === true);
    assert.ok(endedBob && endedBob.won === false);

    // Non-lethal guarantee: neither player is slain or loses HP (winning XP level-up may even increase maxHp!)
    assert.equal(alice.client.isDead, false);
    assert.equal(bob.client.isDead, false);
    assert.ok(alice.client.hp >= aliceHpBefore);
    assert.equal(bob.client.hp, bobHpBefore);
    assert.equal(alice.client.prog.familiars.duelWins, 1);
    assert.equal(alice.client.questState.famDuelsCompleted, 1);

    // Blocked outside Sanctuary & Tavern interiors
    rooms.joinRoom(alice.client, ROOM_TYPES.NEXUS_WARZONE, null, 0, 0, 'down');
    alice.ws.sent.length = 0;
    rooms.handlePacket(alice.client, { type: 'fam_duel_challenge', mode: 'trainer' });
    assert.equal(Boolean(rooms.findActiveFamiliarDuelForPlayer(alice.client.id)), false);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Wild World-Event Stray Echoes soothe via Harmonic Cipher for Echo-Print, Title, and cosmetic Starlight/Prismatic Variants', () => {
  assert.ok(Object.keys(WILD_STRAY_ECHOES_CATALOG).length >= 6);
  assert.ok(pickWildStrayEchoForZone(ROOM_TYPES.SOLAR_HIGHLANDS));

  // Verify cosmetic variants never inflate computeFamiliarBonuses
  const baseBonus = computeFamiliarBonuses('dawnkit_ember_fox');
  const normState = normalizeFamiliarState({
    unlockedIds: ['dawnkit_ember_fox'],
    activeId: 'dawnkit_ember_fox',
    variants: { dawnkit_ember_fox: ['prismatic'] },
    activeVariants: { dawnkit_ember_fox: 'prismatic' },
  });
  assert.equal(normState.activeVariants.dawnkit_ember_fox, 'prismatic');
  assert.deepEqual(computeFamiliarBonuses(normState.activeId), baseBonus, 'Starlight/Prismatic variants add 0 mandatory combat stats');

  const accounts = new AccountsStore();
  const rooms = new RoomManager(accounts);
  try {
    const hero = connectPlayer(accounts, rooms, { name: 'Whisperer', faction: 'Solari', classId: 'solari_vanguard' });
    const overworld = rooms.getOrCreateOverworldRoom();
    overworld._nextStrayEchoCheckAt = 0;
    rooms.ensureWorldEventStrayEcho(overworld, Date.now());

    const stray = overworld.entities.find((e) => e.type === 'wild_echo');
    assert.ok(stray, 'Overworld must spawn Wild Stray Echo for active world event or Sanctuary');

    hero.client.x = stray.x;
    hero.client.y = stray.y;
    const acc = accounts.accountsById.get(hero.client.id);
    acc.inventory.push({ id: stray.requiredCipherId, qty: 2 });

    // Force RNG < variantChance -> deterministic Starlight/Prismatic variant unlock
    const sootheRes = rooms.handleSootheWildEcho(overworld, hero.client, stray.id, () => 0.1);
    assert.equal(sootheRes.ok, true);
    assert.ok(sootheRes.rewardPrintId);
    assert.ok(sootheRes.unlockedVariant === 'starlight' || sootheRes.unlockedVariant === 'prismatic');
    assert.ok(hero.client.prog.achievements.unlockedTitles.includes(sootheRes.titleUnlock));
    assert.equal(hero.client.questState.wildEchoesSoothed, 1);

    // Toggle variant back to classic then back to unlocked variant, persisted through mergeValidProgression
    rooms.handlePacket(hero.client, { type: 'set_familiar_variant', familiarId: stray.familiarId, variant: 'default' });
    assert.equal(hero.client.prog.familiars.activeVariants[stray.familiarId], undefined);
    rooms.handlePacket(hero.client, {
      type: 'set_familiar_variant',
      familiarId: stray.familiarId,
      variant: sootheRes.unlockedVariant,
    });
    assert.equal(hero.client.prog.familiars.activeVariants[stray.familiarId], sootheRes.unlockedVariant);

    const merged = accounts.mergeValidProgression(createDefaultProgression(), hero.client.prog);
    assert.ok(merged.familiars.variants[stray.familiarId].includes(sootheRes.unlockedVariant));
    assert.equal(merged.familiars.activeVariants[stray.familiarId], sootheRes.unlockedVariant);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Client & Echo Keeper quests wire /famduel modal, 3-move kits, variants, and Wild Stray Echo interaction', () => {
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const summonerUi = fs.readFileSync(new URL('../client/game/summonerAndMailUi.js', import.meta.url), 'utf8');
  const decorJs = fs.readFileSync(new URL('../client/game/zoneDecorBuilders.js', import.meta.url), 'utf8');
  const questsJs = fs.readFileSync(new URL('../client/game/questCatalogData.js', import.meta.url), 'utf8');
  const gameJs = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');

  assert.match(indexHtml, /id="fam-duel-modal"/);
  assert.match(summonerUi, /export function renderFamiliarDuelModal/);
  assert.match(summonerUi, /3-Move Skirmish Kit/);
  assert.match(decorJs, /npc_echo_keeper_sylvi/);
  assert.match(decorJs, /npc_echo_keeper_rime/);
  assert.match(questsJs, /quest_echo_keeper_duels/);
  assert.match(questsJs, /quest_echo_keeper_whisper/);
  assert.match(gameJs, /\/famduel/);
  assert.match(gameJs, /soothe_wild_echo/);
  assert.match(gameJs, /activeFamiliarVariant/);
  assert.ok(FAMILIAR_VARIANTS_CATALOG.starlight && FAMILIAR_VARIANTS_CATALOG.prismatic);
});
