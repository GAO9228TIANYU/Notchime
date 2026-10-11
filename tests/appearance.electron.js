// Computed-style contract recorded from Phase 1.5 before removing legacy CSS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const profile = process.env.CALENDAR_TEST_USER_DATA;
if (!profile) throw new Error('An isolated project-contained profile is required');
for (const name of ['userData', 'sessionData', 'crashDumps']) app.setPath(name, profile);
app.setAppLogsPath(path.join(profile, 'logs'));
const fixture = path.join(__dirname, 'fixtures', 'window-appearance.json');
const timeout = setTimeout(() => app.exit(1), 30000);
(async () => {
  await app.whenReady();
  const window = new BrowserWindow({ width: 1240, height: 616, show: false, frame: false,
    webPreferences: { backgroundThrottling: false } });
  await window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  await window.webContents.executeJavaScript('CalendarUI.applySnapshot(' + JSON.stringify(require('./fixtures/calendar-fixture').snapshot()) + ')');
  const capture = () => window.webContents.executeJavaScript(`(async () => {
    const result = {};
    const properties = ['display','position','width','height','padding','margin','gap','font-size','font-family',
      'font-weight','color','background-color','background-image','border-radius','border','box-shadow',
      'opacity','clip-path','transform','pointer-events','transition-property','transition-duration',
      'transition-delay','transition-timing-function','overflow','z-index'];
    const selectors = ['.notch','.notch-dot','.panel','.panel::before','.panel::after','.topbar','.tabs',
      '.tab','.tab-indicator','.collapse-btn','.panels','.tab-panel.active','.tile','.tile::after',
      '.calendar-grid','.calendar-event','.calendar-settings-grid','.calendar-button','.countdown-dialog',
      '.countdown-picker-dialog','.countdown-picker-field'];
    for (const mode of ['collapsed','opening','expanded','closing']) {
      document.getElementById('app').className = mode + ' calendar-workspace';
      await new Promise(resolve => setTimeout(resolve, 500));
      result[mode] = {};
      for (const selector of selectors) {
        const [base, pseudo] = selector.split('::');
        const element = document.querySelector(base);
        if (!element) throw new Error('Missing appearance target: ' + selector);
        const style = getComputedStyle(element, pseudo ? '::' + pseudo : null);
        result[mode][selector] = Object.fromEntries(properties.map(key => [key, style.getPropertyValue(key)]));
      }
    }
    return result;
  })()`);
  const actual = { normal: await capture() };
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  actual.reduced = await capture();
  if (process.env.RECORD_WINDOW_APPEARANCE === '1') {
    fs.mkdirSync(path.dirname(fixture), { recursive: true });
    fs.writeFileSync(fixture, JSON.stringify(actual, null, 2) + '\n');
    console.log('Recorded Phase 1.5 appearance contract');
  } else {
    assert.deepEqual(actual, JSON.parse(fs.readFileSync(fixture, 'utf8')),
      'Window geometry, island animation, surfaces and layout must match Phase 1.5');
    console.log('PASS appearance: four island states, original motion, reduced motion and Calendar/Countdown surfaces');
  }
  clearTimeout(timeout); window.destroy(); app.quit();
})().catch(error => { console.error(error); clearTimeout(timeout); app.exit(1); });
