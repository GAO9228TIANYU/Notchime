// Real Main/preload/window with a fixture calendar only. Emitted power events are
// integration simulations, not evidence of physical macOS sleep/lid/unlock.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const { app, BrowserWindow, powerMonitor, screen } = require('electron');
const { reminderFor } = require('../calendar-reminders');
const profile = process.env.CALENDAR_TEST_USER_DATA, phase = process.env.CALENDAR_TEST_PHASE;
if (!profile) throw new Error('An isolated profile is required');
app.commandLine.appendSwitch('user-data-dir',profile);app.commandLine.appendSwitch('use-mock-keychain');
app.setLoginItemSettings=()=>{throw new Error('No system login writes');};app.getLoginItemSettings=()=>({openAtLogin:false});
require('./fixtures/install-calendar');
const target=require.resolve('../main'),loader=Module._extensions['.js'];
Module._extensions['.js']=(module,file)=>{
 if(file!==target)return loader(module,file);
 module._compile(fs.readFileSync(file,'utf8')+'\nmodule.exports={window:()=>mainWindow,provider:getCalendarProvider,auto:()=>automaticReveal,lifecycle:()=>lifecycleReveals,scheduler:()=>reminderScheduler};',file);
};
const errors=[];app.on('web-contents-created',(_e,w)=>w.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
const main=require('../main');Module._extensions['.js']=loader;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const deadline=setTimeout(()=>{console.error('Automatic integration timeout',errors);app.exit(1);},90000);
(async()=>{
 await app.whenReady();const window=main.window();
 const cancellations=[];
 const cancel=main.auto().cancel.bind(main.auto());
 main.auto().cancel=()=>{cancellations.push({state:{...main.auto().state},session:main.auto().session && {...main.auto().session},caller:new Error().stack.split('\n').slice(2,5)});return cancel();};
 // Keep physical clicks/scrolls in the user's foreground application. Synthetic
 // webContents mouse input below still exercises the actual Renderer hover path.
 const nativeIgnoreMouse = window.setIgnoreMouseEvents.bind(window);
 window.setIgnoreMouseEvents = () => nativeIgnoreMouse(true);
 window.setIgnoreMouseEvents(true);
if(window.webContents.isLoading())await new Promise(r=>window.webContents.once('did-finish-load',r));
 const js=c=>window.webContents.executeJavaScript(c);
 await js("window.testInput=[]; for(const name of ['pointerdown','keydown','wheel','click']) document.addEventListener(name,e=>testInput.push({type:e.type,target:e.target.id,trusted:e.isTrusted,state:NotchPanel.getState()}),true)");
 async function wait(c){const end=Date.now()+9000;while(Date.now()<end){if(await js(c))return;await sleep(25);}throw new Error('Wait '+c+' '+JSON.stringify({renderer:await js('({state:NotchPanel.getState(),input:window.testInput})'),automatic:{state:main.auto().state,session:main.auto().session,timer:!!main.auto().timer,cancellations:cancellations.slice(-8)}}));}
 const expanded=()=>wait('NotchPanel.getState().expanded && !NotchPanel.getState().busy');
 const collapsed=()=>wait('!NotchPanel.getState().expanded && !NotchPanel.getState().busy');
 const fixture=data=>global.__calendarFixtureBridge.child.stdin.write(JSON.stringify({action:'fixture',data})+'\n');
 const leave=async()=>{
   // Native focus restoration can enqueue mouse state after a synthetic move.
   // Synchronize on actual DOM AND Main hover state, not a fixed 100ms delay.
   const end=Date.now()+2000;
   do {
     const {width,height}=window.getBounds();
     window.webContents.sendInputEvent({type:'mouseMove',x:width+80,y:height+80});
     window.webContents.sendInputEvent({type:'mouseLeave',x:width+80,y:height+80});
     await sleep(50);
     if(!await js("document.getElementById('panel').matches(':hover')") && !main.auto().state.hovered) return;
   } while(Date.now()<end);
   assert.equal(await js("document.getElementById('panel').matches(':hover')"),false);
   assert.equal(main.auto().state.hovered,false,'Main must acknowledge hover exit');
 };
 const other=new BrowserWindow({width:200,height:100,show:true});app.focus({steal:true});other.focus();
 const auxiliaryDeadline=Date.now()+3000;
 while(!other.isFocused() && Date.now()<auxiliaryDeadline){app.focus({steal:true});other.show();other.focus();await sleep(30);}
 assert.equal(other.isFocused(),true,'foreground precondition established');
 let monitorFocus=true, automaticFocusCount=0;
 window.on('focus',()=>{if(monitorFocus)automaticFocusCount++;});
 await expanded();assert.equal(await js('NotchPanel.getState().source'),'automatic');
 assert.equal(await js('document.getElementById("automatic-label").textContent'),'今日概览');
 assert.equal(window.isFocused(),false,'startup reveal must not steal native focus');
 await leave();await collapsed();assert.equal(automaticFocusCount,0,'automatic overview never focuses Main, even transiently');
 assert.equal(window.isFocused(),false);
 if(phase==='restart'){
   const receipt=JSON.parse(fs.readFileSync(path.join(profile,'calendar-reminder-receipts.json')));
   const keys=receipt.receipts.map(r=>r.key);const restoredKey=fs.readFileSync(path.join(profile,'reminder-expected-key'),'utf8');
   assert.ok(keys.includes(restoredKey));assert.equal(main.scheduler().ledger.has(restoredKey),true);
   assert.equal(await js('notchAPI.getAppSettings().then(s=>s.reminderMinutes)'),5);
   assert.equal(await js('notchAPI.listCountdowns().then(r=>r.items.length)'),1);
 } else {
   assert.equal(await js('notchAPI.getAppSettings().then(s=>s.reminderMinutes)'),10);
   assert.equal(await js('notchAPI.reportPanelState({expanded:true,busy:false,source:"automatic",hovered:false,tab:"calendar",token:"not-valid"}).then(r=>r.ok)'),false);
   assert.equal(await js('notchAPI.setReminderMinutes(1).then(r=>r.ok)'),false);
   // Four seconds begins after motion settles. Hover pauses indefinitely; leave restarts it.
   main.auto().request({kind:'overview'});await expanded();
   window.webContents.sendInputEvent({type:'mouseMove',x:100,y:130});
   await wait("document.getElementById('panel').matches(':hover')");await sleep(4300);
   assert.equal(await js('NotchPanel.getState().expanded'),true);await leave();await sleep(2500);
   assert.equal(await js('NotchPanel.getState().expanded'),true);await collapsed();
   // Reproduce a real IPC race: the pointer enters between Main's timer check
   // and Renderer receiving its collapse message. No assertion is relaxed.
   const originalSend = window.webContents.send.bind(window.webContents);
   let delayedCollapse = false;
   window.webContents.send = (channel, ...args) => {
     if (channel === 'window:request-collapse' && args[0]?.token && !delayedCollapse) {
       delayedCollapse = true;
       window.webContents.sendInputEvent({type:'mouseMove',x:100,y:130});
       setTimeout(() => originalSend(channel, ...args), 150);
       return;
     }
     return originalSend(channel, ...args);
   };
   main.auto().request({kind:'overview'});await expanded();await leave();
   await wait("document.getElementById('panel').matches(':hover') && !NotchPanel.getState().busy");
   await sleep(300);assert.equal(delayedCollapse,true);
   assert.equal(main.auto().session?.acknowledged,true,'rejected collapse must keep automatic ownership');
   assert.equal(await js('NotchPanel.getState().expanded'),true);
   window.webContents.send = originalSend;
   await leave();await collapsed();
   // User takeover preserves Settings and Countdown beyond a complete automatic interval.
   main.auto().request({kind:'overview'});await expanded();
   monitorFocus=false;app.focus({steal:true});window.focus();await js('document.getElementById("tab-button-settings").click()');
   await wait('NotchPanel.getState().source === "manual" && NotchPanel.getState().tab === "settings"');
   powerMonitor.emit('resume');powerMonitor.emit('unlock-screen');app.emit('activate');screen.emit('display-metrics-changed',{},screen.getPrimaryDisplay(),['bounds']);
   await sleep(4400);assert.equal(await js('NotchPanel.getState().tab'),'settings');assert.equal(await js('NotchPanel.getState().expanded'),true);
   await js('NotchPanel.setActiveTab("calendar");document.getElementById("countdown-add").click()');await wait('document.getElementById("countdown-editor").open');
   assert.equal(main.auto().request({kind:'reminder'}),false);assert.equal(await js('document.getElementById("countdown-editor").open'),true);
   window.webContents.send('window:request-collapse',{token:'00000000-0000-0000-0000-000000000000'});await sleep(80);
   assert.equal(await js('document.getElementById("countdown-editor").open'),true,'late automatic collapse cannot dismiss a manual dialog');
   await js('document.getElementById("countdown-cancel").click()');
   const saved=await js('notchAPI.createCountdown({title:"Automatic regression milestone",targetDate:"2027-08-31",targetTime:null,color:"#438CFF",pinned:true})');assert.equal(saved.ok,true);
   await js('NotchPanel.setMode(false)');await collapsed();other.focus();monitorFocus=true;automaticFocusCount=0;
   await js('notchAPI.setReminderMinutes(5)');
   // An actual timed callback runs the real scheduler -> fresh JSONL query -> Renderer banner.
   const calendar=require('./fixtures/calendar-fixture').snapshot().calendars[0];
   const start=new Date(Date.now()+5*60000+2500).toISOString();
   const event={id:'phase4-reminder',eventIdentifier:'phase4-event',externalIdentifier:'phase4-external',occurrenceStart:start,title:'Fixture upcoming event',start,end:new Date(Date.parse(start)+3600000).toISOString(),allDay:false,calendar};
   fixture({events:[event]});await wait('CalendarUI.getSnapshot().events.length === 1');
   await expanded();assert.equal(await js('document.getElementById("automatic-label").textContent'),'即将开始');
   assert.equal(await js('document.getElementById("automatic-title").textContent'),event.title);
   assert.match(await js('document.getElementById("automatic-detail").textContent'),/提前 5 分钟/);
   assert.equal(automaticFocusCount,0,'reminder never focuses Main');assert.equal(window.isFocused(),false);
   const key=reminderFor(event,5).key;fs.writeFileSync(path.join(profile,'reminder-expected-key'),key);
   assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'calendar-reminder-receipts.json'))).receipts.filter(r=>r.key===key).length,1);
   await leave();await collapsed();fixture({events:[event]});await sleep(800);assert.equal(await js('NotchPanel.getState().expanded'),false,'refresh does not repeat the fired reminder');
   // Changes/deletion/deselection/revocation cancel pending callbacks.
   const future={...event,id:'future',externalIdentifier:'future',start:new Date(Date.now()+6*60000).toISOString(),end:new Date(Date.now()+3600000).toISOString()};
   fixture({events:[future]});await wait('CalendarUI.getSnapshot().events[0]?.id === "future"');assert.equal(main.scheduler().pending.length,1);
   fixture({events:[]});await wait('CalendarUI.getSnapshot().events.length === 0');assert.equal(main.scheduler().pending.length,0);
   fixture({events:[future]});await wait('CalendarUI.getSnapshot().events.length === 1');await js('notchAPI.selectCalendars([])');assert.equal(main.scheduler().pending.length,0);
   await js('notchAPI.selectCalendars('+JSON.stringify([calendar.id])+')');assert.equal(main.scheduler().pending.length,1);
   fixture({authorization:'denied'});await wait('CalendarUI.getSnapshot().authorization === "denied"');assert.equal(main.scheduler().pending.length,0);
   fixture({authorization:'authorized',events:[]});await wait('CalendarUI.getSnapshot().authorization === "authorized"');
   // One recovery cluster, no display-only reveal. Cooldown moved only in test-local instrumentation.
   main.lifecycle().lastReveal=-Infinity;powerMonitor.emit('suspend');powerMonitor.emit('resume');powerMonitor.emit('unlock-screen');app.emit('activate');
   await expanded();await leave();await collapsed();await sleep(800);assert.equal(await js('NotchPanel.getState().expanded'),false);
   screen.emit('display-metrics-changed',{},screen.getPrimaryDisplay(),['bounds']);await sleep(800);assert.equal(await js('NotchPanel.getState().expanded'),false);
   main.lifecycle().lastReveal=-Infinity;powerMonitor.emit('lock-screen');powerMonitor.emit('resume');
   await sleep(800);assert.equal(await js('NotchPanel.getState().expanded'),false,'resume while locked waits for unlock');
   powerMonitor.emit('unlock-screen');await expanded();await leave();await collapsed();
 }
 assert.deepEqual(errors,[]);other.destroy();clearTimeout(deadline);app.quit();
 console.log(`PASS automatic ${phase}: real Electron window/timer/focus/hover/takeover, fixture reminders/receipts/recovery events, isolated data (not physical sleep or real EventKit reminders)`);
})().catch(e=>{console.error(e);clearTimeout(deadline);app.exit(1);});
