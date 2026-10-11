const { contextBridge, ipcRenderer } = require('electron');
function subscribe(channel, callback) {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}
// Only active Calendar Notch window, settings and countdown interfaces.
contextBridge.exposeInMainWorld('notchAPI', {
  refreshReminders: () => ipcRenderer.invoke('reminders:refresh'),
  requestRemindersAccess: () => ipcRenderer.invoke('reminders:request-access'),
  completeReminder: (id) => ipcRenderer.invoke('reminders:complete', id),
  openRemindersSettings: () => ipcRenderer.invoke('reminders:open-settings'),
  onRemindersChanged: (cb) => subscribe('reminders:changed', cb),
  refreshCalendar: () => ipcRenderer.invoke('calendar:refresh'),
  requestCalendarAccess: () => ipcRenderer.invoke('calendar:request-access'),
  selectCalendars: (ids) => ipcRenderer.invoke('calendar:select', ids),
  openCalendarSettings: () => ipcRenderer.invoke('calendar:open-settings'),
  onCalendarChanged: (cb) => subscribe('calendar:changed', cb),
  listCountdowns: () => ipcRenderer.invoke('countdowns:list'),
  createCountdown: (input) => ipcRenderer.invoke('countdowns:create', input),
  updateCountdown: (id, input) => ipcRenderer.invoke('countdowns:update', { id, input }),
  deleteCountdown: (id) => ipcRenderer.invoke('countdowns:delete', id),
  pinCountdown: (id, pinned) => ipcRenderer.invoke('countdowns:pin', { id, pinned }),
  onCountdownsChanged: (cb) => subscribe('countdowns:changed', cb),
  onCountdownClockRefresh: (cb) => subscribe('countdowns:refresh-time', cb),
  reportPanelState: (state) => ipcRenderer.invoke('window:report-state', state),
  rendererReady: () => ipcRenderer.invoke('window:renderer-ready'),
  setReminderMinutes: (minutes) => ipcRenderer.invoke('settings:set-reminder-minutes', minutes),
  setMode: (mode) => ipcRenderer.invoke('window:set-mode', mode),
  beginCollapse: () => ipcRenderer.invoke('window:begin-collapse'),
  setTab: (tab) => ipcRenderer.invoke('window:set-tab', tab),
  onEscape: (cb) => subscribe('key:escape', cb),
  onToggleShortcut: (cb) => subscribe('shortcut:toggle-panel', cb),
  onCollapseRequest: (cb) => subscribe('window:request-collapse', cb),
  onExpandRequest: (cb) => subscribe('window:request-expand', cb),
  getMetrics: () => ipcRenderer.invoke('window:metrics'),
  onMetricsChanged: (cb) => subscribe('window:metrics-changed', cb),
  getAppSettings: () => ipcRenderer.invoke('settings:get'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('settings:set-auto-launch', enabled),
  setAutoCollapseSeconds: (seconds) => ipcRenderer.invoke('settings:set-auto-collapse-seconds', seconds),
  onAppSettingsChanged: (cb) => subscribe('settings:changed', cb),
  showAbout: () => ipcRenderer.invoke('app:about'),
});
