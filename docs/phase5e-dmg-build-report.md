# Phase 5E — 本地 macOS DMG 构建与验证

日期：2026-10-11。性质：本机隔离测试构建，不是公开发行版。构建成功、安装验收成功、适合公开发布是三个不同结论。

## 1. 应用身份和版本

| 字段 | 本次实际值 |
| --- | --- |
| 产品界面 | Notchime，GAO TIANYU |
| package name / version | `calendar-notch-dev` / `1.2.0` |
| productName / 可执行文件 / .app 文件名 | `Calendar Notch Dev` |
| 主应用 Bundle ID | `com.calendarnotch.dev` |
| Helper Bundle ID | `com.calendarnotch.dev.calendar-helper` |
| CFBundleDisplayName | Notchime；Helper 为 Notchime EventKit |
| 默认 userData | `app.getPath('userData')`，开发身份 Calendar Notch Dev |
| 测试数据目录 | 项目 `.cache/tests/` 中独立目录 |

Phase 5D 正式身份迁移没有完成；本次没有修改 appId、productName、package name/version、app.setName 或默认 userData。展示名称与用途说明更新不等于 Bundle ID 或用户数据迁移。因此没有擅自生成名为 Notchime.app 的正式身份产物。

GitHub Actions `release-dmg.yml` 只有 `workflow_dispatch`，权限为 contents:read；没有 push/tag 自动触发、Release 创建或上传发布步骤。工作流的 artifact 上传未执行，本次构建设置 `--publish never`。

## 2. 构建环境

- 本机：macOS 27.0，build 26A428，arm64。
- Node.js 22.22.0、npm 10.9.4、Electron 44.0.0、electron-builder 26.15.7。
- Apple Swift 6.1.2，Swift driver 1.120.5。
- 应用和 Helper 的配置最低系统为 macOS 13.0，Helper 目标 `arm64-apple-macosx13.0`。
- macOS 13/14、Intel Mac、其他 Mac 的安装/权限行为：Not Verified。
- `security find-identity -v -p codesigning`：0 valid identities。没有 Developer ID 证书。

## 3. 实际构建方法

普通 Desktop 输出曾因 File Provider 重新附加 FinderInfo 而严格签名失败。没有关闭 strict 校验；最终构建在项目内部挂载的独立 APFS 工作卷中执行。卷映像、挂载点、缓存和输出都位于项目 `.cache/phase5e/`。

```sh
hdiutil create -size 2g -type SPARSE -fs APFS -volname NotchimeBuild .cache/phase5e/build-stage
hdiutil attach .cache/phase5e/build-stage.sparseimage -mountpoint .cache/phase5e/BuildVolume -nobrowse
CSC_IDENTITY_AUTO_DISCOVERY=false ELECTRON_BUILDER_CACHE="$PWD/.cache/electron-builder" npm_config_cache="$PWD/.cache/npm" TMPDIR="$PWD/.cache/tmp" npm run build -- --config.directories.output=.cache/phase5e/BuildVolume/tcc-fixed
```

`npm run build` 执行已有 prebuild，编译 Helper，随后 `electron-builder --mac dmg --publish never`。自动证书查找关闭，但 afterPack 仍执行真实 ad-hoc 签名和严格校验；Builder 的“skipped macOS application code signing”仅指它自己的自动签名阶段。

最终 DMG 复制到 `dist.noindex/`，使用 `hdiutil verify` 验证，再只读挂载到 `.cache/phase5e/DMGMount`。没有安装到 Applications、覆盖已有应用、申请证书、公证或上传。

## 4. 新增和修改文件

