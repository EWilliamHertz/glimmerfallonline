import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  EQUIPMENT_CATALOG,
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  TRIAL_MAX_PROFESSION_LEVEL,
  getXpForProfessionLevel,
} from '../shared/protocol.js';
import {
  SKILL_COUNT,
  SKILL_GUIDES,
  SKILL_MAX_LEVEL,
  SKILL_TOTAL_MAX,
  SKILL_TRIAL_CAP,
  SKILL_XP_TABLE_99,
  computeSkillActionsNeeded,
  filterSkillGuides,
  getSkillGuideById,
  getSkillXpForLevel,
} from '../landing/src/data/skillGuidesData.js';
import { LandingPageController } from '../client/landing.js';
import { renderLandingSkillGuidesTab } from '../client/game/landingSkillGuidesUi.js';

test('Canonical 1–99 XP curve matches shared protocol across all 99 levels', () => {
  assert.equal(SKILL_MAX_LEVEL, 99);
  assert.equal(SKILL_COUNT, 7);
  assert.equal(SKILL_TOTAL_MAX, 693);
  assert.equal(SKILL_TRIAL_CAP, TRIAL_MAX_PROFESSION_LEVEL);
  assert.equal(SKILL_XP_TABLE_99.length, 99);

  for (let lvl = 1; lvl <= 99; lvl++) {
    assert.equal(
      getSkillXpForLevel(lvl),
      getXpForProfessionLevel(lvl),
      `Level ${lvl} XP must match getXpForProfessionLevel`
    );
  }
  assert.equal(getSkillXpForLevel(30), 105871);
  assert.equal(getSkillXpForLevel(99), 9477643);
});

test('All 7 canonical skills have complete contiguous 1–99 roadmaps, milestones, and Lv. 99 capes', () => {
  const protocolSkillIds = Object.keys(PROFESSIONS_CATALOG);
  assert.equal(SKILL_GUIDES.length, protocolSkillIds.length);

  for (const id of protocolSkillIds) {
    const prof = PROFESSIONS_CATALOG[id];
    const guide = SKILL_GUIDES.find((g) => g.id === id);
    assert.ok(guide, `Missing 1–99 skill guide for "${id}"`);
    assert.equal(guide.name, prof.name);

    const capeId = PROFESSION_MASTERY_CAPES[id];
    const capeItem = EQUIPMENT_CATALOG[capeId];
    assert.ok(capeItem, `Missing Skillcape catalog item for "${id}"`);
    assert.equal(guide.cape.id, capeId);
    assert.equal(guide.cape.name, capeItem.name);

    // Contiguous 1 -> 99 brackets
    assert.ok(guide.brackets.length >= 5, `${id} should have at least 5 brackets`);
    assert.equal(guide.brackets[0].minLevel, 1, `${id} first bracket must start at Lv. 1`);
    let expectedMin = 1;
    for (const br of guide.brackets) {
      assert.equal(br.minLevel, expectedMin, `${id} bracket continuity break before ${br.range}`);
      assert.ok(br.maxLevel > br.minLevel, `${id} bracket ${br.range} must ascend`);
      assert.ok(br.xpPerAction > 0, `${id} bracket ${br.range} must have positive xpPerAction`);
      assert.ok(br.bestMethod && br.altMethod && br.zone && br.ingredients && br.tip);
      expectedMin = br.maxLevel;
    }
    assert.equal(expectedMin, 99, `${id} brackets must terminate at Lv. 99`);

    // Milestones reach Lv. 99 with Skillcape
    const maxMilestone = guide.milestones[guide.milestones.length - 1];
    assert.equal(maxMilestone.level, 99, `${id} last milestone must be Lv. 99`);
    assert.ok(maxMilestone.unlock.includes(capeItem.name), `${id} Lv. 99 milestone should name cape`);
  }
});

test('Skill guide filters and XP calculator produce accurate estimates and apply Starfall Moon-Owl +6%', () => {
  assert.equal(filterSkillGuides('All').length, 7);
  assert.equal(filterSkillGuides('Combat').length, 3);
  assert.equal(filterSkillGuides('Gathering').length, 1);
  assert.equal(filterSkillGuides('Artisan').length, 3);

  const base = computeSkillActionsNeeded({
    fromLevel: 1,
    toLevel: 30,
    xpPerAction: 100,
    moonOwlBonus: false,
  });
  assert.equal(base.xpNeeded, 105871);
  assert.equal(base.effectiveXpPerAction, 100);
  assert.equal(base.actionsNeeded, 1059);

  const boosted = computeSkillActionsNeeded({
    fromLevel: 1,
    toLevel: 30,
    xpPerAction: 100,
    moonOwlBonus: true,
  });
  assert.equal(boosted.xpNeeded, 105871);
  assert.equal(boosted.effectiveXpPerAction, 106);
  assert.equal(boosted.actionsNeeded, 999);
});

test('Pre-game LandingPageController supports Skill Guides tab switching, interactive state, and HTML rendering', () => {
  const landing = new LandingPageController({ frontpage: null, onEnterWorld: null });

  landing.setTab('skill-guides');
  assert.equal(landing.activeTab, 'skills');

  landing.setSkillGuideCategory('Artisan');
  assert.equal(landing.skillGuideCategory, 'Artisan');

  landing.setSkillGuide('relic_forging');
  assert.equal(landing.selectedSkillGuideId, 'relic_forging');

  landing.setSkillCalcLevels(70, 99);
  landing.toggleSkillCalcOwl(true);
  landing.setSkillGuideSearch('Chronocore');

  const html = landing.renderActiveTab({});
  assert.ok(html.includes('SKILLS 1–99 LEVELING GUIDES'));
  assert.ok(html.includes('Relic-Forging'));
  assert.ok(html.includes('Chronocore Apex Sigil'));
  assert.ok(html.includes('Skillcape of Relic-Forging'));
  assert.ok(html.includes('105,871 XP'));
  assert.ok(html.includes('9,477,643 XP'));

  // Empty search state gracefully handled
  const emptySearchHtml = renderLandingSkillGuidesTab({
    selectedSkillId: 'glimmerweaving',
    searchQuery: 'zzznomatchzzz',
  });
  assert.ok(emptySearchHtml.includes('No Glimmerweaving unlocks match'));
});

test('Next.js landing page wires Skill Guides tab cleanly with working setTab handler', () => {
  const pagePath = path.join(process.cwd(), 'landing', 'src', 'app', 'page.jsx');
  const compPath = path.join(process.cwd(), 'landing', 'src', 'components', 'SkillGuidesTab.jsx');
  const pageSrc = fs.readFileSync(pagePath, 'utf8');
  const compSrc = fs.readFileSync(compPath, 'utf8');

  assert.ok(pageSrc.includes("import SkillGuidesTab from '../components/SkillGuidesTab';"));
  assert.ok(pageSrc.includes('const setTab = (tabId) =>'));
  assert.ok(pageSrc.includes("{ id: 'skills', label: 'Skill Guides', icon: BookOpen }"));
  assert.ok(pageSrc.includes("activeTab === 'skills'"));
  assert.ok(pageSrc.includes('<SkillGuidesTab'));
  assert.ok(compSrc.includes('SKILLS 1–99 LEVELING GUIDES'));
  assert.ok(compSrc.includes('computeSkillActionsNeeded'));
  // Ensure no broken fallback to wrong skill id
  assert.equal(getSkillGuideById('nonexistent').id, 'combat_mastery');
});
