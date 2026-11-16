'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Coins,
  Compass,
  Hammer,
  MapPin,
  MessageSquareQuote,
  Package,
  ScrollText,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  UNIVERSAL_SEARCH_ALL,
  resolveUniversalEntry,
  searchUniversalCatalog,
} from '../data/universalSearchData';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'item', label: 'Items' },
  { id: 'npc', label: 'NPCs' },
  { id: 'character', label: 'Characters' },
  { id: 'quest', label: 'Quests' },
  { id: 'zone', label: 'Map Zones' },
  { id: 'skill', label: 'Skills' },
];

const QUICK_LOOKUP_CHIPS = [
  { label: 'Sunbloom Petal', idOrName: 'sunbloom_herb' },
  { label: 'Chrono-Lotus', idOrName: 'chrono_lotus' },
  { label: 'Empyrean Starleaf', idOrName: 'empyrean_starleaf' },
  { label: 'Alchemist Faye', idOrName: 'merchant_apothecary' },
  { label: 'Herald Lyra', idOrName: 'npc_aurora' },
  { label: 'Starfall Moon-Owl', idOrName: 'starfall_moon_owl' },
  { label: 'Rite-Binding', idOrName: 'rite_binding' },
];

function getTypeBadgeLabel(entry) {
  if (!entry) return '';
  if (entry.type === 'item') return entry.rarity || 'Item';
  if (entry.type === 'npc') return `${entry.faction || 'Realm'} NPC`;
  if (entry.type === 'character') return entry.kind || 'Character';
  if (entry.type === 'quest') return entry.kind || 'Quest';
  if (entry.type === 'zone') return entry.level || 'Map Zone';
  if (entry.type === 'skill') return `${entry.category || ''} Skill`;
  return entry.type;
}

