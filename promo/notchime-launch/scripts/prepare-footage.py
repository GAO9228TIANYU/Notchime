#!/usr/bin/env python3
"""Normalize user-supplied real footage for subsequent reviewed editorial replacement."""
from pathlib import Path
import json, subprocess, sys
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'tools'))
import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe();manifest=[]
for source in sorted((root/'assets/incoming').glob('*')):
    if source.suffix.lower() not in ('.mov','.mp4','.m4v'):continue
    target=root/'assets/processed'/source.stem;target.mkdir(parents=True,exist_ok=True)
    # Preserve all frames at output timebase; no speedup, no fake synchronization.
    subprocess.run([ff,'-hide_banner','-y','-i',str(source),'-vf','fps=30,scale=1920:1920:force_original_aspect_ratio=decrease','-an',str(target/'%06d.png')],check=True)
    manifest.append({'input':str(source.relative_to(root)),'frames':str(target.relative_to(root)),'fps':30,'count':len(list(target.glob('*.png'))),'reviewed':False,'syncVerified':False})
out=root/'assets/processed';out.mkdir(exist_ok=True);(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(f'Prepared {len(manifest)} recordings. Editorial replacement and human verification remain required.')
