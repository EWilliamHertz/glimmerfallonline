import { makeCanvas, px, rect, addPixelOutline } from './pixelCanvas.js';

function drawMountFrame(mountSpec, dir, stride) {
  const { c, ctx } = makeCanvas(34, 30);
  const { primary, trim, dark, kind } = mountSpec;
  const legA = stride === 0 ? 0 : -2;
  const legB = stride === 0 ? 0 : 2;
  const bob = stride === 0 ? 0 : -1;

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left';
    const fx = (x, w = 1) => (flip ? 34 - x - w : x);

    // Tail / wing accent
    if (kind === 'drake') {
      rect(ctx, fx(3, 7), 8 + bob, 7, 3, dark);
      rect(ctx, fx(2, 5), 6 + bob, 5, 3, trim);
      rect(ctx, fx(12, 8), 5 + bob + (stride === 0 ? 0 : -2), 8, 5, primary);
      rect(ctx, fx(13, 6), 4 + bob + (stride === 0 ? 0 : -2), 6, 3, trim);
    } else if (kind === 'prowler') {
      rect(ctx, fx(3, 6), 13 + bob, 6, 2, dark);
      rect(ctx, fx(2, 3), 11 + bob, 3, 2, trim);
    } else {
      rect(ctx, fx(4, 4), 12 + bob, 4, 4, trim);
    }

    // Body + saddle pad
    rect(ctx, fx(8, 16), 12 + bob, 16, 8, primary);
    rect(ctx, fx(9, 14), 13 + bob, 14, 5, dark);
    rect(ctx, fx(12, 8), 11 + bob, 8, 4, trim);

    // Legs (animated trot)
    rect(ctx, fx(9 + legA, 3), 20, 3, 7, dark);
    rect(ctx, fx(13 + legB, 3), 20, 3, 7, primary);
    rect(ctx, fx(19 + legA, 3), 20, 3, 7, dark);
    rect(ctx, fx(22 + legB, 3), 20, 3, 7, primary);

    // Neck & head
    rect(ctx, fx(21, 5), 8 + bob, 5, 7, primary);
    rect(ctx, fx(23, 7), 6 + bob, 7, 5, primary);
    rect(ctx, fx(24, 5), 7 + bob, 5, 3, trim);
    px(ctx, fx(27), 8 + bob, '#0f172a');
    px(ctx, fx(26), 8 + bob, '#ffffff');

    // Elk antlers / Drake horns / Charger plume
    if (kind === 'elk') {
      rect(ctx, fx(22, 2), 2 + bob, 2, 5, trim);
      rect(ctx, fx(20, 4), 2 + bob, 4, 2, trim);
    } else if (kind === 'charger') {
      rect(ctx, fx(20, 3), 5 + bob, 3, 4, trim);
    } else if (kind === 'drake') {
      rect(ctx, fx(22, 4), 4 + bob, 4, 2, trim);
    }
  } else {
    const isUp = dir === 'up';
    // Top-down torso
    rect(ctx, 10, 9 + bob, 14, 13, primary);
    rect(ctx, 11, 10 + bob, 12, 11, dark);
    rect(ctx, 12, 13 + bob, 10, 5, trim); // saddle cloth

    if (kind === 'drake') {
      rect(ctx, 4, 11 + bob + stride, 6, 5, primary);
      rect(ctx, 24, 11 + bob + stride, 6, 5, primary);
      rect(ctx, 5, 12 + bob + stride, 4, 2, trim);
      rect(ctx, 25, 12 + bob + stride, 4, 2, trim);
    }

    // Hooves/paws
    rect(ctx, 10, 22 + (stride === 0 ? 0 : -1), 3, 5, dark);
    rect(ctx, 21, 22 + (stride === 0 ? -1 : 0), 3, 5, dark);
    rect(ctx, 11, 7 + (stride === 0 ? -1 : 0), 3, 4, primary);
    rect(ctx, 20, 7 + (stride === 0 ? 0 : -1), 3, 4, primary);

    // Head
    const hy = isUp ? 5 : 18;
    rect(ctx, 13, hy + bob, 8, 6, primary);
    rect(ctx, 14, hy + 1 + bob, 6, 4, trim);
    if (!isUp) {
      px(ctx, 14, hy + 3 + bob, '#0f172a');
      px(ctx, 19, hy + 3 + bob, '#0f172a');
    }
    if (kind === 'elk') {
      rect(ctx, 9, hy - 2 + bob, 4, 2, trim);
      rect(ctx, 21, hy - 2 + bob, 4, 2, trim);
    }
  }

  return addPixelOutline(c);
}

function buildWaypointSprite(active) {
  const { c, ctx } = makeCanvas(28, 40);
  // Base plinth
  rect(ctx, 4, 31, 20, 7, '#1e293b');
  rect(ctx, 6, 29, 16, 3, '#334155');
  rect(ctx, 8, 28, 12, 2, active ? '#38bdf8' : '#64748b');

  // Monolith spire
  rect(ctx, 9, 10, 10, 19, '#1e293b');
  rect(ctx, 10, 8, 8, 21, '#334155');
  rect(ctx, 11, 6, 6, 3, '#475569');

  // Carved rune channel & crystal core
  if (active) {
    rect(ctx, 12, 11, 4, 15, '#0284c7');
    rect(ctx, 13, 12, 2, 13, '#38bdf8');
    rect(ctx, 11, 14, 6, 5, '#7dd3fc');
    rect(ctx, 12, 15, 4, 3, '#fef08a');
    px(ctx, 13, 16, '#ffffff');
    rect(ctx, 11, 3, 6, 3, '#38bdf8');
    px(ctx, 13, 2, '#fef08a');
  } else {
    rect(ctx, 12, 12, 4, 13, '#1e293b');
    rect(ctx, 13, 14, 2, 9, '#475569');
    rect(ctx, 12, 15, 4, 3, '#64748b');
  }

  return addPixelOutline(c);
}

export function buildMountAndWaypointSprites(sprites) {
  const specs = {
    starlight_charger: { kind: 'charger', primary: '#facc15', trim: '#fef08a', dark: '#b45309' },
    voidfang_prowler: { kind: 'prowler', primary: '#9333ea', trim: '#e879f9', dark: '#3b0764' },
    ironwood_elk: { kind: 'elk', primary: '#22c55e', trim: '#86efac', dark: '#14532d' },
    chrono_drake: { kind: 'drake', primary: '#0ea5e9', trim: '#bae6fd', dark: '#0c4a6e' },
  };

  sprites.mounts = {};
  for (const [id, spec] of Object.entries(specs)) {
    sprites.mounts[id] = {
      down: [drawMountFrame(spec, 'down', 0), drawMountFrame(spec, 'down', 1)],
      up: [drawMountFrame(spec, 'up', 0), drawMountFrame(spec, 'up', 1)],
      left: [drawMountFrame(spec, 'left', 0), drawMountFrame(spec, 'left', 1)],
      right: [drawMountFrame(spec, 'right', 0), drawMountFrame(spec, 'right', 1)],
    };
  }

  sprites.props = sprites.props || {};
  sprites.props.waypointShrineDormant = buildWaypointSprite(false);
  sprites.props.waypointShrineActive = buildWaypointSprite(true);
}
