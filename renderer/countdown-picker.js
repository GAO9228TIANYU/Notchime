// In-page pickers: no Chromium native date/time popup or extra BrowserWindow.
(function () {
  function create({ dateInput, timeInput, dateButton, timeButton, api }) {
    const get = id => document.getElementById(id), model = window.CountdownModel;
    const dialog = get('countdown-picker-dialog'), days = get('countdown-picker-days');
    const yearInput = get('countdown-picker-year'), monthInput = get('countdown-picker-month');
    const hourInput = get('countdown-picker-hour'), minuteInput = get('countdown-picker-minute');
    const error = get('countdown-picker-error');
    let cursor, returnFocus;
    const pad = value => String(value).padStart(2, '0');
    const format = date => `${String(date.year).padStart(4, '0')}-${pad(date.month)}-${pad(date.day)}`;
    const today = () => { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }; };
    function utc(date) {
      const value = new Date(0); value.setUTCFullYear(date.year, date.month - 1, date.day); value.setUTCHours(0, 0, 0, 0); return value;
    }
    function options(select, count, start = 0, label = pad) {
      for (let i = start; i < start + count; i++) {
        const option = document.createElement('option'); option.value = String(i); option.textContent = label(i); select.append(option);
      }
    }
    options(monthInput, 12, 1, value => `${value} 月`); options(hourInput, 24); options(minuteInput, 60);
    function close(restore = true) {
      if (!dialog.open) return false;
      dialog.close();
      if (restore && returnFocus?.isConnected && !returnFocus.disabled) returnFocus.focus({ preventScroll: true });
      returnFocus = null; return true;
    }
    function commit(input, value) {
      input.value = value; input.removeAttribute('aria-invalid');
      input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    }
    function renderMonth(focusDay = false) {
      const first = { ...cursor, day: 1 }, offset = (utc(first).getUTCDay() + 6) % 7;
      const selected = model.parseDate(dateInput.value), current = format(today());
      yearInput.value = cursor.year; monthInput.value = cursor.month;
      yearInput.removeAttribute('aria-invalid'); error.textContent = '';
      get('countdown-month-label').textContent = `${cursor.year} 年 ${cursor.month} 月`;
      get('countdown-month-prev').disabled = cursor.year === 1 && cursor.month === 1;
      get('countdown-month-next').disabled = cursor.year === 9999 && cursor.month === 12;
      const rows = [];
      for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
        const row = document.createElement('div'); row.className = 'countdown-date-row'; row.setAttribute('role', 'row');
        for (let column = 0; column < 7; column++) {
          const day = rowIndex * 7 + column - offset + 1, value = format({ ...cursor, day });
          if (day < 1 || !model.parseDate(value)) {
            const blank = document.createElement('span'); blank.setAttribute('role', 'gridcell'); blank.setAttribute('aria-disabled', 'true'); row.append(blank); continue;
          }
          const button = document.createElement('button'); button.type = 'button'; button.textContent = String(day);
          button.dataset.date = value; button.setAttribute('role', 'gridcell'); button.setAttribute('aria-label', `${cursor.year} 年 ${cursor.month} 月 ${day} 日`);
          button.setAttribute('aria-selected', String(selected && format(selected) === value || false));
          if (value === current) button.setAttribute('aria-current', 'date');
          button.tabIndex = day === cursor.day ? 0 : -1;
          button.addEventListener('click', () => commit(dateInput, value)); row.append(button);
        }
        rows.push(row);
      }
      days.replaceChildren(...rows);
      if (focusDay) days.querySelector('[tabindex="0"]')?.focus({ preventScroll: true });
    }
    function changeMonth(delta, focusDay = false) {
      const index = (cursor.year - 1) * 12 + cursor.month - 1 + delta;
      if (index < 0 || index >= 9999 * 12) return;
      cursor = { year: Math.floor(index / 12) + 1, month: index % 12 + 1, day: cursor.day };
      while (!model.parseDate(format(cursor))) cursor.day--;
      renderMonth(focusDay);
    }
    function open(kind, button) {
      if (button.disabled || !dateInput.closest('dialog').open) return;
      returnFocus = button; error.textContent = '';
      const dateMode = kind === 'date';
      get('countdown-date-picker').hidden = !dateMode; get('countdown-time-picker').hidden = dateMode;
      get('countdown-picker-title').textContent = dateMode ? '选择目标日期' : '选择目标时间';
      if (dateMode) { cursor = model.parseDate(dateInput.value) || today(); renderMonth(); }
      else {
        const selected = model.parseTime(timeInput.value), now = new Date();
        hourInput.value = selected?.hour ?? now.getHours(); minuteInput.value = selected?.minute ?? now.getMinutes();
      }
      dialog.showModal();
      (dateMode ? days.querySelector('[tabindex="0"]') : hourInput).focus({ preventScroll: true });
    }
    dateButton.addEventListener('click', () => open('date', dateButton));
    timeButton.addEventListener('click', () => open('time', timeButton));
    get('countdown-month-prev').addEventListener('click', () => changeMonth(-1));
    get('countdown-month-next').addEventListener('click', () => changeMonth(1));
    function selectMonth() {
      const year = Number(yearInput.value), month = Number(monthInput.value);
      if (!Number.isInteger(year) || year < 1 || year > 9999 || yearInput.validity.badInput) {
        yearInput.setAttribute('aria-invalid', 'true'); error.textContent = '请输入 1–9999 的有效年份。';
        days.querySelectorAll('button').forEach(button => { button.disabled = true; }); return;
      }
      if (!Number.isInteger(month) || month < 1 || month > 12) { error.textContent = '请选择有效月份。'; return; }
      cursor = { year, month, day: cursor.day };
      while (!model.parseDate(format(cursor))) cursor.day--;
      renderMonth();
    }
    yearInput.addEventListener('change', selectMonth); monthInput.addEventListener('change', selectMonth);
    yearInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); selectMonth(); days.querySelector('[tabindex="0"]')?.focus(); } });
    days.addEventListener('keydown', event => {
      const selected = model.parseDate(event.target.dataset.date); if (!selected) return;
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (['PageUp', 'PageDown'].includes(event.key)) {
        event.preventDefault(); cursor = selected; changeMonth(event.key === 'PageUp' ? -1 : 1, true); return;
      }
      const weekday = (utc(selected).getUTCDay() + 6) % 7;
      const offset = event.key === 'Home' ? -weekday : event.key === 'End' ? 6 - weekday : offsets[event.key];
      if (offset === undefined) return;
      event.preventDefault(); const next = utc(selected); next.setUTCDate(next.getUTCDate() + offset);
      const candidate = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
      if (!model.parseDate(format(candidate))) return;
      cursor = candidate; renderMonth(true);
    });
    get('countdown-picker-today').addEventListener('click', () => commit(dateInput, format(today())));
    get('countdown-picker-now').addEventListener('click', () => { const now = new Date(); hourInput.value = now.getHours(); minuteInput.value = now.getMinutes(); });
    get('countdown-picker-no-time').addEventListener('click', () => commit(timeInput, ''));
    get('countdown-picker-time-apply').addEventListener('click', () => {
      const value = `${pad(Number(hourInput.value))}:${pad(Number(minuteInput.value))}`;
      if (hourInput.value === '' || minuteInput.value === '' || !model.parseTime(value)) { error.textContent = '请选择有效的小时与分钟。'; return; }
      commit(timeInput, value);
    });
    for (const id of ['countdown-date-picker-cancel', 'countdown-time-picker-cancel']) get(id).addEventListener('click', () => close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); if (!api?.onEscape) close(); });
    return Object.freeze({ close });
  }
  window.CountdownPickers = Object.freeze({ create });
})();
