// Window motion is unchanged; temporary reveal timing belongs to Main.
const app = document.getElementById('app');
const notch = document.getElementById('notch');
const panel = document.getElementById('panel');
const api = window.notchAPI;
const TABS = ['calendar', 'settings'];
const tabButtons = Array.from(document.querySelectorAll('.tab[data-tab]'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
const tabIndicator = document.getElementById('tab-indicator');
let activeTab = 'calendar';
let isExpanded = false;
let modeBusy = false;
let pendingMode = null;
let expansionSource = null;
let automaticToken = null;
let automaticSettling = false;
let panelHovered = false;
function reportPanelState() {
  run(api?.reportPanelState?.({ expanded: isExpanded, busy: modeBusy || automaticSettling,
    source: expansionSource, hovered: panelHovered, tab: activeTab, token: automaticToken }));
}
function clearPresentation() {
  document.getElementById('automatic-presentation').hidden = true;
}
function claimManualControl() {
  if (expansionSource !== 'automatic') return;
  expansionSource = 'manual'; automaticToken = null; automaticSettling = false;
  clearPresentation(); reportPanelState();
}
function showPresentation(presentation = {}) {
  const banner = document.getElementById('automatic-presentation');
  const reminder = presentation.kind === 'reminder';
  document.getElementById('automatic-label').textContent = reminder ? '即将开始' : '今日概览';
  document.getElementById('automatic-title').textContent = reminder ? presentation.title : '今天的日程与重要里程碑';
  const start = new Date(presentation.start);
  document.getElementById('automatic-detail').textContent = reminder && Number.isFinite(+start)
    ? `${clockFormat.format(start)} 开始 · 提前 ${presentation.minutes} 分钟${presentation.count > 1 ? ` · 同时还有 ${presentation.count - 1} 项` : ''}`
    : '登录、唤醒或解锁后的今日概览';
  banner.style.setProperty('--calendar-color', /^#[0-9a-f]{6}$/i.test(presentation.color) ? presentation.color : '#438CFF');
  banner.hidden = false;
}
let restoreNotchFocusAfterCollapse = false;
const PANEL_MOTION_FALLBACK_MS = 440;
function report(error) { console.error('Calendar Panel:', error); }
function run(action) { Promise.resolve(action).catch(report); }

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function waitForPanelMotion() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      panel.removeEventListener('transitionend', onEnd);
      resolve();
    };
    const onEnd = (event) => {
      if (
        event.target === panel &&
        event.propertyName === 'opacity' &&
        event.pseudoElement === '::before'
      ) {
        finish();
      }
    };
    const timer = setTimeout(finish, PANEL_MOTION_FALLBACK_MS);
    panel.addEventListener('transitionend', onEnd);
  });
}

async function ipcSetMode(mode) {
  if (!window.notchAPI || typeof window.notchAPI.setMode !== 'function') return;
  try {
    await window.notchAPI.setMode(mode);
  } catch (e) {
    // ignore
  }
}

async function ipcBeginCollapse() {
  if (!window.notchAPI || typeof window.notchAPI.beginCollapse !== 'function') return;
  try {
    await window.notchAPI.beginCollapse();
  } catch (e) {
    // ignore
  }
}

function syncPanelAccessibility(expanded) {
  const focusWasInPanel = !!(panel && panel.contains(document.activeElement));
  if (!expanded) {
    restoreNotchFocusAfterCollapse = document.hasFocus();
    if (focusWasInPanel) document.activeElement.blur();
  } else {
    restoreNotchFocusAfterCollapse = false;
  }
  if (panel) {
    panel.inert = !expanded;
    panel.setAttribute('aria-hidden', String(!expanded));
  }
  if (!notch) return;
  notch.setAttribute('aria-expanded', String(expanded));
  notch.setAttribute('aria-label', expanded ? '收起 Notchime' : '展开 Notchime');
  if (expanded && expansionSource !== 'automatic' && document.activeElement === notch) {
    const activeTabButton = document.querySelector(`.tab[data-tab="${activeTab}"]`);
    if (activeTabButton) activeTabButton.focus({ preventScroll: true });
  }
  notch.setAttribute('aria-hidden', String(expanded));
  notch.tabIndex = expanded ? -1 : 0;
}

