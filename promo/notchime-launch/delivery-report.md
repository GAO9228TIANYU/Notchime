# Notchime 宣传视频交付报告

当前版本为 **Preview**，不是正式发布版。已实际渲染，不是仅有宣传方案。

| 文件（output/） | 分辨率 | 帧率 | 时长 | 大小 |
| --- | --- | --- | --- | --- |
| notchime-promo-1080p.mp4 | 1920×1080 | 30 | 60秒 | 6.34 MiB |
| notchime-demo-short.mp4 | 1920×1080 | 30 | 14秒 | 1.02 MiB |
| notchime-demo-loop.mp4 | 960×540 | 30 | 8秒 | 0.09 MiB |
| notchime-demo.gif | 640×360 | 12 | 8秒 | 0.53 MiB |

主片与短版为 H.264 / yuv420p + AAC 48kHz 双声道；循环MP4无声。完整解码与帧数验证通过。GIF为12fps标称，GIF时间精度导致8.00秒附近量化，适合README备用。原始MP4可直接公开播放技术兼容，但素材与发布状态仍为Preview。

## 已生成

60秒主片、14秒短片、8秒循环MP4、GIF、封面、12个检查帧、分镜、SRT、ASS、素材许可、原创配乐WAV、录制指南、源时间线、可重复渲染脚本、真实应用Fixture采集脚本、素材预处理脚本及release缺项检查脚本。输出验证细节见 `output/validation.json`。

## 真实与示意

Mac界面来自本次真实npm start应用窗口；完成操作真实经过当前IPC及Renderer，Smart Notch真实经过当前Main定时器、悬停保护及原CSS动画。全部系统数据由隔离Fixture替代，没有访问EventKit或私人日程。采样约8–10fps，输出30fps；不是原生30fps屏幕录像。

iPhone Calendar/Reminders、设备框架、跨设备流转都是明确标注的原创动画。iPhone完成状态不是真实同步回写。没有声称已录制或验证iPhone。正式Logo缺失，收尾为临时文字标识。旧TO-DO Panel图标与历史截图未用于影片。

## 字幕和隐私

SRT/ASS全部双语文案已核对、UTF-8通过、Noto字体字形覆盖通过；代表帧已检查无可见缺字或遮挡关键事项。MP4字幕已烧录，请勿重复外挂。

隐私文案依据项目Phase5A第14节：无需Notchime账户、无需自建服务器、本地优先有Verified证据；No app tracking*明确限定当前应用代码审计范围。没有绝对安全、不经网络或保证即时同步的声明。审计报告仍有供应链及最终包验收阻塞，不能宣布Release-ready。

## 还缺什么

需用户提供iPhone真实Calendar创建、Reminders创建和完成回写，以及对应Mac真实EventKit同名数据、主动完成、Smart Notch录屏；正式批准的Logo。推荐时长及一次录齐方法见 `recording-guide.md`。真实同步允许等待和压缩等待剪辑，但须人工核对前后顺序及完成状态。

本次仅新增宣传片目录，并只在`.cache/tests/promo-*`创建/清理自己启动的隔离测试目录。没有修改Electron主程序、Swift Helper、主应用依赖、设置或身份，没有Git、应用打包、签名、公证、安装或公开发布。没有删除或放宽业务测试。音轨原创，字体OFL，第三方工具许可证已记录。
