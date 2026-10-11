# Calendar Notch Dev · Phase 2 交付记录

## 清理前审计

当前页面不加载旧工作区，但 Main 仍包含 3534 行实现并注册 61 个业务/核心 IPC（包含独立 Countdown 的 5 个）。旧业务启动入口虽然停用，未暴露于 Preload，仍可在 Main 中找到完整处理器、状态集合与退出清理代码。Renderer 的 domain.js 为唯一实际加载的混合旧业务模块，其中只有 shouldTogglePanelForSpace 被当前页面使用。styles.css 为 5385 行，包含未使用的业务选择器和被当前页面继承的共享样式。

依赖审查确认 ws 仅用于旧云转写与旧安装冒烟脚本；Calendar、Settings、Countdown 均不使用它。旧官网展示 TO-DO Panel 已删除业务并指向上游下载，不被桌面引用；原 Windows 发布/安装路径也已不属于 macOS-only 产品。

## 删除与保留

原 macOS .icns 应用图标保留，Windows 专用 PNG 已删除。

以下专属文件已删除（website/ 整个旧官网、其 npm 配置/锁文件/测试/图片也已删除）：

- `platform.js`
- `renderer/domain.js`
- `renderer/workspace.js`
- `renderer/effects.js`
- `renderer/icon-motion.js`
- `renderer/notification.js`
- `renderer/notification.html`
- `renderer/notification.css`
- `scripts/codex-notify.js`
- `scripts/claude-notify.js`
- `scripts/verify-windows.ps1`
- `tests/domain.test.js`
- `tests/platform.test.js`
- `tests/todo-import.test.js`
- `tests/transcription.test.js`
- `tests/todo-inbox.electron.js`
- `tests/retained-workspace.electron.js`
- `renderer/assets/mirror-portrait.jpg`
- `renderer/assets/app-logo-128.png`
- `renderer/assets/generated/pomodoro-bg-mini.png`
- `renderer/assets/generated/music-bg-large.png`
- `renderer/assets/generated/music-bg-small.png`
- `renderer/assets/generated/pomodoro-bg-medium.png`
- `renderer/assets/generated/music-bg-mini.png`
- `renderer/assets/generated/pomodoro-bg-small.png`
- `renderer/assets/generated/pomodoro-bg-large.png`
- `renderer/assets/generated/music-bg-medium.png`
- `.github/workflows/pages.yml`
- `build/to-do-panel-icon.png`

main.js 中移除待办提醒/JSON 导入、AI 任务通知队列和 HTTP、链接抓取/AI 整理、Workspace/便携媒体、窗口扫描与应用图标提取、剪贴板目标/自动粘贴/采集、密钥 safeStorage、汽水音乐、媒体权限、转写 WebSocket 和录音文件处理等代码。不删除对应的真实旧文件；应用根本不再读取这些路径。

保留：

- main-services.js 的本地页面导航/子窗口安全策略及 Hover + Space 策略。
- 将旧提醒定时上限函数整理为 notificationTimerDelay，防止 Node 超长延迟被转换为 1ms；它不创建任何通知或调度器。
- 原窗口尺寸/定位、applyMode、beginNativeCollapse/watchdog、鼠标穿透、Tray、单实例、登录项、恢复事件、Main → Renderer 展开接口。
- renderer/app.js 中的 setMode 与 waitForPanelMotion 没有重写，仅将旧领域模块名称替换为 PanelInteraction。
- Countdown 的模型、选择器、UI、存储与 IPC 实现保持不变；schemaVersion 和文件内容不迁移。
- 原 macOS .icns 图标、ad-hoc afterPack 钩子及必要的 Electron runtime entitlements；未验证正式打包或签名。
- LICENSE、上游 README 与设计历史不进入打包，保留来源记录；其中历史路径可能指向本阶段已删除的模块。

## 修改与结构

