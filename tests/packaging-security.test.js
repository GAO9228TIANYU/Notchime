const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { FuseV1Options } = require('@electron/fuses');
const { FUSE_SETTINGS } = require('../build/afterPack');
const { assertBuildBundle, clearSigningMetadata, verifyBundle, stripUnusedPrivacyDescriptions } = require('../build/signing');
const root = path.resolve(__dirname, '..');
test('Hardened Runtime EventKit access is limited to Main and the native Helper', () => {
  const main = fs.readFileSync(path.join(root,'build/entitlements.mac.plist'),'utf8');
  const native = fs.readFileSync(path.join(root,'build/entitlements.eventkit.plist'),'utf8');
  const inherited = fs.readFileSync(path.join(root,'build/entitlements.electron-helper.plist'),'utf8');
  assert.match(main,/com\.apple\.security\.personal-information\.calendars/);
  assert.deepEqual([...native.matchAll(/<key>(.*?)<\/key>/g)].map(m=>m[1]), ['com.apple.security.personal-information.calendars']);
  assert.doesNotMatch(inherited,/personal-information|automation|device/);
  assert.equal(require('../package.json').build.mac.entitlementsInherit,'build/entitlements.electron-helper.plist');
  for (const text of [main,native,inherited]) assert.doesNotMatch(text,/device.camera|device.audio-input|automation.apple-events|addressbook|get-task-allow/);
});
test('product About contains only Notchime and its current maintainer; legal notices remain bundled', () => {
  const main = fs.readFileSync(path.join(root,'main.js'),'utf8');
  const about = main.slice(main.indexOf('function showAbout()'),main.indexOf('function requestRendererExpand'));
  assert.doesNotMatch(about,/TO-DO Panel|xiaopu-ai|Dynamic Panel|Calendar Notch Dev/);
  assert.match(about,/GAO TIANYU/);
  const config=require('../package.json').build;
  assert.equal(config.mac.extendInfo.CFBundleDisplayName,'Notchime');
  assert.equal(config.copyright,'© 2026 GAO TIANYU');
  for(const file of ['LICENSE','NOTICE','THIRD_PARTY_NOTICES.md']) {assert.ok(config.files.includes(file));assert.ok(fs.existsSync(path.join(root,file)));}
});
test('packaging strips inherited media/Bluetooth descriptions without changing EventKit or identity', t => {
  const scratch = fs.mkdtempSync(path.join(root, '.cache/tests/signing-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const bundle = path.join(scratch, 'Test.app'); fs.mkdirSync(path.join(bundle, 'Contents'), {recursive:true});
  const plist = path.join(bundle, 'Contents/Info.plist');
  const expected = {CFBundleIdentifier:'com.test',NSCalendarsFullAccessUsageDescription:'read',NSRemindersFullAccessUsageDescription:'complete'};
  fs.writeFileSync(plist, JSON.stringify({...expected,NSCameraUsageDescription:'unused',NSMicrophoneUsageDescription:'unused',NSAudioCaptureUsageDescription:'unused',NSBluetoothAlwaysUsageDescription:'unused',NSBluetoothPeripheralUsageDescription:'unused'}));
  stripUnusedPrivacyDescriptions(bundle);
  const actual = JSON.parse(require('node:child_process').execFileSync('plutil',['-convert','json','-o','-',plist],{encoding:'utf8'}));
  assert.deepEqual(actual, expected);
});
test('packaged code requires ASAR integrity and disables Node environment/inspector entry points', () => {
  assert.equal(require('../package.json').build.asar, true);
  for (const option of [FuseV1Options.RunAsNode, FuseV1Options.EnableNodeOptionsEnvironmentVariable, FuseV1Options.EnableNodeCliInspectArguments]) assert.equal(FUSE_SETTINGS[option], false);
  for (const option of [FuseV1Options.EnableEmbeddedAsarIntegrityValidation, FuseV1Options.OnlyLoadAppFromAsar]) assert.equal(FUSE_SETTINGS[option], true);
  // Do not blindly disable file:// behavior or change cookie storage identity.
  assert.equal(FUSE_SETTINGS[FuseV1Options.GrantFileProtocolExtraPrivileges], undefined);
  assert.equal(FUSE_SETTINGS[FuseV1Options.EnableCookieEncryption], undefined);
});
test('strict verification retries metadata races but never ignores signature failures', t => {
  const scratch = fs.mkdtempSync(path.join(root, '.cache/tests/signing-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const bundle = path.join(scratch, 'Test.app'); fs.mkdirSync(bundle);
  let attempts = 0;
  verifyBundle(bundle, (command, args) => {
    if (command === 'xattr') return '';
    assert.deepEqual(args, ['--verify', '--deep', '--strict', bundle]);
    if (++attempts === 1) throw Object.assign(new Error('metadata'), {stderr:'resource fork, Finder information, or similar detritus not allowed'});
  });
  assert.equal(attempts, 2);
  attempts = 0;
  assert.throws(() => verifyBundle(bundle, command => {
    if (command === 'xattr') return '';
    attempts += 1; throw Object.assign(new Error('bad seal'), {stderr:'a sealed resource is missing or invalid'});
  }), /bad seal/);
  assert.equal(attempts, 1);
  attempts = 0;
  assert.throws(() => verifyBundle(bundle, command => {
    if (command === 'xattr') return '';
    attempts += 1; throw Object.assign(new Error('persistent metadata'), {stderr:'resource fork, Finder information, or similar detritus not allowed'});
  }), /persistent metadata/);
  assert.equal(attempts, 3);
});
test('signing cleanup cannot touch installed apps or follow a symlink outside build directories', t => {
  const scratch = fs.mkdtempSync(path.join(root, '.cache/tests/signing-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const bundle = path.join(scratch, 'Test.app'); fs.mkdirSync(bundle);
  assert.equal(assertBuildBundle(bundle), fs.realpathSync(bundle));
  assert.throws(() => assertBuildBundle(root));
  const link = path.join(scratch, 'Outside.app'); fs.symlinkSync(path.join(root, 'renderer'), link);
  assert.throws(() => assertBuildBundle(link));
  assert.throws(() => assertBuildBundle('/Applications'), /restricted/);
});
test('metadata cleanup removes only signing-forbidden attributes and handles a reappearing root attribute', t => {
  const scratch = fs.mkdtempSync(path.join(root, '.cache/tests/signing-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const bundle = path.join(scratch, 'Test.app'); fs.mkdirSync(bundle);
  const calls=[];
  clearSigningMetadata(bundle, (command,args) => {
    calls.push([command,...args]);
    return args.length === 1 ? 'com.apple.FinderInfo\ncom.apple.fileprovider.fpfs#P\ncom.apple.provenance\n' : '';
  });
  assert.deepEqual(calls, [
    ['xattr','-dr','com.apple.FinderInfo',bundle],
    ['xattr','-dr','com.apple.ResourceFork',bundle],
    ['xattr',bundle],['xattr','-d','com.apple.FinderInfo',bundle],
  ]);
});
