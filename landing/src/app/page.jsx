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
} from 'lucide-react';

const HERO_BG =
  'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/hero_bg-LEXvPiF25DW4GwYAIML7yqFaTveuiz.png';

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
        desc: 'Frontline bastion channeling blinding solar flares, generating radiant threat with shield slams, and entering Zenith State at 100 Solar Charge.',
        abilities: ['Flare Strike', 'Solar Flare', 'Judgement of Sol', 'Consecrated Ground'],
        stats: { power: 1, bastion: 2, resonance: 0, tempo: 0 },
        starterAbility: 'Flare Strike (Instant Melee Cleave)',
      },
      {
        id: 'aurora_marshal',
        name: 'Aurora Marshal',
        role: 'Celestial Commander • Nexus Healer',
        armor: 'Sunforged Plate / Mail',
        weapon: 'Solari Spellblade & Mirror Shield',
        desc: 'Herald of Dawn commanding Decree of the Sun and Daybreak to mend wounded allies and fortify Outpost Nexuses.',
        abilities: ['Flare Strike', 'Solar Flare', 'Decree of the Sun', 'Daybreak'],
        stats: { power: 1, bastion: 1, resonance: 1, tempo: 0 },
        starterAbility: 'Flare Strike (Instant Melee Cleave)',
      },
    ],
    cards: [
      {
        name: 'Solari Vanguard',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp',
        stat: '+15% Radiant Slash Damage',
      },
      {
        name: 'Dawnblade Templar',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/dawnblade_templar-JSNrQIidGZhWg88RUeUCqOWBRcaAUy.webp',
        stat: '+10% Critical Strike Chance',
      },
    ],
  },
  Aether: {
    name: 'The Astral Conclave',
    motto: 'Time and space bend to the arcane truth.',
    color: '#00BFFF',
    border: 'border-[#00BFFF]',
    badgeBg: 'bg-[#00BFFF]/15',
    resource: 'Astral Resonance (0-4 Stacks) & Mana',
    desc: 'Spacetime arcanists tapping the Mirrorgate leylines. Generating Astral Resonance accelerates cast speed and summons gravity singularities to freeze opponents.',
    classes: [
      {
        id: 'chronomancer_sage',
        name: 'Chronomancer Sage',
        role: 'Time-Bender • Flash Tempo & Echo',
        armor: 'Starweave Cloth',
        weapon: 'Chronocore Staff & Mirror Shield',
        desc: 'Mirrorgate scholar bending spacetime with Chrono Shift, Gravity Well, and Time Loop Paradox to out-tempo foes.',
        abilities: ['Reality Fracture', 'Astral Convergence', 'Arcane Bolt', 'Gravity Well'],
        stats: { power: 1, bastion: 0, resonance: 1, tempo: 1 },
        starterAbility: 'Reality Fracture (Instant Arcane Bolt)',
      },
      {
        id: 'nexus_weaver',
        name: 'Nexus Weaver',
        role: 'Arcane Battlemage • Starfall & Freeze',
        armor: 'Starweave Robes & Mail',
        weapon: 'Chronocore Staff & Mirror Shield',
        desc: 'Weaver of cosmic leylines freezing foes in place with Frost Nova and calling down celestial Astral Convergence.',
        abilities: ['Reality Fracture', 'Arcane Bolt', 'Astral Convergence', 'Frost Nova'],
        stats: { power: 1, bastion: 0, resonance: 2, tempo: 0 },
        starterAbility: 'Reality Fracture (Instant Arcane Bolt)',
      },
    ],
    cards: [
      {
        name: 'Mana Crystal',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp',
        stat: '+25 Max Glimmer & Rapid Regen',
      },
      {
        name: 'Nexus Weaver',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/nexus_weaver-xp4JawbGUuORJsT04pcs27CqlZ7KhX.webp',
        stat: '+20% Spell Haste Rating',
      },
    ],
  },
  Terra: {
    name: 'The Rootdeep Collective',
    motto: 'Stand unyielding as ancient stone.',
    color: '#22E07B',
    border: 'border-[#22E07B]',
    badgeBg: 'bg-[#22E07B]/15',
    resource: 'Primal Fury (0-100) & Living Stoneplate',
    desc: 'Uncompromising guardians of the Glimmer Orchard. Hardening their living barkskin allows reflecting hostile strikes and unleashing seismic upheavals.',
    classes: [
      {
        id: 'forest_warden',
        name: 'Forest Warden',
        role: 'Primal Bruiser • Overwhelm & Roots',
        armor: 'Living Ironwood Armor',
        weapon: 'Ironwood Maul & Bramble Buckler',
        desc: 'Guardian of Glimmer Orchard snaring enemies in Briar Snare and charging with Wildshape Surge to shatter enemy ranks.',
        abilities: ['Tectonic Slam', 'Earthshatter', 'Ancient Boulder', 'Briar Snare'],
        stats: { power: 1, bastion: 1, resonance: 0, tempo: 1 },
        starterAbility: 'Tectonic Slam (Earth Shaker Cleave)',
      },
      {
        id: 'stonekin_elder',
        name: 'Stonekin Elder',
        role: 'Colossal Tank • Thornbark Reflect',
        armor: 'Deep-Root Living Stoneplate',
        weapon: 'Ironwood Maul & Bramble Buckler',
        desc: 'Ancient Rootdeep juggernaut encased in Barkskin Infusion, reflecting melee damage and creating crater stuns.',
        abilities: ['Tectonic Slam', 'Ancient Boulder', 'Barkskin Infusion', 'Earthshatter'],
        stats: { power: 1, bastion: 2, resonance: 0, tempo: 0 },
        starterAbility: 'Tectonic Slam (Earth Shaker Cleave)',
      },
    ],
    cards: [
      {
        name: 'Granite Behemoth',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/granite_behemoth-YUFhjjGdiBlGqBINNmSW7tRa37JsSB.webp',
        stat: '+350 Max Armor & Threat',
      },
      {
        name: 'Forest Warden',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/forest_warden-7v5Tjn83CPLhmB9Rll3v2QbE2gnSyP.webp',
        stat: '+12% Health Regeneration',
      },
    ],
  },
  Umbri: {
    name: 'The Duskveil Syndicate',
    motto: 'In shadows we weave, in silence we strike.',
    color: '#9B30FF',
    border: 'border-[#9B30FF]',
    badgeBg: 'bg-[#9B30FF]/15',
    resource: 'Shadow Energy & Dusk Combo Points',
    desc: 'Subterranean reapers operating from the Umbri Undercity. Striking from stealth generates Dusk Points to detonate targets with critical Unmake finishers.',
    classes: [
      {
        id: 'umbral_assassin',
        name: 'Umbral Assassin',
        role: 'Stealth Executioner • Void Harvest',
        armor: 'Duskveil Shroud',
        weapon: 'Scythe of Soulreaper & Graveglass Lantern',
        desc: 'Duskveil stalker vanishing in shadow, teleporting with Shadow Step, and executing enemies with high-crit Unmake.',
        abilities: ['Whisper of the Void', 'Unmake', 'Soul Tithe', 'Shadow Step'],
        stats: { power: 2, bastion: 0, resonance: 0, tempo: 1 },
        starterAbility: 'Whisper of the Void (Shadow Strike)',
      },
      {
        id: 'graveglass_oracle',
        name: 'Graveglass Oracle',
        role: 'Blood-Hex Reaper • Life Drain',
        armor: 'Duskveil Shroud / Robes',
        weapon: 'Scythe of Soulreaper & Graveglass Lantern',
        desc: 'Sepulcher mystic draining enemy life-force via Siphon Soul, Soul Tithe, and contagious Nightfall Plague.',
        abilities: ['Whisper of the Void', 'Siphon Soul', 'Soul Tithe', 'Nightfall Plague'],
        stats: { power: 1, bastion: 0, resonance: 2, tempo: 0 },
        starterAbility: 'Whisper of the Void (Shadow Strike)',
      },
    ],
    cards: [
      {
        name: 'Void Stalker',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp',
        stat: '+25% Stealth Opener Damage',
      },
      {
        name: 'Duskblade Fiend',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/duskblade_fiend-v1EnEuvSFu137bkLNZoZbI1NIFrgfF.webp',
        stat: '+15% Shadow Damage Bleeds',
      },
    ],
  },
};