// 原生窗口只提供动画需要的透明画布；用户看到的黑色岛体由 CSS 连续形变。
// 收起必须等岛体退场完成后再缩原生窗口，避免最后一帧被裁掉。
async function setMode(expanded, { source = 'manual' } = {}) {
  if (source === 'manual') claimManualControl();
  if (modeBusy) {
    pendingMode = { expanded, source };
    return;
  }
  if (expanded === isExpanded) {
    if (expanded && source === 'manual') expansionSource = 'manual';
    reportPanelState(); return;
  }
  modeBusy = true;
  isExpanded = expanded;
  expansionSource = expanded ? source : null;
  if (!expanded || source === 'manual') automaticToken = null;
  if (expanded && source === 'manual') clearPresentation();
  reportPanelState();
  try {
    if (expanded) {
      // Open using the existing motion; Main times only acknowledged automatic reveals.
      await setActiveTab('calendar');
      renderCalendar();
      void refreshCalendar();
      syncPanelAccessibility(true);
      app.classList.remove('collapsed', 'closing');
      app.classList.add('opening');
      void panel.offsetWidth;
      // offsetWidth 只强制布局，不强制绘制；而 rAF 回调发生在绘制之前。
      // 必须等两帧、确认 .opening 的透明折叠条真的进了合成器，再让主进程放大窗口，
      // 否则放大时被钉在新原点上的仍是那条黑色折叠条（菜单栏黑块闪烁的成因）。
      await nextAnimationFrame();
      await nextAnimationFrame();
      await ipcSetMode('expanded');
      await nextAnimationFrame();
      await nextAnimationFrame();
      app.classList.remove('opening');
      app.classList.add('expanded');
      // 展开后面板从隐藏变为可见，tab 尺寸此时才可量，校准激活胶囊位置
      requestAnimationFrame(() => requestAnimationFrame(positionIndicator));

    } else {
      const motion = waitForPanelMotion();
      syncPanelAccessibility(false);
      await ipcBeginCollapse();
      app.classList.add('closing');
      await nextAnimationFrame();
      await motion;
      await nextAnimationFrame();
      await nextAnimationFrame();
      await ipcSetMode('collapsed');
      app.classList.remove('expanded', 'closing', 'opening');
      app.classList.add('collapsed');
      clearPresentation();
      if (restoreNotchFocusAfterCollapse && document.hasFocus() && notch) {
        notch.focus({ preventScroll: true });
      }
      restoreNotchFocusAfterCollapse = false;
    }
    document.dispatchEvent(new CustomEvent('notch:modechange', {
      detail: { expanded: isExpanded, source: expansionSource },
    }));
  } finally {
    modeBusy = false;
    reportPanelState();
    if (pendingMode !== null) {
      const nextMode = pendingMode;
      pendingMode = null;
      if (nextMode.expanded !== isExpanded) run(setMode(nextMode.expanded, nextMode));
    }
  }
}

