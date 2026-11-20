"""Bubble Pop (Blip Vibe look of the default skin): images/skins/blip/kit/bubble-pop/*.png -> assets/bubble-pop/*.webp.
usage: bubble_pop_convert.py   (run from the repo root). Same part names as Logo Classic (blip_convert.py); the
geometric masks are not repainted (they fall back to Logo Classic's). Prints the `art` list for js/fullskins.js."""
import os, glob
from PIL import Image
K = 'images/skins/blip/kit/bubble-pop'; O = 'images/skins/blip/assets/bubble-pop'; os.makedirs(O, exist_ok=True)
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'mascot', 'sparkle', 'menu-check', 'badge', 'coin', 'story-', 'camera')
names = []
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name.endswith('-mask') or name == 'card-bubble-pop': continue
    im = Image.open(f).convert('RGBA'); dst = f'{O}/{name}.webp'
    if name == 'background': im.convert('RGB').save(dst, 'WEBP', quality=86, method=6)
    elif name.startswith(LOSSLESS_PREFIX) and max(im.size) <= 900: im.save(dst, 'WEBP', lossless=True, method=6)
    else: im.save(dst, 'WEBP', quality=90, method=6)
    names.append(name)
c = f'{K}/card-bubble-pop.png'
if os.path.exists(c):
    os.makedirs('images/skins/blip/bubble-pop', exist_ok=True)
    Image.open(c).convert('RGB').resize((256, 256), Image.LANCZOS).save('images/skins/blip/bubble-pop/card.webp', 'WEBP', quality=88)
print(len(names), 'parts'); print(repr(names))
