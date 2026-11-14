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
  bow: { id: 'bow', icon: '🙇', label: 'BOW', text: 'bows with deep honor.', color: '#a78bfa' },
  cheer: { id: 'cheer', icon: '☀️', label: 'PRAISE', text: 'praises the Glimmer!', color: '#facc15' },
  swords: { id: 'swords', icon: '⚔️', label: 'CHALLENGE', text: 'brandishes their weapon!', color: '#f87171' },
  shield: { id: 'shield', icon: '🛡️', label: 'GUARD', text: 'rallies to defend the Nexus!', color: '#38bdf8' },
  flex: { id: 'flex', icon: '💪', label: 'FLEX', text: 'flexes with formidable vigor!', color: '#fb923c' },
  dance: { id: 'dance', icon: '💃', label: 'DANCE', text: 'dances with radiant rhythm!', color: '#ec4899' },
  salute: { id: 'salute', icon: '🫡', label: 'SALUTE', text: 'salutes the vanguard!', color: '#60a5fa' },
  fire: { id: 'fire', icon: '🔥', label: 'HEARTH', text: 'kindles the hearthfire warmth!', color: '#f97316' },
  gg: { id: 'gg', icon: '🏆', label: 'GG', text: 'salutes: Good Game!', color: '#4ade80' },
  void: { id: 'void', icon: '🌑', label: 'VOID', text: 'points toward the Fall!', color: '#c084fc' },
  heart: { id: 'heart', icon: '❤️', label: 'THANKS', text: 'shares radiant gratitude!', color: '#fb7185' },
};

export const SLOT_UNLOCK_LEVELS = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  9: 1,
  10: 1,
  11: 1,
  12: 1,
};

export function isSlotUnlocked(prog, slot) {
  const req = SLOT_UNLOCK_LEVELS[slot] || 1;
  return (prog?.level || 1) >= req;
}

// Tibia Infamy Skull Rules & Graveglass Tombstones
export const SKULL_TYPES = {
  NONE: null,
  WHITE: 'white',
  RED: 'red',
};

export const WHITE_SKULL_DURATION_SEC = 900; // 15 minutes of white skull infamy
export const RED_SKULL_DURATION_SEC = 1800;  // 30 minutes of red skull infamy
export const RED_SKULL_PK_THRESHOLD = 3;     // 3 unprovoked player kills triggers Red Skull
export const TOMBSTONE_RETRIEVAL_EXPIRY_SEC = 900; // 15 minutes to retrieve fallen corpse

// Authoritative MMORPG Combat Engine Constants (GCD, Spell Queue, Threat/Aggro)
export const BASE_GCD_SEC = 1.5;
export const MIN_GCD_SEC = 0.75;
export const SPELL_QUEUE_WINDOW_SEC = 0.4;
export const TANK_THREAT_MULT = 3.5;
export const HEAL_THREAT_MULT = 0.5;
export const TAUNT_DURATION_SEC = 3.0;
export const TANK_CLASSES = new Set(['solari_vanguard', 'stonekin_elder']);
export const OFF_GCD_KINDS = new Set([
  'shield',
  'thornbark',
  'reactive_barrier',
  'cleanse_sprint',
  'dash',
  'stealth',
  'archon_form',
]);

export function isAbilityOffGCD(spec) {
  if (!spec) return false;
  return Boolean(spec.isOffGCD) || OFF_GCD_KINDS.has(spec.kind);
}



