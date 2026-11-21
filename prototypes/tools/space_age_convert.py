"""Space-Age Pop (Blip Vibe 'space-age'): images/skins/blip/kit/space-age/*.png -> images/skins/blip/assets/space-age/*.webp.
usage: python3 prototypes/tools/space_age_convert.py      (from the repo root)

GEOMETRY RULE (prototypes/SKIN-PLAYBOOK.md §4, from Pixel Pal): every part that Logo Classic also has is refitted to
Logo Classic's canvas + opaque box (images/skins/blip/assets/<name>.webp), so css/fullskins-blip.css slices it unchanged:
- 9-slice parts (pills, bubbles, panels, menu, header) are resampled slice-wise: the corners/ends keep their shape,
  only the plain middles stretch (never squashed);
- pictures (icons, mascots, badges, frames, coins, round buttons) are fitted 'contain' into the Logo Classic box;
- CUSTOM parts keep their own trimmed shape because the concept's shape differs and css/fullskins-space-age.css places
  them itself: card-tail (TV console with feet, not a speech tail), nav-bar (curved console), nav-active / nav-btn /
  blip-btn (round domes, not tiles/pills), plus the Space-Age-only extras (btn-teal, heading-tab, panel-teal, orbit-*, planet).
avatar-mask is cut from the refitted avatar-frame window. card.png -> images/skins/blip/space-age/card.webp.
Prints the `art` list for the variant entry in js/fullskins.js."""
import os, glob, json
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit/space-age'; O = 'images/skins/blip/assets/space-age'; L = 'images/skins/blip/assets'
os.makedirs(O, exist_ok=True)
LOSSLESS_PREFIX = ('icon-', 'notif-', 'quest-', 'mascot', 'sparkle', 'menu-check', 'badge', 'coin', 'story-', 'camera', 'orbit', 'planet', 'burst')
CUSTOM = ('card-tail', 'nav-bar', 'nav-active', 'nav-btn', 'blip-btn', 'blip-btn-on', 'orbit-orange', 'orbit-teal', 'planet', 'heading-tab')
PILLS = ('chip', 'chip-active', 'btn-primary', 'btn-secondary', 'btn-danger', 'btn-disabled', 'field', 'tabs-track', 'bar-track',
         'bar-fill', 'coin-pill', 'reward-chip', 'menu-row-on', 'divider')
SLICES = {'bubble-in': (90, 80, 80, 100), 'bubble-out': (80, 80, 90, 100), 'menu-panel': (200, 60, 60, 70), 'header-bar': (40, 40, 40, 40)}
PLAIN = ('panel-card', 'panel-card-active')
# extras with no Logo Classic part: borrow the geometry of a Logo Classic part of the same kind
BORROW = {'btn-teal': 'btn-primary', 'panel-teal': 'panel-card'}

