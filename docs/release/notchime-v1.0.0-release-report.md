# Notchime 1.0.0 Release Candidate — 交付报告

日期：2026-10-11。维护者：**GAO TIANYU**。GitHub：https://github.com/GAO9228TIANYU/Notchime。

**结论：DMG 已生成；最终 DMG 的包内启动及项目内隔离安装副本的主要功能验证通过。此为 ad-hoc 本地 RC，不是已经公证或可公开发行的版本。** 未操作 Git、公开 Release、Apple Developer 账户、真实 Applications 安装、真实旧数据导入、真实 Calendar 写入或真实 Reminders 完成。

## 1. 交付状态

| 状态 | 结论 | 验证范围 |
|---|---|---|
| Build Ready | YES | arm64 DMG、真实包身份、资源、Helper、ASAR、Fuses、strict/deep 签名及 DMG 校验通过。 |
| Local Install Tested | YES，隔离范围 | 从最终只读 DMG 启动；复制到项目 APFS 卷的 Installed 目录后启动、退出及重启通过。没有覆盖 Applications。 |
| Developer ID Signed | NO | 本机查询为 0 个有效签名身份。仅 ad-hoc。 |
| Apple Notarized | NO | 未提交公证、未使用账号凭据、无 stapled ticket。 |
| Public Release Ready | NO | Gatekeeper 拒绝；可信签名/公证、图标权利及干净安装/硬件验收尚未完成。 |

## 2. 最终产品身份

| 字段 | 实际产物值 |
|---|---|
| package name / version | `notchime` / `1.0.0` |
| appId / CFBundleIdentifier | `com.notchime.app` |
| productName / CFBundleName / CFBundleDisplayName / executable | `Notchime` |
| CFBundleShortVersionString / CFBundleVersion | `1.0.0` / `1.0.0` |
| Helper Bundle ID | `com.notchime.app.eventkit-helper` |
| Helper Bundle / display / executable | `NotchimeEventKitHelper.app` / `Notchime EventKit` / `notchime-eventkit-helper` |
| 默认应用数据目录 | Electron appData 下的 `Notchime`，即 `~/Library/Application Support/Notchime` |
| 图标 | `build/notchime-icon.icns`；包内 `Resources/icon.icns` 与原件哈希相同。 |
| 系统要求 | macOS 最低配置 13.0；本次仅 Apple Silicon arm64。 |

菜单、Tray、About 和权限文案使用 Notchime / GAO TIANYU。应用是 LSUIElement，通常不显示 Dock 图标；Bundle/可执行文件名称也已真正改为 Notchime。登录项仍指向运行中的应用路径；隔离测试首次运行标记阻止登记真实登录项。旧开发身份只在明确离线导入兼容说明与历史资料中保留；上游依法需要的版权不删除。

Slogan：**There When You Need It. Quiet When You Don't.** / **需要时出现，无需时静默。**

## 3. 环境与实际执行

- macOS **27.0（26A428）**，arm64。
- Node.js **22.22.0**，npm **10.9.4**；项目要求 Node 22.12.0+。
- Electron **44.0.0**；electron-builder **26.15.7**；Swift **6.1.2**。
- Swift 目标 `arm64-apple-macos13.0`。配置/编译目标不代表 macOS 13/14 已通过真机验收，Intel 未构建或测试。
- 复用原 afterPack、安全 Fuses、ASAR 与分角色签名方案；未引入依赖、未升级主版本。

最终构建命令（从项目根目录执行）：

```sh
CSC_IDENTITY_AUTO_DISCOVERY=false \
ELECTRON_BUILDER_CACHE="$PWD/.cache/electron-builder" \
npm_config_cache="$PWD/.cache/npm" TMPDIR="$PWD/.cache/tmp" \
npm run build -- --config.directories.output=.cache/release-v1.0.0/BuildVolume/output
```

实际 `prebuild` 调用 `node scripts/build-calendar-helper.js`；build 为 `electron-builder --mac dmg --publish never`。构建工作目录是项目内 APFS sparseimage 挂载卷，避免 Desktop File Provider 对构建结果反复附加 FinderInfo。没有写入系统 Applications。只有项目构建/测试副本允许清除 `com.apple.FinderInfo` 和 `com.apple.ResourceFork`；不清理其他 xattrs、真实安装或用户目录。

