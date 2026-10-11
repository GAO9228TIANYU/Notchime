// Loads the real Main + sandboxed preload. Instrumentation is test-local; no
// diagnostic IPC or test-only branch is added to the shipped application.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const http = require('node:http');
const childProcess = require('node:child_process');
const { app, BrowserWindow, screen } = require('electron');
const profile = process.env.CALENDAR_TEST_USER_DATA;
if (!profile) throw new Error('Run via npm test for a project-contained profile');
app.commandLine.appendSwitch('user-data-dir', profile);
app.commandLine.appendSwitch('use-mock-keychain');
app.setPath('userData', profile); app.setPath('sessionData', profile); app.setPath('crashDumps', profile);
app.setAppLogsPath(path.join(profile, 'logs'));
let loginWrites = 0, loginReads = 0, serverStarts = 0, processes = 0;
app.setLoginItemSettings = () => { loginWrites++; throw new Error('Tests must never write login items'); };
app.getLoginItemSettings = () => { loginReads++; return { openAtLogin: false }; };
const originalListen = http.Server.prototype.listen;
http.Server.prototype.listen = function () { serverStarts++; throw new Error('Phase 1 must not start HTTP services'); };
const originalExec = childProcess.execFile;
childProcess.execFile = () => { processes++; throw new Error('Phase 1 must not start business subprocesses'); };
const registrations = [];
const { ipcMain } = require('electron');
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, handler) => { registrations.push(channel); return originalHandle(channel, handler); };
const mainPath = require.resolve('../main.js');
const originalLoader = Module._extensions['.js'];
Module._extensions['.js'] = function (module, filename) {
  if (filename !== mainPath) return originalLoader(module, filename);
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(source + `\nmodule.exports = {
    window: () => mainWindow,
    inspect: () => ({ currentMode }),
    auto: () => automaticReveal, getBoundsForMode, beginNativeCollapse, requestRendererExpand, toggleVisibility,
  };`, filename);
};
const errors = [];
app.on('web-contents-created', (_event, contents) => {
  contents.on('console-message', (details) => { if (details.level === 'error') errors.push(details.message); });
  contents.on('render-process-gone', (_event, details) => errors.push(JSON.stringify(details)));
});
process.on('uncaughtException', error => { console.error(error); app.exit(1); });
const timer = setTimeout(() => { console.error('Production startup timed out', errors); app.exit(1); }, 65000);
const phase = process.env.CALENDAR_TEST_PHASE;
if (phase === 'initial') {
  // Even saved legacy preferences cannot restart retired services. Keep them
  // unchanged in this isolated profile while the new preference is added.
  fs.writeFileSync(path.join(profile, 'app-settings.json'), JSON.stringify({ features: { clip: true }, defaultTab: 'todo', preserved: 'keep-me' }));
  fs.writeFileSync(path.join(profile, 'workspace.json'), JSON.stringify({ localStorage: { 'notch-todo-data': 'legacy-sentinel' } }));
}
const workspaceBefore = fs.readFileSync(path.join(profile, 'workspace.json'), 'utf8');
require('./fixtures/install-calendar');
const main = require('../main.js');
Module._extensions['.js'] = originalLoader;
ipcMain.handle = originalHandle;
assert.deepEqual(registrations.sort(), ['window:renderer-ready', 'window:report-state', 'settings:set-reminder-minutes', 'app:about', 'settings:get', 'settings:set-auto-collapse-seconds',
  'settings:set-auto-launch', 'window:set-mode', 'window:begin-collapse', 'window:set-tab', 'window:metrics',
  'calendar:refresh', 'calendar:request-access', 'calendar:select', 'calendar:open-settings',
  'reminders:refresh', 'reminders:request-access', 'reminders:complete', 'reminders:open-settings',
  'countdowns:list', 'countdowns:create', 'countdowns:update', 'countdowns:delete', 'countdowns:pin'].sort(),
  'Only explicit active window/settings/countdown/calendar/reminders handlers may be registered');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await app.whenReady();
  const window = main.window();
  if (window.webContents.isLoading()) await new Promise(r => window.webContents.once('did-finish-load', r));
  await sleep(350);
  const js = script => window.webContents.executeJavaScript(script);
  await js("window.testInputs=[]; for(const name of ['pointerdown','keydown','wheel','click']) document.addEventListener(name,e=>testInputs.push({type:e.type,target:e.target.id,trusted:e.isTrusted}),true)");
  const focusEvents = [];
  window.on('blur', () => focusEvents.push(['blur', Date.now()]));
  window.on('focus', () => focusEvents.push(['focus', Date.now()]));
  async function focusMainWindow() {
    window.show();
    if (process.platform === 'darwin') app.focus({ steal: true });
    window.focus(); window.webContents.focus();
    const deadline = Date.now() + 2000;
    while (!(await js('document.hasFocus()')) && Date.now() < deadline) {
      if (process.platform === 'darwin') app.focus({ steal: true });
      window.show(); window.focus(); window.webContents.focus(); await sleep(30);
    }
    await sleep(80);
    assert.equal(await js('document.hasFocus()'), true, 'native focus must be established before keyboard tests');
  }
  async function waitMode(name) {
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      if (await js(`document.getElementById('app').classList.contains('${name}') && !window.NotchPanel.getState().busy`)) return;
      await sleep(20);
    }
    throw new Error('Timeout waiting for ' + name + ': ' + JSON.stringify({ main: main.inspect(), automatic: {state:main.auto().state, session:main.auto().session, timer:!!main.auto().timer}, focused: window.isFocused(),
      renderer: await js(`({ state: NotchPanel.getState(), classes: document.getElementById('app').className, focus: document.hasFocus(), active: document.activeElement.id, inputs: window.testInputs })`), focusEvents, errors }));
  }
  assert.equal(app.getName(), 'Calendar Notch Dev');
  assert.equal(app.getPath('userData'), profile);
  assert.equal(window.isVisible(), true); assert.equal(window.isAlwaysOnTop(), true);
  if (process.platform === 'darwin') assert.equal(window.isVisibleOnAllWorkspaces(), true);
  const preferences = window.webContents.getLastWebPreferences();
  assert.equal(preferences.contextIsolation, true); assert.equal(preferences.sandbox, true); assert.equal(preferences.nodeIntegration, false);
  await waitMode('expanded');
  assert.equal(await js('NotchPanel.getState().source'), 'automatic', 'startup automatically reveals once');
  window.webContents.sendInputEvent({type:'mouseMove',x:-80,y:-80});
  window.webContents.sendInputEvent({type:'mouseLeave',x:-80,y:-80});
  await sleep(100);
  assert.equal(await js("document.getElementById('panel').matches(':hover')"), false, 'pointer must actually leave the automatic panel');
  await waitMode('collapsed');
  const collapsedBounds = window.getBounds(); assert.equal(collapsedBounds.width, 200);
  if (process.platform === 'darwin') {
    const external = { bounds: { x: -1920, y: -200, width: 1920, height: 1080 }, workArea: { x: -1920, y: -172, width: 1920, height: 1052 } };
    assert.deepEqual(main.getBoundsForMode('collapsed', external), { x: -1060, y: -200, width: 200, height: 28 });
    assert.deepEqual(main.getBoundsForMode('expanded', external), { x: -1580, y: -200, width: 1240, height: 616 });
    const narrow = { bounds: { x: 100, y: 50, width: 1000, height: 580 }, workArea: { x: 100, y: 74, width: 1000, height: 556 } };
    assert.deepEqual(main.getBoundsForMode('expanded', narrow), { x: 112, y: 50, width: 976, height: 556 });
  }

  const initial = await js(`(async () => ({ tabs: [...document.querySelectorAll('.tab')].map(b => b.dataset.tab),
    today: document.querySelectorAll('#today-events .calendar-event').length,
    days: document.querySelectorAll('.calendar-day').length,
    settings: await window.notchAPI.getAppSettings(),
    retired: ['getMusicStatus','listWindows','scheduleTodoReminders','getWorkspace','startTranscription'].some(k => k in window.notchAPI) }))()`);
  assert.deepEqual(initial.tabs, ['calendar', 'settings']); assert.equal(initial.today, 3); assert.equal(initial.days, 7);
  assert.equal(initial.retired, false);
  assert.equal(initial.settings.autoCollapseSeconds, phase === 'initial' ? 4 : 6);
  if (process.platform === 'darwin') { assert.equal(initial.settings.autoLaunchSupported, false); assert.equal(loginWrites, 0); }
  await focusMainWindow();
  await js(`document.getElementById('notch').click()`); await waitMode('expanded');
  assert.deepEqual(window.getBounds(), main.getBoundsForMode('expanded'));
  assert.equal(window.getBounds().y, collapsedBounds.y);
  const expandedBounds = window.getBounds();
  await js(`document.getElementById('tab-button-settings').click()`); await sleep(200);
  assert.deepEqual(window.getBounds(), expandedBounds, 'tab switch must not resize native window');
  if (phase === 'initial') {
    await js(`(() => { const input = document.getElementById('settings-auto-collapse'); input.value = 6; input.dispatchEvent(new Event('change')); })()`);
    await sleep(200);
    assert.equal(JSON.parse(fs.readFileSync(path.join(profile, 'app-settings.json'))).autoCollapseSeconds, 6);
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(profile, 'app-settings.json'))).preserved, 'keep-me');
  // Keyboard assertions require an expanded, focused panel. Unrelated OS blur
  // during setup is not an Escape stimulus; native blur is tested separately below.
  const keyboardBlurHandlers = window.listeners('blur');
  for (const handler of keyboardBlurHandlers) window.removeListener('blur', handler);
  await focusMainWindow();
  await js('NotchPanel.setMode(true).then(() => NotchPanel.setActiveTab("settings"))');
  await waitMode('expanded');
  const settingsDeadline = Date.now() + 3000;
  while (!(await js('NotchPanel.getState().tab === "settings" && document.getElementById("tab-settings").classList.contains("active")')) && Date.now() < settingsDeadline) await sleep(20);
  const focusState = await js(`(() => {
    const input = document.getElementById('settings-auto-collapse'); input.focus();
    return { active: document.activeElement.id, disabled: input.disabled,
      inert: document.getElementById('panel').inert, state: window.NotchPanel.getState() };
  })()`);
  assert.equal(focusState.active, 'settings-auto-collapse', JSON.stringify(focusState));
  window.webContents.emit('before-input-event', {}, { type: 'keyDown', key: 'Escape' }); await sleep(50);
  assert.equal(await js(`window.NotchPanel.getState().expanded`), true, 'first Escape exits input');
  window.webContents.emit('before-input-event', {}, { type: 'keyDown', key: 'Escape' }); await waitMode('collapsed');
  assert.deepEqual(window.getBounds(), collapsedBounds);
  for (const handler of keyboardBlurHandlers) window.on('blur', handler);
  // Main-driven manual opening shares the same Renderer animation path.
  main.requestRendererExpand('settings'); await waitMode('expanded'); await sleep(100);
  assert.equal(await js(`window.NotchPanel.getState().tab`), 'settings');
  const otherWindow = new BrowserWindow({ width: 240, height: 120, show: true });
  app.focus({ steal: true }); otherWindow.show(); otherWindow.focus();
  const otherFocusDeadline = Date.now() + 2000;
  while (!otherWindow.isFocused() && Date.now() < otherFocusDeadline) { otherWindow.focus(); await sleep(30); }
  assert.equal(otherWindow.isFocused(), true, 'the auxiliary native window must actually take focus before checking blur collapse');
  await waitMode('collapsed'); otherWindow.destroy();
  assert.deepEqual(window.getBounds(), collapsedBounds);
  // Watchdog recovers even if the Renderer never acknowledges collapse.
  await focusMainWindow();
  await js(`window.NotchPanel.setMode(true)`); await waitMode('expanded');
  assert.equal(main.inspect().currentMode, 'expanded');
  main.beginNativeCollapse();
  const watchdogDeadline = Date.now() + 2500;
  while (main.inspect().currentMode !== 'collapsed' && Date.now() < watchdogDeadline) await sleep(20);
  assert.equal(main.inspect().currentMode, 'collapsed'); assert.deepEqual(window.getBounds(), collapsedBounds);
  await js(`window.NotchPanel.setMode(false)`); await waitMode('collapsed');
  // A real display event exercises debounced reposition/metrics delivery.
  for (const event of ['display-added', 'display-removed', 'display-metrics-changed']) {
    screen.emit(event, {}, screen.getPrimaryDisplay(), ['workArea']); await sleep(200);
    assert.deepEqual(window.getBounds(), main.getBoundsForMode('collapsed'));
  }
  assert.deepEqual(window.getBounds(), main.getBoundsForMode('collapsed'));
  assert.equal(await js(`getComputedStyle(document.documentElement).getPropertyValue('--notch-h').trim()`), `${window.getBounds().height}px`);
  await focusMainWindow();
  await js(`document.getElementById('notch').click()`); await waitMode('expanded');
  // Isolate the timer rule from unrelated OS focus switches. The real native
  // blur -> collapse path was asserted above with a second BrowserWindow.
  // Removing only that stimulus leaves every automatic timer/IPC/animation live:
  // an erroneous manual auto-collapse still fails the unchanged assertion.
  const blurHandlers = window.listeners('blur');
  for (const handler of blurHandlers) window.removeListener('blur', handler);
  try {
    await sleep(4200);
    assert.equal(await js(`window.NotchPanel.getState().expanded`), true,
      'manual opening never starts an auto-collapse timer');
  } finally { for (const handler of blurHandlers) window.on('blur', handler); }
  assert.deepEqual(main.inspect(), { currentMode: 'expanded' });
  assert.equal(serverStarts, 0); assert.equal(processes, 0);
  assert.equal(fs.readFileSync(path.join(profile, 'workspace.json'), 'utf8'), workspaceBefore);
  assert.equal(await js(`localStorage.getItem('notch-todo-data')`), null);
  assert.deepEqual(errors, []);
  // Save a reviewable screenshot inside the project, not in the user's profile.
  const evidence = path.join(__dirname, '..', '.cache', 'phase1'); fs.mkdirSync(evidence, { recursive: true });
  if (phase === 'initial') {
    fs.writeFileSync(path.join(evidence, 'calendar.png'), (await window.webContents.capturePage()).toPNG());
    await js(`document.getElementById('tab-button-settings').click()`); await sleep(300);
    fs.writeFileSync(path.join(evidence, 'settings.png'), (await window.webContents.capturePage()).toPNG());
  }
  // Exercise automatic expansion and an immediate manual takeover.
  await js('NotchPanel.setMode(false)'); await waitMode('collapsed');
  await focusMainWindow();
  const automaticAccepted = main.requestRendererExpand('calendar', 'automatic'); await waitMode('expanded');
  assert.equal(await js('NotchPanel.getState().source'), 'automatic', JSON.stringify({ automaticAccepted, mainAuto:main.auto().state, inputs: await js('testInputs') }));
  await js("NotchPanel.setMode(true, { source: 'manual' })");
  assert.equal(await js('NotchPanel.getState().source'), 'manual');
  // A display event cannot cancel an in-flight collapse watchdog.
  await focusMainWindow();
  assert.equal(main.inspect().currentMode, 'expanded');
  main.beginNativeCollapse();
  screen.emit('display-metrics-changed', {}, screen.getPrimaryDisplay(), ['bounds']);
  const displayWatchdogDeadline = Date.now() + 2500;
  while (main.inspect().currentMode !== 'collapsed' && Date.now() < displayWatchdogDeadline) await sleep(20);
  assert.equal(main.inspect().currentMode, 'collapsed');
  assert.deepEqual(window.getBounds(), collapsedBounds);
  await js('NotchPanel.setMode(false)'); await waitMode('collapsed');
  await focusMainWindow(); await js('NotchPanel.setMode(true)'); await waitMode('expanded');
  window.close(); await waitMode('collapsed');
  assert.equal(window.isDestroyed(), false, 'ordinary close hides the resident window');
  assert.equal(window.isVisible(), false);
  main.toggleVisibility(); await sleep(100);
  assert.equal(window.isVisible(), true);
  assert.deepEqual(window.getBounds(), main.getBoundsForMode('collapsed'));
  assert.deepEqual(errors, []);
  console.log(`PASS production ${phase}: real Main/preload/page, isolated profile, bounds, Escape/blur, watchdog/display race, all display events, close/hide/show, settings persistence, manual/automatic sources, zero business subprocesses/HTTP starts, startup automatic collapse / manual protection, zero page errors`);
  clearTimeout(timer);
  http.Server.prototype.listen = originalListen; childProcess.execFile = originalExec;
  app.quit();
})().catch(error => { console.error(error); clearTimeout(timer); app.exit(1); });