| 文件 | 主要修改 |
| --- | --- |
| `package.json` | 启用 ASAR；保留全部身份字段；分离 Electron Helper entitlement 路径；产品显示名称/用途说明/产品版权文案统一为 Notchime 与 GAO TIANYU。 |
| `build/afterPack.js` | 签名前设置五项 Fuses；移除 Electron 默认媒体/蓝牙用途说明；按 Main、Electron Helper、EventKit Helper 分配 entitlements；保持由内到外签名、strict/deep 最终失败即中止。 |
| `build/signing.js`（新增） | 清理范围限定到真实解析后的项目构建目录；仅删除 FinderInfo/ResourceFork；仅针对该类元数据竞态有限重试3次，签名或密封资源损坏直接失败。 |
| `build/entitlements.mac.plist` | 保留 JIT 和本地 ad-hoc 必需库加载例外，移除 unsigned executable memory；补齐 Hardened Runtime 的 Calendar entitlement。 |
| `build/entitlements.electron-helper.plist`（新增） | 仅 JIT 和库加载例外；不给渲染/GPU Helper EventKit、设备、Automation 能力。 |
| `build/entitlements.eventkit.plist`（新增） | 仅 Calendar entitlement；没有 JIT、库验证例外、设备或 Automation 权限。 |
| `scripts/build-calendar-helper.js` | 编译指纹包含 native entitlement；缓存命中也验证签名；构建后的 Helper 使用 native entitlement 签名。 |
| `native/calendar-helper/Info.plist` | Helper 展示名称及日历用途文案使用 Notchime；Bundle ID、可执行文件名和权限语义不变。 |
| `main.js` | 仅按用户补充要求移除 About 对话框中的旧项目产品介绍；LICENSE/NOTICE 保留。窗口和业务逻辑未改。 |
| `tests/packaging-security.test.js`（新增） | Fuses、ASAR、清理范围、元数据重试上限、默认权限删除、分角色 entitlement、产品 About 和法律文本保留测试。 |
| `tests/release-policy.test.js` | 保留本地 ad-hoc 必需的库验证配置断言，增加不允许 unsigned executable memory 的验证。 |
| `tests/security.electron.js` | About当前产品信息断言改为Notchime/维护者/Slogan，并明确拒绝旧项目信息；安全断言不变。 |
| `tests/renderer-structure.test.js` | 用户可见展示名称改为 Notchime；原 Bundle ID、productName、lockfile 一致性断言保留。 |
| `tests/startup.electron.js` | 启动自动概览断言前明确建立另一前台窗口，隔离物理键鼠输入；保留原 automatic、动画、时间、失焦与显示器断言。 |
| 本报告 | 记录所有失败、修复、真实包验证和人工验收边界。 |

没有新增生产依赖，package-lock 未改；没有修改 Swift EventKit 业务逻辑、Preload、Countdown 模型、窗口几何或原始动画。仅清理本轮自行生成的中间工作卷输出，未清理历史私人缓存。

## 5. 测试结果与失败记录

最终完整 `npm test`（`.cache/phase5e/npm-test-clean-final.log`）：147项单元通过、0失败、0跳过；68个活动JavaScript文件语法通过；13项Electron Fixture场景通过、0失败、0跳过；1项真实npm源码启动路径的Fixture测试通过。该源码启动测试自动收起5191ms（包括收起动画）。全部使用隔离数据，不把Fixture当作真实EventKit读取。

基线 `npm test`：140 单元、66 JS 语法、13 Electron Fixture 场景和1源码启动场景通过。

中途失败没有隐藏：

1. 默认 Desktop 输出：FinderInfo/ResourceFork 签名失败；改用项目 APFS 工作卷，并增加仅元数据失败可重试的受限清理。
2. 只保留 allow-jit 的包：dyld 拒绝加载 Electron Framework，原因是 ad-hoc 主进程和 Electron Framework 的 Team ID 不匹配；恢复本地测试必要的 disable-library-validation。Hardened Runtime 保持开启。
3. 一次 Fixture 启动将来源报告为 manual：增加另一前台窗口作为自动展开测试前置条件；未删断言或放宽状态校验，后续完整回归通过。
4. 一次隔离安装副本启动收起时间7237ms，超过测试上限7000ms；保留失败证据，复测6250ms通过。此前 DMG 直接启动为4410ms。尚未证明每次启动都在约4秒完成，Phase 5F 需观察实际时序波动。失败后的强制退出产生 GPU/网络子进程中止和 disposed frame 日志，不属于正常退出通过证据。
5. 真实 LaunchServices 入口没有日历授权弹窗：tccd 明确报告 responsible application 缺少 `com.apple.security.personal-information.calendars`。已补齐 Main/原生 Helper entitlement，不能把命令行继承授权的读取成功当作应用自身授权成功。
6. 更新显示名称后，一个旧测试仍要求 CFBundleDisplayName 等于开发 productName；另一个旧 About 测试仍要求出现上游项目介绍。按用户新的产品展示要求改为严格断言 Notchime 和当前维护者，并断言旧项目信息不得出现；开发身份与法律文件完整性断言仍保留。
7. 一次自动收起Fixture测试失败时，诊断明确为`hovered:true`、自动计时器暂停，属于真实鼠标悬停与测试前置条件冲突。没有修改产品悬停保护或放宽断言；提醒用户将鼠标移出面板后，完整回归全部通过。

