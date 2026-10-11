# Phase 5B 文件分类清单

日期：2026-10-11。以路径/大小和活动引用审查分类，不把静态无引用等同于有权删除。大媒体、缓存、私人证据未打开查看内容。node_modules、.cache、dist* 不逐条公开；依赖与缓存汇总在本地阶段证据目录。清单自身大小在写入前计量，不用于完整性校验。

A Production Runtime；B Build / Packaging；C Active Tests；D Active Documentation；E Historical / Legacy；F Uncertain（内容/权利未完全确认）。

A=25, B=16, C=41, D=20, E=34, F=305，合计 441 个文件。

| 分类 | 文件 | 字节 | 判定与处理 |
|---|---|---:|---|
| A | `automatic-reveal.js` | 5743 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `calendar-bridge.js` | 6374 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `calendar-ipc.js` | 1059 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `calendar-provider.js` | 10736 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `calendar-reminders.js` | 5430 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `calendar-settings.js` | 300 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `countdown-ipc.js` | 2058 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `countdown-store.js` | 6019 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `main-services.js` | 2887 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `main.js` | 36862 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `preload.js` | 2830 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `reminders-ipc.js` | 1158 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `reminders-provider.js` | 5952 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/app.js` | 25284 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/calendar-model.js` | 1985 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/calendar.css` | 8230 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/countdown-model.js` | 5943 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/countdown-picker.js` | 8446 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/countdown.css` | 9133 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/countdown.js` | 12295 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/index.html` | 14237 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/panel-interaction.js` | 574 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/reminders-model.js` | 2819 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/reminders.js` | 5892 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| A | `renderer/styles.css` | 13357 | 活动运行模块；按 require、HTML 脚本、IPC 和生命周期确认引用。 |
| B | `.github/workflows/release-dmg.yml` | 1267 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `.gitignore` | 410 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `build/afterPack.js` | 4865 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `build/entitlements.mac.plist` | 393 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `build/notchime-icon.icns` | 1634656 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `build/notchime-icon.png` | 1349728 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `native/calendar-helper/Info.plist` | 1440 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `native/calendar-helper/ReminderDate.swift` | 1483 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `native/calendar-helper/main.swift` | 14176 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `package-lock.json` | 127574 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `package.json` | 5262 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `scripts/build-calendar-helper.js` | 2473 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `scripts/prepare-app-icon.js` | 1086 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `scripts/release-policy.js` | 1230 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `scripts/smoke-app.js` | 9568 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| B | `scripts/test-desktop.js` | 3413 | 构建/检查配置；有构建入口或资源引用；未执行打包或隐藏 hook。 |
| C | `tests/appearance.electron.js` | 3600 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/architecture.test.js` | 3715 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/automatic-reveal.test.js` | 8013 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/automatic.electron.js` | 12905 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-bridge.test.js` | 6584 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-ipc.test.js` | 2188 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-lifecycle.test.js` | 2336 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-model.test.js` | 3846 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-native-contract.test.js` | 2226 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-native.electron.js` | 3263 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-provider.test.js` | 9397 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar-reminders.test.js` | 7542 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar.electron.js` | 7089 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/calendar.test.js` | 2338 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/countdown-ipc.test.js` | 2260 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/countdown-model.test.js` | 5509 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/countdown-store.test.js` | 5998 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/countdown.electron.js` | 25760 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/final-review.test.js` | 3994 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/calendar-fixture.js` | 877 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/calendar-helper.js` | 3136 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/install-calendar.js` | 952 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/mock-calendar.js` | 3071 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/security-preload.js` | 241 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/smoke-bootstrap.js` | 249 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/fixtures/window-appearance.json` | 185580 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/main-services.test.js` | 2353 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/native-reminder-dates.swift` | 2377 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/notch-focus.electron.js` | 7318 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/panel-interaction.test.js` | 757 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/release-policy.test.js` | 5013 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/reminders-ipc.test.js` | 1545 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/reminders-model.test.js` | 2384 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/reminders-native.test.js` | 2588 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/reminders-provider.test.js` | 5851 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/reminders-real.electron.js` | 3898 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/reminders.electron.js` | 8424 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/renderer-structure.test.js` | 2484 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/security.electron.js` | 9642 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/security.test.js` | 8885 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| C | `tests/startup.electron.js` | 16892 | 活动测试/Fixture；真实系统入口需明确授权，默认套件只使用隔离 Fixture。 |
| D | `.claude/rules/api-rules.md` | 940 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `.claude/settings.json` | 273 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `.claude/settings.local.json.example` | 55 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `.claude/skills/prd/SKILL.md` | 713 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `.claude/skills/qa-checklist/SKILL.md` | 1039 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `AGENTS.md` | 4350 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `CHANGELOG.md` | 10936 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `CLAUDE.md` | 553 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `LICENSE` | 1081 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `NOTICE` | 749 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `README.md` | 6715 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `THIRD_PARTY_NOTICES.md` | 2937 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase1-5-countdown.md` | 8894 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase2-cleanup.md` | 14110 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase3a-eventkit.md` | 13966 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase4-5-reminders.md` | 9976 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase4-reminders.md` | 2298 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase5a-privacy-security-audit.md` | 37403 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase5b-file-inventory.md` | 80639 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| D | `docs/phase5b-final-code-review.md` | 21389 | 当前工程/阶段证据/合法归属/手动开发说明；阶段记录不等于当前系统重新验收。 |
| E | `.claude/agents/code-reviewer.md` | 2024 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `.claude/hooks/auto-format.sh` | 1527 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `.claude/hooks/block-dangerous.sh` | 2461 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `HARNESS-GUIDE.md` | 10765 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/2026-08-21-settings-vault-music-design.md` | 2457 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/DASHBOARD-DESIGN.md` | 22672 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/adr/0001-native-macos-architecture.md` | 7658 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/adr/0002-home-widget-gapless-layout.md` | 6061 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/conventions.md` | 2381 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/package-readiness-audit-2026-08-30.md` | 7631 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/performance-audit-2026-08-30.md` | 7443 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-21-adaptive-bento-notification-acceptance.md` | 2812 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-21-media-windows-design.md` | 1643 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-21-workspace-evolution.md` | 4384 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-23-native-macos-migration.md` | 6755 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-23-panel-interaction-corrections-design.md` | 3562 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-24-to-do-panel-brand-design.md` | 1252 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-28-in-panel-settings-design.md` | 3705 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-28-photographic-hero-implementation.md` | 5517 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-28-website-landing-redesign-design.md` | 6910 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-29-home-widget-visibility-design.md` | 24260 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-08-29-website-loading-media-optimization-design.md` | 2565 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/plans/2026-09-06-windows-design.md` | 2235 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/release-notes.md` | 2616 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/releasing.md` | 3358 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/seedance-character-prompt.md` | 2369 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/superpowers/plans/2026-08-23-panel-interaction-corrections.md` | 7192 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/superpowers/plans/2026-08-28-in-panel-settings.md` | 12734 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/superpowers/plans/2026-08-28-website-landing-redesign.md` | 13819 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/superpowers/plans/2026-08-29-home-widget-visibility.md` | 60270 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/superpowers/plans/2026-09-06-windows-support.md` | 3420 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/todo-inbox-example.json` | 482 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/upstream-readme.md` | 13977 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| E | `docs/workflow.md` | 3111 | 历史或停用开发辅助资料；无运行/构建/测试引用，保留来源与研究记录，排除应用。 |
| F | `docs/assets/hero/mac-scene.png` | 373796 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `docs/assets/hero/mac-wallpaper.png` | 95897 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `docs/assets/notch-character.png` | 3243948 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `docs/screenshots/collapsed-reference.png` | 16103 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `docs/screenshots/home.png` | 4541730 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `docs/screenshots/todo.png` | 4285317 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/README.md` | 4608 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets-and-licenses.md` | 3256 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/capture-evidence.json` | 13390 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/capture.log` | 190 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0000.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0001.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0002.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0003.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0004.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0005.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0006.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0007.png` | 515782 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0008.png` | 509355 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0009.png` | 509355 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0010.png` | 509355 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0011.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0012.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0013.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0014.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0015.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0016.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/complete/0017.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/mac-after.png` | 509360 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/mac-before.png` | 516523 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0000.png` | 1001 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0001.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0002.png` | 1108 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0003.png` | 1107 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0004.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0005.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0006.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0007.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0008.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0009.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0010.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0011.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0012.png` | 634 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0013.png` | 191296 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0014.png` | 480372 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0015.png` | 506932 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0016.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0017.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0018.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0019.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0020.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0021.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0022.png` | 499584 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0023.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0024.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0025.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0026.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0027.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0028.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0029.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0030.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0031.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0032.png` | 504475 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0033.png` | 500120 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0034.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0035.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0036.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0037.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0038.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0039.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0040.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0041.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0042.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0043.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0044.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0045.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0046.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0047.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0048.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0049.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0050.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0051.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0052.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0053.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0054.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0055.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0056.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0057.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0058.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0059.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0060.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0061.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0062.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0063.png` | 502668 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0064.png` | 502667 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0065.png` | 297378 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0066.png` | 62263 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0067.png` | 17739 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0068.png` | 15571 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0069.png` | 1092 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0070.png` | 1100 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0071.png` | 1108 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0072.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0073.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0074.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0075.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/captures/smart-notch/0076.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/fonts/NotoSansCJKsc-Medium.otf` | 16523632 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/fonts/NotoSansCJKsc-Regular.otf` | 16437364 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/licenses/Noto-OFL.txt` | 4301 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/licenses/original-assets-MIT.txt` | 1084 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/licenses/project-MIT.txt` | 1081 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/notchime-original-score.wav` | 11520044 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/notchime-trailer-icon.png` | 1349728 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/source-manifest.json` | 766 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/capture-evidence.json` | 13741 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/capture.log` | 190 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0000.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0001.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0002.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0003.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0004.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0005.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0006.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0007.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0008.png` | 508633 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0009.png` | 508633 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0010.png` | 508633 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0011.png` | 508633 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0012.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0013.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0014.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0015.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0016.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0017.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/complete/0018.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/mac-after.png` | 508657 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/mac-before.png` | 512221 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0000.png` | 1001 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0001.png` | 1094 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0002.png` | 1101 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0003.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0004.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0005.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0006.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0007.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0008.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0009.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0010.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0011.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0012.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0013.png` | 158064 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0014.png` | 310395 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0015.png` | 489740 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0016.png` | 503848 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0017.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0018.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0019.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0020.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0021.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0022.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0023.png` | 496594 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0024.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0025.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0026.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0027.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0028.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0029.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0030.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0031.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0032.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0033.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0034.png` | 501580 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0035.png` | 499802 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0036.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0037.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0038.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0039.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0040.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0041.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0042.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0043.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0044.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0045.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0046.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0047.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0048.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0049.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0050.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0051.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0052.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0053.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0054.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0055.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0056.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0057.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0058.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0059.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0060.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0061.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0062.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0063.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0064.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0065.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0066.png` | 499727 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0067.png` | 500115 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0068.png` | 270440 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0069.png` | 48101 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0070.png` | 17742 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0071.png` | 15571 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0072.png` | 1076 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0073.png` | 1100 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0074.png` | 1109 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0075.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0076.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0077.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/assets/trailer-captures/smart-notch/0078.png` | 1102 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/delivery-report.md` | 2979 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/music/beat-map.json` | 7726 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/music/mastering-analysis.json` | 262 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/music/original-soundtrack.wav` | 2764902 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/music/premaster.wav` | 1843244 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/contact-sheet.jpg` | 287974 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/derivatives.log` | 0 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/environment.json` | 1632 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-02.8.jpg` | 204971 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-07.8.jpg` | 167872 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-12.4.jpg` | 174715 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-17.0.jpg` | 216640 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-22.4.jpg` | 212763 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-27.4.jpg` | 216179 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-31.4.jpg` | 213986 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-40.4.jpg` | 179104 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-45.8.jpg` | 203197 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-48.5.jpg` | 203197 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-51.5.jpg` | 157881 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/frame-57.5.jpg` | 150893 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-demo-loop.mp4` | 91776 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-demo-short.mp4` | 1074267 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-demo.gif` | 553904 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-poster.jpg` | 222588 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-promo-1080p.mp4` | 6645450 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-trailer-10s.mp4` | 1310768 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/notchime-trailer-poster.png` | 1088568 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/release-gaps.json` | 600 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/render.log` | 460 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-contact-sheet.jpg` | 218565 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-0.18.png` | 362510 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-0.82.png` | 708679 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-1.70.png` | 972521 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-2.40.png` | 856582 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-3.12.png` | 860928 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-3.32.png` | 850333 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-3.89.png` | 969734 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-4.75.png` | 866314 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-5.78.png` | 610389 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-6.32.png` | 858776 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-7.35.png` | 1050776 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-frame-9.00.png` | 1088568 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/trailer-render.log` | 112 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/validation.json` | 5485 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/output/verify.log` | 686 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/recording-guide.md` | 3874 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/requirements.txt` | 93 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/__pycache__/prepare-footage.cpython-312.pyc` | 2278 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/__pycache__/release-check.cpython-312.pyc` | 1125 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/__pycache__/render.cpython-312.pyc` | 41593 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/__pycache__/verify.cpython-312.pyc` | 13777 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/capture-app.cjs` | 1176 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/capture-bootstrap-trailer.cjs` | 7017 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/capture-bootstrap.cjs` | 7026 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/capture-trailer.cjs` | 1192 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/compose-trailer.py` | 6846 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/prepare-footage.py` | 1213 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/release-check.py` | 538 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/render-trailer.py` | 17566 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/render.py` | 21635 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/scripts/verify.py` | 8241 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/src/timeline.json` | 2529 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/src/trailer-timeline.json` | 2069 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/storyboard.md` | 4161 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/subtitles-trailer-zh-en.srt` | 808 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/subtitles-zh-en.ass` | 3156 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/subtitles-zh-en.srt` | 1341 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/INSTALLER` | 4 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/LICENSE` | 1317 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/METADATA` | 1528 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/RECORD` | 1661 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/REQUESTED` | 0 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/WHEEL` | 104 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg-0.6.0.dist-info/top_level.txt` | 15 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/__init__.py` | 227 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/__pycache__/__init__.cpython-312.pyc` | 504 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/__pycache__/_definitions.cpython-312.pyc` | 2080 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/__pycache__/_io.cpython-312.pyc` | 27201 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/__pycache__/_parsing.cpython-312.pyc` | 9359 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/__pycache__/_utils.cpython-312.pyc` | 5436 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/_definitions.py` | 2041 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/_io.py` | 27048 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/_parsing.py` | 6840 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/_utils.py` | 3833 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/binaries/README.md` | 45 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/binaries/__init__.py` | 45 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/binaries/__pycache__/__init__.cpython-312.pyc` | 220 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
| F | `promo/notchime-launch/tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1` | 49368728 | 研究/媒体/工具/许可可能含私有内容；仅路径清点，未证明全部再分发权，不删除，不进入应用。 |
