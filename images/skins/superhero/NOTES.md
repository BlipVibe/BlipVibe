# Superhero — build notes

**Status (Nov 16 2026): SHIPPED** (owner: "when done ship everything"; `wip` removed, assets whitelisted in `.gitignore`).
Process and owner rules for every skin: `../README.md`, `../scrapbook/NOTES.md`, `../good-witch/NOTES.md`.

## Owner direction
- Nov 16: "Make another branch for a super hero style theme. Do heros and villians this one is change one too but heros
  should look much different then villians." → a switchable skin with two renditions that look nothing alike.
- Strictly ORIGINAL characters and emblems (no existing heroes/villains, costumes, logos). App marks: gold winged "BV"
  bolt-star (Heroes), green skull-circuit sigil (Villains).
- Nov 16: all four concept sheets approved as painted ("Approve both").

## Targets
- Heroes: `concept-heroes.png` (sheet 1: Home, Skins, Profile, Groups, Post, Messages, Chat) + `concept-heroes-2.png`
  (sheet 2: Home full, Network, Notifications, Search, Group page, other profile, Comments, Create post, Story).
- Villains: `concept-villains.png` + `concept-villains-2.png`. All local only (git-ignored).
- 3x crops: `prototypes/reference/superhero-heroes/<screen>.png`, `prototypes/reference/superhero-villains/<screen>.png`
  (`prototypes/tools/superhero_crops.py`).
- Look — HEROES: golden-age comic book, cream halftone paper, thick black ink, primary red / blue / yellow, red ribbon
  title banners with yellow star bursts, yellow plaque buttons, sunny art-deco skyline, speech balloons. Fonts Bangers
  (titles) + Comic Neue (body).
- Look — VILLAINS: villain's lair, gunmetal plates with bolts and cracks, hazard stripes, neon green + electric purple,
  storm with green lightning, angular cut corners, glowing glass bubbles. Fonts Black Ops One (titles) + Exo 2 (body)
  (CSS `--sh-tfont` / `--sh-bfont` per rendition — the engine sets one font per skin).

## Concept → app
| Concept | Build |
|---|---|
| home | top bar: avatar in its frame (left, two rows), BLIPVIBE on the title banner, search · bell · music round buttons, coin pill, BV badge (the rendition switch); cover in the comic / steel frame (`#timelineCover`, slot 1 only), round photo over its bottom-left, name · bio · stats on the profile card; Daily Missions panel (star / power-cell icons with the count on them, bars, coins); tabs; posts |
| profile / other profile | `#pvCoverBanner` = profile-scene + 3 tilted comic panels / 3 cracked monitors (`timeline: 3`, photos cut by timeline-mask), big photo in the winged gold ring / spiked neon ring (cameo), name on the banner, bio between sprigs, stats panel, Edit Profile plaque / Follow + Message + Close Friend + Invite |
| lists, skins, chat, comments, create post, story | painted rows / chips / fields, skin-card frames, speech balloons / glass bubbles, tool tiles, Post plaque |
| nav | painted bar; active tab = lit tile with the "-on" icon |

## Art
- Brief: `prototypes/superhero-kit-brief.md` (one inventory, both renditions, same names/sizes; each kit painted
  independently in its own style) → Codex → `kit/heroes/`, `kit/villains/` → `prototypes/tools/superhero_convert.py`
  → `assets/` (Heroes), `assets/villains/` (Villains); `card.webp` from the Heroes kit's card.png.

## Animations (own, never borrowed)
Owner (Nov 16): every skin must look and move WAY different from the others — Anime Blaze is the other comic skin and
owns "slanted manga panels slam + burst + shake + shatter" (equip) and "speed lines + lightning slash + split" (swap),
Good Witch owns the circle reveal from the button. So Superhero uses none of those (a first draft did and was replaced).
- Equip (`equipSuperhero`): the COMIC BOOK — a comic book with the rendition's cover art (card) floats up, its cover
  swings open on the spine, zoom into the printed page (fx-page) until it fills the screen, the skin is applied under it,
  then the page dissolves in HALFTONE print dots from the middle outward.
