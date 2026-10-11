# Notchime 9.6秒发布预告 — 渲染与验收报告

本次已实际完成新片渲染。新音轨、新逐帧时间线、新概念设备美术；没有读取或剪辑旧60秒MP4。影片中没有Preview、Demo Only、制作预览、测试版、内部路径或旧TO-DO Panel品牌。

## 输出文件

| 文件（output/） | 时长 | 分辨率 | 帧率 | 大小 | 音轨 |
| --- | --- | --- | --- | --- | --- |
| notchime-trailer-10s.mp4 | 9.600秒 | 1920×1080 | 60 fps | 2.16 MiB | AAC / 48000 Hz / stereo |
| notchime-trailer-10s-muted.mp4 | 9.600秒 | 1920×1080 | 60 fps | 1.86 MiB | none |
| notchime-trailer-10s-loop.mp4 | 9.600秒 | 960×540 | 30 fps | 0.35 MiB | none |

封面：`output/notchime-trailer-poster.png`，1920×1080 PNG。
字幕：`subtitles-trailer-zh-en.srt`，UTF-8，8条双语cue，Mac完成与手机完成镜头使用连续字幕。
原创音轨：`music/original-soundtrack.wav`，9.6秒，48kHz双声道24-bit PCM。
节拍表：`music/beat-map.json`。
完整分镜：`storyboard-trailer.md`。
检验结果：`output/trailer-validation.json`；实际编码画面检查图：`output/encoded-trailer-contact-sheet.jpg`。

## 音乐与卡点

实际150 BPM，4/4，24拍、6小节，每拍0.4秒。先写节拍表并合成原创音轨，再设计画面；没有沿用钢琴/氛围音轨。

开头kick/bass冲击，设备段切分synth，3.2秒干净UI click，3.6秒bass drop，Countdown密集tick与snap，Smart Notch收起后留白再reveal，隐私段削减鼓组并三次强调，8.0秒最强logo hit加8.0/8.12/8.28三音签名。全部音色为程序化原创，固定随机种子；无外部音乐或音效采样。

| 主要剪辑/动效起点 | 音乐事件 | 视频帧（60fps） |
| --- | --- | --- |
| 0.0秒 · hook | hook_bass | 0 |
| 1.2秒 · iphone-calendar | push_hit | 72 |
| 2.0秒 · mac-calendar | match_cut_hit | 120 |
| 2.8秒 · mac-reminders | reminder_hit | 168 |
| 3.6秒 · iphone-completed | bass_drop | 216 |
| 4.2秒 · countdown | countdown_snap | 252 |
| 5.4秒 · smart-notch | collapse_hit | 324 |
| 6.8秒 · privacy | privacy_hit | 408 |
| 8.0秒 · brand | logo_hit | 480 |

额外刘海Mask Reveal为0.4秒/第24帧；点击为3.2秒/第192帧；Smart Reveal为6.0秒/第360帧。4.2与5.4秒精确落在半拍网格。动效起点与对应音频事件共用同一时间表，帧网格误差0；空间push的运动在起点后逐帧展开，避免突兀白闪。不是只在报告里列BPM。

## 节奏、画面与技术验收

实际完整解码：三条视频均通过。主片576帧、无声版576帧、循环版288帧。所有576帧检测无空/黑帧；最长静止约1.32秒，为结尾品牌保持，不超过1.5秒。品牌最后1.2秒画面变化仅为编码噪声。第一帧已显示设备与刘海轮廓，0.4秒开始展开，0.0秒即有低频hook。

至少五种节奏变化：低频开场、设备切分推进、完成click留白、Countdown密集tick、收起/展开反差、隐私snap、最终sonic hit。采用Mask Reveal、Calendar Match Cut、空间Push/Whip、Speed Ramp、Logo Impact，没有串联普通淡入淡出。设备经透视投影，文本独立锐利渲染；无过量抖动、粒子爆炸、连续闪光。