function positionIndicator() {
  const button = tabButtons.find((b) => b.dataset.tab === activeTab);
  if (!button) return;
  tabIndicator.style.width = `${button.offsetWidth}px`;
  tabIndicator.style.transform = `translateX(${button.offsetLeft}px)`;
}
function applyTabDom(name) {
  tabButtons.forEach((button) => {
    const selected = button.dataset.tab === name;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  tabPanels.forEach((p) => {
    const selected = p.id === `tab-${name}`;
    p.classList.toggle('active', selected);
    p.inert = !selected;
    p.setAttribute('aria-hidden', String(!selected));
  });
  positionIndicator();
  requestAnimationFrame(() => requestAnimationFrame(positionIndicator));
  document.dispatchEvent(new CustomEvent('notch:tabchange', { detail: { tab: name } }));
}
let tabBusy = false;
let pendingTab = null;
let tabWaiters = [];
async function setActiveTab(name) {
  if (!TABS.includes(name)) name = 'calendar';
  if (tabBusy) { pendingTab = name; return new Promise(resolve => tabWaiters.push(resolve)); }
  tabBusy = true;
  activeTab = name;
  try {
    await api?.setTab?.(name);
    applyTabDom(name); reportPanelState();
    if (name === 'settings') await refreshSettingsPanel();
    else void refreshCalendar();
  } finally {
    tabBusy = false;
    const next = pendingTab;
    pendingTab = null;
    if (next && next !== activeTab) await setActiveTab(next);
    else tabWaiters.splice(0).forEach(resolve => resolve());
  }
}

notch.addEventListener('click', (event) => { event.stopPropagation(); run(setMode(!isExpanded)); });
notch.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  if (!event.repeat) run(setMode(!isExpanded));
});
panel.addEventListener('click', (event) => event.stopPropagation());
document.getElementById('collapse-btn').addEventListener('click', (event) => {
  event.stopPropagation(); run(setMode(false));
});
document.querySelector('.topbar').addEventListener('click', (event) => {
  if (event.target.closest('.tabs, button, input')) return;
  event.stopPropagation(); run(setMode(false));
});
document.addEventListener('keydown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const editable = Boolean(target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), audio, video, dialog[open], .reminders-section button'));
  if (!window.PanelInteraction.shouldTogglePanelForSpace({ key: event.key, code: event.code,
    repeat: event.repeat, isComposing: event.isComposing, metaKey: event.metaKey,
    ctrlKey: event.ctrlKey, altKey: event.altKey, editable })) return;
  event.preventDefault(); event.stopImmediatePropagation(); run(setMode(!isExpanded));
}, true);
api?.onEscape?.(() => {
  const escape = new CustomEvent('notch:escape', { cancelable: true });
  document.dispatchEvent(escape);
  if (escape.defaultPrevented) return;
  const element = document.activeElement;
  if (element?.matches('input, textarea, select')) { element.blur(); return; }
  if (isExpanded) run(setMode(false));
});
api?.onToggleShortcut?.(() => run(setMode(!isExpanded)));
api?.onCollapseRequest?.((request) => {
  if (request?.token && (expansionSource !== 'automatic' || automaticToken !== request.token || (request.reason !== 'suspend' && (panelHovered || modeBusy || automaticSettling)))) return;
  if (isExpanded) run(setMode(false, { source: expansionSource || 'manual' }));
});
api?.onExpandRequest?.((request = {}) => run((async () => {
  if (request.source === 'automatic') {
    if ((isExpanded && expansionSource !== 'automatic') || modeBusy || automaticSettling || document.querySelector('dialog[open]')) { reportPanelState(); return; }
    automaticToken = request.token;
    showPresentation(request.presentation);
    if (isExpanded) { reportPanelState(); return; }
    automaticSettling = true;
    await setMode(true, { source: 'automatic' });
    if (expansionSource === 'automatic' && automaticToken === request.token) {
      document.querySelector('.calendar-page').scrollTop = 0;
      document.getElementById('today-events').scrollTop = 0;
      document.querySelector('.today-content').scrollTop = 0;
    }
    await waitForPanelMotion();
    automaticSettling = false; panelHovered = panel.matches(':hover'); reportPanelState();
  } else {
    await setMode(true, { source: 'manual' });
    await setActiveTab(request.tab);
  }
})()));
// Hover pauses the temporary session; intentional input transfers control permanently.
panel.addEventListener('mouseenter', () => { panelHovered = true; reportPanelState(); });
panel.addEventListener('mouseleave', () => { panelHovered = false; reportPanelState(); });
for (const name of ['pointerdown', 'keydown', 'wheel', 'click']) {
  document.addEventListener(name, claimManualControl, { capture: true, passive: name === 'wheel' });
}
function applyLayoutMetrics(metrics) {
  if (!metrics) return;
  if (metrics.stripHeight) document.documentElement.style.setProperty('--notch-h', `${metrics.stripHeight}px`);
  if (Number.isFinite(metrics.menuBarHeight)) document.documentElement.style.setProperty('--mb-h', `${metrics.menuBarHeight}px`);
}
if (api?.getMetrics) run(api.getMetrics().then(applyLayoutMetrics));
api?.onMetricsChanged?.(applyLayoutMetrics);
window.addEventListener('resize', positionIndicator);
tabIndicator.addEventListener('transitionend', positionIndicator);
tabButtons.forEach((button) => {
  button.addEventListener('click', (event) => { event.stopPropagation(); run(setActiveTab(button.dataset.tab)); });
  button.addEventListener('keydown', (event) => {
    const index = tabButtons.indexOf(button);
    const indices = { ArrowRight: (index + 1) % TABS.length, ArrowLeft: (index + TABS.length - 1) % TABS.length, Home: 0, End: TABS.length - 1 };
    if (!(event.key in indices)) return;
    event.preventDefault();
    const next = tabButtons[indices[event.key]];
    next.focus({ preventScroll: true }); run(setActiveTab(next.dataset.tab));
  });
});

