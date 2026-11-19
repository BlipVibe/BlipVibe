"""Group page kit: images/skins/<skin>/kit/group/<rendition>/gp-*.png -> images/skins/<skin>/assets/[<dir>/]gp-*.webp,
then writes the GP_ART table (sizes + transparent windows) into js/fullskins-group.js.
usage: group_convert.py [skin/rendition ...]   (no args = everything found)
- real alpha kept; a piece painted on flat #FF00FF magenta (or with an opaque flat background) is keyed out;
- every piece is trimmed to its visible pixels (aspect ratios in GP_ART are of the trimmed art);
- windowed pieces (frame, pic-frame, ring, photo-frame) get their transparent window measured as % (l t r b);
- Anime Blaze: red is painted, blue/purple/green/pink are hue-shifted from it (warm pixels only, like its other art)."""
import sys, os, re, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SKINS = os.path.join(ROOT, 'images', 'skins')
# rendition (kit folder name) -> assets sub-folder ('' = assets root = the skin's first rendition)
DIRS = {
    'scrapbook': {'scrapbook': ''}, 'witchcraft': {'witchcraft': ''},
    'anime-blaze': {'red': ''},
    'good-witch': {'day': '', 'night': 'night'},
    'vaporwave': {'retro': '', 'modern': 'modern', 'retro-dark': 'retro-dark', 'modern-dark': 'modern-dark'},
    'heavens-light': {'day': '', 'twilight': 'twilight'},
    'blood-moon': {'crimson': '', 'silver': 'silver'},
    'superhero': {'heroes': '', 'villains': 'villains'},
    'basic': {'rose': '', 'pumpkin': 'pumpkin'},
}
WINDOWED = {'gp-frame', 'gp-pic-frame', 'gp-ring', 'gp-photo-frame'}
MAXW = {'gp-head': 1290, 'gp-frame': 1200, 'gp-post': 1100, 'gp-photo-frame': 1100, 'gp-card': 1100, 'gp-heading': 1100,
        'gp-stats': 1100, 'gp-field': 900, 'gp-name-deco': 1100}
ANIME = {'blue': 215, 'purple': 275, 'green': 135, 'pink': 325}


