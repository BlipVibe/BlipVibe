"""Space-Age Pop chrome, drawn to the concept (owner, Nov 21: "ours do not look the same as the concept specifically the shape
and color"). The Codex kit came out muted and thin-rimmed; these pieces are drawn with colours SAMPLED from the concept
(images/skins/blip/ref/space-age/home-a.png) and rim weights / corner radii MEASURED there, converted through the slice scale
the CSS uses for each piece (pt on screen = px x border-image-width / slice). Canvases stay Logo Classic's (geometry rule).
Run from the repo root after space_age_convert.py (it calls this at the end). Writes images/skins/blip/assets/space-age/*.webp."""
from PIL import Image, ImageDraw, ImageFilter
O = 'images/skins/blip/assets/space-age'
SS = 3  # supersampling

# sampled from the concept (home-a / group-a / notifications-a crops)
OR_EDGE, OR_HI, OR_BODY, OR_LO, OR_DARK = (208, 81, 0), (250, 150, 70), (238, 108, 8), (229, 99, 3), (196, 78, 0)
TE_EDGE, TE_HI, TE_BODY, TE_LO, TE_DARK = (8, 96, 92), (61, 169, 170), (16, 131, 127), (13, 118, 113), (2, 84, 78)
TEAL_LINE, TEAL_LINE_HI = (70, 152, 146), (150, 205, 198)
TAN_LINE = (206, 178, 136)
CREAM, CREAM_HI, CREAM_LO = (254, 234, 203), (255, 246, 222), (247, 222, 186)
PEACH = (255, 224, 192)


