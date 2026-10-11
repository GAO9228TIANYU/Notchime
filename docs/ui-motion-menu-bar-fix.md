# 开合动画重绘优化与菜单栏图标开关

本地修订日期：2026-10-11。产品身份保持 Notchime 1.0.0 / com.notchime.app，未公开发布。

## 问题与证据边界

用户报告开合偶发卡顿。源码确认展开路径重复刷新 Calendar，并且 Calendar / Reminders 异步回包可在岛体形变期间重建列表，增加同一帧的布局和绘制工作。本次取消冗余刷新，并将授权成功状态下的列表重绘推迟至本轮动画结束，按视图仅保留最新一次更新。

没有对用户出现卡顿的那一帧取得性能轨迹，因此不能确认上述竞争是唯一原因，也不能声称消除了所有偶发掉帧。未改变 GPU 设置、原 CSS 动画、窗口几何、原生开合时序或系统权限流程。

截图中的“隐藏顶部横栏”原本只控制面板，不是菜单栏图标。现在新增“设置 → 应用 → 显示菜单栏图标”，以及菜单中的“隐藏菜单栏图标”。关闭后销毁真实 Tray，偏好持久化；顶部横栏保留入口。重新勾选恢复图标，不重复创建 Tray。无 Tray 时收起不把整个应用隐藏；用户重新打开隐藏的应用可恢复当前面板。

## 修改范围

| 文件 | 改动 |
|---|---|
| renderer/panel-interaction.js | 纯重绘队列、视图合并、代次防竞争 |
| renderer/app.js | 将 Calendar 和日历设置列表绘制与动画分离；取消重复刷新；绑定图标偏好 |
| renderer/reminders.js | 授权成功列表更新复用重绘队列 |
| renderer/index.html | 应用设置增加图标开关和说明 |
| main.js | 偏好默认值、受控 IPC、Tray 销毁/恢复、无 Tray 入口保护 |
| preload.js | 仅增加白名单 setMenuBarIconVisible(boolean) |
| tests/panel-interaction.test.js | 队列纯逻辑测试 |
| tests/motion-tray.electron.js | 新增开合绘制合并、真实 Tray、恢复、持久化和非法输入回归 |
| tests/architecture.test.js、tests/renderer-structure.test.js | 精确更新 IPC / 设置结构契约 |
| tests/startup.electron.js、tests/countdown.electron.js、tests/security.electron.js | 精确增加一个 IPC；启动状态诊断与非法来源/参数检查 |
| tests/calendar.electron.js | 日期显示断言前等待延迟绘制完成，原断言内容保持 |
| scripts/test-desktop.js | 注册新增初次启动 / 重启两种场景 |
| AGENTS.md、CHANGELOG.md | 更新当前 25 个受控 IPC 与本地修订记录 |
| docs/ui-motion-menu-bar-fix.md | 本报告 |

权限撤销和错误状态立即清除私密列表，不等待动画；数据模型仍立即更新。只排队绘制工作，不排队授权、保存或 EventKit 查询。新增 IPC 仍校验当前主窗口和本地页面来源，并拒绝非布尔输入。未新增生产依赖、权限或远程请求。

renderer/styles.css 的 SHA-256 修改前后均为：
`09a130f955071092111b2c1402d0b263fbaf9dfab2b8893747c2f735715c274c`。

## 测试结果与过程记录

最终完整 `npm test`：164 项单元测试通过，0 失败，0 跳过；73 个 JavaScript 文件语法检查通过；15 个实际 Electron 场景通过；隔离 Fixture 的真实 npm start 路径通过。涵盖 Calendar / Reminders、Countdown、Settings、Escape / 失焦、连续开合、自动/手动接管、悬停、多显示器事件和安全边界。

新增实际 Renderer 测试：展开期间连续接收 20 次 Calendar 更新，动画期间列表没有被重建，结束后仅一次子树替换，显示第 20 次数据；收起期间同样推迟绘制。它验证布局工作的时序和数量，不是帧率测量。Tray 测试验证取消勾选、菜单隐藏、恢复、重启偏好、无图标时入口保护和重新打开恢复。

