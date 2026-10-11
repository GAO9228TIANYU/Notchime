const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const config = require('../package.json');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('product copy and current maintainer are distinct from preserved development identity', () => {
  assert.deepEqual(config.author, {name:'GAO TIANYU',email:'tianyu.gaospk@gmail.com',url:'https://github.com/GAO9228TIANYU'});
  assert.equal(config.build.productName, 'Calendar Notch Dev');
  assert.equal(config.build.appId, 'com.calendarnotch.dev');
  assert.match(read('main.js'), /const APP_NAME = 'Calendar Notch Dev'/);
  assert.match(read('main.js'), /const PRODUCT_NAME = 'Notchime'/);
  assert.match(read('main.js'), /appName: PRODUCT_NAME/);
  assert.match(read('renderer/index.html'), /<title>Notchime<\/title>/);
  assert.match(read('main.js'), /There When You Need It\. Quiet When You Don't\./);
  assert.match(read('NOTICE'), /TO-DO Panel v1\.2\.0/);
});

test('the original MIT text is retained and distribution declares required legal texts', () => {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'LICENSE'))).digest('hex'),
    '7ab44bafe3a01fcb339a41791facd9125e27113b2715ceada87ddaa81ebd0c47');
  for (const file of ['LICENSE','NOTICE','THIRD_PARTY_NOTICES.md']) assert.ok(config.build.files.includes(file));
  for (const name of ['LICENSE','LICENSES.chromium.html']) {
    const entry=config.build.extraResources.find(e=>e.to === `licenses/electron/${name}`);
    assert.ok(entry); assert.ok(fs.existsSync(path.join(root,entry.from)));
  }
});

test('application sources are explicit and exclude tests, private evidence and historical media', () => {
  const positive=config.build.files.filter(f=>!f.startsWith('!'));
  assert.ok(positive.every(f=>!f.includes('*')), 'No open-ended application resource glob');
  assert.deepEqual(positive.filter(f=>f.startsWith('renderer/')).sort(),
    fs.readdirSync(path.join(root,'renderer')).filter(f=>/\.(js|css|html)$/.test(f)).map(f=>'renderer/'+f).sort());
  for (const file of positive) { assert.ok(fs.existsSync(path.join(root,file))); assert.doesNotMatch(file,/^(?:docs|tests|promo|\.cache|\.claude)\//); }
  assert.ok(config.build.files.includes('!{.cache,.claude,docs,promo,tests,scripts}/**'));
  assert.equal(config.build.extraResources.filter(e=>e.from.startsWith('.cache')).length,1);
  assert.equal(config.build.extraResources[0].from,'.cache/native/CalendarNotchCalendarHelper.app');
});

test('supplied icon is a structurally valid ICNS and old build icon is no longer active', () => {
  assert.equal(config.build.mac.icon, 'build/notchime-icon.icns');
  assert.equal(fs.existsSync(path.join(root,'build/to-do-panel-icon.icns')),false);
  const data=fs.readFileSync(path.join(root,config.build.mac.icon));
  assert.equal(data.toString('ascii',0,4),'icns'); assert.equal(data.readUInt32BE(4),data.length);
  let offset=8;const kinds=new Set();
  while(offset<data.length){const size=data.readUInt32BE(offset+4);assert.ok(size>=8 && offset+size<=data.length);kinds.add(data.toString('ascii',offset,offset+4));offset+=size;}
  assert.equal(offset,data.length);
  for(const kind of ['ic04','ic05','ic07','ic08','ic09','ic10','ic11','ic12','ic13','ic14'])assert.ok(kinds.has(kind),kind);
});

test('development guidance no longer authorizes hidden hooks or obsolete product behavior', () => {
  const settings=JSON.parse(read('.claude/settings.json'));
  assert.equal(settings.hooks,undefined); assert.equal(settings.permissions.allow,undefined);
  assert.ok(settings.permissions.deny.includes('Bash(git *)'));
  assert.match(read('AGENTS.md'),/已实现启动\/唤醒\/解锁概览/);
  assert.match(read('AGENTS.md'),/生产错误不得显示 Mock/);
  assert.doesNotMatch(read('AGENTS.md'),/目前仅手动使用，没有自动唤出/);
});
