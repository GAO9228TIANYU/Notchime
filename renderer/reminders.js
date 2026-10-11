(() => {
  const api = window.notchAPI, model = window.RemindersModel;
  const list = document.getElementById('reminders-list'), status = document.getElementById('reminders-status');
  const authorize = document.getElementById('reminders-authorize'), settings = document.getElementById('reminders-system-settings');
  const reload = document.getElementById('reminders-reload');
  let snapshot = { authorization: 'loading', items: [], error: null }, loading = null, message = '', accessPending = false;
  const pending = new Set();
  const labels = { loading: '正在读取提醒事项……', notDetermined: '允许访问 Apple Reminders 后，显示今天及已逾期的待办。仅在您点击时标记完成。',
    denied: '提醒事项访问已被拒绝或撤销。可在系统设置中允许；日历和倒计时仍可使用。', restricted: '提醒事项访问受系统限制。', error: '提醒事项暂时不可用，请重新加载。' };
  function render() {
    if (snapshot.authorization !== 'authorized') renderNow();
    else window.PanelMotion.run('reminders', renderNow);
  }
  function renderNow() {
    const items = snapshot.authorization === 'authorized' ? model.visibleItems(snapshot.items) : [];
    authorize.hidden = snapshot.authorization !== 'notDetermined'; authorize.disabled = accessPending;
    settings.hidden = !['denied','restricted'].includes(snapshot.authorization);
    reload.hidden = !['authorized','error','denied'].includes(snapshot.authorization);
    status.textContent = message || snapshot.error || labels[snapshot.authorization] || (items.length ? '' : '暂无今天到期或逾期的待办');
    list.replaceChildren(...items.map(item => {
      const row = document.createElement('article'); row.className = 'reminder-row'; row.classList.toggle('reminder-overdue', item.isOverdue);
      row.style.setProperty('--calendar-color', item.listColor);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'reminder-complete';
      button.dataset.id = item.id; button.disabled = pending.has(item.id) || !item.canComplete;
      button.setAttribute('aria-label', `${pending.has(item.id) ? '正在提交' : '完成'}：${item.title}`);
      button.title = item.canComplete ? '标记为已完成' : item.completionBlockedReason;
      button.textContent = pending.has(item.id) ? '…' : '○'; button.setAttribute('aria-busy', String(pending.has(item.id)));
      button.addEventListener('click', () => void complete(item.id));
      const text = document.createElement('div'); text.className = 'reminder-text';
      const title = document.createElement('span'); title.className = 'reminder-title'; title.textContent = item.title;
      const detail = document.createElement('span'); detail.className = 'reminder-detail';
      const date = model.deadline(item);
      const day = new Intl.DateTimeFormat('zh-CN', { month:'numeric', day:'numeric' }).format(date);
      const time = item.isAllDay ? '全天' : new Intl.DateTimeFormat('zh-CN', {hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
      detail.textContent = `${item.isOverdue ? '已逾期 · ' : ''}${day} ${time} · ${item.listName}${!item.canComplete ? ' · 请在提醒事项中完成' : ''}`;
      text.append(title, detail); row.append(button, text); return row;
    }));
  }
  function apply(value) { if (!value || !model.STATES.includes(value.authorization)) return; snapshot = value; render(); }
  async function refresh() {
    if (!api?.refreshReminders || loading) return loading;
    loading = (async () => {
      try { const result = await api.refreshReminders(); if (!result.ok) throw new Error(result.message); apply(result.snapshot); }
      catch { apply({ authorization:'error', items:[], error:'无法读取提醒事项，请重试。' }); }
      finally { loading = null; }
    })(); return loading;
  }
  async function complete(id) {
    if (pending.has(id)) return;
    pending.add(id); message = ''; render();
    try {
      const result = await api.completeReminder(id);
      if (!result.ok) { message = result.message; await refresh(); }
      else { apply(result.snapshot); message = result.snapshot.error ? '已完成，但列表刷新失败，请重新加载。' : ''; }
    } catch { message = '未能确认完成状态，请检查 Apple Reminders 后重新加载。'; }
    finally {
      pending.delete(id); render();
      // Keep keyboard control at the next item after a successful row removal.
      if (!document.activeElement || document.activeElement === document.body) (list.querySelector('button:not(:disabled)') || reload).focus({ preventScroll:true });
    }
  }
  authorize.addEventListener('click', async () => {
    if (accessPending) return; accessPending = true; message = ''; render();
    try { const result = await api.requestRemindersAccess(); if (!result.ok) message = result.message; else apply(result.snapshot); }
    catch { message = '授权操作失败，请重试。'; }
    finally { accessPending = false; render(); }
  });
  settings.addEventListener('click', async () => { try { const result = await api.openRemindersSettings(); if (!result.ok) message = result.message; } catch { message = '无法打开系统设置。'; } render(); });
  reload.addEventListener('click', () => { message = ''; void refresh(); });
  api?.onRemindersChanged?.(apply);
  api?.onCountdownClockRefresh?.(() => void refresh());
  document.addEventListener('notch:modechange', event => { if (event.detail.expanded) void refresh(); });
  document.addEventListener('notch:tabchange', event => { if (event.detail.tab === 'calendar') void refresh(); });
  // Only re-render the in-memory view; no minute-by-minute EventKit polling.
  const clock = setInterval(() => { if (window.NotchPanel?.getState().expanded) render(); }, 60000);
  window.addEventListener('beforeunload', () => clearInterval(clock), { once:true });
  window.RemindersUI = Object.freeze({ getSnapshot: () => snapshot, refresh });
  render(); void refresh();
})();
