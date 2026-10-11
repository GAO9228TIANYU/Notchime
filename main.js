const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage,
  globalShortcut, dialog, powerMonitor, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const zlib = require('node:zlib');
const { installLocalWebContentsGuards, installLocalSessionGuards, isPanelSender, hoverSpacePollingPolicy, shouldCollapseOnBlur } = require('./main-services');

// Formal identity uses an independent profile. Never automatically read old profiles.
const { AutomaticReveal, LifecycleRevealCoordinator, validPanelState, waitForCalendar } = require('./automatic-reveal');
const { ReminderLedger, CalendarReminderScheduler, reminderFor } = require('./calendar-reminders');
const APP_NAME = 'Notchime';
// Application, product and system permission identities agree.
const PRODUCT_NAME = 'Notchime';
const APP_VERSION = require('./package.json').version;
const { RemindersProvider } = require('./reminders-provider');
const { registerRemindersIPC } = require('./reminders-ipc');
const { CalendarProvider } = require('./calendar-provider');
const { registerCalendarIPC } = require('./calendar-ipc');
const { normalizeAutoCollapseSeconds, normalizeReminderMinutes } = require('./calendar-settings');
const { CountdownStore } = require('./countdown-store');
const { registerCountdownIPC } = require('./countdown-ipc');
let countdownStore;
function getCountdownStore() {
  if (!countdownStore) countdownStore = new CountdownStore(app.getPath('userData'));
  return countdownStore;
}
app.setName(APP_NAME);
app.setPath('userData', app.commandLine.getSwitchValue('user-data-dir')
  || path.join(app.getPath('appData'), APP_NAME));
// Keep Chromium session/crash/log paths under this same independent profile,
// including source-start and isolated integration-test launches.
app.setPath('sessionData', app.getPath('userData'));
app.setPath('crashDumps', path.join(app.getPath('userData'), 'Crashpad'));
app.setAppLogsPath(path.join(app.getPath('userData'), 'logs'));

// ============ 托盘图标 PNG 生成 ============
// 直接在主进程编码 PNG，避免引入额外资源文件
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const off = y * (1 + width * 4);
    scanlines[off] = 0;
    pixels.copy(scanlines, off + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(scanlines);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// 生成刘海形状：扁平顶 + 圆角底，居中偏上
function makeNotchPng(scale) {
  const size = 16 * scale;
  const pixels = Buffer.alloc(size * size * 4);

  // 形状参数（pt 单位 × scale）
  const W = 10 * scale; // 刘海宽
  const H = 5 * scale; // 刘海高
  const R = 2 * scale; // 下方圆角半径
  const x0 = (size - W) / 2;
  const y0 = 3.5 * scale; // 距顶 padding

  function isInside(px, py) {
    if (px < x0 || px > x0 + W || py < y0 || py > y0 + H) return false;
    const bottomR = y0 + H - R;
    if (py < bottomR) return true;
    const leftR = x0 + R;
    const rightR = x0 + W - R;
    if (px >= leftR && px <= rightR) return true;
    if (px < leftR) {
      const dx = leftR - px;
      const dy = py - bottomR;
      return dx * dx + dy * dy <= R * R;
    }
    const dx = px - rightR;
    const dy = py - bottomR;
    return dx * dx + dy * dy <= R * R;
  }

  // 4×4 超采样抗锯齿
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let count = 0;
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          if (isInside(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) count++;
        }
      }
      const alpha = Math.round((count / 16) * 255);
      const idx = (y * size + x) * 4;
      pixels[idx + 3] = alpha;
    }
  }

  return encodePng(size, size, pixels);
}

function createNotchTrayIcon() {
  const png2x = makeNotchPng(2);
  const icon = nativeImage.createFromBuffer(png2x, { scaleFactor: 2 });
  icon.setTemplateImage(true);
  return icon;
}

const COLLAPSED_WIDTH = 200;
const COLLAPSED_MIN_HEIGHT = 38;
// NOTCH_LIP（原 6px 唇边）已移除：折叠条高度现在恰好等于菜单栏高（≈物理刘海高），
// 一个像素都不超出物理刘海。虽然折叠条完全在菜单栏拦截带内，
// 但本项目窗口使用 setAlwaysOnTop(true,'screen-saver') 级别，
// 实测菜单栏不拦截该级别窗口的点击，折叠条仍可点击展开。

