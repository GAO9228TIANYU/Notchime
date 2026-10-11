const test = require('node:test');
test('blur cannot orphan an automatic reveal; manual/null sources still collapse outside authorization', () => {
  const { shouldCollapseOnBlur } = require('../main-services');
  assert.equal(shouldCollapseOnBlur({source:'automatic'}),false);
  for(const source of ['manual',null])assert.equal(shouldCollapseOnBlur({source}),true);
  for(const source of ['manual','automatic',null])assert.equal(shouldCollapseOnBlur({source,authorizationActive:true}),false);
});
const assert = require('node:assert/strict');
const { installLocalWebContentsGuards, hoverSpacePollingPolicy, notificationTimerDelay } = require('../main-services');

test('notification timers retain overflow-safe checkpoints for future reminders', () => {
  assert.equal(notificationTimerDelay(30 * 24 * 60 * 60 * 1000), (2 ** 31) - 1);
  assert.equal(notificationTimerDelay(1000), 1000);
  for (const value of [0, -1, NaN, Infinity, undefined]) assert.equal(notificationTimerDelay(value), 250);
});

test('Hover + Space polls only while the collapsed strip is visible', () => {
  assert.deepEqual(hoverSpacePollingPolicy({ shortcut: 'Space', visible: true, mode: 'collapsed' }), {
    enabled: true,
    intervalMs: 60,
  });
  assert.equal(hoverSpacePollingPolicy({ shortcut: 'Space', visible: true, mode: 'expanded' }).enabled, false);
  assert.equal(hoverSpacePollingPolicy({ shortcut: 'Space', visible: false, mode: 'collapsed' }).enabled, false);
  assert.equal(hoverSpacePollingPolicy({ shortcut: 'Command+Shift+P', visible: true, mode: 'collapsed' }).enabled, false);
});

test('local Electron windows deny renderer navigation and child windows', () => {
  let windowOpenHandler = null;
  let navigationHandler = null;
  const webContents = {
    getURL() { return 'file:///app/renderer/index.html'; },
    setWindowOpenHandler(handler) { windowOpenHandler = handler; },
    on(eventName, handler) {
      if (eventName === 'will-navigate') navigationHandler = handler;
    },
  };

  assert.equal(installLocalWebContentsGuards(webContents), true);
  assert.deepEqual(windowOpenHandler({ url: 'https://example.com' }), { action: 'deny' });
  let prevented = false;
  navigationHandler({ preventDefault() { prevented = true; } }, 'https://example.com');
  assert.equal(prevented, true);
  for (const url of ['file:///app/renderer/other.html', 'file:///app/renderer/index.html?other', 'https://example.com']) {
    let denied = false;
    navigationHandler({ preventDefault() { denied = true; } }, url);
    assert.equal(denied, true, `Navigation must remain denied: ${url}`);
  }
  let reloadDenied = false;
  navigationHandler({ preventDefault() { reloadDenied = true; } }, 'file:///app/renderer/index.html');
  assert.equal(reloadDenied, false, 'Recovery may reload only the exact current local page');
});

