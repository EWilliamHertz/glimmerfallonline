import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  BOUNTY_CONTRACTS,
  CLASSES_CATALOG,
  EQUIPMENT_CATALOG,
  NEXUS_FAMILIARS_CATALOG,
} from '../shared/protocol.js';
import { QUEST_CATALOG } from '../client/game/questCatalogData.js';
import { WORLD_ATLAS_REGIONS } from '../client/game/worldAtlasData.js';
import {
  UNIVERSAL_SEARCH_CHARACTERS,
  UNIVERSAL_SEARCH_ITEMS,
  UNIVERSAL_SEARCH_NPCS,
  UNIVERSAL_SEARCH_QUESTS,
  UNIVERSAL_SEARCH_SKILLS,
  UNIVERSAL_SEARCH_ZONES,
  findUniversalMentions,
  resolveUniversalEntry,
  searchMapZones,
  searchUniversalCatalog,
} from '../landing/src/data/universalSearchData.js';
import { LandingPageController } from '../client/landing.js';
import {
  renderSearchableAtlasSection,
  renderUniversalSearchHeaderBar,
  renderUniversalSearchModal,
} from '../client/game/landingUniversalSearchUi.js';
import { renderLandingSkillGuidesTab } from '../client/game/landingSkillGuidesUi.js';

test('Universal Search index maintains strict catalog parity across items, characters, quests, zones, and skills', () => {
  assert.equal(UNIVERSAL_SEARCH_ITEMS.length, Object.keys(EQUIPMENT_CATALOG).length);
  assert.equal(
    UNIVERSAL_SEARCH_CHARACTERS.length,
    Object.keys(CLASSES_CATALOG).length + Object.keys(NEXUS_FAMILIARS_CATALOG).length
  );
  assert.equal(
    UNIVERSAL_SEARCH_QUESTS.length,
    Object.keys(QUEST_CATALOG).length + Object.keys(BOUNTY_CONTRACTS).length
  );
  assert.equal(UNIVERSAL_SEARCH_ZONES.length, Object.keys(WORLD_ATLAS_REGIONS).length);
  assert.equal(UNIVERSAL_SEARCH_SKILLS.length, 7);
  assert.ok(UNIVERSAL_SEARCH_NPCS.length >= 28);
});

test('Item lookup answers what items do, how to obtain them (nodes, recipes, shops), and where ingredients are used', () => {
  const lotus = resolveUniversalEntry('chrono_lotus');
  assert.ok(lotus && lotus.type === 'item');
  assert.ok(lotus.harvestSources.length > 0, 'chrono_lotus must list gathering nodes');
  assert.ok(
    lotus.harvestSources.some((h) => (h.zones || []).length > 0),
    'chrono_lotus harvest node must link to map zones'
  );
  assert.ok(
    lotus.usedInRecipes.length >= 5,
    'chrono_lotus must show Rite-Binding recipes that consume it'
  );

  const imbue = resolveUniversalEntry('chrono_starlight_imbue');
  assert.ok(imbue && imbue.type === 'item');
  assert.ok(imbue.whatItDoes.includes('Weapon Imbue'));
  assert.ok(imbue.craftedBy.length > 0, 'crafted item must show recipe + ingredients');
  assert.ok(
    imbue.craftedBy[0].ingredients.some((i) => i.id === 'empyrean_starleaf'),
    'Chronocore Astral Whetstone recipe must include empyrean_starleaf ingredient'
  );

  const draught = resolveUniversalEntry('chrono_overdrive_draught');
  assert.ok(
    draught?.craftedBy?.[0]?.ingredients?.some((i) => i.id === 'chrono_lotus'),
    'Chrono-Overdrive Draught recipe must include chrono_lotus ingredient'
  );

  const owl = resolveUniversalEntry('starfall_moon_owl');
  assert.ok(owl && owl.type === 'character');
  assert.equal(owl.kind, 'Nexus Familiar');
  assert.ok(owl.ingredients.some((i) => i.id === 'echo_print_starfall_owl'));
});

test('NPC lookup includes verbatim dialogue quotes, quests & rewards held, and merchant inventory', () => {
  const faye = resolveUniversalEntry('merchant_apothecary');
  assert.ok(faye && faye.type === 'npc');
  assert.equal(faye.name, 'Alchemist Faye');
  assert.ok(faye.whatTheySay.length >= 3, 'Alchemist Faye must include her verbatim dialogue/greetings');
  assert.ok(faye.quests.length >= 1, 'Alchemist Faye must list quests she holds');
  assert.ok(faye.shopWares.length >= 5, 'Alchemist Faye must expose apothecary wares & gold prices');
  assert.equal(faye.teachesSkill?.id, 'rite_binding');

  const lyra = resolveUniversalEntry('npc_aurora');
  assert.ok(lyra && lyra.type === 'npc');
  assert.ok(lyra.quests.some((q) => q.id === 'quest_awakening' && q.rewards.xp > 0));
});

