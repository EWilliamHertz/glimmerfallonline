import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOM_TYPES,
  DEFAULT_ARENA_MMR,
  ARENA_SEASON_TIERS,
  getArenaTierForMmr,
  calculateArenaEloDelta,
  TRINITY_ROLES,
  getDefaultRoleForClassId,
  canClassPerformRole,
  matchTrinityPartyFromQueue,
  PRIMEVAL_RAID_CONFIG,
  getNextHarbingerImmunity,
  WARZONE_INFLUENCE_CYCLE_MS,
  WARZONE_OUTPOST_DEFS,
  computeOutpostRealmBuffs,
} from '../shared/protocol.js';
import { AccountsStore } from '../server/accountsStore.js';
import { PartyManager } from '../server/partyManager.js';
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

function createTestHarness() {
  const accounts = new AccountsStore();
  let rooms = null;
  const parties = new PartyManager(
    (id) => rooms?.getClientById(id) || null,
    (q) => rooms?.findClientByName(q) || null
  );
  rooms = new RoomManager({ accountsStore: accounts, partyManager: parties });
  return { accounts, parties, rooms };
}

function createConnectedClient(accounts, rooms, opts = {}) {
  const { account } = accounts.createGuestAccount({
    preferredName: opts.displayName || 'Hero',
    faction: opts.faction || 'Solari',
    classId: opts.classId || 'solari_vanguard',
  });
  const activeChar = accounts.ensureDefaultCharacter(account);
  const tier = opts.editionTier ?? 'founder';
  account.editionTier = tier;
  account.statsMeta = { ...(account.statsMeta || {}), editionTier: tier };
  if (activeChar) {
    activeChar.statsMeta = { ...(activeChar.statsMeta || {}), editionTier: tier };
  }
  if (opts.mmr !== undefined || opts.wins !== undefined || opts.losses !== undefined) {
    accounts.saveProgression(account.id, account.progression, {
      setArenaMmr: opts.mmr,
      addArenaWins: opts.wins || 0,
      addArenaLosses: opts.losses || 0,
    });
  }
  const ws = createMockWs();
  const client = rooms.attachConnection(ws, account);
  client.editionTier = tier;
  return { account, ws, client };
}