// 所有 Tab 共用同一展开尺寸，切换内容时不再改变原生窗口边界。
// 原生窗口只在折叠/展开两个模式间切换，避免 Tab 切换产生明显的宽高跳变。
const EXPANDED_WIDTH = 1240;
const EXPANDED_PANEL_HEIGHT = 540;
const TAB_SIZES = {
  calendar: { width: EXPANDED_WIDTH, panelHeight: EXPANDED_PANEL_HEIGHT },
  settings: { width: EXPANDED_WIDTH, panelHeight: EXPANDED_PANEL_HEIGHT },
};
// 与渲染层结构常量对应：panel padding-top(--s-2 8) + 顶栏(--topbar-h 40)
// + panels margin-top(--s-3 12) + panel padding-bottom(--s-4 16)。内容顶到屏幕最上沿，不留菜单栏带。
const EXPANDED_CHROME_Y = 76;
const SCREEN_MARGIN = 24; // 宽度超屏时两侧保留的安全边
const COLLAPSE_WATCHDOG_MS = 650;

const APP_SETTINGS_FILE = 'app-settings.json';

let mainWindow = null;
let tray = null;
let currentMode = 'collapsed';
let currentTab = 'calendar';
let collapseWatchdog = null;
let collapseGeneration = 0;
let hideWhenCollapsed = false;
let isQuitting = false;
let disposeDisplayWatch = null;
let spaceShortcutTimer = null;
let spaceShortcutRegistered = false;
const configuredShortcut = 'Space';

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      hideWhenCollapsed = false;
      repositionWindow(getTargetDisplay());
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 多屏适配：定位到"鼠标当前所在屏"的物理顶端居中
// 这样接上外接屏后，无论副屏在主屏的左/右/上/下，刘海都跟着用户视线走
function getTargetDisplay() {
  try {
    const cursor = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursor);
  } catch (e) {
    return screen.getPrimaryDisplay();
  }
}

// 窗口当前所在屏：模式切换 / Tab 变形必须锚定在这块屏上。
// 若跟随光标（getTargetDisplay），失焦收起瞬间会把刘海"瞬移"到光标所在的另一块屏。
function getWindowDisplay() {
  try {
    if (mainWindow) return screen.getDisplayMatching(mainWindow.getBounds());
  } catch (e) {
    // fallthrough
  }
  return getTargetDisplay();
}

function getCenteredBounds(width, height, display) {
  const d = display || getTargetDisplay();
  const area = d.bounds;
  return {
    x: Math.round(area.x + (area.width - width) / 2),
    y: area.y,
    width,
    height,
  };
}

// 用显示器工作区与物理边界的差值估算菜单栏高；取到 0 时由下方回退。
// 点击与层级行为仍由透明窗口及 screen-saver 置顶配置处理。
function getMenuBarHeight(display) {
  return Math.max(0, display.workArea.y - display.bounds.y);
}

function getCollapsedHeight(display) {
  const mb = getMenuBarHeight(display);
  // 折叠条高度恰好等于菜单栏带（≈物理刘海高），一个像素都不超出物理刘海。
  // 无刘海的外接屏 menuBarHeight 仍是真实菜单栏高，能正常露头；
  // 异常取到 0 才回退兜底（COLLAPSED_MIN_HEIGHT = 38px）。
  return mb > 0 ? mb : COLLAPSED_MIN_HEIGHT;
}

// 展开尺寸按当前 Tab 取值；宽度超出屏幕时 clamp 到工作区内。
// 窗口从屏幕最顶垂下（y=0），内容直接顶到最上沿，高度不含菜单栏带。
function getExpandedSize(display) {
  const size = TAB_SIZES[currentTab] || TAB_SIZES.calendar;
  return {
    width: Math.min(size.width, display.workArea.width - SCREEN_MARGIN),
    height: Math.min(
      EXPANDED_CHROME_Y + size.panelHeight,
      Math.max(getCollapsedHeight(display), display.bounds.height - SCREEN_MARGIN)
    ),
  };
}

// display 不传时锚定窗口当前所在屏；只有"召唤"类动作（启动/重新居中/显示）才传光标屏。
// 一律瞬时 setBounds：系统动画 resize 会持续重绘 web 内容（卡顿）。
// 原生窗口只提供透明画布，用户可见的岛体形变交给渲染层 CSS。
function getBoundsForMode(mode, display) {
  const d = display || getWindowDisplay();
  if (mode === 'expanded') {
    const { width, height } = getExpandedSize(d);
    return getCenteredBounds(width, height, d);
  }
  return getCenteredBounds(COLLAPSED_WIDTH, getCollapsedHeight(d), d);
}

