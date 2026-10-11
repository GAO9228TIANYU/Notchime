// Offline, explicitly confirmed import only. Never invoked by app startup/IPC.
const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { decodeStore } = require('../countdown-store');
const { validateSelection } = require('../calendar-provider');
const { normalizeAutoCollapseSeconds, normalizeReminderMinutes } = require('../calendar-settings');
const LEGACY_IDENTITY = { name: 'Calendar Notch Dev', bundleId: 'com.calendarnotch.dev' };
const FILES = ['countdowns.json', 'app-settings.json', 'calendar-preferences.json', 'calendar-reminder-receipts.json'];
const MANIFEST = '.notchime-import.json';
const hash = value => createHash('sha256').update(value).digest('hex');
const failure = code => Object.assign(new Error(`Profile import refused (${code}); original data preserved.`), { code });
async function boundedRead(file, limit, io) {
  const handle = await io.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw failure('invalid_file');
    const buffer = Buffer.alloc(limit + 1); let length = 0;
    while (length < buffer.length) { const result = await handle.read(buffer, length, buffer.length - length, null); if (!result.bytesRead) break; length += result.bytesRead; }
    if (length > limit) throw failure('oversized');
    return buffer.subarray(0, length);
  } finally { await handle.close(); }
}
function validateFile(name, raw) {
  let data;
  try { data = JSON.parse(raw.toString('utf8')); } catch { throw failure('invalid_json'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw failure('invalid_json_shape');
  if (name === 'countdowns.json') { try { decodeStore(raw.toString('utf8')); } catch { throw failure('invalid_countdowns'); } }
  if (name === 'app-settings.json') {
    if (data.autoCollapseSeconds !== undefined && normalizeAutoCollapseSeconds(data.autoCollapseSeconds) !== data.autoCollapseSeconds) throw failure('invalid_settings');
    if (data.reminderMinutes !== undefined && normalizeReminderMinutes(data.reminderMinutes) !== data.reminderMinutes) throw failure('invalid_settings');
    // Preserve valid unknown/window preference fields verbatim, without executing them.
  }
  if (name === 'calendar-preferences.json') {
    if (data.schemaVersion !== 1) throw failure('invalid_schema');
    if (data.selectedCalendarIds !== null) validateSelection(data.selectedCalendarIds);
  }
  if (name === 'calendar-reminder-receipts.json') {
    if (data.schemaVersion !== 1 || !Array.isArray(data.receipts) || data.receipts.length > 5000 ||
      data.receipts.some(r => !r || !/^[a-f0-9]{64}$/.test(r.key) || !Number.isFinite(r.expiresAt))) throw failure('invalid_receipts');
  }
}
async function importDevelopmentProfile({ source, destination, confirmed = false, io = fs }) {
  if (confirmed !== true) throw failure('confirmation_required');
  if (typeof source !== 'string' || typeof destination !== 'string' || !path.isAbsolute(source) || !path.isAbsolute(destination)) throw failure('explicit_absolute_paths_required');
  const original = await io.realpath(source), target = path.resolve(destination), parent = path.dirname(target);
  if (original !== path.resolve(source) || !((await io.lstat(original)).isDirectory()) || await io.realpath(parent) !== parent) throw failure('symlink_or_invalid_directory');
  if (target === original || target.startsWith(original + path.sep) || original.startsWith(target + path.sep) || ['Dynamic Panel', 'TO-DO Panel', 'notch-todo-data'].includes(path.basename(original))) throw failure('unsafe_source');
  const entries = [];
  for (const name of FILES) {
    try { const raw = await boundedRead(path.join(original, name), name === 'countdowns.json' ? 2*1024*1024 : 1024*1024, io); validateFile(name, raw); entries.push({ name, raw, digest: hash(raw) }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!entries.some(e => e.name === 'countdowns.json' || e.name === 'calendar-preferences.json')) throw failure('unrecognized_profile');
  const fingerprint = hash(JSON.stringify(entries.map(({name,digest}) => [name,digest])));
  try {
    const stat = await io.lstat(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw failure('destination_exists');
    let prior;
    try { prior = JSON.parse((await boundedRead(path.join(target, MANIFEST), 16384, io)).toString('utf8')); } catch { throw failure('destination_exists'); }
    if (prior.schemaVersion === 1 && prior.sourceFingerprint === fingerprint && prior.completed === true) return { status: 'already_imported', files: entries.map(e=>e.name) };
    throw failure('destination_exists');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const stage = await io.mkdtemp(path.join(parent, '.notchime-import-stage-'));
  const created = []; let ownsTarget = false;
  try {
    for (const entry of entries) {
      const file = await io.open(path.join(stage, entry.name), 'wx', 0o600);
      try { await file.writeFile(entry.raw); await file.sync(); } finally { await file.close(); }
    }
    // Exclusive directory claim; concurrent imports/existing profiles cannot be overwritten.
    await io.mkdir(target, {mode:0o700}); ownsTarget = true;
    for (const entry of entries) { await io.link(path.join(stage, entry.name), path.join(target,entry.name)); created.push(entry.name); }
    // Login items and TCC are OS state, not imported profile data. Do not register
    // a new login item merely because an old profile was explicitly imported.
    await io.writeFile(path.join(target,'.first-run-done'), 'Explicit offline import; login registration requires user action.\n', {flag:'wx',mode:0o600}); created.push('.first-run-done');
    await io.writeFile(path.join(target,MANIFEST), JSON.stringify({schemaVersion:1,operationId:randomUUID(),sourceIdentity:LEGACY_IDENTITY,sourceFingerprint:fingerprint,files:entries.map(({name,digest})=>({name,digest})),completed:true},null,2)+'\n',{flag:'wx',mode:0o600}); created.push(MANIFEST);
    await io.rm(stage, {recursive:true});
    return { status:'imported',files:entries.map(e=>e.name) };
  } catch (error) {
    if (ownsTarget) { for (const name of created.reverse()) await io.unlink(path.join(target,name)).catch(()=>{}); await io.rmdir(target).catch(()=>{}); }
    // Validated staging copy remains available for recovery; never remove the source.
    throw Object.assign(failure('import_failed'), { cause:error, recoveryStage:stage });
  }
}
if (require.main === module) {
  const args=process.argv.slice(2);
  if (args.length !== 5 || args[0] !== '--source' || args[2] !== '--destination' || args[4] !== '--confirm-development-profile') {
    console.error('Usage: node scripts/import-development-profile.js --source <confirmed backup directory> --destination <nonexistent Notchime directory> --confirm-development-profile'); process.exitCode=1;
  } else importDevelopmentProfile({source:args[1],destination:args[3],confirmed:true}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);if(error.recoveryStage)console.error('Recovery staging directory:',error.recoveryStage);process.exitCode=1;});
}
module.exports = { importDevelopmentProfile, LEGACY_IDENTITY, FILES };