// ==========================================
// 7 AUTHENTIC SKILLS & 99-LEVEL PROFESSIONS
// ==========================================
const PROFESSIONS_LIST = [
  {
    id: 'combat_mastery',
    name: 'Combat Mastery',
    category: 'Combat',
    icon: '⚔️',
    color: '#ef4444',
    summary: 'Martial Prowess, Weapon Lethality & World Boss Slaying',
    desc: 'Honed by vanquishing monsters, dungeon sentinels, and world bosses across the continental realms.',
    cape: 'Skillcape of Combat Mastery (+10 All Stats • Slain Mob XP Boost)',
    activity: 'Slay monsters, Elite Champions, and Sanctuary Bounty targets.',
  },
  {
    id: 'rites',
    name: 'Rites',
    category: 'Invocation',
    icon: '☀️',
    color: '#f59e0b',
    summary: 'Channeled Cast-Time Sorcery & Invocations',
    desc: 'Unleashing channeled TCG Rites. Higher levels grant +0.25% Cast Speed per level and expand Max Glimmer.',
    cape: 'Skillcape of Rite Mastery (+24.5% Rite Cast Speed • +19 Max Glimmer)',
    activity: 'Channel any cast-time Rite ability in combat or against trial dummies.',
  },
  {
    id: 'flashes',
    name: 'Flashes',
    category: 'Reflex',
    icon: '⚡',
    color: '#06b6d4',
    summary: 'Instant Strikes, Split-Second Counters & Mobility',
    desc: 'Executing instant-cast TCG Flashes. Higher levels grant up to +14.7% Cooldown Recovery & +11.8% Critical Chance.',
    cape: 'Skillcape of Flash Mastery (+14.7% CDR • +11.8% Crit Chance)',
    activity: 'Trigger instant-cast Flash abilities (cleaves, shields, blinks, frost novas).',
  },
  {
    id: 'resonance_extraction',
    name: 'Resonance Extraction',
    category: 'Gathering',
    icon: '💎',
    color: '#38bdf8',
    summary: 'Leyline Channeling, Cosmic Mining & Botanical Foraging',
    desc: 'Quarrying mineral seams and Grand Fonts from Sun-Copper to Celestial Starmetal and Runite.',
    cape: 'Skillcape of Resonance Extraction (2x Harvesting Yield • Fast Font Re-charge)',
    activity: 'Press [E] or click Glimmer Nodes, Grand Fonts, and Mineral Veins.',
  },
  {
    id: 'relic_forging',
    name: 'Relic-Forging',
    category: 'Artisan',
    icon: '🔨',
    color: '#f97316',
    summary: 'Astral Smelting, Weaponry Smithing & Heavy Plate',
    desc: 'Smelting raw ores with cosmic minerals and forging enchanted blades, bulwarks, and platebodies at the Cosmic Star-Anvil.',
    cape: 'Skillcape of Relic-Forging (Chance to Forge Masterwork Sockets)',
    activity: 'Use the Cosmic Star-Anvil in Sanctuary West Workshop or Citadel.',
  },
  {
    id: 'rite_binding',
    name: 'Rite-Binding',
    category: 'Artisan',
    icon: '📜',
    color: '#a855f7',
    summary: 'Aetherial Crucible Inscription & Spell Enchants',
    desc: 'Transmuting essences at the Aetherial Crucible to bind cosmic spell scrolls, runic socket gems, and glyph enchants.',
    cape: 'Skillcape of Rite-Binding (+15% Spell Potency • Runic Catalyst Infusion)',
    activity: 'Transmute leylines at the Aetherial Crucible in Sanctuary.',
  },
  {
    id: 'glimmerweaving',
    name: 'Glimmerweaving',
    category: 'Artisan',
    icon: '🧵',
    color: '#ec4899',
    summary: 'Celestial Loom Textiles, Robes & Shrouds',
    desc: 'Spinning celestial threads at the Celestial Loom into enchanted cloth, backpacks, and arcane vestments.',
    cape: 'Skillcape of Glimmerweaving (Expanded Inventory Satchel • +15% Mana)',
    activity: 'Spin starry fibres at the Celestial Loom in Sanctuary.',
  },
];

