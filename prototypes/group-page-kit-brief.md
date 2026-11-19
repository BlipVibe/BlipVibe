# Group page — production art kit (one Codex job per skin rendition)

The owner approved one Group page concept per rendition (`images/skins/<skin>/group-concept[-<r>].png`, local only:
two phones, TOP + SCROLLED). The owner's rule: build it **1 for 1, no room for interpretation**. So every visual piece
on that concept is painted here as its own clean, high-resolution piece; the app places them with CSS and writes the
real text on top.

## Rules for every piece
- Use your image generation tool (gpt-image). Open the job's concept image FIRST and zoom into each element; copy its
  exact look: material, colours, ornaments, bevels, glow, shadows, line weight, corner shapes, proportions.
- **Transparent PNG with real alpha** (transparent background outside the piece). If your tool cannot give alpha, paint
  the piece on a flat pure **#FF00FF** magenta background instead (no magenta in the piece) and say so in your reply.
- **NO TEXT, NO LETTERS, NO NUMBERS** in any piece (the app writes all text). Icons are drawn without labels.
- Each piece drawn WHOLE, centred, not cropped by the canvas edge, crisp, no blur, no watermark, no mock-up phone.
- "Window" = an area that must be **100% transparent** (the app shows a photo through it). Keep windows closed: the
  frame surrounds them on every side, unless the concept's photo really runs to the edge (then say so).
- Exact canvas sizes below (crop/resize with Python after generating if needed). Save each file under the job's folder.
- Finish with `_sheet.png` (all pieces on a grey checkerboard, labelled by file name in small text) in the same folder.
- Do not edit any other files.