def keyed(im):
    """RGBA with a real transparent background."""
    a = np.array(im.convert('RGBA')).astype(np.int16)
    alpha = a[..., 3]
    if (alpha < 250).mean() > 0.02:          # has real alpha already
        return Image.fromarray(a.astype(np.uint8), 'RGBA')
    rgb = a[..., :3]
    mag = (rgb[..., 0] > 200) & (rgb[..., 1] < 70) & (rgb[..., 2] > 200)
    if mag[0, 0] or mag.mean() > 0.05:
        bg = mag
    else:                                     # flat background colour taken from the corners, flood-filled from the edges
        c = np.median(np.stack([rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]), axis=0)
        close = np.abs(rgb - c).sum(-1) < 40
        lab, _ = ndi.label(close)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(edge))
    alpha = np.where(bg, 0, 255).astype(np.float32)
    alpha = ndi.gaussian_filter(alpha, 0.7)   # soft 1px edge
    if mag.any():                             # remove magenta fringe
        fr = (rgb[..., 0] > 150) & (rgb[..., 2] > 150) & (rgb[..., 1] < 110)
        alpha[fr] = 0
    a[..., 3] = alpha.clip(0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def trim(im):
    al = np.array(im)[..., 3]
    ys, xs = np.where(al > 12)
    if not len(xs): return im
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def window(im, thr=100):
    al = np.array(im)[..., 3] > thr
    h, w = al.shape
    lab, n = ndi.label(~al)
    if n == 0: return None
    # the transparent component at (or nearest to) the centre, ignoring tiny specks
    cy, cx = h // 2, w // 2
    best, bestd = 0, 1e9
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(xs) < 0.02 * w * h: continue
        d = ((ys.mean() - cy) / h) ** 2 + ((xs.mean() - cx) / w) ** 2
        if d < bestd: best, bestd = i, d
    if not best: return None
    ys, xs = np.where(lab == best)
    if thr > 30 and xs.min() == 0 and ys.min() == 0 and xs.max() == w - 1 and ys.max() == h - 1:
        return window(im, thr // 3)        # ring with a soft/semi-transparent line: try a lower alpha threshold
    return [round(xs.min() / w * 100, 2), round(ys.min() / h * 100, 2), round(100 - (xs.max() + 1) / w * 100, 2), round(100 - (ys.max() + 1) / h * 100, 2)]


def hue_shift(im, target):
    a = np.array(im).astype(np.float32) / 255
    rgb = a[..., :3]
    hsv = np.array(Image.fromarray((rgb * 255).astype(np.uint8)).convert('HSV')).astype(np.float32)
    hdeg = hsv[..., 0] / 255 * 360; s = hsv[..., 1] / 255
    warm = ((hdeg < 65) | (hdeg > 340)) & (s > 0.28)
    rel = np.where(hdeg > 180, hdeg - 360, hdeg)        # -20..65
    newh = (target + (rel - 20) * 0.45) % 360
    hsv[..., 0] = np.where(warm, newh / 360 * 255, hsv[..., 0])
    out = Image.fromarray(hsv.clip(0, 255).astype(np.uint8), 'HSV').convert('RGB')
    o = np.array(out).astype(np.float32) / 255
    o = np.where(warm[..., None], o, rgb)
    res = np.dstack([o, a[..., 3:]])
    return Image.fromarray((res * 255).clip(0, 255).astype(np.uint8), 'RGBA')


def save(im, path, name):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mw = MAXW.get(name, 600)
    if im.width > mw: im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
    small = name.startswith('gp-icon') or name in ('gp-coin', 'gp-back', 'gp-ring')
    if small: im.save(path, 'WEBP', lossless=True, quality=100, method=4)
    else: im.save(path, 'WEBP', quality=90, method=4)
    return im


def main(only):
    art = {}
    js = os.path.join(ROOT, 'js', 'fullskins-group.js')
    m = re.search(r'/\* GP_ART:BEGIN \*/\n  var GP_ART = (.*?);\n  /\* GP_ART:END \*/', open(js).read(), re.S)
    if m: art = json.loads(m.group(1))
    for skin, rends in DIRS.items():
        for rend, sub in rends.items():
            key = skin + '/' + rend
            if only and key not in only and skin not in only: continue
            src = os.path.join(SKINS, skin, 'kit', 'group', rend)
            files = sorted(glob.glob(os.path.join(src, 'gp-*.png')))
            if not files: continue
            pieces = {}
            for f in files:
                name = os.path.splitext(os.path.basename(f))[0]
                im = trim(keyed(Image.open(f)))
                out = save(im, os.path.join(SKINS, skin, 'assets', sub, name + '.webp'), name)
                rec = [out.width, out.height]
                if name in WINDOWED:
                    w = window(out)
                    if w: rec += w
                    else: print(f'  ! {key} {name}: no window found')
                pieces[name] = rec
                if skin == 'anime-blaze' and rend == 'red':
                    for col, hue in ANIME.items():
                        save(hue_shift(out, hue), os.path.join(SKINS, skin, 'assets', col, name + '.webp'), name)
            art.setdefault(skin, {})[sub] = pieces
            if skin == 'anime-blaze':
                for col in ANIME: art[skin][col] = pieces
            print(f'{key}: {len(pieces)} pieces -> assets/{sub}')
    body = json.dumps(art, separators=(',', ':'))
    s = open(js).read()
    s = re.sub(r'/\* GP_ART:BEGIN \*/\n  var GP_ART = .*?;\n  /\* GP_ART:END \*/', lambda _: '/* GP_ART:BEGIN */\n  var GP_ART = ' + body + ';\n  /* GP_ART:END */', s, flags=re.S)
    open(js, 'w').write(s)
    print('GP_ART written')


if __name__ == '__main__':
    main(set(sys.argv[1:]))
