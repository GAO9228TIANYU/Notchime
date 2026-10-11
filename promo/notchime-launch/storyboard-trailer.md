# Notchime — 9.6 秒音乐驱动发布预告

新音乐、新时间线、新概念设备美术，**不是旧60秒视频的加速或截取**。1920×1080，60 fps，共576帧。主片9.600秒，无黑屏尾巴、无制作状态水印。双语同时烧录。

## 音乐先行

先执行 `scripts/compose-trailer.py`：写入 `music/beat-map.json`，再生成 `music/original-soundtrack.wav`；之后执行新的 `scripts/render-trailer.py`。150 BPM，4/4，6小节24拍；每拍0.4秒、24个视频帧、19200个48kHz音频采样。节拍索引从0开始。4.2与5.4秒为精确半拍，不是误差。

| 时间 / 帧（60fps） | 音乐事件 | 镜头与双语文案 | 转场 / 素材 |
| --- | --- | --- | --- |
| 0.0 / 0 | Hook bass + kick | 刘海边缘立即可见；Meet Notchime. / 遇见 Notchime。 | 极近设备构图，边缘光短扫；无等待、无黑帧 |
| 0.4 / 24 | Reveal hit | 从刘海遮罩快速展开实际界面 | Mask Reveal；原生窗口截图 + 原创遮罩，不宣称这是新的原生动画 |
| 1.2 / 72 | Push hit | Plan on iPhone. / 在 iPhone 安排日程。 | 透视线框iPhone进入；悬浮Calendar符号与“Design review / 设计评审”；没有iOS工具栏或状态栏 |
| 1.6 / 96 | UI tap | 14:00–15:00同一测试日程 | 概念日程元素响应节拍，Apple system sync / Apple系统同步为唯一流转标签 |
| 2.0 / 120 | Match-cut hit | See it on Mac. / 在 Mac 随时查看。 | 相同测试日程匹配到真实应用的原生日程行；空间推进、局部放大 |
| 2.8 / 168 | Reminder hit | Done here. Synced there. / 这里完成，多端同步。 | 实际Reminders区域推近，操作前加速后短暂减速 |
| 3.2 / 192 | Clean UI click | 同一“Send brief / 发送简报”完成后移除 | 实际Fixture完成前后帧在音频click处剪辑；绿色确认图形为编辑叠加，不是新增应用功能 |
| 3.6 / 216 | Bass drop + whoosh | 同名手机任务为已完成状态；双语文案持续到4.2秒 | Whip / Push；手机是明显线框概念动画，不是实际iPhone录屏 |
| 4.2 / 252 | Countdown snap | Every moment matters. / 重要时刻，不再错过。 | 真实Countdown“产品发布 · Launch / 还有21天”局部，透视推近与速度变化；不伪造自然日每秒跳变 |
| 4.4 / 264，4.8 / 288 | Ticks / synth | Countdown镜头移动与线扫 | 数值内容不改，镜头与强调线随节奏变化，无静态停留一整秒 |
| 5.4 / 324 | Collapse hit | Only when needed. / 需要时，才出现。 | 真实CSS收起序列经过剪辑变速；短暂安静桌面 |
| 6.0 / 360 | Reveal hit | 临近日程从刘海再次出现 | 真实CSS展开序列变速；保留产品轮廓，没有show/hide替代原生逻辑 |
| 6.8 / 408 | Privacy hit | Local-first. Privacy-first. / 本地优先，隐私优先。 | 刘海中心匹配锁图形；三组短句同时可见1.2秒，逐拍强调，避免每0.4秒替换一大段文字 |
| 7.2 / 432，7.6 / 456 | Snaps + final pickup | No Notchime account. / 无需Notchime账户；No custom servers. / 无需开发者服务器；No tracking SDKs. / 无用户追踪SDK | 字体清晰，全部短句保持可见；用精确线条强调，非PPT卡片或闪光 |
| 8.0 / 480 | Strongest logo hit | 项目现用图标 + Notchime | Logo Impact；0.28秒内收束；三音Sonic Logo在8.0、8.12、8.28秒 |
| 8.4–9.6 / 504–575 | Sonic decay / controlled tail | There When You Need It. Quiet When You Don't. / 需要时出现，无需时静默。 | 最后约1.2秒静止品牌画面；画面在9.6秒直接结束，无黑屏尾巴 |

## 明确的节奏变化

开场短促低频抓人；设备流转为切分Bass/Synth；完成操作让鼓点空出干净Click；Countdown进入更密的ticks；Smart Notch先收起、留白、再出现；隐私段削减鼓组并逐拍Snap；收尾最强Hit加三音签名。没有24次机械重复kick，也没有旧钢琴音轨。

## 真实素材与概念的界限

本次重新用 `npm --ignore-scripts start` 采集当前Notchime实际Main/Preload/Renderer窗口，仅注入隔离JSONL Fixture，数据目录只在`.cache/tests/promo-*`。完成仅写Fixture，EventKit不启动，iCloud没有验证。真实源素材在 `assets/trailer-captures/`，记录见 `capture-evidence.json`。原始窗口捕获约8–10fps，新合成输出60fps；不冒称原始录屏为60fps。

iPhone是原创透视线框设备和符号化悬浮元素；没有复制实际iOS界面、没有状态栏、没有触摸录屏外观。Calendar/Reminders设备间状态对应为**概念说明**，不作为真实同步证据。Apple系统账户负责同步，没有Notchime云节点，不保证即时同步。Smart Notch片段压缩了真实等待时间，不能从广告推断自动收起实际秒数。

## 隐私和图标

Phase5A第14节支持当前代码无Notchime账户、无自建服务器、无追踪SDK；所以短片明确使用“No Notchime account”和“No tracking SDKs”，没有把Apple ID或OS诊断纳入承诺。最终包安全验收仍未通过，广告不是安全认证。

图标来自项目当前已采用的 `build/notchime-icon.png`，README记录为用户指定图片，未新建或宣称另一个临时图标为正式Logo。源图公开再分发权仍需维护者确认；本次没有公开发布。
