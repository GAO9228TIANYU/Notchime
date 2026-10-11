/* Phase 1 TEST DATA ONLY. Replace this provider in Phase 3; never persist these
 * events to todo storage, workspace snapshots or a second calendar database. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CalendarMock = api;
})(typeof window === 'object' ? window : globalThis, function () {
  const calendars = Object.freeze({
    work: Object.freeze({ name: '工作', color: '#438CFF' }),
    personal: Object.freeze({ name: '个人', color: '#30D978' }),
    study: Object.freeze({ name: '学习', color: '#FF9352' }),
  });
  const MOCK_EVENTS = Object.freeze([
    { id: 'demo-focus', day: 0, start: '09:30', end: '11:00', title: '专注工作', calendar: 'work' },
    { id: 'demo-review', day: 0, start: '14:00', end: '14:45', title: '产品设计讨论', calendar: 'work' },
    { id: 'demo-read', day: 0, start: '19:00', end: '20:00', title: '阅读与学习', calendar: 'study' },
    { id: 'demo-plan', day: 1, start: '10:00', end: '10:30', title: '每周计划', calendar: 'work' },
    { id: 'demo-walk', day: 2, start: '17:30', end: '18:15', title: '傍晚散步', calendar: 'personal' },
    { id: 'demo-share', day: 3, start: '15:00', end: '16:00', title: '项目进展分享', calendar: 'work' },
    { id: 'demo-course', day: 4, start: '19:00', end: '20:30', title: '课程学习', calendar: 'study' },
    { id: 'demo-coffee', day: 5, start: '11:00', end: '12:00', title: '与朋友喝咖啡', calendar: 'personal' },
    { id: 'demo-weekend', day: 6, start: '09:00', end: '10:00', title: '周末运动', calendar: 'personal' },
    { id: 'demo-reflect', day: 7, start: '16:00', end: '16:30', title: '一周回顾', calendar: 'work' },
  ].map(Object.freeze));
  function localDay(now, offset = 0) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + offset); // Calendar days, not 24-hour DST arithmetic.
    return day;
  }
  function atTime(day, clock) {
    const result = new Date(day);
    const [hour, minute] = clock.split(':').map(Number);
    result.setHours(hour, minute, 0, 0);
    return result;
  }
  function createMockCalendar(now = new Date()) {
    const events = MOCK_EVENTS.map((row) => {
      const day = localDay(now, row.day);
      return { id: row.id, title: row.title, start: atTime(day, row.start), end: atTime(day, row.end), calendar: calendars[row.calendar], mock: true };
    }).sort((a, b) => a.start - b.start);
    const today = localDay(now);
    const tomorrow = localDay(now, 1);
    return { mock: true, date: today,
      today: events.filter((event) => event.start >= today && event.start < tomorrow),
      next: events.find((event) => event.start >= now) || null,
      days: Array.from({ length: 7 }, (_, i) => {
        const date = localDay(now, i + 1), end = localDay(now, i + 2);
        return { date, events: events.filter((event) => event.start >= date && event.start < end) };
      }),
    };
  }
  return Object.freeze({ createMockCalendar, MOCK_EVENTS });
});
