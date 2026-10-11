(function (root) {
  const STATES = ['authorized', 'notDetermined', 'denied', 'restricted', 'error'];
  function validId(id) { return typeof id === 'string' && id.length > 0 && id.length <= 512 && !/[\x00-\x1f\x7f]/.test(id); }
  function dateOnly(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y,m,d] = value.split('-').map(Number); const date = new Date(0);
    date.setFullYear(y,m-1,d); date.setHours(0,0,0,0);
    return y >= 1 && date.getFullYear() === y && date.getMonth() === m-1 && date.getDate() === d ? date : null;
  }
  function deadline(item) { return item.isAllDay ? dateOnly(item.dueDate) : new Date(item.dueDate); }
  function visibleItems(items, now = new Date()) {
    const today = new Date(now); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    return items.flatMap(item => {
      if (item.isCompleted || !item.dueDate) return [];
      const date = deadline(item); if (!date || !Number.isFinite(+date) || date >= tomorrow) return [];
      return [{ ...item, isOverdue: item.isAllDay ? date < today : date < now }];
    }).sort((a,b) => deadline(a)-deadline(b) || a.id.localeCompare(b.id));
  }
  function validateSnapshot(data) {
    if (!data || !STATES.includes(data.authorization) || !Array.isArray(data.items) || data.items.length > 20000) throw new Error('Invalid reminders response');
    const seen = new Set();
    for (const item of data.items) {
      if (!item || !validId(item.id) || seen.has(item.id) || typeof item.title !== 'string' || item.title.length > 10000 ||
        typeof item.listName !== 'string' || item.listName.length > 10000 || !/^#[0-9a-f]{6}$/i.test(item.listColor) ||
        typeof item.isAllDay !== 'boolean' || typeof item.isOverdue !== 'boolean' || item.isCompleted !== false ||
        typeof item.canComplete !== 'boolean' || typeof item.completionBlockedReason !== 'string' || item.completionBlockedReason.length > 512 ||
        typeof item.dueDate !== 'string' || !deadline(item) || !Number.isFinite(+deadline(item)) ||
        (!item.isAllDay && (!dateOnly(item.dueDate.slice(0,10)) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(item.dueDate))) ||
        typeof item.revision !== 'string' || !/^[a-f0-9]{64}$/.test(item.revision)) throw new Error('Invalid reminder');
      seen.add(item.id);
    }
    if (data.authorization !== 'authorized' && data.items.length) throw new Error('Unauthorized reminders response');
    return data;
  }
  const model = { validId, dateOnly, deadline, visibleItems, validateSnapshot, STATES };
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.RemindersModel = Object.freeze(model);
})(typeof window === 'object' ? window : globalThis);
