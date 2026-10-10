#!/usr/bin/env node
// Compiled mirror checks; NOT the authoritative jail/hospital release integration test.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script\b[^>]*\bsrc=["']\.\/([^"']+\.js)["']/i)?.[1];
const css = html.match(/<link\b[^>]*\bhref=["']\.\/([^"']+\.css)["']/i)?.[1];
assert.ok(script, 'Compiled JS entry not found in index.html');
assert.ok(css, 'Compiled CSS entry not found in index.html');
for (const file of [script, css, 'manifest.webmanifest', 'audio/bgm/01_Menu_MeMeMe.ogg', 'audio/sfx/dice.ogg']) {
  assert.ok(fs.statSync(path.join(root, file)).isFile(), 'Missing required asset: ' + file);
}
const js = fs.readFileSync(path.join(root, script), 'utf8');
assert.ok(js.length > 10000, 'JS bundle is unexpectedly small');
for (const phrase of ['PRE_ROLL_ACTION', 'specialHold', 'lastRoll']) {
  assert.ok(js.includes(phrase), 'Missing expected release-state marker: ' + phrase);
}

// UI contract: this compiled Phaser build anchors its DOM menus to a 1280x720
// scene and paints separate Phaser backdrops behind them. Applying viewport
// width/media-query reflow ONLY to the DOM layer dislocates the menu cards.
// The experimental v1 sheet remains in git for reference but must not load.
assert.ok(!html.includes('href="./assets/responsive-ui-v1.css"'),
  'Regressed: incompatible DOM-only responsive stylesheet is linked');
const compiledCss = fs.readFileSync(path.join(root, css), 'utf8');
for (const selector of ['.mememe-setup-069', '.mememe-lobby-069', '.setup-grid', '.lobby-grid']) {
  assert.ok(compiledCss.includes(selector), 'Missing authored Phaser DOM layout: ' + selector);
}
assert.ok(js.includes('width:1280,height:720'),
  'Review and update UI layout coordination if Phaser logical viewport changes');
assert.ok(js.includes('Scale.FIT'),
  'Review UI/backdrop layout contract if Phaser scale mode changes');
console.log('PASS authored Phaser DOM/backdrop layout contract; risky fluid v1 override disabled');

console.log('PASS compiled asset presence and release-state marker checks');
console.log('NOTE: Not a behavioral pass. Jail/hospital release RNG and CPU modal behavior require source/replay hooks.');
