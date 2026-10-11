const { isPanelSender } = require('./main-services');
const { validId } = require('./renderer/reminders-model');
function registerRemindersIPC(ipcMain, { getWindow, getProvider, requestAccess, openSettings }) {
  const actions = {
    'reminders:refresh': provider => provider.refresh(),
    'reminders:request-access': () => requestAccess(),
    'reminders:complete': (provider, id) => provider.complete(id),
    'reminders:open-settings': () => openSettings(),
  };
  for (const [channel, action] of Object.entries(actions)) ipcMain.handle(channel, async (event, payload) => {
    const owner = getWindow();
    if (!isPanelSender(event, owner)) return { ok: false, error: 'forbidden', message: '仅允许当前主页面访问提醒事项。' };
    if (channel === 'reminders:complete' ? !validId(payload) : payload !== undefined) return { ok: false, error: 'invalid', message: '无效的提醒事项请求。' };
    try { return { ok: true, snapshot: await action(getProvider(), payload) }; }
    catch (error) { return { ok: false, error: error.code || 'reminders_failed', message: error.message }; }
  });
}
module.exports = { registerRemindersIPC };
