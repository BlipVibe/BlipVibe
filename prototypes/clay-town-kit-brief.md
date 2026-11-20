# Clay Town (Blip Vibe `clay-town` of the default skin `blip`) — production art kit

Owner rules: 1:1 to the concepts, "almost no CSS visuals" (every visual is painted art, CSS only places it), the
mascot has NO arms/hands/body/legs. Concepts (local only, gitignored): `images/skins/default/clay-town/<page>.png`
(style truth: `images/skins/default/clay-town/_style/home.png`).

## The one rule that makes the build work: SAME GEOMETRY AS LOGO CLASSIC
Every piece below already exists for Logo Classic at `images/skins/blip/kit/<name>.png`, and the app's CSS is tuned to
those pieces (9-slice percentages, windows, insets). So each Clay Town piece MUST:
- have EXACTLY the same canvas size as the Logo Classic piece (column `size`);
- put the visible shape in the same box (column `bbox` = left, top, right, bottom of the opaque pixels, alpha > 40)
  within ±2% — same corner radius zone, same window position and size for frames/rings;
- keep 9-slice pieces' long edges plain and uniform (only the corners carry shape), so they stretch cleanly;
- have REAL transparent alpha outside the shape (never a painted checkerboard), transparent windows in frames.
Open the Logo Classic piece first, measure it with PIL, then paint the clay version, then resize/fit it into that box.

## Look (copy the concepts)
Soft matte polymer clay / plasticine, hand-modelled: chunky rounded shapes, faint fingerprint/press texture, soft
top-left studio light and a gentle contact shadow (kept inside the canvas). NOT glossy, NOT glass, NOT flat vector.
Palette: terracotta #D6704E (deep #B9583A) for bars, rims, active outlines · cream clay #F6E7CC (cards, light
#FBF1DE) · sage green #9CCB8E (deep #6FA864) · butter yellow #F7D774 (deep #E9B949) · gold coin #F2C230 with amber
rim · chocolate brown #5A2E1E (line icons, outlines on small pieces) · danger red #D9483B · grey clay #CFC6BA (disabled).
Page background = soft peach-terracotta.

## Rules
- NO text, letters or numbers in any piece (the app supplies them). NO photos or people.
- Icons: chunky rounded clay line icons in chocolate brown #5A2E1E (the "-on" nav set: the same icons, brown, they sit
  on a butter-yellow tile); consistent weight; razor-sharp edges; centred like the Logo Classic icon.
- Liked/disliked ON = filled sage-green clay thumb with brown outline (clearly filled).
- Mascot: the BlipVibe logo character (`images/skins/blip/kit/mascot.png` = the on-model original) re-modelled in
  blue clay: same bubble silhouette, face, white headphones, bubble tail, two yellow sparkles. NO ARMS, NO HANDS, NO
  BODY, NO LEGS, nothing below the bubble tail. Poses only from tilt, bounce, squash, expression, bursts, sparkles.
  Match each Logo Classic mascot file's pose and framing.

