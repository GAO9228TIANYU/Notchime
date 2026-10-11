const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { CalendarProvider, queryRange, validateSelection } = require('../calendar-provider');
const { snapshot } = require('./fixtures/calendar-fixture');
class Bridge extends EventEmitter {
  constructor() { super(); this.data = snapshot(new Date(2026, 9, 11)); this.calls = []; this.error = null; }
  async request(action, input) {
    this.calls.push({ action, input });
    if (this.error) throw this.error;
    if (action === 'status' || action === 'requestAccess') return { authorization: this.data.authorization };
    return { ...this.data, events: this.data.events.filter(event => input.calendarIds.includes(event.calendar.id)) };
  }
  close() { this.closed = true; }
}
function setup(t, initial) {
  const base = path.join(__dirname, '../.cache/tests'); fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'calendar-provider-'));
  if (initial !== undefined) fs.writeFileSync(path.join(directory, 'calendar-preferences.json'), initial);
  const bridge = new Bridge(); const provider = new CalendarProvider({ app: { getPath: () => directory }, bridge,
    now: () => new Date(2026, 9, 11, 12), debounceMs: 5 });
  t.after(() => { provider.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { directory, bridge, provider };
}
test('default selection reads bounded system calendar snapshot, never a fallback', async t => {
  const { provider, bridge } = setup(t);
  const result = await provider.refresh(); assert.equal(result.events.length, 10);
  assert.equal(result.calendars.length, 3); assert.equal(bridge.calls.length, 3);
  assert.deepEqual(bridge.calls[1].input.calendarIds, []);
  assert.deepEqual(bridge.calls[2].input.calendarIds, result.selectedCalendarIds);
  assert.equal(result.mock, undefined);
});
test('selection atomically persists, restores after restart, and empty means zero events', async t => {
  const { provider, directory, bridge } = setup(t); await provider.refresh();
  await provider.select(['工作']);
  const stored = JSON.parse(fs.readFileSync(path.join(directory, 'calendar-preferences.json')));
  assert.deepEqual(stored, { schemaVersion: 1, selectedCalendarIds: ['工作'] });
  const restored = new CalendarProvider({ app: { getPath: () => directory }, bridge });
  t.after(() => restored.close()); assert.deepEqual((await restored.refresh()).selectedCalendarIds, ['工作']);
  await provider.select([]); assert.deepEqual(provider.snapshot.events, []);
  assert.deepEqual(fs.readdirSync(directory), ['calendar-preferences.json']);
});
test('simultaneous selections serialize without stale saved data', async t => {
  const { provider, directory } = setup(t); await provider.refresh();
  await Promise.all([provider.select(['工作']), provider.select(['学习']), provider.select([])]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'calendar-preferences.json'))).selectedCalendarIds, []);
  await provider.refresh(); assert.deepEqual(provider.snapshot.events, []);
});
test('deleted calendars and account removal do not re-enable unrelated calendars', async t => {
  const { provider, bridge } = setup(t); await provider.refresh(); await provider.select(['工作']);
  bridge.data.calendars = bridge.data.calendars.filter(calendar => calendar.id !== '工作');
  assert.deepEqual((await provider.refresh()).events, []);
  assert.deepEqual(provider.snapshot.selectedCalendarIds, []);
});
test('authorization transitions clear stale data on denial, restriction, write-only and revocation', async t => {
  const { provider, bridge } = setup(t);
  for (const authorization of ['notDetermined', 'authorized', 'denied', 'authorized', 'restricted', 'writeOnly']) {
    bridge.data.authorization = authorization; const value = await provider.refresh();
    assert.equal(value.authorization, authorization);
    if (authorization !== 'authorized') { assert.deepEqual(value.events, []); assert.deepEqual(value.calendars, []); }
  }
  bridge.data.authorization = 'authorized'; assert.equal((await provider.requestAccess()).authorization, 'authorized');
});
test('corrupted preference data is retained and cannot be overwritten', async t => {
  const { provider, directory } = setup(t, '{ broken'); await provider.refresh();
  assert.match(provider.snapshot.error, /损坏/); assert.deepEqual(provider.snapshot.events, []); await assert.rejects(provider.select([]), { code: 'preferences_corrupt' });
  assert.equal(fs.readFileSync(path.join(directory, 'calendar-preferences.json'), 'utf8'), '{ broken');
});
test('calendar identifiers reject duplicate, arbitrary object, oversize and unavailable values', async t => {
  for (const input of ['a', null, {}, [''], ['a', 'a'], [3], ['x'.repeat(513)], Array(1001).fill('a')]) assert.throws(() => validateSelection(input), { code: 'invalid' });
  const { provider } = setup(t); await provider.refresh(); await assert.rejects(provider.select(['unavailable']), { code: 'invalid' });
});
test('event deletion is re-queried, bursts debounce, and in-flight refresh coalesces', async t => {
  const { provider, bridge } = setup(t); await provider.refresh(); bridge.calls.length = 0;
  bridge.data.events = []; for (let i = 0; i < 20; i++) bridge.emit('changed');
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.deepEqual(provider.snapshot.events, []); assert.equal(bridge.calls.length, 3);
  bridge.calls.length = 0; await Promise.all([provider.refresh(), provider.refresh(), provider.refresh()]);
  assert.equal(bridge.calls.length, 3);
});
test('helper errors expose recoverable state and never silently show mock events', async t => {
  const { provider, bridge } = setup(t); await provider.refresh();
  bridge.error = Object.assign(new Error('timed out'), { code: 'helper_timeout' });
  const failed = await provider.refresh(); assert.equal(failed.authorization, 'error'); assert.deepEqual(failed.events, []);
  assert.equal(failed.errorCode, 'helper_timeout'); bridge.error = null; assert.equal((await provider.refresh()).events.length, 10);
});
test('midnight and resume refresh use new local query dates with only one midnight timer', async t => {
  const { provider, bridge } = setup(t); let now = new Date(2026, 11, 31, 23, 59);
  provider.now = () => now; await provider.refresh(); const before = provider.midnightTimer;
  now = new Date(2027, 0, 1, 8); provider.scheduleRefresh(); await new Promise(r => setTimeout(r, 25));
  assert.notEqual(provider.midnightTimer, before); assert.equal(before._destroyed, true);
  assert.equal(new Date(bridge.calls.at(-1).input.start).getDate(), 1);
  provider.close(); assert.equal(provider.midnightTimer._destroyed, true); assert.equal(bridge.closed, true);
});
test('local range covers eight calendar dates across DST, month, year and leap boundaries', () => {
  const previous = process.env.TZ; process.env.TZ = 'America/New_York';
  try {
    for (const now of [new Date(2026, 2, 7, 12), new Date(2026, 9, 31), new Date(2028, 1, 28), new Date(2026, 11, 31)]) {
      const range = queryRange(now), start = new Date(range.start), end = new Date(range.end);
      const expected = new Date(start); expected.setDate(expected.getDate() + 8);
      assert.equal(end.getTime(), expected.getTime()); assert.equal(start.getHours(), 0); assert.equal(end.getHours(), 0);
    }
    const range = queryRange(new Date(2026, 2, 7)); assert.equal((new Date(range.end) - new Date(range.start)) / 3600000, 191);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('change arriving during a query gets a follow-up refresh rather than being lost', async t => {
  const { provider, bridge } = setup(t); await provider.refresh();
  const original = bridge.request.bind(bridge); let release, first = true;
  bridge.request = async (...args) => {
    if (first) { first = false; await new Promise(resolve => { release = resolve; }); }
    return original(...args);
  };
  const initial = provider.refresh(); await new Promise(resolve => setImmediate(resolve));
  bridge.emit('changed'); provider.scheduleRefresh(); release(); await initial;
  const count = bridge.calls.length; await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(bridge.calls.length, count + 3);
});
test('automatic crash recovery is bounded and disposed on quit', async t => {
  const { provider, bridge } = setup(t); provider.retries = 3;
  bridge.emit('unavailable', new Error('crashed')); assert.equal(provider.retryTimer, null);
  provider.retries = 0; bridge.emit('unavailable', new Error('crashed'));
  assert.ok(provider.retryTimer); provider.close(); assert.equal(provider.retryTimer._destroyed, true);
});
test('calendar changes, selection and Helper failure invalidate reminders immediately', async t => {
  const { provider, bridge } = setup(t); await provider.refresh();
  let invalidations = 0; provider.on('invalidate', () => invalidations++);
  bridge.emit('changed'); assert.equal(invalidations, 1);
  await provider.select([]); assert.equal(invalidations, 2);
  bridge.emit('unavailable'); assert.equal(invalidations, 3);
  assert.equal(provider.snapshot.authorization, 'error'); assert.deepEqual(provider.snapshot.events, []);
});
