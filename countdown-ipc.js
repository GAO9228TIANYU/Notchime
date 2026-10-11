const { isPanelSender } = require('./main-services');
// Limited CRUD IPC. No filenames, paths, snapshots or arbitrary file access.
function registerCountdownIPC(ipcMain, { getWindow, getStore }) {
  const actions = {
    'countdowns:list': store => store.list(),
    'countdowns:create': (store, input) => store.create(input),
    'countdowns:update': (store, payload) => store.update(payload?.id, payload?.input),
    'countdowns:delete': (store, id) => store.remove(id),
    'countdowns:pin': (store, payload) => store.pin(payload?.id, payload?.pinned),
  };
  for (const [channel, action] of Object.entries(actions)) {
    ipcMain.handle(channel, async (event, payload) => {
      const owner = getWindow();
      if (!isPanelSender(event, owner)) {
        return { ok: false, error: 'forbidden', message: '倒计时接口只允许当前主页面访问。' };
      }
      const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
      const inputKeys = ['title', 'targetDate', 'targetTime', 'color', 'pinned'];
      if ((channel === 'countdowns:list' && payload !== undefined) ||
        (channel === 'countdowns:create' && !exactKeys(payload, inputKeys)) ||
        (channel === 'countdowns:update' && (!exactKeys(payload, ['id', 'input']) || !exactKeys(payload.input, inputKeys))) ||
        (channel === 'countdowns:pin' && !exactKeys(payload, ['id', 'pinned']))) {
        return { ok: false, error: 'invalid', message: '无效的倒计时请求。' };
      }
      try {
        const items = await action(getStore(), payload);
        if (channel !== 'countdowns:list' && !owner.isDestroyed()) owner.webContents.send('countdowns:changed', items);
        return { ok: true, items };
      } catch (error) {
        return { ok: false, error: error.code || 'storage_failed', field: error.field,
          message: error.code ? error.message : '倒计时存储失败，请重试。' };
      }
    });
  }
}
module.exports = { registerCountdownIPC };
