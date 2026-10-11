# Phase 5C — 双语文档与产品展示交付报告

日期：2026-10-11。维护者：**GAO TIANYU**。本轮范围为文档和展示资源，没有修改应用、Swift Helper、IPC、动画、配置身份或真实用户数据，没有执行 Git、签名、公证、打包、安装或发布。

## 1. 实际新增与修改文件

| 文件 | 操作与内容 |
|---|---|
| [README.md](../README.md) | 替换原工程说明，作为英文产品主页；保留来源、开发身份及发布限制。 |
| [README.zh-CN.md](../README.zh-CN.md) | 新增完整中文主页，与英文结构、素材、功能边界和命令对应。 |
| [PRIVACY.md](PRIVACY.md) | 新增英中独立章节，说明 EventKit 字段、Full Access、应用行为范围、本地 JSON、去重元数据、系统同步和诊断限制。 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 新增双语贡献指南、实际模块定位、源码启动副作用、隔离测试及隐私安全要求。 |
| [SECURITY.md](../SECURITY.md) | 新增双语安全报告流程，指定维护者邮箱，不虚构 SLA、加密渠道或已发布版本矩阵。 |
| 本报告 | 新增核查依据、素材来源、验证结果和后续准入条件。 |
| [素材归属说明](assets/ATTRIBUTION.md) | 新增 README 素材来源、图标权利待确认事项、电影概念画面与实际界面边界。 |
| [素材清单](assets/notchime-media.json) | 新增 9 个选用媒体文件的大小、SHA-256、来源、真实/示意分类与精确视频批准记录。 |
| `assets/licenses/original-assets-MIT.txt`、`assets/licenses/Noto-OFL.txt` | 从现有宣传工程原样复制原创素材 MIT 和 Noto 字体许可文本，不改写权利归属。 |

新增 9 个媒体：`notchime-icon.png`、`notchime-dashboard.png`、`calendar-preview.png`、`reminders-preview.png`、`countdown-preview.png`、`smart-notch-preview.png`、`platform-badges.svg`、`notchime-film-poster.png`、`notchime-trailer-10s.mp4`。

临时验证程序、渲染 HTML、截图和 JSON 证据仅写入项目 `.cache/phase5c/`；不作为 README 或应用资源。未删除历史图片、研究资料或私人缓存。

## 2. README 结构与语言对应

两份主页均为 10 个主要章节，Hero 使用用户指定铃形图标、Notchime 名称、Slogan、简短价值描述、显眼语言切换及四项本地静态徽章。随后是实际界面、四项价值、已批准短片、Apple 生态流程、功能细节、隐私、源码运行/计划发布、系统要求、架构、FAQ、贡献安全和许可归属。

英文默认主页使用 “Your Apple day, right in your MacBook notch.”；中文使用“把 Apple 生态中的一天，带到 MacBook 的刘海里”。中文不是逐段紧跟英文；两份页面分别完整呈现。FAQ 包括账户、上传、iPhone 路径、日历编辑与完成限制、倒计时同步、平台/架构、Electron/Swift、权限和 DMG 状态。

两份文档均明确当前应用界面为中文，不把双语 README 当成应用英文 UI 已实现的证据。没有 Stars、下载量、发行版本徽章、假 Releases 地址或 Homebrew 命令。产品品牌统一为 Notchime；保留 Calendar Notch Dev 仅解释当前安装/TCC 身份，TO-DO Panel 仅用于合法来源归属。

## 3. 实际检查的依据与差异

阅读原 README、[Phase 5A](phase5a-privacy-security-audit.md)、[Phase 5B](phase5b-final-code-review.md)、[文件清单](phase5b-file-inventory.md)、AGENTS、package.json/锁定版本、LICENSE/NOTICE/第三方说明及下列实际入口：