def rr_mask(size, box, r):
    m = Image.new('L', (size[0] * SS, size[1] * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([v * SS for v in box], radius=r * SS, fill=255)
    return m


def vgrad(size, stops):
    """vertical gradient over the whole canvas; stops = [(t 0..1, rgb)]"""
    w, h = size[0] * SS, size[1] * SS
    g = Image.new('RGB', (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / max(1e-6, t1 - t0)
                g.putpixel((0, y), tuple(round(a + (b - a) * k) for a, b in zip(c0, c1)))
                break
    return g.resize((w, h))


def layer(base, size, box, r, fill):
    """paint `fill` (rgb tuple or gradient image at SS) inside the rounded box onto base (RGBA at SS)"""
    m = rr_mask(size, box, r)
    src = fill if isinstance(fill, Image.Image) else Image.new('RGB', m.size, fill)
    base.paste(src, (0, 0), m)


def inset(box, d): return (box[0] + d, box[1] + d, box[2] - d, box[3] - d)


def finish(im, size): return im.resize(size, Image.LANCZOS)


def card(size, box, r, rim, kind='orange', fill=CREAM, shadow_to=None, edge=None):
    """retro console card: outer dark edge, glossy rim, thin dark inner line, cream highlight, cream fill."""
    W, H = size
    im = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    if shadow_to:   # soft warm drop shadow below the card (Logo Classic -tight canvases keep a shadow strip)
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
        sm = rr_mask(size, (box[0] + 6, box[1] + 10, box[2] - 6, min(shadow_to, box[3] + (shadow_to - box[3]) * .8)), r)
        sh.paste(Image.new('RGBA', im.size, (150, 82, 30, 70)), (0, 0), sm)
        sh = sh.filter(ImageFilter.GaussianBlur(7 * SS))
        im.alpha_composite(sh)
    e = edge if edge is not None else max(1.5, rim * .12)
    if kind == 'orange':
        layer(im, size, box, r, OR_EDGE)
        layer(im, size, inset(box, e), r - e, vgrad(size, [(0, OR_HI), (.04, OR_BODY), (.5, OR_BODY), (.96, OR_LO), (1, OR_DARK)]))
        layer(im, size, inset(box, rim - e), r - rim + e, OR_DARK)
    elif kind == 'teal':
        layer(im, size, box, r, TEAL_LINE_HI)
        layer(im, size, inset(box, e), r - e, TEAL_LINE)
        layer(im, size, inset(box, rim - e), r - rim + e, TEAL_LINE_HI)
    else:  # tan
        layer(im, size, box, r, (232, 210, 176))
        layer(im, size, inset(box, e), r - e, TAN_LINE)
    ib = inset(box, rim)
    layer(im, size, ib, max(2, r - rim), CREAM_HI)
    layer(im, size, inset(ib, max(1.5, rim * .12)), max(2, r - rim - 2), vgrad(size, [(0, fill), (1, tuple(max(0, c - 6) for c in fill))]))
    return finish(im, size)


def pill(size, box, kind, outline=None, line=0):
    """glossy pill: dark bottom lip, vivid body, light top band; or a cream pill with a coloured outline."""
    W, H = size
    im = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    r = (box[3] - box[1]) / 2
    if kind in ('orange', 'teal'):
        E, HI, BODY, LO, DARK = (OR_EDGE, OR_HI, OR_BODY, OR_LO, OR_DARK) if kind == 'orange' else (TE_EDGE, TE_HI, TE_BODY, TE_LO, TE_DARK)
        y0, y1 = box[1] / H, box[3] / H
        layer(im, size, box, r, E)
        b2 = inset(box, 2.5)
        layer(im, size, b2, r - 2.5, vgrad(size, [(0, HI), (y0 + (y1 - y0) * .12, BODY), (y0 + (y1 - y0) * .55, BODY), (y0 + (y1 - y0) * .82, LO), (1, DARK)]))
        # bottom lip (darker band along the bottom ~10%)
        lip = Image.new('RGBA', im.size, (0, 0, 0, 0))
        m = rr_mask(size, b2, r - 2.5); cut = Image.new('L', m.size, 0)
        ImageDraw.Draw(cut).rectangle([0, (box[3] - (box[3] - box[1]) * .14) * SS, W * SS, H * SS], fill=255)
        from PIL import ImageChops
        lip.paste(Image.new('RGBA', im.size, DARK + (255,)), (0, 0), ImageChops.multiply(m, cut))
        im.alpha_composite(lip)
        # soft white sheen in the top third
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); bh = box[3] - box[1]
        sb = (box[0] + r * .55, box[1] + bh * .1, box[2] - r * .55, box[1] + bh * .38)
        sh.paste(Image.new('RGBA', im.size, (255, 255, 255, 70)), (0, 0), rr_mask(size, sb, (sb[3] - sb[1]) / 2))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(1.5 * SS)))
    else:   # cream pill with an outline colour
        layer(im, size, box, r, outline)
        b2 = inset(box, line)
        layer(im, size, b2, r - line, CREAM_HI)
        layer(im, size, inset(b2, 2), r - line - 2, vgrad(size, [(0, (255, 244, 226)), (1, (251, 232, 204))]))
    return finish(im, size)


def tv_foot():
    """one stubby orange TV foot (trapezoid, rounded), 120x70; the CSS places two under the TV card."""
    W, H = 120, 70
    im = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = [(14, 0), (106, 0), (86, 62), (34, 62)]
    d.polygon([(x * SS, y * SS) for x, y in pts], fill=OR_EDGE)
    pts2 = [(22, 0), (98, 0), (81, 55), (39, 55)]
    d.polygon([(x * SS, y * SS) for x, y in pts2], fill=OR_BODY)
    d.polygon([(x * SS, y * SS) for x, y in [(30, 0), (52, 0), (47, 40), (40, 40)]], fill=OR_HI)
    return im.filter(ImageFilter.GaussianBlur(.6 * SS)).resize((W, H), Image.LANCZOS)


def save(im, name, q=92): im.save(f'{O}/{name}.webp', 'WEBP', quality=q, method=6); return name


def build():
    out = []
    # panel-card-tight (721x712; CSS slice 60 -> 17px, so 1pt = 3.53px): outline box y 5-673 + shadow strip, rim 7pt, radius 17pt
    k = 60 / 17
    for name, kind, fill, rim in [('panel-card-tight', 'orange', CREAM, 7), ('panel-card-active-tight', 'orange', PEACH, 7),
                                  ('panel-teal-tight', 'teal', CREAM, 3.4), ('panel-tan-tight', 'tan', CREAM, 2.6)]:
        out.append(save(card((721, 712), (2, 4, 719, 673), 17 * k - 1, rim * k, kind, fill, shadow_to=708), name))
    # plain panel-card (768; slice 12% = 92px -> 14px: 1pt = 6.6px)
    k2 = 92 / 14
    out.append(save(card((768, 768), (23, 20, 741, 728), 13 * k2, 6 * k2, 'orange', CREAM, shadow_to=740), 'panel-card'))
    out.append(save(card((768, 768), (23, 20, 741, 728), 13 * k2, 6 * k2, 'orange', PEACH, shadow_to=740), 'panel-card-active'))
    out.append(save(card((768, 768), (23, 20, 741, 728), 13 * k2, 3 * k2, 'teal', CREAM, shadow_to=740), 'panel-teal'))
    # TV card (card-tail-tight 756x751; Space-Age CSS slices 130 130 190 130 / 31 31 45 31 -> 1pt = 4.2px):
    # rim 10pt, radius 28pt, the body ends at y 690 (transparent strip below holds the feet, which are placed separately)
    k3 = 130 / 31
    out.append(save(card((756, 751), (2, 2, 754, 690), 28 * k3, 9.5 * k3, 'orange', CREAM, edge=1.2 * k3), 'card-tail-tight'))
    out.append(save(tv_foot(), 'tv-foot'))
    # pills (Logo Classic canvases + boxes)
    out.append(save(pill((563, 134), (1, 1, 562, 127), 'orange'), 'btn-primary'))
    out.append(save(pill((563, 134), (1, 1, 562, 127), 'teal'), 'btn-teal'))
    out.append(save(pill((591, 151), (1, 1, 590, 150), 'orange'), 'chip-active'))
    out.append(save(pill((577, 144), (1, 1, 576, 143), 'orange'), 'heading-tab'))
    out.append(save(pill((592, 152), (1, 1, 591, 151), 'cream', TE_BODY, 13), 'chip'))
    out.append(save(pill((590, 148), (1, 1, 589, 147), 'cream', OR_BODY, 13), 'btn-secondary'))
    out.append(save(pill((591, 148), (1, 1, 590, 147), 'cream', (215, 53, 43), 13), 'btn-danger'))
    out.append(save(pill((889, 129), (1, 1, 888, 128), 'cream', TE_BODY, 10), 'field'))
    out.append(save(pill((1187, 129), (1, 1, 1186, 128), 'cream', TAN_LINE, 8), 'tabs-track'))
    out.append(save(pill((700, 130), (29, 5, 672, 125), 'cream', (240, 205, 165), 5), 'menu-row-on'))
    # sheet (300x300, open bottom, 70 70 0 70 / 22px): cream with a thin tan rim
    sh = card((300, 400), (5, 4, 295, 396), 70, 9, 'tan', CREAM).crop((0, 0, 300, 300)); out.append(save(sh, 'sheet'))
    return out


if __name__ == '__main__':
    print(build())
