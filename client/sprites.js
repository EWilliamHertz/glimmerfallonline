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
  sprites.heroByFaction.Solari = getCharacterSprites('Solari', 'solari_vanguard', {
    weapon: 'solari_spellblade', armor: 'sunforged_plate', offhand: 'radiant_shield',
  });
  sprites.heroByFaction.Umbri = getCharacterSprites('Umbri', 'umbral_assassin', {
    weapon: 'scythe_soulreaper', armor: 'duskveil_shroud', offhand: 'graveglass_lantern',
  });
  sprites.heroByFaction.Terra = getCharacterSprites('Terra', 'forest_warden', {
    weapon: 'ironwood_maul', armor: 'ironwood_armor', offhand: 'bramble_buckler',
  });
  sprites.heroByFaction.Aether = getCharacterSprites('Aether', 'chronomancer_sage', {
    weapon: 'chronocore_staff', armor: 'starweave_robe', offhand: 'mirror_shield',
  });
  sprites.hero = sprites.heroByFaction.Solari;

  buildNpcSprites(sprites);
  buildEntityAndMonsterSprites(sprites);

  cachedSpriteSheet = sprites;
  return sprites;
}