- `main.js`、`main-services.js`、`preload.js`：窗口、生命周期、24 项受控 IPC、安全本地界面与应用身份。
- `native/calendar-helper/main.swift`、`ReminderDate.swift`、`Info.plist`：实际 EventKit 授权、只读日历及受限 Reminders 完成。
- `calendar-bridge.js`、`calendar-provider.js`、`reminders-provider.js` 及 IPC/Renderer 模型：有限快照、选择、错误/恢复、筛选与显示边界。
- `automatic-reveal.js`、`calendar-reminders.js`、`calendar-settings.js`、Countdown 模块：自动来源、悬停、4 秒默认、5/10/15 分钟、哈希去重及独立本地持久化。
- `scripts/build-calendar-helper.js`、`scripts/test-desktop.js`、`build/afterPack.js`、构建白名单和工作流：启动/编译/签名副作用、测试与发布状态。
- `promo/notchime-launch/` 的 README、素材许可、来源清单、采集入口、Fixture 证据、新短片时间线/故事板和渲染入口。

Phase 5A 的 135 单元/64 语法检查是该阶段历史结果；Phase 5B 增加后为 140 单元/66 语法、13 GUI、1 启动 smoke、1 Swift 类型检查。没有把较早数量当成当前套件数量，也没有把历史通过表述为本轮重跑。

宣传工程原 README 仍描述旧制作预览，不足以证明所有成片获准。用户本轮明确批准的是 `promo/notchime-launch/output/notchime-trailer-10s.mp4`，本报告和主页仅采用该文件；其他旧 60 秒/8 秒版本及 GIF 均未采用。原工程说明原样保留为历史，不从其旧品牌/功能内容推断现有产品。

## 4. 截图、图标、短片与隐私

| 素材 | 实际处理 | 能证明什么及限制 |
|---|---|---|
| 图标 | 从现有 `build/notchime-icon.png` 缩至 256×256 用于 Hero，不改应用图标。 | 用户指定图像；原作者/公开再分发许可仍待确认。 |
| 工作台 | 现有真实 Electron Fixture 采集图缩至 1240×616。 | 当前实际布局，不是重绘概念 UI，不是真实个人日程。 |
| Calendar、Reminders、Countdown 细节 | 对同一原始截图裁剪/缩小，不新增按钮，不改变控制内容。 | 可阅读的实际功能区域；测试日期不是发布承诺。 |
| Smart Notch 横幅 | 从真实隔离自动展开捕获帧裁剪。 | 即将开始视觉状态，不证明系统唤醒/iCloud或实际四秒时序。 |
| 宣传片 | 原片逐字节复制，9.6 秒、1920×1080、60fps、H.264/AAC 48kHz 双声道，约 2.16 MiB。 | 用户批准的产品展示；手机和设备框是示意，Mac 是真实 Fixture 合成，动画经过节奏剪辑。 |
| 短片封面 | 原片 0.85 秒处帧缩至 1280×720，静态图片链接本地 MP4。 | 不依赖 GitHub 内嵌自动播放；可能进入文件页或下载。 |
| 徽章 | 本地自制 SVG。 | 四项配置/定位信息，无远程徽章请求、脚本或字体文件。 |

来源证据 `capture-evidence.json` 声明 actual Electron Fixture capture、EventKit access=false、personal data access=false、sync verified=false；事项为虚构的 Design review、Send brief 和 Launch。目视检查截图及短片分镜，没有私人账户、联系人、旧品牌 UI 或 Preview/Demo Only/制作预览水印。没有打开历史私人截图作素材。

选用的 9 个媒体共 **2,892,334 字节（约 2.76 MiB）**；其中静态图片与徽章约 0.60 MiB。媒体命名、相对路径和许可来源在素材清单/归属文件中保留。没有复制宣传工具的 49 MB FFmpeg、字体二进制、源音轨或逐帧目录。

仍需用户确认的是**图标公开分发权**，而非已批准影片的创意质量。短片批准并不自动解决其中图标的版权。其他未采用片段无需为本页补批准；没有强行加入新 GIF。

## 5. 隐私声明与 Phase 5A 的一致性

