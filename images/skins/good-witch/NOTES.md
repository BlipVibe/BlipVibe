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
