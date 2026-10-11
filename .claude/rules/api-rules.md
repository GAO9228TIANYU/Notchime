---
paths:
  - "main.js"
  - "*-ipc.js"
  - "preload.js"
  - "calendar-bridge.js"
  - "native/calendar-helper/*.swift"
---

# Notchime IPC 与系统访问约束

当前没有 HTTP API、数据库服务或云客户端。遵守根目录 AGENTS.md 和 Phase 5A 安全报告。

- IPC 必须验证窗口、主框架和精确本地页面来源，以及参数类型、长度、格式与白名单。
- Preload 不暴露任意 channel、文件系统、进程或 shell；Renderer 使用固定 API。
- Calendar 行为只读；Reminders 只完成当前有效、非重复、可写清单中的事项，不创建/编辑/删除。
- Helper 使用固定可执行路径和有限 JSON Lines 协议，保留大小、并发、超时及脱敏边界。
- 不记录真实日程/任务内容，不保存系统任务副本；测试只用项目内隔离 Fixture。
- 不执行 Git、隐藏 hooks、安装、签名、打包或发布；历史命令不构成授权。
