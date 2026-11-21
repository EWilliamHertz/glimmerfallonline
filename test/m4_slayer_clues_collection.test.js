import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ROOM_TYPES,
  EQUIPMENT_CATALOG,
  QUEST_REWARDS_CATALOG,
  createDefaultProgression,
  assignSlayerTask,
  advanceSlayerKill,
  skipSlayerTask,
  purchaseSlayerUnlock,
  startClueScroll,
  evaluateClueStep,
  rollClueCasketRewards,
  recordCollectionItems,
  getCollectionSummary,
  getMobDropTablePreview,
} from '../shared/protocol.js';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';

function createClientSession(accounts, { name = 'SlayerHero', level = 20, x = 0, y = 0 } = {}) {
  const sent = [];
  const { account } = accounts.createGuestAccount({
    preferredName: name,
    faction: 'Solari',
    classId: 'solari_vanguard',
  });
  const prog = account.progression || createDefaultProgression();
  prog.level = level;
  account.progression = prog;
  return {
    ...account,
    prog,
    hp: 150,
    maxHp: 150,
    shield: 0,
    solarCharge: 50,
    maxSolarCharge: 80,
    x,
    y,
    isDead: false,
    sent,
    ws: { readyState: 1, send: (raw) => sent.push(typeof raw === 'string' ? JSON.parse(raw) : raw) },
    send(pkt) {
      sent.push(pkt);
    },
  };
}

test('M4: Vanguard Slayer Masters, Streak Multipliers, Skips & Unlock Store', () => {
  let state = createDefaultProgression().slayer;

  // Level gate blocks high tier masters
  const tooLow = assignSlayerTask(state, 'stalker_kael', 5);
  assert.equal(tooLow.ok, false);

  // Assign Novice Scout task at Lv.5
  const assigned = assignSlayerTask(state, 'scout_vaelen', 5);
  assert.equal(assigned.ok, true);
  state = assigned.state;
  const matchingMobName = `Elite ${state.task.keywords[0]}`;
  state.task.targetCount = 2;
  state.streak = 4; // Next completion hits 5-task milestone (2x points!)

  const k1 = advanceSlayerKill(state, matchingMobName);
  assert.equal(k1.matched, true);
  assert.equal(k1.completed, false);
  state = k1.state;

  const k2 = advanceSlayerKill(state, matchingMobName);
  assert.equal(k2.matched, true);
  assert.equal(k2.completed, true);
  assert.equal(k2.streak, 5);
  assert.equal(k2.streakMult, 2);
  assert.ok(k2.pointsAwarded >= 10);
  state = k2.state;

  // Buy Slayer Helm unlock (25 pts)
  state.points = 35;
  const buy = purchaseSlayerUnlock(state, 'slayer_helm_craft');
  assert.equal(buy.ok, true);
  assert.equal(buy.grantItemId, 'slayer_helm');
  assert.equal(buy.state.points, 10);

  // Skip active task with 10 points preserves streak
  const a2 = assignSlayerTask(buy.state, 'scout_vaelen', 5);
  const sk = skipSlayerTask(a2.state, false);
  assert.equal(sk.ok, true);
  assert.equal(sk.resetStreak, false);
  assert.equal(sk.state.points, 0);
  assert.equal(sk.state.task, null);
});

test('M4: Treasure Trails step progression, Casket rewards & Collection Log deduplication', () => {
  let clue = startClueScroll({}, 'easy');
  assert.equal(clue.activeTier, 'easy');
  assert.equal(clue.steps.length, 2);

  // Force deterministic steps (coord + emote) to test progression
  clue.steps = [
    { id: 's1', tier: 'easy', kind: 'coord', roomType: ROOM_TYPES.CORAL_COAST, x: 120, y: 80, tolerance: 120, prompt: 'Dig at Coast' },
    { id: 's2', tier: 'easy', kind: 'emote', emoteId: 'cheer', prompt: 'Use /cheer' },
  ];

  // Wrong zone fails
  const wrongCoord = evaluateClueStep(clue, { roomType: ROOM_TYPES.SANCTUARY_HUB, x: 0, y: 0 });
  assert.equal(wrongCoord.advanced, false);

  // Right zone + coords advances step 1 -> 2
  const step1 = evaluateClueStep(clue, { roomType: ROOM_TYPES.CORAL_COAST, x: 130, y: 90 });
  assert.equal(step1.advanced, true);
  assert.equal(step1.completed, false);
  clue = step1.state;

  // Right emote completes trail -> casket_easy
  const step2 = evaluateClueStep(clue, { emoteId: 'cheer' });
  assert.equal(step2.advanced, true);
  assert.equal(step2.completed, true);
  assert.equal(step2.casketItemId, 'casket_easy');

  const casketLoot = rollClueCasketRewards('hard');
  assert.ok(casketLoot.some((r) => r.itemId === 'solar_gold' && r.qty >= 750));

  // Collection Log deduplication & summary
  const c1 = recordCollectionItems({}, ['slayer_helm', 'slayer_helm', 'ranger_boots', 'solar_gold']);
  assert.deepEqual(c1.newlyUnlocked, ['slayer_helm', 'ranger_boots']);
  assert.equal(c1.log.slayer_helm.count, 2);
  const c2 = recordCollectionItems(c1.log, ['ranger_boots', 'quest_point_cape']);
  assert.deepEqual(c2.newlyUnlocked, ['quest_point_cape']);
  const summary = getCollectionSummary(c2.log);
  assert.equal(summary.obtained, 3);
  assert.ok(summary.total >= 20);
});

