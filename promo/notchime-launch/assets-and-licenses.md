# 素材与许可

## 新9.6秒预告补充

- `music/original-soundtrack.wav`：`scripts/compose-trailer.py`新合成的150BPM原创音乐、kick、bass、synth、click、snap、whoosh与riser，没有第三方采样；按`assets/licenses/original-assets-MIT.txt`提供。
- `assets/trailer-captures/`：本轮重新采集当前Notchime的实际Electron窗口，数据为隔离Fixture；未读取EventKit或验证iCloud同步。源帧不是旧60秒视频截取。
- 线框iPhone、Mac轮廓、锁形图案及透视转场：新工程原创概念动画，非Apple系统录屏，未采用库存设备框架。
- `assets/notchime-trailer-icon.png`：复制自用户指定且当前项目采用的`build/notchime-icon.png`；来源与SHA-256见`assets/trailer-provenance.json`。根README明确公开再分发权待维护者确认，本工程不把该项称为许可已全部清理完成。
- Noto字体、FFmpeg及实际UI软件许可继续沿用下表。音乐先行节拍表、时间线、真实/概念镜头与验收边界见`storyboard-trailer.md`和`render-report.md`。视频画面没有制作状态水印，限制在文档披露。

下表包含旧60秒工程素材记录，其临时字标与旧音轨没有用于新短片。

本工程无商业歌曲、库存设备模板或下载来的应用截图。第三方图片没有被引入；旧 TO-DO Panel 图标与历史截图没有用于宣传画面。

| 素材 | 来源 | 许可 / 分发边界 |
| --- | --- | --- |
| 真实 Mac 应用截图和序列帧 | `scripts/capture-app.cjs`，项目实际 Main/Preload/Renderer；纯 Fixture 数据 | 项目现有 MIT，副本在 `assets/licenses/project-MIT.txt`；仅证明当前开发界面与 Fixture 行为 |
| iPhone Calendar / Reminders 画面 | 本工程程序绘制 | 原创示意 UI，明确非真实录屏。Apple、iPhone、MacBook、Calendar、Reminders 为对应品牌，不表示 Apple 赞助或认证 |
| MacBook / iPhone 框架 | `scripts/render.py` 几何绘制 | 原创，无第三方框架资产，无 Apple Logo |
| 抽象壁纸、背景与临时 notch 标记 | 本工程数学生成与几何绘制 | 原创；临时标记尚未批准为正式品牌 Logo |
| 字标及双语文字 | 用户品牌文案 + 本工程编排 | 无第三方广告文案引用 |
| Noto Sans CJK SC Regular / Medium | [官方 Noto CJK](https://github.com/notofonts/noto-cjk/tree/main/Sans/OTF/SimplifiedChinese) | SIL OFL 1.1，允许嵌入与随作品分发；保留 `assets/licenses/Noto-OFL.txt`；未修改字体。源地址及 SHA-256 在 `assets/source-manifest.json` |
| 应用截图内系统字体 | 当前 macOS/Electron 实际渲染结果 | 仅栅格截图，不复制或分发 Apple 字体二进制；项目文字和自制 UI 使用 OFL Noto |
| `notchime-original-score.wav` | 本工程程序合成的原创和弦、轻量音符与UI点击声 | 无采样、旋律引用或下载的音乐；本工程新增原创素材按 MIT 许可提供。无需第三方音乐署名 |
| FFmpeg 7.1 执行工具 | [imageio-ffmpeg 0.6.0](https://pypi.org/project/imageio-ffmpeg/0.6.0/) macOS arm64 wheel | 仅用于渲染。Python wrapper BSD-2-Clause，捆绑二进制 GPL及第三方说明见 `tools/imageio_ffmpeg-0.6.0.dist-info/LICENSE` 和二进制 `-version` 配置。工具不要随宣传 MP4 作为应用安装包分发 |
| H.264 / AAC 编码输出 | 本地 FFmpeg / libx264 / AAC | MP4不包含FFmpeg可执行程序或字体文件。编码标准的专利授权是独立于素材版权的事项，本工程不声称提供任何专利许可 |

原始字体来自官方 `raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/...`，已将完整 OFL 文本保存在工程内。精确文件哈希用于固定当前素材，重渲染不需要重新下载。Noto 官方使用说明也确认采用 OFL：[Use Noto](https://notofonts.github.io/noto-docs/website/use/)。

## 当前未采用的素材

`build/to-do-panel-icon.icns` 仍是旧品牌资源，未用作 Notchime 正式图标。`docs/screenshots/` 和历史 `.cache` 截图未作为视频素材读取，避免旧业务品牌及可能的私人内容。现有 hero 图未使用，全部背景自制。

## 补录素材的授权

用户后续提供的录屏应只包含专用测试清单/日历，并确认有权公开。不要包含真实联系人、账户地址、备注、通知横幅或其他清单标题。正式 Logo 需要确认来源和公开使用许可。不得仅凭上传文件自动判定同步验证通过。