export default function UniversalSearchModal({
  isOpen,
  onClose,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  selectedEntryId,
  onSelectEntryId,
  onJumpToSkill,
  onJumpToMapZone,
}) {
  const inputRef = useRef(null);
  const [historyStack, setHistoryStack] = useState([]);

  const { results, countsByType } = useMemo(
    () => searchUniversalCatalog(query, category, 60),
    [query, category]
  );

  const selectedEntry = useMemo(() => {
    if (selectedEntryId) {
      const exact =
        UNIVERSAL_SEARCH_ALL.find((e) => e.id === selectedEntryId) ||
        resolveUniversalEntry(selectedEntryId);
      if (exact) return exact;
    }
    return results[0] || null;
  }, [selectedEntryId, results]);

  useEffect(() => {
    if (!isOpen) {
      setHistoryStack([]);
      return;
    }
    const timer = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 30);
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inspectReference = (idOrName) => {
    const resolved = resolveUniversalEntry(idOrName);
    if (!resolved) return;
    if (selectedEntry && selectedEntry.id !== resolved.id) {
      setHistoryStack((prev) => [...prev.slice(-8), selectedEntry.id]);
    }
    onSelectEntryId?.(resolved.id);
  };

  const handleBack = () => {
    if (historyStack.length === 0) return;
    const prevId = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    onSelectEntryId?.(prevId);
  };

  const handleSearchChip = (idOrName) => {
    const resolved = resolveUniversalEntry(idOrName);
    if (resolved) {
      onCategoryChange?.('all');
      onQueryChange?.(resolved.name);
      onSelectEntryId?.(resolved.id);
    } else {
      onQueryChange?.(String(idOrName));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-10 sm:pt-14 px-3 sm:px-6 pb-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Game Encyclopedia Search"
    >
      <div
        className="w-full max-w-6xl max-h-[88vh] flex flex-col rounded-3xl border border-[#F2A900]/40 bg-gradient-to-b from-[#0D142B] via-[#090E1E] to-[#050812] shadow-[0_24px_90px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* SEARCH BAR HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 space-y-3 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#F2A900] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  onQueryChange?.(e.target.value);
                  onSelectEntryId?.('');
                }}
                placeholder="Search items, ingredients (chrono_lotus, sunbloom_herb), NPCs, dialogues, quests, rewards, classes, or realms..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#F2A900]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange?.('');
                    onSelectEntryId?.('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/60 hover:text-white px-2 py-0.5 rounded bg-white/10"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/75 hover:text-white transition-colors"
              aria-label="Close Search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* CATEGORY TABS + QUICK CLICKS */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORY_TABS.map((tab) => {
                const isActive = category === tab.id;
                const count = countsByType[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onCategoryChange?.(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#F2A900]/20 text-[#FDE047] border-[#F2A900]/60'
                        : 'bg-white/5 text-white/65 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-white/45 mr-1 font-bold">
                Quick Lookup:
              </span>
              {QUICK_LOOKUP_CHIPS.map((chip) => (
                <button
                  key={chip.idOrName}
                  type="button"
                  onClick={() => handleSearchChip(chip.idOrName)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/25 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TWO-PANE RESULTS + INSPECTOR */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT PANE: MATCHING RESULTS */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto p-3 space-y-1.5 max-h-[34vh] lg:max-h-full">
            {results.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="text-2xl">🔍</div>
                <div className="text-sm font-bold text-white/80">
                  No matches found for &ldquo;{query}&rdquo;
                </div>
                <p className="text-xs text-white/55">
                  Try item names, ingredient IDs (e.g. sunbloom_herb), NPC names, quest titles, or boss/zone names.
                </p>
              </div>
            ) : (
              results.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                const sub =
                  entry.whatItDoes ||
                  entry.role ||
                  entry.level ||
                  entry.desc ||
                  entry.id;
                return (
                  <button
                    key={`${entry.type}-${entry.id}`}
                    type="button"
                    onClick={() => onSelectEntryId?.(entry.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#F2A900]/20 via-[#0F1B3D] to-black/60 border-[#F2A900]/60 shadow-md'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/15'
                    }`}
                  >
                    <span className="text-xl leading-none flex-shrink-0 mt-0.5">
                      {entry.icon || '📦'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-xs sm:text-sm text-white truncate">
                          {entry.name}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-sky-300 flex-shrink-0">
                          {getTypeBadgeLabel(entry)}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/55 truncate mt-0.5">{sub}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* RIGHT PANE: DEEP INSPECTOR */}
          <div className="lg:col-span-7 overflow-y-auto p-5 sm:p-6 space-y-5">
            {!selectedEntry ? (
              <div className="text-center py-12 text-white/50 text-sm">
                Select any item, NPC, character, quest, map zone, or skill to inspect full details.
              </div>
            ) : (
              <>
                {historyStack.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs font-bold text-sky-300 hover:text-sky-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-400/25"
                  >
                    &larr; Back to previous entry
                  </button>
                )}

                {/* INSPECTOR HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center text-2xl flex-shrink-0">
                      {selectedEntry.icon || '📦'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F2A900]/15 text-[#FDE047] border border-[#F2A900]/40">
                          {getTypeBadgeLabel(selectedEntry)}
                        </span>
                        {selectedEntry.faction && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/80">
                            {selectedEntry.faction}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-white/40">
                          {selectedEntry.id}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-white mt-1">
                        {selectedEntry.name}
                      </h3>
                      {(selectedEntry.role || selectedEntry.location || selectedEntry.sub) && (
                        <p className="text-xs text-sky-300/90 mt-0.5">
                          {selectedEntry.role || selectedEntry.sub}
                          {selectedEntry.location ? ` • ${selectedEntry.location}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ITEM INSPECTOR */}
                {selectedEntry.type === 'item' && (
                  <ItemInspectorBody
                    entry={selectedEntry}
                    onInspect={inspectReference}
                    onJumpToMapZone={(zoneId) => {
                      onClose?.();
                      onJumpToMapZone?.(zoneId);
                    }}
                  />
                )}

                {/* NPC INSPECTOR */}
                {selectedEntry.type === 'npc' && (
                  <NpcInspectorBody
                    entry={selectedEntry}
                    onInspect={inspectReference}
                    onJumpToSkill={(skillId) => {
                      onClose?.();
                      onJumpToSkill?.(skillId);
                    }}
                    onJumpToMapZone={(zoneId) => {
                      onClose?.();
                      onJumpToMapZone?.(zoneId);
                    }}
                  />
                )}

                {/* CHARACTER / CLASS / FAMILIAR INSPECTOR */}
                {selectedEntry.type === 'character' && (
                  <CharacterInspectorBody
                    entry={selectedEntry}
                    onInspect={inspectReference}
                  />
                )}

                {/* QUEST / BOUNTY INSPECTOR */}
                {selectedEntry.type === 'quest' && (
                  <QuestInspectorBody entry={selectedEntry} onInspect={inspectReference} />
                )}

                {/* MAP ZONE INSPECTOR */}
                {selectedEntry.type === 'zone' && (
                  <ZoneInspectorBody
                    entry={selectedEntry}
                    onInspect={inspectReference}
                    onJumpToMapZone={(zoneId) => {
                      onClose?.();
                      onJumpToMapZone?.(zoneId);
                    }}
                  />
                )}

                {/* SKILL GUIDE INSPECTOR */}
                {selectedEntry.type === 'skill' && (
                  <SkillInspectorBody
                    entry={selectedEntry}
                    onInspect={inspectReference}
                    onJumpToSkill={(skillId) => {
                      onClose?.();
                      onJumpToSkill?.(skillId);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemInspectorBody({ entry, onInspect, onJumpToMapZone }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-1.5">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
          What It Does &amp; Effects
        </div>
        <div className="text-sm font-semibold text-white">{entry.whatItDoes}</div>
        {entry.desc && entry.desc !== entry.whatItDoes && (
          <p className="text-white/65 leading-relaxed">{entry.desc}</p>
        )}
        {entry.guidePrice > 0 && (
          <div className="inline-flex items-center gap-1 pt-1 text-[#FDE047] font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>Guide Market Value: {entry.guidePrice.toLocaleString()} Gold</span>
          </div>
        )}
      </div>

      {/* HARVESTING / GATHERING NODES */}
      {entry.harvestSources?.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
            <Compass className="w-3.5 h-3.5" />
            <span>How to Harvest in the World (Resonance Extraction [E])</span>
          </div>
          {entry.harvestSources.map((src) => (
            <div key={src.nodeId} className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  {src.nodeName} <span className="text-emerald-300">(Req Lv. {src.reqLevel})</span>
                </span>
                <span className="text-[11px] text-white/70">
                  {src.chancePct}% yield &bull; +{src.xp} XP
                </span>
              </div>
              {src.zones?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-white/50 font-semibold">Where:</span>
                  {src.zones.map((z) => (
                    <button
                      key={z.zoneId}
                      type="button"
                      onClick={() => onJumpToMapZone?.(z.zoneId)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 inline-flex items-center gap-1"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      {z.zoneName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CRAFTING RECIPE (HOW TO MAKE IT) */}
      {entry.craftedBy?.length > 0 && (
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
            <Hammer className="w-3.5 h-3.5" />
            <span>How to Craft It (Click Any Ingredient to Inspect Source)</span>
          </div>
          {entry.craftedBy.map((rec) => (
            <div key={rec.recipeId} className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  {rec.stationIcon} {rec.professionName} Lv. {rec.reqLevel} @ {rec.stationName}
                </span>
                <span className="text-[#FDE047] font-bold">+{rec.xp} XP</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rec.ingredients.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => onInspect(ing.id)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/15 hover:border-purple-400/50 text-white font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>{ing.icon}</span>
                    <span>
                      {ing.name} &times;{ing.qty}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-white/50" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MERCHANTS & SHOPS */}
      {entry.soldBy?.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Purchased From Merchants</span>
          </div>
          <div className="space-y-1.5">
            {entry.soldBy.map((s) => (
              <button
                key={`${s.merchantId}-${s.price}`}
                type="button"
                onClick={() => onInspect(s.merchantId)}
                className="w-full text-left p-2.5 rounded-xl bg-black/45 hover:bg-amber-500/10 border border-white/10 flex flex-wrap items-center justify-between gap-2 transition-colors"
              >
                <div>
                  <span className="font-bold text-white">{s.merchantName}</span>
                  <span className="text-white/55 ml-2">&bull; {s.location}</span>
                </div>
                <span className="text-[#FDE047] font-bold">{s.price} Gold</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MONSTER DROPS & BOUNTIES */}
      {(entry.droppedBy?.length > 0 || entry.bountyRewards?.length > 0) && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
            Drops, Quests &amp; Bounties
          </div>
          <ul className="space-y-1 text-white/80">
            {(entry.droppedBy || []).map((d) => (
              <li key={d}>&#9656; {d}</li>
            ))}
            {(entry.bountyRewards || []).map((b) => (
              <li key={b.bountyId}>
                &#9656;{' '}
                <button
                  type="button"
                  onClick={() => onInspect(b.bountyId)}
                  className="text-sky-300 hover:underline font-semibold"
                >
                  Bounty Contract: {b.title} (&times;{b.qty})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* HARMONIC EXTRACTOR */}
      {(entry.extractsTo || entry.decodedFrom?.length > 0) && (
        <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
            Harmonic Extractor Synergy
          </div>
          {entry.extractsTo && (
            <div className="flex flex-wrap items-center gap-2 text-white/85">
              <span>Decodes at Extractor for</span>
              <button
                type="button"
                onClick={() => onInspect(entry.extractsTo.cipherId)}
                className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/40 font-bold hover:bg-sky-500/30"
              >
                {entry.extractsTo.cipherName} &times;{entry.extractsTo.qty}
              </button>
              <span className="text-[#FDE047] font-bold">+{entry.extractsTo.xp} Extraction XP</span>
            </div>
          )}
          {entry.decodedFrom?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.decodedFrom.map((df) => (
                <button
                  key={df.rawId}
                  type="button"
                  onClick={() => onInspect(df.rawId)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/10 text-white/85"
                >
                  {df.rawName} &rarr; &times;{df.qty} ({df.xp} XP)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USED IN RECIPES (INVERSE INGREDIENT INDEX) */}
      {entry.usedInRecipes?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F2A900]">
            <Package className="w-3.5 h-3.5" />
            <span>Used to Craft / Compile ({entry.usedInRecipes.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.usedInRecipes.map((u) => (
              <button
                key={`${u.outputId}-${u.stationName}-${u.reqLevel}`}
                type="button"
                onClick={() => onInspect(u.outputId)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#F2A900]/15 border border-white/10 hover:border-[#F2A900]/45 text-left transition-colors"
              >
                <div className="font-bold text-white">
                  {u.outputIcon} {u.outputName}
                </div>
                <div className="text-[10px] text-white/55">
                  {u.professionName} Lv. {u.reqLevel} &bull; Needs &times;{u.qtyNeeded} &bull; +{u.xp} XP
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NpcInspectorBody({ entry, onInspect, onJumpToSkill, onJumpToMapZone }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {entry.zoneId && (
          <button
            type="button"
            onClick={() => onJumpToMapZone?.(entry.zoneId)}
            className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 font-bold inline-flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            Locate on Map Atlas
          </button>
        )}
        {entry.teachesSkill && (
          <button
            type="button"
            onClick={() => onJumpToSkill?.(entry.teachesSkill.id)}
            className="px-3 py-1.5 rounded-xl bg-[#F2A900]/15 hover:bg-[#F2A900]/25 border border-[#F2A900]/40 text-[#FDE047] font-bold inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {entry.teachesSkill.icon} {entry.teachesSkill.name} 1–99 Guide
          </button>
        )}
      </div>

      {/* WHAT THEY SAY */}
      <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>What {entry.name} Says ({entry.whatTheySay?.length || 0} Quotes)</span>
        </div>
        {entry.whatTheySay?.length > 0 ? (
          <div className="space-y-2">
            {entry.whatTheySay.map((quote, idx) => (
              <blockquote
                key={`${idx}-${quote.slice(0, 24)}`}
                className="p-3 rounded-xl bg-white/[0.04] border-l-2 border-[#F2A900] text-white/85 italic leading-relaxed"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="text-white/50">Serves adventurers directly with station services.</div>
        )}
      </div>

      {/* QUESTS & REWARDS HELD */}
      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
          <ScrollText className="w-3.5 h-3.5" />
          <span>Quests &amp; Rewards Held ({entry.quests?.length || 0})</span>
        </div>
        {entry.quests?.length > 0 ? (
          <div className="space-y-2">
            {entry.quests.map((q) => (
              <div
                key={`${q.id}-${q.relation}`}
                className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onInspect(q.id)}
                    className="font-display font-bold text-sm text-white hover:text-[#FDE047] transition-colors"
                  >
                    {q.title} &rarr;
                  </button>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-bold">
                    {q.relation}
                  </span>
                </div>
                {q.desc && <p className="text-white/65">{q.desc}</p>}
                <RewardChips rewards={q.rewards} onInspect={onInspect} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/50">No direct questline held; check Merchant wares or Bounty Boards.</div>
        )}
      </div>

      {/* SHOP WARES */}
      {entry.shopWares?.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Merchant Inventory ({entry.shopWares.length} Items)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entry.shopWares.map((w) => (
              <button
                key={w.itemId}
                type="button"
                onClick={() => onInspect(w.itemId)}
                className="text-left p-2.5 rounded-xl bg-black/50 hover:bg-amber-500/10 border border-white/10 space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">
                    {w.icon} {w.itemName}
                  </span>
                  <span className="text-[#FDE047] font-bold">{w.price}g</span>
                </div>
                <div className="text-[10px] text-white/55">{w.note}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterInspectorBody({ entry, onInspect }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
          {entry.kind} Summary &amp; Passive Scaling
        </div>
        <div className="text-sm font-bold text-[#FDE047]">{entry.passiveLabel}</div>
        <p className="text-white/75 leading-relaxed">{entry.desc}</p>
      </div>

      {entry.starterGear?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
            Starter Loadout (Click to Inspect)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.starterGear.map((g) => (
              <button
                key={`${g.slot}-${g.id}`}
                type="button"
                onClick={() => onInspect(g.id)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 text-white font-semibold"
              >
                {g.icon} {g.name} <span className="text-white/45 uppercase">({g.slot})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {entry.ingredients?.length > 0 && (
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
            Construct Cradle Ingredients (Rite-Binding Lv. {entry.reqLevel || 1} &bull; +{entry.compileXp || 90} XP)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.ingredients.map((ing) => (
              <button
                key={ing.id}
                type="button"
                onClick={() => onInspect(ing.id)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/15 text-white font-semibold"
              >
                {ing.icon} {ing.name} &times;{ing.qty}
              </button>
            ))}
          </div>
        </div>
      )}

      {entry.abilities?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#F2A900]">
            Signature Rites &amp; Flashes
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entry.abilities.map((ab) => (
              <div key={ab.id} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{ab.name}</span>
                  <span className="text-[10px] text-sky-300 font-bold">
                    {ab.kind} &bull; Lv.{ab.reqLevel}
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">{ab.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestInspectorBody({ entry, onInspect }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
        <p className="text-white/80 leading-relaxed">{entry.desc}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {entry.giverId && (
            <button
              type="button"
              onClick={() => onInspect(entry.giverId)}
              className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 font-bold"
            >
              Giver: {entry.giverName}
            </button>
          )}
          {entry.turnInId && (
            <button
              type="button"
              onClick={() => onInspect(entry.turnInId)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200 font-bold"
            >
              Turn-In: {entry.turnInName}
            </button>
          )}
          {entry.prereqTitle && (
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
              Prereq: {entry.prereqTitle}
            </span>
          )}
        </div>
      </div>

      {entry.tasks?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
            Objectives
          </div>
          <ul className="space-y-1 text-white/80">
            {entry.tasks.map((t) => (
              <li key={t}>&#10003; {t}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FDE047]">
          Quest Completion Rewards
        </div>
        <RewardChips rewards={entry.rewards} onInspect={onInspect} />
      </div>

      {entry.dialogues?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
            Spoken Quest Script
          </div>
          {entry.dialogues.map((line, idx) => (
            <div key={`${idx}-${line.text.slice(0, 20)}`} className="p-2.5 rounded-xl bg-white/[0.04]">
              <span className="font-bold text-[#FDE047]">{line.speaker}: </span>
              <span className="text-white/80 italic">&ldquo;{line.text}&rdquo;</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneInspectorBody({ entry, onInspect, onJumpToMapZone }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
        <p className="text-white/80 leading-relaxed">{entry.desc}</p>
        <div className="text-sky-300 font-semibold">Route: {entry.travel}</div>
        <button
          type="button"
          onClick={() => onJumpToMapZone?.(entry.id)}
          className="mt-1 px-3 py-1.5 rounded-xl bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#7DD3FC] font-bold inline-flex items-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5" />
          Open in Map Atlas
        </button>
      </div>

      {entry.npcsHere?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            NPCs in {entry.name} ({entry.npcsHere.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.npcsHere.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onInspect(n.id)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/15 text-white font-semibold"
              >
                {n.icon} {n.name} <span className="text-white/45">&bull; {n.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {entry.gatheringNodes?.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
            Harvestable Resources &amp; Nodes
          </div>
          {entry.gatheringNodes.map((g) => (
            <div key={g.nodeId} className="p-2.5 rounded-xl bg-black/45 border border-white/10 space-y-1.5">
              <div className="font-bold text-white">
                {g.nodeName} <span className="text-emerald-300">(Lv. {g.reqLevel} &bull; +{g.xp} XP)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(g.yields || []).map((y) => (
                  <button
                    key={y.id}
                    type="button"
                    onClick={() => onInspect(y.id)}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-emerald-500/20 border border-white/15 text-emerald-200 font-semibold"
                  >
                    {y.icon} {y.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {entry.entities?.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
            Entities, Elites &amp; Bosses
          </div>
          <div className="space-y-1.5">
            {entry.entities.map((e) => (
              <div key={e.name} className="p-2 rounded-lg bg-black/45 border border-white/10">
                <span className="font-bold text-white">{e.name}</span>{' '}
                <span className="text-rose-300 text-[10px]">({e.tier})</span>
                <div className="text-white/60 text-[11px]">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SkillInspectorBody({ entry, onInspect, onJumpToSkill }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
        <p className="text-white/80 leading-relaxed">{entry.quickStart}</p>
        <div className="text-[#FDE047] font-bold">{entry.passiveSummary}</div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onJumpToSkill?.(entry.id)}
            className="px-3 py-1.5 rounded-xl bg-[#F2A900]/20 hover:bg-[#F2A900]/30 border border-[#F2A900]/50 text-[#FDE047] font-bold inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Open Full 1–99 {entry.name} Guide
          </button>
          {entry.instructor && (
            <button
              type="button"
              onClick={() => onInspect(entry.instructor)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold"
            >
              Mentor: {entry.instructor}
            </button>
          )}
        </div>
      </div>

      {entry.cape && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1">
          <div className="flex items-center gap-1.5 text-[#FDE047] font-bold">
            <Award className="w-4 h-4" />
            <span>{entry.cape.name} (Lv. 99)</span>
          </div>
          <div className="text-emerald-300 font-semibold">{entry.cape.stats}</div>
        </div>
      )}

      {entry.brackets?.length > 0 && (
        <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
            1–99 Leveling Tiers Preview
          </div>
          <div className="space-y-1.5">
            {entry.brackets.map((b) => (
              <div key={b.range} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03]">
                <span className="font-bold text-white">
                  <span className="text-[#FDE047]">{b.range}</span> &bull; {b.title}
                </span>
                <span className="text-white/60">~{b.xpPerAction} XP/act</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RewardChips({ rewards, onInspect }) {
  if (!rewards) return null;
  return (
    <div className="flex flex-wrap gap-1.5 text-[11px]">
      {rewards.xp > 0 && (
        <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-sky-200 font-bold">
          +{rewards.xp} Character XP
        </span>
      )}
      {rewards.glimmer > 0 && (
        <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-400/30 text-purple-200 font-bold">
          +{rewards.glimmer} Glimmer
        </span>
      )}
      {rewards.gold > 0 && (
        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 text-[#FDE047] font-bold">
          +{rewards.gold} Gold
        </span>
      )}
      {(rewards.professionXp || []).map((p) => (
        <span
          key={`${p.professionId}-${p.xp}`}
          className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-bold"
        >
          +{p.xp} {p.professionName} XP
        </span>
      ))}
      {(rewards.items || []).map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onInspect(it.id)}
          className="px-2 py-0.5 rounded bg-white/10 hover:bg-[#F2A900]/20 border border-white/20 text-white font-bold"
        >
          {it.icon} {it.name} &times;{it.qty}
        </button>
      ))}
      {(rewards.unlocks || []).map((u) => (
        <span
          key={u}
          className="px-2 py-0.5 rounded bg-[#F2A900]/15 border border-[#F2A900]/40 text-[#FDE047] font-semibold"
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          Unlocks: {u}
        </span>
      ))}
    </div>
  );
}