## Pieces (file → size → what, copy it from the concept)
| file | size | what |
|---|---|---|
| gp-head.png | 1290x300 | the TOP title banner behind "← Group Name" (the strip at the top of both phones): its background art and ornaments, no arrow, no text. If the concept's header is just page background + flourishes, paint only those flourishes on transparent. |
| gp-back.png | 180x180 | the back-arrow button in the header, exactly as drawn (button shape + arrow). |
| gp-frame.png | 1290x(height that keeps the concept's proportions, 700–1000) | the HERO frame/ornament around the group cover photo (top phone), with the cover area as a closed transparent WINDOW. Include everything decorative around the cover (arches, candles, roses, lightning, title bar of a window, tape, columns, wings, filigree…) but NOT the round/square group picture frame (piece below) and NOT the cover photo itself. |
| gp-pic-frame.png | 480x480 | the group picture's frame (round ring / square frame / wings around it) with its window transparent. If the concept's frame has wings or flourishes, include them and use 640x480. |
| gp-name-deco.png | 1290x260 | the decoration behind/around the group name + description (plate, ribbon, torn paper label, sparkles, laurels, flourish line), empty where the text goes. Skip this file if the concept shows nothing but text. |
| gp-stats.png | 1200x250 | the stats plate holding Members · Posts · Group Coins: the whole plate with its three cells/dividers, empty (no text, no coin). If the concept shows three separate boxes, draw all three side by side on this one canvas, spaced as in the concept. |
| gp-coin.png | 128x128 | the Group Coins coin icon as drawn. |
| gp-btn-join.png | 600x140 | the primary "Join Group" button, empty (no text). |
| gp-btn-leave.png | 600x140 | the secondary "Leave Group" button, empty. |
| gp-btn-small.png | 600x110 | the smaller "Invite Link" / "Group Rules" button, empty (no icon, no text). |
| gp-icon-invite.png | 160x160 | the chain-link icon on Invite Link, in the concept's colours/style. |
| gp-icon-rules.png | 160x160 | the scroll/list icon on Group Rules, in the concept's colours/style. |
| gp-tab.png | 420x110 | an inactive mode tab (Chat / Group Shop), empty. If the concept draws the three tabs as ONE joined bar, draw one inactive segment so three placed side by side rebuild the bar. |
| gp-tab-active.png | 420x110 | the active tab (Feed), empty. |
| gp-icon-feed.png, gp-icon-chat.png, gp-icon-shop.png | 128x128 | ONLY if the concept's tabs show icons: those three icons. |
| gp-card.png | 1200x380 | the Members card/panel (top phone): its whole frame/panel art INCLUDING its heading strip/ribbon/title bar/laurels if any, empty (no "Members" text, no avatars, no "+42 more"). |
| gp-heading.png | 1200x170 | the "Group Posts" heading decoration (scrolled phone): ribbon/banner/title bar/flourishes, empty. |
| gp-field.png | 1000x130 | the "Post in …" input field on the scrolled phone, empty. |
| gp-ring.png | 240x240 | the ring/frame around ONE member avatar, window transparent. |
| gp-post.png | 1200x900 | the group POST card (scrolled phone, first post): its card/panel art only, empty (no avatar, text, photo, icons). |
| gp-photo-frame.png | 1200x620 | the frame/edge treatment around the post photo inside that card, window transparent (skip if the photo has no visible frame). |

## Jobs
Output folder per job: `images/skins/<skin>/kit/group/<rendition>/` (paths relative to this worktree).
Concept per job: `images/skins/<skin>/group-concept[-<rendition>].png` (left phone = TOP, right = SCROLLED).

| job id | concept | output folder | notes |
|---|---|---|---|
| scrapbook | images/skins/scrapbook/group-concept.png | images/skins/scrapbook/kit/group/scrapbook/ | realistic photographed paper, torn edges, tape, pressed flowers |
| witchcraft | images/skins/witchcraft/group-concept.png | images/skins/witchcraft/kit/group/witchcraft/ | gothic dark wood/bronze, purple glow, candles, cobwebs |
| anime-blaze | images/skins/anime-blaze/group-concept-red.png | images/skins/anime-blaze/kit/group/red/ | clean comic illustration (not realistic), black panels, red/orange lightning |
| good-witch-day | images/skins/good-witch/group-concept-day.png | images/skins/good-witch/kit/group/day/ | lilac glass, gold filigree, sparkles |
| good-witch-night | images/skins/good-witch/group-concept-night.png | images/skins/good-witch/kit/group/night/ | deep violet night, gold filigree, stars |
| vaporwave-retro | images/skins/vaporwave/group-concept-retro.png | images/skins/vaporwave/kit/group/retro/ | 1995 OS windows, navy title bars, grey bevels, marble; Start button emblem = pixel palm over sunset (no OS logos) |
| vaporwave-modern | images/skins/vaporwave/group-concept-modern.png | images/skins/vaporwave/kit/group/modern/ | frosted iridescent glass, cyan/pink |
| vaporwave-retro-dark | images/skins/vaporwave/group-concept-retro-dark.png | images/skins/vaporwave/kit/group/retro-dark/ | dark marble, purple title bars |
| vaporwave-modern-dark | images/skins/vaporwave/group-concept-modern-dark.png | images/skins/vaporwave/kit/group/modern-dark/ | dark blue glass, cyan glow |
| heavens-light-day | images/skins/heavens-light/group-concept-day.png | images/skins/heavens-light/kit/group/day/ | white marble, gold, laurels, wings |
| heavens-light-twilight | images/skins/heavens-light/group-concept-twilight.png | images/skins/heavens-light/kit/group/twilight/ | slate-violet marble, gold |
| blood-moon-crimson | images/skins/blood-moon/group-concept-crimson.png | images/skins/blood-moon/kit/group/crimson/ | crimson velvet, antique silver filigree, red roses, parchment |
| blood-moon-silver | images/skins/blood-moon/group-concept-silver.png | images/skins/blood-moon/kit/group/silver/ | midnight blue, frosty silver, white roses, NO red/pink anywhere |
| superhero-heroes | images/skins/superhero/group-concept-heroes.png | images/skins/superhero/kit/group/heroes/ | golden-age comic: cream halftone panels, yellow/red/blue, thick ink outlines |
| superhero-villains | images/skins/superhero/group-concept-villains.png | images/skins/superhero/kit/group/villains/ | riveted dark metal, purple/toxic green, hazard stripes |
| basic-rose | images/skins/basic/group-concept-rose.png | images/skins/basic/kit/group/rose/ | cream linen/bouclé, blush, light oak, soft daylight |
| basic-pumpkin | images/skins/basic/group-concept-pumpkin.png | images/skins/basic/kit/group/pumpkin/ | cream linen, caramel/pumpkin, oak |
