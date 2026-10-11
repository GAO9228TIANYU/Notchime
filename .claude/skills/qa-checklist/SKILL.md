---
name: qa-checklist
description: 手动核对 Notchime 的已有工程测试；不自动安装工具或修改真实系统数据。
disable-model-invocation: true
allowed-tools: Read Grep Glob
---

# Notchime QA 工程说明

仅在用户明确选择本说明时使用。当前测试体系见 AGENTS.md、README.md 和 scripts/test-desktop.js。

当前项目是原生 JavaScript/Electron/Swift，没有 TypeScript 或 ESLint 配置。不要运行可能下载工具的 npx，也不要使用 passWithNoTests 或降低断言。

用户授权测试后，由正常开发流程执行 npm test（单元、所有活动 JavaScript 语法、隔离 Fixture Electron 场景及忽略预启动签名的 npm source startup），另行执行 Swift 类型检查。记录通过、失败、跳过数量和环境限制。

所有测试使用项目 .cache 内的隔离目录，不读取或修改真实 Calendar/Reminders、Countdown、偏好，不执行隐藏 hooks、Git、签名或打包。Fixture 成功不能当作真实 iCloud 或物理合盖验证。
