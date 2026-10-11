<div align="center">
  <img src="docs/assets/notchime-icon.png" width="112" height="112" alt="Notchime 霓虹玻璃提醒铃图标" />
  <h1>Notchime</h1>
  <p><strong>需要时出现，无需时静默。</strong></p>
  <p><strong>把 Apple 生态中的一天，带到 MacBook 的刘海里。</strong><br />
  一款隐私优先的 macOS 刘海助手，汇集 Apple Calendar、Reminders 与本地倒计时。</p>
  <p><a href="README.md">English</a> · <strong>简体中文</strong></p>
  <img src="docs/assets/platform-badges.svg" width="508" alt="macOS · Apple Silicon · MIT 源码许可 · 本地优先" />
  <p><a href="#一眼看清今天">了解功能</a> · <a href="#开始使用">开始使用</a> · <a href="docs/PRIVACY.md#简体中文">隐私说明</a> · <a href="#常见问题">常见问题</a></p>
</div>

![Notchime 实际工作台：本地倒计时、今日日程与 Apple Reminders 待办](docs/assets/notchime-dashboard.png)

*截图来自实际开发界面，内容全部为虚构测试数据。当前应用界面为中文；双语文档不代表应用已提供英文界面，也不代表已正式发布。*

## 一眼看清今天

看一眼下一场会议，完成一条待办，让重要的日期始终在心里有数。Notchime 把这些小事放在屏幕顶部，方便查看，也懂得适时收起。

| 日历 | 提醒事项 | 倒计时 | Smart Notch |
|---|---|---|---|
| 今天、下一项与未来七天日程。 | 今日及逾期待办，一次点击完成符合条件的事项。 | 重要日期，保存在这台 Mac。 | 适时展开、悬停保护，手动操作由你掌控。 |

### 用十秒认识 Notchime

[![观看 Notchime 宣传短片：实际应用界面置于示意 MacBook 画框中](docs/assets/notchime-film-poster.png)](docs/assets/notchime-trailer-10s.mp4)

**[观看或下载短片](docs/assets/notchime-trailer-10s.mp4)** · 9.6 秒 · 1080p · 有声

短片使用虚构数据的真实 Mac 应用画面，以及 iPhone 和设备框架的示意动画。它是产品展示，不是 iCloud 同步实录。Smart Notch 镜头经过节奏剪辑，不能据此判断真实四秒计时。GitHub 可能打开文件页或下载 MP4，本页不依赖内嵌视频自动播放。

## 融入 Apple 生态，让日程自然流转。

在 iPhone 上安排日程或添加待办。Apple 系统账户将内容同步到 Mac 后，Notchime 通过本机 EventKit 读取。你在 Notchime 中完成符合条件的待办后，后续同步仍由 Apple 系统处理。

```mermaid
flowchart TD
  Phone["iPhone 日历 / 提醒事项"] <-->|"Apple 系统账户同步，例如 iCloud"| Mac["macOS 日历 / 提醒事项数据库"]
  Mac -->|"本机 EventKit 访问"| App["Mac 上的 Notchime"]
  App -->|"仅完成符合条件的提醒事项"| Mac
```

**无需重复录入，也无需维护第二套待办数据库。**

Notchime 不直接连接 iPhone，也没有自建 iCloud 同步服务。同步速度由账户服务、macOS 和网络状况共同决定，不能保证固定延迟。

## 给重要的事，留一个位置

### Apple Calendar：知道接下来要做什么

查看今天的日程、正在进行或即将开始的下一项定时日程，以及未来七天。选择要展示的日历，保留系统日历颜色，并正确呈现全天、跨天和重复日程实例。

![实际 Notchime 界面中的今日日程，使用虚构测试数据](docs/assets/calendar-preview.png)

**Notchime 的日历操作始终只读。** 创建、编辑和删除日程，请在 Apple Calendar 中进行。

### Apple Reminders：顺手完成今天的小事

今天到期和已经逾期的未完成事项，与今日日程放在一起。点击左侧圆圈即可完成符合条件的事项；确认 EventKit 写入后，列表才会刷新。

![实际今日待办区域与完成圆圈，使用虚构提醒事项](docs/assets/reminders-preview.png)

没有截止日期、未来才到期的事项不在当前列表中。重复提醒事项和只读清单中的事项到期时可以显示，但需要在 Apple Reminders 中完成。Notchime 不创建、编辑、删除或恢复未完成事项，也不管理清单。

### Countdown：让重要时刻更近一点

创建、编辑、删除和置顶本地倒计时，设置日期、可选时间与颜色。仅指定日期时按本地自然日计算；指定时间时使用本地时区。重启后仍会保留，与系统日历及提醒事项相互独立。

![置顶倒计时、目标日期及管理按钮，使用虚构测试数据](docs/assets/countdown-preview.png)