let clockFormat = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
let dayFormat = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
function eventElement(event, showDate = false) {
  const row = document.createElement('article'); row.className = 'calendar-event';
  row.style.setProperty('--calendar-color', event.calendar.color);
  const color = document.createElement('span'); color.className = 'calendar-color'; color.setAttribute('aria-hidden', 'true');
  const text = document.createElement('div');
  const title = document.createElement('h3'); title.className = 'calendar-event-title'; title.textContent = event.title;
  const time = document.createElement('p'); time.className = 'calendar-event-time';
  const crossing = window.CalendarModel.dayKey(event.start) !== window.CalendarModel.dayKey(event.end);
  time.textContent = event.allDay ? '全天' : `${showDate || crossing ? `${dayFormat.format(event.start)} · ` : ''}${clockFormat.format(event.start)} – ${crossing ? `${dayFormat.format(event.end)} · ` : ''}${clockFormat.format(event.end)}${event.start <= new Date() && event.end > new Date() ? ' · 进行中' : ''}`;
  const calendar = document.createElement('span'); calendar.className = 'calendar-event-calendar'; calendar.textContent = event.calendar.name;
  time.append(calendar); text.append(title, time); row.append(color, text); return row;
}
let calendarSnapshot = { authorization: 'loading', events: [], calendars: [], selectedCalendarIds: [] };
let calendarLoading = null;
const permissionLabels = { loading: '正在读取系统日历……', authorized: '已允许日历访问 · 只读取', notDetermined: '尚未授权：请在设置中允许读取系统日历。', denied: '日历访问已被拒绝或撤销，请在系统设置中允许访问。', restricted: '日历访问受系统限制。', writeOnly: '当前仅允许写入，读取日程需要完整日历访问。', error: '日历读取失败，请重新加载。' };
function applyCalendarSnapshot(snapshot) {
  if (!snapshot || typeof snapshot.authorization !== 'string') return;
  calendarSnapshot = snapshot;
  // Intl formatters capture their default zone; recreate after native clock/zone refresh.
  clockFormat = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  dayFormat = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
  renderCalendar(); renderCalendarSettings();
}
async function refreshCalendar() {
  if (!api?.refreshCalendar || calendarLoading) return calendarLoading;
  calendarLoading = (async () => {
    try { const result = await api.refreshCalendar();
      if (!result.ok) throw new Error(result.message);
      applyCalendarSnapshot(result.snapshot);
    } catch (error) { applyCalendarSnapshot({ authorization: 'error', error: error.message, events: [], calendars: [], selectedCalendarIds: [] }); }
    finally { calendarLoading = null; }
  })();
  return calendarLoading;
}
function renderCalendarSettings() {
  const snapshot = calendarSnapshot;
  document.getElementById('calendar-authorization').textContent = permissionLabels[snapshot.authorization] || '未知授权状态';
  document.getElementById('calendar-authorize').hidden = !['notDetermined', 'writeOnly'].includes(snapshot.authorization);
  document.getElementById('calendar-system-settings').hidden = !['denied', 'restricted', 'writeOnly'].includes(snapshot.authorization);
  document.getElementById('calendar-settings-error').textContent = snapshot.error || '';
  const list = document.getElementById('calendar-selection');
  const focusedId = list.contains(document.activeElement) ? document.activeElement.value : null;
  list.replaceChildren(...(snapshot.calendars || []).map(calendar => {
    const label = document.createElement('label'); label.className = 'calendar-setting-row';
    const name = document.createElement('span'); name.textContent = `${calendar.name}${calendar.source?.name ? ` · ${calendar.source.name}` : ''}`;
    const dot = document.createElement('span'); dot.className = 'calendar-selection-color'; dot.style.background = /^#[0-9a-f]{6}$/i.test(calendar.color) ? calendar.color : '#438CFF';
    name.prepend(dot);
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = calendar.id;
    input.checked = snapshot.selectedCalendarIds.includes(calendar.id); input.disabled = !!snapshot.error;
    input.addEventListener('change', async () => {
      const ids = Array.from(list.querySelectorAll('input:checked'), field => field.value);
      list.querySelectorAll('input').forEach(field => { field.disabled = true; });
      try { const result = await api.selectCalendars(ids); if (!result.ok) throw new Error(result.message); applyCalendarSnapshot(result.snapshot); }
      catch (error) { renderCalendarSettings(); document.getElementById('calendar-settings-error').textContent = error.message; }
    });
    label.append(name, input); return label;
  }));
  if (focusedId && document.hasFocus()) Array.from(list.querySelectorAll('input')).find(input => input.value === focusedId)?.focus({ preventScroll: true });
  if (snapshot.authorization === 'authorized' && !snapshot.calendars.length) list.textContent = '系统中没有可用的事件日历。';
}
function renderCalendar() {
  const data = window.CalendarModel.createView(calendarSnapshot);
  document.getElementById('calendar-status').textContent = calendarSnapshot.error || (calendarSnapshot.authorization === 'authorized' ? '来自系统日历 · 只读取' : permissionLabels[calendarSnapshot.authorization]) || '无法读取日历';
  document.getElementById('today-count').textContent = `${data.today.length} 项日程`;
  document.getElementById('today-events').replaceChildren(...data.today.map((event) => eventElement(event)));
  if (!data.today.length) document.getElementById('today-events').textContent = calendarSnapshot.authorization === 'authorized' ? '今天暂无日程' : '授权后显示系统日程';
  const next = document.getElementById('next-event');
  if (data.next) next.replaceChildren(eventElement(data.next, true));
  else next.textContent = '近期暂无日程';
  document.getElementById('week-events').replaceChildren(...data.days.map((day) => {
    const row = document.createElement('div'); row.className = 'calendar-day';
    const label = document.createElement('div'); label.className = 'calendar-day-label'; label.textContent = dayFormat.format(day.date);
    const items = document.createElement('div'); items.append(...day.events.map((event) => eventElement(event)));
    if (!day.events.length) { items.className = 'calendar-muted'; items.textContent = '暂无日程'; }
    row.append(label, items); return row;
  }));
}

