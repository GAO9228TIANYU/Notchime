const { EventEmitter } = require('node:events');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const MAX_LINE = 16 * 1024 * 1024;
const MAX_REQUEST = 1024 * 1024;
const MAX_PENDING = 64;
function helperPath(app) {
  const resources = app.isPackaged ? process.resourcesPath : path.join(__dirname, '.cache');
  return path.join(resources, 'native/CalendarNotchCalendarHelper.app/Contents/MacOS/calendar-helper');
}
class CalendarBridge extends EventEmitter {
  constructor(executable, { spawnProcess = spawn, timeoutMs = 15000 } = {}) {
    super(); this.executable = executable; this.spawnProcess = spawnProcess;
    this.timeoutMs = timeoutMs; this.pending = new Map(); this.child = null; this.closed = false;
  }
  start() {
    if (this.closed) throw Object.assign(new Error('Calendar Helper 已关闭。'), { code: 'closed' });
    if (this.child) return;
    const child = this.spawnProcess(this.executable, [], { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    this.child = child; let buffer = ''; let failed = false;
    const fail = (error) => {
      if (failed) return; failed = true;
      if (this.child === child) this.child = null;
      for (const [id, request] of this.pending) {
        clearTimeout(request.timer); request.reject(error); this.pending.delete(id);
      }
      child.kill(); if (!this.closed) this.emit('unavailable', error);
    };
    child.on('error', () => fail(Object.assign(new Error('无法启动日历组件，请重新加载。'), { code: 'helper_unavailable' })));
    child.on('exit', () => fail(Object.assign(new Error('日历组件已退出，请重新加载。'), { code: 'helper_exited' })));
    child.stdin.on('error', () => fail(Object.assign(new Error('日历通信中断。'), { code: 'helper_pipe' })));
    child.stderr.on('data', () => this.emit('diagnostic', 'Native diagnostic received (content omitted).'));
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      buffer += chunk;
      if (Buffer.byteLength(buffer) > MAX_LINE) { fail(Object.assign(new Error('日历响应过大。'), { code: 'protocol_error' })); return; }
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
        let message;
        try { message = JSON.parse(line); } catch { fail(Object.assign(new Error('日历组件返回无效 JSON。'), { code: 'protocol_error' })); return; }
        if (!message || typeof message !== 'object' || Array.isArray(message)) { fail(Object.assign(new Error('日历协议消息必须是对象。'), { code: 'protocol_error' })); return; }
        if (message.type === 'changed') { this.emit('changed'); continue; }
        const request = this.pending.get(message.requestId);
        if (!request) continue; // Late or unknown responses cannot resolve another request.
        if (typeof message.ok !== 'boolean' || (message.ok === false && (typeof message.error !== 'string' || !/^[a-z_]{1,64}$/.test(message.error) || (message.message !== undefined && (typeof message.message !== 'string' || message.message.length > 2048))))) {
          fail(Object.assign(new Error('日历组件返回无效响应。'), { code: 'protocol_error' })); return;
        }
        this.pending.delete(message.requestId); clearTimeout(request.timer);
        if (message.ok === true && message.data && typeof message.data === 'object' && !Array.isArray(message.data)) request.resolve(message.data);
        else request.reject(Object.assign(new Error('系统日历或提醒事项操作失败，请重新加载。'), { code: message.error || 'helper_failed' }));
      }
    });
    this.failChild = fail;
  }
  request(action, payload = {}, timeoutMs = this.timeoutMs) {
    if (!['status', 'snapshot', 'requestAccess', 'remindersStatus', 'requestRemindersAccess', 'remindersSnapshot', 'completeReminder'].includes(action)) return Promise.reject(Object.assign(new Error('无效的日历操作。'), { code: 'invalid' }));
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return Promise.reject(Object.assign(new Error('无效的请求参数。'), { code: 'invalid' }));
    if (action === 'completeReminder' && (!payload || Object.keys(payload).sort().join(',') !== 'id,revision' || typeof payload.id !== 'string' || !payload.id.length || payload.id.length > 512 || /[\x00-\x1f]/.test(payload.id) || !/^[a-f0-9]{64}$/.test(payload.revision))) return Promise.reject(Object.assign(new Error('无效的完成请求。'), { code: 'invalid' }));
    if (['remindersStatus', 'requestRemindersAccess', 'remindersSnapshot'].includes(action) && Object.keys(payload).length) return Promise.reject(Object.assign(new Error('提醒事项查询不接受参数。'), { code: 'invalid' }));
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) return Promise.reject(Object.assign(new Error('无效的请求超时。'), { code: 'invalid' }));
    if (this.pending.size >= MAX_PENDING) return Promise.reject(Object.assign(new Error('系统日历组件繁忙，请稍后重试。'), { code: 'busy' }));
    const requestId = randomUUID();
    let line;
    try { line = JSON.stringify({ ...payload, requestId, action }) + '\n'; }
    catch { return Promise.reject(Object.assign(new Error('无效的请求参数。'), { code: 'invalid' })); }
    if (Buffer.byteLength(line) > MAX_REQUEST) return Promise.reject(Object.assign(new Error('请求过大。'), { code: 'invalid' }));
    try { this.start(); } catch (error) { return Promise.reject(error); }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.failChild(Object.assign(new Error('日历组件响应超时，请重新加载。'), { code: 'helper_timeout' }));
      }, timeoutMs);
      this.pending.set(requestId, { resolve, reject, timer });
      try { this.child.stdin.write(line); }
      catch { this.failChild(Object.assign(new Error('日历通信中断。'), { code: 'helper_pipe' })); }
    });
  }
  close() {
    this.closed = true;
    if (this.child) this.failChild(Object.assign(new Error('日历组件已关闭。'), { code: 'closed' }));
    this.removeAllListeners();
  }
}
module.exports = { CalendarBridge, helperPath, MAX_LINE, MAX_REQUEST, MAX_PENDING };
