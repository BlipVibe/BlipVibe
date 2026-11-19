"""Logo Classic (blip, the default look): images/skins/blip/kit/*.png -> assets/*.webp.
usage: blip_convert.py            (run from the repo root)
- writes the geometric masks first (white = window -> opaque alpha, as CSS mask-image needs);
- icons / small pieces lossless; frames with a window print it as percentages (l t r b)."""
import os, glob
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit'; O = 'images/skins/blip/assets'; os.makedirs(O, exist_ok=True)
def rr_mask(w, h, r, name):
    m = Image.new('L', (w * 4, h * 4), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), r * 4, fill=255)
    a = m.resize((w, h), Image.LANCZOS); o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(a)
    o.save(f'{O}/{name}.webp', 'WEBP', lossless=True)
rr_mask(1290, 560, 40, 'cover-mask'); rr_mask(300, 300, 30, 'photo-mask'); rr_mask(600, 600, 48, 'skin-card-mask')
WINDOWED = ['avatar-frame', 'avatar-ring', 'group-avatar-frame', 'story-ring', 'story-ring-seen', 'swatch-ring']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'mascot', 'sparkle', 'menu-check', 'badge', 'coin', 'story-', 'camera')
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name.endswith('-mask'): continue
    im = Image.open(f).convert('RGBA'); dst = f'{O}/{name}.webp'
    if name == 'background': im.convert('RGB').save(dst, 'WEBP', quality=86, method=6)
    elif name.startswith(LOSSLESS_PREFIX) and max(im.size) <= 900: im.save(dst, 'WEBP', lossless=True, method=6)
    else: im.save(dst, 'WEBP', quality=90, method=6)
    if name in WINDOWED:   # flood-fill the transparent window from the centre (PIL only)
        w, h = im.size; bw = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
        if bw.getpixel((w // 2, h // 2)) == 255: print(name, 'centre not transparent'); continue
        ImageDraw.floodfill(bw, (w // 2, h // 2), 128)
        win = bw.point(lambda v: 255 if v == 128 else 0); box = win.getbbox(); l, t, r, b = box
        if l == 0 or t == 0: print(name, 'WINDOW NOT CLOSED'); continue
        print(f'{name}: window {l/w*100:.1f}% {t/h*100:.1f}% {100-r/w*100:.1f}% {100-b/h*100:.1f}% (l t r b)')
        if name == 'avatar-frame':   # avatar mask = this window (round)
            m = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(m).ellipse((l * 2, t * 2, r * 2, b * 2), fill=255)
            o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); o.save(f'{O}/avatar-mask.webp', 'WEBP', lossless=True)
print('converted', len(os.listdir(O)))
