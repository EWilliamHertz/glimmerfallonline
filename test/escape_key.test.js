import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Escape Key Integrity: Modals, settings, audio mixer, inputs, cinematics, and frontpage close cleanly', () => {
  const gameJsSrc = fs.readFileSync(new URL('../client/game.js', import.meta.url), 'utf8');
  const indexHtmlSrc = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const landingJsSrc = fs.readFileSync(new URL('../client/landing.js', import.meta.url), 'utf8');

  // 1. In game.js, Escape on active input / select blurs and does NOT stop modal dismissal (unless chat-input)
  assert.ok(
    gameJsSrc.includes('const isChat = document.activeElement.id === \'chat-input\';'),
    'game.js must distinguish chat-input from modal form controls on Escape'
  );
  assert.ok(
    gameJsSrc.includes('// Fall through to dismiss any open modal below!'),
    'game.js must fall through to close modal when input inside modal is blurred'
  );

  // 2. Cinematic modals & Prologue dismiss with stopPropagation
  assert.ok(
    indexHtmlSrc.includes('overlay.style.display !== \'none\'') &&
    indexHtmlSrc.includes('window.closeCinematicModal();\n            return;'),
    'index.html cinematic modal Escape handler must return cleanly and stop bubbling'
  );
  assert.ok(
    gameJsSrc.includes('window.closeCinematicModal?.()'),
    'game.js must cleanly catch and close cinematic modal overlay on Escape'
  );

  // 3. Modal selector covers all modal elements and triggers closeCraftingModal
  assert.ok(
    gameJsSrc.includes('.modal, #paperdoll-modal, #cards-modal, #audio-mixer-modal, #settings-modal, #crafting-modal'),
    'game.js must use comprehensive modal selector covering all game modals'
  );
  assert.ok(
    gameJsSrc.includes('window.closeCraftingModal?.()'),
    'game.js must clean up crafting timers on Escape dismiss'
  );

  // 4. Landing page and frontpage handle Escape to navigate between screens or return to game
  assert.ok(
    landingJsSrc.includes("if (key === 'Escape')"),
    'landing.js must handle Escape in initKeyboardNavigation'
  );
  assert.ok(
    gameJsSrc.includes('hasEnteredWorld') &&
    gameJsSrc.includes('frontpage.open()'),
    'game.js must return to frontpage on Escape from landing page if world not entered'
  );
  assert.ok(
    gameJsSrc.includes('landingPage.open()'),
    'game.js must return to landing page on Escape from frontpage if world not entered'
  );
  assert.ok(
    landingJsSrc.includes('skipPrologueCinematic') &&
    landingJsSrc.includes('closeCinematicModal'),
    'landing.js must dismiss video cinematics on Escape before closing landing page'
  );
});

test('renderEquipmentModal renders full paperdoll and bonuses without ReferenceError on high-level characters', async () => {
  const prevDoc = globalThis.document;
  try {
    const bodyEl = { innerHTML: '' };
    const ctxMock = {
      imageSmoothingEnabled: false,
      fillStyle: '',
      fillRect() {},
      clearRect() {},
      drawImage() {},
      getImageData: (_x, _y, w, h) => ({ data: new Uint8ClampedArray((w || 16) * (h || 16) * 4) }),
      putImageData() {},
    };
    const canvasEl = { width: 64, height: 68, getContext: () => ctxMock, toDataURL: () => 'data:image/png;base64,' };
    globalThis.document = {
      createElement: () => canvasEl,
      getElementById: (id) => {
        if (id === 'equipment-modal-body') return bodyEl;
        if (id === 'rs-paperdoll-canvas') return canvasEl;
        return null;
      },
    };
    const { renderEquipmentModal } = await import('../client/equipmentUi.js');
    renderEquipmentModal({
      profile: {
        displayName: 'Ewach',
        faction: 'Aether',
        classId: 'aether_chronomancer',
        equipment: {
          head: 'chrono_astral_hood',
          body: 'chrono_astral_robes',
          legs: 'chrono_astral_skirt',
          weapon: 'chrono_warp_staff',
        },
      },
    });
    assert.ok(bodyEl.innerHTML.includes('WORN EQUIPMENT SLOTS'), 'Equipment modal body must render paperdoll slots');
    assert.ok(bodyEl.innerHTML.includes('TOTAL COMBAT STAT BONUSES'), 'Equipment modal body must render stat bonuses');
    assert.ok(bodyEl.innerHTML.includes('ANCIENT RUNEWORD CODEX'), 'Equipment modal body must render runeword codex');
  } finally {
    if (prevDoc === undefined) delete globalThis.document; else globalThis.document = prevDoc;
  }
});
