# Calendar Notch Dev · Phase 1.5 交付记录

已实现本地重要倒计时，保留 Calendar / Settings 两页。按最后的布局反馈移除顶部当前日期/时间标题；标准 1240 × 616 窗口的空列表和默认 4 张常规卡片无需向下滚动，即可查看今天、下一项及完整未来 7 天。超长内容、窄屏或查看全部时仍允许页内滚动，不放大 BrowserWindow。

## 1. 文件范围

| 文件 | 改动 |
| --- | --- |
| `renderer/countdown-model.js`（新增） | 纯模型：输入校验、日期/时间计算、稳定排序、刷新间隔；Main 与 Renderer 共用。 |
| `countdown-store.js`（新增） | 版本化 JSON、Main 校验、CRUD、串行队列、文件同步和原子替换、损坏文件保护。 |
| `countdown-ipc.js`（新增） | 五个受限 CRUD Channel，仅允许当前主窗口的主 Frame；成功后发布更新。 |
| `renderer/countdown.js`（新增） | 卡片、表单、确认删除、置顶、焦点管理、低频刷新、可诊断错误与重试。 |
| `renderer/countdown-picker.js`（新增） | 应用内日期日历与时间列表，取代不可用的原生弹出控件，支持鼠标、键盘、取消和焦点返回。 |
| `renderer/countdown.css`（新增） | 复用原深色视觉变量，紧凑卡片、弹窗、概览布局和响应式滚动。 |
| `renderer/index.html` | 倒计时区与两个弹窗；移除上方日期/时间标题，保持原两页导航。 |
| `renderer/app.js` | 移除已撤下标题的 DOM 写入；Space 排除打开的弹窗；Escape 先让弹窗消费。 |
| `main.js` / `preload.js` | 接入受限倒计时 IPC、延迟创建存储服务；系统恢复时仅发送时间刷新事件；更新关于文案。 |
| `package.json` | 新模块纳入未来打包文件清单，更新描述；未增加依赖或变更版本/锁文件。 |
| `tests/countdown-model.test.js` / `countdown-store.test.js` / `countdown-ipc.test.js`（新增） | 14 项新增单元测试，内部包含多组日期、CRUD、失败和并发断言。 |
| `tests/countdown.electron.js`（新增） | 实际生产 Main、沙箱 Preload 和 Renderer 的 CRUD / 重启 / 损坏恢复测试。 |
| `scripts/test-desktop.js` / `tests/renderer-structure.test.js` | 纳入新测试及语法检查，更新独立脚本和设置 DOM 断言。 |
| `tests/notch-focus.electron.js` / `tests/startup.electron.js` | 原断言保留；在模拟键盘前等待原生焦点、按完成条件观察 watchdog，避免固定短等待误报。 |
| `README.md` / `CHANGELOG.md` / 本记录 | 当前产品行为、存储及日期规则、验证结果。 |

`renderer/styles.css`、`calendar-data.js`、`calendar.css` 和 `calendar-settings.js` 未修改。旧业务未恢复，也未进入 Phase 2 清理。

## 2. 模块架构

Renderer 表单 → Preload 的 list/create/update/delete/pin → Main 主 Frame 校验 → CountdownStore 写入队列 → 独立 JSON → 成功响应/更新事件 → 卡片刷新。

Renderer 不能提供文件路径、读写文件或提交整份旧快照。Main 为每个新增项目创建 UUID；名称允许重复。只发布成功完成的持久化结果。

## 3. 数据路径与可靠性

实际使用 `path.join(app.getPath('userData'), 'countdowns.json')`。开发版默认是 `~/Library/Application Support/Calendar Notch Dev/countdowns.json`；测试使用项目 `.cache/tests/` 内的隔离目录，结束后清理测试目录。

结构为 `schemaVersion: 1` 与 `items`，记录包含 id、title、targetDate、targetTime、color、pinned、createdAt、updatedAt。写入同目录独占临时文件，权限 0600，写入并同步后原子替换；请求串行执行并重新读取数据，避免并发旧快照覆盖。

无效 JSON、无效记录、未知版本或超大文件返回诊断错误并保留原文件，禁止静默重置。写入失败显示错误，表单不关闭；修复后可重新读取或再次保存。不使用旧 LocalStorage 待办键或 workspace.json，不读取、迁移或清理原版 Dynamic Panel 数据。

## 4. 日期与时间规则

仅日期：取本地年/月/日，换算 Gregorian 日序号后相减，显示今天、还有 N 天或已过去 N 天。计算不依赖实际经过的 24 小时，因此不会被夏令时的 23/25 小时影响。