## Pieces (name | Logo Classic canvas | Logo Classic opaque bbox | Clay Town look)
| name | size | bbox |
|---|---|---|
| avatar-frame | 640x640 | (23, 20, 617, 620) |
| avatar-ring | 300x300 | (9, 8, 291, 292) |
| background | 1290x2796 | (0, 0, 1290, 2796) |
| badge-commenter | 200x250 | (10, 16, 190, 233) |
| badge-count | 120x120 | (3, 3, 117, 117) |
| badge-early_adopter | 200x250 | (10, 16, 190, 234) |
| badge-first_post | 200x250 | (10, 15, 190, 234) |
| badge-generous | 200x250 | (10, 15, 190, 235) |
| badge-group_leader | 200x250 | (10, 15, 190, 235) |
| badge-photographer | 200x250 | (10, 15, 190, 234) |
| badge-popular | 200x250 | (10, 13, 190, 236) |
| badge-skin_collector | 200x250 | (10, 15, 190, 234) |
| badge-social_butterfly | 200x250 | (10, 14, 190, 235) |
| badge-streak_master | 200x250 | (10, 14, 190, 236) |
| bar-fill | 895x55 | (0, 0, 895, 55) |
| bar-track | 892x54 | (0, 0, 892, 54) |
| blip-btn-on | 383x154 | (0, 0, 383, 154) |
| blip-btn | 380x143 | (0, 0, 380, 139) |
| btn-danger | 591x148 | (0, 0, 591, 147) |
| btn-disabled | 590x151 | (0, 0, 590, 150) |
| btn-primary | 563x134 | (0, 0, 563, 127) |
| btn-round | 200x200 | (12, 5, 188, 191) |
| btn-secondary | 590x148 | (0, 0, 590, 148) |
| btn-square | 200x200 | (10, 8, 189, 187) |
| bubble-in | 600x300 | (15, 14, 586, 287) |
| bubble-out | 600x300 | (11, 11, 589, 285) |
| burst | 300x300 | (12, 40, 288, 260) |
| camera-badge | 160x160 | (5, 4, 155, 156) |
| chip-active | 591x151 | (0, 0, 591, 151) |
| chip | 592x152 | (0, 0, 592, 152) |
| coin-pill | 451x126 | (0, 0, 451, 126) |
| coin-stack | 300x260 | (7, 6, 294, 254) |
| coin | 200x200 | (5, 5, 195, 192) |
| divider | 900x12 | (2, 2, 898, 9) |
| field | 889x129 | (0, 0, 889, 129) |
| group-avatar-frame | 640x640 | (23, 20, 617, 620) |
| header-bar | 1256x260 | (0, 0, 1256, 260) |
| icon-back | 256x256 | (28, 45, 227, 212) |
| icon-bag | 256x256 | (35, 28, 221, 228) |
| icon-bell | 256x256 | (39, 28, 217, 228) |
| icon-block | 256x256 | (29, 28, 226, 228) |
| icon-bookmark | 256x256 | (45, 28, 210, 228) |
| icon-calendar | 256x256 | (31, 28, 225, 228) |
| icon-camera | 256x256 | (29, 42, 228, 214) |
| icon-check | 256x256 | (29, 57, 227, 198) |
| icon-chevron | 256x256 | (73, 28, 183, 228) |
| icon-clock | 256x256 | (32, 31, 224, 225) |
| icon-close | 256x256 | (41, 42, 214, 212) |
| icon-coin | 256x256 | (29, 28, 226, 228) |
| icon-comment | 256x256 | (28, 38, 228, 218) |
| icon-compass | 256x256 | (21, 19, 235, 237) |
| icon-compose | 256x256 | (28, 31, 228, 224) |
| icon-crown | 256x256 | (19, 52, 237, 203) |
| icon-dislike-on | 256x256 | (28, 38, 228, 217) |
| icon-dislike | 256x256 | (29, 36, 228, 220) |
| icon-edit | 256x256 | (29, 30, 228, 227) |
| icon-emoji | 256x256 | (29, 28, 227, 228) |
| icon-envelope | 256x256 | (19, 60, 237, 195) |
| icon-exit | 256x256 | (31, 28, 225, 228) |
| icon-fire | 256x256 | (44, 30, 212, 226) |
| icon-flag-red | 256x256 | (48, 28, 208, 228) |
| icon-flag | 256x256 | (29, 28, 226, 227) |
| icon-font | 256x256 | (28, 68, 228, 187) |
| icon-gif | 256x256 | (28, 63, 228, 192) |
| icon-gift | 256x256 | (28, 30, 228, 224) |
| icon-globe | 256x256 | (30, 28, 226, 228) |
| icon-groups-on | 256x256 | (28, 59, 228, 196) |
| icon-groups | 256x256 | (28, 59, 228, 196) |
| icon-hanger | 256x256 | (19, 39, 237, 217) |
| icon-heart | 256x256 | (28, 40, 228, 217) |
| icon-home-on | 256x256 | (28, 30, 228, 225) |
| icon-home | 256x256 | (28, 30, 228, 225) |
| icon-image | 256x256 | (28, 49, 228, 207) |
| icon-info | 256x256 | (29, 28, 226, 228) |
| icon-like-on | 256x256 | (28, 36, 228, 220) |
| icon-like | 256x256 | (29, 36, 228, 219) |
| icon-link | 256x256 | (29, 28, 227, 228) |
| icon-logout | 256x256 | (30, 28, 226, 228) |
| icon-messages-on | 256x256 | (28, 37, 228, 218) |
| icon-messages | 256x256 | (28, 38, 228, 218) |
| icon-mic | 256x256 | (59, 28, 197, 228) |
| icon-more | 256x256 | (28, 101, 227, 154) |
| icon-music | 256x256 | (28, 30, 228, 225) |
| icon-mute | 256x256 | (34, 28, 222, 228) |
| icon-network-on | 256x256 | (28, 38, 228, 218) |
| icon-network | 256x256 | (28, 38, 228, 218) |
| icon-people | 256x256 | (28, 49, 228, 206) |
| icon-phone | 256x256 | (30, 28, 226, 228) |
| icon-photo | 256x256 | (28, 43, 228, 212) |
| icon-plus | 256x256 | (28, 30, 228, 225) |
| icon-poll | 256x256 | (28, 28, 228, 228) |
| icon-reply | 256x256 | (28, 35, 228, 220) |
| icon-scroll | 256x256 | (28, 36, 228, 220) |
| icon-search | 256x256 | (29, 28, 227, 228) |
| icon-seen | 256x256 | (27, 64, 228, 192) |
| icon-send | 256x256 | (28, 34, 228, 221) |
| icon-settings | 256x256 | (29, 28, 227, 228) |
| icon-share | 256x256 | (28, 50, 228, 206) |
| icon-skins-on | 256x256 | (31, 28, 225, 228) |
| icon-skins | 256x256 | (31, 28, 225, 228) |
| icon-star | 256x256 | (28, 31, 228, 226) |
| icon-user-plus | 256x256 | (28, 41, 228, 214) |
| icon-user | 256x256 | (34, 28, 221, 228) |
| icon-video | 256x256 | (28, 61, 228, 194) |
| mascot-head-plain | 400x400 | (13, 52, 387, 348) |
| mascot-head | 256x256 | (5, 40, 251, 215) |
| mascot-jump | 900x900 | (124, 173, 786, 713) |
| mascot-page-happy | 900x560 | (77, 42, 823, 518) |
| mascot-page-smile | 900x560 | (77, 42, 824, 518) |
| mascot-page-wink | 900x560 | (77, 42, 823, 518) |
| mascot-peek | 900x900 | (157, 152, 735, 717) |
| mascot-sleep | 800x800 | (32, 104, 767, 695) |
| mascot-wave | 900x900 | (98, 187, 803, 672) |
| mascot | 800x800 | (33, 138, 767, 661) |
| menu-check | 120x120 | (6, 5, 114, 115) |
| menu-panel | 818x1208 | (0, 2, 818, 1208) |
| menu-row-on | 700x130 | (29, 5, 672, 125) |
| nav-active | 240x210 | (5, 7, 235, 199) |
| nav-bar | 1209x170 | (0, 0, 1209, 170) |
| notif-comment | 200x200 | (23, 22, 177, 178) |
| notif-follow | 200x200 | (22, 22, 177, 178) |
| notif-group | 200x200 | (23, 22, 177, 178) |
| notif-like | 200x200 | (22, 22, 177, 178) |
| notif-message | 200x200 | (23, 22, 177, 178) |
| notif-purchase | 200x200 | (23, 22, 177, 178) |
| panel-card-active-tight | 721x712 | (2, 2, 721, 712) |
| panel-card-active | 768x768 | (23, 20, 745, 734) |
| panel-card-tight | 721x712 | (2, 2, 720, 712) |
| panel-card | 768x768 | (23, 20, 741, 736) |
| quest-comment | 200x200 | (22, 34, 178, 166) |
| quest-like | 200x200 | (22, 31, 178, 168) |
| quest-message | 200x200 | (22, 23, 178, 176) |
| quest-post | 200x200 | (22, 22, 177, 178) |
| quest-react | 200x200 | (22, 27, 178, 173) |
| quest-save | 200x200 | (35, 22, 164, 178) |
| quest-share | 200x200 | (25, 22, 175, 178) |
| quest-view | 200x200 | (22, 50, 178, 149) |
| reward-chip | 249x129 | (0, 1, 249, 129) |
| sheet | 300x300 | (5, 4, 295, 300) |
| sparkle-1 | 200x200 | (21, 8, 179, 192) |
| sparkle-2 | 200x200 | (8, 9, 192, 191) |
| story-add | 160x160 | (5, 5, 155, 155) |
| story-ring-seen | 400x400 | (13, 10, 387, 389) |
| story-ring | 400x400 | (10, 11, 390, 388) |
| swatch-ring | 160x160 | (5, 5, 154, 154) |
| tabs-track | 1187x129 | (0, 0, 1187, 129) |
| unread-dot | 60x60 | (2, 2, 58, 58) |
## Look per piece (Logo Classic → Clay Town)
- background: opaque soft peach-terracotta clay #F1C2AE surface, faint press texture, a few tiny clay sparkles and
  clay pebbles/grass tufts low in the corners, calm in the middle.
