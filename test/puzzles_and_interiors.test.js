import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  TILE_SIZE,
  isWaterTile,
  isCoralCoastPierTile,
  isCoralCoastDeepSeaTile,
  isInteriorVoidTile,
  isInteriorPartitionWallTile,
  isInteriorGardenTile,
} from '../shared/protocol.js';
import {
  PUZZLE_DEFINITIONS,
  createPuzzleProgress,
  submitPuzzleRune,
  resetPuzzleAttempt,
  isPuzzleUnlocked,
  claimPuzzleReward,
  isBlockedByPuzzleGate,
  buildNoticeBoardDialogue,
} from '../client/game/puzzlesAndInteriors.js';
import { getBiomeWeatherProfile } from '../client/game/atmosphereEffects.js';

test('Living L-shaped interiors preserve walkable spawn/exit tiles while blocking cutouts and partitions', () => {
  const interiors = [
    ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE,
    ROOM_TYPES.INTERIOR_TERRA_APOTHECARY,
    ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY,
  ];
  for (const roomType of interiors) {
    const cfg = ROOM_CONFIGS[roomType];
    assert.equal(isWaterTile(cfg.spawnX, cfg.spawnY, roomType), false, `${roomType} spawn must be walkable`);
    assert.equal(isWaterTile(0, 112, roomType), false, `${roomType} exit doormat must be walkable`);
  }

  // Cottage L-cutout (bottom-right) & NE Vault chamber
  assert.equal(isInteriorVoidTile(6, 5, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE), true);
  assert.equal(isWaterTile(100, 84, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE), true);
  assert.equal(isInteriorPartitionWallTile(4, -4, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE), true);
  assert.equal(isWaterTile(112, -40, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE), false); // open doorway under puzzle grate
  assert.equal(isWaterTile(112, -74, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE), false); // reward chest alcove interior

  // Terra Apothecary divided conservatory arch & living atrium
  assert.equal(isInteriorPartitionWallTile(-5, -1, ROOM_TYPES.INTERIOR_TERRA_APOTHECARY), true);
  assert.equal(isInteriorPartitionWallTile(0, -1, ROOM_TYPES.INTERIOR_TERRA_APOTHECARY), false);
  assert.equal(isWaterTile(0, -10, ROOM_TYPES.INTERIOR_TERRA_APOTHECARY), false);
  assert.equal(isInteriorGardenTile(-5, -4, ROOM_TYPES.INTERIOR_TERRA_APOTHECARY), true);

  // Aether Observatory bottom-left L-cutout
  assert.equal(isInteriorVoidTile(-7, 5, ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY), true);
  assert.equal(isWaterTile(-108, 84, ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY), true);
  assert.equal(isWaterTile(32, 0, ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY), false);
});

test('Coral Coast boardwalk extends to North Undercity edge and East L-Pier projects cleanly over deep sea', () => {
  // North boardwalk must reach northern edge transition at y = -576
  assert.equal(isCoralCoastDeepSeaTile(0, -36), true);
  assert.equal(isCoralCoastPierTile(0, -36), true);
  assert.equal(isWaterTile(0, -576, ROOM_TYPES.CORAL_COAST), false);

  // East Twilight Fishing L-Pier spur (x: 64..239, y: -400..-337)
  assert.equal(isCoralCoastPierTile(Math.floor(180 / TILE_SIZE), Math.floor(-370 / TILE_SIZE)), true);
  assert.equal(isWaterTile(180, -370, ROOM_TYPES.CORAL_COAST), false);
  assert.equal(isWaterTile(220, -368, ROOM_TYPES.CORAL_COAST), false);

  // Off-pier NE and East open sea remains unwalkable water
  assert.equal(isWaterTile(200, -480, ROOM_TYPES.CORAL_COAST), true);
  assert.equal(isWaterTile(400, 0, ROOM_TYPES.CORAL_COAST), true);

  // Coral Coast roomType triggers rain even though biomeTheme is solari
  assert.equal(getBiomeWeatherProfile('solari', 100, 'auto').kind, 'none');
  assert.equal(getBiomeWeatherProfile('solari', 100, 'auto', ROOM_TYPES.CORAL_COAST).kind, 'rain');
});

