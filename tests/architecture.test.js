const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isBuiltin } = require('node:module');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'renderer/index.html'), 'utf8');
const activeFiles = ['main.js', 'main-services.js', 'calendar-settings.js', 'countdown-store.js',
  'countdown-ipc.js', 'calendar-bridge.js', 'calendar-provider.js', 'calendar-ipc.js', 'reminders-provider.js', 'reminders-ipc.js', 'preload.js', 'automatic-reveal.js', 'calendar-reminders.js', ...fs.readdirSync(path.join(root, 'renderer'))
    .filter(name => name.endsWith('.js')).map(name => `renderer/${name}`)];

test('every active import, script, stylesheet and local asset resolves', () => {
  for (const file of activeFiles) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [, dependency] of source.matchAll(/require\(['"]([^'"]+)['"]\)/g)) {
      if (isBuiltin(dependency) || dependency === 'electron') continue;
      assert.ok(dependency.startsWith('.'), `${file} has an unexpected runtime dependency: ${dependency}`);
      assert.ok(require.resolve(path.resolve(root, path.dirname(file), dependency)));
    }
  }
  for (const [, target] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, 'renderer', target)), target);
  }
  for (const name of ['styles.css', 'calendar.css', 'countdown.css']) {
    for (const [, url] of fs.readFileSync(path.join(root, 'renderer', name), 'utf8').matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
      assert.ok(fs.existsSync(path.join(root, 'renderer', url)), `${name}: ${url}`);
    }
  }
});
test('the Main IPC handlers exactly match the active preload invoke channels', () => {
  const sources = ['main.js', 'countdown-ipc.js', 'calendar-ipc.js', 'reminders-ipc.js'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  const handlers = [...sources.matchAll(/(?:ipcMain\.handle\(|^)\s*'([a-z-]+:[a-z-]+)'\s*(?:,|:)/gm)].map(match => match[1]).sort();
  const invokes = [...fs.readFileSync(path.join(root, 'preload.js'), 'utf8')
    .matchAll(/ipcRenderer\.invoke\('([^']+)'/g)].map(match => match[1]).sort();
  assert.equal(handlers.length, 24);
  assert.deepEqual(handlers, invokes);
});
test('retired business code cannot restart a poller, capture session or HTTP service', () => {
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.doesNotMatch(main, /startClipboardPolling|startTodoInboxWatcher|startTaskNotificationServer|rememberPasteTarget|transcriptionSessions|scheduledTodoReminders|desktopCapturer|safeStorage|require\('ws'\)|osascript/);
  for (const file of ['renderer/workspace.js', 'renderer/domain.js', 'renderer/notification.html',
    'renderer/effects.js', 'platform.js', 'scripts/codex-notify.js', 'scripts/claude-notify.js',
    'scripts/verify-windows.ps1', 'website']) assert.equal(fs.existsSync(path.join(root, file)), false, file);
});
test('Main can still request manual/automatic expansion and refresh time with independent guarded scheduling', () => {
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  const renderer = fs.readFileSync(path.join(root, 'renderer/app.js'), 'utf8');
  assert.match(main, /send\('window:request-expand', \{ tab, source \}\)/);
  assert.match(renderer, /request.source === 'automatic'/);
  assert.match(main, /powerMonitor.on\('resume', refreshCountdownClock\)/);
  assert.match(main, /powerMonitor.removeListener\('resume', refreshCountdownClock\)/);
  assert.match(main, /if \(!gotTheLock\) return/);
  assert.match(main, /disposeDisplayWatch\?\.\(\)/);
});
