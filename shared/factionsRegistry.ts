import { FactionId } from './types';

export interface FactionMetadata {
  id: FactionId;
  name: string;
  motto: string;
  themeColor: string;
  secondaryResource: string;
  lore: string;
}

export const FACTIONS_REGISTRY: Record<FactionId, FactionMetadata> = {
  Solari: {
    id: 'Solari',
    name: 'The Sunspire Dominion',
    motto: 'May the Sunspire illuminate the darkness.',
    themeColor: '#facc15',
    secondaryResource: 'Solar Charge (0-100)',
    lore: 'Radiant zealots, sun-forged templars, and solar clerics who channel the blinding heart of the Sunspire. Reaching 100 Solar Charge triggers Zenith State.',
  },
  Terra: {
    id: 'Terra',
    name: 'The Rootdeep Collective',
    motto: 'Stand unyielding as ancient stone.',
    themeColor: '#4ade80',
    secondaryResource: 'Primal Fury (0-100)',
    lore: 'Stone-carved juggernauts, earthen sentinels, and grove tenders of Rootdeep who call upon tectonic fury and regenerative flora.',
  },
  Umbri: {
    id: 'Umbri',
    name: 'The Duskveil Syndicate',
    motto: 'In shadows we weave, in silence we strike.',
    themeColor: '#a855f7',
    secondaryResource: 'Dusk Combo Points (1-5)',
    lore: 'Shadow-weavers, blood-hex assassins, and void-touched stalkers operating in the perpetual twilight of Duskveil.',
  },
  Aether: {
    id: 'Aether',
    name: 'The Astral Conclave',
    motto: 'Time and space bend to the arcane truth.',
    themeColor: '#38bdf8',
    secondaryResource: 'Astral Resonance (0-4 Stacks)',
    lore: 'Chronomancers, gravity manipulators, and riftblade spellweavers who distort reality and channel pure cosmic resonance.',
  },
};