function cancelCollapseWatchdog() {
  collapseGeneration++;
  if (collapseWatchdog) {
    clearTimeout(collapseWatchdog);
    collapseWatchdog = null;
  }
}

function applyMode(mode, display) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  cancelCollapseWatchdog();
  mainWindow.setBounds(getBoundsForMode(mode, display));
  mainWindow.setIgnoreMouseEvents(false);
  currentMode = mode;
  if (mode === 'expanded') hideWhenCollapsed = false;
  if (mode === 'collapsed' && hideWhenCollapsed) {
    hideWhenCollapsed = false;
    mainWindow.hide();
    refreshTrayMenu();
  }
  syncHoverSpacePolling();
}

// 纯重新定位不能改变收起事务，否则屏幕变化会取消 watchdog 并重新吞掉鼠标。
function repositionWindow(display) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBounds(getBoundsForMode(currentMode, display));
}

function beginNativeCollapse() {
  if (!mainWindow || currentMode !== 'expanded') return;
  const targetWindow = mainWindow;
  const generation = ++collapseGeneration;
  targetWindow.setIgnoreMouseEvents(true);
  if (collapseWatchdog) clearTimeout(collapseWatchdog);
  collapseWatchdog = setTimeout(() => {
    if (generation !== collapseGeneration) return;
    collapseWatchdog = null;
    if (mainWindow === targetWindow && currentMode === 'expanded') {
      applyMode('collapsed');
    }
  }, COLLAPSE_WATCHDOG_MS);
}

function requestRendererCollapse() {
  if (!mainWindow || currentMode !== 'expanded') return;
  beginNativeCollapse();
  mainWindow.webContents.send('window:request-collapse');
}

function hideWindowAfterCollapse() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  // With no Tray, keep the collapsed bar as the recovery/settings entry.
  if (!tray) { requestRendererCollapse(); return; }
  if (currentMode === 'expanded') {
    hideWhenCollapsed = true;
    requestRendererCollapse();
    return;
  }
  hideWhenCollapsed = false;
  mainWindow.hide();
  refreshTrayMenu();
}

function createWindow() {
  const initial = getCenteredBounds(COLLAPSED_WIDTH, getCollapsedHeight(getTargetDisplay()));

  mainWindow = new BrowserWindow({
    width: initial.width,
    height: initial.height,
    x: initial.x,
    y: initial.y,
    frame: false,
    transparent: true,
    // 必须显式给透明底色：只写 transparent 时 BrowserWindow 仍保留不透明的默认底色，
    // 展开瞬间 setBounds 放大后，新暴露的区域会先用它画一两帧，
    // 在菜单栏带上表现为一次黑块闪烁。
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    acceptFirstMouse: true,
    hiddenInMissionControl: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    roundedCorners: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      devTools: !app.isPackaged, // Development diagnostics only; packaged windows expose no DevTools.
    },
  });

  installLocalSessionGuards(mainWindow.webContents.session);
  installLocalWebContentsGuards(mainWindow.webContents);
  mainWindow.webContents.on('render-process-gone', () => automaticReveal?.close());

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Escape 在到达页面前会被 Chromium 浏览器层吞掉（实测 document keydown 收不到），
  // 用 before-input-event 在分发前拦截并转发给渲染层处理（退出输入 / 收起面板）
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
      mainWindow.webContents.send('key:escape');
    }
  });

  // 失焦时让渲染层走完整退场动画，再由渲染层请求缩小原生窗口。
  mainWindow.on('blur', () => {
    if (!shouldCollapseOnBlur({ authorizationActive: calendarAuthorizationActive,
      source: automaticReveal?.session ? 'automatic' : automaticReveal?.state.source })) return;
    automaticReveal?.cancel();
    requestRendererCollapse();
  });

  mainWindow.on('show', syncHoverSpacePolling);
  mainWindow.on('hide', () => { automaticReveal?.cancel(); syncHoverSpacePolling(); });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    applyMode('collapsed');
    mainWindow.showInactive();
    nativeWindowReady = true;
    lifecycleReveals?.flush();
  });

  mainWindow.on('closed', () => {
    nativeWindowReady = false; automaticReveal?.close();
    cancelCollapseWatchdog();
    hideWhenCollapsed = false;
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideWindowAfterCollapse();
  });
}

