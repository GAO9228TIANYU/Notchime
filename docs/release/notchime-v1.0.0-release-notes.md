# Notchime 1.0.0 — Release Notes 草稿

**Release Candidate · 未公开发布**

**There When You Need It. Quiet When You Don't.**  
**需要时出现，无需时静默。**

Notchime brings your Apple day to the MacBook notch. It uses a native Swift EventKit Helper inside an Electron-powered macOS app, without a Notchime account, custom sync server or tracking feature.

## Highlights

- **Apple Calendar:** today, next event and the next seven days, with calendar selection and colors. Application behavior is read-only.
- **Apple Reminders:** today's due and overdue incomplete tasks; complete current, non-recurring tasks in writable lists. No task creation, editing, deletion or reopening.
- **Countdown:** create, edit, pin and delete independent local milestones; persistent across app restarts.
- **Smart Notch:** startup/wake/unlock overview and upcoming-event visual reminders; default four-second auto-collapse, hover protection and manual takeover.
- **Apple ecosystem:** macOS account services, such as iCloud, synchronize to the local EventKit store. Notchime does not directly connect to an iPhone or promise fixed sync latency.

## 安装与系统要求

本地候选文件 `Notchime-1.0.0-arm64.dmg`，内含 **Notchime.app 1.0.0**，Bundle ID `com.notchime.app`。macOS only、Apple Silicon arm64；最低配置目标macOS13，真机验证环境macOS27.0。macOS13/14、Intel与其他Mac不等于已验收。

此包只有 **ad-hoc签名**，没有 Developer ID、Apple公证或公开Release。Gatekeeper拒绝此构建；不建议绕过系统保护。安装步骤和测试边界见[验收指南](notchime-v1.0.0-manual-acceptance.md)，哈希和实际验证见[报告](notchime-v1.0.0-release-report.md)。

旧开发版数据和授权不会自动迁移。Notchime使用独立数据目录，真实导入必须先明确确认来源备份和目标冲突，不能覆盖已有正式数据。

## Privacy and permissions

Calendar and Reminders request system Full Access where required by macOS. The application further restricts operations: Calendar reads only, and supported Reminder completion is the only write path. No feature uploads personal schedule/task content to a Notchime server. Countdown/preferences/deduplication metadata remain local; Apple system sync and OS diagnostics are separate. See [Privacy](../PRIVACY.md).

## Known limitations

- Reminders without due dates or with future due dates are outside today's task list; recurring and read-only-list items cannot be completed here.
- Countdowns do not sync to iPhone/iCloud. No Windows/Linux support or verified Intel build.
- Actual hardware wake/unlock, new-user permissions and download/Applications acceptance require manual verification.
- The build-tool dependency audit retains eight Moderate findings, with zero High/Critical; these packages are not shipped in the runtime. No forced upgrade was used.
- Developer ID/notarization and icon redistribution rights remain public-release gates. This draft is not evidence of publication.

## Open source

Current developer and maintainer: **GAO TIANYU** · [Notchime](https://github.com/GAO9228TIANYU/Notchime) · tianyu.gaospk@gmail.com.

MIT source license with preserved upstream copyright, permission and disclaimer. Source evolved from TO-DO Panel; [LICENSE](../../LICENSE), [NOTICE](../../NOTICE) and [third-party notices](../../THIRD_PARTY_NOTICES.md) remain bundled. Artwork and third-party runtimes retain their respective rights.
