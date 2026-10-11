const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
test('Swift pure date logic handles actual Gregorian calendar, DST and time zones',()=>{
 const directory=path.join(root,'.cache/tests/native-reminder-dates');fs.mkdirSync(directory,{recursive:true});
 const env={...process.env,TMPDIR:directory,CLANG_MODULE_CACHE_PATH:path.join(root,'.cache/native/modules')};
 const binary=path.join(directory,'dates');execFileSync('xcrun',['swiftc','-disallow-use-new-driver','-module-cache-path',env.CLANG_MODULE_CACHE_PATH,path.join(root,'native/calendar-helper/ReminderDate.swift'),path.join(root,'tests/native-reminder-dates.swift'),'-o',binary],{cwd:root,env,stdio:'pipe'});
 assert.match(execFileSync(binary,[],{encoding:'utf8'}),/PASS Swift Reminders deadlines/);
});
test('native Reminder boundary permits only completion, blocks recurrence, checks revision and relookup',()=>{
 const source=fs.readFileSync(path.join(root,'native/calendar-helper/main.swift'),'utf8');
 assert.match(source,/requestFullAccessToReminders/);assert.match(source,/requestAccess\(to: \.reminder/);
 assert.match(source,/predicateForIncompleteReminders\(withDueDateStarting: nil, ending: tomorrow/);assert.match(source,/fetchReminders\(matching: predicate\)/);
 assert.match(source,/calendarItem\(withIdentifier: reminderID\) as\? EKReminder/);assert.match(source,/reminderToken\(reminder\) == revision/);assert.match(source,/guard !reminder.hasRecurrenceRules/);
 assert.match(source,/!reminder.hasChanges, reminder.refresh\(\)/);
 assert.equal([...source.matchAll(/store\.save\(/g)].length,1);assert.match(source,/try store.save\(reminder, commit: true\)/);
 assert.equal([...source.matchAll(/reminder\.\w+\s*=\s*(?!=)/g)].map(m=>m[0]).join(''), 'reminder.isCompleted = ');
 assert.doesNotMatch(source,/store\.remove|EKReminder\(eventStore|reminder\.notes|reminder\.url|structuredLocation/);
});
test('reminders module never persists tasks, logs titles or drives automatic reveals',()=>{
 const source=fs.readFileSync(path.join(root,'reminders-provider.js'),'utf8');assert.doesNotMatch(source,/node:fs|writeFile|console\.|automaticReveal|lifecycleReveals|ReminderLedger|fetch\(/);
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');const section=main.slice(main.indexOf('function getRemindersProvider'),main.indexOf('function refreshSystemCalendar'));
 assert.doesNotMatch(section,/automaticReveal|reminderScheduler|requestRendererExpand/);
});