function toggleVisibility() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    hideWindowAfterCollapse();
  } else {
    hideWhenCollapsed = false;
    repositionWindow(getTargetDisplay()); // 显示前先回到鼠标所在屏顶部
    mainWindow.show();
    refreshTrayMenu();
  }
}

function autoLaunchSupported() {
  // macOS registers the bundle, not a source-directory command. Avoid registering
  // the shared Electron development executable as a login item.
  return process.platform === 'darwin' && app.isPackaged;
}

function isAutoLaunchEnabled() {
  if (!autoLaunchSupported()) return false;
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch (e) {
    return false;
  }
}

function setAutoLaunch(enabled) {
  if (!autoLaunchSupported()) return false;
  try {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return isAutoLaunchEnabled() === enabled;
  } catch (e) {
    return false;
  }
}

function getJsonSettingsPath(name) {
  return path.join(app.getPath('userData'), name);
}

function readJsonFile(filePath, fallback = {}) {
  try {
    if (fs.statSync(filePath).size > 1024 * 1024) return fallback;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  // Do not overwrite a preserved oversized preferences file with defaults.
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).size > 1024 * 1024) return false;
      // Defaults may be displayed after a read failure, but must never replace
      // an existing malformed file and lose the user's recoverable preferences.
      const original = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!original || typeof original !== 'object' || Array.isArray(original)) return false;
    }
    const raw = JSON.stringify(value, null, 2);
    if (Buffer.byteLength(raw) > 1024 * 1024) return false;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(temporaryPath, raw, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporaryPath, filePath);
    return true;
  } catch (error) {
    try { fs.unlinkSync(temporaryPath); } catch (unlinkError) {}
    return false;
  }
}

function readAppSettings() {
  const stored = readJsonFile(getJsonSettingsPath(APP_SETTINGS_FILE));
  // Preserve unknown fields without enabling any legacy business service.
  return { ...stored, autoCollapseSeconds: normalizeAutoCollapseSeconds(stored.autoCollapseSeconds),
    reminderMinutes: normalizeReminderMinutes(stored.reminderMinutes),
    menuBarIconVisible: stored.menuBarIconVisible !== false };
}

function publicAppSettings() {
  return {
    autoCollapseSeconds: readAppSettings().autoCollapseSeconds,
    reminderMinutes: readAppSettings().reminderMinutes,
    reminderError: reminderLedger?.error || null,
    menuBarIconVisible: readAppSettings().menuBarIconVisible,
    autoLaunch: isAutoLaunchEnabled(),
    autoLaunchSupported: autoLaunchSupported(),
    appName: PRODUCT_NAME,
    version: APP_VERSION,
  };
}

function saveAppSettings(settings) {
  return writeJsonFile(getJsonSettingsPath(APP_SETTINGS_FILE), settings);
}

function showAbout() {
  return dialog.showMessageBox(mainWindow, {
    type: 'info', title: `关于 ${PRODUCT_NAME}`, message: PRODUCT_NAME,
    detail: `There When You Need It. Quiet When You Don't.\n需要时出现，无需时静默。\n版本 ${APP_VERSION} · EventKit\n开发与维护：GAO TIANYU\nhttps://github.com/GAO9228TIANYU\ntianyu.gaospk@gmail.com\n\n日历只读；Apple Reminders 仅主动标记完成；倒计时本地保存。`,
    buttons: ['好'], noLink: true,
  });
}

// Manual Tray requests and temporary system reveals share the original animation path.
function requestRendererExpand(tab = 'calendar', source = 'manual') {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (source === 'automatic') return automaticReveal?.request({ kind: 'overview' });
  automaticReveal?.cancel();
  const target = mainWindow;
  const showAndSend = () => {
    if (mainWindow !== target || target.isDestroyed()) return;
    hideWhenCollapsed = false;
    repositionWindow(getTargetDisplay());
    target.webContents.send('window:metrics-changed', getLayoutMetrics());
    target.show();
    target.focus();
    target.webContents.send('window:request-expand', { tab, source });
  };
  if (target.webContents.isLoadingMainFrame()) target.once('ready-to-show', showAndSend);
  else showAndSend();
}

