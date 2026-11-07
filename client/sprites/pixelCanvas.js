// Low-level 16-bit offscreen pixel canvas helpers
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

export function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

export function addPixelOutline(canvas, outlineHex = '#070a12') {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);

  const r = parseInt(outlineHex.slice(1, 3), 16);
  const g = parseInt(outlineHex.slice(3, 5), 16);
  const b = parseInt(outlineHex.slice(5, 7), 16);

  const isSolid = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return d[(y * w + x) * 4 + 3] > 20;
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
  return canvas;
}

export function hash2d(x, y, seed = 1) {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
