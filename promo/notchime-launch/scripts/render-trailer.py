#!/usr/bin/env python3
"""New 9.6-second music-led film. Reuses native UI assets, never the old film.
Wireframe iPhone / floating elements are clearly conceptual, not fake iOS footage.
"""
from pathlib import Path
import argparse,bisect,functools,json,math,subprocess,sys
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'assets';OUT=ROOT/'output'
sys.path.insert(0,str(ROOT/'tools'));import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();W,H,FPS,D=1920,1080,60,9.6
TL=json.loads((ROOT/'src/trailer-timeline.json').read_text());BEATS=json.loads((ROOT/'music/beat-map.json').read_text())
assert BEATS['durationSeconds']==D and BEATS['bpm']==150
E=json.loads((A/'trailer-captures/capture-evidence.json').read_text())
CUTS=TL['cuts'];STARTS=[x['start'] for x in CUTS]
WHITE='#F3F5FF';MUTED='#B1BAD1';BLUE='#91B5FF';PURPLE='#B395FF';GREEN='#6FE3BE'

@functools.lru_cache(maxsize=128)
def font(s,medium=False):return ImageFont.truetype(str(A/'fonts'/('NotoSansCJKsc-Medium.otf' if medium else 'NotoSansCJKsc-Regular.otf')),round(s))
def txt(im,s,x,y,size=42,color=WHITE,align='center',medium=False):
    d=ImageDraw.Draw(im);f=font(size,medium)
    width=d.textlength(s,font=f)
    if align=='center':x-=width/2
    elif align=='right':x-=width
    d.text((round(x),round(y)),s,font=f,fill=color,anchor='lt')
