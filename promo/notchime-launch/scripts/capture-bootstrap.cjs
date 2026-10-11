// Promotional test harness: real npm start, real Main/Preload/Renderer,
// synthetic JSONL provider only. Never loads EventKit or a personal profile.
if (process.versions.electron && !process.env.ELECTRON_RUN_AS_NODE) {
  const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
  const { spawn } = require('node:child_process');
  const root = path.resolve(__dirname, '../../..');
  const out = path.resolve(__dirname, '../assets/captures');
  let app;
  const profile = process.argv.find(x=>x.startsWith('--user-data-dir='))?.slice('--user-data-dir='.length)||'';
  if (!profile.startsWith(path.join(root, '.cache/tests/promo-'))) throw Error('Promo requires isolated test profile');
  const now = new Date();
  const date = new Date(now); date.setHours(14,0,0,0);
  const cal = {id:'promo-calendar',name:'Notchime Demo',color:'#7C8EFF',source:{id:'demo',name:'DEMO DATA'}};
  const event = {id:'demo-review',eventIdentifier:'demo-review',externalIdentifier:'demo-review',occurrenceStart:date.toISOString(),title:'设计评审 · Design review',start:date.toISOString(),end:new Date(+date+3600000).toISOString(),allDay:false,timeZone:'Asia/Seoul',calendar:cal};
  const dueDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const data = {authorization:'authorized',remindersAuthorization:'authorized',calendars:[cal],events:[event],reminders:[{id:'demo-deck',title:'发送演示稿 · Send demo deck',dueDate,listName:'Notchime Demo'}]};
  const bridgePath = require.resolve(path.join(root,'calendar-bridge'));
  const original = require(bridgePath);
  class PromoBridge extends original.CalendarBridge {
    constructor(executable) {
      super(executable,{spawnProcess:(_p,_a,opts)=>spawn(process.env.CALENDAR_TEST_NODE,[path.join(root,'tests/fixtures/calendar-helper.js')],{...opts,env:process.env})});
      global.__promoBridge=this;
    }
    start() { const isNew=!this.child; super.start(); if(isNew)this.child.stdin.write(JSON.stringify({action:'fixture',data})+'\n'); }
  }
  require.cache[bridgePath].exports={...original,CalendarBridge:PromoBridge};
  const mainPath=require.resolve(path.join(root,'main'));
  const loader=Module._extensions['.js'];
  Module._extensions['.js']=(module,file)=>{
    if(file!==mainPath)return loader(module,file);
    module._compile(fs.readFileSync(file,'utf8')+'\nglobal.__promoMain={window:()=>mainWindow,auto:()=>automaticReveal};',file);
    Module._extensions['.js']=loader;
  };
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const evidence={kind:'real-electron-fixture-capture',eventKitAccess:false,personalDataAccess:false,syncVerified:false,recordedAt:now.toISOString(),testData:data,clips:{}};
  async function work(){
    ({app}=require('electron'));
    app.setLoginItemSettings = () => { throw Error('Promo cannot write login items'); };
    app.getLoginItemSettings = () => ({ openAtLogin: false });
    await app.whenReady();
    for(let i=0;i<200&&!global.__promoMain?.window();i++)await sleep(50);
    const w=global.__promoMain.window(); if(!w)throw Error('Main window missing');
    const nativeIgnore=w.setIgnoreMouseEvents.bind(w); w.setIgnoreMouseEvents=()=>nativeIgnore(true);nativeIgnore(true);
    if(w.webContents.isLoading())await new Promise(r=>w.webContents.once('did-finish-load',r));
    const js=x=>w.webContents.executeJavaScript(x);
    async function until(x){for(let i=0;i<300;i++){if(await js(x))return;await sleep(40);}throw Error('Timed out: '+x);}
    await until('Boolean(window.NotchPanel && window.RemindersUI && window.CountdownUI)');
    await until('RemindersUI.getSnapshot().items.length === 1 && CalendarUI.getSnapshot().events.length === 1');
    await js('NotchPanel.setMode(true)'); await until('NotchPanel.getState().expanded && !NotchPanel.getState().busy');
    const result=await js(`notchAPI.createCountdown({title:'产品发布 · Launch',targetDate:'2026-11-01',targetTime:null,color:'#438CFF',pinned:true})`);
    if(!result.ok)throw Error('Demo countdown save failed: '+JSON.stringify(result));await sleep(650);
    const screenshot=async name=>fs.writeFileSync(path.join(out,name),(await w.webContents.capturePage()).toPNG());
    await screenshot('mac-before.png');
    const target=await js(`(()=>{const r=document.querySelector('.reminder-complete[data-id="demo-deck"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    evidence.completionTarget=target;
    async function record(name,seconds,action){
      const dir=path.join(out,name);fs.mkdirSync(dir,{recursive:true});const frames=[];const started=Date.now();let index=0;
      const pending=Promise.resolve().then(action);
      while(Date.now()-started<seconds*1000){
        const at=(Date.now()-started)/1000;
        const image=await w.webContents.capturePage();const size=image.getSize();
        const file=String(index++).padStart(4,'0')+'.png';fs.writeFileSync(path.join(dir,file),image.toPNG());
        frames.push({at,file,...size});await sleep(Math.max(0,50-(Date.now()-started-at*1000)));
      }
      await pending;evidence.clips[name]={duration:seconds,frames};
    }
    await record('complete',2.4,async()=>{await sleep(900);await js(`document.querySelector('.reminder-complete[data-id="demo-deck"]').click()`);});
    await until('RemindersUI.getSnapshot().items.length===0');await screenshot('mac-after.png');
    evidence.fixtureCompletionConfirmed=true;
    await js('notchAPI.setAutoCollapseSeconds(4)');
    await js('NotchPanel.setMode(false)');await until('!NotchPanel.getState().expanded&&!NotchPanel.getState().busy');
    // Record the existing scheduler and CSS motion at real elapsed time.
    // The event is scheduled 5 minutes + 0.6 s ahead, not a system clock change.
    await js('notchAPI.setReminderMinutes(5)');
    const start=new Date(Date.now()+5*60000+600).toISOString();
    const upcoming={...event,id:'demo-upcoming',eventIdentifier:'demo-upcoming',externalIdentifier:'demo-upcoming',occurrenceStart:start,start,end:new Date(Date.parse(start)+3600000).toISOString()};
    await record('smart-notch',8,async()=>{
      global.__promoBridge.child.stdin.write(JSON.stringify({action:'fixture',data:{events:[upcoming]}})+'\n');
      await sleep(1800);w.webContents.sendInputEvent({type:'mouseMove',x:120,y:180});
      await sleep(1300);w.webContents.sendInputEvent({type:'mouseMove',x:-80,y:-80});w.webContents.sendInputEvent({type:'mouseLeave',x:-80,y:-80});
    });
    evidence.smartNotchEndState=await js('NotchPanel.getState()');
    if(evidence.smartNotchEndState.expanded)throw Error('Automatic collapse did not complete');
    fs.writeFileSync(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));
    fs.rmSync(path.join(out,'capture-error.txt'),{force:true});
    console.log('PROMO_CAPTURE_OK');app.quit();
  }
  setImmediate(()=>work().catch(e=>{fs.writeFileSync(path.join(out,'capture-error.txt'),e.stack);console.error(e);app.exit(1);}));
}
