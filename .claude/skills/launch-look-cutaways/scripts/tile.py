"""Tile crops of several frames into one labelled contact sheet.

Usage: python3 -I tile.py <out.jpg> <cols> <x,y,w,h> <scale> <frame.png:label> ...
"""
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, crop, scale = sys.argv[1], int(sys.argv[2]), [int(v) for v in sys.argv[3].split(',')], float(sys.argv[4])
items = [a.rsplit(':', 1) for a in sys.argv[5:]]
x, y, w, h = crop
tw, th = int(w * scale), int(h * scale)
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), 'black')
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 28)
except Exception:
    font = ImageFont.load_default()
for k, (f, label) in enumerate(items):
    im = Image.open(f).convert('RGB').crop((x, y, x + w, y + h)).resize((tw, th), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 110, 36), fill='black')
    d.text((6, 3), label, fill='yellow', font=font)
    sheet.paste(im, ((k % cols) * tw, (k // cols) * th))
sheet.save(out, quality=88)
print(out, sheet.size)
