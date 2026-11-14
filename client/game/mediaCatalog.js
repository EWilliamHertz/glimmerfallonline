// ==========================================
// GlimmerFall Online — Canonical Flow Cinematics & Audio Catalog
// Centralized from blob-media-manifest.json
// ==========================================

const BLOB_BASE = 'https://o20ql1pn6r6cwj04.public.blob.vercel-storage.com/glimmerfall';

export const FLOW_CINEMATICS = {
  crystal_heart: {
    id: 'crystal_heart',
    title: 'The Shattered Crystal Heart',
    subtitle: 'Prologue — The Primordial Nexus Overload',
    url: `${BLOB_BASE}/cinematics/crystal_heart_shattering_1080p.mp4`,
  },
  solari_vanguard: {
    id: 'solari_vanguard',
    title: 'Solari Vanguard Awakening',
    subtitle: 'Sunspire Dominion — Plate Sentinel',
    url: `${BLOB_BASE}/cinematics/awakening_solari_vanguard_1080p.mp4`,
  },
  aurora_marshal: {
    id: 'aurora_marshal',
    title: 'Solari Dawnblade Awakening',
    subtitle: 'Sunspire Dominion — Radiant Duelist',
    url: `${BLOB_BASE}/cinematics/awakening_solari_dawnblade_1080p.mp4`,
  },
  umbral_assassin: {
    id: 'umbral_assassin',
    title: 'Umbri Reaper Awakening',
    subtitle: 'Duskveil Syndicate — Shadow Stalker',
    url: `${BLOB_BASE}/cinematics/awakening_umbri_reaper_1080p.mp4`,
  },
  graveglass_oracle: {
    id: 'graveglass_oracle',
    title: 'Umbri Shadowweaver Awakening',
    subtitle: 'Duskveil Syndicate — Void Mystic',
    url: `${BLOB_BASE}/cinematics/awakening_umbri_shadowweaver_1080p.mp4`,
  },
  stonekin_elder: {
    id: 'stonekin_elder',
    title: 'Terra Ironroot Awakening',
    subtitle: 'Rootdeep Compact — Living Juggernaut',
    url: `${BLOB_BASE}/cinematics/awakening_terra_ironroot_1080p.mp4`,
  },
  forest_warden: {
    id: 'forest_warden',
    title: 'Terra Bramble Warden Awakening',
    subtitle: 'Rootdeep Compact — Verdant Ranger',
    url: `${BLOB_BASE}/cinematics/awakening_terra_bramble_warden_1080p.mp4`,
  },
  chronomancer_sage: {
    id: 'chronomancer_sage',
    title: 'Aether Chronomancer Awakening',
    subtitle: 'Astral Rift Conclave — Temporal Scholar',
    url: `${BLOB_BASE}/cinematics/awakening_aether_chronomancer_1080p.mp4`,
  },
  nexus_weaver: {
    id: 'nexus_weaver',
    title: 'Aether Tempest Sage Awakening',
    subtitle: 'Astral Rift Conclave — Quantum Battlemage',
    url: `${BLOB_BASE}/cinematics/awakening_aether_tempest_sage_1080p.mp4`,
  },
  boss_emergence: {
    id: 'boss_emergence',
    title: 'Granite Colossus Emergence',
    subtitle: 'World Boss Awakens in the Caldera',
    url: `${BLOB_BASE}/cinematics/scene3_colossus_emergence_1080p.mp4`,
  },
  boss_defeated: {
    id: 'boss_defeated',
    title: 'Colossus Shattered',
    subtitle: 'Victory & Celestial Shard Harvest',
    url: `${BLOB_BASE}/cinematics/scene4_boss_defeated_1080p.mp4`,
  },
  monolith_explosion: {
    id: 'monolith_explosion',
    title: 'Nexus Monolith Detonation',
    subtitle: '3v3 Warzone — Cataclysmic Finale',
    url: `${BLOB_BASE}/cinematics/scene5_monolith_explosion_1080p.mp4`,
  },
};

export const FLOW_EVENT_AUDIO = {
  duel: `${BLOB_BASE}/audio/Authentic_TCG_Tactical_Card_Duel.m4a`,
  awakening: `${BLOB_BASE}/audio/The_Bridge_Holographic_Card_to_Pixel_Sprite.m4a`,
  boss_emergence: `${BLOB_BASE}/audio/Apex_World_Boss_Granite_Colossus_Emergence.m4a`,
  boss_defeated: `${BLOB_BASE}/audio/Triumph__Spoils_Colossus_Defeated.m4a`,
  warzone_clash: `${BLOB_BASE}/audio/3v3_Outpost_Siege_Warzone_Monolith_Clash.m4a`,
};
