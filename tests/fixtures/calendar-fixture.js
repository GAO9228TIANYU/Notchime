const { createMockCalendar } = require('./mock-calendar');
function snapshot(now = new Date()) {
  const data = createMockCalendar(now);
  const events = [...data.today, ...data.days.flatMap(day => day.events)].map((event, index) => ({
    id: `fixture-${index}`, eventIdentifier: `fixture-${index}`, occurrenceStart: event.start.toISOString(),
    title: event.title, start: event.start.toISOString(), end: event.end.toISOString(), allDay: false,
    timeZone: 'Asia/Seoul', calendar: { ...event.calendar, id: event.calendar.name },
  }));
  const calendars = [...new Map(events.map(event => [event.calendar.id, { ...event.calendar, source: { id: 'fixture', name: 'TEST FIXTURE' } }])).values()];
  return { authorization: 'authorized', calendars, events, selectedCalendarIds: calendars.map(calendar => calendar.id), timeZone: 'Asia/Seoul' };
}
module.exports = { snapshot };
