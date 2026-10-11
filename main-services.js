// Shared window safety and interaction policy, without Electron imports.
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const PANEL_URL = pathToFileURL(path.join(__dirname, 'renderer/index.html')).href;
function isPanelSender(event, owner) {
  return Boolean(owner && !owner.isDestroyed() && event?.sender === owner.webContents &&
    event.senderFrame === owner.webContents.mainFrame && event.senderFrame?.url === PANEL_URL);
}
function installLocalSessionGuards(session) {
  // EventKit/TCC lives in the native Helper, not Chromium permissions/networking.
  // Local file resources remain available; only network protocols are blocked.
  session.setPermissionCheckHandler(() => false);
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] },
    (_details, callback) => callback({ cancel: true }));
}
function installLocalWebContentsGuards(webContents) {
  if (!webContents
    || typeof webContents.setWindowOpenHandler !== 'function'
    || typeof webContents.on !== 'function') return false;
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  webContents.on('will-navigate', (event, url = event.url) => {
    // Recovery reloads this same trusted local document. Never allow a different
    // file, query string, external origin or a reload of a non-local document.
    const current = webContents.getURL?.();
    if (typeof current === 'string' && current.startsWith('file:') && url === current) return;
    event.preventDefault();
  });
  webContents.on('will-redirect', event => event.preventDefault());
  webContents.on('will-frame-navigate', (event, details = event) => {
    if (details.isMainFrame && details.url === webContents.getURL?.() && details.url.startsWith('file:')) return;
    event.preventDefault();
  });
  webContents.on('will-attach-webview', event => event.preventDefault());
  return true;
}

function hoverSpacePollingPolicy({ shortcut, visible, mode } = {}) {
  return {
    enabled: shortcut === 'Space' && visible === true && mode === 'collapsed',
    intervalMs: 60,
  };
}

// Retained from the old reminder scheduler as a generic timer safety utility.
// This does not create a timer or schedule/dispatch any notification.
function notificationTimerDelay(delayMs) {
  const normalizedDelay = Number(delayMs);
  if (!Number.isFinite(normalizedDelay)) return 250;
  // Node coerces larger delays to 1 ms: a future scheduler must checkpoint and
  // recalculate rather than treating this capped delay as the target deadline.
  return Math.min((2 ** 31) - 1, Math.max(250, normalizedDelay));
}

function shouldCollapseOnBlur({ authorizationActive = false, source = null } = {}) {
  // Inactive automatic reveals retain their session when macOS restores focus
  // during opening. Their existing timer/hover rules own the collapse.
  return !authorizationActive && source !== 'automatic';
}
module.exports = { isPanelSender, PANEL_URL, installLocalSessionGuards, installLocalWebContentsGuards, hoverSpacePollingPolicy, notificationTimerDelay, shouldCollapseOnBlur };
