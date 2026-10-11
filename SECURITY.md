# Notchime Security Policy

**English** · [简体中文](#简体中文) · [Project home](README.md)

## Report a vulnerability privately

Contact **GAO TIANYU** at **[tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com)**. Please do not publish a vulnerability or sensitive reproduction data in a public issue before contacting the maintainer.

Include the affected source/build version, macOS version, minimal reproduction steps, expected security boundary and potential impact. Prefer a small fictional Fixture or redacted evidence. Do not send real Calendar/Reminders exports, full userData, credentials or private schedules. Do not complete or alter real tasks to demonstrate a vulnerability.

This is a maintainer contact, not a dedicated security team, guaranteed response SLA or encrypted email channel. If a secure way to share additional material is needed, arrange it before sending sensitive files.

## Scope and current release status

The current source is a development version. There is no validated official Notchime installer or supported-release matrix yet. Report issues in the current source and state precisely which revision or package you inspected; a package version alone does not identify all local modifications.

Security boundaries include the trusted local Renderer/Preload/Main interface, IPC sender and argument validation, bounded Swift Helper protocol, EventKit operation limits, local data integrity, browser navigation/resource restrictions and automatic-window interaction safeguards.

Calendar writes are not supported. Reminders writing is limited to validated, user-initiated completion of eligible current items. macOS Full Access is broader than those application operations; it is not a system “complete-only” permission.

## Evidence and outstanding checks

The [Phase 5A audit](docs/phase5a-privacy-security-audit.md) and [Phase 5B review](docs/phase5b-final-code-review.md) record source checks and development regressions. They do not certify every dependency path, OS version or future binary.

Formal identity, signing/notarization, Electron fuses, ASAR integrity, packaged TCC ownership and clean-install behavior remain release checks. The previous dependency review reported eight Moderate findings in development tooling; that is historical evidence, not a promise that a current vulnerability database returns the same result. Review the final locked graph and shipped components before distribution. A known strict-signature validation failure must not be bypassed.

See [Privacy](docs/PRIVACY.md) for system sync, persistence and diagnostic limits. Do not globally disable Gatekeeper, reset TCC or weaken application protections as part of a security reproduction.

---

## 简体中文

[English](#notchime-security-policy) · [项目主页](README.zh-CN.md)

### 私下报告漏洞

请联系维护者 **GAO TIANYU**：**[tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com)**。联系维护者前，请不要在公开 Issue 中发布漏洞或敏感复现数据。

请说明源码/构建版本、macOS 版本、最小复现步骤、预期安全边界及影响，优先提交小型虚构 Fixture 或脱敏证据。不要发送真实日历/待办导出、完整 userData、凭据或私人日程，也不要为演示漏洞完成或修改真实任务。

这是维护者联系方式，不是专职安全团队、保证响应时限或加密邮件渠道。如需交换额外敏感材料，请先协商安全方式，再发送文件。

### 范围及发布状态

当前源码仍为开发版本，尚无通过最终验收的官方 Notchime 安装包或受支持版本矩阵。请明确报告检查的源码或安装包；单独的包版本号不足以识别所有本地修改。

安全边界包括受信本地 Renderer/Preload/Main、IPC 来源和参数校验、受限 Swift Helper 协议、EventKit 操作范围、本地数据完整性、浏览器资源与导航限制，以及自动窗口交互保护。

Calendar 不提供写入接口；Reminders 仅允许用户主动完成当前有效且符合条件的事项。macOS Full Access 比应用操作范围更广，不是系统级“仅完成权限”。

### 证据与待验证事项

[Phase 5A 审计](docs/phase5a-privacy-security-audit.md)及 [Phase 5B 审查](docs/phase5b-final-code-review.md)记录了源码检查和开发回归，不能认证所有依赖路径、系统版本或未来二进制。

正式身份、签名/公证、Electron fuses、ASAR 完整性、打包后 TCC 归属和干净安装仍待验证。此前依赖审查记录了开发工具链的 8 项 Moderate 问题，这是历史结果，不代表最新漏洞数据库仍给出相同数量。分发前应复核最终锁定依赖及实际随包组件。已知严格签名校验失败不能绕过。

[隐私说明](docs/PRIVACY.md#简体中文)解释了系统同步、存储和诊断边界。复现安全问题时，不要全局关闭 Gatekeeper、重置 TCC 或削弱应用保护。
