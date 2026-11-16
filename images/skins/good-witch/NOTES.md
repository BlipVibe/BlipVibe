# Good Witch — build notes

**Status (Nov 15 2026): building** (`wip: true` → "Coming soon").

## Targets
- `concept-v1-approved.png` (sheet 1: Home, Skins, Profile, Groups, Post, Messages, Chat) and `concept-2.png` (sheet 2:
  Home full, Network, Notifications, Search, Group page, other profile, Comments, Create post, Story). Local only.
- Crops (3x): `prototypes/reference/good-witch/<screen>.png` (16 screens, same names as Witchcraft).
- Look: pastel lavender / blush, pearly frosted glass, thin warm gold filigree, crescent moons, stars, clouds; owl,
  white cat, crystals. Plum serif type (Cormorant Garamond).

## Owner direction
- Match the concept ALMOST 1:1 (owner, Nov 15): every screen built to its crop — same layout, sizes, spacing, ornament,
  icons and props. QA each page side by side with its crop in the simulator before showing it; anything that differs is
  a bug unless the concept shows a field the app doesn't have.
- Build every asset FROM THE CONCEPT, complete inventory up front (lesson from Witchcraft's misses):
  `prototypes/good-witch-redraw-brief.md` → Codex → `kit/gw/`.
- TWO renditions (owner: "because it's so bright"): **Day** (concept) and **Night** — a real redraw (midnight sky,
  smoky dark-violet glass, same gold), NOT a recolour filter like Anime Blaze's colours → `kit/gw-night/` → `assets/night/`.
  Wired as `variants` (day = assets/ root, night = assets/night/); a variant can now override `dark`, `ink`, `muted`
  and `theme` (js/fullskins.js apply()).

## Concept → app
| Concept | Build |
|---|---|
| home | top bar (avatar · BlipVibe · search · bell · music · coin pill), Daily Quests = frosted frame with gold crescent, each quest a gold CONSTELLATION that lights up with progress (a/b/c × 0/50/100), tabs with constellation underline, frosted post card |
| home-full | stories (lavender ring, Your story +), composer pill, Featured Skin pill + arrow orb, coin goal |
| profile | 3 cover photos in round bubbles cradled by a big gold crescent moon (`timeline: 3`), pearly avatar ring, stats in frosted oval with gold vines, Edit Profile pill with wand, cat-on-cloud deco |
| other profile | gold star frame around the photo, ⋯ menu panel, Follow pill + Message/Close Friend/Invite tiles |
| skins / groups / messages / network / notifications / search | frosted rows + pills, lavender line icons, unread star-gem |
| chat / comments / create post / story | frosted bubbles, + and send orbs, tool tiles, Post gradient pill, reply field + heart orb |
| nav | frosted bar with 5 pearly ORBS holding lavender icons; active orb glows |

## Log
- Nov 15: crops made, full brief (day + night) sent to Codex, registry entry with Day/Night variants added.
- Nov 15 (evening, owner live QA): night concepts approved (concept-night*.png, crops prototypes/reference/good-witch-night/),
  night set drawn from them (kit/gw-night → assets/night). Owner: first pass "too plain", gold "bleeds into the white",
  "even the posts on Witchcraft have a border", "needs to be more elaborate like the others" → ornate pass (deep gold,
  filigree rims, vines, sparkles, pearls; four-sided post border; ornate photo frame) + enchantment pass (per-page props
  scenes page-deco-*, title-crest, corner vines both sides, sparkle-trail). Readability: Cormorant is hairline at 400/500
  → all text 600+, bubbles deep plum (white on the lavender bubble was 2.6:1). Contrast scan (local QA overlay) used on
  each page. Bars made solid (content showed through). Nav orbs lifted with shadow/rim, icons centred. Middle cover photo
  in front. Stats frame redrawn (old one pinched into two lobes).
  Not yet checked: Night in the simulator (needs the Day/Night option picked — the look-only switch only shows Day),
  Skins / Network / Notifications / Search / chat / other-profile pages with the ornate art.
- Nov 15 (late): owner REJECTED the flat quest board + hanging title sign ("looks like CSS", "don't like the banner
  thing on top"). Replacement: a fully PAINTED open spell book on clouds (quests-frame 1290x900), title written on the
  page itself, quests on the pages — no sign, no pinned cards. Lesson: flat frames read as CSS; quest/feature pieces
  must be painted illustrations like page-deco-* and cat-cloud.
- Owner: posts "boring" — the card glass was the same pale lavender as the page, so nothing popped (gold is liked).
  Fix requested: post-panel v3 = pearlescent iridescent card (moon-phase watermark, constellation corners, lilac
  vignette, painted drop shadow) + background v2 = deeper, more saturated sky. Rule: card and page must contrast.
- Nov 15 (late): background remade (owner): first deep sky "too pink / cotton candy", then "too much like night";
  final Day = bright daytime lavender-periwinkle in the banner's palette, a step deeper than the banner so the ivory
  cards pop (owner approved). Night = deep indigo with stars. Post card v3 (iridescent + gold rim) and thicker photo
  frame in. Quests: spell book, title on the left page, quests listed on the right page (nothing on the spine).
- Nov 15 (night): Day/Night sun-moon toggle in the Home top bar (js/fullskins.js dayNightToggle + magicSwap: the new skin
  is revealed behind a glowing gold-lilac pulse from the button via View Transitions; canvas burn fallback). Themed
  toggle-sun / toggle-moon art. Post rim drawn thicker (border-image-width 62px + outset, same square card). Per-post
  charms from Good Witch's own art on each post's look (data-fs-v 1-6): owl on crystal ball, crescent crest,
  moon, constellations, sun/moon sparkle. Charms must sit on the frame edge, never over content (corner vines reached
  over the avatar — replaced). Spell book pages always use dark ink (light parchment in both modes).
  Pending: ornate gold ring for the round profile photos (photo-bubble-ornate, Codex drawing).
