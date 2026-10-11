> 历史资料：来自 TO-DO Panel 或早期开发/学习记录，不是 Notchime 当前功能、维护者或发布指南。原文保留用于追溯；其中 Git、安装、签名与自动化命令不提供本阶段执行授权。当前要求见根目录 README.md / AGENTS.md。

# 双平台发布流程

每个版本在同一 GitHub Release 提供两个独立安装包和各自 SHA-256：
- Mac：`TO-DO-Panel-<版本>-arm64.dmg`，macOS 13+ Apple Silicon，ad-hoc 签名。
- Windows：`TO-DO-Panel-<版本>-windows-x64-setup.exe`，Windows 10/11 x64，NSIS 当前用户安装，暂无商业代码签名。

## 发布前

1. `package.json`、`package-lock.json` 版本一致；CHANGELOG、README 稳定版本、`docs/release-notes.md` 对齐。
2. 桌面端 `npm test`；官网 `npm test && npm run lint && npm run build`。
3. `Release macOS and Windows` 工作流的手动运行只验证并上传 Actions artifacts；不创建 Release。开发分支 `feat/windows-support` 推送也执行同样验证。
4. Windows runner 运行 `npm run build:win`，随后 `scripts/verify-windows.ps1` 安装实际 EXE、启动真实程序、验证核心 IPC/数据/系统加密/快捷键/模拟相机与录音释放，重新安装检查数据，再卸载。
5. Mac runner 运行 `npm run build`、codesign 与 hdiutil 校验。两者全部通过才允许发布。
6. 不提交 node_modules、dist、密码、API Key、录音、剪贴板或测试用户数据。

## 正式发布

用户确认发布后，提交并推送 main，再推送与 package.json 匹配的 `v*.*.*` 标签。工作流重新构建验证两个平台，汇总资产校验 SHA-256，再创建一个 Release。任何平台失败均不会创建 Release；修复后在发布前重新验证，不覆盖已发布版本。

官网通过 main 推送自动部署 GitHub Pages。两个下载按钮分别读取 `releases/latest` 的 macOS arm64 DMG 和 Windows x64 setup EXE；资产缺失时退回 Release 页面，绝不下载另一个平台安装包。不能硬编码过期版本的下载链接。

发布后检查：
- Actions 两个平台及发布步骤成功；Pages 部署成功。
- Release 有两个安装包与两个校验文件，版本及 SHA-256 相符。
- 打开线上 Pages，两个按钮都存在，分别指向当前版本的对应安装包。
- 发布说明区分系统要求、首次系统拦截提示、Windows 首版功能限制及自动测试边界。

## 本地构建

`npm run build` 生成 Mac DMG；`npm run build:win` 生成 Windows EXE。使用对应系统构建最稳妥，CI 可从 Mac 发起并在 Windows 执行。安装包不要求终端用户安装 Node.js；通知转发脚本由相应 AI 工具的 Node 环境调用。

Windows 默认安装路径为 `%LOCALAPPDATA%/Programs/TO-DO Panel`（以安装向导为准），通知脚本位于安装目录的 `resources/app/scripts/`。普通工作区可复制迁移，系统加密密钥不能跨用户或操作系统直接解密，应重新输入。卸载默认保留工作区。

## 测试边界

Windows runner 属于托管 Windows Server 环境。自动化验证并不等于 Windows 10/11 每种硬件都已实测。物理相机/麦克风、多显示器插拔、DPI 混用、组织策略和 SmartScreen 信誉需要真实用户设备持续反馈。测试截图和日志保存在 Actions 的 windows-test-evidence artifact。
