(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CalendarModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function dayKey(value) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  function localDay(now, offset = 0) { const day = new Date(now); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + offset); return day; }
  function overlaps(event, date) {
    const next = localDay(date, 1);
    return event.allDay ? event.startDate <= dayKey(date) && event.endDate > dayKey(date)
      : event.start < next && event.end > date;
  }
  function createView(snapshot, now = new Date()) {
    const todayDate = localDay(now), unique = new Map();
    for (const item of snapshot?.authorization === 'authorized' ? snapshot.events || [] : []) {
      const start = new Date(item.start), end = new Date(item.end);
      if (!item.id || !Number.isFinite(+start) || !Number.isFinite(+end) || end < start || !item.calendar) continue;
      unique.set(item.id, { ...item, start, end, title: item.title?.trim() || '无标题日程',
        calendar: { ...item.calendar, color: /^#[0-9a-f]{6}$/i.test(item.calendar.color) ? item.calendar.color : '#438CFF' } });
    }
    const events = [...unique.values()].sort((a, b) => +a.start - +b.start || +a.end - +b.end || a.id.localeCompare(b.id));
    const onDay = date => events.filter(event => overlaps(event, date)).sort((a, b) => Number(b.allDay) - Number(a.allDay) || +a.start - +b.start || a.id.localeCompare(b.id));
    const next = events.find(event => !event.allDay && event.end > now) || null;
    return { today: onDay(todayDate), next, days: Array.from({ length: 7 }, (_, index) => {
      const date = localDay(now, index + 1); return { date, events: onDay(date) };
    }) };
  }
  return { createView, dayKey, localDay, overlaps };
});