执行了 `npm test`、Swift 类型检查及原生编译、npm 官方 registry audit、签名身份查询、实际包核验脚本、DMG verify/只读挂载、Gatekeeper assessment、最终 DMG/隔离副本运行和篡改测试。网络 audit 只提交依赖信息，不上传 Calendar/Reminders 内容。

## 4. 实际修改与新增文件

| 文件 | 内容 |
|---|---|
| `package.json`、`package-lock.json` | 正式名称/版本/Bundle ID、主页、DMG 名称、Helper extraResources。lock 仅根身份元数据变化，依赖图不变。 |
| `main.js` | 正式独立数据身份、macOS 原生应用菜单；最小修复自动展开期间 blur 取消会话的竞态。 |
| `main-services.js` | 新增可测试 blur 策略，自动展开和授权期间不由失焦取消；手动失焦维持既有动画收起。 |
| `calendar-bridge.js` | 固定的新 Helper 包内路径；不开放任意命令/路径。 |
| `native/calendar-helper/Info.plist` | Helper 正式身份、版本与名称；原权限描述保留。 |
| `scripts/build-calendar-helper.js` | 新 Helper Bundle/可执行文件/签名标识；原目标、编译与严格检查保留。 |
| `build/afterPack.js` | 新 Helper 资源路径，原安全构建链保留。 |
| `build/signing.js` | 仅将本轮项目 RC 构建目录纳入允许的签名元数据清理范围。 |
| `scripts/import-development-profile.js`（新增） | 明确确认、离线、无覆盖的旧开发数据导入工具；不进入应用、不自动调用。 |
| `scripts/verify-release-bundle.js`（新增） | 只读验证真实 plist、arm64、白名单/逐文件哈希、ASAR header、Fuses、图标、许可证、entitlements 和 strict/deep 签名。 |
| `.github/workflows/release-dmg.yml` | 手动触发、只读权限、明确 ad-hoc RC artifact；新增实际包检查。没有普通 push/tag 自动发布。 |
| `tests/profile-import.test.js`、`tests/release-identity.test.js`（新增） | 9 项导入及 3 项正式身份/发布策略单元测试。 |
| `tests/main-services.test.js`、`tests/automatic.electron.js` | blur 策略及“自动请求已发、原生展开尚未发生”真实 Electron 时序回归。 |
| `tests/final-review.test.js`、`tests/renderer-structure.test.js`、`tests/calendar-native-contract.test.js`、`tests/calendar-bridge.test.js`、`tests/security.electron.js`、`tests/startup.electron.js` | 旧身份/路径断言更新为严格的新身份断言，未删测试、未放宽有效安全验证。 |
| `README.md`、`README.zh-CN.md`、`CONTRIBUTING.md`、`SECURITY.md`、`docs/PRIVACY.md`、`AGENTS.md`、`CHANGELOG.md` | 正式身份与 RC 状态、导入边界、真实构建结果及未完成公开分发条件。历史 Changelog 仍保留来源。 |
| 本报告、`notchime-v1.0.0-manual-acceptance.md`、`notchime-v1.0.0-release-notes.md` | 交付证据、简短人工清单、未发布 Release Notes 草稿。 |

`.cache/release-v1.0.0/` 中为本轮构建、隔离检查脚本和证据，不随应用分发。未清理历史私人缓存。

以下核心文件与本轮开始时哈希相同：`preload.js`、`renderer/app.js`、`renderer/styles.css`、`countdown-store.js`、`calendar-provider.js`、`reminders-provider.js`、Swift `main.swift` / `ReminderDate.swift`、`LICENSE`、`.icns`。未重写 applyMode、beginNativeCollapse、setMode、waitForPanelMotion 或原动画，未扩大 Calendar/Reminders 业务权限。

## 5. 旧数据保护与迁移

本轮没有访问或复制真实旧 profile。没有自动探测旧目录、TCC 修改或数据迁移。正式身份的新目录独立，因此旧数据留存但不会自动出现在新版本。

