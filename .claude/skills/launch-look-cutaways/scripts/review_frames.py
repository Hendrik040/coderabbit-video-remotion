"""Extract review sheets from a render: 1 s contact sheets over the whole film, plus 8 fps sequences.

Usage: python3 -I review_frames.py <video.mp4> <out_dir> name:start:end[:fps] ...
"""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

video, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30)

def grab(times, w=640):
    tmp = tempfile.mkdtemp()
    frames = []
    for k, t in enumerate(times):
        f = os.path.join(tmp, f'{k}.jpg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1', '-vf', f'scale={w}:-1', '-q:v', '3', f], check=True)
        im = Image.open(f).convert('RGB')
        d = ImageDraw.Draw(im); d.rectangle((0, 0, 118, 38), fill='black'); d.text((6, 3), f'{t:.2f}', fill='yellow', font=font)
        frames.append(im)
    return frames

def sheet(frames, cols, path):
    w, h = frames[0].size
    rows = (len(frames) + cols - 1) // cols
    s = Image.new('RGB', (cols * w, rows * h))
    for k, im in enumerate(frames): s.paste(im, ((k % cols) * w, (k // cols) * h))
    s.save(path, quality=85)

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
times = [t + 0.5 for t in range(int(dur))]
for k in range(0, len(times), 12):
    sheet(grab(times[k:k + 12], 480), 4, os.path.join(out, f'sheet-{k // 12:02}.jpg'))
for spec in sys.argv[3:]:
    name, a, b, *fps = spec.split(':')
    a, b, step = float(a), float(b), 1 / float(fps[0] if fps else 8)
    ts = [a + i * step for i in range(int((b - a) / step) + 1)]
    for k in range(0, len(ts), 12):
        sheet(grab(ts[k:k + 12], 640), 4, os.path.join(out, f'seq-{name}-{k // 12}.jpg'))
print('done', out)
