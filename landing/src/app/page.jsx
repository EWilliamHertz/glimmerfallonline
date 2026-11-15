'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EQUIPMENT_CATALOG,
  CANONICAL_SETS,
  RUNEWORD_SYNERGIES,
} from '../data/canonicalCatalog';
import {
  Swords,
  Shield,
  Sparkles,
  Zap,
  Flame,
  Moon,
  Compass,
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  ListMusic,
  ListPlus,
  Trash2,
  Search,
  Music,
  Film,
  Layers,
  ChevronRight,
  BookOpen,
  Boxes,
  Eye,
  Award,
  Globe,
  Dices,
  Check,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Crosshair,
  Heart,
  Hammer,
  Wand2,
  Scroll,
  Wifi,
  UserCheck,
  ShieldAlert,
  Cpu,
  MapPin,
  Coins,
  Gem,
  Pickaxe,
  Feather,
  Backpack,
  ExternalLink,
  Settings,
} from 'lucide-react';

const LOGO_PATH = '/GlimmerFall_official_multicolor_logo.png';

// ==========================================
// GOOGLE FLOW SOUNDTRACK DIRECTORY & METADATA
// ==========================================
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

// ==========================================
// 1080P CINEMATICS THEATRE CATALOG
// ==========================================
export const LANDING_CINEMATICS = [
  { id: 'official_trailer', title: 'GlimmerFall — Official Dual Launch Trailer', category: 'Official Trailer', duration: '1:05', icon: '⚔️', poster: '/GlimmerFall_official_multicolor_logo.png', youtubeId: '2e8E0vjLcLg', url: 'https://youtu.be/2e8E0vjLcLg', desc: 'The official reveal trailer for GlimmerFall Online & TCG, launching December 5, 2026. One universe, two interconnected ways to play.' },
  { id: 'crystal_heart', title: 'The Shattered Crystal Heart', category: 'Prologue', duration: '0:35', icon: '🎬', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/crystal_heart_shattering_1080p.mp4', desc: 'The apocalyptic detonation of the primordial multi-faceted Crystal Heart that showered rainbow shards across the continent and fractured unified light into 4 aspects.' },
  { id: 'awakening_solari_vanguard', title: 'Solari Vanguard Awakening', category: 'Solari', duration: '0:30', icon: '☀️', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_solari_vanguard_1080p.mp4', desc: 'Sunspire golden plate sentinel with heavy tower shield and blazing spellblade channels solar dawn-fire, personifying the Solari Vanguard golden knight.' },
  { id: 'awakening_solari_dawnblade', title: 'Solari Dawnblade Awakening', category: 'Solari', duration: '0:30', icon: '🗡️', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_solari_dawnblade_1080p.mp4', desc: 'Acrobatic radiant duelist wielding solar scimitars in blinding Zenith state, executing swift dawnblade melee combat.' },
  { id: 'awakening_umbri_reaper', title: 'Umbri Reaper Awakening', category: 'Umbri', duration: '0:30', icon: '💀', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_umbri_reaper_1080p.mp4', desc: 'Nether assassin wielding soul-harvest scythe from Dusk Shroud stealth, channeling the hooded umbral harbinger.' },
  { id: 'awakening_umbri_shadowweaver', title: 'Umbri Shadowweaver Awakening', category: 'Umbri', duration: '0:30', icon: '🔮', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_umbri_shadowweaver_1080p.mp4', desc: 'Void sorcerer in deep purple robes weaving necrotic leylines and graveglass lanterns, manifesting the Umbri Shadowweaver mystic.' },
  { id: 'awakening_terra_ironroot', title: 'Terra Ironroot Awakening', category: 'Terra', duration: '0:30', icon: '🛡️', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_terra_ironroot_1080p.mp4', desc: 'Juggernaut forged from ancient ironwood and stonekin boulders, directly embodying the massive Terra Ironroot titan.' },
  { id: 'awakening_terra_bramble_warden', title: 'Terra Bramble Warden Awakening', category: 'Terra', duration: '0:30', icon: '🏹', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_terra_bramble_warden_1080p.mp4', desc: 'Verdant archer in forest camouflage drawing starlight briar arrows, leading the Terra Bramble Warden rangers.' },
  { id: 'awakening_aether_chronomancer', title: 'Aether Chronomancer Awakening', category: 'Aether', duration: '0:30', icon: '⏳', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_aether_chronomancer_1080p.mp4', desc: 'Temporal scholar channeling celestial chronoflux with the astral astrolabe, embodying the blue-robed Aether Chronomancer.' },
  { id: 'awakening_aether_tempest_sage', title: 'Aether Tempest Sage Awakening', category: 'Aether', duration: '0:30', icon: '⚡', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/awakening_aether_tempest_sage_1080p.mp4', desc: 'Arcane tempest sage summoning quantum chain lightning and cosmic beams, commanding the Aether Tempest Sage mysteries.' },
  { id: 'scene3_colossus_emergence', title: 'Granite Colossus Emergence', category: 'World Boss', duration: '0:32', icon: '🗿', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/scene3_colossus_emergence_1080p.mp4', desc: 'Earth-shattering boss emergence in the deep Starfall Caldera as ancient stone awakened by leylines stirs to life.' },
  { id: 'scene4_boss_defeated', title: 'Boss Defeated & Shard Harvest', category: 'Victory', duration: '0:28', icon: '🏆', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/scene4_boss_defeated_1080p.mp4', desc: 'Triumphant climax as the Colossus crumbles into celestial loot prisms, showering victory rewards over the heroic orders.' },
  { id: 'scene5_monolith_explosion', title: 'Nexus Monolith Detonation', category: '3v3 Warzone', duration: '0:34', icon: '💥', poster: '/GlimmerFall_official_multicolor_logo.png', url: 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/scene5_monolith_explosion_1080p.mp4', desc: 'Cataclysmic 3v3 Warzone finale: The 2500-HP Chronocore Nexus Monolith overloads and detonates in blinding prismatic glory.' },
];

// ==========================================
// CORE GAMEPLAY SYSTEMS ENCYCLOPEDIA DATA
// ==========================================
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

// ==========================================
// CANONICAL 4 FACTIONS & 8 ARCHETYPES DATA
// ==========================================
const FACTIONS_DATA = {
  Solari: {
    id: 'Solari',
    name: 'The Sunspire Dominion',
    title: 'Solari (The Light)',
    aspect: 'Solar Light / Gold',
    motto: 'May the Sunspire illuminate the darkness.',
    color: '#F2A900',
    border: 'border-[#F2A900]',
    badgeBg: 'bg-[#F2A900]/15',
    logo: '/solari_nobg.png',
    resource: 'Solar Charge (0-100) & Zenith State',
    desc: 'Devout holy sentinels worshipping the eternal Solar Core and dawn-fire facets of the shattered Crystal Heart. Building Solar Charge unlocks the blinding Zenith State, boosting movement speed, defense, and holy radiance bursts.',
    classes: [
      {
        id: 'solari_vanguard',
        name: 'Solari Vanguard',
        role: 'Radiant Frontliner • Guard & Zenith',
        armor: 'Sunforged Plate',
        weapon: 'Solari Spellblade',
        offhand: 'Radiant Shield',
        primary: 'Flare Strike',
        rites: ['Flare Strike', 'Solar Flare', 'Judgement of the Sun', 'Consecrated Ground', 'Radiant Bulwark', 'Blessing of Dawn', 'Wrath of the Daystar', 'Blinding Radiance'],
        desc: 'Unshakable bulwark holding the frontlines. Channels pure solar fury through consecrated blade and aegis, protecting allies and Outpost Nexuses.',
      },
      {
        id: 'aurora_marshal',
        name: 'Aurora Marshal',
        role: 'Celestial Commander • Nexus Healer',
        armor: 'Sunforged Plate',
        weapon: 'Solari Spellblade',
        offhand: 'Mirror Shield',
        primary: 'Flare Strike',
        rites: ['Flare Strike', 'Solar Flare', 'Decree of the Sun', 'Consecrated Ground', 'Radiant Bulwark', 'Daybreak', 'Wrath of the Daystar', 'Blinding Radiance'],
        desc: 'Herald of Dawn commanding Decree of the Sun and Daybreak to mend allies, cleanse debuffs, and restore health to allied Outpost Nexuses.',
      },
    ],
  },
  Umbri: {
    id: 'Umbri',
    name: 'The Duskveil Syndicate',
    title: 'Umbri (The Shadow)',
    aspect: 'Void / Amethyst',
    motto: 'In shadows we weave, in silence we strike.',
    color: '#9B30FF',
    border: 'border-[#9B30FF]',
    badgeBg: 'bg-[#9B30FF]/15',
    logo: '/umbri_nobg.png',
    resource: 'Void Resonance (0-100) & Dusk Shroud',
    desc: 'Subterranean reapers operating from the Umbri Undercity who bound the necrotic shadow facets of the shattered Crystal Heart. Void Resonance fuels terrifying shadow-weaving, stealth strikes, and life-stealing graveglass sorcery.',
    classes: [
      {
        id: 'umbral_assassin',
        name: 'Umbral Assassin',
        role: 'Stealth Executioner • Void Harvest',
        armor: 'Duskveil Shadowmail',
        weapon: 'Scythe of the Soulreaper',
        offhand: 'Graveglass Focus',
        primary: 'Whisper of the Void',
        rites: ['Whisper of the Void', 'Unmake', 'Soul Tithe', 'Nightfall Plague', 'Veil of Dusk', 'Siphon Soul', 'Graveglass Ward', 'Shadow Step'],
        desc: 'Duskveil stalker vanishing in shadow, blinking through space with Shadow Step, and executing vulnerable targets with Unmake.',
      },
      {
        id: 'graveglass_oracle',
        name: 'Graveglass Oracle',
        role: 'Blood-Hex Reaper • Life Drain',
        armor: 'Duskveil Shadowmail',
        weapon: 'Scythe of the Soulreaper',
        offhand: 'Graveglass Focus',
        primary: 'Whisper of the Void',
        rites: ['Whisper of the Void', 'Siphon Soul', 'Soul Tithe', 'Nightfall Plague', 'Graveglass Ward', 'Veil of Dusk', 'Unmake', 'Shadow Step'],
        desc: 'Sepulcher mystic draining enemy life-force via Siphon Soul, Soul Tithe, and Nightfall Plague to sustain dark barriers and wither foes.',
      },
    ],
  },
  Terra: {
    id: 'Terra',
    name: 'The Rootdeep Collective',
    title: 'Terra (The Earth)',
    aspect: 'Verdant Root / Emerald',
    motto: 'Stand unyielding as ancient stone.',
    color: '#22E07B',
    border: 'border-[#22E07B]',
    badgeBg: 'bg-[#22E07B]/15',
    logo: '/terra_nobg.png',
    resource: 'Root Armor (0-100) & Bramble Fortitude',
    desc: 'Ancient guardians and stonekin elders communing with the giant canopy of Glimmer Orchard, binding the living root and ironwood facets of the shattered Crystal Heart. Root Armor absorbs massive punishment and retaliates with thorn shockwaves.',
    classes: [
      {
        id: 'forest_warden',
        name: 'Forest Warden',
        role: 'Primal Bruiser • Overwhelm & Roots',
        armor: 'Ironwood Armor',
        weapon: 'Ironwood Greathammer',
        offhand: 'Thornbark Buckler',
        primary: 'Tectonic Slam',
        rites: ['Tectonic Slam', 'Earthshatter', 'Stonekin Boulder', 'Briar Snare', 'Barkskin Infusion', 'Verdant Renewal', 'Primal Overwhelm', 'Wildshape Surge'],
        desc: 'Guardian of Glimmer Orchard snaring enemies in Briar Snare, stampeding through frontlines with Wildshape Surge, and crushing foes with Tectonic Slam.',
      },
      {
        id: 'stonekin_elder',
        name: 'Stonekin Elder',
        role: 'Colossal Tank • Thornbark Reflect',
        armor: 'Ironwood Armor',
        weapon: 'Ironwood Greathammer',
        offhand: 'Thornbark Buckler',
        primary: 'Tectonic Slam',
        rites: ['Tectonic Slam', 'Stonekin Boulder', 'Earthshatter', 'Briar Snare', 'Barkskin Infusion', 'Verdant Renewal', 'Primal Overwhelm', 'Wildshape Surge'],
        desc: 'Ancient Rootdeep juggernaut encased in Barkskin Infusion, reflecting melee strikes with Thornbark and shattering battlefields with Stonekin Boulders.',
      },
    ],
  },
  Aether: {
    id: 'Aether',
    name: 'The Astral Conclave',
    title: 'Aether (The Magic)',
    aspect: 'Celestial Mist / Cyan',
    motto: 'Time and space bend to the arcane truth.',
    color: '#00BFFF',
    border: 'border-[#00BFFF]',
    badgeBg: 'bg-[#00BFFF]/15',
    logo: '/aether_nobg.png',
    resource: 'Chronoflux (0-100) & Temporal Surge',
    desc: 'Scholars of the Mirrorgate Spire who manipulate the celestial lattice and star-weaving chronoflux facets of the shattered Crystal Heart. Chronoflux accelerates cooldowns, bends projectile vectors, and rewinds positioning.',
    classes: [
      {
        id: 'chronomancer_sage',
        name: 'Chronomancer Sage',
        role: 'Time-Bender • Flash Tempo & Echo',
        armor: 'Starweave Vestments',
        weapon: 'Astral Chrono-Staff',
        offhand: 'Mirror Shield',
        primary: 'Reality Fracture',
        rites: ['Reality Fracture', 'Astral Convergence', 'Temporal Lance', 'Gravity Well', 'Mirror Barrier', 'Time Loop Paradox', 'Frost Nova', 'Chrono Shift'],
        desc: 'Mirrorgate scholar bending spacetime with Chrono Shift, Gravity Well, and Time Loop Paradox to accelerate allies and freeze enemies in temporal rifts.',
      },
      {
        id: 'nexus_weaver',
        name: 'Nexus Weaver',
        role: 'Arcane Battlemage • Starfall & Freeze',
        armor: 'Starweave Vestments',
        weapon: 'Astral Chrono-Staff',
        offhand: 'Mirror Shield',
        primary: 'Reality Fracture',
        rites: ['Reality Fracture', 'Temporal Lance', 'Astral Convergence', 'Gravity Well', 'Mirror Barrier', 'Time Loop Paradox', 'Frost Nova', 'Chrono Shift'],
        desc: 'Weaver of cosmic leylines freezing foes with Frost Nova, hurling Temporal Lances, and calling down Astral Convergence across the battlefield.',
      },
    ],
  },
};

// ==========================================
// PIXELATED ARMORY ITEMS SHOWCASE (CANONICAL)
// ==========================================
const PIXEL_ITEMS = [
  { id: 'solari_spellblade', name: 'Solari Spellblade', slot: 'Weapon', rarity: 'Awakened', icon: '🗡️', stat: '+24 Radiant Dmg • +8% Holy Crit', color: '#F2A900', desc: 'Forged from Starfall meteorite and quenched in the solar well of the Sunspire.' },
  { id: 'radiant_shield', name: 'Radiant Shield', slot: 'Shield', rarity: 'Solari Relic', icon: '🛡️', stat: '+45 Armor • +60 Block Value', color: '#F2A900', desc: 'Imbued with the Zenith core. Emits blinding retaliation flashes.' },
  { id: 'scythe_soulreaper', name: 'Scythe of the Soulreaper', slot: 'Weapon', rarity: 'Epic Relic', icon: '⛏️', stat: '+28 Void Dmg • +20% Life Leech', color: '#9B30FF', desc: 'Forged in the Umbri Undercity to harvest dying essence and replenish vitals.' },
  { id: 'duskveil_shroud', name: 'Duskveil Shadowmail', slot: 'Armor', rarity: 'Awakened', icon: '🦹', stat: '+14 Agility • +12% Stealth Opener', color: '#9B30FF', desc: 'Woven with Graveglass filament that drinks ambient illumination.' },
  { id: 'ironwood_maul', name: 'Ironwood Greathammer', slot: 'Weapon', rarity: 'Awakened', icon: '🔨', stat: '+32 Physical Dmg • Stun Chance', color: '#22E07B', desc: 'Carved from heartwood of Glimmer Orchard ancient boughs.' },
  { id: 'bramble_buckler', name: 'Thornbark Buckler', slot: 'Shield', rarity: 'Terra Relic', icon: '🪵', stat: '+35 Armor • +35% Reflect', color: '#22E07B', desc: 'Reflects incoming melee damage back at attackers through barbed briars.' },
  { id: 'chronocore_staff', name: 'Astral Chrono-Staff', slot: 'Weapon', rarity: 'Awakened', icon: '🔮', stat: '+26 Arcane • -12% Cooldowns', color: '#00BFFF', desc: 'Allows the wielder to perceive temporal currents and accelerate spell rites.' },
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic Relic', icon: '💎', stat: 'World Nexus Anchor (2500 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
];

// ==========================================
// LEYLINE CURRENCIES
// ==========================================
const CURRENCIES = [
  { id: 'solar_gold', name: 'Solar Gold', val: '1,420,500', icon: '🪙', color: '#F2A900', desc: 'Universal trade currency of Sanctuary Haven pavilion.' },
  { id: 'glimmer_shards', name: 'Glimmer Shards', val: '350', icon: '🔮', color: '#00BFFF', desc: 'Crystallized leyline resonance extracted from Grand Fonts.' },
  { id: 'chrono_cores', name: 'Chrono Cores', val: '28', icon: '🌀', color: '#38bdf8', desc: 'Pulsing temporal fragments dropped from Mirrorgate dungeon bosses.' },
  { id: 'void_remnants', name: 'Void Remnants', val: '115', icon: '🖤', color: '#9B30FF', desc: 'Reaped shadowy essence from the subterranean Undercity depths.' },
  { id: 'root_stones', name: 'Root Stones', val: '42', icon: '🌿', color: '#22E07B', desc: 'Ancient stone heart seeds blessed by the canopy elders.' },
];

// ==========================================
// 7 DISCIPLINES & SKILLS (MAX LVL 99)
// ==========================================
const PROFESSIONS = [
  { id: 'mining', name: 'Resonance Extraction', lvl: 48, icon: '⛏️', color: '#00BFFF', desc: 'Harvesting mineral seams and Grand Glimmer Fonts.' },
  { id: 'smithing', name: 'Star-Forging', lvl: 35, icon: '🔨', color: '#F2A900', desc: 'Hammering celestial ingots into platebody armor and blades.' },
  { id: 'weaving', name: 'Leyline Weaving', lvl: 42, icon: '🧵', color: '#22E07B', desc: 'Looming enchanted silkrobes and stealth cowls at Celestial Loom.' },
  { id: 'inscription', name: 'Void Inscription', lvl: 29, icon: '📜', color: '#9B30FF', desc: 'Carving Ancient Runewords into 3-socket equipment.' },
  { id: 'alchemy', name: 'Celestial Alchemy', lvl: 51, icon: '🧪', color: '#ec4899', desc: 'Distilling radiant tinctures, health vials, and elixirs.' },
  { id: 'rites', name: 'Rites Mastery', lvl: 64, icon: '⚔️', color: '#facc15', desc: 'Combat spellcasting proficiency across all canonical disciplines.' },
  { id: 'flashes', name: 'Flashes Mastery', lvl: 58, icon: '⚡', color: '#38bdf8', desc: 'Instant reaction strikes, evasive maneuvers, and combo bursts.' },
];

const ORDER_PRESETS = [
  { tag: 'SUN', name: 'Order of Dawn', color: '#F2A900', emblem: '☀️', faction: 'Solari' },
  { tag: 'VOID', name: 'Duskveil Cabal', color: '#9B30FF', emblem: '🌑', faction: 'Umbri' },
  { tag: 'ROOT', name: 'Ironwood Watch', color: '#22E07B', emblem: '🌿', faction: 'Terra' },
  { tag: 'AETH', name: 'Chronocore Wardens', color: '#00BFFF', emblem: '🔮', faction: 'Aether' },
  { tag: 'GLIM', name: 'GlimmerFall Founders', color: '#FB923C', emblem: '⚡', faction: null },
];

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

export default function LandingPage() {
  // Navigation & State (Tabbed Architecture)
  const [activeTab, setActiveTab] = useState('overview');
  const [theatreCategoryFilter, setTheatreCategoryFilter] = useState('All');
  const [selectedFaction, setSelectedFaction] = useState('Solari');
  const [characterName, setCharacterName] = useState('Aurelia');
  const [playMode, setPlayMode] = useState('singleplayer'); // 'singleplayer' | 'multiplayer'
  const [selectedClassId, setSelectedClassId] = useState('solari_vanguard');
  const [selectedOrderTag, setSelectedOrderTag] = useState('SUN');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [startOnLoadout, setStartOnLoadout] = useState(false);
  const [activeEncTab, setActiveEncTab] = useState('combat');
  const [activeLoreTab, setActiveLoreTab] = useState('shattering');
  const [hoveredItem, setHoveredItem] = useState(null);

  // Google Flow OST Jukebox & Official Media Player State
  const [currentOstTrackId, setCurrentOstTrackId] = useState('title');
  const [isOstPlaying, setIsOstPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(178);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState('all'); // 'all', 'one', 'off'
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [trackCategoryFilter, setTrackCategoryFilter] = useState('all');
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [selectedCinematicId, setSelectedCinematicId] = useState('crystal_heart');
  const [isTheatreAutoplay, setIsTheatreAutoplay] = useState(false);
  const [armorySlotFilter, setArmorySlotFilter] = useState('all');
  const [armoryRarityFilter, setArmoryRarityFilter] = useState('all');
  const [armorySearch, setArmorySearch] = useState('');
  const [serverStatus, setServerStatus] = useState({
    online: true,
    onlinePlayers: 1,
    tickRate: 20,
    pingMs: 18,
  });

  const wearableArmoryItems = useMemo(() => {
    const validSlots = new Set([
      'weapon', 'shield', 'offhand', 'head', 'body', 'armor',
      'legs', 'gloves', 'boots', 'cape', 'ring', 'amulet',
      'gem', 'rune', 'relic'
    ]);
    return Object.values(EQUIPMENT_CATALOG || {}).filter((it) => it && validSlots.has(it.slot));
  }, []);

  const filteredArmoryItems = useMemo(() => {
    return wearableArmoryItems.filter((it) => {
      if (armorySlotFilter !== 'all') {
        if (armorySlotFilter === 'shield' && it.slot !== 'shield' && it.slot !== 'offhand') return false;
        else if (armorySlotFilter === 'body' && it.slot !== 'body' && it.slot !== 'armor') return false;
        else if (armorySlotFilter === 'jewelry' && it.slot !== 'ring' && it.slot !== 'amulet') return false;
        else if (armorySlotFilter === 'sockets' && it.slot !== 'gem' && it.slot !== 'rune' && it.slot !== 'relic') return false;
        else if (!['shield', 'body', 'jewelry', 'sockets'].includes(armorySlotFilter) && it.slot !== armorySlotFilter) return false;
      }
      if (armoryRarityFilter !== 'all' && (it.rarity || '').toLowerCase() !== armoryRarityFilter.toLowerCase()) {
        return false;
      }
      if (armorySearch.trim()) {
        const q = armorySearch.toLowerCase();
        const hay = `${it.name || ''} ${it.slot || ''} ${it.rarity || ''} ${it.faction || ''} ${it.desc || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [wearableArmoryItems, armorySlotFilter, armoryRarityFilter, armorySearch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let alive = true;
    const pollStatus = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const rtt = Math.max(1, Math.round(performance.now() - t0));
        if (alive && data?.ok) {
          setServerStatus({
            online: true,
            onlinePlayers: Math.max(1, Number(data.onlinePlayers) || 0),
            tickRate: data.tickRate || 20,
            pingMs: rtt,
          });
        }
      } catch (_) {}
    };
    pollStatus();
    const timer = setInterval(pollStatus, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const audioRef = useRef(null);
  const queueRef = useRef([]);
  queueRef.current = queue;
  const repeatModeRef = useRef('all');
  repeatModeRef.current = repeatMode;
  const isShuffleRef = useRef(false);
  isShuffleRef.current = isShuffle;
  const currentTrackRef = useRef('title');
  currentTrackRef.current = currentOstTrackId;
  const isDraggingScrubberRef = useRef(false);
  const audioFailoverRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isDraggingScrubberRef.current && audio) {
        setCurrentTime(audio.currentTime || 0);
      }
    };
    const onLoadedMetadata = () => {
      if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onDurationChange = () => {
      if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsOstPlaying(true);
    const onPause = () => setIsOstPlaying(false);
    const onEnded = () => {
      if (queueRef.current.length > 0) {
        const nextId = queueRef.current[0];
        setQueue((prev) => prev.slice(1));
        playOstTrack(nextId, { fromQueue: true });
      } else if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (repeatModeRef.current === 'all') {
        playNextTrack();
      } else {
        setIsOstPlaying(false);
        setCurrentTime(0);
      }
    };
    const onError = () => {
      const track = LANDING_OST_TRACKS.find((t) => t.id === currentTrackRef.current);
      if (audioFailoverRef.current === 0 && track && track.url && audio.src !== track.url) {
        audioFailoverRef.current = 1;
        audio.src = track.url;
        audio.play().catch(() => setIsOstPlaying(false));
      } else {
        setIsOstPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      try { audio.pause(); } catch (_) {}
    };
  }, []);

  const playOstTrack = (trackId, { fromQueue = false } = {}) => {
    const track = LANDING_OST_TRACKS.find((t) => t.id === trackId);
    if (!track) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (currentOstTrackId === trackId && !audio.paused) {
      audio.pause();
      setIsOstPlaying(false);
      return;
    }

    if (currentOstTrackId && currentOstTrackId !== trackId) {
      setHistory((prev) => [...prev.slice(-30), currentOstTrackId]);
    }

    setCurrentOstTrackId(trackId);
    setDuration(track.durationSec || 180);
    setCurrentTime(0);
    audioFailoverRef.current = 0;
    setIsOstPlaying(true);

    const src = track.localUrl || track.url;
    if (audio.src !== src && !audio.src.endsWith(src)) {
      audio.src = src;
    }
    audio.volume = isMuted ? 0 : volume;
    audio.play().catch((err) => {
      console.warn('[MediaPlayer] Local play error, trying CDN fallback:', err);
      if (audio.src !== track.url) {
        audioFailoverRef.current = 1;
        audio.src = track.url;
        audio.play().catch((err2) => {
          console.warn('[MediaPlayer] CDN fallback failed:', err2);
          setIsOstPlaying(false);
        });
      } else {
        setIsOstPlaying(false);
      }
    });
  };

  const toggleOstPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isOstPlaying) {
      audio.pause();
      setIsOstPlaying(false);
    } else if (audio.src && !audio.ended) {
      audio.play().then(() => setIsOstPlaying(true)).catch(() => {
        playOstTrack(currentOstTrackId || 'title');
      });
    } else {
      playOstTrack(currentOstTrackId || 'title');
    }
  };

  const playNextTrack = () => {
    if (queueRef.current.length > 0) {
      const nextId = queueRef.current[0];
      setQueue((prev) => prev.slice(1));
      playOstTrack(nextId, { fromQueue: true });
      return;
    }
    const tracks = LANDING_OST_TRACKS;
    if (isShuffleRef.current) {
      const pool = tracks.filter((t) => t.id !== currentTrackRef.current);
      const rand = pool[Math.floor(Math.random() * pool.length)] || tracks[0];
      playOstTrack(rand.id);
      return;
    }
    const curIdx = tracks.findIndex((t) => t.id === currentTrackRef.current);
    const nextIdx = (curIdx + 1) % tracks.length;
    playOstTrack(tracks[nextIdx].id);
  };

  const playPrevTrack = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const tracks = LANDING_OST_TRACKS;
    const curIdx = tracks.findIndex((t) => t.id === currentTrackRef.current);
    const prevIdx = (curIdx - 1 + tracks.length) % tracks.length;
    playOstTrack(tracks[prevIdx].id);
  };

  const seekTrack = (seconds) => {
    isDraggingScrubberRef.current = false;
    const s = Number(seconds);
    const audio = audioRef.current;
    if (audio && !isNaN(s)) {
      try {
        audio.currentTime = s;
        setCurrentTime(s);
      } catch (_) {}
    }
  };

  const onScrubberInput = (seconds) => {
    isDraggingScrubberRef.current = true;
    const s = Number(seconds);
    if (!isNaN(s)) {
      setCurrentTime(s);
    }
  };

  const handleVolumeChange = (newVol) => {
    const v = Math.max(0, Math.min(1, Number(newVol)));
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) audioRef.current.volume = nextMute ? 0 : volume;
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => (prev === 'all' ? 'one' : prev === 'one' ? 'off' : 'all'));
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const addToQueue = (trackId) => {
    setQueue((prev) => [...prev, trackId]);
    if (!isOstPlaying && (!audioRef.current || audioRef.current.paused)) {
      playOstTrack(trackId, { fromQueue: true });
    }
  };

  const removeFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const playQueuedItem = (index) => {
    const item = queue[index];
    removeFromQueue(index);
    if (item) playOstTrack(item, { fromQueue: true });
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Load initial preferences
  useEffect(() => {
    try {
      const savedStart = localStorage.getItem('glimmerfall_start_on_loadout') === 'true';
      setStartOnLoadout(savedStart);
      const savedMode = localStorage.getItem('glimmerfall_play_mode');
      if (savedMode === 'multiplayer' || savedMode === 'singleplayer') {
        setPlayMode(savedMode);
      }
    } catch (_) {}
  }, []);

  // Screen Panning (Drag-to-Scroll) & Keyboard Navigation for broken mouse wheel support
  useEffect(() => {
    let isDragging = false;
    let startY = 0;
    let startScrollY = 0;

    const handleMouseDown = (e) => {
      // Do not interfere with touch devices or touch emulation on iPad/mobile
      if (
        (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        e.sourceCapabilities?.firesTouchEvents ||
        (typeof window !== 'undefined' && 'ontouchstart' in window)
      ) {
        return;
      }
      if (e.button !== 0) return;
      const interactive = e.target.closest(
        'button, a, input, select, textarea, video, canvas, [role="button"]'
      );
      if (interactive) return;

      isDragging = true;
      startY = e.clientY;
      startScrollY = window.scrollY;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      window.scrollTo({ top: startScrollY - deltaY });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const tag = active ? active.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || active?.isContentEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.scrollBy({ top: 140, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.scrollBy({ top: -140, behavior: 'smooth' });
      } else if (e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleStartOnSite = (checked) => {
    setStartOnLoadout(checked);
    try {
      localStorage.setItem('glimmerfall_start_on_loadout', checked ? 'true' : 'false');
    } catch (_) {}
  };

  const playSfx = (type = 'click') => {
    if (!soundEnabled || typeof window === 'undefined') return;
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
  };

  const handleAdvanceCinematic = (delta = 1) => {
    const curIdx = LANDING_CINEMATICS.findIndex((s) => s.id === selectedCinematicId);
    const nextIdx = (curIdx + delta + LANDING_CINEMATICS.length) % LANDING_CINEMATICS.length;
    setSelectedCinematicId(LANDING_CINEMATICS[nextIdx].id);
  };

  const handleFactionSelect = (facKey) => {
    setSelectedFaction(facKey);
    const firstCls = FACTIONS_DATA[facKey].classes[0];
    setSelectedClassId(firstCls.id);
    const defaultOrderTags = { Solari: 'SUN', Umbri: 'VOID', Terra: 'ROOT', Aether: 'AETH' };
    if (defaultOrderTags[facKey]) {
      setSelectedOrderTag(defaultOrderTags[facKey]);
    }
    const defaultNames = { Solari: 'Aurelia', Umbri: 'Morrigan', Terra: 'Rowan', Aether: 'Caelum' };
    if (defaultNames[facKey]) {
      setCharacterName(defaultNames[facKey]);
    }
    playSfx('click');
  };

  const randomizeName = () => {
    const pick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(Math.random() * 89 + 10);
    setCharacterName(`${pick}_${num}`);
    playSfx('click');
  };

  const handleLaunchGame = () => {
    playSfx('launch');

    try {
      const finalName = characterName.trim() || 'Vanguard';
      const allowedOrders = ORDER_PRESETS.filter((o) => !o.faction || o.faction === selectedFaction);
      const order = allowedOrders.find((o) => o.tag === selectedOrderTag) || allowedOrders[0] || ORDER_PRESETS[0];
      const activeClass = FACTIONS_DATA[selectedFaction].classes.find((c) => c.id === selectedClassId) || FACTIONS_DATA[selectedFaction].classes[0];

      if (typeof window !== 'undefined') {
        localStorage.setItem('glimmerfall_play_mode', playMode);

        const newCharId = `char_${Date.now()}`;
        const newChar = {
          id: newCharId,
          name: finalName,
          faction: selectedFaction,
          classId: activeClass.id,
          orderTag: order.tag,
          orderName: order.name,
          orderColor: order.color,
          homeBiome: 'sanctuary_hub',
          hp: 40,
          solarCharge: selectedFaction === 'Solari' ? 0 : 20,
          lastPosition: { roomType: 'sanctuary_hub', x: 0, y: 96 },
        };

        const rawRoster = localStorage.getItem('glimmerfall_sp_roster_v2');
        let roster = [];
        try {
          roster = rawRoster ? JSON.parse(rawRoster) : [];
        } catch (_) {}

        const existingIdx = roster.findIndex((c) => c.name.toLowerCase() === finalName.toLowerCase());
        if (existingIdx >= 0) {
          roster[existingIdx] = { ...roster[existingIdx], ...newChar };
          localStorage.setItem('glimmerfall_sp_active_id', roster[existingIdx].id);
        } else {
          roster.unshift(newChar);
          localStorage.setItem('glimmerfall_sp_active_id', newCharId);
        }
        localStorage.setItem('glimmerfall_sp_roster_v2', JSON.stringify(roster));

        // Determine destination: navigate directly to main game with mode
        const targetUrl = `/?mode=${playMode}&autostart=1`;

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 250);
      }
    } catch (e) {
      console.error(e);
      window.location.href = '/';
    }
  };

  const handleOpenLoadout = () => {
    playSfx('click');
    if (typeof window !== 'undefined') {
      window.location.href = '/?loadout=1';
    }
  };

  const currentFaction = FACTIONS_DATA[selectedFaction];
  const activeClassObj = currentFaction.classes.find((c) => c.id === selectedClassId) || currentFaction.classes[0];
  const allowedOrdersForFaction = ORDER_PRESETS.filter((o) => !o.faction || o.faction === selectedFaction);
  const currentOrder = allowedOrdersForFaction.find((o) => o.tag === selectedOrderTag) || allowedOrdersForFaction[0] || ORDER_PRESETS[0];
  const activeOstTrack = LANDING_OST_TRACKS.find((t) => t.id === currentOstTrackId) || LANDING_OST_TRACKS[0];
  const activeCinematic = LANDING_CINEMATICS.find((s) => s.id === selectedCinematicId) || LANDING_CINEMATICS[0];

  return (
    <div className="min-h-screen bg-[#050811] text-[#F8FAFC] flex flex-col antialiased overflow-x-hidden selection:bg-[#F2A900] selection:text-black">
      {/* ======================================================== */}
      {/* UNIFIED STICKY GLASSMORPHIC TOP NAVBAR                   */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 w-full bg-[#060A16]/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2.5 flex-nowrap overflow-x-auto scrollbar-none">
          <div
            onClick={() => setTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
          >
            <div className="relative w-9 h-9 flex-shrink-0 p-1 rounded-xl bg-black/50 border border-[#F2A900]/45 shadow-[0_0_18px_rgba(242,169,0,0.25)] group-hover:scale-105 transition-transform">
              <img
                src={LOGO_PATH}
                alt="GlimmerFall Official Logo"
                width={32}
                height={32}
                className="sidebar-logo-img w-full h-full object-contain filter drop-shadow(0 0 6px #F2A900)"
              />
            </div>
            <div>
              <div className="font-display font-black text-sm tracking-wider text-white whitespace-nowrap leading-tight">
                GLIMMER<span className="text-[#F2A900]">FALL</span>
              </div>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[9px] text-[#6EE7B7] font-bold whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                Online
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-[#0B1122]/80 p-1 rounded-xl border border-white/10 flex-nowrap flex-shrink-0">
            {[
              { id: 'overview', label: 'Overview', icon: Music },
              { id: 'forge', label: 'Entities', icon: Sparkles },
              { id: 'theatre', label: 'Theatre', icon: Film },
              { id: 'systems', label: 'Systems', icon: Zap },
              { id: 'armory', label: 'Armory', icon: Boxes },
              { id: 'atlas', label: 'Lore', icon: Globe },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all whitespace-nowrap ${
                    isSel
                      ? 'bg-gradient-to-r from-[#F2A900]/25 to-[#38BDF8]/20 border border-[#F2A900]/60 text-[#FDE047] shadow-[0_4px_16px_rgba(242,169,0,0.2)]'
                      : 'border border-transparent text-white/65 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-[#FDE047]' : 'text-white/50'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 flex-shrink-0 flex-nowrap">
            <div className="inline-flex bg-[#080D1A] p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => { setPlayMode('singleplayer'); playSfx('click'); }}
                className={`text-[11px] py-1 px-2 rounded-md font-bold transition-all whitespace-nowrap ${
                  playMode === 'singleplayer'
                    ? 'bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#7DD3FC]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                🕹️ Offline
              </button>
              <button
                onClick={() => { setPlayMode('multiplayer'); playSfx('click'); }}
                className={`text-[11px] py-1 px-2 rounded-md font-bold transition-all whitespace-nowrap ${
                  playMode === 'multiplayer'
                    ? 'bg-[#22E07B]/20 border border-[#22E07B]/50 text-[#86EFAC]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                🌐 Online
              </button>
            </div>

            <button
              onClick={handleOpenLoadout}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white/90 transition-all flex items-center gap-1 whitespace-nowrap"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" /> Roster
            </button>

            <button
              onClick={handleLaunchGame}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#FDE047] via-[#FACC15] to-[#CA8A04] text-black font-display font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-[0_8px_24px_rgba(250,204,21,0.35)] flex items-center gap-1 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-black" /> Play Now
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN FULL-WIDTH CONTENT CONTAINER                        */}
      {/* ======================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* DYNAMIC TAB VIEWS */}
        <div className="space-y-8 animate-fade-in">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW & OST JUKEBOX                            */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-8"
            >
              {/* HERO BANNER SECTION */}
        <section id="prologue-hero" className="relative rounded-3xl p-8 lg:p-14 overflow-hidden border border-[#1E293B] bg-radial from-[#131D38] via-[#090E1E] to-[#050814] shadow-2xl">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.14, 0.24, 0.14] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: currentFaction.color }}
          />
          <motion.div
            animate={{ scale: [1.08, 0.96, 1.08], opacity: [0.10, 0.20, 0.10] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-[#38BDF8]/20 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10 max-w-4xl">
            {/* Live Stockholm Realm Status Pill */}
            <div className="inline-flex flex-wrap items-center gap-3 px-3.5 py-1.5 rounded-full bg-black/60 border border-[#1E293B] mb-5 text-[11px] font-mono shadow-lg backdrop-blur-md">
              <span className="flex items-center gap-1.5 text-[#4ADE80] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
                STOCKHOLM REALM ONLINE
              </span>
              <span className="text-white/30">|</span>
              <span className="text-[#38BDF8] font-bold">{serverStatus.tickRate}Hz Authoritative Tick</span>
              <span className="text-white/30">|</span>
              <span className="text-[#FDE047] font-bold">{serverStatus.onlinePlayers} Vanguard{serverStatus.onlinePlayers === 1 ? '' : 's'} Active</span>
              {serverStatus.pingMs && (
                <>
                  <span className="text-white/30">|</span>
                  <span className="text-white/70">{serverStatus.pingMs}ms RTT</span>
                </>
              )}
            </div>

            {/* Header with Official Logo */}
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.06, rotate: 2 }}
                className="p-2 rounded-2xl bg-black/60 border border-[#F2A900]/40 shadow-[0_0_25px_rgba(242,169,0,0.3)]"
              >
                <img
                  src={LOGO_PATH}
                  alt="GlimmerFall Official Logo"
                  width={48}
                  height={48}
                  style={{ maxWidth: 48, maxHeight: 48 }}
                  className="hero-logo-img w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow(0 0 10px #F2A900)"
                />
              </motion.div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#F2A900]/15 border border-[#F2A900]/40 text-[#F2A900]">
                  ✨ Canonical 16-Bit Action MMORPG &bull; glimmerfall.online
                </span>
                <h1 className="font-display font-black text-3xl sm:text-5xl tracking-wide text-white mt-1">
                  GLIMMER<span className="text-[#F2A900]">FALL</span> ONLINE
                </h1>
              </div>
            </div>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed font-head">
              Step into an authentic top-down action MMORPG set in the official <b>GlimmerFall Trading Card Game</b> universe.
              Before the continent formed, the celestial <b>Crystal Heart shattered</b>, fracturing unified light into four elemental aspects:
              <span className="text-[#F2A900] font-bold"> Solar Light</span>,
              <span className="text-[#9B30FF] font-bold"> Void</span>,
              <span className="text-[#22E07B] font-bold"> Verdant Root</span>, and
              <span className="text-[#38BDF8] font-bold"> Celestial Mist</span>.
              Harvest living Glimmer fonts, socket trading card relics from{' '}
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="text-[#38BDF8] underline font-bold">
                glimmerfalltcg.com
              </a>, master 7 disciplines to Level 99, and defend your 2500-HP Outpost Nexus (Last-Hit Wins) in 3v3 destruction arenas.
            </p>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              {[
                { val: 'Offline', sub: 'Single Player', col: '#38BDF8' },
                { val: 'Online MMO', sub: 'Stockholm Realm', col: '#4ADE80' },
                { val: 'Lv. 99', sub: '7 Disciplines', col: '#F2A900' },
                { val: `${wearableArmoryItems.length}+`, sub: 'Canonical Relics', col: '#C084FC' },
              ].map((stat) => (
                <motion.div
                  key={stat.sub}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="p-3.5 rounded-xl bg-black/50 border border-[#1E293B] hover:border-white/25 transition-colors backdrop-blur-md"
                >
                  <div className="text-xl sm:text-2xl font-mono font-black" style={{ color: stat.col }}>{stat.val}</div>
                  <div className="text-[11px] text-white/60 font-semibold uppercase">{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Interactive 4-Faction Live Switcher Deck */}
            <div className="mt-8 p-5 rounded-2xl bg-black/55 border border-[#1E293B] backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-display font-bold uppercase tracking-wider text-white/80">
                  ⚔️ Choose Your Canonical Faction Allegiance
                </span>
                <span className="text-[11px] font-mono font-bold" style={{ color: currentFaction.color }}>
                  Order Crest: [{currentOrder.tag}] {currentOrder.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.values(FACTIONS_DATA).map((fac) => {
                  const isSel = selectedFaction === fac.id;
                  return (
                    <motion.button
                      key={fac.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleFactionSelect(fac.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                        isSel ? 'bg-white/10 shadow-lg' : 'bg-black/40 border-[#1E293B] opacity-75 hover:opacity-100'
                      }`}
                      style={{ borderColor: isSel ? fac.color : undefined }}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={fac.logo} alt={fac.id} className="w-7 h-7 object-contain" />
                        <div>
                          <div className="font-display font-bold text-xs text-white">{fac.id}</div>
                          <div className="text-[9.5px] font-semibold" style={{ color: fac.color }}>{fac.aspect.split('/')[0]}</div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFaction.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="p-4 rounded-xl bg-[#070B18]/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-sm" style={{ color: currentFaction.color }}>
                        {currentFaction.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10">
                        {currentFaction.resource}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed max-w-xl">
                      {currentFaction.desc}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {currentFaction.classes.map((c) => (
                      <div key={c.id} className="px-3 py-1.5 rounded-lg bg-black/60 border border-[#1E293B] text-[11px]">
                        <div className="font-display font-bold text-white">{c.name}</div>
                        <div className="text-[9.5px]" style={{ color: currentFaction.color }}>{c.role}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Launch Actions */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLaunchGame}
                className="py-4 px-8 rounded-2xl bg-gradient-to-r from-[#F2A900] via-[#EAB308] to-[#CA8A04] text-black font-display font-black text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_30px_rgba(242,169,0,0.4)] flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-black" /> Awaken as {currentFaction.id} Now
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpenLoadout}
                className="py-4 px-6 rounded-2xl bg-black/60 border border-[#38BDF8]/40 text-[#7DD3FC] font-display font-bold text-sm tracking-wide hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 transition-all flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> Open In-Game Loadout
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTab('armory')}
                className="py-4 px-5 rounded-2xl bg-black/60 border border-[#C084FC]/40 text-[#E9D5FF] font-display font-bold text-sm tracking-wide hover:border-[#C084FC] hover:bg-[#C084FC]/10 transition-all flex items-center gap-2"
              >
                <Boxes className="w-4 h-4" /> Inspect {wearableArmoryItems.length} Armory Items
              </motion.button>
            </div>

            {/* CANONICAL EDITION & FREE STARTER TRIAL STOREFRONT PREVIEW */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-black/50 border border-[#38BDF8]/35 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#7DD3FC] border border-[#38BDF8]/30">
                      Instant Browser Access
                    </span>
                    <span className="font-mono font-black text-lg text-[#4ADE80]">FREE TRIAL</span>
                  </div>
                  <h4 className="font-display font-bold text-base text-white mt-2">
                    Vanguard Starter Trial (Offline &amp; Sanctuary Hub)
                  </h4>
                  <p className="text-xs text-white/65 mt-1 leading-relaxed">
                    Create heroes across all 4 canonical factions, keep playing freely up to Level 10 (with skills up to Lv. 30 &amp; 30-slot Vault), explore Sanctuary, Citadels &amp; Nexus Warzone, and test every Rite &amp; Flash.
                  </p>
                </div>
                <button
                  onClick={handleLaunchGame}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8] text-[#7DD3FC] font-display font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Play Free Trial in Browser →
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F2A900]/15 via-black/60 to-[#9B30FF]/15 border border-[#F2A900]/50 flex flex-col justify-between shadow-[0_0_25px_rgba(242,169,0,0.15)]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#F2A900]/20 text-[#FDE047] border border-[#F2A900]/40">
                      👑 Canonical Full Edition
                    </span>
                    <span className="font-mono font-black text-lg text-[#FDE047]">€6.99 • FOUNDER&apos;S PASS</span>
                  </div>
                  <h4 className="font-display font-bold text-base text-white mt-2">
                    GlimmerFall Online: Shattered Crystalheart Edition
                  </h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    Full Level 70 + Paragon 100 cap, all Continental Realms, Lv. 99 Mastery Capes, 140-slot Bank Vault, AetherSwap Exchange, 3v3 Ranked Warzone Seasons, and exclusive <code className="text-[#FDE047]">&lt;GLIM&gt;</code> Founder Heraldry.
                  </p>
                </div>
                <button
                  onClick={() => setTab('forge')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] to-[#EAB308] text-black font-display font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Forge Your Founder Champion →
                </button>
              </div>
            </div>

            {/* OFFICIAL GLIMMERFALL MEDIA PLAYER & SOUNDTRACK CATALOG */}
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#0F172A]/95 via-[#0A0F22]/98 to-[#060A16] border-2 border-[#F2A900]/40 p-5 sm:p-7 shadow-[0_16px_45px_rgba(0,0,0,0.7),0_0_30px_rgba(242,169,0,0.15)] space-y-5">
              {/* Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎼</span>
                  <h3 className="font-display font-black text-base sm:text-lg text-white tracking-wide">
                    GLIMMERFALL MASTER REALM JUKEBOX &amp; MEDIA PLAYER
                  </h3>
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-[#FACC15]/15 border border-[#FACC15]/40 text-[#FDE047] hidden sm:inline">
                    15 Master Tracks
                  </span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                  isOstPlaying
                    ? 'bg-[#4ADE80]/15 border-[#4ADE80]/40 text-[#4ADE80]'
                    : 'bg-[#FACC15]/15 border-[#FACC15]/40 text-[#FACC15]'
                }`}>
                  <span className={`w-2 h-2 rounded-full bg-current ${isOstPlaying ? 'animate-pulse' : ''}`} />
                  <span>{isOstPlaying ? 'Now Playing' : 'Paused'}</span>
                </div>
              </div>

              {/* Main Player Deck */}
              <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-5 items-center">
                {/* Rotating Vinyl Disc */}
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div
                    className={`w-24 h-24 rounded-full border-2 border-[#FACC15]/50 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-black shadow-[0_0_20px_rgba(0,0,0,0.8),0_0_15px_rgba(242,169,0,0.25)] flex items-center justify-center relative transition-transform ${
                      isOstPlaying ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: '4.5s' }}
                  >
                    <div className="absolute inset-2 rounded-full border border-dashed border-white/20" />
                    <div className="absolute inset-4 rounded-full border border-white/10" />
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FACC15] via-[#CA8A04] to-[#1E293B] border-2 border-white flex items-center justify-center text-base shadow-[0_0_10px_rgba(250,204,21,0.6)] z-10">
                      {activeOstTrack.icon}
                    </div>
                  </div>
                </div>

                {/* Track Details & Controls */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#7DD3FC]">
                      {activeOstTrack.category}
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#38BDF8]">
                      {activeOstTrack.zone}
                    </span>
                    <span className="text-[10px] font-bold text-[#FACC15] bg-[#FACC15]/10 px-2 py-0.5 rounded border border-[#FACC15]/30">
                      {activeOstTrack.bpm} BPM &bull; Key: {activeOstTrack.key}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono hidden md:inline">
                      High-Fidelity M4A / 48kHz
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-black text-xl text-[#FEF08A] tracking-wide">
                      {activeOstTrack.name}
                    </h4>
                    <p className="text-xs text-white/60 line-clamp-2 mt-0.5">
                      {activeOstTrack.desc}
                    </p>
                  </div>

                  {/* Scrubber Timeline */}
                  <div className="flex items-center gap-3 w-full pt-1">
                    <span className="text-[11.5px] font-mono font-bold text-[#7DD3FC] min-w-[42px]">
                      {formatTime(currentTime)}
                    </span>
                    <div className="relative flex-1 h-2 bg-[#0F172A] border border-white/20 rounded-full flex items-center">
                      <div
                        className="h-full bg-gradient-to-r from-[#FACC15] to-[#38BDF8] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)] pointer-events-none"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max={duration || 180}
                        step="0.5"
                        value={currentTime || 0}
                        onInput={(e) => onScrubberInput(e.target.value)}
                        onChange={(e) => seekTrack(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-[11.5px] font-mono font-bold text-white/50 min-w-[42px] text-right">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={toggleShuffle}
                        title="Shuffle Playlist"
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                          isShuffle
                            ? 'bg-[#F2A900]/25 border-[#F2A900] text-[#FEF08A] shadow-[0_0_12px_rgba(242,169,0,0.35)]'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-[#38BDF8]'
                        }`}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span className="hidden md:inline text-[10px]">Shuffle</span>
                      </button>

                      <button
                        type="button"
                        onClick={playPrevTrack}
                        title="Previous Track"
                        className="p-2 rounded-xl text-xs font-bold border bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-[#38BDF8] transition-all"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={toggleOstPlay}
                        className={`py-2 px-5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 shadow-lg ${
                          isOstPlaying
                            ? 'bg-gradient-to-r from-[#38BDF8] to-[#0284C7] border-[#BAE6FD] text-black shadow-[0_0_18px_rgba(56,189,248,0.5)]'
                            : 'bg-gradient-to-r from-[#FACC15] to-[#CA8A04] border-[#FEF08A] text-black shadow-[0_0_18px_rgba(250,204,21,0.5)]'
                        }`}
                      >
                        {isOstPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                        <span>{isOstPlaying ? 'Pause' : 'Play'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={playNextTrack}
                        title="Next Track"
                        className="p-2 rounded-xl text-xs font-bold border bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-[#38BDF8] transition-all"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={toggleRepeatMode}
                        title="Repeat Mode"
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                          repeatMode !== 'off'
                            ? 'bg-[#F2A900]/25 border-[#F2A900] text-[#FEF08A] shadow-[0_0_12px_rgba(242,169,0,0.35)]'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-[#38BDF8]'
                        }`}
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono">
                          {repeatMode === 'one' ? '1' : (repeatMode === 'all' ? 'ALL' : 'OFF')}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Volume Slider */}
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="text-white/70 hover:text-[#38BDF8] transition-colors"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-[#F87171]" /> : <Volume2 className="w-4 h-4 text-[#7DD3FC]" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(e.target.value)}
                          className="w-16 h-1.5 cursor-pointer accent-[#FACC15]"
                          title="Volume"
                        />
                      </div>

                      {/* Queue Drawer Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowQueueDrawer((prev) => !prev)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          showQueueDrawer
                            ? 'bg-[#38BDF8]/25 border-[#38BDF8] text-[#7DD3FC] shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                            : 'bg-black/40 border-white/10 text-white/70 hover:border-[#38BDF8] hover:text-white'
                        }`}
                      >
                        <ListMusic className="w-4 h-4" />
                        <span>Queue</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#FACC15]/20 text-[#FEF08A] border border-[#FACC15]/40">
                          {queue.length}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Queue Drawer */}
              {showQueueDrawer && (
                <div className="rounded-xl bg-[#060A16]/95 border border-[#38BDF8]/30 p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2 text-xs font-display font-bold text-[#7DD3FC]">
                      <ListMusic className="w-4 h-4" />
                      <span>Active Playback Queue ({queue.length} Track{queue.length !== 1 ? 's' : ''})</span>
                    </div>
                    {queue.length > 0 && (
                      <button
                        type="button"
                        onClick={clearQueue}
                        className="text-[10px] font-bold text-[#F87171] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Queue
                      </button>
                    )}
                  </div>

                  {queue.length === 0 ? (
                    <div className="text-center py-4 text-xs text-white/50">
                      Queue is currently empty. Click <b className="text-[#38BDF8]">+ Queue</b> on any track below to line up your playlist.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {queue.map((qTrackId, qIdx) => {
                        const qTrack = LANDING_OST_TRACKS.find((t) => t.id === qTrackId) || { name: qTrackId, duration: '2:50', icon: '🎵', zone: 'Realm' };
                        return (
                          <div
                            key={`${qTrackId}-${qIdx}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10 text-xs hover:border-[#38BDF8]/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FACC15]/15 text-[#FDE047] border border-[#FACC15]/30">
                                #{qIdx + 1}
                              </span>
                              <span>{qTrack.icon}</span>
                              <span className="font-semibold text-white/90">{qTrack.name}</span>
                              <span className="text-[10px] text-[#38BDF8] hidden sm:inline">&bull; {qTrack.zone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/50 font-mono">{qTrack.duration}</span>
                              <button
                                type="button"
                                onClick={() => playQueuedItem(qIdx)}
                                className="py-1 px-2 rounded bg-[#F2A900]/20 hover:bg-[#F2A900]/30 border border-[#F2A900]/50 text-[#FDE047] text-[10px] font-bold transition-all"
                              >
                                Play Now
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromQueue(qIdx)}
                                className="p-1 rounded text-white/40 hover:text-[#F87171] transition-colors"
                                title="Remove from Queue"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TRACKS LIST UNDERNEATH (QUEUEABLE REPOSITORY) */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎼</span>
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    OFFICIAL SOUNDTRACK CATALOG (15 MASTER TRACKS)
                  </h3>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={trackSearchQuery}
                    onChange={(e) => setTrackSearchQuery(e.target.value)}
                    placeholder="Search tracks by name, key, lore..."
                    className="py-1.5 px-3 pl-8 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/40 focus:border-[#38BDF8] outline-none w-64 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Tracks (15)' },
                  { id: 'Factions', label: '☀️ Factions (4)' },
                  { id: 'Biomes & Havens', label: '🗺️ Biomes & Havens (4)' },
                  { id: 'Combat & Arenas', label: '⚔️ Combat & Arenas (4)' },
                  { id: 'Cinematic Themes', label: '🎬 Cinematic Themes (3)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTrackCategoryFilter(cat.id)}
                    className={`py-1.5 px-3.5 rounded-full text-xs font-bold border transition-all ${
                      trackCategoryFilter === cat.id
                        ? 'bg-gradient-to-r from-[#FACC15]/25 to-[#38BDF8]/25 border-[#FACC15] text-[#FEF08A] shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                        : 'bg-black/40 border-white/10 text-white/70 hover:border-[#38BDF8] hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Track Table / List */}
              <div className="space-y-2">
                {LANDING_OST_TRACKS.filter((t) => {
                  if (trackCategoryFilter !== 'all' && t.category !== trackCategoryFilter) return false;
                  if (trackSearchQuery) {
                    const q = trackSearchQuery.toLowerCase();
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.zone.toLowerCase().includes(q) ||
                      t.desc.toLowerCase().includes(q) ||
                      t.key.toLowerCase().includes(q) ||
                      String(t.bpm).includes(q)
                    );
                  }
                  return true;
                }).map((t, idx) => {
                  const isCurrent = currentOstTrackId === t.id;
                  const isPlayingThis = isCurrent && isOstPlaying;
                  const qPos = queue.indexOf(t.id);
                  const isQueued = qPos !== -1;

                  return (
                    <div
                      key={t.id}
                      onClick={() => playOstTrack(t.id)}
                      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#FACC15]/15 via-[#0F172A] to-[#38BDF8]/15 border-[#FACC15] shadow-[0_0_18px_rgba(250,204,21,0.25)]'
                          : 'bg-[#0B1020]/70 border-white/10 hover:border-[#38BDF8]/40 hover:bg-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Track Index or Playing Indicator */}
                        <div className="w-7 text-center font-mono font-bold text-xs flex items-center justify-center">
                          {isPlayingThis ? (
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span className="w-0.5 bg-[#38BDF8] h-3 animate-pulse rounded-full" />
                              <span className="w-0.5 bg-[#FACC15] h-3.5 animate-bounce rounded-full" />
                              <span className="w-0.5 bg-[#4ADE80] h-2 animate-pulse rounded-full" />
                            </div>
                          ) : (
                            <span className={isCurrent ? 'text-[#FACC15]' : 'text-white/40'}>
                              {isCurrent ? '▶' : `#${idx + 1}`}
                            </span>
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="text-xl flex-shrink-0">{t.icon}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className={`font-display font-bold text-sm tracking-wide truncate ${isCurrent ? 'text-[#FEF08A]' : 'text-white'}`}>
                              {t.name}
                            </h5>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[#38BDF8] hidden md:inline">
                              {t.zone}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-white/50 truncate max-w-xl">
                            {t.desc}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-[#FACC15] font-bold bg-[#FACC15]/10 px-2 py-0.5 rounded border border-[#FACC15]/30">
                            {t.bpm} BPM &bull; {t.key}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-semibold text-white/50 min-w-[36px] text-right">
                          {t.duration}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => playOstTrack(t.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                              isPlayingThis
                                ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#7DD3FC]'
                                : 'bg-[#F2A900]/15 hover:bg-[#F2A900]/25 border-[#F2A900]/40 text-[#FDE047]'
                            }`}
                          >
                            {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                            <span className="hidden sm:inline">{isPlayingThis ? 'Pause' : 'Play'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => (isQueued ? removeFromQueue(qPos) : addToQueue(t.id))}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                              isQueued
                                ? 'bg-[#4ADE80]/20 border-[#4ADE80] text-[#86EFAC]'
                                : 'bg-black/40 hover:bg-[#38BDF8]/15 border-white/10 hover:border-[#38BDF8] text-white/70 hover:text-white'
                            }`}
                          >
                            {isQueued ? (
                              <>
                                <Check className="w-3 h-3 text-[#4ADE80]" />
                                <span>Queue #{qPos + 1}</span>
                              </>
                            ) : (
                              <>
                                <ListPlus className="w-3 h-3" />
                                <span>+ Queue</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

              {/* OFFICIAL DUAL LAUNCH TRAILER (YOUTUBE EMBED) */}
              <section className="rounded-3xl p-6 lg:p-10 border-2 border-[#F2A900]/40 bg-gradient-to-br from-[#0F172A] via-[#090E1E] to-[#050814] shadow-[0_0_35px_rgba(242,169,0,0.25)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2A900] px-2.5 py-1 rounded bg-[#F2A900]/15 border border-[#F2A900]/40">
                      Official Reveal Trailer • Launching Dec 5, 2026
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                      ⚔️ GLIMMERFALL OFFICIAL DUAL LAUNCH TRAILER
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://youtu.be/2e8E0vjLcLg"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Watch on YouTube
                    </a>
                  </div>
                </div>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#334155] shadow-2xl bg-black">
                  <iframe
                    src="https://www.youtube.com/embed/2e8E0vjLcLg?rel=0&modestbranding=1"
                    title="GlimmerFall — Official Dual Launch Trailer (Launching December 5, 2026)"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/70 pt-2">
                  <span>One canonical universe. Two ways to play: <b className="text-[#FDE047]">2D MMORPG</b> &amp; <b className="text-[#38BDF8]">Tactical TCG</b>.</span>
                  <span className="text-[#38BDF8] font-semibold">Official Release: December 5, 2026</span>
                </div>
              </section>

              {/* 4 CANONICAL FACTIONS SHOWCASE */}
              <section className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-[#1E293B]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2A900] px-2.5 py-1 rounded bg-[#F2A900]/10 border border-[#F2A900]/30">
                      Continental Creeds
                    </span>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                      🏛️ THE FOUR ELEMENTAL FACTIONS
                    </h2>
                  </div>
                  <button
                    onClick={() => setTab('atlas')}
                    className="text-xs text-[#38BDF8] hover:underline font-bold flex items-center gap-1"
                  >
                    Read World Lore <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.keys(FACTIONS_DATA).map((facKey) => {
                    const f = FACTIONS_DATA[facKey];
                    return (
                      <div
                        key={facKey}
                        className="p-5 rounded-2xl bg-black/40 border border-[#1E293B] hover:border-[#F2A900] transition-all flex flex-col justify-between"
                        style={{ borderLeftColor: f.color, borderLeftWidth: 4 }}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-display font-bold text-base" style={{ color: f.color }}>
                              {facKey}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-black/60 border border-white/10" style={{ color: f.color }}>
                              {f.aspect}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-white/90">{f.name}</div>
                          <p className="text-[11px] text-white/60 leading-relaxed">{f.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            handleFactionSelect(facKey);
                            setTab('forge');
                          }}
                          className="mt-4 w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center"
                          style={{ borderColor: `${f.color}60`, color: f.color, backgroundColor: `${f.color}15` }}
                        >
                          Forge {facKey} Champion ➔
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: 1080P CINEMATICS THEATRE                          */}
          {/* ======================================================== */}
          {activeTab === 'theatre' && (
            <div className="space-y-8">
              <section id="theatre" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] px-2.5 py-1 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                Official 1080p Media
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                🎬 1080P CINEMATICS THEATRE
              </h2>
            </div>
            <div className="text-xs text-white/60">
              12 High-Definition Story Scenes &bull; 4 Faction Awakenings
            </div>
          </div>

          {/* Primary High-Definition Video Player */}
          <div className="rounded-2xl overflow-hidden border-2 border-[#FACC15]/40 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(250,204,21,0.15)] bg-black">
            <div className="p-3 bg-gradient-to-r from-[#FACC15]/15 to-[#0A1224] border-b border-[#1E293B] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎬</span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#FDE047]">
                  CURRENT SCREENING: {activeCinematic.title}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] font-bold">
                {activeCinematic.category} &bull; {activeCinematic.duration} &bull; 1080p Full HD
              </span>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {activeCinematic.youtubeId ? (
                <iframe
                  id="theatre-main-iframe"
                  key={activeCinematic.youtubeId}
                  src={`https://www.youtube.com/embed/${activeCinematic.youtubeId}?autoplay=${isTheatreAutoplay ? '1' : '0'}&rel=0`}
                  title={activeCinematic.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  id="theatre-main-video"
                  key={activeCinematic.url}
                  src={activeCinematic.url}
                  poster={activeCinematic.poster || LOGO_PATH}
                  controls
                  playsInline
                  preload="metadata"
                  autoPlay={isTheatreAutoplay}
                  onEnded={() => {
                    if (isTheatreAutoplay) {
                      handleAdvanceCinematic(1);
                    }
                  }}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-3 bg-[#070C1A] border-t border-[#1E293B] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdvanceCinematic(-1)}
                  className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1"
                >
                  ⏮️ Prev Clip
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvanceCinematic(1)}
                  className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1"
                >
                  Next Clip ⏭️
                </button>
              </div>
              <button
                type="button"
                id="theatre-autoplay-toggle"
                onClick={() => setIsTheatreAutoplay(!isTheatreAutoplay)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isTheatreAutoplay
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#34D399] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-black/40 border-[#64748B] text-[#94A3B8] hover:border-white/40 hover:text-white'
                }`}
              >
                <span>{isTheatreAutoplay ? '🔁' : '▶️'}</span>
                <span>AUTOPLAY: {isTheatreAutoplay ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="p-4 bg-[#070C1A] border-t border-[#1E293B]">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="font-bold text-xs text-[#FDE047]">🎬 {activeCinematic.title}</span>
                <span className="text-[10px] text-[#38BDF8] font-semibold">{activeCinematic.category} &bull; {activeCinematic.duration}</span>
              </div>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">{activeCinematic.desc}</p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1E293B]">
            {['All', 'Prologue', 'Solari', 'Umbri', 'Terra', 'Aether', 'World Boss', 'Victory', '3v3 Warzone'].map((cat) => (
              <button
                key={cat}
                onClick={() => setTheatreCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  theatreCategoryFilter === cat
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#7DD3FC] shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                    : 'bg-black/40 border-[#1E293B] text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 12 Scenes Selector Grid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-white/70 uppercase">
              <span>SELECT SCENE TO SCREEN (12 CANONICAL CHAPTERS)</span>
              <span className="text-[#38BDF8] text-[10px]">CLICK CARD TO PLAY IN 1080P</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {LANDING_CINEMATICS
                .filter((sc) => theatreCategoryFilter === 'All' || sc.category === theatreCategoryFilter)
                .map((sc) => {
                  const isSel = selectedCinematicId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedCinematicId(sc.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        isSel
                          ? 'bg-[#0E1B36] border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.35)] scale-[1.02]'
                          : 'bg-black/40 border-[#1E293B] hover:border-[#FACC15] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-base">{sc.icon}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[#38BDF8] font-bold">
                          {sc.category} &bull; {sc.duration}
                        </span>
                      </div>
                      <div className="font-display font-bold text-xs text-white line-clamp-1">{sc.title}</div>
                      <div className="text-[10px] text-white/50 line-clamp-2 leading-tight">{sc.desc}</div>
                    </button>
                  );
                })}
            </div>
          </div>
        </section>
      </div>
    )}

    {/* ======================================================== */}
    {/* TAB 3: CHAMPION FORGE                                    */}
    {/* ======================================================== */}
    {activeTab === 'forge' && (
      <div className="space-y-8">
        <section id="forge" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-8">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2A900] px-2.5 py-1 rounded bg-[#F2A900]/10 border border-[#F2A900]/30">
                Forge Your Identity
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                ⚔️ CHAMPION LOADOUT FORGE
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={randomizeName}
                className="py-2 px-3.5 rounded-xl bg-black/40 border border-[#334155] text-xs font-bold text-white/80 hover:text-white hover:border-[#F2A900] transition-colors flex items-center gap-1.5"
              >
                <Dices className="w-4 h-4 text-[#F2A900]" /> Random Moniker
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Controls (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Moniker Input */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-2">
                  1. CHAMPION MONIKER &amp; TITLE
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value.slice(0, 18))}
                    maxLength={18}
                    placeholder="Enter hero name..."
                    className="w-full py-4 px-5 rounded-2xl bg-black/60 border-2 border-[#1E293B] focus:border-[#F2A900] outline-none text-lg font-bold text-white tracking-wide transition-all shadow-inner"
                  />
                  <span className="absolute right-4 top-4 text-xs font-mono text-white/40">
                    {characterName.length}/18
                  </span>
                </div>
              </div>

              {/* Faction Allegiance */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-2">
                  2. CANONICAL FACTION ALLEGIANCE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.keys(FACTIONS_DATA).map((facKey) => {
                    const f = FACTIONS_DATA[facKey];
                    const isSelected = selectedFaction === facKey;
                    return (
                      <button
                        key={facKey}
                        onClick={() => handleFactionSelect(facKey)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? `${f.border} ${f.badgeBg} shadow-[0_0_20px_rgba(0,0,0,0.6)] scale-[1.02]`
                            : 'border-[#1E293B] bg-black/30 hover:border-white/20'
                        }`}
                      >
                        <div className="font-display font-bold text-sm" style={{ color: f.color }}>
                          {facKey}
                        </div>
                        <div className="text-[10px] text-white/80 font-medium mt-0.5">{f.aspect}</div>
                        <div className="text-[9.5px] text-white/50 mt-1 line-clamp-1">{f.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Archetype & Classes */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-2">
                  3. PLAYABLE ARCHETYPE &amp; ROLE ({selectedFaction})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentFaction.classes.map((cls) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => { setSelectedClassId(cls.id); playSfx('click'); }}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? `${currentFaction.border} ${currentFaction.badgeBg} shadow-[0_0_20px_rgba(0,0,0,0.6)]`
                            : 'border-[#1E293B] bg-black/30 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-display font-bold text-base text-white">{cls.name}</span>
                          <span className="text-[9.5px] px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/70">
                            {cls.armor}
                          </span>
                        </div>
                        <div className="text-xs font-semibold mt-1" style={{ color: currentFaction.color }}>
                          {cls.role}
                        </div>
                        <p className="text-[11px] text-white/70 mt-2 line-clamp-2 leading-relaxed">
                          {cls.desc}
                        </p>
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1">
                          {cls.rites.map((r) => (
                            <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-white/60">
                              {r}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Crest */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-white/70 mb-2">
                  4. ORDER CREST &bull; HERALDRY TAG
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allowedOrdersForFaction.map((o) => {
                    const isSelected = selectedOrderTag === o.tag;
                    return (
                      <button
                        key={o.tag}
                        onClick={() => { setSelectedOrderTag(o.tag); playSfx('click'); }}
                        className={`py-3 px-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#F2A900] bg-[#F2A900]/15 text-[#F2A900] font-bold shadow-[0_0_12px_rgba(242,169,0,0.3)]'
                            : 'border-[#1E293B] bg-black/30 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <div className="font-mono text-xs font-black">[{o.tag}] {o.emblem}</div>
                        <div className="text-[10px] text-white/60">{o.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Pedestal Card (4 cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 p-6 rounded-3xl bg-black/50 border-2 border-[#1E293B] space-y-6 shadow-2xl">
                <div className="text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                    Visage Pedestal Preview
                  </span>
                  <div className="w-24 h-24 mx-auto my-4 rounded-2xl bg-[#080E1C] border-2 border-[#F2A900] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(242,169,0,0.3)]">
                    ⚔️
                  </div>
                  <h3 className="font-display font-black text-xl text-white">
                    {characterName || 'Vanguard'}
                  </h3>
                  <div className="text-xs text-[#38BDF8] font-semibold mt-0.5">
                    [{currentOrder.tag}] • {activeClassObj.name}
                  </div>
                  <div className="text-[11px] font-bold mt-1" style={{ color: currentFaction.color }}>
                    {currentFaction.name} ({currentFaction.aspect})
                  </div>
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-black/60 border border-[#1E293B]">
                    <div className="text-[10px] text-white/50 font-bold">HEALTH</div>
                    <div className="text-sm font-mono font-black text-[#4ADE80]">❤️ 40 / 40 HP</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-[#1E293B]">
                    <div className="text-[10px] text-white/50 font-bold">GLIMMER</div>
                    <div className="text-sm font-mono font-black text-[#38BDF8]">🔮 100 Glimmer</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#091224] border border-[#1E293B] text-xs text-white/70 space-y-1">
                  <div className="flex justify-between">
                    <span>Starting Leyline:</span>
                    <b className="text-white">Sanctuary Haven</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Armor Class:</span>
                    <b className="text-[#F2A900]">{activeClassObj.armor}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Starter Rite:</span>
                    <b className="text-[#38BDF8]">{activeClassObj.primary}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Faction Mechanic:</span>
                    <b style={{ color: currentFaction.color }}>{currentFaction.resource}</b>
                  </div>
                </div>

                <button
                  onClick={handleLaunchGame}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F2A900] to-[#EAB308] text-black font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(242,169,0,0.4)]"
                >
                  ⚡ Enter World With Champion
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )}

    {/* ======================================================== */}
    {/* TAB 4: GAMEPLAY SYSTEMS ARCHITECTURE & ENCYCLOPEDIA      */}
    {/* ======================================================== */}
    {activeTab === 'systems' && (
      <div className="space-y-8">
        {/* CORE GAMEPLAY SYSTEMS SHOWCASE (#systems) */}
        <section id="systems" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4ADE80] px-2.5 py-1 rounded bg-[#4ADE80]/10 border border-[#4ADE80]/30">
                Core Gameplay Architecture
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                ⚙️ CONTINENTAL GAMEPLAY SYSTEMS
              </h2>
            </div>
            <div className="text-xs text-white/60">
              Real-Time Combat &bull; 7 Disciplines &bull; 3-Socket Runewords &bull; 2% Economy
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYSTEMS_SHOWCASE.map((sys) => (
              <div
                key={sys.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#0E172C]/80 to-[#090E1C]/90 border border-white/10 hover:border-[#FACC15]/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:-translate-y-1 flex flex-col justify-between"
                style={{ borderLeftColor: sys.color, borderLeftWidth: 4 }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-display font-bold text-sm flex items-center gap-2" style={{ color: sys.color }}>
                      <span>{sys.icon}</span>
                      <span>{sys.title}</span>
                    </div>
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                      style={{
                        backgroundColor: `${sys.badgeColor}18`,
                        color: sys.badgeColor,
                        borderColor: `${sys.badgeColor}40`,
                      }}
                    >
                      {sys.badge}
                    </span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">{sys.desc}</p>

                  <ul className="space-y-1.5 pt-2 border-t border-white/5">
                    {sys.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-white/60">
                        <span className="text-[#38BDF8] font-bold">▸</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {sys.id === 'runewords' && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/50 font-bold">Runewords:</span>
                    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-black/60 border border-white/15 text-[#FACC15] font-bold">SOL-UM-TER</span>
                    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-black/60 border border-white/15 text-[#38BDF8] font-bold">AETH-AETH-SOL</span>
                    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-black/60 border border-white/15 text-[#4ADE80] font-bold">TER-TER-UM</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* GAME SYSTEMS ENCYCLOPEDIA SECTION (#game-encyclopedia) */}
        {/* ======================================================== */}
        <section id="game-encyclopedia" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] px-2.5 py-1 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                Official Reference Manual
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                🎮 GAME SYSTEMS ENCYCLOPEDIA
              </h2>
            </div>
            {/* Tab Switchers */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                { id: 'combat', label: '⚔️ Combat Dynamics' },
                { id: 'resources', label: '⚡ 4 Faction Resources' },
                { id: 'skills', label: '📜 7 Disciplines' },
                { id: 'persistence', label: '💾 State Persistence' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveEncTab(tab.id); playSfx('click'); }}
                  className={`py-2 px-3.5 rounded-xl border transition-all ${
                    activeEncTab === tab.id
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#7DD3FC] shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                      : 'bg-black/30 border-[#1E293B] text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeEncTab === 'combat' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#F2A900] mb-1">🗡️ Attack Cleave Arcs &amp; Hitboxes</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Melee strikes deliver a 90-degree frontal cleave covering 34 pixels. Projectiles track omni-directional vectors with 16px radius hitboxes. Real-time client prediction synchronizes seamlessly with the online server.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#38BDF8] mb-1">⏱️ 1.5s Global Cooldown &amp; Spell Queuing</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    All major Rites and martial arts observe a 1.5-second GCD. Any input registered within 0.3s of GCD completion is queued automatically, enabling butter-smooth zero-latency spell combos.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#4ADE80] mb-1">🛡️ Hyperbolic Armor Mitigation</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Incoming physical strikes undergo hyperbolic reduction: <code className="text-[#F2A900]">Damage Reduction = Armor / (Armor + 100)</code>. Heavy plate wearers achieve up to 65% passive mitigation against physical hits.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#9B30FF] mb-1">💥 Critical Multipliers &amp; Flashes</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Base critical strikes inflict 150% damage. Investing in the Flashes skill and socketing ancient TCG relics elevates critical chance by up to +12% and critical damage multipliers beyond 220%.
                  </p>
                </div>
              </div>
            )}

            {activeEncTab === 'resources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-[#F2A900]/40">
                  <h4 className="font-display font-bold text-sm text-[#F2A900] mb-1">☀️ Solari: Solar Charge &amp; Zenith State (Solar Light / Gold)</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Striking enemies builds Solar Charge (0-100). Reaching 100 triggers the blinding Zenith State, granting +25% movespeed, holy radiance pulse damage, and resetting cooldown on Solar Flare.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#9B30FF]/40">
                  <h4 className="font-display font-bold text-sm text-[#9B30FF] mb-1">🌙 Umbri: Void Resonance &amp; Dusk Shroud (Void / Amethyst)</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Channeling dark arts fuels Void Resonance. Consuming resonance activates Dusk Shroud, cloaking the assassin from enemy unit frames and providing guaranteed critical strikes.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#22E07B]/40">
                  <h4 className="font-display font-bold text-sm text-[#22E07B] mb-1">🌿 Terra: Root Armor &amp; Bedrock (Verdant Root / Emerald)</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Absorbing physical strikes cultivates living root bark. When shattered, Root Armor triggers a thorn shockwave that roots all adjacent assailants and reflects incoming melee damage.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#00BFFF]/40">
                  <h4 className="font-display font-bold text-sm text-[#00BFFF] mb-1">🌀 Aether: Chronoflux &amp; Flash Tempo (Celestial Mist / Cyan)</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Chronoflux fluctuates dynamically. Harnessing flux accelerates cooldown recovery, bends projectile vectors, and empowers Rites to Echo for +45% bonus arcane damage.
                  </p>
                </div>
              </div>
            )}

            {activeEncTab === 'skills' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROFESSIONS.map((prof) => (
                  <div key={prof.id} className="p-4 rounded-xl bg-black/40 border border-[#1E293B]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{prof.icon}</span>
                      <span className="font-display font-bold text-xs text-white">{prof.name}</span>
                    </div>
                    <p className="text-[11px] text-white/60">{prof.desc}</p>
                    <div className="mt-2 text-[10px] font-bold" style={{ color: prof.color }}>
                      Unlocks up to Level 99 Mastery Cape
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeEncTab === 'persistence' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#4ADE80] mb-1">❤️ Exact Health &amp; Glimmer Persistence</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Logging out or switching views preserves your exact current HP and Glimmer reservoir down to the single integer. Re-logging never resets your accumulated charges.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#38BDF8] mb-1">🏛️ Exact World Coordinate Resuming</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Your character's coordinates (roomType, X, Y) are permanently committed to browser storage and PostgreSQL. You always spawn right where you stepped out of the realm.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#F2A900] mb-1">🛡️ Clean Monster Respawn &amp; Aggro Wipe</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Respawning creatures enforce a 2.0-second spawn grace period. Aggro tethers, dammer lists, and combat targets are wiped completely clean upon respawn.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#9B30FF] mb-1">⚡ 3v3 Arena Safe Return Teleport</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Upon conclusion of a 3v3 match, champions are teleported safely back to their exact pre-arena coordinates, retaining all trophies, bounties, and rewards.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    {/* ======================================================== */}
    {/* TAB 5: ARMORY & TCG RELICS */}
    {/* ======================================================== */}
    {activeTab === 'armory' && (
      <motion.div
        key="tab-armory"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-8"
      >
        {/* CONTINENTAL ARMORY SECTION (#armory) */}
        <section id="armory" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#22E07B] px-2.5 py-1 rounded bg-[#22E07B]/10 border border-[#22E07B]/30">
                Complete Canonical Equipment Database
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                🛡️ CONTINENTAL ARMORY &amp; RELIC VAULT ({filteredArmoryItems.length} / {wearableArmoryItems.length})
              </h2>
            </div>
            <div className="relative">
              <input
                type="text"
                value={armorySearch}
                onChange={(e) => setArmorySearch(e.target.value)}
                placeholder="Search gear, slot, faction, rarity..."
                className="py-2 px-3.5 pl-9 rounded-xl bg-black/60 border border-[#1E293B] focus:border-[#F2A900] text-xs text-white placeholder-white/40 outline-none w-64 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Slot Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${wearableArmoryItems.length})` },
              { id: 'weapon', label: '⚔️ Weapons' },
              { id: 'shield', label: '🛡️ Shields & Offhands' },
              { id: 'head', label: '🪖 Helms' },
              { id: 'body', label: '🥋 Chestplates' },
              { id: 'legs', label: '👖 Greaves' },
              { id: 'gloves', label: '🧤 Gauntlets' },
              { id: 'boots', label: '🥾 Treads' },
              { id: 'cape', label: '🧣 Mastery Capes' },
              { id: 'jewelry', label: '💍 Rings & Amulets' },
              { id: 'sockets', label: '💎 Gems, Runes & Relics' },
            ].map((slot) => (
              <button
                key={slot.id}
                onClick={() => setArmorySlotFilter(slot.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  armorySlotFilter === slot.id
                    ? 'bg-[#F2A900]/20 border-[#F2A900] text-[#FDE047] shadow-[0_0_12px_rgba(242,169,0,0.3)]'
                    : 'bg-black/40 border-[#1E293B] text-white/65 hover:text-white hover:border-white/25'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>

          {/* Rarity Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Rarity:</span>
            {['all', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'].map((rar) => (
              <button
                key={rar}
                onClick={() => setArmoryRarityFilter(rar)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase border transition-all ${
                  armoryRarityFilter === rar
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#7DD3FC]'
                    : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {rar === 'all' ? 'All Tiers' : rar}
              </button>
            ))}
          </div>

          {/* Complete Canonical Armory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredArmoryItems.map((item) => {
              const rar = (item.rarity || 'common').toLowerCase();
              const rarColor =
                rar === 'mythic' ? '#f43f5e' :
                rar === 'legendary' ? '#facc15' :
                rar === 'epic' ? '#c084fc' :
                rar === 'rare' ? '#38bdf8' :
                rar === 'uncommon' ? '#4ade80' : '#94a3b8';
              const slotIcons = {
                weapon: '⚔️', shield: '🛡️', offhand: '🛡️', head: '🪖',
                body: '🥋', armor: '🥋', legs: '👖', gloves: '🧤',
                boots: '🥾', cape: '🧣', ring: '💍', amulet: '📿',
                gem: '💎', rune: '🪨', relic: '🃏',
              };
              const icon = item.icon || slotIcons[item.slot] || '🛡️';
              const statsObj = item.stats || {};
              const statBadges = [];
              if (item.damage || statsObj.damage) statBadges.push(`+${item.damage || statsObj.damage} Dmg`);
              if (item.armor || statsObj.armor) statBadges.push(`+${item.armor || statsObj.armor} Armor`);
              if (statsObj.power) statBadges.push(`+${statsObj.power} Power`);
              if (statsObj.bastion) statBadges.push(`+${statsObj.bastion} Bastion`);
              if (statsObj.resonance) statBadges.push(`+${statsObj.resonance} Resonance`);
              if (statsObj.tempo) statBadges.push(`+${statsObj.tempo} Tempo`);
              if (statsObj.maxHp) statBadges.push(`+${statsObj.maxHp} HP`);
              if (statsObj.critChance) statBadges.push(`+${Math.round(statsObj.critChance * 100)}% Crit`);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="p-4 rounded-2xl bg-black/50 border transition-all flex flex-col justify-between"
                  style={{ borderColor: `${rarColor}45` }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xl p-2 rounded-xl bg-black/70 border border-white/10">{icon}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-[9px] px-2 py-0.5 rounded font-bold uppercase"
                          style={{ backgroundColor: `${rarColor}20`, color: rarColor, border: `1px solid ${rarColor}50` }}
                        >
                          {item.rarity || 'Common'}
                        </span>
                        <span className="text-[9px] text-white/45 font-mono uppercase">
                          {item.slot} {item.reqLevel ? `• Lv.${item.reqLevel}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="font-display font-bold text-xs text-white mt-2.5" style={{ color: rarColor }}>
                      {item.name}
                    </div>
                    {statBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {statBadges.map((sb) => (
                          <span key={sb} className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#0F172A] border border-white/10 text-[#7DD3FC] font-mono font-bold">
                            {sb}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.desc && (
                      <p className="text-[10px] text-white/60 mt-2 leading-relaxed line-clamp-3">{item.desc}</p>
                    )}
                  </div>
                  {item.faction && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-[9.5px] font-bold text-white/50 flex justify-between">
                      <span>Faction Alignment</span>
                      <span className="text-[#FDE047]">{item.faction}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CANONICAL 4-PIECE COVENANT ARMOR SETS & 3-SOCKET RUNEWORDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-black/50 border border-[#F2A900]/30 space-y-3">
              <h4 className="font-display font-bold text-sm text-[#FDE047] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FDE047]" /> Canonical 4-Piece Covenant Armor Sets
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(CANONICAL_SETS || {}).map((setObj) => (
                  <div key={setObj.id} className="p-3.5 rounded-xl bg-[#080E1C] border border-[#1E293B] space-y-1">
                    <div className="font-display font-bold text-xs" style={{ color: setObj.color || '#FDE047' }}>
                      {setObj.name}
                    </div>
                    <div className="text-[10px] text-[#4ADE80] font-semibold">
                      4-Piece Set Bonus: {setObj.bonusTitle || setObj.effectName || 'Awakened Synergy'}
                    </div>
                    <p className="text-[10px] text-white/60 leading-snug">
                      {setObj.bonusDesc || setObj.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/50 border border-[#38BDF8]/30 space-y-3">
              <h4 className="font-display font-bold text-sm text-[#7DD3FC] flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#7DD3FC]" /> Ancient 3-Socket Runeword Synergies
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(RUNEWORD_SYNERGIES || {}).map((rw) => (
                  <div key={rw.id || rw.word} className="p-3.5 rounded-xl bg-[#080E1C] border border-[#1E293B] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs" style={{ color: rw.color || '#38BDF8' }}>
                        {rw.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#FDE047]">
                        {rw.word}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#38BDF8] font-semibold">{rw.perkTitle}</div>
                    <p className="text-[10px] text-white/60 leading-snug">{rw.perkDesc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LEYLINE CURRENCIES TREASURY */}
          <div className="mt-6 p-5 rounded-2xl bg-black/50 border border-white/10">
            <h4 className="font-display font-bold text-sm text-[#FDE047] mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#FDE047]" /> Continental Leyline Currencies &amp; Vault Treasury
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'Glimmer Shards', icon: '💎', color: '#38BDF8', desc: 'Universal barter, repairs & vendor purchases' },
                { name: 'Sunspire Embers', icon: '☀️', color: '#F2A900', desc: 'Solari faction reputation & templar gear' },
                { name: 'Void Amethyst', icon: '🌑', color: '#9B30FF', desc: 'Umbri faction seals & stealth poisons' },
                { name: 'Ironwood Resin', icon: '🌿', color: '#22E07B', desc: 'Terra faction runes & elderwood armors' },
                { name: 'Astral Flux', icon: '🔮', color: '#00BFFF', desc: 'Aether chronocores & teleport keystones' },
                { name: 'Valor Badges', icon: '⚔️', color: '#EF4444', desc: '3v3 Warzone trophies & rated gear' },
              ].map((cur) => (
                <div key={cur.name} className="p-3 rounded-xl bg-[#080E1C] border border-[#1E293B]">
                  <div className="text-xl mb-1">{cur.icon}</div>
                  <div className="text-xs font-bold text-white" style={{ color: cur.color }}>{cur.name}</div>
                  <div className="text-[10px] text-white/60 mt-1 leading-snug">{cur.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUTHENTIC TCG CARDS SECTION (#tcg-cards) */}
        <section id="tcg-cards" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] px-2.5 py-1 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                Official glimmerfalltcg.com Integration
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                🃏 AUTHENTIC TCG CARD RELICS
              </h2>
            </div>
            <a
              href="https://glimmerfalltcg.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
            >
              Explore Full TCG Set <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-white/70">
            Authentic trading card relics sourced directly from <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="text-[#38BDF8] underline font-bold">glimmerfalltcg.com</a>. Socket these rare physical cards into your MMORPG champion's weapon and armor sockets for unique passive traits and stat synergies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Solari Vanguard', role: '+15% Radiant Strike Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
              { name: 'Dawnblade Templar', role: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
              { name: 'Mana Crystal', role: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
              { name: 'Granite Behemoth', role: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
              { name: 'Void Stalker', role: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
              { name: 'Chronocore Prism', role: 'World Nexus Monolith (2500 HP Rule)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
            ].map((c) => (
              <div key={c.name} className="flex gap-3.5 p-4 rounded-2xl bg-black/40 border border-[#1E293B] items-center hover:border-[#38BDF8] transition-all">
                <div className="w-16 h-22 rounded-lg bg-[#080E1C] border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    src={c.img}
                    alt={c.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span className="text-xl text-white/30">🃏</span>
                </div>
                <div>
                  <div className="font-display font-bold text-xs text-white">{c.name}</div>
                  <div className="text-[10.5px] font-bold text-[#38BDF8] mt-1">{c.role}</div>
                  <span className="text-[9px] text-[#4ADE80] font-semibold block mt-1">Socketable TCG Relic</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    )}

    {/* ======================================================== */}
    {/* TAB 6: ATLAS, 3v3 ARENA & WORLD LORE */}
    {/* ======================================================== */}
    {activeTab === 'atlas' && (
      <div className="space-y-8 animate-fade-in">
        {/* WORLD ATLAS SECTION (#atlas) */}
        <section id="atlas" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] px-2.5 py-1 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                Seamless Continental Traversal
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                🗺️ CONTINENTAL REALMS ATLAS
              </h2>
            </div>
            <span className="text-xs text-white/50">8 Continental Biomes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'sanctuary', name: 'Sanctuary Haven', tag: 'Neutral Hub', color: '#F2A900', desc: 'Central city housing the Grand Exchange pavilion, AetherVault banks, and crafting artisans.' },
              { id: 'solari', name: 'Solari Citadel', tag: 'Sunspire Territory', color: '#F2A900', desc: 'Golden marble towers and sun-temples harvesting celestial dawn radiation.' },
              { id: 'umbri', name: 'Umbri Undercity', tag: 'Duskveil Syndicate', color: '#9B30FF', desc: 'Subterranean obsidian caverns lit by glowing violet graveglass lanterns.' },
              { id: 'terra', name: 'Glimmer Orchard', tag: 'Rootdeep Collective', color: '#22E07B', desc: 'Massive towering ancient canopy trees with sentient moss and stonekin elders.' },
              { id: 'aether', name: 'Mirrorgate Spire', tag: 'Astral Conclave', color: '#00BFFF', desc: 'Floating crystal pinnacles bending the temporal lattice and leyline currents.' },
              { id: 'starfall', name: 'Starfall Crater', tag: 'Warzone PvPvE', color: '#F87171', desc: 'Cataclysmic impact site where all 4 factions battle over primal leyline shards.' },
              { id: 'abyssal', name: 'Abyssal Rift', tag: 'High-Level Dungeon', color: '#A855F7', desc: 'Endgame chasm where elite void abominations and corrupted keystones lurk.' },
              { id: 'nexus', name: 'Nexus Warzone', tag: '3v3 Monolith Arena', color: '#EF4444', desc: 'Mirror-symmetric tactical battleground defending 2500-HP Chronocore Monoliths (Last-Hit Wins).' },
            ].map((realm) => (
              <div key={realm.id} className="p-5 rounded-2xl bg-black/40 border border-[#1E293B] hover:border-white/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display font-bold text-sm text-white">{realm.name}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${realm.color}20`, color: realm.color }}>
                    {realm.tag}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{realm.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3v3 NEXUS DESTRUCTION ARENA (#arena) */}
        <section id="arena" className="rounded-3xl p-6 lg:p-10 border border-[#F87171]/30 bg-radial from-[#1E1010] via-[#0D0808] to-[#050404] space-y-6 shadow-2xl">
          <div className="flex justify-between items-center pb-6 border-b border-[#F87171]/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F87171] px-2.5 py-1 rounded bg-[#F87171]/15 border border-[#F87171]/40">
                Competitive Rated PvP
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                ⚡ 3v3 OUTPOST NEXUS DESTRUCTION
              </h2>
            </div>
            <div className="text-xs font-mono font-bold text-[#F87171]">
              2500-HP MONOLITH RULE (LAST-HIT WINS)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10">
              <h4 className="font-display font-bold text-sm text-[#F87171] mb-2">1. Squad Composition</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Teams of 3 clash in mirror-symmetric coliseums. Coordination between Frontline Tanks, Support Marshals, and Burst Assassins dictates lane control.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10">
              <h4 className="font-display font-bold text-sm text-[#F87171] mb-2">2. 2500-HP Monolith Rule (Last-Hit Wins)</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Each team defends a 2500-HP Chronocore Nexus Monolith. The player landing the final blow claims last-hit kill credit and triggers match victory.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10">
              <h4 className="font-display font-bold text-sm text-[#F87171] mb-2">3. Safe Return Teleport</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Match conclusion automatically teleports players back to their exact pre-arena coordinates, depositing bounty trophies straight into their inventory.
              </p>
            </div>
          </div>
        </section>

        {/* WORLD LORE & CHRONICLE SECTION (#lore-chronicle / #lore-tcg) */}
        <section id="lore-chronicle" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <a id="lore-tcg" className="hidden"></a>
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B30FF] px-2.5 py-1 rounded bg-[#9B30FF]/10 border border-[#9B30FF]/30">
                Canonical Universe Chronicle
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                📜 WORLD LORE &amp; CHRONICLE
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                { id: 'shattering', label: '🌌 Chapter I: The Shattered Crystal Heart' },
                { id: 'creeds', label: '🏛️ Chapter II: 4 Faction Creeds' },
                { id: 'legends', label: '👑 Chapter III: Sanctuary Awakening' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveLoreTab(tab.id); playSfx('click'); }}
                  className={`py-2 px-3.5 rounded-xl border transition-all ${
                    activeLoreTab === tab.id
                      ? 'bg-[#9B30FF]/20 border-[#9B30FF] text-[#D8B4FE] shadow-[0_0_10px_rgba(155,48,255,0.3)]'
                      : 'bg-black/30 border-[#1E293B] text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {activeLoreTab === 'shattering' && (
              <div className="p-6 rounded-2xl bg-black/40 border border-[#1E293B] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F2A900] tracking-wider uppercase">
                    CHAPTER I • COSMIC ORIGIN &amp; THE FALL
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#F2A900]/15 text-[#F2A900] border border-[#F2A900]/30 font-bold">
                    THE GREAT FRACTURE
                  </span>
                </div>
                <h4 className="font-display font-bold text-lg text-white">
                  The Shattered Crystal Heart &amp; The Great Glimmer Fracture
                </h4>
                <p className="text-sm text-white/80 leading-relaxed font-head">
                  Before the continental realms took shape, cosmic reality was held in equilibrium by a solitary celestial relic: the <b>Crystal Heart</b>—an iridescent, multi-faceted anatomical heart pulsing with pure rainbow prismatic light in the silence between the radiant Golden Sun and the deep Abyssal Void.
                </p>
                <p className="text-sm text-white/80 leading-relaxed font-head">
                  As cosmic discord escalated, violent violet lightning fissures fractured its chambers. In a cataclysmic detonation known as the <b>Crystalheart Shattering</b>, the Crystal Heart shattered into a rain of flaming iridescent meteor shards that collided with the earth, forging the continent and embedding living Glimmer veins deep into the bedrock.
                </p>
                <p className="text-sm text-white/80 leading-relaxed font-head">
                  With the Crystal Heart destroyed, the unified white Glimmer split into the four canonical elemental aspects:
                </p>

                {/* 1080p Crystal Heart Shattering Video Player */}
                <div className="my-4 rounded-2xl overflow-hidden border-2 border-[#F2A900]/40 shadow-[0_0_30px_rgba(242,169,0,0.25)] bg-black">
                  <video
                    src="https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/crystal_heart_shattering_1080p.mp4"
                    poster="/GlimmerFall_official_multicolor_logo.png"
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-[360px] object-contain bg-black"
                  />
                  <div className="p-3 bg-[#0A0F22] border-t border-[#1E293B] flex items-center justify-between text-xs text-white/70">
                    <span className="font-display font-bold text-[#F2A900]">
                      🎬 Prologue Cinematic • The Shattered Crystal Heart (1080p Full HD)
                    </span>
                    <span className="text-[10px] text-white/50">Canonical Lore Origin</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-black/50 border-l-4 border-l-[#F2A900] border-y border-r border-[#1E293B]">
                    <div className="font-bold text-xs text-[#F2A900]">☀️ Solari — Solar Light / Gold</div>
                    <div className="text-[11px] text-white/70 mt-1">Claimed the dawn-fire facets. Sentinels of the Sunspire Dominion wielding Guard and Zenith radiance.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/50 border-l-4 border-l-[#9B30FF] border-y border-r border-[#1E293B]">
                    <div className="font-bold text-xs text-[#9B30FF]">🌑 Umbri — Void / Amethyst</div>
                    <div className="text-[11px] text-white/70 mt-1">Channeled the necrotic shadow facets. Reapers of the Duskveil Syndicate wielding Stealth and Void Harvest.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/50 border-l-4 border-l-[#22E07B] border-y border-r border-[#1E293B]">
                    <div className="font-bold text-xs text-[#22E07B]">🌿 Terra — Verdant Root / Emerald</div>
                    <div className="text-[11px] text-white/70 mt-1">Bound the root and ironwood facets. Guardians of the Rootdeep Collective wielding Overwhelm and Thornbark reflect.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/50 border-l-4 border-l-[#00BFFF] border-y border-r border-[#1E293B]">
                    <div className="font-bold text-xs text-[#00BFFF]">🔮 Aether — Celestial Mist / Cyan</div>
                    <div className="text-[11px] text-white/70 mt-1">Harnessed the star-weaving chronoflux facets. Scholars of the Astral Conclave wielding Flash Tempo and Echo.</div>
                  </div>
                </div>

                <div className="text-xs text-white/60 italic pt-2 border-t border-white/10">
                  "The Glimmer singing in your blood is not ordinary magic—it is the living life-blood of the shattered Crystal Heart." — Herald Lyra
                </div>
              </div>
            )}

            {activeLoreTab === 'creeds' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#F2A900] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#F2A900]">The Sunspire Dominion</h4>
                  <div className="text-[10px] text-[#F2A900] font-semibold">Aspect: Solar Light / Gold</div>
                  <p className="text-xs text-white/70 mt-1 italic">"May the Sunspire illuminate the darkness."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Sentinels sworn to the Daystar and dawn-fire facets. They construct soaring gilded sunspires to capture raw solar leylines, burning away void corruption with unyielding martial discipline and Zenith empowerment.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#9B30FF] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#9B30FF]">The Duskveil Syndicate</h4>
                  <div className="text-[10px] text-[#9B30FF] font-semibold">Aspect: Void / Amethyst</div>
                  <p className="text-xs text-white/70 mt-1 italic">"In shadows we weave, in silence we strike."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Operating in the subterranean Undercity, they wield the necrotic shadow facets through Graveglass Lanterns, claiming that shadow is the ultimate truth and shield against mortal hubris.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#22E07B] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#22E07B]">The Rootdeep Collective</h4>
                  <div className="text-[10px] text-[#22E07B] font-semibold">Aspect: Verdant Root / Emerald</div>
                  <p className="text-xs text-white/70 mt-1 italic">"Stand unyielding as ancient stone."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Guardians of the giant canopy in Glimmer Orchard communing with the ironwood facets. They defend the ancient stone bedrock and oppose reckless technological mining of planetary leylines.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#00BFFF] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#00BFFF]">The Astral Conclave</h4>
                  <div className="text-[10px] text-[#00BFFF] font-semibold">Aspect: Celestial Mist / Cyan</div>
                  <p className="text-xs text-white/70 mt-1 italic">"Time and space bend to the arcane truth."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Scholars of the Mirrorgate Spire bending the celestial mist and chronoflux facets. Viewing all history as an intricate harmonic tapestry, they accelerate cooldowns and tear reality rifts to rewrite battle outcomes.
                  </p>
                </div>
              </div>
            )}

            {activeLoreTab === 'legends' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#F2A900]">✨ Herald Lyra • Sunspire Herald</h4>
                  <p className="text-xs text-white/70 mt-1">Greets newly awakened Summoner-Knights in Sanctuary Plaza, initiates their awakening trials [WASD &amp; 1], and instructs on the Shattered Crystal Heart.</p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#38BDF8]">🛡️ Commander Valerius • Warlord</h4>
                  <p className="text-xs text-white/70 mt-1">Commands the North Vanguard Post. Directs champions toward the continental warzones and authorizes squad patrols across the perimeter.</p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#22E07B]">🔨 Master Artisan Aldric</h4>
                  <p className="text-xs text-white/70 mt-1">Master of the Artisan Forge. Teaches the cosmic 1.25s cadence of the Crystal Heart, ensuring flawless smithing, tailoring, and void inscription.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    {/* ======================================================== */}
    {/* TAB 7: SETTINGS & PREFERENCES */}
    {/* ======================================================== */}
    {activeTab === 'settings' && (
      <div className="space-y-8 animate-fade-in">
        {/* SETTINGS & PREFERENCES SECTION (#settings) */}
        <section id="settings" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2A900] px-2.5 py-1 rounded bg-[#F2A900]/10 border border-[#F2A900]/30">
                User Preferences &amp; Audio
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                ⚙️ SETTINGS &amp; DISPLAY CONFIGURATION
              </h2>
            </div>
            <span className="text-xs text-white/50">Stored Locally in Browser</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B] space-y-4">
              <h4 className="font-display font-bold text-sm text-[#F2A900]">🎮 Startup &amp; Navigation Preferences</h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                <div>
                  <div className="text-xs font-bold text-white">Start on this site (Hero Loadout)</div>
                  <div className="text-[10.5px] text-white/50">Skip marketing landing page and launch directly into character loadout.</div>
                </div>
                <input
                  type="checkbox"
                  checked={startOnLoadout}
                  onChange={(e) => handleToggleStartOnSite(e.target.checked)}
                  className="w-5 h-5 rounded border-[#334155] text-[#38BDF8] focus:ring-0 cursor-pointer accent-[#38BDF8]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                <div>
                  <div className="text-xs font-bold text-white">Sound Effects Audio</div>
                  <div className="text-[10.5px] text-white/50">Synthesizer audio clicks, ability SFX, and launch fanfares.</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSoundEnabled(!soundEnabled); playSfx('click'); }}
                  className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    soundEnabled
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#7DD3FC]'
                      : 'bg-black/40 border-[#334155] text-white/40'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-[#38BDF8]" /> : <VolumeX className="w-4 h-4 text-white/40" />}
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B] space-y-4">
              <h4 className="font-display font-bold text-sm text-[#38BDF8]">🖥️ Client Engine &amp; Display Specs</h4>
              <div className="space-y-2 text-xs text-white/70">
                <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                  <span>Rendering Pipeline:</span>
                  <b className="text-white">HD Pixel Anti-Aliased Canvas</b>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                  <span>Network Sync:</span>
                  <b className="text-[#4ADE80]">Authoritative Real-Time Sync</b>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                  <span>Artisan Cooldown:</span>
                  <b className="text-[#F2A900]">1.25s Crystalheart Cadence</b>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                  <span>Action Bar Docking:</span>
                  <b className="text-[#38BDF8]">Persistent Viewport Centered Dock</b>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )}

    {/* PERSISTENT MINI MUSIC PLAYER DOCK */}
    {isOstPlaying && (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-[#0A0F22]/95 border border-[#38BDF8]/40 shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-xl animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#38BDF8]/30 to-[#F2A900]/30 border border-[#38BDF8] flex items-center justify-center animate-spin-slow">
          <Music className="w-4 h-4 text-[#FDE047]" />
        </div>
        <div>
          <div className="text-xs font-display font-bold text-[#FDE047] line-clamp-1">{activeOstTrack.name}</div>
          <div className="text-[10px] text-[#38BDF8] font-mono">{activeOstTrack.zone} • {activeOstTrack.bpm} BPM</div>
        </div>
        <button
          onClick={toggleOstPlay}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all ml-1"
          title={isOstPlaying ? 'Pause OST' : 'Play OST'}
        >
          {isOstPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
        <button
          onClick={() => setTab('overview')}
          className="text-[10px] px-2 py-1 rounded bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#7DD3FC] hover:bg-[#38BDF8]/30 font-bold"
        >
          Jukebox ↗
        </button>
      </div>
    )}
        </div>

        {/* FOOTER */}
        <footer className="pt-10 border-t border-[#1E293B] text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img
              src={LOGO_PATH}
              alt="GlimmerFall"
              width={48}
              height={48}
              style={{ maxWidth: 48, maxHeight: 48 }}
              className="sidebar-logo-img h-8 object-contain"
            />
            <span className="font-display font-bold text-sm text-white">GLIMMERFALL ONLINE</span>
          </div>
          <p className="text-xs text-white/50 max-w-lg mx-auto">
            Official 2D Pixel Action MMORPG based on the GlimmerFall Trading Card Game universe.
            Built with authoritative server sync, offline execution, and deep skill mastery.
          </p>
          <div className="flex justify-center gap-6 text-xs text-[#38BDF8]">
            <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="hover:underline">glimmerfalltcg.com</a>
            <a href="https://glimmerfalltcg.com/cards" target="_blank" rel="noreferrer" className="hover:underline">TCG Card Oracle</a>
            <a href="https://glimmerfalltcg.com/rules" target="_blank" rel="noreferrer" className="hover:underline">Rulebook</a>
          </div>
          <div className="text-[10px] text-white/30">
            &copy; 2026 GlimmerFall. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
