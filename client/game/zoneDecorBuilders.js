// ==========================================
// GlimmerFall Online 2D — Zone Decor, Props & NPC Builders
// Extracted from client/game.js for modular maintainability
// ==========================================

import {
  ROOM_TYPES,
  ROOM_CONFIGS,
  SURFACE_ROOM_TYPES,
  SURFACE_ZONE_PLACEMENT,
  SURFACE_TRANSITION_CORRIDORS,
  SURFACE_WORLD_BOUNDS,
  isSurfaceRoomType,
  WAYPOINT_SHRINES_CATALOG,
} from '../../shared/protocol.js';
import { recordAchievementStat } from '../achievementsAndEmotes.js';
import {
  AWAKENING_DIALOGUE,
  WARZONE_DIALOGUE,
  RUINS_DIALOGUE,
  SOLARI_VAULT_DIALOGUE,
  UMBRI_LABYRINTH_DIALOGUE,
  TERRA_GROVE_DIALOGUE,
  AETHER_ARCHIVE_DIALOGUE,
  SOLARI_CITADEL_DIALOGUE,
  UMBRI_UNDERCITY_DIALOGUE,
  TERRA_ORCHARD_DIALOGUE,
  AETHER_SPIRE_DIALOGUE,
  CELESTIAL_ASCENT_DIALOGUE,
} from './dialoguesData.js';

