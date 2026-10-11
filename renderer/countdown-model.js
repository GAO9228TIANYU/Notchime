/* Countdown model only: no Electron, filesystem, CalendarEvent or todo state. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CountdownModel = api;
})(typeof window === 'object' ? window : globalThis, function () {
  const COLORS = Object.freeze(['#438CFF', '#30D978', '#FF9352', '#FF5F57', '#B58CFF']);
  const DAY_MS = 86400000;
  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] ? { year, month, day } : null;
  }
  function parseTime(value) {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hour, minute] = value.split(':').map(Number);
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
  }
  function dateOrdinal({ year, month, day }) {
    // UTC is only a Gregorian day-number calculation, never the event timezone.
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day); date.setUTCHours(0, 0, 0, 0);
    return date.getTime() / DAY_MS;
  }
  function localParts(date) { return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }; }
  function targetInstant(targetDate, targetTime) {
    const date = parseDate(targetDate), time = parseTime(targetTime);
    if (!date || !time) return null;
    const value = new Date(0);
    value.setFullYear(date.year, date.month - 1, date.day); value.setHours(time.hour, time.minute, 0, 0);
    // Reject a skipped wall-clock time (spring DST). Fall DST uses the earlier
    // occurrence chosen by JavaScript Date; targets float in the current timezone.
    if (value.getFullYear() !== date.year || value.getMonth() + 1 !== date.month || value.getDate() !== date.day
      || value.getHours() !== time.hour || value.getMinutes() !== time.minute) return null;
    return value;
  }
  function validateInput(input, { checkLocalTime = true } = {}) {
    const fail = (field, message) => ({ ok: false, error: 'invalid_input', field, message });
    if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('title', '请填写倒计时信息。');
    if (typeof input.title !== 'string' || !input.title.trim()) return fail('title', '请输入名称。');
    const title = input.title.trim();
    if (title.length > 80 || /[\u0000-\u001f\u007f]/.test(title)) return fail('title', '名称最多 80 个字符，不能包含控制字符。');
    if (!parseDate(input.targetDate)) return fail('targetDate', '请输入有效日期（YYYY-MM-DD）。');
    const targetTime = input.targetTime === '' || input.targetTime == null ? null : input.targetTime;
    if (targetTime !== null && !parseTime(targetTime)) return fail('targetTime', '请输入有效时间（00:00–23:59）。');
    if (targetTime !== null && checkLocalTime && !targetInstant(input.targetDate, targetTime)) return fail('targetTime', '该时间在当前时区不存在，请避开夏令时跳过的时段。');
    const color = input.color === undefined ? COLORS[0] : input.color;
    if (!COLORS.includes(color)) return fail('color', '请选择预设颜色。');
    if (input.pinned !== undefined && typeof input.pinned !== 'boolean') return fail('pinned', '置顶状态无效。');
    return { ok: true, value: { title, targetDate: input.targetDate, targetTime, color, pinned: input.pinned === true } };
  }
  function sortCountdowns(items) {
    return [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned)
      || a.targetDate.localeCompare(b.targetDate)
      || (a.targetTime || '00:00').localeCompare(b.targetTime || '00:00')
      || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }
  function calculateCountdown(item, now = new Date()) {
    const date = parseDate(item.targetDate);
    if (!date || !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new TypeError('Invalid countdown date');
    const days = dateOrdinal(date) - dateOrdinal(localParts(now));
    if (!item.targetTime) return { days, status: days === 0 ? 'today' : days > 0 ? 'future' : 'past',
      label: days === 0 ? '今天' : days > 0 ? `还有 ${days} 天` : `已过去 ${-days} 天` };
    const instant = targetInstant(item.targetDate, item.targetTime);
    if (!instant) return { days, status: 'unavailable', label: '本地时间不存在' };
    const delta = instant.getTime() - now.getTime();
    if (delta === 0) return { days, status: 'now', label: '现在' };
    const future = delta > 0, elapsed = Math.abs(delta);
    let label;
    if (elapsed >= DAY_MS && days !== 0) label = future ? `还有 ${Math.max(1, days)} 天` : `已过去 ${Math.max(1, -days)} 天`;
    else if (elapsed < 60000) label = future ? '即将到达' : '刚刚过去';
    else {
      const minutes = future ? Math.ceil(elapsed / 60000) : Math.floor(elapsed / 60000);
      const hours = Math.floor(minutes / 60), rest = minutes % 60;
      label = `${future ? '还有' : '已过去'} ${hours ? `${hours} 小时${rest ? ` ${rest} 分钟` : ''}` : `${minutes} 分钟`}`;
    }
    return { days, status: future ? 'future' : 'past', label };
  }
  function nextRefreshDelay(now = new Date()) {
    // Minute-aligned refresh also catches clock/timezone changes. No second tick.
    const midnight = new Date(now); midnight.setDate(midnight.getDate() + 1); midnight.setHours(0, 0, 0, 0);
    return Math.max(1, Math.min(60000 - (now.getSeconds() * 1000 + now.getMilliseconds()), midnight - now));
  }
  return Object.freeze({ COLORS, parseDate, parseTime, dateOrdinal, validateInput, sortCountdowns, calculateCountdown, nextRefreshDelay });
});
