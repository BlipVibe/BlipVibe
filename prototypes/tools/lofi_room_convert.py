"""Walnut Hi-Fi (blip variant lofi-room): images/skins/blip/kit/lofi-room/*.png -> images/skins/blip/assets/lofi-room/*.webp
usage: python3 prototypes/tools/lofi_room_convert.py   (run from the repo root)
Prints the variant `art` list (every converted part) and each windowed frame's window as % (l t r b)."""
import os, glob, json
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit/lofi-room'; O = 'images/skins/blip/assets/lofi-room'; os.makedirs(O, exist_ok=True)
WINDOWED = ['avatar-frame', 'avatar-ring', 'group-avatar-frame', 'story-ring', 'story-ring-seen', 'swatch-ring']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'mascot', 'sparkle', 'menu-check', 'badge', 'coin', 'story-', 'camera', 'knob', 'vu-', 'screw')
names = []
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_'): continue
    im = Image.open(f).convert('RGBA'); dst = f'{O}/{name}.webp'
    if name == 'card-walnut':   # store/menu card -> images/skins/blip/lofi-room/card.webp
        os.makedirs('images/skins/blip/lofi-room', exist_ok=True)
        im.convert('RGB').resize((256, 256), Image.LANCZOS).save('images/skins/blip/lofi-room/card.webp', 'WEBP', quality=88); continue
    if name == 'background': im.convert('RGB').save(dst, 'WEBP', quality=84, method=6)
    elif name.startswith(LOSSLESS_PREFIX) and max(im.size) <= 900: im.save(dst, 'WEBP', lossless=True, method=6)
    else: im.save(dst, 'WEBP', quality=90, method=6)
    names.append(name)
    if name in WINDOWED:
        w, h = im.size; bw = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
        if bw.getpixel((w // 2, h // 2)) == 255: print(name, 'centre not transparent'); continue
        ImageDraw.floodfill(bw, (w // 2, h // 2), 128)
        win = bw.point(lambda v: 255 if v == 128 else 0); l, t, r, b = win.getbbox()
        if l == 0 or t == 0: print(name, 'WINDOW NOT CLOSED'); continue
        print(f'{name}: window {l/w*100:.1f}% {t/h*100:.1f}% {100-r/w*100:.1f}% {100-b/h*100:.1f}% (l t r b)')
        if name == 'avatar-frame':
            m = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(m).ellipse((l * 2, t * 2, r * 2, b * 2), fill=255)
            o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); o.save(f'{O}/avatar-mask.webp', 'WEBP', lossless=True)
            names.append('avatar-mask')
print('converted', len(names)); print('ART=' + json.dumps(sorted(set(names))))
