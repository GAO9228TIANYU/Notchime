// Read-only verification of the actual packaged application; no signing/cleanup.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),asar=require('@electron/asar'),{getCurrentFuseWire}=require('@electron/fuses');
const config=require('../package.json');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const plist=file=>JSON.parse(execFileSync('plutil',['-convert','json','-o','-',file],{encoding:'utf8'}));
async function verifyReleaseBundle(bundle){
  const app=fs.realpathSync(bundle),resources=path.join(app,'Contents/Resources'),archive=path.join(resources,'app.asar');
  const info=plist(path.join(app,'Contents/Info.plist'));
  assert.equal(info.CFBundleIdentifier,'com.notchime.app');assert.equal(info.CFBundleDisplayName,'Notchime');assert.equal(info.CFBundleName,'Notchime');assert.equal(info.CFBundleExecutable,'Notchime');assert.equal(info.CFBundleShortVersionString,'1.0.0');assert.equal(info.CFBundleVersion,'1.0.0');assert.equal(info.LSMinimumSystemVersion,'13.0');
  const helper=path.join(resources,'native/NotchimeEventKitHelper.app'),helperInfo=plist(path.join(helper,'Contents/Info.plist'));
  assert.equal(helperInfo.CFBundleIdentifier,'com.notchime.app.eventkit-helper');assert.equal(helperInfo.CFBundleName,'Notchime EventKit');assert.equal(helperInfo.CFBundleShortVersionString,'1.0.0');assert.equal(helperInfo.CFBundleExecutable,'notchime-eventkit-helper');
  const frameworkApps=fs.readdirSync(path.join(app,'Contents/Frameworks')).filter(n=>n.endsWith('.app')).map(n=>path.join(app,'Contents/Frameworks',n));
  for(const target of [app,helper,...frameworkApps]){
    const metadata=plist(path.join(target,'Contents/Info.plist'));
    for(const key of Object.keys(metadata))assert.ok(!/^NS(?:Camera|Microphone|AudioCapture|Bluetooth|AppleEvents|Contacts|ScreenCapture)/.test(key),'Unneeded privacy description');
    if(target===app || target===helper)for(const key of ['NSCalendarsUsageDescription','NSCalendarsFullAccessUsageDescription','NSRemindersUsageDescription','NSRemindersFullAccessUsageDescription'])assert.ok(typeof metadata[key]==='string' && metadata[key].length>10);
    execFileSync('codesign',['--verify','--deep','--strict',target],{stdio:'pipe'});
    const ent=execFileSync('codesign',['-d','--entitlements',':-',target],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
    assert.doesNotMatch(ent,/allow-unsigned-executable-memory|allow-dyld-environment-variables|get-task-allow|device.camera|device.audio-input|automation.apple-events/);
    if(target===app || target===helper)assert.match(ent,/com.apple.security.personal-information.calendars/);
    else assert.doesNotMatch(ent,/personal-information/);
    if(target===helper)assert.doesNotMatch(ent,/cs.allow-jit|cs.disable-library-validation/);
  }
  const paths=asar.listPackage(archive),files=paths.filter(f=>!asar.statFile(archive,f.replace(/^\//,'')).files);
  assert.deepEqual(files.map(f=>f.slice(1)).sort(),config.build.files.filter(f=>!f.startsWith('!')).sort());
  for(const file of files){
    const name=file.slice(1),bytes=asar.extractFile(archive,name);
    assert.equal(digest(bytes),asar.statFile(archive,name).integrity.hash,name+' ASAR integrity');
    if(name==='package.json'){
      // Builder deliberately removes development/build metadata from the shipped
      // package. Require the exact remaining metadata, not a relaxed version match.
      const {devDependencies,build,scripts,contributors,...runtimeMetadata}=config;
      assert.deepEqual(JSON.parse(bytes.toString('utf8')),runtimeMetadata,'exact Builder production package metadata');
    } else assert.equal(digest(bytes),digest(fs.readFileSync(path.join(__dirname,'..',name))),name+' source bytes');
  }
  assert.ok(!paths.some(f=>/node_modules|\.cache|\/tests|\/promo|\/docs|\.env|AGENTS/.test(f)));
  const headerHash=digest(Buffer.from(asar.getRawHeader(archive).headerString));assert.equal(info.ElectronAsarIntegrity['Resources/app.asar'].hash,headerHash);
  assert.equal(digest(fs.readFileSync(path.join(resources,'icon.icns'))),digest(fs.readFileSync(path.join(__dirname,'../build/notchime-icon.icns'))));
  for(const name of ['LICENSE','LICENSES.chromium.html'])assert.equal(digest(fs.readFileSync(path.join(resources,'licenses/electron',name))),digest(fs.readFileSync(path.join(__dirname,'../node_modules/electron/dist',name))));
  const fuses=await getCurrentFuseWire(app);for(const n of [0,2,3])assert.equal(fuses[n],48);for(const n of [4,5])assert.equal(fuses[n],49);
  for(const file of [path.join(app,'Contents/MacOS/Notchime'),path.join(helper,'Contents/MacOS/notchime-eventkit-helper')])assert.equal(execFileSync('lipo',['-archs',file],{encoding:'utf8'}).trim(),'arm64');
  return{ok:true,name:info.CFBundleName,bundleId:info.CFBundleIdentifier,version:info.CFBundleShortVersionString,helperBundleId:helperInfo.CFBundleIdentifier,asarEntries:files.length,headerHash,fuses,strictDeepVerified:true,architecture:'arm64',iconVerified:true,legalTextsVerified:true};
}
if(require.main===module)verifyReleaseBundle(process.argv[2]).then(r=>console.log(JSON.stringify(r,null,2))).catch(()=>{console.error('Release bundle verification failed. Inspect metadata/signatures; artifact is not validated.');process.exitCode=1;});
module.exports={verifyReleaseBundle};
