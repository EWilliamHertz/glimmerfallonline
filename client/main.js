import { initGame } from './game.js';
import { buildSpriteSheet } from './sprites.js';

window.addEventListener('selectstart', (e) => e.preventDefault());
window.addEventListener('dragstart', (e) => e.preventDefault());

window.toggleScanlines = function () {
  const ov = document.getElementById('crt-overlay');
  if (!ov) return;
  ov.classList.toggle('active');
};

const sheet = buildSpriteSheet();

// Render Vanguard pixel portrait into top-left unit frame
const portraitCanvas = document.getElementById('portrait-canvas');
if (portraitCanvas) {
  const pctx = portraitCanvas.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  pctx.fillStyle = '#1e1b4b';
  pctx.fillRect(0, 0, 28, 28);
  pctx.drawImage(sheet.hero.down[0], 2, 2);
}

// Render default Solari Herald mentor portrait into RPG dialogue box
const npcCanvas = document.getElementById('npc-portrait-canvas');
if (npcCanvas) {
  const nctx = npcCanvas.getContext('2d');
  nctx.imageSmoothingEnabled = false;
  const portrait = sheet.npcPortraits?.heraldNpc || (sheet.heraldNpc && sheet.heraldNpc[0]);
  if (portrait) {
    nctx.drawImage(portrait, 0, 0);
  }
}

initGame();