function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '日程', click: () => requestRendererExpand('calendar') },
    { label: '设置', click: () => requestRendererExpand('settings') },
    { label: mainWindow?.isVisible() ? '隐藏顶部横栏' : '显示顶部横栏', click: toggleVisibility },
    { label: '隐藏菜单栏图标', click: () => {
      if (!setMenuBarIconVisible(false).ok) void dialog.showMessageBox(mainWindow, { type: 'error', message: '设置保存失败，菜单栏图标未隐藏。', buttons: ['好'] });
    } },
    { type: 'separator' },
    { label: '开机自动启动', type: 'checkbox', checked: isAutoLaunchEnabled(),
      enabled: autoLaunchSupported(), click: (item) => {
        setAutoLaunch(item.checked);
        refreshTrayMenu();
        mainWindow?.webContents.send('settings:changed', publicAppSettings());
      } },
    { label: '关于', click: showAbout },
    { type: 'separator' },
    { label: '退出', accelerator: 'CommandOrControl+Q', click: () => app.quit() },
  ]));
}

function createTray() {
  if (tray || !readAppSettings().menuBarIconVisible) return;
  tray = new Tray(createNotchTrayIcon());
  tray.setToolTip(PRODUCT_NAME);
  tray.on('click', () => {
    if (!mainWindow) return;
    if (!mainWindow.isVisible()) {
      hideWhenCollapsed = false;
      repositionWindow(getTargetDisplay());
      mainWindow.show();
      refreshTrayMenu();
    }
  });
  refreshTrayMenu();
}

function setMenuBarIconVisible(visible) {
  if (!saveAppSettings({ ...readAppSettings(), menuBarIconVisible: visible })) return { ok: false, error: 'save_failed' };
  if (visible) createTray();
  else {
    tray?.destroy(); tray = null;
    hideWhenCollapsed = false;
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.showInactive();
  }
  const settings = publicAppSettings(); mainWindow?.webContents.send('settings:changed', settings);
  return { ok: true, settings };
}

ipcMain.handle('settings:set-menu-bar-icon', (event, visible) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (typeof visible !== 'boolean') return { ok: false, error: 'invalid' };
  return setMenuBarIconVisible(visible);
});

registerCountdownIPC(ipcMain, { getWindow: () => mainWindow, getStore: getCountdownStore });

ipcMain.handle('window:set-mode', (event, mode) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (!['expanded', 'collapsed'].includes(mode)) return { ok: false, error: 'invalid' };
  applyMode(mode);
});

ipcMain.handle('window:begin-collapse', (event, payload) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (payload !== undefined) return { ok: false, error: 'invalid' };
  beginNativeCollapse();
});

ipcMain.handle('settings:get', (event, payload) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (payload !== undefined) return { ok: false, error: 'invalid' };
  return publicAppSettings();
});
ipcMain.handle('settings:set-auto-collapse-seconds', (event, seconds) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) return { ok: false, error: 'invalid' };
  if (!saveAppSettings({ ...readAppSettings(), autoCollapseSeconds: seconds })) return { ok: false, error: 'save_failed' };
  const settings = publicAppSettings();
  mainWindow?.webContents.send('settings:changed', settings);
  automaticReveal?.arm();
  return { ok: true, settings };
});
function ownsPanel(event) {
  return isPanelSender(event, mainWindow);
}
ipcMain.handle('window:renderer-ready', event => {
  if (!ownsPanel(event)) return { ok: false };
  automaticReveal.ready = true; lifecycleReveals.flush(); return { ok: true };
});
ipcMain.handle('window:report-state', (event, state) => {
  if (!ownsPanel(event) || !validPanelState(state)) return { ok: false };
  if (state.source === 'automatic' && state.token !== automaticReveal.session?.token) return { ok: false };
  automaticReveal.update(state); return { ok: true };
});
ipcMain.handle('settings:set-reminder-minutes', (event, minutes) => {
  if (!ownsPanel(event) || ![0,5,10,15].includes(minutes)) return { ok: false, error: 'invalid' };
  if (!saveAppSettings({ ...readAppSettings(), reminderMinutes: minutes })) return { ok: false, error: 'save_failed' };
  reminderScheduler?.update(getCalendarProvider().snapshot, minutes);
  const settings = publicAppSettings(); mainWindow.webContents.send('settings:changed', settings);
  return { ok: true, settings };
});
ipcMain.handle('app:about', (event, payload) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (payload !== undefined) return { ok: false, error: 'invalid' };
  return showAbout();
});
ipcMain.handle('settings:set-auto-launch', (event, enabled) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (typeof enabled !== 'boolean') return { ok: false, error: 'invalid' };
  if (!setAutoLaunch(enabled)) return { ok: false, error: 'save_failed', autoLaunch: isAutoLaunchEnabled() };
  const settings = publicAppSettings();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('settings:changed', settings);
  refreshTrayMenu();
  return { ok: true, autoLaunch: settings.autoLaunch };
});
function getLayoutMetrics(display) {
  const d = display || getWindowDisplay();
  return {
    stripHeight: getCollapsedHeight(d), // 折叠黑条总高（= 菜单栏高 = 物理刘海高，不含唇边）
    menuBarHeight: getMenuBarHeight(d), // 折叠态菜单栏带高（折叠条上半部分被其拦截）
    chromeY: EXPANDED_CHROME_Y,
    tabSizes: TAB_SIZES,
  };
}

