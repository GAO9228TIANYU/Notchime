# Contributing to Notchime

**English** · [简体中文](#简体中文) · [Project home](README.md)

Notchime is maintained by **GAO TIANYU**. Focused bug fixes, clear reproduction cases and improvements that respect its quiet, local-first design are welcome.

## Report a bug or suggest a change

Use the project's issue tracker when a public repository is available, or contact [tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com). There is no public repository/release URL promised by this source package. Report vulnerabilities privately instead; see [SECURITY.md](SECURITY.md).

For a bug report, include:

- macOS version, Apple Silicon model, source/build version and how you launched the app.
- Minimal steps, expected behavior and observed behavior.
- Calendar/Reminders permission state and whether the problem affects a recurring or read-only-list item.
- A fictional example or a carefully redacted screenshot, if helpful.

Do not attach private Calendar/Reminders exports, full userData, account addresses, access credentials or logs containing personal schedules. You can often reproduce a problem using the isolated Fixtures under `tests/fixtures/`. For feature requests, explain the problem being solved and how the change avoids extra interruption or duplicate task storage.

## Set up the source

Use macOS with Apple Silicon, Node.js 22.12.0+, npm and Xcode Command Line Tools containing Swift and the macOS SDK. The configured deployment target is macOS 13; the accepted development environment is macOS 27.0, not evidence of macOS 13/14 compatibility. See the [system requirements](README.md#system-requirements).

In the project root:

```sh
npm ci
npm start
```

Dependency installation downloads packages and Electron. `npm start` first runs `scripts/build-calendar-helper.js`, which may compile and ad-hoc sign the local Helper, and strictly verifies newly built output; unchanged builds reuse the cache. This is a development launch, not an installed, Developer ID-signed or notarized release. Do not bypass a verification failure. The Release Candidate identity is Notchime 1.0.0 (`com.notchime.app`); do not change Bundle ID, userData or TCC identity as an incidental fix. Old profile imports require explicit confirmation and both apps to be closed.

## Module map

| Responsibility | Files |
|---|---|
| Main window, display geometry, tray, lifecycle and trusted IPC senders | `main.js`, `main-services.js` |
| Restricted Renderer boundary | `preload.js` |
| Native EventKit access and bounded JSON Lines | `native/calendar-helper/main.swift`, `native/calendar-helper/ReminderDate.swift`, `calendar-bridge.js` |
| Calendar snapshots, selection and IPC | `calendar-provider.js`, `calendar-ipc.js`, `renderer/calendar-model.js` |
| Reminders snapshots and completion | `reminders-provider.js`, `reminders-ipc.js`, `renderer/reminders-model.js`, `renderer/reminders.js` |
| Automatic reveal and event reminder scheduling | `automatic-reveal.js`, `calendar-reminders.js`, `renderer/panel-interaction.js` |
| Independent local Countdown | `countdown-store.js`, `countdown-ipc.js`, `renderer/countdown*.js` |
| Interface and animation | `renderer/app.js`, `renderer/index.html`, `renderer/calendar.css`, `renderer/countdown.css`, `renderer/styles.css` |
| Helper build and desktop verification | `scripts/`, `tests/`, `build/` |

## Test a change

```sh
npm run test:unit
npm test
```

`test:unit` runs the Node domain/security tests; pure Swift date cases compile a test executable under the project's test cache. `npm test` adds all active JavaScript syntax checks, isolated Electron Fixture scenarios and an npm source startup check that skips the signing prestart hook. A usable macOS GUI session is needed for the desktop suite.

Automatic test data and profiles belong under `.cache/tests/`. Do not copy personal events or reminders into Fixtures. Tests must not create, edit, delete or complete real system data. Opt-in native/real-data tests are separate from the default desktop suite; do not run them unattended or treat Fixture results as proof of iCloud sync. Never weaken assertions or skip valid tests to hide a failure.

For documentation-only changes, validate local links, fragments, media and technical claims; a full GUI run is unnecessary unless executable behavior changes.

## Keep the product and security boundaries intact

- Calendar operations stay read-only. Reminders exposes only user-initiated completion of a current, eligible item; recurring and read-only items remain blocked.
- Preserve context isolation, sandboxing, restricted Preload APIs, IPC sender checks, response validation and bounded Helper messages/timeouts.
- Use safe text rendering for event/task titles. Avoid logging private titles, notes or raw native errors.
- Keep Countdown independent from Calendar/Reminders; preserve atomic writes and corrupt-file protection.
- Preserve window geometry, animation ordering, hover protection and manual takeover. An automatic reveal must not interrupt Settings or a Countdown form.
- Do not add accounts, telemetry, cloud task copies, unrelated dependencies or remote UI resources.

Explain the problem, the minimal change and the checks performed when proposing a contribution. Flag unverified hardware/OS scenarios and changes affecting permissions, identity, data migration or packaging. Source and distributable-app security are different acceptance tasks.

## Licensing and presentation assets

Preserve [LICENSE](LICENSE), [NOTICE](NOTICE) and [third-party notices](THIRD_PARTY_NOTICES.md), including upstream attribution. Contributions to this MIT-licensed source should be compatible with its license; only submit code you have the right to contribute. Do not assume the source license covers every image, recording or third-party asset.

Use fictional, privacy-safe screenshots, record their origin and distinguish illustrations from actual interface captures. The current supplied icon still needs confirmed public redistribution rights before publication. Do not include private cache files or unapproved promotional material in a contribution.

---

## 简体中文

[English](#contributing-to-notchime) · [项目主页](README.zh-CN.md)

Notchime 由 **GAO TIANYU** 维护。欢迎范围明确的修复、清晰的复现案例，以及符合静默、本地优先定位的改进。

### 报告问题或提出建议

公开仓库可用后，请使用项目 Issue；目前也可联系 [tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com)。当前源码包不承诺已经存在的公开仓库或 Release 地址。安全漏洞请按 [SECURITY.md](SECURITY.md#简体中文) 私下报告。

问题报告请包含系统版本、Apple Silicon 机型、源码/构建版本、启动方式、最小复现步骤、预期与实际结果，以及相关权限状态。涉及待办时说明是否重复事项或只读清单；截图和示例必须虚构或充分脱敏。

不要提交私人日历/提醒事项导出、完整 userData、账户地址、凭据或带有日程标题的日志。优先使用 `tests/fixtures/` 的隔离数据。功能建议请说明实际问题，以及如何避免额外打扰或重复任务存储。

### 源码运行

需要 Apple Silicon macOS、Node.js 22.12.0+、npm，以及包含 Swift 和 macOS SDK 的 Xcode Command Line Tools。最低编译配置是 macOS 13，当前验收环境是 macOS 27.0，不能据此声称 macOS 13/14 已验证。参见[系统要求](README.zh-CN.md#系统要求)。

在项目根目录执行：

```sh
npm ci
npm start
```

安装依赖会下载软件包和 Electron。`npm start` 首先运行 `scripts/build-calendar-helper.js`，可能编译并 ad-hoc 签名本地 Helper，对新构建进行严格签名校验，无变化时复用缓存。这是开发启动，不是正式安装、Developer ID 签名或公证发布。校验失败不得绕过。Release Candidate 身份为 Notchime 1.0.0（`com.notchime.app`），不要为普通修复顺带修改 Bundle ID、userData 或 TCC 身份。旧数据只通过明确确认的离线导入处理，操作前关闭新旧应用。

### 模块与测试

上方[模块定位表](#module-map)列出了实际文件。窗口与 IPC 位于 Main/Preload；Swift Helper 通过受限 JSON Lines 提供 EventKit；Calendar 和 Reminders 各有 Provider；Countdown 独立保存；自动展开和提醒调度独立于业务表单。

```sh
npm run test:unit
npm test
```

`test:unit` 执行 Node 领域与安全测试，纯 Swift 日期测试会在项目测试缓存中编译测试程序。`npm test` 还执行全部活动 JavaScript 语法检查、隔离 Fixture Electron 场景及跳过签名前置脚本的 npm 源码启动检查，需要可用的 macOS 桌面环境。

测试数据及独立配置目录放在 `.cache/tests/`。不要将私人事项复制到 Fixture，也不要自动创建、编辑、删除或完成真实系统数据。真实原生读取测试与默认套件分开，需要明确人工操作；Fixture 通过不代表 iCloud 同步成功。不要削弱断言或跳过有效测试掩盖失败。仅文档修改应检查链接、锚点、素材和事实，不必重复完整 GUI 测试。

### 保持边界

保持 Calendar 只读、Reminders 仅用户主动完成当前有效且允许完成的事项，继续阻止重复及只读事项。保留 sandbox、context isolation、Preload 白名单、IPC 来源校验和 Helper 消息/超时限制。标题安全渲染，不记录私人内容或原生错误正文。保持 Countdown 独立、原子保存及损坏保护；保留窗口几何、动画时序、悬停和手动接管，不让自动展开打断设置或表单。不新增账户、遥测、云端任务副本、无关依赖或远程界面资源。

提交改动说明时，写清问题、最小修改和实际检查结果；权限、身份、迁移或打包影响，以及未验证的系统/硬件场景需要明确标注。

### 许可证与素材

保留 [LICENSE](LICENSE)、[NOTICE](NOTICE) 和[第三方声明](THIRD_PARTY_NOTICES.md)，包括上游署名。源码贡献应兼容现有 MIT 许可，且只提交有权贡献的内容；源码许可不会自动覆盖图片、录音或第三方资源。

截图使用虚构、无隐私数据，记录来源，区分示意动画与真实界面。当前提供的图标仍需确认公开分发权；不要提交私人缓存或未批准宣传素材。
