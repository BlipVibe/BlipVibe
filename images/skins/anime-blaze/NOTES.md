# Anime Blaze — build notes

Status (Nov 15 2026): **starting.** Concepts approved earlier; base kit exists; not yet `ready` in the catalog.
Process and owner rules: `../README.md` and `../scrapbook/NOTES.md` (read both first).

## 1. Visual targets
| File (local, git-ignored) | What |
|---|---|
| `concept-v1-approved.png` | **Sheet 1 (approved):** Home, Skins, Profile, Groups, Post, Messages, Chat |
| `concept-2.png` | **Sheet 2:** Home (full: stories, composer, featured skin, quests, coin goal), Network, Notifications, Search, Group page, other user's profile (+ Mute/Block/Report menu), Comments, Create post, Story viewer |
| `concept.png` | earlier version of sheet 1 (superseded) |

Look: dark charcoal pages with halftone/screentone, **slanted manga panels** with ink + white/gold
borders, **red-orange flame streaks**, red slanted primary buttons, comic speech-bubble chat, bold
italic display type. Accent red-orange; ink near-white on dark.

## 2. Layout decisions (concept wins over the old plan)
- `prototypes/skin-engine-spec.md` planned "avatar as a top-right character cut-in". The **approved
  sheet 1** instead shows: **one big slanted cover panel** (photo with red duotone) and the **round
  avatar centred, overlapping its bottom edge** with a red ring + camera badge; name + bio under it;
  Following / Followers in **two slanted callout boxes**; red slanted **Edit Profile**. Build the concept.
- Timeline photos: **1** slot (full-width cover band, diagonal cut). **NO filter** on the photo (owner, Nov 15) — the old plan's red duotone is dropped; the user's photo shows as-is.
- **Own Profile (concept close-up, owner Nov 15):** NO flame ring on the picture — a plain round photo with a
  thin dark outline + slight red rim, camera badge bottom-right. The cover is NOT a framed panel: it's a
  full-width band bleeding to the screen edges, red-duotone tinted, with a jagged DIAGONAL bottom edge and
  white slash streaks; camera badge top-right. Name bold white italic; bio under it; two slanted stat
  callouts (gold keyline); red slanted Edit Profile.
- **Other person's Profile (sheet 2):** their picture is a cut-in on the cover (right side), name on a slanted
  red label at the cover's bottom-left; buttons Follow (red) · Message · Close Friend · Invite to Group (dark
  slanted chips); Mute/Block/Report in the ⋯ menu; photo strip below. (Different from your own profile.)
- `avatar-ring.png` and `cover-frame.png` from set 1 do NOT match the concept profile — don't use them there.
- Home (sheet 2 order, matches the real app): stories row → composer → Featured Skin → **Daily Quests
  (slanted rows, red progress, coin pills)** → coin goal bar → Following / Discover / My Posts → posts.
  Home ALSO keeps the cover + profile picture + profile card at the top (owner rule — never removed).
- Header: avatar + flame "BlipVibe" logo, search, bell (+count), music, coin pill. Keep the app's top bar on every page.
- Bottom nav: dark bar, active tab on a red slanted tile.
- Post: slanted panel, photo inside a slanted ink frame (photo still shown WHOLE — never cropped),
  action row like · dislike · react · comment · share · views (concept shows 4 — use all 6 real ones).
- Chat: dark slanted speech bubbles (incoming) / red bubbles (outgoing), round + and red send.
- Groups list: slanted rows, red "Join" chip; tabs My Groups / Moderating / Joined / Discover.

## 3. Field corrections (concept text → real app)
Same as Scrapbook's table (`prototypes/scrapbook-field-corrections.md`): live user data, real skins + prices
(300), real tabs, 6 post actions. Concept invents nothing new beyond Scrapbook's list.

