import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DAY_CYCLE_DURATION_SECONDS,
  computeWorldTimeCycle,
  getBiomeWeatherProfile,
  getRoomLightingProfile,
  createAtmosphereRenderer,
} from '../client/game/atmosphereEffects.js';
import { TERRA_ORCHARD_DIALOGUE, AETHER_SPIRE_DIALOGUE } from '../client/game/dialoguesData.js';

test('24-minute world clock cycles smoothly across Dawn, Zenith, Twilight, and Nightfall', () => {
  assert.equal(DAY_CYCLE_DURATION_SECONDS, 1440);

  const dawn = computeWorldTimeCycle(344 * 1000, 'auto'); // 05:44
  assert.equal(dawn.formattedClock, '05:44');
  assert.equal(dawn.phase, 'dawn');
  assert.ok(dawn.darkAlpha > 0 && dawn.darkAlpha < 0.35);

  const noon = computeWorldTimeCycle(720 * 1000, 'auto'); // 12:00
  assert.equal(noon.formattedClock, '12:00');
  assert.equal(noon.phase, 'daylight');
  assert.equal(noon.darkAlpha, 0);

  const dusk = computeWorldTimeCycle(1160 * 1000, 'auto'); // 19:20
  assert.equal(dusk.formattedClock, '19:20');
  assert.equal(dusk.phase, 'twilight');
  assert.ok(dusk.darkAlpha > 0.1 && dusk.darkAlpha <= 0.42);

  const midnight = computeWorldTimeCycle(1380 * 1000, 'auto'); // 23:00
  assert.equal(midnight.formattedClock, '23:00');
  assert.equal(midnight.phase, 'nightfall');
  assert.ok(midnight.darkAlpha >= 0.42);
  assert.equal(midnight.lanternPower, 1.0);

  const lockedDay = computeWorldTimeCycle(1380 * 1000, 'daylight');
  assert.equal(lockedDay.formattedClock, '12:00');
  assert.equal(lockedDay.phase, 'daylight');
  assert.equal(lockedDay.darkAlpha, 0);
});

test('biome weather produces periodic rain in damp biomes and stays dry indoors/in caves', () => {
  const rainWindow = getBiomeWeatherProfile('coral_coast', 100, 'auto');
  assert.equal(rainWindow.kind, 'rain');
  assert.ok(rainWindow.intensity > 0.5);

  const indoorDry = getBiomeWeatherProfile('interior_tavern', 100, 'auto');
  assert.equal(indoorDry.kind, 'none');

  const caveDry = getBiomeWeatherProfile('solari_vault', 100, 'auto');
  assert.equal(caveDry.kind, 'none');

  const warzoneEmbers = getBiomeWeatherProfile('warzone', 100, 'auto');
  assert.equal(warzoneEmbers.kind, 'embers');

  const lockedClear = getBiomeWeatherProfile('coral_coast', 100, 'daylight');
  assert.equal(lockedClear.kind, 'none');
});

test('lighting profile enables dark cave visibility + exit cone for dungeon vaults while preserving interiors', () => {
  const day = computeWorldTimeCycle(720 * 1000, 'auto');
  const dry = { kind: 'none', intensity: 0 };

  const cave = getRoomLightingProfile('solari_vault', day, dry);
  assert.equal(cave.mode, 'cave');
  assert.equal(cave.isCaveDarkness, true);
  assert.equal(cave.hasEntryCone, true);
  assert.ok(cave.darkAlpha >= 0.6);

  const interior = getRoomLightingProfile('interior_apothecary', day, dry);
  assert.equal(interior.mode, 'interior');
  assert.equal(interior.hasEntryCone, false);
  assert.ok(interior.darkAlpha < 0.2);

  const wetOverworld = getRoomLightingProfile('terra', day, { kind: 'rain', intensity: 0.9 });
  assert.equal(wetOverworld.mode, 'overworld');
  assert.ok(wetOverworld.darkAlpha > 0);
  assert.ok(wetOverworld.lanternPower >= 0.65);
});

test('atmosphere renderer handles overworld rain, nightfall, and cave rendering cleanly', () => {
  const renderer = createAtmosphereRenderer();
  const noopGrad = () => ({ addColorStop() {} });
  const mockCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    save() {},
    restore() {},
    fillRect() {},
    beginPath() {},
    ellipse() {},
    stroke() {},
    arc() {},
    fill() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    drawImage() {},
    createRadialGradient: noopGrad,
    createLinearGradient: noopGrad,
  };

  const lighting = renderer.render({
    ctx: mockCtx,
    dt: 0.016,
    camLeft: -160,
    camTop: -120,
    viewW: 640,
    viewH: 480,
    mapBounds: { halfW: 384, halfH: 384 },
    biomeTheme: 'terra',
    timeCycle: computeWorldTimeCycle(344 * 1000, 'auto'),
    weather: { kind: 'rain', intensity: 0.85, label: 'RAIN' },
    player: { x: 0, y: 0 },
    props: [{ type: 'streetLantern', x: 32, y: -10 }],
    entities: [{ type: 'node', x: 48, y: 12, charges: 2, skillingType: 'mineral_vein' }],
    remotePlayers: new Map([['p2', { renderX: 16, renderY: 20, isDead: false, stealthed: false }]]),
    npcs: [{ id: 'npc_test', x: 20, y: -15 }],
    globalTime: 5.5,
  });
  assert.equal(lighting.mode, 'overworld');
});

test('HUD clock pill, Mariner NPC bust portrait, and enriched lore dialogues are wired', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="minimap-clock-pill"'));
  assert.ok(indexHtml.includes('toggleAtmosphereMode()'));

  const npcSpritesSrc = fs.readFileSync(path.resolve('client/sprites/npcSprites.js'), 'utf8');
  assert.ok(npcSpritesSrc.includes('sprites.npcPortraits.anglerFinnNpc'));

  const gameJsSrc = fs.readFileSync(path.resolve('client/game.js'), 'utf8');
  assert.ok(gameJsSrc.includes('atmosphereRenderer.render'));
  assert.ok(gameJsSrc.includes('updateMinimapClockHud'));
  assert.ok(gameJsSrc.includes('activeDialogueNpcId === npc.id'));

  assert.ok(TERRA_ORCHARD_DIALOGUE.some((p) => p.text.includes('Grass, Tidewater, Rich Soil, and Ancient Stone')));
  assert.ok(AETHER_SPIRE_DIALOGUE.some((p) => p.text.includes('harmonic memory')));
});
