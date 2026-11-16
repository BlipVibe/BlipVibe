"""Blood Moon: kit/crimson -> assets/*.webp, kit/silver -> assets/silver/*.webp, kit/fx -> assets/fx-*.webp (+ toggles).
usage: blood_moon_convert.py <skin_dir> [crimson|silver|fx|all]
- small pieces (icons, notif icons, coin, moons, orbs, badges) LOSSLESS so they stay crisp;
- *-mask.png black/white -> alpha (CSS mask-image needs alpha);
- frames with a transparent window print their window box as percentages (l t r b) for the CSS."""
import sys, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi
skin = sys.argv[1]; which = sys.argv[2] if len(sys.argv) > 2 else 'all'
WINDOWED = ['photo-frame', 'featured-frame', 'skin-card', 'cameo-frame', 'avatar-ring', 'avatar-ring-small', 'group-avatar-frame', 'story-ring']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'moon-')
LOSSLESS = {'coin', 'send-btn', 'round-btn', 'plus-btn', 'heart-orb', 'mask-orb', 'rose-orb', 'camera-badge', 'unread-dot',
            'badge-count', 'story-ring', 'story-add', 'avatar-ring', 'avatar-ring-small', 'toggle-crimson', 'toggle-silver'}
def save(im, name, dst):
    if name.endswith('-mask'):
        g = np.array(im.convert('L')); m = Image.new('RGBA', im.size, (0, 0, 0, 0)); m.putalpha(Image.fromarray(g)); m.save(dst, 'WEBP', quality=90); return
    if name in ('background', 'header', 'group-banner'): im.convert('RGB').save(dst, 'WEBP', quality=88, method=4)
    elif name.startswith(LOSSLESS_PREFIX) or name in LOSSLESS: im.save(dst, 'WEBP', lossless=True, quality=100, method=4)
    else: im.save(dst, 'WEBP', quality=90, method=4)
def convert(src, out):
    os.makedirs(out, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('_'): continue
        im = Image.open(f).convert('RGBA'); save(im, name, os.path.join(out, name + '.webp'))
        if name in WINDOWED:
            a = np.array(im)[..., 3] > 60; lab, _ = ndi.label(~a); h, w = a.shape
            win = lab == lab[int(h * .5), w // 2]
            if win[0, 0] or win.sum() > .95 * w * h: print(name, 'WINDOW NOT CLOSED'); continue
            ys, xs = np.where(win)
            print(f'{out}/{name}: window {xs.min()/w*100:.1f}% {ys.min()/h*100:.1f}% {100-xs.max()/w*100:.1f}% {100-ys.max()/h*100:.1f}% (l t r b)')
if which in ('crimson', 'all'): convert(os.path.join(skin, 'kit/crimson'), os.path.join(skin, 'assets'))
if which in ('silver', 'all') and os.path.isdir(os.path.join(skin, 'kit/silver')): convert(os.path.join(skin, 'kit/silver'), os.path.join(skin, 'assets/silver'))
if which in ('fx', 'all') and os.path.isdir(os.path.join(skin, 'kit/fx')):
    for f in sorted(glob.glob(os.path.join(skin, 'kit/fx/*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('_'): continue
        im = Image.open(f).convert('RGBA')
        if name.startswith('toggle-'):   # the moon button: same art in both rendition folders
            for d in ('assets', 'assets/silver'):
                os.makedirs(os.path.join(skin, d), exist_ok=True); save(im, name, os.path.join(skin, d, name + '.webp'))
        else:
            if max(im.size) > 1000: im = im.resize((im.width * 3 // 4, im.height * 3 // 4), Image.LANCZOS)
            im.save(os.path.join(skin, 'assets', 'fx-' + name + '.webp'), 'WEBP', quality=88, method=4)
print('converted')
