# Superhero — concept sheets (two renditions: HEROES and VILLAINS)

BlipVibe is a social app. Its "full skins" repaint every screen with generated art. Paint the CONCEPT SHEETS for a new
skin: an ORIGINAL superhero comic-book world. Rich, painted, crafted and premium comic art (inked line, halftone dots,
Ben-Day shading, bold panel borders, action lines, sound-effect bursts) — NOT flat generic app UI, NOT CSS-looking.
Every row, card, pill, button, bubble and bar is a painted comic object (an inked comic panel, a caption box, a speech
balloon, a riveted metal plate, a shield, an emblem badge), with ornament on rims and corners and a calm centre where
text sits. Text must stay readable.

STRICTLY ORIGINAL: no Marvel, DC, Image, Dark Horse or any other existing character, costume, logo, emblem, name,
city or catchphrase. No "S" shields, bat shapes, spider shapes, star-on-chest shields, lightning-bolt chest logos,
red-and-blue webbed suits, etc. Invent our own heroes, villains, emblems and city. The app's own mark is a simple
"BV" bolt-star emblem you design (Heroes) and a "BV" cracked-skull-circuit sigil (Villains).

Layout reference (copy the PHONE LAYOUT and the SCREEN LIST, not the look):
`images/skins/superhero/layout-ref/sheet1.png` (sheet 1, 7 phones) and `images/skins/superhero/layout-ref/sheet2.png`
(sheet 2, 9 phones). Same phone sizes and positions, same screen contents and fields.

The skin has TWO RENDITIONS the user switches between with an emblem button in the top bar. They must look MUCH
different from each other (owner: "heroes should look much different than villains") — different palette, light,
materials, shapes and mood. Each is painted independently; never a recolour/filter of the other.

## Rendition A — HEROES ("Hero City")
Bright, bold, hopeful golden-age comic. Sunlit daytime city skyline of art-deco towers under a blue sky with puffy
white clouds and sun rays; an original caped hero silhouette soaring past (our own design: e.g. a hero in a sky-blue
suit with a gold star-burst emblem and a flowing red cape — generic, not any known hero). Materials: clean cream comic
paper with halftone dots, thick black ink outlines, primary-colour comic panels, polished gold shield badges, rivets,
starbursts, "POW!/ZAP!" style yellow bursts as accents (sparingly, never under text).
Shapes: square-ish comic panels with thick black borders and slight tilts, round shield emblems, caption boxes,
speech balloons for chat. Palette: primary RED, BLUE, YELLOW, cream paper, black ink, a little gold.
Type: bold condensed comic caps for titles (like a comic masthead), clean comic lettering for body.
Liked = solid yellow/red starburst thumb; active tab = a lit yellow panel.

## Rendition B — VILLAINS ("The Lair")
Dark, menacing, sinister. A villain's lair at night: storm clouds, green lightning, a dark fortress tower over a
shadowed city, neon toxic GREEN and electric PURPLE glow, cracked tech, hazard stripes, glowing monitors, broken
glass, smoke. An original villain silhouette (our own design: e.g. a hooded figure with a glowing green visor and a
spiked purple cloak — generic, not any known villain). Materials: dark gunmetal and black steel plates with bolts,
cracked glass screens, glowing neon tubes, circuit traces, rust and scratches, purple smoke. Shapes: angular jagged
panels, cut corners, sawtooth edges, cracked frames, skull-circuit sigils — NOT the heroes' clean rounded panels.
Palette: near-black, gunmetal, toxic neon green, electric purple, a little acid yellow for warnings.
Type: sharp angular / distressed caps for titles, clean light body text on dark panels.
Liked = solid glowing green thumb; active tab = a glowing green/purple neon plate.
It must read as a villain's lair at a glance, the OPPOSITE of the sunny hero city.

## The sheets (paint FOUR images)
Save to `images/skins/superhero/` (repo-relative):
- `concept-heroes.png` — sheet 1, rendition A, ~1100x1430, 7 phones: Home, Skins, Profile (top row) and
  Groups, Post, Messages, Chat (bottom row). Title at the top: "BlipVibe — Heroes".
- `concept-heroes-2.png` — sheet 2, rendition A, ~1180x1330, 9 phones: Home full (stories, composer, Featured Skin,
  Daily Quests, Coin Goal, tabs, a post), Network, Notifications, Search, Group page, someone else's Profile (with a ⋯
  menu open: Mute / Block / Report), Comments, Create Post, Story viewer.
- `concept-villains.png` — sheet 1, rendition B (title "BlipVibe — Villains").
- `concept-villains-2.png` — sheet 2, rendition B.
Also `_concepts_sheet.png`: all four side by side, small.

## Real app features every concept must show (the app keeps these, the art restyles them)
- Top bar on EVERY page. Home top bar: small round profile photo, "BlipVibe" wordmark, search, bell with count, music
  note, coin pill "2,450 +", and a small EMBLEM BUTTON (the rendition switch: gold hero star-shield in A, green
  skull-circuit sigil in B).
- Home ALWAYS shows the cover picture area + the profile picture + the profile card (name, bio, following/followers).
- Profile: 3 cover/timeline photos shown in a painted frame (A: three tilted comic panels on a comic page with the
  skyline behind; B: three cracked surveillance monitors in the lair wall), a framed round profile picture in front
  (A: gold shield ring; B: cracked neon ring), name, bio, stats, Edit Profile button.
- Home: Daily Quests panel ("Daily Missions" styling ok, keep the 3 quests: React to 5 posts 3/5 +5, Send 3 messages
  1/3 +10, Like 5 posts 4/5 +5) each with a progress icon that fills (A: an energy star that charges; B: a power cell
  that charges green), tabs Following / Discover / My Posts, post cards.
- Posts: author row, text, photo in its own comic frame, actions like · dislike · comment · share. Show one post LIKED
  (the like icon visibly FILLED, solid) and one DISLIKED so both on-states are designed.
- Bottom nav: Home, Groups, Skins, Network, Messages with painted icons; active tab clearly lit.
- Fields (search, message, comment) are pill/plate fields with an icon; chat = received / sent bubbles (A: comic speech
  balloons; B: glowing hologram/terminal bubbles) + input bar with + and send.
- Skins page: grid of skin cards (Superhero Equipped, Witchcraft 300, Good Witch 300, Anime Blaze 300, Heaven's Light
  300, Vaporwave 300), filter chips All / Aesthetic / Realistic / Scrapbook / Animated.

Rules: realistic-looking photos inside posts/avatars are fine on the concept (placeholders). Real readable English text
on the UI. Portrait phones, iPhone-style frames with dynamic island, dark sheet background between phones.
