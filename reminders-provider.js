const { EventEmitter } = require('node:events');
const { validId, visibleItems, validateSnapshot, STATES } = require('./renderer/reminders-model');
function failure(code, message) { return Object.assign(new Error(message), { code }); }
class RemindersProvider extends EventEmitter {
  constructor({ bridge, now = () => new Date(), debounceMs = 400 }) {
    super(); this.bridge = bridge; this.now = now; this.debounceMs = debounceMs;
    this.snapshot = { authorization: 'loading', items: [], error: null };
    this.revisions = new Map(); this.completing = new Map(); this.queue = Promise.resolve(); this.generation = 0; this.retries = 0;
    this.changed = () => { this.revisions.clear(); this.generation++; this.scheduleRefresh(); };
    this.unavailable = () => {
      this.revisions.clear(); this.generation++;
      if (!this.closed) { this.publish({ authorization: 'error', items: [], error: '提醒事项连接中断，正在恢复。' }); if (this.retries < 3) this.scheduleRefresh(1000 * 2 ** this.retries++); }
    };
    bridge.on('changed', this.changed); bridge.on('unavailable', this.unavailable);
  }
  publish(snapshot) { if (!this.closed) { this.snapshot = snapshot; this.emit('snapshot', snapshot); } return this.snapshot; }
  enqueue(action) { const result = this.queue.then(action); this.queue = result.catch(() => {}); return result; }
  refresh() {
    if (this.closed) return Promise.resolve(this.snapshot);
    if (this.refreshing) { this.refreshAgain = true; return this.refreshing; }
    this.refreshing = this.enqueue(async () => {
      const generation = this.generation;
      try {
        const status = await this.bridge.request('remindersStatus');
        if (!STATES.includes(status.authorization)) throw failure('protocol_error', '无效的授权响应。');
        if (status.authorization !== 'authorized') { this.revisions.clear(); return this.publish({ authorization: status.authorization, items: [], error: null }); }
        const data = validateSnapshot(await this.bridge.request('remindersSnapshot'));
        if (generation !== this.generation || this.closed) { this.refreshAgain = true; return this.snapshot; }
        this.retries = 0;
        const items = visibleItems(data.items, this.now());
        this.revisions = new Map(items.map(item => [item.id, item.revision]));
        // Explicit projection: native revision/extra fields never reach Renderer.
        return this.publish({ authorization: data.authorization, error: data.authorization === 'error' ? '无法读取提醒事项，请重新加载。' : null,
          items: items.map(({id,title,dueDate,isAllDay,isOverdue,listName,listColor,isCompleted,canComplete,completionBlockedReason}) =>
            ({id,title,dueDate,isAllDay,isOverdue,listName,listColor,isCompleted,canComplete,completionBlockedReason})), loadedAt: this.now().toISOString() });
      } catch { this.revisions.clear(); return this.publish({ authorization: 'error', items: [], error: '无法读取提醒事项，请重新加载。' }); }
      finally { this.armMidnight(); }
    }).finally(() => { this.refreshing = null; if (this.refreshAgain && !this.closed) { this.refreshAgain = false; this.scheduleRefresh(); } });
    return this.refreshing;
  }
  scheduleRefresh(delay = this.debounceMs) {
    if (this.closed) return;
    if (this.refreshing) this.refreshAgain = true;
    clearTimeout(this.refreshTimer); this.refreshTimer = setTimeout(() => { this.refreshTimer = null; void this.refresh(); }, delay);
  }
  armMidnight() {
    clearTimeout(this.midnightTimer); if (this.closed) return;
    const now = this.now(), next = new Date(now); next.setHours(24,0,0,100);
    this.midnightTimer = setTimeout(() => this.scheduleRefresh(), Math.max(1000, next-now));
  }
  requestAccess() {
    return this.enqueue(async () => { await this.bridge.request('requestRemindersAccess', {}, 120000); }).then(() => this.refresh());
  }
  complete(id) {
    if (!validId(id)) return Promise.reject(failure('invalid', '无效的待办标识。'));
    if (this.completing.has(id)) return this.completing.get(id);
    const item = this.snapshot.items.find(item => item.id === id), revision = this.revisions.get(id);
    if (this.snapshot.authorization !== 'authorized' || !item || !revision) {
      this.scheduleRefresh(); return Promise.reject(failure('stale_reminder', '待办已变化或不可用，请刷新后重试。'));
    }
    if (!item.canComplete) return Promise.reject(failure('completion_not_supported', item.completionBlockedReason));
    const result = this.enqueue(async () => {
      if (this.closed || this.revisions.get(id) !== revision) throw failure('stale_reminder', '待办已变化，请刷新后重试。');
      const data = await this.bridge.request('completeReminder', { id, revision });
      if (data.completed !== true || Object.keys(data).length !== 1) throw failure('protocol_error', '完成操作未确认。');
      this.revisions.delete(id);
    }).then(() => this.refresh()).catch(async error => {
      await this.refresh();
      const messages = { stale_reminder: '待办已在其他设备变化、完成或删除，请刷新后重试。', completion_not_supported: '请在 Apple Reminders 中完成此事项。', helper_timeout: '保存确认超时，请检查 Apple Reminders 后重新加载。' };
      throw failure(error.code || 'save_failed', messages[error.code] || '未能确认完成状态，请重新加载后重试。');
    }).finally(() => this.completing.delete(id));
    this.completing.set(id, result); return result;
  }
  close() {
    this.closed = true; clearTimeout(this.refreshTimer); clearTimeout(this.midnightTimer);
    this.bridge.removeListener('changed', this.changed); this.bridge.removeListener('unavailable', this.unavailable);
    this.revisions.clear(); this.snapshot = { authorization: 'loading', items: [], error: null }; this.removeAllListeners();
  }
}
module.exports = { RemindersProvider };
