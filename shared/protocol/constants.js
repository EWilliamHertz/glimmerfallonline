// Core Tick, Tile, Slot & Social Constants
export const TICK_RATE = 20;
export const TICK_MS = 1000 / TICK_RATE;
export const TILE_SIZE = 16;
export const YARD_PX = 12;

export const ACTION_SLOTS = [1, 2, 3, 4, 9, 10, 11, 12];

// Per-character delay between node harvests. Grand Fonts take longer to channel.
export const HARVEST_COOLDOWN_MS = {
  normal: 250,
  grand: 1250,
};


export const ORDER_PRESETS = [
  { tag: 'SUN', name: 'Order of Dawn', color: '#facc15', emblem: '☀️', logo: '/solari_nobg.png' },
  { tag: 'VOID', name: 'Duskveil Cabal', color: '#c084fc', emblem: '🌑', logo: '/umbri_nobg.png' },
  { tag: 'ROOT', name: 'Ironwood Watch', color: '#4ade80', emblem: '🌿', logo: '/terra_nobg.png' },
  { tag: 'AETH', name: 'Chronocore Wardens', color: '#38bdf8', emblem: '🔮', logo: '/aether_nobg.png' },
  { tag: 'GLIM', name: 'GlimmerFall Founders', color: '#fb923c', emblem: '⚡', logo: '/solari_nobg.png' },
];

export const EMOTES_CATALOG = {
  wave: { id: 'wave', icon: '👋', label: 'WAVE', text: 'waves heartily!', color: '#fde047' },
  cheer: { id: 'cheer', icon: '☀️', label: 'PRAISE', text: 'praises the Glimmer!', color: '#facc15' },
  swords: { id: 'swords', icon: '⚔️', label: 'CHALLENGE', text: 'brandishes their weapon!', color: '#f87171' },
  shield: { id: 'shield', icon: '🛡️', label: 'GUARD', text: 'rallies to defend the Nexus!', color: '#38bdf8' },
  gg: { id: 'gg', icon: '🏆', label: 'GG', text: 'salutes: Good Game!', color: '#4ade80' },
  void: { id: 'void', icon: '🌑', label: 'VOID', text: 'points toward the Fall!', color: '#c084fc' },
  heart: { id: 'heart', icon: '❤️', label: 'THANKS', text: 'shares radiant gratitude!', color: '#fb7185' },
};

export const SLOT_UNLOCK_LEVELS = {
  1: 1,  // Primary Basic Strike (Lv. 1)
  9: 2,  // Primary Flash / Mobility (Lv. 2)
  2: 3,  // Secondary Rite / Cast (Lv. 3)
  10: 4, // Secondary Flash / Utility (Lv. 4)
  3: 5,  // Signature Rite / Heavy AoE (Lv. 5)
  11: 6, // Signature Flash / Control (Lv. 6)
  4: 7,  // Ultimate Rite / Finisher (Lv. 7)
  12: 8, // Ultimate Flash / Apex (Lv. 8)
};

export function isSlotUnlocked(prog, slot) {
  const req = SLOT_UNLOCK_LEVELS[slot] || 1;
  return (prog?.level || 1) >= req;
}

