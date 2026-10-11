const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { app, BrowserWindow, ipcMain, session, net, dialog, Tray } = require('electron');
let trayTooltip;
const nativeSetToolTip = Tray.prototype.setToolTip;
Tray.prototype.setToolTip = function(value) { trayTooltip=value; return nativeSetToolTip.call(this,value); };
const profile = process.env.CALENDAR_TEST_USER_DATA;
if (!profile) throw new Error('Isolated test profile required');
app.commandLine.appendSwitch('user-data-dir',profile);
app.commandLine.appendSwitch('use-mock-keychain');
const attempts = [];
app.whenReady().then(() => {
  const register = session.defaultSession.webRequest.onBeforeRequest.bind(session.defaultSession.webRequest);
  session.defaultSession.webRequest.onBeforeRequest = (filter, handler) => register(filter, (details, callback) => {
    const url = new URL(details.url);
    const record = { protocol: url.protocol, domain: url.hostname, module: 'guarded Electron session', resourceType: details.resourceType, time: new Date().toISOString() };
    attempts.push(record);
    handler(details, result => { record.outcome = result.cancel ? 'blocked' : 'allowed'; callback(result); });
  });
});
const handlers = new Map(), originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (name, fn) => { handlers.set(name,fn); originalHandle(name,fn); };
const loader = Module._extensions['.js'], mainPath = require.resolve('../main');
Module._extensions['.js'] = (module,file) => {
  if(file !== mainPath)return loader(module,file);
  module._compile(fs.readFileSync(file,'utf8')+'\nmodule.exports={window:()=>mainWindow,tray:()=>tray,calendar:getCalendarProvider,reminders:getRemindersProvider};',file);
};
require('./fixtures/install-calendar');
const main = require('../main');
Module._extensions['.js'] = loader; ipcMain.handle = originalHandle;
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){const end=Date.now()+12000;while(Date.now()<end){if(await fn())return;await sleep(30);}throw new Error('Timeout '+label);}
const deadline = setTimeout(()=>{console.error('Security GUI timeout');app.exit(1);},60000);
(async()=>{
  await app.whenReady(); const window = main.window(), wc = window.webContents;
  if(wc.isLoadingMainFrame())await new Promise(resolve=>wc.once('did-finish-load',resolve));
  // Isolate browser security checks from OS cursor/focus transitions. Core motion
  // and real blur stimuli are verified by the unchanged core test harnesses.
  const js = script => wc.executeJavaScript(script);
  await until(()=>js('Boolean(window.CalendarUI && window.RemindersUI)'), 'page');
  await until(()=>main.calendar().snapshot.authorization==='authorized','Calendar');
  assert.deepEqual(await js('[typeof require,typeof process,typeof notchAPI.invoke,typeof notchAPI.ipcRenderer]'), ['undefined','undefined','undefined','undefined']);
  assert.equal(await js('document.title'), 'Notchime');
  assert.equal(trayTooltip, 'Notchime');
  Tray.prototype.setToolTip = nativeSetToolTip;
  assert.equal(await js('notchAPI.getAppSettings().then(s=>s.appName)'), 'Notchime');
  assert.equal(app.getName(), 'Calendar Notch Dev', 'Display copy must not migrate the development identity');
  let about; const originalAbout = dialog.showMessageBox;
  dialog.showMessageBox = async (_owner, options) => { about=options; return {response:0}; };
  try { await js('notchAPI.showAbout()'); } finally { dialog.showMessageBox=originalAbout; }
  assert.equal(about.message,'Notchime');
  for(const text of ['GAO TIANYU','GAO9228TIANYU','tianyu.gaospk@gmail.com','TO-DO Panel v1.2.0','MIT'])assert.ok(about.detail.includes(text));
  const foreign = new BrowserWindow({show:false,webPreferences:{preload:path.join(__dirname,'fixtures/security-preload.js'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
  const file = path.join(profile,'attack.html');fs.writeFileSync(file,'<!doctype html><title>Isolated probe</title>');
  await foreign.loadFile(file);
  for(const name of handlers.keys()) {
    const result = await foreign.webContents.executeJavaScript(`securityProbe.invoke(${JSON.stringify(name)})`);
    assert.equal(result.ok,false,`Foreign window must be rejected: ${name}`);
  }
  for(const name of ['calendar:create','calendar:edit','calendar:delete','reminders:create','reminders:update','reminders:delete','exec','unknown:channel']) {
    assert.equal(handlers.has(name),false);
    await assert.rejects(foreign.webContents.executeJavaScript(`securityProbe.invoke(${JSON.stringify(name)})`));
  }
  foreign.destroy();
  const event = {sender:wc,senderFrame:wc.mainFrame};
  for(const [name,value] of [['window:set-mode',{}],['window:set-tab',{}],['window:begin-collapse','unexpected'],['settings:get','unexpected'],['window:metrics',{}],['settings:set-auto-collapse-seconds',1000],['settings:set-auto-launch',{}],['reminders:complete',{id:'malicious'}],['calendar:select',['bad\n']]]) {
    assert.equal((await handlers.get(name)(event,value)).ok,false,name);
  }
  const settingsFile = path.join(profile, 'app-settings.json');
  const settingsBefore = fs.existsSync(settingsFile) ? fs.readFileSync(settingsFile) : null;
  const oversizedSettings = JSON.stringify({ preserved: 'x'.repeat(1024 * 1024) });
  fs.writeFileSync(settingsFile, oversizedSettings);
  assert.equal((await handlers.get('settings:set-auto-collapse-seconds')(event, 8)).ok, false);
  assert.equal(fs.readFileSync(settingsFile, 'utf8'), oversizedSettings);
  for (const corrupt of ['{malformed', '[]', 'null', '"not an object"']) {
    fs.writeFileSync(settingsFile, corrupt);
    assert.equal((await handlers.get('settings:set-auto-collapse-seconds')(event, 8)).ok, false);
    assert.equal((await handlers.get('settings:set-reminder-minutes')(event, 5)).ok, false);
    assert.equal(fs.readFileSync(settingsFile, 'utf8'), corrupt, 'Malformed preferences must be preserved');
  }
  if (settingsBefore) fs.writeFileSync(settingsFile, settingsBefore); else fs.unlinkSync(settingsFile);
  const injected = '<img src="https://audit.invalid/x" onerror="globalThis.__securityXSS=1"><script>globalThis.__securityXSS=2</script>';
  const fixture = require('./fixtures/calendar-fixture').snapshot();fixture.events[0].title=injected;
  global.__calendarFixtureBridge.child.stdin.write(JSON.stringify({action:'fixture',data:{events:fixture.events,remindersAuthorization:'authorized',reminders:[{id:'security-task',title:injected,dueDate:require('../renderer/calendar-model').dayKey(new Date())}]}})+'\n');
  await until(()=>main.reminders().snapshot.items.length===1 && main.calendar().snapshot.events.some(item=>item.title===injected),'malicious fixture refresh');
  assert.equal(await js('globalThis.__securityXSS'),undefined);
  assert.equal(await js('document.querySelectorAll("#today-events img, #today-events script, #reminders-list img, #reminders-list script").length'),0);
  assert.equal(await js('document.querySelector(".reminder-title").textContent'),injected);
  assert.equal(await js('document.getElementById("today-events").textContent.includes('+JSON.stringify(injected)+')'),true);
  // Native net.request uses the same audited session but bypasses page CSP, so
  // this separately proves the session policy really cancels a remote request.
  const request = net.request({url:'https://audit.invalid/',session:wc.session});
  request.on('response',()=>{throw new Error('Remote request unexpectedly succeeded');});
  const denied = new Promise(resolve=>request.once('error',error=>resolve(error.message)));
  request.end(); assert.match(await denied,/ERR_BLOCKED_BY_CLIENT/);
  assert.ok(attempts.some(record => record.domain === 'audit.invalid' && record.outcome === 'blocked'));
  assert.equal(attempts.some(record => record.outcome === 'allowed'), false);
  assert.equal(await js('navigator.permissions.query({name:"geolocation"}).then(value=>value.state)'), 'denied');
  let popup = 0; wc.on('did-create-window',()=>popup++);
  await js('window.open("https://audit.invalid/")'); await sleep(100); assert.equal(popup,0);
  const before = wc.getURL(); await js('location.href="https://audit.invalid/"');await sleep(150);assert.equal(wc.getURL(),before);
  assert.equal(await js('document.querySelector(".reminder-title").textContent'),injected);
  // User preferences contain no event/task content. Framework caches are outside
  // this assertion; no claim is made about all Chromium/macOS disk artifacts.
  for(const name of ['app-settings.json','calendar-preferences.json','calendar-reminder-receipts.json','countdowns.json']) {
    const f=path.join(profile,name);if(fs.existsSync(f))assert.equal(fs.readFileSync(f,'utf8').includes(injected),false,name);
  }
  const evidence = path.join(__dirname,'../.cache/phase5a');fs.mkdirSync(evidence,{recursive:true});
  fs.writeFileSync(path.join(evidence,'runtime-security.json'),JSON.stringify({ok:true,electron:process.versions.electron,chromium:process.versions.chrome,node:process.versions.node,fixture:true,realEventKitRead:false,channels:handlers.size,remoteAttempts:attempts,checks:['foreign IPC rejected','unknown/write IPC absent','Calendar and Reminders HTML escaped','Node unavailable','network cancelled','geolocation denied','popup/navigation denied','no task/event content in app-owned JSON']},null,2));
  clearTimeout(deadline);console.log('PASS Electron security regression: isolated Fixture, 24 IPC channels, XSS, session/network, permissions, local storage');app.quit();
})().catch(error=>{console.error(error);clearTimeout(deadline);app.exit(1);});
