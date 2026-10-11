// Build only inside this project. No developer certificate, installation or TCC changes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const bundle = path.join(root, '.cache/native/CalendarNotchCalendarHelper.app');
function build() {
  if (process.platform !== 'darwin') throw new Error('Calendar Notch requires macOS');
  const source = path.join(root, 'native/calendar-helper/main.swift');
  const reminderSource = path.join(root, 'native/calendar-helper/ReminderDate.swift');
  const plist = path.join(root, 'native/calendar-helper/Info.plist');
  const binary = path.join(bundle, 'Contents/MacOS/calendar-helper');
  const stamp = path.join(root, '.cache/native/build-hash');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).update(fs.readFileSync(plist)).update(fs.readFileSync(reminderSource))
    .update(fs.readFileSync(__filename)).digest('hex');
  if (fs.existsSync(binary) && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === hash) return bundle;
  const temp = path.join(root, '.cache/native/tmp');
  const moduleCache = path.join(root, '.cache/native/modules');
  fs.mkdirSync(path.dirname(binary), { recursive: true }); fs.mkdirSync(temp, { recursive: true });
  fs.mkdirSync(moduleCache, { recursive: true });
  fs.copyFileSync(plist, path.join(bundle, 'Contents/Info.plist'));
  const env = { ...process.env, TMPDIR: temp + path.sep, CLANG_MODULE_CACHE_PATH: moduleCache };
  execFileSync('xcrun', ['swiftc', '-disallow-use-new-driver', '-target', 'arm64-apple-macosx13.0', '-module-cache-path', moduleCache,
    '-framework', 'EventKit', '-framework', 'AppKit', reminderSource, source, '-o', binary], { cwd: root, env, stdio: 'inherit' });
  execFileSync('xattr', ['-cr', bundle], { cwd: root, env, stdio: 'inherit' });
  execFileSync('codesign', ['--force', '--sign', '-', '--identifier', 'com.calendarnotch.dev.calendar-helper',
    '--options', 'runtime', '--timestamp=none', bundle], { cwd: root, env, stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--strict', bundle], { cwd: root, env, stdio: 'inherit' });
  fs.writeFileSync(stamp, hash);
  console.log('Built EventKit Helper (Calendar read-only; Reminders completion only) (arm64, macOS 13+)');
  return bundle;
}
if (require.main === module) build();
module.exports = { build, bundle };