## 6. Swift Helper 打包

固定路径：

```text
Calendar Notch Dev.app/Contents/Resources/native/
  CalendarNotchCalendarHelper.app/Contents/MacOS/calendar-helper
```

Main 通过 process.resourcesPath 定位，不依赖源码目录。主程序和 Helper 均经 `file` 确认为 arm64 Mach-O。Helper 在 prebuild 实际重新编译并 ad-hoc 签名。类型检查使用现有 Swift 文件和项目内 module cache，成功；编译器仅提示 legacy driver 已弃用。

Calendar 和 Reminders 的现代与旧系统用途说明都在主应用/Helper Info.plist 中。没有添加 Calendar 写入操作；Reminders 仍只有受控的当前有效事项完成操作。

## 7. ASAR 和 Fuses

- app.asar 已启用；29个文件及 renderer 目录。没有运行时 node_modules、测试、私人缓存、docs、promo、.env 或辅助开发配置。
- LICENSE、NOTICE、THIRD_PARTY_NOTICES.md 在 ASAR 中；Electron LICENSE 和 Chromium LICENSES.chromium.html 在 Resources/licenses/electron。
- 校验所有29个条目 SHA-256、ASAR header SHA-256 与 Info.plist 的 ElectronAsarIntegrity 一致。
- RunAsNode、EnableNodeOptionsEnvironmentVariable、EnableNodeCliInspectArguments：关闭。
- EnableEmbeddedAsarIntegrityValidation、OnlyLoadAppFromAsar：开启。
- Cookie encryption、file protocol extra privileges、V8 snapshot 等其余默认值不盲目改动；本地页面安全守卫和 sandbox 继续生效。
- Fuses 在 afterPack 的手动签名前设置；没有放进 Builder 后续会破坏该签名的自动 fuse 阶段。
- 隔离测试给定 ELECTRON_RUN_AS_NODE、NODE_OPTIONS 注入文件、--inspect：正常运行 Electron、注入文件未执行、没有 Node inspector。
- 对仅本轮生成的应用副本篡改 ASAR main.js 字节：运行时以 ASAR Integrity Violation 拒绝，进程非零退出；没有修改最终 DMG。

## 8. 签名、Gatekeeper 与权限问题

- 主应用、嵌套 Electron 组件、Swift Helper：ad-hoc，无 Team ID，不是 Developer ID，不是 Apple 公证。
- 最终只读 DMG 中 `.app` 与 Helper 的 `codesign --verify --deep --strict` 通过。
- hardened runtime 开启。主进程 JIT 与 ad-hoc 库加载例外是 Electron 运行所需；后续 Developer ID 构建必须重新评估库验证例外。
- Hardened Runtime Calendar capability 是允许应用向系统申请 Calendar/Reminders 访问的能力，不等于用户已经批准，也不等于系统只读权限。Calendar 应用行为仍只读，Reminders 完成是唯一写操作。
- `spctl --assess --type execute --verbose=4`：rejected。不得将其写成 Gatekeeper PASS。没有关闭 Gatekeeper、移除 quarantine 或修改 TCC 数据库。
- Electron 默认主 Info.plist 带入5项无关用途说明：Camera、Microphone、AudioCapture、BluetoothAlways、BluetoothPeripheral。已在签名前删除，并检查包内结果。

