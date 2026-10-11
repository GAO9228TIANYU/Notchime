// Main owns temporary reveals. Renderer reports interaction/motion; it cannot schedule them.
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
class AutomaticReveal {
  constructor({ expand, collapse, duration = () => 4000, available = () => true,
    now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
    Object.assign(this, { expand, collapse, duration, available, now, setTimer, clearTimer });
    this.state = { expanded: false, busy: false, source: null, hovered: false };
    this.session = null; this.timer = null; this.ready = false; this.pendingPresentation = null;
  }
  cancel() { this.clearTimer(this.timer); this.timer = null; this.session = null; this.pendingPresentation = null; }
  request(presentation) {
    if (this.ready && this.available() && this.state.busy && this.state.source === 'automatic' && presentation.kind === 'reminder') {
      this.pendingPresentation = { value: presentation, expires: this.now() + 2000 }; return true;
    }
    if (!this.ready || !this.available() || this.state.busy ||
      (this.state.expanded && this.state.source !== 'automatic') || (this.session && !this.session.acknowledged)) return false;
    this.cancel();
    const token = crypto.randomUUID();
    this.session = { token, acknowledged: false };
    // Bounded acknowledgement: a stalled/crashed Renderer must not retain a session.
    this.timer = this.setTimer(() => this.cancel(), 5000);
    this.expand({ source: 'automatic', tab: 'calendar', token, presentation });
    return true;
  }
  update(state) {
    const previous = this.state; this.state = state;
    const session = this.session;
    if (!session) return;
    if (state.source === 'manual') { this.cancel(); return; }
    // A collapsed report can be in flight when Main issues a new token. It
    // cannot cancel that new session before the matching Renderer acknowledgement.
    if (!state.expanded && !state.busy && session.acknowledged) { this.cancel(); return; }
    if (state.token !== session.token || state.source !== 'automatic') return;
    if (!session.acknowledged && state.expanded && !state.busy) {
      session.acknowledged = true; this.arm();
      const pending = this.pendingPresentation; this.pendingPresentation = null;
      if (pending && pending.expires > this.now()) this.request(pending.value);
    } else if (session.acknowledged && (state.hovered || state.busy)) {
      this.clearTimer(this.timer); this.timer = null;
    } else if (session.acknowledged && (previous.hovered || previous.busy)) this.arm();
  }
  arm() {
    const session = this.session;
    if (!session?.acknowledged) return; // Keep the acknowledgement watchdog alive.
    this.clearTimer(this.timer); this.timer = null;
    if (this.state.hovered || this.state.busy) return;
    this.timer = this.setTimer(() => {
      this.timer = null;
      if (this.session !== session || !this.available()) return;
      const s = this.state;
      if (!s.expanded || s.source !== 'automatic' || s.token !== session.token || s.hovered || s.busy) return;
      // Renderer may reject this message if hover/interaction started in transit.
      // Keep ownership until its collapsed acknowledgement (or manual takeover),
      // so a later mouse leave can rearm rather than leave private content open.
      this.collapse(session.token);
    }, this.duration());
  }
  close() { this.ready = false; this.cancel(); }
}
class LifecycleRevealCoordinator {
  constructor({ reveal, ready, now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout,
    cooldownMs = 15000, mergeMs = 600 }) {
    Object.assign(this, { reveal, ready, now, setTimer, clearTimer, cooldownMs, mergeMs });
    this.pending = null; this.timer = null; this.lastReveal = -Infinity;
    this.generation = 0; this.started = false; this.closed = false;
  }
  signal(reason) {
    if (this.closed || !['startup', 'resume', 'unlock-screen'].includes(reason)) return;
    if (reason === 'startup') { if (this.started) return; this.started = true; }
    if (this.now() - this.lastReveal < this.cooldownMs) return;
    this.pending = reason; this.flush();
  }
  flush() {
    if (!this.pending || !this.ready() || this.timer || this.closed) return;
    const generation = this.generation;
    this.timer = this.setTimer(async () => {
      this.timer = null;
      if (generation !== this.generation || !this.pending || !this.ready()) return;
      const reason = this.pending; this.pending = null; this.lastReveal = this.now();
      await this.reveal(reason, () => generation === this.generation && !this.closed);
    }, this.mergeMs);
  }
  suspend() { this.generation++; this.pending = null; this.clearTimer(this.timer); this.timer = null; }
  close() { this.closed = true; this.suspend(); }
}
async function waitForCalendar(load, { timeoutMs = 2500, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer;
  try {
    return await Promise.race([Promise.resolve().then(load).catch(() => null),
      new Promise(resolve => { timer = setTimer(() => resolve(null), timeoutMs); })]);
  } finally { clearTimer(timer); }
}
function validPanelState(s) {
  return s && Object.getPrototypeOf(s) === Object.prototype &&
    Object.keys(s).every(k => ['expanded','busy','source','hovered','tab','token'].includes(k)) &&
    typeof s.expanded === 'boolean' && typeof s.busy === 'boolean' && typeof s.hovered === 'boolean' &&
    [null, 'manual', 'automatic'].includes(s.source) && ['calendar', 'settings'].includes(s.tab) &&
    (s.token === null || (typeof s.token === 'string' && /^[\da-f-]{36}$/i.test(s.token)));
}
module.exports = { AutomaticReveal, LifecycleRevealCoordinator, validPanelState, waitForCalendar };
