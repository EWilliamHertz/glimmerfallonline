import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_PRESETS, getOrderPresetsForFaction } from '../shared/protocol/constants.js';
import {
  CLASSES_CATALOG,
  createDefaultProgression,
  getAbilityRank,
  sanitizeProgressionSkills,
  sanitizeLoadout,
} from '../shared/protocol.js';

describe('Terra Character (Zudran) Spell & Loadout Sanitization', () => {
  it('strips unlearned and over-level spells (e.g. Lv.18+ wildshape_surge, overwhelm_roar, earthshatter) from Terra characters', () => {
    const prog = {
      ...createDefaultProgression(),
      level: 8,
      skillPoints: 7, // Only 1 point legitimately spent (8 total earned - 7 unspent = 1 spent)
      skills: {
        tectonic_slam: 1,
        barkskin_infusion: 1, // Legitimately learned 1 point (Tier 2, Lv.3)
        verdant_renewal: 1,   // Phantom injected
        ancient_boulder: 1,   // Phantom injected
        briar_snare: 1,       // Over-level (Req Lv.12)
        overwhelm_roar: 1,    // Over-level (Req Lv.18)
        wildshape_surge: 1,   // Over-level (Req Lv.18) & missing prereq rooted_bastion
        earthshatter: 1,      // Over-level (Req Lv.24)
      },
    };
    const corruptedLoadout = { ...CLASSES_CATALOG.forest_warden.legacyDefaultLoadout };

    sanitizeProgressionSkills(prog);
    const cleanedLoadout = sanitizeLoadout(corruptedLoadout, 'forest_warden', prog);

    assert.equal(getAbilityRank(prog, 'wildshape_surge'), 0, 'Lv.18 wildshape_surge must be Rank 0 at Level 8');
    assert.equal(getAbilityRank(prog, 'overwhelm_roar'), 0, 'Lv.18 overwhelm_roar must be Rank 0 at Level 8');
    assert.equal(getAbilityRank(prog, 'earthshatter'), 0, 'Lv.24 earthshatter must be Rank 0 at Level 8');
    assert.equal(getAbilityRank(prog, 'briar_snare'), 0, 'Lv.12 briar_snare must be Rank 0 at Level 8');
    assert.equal(getAbilityRank(prog, 'tectonic_slam'), 1, 'Starter tectonic_slam remains Rank 1');
    assert.equal(getAbilityRank(prog, 'barkskin_infusion'), 1, 'Legitimate barkskin_infusion remains Rank 1');
    assert.equal(getAbilityRank(prog, 'ancient_boulder'), 0, 'Phantom uninvested ancient_boulder is stripped');
    assert.equal(getAbilityRank(prog, 'verdant_renewal'), 0, 'Phantom uninvested verdant_renewal is stripped');

    const equippedAbilities = Object.values(cleanedLoadout);
    assert.ok(!equippedAbilities.includes('wildshape_surge'), 'wildshape_surge removed from bar');
    assert.ok(!equippedAbilities.includes('overwhelm_roar'), 'overwhelm_roar removed from bar');
    assert.ok(!equippedAbilities.includes('earthshatter'), 'earthshatter removed from bar');
    assert.ok(equippedAbilities.includes('tectonic_slam'), 'tectonic_slam kept on bar');
  });
});

describe('Faction-scoped Order Presets', () => {
  it('excludes other factions order tags when Umbri is selected', () => {
    const umbriPresets = getOrderPresetsForFaction('Umbri');
    const tags = umbriPresets.map((o) => o.tag);
    assert.ok(tags.includes('VOID'), 'Umbri should see VOID');
    assert.ok(!tags.includes('SUN'), 'Umbri must not see Solari SUN');
    assert.ok(!tags.includes('ROOT'), 'Umbri must not see Terra ROOT');
    assert.ok(!tags.includes('AETH'), 'Umbri must not see Aether AETH');
  });

  it('allows each faction to see only its own faction preset and neutral GLIM', () => {
    for (const faction of ['Solari', 'Umbri', 'Terra', 'Aether']) {
      const presets = getOrderPresetsForFaction(faction);
      assert.ok(presets.length >= 1, `${faction} should have at least one preset`);
      for (const p of presets) {
        assert.ok(
          p.faction === faction || p.faction === null,
          `Preset ${p.tag} (${p.faction}) should not be available to ${faction}`
        );
      }
      const otherPresets = ORDER_PRESETS.filter((o) => o.faction && o.faction !== faction);
      for (const other of otherPresets) {
        assert.ok(!presets.some((p) => p.tag === other.tag));
      }
    }
  });
});
