# Blood Moon — concept sheets (two renditions, two different MOONS)

BlipVibe is a social app. Its "full skins" repaint every screen with generated art. Paint the CONCEPT SHEETS for the
Blood Moon skin: a gothic, romantic, moonlit night — a grand old opera house / gothic castle with crimson velvet
curtains, black wrought iron and antique silver filigree, stained glass, candelabras, red roses, ruby jewels.
Rich, painted, crafted and premium — NOT flat, NOT generic app UI, NOT CSS-looking. Every row, card, pill, button,
bubble and bar is a painted object of that world (polished dark wood / velvet / black iron with silver or gold
filigree, ruby glass), with ornament on rims and corners and a calm centre where text sits. Text must stay
readable: light text on dark panels, or dark ink on the pale parchment post cards.

Layout reference (copy the PHONE LAYOUT and the SCREEN LIST, not the look): the two old Blood Moon sheets
`images/skins/blood-moon/old/concept.png` (sheet 1, 7 phones) and
`images/skins/blood-moon/old/concept-2.png` (sheet 2, 9 phones). Same phone sizes and positions,
same screen contents and fields. The new sheets must make THE MOON the hero of the skin (big in the Home header, in the
profile, the Skins header, page backgrounds, little moon motifs in icons, quests and badges).

The skin has TWO RENDITIONS the user switches between with a moon button in the top bar. Each rendition has its own,
completely different MOON, painted independently (never a recolour/filter of the other):

## Rendition A — CRIMSON ("Blood Moon")
A total lunar eclipse: a HUGE full moon glowing deep blood-red / copper-crimson with visible craters and a soft red halo,
hanging low over gothic spires and the opera house dome. Red-lit night sky, thin crimson clouds drifting across the moon,
a few stars. Materials: crimson velvet, black lacquered wood, antique SILVER filigree, ruby glass, red roses, red candle
light. Palette: blood red, wine, black, antique silver, warm candle-gold highlights.

## Rendition B — ECLIPSE ("Black Moon")
A total SOLAR eclipse: the moon is a perfectly BLACK disc ringed by a blazing CORONA — a ring of molten gold-orange fire
with crimson flares and long streamers of light, a bright diamond-ring flash at one edge. Smoky obsidian night with
drifting ash and glowing embers; the light comes from the corona (warm gold rim-light on everything). Materials:
obsidian / black glass, smoked onyx, burnished BRONZE-GOLD filigree, ember-orange and deep crimson glass, black roses
with red-tipped petals. Palette: jet black, molten gold, ember orange, deep crimson.
Same app layout as A, but its own painted world-look — different moon, different light, different metal (bronze-gold not
silver), different flowers. It must read as a different moon at a glance.

## The sheets (paint FOUR images)
Save to `images/skins/blood-moon/` (repo-relative):
- `concept-crimson.png` — sheet 1, rendition A, ~1100x1430, 7 phones: Home, Skins, Profile (top row) and
  Groups, Post, Messages, Chat (bottom row). Title at the top: "BlipVibe — Blood Moon".
- `concept-crimson-2.png` — sheet 2, rendition A, ~1180x1330, 9 phones: Home full (stories, composer, Featured Skin,
  Daily Quests, Coin Goal, tabs, a post), Network, Notifications, Search, Group page, someone else's Profile (with a ⋯ menu
  open: Mute / Block / Report), Comments, Create Post, Story viewer.
- `concept-eclipse.png` — sheet 1, rendition B (title "BlipVibe — Eclipse").
- `concept-eclipse-2.png` — sheet 2, rendition B.
Also `_concepts_sheet.png`: all four side by side, small.

## Real app features every concept must show (the app keeps these, the art restyles them)
- Top bar on EVERY page. Home top bar: small round profile photo, "BlipVibe" wordmark, search, bell with count, music
  note, coin pill "2,450 +", and a small MOON BUTTON (the rendition switch: crimson moon in A, black eclipse ring in B).
- Home ALWAYS shows the cover picture area + the profile picture + the profile card (name, bio, following/followers).
- Profile: 3 cover/timeline photos shown in a painted frame (e.g. three gothic stained-glass windows or panes arranged
  around the moon), a framed round profile picture in front, name, bio, stats, Edit Profile button.
- Home: Daily Quests panel with 3 quests (React to 5 posts 3/5 +5, Send 3 messages 1/3 +10, Like 5 posts 4/5 +5) each with
  a moon-phase progress icon (new → half → full moon as it fills), tabs Following / Discover / My Posts, post cards.
- Posts: author row, text, photo in its own ornate frame, actions like · dislike · comment · share. Show one post LIKED
  (the like icon visibly FILLED, solid) so the on-state is designed.
- Bottom nav: Home, Groups, Skins, Network, Messages with painted icons; active tab clearly lit.
- Fields (search, message, comment) are pill fields with an icon; chat = received / sent bubbles + input bar with + and send.
- Skins page: grid of skin cards (Blood Moon Equipped, Witchcraft 300, Good Witch 300, Anime Blaze 300, Kawaii Cats 300,
  Sakura Bloom 300), filter chips All / Aesthetic / Realistic / Scrapbook / Animated.

Rules: realistic-looking photos inside posts/avatars are fine on the concept (placeholders). Real readable English text
on the UI. Portrait phones, iPhone-style frames with dynamic island, dark sheet background between phones.
