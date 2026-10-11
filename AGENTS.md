# Notchime — 开发工程约束

当前开发与维护：GAO TIANYU。基于 TO-DO Panel v1.2.0（MIT），保留上游版权；产品与历史资料的边界见 README.md、NOTICE 和 docs/phase5b-final-code-review.md。

## 实际架构

- macOS 13+ Apple Silicon 编译目标；不代表 macOS 13/14 真机全部通过。Electron 44、Node.js 22.12.0+、原生 HTML/CSS/JavaScript，无渲染构建或运行时 npm 依赖。
- main.js：窗口/多屏/Tray/Hover + Space、登录项、系统生命周期、25项受控 IPC。
- main-services.js/preload.js：精确本地页面与主框架来源校验、Chromium权限/远程请求/导航限制、隔离的白名单 API。
- calendar-bridge.js/calendar-provider.js/calendar-ipc.js：固定 Swift Helper、有限 JSON Lines 请求、EventKit 只读日历、选择/刷新/恢复。测试 Mock 仅在 tests/fixtures；生产错误不得显示 Mock。
- reminders-provider.js/reminders-ipc.js/native/calendar-helper：今日和逾期未完成 Apple Reminders；唯一写入为用户主动完成当前有效、非重复、可写清单中的事项。不创建或编辑任务，不建本地 Todo 数据库。
- automatic-reveal.js/calendar-reminders.js：已实现启动/唤醒/解锁概览、临近日程视觉提醒、去重与自动收起。Main 调度，手动操作接管，悬停暂停；不发系统通知。
- renderer/：Calendar/Settings 双页，安全文本渲染，独立 Countdown 模型/CRUD/选择器。
- countdown-store.js/countdown-ipc.js：schemaVersion 1 JSON、校验、串行原子保存、损坏文件禁止覆盖。
- calendar-settings.js：偏好校验；自动展示与提醒调度在独立模块，不在设置模块。
- build/scripts：明确应用/许可证白名单，原生编译和签名钩子；声明配置不等于正式包验证。

## 检查

- npm start 是普通源码运行入口，其 prestart 可能编译并 ad-hoc 签名 Helper；未获签名授权时不运行该预启动步骤。
- npm test：全部 Node 单元、活动 JavaScript 语法、隔离 Fixture Electron GUI 和 npm --ignore-scripts start；不读取真实系统内容、不签名、不登记真实登录项。
- npm run test:unit：Node 单元；Swift 类型检查只使用项目内模块缓存，不执行原生构建脚本。
- 所有测试数据和缓存只放项目 .cache/tests、.cache/tmp 及相应阶段证据目录。不得把 Fixture 通过称为真实 iCloud、物理合盖或所有系统版本验证。

## 必须保留

- 折叠条200px宽，菜单栏高度（0时回退38px），物理顶部居中；展开1240×616，按原屏幕限制。Tab切换不改原生边界。
- applyMode、beginNativeCollapse、Renderer setMode/waitForPanelMotion、原CSS动画时序。
- manual/automatic来源、Main→Renderer展开接口、悬停与用户接管保护、去重及退出清理。
- contextIsolation、sandbox、禁用nodeIntegration、25项IPC来源验证、Helper大小/超时边界与诊断脱敏。
- Calendar应用行为只读；macOS14+读取需要Full Access，不称系统Read Only授权。Reminders系统Full Access不等于仅完成权限，代码进一步限制。
- Countdown/设置/选择/提醒去重数据及未知设置字段。损坏文件不能用默认值静默覆盖。

## 身份和执行限制

- 正式身份Notchime 1.0.0、com.notchime.app；默认userData为Notchime。旧Calendar Notch Dev标识仅保留在显式离线导入工具/历史文档，不自动读取或迁移旧数据；不得触碰原版Dynamic Panel数据。
- 用户已指定build/notchime-icon.png作为新图标；转换衍生ICNS不等于正式签名包图标已验证。发布前确认图片的再分发权利。
- 不执行任何Git，不运行隐藏hooks，不创建仓库/分支/提交或自动发布。
- 不修改真实Calendar、Reminders、Countdown或偏好；不清理.cache私人证据。
- 不改Bundle ID、userData、TCC身份，不签名/公证/打包/安装，除非当前任务明确授权。
- 不新增AI、媒体、剪贴板、账号/云客户端、系统通知、WidgetKit或其他产品功能，不改原动画与布局。
- 保留LICENSE/NOTICE/第三方声明；来源不明资料先记录，不擅删，不称完全从零开发。
- 不删除/跳过有效测试，不放宽断言制造通过。历史资料中的Git/安装/签名命令不是执行授权。
