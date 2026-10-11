const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { isPanelSender, PANEL_URL, installLocalSessionGuards, installLocalWebContentsGuards } = require('../main-services');
const { CalendarBridge, MAX_LINE, MAX_PENDING } = require('../calendar-bridge');
const { validateCalendarSnapshot } = require('../calendar-provider');
const { snapshot } = require('./fixtures/calendar-fixture');
const root = path.resolve(__dirname, '..');
test('IPC requires the exact owner, current main frame and trusted local document URL', () => {
  const contents = { mainFrame: { url: PANEL_URL } }, owner = { webContents: contents, isDestroyed: () => false };
  const event = { sender: contents, senderFrame: contents.mainFrame };
  assert.equal(isPanelSender(event, owner), true);
  for (const url of ['https://example.invalid', PANEL_URL + '?untrusted', 'file:///tmp/other.html', '']) {
    contents.mainFrame.url = url; assert.equal(isPanelSender(event, owner), false);
  }
  contents.mainFrame.url = PANEL_URL;
  assert.equal(isPanelSender({ ...event, senderFrame: { url: PANEL_URL } }, owner), false);
  assert.equal(isPanelSender(event, { ...owner, isDestroyed: () => true }), false);
});
test('session denies network protocols and Chromium permissions while retaining local resources', () => {
  let filter, network, permission, check;
  installLocalSessionGuards({ setPermissionCheckHandler: handler => check = handler,
    setPermissionRequestHandler: handler => permission = handler,
    webRequest: { onBeforeRequest: (value, handler) => { filter = value; network = handler; } } });
  assert.deepEqual(filter.urls, ['http://*/*','https://*/*','ws://*/*','wss://*/*','ftp://*/*']);
  assert.equal(check(null, 'media'), false);
  for (const type of ['media','notifications','geolocation','clipboard-read']) permission(null, type, value => assert.equal(value, false));
  network({ url: 'https://example.invalid' }, value => assert.deepEqual(value, { cancel: true }));
});
test('frame navigation, redirects and webview attachment cannot bypass navigation restrictions', () => {
  const handlers = new Map();
  installLocalWebContentsGuards({ getURL: () => PANEL_URL, on: (name, fn) => handlers.set(name, fn), setWindowOpenHandler() {} });
  for (const [name, extra] of [['will-redirect', {}], ['will-frame-navigate', {url: 'https://example.invalid',isMainFrame:true}], ['will-frame-navigate', {url:PANEL_URL,isMainFrame:false}], ['will-attach-webview', {}]]) {
    let denied = false; handlers.get(name)({ ...extra, preventDefault: () => denied = true }); assert.equal(denied, true);
  }
});
test('Calendar response projection strips private/unknown fields and clears unauthorized data', () => {
  const data = snapshot(); data.secret = 'PRIVATE FIXTURE'; data.events[0].notes = 'PRIVATE FIXTURE'; data.calendars[0].source.password = 'PRIVATE FIXTURE';
  assert.equal(JSON.stringify(validateCalendarSnapshot(data)).includes('PRIVATE FIXTURE'), false);
  assert.deepEqual(validateCalendarSnapshot({...data, authorization:'denied'}), { authorization:'denied',calendars:[],events:[] });
});
test('Calendar malformed fields, oversize data and duplicate identities fail closed', () => {
  for (const mutate of [d => d.authorization = 'bogus', d => d.events[0].title = {}, d => d.events[0].title = 'a'.repeat(10001), d => d.events[0].start = '2026-02-30T10:00:00Z', d => d.events[0].calendar.color = 'url(https://example.invalid)', d => d.events.push(d.events[0]), d => d.calendars = Array(1001).fill(d.calendars[0]), d => d.events = Array(20001).fill(d.events[0])]) {
    const data = snapshot(); mutate(data); assert.throws(() => validateCalendarSnapshot(data), {code:'protocol_error'});
  }
});
function bridge(t) {
  const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => {};
  const value = new CalendarBridge('/fixed/helper', { spawnProcess: () => child }); t.after(() => value.close()); return { value, child };
}
test('Helper requests reject huge/circular payloads and unsafe timer ranges without starting a process', async t => {
  const { value } = bridge(t); const circular = {}; circular.self = circular;
  for (const input of [{ value:'a'.repeat(1024*1024) }, circular]) await assert.rejects(value.request('snapshot', input), {code:'invalid'});
  for (const timeout of [0,NaN,Infinity,120001,2**31]) await assert.rejects(value.request('status',{},timeout), {code:'invalid'});
  assert.equal(value.child,null);
});
test('pending requests are bounded, synchronous pipe failures settle and private errors are redacted', async t => {
  const { value, child } = bridge(t), promises = [];
  for (let i=0;i<MAX_PENDING;i++) promises.push(value.request('status').catch(error=>error.code));
  await assert.rejects(value.request('status'), {code:'busy'}); value.close(); await Promise.all(promises);
  const next = bridge(t); next.child.stdin.write = () => {throw new Error('PRIVATE FIXTURE');};
  await assert.rejects(next.value.request('status'), {code:'helper_pipe'}); assert.equal(next.value.pending.size,0);
});
test('oversize native response fails safely and native diagnostic/private error text never escapes', async t => {
  const { value, child } = bridge(t); let diagnostic; value.on('diagnostic', text => diagnostic = text);
  const p = value.request('status'); const request = JSON.parse(child.stdin.read().toString());
  child.stderr.write('PRIVATE FIXTURE TITLE'); assert.ok(!diagnostic.includes('PRIVATE'));
  child.stdout.write(JSON.stringify({requestId:request.requestId,ok:false,error:'denied',message:'PRIVATE FIXTURE TITLE'})+'\n');
  await assert.rejects(p, error => error.code === 'denied' && !error.message.includes('PRIVATE'));
  const oversized = value.request('status'); child.stdout.write('x'.repeat(MAX_LINE+1));
  await assert.rejects(oversized,{code:'protocol_error'});
});
test('production whitelist excludes test harnesses and cannot expose Calendar writes or arbitrary IPC', () => {
  const preload = fs.readFileSync(path.join(root,'preload.js'),'utf8'), config = require('../package.json');
  assert.doesNotMatch(preload,/exposeInMainWorld\([^\n]*ipcRenderer|(?:invoke|send):|require\(['"](?:fs|child_process)/);
  const channels = [...preload.matchAll(/ipcRenderer.invoke\('([^']+)'/g)].map(m=>m[1]);
  assert.equal(channels.filter(c=>c.startsWith('calendar:')).length,4);
  assert.deepEqual(channels.filter(c=>c.startsWith('reminders:')).sort(), ['reminders:complete','reminders:open-settings','reminders:refresh','reminders:request-access']);
  assert.equal(config.build.files.some(file=>file.startsWith('tests/') || file.startsWith('.cache/')), false);
  const privacy = JSON.stringify(config.build.mac.extendInfo)+fs.readFileSync(path.join(root,'native/calendar-helper/Info.plist'),'utf8');
  assert.doesNotMatch(privacy,/NSCamera|NSMicrophone|NSAppleEvents|NSContacts|NSScreenCapture/);
});
test('build entrypoints disable optional update checks and skipped notifier makes no network request', async () => {
  const config = require('../package.json');
  for (const name of ['build','build:zip','pack']) assert.ok(config.scripts[name].startsWith('NO_UPDATE_NOTIFIER=1 '));
  const previous = process.env.NO_UPDATE_NOTIFIER; process.env.NO_UPDATE_NOTIFIER = '1';
  const https = require('node:https'), original = https.get;
  https.get = () => { throw new Error('No notifier networking allowed'); };
  try { await require('electron-builder/out/cli/cli-util').checkIsOutdated(); }
  finally { https.get = original; if (previous === undefined) delete process.env.NO_UPDATE_NOTIFIER; else process.env.NO_UPDATE_NOTIFIER = previous; }
});
test('UTF-8 calendar preferences cannot exceed their own read limit or overwrite old preferences', async t => {
  const { CalendarProvider } = require('../calendar-provider');
  const base = path.join(root,'.cache/tests'); fs.mkdirSync(base,{recursive:true});
  const directory = fs.mkdtempSync(path.join(base,'security-preferences-'));
  const old = JSON.stringify({schemaVersion:1,selectedCalendarIds:[]});
  fs.writeFileSync(path.join(directory,'calendar-preferences.json'),old);
  const bridge = new EventEmitter(); bridge.close = () => {};
  const provider = new CalendarProvider({app:{getPath:()=>directory},bridge});
  t.after(()=>{provider.close();fs.rmSync(directory,{recursive:true,force:true});});
  const ids = Array.from({length:1000},(_,i)=>'测'.repeat(500)+i);
  provider.snapshot.calendars = ids.map(id=>({id}));
  await assert.rejects(provider.select(ids),{code:'invalid'});
  assert.equal(fs.readFileSync(provider.file,'utf8'),old);
  assert.deepEqual(fs.readdirSync(directory),['calendar-preferences.json']);
});
