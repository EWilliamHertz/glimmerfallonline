import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../server/roomManager.js';
import { AccountsStore } from '../server/accountsStore.js';
import * as protocol from '../shared/protocol.js';

test('Starlight Grove and Chronocore Citadel initialize with reciprocal transitions, skilling nodes, and skill shrines', () => {
  const accounts = new AccountsStore({ persistencePath: null });
  const rm = new RoomManager(accounts);
  try {
    const grove = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.STARLIGHT_GROVE);
    const citadel = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.CHRONOCORE_CITADEL);

    assert.ok(grove.entities.some((e) => e.skillingType === 'tree_starlight'), 'Starlight Grove should have Starlight Elder Trees');
    assert.ok(grove.entities.some((e) => e.type === 'shrine' && e.reqSkill === 'resonance_extraction'), 'Starlight Grove should have a Resonance Extraction Shrine');
    assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS].edgeTransitions.west, protocol.ROOM_TYPES.STARLIGHT_GROVE);
    assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.STARLIGHT_GROVE].edgeTransitions.east, protocol.ROOM_TYPES.IRONWOOD_TIMBERLANDS);

    assert.ok(citadel.entities.some((e) => e.type === 'dummy'), 'Chronocore Citadel should have Trial Dummies');
    assert.ok(citadel.entities.some((e) => e.type === 'shrine' && e.reqSkill === 'rites'), 'Chronocore Citadel should have a Rites Mastery Shrine');
    assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.CELESTIAL_ASCENT].edgeTransitions.east, protocol.ROOM_TYPES.CHRONOCORE_CITADEL);
    assert.equal(protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.CHRONOCORE_CITADEL].edgeTransitions.west, protocol.ROOM_TYPES.CELESTIAL_ASCENT);
  } finally {
    rm.stop();
  }
});

test('Skill-Gated Mastery Shrines enforce skill level requirements and grant 180s blessing + XP when met', () => {
  const accounts = new AccountsStore({ persistencePath: null });
  const rm = new RoomManager(accounts);
  rm.parties = { areInSameParty: () => false, syncPlayerVitals: () => {} };
  try {
    const grove = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.STARLIGHT_GROVE);
    const shrine = grove.entities.find((e) => e.id === 'sg_shrine_resonance');
    assert.ok(shrine);

    const msgs = [];
    const prog = protocol.createDefaultProgression('forest_warden');
    const player = {
      id: 'skill_tester',
      roomId: grove.id,
      displayName: 'SkillTester',
      x: shrine.x,
      y: shrine.y,
      hp: 50,
      maxHp: 200,
      solarCharge: 10,
      maxSolarCharge: 100,
      isDead: false,
      prog,
      questState: {},
      send(m) { msgs.push(m); },
    };

    // Lv. 1 player should be blocked
    rm.handleHarvestNode(grove, player, shrine.id);
    assert.equal(shrine.charges, 5, 'Shrine charge should not be consumed when skill level is too low');
    assert.ok(msgs.some((m) => m.text && m.text.includes('requires')), 'Should inform player of required skill level');

    // Raise Resonance Extraction to Lv. 15+
    prog.professions.resonance_extraction.xp = 25000;
    const prevXp = prog.xp || 0;
    rm.handleHarvestNode(grove, player, shrine.id);
    assert.equal(shrine.charges, 4, 'Shrine charge should decrement after activation');
    assert.equal(player.shrineBuff?.timer, 180, 'Mastery shrine should grant 180s blessing');
    assert.equal(player.hp, player.maxHp, 'Mastery shrine should restore full HP');
    assert.ok((prog.xp || 0) > prevXp, 'Mastery shrine should award Hero XP');
  } finally {
    rm.stop();
  }
});
