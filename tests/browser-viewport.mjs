import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const target = process.env.PLAYTEST_URL ?? 'http://127.0.0.1:5173/';
const viewports = [
  { width: 885, height: 747 },
  { width: 961, height: 910 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
];
mkdirSync('ui-viewport-evidence', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
async function inspect(page, selector, childrenSelector, actionSelector, state) {
  const geometry = await page.evaluate(({ selector, childrenSelector, actionSelector }) => {
    const canvas = document.querySelector('#app > canvas');
    const root = document.querySelector(selector);
    const children = root ? Array.from(root.querySelectorAll(childrenSelector)) : [];
    const action = root?.querySelector(actionSelector);
    if (!canvas || !root || !action || children.length === 0) return null;
    const cr = canvas.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const ar = action.getBoundingClientRect();
    const stageScale = cr.width / 1280;
    const projected = (rect) => ({
      l: (rect.left - cr.left) / stageScale,
      t: (rect.top - cr.top) / stageScale,
      r: (rect.right - cr.left) / stageScale,
      b: (rect.bottom - cr.top) / stageScale,
    });
    return {
      scale: stageScale,
      root: projected(rr),
      cards: children.map(e => projected(e.getBoundingClientRect())),
      action: projected(ar),
      actionClickable: !action.disabled && ar.width > 0 && ar.height > 0,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      actionScreen: { bottom: ar.bottom, right: ar.right, left: ar.left },
    };
  }, { selector, childrenSelector, actionSelector });
  assert.ok(geometry, state + ': missing DOM/game canvas/action');
  const tolerance = 25;
  for (const [i, rect] of geometry.cards.entries()) {
    assert.ok(rect.l >= geometry.root.l - tolerance && rect.r <= geometry.root.r + tolerance,
      `${state} card ${i+1} horizontal drift: ${JSON.stringify(geometry)}`);
    assert.ok(rect.t >= geometry.root.t - tolerance && rect.b <= geometry.root.b + tolerance,
      `${state} card ${i+1} vertical drift: ${JSON.stringify(geometry)}`);
  }
  assert.ok(geometry.root.l >= -12 && geometry.root.r <= 1292,
    state + ': DOM root left the Phaser 1280px logical stage: ' + JSON.stringify(geometry.root));
  assert.ok(geometry.root.t >= -15 && geometry.root.b <= 735,
    state + ': DOM root left the Phaser 720px logical stage: ' + JSON.stringify(geometry.root));
  assert.ok(geometry.actionClickable, state + ': primary action hidden or disabled');
  assert.ok(geometry.actionScreen.bottom <= geometry.viewport.h + 4,
    state + ': primary action below viewport: ' + JSON.stringify(geometry));
  assert.ok(geometry.actionScreen.left >= -4 && geometry.actionScreen.right <= geometry.viewport.w + 4,
    state + ': primary action offscreen: ' + JSON.stringify(geometry));
  console.log(state, JSON.stringify(geometry));
  return geometry;
}

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const label = viewport.width + 'x' + viewport.height;
    await page.goto(target, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app > canvas', { timeout: 30000 });
    await page.keyboard.press('Enter');
    await page.waitForSelector('.mememe-mode-menu', { timeout: 30000 });
    await page.click('#mode-board');
    await page.waitForSelector('.mememe-lobby-069', { timeout: 30000 });
    await inspect(page, '.mememe-lobby-069', '.lobby-card', '#lobby-solo', 'lobby/' + label);
    await page.screenshot({ path: 'ui-viewport-evidence/lobby-' + label + '.png' });
    await page.click('#lobby-solo');
    await page.waitForSelector('.mememe-setup-069', { timeout: 30000 });
    const setup = await inspect(page, '.mememe-setup-069', '.player-setup-card', '#start-game', 'setup/' + label);
    assert.ok(setup.cards.length === 4, 'setup/' + label + ': expected four player cards');
    assert.ok(Math.min(...setup.cards.map(c => c.t)) >= 110,
      'setup/' + label + ': player cards overlap Phaser title at the top');
    await page.screenshot({ path: 'ui-viewport-evidence/setup-' + label + '.png' });
    assert.deepEqual(errors, [], label + ': browser runtime errors');
    await page.close();
  }
  console.log('PASS: Lobby + Setup DOM geometry at four reference viewports');
  console.log('NOTE: This is alignment QA for the fixed 16:9 stage, not a full multi-aspect gameplay acceptance.');
} finally {
  await browser.close();
}
