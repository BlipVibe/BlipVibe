"""Space-Age Pop (Blip Vibe 'space-age'): images/skins/blip/kit/space-age/*.png -> images/skins/blip/assets/space-age/*.webp.
usage: python3 prototypes/tools/space_age_convert.py      (from the repo root)
- same part names as Logo Classic (blip_convert.py); parts not painted here fall back to Logo Classic's art;
- *-tight copies (panel-card, panel-card-active, card-tail, panel-teal) are cut to the outline (soft shadow dropped) for 9-slicing;
- avatar-mask = avatar-frame's round window; card.png -> images/skins/blip/space-age/card.webp (store / menu card).
Prints the list of parts written, for the variant's `art` list in js/fullskins.js."""
import os, glob, json
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit/space-age'; O = 'images/skins/blip/assets/space-age'; os.makedirs(O, exist_ok=True)
WINDOWED = ['avatar-frame', 'avatar-ring', 'group-avatar-frame', 'story-ring', 'story-ring-seen', 'swatch-ring']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'mascot', 'sparkle', 'menu-check', 'badge', 'coin', 'story-', 'camera', 'orbit', 'planet', 'burst')
TIGHT = ['panel-card', 'panel-card-active', 'card-tail', 'panel-teal']
# pills / bars / round buttons: cut to the visible shape (1px air), so a 9-slice end = half the art's height
TRIM = ('chip', 'chip-active', 'btn-', 'field', 'tabs-track', 'bar-', 'coin-pill', 'reward-chip', 'heading-tab', 'nav-bar',
        'nav-btn', 'nav-active', 'blip-btn', 'bubble-', 'menu-panel', 'menu-row-on', 'divider', 'orbit-')
done = []
def save(im, name, lossless=False, q=90):
    im.save(f'{O}/{name}.webp', 'WEBP', lossless=lossless, quality=q, method=6); done.append(name)
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name.endswith('-mask'): continue
    im = Image.open(f).convert('RGBA')
    if name.startswith(TRIM) or name in TRIM:
        l, t, r, b = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
        im = im.crop((max(0, l - 1), max(0, t - 1), min(im.width, r + 1), min(im.height, b + 1)))
    if name == 'card':
        os.makedirs('images/skins/blip/space-age', exist_ok=True)
        im.convert('RGB').resize((256, 256), Image.LANCZOS).save('images/skins/blip/space-age/card.webp', 'WEBP', quality=88, method=6); continue
    if name == 'background': save(im.convert('RGB'), name, q=86)
    elif name.startswith(LOSSLESS_PREFIX) and max(im.size) <= 900: save(im, name, lossless=True)
    else: save(im, name)
    if name in TIGHT:   # cut to the outline: bbox of the solid pixels (alpha > 200), shadow outside it dropped
        box = im.getchannel('A').point(lambda v: 255 if v > 200 else 0).getbbox()
        t = im.crop(box); save(t, name + '-tight'); print(f'{name}-tight {t.size}')
    if name in WINDOWED:
        w, h = im.size; bw = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
        if bw.getpixel((w // 2, h // 2)) == 255: print(name, 'centre not transparent'); continue
        ImageDraw.floodfill(bw, (w // 2, h // 2), 128)
        win = bw.point(lambda v: 255 if v == 128 else 0); l, t, r, b = win.getbbox()
        if l == 0 or t == 0: print(name, 'WINDOW NOT CLOSED'); continue
        print(f'{name}: window {l/w*100:.1f}% {t/h*100:.1f}% {100-r/w*100:.1f}% {100-b/h*100:.1f}% (l t r b)')
        if name == 'avatar-frame':
            m = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(m).ellipse((l * 2, t * 2, r * 2, b * 2), fill=255)
            o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); save(o, 'avatar-mask', lossless=True)
print('art:', json.dumps(sorted(set(done))))
