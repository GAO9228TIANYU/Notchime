const test = require('node:test');
const assert = require('node:assert/strict');
const { AutomaticReveal, LifecycleRevealCoordinator, validPanelState, waitForCalendar } = require('../automatic-reveal');
function clock() {
  let now = 0, id = 0; const timers = new Map();
  return { now: () => now, setTimer: (fn, delay) => { timers.set(++id, { fn, at: now + delay }); return id; },
    clearTimer: id => timers.delete(id), advance: ms => { const end = now + ms;
      while (true) { const next = [...timers].filter(([,t]) => t.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
        if (!next) break; now = next[1].at; timers.delete(next[0]); next[1].fn(); }
      now = end;
    }, count: () => timers.size };
}
function harness() {
  const time = clock(), expanded = [], collapsed = [];
  const auto = new AutomaticReveal({ ...time, expand: r => expanded.push(r), collapse: token => collapsed.push(token) });
  auto.ready = true;
  const ack = (patch = {}) => auto.update({ expanded: true, busy: false, source: 'automatic', hovered: false,
    tab: 'calendar', token: expanded.at(-1).token, ...patch });
  return { time, auto, ack, expanded, collapsed };
}
test('automatic overview waits for acknowledgement then collapses at four seconds', () => {
  const h = harness(); assert.equal(h.auto.request({kind:'overview'}), true);
  h.time.advance(500); assert.equal(h.collapsed.length, 0); h.ack();
  h.time.advance(3999); assert.equal(h.collapsed.length, 0); h.time.advance(1); assert.equal(h.collapsed.length, 1);
});
test('native/Renderer not ready or motion busy cannot receive an automatic request', () => {
  const h=harness(); h.auto.ready=false; assert.equal(h.auto.request({}),false);
  h.auto.ready=true; h.auto.state.busy=true; assert.equal(h.auto.request({}),false);
  h.auto.state.busy=false; h.auto.request({}); assert.equal(h.auto.request({}),false); h.auto.arm();
  h.time.advance(5000); assert.equal(h.auto.session,null);
});
for (const tab of ['settings','calendar']) test(`manual ${tab} / Countdown use is never interrupted or collapsed`, () => {
  const h=harness(); h.auto.update({expanded:true,busy:false,source:'manual',hovered:false,tab,token:null});
  assert.equal(h.auto.request({kind:'reminder'}),false); h.time.advance(10000); assert.equal(h.collapsed.length,0);
});
test('hover pauses, leaving restarts the full duration, animation busy protects collapse', () => {
  const h=harness(); h.auto.request({}); h.ack(); h.time.advance(2000); h.ack({hovered:true});
  h.time.advance(20000); assert.equal(h.collapsed.length,0); h.ack(); h.time.advance(3999); assert.equal(h.collapsed.length,0);
  h.ack({busy:true}); h.time.advance(5000); assert.equal(h.collapsed.length,0); h.ack(); h.time.advance(4000); assert.equal(h.collapsed.length,1);
});
test('intentional takeover invalidates the old timer and presentation generation', () => {
  const h=harness(); h.auto.request({}); h.ack(); h.time.advance(1000); h.ack({source:'manual',token:null});
  h.time.advance(10000); assert.equal(h.collapsed.length,0); assert.equal(h.auto.session,null);
});
test('a new automatic reminder replaces an overview timer, close/hide cancels timers', () => {
  const h=harness(); h.auto.request({kind:'overview'}); h.ack(); const old=h.expanded[0].token;
  h.time.advance(3000); h.auto.request({kind:'reminder'}); h.ack(); h.time.advance(1000);
  assert.equal(h.collapsed.length,0); assert.notEqual(h.expanded[1].token,old);
  h.auto.close(); h.time.advance(10000); assert.equal(h.collapsed.length,0); assert.equal(h.time.count(),0);
});
test('startup/login reveal waits for Renderer and native readiness, is emitted once', () => {
  const c=clock(), seen=[]; let ready=false;
  const coordinator=new LifecycleRevealCoordinator({...c,ready:()=>ready,reveal:r=>seen.push(r)});
  coordinator.signal('startup'); c.advance(10000); assert.deepEqual(seen,[]);
  ready=true; coordinator.flush(); c.advance(600); coordinator.signal('startup'); c.advance(30000); assert.deepEqual(seen,['startup']);
});
test('resume/lid/unlock cluster merges; activation/focus/display alone never reveal', () => {
  const c=clock(),seen=[];
  const coordinator=new LifecycleRevealCoordinator({...c,ready:()=>true,reveal:r=>seen.push(r)});
  for(const signal of ['resume','unlock-screen','activate','focus','display-metrics-changed']) coordinator.signal(signal);
  c.advance(600); assert.deepEqual(seen,['unlock-screen']); coordinator.signal('resume'); c.advance(1000); assert.equal(seen.length,1);
  c.advance(15000); coordinator.signal('resume'); c.advance(600); assert.equal(seen.length,2);
  coordinator.close(); coordinator.signal('unlock-screen'); c.advance(1000); assert.equal(seen.length,2);
});
test('sleep/lock invalidates pending startup/recovery work', () => {
  const c=clock(), seen=[];
  const coordinator=new LifecycleRevealCoordinator({...c,ready:()=>true,reveal:r=>seen.push(r)});
  coordinator.signal('startup'); coordinator.suspend(); c.advance(600); assert.equal(seen.length,0);
  coordinator.signal('resume'); c.advance(600); assert.equal(seen.length,1);
});
test('state report schema rejects arbitrary scheduling, paths and malformed values', () => {
  const s={expanded:false,busy:false,source:null,hovered:false,tab:'calendar',token:null};
  assert.equal(validPanelState(s),true);
  for(const p of [{tab:'todo'},{source:'system'},{busy:1},{token:'arbitrary'},{timer:1},{path:'/bin/sh'}]) assert.equal(Boolean(validPanelState({...s,...p})),false);
});
test('data readiness has a bounded fallback and clears its timer on success/failure', async () => {
  const c = clock();
  const pending = waitForCalendar(() => new Promise(() => {}), c);
  c.advance(2499); assert.equal(c.count(), 1); c.advance(1); assert.equal(await pending, null); assert.equal(c.count(), 0);
  assert.deepEqual(await waitForCalendar(() => ({authorization:'authorized'}), c), {authorization:'authorized'});
  assert.equal(await waitForCalendar(() => { throw new Error('Helper failed'); }, c), null); assert.equal(c.count(), 0);
});
test('a reminder arriving during automatic opening waits for motion then replaces overview', () => {
  const h=harness();h.auto.request({kind:'overview'});h.ack({busy:true});
  assert.equal(h.auto.request({kind:'reminder'}),true);assert.equal(h.expanded.length,1);
  h.time.advance(300);h.ack();assert.equal(h.expanded.length,2);assert.equal(h.expanded[1].presentation.kind,'reminder');
});
test('a queued reminder expires or is discarded on manual takeover', () => {
  const h=harness();h.auto.request({kind:'overview'});h.ack({busy:true});h.auto.request({kind:'reminder'});
  h.time.advance(2100);h.ack();assert.equal(h.expanded.length,1);
  h.auto.cancel();h.auto.state={expanded:false,busy:false,source:null};h.auto.request({kind:'overview'});h.ack({busy:true});h.auto.request({kind:'reminder'});
  h.ack({source:'manual',token:null});assert.equal(h.auto.pendingPresentation,null);
});
test('late collapsed state from previous reveal cannot cancel the new unacknowledged token', () => {
  const h=harness();h.auto.request({kind:'overview'});const token=h.auto.session.token;
  h.auto.update({expanded:false,busy:false,source:null,hovered:false,tab:'calendar',token:null});
  assert.equal(h.auto.session.token,token);h.ack();h.time.advance(4000);assert.equal(h.collapsed.length,1);
});
test('hover arriving with a collapse request retains ownership until Renderer acknowledgement', () => {
  const h=harness();h.auto.request({kind:'overview'});h.ack();const token=h.auto.session.token;
  h.time.advance(4000);assert.deepEqual(h.collapsed,[token]);
  // Renderer refuses the in-transit request because the user just entered.
  h.ack({hovered:true});assert.equal(h.auto.session.token,token);
  h.time.advance(12000);assert.equal(h.collapsed.length,1);
  h.ack({hovered:false});h.time.advance(3999);assert.equal(h.collapsed.length,1);
  h.time.advance(1);assert.equal(h.collapsed.length,2);
  h.ack({expanded:false,source:null,token:null});assert.equal(h.auto.session,null);assert.equal(h.time.count(),0);
});
