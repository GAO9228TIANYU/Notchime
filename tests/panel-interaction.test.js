const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldTogglePanelForSpace } = require('../renderer/panel-interaction');

test('shouldTogglePanelForSpace toggles plain Space but never steals typing input', () => {
  assert.equal(shouldTogglePanelForSpace({ key: ' ', repeat: false, editable: false }), true);
  assert.equal(shouldTogglePanelForSpace({ key: 'Spacebar', repeat: false, editable: false }), true);
  assert.equal(shouldTogglePanelForSpace({ key: ' ', repeat: true, editable: false }), false);
  assert.equal(shouldTogglePanelForSpace({ key: ' ', repeat: false, editable: true }), false);
  assert.equal(shouldTogglePanelForSpace({ key: ' ', repeat: false, editable: false, metaKey: true }), false);
});


const { createMotionWorkQueue } = require('../renderer/panel-interaction');
test('content paints immediately outside native/CSS motion', () => {
  const queue = createMotionWorkQueue(); let calls = 0;
  queue.run('calendar', () => calls++); assert.equal(calls, 1); assert.equal(queue.isActive(), false);
});
test('motion coalesces Calendar and Reminders into their latest paint', () => {
  const queue = createMotionWorkQueue(), calls = [], token = queue.begin();
  queue.run('calendar', () => calls.push('old')); queue.run('calendar', () => calls.push('latest'));
  queue.run('reminders', () => calls.push('reminders')); assert.deepEqual(calls, []);
  queue.end(token); assert.deepEqual(calls, ['latest','reminders']); assert.equal(queue.isActive(), false);
});
test('an obsolete opening callback cannot flush work during newer closing motion', () => {
  const queue = createMotionWorkQueue(), old = queue.begin(); let calls = 0;
  queue.run('calendar', () => calls++); const latest = queue.begin();
  queue.end(old); assert.equal(queue.isActive(), true); assert.equal(calls, 0);
  queue.end(latest); assert.equal(calls, 1);
});
test('ending a motion twice never repeats a repaint', () => {
  const queue = createMotionWorkQueue(), token = queue.begin(); let calls = 0;
  queue.run('calendar', () => calls++); queue.end(token); queue.end(token); assert.equal(calls, 1);
});
