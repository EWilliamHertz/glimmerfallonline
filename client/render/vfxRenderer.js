// ==========================================
// GlimmerFall Online — Multi-Pass Pixel VFX Renderer
// Ground zones, colored sky beams, projectile silhouettes & trails,
// tapered crescent slash arcs, and isometric entity aura rings.
// ==========================================

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hexToRgba(color, alpha = 1) {
  const a = clamp01(alpha).toFixed(3);
  const raw = String(color || '#facc15').trim();
  if (raw.startsWith('rgba(') || raw.startsWith('rgb(')) {
    const nums = raw.match(/[\d.]+/g);
    if (nums && nums.length >= 3) {
      return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${a})`;
    }
  }
  const clean = raw.replace('#', '');
  const full = clean.length === 3
    ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
    : clean.padEnd(6, '0').slice(0, 6);
  const parsed = parseInt(full, 16);
  const num = Number.isFinite(parsed) ? parsed : 0xfacc15;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function drawIsoEllipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
}

/**
 * Create a reusable multi-pass pixel VFX renderer instance.
 */
export function createVfxRenderer() {
  const projTrackCache = new Map();
  let projFrameCounter = 0;

  function resolveProjectileAngle(p) {
    if (typeof p.angle === 'number' && Number.isFinite(p.angle)) {
      return { angle: p.angle, hasMotion: true };
    }
    if (typeof p.vx === 'number' && typeof p.vy === 'number') {
      const mag = Math.hypot(p.vx, p.vy);
      if (mag > 0.01) {
        return { angle: Math.atan2(p.vy, p.vx), hasMotion: true };
      }
    }
    if (p.id !== undefined && p.id !== null) {
      const prev = projTrackCache.get(p.id);
      if (prev) {
        const dx = p.x - prev.prevX;
        const dy = p.y - prev.prevY;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.25) {
          prev.angle = Math.atan2(dy, dx);
          prev.hasMotion = true;
        }
        prev.prevX = p.x;
        prev.prevY = p.y;
        prev.lastTick = projFrameCounter;
        return { angle: prev.angle, hasMotion: prev.hasMotion };
      }
      projTrackCache.set(p.id, {
        prevX: p.x,
        prevY: p.y,
        angle: 0,
        hasMotion: false,
        lastTick: projFrameCounter,
      });
    }
    return { angle: 0, hasMotion: false };
  }

  function pruneProjectileCache() {
    if (projTrackCache.size <= 128 && (projFrameCounter & 63) !== 0) return;
    for (const [id, entry] of projTrackCache) {
      if (projFrameCounter - entry.lastTick > 16) {
        projTrackCache.delete(id);
      }
    }
  }

  function drawZoneConsecration(ctx, gx, gy, r, ry, gz, globalTime, fade) {
    const baseColor = gz.color || '#facc15';
    const rot = globalTime * 0.65;

    ctx.save();
    ctx.globalAlpha = fade;

    // Warm floor radiance
    drawIsoEllipse(ctx, gx, gy, r, ry);
    ctx.fillStyle = hexToRgba(baseColor, 0.14);
    ctx.fill();
    drawIsoEllipse(ctx, gx, gy, Math.round(r * 0.62), Math.round(ry * 0.62));
    ctx.fillStyle = hexToRgba('#fef08a', 0.12);
    ctx.fill();

    // Outer double rim
    drawIsoEllipse(ctx, gx, gy, r, ry);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotating 8-point geometric sun rune (two overlapping isometric squares)
    const runeR = r * 0.72;
    const runeRy = ry * 0.72;
    ctx.strokeStyle = hexToRgba('#fde047', 0.65);
    ctx.lineWidth = 1.25;
    for (let sq = 0; sq < 2; sq++) {
      const offset = rot + (sq * Math.PI) / 4;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = offset + (i * Math.PI) / 2;
        const px = gx + Math.cos(a) * runeR;
        const py = gy + Math.sin(a) * runeRy;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Center sun core sigil
    drawIsoEllipse(ctx, gx, gy, Math.max(4, Math.round(r * 0.24)), Math.max(3, Math.round(ry * 0.24)));
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Subtle rising golden flame ticks inside
    for (let i = 0; i < 8; i++) {
      const seed = i * 1.91 + (gz.x || 0) * 0.05;
      const life = (globalTime * 1.15 + i * 0.17) % 1;
      const ang = seed + i * 0.8;
      const dist = (0.25 + ((i * 37) % 60) / 100) * 0.85;
      const fx = Math.round(gx + Math.cos(ang) * r * dist);
      const fy = Math.round(gy + Math.sin(ang) * ry * dist - life * 12);
      const tickAlpha = (1 - life) * 0.85 * fade;
      ctx.fillStyle = i % 3 === 0
        ? `rgba(255, 255, 255, ${tickAlpha.toFixed(3)})`
        : `rgba(251, 191, 36, ${tickAlpha.toFixed(3)})`;
      ctx.fillRect(fx, fy, 2, life < 0.45 ? 3 : 2);
    }

    ctx.restore();
  }

  function drawZonePlague(ctx, gx, gy, r, ry, gz, globalTime, fade) {
    ctx.save();
    ctx.globalAlpha = fade;

    // Bubbling deep-violet miasma pool
    drawIsoEllipse(ctx, gx, gy, r * 0.94, ry * 0.94);
    ctx.fillStyle = 'rgba(59, 7, 100, 0.30)';
    ctx.fill();
    drawIsoEllipse(ctx, gx, gy, r * 0.62, ry * 0.62);
    ctx.fillStyle = 'rgba(147, 51, 234, 0.20)';
    ctx.fill();

    // Undulating perimeter ring
    const segs = 24;
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const wobble = 1 + 0.055 * Math.sin(a * 5 + globalTime * 4.2) + 0.03 * Math.cos(a * 3 - globalTime * 3.1);
      const px = gx + Math.cos(a) * r * wobble;
      const py = gy + Math.sin(a) * ry * wobble;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = '#6b21a8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = gz.color || '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bubbling miasma blisters inside
    for (let i = 0; i < 6; i++) {
      const phase = (globalTime * 1.4 + i * 0.31) % 1;
      const ang = i * 1.07 + 0.4;
      const radFrac = 0.28 + ((i * 19) % 45) / 100;
      const bx = Math.round(gx + Math.cos(ang) * r * radFrac);
      const by = Math.round(gy + Math.sin(ang) * ry * radFrac - phase * 4);
      const sz = phase < 0.7 ? 2 : 3;
      ctx.fillStyle = `rgba(216, 180, 254, ${((1 - phase) * 0.75).toFixed(3)})`;
      ctx.fillRect(bx, by, sz, sz);
    }

    // Orbiting necrotic spore / skull motes
    for (let k = 0; k < 4; k++) {
      const a = globalTime * 1.35 + (k * Math.PI) / 2;
      const mx = Math.round(gx + Math.cos(a) * r * 0.76);
      const my = Math.round(gy + Math.sin(a) * ry * 0.76 - 2 + Math.sin(globalTime * 4 + k) * 2);
      ctx.fillStyle = '#1e0836';
      ctx.fillRect(mx - 2, my - 2, 5, 5);
      ctx.fillStyle = k % 2 === 0 ? '#d8b4fe' : '#a3e635';
      ctx.fillRect(mx - 1, my - 1, 3, 3);
      ctx.fillStyle = '#1e0836';
      ctx.fillRect(mx, my + 1, 1, 1);
    }

    ctx.restore();
  }

  function drawZoneBriar(ctx, gx, gy, r, ry, gz, globalTime, fade) {
    ctx.save();
    ctx.globalAlpha = fade;

    drawIsoEllipse(ctx, gx, gy, r * 0.94, ry * 0.94);
    ctx.fillStyle = 'rgba(20, 83, 45, 0.22)';
    ctx.fill();

    // Interlocking emerald thorn-rings
    const segs = 28;
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const wave = 1 + 0.045 * Math.sin(a * 7 + (strand === 0 ? globalTime * 1.8 : -globalTime * 1.5 + Math.PI));
        const px = gx + Math.cos(a) * r * wave;
        const py = gy + Math.sin(a) * ry * wave;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = strand === 0 ? '#15803d' : (gz.color || '#4ade80');
      ctx.lineWidth = strand === 0 ? 2.5 : 1.5;
      ctx.stroke();
    }

    // Protruding pixel bramble spikes around circumference
    const spikeCount = 14;
    for (let i = 0; i < spikeCount; i++) {
      const a = (i / spikeCount) * Math.PI * 2 + Math.sin(globalTime * 1.2 + i) * 0.03;
      const bx = gx + Math.cos(a) * r;
      const by = gy + Math.sin(a) * ry;
      const tipX = Math.round(bx + Math.cos(a) * 6);
      const tipY = Math.round(by + Math.sin(a) * 4.5);
      const midX = Math.round((bx + tipX) * 0.5);
      const midY = Math.round((by + tipY) * 0.5);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 3, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(midX - 1, midY - 1, 2, 2);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(tipX, tipY, 2, 2);
    }

    ctx.restore();
  }

  function drawZoneGravity(ctx, gx, gy, r, ry, gz, globalTime, fade) {
    const pulse = 0.90 + Math.sin(globalTime * 4.8) * 0.07;
    const rx = r * pulse;
    const rry = ry * pulse;

    ctx.save();
    ctx.globalAlpha = fade;

    // Dark purple/cyan accretion disk
    drawIsoEllipse(ctx, gx, gy, rx, rry);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.44)';
    ctx.fill();
    drawIsoEllipse(ctx, gx, gy, rx * 0.72, rry * 0.72);
    ctx.fillStyle = 'rgba(107, 33, 168, 0.24)';
    ctx.fill();

    drawIsoEllipse(ctx, gx, gy, rx, rry);
    ctx.strokeStyle = hexToRgba(gz.color || '#38bdf8', 0.75);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inward swirling spiral arms
    const arms = 4;
    const steps = 12;
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = globalTime * 3.1 + (arm * Math.PI * 2) / arms;
      for (let s = 0; s < steps; s++) {
        const frac = 1 - s / steps;
        const a = baseAngle + (1 - frac) * 2.15;
        const px = Math.round(gx + Math.cos(a) * rx * frac * 0.92);
        const py = Math.round(gy + Math.sin(a) * rry * frac * 0.92);
        const sz = frac > 0.55 ? 2 : 3;
        ctx.fillStyle = s > 6 ? '#38bdf8' : '#c084fc';
        ctx.fillRect(px - 1, py - 1, sz, sz);
      }
    }

    // Bright singularity core
    drawIsoEllipse(ctx, gx, gy, 8, 5);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gx - 2, gy - 1, 4, 3);

    ctx.restore();
  }

  function drawZoneFrostRing(ctx, gx, gy, r, ry, gz, globalTime, fade) {
    const maxAge = Math.max(0.01, gz.maxAge || 0.45);
    const age = gz.age || 0;
    const expandDur = Math.min(0.42, maxAge);
    const expand = clamp01(age / expandDur);
    const curR = Math.max(5, r * (0.22 + 0.78 * expand));
    const curRy = Math.max(4, ry * (0.22 + 0.78 * expand));
    const endFade = maxAge > 0.6 && maxAge - age < 0.3 ? clamp01((maxAge - age) / 0.3) : (maxAge <= 0.6 ? 1 - clamp01(age / maxAge) * 0.7 : 1);

    ctx.save();
    ctx.globalAlpha = fade * endFade;

    drawIsoEllipse(ctx, gx, gy, curR, curRy);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.fill();

    // Crystalline octagonal ice-rune ring
    const sides = 8;
    const rot = globalTime * 0.35;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = rot + (i * Math.PI * 2) / sides;
      const vx = gx + Math.cos(a) * curR;
      const vy = gy + Math.sin(a) * curRy;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = gz.color || '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shimmering frost crystal shards at vertices
    for (let i = 0; i < sides; i++) {
      const a = rot + (i * Math.PI * 2) / sides;
      const vx = Math.round(gx + Math.cos(a) * curR);
      const vy = Math.round(gy + Math.sin(a) * curRy);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(vx - 2, vy - 2, 4, 4);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(vx - 1, vy - 1, 2, 2);
      if ((i + Math.floor(globalTime * 6)) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(vx, vy - 3, 1, 2);
      }
    }

    ctx.restore();
  }

  function drawZoneShockwave(ctx, gx, gy, r, gz) {
    const prog = clamp01((gz.age || 0) / Math.max(0.01, gz.maxAge || 0.4));
    const curR = Math.max(4, r * (0.18 + 0.82 * prog));
    const curRy = Math.max(3, Math.round(curR * 0.68));
    const color = gz.color || '#fde047';
    const alpha = clamp01(1 - prog);

    ctx.save();
    if (prog < 0.32) {
      drawIsoEllipse(ctx, gx, gy, curR, curRy);
      ctx.fillStyle = hexToRgba(color, (1 - prog / 0.32) * 0.18);
      ctx.fill();
    }

    // Outer tapered ring
    drawIsoEllipse(ctx, gx, gy, curR, curRy);
    ctx.strokeStyle = hexToRgba(color, alpha * 0.92);
    ctx.lineWidth = Math.max(1, 3.2 * (1 - prog * 0.65));
    ctx.stroke();

    // Inner bright highlight ring
    if (curR > 6) {
      drawIsoEllipse(ctx, gx, gy, curR * 0.80, curRy * 0.80);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawZoneSanguinePool(ctx, gx, gy, r, ry, gz, globalTime, fade) {
    const pulse = 0.82 + Math.sin(globalTime * 5.6) * 0.14;
    ctx.save();
    ctx.globalAlpha = fade;

    drawIsoEllipse(ctx, gx, gy, r, ry);
    ctx.fillStyle = `rgba(127, 29, 29, ${(0.34 * pulse).toFixed(3)})`;
    ctx.fill();
    drawIsoEllipse(ctx, gx, gy, r * 0.68, ry * 0.68);
    ctx.fillStyle = `rgba(220, 38, 38, ${(0.22 * pulse).toFixed(3)})`;
    ctx.fill();

    // Dark obsidian-crimson rim
    drawIsoEllipse(ctx, gx, gy, r, ry);
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = gz.color || '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rising crimson bubbles
    for (let i = 0; i < 6; i++) {
      const phase = (globalTime * 1.8 + i * 0.27) % 1;
      const a = i * 1.15 + 0.2;
      const dist = 0.25 + ((i * 23) % 50) / 100;
      const bx = Math.round(gx + Math.cos(a) * r * dist);
      const by = Math.round(gy + Math.sin(a) * ry * dist - phase * 3);
      ctx.fillStyle = phase > 0.7 ? '#fecaca' : '#f87171';
      ctx.fillRect(bx, by, 2, 2);
    }

    ctx.restore();
  }

  function drawZoneTelegraph(ctx, gx, gy, r, ry, gz, globalTime, activeTextCtx, worldToScreen, fillCrispShadowText) {
    const maxAge = Math.max(0.1, gz.maxAge || 1.5);
    const age = gz.age || 0;
    const fillProg = clamp01(age / maxAge);
    const color = gz.color || '#ef4444';
    const urgentPulse = fillProg > 0.72 ? (0.65 + 0.35 * Math.sin(globalTime * 18)) : (0.75 + 0.25 * Math.sin(globalTime * 7));

    ctx.save();
    // 1. Subtle hazard floor aura
    drawIsoEllipse(ctx, gx, gy, r, ry);
    ctx.fillStyle = hexToRgba(color, 0.13);
    ctx.fill();

    // 2. Crisp fill sweep expanding from center
    const cr = Math.max(2, Math.round(r * fillProg));
    const cry = Math.max(2, Math.round(ry * fillProg));
    drawIsoEllipse(ctx, gx, gy, cr, cry);
    ctx.fillStyle = hexToRgba(color, 0.24 + 0.14 * fillProg);
    ctx.fill();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.35 * fillProg);
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Inner rune crosshairs
    ctx.strokeStyle = hexToRgba(color, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx - Math.round(r * 0.75), gy);
    ctx.lineTo(gx - 6, gy);
    ctx.moveTo(gx + 6, gy);
    ctx.lineTo(gx + Math.round(r * 0.75), gy);
    ctx.moveTo(gx, gy - Math.round(ry * 0.75));
    ctx.lineTo(gx, gy - 4);
    ctx.moveTo(gx, gy + 4);
    ctx.lineTo(gx, gy + Math.round(ry * 0.75));
    ctx.stroke();
    drawIsoEllipse(ctx, gx, gy, 5, 3);
    ctx.stroke();

    // 4. High-contrast pulsing dashed perimeter
    drawIsoEllipse(ctx, gx, gy, r + 1, ry + 1);
    ctx.strokeStyle = 'rgba(5, 7, 15, 0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -globalTime * 18;
    drawIsoEllipse(ctx, gx, gy, r, ry);
    ctx.strokeStyle = hexToRgba(color, urgentPulse);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 5. Crisp countdown text
    const remain = Math.max(0, maxAge - age);
    const warnText = `⚠️ ${remain.toFixed(1)}s`;
    if (activeTextCtx && typeof worldToScreen === 'function' && typeof fillCrispShadowText === 'function') {
      const gzPos = worldToScreen(gz.x, gz.y - ry - 4);
      activeTextCtx.save();
      activeTextCtx.font = '700 12.5px "Outfit", system-ui, sans-serif';
      activeTextCtx.textAlign = 'center';
      fillCrispShadowText(activeTextCtx, warnText, gzPos.sx, gzPos.sy, '#fde047', 1);
      if (gz.label) {
        const lPos = worldToScreen(gz.x, gz.y + 3);
        activeTextCtx.font = '800 12px "Cinzel", serif';
        fillCrispShadowText(activeTextCtx, gz.label, lPos.sx, lPos.sy, '#ffffff', 1);
      }
      activeTextCtx.restore();
    } else {
      ctx.save();
      ctx.font = '700 11px "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const wy = Math.round(gy - ry - 4);
      ctx.fillStyle = '#05070f';
      ctx.fillText(warnText, gx + 1, wy + 1);
      ctx.fillStyle = '#fde047';
      ctx.fillText(warnText, gx, wy);
      if (gz.label) {
        ctx.font = '800 10px "Cinzel", serif';
        const ly = Math.round(gy + 3);
        ctx.fillStyle = '#05070f';
        ctx.fillText(gz.label, gx + 1, ly + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(gz.label, gx, ly);
      }
      ctx.restore();
    }
  }

  /**
   * Render all active ground spell zones and boss telegraphs.
   */
  function drawGroundZones(
    ctx,
    {
      groundZones,
      camLeft = 0,
      camTop = 0,
      globalTime = 0,
      activeTextCtx = null,
      worldToScreen = null,
      fillCrispShadowText = null,
      isWorldInViewport = null,
    } = {}
  ) {
    if (!ctx || !Array.isArray(groundZones) || groundZones.length === 0) return;

    for (const gz of groundZones) {
      if (!gz) continue;
      const r = Math.max(8, Math.round(gz.radius || 70));
      const pad = r + 40;
      if (typeof isWorldInViewport === 'function' && !isWorldInViewport(gz.x, gz.y, camLeft, camTop, pad, pad)) {
        continue;
      }

      const gx = Math.round(gz.x - camLeft);
      const gy = Math.round(gz.y - camTop);
      const ry = Math.max(5, Math.round(r * 0.65));
      const maxAge = gz.maxAge || 6.0;
      const age = gz.age || 0;
      const fadeIn = clamp01(age / 0.14);
      const fadeOut = maxAge > 0.35 && maxAge - age < 0.25 ? clamp01((maxAge - age) / 0.25) : 1;
      const fade = Math.min(fadeIn || 1, fadeOut);

      switch (gz.type) {
        case 'consecration':
          drawZoneConsecration(ctx, gx, gy, r, ry, gz, globalTime, fade);
          break;
        case 'plague':
          drawZonePlague(ctx, gx, gy, r, ry, gz, globalTime, fade);
          break;
        case 'briar':
          drawZoneBriar(ctx, gx, gy, r, ry, gz, globalTime, fade);
          break;
        case 'gravity':
        case 'singularity':
          drawZoneGravity(ctx, gx, gy, r, ry, gz, globalTime, fade);
          break;
        case 'frost_ring':
          drawZoneFrostRing(ctx, gx, gy, r, ry, gz, globalTime, fade);
          break;
        case 'shockwave':
          drawZoneShockwave(ctx, gx, gy, r, gz);
          break;
        case 'sanguine_pool':
          drawZoneSanguinePool(ctx, gx, gy, r, ry, gz, globalTime, fade);
          break;
        case 'telegraph':
          drawZoneTelegraph(ctx, gx, gy, r, ry, gz, globalTime, activeTextCtx, worldToScreen, fillCrispShadowText);
          break;
        default:
          drawZoneShockwave(ctx, gx, gy, r, gz);
          break;
      }
    }
  }

  /**
   * Render vertical elemental sky beams with true hex color atmospheric glow, pillar, core, and ground scorch ring.
   */
  function drawSkyBeams(ctx, { skyBeams, camLeft = 0, camTop = 0, globalTime = 0 } = {}) {
    if (!ctx || !Array.isArray(skyBeams) || skyBeams.length === 0) return;

    ctx.save();
    for (const sb of skyBeams) {
      if (!sb) continue;
      const sx = Math.round(sb.x - camLeft);
      const sy = Math.round(sb.y - camTop);
      const prog = clamp01((sb.age || 0) / Math.max(0.01, sb.maxAge || 0.45));
      const fade = 1 - prog * prog;
      const color = sb.color || '#facc15';
      const w = Math.max(2, Math.round(16 * (1 - prog * 0.72)));

      // 1. Outer atmospheric glow beam
      const outerW = Math.round(w * 2.5);
      ctx.fillStyle = hexToRgba(color, 0.22 * fade);
      ctx.fillRect(sx - outerW, 0, outerW * 2, sy);

      // 2. Mid elemental pillar
      const midW = Math.round(w * 1.25);
      ctx.fillStyle = hexToRgba(color, 0.60 * fade);
      ctx.fillRect(sx - midW, 0, midW * 2, sy);

      // 3. Crisp white core
      const coreW = Math.max(2, Math.round(w * 0.65));
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.95 * fade).toFixed(3)})`;
      ctx.fillRect(sx - Math.floor(coreW / 2), 0, coreW, sy);

      // Rising plasma sparks along the beam column
      for (let k = 0; k < 4; k++) {
        const sparkY = Math.round(sy - ((globalTime * 190 + k * 42 + sb.x) % Math.max(24, sy)));
        const sparkX = sx + ((k % 2 === 0 ? -1 : 1) * (w + 2));
        ctx.fillStyle = hexToRgba(color, 0.75 * fade);
        ctx.fillRect(sparkX, sparkY, 2, 3);
      }

      // 4. Expanding ground scorch / shock ring at (sx, sy)
      const scorchR = Math.round(10 + prog * 12);
      drawIsoEllipse(ctx, sx, sy, scorchR, Math.round(scorchR * 0.58));
      ctx.fillStyle = `rgba(9, 13, 22, ${(0.45 * fade).toFixed(3)})`;
      ctx.fill();

      const shockR = Math.round(8 + prog * 28);
      drawIsoEllipse(ctx, sx, sy, shockR, Math.round(shockR * 0.58));
      ctx.strokeStyle = hexToRgba(color, 0.90 * fade);
      ctx.lineWidth = Math.max(1, 2.5 * fade);
      ctx.stroke();

      if (prog < 0.5) {
        const flashA = (1 - prog * 2) * 0.9;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashA.toFixed(3)})`;
        ctx.fillRect(sx - 6, sy - 1, 12, 2);
        ctx.fillRect(sx - 1, sy - 4, 2, 8);
      }
    }
    ctx.restore();
  }

  function drawProjectileTrail(ctx, sx, sy, angle, color, isHeavy = false) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const dist = s * (isHeavy ? 4.2 : 3.6);
      const tx = Math.round(sx - cos * dist);
      const ty = Math.round(sy - sin * dist);
      const sz = Math.max(1, (isHeavy ? 5 : 4) - s);
      const half = Math.floor(sz / 2);
      ctx.fillStyle = hexToRgba(color, 0.55 - s * 0.11);
      ctx.fillRect(tx - half, ty - half, sz, sz);
      if (s === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(tx, ty, 1, 1);
      }
    }
  }

  function drawProjectileSilhouette(ctx, p, sx, sy, angle, globalTime) {
    const type = p.type || 'orb';
    const color = p.color || '#38bdf8';

    switch (type) {
      case 'hammer': {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.rot || globalTime * 14);
        ctx.fillStyle = '#070a12';
        ctx.fillRect(-6, -7, 12, 7);
        ctx.fillRect(-2, -1, 4, 7);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-1, -5, 2, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -6, 10, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -5, 8, 2);
        ctx.restore();
        break;
      }
      case 'boulder': {
        ctx.fillStyle = '#070a12';
        ctx.fillRect(sx - 5, sy - 5, 10, 10);
        ctx.fillStyle = '#57534e';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = '#78716c';
        ctx.fillRect(sx - 3, sy - 4, 5, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx - 3, sy - 3, 4, 2);
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(sx - 2, sy - 3, 2, 1);
        break;
      }
      case 'void_orb': {
        const pulse = 1 + Math.sin(globalTime * 12) * 0.15;
        ctx.fillStyle = 'rgba(107, 33, 168, 0.35)';
        ctx.fillRect(sx - 6, sy - 6, 12, 12);
        ctx.fillStyle = '#1e0836';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = '#7e22ce';
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.fillStyle = pulse > 1 ? '#f0abfc' : '#c084fc';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, 1, 1);
        break;
      }
      case 'aether_orb': {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((p.rot || globalTime * 8) * 0.5);
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(-4, -4, 8, 8);
        ctx.fillStyle = color;
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-1, -4, 2, 8);
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
        break;
      }
      case 'spear':
      case 'solar_lance': {
        const isSolar = type === 'solar_lance';
        const tipColor = isSolar ? '#facc15' : (p.color || '#bae6fd');
        const shaftColor = isSolar ? '#fb923c' : '#94a3b8';
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillStyle = '#070a12';
        ctx.fillRect(-9, -2, 16, 4);
        ctx.fillStyle = shaftColor;
        ctx.fillRect(-8, -1, 11, 2);
        ctx.fillStyle = tipColor;
        ctx.fillRect(2, -2, 4, 4);
        ctx.fillRect(6, -1, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -1, 4, 1);
        ctx.restore();
        break;
      }
      case 'dagger': {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillStyle = '#070a12';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-5, -1, 3, 2);
        ctx.fillStyle = color || '#c084fc';
        ctx.fillRect(-2, -2, 2, 4);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, -1, 5, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, -1, 4, 1);
        ctx.restore();
        break;
      }
      case 'shard': {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(-6, -3, 12, 6);
        ctx.fillStyle = color || '#38bdf8';
        ctx.fillRect(-4, -2, 8, 4);
        ctx.fillRect(4, -1, 3, 2);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-2, -1, 7, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, -1, 3, 1);
        ctx.restore();
        break;
      }
      case 'orb':
      default: {
        ctx.fillStyle = hexToRgba(color, 0.30);
        ctx.fillRect(sx - 5, sy - 5, 10, 10);
        ctx.fillStyle = '#070a12';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = color;
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
        break;
      }
    }
  }

  /**
   * Render tapered pixel trails and distinct silhouettes for all projectile types.
   */
  function drawProjectiles(ctx, { projectiles, camLeft = 0, camTop = 0, globalTime = 0, isWorldInViewport = null } = {}) {
    if (!ctx || !Array.isArray(projectiles) || projectiles.length === 0) return;

    projFrameCounter += 1;
    ctx.save();
    for (const p of projectiles) {
      if (!p) continue;
      if (typeof isWorldInViewport === 'function' && !isWorldInViewport(p.x, p.y, camLeft, camTop, 36, 36)) {
        continue;
      }

      const sx = Math.round(p.x - camLeft);
      const sy = Math.round(p.y - camTop);
      const { angle, hasMotion } = resolveProjectileAngle(p);
      const trailColor = p.color || (
        p.type === 'hammer' ? '#facc15' :
        p.type === 'boulder' ? '#4ade80' :
        p.type === 'void_orb' ? '#c084fc' :
        p.type === 'solar_lance' ? '#fbbf24' :
        '#38bdf8'
      );

      if (hasMotion) {
        drawProjectileTrail(ctx, sx, sy, angle, trailColor, p.type === 'boulder' || p.type === 'hammer');
      }
      drawProjectileSilhouette(ctx, p, sx, sy, angle, globalTime);
    }
    ctx.restore();
    pruneProjectileCache();
  }

  /**
   * Render smooth tapered pixel crescent sweeps for melee & wave slash arcs.
   */
  function drawSlashArcs(ctx, { slashArcs, camLeft = 0, camTop = 0 } = {}) {
    if (!ctx || !Array.isArray(slashArcs) || slashArcs.length === 0) return;

    const segs = 12;
    const halfSpan = 0.88;
    ctx.save();
    for (const sa of slashArcs) {
      if (!sa) continue;
      const sx = Math.round(sa.x - camLeft);
      const sy = Math.round(sa.y - camTop);
      const prog = clamp01((sa.age || 0) / Math.max(0.01, sa.maxAge || 0.22));
      const fade = 1 - prog * prog;
      const rad = 17 + prog * 9;
      const color = sa.color || '#facc15';
      const maxThick = 6 * (1 - prog * 0.35);

      // Build outer glowing crescent + main crescent
      for (let pass = 0; pass < 2; pass++) {
        const thickScale = pass === 0 ? 1.45 : 1.0;
        const innerScale = pass === 0 ? 0.55 : 0.35;
        ctx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const u = i / segs;
          const a = sa.angle - halfSpan + u * halfSpan * 2;
          const bell = Math.sin(u * Math.PI);
          const rOut = rad + bell * maxThick * thickScale;
          const px = sx + Math.cos(a) * rOut;
          const py = sy + Math.sin(a) * rOut * 0.80;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        for (let i = segs; i >= 0; i--) {
          const u = i / segs;
          const a = sa.angle - halfSpan + u * halfSpan * 2;
          const bell = Math.sin(u * Math.PI);
          const rIn = rad - bell * maxThick * innerScale;
          const px = sx + Math.cos(a) * rIn;
          const py = sy + Math.sin(a) * rIn * 0.80;
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = pass === 0
          ? hexToRgba(color, 0.34 * fade)
          : hexToRgba(color, 0.86 * fade);
        ctx.fill();
      }

      // Bright white cutting edge along leading curve
      ctx.beginPath();
      for (let i = 2; i <= segs - 2; i++) {
        const u = i / segs;
        const a = sa.angle - halfSpan + u * halfSpan * 2;
        const bell = Math.sin(u * Math.PI);
        const rEdge = rad + bell * maxThick * 0.88;
        const px = sx + Math.cos(a) * rEdge;
        const py = sy + Math.sin(a) * rEdge * 0.80;
        if (i === 2) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.95 * fade).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tip sparks
      for (const side of [-1, 1]) {
        const aTip = sa.angle + side * halfSpan * 0.85;
        const tx = Math.round(sx + Math.cos(aTip) * (rad + 2));
        const ty = Math.round(sy + Math.sin(aTip) * (rad + 2) * 0.80);
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.75 * fade).toFixed(3)})`;
        ctx.fillRect(tx, ty, 2, 2);
      }
    }
    ctx.restore();
  }

  /**
   * Render sleek isometric pixel-art ground rings, orbiting sigils, and crystal freeze shards
   * replacing raw strokeRect boxes on players and remote heroes.
   */
  function drawEntityAuraRings(ctxArg, opts = {}) {
    const ctx = ctxArg || opts.ctx;
    if (!ctx) return;
    const sx = Math.round(opts.sx ?? 0);
    const sy = Math.round(opts.sy ?? 0);
    const state = opts.state || opts;
    const globalTime = opts.globalTime ?? 0;

    ctx.save();

    // 1. Squad / Hostile tactical ring
    if (state.inSquad) {
      drawIsoEllipse(ctx, sx, sy, 12, 5);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
      for (let k = 0; k < 2; k++) {
        const a = globalTime * 2.2 + k * Math.PI;
        ctx.fillStyle = '#bbf7d0';
        ctx.fillRect(Math.round(sx + Math.cos(a) * 12), Math.round(sy + Math.sin(a) * 5), 2, 2);
      }
    } else if (state.hostile) {
      drawIsoEllipse(ctx, sx, sy, 12, 5);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.88)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(sx - 13, sy, 2, 1);
      ctx.fillRect(sx + 12, sy, 2, 1);
    }

    // 2. Zenith / Casting solar halo ring
    if (state.zenith) {
      drawIsoEllipse(ctx, sx, sy, 14, 6);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const a = globalTime * 3.0 + (k * Math.PI) / 2;
        const mx = Math.round(sx + Math.cos(a) * 14);
        const my = Math.round(sy + Math.sin(a) * 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx - 1, my - 1, 2, 2);
      }
    }

    // 3. Thornbark earthen bramble aura
    if (state.thornbark) {
      drawIsoEllipse(ctx, sx, sy, 13, 5.5);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const a = globalTime * 1.4 + (k * Math.PI) / 3;
        const tx = Math.round(sx + Math.cos(a) * 14);
        const ty = Math.round(sy + Math.sin(a) * 6);
        ctx.fillStyle = k % 2 === 0 ? '#4ade80' : '#14532d';
        ctx.fillRect(tx - 1, ty - 1, 2, 2);
      }
    }

    // 4. Voidform shadow wisp ring
    if (state.voidform) {
      drawIsoEllipse(ctx, sx, sy, 14, 6);
      ctx.fillStyle = 'rgba(88, 28, 135, 0.24)';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.25;
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const lift = (globalTime * 16 + k * 5) % 16;
        const a = globalTime * 2.5 + (k * Math.PI) / 2;
        const wx = Math.round(sx + Math.cos(a) * 12);
        const wy = Math.round(sy - lift);
        ctx.fillStyle = k % 2 === 0 ? '#a855f7' : '#e879f9';
        ctx.fillRect(wx, wy, 2, 2);
      }
    }

    // 5. Treant Form ancient nature sigil ring
    if (state.treantForm) {
      drawIsoEllipse(ctx, sx, sy, 15, 6.5);
      ctx.fillStyle = 'rgba(132, 204, 22, 0.14)';
      ctx.fill();
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = -globalTime * 2.2 + (k * Math.PI * 2) / 3;
        const lx = Math.round(sx + Math.cos(a) * 14);
        const ly = Math.round(sy - 8 + Math.sin(a) * 6);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(lx - 1, ly - 1, 3, 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(lx, ly - 1, 1, 1);
      }
    }

    // 6. Temporal Apotheosis chrono-ring & orbiting star motes
    if (state.temporalApotheosis) {
      drawIsoEllipse(ctx, sx, sy, 15, 6.5);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawIsoEllipse(ctx, sx, sy, 11, 4.5);
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.85)';
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = globalTime * 4.8 + (k * Math.PI * 2) / 3;
        const cx = Math.round(sx + Math.cos(a) * 14);
        const cy = Math.round(sy - 10 + Math.sin(a) * 6);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(cx - 1, cy - 1, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, cy, 1, 1);
      }
    }

    // 7. Frozen icy crystal prison shards (replaces flat blue strokeRect)
    if (state.frozen) {
      drawIsoEllipse(ctx, sx, sy, 11, 4.5);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // Left, right, and lower pixel crystal spikes encasing hero
      const shards = [
        { ox: -10, oy: -12, w: 4, h: 11 },
        { ox: 6, oy: -13, w: 4, h: 12 },
        { ox: -5, oy: -6, w: 3, h: 7 },
        { ox: 3, oy: -6, w: 3, h: 7 },
      ];
      for (const sh of shards) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(sx + sh.ox, sy + sh.oy, sh.w, sh.h);
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(sx + sh.ox + 1, sy + sh.oy + 1, Math.max(1, sh.w - 2), Math.max(1, sh.h - 2));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + sh.ox + 1, sy + sh.oy + 1, 1, 2);
      }
      // Top crystal crown glint
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(sx - 1, sy - 21, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy - 22, 1, 1);
    }

    ctx.restore();
  }

  return {
    drawGroundZones,
    drawSkyBeams,
    drawProjectiles,
    drawSlashArcs,
    drawEntityAuraRings,
  };
}
