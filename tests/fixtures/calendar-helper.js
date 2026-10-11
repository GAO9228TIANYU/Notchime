// Test-only JSONL process. It does not import EventKit or access user calendars.
const readline = require('node:readline');
const { snapshot } = require('./calendar-fixture');
let overrides = {}; let completed = new Set();
const revision = 'a'.repeat(64);
function reminderItems() {
  const today = new Date(); today.setHours(0,0,0,0);
  const date = day => { const value = new Date(today); value.setDate(value.getDate()+day); return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`; };
  return (overrides.reminders || [
    {id:'today-a',title:'同名测试待办',dueDate:date(0)},
    {id:'today-b',title:'同名测试待办',dueDate:date(0)},
    {id:'overdue',title:'逾期测试',dueDate:date(-1)},
    {id:'recurring',title:'重复测试',dueDate:date(0),canComplete:false,completionBlockedReason:'重复提醒事项请在 Apple Reminders 中完成，以保护重复系列。'},
    {id:'tomorrow',title:'明天测试',dueDate:date(1)}
  ]).filter(item => !completed.has(item.id)).map(item => ({listName:'测试清单',listColor:'#438CFF',isAllDay:true,isOverdue:false,isCompleted:false,canComplete:true,completionBlockedReason:'',revision,...item}));
}
readline.createInterface({ input: process.stdin }).on('line', line => {
  const request = JSON.parse(line); let data;
  if (request.action === 'fixture') { overrides = { ...overrides, ...request.data }; process.stdout.write('{"type":"changed"}\n'); return; }
  if (request.action === 'requestAccess') { overrides.authorization = overrides.denyRequest ? 'denied' : 'authorized'; data = { authorization: overrides.authorization }; }
  else if (request.action === 'remindersStatus') data = {authorization:overrides.remindersAuthorization || 'notDetermined'};
  else if (request.action === 'requestRemindersAccess') { overrides.remindersAuthorization = overrides.denyRemindersRequest ? 'denied' : 'authorized'; data = {authorization:overrides.remindersAuthorization}; }
  else if (request.action === 'remindersSnapshot') data = {authorization:overrides.remindersAuthorization || 'notDetermined',items:overrides.remindersAuthorization === 'authorized' ? reminderItems() : []};
  else if (request.action === 'completeReminder') {
    const item = reminderItems().find(item => item.id === request.id);
    const code = overrides.failRemindersSave ? 'save_failed' : !item || request.revision !== item.revision || item.isCompleted ? 'stale_reminder' : !item.canComplete ? 'completion_not_supported' : null;
    if (code) { process.stdout.write(JSON.stringify({requestId:request.requestId,ok:false,error:code,message:'Fixture save failed'})+'\n'); return; }
    completed.add(item.id); data = {completed:true}; process.stdout.write('{"type":"changed"}\n');
  }
  else if (request.action === 'status') data = { authorization: overrides.authorization || 'authorized' };
  else {
    data = { ...snapshot(), ...overrides }; data.events = data.events.filter(event => request.calendarIds.includes(event.calendar.id));
  }
  process.stdout.write(JSON.stringify({ requestId: request.requestId, ok: true, data }) + '\n');
});
