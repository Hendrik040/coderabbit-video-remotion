"""Extract each Cutroom note's frame from a render and draw the note's strokes on it, so the note can be read
with what he drew.

Usage: python3 -I note_frames.py <data/feedback.json> <asset id> <render.mp4> <existing out dir>
Writes note-<time>.png per comment, replies included (they share their parent's time).
"""
import json, subprocess, sys
from PIL import Image, ImageDraw
feedback, asset, video, out = sys.argv[1:5]
data = json.load(open(feedback))
comments = [c for p in data['projects'] for a in p['assets'] if a['id'] == asset for c in a['comments']]
for c in sorted(comments, key=lambda c: c['time']):
    path = f"{out}/note-{c['time']:07.2f}.png"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{c['time']:.3f}", '-i', video, '-frames:v', '1', path], check=True)
    im = Image.open(path).convert('RGB'); d = ImageDraw.Draw(im); W, H = im.size
    for s in c.get('drawings') or []:
        pts = [(p['x'] * W, p['y'] * H) for p in s.get('points', [])]
        if len(pts) > 1: d.line(pts, fill=(255, 230, 0), width=6)
    im.save(path)
    print(path)
