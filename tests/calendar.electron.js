// Real Electron Main/preload/JSONL transport/Renderer, exclusively a test fixture Helper.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const { app, powerMonitor } = require('electron');
const profile = process.env.CALENDAR_TEST_USER_DATA, phase = process.env.CALENDAR_TEST_PHASE;
if (!profile) throw new Error('An isolated profile is required');
app.commandLine.appendSwitch('user-data-dir', profile); app.commandLine.appendSwitch('use-mock-keychain');
app.setLoginItemSettings = () => { throw new Error('No real login item changes'); };
app.getLoginItemSettings = () => ({ openAtLogin: false });
require('./fixtures/install-calendar');
const target = require.resolve('../main'); const loader = Module._extensions['.js'];
Module._extensions['.js'] = (module, file) => {
  if (file !== target) return loader(module, file);
  module._compile(fs.readFileSync(file, 'utf8') + '\nmodule.exports = { window: () => mainWindow, provider: getCalendarProvider };', file);
};
const errors=[];app.on('web-contents-created',(_event,contents)=>contents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);}));
const main = require('../main'); Module._extensions['.js'] = loader;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const timeout = setTimeout(() => { console.error('Calendar fixture integration timeout', errors); app.exit(1); }, 45000);
(async () => {
  await app.whenReady(); const window=main.window(); if(window.webContents.isLoading())await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));
  const js=code=>window.webContents.executeJavaScript(code);
  async function wait(code) { const end=Date.now()+6000;while(Date.now()<end){if(await js(code))return;await sleep(30);}throw new Error('Calendar wait: '+code); }
  const fixture=data=>global.__calendarFixtureBridge.child.stdin.write(JSON.stringify({action:'fixture',data})+'\n');
  await wait(`CalendarUI.getSnapshot().authorization === 'authorized'`);
  await js('NotchPanel.setMode(true)'); await js('NotchPanel.setActiveTab("settings")');
  app.focus({steal:true}); window.focus();
  assert.equal(await js('typeof require'), 'undefined');
  assert.equal(await js('notchAPI.spawn || notchAPI.exec || notchAPI.readFile || notchAPI.calendarHelperPath'), undefined);
  assert.equal(await js('document.querySelectorAll("#calendar-selection input").length'),3);
  if(phase==='restart'){
    assert.deepEqual(await js('CalendarUI.getSnapshot().selectedCalendarIds'), ['工作']);
    assert.equal(await js('notchAPI.listCountdowns().then(result=>result.items.length)'),1);
  } else {
    const invalid=await js('notchAPI.selectCalendars({executable:"/bin/sh"})');assert.equal(invalid.error,'invalid');
    fixture({authorization:'notDetermined'});await wait('!document.getElementById("calendar-authorize").hidden');
    fixture({denyRequest:true});await sleep(500);await js('document.getElementById("calendar-authorize").click()');
    await wait('CalendarUI.getSnapshot().authorization === "denied"');
    assert.equal(await js('document.getElementById("calendar-authorize").hidden'),true);
    assert.equal(await js('document.getElementById("calendar-system-settings").hidden'),false);
    assert.equal(await js('document.querySelectorAll("#today-events .calendar-event").length'),0);
    fixture({authorization:'notDetermined',denyRequest:false});await wait('!document.getElementById("calendar-authorize").hidden');
    await js('document.getElementById("calendar-authorize").click()');await wait('CalendarUI.getSnapshot().authorization === "authorized"');
    assert.equal(await js('document.querySelectorAll("#today-events .calendar-event").length'),3);
    // Real checkbox interaction drives restricted IPC and atomic preference persistence.
    await js('document.querySelector("#calendar-selection input[value=工作]").click()');
    await wait('CalendarUI.getSnapshot().selectedCalendarIds.length === 2');
    assert.equal(await js('CalendarUI.getSnapshot().events.some(event=>event.calendar.id === "工作")'),false);
    const accepted=await js('notchAPI.selectCalendars(["工作"])');assert.equal(accepted.ok,true);
    await wait('CalendarUI.getSnapshot().selectedCalendarIds.length === 1');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(profile,'calendar-preferences.json'))).selectedCalendarIds,['工作']);
    fixture({events:[]});await wait('CalendarUI.getSnapshot().events.length === 0');
    assert.equal(await js('document.getElementById("today-events").textContent'),'今天暂无日程');
    fixture({authorization:'denied'});await wait('CalendarUI.getSnapshot().authorization === "denied"');
    assert.equal(await js('document.querySelectorAll("#calendar-selection input").length'),0);
    fixture({authorization:'authorized',events:require('./fixtures/calendar-fixture').snapshot().events});
    await wait('CalendarUI.getSnapshot().events.length > 0');
    // Crash actual fixture child, verify Main recovers and repaints without restarting Electron.
    const child=global.__calendarFixtureBridge.child;child.kill('SIGKILL');await sleep(50);
    await main.provider().refresh(); await wait('CalendarUI.getSnapshot().authorization === "authorized"');
    assert.notEqual(global.__calendarFixtureBridge.child,child);
    powerMonitor.emit('resume');await sleep(600);assert.equal(await js('CalendarUI.getSnapshot().authorization'),'authorized');
    const saved=await js('notchAPI.createCountdown({title:"Fixture milestone",targetDate:"2027-08-31",targetTime:null,color:"#438CFF",pinned:false})');
    assert.equal(saved.ok,true);
  }
  assert.equal(await js('document.querySelectorAll("#week-events .calendar-day").length'),7);
  // Browser-only time-zone emulation does not change macOS/user calendars.
  const originalZone = await js('Intl.DateTimeFormat().resolvedOptions().timeZone');
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Emulation.setTimezoneOverride', { timezoneId: 'UTC' });
  await js('CalendarUI.applySnapshot(CalendarUI.getSnapshot())');
  const clock = await js(`(() => {
    const next = CalendarModel.createView(CalendarUI.getSnapshot()).next;
    return { expected: new Intl.DateTimeFormat('zh-CN', {hour:'2-digit',minute:'2-digit',hour12:false}).format(next.start),
      displayed: document.querySelector('#next-event .calendar-event-time').textContent };
  })()`);
  assert.ok(clock.displayed.includes(clock.expected), 'Renderer refresh must not retain the previous zone formatter');
  await window.webContents.debugger.sendCommand('Emulation.setTimezoneOverride', { timezoneId: originalZone });
  window.webContents.debugger.detach();
  assert.deepEqual(errors,[]);
  clearTimeout(timeout);app.quit();
  console.log('PASS calendar '+phase+': FIXTURE Helper transport, permissions/revocation, calendar selection, deletion refresh, crash recovery, Countdown isolation');
})().catch(error=>{console.error(error);clearTimeout(timeout);app.exit(1);});
