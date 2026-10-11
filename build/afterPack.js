// electron-builder afterPack hook
// 开发版保留上游 ad-hoc 签名钩子；不替代正式 Developer ID 签名与公证。
// 从内到外尝试 ad-hoc 签名；是否有效以最终 strict/deep 检查为准。
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const { assertBuildBundle, verifyBundle, stripUnusedPrivacyDescriptions, withSigningMetadataRetry } = require('./signing');
const FUSE_SETTINGS = {
  version: FuseVersion.V1,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
};
exports.FUSE_SETTINGS = FUSE_SETTINGS;

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  );

  const projectRoot = path.resolve(__dirname, '..');
  assertBuildBundle(appPath);
  // Electron's stock Info.plist contains generic media/Bluetooth descriptions,
  // even when extendInfo declares only Calendar/Reminders. Strip before signing.
  stripUnusedPrivacyDescriptions(appPath);
  if (!fs.existsSync(path.join(appPath, 'Contents/Resources/app.asar'))) throw new Error('Validated app.asar is required');
  // Flip before this hook signs. Builder's automatic fuse phase runs AFTER
  // afterPack and would invalidate a signature produced here.
  await flipFuses(appPath, FUSE_SETTINGS);
  const macOSDirectory = path.join(appPath, 'Contents', 'MacOS');
  const electronExecutablePath = path.join(macOSDirectory, context.packager.appInfo.productFilename);

  if (!fs.existsSync(electronExecutablePath)) {
    throw new Error(`找不到 Electron 主程序：${electronExecutablePath}`);
  }

  console.log(`  • ad-hoc 签名 ${appPath}`);

  // 依次签：所有 dylib → Framework 内 Helpers → Framework binary → Helper apps → Frameworks → 主 bundle
  const entitlementsPath = path.join(projectRoot, 'build', 'entitlements.mac.plist');
  const inheritedEntitlementsPath = path.join(projectRoot, 'build', 'entitlements.electron-helper.plist');
  const nativeEntitlementsPath = path.join(projectRoot, 'build', 'entitlements.eventkit.plist');
  // 逐文件失败先记录不抛：最终的 --verify --deep --strict 才是判定标准，
  // 个别无害告警不该中断构建，真正坏掉的签名会在下面的校验里被拦住。
  const signFailures = [];
  const cs = (file, executable = false, native = false) => {
    try {
      const args = ['--force', '--sign', '-', '--timestamp=none'];
      if (executable || native) args.push('--options', 'runtime');
      if (native) args.push('--entitlements', nativeEntitlementsPath);
      else if (executable) args.push('--entitlements', file === appPath || file === electronExecutablePath ? entitlementsPath : inheritedEntitlementsPath);
      args.push(file);
      withSigningMetadataRetry(appPath, () => execFileSync('codesign', args, { stdio: 'pipe' }));
    } catch (e) {
      signFailures.push(`${file}: ${e.message}`);
      console.warn(`    codesign 失败 ${file}: ${e.message}`);
    }
  };

  const walk = (dir, predicate, cb) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.endsWith('.app') && !entry.name.endsWith('.framework')) {
        walk(full, predicate, cb);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        cb(full);
      }
    }
  };

  const fwDir = path.join(appPath, 'Contents', 'Frameworks');

  // 1) 所有 dylib
  walk(fwDir, (n) => n.endsWith('.dylib'), cs);

  // 2) Electron Framework 内部的 Helpers (chrome_crashpad_handler 等)
  const efw = path.join(fwDir, 'Electron Framework.framework', 'Versions', 'A', 'Helpers');
  if (fs.existsSync(efw)) {
    for (const f of fs.readdirSync(efw)) cs(path.join(efw, f), true);
  }

  // 3) Electron Framework 主 binary
  const efwBin = path.join(fwDir, 'Electron Framework.framework', 'Versions', 'A', 'Electron Framework');
  if (fs.existsSync(efwBin)) cs(efwBin);

  // 4) 每个 Helper.app 的内部 binary
  for (const entry of fs.readdirSync(fwDir)) {
    if (entry.endsWith('.app')) {
      const macosDir = path.join(fwDir, entry, 'Contents', 'MacOS');
      if (fs.existsSync(macosDir)) {
        for (const f of fs.readdirSync(macosDir)) cs(path.join(macosDir, f), true);
      }
    }
  }

  // 5) 每个 Helper.app 整体
  for (const entry of fs.readdirSync(fwDir)) {
      if (entry.endsWith('.app')) cs(path.join(fwDir, entry), true);
  }

  // 6) 每个 Framework 整体
  for (const entry of fs.readdirSync(fwDir)) {
    if (entry.endsWith('.framework')) cs(path.join(fwDir, entry));
  }

  // Sign the EventKit bundle (Calendar read-only; Reminders completion only).
  const calendarHelper = path.join(appPath, 'Contents/Resources/native/NotchimeEventKitHelper.app');
  if (!fs.existsSync(calendarHelper)) throw new Error('EventKit Helper missing from packaged resources');
  cs(calendarHelper, false, true);

  // 7) Electron 主程序（Contents/MacOS 下唯一的可执行文件）
  cs(electronExecutablePath, true);

  // 8) 主 bundle
  cs(appPath, true);

  // 校验：失败必须中断构建，否则本地会拿到一个签名已坏、却看起来构建成功的 DMG。
  try {
    verifyBundle(appPath);
    console.log(`  ✓ 签名校验通过`);
  } catch (e) {
    if (signFailures.length) {
      console.error(`  ✗ 期间有 ${signFailures.length} 个文件签名失败：`);
      for (const failure of signFailures) console.error(`      ${failure}`);
    }
    throw new Error(`ad-hoc 签名校验失败，产物不可分发：${e.message}`);
  }
};
