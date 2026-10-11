# Phase 3A — EventKit 集成与验证记录

## 交付范围与真实结果

已实现 Electron Main → 原生 Swift EventKit Helper → Preload → Renderer 的读取链路；生产页面不再加载 Mock Events。保留 Calendar / Settings 两个入口、Countdown 模型与文件格式、原始岛体动画、窗口几何、手动/自动展开来源和未来 Main 主动展开接口。

本机 `sw_vers` 返回 **macOS 27.0（26A428）**，Swift **6.1.2**、macOS SDK **15.5**；编译显式指定 `arm64-apple-macosx13.0`，项目部署下限仍为 macOS 13。macOS 13/14 真机尚未运行验证。

用户亲自在应用设置页点击日历授权并选择允许。首次真实源码验证得到 **10 个系统日历、8 个事件**，随后真实 `npm start` 与项目内临时 `.app` 得到 **9 个事件、今日 1 项**；数量随用户系统数据变化。所有记录仅保存数量、状态和时间戳，没有输出事件标题或系统日历内容。

**本地包运行成功不等于签名验证成功**：本地 `.app` 实际启动、读取真实系统日历、Renderer 显示、单实例与退出测试通过；electron-builder 的严格签名校验失败，错误为 `resource fork, Finder information, or similar detritus not allowed`。清理后 `.app`/`.framework` 上的 `com.apple.FinderInfo` 反复重现；同时观察到 File Provider 元数据，但未确认重新写入者。构建钩子仍将严格校验失败作为错误，未绕过验证、降低安全约束或把测试包当成可分发产物。

## 新增和修改文件

| 文件 | 作用 |
|---|---|
| `native/calendar-helper/main.swift` | 单一 EventStore、授权、有限范围查询、重复实例、颜色/身份序列化、系统变更通知、JSON Lines |
| `native/calendar-helper/Info.plist` | 独立 Helper ID、macOS 13 下限、两代日历用途说明；没有无关权限 |
| `scripts/build-calendar-helper.js` | 项目内 Swift 编译、构建指纹、ad-hoc 签名、开发启动准备 |
| `calendar-bridge.js` | 固定可执行路径、唯一 requestId、响应匹配、超时、协议校验、进程故障与退出清理 |
| `calendar-provider.js` | 日历选择存储、刷新串行化、防抖、午夜调度、有限恢复、错误状态 |
| `calendar-ipc.js` | 四个受限 Main IPC；校验所属窗口和主 frame |
| `main.js` | 接线、唤醒/解锁/激活/焦点刷新、退出清理、权限弹窗期间的局部置顶/失焦保护 |
| `preload.js` | 日历刷新、申请权限、勾选、固定系统设置入口和快照订阅 |
| `renderer/calendar-model.js` | 独立纯日历展示模型：日期重叠、全天边界、排序、去重、下一项 |
| `renderer/app.js` | 真实快照渲染、授权/错误/空状态、勾选交互、缓存视图分钟刷新 |
| `renderer/index.html` / `calendar.css` | 日历设置和状态；复用现有页面与视觉变量 |
| `package.json` / `build/afterPack.js` | 开发/构建前 Helper 编译、资源白名单、用途说明、内外签名顺序 |
| `tests/calendar-{bridge,provider,model,ipc,native-contract}.test.js` | 新增纯逻辑、安全和原生接口约束测试 |
| `tests/calendar.electron.js` | 完整 Electron + Fixture Helper 权限、选择、撤销、刷新、恢复和重启测试 |
| `tests/calendar-native.electron.js` | 单独真实 EventKit 链路测试；不修改日历 |
| `tests/fixtures/*` | 演示数据迁移到测试目录、可控 JSONL Helper、测试局部依赖替换 |
| 既有结构/打包/启动/Countdown/外观测试、`scripts/test-desktop.js`、`scripts/smoke-app.js` | 对接新的真实数据源；保留核心断言，新增日历场景与真实启动检查 |
| `README.md` / 本文 | 更新现行产品事实、操作与验证边界 |

没有新增 npm 包；`package-lock.json` 未修改。`renderer/styles.css`、`applyMode`、`beginNativeCollapse`、`waitForPanelMotion` 和原始展开/收起动画内容未重写。Renderer 的 `setMode` 只增加不等待日历网络/原生结果的刷新请求，未改变手动/自动来源或加自动收起定时器。外观基线仅更新新增日历设置导致的设置内容网格高度，其他属性仍逐项比较。

## 授权与权限归属

macOS 14+ 使用 `requestFullAccessToEvents`；macOS 13 使用 `requestAccess(to: .event)`。EventKit 的 write-only 不能读取事件或日历信息，没有供本应用使用的独立只读授权。UI 解释系统 Full Access 的语义，并承诺应用实际只读取。Helper 没有事件保存/删除接口，也不访问 Reminders、联系人、麦克风、照片或辅助功能。

