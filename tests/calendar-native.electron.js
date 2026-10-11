// REAL EventKit validation, explicitly separate from fixture automation. Never edits events.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { app } = require('electron');
const root = path.resolve(__dirname, '..');
const profile = path.join(root, '.cache/phase3/native-profile');
fs.mkdirSync(profile, { recursive: true });
app.commandLine.appendSwitch('user-data-dir', profile);
const target = require.resolve('../main');
const loader = Module._extensions['.js'];
Module._extensions['.js'] = (module, filename) => {
  if (filename !== target) return loader(module, filename);
  module._compile(fs.readFileSync(filename, 'utf8') + '\nmodule.exports = { window: () => mainWindow, provider: getCalendarProvider };', filename);
};
const main = require('../main'); Module._extensions['.js'] = loader;
(async () => {
  await app.whenReady(); const window = main.window();
  if (window.webContents.isLoading()) await new Promise(r => window.webContents.once('did-finish-load', r));
  await window.webContents.executeJavaScript('NotchPanel.setMode(true).then(() => NotchPanel.setActiveTab("settings"))');
  app.focus({ steal: true }); window.show(); window.focus();
  main.provider().on('snapshot', snapshot => {
    const evidence = { mode: app.isPackaged ? 'packaged' : 'source', authorization: snapshot.authorization,
      calendarCount: snapshot.calendars.length, eventCount: snapshot.events.length,
      timeZone: snapshot.timeZone, error: snapshot.error || null, helper: main.provider().bridge.executable,
      timestamp: new Date().toISOString() };
    fs.writeFileSync(path.join(root, '.cache/phase3/native-source-result.json'), JSON.stringify(evidence, null, 2));
    console.log('REAL EVENTKIT:', JSON.stringify(evidence));
  });
  const result = await main.provider().refresh();
  if (result.authorization === 'authorized') {
    await new Promise(resolve => setTimeout(resolve, 300));
    const rendered = await window.webContents.executeJavaScript(`(() => {
      const snapshot = CalendarUI.getSnapshot(), view = CalendarModel.createView(snapshot);
      return { authorization: snapshot.authorization, calendarCount: document.querySelectorAll('#calendar-selection input').length,
        todayCount: document.querySelectorAll('#today-events .calendar-event').length, expectedTodayCount: view.today.length,
        weekCount: document.querySelectorAll('#week-events .calendar-day').length,
        eventCount: snapshot.events.length, hasNode: typeof require !== 'undefined' };
    })()`);
    if (rendered.authorization !== 'authorized' || rendered.calendarCount !== result.calendars.length || rendered.todayCount !== rendered.expectedTodayCount || rendered.weekCount !== 7 || rendered.hasNode) throw new Error('Real EventKit Renderer chain validation failed');
    const file = path.join(root, '.cache/phase3/native-source-result.json');
    const evidence = JSON.parse(fs.readFileSync(file)); evidence.renderer = rendered; evidence.ok = true;
    fs.writeFileSync(file, JSON.stringify(evidence, null, 2));
    console.log('PASS REAL EventKit Electron → Helper → Renderer:', JSON.stringify(rendered));
    app.quit();
  }
})().catch(error => { console.error(error); app.exit(1); });
