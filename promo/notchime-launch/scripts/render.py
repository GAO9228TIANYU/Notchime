#!/usr/bin/env python3
"""Deterministic 60-second compositor. No application dependencies are changed.
Original vector devices, Noto OFL text, actual fixture application captures.
Every video remains explicitly PREVIEW until human verification and real footage.
"""
from pathlib import Path
import argparse, bisect, functools, json, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import imageio_ffmpeg
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
A=ROOT/'assets'; OUT=ROOT/'output'; OUT.mkdir(exist_ok=True)
TL=json.loads((ROOT/'src/timeline.json').read_text())
E=json.loads((A/'captures/capture-evidence.json').read_text())
W,H=1920,1080
WHITE='#F0F2FA'; MUTED='#A6AEC6'; BLUE='#91A6FF'; GREEN='#75DBB7'

@functools.lru_cache(maxsize=150)
def font(size,medium=False):
    return ImageFont.truetype(str(A/'fonts'/('NotoSansCJKsc-Medium.otf' if medium else 'NotoSansCJKsc-Regular.otf')),int(size))

def text(im,s,xy,size=36,color=WHITE,align='left',medium=False):
    d=ImageDraw.Draw(im); f=font(size,medium)
    for n,line in enumerate(s.split('\n')):
        x,y=xy; width=d.textlength(line,font=f)
        if align=='center':x-=width/2
        elif align=='right':x-=width
        d.text((round(x),round(y+n*size*1.25)),line,font=f,fill=color,anchor='lt')

def rr(im,box,r,fill,outline=None,width=1):
    ImageDraw.Draw(im).rounded_rectangle(tuple(round(v) for v in box),r,fill,outline,width)

def line(im,pts,fill,width=2):ImageDraw.Draw(im).line(pts,fill=fill,width=width,joint='curve')
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
def out(t):return 1-(1-max(0,min(1,t)))**3

@functools.lru_cache(maxsize=8)
def gradient(w,h,wall=False):
    y,x=np.mgrid[0:h,0:w]; x=x/w; y=y/h
    g=np.exp(-(((x-.56)/.49)**2+((y-.5)/.54)**2)*2.0)
    a=np.exp(-(((x-.78)/.30)**2+((y-.63)/.32)**2)*2)
    b=np.exp(-(((x-.23)/.4)**2+((y-.34)/.5)**2)*2)
    arr=np.stack((7+19*g+15*a,10+22*g+11*b,19+47*g+26*b+24*a),axis=-1)
    if wall:
        sweep=np.sin(7.7*x+3.1*y+1.2*np.sin(3*y))
        ribbon=np.exp(-((sweep-.65)/.26)**2)
        arr+=ribbon[:,:,None]*np.array([18,26,61])
    # Deterministic sub-LSB dither avoids gradients banding after H.264 encoding.
    arr+=np.random.default_rng(41).uniform(-.65,.65,(h,w,1))
    return Image.fromarray(np.uint8(np.clip(arr,0,255)),'RGB').convert('RGBA')

BG=gradient(W,H)

def paste(im,layer,x,y,scale=1,alpha=1):
    if scale!=1:
        layer=layer.resize((max(1,round(layer.width*scale)),max(1,round(layer.height*scale))),Image.Resampling.LANCZOS)
    if alpha<1:
        layer=layer.copy();layer.putalpha(layer.getchannel('A').point(lambda v:round(v*alpha)))
    im.alpha_composite(layer,(round(x),round(y)))

@functools.lru_cache(maxsize=128)
def capture(name):return Image.open(A/'captures'/name).convert('RGBA')

def recorded(clip,t):
    frames=E['clips'][clip]['frames']; times=[x['at'] for x in frames]
    item=frames[max(0,bisect.bisect_right(times,t)-1)]
    return capture(clip+'/'+item['file'])