const launchInput = document.getElementById('settings-auto-launch');
const secondsInput = document.getElementById('settings-auto-collapse');
const settingsStatus = document.getElementById('settings-status');
const reminderInput = document.getElementById('settings-reminder-minutes');
let currentSettings = { reminderMinutes: 10, autoCollapseSeconds: 4, autoLaunch: false, autoLaunchSupported: false };
function applySettings(settings) {
  currentSettings = { ...currentSettings, ...settings };
  launchInput.checked = currentSettings.autoLaunch === true;
  launchInput.disabled = currentSettings.autoLaunchSupported !== true;
  secondsInput.value = currentSettings.autoCollapseSeconds;
  reminderInput.value = currentSettings.reminderMinutes;
  document.getElementById('reminder-error').textContent = currentSettings.reminderError || '';
  document.getElementById('auto-launch-note').textContent = currentSettings.autoLaunchSupported
    ? '开机启动状态从系统登录项读取。'
    : '源码运行不注册通用 Electron 登录项。请在独立打包版本中使用开机启动。';
  document.getElementById('about-version').textContent = `${currentSettings.appName || 'Notchime'} · ${currentSettings.version || '开发版'}`;
}
async function refreshSettingsPanel() {
  if (api?.getAppSettings) applySettings(await api.getAppSettings());
  void refreshCalendar();
}
launchInput.addEventListener('change', () => run((async () => {
  const enabled = launchInput.checked;
  launchInput.disabled = true;
  try {
    const result = await api.setAutoLaunch(enabled);
    settingsStatus.textContent = result.ok ? '开机启动设置已更新。' : '开机启动设置未成功，请检查系统登录项。';
    await refreshSettingsPanel();
  } finally { launchInput.disabled = !currentSettings.autoLaunchSupported; }
})()));
secondsInput.addEventListener('change', () => run((async () => {
  const seconds = Number(secondsInput.value);
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) {
    secondsInput.value = currentSettings.autoCollapseSeconds;
  reminderInput.value = currentSettings.reminderMinutes;
  document.getElementById('reminder-error').textContent = currentSettings.reminderError || ''; settingsStatus.textContent = '请输入 1–60 之间的整数秒数。'; return;
  }
  secondsInput.disabled = true;
  try {
    const result = await api.setAutoCollapseSeconds(seconds);
    if (result.ok) applySettings(result.settings);
    else secondsInput.value = currentSettings.autoCollapseSeconds;
    settingsStatus.textContent = result.ok ? '自动展开停留时间已保存；手动打开不会自动收起。' : '设置保存失败，请重试。';
  } finally { secondsInput.disabled = false; }
})()));
reminderInput.addEventListener('change', () => run((async () => {
  reminderInput.disabled = true;
  try {
    const result = await api.setReminderMinutes(Number(reminderInput.value));
    if (result.ok) applySettings(result.settings); else reminderInput.value = currentSettings.reminderMinutes;
    settingsStatus.textContent = result.ok ? '刘海提醒设置已保存。' : '提醒设置保存失败，请重试。';
  } finally { reminderInput.disabled = false; }
})()));
document.getElementById('settings-about').addEventListener('click', () => run(api?.showAbout?.()));
api?.onAppSettingsChanged?.(applySettings);
// Small window controller for integration tests and future Main-driven requests.
window.NotchPanel = Object.freeze({ setMode, setActiveTab,
  getState: () => ({ expanded: isExpanded, busy: modeBusy || automaticSettling, tab: activeTab, source: expansionSource }),
});
syncPanelAccessibility(false);
applyTabDom('calendar');
renderCalendar(); renderCalendarSettings();
api?.onCalendarChanged?.(applyCalendarSnapshot);
for (const id of ['calendar-authorize', 'calendar-reload', 'calendar-system-settings']) {
  document.getElementById(id).addEventListener('click', () => run((async () => {
    const button = document.getElementById(id); button.disabled = true;
    try {
      if (id === 'calendar-reload') { await refreshCalendar(); return; }
      const result = id === 'calendar-authorize' ? await api.requestCalendarAccess() : await api.openCalendarSettings();
      if (!result.ok) throw new Error(result.message);
      if (result.snapshot) applyCalendarSnapshot(result.snapshot);
    } catch (error) { document.getElementById('calendar-settings-error').textContent = error.message; }
    finally { button.disabled = false; }
  })()));
}
window.CalendarUI = Object.freeze({ applySnapshot: applyCalendarSnapshot, getSnapshot: () => calendarSnapshot });
run(refreshSettingsPanel().finally(() => api?.rendererReady?.()));

let calendarViewTimer = null;
function armCalendarViewClock() {
  clearTimeout(calendarViewTimer);
  calendarViewTimer = setTimeout(() => { renderCalendar(); armCalendarViewClock(); }, 60000 - Date.now() % 60000 + 50);
}
armCalendarViewClock();
window.addEventListener('pagehide', () => clearTimeout(calendarViewTimer), { once: true });