test('Arena Elo MMR: PvP K=32 vs Bot K=16, Seasonal Tiers, real-MMR Hiscores, and Combat Scoreboard', () => {
  assert.equal(DEFAULT_ARENA_MMR, 1200);
  assert.equal(ARENA_SEASON_TIERS.length, 6);
  assert.equal(getArenaTierForMmr(1200).id, 'silver');
  assert.equal(getArenaTierForMmr(1740).id, 'diamond');
  assert.equal(getArenaTierForMmr(1950).id, 'gladiator');

  const pvpEqual = calculateArenaEloDelta({ playerMmr: 1200, opponentAvgMmr: 1200, won: true, isBotMatch: false });
  const botEqual = calculateArenaEloDelta({ playerMmr: 1200, opponentAvgMmr: 1200, won: true, isBotMatch: true });
  assert.equal(pvpEqual.delta, 16);
  assert.equal(botEqual.delta, 8);

  const { accounts, rooms } = createTestHarness();
  try {
    const a = createConnectedClient(accounts, rooms, {
      displayName: 'HighEloFewWins',
      faction: 'Solari',
      mmr: 1740,
      wins: 2,
    });
    const b = createConnectedClient(accounts, rooms, {
      displayName: 'FarmedLowElo',
      faction: 'Umbri',
      mmr: 1120,
      wins: 40,
      losses: 35,
    });

    const board = accounts.getHiscores({ category: 'arena_mmr', pageSize: 10 });
    assert.equal(board.rows[0].name, 'HighEloFewWins', 'Hiscores must rank by real arenaMmr instead of raw win count');
    assert.equal(board.rows[0].arenaMmr, 1740);
    assert.equal(board.rows[0].arenaTier, 'Diamond');
    assert.equal(board.rows[1].name, 'FarmedLowElo');

    const arenaRoom = rooms.createRoomInstance(ROOM_TYPES.ARENA_3V3, 'arena_test_elo');
    a.client.team = 'blue';
    b.client.team = 'red';
    rooms.joinRoom(a.client, arenaRoom.id, 'blue', -80, 0, 'right');
    rooms.joinRoom(b.client, arenaRoom.id, 'red', 80, 0, 'left');

    rooms.ensureArenaMatchMeta(arenaRoom, [a.client], [b.client]);
    arenaRoom.arenaMeta.isBotMatch = false;
    rooms.recordArenaCombatStat(arenaRoom, a.client.id, 'damage', 950);
    rooms.recordArenaCombatStat(arenaRoom, a.client.id, 'healing', 240);
    rooms.recordArenaCombatStat(arenaRoom, a.client.id, 'kills', 1);
    rooms.recordArenaCombatStat(arenaRoom, b.client.id, 'deaths', 1);

    const scoreboard = rooms.finalizeArenaMatchResults(arenaRoom, 'blue', a.client);
    assert.equal(scoreboard.length, 2);
    const aRow = scoreboard.find((r) => r.id === a.client.id);
    const bRow = scoreboard.find((r) => r.id === b.client.id);
    assert.equal(aRow.damage, 950);
    assert.equal(aRow.healing, 240);
    assert.equal(aRow.kills, 1);
    assert.ok(aRow.delta > 0);
    assert.ok(bRow.delta < 0);
    assert.ok(a.ws.sent.some((m) => m.type === 'arena_result' && m.mmrDelta > 0 && Array.isArray(m.scoreboard) && m.scoreboard.length === 2));
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Sanctuary Scrying Pool Spectator Mode isolates spectators from combat and returns them cleanly', () => {
  const { accounts, rooms } = createTestHarness();
  try {
    const f1 = createConnectedClient(accounts, rooms, { displayName: 'FighterOne', faction: 'Solari' });
    const f2 = createConnectedClient(accounts, rooms, { displayName: 'FighterTwo', faction: 'Umbri' });
    const spec = createConnectedClient(accounts, rooms, { displayName: 'Scryer', faction: 'Aether' });

    rooms.joinRoom(spec.client, ROOM_TYPES.SANCTUARY_HUB, null, 135, -80, 'down');
    const arenaRoom = rooms.createRoomInstance(ROOM_TYPES.ARENA_3V3, 'arena_scry_test');
    f1.client.team = 'blue';
    f2.client.team = 'red';
    rooms.joinRoom(f1.client, arenaRoom.id, 'blue', -80, 0, 'right');
    rooms.joinRoom(f2.client, arenaRoom.id, 'red', 80, 0, 'left');
    rooms.ensureArenaMatchMeta(arenaRoom, [f1.client], [f2.client]);

    const matches = rooms.listActiveArenaMatches();
    assert.ok(matches.some((m) => m.roomId === arenaRoom.id));

    rooms.handleSpectateArena(spec.client, arenaRoom.id);
    assert.equal(spec.client.isSpectator, true);
    assert.equal(spec.client.roomId, arenaRoom.id);
    assert.ok(spec.ws.sent.some((m) => m.type === 'spectator_state' && m.spectating === true));

    // Spectator cannot take damage or deal damage
    const hpBefore = spec.client.hp;
    rooms.applyAuthoritativeDamage(arenaRoom, f2.client, { kind: 'player', ref: spec.client }, 200, false, 'Void Slash', true);
    assert.equal(spec.client.hp, hpBefore);

    const fighterHpBefore = f2.client.hp;
    rooms.applyAuthoritativeDamage(arenaRoom, spec.client, { kind: 'player', ref: f2.client }, 200, false, 'Chrono Bolt', true);
    assert.equal(f2.client.hp, fighterHpBefore);

    // Leaving spectator mode returns to exact pre-spectate Sanctuary coordinates
    rooms.handleLeaveSpectate(spec.client);
    assert.equal(spec.client.isSpectator, false);
    assert.equal(spec.client.roomType, ROOM_TYPES.SANCTUARY_HUB);
    assert.equal(spec.client.x, 135);
    assert.equal(spec.client.y, -80);
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Role Trinity LFG Queue matches 1 Tank / 1 Healer / 3 DPS, runs Ready-Check, forms 5P Party & warps to Crypt', () => {
  assert.equal(getDefaultRoleForClassId('solari_vanguard'), TRINITY_ROLES.TANK);
  assert.equal(getDefaultRoleForClassId('aurora_marshal'), TRINITY_ROLES.HEALER);
  assert.equal(getDefaultRoleForClassId('umbral_assassin'), TRINITY_ROLES.DPS);
  assert.equal(canClassPerformRole('solari_vanguard', TRINITY_ROLES.TANK), true);
  assert.equal(canClassPerformRole('umbral_assassin', TRINITY_ROLES.TANK), false);

  const synthetic = [
    { accountId: 'd1', role: TRINITY_ROLES.DPS },
    { accountId: 'd2', role: TRINITY_ROLES.DPS },
    { accountId: 't1', role: TRINITY_ROLES.TANK },
    { accountId: 'h1', role: TRINITY_ROLES.HEALER },
    { accountId: 'd3', role: TRINITY_ROLES.DPS },
    { accountId: 'd4', role: TRINITY_ROLES.DPS },
  ];
  const { matched, remaining } = matchTrinityPartyFromQueue(synthetic);
  assert.equal(matched.length, 5);
  assert.equal(remaining.length, 1);

  const { accounts, parties, rooms } = createTestHarness();
  try {
    const freeTrial = createConnectedClient(accounts, rooms, { displayName: 'FreeHero', classId: 'solari_vanguard', faction: 'Solari', editionTier: 'free' });
    rooms.handleLfgJoin(freeTrial.client, { role: TRINITY_ROLES.TANK, dungeonType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, tier: 1 });
    assert.ok(freeTrial.ws.sent.some((m) => m.type === 'trial_gate'), 'Free accounts queueing Founder Crypt receive trial_gate');

    const tank = createConnectedClient(accounts, rooms, { displayName: 'TankP', classId: 'solari_vanguard', faction: 'Solari' });
    const heal = createConnectedClient(accounts, rooms, { displayName: 'HealP', classId: 'aurora_marshal', faction: 'Solari' });
    const dps1 = createConnectedClient(accounts, rooms, { displayName: 'DpsOne', classId: 'umbral_assassin', faction: 'Umbri' });
    const dps2 = createConnectedClient(accounts, rooms, { displayName: 'DpsTwo', classId: 'nexus_weaver', faction: 'Aether' });
    const dps3 = createConnectedClient(accounts, rooms, { displayName: 'DpsThree', classId: 'forest_warden', faction: 'Terra' });
    const players = [tank, heal, dps1, dps2, dps3];

    rooms.handleLfgJoin(tank.client, { role: TRINITY_ROLES.TANK, dungeonType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, tier: 1 });
    rooms.handleLfgJoin(heal.client, { role: TRINITY_ROLES.HEALER, dungeonType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, tier: 1 });
    rooms.handleLfgJoin(dps1.client, { role: TRINITY_ROLES.DPS, dungeonType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, tier: 1 });
    rooms.handleLfgJoin(dps2.client, { role: TRINITY_ROLES.DPS, dungeonType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, tier: 1 });
    rooms.handleLfgJoin(dps3.client, { role: TRINITY_ROLES.DPS, dungeonType: ROOM_TYPES.SOLARI_SUNKEN_VAULT, tier: 1 });

    const readyCheckMsg = tank.ws.sent.find((m) => m.type === 'lfg_ready_check');
    assert.ok(readyCheckMsg, '5th queue member must trigger lfg_ready_check across all 5 matched players');
    assert.equal(readyCheckMsg.roster.length, 5);

    for (const p of players) {
      rooms.handleLfgReadyResponse(p.client, { checkId: readyCheckMsg.checkId, accept: true });
    }

    const warpRoomIds = new Set(players.map((p) => p.client.roomId));
    assert.equal(warpRoomIds.size, 1, 'All 5 players must warp into the same private Mythic Crypt instance');
    assert.equal(tank.client.roomType, ROOM_TYPES.SOLARI_SUNKEN_VAULT);
    const party = parties.getPartyForPlayer(tank.client.id);
    assert.ok(party && party.memberIds.length === 5, 'PartyManager.formGroup must bind all 5 LFG players into 1 party');
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('10-Player Apex Raid handles rotating elemental immunity, Phase 2 Pylon Shield, Phase 3 Enrage & weekly lockouts', () => {
  assert.equal(PRIMEVAL_RAID_CONFIG.maxPlayers, 10);
  assert.equal(getNextHarbingerImmunity('Solari'), 'Umbri');

  const { accounts, rooms } = createTestHarness();
  try {
    const solRaider = createConnectedClient(accounts, rooms, { displayName: 'SolariRaider', faction: 'Solari' });
    const umbRaider = createConnectedClient(accounts, rooms, { displayName: 'UmbriRaider', faction: 'Umbri' });

    rooms.handleJoinRaid(solRaider.client);
    rooms.handleJoinRaid(umbRaider.client);
    assert.equal(solRaider.client.roomType, ROOM_TYPES.PRIMEVAL_NEXUS_RAID);
    assert.equal(solRaider.client.roomId, umbRaider.client.roomId);

    const raidRoom = rooms.rooms.get(solRaider.client.roomId);
    const boss = raidRoom.entities.find((e) => e.isRaidBoss);
    assert.ok(boss);
    assert.equal(boss.maxHp, PRIMEVAL_RAID_CONFIG.bossMaxHp);
    boss.immuneFaction = 'Solari';

    // Solari attacker is immune-blocked; Umbri attacker deals normal damage
    const hpBeforeImmune = boss.hp;
    rooms.applyAuthoritativeDamage(raidRoom, solRaider.client, { kind: 'entity', ref: boss }, 250, false, 'Solar Flare', true);
    assert.equal(boss.hp, hpBeforeImmune, 'Boss must take 0 damage from its currently attuned immuneFaction');

    rooms.applyAuthoritativeDamage(raidRoom, umbRaider.client, { kind: 'entity', ref: boss }, 250, false, 'Void Lance', true);
    assert.equal(boss.hp, hpBeforeImmune - 250, 'Non-immune faction deals full damage');

    // Phase 2 transition (<= 70% HP): spawns 4 Corner Pylons and raises 90% Pylon Shield
    boss.hp = Math.floor(boss.maxHp * 0.65);
    rooms.tickRaidBossMechanics(raidRoom, boss, Date.now());
    assert.equal(boss.phase, 2);
    assert.equal(boss.pylonShield, true);
    const pylons = raidRoom.entities.filter((e) => e.isPylon);
    assert.equal(pylons.length, 4);

    // 90% damage reduction while any Pylon stands
    const hpShielded = boss.hp;
    rooms.applyAuthoritativeDamage(raidRoom, umbRaider.client, { kind: 'entity', ref: boss }, 500, false, 'Void Lance', true);
    assert.equal(boss.hp, hpShielded - 50, 'Pylon shield reduces non-immune damage by 90%');

    // Destroy all 4 Pylons -> shield shatters
    for (const py of pylons) {
      py.hp = 0;
      py.isDying = true;
    }
    rooms.tickRaidBossMechanics(raidRoom, boss, Date.now());
    assert.equal(boss.pylonShield, false);

    // Phase 3 Enrage (<= 30% HP)
    boss.hp = Math.floor(boss.maxHp * 0.25);
    rooms.tickRaidBossMechanics(raidRoom, boss, Date.now());
    assert.equal(boss.phase, 3);
    assert.equal(boss.enraged, true);

    // Completing raid grants loot + weekly lockout and blocks double mythic loot
    rooms.completeRaidEncounter(raidRoom, boss, umbRaider.client);
    assert.ok(solRaider.ws.sent.some((m) => m.type === 'raid_completed' && m.lootItemId));
    const acct = accounts.accountsById.get(solRaider.client.id);
    assert.ok(Number(acct.progression.raidLockouts?.[PRIMEVAL_RAID_CONFIG.id] || 0) > Date.now());
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});

test('Capturable Warzone Outposts flip ownership, activate +15% XP & +10% Harvest Yield at 2+, and reward 30m cycle', () => {
  assert.equal(WARZONE_OUTPOST_DEFS.length, 4);
  assert.equal(WARZONE_INFLUENCE_CYCLE_MS, 30 * 60 * 1000);

  const singleBuff = computeOutpostRealmBuffs({ outpost_Terra: 'Solari', outpost_Umbri: 'Umbri', outpost_Solari: 'Umbri', outpost_Aether: 'Aether' }, 'Solari');
  assert.equal(singleBuff.hasBuff, false);
  const doubleBuff = computeOutpostRealmBuffs({ outpost_Terra: 'Solari', outpost_Umbri: 'Solari', outpost_Solari: 'Umbri', outpost_Aether: 'Aether' }, 'Solari');
  assert.equal(doubleBuff.hasBuff, true);
  assert.equal(doubleBuff.xpBonusPct, 15);
  assert.equal(doubleBuff.yieldBonusPct, 10);

  const { accounts, rooms } = createTestHarness();
  try {
    const hero = createConnectedClient(accounts, rooms, { displayName: 'Capturer', faction: 'Solari' });
    const surfaceRoom = rooms.getOrCreateOverworldRoom();
    const terraOutpost = surfaceRoom.entities.find((e) => e.id === 'outpost_Terra');
    assert.ok(terraOutpost, 'Surface overworld room must contain capturable outposts');

    // Capture 2nd outpost for Solari (outpost_Solari defaults to Solari)
    rooms.captureWarzoneOutpost(surfaceRoom, terraOutpost, hero.client);
    assert.equal(rooms.warzoneOutposts.outpost_Terra, 'Solari');
    const heroBuff = rooms.getPlayerOutpostBuffs(hero.client);
    assert.equal(heroBuff.hasBuff, true);
    assert.equal(heroBuff.xpMult, 1.15);
    assert.equal(heroBuff.yieldMult, 1.1);

    // 30m Influence Cycle awards +120 bonus XP (leveling up or increasing xp) to dominant faction holders
    const levelBefore = hero.client.prog.level || 1;
    const xpBefore = hero.client.prog.xp || 0;
    rooms.warzoneNextCycleAt = Date.now() - 10;
    rooms.tickWarzoneInfluenceCycle(Date.now());
    assert.ok(
      (hero.client.prog.level || 1) > levelBefore || (hero.client.prog.xp || 0) >= xpBefore + 120,
      'Dominant faction player receives 30m Influence Cycle bonus XP'
    );
  } finally {
    rooms.stop();
    clearStoreTimer(accounts);
  }
});
