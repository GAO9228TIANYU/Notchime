const { isPanelSender } = require('./main-services');
function registerCalendarIPC(ipcMain, { getWindow, getProvider, requestAccess, openSettings }) {
  const actions = {
    'calendar:refresh': provider => provider.refresh(),
    'calendar:request-access': () => requestAccess(),
    'calendar:select': (provider, ids) => provider.select(ids),
    'calendar:open-settings': () => openSettings(),
  };
  for (const [channel, action] of Object.entries(actions)) ipcMain.handle(channel, async (event, payload) => {
    const owner = getWindow();
    if (!isPanelSender(event, owner)) return { ok: false, error: 'forbidden', message: '仅允许当前主页面访问日历。' };
    if (channel !== 'calendar:select' && payload !== undefined) return { ok: false, error: 'invalid', message: '此接口不接受参数。' };
    try { return { ok: true, snapshot: await action(getProvider(), payload) }; }
    catch (error) { return { ok: false, error: error.code || 'calendar_failed', message: error.message }; }
  });
}
module.exports = { registerCalendarIPC };
