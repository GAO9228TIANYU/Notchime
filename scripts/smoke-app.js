// Launch the real npm start path using Node's built-in WebSocket (no ws package).
// All application data and evidence stay inside the project's .cache directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.join(__dirname, '..');
const scratch = path.join(root, '.cache', 'tests');
fs.mkdirSync(scratch, { recursive: true });
const profile = fs.mkdtempSync(path.join(scratch, 'source-launch-'));
const packagedExecutable = process.env.CALENDAR_SMOKE_PACKAGE;
const fixtureMode = !packagedExecutable && process.env.CALENDAR_SMOKE_REAL !== '1';
if (packagedExecutable && !path.resolve(packagedExecutable).startsWith(path.join(root, '.cache') + path.sep)) throw new Error('Packaged validation must stay inside this project');
if (packagedExecutable) fs.writeFileSync(path.join(profile, '.first-run-done'), 'test: do not register login items');
const evidence = path.join(root, '.cache', 'phase4', packagedExecutable ? 'packaged-smoke' : 'source-smoke');
fs.mkdirSync(evidence, { recursive: true });
const env = { ...process.env, CALENDAR_TEST_NODE: process.execPath, TMPDIR: path.join(root, '.cache', 'tmp') };
delete env.ELECTRON_RUN_AS_NODE;
if (fixtureMode) env.NODE_OPTIONS = '--require=./tests/fixtures/smoke-bootstrap.js';
fs.mkdirSync(env.TMPDIR, { recursive: true });
let log = '', primary, secondary;
const clients = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(work, label) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) { const value = await work(); if (value) return value; await sleep(50); }
  throw new Error(`Timed out: ${label}\n${log.slice(-2000)}`);
}
function launch() {
  const child = spawn(packagedExecutable || 'npm', [...(packagedExecutable ? [] : [...(fixtureMode ? ['--ignore-scripts'] : []), 'start', '--']), `--user-data-dir=${profile}`, '--use-mock-keychain',
    '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1'], {
    cwd: root, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', bytes => { log += bytes; });
  child.stderr.on('data', bytes => { log += bytes; });
  child.on('error', error => { log += error.stack; });
  return child;
}
async function connect(url) {
  const socket = new WebSocket(url), pending = new Map(); let sequence = 0;
  clients.push(socket);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const value = JSON.parse(event.data);
    const call = pending.get(value.id); if (!call) return;
    pending.delete(value.id); clearTimeout(call.timer);
    if (value.error) call.reject(new Error(JSON.stringify(value.error))); else call.resolve(value.result);
  });
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timed out')); }, 10000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  return { request, socket };
}
(async () => {
  primary = launch();
  if (fixtureMode) await until(() => log.includes('AUDIT_FIXTURE_INSTALLED'), 'test-only provider preload');
  const port = await until(() => log.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/)?.[1], 'npm start');
  const endpoint = `http://127.0.0.1:${port}`;
  const page = await until(async () => (await (await fetch(endpoint + '/json')).json())
    .find(item => item.url.endsWith('/renderer/index.html')), 'local page');
  const { request: send } = await connect(page.webSocketDebuggerUrl);
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await until(() => evaluate('Boolean(window.NotchPanel && window.CountdownUI)'), 'page initialization');
  assert.equal(await evaluate('notchAPI.getAppSettings().then(s => s.appName)'), 'Notchime');
  assert.equal(await evaluate('notchAPI.getAppSettings().then(s => s.autoLaunchSupported)'), Boolean(packagedExecutable));
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".tab")].map(tab => tab.dataset.tab)'), ['calendar', 'settings']);
  await until(() => evaluate('CalendarUI.getSnapshot().authorization !== "loading"'), 'real native authorization status');
  await until(() => evaluate('NotchPanel.getState().source === "automatic" && !NotchPanel.getState().busy'), 'real startup automatic overview');
  assert.equal(await evaluate('document.getElementById("automatic-label").textContent'), '今日概览');
  const automaticStarted = Date.now();
  await send('Input.dispatchMouseEvent', {type:'mouseMoved',x:-80,y:-80});
  assert.equal(await evaluate('document.getElementById("panel").matches(":hover")'), false);
  await until(() => evaluate('!NotchPanel.getState().expanded && !NotchPanel.getState().busy'), 'real automatic four-second collapse');
  const automaticDurationMs = Date.now() - automaticStarted;
  assert.ok(automaticDurationMs >= 3900 && automaticDurationMs < 7000, `automatic duration: ${automaticDurationMs}`);
  console.log('STARTUP automatic overview/collapse:', automaticDurationMs, 'ms (includes closing animation)');
  const native = await evaluate('({ authorization: CalendarUI.getSnapshot().authorization, calendarCount: CalendarUI.getSnapshot().calendars.length, events: CalendarUI.getSnapshot().events.length, rendered: document.querySelectorAll("#today-events .calendar-event").length, expected: CalendarModel.createView(CalendarUI.getSnapshot()).today.length })');
  assert.equal(native.rendered, native.expected);
  assert.notEqual(native.authorization, 'error', 'real Helper must start and answer status');
  console.log('Calendar smoke metadata:', JSON.stringify(native));
  await until(() => evaluate('RemindersUI.getSnapshot().authorization !== "loading"'), 'real Reminders authorization/read');
  const remindersNative = await evaluate('({ authorization: RemindersUI.getSnapshot().authorization, count: RemindersUI.getSnapshot().items.length, rendered: document.querySelectorAll(".reminder-row").length })');
  assert.notEqual(remindersNative.authorization, 'error', 'real shared Helper must respond to Reminders status/read');
  assert.equal(remindersNative.count, remindersNative.rendered);
  console.log('Reminders read metadata (no automated writes):', JSON.stringify(remindersNative));
  assert.equal(await evaluate('notchAPI.listCountdowns().then(result => result.ok)'), true);
  await evaluate('NotchPanel.setMode(true)');
  await until(() => evaluate('NotchPanel.getState().expanded && !NotchPanel.getState().busy'), 'expanded state');
  secondary = launch();
  await until(() => secondary.exitCode !== null, 'second instance exits');
  assert.equal(secondary.exitCode, 0);
  assert.equal(primary.exitCode, null);
  const pages = await (await fetch(endpoint + '/json')).json();
  assert.equal(pages.filter(item => item.url.endsWith('/renderer/index.html')).length, 1);
  await evaluate('NotchPanel.setActiveTab("settings")');
  assert.equal(await evaluate('notchAPI.setAutoCollapseSeconds(9).then(result => result.ok)'), true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(profile, 'app-settings.json'))).autoCollapseSeconds, 9);
  await sleep(500);
  fs.writeFileSync(path.join(evidence, 'source-settings.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const browser = await (await fetch(endpoint + '/json/version')).json();
  const { socket: shutdown } = await connect(browser.webSocketDebuggerUrl);
  // Electron may close CDP without acknowledging Browser.close. The actual
  // process exit (and its exit code) is the authoritative shutdown result.
  shutdown.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
  await until(() => primary.exitCode !== null, 'normal application quit');
  assert.equal(primary.exitCode, 0);
  fs.writeFileSync(path.join(evidence, 'source-start.json'), JSON.stringify({ ok: true,
    native, remindersNative, automaticDurationMs, mode: fixtureMode ? 'fixture-npm-start' : packagedExecutable ? 'packaged' : 'source', checks: [packagedExecutable ? 'local .app launch' : 'npm start', 'automatic startup overview / timed collapse', 'Calendar rendering', 'Countdown IPC', 'Settings persistence', 'single instance', 'normal quit'] }, null, 2));
  console.log(`PASS ${packagedExecutable ? 'local packaged .app' : 'npm start'}: ${fixtureMode ? 'Fixture Helper (no EventKit access)' : 'real EventKit'}, Calendar/Countdown/Settings, single instance and normal quit`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  for (const socket of clients) socket.close();
  for (const child of [secondary, primary]) {
    if (child && child.exitCode === null) {
      // The detached process group includes npm and its Electron child.
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      await sleep(500);
    }
  }
  fs.writeFileSync(path.join(evidence, 'source-start.log'), log);
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