def bbox(im, t=40): return im.getchannel('A').point(lambda v: 255 if v > t else 0).getbbox()
def nine(src, size, T):
    """resample src into size; T = target (l, t, r, b) slice widths; source slices = T * (src_h / tgt_h)."""
    sw, sh = src.size; tw, th = size; k = sh / th
    S = [min(int(round(v * k)), (sw if i % 2 == 0 else sh) // 2) for i, v in enumerate(T)]
    T = [int(round(v / k)) for v in S]
    xs, ys = [0, S[0], sw - S[2], sw], [0, S[1], sh - S[3], sh]
    xt, yt = [0, T[0], tw - T[2], tw], [0, T[1], th - T[3], th]
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    for i in range(3):
        for j in range(3):
            a = (xs[i], ys[j], xs[i + 1], ys[j + 1]); b = (xt[i], yt[j], xt[i + 1], yt[j + 1])
            if a[2] > a[0] and a[3] > a[1] and b[2] > b[0] and b[3] > b[1]:
                out.paste(src.crop(a).resize((b[2] - b[0], b[3] - b[1]), Image.LANCZOS), (b[0], b[1]))
    return out
def refit(im, ref, mode, T=None):
    """put im's visible shape into ref's canvas + opaque box."""
    r = Image.open(ref).convert('RGBA'); box = bbox(r); bw, bh = box[2] - box[0], box[3] - box[1]
    src = im.crop(bbox(im)); out = Image.new('RGBA', r.size, (0, 0, 0, 0))
    if mode == 'contain':
        s = min(bw / src.width, bh / src.height); w, h = max(1, round(src.width * s)), max(1, round(src.height * s))
        out.paste(src.resize((w, h), Image.LANCZOS), (box[0] + (bw - w) // 2, box[1] + (bh - h) // 2))
    elif mode == 'plain': out.paste(src.resize((bw, bh), Image.LANCZOS), box[:2])
    else: out.paste(nine(src, (bw, bh), T), box[:2])
    return out

done = []
def save(im, name):
    if name == 'background': im.convert('RGB').save(f'{O}/{name}.webp', 'WEBP', quality=86, method=6)
    elif name.startswith(LOSSLESS_PREFIX) and max(im.size) <= 900: im.save(f'{O}/{name}.webp', 'WEBP', lossless=True, method=6)
    else: im.save(f'{O}/{name}.webp', 'WEBP', quality=90, method=6)
    done.append(name)
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name.endswith('-mask'): continue
    im = Image.open(f).convert('RGBA')
    if name == 'card':
        os.makedirs('images/skins/blip/space-age', exist_ok=True)
        im.convert('RGB').resize((256, 256), Image.LANCZOS).save('images/skins/blip/space-age/card.webp', 'WEBP', quality=88, method=6); continue
    if name == 'background':
        save(im.resize(Image.open(f'{L}/background.webp').size, Image.LANCZOS) if im.size != (1290, 2796) else im, name); continue
    ref = f'{L}/{BORROW.get(name, name)}.webp'
    if name in CUSTOM or not os.path.exists(ref):
        if name in CUSTOM: im = im.crop(bbox(im, 24))
        save(im, name)
        if name == 'card-tail':   # 9-sliced by the Space-Age CSS: cut to the outline
            save(im.crop(bbox(im, 200)), 'card-tail-tight')
        continue
    base = BORROW.get(name, name)
    if base in PILLS: r = Image.open(ref); h = bbox(r.convert('RGBA'))[3] - bbox(r.convert('RGBA'))[1]; out = refit(im, ref, 'nine', (h / 2, 0, h / 2, 0))
    elif base in SLICES: out = refit(im, ref, 'nine', SLICES[base])
    elif base in PLAIN: out = refit(im, ref, 'plain')
    else: out = refit(im, ref, 'contain')
    save(out, name)
    if base in PLAIN:   # -tight: the card cut to its outline, in Logo Classic's -tight canvas
        # Logo Classic's -tight = outline box (y 5-673 of 712) + its drop shadow below: cut ours the same way
        l, t, r_, b = bbox(im, 200); tight = im.crop((l, t, r_, min(im.height, b + round((b - t) * 0.058)))); tref = f'{L}/{base}-tight.webp'
        if os.path.exists(tref): save(refit(tight, tref, 'plain'), name + '-tight')
    if name == 'avatar-frame':
        w, h = out.size; bw = out.getchannel('A').point(lambda v: 255 if v > 60 else 0)
        ImageDraw.floodfill(bw, (w // 2, h // 2), 128); l, t, r_, b = bw.point(lambda v: 255 if v == 128 else 0).getbbox()
        m = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(m).ellipse((l * 2, t * 2, r_ * 2, b * 2), fill=255)
        o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); save(o, 'avatar-mask')
        print(f'avatar window {l} {t} {r_} {b} of {w}x{h}')
# orbit-gold (Group Coins ring, group concept) = the painted orange orbit recoloured to the coin gold
from PIL import ImageOps
og = Image.open(f'{K}/orbit-orange.png').convert('RGBA'); og = og.crop(bbox(og, 24)); a = og.getchannel('A')
g = ImageOps.colorize(ImageOps.autocontrast(ImageOps.grayscale(og.convert('RGB')), cutoff=1), (0xc8, 0x8a, 0x08), (0xff, 0xd8, 0x5a)).convert('RGBA'); g.putalpha(a)
save(g, 'orbit-gold')
# panel-tan-tight (inner post cards inside the teal Group Posts frame, group concept) = the card with its orange rim turned warm tan
import colorsys
pt = Image.open(f'{O}/panel-card-tight.webp').convert('RGBA'); px = pt.load()
for y in range(pt.height):
    for x in range(pt.width):
        r, g, b, al = px[x, y]
        if al < 8: continue
        h, sat, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if sat > 0.35 and 0.02 < h < 0.13:
            t = min(1, (sat - 0.35) / 0.4); tr, tg, tb = 0xcd, 0xb4, 0x8e
            px[x, y] = (round(r + (tr * v / 0.93 - r) * t), round(g + (tg * v / 0.93 - g) * t), round(b + (tb * v / 0.93 - b) * t), al)
save(pt, 'panel-tan-tight')
print('art:', json.dumps(sorted(set(done))))
