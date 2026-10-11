#!/usr/bin/env python3
from pathlib import Path
import json, sys
root=Path(__file__).resolve().parents[1]
required=json.loads((root/'src/timeline.json').read_text())['required_release_assets']
missing=[x for x in required if not (root/x).is_file()]
print(json.dumps({'status':'PREVIEW','missing':missing,'humanReviewRequired':['iCloud forward and return sync','private-data inspection','official logo approval','product identity','final privacy scope'],'releaseApproved':False},ensure_ascii=False,indent=2))
sys.exit(1 if missing else 2)
