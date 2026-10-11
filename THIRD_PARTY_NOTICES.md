# Notchime — source and third-party attribution

Current developer and maintainer: **GAO TIANYU**.
Contact: tianyu.gaospk@gmail.com · https://github.com/GAO9228TIANYU

## Application source

Notchime is derived from [TO-DO Panel v1.2.0](https://github.com/xiaopu-ai/TO-DO-Panel/tree/v1.2.0), by xiaopu-ai and contributors. The original MIT copyright, permission and disclaimer text is preserved verbatim in `LICENSE` and must accompany distributed copies or substantial portions. `NOTICE` identifies the current maintainer separately; it does not replace or relicense upstream code.

## Electron runtime

The current locked runtime is Electron 44.0.0. Electron's MIT license is provided by `node_modules/electron/dist/LICENSE`, and its bundled Chromium/third-party notices by `node_modules/electron/dist/LICENSES.chromium.html`. The build resource configuration explicitly includes these texts under `Contents/Resources/licenses/electron/`. Do not remove the runtime's own license/notice files. Final distribution must verify that the texts match the exact shipped runtime; configuration review alone is not binary verification.

## Development tools

electron-builder 26.15.7 is MIT-licensed (see its installed `LICENSE`). It and its npm dependency graph are development tools, not application runtime dependencies. Preserve individual license and notice requirements if distributing their code/binaries, an offline development bundle, or node_modules. The source package and a macOS application bundle have different third-party contents; the project's MIT field does not relicense third-party packages.

## Assets

- `build/notchime-icon.png`: supplied by GAO TIANYU for Notchime on 2026-10-11; `notchime-icon.icns` contains resized derivatives generated locally with sips/iconutil. The supplied artwork's original author/license has not independently been established. Supplying a file permits this local integration, but is not evidence of public redistribution rights; the maintainer must confirm those rights before publication. Do not assume the repository MIT license automatically covers artwork supplied later.
- Menu-bar artwork is drawn by the application. Renderer icons are inline SVG; typography uses system font references, without redistributing font binaries.
- `docs/assets`, `docs/screenshots` and `promo/` are excluded from the application. Historical images and promotional recordings are retained locally, without asserting third-party rights or absence of personal content. `promo/` includes Noto font/OFL and imageio-ffmpeg/BSD notices; those do not establish rights to every image, audio track or bundled FFmpeg codec/build. Review the actual assets and binary licensing before publishing that material separately.

No claims are made that this list certifies an unbuilt final DMG or every historical document/asset. See `docs/phase5b-final-code-review.md` for evidence, remaining issues and release gates.