修订过程中曾因精确 IPC 白名单仍为旧值、时区断言在延迟绘制前读取 DOM 而失败；对应修复为加入唯一新增 channel、等待动画绘制结束，未删除测试或放宽时间内容断言。

另有一次既有启动/重启自动收起测试超时，现场记录 automatic 来源、非悬停、非忙碌、计时器仍存在。加入有限长度的测试状态轨迹后，完整最终运行通过；该偶发超时根因尚未确定，保留失败日志，不记为已修复。它不是用户偶发卡顿的确定解释。未来复现应结合这些轨迹定位，而非延长断言时间来掩盖。

证据（均仅本地测试，不随应用打包）：
- `.cache/ui-smoothness/npm-test-delivery2.log`：最终完整测试。
- `.cache/ui-smoothness/npm-test-delivery.log`：保留的偶发收起失败。
- `.cache/ui-smoothness/startup-states-initial.json`、`startup-states-restart.json`：有界状态轨迹。
- `.cache/ui-smoothness/build-final.log`、`bundle-check.json`：最终构建及包内验证。
- `.cache/ui-smoothness/runtime-final.log`、`runtime/packaged-regression.json`：实际包内运行。

## 最终 DMG 与包内运行

- 路径：`dist.noindex/updates/Notchime-1.0.0-arm64.dmg`。
- 文件大小：131326327 字节。
- SHA-256：`ecc819fba8c98e73567d470a0750cce405a045108c1050002b923adc07f69148`。
- 身份：Notchime / com.notchime.app / 1.0.0 / arm64。
- DMG 校验、只读挂载、Applications 链接通过。
- 29 项 ASAR 文件的内容、完整性与源码一致；图标、许可证、Fuses 和 strict/deep 嵌套签名检查通过。
- 从最终挂载包启动，在项目内隔离 profile，工作目录不含源码；Helper 从包内 Resources/native 启动。
- 真实 EventKit：Calendar 已授权，读取 10 个日历和 8 项范围内事件；今日 0 项，展示符合模型。Reminders 已授权，当前符合筛选任务 0 项。仅记录授权和数量，不记录标题。此次未执行任何真实 Reminders 写入。
- 包内 Countdown 新增/编辑/删除确认/置顶/重启恢复、设置保存、图标隐藏/恢复及重启偏好、单实例和正常退出通过。
- 默认自动展开至收起观察值 4321ms（含动画）；不代表所有硬件环境均相同。
- 本次未重新做真实合盖、锁屏或真实任务完成；相关既有人工验收不替代此次新增场景验证。

签名仍为 ad-hoc。Gatekeeper 实际检查返回 rejected（退出码 3），没有 Developer ID 或 Apple 公证；不得称为正式公开发行安装包，不建议绕过系统安全设置。

原 `dist.noindex/Notchime-1.0.0-arm64.dmg` 原样保留，SHA-256 仍是 `aed32944bd98885fbf5a779f9a51d0c75558e729ae91eb49c5b9958a8715579a`。README 中 Google Drive 地址仍对应原包，未上传新包，未把旧链接/校验值冒充更新包。

## 安装与人工复查

先退出正在运行的旧应用，再由用户手动从更新 DMG 安装；本轮没有覆盖真实 Applications，也没有修改真实用户偏好或数据。安装后打开“设置 → 应用”，取消“显示菜单栏图标”，确认顶部横栏仍能展开；重新勾选确认恢复，重启确认偏好保留。

请在日常使用中观察连续及间隔开合、系统同步到达时开合、开盖恢复、自动展开悬停后离开，以及进入 Countdown / Settings 后手动接管。如果仍偶发卡顿，应捕获当时的帧时间与主/渲染线程轨迹，避免把所有偶发系统合成延迟归于同一原因。云盘包需由用户自行替换，不会自动上传。
