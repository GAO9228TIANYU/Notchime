# Phase 4.5：Apple Reminders 读取与快速完成

产品名称仍为 Calendar Notch Dev，Bundle ID、userData、DMG 与发布流程未迁移。Notchime 在本文指当前开发产品。本轮没有 Git 操作、依赖安装、打包、发布、系统 TCC 重置或原版用户数据操作。

## 实现与文件

- `native/calendar-helper/main.swift`：同一 EKEventStore、同一系统变更监听器，新增 Reminders 状态、主动授权、有限日期范围未完成查询、完成操作。Calendar 的查询保持只读。
- `native/calendar-helper/ReminderDate.swift`：可独立编译测试的本地日历日期判断。
- `native/calendar-helper/Info.plist`：增加 Reminders 新旧系统用途说明，保留 Calendar 用途说明和现有 Bundle ID。
- `scripts/build-calendar-helper.js`：编译新增日期模块并计入内容哈希，保留已有签名与严格校验。
- `reminders-provider.js`：内存快照、刷新串行与防抖、午夜刷新、有限重试、能力令牌与并发完成去重；不访问文件系统。
- `reminders-ipc.js` / `preload.js`：四项白名单 API 与主页面身份验证。
- `calendar-bridge.js`：扩展白名单、完成参数校验及响应错误结构校验，复用 UUID 请求匹配、超时、崩溃与退出机制。
- `main.js`：单个共享 Bridge 接线、权限窗口层级、生命周期刷新与退出清理；Reminders 快照不进入日程提醒或自动展开模块。
- `renderer/reminders-model.js` / `renderer/reminders.js`：日期筛选、排序、今日待办、授权说明、提交状态与错误恢复。
- `renderer/index.html` / `calendar.css`：今日待办在原有“今天的日程”卡片内，与日程共享有界滚动区；没有第三个 Tab。
- `renderer/app.js`：为待办按钮保留正常 Space 键行为；自动概览展开时复位新的卡片滚动容器。没有修改窗口几何、setMode 动画顺序、applyMode / beginNativeCollapse 或 styles.css。
- `package.json`：仅新增所需隐私说明与活动模块白名单；版本、名称、ID、DMG/签名/发布参数和依赖不变。
- `tests/reminders-*.test.js` / `reminders.electron.js` / `reminders-real.electron.js` / `native-reminder-dates.swift`：新逻辑、Swift 日期、受限 IPC、Fixture GUI 与真实人工点击验证。
- 原有测试的 IPC 白名单、隐私说明白名单与页面脚本清单更新；断言没有删减。测试入口、Fixture Helper、真实 smoke 与 README 同步更新。

## 权限与协议

macOS 14+ 用 `requestFullAccessToReminders`，macOS 13 用 `requestAccess(to: .reminder)`。两个权限描述键为 `NSRemindersFullAccessUsageDescription`、`NSRemindersUsageDescription`。系统授予的 Full Access 大于实际应用能力，应用层只有完成写入接口，不提供创建、编辑、删除、改日期、改清单或恢复未完成接口。初始状态只查询，未授权时须用户点击；拒绝或撤销后只给系统设置入口，不反复申请。

Helper 动作为 `remindersStatus`、`requestRemindersAccess`、`remindersSnapshot`、`completeReminder`。Main IPC 为 `reminders:refresh`、`reminders:request-access`、`reminders:complete`、`reminders:open-settings`，事件为 `reminders:changed`。Renderer 仅能提交长度有限、不含控制字符的任务 ID；无法传入命令、路径或任务属性。Main 必须验证当前主窗口与 mainFrame。

查询返回公开字段：id、title、dueDate、isAllDay、isOverdue、listName、listColor、isCompleted、canComplete、completionBlockedReason。原生 revision 只保存在 Main 与 Helper 内存，不发送 Renderer。没有备注、URL、位置或任务文件缓存。

## 日期与刷新

官方 `predicateForIncompleteReminders(withDueDateStarting: nil, ending: tomorrow, calendars: nil)` + `fetchReminders` 读取今天及历史到期未完成事项；本地进一步排除无截止日期、明天以后和已完成事项。日期型任务根据本地自然日比较，当天全天不逾期；指定时刻的任务根据实际时间与 EventKit 时区比较。排序为到期时间、稳定 ID。

同一 EKEventStoreChanged、系统日期/时钟/时区变化通知触发防抖重新查询。启动、窗口展开、回到日程页、激活、焦点、唤醒和解锁均复用刷新链路，午夜有单个下一日期边界计时器。分钟计时器只在界面可见时重绘内存，不查询数据库。Helper 不可用时清空内存快照并有限重试；不无限增加监听器与计时器，不连接 iCloud 网络接口。

Reminders 快照只发送 Renderer；不调用 Lifecycle Reveal Coordinator / Calendar Reminder Scheduler。通用 EventKit 变更可能同时引起 Calendar 重新读取，但不会将待办转化为日程或自动弹出来源。

## 完成与并发边界

