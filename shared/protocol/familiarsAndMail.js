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

export function createDefaultFamiliarState() {
  return {
    unlockedIds: [],
    activeId: null,
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
  return { unlockedIds, activeId };
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
