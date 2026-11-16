"""Blood Moon: crop the approved concept sheets into 3x per-screen references.
usage: blood_moon_crops.py <repo>  -> prototypes/reference/blood-moon-<rendition>/<screen>.png + _crops.jpg
Boxes are in 'display' coords of the sheet scaled to 1100px wide (how they were measured)."""
import sys, os
from PIL import Image
repo = sys.argv[1]
S1 = {'crimson': {'home': (10, 65, 365, 885), 'skins': (372, 65, 722, 885), 'profile': (728, 65, 1095, 885),
                  'groups': (4, 898, 276, 1425), 'post': (279, 898, 548, 1425), 'messages': (551, 898, 820, 1425), 'chat': (822, 898, 1096, 1425)}}
S1['silver'] = S1['crimson']   # same layout as Crimson
S2 = {'home-full': (8, 0, 345, 635), 'search': (8, 640, 345, 955), 'comments': (8, 958, 350, 1239),
      'network': (352, 0, 715, 520), 'group-page': (352, 525, 715, 955), 'create-post': (355, 958, 712, 1239),
      'notifications': (718, 0, 1095, 520), 'other-profile': (705, 525, 1095, 955), 'story': (715, 958, 1095, 1239)}
for r in ('crimson', 'silver'):
    out = os.path.join(repo, 'prototypes/reference/blood-moon-' + r); os.makedirs(out, exist_ok=True)
    thumbs = []
    for sheet, boxes in ((f'concept-{r}.png', S1[r]), (f'concept-{r}-2.png', S2)):
        im = Image.open(os.path.join(repo, 'images/skins/blood-moon', sheet)).convert('RGB'); k = im.width / 1100
        for name, (a, b, c, d) in boxes.items():
            box = tuple(round(v * k) for v in (a, b, c, d))
            cr = im.crop(box); cr = cr.resize((cr.width * 3, cr.height * 3), Image.LANCZOS); cr.save(os.path.join(out, name + '.png'))
            t = cr.copy(); t.thumbnail((220, 420)); thumbs.append((name, t))
    W = 220 * 8; sh = Image.new('RGB', (W, 860), 'white')
    for i, (n, t) in enumerate(thumbs): sh.paste(t, ((i % 8) * 220, (i // 8) * 430))
    sh.save(os.path.join(out, '_crops.jpg'), quality=80); print(out, len(thumbs))