def rr(im,box,r,fill=None,outline=None,width=1):ImageDraw.Draw(im).rounded_rectangle(tuple(round(x) for x in box),r,fill,outline,width)
def ln(im,points,color,width=2):ImageDraw.Draw(im).line(points,fill=color,width=width,joint='curve')
def clamp(x):return max(0,min(1,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
def expo(x):return 1-(1-clamp(x))**4
def spring(x):x=clamp(x);return 1+math.sin(x*math.pi)*.075-(1-x)**3
def paste(im,layer,x,y,scale=1,alpha=1):
    if scale!=1:layer=layer.resize((max(1,round(layer.width*scale)),max(1,round(layer.height*scale))),Image.Resampling.LANCZOS)
    if alpha<1:layer=layer.copy();layer.putalpha(layer.getchannel('A').point(lambda a:round(a*alpha)))
    im.alpha_composite(layer,(round(x),round(y)))
def center(im,layer,x,y,scale=1,alpha=1):paste(im,layer,x-layer.width*scale/2,y-layer.height*scale/2,scale,alpha)

@functools.lru_cache(maxsize=8)
def background(kind=0):
    y,x=np.mgrid[0:H,0:W];x=x/W;y=y/H
    a=np.exp(-(((x-.48)/.45)**2+((y-.44)/.37)**2)*3)
    b=np.exp(-(((x-.82)/.22)**2+((y-.6)/.4)**2)*2)
    arr=np.stack([3+a*7+b*8,5+a*13+b*4,10+a*28+b*15],axis=-1)
    if kind==1:arr*=.55
    arr+=np.random.default_rng(94).uniform(-.4,.4,(H,W,1))
    return Image.fromarray(arr.clip(0,255).astype(np.uint8),'RGB').convert('RGBA')
BG=background()
@functools.lru_cache(maxsize=160)
def cap(name):return Image.open(A/'trailer-captures'/name).convert('RGBA')
def recorded(clip,t):
    frames=E['clips'][clip]['frames'];i=max(0,bisect.bisect_right([x['at'] for x in frames],t)-1)
    return cap(clip+'/'+frames[i]['file'])
def ui_crop(name,box):return cap(name).crop(box)

def glow_outline(im,box,r,color=BLUE,width=2,gain=.3):
    l=Image.new('RGBA',im.size);rr(l,box,r,None,color,width)
    paste(im,l.filter(ImageFilter.GaussianBlur(12)),0,0,alpha=gain);paste(im,l,0,0)

@functools.lru_cache(maxsize=4)
def screen_shell():
    im=Image.new('RGBA',(1560,826));
    rr(im,(26,20,1534,791),35,'#0B0E17','#6D778F',2)
    rr(im,(34,28,1526,783),28,'#090D19','#303C5B',2)
    # Restrained original wallpaper: broad lines, no particle or flash effects.
    d=ImageDraw.Draw(im)
    for k,c in [(0,'#182A55'),(1,'#162343'),(2,'#101B35')]:
        d.polygon([(34,500+k*70),(740,28),(1526,28),(650,783),(34,783)],fill=c)
    rr(im,(674,28,886,68),13,'#020309');rr(im,(674,28,886,45),0,'#020309')
    ln(im,[(10,794),(1550,794)],'#8E97AA',3)
    d.polygon([(26,793),(1534,793),(1550,804),(1530,813),(30,813),(10,804)],fill='#333E51')
    return im

def mac(panel=None):
    im=screen_shell().copy()
    if panel is not None:
        scale=(1320/panel.width if panel.width>1000 else 212/panel.width)
        center(im,panel,780,28+panel.height*scale/2,scale)
    return im

def plane(im,asset,x,y,width,yaw=0,roll=0,pitch=0,alpha=1):
    # True perspective projection gives device motion a shared spatial continuity.
    height=width*asset.height/asset.width
    v=np.array([[-width/2,-height/2,0],[width/2,-height/2,0],[width/2,height/2,0],[-width/2,height/2,0]],dtype=np.float64)
    ay,az,ax=map(math.radians,(yaw,roll,pitch))
    ry=np.array([[math.cos(ay),0,math.sin(ay)],[0,1,0],[-math.sin(ay),0,math.cos(ay)]])
    rx=np.array([[1,0,0],[0,math.cos(ax),-math.sin(ax)],[0,math.sin(ax),math.cos(ax)]])
    rz=np.array([[math.cos(az),-math.sin(az),0],[math.sin(az),math.cos(az),0],[0,0,1]])
    v=v@ry.T@rx.T@rz.T;factor=2300/(2300+v[:,2]);dest=np.float32(np.column_stack((v[:,0]*factor+x,v[:,1]*factor+y)))
    src=np.float32([[0,0],[asset.width,0],[asset.width,asset.height],[0,asset.height]])
    matrix=cv2.getPerspectiveTransform(src,dest)
    warped=cv2.warpPerspective(np.asarray(asset),matrix,(W,H),flags=cv2.INTER_LINEAR)
    layer=Image.fromarray(warped,'RGBA');paste(im,layer,0,0,alpha=alpha)

@functools.lru_cache(maxsize=8)
def phone_wire(mode='calendar',done=False):
    # No iOS toolbar, status bar, native app screenshot or pretend touch recording.
    # A transparent device outline carries symbolic floating calendar/reminder art.
    S=2;im=Image.new('RGBA',(500*S,840*S));d=ImageDraw.Draw(im)
    def r(box,rad,fill=None,outline=None,width=1):rr(im,[v*S for v in box],rad*S,fill,outline,width*S)
    r((40,10,460,829),58,'#090E1A','#7886A4',2)
    r((49,19,451,820),50,None,'#2B3B5B',1)
    r((198,34,302,46),6,None,'#7182A6',1)
    r((106,112,394,340),28,'#101A31',BLUE,2)
    if mode=='calendar':
        r((106,112,394,167),20,'#22395F')
        ln(im,[(141*S,90*S),(141*S,135*S)],BLUE,5*S);ln(im,[(359*S,90*S),(359*S,135*S)],BLUE,5*S)
        txt(im,'11',250*S,195*S,100*S,WHITE,medium=True)
        txt(im,'Apple Calendar',250*S,369*S,25*S,WHITE)
        txt(im,'Design review',250*S,477*S,32*S,WHITE,medium=True)
        txt(im,'设计评审',250*S,526*S,27*S,MUTED)
        txt(im,'14:00 — 15:00',250*S,587*S,24*S,BLUE)
    else:
        for row in range(3):
            cy=(171+53*row)*S
            d.ellipse((143*S,cy-10*S,163*S,cy+10*S),outline=GREEN if done else BLUE,width=2*S,fill=GREEN if done else None)
            ln(im,[(190*S,cy),(345*S,cy)],'#7E91B8',3*S)
        if done:ln(im,[(146*S,171*S),(151*S,176*S),(160*S,164*S)],'#112A23',2*S)
        txt(im,'Apple Reminders',250*S,369*S,25*S,WHITE)
        txt(im,'Send brief',250*S,477*S,34*S,GREEN if done else WHITE,medium=True)
        txt(im,'发送简报',250*S,533*S,28*S,MUTED)
        if done:
            d.ellipse((209*S,617*S,291*S,699*S),fill='#18372F',outline=GREEN,width=2*S)
            ln(im,[(229*S,656*S),(245*S,672*S),(273*S,639*S)],GREEN,5*S)
    return im

def caption(im,i,t):
    row=CUTS[i]
    if i==8:return
    # Fast movement belongs to imagery; text remains sharp and stable.
    if i==1:
        txt(im,row['en'],195,802,66,WHITE,'left',True);txt(im,row['zh'],198,885,40,MUTED,'left')
    else:
        txt(im,row['en'],960,866,62 if i!=7 else 57,WHITE,medium=True)
        txt(im,row['zh'],960,943,39,MUTED)

def pointer(im,x,y,click=False):
    d=ImageDraw.Draw(im);d.polygon([(x,y),(x+13,y+43),(x+23,y+29),(x+36,y+29)],fill=WHITE,outline='#060A13',width=2)
    if click:d.ellipse((x-22,y-22,x+22,y+22),outline=GREEN,width=3)

def clipped_panel(im,panel,box,r=22):
    x,y,w,h=box;panel=panel.resize((round(w),round(h)),Image.Resampling.LANCZOS)
    mask=Image.new('L',panel.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,panel.width-1,panel.height-1),r,fill=255)
    panel.putalpha(Image.fromarray(np.minimum(np.asarray(panel.getchannel('A')),np.asarray(mask)).astype(np.uint8)))
    paste(im,panel,x,y)

def drawscene(i,t):
    im=BG.copy();u=t-CUTS[i]['start'];dur=CUTS[i]['end']-CUTS[i]['start']
    if i==0:
        # Immediate edge-light hook; outline visible on frame zero, not a black lead-in.
        z=1.08-.08*expo(u/.34)
        device=mac();center(im,device,960,441,1.12*z)
        if u<.4:
            glow_outline(im,(825,55,1095,112),16,BLUE,3,.65)
            # Edge light travels along the notch on the first kick.
            q=expo(u/.3);ln(im,[(825+210*q,112),(870+210*q,112)],'#C3D9FF',4)
        else:
            p=expo((u-.4)/.24);w=230+(1460-230)*p;h=46+(687-46)*p
            panel=cap('mac-before.png').resize((1460,725),Image.Resampling.LANCZOS)
            matte=Image.new('L',panel.size);ImageDraw.Draw(matte).rounded_rectangle(((1460-w)/2,0,(1460+w)/2,h),18,fill=255)
            panel.putalpha(matte);paste(im,panel,230,52)
        caption(im,i,t)
    elif i==1:
        p=expo(u/.24);plane(im,phone_wire(),1260+640*(1-p),443,480,24-16*p,roll=-7+5*p)
        txt(im,'Apple Calendar',225,197,25,BLUE,'left',True)
        # Shared workflow trajectory is a system-account motif, not a cloud node.
        ln(im,[(225,308),(535,308)],'#334869',2)
        txt(im,'iPhone',225,349,94,WHITE,'left',True)
        txt(im,'Apple system sync',228,496,30,MUTED,'left')
        txt(im,'Apple 系统同步',228,544,28,MUTED,'left')
        if u>=.4:
            p=expo((u-.4)/.14);ln(im,[(225,659),(225+330*p,659)],BLUE,4)
        caption(im,i,t)
    elif i==2:
        # Match the same event in concept art to an actual native Renderer crop.
        p=expo(u/.20);plane(im,phone_wire(),105-270*p,427,275,35,roll=-6,alpha=1-.45*p)
        plane(im,mac(cap('mac-before.png')),1120-160*p,404,1250+80*p,-16+12*p,pitch=2)
        event=ui_crop('mac-before.png',(78,589,1240,720))
        # Floating magnification of the actual event row; no reconstructed product UI.
        sc=1.03+.14*expo(u/.35)
        center(im,event,1020,477,sc)
        txt(im,'Apple Calendar',960,738,28,BLUE)
        caption(im,i,t)
    elif i==3:
        # Real completion frames retimed around an exact 3.2s audio click.
        source_t=(u/.4)*.83 if u<.4 else 1.15+(u-.4)*3.05
        shot=recorded('complete',min(2.35,source_t))
        crop=shot.crop((62,755,1272,1042))
        # Rapid push, short ease, then acceleration out: not static screenshot dwell.
        sc=1.04+.15*expo(u/.19)-.025*smooth((u-.45)/.35)
        center(im,crop,960,459,sc)
        txt(im,'Apple Reminders',960,200,30,BLUE,medium=True)
        target=E['completionTarget'];px=960+(target['x']*2-62-crop.width/2)*sc;py=459+(target['y']*2-755-crop.height/2)*sc
        if u<=.47:
            q=expo(u/.36);pointer(im,px+110*(1-q),py+80*(1-q),u>=.4)
        else:
            rr(im,(910,650,1010,750),50,'#113228',GREEN,2)
            ln(im,[(931,699),(952,721),(988,678)],GREEN,6)
        caption(im,i,t)
    elif i==4:
        p=expo(u/.19)
        plane(im,phone_wire('reminders',True),960+520*(1-p),427,455,-22+16*p,roll=4-3*p)
        caption(im,i,t)
    elif i==5:
        # Actual local milestone; days don't count down fictitiously in one second.
        card=ui_crop('mac-before.png',(48,198,628,475))
        q=expo(u/.20);scale=1.55+.31*q-.14*smooth((u-.65)/.5)
        plane(im,card,960,477,card.width*scale,yaw=13*(1-q),roll=-2*(1-q))
        # A numeric outline moves behind the real card as an editorial motif.
        txt(im,'COUNTDOWN',960,183,29,BLUE,medium=True)
        if .2<=u<.5:
            x=185+1530*expo((u-.2)/.3);ln(im,[(x,305),(x,672)],'#829FED',2)
        elif .6<=u<.95:
            x=1715-1530*expo((u-.6)/.35);ln(im,[(x,305),(x,672)],'#526EAD',2)
        caption(im,i,t)
    elif i==6:
        # Source-native closing/opening silhouettes, editorial retiming only.
        if u<.26:source_t=7.20+u/.26*.50
        elif u<.6:source_t=7.75
        else:source_t=.62+(u-.6)/.22*.74
        source_t=min(source_t,1.62) if u>=.6 else source_t
        shot=recorded('smart-notch',source_t)
        z=.90+.03*expo(max(0,u-.6)/.20)
        center(im,mac(shot),960,445,z)
        if .27<u<.6:ln(im,[(852,83),(1068,83)],BLUE,2)
        caption(im,i,t)
    elif i==7:
        im=background(1).copy();d=ImageDraw.Draw(im)
        # Match notch center to lock; all three privacy phrases remain simultaneously readable.
        p=expo(u/.18);d.arc((891,144,1029,299),180,360,fill=BLUE,width=6)
        rr(im,(866,224,1054,395),32,'#0D1830',BLUE,3)
        d.ellipse((948,282,972,306),fill=BLUE);rr(im,(957,300,963,337),3,BLUE)
        txt(im,'Local-first. Privacy-first.',960,459,65,WHITE,medium=True)
        txt(im,'本地优先，隐私优先。',960,542,42,MUTED)
        for k,(en,zh) in enumerate(TL['privacy']):
            active=int(u/.4)==k;cx=350+k*610
            color=WHITE if active else '#C1CAE0'
            txt(im,en,cx,688,34,color,medium=True);txt(im,zh,cx,743,29,MUTED)
            ln(im,[(cx-180,812),(cx+180,812)],BLUE if active else '#273C5F',3 if active else 1)
    else:
        # Largest sonic impact and smallest visual clutter. Approved project image,
        # without claiming that redistribution rights have already been cleared.
        im=background(1).copy();q=spring(u/.28);size=274*(1+.16*(1-q))
        icon=Image.open(A/'notchime-trailer-icon.png').convert('RGBA')
        # Retain provided artwork, remove only its black rectangular surround by matte.
        rgb=np.asarray(icon)[:,:,:3];alpha=np.clip((rgb.max(axis=2).astype(float)-5)/17,0,1)*255
        icon.putalpha(Image.fromarray(alpha.astype(np.uint8)))
        icon=icon.crop((54,54,icon.width-54,icon.height-54))
        center(im,icon,960,279,size/icon.width)
        txt(im,'Notchime',960,471,112,WHITE,medium=True)
        txt(im,"There When You Need It. Quiet When You Don't.",960,659,45,WHITE,medium=True)
        txt(im,'需要时出现，无需时静默。',960,737,38,MUTED)
        # Impact underline settles by 8.4; final 1.2 seconds are a clean brand hold.
        length=300+480*expo(u/.27);ln(im,[(960-length/2,862),(960+length/2,862)],'#516999',2)
    return im

def frame(t):
    i=min(len(CUTS)-1,bisect.bisect_right(STARTS,t)-1);im=drawscene(i,t)
    # Spatial push at three chosen hits; other cuts use geometric matches/masks.
    if i in (1,2,4):
        u=t-CUTS[i]['start'];dur=.13
        if u<dur:
            q=expo(u/dur);old=drawscene(i-1,CUTS[i]['start']-1/FPS)
            canvas=BG.copy();direction=1 if i!=2 else -1
            paste(canvas,old,-W*q*direction,0);paste(canvas,im,W*(1-q)*direction,0);im=canvas
    return im.convert('RGB')

def subtitles():
    def stamp(t):n=round(t*1000);return f'00:00:{n//1000:02},{n%1000:03}'
    rows=[]
    for i,r in enumerate(CUTS):
        if i==4:continue
        end=4.2 if i==3 else r['end'];en=r['en'];zh=r['zh']
        if i==7:
            en+='\n'+' · '.join(p[0].rstrip('.') for p in TL['privacy']);zh+='\n'+' · '.join(p[1].rstrip('。') for p in TL['privacy'])
        rows.append(f'{len(rows)+1}\n{stamp(r["start"])} --> {stamp(end)}\n{en}\n{zh}\n')
    (ROOT/'subtitles-trailer-zh-en.srt').write_text('\n'.join(rows),encoding='utf-8')

def stills():
    stamps=[.18,.82,1.7,2.4,3.12,3.32,3.89,4.75,5.78,6.32,7.35,9.0]
    sheet=Image.new('RGB',(1440,1240),'#050811')
    for k,t in enumerate(stamps):
        f=frame(t);f.save(OUT/f'trailer-frame-{t:04.2f}.png')
        sheet.paste(f.resize((480,270),Image.Resampling.LANCZOS),((k%3)*480,(k//3)*310))
        txt(sheet,f'{t:.2f}s',(k%3)*480+15,(k//3)*310+280,16,MUTED,'left')
    sheet.save(OUT/'trailer-contact-sheet.jpg',quality=95)
    frame(9).save(OUT/'notchime-trailer-poster.png')

def render():
    cmd=[FF,'-hide_banner','-y','-loglevel','warning','-f','rawvideo','-pixel_format','rgb24','-video_size','1920x1080','-framerate','60','-i','pipe:0','-i',str(ROOT/'music/original-soundtrack.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','17','-profile:v','high','-level','4.2','-pix_fmt','yuv420p','-r','60','-fps_mode','cfr','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-ar','48000','-b:a','256k','-t','9.6','-movflags','+faststart','-metadata','title=Notchime — There When You Need It.','-metadata','comment=Original 150 BPM product trailer. Artwork and footage provenance are documented separately.',str(OUT/'notchime-trailer-10s.mp4')]
    process=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    trace=[]
    try:
        for n in range(576):
            t=n/FPS;process.stdin.write(frame(t).tobytes());scene_index=min(8,bisect.bisect_right(STARTS,t)-1)
            trace.append({'frame':n,'time':round(t,6),'scene':CUTS[scene_index]['scene']})
            if n%60==0:print(f'Trailer: {t:.0f}/9.6s',flush=True)
        process.stdin.close();assert process.wait()==0
    except BaseException:process.kill();raise
    (OUT/'trailer-frame-trace.json').write_text(json.dumps(trace,indent=2))
    src=OUT/'notchime-trailer-10s.mp4'
    subprocess.run([FF,'-v','error','-y','-i',str(src),'-an','-c:v','copy','-movflags','+faststart',str(OUT/'notchime-trailer-10s-muted.mp4')],check=True)
    # Same 9.6-second authored rhythm, optimized for README autoplay/loop, no audio.
    # A deliberate brand-to-notch restart, not a reversed reminder completion.
    subprocess.run([FF,'-v','error','-y','-i',str(src),'-vf','fps=30,scale=960:540:flags=lanczos','-an','-c:v','libx264','-preset','slow','-crf','21','-pix_fmt','yuv420p','-r','30','-fps_mode','cfr','-t','9.6','-movflags','+faststart',str(OUT/'notchime-trailer-10s-loop.mp4')],check=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--stills',action='store_true');args=p.parse_args();subtitles();stills()
    if not args.stills:render()
