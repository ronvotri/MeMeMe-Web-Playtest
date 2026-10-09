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
console.log('PASS compiled asset presence and release-state marker checks');
console.log('NOTE: Not a behavioral pass. Jail/hospital release RNG and CPU modal behavior require source/replay hooks.');
