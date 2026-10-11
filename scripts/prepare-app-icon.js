// Convert the project-owned PNG to macOS ICNS; never sign, install or package.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function prepareIcon() {
  if (process.platform !== 'darwin') throw new Error('Icon conversion requires macOS');
  const source = path.join(root, 'build/notchime-icon.png');
  const directory = path.join(root, '.cache/icon/notchime.iconset');
  fs.mkdirSync(directory, { recursive: true });
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const file = `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`;
      execFileSync('sips', ['-z', String(size * scale), String(size * scale), source,
        '--out', path.join(directory, file)], { stdio: 'pipe', cwd: root });
    }
  }
  execFileSync('iconutil', ['-c', 'icns', directory, '-o', path.join(root, 'build/notchime-icon.icns')],
    { stdio: 'pipe', cwd: root });
}
if (require.main === module) prepareIcon();
module.exports = { prepareIcon };
