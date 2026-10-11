// Renderer geometry, focus and motion regression coverage, without system services.
const assert = require('node:assert/strict');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const profile = process.env.CALENDAR_TEST_USER_DATA;
if (!profile) throw new Error('Run via npm test for a project-contained profile');
app.setPath('userData', profile);
app.setPath('sessionData', profile);
app.setPath('crashDumps', profile);
app.setAppLogsPath(path.join(profile, 'logs'));
let timeout = setTimeout(() => { console.error('Renderer test timed out'); app.exit(1); }, 30000);
(async () => {
  await app.whenReady();
  const window = new BrowserWindow({ width: 1240, height: 616, show: false, frame: false,
    transparent: true, backgroundColor: '#00000000', webPreferences: { backgroundThrottling: false } });
  const errors = [];
  window.webContents.on('console-message', (details) => { if (details.level === 'error') errors.push(details.message); });
  await window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  await window.webContents.executeJavaScript('CalendarUI.applySnapshot(' + JSON.stringify(require('./fixtures/calendar-fixture').snapshot()) + ')');
  window.show(); window.focus(); window.webContents.focus();
  // Native focus arrives asynchronously on macOS. Establish it before sending
  // keyboard input, rather than measuring the previous app's input modality.
  if (process.platform === 'darwin') app.focus({ steal: true });
  const focusDeadline = Date.now() + 2000;
  while (!(await window.webContents.executeJavaScript('document.hasFocus()')) && Date.now() < focusDeadline) {
    window.focus(); await new Promise(resolve => setTimeout(resolve, 40));
  }
  assert.equal(await window.webContents.executeJavaScript('document.hasFocus()'), true,
    'native focus must arrive before sending a keyboard navigation event');
  // Isolate browser keyboard modality from unrelated desktop focus switches;
  // production native focus/blur is independently exercised by startup tests.
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', { enabled: true });
  // Establish an explicit start in the tab order. A blurred body can keep the
  // previous app's focus-navigation anchor/input modality on macOS.
  await window.webContents.executeJavaScript(`(() => {
    const start = document.createElement('input'); start.id = 'keyboard-test-start';
    start.style.position = 'absolute'; start.style.left = '-1000px';
    document.body.prepend(start); start.focus();
  })()`);
  await new Promise(resolve => setTimeout(resolve, 100));
  window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' });
  window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab' });
  const focus = await window.webContents.executeJavaScript(`(async () => {
    await new Promise(r => setTimeout(r, 100));
    const notch = document.getElementById('notch');
    return { active: document.activeElement === notch, visible: notch.matches(':focus-visible'),
      outline: getComputedStyle(notch).outlineStyle, dot: getComputedStyle(notch.querySelector('.notch-dot')).boxShadow };
  })()`);
  assert.equal(focus.active, true, JSON.stringify(focus)); assert.equal(focus.visible, true, JSON.stringify(focus));
  assert.equal(focus.outline, 'none'); assert.notEqual(focus.dot, 'none');
  await window.webContents.executeJavaScript('document.getElementById("keyboard-test-start").remove()');
  const interaction = await window.webContents.executeJavaScript(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const wait = async name => {
      const deadline = performance.now() + 5000;
      while (performance.now() < deadline) {
        if (document.getElementById('app').classList.contains(name) && !window.NotchPanel.getState().busy) return;
        await sleep(10);
      }
      throw new Error('Timeout waiting for ' + name);
    };
    const panel = document.querySelector('.panel');
    const result = { contentClip: getComputedStyle(panel).clipPath, shellClip: getComputedStyle(panel, '::before').clipPath };
    document.getElementById('notch').click(); await wait('expanded'); await sleep(450);
    await Promise.all([NotchPanel.setActiveTab('settings'), NotchPanel.setActiveTab('calendar')]);
    if (!document.getElementById('tab-calendar').classList.contains('active')) throw new Error('queued tab promise resolved before DOM settled');
    document.getElementById('tab-button-settings').click(); await sleep(100);
    result.settings = document.getElementById('tab-settings').classList.contains('active');
    result.columns = getComputedStyle(document.querySelector('.calendar-settings-grid')).gridTemplateColumns.split(' ').length;
    const top = document.querySelector('.topbar').getBoundingClientRect();
    const target = document.elementFromPoint(top.left + top.width / 2, top.top + top.height / 2);
    result.blankHitsTabs = !!target?.closest('.tabs');
    target?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait('collapsed');
    document.getElementById('notch').click(); await wait('expanded');
    result.defaultCalendar = window.NotchPanel.getState().tab === 'calendar';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
    await wait('collapsed');
    // Race with last requested state collapsed; both directions must settle.
    window.NotchPanel.setMode(true); window.NotchPanel.setMode(false);
    window.NotchPanel.setMode(true); window.NotchPanel.setMode(false);
    await wait('collapsed'); result.raceSettled = !window.NotchPanel.getState().expanded;
    result.storage = { todo: localStorage.getItem('notch-todo-data'), clip: localStorage.getItem('notch-clip-history') };
    return result;
  })()`);
  assert.equal(interaction.contentClip, 'none'); assert.notEqual(interaction.shellClip, 'none');
  assert.equal(interaction.settings, true); assert.equal(interaction.columns, 2);
  assert.equal(interaction.blankHitsTabs, false); assert.equal(interaction.defaultCalendar, true);
  assert.equal(interaction.raceSettled, true); assert.deepEqual(interaction.storage, { todo: null, clip: null });
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const reduced = await window.webContents.executeJavaScript(`(async () => {
    await window.NotchPanel.setMode(true); await window.NotchPanel.setMode(false);
    return { busy: window.NotchPanel.getState().busy, collapsed: document.getElementById('app').classList.contains('collapsed'),
      duration: getComputedStyle(document.querySelector('.panel'), '::before').transitionDuration };
  })()`);
  assert.equal(reduced.busy, false); assert.equal(reduced.collapsed, true);
  assert.ok(reduced.duration.split(',').every(v => parseFloat(v) <= .001));
  assert.deepEqual(errors, []);
  console.log('PASS renderer: focus, shell clip, two tabs, blank/Space collapse, rapid mode race, default Calendar, reduced motion, no todo/clipboard writes');
  clearTimeout(timeout); window.destroy(); app.quit();
})().catch(error => { console.error(error); clearTimeout(timeout); app.exit(1); });
