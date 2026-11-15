# Witchcraft — build notes

**Status (Nov 15 2026): building** (`wip: true` → shows "Coming soon"). Owner asked for "the witch one" while away;
of the two witch skins (Good Witch = pastel/cute, Witchcraft = dark gothic purple) this is Witchcraft.
Process and owner rules: `../README.md`, `../scrapbook/NOTES.md`, and `../anime-blaze/NOTES.md` (sections D–E list
the rules and gotchas learned there — they all apply here).

## 1. Visual targets
| File (local, git-ignored) | What |
|---|---|
| `concept-v3-approved.png` | **Sheet 1:** Home, Skins, Profile, Groups, Post, Messages, Chat |
| `concept-2.png` | **Sheet 2:** Home full (stories, composer, Featured Skin, quests, coin goal), Network, Notifications, Search, Group page, other profile (+ Mute/Block/Report), Comments, Create post, Story |
| `concept.png`, `concept-v1/v2.png` | earlier versions (superseded) |
Crops (3×): `prototypes/reference/witchcraft/<screen>.png` (16 screens, same names as Anime Blaze's).

Look: painted dark-fantasy realism — carved near-black wood, aged bronze/antique-gold trim with gothic points,
violet/magenta glow, candlelight; gold serif type (Cormorant Garamond); cobwebs in title corners; shelves of props
(cat, books, cauldron, potions, crystal ball, candles, skull) at the bottom of pages.

## 2. Concept window → real app
| Concept screen | Build | Not built (no such field) |
|---|---|---|
| home / home-full | 2-row top bar (logo centred with moon ornament; search box · bell · music · coin pill · avatar in gold arch), stories (Your story = magenta glow ring, others gold), composer plank, Featured Skin frame, Daily Quests = gothic arch frame with 3 cards in a row and a POTION BOTTLE on each that fills with progress (data-fs-q 0/50/100), coin goal, hanging-plaque tabs, wood post card | — |
| profile | 4 tarot cards fanned across the top = the 4 timeline photos (`timeline: 4`, tap a card to choose its photo), gothic stained-glass windows behind, gold-ringed round photo, gold name, italic bio with ✦, double-arch stats with pentagram, Edit/View Profile plaque, cat shelf below | back arrow |
| skins | gothic arch cards, hanging filter chips (real categories), price / Equipped pills | Realistic/Scrapbook/Animated chips |
| groups / messages / network / notifications / search | gold title + cobweb corner, wooden rows, Join/Follow plaques, gems for unread | header icons the app doesn't have |
| post / comments | wood panel, arch photo frame (whole photo), gold line action icons | — |
| chat | gothic window backdrop, smoky / violet bubbles, carved input bar | phone icon |
| group page / other profile / create post / story | as concept with real fields | — |

## 3. Owner direction (Nov 15)
- "Building the assets from the concept was probably the best idea" → every piece traced from the crops
  (`prototypes/witchcraft-redraw-brief.md`, Codex → `kit/redraw-a`, `kit/redraw-b`).
- Nav needs real ICONS, not the painted cauldron/cat/potion objects → gold LINE icons (cauldron outline, three
  hooded figures, potion flask, crystal ball, envelope with wax seal). Painted props = decoration only.
- Old Nov 14 generic kit (`kit/*.png` sheets → `assets/`) is the fallback until the traced art lands.

## 4. Wiring
- `FULL_SKINS.witchcraft` in `js/fullskins.js` (dark, ink `#efe4d6`, accent `#c94cff`, Cormorant Garamond,
  `timeline: 4`, assets list = the brief's piece names → `--fs-<name>`).
- CSS: `css/fullskins.css` section "WITCHCRAFT", everything under `body.fs-witchcraft`.
- Ship: remove `wip`, whitelist `images/skins/witchcraft/assets/` in `.gitignore`.

## 5. Progress log
- Nov 15: concept crops made, brief written, Codex Part A/B started; registry entry + first CSS pass (structure for
  every screen) written against the brief's art names.