- main.js：专注基础设施，清除业务耦合；保留 8 个窗口/设置 handler；补充独立 session/crash/log 路径、显示器监听退出释放和未获单实例锁时的启动保护。
- main-services.js：仅 3 个通用纯函数。
- renderer/panel-interaction.js：从 domain.js 提取原 Space 判定函数，保留原测试断言。
- renderer/styles.css：仅保留实际使用的 shell/导航/卡片/减少动态效果规则与 token，原声明和级联顺序保持；清理前样式基线用于逐项对照。
- renderer/index.html/preload.js：活动引用与阶段文案；Preload 的活动 API 不增加旧业务能力。
- package.json/package-lock.json：删除 ws、Windows/NSIS、旧文件白名单及媒体/AppleScript权限声明，原锁定 Electron 44.0.0 和 electron-builder 26.15.7 保持。
- scripts/test-desktop.js：自动检查活动 JavaScript，加上样式基线及真实源码启动场景。
- scripts/smoke-app.js：使用 Node 自带 WebSocket 替换 ws，验证 npm start、单实例和正常退出，不安装应用。
- .github/workflows/release-dmg.yml：只保留手动 macOS 产物验证，删除 Windows、上游官网部署及自动发布，不在本轮运行。
- README、CHANGELOG、AGENTS、CLAUDE：同步当前产品范围与数据安全约束。

```text
main.js / main-services.js / preload.js
calendar-settings.js
countdown-store.js / countdown-ipc.js
renderer/
  index.html / app.js / panel-interaction.js / styles.css
  calendar-data.js / calendar.css
  countdown-model.js / countdown.js / countdown-picker.js / countdown.css
build/
  afterPack.js / entitlements.mac.plist / 原应用图标
scripts/
  test-desktop.js / smoke-app.js / release-policy.js
tests/
  Calendar / Countdown / Settings / 安全 / 架构 / 发布配置单元测试
  appearance / notch-focus / startup / countdown Electron 测试
  fixtures/window-appearance.json
```

## IPC 清单

Main handler 从 61 个减为 13 个：

- window:set-mode、window:begin-collapse、window:set-tab、window:metrics。
- settings:get、settings:set-auto-launch、settings:set-auto-collapse-seconds、app:about。
- countdowns:list、countdowns:create、countdowns:update、countdowns:delete、countdowns:pin。

仍保留 Main → Renderer：key:escape、shortcut:toggle-panel、window:request-collapse、window:request-expand、window:metrics-changed、settings:changed、countdowns:changed、countdowns:refresh-time。

移除 todos/pomodoro/workspace/todo-inbox/media/tasks/shell/links/smart/windows/task-notification/mirror/credentials/music/transcription/recordings/clipboard 业务 IPC 及未暴露的 shortcut:hover-space-status、settings:set-feature/default-tab/shortcut。架构测试检查 handler 与 Preload invoke 精确对应；实际 Main 启动测试捕获注册清单，不使用已删除计时器的伪占位状态。

## 数据与扩展边界

开发版名称和 com.calendarnotch.dev 不变，默认 userData 为 ~/Library/Application Support/Calendar Notch Dev。未知设置字段继续原样保留；Countdown 主实现文件哈希与 Phase 1.5 相同，真实数据未访问、删除或转换。所有测试仅在项目 .cache/tests 内操作，并用旧工作区哨兵文件验证不受影响；测试禁止写系统登录项。

Phase 3 可替换 CalendarMock 的提供者边界；Countdown 仍由独立 CRUD/store 管理。未来提醒可复用安全计时上限、窗口扩展请求和生命周期事件；需另行设计事件身份、去重/睡眠恢复调度及系统通知适配。本轮没有创建 Helper、提醒调度器、通知窗口或自动触发。

## 验证

清理前完整基线：155 个单元测试、21 个文件语法、6 个实际 Electron 场景通过。

最终 `npm test` 退出码 0（日志 `.cache/phase2-final.log`）：

