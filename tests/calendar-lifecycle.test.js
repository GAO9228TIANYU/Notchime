const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeAutoCollapseSeconds, normalizeReminderMinutes } = require('../calendar-settings');
const source = fs.readFileSync(require.resolve('../main.js'), 'utf8');
function loginHarness(packaged) {
  let enabled = false, writes = 0;
  const context = vm.createContext({ process: { platform: 'darwin' }, app: {
    isPackaged: packaged, getLoginItemSettings: () => ({ openAtLogin: enabled }),
    setLoginItemSettings: (settings) => { enabled = settings.openAtLogin; writes++; },
  } });
  vm.runInContext(source.slice(source.indexOf('function autoLaunchSupported()'), source.indexOf('function getJsonSettingsPath')), context);
  return { context, writes: () => writes };
}
test('source-mode login settings never register the shared Electron bundle', () => {
  const h = loginHarness(false);
  assert.equal(h.context.autoLaunchSupported(), false);
  assert.equal(h.context.setAutoLaunch(true), false);
  assert.equal(h.writes(), 0);
});
test('packaged login settings read/write the OS setting and detect failure', () => {
  const h = loginHarness(true);
  assert.equal(h.context.setAutoLaunch(true), true);
  assert.equal(h.context.isAutoLaunchEnabled(), true);
  assert.equal(h.context.setAutoLaunch(false), true);
  assert.equal(h.context.isAutoLaunchEnabled(), false);
  assert.equal(h.writes(), 2);
  h.context.app.setLoginItemSettings = () => { throw new Error('denied'); };
  assert.equal(h.context.setAutoLaunch(true), false);
});
test('calendar settings reads preserve unknown fields without restoring legacy defaults', () => {
  const context = vm.createContext({ normalizeAutoCollapseSeconds, normalizeReminderMinutes,
    getJsonSettingsPath: name => name, APP_SETTINGS_FILE: 'settings',
    readJsonFile: () => ({ features: { clip: true }, secretReference: 'preserve', autoCollapseSeconds: -8 }),
  });
  vm.runInContext(source.slice(source.indexOf('function readAppSettings()'), source.indexOf('function publicAppSettings()')), context);
  const result = context.readAppSettings();
  assert.equal(result.autoCollapseSeconds, 4);
  assert.equal(result.secretReference, 'preserve');
  assert.equal(result.features.clip, true);
  assert.equal('shortcut' in result, false);
});