- Heroes → Villains (`heroSwap`): the villain's SMOKE — purple smoke (fx-cloud) billows up, the green skull sigil
  (toggle-villains) glows out of it with rising sparks, skin switches behind the smoke, the sigil shrinks back into the
  badge as the smoke sinks.
- Villains → Heroes (`heroSwap`): the HERO SIGNAL — a searchlight sweeps up and projects the gold BV emblem
  (toggle-heroes) on the sky, dawn rises up the screen with turning sun rays (fx-burst) and clouds (fx-cloud), skin
  switches under the sky, the emblem soars off the top and the clouds drift apart.
- Like / dislike: own comic POW pop (`shPow`) on the painted ON thumbs.
- Unused first-draft fx art (fx-sfx, fx-speedlines, fx-bolt, fx-crack, fx-shard, fx-spark) stays in kit/, not shipped.
- Fonts: Luckiest Guy (Heroes titles, Western comic masthead) — not Bangers, which Anime Blaze loads.

## Wiring
- `FULL_SKINS.superhero` in `js/fullskins.js` (variants heroes / villains; fsVariants is generic, so no SQL change);
  catalog row `['superhero', 'Superhero', 'comic']` + new "Comic" category; `EQUIP_FX.superhero`.
- CSS: section "SUPERHERO" at the end of `css/fullskins.css`.
- Ship: remove `wip`, whitelist `images/skins/superhero/assets/` in `.gitignore`.

## Log
- Nov 16: concepts painted + approved; crops; kit brief → Codex (4 parallel jobs: heroes A/B, villains A/B); engine entry,
  toggle, animations and CSS written ahead of the art.
- Nov 16: both kits painted (kit/heroes, kit/villains) and converted; CSS fitted to the art with measured windows
  (`prototypes/tools/superhero_windows.py`). Simulator QA, both renditions: Home, post (liked / disliked ON art), Groups,
  Skins, Profile, other profile, Network, Notifications, Search, Messages, chat, account menu (Logout reachable), comments
  (Heroes), create post, story viewer, group page; swap both ways + equip animation. Fixes along the way: 9-slices whose
  top + bottom slices met in the middle (blank Edit Profile / Follow), `content:""` on the timeline <img> blanked the
  photos in WebKit, light lettering on Villains' deep-green pieces, nav labels never truncate, Saved/Notifications tabs
  hidden from the bar. Shipped.
- Leftovers / ideas: Villains `profile-scene` came out as an empty frame (the lair wall reads fine behind it);
  Villains `react-orb` has no disc (unused — story reactions use round-btn); group cover frame not visible on a group
  with no cover photo; Villains comments modal not screenshotted (same CSS as Heroes).
- Nov 16 (evening, owner): profile pop-up redesigned per rendition (`prototypes/superhero-profile-modal-brief.md`):
  Heroes = centred comic hero file, Villains = left-aligned dossier. Owner: "the profile area should be completely organized
  different for heroes and villains … I like the styles". Home "boring" + "3 cards with no way to change them on the home
  page" + "too much like the tarot cards" → `prototypes/superhero-home-brief.md`: timeline = comic page grid (Heroes: big
  panel left + two stacked) / monitor wall (Villains: wide screen top + two below; biggest window = slot 1 = cover), on Home
  AND Profile, every own frame tappable with a camera badge; richer backgrounds, stickers (burst / flyer / corner), section
  divider, photo tiles, bigger stories + quest icons; Home card mirrored (photo left / right); Profile page placement
  differs (Heroes centred + starburst counters; Villains dossier + hex readouts + command-list buttons).
  QA on my own simulator (BlipVibe Superhero) with the QA read-only guard; deleted afterwards.