@functools.lru_cache(maxsize=4)
def mac_shell():
    im=Image.new('RGBA',(1510,890));d=ImageDraw.Draw(im)
    rr(im,(53,17,1457,811),35,'#343843','#717781',2)
    rr(im,(57,21,1453,807),32,'#090A0E','#191C23',2)
    wallpaper=gradient(1384,758,True)
    mask=Image.new('L',wallpaper.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,1383,757),25,fill=255)
    wallpaper.putalpha(mask);paste(im,wallpaper,63,29)
    # Physical screen notch, vector model with no third-party artwork.
    rr(im,(658,29,852,61),11,'#050609');rr(im,(658,29,852,45),0,'#050609')
    d.ellipse((814,40,821,47),fill='#182137')
    text(im,'Finder     File     Edit     View', (88,37),14,'#E1E6F7')
    text(im,'Sun 11 Oct   14:00', (1420,37),14,'#E1E6F7',align='right')
    # Machined aluminum base; subtle geometric highlights.
    d.polygon([(53,812),(1457,812),(1500,834),(1476,850),(34,850),(10,834)],fill='#707682')
    line(im,[(20,834),(1490,834)],'#A0A7B3',2)
    rr(im,(638,812,872,829),9,'#333944')
    d.polygon([(34,850),(1476,850),(1440,861),(70,861)],fill='#242832')
    return im

def mac(panel=None):
    im=mac_shell().copy()
    if panel is not None:
        # Native viewport can be 1240x616 or collapsed 200x(menu-bar height), at 2x.
        sc=1240/panel.width if panel.width>1000 else 200/panel.width
        width=panel.width*sc
        paste(im,panel,755-width/2,29,sc)
    return im

def phone(mode='calendar',state='saved'):
    im=Image.new('RGBA',(452,860));d=ImageDraw.Draw(im)
    rr(im,(7,4,445,856),62,'#626977','#A1A8B8',2)
    rr(im,(11,8,441,852),58,'#080A10','#313641',2)
    rr(im,(20,17,432,843),50,'#11131B')
    rr(im,(149,29,303,66),18,'#030405')
    text(im,'9:41',(45,37),19,WHITE,medium=True)
    d.rounded_rectangle((382,39,406,50),3,outline='#CCD3E8',width=2);d.rectangle((386,42,400,47),fill='#CCD3E8')
    text(im,'‹', (41,100),34,'#91A6FF');text(im,'Done' if state=='editing' else '+',(410,110),22,BLUE,align='right')
    title='Calendar' if mode=='calendar' else 'Reminders'
    text(im,title,(45,170),40,medium=True)
    text(im,'Sunday, October 11',(45,231),19,MUTED)
    if mode=='calendar':
        text(im,'11',(52,281),54,WHITE,medium=True)
        text(im,'OCT',(140,300),19,BLUE)
        for i in range(4):
            text(im,str(13+i)+':00',(43,389+94*i),17,'#8891A9')
            line(im,[(106,395+94*i),(411,395+94*i)],'#292D3C',1)
        if state!='empty':
            rr(im,(104,481,411,575),12,'#242B4A')
            rr(im,(104,481,109,575),2,'#93A0FF')
            text(im,'Design review',(122,495),25,WHITE,medium=True)
            text(im,'设计评审',(122,531),21,MUTED)
        if state=='editing':
            rr(im,(32,270,420,598),23,'#1C202C','#343C53',1)
            text(im,'New Event',(55,295),24,medium=True)
            text(im,'Design review',(55,355),27,medium=True)
            text(im,'设计评审',(55,397),22,MUTED)
            line(im,[(54,443),(398,443)],'#353B4C')
            text(im,'Today  •  14:00 – 15:00',(55,469),20)
            text(im,'Notchime Demo',(55,524),20,BLUE)
    else:
        text(im,'Notchime Demo',(45,299),26,BLUE,medium=True)
        line(im,[(45,353),(410,353)],'#303546')
        if state!='empty':
            completed=state=='completed'
            d.ellipse((45,386,74,415),outline=GREEN if completed else BLUE,width=2,fill=GREEN if completed else None)
            if completed:line(im,[(52,400),(58,406),(68,395)],'#11231F',3)
            text(im,'Send demo deck',(91,386),25,MUTED if completed else WHITE,medium=True)
            text(im,'发送演示稿',(91,428),23,MUTED)
            text(im,'Today  ·  今天到期',(91,471),18,'#91A6FF')
            if completed:
                line(im,[(91,400),(286,400)],'#8E9BB4',2)
                text(im,'Completed  ·  已完成',(45,571),22,GREEN)
        if state=='editing':
            rr(im,(31,533,421,673),18,'#202534','#38405C',1)
            text(im,'Due today  /  今天到期',(53,558),23)
            text(im,'Add Reminder',(224,616),22,BLUE,align='center',medium=True)
        else:
            text(im,'Show Completed',(45,656),19,BLUE)
    text(im,'DEMO DATA / 演示数据',(226,753),15,'#8291AE',align='center')
    rr(im,(159,820,293,825),3,'#CCD2E4')
    return im

