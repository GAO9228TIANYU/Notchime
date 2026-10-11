const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { CountdownStore } = require('../countdown-store');
const input = (title = '论文截止') => ({ title, targetDate: '2027-08-31', targetTime: null, color: '#438CFF', pinned: false });
async function fixture(t, options) {
  const root = path.join(__dirname, '..', '.cache', 'tests'); await fs.mkdir(root, { recursive: true });
  const directory = await fs.mkdtemp(path.join(root, 'countdown-store-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return { directory, store: new CountdownStore(directory, options) };
}
test('CRUD, duplicate names/unique IDs, pinning, stable sort and restart persistence', async t => {
  const { store, directory } = await fixture(t);
  assert.deepEqual(await store.list(), []);
  await assert.rejects(fs.stat(store.filePath), { code: 'ENOENT' });
  const first = (await store.create(input('  论文截止  ')))[0];
  const secondRows = await store.create(input()); assert.equal(secondRows.length, 2);
  const second = secondRows.find(row => row.id !== first.id); assert.notEqual(first.id, second.id);
  const pinned = await store.pin(second.id, true); assert.equal(pinned[0].id, second.id);
  const edited = await store.update(first.id, { ...input('考试'), targetDate: '2026-11-01', targetTime: '09:00', color: '#FF9352' });
  assert.equal(edited.find(row => row.id === first.id).title, '考试');
  assert.equal(edited.find(row => row.id === first.id).createdAt, first.createdAt);
  assert.deepEqual(await new CountdownStore(directory).list(), edited);
  assert.equal(JSON.parse(await fs.readFile(store.filePath, 'utf8')).schemaVersion, 1);
  const remaining = await store.remove(second.id); assert.equal(remaining.length, 1);
  await store.remove(first.id); assert.deepEqual(await new CountdownStore(directory).list(), []);
  if (process.platform !== 'win32') assert.equal((await fs.stat(store.filePath)).mode & 0o777, 0o600);
});
test('Main-side validation rejects bad writes and missing IDs without modifying data', async t => {
  const { store } = await fixture(t); await store.create(input()); const before = await fs.readFile(store.filePath, 'utf8');
  for (const change of [{ title: '' }, { targetDate: '2027-02-29' }, { targetTime: '24:00' }, { pinned: 1 }]) {
    await assert.rejects(store.create({ ...input(), ...change }), { code: 'invalid_input' });
  }
  await assert.rejects(store.remove('../workspace.json'), { code: 'invalid_id' });
  await assert.rejects(store.update('missing', input()), { code: 'not_found' });
  await assert.rejects(store.pin((await store.list())[0].id, 'yes'), { code: 'invalid_input' });
  assert.equal(await fs.readFile(store.filePath, 'utf8'), before);
});
test('concurrent requests serialize from fresh data; one failure does not poison the queue', async t => {
  const { store } = await fixture(t);
  const operations = Array.from({ length: 20 }, (_, i) => store.create(input(`item-${i}`)));
  const replies = await Promise.all(operations);
  assert.deepEqual(replies.map(rows => rows.length), Array.from({ length: 20 }, (_, i) => i + 1));
  const id = replies[0][0].id;
  const edits = await Promise.all([store.update(id, input('first')), store.pin(id, true), store.update(id, { ...input('last'), pinned: true })]);
  assert.equal(edits[2].find(row => row.id === id).title, 'last');
  await assert.rejects(store.create(input('')), { code: 'invalid_input' });
  assert.equal((await store.list()).length, 20);
  const disk = JSON.parse(await fs.readFile(store.filePath, 'utf8')); assert.equal(disk.items.length, 20);
  assert.equal(disk.items.find(row => row.id === id).title, 'last');
});
test('corrupt JSON/records and future schema remain byte-for-byte intact; repaired file can be retried', async t => {
  const { store } = await fixture(t);
  for (const [raw, code] of [['{broken', 'invalid_json'], ['{"schemaVersion":2,"items":[]}', 'unsupported_schema'], ['{"schemaVersion":1,"items":[{"id":"bad"}]}', 'invalid_store']]) {
    await fs.writeFile(store.filePath, raw);
    await assert.rejects(store.list(), { code }); await assert.rejects(store.create(input()), { code });
    assert.equal(await fs.readFile(store.filePath, 'utf8'), raw);
  }
  await fs.writeFile(store.filePath, '{"schemaVersion":1,"items":[]}');
  assert.equal((await store.create(input())).length, 1);
});
test('atomic write failure leaves original intact, cleans only its temporary file, reports failure', async t => {
  const { directory } = await fixture(t);
  let fail = false;
  const io = { ...fs, rename: async (...args) => { if (fail) throw Object.assign(new Error('disk failure'), { code: 'EIO' }); return fs.rename(...args); } };
  const store = new CountdownStore(directory, { io }); await store.create(input());
  const before = await fs.readFile(store.filePath, 'utf8'); fail = true;
  await assert.rejects(store.create(input('not saved')), { code: 'write_failed' });
  assert.equal(await fs.readFile(store.filePath, 'utf8'), before);
  assert.deepEqual(await fs.readdir(directory), ['countdowns.json']);
  fail = false; assert.equal((await store.create(input('retry'))).length, 2);
});
test('workspace/todo files stay untouched and external corruption after a successful read is not overwritten', async t => {
  const { directory, store } = await fixture(t);
  await fs.writeFile(path.join(directory, 'workspace.json'), 'legacy'); await fs.writeFile(path.join(directory, 'notch-todo-data'), 'todo');
  const row = (await store.create(input()))[0]; await fs.writeFile(store.filePath, 'damaged later');
  await assert.rejects(store.pin(row.id, true), { code: 'invalid_json' });
  assert.equal(await fs.readFile(store.filePath, 'utf8'), 'damaged later');
  assert.equal(await fs.readFile(path.join(directory, 'workspace.json'), 'utf8'), 'legacy');
  assert.equal(await fs.readFile(path.join(directory, 'notch-todo-data'), 'utf8'), 'todo');
});
