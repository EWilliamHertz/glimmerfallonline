import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CRAFTING_RECIPES,
  EQUIPMENT_CATALOG,
  checkCraftInventorySpace,
} from '../shared/protocol.js';
import {
  renderCraftingModal,
  setCraftFeedback,
  selectCraftingStation,
  selectCraftingRecipe,
} from '../client/craftingUi.js';

function makeFull28BagWithPartialMats(recipe) {
  const bag = [];
  for (const ing of recipe.ingredients) {
    bag.push({ id: ing.id, qty: (ing.qty || 1) + 5 });
  }
  // Fill remaining slots with distinct unstackable items so length === 28
  let idx = 0;
  const fillerIds = Object.values(EQUIPMENT_CATALOG)
    .filter((it) => it && !it.stackable && it.id !== recipe.outputId)
    .map((it) => it.id);
  while (bag.length < 28) {
    bag.push({ id: fillerIds[idx % fillerIds.length], qty: 1 });
    idx += 1;
  }
  return bag;
}

test('checkCraftInventorySpace detects 28/28 full bags accurately across stackable and non-stackable recipes', () => {
  // 1. Recipe creating new item stack when ingredients have leftover quantities -> bag is full
  const bronzeRecipe = CRAFTING_RECIPES.find((r) => r.id === 'smelt_bronze_bar');
  assert.ok(bronzeRecipe);
  const fullBagNewOutput = makeFull28BagWithPartialMats(bronzeRecipe);
  assert.equal(fullBagNewOutput.length, 28);

  const blocked = checkCraftInventorySpace(bronzeRecipe, fullBagNewOutput, EQUIPMENT_CATALOG, 28);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.bagFull, true);
  assert.equal(blocked.slotsToFree, 1);
  assert.ok(blocked.reason.includes('Your bag is full (28/28)'));

  // 2. If the stackable output ALREADY exists in the 28/28 bag, stacking requires 0 new slots
  const fullBagExistingStack = [...fullBagNewOutput.slice(0, 27), { id: bronzeRecipe.outputId, qty: 2 }];
  assert.equal(fullBagExistingStack.length, 28);
  const allowedStack = checkCraftInventorySpace(bronzeRecipe, fullBagExistingStack, EQUIPMENT_CATALOG, 28);
  assert.equal(allowedStack.ok, true);
  assert.equal(allowedStack.bagFull, false);

  // 3. If ingredients are consumed down to 0 qty (freeing 1+ slots), crafted item fits in the freed slot
  const fullBagExactMats = [
    ...bronzeRecipe.ingredients.map((i) => ({ id: i.id, qty: i.qty })),
    ...fullBagNewOutput.slice(bronzeRecipe.ingredients.length),
  ];
  assert.equal(fullBagExactMats.length, 28);
  const allowedFreed = checkCraftInventorySpace(bronzeRecipe, fullBagExactMats, EQUIPMENT_CATALOG, 28);
  assert.equal(allowedFreed.ok, true);
  assert.equal(allowedFreed.bagFull, false);
});

test('Crafting modal renders "Your bag is full (28/28)" warning banner and displays explicit feedback on click', () => {
  const bronzeRecipe = CRAFTING_RECIPES.find((r) => r.id === 'smelt_bronze_bar');
  const fullBag = makeFull28BagWithPartialMats(bronzeRecipe);

  const elements = {};
  const makeEl = (id) => ({
    id,
    innerHTML: '',
    textContent: '',
    style: { display: 'block' },
  });
  for (const id of ['crafting-modal', 'crafting-modal-body', 'crafting-modal-title', 'crafting-modal-subtitle']) {
    elements[id] = makeEl(id);
  }

  const prevWindow = globalThis.window;
  const prevDoc = globalThis.document;
  try {
    const noopCtx = {
      imageSmoothingEnabled: false,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      ellipse() {},
      fill() {},
      stroke() {},
      clearRect() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      drawImage() {},
      getImageData: (_x, _y, w = 24, h = 24) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
      createImageData: (w = 24, h = 24) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
    };
    globalThis.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => [],
      createElement: () => ({
        width: 24,
        height: 24,
        getContext: () => noopCtx,
        toDataURL: () => 'data:image/png;base64,',
      }),
    };
    globalThis.window = {
      localProfile: {
        inventory: fullBag,
        progression: { professions: { relic_forging: { level: 99, xp: 9477643 } } },
      },
      getLocalProgression: () => ({ professions: { relic_forging: { level: 99, xp: 9477643 } } }),
      getCraftCooldownRemaining: () => 0,
    };

    selectCraftingStation('cosmic_anvil', 'all');
    selectCraftingRecipe(bronzeRecipe.id);
    renderCraftingModal();

    const html = elements['crafting-modal-body'].innerHTML;
    assert.ok(html.includes('28/28 (FULL)'), 'Backpack counter should indicate 28/28 (FULL)');
    assert.ok(html.includes('id="crafting-feedback-banner"'), 'Full-bag alert banner must be visible inside modal');
    assert.ok(html.includes('Your bag is full (28/28)'), 'Modal must explicitly state "Your bag is full (28/28)"');

    setCraftFeedback('🎒 Your bag is full (28/28)! Clear 1 space before crafting.', 'error');
    renderCraftingModal();
    assert.ok(elements['crafting-modal-body'].innerHTML.includes('Clear 1 space before crafting'));
  } finally {
    setCraftFeedback('');
    globalThis.window = prevWindow;
    globalThis.document = prevDoc;
  }
});

test('Client game.js and server gatheringAndCrafting.js share checkCraftInventorySpace and surface full-bag alerts', () => {
  const gameSrc = fs.readFileSync(path.join(process.cwd(), 'client', 'game.js'), 'utf8');
  const serverCraftSrc = fs.readFileSync(path.join(process.cwd(), 'server', 'rooms', 'gatheringAndCrafting.js'), 'utf8');

  assert.ok(gameSrc.includes('checkCraftInventorySpace'));
  assert.ok(gameSrc.includes('setCraftFeedback'));
  assert.ok(gameSrc.includes('Your bag is full'));
  assert.ok(serverCraftSrc.includes('checkCraftInventorySpace'));
  assert.ok(serverCraftSrc.includes('Your bag is full'));
});
