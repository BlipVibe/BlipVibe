"""Superhero: crop the approved concept sheets into 3x screen references.
usage: superhero_crops.py  (run from the repo root) -> prototypes/reference/superhero-{heroes,villains}/<screen>.png"""
import os
from PIL import Image
S1 = ['home', 'skins', 'profile', 'groups', 'post', 'messages', 'chat']
S2 = ['home-full', 'network', 'notifications', 'search', 'group-page', 'other-profile', 'comments', 'create-post', 'story']
BOX = {
 'heroes': {1: [(8,148,348,938),(355,148,702,938),(708,148,1056,938),(3,958,265,1478),(272,958,527,1478),(533,958,787,1478),(795,958,1058,1478)],
            2: [(15,5,360,635),(370,5,712,635),(725,5,1075,635),(15,645,360,1035),(370,645,712,1035),(725,645,1085,1035),(15,1045,360,1405),(370,1045,712,1405),(725,1045,1075,1405)]},
 'villains': {1: [(8,188,345,965),(355,188,692,965),(698,188,1056,965),(5,975,268,1480),(272,975,527,1480),(532,975,786,1480),(790,975,1056,1480)],
            2: [(12,5,350,580),(358,5,700,580),(705,5,1045,580),(12,590,350,985),(358,590,700,985),(705,590,1092,985),(12,995,350,1400),(358,995,700,1400),(705,995,1065,1400)]},
}
for r, sheets in BOX.items():
    out = f'prototypes/reference/superhero-{r}'; os.makedirs(out, exist_ok=True)
    for n, names in ((1, S1), (2, S2)):
        im = Image.open(f'images/skins/superhero/concept-{r}{"" if n == 1 else "-2"}.png').convert('RGB')
        for name, b in zip(names, sheets[n]):
            c = im.crop(b); c = c.resize((c.width * 3, c.height * 3), Image.LANCZOS); c.save(f'{out}/{name}.png')
    print(r, 'done')
