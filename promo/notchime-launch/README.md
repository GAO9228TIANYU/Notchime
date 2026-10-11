# Notchime 双语宣传视频工程

## 当前交付：9.6秒音乐驱动预告

当前主交付是 `output/notchime-trailer-10s.mp4`，1920×1080 / 60fps / H.264 + AAC 48kHz；另有无声版、960×540 README循环版和PNG封面。没有制作状态水印。旧60秒文件保留用于历史追溯，不是当前短片的剪辑输入。

新增独立源码：`scripts/compose-trailer.py`（先生成150BPM/24拍音乐与节拍表）、`scripts/render-trailer.py`（重新编排576帧）、`scripts/verify-trailer.py`（实际编码与节奏验收）、`src/trailer-timeline.json`。不修改主应用依赖。

在项目根目录依次运行：

```sh
python3 promo/notchime-launch/scripts/compose-trailer.py
python3 promo/notchime-launch/scripts/render-trailer.py
python3 promo/notchime-launch/scripts/verify-trailer.py
```

只生成新短片检查图：`python3 promo/notchime-launch/scripts/render-trailer.py --stills`。

重采集当前应用Fixture素材：`node promo/notchime-launch/scripts/capture-trailer.cjs`。只写隔离测试目录和本工程`assets/trailer-captures/`；不会请求真实EventKit内容。新短片复用真实UI，但重新设计概念设备、美术、剪辑、音乐。iPhone/同步为明显概念动画；实际素材和限制见 `storyboard-trailer.md`、`render-report.md`。现用图标来自项目用户指定PNG，公开再分发权按根README仍待维护者确认。

节拍表在 `music/beat-map.json`，原创配乐在 `music/original-soundtrack.wav`，双语字幕在 `subtitles-trailer-zh-en.srt`。精确帧时间和验收证据在 `output/trailer-frame-trace.json`、`output/trailer-validation.json`。循环版使用完整9.6秒画面，无声、30fps、960×540；结尾品牌与开头刘海形成有意的重启切点，未倒放任务完成，也未声称无缝无限循环。

下方为旧60秒工程记录。

**状态：PREVIEW（制作预览），不可称为正式发布版。**

已完成 60 秒 1080p / 30 fps 双语动画合成、真实 Electron Fixture 镜头、原创配乐与 MP4 编码。iPhone、跨设备同步使用明确标注的动画示意；未录制或验证 iCloud 全链路。当前应用身份仍为 Calendar Notch Dev，未修改名称、Bundle ID 或生产代码。收尾使用临时文字标识，不能替代正式 Logo。

## 交付位置

- `output/notchime-promo-1080p.mp4`：60 秒，H.264 / AAC 48 kHz，双语字幕已烧录。
- `output/notchime-demo-short.mp4`：14 秒，系统流转与完成操作精简版。
- `output/notchime-demo-loop.mp4`：8 秒，960×540，无声 README 循环视频。
- `output/notchime-demo.gif`：8 秒，640×360 / 12 fps，GIF 备用。
- `output/notchime-poster.jpg`、`output/contact-sheet.jpg`：封面与检查图。
- `subtitles-zh-en.srt` / `.ass`：UTF-8 双语字幕。
- `storyboard.md`：完整时间轴及每个镜头的素材性质。
- `assets-and-licenses.md`：来源、许可和品牌边界。
- `recording-guide.md`：一次录齐真实验证素材的指南。
- `output/validation.json`、`delivery-report.md`：验收证据与交付报告。

## 重渲染

本工程使用 Python 3.12、Pillow、NumPy、fontTools（验证）、OpenCV（验证）及工程内 FFmpeg 7.1。当前环境已有 Python 图像库，FFmpeg 通过 `imageio-ffmpeg==0.6.0` 安装到本工程 `tools/`，没有修改主应用 `package.json`。不需要 Remotion，也没有引入渲染构建步骤。

在项目根目录运行：

```sh
python3 promo/notchime-launch/scripts/render.py
python3 promo/notchime-launch/scripts/verify.py
```

只生成检查图：`python3 promo/notchime-launch/scripts/render.py --stills`。

只重建短版/GIF：`python3 promo/notchime-launch/scripts/render.py --derivatives`。

如独立迁移本工程，在本工程目录执行 `python3 -m pip install --target tools -r requirements.txt`；只在工程目录写入，不安装全局依赖。迁移后以 `python3 scripts/render.py` 运行。

时间线和文案在 `src/timeline.json`；设备几何、转场、排版、录屏放置、配乐合成在 `scripts/render.py`。60 秒共 1800 帧，逐帧确定性生成。无声版可直接使用工程内 FFmpeg 对成片去掉音轨，无需重新制作画面。

## 应用素材重采集

在项目根目录：

```sh
node promo/notchime-launch/scripts/capture-app.cjs
```

该脚本通过 `npm --ignore-scripts start` 运行实际 Main、Preload 和 Renderer。省略预启动是为避免原生 Helper 编译/签名，使用与现有测试相同的隔离 JSONL Fixture 方法。生产文件不被写入。只读测试数据，完成动作仅操作 Fixture；真实 EventKit 不被启动。userData 使用 `.cache/tests/promo-*`，退出后删除本次创建的临时目录；不访问或清理个人数据。

采集的是透明应用窗口，不是全桌面录制：Retina 源尺寸 2480×1232；真实采样约 8–10 fps，按时间戳转换成 30 fps 输出，不能称为原生 30 fps 录屏。已有 CSS 动画、Main 定时器、悬停策略和完成 IPC 都真实运行。`assets/captures/capture-evidence.json` 保存帧时间戳和匿名测试内容。`smart-notch` 的 8 秒镜头未加速；开场使用其中的展开画面进行摄影构图。

## 补齐真实素材

将 `recording-guide.md` 所列素材放进 `assets/incoming/`，运行：

```sh
python3 promo/notchime-launch/scripts/prepare-footage.py
```

脚本生成便于合成的逐帧素材及清单；还需人工检查内容、同步先后关系、裁剪与产品身份，并在 `scripts/render.py` 替换对应的 `PHONES` / `capture` / `recorded` 图层。时间轴、设备框架、文案及编码可继续复用。不会仅凭文件出现就撤销 Preview 标记。素材替换属于后续剪辑工作，并未在此版本伪装成已经完成。

`scripts/release-check.py` 会检查必需素材；当前应失败。它只列出缺项，永远不会自动授予 Release-ready 状态。真实同步验收、正式 Logo、隐私文案范围、最终产品身份需人工确认。安全报告的供应链与签名阻塞也不能由视频工程解除。

## 字幕使用

MP4 已烧录中文和英文，播放器额外加载字幕会重复。SRT 用于检索或重新剪辑；ASS 用于带样式的外部字幕，英语在上、中文在下，字体文件在 `assets/fonts/`。工程以构图内的文字图层为视觉母版，ASS 是独立可编辑字幕轨，并非逐像素复刻所有左对齐镜头。
