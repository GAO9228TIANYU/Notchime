const { PANEL_URL } = require('../main-services');
const test = require('node:test');
const assert = require('node:assert/strict');
const { registerCountdownIPC } = require('../countdown-ipc');
function harness() {
  const handlers = new Map(), calls = [], events = [];
  const frame = {url:PANEL_URL}, contents = { mainFrame: frame, send: (...args) => events.push(args) };
  const owner = { isDestroyed: () => false, webContents: contents };
  const store = Object.fromEntries(['list', 'create', 'update', 'remove', 'pin'].map(name => [name, async (...args) => { calls.push([name, ...args]); return []; }]));
  registerCountdownIPC({ handle: (name, handler) => handlers.set(name, handler) }, { getWindow: () => owner, getStore: () => store });
  return { handlers, calls, events, store, event: { sender: contents, senderFrame: frame } };
}
test('CRUD bridge accepts only the current main frame and never accepts file paths', async () => {
  const h = harness(); assert.equal(h.handlers.size, 5);
  for (const event of [{}, { sender: h.event.sender, senderFrame: {} }, { sender: {}, senderFrame: h.event.senderFrame }]) {
    assert.equal((await h.handlers.get('countdowns:create')(event, {})).error, 'forbidden');
  }
  assert.equal(h.calls.length, 0);
  await h.handlers.get('countdowns:list')(h.event);
  await h.handlers.get('countdowns:create')(h.event, { title: 'x' });
  await h.handlers.get('countdowns:update')(h.event, { id: 'a', input: { title: 'y' } });
  await h.handlers.get('countdowns:pin')(h.event, { id: 'a', pinned: true });
  await h.handlers.get('countdowns:delete')(h.event, 'a');
  assert.deepEqual(h.calls.map(call => call[0]), ['list', 'create', 'update', 'pin', 'remove']);
  assert.equal(h.events.length, 4); assert.equal(h.events[0][0], 'countdowns:changed');
});
test('storage/validation failure is reported to Renderer and never broadcasts success', async () => {
  const h = harness(); h.store.create = async () => { throw Object.assign(new Error('cannot save'), { code: 'write_failed' }); };
  const result = await h.handlers.get('countdowns:create')(h.event, {});
  assert.equal(result.ok, false); assert.equal(result.error, 'write_failed'); assert.equal(result.message, 'cannot save');
  assert.equal(h.events.length, 0);
});