// ==========================================
// CONTINENTAL REALMS & DUNGEONS ATLAS
// ==========================================
const REALMS_ATLAS = [
  {
    name: 'Awakening Sanctuary Hub',
    type: 'Safe Isle • Artisan Workshops & Trial Dummies',
    desc: 'The central gathering plaza. Features separated artisan workshop bays (Textiles Loom, Cosmic Star-Anvil, Aetherial Crucible), trial dummies, Grand Fonts, and portals.',
    color: '#F2A900',
  },
  {
    name: 'Nexus Warzone',
    type: 'Contested Battleground • 20Hz Open PvP',
    desc: 'High-intensity territorial battleground featuring scheduled Shattered Nexus Shard siege events and 4 Outpost Nexuses.',
    color: '#ef4444',
  },
  {
    name: 'Solari Golden Citadel & Sunken Vault',
    type: 'Faction Stronghold & Radiant Dungeon',
    desc: 'Gilded bastions of light overlooking the Sunspire. Deep beneath lie the Sunken Vaults guarded by Ancient Solari Sentinels.',
    color: '#F2A900',
  },
  {
    name: 'Umbri Undercity & Catacombs',
    type: 'Subterranean Labyrinth & Void Rift',
    desc: 'Shadowy cavern metropolis lit by ethereal lantern glow. Harbors the Sepulcher Catacombs and voidstalker elite lairs.',
    color: '#9B30FF',
  },
  {
    name: 'Terra Orchard & Rootdeep Grove',
    type: 'Verdant Forest & Living Stoneplate Spire',
    desc: 'Towering ancient ironwood trees pulsating with primal fury. Home to colossal stonekin juggernauts and herbal leylines.',
    color: '#22E07B',
  },
  {
    name: 'Aether Spire & Arcane Concourse',
    type: 'Astral Floating Monolith & Time Rift',
    desc: 'Floating crystalline spires where spacetime distorts. Channeling leylines here unlocks temporal haste and reality singularities.',
    color: '#00BFFF',
  },
  {
    name: 'Starfall Crater & Abyssal Rift',
    type: 'Seamless Bidirectional Edge Traversal',
    desc: 'Cosmic impact crater connected directly via seamless coordinate borders to the Abyssal Rift dungeon instance.',
    color: '#e2e8f0',
  },
];

const ORDER_PRESETS = [
  { tag: 'SUN', name: 'Order of Dawn', color: '#facc15' },
  { tag: 'STAR', name: 'Astral Ascendant', color: '#38bdf8' },
  { tag: 'WILD', name: 'Verdant Guard', color: '#4ade80' },
  { tag: 'VOID', name: 'Eclipse Syndicate', color: '#c084fc' },
];

const RANDOM_NAMES = [
  'Aurelia', 'Valen', 'Seraphina', 'Kaelen', 'Zephyr',
  'Lyra', 'Morrigan', 'Darius', 'Vael', 'Astrid',
  'Solomon', 'Nyx', 'Ignis', 'Elowen', 'Corvus'
];

