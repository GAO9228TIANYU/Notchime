> 历史资料：来自 TO-DO Panel 或早期开发/学习记录，不是 Notchime 当前功能、维护者或发布指南。原文保留用于追溯；其中 Git、安装、签名与自动化命令不提供本阶段执行授权。当前要求见根目录 README.md / AGENTS.md。

# Windows MVP

Approved scope: maintain one Electron codebase, distribute macOS Apple Silicon DMG and Windows 10/11 x64 NSIS EXE together. Windows keeps the common workspace, mirror, recording, credentials, clipboard history and local completion notifications. Window switching and Soda Music are unavailable; clipboard selections copy for manual Ctrl+V. No cloud sync or data schema changes.

Windows uses a 200 × 38 DIP collapsed strip centered on the available desktop's top edge, below a top taskbar. Expanded content retains the existing 1240 × 540 target and shrinks within the usable desktop with 24 DIP safety margins. macOS geometry stays unchanged. Windows-only API behavior lives in a small pure platform policy module, exposed as read-only capabilities through preload. Unavailable modules are filtered at layout time, never persisted as user preferences.

Use Windows system encryption via Electron safeStorage, a visible tray icon in both taskbar themes, and Windows login-item settings. No microphone/camera access before user interaction. Privacy links use a fixed platform-specific allowlist. The release pipeline builds and validates both platforms before creating one Release with separately named assets and SHA-256 checksums. Windows installation, application startup, renderer/IPC operations, fake-device recording, upgrade data retention and uninstall are exercised on the Windows runner. Hardware, antivirus reputation and physical multi-monitor behavior are explicitly outside automated coverage.

The website retains its photographic hero and glass-pill buttons. Add a matching Windows button next to macOS, wrapping on narrow screens. Each button resolves the matching current Release asset. Missing assets fall back to the Release page, never to the other platform.

User authorized implementation, worktree creation, tests, packaging, GitHub push and release, and website deployment. No further routine approval required.
