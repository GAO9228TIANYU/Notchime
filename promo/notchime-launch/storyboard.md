# Notchime — 60 秒双语制作预览

1920×1080，30 fps，16:9，H.264，AAC 48 kHz。深蓝黑背景、柔和蓝紫高光、自制设备轮廓；保留真实应用界面，无夸张粒子。英文主标题，中文独立副行，间距 14 px。最后约 2 秒保持完整静态品牌画面。所有片段保留 Preview 标记。

| 时间 | 镜头与动作 | 英文 / 中文 | 素材性质与边界 |
| --- | --- | --- | --- |
| 0–5 | MacBook 刘海特写，轻缓镜头推进/拉回，应用从顶部展开 | Meet Notchime. / 遇见 Notchime。 | 自制 MacBook 轮廓 + 真实 Electron Fixture 的展开帧；非正式 Logo |
| 5–9.5 | iPhone Calendar 的测试事件编辑与保存 | Plan your day on iPhone. / 在 iPhone 上，轻松安排每一天。 | 明确标注 iPhone 动画；事件为“设计评审 · Design review”，14:00–15:00；非原生 Calendar 录屏 |
| 9.5–14 | iPhone Reminders 的今天到期任务创建 | 同上；Apple Reminders | 明确标注动画；任务为“发送演示稿 · Send demo deck”，非重复、今天到期 |
| 14–20.1 | iPhone 与 Mac 同屏，简洁线条经过 Apple system sync 标签；实际应用中的同名事件/任务放大可读 | One Apple ecosystem. No duplicate entry. / 融入 Apple 生态，无需重复录入。 | Mac 是真实应用 Fixture；iPhone 是动画；不可作为 iCloud 验证；没有 Notchime 云节点 |
| 20.3–26 | iPhone 切到 Reminders，同一任务保持对应；Mac 显示系统日程与待办 | Your day, right in your notch. / 你的日程，就在刘海之间。 | 真实 UI 裁剪放大，不重画应用列表；不声称 Notchime 创建第二套数据库 |
| 26–30.3 | 实际应用今日待办区域，指针提示完成圆圈，真实 Fixture 完成后未完成列表移除 | Complete here. Updated across your devices. / 在 Mac 上完成，在 Apple 设备间同步更新。 | 真实应用 IPC/Renderer 操作，Fixture 写入；不是实际 EventKit 写入 |
| 30.3–36 | iPhone 同名任务显示完成，Apple 系统同步线保持克制 | 同上；底注说明同步示意与延迟可变 | iPhone 状态是动画，未验证实际回写；不承诺即时同步 |
| 36–39 | 自制锁图标与两行隐私主张 | Your schedule. Your data. Your privacy. / 你的日程，你的数据，你的隐私。 | 品牌立场，无绝对安全承诺 |
| 39–44 | 三张低对比边框卡片顺序出现，约 4 秒完整停留 | No Notchime account / 无需 Notchime 账户；No custom servers / 无需开发者服务器；No app tracking* / 应用不追踪用户* | 依据 Phase 5A 第14节；片内注明“当前应用代码范围”，Apple 系统账户同步另行处理 |
| 44–52 | 真实自动提醒定时器展开，悬停1.3秒，离开后完整4秒计时并收起；干净桌面 | Only when it matters. / 只在需要时，恰到好处地出现。 | 8秒按原始时间采集，实际 Main → Renderer 与 CSS 动画；测试事件安排为5分钟后，提前5分钟策略；不冒充真实睡眠/解锁录屏 |
| 52–60 | 原创临时 notch 轮廓 + Notchime 字标；双语 Slogan 和底部定位，最后2秒静止 | There When You Need It. Quiet When You Don't. / 需要时出现，无需时静默。 | 正式图标缺失，临时字标；Made for macOS · Local-first · Open Source / 专为 macOS 打造 · 本地优先 · 开源 |

## 另外两条视频

- 14秒短版：主片19–25秒 + 26–34秒，集中呈现两类数据及任务完成；保留 Preview 和同步示意标记。
- 8秒 README 循环：主片44–52秒，自动展开/悬停/收起；960×540 MP4，无声。640×360 GIF 为兼容备用，不适合手机阅读完整小字。

## 隐私证据

依据项目 `docs/phase5a-privacy-security-audit.md` 第14节：No accounts、No custom servers、Local-first 为 Verified；No tracking 仅限当前应用代码及受控运行范围。辅助文案因此改为 No Notchime account 与 No app tracking*，避免将 Apple ID 或操作系统诊断纳入无限承诺。未使用“100% Secure”或“不经网络”。该报告明确尚未通过正式发布验收，视频不能替代最终包安全审计。
