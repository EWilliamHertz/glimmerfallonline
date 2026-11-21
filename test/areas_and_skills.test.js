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

test('CrystalEcho Caverns (LUMINOUS_CAVERN), Vanguard Guildhall, and interactive world props are wired', async () => {
  const fs = await import('node:fs');
  const accounts = new AccountsStore({ persistencePath: null });
  const rm = new RoomManager(accounts);
  try {
    const cavern = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.LUMINOUS_CAVERN);
    assert.ok(cavern, 'LUMINOUS_CAVERN room must be created');
    assert.equal(protocol.isRoomUnlockedForEdition(protocol.ROOM_TYPES.LUMINOUS_CAVERN, 'free'), true, 'LUMINOUS_CAVERN must be open to all players');
    assert.equal(protocol.isRoomUnlockedForEdition(protocol.ROOM_TYPES.CORAL_COAST, 'free'), true, 'CORAL_COAST must be open to all players');
    assert.equal(protocol.isRoomUnlockedForEdition(protocol.ROOM_TYPES.SUNKEN_OASIS, 'free'), true, 'SUNKEN_OASIS must be open to all players');
    assert.equal(protocol.isRoomUnlockedForEdition(protocol.ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, 'free'), true, 'NEXUS_FORGOTTEN_RUINS must be open to all players');
    assert.ok(cavern.entities.some((e) => e.id === 'cavern_boss'), 'LUMINOUS_CAVERN must spawn Crystallis the Echo Warden boss');
    assert.ok(cavern.entities.some((e) => e.skillingType === 'mithril_vein'), 'LUMINOUS_CAVERN must spawn skilling veins');

    const propSrc = fs.readFileSync('client/sprites/propSprites.js', 'utf8');
    const gameSrc = fs.readFileSync('client/game.js', 'utf8');
    for (const key of [
      'arcaneTelescope',
      'runicObelisk',
      'archeryTarget',
      'supplyCrate',
      'crystalGeode',
      'alchemistAlembic',
      'bardHarpStand',
      'cavernEntrance',
    ]) {
      assert.ok(propSrc.includes(`sprites.props.${key}`), `propSprites.js must synthesize ${key}`);
      assert.ok(gameSrc.includes(key), `client/game.js must wire and render ${key}`);
    }
    assert.ok(gameSrc.includes('function tryInteractWorldObject(pr)'), 'client/game.js must define tryInteractWorldObject');

    // Frostspire Glacier & Grand GlimmerFall TCG Pavilion verification
    const frost = rm.getOrCreatePublicRoom(protocol.ROOM_TYPES.FROSTSPIRE_GLACIER);
    assert.ok(frost, 'FROSTSPIRE_GLACIER room must be created');
    assert.equal(protocol.isRoomUnlockedForEdition(protocol.ROOM_TYPES.FROSTSPIRE_GLACIER, 'free'), true, 'FROSTSPIRE_GLACIER must be open to all players');
    assert.ok(frost.entities.some((e) => e.id === 'frost_boss'), 'FROSTSPIRE_GLACIER must spawn Borealis boss');
    assert.ok(frost.entities.some((e) => e.skillingType === 'mithril_vein'), 'FROSTSPIRE_GLACIER must spawn Mithril veins');
    for (const key of ['auroraCrystalObelisk', 'glacialSupplySled']) {
      assert.ok(propSrc.includes(`sprites.props.${key}`), `propSprites.js must synthesize ${key}`);
      assert.ok(gameSrc.includes(key), `client/game.js must wire ${key}`);
    }
    const pavCfg = protocol.ROOM_CONFIGS[protocol.ROOM_TYPES.INTERIOR_TCG_PAVILION];
    assert.equal(pavCfg.isInterior, true, 'INTERIOR_TCG_PAVILION must be marked isInterior: true');

    // Streamlined Micro-Menu & Unified Hub + Combined Gear/Bag DOM verification
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    const hubStart = indexHtml.indexOf('id="micro-menu"');
    const hubEnd = indexHtml.indexOf('id="siege-banner"');
    const microDockHtml = indexHtml.slice(hubStart, hubEnd);
    const navButtons = microDockHtml.match(/class="[^"]*micro-nav-btn[^"]*"/g) || [];
    assert.equal(navButtons.length, 6, 'Top micro-menu dock must stay de-cramped with 6 focused buttons');
    const idxQuests = microDockHtml.indexOf('id="micro-btn-quests"');
    const idxTcg = microDockHtml.indexOf('id="micro-btn-tcg"');
    const idxMenu = microDockHtml.indexOf('id="micro-btn-menu"');
    assert.ok(idxQuests < idxTcg && idxTcg < idxMenu, 'Quests must sit on left, TCG in middle, Menu on right');
    assert.ok(indexHtml.includes('id="gearbag-modal"'), 'Combined Gear & Bag modal must exist in index.html');
    assert.ok(indexHtml.includes('id="adventure-hub-modal"'), 'Tabbed Adventure & System Hub modal must exist in index.html');

    // Verify unifiedMenuHub module imports clean EMOTES_CATALOG & switches tabs cleanly
    const hubMod = await import('../client/game/unifiedMenuHub.js');
    assert.ok(Array.isArray(hubMod.HUB_TAB_SPECS) && hubMod.HUB_TAB_SPECS.length === 10);
    assert.equal(hubMod.LEGACY_MODAL_TO_HUB_TAB['social-modal'], 'social');
    assert.equal(hubMod.LEGACY_MODAL_TO_HUB_TAB['settings-modal'], 'menu');
  } finally {
    rm.stop();
  }
});
