const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),p=require('../package.json'),lock=require('../package-lock.json');
test('Notchime 1.0.0 release identity, version, artifact and lock metadata are consistent',()=>{
  assert.equal(p.name,'notchime');assert.equal(p.version,'1.0.0');assert.equal(p.homepage,'https://github.com/GAO9228TIANYU/Notchime');
  assert.equal(p.build.appId,'com.notchime.app');assert.equal(p.build.productName,'Notchime');assert.equal(p.build.artifactName,'Notchime-${version}-${arch}.${ext}');assert.equal(p.build.dmg.title,'Notchime ${version}');
  for(const data of [lock,lock.packages['']]){assert.equal(data.name,p.name);assert.equal(data.version,p.version);}assert.deepEqual(p.build.mac.target,[{target:'dmg',arch:['arm64']}]);
  const native=fs.readFileSync(path.join(root,'native/calendar-helper/Info.plist'),'utf8');assert.match(native,/<key>CFBundleIdentifier<\/key><string>com.notchime.app.eventkit-helper<\/string>/);assert.match(native,/<key>CFBundleShortVersionString<\/key><string>1.0.0<\/string>/);assert.doesNotMatch(native,/com.calendarnotch|Calendar Notch Calendar/);
});
test('old identity is retained only for explicitly confirmed offline imports; startup does not read it',()=>{
  const main=fs.readFileSync(path.join(root,'main.js'),'utf8');assert.match(main,/const APP_NAME = 'Notchime'/);assert.doesNotMatch(main,/Calendar Notch Dev|com.calendarnotch|import-development-profile/);assert.match(main,/path.join\(app.getPath\('appData'\), APP_NAME\)/);
  assert.ok(!p.build.files.includes('scripts/import-development-profile.js'));
  const importer=require('../scripts/import-development-profile');assert.deepEqual(importer.LEGACY_IDENTITY,{name:'Calendar Notch Dev',bundleId:'com.calendarnotch.dev'});
});
test('release workflow cannot auto-publish and correctly verifies Notchime resources',()=>{
  const w=fs.readFileSync(path.join(root,'.github/workflows/release-dmg.yml'),'utf8');assert.doesNotMatch(w,/^\s{2}(push|release):|contents:\s*write|gh release|notarize|notarytool/m);assert.match(w,/ad-hoc RC/);assert.match(w,/CSC_IDENTITY_AUTO_DISCOVERY: "false"/);assert.match(w,/node scripts\/verify-release-bundle.js/);assert.match(w,/Notchime-\$\{version\}-arm64.dmg/);assert.doesNotMatch(w,/Calendar-Notch-Dev|Calendar Notch Dev/);
});
