// ==========================================
// GlimmerFall Online 2D — 15-Minute Dynamic World Events Engine
// Deterministic realm-wide events rotating across zones to concentrate player activity
// ==========================================

import { ROOM_TYPES } from './protocol/rooms.js';

export const WORLD_EVENT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export const DYNAMIC_WORLD_EVENTS = [
  {
    id: 'starfall_meteor_shower',
    title: '☄️ STARFALL METEOR SHOWER',
    shortTitle: '☄️ Meteor Shower',
    subtitle: ' Fallen star-iron charges the crags! +35% Mining & Extraction XP + Bonus Glimmer Shards',
    color: '#facc15',
    borderColor: '#eab308',
    rooms: [
      ROOM_TYPES.SOLAR_HIGHLANDS,
      ROOM_TYPES.SANCTUARY_HUB,
      ROOM_TYPES.STARFALL_CRATER,
    ],
    primaryRoom: ROOM_TYPES.SOLAR_HIGHLANDS,
    primaryRoomLabel: 'Sunspire Highlands',
    bonuses: {
      gatheringXpMult: 1.35,
      combatXpMult: 1.15,
      goldMult: 1.2,
      bonusItem: 'glimmer_shard',
    },
  },
  {
    id: 'brinelight_leviathan_surge',
    title: '🌊 BRINELIGHT TIDAL SURGE',
    shortTitle: '🌊 Tidal Surge',
    subtitle: 'Shoals of Golden Koi & Reef Guardians surface! +35% Fishing & Cooking XP on the Coast',
    color: '#38bdf8',
    borderColor: '#0284c7',
    rooms: [
      ROOM_TYPES.CORAL_COAST,
      ROOM_TYPES.SUNKEN_OASIS,
    ],
    primaryRoom: ROOM_TYPES.CORAL_COAST,
    primaryRoomLabel: 'Coral Coast',
    bonuses: {
      gatheringXpMult: 1.35,
      combatXpMult: 1.2,
      goldMult: 1.15,
      bonusItem: 'raw_golden_koi',
    },
  },
  {
    id: 'crystalecho_harmonic_convergence',
    title: '💎 CRYSTALECHO HARMONIC CONVERGENCE',
    shortTitle: '💎 Crystal Harmonic',
    subtitle: 'Subterranean leylines sing! +35% Rites & Flashes XP + +25% Combat XP in Caverns & Moonwell',
    color: '#e879f9',
    borderColor: '#c084fc',
    rooms: [
      ROOM_TYPES.LUMINOUS_CAVERN,
      ROOM_TYPES.MOONWELL_SANCTUM,
      ROOM_TYPES.AETHER_SPIRE,
    ],
    primaryRoom: ROOM_TYPES.LUMINOUS_CAVERN,
    primaryRoomLabel: 'CrystalEcho Caverns',
    bonuses: {
      gatheringXpMult: 1.25,
      combatXpMult: 1.35,
      goldMult: 1.25,
      bonusItem: 'astral_mineral_dust',
    },
  },
  {
    id: 'void_rift_incursion',
    title: '🌑 VOID RIFT INCURSION',
    shortTitle: '🌑 Void Incursion',
    subtitle: 'Abyssal fissures tear open! +40% Combat XP & +35% Solar Gold Drops in Ruins & Caldera',
    color: '#c084fc',
    borderColor: '#9333ea',
    rooms: [
      ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
      ROOM_TYPES.NEXUS_WARZONE,
      ROOM_TYPES.UMBRI_UNDERCITY,
    ],
    primaryRoom: ROOM_TYPES.NEXUS_FORGOTTEN_RUINS,
    primaryRoomLabel: 'Forgotten Nexus Ruins',
    bonuses: {
      gatheringXpMult: 1.15,
      combatXpMult: 1.4,
      goldMult: 1.35,
      bonusItem: 'ancient_relic_fragment',
    },
  },
];

export function getActiveWorldEvent(nowMs = Date.now()) {
  const ts = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const bucket = Math.floor(ts / WORLD_EVENT_INTERVAL_MS);
  const idx = ((bucket % DYNAMIC_WORLD_EVENTS.length) + DYNAMIC_WORLD_EVENTS.length) % DYNAMIC_WORLD_EVENTS.length;
  const event = DYNAMIC_WORLD_EVENTS[idx];
  const nextBoundaryMs = (bucket + 1) * WORLD_EVENT_INTERVAL_MS;
  const remainingMs = Math.max(0, nextBoundaryMs - ts);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const countdownText = `${mins}:${String(secs).padStart(2, '0')}`;
  const nextEvent = DYNAMIC_WORLD_EVENTS[(idx + 1) % DYNAMIC_WORLD_EVENTS.length];

  return {
    ...event,
    bucket,
    remainingMs,
    remainingSec,
    countdownText,
    nextEventTitle: nextEvent.shortTitle,
  };
}

export function isRoomInActiveWorldEvent(roomType, nowMs = Date.now()) {
  if (!roomType) return false;
  const ev = getActiveWorldEvent(nowMs);
  return ev.rooms.includes(roomType);
}
