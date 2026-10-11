// Actual production Main/preload/page, with project-contained test data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const http = require('node:http');
const childProcess = require('node:child_process');
const { app, BrowserWindow, powerMonitor } = require('electron');
const profile = process.env.CALENDAR_TEST_USER_DATA;
const phase = process.env.CALENDAR_TEST_PHASE;
if (!profile) throw new Error('Run via npm test for an isolated project-contained profile');
app.commandLine.appendSwitch('user-data-dir', profile);
app.commandLine.appendSwitch('use-mock-keychain');
for (const name of ['userData', 'sessionData', 'crashDumps']) app.setPath(name, profile);
app.setAppLogsPath(path.join(profile, 'logs'));
let loginWrites = 0, servers = 0, processes = 0;
app.setLoginItemSettings = () => { loginWrites++; throw new Error('No real login-item writes in tests'); };
app.getLoginItemSettings = () => ({ openAtLogin: false });
http.Server.prototype.listen = () => { servers++; throw new Error('Retired HTTP service started'); };
childProcess.execFile = () => { processes++; throw new Error('Retired subprocess started'); };
const dataFile = path.join(profile, 'countdowns.json');
const expectedFile = path.join(profile, 'countdown-test-expected.json');
const sentinelFile = path.join(profile, 'workspace.json');
if (phase === 'crud') fs.writeFileSync(sentinelFile, '{"localStorage":{"notch-todo-data":"DO NOT CHANGE"}}');
const sentinel = fs.readFileSync(sentinelFile, 'utf8');
let healthyFile;
if (phase === 'corrupt') { healthyFile = fs.readFileSync(dataFile, 'utf8'); fs.writeFileSync(dataFile, '{ broken countdown JSON'); }
const registrations = [];
const { ipcMain } = require('electron');
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, handler) => { registrations.push(channel); return originalHandle(channel, handler); };
const mainPath = require.resolve('../main.js'), originalLoader = Module._extensions['.js'];
Module._extensions['.js'] = function (module, filename) {
  if (filename !== mainPath) return originalLoader(module, filename);
  module._compile(fs.readFileSync(filename, 'utf8') + `\nmodule.exports = {
    window: () => mainWindow, store: getCountdownStore,
  };`, filename);
};
const errors = [];
app.on('web-contents-created', (_event, contents) => {
  contents.on('console-message', details => { if (details.level === 'error') errors.push(details.message); });
  contents.on('render-process-gone', (_event, details) => errors.push(JSON.stringify(details)));
});
process.on('uncaughtException', error => { console.error(error); app.exit(1); });
require('./fixtures/install-calendar');
const main = require('../main.js');
Module._extensions['.js'] = originalLoader;
ipcMain.handle = originalHandle;
assert.deepEqual(registrations.sort(), ['window:renderer-ready', 'window:report-state', 'settings:set-reminder-minutes', 'app:about', 'settings:get', 'settings:set-auto-collapse-seconds', 'settings:set-menu-bar-icon',
  'settings:set-auto-launch', 'window:set-mode', 'window:begin-collapse', 'window:set-tab', 'window:metrics',
  'calendar:refresh', 'calendar:request-access', 'calendar:select', 'calendar:open-settings',
  'reminders:refresh', 'reminders:request-access', 'reminders:complete', 'reminders:open-settings',
  'countdowns:list', 'countdowns:create', 'countdowns:update', 'countdowns:delete', 'countdowns:pin'].sort(),
  'Only explicit active window/settings/countdown/calendar/reminders handlers may be registered');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const timeout = setTimeout(() => { console.error('Countdown integration timed out', phase, errors); app.exit(1); }, 60000);
