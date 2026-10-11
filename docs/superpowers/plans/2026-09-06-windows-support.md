> 历史资料：来自 TO-DO Panel 或早期开发/学习记录，不是 Notchime 当前功能、维护者或发布指南。原文保留用于追溯；其中 Git、安装、签名与自动化命令不提供本阶段执行授权。当前要求见根目录 README.md / AGENTS.md。

# Windows Support Implementation Plan

**Goal:** Ship a tested Windows x64 installer alongside the existing macOS DMG and expose both on the website.
**Architecture:** Shared renderer and domain data, pure platform policy for native differences, capability-aware layout, dual build jobs feeding one release job.
**Tech Stack:** Electron 44, Node 22, electron-builder NSIS, React/Vinext, GitHub Actions.
**Spec:** `docs/plans/2026-09-06-windows-design.md`

## Constraints

- Preserve storage keys and Mac behavior; keep unrelated user documents untouched.
- Windows hides music/windows without persisting forced hiding; clipboard copy only.
- Build Windows 10/11 x64 and macOS 13+ arm64; same version, distinct installer names.
- Native Windows CI verification required before publication; disclose hardware testing limits.

## Execution

- [x] Platform policy: add `platform.js`, consume in `main.js` and preload, test geometry (negative origins/top/side/bottom taskbars), capability fallback and final-visible-module behavior in `tests/platform.test.js` using literal fixtures. Run failing tests, implement, rerun.
- [x] Renderer: union unavailable modules only when resolving layout; preserve saved visibility; prevent hiding final available module; neutralize Mac copy; hide unavailable switches; verify actual DOM with Electron.
- [x] Packaging/testing: cross-platform Node test runner; NSIS current-user installer; actual application CDP smoke in isolated profile, packaged and installed checks, fake camera/audio, user-data retention and uninstall. Keep startup tests finite and capture logs/screenshots.
- [x] Website: Windows asset selector and a second glass-pill button; assert mixed-release selection and SSR buttons; run website tests/lint/build and browser layout verification at desktop/mobile sizes.
- [x] Release: bump shared version to 1.1.0, update CHANGELOG/README/releasing guide, build both targets and publish only after both pass; push branch for CI first, repair failures before main/tag; verify four Release assets and live Pages button targets.

Run `npm test` for desktop, `npm test && npm run lint && npm run build` in website, and Windows CI for platform/installed behavior. Commit only scoped paths. Final handoff includes Release/website links and actual verification evidence.

Candidate validation: GitHub Actions run `34044062278` passed both native build jobs, including installed Windows fresh/retained profiles, password decryption, recording bytes, normal exit, reinstall and uninstall. Website: 20 tests and lint/build passed locally; desktop: 112 Node tests and three Electron suites passed.

Release validation (2026-09-07): tag `v1.1.0` at `408e81e`; release run `34044252812` and Pages run `34044252718` succeeded. Four published assets verified; both installers downloaded back and SHA-256 matched (normalize the Windows checksum file's CRLF when checking with macOS `shasum`). Live Pages shows both platform buttons; the latest-release selectors resolve to the correct 1.1.0 installers and both URLs return HTTP 200. Physical Windows devices remain outside this automated acceptance coverage.
