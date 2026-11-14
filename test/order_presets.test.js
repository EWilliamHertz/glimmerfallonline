import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_PRESETS, getOrderPresetsForFaction } from '../shared/protocol/constants.js';

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