(async () => {
  await app.whenReady();
  const window = main.window();
  if (window.webContents.isLoading()) await new Promise(resolve => window.webContents.once('did-finish-load', resolve));
  const js = code => window.webContents.executeJavaScript(code);
  async function waitFor(code, message = code) {
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) { if (await js(code)) return; await sleep(20); }
    throw new Error('Timeout: ' + message);
  }
  const waitMode = mode => waitFor(`document.getElementById('app').classList.contains('${mode}') && !NotchPanel.getState().busy`);
  const waitSaved = () => waitFor(`!CountdownUI.getState().busy && !document.getElementById('countdown-editor').open`, 'editor save');
  const click = id => js(`document.getElementById(${JSON.stringify(id)}).click()`);
  async function pointerClick(selector) {
    const point = await js(`(() => { const bounds = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: Math.round(bounds.left + bounds.width / 2), y: Math.round(bounds.top + bounds.height / 2) }; })()`);
    window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...point });
    window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...point });
    await sleep(30);
  }
  const action = (id, name) => js(`document.querySelector('[data-id="${id}"] [data-action="${name}"]').click()`);
  const rows = () => JSON.parse(fs.readFileSync(dataFile, 'utf8')).items;
  async function openPanel() {
    // This is a manual test setup: stop startup's temporary session before
    // establishing native focus (showInactive intentionally starts unfocused).
    await js(`NotchPanel.setMode(true)`); await waitMode('expanded');
    window.show();
    if (process.platform === 'darwin') app.focus({ steal: true });
    window.focus(); window.webContents.focus();
    const deadline = Date.now() + 2000;
    while (!(await js('document.hasFocus()')) && Date.now() < deadline) {
      if (process.platform === 'darwin') app.focus({ steal: true });
      window.show(); window.focus(); window.webContents.focus(); await sleep(30);
    }
    await sleep(80);
    assert.equal(await js('document.hasFocus()'), true, 'native focus must settle before countdown interactions');
    await js(`NotchPanel.setMode(true)`); await waitMode('expanded');
  }
  async function fill(input) {
    await js(`(() => { const input = ${JSON.stringify(input)};
      document.getElementById('countdown-title').value = input.title;
      document.getElementById('countdown-date').value = input.targetDate;
      document.getElementById('countdown-time').value = input.targetTime || '';
      document.getElementById('countdown-color').value = input.color || CountdownModel.COLORS[0];
      document.getElementById('countdown-pinned').checked = !!input.pinned;
    })()`);
  }
  async function create(input) { await click('countdown-add'); await fill(input); await click('countdown-save'); await waitSaved(); return rows().find(item => item.title === input.title.trim()); }
  const value = id => js(`document.querySelector('[data-id="${id}"] .countdown-value').textContent`);
  await js(`CountdownUI.ready`);
  assert.equal(app.getPath('userData'), profile);
  assert.equal(main.store().filePath, dataFile);
  assert.equal(await js(`typeof require`), 'undefined');
  assert.equal(await js(`'readFile' in notchAPI`), false);
  const collapsedBounds = window.getBounds();
  // CRUD/picker assertions isolate OS focus changes; the actual production
  // native blur handler is restored and tested explicitly below.
  const nativeBlurHandlers = window.listeners('blur');
  const isolateBlur = () => nativeBlurHandlers.forEach(handler => window.removeListener('blur', handler));
  const restoreBlur = () => nativeBlurHandlers.forEach(handler => window.on('blur', handler));
  isolateBlur();
  await openPanel(); const expandedBounds = window.getBounds();
  // Controlled browser focus for CRUD/picker/keyboard assertions. It is disabled
  // before the real native blur assertion; no production behavior is replaced.
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', { enabled: true });
  assert.deepEqual(await js(`[...document.querySelectorAll('.tab')].map(tab => tab.dataset.tab)`), ['calendar', 'settings']);
  if (phase === 'crud') {
    assert.equal(await js(`CountdownUI.getState().count`), 0);
    assert.equal(fs.existsSync(dataFile), false);
    assert.equal(await js(`document.getElementById('countdown-empty').hidden`), false);
    assert.equal(await js(`document.getElementById('calendar-date')`), null);
    assert.equal(await js(`(() => { const page = document.querySelector('.calendar-page'); return page.scrollHeight <= page.clientHeight + 1; })()`), true, 'empty overview fits one page');
    const evidence = path.join(__dirname, '..', '.cache', 'phase1-5'); fs.mkdirSync(evidence, { recursive: true });
    await sleep(500);
    fs.writeFileSync(path.join(evidence, 'empty.png'), (await window.webContents.capturePage()).toPNG());
    await click('countdown-add');
    assert.equal(await js(`document.activeElement.id`), 'countdown-title');
    await fill({ title: ' ', targetDate: '2027-08-31' }); await click('countdown-save');
    assert.match(await js(`document.getElementById('countdown-form-error').textContent`), /名称/);
    assert.equal(fs.existsSync(dataFile), false);
    await fill({ title: '论文投稿', targetDate: '2027-02-29' }); await click('countdown-save');
    assert.match(await js(`document.getElementById('countdown-form-error').textContent`), /日期/);
    // Space within the form must not toggle the native panel.
    await js(`document.getElementById('countdown-title').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`);
    assert.equal(await js(`NotchPanel.getState().expanded`), true);
    window.webContents.emit('before-input-event', {}, { type: 'keyDown', key: 'Escape' });
    await waitFor(`!document.getElementById('countdown-editor').open`);
    assert.equal(await js(`NotchPanel.getState().expanded`), true, 'Escape closes form first');
    assert.equal(await js(`document.activeElement.id`), 'countdown-add');
    // Trusted mouse clicks open the replacement pickers in the same window.
    // No manual date/time text entry is needed to create this item.
    await click('countdown-add');
    await js(`document.getElementById('countdown-title').value = '选择器测试'`);
    await pointerClick('#countdown-date-open');
    await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    assert.equal(await js(`document.getElementById('countdown-editor').open`), true);
    assert.deepEqual(window.getBounds(), expandedBounds);
    await js(`(() => { const year = document.getElementById('countdown-picker-year'); year.value = 2028; year.dispatchEvent(new Event('change')); const month = document.getElementById('countdown-picker-month'); month.value = 2; month.dispatchEvent(new Event('change')); })()`);
    assert.equal(await js(`document.querySelectorAll('#countdown-picker-days button').length`), 29, 'leap-year calendar');
    await click('countdown-month-next'); assert.equal(await js(`document.getElementById('countdown-month-label').textContent`), '2028 年 3 月');
    await click('countdown-month-prev'); assert.equal(await js(`document.getElementById('countdown-month-label').textContent`), '2028 年 2 月');
    await sleep(100);
    fs.writeFileSync(path.join(evidence, 'date-picker.png'), (await window.webContents.capturePage()).toPNG());
    await pointerClick('#countdown-picker-days [data-date="2028-02-29"]');
    assert.equal(await js(`document.getElementById('countdown-date').value`), '2028-02-29');
    assert.equal(await js(`document.getElementById('countdown-picker-dialog').open`), false);
    assert.equal(await js(`document.activeElement.id`), 'countdown-date-open');
    await pointerClick('#countdown-date-open'); await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    // Arrow keys cross a month boundary, with a stable focused day.
    await js(`document.querySelector('[data-date="2028-02-29"]').focus()`);
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Right' });
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Right' });
    await waitFor(`document.activeElement.dataset.date === '2028-03-01'`);
    await pointerClick('#countdown-picker-days [data-date="2028-03-01"]');
    await pointerClick('#countdown-time-open'); await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    async function selectByKeyboard(id, steps) {
      await js(`document.getElementById(${JSON.stringify(id)}).focus()`);
      for (const keyCode of ['Home', ...Array(steps).fill('Down')]) {
        window.webContents.sendInputEvent({ type: 'keyDown', keyCode });
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode });
      }
      await waitFor(`document.getElementById(${JSON.stringify(id)}).value === '${steps}'`);
    }
    await selectByKeyboard('countdown-picker-hour', 9); await selectByKeyboard('countdown-picker-minute', 30);
    await sleep(100);
    fs.writeFileSync(path.join(evidence, 'time-picker.png'), (await window.webContents.capturePage()).toPNG());
    await pointerClick('#countdown-picker-time-apply');
    assert.equal(await js(`document.getElementById('countdown-time').value`), '09:30');
    assert.equal(await js(`NotchPanel.getState().expanded`), true, 'picker does not blur/collapse the window');
    await pointerClick('#countdown-time-open'); await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    assert.equal(await js(`document.getElementById('countdown-picker-hour').value`), '9');
    assert.equal(await js(`document.getElementById('countdown-picker-minute').value`), '30');
    await js(`document.getElementById('countdown-picker-hour').value = '18'`); await click('countdown-time-picker-cancel');
    assert.equal(await js(`document.getElementById('countdown-time').value`), '09:30', 'cancel does not commit time');
    await pointerClick('#countdown-time-open'); await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
    await waitFor(`!document.getElementById('countdown-picker-dialog').open`);
    assert.equal(await js(`document.getElementById('countdown-editor').open`), true, 'first Escape only closes picker');
    assert.equal(await js(`NotchPanel.getState().expanded`), true);
    await click('countdown-save'); await waitSaved();
    const pickerItem = rows().find(item => item.title === '选择器测试');
    assert.equal(pickerItem.targetDate, '2028-03-01'); assert.equal(pickerItem.targetTime, '09:30');
    await action(pickerItem.id, 'edit');
    await pointerClick('#countdown-date-open'); await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    assert.equal(await js(`document.querySelector('[aria-selected="true"][data-date]').dataset.date`), '2028-03-01', 'editing restores selected date');
    await click('countdown-date-picker-cancel');
    await pointerClick('#countdown-time-open'); await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    await pointerClick('#countdown-picker-no-time');
    assert.equal(await js(`document.getElementById('countdown-time').value`), '');
    await click('countdown-save'); await waitSaved();
    assert.equal(rows().find(item => item.id === pickerItem.id).targetTime, null);
    await action(pickerItem.id, 'delete'); await click('countdown-delete-confirm');
    await waitFor(`!CountdownUI.getState().busy && !document.getElementById('countdown-delete-dialog').open`);
    const paper = await create({ title: '  论文投稿  ', targetDate: '2027-08-31', color: '#B58CFF' });
    assert.equal(paper.title, '论文投稿');
    assert.equal(await js(`document.querySelector('[data-id="${paper.id}"] h3').textContent`), '论文投稿');
    assert.equal(await value(paper.id), await js(`CountdownModel.calculateCountdown(${JSON.stringify(paper)}).label`));
    await action(paper.id, 'edit');
    await fill({ title: '论文投稿截止', targetDate: '2027-09-01', targetTime: '09:00', color: '#FF9352', pinned: true });
    // Enter uses the real form submit and retains the current window state.
    window.focus(); window.webContents.focus();
    await js(`document.getElementById('countdown-title').focus()`);
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' });
    window.webContents.sendInputEvent({ type: 'char', keyCode: '\r' });
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' });
    await waitSaved();
    const edited = rows().find(item => item.id === paper.id);
    assert.equal(edited.title, '论文投稿截止'); assert.equal(edited.targetTime, '09:00'); assert.equal(edited.pinned, true);
    assert.equal(await js(`document.querySelector('[data-id="${paper.id}"] h3').textContent`), edited.title);
    const exam = await create({ title: '考试日期', targetDate: '2027-01-10' });
    await action(exam.id, 'pin'); await waitFor(`!CountdownUI.getState().busy`);
    assert.equal(rows().find(item => item.id === exam.id).pinned, true);
    assert.equal(await js(`document.querySelector('.countdown-card').dataset.id`), exam.id);
    await action(exam.id, 'delete');
    assert.equal(await js(`document.activeElement.id`), 'countdown-delete-cancel');
    const beforeCancel = fs.readFileSync(dataFile, 'utf8'); await click('countdown-delete-cancel');
    assert.equal(fs.readFileSync(dataFile, 'utf8'), beforeCancel);
    await action(exam.id, 'delete'); await click('countdown-delete-confirm');
    await waitFor(`!CountdownUI.getState().busy && !document.getElementById('countdown-delete-dialog').open`);
    assert.equal(rows().some(item => item.id === exam.id), false);
    // Save failure is visible, retains the form, and never reports success.
    const originalRename = main.store().io.rename;
    main.store().io = { ...main.store().io, rename: async () => { throw Object.assign(new Error('test disk failure'), { code: 'EIO' }); } };
    await click('countdown-add'); await fill({ title: '项目交付', targetDate: '2027-03-01' }); await click('countdown-save');
    await waitFor(`!CountdownUI.getState().busy`);
    assert.equal(await js(`document.getElementById('countdown-editor').open`), true);
    assert.match(await js(`document.getElementById('countdown-form-error').textContent`), /write_failed/);
    assert.equal(rows().length, 1);
    main.store().io.rename = originalRename;
    await click('countdown-save'); await waitSaved();
    assert.equal(await js(`document.getElementById('countdown-retry').hidden`), true, 'successful retry clears stale error controls');
    await create({ title: '毕业日期', targetDate: '2027-06-30', color: '#30D978' });
    await create({ title: '个人纪念日', targetDate: '2027-10-11', color: '#FF5F57' });
    const midnight = await create({ title: '午夜测试', targetDate: '2026-10-12' });
    assert.equal(await js(`document.querySelectorAll('.countdown-card').length`), 4);
    await click('countdown-view-all'); assert.equal(await js(`document.querySelectorAll('.countdown-card').length`), 5);
    assert.deepEqual(window.getBounds(), expandedBounds);
    assert.equal(await js(`getComputedStyle(document.querySelector('.calendar-page')).overflowY`), 'auto');
    assert.equal(await js(`CountdownUI.getState().refreshActive`), true);
    // Simulated local clock, actual scheduled refresh + Main resume IPC.
    await js(`(() => { window.__RealDate = Date; window.__clock = new Date(2026, 9, 11, 23, 59, 59, 800).getTime();
      window.Date = class extends __RealDate { constructor(...args) { super(...(args.length ? args : [window.__clock])); } static now() { return window.__clock; } };
    })()`);
    powerMonitor.emit('resume'); await sleep(30);
    assert.equal(await value(midnight.id), '还有 1 天');
    await js(`window.__clock = new __RealDate(2026, 9, 12, 0, 0, 0).getTime()`); await sleep(240);
    assert.equal(await value(midnight.id), '今天', 'scheduled minute/midnight refresh');
    await js(`window.__clock = new __RealDate(2026, 9, 13, 10, 0, 0).getTime()`);
    powerMonitor.emit('resume'); await waitFor(`document.querySelector('[data-id="${midnight.id}"] .countdown-value').textContent === '已过去 1 天'`);
    assert.equal(await js(`NotchPanel.getState().source`), 'manual');
    assert.deepEqual(window.getBounds(), expandedBounds);
    await js(`(() => { window.Date = window.__RealDate; })()`); powerMonitor.emit('resume');
    await action(midnight.id, 'delete'); await click('countdown-delete-confirm');
    await waitFor(`!CountdownUI.getState().busy && !document.getElementById('countdown-delete-dialog').open`);
    await click('tab-button-settings');
    await waitFor(`document.getElementById('tab-settings').classList.contains('active')`);
    assert.equal(await js(`CountdownUI.getState().refreshActive`), false);
    await click('tab-button-calendar');
    await waitFor(`document.getElementById('tab-calendar').classList.contains('active')`);
    assert.equal(await js(`CountdownUI.getState().refreshActive`), true);
    // Real blur while editing dismisses both modal and panel.
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', { enabled: false });
    restoreBlur();
    await openPanel();
    await click('countdown-add'); await pointerClick('#countdown-date-open');
    await waitFor(`document.getElementById('countdown-picker-dialog').open`);
    const other = new BrowserWindow({ width: 200, height: 100, show: true });
    app.focus({ steal: true }); other.show(); other.focus();
    const focusDeadline = Date.now() + 2000;
    while (!other.isFocused() && Date.now() < focusDeadline) { other.focus(); await sleep(30); }
    assert.equal(other.isFocused(), true, 'native auxiliary window takes focus before blur assertion');
    await waitMode('collapsed'); other.destroy(); isolateBlur();
    assert.equal(await js(`document.getElementById('countdown-editor').open`), false);
    assert.equal(await js(`document.getElementById('countdown-picker-dialog').open`), false, 'blur closes picker too');
    assert.equal(await js(`CountdownUI.getState().refreshActive`), false);
    assert.deepEqual(window.getBounds(), collapsedBounds);
    powerMonitor.emit('resume'); await sleep(30);
    assert.equal(await js(`NotchPanel.getState().expanded`), false, 'resume is coordinated rather than immediately competing with collapse');
    assert.deepEqual(window.getBounds(), collapsedBounds);
    await openPanel();
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', { enabled: true });
    assert.equal(await js(`(() => { const page = document.querySelector('.calendar-page'); return page.scrollHeight <= page.clientHeight + 1; })()`), true, 'four-card default overview fits one page');
    const weekSize = await js(`(() => { const week = document.getElementById('week-events'); return { scroll: week.scrollHeight, client: week.clientHeight }; })()`);
    assert.equal(weekSize.scroll <= weekSize.client + 1, true, `all seven mock days fit in the default overview: ${JSON.stringify(weekSize)}`);
    fs.writeFileSync(expectedFile, JSON.stringify(rows()));
    await sleep(500);
    assert.equal(await js(`Number(getComputedStyle(document.querySelector('.panels')).opacity) >= .99`), true, 'content is visible after the opening animation');
    fs.writeFileSync(path.join(evidence, 'countdowns.png'), (await window.webContents.capturePage()).toPNG());
    await click('countdown-add'); await sleep(100);
    fs.writeFileSync(path.join(evidence, 'editor.png'), (await window.webContents.capturePage()).toPNG());
    await click('countdown-cancel');
  } else if (phase === 'restart') {
    const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));
    assert.deepEqual(rows(), expected);
    assert.equal(await js(`CountdownUI.getState().count`), expected.length);
    assert.deepEqual(await js(`[...document.querySelectorAll('.countdown-card')].map(card => card.dataset.id)`), require('../renderer/countdown-model').sortCountdowns(expected).map(item => item.id));
    for (const item of expected) assert.equal(await value(item.id), await js(`CountdownModel.calculateCountdown(${JSON.stringify(item)}).label`));
  } else if (phase === 'corrupt') {
    assert.equal(await js(`CountdownUI.getState().available`), false);
    assert.equal(await js(`document.getElementById('countdown-add').disabled`), true);
    assert.match(await js(`document.getElementById('countdown-status').textContent`), /invalid_json/);
    const rejected = await js(`notchAPI.createCountdown({ title: '不得覆盖', targetDate: '2027-01-01' })`);
    assert.equal(rejected.ok, false); assert.equal(rejected.error, 'invalid_json');
    assert.equal(fs.readFileSync(dataFile, 'utf8'), '{ broken countdown JSON');
    fs.writeFileSync(dataFile, healthyFile); await click('countdown-retry');
    await waitFor(`CountdownUI.getState().available`);
    assert.equal(await js(`CountdownUI.getState().count`), rows().length);
  } else throw new Error('Unknown test phase');

  restoreBlur();
  assert.equal(servers, 0); assert.equal(processes, 0); assert.equal(loginWrites, 0);
  assert.equal(fs.readFileSync(sentinelFile, 'utf8'), sentinel);
  assert.equal(await js(`localStorage.getItem('notch-todo-data')`), null);
  assert.deepEqual(errors, []);
  console.log(`PASS countdown ${phase}: production IPC/UI, isolated persistent data, zero page errors and dormant legacy services`);
  clearTimeout(timeout); app.quit();
})().catch(error => { console.error(error); clearTimeout(timeout); app.exit(1); });