ipcMain.handle('window:metrics', (event, payload) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (payload !== undefined) return { ok: false, error: 'invalid' };
  return getLayoutMetrics();
});

// Tab 仅改变内容；固定展开尺寸下不再触发原生窗口 resize。
ipcMain.handle('window:set-tab', (event, tab) => {
  if (!ownsPanel(event)) return { ok: false, error: 'forbidden' };
  if (typeof tab !== 'string' || !Object.prototype.hasOwnProperty.call(TAB_SIZES, tab)) return { ok: false, error: 'invalid' };
  currentTab = tab;
});

function setHoverSpaceShortcut(enabled) {
  if (enabled === spaceShortcutRegistered) return;
  if (!enabled) {
    if (globalShortcut.isRegistered('Space')) globalShortcut.unregister('Space');
    spaceShortcutRegistered = false;
    return;
  }
  try {
    const ok = globalShortcut.register('Space', async () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      // 展开动作后的极短窗口内，全局 Space 还未来得及注销；这时也要把第二次
      // Space 作为收起处理，避免快速连按被吞掉。
      if (currentMode === 'expanded') {
        mainWindow.webContents.send('shortcut:toggle-panel');
        return;
      }
      hideWhenCollapsed = false;
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('shortcut:toggle-panel');
    });
    spaceShortcutRegistered = ok && globalShortcut.isRegistered('Space');
  } catch (error) {
    spaceShortcutRegistered = false;
  }
}

function startHoverSpaceShortcut() {
  const policy = hoverSpacePollingPolicy({
    shortcut: configuredShortcut,
    visible: Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()),
    mode: currentMode,
  });
  if (!policy.enabled) return;
  if (spaceShortcutTimer) return;
  spaceShortcutTimer = setInterval(() => {
    const currentPolicy = hoverSpacePollingPolicy({
      shortcut: configuredShortcut,
      visible: Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()),
      mode: currentMode,
    });
    if (!currentPolicy.enabled) {
      stopHoverSpaceShortcut();
      return;
    }
    const point = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();
    const hovering = point.x >= bounds.x && point.x < bounds.x + bounds.width
      && point.y >= bounds.y && point.y < bounds.y + bounds.height;
    setHoverSpaceShortcut(hovering);
  }, policy.intervalMs);
}

function stopHoverSpaceShortcut() {
  if (spaceShortcutTimer) clearInterval(spaceShortcutTimer);
  spaceShortcutTimer = null;
  setHoverSpaceShortcut(false);
}

function syncHoverSpacePolling() {
  const policy = hoverSpacePollingPolicy({
    shortcut: configuredShortcut,
    visible: Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()),
    mode: currentMode,
  });
  if (policy.enabled) startHoverSpaceShortcut();
  else stopHoverSpaceShortcut();
}

function ensureFirstRunAutoLaunch() {
  // 首次运行时默认开启开机自启；之后尊重用户在托盘菜单的选择
  if (process.platform !== 'darwin' || !autoLaunchSupported()) return;
  const marker = path.join(app.getPath('userData'), '.first-run-done');
  if (fs.existsSync(marker)) return;
  try {
    setAutoLaunch(true);
    fs.writeFileSync(marker, String(Date.now()));
  } catch (e) {
    // ignore
  }
}

function watchDisplayChanges() {
  // 接/拔外接屏、改变屏幕排列、改分辨率 → 自动重新定位到当前活跃屏顶部居中
  // 加 100ms 防抖：插拔屏时系统会连续触发多次事件
  let timer = null;
  const reposition = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!mainWindow) return;
      automaticReveal?.arm(); // Clear/rearm the existing session; display changes never reveal.
      repositionWindow();
      if (!mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('window:metrics-changed', getLayoutMetrics());
      }
    }, 100);
  };
  screen.on('display-added', reposition);
  screen.on('display-removed', reposition);
  screen.on('display-metrics-changed', reposition);
  return () => {
    clearTimeout(timer);
    screen.removeListener('display-added', reposition);
    screen.removeListener('display-removed', reposition);
    screen.removeListener('display-metrics-changed', reposition);
  };
}

