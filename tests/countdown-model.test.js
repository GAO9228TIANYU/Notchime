const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const model = require('../renderer/countdown-model');
const item = (targetDate, targetTime = null) => ({ targetDate, targetTime });
const today = new Date(2026, 9, 11, 12);
test('natural days: today/tomorrow/yesterday, month/year boundaries, leap year', () => {
  for (const [date, now, days, label] of [
    ['2026-10-11', today, 0, '今天'], ['2026-10-12', today, 1, '还有 1 天'], ['2026-10-10', today, -1, '已过去 1 天'],
    ['2026-11-01', new Date(2026, 9, 31, 23, 59), 1, '还有 1 天'],
    ['2027-01-01', new Date(2026, 11, 31, 23, 59), 1, '还有 1 天'],
    ['2028-03-01', new Date(2028, 1, 28), 2, '还有 2 天'],
  ]) assert.deepEqual(model.calculateCountdown(item(date), now), { days, label, status: days === 0 ? 'today' : days > 0 ? 'future' : 'past' });
});
test('validation rejects empty/long/control names, invalid dates/times/colors/pinned states', () => {
  const base = { title: '  论文截止  ', targetDate: '2028-02-29', targetTime: '09:00' };
  assert.equal(model.validateInput(base).value.title, '论文截止');
  assert.equal(model.validateInput({ ...base, targetTime: '' }).value.targetTime, null);
  for (const change of [
    { title: '  ' }, { title: 'a'.repeat(81) }, { title: 'a\nb' }, { title: 123 },
    { targetDate: '2027-02-29' }, { targetDate: '2028-02-30' }, { targetDate: '2026-04-31' },
    { targetDate: '2026-13-01' }, { targetDate: '2026-00-01' }, { targetDate: '2026-01-00' },
    { targetDate: '2026-1-01' }, { targetDate: '0000-01-01' }, { targetDate: '' },
    { targetTime: '24:00' }, { targetTime: '12:60' }, { targetTime: '9:00' }, { targetTime: '09:00:00' },
    { color: 'red' }, { pinned: 'true' },
  ]) assert.equal(model.validateInput({ ...base, ...change }).ok, false, JSON.stringify(change));
});
test('specific local time distinguishes before/exact/after and near-time hours/minutes', () => {
  const target = item('2026-10-11', '14:00');
  assert.equal(model.calculateCountdown(target, today).label, '还有 2 小时');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 11, 13, 30)).label, '还有 30 分钟');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 11, 13, 59, 40)).label, '即将到达');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 11, 14)).status, 'now');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 11, 14, 0, 20)).label, '刚刚过去');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 11, 15)).label, '已过去 1 小时');
});
test('sorting is pinned then local target time then creation time and id, without mutation', () => {
  const a = { id: 'b', pinned: false, targetDate: '2026-10-11', targetTime: null, createdAt: 1 };
  const b = { ...a, id: 'a' }, c = { ...a, id: 'c', pinned: true, targetDate: '2027-01-01' };
  const d = { ...a, id: 'd', targetTime: '09:00' }, e = { ...a, id: 'e', createdAt: 2 };
  const input = [d, a, c, e, b];
  assert.deepEqual(model.sortCountdowns(input).map(row => row.id), ['c', 'a', 'b', 'e', 'd']);
  assert.equal(input[0], d);
  assert.deepEqual(model.sortCountdowns([...input].reverse()).map(row => row.id), ['c', 'a', 'b', 'e', 'd']);
});
test('midnight and resume recompute from now, with minute-aligned coarse scheduling', () => {
  const target = item('2026-10-12');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 11, 23, 59, 59)).label, '还有 1 天');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 12)).label, '今天');
  assert.equal(model.calculateCountdown(target, new Date(2026, 9, 13, 9)).label, '已过去 1 天');
  assert.equal(model.nextRefreshDelay(new Date(2026, 9, 11, 23, 59, 59, 999)), 1);
  assert.equal(model.nextRefreshDelay(new Date(2026, 9, 11, 12, 30, 0)), 60000);
});
test('DST spring/fall natural days and floating local time work in real timezone contexts', () => {
  const script = `const a=require('node:assert/strict'),m=require(${JSON.stringify(require.resolve('../renderer/countdown-model'))});
    a.equal(m.calculateCountdown({targetDate:'2026-03-09'},new Date(2026,2,8)).days,1);
    a.equal(m.calculateCountdown({targetDate:'2026-11-02'},new Date(2026,10,1)).days,1);
    a.equal(m.calculateCountdown({targetDate:'2026-03-08',targetTime:'03:30'},new Date(2026,2,8,1,30)).label,'还有 1 小时');
    a.equal(m.validateInput({title:'x',targetDate:'2026-03-08',targetTime:'02:30'}).ok,false);
    a.equal(m.calculateCountdown({targetDate:'2026-03-08',targetTime:'02:30'},new Date(2026,2,8)).status,'unavailable');
    a.equal(m.calculateCountdown({targetDate:'2026-11-01',targetTime:'23:30'},new Date(2026,10,1)).label,'还有 24 小时 30 分钟');
    a.equal(m.calculateCountdown({targetDate:'2026-11-01',targetTime:'01:30'},new Date('2026-11-01T05:30:00Z')).status,'now');`;
  const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', env: { ...process.env, TZ: 'America/New_York' } });
  assert.equal(result.status, 0, result.stderr);
  for (const tz of ['Asia/Seoul', 'America/Los_Angeles', 'Pacific/Auckland']) {
    const result = spawnSync(process.execPath, ['-e', `const m=require(${JSON.stringify(require.resolve('../renderer/countdown-model'))}); if(m.calculateCountdown({targetDate:'2026-10-12'},new Date(2026,9,11,23,50)).days!==1)process.exit(1)`], { env: { ...process.env, TZ: tz } });
    assert.equal(result.status, 0, tz);
  }
});
