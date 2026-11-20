"""Swiss Grid (Blip Vibe look 'swiss-grid'): images/skins/blip/kit/swiss-grid/*.png -> assets/swiss-grid/*.webp.
usage: swiss_grid_convert.py   (run from the repo root, after swiss_grid_geom.py + the Codex-painted parts)
Prints the part names to paste into the variant's `art` list in js/fullskins.js."""
import os, glob
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit/swiss-grid'; O = 'images/skins/blip/assets/swiss-grid'; os.makedirs(O, exist_ok=True)
def mask(w, h, name, r=0, ellipse=False):
    m = Image.new('L', (w * 4, h * 4), 0); d = ImageDraw.Draw(m)
    (d.ellipse if ellipse else (lambda b, fill: d.rounded_rectangle(b, r * 4, fill=fill)))((0, 0, w * 4 - 1, h * 4 - 1), fill=255)
    o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); o.save(f'{O}/{name}.webp', 'WEBP', lossless=True)
mask(1290, 560, 'cover-mask'); mask(300, 300, 'photo-mask'); mask(600, 600, 'skin-card-mask')   # Swiss: sharp corners
# avatar mask = the avatar frame's round window (frame ring is 8px of 640)
m = Image.new('L', (1280, 1280), 0); ImageDraw.Draw(m).ellipse((16, 16, 1263, 1263), fill=255)
o = Image.new('RGBA', (640, 640), (0, 0, 0, 0)); o.putalpha(m.resize((640, 640), Image.LANCZOS)); o.save(f'{O}/avatar-mask.webp', 'WEBP', lossless=True)
names = ['cover-mask', 'photo-mask', 'skin-card-mask', 'avatar-mask']
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name in ('card', 'menu-panel-body'): continue
    im = Image.open(f).convert('RGBA'); dst = f'{O}/{name}.webp'
    if name == 'background': im.convert('RGB').save(dst, 'WEBP', quality=86, method=6)
    elif max(im.size) <= 1000: im.save(dst, 'WEBP', lossless=True, method=6)
    else: im.save(dst, 'WEBP', quality=90, method=6)
    names.append(name)
print("art: " + repr(sorted(set(names))))