PHONES={(m,s):phone(m,s) for m in ['calendar','reminders'] for s in ['saved','empty','editing','completed']}

def badge(im,label,x=72,y=48,color=BLUE):
    d=ImageDraw.Draw(im);size=18;w=d.textlength(label,font=font(size))+32
    rr(im,(x,y,x+w,y+39),19,'#151B2B','#303951',1);text(im,label,(x+16,y+9),size,color)

def bilingual(im,en,zh,y=891,en_size=46,zh_size=31,x=960,align='center'):
    text(im,en,(x,y),en_size,WHITE,align,True)
    text(im,zh,(x,y+en_size+14),zh_size,MUTED,align)

def small_note(im,en,zh,y=802):
    text(im,en,(960,y),20,'#A7B2CA','center')
    text(im,zh,(960,y+29),19,'#A7B2CA','center')

def pointer(im,x,y,ring=False):
    d=ImageDraw.Draw(im)
    d.polygon([(x,y),(x+8,y+30),(x+14,y+20),(x+25,y+20)],fill='#F4F6FC',outline='#11131D',width=2)
    if ring:d.ellipse((x-20,y-20,x+20,y+20),outline='#99AFFE',width=3)

def scene(i,t):
    im=BG.copy()
    if i==0:
        panel=recorded('smart-notch',min(1.7,max(0,t-.7)))
        device=mac(panel)
        sc=1.24-.09*out(t/4)
        paste(im,device,960-device.width*sc/2,190,sc)
        # Lower third shaded for clean title separation.
        shade=Image.new('RGBA',(W,400));arr=np.zeros((400,W,4),dtype=np.uint8);arr[:,:,3]=np.linspace(0,230,400)[:,None];shade=Image.fromarray(arr,'RGBA');paste(im,shade,0,680)
        bilingual(im,'Meet Notchime.','遇见 Notchime。',884,64,34)
    elif i==1:
        u=t-5
        mode='calendar' if u<4.5 else 'reminders'
        local=u if mode=='calendar' else u-4.5
        state='editing' if local<2.4 else 'saved'
        p=PHONES[(mode,state)]
        sc=.87+.012*ease(local/4)
        paste(im,p,1210,122,sc)
        text(im,'PLAN',(158,229),21,BLUE)
        text(im,'Plan your day\non iPhone.',(154,295),73,WHITE,medium=True)
        text(im,'在 iPhone 上，',(157,493),35,MUTED)
        text(im,'轻松安排每一天。',(157,545),35,MUTED)
        text(im,'Apple Calendar' if mode=='calendar' else 'Apple Reminders',(157,684),28,WHITE,medium=True)
        text(im,'设计评审 · Design review' if mode=='calendar' else '发送演示稿 · Send demo deck',(157,731),26,BLUE)
        text(im,'Animation / 动画示意',(1406,940),20,MUTED,'center')
        if 1.8<local<2.45:pointer(im,1560,220,True)
    elif i==2:
        u=t-14
        p=PHONES[('calendar' if u<5.7 else 'reminders','saved')]
        paste(im,p,132,146,.67)
        # Subtle trajectory through the Apple system label, never a Notchime cloud.
        line(im,[(462,429),(614,429)],'#394463',2)
        for k in range(3):
            x=478+((u*35+k*42)%116)
            ImageDraw.Draw(im).ellipse((x,426,x+5,431),fill='#8F9ED0')
        text(im,'Apple system sync',(550,332),21,BLUE,'center')
        text(im,'Apple 系统同步',(550,367),19,MUTED,'center')
        paste(im,mac(capture('mac-before.png')),625,110,.77)
        # Readable evidence crop from the actual fixture Renderer, not redrawn UI.
        crop=capture('mac-before.png').crop((48,510,1285,902))
        paste(im,crop,696,508,.81)
        text(im,'ACTUAL APP · TEST DATA / 真实应用 · 测试数据',(1197,842),18,MUTED,'center')
        if u<6.1:bilingual(im,'One Apple ecosystem. No duplicate entry.','融入 Apple 生态，无需重复录入。',893,43,31)
        else:bilingual(im,'Your day, right in your notch.','你的日程，就在刘海之间。',893,47,31)
    elif i==3:
        u=t-26
        text(im,'ON MAC',(215,186),22,BLUE)
        text(im,'Notchime',(215,234),49,WHITE,medium=True)
        shot=recorded('complete',min(2.35,max(0,u-1)))
        crop=shot.crop((46,499,1285,1050))
        paste(im,crop,193,330,.73)
        text(im,'ACTUAL APP · TEST DATA',(215,827),18,MUTED)
        text(im,'真实应用 · 隔离测试数据',(215,858),18,MUTED)
        if .5<u<2.1:
            target=E['completionTarget'];px=193+(target['x']*2-46)*.73;py=330+(target['y']*2-499)*.73
            pointer(im,px+28*(1-ease(u/.8)),py+15*(1-ease(u/.8)),u>1.7)
        done=u>4.3
        p=PHONES[('reminders','completed' if done else 'saved')]
        paste(im,p,1298,113,.78)
        text(im,'APPLE REMINDERS / 动画示意',(1474,817),18,MUTED,'center')
        line(im,[(1145,476),(1245,476)],'#3B4B65',2)
        text(im,'Apple sync',(1198,508),17,BLUE,'center')
        bilingual(im,'Complete here. Updated across your devices.','在 Mac 上完成，在 Apple 设备间同步更新。',931,40,29)
        small_note(im,'Illustrated sync. Timing varies with Apple system services.','同步为动画示意；实际等待时间由 Apple 系统服务决定。',758)
    elif i==4:
        u=t-36;d=ImageDraw.Draw(im)
        # Quiet custom lock icon, no network-transfer metaphor.
        d.arc((909,180,1011,291),180,360,fill=BLUE,width=5)
        rr(im,(889,237,1031,361),28,'#131B2E','#8FA6F7',3)
        d.ellipse((951,277,969,295),fill=BLUE);rr(im,(957,289,963,316),3,BLUE)
        bilingual(im,'Your schedule. Your data. Your privacy.','你的日程，你的数据，你的隐私。',430,53,34)
        if u>=2.3:
            phrases=[('No Notchime account','无需 Notchime 账户'),('No custom servers','无需开发者服务器'),('No app tracking*','应用不追踪用户*')]
            for k,(en,zh) in enumerate(phrases):
                alpha=out((u-2.3-k*.25)/.55)
                card=Image.new('RGBA',(520,133));rr(card,(0,0,519,132),22,'#141B2C','#2D3752',1)
                text(card,en,(260,30),29,WHITE,'center',True);text(card,zh,(260,78),24,MUTED,'center')
                paste(im,card,155+k*550,637+10*(1-alpha),alpha=alpha)
        small_note(im,'*Current app code scope, Phase 5A. Apple account sync remains separate.','*限 Phase 5A 当前应用代码审计范围；Apple 账户同步由系统负责。',827)
    elif i==5:
        u=t-44;shot=recorded('smart-notch',u)
        paste(im,mac(shot),282,68,.9)
        phase='Quiet / 静默' if u<.75 or u>7.2 else ('Hover protected / 悬停保护' if 1.8<u<3.1 else 'Upcoming event / 临近日程')
        text(im,phase,(960,870),21,BLUE,'center')
        bilingual(im,'Only when it matters.','只在需要时，恰到好处地出现。',924,48,31)
    elif i==6:
        u=t-52
        # A typographic mark deliberately avoids impersonating an official app icon.
        d=ImageDraw.Draw(im)
        rr(im,(876,195,1044,252),20,'#060911','#6E80BF',2)
        d.ellipse((987,215,999,227),fill='#A6B5FF')
        text(im,'Notchime',(960,328),126,WHITE,'center',True)
        if u>1.0:
            bilingual(im,"There When You Need It. Quiet When You Don't.",'需要时出现，无需时静默。',545,40,33)
        if u>3.2:
            text(im,'Made for macOS · Local-first · Open Source',(960,760),25,MUTED,'center')
            text(im,'专为 macOS 打造 · 本地优先 · 开源',(960,808),24,MUTED,'center')
    badge(im,'NOTCHIME · PREVIEW / 制作预览')
    if i==1:badge(im,'iPHONE ANIMATION / 非真实录屏',1320,48)
    elif i in (0,5):badge(im,'REAL APP · DEMO DATA / 真实应用 · 演示数据',1260,48)
    elif i in (2,3):badge(im,'SYNC ILLUSTRATION / 同步未验证',1410,48)
    # Editorial cuts use short restrained luminance fades.
    s=TL['scenes'][i]; duration=s['end']-s['start']; u=t-s['start']
    alpha=out(u/.36)
    if i<6:alpha*=ease((duration-u)/.28)
    if alpha<1:im=Image.blend(BG,im,alpha)
    return im.convert('RGB')

