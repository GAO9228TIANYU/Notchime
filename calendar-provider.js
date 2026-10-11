const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { dateOnly } = require('./renderer/reminders-model');
const { CalendarBridge, helperPath } = require('./calendar-bridge');
const AUTHORIZATION = ['authorized', 'notDetermined', 'denied', 'restricted', 'writeOnly', 'unknown'];
function protocolError() { return Object.assign(new Error('日历组件响应无效，请重新加载。'), { code: 'protocol_error' }); }
function text(value, limit = 10000) {
  if (typeof value !== 'string' || value.length > limit) throw protocolError();
  return value;
}
function identifier(value) {
  if (!text(value, 512).length || /[\x00-\x1f\x7f]/.test(value)) throw protocolError();
  return value;
}
function authorization(data) {
  if (!data || !AUTHORIZATION.includes(data.authorization)) throw protocolError();
  return data.authorization;
}
function calendar(data, includeSource = false) {
  if (!data || !/^#[0-9a-f]{6}$/i.test(data.color)) throw protocolError();
  const result = { id: identifier(data.id), name: text(data.name), color: data.color };
  if (includeSource && data.source) {
    result.source = { id: identifier(data.source.id), name: text(data.source.name) };
    if (data.source.type !== undefined) {
      if (!Number.isInteger(data.source.type)) throw protocolError();
      result.source.type = data.source.type;
    }
  }
  return result;
}
function timestamp(value) {
  text(value, 64);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !dateOnly(value.slice(0, 10)) || !Number.isFinite(Date.parse(value))) throw protocolError();
  return value;
}
function validateCalendarSnapshot(data) {
  const state = authorization(data);
  // Never forward unknown fields or sensitive data when access is unavailable.
  if (state !== 'authorized') return { authorization: state, calendars: [], events: [] };
  if (!Array.isArray(data.calendars) || data.calendars.length > 1000 || !Array.isArray(data.events) || data.events.length > 20000) throw protocolError();
  const calendars = data.calendars.map(value => calendar(value, true));
  if (new Set(calendars.map(value => value.id)).size !== calendars.length) throw protocolError();
  const events = data.events.map(value => {
    if (!value || typeof value.allDay !== 'boolean') throw protocolError();
    const result = { id: identifier(value.id), title: text(value.title), start: timestamp(value.start), end: timestamp(value.end),
      allDay: value.allDay, calendar: calendar(value.calendar) };
    if (Date.parse(result.end) < Date.parse(result.start)) throw protocolError();
    for (const name of ['startDate', 'endDate']) {
      if (value[name] !== undefined) {
        if (!dateOnly(value[name])) throw protocolError();
        result[name] = value[name];
      } else if (result.allDay) throw protocolError();
    }
    for (const name of ['eventIdentifier', 'externalIdentifier', 'timeZone']) if (value[name] !== undefined) result[name] = text(value[name]);
    if (value.occurrenceStart !== undefined) result.occurrenceStart = timestamp(value.occurrenceStart);
    if (!calendars.some(item => item.id === result.calendar.id)) throw protocolError();
    return result;
  });
  if (new Set(events.map(value => value.id)).size !== events.length) throw protocolError();
  return { authorization: state, calendars, events, ...(data.timeZone !== undefined ? { timeZone: text(data.timeZone, 256) } : {}) };
}
function queryRange(now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 8);
  return { start: start.toISOString().replace('.000Z', 'Z'), end: end.toISOString().replace('.000Z', 'Z') };
}
function validateSelection(ids) {
  if (!Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== 'string' || !id.length || id.length > 512 || /[\x00-\x1f\x7f]/.test(id)) || new Set(ids).size !== ids.length) {
    throw Object.assign(new Error('无效的日历选择。'), { code: 'invalid' });
  }
  return [...ids];
}
class CalendarProvider extends EventEmitter {
  constructor({ app, bridge = new CalendarBridge(helperPath(app)), now = () => new Date(), debounceMs = 400 }) {
    super(); this.bridge = bridge; this.now = now; this.debounceMs = debounceMs;
    this.file = path.join(app.getPath('userData'), 'calendar-preferences.json');
    this.selection = null; this.selectionError = null; this.snapshot = { authorization: 'loading', calendars: [], events: [], selectedCalendarIds: [], error: null };
    this.queue = Promise.resolve(); this.refreshTimer = null; this.midnightTimer = null; this.retryTimer = null;
    this.closed = false; this.retries = 0; this.refreshing = null;
    try {
      if (fs.existsSync(this.file)) {
        if (fs.statSync(this.file).size > 1024 * 1024) throw new Error('日历设置文件过大');
        const stored = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        if (stored.schemaVersion !== 1) throw new Error('不支持的日历设置版本');
        this.selection = stored.selectedCalendarIds === null ? null : validateSelection(stored.selectedCalendarIds);
      }
    } catch { this.selection = []; this.selectionError = '日历选择文件损坏或版本不支持；已保留原文件，请检查 calendar-preferences.json。'; }
    bridge.on('changed', () => { this.emit('invalidate'); if (this.refreshing) this.refreshAgain = true; this.scheduleRefresh(); });
    bridge.on('unavailable', () => {
      this.emit('invalidate');
      if (!this.closed) this.publish({ authorization: 'error', calendars: [], events: [], selectedCalendarIds: [], error: '日历连接中断，正在恢复。' });
      if (!this.closed && this.retries < 3) {
        clearTimeout(this.retryTimer);
        this.retryTimer = setTimeout(() => { this.retries++; this.refresh(); }, 1000 * 2 ** this.retries);
      }
    });
    bridge.on('diagnostic', () => console.warn('Calendar Helper: native diagnostic received (content omitted for privacy).'));
  }
  publish(snapshot) { this.snapshot = snapshot; this.emit('snapshot', snapshot); return snapshot; }
  enqueue(action) { const result = this.queue.then(action); this.queue = result.catch(() => {}); return result; }
  refresh() {
    if (this.closed) return Promise.resolve(this.snapshot);
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.enqueue(async () => {
      try {
        const status = await this.bridge.request('status');
        const state = authorization(status);
        if (state !== 'authorized') return this.publish({ authorization: state, calendars: [], events: [], selectedCalendarIds: [], error: this.selectionError });
        const range = queryRange(this.now());
        // First bounded query obtains calendar metadata without reading any events.
        const metadata = validateCalendarSnapshot(await this.bridge.request('snapshot', { ...range, calendarIds: [] }));
        if (metadata.authorization !== 'authorized') return this.publish({ ...metadata, selectedCalendarIds: [], error: this.selectionError });
        const ids = this.selection === null ? metadata.calendars.map(calendar => calendar.id)
          : this.selection.filter(id => metadata.calendars.some(calendar => calendar.id === id));
        const data = ids.length ? validateCalendarSnapshot(await this.bridge.request('snapshot', { ...range, calendarIds: ids })) : metadata;
        if (data.authorization !== 'authorized') return this.publish({ ...data, selectedCalendarIds: [], error: this.selectionError });
        data.events = data.events.filter(event => ids.includes(event.calendar.id));
        this.retries = 0;
        return this.publish({ ...data, events: data.events || [], calendars: data.calendars || [],
          selectedCalendarIds: ids, error: this.selectionError, range, loadedAt: this.now().toISOString() });
      } catch (error) {
        // Clear stale events on any failure, including revoked permission; never substitute fixtures.
        return this.publish({ authorization: 'error', calendars: [], events: [], selectedCalendarIds: [],
          error: '日历读取失败，请重新加载。', errorCode: /^[a-z_]{1,64}$/.test(error.code) ? error.code : 'calendar_failed' });
      } finally { this.armMidnight(); }
    }).finally(() => { this.refreshing = null; if (this.refreshAgain) { this.refreshAgain = false; this.scheduleRefresh(); } });
    return this.refreshing;
  }
  scheduleRefresh() {
    if (this.closed) return;
    if (this.refreshing) this.refreshAgain = true;
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => { this.refreshTimer = null; this.refresh(); }, this.debounceMs);
  }
  armMidnight() {
    clearTimeout(this.midnightTimer); if (this.closed) return;
    const now = this.now(), next = new Date(now); next.setHours(24, 0, 0, 100);
    this.midnightTimer = setTimeout(() => this.scheduleRefresh(), Math.max(1000, next - now));
  }
  async requestAccess() {
    return this.enqueue(async () => {
      try { await this.bridge.request('requestAccess', {}, 120000); }
      catch { this.publish({ authorization: 'error', calendars: [], events: [], selectedCalendarIds: [], error: '日历授权失败，请重新加载。' }); }
    }).then(() => this.refresh());
  }
  async select(ids) {
    ids = validateSelection(ids);
    await this.enqueue(async () => {
      if (this.selectionError) throw Object.assign(new Error(this.selectionError), { code: 'preferences_corrupt' });
      if (ids.some(id => !this.snapshot.calendars.some(calendar => calendar.id === id))) throw Object.assign(new Error('所选日历已不可用，请重新加载。'), { code: 'invalid' });
      const raw = JSON.stringify({ schemaVersion: 1, selectedCalendarIds: ids }, null, 2) + '\n';
      if (Buffer.byteLength(raw) > 1024 * 1024) throw Object.assign(new Error('日历选择过大，未保存。'), { code: 'invalid' });
      const temporary = `${this.file}.${randomUUID()}.tmp`;
      try {
        await fs.promises.mkdir(path.dirname(this.file), { recursive: true });
        await fs.promises.writeFile(temporary, raw, { mode: 0o600, flag: 'wx' });
        await fs.promises.rename(temporary, this.file); this.emit('invalidate'); this.selection = ids;
      } finally { await fs.promises.unlink(temporary).catch(() => {}); }
    });
    return this.refresh();
  }
  close() { this.closed = true; for (const timer of [this.refreshTimer, this.midnightTimer, this.retryTimer]) clearTimeout(timer); this.bridge.close(); this.removeAllListeners(); }
}
module.exports = { CalendarProvider, queryRange, validateSelection, validateCalendarSnapshot };
