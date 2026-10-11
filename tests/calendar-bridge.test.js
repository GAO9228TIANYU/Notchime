const test = require('node:test'); const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events'); const { PassThrough } = require('node:stream');
const { CalendarBridge, helperPath } = require('../calendar-bridge');
function setup(t) {
  const children=[];
  const bridge = new CalendarBridge('/fixed/calendar-helper', { timeoutMs: 25, spawnProcess: (file, args, options) => {
    assert.equal(file, '/fixed/calendar-helper'); assert.deepEqual(args, []); assert.equal(options.shell, false);
    const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{child.killed=true;}; children.push(child);return child;
  }});
  t.after(()=>bridge.close()); return {bridge,children};
}
function requests(child) { return child.stdin.read().toString().trim().split('\n').map(JSON.parse); }
function reply(child, request, data) { child.stdout.write(JSON.stringify({requestId:request.requestId,ok:true,data})+'\n'); }
test('unique request IDs match out-of-order fragmented responses correctly', async t=>{
  const {bridge,children}=setup(t); const a=bridge.request('status'),b=bridge.request('snapshot'); const child=children[0], [one,two]=requests(child);
  assert.notEqual(one.requestId,two.requestId);
  child.stdout.write(JSON.stringify({requestId:'unknown',ok:true,data:{wrong:true}})+'\n');
  reply(child,two,{two:2});const line=JSON.stringify({requestId:one.requestId,ok:true,data:{one:1}})+'\n';child.stdout.write(line.slice(0,10));child.stdout.write(line.slice(10));
  assert.deepEqual(await a,{one:1});assert.deepEqual(await b,{two:2});assert.equal(bridge.pending.size,0);
});
test('timeouts kill hung helper, reject pending requests and allow restart', async t=>{
  const {bridge,children}=setup(t); const pending=bridge.request('status');await assert.rejects(pending,{code:'helper_timeout'});assert.equal(children[0].killed,true);
  const restored=bridge.request('status');assert.equal(children.length,2);reply(children[1],requests(children[1])[0],{authorization:'authorized'});assert.equal((await restored).authorization,'authorized');
});
test('crashes and spawn failures do not crash Main and are recoverable',async t=>{
  const {bridge,children}=setup(t); const p=bridge.request('status');children[0].emit('exit',1);await assert.rejects(p,{code:'helper_exited'});
  const next=bridge.request('status');children[1].emit('error',new Error('ENOENT'));await assert.rejects(next,{code:'helper_unavailable'});
});
test('change notifications do not resolve requests and stderr is not protocol',async t=>{
  const {bridge,children}=setup(t);let changes=0,diagnostic='';bridge.on('changed',()=>changes++);bridge.on('diagnostic',text=>diagnostic=text);
  const p=bridge.request('status');children[0].stdout.write('{"type":"changed"}\n');children[0].stderr.write('diagnostic');
  assert.equal(changes,1);assert.equal(bridge.pending.size,1);assert.equal(diagnostic,'Native diagnostic received (content omitted).');reply(children[0],requests(children[0])[0],{});await p;
});
test('invalid protocol and helper errors are reported, arbitrary actions are rejected',async t=>{
  const {bridge,children}=setup(t);await assert.rejects(bridge.request('exec'),{code:'invalid'});
  const p=bridge.request('status');children[0].stdout.write('not JSON\n');await assert.rejects(p,{code:'protocol_error'});
  const next=bridge.request('snapshot');const r=requests(children[1])[0];children[1].stdout.write(JSON.stringify({requestId:r.requestId,ok:false,error:'denied',message:'permission denied'})+'\n');await assert.rejects(next,{code:'denied'});
});
test('shutdown rejects pending requests, kills process and prevents restarting',async t=>{
  const {bridge,children}=setup(t);const p=bridge.request('status');bridge.close();await assert.rejects(p,{code:'closed'});assert.equal(children[0].killed,true);await assert.rejects(bridge.request('status'),{code:'closed'});
});
test('helper executable path is fixed by Main and differs correctly in packaged mode',()=>{
  assert.match(helperPath({isPackaged:false}), /\.cache\/native\/NotchimeEventKitHelper\.app\/Contents\/MacOS\/notchime-eventkit-helper$/);
  const previous=process.resourcesPath;process.resourcesPath='/fixed/Resources';assert.equal(helperPath({isPackaged:true}),'/fixed/Resources/native/NotchimeEventKitHelper.app/Contents/MacOS/notchime-eventkit-helper');if(previous===undefined)delete process.resourcesPath;else process.resourcesPath=previous;
});

test('null, arrays and primitive protocol messages reject safely without throwing in Main', async t => {
  const { bridge, children } = setup(t);
  for (const value of [null, [], 42, 'string']) {
    const pending = bridge.request('status');
    assert.doesNotThrow(() => children.at(-1).stdout.write(JSON.stringify(value) + '\n'));
    await assert.rejects(pending, { code: 'protocol_error' });
  }
});

test('Reminder requests match independently of Calendar requests, with strict completion parameters',async t=>{
 const{bridge,children}=setup(t);
 for(const payload of [{id:'a',revision:'bad'},{id:'a',revision:'a'.repeat(64),title:'hack'},{id:'a\n',revision:'a'.repeat(64)}])await assert.rejects(bridge.request('completeReminder',payload),{code:'invalid'});
 await assert.rejects(bridge.request('remindersSnapshot',{path:'/private'}),{code:'invalid'});
 const reminders=bridge.request('remindersStatus'),calendar=bridge.request('status');const[one,two]=requests(children[0]);reply(children[0],two,{authorization:'authorized'});reply(children[0],one,{authorization:'denied'});
 assert.equal((await reminders).authorization,'denied');assert.equal((await calendar).authorization,'authorized');
});
test('Reminder write timeout rejects, restarts Helper and never automatically retries a write',async t=>{
 const{bridge,children}=setup(t);const pending=bridge.request('completeReminder',{id:'a',revision:'a'.repeat(64)});await assert.rejects(pending,{code:'helper_timeout'});
 const read=bridge.request('remindersStatus');const r=requests(children[1]);assert.equal(r.length,1);assert.equal(r[0].action,'remindersStatus');reply(children[1],r[0],{authorization:'authorized'});await read;
});
test('malformed native error payload cannot escape the protocol validation boundary',async t=>{
 const{bridge,children}=setup(t);const pending=bridge.request('remindersStatus');const r=requests(children[0])[0];
 children[0].stdout.write(JSON.stringify({requestId:r.requestId,ok:false,error:{execute:'/bin/sh'},message:['private']})+'\n');
 await assert.rejects(pending,{code:'protocol_error'});
});