指定时间：按当前系统时区构造本地目标时刻，区分未来、正好到达、已经过去。远期以自然日显示，临近以小时/分钟显示；没有秒级刷新。夏令时跳过的时间不能保存，重复时段采用 JavaScript Date 选择的较早一次。时区变化后，若该时刻不存在则保留数据并提示编辑。

只在日程页可见且有数据时按分钟刷新；跨午夜、重新展开、切回日程、获得焦点或 Main 的 resume 事件会校准。折叠和设置页不保留倒计时刷新计时器。

## 5. 管理操作

名称去首尾空格，最多 80 个字符；严格校验 YYYY-MM-DD 和可选 HH:MM，也拦截浏览器尚未填写完整的时间。提供五种预设颜色和置顶。

日期/时间图标使用明确的按钮与应用内选择面板。日期支持月/年切换、闰年日期和方向键跨月；时间使用内嵌小时/分钟列表，可清除时间。选择只更新表单字段，保存后才持久化。Escape 优先关闭选择面板，失焦时选择面板与编辑表单一起关闭。不新增原生窗口，不改 Main 或窗口几何。

添加/编辑支持 Enter、取消、错误提示和焦点返回。Escape 先关闭弹窗；没有弹窗时延续原窗口 Escape 行为。删除先显示确认，取消不改数据。置顶和编辑立即持久化、重排；排序为置顶优先、日期、时间（未指定视为 00:00）、创建时间、ID。

## 6. 窗口边界

未修改 createWindow、applyMode、beginNativeCollapse 的几何/动画实现，也未修改 setMode、waitForPanelMotion 的时序或原岛体 CSS。manual / automatic 元数据保留。新增 resume 监听只更新时间，不展开面板，不发送通知。

## 7. 实际验证

- `npm run test:unit`：155 通过，0 失败。
- 最终 `npm test`：退出码 0；155 项单元测试、21 文件语法检查全部通过。
- 实际 Electron 六组场景全部通过：Renderer 焦点/键盘/连续开合/减少动态效果；生产首次启动；生产重启；倒计时 CRUD；倒计时进程重启恢复；损坏文件诊断与修复恢复。
- 倒计时集成覆盖保存后即时显示、Enter 保存、编辑、置顶、删除取消/确认、磁盘失败后重试、默认四项/查看全部、跨午夜实际定时器刷新、模拟 resume、折叠时 resume 不展开、切换设置停止刷新、真实失焦关闭弹窗和面板。选择器回归覆盖实际鼠标点击两个图标及日期、闰年/月切换、方向键跨月、小时/分钟列表键盘选择、确定/取消、不指定时间、选择后保存与编辑回读、实际 Escape 及失焦关闭。
- 原回归覆盖 Escape、动画 watchdog、显示器事件和边界、手动打开不自动收起。旧业务计时器仍关闭，业务子进程/HTTP 启动数为 0，真实生产页面未记录控制台 error 或渲染进程崩溃。
- 隔离目录和工作区哨兵验证通过；原版路径不被使用，测试不写系统登录项。未执行 Git、安装、打包或发布。
- 布局检查确认空列表与默认四项不发生整页溢出，默认四项时七日列表也无需内部滚动；已检查实际截图。截图在 `.cache/phase1-5/`，完整日志在 `.cache/phase1-5-test.log` 与最新的 `.cache/countdown-picker-test.log`。

## 8. 手动验收

先从菜单栏退出当前开发版，再运行 npm start 载入新代码。添加自己的项目、编辑、置顶、取消/确认删除，再退出并重新启动确认保留。

真实 Mac 合盖/睡眠恢复、系统时区切换、实体外接显示器/Spaces/全屏仍需手动验证。本次 resume 和显示器变化使用真实 Electron 事件链的模拟事件，不能代替物理设备测试。系统登录启动和签名安装未在本轮验证。

## 9. EventKit 边界

CalendarEvent 仍由 `calendar-data.js` 提供 Mock Data，CountDown 独立模型、服务和页面区域。将来替换日历数据提供者及日程渲染入口，无需改变倒计时 CRUD 或文件。没有 Swift Helper、Apple Calendar 接入、双向同步、倒计时系统通知或自动唤出。

## 10. 限制与风险

当前未发现未解决的功能异常。目标时间随当前系统时区解释，跨时区旅行时对应的绝对时刻会变化；如未来需要固定时区，需升级数据结构。倒计时精度为分钟，最多 2000 项、文件上限 2 MB。损坏数据需手动修复或恢复，应用不会自行覆盖。突发断电未进行实机测试；已验证正常进程重启、并发顺序、写入失败保留原文件和损坏数据保护。