## 4. Art
- `kit/` (base kit, Nov 14): background, buttons, deco, frames, icons, nav, panels, quests → sliced to
  `assets/*.webp` (46 files). **Owner: Anime Blaze is NOT realistic** — the target is the concept's clean
  comic/anime illustration style (ink outlines, slanted panels, flame streaks, halftone). Scrapbook's
  "realistic material" rule does not apply here; "match the concept, generated art not CSS" still does.
  Set 1 brief (`prototypes/anime-blaze-extras-1-brief.md`) fills the gaps: 9-slice panels, rows, bubbles,
  buttons, chips, fields, banner, navbar, cover frame, avatar ring, quest bar, coin pill, burst.
- Icons from the base kit (white/red comic icons with flame flicks) look right — keep.

## 4b. Color options (owner, Nov 15: "not everyone likes red" — ~5 colors, same look across the board)
- Graphics first: each color is a REAL recolored copy of the art (`assets/<color>/…`), made offline by
  shifting only the red-orange accent hues (dark fills, white/gold keylines and ink stay), then reviewed.
  Not a CSS hue-rotate filter.
- The choice is a new look key (e.g. `fsVariant`), so it must be added to `set_skin_look`'s allowed list +
  the guard trigger list (`supabase/guard-stale-look-writes.sql`, live DB change → owner OK) and to `LOOK`
  in app.js. The Skins card gets color dots to pick from.
- Set 1 status: 19/21 pieces delivered (coin-pill, burst pending); avatar-ring has faint haze in its top
  corners — zero alpha < 60 outside the ring when converting.

## 5. Engine wiring (to do)
- Add `FULL_SKINS['anime-blaze']`: `dark: true`, ink near-white, accent red-orange, comic display font
  for titles, `timeline: 1`, parts/assets as the art lands; flip `ready: true` in the catalog when shipped.
- Whitelist `images/skins/anime-blaze/assets/` in `.gitignore` when it ships.
- CSS: scope everything under `body.fs-anime-blaze`. Build from THIS skin's concept — Scrapbook is a reference where something applies (owner, Nov 15), never a template.

## 6. Progress log
- Nov 15: notes + first art brief written (owner: realism is case by case — this one is clean comic art; goal = as close to the concept as possible; graphics first, CSS only when necessary); Codex set 1 delivered 19/21; color-option plan added.
- Nov 15: colour options wired: engine `variants` (red root + assets/blue|purple|green|pink, made by
  `<scratch>/recolor.py`-style hue shift of warm pixels only), `data-fs-variant` on body, swatch dots on the
  owned skin card, choice saved as `fsVariants` via set_skin_look (DB updated + tested in a rolled-back
  transaction; public skin data exposes it so visitors see your colour). Skin entry is `wip: true` (shows
  "Coming soon") until the screens are built. Asset weight: ~10 MB red + ~2 MB per colour — before shipping,
  load only the active colour (already the case: CSS vars point at one folder) and consider keeping
  variants out of the OTA zip.
- Nov 15 (round 3, owner: "reject anything not exactly like the concept"): profile block rebuilt to the concept
  close-up — cover band masked by `cover-mask` (generated FROM the cover-cut art's white-line centres, so the
  zigzag always covers the photo edge; top edge = cover-cut rotated 180°), photo 145pt (~36% width) on the cut,
  set 4 `stat-box` (lightning notch left) + `button-slant` used whole (not 9-slice — slanted edges sawtooth when
  repeated; all Anime Blaze border-images use `stretch`), concept spacing (stats 17pt under bio, 4pt apart,
  72pt tall; button 62pt, 66% wide right under). Set 3 `header` (calm, thin flame streak) as top bar; bottom bar =
  concept's plain dark bar + `nav-divider` + set 3 `nav-active`. Set 3 quest/post/action pieces are converted
  and registered; next: Home sections (stories, composer, Featured Skin, quests, coin goal, tabs), post, chat.
- Simulator QA: the app runs the downloaded update snapshot (Library/NoCloud/ionic_built_snapshots/<id>, see
  serverBasePath in its prefs), NOT App.app/public — install test files there (scratch `sim_install.sh`).
