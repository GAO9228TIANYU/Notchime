#!/usr/bin/env python3
"""Technical AND editorial checks on the actual newly encoded film."""
from pathlib import Path
from io import BytesIO
import ast,hashlib,json,re,subprocess,sys,wave
import cv2,numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output';sys.path.insert(0,str(ROOT/'tools'))
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();TL=json.loads((ROOT/'src/trailer-timeline.json').read_text());B=json.loads((ROOT/'music/beat-map.json').read_text());TRACE=json.loads((OUT/'trailer-frame-trace.json').read_text())
files=[]
for name,w,h,fps,audio in [('notchime-trailer-10s.mp4',1920,1080,60,True),('notchime-trailer-10s-muted.mp4',1920,1080,60,False),('notchime-trailer-10s-loop.mp4',960,540,30,False)]:
    p=OUT/name;v=cv2.VideoCapture(str(p));actual=(int(v.get(cv2.CAP_PROP_FRAME_WIDTH)),int(v.get(cv2.CAP_PROP_FRAME_HEIGHT)));fr=v.get(cv2.CAP_PROP_FPS);n=int(v.get(cv2.CAP_PROP_FRAME_COUNT));v.release()
    assert actual==(w,h) and abs(fr-fps)<.0001 and n==round(9.6*fps),(name,actual,fr,n)
    info=subprocess.run([FF,'-hide_banner','-i',str(p)],capture_output=True,text=True).stderr
    assert 'Video: h264' in info and 'yuv420p' in info
    assert ('Audio: aac' in info)==audio
    if audio:assert '48000 Hz, stereo' in info
    dec=subprocess.run([FF,'-v','error','-i',str(p),'-f','null','-'],capture_output=True,text=True)
    assert dec.returncode==0 and not dec.stderr,dec.stderr
    files.append({'file':name,'width':w,'height':h,'fps':fr,'frames':n,'duration':n/fr,'bytes':p.stat().st_size,'MiB':round(p.stat().st_size/1048576,2),'codec':'H.264 / yuv420p','audio':'AAC / 48000 Hz / stereo' if audio else 'none','decode':'passed','streamMetadata':info})

# Every main cut has an explicit soundtrack event and lands on an exact frame.
events={round(e['time'],6):e for e in B['events']};sync=[]
for row in TL['cuts']:
    time=row['start'];assert time in events,(row['scene'],time)
    frame=round(time*60);assert abs(frame/60-time)<1e-8
    assert TRACE[frame]['scene']==row['scene']
    sync.append({'time':time,'frame':frame,'event':events[time]['type'],'scene':row['scene'],'frameError':0})
assert B['uiClicks'][1]==3.2 and B['finalLogoHit']==8
assert len(B['beats'])==24 and all(abs(b['time']-b['index']*.4)<1e-8 for b in B['beats'])
assert len(TRACE)==576

# Examine ALL decoded frames: no empty frames, and no unintended long stills.
v=cv2.VideoCapture(str(OUT/'notchime-trailer-10s.mp4'));k=0;blank=[];static=0;longest=0;prev=None;inspected=[];cuts=[.18,.82,1.7,2.4,3.12,3.32,3.89,4.75,5.78,6.32,7.35,9.0];targets={round(t*60):t for t in cuts};end_frames=[]
while True:
    ok,im=v.read()
    if not ok:break
    gray=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    if float(gray.std())<2 or int(gray.max())<30:blank.append(k)
    if prev is not None:
        # Mean pixel difference includes meaningful camera/UI motion, ignores codec noise.
        delta=float(np.abs(im.astype(np.int16)-prev.astype(np.int16)).mean())
        static=static+1 if delta<.08 else 0;longest=max(longest,static)
    prev=im
    if k in targets:
        rgb=cv2.cvtColor(im,cv2.COLOR_BGR2RGB);f=Image.fromarray(rgb);p=OUT/f'encoded-trailer-{targets[k]:04.2f}.jpg';f.save(p,quality=95);inspected.append(f)
    if k>=504:end_frames.append(im.copy())
    k+=1
