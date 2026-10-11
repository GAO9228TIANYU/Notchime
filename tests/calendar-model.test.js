const test = require('node:test'); const assert = require('node:assert/strict');
const { createView, dayKey, localDay } = require('../renderer/calendar-model');
const calendar = { id: 'one', name: '工作', color: '#123456' };
function event(id, start, end, fields = {}) { return { id, title: id, start: start.toISOString(), end: end.toISOString(), calendar, ...fields }; }
function view(events, now) { return createView({ authorization: 'authorized', events }, now); }
test('today includes ongoing, ended and overnight events but excludes midnight-exclusive end', () => {
  const now = new Date(2026, 9, 11, 12), yesterday = localDay(now, -1), today = localDay(now), tomorrow = localDay(now, 1);
  const events = [event('overnight', yesterday, new Date(2026, 9, 11, 13)), event('ended', new Date(2026, 9, 11, 8), new Date(2026, 9, 11, 9)), event('boundary', yesterday, today), event('future', new Date(2026, 9, 11, 15), tomorrow)];
  const result = view(events, now); assert.deepEqual(result.today.map(e => e.id), ['overnight', 'ended', 'future']);
  assert.equal(result.next.id, 'overnight');
});
test('all-day and multi-day events use local date keys and exclusive end boundaries', () => {
  const now = new Date(2026, 9, 11), events = [event('all-day', now, localDay(now, 2), { allDay: true, startDate: '2026-10-11', endDate: '2026-10-13' })];
  const result = view(events, now); assert.equal(result.today.length, 1); assert.equal(result.days[0].events.length, 1); assert.equal(result.days[1].events.length, 0); assert.equal(result.next, null);
});
test('recurring instances retain independent identities, dedupe exact instance, stable sorting', () => {
  const now = new Date(2026, 9, 11), eventId = 'repeating';
  const first = event('a', new Date(2026, 9, 11, 9), new Date(2026, 9, 11, 10), { eventIdentifier: eventId });
  const second = event('b', new Date(2026, 9, 12, 9), new Date(2026, 9, 12, 10), { eventIdentifier: eventId });
  const result = view([second, first, first], now); assert.equal(result.today.length, 1); assert.equal(result.days[0].events[0].id, 'b');
  const tie = { ...first, id: 'c' }; assert.deepEqual(view([tie, first], now).today.map(e => e.id), ['a', 'c']);
});
test('missing title, unsafe color and invalid timestamps are normalized safely', () => {
  const now = new Date(2026, 9, 11);
  const result = view([event('empty', now, localDay(now, 1), { title: '  ', calendar: { ...calendar, color: 'url(https://evil)' } }), { id: 'broken', start: 'bad', end: 'bad' }], now);
  assert.equal(result.today.length, 1); assert.equal(result.today[0].title, '无标题日程'); assert.equal(result.today[0].calendar.color, '#438CFF');
});
test('absolute event times adapt to current local time zone and rolling midnight', () => {
  const prior = process.env.TZ; process.env.TZ = 'Asia/Seoul';
  try {
    const events = [event('utc', new Date('2026-10-10T16:00:00Z'), new Date('2026-10-10T17:00:00Z'))];
    assert.equal(view(events, new Date(2026, 9, 11, 12)).today.length, 1);
    assert.equal(view(events, new Date(2026, 9, 12)).today.length, 0);
    assert.equal(dayKey(new Date('2026-10-10T16:00:00Z')), '2026-10-11');
  } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
});
test('non-authorized states cannot render previous events and no fixture provider ships', () => {
  const now = new Date(); for (const authorization of ['denied','restricted','notDetermined','error','writeOnly']) assert.equal(createView({authorization,events:[event('leak',now,localDay(now,1))]},now).today.length,0);
  const fs = require('node:fs'), path = require('node:path');
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../renderer/index.html'),'utf8'), /calendar-data|mock-calendar/);
  assert.equal(fs.existsSync(path.join(__dirname,'../renderer/calendar-data.js')), false);
});