test('Universal Search filtering, Skill Guide mention extraction, and Continental Map Search work deterministically', () => {
  const { results, countsByType } = searchUniversalCatalog('Rite-Binding', 'all', 25);
  assert.ok(results.length > 0);
  assert.ok(countsByType.all >= countsByType.item);

  const mentions = findUniversalMentions(
    'sunbloom_herb, astral_mineral_dust, Chrono-Lotus + Starfall Moon-Owl (Alchemist Faye)'
  );
  const mentionIds = new Set(mentions.map((m) => m.id));
  assert.ok(mentionIds.has('sunbloom_herb'));
  assert.ok(mentionIds.has('chrono_lotus'));
  assert.ok(mentionIds.has('starfall_moon_owl'));
  assert.ok(mentionIds.has('merchant_apothecary'));

  const byNpc = searchMapZones('Alchemist Faye');
  assert.ok(byNpc.some((r) => r.zone.id === 'TERRA_ORCHARD'));

  const byBoss = searchMapZones('Ignis-Core');
  assert.ok(byBoss.some((r) => r.zone.id === 'STARFALL_CRATER'));

  const byResource = searchMapZones('Chrono-Lotus');
  assert.ok(byResource.length >= 6);
  assert.ok(byResource.some((r) => r.zone.id === 'AETHER_SPIRE'));
});

test('Pre-game landing overlay renders Header Search Bar, Modal Inspector, Searchable Map, and Skill Guide inspect pills', () => {
  const ctrl = new LandingPageController();
  const headerHtml = renderUniversalSearchHeaderBar(ctrl);
  assert.ok(headerHtml.includes('id="gf-header-search-input"'));
  assert.ok(headerHtml.includes('Ctrl+K'));

  ctrl.inspectUniversalEntry('chrono_lotus');
  assert.equal(ctrl.universalSearchOpen, true);
  assert.equal(ctrl.selectedSearchEntryId, 'chrono_lotus');

  const modalHtml = renderUniversalSearchModal(ctrl);
  assert.ok(modalHtml.includes('id="gf-universal-search-modal"'));
  assert.ok(modalHtml.includes('Chrono-Lotus Blossom'));
  assert.ok(modalHtml.includes('Used to Craft / Compile'));

  ctrl.setMapSearchQuery('Ignis-Core');
  const atlasHtml = renderSearchableAtlasSection(ctrl);
  assert.ok(atlasHtml.includes('id="gf-map-search-input"'));
  assert.ok(atlasHtml.includes('Starfall Meteorite Crater'));

  const sgHtml = renderLandingSkillGuidesTab({ selectedSkillId: 'rite_binding' });
  assert.ok(sgHtml.includes('Inspect Sources:'));
  assert.ok(sgHtml.includes("inspectUniversalEntry('sunbloom_herb')"));
});

test('Next.js Landing Page and In-Game World Atlas Modal integrate header search and map search bars cleanly', () => {
  const nextPagePath = path.join(process.cwd(), 'landing', 'src', 'app', 'page.jsx');
  const nextModalPath = path.join(process.cwd(), 'landing', 'src', 'components', 'UniversalSearchModal.jsx');
  const nextAtlasPath = path.join(process.cwd(), 'landing', 'src', 'components', 'AtlasMapSection.jsx');
  const nextSkillsPath = path.join(process.cwd(), 'landing', 'src', 'components', 'SkillGuidesTab.jsx');
  const inGameMapPath = path.join(process.cwd(), 'client', 'game', 'worldAtlasAndLoreUi.js');

  const nextPageSrc = fs.readFileSync(nextPagePath, 'utf8');
  const preGameLandingSrc = fs.readFileSync(
    path.join(process.cwd(), 'client', 'landing.js'),
    'utf8'
  );
  const nextModalSrc = fs.readFileSync(nextModalPath, 'utf8');
  const nextAtlasSrc = fs.readFileSync(nextAtlasPath, 'utf8');
  const nextSkillsSrc = fs.readFileSync(nextSkillsPath, 'utf8');
  const inGameMapSrc = fs.readFileSync(inGameMapPath, 'utf8');

  assert.ok(nextPageSrc.includes('UniversalSearchModal'));
  assert.ok(nextPageSrc.includes('AtlasMapSection'));
  assert.ok(nextPageSrc.includes('aria-label="Universal Search Bar"'));
  assert.ok(
    nextPageSrc.indexOf('aria-label="Universal Search Bar"') > nextPageSrc.indexOf('</nav>'),
    'Next.js header search bar must appear in a dedicated row underneath the tabs'
  );
  assert.ok(
    preGameLandingSrc.indexOf('gf-header-search-row') > preGameLandingSrc.indexOf('gf-navbar-actions'),
    'Pre-game landing header search bar must appear in a dedicated row underneath the tabs'
  );
  assert.ok(nextModalSrc.includes('searchUniversalCatalog'));
  assert.ok(nextAtlasSrc.includes('searchMapZones'));
  assert.ok(nextSkillsSrc.includes('findUniversalMentions'));
  assert.ok(inGameMapSrc.includes('atlas-map-search-input'));
  assert.ok(inGameMapSrc.includes('searchMapZones'));

  const indexHtmlSrc = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.ok(indexHtmlSrc.includes('Skill Guides'), 'index.html preRenderLanding must include Skill Guides tab');
  assert.ok(indexHtmlSrc.includes('gf-header-search-row'), 'index.html preRenderLanding must include search bar row');
  assert.ok(!indexHtmlSrc.includes('OFFICIAL 16-BIT ACTION MMORPG'), 'index.html must not flash stale pre-redesign start page');
});