提供的显式离线工具仅允许来源可信备份 → 不存在的目标；操作前新旧应用必须退出。仅接收：

- `countdowns.json`：沿用 schemaVersion 1，调用既有校验，保留全部有效记录。
- `app-settings.json`：校验已知偏好，保留有效未知/窗口偏好，不执行字段。
- `calendar-preferences.json`：验证 schema 与 selected IDs。
- `calendar-reminder-receipts.json`：仅有限哈希/过期元数据，不包含任务或日程正文。

工具要求明确参数及确认；拒绝原版 Dynamic Panel/TO-DO Panel 来源名、路径重叠、符号链接、超限/损坏文件和未知 schema。先校验/同步 staging，再独占创建目标；原件不修改，失败保留恢复 staging。存在正式目录（含空目录）也拒绝覆盖。同一已完成导入再次执行幂等返回；用户随后修改的目标设置不覆盖。中途崩溃产生的未完成目标不能自动合并，需人工按备份恢复。

不复制 Chromium缓存、日志、workspace、旧待办、凭据、登录项或 TCC。导入生成首次运行标记，真实登录项需用户主动启用。选择 ID 无效时由用户重新选择，不按名称猜测。**9 项合成目录测试通过；真实导入 Not Performed。** 具体操作边界见[人工清单](notchime-v1.0.0-manual-acceptance.md)。

## 6. 测试结果与失败历史

| 检查 | 最终结果 | 证据/边界 |
|---|---|---|
| Node 单元 | **160 通过，0 失败，0 跳过** | `npm-test-fixed.log`；包含正式身份、迁移、Calendar/Reminders、调度、安全与生命周期。 |
| JavaScript 语法 | **72 个文件通过，0 失败** | 全部活动根源文件、renderer、scripts、build、tests。 |
| Electron Fixture | **13 场景通过，0 失败，0 跳过** | 外观/焦点、启动+重启、Countdown CRUD+重启+损坏、Calendar、自动展开、Reminders、安全。 |
| 真实 npm 源码运行入口 | **1 次通过** | Fixture Helper，无真实系统数据；自动收起 4370ms。 |
| Swift 类型检查 | **通过** | 仅 legacy-driver 弃用警告，不是错误。 |
| Swift Helper 编译 | **通过** | 实际 build/prebuild 生成 arm64 包并内置。 |
| 最终只读 DMG 包核验 | **通过** | strict/deep、29 ASAR 文件、逐文件/hash/header、图标、许可证、Fuses、arm64、plist/权限。 |
| 最终 DMG 包内运行 | **通过** | 真实读取、Countdown CRUD/日期选择器/置顶/删除确认/重启、设置持久化、单实例、退出；自动收起 **4627ms**。 |
| 隔离安装副本运行 | **通过** | 同一 DMG 复制后、脱离源码工作目录运行，上述功能及重启通过；自动收起 **4369ms**。 |
| LaunchServices 系统启动入口复测 | **通过** | `open -n -W` 最终只读包、界面可见、正式名称、真实权限/Helper、收起及正常退出；观测段约 **5202ms**，包括等待展开稳定及退场。 |
| ASAR 篡改负向检查 | **通过** | 仅改项目内一次性副本的 main.js 字节，进程 exit 1、报告 integrity failure；原 DMG 未修改。 |
| DMG verify/挂载/checksum | **通过** | readonly 挂载 Notchime.app + Applications symlink；最终 SHA 重验。 |
| Gatekeeper | **拒绝，非通过** | spctl exit 3、rejected；不能用签名结构检查替代 Gatekeeper。 |
| 真实 Applications/登录项/待办完成/旧数据导入 | **未执行** | 需用户确认，未用自动化真实写入。 |
| 物理睡眠/唤醒/解锁、多显示器、下载 quarantine、新用户 TCC | **待人工验收** | 逻辑 Fixture 覆盖不等于本次正式身份硬件验收。 |

### 本轮确认并修复的问题

