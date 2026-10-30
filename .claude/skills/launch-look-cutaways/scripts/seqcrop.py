"""Tile cropped frames from a clip at video times t1..t2 (step 1/fps); offset = the clip's start in video seconds.

Usage: python3 -I seqcrop.py <clip.mp4> <offset> <out.jpg> <cols> <x,y,w,h> <scale> <t1> <t2> <fps>
"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFont
clip, offset, out, cols = sys.argv[1], float(sys.argv[2]), sys.argv[3], int(sys.argv[4])
x, y, w, h = [int(v) for v in sys.argv[5].split(',')]
scale, t1, t2, fps = float(sys.argv[6]), float(sys.argv[7]), float(sys.argv[8]), float(sys.argv[9])
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
ts = [t1 + i / fps for i in range(int(round((t2 - t1) * fps)) + 1)]
tmp = tempfile.mkdtemp(); tiles = []
for k, t in enumerate(ts):
    f = os.path.join(tmp, f'{k}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t - offset:.4f}', '-i', clip, '-frames:v', '1', f], check=True)
    im = Image.open(f).convert('RGB').crop((x, y, x + w, y + h)).resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 84, 28), fill='black'); d.text((5, 2), f'{t:.2f}', fill='yellow', font=font)
    tiles.append(im)
tw, th = tiles[0].size; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th))
for k, im in enumerate(tiles): sheet.paste(im, ((k % cols) * tw, (k // cols) * th))
sheet.save(out, quality=88); print(out, sheet.size, len(tiles))
