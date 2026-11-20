"""Swiss Grid (Blip Vibe look 'swiss-grid'): the flat geometric kit pieces, drawn pixel-exact (the look IS geometry:
paper white, 1.5pt ink rules, one electric blue). Writes PNGs into images/skins/blip/kit/swiss-grid/ (gitignored);
swiss_grid_convert.py turns the kit into assets/swiss-grid/*.webp. Run from the repo root.
Rect pieces: 96x96, outline 6px -> 9-slice with slice 16 at border-image-width 4px = a 1.5px line on screen."""
import os
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit/swiss-grid'; os.makedirs(K, exist_ok=True)
PAPER = (250, 250, 247, 255); INK = (10, 10, 10, 255); BLUE = (31, 77, 255, 255); GREY = (217, 217, 212, 255)
PALE = (238, 242, 255, 255); WHITE = (255, 255, 255, 255); CLEAR = (0, 0, 0, 0)
def rect(name, fill, line=None, w=96, h=96, t=6):
    im = Image.new('RGBA', (w, h), fill); d = ImageDraw.Draw(im)
    if line: d.rectangle((0, 0, w - 1, h - 1), outline=line, width=t)
    im.save(f'{K}/{name}.png')
for n in ('panel-card', 'panel-card-tight', 'chip', 'btn-secondary', 'btn-danger', 'btn-round', 'btn-square', 'field',
          'tabs-track', 'sheet', 'bubble-in', 'card-tail', 'card-tail-tight', 'blip-btn', 'menu-panel-body'):
    rect(n, PAPER, INK)
rect('panel-card-active', PALE, INK); rect('panel-card-active-tight', PALE, INK)
for n in ('chip-active', 'btn-primary', 'nav-active', 'blip-btn-on', 'bubble-out'): rect(n, BLUE)
rect('btn-disabled', GREY); rect('menu-row-on', PALE)
rect('reward-chip', CLEAR)                     # the reward sits in its own ruled cell, no chip
rect('bar-track', GREY, w=96, h=12, t=0); rect('bar-fill', BLUE, w=96, h=12, t=0)
# top bar: paper with a 1.5pt rule along the bottom (96 x 96, slice 0 0 16 0); bottom nav: rule along the top
im = Image.new('RGBA', (96, 96), PAPER); ImageDraw.Draw(im).rectangle((0, 90, 95, 95), fill=INK); im.save(f'{K}/header-bar.png')
im = Image.new('RGBA', (96, 96), PAPER); ImageDraw.Draw(im).rectangle((0, 0, 95, 5), fill=INK); im.save(f'{K}/nav-bar.png')
im = Image.new('RGBA', (96, 12), CLEAR); ImageDraw.Draw(im).rectangle((0, 3, 95, 8), fill=INK); im.save(f'{K}/divider.png')
Image.new('RGBA', (1290, 2796), PAPER).convert('RGB').save(f'{K}/background.png')
# coin pill: white, slightly rounded (radius = 1/4 height like the concept), 1.5pt ink outline
def rr(name, w, h, r, fill, line=None, t=6):
    big = Image.new('RGBA', (w * 4, h * 4), CLEAR); d = ImageDraw.Draw(big)
    d.rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), r * 4, fill=line or fill)
    if line: d.rounded_rectangle((t * 4, t * 4, w * 4 - 1 - t * 4, h * 4 - 1 - t * 4), max(0, (r - t)) * 4, fill=fill)
    big.resize((w, h), Image.LANCZOS).save(f'{K}/{name}.png')
rr('coin-pill', 192, 96, 24, PAPER, INK)
# rings (transparent round windows) and dots
def ring(name, size, t, color, gap=0, gapcolor=None):
    big = Image.new('RGBA', (size * 4, size * 4), CLEAR); d = ImageDraw.Draw(big); S = size * 4
    d.ellipse((0, 0, S - 1, S - 1), fill=color)
    if gap: d.ellipse((t * 4, t * 4, S - 1 - t * 4, S - 1 - t * 4), fill=gapcolor)
    inner = (t + gap) * 4; d.ellipse((inner, inner, S - 1 - inner, S - 1 - inner), fill=CLEAR)
    big.resize((size, size), Image.LANCZOS).save(f'{K}/{name}.png')
ring('avatar-frame', 640, 8, INK); ring('group-avatar-frame', 640, 8, INK); ring('avatar-ring', 300, 6, INK)
ring('story-ring', 400, 14, BLUE, 10, PAPER); ring('story-ring-seen', 400, 8, GREY, 12, PAPER); ring('swatch-ring', 160, 5, INK)
def disc(name, size, color, ring_t=0, ring_c=None):
    big = Image.new('RGBA', (size * 4, size * 4), CLEAR); d = ImageDraw.Draw(big); S = size * 4
    if ring_t: d.ellipse((0, 0, S - 1, S - 1), fill=ring_c)
    d.ellipse((ring_t * 4, ring_t * 4, S - 1 - ring_t * 4, S - 1 - ring_t * 4), fill=color)
    big.resize((size, size), Image.LANCZOS).save(f'{K}/{name}.png')
disc('badge-count', 120, BLUE, 10, WHITE); disc('unread-dot', 60, BLUE)
# story add: blue disc, white ring, white plus
disc('story-add', 160, BLUE, 12, WHITE); im = Image.open(f'{K}/story-add.png'); d = ImageDraw.Draw(im)
d.rectangle((74, 44, 85, 115), fill=WHITE); d.rectangle((44, 74, 115, 85), fill=WHITE); im.save(f'{K}/story-add.png')
# menu: paper panel, ink outline, blue strip down the left 170px (sharp, like the concept)
im = Image.new('RGBA', (818, 1208), PAPER); d = ImageDraw.Draw(im); d.rectangle((0, 0, 170, 1207), fill=BLUE)
d.rectangle((0, 0, 817, 1207), outline=INK, width=6); im.save(f'{K}/menu-panel.png')
# menu check: blue square, white check
im = Image.new('RGBA', (120, 120), BLUE); ImageDraw.Draw(im).line([(30, 62), (52, 84), (92, 38)], fill=WHITE, width=12, joint='curve'); im.save(f'{K}/menu-check.png')
card_tailtip = Image.new('RGBA', (180, 100), CLEAR); card_tailtip.save(f'{K}/card-tailtip.png')   # Swiss cards have no tail
print('geometry done', len(os.listdir(K)))
