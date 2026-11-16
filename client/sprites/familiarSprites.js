// ==========================================
// GlimmerFall Online — Animated Pixel Sprites for Summoner-Knight Nexus Familiars
// ==========================================

import { makeCanvas, px, rect, addPixelOutline } from './pixelCanvas.js';

export function buildFamiliarSprites(sprites) {
  sprites.familiars = sprites.familiars || {};

  // 1. Dawnkit Ember-Fox (Solari — nimble crimson/amber fox with sunlit snowy tail tip)
  sprites.familiars.familiarEmberFox = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(18, 16);
    const step = f === 1 ? 1 : 0;
    // Fluffy white-tipped tail
    rect(ctx, 1, 7 - step, 5, 4, '#ea580c');
    rect(ctx, 1, 7 - step, 2, 3, '#fef3c7');
    px(ctx, 1, 7 - step, '#fde047');
    // Fox torso & chest tuft
    rect(ctx, 5, 8, 8, 5, '#d97706');
    rect(ctx, 6, 7, 6, 4, '#f59e0b');
    rect(ctx, 9, 9, 3, 3, '#fef3c7');
    // Head + pointed ears
    rect(ctx, 9, 4, 6, 5, '#ea580c');
    rect(ctx, 10, 5, 4, 3, '#f97316');
    rect(ctx, 14, 6, 2, 2, '#fdba74'); // snout
    px(ctx, 16, 6, '#1e293b'); // nose
    rect(ctx, 9, 2, 2, 2, '#b45309');
    rect(ctx, 13, 2, 2, 2, '#b45309');
    px(ctx, 12, 6, '#fde047'); // eye
    // Animated stride paws
    rect(ctx, 6 + step, 13, 2, 2, '#7c2d12');
    rect(ctx, 11 - step, 13, 2, 2, '#7c2d12');
    sprites.familiars.familiarEmberFox.push(addPixelOutline(c));
  }

  // 2. Mossback Ankyloling (Terra — azure hatchling with moss-bark shell armor)
  sprites.familiars.familiarAnkyloling = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(18, 16);
    const step = f === 1 ? 1 : 0;
    // Clubbed bark tail
    rect(ctx, 1, 9 - step, 4, 3, '#0e7490');
    rect(ctx, 1, 8 - step, 2, 2, '#16a34a');
    // Armored moss carapace
    rect(ctx, 4, 5, 9, 6, '#15803d');
    rect(ctx, 5, 4, 7, 5, '#22c55e');
    rect(ctx, 6, 4, 5, 2, '#86efac');
    px(ctx, 7, 6, '#78350f');
    px(ctx, 10, 6, '#78350f');
    // Cyan hide & underbelly
    rect(ctx, 5, 10, 8, 3, '#06b6d4');
    // Head + cheek horn
    rect(ctx, 12, 6, 4, 5, '#0891b2');
    rect(ctx, 13, 7, 3, 3, '#22d3ee');
    px(ctx, 14, 8, '#fde047'); // bright eye
    px(ctx, 12, 5, '#cbd5e1'); // tiny horn
    // Short sturdy feet
    rect(ctx, 5 + step, 13, 2, 2, '#164e63');
    rect(ctx, 10 - step, 13, 2, 2, '#164e63');
    sprites.familiars.familiarAnkyloling.push(addPixelOutline(c));
  }

  // 3. Graveglass Wisp-Imp (Umbri — twin-tailed spectral lantern sprite)
  sprites.familiars.familiarWispImp = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 18);
    const bob = f === 1 ? 1 : 0;
    // Shadowy mantle & twin wisp tails
    rect(ctx, 5, 4 + bob, 6, 7, '#581c87');
    rect(ctx, 4, 5 + bob, 8, 5, '#7e22ce');
    rect(ctx, 6, 3 + bob, 4, 2, '#a855f7');
    // Glowing eyes
    px(ctx, 6, 7 + bob, '#f0abfc');
    px(ctx, 9, 7 + bob, '#f0abfc');
    // Wispy floating base + miniature ghost lantern
    rect(ctx, 5, 11 + bob, 2, 3 - bob, '#6b21a8');
    rect(ctx, 9, 11 + bob, 2, 2 + bob, '#6b21a8');
    px(ctx, 12, 8 + bob, '#38bdf8');
    rect(ctx, 12, 9 + bob, 2, 3, '#c084fc');
    px(ctx, 12, 10 + bob, '#fef08a');
    sprites.familiars.familiarWispImp.push(addPixelOutline(c));
  }

  // 4. Chrono-Prism Sprite (Aether — floating brass & cyan astrolabe cube)
  sprites.familiars.familiarPrismSprite = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 18);
    const bob = f === 1 ? 1 : 0;
    // Outer brass gyro ring
    rect(ctx, 3, 5 + bob, 10, 7, '#b45309');
    rect(ctx, 4, 4 + bob, 8, 9, '#0284c7');
    rect(ctx, 5, 5 + bob, 6, 7, '#0ea5e9');
    rect(ctx, 6, 6 + bob, 4, 5, '#38bdf8');
    px(ctx, 7, 8 + bob, '#ffffff');
    // Orbiting gold corner runes
    px(ctx, 2 + f, 3 + bob, '#fde047');
    px(ctx, 13 - f, 12 + bob, '#fde047');
    sprites.familiars.familiarPrismSprite.push(addPixelOutline(c));
  }

  // 5. Starfall Moon-Owl (Astral — horned moonlit owl)
  sprites.familiars.familiarMoonOwl = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(16, 16);
    const bob = f === 1 ? 1 : 0;
    // Horn tufts
    px(ctx, 4, 2 + bob, '#cbd5e1');
    px(ctx, 11, 2 + bob, '#cbd5e1');
    // Owl plumage & belly crest
    rect(ctx, 4, 4 + bob, 8, 8, '#3b82f6');
    rect(ctx, 5, 5 + bob, 6, 6, '#93c5fd');
    rect(ctx, 6, 8 + bob, 4, 3, '#e0f2fe');
    // Wings flap slightly on frame 1
    rect(ctx, 2, 6 + bob, 2, f === 1 ? 5 : 4, '#1d4ed8');
    rect(ctx, 12, 6 + bob, 2, f === 1 ? 5 : 4, '#1d4ed8');
    // Eyes & golden beak
    px(ctx, 6, 6 + bob, '#fde047');
    px(ctx, 9, 6 + bob, '#fde047');
    px(ctx, 7, 7 + bob, '#f59e0b');
    rect(ctx, 6, 12 + bob, 1, 2, '#f59e0b');
    rect(ctx, 9, 12 + bob, 1, 2, '#f59e0b');
    sprites.familiars.familiarMoonOwl.push(addPixelOutline(c));
  }

  // 6. Shattered Pyre-Drake (Apex Solari — miniature ember wing-drake)
  sprites.familiars.familiarPyreDrake = [];
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas(18, 18);
    const wingY = f === 1 ? 0 : 1;
    // Dragon wings
    rect(ctx, 2, 4 + wingY, 4, 5, '#b91c1c');
    rect(ctx, 1, 3 + wingY, 3, 3, '#ef4444');
    // Tail & flame tip
    rect(ctx, 2, 11, 5, 3, '#dc2626');
    px(ctx, 1, 10 - f, '#fde047');
    px(ctx, 2, 10, '#f97316');
    // Drake body & golden crest
    rect(ctx, 6, 7, 7, 6, '#b91c1c');
    rect(ctx, 7, 8, 5, 4, '#f97316');
    rect(ctx, 9, 9, 3, 3, '#fef08a');
    // Horned head
    rect(ctx, 10, 4, 6, 5, '#dc2626');
    px(ctx, 10, 2, '#fde047');
    px(ctx, 13, 2, '#fde047');
    px(ctx, 13, 6, '#fde047');
    // Feet
    rect(ctx, 7, 13, 2, 2, '#991b1b');
    rect(ctx, 11, 13, 2, 2, '#991b1b');
    sprites.familiars.familiarPyreDrake.push(addPixelOutline(c));
  }
}

export function getFamiliarIconDataUrl(sprites, spriteKey) {
  if (!sprites?.familiars) return '';
  const frames = sprites.familiars[spriteKey];
  const img = Array.isArray(frames) ? frames[0] : frames;
  if (!img || typeof img.toDataURL !== 'function') return '';
  try {
    return img.toDataURL();
  } catch (_) {
    return '';
  }
}
