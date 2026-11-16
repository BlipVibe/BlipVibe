# Superhero — build notes

**Status (Nov 16 2026): WIP** on branch `claude/superhero-skin-8cfc5b` (`wip: true`, assets not whitelisted yet).
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
- Equip (`equipSuperhero`): the COMIC BOOK — four panels of a comic page slam down one after another (each jolts the
  screen), action lines + the sound-effect burst (POW! Heroes / KRAKK! Villains), skin applied under the page, then the
  page turns away. Art from the rendition being equipped (fx-page, fx-sfx, fx-speedlines, fx-spark).
- Heroes → Villains (`heroSwap`): storm flicker, green lightning strikes down the middle, the glass cracks, the skin
  switches behind it, the cracked glass shatters into falling shards.
- Villains → Heroes (`heroSwap`): a yellow sunburst explodes out of the BV badge, POW! + a comic page slam over it, the
  skin switches under it, the page's panels fly apart to the corners.
- Like / dislike: own comic POW pop (`shPow`) on the painted ON thumbs.

## Wiring
- `FULL_SKINS.superhero` in `js/fullskins.js` (variants heroes / villains; fsVariants is generic, so no SQL change);
  catalog row `['superhero', 'Superhero', 'comic']` + new "Comic" category; `EQUIP_FX.superhero`.
- CSS: section "SUPERHERO" at the end of `css/fullskins.css`.
- Ship: remove `wip`, whitelist `images/skins/superhero/assets/` in `.gitignore`.

## Log
- Nov 16: concepts painted + approved; crops; kit brief → Codex (4 parallel jobs: heroes A/B, villains A/B); engine entry,
  toggle, animations and CSS written ahead of the art.