主 Bundle ID 为 `com.calendarnotch.dev`；Helper ID 为 `com.calendarnotch.dev.calendar-helper`。两者声明 `NSCalendarsUsageDescription` 和 `NSCalendarsFullAccessUsageDescription`。目前应用/Helper 未启用 App Sandbox，Helper 无 Electron JIT 等额外 entitlement。原生组件使用 ad-hoc + hardened runtime；没有 Developer ID 或公证。

授权只由明确按钮触发，启动只查询授权状态。拒绝、限制或撤销后清空事件，显示说明和固定系统日历权限入口，不循环请求。权限弹窗期间暂时取消主窗口置顶并抑制该次失焦收起；完成/超时后恢复，普通失焦逻辑保留。

本机已验证开发模式和临时包在获得授权后读取；重编译后本机授权仍有效。**不能据此承诺 ad-hoc 身份、不同启动宿主、移动目录、升级包或正式签名后的 TCC 归属/授权稳定性**，这些仍需独立分发包验证。没有读取/修改 TCC 数据库，没有重置系统权限。

Apple 文档：[EventKit 授权变化 TN3153](https://developer.apple.com/documentation/technotes/tn3153-adopting-api-changes-for-eventkit-in-ios-macos-and-watchos)、[Full Access API](https://developer.apple.com/documentation/eventkit/ekeventstore/requestfullaccesstoevents(completion:))、[签名扩展属性限制 QA1940](https://developer.apple.com/library/archive/qa/qa1940/_index.html)。

## 通信、数据和持久化

Helper 常驻且只有一个 EventStore/变更监听。Main 通过无 shell 的 `spawn` 执行固定路径：开发为 `.cache/native/CalendarNotchCalendarHelper.app/Contents/MacOS/calendar-helper`，打包为 `process.resourcesPath/native/...`。stdin/stdout 专用于 JSON Lines，stderr 诊断。读取请求默认 15 秒超时，人工授权最多等待 120 秒；请求使用 UUID，支持乱序匹配、分片响应、畸形消息保护。超时或崩溃清除待处理请求，不让 Main 崩溃；有限恢复后仍可手动重试。退出清理进程、所有日历定时器和订阅。

新 IPC：`calendar:refresh`、`calendar:request-access`、`calendar:select`、`calendar:open-settings`；事件为 `calendar:changed`。总活动 Handler 为 17。Renderer 不能传入查询日期、命令、Helper 路径或任意文件路径；选择只接受有长度/数量限制、无重复且当前可用的日历 ID。系统设置 URL 固定在 Main。

事件字段：`id`（实例 SHA-256）、`eventIdentifier`、`externalIdentifier`、`occurrenceStart`、`title`、`start`/`end`（绝对 ISO 时间）、`allDay`、`startDate`/`endDate`（本地日期）、`timeZone`、`calendar: { id, name, color }`。日历还带来源 ID、名称和类型。

实例 ID 组合日历、事件标识、发生时间和开始时间，区分重复实例；它不是跨账户同步的全球稳定 ID，编辑发生时间后可能改变。后续提醒去重需另外确定稳定规则，不能直接把这个展示 ID 当永久去重键。

查询起点是本地今天零时，终点是第八个本地日期零时：包含今天及接下来 7 个日期。EventKit predicate 展开重复实例/例外，应用不解析 recurrence rule。结束边界排他；跨天事件按重叠日期显示；全天事件按本地日期范围显示；下一项优先可见的正在进行/即将开始的非全天事件，不把已结束事件当下一项。时间显示跨天日期和进行中状态；事件颜色来自系统日历，非法颜色安全回退。空标题显示「无标题日程」。排序与去重确定且可测。

默认显示所有当前可用的事件日历。用户明确勾选后保存到 `app.getPath('userData')/calendar-preferences.json`：`schemaVersion: 1` 和 `selectedCalendarIds`。空数组表示不显示任何事件；日历移除不使其他日历意外重新启用。写入串行、同目录临时文件再原子替换。损坏或不支持的设置文件保留原样并阻止覆盖，显示诊断。系统事件只在内存，没有事件缓存文件或独立日程数据库。

默认数据目录仍为 `~/Library/Application Support/Calendar Notch Dev`；Countdown 仍是独立 `countdowns.json`，应用设置仍是 `app-settings.json`。验证使用 `.cache/tests/` 或 `.cache/phase3/` 的隔离目录，没有删除真实 Countdown 或原版工作区。

## 刷新与未来边界

启动、日程页打开、设置重新加载、系统 `EKEventStoreChanged`、唤醒/解锁、应用激活/窗口焦点、日历选择变化、本地午夜、系统时区/时钟/日期变化会刷新。短时变化 400ms 防抖，查询串行/合并；查询期间的新变化安排后续刷新，避免丢失。故障最多三次指数退避恢复，之后保留手动重试。始终只有一个午夜定时器。Renderer 的分钟边界仅重算缓存视图，不查询系统数据库。

没有自动弹窗、4 秒自动收起调度、通知、写入日历或 WidgetKit。未来 EventKit 数据继续作为 CalendarEvent 快照，Countdown 的独立模型/CRUD/持久化完全不依赖它。

## 自动测试与真实测试区别

最终结果以 `.cache/phase3-final.log` 为准：

| 检查 | 结果 |
|---|---|
| Node 单元测试 | 71 通过，0 失败，0 跳过 |
| JavaScript 语法检查 | 41 文件通过 |
| Electron Fixture/窗口/Countdown 场景 | 9 场景通过 |
| 真实 `npm start` | 通过；10 个系统日历、9 个事件、今日 1 项；显示数量一致 |
| 独立真实源码链路检查 | 通过；用户人工授权，初次 10 个日历、8 个事件；Renderer 无 Node 访问 |
| 最终本地临时 `.app` 启动/读取 | 通过；真实 EventKit 9 个事件、今日 1 项、单实例、设置保存、正常退出 |
| electron-builder / 严格签名 | 未通过；Finder 元数据错误，未跳过校验 |
| 收尾进程检查 | 没有残留项目 Electron 测试或 Calendar Helper |

证据：`.cache/phase3/source-smoke/source-start.json`、`.cache/phase3/native-source-result.json`、`.cache/phase3/packaged-smoke/source-start.json`、`.cache/phase3/package-final.log`。功能通过数不包含失败的签名检查。纯单元与 Electron 日历 CRUD/权限故障场景采用可控 Fixture Helper，没有读取真实日历；原有 Countdown、设置、窗口动画、Escape、失焦、快速开合、多显示器事件和 watchdog 回归仍保留。日历实例/全天/跨天/时区/DST 边界为 Fixture/纯函数测试，没有自动创建系统事件。

`npm start` smoke 与 `calendar-native.electron.js`、本地包 smoke 使用真实 Swift/EventKit。它们只读取用户已授权的数据并比较 Renderer 数量；未自动申请权限、创建事件或写入真实登录项。GUI测试退出后检查没有残留 Helper。

构建/打包严格签名失败单独计为未通过，不能被自动功能测试的通过数量掩盖。源码编译采用旧 Swift driver 避免当前工具链在项目内中文绝对 TMPDIR 上异常退出，输出有弃用警告；后续 SDK/Swift 升级需复验。一次初始编译诊断使用相对 TMPDIR 被工具链忽略，编译器暂用系统临时目录；现正式构建使用项目内绝对 TMPDIR/module-cache，未更改项目外源码或用户数据，也没有进行项目外清理。

## 真机人工验收步骤

1. 在项目执行 `npm start`，点击顶部横栏展开，切换「设置」。
2. 首次使用点击「允许读取日历」，阅读说明并亲自在系统弹窗选择允许；拒绝时确认没有反复申请。
3. 确认真实日历名称、颜色和来源出现；返回日程页确认今天/未来 7 天与 Apple Calendar 一致。
4. 由您在 Mac Apple Calendar 的已勾选日历新建测试日程，确认应用自动显示；不要通过本应用创建。
5. 在 Apple Calendar 修改该事件时间，确认更新并正确排序。
6. 在 Apple Calendar 删除测试事件，确认应用自动移除。
7. 另外检查全天、跨天、重复事件及一次例外，确认边界与系统日历一致。
8. 在 iPhone 创建事件，等待它先同步到 Mac Apple Calendar，再确认本应用自动刷新。同步由 iCloud/系统账户完成，不能承诺固定秒数。
9. 取消某个日历的勾选，确认它的日程不再显示；全部取消应显示空状态。
10. 重启应用，确认选择恢复、Countdown 未丢失，日期/时间选择器及设置仍可用。
11. 实际合盖/开盖、睡眠恢复、跨午夜或改变时区后检查日程范围；外接/移除显示器、Spaces、全屏和窗口动画需真机再次观察。
12. 如需检查权限撤销，请您在系统设置手动撤销，再激活应用，确认旧事件清空；重新授权也由您操作。

## Phase 3B 前的未解决事项

- 当前目录严格签名失败：需在允许的、不会重新附加 Finder 元数据的构建环境中复验完整签名，再评估正式 Developer ID/TCC 身份。当前本地验证包不提供分发保证。
- macOS 13 旧授权路径、macOS 14 现代路径的真机和更新包授权稳定性未测；本机 27.0 的成功不能代替这些验证。
- 系统真实新增/修改/删除、iPhone 同步延迟、重复例外和睡眠/时区变化的人工端到端验收仍需完成；自动 Fixture 不能代替系统行为。
- 未来提醒去重需单独定义实例/编辑后的身份，且区分 Apple Calendar 自身的提醒；本阶段没有调度或发通知。
