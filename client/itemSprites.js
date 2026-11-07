// ==========================================
// GlimmerFall Online 2D — 16-Bit Pixel Art Item Sprite Synthesizer
// Generates unique 24x24 pixel art sprites for every item in EQUIPMENT_CATALOG!
// ==========================================

const dataUrlCache = new Map();
const canvasCache = new Map();

function makeCanvas(w, h) {
  if (typeof document === 'undefined') return { c: null, ctx: null };
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function px(ctx, x, y, col) {
  if (!ctx) return;
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function rect(ctx, x, y, w, h, col) {
  if (!ctx) return;
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function addOutline(c, outlineHex = '#05070f') {
  if (!c || typeof document === 'undefined') return c;
  const w = c.width;
  const h = c.height;
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);

  const r = parseInt(outlineHex.slice(1, 3), 16);
  const g = parseInt(outlineHex.slice(3, 5), 16);
  const b = parseInt(outlineHex.slice(5, 7), 16);

  const isSolid = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return d[(y * w + x) * 4 + 3] > 30;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (d[idx + 3] === 0) {
        if (isSolid(x - 1, y) || isSolid(x + 1, y) || isSolid(x, y - 1) || isSolid(x, y + 1)) {
          out[idx] = r;
          out[idx + 1] = g;
          out[idx + 2] = b;
          out[idx + 3] = 255;
        }
      }
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
  return c;
}

import { drawGearItemPixels } from './sprites/itemGearSprites.js';
import { drawMaterialItemPixels } from './sprites/itemMaterialSprites.js';

function drawItemPixels(ctx, id) {
  if (drawGearItemPixels(ctx, id, px, rect)) return;
  drawMaterialItemPixels(ctx, id, px, rect);
}

// ------------------------------------------
// Public API
// ------------------------------------------
export function getItemCanvas(itemId, size = 24) {
  if (typeof document === 'undefined') return null;
  const key = `${itemId}_${size}`;
  if (canvasCache.has(key)) return canvasCache.get(key);

  const { c, ctx } = makeCanvas(24, 24);
  if (!c || !ctx) return null;

  drawItemPixels(ctx, itemId);
  addOutline(c, '#05070f');

  if (size === 24) {
    canvasCache.set(key, c);
    return c;
  }

  // Rescale with pixelated smoothing disabled
  const scaled = makeCanvas(size, size);
  if (scaled.ctx) {
    scaled.ctx.drawImage(c, 0, 0, size, size);
  }
  canvasCache.set(key, scaled.c);
  return scaled.c;
}

export function getItemIconDataUrl(itemId, size = 24) {
  const key = `${itemId}_${size}`;
  if (dataUrlCache.has(key)) return dataUrlCache.get(key);

  const cv = getItemCanvas(itemId, size);
  if (!cv || typeof cv.toDataURL !== 'function') return '';

  const url = cv.toDataURL('image/png');
  dataUrlCache.set(key, url);
  return url;
}
