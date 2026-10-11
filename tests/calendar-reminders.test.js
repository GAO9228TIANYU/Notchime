const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reminderFor, ReminderLedger, CalendarReminderScheduler, MAX_TIMER_MS } = require('../calendar-reminders');
const { normalizeReminderMinutes } = require('../calendar-settings');
const root = path.join(__dirname,'..','.cache','tests'); fs.mkdirSync(root,{recursive:true});
function clock() { let now=Date.parse('2026-10-11T23:40:00+09:00'),id=0;const timers=new Map();return {
 now:()=>now,setTimer:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimer:id=>timers.delete(id),
 jump:ms=>{now+=ms;},fire:()=>{const item=timers.entries().next().value;if(item){timers.delete(item[0]);item[1].fn();}},
 count:()=>timers.size,delay:()=>timers.values().next().value?.delay,
}; }
function event(c,patch={}) {const start=new Date(c.now()+20*60000).toISOString();return {id:'display-id',eventIdentifier:'event-id',externalIdentifier:'external-id',occurrenceStart:start,
 title:'Private test title',start,end:new Date(c.now()+60*60000).toISOString(),allDay:false,calendar:{id:'calendar',color:'#438CFF'},...patch};}
function harness(t) {const c=clock(),directory=fs.mkdtempSync(path.join(root,'reminders-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const delivered=[],ledger=new ReminderLedger(directory,c.now),s=new CalendarReminderScheduler({...c,ledger,deliver:r=>delivered.push(...r)});
 t.after(()=>s.close());return {c,directory,ledger,s,delivered,snapshot:events=>({authorization:'authorized',error:null,selectedCalendarIds:['calendar'],events})};}
for(const lead of [5,10,15]) test(`reminds ${lead} minutes before a real selected timed event`, t=>{
 const h=harness(t), e=event(h.c);h.s.update(h.snapshot([e]),lead);assert.equal(h.c.delay(),(20-lead)*60000);
 h.c.jump((20-lead)*60000);h.c.fire();assert.equal(h.delivered.length,1);assert.equal(h.delivered[0].minutes,lead);
 h.s.update(h.snapshot([e]),lead);assert.equal(h.c.count(),0);
});
test('reminder preference accepts off/5/10/15 and defaults to ten',()=>{
 for(const v of [0,5,10,15])assert.equal(normalizeReminderMinutes(v),v);
 for(const v of [undefined,null,'5',-1,1,Infinity,NaN,20])assert.equal(normalizeReminderMinutes(v),10);
});
test('off, all-day, unknown identity, ended, historical, unselected, denied, revoked or broken snapshot never schedule',t=>{
 const h=harness(t),e=event(h.c);
 for(const [snapshot,lead] of [[h.snapshot([e]),0],[h.snapshot([{...e,allDay:true}]),10],[h.snapshot([{...e,eventIdentifier:'',externalIdentifier:''}]),10],
  [h.snapshot([{...e,start:new Date(h.c.now()-3600000).toISOString()}]),10],
  [{...h.snapshot([e]),selectedCalendarIds:[]},10],[{...h.snapshot([e]),authorization:'denied'},10],[{...h.snapshot([e]),authorization:'error'},10],
  [{...h.snapshot([e]),error:'unavailable'},10]]) {h.s.update(snapshot,lead);assert.equal(h.c.count(),0);}
});
test('new/modified/deleted events and calendar deselection rebuild a single safe timer',t=>{
 const h=harness(t),e=event(h.c);h.s.update(h.snapshot([]),10);assert.equal(h.c.count(),0);
 h.s.update(h.snapshot([e]),10);assert.equal(h.c.count(),1);
 const edited={...e,start:new Date(h.c.now()+25*60000).toISOString()};h.s.update(h.snapshot([edited]),10);assert.equal(h.c.delay(),15*60000);
 h.s.update(h.snapshot([]),10);assert.equal(h.c.count(),0);h.s.update(h.snapshot([e]),10);
 h.s.update({...h.snapshot([e]),selectedCalendarIds:[]},10);assert.equal(h.c.count(),0);
});
test('recurrence instance, start edits, calendar and lead changes have distinct hashes; display ID/title changes do not',t=>{
 const h=harness(t),e=event(h.c),key=reminderFor(e,10).key;
 assert.equal(reminderFor({...e,id:'new-display',title:'renamed',eventIdentifier:'changed-local-id'},10).key,key);
 for(const patch of [{occurrenceStart:new Date(h.c.now()+86400000).toISOString()},{start:new Date(h.c.now()+45*60000).toISOString()},{calendar:{id:'other'}}])
  assert.notEqual(reminderFor({...e,...patch},10).key,key);
 assert.notEqual(reminderFor(e,5).key,key);
});
test('cross-midnight and time zone offset notation use absolute instants',t=>{
 const h=harness(t),e=event(h.c);assert.equal(new Date(e.start).getUTCDate(),11);
 assert.equal(reminderFor({...e,start:'2026-10-12T00:00:00+09:00'},10).due,reminderFor({...e,start:'2026-10-11T15:00:00Z'},10).due);
 h.s.update(h.snapshot([e]),10);h.c.jump(10*60000);h.c.fire();assert.equal(h.delivered.length,1);
});
test('long sleep / forward clock jumps do not replay historical reminders; reverse jumps rearm',t=>{
 const h=harness(t),e=event(h.c);h.s.update(h.snapshot([e]),10);h.c.jump(12*60000);h.c.fire();assert.equal(h.delivered.length,0);
 h.s.cancel();h.s.update(h.snapshot([e]),10);assert.equal(h.c.count(),0);
 const later=event(h.c);h.s.update(h.snapshot([later]),10);h.c.jump(-3600000);h.c.fire();assert.equal(h.delivered.length,0);assert.equal(h.c.delay(),70*60000);
});
test('ordinary refresh at the timer boundary retains existing due reminder; fresh process does not catch up',t=>{
 const h=harness(t),e=event(h.c);h.s.update(h.snapshot([e]),10);h.c.jump(10*60000+100);h.s.update(h.snapshot([e]),10);h.c.fire();assert.equal(h.delivered.length,1);
});
test('restart dedup, duplicate snapshots and Helper reconnection retain at-most-once delivery',t=>{
 const h=harness(t),e=event(h.c),key=reminderFor(e,10).key;
 assert.equal(h.ledger.consume(key),true);const restored=new ReminderLedger(h.directory,h.c.now);assert.equal(restored.has(key),true);
 h.s.ledger=restored;h.s.update(h.snapshot([e,e]),10);assert.equal(h.c.count(),0);
 h.s.cancel();h.s.update(h.snapshot([e]),10);assert.equal(h.c.count(),0);
 const edited={...e,start:new Date(h.c.now()+25*60000).toISOString()};h.s.update(h.snapshot([edited]),10);assert.equal(h.c.count(),1);
 const disk=fs.readFileSync(restored.file,'utf8');assert.equal(disk.includes(e.title),false);assert.equal(disk.includes('event-id'),false);assert.equal(disk.includes(e.start),false);
});
test('simultaneous reminders batch, malformed dates reject, excessive timers clamp',t=>{
 const h=harness(t),e=event(h.c);assert.equal(reminderFor({...e,start:'bad'},10),null);
 h.s.update(h.snapshot([e,{...e,externalIdentifier:'second'}]),10);h.c.jump(10*60000);h.c.fire();assert.equal(h.delivered.length,2);
 const far=event(h.c,{start:new Date(h.c.now()+100*86400000).toISOString(),end:new Date(h.c.now()+101*86400000).toISOString()});
 h.s.update(h.snapshot([far]),10);assert.equal(h.c.delay(),MAX_TIMER_MS);h.c.jump(MAX_TIMER_MS);h.c.fire();assert.equal(h.delivered.length,2);assert.ok(h.c.delay()<=MAX_TIMER_MS);
});
test('corrupt/future-schema ledger is preserved and blocks reminders instead of being overwritten',t=>{
 const h=harness(t);fs.writeFileSync(h.ledger.file,'{bad');const ledger=new ReminderLedger(h.directory,h.c.now);
 assert.ok(ledger.error);assert.equal(ledger.consume('a'.repeat(64)),false);assert.equal(fs.readFileSync(ledger.file,'utf8'),'{bad');
 h.s.ledger=ledger;h.s.update(h.snapshot([event(h.c)]),10);assert.equal(h.c.count(),0);
});
test('write failure never presents an unpersisted reminder; expired receipts are pruned',t=>{
 const h=harness(t);assert.equal(h.ledger.consume('a'.repeat(64)),true);h.c.jump(31*86400000);assert.equal(h.ledger.consume('b'.repeat(64)),true);
 assert.equal(JSON.parse(fs.readFileSync(h.ledger.file)).receipts.length,1);
 const blocked=new ReminderLedger(h.directory,h.c.now);blocked.file=h.directory;
 assert.equal(blocked.consume('c'.repeat(64)),false);assert.ok(blocked.error);
});
