'use client';

import React, { useEffect, useState } from 'react';
import { Award, Search, Trophy, Shield, Swords, BookOpen, Skull } from 'lucide-react';

const HISCORE_CATEGORIES = [
  { id: 'overall', label: 'Overall' },
  { id: 'combat_mastery', label: 'Combat' },
  { id: 'rites', label: 'Rites' },
  { id: 'flashes', label: 'Flashes' },
  { id: 'resonance_extraction', label: 'Extraction' },
  { id: 'relic_forging', label: 'Forging' },
  { id: 'rite_binding', label: 'Binding' },
  { id: 'glimmerweaving', label: 'Weaving' },
  { id: 'quest_points', label: 'Quest Points' },
  { id: 'collection_log', label: 'Collection Log' },
  { id: 'boss_kills', label: 'Boss Kills' },
  { id: 'arena_mmr', label: '3v3 Arena' },
];

export default function HiscoresTab({ onLaunchGame }) {
  const [category, setCategory] = useState('overall');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [board, setBoard] = useState({ rows: [], totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({
      category,
      page: String(page),
      limit: '20',
      search: search.trim(),
    });
    fetch(`/api/hiscores?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.ok) return;
        setBoard(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, page, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4 pb-5 border-b border-[#1E293B]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2A900] px-2.5 py-1 rounded bg-[#F2A900]/10 border border-[#F2A900]/30 inline-flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> International Realm Rankings
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-2">
              GlimmerFall Global Hiscores
            </h2>
            <p className="text-sm text-white/65 mt-1">
              Live seasonal &amp; eternal leaderboards across 1–99 mastery skills, Quest Points, Collection Log completions, Boss Kills, and 3v3 Arena rankings.
            </p>
          </div>
          {onLaunchGame && (
            <button
              onClick={onLaunchGame}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2A900] to-[#F59E0B] text-black font-display font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition"
            >
              Play &amp; Climb Ranks
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {HISCORE_CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCategory(c.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  active
                    ? 'bg-[#F2A900]/20 border-[#F2A900] text-[#FDE047]'
                    : 'bg-[#070B19] border-[#1E293B] text-white/70 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-[#070B19] border border-[#1E293B] rounded-xl px-3 py-2 max-w-md">
          <Search className="w-4 h-4 text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search champion name or guild tag..."
            className="bg-transparent text-xs text-white placeholder-white/40 focus:outline-none flex-1"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#060914]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C1329] text-white/60 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Champion</th>
                <th className="py-3 px-4">Faction</th>
                <th className="py-3 px-4">Champion Lv.</th>
                <th className="py-3 px-4">Total Skill</th>
                <th className="py-3 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {loading && board.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/50">
                    Loading live realm Hiscores...
                  </td>
                </tr>
              ) : board.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/50">
                    No champions listed yet — connect to the live Realm to register your rank!
                  </td>
                </tr>
              ) : (
                board.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 px-4 font-bold text-[#FDE047]">#{r.rank}</td>
                    <td className="py-2.5 px-4 font-bold text-white">
                      {r.name}{' '}
                      {r.orderTag && <span className="text-[10px] text-[#38BDF8]">&lt;{r.orderTag}&gt;</span>}
                    </td>
                    <td className="py-2.5 px-4 text-white/75">{r.faction}</td>
                    <td className="py-2.5 px-4 text-white/80">Lv.{r.championLevel}</td>
                    <td className="py-2.5 px-4 text-white/80">{r.totalSkillLevel}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-[#4ADE80]">{r.primaryLabel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