| 检查 | 通过 | 失败 | 跳过 |
|---|---:|---:|---:|
| Node 单元测试 | 39 | 0 | 0 |
| 活动 JavaScript 语法检查 | 30 | 0 | 0 |
| Electron GUI 集成场景 | 7 | 0 | 0 |
| 实际 npm start / 单实例 / 正常退出 | 1 | 0 | 0 |

7 个 GUI 场景分别为清理前样式基线、Renderer 开合/焦点/减少动态效果、生产首次启动、生产重启、Countdown CRUD、Countdown 重启恢复、Countdown 损坏文件保护。覆盖 Picker 鼠标/键盘选择、编辑/删除确认/置顶/保存失败、午夜/睡眠恢复、设置、Escape、真实失焦、快速连续开合、模拟外屏/窄屏几何、显示器 added/removed/metrics 事件、显示器变化期间 watchdog 恢复、窗口 close/hide/show、manual/automatic 来源，以及旧业务 HTTP/子进程启动数为 0、13 个活动 IPC 精确注册、旧工作区哨兵未变和零页面错误。

单元测试从 155 减少到 39，是删除退出产品范围的待办、工作区、布局七组件、AI、转写、媒体、剪贴板、链接、密钥和 Windows 逻辑测试的结果。原 Calendar/Countdown/Settings 单元断言及窗口安全/Space 断言保留，新增架构引用/IPC 边界检查，并保留通用计时上限验证；原 6 个有效 GUI 场景均保留并扩展，新增样式和源码启动验证。没有 skip、过滤失败测试或自动覆盖样式基线。

离线移除 ws 后，`npm ls --depth=0` 退出码 0，仅 Electron 44.0.0 / electron-builder 26.15.7。实际源码启动、设置写入、第二实例正常退出和主实例正常退出码 0；测试结束后没有本项目 Electron 主进程或 Helper 残留。测试中曾发现焦点与异步状态等待问题；修正测试的原生焦点建立和 tab 顺序起点，保留全部原有有效断言。“手动展开不自动收起”的 4.2 秒测试持续建立前台焦点前置条件，只调用 focus、不重新展开窗口，因此自动收起仍会使断言失败；真实失焦收起在独立场景验证。源码退出使用实际进程退出码判定，避免 Electron 关闭 CDP 时不返回 Browser.close 应答导致测试误报。显示器与 watchdog 同时触发采用有界状态等待，检查实际最终边界与模式，而不依赖单次固定延迟。

## 限制与后续

- 实际双显示器插拔、菜单栏自动隐藏、不同显示缩放及 Spaces/全屏切换仍需真机人工验证；自动测试覆盖模拟外屏/窄屏几何和三个真实 Electron display 事件路径。
- macOS 独立打包后的登录启动、签名、公证及 Gatekeeper 不在本轮验证；源码模式确认不会注册通用 Electron 登录项。
- 样式基线来自当前 Mac/Electron 环境；升级 Electron/系统字体时应人工核查差异后更新基线，不能自动覆盖来掩盖回归。
- electron-builder 的 Windows 相关传递依赖属于构建工具内部，不是本产品的运行时业务依赖，不手工破坏其锁定依赖树。
- EventKit 集成无已知代码清理阻塞；授权、Swift Helper 打包/生命周期和日历变更策略仍须在 Phase 3 验证。

最终 Main 为 726 行，styles.css 为 620 行；删除 94 个文件。完整机器可读审计清单在项目 `.cache/phase2-audit.json`。

旧 `.claude/` 开发工具模板与 HARNESS 学习文档不参与应用启动或打包，保留；它们不授权执行 Git、构建或项目外操作，当前用户约束和 AGENTS/README 优先。

完整删除路径清单：

