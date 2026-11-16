"""Good Witch: kit/gw (Day) -> assets/*.webp and kit/gw-night (Night) -> assets/night/*.webp, plus photo masks.
usage: good_witch_convert.py <skin_dir> [day|night|both]
- small pieces (icons, notif icons, coin, constellations, orbs, badges, gems) are saved LOSSLESS so they stay crisp
  (Witchcraft's moons were blurry from lossy compression + scaling);
- frames with a transparent window get <name>-mask.webp (window grown 6px) and their window box is printed as
  percentages (l t r b) for the CSS."""
import sys, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi

skin = sys.argv[1]
which = sys.argv[2] if len(sys.argv) > 2 else 'both'
WINDOWED = ['photo-bubble', 'photo-frame', 'featured-frame', 'skin-card', 'skin-card-wide', 'star-frame']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'constellation-')
LOSSLESS = {'coin', 'arrow-orb', 'send-orb', 'plus-orb', 'heart-orb', 'camera-badge', 'unread-gem', 'nav-orb',
            'nav-orb-active', 'tab-underline', 'reply-line', 'corner-vine', 'avatar-ring', 'story-ring', 'story-add',
            'photo-bubble', 'star-frame', 'moon-frame'}

def convert(src, out):
    os.makedirs(out, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        im = Image.open(f).convert('RGBA')
        dst = os.path.join(out, name + '.webp')
        if name == 'background':
            im.convert('RGB').save(dst, 'WEBP', quality=88, method=4)
        elif name.startswith(LOSSLESS_PREFIX) or name in LOSSLESS:
            im.save(dst, 'WEBP', lossless=True, quality=100, method=4)
        else:
            im.save(dst, 'WEBP', quality=90, method=4)
        if name in WINDOWED:
            a = np.array(im)[..., 3] > 60
            lab, _ = ndi.label(~a)
            h, w = a.shape
            win = lab == lab[int(h * .5), w // 2]
            if win[0, 0] or win.sum() > .95 * w * h:
                print(name, 'WINDOW NOT CLOSED'); continue
            ys, xs = np.where(win)
            print(f'{out}/{name}: window {xs.min()/w*100:.1f}% {ys.min()/h*100:.1f}% {100-xs.max()/w*100:.1f}% {100-ys.max()/h*100:.1f}% (l t r b)')
            m = ndi.gaussian_filter((ndi.distance_transform_edt(~win) <= 6).astype(float), 1.0)
            mk = Image.new('RGBA', (w, h), (0, 0, 0, 0)); mk.putalpha(Image.fromarray((m * 255).astype(np.uint8)))
            mk.save(os.path.join(out, name + '-mask.webp'), 'WEBP', quality=90)

if which in ('day', 'both'):
    convert(os.path.join(skin, 'kit/gw'), os.path.join(skin, 'assets'))
if which in ('night', 'both') and os.path.isdir(os.path.join(skin, 'kit/gw-night')):
    convert(os.path.join(skin, 'kit/gw-night'), os.path.join(skin, 'assets/night'))
print('converted')