test('M4: Authoritative Server Slayer Helm (+15%), Clue Scroll -> Casket flow & Quest Point Cape', () => {
  const accounts = new AccountsStore();
  const rm = new RoomManager({
    accountsStore: accounts,
    partyManager: {
      getPartyMembers: () => [],
      getPartyForMember: () => null,
      syncPlayerVitals: () => {},
    },
  });
  try {
    const room = rm.getOrCreatePublicRoom(ROOM_TYPES.SANCTUARY_HUB);
    const player = createClientSession(accounts, { name: 'TrailHunter', level: 25, x: 0, y: 0 });
    rm.joinRoom(player, room.id);

    // 1. Slayer assign + Slayer Helm +15% damage verification
    rm.handlePacket(player, { type: 'slayer_assign', masterId: 'scout_vaelen' });
    assert.ok(player.prog.slayer.task, 'Slayer task must be assigned');
    player.prog.slayer.task.keywords = ['training dummy', 'dummy'];
    player.equipment = { ...(player.equipment || {}), head: 'slayer_helm' };

    const dummy = room.entities.find((e) => e.type === 'dummy');
    dummy.hp = 500;
    dummy.maxHp = 500;
    const hpStart = dummy.hp;
    rm.applyAuthoritativeDamage(room, player, { kind: 'entity', ref: dummy }, 100, false, 'Strike', false);
    const dmgWithHelm = hpStart - dummy.hp;
    assert.ok(dmgWithHelm >= 115, `Slayer Helm must apply +15% bonus dmg against active task target (got ${dmgWithHelm})`);

    // 2. Server Clue Scroll inspect -> step attempt -> Reward Casket -> Open Casket
    accounts.addItemToInventory(player.id, 'cluescroll_easy', 1);
    rm.refreshClientFromAccount(player.id);
    rm.handlePacket(player, { type: 'clue_attempt', itemId: 'cluescroll_easy' });
    assert.equal(player.prog.clue.activeTier, 'easy');

    // Force single final emote step and execute /cheer emote
    player.prog.clue.steps = [{ id: 't_emote', tier: 'easy', kind: 'emote', emoteId: 'cheer', prompt: 'Use /cheer' }];
    player.prog.clue.stepIndex = 0;
    player._actionCooldowns = {};
    rm.handlePacket(player, { type: 'emote', emoteId: 'cheer' });
    rm.handlePacket(player, { type: 'clue_attempt', itemId: 'cluescroll_easy' });

    const acc = accounts.accountsById.get(player.id);
    assert.ok(acc.inventory.some((it) => (typeof it === 'string' ? it : it.id) === 'casket_easy'), 'Completed Clue Scroll must award casket_easy');

    // Open casket via use_consumable
    const casketIdx = acc.inventory.findIndex((it) => (typeof it === 'string' ? it : it.id) === 'casket_easy');
    rm.handlePacket(player, { type: 'use_consumable', slotIndex: casketIdx, itemId: 'casket_easy' });
    assert.ok(player.sent.some((m) => m.type === 'casket_opened' && m.tier === 'easy'));

    // 3. Quest Point Cape unlocked when all canonical quests are completed
    const allQuestIds = Object.keys(QUEST_REWARDS_CATALOG);
    for (let i = 0; i < allQuestIds.length - 1; i++) {
      acc.questState = acc.questState || {};
      acc.questState.completedQuests = acc.questState.completedQuests || {};
      acc.questState.completedQuests[allQuestIds[i]] = true;
    }
    const lastId = allQuestIds[allQuestIds.length - 1];
    const qRes = accounts.completeCanonicalQuest(player.id, lastId);
    assert.equal(qRes.ok, true);
    assert.equal(qRes.questCapeAwarded, true);
    assert.ok(Boolean(acc.progression.collectionLog?.quest_point_cape), 'Quest Point Cape must be stamped in Collection Log');
  } finally {
    rm.stop();
  }
});

test('M4: Drop table preview & Client UI wiring for Collection Log, Slayer & Quest Journal', () => {
  const bossRows = getMobDropTablePreview({ name: 'Elder Ironwood Colossus', isBoss: true, dropGear: 'ironwood_horned_helm' });
  assert.ok(bossRows.some((r) => r.itemId === 'cluescroll_hard'));
  assert.ok(bossRows.some((r) => r.itemId === 'ironwood_horned_helm' && r.rate.includes('Guaranteed')));
  assert.ok(EQUIPMENT_CATALOG.slayer_helm && EQUIPMENT_CATALOG.quest_point_cape && EQUIPMENT_CATALOG.ranger_boots);

  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes('id="lore-tab-collection"'));
  assert.ok(html.includes('id="drop-table-modal"'));
  assert.ok(html.includes('id="clue-scroll-modal"'));

  const craftingUi = fs.readFileSync('client/craftingUi.js', 'utf8');
  assert.ok(craftingUi.includes('getSlayerPanelHtml'));

  const gameJs = fs.readFileSync('client/game.js', 'utf8');
  assert.ok(gameJs.includes('openDropTableForEntity'));
  assert.ok(gameJs.includes('assignSlayerContract'));
  assert.ok(gameJs.includes('renderCollectionLogView'));
  assert.ok(gameJs.includes('QUEST POINT CAPE UNLOCKED'));
});
