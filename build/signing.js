// Build-only utilities. Never operate on an installed application or user profile.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = fs.realpathSync(path.join(__dirname, '..'));
const forbidden = ['com.apple.FinderInfo', 'com.apple.ResourceFork'];
const unusedPrivacyKeys = ['NSCameraUsageDescription', 'NSMicrophoneUsageDescription',
  'NSAudioCaptureUsageDescription', 'NSBluetoothAlwaysUsageDescription', 'NSBluetoothPeripheralUsageDescription'];
function assertBuildBundle(bundle) {
  const actual = fs.realpathSync(bundle);
  const allowed = ['dist.noindex', '.cache/native', '.cache/phase5e', '.cache/release-v1.0.0', '.cache/tests'];
  if (!actual.endsWith('.app') || !allowed.some(directory => actual.startsWith(path.join(root, directory) + path.sep))) {
    throw new Error('Signing cleanup is restricted to project build/test bundles');
  }
  return actual;
}
function clearSigningMetadata(bundle, run = execFileSync) {
  const actual = assertBuildBundle(bundle);
  for (const attribute of forbidden) run('xattr', ['-dr', attribute, actual], { stdio: 'pipe' });
  // File Provider can re-add bundle metadata during a recursive walk. Clear the
  // root last, immediately before signing/verification; preserve other xattrs.
  const attributes = run('xattr', [actual], { encoding: 'utf8', stdio: 'pipe' }).split('\n');
  for (const attribute of forbidden) if (attributes.includes(attribute)) run('xattr', ['-d', attribute, actual], { stdio: 'pipe' });
}
function withSigningMetadataRetry(bundle, operation, run = execFileSync) {
  // File Provider may recreate Finder metadata between cleanup and codesign.
  // Retry only that specific failure, never a broken seal/signature.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    clearSigningMetadata(bundle, run);
    try {
      return operation();
    } catch (error) {
      if (attempt === 2 || !String(error.stderr || '').includes('resource fork, Finder information, or similar detritus not allowed')) throw error;
    }
  }
}
function verifyBundle(bundle, run = execFileSync) {
  return withSigningMetadataRetry(bundle, () => run('codesign', ['--verify', '--deep', '--strict', bundle], { stdio: 'pipe' }), run);
}
function stripUnusedPrivacyDescriptions(bundle, run = execFileSync) {
  const actual = assertBuildBundle(bundle);
  const frameworks = path.join(actual, 'Contents/Frameworks');
  const bundles = [actual, ...(fs.existsSync(frameworks) ? fs.readdirSync(frameworks)
    .filter(name => name.endsWith('.app')).map(name => path.join(frameworks, name)) : [])];
  for (const item of bundles) {
    const plist = path.join(item, 'Contents/Info.plist');
    const info = JSON.parse(run('plutil', ['-convert', 'json', '-o', '-', plist], { encoding: 'utf8', stdio: 'pipe' }));
    for (const key of unusedPrivacyKeys) if (Object.hasOwn(info, key)) run('plutil', ['-remove', key, plist], { stdio: 'pipe' });
  }
}
module.exports = { assertBuildBundle, clearSigningMetadata, verifyBundle, stripUnusedPrivacyDescriptions, withSigningMetadataRetry };