**倒计时只保存在这台 Mac，不同步到 iPhone 或 iCloud。** 截图中的日期仅为示例，不是产品发布计划。

### Smart Notch：需要时，才多看一眼

启动、唤醒或解锁后，短暂展开今日概览。选中日历中的非全天日程，可在开始前 **5、10 或 15 分钟**展开刘海视觉提醒；默认提前 10 分钟，也可以关闭。

![真实 Notchime 即将开始提醒横幅，使用虚构日程](docs/assets/smart-notch-preview.png)

自动展开默认停留约 **4 秒**，可在设置中调整为 1–60 秒。鼠标悬停暂停计时，移开后重新计满；主动操作则交还控制权。手动打开的面板不会被自动计时器收起，自动展示也不会强行切走你正在使用的设置页或倒计时表单。

这是刘海视觉提醒，不发通知中心通知、不播放声音，也不让 Dock 图标跳动。开发机上的唤醒与解锁行为已由用户验收；macOS 13/14 和最终分发版本仍需真机验证。

## 你的日程，你的数据，你的隐私。

- **无需 Notchime 账户。** 使用 macOS 已配置的系统账户即可。
- **没有自建同步服务器。** 日历与提醒事项同步交由 Apple 或系统账户服务处理。
- **当前应用代码没有用户追踪或分析功能。**
- **本地优先。** 倒计时和偏好保存在本机，不另建系统日程或待办副本数据库。
- **应用操作受限。** 日历只读，提醒事项唯一支持的写入是完成符合条件的事项。
- **没有把个人日历或提醒事项内容上传到 Notchime 服务器的应用功能。**

macOS 14+ 中，读取 Calendar 需要系统 **Full Access（完整访问）**，Reminders 同样使用完整访问。Notchime 通过代码限制实际操作，系统并未提供专门的“只读”或“仅完成”授权。Apple 账户同步、依赖下载和操作系统／框架诊断不包含在上述应用行为承诺中。

