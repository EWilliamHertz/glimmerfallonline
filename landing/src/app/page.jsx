'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

const LOGO_PATH = '/GlimmerFall_official_multicolor_logo.png';

// ==========================================
// CANONICAL 4 FACTIONS & 8 ARCHETYPES DATA
// ==========================================
const FACTIONS_DATA = {
  Solari: {
    name: 'The Sunspire Dominion',
    motto: 'May the Sunspire illuminate the darkness.',
    color: '#F2A900',
    border: 'border-[#F2A900]',
    badgeBg: 'bg-[#F2A900]/15',
    resource: 'Solar Charge (0-100) & Zenith State',
    desc: 'Devout holy sentinels worshipping the eternal Solar Core. Building Solar Charge unlocks the blinding Zenith State, boosting movement speed, defense, and holy radiance bursts.',
    classes: [
      {
        id: 'solari_vanguard',
        name: 'Solari Vanguard',
        role: 'Radiant Frontliner • Guard & Zenith',
        armor: 'Heavy Sunforged Plate',
        weapon: 'Solari Spellblade & Radiant Shield',
        primary: 'Radiant Slash',
        rites: ['Radiant Slash', 'Solar Flare', 'Sun Shield', 'Dawn Wrath'],
        desc: 'Unshakable bulwark holding the frontlines. Channels pure solar fury through consecrated blade and aegis.',
      },
      {
        id: 'aurora_marshal',
        name: 'Aurora Marshal',
        role: 'Support Commander • Beacon of Sol',
        armor: 'Reinforced Mail & Cape',
        weapon: 'Consecrated Halberd & Dawn Standard',
        primary: 'Daybreak Strike',
        rites: ['Daybreak Strike', 'Healing Radiance', 'Aura of Zeal', 'Judgement Beam'],
        desc: 'Inspires allies with golden banners, mend leylines, and summons heavenly solar spears against void abominations.',
      },
    ],
  },
  Umbri: {
    name: 'The Duskveil Syndicate',
    motto: 'In shadows we weave, in silence we strike.',
    color: '#9B30FF',
    border: 'border-[#9B30FF]',
    badgeBg: 'bg-[#9B30FF]/15',
    resource: 'Void Resonance (0-100) & Dusk Shroud',
    desc: 'Subterranean reapers operating from the Umbri Undercity. Void Resonance fuels terrifying shadow-weaving, stealth strikes, and life-stealing graveglass sorcery.',
    classes: [
      {
        id: 'umbral_assassin',
        name: 'Umbral Assassin',
        role: 'Burst Flanker • Stealth & Execution',
        armor: 'Graveglass Shadow Leather',
        weapon: 'Dual Nether Daggers',
        primary: 'Shadow Cleave',
        rites: ['Shadow Cleave', 'Void Blink', 'Smoke Shroud', 'Death Mark'],
        desc: 'Vanishes into thin air before emerging behind vulnerable targets to deliver lethal critical strikes.',
      },
      {
        id: 'graveglass_oracle',
        name: 'Graveglass Oracle',
        role: 'Void Sorcerer • Curse & Siphon',
        armor: 'Obsidian Weave Robes',
        weapon: 'Graveglass Lantern & Scythe',
        primary: 'Nether Bolt',
        rites: ['Nether Bolt', 'Soul Drain', 'Grave Chill', 'Abyssal Nova'],
        desc: 'Masters of the forbidden dark leylines. Reaps dying essence to sustain dark shields and curse enemy formations.',
      },
    ],
  },
  Terra: {
    name: 'The Rootdeep Collective',
    motto: 'Stand unyielding as ancient stone.',
    color: '#22E07B',
    border: 'border-[#22E07B]',
    badgeBg: 'bg-[#22E07B]/15',
    resource: 'Root Armor (0-100) & Bramble Fortitude',
    desc: 'Shamans and guardians communing with the giant canopy of Glimmer Orchard. Root Armor absorbs massive punishment and retaliates with thorn barriers.',
    classes: [
      {
        id: 'forest_warden',
        name: 'Forest Warden',
        role: 'Skirmisher • Beast & Bramble',
        armor: 'Hardened Bark & Hide',
        weapon: 'Briar Bow & Woodaxe',
        primary: 'Thorn Volley',
        rites: ['Thorn Volley', 'Tangle Roots', 'Barkskin Blessing', 'Wild Rampage'],
        desc: 'Prowls ancient groves with unmatched agility, ensnaring foes in thorny brambles and coordinating pack strikes.',
      },
      {
        id: 'stonekin_elder',
        name: 'Stonekin Elder',
        role: 'Colossus Tank • Seismic Control',
        armor: 'Living Bedrock Plating',
        weapon: 'Granite Maul & Earth Pillar',
        primary: 'Bedrock Slam',
        rites: ['Bedrock Slam', 'Earth Spike', 'Tectonic Fortress', 'Avalanche'],
        desc: 'An immovable mountain walking among mortals. Smashes the earth to stun groups and deflects heavy artillery.',
      },
    ],
  },
  Aether: {
    name: 'The Astral Conclave',
    motto: 'Time and space bend to the arcane truth.',
    color: '#00BFFF',
    border: 'border-[#00BFFF]',
    badgeBg: 'bg-[#00BFFF]/15',
    resource: 'Chronoflux (0-100) & Temporal Surge',
    desc: 'Scholars of the Mirrorgate Spire who manipulate the celestial lattice. Chronoflux accelerates cooldowns, bends projectile vectors, and manipulates time flow.',
    classes: [
      {
        id: 'chronomancer_sage',
        name: 'Chronomancer Sage',
        role: 'Time Controller • Arcane Velocity',
        armor: 'Astral Silk Vestments',
        weapon: 'Mirrorgate Focus Staff',
        primary: 'Arcane Arc',
        rites: ['Arcane Arc', 'Time Distortion', 'Rewind Slip', 'Chronos Rift'],
        desc: 'Alters the flow of combat by accelerating allies, freezing foes in temporal pockets, and resetting crucial cooldowns.',
      },
      {
        id: 'nexus_weaver',
        name: 'Nexus Weaver',
        role: 'Portal Specialist • Reality Rift',
        armor: 'Loomed Aether Shroud',
        weapon: 'Warp Dagger & Catalyst Orb',
        primary: 'Flux Burst',
        rites: ['Flux Burst', 'Leyline Tether', 'Dimensional Portal', 'Starfall Burst'],
        desc: 'Tears open spatial wormholes across battlefield lines, rearranging squad positioning with reality rifts.',
      },
    ],
  },
};