自动展开请求发出后、原生 currentMode 尚为 collapsed 的短暂阶段若产生 blur：旧逻辑先取消 automatic session，但基于 currentMode 的收起请求被丢弃；Renderer 随后展开且其 automatic token 报告被拒绝，会失去自动收起所有权。诊断记录观察到会话消失、automatic 面板仍展开。修复让 automatic blur 保留受控会话/定时器，manual blur 沿原路径收起；授权期间也受保护。增加单元策略和确定性真实 Electron blur 回归，随后完整套件通过。

### 未抹去的失败与限度

- `npm-test.log`：修改前已有 159 单元通过，但自动 restart 场景收起超时，诊断仍有 timer、hover false；构建并行执行，未证实此超时全部由上述竞态造成。
- `npm-test-retry.log`：捕获 blur 取消会话的确定竞态，已按上文修复，不通过删除断言或延长时限获得通过。
- `launchservices-first-failure.md` / `launchservices-final.log`：最终包首次系统入口检查发生一次 20 秒自动收起等待超时；再次增加无敏感数据的 hover/state 观测、保持同一条件复测通过。首次未捕获完整状态，**不能宣称已证明其根因或消除了所有偶发时序风险**。最终 DMG、安装副本、完整 Fixture 和系统入口最终复测均通过，但公开前仍应重复人工启动/鼠标/失焦验收。
- 历史 Phase 5E 的 manual 状态偶发失败记录保留；本轮未删记录或降低断言。对真实硬件/前台恢复的残余时序风险不标为绝对解决。
- 隔离安装副本首次 strict 检查发现 File Provider/Finder 元数据再次附加。仅清除项目内该测试副本的 FinderInfo/ResourceFork，**没有重新签名、修改代码或忽略校验**；随后独立只读 verifier 与运行通过。最终只读 DMG 从未需要该清理。

所有自动数据写入仅为项目 `.cache/tests` 的合成 Countdown/设置；真 EventKit 读取不输出标题。非法 Calendar/Reminder 写入接口的预期“no handler”日志是安全负向测试结果，并非新增可达写入。

## 7. 原生 Helper、授权与真实读取

新 Helper 在最终应用 `Contents/Resources/native/NotchimeEventKitHelper.app/Contents/MacOS/notchime-eventkit-helper`。Main 按固定 Resources 路径启动，无 shell 拼接，JSON Lines 超限/超时/匹配/重启机制保留。实际进程路径确认来自应用 Resources，工作目录为无 main.js 的隔离 detached 目录，不依赖源码运行。

用户亲自对最终 **com.notchime.app** 授权并回复“**完全通过**”。之后最终 DMG、LaunchServices 和隔离副本均返回：Calendar authorized（10 个可用日历、8 个范围内事件），Reminders authorized（本次有效今日/逾期列表为 0 项），视图范围 7 天。只记录状态/数量，不记录标题、备注、清单内容。

本次今日事件数为 0，界面空状态与实际查询一致；未来范围有事件。**Reminders 0 项证明授权及查询链路有效，不能证明此包的真实任务完成写回。** 完成成功/失败/无效 ID/重复或只读事项在 Fixture 中验证；此前用户开发版完成/iPhone 同步验收仅为历史证据，不冒充本包写回验收。

macOS 14+ 系统权限为 Full Access to Events/Reminders；应用进一步限制 Calendar 只读、Reminders 仅当前有效非重复可写事项的用户点击完成。没有 Calendar save/delete 或 Reminder 创建/编辑/删除接口。旧系统兼容分支保留但未在 macOS13/14 真机重验。未自动接受弹窗或重置 TCC。

## 8. Electron 安全与资源

