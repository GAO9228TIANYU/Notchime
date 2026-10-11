const test = require('node:test');
const assert = require('node:assert/strict');
const { createMockCalendar, MOCK_EVENTS } = require('./fixtures/mock-calendar');
const { normalizeAutoCollapseSeconds } = require('../calendar-settings');

test('mock calendar separates today from the next seven local dates', () => {
  const now = new Date(2026, 9, 11, 12, 0);
  const data = createMockCalendar(now);
  assert.equal(data.mock, true);
  assert.equal(data.today.length, 3);
  assert.equal(data.days.length, 7);
  assert.equal(data.next.title, '产品设计讨论');
  assert.equal(data.next.start.getHours(), 14);
  assert.equal(data.next.end.getMinutes(), 45);
  for (let i = 0; i < 7; i++) {
    const day = new Date(now); day.setDate(now.getDate() + i + 1);
    assert.equal(data.days[i].date.toDateString(), day.toDateString());
    for (const event of data.days[i].events) {
      assert.equal(event.start.toDateString(), day.toDateString());
      assert.ok(event.end > event.start);
      assert.match(event.calendar.color, /^#[0-9A-F]{6}$/i);
      assert.equal(event.mock, true);
    }
  }
  assert.equal(MOCK_EVENTS.length, data.today.length + data.days.reduce((n, day) => n + day.events.length, 0));
});
test('late-day next event is tomorrow, and month/year boundaries do not drift', () => {
  const now = new Date(2026, 11, 31, 23, 59);
  const data = createMockCalendar(now);
  assert.equal(data.next.start.getFullYear(), 2027);
  assert.equal(data.next.start.getMonth(), 0);
  assert.equal(data.next.start.getDate(), 1);
  assert.equal(data.days[6].date.getDate(), 7);
});
test('mock snapshots are fresh and cannot mutate future data', () => {
  const now = new Date(2026, 9, 11);
  const first = createMockCalendar(now);
  first.today[0].title = 'changed'; first.today[0].start.setFullYear(2000);
  const second = createMockCalendar(now);
  assert.equal(second.today[0].title, '专注工作');
  assert.equal(second.today[0].start.getFullYear(), 2026);
  assert.equal(Object.isFrozen(MOCK_EVENTS), true);
});
test('automatic-collapse preference defaults safely without activating any timer', () => {
  for (const value of [undefined, null, '4', NaN, Infinity, 0, -1, 61, 4.5]) assert.equal(normalizeAutoCollapseSeconds(value), 4);
  for (const value of [1, 4, 60]) assert.equal(normalizeAutoCollapseSeconds(value), value);
});
