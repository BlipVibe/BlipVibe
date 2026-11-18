# #Basic v2 "aesthetic widgets" — production kit (owner approved the concepts Nov 17 2026)

Targets (approved): `images/skins/basic/concept-w-<r>.png`, `concept-w-<r>-2.png`, `concept-w-<r>-barista.png` and the 3x
per-screen crops in `prototypes/reference/basic-w-<r>/` (home.png, profile.png, chat.png, …). Paint the separate art
pieces the app needs so the real app can look exactly like those concepts. Match the concept look 1:1: frosted cream
glass with a very fine linen texture, hairline lighter top edge, soft realistic shadow, iOS-widget squircle corners.

Rules for every piece:
- PNG, REAL transparent alpha around the shape (never a painted checkerboard, never a backdrop), the piece fills its
  canvas with only ~14px of transparent margin for the soft shadow. No text anywhere (the app writes all text).
- 9-slice pieces: corners must be uniform so the middle can stretch — keep the radius and edge the same all round,
  plain calm centre (no highlights or texture blobs that look wrong when stretched).
- Paint each rendition independently: `<r>` = `rose` (cream/oat + dusty blush #c98f86, rose-gold hairline) and
  `pumpkin` (cream/oat/camel + caramel #b8754a, gold hairline). Overwrite files of the same name if they exist.

Pieces, save in `images/skins/basic/kit/<r>/`:
1. `wallpaper.png` 1290x2796 — the page wallpaper seen behind all widgets (concept background between the widgets):
   soft blurred cream/oat limewash wall with sunlight and a linen-curtain shadow (rose: blush morning light; pumpkin:
   golden late light + a faint dried-leaf shadow). Low contrast, calm, mostly light. Opaque (no alpha needed).
2. `widget.png` 600x600 — THE widget: frosted cream glass squircle, corner radius ~70px, fine linen texture, hairline
   light top edge, soft drop shadow inside the canvas margin. Used 9-slice for every card.
3. `widget-inner.png` 400x400 — a recessed inner well (slightly darker oat glass, inset, radius ~44px) used for list
   rows / fields inside widgets (the segmented control track, the comment field, the search field look).
4. `top-bar.png` 1290x230 — frosted glass top bar (the strip under the status bar that holds the wordmark and buttons),
   rounded bottom corners ~60px, square top; 9-slice horizontally.
5. `dock.png` 1200x300 — the floating frosted glass DOCK (bottom nav), radius ~90px, soft shadow, 9-slice.
6. `tile.png` 220x220 — beige app-icon tile (cream→oat, soft inner shading, radius ~56px), empty (glyph added by the app).
7. `tile-on.png` 220x220 — the ACTIVE tile: accent glass (rose: dusty blush; pumpkin: caramel) with a lighter hairline.
8. `pill.png` 400x140 — frosted cream glass pill (chips, stat chips, inactive segments, secondary buttons), 9-slice.
9. `pill-on.png` 400x140 — accent pill (primary buttons "edit profile"/"follow"/"post", active chip/segment), 9-slice.
10. `field.png` 800x140 — search / message / comment pill field, recessed frosted glass, 9-slice.
11. `avatar-ring.png` 512x512 — a THICK round frosted cream glass ring with a soft shadow; the centre circle (diameter
    ~400px) fully transparent so the profile photo shows through. Also `avatar-mask.png` 512x512: white disc exactly
    the ring's inner hole on black.
12. `ring-track.png` 300x300 — the coin-goal ring track (thin oat groove ring, transparent centre) and
    `ring-fill.png` 300x300 — the same ring fully filled in the accent colour (the app reveals part of it).
13. `bubble-in.png` 400x200 — received chat bubble: cream frosted glass pebble, 9-slice. `bubble-out.png` 400x200 —
    sent bubble in accent glass, 9-slice.
14. `send-btn.png` 160x160 — round accent glass send button with a white paper-plane arrow.
15. `badge-count.png` 96x96 — small accent dot badge (count written by the app).
16. Dock icons for the ACTIVE tile — the same chunky glyph shapes as the existing `icon-home.png`, `icon-groups.png`,
    `icon-skins.png`, `icon-network.png`, `icon-messages.png` in this folder (look at them), but in warm WHITE/cream so
    they read on the accent tile: save as `icon-home-on.png`, `icon-groups-on.png`, `icon-skins-on.png`,
    `icon-network-on.png`, `icon-messages-on.png` (256x256, overwrite).
17. `photo-shade.png` 400x400 — soft dark gradient from transparent (top 55%) to ~45% espresso at the bottom, squircle
    radius ~60px, for the "jun 14 beach day" photo-widget labels.
18. `barista-card.png` 700x900 — the Barista Bar menu widget (concept barista sheet phone 1): frosted cream glass
    (rose: faint blush tint and blush hairline; pumpkin: faint caramel/kraft tint, gold hairline), radius ~60px, empty
    calm centre, 9-slice.
19. `store-card.png` 768x768 (rose only) — the shop card for #Basic: one hero phone of the rose Home screen from the
    concept, slightly angled, on travertine with an iced latte and peonies beside it. Square, no text but the phone's UI.

Finish with `_sheet-widgets.png` in each folder (all new pieces on one contact sheet).
Keep everything else in the folder as it is (icons, notif-*, menu-*, cup-*, tick-*, coin*, latte/last-call art).