- contextIsolation=true、nodeIntegration=false、sandbox=true、webSecurity 保持默认启用；生产窗口不开放 DevTools UI。
- 24 个 IPC 白名单及本地主框架 sender 校验保留；原始 ipcRenderer、任意 shell/文件系统接口不暴露。
- 本地 CSP、网络/导航/window.open 拒绝、标题安全文本展示、Helper 输入/输出边界和脱敏错误机制保留。
- 实际 Fuses：RunAsNode、NODE_OPTIONS、Node CLI inspect 禁用；ASAR integrity、OnlyLoadAppFromAsar 启用；其他已验证默认值不盲目改变。
- 包运行时额外放入 NODE_OPTIONS require 探针、ELECTRON_RUN_AS_NODE 与 --inspect，确认探针不执行/Node inspector 不启动。测试显式使用 localhost Chromium CDP，仅用于隔离验收，普通启动不会设置该诊断参数。
- ASAR **29 个文件**符合精确白名单，每一项 integrity hash 验证；源码字节一致。package.json 严格校验 builder 删除 scripts/dev/build/contributors 后的生产元数据。
- ASAR header SHA-256：`079e35e63363c90ce85a6c7ec7fd34875b82fc1faf9ac7dda2b9b6537a15b588`，与真实 Info.plist 的 ElectronAsarIntegrity 一致。
- ASAR 不包含 node_modules 开发工具、.cache、tests、Fixture、promo、docs、.env、AGENTS 等。Resources 中只有必要运行资源/图标、固定 Helper、Electron/Chromium 法律文件等；不复制私人证据。
- 根应用 retains hardened runtime + JIT + 既有必要 library-validation exception + calendar capability；Electron renderer/GPU helper 仅 JIT/library-validation，不含个人数据 capability；原生 EventKit Helper 仅 calendar capability，没有 JIT/库验证豁免。没有 camera/microphone/Bluetooth/Automation 描述或 entitlements。
- Calendar/Reminders 快照不主动写任务数据库；仅 Countdown/偏好/有限哈希去重元数据持久化。框架缓存/系统诊断不等同于应用保证所有磁盘路径均无敏感数据。

## 9. 依赖与许可证

官方 npm registry 的本轮 `npm audit --json`：**0 Critical、0 High、8 Moderate**（audit exit 1 表示存在报告项）。`npm ls --omit=dev --all` 为空；无运行时 npm 依赖，实际 ASAR 无 node_modules。

| 审计包 | 锁定版本 | 角色与实际运行可达性 |
|---|---|---|
| @electron/get | 3.1.0（builder 子依赖） | 开发下载工具；不随运行包。 |
| app-builder-lib | 26.15.7 | 开发打包；不随运行包。 |
| dmg-builder | 26.15.7 | 开发 DMG 构建；不随运行包。 |
| electron-builder | 26.15.7 | 直接 devDependency；不随运行包。 |
| electron-builder-squirrel-windows | 26.15.7 | 上游工具链 Windows 分支，当前 macOS 不执行；不随运行包。 |
| global-agent | 3.0.0 | 下载工具代理链；不随运行包。 |
| roarr | 2.15.4 | 工具链日志依赖；不随运行包。 |
| sprintf-js | 1.1.3 | 根格式字符串拒绝服务告警；不随运行包。 |

八个报告项来自传播到工具链的 [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)，不是八个独立应用漏洞。需攻击者控制格式字符串精度/宽度才能造成资源耗尽；当前应用界面没有通往此包的运行路径。官方 advisory 未提供 patched version，本轮 npm 查询最新 sprintf-js 仍 1.1.3。audit 建议 builder 26.5.0/semver-major 变更不是已验证的兼容修复，因此未 force fix/盲目降级。构建 CI 仍需信任输入并隔离、复核数据库；不宣称开发供应链无风险。

上游 MIT 的版权/许可/免责原文、NOTICE 和 THIRD_PARTY_NOTICES 保留且随 ASAR 分发。Electron LICENSE 和 Chromium LICENSES.chromium.html 置于 Resources/licenses/electron 并校验原件。未将项目说成从零开发。

**图标公开再分发依据仍 Not Verified**：用户指定的本地图像及现有 ICNS 用于本机候选；目前没有足够原作者/生成平台条款或可再分发授权证明。源码 MIT 不自动重新授权媒体。必须由维护者补齐来源/许可，不能因图片已整合就宣称公开权利确认。

## 10. 签名、公证、Gatekeeper

查询本机返回 **0 valid identities found**。所有角色采用 ad-hoc，内外嵌套顺序签名；真实只读 DMG 包内应用及 Helper/Electron helper 的 `codesign --verify --deep --strict` 通过。此检查证明当前字节封装一致，不证明发行者身份或 Apple 公证。

