# #Basic v3 "basic girl" — production kit (owner approved the v3 concepts Nov 19 2026: "Build it")

Targets: `images/skins/basic/concept-v3-<r>.png`, `concept-v3-<r>-2.png`, `concept-v3-<r>-3.png` (read
`prototypes/basic-v3-concept-brief.md` too). Repaint the art pieces the real app uses so it looks exactly like those
concepts: soft warm CREAM cards with a faint ribbed-knit / linen texture, softly EMBOSSED (a lighter top edge, a gentle
inner highlight, a soft warm drop shadow) — matte and cosy, NOT glassy, NOT frosted. Tiny satin bows where listed.

Rules for every piece:
- PNG with REAL transparent alpha around the shape (never a painted checkerboard or backdrop). The shape fills its
  canvas, leaving only ~14px transparent margin for the soft shadow. NO text anywhere (the app writes all text).
- Keep EXACTLY the canvas size given (the app is already laid out for these sizes).
- 9-slice pieces (marked 9s): uniform corners and edges all round, calm plain centre that can stretch.
- Paint each rendition independently into `images/skins/basic/kit/<r>/` (overwrite same-named files):
  `rose` = cream / vanilla + dusty blush #c98f86, rose-gold hairlines, blush satin bows;
  `pumpkin` = cream / oat + caramel #b8754a, gold hairlines, caramel satin bows.

## Pieces
Surfaces
1. `wallpaper.png` 1290x2796 — the page background behind the cards: soft cream linen / knit throw, very calm and
   light, low contrast (rose: blush-cream; pumpkin: warm oat). Opaque.
2. `widget.png` 600x600 (9s) — THE card: cream ribbed-knit card, radius ~66px, embossed edge, soft shadow.
3. `widget-inner.png` 400x400 (9s) — a slightly darker recessed cream well, radius ~44px (inner cards like the "people
   you may know" person cards, the comment/search well).
4. `list-row.png` 1200x230 (9s) — one list row card (a lighter cream bar, radius ~50px) used in lists.
5. `post-card.png` 1200x1100 (9s) — the post card (same look as widget, radius ~66px).
6. `composer.png` 1200x180 (9s) — the "what's on your mind?" bar card.
7. `top-bar.png` 1290x230 (horizontal 9s) — cream embossed top bar, square top, rounded bottom corners ~60px.
8. `dock.png` 1200x300 (9s) — floating cream dock bar, radius ~90px, soft shadow.
9. `menu-panel.png` 600x500 (9s) — small cream menu card (the profile ⋯ menu), radius ~44px, soft shadow.
10. `barista-card.png` 700x900 (9s) — the Barista Bar menu card (rose: faint blush tint; pumpkin: faint caramel tint,
    gold hairline), radius ~60px.

Buttons, pills, fields (all 9s)
11. `pill.png` 400x140 — cream embossed pill (stat chips, secondary buttons "message", "view profile").
12. `pill-on.png` 400x140 — accent pill (rose blush / pumpkin caramel), soft gloss, lighter hairline ("edit profile",
    "follow", "post").
13. `chip.png` 400x120 and `chip-active.png` 400x120 — small filter chips: cream / accent.
14. `seg-tab.png` 520x130 and `seg-tab-active.png` 520x130 — segmented control segment: cream / accent.
15. `follow-btn.png` 520x140, `join-btn.png` 360x130, `action-btn.png` 520x140 — accent pill buttons (same accent pill
    look, those exact sizes).
16. `price-pill.png` 340x110, `reward-chip.png` 220x110, `equipped-tag.png` 340x110, `coin-pill.png` 460x140 — small
    cream pills.
17. `field.png` 800x140 — search / message / comment field: recessed cream pill.

Round pieces
18. `btn-round.png` 180x180 and `round-btn.png` 180x180 — round cream embossed icon button (top-bar buttons, ⋯).
19. `tile.png` 220x220 — inactive dock tile: cream rounded square (radius ~56px), embossed, empty.
20. `tile-on.png` 220x220 — ACTIVE dock tile: accent rounded square with a tiny satin bow on its top edge (the bow stays
    inside the canvas; the square is a little smaller to make room).
21. `avatar-ring.png` 512x512 — THE profile ring: a thick round cream ring (outer diameter ~440px, centred at x=256,
    y=284) with a satin bow sitting on top of the ring (top centre, inside the canvas), soft shadow. The ring's hole is
    a circle of diameter exactly 340px centred at (256, 284) and is fully transparent. Also `avatar-mask.png` 512x512:
    a white disc exactly that hole (diameter 340, centre 256,284) on black.
22. `camera-badge.png` 160x160 — small round cream button for the camera icon.
23. `story-ring.png` 400x400 — thin accent ring (story), transparent centre (hole diameter ~330). `story-add.png`
    400x400 — the same ring around a cream disc (the app draws the "+").
24. `ring-track.png` 300x300 and `ring-fill.png` 300x300 — coin-goal ring: thin oat groove ring / the same ring filled
    in the accent.
25. `badge-count.png` 96x96 — accent count dot. `unread-dot.png` 100x100 — small accent dot (≈40px) centred.
26. `tick-0.png` 120x120 — empty round tick circle (thin espresso outline); `tick-100.png` — the same filled accent
    with a white tick.
27. `cup-0.png`, `cup-50.png`, `cup-100.png` 160x200 — the daily-routine glass: rose = iced latte in a clear cup with a
    straw; pumpkin = a little latte glass; empty / half / full.
28. `goal-track.png` 900x50 and `goal-fill.png` 900x50 — slim progress bar: oat groove / accent fill.

Chat
29. `bubble-in.png` 400x200 (9s) — cream bubble. `bubble-out.png` 400x200 (9s) — accent bubble.
30. `send-btn.png` 160x160 — round accent button with a white paper-plane.

Shop
31. `store-card.png` 768x768 — the skin-shop card for #Basic in this rendition: one phone showing the v3 Home (the
    nine-square profile with the bigger centre picture and bow), on cream linen with an iced latte (rose) or a pumpkin
    spice latte (pumpkin), a claw clip and a satin bow. Square, no text except the phone UI.

Keep every other file in the folder as it is (icons, notif-*, menu-*, fx, latte / last-call art, awning…).
Finish with `_sheet-v3.png` in each folder (all repainted pieces on one contact sheet).
