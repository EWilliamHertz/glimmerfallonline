// ==========================================
// GlimmerFall Online — Atmospheric Lighting, Day/Night Clock & Weather Engine
// ==========================================

export const DAY_CYCLE_DURATION_SECONDS = 1440; // 24 real minutes = 24 in-game hours (1s = 1m)

const RAIN_ELIGIBLE_BIOMES = new Set([
  'sanctuary',
  'terra',
  'terra_grove',
  'umbri',
  'coral_coast',
  'sunken_oasis',
  'starlight_grove',
]);

const CAVE_DUNGEON_BIOMES = new Set([
  'solari_vault',
  'umbri_labyrinth',
  'aether_archive',
  'abyssal',
]);

const BIOME_RAIN_OFFSETS = {
  sanctuary: 60,
  terra: 180,
  terra_grove: 220,
  umbri: 310,
  coral_coast: 0,
  sunken_oasis: 90,
  starlight_grove: 260,
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function smoothCosine(t) {
  const x = clamp01(t);
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

/**
 * Compute synchronized 24-minute world clock & lighting phase from epoch ms.
 * @param {number} [nowMs=Date.now()]
 * @param {'auto'|'daylight'|'nightfall'|'rain'} [overrideMode='auto']
 */
export function computeWorldTimeCycle(nowMs = Date.now(), overrideMode = 'auto') {
  const mode = String(overrideMode || 'auto').toLowerCase();
  let minuteOfDay = Math.floor(Math.max(0, nowMs) / 1000) % DAY_CYCLE_DURATION_SECONDS;

  if (mode === 'daylight') {
    return {
      mode: 'daylight',
      minuteOfDay: 720,
      hour: 12,
      minute: 0,
      formattedClock: '12:00',
      phase: 'daylight',
      phaseLabel: 'ZENITH',
      phaseIcon: '☀️',
      darkAlpha: 0,
      tintColor: '#000000',
      lanternPower: 0.15,
    };
  }

  if (mode === 'nightfall') {
    minuteOfDay = 1380; // 23:00
  } else if (mode === 'rain') {
    minuteOfDay = 344; // 05:44 early damp dawn light
  }

  const hour = Math.floor(minuteOfDay / 60) % 24;
  const minute = minuteOfDay % 60;
  const formattedClock = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // Dawn: 05:00 (300) -> 07:29 (449)
  if (minuteOfDay >= 300 && minuteOfDay < 450) {
    const progress = (minuteOfDay - 300) / 150;
    const ease = smoothCosine(progress);
    const darkAlpha = +(0.34 * (1 - ease)).toFixed(3);
    return {
      mode,
      minuteOfDay,
      hour,
      minute,
      formattedClock,
      phase: 'dawn',
      phaseLabel: 'DAWN',
      phaseIcon: '🌅',
      darkAlpha,
      tintColor: '#120e1f',
      lanternPower: +(0.80 - 0.60 * ease).toFixed(3),
    };
  }

  // Daylight / Zenith: 07:30 (450) -> 17:59 (1079)
  if (minuteOfDay >= 450 && minuteOfDay < 1080) {
    return {
      mode,
      minuteOfDay,
      hour,
      minute,
      formattedClock,
      phase: 'daylight',
      phaseLabel: 'ZENITH',
      phaseIcon: '☀️',
      darkAlpha: 0,
      tintColor: '#000000',
      lanternPower: 0.15,
    };
  }

  // Twilight / Dusk: 18:00 (1080) -> 20:29 (1229)
  if (minuteOfDay >= 1080 && minuteOfDay < 1230) {
    const progress = (minuteOfDay - 1080) / 150;
    const ease = smoothCosine(progress);
    return {
      mode,
      minuteOfDay,
      hour,
      minute,
      formattedClock,
      phase: 'twilight',
      phaseLabel: 'TWILIGHT',
      phaseIcon: '🌆',
      darkAlpha: +(0.42 * ease).toFixed(3),
      tintColor: '#090f24',
      lanternPower: +(0.25 + 0.65 * ease).toFixed(3),
    };
  }

  // Nightfall: 20:30 (1230) -> 04:59 (299)
  const nightMinutes = minuteOfDay >= 1230 ? (minuteOfDay - 1230) : (minuteOfDay + 210); // 0..509
  const nightMid = Math.sin((nightMinutes / 510) * Math.PI);
  const darkAlpha = +(0.42 + 0.12 * nightMid).toFixed(3);
  return {
    mode,
    minuteOfDay,
    hour,
    minute,
    formattedClock,
    phase: 'nightfall',
    phaseLabel: 'NIGHTFALL',
    phaseIcon: '🌙',
    darkAlpha,
    tintColor: '#050918',
    lanternPower: 1.0,
  };
}

/**
 * Compute subtle sun/moon directional ground shadow offset across Dawn, Noon, Twilight, and Night.
 * @param {{ minuteOfDay?: number }} [timeCycle]
 */
export function computeDirectionalShadowOffset(timeCycle) {
  const rawMinute = timeCycle && typeof timeCycle.minuteOfDay === 'number' && Number.isFinite(timeCycle.minuteOfDay)
    ? timeCycle.minuteOfDay
    : 720;
  const m = ((rawMinute % DAY_CYCLE_DURATION_SECONDS) + DAY_CYCLE_DURATION_SECONDS) % DAY_CYCLE_DURATION_SECONDS;

  // Dawn: 05:00 (300) -> 07:29 (449) — long westward morning shadows
  if (m >= 300 && m < 450) {
    const t = (m - 300) / 150;
    return {
      dx: +(-5.0 + 2.4 * t).toFixed(2),
      dy: +(1.6 - 0.6 * t).toFixed(2),
      scaleX: +(1.35 - 0.20 * t).toFixed(2),
      alpha: +(0.36 + 0.12 * t).toFixed(2),
    };
  }

  // Morning to Solar Noon: 07:30 (450) -> 11:59 (719)
  if (m >= 450 && m < 720) {
    const t = (m - 450) / 270;
    return {
      dx: +(-2.6 * (1 - t)).toFixed(2),
      dy: +(1.0 - 0.5 * t).toFixed(2),
      scaleX: +(1.15 - 0.15 * t).toFixed(2),
      alpha: +(0.48 + 0.07 * t).toFixed(2),
    };
  }

  // Solar Noon to Late Afternoon: 12:00 (720) -> 17:59 (1079)
  if (m >= 720 && m < 1080) {
    const t = (m - 720) / 360;
    return {
      dx: +(2.6 * t).toFixed(2),
      dy: +(0.5 + 0.6 * t).toFixed(2),
      scaleX: +(1.0 + 0.18 * t).toFixed(2),
      alpha: +(0.55 - 0.08 * t).toFixed(2),
    };
  }

  // Twilight / Dusk: 18:00 (1080) -> 20:29 (1229) — long eastward sunset shadows
  if (m >= 1080 && m < 1230) {
    const t = (m - 1080) / 150;
    return {
      dx: +(2.6 + 2.0 * t).toFixed(2),
      dy: +(1.1 + 0.4 * t).toFixed(2),
      scaleX: +(1.18 + 0.16 * t).toFixed(2),
      alpha: +(0.47 - 0.19 * t).toFixed(2),
    };
  }

  // Nightfall: 20:30 (1230) -> 04:59 (299) — soft diffuse moonlit shadow
  return {
    dx: 0.8,
    dy: 1.0,
    scaleX: 0.96,
    alpha: 0.26,
  };
}

/**
 * Determine active weather for the current room biome (and optional roomType) and world clock.
 */
export function getBiomeWeatherProfile(biomeTheme, minuteOfDay, overrideMode = 'auto', roomType = '') {
  const rawTheme = String(biomeTheme || 'sanctuary').toLowerCase();
  const normalizedRoom = String(roomType || '').toLowerCase();
  const theme = normalizedRoom === 'coral_coast' || normalizedRoom === 'sunken_oasis' || normalizedRoom === 'starlight_grove'
    ? normalizedRoom
    : rawTheme;
  if (overrideMode === 'daylight' || rawTheme.startsWith('interior_') || CAVE_DUNGEON_BIOMES.has(rawTheme)) {
    return { kind: 'none', intensity: 0, label: 'CLEAR', icon: '' };
  }

  if (theme === 'warzone' || theme === 'starfall') {
    return { kind: 'embers', intensity: 0.45, label: 'ASH DRIFT', icon: '✨' };
  }

  if (overrideMode === 'rain' && (RAIN_ELIGIBLE_BIOMES.has(theme) || theme === 'sanctuary')) {
    return { kind: 'rain', intensity: 0.85, label: 'RAIN', icon: '🌧️' };
  }

  if (!RAIN_ELIGIBLE_BIOMES.has(theme)) {
    return { kind: 'none', intensity: 0, label: 'CLEAR', icon: '' };
  }

  const offset = BIOME_RAIN_OFFSETS[theme] || 0;
  const cyclePos = (Math.max(0, minuteOfDay | 0) + offset) % 720;
  // Rain falls during ~140-minute blocks (approx 2.3 real minutes out of every 12m)
  if (cyclePos >= 40 && cyclePos < 180) {
    const edge = Math.min(cyclePos - 40, 180 - cyclePos);
    const ramp = clamp01(edge / 14);
    const baseIntensity = theme === 'sanctuary' ? 0.55 : 0.88;
    return {
      kind: 'rain',
      intensity: +(baseIntensity * (0.45 + 0.55 * ramp)).toFixed(3),
      label: theme === 'sanctuary' ? 'DRIZZLE' : 'RAIN',
      icon: '🌧️',
    };
  }

  return { kind: 'none', intensity: 0, label: 'CLEAR', icon: '' };
}

/**
 * Compute cohesive ambient darkness & glow configuration for a room biome.
 */
export function getRoomLightingProfile(biomeTheme, timeCycle, weather) {
  const theme = String(biomeTheme || 'sanctuary').toLowerCase();
  const safeTime = timeCycle || computeWorldTimeCycle(Date.now(), 'auto');
  const safeWeather = weather || { kind: 'none', intensity: 0 };

  if (CAVE_DUNGEON_BIOMES.has(theme)) {
    const tintByBiome = {
      solari_vault: '#080503',
      umbri_labyrinth: '#060312',
      aether_archive: '#030816',
      abyssal: '#09030f',
    };
    return {
      mode: 'cave',
      isCaveDarkness: true,
      hasEntryCone: true,
      darkAlpha: 0.66,
      tintColor: tintByBiome[theme] || '#040610',
      lanternPower: 1.0,
      entryConeColor: theme === 'umbri_labyrinth' ? '#818cf8' : '#e2e8f0',
    };
  }

  if (theme.startsWith('interior_')) {
    return {
      mode: 'interior',
      isCaveDarkness: false,
      hasEntryCone: false,
      darkAlpha: theme === 'interior_umbri' ? 0.16 : 0.08,
      tintColor: theme === 'interior_umbri' ? '#090516' : '#080510',
      lanternPower: 0.72,
      entryConeColor: '#fde68a',
    };
  }

  const rainShadow = safeWeather.kind === 'rain' ? 0.14 * safeWeather.intensity : 0;
  const darkAlpha = +Math.max(safeTime.darkAlpha, rainShadow).toFixed(3);
  const tintColor = safeTime.darkAlpha > 0.18
    ? safeTime.tintColor
    : (safeWeather.kind === 'rain' ? '#0d192b' : safeTime.tintColor);

  return {
    mode: 'overworld',
    isCaveDarkness: false,
    hasEntryCone: false,
    darkAlpha,
    tintColor,
    lanternPower: +Math.max(safeTime.lanternPower, safeWeather.kind === 'rain' ? 0.65 : 0).toFixed(3),
    entryConeColor: '#fde68a',
  };
}

const PROP_LIGHT_SPECS = {
  streetLantern: { radius: 90, glow: '#fbbf24', strength: 1.0, dy: -22 },
  hearthFireplace: { radius: 118, glow: '#fb923c', strength: 1.15, dy: -18 },
  campfire: { radius: 98, glow: '#f97316', strength: 1.0, dy: -10 },
  brazier: { radius: 88, glow: '#fbbf24', strength: 0.95, dy: -14 },
  umbriBrazierAltar: { radius: 86, glow: '#c084fc', strength: 0.95, dy: -14 },
  cosmicAnvil: { radius: 82, glow: '#fb923c', strength: 0.85, dy: -14 },
  aetherCrucible: { radius: 74, glow: '#a855f7', strength: 0.80, dy: -14 },
  celestialLoom: { radius: 70, glow: '#4ade80', strength: 0.72, dy: -14 },
  aetherArmillary: { radius: 96, glow: '#38bdf8', strength: 0.95, dy: -20 },
  crystalPillar: { radius: 84, glow: '#38bdf8', strength: 0.90, dy: -18 },
  workstationConsole: { radius: 74, glow: '#38bdf8', strength: 0.80, dy: -12 },
  constructCradle: { radius: 88, glow: '#c084fc', strength: 0.92, dy: -14 },
  heraldPostbox: { radius: 56, glow: '#fbbf24', strength: 0.65, dy: -12 },
  doorThresholdGlow: { radius: 68, glow: '#38bdf8', strength: 0.78, dy: -6 },
};

/**
 * Create the client Canvas atmospheric weather, vignette lighting, and bloom renderer.
 */
export function createAtmosphereRenderer() {
  const rainDrops = Array.from({ length: 84 }, (_, idx) => ({
    x: ((idx * 97) % 1000) / 1000,
    y: ((idx * 173) % 1000) / 1000,
    len: 7 + (idx % 5) * 2,
    speed: 310 + (idx % 4) * 55,
  }));

  const rainSplashes = Array.from({ length: 18 }, (_, idx) => ({
    x: ((idx * 149) % 1000) / 1000,
    y: ((idx * 233) % 1000) / 1000,
    phase: (idx * 0.37) % 1,
  }));

  let lightCanvas = null;
  let lightCtx = null;

  function ensureLightBuffer(viewW, viewH) {
    if (typeof document === 'undefined') return null;
    const lw = Math.max(64, Math.ceil(viewW / 2));
    const lh = Math.max(64, Math.ceil(viewH / 2));
    if (!lightCanvas) {
      lightCanvas = document.createElement('canvas');
      lightCtx = lightCanvas.getContext('2d');
    }
    if (lightCanvas.width !== lw || lightCanvas.height !== lh) {
      lightCanvas.width = lw;
      lightCanvas.height = lh;
    }
    return lightCtx;
  }

  function resolveApexAuraColor(actor) {
    if (!actor) return null;
    if (actor.temporalApotheosis || (actor.temporalApotheosisTimer || 0) > 0) return '#38bdf8';
    if (actor.voidform || (actor.voidformTimer || 0) > 0) return '#c084fc';
    if (actor.treantForm || (actor.treantFormTimer || 0) > 0) return '#4ade80';
    if (actor.zenith || actor.isCasting) return '#fde047';
    return null;
  }

  function resolveGroundZoneGlow(gz) {
    if (gz.color) return gz.color;
    switch (gz.type) {
      case 'consecration': return '#fde047';
      case 'plague': return '#c084fc';
      case 'briar': return '#4ade80';
      case 'gravity':
      case 'singularity': return '#38bdf8';
      case 'frost_ring': return '#7dd3fc';
      case 'sanguine_pool':
      case 'telegraph': return '#ef4444';
      default: return '#fde047';
    }
  }

  function collectLights({
    camLeft,
    camTop,
    viewW,
    viewH,
    player,
    props,
    entities,
    remotePlayers,
    npcs,
    skyBeams,
    projectiles,
    groundZones,
    lighting,
    globalTime,
  }) {
    const safeLighting = lighting || { isCaveDarkness: false, mode: 'overworld', darkAlpha: 0, lanternPower: 0.5 };
    const t = globalTime || 0;
    const lights = [];
    const margin = 140;

    // 1. Player adventurer lantern aura (stronger in caves & night, boosted by Ember-Fox / Moon-Owl familiars & Apex/Zenith)
    if (player) {
      const px = player.x - camLeft;
      const py = player.y - 10 - camTop;
      const flicker = Math.sin(t * 5.2) * 2.5;
      const famBoost = Math.max(0, Number(player.familiarLanternBonus) || 0);
      const playerRadius = (safeLighting.isCaveDarkness
        ? 112 + flicker
        : (safeLighting.mode === 'interior' ? 86 : 92 + flicker)) + famBoost;
      lights.push({
        sx: px,
        sy: py,
        r: playerRadius,
        glow: '#fde68a',
        strength: safeLighting.isCaveDarkness ? 1.0 : 0.72,
        isPlayer: true,
      });

      const apexColor = resolveApexAuraColor(player);
      if (apexColor) {
        lights.push({
          sx: px,
          sy: py,
          r: 102 + Math.sin(t * 6.0) * 5,
          glow: apexColor,
          strength: 0.95,
          emitBloom: true,
          isSpellLight: true,
        });
      }
    }

    // 2. Remote players bring warm torches beside the explorer (+ Apex/Zenith state bloom)
    if (remotePlayers) {
      const iter = typeof remotePlayers.values === 'function' ? remotePlayers.values() : remotePlayers;
      for (const rp of iter) {
        if (!rp || rp.isDead || rp.stealthed) continue;
        const rx = rp.renderX ?? rp.x ?? 0;
        const ry = rp.renderY ?? rp.y ?? 0;
        const sx = rx - camLeft;
        const sy = ry - 10 - camTop;
        if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
        lights.push({ sx, sy, r: 66, glow: '#fde68a', strength: 0.55 });

        const rpApexColor = resolveApexAuraColor(rp);
        if (rpApexColor) {
          lights.push({
            sx,
            sy,
            r: 86 + Math.sin(t * 5.6 + rx * 0.05) * 4,
            glow: rpApexColor,
            strength: 0.85,
            emitBloom: true,
            isSpellLight: true,
          });
        }
      }
    }

    // 3. Light-emitting architectural & crafting props
    if (Array.isArray(props)) {
      for (const pr of props) {
        const spec = PROP_LIGHT_SPECS[pr.type];
        if (!spec) continue;
        const sx = pr.x - camLeft;
        const sy = pr.y + (spec.dy || 0) - camTop;
        if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
        const pulse = Math.sin(t * 4.1 + Math.abs(pr.x * 0.13) + Math.abs(pr.y * 0.07)) * 3;
        lights.push({
          sx,
          sy,
          r: spec.radius + pulse,
          glow: spec.glow,
          strength: spec.strength,
          emitBloom: true,
        });
      }
    }

    // 4. Glowing ore crystals, Glimmer Fonts, shrines & portals
    if (Array.isArray(entities)) {
      for (const ent of entities) {
        if (ent.type === 'node' && (ent.charges ?? 1) > 0) {
          const sx = ent.x - camLeft;
          const sy = ent.y - 12 - camTop;
          if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
          const skType = String(ent.skillingType || '');
          const isOreOrCrystal = skType.includes('vein') || skType.includes('crystal') || ent.isGrand;
          const glowColor = skType.includes('mineral') || skType.includes('copper') || skType.includes('gold')
            ? '#facc15'
            : (skType.includes('spring') ? '#4ade80' : '#38bdf8');
          const baseRadius = ent.isGrand ? 112 : (isOreOrCrystal ? 88 : 66);
          const pulse = Math.sin(t * 3.0 + Math.abs(ent.x)) * 3;
          lights.push({
            sx,
            sy,
            r: baseRadius + pulse,
            glow: glowColor,
            strength: ent.isGrand ? 1.05 : 0.88,
            emitBloom: isOreOrCrystal || ent.isGrand || safeLighting.isCaveDarkness,
          });
        } else if (ent.type === 'portal' || ent.type === 'shrine') {
          const sx = ent.x - camLeft;
          const sy = ent.y - 14 - camTop;
          if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
          lights.push({
            sx,
            sy,
            r: ent.type === 'portal' ? 96 : 78,
            glow: '#38bdf8',
            strength: 0.92,
            emitBloom: true,
          });
        }
      }
    }

    // 5. Townsfolk subtle hearth aura so friendly NPCs are readable in dusk
    if (Array.isArray(npcs) && safeLighting.darkAlpha > 0.15) {
      for (const npc of npcs) {
        const sx = npc.x - camLeft;
        const sy = npc.y - 10 - camTop;
        if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
        lights.push({
          sx,
          sy,
          r: 46,
          glow: '#fef08a',
          strength: 0.50,
          emitBloom: false,
        });
      }
    }

    // 6. Dynamic Spell & Combat VFX Lighting (Sky Beams, Projectiles, Ground Zones)
    if (Array.isArray(skyBeams)) {
      for (const sb of skyBeams) {
        if (!sb) continue;
        const sx = sb.x - camLeft;
        const sy = sb.y - camTop;
        if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
        const fade = 1 - clamp01((sb.age || 0) / Math.max(0.01, sb.maxAge || 0.45));
        lights.push({
          sx,
          sy,
          r: 86 + fade * 48,
          glow: sb.color || '#facc15',
          strength: 0.45 + fade * 0.70,
          emitBloom: true,
          isSpellLight: true,
        });
      }
    }

    if (Array.isArray(projectiles)) {
      for (const p of projectiles) {
        if (!p) continue;
        const sx = p.x - camLeft;
        const sy = p.y - camTop;
        if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;
        const glow = p.color || (
          p.type === 'hammer' ? '#facc15' :
          p.type === 'boulder' ? '#4ade80' :
          p.type === 'void_orb' ? '#c084fc' :
          '#38bdf8'
        );
        const radius = p.type === 'dagger' || p.type === 'boulder' ? 46 : 62;
        lights.push({
          sx,
          sy,
          r: radius,
          glow,
          strength: 0.76,
          emitBloom: true,
          isSpellLight: true,
        });
      }
    }

    if (Array.isArray(groundZones)) {
      for (const gz of groundZones) {
        if (!gz) continue;
        const sx = gz.x - camLeft;
        const sy = gz.y - camTop;
        const zoneMargin = Math.max(margin, (gz.radius || 70) + 40);
        if (sx < -zoneMargin || sx > viewW + zoneMargin || sy < -zoneMargin || sy > viewH + zoneMargin) continue;
        const maxAge = Math.max(0.01, gz.maxAge || 4.0);
        const age = gz.age || 0;
        const lifeFade = gz.type === 'shockwave'
          ? clamp01(1 - age / maxAge)
          : (maxAge - age < 0.25 ? clamp01((maxAge - age) / 0.25) : 1);
        const pulse = Math.sin(t * 4.5 + Math.abs(gz.x * 0.1)) * 4;
        lights.push({
          sx,
          sy,
          r: Math.max(48, Math.round((gz.radius || 64) * 1.12)) + pulse,
          glow: resolveGroundZoneGlow(gz),
          strength: (gz.type === 'telegraph' ? 0.65 : 0.88) * lifeFade,
          emitBloom: true,
          isSpellLight: true,
        });
      }
    }

    return lights;
  }

  function renderWeather(ctx, { dt, viewW, viewH, weather, globalTime }) {
    if (!weather || weather.kind === 'none') return;

    if (weather.kind === 'rain') {
      ctx.save();
      ctx.fillStyle = `rgba(186, 230, 253, ${(0.22 + weather.intensity * 0.28).toFixed(3)})`;
      for (const drop of rainDrops) {
        drop.x -= (dt * drop.speed * 0.22) / Math.max(320, viewW);
        drop.y += (dt * drop.speed) / Math.max(240, viewH);
        if (drop.y > 1) {
          drop.y -= 1;
          drop.x = ((drop.x * 1.37 + 0.19) % 1 + 1) % 1;
        }
        if (drop.x < 0) drop.x += 1;

        const sx = Math.round(drop.x * viewW);
        const sy = Math.round(drop.y * viewH);
        for (let seg = 0; seg < 4; seg++) {
          ctx.fillRect(
            sx - Math.round(seg * 0.8),
            sy + Math.round((seg * drop.len) / 4),
            1,
            Math.max(2, Math.round(drop.len / 4))
          );
        }
      }

      // Subtle raindrop puddle ripples
      ctx.strokeStyle = `rgba(186, 230, 253, ${(0.18 + weather.intensity * 0.22).toFixed(3)})`;
      ctx.lineWidth = 1;
      for (const sp of rainSplashes) {
        sp.phase = (sp.phase + dt * 1.45) % 1;
        const rx = 1 + sp.phase * 5;
        const ry = 0.5 + sp.phase * 2.2;
        ctx.globalAlpha = (1 - sp.phase) * 0.45 * weather.intensity;
        ctx.beginPath();
        ctx.ellipse(sp.x * viewW, sp.y * viewH, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (weather.kind === 'embers') {
      ctx.save();
      for (let i = 0; i < 20; i++) {
        const px = ((Math.sin(globalTime * 0.35 + i * 2.1) * 0.5 + 0.5 + i * 0.07) % 1) * viewW;
        const py = ((1 - ((globalTime * (0.04 + (i % 3) * 0.015) + i * 0.13) % 1))) * viewH;
        const alpha = 0.25 + 0.4 * Math.sin(globalTime * 4 + i);
        ctx.fillStyle = i % 2 === 0 ? `rgba(251, 146, 60, ${alpha})` : `rgba(253, 224, 71, ${alpha})`;
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.restore();
    }
  }

  function render({
    ctx,
    dt,
    camLeft,
    camTop,
    viewW,
    viewH,
    mapBounds,
    biomeTheme,
    timeCycle,
    weather,
    player,
    props,
    entities,
    remotePlayers,
    npcs,
    skyBeams,
    projectiles,
    groundZones,
    globalTime,
  }) {
    const lighting = getRoomLightingProfile(biomeTheme, timeCycle, weather);

    // 1. Outdoor precipitation/ash behind nightfall vignette mask
    renderWeather(ctx, { dt, viewW, viewH, weather, globalTime });

    const hasDynamicSpellVfx = Boolean(
      (Array.isArray(skyBeams) && skyBeams.length > 0) ||
      (Array.isArray(projectiles) && projectiles.length > 0) ||
      (Array.isArray(groundZones) && groundZones.length > 0) ||
      resolveApexAuraColor(player)
    );

    const lights = (lighting.darkAlpha > 0.02 || lighting.lanternPower > 0.35 || hasDynamicSpellVfx)
      ? collectLights({
        camLeft,
        camTop,
        viewW,
        viewH,
        player,
        props,
        entities,
        remotePlayers,
        npcs,
        skyBeams,
        projectiles,
        groundZones,
        lighting,
        globalTime,
      })
      : [];

    // 2. Subterranean cave darkness or nocturnal vignette with radial light punch-outs
    if (lighting.darkAlpha > 0.02) {
      const lctx = ensureLightBuffer(viewW, viewH);
      if (lctx && lightCanvas) {
        const lw = lightCanvas.width;
        const lh = lightCanvas.height;
        const sxScale = lw / viewW;
        const syScale = lh / viewH;

        lctx.save();
        lctx.globalCompositeOperation = 'source-over';
        lctx.clearRect(0, 0, lw, lh);
        lctx.globalAlpha = lighting.darkAlpha;
        lctx.fillStyle = lighting.tintColor;
        lctx.fillRect(0, 0, lw, lh);

        lctx.globalAlpha = 1;
        lctx.globalCompositeOperation = 'destination-out';

        for (const light of lights) {
          const lx = light.sx * sxScale;
          const ly = light.sy * syScale;
          const lr = Math.max(12, light.r * sxScale);
          const grad = lctx.createRadialGradient(lx, ly, lr * 0.14, lx, ly, lr);
          grad.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.96 * light.strength)})`);
          grad.addColorStop(0.55, `rgba(0,0,0,${Math.min(1, 0.62 * light.strength)})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          lctx.fillStyle = grad;
          lctx.beginPath();
          lctx.arc(lx, ly, lr, 0, Math.PI * 2);
          lctx.fill();
        }

        // Cave Dungeon Daylight Exit Shaft (IMG_6887 inspiration)
        if (lighting.hasEntryCone && mapBounds) {
          const exitX = (0 - camLeft) * sxScale;
          const exitY = (mapBounds.halfH - camTop) * syScale;
          if (exitY > -80 && exitY < lh + 120) {
            const topHalf = 48 * sxScale;
            const botHalf = 18 * sxScale;
            const coneH = 128 * syScale;
            const coneGrad = lctx.createLinearGradient(exitX, exitY, exitX, exitY - coneH);
            coneGrad.addColorStop(0, 'rgba(0,0,0,0.96)');
            coneGrad.addColorStop(0.65, 'rgba(0,0,0,0.45)');
            coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
            lctx.fillStyle = coneGrad;
            lctx.beginPath();
            lctx.moveTo(exitX - botHalf, exitY + 8);
            lctx.lineTo(exitX + botHalf, exitY + 8);
            lctx.lineTo(exitX + topHalf, exitY - coneH);
            lctx.lineTo(exitX - topHalf, exitY - coneH);
            lctx.closePath();
            lctx.fill();
          }
        }
        lctx.restore();

        ctx.save();
        ctx.drawImage(lightCanvas, 0, 0, viewW, viewH);
        ctx.restore();
      }
    }

    // 3. Soft warm/arcane light bloom spilling around active lanterns, hearths, crystals & active spells
    if ((lighting.lanternPower > 0.25 || hasDynamicSpellVfx) && lights.length > 0) {
      ctx.save();
      let bloomCount = 0;
      for (const light of lights) {
        if (!light.emitBloom) continue;
        if (!light.isSpellLight && lighting.lanternPower <= 0.25) continue;
        if (bloomCount >= 48) break;
        bloomCount += 1;
        const glowR = Math.round(light.r * 0.72);
        const grad = ctx.createRadialGradient(light.sx, light.sy, 2, light.sx, light.sy, glowR);
        const power = light.isSpellLight ? Math.max(0.55, lighting.lanternPower) : lighting.lanternPower;
        const alpha = +(0.12 * power * light.strength).toFixed(3);
        grad.addColorStop(0, hexToRgba(light.glow, alpha * 1.45));
        grad.addColorStop(0.55, hexToRgba(light.glow, alpha * 0.55));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(light.sx, light.sy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw crisp translucent daylight shaft beam inside cave mouths
      if (lighting.lanternPower > 0.25 && lighting.hasEntryCone && mapBounds) {
        const exitX = 0 - camLeft;
        const exitY = mapBounds.halfH - camTop;
        if (exitY > -120 && exitY < viewH + 140) {
          const beamGrad = ctx.createLinearGradient(exitX, exitY, exitX, exitY - 120);
          beamGrad.addColorStop(0, 'rgba(226, 232, 240, 0.20)');
          beamGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.06)');
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(exitX - 18, exitY + 4);
          ctx.lineTo(exitX + 18, exitY + 4);
          ctx.lineTo(exitX + 46, exitY - 120);
          ctx.lineTo(exitX - 46, exitY - 120);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    return lighting;
  }

  return { render, collectLights };
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#fbbf24').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16) || 0xfbbf24;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}
