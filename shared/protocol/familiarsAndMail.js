// ==========================================
// GlimmerFall Online — Summoner-Knight Nexus Familiars, Harmonic Extractor & Herald Postbox
// Pure deterministic catalogs and state helpers shared between client & authoritative server
// ==========================================

export const GLIMMER_CIPHERS_CATALOG = {
  cipher_solar: { id: 'cipher_solar', name: 'Solar Harmonic Cipher', faction: 'Solari', icon: '☀️', color: '#facc15' },
  cipher_terra: { id: 'cipher_terra', name: 'Verdant Harmonic Cipher', faction: 'Terra', icon: '🌿', color: '#4ade80' },
  cipher_umbri: { id: 'cipher_umbri', name: 'Umbral Harmonic Cipher', faction: 'Umbri', icon: '🌑', color: '#c084fc' },
  cipher_aether: { id: 'cipher_aether', name: 'Chrono Harmonic Cipher', faction: 'Aether', icon: '🔮', color: '#38bdf8' },
};

// Raw gathered matter -> Harmonic Cipher decoding yields
export const HARMONIC_EXTRACT_TABLE = {
  // Raw Fish & Coastal Catches
  raw_glimmer_minnow: { cipherId: 'cipher_terra', qty: 1, xp: 14, tier: 1, note: 'River Shallows Echo' },
  pearl_clam: { cipherId: 'cipher_terra', qty: 2, xp: 24, tier: 1, note: 'Tidal Mother-of-Pearl' },
  raw_solar_trout: { cipherId: 'cipher_solar', qty: 2, xp: 28, tier: 2, note: 'Sunlit Current Resonance' },
  golden_scale: { cipherId: 'cipher_solar', qty: 3, xp: 36, tier: 2, note: 'Refracted Dawn Foil' },
  raw_prism_salmon: { cipherId: 'cipher_aether', qty: 3, xp: 46, tier: 3, note: 'Prismatic Tide Harmonics' },
  iridescent_shell: { cipherId: 'cipher_aether', qty: 4, xp: 58, tier: 3, note: 'Spiral Leyline Chamber' },
  raw_void_eel: { cipherId: 'cipher_umbri', qty: 4, xp: 72, tier: 4, note: 'Deep Trench Bio-Current' },
  abyssal_black_pearl: { cipherId: 'cipher_umbri', qty: 6, xp: 105, tier: 4, note: 'Obsidian Abyss Core' },
  raw_celestial_koi: { cipherId: 'cipher_aether', qty: 6, xp: 125, tier: 5, note: 'Astral Ascending Memory' },
  astral_dragon_scale: { cipherId: 'cipher_solar', qty: 8, xp: 165, tier: 5, note: 'First-Age Leviathan Pulse' },

  // Cosmic Ores & Minerals
  sun_copper_ore: { cipherId: 'cipher_solar', qty: 1, xp: 16, tier: 1, note: 'Warm Metallic Hum' },
  star_tin_mineral: { cipherId: 'cipher_aether', qty: 1, xp: 16, tier: 1, note: 'Silvery Lattice Spark' },
  iron_ore: { cipherId: 'cipher_terra', qty: 1, xp: 18, tier: 1, note: 'Dense Bedrock Chord' },
  astral_mineral_dust: { cipherId: 'cipher_aether', qty: 2, xp: 26, tier: 2, note: 'Meteorite Resonance' },
  umbral_coal: { cipherId: 'cipher_umbri', qty: 2, xp: 28, tier: 2, note: 'Deep Fissure Ember' },
  mithril_astral_ore: { cipherId: 'cipher_aether', qty: 3, xp: 48, tier: 3, note: 'Mirrorgate Harmonic Seam' },
  adamant_terra_ore: { cipherId: 'cipher_terra', qty: 4, xp: 70, tier: 4, note: 'Tectonic Living Crystal' },
  celestial_runite_ore: { cipherId: 'cipher_aether', qty: 6, xp: 110, tier: 5, note: 'Summit Starlight Ore' },

  // Botanical Herbs & Fibers
  sunbloom_herb: { cipherId: 'cipher_solar', qty: 1, xp: 18, tier: 1, note: 'Warm Dawn Nectar' },
  starlight_flax: { cipherId: 'cipher_terra', qty: 1, xp: 16, tier: 1, note: 'Grove Filament Pulse' },
  gloomcap_spore: { cipherId: 'cipher_umbri', qty: 2, xp: 32, tier: 2, note: 'Bioluminescent Bog Echo' },
  shadow_silk: { cipherId: 'cipher_umbri', qty: 2, xp: 36, tier: 2, note: 'Duskveil Woven Thread' },
  chrono_lotus: { cipherId: 'cipher_aether', qty: 3, xp: 52, tier: 3, note: 'Time-Dewed Petal Memory' },
  celestial_gossamer: { cipherId: 'cipher_aether', qty: 4, xp: 78, tier: 4, note: 'Astral Loom Frequency' },
  empyrean_starleaf: { cipherId: 'cipher_solar', qty: 5, xp: 96, tier: 4, note: 'Sovereign Sky-Canopy Leaf' },

  // Arboreal Timber Logs
  blossom_logs: { cipherId: 'cipher_terra', qty: 1, xp: 14, tier: 1, note: 'Sweet Sanctuary Sap' },
  glimmerwood_logs: { cipherId: 'cipher_terra', qty: 1, xp: 16, tier: 1, note: 'Living Bark Grain' },
  pine_logs: { cipherId: 'cipher_terra', qty: 2, xp: 24, tier: 2, note: 'Alpine Resin Ring' },
  oak_logs: { cipherId: 'cipher_solar', qty: 2, xp: 32, tier: 2, note: 'Heartwood Solar Rings' },
  ironbark_logs: { cipherId: 'cipher_terra', qty: 3, xp: 45, tier: 3, note: 'Petrified Druid Timber' },
  duskveil_logs: { cipherId: 'cipher_umbri', qty: 4, xp: 64, tier: 4, note: 'Catacomb Mist Bough' },
  sunforged_logs: { cipherId: 'cipher_solar', qty: 5, xp: 88, tier: 4, note: 'Sun-Baked Timber Core' },
  starlight_logs: { cipherId: 'cipher_aether', qty: 6, xp: 118, tier: 5, note: 'Elder Celestial Timber' },

  // Ancient Relics
  ancient_relic_fragment: { cipherId: 'cipher_aether', qty: 3, xp: 55, tier: 3, note: 'First Nexus Memory Core' },
};