export function createZoneDecorManager({
  audio,
  mapBounds,
  getProg,
  getQuestState,
  getPropsLength,
  getNpcsLength,
  setTarget,
  saveQuestState,
  updateQuestTrackerHUD,
  onAchievementUnlocked,
  applyZoneDecor,
}) {
  let lastDecorRoomType = null;
  let zoneEntryCardTimer = null;
  let cachedSurfaceProps = [];
  let cachedSurfaceNpcs = [];

  function showZoneEntryCard(resolvedRoomType, cfg, roomTitleOverride = null) {
    const card = document.getElementById('zone-entry-card');
    if (!card || document.body.classList.contains('frontpage-active')) return;
    const kickerEl = document.getElementById('zone-entry-kicker');
    const titleEl = document.getElementById('zone-entry-title');
    const subEl = document.getElementById('zone-entry-sub');

    const zoneMeta = {
      [ROOM_TYPES.SANCTUARY_HUB]: { kicker: 'SAFE HAVEN', title: 'SANCTUARY METROPOLIS', sub: 'Safe Zone • Crafting, Exchange & Guild Halls', color: '#facc15' },
      [ROOM_TYPES.SOLARI_CITADEL]: { kicker: 'SOLARI REALM', title: 'SUNSPIRE CITADEL', sub: 'Lv. 1–20 • Radiant Bastion & Solar Groves', color: '#facc15' },
      [ROOM_TYPES.UMBRI_UNDERCITY]: { kicker: 'UMBRI REALM', title: 'UMBRI UNDERCITY', sub: 'Lv. 10–30 • Shadowfang Caverns & Duskveil Ruins', color: '#c084fc' },
      [ROOM_TYPES.TERRA_ORCHARD]: { kicker: 'TERRA REALM', title: 'IRONWOOD ORCHARD', sub: 'Lv. 15–35 • Ancient Timber, Ore & Verdant Glades', color: '#4ade80' },
      [ROOM_TYPES.AETHER_SPIRE]: { kicker: 'AETHER REALM', title: 'CHRONOCORE SPIRE', sub: 'Lv. 25–45 • Leyline Rifts & Arcane Forges', color: '#38bdf8' },
      [ROOM_TYPES.CELESTIAL_ASCENT]: { kicker: 'ENDGAME REALM', title: 'CELESTIAL ASCENT', sub: 'Lv. 40+ • High-Tier Bosses & Mythic Shards', color: '#fbbf24' },
      [ROOM_TYPES.NEXUS_WARZONE]: { kicker: 'CONTESTED PVP ZONE', title: 'SHATTERED NEXUS WARZONE', sub: '4-Faction Open Siege • Full Outpost Warfare', color: '#f87171' },
      [ROOM_TYPES.ARENA_3V3]: { kicker: 'COMPETITIVE ARENA', title: '3V3 NEXUS ARENA', sub: 'Ranked Skirmish • Destroy the Enemy Nexus', color: '#fb7185' },
    };
    const meta = zoneMeta[resolvedRoomType] || (cfg?.isInterior ? {
      kicker: 'INDOOR INTERIOR',
      title: cfg.title || cfg.shortTitle || 'COZY INTERIOR',
      sub: 'Safe Indoor Room • Walk onto the southern mat or press [E] to exit',
      color: '#fbbf24',
    } : {
      kicker: 'ENTERING ZONE',
      title: (cfg?.name || resolvedRoomType || 'REALM').toUpperCase(),
      sub: cfg?.isPvp ? 'Contested PvP Territory' : 'Exploration Zone',
      color: '#38bdf8',
    });

    card.style.setProperty('--zone-accent', meta.color);
    if (kickerEl) kickerEl.textContent = meta.kicker;
    if (titleEl) titleEl.textContent = roomTitleOverride || meta.title;
    if (subEl) subEl.textContent = meta.sub;

    card.classList.add('visible');
    if (zoneEntryCardTimer) clearTimeout(zoneEntryCardTimer);
    zoneEntryCardTimer = setTimeout(() => {
      card.classList.remove('visible');
    }, 2600);
  }

  function setupZoneDecor(zoneType, roomTitleOverride = null) {
    const resolvedRoomType = ROOM_CONFIGS[zoneType]
      ? zoneType
      : zoneType === 'tutorial'
        ? ROOM_TYPES.SANCTUARY_HUB
        : zoneType === 'arena_3v3'
          ? ROOM_TYPES.ARENA_3V3
          : ROOM_TYPES.NEXUS_WARZONE;

    const isSurface = isSurfaceRoomType(resolvedRoomType);
    const wasSurface = isSurfaceRoomType(lastDecorRoomType);

    if (lastDecorRoomType === resolvedRoomType && !roomTitleOverride && getPropsLength() > 0 && getNpcsLength() > 0) {
      return;
    }

    const cfg = ROOM_CONFIGS[resolvedRoomType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    const nextBiomeTheme = cfg.biomeTheme || 'sanctuary';
    const nextZone =
      resolvedRoomType === ROOM_TYPES.SANCTUARY_HUB
        ? 'tutorial'
        : resolvedRoomType === ROOM_TYPES.ARENA_3V3
          ? 'arena_3v3'
          : 'main_world';

    mapBounds.halfW = isSurface ? SURFACE_WORLD_BOUNDS.halfW : cfg.halfW;
    mapBounds.halfH = isSurface ? SURFACE_WORLD_BOUNDS.halfH : cfg.halfH;
    audio.setBgmTheme(cfg.bgm || 'sanctuary');
    showZoneEntryCard(resolvedRoomType, cfg, roomTitleOverride);

    // Record Continental Waygate & Zone Exploration Achievements
    const prog = getProg();
    const questState = getQuestState();
    recordAchievementStat(prog, `zone_${resolvedRoomType}_visited`, 1, onAchievementUnlocked);
    prog.stats = prog.stats || {};
    prog.stats._visited_zones_set = prog.stats._visited_zones_set || {};
    if (!prog.stats._visited_zones_set[resolvedRoomType]) {
      prog.stats._visited_zones_set[resolvedRoomType] = true;
      recordAchievementStat(prog, 'zones_discovered_count', 1, onAchievementUnlocked);
    }

    if (!questState.visitedBiomes) questState.visitedBiomes = {};
    if (resolvedRoomType === ROOM_TYPES.SOLARI_CITADEL) questState.visitedBiomes.solari = true;
    if (resolvedRoomType === ROOM_TYPES.UMBRI_UNDERCITY) questState.visitedBiomes.umbri = true;
    if (resolvedRoomType === ROOM_TYPES.TERRA_ORCHARD) questState.visitedBiomes.terra = true;
    if (resolvedRoomType === ROOM_TYPES.AETHER_SPIRE) questState.visitedBiomes.aether = true;
    if (resolvedRoomType === ROOM_TYPES.CELESTIAL_ASCENT) questState.ascentReached = true;
    saveQuestState();
    updateQuestTrackerHUD();

    const hudEl = document.getElementById('hud');
    const zoneTitle = document.getElementById('minimap-zone-title');
    const zoneLabel = document.getElementById('zone-label');
    const arenaBanner = document.getElementById('arena-banner');
    const siegeBanner = document.getElementById('siege-banner');

    if (hudEl) {
      hudEl.classList.toggle('in-arena', resolvedRoomType === ROOM_TYPES.ARENA_3V3);
      hudEl.classList.toggle('in-siege', resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE);
    }
    if (siegeBanner) {
      siegeBanner.style.display = resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE ? 'block' : 'none';
    }
    if (zoneTitle) {
      zoneTitle.innerText = roomTitleOverride || cfg.shortTitle || 'SANCTUARY METROPOLIS';
    }
    if (zoneLabel) {
      zoneLabel.innerText = cfg.exitDestination ? 'Exit Outside' : (cfg.shortTitle || 'Overworld');
    }
    if (arenaBanner) {
      arenaBanner.style.display = resolvedRoomType === ROOM_TYPES.ARENA_3V3 ? 'flex' : 'none';
    }

    // Fast path: seamless overland walking across surface biomes keeps props/NPCs/FX intact!
    if (isSurface && wasSurface && cachedSurfaceProps.length > 0 && getPropsLength() > 0 && getNpcsLength() > 0) {
      lastDecorRoomType = resolvedRoomType;
      applyZoneDecor({
        currentRoomType: resolvedRoomType,
        currentBiomeTheme: nextBiomeTheme,
        currentZone: nextZone,
        npcs: cachedSurfaceNpcs,
        props: cachedSurfaceProps,
        resetFx: false,
      });
      return;
    }

    lastDecorRoomType = resolvedRoomType;
    setTarget(null);

    if (isSurface) {
      cachedSurfaceProps = [];
      cachedSurfaceNpcs = [];
      for (const sRoomType of SURFACE_ROOM_TYPES) {
        const place = SURFACE_ZONE_PLACEMENT[sRoomType];
        if (!place) continue;
        const zProps = [];
        const zNpcs = [];
        populateSingleZoneDecor(sRoomType, zProps, zNpcs, sRoomType === resolvedRoomType ? roomTitleOverride : null, false);
        for (const pr of zProps) {
          const moved = { ...pr, zoneType: sRoomType, x: pr.x + place.originX, y: pr.y + place.originY };
          if (pr.doorway) {
            moved.doorway = { ...pr.doorway, x: pr.doorway.x + place.originX, y: pr.doorway.y + place.originY };
          }
          cachedSurfaceProps.push(moved);
        }
        for (const npc of zNpcs) {
          cachedSurfaceNpcs.push({ ...npc, zoneType: sRoomType, x: npc.x + place.originX, y: npc.y + place.originY });
        }
      }
      // Discoverable Continental Waypoint Shrines
      for (const wp of WAYPOINT_SHRINES_CATALOG) {
        cachedSurfaceProps.push({
          id: wp.id,
          type: 'waypointShrine',
          shrineId: wp.id,
          name: wp.name,
          zoneType: wp.roomType,
          x: wp.wx,
          y: wp.wy,
          label: `🧭 ${wp.name} [Click / E]`,
        });
      }
      // Transitioning Buffer Highway lanterns & boundary markers along every seamless corridor
      for (const cor of SURFACE_TRANSITION_CORRIDORS) {
        const fromName = ROOM_CONFIGS[cor.fromRoom]?.shortTitle || cor.fromRoom;
        const toName = ROOM_CONFIGS[cor.toRoom]?.shortTitle || cor.toRoom;
        if (cor.axis === 'x') {
          cachedSurfaceProps.push(
            { type: 'streetLantern', x: cor.midX - 96, y: cor.midY - 56 },
            { type: 'streetLantern', x: cor.midX + 96, y: cor.midY + 56 },
            { type: 'woodenSign', x: cor.midX, y: cor.midY - 46, label: `🪧 ◀ ${fromName} | Border Crossing | ${toName} ▶` }
          );
        } else {
          cachedSurfaceProps.push(
            { type: 'streetLantern', x: cor.midX - 56, y: cor.midY - 96 },
            { type: 'streetLantern', x: cor.midX + 56, y: cor.midY + 96 },
            { type: 'woodenSign', x: cor.midX + 48, y: cor.midY, label: `🪧 ▲ ${fromName} | Border Crossing | ${toName} ▼` }
          );
        }
      }
      applyZoneDecor({
        currentRoomType: resolvedRoomType,
        currentBiomeTheme: nextBiomeTheme,
        currentZone: nextZone,
        npcs: cachedSurfaceNpcs,
        props: cachedSurfaceProps,
        resetFx: !wasSurface,
      });
      return;
    }

    const props = [];
    const npcs = [];
    applyZoneDecor({
      currentRoomType: resolvedRoomType,
      currentBiomeTheme: nextBiomeTheme,
      currentZone: nextZone,
      npcs,
      props,
      resetFx: true,
    });
    populateSingleZoneDecor(resolvedRoomType, props, npcs, roomTitleOverride, true);
  }

  function populateSingleZoneDecor(resolvedRoomType, props, npcs, roomTitleOverride = null, updateHudDom = true) {
    const cfg = ROOM_CONFIGS[resolvedRoomType] || ROOM_CONFIGS[ROOM_TYPES.SANCTUARY_HUB];
    const zoneTitle = updateHudDom ? document.getElementById('minimap-zone-title') : null;
    const zoneLabel = updateHudDom ? document.getElementById('zone-label') : null;
    const arenaBanner = updateHudDom ? document.getElementById('arena-banner') : { style: {} };

    if (cfg?.isInterior) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || cfg.shortTitle || 'COZY INTERIOR';
      if (zoneLabel) zoneLabel.innerText = cfg.exitDestination ? 'Exit Outside' : 'Sanctuary Haven';
      arenaBanner.style.display = 'none';
      const exitY = cfg.halfH - 14;
      props.push({
        type: 'doorThresholdGlow',
        x: 0,
        y: exitY,
        label: '🚪 Exit Outside [Walk / E]',
        exitDoor: cfg.exitDestination,
      });

      if (resolvedRoomType === ROOM_TYPES.INTERIOR_TAVERN) {
        props.push(
          { type: 'hearthFireplace', x: 0, y: -96, label: '🔥 Hearthstone Inn Fireplace' },
          { type: 'tavernBar', x: -72, y: -78, label: '🍺 Tavern Bar Counter' },
          { type: 'aleKeg', x: -126, y: -88 },
          { type: 'aleKeg', x: -126, y: -62 },
          { type: 'campfire', stationId: 'campfire_hearth', x: 86, y: -78, label: '🍲 Inn Cooking Hearth [Click / E]' },
          { type: 'bookshelf', x: 142, y: -96 },
          { type: 'tcgDuelTable', x: 12, y: 18, label: '🃏 1v1 GlimmerFall TCG Duel Table [Click / E]' },
          { type: 'diningTable', x: -94, y: 18 },
          { type: 'diningTable', x: 96, y: 18 },
          { type: 'diningTable', x: -94, y: -22 },
          { type: 'cozyBed', x: 142, y: 46 },
          { type: 'streetLantern', x: -146, y: 92 },
          { type: 'streetLantern', x: 146, y: 92 }
        );
        npcs.push(
          {
            id: 'npc_innkeeper_garrick',
            name: 'Innkeeper Garrick',
            role: 'Hearthstone Innkeeper [Click / T]',
            spriteKey: 'merchantProvisionsNpc',
            x: -72,
            y: -52,
            dialogue: [
              {
                speaker: 'INNKEEPER GARRICK • HEARTHSTONE INN',
                spriteKey: 'merchantProvisionsNpc',
                merchantId: 'merchant_tavern',
                text: 'Welcome inside out of the wind! Pull up a chair by the roaring hearth, grab a tankard of golden cider, challenge a patron or GlimmerBot at our 1v1 GlimmerFall TCG Duel Table, or cook your fresh catch on our inn griddle.\n\nAdventurers always recover their strength fastest indoors!',
                actions: [
                  { label: '🃏 PLAY 1V1 GLIMMERFALL TCG (TAVERN DUEL)', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                  { label: '✨ REST AT HEARTH (FULL HP & GLIMMER)', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac; font-weight:bold;' },
                  { label: '🍺 TAVERN DRINKS & RATIONS SHOP', action: 'openShop', style: 'border-color:#fbbf24; color:#fde047; font-weight:bold;' },
                  { label: '🍲 OPEN COOKING HEARTH', action: 'openStation_campfire_hearth', style: 'border-color:#fb923c; color:#fed7aa;' },
                  { label: '👋 JUST BROWSING', action: 'close' },
                ],
              },
            ],
          },
          {
            id: 'npc_bard_melody',
            name: 'Minstrel Lyra-Song',
            role: 'Tavern Bard & Chronicler [Click / T]',
            spriteKey: 'heraldNpc',
            x: 88,
            y: -12,
            dialogue: [
              {
                speaker: 'MINSTREL LYRA-SONG • HEARTHSTONE INN',
                spriteKey: 'heraldNpc',
                text: 'Every champion needs a warm refuge when twilight or autumn rain sweeps across Sanctuary Haven. Have you tried a match of GlimmerFall TCG at our velvet duel table yet?',
                actions: [
                  { label: '🃏 PLAY 1V1 GLIMMERFALL TCG', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                  { label: '🎵 APPRECIATE THE TUNE', action: 'close' },
                ],
              },
              {
                speaker: 'MINSTREL LYRA-SONG • HEARTHSTONE INN',
                spriteKey: 'heraldNpc',
                text: 'Watch the waystone lanterns as evening deepens: each flame marks the safe border roads between the four Covenants—while dusk raiders stir beyond the glow.',
              },
            ],
          },
          {
            id: 'npc_echo_keeper_sylvi',
            name: 'Echo Keeper Sylvi',
            role: 'Familiar Tactician & Whisperer [Click / T]',
            spriteKey: 'heraldNpc',
            x: 16,
            y: -40,
            dialogue: [
              {
                speaker: 'ECHO KEEPER SYLVI • HEARTHSTONE INN',
                spriteKey: 'heraldNpc',
                text: 'Pull up your Nexus Companion! Right inside Hearthstone Inn or Sanctuary Hub you can challenge any fellow Summoner with /famduel <player>, spar against my Starlight Sprite, or prepare Harmonic Ciphers to soothe Wild Stray Echoes during 15-minute World Events!',
                actions: [
                  { label: '🐾 FRIENDLY ECHO SKIRMISH (VS SYLVI)', action: 'startFamDuelTrainer', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
                  { label: '🏗️ FAMILIAR MOVES & CONSTRUCT CRADLE', action: 'openEcho_library', style: 'border-color:#4ade80; color:#dcfce7; font-weight:bold;' },
                  { label: '⚗️ OPEN HARMONIC EXTRACTOR', action: 'openEcho_extractor', style: 'border-color:#38bdf8; color:#e0f2fe;' },
                  { label: '👋 ANOTHER TIME', action: 'close' },
                ],
              },
            ],
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_BANK_VAULT) {
        props.push(
          { type: 'bankCounter', x: 0, y: -48, label: '🏛️ Vault Teller Desk' },
          { type: 'goldChestPile', x: -124, y: -92, label: '💰 High-Security Reserve Vault' },
          { type: 'goldChestPile', x: 124, y: -92, label: '💰 High-Security Reserve Vault' },
          { type: 'bookshelf', x: -144, y: 18 },
          { type: 'bookshelf', x: 144, y: 18 },
          { type: 'crystalPillar', x: -58, y: -92 },
          { type: 'crystalPillar', x: 58, y: -92 },
          { type: 'brazier', x: -146, y: 92 },
          { type: 'brazier', x: 146, y: 92 }
        );
        npcs.push(
          {
            id: 'npc_vault_steward_aurelius',
            name: 'Steward Aurelius',
            role: 'Chief Vaultmaster [Click / T]',
            spriteKey: 'bankerNpc',
            isBank: true,
            x: -36,
            y: -38,
          },
          {
            id: 'npc_vault_broker_silvius',
            name: 'Exchange Broker Silvius',
            role: 'AetherSwap Inside Teller [Click / T]',
            spriteKey: 'bankerNpc',
            isExchange: true,
            x: 36,
            y: -38,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE) {
        props.push(
          { type: 'factionCrestAether', x: -24, y: -106 },
          { type: 'hearthFireplace', x: -24, y: -84, label: '🔥 Cozy Cottage Hearth' },
          { type: 'bookshelf', x: -112, y: -84 },
          { type: 'specimenFrame', x: 34, y: -88, label: '🖼️ Botanical & Mana Specimen' },
          { type: 'bookshelf', x: -124, y: -12 },
          { type: 'sleepingPetCat', x: -102, y: -2, label: '🐈 Slumbering Tabby Familiar' },
          { type: 'workstationConsole', specialStation: 'echo_extractor', x: 108, y: 6, label: '⚗️ Harmonic Extractor Desk [Click / E]' },
          { type: 'constructCradle', specialStation: 'construct_cradle', x: 36, y: 24, label: '🐾 Construct Cradle [Click / E]' },
          { type: 'mapTable', x: -48, y: 12, label: '🗺️ Continental Exploration Chart' },
          { type: 'cozyBed', x: -122, y: 58 },
          { type: 'terracottaUrn', x: 40, y: 64 },
          { type: 'streetLantern', x: 36, y: 88 },
          {
            type: 'ironVaultGrate',
            puzzleId: 'cottage_archive_vault',
            isPuzzleGate: true,
            x: 112,
            y: -40,
            label: '🔐 Covenant Iron Vault Grate [Click / E]',
          },
          {
            type: 'goldChestPile',
            puzzleId: 'cottage_archive_vault',
            isPuzzleChest: true,
            x: 112,
            y: -74,
            label: '💎 Archivist’s Vault Chest [Click / E]',
          }
        );
        npcs.push({
          id: 'npc_archivist_elara',
          name: 'Archivist Elara',
          role: 'Sanctuary Scholar [Click / T]',
          spriteKey: 'aetherAstromancerNpc',
          x: -52,
          y: -18,
          dialogue: [
            {
              speaker: 'ARCHIVIST ELARA • SCHOLAR COTTAGE',
              spriteKey: 'aetherAstromancerNpc',
              text: 'Ah, a quiet refuge to study the First Nexus chronicles! Outside, Sanctuary teems with recruits, while inside these walls you can rest, inspect continental charts, and prepare your loadouts safely.',
              actions: [
                { label: '⚗️ HARMONIC EXTRACTOR', action: 'openEcho_extractor', style: 'border-color:#38bdf8; color:#e0f2fe; font-weight:bold;' },
                { label: '🐾 CONSTRUCT CRADLE', action: 'openEcho_cradle', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
                { label: '📬 CHECK HERALD POSTBOX', action: 'openMail', style: 'border-color:#fde047; color:#fef08a;' },
                { label: '✨ REST AT STUDY HEARTH (FULL VITALS)', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac; font-weight:bold;' },
                { label: '👋 GOODBYE', action: 'close' },
              ],
            },
            {
              speaker: 'ARCHIVIST ELARA • SCHOLAR COTTAGE',
              spriteKey: 'aetherAstromancerNpc',
              text: 'Have you wondered why the ancients called us Summoner-Knights? When the Nexus shattered, beast-spirits did not vanish—their memory settled inside wild herbs, star-copper veins, and Silver Koi scales, awaiting a Harmonic Extractor to sing them whole again.',
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_SOLARI_SMITHY) {
        props.push(
          { type: 'hearthFireplace', x: 0, y: -92, label: '🔥 Blazing Guild Foundry' },
          { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: -72, y: -28, label: '🔨 Sunforged Guild Anvil [Click / E]' },
          { type: 'weaponRack', x: -126, y: -86 },
          { type: 'weaponRack', x: 126, y: -86 },
          { type: 'weaponRack', x: 126, y: 18 },
          { type: 'mapTable', x: 66, y: -24 },
          { type: 'aleKeg', x: -130, y: 32 },
          { type: 'brazier', x: -140, y: 86 },
          { type: 'brazier', x: 140, y: 86 }
        );
        npcs.push({
          id: 'npc_smith_solon',
          name: 'Master Smith Solon',
          role: 'Sunforged Guildmaster [Click / T]',
          spriteKey: 'merchantSmithNpc',
          x: -72,
          y: -58,
          dialogue: [
            {
              speaker: 'MASTER SMITH SOLON • SUNFORGED SMITHY',
              spriteKey: 'merchantSmithNpc',
              merchantId: 'merchant_smith',
              text: 'Feel that heat from the Sunforged hearth! My apprentice Torvin watches the courtyard stall outside while I temper high-grade alloys right here inside the hall.',
              actions: [
                { label: '🔨 USE GUILD STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
                { label: '🛒 BROWSE SMITHING WARES', action: 'openShop', style: 'border-color:#facc15; color:#fde047;' },
                { label: '✨ REST BY THE FORGE', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac;' },
                { label: '👋 FAREWELL', action: 'close' },
              ],
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_TERRA_APOTHECARY) {
        props.push(
          { type: 'blossomTree', x: -128, y: -76 },
          { type: 'pineTree', x: 128, y: -76 },
          { type: 'hearthFireplace', x: 0, y: -92, label: '🔥 Conservatory Drying Hearth' },
          { type: 'alchemyShelf', x: -72, y: -86 },
          { type: 'alchemyShelf', x: 72, y: -86 },
          { type: 'flowerBed', x: -96, y: -36 },
          { type: 'flowerBed', x: 96, y: -36 },
          { type: 'sleepingPetFox', x: -26, y: -46, label: '🦊 Conservatory Spirit Fox' },
          { type: 'factionCrestLeaf', x: 8, y: -20 },
          { type: 'terracottaUrn', x: -36, y: -6 },
          { type: 'terracottaUrn', x: 52, y: -6 },
          { type: 'aetherCrucible', stationId: 'aether_crucible', x: -92, y: 28, label: '⚗️ Rootdeep Indoor Crucible [Click / E]' },
          { type: 'celestialLoom', stationId: 'celestial_loom', x: 92, y: 28, label: '🧵 Botanical Silk Loom [Click / E]' },
          { type: 'cozyBed', x: -134, y: 74 },
          { type: 'specimenFrame', x: 134, y: 60 },
          { type: 'constructCradle', specialStation: 'construct_cradle', x: 0, y: -44, label: '🐾 Verdant Construct Cradle [Click / E]' },
          { type: 'workstationConsole', specialStation: 'echo_extractor', x: 134, y: 12, label: '⚗️ Botanical Harmonic Extractor [Click / E]' },
          { type: 'streetLantern', x: -64, y: 88 },
          { type: 'streetLantern', x: 64, y: 88 }
        );
        npcs.push({
          id: 'npc_herbalist_willow',
          name: 'Herbalist Willow',
          role: 'Apothecary Hostess [Click / T]',
          spriteKey: 'terraHerbalistNpc',
          x: 0,
          y: 26,
          dialogue: [
            {
              speaker: 'HERBALIST WILLOW • ROOTDEEP APOTHECARY HOUSE',
              spriteKey: 'terraHerbalistNpc',
              merchantId: 'merchant_apothecary',
              text: 'Step softly — dried sunblooms and moon-moss bundles scent every rafters beam! Brew salves at my crucible, weave flax at the loom, or rest beside the herbal drying hearth.',
              actions: [
                { label: '⚗️ OPEN APOTHECARY CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
                { label: '⚗️ HARMONIC EXTRACTOR', action: 'openEcho_extractor', style: 'border-color:#38bdf8; color:#e0f2fe;' },
                { label: '🐾 CONSTRUCT CRADLE', action: 'openEcho_cradle', style: 'border-color:#4ade80; color:#dcfce7;' },
                { label: '🛒 APOTHECARY STOCK', action: 'openShop', style: 'border-color:#4ade80; color:#86efac;' },
                { label: '✨ REST & HEAL', action: 'restAtInn', style: 'border-color:#facc15; color:#fde047;' },
                { label: '👋 THANK YOU', action: 'close' },
              ],
            },
            {
              speaker: 'HERBALIST WILLOW • ROOTDEEP APOTHECARY HOUSE',
              spriteKey: 'terraHerbalistNpc',
              text: 'Grass, Tidewater, Rich Soil, and Living Stone—those four elements uphold every Terra guardian. Pure strength, restorative waters, clear vision, and an unwavering instinct to shelter the realm.',
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_UMBRI_PARLOR) {
        props.push(
          { type: 'tavernBar', x: 0, y: -82, label: '🍷 Velvet Veil Night Bar' },
          { type: 'celestialLoom', stationId: 'celestial_loom', x: -72, y: -22, label: '🧵 Velvet Shadow Loom [Click / E]' },
          { type: 'goldChestPile', x: 124, y: -26 },
          { type: 'tcgDuelTable', x: 18, y: 18, label: '🃏 Velvet Veil 1v1 GlimmerFall TCG Table [Click / E]' },
          { type: 'diningTable', x: 84, y: 18 },
          { type: 'bookshelf', x: -126, y: 24 },
          { type: 'umbriBrazierAltar', x: -116, y: -82 },
          { type: 'umbriBrazierAltar', x: 116, y: -82 },
          { type: 'umbriBrazierAltar', x: -140, y: 86 },
          { type: 'umbriBrazierAltar', x: 140, y: 86 }
        );
        npcs.push({
          id: 'npc_mistress_vexis',
          name: 'Mistress Vexis',
          role: 'Velvet Veil Proprietor [Click / T]',
          spriteKey: 'shadowBrokerNpc',
          x: 0,
          y: -52,
          dialogue: [
            {
              speaker: 'MISTRESS VEXIS • VELVET VEIL PARLOR',
              spriteKey: 'shadowBrokerNpc',
              merchantId: 'merchant_tailor',
              text: 'Hush... leave the graveyard fog at the threshold. Inside the Velvet Veil, brokers trade rare twilight silks, duel with Graveglass Veil TCG decks, and tired blades regain their edge.',
              actions: [
                { label: '🃏 PLAY 1V1 GLIMMERFALL TCG', action: 'openTcgDuel', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
                { label: '🧵 USE SHADOW LOOM', action: 'openStation_celestial_loom', style: 'border-color:#c084fc; color:#e9d5ff; font-weight:bold;' },
                { label: '🛒 TAILORING SILKS & WARES', action: 'openShop', style: 'border-color:#a855f7; color:#f3e8ff;' },
                { label: '✨ REST IN SHADOWS', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac;' },
                { label: '👋 DEPART', action: 'close' },
              ],
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY) {
        props.push(
          { type: 'factionCrestAether', x: 0, y: -110 },
          { type: 'aetherArmillary', x: 0, y: -78, label: '🔭 Astral Celestial Sphere' },
          { type: 'bookshelf', x: -132, y: -82 },
          { type: 'bookshelf', x: 122, y: -82 },
          { type: 'sleepingPetCat', x: 122, y: -74, label: '🐈 Slumbering Observatory Cat' },
          { type: 'woodStairs', x: -102, y: -48, label: '🪜 Observatory Mezzanine Steps' },
          { type: 'balustradeRail', x: -70, y: -48 },
          { type: 'balustradeRail', x: -38, y: -48 },
          { type: 'balustradeRail', x: 46, y: -48 },
          { type: 'balustradeRail', x: 78, y: -48 },
          { type: 'mapTable', x: 0, y: 0, label: '🗺️ Starlight Nexus Astrolabe' },
          { type: 'aetherCrucible', stationId: 'aether_crucible', x: -96, y: 4, label: '⚗️ Astral Resonance Crucible [Click / E]' },
          { type: 'workstationConsole', specialStation: 'echo_extractor', x: 112, y: 4, label: '⚗️ Specimen Harmonic Extractor [Click / E]' },
          { type: 'constructCradle', specialStation: 'construct_cradle', x: 0, y: 48, label: '🐾 Astral Construct Cradle [Click / E]' },
          { type: 'terracottaUrn', x: -34, y: 44 },
          { type: 'crystalPillar', x: 116, y: 44 },
          { type: 'crystalPillar', x: -40, y: 82 },
          { type: 'crystalPillar', x: 136, y: 82 }
        );
        npcs.push({
          id: 'npc_magister_orionis',
          name: 'Magister Orionis',
          role: 'Observatory Savant [Click / T]',
          spriteKey: 'aetherAstromancerNpc',
          x: 62,
          y: -62,
          dialogue: [
            {
              speaker: 'MAGISTER ORIONIS • ASTRAL OBSERVATORY',
              spriteKey: 'aetherAstromancerNpc',
              merchantId: 'merchant_relics',
              text: 'Notice how the starlight charts reflect the Leylines directly overhead! Take a moment inside our observatory to commune with the astrolabe, fuse arcane potions, or inspect recovered relics.',
              actions: [
                { label: '⚗️ USE ASTRAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#38bdf8; color:#bae6fd; font-weight:bold;' },
                { label: '⚗️ HARMONIC EXTRACTOR', action: 'openEcho_extractor', style: 'border-color:#38bdf8; color:#e0f2fe;' },
                { label: '🐾 CONSTRUCT CRADLE', action: 'openEcho_cradle', style: 'border-color:#c084fc; color:#f3e8ff;' },
                { label: '🛒 CURIO & RELIC WARES', action: 'openShop', style: 'border-color:#c084fc; color:#f3e8ff;' },
                { label: '✨ ATTUNE & REST', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac;' },
                { label: '👋 CLOSE', action: 'close' },
              ],
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_MARINER_TAVERN) {
        props.push(
          { type: 'hearthFireplace', x: 0, y: -96, label: '🔥 Sea-Driftwood Fireplace' },
          { type: 'tavernBar', x: -72, y: -78, label: '⚓ Galley Ale Counter' },
          { type: 'campfire', stationId: 'campfire_hearth', x: 96, y: -78, label: '🐟 Galley Seafood Skillet [Click / E]' },
          { type: 'aleKeg', x: -128, y: -86 },
          { type: 'aleKeg', x: -128, y: -56 },
          { type: 'tcgDuelTable', x: 0, y: 18, label: '🃏 Mariner 1v1 GlimmerFall TCG Table [Click / E]' },
          { type: 'mapTable', x: 86, y: 18, label: '🗺️ Sea Chart & Reef Log' },
          { type: 'diningTable', x: -86, y: 18 },
          { type: 'cozyBed', x: 142, y: -80 },
          { type: 'streetLantern', x: -146, y: 92 },
          { type: 'streetLantern', x: 146, y: 92 }
        );
        npcs.push({
          id: 'npc_captain_brine',
          name: 'Captain Brine',
          role: 'Mariner Innkeeper [Click / T]',
          spriteKey: 'anglerFinnNpc',
          x: -72,
          y: -52,
          dialogue: [
            {
              speaker: 'CAPTAIN BRINE • MARINER TAVERN',
              spriteKey: 'anglerFinnNpc',
              merchantId: 'merchant_tavern',
              text: 'Ahoy! Wipe the Coral Coast sea spray off your boots and warm up by our driftwood fireplace. Pan-sear your fresh catch at the galley skillet or deal a round of 1v1 GlimmerFall TCG!',
              actions: [
                { label: '🃏 PLAY 1V1 GLIMMERFALL TCG', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                { label: '✨ REST AT GALLEY HEARTH (FULL VITALS)', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac; font-weight:bold;' },
                { label: '🐟 OPEN GALLEY COOKING HEARTH', action: 'openStation_campfire_hearth', style: 'border-color:#38bdf8; color:#bae6fd; font-weight:bold;' },
                { label: '🍺 GALLEY PROVISIONS & TONICS', action: 'openShop', style: 'border-color:#fbbf24; color:#fde047;' },
                { label: '👋 FAIR WINDS', action: 'close' },
              ],
            },
            {
              speaker: 'CAPTAIN BRINE • MARINER TAVERN',
              spriteKey: 'anglerFinnNpc',
              text: 'When squalls blow off Brinelight Shallows at dusk, keep one eye on the bamboo pier lanterns—and if you delve into the pitch-black Vaults or Labyrinths inland, watch for glowing ore veins and the silver cone of surface light marking your exit!',
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_GUILD_HALL) {
        props.push(
          { type: 'hearthFireplace', x: 0, y: -96, label: '🔥 Vanguard Guildhall Hearth [Click / E]' },
          { type: 'factionCrestSolari', x: -56, y: -108 },
          { type: 'factionCrestLeaf', x: 0, y: -112 },
          { type: 'factionCrestAether', x: 56, y: -108 },
          { type: 'mapTable', x: 0, y: -22, label: '🗺️ Continental Campaign War-Table [Click / E]' },
          { type: 'tcgDuelTable', x: 54, y: 28, label: '🃏 Vanguard 1v1 GlimmerFall TCG Table [Click / E]' },
          { type: 'trainingDummy', x: -64, y: -18, label: '🥋 Vanguard Combat DPS Dummy [Click / E]' },
          { type: 'weaponRack', x: -132, y: -86, label: '⚔️ Vanguard Armory Rack [Click / E]' },
          { type: 'weaponRack', x: 132, y: -86, label: '⚔️ Vanguard Armory Rack [Click / E]' },
          { type: 'archeryTarget', x: -138, y: -18, label: '🎯 Guild Marksman Target [Click / E]' },
          { type: 'archeryTarget', x: 138, y: -18, label: '🎯 Guild Marksman Target [Click / E]' },
          { type: 'bookshelf', x: -88, y: -92, label: '📖 Chronicles of the First Nexus [Click / E]' },
          { type: 'bookshelf', x: 88, y: -92, label: '📖 Codex of the Four Covenants [Click / E]' },
          { type: 'bardHarpStand', x: 84, y: -42, label: '🎵 Gilded Vanguard Harp [Click / E]' },
          { type: 'supplyCrate', x: -136, y: 48, label: '📦 Quartermaster Supply Cache [Click / E]' },
          { type: 'supplyCrate', x: 136, y: 48, label: '📦 Quartermaster Supply Cache [Click / E]' },
          { type: 'bountyBoard', isBountyBoard: true, x: -78, y: 38, label: '📜 Guildhall Bounty Ledger [Click / E]' },
          { type: 'sleepingPetFox', x: 46, y: -64, label: '🦊 Guild Mascot Ember-Fox [Click / E]' },
          { type: 'cozyBed', x: 144, y: -4, label: '🛏️ Champion Bunk [Click / E]' },
          { type: 'streetLantern', x: -146, y: 92 },
          { type: 'streetLantern', x: 146, y: 92 }
        );
        npcs.push({
          id: 'npc_guildmaster_thorne',
          name: 'Guildmaster Thorne',
          role: 'Adventurers Guild Commander [Click / T]',
          spriteKey: 'warzoneArchonNpc',
          x: 0,
          y: -52,
          dialogue: [
            {
              speaker: 'GUILDMASTER THORNE • VANGUARD GUILDHALL',
              spriteKey: 'warzoneArchonNpc',
              text: 'Welcome to the Adventurers Vanguard Guildhall! Every object in our lodge is yours to use: study the Continental War-Table, duel at the 1v1 GlimmerFall TCG Table, practice combinations on the archery targets, rummage Quartermaster Supply Crates, or claim contracts from the Bounty Ledger.\n\nHave you explored the CrystalEcho Caverns south of Sanctuary Gardens yet?',
              actions: [
                { label: '🃏 PLAY 1V1 GLIMMERFALL TCG (GUILD TABLE)', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                { label: '📜 OPEN GUILD BOUNTY LEDGER', action: 'openBountyBoard', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                { label: '✨ REST AT GUILD HEARTH (FULL VITALS)', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac; font-weight:bold;' },
                { label: '📬 CHECK GUILD MAILBOX', action: 'openMail', style: 'border-color:#38bdf8; color:#bae6fd;' },
                { label: '👋 FOR THE REALM!', action: 'close' },
              ],
            },
          ],
        });
      } else if (resolvedRoomType === ROOM_TYPES.INTERIOR_TCG_PAVILION) {
        props.push(
          { type: 'hearthFireplace', x: 0, y: -112, label: '🔥 Pavilion Hearthfire [Click / E]' },
          { type: 'factionCrestSolari', x: -72, y: -118 },
          { type: 'factionCrestLeaf', x: 0, y: -126 },
          { type: 'factionCrestAether', x: 72, y: -118 },
          { type: 'tcgDuelTable', x: 0, y: -16, label: '🃏 Grand Championship 1v1 TCG Table [Click / E]' },
          { type: 'tcgDuelTable', x: -94, y: 12, label: '🃏 West Bronze 1v1 TCG Table [Click / E]' },
          { type: 'tcgDuelTable', x: 94, y: 12, label: '🃏 East Auric 1v1 TCG Table [Click / E]' },
          { type: 'wishingShrine', x: -92, y: -68, label: '🌟 Top-Deck Lucky Wish Shrine [Click / E]' },
          { type: 'covenantBannerStand', x: 92, y: -68, label: '🚩 Continental TCG Rally Standard [Click / E]' },
          { type: 'ancientSundialClock', x: 0, y: 42, label: '⏳ Round Clock & Swiss Timer [Click / E]' },
          { type: 'bookshelf', x: -138, y: -102, label: '📖 First Edition 322-Card Compendium [Click / E]' },
          { type: 'bookshelf', x: 138, y: -102, label: '📖 40-Card Meta Deck Archive [Click / E]' },
          { type: 'bountyBoard', isBountyBoard: true, x: -138, y: -24, label: '📜 TCG & Arena Contract Board [Click / E]' },
          { type: 'supplyCrate', x: 142, y: -24, label: '📦 Sleeve & Deckbox Cache [Click / E]' },
          { type: 'sleepingPetCat', x: -52, y: -76, label: '🐈 Pavilion Lucky Tabby [Click / E]' },
          { type: 'streetLantern', x: -158, y: 92 },
          { type: 'streetLantern', x: 158, y: 92 }
        );
        npcs.push(
          {
            id: 'npc_tcg_grandmaster_solis',
            name: 'Grandmaster Solis',
            role: 'TCG Tournament Director [Click / T]',
            spriteKey: 'warzoneArchonNpc',
            x: 0,
            y: -62,
            dialogue: [
              {
                speaker: 'GRANDMASTER SOLIS • GRAND TCG PAVILION',
                spriteKey: 'warzoneArchonNpc',
                text: 'Welcome to the Grand GlimmerFall TCG Pavilion! Every hero begins with our complete First Edition 322-card catalog and curated 40-card decks — no pack paywalls required.\n\nStep up to any velvet table or click Challenge right here to test your deck against our GlimmerBot AI or duel another adventurer live!',
                actions: [
                  { label: '🃏 START 1V1 GLIMMERFALL TCG DUEL', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                  { label: '✨ REST AT HEARTH (FULL VITALS)', action: 'restAtInn', style: 'border-color:#4ade80; color:#86efac; font-weight:bold;' },
                  { label: '👋 GOOD LUCK AT THE TABLES', action: 'close' },
                ],
              },
            ],
          },
          {
            id: 'npc_tcg_archivist_lyra',
            name: 'Archivist Lyra',
            role: 'First Edition Collector [Click / T]',
            spriteKey: 'cartographerNpc',
            x: 78,
            y: -36,
            dialogue: [
              {
                speaker: 'ARCHIVIST LYRA • CARD ARCHIVE',
                spriteKey: 'cartographerNpc',
                text: 'You can build and sync your personal decks on GlimmerFallTCG.com, or test preconstructed decks like Solar Singularity, Gaia\'s Loop, Fractured Continuum, and The Graveglass Veil directly in the Pavilion.\n\nTouch the Top-Deck Shrine for a fresh 90-second Starlight Wish before heading north to Frostspire Glacier!',
                actions: [
                  { label: '🃏 PLAY 1V1 CARD DUEL', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                  { label: '📚 CLOSE', action: 'close' },
                ],
              },
            ],
          }
        );
      }
      return;
    }

    if (resolvedRoomType === ROOM_TYPES.SANCTUARY_HUB) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'SANCTUARY METROPOLIS #1';
      if (zoneLabel) zoneLabel.innerText = 'Sanctuary Haven';
      arenaBanner.style.display = 'none';

      // ==========================================
      // COZY, VIBRANT SANCTUARY HOMETOWN & HAVEN PROPS
      // ==========================================
      props.push(
        // 1. Awakening Homecoming Plaza & Spawn Courtyard (Right around spawn 0, 96)
        { type: 'ancientWell', x: 64, y: 112 },
        { type: 'ancientWell', isScryingPool: true, x: -64, y: 112, label: '🔮 Scrying Pool • Spectate 3v3 Arena [Click / E]' },
        { type: 'solariSundial', x: 0, y: 152 },
        { type: 'flowerBed', x: -92, y: 72 },
        { type: 'flowerBed', x: 92, y: 72 },
        { type: 'flowerBed', x: -92, y: 138 },
        { type: 'flowerBed', x: 92, y: 138 },
        { type: 'streetLantern', x: -34, y: 62 },
        { type: 'streetLantern', x: 34, y: 62 },
        { type: 'streetLantern', x: -34, y: 142 },
        { type: 'streetLantern', x: 34, y: 142 },
        { type: 'blossomTree', x: -118, y: 58 },
        { type: 'blossomTree', x: 118, y: 58 },
        { type: 'blossomTree', x: -118, y: 152 },
        { type: 'blossomTree', x: 118, y: 152 },

        // 2. Grand Central Starlight Fountain Plaza (Center 0, -10)
        { type: 'grandFountain', x: 0, y: -10 },
        { type: 'stoneBench', x: -46, y: -32 },
        { type: 'stoneBench', x: 46, y: -32 },
        { type: 'stoneBench', x: -46, y: 16 },
        { type: 'stoneBench', x: 46, y: 16 },
        { type: 'brazier', x: -34, y: -58 },
        { type: 'brazier', x: 34, y: -58 },
        { type: 'brazier', x: -68, y: -10 },
        { type: 'brazier', x: 68, y: -10 },
        { type: 'streetLantern', x: -72, y: -52 },
        { type: 'streetLantern', x: 72, y: -52 },
        { type: 'bountyBoard', isBountyBoard: true, x: -54, y: -72, label: '📜 Vanguard Bounty Board [Click / E]' },
        { type: 'flowerBed', x: -108, y: -52 },
        { type: 'flowerBed', x: 108, y: -52 },

        // 3. North Civic Terrace: Grand AetherSwap Exchange & Grand AetherVault Bank
        { type: 'bankBuilding', x: -115, y: -155, label: '🏛️ The Grand AetherSwap Exchange' },
        { type: 'heraldPostbox', isPostbox: true, x: 42, y: -112, label: '📬 Herald Postbox • Vault Square [Click / E]' },
        { type: 'heraldPostbox', isPostbox: true, x: 212, y: 118, label: '📬 Herald Postbox • Hearthstone Inn [Click / E]' },
        { type: 'bankCounter', x: -115, y: -105 },
        { type: 'streetLantern', x: -155, y: -105 },
        { type: 'streetLantern', x: -75, y: -105 },
        { type: 'doorThresholdGlow', x: 115, y: -124 },
        {
          type: 'bankBuilding',
          x: 115,
          y: -155,
          label: '🏛️ Grand AetherVault Hall [Enter]',
          doorway: { targetRoom: ROOM_TYPES.INTERIOR_BANK_VAULT, x: 115, y: -124, radius: 14 },
        },
        { type: 'bankCounter', x: 115, y: -105 },
        { type: 'streetLantern', x: 75, y: -105 },
        { type: 'streetLantern', x: 155, y: -105 },
        { type: 'stoneBench', x: 0, y: -125 },
        { type: 'blossomTree', x: -185, y: -155 },
        { type: 'blossomTree', x: 185, y: -155 },

        // 4. Cozy Hometown Cottages, Tavern & Guildhalls Framing the Town Square
        { type: 'doorThresholdGlow', x: -255, y: -110 },
        {
          type: 'cityHouseA',
          x: -255,
          y: -135,
          label: "📚 Archivist's Cottage [Enter]",
          doorway: { targetRoom: ROOM_TYPES.INTERIOR_SANCTUARY_COTTAGE, x: -255, y: -110, radius: 15 },
        },
        {
          type: 'noticeBoard',
          noticeBoardId: 'sanctuary_cottage',
          x: -292,
          y: -116,
          label: "📋 Cottage Archive Notice Board [Click / E]",
        },
        { type: 'doorThresholdGlow', x: 255, y: -110 },
        {
          type: 'cityHouseB',
          x: 255,
          y: -135,
          label: '🃏 Grand GlimmerFall TCG Pavilion [Enter]',
          doorway: { targetRoom: ROOM_TYPES.INTERIOR_TCG_PAVILION, x: 255, y: -110, radius: 15 },
        },
        { type: 'doorThresholdGlow', x: -275, y: 122 },
        {
          type: 'cityHouseA',
          x: -275,
          y: 95,
          label: '🛡️ Vanguard Adventurers Guildhall [Enter]',
          doorway: { targetRoom: ROOM_TYPES.INTERIOR_GUILD_HALL, x: -275, y: 122, radius: 16 },
        },
        { type: 'doorThresholdGlow', x: 275, y: 122 },
        {
          type: 'tavernBuilding',
          x: 275,
          y: 95,
          label: '🍺 Hearthstone Inn & Tavern [Enter]',
          doorway: { targetRoom: ROOM_TYPES.INTERIOR_TAVERN, x: 275, y: 122, radius: 16 },
        },
        {
          type: 'noticeBoard',
          noticeBoardId: 'sanctuary_inn',
          x: 236,
          y: 118,
          label: '📋 Hearthstone Inn Notice Board [Click / E]',
        },
        {
          type: 'tcgDuelTable',
          x: 236,
          y: 154,
          label: '🃏 Hearthstone Patio 1v1 GlimmerFall TCG Table [Click / E]',
        },
        { type: 'cityHouseA', x: -175, y: -255 },
        { type: 'cityHouseB', x: -65, y: -255 },
        { type: 'cityHouseA', x: 65, y: -255 },
        { type: 'cityHouseB', x: 175, y: -255 },
        { type: 'streetLantern', x: -120, y: -215 },
        { type: 'streetLantern', x: 0, y: -215 },
        { type: 'streetLantern', x: 120, y: -215 },

        // 5. West Artisan Workshop & Market Courtyard (Spacious bays with paired crafting partners)
        // 5A. Textile & Provisions Bay (Loom & Pantry grouped together)
        { type: 'celestialLoom', stationId: 'celestial_loom', x: -225, y: -54, label: '🧵 Celestial Loom [Click / E]' },
        { type: 'marketStallProvisions', id: 'stall_provisions', x: -170, y: -54 },
        { type: 'streetLantern', x: -135, y: -54 },

        // 5B. Blacksmithing & Foundry Bay (Forge workbench & Cosmic Star-Anvil grouped together)
        { type: 'marketStallSmith', x: -225, y: 28 },
        { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: -170, y: 28, label: '🔨 Cosmic Star-Anvil [Click / E]' },
        { type: 'brazier', x: -260, y: 28 },

        // 5C. Alchemy & Crucible Terrace (Dedicated elixir station)
        { type: 'aetherCrucible', stationId: 'aether_crucible', x: -198, y: 110, label: '⚗️ Aetherial Crucible [Click / E]' },
        { type: 'streetLantern', x: -135, y: 110 },
        { type: 'brazier', x: -250, y: 110 },

        // 6. East Combat Trial Courtyard (Right beside Central Plaza!)
        { type: 'pillar', x: 145, y: -35 },
        { type: 'pillar', x: 235, y: -35 },
        { type: 'brazier', x: 145, y: 75 },
        { type: 'brazier', x: 235, y: 75 },
        { type: 'stoneBench', x: 190, y: -52, label: '🪑 Courtyard Rest Bench [Click / E]' },
        { type: 'trainingDummy', x: 172, y: 18, label: '🥋 Vanguard Combat DPS Dummy [Click / E]' },
        { type: 'mysteryPeddlerCart', x: -115, y: 122, label: '🔮 Astral Mystery Peddler Cart [Click / E]' },
        { type: 'archeryTarget', x: 195, y: 58, label: '🎯 Precision Archery Target [Click / E]' },
        { type: 'archeryTarget', x: 235, y: 58, label: '🎯 Precision Archery Target [Click / E]' },
        { type: 'weaponRack', x: 145, y: 20, label: '⚔️ Trial Yard Weapon Rack [Click / E]' },
        { type: 'supplyCrate', x: -248, y: -18, label: '📦 Workshop Supply Crate [Click / E]' },
        { type: 'supplyCrate', x: 242, y: 132, label: '📦 Tavern Provision Crate [Click / E]' },
        { type: 'alchemistAlembic', x: -232, y: 110, label: '⚗️ Copper Distillation Alembic [Click / E]' },
        { type: 'arcaneTelescope', x: -64, y: -112, label: '🔭 Sanctuary Stargazer Telescope [Click / E]' },
        { type: 'bardHarpStand', x: 54, y: -12, label: '🎵 Plaza Concert Harp [Click / E]' },
        { type: 'wishingShrine', x: -58, y: -14, label: '🌟 Celestial Wishing Shrine [Click / E]' },
        { type: 'ancientSundialClock', x: 64, y: -112, label: '⏳ Chrono-Astrolabe Sundial [Click / E]' },
        { type: 'covenantBannerStand', x: -242, y: 122, label: '🚩 Vanguard Rally Standard [Click / E]' },

        // 7. South Memorial Gardens & Starter Skilling Groves
        { type: 'monument', x: 0, y: 245, label: '🗿 First Nexus Memorial Monument [Click / E]' },
        { type: 'runicObelisk', x: 0, y: 198, label: '🔮 Covenant Lore Obelisk [Click / E]' },
        { type: 'crystalGeode', x: -215, y: 255, label: '💎 Shimmering Crystal Geode [Click / E]' },
        {
          type: 'cavernEntrance',
          x: -245,
          y: 262,
          label: '🕳️ CrystalEcho Caverns Entrance [Enter / E]',
          doorway: { targetRoom: ROOM_TYPES.LUMINOUS_CAVERN, x: -245, y: 274, radius: 18 },
        },
        { type: 'stoneBench', x: -45, y: 245, label: '🪑 Memorial Garden Bench [Click / E]' },
        { type: 'stoneBench', x: 45, y: 245, label: '🪑 Memorial Garden Bench [Click / E]' },
        { type: 'blossomTree', x: -85, y: 215 },
        { type: 'blossomTree', x: 85, y: 215 },
        { type: 'ancientOak', x: -185, y: 235 },
        { type: 'ancientOak', x: 185, y: 235 },
        { type: 'fallenLog', x: -215, y: 224 },
        { type: 'fallenLog', x: 215, y: 224 },
        { type: 'terracottaUrn', x: -232, y: -116 },
        { type: 'terracottaUrn', x: -278, y: -116 },
        { type: 'mountainCrag', x: -245, y: 185 },
        { type: 'mountainCrag', x: 245, y: 185 },
        { type: 'flowerBed', x: -145, y: 245 },
        { type: 'flowerBed', x: 145, y: 245 },
        { type: 'streetLantern', x: -42, y: 205 },
        { type: 'streetLantern', x: 42, y: 205 },

        // 8. Four Cardinal City Gateways
        { type: 'ruinedArch', x: 0, y: -375 },
        { type: 'crystalPillar', x: -55, y: -375 },
        { type: 'crystalPillar', x: 55, y: -375 },
        { type: 'ruinedArch', x: 0, y: 375 },
        { type: 'ancientOak', x: -65, y: 375 },
        { type: 'ancientOak', x: 65, y: 375 },
        { type: 'ruinedArch', x: -410, y: 0 },
        { type: 'brazier', x: -410, y: -42 },
        { type: 'brazier', x: -410, y: 42 },
        { type: 'ruinedArch', x: 410, y: 0 },
        { type: 'umbriBrazierAltar', x: 410, y: -42 },
        { type: 'umbriBrazierAltar', x: 410, y: 42 }
      );

      npcs.push(
        {
          id: 'npc_aurora',
          name: 'Herald Lyra',
          role: 'Sunspire Herald [Click / T]',
          spriteKey: 'heraldNpc',
          x: 38,
          y: 82,
          dialogue: AWAKENING_DIALOGUE,
        },
        {
          id: 'npc_exchange_caelum',
          name: 'Broker Caelum',
          role: 'Grand Exchange Broker [Click / T]',
          spriteKey: 'bankerNpc',
          x: -115,
          y: -105,
          isExchange: true,
        },
        {
          id: 'npc_bank_orin',
          name: 'Trove-Master Orin',
          role: 'AetherVault Chief Banker [Click / T]',
          spriteKey: 'bankerNpc',
          x: 115,
          y: -105,
          isBank: true,
        },
        {
          id: 'merchant_provisions',
          name: 'Farmer Bran',
          role: 'Provisions & Rations [Click / T]',
          spriteKey: 'merchantProvisionsNpc',
          stallId: 'stall_provisions',
          merchantType: 'merchant_provisions',
          isMerchant: true,
          x: -170,
          y: -24,
        },
        {
          id: 'npc_artisan_aldric',
          name: 'Artisan Master Aldric',
          role: 'Guild Forgemaster [Click / T]',
          spriteKey: 'merchantSmithNpc',
          x: -198,
          y: 52,
          dialogue: [
            {
              speaker: 'ARTISAN MASTER ALDRIC • SANCTUARY WORKSHOP',
              spriteKey: 'merchantSmithNpc',
              text: 'Hail, adventurer! Right here in the Sanctuary Workshop you can train all three crafting professions: smelt ores at the Cosmic Star-Anvil, brew elixirs at the Aetherial Crucible, or spin cloaks at the Celestial Loom.\n\nWhen you travel the four cardinal roads to the peaceful faction capitals, seek out our regional guild merchants—Blacksmith Torvin in the Golden Citadel, Alchemist Faye in Glimmer Orchard, Shadow Stitcher Silvan in the Undercity, and Relic-Seeker Moira at Mirrorgate Spire!',
              actions: [
                { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
                { label: '⚗️ OPEN AETHERIAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff;' },
                { label: '👋 FAREWELL', action: 'close' },
              ],
            },
          ],
        },
        {
          id: 'npc_archon',
          name: 'Commander Valerius',
          role: 'Sunspire Warlord [Click / T]',
          spriteKey: 'warzoneArchonNpc',
          x: 0,
          y: -48,
          dialogue: WARZONE_DIALOGUE,
        },
        {
          id: 'npc_echo_keeper_sanc',
          name: 'Echo Keeper Sylvi',
          role: 'Stray Echo Whisperer [Click / T]',
          spriteKey: 'heraldNpc',
          x: 132,
          y: 128,
          dialogue: [
            {
              speaker: 'ECHO KEEPER SYLVI • SANCTUARY PLAZA',
              spriteKey: 'heraldNpc',
              text: 'Listen to the leylines hum! Challenge nearby champions inside Sanctuary or the Tavern with /famduel <player> (100% non-lethal 60s Echo Skirmish), or track World-Event Stray Echoes out in the biomes and press [E] with a Harmonic Cipher to earn Starlight & Prismatic variants!',
              actions: [
                { label: '🐾 START PRACTICE /FAMDUEL', action: 'startFamDuelTrainer', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
                { label: '🏗️ INSPECT FAMILIAR MOVES & AURAS', action: 'openEcho_library', style: 'border-color:#4ade80; color:#dcfce7; font-weight:bold;' },
                { label: '👋 MAY YOUR ECHOES SING', action: 'close' },
              ],
            },
          ],
        }
      );
      if (!introShown && !questState.introShown && !questState.talkedNpcs?.npc_aurora && !frontpage.isOpen) {
        introShown = true;
        questState.introShown = true;
        saveQuestState();
        openDialogue(AWAKENING_DIALOGUE, 'heraldNpc', 'npc_aurora');
      }
    } else if (resolvedRoomType === ROOM_TYPES.ARENA_3V3) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || '3v3 NEXUS ARENA';
      if (zoneLabel) zoneLabel.innerText = 'Exit Arena';
      arenaBanner.style.display = 'flex';

      props.push(
        { type: 'brazier', x: -64, y: 180 },
        { type: 'brazier', x: 64, y: 180 },
        { type: 'brazier', x: -64, y: -180 },
        { type: 'brazier', x: 64, y: -180 },
        { type: 'pillar', x: -110, y: 0 },
        { type: 'pillar', x: 110, y: 0 }
      );
    } else if (resolvedRoomType === ROOM_TYPES.NEXUS_FORGOTTEN_RUINS) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'FORGOTTEN FIRST NEXUS RUINS';
      if (zoneLabel) zoneLabel.innerText = 'To Caldera';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'campfire', x: -38, y: 145, label: '🔥 Expedition Waystation Hearth' },
        { type: 'woodenSign', x: 78, y: 145, label: '🪧 N: Continental Caldera | S: Sanctuary Haven' },
        { type: 'ancientWell', x: -95, y: 135 },
        { type: 'crystalPillar', x: -140, y: 60 },
        { type: 'crystalPillar', x: 140, y: 60 },
        { type: 'brazier', x: -70, y: 140 },
        { type: 'brazier', x: 70, y: 140 },
        { type: 'brazier', x: -70, y: -140 },
        { type: 'brazier', x: 70, y: -140 },
        { type: 'pillar', x: -160, y: -90 },
        { type: 'pillar', x: 160, y: -90 },
        { type: 'mountainCrag', x: -240, y: 130 },
        { type: 'mountainCrag', x: 240, y: 130 },
        { type: 'ancientOak', x: -250, y: -140 },
        { type: 'ancientOak', x: 250, y: -140 },
        // East Ruins Crypt Covenant Seal & Vault Alcove
        {
          type: 'ironVaultGrate',
          puzzleId: 'ruins_nexus_seal',
          isPuzzleGate: true,
          x: 208,
          y: -216,
          label: '🔐 Forgotten Covenant Vault Grate [Click / E]',
        },
        {
          type: 'goldChestPile',
          puzzleId: 'ruins_nexus_seal',
          isPuzzleChest: true,
          x: 208,
          y: -252,
          label: '🏺 First-Era Sealed Vault Chest [Click / E]',
        },
        { type: 'terracottaUrn', x: 184, y: -206 },
        { type: 'terracottaUrn', x: 232, y: -206 },
        // Grand North Waygate to Continental Caldera Realm
        { type: 'ruinedArch', x: 0, y: -380 },
        { type: 'crystalPillar', x: -80, y: -380 },
        { type: 'crystalPillar', x: 80, y: -380 },
        { type: 'brazier', x: -48, y: -390 },
        { type: 'brazier', x: 48, y: -390 }
      );
      npcs.push({
        id: 'npc_atlas',
        name: 'Atlas the Cartographer',
        role: 'Keystone Seeker [Click / T]',
        spriteKey: 'cartographerNpc',
        x: 42,
        y: 135,
        dialogue: RUINS_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.CELESTIAL_ASCENT) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'CELESTIAL ASCENT & EMPYREAN TITAN SUMMIT';
      if (zoneLabel) zoneLabel.innerText = 'To Caldera';
      arenaBanner.style.display = 'none';

      // Grand Summit Props (Stairway colonnade, terrace monuments, throne braziers)
      props.push(
        // South Entrance Threshold & Greeting Colonnade
        { type: 'ruinedArch', x: 0, y: 1040 },
        { type: 'brazier', x: -50, y: 1020 },
        { type: 'brazier', x: 50, y: 1020 },
        { type: 'crystalPillar', x: -90, y: 980 },
        { type: 'crystalPillar', x: 90, y: 980 },
        { type: 'crystalPillar', x: -90, y: 780 },
        { type: 'crystalPillar', x: 90, y: 780 },
        { type: 'crystalPillar', x: -90, y: 580 },
        { type: 'crystalPillar', x: 90, y: 580 },
        { type: 'brazier', x: -50, y: 580 },
        { type: 'brazier', x: 50, y: 580 },

        // Mid-Ascent Grand Stargate Terrace (y: 200 to -200)
        { type: 'monument', x: 0, y: 0 },
        { type: 'ruinedArch', x: 0, y: 220 },
        { type: 'ruinedArch', x: 0, y: -220 },
        { type: 'crystalPillar', x: -180, y: 0 },
        { type: 'crystalPillar', x: 180, y: 0 },
        { type: 'brazier', x: -120, y: -120 },
        { type: 'brazier', x: 120, y: -120 },
        { type: 'brazier', x: -120, y: 120 },
        { type: 'brazier', x: 120, y: 120 },

        // Northern Titan Colosseum Throne Platform (y: -500 to -950)
        { type: 'ruinedArch', x: 0, y: -580 },
        { type: 'crystalPillar', x: -220, y: -750 },
        { type: 'crystalPillar', x: 220, y: -750 },
        { type: 'crystalPillar', x: -220, y: -920 },
        { type: 'crystalPillar', x: 220, y: -920 },
        { type: 'brazier', x: -100, y: -650 },
        { type: 'brazier', x: 100, y: -650 },
        { type: 'brazier', x: -100, y: -880 },
        { type: 'brazier', x: 100, y: -880 },
        { type: 'monument', x: 0, y: -940 }
      );

      npcs.push({
        id: 'npc_aurelia',
        name: 'Grand Arbiter Aurelia',
        role: 'Empyrean Titan Keeper [Click / T]',
        spriteKey: 'celestialArbiterNpc',
        x: 42,
        y: 980,
        dialogue: CELESTIAL_ASCENT_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.SOLARI_SUNKEN_VAULT) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'SUNKEN VAULT OF THE DAWN';
      if (zoneLabel) zoneLabel.innerText = 'To Golden Citadel';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'crystalPillar', x: -110, y: -40 },
        { type: 'crystalPillar', x: 110, y: -40 },
        { type: 'pillar', x: -130, y: 90 },
        { type: 'pillar', x: 130, y: 90 },
        { type: 'brazier', x: -45, y: 130 },
        { type: 'brazier', x: 45, y: 130 },
        { type: 'brazier', x: -45, y: 40 },
        { type: 'brazier', x: 45, y: 40 },
        { type: 'brazier', x: -45, y: -50 },
        { type: 'brazier', x: 45, y: -50 }
      );
      npcs.push({
        id: 'npc_lucian',
        name: 'Pyremaster Lucian',
        role: 'Sunken Vault Flamekeeper [Click / T]',
        spriteKey: 'solariFlamekeeperNpc',
        x: 36,
        y: 130,
        dialogue: SOLARI_VAULT_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.UMBRI_SHADOW_LABYRINTH) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'DUSKVEIL SHADOW LABYRINTH';
      if (zoneLabel) zoneLabel.innerText = 'To Undercity';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'pillar', x: -130, y: 80 },
        { type: 'pillar', x: 130, y: 80 },
        { type: 'pillar', x: -130, y: -80 },
        { type: 'pillar', x: 130, y: -80 },
        { type: 'brazier', x: -60, y: 140 },
        { type: 'brazier', x: 60, y: 140 },
        { type: 'brazier', x: -60, y: -40 },
        { type: 'brazier', x: 60, y: -40 }
      );
      npcs.push({
        id: 'npc_vespera',
        name: 'Wraithmother Vespera',
        role: 'Weaver of Graveglass [Click / T]',
        spriteKey: 'shadowWraithmotherNpc',
        x: -36,
        y: 130,
        dialogue: UMBRI_LABYRINTH_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'ROOTDEEP PRIMORDIAL HOLLOW';
      if (zoneLabel) zoneLabel.innerText = 'To Glimmer Orchard';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'monument', x: 0, y: -30 },
        { type: 'crystalPillar', x: -120, y: 70 },
        { type: 'crystalPillar', x: 120, y: 70 },
        { type: 'pillar', x: -140, y: -80 },
        { type: 'pillar', x: 140, y: -80 },
        { type: 'brazier', x: -50, y: 130 },
        { type: 'brazier', x: 50, y: 130 },
        { type: 'brazier', x: -50, y: 0 },
        { type: 'brazier', x: 50, y: 0 }
      );
      npcs.push({
        id: 'npc_sylvanus',
        name: 'Elder Druid Sylvanus',
        role: 'Voice of Ironbark [Click / T]',
        spriteKey: 'terraElderDruidNpc',
        x: 36,
        y: 130,
        dialogue: TERRA_GROVE_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.AETHER_FRACTURED_ARCHIVE) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'FRACTURED CHRONO-ARCHIVE';
      if (zoneLabel) zoneLabel.innerText = 'To Mirrorgate Spire';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'crystalPillar', x: -120, y: 70 },
        { type: 'crystalPillar', x: 120, y: 70 },
        { type: 'crystalPillar', x: -120, y: -70 },
        { type: 'crystalPillar', x: 120, y: -70 },
        { type: 'monument', x: 0, y: -30 },
        { type: 'brazier', x: -55, y: 135 },
        { type: 'brazier', x: 55, y: 135 }
      );
      npcs.push({
        id: 'npc_zephyr',
        name: 'Chronos Sage Zephyr',
        role: 'Chronocore Archon [Click / T]',
        spriteKey: 'aetherChronosNpc',
        x: -36,
        y: 130,
        dialogue: AETHER_ARCHIVE_DIALOGUE,
      });
    } else if (resolvedRoomType === ROOM_TYPES.STARFALL_CRATER) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'STARFALL METEORITE CRATER & ASTRAL FORGE';
      if (zoneLabel) zoneLabel.innerText = 'To Citadel';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: 56, y: 185, label: '🔨 Astral Star-Anvil [Click / E]' },
        { type: 'bountyBoard', isBountyBoard: true, x: -62, y: 185, label: '📜 Crater Bounty Board [Click / E]' },
        { type: 'campfire', x: -28, y: 205, label: '🔥 Astral Outpost Hearth' },
        { type: 'woodenSign', x: 95, y: 205, label: '🪧 N: Meteorite Impact Basin | S: Solari Citadel' },
        { type: 'mountainCrag', x: -180, y: 80 },
        { type: 'mountainCrag', x: 180, y: 80 },
        { type: 'mountainCrag', x: -210, y: -120 },
        { type: 'mountainCrag', x: 210, y: -120 },
        { type: 'crystalPillar', x: -120, y: -40 },
        { type: 'crystalPillar', x: 120, y: -40 },
        { type: 'brazier', x: -70, y: 160 },
        { type: 'brazier', x: 70, y: 160 },
        { type: 'brazier', x: -90, y: -210 },
        { type: 'brazier', x: 90, y: -210 },
        { type: 'ruinedArch', x: 0, y: -240 }
      );
      npcs.push({
        id: 'npc_orion',
        name: 'Forge-Keeper Orion',
        role: 'Master Astral Smith [Click / T]',
        spriteKey: 'solariFlamekeeperNpc',
        x: 0,
        y: 185,
        dialogue: [
          {
            speaker: 'FORGE-KEEPER ORION • STARFALL CRATER',
            spriteKey: 'solariFlamekeeperNpc',
            text: 'Welcome to the Starfall Impact Basin! Celestial Starmetal and Astral Mithril veins ring the molten crater. Smelt your cosmic ingots right here on the Astral Star-Anvil!',
            actions: [
              { label: '🔨 OPEN COSMIC STAR-ANVIL', action: 'openStation_cosmic_anvil', style: 'border-color:#fb923c; color:#fde047; font-weight:bold;' },
              { label: '👋 FAREWELL', action: 'close' },
            ],
          },
        ],
      });
    } else if (resolvedRoomType === ROOM_TYPES.ABYSSAL_RIFT) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'THE ABYSSAL RIFT & PRIMEVAL SANCTUM';
      if (zoneLabel) zoneLabel.innerText = 'To Caldera';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'aetherCrucible', stationId: 'aether_crucible', x: -58, y: 235, label: '⚗️ Abyssal Crucible [Click / E]' },
        { type: 'celestialLoom', stationId: 'celestial_loom', x: 58, y: 235, label: '🧵 Voidstar Loom [Click / E]' },
        { type: 'bountyBoard', isBountyBoard: true, x: -105, y: 235, label: '📜 Rift Bounty Board [Click / E]' },
        { type: 'campfire', x: 0, y: 268, label: '🔥 Void-Warden Vigil Fire' },
        { type: 'ruinedArch', x: 0, y: 260 },
        { type: 'ruinedArch', x: 0, y: -260 },
        { type: 'crystalPillar', x: -160, y: 90 },
        { type: 'crystalPillar', x: 160, y: 90 },
        { type: 'crystalPillar', x: -180, y: -150 },
        { type: 'crystalPillar', x: 180, y: -150 },
        { type: 'monument', x: 0, y: -60 },
        { type: 'brazier', x: -85, y: 180 },
        { type: 'brazier', x: 85, y: 180 },
        { type: 'brazier', x: -110, y: -280 },
        { type: 'brazier', x: 110, y: -280 }
      );
      npcs.push({
        id: 'npc_nihilus',
        name: 'Rift-Watcher Nihilus',
        role: 'Void Singularity Warden [Click / T]',
        spriteKey: 'shadowWraithmotherNpc',
        x: 0,
        y: 235,
        dialogue: [
          {
            speaker: 'RIFT-WATCHER NIHILUS • ABYSSAL RIFT',
            spriteKey: 'shadowWraithmotherNpc',
            text: 'Beyond these fractured obsidian spires waits Xal\'Korath, the Void Architect. Harvest Celestial Gossamer and Empyrean Starleaf along the rift edge before challenging his singularity!',
            actions: [
              { label: '⚗️ OPEN ABYSSAL CRUCIBLE', action: 'openStation_aether_crucible', style: 'border-color:#c084fc; color:#f3e8ff; font-weight:bold;' },
              { label: '👋 STAND VIGIL', action: 'close' },
            ],
          },
        ],
      });
    } else if (resolvedRoomType === ROOM_TYPES.IRONWOOD_TIMBERLANDS) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'IRONWOOD TIMBERLANDS & LUMBERJACK GROVE';
      if (zoneLabel) zoneLabel.innerText = 'To Orchard';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'campfire', stationId: 'campfire_hearth', x: -55, y: 155, label: '🔥 Lumberjack Campfire Hearth [Click / E]' },
        { type: 'bountyBoard', isBountyBoard: true, x: 55, y: 155, label: '📜 Timberlands Bounty Board [Click / E]' },
        { type: 'celestialLoom', stationId: 'celestial_loom', x: -115, y: 155, label: '🧵 Green Bough Loom & Workshop [Click / E]' },
        { type: 'woodenSign', x: 0, y: 185, label: '🪧 N: Terra Orchard | E: Coral Coast | S: Ancient Treant Glade' },
        { type: 'ancientOak', x: -180, y: 80 },
        { type: 'ancientOak', x: 180, y: 80 },
        { type: 'ancientOak', x: -210, y: -120 },
        { type: 'ancientOak', x: 210, y: -120 },
        { type: 'stoneBench', x: 0, y: 125 },
        { type: 'brazier', x: -75, y: 135 },
        { type: 'brazier', x: 75, y: 135 }
      );
      npcs.push({
        id: 'npc_silas',
        name: 'Forester Silas',
        role: 'Master Woodcrafter [Click / T]',
        spriteKey: 'foresterSilasNpc',
        x: 0,
        y: 145,
        dialogue: [
          {
            speaker: 'FORESTER SILAS • IRONWOOD TIMBERLANDS',
            spriteKey: 'foresterSilasNpc',
            text: 'Welcome to the Ironwood Timberlands! Grab your axe and fell Glimmerwood, ancient Ironbark, and Duskveil willows across the grove. Bundle logs into Campfire Kits or roast fresh fish over our crackling campfire hearth!',
            actions: [
              { label: '🔥 OPEN CAMPFIRE HEARTH', action: 'openStation_campfire_hearth', style: 'border-color:#fb923c; color:#fed7aa; font-weight:bold;' },
              { label: '🧵 TIMBERCRAFT WORKSHOP', action: 'openStation_celestial_loom', style: 'border-color:#22c55e; color:#86efac; font-weight:bold;' },
              { label: '📜 TIMBER BOUNTIES', action: 'openBountyBoard', style: 'border-color:#4ade80; color:#86efac; font-weight:bold;' },
              { label: '👋 SAFE JOURNEYS', action: 'close' },
            ],
          },
        ],
      });
    } else if (resolvedRoomType === ROOM_TYPES.CORAL_COAST) {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'CORAL COAST & BRINELIGHT SHALLOWS';
      if (zoneLabel) zoneLabel.innerText = 'To Undercity';
      arenaBanner.style.display = 'none';

      props.push(
        { type: 'campfire', stationId: 'campfire_hearth', x: -60, y: 150, label: '🔥 Seaside Campfire Hearth [Click / E]' },
        { type: 'bountyBoard', isBountyBoard: true, x: 60, y: 150, label: '📜 Coastal Bounty Board [Click / E]' },
        { type: 'woodenSign', x: 0, y: 185, label: '🪧 N: Boardwalk -> Undercity | E: Fishing Pier | W: Timberlands' },
        { type: 'doorThresholdGlow', x: 185, y: 108 },
        {
          type: 'tavernBuilding',
          x: 185,
          y: 80,
          label: '⚓ Brinelight Mariner Tavern [Enter]',
          doorway: { targetRoom: ROOM_TYPES.INTERIOR_MARINER_TAVERN, x: 185, y: 108, radius: 16 },
        },
        {
          type: 'noticeBoard',
          noticeBoardId: 'coral_mariner',
          x: 146,
          y: 108,
          label: '📋 Mariner Tavern & Tide Board [Click / E]',
        },
        { type: 'ancientWell', x: -140, y: 120 },
        { type: 'streetLantern', x: -85, y: 150 },
        { type: 'streetLantern', x: 85, y: 150 },
        { type: 'crystalPillar', x: -160, y: -40 },
        { type: 'crystalPillar', x: 160, y: -40 },
        // North Boardwalk Pier & East Twilight Fishing L-Pier Lanterns
        { type: 'streetLantern', x: -42, y: -230 },
        { type: 'streetLantern', x: 52, y: -230 },
        { type: 'streetLantern', x: -42, y: -370 },
        { type: 'streetLantern', x: 52, y: -370 },
        { type: 'streetLantern', x: -42, y: -510 },
        { type: 'streetLantern', x: 52, y: -510 },
        { type: 'streetLantern', x: 116, y: -394 },
        { type: 'streetLantern', x: 184, y: -394 },
        { type: 'streetLantern', x: 228, y: -368 },
        // Shoreline Cattail Reeds & Driftwood
        { type: 'cattailReed', x: -210, y: -312 },
        { type: 'cattailReed', x: -110, y: -318 },
        { type: 'cattailReed', x: 120, y: -318 },
        { type: 'cattailReed', x: 230, y: -310 },
        { type: 'cattailReed', x: 352, y: -160 },
        { type: 'cattailReed', x: 352, y: -40 }
      );
      npcs.push({
        id: 'npc_finn',
        name: 'Angler Finn',
        role: 'Master Cosmic Angler [Click / T]',
        spriteKey: 'anglerFinnNpc',
        x: 0,
        y: 145,
        dialogue: [
          {
            speaker: 'ANGLER FINN • CORAL COAST',
            spriteKey: 'anglerFinnNpc',
            text: 'Cast your line into these shimmering tidal currents! From silvery Glimmer Minnows to radiant Solar Trout and Prismatic Reef Salmon, the ocean provides for patient souls. Roast your catch right here at our seaside hearth!',
            actions: [
              { label: '🔥 OPEN SEASIDE HEARTH', action: 'openStation_campfire_hearth', style: 'border-color:#38bdf8; color:#bae6fd; font-weight:bold;' },
              { label: '📜 COASTAL BOUNTIES', action: 'openBountyBoard', style: 'border-color:#06b6d4; color:#a5f3fc; font-weight:bold;' },
              { label: '👋 FAIR WINDS', action: 'close' },
            ],
          },
        ],
      });
    } else {
      if (zoneTitle) zoneTitle.innerText = roomTitleOverride || cfg.shortTitle || 'NEXUS WARZONE';
      if (zoneLabel) zoneLabel.innerText = 'To Sanctuary';
      arenaBanner.style.display = 'none';

      if (resolvedRoomType === ROOM_TYPES.NEXUS_WARZONE) {
        // Decorate the massive 4800x3600 Open World Continent
        // 1. South Sanctuary Vale (Meadows, Campfires, Ancient Oaks, River Bridges)
        props.push(
          { type: 'campfire', x: 0, y: 1490 },
          { type: 'campfire', x: 130, y: 1380 },
          { type: 'ancientOak', x: -160, y: 1520 },
          { type: 'ancientOak', x: 160, y: 1520 },
          { type: 'ancientOak', x: -260, y: 1380 },
          { type: 'ancientOak', x: 260, y: 1380 },
          { type: 'ancientOak', x: -100, y: 1620 },
          { type: 'ancientOak', x: 100, y: 1620 },
          // River Bridge Torches
          { type: 'brazier', x: -38, y: 1220 },
          { type: 'brazier', x: 38, y: 1220 },
          { type: 'brazier', x: -38, y: 1270 },
          { type: 'brazier', x: 38, y: 1270 }
        );

        // 2. Whispering Mountain Pass (Pines, Granite Crags, Waystation Campfires)
        props.push(
          { type: 'campfire', x: -45, y: 740 },
          { type: 'campfire', x: 50, y: 490 },
          // Evergreen Pines along the Pass
          { type: 'pineTree', x: -85, y: 1020 },
          { type: 'pineTree', x: 85, y: 1020 },
          { type: 'pineTree', x: -95, y: 860 },
          { type: 'pineTree', x: 95, y: 860 },
          { type: 'pineTree', x: -80, y: 690 },
          { type: 'pineTree', x: 100, y: 700 },
          { type: 'pineTree', x: -85, y: 530 },
          { type: 'pineTree', x: 90, y: 530 },
          { type: 'pineTree', x: -90, y: 400 },
          { type: 'pineTree', x: 85, y: 400 },
          // Granite Boulders & Crags
          { type: 'mountainCrag', x: -135, y: 960 },
          { type: 'mountainCrag', x: 140, y: 960 },
          { type: 'mountainCrag', x: -150, y: 780 },
          { type: 'mountainCrag', x: 155, y: 780 },
          { type: 'mountainCrag', x: -160, y: 590 },
          { type: 'mountainCrag', x: 165, y: 590 },
          { type: 'mountainCrag', x: -140, y: 440 },
          { type: 'mountainCrag', x: 145, y: 440 }
        );

        // 3. Central Caldera Bastion (Arches, Braziers, Obelisks)
        props.push(
          { type: 'ruinedArch', x: 0, y: 260 },
          { type: 'ruinedArch', x: 0, y: -260 },
          { type: 'ruinedArch', x: -260, y: 0 },
          { type: 'ruinedArch', x: 260, y: 0 },
          { type: 'brazier', x: -90, y: 90 },
          { type: 'brazier', x: 90, y: 90 },
          { type: 'brazier', x: -90, y: -90 },
          { type: 'brazier', x: 90, y: -90 },
          { type: 'pillar', x: -140, y: 0 },
          { type: 'pillar', x: 140, y: 0 }
        );

        // 4. North Forgotten Ruins Plateau (Ruined Arches, Ancient Monuments, Stone Pillars & Ascension Gateway)
        props.push(
          { type: 'ruinedArch', x: 0, y: -520 },
          { type: 'ruinedArch', x: 0, y: -960 },
          { type: 'ruinedArch', x: 0, y: -1380 },
          { type: 'ruinedArch', x: 0, y: -1580 },
          { type: 'ruinedArch', x: 0, y: -1760 },
          { type: 'monument', x: 0, y: -740 },
          { type: 'monument', x: -110, y: -1150 },
          { type: 'monument', x: 110, y: -1150 },
          { type: 'pillar', x: -75, y: -620 },
          { type: 'pillar', x: 75, y: -620 },
          { type: 'pillar', x: -75, y: -860 },
          { type: 'pillar', x: 75, y: -860 },
          { type: 'pillar', x: -75, y: -1250 },
          { type: 'pillar', x: 75, y: -1250 },
          { type: 'crystalPillar', x: -80, y: -1580 },
          { type: 'crystalPillar', x: 80, y: -1580 },
          { type: 'crystalPillar', x: -80, y: -1750 },
          { type: 'crystalPillar', x: 80, y: -1750 },
          { type: 'brazier', x: -48, y: -1680 },
          { type: 'brazier', x: 48, y: -1680 },
          { type: 'brazier', x: -48, y: -1760 },
          { type: 'brazier', x: 48, y: -1760 }
        );

        // 5. Regional Wilderness Features
        // NW Terra Ironwood Wilds
        props.push(
          { type: 'ancientOak', x: -650, y: -450 },
          { type: 'ancientOak', x: -900, y: -480 },
          { type: 'ancientOak', x: -1150, y: -680 },
          { type: 'pineTree', x: -780, y: -720 },
          { type: 'pineTree', x: -1020, y: -880 }
        );
        // NE Umbri Shadow Fens
        props.push(
          { type: 'monument', x: 880, y: -450 },
          { type: 'brazier', x: 700, y: -550 },
          { type: 'brazier', x: 1050, y: -750 },
          { type: 'pillar', x: 920, y: -820 }
        );
        // SW Solari Sun-Canyon
        props.push(
          { type: 'mountainCrag', x: -720, y: 420 },
          { type: 'mountainCrag', x: -1050, y: 620 },
          { type: 'brazier', x: -880, y: 480 },
          { type: 'monument', x: -920, y: 820 }
        );
        // SE Aether Astral Plateau
        props.push(
          { type: 'crystalPillar', x: 720, y: 420 },
          { type: 'crystalPillar', x: 1050, y: 620 },
          { type: 'crystalPillar', x: -880, y: 480 },
          { type: 'monument', x: 920, y: 820 }
        );

        npcs.push({
          id: 'npc_archon',
          name: 'Commander Valerius',
          role: 'Sunspire Warlord [Click / T]',
          spriteKey: 'warzoneArchonNpc',
          x: -36,
          y: 1420, // Waystation in South Sanctuary Vale
          dialogue: WARZONE_DIALOGUE,
        });
        props.push({ type: 'bountyBoard', isBountyBoard: true, x: -92, y: 1420, label: '📜 Caldera Bounty Board [Click / E]' });
      } else {
        [[-90, 95], [90, 95], [-145, -20], [145, -20], [-75, -135], [75, -135]].forEach(([pxX, pxY], idx) => {
          props.push({ type: idx % 2 === 0 ? 'pillar' : 'brazier', x: pxX, y: pxY });
        });
      }

      if (resolvedRoomType === ROOM_TYPES.SOLARI_CITADEL) {
        props.push(
          { type: 'cosmicAnvil', stationId: 'cosmic_anvil', x: -200, y: 40, label: '🔨 Citadel Star-Anvil [Click / E]' },
          { type: 'marketStallSmith', id: 'stall_smith', x: -145, y: 40, label: '⚒️ Sunforged Weaponry Stall' },
          { type: 'bountyBoard', isBountyBoard: true, x: 95, y: 115, label: '📜 Citadel Bounty Board [Click / E]' },
          { type: 'campfire', x: -85, y: 125, label: '🔥 Sunspire Brazier Hearth' },
          { type: 'woodenSign', x: 38, y: 128, label: '🪧 W: Smithy & Quarry | E: Citadel Bank | S: Starfall Crater' },
          { type: 'solariSundial', x: 0, y: -70 },
          { type: 'flowerBed', x: -105, y: -50 },
          { type: 'flowerBed', x: 105, y: -50 },
          { type: 'flowerBed', x: -105, y: 15 },
          { type: 'flowerBed', x: 105, y: 15 },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Solari Citadel Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'heraldPostbox', isPostbox: true, x: 82, y: -112, label: '📬 Solari Herald Postbox [Click / E]' },
          { type: 'grandFountain', x: 0, y: 0 },
          { type: 'doorThresholdGlow', x: -175, y: -118 },
          {
            type: 'cityHouseB',
            x: -175,
            y: -145,
            label: '⚒️ Sunforged Guild Smithy [Enter]',
            doorway: { targetRoom: ROOM_TYPES.INTERIOR_SOLARI_SMITHY, x: -175, y: -118, radius: 15 },
          },
          { type: 'cityHouseA', x: -85, y: -155 },
          { type: 'cityHouseB', x: 85, y: -155 },
          { type: 'mountainCrag', x: -340, y: -110 },
          { type: 'mountainCrag', x: 340, y: -110 },
          { type: 'streetLantern', x: -58, y: 80 },
          { type: 'streetLantern', x: 58, y: 80 },
          { type: 'streetLantern', x: -58, y: -60 },
          { type: 'streetLantern', x: 58, y: -60 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 },
          { type: 'blossomTree', x: -125, y: -85 },
          { type: 'blossomTree', x: 125, y: -85 },
          {
            type: 'ruinedArch',
            x: 0,
            y: -260,
            label: '🏛️ Sunken Vault Crypt Archway [Enter / E]',
            doorway: { targetRoom: ROOM_TYPES.SOLARI_SUNKEN_VAULT, x: 0, y: -250, radius: 22 },
          }
        );
        npcs.push(
          {
            id: 'merchant_smith',
            name: 'Blacksmith Torvin',
            role: 'Sunforged Armorer [Click / T]',
            spriteKey: 'merchantSmithNpc',
            stallId: 'stall_smith',
            merchantType: 'merchant_smith',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_solari_bank',
            name: 'Solari Vault-Master',
            role: 'Citadel Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_vael',
            name: 'Captain Vaelen',
            role: 'Lantern District Templar [Click / T]',
            spriteKey: 'solariCaptainNpc',
            x: -38,
            y: 125,
            dialogue: SOLARI_CITADEL_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.UMBRI_UNDERCITY) {
        props.push(
          { type: 'celestialLoom', stationId: 'celestial_loom', x: -200, y: 40, label: '🧵 Undercity Shadow Loom [Click / E]' },
          { type: 'marketStallTailor', id: 'stall_tailor', x: -145, y: 40, label: '🕸️ Duskveil Silk Stall' },
          { type: 'bountyBoard', isBountyBoard: true, x: -95, y: 115, label: '📜 Undercity Bounty Board [Click / E]' },
          { type: 'campfire', x: 0, y: 78, label: '🔥 Duskveil Smuggler Hearth' },
          { type: 'woodenSign', x: -38, y: 128, label: '🪧 W: Shadow Loom | E: Undercity Vault | N: Shadow Labyrinth' },
          { type: 'umbriBrazierAltar', x: -90, y: -50 },
          { type: 'umbriBrazierAltar', x: 90, y: -50 },
          { type: 'umbriBrazierAltar', x: -60, y: 110 },
          { type: 'umbriBrazierAltar', x: 60, y: 110 },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Umbri Shadow Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'doorThresholdGlow', x: -175, y: -118 },
          {
            type: 'cityHouseA',
            x: -175,
            y: -145,
            label: '🕸️ Velvet Veil Parlor [Enter]',
            doorway: { targetRoom: ROOM_TYPES.INTERIOR_UMBRI_PARLOR, x: -175, y: -118, radius: 15 },
          },
          { type: 'cityHouseB', x: 0, y: -155 },
          { type: 'pillar', x: -140, y: 0 },
          { type: 'pillar', x: 140, y: 0 },
          { type: 'streetLantern', x: -52, y: 75 },
          { type: 'streetLantern', x: 52, y: 75 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 },
          { type: 'heraldPostbox', isPostbox: true, x: 82, y: -112, label: '📬 Umbri Herald Postbox [Click / E]' },
          {
            type: 'ruinedArch',
            x: 0,
            y: -240,
            label: '🌑 Duskveil Shadow Labyrinth Crypt [Enter / E]',
            doorway: { targetRoom: ROOM_TYPES.UMBRI_SHADOW_LABYRINTH, x: 0, y: -230, radius: 22 },
          }
        );
        npcs.push(
          {
            id: 'merchant_tailor',
            name: 'Shadow Stitcher Silvan',
            role: 'Glimmerweaving & Silks [Click / T]',
            spriteKey: 'shadowBrokerNpc',
            stallId: 'stall_tailor',
            merchantType: 'merchant_tailor',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_umbri_bank',
            name: 'Undercity Vault-Keeper',
            role: 'Duskveil Vault Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_nyx',
            name: 'Shadow Broker Nyx',
            role: 'Duskveil Smuggler [Click / T]',
            spriteKey: 'shadowBrokerNpc',
            x: 42,
            y: 125,
            dialogue: UMBRI_UNDERCITY_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.TERRA_ORCHARD) {
        props.push(
          { type: 'aetherCrucible', stationId: 'aether_crucible', x: -200, y: 40, label: '⚗️ Orchard Herbal Crucible [Click / E]' },
          { type: 'marketStallPotions', id: 'stall_potions', x: -145, y: 40, label: '🌿 Rootdeep Apothecary Stall' },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Rootdeep Grove Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'heraldPostbox', isPostbox: true, x: 72, y: -112, label: '📬 Terra Herald Postbox [Click / E]' },
          { type: 'bountyBoard', isBountyBoard: true, x: 95, y: 115, label: '📜 Orchard Bounty Board [Click / E]' },
          { type: 'campfire', x: -85, y: 125, label: '🔥 Druid Circle Hearth' },
          { type: 'woodenSign', x: 38, y: 128, label: '🪧 W: Apothecary & Crucible | E: Orchard Bank & Spring' },
          { type: 'terraMenhir', x: 0, y: -80 },
          { type: 'ancientWell', x: 155, y: 45 },
          { type: 'doorThresholdGlow', x: -175, y: -118 },
          {
            type: 'cityHouseA',
            x: -175,
            y: -145,
            label: '🌿 Rootdeep Apothecary House [Enter]',
            doorway: { targetRoom: ROOM_TYPES.INTERIOR_TERRA_APOTHECARY, x: -175, y: -118, radius: 15 },
          },
          {
            type: 'noticeBoard',
            noticeBoardId: 'terra_apothecary',
            x: -214,
            y: -120,
            label: '📋 Apothecary Herbarium Board [Click / E]',
          },
          { type: 'terracottaUrn', x: -195, y: -118 },
          { type: 'terracottaUrn', x: -155, y: -118 },
          { type: 'fallenLog', x: -225, y: 92 },
          { type: 'cityHouseB', x: -75, y: -155 },
          { type: 'flowerBed', x: -105, y: -50 },
          { type: 'flowerBed', x: 105, y: -50 },
          { type: 'flowerBed', x: 0, y: 25 },
          { type: 'ancientOak', x: -250, y: -155 },
          { type: 'ancientOak', x: 265, y: -155 },
          { type: 'blossomTree', x: -120, y: -70 },
          { type: 'blossomTree', x: 120, y: -70 },
          { type: 'blossomTree', x: -85, y: 155 },
          { type: 'blossomTree', x: 85, y: 155 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 },
          {
            type: 'ruinedArch',
            x: -240,
            y: 0,
            label: '🌿 Rootdeep Primordial Hollow Crypt [Enter / E]',
            doorway: { targetRoom: ROOM_TYPES.TERRA_OVERGROWTH_SANCTUARY, x: -230, y: 0, radius: 22 },
          }
        );
        npcs.push(
          {
            id: 'merchant_apothecary',
            name: 'Alchemist Faye',
            role: 'Rootdeep Apothecary [Click / T]',
            spriteKey: 'merchantApothecaryNpc',
            stallId: 'stall_potions',
            merchantType: 'merchant_apothecary',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_terra_bank',
            name: 'Orchard Vault-Keeper',
            role: 'Rootdeep Grove Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_rowan',
            name: 'Grove Tender Rowan',
            role: 'Rootdeep Herbalist [Click / T]',
            spriteKey: 'terraHerbalistNpc',
            x: -38,
            y: 125,
            dialogue: TERRA_ORCHARD_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.AETHER_SPIRE) {
        props.push(
          { type: 'aetherArmillary', x: 0, y: -80 },
          { type: 'marketStallRelics', id: 'stall_relics', x: -145, y: 40, label: '🔮 Mirrorgate Relic Stall' },
          { type: 'aetherCrucible', stationId: 'aether_crucible', x: -200, y: 40, label: '⚗️ Mirrorgate Transmuter [Click / E]' },
          { type: 'bankBuilding', x: 185, y: -135, label: '🏛️ Mirrorgate Astral Depository' },
          { type: 'bankCounter', x: 185, y: -90 },
          { type: 'heraldPostbox', isPostbox: true, x: 72, y: -96, label: '📬 Aether Herald Postbox [Click / E]' },
          { type: 'bountyBoard', isBountyBoard: true, x: -95, y: 115, label: '📜 Mirrorgate Bounty Board [Click / E]' },
          { type: 'campfire', x: 0, y: 78, label: '🔥 Starlight Conduit Hearth' },
          { type: 'woodenSign', x: -38, y: 128, label: '🪧 W: Relic Stall & Transmuter | E: Astral Vault' },
          { type: 'doorThresholdGlow', x: -175, y: -118 },
          {
            type: 'cityHouseB',
            x: -175,
            y: -145,
            label: '🔭 Astral Observatory [Enter]',
            doorway: { targetRoom: ROOM_TYPES.INTERIOR_AETHER_OBSERVATORY, x: -175, y: -118, radius: 15 },
          },
          { type: 'cityHouseA', x: 85, y: -155 },
          { type: 'crystalPillar', x: -130, y: 90 },
          { type: 'crystalPillar', x: 130, y: 90 },
          { type: 'crystalPillar', x: -130, y: -90 },
          { type: 'crystalPillar', x: 130, y: -90 },
          { type: 'flowerBed', x: -105, y: -50 },
          { type: 'flowerBed', x: 105, y: -50 },
          { type: 'streetLantern', x: -58, y: 75 },
          { type: 'streetLantern', x: 58, y: 75 },
          { type: 'stoneBench', x: -38, y: -12 },
          { type: 'stoneBench', x: 38, y: -12 },
          {
            type: 'ruinedArch',
            x: 240,
            y: 0,
            label: '⏳ Fractured Chrono-Archive Crypt [Enter / E]',
            doorway: { targetRoom: ROOM_TYPES.AETHER_FRACTURED_ARCHIVE, x: 230, y: 0, radius: 22 },
          }
        );
        npcs.push(
          {
            id: 'merchant_relics',
            name: 'Relic-Seeker Moira',
            role: 'Mirrorgate Curio Merchant [Click / T]',
            spriteKey: 'merchantRelicsNpc',
            stallId: 'stall_relics',
            merchantType: 'merchant_relics',
            isMerchant: true,
            x: -145,
            y: 75,
          },
          {
            id: 'npc_aether_bank',
            name: 'Mirrorgate Vault-Keeper',
            role: 'Astral Spire Banker [Click / T]',
            spriteKey: 'bankerNpc',
            x: 185,
            y: -90,
            isBank: true,
          },
          {
            id: 'npc_kaelen',
            name: 'Astromancer Kaelen',
            role: 'Mirrorgate Stargazer [Click / T]',
            spriteKey: 'aetherAstromancerNpc',
            x: 42,
            y: 125,
            dialogue: AETHER_SPIRE_DIALOGUE,
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.SUNKEN_OASIS) {
        props.push(
          { type: 'fountain', x: 0, y: 55, label: '💧 Heart of the Whispering Springs' },
          { type: 'campfire', x: 0, y: 125, label: '🔥 Oasis Traveler Hearth' },
          { type: 'woodenSign', x: -45, y: 155, label: '🪧 W: Glimmer Orchard | N: Coral Coast | S: Starlight Grove' },
          { type: 'bountyBoard', isBountyBoard: true, x: 75, y: 145, label: '📜 Oasis Expedition Board [Click / E]' },
          { type: 'fishermanNetRack', x: 52, y: 86, label: '🦀 Oasis Mariner Net & Crab Trap [Click / E]' },
          { type: 'wishingShrine', x: -58, y: 86, label: '🌟 Mirage Wishing Shrine [Click / E]' },
          { type: 'terraAltar', stationId: 'terra_altar', x: -125, y: 145, label: '🌿 Oasis Botanical Loom [Click / E]' },
          { type: 'flowerBed', x: -85, y: 75 },
          { type: 'flowerBed', x: 85, y: 75 },
          { type: 'flowerBed', x: -135, y: -35 },
          { type: 'flowerBed', x: 135, y: -35 },
          { type: 'crystalPillar', x: -165, y: 95 },
          { type: 'crystalPillar', x: 165, y: 95 },
          { type: 'stoneBench', x: -42, y: 55 },
          { type: 'stoneBench', x: 42, y: 55 },
          { type: 'streetLantern', x: -65, y: 125 },
          { type: 'streetLantern', x: 65, y: 125 },
          {
            type: 'cavernEntrance',
            x: 340,
            y: 120,
            label: '🕳️ CrystalEcho Caverns Mouth [Enter / E]',
            doorway: { targetRoom: ROOM_TYPES.LUMINOUS_CAVERN, x: 340, y: 120, radius: 22 },
          }
        );
      } else if (resolvedRoomType === ROOM_TYPES.SOLAR_HIGHLANDS) {
        props.push(
          { type: 'solariSundial', x: 0, y: 65, label: '☀️ Sunspire Zenith Sundial' },
          { type: 'campfire', x: 0, y: 130, label: '🔥 Highland Expedition Brazier' },
          { type: 'woodenSign', x: -45, y: 158, label: '🪧 N: Golden Citadel | W: Starfall Crater | E: Primordial Hollow' },
          { type: 'bountyBoard', isBountyBoard: true, x: 80, y: 148, label: '📜 Sunspire Vanguard Board [Click / E]' },
          { type: 'solariAnvil', stationId: 'solari_forge', x: -125, y: 148, label: '⚒️ Sunspire Crag Forge [Click / E]' },
          { type: 'solariBanner', x: -95, y: 85 },
          { type: 'solariBanner', x: 95, y: 85 },
          { type: 'crystalPillar', x: -165, y: -55 },
          { type: 'crystalPillar', x: 165, y: -55 },
          { type: 'flowerBed', x: -90, y: 135 },
          { type: 'flowerBed', x: 90, y: 135 },
          { type: 'streetLantern', x: -60, y: 125 },
          { type: 'streetLantern', x: 60, y: 125 }
        );
      } else if (resolvedRoomType === ROOM_TYPES.MOONWELL_SANCTUM) {
        if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'SILVERMIST MOONWELL';
        if (zoneLabel) zoneLabel.innerText = 'Silvermist Moonwell';
        arenaBanner.style.display = 'none';
        props.push(
          { type: 'grandFountain', x: 0, y: 55, label: '🌙 Heart of the Silvermist Moonwell' },
          { type: 'campfire', x: 0, y: 132, label: '🔥 Druid Circle Hearth' },
          { type: 'woodenSign', x: -45, y: 160, label: '🪧 N: Starlight Grove | W: Sunspire Highlands | E: Coral Coast' },
          { type: 'bountyBoard', isBountyBoard: true, x: 78, y: 148, label: '📜 Moonwell Sanctum Board [Click / E]' },
          { type: 'terraAltar', stationId: 'terra_altar', x: -128, y: 148, label: '🌿 Silvermist Botanical Loom [Click / E]' },
          { type: 'stoneBench', x: -46, y: 55 },
          { type: 'stoneBench', x: 46, y: 55 },
          { type: 'flowerBed', x: -85, y: 95 },
          { type: 'flowerBed', x: 85, y: 95 },
          { type: 'flowerBed', x: -125, y: -35 },
          { type: 'flowerBed', x: 125, y: -35 },
          { type: 'crystalPillar', x: -165, y: -75 },
          { type: 'crystalPillar', x: 165, y: -75 },
          { type: 'treasureCoffer', x: -195, y: -145, label: '💰 Hidden Moonwell Treasure Coffer [Click / E]' },
          { type: 'streetLantern', x: -62, y: 128 },
          { type: 'streetLantern', x: 62, y: 128 }
        );
      } else if (resolvedRoomType === ROOM_TYPES.LUMINOUS_CAVERN) {
        if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'CRYSTALECHO CAVERNS';
        if (zoneLabel) zoneLabel.innerText = 'CrystalEcho Caverns';
        arenaBanner.style.display = 'none';
        props.push(
          {
            type: 'cavernEntrance',
            x: 0,
            y: 225,
            label: '🚪 Surface Steps to Sanctuary Haven [Enter / E]',
            exitDoor: { roomType: ROOM_TYPES.SANCTUARY_HUB, x: -245, y: 235, dir: 'up' },
          },
          { type: 'campfire', stationId: 'campfire_hearth', x: -55, y: 155, label: '🔥 Subterranean Explorer Hearth [Click / E]' },
          { type: 'bountyBoard', isBountyBoard: true, x: 55, y: 155, label: '📜 Cavern Expedition Board [Click / E]' },
          { type: 'mysteryPeddlerCart', x: 112, y: 175, label: '🔮 Subterranean Mystery Peddler Cart [Click / E]' },
          { type: 'treasureCoffer', x: -210, y: -210, label: '💰 Deep Grotto Treasure Coffer [Click / E]' },
          { type: 'treasureCoffer', x: 210, y: -210, label: '💰 Echo Sanctum Treasure Coffer [Click / E]' },
          { type: 'woodenSign', x: 0, y: 175, label: '🪧 W: Sunken Oasis | S: Sanctuary Haven | N: Echo Warden Sanctum' },
          { type: 'runicObelisk', x: 0, y: -95, label: '🔮 Subterranean Echo Obelisk [Click / E]' },
          { type: 'arcaneTelescope', x: -85, y: 135, label: '🔭 Subterranean Prism Scope [Click / E]' },
          { type: 'supplyCrate', x: 92, y: 145, label: '📦 Delver Supply Cache [Click / E]' },
          { type: 'supplyCrate', x: -92, y: -15, label: '📦 Miner Supply Cache [Click / E]' },
          { type: 'crystalGeode', x: -145, y: 85, label: '💎 Bioluminescent Crystal Geode [Click / E]' },
          { type: 'crystalGeode', x: 145, y: 85, label: '💎 Bioluminescent Crystal Geode [Click / E]' },
          { type: 'crystalGeode', x: -165, y: -115, label: '💎 Bioluminescent Crystal Geode [Click / E]' },
          { type: 'crystalGeode', x: 165, y: -115, label: '💎 Bioluminescent Crystal Geode [Click / E]' },
          { type: 'crystalPillar', x: -125, y: -15 },
          { type: 'crystalPillar', x: 125, y: -15 },
          { type: 'crystalPillar', x: -125, y: -185 },
          { type: 'crystalPillar', x: 125, y: -185 },
          { type: 'brazier', x: -45, y: 195 },
          { type: 'brazier', x: 45, y: 195 }
        );
        npcs.push({
          id: 'npc_delver_korin',
          name: 'Explorer Korin',
          role: 'CrystalEcho Geologist [Click / T]',
          spriteKey: 'cartographerNpc',
          x: 0,
          y: 148,
          dialogue: [
            {
              speaker: 'EXPLORER KORIN • CRYSTALECHO CAVERNS',
              spriteKey: 'cartographerNpc',
              text: 'Behold the CrystalEcho Caverns! Beneath Sanctuary Haven and the Sunken Oasis runs a network of bioluminescent geodes, underground trout streams, and rich Copper, Star-Iron, and Mithril seams.\n\nTap the glowing Crystal Geodes, rummage our Delver Supply Caches, or roast your subterranean catch over the Explorer Hearth!',
            actions: [
              { label: '🔥 OPEN EXPLORER HEARTH', action: 'openStation_campfire_hearth', style: 'border-color:#fb923c; color:#fed7aa; font-weight:bold;' },
              { label: '📜 CAVERN BOUNTIES', action: 'openBountyBoard', style: 'border-color:#38bdf8; color:#bae6fd; font-weight:bold;' },
              { label: '👋 HAPPY DELVING', action: 'close' },
            ],
          },
        ],
      });
      } else if (resolvedRoomType === ROOM_TYPES.FROSTSPIRE_GLACIER) {
        if (zoneTitle) zoneTitle.innerText = roomTitleOverride || 'FROSTSPIRE GLACIER';
        if (zoneLabel) zoneLabel.innerText = 'Frostspire Glacier';
        arenaBanner.style.display = 'none';
        props.push(
          { type: 'auroraCrystalObelisk', x: -58, y: -18, label: '🔮 Aurora Resonance Obelisk [Click / E]' },
          { type: 'auroraCrystalObelisk', x: 58, y: -18, label: '🔮 Aurora Resonance Obelisk [Click / E]' },
          { type: 'glacialSupplySled', x: -86, y: 150, label: '🛷 Frostspire Expedition Supply Sled [Click / E]' },
          { type: 'glacialSupplySled', x: 96, y: 148, label: '🛷 Alpine Quartermaster Sled [Click / E]' },
          { type: 'campfire', stationId: 'campfire_hearth', x: 0, y: 148, label: '🔥 Glacier Basecamp Hearth [Click / E]' },
          { type: 'tcgDuelTable', x: 56, y: 162, label: '🃏 Alpine Camp 1v1 TCG Table [Click / E]' },
          { type: 'bountyBoard', isBountyBoard: true, x: -56, y: 162, label: '📜 Frostspire Expedition Ledger [Click / E]' },
          { type: 'ancientSundialClock', x: 0, y: 176, label: '⏳ Frostspire Meridian Dial [Click / E]' },
          { type: 'woodenSign', x: 0, y: 215, label: '🪧 N: Silvermist Moonwell | W: Sunspire Highlands | E: CrystalEcho Caverns' },
          { type: 'treasureCoffer', x: -230, y: -220, label: '💰 Borealis Frozen Treasure Coffer [Click / E]' },
          { type: 'treasureCoffer', x: 230, y: -220, label: '💰 Frostfang Summit Coffer [Click / E]' },
          { type: 'crystalGeode', x: -175, y: 65, label: '💎 Glaciated Prism Geode [Click / E]' },
          { type: 'crystalGeode', x: 175, y: 65, label: '💎 Glaciated Prism Geode [Click / E]' },
          { type: 'crystalPillar', x: -135, y: -135 },
          { type: 'crystalPillar', x: 135, y: -135 },
          { type: 'pineTree', x: -250, y: -45 },
          { type: 'pineTree', x: 250, y: -45 },
          { type: 'pineTree', x: -245, y: 145 },
          { type: 'pineTree', x: 245, y: 145 },
          { type: 'mountainCrag', x: -265, y: -175 },
          { type: 'mountainCrag', x: 265, y: -175 },
          { type: 'brazier', x: -44, y: 192 },
          { type: 'brazier', x: 44, y: 192 },
          {
            type: 'cavernEntrance',
            x: 340,
            y: 120,
            label: '🕳️ CrystalEcho Caverns Alpine Mouth [Enter / E]',
            doorway: { targetRoom: ROOM_TYPES.LUMINOUS_CAVERN, x: 340, y: 120, radius: 22 },
          }
        );
        npcs.push(
          {
            id: 'npc_frost_glaciologist_vael',
            name: 'Glaciologist Vael',
            role: 'Aurora Expedition Lead [Click / T]',
            spriteKey: 'cartographerNpc',
            x: -24,
            y: 134,
            dialogue: [
              {
                speaker: 'GLACIOLOGIST VAEL • FROSTSPIRE GLACIER',
                spriteKey: 'cartographerNpc',
                text: 'Welcome to Frostspire Glacier — GlimmerFall\'s highest alpine frontier! Four Mithril seams, ice-melt fishing pools, and a Thermal Healing Spring sustain our camp against the mountain chill.\n\nAlign with the glowing Aurora Crystal Obelisks for a 90s Frostward Blessing, search our frosted Expedition Supply Sleds, or steel yourself for Borealis to the north!',
                actions: [
                  { label: '🔥 OPEN BASECAMP HEARTH', action: 'openStation_campfire_hearth', style: 'border-color:#fb923c; color:#fed7aa; font-weight:bold;' },
                  { label: '📜 FROSTSPIRE BOUNTIES', action: 'openBountyBoard', style: 'border-color:#38bdf8; color:#bae6fd; font-weight:bold;' },
                  { label: '❄️ STAY FROSTY', action: 'close' },
                ],
              },
            ],
          },
          {
            id: 'npc_frost_skald_thrym',
            name: 'Skald Thrym',
            role: 'Winterhold TCG Challenger [Click / T]',
            spriteKey: 'bardNpc',
            x: 36,
            y: 138,
            dialogue: [
              {
                speaker: 'SKALD THRYM • ALPINE TCG CAMP',
                spriteKey: 'bardNpc',
                text: 'Even above the clouds, nothing warms a traveler\'s blood faster than a razor-sharp 1v1 GlimmerFall TCG duel by the campfire! Pull up a chair at our alpine velvet table whenever you want a match.',
                actions: [
                  { label: '🃏 CHALLENGE SKALD THRYM TO 1V1 TCG', action: 'openTcgDuel', style: 'border-color:#facc15; color:#fde047; font-weight:bold;' },
                  { label: '👋 ANOTHER TIME', action: 'close' },
                ],
              },
            ],
          },
          {
            id: 'npc_echo_keeper_rime',
            name: 'Echo Keeper Rime',
            role: 'Frostspire Echo Whisperer [Click / T]',
            spriteKey: 'heraldNpc',
            x: 92,
            y: 120,
            dialogue: [
              {
                speaker: 'ECHO KEEPER RIME • FROSTSPIRE GLACIER',
                spriteKey: 'heraldNpc',
                text: 'Up on these glacial ridges, Stray Crystal-Prism Echoes drift on the CrystalEcho Convergence! Approach gently with a Chrono Harmonic Cipher and press [E] to soothe them for rare Starlight & Prismatic variants!',
                actions: [
                  { label: '🏗️ INSPECT FAMILIAR MOVES & AURAS', action: 'openEcho_library', style: 'border-color:#4ade80; color:#dcfce7; font-weight:bold;' },
                  { label: '⚗️ OPEN HARMONIC EXTRACTOR', action: 'openEcho_extractor', style: 'border-color:#38bdf8; color:#e0f2fe;' },
                  { label: '👋 ANOTHER TIME', action: 'close' },
                ],
              },
            ],
          }
        );
      }
    }
  }


  return {
    showZoneEntryCard,
    setupZoneDecor,
  };
}
