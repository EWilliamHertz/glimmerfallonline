'use client';

import React, { useState, useEffect } from 'react';
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
  Settings,
} from 'lucide-react';

const LOGO_PATH = '/GlimmerFall_official_multicolor_logo.png';

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
  { id: 'chronocore', name: 'Chronocore Prism', slot: 'Relic', rarity: 'Cosmic Relic', icon: '💎', stat: 'World Nexus Anchor (25 HP Rule)', color: '#00BFFF', desc: 'Authentic TCG relic from glimmerfalltcg.com. Protects your Outpost Nexus.' },
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
  { tag: 'SUN', name: 'Order of Dawn', color: '#F2A900', emblem: '☀️' },
  { tag: 'VOID', name: 'Duskveil Cabal', color: '#9B30FF', emblem: '🌑' },
  { tag: 'ROOT', name: 'Ironwood Watch', color: '#22E07B', emblem: '🌿' },
  { tag: 'AETH', name: 'Chronocore Wardens', color: '#00BFFF', emblem: '🔮' },
  { tag: 'GLIM', name: 'GlimmerFall Founders', color: '#FB923C', emblem: '⚡' },
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

        // Determine destination: if on standalone Next.js marketing page, navigate to /game.html; else /
        const isStandalone = typeof window !== 'undefined' && !document.getElementById('frontpage-overlay');
        const targetUrl = isStandalone
          ? `/game.html?mode=${playMode}&autostart=1`
          : `/?mode=${playMode}&autostart=1`;

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
      const isStandalone = !document.getElementById('frontpage-overlay');
      window.location.href = isStandalone ? '/game.html?loadout=1' : '/?loadout=1';
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
                width={48}
                height={48}
                style={{ maxWidth: 48, maxHeight: 48 }}
                className="sidebar-logo-img w-full h-full object-contain filter drop-shadow(0 0 6px #F2A900)"
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
                20Hz Authoritative MMO • 0ms Local
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
          <a href="/" className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F2A900]/15 border border-[#F2A900]/40 text-[#FDE047] hover:bg-[#F2A900]/25 transition-all font-bold mb-2 shadow-[0_0_12px_rgba(242,169,0,0.2)]">
            <span className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#F2A900]" /> Enter Full 2D Game
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-[#F2A900]">LIVE ↗</span>
          </a>
          <a href="#forge" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#F2A900] transition-colors">
            <Sparkles className="w-4 h-4 text-[#F2A900]" /> Character Forge
          </a>
          <a href="#game-encyclopedia" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#38BDF8] transition-colors">
            <BookOpen className="w-4 h-4 text-[#38BDF8]" /> Game Systems Encyclopedia
          </a>
          <a href="#lore-tcg" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#9B30FF] transition-colors">
            <Scroll className="w-4 h-4 text-[#9B30FF]" /> World Lore &amp; Chronicle
          </a>
          <a href="#tcg-cards" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#38BDF8] transition-colors">
            <Sparkles className="w-4 h-4 text-[#38BDF8]" /> Authentic TCG Cards
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
          <a href="#settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-[#F2A900] transition-colors">
            <Settings className="w-4 h-4 text-[#F2A900]" /> Preferences &amp; Settings
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
            <span>Start on this site (Loadout)</span>
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
      <main className="flex-1 min-h-screen px-4 py-8 lg:px-12 lg:py-12 space-y-16">
        {/* HERO BANNER SECTION */}
        <section id="prologue-hero" className="relative rounded-3xl p-8 lg:p-14 overflow-hidden border border-[#1E293B] bg-radial from-[#131D38] via-[#090E1E] to-[#050814] shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F2A900]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            {/* Header with Official Logo */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-2xl bg-black/60 border border-[#F2A900]/40 shadow-[0_0_25px_rgba(242,169,0,0.3)]">
                <img
                  src={LOGO_PATH}
                  alt="GlimmerFall Official Logo"
                  width={48}
                  height={48}
                  style={{ maxWidth: 48, maxHeight: 48 }}
                  className="hero-logo-img w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow(0 0 10px #F2A900)"
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
              Before the continent formed, the celestial <b>Crystal Heart shattered</b>, fracturing unified light into four elemental aspects:
              <span className="text-[#F2A900] font-bold"> Solar Light</span>,
              <span className="text-[#9B30FF] font-bold"> Void</span>,
              <span className="text-[#22E07B] font-bold"> Verdant Root</span>, and
              <span className="text-[#38BDF8] font-bold"> Celestial Mist</span>.
              Harvest living Glimmer fonts, socket trading card relics from{' '}
              <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="text-[#38BDF8] underline font-bold">
                glimmerfalltcg.com
              </a>, master 7 disciplines to Level 99, and defend your 25-HP Outpost Nexus in 3v3 destruction arenas.
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
                  ⚡ Enter GlimmerFall
                </button>

                {/* 60 FPS Hero Sprite Animation Showcase */}
                <div className="mt-4 rounded-2xl overflow-hidden border border-[#1E293B] bg-black/60 shadow-lg">
                  <div className="px-3.5 py-2.5 bg-[#0D152B] border-b border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#38BDF8] flex items-center gap-1.5">
                      🎬 HERO SPRITE REEL (60 FPS)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] font-bold">
                      1080p Full HD
                    </span>
                  </div>
                  <video
                    src="https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall/cinematics/pixel_art_animation_sheet_1080p.mp4"
                    poster="/GlimmerFall_official_multicolor_logo.png"
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-[220px] object-contain bg-black"
                  />
                  <div className="p-2.5 text-[11px] text-white/60 leading-tight">
                    Official 60 FPS pixel animation showcase: 8-directional sprints, combat attacks, and ability casting rites.
                  </div>
                </div>
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
                    Melee strikes deliver a 90-degree frontal cleave covering 34 pixels. Projectiles track omni-directional vectors with 16px radius hitboxes. Real-time client prediction synchronizes seamlessly with the 20Hz server.
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

        {/* ======================================================== */}
        {/* WORLD LORE & CHRONICLE SECTION (#lore-chronicle / #lore-tcg) */}
        {/* ======================================================== */}
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

        {/* ======================================================== */}
        {/* AUTHENTIC TCG CARDS SECTION (#tcg-cards) */}
        {/* ======================================================== */}
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
              { name: 'Chronocore Prism', role: 'World Nexus Monolith (25 HP Rule)', img: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp' },
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
                🛡️ CONTINENTAL ARMORY &amp; CRAFTING VAULT
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
              { id: 'abyssal', name: 'Abyssal Rift', tag: 'High-Level Dungeon', color: '#A855F7', desc: 'Endgame chasm where elite void abominations and corrupted keystones lurk.' },
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

        {/* ======================================================== */}
        {/* SETTINGS & PREFERENCES SECTION (#settings) */}
        {/* ======================================================== */}
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
                  <b className="text-[#4ADE80]">20Hz Authoritative Tick Loop</b>
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