export const NEXUS_FAMILIARS_CATALOG = {
  dawnkit_ember_fox: {
    id: 'dawnkit_ember_fox',
    name: 'Dawnkit Ember-Fox',
    faction: 'Solari',
    elementPillar: 'Consecrated Light',
    rarity: 'Uncommon',
    echoPrintId: 'echo_print_ember_fox',
    spriteKey: 'familiarEmberFox',
    color: '#fb923c',
    glowColor: '#fde047',
    reqLevel: 1,
    xp: 90,
    ingredients: [
      { id: 'echo_print_ember_fox', qty: 1 },
      { id: 'cipher_solar', qty: 4 },
    ],
    passiveLabel: '+38px Night/Cave Lantern Aura • +8 Max HP • +2 HP/5s Vigor',
    passiveStats: {
      maxHp: 8,
      lanternRadius: 38,
      idleHpRegen: 2,
    },
    lore: 'A sunlit ember-tailed kit compiled from dawn blossoms and copper sparks. Keeps twilight trails warmly illuminated.',
  },
  mossback_ankyloling: {
    id: 'mossback_ankyloling',
    name: 'Mossback Ankyloling',
    faction: 'Terra',
    elementPillar: 'Primeval Rock & Water',
    rarity: 'Uncommon',
    echoPrintId: 'echo_print_ankyloling',
    spriteKey: 'familiarAnkyloling',
    color: '#2dd4bf',
    glowColor: '#4ade80',
    reqLevel: 1,
    xp: 95,
    ingredients: [
      { id: 'echo_print_ankyloling', qty: 1 },
      { id: 'cipher_terra', qty: 4 },
    ],
    passiveLabel: '+2 Bastion • +6 Max HP • +8% Gathering Double-Yield',
    passiveStats: {
      bastion: 2,
      maxHp: 6,
      harvestBonusChance: 0.08,
    },
    lore: 'An azure-scaled hatchling crowned with mossy bark plates. Noses out rich ore pockets and deep-rooted herbs.',
  },
  graveglass_wisp_imp: {
    id: 'graveglass_wisp_imp',
    name: 'Graveglass Wisp-Imp',
    faction: 'Umbri',
    elementPillar: 'Dusk Fog & Soul',
    rarity: 'Rare',
    echoPrintId: 'echo_print_wisp_imp',
    spriteKey: 'familiarWispImp',
    color: '#c084fc',
    glowColor: '#e879f9',
    reqLevel: 5,
    xp: 140,
    ingredients: [
      { id: 'echo_print_wisp_imp', qty: 1 },
      { id: 'cipher_umbri', qty: 5 },
      { id: 'ancient_relic_fragment', qty: 1 },
    ],
    passiveLabel: '+2 Tempo • +3 Glimmer Siphon on Kill • Soft Ghost Lantern',
    passiveStats: {
      tempo: 2,
      killGlimmer: 3,
      lanternRadius: 20,
    },
    lore: 'A mischievous twin-tailed dusk sprite bearing a flickering violet lantern, gathering stray glimmer on every victory.',
  },
  chrono_prism_sprite: {
    id: 'chrono_prism_sprite',
    name: 'Chrono-Prism Sprite',
    faction: 'Aether',
    elementPillar: 'Continuum Chrono',
    rarity: 'Rare',
    echoPrintId: 'echo_print_prism_sprite',
    spriteKey: 'familiarPrismSprite',
    color: '#38bdf8',
    glowColor: '#7dd3fc',
    reqLevel: 10,
    xp: 190,
    ingredients: [
      { id: 'echo_print_prism_sprite', qty: 1 },
      { id: 'cipher_aether', qty: 5 },
      { id: 'ancient_relic_fragment', qty: 1 },
    ],
    passiveLabel: '+2 Resonance • +4% Cast Speed • +15% Double Cipher Decode',
    passiveStats: {
      resonance: 2,
      castSpeedPct: 0.04,
      cipherBonusChance: 0.15,
    },
    lore: 'A brass-and-cyan rotating astrolabe cube compiled in Astral Observatories that sharpens harmonic extraction.',
  },
  starfall_moon_owl: {
    id: 'starfall_moon_owl',
    name: 'Starfall Moon-Owl',
    faction: 'Aether',
    elementPillar: 'Mirrorgate Sight',
    rarity: 'Epic',
    echoPrintId: 'echo_print_starfall_owl',
    spriteKey: 'familiarMoonOwl',
    color: '#93c5fd',
    glowColor: '#e0f2fe',
    reqLevel: 18,
    xp: 290,
    ingredients: [
      { id: 'echo_print_starfall_owl', qty: 1 },
      { id: 'cipher_aether', qty: 6 },
      { id: 'cipher_terra', qty: 4 },
      { id: 'ancient_relic_fragment', qty: 2 },
    ],
    passiveLabel: '+2 Resonance • +1 Tempo • +6% Skill XP • +28px Moon Lantern',
    passiveStats: {
      resonance: 2,
      tempo: 1,
      skillXpPct: 0.06,
      lanternRadius: 28,
    },
    lore: 'An astral horned sentinel compiled from nocturnal grove songs and cosmic quartz, guiding artisans cleanly through the dark.',
  },
  shattered_pyre_drake: {
    id: 'shattered_pyre_drake',
    name: 'Shattered Pyre-Drake',
    faction: 'Solari',
    elementPillar: 'Solar Flame',
    rarity: 'Legendary',
    echoPrintId: 'echo_print_pyre_drake',
    spriteKey: 'familiarPyreDrake',
    color: '#f97316',
    glowColor: '#ef4444',
    reqLevel: 25,
    xp: 420,
    ingredients: [
      { id: 'echo_print_pyre_drake', qty: 1 },
      { id: 'cipher_solar', qty: 8 },
      { id: 'cipher_umbri', qty: 4 },
      { id: 'cipher_aether', qty: 4 },
      { id: 'ancient_relic_fragment', qty: 3 },
    ],
    passiveLabel: '+2 Power • +2 Bastion • +6% Crit Damage • +40px Ember Glow',
    passiveStats: {
      power: 2,
      bastion: 2,
      critDamagePct: 0.06,
      lanternRadius: 40,
    },
    lore: 'A diminutive ember-winged drake woven from Caldera legends and First-Age battle chords.',
  },
};

