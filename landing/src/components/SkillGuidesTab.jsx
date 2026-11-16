'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calculator,
  Compass,
  Flame,
  MapPin,
  Search,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import {
  SKILL_GUIDE_CATEGORIES,
  SKILL_GUIDES,
  SKILL_MAX_LEVEL,
  SKILL_TOTAL_MAX,
  SKILL_TRIAL_CAP,
  SKILL_XP_BENCHMARKS,
  computeSkillActionsNeeded,
  filterSkillGuides,
  getSkillGuideById,
  getSkillXpForLevel,
} from '../data/skillGuidesData';
import { findUniversalMentions } from '../data/universalSearchData';

export default function SkillGuidesTab({
  onLaunchGame,
  onSelectTab,
  onInspectEntry,
  requestedSkillId,
}) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedSkillId, setSelectedSkillId] = useState(requestedSkillId || 'combat_mastery');
  const [calcFromLevel, setCalcFromLevel] = useState(1);
  const [calcToLevel, setCalcToLevel] = useState(SKILL_MAX_LEVEL);
  const [selectedBracketIdx, setSelectedBracketIdx] = useState(0);
  const [moonOwlBonus, setMoonOwlBonus] = useState(false);
  const [unlockSearch, setUnlockSearch] = useState('');

  useEffect(() => {
    if (requestedSkillId) {
      setCategoryFilter('All');
      setSelectedSkillId(requestedSkillId);
      setSelectedBracketIdx(0);
    }
  }, [requestedSkillId]);

  const filteredSkills = useMemo(
    () => filterSkillGuides(categoryFilter),
    [categoryFilter]
  );

  const activeSkill = useMemo(() => {
    const found = getSkillGuideById(selectedSkillId);
    if (
      categoryFilter !== 'All' &&
      found.filterGroup !== categoryFilter &&
      filteredSkills.length > 0
    ) {
      return filteredSkills[0];
    }
    return found;
  }, [selectedSkillId, categoryFilter, filteredSkills]);

  const handleSelectCategory = (catId) => {
    setCategoryFilter(catId);
    const matches = filterSkillGuides(catId);
    if (matches.length > 0 && !matches.some((m) => m.id === selectedSkillId)) {
      setSelectedSkillId(matches[0].id);
      setSelectedBracketIdx(0);
    }
  };

  const handleSelectSkill = (skillId) => {
    setSelectedSkillId(skillId);
    setSelectedBracketIdx(0);
    setUnlockSearch('');
  };

  const safeBracketIdx = Math.min(
    Math.max(0, selectedBracketIdx),
    Math.max(0, activeSkill.brackets.length - 1)
  );
  const activeBracket = activeSkill.brackets[safeBracketIdx] || activeSkill.brackets[0];

  const calcResult = useMemo(
    () =>
      computeSkillActionsNeeded({
        fromLevel: calcFromLevel,
        toLevel: calcToLevel,
        xpPerAction: activeBracket?.xpPerAction || 50,
        moonOwlBonus,
      }),
    [calcFromLevel, calcToLevel, activeBracket, moonOwlBonus]
  );

  const filteredMilestones = useMemo(() => {
    const q = unlockSearch.trim().toLowerCase();
    if (!q) return activeSkill.milestones;
    return activeSkill.milestones.filter((m) =>
      `lv ${m.level} ${m.unlock} ${m.detail}`.toLowerCase().includes(q)
    );
  }, [activeSkill, unlockSearch]);

  const currentXpPct = Math.min(
    100,
    Math.round(
      (getSkillXpForLevel(calcResult.fromLevel) /
        Math.max(1, getSkillXpForLevel(calcResult.toLevel))) *
        1000
    ) / 10
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER HERO & XP CURVE BENCHMARKS */}
      <section className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-gradient-to-br from-[#0A0F22]/95 via-[#0B1228]/95 to-[#060914] space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-[#1E293B]">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#F2A900] px-2.5 py-1 rounded-md bg-[#F2A900]/10 border border-[#F2A900]/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Official 1–99 Mastery Compendium &bull; Max Total {SKILL_TOTAL_MAX}</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight">
              SKILLS 1–99 LEVELING GUIDES
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Every GlimmerFall character levels 7 canonical disciplines up to{' '}
              <span className="text-[#F2A900] font-semibold">Lv. 99 (9,477,643 XP)</span> for
              a Total Level of <span className="text-sky-300 font-semibold">{SKILL_TOTAL_MAX}</span>.
              Free Trial accounts train freely up to{' '}
              <span className="text-emerald-300 font-semibold">Lv. {SKILL_TRIAL_CAP} (105,871 XP)</span>{' '}
              per skill before Founder domains unlock the full Lv. 31–99 endgame climb and
              +5 All-Stats Mastery Skillcapes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onLaunchGame?.(activeSkill.id)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] to-[#FDE047] text-[#050811] text-xs font-extrabold uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_24px_rgba(242,169,0,0.3)] flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Train {activeSkill.name} In-Game
            </button>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('armory')}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                Inspect Armory &amp; Capes
              </button>
            )}
          </div>
        </div>

        {/* XP Curve Key Landmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            SKILL_XP_BENCHMARKS[0],
            SKILL_XP_BENCHMARKS[2],
            SKILL_XP_BENCHMARKS[4],
            SKILL_XP_BENCHMARKS[6],
            SKILL_XP_BENCHMARKS[8],
            SKILL_XP_BENCHMARKS[12],
            SKILL_XP_BENCHMARKS[13],
          ].map((bm) => (
            <div
              key={bm.level}
              className={`rounded-xl p-2.5 border text-center ${
                bm.level === SKILL_TRIAL_CAP
                  ? 'bg-emerald-500/10 border-emerald-400/35'
                  : bm.level === SKILL_MAX_LEVEL
                    ? 'bg-[#F2A900]/15 border-[#F2A900]/45'
                    : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/60">
                Lv. {bm.level}
              </div>
              <div className="text-xs sm:text-sm font-black text-white mt-0.5 tabular-nums">
                {bm.xp.toLocaleString()} XP
              </div>
              <div className="text-[10px] text-[#F2A900]/90 truncate mt-0.5">{bm.label}</div>
            </div>
          ))}
        </div>

        {/* Category Filter + 7 Skill Selector Strip */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {SKILL_GUIDE_CATEGORIES.map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#F2A900]/20 text-[#FDE047] border-[#F2A900]/50 shadow-[0_0_15px_rgba(242,169,0,0.2)]'
                      : 'bg-black/40 text-white/65 border-white/10 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {filteredSkills.map((sk) => {
              const isSelected = activeSkill.id === sk.id;
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => handleSelectSkill(sk.id)}
                  style={{
                    borderColor: isSelected ? sk.color : 'rgba(255,255,255,0.1)',
                    boxShadow: isSelected ? `0 0 22px ${sk.color}33` : 'none',
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-b from-white/10 to-black/60'
                      : 'bg-black/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl">{sk.icon}</span>
                    <span
                      className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border"
                      style={{
                        color: sk.color,
                        borderColor: `${sk.color}55`,
                        backgroundColor: `${sk.color}18`,
                      }}
                    >
                      {sk.category}
                    </span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                      {sk.name}
                    </div>
                    <div className="text-[10px] text-white/55 mt-0.5 line-clamp-2">
                      {sk.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACTIVE SKILL GUIDE WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SKILL OVERVIEW, CAPE & INTERACTIVE 1-99 CALCULATOR */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Skill Summary Card */}
          <div
            className="rounded-3xl p-6 border bg-[#0A0F22]/90 space-y-4 shadow-xl"
            style={{ borderColor: `${activeSkill.color}55` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
                  style={{
                    backgroundColor: `${activeSkill.color}18`,
                    borderColor: `${activeSkill.color}55`,
                  }}
                >
                  {activeSkill.icon}
                </div>
                <div>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: activeSkill.color }}
                  >
                    {activeSkill.category} Discipline &bull; 1–99
                  </span>
                  <h3 className="font-display font-bold text-xl text-white">
                    {activeSkill.name}
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/75 leading-relaxed">{activeSkill.quickStart}</p>

            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
              <div className="flex items-start gap-2">
                <Compass className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/50 text-[10px] font-bold uppercase">
                    Master Instructor &amp; Hub
                  </div>
                  <div className="text-white font-semibold">
                    {activeSkill.instructor} — {activeSkill.trainerLocation}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#F2A900] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/50 text-[10px] font-bold uppercase">
                    Passive Scaling &amp; Unlocks
                  </div>
                  <div className="text-[#FDE047] font-semibold">{activeSkill.passiveSummary}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Swords className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/50 text-[10px] font-bold uppercase">
                    XP Formula &amp; Grants
                  </div>
                  <div className="text-white/80">{activeSkill.xpMechanic}</div>
                </div>
              </div>
            </div>

            {/* Level 99 Mastery Skillcape Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F2A900]/15 via-black/60 to-black/80 border border-[#F2A900]/45 space-y-1.5">
              <div className="flex items-center gap-2 text-[#FDE047] text-xs font-extrabold">
                <Award className="w-4 h-4" />
                <span>Lv. 99 Mastery Reward</span>
              </div>
              <div className="font-display font-bold text-sm text-white">
                {activeSkill.cape.name}
              </div>
              <div className="text-[11px] font-bold text-emerald-300">
                {activeSkill.cape.stats}
              </div>
              <p className="text-[11px] text-white/65 leading-snug">
                {activeSkill.cape.desc}
              </p>
            </div>
          </div>

          {/* Interactive 1–99 XP & Actions Calculator */}
          <div className="rounded-3xl p-6 border border-[#1E293B] bg-[#0A0F22]/90 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-400" />
                <h4 className="font-display font-bold text-sm text-white">
                  1–99 XP &amp; Action Calculator
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-400/30 font-bold">
                Live Curve
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase text-white/55 block">
                  Current Level
                </span>
                <input
                  type="number"
                  min={1}
                  max={98}
                  value={calcFromLevel}
                  onChange={(e) => {
                    const next = Math.max(1, Math.min(98, Number(e.target.value) || 1));
                    setCalcFromLevel(next);
                    if (calcToLevel <= next) setCalcToLevel(Math.min(99, next + 1));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-bold focus:outline-none focus:border-sky-400"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase text-white/55 block">
                  Target Level
                </span>
                <input
                  type="number"
                  min={2}
                  max={99}
                  value={calcToLevel}
                  onChange={(e) => {
                    const next = Math.max(
                      calcFromLevel + 1,
                      Math.min(99, Number(e.target.value) || 99)
                    );
                    setCalcToLevel(next);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-bold focus:outline-none focus:border-[#F2A900]"
                />
              </label>
            </div>

            {/* Quick Goal Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Lv. 30 Trial', to: 30 },
                { label: 'Lv. 50', to: 50 },
                { label: 'Lv. 70', to: 70 },
                { label: 'Lv. 92', to: 92 },
                { label: 'Lv. 99 Cape', to: 99 },
              ].map((preset) => (
                <button
                  key={preset.to}
                  type="button"
                  onClick={() => {
                    if (calcFromLevel >= preset.to) {
                      setCalcFromLevel(Math.max(1, preset.to - 5));
                    }
                    setCalcToLevel(preset.to);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    calcResult.toLevel === preset.to
                      ? 'bg-[#F2A900]/20 text-[#FDE047] border-[#F2A900]/50'
                      : 'bg-black/40 text-white/65 border-white/10 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Method Selector */}
            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase text-white/55 block">
                Training Bracket / Method
              </span>
              <select
                value={safeBracketIdx}
                onChange={(e) => setSelectedBracketIdx(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/15 text-xs font-semibold text-white focus:outline-none focus:border-sky-400"
              >
                {activeSkill.brackets.map((br, idx) => (
                  <option key={br.range} value={idx}>
                    {br.range} — {br.title} ({br.xpPerAction} XP/{br.actionUnit})
                  </option>
                ))}
              </select>
            </label>

            {/* Familiar Toggle */}
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:border-sky-400/40 transition-colors">
              <div>
                <div className="text-xs font-bold text-sky-300">
                  🦉 Starfall Moon-Owl Familiar (+6% XP)
                </div>
                <div className="text-[10px] text-white/55">
                  Rite-Binding Lv. 18 Construct bonus
                </div>
              </div>
              <input
                type="checkbox"
                checked={moonOwlBonus}
                onChange={(e) => setMoonOwlBonus(e.target.checked)}
                className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
              />
            </label>

            {/* Calculated Output Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                <div className="text-[10px] text-white/50 font-bold uppercase">XP Remaining</div>
                <div className="text-xs sm:text-sm font-black text-[#FDE047] mt-0.5 tabular-nums">
                  {calcResult.xpNeeded.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                <div className="text-[10px] text-white/50 font-bold uppercase">XP / {activeBracket.actionUnit}</div>
                <div className="text-xs sm:text-sm font-black text-emerald-300 mt-0.5 tabular-nums">
                  {calcResult.effectiveXpPerAction}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                <div className="text-[10px] text-white/50 font-bold uppercase">Est. Actions</div>
                <div className="text-xs sm:text-sm font-black text-sky-300 mt-0.5 tabular-nums">
                  {calcResult.actionsNeeded.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60 font-semibold">
                <span>Lv. {calcResult.fromLevel} ({getSkillXpForLevel(calcResult.fromLevel).toLocaleString()} XP)</span>
                <span>{currentXpPct}% of Lv. {calcResult.toLevel}</span>
              </div>
              <div className="h-2 rounded-full bg-black/70 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(2, currentXpPct)}%`,
                    backgroundColor: activeSkill.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pro Synergies Box */}
          <div className="rounded-3xl p-5 border border-[#1E293B] bg-[#0A0F22]/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <Flame className="w-4 h-4" />
              <span>Efficiency &amp; Synergy Tips</span>
            </div>
            <ul className="space-y-2 text-xs text-white/75">
              {activeSkill.synergies.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span style={{ color: activeSkill.color }} className="font-bold">▸</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* RIGHT COLUMN: 1–99 BRACKET ROADMAP + SEARCHABLE MILESTONES */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1–99 Leveling Brackets */}
          <section className="rounded-3xl p-6 border border-[#1E293B] bg-[#0A0F22]/90 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                  Step-by-Step Leveling Roadmap
                </span>
                <h3 className="font-display font-bold text-xl text-white">
                  {activeSkill.icon} {activeSkill.name}: Lv. 1 &rarr; 99 Path
                </h3>
              </div>
              <span className="text-[11px] text-white/60">
                Click any bracket to load it into the XP Calculator
              </span>
            </div>

            <div className="space-y-4">
              {activeSkill.brackets.map((br, idx) => {
                const isActiveCalc = idx === safeBracketIdx;
                const brCalc = computeSkillActionsNeeded({
                  fromLevel: br.minLevel,
                  toLevel: br.maxLevel,
                  xpPerAction: br.xpPerAction,
                  moonOwlBonus,
                });
                const crossesTrial = br.minLevel <= SKILL_TRIAL_CAP && br.maxLevel >= SKILL_TRIAL_CAP;
                const mentionedEntries = findUniversalMentions(
                  `${br.ingredients} ${br.bestMethod} ${br.altMethod}`,
                  6
                );

                return (
                  <div
                    key={br.range}
                    onClick={() => setSelectedBracketIdx(idx)}
                    style={{
                      borderColor: isActiveCalc ? activeSkill.color : 'rgba(255,255,255,0.1)',
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isActiveCalc
                        ? 'bg-gradient-to-r from-white/10 via-[#0E1630] to-black/60 shadow-lg'
                        : 'bg-black/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className="px-3 py-1 rounded-lg text-xs font-extrabold border"
                          style={{
                            color: activeSkill.color,
                            borderColor: `${activeSkill.color}55`,
                            backgroundColor: `${activeSkill.color}18`,
                          }}
                        >
                          {br.range}
                        </span>
                        <h4 className="font-display font-bold text-base text-white">
                          {br.title}
                        </h4>
                        {crossesTrial && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/35">
                            Lv. 30 Trial Cap Checkpoint
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#FDE047] tabular-nums">
                          ~{br.xpPerAction} XP / {br.actionUnit}
                        </span>
                        <div className="text-[10px] text-white/55 tabular-nums">
                          {brCalc.xpNeeded.toLocaleString()} XP in bracket (~{brCalc.actionsNeeded.toLocaleString()} {br.actionUnit}s)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <div className="text-[10px] font-extrabold uppercase text-emerald-400">
                          Best Fastest Method
                        </div>
                        <div className="text-white font-semibold">{br.bestMethod}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <div className="text-[10px] font-extrabold uppercase text-sky-400">
                          Alternative / Parallel Route
                        </div>
                        <div className="text-white/85">{br.altMethod}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/70">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F2A900]" />
                        <span>
                          <strong className="text-white/90">Location:</strong> {br.zone}
                        </span>
                      </div>
                      <div>
                        <strong className="text-white/90">Prep &amp; Gear:</strong> {br.ingredients}
                      </div>
                    </div>

                    {mentionedEntries.length > 0 && onInspectEntry && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
                          Inspect Sources:
                        </span>
                        {mentionedEntries.map((ref) => (
                          <button
                            key={`${br.range}-${ref.id}`}
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onInspectEntry(ref.id);
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/10 hover:bg-sky-500/25 border border-sky-400/30 hover:border-sky-300/60 text-sky-200 transition-colors"
                          >
                            {ref.icon} {ref.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 text-xs text-amber-100/90">
                      <strong className="text-[#FDE047]">Tip:</strong> {br.tip}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Searchable 1–99 Unlocks & Milestones Table */}
          <section className="rounded-3xl p-6 border border-[#1E293B] bg-[#0A0F22]/90 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F2A900]">
                  Complete Unlock Ledger
                </span>
                <h4 className="font-display font-bold text-lg text-white">
                  {activeSkill.name} 1–99 Milestones &amp; Benchmarks
                </h4>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={unlockSearch}
                  onChange={(e) => setUnlockSearch(e.target.value)}
                  placeholder={`Search ${activeSkill.name} unlocks...`}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F2A900]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/55">
                    <th className="py-2.5 px-3">Req. Lv.</th>
                    <th className="py-2.5 px-3">Cumulative XP</th>
                    <th className="py-2.5 px-3">Unlock / Tier</th>
                    <th className="py-2.5 px-3">Notes &amp; Scaling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMilestones.map((m) => (
                    <tr key={`${m.level}-${m.unlock}`} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded font-extrabold text-[11px]"
                          style={{
                            color: m.level === 99 ? '#fde047' : activeSkill.color,
                            backgroundColor:
                              m.level === 99 ? 'rgba(242,169,0,0.18)' : `${activeSkill.color}18`,
                          }}
                        >
                          Lv. {m.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white/80 tabular-nums">
                        {getSkillXpForLevel(m.level).toLocaleString()} XP
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">{m.unlock}</td>
                      <td className="py-2.5 px-3 text-white/65">{m.detail}</td>
                    </tr>
                  ))}
                  {filteredMilestones.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-white/50">
                        No {activeSkill.name} unlocks match "{unlockSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
