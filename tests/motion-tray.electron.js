// Isolated real Main/preload/Renderer; all events/tasks come from the Fixture.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const { app, Tray } = require('electron');
const menus = new WeakMap(), setContextMenu = Tray.prototype.setContextMenu;
Tray.prototype.setContextMenu = function(menu) { menus.set(this, menu); return setContextMenu.call(this, menu); };
const profile = process.env.CALENDAR_TEST_USER_DATA, phase = process.env.CALENDAR_TEST_PHASE;
if (!profile) throw new Error('Isolated profile required');
app.commandLine.appendSwitch('user-data-dir', profile); app.commandLine.appendSwitch('use-mock-keychain');
app.setLoginItemSettings = () => { throw new Error('No real login changes'); }; app.getLoginItemSettings = () => ({openAtLogin:false});
require('./fixtures/install-calendar');
const target = require.resolve('../main'), loader = Module._extensions['.js'];
Module._extensions['.js'] = (module, file) => {
  if (file !== target) return loader(module, file);
  module._compile(fs.readFileSync(file, 'utf8') + '\nmodule.exports={window:()=>mainWindow,tray:()=>tray,auto:()=>automaticReveal,lifecycle:()=>lifecycleReveals,hide:hideWindowAfterCollapse};', file);
};
const main = require('../main'); Module._extensions['.js'] = loader;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const timeout = setTimeout(() => app.exit(1), 45000);
(async () => {
  await app.whenReady(); main.lifecycle().close(); main.auto().cancel();
  const window = main.window(), wc = window.webContents;
  const nativeIgnore = window.setIgnoreMouseEvents.bind(window); window.setIgnoreMouseEvents = () => nativeIgnore(true); nativeIgnore(true);
  // Native blur has dedicated regression tests; isolate paint and Tray tests from physical input.
  const blur = window.listeners('blur'); window.removeAllListeners('blur');
  if (wc.isLoadingMainFrame()) await new Promise(r => wc.once('did-finish-load', r));
  const js = code => wc.executeJavaScript(code);
  async function until(code) { const end = Date.now()+6000; while(Date.now()<end) { if(await js(code))return; await sleep(20); } throw new Error('Wait: '+code); }
  await until('Boolean(window.PanelMotion && window.CalendarUI) && CalendarUI.getSnapshot().authorization === "authorized"');
  const settings = path.join(profile,'app-settings.json');
  if (phase === 'restart') {
    assert.equal(main.tray(), null); assert.equal(await js('notchAPI.getAppSettings().then(s=>s.menuBarIconVisible)'),false);
    assert.equal(window.isVisible(), true);
    await js('NotchPanel.setMode(true); NotchPanel.setActiveTab("settings")');
    await until('document.getElementById("settings-menu-bar-icon").checked === false');
    assert.equal(await js('notchAPI.setMenuBarIconVisible(true).then(r=>r.ok)'),true);
    assert.ok(main.tray()); assert.equal(main.tray().isDestroyed(),false);
    console.log('PASS motion/Tray restart: hidden preference persists; visible bar/settings restores real Tray');
  } else {
    assert.ok(main.tray());
    await js('NotchPanel.setMode(false)'); await until('!NotchPanel.getState().busy && !PanelMotion.isActive()');
    // Observe the real Calendar subtree. Snapshot data remains current while DOM work is queued.
    await js(`window.paintRecords=[]; new MutationObserver(r=>paintRecords.push(...r.map(x=>x.type))).observe(document.getElementById('today-events'),{childList:true,subtree:true});`);
    await js('void NotchPanel.setMode(true)'); await until('NotchPanel.getState().expanded && !NotchPanel.getState().busy');
    assert.equal(await js('PanelMotion.isActive()'),true);
    await js(`(() => { const snapshot=CalendarUI.getSnapshot(); window.paintRecords=[]; for(let i=0;i<20;i++){ const next={...snapshot,events:snapshot.events.map(e=>({...e,title:'Queued fixture '+i}))}; CalendarUI.applySnapshot(next); } })()`);
    assert.equal(await js('paintRecords.length'),0, 'No Calendar list reconstruction during opening');
    await until('!PanelMotion.isActive()');
    assert.equal(await js('document.querySelector(".calendar-event-title").textContent'),'Queued fixture 19');
    assert.equal(await js('paintRecords.filter(x=>x==="childList").length'),1,'20 updates become one subtree replacement');
    await js('void NotchPanel.setMode(false)'); await until('PanelMotion.isActive()');
    const before = await js('document.getElementById("today-events").textContent');
    await js(`CalendarUI.applySnapshot({...CalendarUI.getSnapshot(),events:[]})`);
    assert.equal(await js('document.getElementById("today-events").textContent'),before);
    await until('!NotchPanel.getState().busy && !PanelMotion.isActive()');
    assert.equal(await js('document.querySelectorAll("#today-events .calendar-event").length'),0);
    await js('NotchPanel.setMode(true)'); await until('!PanelMotion.isActive()');
    await js('NotchPanel.setActiveTab("settings")');
    await js('document.getElementById("settings-menu-bar-icon").checked=false; document.getElementById("settings-menu-bar-icon").dispatchEvent(new Event("change"))');
    await until('notchAPI.getAppSettings().then(s=>s.menuBarIconVisible===false)');
    assert.equal(main.tray(),null); assert.equal(window.isVisible(),true);
    assert.equal(JSON.parse(fs.readFileSync(settings)).menuBarIconVisible,false);
    main.hide(); await until('!NotchPanel.getState().expanded && !NotchPanel.getState().busy'); assert.equal(window.isVisible(),true,'No invisible app without Tray');
    window.hide(); assert.equal(window.isVisible(),false); app.emit('activate');
    await until('NotchPanel.getState().expanded && !NotchPanel.getState().busy'); assert.equal(window.isVisible(),true,'Reopening a hidden app without Tray recovers the panel');
    assert.equal(await js('NotchPanel.getState().source'),'manual');
    assert.equal(await js('notchAPI.setMenuBarIconVisible("false").then(r=>r.error)'), 'invalid'); assert.equal(main.tray(), null);
    assert.equal(await js('notchAPI.setMenuBarIconVisible(true).then(r=>r.ok)'), true); const restored=main.tray(); assert.ok(restored);
    await js('notchAPI.setMenuBarIconVisible(true)'); assert.equal(main.tray(),restored,'No duplicate Tray');
    menus.get(restored).items.find(item=>item.label==='隐藏菜单栏图标').click();
    assert.equal(main.tray(),null); assert.equal(JSON.parse(fs.readFileSync(settings)).menuBarIconVisible,false);
    console.log('PASS motion/Tray initial: latest-only Calendar paint outside opening/closing; settings/menu hide/restore, persistence, recovery and invalid input');
  }
  for (const handler of blur) window.on('blur',handler);
  clearTimeout(timeout); app.quit();
})().catch(error => { console.error(error); clearTimeout(timeout); app.exit(1); });
