const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MAX_TIMER_MS = 2147483647;
const RETENTION_MS = 30 * 86400000;
function reminderFor(event, minutes) {
  if (![5,10,15].includes(minutes) || event.allDay !== false || !event.calendar?.id) return null;
  const start = Date.parse(event.start), end = Date.parse(event.end);
  const identity = event.externalIdentifier || event.eventIdentifier;
  const occurrence = Date.parse(event.occurrenceStart || event.start);
  if (typeof identity !== 'string' || !identity || !Number.isFinite(start) || !Number.isFinite(end) ||
    !Number.isFinite(occurrence) || end <= start) return null;
  const due = start - minutes * 60000;
  const key = crypto.createHash('sha256').update(JSON.stringify([event.calendar.id, identity, occurrence, start, minutes, due])).digest('hex');
  return { key, due, start, end, minutes, event };
}
class ReminderLedger {
  constructor(directory, now = Date.now) {
    this.file = path.join(directory, 'calendar-reminder-receipts.json'); this.now = now;
    this.records = new Map(); this.error = null;
    try {
      if (!fs.existsSync(this.file)) return;
      if (fs.statSync(this.file).size > 1024 * 1024) throw new Error('oversize');
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (data.schemaVersion !== 1 || !Array.isArray(data.receipts) || data.receipts.length > 5000) throw new Error('schema');
      for (const r of data.receipts) {
        if (!r || !/^[a-f0-9]{64}$/.test(r.key) || !Number.isFinite(r.expiresAt)) throw new Error('receipt');
        if (r.expiresAt > now()) this.records.set(r.key, r.expiresAt);
      }
    } catch { this.error = '提醒去重文件损坏或版本不支持，已保留原文件；提醒暂停。请检查 calendar-reminder-receipts.json。'; }
  }
  has(key) { return this.records.has(key) && this.records.get(key) > this.now(); }
  consume(key) {
    if (this.error) return false;
    const next = new Map([...this.records].filter(([, expiry]) => expiry > this.now()));
    if (this.has(key)) return false;
    if (next.size >= 5000) { this.error = '提醒去重记录达到安全上限，提醒暂停。'; return false; }
    next.set(key, this.now() + RETENTION_MS);
    const temporary = `${this.file}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try {
        fs.writeFileSync(fd, JSON.stringify({ schemaVersion: 1,
          receipts: [...next].map(([key, expiresAt]) => ({ key, expiresAt })) }));
        fs.fsyncSync(fd);
      } finally { fs.closeSync(fd); }
      fs.renameSync(temporary, this.file); this.records = next; return true;
    } catch {
      this.error = '无法保存提醒去重记录，提醒暂停以避免重复。'; return false;
    } finally { try { fs.unlinkSync(temporary); } catch {} }
  }
}
class CalendarReminderScheduler {
  constructor({ ledger, deliver, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, onError = () => {} }) {
    Object.assign(this, { ledger, deliver, now, setTimer, clearTimer, onError });
    this.timer = null; this.pending = []; this.closed = false; this.generation = 0;
  }
  cancel() { this.generation++; this.clearTimer(this.timer); this.timer = null; this.pending = []; }
  update(snapshot, minutes) {
    const scheduled = new Set(this.pending.map(r => r.key));
    this.cancel();
    if (this.closed || snapshot.authorization !== 'authorized' || snapshot.error || this.ledger.error) {
      if (this.ledger.error) this.onError(this.ledger.error); return;
    }
    const selected = new Set(snapshot.selectedCalendarIds || []), unique = new Map();
    for (const event of snapshot.events || []) {
      const r = reminderFor(event, minutes);
      // No catch-up, including after restart, clock change and sleep.
      if (r && selected.has(event.calendar.id) && (r.due > this.now() || (scheduled.has(r.key) && this.now() - r.due <= 2000)) && r.end > this.now() && !this.ledger.has(r.key)) unique.set(r.key, r);
    }
    this.pending = [...unique.values()].sort((a,b) => a.due - b.due || a.key.localeCompare(b.key));
    this.arm();
  }
  arm() {
    if (!this.pending.length || this.closed) return;
    const generation = this.generation;
    this.timer = this.setTimer(() => {
      this.timer = null;
      if (generation !== this.generation || this.closed) return;
      const now = this.now(), due = [];
      while (this.pending.length && this.pending[0].due <= now) {
        const r = this.pending.shift();
        // Allow normal timer jitter only; never replay a long suspension/time jump.
        if (now - r.due <= 2000 && now < r.start && now < r.end && !this.ledger.has(r.key)) {
          // Persist before presentation: a crash cannot cause the same reminder to replay.
          if (this.ledger.consume(r.key)) due.push(r);
          else if (this.ledger.error) { this.onError(this.ledger.error); this.cancel(); return; }
        }
      }
      if (due.length) Promise.resolve(this.deliver(due)).catch(() => this.onError('提醒展示失败。')); 
      this.arm();
    }, Math.max(1, Math.min(MAX_TIMER_MS, this.pending[0].due - this.now())));
  }
  close() { this.closed = true; this.cancel(); }
}
module.exports = { reminderFor, ReminderLedger, CalendarReminderScheduler, MAX_TIMER_MS };
