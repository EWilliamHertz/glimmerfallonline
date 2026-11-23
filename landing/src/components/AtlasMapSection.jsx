'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  MapPin,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  UNIVERSAL_SEARCH_ZONES,
  searchMapZones,
} from '../data/universalSearchData';

const QUICK_MAP_FILTERS = [
  { label: `All ${UNIVERSAL_SEARCH_ZONES.length} Realms`, query: '' },
  { label: 'Safe Havens', query: 'Sanctuary' },
  { label: 'Chrono-Lotus', query: 'Chrono-Lotus' },
  { label: 'Starmetal Ore', query: 'Starmetal' },
  { label: 'Alchemist Faye', query: 'Alchemist Faye' },
  { label: 'Ignis-Core', query: 'Ignis-Core' },
  { label: "Xal'Korath", query: "Xal'Korath" },
];

export default function AtlasMapSection({
  focusedZoneId,
  onInspectEntry,
}) {
  const [mapQuery, setMapQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(
    focusedZoneId || 'SANCTUARY_HUB'
  );

  useEffect(() => {
    if (focusedZoneId) {
      setSelectedZoneId(focusedZoneId);
      setMapQuery('');
    }
  }, [focusedZoneId]);

  const matches = useMemo(() => searchMapZones(mapQuery), [mapQuery]);

  const activeZone = useMemo(() => {
    const exactInMatches = matches.find((m) => m.zone.id === selectedZoneId)?.zone;
    if (exactInMatches) return exactInMatches;
    return (
      matches[0]?.zone ||
      UNIVERSAL_SEARCH_ZONES.find((z) => z.id === selectedZoneId) ||
      UNIVERSAL_SEARCH_ZONES[0]
    );
  }, [matches, selectedZoneId]);

  return (
    <section
      id="atlas"
      className="rounded-3xl p-6 lg:p-10 border border-[#1E293B] bg-[#0A0F22]/90 space-y-6 shadow-2xl"
    >
      {/* SECTION HEADER + DEDICATED MAP SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-[#1E293B]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] px-2.5 py-1 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30">
            Seamless Continental Traversal &bull; {UNIVERSAL_SEARCH_ZONES.length} Realms
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1.5">
            🗺️ CONTINENTAL REALMS ATLAS &amp; MAP SEARCH
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Search the continent by realm, harvestable resource (e.g. Chrono-Lotus, Starmetal), NPC, landmark, or world boss.
          </p>
        </div>

        <div className="w-full lg:w-[400px] space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={mapQuery}
              onChange={(e) => setMapQuery(e.target.value)}
              placeholder="Search map by zone, resource, NPC, or boss..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/60 border border-[#38BDF8]/35 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#38BDF8]"
            />
            {mapQuery && (
              <button
                type="button"
                onClick={() => setMapQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-white/55 hover:text-white"
                aria-label="Clear Map Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUICK MAP SEARCH TAGS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_MAP_FILTERS.map((f) => {
            const isActive = mapQuery.trim().toLowerCase() === f.query.toLowerCase();
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setMapQuery(f.query)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  isActive
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8]/60 text-[#7DD3FC]'
                    : 'bg-black/45 border-white/10 text-white/65 hover:text-white hover:border-white/25'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-white/50 font-semibold tabular-nums">
          Showing {matches.length} of {UNIVERSAL_SEARCH_ZONES.length} Realms
        </span>
      </div>

      {/* GRID + SELECTED ZONE INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: SEARCHABLE REALM CARDS */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
          {matches.length === 0 ? (
            <div className="sm:col-span-2 p-8 rounded-2xl bg-black/50 border border-white/10 text-center space-y-2">
              <div className="text-2xl">🧭</div>
              <div className="text-sm font-bold text-white">No realms matched &ldquo;{mapQuery}&rdquo;</div>
              <button
                type="button"
                onClick={() => setMapQuery('')}
                className="px-3 py-1 rounded-lg bg-[#38BDF8]/20 text-sky-200 border border-sky-400/40 text-xs font-bold"
              >
                Reset Map Search
              </button>
            </div>
          ) : (
            matches.map(({ zone, matchReasons }) => {
              const isSelected = activeZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  style={{
                    borderColor: isSelected
                      ? zone.borderColor || zone.color || '#38BDF8'
                      : 'rgba(255,255,255,0.1)',
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all space-y-2 ${
                    isSelected
                      ? 'bg-gradient-to-br from-white/10 via-[#0E1733] to-black/70 shadow-lg'
                      : 'bg-black/45 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: zone.color || '#38BDF8' }}
                      >
                        {zone.level}
                      </span>
                      <h3 className="font-display font-bold text-sm text-white leading-snug">
                        {zone.name}
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/75 whitespace-nowrap">
                      {zone.faction}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/60 line-clamp-2">{zone.desc}</p>

                  {matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {matchReasons.map((reason) => (
                        <span
                          key={reason}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/45">
                    <span>👥 {zone.npcsHere?.length || 0} NPCs</span>
                    <span>&bull;</span>
                    <span>⛏️ {zone.gatheringNodes?.length || 0} Nodes</span>
                    <span>&bull;</span>
                    <span>⚔️ {zone.entities?.length || 0} Entities</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* RIGHT: SELECTED REALM INSPECTOR */}
        {activeZone && (
          <div className="lg:col-span-5 rounded-2xl p-5 border border-[#1E293B] bg-black/55 space-y-4">
            <div className="pb-3 border-b border-white/10 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border"
                  style={{
                    color: activeZone.color || '#38BDF8',
                    borderColor: `${activeZone.color || '#38BDF8'}55`,
                    backgroundColor: `${activeZone.color || '#38BDF8'}18`,
                  }}
                >
                  {activeZone.level} &bull; {activeZone.dangerTag || activeZone.faction}
                </span>
                <span className="text-[10px] font-mono text-white/40">{activeZone.id}</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white">{activeZone.name}</h3>
              <p className="text-xs text-white/75 leading-relaxed">{activeZone.desc}</p>
              <div className="text-[11px] text-sky-300 font-semibold flex items-start gap-1.5 pt-1">
                <Compass className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{activeZone.travel}</span>
              </div>
            </div>

            {/* NPCS IN THIS REALM */}
            {activeZone.npcsHere?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>NPCs &amp; Mentors (Click to Read Quotes &amp; Quests)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeZone.npcsHere.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onInspectEntry?.(n.id)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/15 hover:border-amber-400/50 text-xs text-white font-semibold transition-colors"
                    >
                      {n.icon} {n.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* HARVESTABLE RESOURCES */}
            {activeZone.gatheringNodes?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Harvestable Resources (Click Item for Recipes)</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {activeZone.gatheringNodes.map((g) => (
                    <div key={g.nodeId} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                      <div className="text-[11px] font-bold text-white flex items-center justify-between gap-2">
                        <span>{g.nodeName}</span>
                        <span className="text-emerald-300">Lv. {g.reqLevel}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(g.yields || []).map((y) => (
                          <button
                            key={y.id}
                            type="button"
                            onClick={() => onInspectEntry?.(y.id)}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] text-emerald-200 font-semibold"
                          >
                            {y.icon} {y.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ENTITIES & BOSSES */}
            {activeZone.entities?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Entities &amp; Bosses</span>
                </div>
                <div className="space-y-1">
                  {activeZone.entities.map((e) => (
                    <div key={e.name} className="text-[11px] p-2 rounded-lg bg-white/[0.03] border border-white/10">
                      <span className="font-bold text-white">{e.name}</span>{' '}
                      <span className="text-rose-300 text-[10px]">({e.tier})</span>
                      <div className="text-white/55 text-[10px]">{e.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARDINAL NEIGHBORS */}
            {activeZone.neighbors && Object.keys(activeZone.neighbors).length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Connected Borders</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(activeZone.neighbors).map(([dir, targetId]) => {
                    const targetZone = UNIVERSAL_SEARCH_ZONES.find((z) => z.id === targetId);
                    return (
                      <button
                        key={`${dir}-${targetId}`}
                        type="button"
                        onClick={() => setSelectedZoneId(targetId)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/10 text-[10px] font-bold text-sky-200"
                      >
                        {dir.toUpperCase()} &rarr; {targetZone?.name || targetId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
