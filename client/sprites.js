// ==========================================
// GlimmerFall Online 2D — Sprite Sheet Orchestrator & Barrel
// Modularized across client/sprites/*.js
// ==========================================
import { getCharacterSprites, getOrderBannerSprites, pixelateCardImage } from "./sprites/characterSprites.js";
import { buildTileSprites } from "./sprites/tileSprites.js";
import { buildPropSprites } from "./sprites/propSprites.js";
import { buildNpcSprites } from "./sprites/npcSprites.js";
import { buildEntityAndMonsterSprites } from "./sprites/entityAndMonsterSprites.js";

export { getCharacterSprites, getOrderBannerSprites, pixelateCardImage };

let cachedSpriteSheet = null;

export function buildSpriteSheet() {
  if (cachedSpriteSheet) return cachedSpriteSheet;
  const sprites = {
    tiles: {},
    hero: null,
    heroByFaction: {},
    heraldNpc: [],
    bankerNpc: [],
    merchantApothecaryNpc: [],
    merchantProvisionsNpc: [],
    merchantSmithNpc: [],
    merchantRelicsNpc: [],
    cartographerNpc: [],
    warzoneArchonNpc: [],
    solariCaptainNpc: [],
    solariFlamekeeperNpc: [],
    shadowBrokerNpc: [],
    shadowWraithmotherNpc: [],
    terraHerbalistNpc: [],
    terraElderDruidNpc: [],
    aetherAstromancerNpc: [],
    aetherChronosNpc: [],
    shadowNpc: [],
    druidNpc: [],
    chronoNpc: [],
    npcPortraits: {},
    allyPaladin: [],
    allyMage: [],
    dummy: [],
    node: [],
    nodeEmpty: null,
    grandNode: [],
    grandNodeEmpty: null,
    portal: [],
    nexusBlue: [],
    nexusRed: [],
    nexusCyan: [],
    nexusGold: [],
    nexusPurple: [],
    nexusGreen: [],
    siegeShard: [],
    voidStalker: [],
    duskFiend: [],
    mobSolari: [],
    mobTerra: [],
    mobAether: [],
    graniteBoss: [],
    bossSolari: [],
    bossUmbri: [],
    bossAether: [],
    props: {},
  };

  buildTileSprites(sprites);
  buildPropSprites(sprites);
  // ==========================================
  // 3. DEFAULT FACTION HERO SPRITES (Via Paperdoll Composer)
  // ==========================================
  sprites.heroByFaction.Solari = getCharacterSprites('Solari', 'solari_vanguard', {});
  sprites.heroByFaction.Umbri = getCharacterSprites('Umbri', 'umbral_assassin', {});
  sprites.heroByFaction.Terra = getCharacterSprites('Terra', 'forest_warden', {});
  sprites.heroByFaction.Aether = getCharacterSprites('Aether', 'chronomancer_sage', {});
  sprites.hero = sprites.heroByFaction.Solari;

  buildNpcSprites(sprites);
  buildEntityAndMonsterSprites(sprites);

  cachedSpriteSheet = sprites;
  return sprites;
}