def frame(t):
    i=min(6,bisect.bisect_right([s['start'] for s in TL['scenes']],t)-1)
    return scene(i,t)

def subtitle_files():
    def stamp(t,ass=False):
        n=round(t*(100 if ass else 1000));h=n//(360000 if ass else 3600000);m=(n//(6000 if ass else 60000))%60;s=(n//(100 if ass else 1000))%60;f=n%(100 if ass else 1000)
        return f'{h}:{m:02}:{s:02}.{f:02}' if ass else f'{h:02}:{m:02}:{s:02},{f:03}'
    srt=[]
    # Merge concurrent supporting captions for standards-compliant SRT cues.
    points=sorted(set(x for row in TL['captions'] for x in row[:2]))
    for a,b in zip(points,points[1:]):
        rows=[row for row in TL['captions'] if row[0]<=a and row[1]>=b]
        if not rows:continue
        srt.append(f'{len(srt)+1}\n{stamp(a)} --> {stamp(b)}\n'+'\n'.join(line for row in rows for line in row[2:])+'\n')
    (ROOT/'subtitles-zh-en.srt').write_text('\n'.join(srt),encoding='utf-8')
    ass='''[Script Info]
Title: Notchime bilingual launch PREVIEW
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: EN,Noto Sans CJK SC,46,&H00FAF2F0,&H00FFFFFF,&H0020120E,&H80000000,0,0,0,0,100,100,0,0,1,1,0,2,100,100,100,1
Style: ZH,Noto Sans CJK SC,31,&H00C6AEA6,&H00FFFFFF,&H0020120E,&H80000000,0,0,0,0,100,100,0,0,1,1,0,2,100,100,50,1
Style: Small,Noto Sans CJK SC,24,&H00C6AEA6,&H00FFFFFF,&H0020120E,&H80000000,0,0,0,0,100,100,0,0,1,1,0,2,90,90,220,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    for a,b,en,zh in TL['captions']:
        supporting=a in (39.0,55.4)
        for style,txt,y in [('EN',en,950),('ZH',zh,1005)]:
            if supporting:style='Small';y=814 if txt==en else 853
            ass+=f'Dialogue: {1 if supporting else 0},{stamp(a,True)},{stamp(b,True)},{style},,0,0,0,,{{\\pos(960,{y})\\fad(200,150)}}{txt}\n'
    (ROOT/'subtitles-zh-en.ass').write_text(ass,encoding='utf-8')

def soundtrack():
    sr=48000;n=sr*60;t=np.arange(n)/sr;y=np.zeros(n,dtype=np.float64)
    chords=[(146.83,220,277.18,329.63),(130.81,196,246.94,293.66),(164.81,246.94,293.66,369.99),(110,164.81,220,277.18)]
    for k in range(6):
        start=k*10;end=min(60,start+12);l=int(start*sr);r=int(end*sr);u=t[l:r]-start
        env=np.clip(u/2.5,0,1)*np.clip((end-start-u)/3,0,1)
        tone=sum(np.sin(2*np.pi*f*u+.08*np.sin(2*np.pi*.22*u))*.62+np.sin(2*np.pi*(f+.24)*u)*.23+np.sin(2*np.pi*2*f*u)*.06 for f in chords[k%4])
        y[l:r]+=.009*env*tone
    for j in range(0,78):
        start=.8+j*60/82;l=int(start*sr);r=min(n,l+sr*3)
        if l>=n:break
        u=np.arange(r-l)/sr;f=[440,554.37,659.25,830.61][j%4]
        env=(1-np.exp(-u*70))*np.exp(-u*2.8)
        y[l:r]+=.017*env*(np.sin(2*np.pi*f*u)+.18*np.sin(2*np.pi*f*2*u))
    for start in [7.5,12.0,27.85]:
        l=int(start*sr);u=np.arange(int(sr*.14))/sr
        y[l:l+len(u)]+=.045*np.sin(2*np.pi*1200*u)*np.exp(-u*55)*(1-np.exp(-u*700))
    y*=np.minimum(1,t/2)*np.clip((60-t)/3,0,1)
    stereo=np.stack([y,y*.98+np.roll(y,193)*.02],axis=1)
    with wave.open(str(A/'notchime-original-score.wav'),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(stereo,-1,1)*32767).astype('<i2').tobytes())

def run(args):subprocess.run([FFMPEG,'-hide_banner','-y',*map(str,args)],check=True)

def encode(name,duration,time_map,with_audio=True):
    path=OUT/name
    cmd=[FFMPEG,'-hide_banner','-y','-loglevel','warning','-f','rawvideo','-pixel_format','rgb24','-video_size','1920x1080','-framerate','30','-i','pipe:0']
    if with_audio:cmd+=['-i',str(A/'notchime-original-score.wav')]
    cmd+=['-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-profile:v','high','-level','4.1','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709']
    if with_audio:cmd+=['-c:a','aac','-ar','48000','-b:a','192k','-af','loudnorm=I=-22:TP=-2:LRA=7']
    cmd+=['-t',str(duration),'-movflags','+faststart','-metadata','title=Notchime — Bilingual Production Preview','-metadata','comment=PREVIEW. iPhone/sync are illustrations. Mac uses isolated fixture captures.',str(path)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    try:
        for f in range(round(duration*30)):
            proc.stdin.write(frame(time_map(f/30)).tobytes())
            if f%150==0:print(f'{name}: {f/30:.0f}/{duration}s',flush=True)
        proc.stdin.close()
        if proc.wait()!=0:raise RuntimeError('FFmpeg render failed')
    except BaseException:proc.kill();raise
    return path

def derivatives():
    source=OUT/'notchime-promo-1080p.mp4'
    # A readable 14-second excerpt: 6 seconds integration, 8 seconds completion.
    run(['-loglevel','warning','-i',source,'-filter_complex','[0:v]trim=start=19:end=25,setpts=PTS-STARTPTS[v1];[0:v]trim=start=26:end=34,setpts=PTS-STARTPTS[v2];[v1][v2]concat=n=2:v=1:a=0,fps=30[v];[0:a]atrim=start=19:end=25,asetpts=PTS-STARTPTS[a1];[0:a]atrim=start=26:end=34,asetpts=PTS-STARTPTS[a2];[a1][a2]concat=n=2:v=0:a=1[a]','-map','[v]','-map','[a]','-r','30','-fps_mode','cfr','-video_track_timescale','15360','-c:v','libx264','-profile:v','high','-level','4.1','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','192k','-movflags','+faststart',OUT/'notchime-demo-short.mp4'])
    # 8-second seamless README loop; no audio, economical 960x540 H.264.
    run(['-loglevel','warning','-ss','44','-t','8','-i',source,'-vf','scale=960:540:flags=lanczos','-an','-c:v','libx264','-crf','23','-preset','slow','-movflags','+faststart',OUT/'notchime-demo-loop.mp4'])
    run(['-loglevel','warning','-ss','44','-t','8','-i',source,'-filter_complex','fps=12,scale=640:360:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3','-an','-loop','0',OUT/'notchime-demo.gif'])

def contacts():
    stamps=[2.8,7.8,12.4,17.0,22.4,27.4,31.4,40.4,45.8,48.5,51.5,57.5]
    sheet=Image.new('RGB',(1440,1220),'#080C15')
    for k,t in enumerate(stamps):
        im=frame(t);im.save(OUT/f'frame-{t:04.1f}.jpg',quality=94)
        tile=im.resize((480,270),Image.Resampling.LANCZOS);sheet.paste(tile,((k%3)*480,(k//3)*305))
        text(sheet,f'{t:04.1f}s',((k%3)*480+20,(k//3)*305+278),15,MUTED)
    sheet.save(OUT/'contact-sheet.jpg',quality=95)
    frame(57.5).save(OUT/'notchime-poster.jpg',quality=96)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--stills',action='store_true');p.add_argument('--derivatives',action='store_true');args=p.parse_args()
    subtitle_files()
    if args.stills:contacts()
    elif args.derivatives:derivatives()
    else:
        soundtrack();contacts();encode('notchime-promo-1080p.mp4',60,lambda t:t);derivatives()