[隐私说明](docs/PRIVACY.md#简体中文)介绍访问字段、本地存储、撤销权限与审计边界。[安全审计](docs/phase5a-privacy-security-audit.md)和[代码审查](docs/phase5b-final-code-review.md)提供证据与待完成的发布检查，不承诺绝对安全。

## 开始使用

### 当前可用：从源码运行

取得可信的项目源码。准备好 Node.js 和 Apple Xcode Command Line Tools 后，在项目根目录打开终端：

```sh
npm ci
npm start
```

`npm ci` 安装锁定的开发依赖，并下载 Electron。`npm start` 的 prestart 脚本会在需要时编译并对本地 Swift Helper 进行 **ad-hoc 签名**，随后启动 Electron；不会把应用安装到 Applications。运行前请阅读脚本，编译或签名失败需要解决，不能通过绕过校验来忽略。

在 **设置 → 日历** 中主动申请日历权限并选择要展示的日历；在 **今日待办** 中单独申请 Reminders 权限。拒绝 Reminders 不会禁用日历或本地倒计时。当前源码安装身份仍为 **Calendar Notch Dev**，系统授权窗口可能显示该名称。源码模式不把通用 Electron 登记为登录项。

### 计划中的发布：可下载的 macOS 应用

**目前尚无完成验收的 Notchime 官方 DMG 下载。** 正式身份、签名／公证、Electron fuses、ASAR 完整性、TCC 权限归属及干净安装验收仍待完成。本页不提供虚构的 Homebrew 命令或 Release 地址。

本地 ad-hoc 签名不等于 Developer ID 签名或公证。若将来采用 ad-hoc 分发，需要针对实际构建提供 Gatekeeper 和验证说明。不要为了运行本项目而全局关闭 Gatekeeper。

## 系统要求

| 项目 | 当前证据 |
|---|---|
| 平台 | 仅 macOS，围绕 MacBook 刘海设计。 |
| 架构 | 已配置并测试 Apple Silicon / arm64；未提供或验证 Intel 构建。 |
| 配置最低版本 | Electron Builder 与 Swift 编译目标均为 macOS 13.0+。 |
| 实际测试环境 | Apple Silicon、macOS 27.0；Node 22.22.0、npm 10.9.4、Swift 6.1.2、Electron 44.0.0。macOS 13/14 真机行为尚未验证。 |
| 开发工具 | Node.js **22.12.0+**、npm（项目未另行声明最低版本），以及带 Swift 和 macOS SDK 的 Xcode Command Line Tools。 |
| 无刘海显示器 | 代码根据显示器及菜单栏几何定位，并提供高度回退，不把物理刘海作为代码前提；最终无刘海／外接显示器验收仍待完成。 |

## 开发与架构

**Electron 驱动的 macOS 应用，配合原生 Swift EventKit 集成。** Electron 负责本地界面和窗口生命周期；EventKit 让 Helper 访问 Mac 已有的系统日历和提醒事项，无需另建同步服务。

```mermaid
flowchart TD
  UI["本地 HTML / CSS / JavaScript Renderer"] <--> P["受限 Preload API"]
  P <--> M["Electron Main"]
  M <--> H["Swift EventKit Helper · 有界 JSON Lines"]
  H <--> S["macOS 日历 / 提醒事项"]
  M --> L["本地倒计时 / 设置 / 日程提醒去重元数据"]
```

日历没有写入接口；提醒事项只接受校验后的完成请求；倒计时与系统数据分开存储。模块及安全测试流程见[贡献指南](CONTRIBUTING.md#简体中文)。

```sh
npm run test:unit
npm test
```

`npm test` 执行单元测试、JavaScript 语法检查、隔离 Fixture Electron 场景及跳过签名 prestart 的源码启动验证。Swift 纯日期测试会在项目测试缓存中编译测试程序。GUI 检查需要可用的 macOS 桌面；这些测试不能证明真实 iCloud 同步或最终包签名成功。

<details>
<summary>打包命令及当前限制</summary>

| 脚本 | 实际行为 |
|---|---|
| `npm run native:build` | 编译并 ad-hoc 签名有变化的 Helper，严格验证新构建；无变化时复用缓存。 |
| `npm run pack` | 通过 electron-builder 生成未封装的应用目录。 |
| `npm run build:zip` | 构建 macOS ZIP。 |
| `npm run build` | 构建 arm64 macOS DMG，禁止发布。 |

打包脚本均先执行 Helper 构建，再运行已有的 afterPack ad-hoc 签名钩子及最终 strict/deep 校验。输出目录为 `dist.noindex`。目前有已知严格签名阻塞，这些是开发脚本，不是已验收的安装途径。本次文档阶段没有执行它们、签名或生成安装包。

</details>

## 常见问题

**需要注册账户吗？**  
无需 Notchime 账户。日历和提醒事项同步使用已有的 Apple／系统账户。

**会上传我的日历或待办吗？**  
当前应用没有将个人日程或待办内容上传到 Notchime 服务器的功能。Apple／系统账户同步及操作系统诊断有各自的行为，详见[隐私说明](docs/PRIVACY.md#简体中文)。

**直接连接 iPhone 同步吗？**  
不会。系统账户先同步到 Mac，Notchime 再读取本机 EventKit；完成状态沿同一系统同步路径回传。

**能编辑日历或完成所有提醒事项吗？**  
日历只读。只能完成当前有效、今日到期或逾期、非重复且位于可写清单中的未完成事项。重复／只读事项和其他管理操作请使用 Apple Reminders。

**倒计时会跨设备同步吗？**  
不会，倒计时是这台 Mac 上独立的本地记录。

**支持 Windows、Linux 或 Intel Mac 吗？**  
Windows／Linux 不在支持范围内；Intel 尚无验证过的构建和验收证据。

**是完全原生的 Swift 应用吗？**  
不是，主应用使用 Electron，系统集成使用原生 Swift EventKit Helper。

**需要哪些权限？**  
由你分别主动授予 Calendar 和 Reminders 权限。macOS 14+ 使用完整访问，应用实际操作仍受限制。当前核心功能不请求摄像头、麦克风、录屏或辅助功能权限。

**为什么没有官方 DMG？**  
正式身份、签名、打包安全及干净安装验证尚未完成。源码及已审查的开发行为不等于已正式发布的安装包。

## 贡献与安全报告

欢迎报告问题或提交聚焦的改进，具体见[贡献指南](CONTRIBUTING.md#简体中文)。请使用虚构或脱敏数据，不公开账户地址、私人日程或提醒事项清单。

安全漏洞请私下发送至 **[tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com)**，流程见 [SECURITY.md](SECURITY.md#简体中文)。不承诺固定响应时限，也不将普通邮箱称为加密渠道。

## 许可证与致谢

当前开发与维护：**GAO TIANYU** · [GitHub](https://github.com/GAO9228TIANYU) · [联系](mailto:tianyu.gaospk@gmail.com)。

Notchime 基于 xiaopu-ai 及贡献者的 [TO-DO Panel v1.2.0](https://github.com/xiaopu-ai/TO-DO-Panel/tree/v1.2.0) 演进而来。原 MIT 版权、许可和免责条款保留在 [LICENSE](LICENSE)；归属信息见 [NOTICE](NOTICE) 与[第三方说明](THIRD_PARTY_NOTICES.md)。第三方代码及图片仍遵循各自权利。当前指定图标的公开再分发权需在发布前由维护者确认，源码 MIT 许可不自动重新授权媒体资源。

Apple、iPhone、MacBook、Calendar 和 Reminders 名称仅用于说明兼容性，不表示获得 Apple 赞助或认证。