| 声明 | 本次文档表述及依据 |
|---|---|
| 无账户 | 限定为无 Notchime 账户，系统账户仍负责同步。 |
| 无自建同步服务器 | 数据通过系统账户到 Mac，再由本机 EventKit 访问；不画 Notchime Cloud。 |
| 无追踪 | 限定为当前应用代码无追踪/分析集成，不保证所有未来依赖路径。 |
| Local-first | 本地 Countdown/设置/选择/有限去重元数据；Calendar/Reminders 快照在内存，不建任务副本数据库。 |
| Calendar 只读 | 描述应用行为；macOS 14+ 读取需系统 Full Access，不称系统 Read Only 授权。 |
| Reminders 仅完成 | 系统 Full Access，代码只允许当前有效、非重复、可写清单事项的主动完成，不扩为其他写入。 |
| 不上传个人内容 | 限定为无向 Notchime 服务器上传个人日历/待办内容的应用功能，单独解释系统同步、依赖下载和诊断行为。 |

隐私文档列出实际 JSON 文件、哈希去重 30 天/5,000 条上限、非加密存储、权限撤销、损坏文件保留与系统缓存/诊断限制。没有“绝对隐私”“100% 安全”或“绝无网络流量”承诺。完成状态通过本地 EventKit 写回，后续 iPhone 同步由系统负责，不承诺固定秒数。

## 6. 许可证与来源处理

[LICENSE](../LICENSE)、[NOTICE](../NOTICE)、[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)未修改。上游 MIT 版权及许可文本保留，当前维护者 GAO TIANYU 与上游 xiaopu-ai/贡献者分开说明；不声称从零独立开发，不将第三方素材统一重新授权为 MIT。

保留源码及宣传原创素材各自的 MIT 声明、Noto OFL 文本。MP4 不包含 FFmpeg 或字体二进制，未把制作工具复制为 README 下载资产。图标再分发权为 Not Verified；编码标准的专利权问题与素材版权是不同事项，未承诺全面法务清理完成。更广泛历史素材/工具的分发许可仍不能从本次精选资源推断。

## 7. 系统要求与构建说明证据

`package.json` 配置 macOS 13.0、arm64、Node >=22.12.0；原生脚本使用 `arm64-apple-macosx13.0`。实际验收机器为 macOS 27.0/Apple Silicon，Node 22.22.0、npm 10.9.4、Swift 6.1.2、Electron 44.0.0。Intel、macOS 13/14 和最终无刘海/外接屏不写成已验收。

主 README 中源码运行命令与 npm scripts 一致。`npm ci` 下载锁定依赖；`npm start` 有 prestart 编译/ad-hoc 签名副作用。原生脚本无源码变化时返回缓存，新构建才签名/strict 校验；文档已明确这一差异。

`npm test` 默认为 Fixture/语法/单元及跳过签名预启动脚本的源码 smoke；纯 Swift 日期测试仅编译测试程序。打包脚本在折叠说明中列出真实作用和签名钩子、输出 `dist.noindex`、strict-signing 已知阻塞，明确不是可用正式安装途径。本阶段没有执行这些安装、编译、签名或打包命令。

## 8. 链接、Markdown、图片与展示验证

针对本轮 6 份交付 Markdown 与素材归属页检查相对路径、页内锚点、HTML Hero 链接、图片引用及代码围栏；结果见下表。未修改历史审计报告中的本地代码定位链接；本轮公共文档和媒体清单不包含个人本机绝对路径。历史文档是否适合公开仍需独立清单与脱敏检查，不能等同于整个工作目录已允许上传。