export default function LandingPage() {
  // Navigation & Deep Dive State
  const [activeTab, setActiveTab] = useState('loadout');
  const [selectedFaction, setSelectedFaction] = useState('Solari');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Character Loadout State
  const [characterName, setCharacterName] = useState('Aurelia');
  const [playMode, setPlayMode] = useState('singleplayer'); // 'singleplayer' | 'multiplayer'
  const [selectedClassId, setSelectedClassId] = useState('solari_vanguard');
  const [selectedOrderTag, setSelectedOrderTag] = useState('SUN');
  const [isLaunching, setIsLaunching] = useState(false);

  // Sound feedback synthesizer (Web Audio API)
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

  // Sync class selection when faction changes
  const handleFactionSelect = (facKey) => {
    setSelectedFaction(facKey);
    const firstCls = FACTIONS_DATA[facKey].classes[0];
    setSelectedClassId(firstCls.id);
    playSfx('click');
  };

  const activeFactionObj = FACTIONS_DATA[selectedFaction];
  const activeClassObj =
    activeFactionObj.classes.find((c) => c.id === selectedClassId) || activeFactionObj.classes[0];

  const handleRandomizeName = () => {
    const pick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(Math.random() * 89 + 10);
    setCharacterName(`${pick}_${num}`);
    playSfx('click');
  };

  const handleLaunchGame = () => {
    playSfx('launch');
    setIsLaunching(true);

    try {
      const finalName = characterName.trim() || 'Vanguard';
      const order = ORDER_PRESETS.find((o) => o.tag === selectedOrderTag) || ORDER_PRESETS[0];

      // Seed local storage with configured character so game loads it immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('glimmerfall_play_mode', playMode);

        const newCharId = `char_${Date.now()}`;
        const newChar = {
          id: newCharId,
          name: finalName,
          faction: selectedFaction,
          classId: activeClassObj.id,
          orderTag: order.tag,
          orderName: order.name,
          orderColor: order.color,
          homeBiome: 'sanctuary_hub',
          hp: 40,
          solarCharge: selectedFaction === 'Solari' ? 0 : 20,
          lastPosition: { roomType: 'sanctuary_hub', x: 0, y: 96 },
        };

        // Read single player roster
        const rawRoster = localStorage.getItem('glimmerfall_sp_roster_v2');
        let roster = [];
        try {
          roster = rawRoster ? JSON.parse(rawRoster) : [];
        } catch (_) {}

        // Add or update active character
        const existingIdx = roster.findIndex((c) => c.name.toLowerCase() === finalName.toLowerCase());
        if (existingIdx >= 0) {
          roster[existingIdx] = { ...roster[existingIdx], ...newChar };
          localStorage.setItem('glimmerfall_sp_active_id', roster[existingIdx].id);
        } else {
          roster.unshift(newChar);
          localStorage.setItem('glimmerfall_sp_active_id', newCharId);
        }
        localStorage.setItem('glimmerfall_sp_roster_v2', JSON.stringify(roster));

        // Redirect into main game client with params
        setTimeout(() => {
          window.location.href = `/?mode=${playMode}&autostart=1`;
        }, 350);
      }
    } catch (e) {
      console.error(e);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F8FAFC] selection:bg-[#F2A900] selection:text-black">
      {/* ========================================== */}
      {/* NAVIGATION BAR WITH LIVE SERVER STATUS     */}
      {/* ========================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-2xl tracking-wider text-white">
              GLIMMER<span className="text-[#F2A900] drop-shadow-[0_0_15px_rgba(242,169,0,0.6)]">FALL</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-head font-bold uppercase tracking-wider bg-[#22E07B]/15 text-[#22E07B] border border-[#22E07B]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22E07B] animate-ping" />
              20Hz Authoritative MMO
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-head font-semibold uppercase tracking-wider text-white/70">
            <a href="#forge" className="hover:text-[#F2A900] transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" /> Character Forge
            </a>
            <a href="#factions" className="hover:text-white transition-colors">
              4 Factions &amp; 8 Classes
            </a>
            <a href="#skills" className="hover:text-white transition-colors">
              7 Skills (Lv. 99)
            </a>
            <a href="#arena" className="hover:text-white transition-colors">
              3v3 Arena
            </a>
            <a href="#realms" className="hover:text-white transition-colors">
              World Atlas
            </a>
            <a href="#controls" className="hover:text-white transition-colors">
              Controls
            </a>
            <a
              href="https://glimmerfalltcg.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#00BFFF] hover:text-[#38bdf8] flex items-center gap-1"
            >
              TCG Oracle <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playSfx('click');
              }}
              title={soundEnabled ? 'Mute Interface Sound' : 'Enable Interface Sound'}
              className="p-2.5 rounded-full glass hover:border-white/30 text-white/70 hover:text-white transition-all"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#F2A900]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <a
              href="#forge"
              onClick={() => playSfx('click')}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F2A900] text-black font-head font-bold text-xs uppercase tracking-wider hover:bg-[#ffc21f] transition-all shadow-[0_0_20px_rgba(242,169,0,0.4)] hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-black" /> Awaken Champion
            </a>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION                               */}
      {/* ========================================== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C10]/60 via-[#0B0C10]/85 to-[#0B0C10]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-head font-semibold tracking-widest uppercase text-[#F2A900] mb-6 border border-[#F2A900]/30 shadow-[0_0_20px_rgba(242,169,0,0.2)]"
            >
              <Sparkles className="w-4 h-4 text-[#F2A900]" /> 16-Bit Top-Down 2D Pixel MMORPG
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-black leading-[1.05] text-5xl sm:text-6xl lg:text-7xl"
            >
              GLIMMER<span className="text-[#F2A900] drop-shadow-[0_0_25px_rgba(242,169,0,0.6)]">FALL</span>{' '}
              <span className="block text-[#00BFFF] drop-shadow-[0_0_25px_rgba(0,191,255,0.5)] text-4xl sm:text-5xl lg:text-6xl mt-2 font-display">
                ONLINE
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-6 text-white/70 max-w-xl text-lg leading-relaxed font-body"
            >
              Command top-down 8-directional action combat inspired by classic 16-bit RPGs. Harvest cosmic Glimmer leylines, socket authentic trading card relics, master 7 authentic professions to Level 99, and battle in real-time 3v3 Nexus Destruction arenas.
            </motion.p>

            {/* Quick Play CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <a
                href="#forge"
                onClick={() => playSfx('click')}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#F2A900] text-black font-head font-extrabold text-base hover:bg-[#ffc21f] transition-all shadow-[0_0_35px_rgba(242,169,0,0.5)] hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" /> Enter Character Loadout Forge
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#factions"
                onClick={() => playSfx('click')}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full glass font-head font-bold text-white hover:border-white/30 transition-all hover:bg-white/5"
              >
                <Swords className="w-5 h-5 text-[#00BFFF]" /> Explore Classes &amp; Lore
              </a>
            </motion.div>

            {/* Feature Bullets */}
            <div className="mt-12 flex flex-wrap gap-5 text-xs text-white/60 font-head">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-[#00BFFF]" /> 0ms Offline &bull; 20Hz Online</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#F2A900]" /> Exact Health &amp; Glimmer Persistence</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-[#22E07B]" /> 7 Skills to Level 99</span>
              <span className="flex items-center gap-1.5"><Boxes className="w-4 h-4 text-[#9B30FF]" /> 16-Bit Outlined Sprites</span>
            </div>
          </div>

          {/* Hero Visual Card Showcase */}
          <div className="relative h-[460px] hidden lg:flex items-center justify-center">
            <div className="absolute w-80 h-80 rounded-full bg-[#F2A900]/15 blur-3xl pointer-events-none" />
            <div className="absolute w-72 h-72 rounded-full bg-[#00BFFF]/15 blur-3xl translate-x-20 pointer-events-none" />

            {/* Solari Card (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: -10 }}
              animate={{ opacity: 1, x: -75, rotate: -6 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute z-10 w-56 rounded-2xl glass p-3 border border-[#F2A900]/40 shadow-2xl hover:scale-105 transition-transform"
            >
              <img
                src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp"
                alt="Solari Vanguard"
                className="w-full rounded-xl object-cover"
              />
              <div className="mt-2.5 text-center">
                <span className="text-[11px] font-head font-bold text-[#F2A900] uppercase tracking-wider">Solari Vanguard</span>
                <p className="text-[10px] text-white/60">Heavy Plate &bull; Radiant Guard</p>
              </div>
            </motion.div>

            {/* Central Nexus Monolith (Center) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="absolute z-20 w-64 rounded-2xl glass p-3.5 border-2 border-[#00BFFF] shadow-[0_0_35px_rgba(0,191,255,0.4)] hover:scale-105 transition-transform"
            >
              <img
                src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp"
                alt="Central Nexus"
                className="w-full rounded-xl object-cover"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-head font-black text-[#00BFFF] uppercase tracking-wider">World Objective</span>
                <p className="text-[11px] text-white/90 font-bold">Central Nexus Monolith &bull; 25 HP</p>
              </div>
            </motion.div>

            {/* Umbral Void Stalker (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 10 }}
              animate={{ opacity: 1, x: 75, rotate: 6 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute z-10 w-56 rounded-2xl glass p-3 border border-[#9B30FF]/40 shadow-2xl hover:scale-105 transition-transform"
            >
              <img
                src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/void_stalker-mdTofDRCVGbCIGSduoJbUcOKWcclJN.webp"
                alt="Void Stalker"
                className="w-full rounded-xl object-cover"
              />
              <div className="mt-2.5 text-center">
                <span className="text-[11px] font-head font-bold text-[#9B30FF] uppercase tracking-wider">Umbral Assassin</span>
                <p className="text-[10px] text-white/60">Shadow Shroud &bull; Stealth Crit</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MASSIVE MODERN CHARACTER LOADOUT FORGE COMPONENT          */}
      {/* Allows customizing name, mode, faction, class, order, and  */}
      {/* immediately launching Single Player or Multiplayer!       */}
      {/* ========================================================= */}
      <section id="forge" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2A900]/15 text-[#F2A900] border border-[#F2A900]/40 text-xs font-head font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Character Loadout
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white leading-tight">
            Forge Your Champion &bull; Choose Your Realm
          </h2>
          <p className="mt-4 text-white/65 font-body text-base">
            Select your mode, craft your moniker, choose your faction and class, then step seamlessly into the 2D world.
          </p>
        </div>

        <div className="massive-card rounded-3xl p-6 sm:p-10 border-2 border-white/15 relative overflow-hidden">
          {/* Subtle Faction Ambient Glow */}
          <div
            style={{ backgroundColor: `${activeFactionObj.color}15` }}
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
          />

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* LEFT / MAIN COLUMN: MASSIVE MODERN INPUTS */}
            <div className="lg:col-span-8 space-y-8">
              {/* STEP 1: MASSIVE MODERN NAME INPUT */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-head font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#F2A900]" />
                    Champion Moniker &bull; Cognomen
                  </label>
                  <span className="text-[11px] font-head text-white/40">
                    {characterName.length}/18 characters
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={characterName}
                    maxLength={18}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Enter your hero's moniker..."
                    className="massive-input w-full pr-32"
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-head font-bold text-white/80 hover:text-white transition-all flex items-center gap-1.5 border border-white/15"
                      title="Randomize Moniker"
                    >
                      <Dices className="w-4 h-4 text-[#F2A900]" />
                      <span className="hidden sm:inline">Randomize</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: DUAL-SEGMENTED PLAY MODE TOGGLE (SINGLE VS MULTI) */}
              <div>
                <label className="text-xs font-head font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 mb-2.5">
                  <Globe className="w-4 h-4 text-[#00BFFF]" />
                  Select Realm Play Mode
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Single Player Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPlayMode('singleplayer');
                      playSfx('click');
                    }}
                    className={`relative p-5 rounded-2xl border text-left transition-all ${
                      playMode === 'singleplayer'
                        ? 'border-[#22E07B] bg-[#22E07B]/10 shadow-[0_0_25px_rgba(34,224,123,0.25)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-head font-bold text-base text-white flex items-center gap-2">
                        🕹️ Single Player Realm
                      </span>
                      {playMode === 'singleplayer' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-head font-bold bg-[#22E07B] text-black">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 font-body leading-relaxed">
                      Instant local loop with <b>0ms latency</b>. Private offline world running completely client-side in browser storage.
                    </p>
                  </button>

                  {/* Multiplayer Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPlayMode('multiplayer');
                      playSfx('click');
                    }}
                    className={`relative p-5 rounded-2xl border text-left transition-all ${
                      playMode === 'multiplayer'
                        ? 'border-[#00BFFF] bg-[#00BFFF]/10 shadow-[0_0_25px_rgba(0,191,255,0.25)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-head font-bold text-base text-white flex items-center gap-2">
                        🌐 Multiplayer MMO
                      </span>
                      {playMode === 'multiplayer' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-head font-bold bg-[#00BFFF] text-black">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 font-body leading-relaxed">
                      Authoritative <b>20Hz multi-room server</b> with real-time player synchronization, open PvP Warzone &amp; 3v3 Arena.
                    </p>
                  </button>
                </div>
              </div>

              {/* STEP 3: 4 CANONICAL FACTIONS SELECTOR */}
              <div>
                <label className="text-xs font-head font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-4 h-4 text-[#F2A900]" />
                  Choose Canonical Faction Allegiance
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.keys(FACTIONS_DATA).map((fKey) => {
                    const f = FACTIONS_DATA[fKey];
                    const isSelected = selectedFaction === fKey;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => handleFactionSelect(fKey)}
                        style={{
                          borderColor: isSelected ? f.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: isSelected ? `${f.color}18` : 'rgba(18,21,30,0.6)',
                        }}
                        className={`p-3.5 rounded-2xl border text-center transition-all hover:scale-105 ${
                          isSelected ? 'shadow-lg' : 'hover:border-white/30'
                        }`}
                      >
                        <span
                          style={{ color: f.color }}
                          className="font-display font-black text-sm block mb-1 uppercase tracking-wider"
                        >
                          {fKey}
                        </span>
                        <span className="text-[10px] font-head text-white/50 block">
                          {f.name.replace('The ', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: ARCHETYPE & CLASS CHOOSER */}
              <div>
                <label className="text-xs font-head font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 mb-2.5">
                  <Swords className="w-4 h-4 text-[#F2A900]" />
                  Select Archetype ({selectedFaction})
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  {activeFactionObj.classes.map((cls) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          playSfx('click');
                        }}
                        style={{
                          borderColor: isSelected ? activeFactionObj.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: isSelected ? `${activeFactionObj.color}15` : 'rgba(18,21,30,0.6)',
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                          isSelected ? 'shadow-lg' : 'hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display font-bold text-base text-white">
                            {cls.name}
                          </span>
                          <span className="text-[10.5px] font-head px-2 py-0.5 rounded bg-white/10 text-white/80">
                            {cls.armor}
                          </span>
                        </div>
                        <p className="text-xs font-head font-medium text-[#F2A900] mb-2">
                          {cls.role}
                        </p>
                        <p className="text-xs text-white/60 font-body leading-relaxed mb-3">
                          {cls.desc}
                        </p>
                        <div className="text-[11px] font-head text-white/70 bg-black/30 p-2 rounded-lg border border-white/5">
                          <span className="text-white/40 block text-[9.5px] uppercase tracking-wider">Starter Ability</span>
                          <b>{cls.starterAbility}</b>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 5: ORDER CREST TAG SELECTOR */}
              <div>
                <label className="text-xs font-head font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 mb-2.5">
                  <Award className="w-4 h-4 text-[#F2A900]" />
                  Order Crest &bull; Heraldry Tag
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ORDER_PRESETS.map((order) => {
                    const isSelected = selectedOrderTag === order.tag;
                    return (
                      <button
                        key={order.tag}
                        type="button"
                        onClick={() => {
                          setSelectedOrderTag(order.tag);
                          playSfx('click');
                        }}
                        style={{
                          borderColor: isSelected ? order.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: isSelected ? `${order.color}20` : 'rgba(18,21,30,0.6)',
                          color: isSelected ? order.color : '#cbd5e1',
                        }}
                        className="p-3 rounded-xl border text-center font-head font-bold text-xs transition-all hover:scale-105"
                      >
                        <span className="block font-black text-sm">[{order.tag}]</span>
                        <span className="text-[10px] opacity-75">{order.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE PEDESTAL VISAGE & ACTION LAUNCHER */}
            <div className="lg:col-span-4 glass rounded-3xl p-6 border border-white/15 sticky top-24">
              <span className="text-[10.5px] font-head font-bold uppercase tracking-widest text-white/40 block mb-3 text-center">
                Champion Pedestal Preview
              </span>

              {/* Visage Box */}
              <div className="relative rounded-2xl bg-gradient-to-b from-black/40 to-black/80 border border-white/10 p-5 text-center overflow-hidden">
                <div
                  style={{ backgroundColor: `${activeFactionObj.color}20` }}
                  className="absolute inset-0 blur-2xl pointer-events-none"
                />

                <div className="relative z-10">
                  <div className="inline-block p-4 rounded-2xl glass border border-white/20 mb-3 shadow-xl">
                    <span className="text-4xl">⚔️</span>
                  </div>

                  <h3 className="font-display font-black text-2xl text-white">
                    {characterName.trim() || 'Vanguard'}
                  </h3>

                  <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-head font-bold">
                    <span style={{ color: activeFactionObj.color }}>[{selectedOrderTag}]</span>
                    <span className="text-white/60">&bull;</span>
                    <span className="text-white/80">{activeClassObj.name}</span>
                  </div>

                  <span className="text-[11px] font-body text-white/50 block mt-1">
                    {activeFactionObj.name}
                  </span>

                  {/* Vitals & Resource Preview */}
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-left">
                    <div className="glass p-2.5 rounded-xl border border-white/10">
                      <span className="text-[10px] font-head text-white/50 block">Vital Integrity</span>
                      <span className="text-xs font-num font-bold text-[#4ade80]">❤️ 40 / 40 HP</span>
                    </div>
                    <div className="glass p-2.5 rounded-xl border border-white/10">
                      <span className="text-[10px] font-head text-white/50 block">Resource Pool</span>
                      <span className="text-xs font-num font-bold text-[#38bdf8]">🔮 100 Glimmer</span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[10.5px] font-head text-white/60 bg-white/5 p-2 rounded-lg border border-white/5 text-left">
                    <span>🏛️ Starting Leyline Anchor: </span>
                    <b className="text-white">Awakening Sanctuary Hub</b>
                  </div>
                </div>
              </div>

              {/* Action Bar Hotkeys Preview */}
              <div className="mt-5">
                <span className="text-[10.5px] font-head font-bold uppercase tracking-wider text-white/40 block mb-2">
                  Action Bar Configuration
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {['[1] Primary', '[2] Rite', '[3] Spell', '[4] Burst'].map((slot, i) => (
                    <div
                      key={slot}
                      className="p-2 rounded-lg glass border border-white/10 text-center text-[10px] font-head"
                    >
                      <b className="text-[#F2A900] block">{slot.split(' ')[0]}</b>
                      <span className="text-white/50 text-[9px]">{i === 0 ? 'Flare' : 'Empty'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MASSIVE AWAKEN BUTTON */}
              <div className="mt-6">
                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={handleLaunchGame}
                  className="w-full py-4 px-6 rounded-2xl bg-[#F2A900] hover:bg-[#ffc21f] text-black font-display font-black text-lg tracking-wider uppercase transition-all shadow-[0_0_35px_rgba(242,169,0,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLaunching ? (
                    <>
                      <RotateCcw className="w-5 h-5 animate-spin" />
                      Awakening Champion...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-black" />
                      Awaken In Glimmerfall
                    </>
                  )}
                </button>

                <p className="text-[10.5px] text-white/50 text-center mt-2.5 font-body">
                  Zero download &bull; Runs 100% in your browser
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4 FACTIONS & 8 PLAYABLE CLASSES DEEP-DIVE                 */}
      {/* ========================================================= */}
      <section id="factions" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00BFFF]/15 text-[#00BFFF] border border-[#00BFFF]/40 text-xs font-head font-bold uppercase tracking-widest mb-3">
            <Layers className="w-3.5 h-3.5" /> Lore &bull; Doctrines &bull; Combat Mechanics
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white">
            The 4 Factions &bull; 8 Playable Archetypes
          </h2>
          <p className="mt-4 text-white/65 font-body text-base">
            Every faction commands a distinct primary and secondary resource mechanic, authentic trading card passives, and 2 specialized combat classes.
          </p>
        </div>

        {/* Faction Switcher Pills */}
        <div className="flex justify-center flex-wrap gap-3 mb-12">
          {Object.keys(FACTIONS_DATA).map((factionKey) => {
            const f = FACTIONS_DATA[factionKey];
            const isSelected = selectedFaction === factionKey;
            return (
              <button
                key={factionKey}
                onClick={() => handleFactionSelect(factionKey)}
                style={{
                  borderColor: isSelected ? f.color : 'rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? `${f.color}20` : 'rgba(18,21,30,0.6)',
                  color: isSelected ? f.color : '#cbd5e1',
                }}
                className="px-6 py-3 rounded-full font-head font-bold text-sm border transition-all duration-200 hover:scale-105"
              >
                {factionKey} Dominion
              </button>
            );
          })}
        </div>

        {/* Faction Deep-Dive Card */}
        <div className="glass rounded-3xl p-8 md:p-12 border border-white/15">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-8 mb-8">
            <div>
              <span
                style={{ color: activeFactionObj.color }}
                className="text-xs font-head font-bold uppercase tracking-widest block mb-1"
              >
                Faction Lore &amp; Doctrine
              </span>
              <h3 className="text-3xl font-display font-bold text-white">{activeFactionObj.name}</h3>
              <p className="text-sm italic text-white/60 mt-1">"{activeFactionObj.motto}"</p>
            </div>
            <div className="glass px-5 py-3 rounded-xl border border-white/10">
              <span className="text-[11px] font-head font-medium text-white/50 block">Resource System</span>
              <span className="text-sm font-head font-bold" style={{ color: activeFactionObj.color }}>
                {activeFactionObj.resource}
              </span>
            </div>
          </div>

          {/* 2 Playable Classes */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {activeFactionObj.classes.map((cls) => (
              <div
                key={cls.name}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-white/25 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xl font-display font-bold text-white">{cls.name}</h4>
                  <span className="text-xs font-head px-2.5 py-1 rounded bg-white/5 text-white/80 border border-white/10">
                    {cls.role}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-white/50 font-head mb-3">
                  <span>Armor: <b className="text-white/80">{cls.armor}</b></span>
                  <span>Weapon: <b className="text-white/80">{cls.weapon}</b></span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-5 font-body">{cls.desc}</p>
                <div>
                  <span className="text-[11px] font-head font-bold uppercase text-white/40 tracking-wider block mb-2">
                    Core Action Abilities
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cls.abilities.map((ab) => (
                      <span key={ab} className="text-xs px-2.5 py-1 rounded-md glass font-head text-white/80">
                        {ab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Socketable Card Relics from this Faction */}
          <div>
            <span className="text-xs font-head font-bold uppercase text-white/40 tracking-wider block mb-4">
              Socketable TCG Relic Cards ({selectedFaction})
            </span>
            <div className="grid sm:grid-cols-2 gap-4">
              {activeFactionObj.cards.map((card) => (
                <div key={card.name} className="glass rounded-xl p-3 flex items-center gap-4 border border-white/10">
                  <img src={card.url} alt={card.name} className="w-14 h-20 rounded-lg object-cover" />
                  <div>
                    <h5 className="font-head font-bold text-sm text-white">{card.name}</h5>
                    <p className="text-xs font-head font-semibold mt-1" style={{ color: activeFactionObj.color }}>
                      {card.stat}
                    </p>
                    <span className="text-[10px] text-white/40 font-body">TCG Card-Relic Socket Perk</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7 AUTHENTIC SKILLS & 99-LEVEL PROGRESSION                 */}
      {/* ========================================================= */}
      <section id="skills" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#22E07B]/15 text-[#22E07B] border border-[#22E07B]/40 text-xs font-head font-bold uppercase tracking-widest mb-3">
            <Award className="w-3.5 h-3.5" /> 99-Level Progression &bull; Mastery Capes
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white">
            7 Authentic Skills &bull; Master to Level 99
          </h2>
          <p className="mt-4 text-white/65 font-body text-base">
            Every profession has deep interactive training, recipe unlocks, and prestigious Level 99 Skillcapes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROFESSIONS_LIST.map((prof) => (
            <div
              key={prof.id}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-white/25 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  style={{ backgroundColor: `${prof.color}20`, borderColor: `${prof.color}40` }}
                  className="w-12 h-12 rounded-xl border flex items-center justify-center text-xl"
                >
                  {prof.icon}
                </div>
                <span className="text-[10.5px] font-head font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/60">
                  {prof.category}
                </span>
              </div>

              <h4 className="text-lg font-display font-bold text-white mb-1">{prof.name}</h4>
              <p className="text-xs font-head text-[#F2A900] mb-3">{prof.summary}</p>
              <p className="text-xs text-white/70 font-body leading-relaxed mb-4">{prof.desc}</p>

              <div className="border-t border-white/10 pt-3 text-[11px] font-head text-white/60">
                <span className="text-white/40 block text-[9.5px] uppercase tracking-wider">Lv. 99 Cape Prestige</span>
                <b className="text-white/90">{prof.cape}</b>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3v3 NEXUS DESTRUCTION ARENA                               */}
      {/* ========================================================= */}
      <section id="arena" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="relative rounded-3xl overflow-hidden glass border border-[#00BFFF]/30 p-8 md:p-14">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#00BFFF]/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00BFFF]/15 text-[#00BFFF] border border-[#00BFFF]/40 text-xs font-head font-bold uppercase tracking-widest mb-4">
              <Swords className="w-3.5 h-3.5" /> Competitive 3v3 Mode
            </span>
            <h3 className="text-3xl md:text-5xl font-display font-black text-white leading-tight">
              3v3 Nexus Destruction Arena
            </h3>
            <p className="mt-4 text-white/70 font-body text-base leading-relaxed">
              Queue into the ranked 3v3 Nexus Warzone. Coordinate crowd control, focus-fire enemy champions, control harvestable energy fonts, and shatter the enemy 25-HP Nexus Monolith. After match completion, players are <b>automatically teleported back to their exact previous world spot</b>.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <div className="glass p-4 rounded-xl border border-white/10 text-center">
                <span className="text-2xl font-num font-bold text-[#38bdf8] block">25 HP</span>
                <span className="text-xs text-white/60 font-head">Nexus Monolith Rule</span>
              </div>
              <div className="glass p-4 rounded-xl border border-white/10 text-center">
                <span className="text-2xl font-num font-bold text-[#F2A900] block">3 vs 3</span>
                <span className="text-xs text-white/60 font-head">Squad Composition</span>
              </div>
              <div className="glass p-4 rounded-xl border border-white/10 text-center">
                <span className="text-2xl font-num font-bold text-[#22E07B] block">1.5s GCD</span>
                <span className="text-xs text-white/60 font-head">Spell Queueing</span>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <a
                href="#forge"
                onClick={() => playSfx('click')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#00BFFF] text-black font-head font-bold text-sm hover:bg-[#33ccff] transition-all shadow-[0_0_25px_rgba(0,191,255,0.4)]"
              >
                <Play className="w-4 h-4 fill-black" /> Enter Matchmaking Queue
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CONTINENTAL REALMS & DUNGEONS ATLAS                       */}
      {/* ========================================================= */}
      <section id="realms" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2A900]/15 text-[#F2A900] border border-[#F2A900]/40 text-xs font-head font-bold uppercase tracking-widest mb-3">
            <Compass className="w-3.5 h-3.5" /> Seamless World Traversal
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white">
            Continental Realms &amp; Dungeons
          </h2>
          <p className="mt-4 text-white/65 font-body text-base">
            Explore safe havens, faction biomes, scheduled siege warzones, and seamless edge-transition dungeons.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REALMS_ATLAS.map((realm) => (
            <div
              key={realm.name}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#F2A900]" />
                <h4 className="font-display font-bold text-base text-white">{realm.name}</h4>
              </div>
              <span className="text-[11px] font-head text-[#38bdf8] block mb-2">{realm.type}</span>
              <p className="text-xs text-white/60 font-body leading-relaxed">{realm.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* CONTROLS GUIDE & KEYBOARD REFERENCE                       */}
      {/* ========================================================= */}
      <section id="controls" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="glass rounded-3xl p-8 md:p-12 border border-white/10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-head font-bold uppercase tracking-widest text-[#F2A900] block mb-2">
              Action Combat Inputs
            </span>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Keyboard &bull; Hotkey Reference
            </h3>
            <p className="text-sm text-white/70 font-body leading-relaxed mb-6">
              Precision top-down control with 8-directional movement, responsive hotbar slots, and instant interactive prompts.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-head">
              <div className="glass p-3 rounded-xl border border-white/10">
                <b className="text-[#F2A900] block mb-0.5">[WASD]</b>
                <span className="text-white/60">8-Way Character Movement</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/10">
                <b className="text-[#00BFFF] block mb-0.5">[1 - 8]</b>
                <span className="text-white/60">Action Bar Rites &amp; Flashes</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/10">
                <b className="text-[#22E07B] block mb-0.5">[E] Key</b>
                <span className="text-white/60">Harvest Leylines &amp; Nodes</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/10">
                <b className="text-[#9B30FF] block mb-0.5">[Shift + 1-4]</b>
                <span className="text-white/60">Secondary Utility &amp; Defensives</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/10">
                <b className="text-white block mb-0.5">[I] / [C] / [P]</b>
                <span className="text-white/60">Inventory &bull; Paperdoll &bull; Spellbook</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/10">
                <b className="text-white block mb-0.5">[Space] / [Enter]</b>
                <span className="text-white/60">Leap &bull; Chat Channel</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-8 border border-white/15 text-center">
            <span className="text-xs font-head uppercase tracking-wider text-[#00BFFF] font-bold block mb-2">
              Ready to Join the Battle?
            </span>
            <h4 className="text-2xl font-display font-bold text-white mb-4">
              Play Free in Your Browser
            </h4>
            <p className="text-xs text-white/60 font-body mb-6 max-w-sm mx-auto leading-relaxed">
              No client installation or launcher downloads required. Fully authenticated in-memory or PostgreSQL state persistence.
            </p>
            <a
              href="#forge"
              onClick={() => playSfx('click')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F2A900] text-black font-head font-extrabold text-sm hover:bg-[#ffc21f] transition-all shadow-[0_0_25px_rgba(242,169,0,0.5)] hover:scale-105"
            >
              <Play className="w-4 h-4 fill-black" /> Open Character Loadout Forge
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <footer className="border-t border-white/10 py-12 px-6 glass">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-display font-black text-xl tracking-wider text-white">
              GLIMMER<span className="text-[#F2A900]">FALL</span> ONLINE
            </span>
            <p className="text-xs text-white/50 font-body mt-1">
              Based on the Glimmerfall TCG Universe &bull;{' '}
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="text-[#00BFFF] hover:underline">
                glimmerfalltcg.com
              </a>
            </p>
          </div>

          <div className="flex gap-6 text-xs font-head text-white/60">
            <a href="https://glimmerfalltcg.com/rules" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Rulebook
            </a>
            <a href="https://glimmerfalltcg.com/cards" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Card Oracle
            </a>
            <a href="https://glimmerfalltcg.com/community" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Community
            </a>
            <a href="https://glimmerfalltcg.com/stores" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Store Locator
            </a>
          </div>

          <div className="text-xs text-white/40 font-body">
            &copy; 2026 GlimmerFall. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
