const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'renderer/index.html'), 'utf8');

test('the current product exposes exactly Calendar and Settings, with valid tab/panel links', () => {
  const tabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(tabs, ['calendar', 'settings']);
  for (const tab of tabs) {
    assert.ok(html.includes(`id="tab-${tab}"`));
    assert.ok(html.includes(`aria-controls="tab-${tab}"`));
    assert.ok(html.includes(`aria-labelledby="tab-button-${tab}"`));
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'DOM IDs must be unique');
});
test('active page loads calendar/reminders/window and independent countdown modules', () => {
  assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]), ['panel-interaction.js', 'calendar-model.js', 'app.js', 'reminders-model.js', 'reminders.js', 'countdown-model.js', 'countdown-picker.js', 'countdown.js']);
  assert.doesNotMatch(html, /data-home-module|settings-api|settings-mirror|tab-todo|tab-recordings|tab-clip/);
});
test('automatic reveal settings expose only valid reminder choices and explicit manual protection', () => {
  assert.match(html, /id="settings-reminder-minutes"/);
  assert.deepEqual([...html.matchAll(/<option value="(\d+)"/g)].map(m => Number(m[1])), [0,5,10,15]);
  const settings = html.slice(html.indexOf('<section id="tab-settings"'), html.indexOf('<dialog id="countdown-editor"'));
  assert.equal([...settings.matchAll(/type="checkbox"/g)].length, 2);
  assert.match(settings, /id="settings-menu-bar-icon"/);
  assert.match(html, /id="settings-auto-collapse"[^>]*value="4"/);
  assert.match(html, /仅用于自动展开/);
  assert.match(html, /手动操作后保持展开/);
});
test('calendar package identity cannot overlap the original product', () => {
  const config = require('../package.json');
  const lock = require('../package-lock.json');
  assert.equal(config.name, lock.name);
  assert.equal(config.name, lock.packages[''].name);
  assert.equal(config.build.appId, 'com.notchime.app');
  assert.equal(config.build.productName, 'Notchime');
  assert.equal(config.build.mac.extendInfo.CFBundleDisplayName, 'Notchime');
  assert.equal(config.version, lock.version);
});
