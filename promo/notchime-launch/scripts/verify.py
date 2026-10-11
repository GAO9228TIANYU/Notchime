#!/usr/bin/env python3
"""Validate actual encoded streams, full decode, frame counts, fonts and captions."""
from pathlib import Path
import ast, hashlib, json, re, subprocess, sys
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'tools'))
import cv2, imageio_ffmpeg
from PIL import Image,ImageFont
from fontTools.ttLib import TTFont
ff=imageio_ffmpeg.get_ffmpeg_exe();results=[]
expected=[('notchime-promo-1080p.mp4',1920,1080,30,60,True),('notchime-demo-short.mp4',1920,1080,30,14,True),('notchime-demo-loop.mp4',960,540,30,8,False)]
for name,w,h,fps,duration,audio in expected:
    p=root/'output'/name;info=subprocess.run([ff,'-hide_banner','-i',str(p)],capture_output=True,text=True).stderr
    cap=cv2.VideoCapture(str(p));actual=(int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)));f=cap.get(cv2.CAP_PROP_FPS);n=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));cap.release()
    assert actual==(w,h),(name,actual);assert abs(f-fps)<.001,(name,f);assert n==fps*duration,(name,n)
    assert 'Video: h264' in info and 'yuv420p' in info
    assert ('Audio: aac' in info)==audio
    if audio:assert '48000 Hz, stereo' in info
    decoded=subprocess.run([ff,'-v','error','-i',str(p),'-f','null','-'],capture_output=True,text=True)
    assert decoded.returncode==0 and not decoded.stderr,(name,decoded.stderr)
    results.append({'file':name,'width':w,'height':h,'fps':f,'frames':n,'durationSeconds':n/f,'bytes':p.stat().st_size,'MiB':round(p.stat().st_size/1048576,2),'video':'H.264 / yuv420p','audio':'AAC / 48000 Hz / stereo' if audio else None,'fullDecode':'passed','streamEvidence':info})
gif=root/'output/notchime-demo.gif';im=Image.open(gif);duration_ms=0
for i in range(im.n_frames):im.seek(i);duration_ms+=im.info.get('duration',0)
assert im.size==(640,360);assert abs(duration_ms-8000)<100
results.append({'file':gif.name,'width':640,'height':360,'nominalFps':12,'frames':im.n_frames,'durationSeconds':duration_ms/1000,'bytes':gif.stat().st_size,'MiB':round(gif.stat().st_size/1048576,2),'note':'GIF centisecond timebase; durations alternate 80/90ms'})
tl=json.loads((root/'src/timeline.json').read_text());source=(root/'scripts/render.py').read_text()
strings=[node.value for node in ast.walk(ast.parse(source)) if isinstance(node,ast.Constant) and isinstance(node.value,str)]
chars=set(''.join(strings)+json.dumps(tl,ensure_ascii=False));chars={c for c in chars if not c.isspace() and ord(c)>31}
coverage=[]
for p in sorted((root/'assets/fonts').glob('*.otf')):
    ft=TTFont(p);mapped=set(ft.getBestCmap());missing=sorted(c for c in chars if ord(c) not in mapped)
    assert not missing,(p.name,missing)
    coverage.append({'font':p.name,'testedCodepoints':len(chars),'missing':missing})
for name in ['subtitles-zh-en.srt','subtitles-zh-en.ass']:
    content=(root/name).read_text(encoding='utf-8');assert '\ufffd' not in content
    for _,_,en,zh in tl['captions']:assert en in content and zh in content
srt=(root/'subtitles-zh-en.srt').read_text()
def seconds(stamp):
    h,m,s=re.split('[:,]',stamp)[:3];ms=stamp.split(',')[1];return int(h)*3600+int(m)*60+int(s)+int(ms)/1000
intervals=re.findall(r'(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)',srt)
assert len(intervals)==10
last=0
for a,b in intervals:
    start,end=seconds(a),seconds(b);assert start>=last and end>start;last=end
# The last two seconds have an unchanged, clean brand composition.
probe_frames=[]
for t in [58.0,59.0,59.9]:
    r=subprocess.run([ff,'-v','error','-ss',str(t),'-i',str(root/'output/notchime-promo-1080p.mp4'),'-frames:v','1','-f','image2pipe','-vcodec','png','-'],capture_output=True,check=True)
    from io import BytesIO
    probe_frames.append(Image.open(BytesIO(r.stdout)).convert('RGB'))
import numpy as np
max_mae=max(float(np.abs(np.asarray(probe_frames[0],dtype=np.float32)-np.asarray(x,dtype=np.float32)).mean()) for x in probe_frames[1:])
assert max_mae<.6,max_mae
e=json.loads((root/'assets/captures/capture-evidence.json').read_text());assert e['fixtureCompletionConfirmed'] and not e['smartNotchEndState']['expanded'];assert e['eventKitAccess'] is False and e['syncVerified'] is False
report={'status':'PREVIEW','passed':True,'videos':results,'subtitles':{'utf8':'passed','allBilingualCaptions':'passed','fontCoverage':coverage,'visualInspection':'reviewed: 12 representative full-resolution frames; English above Chinese; no observed clipping'},'finalHoldSeconds':2,'finalHoldMeanAbsolutePixelDifference':max_mae,'authenticity':{'Mac':'actual Electron window / synthetic Fixture input','iPhone':'original illustrated placeholder','iCloudSyncVerified':False,'officialLogoAvailable':False},'privacy':'Phase 5A section 14 supports bounded current-app claims; formal release audit not passed','ffprobe':'not installed; FFmpeg stream metadata + OpenCV frame count + full FFmpeg decode used','appCodeModified':False,'gitExecuted':False,'packagingSigningPublishingExecuted':False}
(root/'output/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
table='\n'.join(f"| {v['file']} | {v['width']}×{v['height']} | {v.get('fps',v.get('nominalFps')):g} | {v['durationSeconds']:g}秒 | {v['MiB']:.2f} MiB |" for v in results)
delivery=f'''# Notchime 宣传视频交付报告

当前版本为 **Preview**，不是正式发布版。已实际渲染，不是仅有宣传方案。

| 文件（output/） | 分辨率 | 帧率 | 时长 | 大小 |
| --- | --- | --- | --- | --- |
{table}

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
'''
(root/'delivery-report.md').write_text(delivery,encoding='utf-8')
print(json.dumps({'passed':True,'status':'PREVIEW','videos':[{k:v[k] for k in ['file','width','height','durationSeconds','MiB']} for v in results],'fontCoverage':'passed','captions':'passed'},ensure_ascii=False,indent=2))
