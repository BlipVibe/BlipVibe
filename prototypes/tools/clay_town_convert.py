"""Clay Town (Blip Vibe 'clay-town' of the default skin): images/skins/blip/kit/clay-town/*.png -> assets/clay-town/*.webp.
usage: clay_town_convert.py   (run from the repo root)
Same rules as blip_convert.py. Masks (cover/photo/skin-card/avatar) stay Logo Classic's (same geometry), so they are not
written here; prints the list of converted part names for FULL_SKINS.blip.variants['clay-town'].art."""
import os, glob, json
from PIL import Image
K = 'images/skins/blip/kit/clay-town'; O = 'images/skins/blip/assets/clay-town'; os.makedirs(O, exist_ok=True)
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'mascot', 'sparkle', 'menu-check', 'badge', 'coin', 'story-', 'camera')
names = []
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name.endswith('-mask'): continue
    im = Image.open(f).convert('RGBA')
    if name == 'card':   # store / Blip menu card: 256x256 full-bleed scene
        os.makedirs('images/skins/blip/clay-town', exist_ok=True)
        im.convert('RGB').resize((256, 256), Image.LANCZOS).save('images/skins/blip/clay-town/card.webp', 'WEBP', quality=88, method=6); continue
    ref = f'images/skins/blip/kit/{name}.png'
    if os.path.exists(ref) and Image.open(ref).size != im.size: print('SIZE MISMATCH', name, im.size, Image.open(ref).size)
    dst = f'{O}/{name}.webp'
    if name == 'background': im.convert('RGB').save(dst, 'WEBP', quality=86, method=6)
    elif name.startswith(LOSSLESS_PREFIX) and max(im.size) <= 900: im.save(dst, 'WEBP', lossless=True, method=6)
    else: im.save(dst, 'WEBP', quality=90, method=6)
    names.append(name)
print(json.dumps(names))
