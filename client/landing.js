// ==========================================
// GlimmerFall Online 2D — Premier Landing Page & Interactive Encyclopedias
// Pixelated Heaven • Sticky Sidebar Navigation • Gear & Currencies
// 7 Disciplines to Lv. 99 • Official Logo • Smooth Scrolling
// ==========================================

import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  FACTIONS_META,
  CLASSES_CATALOG,
  PROFESSIONS_CATALOG,
  ORDER_PRESETS,
  getOrderPresetsForFaction,
  EQUIPMENT_CATALOG,
  CANONICAL_SETS,
  RUNEWORD_SYNERGIES,
  createDefaultProgression,
  validateCharacterName,
} from '../shared/protocol.js';
import { getItemIconDataUrl } from './itemSprites.js';
import { getRarityColor } from './ui/inventoryHelpers.js';

const START_ON_LOADOUT_KEY = 'glimmerfall_start_on_loadout';
const SP_ROSTER_KEY = 'glimmerfall_sp_roster_v2';
const SP_ACTIVE_KEY = 'glimmerfall_sp_active_id';
const PLAY_MODE_KEY = 'glimmerfall_play_mode';
const LOGO_SRC = '/GlimmerFall_official_multicolor_logo.png';

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

export const PIXEL_ITEMS = [
  { id: 'solari_spellblade', name: 'Solari Spellblade', slot: 'Weapon', rarity: 'Awakened', icon: '🗡️', stat: '+24 Radiant Dmg • +8% Holy Crit', color: '#F2A900', desc: 'Forged from Starfall meteorite and quenched in the solar well of the Sunspire.' },
  { id: 'radiant_shield', name: 'Radiant Shield', slot: 'Shield', rarity: 'Solari Relic', icon: '🛡️', stat: '+45 Armor • +60 Block Value', color: '#F2A900', desc: 'Imbued with the Zenith core. Emits blinding retaliation flashes.' },
  { id: 'scythe_soulreaper', name: 'Scythe of the Soulreaper', slot: 'Weapon', rarity: 'Epic Relic', icon: '⛏️', stat: '+28 Void Dmg • +20% Life Leech', color: '#9B30FF', desc: 'Forged in the Umbri Undercity to harvest dying essence and replenish vitals.' },
  { id: 'duskveil_shroud', name: 'Duskveil Shadowmail', slot: 'Armor', rarity: 'Awakened', icon: '🦹', stat: '+14 Agility • +12% Stealth Opener', color: '#9B30FF', desc: 'Woven with Graveglass filament that drinks ambient illumination.' },
  { id: 'ironwood_maul', name: 'Ironwood Greathammer', slot: 'Weapon', rarity: 'Awakened', icon: '🔨', stat: '+32 Physical Dmg • Stun Chance', color: '#22E07B', desc: 'Carved from heartwood of Glimmer Orchard ancient boughs.' },
  { id: 'bramble_buckler', name: 'Thornbark Buckler', slot: 'Shield', rarity: 'Terra Relic', icon: '🪵', stat: '+35 Armor • +35% Reflect', color: '#22E07B', desc: 'Reflects incoming melee damage back at attackers through barbed briars.' },
  { id: 'chronocore_staff', name: 'Astral Chrono-Staff', slot: 'Weapon', rarity: 'Awakened', icon: '🔮', stat: '+26 Arcane • -12% Cooldowns', color: '#00BFFF', desc: 'Allows the wielder to perceive temporal currents and accelerate spell rites.' },
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic Relic', icon: '💎', stat: 'World Nexus Anchor (25 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
];

export const LEYLINE_CURRENCIES = [
  { id: 'solar_gold', name: 'Solar Gold', val: '1,420,500', icon: '🪙', color: '#F2A900' },
  { id: 'glimmer_shards', name: 'Glimmer Shards', val: '350', icon: '🔮', color: '#00BFFF' },
  { id: 'chrono_cores', name: 'Chrono Cores', val: '28', icon: '🌀', color: '#38bdf8' },
  { id: 'void_remnants', name: 'Void Remnants', val: '115', icon: '🖤', color: '#9B30FF' },
  { id: 'root_stones', name: 'Root Stones', val: '42', icon: '🌿', color: '#22E07B' },
];

export const DISCIPLINES = [
  { id: 'mining', name: 'Resonance Extraction', lvl: 48, icon: '⛏️', color: '#00BFFF' },
  { id: 'smithing', name: 'Star-Forging', lvl: 35, icon: '🔨', color: '#F2A900' },
  { id: 'weaving', name: 'Leyline Weaving', lvl: 42, icon: '🧵', color: '#22E07B' },
  { id: 'inscription', name: 'Void Inscription', lvl: 29, icon: '📜', color: '#9B30FF' },
  { id: 'alchemy', name: 'Celestial Alchemy', lvl: 51, icon: '🧪', color: '#ec4899' },
  { id: 'rites', name: 'Rites Mastery', lvl: 64, icon: '⚔️', color: '#facc15' },
  { id: 'flashes', name: 'Flashes Mastery', lvl: 58, icon: '⚡', color: '#38bdf8' },
];

const FACTION_ELEMENTS = {
  Solari: { aspect: 'Solar Light / Gold', element: 'Solar Light', badgeColor: '#facc15' },
  Umbri: { aspect: 'Void / Amethyst', element: 'Void', badgeColor: '#c084fc' },
  Terra: { aspect: 'Verdant Root / Emerald', element: 'Verdant Root', badgeColor: '#4ade80' },
  Aether: { aspect: 'Celestial Mist / Cyan', element: 'Celestial Mist', badgeColor: '#38bdf8' },
};

export const LANDING_OST_TRACKS = [
  {
    id: 'title',
    name: 'Awakening of the Cosmos',
    zone: 'The Primordial Shattering',
    category: 'Cinematic Themes',
    bpm: 105,
    key: 'D min',
    duration: '2:58',
    durationSec: 178,
    icon: '🌌',
    color: '#818cf8',
    localUrl: '/audio/title.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/title.m4a',
    desc: 'Symphonic cosmic overture capturing the birth of the crystal realm, the celestial detonation, and the great fracture into 4 light aspects.'
  },
  {
    id: 'sanctuary',
    name: 'Starlight Sanctuary Haven',
    zone: 'Sanctuary Hub & Haven',
    category: 'Biomes & Havens',
    bpm: 85,
    key: 'D maj',
    duration: '3:39',
    durationSec: 219,
    icon: '🏛️',
    color: '#38bdf8',
    localUrl: '/audio/sanctuary.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/sanctuary.m4a',
    desc: 'Ethereal harp and celesta harmonies echoing across the tranquil starlit pavilion, player bazaars, and peaceful fountain commons.'
  },
  {
    id: 'solari',
    name: 'Sun Cathedral March (Emberwing)',
    zone: 'Solari Golden Citadel',
    category: 'Factions',
    bpm: 128,
    key: 'D mixo',
    duration: '3:00',
    durationSec: 180,
    icon: '☀️',
    color: '#facc15',
    localUrl: '/audio/solari.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Solari_Faction_Emberwing_Courier.m4a',
    desc: 'Heroic French horn, golden heraldry brass, and sweeping strings marching beneath the blinding noon-fire of the Sunspire.'
  },
  {
    id: 'umbri',
    name: 'Crypt of Shadowweaver (Umbral)',
    zone: 'Umbri Duskveil Undercity',
    category: 'Factions',
    bpm: 95,
    key: 'F# min',
    duration: '2:57',
    durationSec: 177,
    icon: '🌑',
    color: '#c084fc',
    localUrl: '/audio/umbri.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Umbri_Faction_Umbral_Assassin.m4a',
    desc: 'Gothic cello and harpsichord resonating in subterranean crypts lit by flickering violet graveglass lanterns and void leylines.'
  },
  {
    id: 'terra',
    name: 'Druidic Forest Bodhran (Warden)',
    zone: 'Terra Rootdeep Expanse',
    category: 'Factions',
    bpm: 110,
    key: 'E min',
    duration: '2:50',
    durationSec: 170,
    icon: '🌿',
    color: '#4ade80',
    localUrl: '/audio/terra.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Terra_Faction_Forest_Warden.m4a',
    desc: 'Acoustic guitar and wooden flute pulsing with organic bodhran earth-drums in ancient primeval ironwood groves.'
  },
  {
    id: 'aether',
    name: 'Quantum Shimmer (Nexus Weaver)',
    zone: 'Aether Mirrorgate Spire',
    category: 'Factions',
    bpm: 140,
    key: 'A min',
    duration: '2:58',
    durationSec: 178,
    icon: '🔮',
    color: '#38bdf8',
    localUrl: '/audio/aether.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Aether_Faction_Nexus_Weaver.m4a',
    desc: 'Cosmic quantum glockenspiel accelerating through temporal chronoflux rifts and celestial mirrorgate spires.'
  },
  {
    id: 'abyss',
    name: 'Cosmic Dread Drone',
    zone: 'Starfall Caldera Abyss',
    category: 'Biomes & Havens',
    bpm: 80,
    key: 'Eb min',
    duration: '2:55',
    durationSec: 175,
    icon: '🕳️',
    color: '#a855f7',
    localUrl: '/audio/abyss.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/abyss.m4a',
    desc: 'Low-frequency sawtooth drone vibrating with descending cosmic dread and abyssal tension at the crater rift.'
  },
  {
    id: 'warzone',
    name: 'Martial Taiko Clash (Siege)',
    zone: 'Nexus Outpost Caldera',
    category: 'Combat & Arenas',
    bpm: 135,
    key: 'A min',
    duration: '2:37',
    durationSec: 157,
    icon: '⚔️',
    color: '#ef4444',
    localUrl: '/audio/warzone.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/3v3_Outpost_Siege_Warzone_Monolith_Clash.m4a',
    desc: 'Thunderous taiko rhythms and martial brass driving high-intensity 3v3 Outpost siege skirmishes and Monolith overloads.'
  },
  {
    id: 'boss',
    name: 'Granite Colossus Climax',
    zone: 'World Boss Caldera',
    category: 'Combat & Arenas',
    bpm: 150,
    key: 'E min',
    duration: '2:56',
    durationSec: 176,
    icon: '👹',
    color: '#f97316',
    localUrl: '/audio/boss.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Apex_World_Boss_Granite_Colossus_Emergence.m4a',
    desc: 'Cataclysmic string ostinato and relentless timpani pulsing as the ancient titan awakens and shakes the continent.'
  },
  {
    id: 'tcg_duel',
    name: 'Tactical Card Duel',
    zone: 'The Grand Card Arena',
    category: 'Combat & Arenas',
    bpm: 120,
    key: 'G min',
    duration: '2:46',
    durationSec: 166,
    icon: '🃏',
    color: '#eab308',
    localUrl: '/audio/tcg_duel.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Authentic_TCG_Tactical_Card_Duel.m4a',
    desc: 'High-stakes tabletop duel arrangement pulsing with kinetic strategy, mana shifts, and holographic spell casts.'
  },
  {
    id: 'the_bridge',
    name: 'The Bridge: Card to Pixel',
    zone: 'Dimensional Transmutation',
    category: 'Cinematic Themes',
    bpm: 115,
    key: 'C maj',
    duration: '3:00',
    durationSec: 180,
    icon: '✨',
    color: '#06b6d4',
    localUrl: '/audio/the_bridge.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/The_Bridge_Holographic_Card_to_Pixel_Sprite.m4a',
    desc: 'Atmospheric theme depicting holographic trading card relics materializing directly into living pixel avatars.'
  },
  {
    id: 'victory',
    name: 'Fanfare of Triumph & Spoils',
    zone: 'Victory Fanfare',
    category: 'Combat & Arenas',
    bpm: 130,
    key: 'D maj',
    duration: '2:03',
    durationSec: 123,
    icon: '🏆',
    color: '#eab308',
    localUrl: '/audio/victory.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Triumph__Spoils_Colossus_Defeated.m4a',
    desc: 'Triumphant brass fanfare celebrating boss collapse, quest completion, shard extraction, and continental spoils.'
  },
  {
    id: 'trailer',
    name: 'Dual Launch Reveal Anthem',
    zone: 'Official Launch Trailer',
    category: 'Cinematic Themes',
    bpm: 130,
    key: 'D min',
    duration: '1:49',
    durationSec: 109,
    icon: '🎬',
    color: '#f43f5e',
    localUrl: '/audio/trailer.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/GlimmerFall_Trailer.m4a',
    desc: 'The official Dual Launch trailer anthem showcasing the unified universe of GlimmerFall Online and the physical TCG.'
  },
  {
    id: 'grand_finale',
    name: 'Grand Finale Title Card',
    zone: 'Launch Dec 5, 2026',
    category: 'Cinematic Themes',
    bpm: 125,
    key: 'G maj',
    duration: '3:00',
    durationSec: 180,
    icon: '🌟',
    color: '#fbbf24',
    localUrl: '/audio/grand_finale.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Grand_Finale_Title_Card_Launching_Dec_5_2026.m4a',
    desc: 'Grand orchestral finale celebrating the official release countdown to December 5, 2026.'
  },
  {
    id: 'master_suite',
    name: '11-Clip Master OST Suite',
    zone: 'Official Master Collection',
    category: 'Cinematic Themes',
    bpm: 120,
    key: 'D min',
    duration: '1:02',
    durationSec: 62,
    icon: '💿',
    color: '#38bdf8',
    localUrl: '/audio/master_suite.m4a',
    url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/audio/Glimmerfall_11_Clip_Master_Soundtrack.m4a',
    desc: 'Comprehensive orchestral suite blending signature motifs across all biomes, classes, and battle climaxes.'
  }
];

export const LANDING_CINEMATICS = [
  { id: 'official_trailer', modalKey: 'official_trailer', title: 'GlimmerFall — Official Dual Launch Trailer', category: 'Official Trailer', duration: '1:05', icon: '⚔️', poster: '/GlimmerFall_official_multicolor_logo.png', youtubeId: '2e8E0vjLcLg', url: 'https://youtu.be/2e8E0vjLcLg', desc: 'The official reveal trailer for GlimmerFall Online & TCG, launching December 5, 2026. One universe, two interconnected ways to play.' },
  { id: 'crystal_heart', modalKey: 'crystal_heart', title: 'The Shattered Crystal Heart', category: 'Prologue', duration: '0:35', icon: '🎬', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/crystal_heart_shattering_1080p.mp4', desc: 'The apocalyptic detonation of the primordial multi-faceted Crystal Heart that showered rainbow shards across the continent and fractured unified light into 4 aspects.' },
  { id: 'awakening_solari_vanguard', modalKey: 'solari_vanguard', title: 'Solari Vanguard Awakening', category: 'Solari', duration: '0:30', icon: '☀️', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_solari_vanguard_1080p.mp4', desc: 'Sunspire golden plate sentinel with heavy tower shield and blazing spellblade channels solar dawn-fire, personifying the Solari Vanguard golden knight.' },
  { id: 'awakening_solari_dawnblade', modalKey: 'solari_dawnblade', title: 'Solari Dawnblade Awakening', category: 'Solari', duration: '0:30', icon: '🗡️', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_solari_dawnblade_1080p.mp4', desc: 'Acrobatic radiant duelist wielding solar scimitars in blinding Zenith state, executing swift dawnblade melee combat.' },
  { id: 'awakening_umbri_reaper', modalKey: 'umbri_reaper', title: 'Umbri Reaper Awakening', category: 'Umbri', duration: '0:30', icon: '💀', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_umbri_reaper_1080p.mp4', desc: 'Nether assassin wielding soul-harvest scythe from Dusk Shroud stealth, channeling the hooded umbral harbinger.' },
  { id: 'awakening_umbri_shadowweaver', modalKey: 'umbri_shadowweaver', title: 'Umbri Shadowweaver Awakening', category: 'Umbri', duration: '0:30', icon: '🔮', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_umbri_shadowweaver_1080p.mp4', desc: 'Void sorcerer in deep purple robes weaving necrotic leylines and graveglass lanterns, manifesting the Umbri Shadowweaver mystic.' },
  { id: 'awakening_terra_ironroot', modalKey: 'terra_ironroot', title: 'Terra Ironroot Awakening', category: 'Terra', duration: '0:30', icon: '🛡️', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_terra_ironroot_1080p.mp4', desc: 'Juggernaut forged from ancient ironwood and stonekin boulders, directly embodying the massive Terra Ironroot titan.' },
  { id: 'awakening_terra_bramble_warden', modalKey: 'terra_bramble_warden', title: 'Terra Bramble Warden Awakening', category: 'Terra', duration: '0:30', icon: '🏹', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_terra_bramble_warden_1080p.mp4', desc: 'Verdant archer in forest camouflage drawing starlight briar arrows, leading the Terra Bramble Warden rangers.' },
  { id: 'awakening_aether_chronomancer', modalKey: 'aether_chronomancer', title: 'Aether Chronomancer Awakening', category: 'Aether', duration: '0:30', icon: '⏳', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_aether_chronomancer_1080p.mp4', desc: 'Temporal scholar channeling celestial chronoflux with the astral astrolabe, embodying the blue-robed Aether Chronomancer.' },
  { id: 'awakening_aether_tempest_sage', modalKey: 'aether_tempest_sage', title: 'Aether Tempest Sage Awakening', category: 'Aether', duration: '0:30', icon: '⚡', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_aether_tempest_sage_1080p.mp4', desc: 'Arcane tempest sage summoning quantum chain lightning and cosmic beams, commanding the Aether Tempest Sage mysteries.' },
  { id: 'scene3_colossus_emergence', modalKey: 'colossus_emergence', title: 'Granite Colossus Emergence', category: 'World Boss', duration: '0:32', icon: '🗿', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/scene3_colossus_emergence_1080p.mp4', desc: 'Earth-shattering boss emergence in the deep Starfall Caldera as ancient stone awakened by leylines stirs to life.' },
  { id: 'scene4_boss_defeated', modalKey: 'boss_defeated', title: 'Boss Defeated & Shard Harvest', category: 'Victory', duration: '0:28', icon: '🏆', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/scene4_boss_defeated_1080p.mp4', desc: 'Triumphant climax as the Colossus crumbles into celestial loot prisms, showering victory rewards over the heroic orders.' },
  { id: 'scene5_monolith_explosion', modalKey: 'monolith_explosion', title: 'Nexus Monolith Detonation', category: '3v3 Warzone', duration: '0:34', icon: '💥', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/scene5_monolith_explosion_1080p.mp4', desc: 'Cataclysmic 3v3 Warzone finale: The 2500-HP Chronocore Nexus Monolith overloads and detonates in blinding prismatic glory.' },
];

export const SYSTEMS_SHOWCASE = [
  {
    id: 'combat',
    icon: '⚔️',
    title: 'Action Combat & 0-GCD Flashes',
    badge: 'Instant Response • Real-time Hitboxes',
    badgeColor: '#facc15',
    color: '#facc15',
    desc: 'Top-down fluid combat featuring 90-degree 34px cleave arcs, projectile vector tracking, client-side prediction, and a 0.3s spell queuing buffer for responsive combos. Zero GCD Flashes let you sprint, blink, and parry without interrupting your primary rotation.',
    bullets: [
      'Hyperbolic Armor curve: Reduction = Armor / (Armor + 100)',
      '150% base critical damage scalable to 220%+ via Flashes tree',
      '8-directional tactical sprinting with stamina management',
    ],
  },
  {
    id: 'disciplines',
    icon: '⚒️',
    title: '7 Disciplines to Level 99',
    badge: 'Max Mastery • Continental Capes',
    badgeColor: '#4ade80',
    color: '#4ade80',
    desc: 'True RuneScape-inspired deep progression. Level up Mining, Smithing, Weaving, Inscription, Alchemy, Rites, and Flashes all the way from Level 1 to 99 through resource gathering, crafting stations, and combat mastery.',
    bullets: [
      'Harvest Grand Fonts and rare meteorite seams across continents',
      'Craft platebody, silkrobes, and flasks at Sanctuary Haven forges',
      'Achieve Level 99 to unlock prestigious animated Continental Mastery Capes',
    ],
  },
  {
    id: 'runewords',
    icon: '💎',
    title: '3-Socket Gear & Ancient Runewords',
    badge: 'TCG Relics • Secret Rune Combos',
    badgeColor: '#38bdf8',
    color: '#38bdf8',
    desc: 'Equipment features up to 3 rune sockets. Embed rare physical trading card relics from glimmerfalltcg.com or combine Solari (SOL), Umbri (UM), Terra (TER), and Aether (AETH) runes to trigger secret Ancient Runewords.',
    bullets: [
      'SOL - UM - TER = "Eclipse Ward" (+25% All Resists, 15% Reflect)',
      'AETH - AETH - SOL = "Temporal Radiance" (-20% Cooldowns, Instant Rite)',
      'TER - TER - UM = "Iron Phantom" (+400 Armor, 10% Physical Life Leech)',
    ],
  },
  {
    id: 'economy',
    icon: '🪙',
    title: 'AetherSwap Continental Economy',
    badge: 'Orderbook • 2% Tariff Sink',
    badgeColor: '#fbbf24',
    color: '#fbbf24',
    desc: 'Trade gear and materials freely in the player-driven Sanctuary Haven economy. Place buy and sell limit orders on the centralized orderbook exchange, or trade directly with peer-to-peer 2-step verification.',
    bullets: [
      'Permanent 2% gold tariff on transactions prevents currency hyperinflation',
      'Anti-scam trade window with mutual lock and confirmation states',
      '1-HP surrender friendly dueling with 3-second countdown anywhere',
    ],
  },
  {
    id: 'warzone',
    icon: '⚡',
    title: '3v3 Nexus Warzone Arenas',
    badge: '2500-HP Monolith • Rated Competitive',
    badgeColor: '#f87171',
    color: '#f87171',
    desc: 'Enter the Continental Caldera for competitive 3v3 team skirmishes. Defend your team\'s 2500-HP Chronocore Nexus Monolith while capturing tactical outposts and calling down orbital bombardment strikes.',
    bullets: [
      'Authentic 2500-HP Nexus Monolith destruction (Last-Hit Wins!)',
      'Capturing Outposts grants team-wide damage and defense leylines',
      'Safe return teleport preserves exact pre-match world coordinates and bounties',
    ],
  },
  {
    id: 'atlas',
    icon: '🗺️',
    title: 'Seamless Multi-Zone Continents',
    badge: '8 Biomes • Zero Loading Screens',
    badgeColor: '#c084fc',
    color: '#c084fc',
    desc: 'Explore 8 interconnected continental regions seamlessly without immersion-breaking loading screens. Each zone features custom Google Flow soundtrack music that dynamically transitions at regional boundaries.',
    bullets: [
      'Sanctuary Haven, Solari Citadel, Umbri Undercity, Terra Deepwoods, Aether Spire',
      'High-risk Starfall Abyss, Continental Warzone, and World Boss Caverns',
      'Persistent player coordinates and health saved to PostgreSQL and browser cache',
    ],
  },
];

export class LandingPageController {
  constructor({ frontpage = null, onEnterWorld = null } = {}) {
    this.frontpage = frontpage;
    this.onEnterWorld = onEnterWorld;
    this.isOpen = false;

    this.activeTab = 'overview';
    this.gameEncSection = 'combat';
    this.loreEncSection = 'shattering';
    this.hoveredItemId = null;

    // Character Forge State
    this.characterName = 'Aurelia';
    this.hasUserEditedName = false;
    this.playMode = 'singleplayer';
    this.selectedFaction = 'Solari';
    this.selectedClassId = 'solari_vanguard';
    this.selectedOrderTag = 'SUN';
    this.soundEnabled = true;

    // Interactive OST Jukebox & Official Media Player
    this.currentOstTrackId = 'title';
    this.isOstPlaying = false;
    this.currentTime = 0;
    this.duration = 178;
    this.volume = 0.75;
    this.isMuted = false;
    this.repeatMode = 'all'; // 'all', 'one', 'off'
    this.isShuffle = false;
    this.queue = [];
    this.history = [];
    this.trackFilter = 'all';
    this.searchQuery = '';
    this.showQueue = false;
    this._ostAudio = null;
    this._audioFailoverCount = 0;
    this._isDraggingScrubber = false;
    this.selectedCinematicId = 'crystal_heart';
    this.isTheatreAutoplay = false;
    this.armorySlotFilter = 'all';
    this.armorySearch = '';

    try {
      const savedMode = localStorage.getItem(PLAY_MODE_KEY);
      if (savedMode === 'multiplayer' || savedMode === 'singleplayer') {
        this.playMode = savedMode;
      }
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window._landing = this;
      window.openLandingPage = (initialTab = null) => this.open(initialTab);
      window.setStartOnSiteToggle = (checked) => this.setStartOnLoadout(checked);
    }

    this._panningInitialized = false;
    this._keyboardInitialized = false;
    this._scrollHoldTimeout = null;
    this._scrollHoldInterval = null;

    if (typeof window !== 'undefined') {
      this.initScreenPanning();
      this.initKeyboardNavigation();
    }
  }

  getScrollContainer() {
    if (typeof document === 'undefined') return null;
    return document.getElementById('landing-overlay');
  }

  scrollUp(amount = 420) {
    const el = this.getScrollContainer();
    if (el) {
      el.scrollBy({ top: -amount, behavior: 'smooth' });
    }
  }

  scrollDown(amount = 420) {
    const el = this.getScrollContainer();
    if (el) {
      el.scrollBy({ top: amount, behavior: 'smooth' });
    }
  }

  scrollToTop() {
    const el = this.getScrollContainer();
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollToBottom() {
    const el = this.getScrollContainer();
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }

  scrollToSection(sectionId) {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  initScreenPanning() {
    if (this._panningInitialized || typeof window === 'undefined' || typeof document === 'undefined') return;
    this._panningInitialized = true;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const onMouseDown = (e) => {
      const overlay = this.getScrollContainer();
      if (!overlay || !this.isOpen) return;
      // Do not interfere with touch devices or touch emulation on iPad/mobile
      if (
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        e.sourceCapabilities?.firesTouchEvents ||
        'ontouchstart' in window
      ) {
        return;
      }
      if (e.button !== 0) return;

      const interactive = e.target.closest(
        'button, a, input, select, textarea, video, canvas, [role="button"], ' +
        '.pixel-gear-slot, .faction-select-card, ' +
        '.class-select-card, .order-select-btn, .enc-switch-btn, .tcg-card-item, ' +
        '.sidebar-mode-btn, .sidebar-cta-btn, .sidebar-nav-link, .hero-btn-primary, .hero-btn-secondary, ' +
        '.gf-player-btn, .gf-track-act-btn, .gf-track-row, .gf-filter-btn, .gf-scrubber-track, .gf-scrubber-input, .gf-volume-slider, .ost-track-pill, .ost-play-btn, .dock-play-btn, [data-track-action]'
      );
      if (interactive) return;

      isDragging = true;
      startY = e.clientY;
      startScrollTop = overlay.scrollTop;
      overlay.classList.add('grabbing-mode');
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const overlay = this.getScrollContainer();
      if (!overlay) return;
      const deltaY = e.clientY - startY;
      overlay.scrollTop = startScrollTop - deltaY;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      const overlay = this.getScrollContainer();
      if (overlay) {
        overlay.classList.remove('grabbing-mode');
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  initKeyboardNavigation() {
    if (this._keyboardInitialized || typeof window === 'undefined') return;
    this._keyboardInitialized = true;

    window.addEventListener('keydown', (e) => {
      const overlay = this.getScrollContainer();
      if (!overlay || !this.isOpen) return;

      const active = document.activeElement;
      const tag = active ? active.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || active?.isContentEditable) {
        return;
      }

      const key = e.key;
      if (key === 'Escape') {
        const pOverlay = document.getElementById('prologue-modal-overlay');
        if (pOverlay && pOverlay.style.display !== 'none') {
          e.preventDefault();
          e.stopPropagation();
          window.skipPrologueCinematic?.();
          return;
        }
        const cOverlay = document.getElementById('cinematic-modal-overlay');
        if (cOverlay && cOverlay.style.display !== 'none') {
          e.preventDefault();
          e.stopPropagation();
          window.closeCinematicModal?.();
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        this.close();
        if (typeof window !== 'undefined' && window._fp && !window._hasEnteredWorld) {
          window._fp.open();
        }
        return;
      }
      if (key === 'PageDown' || (key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        overlay.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      } else if (key === 'PageUp' || (key === ' ' && e.shiftKey)) {
        e.preventDefault();
        overlay.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        overlay.scrollBy({ top: 140, behavior: 'smooth' });
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        overlay.scrollBy({ top: -140, behavior: 'smooth' });
      } else if (key === 'Home') {
        e.preventDefault();
        overlay.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (key === 'End') {
        e.preventDefault();
        overlay.scrollTo({ top: overlay.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  getStartOnLoadout() {
    try {
      return localStorage.getItem(START_ON_LOADOUT_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  setStartOnLoadout(checked) {
    try {
      localStorage.setItem(START_ON_LOADOUT_KEY, checked ? 'true' : 'false');
    } catch (_) {}

    if (typeof document !== 'undefined') {
      const cbs = document.querySelectorAll('.start-on-site-cb');
      cbs.forEach((cb) => {
        cb.checked = Boolean(checked);
      });
    }
  }

  playSfx(type = 'click') {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'launch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (_) {}
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.playSfx('click');
    this.render();
  }

  setTab(tabId) {
    const aliasMap = {
      'prologue-hero': 'overview',
      'theatre': 'theatre',
      'forge': 'forge',
      'systems': 'systems',
      'game-encyclopedia': 'systems',
      'lore-chronicle': 'atlas',
      'tcg-cards': 'armory',
      'armory': 'armory',
      'arena': 'atlas',
      'atlas': 'atlas',
      'settings': 'settings',
    };
    this.activeTab = aliasMap[tabId] || tabId;
    this.playSfx('click');
    this.render();
    if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
      const scrollEl = document.querySelector('.landing-main-scroll');
      if (scrollEl) {
        scrollEl.scrollTop = 0;
      }
    }
  }

  open(initialTab = null) {
    this.isOpen = true;
    if (initialTab) {
      this.activeTab = initialTab;
    } else if (typeof window !== 'undefined' && window._pendingLandingTab) {
      this.activeTab = window._pendingLandingTab;
      window._pendingLandingTab = null;
    }
    if (typeof window !== 'undefined' && window._pendingLandingFaction) {
      const pendingFac = window._pendingLandingFaction;
      window._pendingLandingFaction = null;
      this.setFaction(pendingFac);
    }
    if (typeof window !== 'undefined' && window._pendingOstTrack) {
      const pendingTrack = window._pendingOstTrack;
      window._pendingOstTrack = null;
      this.playOstTrack(pendingTrack);
    }

    if (this.frontpage) {
      this.frontpage.close();
    }
    if (typeof document !== 'undefined') {
      const fpOverlay = document.getElementById('frontpage-overlay');
      if (fpOverlay) fpOverlay.style.display = 'none';

      let overlay = document.getElementById('landing-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'landing-overlay';
        overlay.className = 'landing-overlay';
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'block';

      this.render();
      this.initScreenPanning();
      this.initKeyboardNavigation();

      if (initialTab) {
        const targetEl = document.getElementById(initialTab);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  close() {
    this.isOpen = false;
    if (this._ostAudio) {
      try {
        this._ostAudio.pause();
      } catch (_) {}
      this.isOstPlaying = false;
    }
    if (typeof document !== 'undefined') {
      const overlay = document.getElementById('landing-overlay');
      if (overlay) overlay.style.display = 'none';
      const fpOverlay = document.getElementById('frontpage-overlay');
      if (fpOverlay && (!this.frontpage || !this.frontpage.isOpen)) {
        fpOverlay.style.display = 'none';
      }
    }
  }

  initAudioEngine() {
    if (this._ostAudio || typeof window === 'undefined') return;
    try {
      this._ostAudio = new Audio();
      this._ostAudio.preload = 'metadata';
      this._ostAudio.volume = this.isMuted ? 0 : this.volume;

      this._ostAudio.addEventListener('timeupdate', () => {
        if (!this._isDraggingScrubber && this._ostAudio) {
          this.currentTime = this._ostAudio.currentTime || 0;
          this.updatePlaybackProgressUI();
        }
      });

      this._ostAudio.addEventListener('durationchange', () => {
        if (this._ostAudio && !isNaN(this._ostAudio.duration) && this._ostAudio.duration > 0) {
          this.duration = this._ostAudio.duration;
          this.updatePlaybackProgressUI();
        }
      });

      this._ostAudio.addEventListener('loadedmetadata', () => {
        if (this._ostAudio && !isNaN(this._ostAudio.duration) && this._ostAudio.duration > 0) {
          this.duration = this._ostAudio.duration;
          this.updatePlaybackProgressUI();
        }
      });

      this._ostAudio.addEventListener('play', () => {
        this.isOstPlaying = true;
        this.updateJukeboxUI();
      });

      this._ostAudio.addEventListener('pause', () => {
        this.isOstPlaying = false;
        this.updateJukeboxUI();
      });

      this._ostAudio.addEventListener('ended', () => {
        this.handleTrackEnded();
      });

      this._ostAudio.addEventListener('error', (e) => {
        console.warn('[MediaPlayer] Audio element error:', e);
        this.handleAudioError();
      });
    } catch (err) {
      console.warn('[MediaPlayer] Failed to initialize Audio engine:', err);
    }
  }

  handleTrackEnded() {
    if (this.queue.length > 0) {
      const nextTrackId = this.queue.shift();
      this.playOstTrack(nextTrackId, { fromQueue: true });
    } else if (this.repeatMode === 'one') {
      if (this._ostAudio) {
        this._ostAudio.currentTime = 0;
        this._ostAudio.play().catch(() => {});
      }
    } else if (this.repeatMode === 'all') {
      this.playNextTrack();
    } else {
      this.isOstPlaying = false;
      this.currentTime = 0;
      this.updateJukeboxUI();
    }
  }

  handleAudioError() {
    if (!this._ostAudio) return;
    const track = LANDING_OST_TRACKS.find((t) => t.id === this.currentOstTrackId);
    if (!track) return;

    if (this._audioFailoverCount === 0 && track.url && this._ostAudio.src !== track.url) {
      this._audioFailoverCount = 1;
      console.log(`[MediaPlayer] Failing over ${track.name} to CDN: ${track.url}`);
      this._ostAudio.src = track.url;
      this._ostAudio.play().catch((err) => {
        console.warn('[MediaPlayer] CDN fallback failed:', err);
        this.isOstPlaying = false;
        this.updateJukeboxUI();
      });
      return;
    }

    this.isOstPlaying = false;
    this.updateJukeboxUI();
  }

  playOstTrack(trackId, { fromQueue = false } = {}) {
    this.initAudioEngine();
    const track = LANDING_OST_TRACKS.find((t) => t.id === trackId);
    if (!track) return;

    if (this.currentOstTrackId === trackId && this.isOstPlaying) {
      if (this._ostAudio) {
        try { this._ostAudio.pause(); } catch (_) {}
      }
      this.isOstPlaying = false;
      this.updateJukeboxUI();
      return;
    }

    if (this.currentOstTrackId && this.currentOstTrackId !== trackId) {
      this.history.push(this.currentOstTrackId);
      if (this.history.length > 40) this.history.shift();
    }

    this.currentOstTrackId = trackId;
    this.duration = track.durationSec || 180;
    this.currentTime = 0;
    this._audioFailoverCount = 0;
    this.isOstPlaying = true;

    if (this._ostAudio) {
      try {
        const audioSrc = track.localUrl || track.url;
        if (this._ostAudio.src !== audioSrc && !this._ostAudio.src.endsWith(audioSrc)) {
          this._ostAudio.src = audioSrc;
        }
        this._ostAudio.volume = this.isMuted ? 0 : this.volume;
        const p = this._ostAudio.play();
        if (p !== undefined) {
          p.catch((e) => {
            console.warn('[MediaPlayer] Local audio play rejected, testing CDN:', e);
            if (this._ostAudio.src !== track.url) {
              this._audioFailoverCount = 1;
              this._ostAudio.src = track.url;
              this._ostAudio.play().catch((err2) => {
                console.warn('[MediaPlayer] CDN play also failed:', err2);
                this.isOstPlaying = false;
                this.updateJukeboxUI();
              });
            } else {
              this.isOstPlaying = false;
              this.updateJukeboxUI();
            }
          });
        }
      } catch (err) {
        console.warn('[MediaPlayer] Failed to play audio:', err);
        this.isOstPlaying = false;
      }
    }

    this.updateJukeboxUI();
  }

  toggleOstPlay() {
    this.initAudioEngine();
    if (this.isOstPlaying) {
      if (this._ostAudio) {
        try { this._ostAudio.pause(); } catch (_) {}
      }
      this.isOstPlaying = false;
      this.updateJukeboxUI();
    } else if (this._ostAudio && this._ostAudio.src && !this._ostAudio.ended) {
      this.isOstPlaying = true;
      this._ostAudio.play().then(() => {
        this.updateJukeboxUI();
      }).catch(() => {
        this.playOstTrack(this.currentOstTrackId || 'title');
      });
      this.updateJukeboxUI();
    } else {
      this.playOstTrack(this.currentOstTrackId || 'title');
    }
  }

  playNextTrack() {
    if (this.queue.length > 0) {
      const nextTrackId = this.queue.shift();
      this.playOstTrack(nextTrackId, { fromQueue: true });
      return;
    }

    const tracks = LANDING_OST_TRACKS;
    if (this.isShuffle) {
      const pool = tracks.filter((t) => t.id !== this.currentOstTrackId);
      const rand = pool[Math.floor(Math.random() * pool.length)] || tracks[0];
      this.playOstTrack(rand.id);
      return;
    }

    const curIdx = tracks.findIndex((t) => t.id === this.currentOstTrackId);
    const nextIdx = (curIdx + 1) % tracks.length;
    this.playOstTrack(tracks[nextIdx].id);
  }

  playPrevTrack() {
    if (this._ostAudio && this._ostAudio.currentTime > 3) {
      this._ostAudio.currentTime = 0;
      this.currentTime = 0;
      this.updatePlaybackProgressUI();
      return;
    }

    if (this.history.length > 0) {
      const prevId = this.history.pop();
      this.playOstTrack(prevId);
      return;
    }

    const tracks = LANDING_OST_TRACKS;
    const curIdx = tracks.findIndex((t) => t.id === this.currentOstTrackId);
    const prevIdx = (curIdx - 1 + tracks.length) % tracks.length;
    this.playOstTrack(tracks[prevIdx].id);
  }

  seekTrack(seconds) {
    const target = Number(seconds);
    this._isDraggingScrubber = false;
    if (!isNaN(target)) {
      this.currentTime = target;
      if (this._ostAudio) {
        try {
          this._ostAudio.currentTime = target;
        } catch (_) {}
      }
      this.updatePlaybackProgressUI();
    }
  }

  onScrubberInput(val) {
    this._isDraggingScrubber = true;
    const s = Number(val);
    if (!isNaN(s)) {
      this.currentTime = s;
      this.updatePlaybackProgressUI();
    }
  }

  setVolume(val) {
    const v = Math.max(0, Math.min(1, Number(val)));
    this.volume = v;
    this.isMuted = v === 0;
    if (this._ostAudio) {
      this._ostAudio.volume = v;
    }
    this.updateJukeboxUI();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this._ostAudio) {
      this._ostAudio.volume = this.isMuted ? 0 : this.volume;
    }
    this.updateJukeboxUI();
  }

  toggleRepeatMode() {
    if (this.repeatMode === 'all') this.repeatMode = 'one';
    else if (this.repeatMode === 'one') this.repeatMode = 'off';
    else this.repeatMode = 'all';
    this.updateJukeboxUI();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.updateJukeboxUI();
  }

  toggleQueueDrawer() {
    this.showQueue = !this.showQueue;
    this.updateJukeboxUI();
  }

  addToQueue(trackId) {
    const track = LANDING_OST_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    this.queue.push(trackId);
    if (!this.isOstPlaying && (!this._ostAudio || this._ostAudio.paused)) {
      this.playOstTrack(this.queue.shift(), { fromQueue: true });
    } else {
      this.updateJukeboxUI();
    }
  }

  removeFromQueue(index) {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      this.updateJukeboxUI();
    }
  }

  clearQueue() {
    this.queue = [];
    this.updateJukeboxUI();
  }

  playQueuedItem(index) {
    if (index >= 0 && index < this.queue.length) {
      const trackId = this.queue.splice(index, 1)[0];
      this.playOstTrack(trackId, { fromQueue: true });
    }
  }

  setTrackFilter(cat) {
    this.trackFilter = cat;
    this.renderTracklistSectionOnly();
  }

  setTrackSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.renderTracklistSectionOnly();
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updatePlaybackProgressUI() {
    if (typeof document === 'undefined') return;
    const curTimeEl = document.getElementById('gf-cur-time');
    if (curTimeEl) curTimeEl.textContent = this.formatTime(this.currentTime);

    const totalTimeEl = document.getElementById('gf-total-time');
    if (totalTimeEl) totalTimeEl.textContent = this.formatTime(this.duration);

    const progressPct = this.duration > 0 ? Math.min(100, Math.max(0, (this.currentTime / this.duration) * 100)) : 0;
    const fillEl = document.getElementById('gf-scrubber-fill');
    if (fillEl) fillEl.style.width = `${progressPct}%`;

    const thumbEl = document.getElementById('gf-scrubber-thumb');
    if (thumbEl) thumbEl.style.left = `${progressPct}%`;

    const inputEl = document.getElementById('gf-scrubber-input');
    if (inputEl && !this._isDraggingScrubber) {
      inputEl.value = this.currentTime;
      inputEl.max = this.duration || 180;
    }
  }

  updateJukeboxUI() {
    if (typeof document === 'undefined') return;
    const track = LANDING_OST_TRACKS.find((t) => t.id === this.currentOstTrackId) || LANDING_OST_TRACKS[0];

    const badgeEl = document.querySelector('.gf-player-status-badge');
    if (badgeEl) {
      badgeEl.className = `gf-player-status-badge ${this.isOstPlaying ? 'playing' : 'paused'}`;
      const textSpan = badgeEl.querySelector('span:last-child');
      if (textSpan) textSpan.textContent = this.isOstPlaying ? 'Now Playing' : 'Paused';
    }

    const discEl = document.querySelector('.gf-player-disc');
    if (discEl) {
      if (this.isOstPlaying) discEl.classList.add('playing');
      else discEl.classList.remove('playing');
      const centerSpan = discEl.querySelector('.gf-player-disc-center span');
      if (centerSpan) centerSpan.textContent = track.icon;
    }

    const titleEl = document.querySelector('.gf-player-track-name');
    if (titleEl) titleEl.textContent = track.name;

    const descEl = document.querySelector('.gf-player-track-desc');
    if (descEl) descEl.textContent = track.desc;

    const heroBtn = document.querySelector('.gf-player-btn-hero');
    if (heroBtn) {
      heroBtn.innerHTML = this.isOstPlaying ? '<span>⏸ PAUSE</span>' : '<span>▶ PLAY</span>';
      if (this.isOstPlaying) heroBtn.classList.add('playing');
      else heroBtn.classList.remove('playing');
    }

    const repeatBtn = document.getElementById('gf-repeat-btn');
    if (repeatBtn) {
      repeatBtn.innerHTML = `<span>${this.repeatMode === 'one' ? '🔂 ONE' : (this.repeatMode === 'all' ? '🔁 ALL' : '➡️ OFF')}</span>`;
      if (this.repeatMode !== 'off') repeatBtn.classList.add('active');
      else repeatBtn.classList.remove('active');
    }

    const shuffleBtn = document.getElementById('gf-shuffle-btn');
    if (shuffleBtn) {
      if (this.isShuffle) shuffleBtn.classList.add('active');
      else shuffleBtn.classList.remove('active');
    }

    const queueBtn = document.getElementById('gf-queue-toggle-btn');
    if (queueBtn) {
      queueBtn.innerHTML = `<span>📑 Queue</span> <span style="background:rgba(250,204,21,0.2); color:#fde047; padding:1px 6px; border-radius:9999px; font-size:9.5px; border:1px solid #ca8a04;">${this.queue.length}</span>`;
      if (this.showQueue) queueBtn.classList.add('active');
      else queueBtn.classList.remove('active');
    }

    const queueDrawer = document.getElementById('gf-queue-drawer');
    if (queueDrawer) {
      queueDrawer.style.display = this.showQueue ? 'flex' : 'none';
      queueDrawer.innerHTML = this.renderQueueDrawerContent();
    }

    const dockEl = document.querySelector('.persistent-music-dock');
    if (dockEl) {
      dockEl.style.display = this.isOstPlaying ? 'flex' : 'none';
      const dName = dockEl.querySelector('.dock-track-name');
      if (dName) dName.textContent = track.name;
      const dBtn = dockEl.querySelector('.dock-play-btn');
      if (dBtn) dBtn.innerHTML = this.isOstPlaying ? '⏸️' : '▶️';
    }

    this.updatePlaybackProgressUI();
    this.renderTracklistSectionOnly();
  }

  renderQueueDrawerContent() {
    if (this.queue.length === 0) {
      return `
        <div class="gf-queue-header">
          <div class="gf-queue-title"><span>📑</span> <span>Active Queue (0 Tracks)</span></div>
        </div>
        <div style="text-align:center; padding:12px; color:#94a3b8; font-size:11px;">
          Queue is empty. Click <b>+ Queue</b> on any track below to line up your playlist.
        </div>
      `;
    }

    return `
      <div class="gf-queue-header">
        <div class="gf-queue-title">
          <span>📑</span>
          <span>Active Queue (${this.queue.length} Track${this.queue.length > 1 ? 's' : ''})</span>
        </div>
        <button type="button" class="gf-player-btn" style="padding:3px 8px; font-size:10px; color:#f87171;" onclick="window._landing.clearQueue()">
          Clear Queue ✕
        </button>
      </div>
      <div class="gf-queue-list">
        ${this.queue.map((tId, idx) => {
          const t = LANDING_OST_TRACKS.find((tr) => tr.id === tId) || { name: tId, duration: '2:50', icon: '🎵', zone: 'Realm' };
          return `
            <div class="gf-queue-item">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="gf-queue-pos">#${idx + 1}</span>
                <span>${t.icon}</span>
                <span class="gf-queue-item-name">${this.escapeHtml(t.name)}</span>
                <span style="font-size:10px; color:#38bdf8;">• ${this.escapeHtml(t.zone)}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:10px; color:#94a3b8;">${t.duration}</span>
                <button type="button" class="gf-track-act-btn play-btn" style="padding:2px 6px; font-size:9.5px;" onclick="window._landing.playQueuedItem(${idx})">
                  ▶ Play
                </button>
                <button type="button" class="gf-track-act-btn" style="padding:2px 6px; font-size:9.5px; color:#f87171;" onclick="window._landing.removeFromQueue(${idx})">
                  ✕
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderTracklistSectionOnly() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('gf-track-table-container');
    if (container) {
      container.innerHTML = this.renderTrackRows();
    }
  }

  renderMediaPlayerSection(activeOstTrack) {
    const progressPct = this.duration > 0 ? Math.min(100, Math.max(0, (this.currentTime / this.duration) * 100)) : 0;
    return `
      <div class="gf-media-player" id="gf-media-player">
        <div class="gf-player-header">
          <div class="gf-player-header-title">
            <span style="font-size:18px;">🎼</span>
            <h3>GLIMMERFALL MASTER REALM JUKEBOX & MEDIA PLAYER</h3>
            <span class="gf-player-chip" style="color:#facc15; border-color:rgba(250,204,21,0.4);">15 Master Tracks</span>
          </div>
          <div class="gf-player-status-badge ${this.isOstPlaying ? 'playing' : 'paused'}">
            <span class="gf-player-status-dot"></span>
            <span>${this.isOstPlaying ? 'Now Playing' : 'Paused'}</span>
          </div>
        </div>

        <div class="gf-player-deck">
          <div class="gf-player-disc-wrap">
            <div class="gf-player-disc ${this.isOstPlaying ? 'playing' : ''}">
              <div class="gf-player-disc-center">
                <span>${activeOstTrack.icon}</span>
              </div>
            </div>
          </div>

          <div class="gf-player-meta">
            <div class="gf-player-tagline">
              <span class="gf-player-chip">${this.escapeHtml(activeOstTrack.category)}</span>
              <span class="gf-player-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.4);">${this.escapeHtml(activeOstTrack.zone)}</span>
              <span class="gf-player-bpm-key">${activeOstTrack.bpm} BPM &bull; Key: ${activeOstTrack.key}</span>
              <span style="font-size:10px; color:#94a3b8; font-family:'Rajdhani', monospace;">High-Fidelity M4A / 48kHz</span>
            </div>

            <div class="gf-player-track-name">${this.escapeHtml(activeOstTrack.name)}</div>
            <div class="gf-player-track-desc">${this.escapeHtml(activeOstTrack.desc)}</div>

            <!-- Scrubber Timeline -->
            <div class="gf-player-scrubber-row">
              <span class="gf-time-label" id="gf-cur-time">${this.formatTime(this.currentTime)}</span>
              <div class="gf-scrubber-track" id="gf-scrubber-track">
                <div class="gf-scrubber-fill" id="gf-scrubber-fill" style="width:${progressPct}%;"></div>
                <div class="gf-scrubber-thumb" id="gf-scrubber-thumb" style="left:${progressPct}%;"></div>
                <input
                  type="range"
                  class="gf-scrubber-input"
                  id="gf-scrubber-input"
                  min="0"
                  max="${this.duration || 180}"
                  step="0.5"
                  value="${this.currentTime || 0}"
                  oninput="window._landing.onScrubberInput(this.value)"
                  onchange="window._landing.seekTrack(this.value)"
                />
              </div>
              <span class="gf-time-label total" id="gf-total-time">${this.formatTime(this.duration)}</span>
            </div>

            <!-- Controls Row -->
            <div class="gf-player-controls-row">
              <div class="gf-player-btn-group">
                <button type="button" class="gf-player-btn ${this.isShuffle ? 'active' : ''}" id="gf-shuffle-btn" onclick="window._landing.toggleShuffle()" title="Shuffle">
                  <span>🔀</span> <span style="font-size:10px;">Shuffle</span>
                </button>
                <button type="button" class="gf-player-btn" onclick="window._landing.playPrevTrack()" title="Previous Track">
                  <span>⏮</span>
                </button>
                <button type="button" class="gf-player-btn gf-player-btn-hero ${this.isOstPlaying ? 'playing' : ''}" onclick="window._landing.toggleOstPlay()">
                  <span>${this.isOstPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
                </button>
                <button type="button" class="gf-player-btn" onclick="window._landing.playNextTrack()" title="Next Track">
                  <span>⏭</span>
                </button>
                <button type="button" class="gf-player-btn ${this.repeatMode !== 'off' ? 'active' : ''}" id="gf-repeat-btn" onclick="window._landing.toggleRepeatMode()" title="Repeat Mode">
                  <span>${this.repeatMode === 'one' ? '🔂 ONE' : (this.repeatMode === 'all' ? '🔁 ALL' : '➡️ OFF')}</span>
                </button>
              </div>

              <div class="gf-player-btn-group">
                <div class="gf-volume-box">
                  <button type="button" style="background:none; border:none; color:#cbd5e1; cursor:pointer; font-size:13px; padding:0;" onclick="window._landing.toggleMute()">
                    ${this.isMuted || this.volume === 0 ? '🔇' : '🔊'}
                  </button>
                  <input
                    type="range"
                    class="gf-volume-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value="${this.isMuted ? 0 : this.volume}"
                    oninput="window._landing.setVolume(this.value)"
                    title="Volume"
                  />
                </div>

                <button type="button" class="gf-player-btn ${this.showQueue ? 'active' : ''}" id="gf-queue-toggle-btn" onclick="window._landing.toggleQueueDrawer()">
                  <span>📑 Queue</span>
                  <span style="background:rgba(250,204,21,0.2); color:#fde047; padding:1px 6px; border-radius:9999px; font-size:9.5px; border:1px solid #ca8a04;">
                    ${this.queue.length}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Queue Drawer -->
        <div class="gf-queue-drawer" id="gf-queue-drawer" style="${this.showQueue ? 'display:flex;' : 'display:none;'}">
          ${this.renderQueueDrawerContent()}
        </div>
      </div>
    `;
  }

  renderTracklistSection(activeOstTrack) {
    return `
      <div class="gf-tracklist-section" id="gf-tracklist-section">
        <div class="gf-tracklist-header-row">
          <div class="gf-tracklist-title">
            <span>🎼</span>
            <span>OFFICIAL SOUNDTRACK CATALOG (15 MASTER TRACKS)</span>
          </div>

          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <input
              type="text"
              class="gf-tracklist-search"
              placeholder="🔍 Search tracks by name, key, lore..."
              value="${this.escapeHtml(this.searchQuery)}"
              oninput="window._landing.setTrackSearch(this.value)"
            />
          </div>
        </div>

        <div class="gf-tracklist-filters">
          <button type="button" class="gf-filter-btn ${this.trackFilter === 'all' ? 'active' : ''}" onclick="window._landing.setTrackFilter('all')">
            All Tracks (15)
          </button>
          <button type="button" class="gf-filter-btn ${this.trackFilter === 'factions' ? 'active' : ''}" onclick="window._landing.setTrackFilter('factions')">
            ☀️ Factions (4)
          </button>
          <button type="button" class="gf-filter-btn ${this.trackFilter === 'zones' ? 'active' : ''}" onclick="window._landing.setTrackFilter('zones')">
            🗺️ Biomes &amp; Havens (4)
          </button>
          <button type="button" class="gf-filter-btn ${this.trackFilter === 'combat' ? 'active' : ''}" onclick="window._landing.setTrackFilter('combat')">
            ⚔️ Combat &amp; Arenas (4)
          </button>
          <button type="button" class="gf-filter-btn ${this.trackFilter === 'cinematics' ? 'active' : ''}" onclick="window._landing.setTrackFilter('cinematics')">
            🎬 Cinematic Themes (3)
          </button>
        </div>

        <div class="gf-track-table" id="gf-track-table-container">
          ${this.renderTrackRows()}
        </div>
      </div>
    `;
  }

  renderTrackRows() {
    let filtered = LANDING_OST_TRACKS;
    if (this.trackFilter === 'factions') {
      filtered = filtered.filter((t) => t.category === 'Factions');
    } else if (this.trackFilter === 'zones') {
      filtered = filtered.filter((t) => t.category === 'Biomes & Havens');
    } else if (this.trackFilter === 'combat') {
      filtered = filtered.filter((t) => t.category === 'Combat & Arenas');
    } else if (this.trackFilter === 'cinematics') {
      filtered = filtered.filter((t) => t.category === 'Cinematic Themes');
    }

    if (this.searchQuery) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(this.searchQuery) ||
        t.zone.toLowerCase().includes(this.searchQuery) ||
        t.desc.toLowerCase().includes(this.searchQuery) ||
        t.key.toLowerCase().includes(this.searchQuery) ||
        String(t.bpm).includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      return `
        <div style="text-align:center; padding:24px; color:#94a3b8; font-size:12px; background:rgba(15,23,42,0.6); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
          No soundtrack entries found matching "${this.escapeHtml(this.searchQuery)}".
        </div>
      `;
    }

    return filtered.map((t, index) => {
      const isCur = this.currentOstTrackId === t.id;
      const isPlay = isCur && this.isOstPlaying;
      const qIdx = this.queue.indexOf(t.id);
      const isQueued = qIdx !== -1;

      return `
        <div class="gf-track-row ${isCur ? 'active' : ''}"
             onclick="window._landing.playOstTrack('${t.id}')">
          <div class="gf-track-col-num">
            ${isPlay ? `
              <div class="ost-equalizer playing" style="height:14px; gap:2px;">
                <div class="ost-eq-bar" style="width:2.5px;"></div>
                <div class="ost-eq-bar" style="width:2.5px;"></div>
                <div class="ost-eq-bar" style="width:2.5px;"></div>
              </div>
            ` : (isCur ? '▶' : `#${index + 1}`)}
          </div>

          <div class="gf-track-info-cell">
            <span class="gf-track-icon">${t.icon}</span>
            <div class="gf-track-name-box">
              <div class="gf-track-row-title">${this.escapeHtml(t.name)}</div>
              <div class="gf-track-row-desc">${this.escapeHtml(t.desc)}</div>
            </div>
          </div>

          <div class="gf-track-col-zone">
            <span class="gf-player-chip" style="font-size:9px; border-color:rgba(56,189,248,0.3); color:#7dd3fc;">
              ${this.escapeHtml(t.zone)}
            </span>
          </div>

          <div class="gf-track-col-meta">
            <span style="font-size:9.5px; font-weight:700; color:#facc15; font-family:'Rajdhani', monospace;">
              ${t.bpm} BPM &bull; ${t.key}
            </span>
          </div>

          <div class="gf-track-col-dur">
            <span style="font-size:11px; color:#94a3b8; font-family:'Rajdhani', monospace; font-weight:600;">
              ${t.duration}
            </span>
          </div>

          <div class="gf-track-actions" onclick="event.stopPropagation()">
            <button
              type="button"
              class="gf-track-act-btn ${isPlay ? 'play-btn' : ''}"
              onclick="window._landing.playOstTrack('${t.id}')"
              title="${isPlay ? 'Pause' : 'Play Immediately'}"
            >
              ${isPlay ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              class="gf-track-act-btn ${isQueued ? 'queued' : ''}"
              onclick="${isQueued ? `window._landing.removeFromQueue(${qIdx})` : `window._landing.addToQueue('${t.id}')`}"
              title="${isQueued ? 'Remove from Queue' : 'Add to Queue'}"
            >
              ${isQueued ? `✓ Queue #${qIdx + 1}` : '+ Queue'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  selectCinematic(sceneId) {
    const scene = LANDING_CINEMATICS.find((s) => s.id === sceneId);
    if (!scene) return;
    this.selectedCinematicId = sceneId;

    if (typeof document !== 'undefined') {
      const wrap = document.querySelector('.theatre-main-video-wrap');
      if (wrap) {
        if (scene.youtubeId) {
          wrap.innerHTML = `
            <iframe
              id="theatre-main-iframe"
              src="https://www.youtube.com/embed/${scene.youtubeId}?autoplay=${this.isTheatreAutoplay ? '1' : '0'}&rel=0"
              title="${this.escapeHtml(scene.title)}"
              style="width:100%; height:100%; min-height:360px; border:0; aspect-ratio:16/9; display:block;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          `;
        } else {
          wrap.innerHTML = `
            <video
              id="theatre-main-video"
              src="${scene.url}"
              poster="${scene.poster || LOGO_SRC}"
              controls
              playsinline
              preload="metadata"
              class="theatre-main-video"
            ></video>
          `;
          const vid = document.getElementById('theatre-main-video');
          if (vid) {
            vid.onended = () => {
              if (this.isTheatreAutoplay) {
                this.advanceCinematic(1, true);
              }
            };
            vid.play().catch(() => {});
          }
        }
      }

      const captionEl = document.getElementById('theatre-main-caption');
      if (captionEl) {
        captionEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <b style="color:#fde047; font-size:12px;">🎬 ${this.escapeHtml(scene.title)}</b>
            <span style="font-size:10px; color:#38bdf8; font-weight:bold;">${this.escapeHtml(scene.category)} &bull; ${scene.duration} &bull; 1080p Full HD</span>
          </div>
          <p style="margin-top:4px; font-size:11px; color:#cbd5e1; line-height:1.4;">${this.escapeHtml(scene.desc)}</p>
        `;
      }

      const cinemaBtn = document.getElementById('theatre-cinema-btn');
      if (cinemaBtn) {
        cinemaBtn.setAttribute('onclick', `window.playCinematicModal && window.playCinematicModal('${scene.modalKey}')`);
      }

      const cards = document.querySelectorAll('.theatre-scene-card');
      cards.forEach((c) => {
        if (c.getAttribute('data-scene') === sceneId) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    }
  }

  toggleTheatreAutoplay() {
    this.isTheatreAutoplay = !this.isTheatreAutoplay;
    this.playSfx('click');
    const btn = document.getElementById('theatre-autoplay-btn');
    if (btn) {
      if (this.isTheatreAutoplay) {
        btn.classList.add('active');
        btn.innerHTML = '<span>🔁</span> AUTOPLAY: ON';
        btn.style.borderColor = '#22e07b';
        btn.style.color = '#86efac';
        btn.style.background = 'rgba(34, 224, 123, 0.2)';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>▶️</span> AUTOPLAY: OFF';
        btn.style.borderColor = '#64748b';
        btn.style.color = '#94a3b8';
        btn.style.background = 'transparent';
      }
    }
    const vid = document.getElementById('theatre-main-video');
    if (vid) {
      vid.onended = () => {
        if (this.isTheatreAutoplay) {
          this.advanceCinematic(1, true);
        }
      };
      if (this.isTheatreAutoplay && vid.paused && vid.currentTime === 0) {
        vid.play().catch(() => {});
      }
    }
  }

  advanceCinematic(delta = 1, autoStart = true) {
    const curIdx = LANDING_CINEMATICS.findIndex((s) => s.id === this.selectedCinematicId);
    const nextIdx = (curIdx + delta + LANDING_CINEMATICS.length) % LANDING_CINEMATICS.length;
    const nextScene = LANDING_CINEMATICS[nextIdx];
    this.selectCinematic(nextScene.id);
    if (autoStart) {
      const vid = document.getElementById('theatre-main-video');
      if (vid) {
        vid.play().catch(() => {});
      }
    }
  }

  openLoadout() {
    this.playSfx('click');
    this.close();
    if (this.frontpage) {
      this.frontpage.open();
    } else if (typeof window !== 'undefined' && window.openFrontpage) {
      window.openFrontpage();
    }
  }

  setGameEncSection(section) {
    this.gameEncSection = section;
    this.playSfx('click');
    this.render();
  }

  setLoreEncSection(section) {
    this.loreEncSection = section;
    this.playSfx('click');
    this.render();
  }

  setHoveredItem(itemId) {
    this.hoveredItemId = itemId;
    this.render();
  }

  setFaction(fac) {
    this.selectedFaction = fac;
    const classes = Object.values(CLASSES_CATALOG).filter((c) => c.faction === fac);
    if (classes.length > 0) {
      this.selectedClassId = classes[0].id;
    }
    const defaultOrderTags = { Solari: 'SUN', Umbri: 'VOID', Terra: 'ROOT', Aether: 'AETH' };
    if (defaultOrderTags[fac]) {
      this.selectedOrderTag = defaultOrderTags[fac];
    }
    const defaultNames = { Solari: 'Aurelia', Umbri: 'Morrigan', Terra: 'Rowan', Aether: 'Caelum' };
    if (!this.hasUserEditedName && defaultNames[fac]) {
      this.characterName = defaultNames[fac];
    }
    this.playSfx('click');
    this.render();
  }

  setClass(classId) {
    this.selectedClassId = classId;
    this.playSfx('click');
    this.render();
  }

  setOrder(tag) {
    const allowed = getOrderPresetsForFaction(this.selectedFaction);
    if (!allowed.some((o) => o.tag === tag)) return;
    this.selectedOrderTag = tag;
    this.playSfx('click');
    this.render();
  }

  setPlayMode(mode) {
    this.playMode = mode;
    try {
      localStorage.setItem(PLAY_MODE_KEY, mode);
    } catch (_) {}
    if (this.frontpage) {
      this.frontpage.playMode = mode;
    }
    this.playSfx('click');
    this.render();
  }

  randomizeName() {
    const pick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(Math.random() * 89 + 10);
    this.characterName = `${pick}_${num}`;
    this.playSfx('click');
    this.render();
  }

  startJourney() {
    this.playSfx('launch');
    this.close();
    if (typeof window !== 'undefined' && typeof window.playPrologueCinematic === 'function') {
      window.playPrologueCinematic({
        isReplay: false,
        onComplete: () => {
          this.openLoadout();
        },
      });
    } else {
      this.openLoadout();
    }
  }

  async launchGame() {
    this.playSfx('launch');
    const rawName = (this.characterName || 'Vanguard').trim();
    const vRes = validateCharacterName(rawName);
    if (!vRes.valid) {
      alert(`⚠️ ${vRes.error}`);
      return;
    }
    const finalName = vRes.cleanName;
    const allowedOrders = getOrderPresetsForFaction(this.selectedFaction);
    const order = allowedOrders.find((o) => o.tag === this.selectedOrderTag) || allowedOrders[0] || ORDER_PRESETS[0];
    const cls = CLASSES_CATALOG[this.selectedClassId] || CLASSES_CATALOG.solari_vanguard;

    try {
      localStorage.setItem(PLAY_MODE_KEY, this.playMode);
    } catch (_) {}

    // Auto-mark prologue as seen so no blocking animation or video ever delays entering realm
    try {
      localStorage.setItem('glimmerfall_seen_prologue', 'true');
    } catch (_) {}

    await this._executeLaunch(finalName, order, cls);
  }

  async _executeLaunch(finalName, order, cls) {
    this.close();

    if (this.frontpage) {
      this.frontpage.close();
      this.frontpage.playMode = this.playMode;
      const roster = this.frontpage.getActiveRoster?.() || [];
      const existing = roster.find((c) => c.name && c.name.toLowerCase() === finalName.toLowerCase());
      if (existing) {
        if (existing.classId !== cls.id || existing.faction !== this.selectedFaction) {
          existing.classId = cls.id;
          existing.faction = this.selectedFaction;
          existing.orderTag = order.tag;
        }
        this.frontpage.selectCharacter(existing.id);
        await this.frontpage.playSelectedCharacter();
        return;
      }
      try {
        await this.frontpage.createCharacter({
          name: finalName,
          faction: this.selectedFaction,
          classId: cls.id,
          orderTag: order.tag,
          startingRealm: ROOM_TYPES.SANCTUARY_HUB,
        });
      } catch (err) {
        console.warn('[Landing] createCharacter fallback with unique suffix:', err);
        try {
          const uniqueName = `${finalName}_${Math.floor(100 + Math.random() * 899)}`;
          await this.frontpage.createCharacter({
            name: uniqueName,
            faction: this.selectedFaction,
            classId: cls.id,
            orderTag: order.tag,
            startingRealm: ROOM_TYPES.SANCTUARY_HUB,
          });
        } catch (_) {
          await this.frontpage.playSelectedCharacter();
        }
      }
    } else if (this.onEnterWorld) {
      this.onEnterWorld({
        playMode: this.playMode,
        profile: {
          id: `char_${Date.now()}`,
          displayName: finalName,
          faction: this.selectedFaction,
          classId: cls.id,
          orderTag: order.tag,
          homeBiome: ROOM_TYPES.SANCTUARY_HUB,
        },
        startingRealm: ROOM_TYPES.SANCTUARY_HUB,
      });
    } else if (typeof window !== 'undefined') {
      window.location.href = `/?mode=${this.playMode}&autostart=1`;
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==========================================
  // Render Function
  // ==========================================
  render() {
    if (typeof document === 'undefined') return '';
    const overlay = document.getElementById('landing-overlay');
    if (!overlay) return '';

    const startOnLoadout = this.getStartOnLoadout();
    const isSingle = this.playMode === 'singleplayer';
    const fm = FACTIONS_META[this.selectedFaction] || FACTIONS_META.Solari;
    const fe = FACTION_ELEMENTS[this.selectedFaction] || FACTION_ELEMENTS.Solari;
    const cls = CLASSES_CATALOG[this.selectedClassId] || CLASSES_CATALOG.solari_vanguard;
    const allowedOrders = getOrderPresetsForFaction(this.selectedFaction);
    const order = allowedOrders.find((o) => o.tag === this.selectedOrderTag) || allowedOrders[0] || ORDER_PRESETS[0];
    const factionClasses = Object.values(CLASSES_CATALOG).filter((c) => c.faction === this.selectedFaction);
    const hoveredItemObj = PIXEL_ITEMS.find((it) => it.id === this.hoveredItemId);
    const activeOstTrack = LANDING_OST_TRACKS.find((t) => t.id === this.currentOstTrackId) || LANDING_OST_TRACKS[0];
    const activeCinematic = LANDING_CINEMATICS.find((s) => s.id === this.selectedCinematicId) || LANDING_CINEMATICS[0];

    overlay.innerHTML = `
      <div class="landing-shell-layout">
        <!-- ========================================== -->
        <!-- STICKY GLASSMORPHIC TOP NAVIGATION BAR     -->
        <!-- ========================================== -->
        <header class="gf-top-navbar">
          <div class="gf-top-navbar-inner">
            <div class="gf-brand-cluster" onclick="window._landing.setTab('overview')">
              <div class="gf-brand-crest">
                <img src="${LOGO_SRC}" alt="GlimmerFall Official Logo" width="32" height="32" />
              </div>
              <div>
                <div class="gf-brand-title">GLIMMER<span>FALL</span></div>
                <div class="gf-telemetry-pill">
                  <span class="gf-telemetry-dot"></span>
                  <span>Online</span>
                </div>
              </div>
            </div>

            <nav class="landing-tabs-nav">
              <button type="button" class="landing-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" onclick="window._landing.setTab('overview')">
                <span>🏛️ Overview</span>
              </button>
              <button type="button" class="landing-tab-btn ${this.activeTab === 'forge' ? 'active' : ''}" onclick="window._landing.setTab('forge')">
                <span>⚔️ Entities</span>
              </button>
              <button type="button" class="landing-tab-btn ${this.activeTab === 'theatre' ? 'active' : ''}" onclick="window._landing.setTab('theatre')">
                <span>🎬 Theatre</span>
              </button>
              <button type="button" class="landing-tab-btn ${this.activeTab === 'systems' ? 'active' : ''}" onclick="window._landing.setTab('systems')">
                <span>⚙️ Systems</span>
              </button>
              <button type="button" class="landing-tab-btn ${this.activeTab === 'armory' ? 'active' : ''}" onclick="window._landing.setTab('armory')">
                <span>🛡️ Armory</span>
              </button>
              <button type="button" class="landing-tab-btn ${this.activeTab === 'atlas' ? 'active' : ''}" onclick="window._landing.setTab('atlas')">
                <span>🗺️ Lore</span>
              </button>
              <button type="button" class="landing-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" onclick="window._landing.setTab('settings')">
                <span>⚙️ Settings</span>
              </button>
            </nav>

            <div class="gf-navbar-actions">
              <div class="gf-mode-switch-pill" title="Switch Offline vs Online Realm">
                <button type="button"
                        class="sidebar-mode-btn ${isSingle ? 'active single' : ''}"
                        onclick="window._landing.setPlayMode('singleplayer')">
                  🕹️ Offline
                </button>
                <button type="button"
                        class="sidebar-mode-btn ${!isSingle ? 'active multi' : ''}"
                        onclick="window._landing.setPlayMode('multiplayer')">
                  🌐 Online
                </button>
              </div>
              <button type="button" class="id-mini-btn" style="padding:6px 10px; font-size:11.5px;" onclick="window._landing.openLoadout()">
                <span>👤</span> Roster
              </button>
              <button type="button" class="hero-btn-primary" style="padding:7px 14px; font-size:11.5px; white-space:nowrap;" onclick="window._landing.startJourney()">
                <span>⚡</span> PLAY NOW
              </button>
            </div>
          </div>
        </header>

        <!-- ========================================== -->
        <!-- MAIN SCROLLABLE CONTENT CONTAINER          -->
        <!-- ========================================== -->
        <main class="landing-main-scroll">
          <div class="landing-tab-content">
            ${this.renderActiveTab({ activeOstTrack, activeCinematic, fm, fe, cls, order, factionClasses, isSingle, startOnLoadout, hoveredItemObj })}
          </div>

          <!-- PERSISTENT MINI MUSIC PLAYER DOCK -->
          <div class="persistent-music-dock" style="${this.isOstPlaying ? 'display:flex;' : 'display:none;'}">
            <div class="ost-disc-icon ${this.isOstPlaying ? 'playing' : ''}" style="width:28px; height:28px; font-size:14px;">
              <span>🎵</span>
            </div>
            <div>
              <div class="dock-track-name" style="font-size:11px; font-weight:bold; color:#fde047; font-family:var(--font-header);">
                ${activeOstTrack.name}
              </div>
              <div style="font-size:9px; color:#38bdf8;">
                ${activeOstTrack.zone} &bull; ${activeOstTrack.bpm} BPM
              </div>
            </div>
            <button type="button" class="id-mini-btn dock-play-btn" style="padding:4px 8px; font-size:10px; border-color:#facc15; color:#fde047; cursor:pointer;" onclick="window._landing.toggleOstPlay()">
              ${this.isOstPlaying ? '⏸️' : '▶️'}
            </button>
            <button type="button" class="id-mini-btn" style="padding:4px 8px; font-size:10px; border-color:#38bdf8; color:#7dd3fc; cursor:pointer;" onclick="window._landing.setTab('overview')">
              Jukebox ↗
            </button>
          </div>

          <!-- FOOTER -->
          <footer style="margin-top:48px; padding:36px 24px; border-top:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; color:#94a3b8; font-size:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${LOGO_SRC}" alt="GlimmerFall" style="height:30px; object-fit:contain;" />
              <div>
                <b style="color:#fff; font-family:var(--font-header); letter-spacing:0.6px;">GLIMMERFALL ONLINE</b>
                <div style="font-size:11px; color:#64748b;">Canonical 2D Pixel Action MMORPG &bull; Connected to glimmerfalltcg.com</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:18px; flex-wrap:wrap;">
              <label style="display:inline-flex; align-items:center; gap:7px; cursor:pointer; color:#cbd5e1;">
                <input type="checkbox"
                       class="start-on-site-cb"
                       ${startOnLoadout ? 'checked' : ''}
                       onchange="window._landing.setStartOnLoadout(this.checked)" />
                <span>Skip portal &amp; start on Hero Roster</span>
              </label>
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:none; font-weight:700;">glimmerfalltcg.com ↗</a>
              <span>&copy; 2026 GlimmerFall Studios</span>
            </div>
          </footer>
        </main>
      </div>
    `;

    if (this.activeTab === 'theatre') {
      const vid = document.getElementById('theatre-main-video');
      if (vid) {
        vid.onended = () => {
          if (this.isTheatreAutoplay) {
            this.advanceCinematic(1, true);
          }
        };
      }
    }
  }

  // ==========================================
  // TAB ROUTER & SECTION RENDERERS
  // ==========================================
  renderActiveTab(props) {
    switch (this.activeTab) {
      case 'overview':
      case 'prologue-hero':
        return this.renderOverviewTab(props);
      case 'theatre':
        return this.renderTheatreTab(props);
      case 'forge':
        return this.renderForgeTab(props);
      case 'systems':
      case 'game-encyclopedia':
        return this.renderSystemsTab(props);
      case 'armory':
      case 'tcg-cards':
        return this.renderArmoryTab(props);
      case 'atlas':
      case 'arena':
      case 'lore-chronicle':
        return this.renderAtlasTab(props);
      case 'settings':
        return this.renderSettingsTab(props);
      default:
        return this.renderForgeTab(props);
    }
  }

  renderOverviewTab({ activeOstTrack, fm, fe, factionClasses, allowedOrders }) {
    const covOrders = getOrderPresetsForFaction(this.selectedFaction);
    return `
      <!-- 1. FULL-BLEED 2-COLUMN CINEMATIC HERO SHOWCASE -->
      <section id="prologue-hero" class="landing-hero-card">
        <div class="gf-hero-grid">
          <div>
            <div class="hero-chip-badge">
              <span>✨</span>
              <span>CANONICAL 2D ACTION MMORPG &bull; DUAL LAUNCH DEC 5, 2026</span>
            </div>
            <h1 class="hero-title">
              WHEN THE <span style="color:#facc15;">CRYSTAL HEART</span> SHATTERED, FOUR COVENANTS ROSE.
            </h1>
            <p class="hero-desc">
              Enter a living 16-bit dark-fantasy world powered by an authoritative <b>real-time MMO engine</b>.
              Pledge your allegiance to <b style="color:#facc15;">Solari</b>, <b style="color:#c084fc;">Umbri</b>,
              <b style="color:#4ade80;">Terra</b>, or <b style="color:#38bdf8;">Aether</b>. Master 7 artisan professions to
              <b>Level 99</b>, forge 3-socket Runewords and Covenant 4-piece sets, trade on the continental Grand Exchange,
              and clash in 3v3 Outpost Nexus sieges.
            </p>

            <div class="hero-cta-row">
              <button type="button" class="hero-btn-primary" onclick="window._landing.startJourney()">
                <span>⚡</span> PLAY FREE IN BROWSER
              </button>
              <button type="button" class="hero-btn-secondary" onclick="window._landing.setTab('forge')">
                <span>⚔️</span> FORGE YOUR CHAMPION
              </button>
              <button type="button" class="id-mini-btn" style="padding:12px 18px; border-color:rgba(250,204,21,0.45); color:#fde047;" onclick="window.playCinematicModal && window.playCinematicModal('crystal_heart')">
                <span>🎬</span> 1080P PROLOGUE
              </button>
            </div>

            <div class="hero-specs-row">
              <div class="hero-spec-pill">
                <div class="spec-val" style="color:#4ade80;">Online MMO</div>
                <div class="spec-lbl">Authoritative Realm</div>
              </div>
              <div class="hero-spec-pill">
                <div class="spec-val" style="color:#facc15;">4 Covenants</div>
                <div class="spec-lbl">8 Class Archetypes</div>
              </div>
              <div class="hero-spec-pill">
                <div class="spec-val" style="color:#38bdf8;">Lv. 99 Cap</div>
                <div class="spec-lbl">7 Artisan Skills</div>
              </div>
              <div class="hero-spec-pill">
                <div class="spec-val" style="color:#c084fc;">200+ Relics</div>
                <div class="spec-lbl">Sets &amp; Runewords</div>
              </div>
            </div>
          </div>

          <!-- Right Column: Featured 1080p Trailer + Compact Audio Bar -->
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div class="gf-hero-media-frame">
              <div class="gf-hero-media-bar">
                <span>🎬 OFFICIAL DUAL LAUNCH REVEAL TRAILER</span>
                <a href="https://youtu.be/2e8E0vjLcLg" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:none; font-size:11px;">YouTube 1080p ↗</a>
              </div>
              <div style="position:relative; width:100%; aspect-ratio:16/9; background:#000;">
                <iframe
                  src="https://www.youtube.com/embed/2e8E0vjLcLg?rel=0&modestbranding=1"
                  title="GlimmerFall — Official Dual Launch Trailer"
                  style="position:absolute; inset:0; width:100%; height:100%; border:0;"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </div>
              <div style="padding:12px 16px; background:rgba(8,13,26,0.95); border-top:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:18px;">${activeOstTrack.icon}</span>
                  <div>
                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">REALM SOUNDTRACK &bull; ${activeOstTrack.bpm} BPM</div>
                    <div style="font-family:var(--font-header); font-size:13px; font-weight:800; color:#fff;">${this.escapeHtml(activeOstTrack.name)}</div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button type="button" class="gf-player-btn gf-player-btn-hero" style="padding:7px 14px; font-size:11px;" onclick="window._landing.toggleOstPlay()">
                    <span>${this.isOstPlaying ? '⏸ PAUSE OST' : '▶ PLAY OST'}</span>
                  </button>
                  <button type="button" class="id-mini-btn" style="padding:7px 11px; font-size:11px;" onclick="window._landing.setTab('theatre')">
                    12 Scenes ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. INTERACTIVE 4-FACTION COVENANT SWITCHER -->
      <section class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(250,204,21,0.14); color:#fde047; border:1px solid rgba(250,204,21,0.35);">
              FOUR ELEMENTAL COVENANTS &bull; FACTION-LOCKED ORDERS
            </span>
            <h2 class="section-heading">🏛️ CHOOSE YOUR CONTINENTAL ALLEGIANCE</h2>
          </div>
          <button type="button" class="hero-btn-secondary" style="padding:9px 16px; font-size:11.5px;" onclick="window._landing.setTab('forge')">
            Customize in Champion Forge ➔
          </button>
        </div>

        <div class="gf-covenant-tabs">
          ${Object.keys(FACTIONS_META).map((facKey) => {
            const f = FACTIONS_META[facKey];
            const elem = FACTION_ELEMENTS[facKey] || FACTION_ELEMENTS.Solari;
            const isSel = this.selectedFaction === facKey;
            return `
              <button type="button"
                      class="gf-covenant-tab"
                      style="${isSel ? `border-color:${f.color}; background:linear-gradient(145deg, ${f.color}22, rgba(8,13,26,0.95)); box-shadow:0 12px 30px ${f.color}25;` : ''}"
                      onclick="window._landing.setFaction('${facKey}')">
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                  <span style="font-family:var(--font-header); font-size:16px; font-weight:900; color:${f.color};">${f.icon} ${facKey}</span>
                  <span style="font-size:10px; font-weight:800; padding:2px 8px; border-radius:999px; background:rgba(0,0,0,0.45); color:${elem.badgeColor}; border:1px solid ${f.color}40;">${elem.element}</span>
                </div>
                <div style="font-size:12px; font-weight:700; color:#f8fafc;">${f.name}</div>
                <div style="font-size:11px; color:#94a3b8;">Click to inspect classes &amp; creed</div>
              </button>
            `;
          }).join('')}
        </div>

        <div class="gf-covenant-spotlight" style="border-color:${fm.color}55; box-shadow:inset 0 0 40px ${fm.color}12;">
          <div style="display:flex; flex-direction:column; justify-content:space-between; gap:18px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
                <span style="font-size:28px;">${fm.icon}</span>
                <div>
                  <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:${fm.color};">${fe.aspect}</div>
                  <h3 style="font-family:var(--font-header); font-size:24px; font-weight:900; color:#fff; margin:0;">${this.selectedFaction} — ${fm.name}</h3>
                </div>
              </div>
              <p style="font-size:14px; line-height:1.65; color:#cbd5e1; margin:0 0 16px;">${fm.desc}</p>

              <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                <span style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Allowed Order Tags:</span>
                ${covOrders.map((o) => `
                  <span style="padding:4px 10px; border-radius:8px; font-family:monospace; font-size:11.5px; font-weight:900; background:rgba(0,0,0,0.5); border:1px solid ${o.color}66; color:${o.color};">
                    [${o.tag}] ${o.name}
                  </span>
                `).join('')}
              </div>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:12px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">
              <button type="button" class="hero-btn-primary" style="background:linear-gradient(135deg, ${fm.color}, #ca8a04); color:#050811;" onclick="window._landing.setFaction('${this.selectedFaction}'); window._landing.setTab('forge');">
                <span>⚔️</span> Forge ${this.selectedFaction} Champion ➔
              </button>
              <button type="button" class="id-mini-btn" onclick="window._landing.setTab('armory')">
                <span>🛡️</span> Inspect ${this.selectedFaction} Relics
              </button>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px;">
              PLAYABLE ${this.selectedFaction.toUpperCase()} ARCHETYPES (${factionClasses.length})
            </div>
            ${factionClasses.map((c) => `
              <div style="padding:16px 18px; border-radius:16px; background:rgba(12,19,38,0.9); border:1px solid ${fm.color}40; display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <b style="font-family:var(--font-header); font-size:15px; color:#fff;">${c.name}</b>
                  <span style="font-size:10.5px; font-weight:800; color:${fm.color}; padding:2px 8px; border-radius:999px; background:${fm.color}18;">${c.role}</span>
                </div>
                <p style="font-size:12.5px; color:#cbd5e1; line-height:1.5; margin:0;">${c.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 3. CHOOSE YOUR EDITION (WANDERER PASS VS CANONICAL FOUNDER'S EDITION) -->
      <section class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(56,189,248,0.14); color:#7dd3fc; border:1px solid rgba(56,189,248,0.35);">
              INSTANT BROWSER ACCESS &bull; ZERO PAY-TO-WIN
            </span>
            <h2 class="section-heading">👑 CHOOSE YOUR EDITION</h2>
          </div>
          <span style="font-size:12px; color:#94a3b8;">Play free up to Level 10 or unlock the complete content forever</span>
        </div>

        <div class="gf-editions-grid">
          <div class="gf-edition-card">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#7dd3fc; padding:4px 10px; border-radius:999px; background:rgba(56,189,248,0.14); border:1px solid rgba(56,189,248,0.35);">
                  WANDERER'S TRIAL PASS
                </span>
                <span style="font-family:var(--font-header); font-size:26px; font-weight:900; color:#fff;">FREE</span>
              </div>
              <h3 style="font-family:var(--font-header); font-size:20px; color:#fff; margin:0 0 8px;">Instant Browser Trial</h3>
              <p style="font-size:13.5px; color:#94a3b8; line-height:1.6; margin:0 0 18px;">
                Jump straight into Sanctuary Haven and the 4 Faction Home Realms in your browser with zero download required.
              </p>
              <ul class="system-card-bullets" style="font-size:13px; color:#cbd5e1; gap:9px;">
                <li class="system-card-bullet"><span class="bullet-icon" style="color:#38bdf8;">✓</span><span>All 4 Elemental Covenants &amp; 8 Playable Classes</span></li>
                <li class="system-card-bullet"><span class="bullet-icon" style="color:#38bdf8;">✓</span><span>Character Progression up to <b>Level 10</b> &amp; Artisan Skills to <b>Lv. 30</b></span></li>
                <li class="system-card-bullet"><span class="bullet-icon" style="color:#38bdf8;">✓</span><span>Both Offline Singleplayer &amp; Stockholm Online Realm</span></li>
                <li class="system-card-bullet"><span class="bullet-icon" style="color:#38bdf8;">✓</span><span>30-Slot Sanctuary Bank Vault &amp; Friendly 1-HP Dueling</span></li>
              </ul>
            </div>
            <button type="button" class="hero-btn-secondary" style="width:100%;" onclick="window._landing.startJourney()">
              <span>⚡</span> LAUNCH FREE TRIAL NOW
            </button>
          </div>

          <div class="gf-edition-card founder">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#fde047; padding:4px 10px; border-radius:999px; background:rgba(250,204,21,0.18); border:1px solid rgba(250,204,21,0.5);">
                  ★ CANONICAL FOUNDER'S EDITION
                </span>
                <div style="text-align:right;">
                  <span style="font-family:var(--font-header); font-size:26px; font-weight:900; color:#facc15;">€6.99</span>
                  <div style="font-size:10px; color:#94a3b8; font-weight:700;">ONE-TIME LICENSE</div>
                </div>
              </div>
              <h3 style="font-family:var(--font-header); font-size:20px; color:#fff; margin:0 0 8px;">Complete Content Access</h3>
              <p style="font-size:13.5px; color:#cbd5e1; line-height:1.6; margin:0 0 18px;">
                Unlock every endgame biome, Grand Exchange trading, Level 99 Mastery Capes, and exclusive Founder cosmetics.
              </p>
              <ul class="system-card-bullets" style="font-size:13px; color:#f8fafc; gap:9px;">
                <li class="system-card-bullet"><span class="bullet-icon">★</span><span>Full <b>Level 30 Cap + Paragon 100</b> &amp; All 7 Skills to <b>Level 99 Mastery Capes</b></span></li>
                <li class="system-card-bullet"><span class="bullet-icon">★</span><span>Unlock Endgame Realms: <b>Starfall Crater, Abyssal Rift &amp; Chronocore Citadel</b></span></li>
                <li class="system-card-bullet"><span class="bullet-icon">★</span><span>Full <b>AetherSwap Grand Exchange</b> Orderbook &amp; Player-to-Player Trading</span></li>
                <li class="system-card-bullet"><span class="bullet-icon">★</span><span>Expanded <b>140-Slot Account Bank</b>, 3 Quick-Swap Build Presets &amp; <b>[FOUNDER]</b> Title</span></li>
              </ul>
            </div>
            <button type="button" class="hero-btn-primary" style="width:100%;" onclick="window._landing.setTab('forge')">
              <span>👑</span> FORGE FOUNDER CHAMPION
            </button>
          </div>
        </div>
      </section>

      <!-- 4. DEDICATED MASTER REALM JUKEBOX & 15-TRACK CATALOG -->
      <section class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(56,189,248,0.14); color:#7dd3fc; border:1px solid rgba(56,189,248,0.35);">
              HIGH-FIDELITY 48KHZ ORCHESTRAL SCORE
            </span>
            <h2 class="section-heading">🎼 MASTER REALM JUKEBOX &amp; OST CATALOG</h2>
          </div>
          <span style="font-size:12px; color:#94a3b8;">15 Original Zonal, Faction &amp; Boss Themes</span>
        </div>

        ${this.renderMediaPlayerSection(activeOstTrack)}
        ${this.renderTracklistSection(activeOstTrack)}
      </section>
    `;
  }

  renderTheatreTab({ activeCinematic }) {
    return `
      <!-- 1080P CINEMATICS THEATRE -->
      <section id="theatre" class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
              OFFICIAL 1080P MEDIA
            </span>
            <h2 class="section-heading">🎬 1080P CINEMATICS THEATRE</h2>
          </div>
          <div style="font-size:11px; color:#94a3b8;">
            12 High-Definition Story Scenes &bull; 4 Faction Awakenings
          </div>
        </div>

        <!-- Primary Large Cinematic Player -->
        <div class="theatre-main-card">
          <div class="theatre-main-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:14px;">🎬</span>
              <b style="font-size:12px; color:#fde047; font-family:var(--font-header);">CURRENT SCREENING: ${activeCinematic.title}</b>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" id="theatre-cinema-btn" class="id-mini-btn" style="font-size:10px; padding:4px 10px; border-color:#facc15; color:#fde047; cursor:pointer;" onclick="window.playCinematicModal && window.playCinematicModal('${activeCinematic.modalKey}')">
                ⛶ Fullscreen Cinema Mode
              </button>
            </div>
          </div>
          <div class="theatre-main-video-wrap">
            ${activeCinematic.youtubeId ? `
              <iframe
                id="theatre-main-iframe"
                src="https://www.youtube.com/embed/${activeCinematic.youtubeId}?autoplay=${this.isTheatreAutoplay ? '1' : '0'}&rel=0"
                title="${this.escapeHtml(activeCinematic.title)}"
                style="width:100%; height:100%; min-height:360px; border:0; aspect-ratio:16/9; display:block;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            ` : `
              <video
                id="theatre-main-video"
                src="${activeCinematic.url}"
                poster="${activeCinematic.poster || LOGO_SRC}"
                controls
                playsinline
                preload="metadata"
                class="theatre-main-video"
              ></video>
            `}
          </div>
          <div id="theatre-main-caption" class="theatre-main-caption">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <b style="color:#fde047; font-size:12px;">🎬 ${activeCinematic.title}</b>
              <span style="font-size:10px; color:#38bdf8; font-weight:bold;">${activeCinematic.category} &bull; ${activeCinematic.duration} &bull; 1080p Full HD</span>
            </div>
            <p style="margin-top:4px; font-size:11px; color:#cbd5e1; line-height:1.4;">${activeCinematic.desc}</p>
          </div>
          <div class="theatre-player-controls-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 14px; background:#070d1e; border-top:1px solid #1e293b;">
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button"
                      id="theatre-autoplay-btn"
                      class="id-mini-btn theatre-autoplay-btn ${this.isTheatreAutoplay ? 'active' : ''}"
                      style="font-size:10.5px; font-weight:800; padding:6px 12px; cursor:pointer; border-radius:6px; border:1px solid ${this.isTheatreAutoplay ? '#22e07b' : '#64748b'}; color:${this.isTheatreAutoplay ? '#86efac' : '#94a3b8'}; background:${this.isTheatreAutoplay ? 'rgba(34,224,123,0.2)' : 'transparent'}; transition:all 0.2s;"
                      onclick="window._landing.toggleTheatreAutoplay()">
                <span>${this.isTheatreAutoplay ? '🔁' : '▶️'}</span> AUTOPLAY: ${this.isTheatreAutoplay ? 'ON' : 'OFF'}
              </button>
              <button type="button" class="id-mini-btn" style="padding:5px 10px; font-size:10px; border-color:#38bdf8; color:#7dd3fc; cursor:pointer;" onclick="window._landing.advanceCinematic(-1, true)">
                ⏮️ Prev Clip
              </button>
              <button type="button" class="id-mini-btn" style="padding:5px 10px; font-size:10px; border-color:#38bdf8; color:#7dd3fc; cursor:pointer;" onclick="window._landing.advanceCinematic(1, true)">
                Next Clip ⏭️
              </button>
            </div>
            <div style="font-size:10px; color:#94a3b8; display:flex; align-items:center; gap:6px;">
              <span>Continues playing next clip automatically when finished</span>
            </div>
          </div>
        </div>

        <!-- Interactive 12 Scenes Grid -->
        <div style="margin-top:16px;">
          <div style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
            <span>SELECT SCENE TO SCREEN (12 CANONICAL CHAPTERS)</span>
            <span style="color:#38bdf8; font-size:10px;">CLICK CARD TO PLAY IN 1080P</span>
          </div>
          <div class="theatre-scenes-grid">
            ${LANDING_CINEMATICS.map((sc) => {
              const isSel = this.selectedCinematicId === sc.id;
              return `
                <div class="theatre-scene-card ${isSel ? 'active' : ''}"
                     data-scene="${sc.id}"
                     onclick="window._landing.selectCinematic('${sc.id}')">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px;">${sc.icon}</span>
                    <span style="font-size:9px; padding:2px 6px; border-radius:4px; font-weight:bold; background:#080e1c; border:1px solid #1e293b; color:#38bdf8;">${sc.category} &bull; ${sc.duration}</span>
                  </div>
                  <div style="font-family:var(--font-header); font-size:11.5px; font-weight:bold; color:#fff; margin-top:2px;">${sc.title}</div>
                  <div style="font-size:9.5px; color:#94a3b8; line-height:1.3; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${sc.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>
    `;
  }

  renderForgeTab({ fm, fe, cls, order, factionClasses, isSingle }) {
    return `
      <!-- CHARACTER FORGE SECTION -->
      <section id="forge" class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(242,169,0,0.15); color:#facc15; border:1px solid rgba(242,169,0,0.3);">
              FORGE IDENTITY
            </span>
            <h2 class="section-heading">⚔️ CHAMPION LOADOUT FORGE</h2>
          </div>
          <div style="font-size:11px; color:#94a3b8;">
            Customize moniker, faction allegiance &amp; archetype
          </div>
        </div>

        <div class="forge-layout-grid">
          <div class="forge-controls-col">
            <!-- Moniker Input -->
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase;">
                  1. CHAMPION MONIKER &amp; COGNOMEN
                </label>
                <span style="font-size:10px; color:#94a3b8;">${this.characterName.length}/18</span>
              </div>
              <div class="massive-input-wrap">
                <input
                  type="text"
                  class="massive-text-input"
                  maxlength="18"
                  value="${this.escapeHtml(this.characterName)}"
                  placeholder="Enter champion moniker..."
                  oninput="window._landing.characterName = this.value; const d = document.getElementById('pedestal-name-display'); if(d) d.textContent = this.value || 'Vanguard';"
                />
                <button type="button" class="btn-dice" onclick="window._landing.randomizeName()">
                  🎲 Random
                </button>
              </div>
            </div>

            <!-- Factions -->
            <div>
              <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:block;">
                2. CANONICAL FACTION ALLEGIANCE &bull; 4 ELEMENTAL ASPECTS
              </label>
              <div class="factions-cards-grid">
                ${Object.keys(FACTIONS_META).map((facKey) => {
                  const f = FACTIONS_META[facKey];
                  const elem = FACTION_ELEMENTS[facKey] || FACTION_ELEMENTS.Solari;
                  const isSel = this.selectedFaction === facKey;
                  return `
                    <div class="faction-select-card ${isSel ? 'active' : ''}"
                         style="${isSel ? `border-color:${f.color}; background:${f.color}18;` : ''}"
                         onclick="window._landing.setFaction('${facKey}')">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-family:var(--font-header); font-size:13px; font-weight:bold; color:${f.color};">
                          ${facKey}
                        </span>
                        <span style="font-size:14px;">${f.icon}</span>
                      </div>
                      <div style="font-size:10px; color:${elem.badgeColor}; font-weight:bold; margin-top:3px;">${elem.aspect}</div>
                      <div style="font-size:9.5px; color:#94a3b8; margin-top:2px;">${f.name}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Classes -->
            <div>
              <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:block;">
                3. PLAYABLE ARCHETYPE (${this.selectedFaction})
              </label>
              <div class="classes-cards-grid">
                ${factionClasses.map((c) => {
                  const isSel = this.selectedClassId === c.id;
                  return `
                    <div class="class-select-card ${isSel ? 'active' : ''}"
                         style="${isSel ? `border-color:${fm.color}; background:${fm.color}15;` : ''}"
                         onclick="window._landing.setClass('${c.id}')">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <span style="font-family:var(--font-header); font-size:13px; font-weight:bold; color:#fff;">${c.name}</span>
                        <span style="font-size:9.5px; padding:1px 6px; border-radius:4px; background:#080e1c; border:1px solid #1e293b; color:#94a3b8;">${c.defaultEquipment?.armor?.replace(/_/g, ' ') || 'Armor'}</span>
                      </div>
                      <div style="font-size:10.5px; font-weight:600; color:${fm.color}; margin-top:3px;">${c.role}</div>
                      <p style="font-size:10.5px; color:#cbd5e1; margin-top:6px; line-height:1.4;">${c.desc}</p>
                      <div style="display:flex; gap:8px; font-size:9.5px; color:#94a3b8; margin-top:8px;">
                        <span>🗡️ ${c.defaultEquipment?.weapon?.replace(/_/g, ' ') || 'Weapon'}</span>
                        <span>🛡️ ${c.defaultEquipment?.offhand?.replace(/_/g, ' ') || 'Shield'}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Order Heraldry -->
            <div>
              <label style="font-size:11px; font-weight:bold; color:#cbd5e1; text-transform:uppercase; margin-bottom:8px; display:block;">
                4. ORDER CREST &bull; HERALDRY
              </label>
              <div class="order-tags-row">
                ${getOrderPresetsForFaction(this.selectedFaction).map((o) => {
                  const isSel = this.selectedOrderTag === o.tag;
                  return `
                    <button type="button"
                            class="order-select-btn ${isSel ? 'active' : ''}"
                            style="${isSel ? `border-color:${o.color}; color:${o.color};` : ''}"
                            onclick="window._landing.setOrder('${o.tag}')">
                      <div style="font-family:monospace; font-weight:900; font-size:11px;">[${o.tag}] ${o.emblem || ''}</div>
                      <div style="font-size:9.5px; color:#94a3b8;">${o.name}</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Pedestal Column -->
          <div class="forge-pedestal-col">
            <div class="pedestal-sticky-card">
              <div style="font-size:9.5px; color:#94a3b8; font-weight:bold; text-transform:uppercase; letter-spacing:0.6px;">
                VISAGE PREVIEW
              </div>
              <div class="pedestal-avatar-circle">
                ⚔️
              </div>
              <div id="pedestal-name-display" class="pedestal-name-txt">
                ${this.escapeHtml(this.characterName || 'Vanguard')}
              </div>
              <div style="font-size:11px; color:#38bdf8; font-weight:600; margin-top:2px;">
                [${order.tag}] &bull; ${cls.name}
              </div>
              <div style="font-size:10.5px; color:${fm.color}; font-weight:bold; margin-top:2px;">
                ${fm.name} (${fe.aspect})
              </div>

              <div class="pedestal-vitals-grid">
                <div class="pedestal-vital-box">
                  <div style="font-size:9.5px; color:#94a3b8; font-weight:bold;">HEALTH</div>
                  <div style="color:#4ade80; font-weight:bold; font-size:12px;">❤️ 40 / 40 HP</div>
                </div>
                <div class="pedestal-vital-box">
                  <div style="font-size:9.5px; color:#94a3b8; font-weight:bold;">GLIMMER</div>
                  <div style="color:#38bdf8; font-weight:bold; font-size:12px;">🔮 100 Glimmer</div>
                </div>
              </div>

              <button type="button" class="sidebar-cta-btn" style="padding:14px; font-size:12px;" onclick="window._landing.launchGame()">
                ⚡ ENTER WORLD WITH CHAMPION
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderSystemsTab() {
    return `
      <!-- CORE GAMEPLAY SYSTEMS SHOWCASE -->
      <section id="systems" class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3);">
              CORE GAMEPLAY ARCHITECTURE
            </span>
            <h2 class="section-heading">⚙️ CONTINENTAL GAMEPLAY SYSTEMS</h2>
          </div>
          <div style="font-size:11px; color:#94a3b8;">
            Real-Time Combat &bull; 7 Disciplines &bull; 3-Socket Runewords &bull; 2% Economy
          </div>
        </div>

        <div class="systems-showcase-grid">
          ${SYSTEMS_SHOWCASE.map((sys) => `
            <div class="system-feature-card" style="border-left:4px solid ${sys.color};">
              <div class="system-card-header">
                <div class="system-card-title" style="color:${sys.color};">
                  <span>${sys.icon}</span>
                  <span>${sys.title}</span>
                </div>
                <span class="system-card-badge" style="background:${sys.badgeColor}18; color:${sys.badgeColor}; border-color:${sys.badgeColor}40;">
                  ${sys.badge}
                </span>
              </div>
              <p class="system-card-desc">${sys.desc}</p>
              <ul class="system-card-bullets">
                ${sys.bullets.map((b) => `
                  <li class="system-card-bullet">
                    <span class="bullet-icon">▸</span>
                    <span>${b}</span>
                  </li>
                `).join('')}
              </ul>
              ${sys.id === 'runewords' ? `
                <div class="runeword-badge-row">
                  <span style="font-size:9px; color:#94a3b8; font-weight:bold;">Example Runewords:</span>
                  <span class="runeword-rune-pill">SOL-UM-TER</span>
                  <span class="runeword-rune-pill">AETH-AETH-SOL</span>
                  <span class="runeword-rune-pill">TER-TER-UM</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </section>

      <!-- GAME SYSTEMS ENCYCLOPEDIA -->
      <section id="game-encyclopedia" class="landing-section-box" style="margin-top:20px;">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
              DEEP ENCYCLOPEDIA
            </span>
            <h2 class="section-heading">🎮 GAME SYSTEMS ENCYCLOPEDIA</h2>
          </div>
          <div class="enc-tab-strip">
            <button type="button" class="enc-switch-btn ${this.gameEncSection === 'combat' ? 'active' : ''}" onclick="window._landing.setGameEncSection('combat')">
              ⚔️ Combat Dynamics
            </button>
            <button type="button" class="enc-switch-btn ${this.gameEncSection === 'economy' ? 'active' : ''}" onclick="window._landing.setGameEncSection('economy')">
              💰 Economy &amp; Trade
            </button>
            <button type="button" class="enc-switch-btn ${this.gameEncSection === 'resources' ? 'active' : ''}" onclick="window._landing.setGameEncSection('resources')">
              ⚡ 4 Faction Resources
            </button>
            <button type="button" class="enc-switch-btn ${this.gameEncSection === 'disciplines' ? 'active' : ''}" onclick="window._landing.setGameEncSection('disciplines')">
              🎯 7 Disciplines (Lv. 99)
            </button>
            <button type="button" class="enc-switch-btn ${this.gameEncSection === 'persistence' ? 'active' : ''}" onclick="window._landing.setGameEncSection('persistence')">
              💾 State Persistence
            </button>
          </div>
        </div>

        <div class="enc-body-wrapper">
          ${this.renderGameEncSection()}
        </div>
      </section>
    `;
  }

  setArmorySlotFilter(slot) {
    this.armorySlotFilter = slot || 'all';
    if (this.isOpen) this.render();
  }

  setArmorySearch(q) {
    this.armorySearch = String(q || '');
    if (this.isOpen) this.render();
  }

  renderArmoryTab({ hoveredItemObj }) {
    const allEquipment = Object.values(EQUIPMENT_CATALOG || {}).filter((item) => item && item.id);
    const gearItems = allEquipment.filter((item) => {
      if (!['currency', 'consumable', 'material'].includes(item.slot)) return true;
      return false;
    });
    const filterGroups = [
      { id: 'all', label: `All Gear (${gearItems.length})` },
      { id: 'weapon', label: 'Weapons' },
      { id: 'body', label: 'Armor / Body' },
      { id: 'head', label: 'Head' },
      { id: 'shield', label: 'Shield / Offhand' },
      { id: 'legs', label: 'Legs' },
      { id: 'accessories', label: 'Capes, Rings & Gear' },
      { id: 'socket_gem', label: 'Gems & Runes' },
      { id: 'keystone', label: 'Keystones' },
    ];
    const query = (this.armorySearch || '').trim().toLowerCase();
    const filteredGear = gearItems.filter((item) => {
      const f = this.armorySlotFilter || 'all';
      if (f === 'body' && item.slot !== 'body' && item.slot !== 'armor') return false;
      else if (f === 'shield' && item.slot !== 'shield' && item.slot !== 'offhand') return false;
      else if (f === 'accessories' && !['cape', 'neck', 'hands', 'feet', 'ring', 'ammo'].includes(item.slot)) return false;
      else if (f !== 'all' && f !== 'body' && f !== 'shield' && f !== 'accessories' && item.slot !== f) return false;
      if (query) {
        const hay = `${item.name || ''} ${item.rarity || ''} ${item.slot || ''} ${item.desc || ''} ${item.setId || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    const formatGearStats = (item) => {
      const parts = [];
      if (item.stats && typeof item.stats === 'object') {
        if (item.stats.atk) parts.push(`+${item.stats.atk} ATK`);
        if (item.stats.def) parts.push(`+${item.stats.def} DEF`);
        if (item.stats.mag) parts.push(`+${item.stats.mag} MAG`);
        if (item.stats.spd) parts.push(`+${item.stats.spd} SPD`);
        if (item.stats.hp) parts.push(`+${item.stats.hp} HP`);
        if (item.stats.glimmer) parts.push(`+${item.stats.glimmer} Glimmer`);
        if (item.stats.crit) parts.push(`+${item.stats.crit}% Crit`);
      }
      if (item.attack) parts.push(`+${item.attack} ATK`);
      if (item.defense) parts.push(`+${item.defense} DEF`);
      if (item.hpBonus) parts.push(`+${item.hpBonus} HP`);
      if (item.critBonus) parts.push(`+${item.critBonus}% Crit`);
      return parts.length ? parts.join(' • ') : `${String(item.slot || 'gear').toUpperCase()} SLOT`;
    };

    const setsList = Object.values(CANONICAL_SETS || {});
    const runewordsList = Object.values(RUNEWORD_SYNERGIES || {});

    return `
      <!-- CONTINENTAL ARMORY -->
      <section id="armory" class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3);">
              COMPLETE EQUIPMENT CATALOG (${gearItems.length} ITEMS)
            </span>
            <h2 class="section-heading">🛡️ CONTINENTAL ARMORY &amp; RELICS</h2>
          </div>
          <span style="font-size:11px; color:#94a3b8;">11 Paperdoll Slots &bull; ${setsList.length} Sets &bull; ${runewordsList.length} Runewords</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:12px;">
          <input type="text"
                 value="${this.armorySearch.replace(/"/g, '&quot;')}"
                 oninput="window._landing && window._landing.setArmorySearch(this.value)"
                 placeholder="Search all ${gearItems.length} gear, sets, gems..."
                 style="background:#080e1c; color:#e2e8f0; border:1px solid #334155; border-radius:4px; padding:5px 9px; font-size:11px; min-width:210px; outline:none;" />
          ${filterGroups.map((g) => `
            <button type="button"
                    class="gf-filter-btn ${this.armorySlotFilter === g.id ? 'active' : ''}"
                    onclick="window._landing && window._landing.setArmorySlotFilter('${g.id}')">
              ${g.label}
            </button>
          `).join('')}
        </div>

        <div class="armory-items-catalog" style="max-height:540px; overflow-y:auto; padding-right:4px;">
          ${filteredGear.length ? filteredGear.map((item) => {
            const rColor = getRarityColor(item.rarity);
            const iconUrl = typeof document !== 'undefined' ? getItemIconDataUrl(item.id, 32) : '';
            return `
              <div class="armory-catalog-card">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; background:#080e1c; border-radius:8px; border:1px solid ${rColor}55;">
                    ${iconUrl ? `<img src="${iconUrl}" width="32" height="32" alt="${item.name}" style="image-rendering:pixelated;" />` : `<span style="font-size:20px;">${item.icon || '⚔️'}</span>`}
                  </span>
                  <span style="font-size:9px; padding:2px 6px; border-radius:4px; font-weight:bold; background:${rColor}20; color:${rColor}; text-align:right;">${item.rarity || 'Common'}</span>
                </div>
                <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#fff; margin-top:8px;">${item.name}</div>
                <div style="font-size:9.5px; color:#94a3b8; text-transform:uppercase; margin-top:1px;">${item.slot}${item.reqLevel ? ` • Lv.${item.reqLevel}` : ''}</div>
                <div style="font-size:10.5px; font-weight:bold; color:#38bdf8; margin-top:3px;">${formatGearStats(item)}</div>
                <p style="font-size:10px; color:#cbd5e1; margin-top:5px; line-height:1.4;">${item.desc || ''}</p>
              </div>
            `;
          }).join('') : `<div style="color:#94a3b8; font-size:12px; padding:16px;">No gear matched your filter.</div>`}
        </div>

        ${setsList.length ? `
          <div style="margin-top:18px; border-top:1px solid #1e293b; padding-top:14px;">
            <div style="font-family:var(--font-header); font-size:12px; color:#facc15; margin-bottom:8px;">✦ CANONICAL FACTION SETS (4-PIECE BONUSES)</div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:8px;">
              ${setsList.map((s) => `
                <div style="background:#080e1c; border:1px solid #334155; border-radius:6px; padding:9px 11px;">
                  <div style="font-weight:bold; font-size:11.5px; color:#fde047;">${s.name}</div>
                  <div style="font-size:10px; color:#cbd5e1; margin-top:3px; line-height:1.4;">${s.perk || s.desc || ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${runewordsList.length ? `
          <div style="margin-top:14px; border-top:1px solid #1e293b; padding-top:14px;">
            <div style="font-family:var(--font-header); font-size:12px; color:#c084fc; margin-bottom:8px;">🔮 ANCIENT LEYLINE RUNEWORDS (3-SOCKET SYNERGIES)</div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:8px;">
              ${runewordsList.map((rw) => `
                <div style="background:#080e1c; border:1px solid #4c1d95; border-radius:6px; padding:9px 11px;">
                  <div style="font-weight:bold; font-size:11.5px; color:#e9d5ff;">${rw.name}</div>
                  <div style="font-size:9.5px; color:#38bdf8; margin-top:2px;">${(rw.runes || []).join(' + ')}</div>
                  <div style="font-size:10px; color:#cbd5e1; margin-top:3px; line-height:1.4;">${rw.desc || rw.bonusText || ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </section>

      <!-- AUTHENTIC TCG CARDS SECTION -->
      <section id="tcg-cards" class="landing-section-box" style="margin-top:20px;">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
              glimmerfalltcg.com INTEGRATION
            </span>
            <h2 class="section-heading">🃏 AUTHENTIC TCG CARD RELICS</h2>
          </div>
          <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="font-size:11px; color:#38bdf8; text-decoration:underline; font-weight:bold;">
            Explore glimmerfalltcg.com ↗
          </a>
        </div>

        <p style="font-size:12px; color:#cbd5e1; margin-bottom:14px; line-height:1.5;">
          Authentic trading card relics sourced directly from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>. Socket these rare physical card relics into your MMORPG champion's weapon and armor sockets for unique combat bonuses and active synergies.
        </p>

        <div class="tcg-deck-grid">
          ${[
            { name: 'Solari Vanguard', stat: '+15% Radiant Slash Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
            { name: 'Dawnblade Templar', stat: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
            { name: 'Mana Crystal', stat: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
            { name: 'Granite Behemoth', stat: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
            { name: 'Void Stalker', stat: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
            { name: 'Chronocore Prism', stat: 'World Nexus Monolith (2500 HP Rule • Last Hit)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
          ].map((c) => `
            <div class="tcg-card-item">
              <img src="${c.img}" alt="${c.name}" class="tcg-card-img" onerror="this.style.display='none'" />
              <div>
                <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#fff;">${c.name}</div>
                <div style="font-size:10.5px; font-weight:bold; color:#38bdf8; margin-top:2px;">${c.stat}</div>
                <span style="font-size:9px; color:#4ade80; font-weight:bold; display:block; margin-top:2px;">Socketable TCG Relic</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  renderAtlasTab() {
    return `
      <!-- WORLD ATLAS -->
      <section id="atlas" class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
              SEAMLESS TRAVERSAL
            </span>
            <h2 class="section-heading">🗺️ CONTINENTAL REALMS ATLAS</h2>
          </div>
          <span style="font-size:11px; color:#94a3b8;">8 Interconnected Biomes</span>
        </div>

        <div class="atlas-realms-grid">
          ${[
            { name: 'Sanctuary Haven', tag: 'Neutral Hub', color: '#facc15', desc: 'Central city housing the Grand Exchange pavilion, AetherVault banks, and artisans.' },
            { name: 'Solari Citadel', tag: 'Sunspire Territory', color: '#facc15', desc: 'Marble sun-temples harvesting celestial dawn radiation.' },
            { name: 'Umbri Undercity', tag: 'Duskveil Syndicate', color: '#c084fc', desc: 'Subterranean obsidian caverns lit by violet graveglass lanterns.' },
            { name: 'Glimmer Orchard', tag: 'Rootdeep Collective', color: '#4ade80', desc: 'Towering ancient trees with sentient moss and stonekin elders.' },
            { name: 'Mirrorgate Spire', tag: 'Astral Conclave', color: '#38bdf8', desc: 'Floating crystal pinnacles bending temporal currents.' },
            { name: 'Starfall Crater', tag: 'Warzone PvPvE', color: '#f87171', desc: 'Impact site where all 4 factions clash over primal leyline shards.' },
            { name: 'Abyssal Rift', tag: 'High-Level Dungeon', color: '#a855f7', desc: 'Endgame chasm where elite void abominations and corrupted keystones lurk.' },
            { name: 'Nexus Warzone', tag: '3v3 Monolith Arena', color: '#ef4444', desc: 'Mirror-symmetric tactical battleground defending 2500-HP Chronocore Monoliths.' },
          ].map((r) => `
            <div class="enc-article-card" style="border-left:3px solid ${r.color};">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <b style="color:#fff;">${r.name}</b>
                <span style="color:${r.color}; font-size:9.5px; font-weight:bold;">${r.tag}</span>
              </div>
              <p style="color:#cbd5e1; font-size:11px;">${r.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 3v3 ARENA -->
      <section id="arena" class="landing-section-box" style="margin-top:20px; border-color:rgba(248,113,113,0.3); background:radial-gradient(circle at 50% 50%, #150a0a, #070404);">
        <div class="section-header-row" style="border-color:rgba(248,113,113,0.2);">
          <div>
            <span class="section-tag" style="background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.3);">
              RATED COMPETITIVE
            </span>
            <h2 class="section-heading">⚡ 3v3 OUTPOST NEXUS DESTRUCTION</h2>
          </div>
          <span style="font-family:monospace; font-weight:bold; color:#f87171; font-size:12px;">2500-HP MONOLITH RULE</span>
        </div>

        <div class="arena-feature-grid">
          <div class="enc-article-card">
            <h4 style="color:#f87171;">1. Squad Lineups</h4>
            <p>Clash in mirror-symmetric coliseums. Frontline tanks guard the lane while marshals provide radiance shields.</p>
          </div>
          <div class="enc-article-card">
            <h4 style="color:#f87171;">2. 2500-HP Monolith Rule (Last-Hit Wins)</h4>
            <p>Every team defends their 2500-HP Outpost Nexus. Coordinate burst rotations and deliver the fatal last hit to claim match victory and kill credit.</p>
          </div>
          <div class="enc-article-card">
            <h4 style="color:#f87171;">3. Safe Return Teleport</h4>
            <p>Upon match completion, you are automatically returned to your exact pre-arena world position with all bounties preserved.</p>
          </div>
        </div>
      </section>

      <!-- WORLD LORE & CHRONICLE -->
      <section id="lore-chronicle" class="landing-section-box" style="margin-top:20px;">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(155,48,255,0.15); color:#c084fc; border:1px solid rgba(155,48,255,0.3);">
              CANONICAL UNIVERSE LORE
            </span>
            <h2 class="section-heading">📜 WORLD LORE &amp; CHRONICLE</h2>
          </div>
          <div class="enc-tab-strip">
            <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'shattering' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('shattering')">
              🌌 Chapter I: The Shattered Crystal Heart
            </button>
            <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'creeds' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('creeds')">
              🏛️ Chapter II: 4 Faction Creeds
            </button>
            <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'cards' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('cards')">
              🃏 TCG Card Relics
            </button>
            <button type="button" class="enc-switch-btn lore ${this.loreEncSection === 'stasis' ? 'active' : ''}" onclick="window._landing.setLoreEncSection('stasis')">
              📜 Chapter III: Stasis Awakening
            </button>
          </div>
        </div>

        <div class="enc-body-wrapper">
          ${this.renderLoreEncSection()}
        </div>
      </section>
    `;
  }

  renderSettingsTab({ isSingle, startOnLoadout }) {
    return `
      <!-- SETTINGS & CONFIGURATION -->
      <section id="settings" class="landing-section-box">
        <div class="section-header-row">
          <div>
            <span class="section-tag" style="background:rgba(242,169,0,0.15); color:#facc15; border:1px solid rgba(242,169,0,0.3);">
              PREFERENCES &amp; DISPLAY
            </span>
            <h2 class="section-heading">⚙️ SETTINGS &amp; CONFIGURATION</h2>
          </div>
          <span style="font-size:11px; color:#94a3b8;">Stored Locally in Browser</span>
        </div>

        <div class="settings-grid">
          <div class="settings-card">
            <h4 style="color:#facc15; font-family:var(--font-header); font-size:13px; margin-bottom:8px;">🎮 Startup &amp; Audio</h4>

            <div class="settings-toggle-row">
              <div>
                <b style="color:#fff; font-size:11.5px; display:block;">Start on this site (Hero Loadout)</b>
                <span style="font-size:10px; color:#94a3b8;">Skip marketing landing page and launch directly into character loadout on visit.</span>
              </div>
              <label class="sidebar-pref-toggle" style="margin:0;">
                <input type="checkbox"
                       class="start-on-site-cb"
                       ${startOnLoadout ? 'checked' : ''}
                       onchange="window._landing.setStartOnLoadout(this.checked)" />
              </label>
            </div>

            <div class="settings-toggle-row">
              <div>
                <b style="color:#fff; font-size:11.5px; display:block;">Sound Effects Audio</b>
                <span style="font-size:10px; color:#94a3b8;">Synthesizer click audio, spell feedback, and launch fanfares.</span>
              </div>
              <button type="button"
                      class="enc-switch-btn ${this.soundEnabled ? 'active' : ''}"
                      style="padding:5px 12px; font-size:10.5px;"
                      onclick="window._landing.toggleSound()">
                ${this.soundEnabled ? '🔊 Enabled' : '🔇 Muted'}
              </button>
            </div>

            <div class="settings-toggle-row">
              <div>
                <b style="color:#fff; font-size:11.5px; display:block;">Default Play Mode</b>
                <span style="font-size:10px; color:#94a3b8;">Choose Offline Singleplayer or Online Multiplayer.</span>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button"
                        class="sidebar-mode-btn ${isSingle ? 'active single' : ''}"
                        style="margin:0; padding:4px 8px;"
                        onclick="window._landing.setPlayMode('singleplayer')">
                  🕹️ Offline
                </button>
                <button type="button"
                        class="sidebar-mode-btn ${!isSingle ? 'active multi' : ''}"
                        style="margin:0; padding:4px 8px;"
                        onclick="window._landing.setPlayMode('multiplayer')">
                  🌐 Online
                </button>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <h4 style="color:#38bdf8; font-family:var(--font-header); font-size:13px; margin-bottom:8px;">🖥️ Engine &amp; Display Specs</h4>
            <div style="display:flex; flex-direction:column; gap:8px; font-size:11px;">
              <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                <span style="color:#cbd5e1;">Rendering Pipeline:</span>
                <b style="color:#fff;">HD Pixel Anti-Aliased Canvas</b>
              </div>
              <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                <span style="color:#cbd5e1;">Network Sync:</span>
                <b style="color:#4ade80;">Authoritative Real-Time Sync</b>
              </div>
              <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                <span style="color:#cbd5e1;">Artisan Cadence:</span>
                <b style="color:#facc15;">1.25s Crystalheart Cooldown</b>
              </div>
              <div style="display:flex; justify-content:space-between; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                <span style="color:#cbd5e1;">Action Bar Dock:</span>
                <b style="color:#38bdf8;">Persistent Viewport Center Dock</b>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderGameEncSection() {
    switch (this.gameEncSection) {
      case 'economy':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card" style="border-left:4px solid #facc15;">
              <h4 style="color:#facc15;">🪙 AetherSwap Continental Orderbook</h4>
              <p>Place buy and sell limit orders on the centralized exchange. Automatic trade matching executes instantaneously across continental players with full trade history.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #f87171;">
              <h4 style="color:#f87171;">🔥 2% Macroeconomic Tariff Sink</h4>
              <p>Every transaction burns a flat 2% gold tariff from the buyer and seller. This permanent currency sink controls inflation and stabilizes the economy across server ticks.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">🤝 Anti-Scam Dual Player Trading</h4>
              <p>Trade gear and gold directly with nearby adventurers. Requires mutual offer placement and locked dual confirmations so you never lose items to quick swaps.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">⚔️ 1-HP Surrender Friendly Dueling</h4>
              <p>Challenge any player to a friendly duel with a 3-second countdown. The duel automatically ends at 1 HP with surrender protection, so you never suffer death penalties.</p>
            </div>
          </div>
        `;

      case 'disciplines':
        return `
          <div class="enc-cards-grid">
            ${DISCIPLINES.map((d) => `
              <div class="enc-article-card" style="border-left:4px solid ${d.color};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <h4 style="color:${d.color};">${d.icon} ${d.name}</h4>
                  <span style="font-size:10px; font-weight:bold; color:${d.color}; background:#080e1c; padding:2px 6px; border:1px solid #1e293b; border-radius:4px;">Lv. ${d.lvl}/99</span>
                </div>
                <div class="sidebar-skill-bar-wrap" style="margin:6px 0 8px;">
                  <div class="sidebar-skill-bar-fill" style="width:${(d.lvl / 99) * 100}%; background:${d.color};"></div>
                </div>
                <p style="font-size:10.5px; color:#cbd5e1;">Master this discipline through world node extraction, artisan crafting recipes, and unlock level-99 continental mastery capes.</p>
              </div>
            `).join('')}
          </div>
        `;

      case 'resources':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card" style="border-left:4px solid #facc15;">
              <h4 style="color:#facc15;">☀️ Solari: Solar Charge &bull; Zenith State (Solar Light / Gold)</h4>
              <p>Striking targets builds Solar Charge (0-100). Reaching 100 unlocks the blinding Zenith State, boosting movement speed, granting holy radiance bursts, and resetting Solar Flare cooldowns.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">🌙 Umbri: Void Resonance &bull; Dusk Shroud (Void / Amethyst)</h4>
              <p>Harnessing nether spells builds Void Resonance. Consuming resonance cloaks the assassin in Dusk Shroud, dropping enemy targeting and granting guaranteed critical strikes.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">🌿 Terra: Root Armor &bull; Bramble Retaliation (Verdant Root / Emerald)</h4>
              <p>Absorbing damage weaves living root bark around the champion. Shattering Root Armor roots surrounding enemies and releases thorn shockwaves.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">🌀 Aether: Chronoflux &bull; Temporal Acceleration (Celestial Mist / Cyan)</h4>
              <p>Chronoflux bends the dimensional lattice. Manipulating flux accelerates cooldown recovery, warps projectile vectors, and rewinds positioning.</p>
            </div>
          </div>
        `;

      case 'persistence':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">❤️ Exact Health &amp; Glimmer Persistence</h4>
              <p>Logging out or disconnecting preserves your exact current HP and Glimmer (Solar Charge) down to the single integer. Returning to the realm never resets your vitals.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">🏛️ Exact World Coordinate Resuming</h4>
              <p>Your coordinates (roomType, X, Y) are permanently committed to browser storage and PostgreSQL. You always spawn right where you stepped out of the world.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#facc15;">🛡️ Clean Monster Respawn &amp; Aggro Wipe</h4>
              <p>Respawning creatures enforce a 2.0-second spawn grace period. Aggro tethers, dammer lists, and combat targets are wiped completely clean upon respawn.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#c084fc;">⚡ 3v3 Arena Safe Return Teleport</h4>
              <p>Match conclusion automatically teleports players back to their exact pre-arena coordinates, depositing bounty trophies straight into their inventory.</p>
            </div>
          </div>
        `;

      case 'combat':
      default:
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card">
              <h4 style="color:#facc15;">🗡️ Attack Cleave Arcs &amp; Hitboxes</h4>
              <p>Melee strikes cover a 90-degree front arc extending 34 pixels. Projectiles track directional vectors with 16px radius hit detection, fully client-predicted.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#38bdf8;">⏱️ 1.5s Global Cooldown &amp; Spell Queuing</h4>
              <p>All casted Rites and instant Flashes obey a 1.5s GCD. If an ability is pressed within 0.3s of GCD completion, it is queued automatically for zero-lag combos.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#4ade80;">🛡️ Hyperbolic Armor Mitigation</h4>
              <p>Physical attacks undergo hyperbolic reduction: <code>Damage Reduction = Armor / (Armor + 100)</code>. Heavy plate achieves up to 65% passive mitigation.</p>
            </div>
            <div class="enc-article-card">
              <h4 style="color:#c084fc;">💥 Critical Multipliers &amp; Flashes</h4>
              <p>Base critical strikes inflict 150% damage. Investing in the Flashes skill and socketing TCG relics elevates critical chance by up to +12% and damage beyond 220%.</p>
            </div>
          </div>
        `;
    }
  }

  renderLoreEncSection() {
    switch (this.loreEncSection) {
      case 'creeds':
        return `
          <div class="enc-cards-grid">
            <div class="enc-article-card" style="border-left:4px solid #facc15;">
              <h4 style="color:#facc15;">The Sunspire Dominion &bull; "May the Sunspire illuminate the darkness"</h4>
              <div style="font-size:10px; color:#facc15; font-weight:bold; margin-bottom:4px;">Aspect: Solar Light / Gold</div>
              <p>Devout sentinels worshipping the Daystar and channeling the dawn-fire facets of the Crystal Heart. Constructing golden Sunspires to channel radiant energy, they burn away void corruption with steadfast faith and Zenith empowerment.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #c084fc;">
              <h4 style="color:#c084fc;">The Duskveil Syndicate &bull; "In shadows we weave, in silence we strike"</h4>
              <div style="font-size:10px; color:#c084fc; font-weight:bold; margin-bottom:4px;">Aspect: Void / Amethyst</div>
              <p>Subterranean reapers operating from the Umbri Undercity who bound the shadow facets. Reaping void resonance through Graveglass Lanterns, they capture escaping souls as dark weapons and strike unseen from Dusk Shroud.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #4ade80;">
              <h4 style="color:#4ade80;">The Rootdeep Collective &bull; "Stand unyielding as ancient stone"</h4>
              <div style="font-size:10px; color:#4ade80; font-weight:bold; margin-bottom:4px;">Aspect: Verdant Root / Emerald</div>
              <p>Dwelling beneath the giant canopies of Glimmer Orchard, they commune with ancient stone and the ironwood facets. Defending planetary leylines from reckless exploitation, they crush enemies with Overwhelm and Thornbark reflect.</p>
            </div>
            <div class="enc-article-card" style="border-left:4px solid #38bdf8;">
              <h4 style="color:#38bdf8;">The Astral Conclave &bull; "Time and space bend to the arcane truth"</h4>
              <div style="font-size:10px; color:#38bdf8; font-weight:bold; margin-bottom:4px;">Aspect: Celestial Mist / Cyan</div>
              <p>Scholars of the Mirrorgate Spire harnessing the celestial mist and chronoflux facets. Viewing all moments as a vast harmonic lattice, they manipulate temporal frequencies to accelerate cooldowns, echo spell rites, and rewrite cause and effect.</p>
            </div>
          </div>
        `;

      case 'cards':
        return `
          <div style="margin-bottom:10px; font-size:11px; color:#cbd5e1;">
            Authentic trading card relics sourced from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:bold;">glimmerfalltcg.com</a>. Socket these into your champion's gear for passive traits.
          </div>
          <div class="tcg-deck-grid">
            ${[
              { name: 'Solari Vanguard', stat: '+15% Radiant Slash Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
              { name: 'Dawnblade Templar', stat: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
              { name: 'Mana Crystal', stat: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
              { name: 'Granite Behemoth', stat: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
              { name: 'Void Stalker', stat: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
              { name: 'Chronocore Prism', stat: 'World Nexus Monolith (2500 HP Rule • Last Hit)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
            ].map((c) => `
              <div class="tcg-card-item">
                <img src="${c.img}" alt="${c.name}" class="tcg-card-img" onerror="this.style.display='none'" />
                <div>
                  <div style="font-family:var(--font-header); font-weight:bold; font-size:12px; color:#fff;">${c.name}</div>
                  <div style="font-size:10px; font-weight:bold; color:#38bdf8; margin-top:2px;">${c.stat}</div>
                  <span style="font-size:9px; color:#4ade80; font-weight:bold; display:block; margin-top:2px;">Socketable TCG Relic</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;

      case 'stasis':
      case 'legends':
        return `
          <div class="enc-article-card" style="padding:22px; border-left:4px solid #38bdf8;">
            <div style="font-size:10px; color:#38bdf8; font-weight:bold; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:4px;">
              CHAPTER III • STASIS AWAKENING
            </div>
            <h4 style="color:#38bdf8; font-size:15px; margin-bottom:8px; font-family:var(--font-header);">
              Awakening from Stasis in Sanctuary Haven
            </h4>
            <p style="font-size:12px; line-height:1.6; color:#cbd5e1; margin-bottom:8px;">
              Sealed in crystalline stasis since the Shattering, you awaken in the heart of Sanctuary Haven as a Summoner-Knight. Under the guidance of <b>Herald Lyra</b> and <b>Commander Valerius</b>, you re-learn the ancient martial arts, channel raw Glimmer fonts [E], and master the 1.25s cadence at Master Artisan Aldric's forge.
            </p>
            <p style="font-size:12px; line-height:1.6; color:#94a3b8;">
              Beyond the gates lie the contested zones: Starfall Crater, the Abyssal Rift, and the 3v3 Outpost Nexus arenas. Arm yourself with socketed gear, assemble your 3-player squad [O], and reforge the balance of GlimmerFall!
            </p>
          </div>
        `;

      case 'shattering':
      default:
        return `
          <div class="enc-article-card" style="padding:22px; border-left:4px solid #facc15;">
            <div style="font-size:10px; color:#facc15; font-weight:bold; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:4px;">
              CHAPTER I • COSMIC ORIGIN &amp; THE FALL
            </div>
            <h4 style="color:#facc15; font-size:15px; margin-bottom:8px; font-family:var(--font-header);">
              The Shattered Crystal Heart &amp; The Great Glimmer Fracture
            </h4>
            <p style="font-size:12.5px; line-height:1.6; color:#cbd5e1; margin-bottom:12px;">
              Before the continental caldera took shape, cosmic reality hung in perfect equilibrium between the radiant Golden Sun and the deep Abyssal Void. At the exact nexus of these primordial forces beat a solitary celestial organ: the <b>Crystal Heart</b>—an iridescent, multi-faceted anatomical heart glowing with pure rainbow prismatic light.
            </p>
            <p style="font-size:12.5px; line-height:1.6; color:#cbd5e1; margin-bottom:12px;">
              As cosmic tensions escalated, violent purple lightning fissures ruptured across the crystalline chambers. In an apocalyptic detonation known as the <b>Crystalheart Shattering</b>, the Crystal Heart shattered into a rain of flaming iridescent meteor shards that forged our continent. With the Heart destroyed, the unified white Glimmer fractured into the four elemental aspects:
            </p>

            <!-- 1080p Video Embed: Crystal Heart Shattering -->
            <div style="margin:14px 0; border-radius:10px; overflow:hidden; border:2px solid rgba(250,204,21,0.5); box-shadow:0 0 25px rgba(250,204,21,0.2), 0 8px 30px rgba(0,0,0,0.8); background:#040711;">
              <video
                src="https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/crystal_heart_shattering_1080p.mp4"
                poster="/GlimmerFall_official_multicolor_logo.png"
                controls
                playsinline
                preload="metadata"
                style="width:100%; max-height:360px; object-fit:contain; display:block; background:#000;"
              ></video>
              <div style="padding:8px 14px; background:#080e1c; border-top:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="font-size:11px; font-weight:bold; color:#fde047;">🎬 1080p Cinematic • The Shattered Crystal Heart</span>
                <button type="button" class="id-mini-btn" style="font-size:10px; padding:3px 10px; border-color:#facc15; color:#fde047; cursor:pointer;" onclick="window.playCinematicModal && window.playCinematicModal('crystal_heart')">
                  ⛶ Open Theater Mode
                </button>
              </div>
            </div>

            <div class="elemental-aspects-grid">
              <div style="background:#080e1c; border-left:3px solid #facc15; padding:8px 10px; border-radius:4px;">
                <b style="color:#facc15; font-size:11px;">☀️ Solari — Solar Light / Gold</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Claimed the dawn-fire facets. Sentinels of the Sunspire Dominion wielding Guard &amp; Zenith state.</div>
              </div>
              <div style="background:#080e1c; border-left:3px solid #c084fc; padding:8px 10px; border-radius:4px;">
                <b style="color:#c084fc; font-size:11px;">🌑 Umbri — Void / Amethyst</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Channeled the necrotic shadow facets. Reapers of the Duskveil Syndicate wielding Stealth &amp; Void Harvest.</div>
              </div>
              <div style="background:#080e1c; border-left:3px solid #4ade80; padding:8px 10px; border-radius:4px;">
                <b style="color:#4ade80; font-size:11px;">🌿 Terra — Verdant Root / Emerald</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Bound the root and ironwood facets. Guardians of the Rootdeep Collective wielding Overwhelm &amp; Thornbark.</div>
              </div>
              <div style="background:#080e1c; border-left:3px solid #38bdf8; padding:8px 10px; border-radius:4px;">
                <b style="color:#38bdf8; font-size:11px;">🔮 Aether — Celestial Mist / Cyan</b>
                <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Harnessed the star-weaving chronoflux facets. Scholars of the Astral Conclave wielding Flash Tempo &amp; Echo.</div>
              </div>
            </div>
            <p style="font-size:11.5px; line-height:1.5; color:#94a3b8; margin-top:10px; font-style:italic;">
              The Glimmer singing in your blood is not ordinary magic—it is the living life-blood of the shattered Crystal Heart.
            </p>
          </div>
        `;
    }
  }
}
