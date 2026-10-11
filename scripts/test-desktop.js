const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
env.CALENDAR_TEST_NODE = process.execPath;
// Automated regressions never access private system events/tasks or sign a Helper.
env.CALENDAR_SMOKE_REAL = '0';
const temporaryRoot = path.join(root, '.cache', 'tmp');
fs.mkdirSync(temporaryRoot, { recursive: true });
env.TMPDIR = temporaryRoot;
env.electron_config_cache = path.join(root, '.cache', 'electron');
process.env.TMPDIR = env.TMPDIR;
process.env.electron_config_cache = env.electron_config_cache;
function run(executable, args) {
  console.log(`Checking ${args.join(' ')}`);
  const result = spawnSync(executable, args, { cwd: root, env, stdio: 'inherit', timeout: 180000 });
  if (result.error) console.error(result.error);
  if (args[0]?.endsWith('.electron.js')) {
    // macOS restores foreground focus asynchronously after an app exits. Do not
    // launch the next GUI process inside that restoration transaction.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 800);
  }
  if (result.status !== 0) throw new Error(`Check failed (exit ${result.status}): ${args.join(' ')}`);
}
try {
  run(process.execPath, ['--test', ...fs.readdirSync(path.join(root, 'tests')).filter((name) => name.endsWith('.test.js')).map((name) => `tests/${name}`)]);
  // Include every active desktop module, script and test; no hard-coded legacy list.
  function javascriptFiles(directory) {
    return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
      const relative = path.join(directory, entry.name);
      return entry.isDirectory() ? javascriptFiles(relative) : entry.name.endsWith('.js') ? [relative] : [];
    });
  }
  const syntaxFiles = [...fs.readdirSync(root).filter(name => name.endsWith('.js')),
    ...['renderer', 'scripts', 'tests', 'build'].flatMap(javascriptFiles)];
  for (const file of syntaxFiles) {
    run(process.execPath, ['--check', file]);
  }
  const scratch = path.join(root, '.cache', 'tests');
  fs.mkdirSync(scratch, { recursive: true });
  for (const file of ['appearance', 'notch-focus', 'startup', 'countdown', 'calendar', 'automatic', 'reminders', 'security']) {
    const profile = fs.mkdtempSync(path.join(scratch, 'calendar-profile-'));
    env.CALENDAR_TEST_USER_DATA = profile;
    try {
      for (const phase of ['startup','calendar','automatic'].includes(file) ? ['initial', 'restart'] : file === 'countdown' ? ['crud', 'restart', 'corrupt'] : ['']) {
        env.CALENDAR_TEST_PHASE = phase;
        const runtimeRoot = path.dirname(require.resolve('electron'));
        const runtime = path.join(runtimeRoot, 'dist', fs.readFileSync(path.join(runtimeRoot, 'path.txt'), 'utf8').trim());
        if (!fs.existsSync(runtime)) throw new Error('Electron runtime missing; tests do not install dependencies');
        run(runtime, [`tests/${file}.electron.js`]);
      }
    } finally {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  }
  run(process.execPath, ['scripts/smoke-app.js']);
  console.log('PASS desktop suite: fixture automation and npm source startup (native reads require explicit CALENDAR_SMOKE_REAL=1)');
} catch (error) {
  console.error(error.message); process.exitCode = 1;
}
