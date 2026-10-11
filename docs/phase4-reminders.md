# Phase 4：自动概览与刘海日程提醒

窗口动画与几何由原有 Main / Renderer 控制。`automatic-reveal.js` 仅管理临时展开会话、Renderer 动画完成确认、悬停保护与用户接管；`calendar-reminders.js` 管理真实 EventKit 日程的提前提醒。Apple Reminders 是后续 Phase 4.5 的独立模块，两者没有任务调度关联。

启动（含登录项启动）、resume 与 unlock-screen 经 600 ms 合并、15 秒冷却处理。窗口可见与 Renderer 就绪后，日历查询最多等待 2.5 秒。显示器布局变化、activate 与 focus 不单独触发概览。automatic 使用 showInactive，不抢焦点；默认 4 秒完成展示后走原有收起动画，悬停暂停、离开重新计满时长。主动点击、键盘或滚动转为 manual；Settings 与 Countdown 表单不会被自动提醒切换或关闭。

日程提醒只处理已授权、已选日历中的非全天未来事件，提前 0 / 5 / 10 / 15 分钟（默认 10）。单定时器安全分段，事件变化、选择变化、权限撤销与睡眠会取消并重算。去重键使用日历、事件原始身份、发生时间、开始时间与提醒提前量的 SHA-256，不使用展示 ID。`calendar-reminder-receipts.json` 只保存哈希与过期时间，最多 5000 项、30 天过期，不保存标题或事件列表；写入失败与损坏文件会阻止提醒并显示诊断。错过的历史提醒不补发。

## Phase 4 验证基线

2026-10-11 的完整测试：101 项单元测试、46 个 JavaScript 文件语法检查、11 项 Electron Fixture / 核心回归场景、1 项真实 npm start / EventKit 读取 smoke 均通过，无失败与跳过。真实读取为 10 个日历、范围内 8 个事件；当日 0 项符合系统实际数据。启动概览至完成收起 4348 ms（包含收起动画）。测试数据目录均在项目 `.cache/tests/`，没有自动修改系统日历。

用户随后确认真实合盖恢复、提前 10 分钟日程提醒、鼠标悬停接管通过。登录项实际登录启动、额外物理多屏组合仍需在对应环境复验。

本阶段不发送通知中心通知、不改 Apple Calendar alarm、不播放声音、不开发 WidgetKit。未修复 Phase 3A 已记录的本地包严格签名阻塞，未打包或发布。