| 检查 | 本轮结果 |
|---|---|
| 新交付文档及素材归属 Markdown | 7 份解析通过；104 处本地引用（含 24 处锚点）无缺失，代码围栏配对。 |
| 本地图片 | 7 个 PNG 全部解码；SVG XML 解析通过，无脚本/远程资源。两份 README 各 8 个图片引用加载成功。 |
| 媒体清单 | 9/9 大小与 SHA-256 匹配；已批准源片与副本哈希完全一致。 |
| 视频完整解码 | 576 帧、9.60 秒完整解码通过；没有截断或解码失败。 |
| 外部链接 | 维护者 GitHub 与上游 v1.2.0 页面两项 HTTP HEAD 均为 200；mailto 格式正确，未发送邮件或验证邮箱投递。 |
| 英中本地展示 | 1180px 桌面、390px 手机，light/dark 共 8/8 组通过；全部图像加载，无页面横向溢出。 |
| 视觉检查 | 图标、工作台和分区截图、短片封面/分镜，以及桌面深色和手机浅色 README 已目视检查。 |
| 受保护文件 | Main/Preload/Renderer/Swift/build/scripts/tests、package/lock、LICENSE/NOTICE/第三方说明及 AGENTS 共 84/84 SHA-256 与修改前一致。 |
| 现有文档/身份/发布策略契约测试 | `tests/release-policy.test.js` 和 `tests/final-review.test.js` 合计 11 项通过、0 失败、0 跳过；只验证政策/配置，不执行发布或打包。 |
| 实际 GitHub 页面渲染/MP4 行为 | Not Verified：没有创建或发布仓库，未把本地预览冒充 GitHub 实际验收。 |
| 本轮业务单元/Electron GUI/真实 EventKit | 未重跑：只有文档及资源变化，未修改可执行产品代码，未访问真实系统数据。 |

本地 README 渲染使用现有 Python Markdown 和隔离 Electron 文档窗口，没有加载产品 Main 或 Helper、没有新增依赖。初次临时渲染工具关闭第一个窗口后触发 Electron 默认退出，第二视图加载失败；只修复项目缓存中的 QA 工具退出处理，随后 8 组全部完成。这不是产品 GUI 回归结果。渲染采用 GitHub 风格近似 CSS；GitHub Markdown 清洗、Mermaid 与播放器的实际表现需仓库创建后检查。

本次验证证据保存在 `.cache/phase5c/document-validation.json`、`render-validation.json`、`external-links.json`、`video-review/decode.log`、`document-contract-tests.log` 和 `protected-baseline.json`；这些不是公开页面的资源依赖。现有 README 契约要求出现 macOS 13+ 的最低配置说明，最终两份 README 明确写为 macOS 13.0+，同时保留未真机验证的限制；未修改或削弱测试。没有重跑依赖安全数据库，将 Phase 5B 的 8 Moderate 明确标为历史审查结果。

## 9. 私人数据与旧品牌检查

精选的 README 图片/短片与新文档未发现私人日历、待办、账户或本机开发路径。TO-DO Panel 只出现在合法来源、许可证和归属说明；没有用旧产品截图、旧业务宣传、未发布论文或研究资料装饰主页。

现有历史 `docs/assets/hero/`、其他历史图片、`.cache` 和宣传工程源材料原样保留，不因本轮精选无隐私就认定其全部可公开。Builder 的现有正向白名单和 `docs/promo/.cache` 排除保持不变；README 媒体不进入应用，未运行打包验证。

## 10. 发布前未完成事项

- 确认图标原作者/授权及 icon-containing 图片、短片的公开分发权。
- Phase 5D 正式 Bundle ID、appId/productName/版本、userData 兼容与 TCC 身份方案；不得仅按 Notchime 文案直接覆盖当前开发数据或权限。
- 解决已知 strict/deep 签名问题；验收 Developer ID/公证或实际选定的分发策略、fuses、ASAR、entitlements、最终许可文件和干净安装。
- 复核锁定依赖供应链、Phase 5B 早期桌面焦点/计时不稳定记录及最终包运行。
- 验证 macOS 13/14、真实多屏/Spaces/全屏、最终身份下物理唤醒/解锁及真实系统同步。
- 公开源码前按清单筛选历史文档/私人缓存/制作工具，不直接上传当前整个工作目录；维护最终仓库下的实际链接、媒体与 Mermaid 展示。
- 发布验收完成后再更新真实版本号、下载地址、安装与 Gatekeeper 说明，不能提前虚构正式 Release。

## 11. Phase 5D 准入结论

**可以进入 Phase 5D 正式应用身份的方案设计与受控实施准备。** 双语页面、批准短片、配套政策和针对性检查已交付，产品业务代码与安全边界没有变化。

这不等于批准数据迁移、公开仓库、正式签名或 DMG 发布。图标再分发权及 Phase 5D/5E 身份、签名、包安全与最终设备验收仍是发布条件；文档已经把已验证行为、配置目标和未完成事项分开表述。
