# Anime Blaze extras set 1 — comic UI pieces matching the concept (illustrated, not realistic)

Targets (study closely): images/skins/anime-blaze/concept-v1-approved.png (sheet 1) and
images/skins/anime-blaze/concept-2.png (sheet 2). Existing base kit for palette/style:
images/skins/anime-blaze/kit/*.png and assets/*.webp (icons are approved — match their ink style).

Style: NOT realistic — match the concept's clean, bold comic/anime UI art exactly (same as the approved
base kit): crisp black ink outlines, slanted panel geometry, flat dark charcoal fills (#141414–#1e1e1e)
with light halftone/screentone where the concept has it, red #e8321e → orange #ff8a1c flame streaks and
speed lines, white or gold inner keylines. The pieces should look like the concept's panels, not like
plain rounded CSS rectangles — but drawn/illustrated, not photographic.
No text. Real alpha transparency outside the shapes.

9-slice rules: corners (including the slant and any flame flicks) live inside the border zone; the
edges between corners REPEAT seamlessly; the centre tiles. State-of-the-art seamless joins.

Deliver into images/skins/anime-blaze/kit/extras1/ :

| file | size | what |
|---|---|---|
| panel9.png | 1000x1000 | Big slanted manga panel (quests, featured skin, composer, post backing): dark halftone fill, thick ink outline, thin white keyline inside, a flame flick on top-left and bottom-right corners. 150px border zone. |
| panel9-alt.png | 1000x1000 | Same panel, gold keyline + flame on top-right (variety for posts). 150px border zone. |
| row9.png | 1200x300 | List row (messages, notifications, groups, people): slanted dark strip, ink outline, white keyline, small flame flick at one end. 120px L/R, 90px T/B. |
| row9-hot.png | 1200x300 | Same row with a red-orange edge glow (unread / active). |
| bubble9-dark.png | 800x320 | Chat speech bubble (incoming): slanted dark comic balloon, white ink outline, small tail bottom-left. 110px border zone. |
| bubble9-red.png | 800x320 | Outgoing bubble: red-orange gradient balloon with ink outline, tail bottom-right. 110px border zone. |
| label9.png | 800x260 | Page title plate (Groups / Messages / Network…): slanted black banner with flame streaks trailing right. 90px border zone. |
| button9-red.png | 800x240 | Primary button (Edit Profile, Post, Join, Follow): slanted red-orange plate, ink outline, speed lines, slight gloss. 80px border zone. |
| button9-dark.png | 800x240 | Secondary button / field: slanted dark plate, white keyline. 80px border zone. |
| chip9.png | 600x200 | Tab chip (Following / Discover / My Posts…): small slanted dark tag, white keyline. 70px border zone. |
| chip9-active.png | 600x200 | Active tab: slanted red-orange tag with flame flick. 70px border zone. |
| field9.png | 900x220 | Text field (search, "Type a message…", comment): slanted dark field, thin white keyline. 80px border zone. |
| banner.png | 1290x420 | Top bar: dark manga strip with red-orange flame streaks bursting from the left, halftone, jagged ink bottom edge. Calm middle band for the logo/icons. Transparent below the bottom edge only. |
| navbar.png | 1290x300 | Bottom bar: dark strip, ink top edge with a flame flick, halftone. Full width. |
| nav-active.png | 300x240 | Active bottom-tab tile: slanted red-orange plate with speed lines. |
| cover-frame.png | 1200x800 | Profile cover: slanted manga panel frame (thick ink + white keyline + flame flicks) around a fully transparent window, like the concept Profile. |
| avatar-ring.png | 600x600 | Round avatar ring: red ring with black ink outline and a small flame flick, transparent centre. |
| track.png / fill.png | 1000x80 each | Quest progress bar: dark slanted track; red-orange segmented fill. |
| coin-pill.png | 500x180 | Coin balance / reward pill: dark slanted tag with gold keyline. 60px border zone. |
| burst.png | 600x600 | Comic impact burst (orange/red/yellow) decoration. |

Verify sizes, alpha, seamless edge tiling (tile edges 3x, check joins); show a contact sheet on a dark
background.
