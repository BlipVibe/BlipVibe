"""Heaven's Light: kit/hl (Day) -> assets/*.webp and kit/hl-twilight (Twilight) -> assets/twilight/*.webp.
usage: heavens_light_convert.py <skin_dir> [day|twilight|both]
- small pieces (icons, notif icons, coin, halos, orbs, badges) LOSSLESS so they stay crisp;
- *-mask.png from Codex are black/white: white becomes opaque alpha (CSS mask-image needs alpha);
- frames with a transparent window print their window box as percentages (l t r b) for the CSS."""
import sys, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi
skin = sys.argv[1]; which = sys.argv[2] if len(sys.argv) > 2 else 'both'
WINDOWED = ['photo-frame', 'featured-frame', 'skin-card', 'cameo-wings', 'avatar-wings', 'group-avatar-frame', 'story-ring']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'halo-')
LOSSLESS = {'coin', 'send-btn', 'round-btn', 'plus-btn', 'heart-orb', 'sun-orb', 'like-orb', 'camera-badge', 'unread-dot',
            'badge-count', 'story-ring', 'story-add', 'avatar-wings', 'cameo-wings', 'title-crest', 'title-laurel', 'laurel-sprig'}
def convert(src, out):
    os.makedirs(out, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('_'): continue
        im = Image.open(f).convert('RGBA'); dst = os.path.join(out, name + '.webp')
        if name.endswith('-mask'):
            g = np.array(im.convert('L')); m = Image.new('RGBA', im.size, (0, 0, 0, 0)); m.putalpha(Image.fromarray(g))
            m.save(dst, 'WEBP', quality=90); continue
        if name == 'background':
            im.convert('RGB').save(dst, 'WEBP', quality=88, method=4)
        elif name.startswith(LOSSLESS_PREFIX) or name in LOSSLESS:
            im.save(dst, 'WEBP', lossless=True, quality=100, method=4)
        else:
            im.save(dst, 'WEBP', quality=90, method=4)
        if name in WINDOWED:
            a = np.array(im)[..., 3] > 60; lab, _ = ndi.label(~a); h, w = a.shape
            win = lab == lab[int(h * .5), w // 2]
            if win[0, 0] or win.sum() > .95 * w * h: print(name, 'WINDOW NOT CLOSED'); continue
            ys, xs = np.where(win)
            print(f'{out}/{name}: window {xs.min()/w*100:.1f}% {ys.min()/h*100:.1f}% {100-xs.max()/w*100:.1f}% {100-ys.max()/h*100:.1f}% (l t r b)')
if which in ('day', 'both'): convert(os.path.join(skin, 'kit/hl'), os.path.join(skin, 'assets'))
if which in ('twilight', 'both') and os.path.isdir(os.path.join(skin, 'kit/hl-twilight')):
    convert(os.path.join(skin, 'kit/hl-twilight'), os.path.join(skin, 'assets/twilight'))
print('converted')