- header-bar: terracotta clay band (#D6704E, lighter top edge, soft shadow at the bottom), plain.
- nav-bar: cream clay bar with a terracotta rim along the top, plain. nav-active: butter-yellow clay tile.
- panel-card / -tight: cream clay card with a thick terracotta clay rim (like the concept cards). -active: same, the
  centre light butter #FCEFC4. card-tail / -tight / card-tailtip: the card + small clay speech tail bottom-right.
- chip: cream clay pill, thin terracotta rim. chip-active: terracotta clay pill (concept active feed tab).
- btn-primary: butter-yellow clay pill. btn-secondary: cream pill, terracotta rim. btn-danger: cream pill, red rim.
  btn-disabled: grey clay pill. btn-round / btn-square: small cream clay circle / rounded square, brown rim.
- field: light cream clay pill, recessed (inset shadow), thin tan rim. tabs-track: cream clay strip, terracotta rim.
- bar-track: recessed tan clay groove. bar-fill: sage-green clay bar (concept quest bars).
- coin / icon-coin / coin-stack: gold clay coins. coin-pill: butter clay pill. reward-chip: light butter clay chip.
- badge-count: red clay disc with cream ring. unread-dot: terracotta dot. divider: thin tan clay rope.
- quest-*: chocolate line icon on a little terracotta clay pot/tile like the concept's quest icons.
- notif-*: cream line icon inside a small terracotta clay disc.
- badge-* (profile medals): clay medals in the same shapes/colour roles as Logo Classic's, in clay.
- blip-btn: sage-green clay pill (left part plain for the mascot head). blip-btn-on: deeper sage, pressed.
- menu-panel: cream clay panel with terracotta rim and a terracotta clay strip down the left ~20%.
  menu-row-on: light butter clay bar. menu-check: sage clay disc with cream check. swatch-ring: cream clay ring.
- avatar-frame / group-avatar-frame: thick terracotta clay ring with a cream inner lip (concept profile ring).
  avatar-ring: thin terracotta clay ring. story-ring: sage-green clay ring. story-ring-seen: tan clay ring.
  story-add: sage clay "+" badge. camera-badge: cream clay disc with brown camera icon.
- bubble-in: cream clay chat bubble. bubble-out: butter-yellow clay chat bubble (tails as in Logo Classic).
- sheet: cream clay square pad. sparkle-1/2, burst: yellow clay sparkles / burst lines.
- mascot*, mascot-page-* : clay mascot, same pose/framing as Logo Classic (mascot-page-*: mascot peeking over a
  little clay grass mound, like the concept Group page).
- card (store/menu card, 256x256 → paint 1024x1024): full-bleed clay diorama scene with the clay mascot head in a
  little clay town (no text).
