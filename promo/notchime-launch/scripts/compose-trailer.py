#!/usr/bin/env python3
"""Music first: authored 150 BPM / 24-beat arrangement, then editorial grid."""
from pathlib import Path
import json, math, subprocess, sys, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1];M=ROOT/'music';M.mkdir(exist_ok=True)
sys.path.insert(0,str(ROOT/'tools'));import imageio_ffmpeg
SR=48000;DURATION=9.6;BPM=150;BEAT=.4
# Planned events precede both audio synthesis and video animation.
cuts=[(0,'hook','hook_bass'),(.4,'notch-mask-open','reveal_hit'),(1.2,'iphone-calendar','push_hit'),(2,'mac-calendar','match_cut_hit'),(2.8,'mac-reminders','reminder_hit'),(3.2,'complete-task','ui_click'),(3.6,'iphone-completed','bass_drop'),(4.2,'countdown','countdown_snap'),(5.4,'smart-collapse','collapse_hit'),(6,'smart-reveal','reveal_hit'),(6.8,'privacy','privacy_hit'),(8,'brand','logo_hit')]
events=[{'time':t,'beat':round(t/BEAT,2),'type':kind,'visual':name,'frame60':round(t*60),'major':True} for t,name,kind in cuts]
events += [{'time':t,'beat':round(t/BEAT,2),'type':kind,'visual':name,'frame60':round(t*60),'major':False} for t,name,kind in [(1.6,'calendar-chip','ui_tap'),(2.4,'calendar-match-accent','synth_stab'),(4.4,'countdown-number-flip','tick'),(4.8,'countdown-camera-settle','tick'),(5,'smart-riser','riser'),(5.6,'quiet-notch','sub_kick'),(6.4,'hover-protection','ui_tap'),(7.2,'server-phrase-emphasis','snap'),(7.6,'tracking-phrase-emphasis','snap'),(8.12,'sonic-logo-note-2','logo_note'),(8.28,'sonic-logo-note-3','logo_note')]]
events=sorted(events,key=lambda x:x['time'])
grid={'bpm':BPM,'timeSignature':'4/4','durationSeconds':DURATION,'sampleRate':SR,'videoFps':60,'beats':[{'index':i,'time':round(i*BEAT,4),'sample':round(i*BEAT*SR),'frame':round(i*BEAT*60),'bar':i//4+1,'inBar':i%4+1} for i in range(24)],'majorDownbeats':[0,1.6,3.2,4.8,6.4,8.0],'bassDrops':[0,3.6,6.8,8.0],'transitionHits':[x['time'] for x in events if x['major']],'uiClicks':[1.6,3.2,6.4],'finalLogoHit':8.0,'events':events,'sections':[{'from':0,'to':1.2,'energy':'immediate hook + short silence contrast'},{'from':1.2,'to':4.2,'energy':'syncopated bass + staccato synth + UI click'},{'from':4.2,'to':6.8,'energy':'double-time ticks + collapse/reveal contrast'},{'from':6.8,'to':8,'energy':'drums thin out, 3 deliberate snaps + rising pickup'},{'from':8,'to':9.6,'energy':'strongest logo hit + 3-note sonic signature + controlled tail'}],'copyright':'Original synthesis; no third-party audio samples'}
(M/'beat-map.json').write_text(json.dumps(grid,ensure_ascii=False,indent=2))
rng=np.random.default_rng(15024);mix=np.zeros((round(SR*DURATION),2),dtype=np.float64)
def add(start,signal,gain=1,pan=0):
    l=round(start*SR);r=min(len(mix),l+len(signal));sig=signal[:r-l]*gain
    mix[l:r,0]+=sig*math.sqrt((1-pan)/2);mix[l:r,1]+=sig*math.sqrt((1+pan)/2)
def kick(start,gain=1):
    u=np.arange(round(SR*.36))/SR;phase=2*np.pi*(47*u+108*.026*(1-np.exp(-u/.026)))
    body=np.sin(phase)*np.exp(-u*12);attack=rng.normal(0,1,len(u))*np.exp(-u*450)*.14
    add(start,np.tanh((body+attack)*1.45)*np.minimum(1,u*1400),gain)
def bass(start,f=73.416,gain=.45,dur=.32):
    u=np.arange(round(SR*dur))/SR
    sig=sum(np.sin(2*np.pi*f*k*u)/k for k in [1,2,3,4]);env=np.minimum(1,u*450)*np.exp(-u*7)*np.clip((dur-u)/.04,0,1)
    add(start,np.tanh(sig*1.1)*env,gain)
def synth(start,f=293.665,gain=.13,dur=.20,pan=0):
    u=np.arange(round(SR*dur))/SR;env=(1-np.exp(-u*900))*np.exp(-u*15)*np.clip((dur-u)/.025,0,1)
    sig=np.sin(2*np.pi*f*u)+.32*np.sin(2*np.pi*f*2*u)+.15*np.sin(2*np.pi*(f+.9)*u)
    add(start,sig*env,gain,pan);add(start+.09,sig*env,gain*.16,-pan)
def snap(start,gain=.16):
    u=np.arange(round(SR*.11))/SR;n=rng.normal(0,1,len(u));n=n-np.roll(n,1)
    add(start,np.tanh(n*.7)*np.exp(-u*55)*(1-np.exp(-u*1600)),gain)
def click(start):
    u=np.arange(round(SR*.08))/SR
    add(start,(np.sin(2*np.pi*1850*u)+.3*np.sin(2*np.pi*2850*u))*np.exp(-u*90)*(1-np.exp(-u*1500)),.30)
def whoosh(end,dur=.19,gain=.1):
    u=np.arange(round(SR*dur))/SR;n=rng.normal(0,1,len(u));n=np.convolve(n,np.ones(7)/7,mode='same')
    add(max(0,end-dur),n*np.sin(np.pi*u/dur)**2,gain,-.2)

# Authored kick/bass pattern, including deliberate gaps and off-beat accents.
for t,g in [(0,.95),(.8,.55),(1.2,.72),(1.6,.50),(2,.77),(2.6,.36),(2.8,.72),(3.6,.9),(4.2,.82),(4.8,.5),(5.4,.72),(6,.8),(6.8,.67),(8,1.08)]:kick(t,g)
for t,f,g in [(0,73.416,.55),(1.2,73.416,.38),(1.8,110,.25),(2,87.307,.42),(2.8,73.416,.4),(3.6,65.406,.65),(4.2,73.416,.48),(5.4,110,.38),(6,73.416,.44),(6.8,65.406,.36),(8,73.416,.70)]:bass(t,f,g)
for j,t in enumerate([.4,.8,1.4,1.8,2.2,2.4,2.8,3.0,3.8,4.2,4.4,4.6,4.8,5.2,5.6,6,6.4]):synth(t,[293.665,440,349.228,523.251][j%4],.13 if j%3 else .18,pan=.2*(-1)**j)
for t in [1.6,3.2,6.4]:click(t)
for t in [1.2,2,2.8,3.6,4.2,5.4,6,6.8,8]:whoosh(t)
for t in [4.2,4.4,4.8,5.4,7.2,7.6]:snap(t)
# Light syncopated hats, build then open up before the logo.
for j,t in enumerate(np.arange(1.2,6.8,.2)):
    if j%7==3:continue
    u=np.arange(round(SR*.035))/SR;n=rng.normal(0,1,len(u));n-=np.roll(n,1)
    add(float(t),n*np.exp(-u*180),.018 if j%2 else .029,.35*(-1)**j)
for end,dur in [(4.2,.34),(5.4,.35),(8,.4)]:
    u=np.arange(round(SR*dur))/SR;env=(u/dur)**2
    sig=np.sin(2*np.pi*(320*u+1100*u*u/(2*dur)))+.4*rng.normal(0,1,len(u))
    add(end-dur,sig*env,.09)
# Memorable three-note sonic mark, locked to the final visual impact.
for t,f,g in [(8,587.33,.32),(8.12,880,.22),(8.28,698.46,.27)]:
    u=np.arange(round(SR*1.1))/SR
    sig=(np.sin(2*np.pi*f*u)+.32*np.sin(2*np.pi*f*2.01*u))*(1-np.exp(-u*1200))*np.exp(-u*4)
    add(t,sig,g);add(t+.14,sig,g*.22,.45)
mix=np.tanh(mix*.95);mix*=np.minimum(1,np.arange(len(mix))[:,None]/(SR*.002))
mix*=np.clip((DURATION-np.arange(len(mix))/SR)/.20,0,1)[:,None]
mix*=.82/max(np.max(np.abs(mix)),1e-12)
raw=M/'premaster.wav'
with wave.open(str(raw),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
ff=imageio_ffmpeg.get_ffmpeg_exe()
# Two-pass EBU loudness normalization; AAC true peak will be checked separately.
analysis=subprocess.run([ff,'-hide_banner','-i',str(raw),'-af','loudnorm=I=-14:TP=-1.8:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
stats=json.loads(analysis[analysis.rfind('{'):analysis.rfind('}')+1]);(M/'mastering-analysis.json').write_text(json.dumps(stats,indent=2))
filt=f"loudnorm=I=-14:TP=-1.8:LRA=7:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
subprocess.run([ff,'-v','error','-y','-i',str(raw),'-af',filt,'-ar','48000','-c:a','pcm_s24le',str(M/'original-soundtrack.wav')],check=True)
print('Music composed first: 150 BPM, 24 beats, 9.6 s, 48 kHz, -14 LUFS target; beat-map.json written.')
