# Notchime Privacy Notice

**English** · [简体中文](#简体中文) · [Project home](../README.md)

Updated 11 October 2026. This notice describes the current development source, not a certified final installer. Maintainer: **GAO TIANYU**, [tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com).

## What Notchime accesses

Notchime uses a local Swift Helper and Apple's EventKit framework to access the Calendar and Reminders databases already available on your Mac. It does not sign in to iCloud, connect directly to an iPhone or operate a separate synchronization service.

| Feature | Data used | Allowed application operations |
|---|---|---|
| Calendar | Available calendar IDs, names, colors and source metadata; selected events' titles, start/end times, all-day dates, calendar membership, identifiers, occurrence information and time zones. | Read a bounded range covering today and the next seven days; display events and schedule notch visual reminders. No event creation, editing or deletion. |
| Reminders | Incomplete items due today or earlier: identifier, title, due date/time, list name/color, completion status and checks needed to validate completion. | Read the due list; complete a user-selected, current, non-recurring item in a writable list. No creation, editing, deletion, list management or restoring an item to incomplete. |
| Countdown | The name, target date, optional time, color and pin state you enter. | Create, edit, delete and pin these independent local records. |

The Helper does not return event/reminder notes, URLs, locations or attachments. No-due-date and future-due reminders are outside the displayed list. Recurring and read-only-list items cannot be completed in Notchime; use Apple Reminders for those operations.

## Permissions: system access and application behavior

Calendar and Reminders permission requests are separate and initiated through their interface controls. Refusing Reminders access does not disable Calendar or local Countdown.

On macOS 14 and later, EventKit reading uses **Full Access to Events** and **Full Access to Reminders**. There is no special macOS permission granting Notchime “read-only Calendar” or “complete-only Reminders” access. These limits are enforced by the application's available operations. The source has older authorization branches for the configured macOS 13 target; macOS 13/14 device behavior has not been verified in the current acceptance environment.

The current core features do not request camera, microphone, screen-recording, accessibility, Apple Events automation or Full Disk Access. Normal app file access and OS/runtime behavior should not be confused with a promise that no system resource is ever used.

To revoke access, open **System Settings → Privacy & Security → Calendars / Reminders**, and disable the relevant application entry. The Release Candidate uses **Notchime** (`com.notchime.app`); the separate native Helper is Notchime EventKit. Old development grants are not transferred or reset. Return to Notchime and reload; unavailable access clears the corresponding in-memory snapshot. Calendar reminder scheduling stops when Calendar access is unavailable. You do not need to reset the TCC database or globally disable macOS protections.

## What is saved locally

Application-managed files use Electron's `app.getPath('userData')`. Notchime 1.0.0 defaults to `~/Library/Application Support/Notchime`. Old development data is left in place and is never automatically read/imported. Explicit offline import requires a confirmed source backup and a nonexistent target, preserves original data, and refuses corrupt files or conflicts.

| File | Purpose |
|---|---|
| `countdowns.json` | Countdown records, including IDs, names, target dates/times, colors, pin states and creation/update timestamps, with a schema version. |
| `app-settings.json` | Application preferences, including automatic-collapse duration and event reminder lead time. Existing unknown preference fields are preserved for compatibility. |
| `calendar-preferences.json` | Schema version and selected system calendar IDs. |
| `calendar-reminder-receipts.json` | Bounded visual-event-reminder deduplication metadata: SHA-256 keys and expiry timestamps, not event titles or a full schedule. Entries expire after 30 days; the file is capped at 5,000 records. |
| `.first-run-done` | First-run bookkeeping. |

Calendar event and Reminders task snapshots are held in memory, rather than persisted as an additional event/task database. Completion checks are also temporary; a stale identifier is not resolved by guessing from a title. Deduplication hashes are metadata, not a claim of encryption or absolute anonymity.

Countdown and preferences are local JSON, **not an encrypted vault**. Protect your macOS account and backups accordingly. Countdown writes are serialized and use a temporary file plus replacement; a corrupt file is preserved rather than silently overwritten. This documentation work has not inspected, deleted or reset your actual data.

These statements describe application-managed persistence. Electron/Chromium and macOS can create caches, diagnostic artifacts, swap or crash reports. They do not establish that sensitive information can never appear anywhere on disk.

## Network and Apple system sync

- There are no Notchime accounts, custom sync servers, tracking or analytics integrations in the current application code.
- The current application has no feature that uploads personal Calendar or Reminders content to a Notchime server.
- The local page uses bundled interface resources; the application rejects remote browser requests and unapproved navigation.
- Calendar and Reminders can still synchronize over the network through iCloud or another account configured in macOS. Those services, their privacy policies and their timing are outside Notchime's control.
- Installing development dependencies downloads packages and Electron. Following an external link in documentation can contact its destination. These are different from application features uploading your schedule.

Notchime does not guarantee zero network traffic across all operating-system, development-tool or dependency behavior. Its local processing model is not a replacement for the privacy policies of your calendar account provider.

## Logs, reports and screenshots

Current application logging suppresses native diagnostic content and avoids logging event/task titles as routine diagnostics. This is not a guarantee about all macOS or Chromium diagnostic collection.

Do not send unredacted userData, Calendar/Reminders exports, account names or screenshots of private schedules in public bug reports. Use fictional examples. The README app screenshots use isolated fictional Fixture data; the promotional phone scenes are illustrative, not captured private iPhone content or proof of sync latency.

## Evidence and limits

The [Phase 5A security audit](phase5a-privacy-security-audit.md) and [Phase 5B code review](phase5b-final-code-review.md) record the source and development test evidence. User acceptance covers system sync on the development machine; automated Fixture tests do not prove iCloud behavior. The [1.0.0 RC report](release/notchime-v1.0.0-release-report.md) separately records actual package integrity, ad-hoc signatures and user-granted permissions in isolated packaged runs. Developer ID/notarization, clean Applications/download acceptance and older-OS validation remain release gates.

No audit establishes absolute security or rules out every future dependency or operating-system issue. Report privacy or security concerns privately using [SECURITY.md](../SECURITY.md).

---

## 简体中文

[English](#notchime-privacy-notice) · [项目主页](../README.zh-CN.md)

更新于 2026 年 10 月 11 日。本说明对应当前开发源码，不代表最终安装包已通过发布验收。维护者：**GAO TIANYU**，联系邮箱：[tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com)。

### 应用访问什么

Notchime 通过本机 Swift Helper 和 Apple EventKit 访问 Mac 已有的 Calendar 与 Reminders 数据库。应用不会登录 iCloud、直接连接 iPhone，也不提供自己的同步服务。

| 功能 | 使用的数据 | 应用允许的操作 |
|---|---|---|
| Calendar | 可用日历的标识、名称、颜色和来源信息；选中日历中事件的标题、起止时间、全天日期、所属日历、标识、重复实例信息和时区。 | 在今天及未来 7 天的有限范围内读取、展示日程，安排刘海视觉提醒；不创建、修改或删除系统日程。 |
| Reminders | 今天到期及已逾期未完成事项的标识、标题、截止日期/时间、清单名称/颜色、完成状态，以及校验完成操作所需的信息。 | 读取今日待办；完成用户主动选择、当前仍有效、非重复且位于可写清单的事项；不创建、编辑、删除、管理清单或恢复未完成。 |
| Countdown | 用户输入的名称、目标日期、可选时间、颜色和置顶状态。 | 创建、编辑、删除及置顶这些独立本地记录。 |

Helper 不返回日程或待办的备注、URL、位置或附件。没有截止日期及未来到期的待办不在展示范围内。重复事项和只读清单事项不能在 Notchime 中完成，需要使用 Apple Reminders。

### 系统权限与应用行为

Calendar 和 Reminders 分别由用户在界面中主动申请权限。拒绝 Reminders 不会禁用 Calendar 或本地 Countdown。

macOS 14 及更新系统上，EventKit 读取日历需要 **Full Access to Events**，提醒事项使用 **Full Access to Reminders**。系统并不提供 Notchime 专用的“日历只读”或“仅完成待办”授权，这些限制来自应用接口和代码。源码为配置的 macOS 13 最低目标保留了旧授权兼容分支，但当前验收环境没有验证 macOS 13/14 真机行为。

当前核心功能不申请摄像头、麦克风、屏幕录制、辅助功能、Apple Events 自动化或完全磁盘访问权限。正常文件访问及系统、框架行为不等于应用承诺不使用任何系统资源。

可在 **系统设置 → 隐私与安全性 → 日历 / 提醒事项** 中撤销相关访问。Release Candidate 使用 **Notchime**（`com.notchime.app`）及 Notchime EventKit Helper；旧开发身份的授权不迁移或重置。返回应用重新加载后，不可用权限对应的内存快照会被清空；日历权限不可用时，日程提醒调度停止。不需要重置 TCC 数据库或全局关闭 macOS 安全保护。

### 本机保存什么

应用管理的文件使用 Electron 的 `app.getPath('userData')`。Notchime 1.0.0 默认使用 `~/Library/Application Support/Notchime`。旧开发数据留在原处，不自动读取或导入；明确确认的离线导入仅接受来源备份和不存在的目标，保留原数据，损坏文件或目标冲突时拒绝执行。

| 文件 | 用途 |
|---|---|
| `countdowns.json` | 带版本号的倒计时记录，包括标识、名称、目标日期/时间、颜色、置顶及创建/更新时间。 |
| `app-settings.json` | 自动收起时长、日程提醒提前时间等应用偏好；为兼容已有数据，保留未知设置字段。 |
| `calendar-preferences.json` | 版本号及所选系统日历标识。 |
| `calendar-reminder-receipts.json` | 日程视觉提醒的有限去重元数据，仅包含 SHA-256 键和过期时间，不保存事件标题或完整日程；30 天过期，最多 5,000 条。 |
| `.first-run-done` | 首次运行标记。 |

Calendar 和 Reminders 快照保存在内存中，不另建日程或待办数据库。完成操作的校验信息也是临时数据；标识失效时不会按标题猜测其他任务。去重哈希是元数据，不代表加密或绝对匿名。

倒计时及偏好使用本地 JSON，**不是加密保险库**，请保护自己的 macOS 账户和备份。倒计时采用串行写入、临时文件和替换方式保存，文件损坏时保留原件，不静默覆盖。本次文档工作没有检查、删除或重置真实用户数据。

以上描述应用主动保存的数据。Electron/Chromium 与 macOS 可能产生缓存、诊断信息、交换文件或崩溃报告，不能据此承诺敏感信息绝不会出现在磁盘任何位置。

### 网络及 Apple 系统同步

- 当前应用代码没有 Notchime 账户、自建同步服务器、追踪或分析集成。
- 当前应用没有将个人日程或待办内容上传到 Notchime 服务器的功能。
- 本地页面使用随应用提供的界面资源，拒绝远程浏览器请求和未批准的导航。
- iCloud 或 macOS 配置的其他账户仍可能通过网络同步系统日历及提醒事项，相关服务、隐私政策和延迟由账户提供者及系统决定。
- 安装开发依赖会下载软件包和 Electron；点击文档中的外部链接可能访问对应站点。这些不等于应用功能上传个人日程。

Notchime 不承诺系统、开发工具和依赖的所有路径都没有网络行为。本地处理设计也不能代替日历账户服务商的隐私政策。

### 日志、问题报告及截图

当前应用抑制原生诊断正文，不将事件或待办标题作为常规日志输出。这不代表对 macOS 或 Chromium 的全部诊断采集作出保证。

请不要在公开问题报告中提交未脱敏的 userData、日历或提醒事项导出、账户名称或私人日程截图；优先使用虚构示例。README 的应用截图来自隔离 Fixture，宣传片的手机画面是示意动画，不是私人 iPhone 录屏，也不能证明同步延迟。

### 证据与限制

[Phase 5A 安全审计](phase5a-privacy-security-audit.md)及 [Phase 5B 代码审查](phase5b-final-code-review.md)记录了源码和开发测试依据。用户验收覆盖开发机器上的系统同步；自动化 Fixture 不能证明 iCloud 行为。[1.0.0 RC 报告](release/notchime-v1.0.0-release-report.md)另行记录真实包完整性、ad-hoc 签名及隔离包运行中用户亲自授权的结果。Developer ID／公证、Applications／下载干净安装和较旧系统验证仍是发布前检查项。

审计不代表绝对安全，也无法排除未来依赖或操作系统问题。隐私和安全问题请按 [SECURITY.md](../SECURITY.md#简体中文) 私下报告。