参考：[Apple Calendar entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.personal-information.calendars)、[Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses)、[electron-builder macOS 签名](https://www.electron.build/docs/features/code-signing/code-signing-mac/)。本机 tccd 和 dyld 实际诊断是本次修复的直接证据。

## 9. DMG 产物与校验

- 最终 DMG：[Calendar-Notch-Dev-1.2.0-arm64.dmg](../dist.noindex/Calendar-Notch-Dev-1.2.0-arm64.dmg)。
- 大小：131,326,206 bytes（约125.24 MiB）。应用展开占用约307 MiB。
- SHA-256：`07ef7418f969858e0d3bb187527002495d03083046ee3507e14fb2cd2e95d0a4`。
- 校验文件：[.dmg.sha256](../dist.noindex/Calendar-Notch-Dev-1.2.0-arm64.dmg.sha256)。
- 生成的 .app：`.cache/phase5e/BuildVolume/tcc-fixed/mac-arm64/Calendar Notch Dev.app`；最终DMG内也包含完整.app。
- ASAR header SHA-256：`cc2b4503b106a10a42d25177bd75a6d038096918df815f51c1525d6b9e1f4a9a`。
- hdiutil verify、只读挂载、29项ASAR内容/头哈希与Info.plist核对：通过。
- 真正开发名称保留，未伪称正式Notchime v1.0安装身份。

## 10. 挂载和安装结构

DMG 只读挂载成功。包含 `.app` 和指向 `/Applications` 的常规 Applications 安装入口，另有 DMG 背景、卷图标和 Finder 布局元数据。图标文件与 build/notchime-icon.icns 的 SHA-256 相同。

隔离安装采用复制到项目 APFS 工作卷的 `Installed/`，没有覆盖真实 Applications。复制后遇到的构建副本 FinderInfo 清理只限项目内产物。此项不等于用户在 Finder 中拖到 Applications 后的完整安装验收。

## 11. 实际运行结果和 TCC 归属

命令行直接运行打包可执行文件：此前真实 EventKit 读取授权返回 authorized，10个日历、8个查询范围事件，今日0个，Renderer 今日条目0个；Reminders authorized，符合展示规则的任务0个。仅保存数量/状态，没有记录标题或自动写入真实任务。

这组较早测试证明打包路径与通信可以工作，但随后 LaunchServices 测试发现它不能证明安装应用自身的 Calendar 授权：系统将命令行与正常应用入口归因到不同 responsible application。不能混用两种证据。

补齐Hardened Runtime entitlement并重新构建后，通过LaunchServices正常打开最终只读DMG应用、携带项目内隔离profile。用户亲自点击Calendar和Reminders授权并回复“完全正常”。随后只读CDP核验：Calendar `authorized`、10个日历、查询范围8个事件；Reminders `authorized`、今日/逾期事项0个；未来展示范围7天。证据`.cache/phase5e/permission-fixed.json`。这是真实Electron→内置Helper→EventKit→Renderer链路，不是Fixture，也没有自动写入Calendar/Reminders。授权测试应用已正常退出。

最终产物的追加验证（全部通过）：

| 验证 | 结果 / 证据 |
| --- | --- |
| macOS LaunchServices正常入口重新启动 | Calendar/Reminders authorized、页面可见、Notchime展示名称、内置Helper路径、自动收起、正常退出；`.cache/phase5e/launchservices.json`，收起5122ms。 |
| 最终只读DMG内可执行文件 | 真实EventKit授权/查询、今日条目数量与模型一致、未来7天、Countdown完整CRUD与重启恢复、设置保存、单实例、正常退出；`runtime/mounted-final.json`，启动收起4427ms。 |
| 项目APFS隔离安装副本 | 同上，脱离源码工作目录运行，Helper来自.app的Resources；`runtime/installed-final.json`，启动收起4409ms。没有复制到系统Applications。 |
| 安全机制 | 两次打包运行中NODE_OPTIONS注入、ELECTRON_RUN_AS_NODE、Node inspector均未生效；Renderer仍没有require。 |
| 用户可见产品说明 | 完整Electron安全GUI回归验证Notchime/GAO TIANYU/Slogan，About没有旧项目介绍。 |

上述真实读取测试的Reminders展示数量为0，因此不能宣称这次包已经验证真实待办完成写回。真实事项完成、iPhone同步、实际休眠/解锁与外接显示器仍由Phase5F用户人工验收；相关Fixture契约回归已通过。

Countdown 在项目独立 profile 中执行创建、编辑、删除确认/取消、置顶和重启恢复；设置持续时间保存、两页导航、单实例、正常退出通过。真实 Reminders 完成仅由 Fixture GUI 测试覆盖；本次没有自动完成任何真实任务。

## 12. 安全与操作边界记录

测试均使用项目内专用 profile，并提前创建 `.first-run-done` 防止测试注册真实登录项。但重新唤出窗口时有一次 `open` 未携带隔离参数，已停止该测试进程并向用户说明。这次短暂默认目录启动可能触发首次登录项逻辑或默认设置写入；没有检查、清理或回滚真实用户数据，不能声称已证明没有任何副作用。后续重新创建隔离目录并携带参数启动。

检测到另一个旧 Phase3 项目测试包也在运行，名称同为 Calendar Notch Dev。没有关闭或修改它；后续按当前 DMG 完整路径定位并核对 app.asar 页面，避免错选旧窗口。这也是 Phase5D身份尚未统一时的混淆风险。

## 13. 人工验收清单

1. 退出当前本地测试包，再双击最终 DMG；确认图标和 Applications 入口。
2. 如 Applications 有同名应用，不直接覆盖；先确认安装策略和备份。不自动迁移数据。
3. 从最终安装位置正常打开，亲自申请日历权限；确认真实日历列表和未来7天。
4. Reminders 若已授权不再弹窗；若未授权，在日程页“今日待办”主动申请。Settings 里只有 Calendar 授权按钮，不应误导为包含 Reminders 授权按钮。
5. 用户在 Apple Reminders 自行准备一条今天到期、非重复、可写清单的测试任务，并亲自点击 Notchime 完成；确认 Mac/iPhone 更新。本次未自动执行。
6. 用户自行创建/修改/删除 Calendar 测试事件，并观察系统同步；应用不写 Calendar。
7. 新建测试 Countdown 后退出重启，检查保存。不要删除已有真实数据。
8. 启动、悬停、手动接管、Settings/表单保护、Escape、失焦、快速开合、睡眠/解锁与外接屏分别验收；关注启动收起延时波动。
9. 确认 About 只显示 Notchime、GAO TIANYU、当前产品说明；必要法律归属位于 LICENSE/NOTICE。
10. 开机启动只在用户同意时测试；实际登录、另一台 Mac、Gatekeeper quarantine 和新用户首次授权未自动验收。

## 14. 剩余问题

- Phase5D 未完成：开发 Bundle ID、应用文件名、版本号和 userData 仍保留；不能称正式 Notchime v1.0 安装身份。
- 无 Developer ID、公证、可信时间戳；Gatekeeper拒绝，其他 Mac 下载后可能受到“无法验证开发者”等限制。本机未隔离下载路径的启动成功不等于公开下载验收。
- 当前最终DMG正常入口的Calendar/Reminders授权和读取已由用户点击并经状态核验通过；新用户/另一台Mac仍需独立验收。没有重置系统权限。
- File Provider 可能重新添加 FinderInfo。只读最终 DMG 完整性已验证；Desktop 下再次构建或拷贝仍须 strict 检查，当前构建建议沿用项目 APFS 工作卷。
- 启动自动收起存在实测时序波动，尚未证明所有启动均约4秒；保留失败记录。
- macOS13/14、Intel、另一台 Mac、实际多屏热插拔/登录/物理合盖是 Not Verified；Fixture 事件注入不等于物理验收。
- npm audit 默认镜像接口404，不算审计通过；改用 npmjs.org 后结果0 Critical、0 High、8 Moderate。均在构建工具依赖链，ASAR 不含这些包；仍需后续供应链评估，未执行 force fix 或升级。
- 正式图标再分发来源许可确认等既有发布准备事项仍需完成。

## 15. Phase5F准入结论

可以进入Phase5F本机安装验收：最终DMG已完成正常应用入口权限与真实读取验证。此构建不适合直接公开发布；也尚不建议作为可信、通用的朋友测试安装包。未把Fixture通过或DMG生成当成完整Applications安装、另一台Mac或Gatekeeper下载验收。

本地证据在 `.cache/phase5e/`（构建白名单排除）。不含真实日程/任务标题截图；报告仅引用协议状态、计数、哈希和测试结果。
