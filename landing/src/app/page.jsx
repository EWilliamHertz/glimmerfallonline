'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

const HERO_BG =
  'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/static/hero_bg-LEXvPiF25DW4GwYAIML7yqFaTveuiz.png';

const FACTIONS_DATA = {
  Solari: {
    name: 'The Sunspire Dominion',
    motto: 'May the Sunspire illuminate the darkness.',
    color: '#F2A900',
    border: 'border-[#F2A900]',
    badgeBg: 'bg-[#F2A900]/15',
    resource: 'Solar Charge (0-100) & Zenith State',
    classes: [
      {
        name: 'Sunforged Paladin',
        role: 'Tank / Melee Bruiser',
        armor: 'Heavy Plate',
        desc: 'Channels blinding solar flares, generates radiant threat with shield slams, and enters Zenith State at 100 Solar Charge.',
        abilities: ['Strike of Dawn', 'Aegis of the Sunspire', 'Judgment of Sol', 'Consecrated Ground'],
      },
      {
        name: 'Solar Cleric',
        role: 'Healer / Radiant Caster',
        armor: 'Mail / Cloth',
        desc: 'Channels holy light beams, mending wounded allies and consecrating the field against void corruption.',
        abilities: ['Radiant Mending', 'Solar Beam', 'Aura of the Dawn', 'Purify'],
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
    classes: [
      {
        name: 'Chronomancer',
        role: 'Ranged DPS / Time Distorter',
        armor: 'Cloth',
        desc: 'Bends the flow of temporal reality, accelerating ally haste and opening gravity singularities that crush enemy formations.',
        abilities: ['Temporal Blast', 'Gravity Singularity', 'Time Warp Rewind', 'Astral Comet'],
      },
      {
        name: 'Riftblade Spellweaver',
        role: 'Hybrid Melee/Ranged Battlemage',
        armor: 'Medium Mail',
        desc: 'Dashes through spatial dimensional rifts, blinking behind foes with arcane-infused blade cleaves.',
        abilities: ['Phase Strike', 'Warp Lunge', 'Aetherial Blades', 'Singularity Slash'],
      },
    ],
    cards: [
      {
        name: 'Mana Crystal',
        url: 'https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp',
        stat: '+25 Max Energy & Rapid Regen',
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
    resource: 'Primal Fury (0-100) & Stone Armor',
    classes: [
      {
        name: 'Stonebark Juggernaut',
        role: 'Colossal Tank / Controller',
        armor: 'Living Stoneplate',
        desc: 'Unleashes seismic upheavals, encasing in thornbark briars that reflect damage and stun attackers.',
        abilities: ['Tectonic Slam', 'Thornbark Carapace', 'Boulder Toss', 'Worldbreaker Crater'],
      },
      {
        name: 'Sylvan Weaver',
        role: 'Healer / HoT & Flora Specialist',
        armor: 'Leather',
        desc: 'Germinates verdant life seeds across party members, bursting with rapid healing pulses and cleansing venoms.',
        abilities: ['Bloom of Life', 'Spore Cloud', 'Parasitic Vine', 'Heart of Rootdeep'],
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
    resource: 'Shadow Energy (100 Cap) & Dusk Points (1-5)',
    classes: [
      {
        name: 'Nightblade Assassin',
        role: 'Melee Burst DPS / Stealth',
        armor: 'Shadow Leather',
        desc: 'Strikes from stealth with serrated daggers, generating Dusk Points to detonate targets with critical finishers.',
        abilities: ['Duskveil Cloak', 'Shadowstrike', 'Serrated Mutilate', 'Eviscerating Bite'],
      },
      {
        name: 'Hexbinder Warlock',
        role: 'Ranged Affliction & Drain Caster',
        armor: 'Cloth',
        desc: 'Afflicts enemies with escalating blood curses, draining soul vitality and causing foes to flee in dread terror.',
        abilities: ['Umbral Bolt', 'Curse of Withered Blood', 'Soul Harvest', 'Unstable Hex'],
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

const FEATURES = [
  {
    icon: Swords,
    title: 'Top-Down 16-Bit Pixel Combat',
    desc: 'Crisp Zelda / Chrono Trigger / RotMG-inspired 2D pixel action. 8-directional WASD movement, melee cleave arcs, and remappable pixel hotbars.',
    color: '#F2A900',
  },
  {
    icon: Zap,
    title: '3v3 Nexus Destruction Arena',
    desc: 'Queue up alongside AI allied champions. Control harvestable energy fonts and shatter the enemy Red Nexus (25 HP Rule).',
    color: '#00BFFF',
  },
  {
    icon: Layers,
    title: 'Pixelated TCG Relic Socketing',
    desc: 'Equip original trading cards from glimmerfalltcg.com rendered in real-time pixel art to augment your abilities with faction passives.',
    color: '#9B30FF',
  },
  {
    icon: Flame,
    title: 'Integer-Scaled Pixel Sprite Engine',
    desc: 'Razor-sharp 1px-outlined sprites, Y-sorted depth rendering, animated 16x16 tilesets, 2x/3x/4x integer zoom, and CRT scanline mode.',
    color: '#22E07B',
  },
  {
    icon: Compass,
    title: 'Awakening Tutorial Island',
    desc: 'Master top-down pixel combat on the Sanctuary Isle, strike training dummies, harvest Aether spires, and step into the Astral Rift.',
    color: '#F2A900',
  },
  {
    icon: Moon,
    title: 'Pixel Smoke Dissolution & Chiptune',
    desc: 'Vanquished enemies burst into rising clouds of chunky purple pixel smoke accompanied by 8-bit chiptune Web Audio SFX.',
    color: '#9B30FF',
  },
];

export default function LandingPage() {
  const [selectedFaction, setSelectedFaction] = useState('Solari');
  const activeFaction = FACTIONS_DATA[selectedFaction];

  const handleLaunchGame = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/game.html';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F8FAFC]">
      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-2xl tracking-wider text-white">
              GLIMMER<span className="text-[#F2A900] drop-shadow-[0_0_15px_rgba(242,169,0,0.6)]">FALL</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-head font-bold uppercase tracking-widest bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/40">
              Online 2D Pixel MMO
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-head font-medium text-white/70">
            <a href="#factions" className="hover:text-white transition-colors">
              Factions &amp; Classes
            </a>
            <a href="#arena" className="hover:text-white transition-colors">
              3v3 Nexus Arena
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Combat Features
            </a>
            <a href="#pipeline" className="hover:text-white transition-colors">
              3D AI Pipeline
            </a>
            <a href="https://glimmerfalltcg.com" target="_blank" rel="noreferrer" className="hover:text-[#F2A900] transition-colors flex items-center gap-1">
              TCG Oracle <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={handleLaunchGame}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F2A900] text-black font-head font-bold text-sm hover:bg-[#ffc21f] transition-all shadow-[0_0_20px_rgba(242,169,0,0.4)]"
          >
            <Play className="w-4 h-4 fill-black" /> Play Pre-Alpha
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden">
        {/* Ambient Hero Art Background */}
        <div className="absolute inset-0 z-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C10]/60 via-[#0B0C10]/80 to-[#0B0C10]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-head font-semibold tracking-widest uppercase text-[#F2A900] mb-6 border border-[#F2A900]/30 shadow-[0_0_15px_rgba(242,169,0,0.2)]"
            >
              <Sparkles className="w-4 h-4 text-[#F2A900]" /> GlimmerFall Universe Expansion
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
              transition={{ delay: 0.3 }}
              className="mt-6 text-white/70 max-w-lg text-lg leading-relaxed font-body"
            >
              Enter the official 16-bit 2D Pixel Art MMORPG based on the <i>GlimmerFall TCG</i> card-battler universe.
              Wield top-down radiant abilities, harvest Aether resonance crystals, socket pixelated card relics, and shatter enemy Nexus monoliths in intense 3v3 arena battles.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <button
                onClick={handleLaunchGame}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#F2A900] text-black font-head font-extrabold text-base hover:bg-[#ffc21f] transition-all shadow-[0_0_35px_rgba(242,169,0,0.5)] hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" /> Launch MMORPG Client
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#arena"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full glass font-head font-bold text-white hover:border-white/30 transition-all hover:bg-white/5"
              >
                <Swords className="w-5 h-5 text-[#00BFFF]" /> 3v3 Nexus Arena
              </a>
            </motion.div>

            {/* Quick Specs Badges */}
            <div className="mt-12 flex flex-wrap gap-6 text-xs text-white/50 font-head">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-[#00BFFF]" /> Zero Download 2D Pixel Canvas</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#F2A900]" /> 8 Playable Classes</span>
              <span className="flex items-center gap-1.5"><Boxes className="w-4 h-4 text-[#9B30FF]" /> 16-Bit Outlined Sprites &amp; Chiptune SFX</span>
            </div>
          </div>

          {/* Hero Visual Card Stack */}
          <div className="relative h-[480px] hidden lg:flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute w-80 h-80 rounded-full bg-[#F2A900]/15 blur-3xl" />
            <div className="absolute w-72 h-72 rounded-full bg-[#00BFFF]/15 blur-3xl translate-x-20" />

            {/* Card 1: Solari Hero (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: -12 }}
              animate={{ opacity: 1, x: -80, rotate: -8 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute z-10 w-60 rounded-2xl glass p-3 border border-[#F2A900]/40 shadow-2xl hover:scale-105 transition-transform"
            >
              <img
                src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards/solari_vanguard-YFbhwOPGHYNEmDfQQm2CZfBk9fZJBI.webp"
                alt="Solari Hero"
                className="w-full rounded-xl object-cover"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-head font-bold text-[#F2A900] uppercase tracking-wider">Player Model</span>
                <p className="text-[11px] text-white/60">Solari Vanguard &bull; ~12k Tris PBR</p>
              </div>
            </motion.div>

            {/* Card 2: Central Nexus Monolith (Center) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="absolute z-20 w-64 rounded-2xl glass p-3 border-2 border-[#00BFFF] shadow-[0_0_35px_rgba(0,191,255,0.4)] hover:scale-105 transition-transform"
            >
              <img
                src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/chronocore_prism_6eca2de9-tghtsdxz1Tl6oMafBny57jAs96P1Ki.webp"
                alt="Central Nexus"
                className="w-full rounded-xl object-cover"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-head font-extrabold text-[#00BFFF] uppercase tracking-wider">World Objective</span>
                <p className="text-[11px] text-white/80 font-bold">Central Nexus Monolith &bull; 25 HP</p>
              </div>
            </motion.div>

            {/* Card 3: Resonance Font (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 12 }}
              animate={{ opacity: 1, x: 80, rotate: 8 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute z-10 w-60 rounded-2xl glass p-3 border border-[#9B30FF]/40 shadow-2xl hover:scale-105 transition-transform"
            >
              <img
                src="https://wqnuijtdmorxprhl.public.blob.vercel-storage.com/glimmerfall/cards2/mana_crystal_85d4da2e-150onQbusVx2hyQEu7HfosXCqX0Ktc.webp"
                alt="Mana Crystal"
                className="w-full rounded-xl object-cover"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-head font-bold text-[#9B30FF] uppercase tracking-wider">Harvestable Node</span>
                <p className="text-[11px] text-white/60">Aether Crystal Spire &bull; Press [E]</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FACTIONS & 8 PLAYABLE CLASSES SHOWCASE */}
      <section id="factions" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-head font-bold tracking-widest uppercase text-[#F2A900] mb-3">
            Choose Your Allegiance
          </h2>
          <h3 className="text-3xl md:text-5xl font-display font-black text-white">
            Four Factions &bull; 8 Playable Classes
          </h3>
          <p className="mt-4 text-white/60 font-body text-base">
            Every faction commands a unique primary and secondary resource mechanic, from Solari's Zenith State to Umbri's Dusk combo point finishers.
          </p>
        </div>

        {/* Faction Selector Tabs */}
        <div className="flex justify-center flex-wrap gap-3 mb-12">
          {Object.keys(FACTIONS_DATA).map((factionKey) => {
            const f = FACTIONS_DATA[factionKey];
            const isSelected = selectedFaction === factionKey;
            return (
              <button
                key={factionKey}
                onClick={() => setSelectedFaction(factionKey)}
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

        {/* Selected Faction Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFaction}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="glass rounded-3xl p-8 md:p-12 border border-white/15"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-8 mb-8">
              <div>
                <span
                  style={{ color: activeFaction.color }}
                  className="text-xs font-head font-bold uppercase tracking-widest block mb-1"
                >
                  Faction Lore &amp; Doctrine
                </span>
                <h4 className="text-3xl font-display font-bold text-white">{activeFaction.name}</h4>
                <p className="text-sm italic text-white/60 mt-1">"{activeFaction.motto}"</p>
              </div>
              <div className="glass px-4 py-2.5 rounded-xl border border-white/10">
                <span className="text-[11px] font-head font-medium text-white/50 block">Resource System</span>
                <span className="text-sm font-head font-bold text-white" style={{ color: activeFaction.color }}>
                  {activeFaction.resource}
                </span>
              </div>
            </div>

            {/* 2 Playable Classes */}
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {activeFaction.classes.map((cls) => (
                <div key={cls.name} className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xl font-display font-bold text-white">{cls.name}</h5>
                    <span className="text-xs font-head px-2.5 py-1 rounded bg-white/5 text-white/80 border border-white/10">
                      {cls.role}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 font-head mb-4">Armor Type: <b className="text-white/80">{cls.armor}</b></p>
                  <p className="text-sm text-white/70 leading-relaxed mb-5 font-body">{cls.desc}</p>
                  <div>
                    <span className="text-[11px] font-head font-bold uppercase text-white/40 tracking-wider block mb-2">Core Abilities</span>
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
                {activeFaction.cards.map((card) => (
                  <div key={card.name} className="glass rounded-xl p-3 flex items-center gap-4 border border-white/10">
                    <img src={card.url} alt={card.name} className="w-14 h-20 rounded-lg object-cover" />
                    <div>
                      <h6 className="font-head font-bold text-sm text-white">{card.name}</h6>
                      <p className="text-xs font-head font-semibold mt-1" style={{ color: activeFaction.color }}>
                        {card.stat}
                      </p>
                      <span className="text-[10px] text-white/40 font-body">Card-Relic Passive Perk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* 3v3 NEXUS ARENA SPOTLIGHT */}
      <section id="arena" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="relative rounded-3xl overflow-hidden glass border border-[#00BFFF]/30 p-8 md:p-14">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#00BFFF]/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00BFFF]/15 text-[#00BFFF] border border-[#00BFFF]/40 text-xs font-head font-bold uppercase tracking-widest mb-4">
              <Swords className="w-3.5 h-3.5" /> Competitive Gameplay Mode
            </span>
            <h3 className="text-3xl md:text-5xl font-display font-black text-white leading-tight">
              3v3 Nexus Destruction Arena
            </h3>
            <p className="mt-4 text-white/70 font-body text-base leading-relaxed">
              Matchmake in the Glimmerfall Warzone. Your team of 3 champions must coordinate tab-target crowd control, focus-fire enemy voidstalkers, and harvest Aether spires to shatter the rival Nexus Monolith.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <div className="glass p-4 rounded-xl border border-white/10 text-center">
                <span className="text-2xl font-num font-bold text-[#38bdf8] block">25 HP</span>
                <span className="text-xs text-white/60 font-head">Nexus Rule Integrity</span>
              </div>
              <div className="glass p-4 rounded-xl border border-white/10 text-center">
                <span className="text-2xl font-num font-bold text-[#F2A900] block">3 vs 3</span>
                <span className="text-xs text-white/60 font-head">Squad Combat</span>
              </div>
              <div className="glass p-4 rounded-xl border border-white/10 text-center">
                <span className="text-2xl font-num font-bold text-[#22E07B] block">1.5s GCD</span>
                <span className="text-xs text-white/60 font-head">Spell Queueing</span>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleLaunchGame}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#00BFFF] text-black font-head font-bold text-sm hover:bg-[#33ccff] transition-all shadow-[0_0_25px_rgba(0,191,255,0.4)]"
              >
                <Play className="w-4 h-4 fill-black" /> Enter Matchmaking Queue
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-head font-bold tracking-widest uppercase text-[#F2A900] mb-3">
            Engine &amp; Systems Architecture
          </h2>
          <h3 className="text-3xl md:text-4xl font-display font-black text-white">
            Built for High-Skill MMORPG Play
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass rounded-2xl p-7 border border-white/10 hover:border-white/25 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  style={{ backgroundColor: `${feat.color}20`, borderColor: `${feat.color}40` }}
                  className="w-12 h-12 rounded-xl border flex items-center justify-center mb-5"
                >
                  <Icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h4 className="text-lg font-head font-bold text-white mb-2">{feat.title}</h4>
                <p className="text-sm text-white/60 font-body leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTROLS GUIDE & TUTORIAL ISLAND */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="glass rounded-3xl p-8 md:p-12 border border-white/10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-head font-bold uppercase tracking-widest text-[#F2A900] block mb-2">
              Smooth Onboarding
            </span>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Awakening Isle Tutorial &bull; Keyboard Controls
            </h3>
            <p className="text-sm text-white/70 font-body leading-relaxed mb-6">
              New champions start on the celestial Isle of Awakening. Target training dummies, harvest Aether resonance spires, and dissolve foes into smoke before taking the Astral Portal into the Great Warzone.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-head">
              <div className="glass p-3 rounded-lg border border-white/10">
                <b className="text-[#F2A900] block mb-0.5">[WASD]</b>
                <span className="text-white/60">Move Character in 3rd Person</span>
              </div>
              <div className="glass p-3 rounded-lg border border-white/10">
                <b className="text-[#00BFFF] block mb-0.5">[Hold Mouse]</b>
                <span className="text-white/60">Rotate Screen Freely</span>
              </div>
              <div className="glass p-3 rounded-lg border border-white/10">
                <b className="text-[#22E07B] block mb-0.5">[Click S]</b>
                <span className="text-white/60">Quick 180° Swivel Turn</span>
              </div>
              <div className="glass p-3 rounded-lg border border-white/10">
                <b className="text-[#9B30FF] block mb-0.5">[E] Key</b>
                <span className="text-white/60">Harvest Aether Energy Font</span>
              </div>
              <div className="glass p-3 rounded-lg border border-white/10">
                <b className="text-white block mb-0.5">[1 - 8]</b>
                <span className="text-white/60">Primary MMORPG Spells</span>
              </div>
              <div className="glass p-3 rounded-lg border border-white/10">
                <b className="text-white block mb-0.5">[Shift + 1-4]</b>
                <span className="text-white/60">Secondary Utility &amp; Defensives</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/15 text-center">
            <span className="text-xs font-head uppercase tracking-wider text-[#00BFFF] font-bold block mb-2">
              Ready to Battle?
            </span>
            <h4 className="text-2xl font-display font-bold text-white mb-4">
              Play Free in Your Browser
            </h4>
            <p className="text-xs text-white/60 font-body mb-6 max-w-sm mx-auto">
              No launcher or installation required. Powered by WebGL and Three.js with full PBR textures embedded into binary GLBs.
            </p>
            <button
              onClick={handleLaunchGame}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#F2A900] text-black font-head font-extrabold text-sm hover:bg-[#ffc21f] transition-all shadow-[0_0_25px_rgba(242,169,0,0.5)]"
            >
              <Play className="w-4 h-4 fill-black" /> Launch Game Client
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 px-6 glass">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-display font-black text-xl tracking-wider text-white">
              GLIMMER<span className="text-[#F2A900]">FALL</span> ONLINE
            </span>
            <p className="text-xs text-white/50 font-body mt-1">
              Based on the Glimmerfall TCG Universe &bull; <a href="https://glimmerfalltcg.com" className="text-[#00BFFF] hover:underline">glimmerfalltcg.com</a>
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