用户点圆圈或对已聚焦按钮按 Space/Enter → preload → Main 精确 ID 校验、当前列表能力与同 ID single-flight → Helper 核对当前授权、已发出的短期 revision、身份、版本与 due 状态 → 当前 Store 重新获取 EKReminder、检查无未提交修改并调用 refresh 确认仍存在 → 确认未完成、非重复、可写清单 → 仅赋值 `isCompleted = true` → `save(reminder, commit: true)` → 重新查询 → Renderer 更新。

EventKit 会随完成状态自动设置 completionDate，这是系统语义，应用没有赋值其他字段。能力令牌五分钟过期；系统变更即失效。过期、同步修改、删除、外部完成、ID 改变或保存失败均刷新并报告，不按标题寻找替代项。失败不乐观移除，超时也不自动重试写入。

重复事项依据 `hasRecurrenceRules` 禁止完成；EventKit Reminder 保存 API 没有 Calendar 事件的 span 参数，尚未证明各种清单与重复实例的完成语义。当前只能查看，由 Apple Reminders 原生 UI 完成，避免冒险批量修改系列。这是明确的第一版限制。

## 真实验证与人工验收

2026-10-11，macOS 27.0 / SDK 15.5，目标仍为 macOS 13+ arm64。原生编译与开发 Helper 签名严格校验通过。真实 Electron 最初 Calendar 已授权（10 个日历）、Reminders 尚未申请。

用户主动授予 Reminders 权限、选择非重复测试任务并点击完成。真实 Helper 返回 `save(commit: true)` 成功，刷新后该任务不再出现在未完成列表；用户回复“已通过”。结果仅记录授权、数量和成功次数，没有记录任务 ID / 标题 / 清单：`.cache/phase45/real-reminders-result.json`。确认成功 1 次、自动真实写入 0 次、Calendar 仍已授权。

最终 `npm test` 通过：123 项单元测试（含原生 Swift 日期实际执行的 15 个断言）、56 个 JavaScript 文件语法检查、12 项 Electron Fixture / 窗口回归场景、1 项真实 npm start / EventKit 读取验证，失败 0、跳过 0。新增 Reminders 场景覆盖授权拒绝与独立性、精确同名 ID、提交禁用、Space 完成、重复请求、保存失败、身份失效、权限撤销、Helper 崩溃恢复、Countdown 表单保护、不因待办刷新自动展开，以及固定窗口内的滚动约束。

旧 IPC 测试最初因新增接口失败，已更新为严格 24 项白名单，并未删除断言。自动展开回归曾受到实际鼠标点击/滚动干扰而手动接管，现仅在测试窗口忽略外部鼠标输入，仍用真实 webContents 输入验证悬停与键盘；正式应用不受影响。最后一次全套测试日志 `.cache/phase45-full-suite.log`、最终原生边界单测 `.cache/phase45-unit-final.log`。原有外观基线无改动，四种窗口状态与减少动态效果均完全匹配。Fixture 回归不代表 iCloud 同步验证，macOS 13 授权兼容分支、各账户供应商与重复系列尚未逐一真机验证。本轮没有打包，之前本地包严格签名阻塞未修复、未绕过。

请进一步人工检查：

1. iPhone 新建今天到期事项，等待 Mac Apple Reminders 可见后确认 Notchime 显示；再创建无日期与明天事项，确认不显示。
2. Notchime 完成一条专用非重复测试事项，确认 Mac 原生 Reminders 已完成并最终同步回 iPhone。
3. iPhone 完成另一条事项，确认 Notchime 在系统变更刷新后移除。
4. 创建两条同名事项，点击其中一条，确认另一条保留。
5. 在系统设置拒绝/撤销 Reminders 权限，确认 Calendar、Countdown 与原有日程自动展开正常；重新允许后重新加载。
6. 重复事项在 Notchime 的圆圈应禁用并解释原因；在 Apple Reminders 完成当前实例，观察后续实例和 Notchime 的筛选。
7. 锁屏/合盖恢复、跨午夜与时区改变后检查列表；长列表只滚动卡片内容，不改变刘海窗口尺寸。

同步时长由 macOS / iCloud / 其他已配置系统账户决定，不承诺固定秒数。不要使用真实重要任务进行破坏性验收；本应用没有恢复未完成或撤销按钮。


官方依据：[未完成事项查询](https://developer.apple.com/documentation/eventkit/ekeventstore/predicateforincompletereminders%28withduedatestarting%3Aending%3Acalendars%3A%29)、[完成状态与保存说明](https://developer.apple.com/documentation/eventkit/creating-events-and-reminders)。同时实际核对了当前 macOS SDK 的 EKEventStore.h、EKReminder.h 与 EKObject.h；Reminder 保存没有事件 span 参数，refresh 用于检测记录仍存在并重新加载未修改属性。

最终安全检查后重新编译并复验真实 `npm start`：Calendar 已授权，10 个日历、查询范围内 9 个事件，今天渲染 1 项且与模型一致；Reminders 已授权，未完成展示 0 项；启动概览 4368 ms 后完成收起，单实例、Countdown IPC、Settings 持久化与正常退出通过。真实写回证据来自本轮用户主动点击的 1 次测试；没有自动再次写入任务来复验。日志 `.cache/phase45-real-final.log`。
