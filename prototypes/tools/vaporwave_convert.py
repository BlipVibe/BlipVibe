"""Vaporwave: kit/vw (Retro) -> assets/*.webp and kit/vw-modern (Modern) -> assets/modern/*.webp.
usage: vaporwave_convert.py [retro|modern|retro-dark|modern-dark|all]
(kit/vw → assets/, kit/vw-<rendition> → assets/<rendition>/)
- icons, title buttons, badges, coin, wordmark/titles saved LOSSLESS (crisp);
- frames with a transparent window print their window box (l t r b %) for the CSS."""
import sys, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi
SKIN = os.path.join(os.path.dirname(__file__), '..', '..', 'images', 'skins', 'vaporwave')
which = sys.argv[1] if len(sys.argv) > 1 else 'both'
WINDOWED = ['avatar-window', 'profile-window', 'vhs-window', 'photo-frame']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'title-', 'quest-icon-')
LOSSLESS = {'coin', 'badge-count', 'title-btns', 'wordmark', 'unread-dot', 'camera-badge', 'trophy', 'send-btn',
            'plus-btn', 'start-btn', 'story-ring', 'story-add', 'stats-divider', 'icon-more', 'coin-stack'}

def convert(src, out):
    os.makedirs(out, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('_'):
            continue
        im = Image.open(f).convert('RGBA')
        dst = os.path.join(out, name + '.webp')
        if name.startswith(('background', 'header-')):
            im.convert('RGB').save(dst, 'WEBP', quality=88, method=4)
        elif name.startswith(LOSSLESS_PREFIX) or name in LOSSLESS:
            im.save(dst, 'WEBP', lossless=True, quality=100, method=4)
        else:
            im.save(dst, 'WEBP', quality=90, method=4)
        if name in WINDOWED:
            a = np.array(im)[..., 3] > 60
            lab, _ = ndi.label(~a)
            h, w = a.shape
            win = lab == lab[int(h * .55), w // 2]
            if win[0, 0] or win.sum() > .95 * w * h:
                print(name, 'WINDOW NOT CLOSED'); continue
            ys, xs = np.where(win)
            print(f'{name}: {w}x{h} window {xs.min()/w*100:.1f}% {ys.min()/h*100:.1f}% {100-xs.max()/w*100:.1f}% {100-ys.max()/h*100:.1f}% (l t r b)')

if which in ('retro', 'both', 'all'):
    convert(os.path.join(SKIN, 'kit/vw'), os.path.join(SKIN, 'assets'))
for v in ('modern', 'retro-dark', 'modern-dark'):
    if which in (v, 'both', 'all') and os.path.isdir(os.path.join(SKIN, 'kit/vw-' + v)):
        convert(os.path.join(SKIN, 'kit/vw-' + v), os.path.join(SKIN, 'assets', v))
print('converted')
