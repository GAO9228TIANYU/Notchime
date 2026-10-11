(function () {
  const api = window.notchAPI, model = window.CountdownModel;
  const get = id => document.getElementById(id);
  const list = get('countdown-list'), status = get('countdown-status');
  const editor = get('countdown-editor'), deletion = get('countdown-delete-dialog');
  const form = get('countdown-form'), formError = get('countdown-form-error');
  const add = get('countdown-add'), viewAll = get('countdown-view-all'), retry = get('countdown-retry');
  const fields = { title: get('countdown-title'), targetDate: get('countdown-date'), targetTime: get('countdown-time'), color: get('countdown-color'), pinned: get('countdown-pinned') };
  const pickers = window.CountdownPickers.create({ dateInput: fields.targetDate, timeInput: fields.targetTime,
    dateButton: get('countdown-date-open'), timeButton: get('countdown-time-open'), api });
  let items = [], available = false, busy = false, showAll = false, editingId = null, deletingId = null;
  let returnFocus = null, refreshTimer = null;
  const colorNames = ['蓝色', '绿色', '橙色', '红色', '紫色'];
  model.COLORS.forEach((color, i) => {
    const option = document.createElement('option'); option.value = color; option.textContent = colorNames[i]; fields.color.append(option);
  });
  function message(result) { return `${result.message || '倒计时操作失败，请重试。'}${result.error ? `（${result.error}）` : ''}`; }
  async function invoke(name, ...args) {
    try {
      if (!api?.[name]) return { ok: false, error: 'unavailable', message: '请在桌面应用中使用本地倒计时。' };
      return await api[name](...args);
    } catch { return { ok: false, error: 'ipc_failed', message: '无法连接本地存储，请重试。' }; }
  }
  function setBusy(value) {
    busy = value;
    form.querySelectorAll('input, select, button').forEach(element => { element.disabled = value; });
    deletion.querySelectorAll('button').forEach(element => { element.disabled = value; });
    add.disabled = value || !available;
    get('countdown-empty-add').disabled = value || !available;
    list.querySelectorAll('button').forEach(element => { element.disabled = value || !available; });
    retry.disabled = value;
  }
  function restoreFocus() {
    if (!window.NotchPanel?.getState().expanded) return;
    if (returnFocus?.isConnected && !returnFocus.disabled) returnFocus.focus({ preventScroll: true });
    else if (available) add.focus({ preventScroll: true });
    returnFocus = null;
  }
  function closeDialog(dialog, restore = true) {
    if (dialog === editor) pickers.close(false);
    if (dialog.open) dialog.close();
    if (restore) restoreFocus();
  }
  function closeCurrent() {
    if (busy) return;
    if (pickers.close()) return;
    if (editor.open) closeDialog(editor);
    else if (deletion.open) closeDialog(deletion);
  }
  function openEditor(item = null, trigger = document.activeElement) {
    if (busy || !available) return;
    editingId = item?.id || null; returnFocus = trigger;
    get('countdown-editor-title').textContent = item ? '编辑倒计时' : '添加倒计时';
    fields.title.value = item?.title || '';
    fields.targetDate.value = item?.targetDate || '';
    fields.targetTime.value = item?.targetTime || '';
    fields.color.value = item?.color || model.COLORS[0];
    fields.pinned.checked = item?.pinned === true;
    Object.values(fields).forEach(input => input.removeAttribute('aria-invalid'));
    formError.textContent = ''; editor.showModal(); fields.title.focus();
  }
  function openDelete(item, trigger) {
    if (busy || !available) return;
    deletingId = item.id; returnFocus = trigger;
    get('countdown-delete-description').textContent = `确定删除「${item.title}」吗？`;
    get('countdown-delete-error').textContent = ''; deletion.showModal(); get('countdown-delete-cancel').focus();
  }
  function accept(next) { items = model.sortCountdowns(next); renderList(); syncRefresh(); }
  function saved(next, text) {
    available = true; retry.hidden = true;
    status.dataset.kind = 'success'; status.textContent = text;
    accept(next);
  }
  function storageFailure(result) {
    status.dataset.kind = 'error'; status.textContent = message(result); retry.hidden = false;
    if (['invalid_json', 'invalid_store', 'unsupported_schema', 'file_too_large', 'read_failed'].includes(result.error)) available = false;
  }
  async function load() {
    const result = await invoke('listCountdowns');
    if (result.ok) { available = true; retry.hidden = true; status.textContent = ''; accept(result.items); }
    else { available = false; storageFailure(result); renderList(); }
    setBusy(busy); return result;
  }
  function card(item) {
    const element = document.createElement('article'); element.className = 'countdown-card'; element.dataset.id = item.id;
    element.style.setProperty('--countdown-color', item.color);
    const header = document.createElement('div'); header.className = 'countdown-card-header';
    const title = document.createElement('h3'); title.textContent = item.title;
    const pin = document.createElement('span'); pin.className = 'countdown-pinned-badge'; pin.textContent = item.pinned ? '已置顶' : '';
    header.append(title, pin);
    const value = document.createElement('p'); value.className = 'countdown-value';
    const target = document.createElement('p'); target.className = 'countdown-target'; target.textContent = `${item.targetDate}${item.targetTime ? ` · ${item.targetTime}` : ''}`;
    const actions = document.createElement('div'); actions.className = 'countdown-card-actions';
    for (const [action, label] of [['pin', item.pinned ? '取消置顶' : '置顶'], ['edit', '编辑'], ['delete', '删除']]) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.action = action;
      button.textContent = label; button.setAttribute('aria-label', `${label} ${item.title}`); button.disabled = busy || !available;
      button.addEventListener('click', () => {
        if (action === 'edit') openEditor(item, button);
        if (action === 'delete') openDelete(item, button);
        if (action === 'pin') void pinItem(item, button);
      }); actions.append(button);
    }
    element.append(header, value, target, actions); return element;
  }
  function renderList() {
    const focused = document.activeElement;
    const focusedId = focused?.closest('.countdown-card')?.dataset.id, focusedAction = focused?.dataset.action;
    list.replaceChildren(...(showAll ? items : items.slice(0, 4)).map(card));
    get('countdown-empty').hidden = items.length > 0 || !available;
    viewAll.hidden = items.length <= 4;
    viewAll.textContent = showAll ? '收起列表' : `查看全部（${items.length}）`;
    viewAll.setAttribute('aria-expanded', String(showAll));
    updateClock();
    if (focusedId && focusedAction && !editor.open && !deletion.open) {
      list.querySelector(`[data-id="${focusedId}"] [data-action="${focusedAction}"]`)?.focus({ preventScroll: true });
    }
  }
  function updateClock(now = new Date()) {
    for (const row of list.children) {
      const item = items.find(value => value.id === row.dataset.id);
      const result = model.calculateCountdown(item, now), value = row.querySelector('.countdown-value');
      value.textContent = result.label; value.dataset.status = result.status;
      value.title = result.status === 'unavailable' ? '目标时间在当前时区不存在，请编辑。' : '';
    }
  }
  function visible() {
    const state = window.NotchPanel?.getState();
    return state?.expanded && state.tab === 'calendar' && !document.hidden && items.length > 0;
  }
  function syncRefresh() {
    clearTimeout(refreshTimer); refreshTimer = null;
    if (!visible()) return;
    refreshTimer = setTimeout(() => { refreshTimer = null; updateClock(); syncRefresh(); }, model.nextRefreshDelay());
  }
  function refreshClock() { updateClock(); syncRefresh(); }
  async function pinItem(item, button) {
    if (busy || !available) return;
    setBusy(true);
    try {
      const result = await invoke('pinCountdown', item.id, !item.pinned);
      if (!result.ok) storageFailure(result);
      else saved(result.items, item.pinned ? '已取消置顶。' : '已置顶。');
    } finally {
      setBusy(false);
      list.querySelector(`[data-id="${item.id}"] [data-action="pin"]`)?.focus({ preventScroll: true });
    }
  }
  add.addEventListener('click', () => openEditor(null, add));
  get('countdown-empty-add').addEventListener('click', event => openEditor(null, event.currentTarget));
  get('countdown-cancel').addEventListener('click', closeCurrent);
  get('countdown-delete-cancel').addEventListener('click', closeCurrent);
  viewAll.addEventListener('click', () => { showAll = !showAll; renderList(); });
  retry.addEventListener('click', () => { void load(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const input = { title: fields.title.value, targetDate: fields.targetDate.value, targetTime: fields.targetTime.value,
      color: fields.color.value, pinned: fields.pinned.checked };
    const checked = fields.targetTime.validity.badInput
      ? { ok: false, field: 'targetTime', message: '请输入完整有效的时间（00:00–23:59），或清空时间。' }
      : model.validateInput(input);
    Object.values(fields).forEach(element => element.removeAttribute('aria-invalid'));
    if (!checked.ok) {
      formError.textContent = checked.message; fields[checked.field]?.setAttribute('aria-invalid', 'true'); fields[checked.field]?.focus(); return;
    }
    formError.textContent = ''; setBusy(true);
    try {
      const result = editingId ? await invoke('updateCountdown', editingId, checked.value) : await invoke('createCountdown', checked.value);
      if (!result.ok) { formError.textContent = message(result); storageFailure(result); return; }
      saved(result.items, editingId ? '倒计时已更新。' : '倒计时已添加。'); closeDialog(editor, false);
    } finally {
      setBusy(false);
      if (!editor.open) restoreFocus();
      else get('countdown-save').focus();
    }
  });
  get('countdown-delete-confirm').addEventListener('click', async () => {
    if (busy) return; setBusy(true);
    try {
      const result = await invoke('deleteCountdown', deletingId);
      if (!result.ok) { get('countdown-delete-error').textContent = message(result); storageFailure(result); return; }
      saved(result.items, '倒计时已删除。'); closeDialog(deletion, false);
    } finally {
      setBusy(false);
      if (!deletion.open) restoreFocus();
      else get('countdown-delete-cancel').focus();
    }
  });
  for (const dialog of [editor, deletion]) {
    // Main forwards Escape; prevent the native dialog default from closing first
    // and accidentally allowing that same Escape to collapse the entire panel.
    dialog.addEventListener('cancel', event => { event.preventDefault(); if (!api?.onEscape) closeCurrent(); });
  }
  document.addEventListener('notch:escape', event => {
    if (!editor.open && !deletion.open) return;
    event.preventDefault(); closeCurrent();
  });
  document.addEventListener('notch:modechange', event => {
    // A temporary overview uses the standard four-card preview, never changes data.
    if (event.detail.expanded && event.detail.source === 'automatic') showAll = false;
    if (!event.detail.expanded) { closeDialog(editor, false); closeDialog(deletion, false); }
    refreshClock();
  });
  document.addEventListener('notch:tabchange', refreshClock);
  document.addEventListener('visibilitychange', refreshClock);
  window.addEventListener('focus', refreshClock);
  window.addEventListener('pagehide', () => { clearTimeout(refreshTimer); refreshTimer = null; });
  api?.onCollapseRequest?.((request) => {
    if (request?.token && window.NotchPanel?.getState().source !== 'automatic') return;
    closeDialog(editor, false); closeDialog(deletion, false);
  });
  api?.onCountdownsChanged?.(accept);
  api?.onCountdownClockRefresh?.(refreshClock);
  const ready = load();
  window.CountdownUI = Object.freeze({ ready, getState: () => ({ count: items.length, available, busy, showAll, refreshActive: refreshTimer !== null }) });
})();
