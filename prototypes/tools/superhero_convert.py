"""Superhero: kit/heroes -> assets/*.webp and kit/villains -> assets/villains/*.webp (same names).
usage: superhero_convert.py <skin_dir> [heroes|villains|both]
- small pieces (icons, notif icons, badges, quest icons, toggles) LOSSLESS so they stay crisp;
- *-mask.png are black/white: white becomes opaque alpha (CSS mask-image needs alpha);
- card.png (heroes kit) -> <skin_dir>/card.webp (shop card, 256px);
- prints window boxes (l t w h %) for the CSS, and warns about a painted checkerboard or a missing alpha."""
import sys, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi
skin = sys.argv[1]; which = sys.argv[2] if len(sys.argv) > 2 else 'both'
WINDOWED = ['avatar-frame', 'cover-frame', 'photo-frame', 'featured-frame', 'skin-card', 'cameo', 'group-avatar-frame', 'group-cover-frame', 'story-ring']
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'toggle-')
LOSSLESS = {'coin', 'reward-coin', 'send-btn', 'round-btn', 'plus-btn', 'heart-orb', 'like-orb', 'react-orb', 'camera-badge', 'unread-dot',
            'badge-count', 'story-ring', 'story-add', 'avatar-frame', 'laurel-sprig', 'stats-divider', 'fx-spark'}
# painted for the first animation draft (too close to Anime Blaze's slam/shatter) — not shipped
SKIP = {'fx-sfx', 'fx-speedlines', 'fx-bolt', 'fx-crack', 'fx-shard', 'fx-spark'}
OPAQUE = {'background', 'header', 'fx-page'}
def checker(a):
    """True if the corners look like a painted grey/white transparency checkerboard."""
    if a.shape[2] < 4: return False
    c = a[:24, :24, :3].astype(int); alpha = a[:24, :24, 3]
    if alpha.min() < 250: return False
    g = c.mean(axis=2); return g.std() > 12 and abs(c[..., 0] - c[..., 2]).max() < 12 and g.min() > 150
def boxes(alpha_win, w, h, n):
    lab, k = ndi.label(alpha_win); out = []
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, k + 1))
    for i in np.argsort(sizes)[::-1][:n]:
        ys, xs = np.where(lab == i + 1); out.append((xs.min() / w * 100, ys.min() / h * 100, (xs.max() - xs.min() + 1) / w * 100, (ys.max() - ys.min() + 1) / h * 100))
    return sorted(out)
def convert(src, out):
    os.makedirs(out, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('_') or name in SKIP: continue
        im = Image.open(f).convert('RGBA'); a = np.array(im); dst = os.path.join(out, name + '.webp')
        if name == 'card':
            if out.endswith('assets'): im.convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(skin, 'card.webp'), 'WEBP', quality=88)
            im.convert('RGB').resize((512, 512), Image.LANCZOS).save(dst, 'WEBP', quality=88); continue
        if name.endswith('-mask'):
            g = np.array(im.convert('L')); m = Image.new('RGBA', im.size, (0, 0, 0, 0)); m.putalpha(Image.fromarray(g)); m.save(dst, 'WEBP', quality=90)
            n = 3 if name == 'timeline-mask' else 1; h, w = g.shape
            for b in boxes(g > 128, w, h, n): print(f'{out}/{name}: window l {b[0]:.2f}% t {b[1]:.2f}% w {b[2]:.2f}% h {b[3]:.2f}%')
            continue
        if name not in OPAQUE and checker(a): print('WARNING checkerboard painted in', f)
        if name not in OPAQUE and a[..., 3].min() > 250 and name not in ('profile-scene',): print('note: fully opaque', f)
        if name in OPAQUE: im.convert('RGB').save(dst, 'WEBP', quality=88, method=4)
        elif name.startswith(LOSSLESS_PREFIX) or name in LOSSLESS: im.save(dst, 'WEBP', lossless=True, quality=100, method=4)
        else: im.save(dst, 'WEBP', quality=90, method=4)
        if name in WINDOWED:
            al = a[..., 3] > 60; lab, _ = ndi.label(~al); h, w = al.shape; win = lab == lab[int(h * .45), w // 2]
            if win[0, 0] or win.sum() > .95 * w * h: print(name, 'WINDOW NOT CLOSED'); continue
            ys, xs = np.where(win)
            print(f'{out}/{name}: window l {xs.min()/w*100:.1f}% t {ys.min()/h*100:.1f}% r {100-xs.max()/w*100:.1f}% b {100-ys.max()/h*100:.1f}%')
if which in ('heroes', 'both'): convert(os.path.join(skin, 'kit/heroes'), os.path.join(skin, 'assets'))
if which in ('villains', 'both'): convert(os.path.join(skin, 'kit/villains'), os.path.join(skin, 'assets/villains'))
print('converted')
