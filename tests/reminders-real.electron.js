// Real EventKit probe. Never creates or completes a reminder automatically.
// An optional interactive run waits for the human to authorize/click a chosen test item.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {app}=require('electron');
const root=path.resolve(__dirname,'..'),profile=process.env.CALENDAR_TEST_USER_DATA;
if(!profile || !path.resolve(profile).startsWith(path.join(root,'.cache')+path.sep))throw new Error('Isolated project profile required');
app.commandLine.appendSwitch('user-data-dir',profile);app.commandLine.appendSwitch('use-mock-keychain');
app.setLoginItemSettings=()=>{throw new Error('No real login item changes');};app.getLoginItemSettings=()=>({openAtLogin:false});
const {CalendarBridge}=require('../calendar-bridge');const request=CalendarBridge.prototype.request;
let confirmedWrites=0;const errors=[];
CalendarBridge.prototype.request=function(action,...args){return request.call(this,action,...args).then(data=>{
 if(action==='completeReminder' && data.completed===true){confirmedWrites++;console.log('REAL Reminder completion: EventKit save(commit: true) confirmed');}
 return data;
});};
const Module=require('node:module'),target=require.resolve('../main'),loader=Module._extensions['.js'];
Module._extensions['.js']=(module,file)=>{if(file!==target)return loader(module,file);module._compile(fs.readFileSync(file,'utf8')+'\nmodule.exports={window:()=>mainWindow,reminders:getRemindersProvider,calendar:getCalendarProvider};',file);};
const main=require('../main');Module._extensions['.js']=loader;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const timer=setTimeout(()=>{console.error('Interactive verification timeout; no permission or task write was automated');app.quit();},process.env.REMINDERS_INTERACTIVE?'900000': '30000');
(async()=>{
 await app.whenReady();const window=main.window();if(window.webContents.isLoading())await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));
 const js=code=>window.webContents.executeJavaScript(code);
 const snapshot=await main.reminders().refresh();const calendar=await main.calendar().refresh();
 assert.notEqual(snapshot.authorization,'error');assert.notEqual(calendar.authorization,'error');
 console.log('REAL initial authorization metadata:',JSON.stringify({reminders:snapshot.authorization,count:snapshot.items.length,calendar:calendar.authorization,calendarCount:calendar.calendars.length}));
 if(!process.env.REMINDERS_INTERACTIVE){clearTimeout(timer);app.quit();console.log('PASS real EventKit Reminders status/read (no writes, no TCC automation)');return;}
 await sleep(5500);await js('NotchPanel.setMode(true)');window.show();app.focus({steal:true});window.focus();
 await js('document.getElementById("reminders-heading").scrollIntoView({block:"nearest"})');
 console.log('READY: human permission and human-selected test-item completion; no automated writes');
 while(!confirmedWrites){await sleep(1000);if(!window || window.isDestroyed())return;}
 const after=await main.reminders().refresh();assert.equal(after.authorization,'authorized');
 assert.equal(await js('typeof require'),'undefined');assert.equal(await js('notchAPI.spawn || notchAPI.exec'),undefined);
 const evidence={remindersAuthorization:after.authorization,visibleItemCount:after.items.length,confirmedNativeCompletions:confirmedWrites,calendarAuthorization:(await main.calendar().refresh()).authorization,automatedWrites:0};
 fs.mkdirSync(path.join(root,'.cache/phase45'),{recursive:true});fs.writeFileSync(path.join(root,'.cache/phase45/real-reminders-result.json'),JSON.stringify(evidence,null,2));
 console.log('PASS REAL Electron -> shared Helper -> EventKit Reminder completion -> refreshed Renderer; user initiated');
 clearTimeout(timer);app.quit();
})().catch(error=>{console.error(error.message);clearTimeout(timer);app.exit(1);});