// ==========================================
// PIXELATED ARMORY ITEMS SHOWCASE
// ==========================================
const PIXEL_ITEMS = [
  { id: 'dawnblade', name: 'Dawnblade Greatsword', slot: 'Weapon', rarity: 'Legendary', icon: '🗡️', stat: '+24 Radiant Dmg • +8% Holy Crit', color: '#F2A900', desc: 'Forged from Starfall meteorite and quenched in the solar well.' },
  { id: 'sun_shield', name: 'Sunforged Radiance Aegis', slot: 'Shield', rarity: 'Epic', icon: '🛡️', stat: '+45 Armor • +60 Block Value', color: '#F2A900', desc: 'Imbued with the Zenith core. Emits blinding retaliation flashes.' },
  { id: 'astral_crown', name: 'Chronomancer Crown', slot: 'Head', rarity: 'Legendary', icon: '👑', stat: '+18 Arcane • +20 Max Glimmer', color: '#00BFFF', desc: 'Allows the wearer to perceive 3 seconds into adjacent timelines.' },
  { id: 'shadow_cowl', name: 'Duskveil Shadow Cowl', slot: 'Head', rarity: 'Epic', icon: '🦹', stat: '+14 Agility • +12% Stealth Opener', color: '#9B30FF', desc: 'Woven with Graveglass filament that drinks ambient illumination.' },
  { id: 'leyline_boots', name: 'Boots of Leyline Striding', slot: 'Boots', rarity: 'Rare', icon: '🥾', stat: '+15% Move Speed • Zero Leyline Friction', color: '#22E07B', desc: 'Glides over rough cavern terrain and hazardous root tangles.' },
  { id: 'ring_solar', name: 'Ring of the Solar Core', slot: 'Ring', rarity: 'Epic', icon: '💍', stat: '+15 Solar Charge Max • +5 HP/s Regen', color: '#F2A900', desc: 'Warm to the touch even in the frost of the Abyssal Rift.' },
  { id: 'void_rune', name: 'Ancient Void Inscription', slot: 'Rune', rarity: 'Cosmic', icon: '📜', stat: 'Activates 3-Socket Synergy (+22% Dmg)', color: '#9B30FF', desc: 'Decoded from the monolith ruins deep inside Starfall Crater.' },
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic', icon: '💎', stat: 'World Nexus Anchor (25 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
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
  { tag: 'SUN', name: 'Order of Dawn', color: '#F2A900' },
  { tag: 'ASTR', name: 'Mirror Ascendants', color: '#00BFFF' },
  { tag: 'VOID', name: 'Dusk Reapers', color: '#9B30FF' },
  { tag: 'TERR', name: 'Verdant Guard', color: '#22E07B' },
];

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

export default function LandingPage() {
  // Navigation & State
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

  const handleFactionSelect = (facKey) => {
    setSelectedFaction(facKey);
    const firstCls = FACTIONS_DATA[facKey].classes[0];
    setSelectedClassId(firstCls.id);
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
      const order = ORDER_PRESETS.find((o) => o.tag === selectedOrderTag) || ORDER_PRESETS[0];
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

        setTimeout(() => {
          window.location.href = `/?mode=${playMode}&autostart=1`;
        }, 300);
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
  const currentOrder = ORDER_PRESETS.find((o) => o.tag === selectedOrderTag) || ORDER_PRESETS[0];

  return (
    <div className="min-h-screen bg-[#070B18] text-[#F8FAFC] flex flex-col lg:flex-row antialiased overflow-x-hidden selection:bg-[#F2A900] selection:text-black">
      {/* ======================================================== */}
      {/* 1. LEFT STICKY PIXELATED SIDEBAR NAVIGATION */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-80 lg:min-w-[320px] lg:h-screen lg:sticky lg:top-0 bg-[#0A0F22]/95 border-r border-[#1E293B] flex flex-col z-40 backdrop-blur-xl overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E293B]">
        {/* Brand Header & Official Logo */}
        <div className="p-5 border-b border-[#1E293B] bg-gradient-to-b from-[#0F172A] to-[#0A0F22]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0 p-1 rounded-xl bg-black/40 border border-[#F2A900]/40 shadow-[0_0_15px_rgba(242,169,0,0.3)]">
              <img
                src={LOGO_PATH}
                alt="GlimmerFall Official Logo"
                className="w-full h-full object-contain filter drop-shadow(0 0 6px #F2A900)"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-wider text-white">
                  GLIMMER<span className="text-[#F2A900]">FALL</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] font-bold">
                  2D PIXEL
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#4ADE80] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-ping" />
                20Hz Authoritative MMO • 0ms Offline
              </div>
            </div>
          </div>

          {/* Quick Launch & Play Mode */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setPlayMode('singleplayer'); playSfx('click'); }}
              className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition-all ${
                playMode === 'singleplayer'
                  ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#7DD3FC] shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'bg-black/40 border-[#1E293B] text-white/60 hover:text-white'
              }`}
            >
              🕹️ Offline 0ms
            </button>
            <button
              onClick={() => { setPlayMode('multiplayer'); playSfx('click'); }}
              className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition-all ${
                playMode === 'multiplayer'
                  ? 'bg-[#22E07B]/20 border-[#22E07B] text-[#86EFAC] shadow-[0_0_10px_rgba(34,224,123,0.3)]'
                  : 'bg-black/40 border-[#1E293B] text-white/60 hover:text-white'
              }`}
            >
              🌐 Online 20Hz
            </button>
          </div>

          {/* Awaken CTA */}
          <button
            onClick={handleLaunchGame}
            className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F2A900] to-[#EAB308] text-black font-display font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-[0_0_18px_rgba(242,169,0,0.4)] flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-black" /> Awaken In Realm
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="p-4 border-b border-[#1E293B] space-y-1 text-xs font-semibold">
          <a href="#forge" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#F2A900] transition-colors">
            <Sparkles className="w-4 h-4 text-[#F2A900]" /> Character Forge
          </a>
          <a href="#game-encyclopedia" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#38BDF8] transition-colors">
            <BookOpen className="w-4 h-4 text-[#38BDF8]" /> Game Systems Encyclopedia
          </a>
          <a href="#lore-tcg" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#9B30FF] transition-colors">
            <Scroll className="w-4 h-4 text-[#9B30FF]" /> Cosmic Lore &amp; TCG Oracle
          </a>
          <a href="#armory" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#22E07B] transition-colors">
            <Boxes className="w-4 h-4 text-[#22E07B]" /> Continental Armory
          </a>
          <a href="#arena" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#F87171] transition-colors">
            <Swords className="w-4 h-4 text-[#F87171]" /> 3v3 Nexus Destruction
          </a>
          <a href="#atlas" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#38BDF8] transition-colors">
            <Globe className="w-4 h-4 text-[#38BDF8]" /> Continental World Atlas
          </a>
          <button
            onClick={handleOpenLoadout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#1E1B4B]/60 border border-[#38BDF8]/30 hover:border-[#38BDF8] text-[#7DD3FC] transition-colors mt-2"
          >
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#38BDF8]" /> Open Hero Loadout
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pixel Gear & Items Showcase */}
        <div className="p-4 border-b border-[#1E293B]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-display font-bold tracking-wider text-[#F2A900] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#F2A900]" /> PIXEL ARMORY PREVIEW
            </span>
            <span className="text-[9px] text-white/40">Hover to inspect</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PIXEL_ITEMS.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative aspect-square rounded-lg bg-[#080E1C] border border-[#1E293B] hover:border-[#F2A900] flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-inner"
                style={{ borderColor: hoveredItem?.id === item.id ? item.color : undefined }}
              >
                <span>{item.icon}</span>
                <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-white/50">{item.slot[0]}</span>
              </div>
            ))}
          </div>

          {/* Hovered item preview tooltip */}
          {hoveredItem ? (
            <div className="mt-2.5 p-2 rounded-lg bg-black/80 border border-[#334155] text-[10.5px] animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="font-bold" style={{ color: hoveredItem.color }}>{hoveredItem.name}</span>
                <span className="text-[9px] px-1 rounded bg-white/10 text-white/70">{hoveredItem.rarity}</span>
              </div>
              <div className="text-[10px] text-[#38BDF8] mt-0.5">{hoveredItem.stat}</div>
              <p className="text-[9.5px] text-white/60 mt-1 italic">{hoveredItem.desc}</p>
            </div>
          ) : (
            <div className="mt-2 text-center text-[10px] text-white/30 italic">
              Hover over items to inspect stats &amp; sockets
            </div>
          )}
        </div>

        {/* Leyline Currencies */}
        <div className="p-4 border-b border-[#1E293B]">
          <div className="text-[11px] font-display font-bold tracking-wider text-[#38BDF8] flex items-center gap-1.5 mb-2.5">
            <Coins className="w-3.5 h-3.5 text-[#38BDF8]" /> LEYLINE CURRENCY VAULT
          </div>
          <div className="space-y-1.5 text-xs">
            {CURRENCIES.map((curr) => (
              <div key={curr.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-[#1E293B]/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{curr.icon}</span>
                  <span className="text-white/80 text-[11px] font-medium">{curr.name}</span>
                </div>
                <span className="font-mono font-bold text-[11px]" style={{ color: curr.color }}>{curr.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7 Disciplines & Skills (Max 99) */}
        <div className="p-4 border-b border-[#1E293B]">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] font-display font-bold tracking-wider text-[#22E07B] flex items-center gap-1.5">
              <Pickaxe className="w-3.5 h-3.5 text-[#22E07B]" /> 7 REALM DISCIPLINES
            </span>
            <span className="text-[9.5px] text-[#F2A900] font-bold">MAX LVL 99</span>
          </div>
          <div className="space-y-2">
            {PROFESSIONS.map((prof) => (
              <div key={prof.id}>
                <div className="flex justify-between text-[10.5px] font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-white/90">
                    <span>{prof.icon}</span> {prof.name}
                  </span>
                  <span style={{ color: prof.color }}>Lv. {prof.lvl} / 99</span>
                </div>
                <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(prof.lvl / 99) * 100}%`, backgroundColor: prof.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer & Preferences */}
        <div className="p-4 mt-auto border-t border-[#1E293B] bg-[#070B18]">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={startOnLoadout}
              onChange={(e) => handleToggleStartOnSite(e.target.checked)}
              className="rounded border-[#334155] text-[#38BDF8] focus:ring-0 cursor-pointer accent-[#38BDF8]"
            />
            <span>Start on Loadout view</span>
          </label>
          <div className="mt-2 text-[10px] text-white/40 flex justify-between">
            <span>© 2026 GlimmerFall</span>
            <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline flex items-center gap-1">
              glimmerfalltcg.com <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN SCROLLABLE PIXEL HEAVEN CONTENT */}
      {/* ======================================================== */}
      <main className="flex-1 min-h-screen overflow-y-auto px-4 py-8 lg:px-12 lg:py-12 space-y-16">
        {/* HERO BANNER SECTION */}
        <section className="relative rounded-3xl p-8 lg:p-14 overflow-hidden border border-[#1E293B] bg-radial from-[#131D38] via-[#090E1E] to-[#050814] shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F2A900]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            {/* Header with Official Logo */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-2xl bg-black/60 border border-[#F2A900]/40 shadow-[0_0_25px_rgba(242,169,0,0.3)]">
                <img
                  src={LOGO_PATH}
                  alt="GlimmerFall Official Logo"
                  className="w-16 h-16 object-contain filter drop-shadow(0 0 10px #F2A900)"
                />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#F2A900]/15 border border-[#F2A900]/40 text-[#F2A900]">
                  ✨ Official 16-Bit Action MMORPG
                </span>
                <h1 className="font-display font-black text-3xl sm:text-5xl tracking-wide text-white mt-1">
                  GLIMMER<span className="text-[#F2A900]">FALL</span> ONLINE
                </h1>
              </div>
            </div>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed font-head">
              Step into an authentic top-down action MMORPG inspired by classic 16-bit masterworks.
              Harvest celestial Glimmer leylines, socket authentic trading card relics from{' '}
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="text-[#38BDF8] underline font-bold">
                glimmerfalltcg.com
              </a>, master 7 disciplines to Level 99, and defend your 25-HP Outpost Nexus in 3v3 arenas.
            </p>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#1E293B]">
                <div className="text-xl sm:text-2xl font-mono font-black text-[#38BDF8]">0ms</div>
                <div className="text-[11px] text-white/60 font-semibold uppercase">Single Player</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#1E293B]">
                <div className="text-xl sm:text-2xl font-mono font-black text-[#4ADE80]">20 Hz</div>
                <div className="text-[11px] text-white/60 font-semibold uppercase">Server MMO</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#1E293B]">
                <div className="text-xl sm:text-2xl font-mono font-black text-[#F2A900]">Lv. 99</div>
                <div className="text-[11px] text-white/60 font-semibold uppercase">Max Mastery</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#1E293B]">
                <div className="text-xl sm:text-2xl font-mono font-black text-[#F87171]">25 HP</div>
                <div className="text-[11px] text-white/60 font-semibold uppercase">Nexus Rule</div>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <button
                onClick={handleLaunchGame}
                className="py-4 px-8 rounded-2xl bg-gradient-to-r from-[#F2A900] via-[#EAB308] to-[#CA8A04] text-black font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(242,169,0,0.4)] flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-black" /> Awaken Champion Now
              </button>

              <button
                onClick={handleOpenLoadout}
                className="py-4 px-6 rounded-2xl bg-black/60 border border-[#38BDF8]/40 text-[#7DD3FC] font-display font-bold text-sm tracking-wide hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 transition-all flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> Open In-Game Loadout
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* CHARACTER FORGE SECTION (#forge) */}
        {/* ======================================================== */}
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

              {/* Faction Alleigance */}
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
                        <div className="text-[10px] text-white/60 mt-1 line-clamp-1">{f.name}</div>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ORDER_PRESETS.map((o) => {
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
                        <div className="font-mono text-xs font-black">[{o.tag}]</div>
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
                    {currentFaction.name}
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
                </div>

                <button
                  onClick={handleLaunchGame}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F2A900] to-[#EAB308] text-black font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(242,169,0,0.4)]"
                >
                  ⚡ Enter GlimmerFall
                </button>
              </div>
            </div>
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
                { id: 'resources', label: '⚡ Faction Resources' },
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
                    Melee swings deliver a 90-degree frontal cleave covering 34 pixels. Projectiles track omni-directional vectors with 16px radius hitboxes. Real-time client prediction synchronizes seamlessly with the 20Hz server.
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
                  <h4 className="font-display font-bold text-sm text-[#F2A900] mb-1">☀️ Solari: Solar Charge &amp; Zenith</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Striking enemies builds Solar Charge (0-100). Reaching 100 triggers the blinding Zenith State, granting +25% movespeed, holy radiance pulse damage, and instant cooldown on Solar Flare.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#9B30FF]/40">
                  <h4 className="font-display font-bold text-sm text-[#9B30FF] mb-1">🌙 Umbri: Void Resonance &amp; Dusk Shroud</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Channeling dark arts fuels Void Resonance. Consuming resonance activates Dusk Shroud, cloaking the assassin from enemy unit frames and providing guaranteed critical strikes.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#22E07B]/40">
                  <h4 className="font-display font-bold text-sm text-[#22E07B] mb-1">🌿 Terra: Root Armor &amp; Bedrock</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Absorbing physical strikes cultivates living root bark. When shattered, Root Armor triggers a thorn shockwave that roots all adjacent assailants for 2.5 seconds.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#00BFFF]/40">
                  <h4 className="font-display font-bold text-sm text-[#00BFFF] mb-1">🌀 Aether: Chronoflux &amp; Warp</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Chronoflux fluctuates dynamically. Harnessing flux enables the sage to bend projectile paths, reverse ally positioning, and rewrite temporal damage histories.
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

        {/* ======================================================== */}
        {/* COSMIC LORE & TCG ENCYCLOPEDIA SECTION (#lore-tcg) */}
        {/* ======================================================== */}
        <section id="lore-tcg" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B30FF] px-2.5 py-1 rounded bg-[#9B30FF]/10 border border-[#9B30FF]/30">
                glimmerfalltcg.com Canonical Lore
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                📜 COSMIC LORE &amp; TCG ORACLE
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                { id: 'shattering', label: '🌌 The Great Shattering' },
                { id: 'creeds', label: '🏛️ 4 Faction Creeds' },
                { id: 'cards', label: '🃏 TCG Card Relics' },
                { id: 'legends', label: '👑 Sanctuary Legends' },
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
              <div className="p-6 rounded-2xl bg-black/40 border border-[#1E293B] space-y-3">
                <h4 className="font-display font-bold text-base text-[#F2A900]">The Cataclysm of the Shattered Leylines</h4>
                <p className="text-xs text-white/80 leading-relaxed font-head">
                  In the First Age of the continent, the celestial Starfall tore through the astral canopy, embedding cosmic Glimmer veins into the very bedrock of the world.
                  The leyline harmonic split into four distinct frequencies: radiant Solar fire, subterranean Void resonance, enduring Living Root, and fluid Chronoflux.
                  Sanctuary Haven stands as the sacred neutral haven where mortal champions master these cosmic powers to hold back the encroaching Abyssal Rift.
                </p>
              </div>
            )}

            {activeLoreTab === 'creeds' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#F2A900] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#F2A900]">The Sunspire Dominion</h4>
                  <p className="text-xs text-white/70 mt-1 italic">"May the Sunspire illuminate the darkness."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Sentinels sworn to the Daystar. They construct soaring gilded spires to capture raw solar leylines, burning away shadow taint with unyielding martial discipline.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#9B30FF] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#9B30FF]">The Duskveil Syndicate</h4>
                  <p className="text-xs text-white/70 mt-1 italic">"In shadows we weave, in silence we strike."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Operating in the subterranean Undercity, they wield void resonance and graveglass lanterns, maintaining that shadow is the ultimate truth and armor against mortal hubris.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#22E07B] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#22E07B]">The Rootdeep Collective</h4>
                  <p className="text-xs text-white/70 mt-1 italic">"Stand unyielding as ancient stone."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Guardians of the giant canopy in Glimmer Orchard. They defend the ancient stone bedrock and oppose reckless technological mining of planetary leylines.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border-l-4 border-l-[#00BFFF] border-y border-r border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#00BFFF]">The Astral Conclave</h4>
                  <p className="text-xs text-white/70 mt-1 italic">"Time and space bend to the arcane truth."</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Scholars of the Mirrorgate Spire. Viewing all history as an intricate tapestry of threads, they accelerate time and tear reality rifts to rewrite battle outcomes.
                  </p>
                </div>
              </div>
            )}

            {activeLoreTab === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Solari Vanguard', role: '+15% Radiant Slash Dmg', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp' },
                  { name: 'Dawnblade Templar', role: '+10% Critical Strike Chance', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp' },
                  { name: 'Mana Crystal', role: '+25 Max Glimmer & Rapid Regen', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp' },
                  { name: 'Granite Behemoth', role: '+350 Max Armor & Threat', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp' },
                  { name: 'Void Stalker', role: '+25% Stealth Opener Damage', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp' },
                  { name: 'Chronocore Prism', role: 'World Nexus Monolith (25 HP Rule)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
                ].map((c) => (
                  <div key={c.name} className="flex gap-3 p-3.5 rounded-2xl bg-black/40 border border-[#1E293B] items-center">
                    <img src={c.img} alt={c.name} className="w-14 h-20 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                    <div>
                      <div className="font-display font-bold text-xs text-white">{c.name}</div>
                      <div className="text-[10px] font-bold text-[#38BDF8] mt-0.5">{c.role}</div>
                      <span className="text-[9px] text-white/40 block mt-1">Socketable TCG Relic</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeLoreTab === 'legends' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#F2A900]">✨ Herald Aurora</h4>
                  <p className="text-xs text-white/70 mt-1">Voice of the Leylines. Greets newly awakened champions at Sanctuary spawn and guides their first Rite awakenings.</p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#38BDF8]">💎 Moira the Relic-Seeker</h4>
                  <p className="text-xs text-white/70 mt-1">Grandmaster of Resonance Extraction. Stationed near the mineral veins, she teaches extraction from Grand Fonts.</p>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
                  <h4 className="font-display font-bold text-sm text-[#22E07B]">🔨 Blacksmith Torvin</h4>
                  <p className="text-xs text-white/70 mt-1">Master of the Cosmic Star-Anvil. Smelts celestial ores into alloy ingots and hammers masterwork socketed gear.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* CONTINENTAL ARMORY SECTION (#armory) */}
        {/* ======================================================== */}
        <section id="armory" className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-[#1E293B]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#22E07B] px-2.5 py-1 rounded bg-[#22E07B]/10 border border-[#22E07B]/30">
                16-Bit Equipment Catalog
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                🛡️ PIXEL ARMORY &amp; CRAFTING VAULT
              </h2>
            </div>
            <span className="text-xs text-white/50">8 Slots • Socketable Runes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIXEL_ITEMS.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-black/40 border border-[#1E293B] hover:border-[#F2A900] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-2xl p-2 rounded-xl bg-black/60 border border-white/5">{item.icon}</span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    {item.rarity}
                  </span>
                </div>
                <div className="font-display font-bold text-sm text-white mt-3">{item.name}</div>
                <div className="text-[11px] font-semibold text-[#38BDF8] mt-1">{item.stat}</div>
                <p className="text-[10.5px] text-white/60 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3v3 NEXUS DESTRUCTION ARENA (#arena) */}
        {/* ======================================================== */}
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
              25-HP MONOLITH RULE
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
              <h4 className="font-display font-bold text-sm text-[#F87171] mb-2">2. 25-HP Monolith Rule</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Each team defends a 25-HP Outpost Nexus. Strikes deal 1 integer damage per direct hit. First team to shatter the opposing nexus claims the victory.
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

        {/* ======================================================== */}
        {/* WORLD ATLAS SECTION (#atlas) */}
        {/* ======================================================== */}
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
            <span className="text-xs text-white/50">7 Continental Biomes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'sanctuary', name: 'Sanctuary Haven', tag: 'Neutral Hub', color: '#F2A900', desc: 'Central city housing the Grand Exchange pavilion, AetherVault banks, and crafting artisans.' },
              { id: 'solari', name: 'Solari Citadel', tag: 'Sunspire Territory', color: '#F2A900', desc: 'Golden marble towers and sun-temples harvesting celestial dawn radiation.' },
              { id: 'umbri', name: 'Umbri Undercity', tag: 'Duskveil Syndicate', color: '#9B30FF', desc: 'Subterranean obsidian caverns lit by glowing violet graveglass lanterns.' },
              { id: 'terra', name: 'Glimmer Orchard', tag: 'Rootdeep Collective', color: '#22E07B', desc: 'Massive towering ancient canopy trees with sentient moss and stonekin elders.' },
              { id: 'aether', name: 'Mirrorgate Spire', tag: 'Astral Conclave', color: '#00BFFF', desc: 'Floating crystal pinnacles bending the temporal lattice and leyline currents.' },
              { id: 'starfall', name: 'Starfall Crater', tag: 'Warzone PvPvE', color: '#F87171', desc: 'Cataclysmic impact site where all 4 factions battle over primal leyline shards.' },
            ].map((realm) => (
              <div key={realm.id} className="p-5 rounded-2xl bg-black/40 border border-[#1E293B]">
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

        {/* FOOTER */}
        <footer className="pt-10 border-t border-[#1E293B] text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img src={LOGO_PATH} alt="GlimmerFall" className="h-8 object-contain" />
            <span className="font-display font-bold text-sm text-white">GLIMMERFALL ONLINE</span>
          </div>
          <p className="text-xs text-white/50 max-w-lg mx-auto">
            Official 2D Pixel Action MMORPG based on the GlimmerFall Trading Card Game universe.
            Built with 20Hz authoritative sync, 0ms offline execution, and deep skill mastery.
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