export const FAMILIAR_VARIANTS_CATALOG = {
  default: { id: 'default', name: 'Classic Echo', badge: '🐾', tintColor: null },
  starlight: { id: 'starlight', name: 'Starlight Variant', badge: '🌟', tintColor: '#a5b4fc' },
  prismatic: { id: 'prismatic', name: 'Prismatic Variant', badge: '🌈', tintColor: '#f472b6' },
};

export function createDefaultFamiliarState() {
  return {
    unlockedIds: [],
    activeId: null,
    variants: {},
    activeVariants: {},
    duelWins: 0,
  };
}

export function normalizeFamiliarState(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const unlockedSet = new Set();
  if (Array.isArray(src.unlockedIds)) {
    for (const id of src.unlockedIds) {
      if (NEXUS_FAMILIARS_CATALOG[id]) unlockedSet.add(id);
    }
  }
  const unlockedIds = Array.from(unlockedSet);
  const activeId = src.activeId && unlockedSet.has(src.activeId) ? src.activeId : null;

  const variants = {};
  if (src.variants && typeof src.variants === 'object') {
    for (const famId of unlockedIds) {
      const list = Array.isArray(src.variants[famId]) ? src.variants[famId] : [];
      const cleanList = Array.from(new Set(list.filter((v) => v === 'starlight' || v === 'prismatic')));
      if (cleanList.length > 0) variants[famId] = cleanList;
    }
  }

  const activeVariants = {};
  if (src.activeVariants && typeof src.activeVariants === 'object') {
    for (const famId of unlockedIds) {
      const sel = src.activeVariants[famId];
      if ((sel === 'starlight' || sel === 'prismatic') && variants[famId]?.includes(sel)) {
        activeVariants[famId] = sel;
      }
    }
  }

  const duelWins = Math.max(0, Math.floor(Number(src.duelWins) || 0));
  return { unlockedIds, activeId, variants, activeVariants, duelWins };
}

export function computeFamiliarBonuses(activeFamiliarId) {
  const base = {
    power: 0,
    bastion: 0,
    resonance: 0,
    tempo: 0,
    maxHp: 0,
    castSpeedPct: 0,
    critDamagePct: 0,
    lanternRadius: 0,
    idleHpRegen: 0,
    killGlimmer: 0,
    harvestBonusChance: 0,
    cipherBonusChance: 0,
    skillXpPct: 0,
  };
  const def = activeFamiliarId ? NEXUS_FAMILIARS_CATALOG[activeFamiliarId] : null;
  if (!def?.passiveStats) return base;
  for (const [k, v] of Object.entries(def.passiveStats)) {
    if (k in base) base[k] = Number(v) || 0;
  }
  return base;
}