let calendarProvider = null;
let calendarAuthorizationActive = false;
function getCalendarProvider() {
  if (!calendarProvider) {
    calendarProvider = new CalendarProvider({ app });
    calendarProvider.on('snapshot', snapshot => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('calendar:changed', snapshot);
      if (!systemSuspended && !screenLocked && !calendarProvider.refreshAgain) reminderScheduler?.update(snapshot, readAppSettings().reminderMinutes);
    });
    calendarProvider.on('invalidate', () => { presentationGeneration++; reminderScheduler?.cancel(); });
  }
  return calendarProvider;
}
let remindersProvider = null;
function getRemindersProvider() {
  if (!remindersProvider) {
    remindersProvider = new RemindersProvider({ bridge: getCalendarProvider().bridge });
    remindersProvider.on('snapshot', snapshot => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('reminders:changed', snapshot);
    });
  }
  return remindersProvider;
}
function refreshSystemCalendar() { calendarProvider?.scheduleRefresh(); remindersProvider?.scheduleRefresh(); }
async function requestCalendarAccess() {
  if (calendarAuthorizationActive) throw Object.assign(new Error('系统授权正在等待用户操作。'), { code: 'busy' });
  calendarAuthorizationActive = true;
  // System permission sheets must not sit underneath our screen-saver-level island.
  mainWindow?.setAlwaysOnTop(false);
  try { return await getCalendarProvider().requestAccess(); }
  finally {
    calendarAuthorizationActive = false;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }
}
registerCalendarIPC(ipcMain, {
  getWindow: () => mainWindow, getProvider: getCalendarProvider,
  requestAccess: requestCalendarAccess,
  openSettings: async () => { await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Calendars'); },
});

registerRemindersIPC(ipcMain, {
  getWindow: () => mainWindow, getProvider: getRemindersProvider,
  requestAccess: async () => {
    if (calendarAuthorizationActive) throw Object.assign(new Error('系统授权正在等待用户操作。'), { code: 'busy' });
    calendarAuthorizationActive = true;
    mainWindow?.setAlwaysOnTop(false);
    try { return await getRemindersProvider().requestAccess(); }
    finally { calendarAuthorizationActive = false; if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(true, 'screen-saver'); }
  },
  openSettings: async () => { await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Reminders'); },
});

function refreshCountdownClock() {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('countdowns:refresh-time');
}

let nativeWindowReady = false;
let systemSuspended = false;
let screenLocked = false;
let presentationGeneration = 0;
let automaticReveal = null, lifecycleReveals = null, reminderScheduler = null, reminderLedger = null;
function suspendCalendarPresentation() {
  systemSuspended = true; presentationGeneration++;
  lifecycleReveals?.suspend(); automaticReveal?.cancel(); reminderScheduler?.cancel();
  if (automaticReveal?.state.source === 'automatic' && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('window:request-collapse', { token: automaticReveal.state.token, reason: 'suspend' });
  }
}
function lockCalendarPresentation() { screenLocked = true; suspendCalendarPresentation(); }
function resumeCalendarPresentation() {
  systemSuspended = false;
  reminderScheduler?.cancel();
  void getCalendarProvider().refresh();
  lifecycleReveals?.signal('resume');
}
function unlockCalendarPresentation() {
  screenLocked = false;
  systemSuspended = false;
  reminderScheduler?.cancel();
  void getCalendarProvider().refresh();
  lifecycleReveals?.signal('unlock-screen');
}
function initializeCalendarPresentation() {
  reminderLedger = new ReminderLedger(app.getPath('userData'));
  automaticReveal = new AutomaticReveal({
    duration: () => readAppSettings().autoCollapseSeconds * 1000,
    available: () => !isQuitting && !systemSuspended && !screenLocked && !calendarAuthorizationActive && mainWindow && !mainWindow.isDestroyed(),
    expand: request => {
      hideWhenCollapsed = false;
      repositionWindow(getTargetDisplay());
      mainWindow.webContents.send('window:metrics-changed', getLayoutMetrics());
      mainWindow.showInactive();
      mainWindow.webContents.send('window:request-expand', request);
    },
    collapse: token => mainWindow?.webContents.send('window:request-collapse', { token }),
  });
  reminderScheduler = new CalendarReminderScheduler({ ledger: reminderLedger,
    onError: () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('settings:changed', publicAppSettings()); },
    deliver: async reminders => {
      // Revalidate authorization/selection/event existence at delivery, without a poller.
      const generation = presentationGeneration;
      const snapshot = await getCalendarProvider().refresh();
      if (generation !== presentationGeneration || isQuitting || systemSuspended || screenLocked || snapshot.authorization !== 'authorized' || snapshot.error) return;
      const selected = new Set(snapshot.selectedCalendarIds);
      const valid = reminders.filter(r => Date.now() - r.due <= 5000 && r.start > Date.now() && snapshot.events.some(event =>
        selected.has(event.calendar?.id) && reminderFor(event, readAppSettings().reminderMinutes)?.key === r.key));
      if (!valid.length) return;
      const r = valid[0];
      // Reminders during manual use are consumed without changing the user's page/focus.
      automaticReveal.request({ kind: 'reminder', title: r.event.title?.trim() || '无标题日程',
        start: r.event.start, minutes: r.minutes, color: r.event.calendar.color, count: valid.length });
    },
  });
  lifecycleReveals = new LifecycleRevealCoordinator({
    ready: () => nativeWindowReady && automaticReveal.ready && !systemSuspended && !screenLocked,
    reveal: async (_reason, stillValid) => {
      // Renderer/native readiness is mandatory; data readiness has a bounded fallback.
      await waitForCalendar(() => getCalendarProvider().refresh());
      if (stillValid() && !systemSuspended) automaticReveal.request({ kind: 'overview' });
    },
  });
  lifecycleReveals.signal('startup'); // Also covers a packaged login-item launch, exactly once.
}

app.whenReady().then(() => {
  if (!gotTheLock) return;
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: PRODUCT_NAME, submenu: [
      { label: `关于 ${PRODUCT_NAME}`, click: showAbout },
      { type: 'separator' }, { role: 'hide', label: `隐藏 ${PRODUCT_NAME}` },
      { role: 'hideOthers' }, { role: 'unhide' },
      { type: 'separator' }, { role: 'quit', label: `退出 ${PRODUCT_NAME}` },
    ] },
    { role: 'editMenu' },
  ]));
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  ensureFirstRunAutoLaunch();
  initializeCalendarPresentation();
  createWindow();
  createTray();
  disposeDisplayWatch = watchDisplayChanges();
  powerMonitor.on('resume', refreshCountdownClock);
  powerMonitor.on('resume', refreshSystemCalendar);
  powerMonitor.on('unlock-screen', refreshSystemCalendar);
  powerMonitor.on('suspend', suspendCalendarPresentation);
  powerMonitor.on('lock-screen', lockCalendarPresentation);
  powerMonitor.on('resume', resumeCalendarPresentation);
  powerMonitor.on('unlock-screen', unlockCalendarPresentation);
  getCalendarProvider().refresh();
  getRemindersProvider().refresh();
  mainWindow.on('focus', refreshSystemCalendar);
  syncHoverSpacePolling();
  app.on('activate', () => {
    refreshSystemCalendar();
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (!tray && mainWindow && !mainWindow.isVisible()) requestRendererExpand(currentTab);
  });
});

// Keep this menu-bar application alive while its window is hidden.
app.on('window-all-closed', () => {});
app.on('before-quit', () => {
  isQuitting = true;
  hideWhenCollapsed = false;
});
app.on('will-quit', () => {
  disposeDisplayWatch?.();
  powerMonitor.removeListener('resume', refreshCountdownClock);
  powerMonitor.removeListener('resume', refreshSystemCalendar);
  powerMonitor.removeListener('unlock-screen', refreshSystemCalendar);
  powerMonitor.removeListener('suspend', suspendCalendarPresentation);
  powerMonitor.removeListener('lock-screen', lockCalendarPresentation);
  powerMonitor.removeListener('resume', resumeCalendarPresentation);
  powerMonitor.removeListener('unlock-screen', unlockCalendarPresentation);
  lifecycleReveals?.close(); automaticReveal?.close(); reminderScheduler?.close();
  remindersProvider?.close();
  calendarProvider?.close();
  cancelCollapseWatchdog();
  stopHoverSpaceShortcut();
  globalShortcut.unregisterAll();
});
