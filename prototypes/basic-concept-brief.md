# #Basic — concept sheets (clean-girl neutrals, two seasonal renditions + the Barista Bar)

BlipVibe is a social app. Its "full skins" repaint every screen with generated art. Paint the CONCEPT SHEETS for the
#Basic skin: the "clean girl" aesthetic — calm, expensive-looking NEUTRALS. Think cream linen, oat and sand beige,
warm white bouclé, honed travertine and pale limestone, brushed gold (thin gold hoops, a gold rim here and there),
ribbed ceramic cups, glass iced lattes, a matcha in a clear glass, a slicked-back-bun mood, soft morning daylight and
gentle linen-curtain shadows. Minimal, airy, tidy, quietly luxe. Lots of breathing room.

It must still be PAINTED, REAL MATERIAL — not flat, not generic app UI, not CSS-looking. Every row, card, pill, button,
bubble and bar is an object of that world: soft cream linen or bouclé fabric with a fine weave, honed travertine or
limestone tiles with subtle pits and veins, a thin brushed-gold edge, ribbed ceramic, frosted glass. Soft realistic
contact shadows. Calm centres where text sits. Text = deep espresso-brown ink on cream, readable. Typography:
an elegant thin serif (like a boutique café or skincare brand) for titles and the wordmark, a clean sans for small text.
NO hot pink, NO neon, NO marble-and-rosé meme clutter, NO "Live Laugh Love" signs. Hashtag "#" is the brand mark
(the Home tab icon and the wordmark "#BlipVibe").

Layout reference (copy the PHONE LAYOUT and the SCREEN LIST, not the look): the old #Basic sheets
`/Users/danemuller/Developer/BlipVibe/images/skins/basic/concept.png` (sheet 1, 7 phones) and
`/Users/danemuller/Developer/BlipVibe/images/skins/basic/concept-2.png` (sheet 2, 9 phones). Same phone sizes and
positions, same screen contents and fields. Between the phones: a styled flat-lay on a travertine / linen surface
(iced latte, ribbed mug, gold hoops, a claw clip, a candle, dried flowers / leaves) — calm, not cluttered.

## Two renditions (seasonal) — switched with a small MUG BUTTON in the top bar
Both are the same clean-girl neutral world; each is painted independently (never a recolour/filter of the other).

### Rendition A — ROSÉ (spring / summer)
Neutrals warmed with the softest blush: cream, oat, sand, a dusty-rose / pale-blush accent (never hot pink), rose-gold
hairline edges. Iced lattes with ice cubes, a glass of rosé, peonies and pale-pink ranunculus, sunlight. Accents
(active tab, primary buttons, progress fills, liked icon) = soft dusty blush with a rose-gold rim. The mug button is
a clear glass ICED LATTE.

### Rendition B — PUMPKIN SPICE (autumn)
Neutrals warmed toward caramel: cream, oat, camel, toffee, cinnamon-brown, a muted pumpkin/terracotta accent
(never bright orange), brushed-gold edges. A cream knit throw, a camel plaid scarf, a white ceramic pumpkin, a lit
candle, a few dried leaves, a hot latte with a foam leaf in a ribbed mug. Golden late-afternoon light. Accents =
caramel / muted pumpkin with a gold rim. The mug button is a ribbed ceramic mug with steam.

## Signature interaction — the BARISTA BAR (show it in the sheets)
A small café-counter BUTTON in the top bar (a coffee cup on a tiny saucer) opens the "Barista Bar": a café MENU CARD
that slides down from the top bar — a thick cream letterpress card (A: blush-edged with rose-gold lettering;
B: kraft / caramel card with gold lettering) titled "Barista Bar" with a small cup emblem. Menu items written like a
café menu with dotted leaders and tiny painted icons on the right: My Profile · Saved Posts · Skins · Settings ·
"Switch to Pumpkin Spice" (in A) / "Switch to Rosé" (in B) · Latte Break · Last Call.
- Latte Break = a screensaver: top-down view of a latte in a ribbed cup on a travertine saucer, milk pouring into the
  foam drawing latte art (heart → rosetta → tulip), steam curling, "tap to sip" in small serif.
- Last Call = closing time: a takeaway cup on which a marker scribbles the user's name MISSPELLED (e.g. "Danae" →
  "Daynee ♡"), then a linen café awning / shutter lowers with "Closed — see you tomorrow ☕", then it reopens.

## The sheets (paint SIX images)
Save to `images/skins/basic/` (repo-relative, in the current repo `-C` folder):
- `concept-rose.png` — sheet 1, rendition A, ~1100x1430, 7 phones: Home, Skins, Profile (top row) and
  Groups, Post, Messages, Chat (bottom row). Title at the top: "BlipVibe — #Basic · Rosé".
- `concept-rose-2.png` — sheet 2, rendition A, ~1180x1330, 9 phones: Home full (stories, composer, Featured Skin,
  Daily Quests, Coin Goal, tabs, a post), Network, Notifications, Search, Group page, someone else's Profile (with a ⋯ menu
  open: Mute / Block / Report), Comments, Create Post, Story viewer.
- `concept-rose-barista.png` — rendition A, ~1100x800, 3 phones: (1) Home with the Barista Bar menu card open below the
  top bar, (2) Latte Break screensaver, (3) Last Call (name scribbled on the cup, awning half lowered).
- `concept-pumpkin.png`, `concept-pumpkin-2.png`, `concept-pumpkin-barista.png` — the same three for rendition B
  (titles "BlipVibe — #Basic · Pumpkin Spice").
Also `_concepts_sheet.png`: all six small, side by side.

## Real app features every concept must show (the app keeps these, the art restyles them)
- Top bar on EVERY page. Home top bar: small round profile photo, "#BlipVibe" wordmark, search, bell with count, music
  note, coin pill "2,450 +", the Barista Bar cup button and the small MUG BUTTON (rendition switch).
- Home ALWAYS shows the cover picture area + the profile picture + the profile card (name, bio, following/followers).
- Profile: 3 cover/timeline photos in a painted frame (e.g. arched travertine niches or linen-matted gallery frames with
  thin gold edges), a framed round profile picture in front, name, bio, stats, Edit Profile button.
- Home: Daily Quests panel with 3 quests (React to 5 posts 3/5 +5, Send 3 messages 1/3 +10, Like 5 posts 4/5 +5) each with
  a little latte-cup progress icon that fills up (empty glass → half → full latte), tabs Following / Discover / My Posts,
  post cards.
- Posts: author row, text, photo in its own frame, actions like · dislike · comment · share. Show one post LIKED and one
  DISLIKED (icons visibly FILLED, solid) so the on-states are designed.
- Bottom nav: Home (#), Groups, Skins, Network, Messages with painted icons; active tab clearly lit.
- Fields (search, message, comment) are pill fields with an icon; chat = received / sent bubbles + input bar with + and send.
- Skins page: grid of skin cards (#Basic Equipped, Witchcraft 300, Good Witch 300, Anime Blaze 300, Vaporwave 300,
  Heaven's Light 300), filter chips All / Aesthetic / Realistic / Scrapbook / Animated.

Rules: realistic-looking photos inside posts/avatars are fine on the concept (placeholders: cafés, brunch, linen beds,
beaches, flowers). Real readable English text on the UI. Portrait phones, iPhone-style frames with dynamic island.
No real brand names or logos (no coffee-chain logos or cup designs).