export function countBagItem(inv, itemId) {
  if (!Array.isArray(inv) || !itemId) return 0;
  let total = 0;
  for (const slot of inv) {
    if (!slot) continue;
    const id = typeof slot === 'string' ? slot : slot.id;
    if (id === itemId) total += typeof slot === 'object' && slot.qty ? Math.max(1, Number(slot.qty) || 1) : 1;
  }
  return total;
}

export function deductBagItems(inv, itemId, qty = 1) {
  if (!Array.isArray(inv) || qty <= 0) return true;
  if (countBagItem(inv, itemId) < qty) return false;
  let rem = qty;
  for (let i = inv.length - 1; i >= 0 && rem > 0; i--) {
    const slot = inv[i];
    if (!slot) continue;
    const id = typeof slot === 'string' ? slot : slot.id;
    if (id !== itemId) continue;
    const cur = typeof slot === 'object' && slot.qty ? Math.max(1, Number(slot.qty) || 1) : 1;
    if (cur > rem) {
      if (typeof slot === 'string') inv[i] = { id, qty: cur - rem };
      else slot.qty = cur - rem;
      rem = 0;
    } else {
      rem -= cur;
      inv.splice(i, 1);
    }
  }
  return rem <= 0;
}

export function addBagItem(inv, itemId, qty = 1, stackable = true, maxSlots = 28) {
  if (!Array.isArray(inv) || !itemId || qty <= 0) return false;
  if (stackable) {
    const existing = inv.find((s) => (typeof s === 'string' ? s : s?.id) === itemId);
    if (existing) {
      if (typeof existing === 'string') {
        inv[inv.indexOf(existing)] = { id: itemId, qty: 1 + qty };
      } else {
        existing.qty = (Number(existing.qty) || 1) + qty;
      }
      return true;
    }
    if (inv.length >= maxSlots) return false;
    inv.push({ id: itemId, qty });
    return true;
  }
  if (inv.length + qty > maxSlots) return false;
  for (let i = 0; i < qty; i++) inv.push({ id: itemId, qty: 1 });
  return true;
}

/**
 * Extract raw gathered material(s) into Harmonic Glimmer Ciphers inside `inv`.
 * Pure mutation-safe helper shared between server RoomManager & offline singleplayer.
 */
export function extractMaterialToCiphers({ inv, itemId, count = 1, activeFamiliarId = null, rng = Math.random }) {
  const spec = HARMONIC_EXTRACT_TABLE[itemId];
  if (!spec) return { ok: false, reason: 'Material cannot be decoded by the Harmonic Extractor' };
  const have = countBagItem(inv, itemId);
  const reqCount = Math.max(1, Math.min(25, Math.floor(Number(count) || 1)));
  if (have < reqCount) {
    return { ok: false, reason: `Need ${reqCount}x material (have ${have})` };
  }
  const cipherExists = Boolean(inv.find((s) => (typeof s === 'string' ? s : s?.id) === spec.cipherId));
  const freedSlot = have === reqCount ? 1 : 0;
  if (!cipherExists && inv.length - freedSlot + 1 > 28) {
    return { ok: false, reason: 'Backpack full (28/28)' };
  }

  const bonuses = computeFamiliarBonuses(activeFamiliarId);
  const bonusChance = 0.12 + (bonuses.cipherBonusChance || 0);
  let totalOut = 0;
  let bonusProcs = 0;
  for (let i = 0; i < reqCount; i++) {
    let unitOut = spec.qty;
    if (rng() < bonusChance) {
      unitOut += 1;
      bonusProcs += 1;
    }
    totalOut += unitOut;
  }

  if (!deductBagItems(inv, itemId, reqCount)) {
    return { ok: false, reason: 'Failed to consume source material' };
  }
  addBagItem(inv, spec.cipherId, totalOut, true, 28);

  return {
    ok: true,
    itemId,
    consumed: reqCount,
    cipherId: spec.cipherId,
    cipherQty: totalOut,
    bonusProcs,
    xp: spec.xp * reqCount,
  };
}

/**
 * Compile a Nexus Familiar from Echo-Print + Glimmer Ciphers and unlock it on `prog.familiars`.
 */
export function compileFamiliarFromPrint({ inv, prog, familiarId, riteBindingLevel = 1 }) {
  const def = NEXUS_FAMILIARS_CATALOG[familiarId];
  if (!def) return { ok: false, reason: 'Unknown Echo-Print Familiar' };
  if (!prog || typeof prog !== 'object') return { ok: false, reason: 'Missing character progression' };

  const famState = normalizeFamiliarState(prog.familiars);
  if (famState.unlockedIds.includes(def.id)) {
    return { ok: false, reason: `${def.name} is already compiled & bound to your Codex` };
  }
  if ((riteBindingLevel || 1) < (def.reqLevel || 1)) {
    return { ok: false, reason: `Requires Rite-Binding Lv.${def.reqLevel}` };
  }

  for (const ing of def.ingredients) {
    const have = countBagItem(inv, ing.id);
    if (have < ing.qty) {
      return { ok: false, reason: `Missing ${ing.id} (${have}/${ing.qty})` };
    }
  }
  for (const ing of def.ingredients) {
    deductBagItems(inv, ing.id, ing.qty);
  }

  famState.unlockedIds.push(def.id);
  famState.activeId = def.id;
  prog.familiars = famState;

  return {
    ok: true,
    familiar: def,
    familiars: famState,
    xp: def.xp || 100,
  };
}