- `platform.js`
- `renderer/domain.js`
- `renderer/workspace.js`
- `renderer/effects.js`
- `renderer/icon-motion.js`
- `renderer/notification.js`
- `renderer/notification.html`
- `renderer/notification.css`
- `scripts/codex-notify.js`
- `scripts/claude-notify.js`
- `scripts/verify-windows.ps1`
- `tests/domain.test.js`
- `tests/platform.test.js`
- `tests/todo-import.test.js`
- `tests/transcription.test.js`
- `tests/todo-inbox.electron.js`
- `tests/retained-workspace.electron.js`
- `renderer/assets/mirror-portrait.jpg`
- `renderer/assets/app-logo-128.png`
- `renderer/assets/generated/pomodoro-bg-mini.png`
- `renderer/assets/generated/music-bg-large.png`
- `renderer/assets/generated/music-bg-small.png`
- `renderer/assets/generated/pomodoro-bg-medium.png`
- `renderer/assets/generated/music-bg-mini.png`
- `renderer/assets/generated/pomodoro-bg-small.png`
- `renderer/assets/generated/pomodoro-bg-large.png`
- `renderer/assets/generated/music-bg-medium.png`
- `website/postcss.config.mjs`
- `website/next-env.d.ts`
- `website/README.md`
- `website/.gitignore`
- `website/package-lock.json`
- `website/package.json`
- `website/tsconfig.json`
- `website/vite.config.ts`
- `website/eslint.config.mjs`
- `website/next.config.ts`
- `website/app/landingTabs.mjs`
- `website/app/assetPath.d.ts`
- `website/app/landingTabs.d.ts`
- `website/app/RealProductMedia.tsx`
- `website/app/landingHero.mjs`
- `website/app/landingContent.ts`
- `website/app/landingHero.d.ts`
- `website/app/assetPath.mjs`
- `website/app/CapabilitiesSection.tsx`
- `website/app/LandingPage.tsx`
- `website/app/OperationMarquee.tsx`
- `website/app/ProductStory.tsx`
- `website/app/landingDownload.mjs`
- `website/app/layout.tsx`
- `website/app/HeroSection.tsx`
- `website/app/landingMedia.d.ts`
- `website/app/page.tsx`
- `website/app/globals.css`
- `website/app/TabStack.tsx`
- `website/app/landingDownload.d.ts`
- `website/app/landingMedia.mjs`
- `website/app/EndingSection.tsx`
- `website/tests/landingHero.test.mjs`
- `website/tests/landingDownload.test.mjs`
- `website/tests/assetPath.test.mjs`
- `website/tests/landingMedia.test.mjs`
- `website/tests/landingTabs.test.mjs`
- `website/tests/landingPage.test.tsx`
- `website/public/notchtodo-logo.png`
- `website/public/favicon.png`
- `website/public/og.png`
- `website/scripts/prepare-pages-output.mjs`
- `website/.openai/hosting.json`
- `website/build/sites-vite-plugin.ts`
- `website/worker/index.ts`
- `website/app/reactbits/Prism/Prism.tsx`
- `website/app/reactbits/Magnet/Magnet.tsx`
- `website/app/reactbits/EchoText/EchoText.tsx`
- `website/public/product-captures/credentials.webp`
- `website/public/product-captures/home.jpg`
- `website/public/product-captures/notes.webp`
- `website/public/product-captures/clipboard.webp`
- `website/public/product-captures/links.webp`
- `website/public/product-captures/recordings.webp`
- `website/public/product-captures/todo.webp`
- `website/public/tab-captures/links.mp4`
- `website/public/tab-captures/recordings.mp4`
- `website/public/tab-captures/credentials.mp4`
- `website/public/tab-captures/notes.mp4`
- `website/public/tab-captures/todo.mp4`
- `website/public/tab-captures/clipboard.mp4`
- `website/public/hero/mac-scene-hq.jpg`
- `website/public/hero/mac-wallpaper-v2.jpg`
- `website/public/hero/mac-foreground-mask.svg`
- `website/public/hero/panel-collapsed.png`
- `.github/workflows/pages.yml`
- `build/to-do-panel-icon.png`