Calendar、Reminders、Countdown、Smart Notch均实际入片。iPhone→Mac同名“Design review / 设计评审”；Mac完成→手机同名“Send brief / 发送简报”。中英逐句核对，SRT UTF-8及Noto字体字形覆盖通过；实际编码代表帧已视觉检查，无可见乱码、关键操作被遮挡或字幕裁切。所有段落英文在上、中文在下。

H.264 High、yuv420p；主片与无声版1920×1080/60fps，AAC主音轨48kHz双声道。编码后AAC实测如下：

- 综合响度：-14.7 LUFS。
- 真峰值：-1.5 dBFS。
- 解码样本峰值：-1.57 dBFS。
- 正好460800个48kHz样本（9.6秒），没有削波或爆音。

循环版用于README无声自动播放：完整9.6秒，960×540/30fps。结尾品牌到开头刘海是有意的重启切点；不是倒放任务完成，也不声称完美无缝循环。

## 来源与真实性限制

Mac镜头为本轮重新采集的当前Notchime实际Electron窗口，运行实际Main/Preload/Renderer和完成IPC；由隔离Fixture供给非私人测试数据，保存仅影响Fixture。源帧在 `assets/trailer-captures/`，源时间戳在`capture-evidence.json`。不是从旧视频截取。源采样约8–10fps，输出合成60fps；不能称为真实60fps屏幕录制。

iPhone、设备轮廓、跨设备状态传递都是明显的概念动画：透视线框、悬浮Calendar/Reminders符号，没有iOS原生工具栏、状态栏或真实触摸录屏外观。没有实际iPhone录屏，没有真实EventKit内容读写，没有验证iCloud双向同步。流转标签明确是Apple system sync；没有Notchime云服务或保证即时同步。绿色完成确认图形是编辑叠加。Smart Notch真实CSS源序列经过广告剪辑变速，等待被压缩，不表示实际收起计时为0.26秒。

## 隐私与图标边界

依据`docs/phase5a-privacy-security-audit.md`第14节和当前README：无Notchime账号、无自建服务器、当前应用无用户追踪SDK有范围内证据。短片使用“No Notchime account / No custom servers / No tracking SDKs”，未把Apple ID、Apple系统网络同步、操作系统诊断纳入无限承诺。没有100% Secure、Absolute Privacy等绝对保证。最终包安全、供应链及签名验收仍是独立未完成事项，广告并非安全认证。

收尾使用项目现用`build/notchime-icon.png`，根README记为用户指定图片，不再用上次的临时字标假称正式图标。本次未创造新正式Logo；但公开再分发权仍按根README待维护者确认。真实iPhone素材仍缺，原`recording-guide.md`一次录齐方法继续适用。概念版成片已经完成，可供审看；公开使用前需确认图标权利。真实录屏版本需补齐并核对实际系统同步。

## 许可与复现

音乐、UI click、whoosh、snap、riser、设备线框与背景均原创，按本工程`assets/licenses/original-assets-MIT.txt`提供；Noto Sans CJK SC为OFL，许可副本已保存。应用截图归项目现有MIT许可；系统字体仅存在于栅格捕获，不复制字体二进制。现用图标的未确认权利如上，未笼统宣称全部素材都已获公共分发许可。

在项目根目录依次执行：

```sh
python3 promo/notchime-launch/scripts/compose-trailer.py
python3 promo/notchime-launch/scripts/render-trailer.py
python3 promo/notchime-launch/scripts/verify-trailer.py
```

音乐与画面随机种子固定。工具和依赖继续在独立工程内，版本见`requirements.txt`。主应用package.json未加依赖。当前FFprobe缺失，使用FFmpeg元数据、OpenCV帧数及完整解码交叉验证。

本轮未修改Notchime主程序、Electron/Swift/EventKit业务、Countdown/Calendar/Reminders逻辑、Bundle ID或个人设置；没有Git、DMG、签名或公开发布。仅新增/更新宣传片工程，并只创建/清理本次隔离`.cache/tests/promo-*`。旧60秒产物保留历史，不作为当前交付。
