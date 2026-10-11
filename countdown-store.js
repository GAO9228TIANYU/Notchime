const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { validateInput, sortCountdowns } = require('./renderer/countdown-model');
const SCHEMA_VERSION = 1;
const MAX_ITEMS = 2000;
const MAX_BYTES = 2 * 1024 * 1024;
class CountdownError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function validId(id) { return typeof id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(id); }
function decodeStore(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { throw new CountdownError('invalid_json', 'countdowns.json 不是有效 JSON，原文件已保留。'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new CountdownError('invalid_store', '倒计时文件结构损坏，原文件已保留。');
  if (data.schemaVersion !== SCHEMA_VERSION) throw new CountdownError('unsupported_schema', `不支持倒计时数据版本 ${String(data.schemaVersion)}，原文件已保留。`);
  if (!Array.isArray(data.items) || data.items.length > MAX_ITEMS) throw new CountdownError('invalid_store', '倒计时列表损坏或超出限制，原文件已保留。');
  const ids = new Set();
  for (const item of data.items) {
    const checked = validateInput(item, { checkLocalTime: false });
    if (!checked.ok || checked.value.color !== item.color || checked.value.title !== item.title || !validId(item.id) || ids.has(item.id) || typeof item.pinned !== 'boolean'
      || !Number.isSafeInteger(item.createdAt) || item.createdAt < 0
      || !Number.isSafeInteger(item.updatedAt) || item.updatedAt < item.createdAt) {
      throw new CountdownError('invalid_store', '倒计时记录损坏，原文件已保留。');
    }
    ids.add(item.id);
  }
  return data;
}
class CountdownStore {
  constructor(userData, { io = fs, now = Date.now, id = randomUUID } = {}) {
    this.filePath = path.join(userData, 'countdowns.json');
    this.io = io; this.now = now; this.id = id; this.queue = Promise.resolve();
  }
  serial(action) {
    const operation = this.queue.then(action);
    this.queue = operation.catch(() => {}); // One failure must not poison retries.
    return operation;
  }
  async read() {
    try {
      const stat = await this.io.stat(this.filePath);
      if (stat.size > MAX_BYTES) throw new CountdownError('file_too_large', '倒计时文件超过 2 MB，原文件已保留。');
      return decodeStore(await this.io.readFile(this.filePath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return { schemaVersion: SCHEMA_VERSION, items: [] };
      if (error instanceof CountdownError) throw error;
      throw new CountdownError('read_failed', `无法读取 countdowns.json（${error.code || 'unknown'}），未覆盖原文件。`);
    }
  }
  async write(data) {
    const raw = JSON.stringify(data, null, 2) + '\n';
    if (Buffer.byteLength(raw) > MAX_BYTES) throw new CountdownError('file_too_large', '倒计时数据超过 2 MB，未保存。');
    const temporary = path.join(path.dirname(this.filePath), `.countdowns.${process.pid}.${randomUUID()}.tmp`);
    let handle;
    try {
      await this.io.mkdir(path.dirname(this.filePath), { recursive: true });
      handle = await this.io.open(temporary, 'wx', 0o600);
      await handle.writeFile(raw, 'utf8'); await handle.sync(); await handle.close(); handle = null;
      await this.io.rename(temporary, this.filePath);
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      await this.io.unlink(temporary).catch(() => {});
      throw new CountdownError('write_failed', `倒计时保存失败（${error.code || 'unknown'}），请重试。`);
    }
  }
  list() { return this.serial(async () => sortCountdowns((await this.read()).items)); }
  create(input) {
    return this.serial(async () => {
      const checked = validateInput(input); if (!checked.ok) throw Object.assign(new CountdownError(checked.error, checked.message), { field: checked.field });
      const data = await this.read();
      if (data.items.length >= MAX_ITEMS) throw new CountdownError('limit_reached', '最多保存 2000 项倒计时。');
      const id = this.id();
      if (!validId(id) || data.items.some(item => item.id === id)) throw new CountdownError('invalid_id', '无法生成唯一倒计时标识，请重试。');
      const time = this.now();
      data.items.push({ id, ...checked.value, createdAt: time, updatedAt: time });
      await this.write(data); return sortCountdowns(data.items);
    });
  }
  update(id, input) {
    return this.serial(async () => {
      const checked = validateInput(input); if (!checked.ok) throw Object.assign(new CountdownError(checked.error, checked.message), { field: checked.field });
      const data = await this.read(), item = this.find(data, id);
      Object.assign(item, checked.value, { updatedAt: Math.max(this.now(), item.updatedAt) });
      await this.write(data); return sortCountdowns(data.items);
    });
  }
  find(data, id) {
    if (!validId(id)) throw new CountdownError('invalid_id', '倒计时标识无效。');
    const item = data.items.find(row => row.id === id);
    if (!item) throw new CountdownError('not_found', '该倒计时已不存在，请刷新列表。');
    return item;
  }
  remove(id) {
    return this.serial(async () => {
      const data = await this.read(); this.find(data, id);
      data.items = data.items.filter(item => item.id !== id);
      await this.write(data); return sortCountdowns(data.items);
    });
  }
  pin(id, pinned) {
    return this.serial(async () => {
      if (typeof pinned !== 'boolean') throw new CountdownError('invalid_input', '置顶状态无效。');
      const data = await this.read(), item = this.find(data, id);
      item.pinned = pinned; item.updatedAt = Math.max(this.now(), item.updatedAt);
      await this.write(data); return sortCountdowns(data.items);
    });
  }
}
module.exports = { CountdownStore, CountdownError, decodeStore, SCHEMA_VERSION };