// ==========================================
// Herald Postbox & Offline Mail Constants / Sanitization
// ==========================================
export const MAIL_POSTAGE_GOLD = 5;
export const MAX_MAILBOX_ITEMS = 40;

export function sanitizeMailText(raw, maxLen = 280) {
  return String(raw || '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function normalizeMailbox(rawList) {
  if (!Array.isArray(rawList)) return [];
  const out = [];
  for (const entry of rawList.slice(0, MAX_MAILBOX_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue;
    const gold = Math.max(0, Math.min(9999999, Math.floor(Number(entry.gold) || 0)));
    const items = Array.isArray(entry.items)
      ? entry.items
          .filter((it) => it && typeof it.id === 'string' && (Number(it.qty) || 0) > 0)
          .slice(0, 6)
          .map((it) => ({ id: it.id, qty: Math.max(1, Math.min(9999, Math.floor(Number(it.qty) || 1))) }))
      : [];
    out.push({
      id: String(entry.id || `mail_${out.length + 1}`),
      fromName: sanitizeMailText(entry.fromName || 'Sanctuary Herald', 28) || 'Sanctuary Herald',
      fromAccountId: entry.fromAccountId ? String(entry.fromAccountId) : null,
      subject: sanitizeMailText(entry.subject || 'Sanctuary Dispatch', 64) || 'Sanctuary Dispatch',
      body: sanitizeMailText(entry.body || '', 420),
      gold,
      items,
      read: Boolean(entry.read),
      claimed: Boolean(entry.claimed) || (gold === 0 && items.length === 0),
      kind: entry.kind ? String(entry.kind) : 'player',
      createdAt: entry.createdAt || new Date().toISOString(),
    });
  }
  return out;
}

export function createStarterMailParcel(championName = 'Summoner-Knight', faction = 'Solari') {
  const startersByFac = {
    Solari: { printId: 'echo_print_ember_fox', cipherId: 'cipher_solar', name: 'Dawnkit Ember-Fox' },
    Terra: { printId: 'echo_print_ankyloling', cipherId: 'cipher_terra', name: 'Mossback Ankyloling' },
    Umbri: { printId: 'echo_print_wisp_imp', cipherId: 'cipher_umbri', name: 'Graveglass Wisp-Imp' },
    Aether: { printId: 'echo_print_prism_sprite', cipherId: 'cipher_aether', name: 'Chrono-Prism Sprite' },
  };
  const pick = startersByFac[faction] || startersByFac.Solari;
  return {
    id: `mail_welcome_${pick.cipherId}`,
    fromName: 'Archivist Elara • Sanctuary Post',
    fromAccountId: null,
    subject: 'Welcome, Summoner-Knight: Starter Echo-Print Enclosed',
    body: `Hail ${championName}! Inside you'll find a Covenant Echo-Print for ${pick.name} and starter Harmonic Ciphers. Visit my Specimen Desk inside Archivist's Cottage (or any Observatory terminal) to decode raw fish/ores/herbs into Ciphers and compile your faithful companion!`,
    gold: 35,
    items: [
      { id: pick.printId, qty: 1 },
      { id: pick.cipherId, qty: 2 },
    ],
    read: false,
    claimed: false,
    kind: 'system_welcome',
    createdAt: new Date().toISOString(),
  };
}

// ==========================================
// Phase 5 — Echo Familiar Duels (/famduel) & Wild Stray Echoes
// ==========================================
export const FAMILIAR_DUEL_MAX_DURATION_MS = 60000;

export const FAMILIAR_FACTION_WHEEL = {
  Solari: { strongAgainst: 'Umbri', label: 'Solari ↔ Umbri' },
  Umbri: { strongAgainst: 'Solari', label: 'Umbri ↔ Solari' },
  Terra: { strongAgainst: 'Aether', label: 'Terra ↔ Aether' },
  Aether: { strongAgainst: 'Terra', label: 'Aether ↔ Terra' },
};

export function getFamiliarFactionMultiplier(attackerFaction = 'Solari', defenderFaction = 'Solari') {
  if (!attackerFaction || !defenderFaction) return { mult: 1.0, relation: 'neutral', label: 'Neutral' };
  if (attackerFaction === defenderFaction) {
    return { mult: 0.80, relation: 'resisted', label: 'Same-Element (-20%)' };
  }
  if (FAMILIAR_FACTION_WHEEL[attackerFaction]?.strongAgainst === defenderFaction) {
    return { mult: 1.35, relation: 'super', label: 'Rival Axis Advantage (+35%)' };
  }
  return { mult: 1.0, relation: 'neutral', label: 'Neutral' };
}

export const FAMILIAR_BATTLE_KITS = {
  dawnkit_ember_fox: {
    maxHp: 100,
    atk: 16,
    def: 8,
    moves: {
      strike: { key: 'strike', name: 'Ember Nip', cooldownMs: 2200, powerMult: 1.0, icon: '🐾', desc: 'Fast solar bite.' },
      ward: { key: 'ward', name: 'Dawn Mantle', cooldownMs: 7000, shield: 22, heal: 10, icon: '🛡️', desc: '+22 Shield & Mend 10 HP.' },
      surge: { key: 'surge', name: 'Solar Flare Pounce', cooldownMs: 9000, powerMult: 1.55, icon: '☀️', desc: 'Solari Surge (+35% vs Umbri) + 4 Burn.' },
    },
  },
  mossback_ankyloling: {
    maxHp: 112,
    atk: 14,
    def: 11,
    moves: {
      strike: { key: 'strike', name: 'Stone Ram', cooldownMs: 2200, powerMult: 1.0, icon: '🪨', desc: 'Heavy bedrock tackle.' },
      ward: { key: 'ward', name: 'Ironmoss Shell', cooldownMs: 7000, shield: 26, heal: 10, icon: '🛡️', desc: '+26 Shield & Mend 10 HP.' },
      surge: { key: 'surge', name: 'Tectonic Tremor', cooldownMs: 9000, powerMult: 1.50, icon: '🌿', desc: 'Terra Surge (+35% vs Aether).' },
    },
  },
  graveglass_wisp_imp: {
    maxHp: 96,
    atk: 17,
    def: 7,
    moves: {
      strike: { key: 'strike', name: 'Dusk Claw', cooldownMs: 2200, powerMult: 1.0, icon: '🐾', desc: 'Swift shadow slash.' },
      ward: { key: 'ward', name: 'Spectral Haze', cooldownMs: 7000, shield: 18, heal: 12, icon: '🛡️', desc: '+18 Shield & Mend 12 HP.' },
      surge: { key: 'surge', name: 'Voidflame Bolt', cooldownMs: 9000, powerMult: 1.60, siphonHp: 6, icon: '🌑', desc: 'Umbri Surge (+35% vs Solari) + 6 Siphon.' },
    },
  },
  chrono_prism_sprite: {
    maxHp: 98,
    atk: 16,
    def: 9,
    moves: {
      strike: { key: 'strike', name: 'Prism Beam', cooldownMs: 2200, powerMult: 1.0, icon: '✨', desc: 'Focused harmonic beam.' },
      ward: { key: 'ward', name: 'Time-Fold Barrier', cooldownMs: 7000, shield: 20, heal: 11, icon: '🛡️', desc: '+20 Shield & Mend 11 HP.' },
      surge: { key: 'surge', name: 'Chrono Refraction', cooldownMs: 9000, powerMult: 1.55, bonusDmg: 5, icon: '🔮', desc: 'Aether Surge (+35% vs Terra) + 5 Echo DMG.' },
    },
  },
  starfall_moon_owl: {
    maxHp: 104,
    atk: 15,
    def: 10,
    moves: {
      strike: { key: 'strike', name: 'Lunar Talon', cooldownMs: 2200, powerMult: 1.0, icon: '🌙', desc: 'Precision astral dive.' },
      ward: { key: 'ward', name: 'Moonwing Sanctuary', cooldownMs: 7000, shield: 22, heal: 14, icon: '🛡️', desc: '+22 Shield & Mend 14 HP.' },
      surge: { key: 'surge', name: 'Starfall Dive', cooldownMs: 9000, powerMult: 1.55, pierceShield: 0.5, icon: '🌟', desc: 'Aether Surge (pierces 50% Shield).' },
    },
  },
  shattered_pyre_drake: {
    maxHp: 106,
    atk: 17,
    def: 9,
    moves: {
      strike: { key: 'strike', name: 'Pyre Snap', cooldownMs: 2200, powerMult: 1.0, icon: '🔥', desc: 'Blazing drake bite.' },
      ward: { key: 'ward', name: 'Cinder Scales', cooldownMs: 7000, shield: 24, heal: 10, icon: '🛡️', desc: '+24 Shield & Mend 10 HP.' },
      surge: { key: 'surge', name: 'Caldera Breath', cooldownMs: 9000, powerMult: 1.60, icon: '🐉', desc: 'Solari Surge (+35% vs Umbri).' },
    },
  },
};

export function createFamiliarDuelFighter({ ownerId, ownerName, familiarId, variant = 'default' }) {
  const safeFamId = NEXUS_FAMILIARS_CATALOG[familiarId] ? familiarId : 'dawnkit_ember_fox';
  const def = NEXUS_FAMILIARS_CATALOG[safeFamId];
  const kit = FAMILIAR_BATTLE_KITS[safeFamId] || FAMILIAR_BATTLE_KITS.dawnkit_ember_fox;
  return {
    ownerId: String(ownerId || 'fighter'),
    ownerName: String(ownerName || 'Summoner'),
    familiarId: safeFamId,
    familiarName: def.name,
    spriteKey: def.spriteKey,
    faction: def.faction,
    color: def.color,
    variant: FAMILIAR_VARIANTS_CATALOG[variant] ? variant : 'default',
    hp: kit.maxHp,
    maxHp: kit.maxHp,
    shield: 0,
    atk: kit.atk,
    def: kit.def,
    cooldownsUntil: { strike: 0, ward: 0, surge: 0 },
  };
}

export function createFamiliarDuelSession({ id, fighterA, fighterB, isBot = false, startedAt = Date.now() }) {
  const a = createFamiliarDuelFighter(fighterA);
  const b = createFamiliarDuelFighter(fighterB);
  return {
    id: String(id || `famduel_${startedAt}`),
    isBot: Boolean(isBot),
    startedAt,
    expiresAt: startedAt + FAMILIAR_DUEL_MAX_DURATION_MS,
    ended: false,
    winnerOwnerId: null,
    winReason: null,
    fighters: { a, b },
    log: [`⚔️ ${a.familiarName} (${a.faction}) vs ${b.familiarName} (${b.faction}) — Friendly Companion Skirmish begun!`],
  };
}

export function executeFamiliarDuelMove(duel, sideKey, moveKey = 'strike', now = Date.now()) {
  if (!duel || duel.ended) return { ok: false, reason: 'Duel has already ended' };
  const side = sideKey === 'b' ? 'b' : 'a';
  const oppSide = side === 'a' ? 'b' : 'a';
  const actor = duel.fighters[side];
  const target = duel.fighters[oppSide];
  if (!actor || !target) return { ok: false, reason: 'Missing fighter' };

  const cleanMove = moveKey === 'ward' || moveKey === 'surge' ? moveKey : 'strike';
  const kit = FAMILIAR_BATTLE_KITS[actor.familiarId] || FAMILIAR_BATTLE_KITS.dawnkit_ember_fox;
  const spec = kit.moves[cleanMove];
  if (!spec) return { ok: false, reason: 'Unknown familiar move' };

  const cdUntil = actor.cooldownsUntil?.[cleanMove] || 0;
  if (now < cdUntil) {
    const remSec = ((cdUntil - now) / 1000).toFixed(1);
    return { ok: false, reason: `${spec.name} cooling down (${remSec}s)` };
  }

  actor.cooldownsUntil[cleanMove] = now + spec.cooldownMs;

  if (cleanMove === 'ward') {
    const shieldGain = spec.shield || 20;
    const healGain = spec.heal || 10;
    actor.shield = Math.min(45, (actor.shield || 0) + shieldGain);
    const beforeHp = actor.hp;
    actor.hp = Math.min(actor.maxHp, actor.hp + healGain);
    const healed = actor.hp - beforeHp;
    const msg = `🛡️ ${actor.familiarName} used ${spec.name}: +${shieldGain} Shield & +${healed} HP!`;
    duel.log = [msg, ...(duel.log || [])].slice(0, 6);
    return { ok: true, moveKey: cleanMove, moveName: spec.name, shieldGain, healed, dmg: 0, msg };
  }

  const baseRaw = Math.max(6, Math.round((actor.atk * (spec.powerMult || 1.0)) - target.def * 0.32)) + (spec.bonusDmg || 0);
  const wheel = cleanMove === 'surge'
    ? getFamiliarFactionMultiplier(actor.faction, target.faction)
    : { mult: 1.0, relation: 'neutral', label: '' };
  let totalDmg = Math.max(4, Math.round(baseRaw * wheel.mult));

  const piercePct = spec.pierceShield || 0;
  const effectiveShield = Math.round((target.shield || 0) * (1 - piercePct));
  const absorbed = Math.min(effectiveShield, totalDmg);
  target.shield = Math.max(0, (target.shield || 0) - absorbed);
  const hpDmg = Math.max(0, totalDmg - absorbed);
  target.hp = Math.max(0, target.hp - hpDmg);

  if (spec.siphonHp && hpDmg > 0) {
    actor.hp = Math.min(actor.maxHp, actor.hp + Math.min(spec.siphonHp, hpDmg));
  }

  const wheelTag = wheel.relation === 'super'
    ? ' 🔥 Advantage (+35%)!'
    : wheel.relation === 'resisted'
      ? ' (Resisted -20%)'
      : '';
  const absTag = absorbed > 0 ? ` (${absorbed} blocked)` : '';
  const msg = `${spec.icon} ${actor.familiarName} used ${spec.name} -> ${hpDmg} DMG${absTag}${wheelTag}`;
  duel.log = [msg, ...(duel.log || [])].slice(0, 6);

  if (target.hp <= 0) {
    duel.ended = true;
    duel.winnerOwnerId = actor.ownerId;
    duel.winReason = 'knockout';
    duel.log = [`🏆 ${actor.familiarName} triumphed in a friendly Echo Skirmish!`, ...duel.log].slice(0, 6);
  }
  return { ok: true, moveKey: cleanMove, moveName: spec.name, dmg: hpDmg, absorbed, relation: wheel.relation, msg };
}

export function resolveFamiliarDuelTimeout(duel, now = Date.now()) {
  if (!duel || duel.ended || now < duel.expiresAt) return false;
  const aPct = duel.fighters.a.hp / Math.max(1, duel.fighters.a.maxHp);
  const bPct = duel.fighters.b.hp / Math.max(1, duel.fighters.b.maxHp);
  duel.ended = true;
  duel.winReason = 'timeout';
  if (Math.abs(aPct - bPct) < 0.001) {
    duel.winnerOwnerId = null;
    duel.log = ['⏱️ 60s Time Up — Friendly Skirmish ended in an Honorable Draw!', ...(duel.log || [])].slice(0, 6);
  } else {
    const winSide = aPct > bPct ? duel.fighters.a : duel.fighters.b;
    duel.winnerOwnerId = winSide.ownerId;
    duel.log = [`⏱️ 60s Time Up — ${winSide.familiarName} wins on HP%!`, ...(duel.log || [])].slice(0, 6);
  }
  return true;
}

export function pickBotFamiliarDuelMove(duel, now = Date.now()) {
  const bot = duel?.fighters?.b;
  if (!bot) return 'strike';
  const canWard = now >= (bot.cooldownsUntil?.ward || 0);
  const canSurge = now >= (bot.cooldownsUntil?.surge || 0);
  if (bot.hp < bot.maxHp * 0.55 && canWard) return 'ward';
  if (canSurge) return 'surge';
  if (bot.hp < bot.maxHp * 0.78 && canWard) return 'ward';
  return 'strike';
}

export function isFamiliarDuelRoomAllowed(roomType, roomConfig = null) {
  if (!roomType) return false;
  if (roomType === 'sanctuary_hub') return true;
  if (roomConfig?.isInterior) return true;
  return String(roomType).startsWith('interior_');
}

// ==========================================
// Wild Event Stray Echoes (Non-lethal Soothing & Starlight/Prismatic Variants)
// ==========================================
export const WILD_STRAY_ECHOES_CATALOG = {
  stray_solari_fox: {
    id: 'stray_solari_fox',
    name: 'Stray Dawnkit Echo',
    familiarId: 'dawnkit_ember_fox',
    spriteKey: 'familiarEmberFox',
    faction: 'Solari',
    color: '#fde047',
    requiredCipherId: 'cipher_solar',
    rewardPrintId: 'echo_print_ember_fox',
    variantPool: ['starlight', 'prismatic'],
    variantChance: 0.40,
    titleUnlock: 'Echo Whisperer',
    zones: ['solar_highlands', 'sanctuary_hub', 'starfall_crater'],
  },
  stray_terra_ankyloling: {
    id: 'stray_terra_ankyloling',
    name: 'Stray Tideback Echo',
    familiarId: 'mossback_ankyloling',
    spriteKey: 'familiarAnkyloling',
    faction: 'Terra',
    color: '#4ade80',
    requiredCipherId: 'cipher_terra',
    rewardPrintId: 'echo_print_ankyloling',
    variantPool: ['starlight', 'prismatic'],
    variantChance: 0.40,
    titleUnlock: 'Echo Whisperer',
    zones: ['coral_coast', 'sunken_oasis', 'terra_orchard'],
  },
  stray_aether_prism: {
    id: 'stray_aether_prism',
    name: 'Stray Crystal-Prism Echo',
    familiarId: 'chrono_prism_sprite',
    spriteKey: 'familiarPrismSprite',
    faction: 'Aether',
    color: '#38bdf8',
    requiredCipherId: 'cipher_aether',
    rewardPrintId: 'echo_print_prism_sprite',
    variantPool: ['starlight', 'prismatic'],
    variantChance: 0.45,
    titleUnlock: 'Prism Binder',
    zones: ['luminous_cavern', 'frostspire_glacier', 'moonwell_sanctum', 'aether_spire'],
  },
  stray_umbri_wisp: {
    id: 'stray_umbri_wisp',
    name: 'Stray Duskveil Wisp Echo',
    familiarId: 'graveglass_wisp_imp',
    spriteKey: 'familiarWispImp',
    faction: 'Umbri',
    color: '#c084fc',
    requiredCipherId: 'cipher_umbri',
    rewardPrintId: 'echo_print_wisp_imp',
    variantPool: ['starlight', 'prismatic'],
    variantChance: 0.45,
    titleUnlock: 'Echo Whisperer',
    zones: ['nexus_forgotten_ruins', 'nexus_warzone', 'umbri_undercity'],
  },
  stray_moon_owl: {
    id: 'stray_moon_owl',
    name: 'Stray Starfall Owl Echo',
    familiarId: 'starfall_moon_owl',
    spriteKey: 'familiarMoonOwl',
    faction: 'Aether',
    color: '#93c5fd',
    requiredCipherId: 'cipher_aether',
    rewardPrintId: 'echo_print_starfall_owl',
    variantPool: ['starlight', 'prismatic'],
    variantChance: 0.50,
    titleUnlock: 'Prism Binder',
    zones: ['moonwell_sanctum', 'celestial_ascent', 'aether_spire'],
  },
  stray_pyre_drake: {
    id: 'stray_pyre_drake',
    name: 'Stray Caldera Drake Echo',
    familiarId: 'shattered_pyre_drake',
    spriteKey: 'familiarPyreDrake',
    faction: 'Solari',
    color: '#fb923c',
    requiredCipherId: 'cipher_solar',
    rewardPrintId: 'echo_print_pyre_drake',
    variantPool: ['starlight', 'prismatic'],
    variantChance: 0.55,
    titleUnlock: 'Prism Binder',
    zones: ['nexus_warzone', 'solar_highlands'],
  },
};

export function pickWildStrayEchoForZone(roomType) {
  const candidates = Object.values(WILD_STRAY_ECHOES_CATALOG).filter((e) => e.zones.includes(roomType));
  if (candidates.length > 0) return candidates[0];
  return WILD_STRAY_ECHOES_CATALOG.stray_solari_fox;
}