test('Covenant Rune Vault puzzles block passages until exact 4-rune solution and grant single-claim rewards', () => {
  let progress = createPuzzleProgress();

  // Blocked while locked
  const blockedCottage = isBlockedByPuzzleGate(112, -40, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE, progress);
  assert.equal(blockedCottage?.id, 'cottage_archive_vault');
  const blockedRuins = isBlockedByPuzzleGate(208, -216, ROOM_TYPES.NEXUS_FORGOTTEN_RUINS, progress);
  assert.equal(blockedRuins?.id, 'ruins_nexus_seal');

  // Cannot claim reward before unlocking
  assert.equal(claimPuzzleReward(progress, 'cottage_archive_vault').granted, false);

  // Wrong sequence resets cleanly
  for (const wrong of ['umbri', 'umbri', 'umbri', 'umbri']) {
    const step = submitPuzzleRune(progress, 'cottage_archive_vault', wrong);
    progress = step.progress;
  }
  assert.equal(isPuzzleUnlocked(progress, 'cottage_archive_vault'), false);
  assert.equal(progress.activeAttempt.length, 0);

  // Exact sequence unlocks & removes gate collision
  const sol = PUZZLE_DEFINITIONS.cottage_archive_vault.solution;
  sol.forEach((runeId, idx) => {
    const res = submitPuzzleRune(progress, 'cottage_archive_vault', runeId);
    progress = res.progress;
    assert.equal(res.status, idx < sol.length - 1 ? 'progress' : 'unlocked');
  });
  assert.equal(isPuzzleUnlocked(progress, 'cottage_archive_vault'), true);
  assert.equal(isBlockedByPuzzleGate(112, -40, ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE, progress), null);

  // Reset helper clears attempt safely
  progress = resetPuzzleAttempt(progress);
  assert.deepEqual(progress.activeAttempt, []);

  // Single-claim treasure protection
  const firstClaim = claimPuzzleReward(progress, 'cottage_archive_vault');
  assert.equal(firstClaim.granted, true);
  assert.ok(firstClaim.reward.gold > 0);
  progress = firstClaim.progress;
  assert.equal(claimPuzzleReward(progress, 'cottage_archive_vault').granted, false);
});

test('Notice Board bulletins & Phase 2 HTML/Sprite/Engine wiring exist cleanly', () => {
  for (const boardId of ['sanctuary_inn', 'sanctuary_cottage', 'terra_apothecary', 'coral_mariner']) {
    const pages = buildNoticeBoardDialogue(boardId);
    assert.ok(pages.length >= 1 && pages[0].text.length > 30, `Missing bulletin text for ${boardId}`);
  }

  const root = path.resolve(import.meta.dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const propSrc = fs.readFileSync(path.join(root, 'client/sprites/propSprites.js'), 'utf8');
  const gameSrc = fs.readFileSync(path.join(root, 'client/game.js'), 'utf8');

  assert.match(html, /id="rune-puzzle-modal"/);
  assert.match(html, /id="rune-puzzle-slots"/);
  assert.match(html, /id="rune-puzzle-choices"/);

  for (const sprKey of [
    'ironVaultGrate',
    'ironVaultGrateOpen',
    'factionCrestLeaf',
    'factionCrestAether',
    'sleepingPetCat',
    'sleepingPetFox',
    'terracottaUrn',
    'fallenLog',
    'balustradeRail',
    'woodStairs',
    'workstationConsole',
    'specimenFrame',
    'noticeBoard',
    'cattailReed',
  ]) {
    assert.ok(propSrc.includes(`sprites.props.${sprKey}`), `propSprites.js missing ${sprKey}`);
    assert.ok(gameSrc.includes(sprKey), `game.js missing render/usage for ${sprKey}`);
  }
});
