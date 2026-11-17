// ==========================================
// GlimmerFall Online — Animated Ambient Dressing Renderer
// Deterministic per world cell so scenery never pops between frames.
// ==========================================

const AMBIENT_SEA_CELL = 44;
const AMBIENT_STACK_CELL = 190;
const AMBIENT_GROUND_CELL = 46;
const AMBIENT_MOTE_CELL = 68;

function ambientHash(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function createAmbientRenderer({
  ctx,
  TILE_SIZE,
  getGlobalTime,
  getMapBounds,
  getViewSize,
  getCurrentBiomeTheme,
}) {
  function drawSeaStack(sx, sy, h, t) {
    const w = 8 + Math.floor(h * 10);
    const hgt = 7 + Math.floor(h * 12);
    const left = Math.round(sx - w / 2);
    const top = Math.round(sy - hgt);

    ctx.fillStyle = '#050b16';
    ctx.fillRect(left, top, w, hgt);
    ctx.fillRect(left - 2, sy - 3, w + 4, 3);
    ctx.fillStyle = '#12233b';
    ctx.fillRect(left + 2, top + 2, Math.max(1, w - 4), Math.max(1, hgt - 4));
    ctx.fillRect(left - 1, sy - 2, w + 2, 1);
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(left + Math.max(1, Math.floor(w / 2) - 1), top + 3, 2, Math.max(1, hgt - 5));
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(left + 2, top + 1, 3, 1);

    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + h * 30);
    ctx.fillStyle = `rgba(125, 211, 252, ${0.10 + pulse * 0.12})`;
    ctx.fillRect(left - 3, sy, w + 6, 1);
    ctx.fillRect(left - 1, sy + 2, w + 2, 1);
    if (h > 0.7) {
      ctx.fillStyle = `rgba(224, 242, 254, ${0.25 + pulse * 0.35})`;
      ctx.fillRect(left + Math.floor(w / 2), top + 2, 1, 1);
    }
  }

  function drawSeaAmbient(camLeft, camTop) {
    if (getCurrentBiomeTheme().startsWith('interior_')) return;
    const t = getGlobalTime();
    const { halfW, halfH } = getMapBounds();
    const { viewW, viewH } = getViewSize();
    const step = 24;

    const northY = Math.round(-halfH - camTop);
    if (northY > -16 && northY < viewH + 16) {
      const from = Math.max(-halfW, camLeft - step);
      const to = Math.min(halfW, camLeft + viewW + step);
      for (let wx = Math.ceil(from / step) * step; wx <= to; wx += step) {
        const sx = Math.round(wx - camLeft);
        const ph = Math.sin(t * 2.3 + wx * 0.055);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(sx, northY - 3, 9 + Math.round((ph + 1) * 4), 1);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(sx + 3, northY - 5, 4 + Math.round((ph + 1) * 2), 1);
      }
    }
    const southY = Math.round(halfH - camTop);
    if (southY > -16 && southY < viewH + 16) {
      const from = Math.max(-halfW, camLeft - step);
      const to = Math.min(halfW, camLeft + viewW + step);
      for (let wx = Math.ceil(from / step) * step; wx <= to; wx += step) {
        const sx = Math.round(wx - camLeft);
        const ph = Math.sin(t * 2.3 + wx * 0.055 + 1.7);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(sx, southY + 2, 9 + Math.round((ph + 1) * 4), 1);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(sx + 3, southY + 4, 4 + Math.round((ph + 1) * 2), 1);
      }
    }
    const westX = Math.round(-halfW - camLeft);
    if (westX > -16 && westX < viewW + 16) {
      const from = Math.max(-halfH, camTop - step);
      const to = Math.min(halfH, camTop + viewH + step);
      for (let wy = Math.ceil(from / step) * step; wy <= to; wy += step) {
        const sy = Math.round(wy - camTop);
        const ph = Math.sin(t * 2.3 + wy * 0.055 + 3.1);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(westX - 3, sy, 1, 9 + Math.round((ph + 1) * 4));
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(westX - 5, sy + 3, 1, 4 + Math.round((ph + 1) * 2));
      }
    }
    const eastX = Math.round(halfW - camLeft);
    if (eastX > -16 && eastX < viewW + 16) {
      const from = Math.max(-halfH, camTop - step);
      const to = Math.min(halfH, camTop + viewH + step);
      for (let wy = Math.ceil(from / step) * step; wy <= to; wy += step) {
        const sy = Math.round(wy - camTop);
        const ph = Math.sin(t * 2.3 + wy * 0.055 + 4.6);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fillRect(eastX + 2, sy, 1, 9 + Math.round((ph + 1) * 4));
        ctx.fillStyle = 'rgba(224, 242, 254, 0.30)';
        ctx.fillRect(eastX + 4, sy + 3, 1, 4 + Math.round((ph + 1) * 2));
      }
    }

    const seaCell = AMBIENT_SEA_CELL;
    const sgx0 = Math.floor((camLeft - seaCell) / seaCell);
    const sgx1 = Math.floor((camLeft + viewW + seaCell) / seaCell);
    const sgy0 = Math.floor((camTop - seaCell) / seaCell);
    const sgy1 = Math.floor((camTop + viewH + seaCell) / seaCell);
    for (let gy = sgy0; gy <= sgy1; gy++) {
      for (let gx = sgx0; gx <= sgx1; gx++) {
        const h = ambientHash(gx, gy, 11);
        if (h > 0.22) continue;
        const wx = gx * seaCell + 5 + ambientHash(gx, gy, 12) * (seaCell - 10);
        const wy = gy * seaCell + 5 + ambientHash(gx, gy, 13) * (seaCell - 10);
        if (wx >= -halfW && wx < halfW && wy >= -halfH && wy < halfH) continue;
        const sx = Math.round(wx - camLeft);
        const sy = Math.round(wy - camTop);
        if (sx < -8 || sx > viewW + 8 || sy < -8 || sy > viewH + 8) continue;

        const shimmer = 0.5 + 0.5 * Math.sin(t * 1.7 + h * 37 + gx * 0.8);
        ctx.fillStyle = `rgba(125, 211, 252, ${0.06 + shimmer * 0.12})`;
        ctx.fillRect(sx, sy, 3 + Math.round(shimmer * 4), 1);
        if (shimmer > 0.86) {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
          ctx.fillRect(sx + 2, sy - 1, 1, 1);
        }
      }
    }

    const stackCell = AMBIENT_STACK_CELL;
    const stx0 = Math.floor((camLeft - stackCell) / stackCell);
    const stx1 = Math.floor((camLeft + viewW + stackCell) / stackCell);
    const sty0 = Math.floor((camTop - stackCell) / stackCell);
    const sty1 = Math.floor((camTop + viewH + stackCell) / stackCell);
    for (let gy = sty0; gy <= sty1; gy++) {
      for (let gx = stx0; gx <= stx1; gx++) {
        const h = ambientHash(gx, gy, 21);
        if (h > 0.17) continue;
        const wx = gx * stackCell + 16 + ambientHash(gx, gy, 22) * (stackCell - 32);
        const wy = gy * stackCell + 16 + ambientHash(gx, gy, 23) * (stackCell - 32);
        if (wx >= -halfW && wx < halfW && wy >= -halfH && wy < halfH) continue;
        const shore = Math.max(-halfW - wx, wx - halfW, -halfH - wy, wy - halfH);
        if (shore < 20 || shore > 190) continue;
        const sx = Math.round(wx - camLeft);
        const sy = Math.round(wy - camTop);
        if (sx < -24 || sx > viewW + 24 || sy < -28 || sy > viewH + 12) continue;
        drawSeaStack(sx, sy, ambientHash(gx, gy, 24), t);
      }
    }
  }

  function ambientGroundKind() {
    switch (getCurrentBiomeTheme()) {
      case 'sanctuary':
      case 'terra':
      case 'terra_grove': return 'grass';
      case 'umbri':
      case 'abyssal':
      case 'umbri_labyrinth': return 'glowcap';
      case 'solari':
      case 'starfall':
      case 'solari_vault': return 'sunleaf';
      case 'aether':
      case 'aether_archive': return 'crystal';
      case 'celestial': return 'starlight';
      case 'ruins': return 'pebble';
      case 'warzone': return 'ash';
      default: return 'none';
    }
  }

  function ambientGroundAllowed(wx, wy) {
    const { halfW, halfH } = getMapBounds();
    const edge = Math.min(halfW - Math.abs(wx), halfH - Math.abs(wy));
    if (edge < 24) return false;
    if (Math.abs(wx) < 56 || Math.abs(wy) < 56) return false;

    const tx = Math.floor(wx / TILE_SIZE);
    const ty = Math.floor(wy / TILE_SIZE);

    switch (getCurrentBiomeTheme()) {
      case 'sanctuary':
        if (Math.abs(tx) <= 3 || Math.abs(ty) <= 3) return false;
        if (Math.abs(tx) <= 7 && Math.abs(ty) <= 7) return false;
        if (tx >= 11 && tx <= 25 && ty >= -18 && ty <= -7) return false;
        if (tx >= -26 && tx <= -11 && ty >= -18 && ty <= -7) return false;
        if (ty >= -22 && ty <= -19 && Math.abs(tx) <= 35) return false;
        if (tx >= 14 && tx <= 28 && ty >= 10 && ty <= 18) return false;
        return true;
      case 'terra':
      case 'umbri':
      case 'solari':
      case 'aether':
      case 'starfall':
      case 'abyssal':
        return Math.abs(tx) > 2 && Math.abs(ty) > 2;
      case 'terra_grove': {
        const d2 = tx * tx + ty * ty;
        if ((d2 >= 25 && d2 <= 49) || (d2 >= 144 && d2 <= 196) || Math.abs(tx) <= 1) return false;
        return true;
      }
      case 'umbri_labyrinth': {
        const cellX = Math.floor(tx / 4);
        const cellY = Math.floor(ty / 4);
        return !((cellX + cellY) % 2 === 0 || Math.abs(tx) <= 1 || Math.abs(ty) <= 1);
      }
      case 'aether_archive':
        if (Math.abs(tx) <= 2 || Math.abs(ty) <= 2) return false;
        if (Math.abs(tx) % 6 <= 1 && Math.abs(ty) % 6 <= 1) return false;
        return true;
      case 'solari_vault':
        if (Math.abs(tx) <= 3 && Math.abs(ty) <= 3) return false;
        if ((Math.abs(tx) + Math.abs(ty)) % 5 === 0 || Math.abs(tx) <= 1) return false;
        return true;
      case 'ruins':
      case 'celestial':
        return true;
      case 'warzone':
        return edge < 170;
      default:
        return false;
    }
  }

  function drawGroundDetail(kind, sx, sy, h, t) {
    const theme = getCurrentBiomeTheme();
    switch (kind) {
      case 'grass': {
        const lush = theme !== 'sanctuary';
        const sway = Math.round(Math.sin(t * 2.2 + h * 31));
        ctx.fillStyle = 'rgba(3, 8, 14, 0.38)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = lush ? '#166534' : '#14532d';
        ctx.fillRect(sx - 2 + sway, sy - 3, 1, 3);
        ctx.fillRect(sx + 1 - sway, sy - 5, 1, 5);
        ctx.fillRect(sx + 3, sy - 2, 1, 2);
        ctx.fillStyle = lush ? '#4ade80' : '#22c55e';
        ctx.fillRect(sx - 2 + sway, sy - 4, 1, 1);
        ctx.fillRect(sx + 1 - sway, sy - 6, 1, 1);
        ctx.fillRect(sx + 3, sy - 3, 1, 1);
        if (lush && h < 0.36) {
          // Lush Terra fern frond / clover moss cluster
          ctx.fillStyle = '#15803d';
          ctx.fillRect(sx - 4, sy - 2, 2, 2);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(sx - 4, sy - 3, 1, 1);
        }
        if (h > 0.76) {
          const petal = lush ? (h > 0.88 ? '#bef264' : '#fde047') : (h > 0.89 ? '#7dd3fc' : '#fde047');
          ctx.fillStyle = petal;
          ctx.fillRect(sx, sy - 7, 1, 1);
          ctx.fillRect(sx - 1, sy - 6, 1, 1);
          ctx.fillRect(sx + 1, sy - 6, 1, 1);
          ctx.fillRect(sx, sy - 5, 1, 1);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(sx, sy - 6, 1, 1);
          // Fallen blossom speck nearby
          ctx.fillStyle = petal;
          ctx.fillRect(sx + 4, sy + 1, 1, 1);
        }
        break;
      }
      case 'glowcap': {
        const isAbyssal = theme === 'abyssal';
        const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.6 + h * 40));
        ctx.fillStyle = isAbyssal
          ? `rgba(45, 212, 191, ${0.07 + pulse * 0.10})`
          : `rgba(168, 85, 247, ${0.08 + pulse * 0.10})`;
        ctx.fillRect(sx - 5, sy - 6, 11, 1);
        ctx.fillRect(sx - 3, sy - 7, 7, 1);
        ctx.fillStyle = 'rgba(3, 8, 14, 0.42)';
        ctx.fillRect(sx - 4, sy, 9, 1);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(sx - 2, sy - 2, 1, 3);
        ctx.fillRect(sx + 2, sy - 3, 1, 4);
        ctx.fillStyle = isAbyssal ? '#4c1d95' : '#6b21a8';
        ctx.fillRect(sx - 4, sy - 4, 4, 2);
        ctx.fillRect(sx, sy - 5, 5, 2);
        ctx.fillStyle = isAbyssal ? '#2dd4bf' : '#c084fc';
        ctx.fillRect(sx - 3, sy - 5, 2, 1);
        ctx.fillRect(sx + 1, sy - 6, 2, 1);
        ctx.fillStyle = isAbyssal ? '#99f6e4' : '#f0abfc';
        ctx.fillRect(sx - 3, sy - 5, 1, 1);
        ctx.fillRect(sx + 2, sy - 6, 1, 1);
        // Rising necrotic/bioluminescent spore mote
        const drift = (t * 6 + h * 24) % 14;
        ctx.fillStyle = isAbyssal
          ? `rgba(94, 234, 212, ${(1 - drift / 14) * 0.65})`
          : `rgba(216, 180, 254, ${(1 - drift / 14) * 0.65})`;
        ctx.fillRect(sx + Math.round(Math.sin(t * 2 + h * 15) * 2), Math.round(sy - 7 - drift), 1, 1);
        break;
      }
      case 'sunleaf': {
        const isStarfall = theme === 'starfall';
        const sway = Math.round(Math.sin(t * 2.4 + h * 23));
        ctx.fillStyle = 'rgba(3, 8, 14, 0.35)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        if (isStarfall && h < 0.45) {
          // Scorched basalt crater shard with starfire crack
          ctx.fillStyle = '#1e1b2e';
          ctx.fillRect(sx - 3, sy - 3, 6, 3);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(sx - 2, sy - 2, 3, 1);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(sx - 1, sy - 2, 1, 1);
        } else {
          ctx.fillStyle = '#713f12';
          ctx.fillRect(sx - 2, sy - 3, 1, 3);
          ctx.fillRect(sx + 1, sy - 4, 1, 4);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(sx - 2 + sway, sy - 4, 1, 1);
          ctx.fillRect(sx + 1 - sway, sy - 5, 1, 1);
          if (h > 0.72) {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(sx + sway, sy - 6, 1, 1);
          }
        }
        const rise = (t * 8 + h * 30) % 18;
        const a = 1 - rise / 18;
        ctx.fillStyle = `rgba(251, 146, 60, ${0.15 + a * 0.55})`;
        ctx.fillRect(sx + 3, Math.round(sy - 6 - rise), 1, 1);
        break;
      }
      case 'crystal': {
        const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.0 + h * 27));
        const bob = Math.round(Math.sin(t * 1.6 + h * 14));
        ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
        ctx.fillRect(sx - 4, sy - 9 + bob, 9, 1);
        ctx.fillStyle = 'rgba(3, 8, 14, 0.42)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(sx - 2, sy - 6 + bob, 4, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx - 1, sy - 5 + bob, 2, 5);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(sx - 1, sy - 5 + bob, 1, 3);
        // Tiny orbiting rune pixel around shard tip
        const rx = sx + Math.round(Math.cos(t * 2.4 + h * 19) * 4);
        const ry = sy - 9 + bob + Math.round(Math.sin(t * 2.4 + h * 19) * 2);
        ctx.fillStyle = `rgba(125, 211, 252, ${0.35 + pulse * 0.50})`;
        ctx.fillRect(rx, ry, 1, 1);
        break;
      }
      case 'starlight': {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.8 + h * 41));
        const bob = Math.round(Math.sin(t * 1.7 + h * 11) * 2);
        ctx.fillStyle = `rgba(254, 240, 138, ${0.08 + pulse * 0.10})`;
        ctx.fillRect(sx - 4, sy - 7 + bob, 9, 1);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx, sy - 7 + bob, 1, 5);
        ctx.fillRect(sx - 2, sy - 5 + bob, 5, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy - 5 + bob, 1, 1);
        break;
      }
      case 'pebble': {
        ctx.fillStyle = 'rgba(3, 8, 14, 0.40)';
        ctx.fillRect(sx - 2, sy, 5, 1);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx - 2, sy - 2, 4, 2);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx - 1, sy - 2, 2, 1);
        if (h > 0.7) {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.35)';
          ctx.fillRect(sx + 3, sy - 4, 1, 1);
        }
        break;
      }
      case 'ash': {
        const flicker = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 5.2 + h * 33));
        const emberRise = (t * 9 + h * 21) % 12;
        ctx.fillStyle = 'rgba(3, 6, 12, 0.48)';
        ctx.fillRect(sx - 3, sy, 7, 1);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx - 2, sy - 1, 5, 2);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx - 1, sy - 2, 3, 1);
        ctx.fillStyle = `rgba(249, 115, 22, ${flicker})`;
        ctx.fillRect(sx + 1, sy - 3, 1, 1);
        ctx.fillStyle = `rgba(253, 224, 71, ${(1 - emberRise / 12) * 0.65})`;
        ctx.fillRect(sx - 1, Math.round(sy - 4 - emberRise), 1, 1);
        break;
      }
      default:
        break;
    }
  }

  function drawGroundAmbient(camLeft, camTop) {
    const kind = ambientGroundKind();
    if (kind === 'none') return;
    const t = getGlobalTime();
    const { halfW, halfH } = getMapBounds();
    const { viewW, viewH } = getViewSize();
    const cell = AMBIENT_GROUND_CELL;
    const gx0 = Math.floor((camLeft - cell) / cell);
    const gx1 = Math.floor((camLeft + viewW + cell) / cell);
    const gy0 = Math.floor((camTop - cell) / cell);
    const gy1 = Math.floor((camTop + viewH + cell) / cell);

    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const h = ambientHash(gx, gy, 31);
        const h2 = ambientHash(gx, gy, 32);
        const wx = gx * cell + 5 + h2 * (cell - 10);
        const wy = gy * cell + 5 + ambientHash(gx, gy, 33) * (cell - 10);
        if (!ambientGroundAllowed(wx, wy)) continue;

        const edge = Math.min(halfW - Math.abs(wx), halfH - Math.abs(wy));
        const density = edge < 132 ? 0.46 : 0.18;
        if (h > density) continue;

        const sx = Math.round(wx - camLeft);
        const sy = Math.round(wy - camTop);
        if (sx < -12 || sx > viewW + 12 || sy < -16 || sy > viewH + 12) continue;
        drawGroundDetail(kind, sx, sy, h2, t);
      }
    }
  }

  function ambientMotePalette() {
    switch (getCurrentBiomeTheme()) {
      case 'sanctuary': return ['#fda4af', '#fde68a', '#a7f3d0'];
      case 'terra':
      case 'terra_grove': return ['#bef264', '#4ade80', '#fde047'];
      case 'umbri':
      case 'umbri_labyrinth': return ['#c084fc', '#e9d5ff', '#a855f7'];
      case 'abyssal': return ['#e879f9', '#a855f7', '#38bdf8'];
      case 'solari':
      case 'solari_vault': return ['#fbbf24', '#fef08a', '#fb923c'];
      case 'starfall': return ['#fb923c', '#fde047', '#38bdf8'];
      case 'aether':
      case 'aether_archive': return ['#7dd3fc', '#e0f2fe', '#818cf8'];
      case 'warzone': return ['#fb923c', '#fbbf24', '#fde68a'];
      case 'ruins': return ['#94a3b8', '#7dd3fc'];
      case 'celestial': return ['#fef08a', '#ffffff'];
      case 'interior_tavern': return ['#fde68a', '#fb923c', '#fef3c7'];
      case 'interior_vault': return ['#facc15', '#7dd3fc'];
      case 'interior_cottage': return ['#fef3c7', '#fde68a'];
      case 'interior_solari': return ['#fbbf24', '#fb923c'];
      case 'interior_terra': return ['#bef264', '#86efac'];
      case 'interior_umbri': return ['#c084fc', '#e879f9'];
      case 'interior_aether': return ['#7dd3fc', '#e0f2fe'];
      default: return ['#cbd5e1', '#7dd3fc'];
    }
  }

  function resolveBiomeMoteKind(biome) {
    if (biome === 'umbri' || biome === 'umbri_labyrinth' || biome === 'abyssal') return 'shadow_wisp';
    if (biome === 'terra' || biome === 'terra_grove') return 'blossom_petal';
    if (biome === 'aether' || biome === 'aether_archive') return 'arcane_rune';
    if (biome === 'solari' || biome === 'solari_vault' || biome === 'starfall' || biome === 'warzone') return 'golden_ember';
    return 'default';
  }

  function drawAirMotes(camLeft, camTop) {
    const t = getGlobalTime();
    const biome = getCurrentBiomeTheme();
    const moteKind = resolveBiomeMoteKind(biome);
    const { halfW, halfH } = getMapBounds();
    const { viewW, viewH } = getViewSize();
    const palette = ambientMotePalette();
    const cell = AMBIENT_MOTE_CELL;
    const gx0 = Math.floor(camLeft / cell) - 1;
    const gx1 = Math.floor((camLeft + viewW) / cell) + 1;
    const gy0 = Math.floor(camTop / cell) - 1;
    const gy1 = Math.floor((camTop + viewH) / cell) + 1;

    ctx.save();
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const h = ambientHash(gx, gy, 51);
        if (h > 0.46) continue;
        const h2 = ambientHash(gx, gy, 52);
        const h3 = ambientHash(gx, gy, 53);
        const wx = gx * cell + 6 + h2 * (cell - 12);
        const wy = gy * cell + 6 + h3 * (cell - 12);
        const outside = wx < -halfW || wx >= halfW || wy < -halfH || wy >= halfH;

        let driftX = Math.sin(t * 0.55 + h * 20) * (outside ? 9 : 6);
        let driftY = Math.cos(t * 0.70 + h2 * 20) * 4;

        if (!outside) {
          if (moteKind === 'shadow_wisp') {
            driftX = Math.sin(t * 0.95 + h * 22) * 10;
            driftY -= ((t * (5 + h3 * 4) + h * 34) % 22) - 11;
          } else if (moteKind === 'blossom_petal') {
            driftX = Math.sin(t * 1.35 + h * 25) * 9;
            driftY += ((t * (5.5 + h3 * 4) + h * 36) % 24) - 12;
          } else if (moteKind === 'arcane_rune') {
            driftX = Math.sin(t * 0.65 + h * 16) * 4;
            driftY = Math.cos(t * 1.15 + h2 * 22) * 5;
          } else if (moteKind === 'golden_ember') {
            driftX = Math.sin(t * 2.1 + h * 24) * 5;
            driftY -= ((t * (10 + h3 * 6) + h * 40) % 28) - 14;
          } else if (biome === 'sanctuary' || biome === 'celestial') {
            driftY += ((t * (7 + h3 * 5) + h * 40) % 24) - 12;
          }
        }

        const sx = Math.round(wx - camLeft + driftX);
        const sy = Math.round(wy - camTop + driftY);
        if (sx < -5 || sx > viewW + 5 || sy < -5 || sy > viewH + 5) continue;

        const twinkle = 0.5 + 0.5 * Math.sin(t * 2.4 + h3 * 30);
        const palIdx = Math.floor(h2 * palette.length) % palette.length;
        const color = outside ? (h2 > 0.5 ? '#7dd3fc' : '#e0f2fe') : palette[palIdx];
        ctx.globalAlpha = outside ? 0.16 + twinkle * 0.20 : 0.30 + twinkle * 0.32;
        ctx.fillStyle = color;

        if (outside || moteKind === 'default') {
          const big = h3 > 0.82;
          ctx.fillRect(sx, sy, big ? 2 : 1, 1);
          if (big) ctx.fillRect(sx, sy - 1, 1, 1);
        } else if (moteKind === 'shadow_wisp') {
          // Drifting violet shadow wisp with soft dark-violet trailing tail
          ctx.fillRect(sx, sy, 2, 1);
          ctx.fillRect(sx, sy - 1, 1, 1);
          ctx.globalAlpha = 0.18 + twinkle * 0.18;
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(sx - Math.round(Math.cos(t + h * 10)), sy + 1, 2, 1);
        } else if (moteKind === 'blossom_petal') {
          // Fluttering emerald/gold blossom petal rotating between horizontal and vertical pixel pair
          const flip = Math.cos(t * 3.2 + h3 * 14) > 0;
          ctx.fillRect(sx, sy, flip ? 2 : 1, flip ? 1 : 2);
          if (h3 > 0.72) {
            ctx.fillStyle = '#fef9c3';
            ctx.fillRect(sx, sy, 1, 1);
          }
        } else if (moteKind === 'arcane_rune') {
          // Floating cyan geometric rune diamond
          if (h3 > 0.62) {
            ctx.fillRect(sx, sy - 1, 1, 1);
            ctx.fillRect(sx - 1, sy, 1, 1);
            ctx.fillRect(sx + 1, sy, 1, 1);
            ctx.fillRect(sx, sy + 1, 1, 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(sx, sy, 1, 1);
          } else {
            ctx.fillRect(sx, sy, 2, 2);
          }
        } else if (moteKind === 'golden_ember') {
          // Buoyant rising golden ember spark with bright core on larger sparks
          const big = h3 > 0.74;
          ctx.fillRect(sx, sy, big ? 2 : 1, big ? 2 : 1);
          if (big) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(sx, sy, 1, 1);
          }
        }
      }
    }
    ctx.restore();
  }

  return {
    drawSeaAmbient,
    drawGroundAmbient,
    drawAirMotes,
  };
}