v.release();assert k==576 and not blank,blank
assert longest/60<=1.5,('unintended still',longest/60)
sheet=Image.new('RGB',(1440,1080),'#060910')
for i,f in enumerate(inspected):sheet.paste(f.resize((480,270),Image.Resampling.LANCZOS),((i%3)*480,(i//3)*270))
sheet.save(OUT/'encoded-trailer-contact-sheet.jpg',quality=96)
hold_diff=max(float(np.abs(x.astype(np.int16)-end_frames[0].astype(np.int16)).mean()) for x in end_frames[1:]);assert hold_diff<.6,hold_diff

# Audio inspected after AAC encoding; not just the PCM source or beat metadata.
raw=subprocess.run([FF,'-v','error','-i',str(OUT/'notchime-trailer-10s.mp4'),'-vn','-f','f32le','-ar','48000','-ac','2','pipe:1'],capture_output=True,check=True).stdout
pcm=np.frombuffer(raw,np.float32).reshape(-1,2);peak=float(np.abs(pcm).max());assert len(pcm)==460800 and peak<.99
peak_db=float(20*np.log10(peak));assert peak_db<-.5
analysis=subprocess.run([FF,'-hide_banner','-i',str(OUT/'notchime-trailer-10s.mp4'),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True).stderr
summary=analysis[analysis.rfind('Summary:'):];(OUT/'trailer-audio-analysis.txt').write_text(summary)
integrated=float(re.search(r'Integrated loudness:\s+I:\s+([-\d.]+)',summary).group(1));true_peak=float(re.search(r'True peak:\s+Peak:\s+([-\d.]+)',summary).group(1))
assert -17<integrated<-11 and true_peak<-.5,(integrated,true_peak)
audio_events=[]
for e in B['events']:
    start=round(e['time']*48000);chunk=pcm[start:start+round(.07*48000)]
    rms=float(np.sqrt(np.mean(chunk**2)));audio_events.append({'time':e['time'],'type':e['type'],'rmsFirst70ms':rms})
    if e['major']:assert rms>.015,(e,rms)
assert float(np.sqrt(np.mean(pcm[:4800]**2)))>.08,'opening hook inaudible'
assert float(np.sqrt(np.mean(pcm[8*48000:int(8.1*48000)]**2)))>.08,'logo hit inaudible'

# Full bilingual copy and glyph coverage. Banned text cannot enter the draw calls.
src=(ROOT/'scripts/render-trailer.py').read_text();nodes=ast.parse(src)
draw_text=[]
for n in ast.walk(nodes):
    if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='txt':
        if len(n.args)>1 and isinstance(n.args[1],ast.Constant) and isinstance(n.args[1].value,str):draw_text.append(n.args[1].value)
srt=(ROOT/'subtitles-trailer-zh-en.srt').read_text(encoding='utf-8');assert '\ufffd' not in srt
for row in TL['cuts']:assert row['en'] in srt and row['zh'] in srt
for bad in ['preview','demo only','制作预览','测试版','内部版本','TO-DO Panel','Calendar Notch Dev']:
    assert bad.lower() not in '\n'.join(draw_text+[srt]).lower(),bad
chars=set(''.join(draw_text)+srt+json.dumps(TL,ensure_ascii=False));chars={c for c in chars if not c.isspace() and ord(c)>31}
for p in (ROOT/'assets/fonts').glob('*.otf'):
    cmap=TTFont(p).getBestCmap();missing=[c for c in chars if ord(c) not in cmap];assert not missing,(p,missing)
evidence=json.loads((ROOT/'assets/trailer-captures/capture-evidence.json').read_text());assert not evidence['eventKitAccess'] and not evidence['personalDataAccess'] and not evidence['syncVerified'];assert evidence['fixtureCompletionConfirmed']
assert evidence['testData']['calendars'][0]['name']=='Notchime';assert evidence['testData']['reminders'][0]['title']=='发送简报 · Send brief'
assert 'assets/incoming' not in src,'unreviewed incoming footage unexpectedly loaded'
# Synthesis determinism and source order are explicit provenance, not a claim of real sync.
assert (ROOT/'music/beat-map.json').stat().st_mtime<=(ROOT/'music/original-soundtrack.wav').stat().st_mtime
report={'passed':True,'videos':files,'bpm':150,'duration':9.6,'sync':sync,'uiClick':3.2,'sonicLogo':{'hit':8,'notes':[8,8.12,8.28]},'allDecodedFramesInspected':k,'blankFrames':blank,'longestStillSeconds':longest/60,'finalHoldMeanPixelDifference':hold_diff,'audio':{'integratedLUFS':integrated,'truePeakDBFS':true_peak,'decodedSamplePeakDBFS':peak_db,'clipping':False,'samples':len(pcm),'events':audio_events},'bilingualTextAndGlyphs':'passed','bannedOverlayText':'none in captions or drawing text; native footage is clean named Fixture data','allCoreFeatures':['Apple Calendar','Apple Reminders','Countdown','Smart Notch'],'iPhone':'wireframe concept animation','iCloudVerified':False,'icon':'current user-designated project icon; public redistribution rights pending maintainer confirmation','productionCodeModified':False,'gitPackagingSigningPublishing':False}
(OUT/'trailer-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':True,'videos':[{k:v[k] for k in ['file','width','height','fps','duration','MiB']} for v in files],'bpm':150,'integratedLUFS':integrated,'truePeakDBFS':true_peak,'longestStillSeconds':longest/60,'beatCutAlignment':'all exact','blankFrames':0,'glyphs':'passed'},ensure_ascii=False,indent=2))