`spctl --assess --type execute` 对最终包返回 **exit 3 / rejected**。没有 Developer ID、没有 Apple 公证、没有绕过 Gatekeeper 或关闭系统安全机制。本机未 quarantine 的构建产物启动成功，不代表其他 Mac 下载后的可信打开；不建议将其作为正式或已公证包分享。

## 11. 最终 DMG

绝对路径：

```text
/Users/gaotianyu/Desktop/PMI Lab/求职项目/TO-DO-Panel-main/dist.noindex/Notchime-1.0.0-arm64.dmg
```

- 文件大小：**131,324,037 bytes（约 125.24 MiB）**。
- SHA-256：**`aed32944bd98885fbf5a779f9a51d0c75558e729ae91eb49c5b9958a8715579a`**。
- 同目录提供 `.dmg.sha256`；最终构建后及运行/篡改检查后复验一致。
- `hdiutil verify` 成功；最终只读挂载包含 **Notchime.app** 及 **Applications → /Applications** 安装入口。
- 应用/Helper 图标、Info.plist、架构、资源及全部签名按最终 DMG 的真实文件检查。
- 未覆盖已有安装。安装副本仅位于项目 APFS BuildVolume/Installed；其合成数据位于项目 .cache/tests 并在成功后移除。

## 12. 人工验收与公开发布阻塞

[人工验收清单](notchime-v1.0.0-manual-acceptance.md)与 [Release Notes 草稿](notchime-v1.0.0-release-notes.md)已准备。需要用户亲自完成：

1. Applications 安装（已有安装需确认覆盖）、新用户/下载 quarantine 及权限拒绝/恢复验证；无全局安全绕过。
2. 新正式身份真实 Reminder 完成与 Mac/iPhone 同步、真实硬件合盖/唤醒/解锁、外接显示器/Spaces；重复启动/鼠标/失焦时序稳定性复验。
3. 如需真实旧数据导入，先确认备份、来源、目标冲突；如需登录项，正式安装后主动启用。二者本轮未代为执行。
4. 获得合法 Developer ID 身份及用户批准后签名、公证、staple，再对最终重新构建包进行同等完整性/下载验收；不得把本 RC 的哈希套用于未来签名包。
5. 确认图标再分发权与相关许可文本。

**本机隔离安装条件具备；公开分发条件尚不具备，不建议现在创建公开 GitHub Release。** 必须完成可信签名/公证与 Gatekeeper 路径、图标权利和最终安装/硬件质量验收。开发依赖 Moderate 保留为可追踪工具链风险，不能仅按数量视为运行时 Critical，也不能忽略。未知偶发收起现象应在公开前充分复验并在复现后定位。

GitHub 工作流只有 workflow_dispatch，contents:read，仅上传标注 ad-hoc 的 CI artifact；build --publish never，既不普通 push 发布，也不自动创建 Release/公证。工作流本轮未在 GitHub 执行；未来正式发布需另一明确授权和可信签名配置。

文档针对性核验：10 份当前工程/发布文档、88 个本地引用检查通过，缺失引用 0；仅文档收尾未修改可执行代码，未为文档再次无意义运行全部 GUI。

## 13. 本地证据索引

证据仅在项目 `.cache/release-v1.0.0/`，不随安装包：

- `npm-test-fixed.log`、`swift-typecheck.log`、`build-final.log`。
- `permission-fixed.json`（用户授权原回复）、`launchservices.json` / `launchservices-states.json`。
- `runtime/mounted-final.json`、`runtime/installed-final.json`，相应日志。
- `final-readonly-verification.json`、`mounted-bundle-check.json`、`installed-bundle-check.json`。
- `tamper.json`、`tamper.log`、`gatekeeper.log`、`signing-identities.log`。
- `final-dmg-verify.log`、`artifact.json`、`npm-audit.json`、`dependency-assessment.json`。
- `before-hashes.json`、`unchanged-protected-files.json`；原始失败日志均保留。

报告区分构建、隔离安装、系统读取、用户确认、Fixture 和未验证项；没有把构建成功等同于公开发行许可或完整安装验收。
