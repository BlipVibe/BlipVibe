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

## 7. Concept window → real app (owner, Nov 15: "make it look exactly like each page within what's actually
available; no new fields"). References: `prototypes/reference/anime-blaze/<screen>.png` (3× crops).
| Concept screen | Build | Concept extras NOT built (no such field in the app) |
|---|---|---|
| home (sheet 1) + home-full (sheet 2) | top bar (logo, search, bell, music, coins, avatar — concept puts the avatar LEFT of the logo: reorder, same field) · stories · composer · Featured Skin · Daily Quests (plate + 3 rows + tiles + segment bars + reward pills) · coin goal · Following/Discover/My Posts · posts · cover/profile block stays (owner rule) | — |
| skins | title plate + coin pill, filter chips (real categories: All/Aesthetic/Cute/Mystic/Neon/Nature), skin cards (art + slanted name band + coin price), Equipped tag | concept's Realistic/Scrapbook/Animated chips |
| profile | done round 3 (cover zigzag, photo, name, bio, stat boxes, Edit Profile) | back arrow over the cover (app has bottom nav) |
| groups | title plate, real tabs My Groups/Moderating/Joined/Discover, list rows + Join button | header search/+ icons (app: search field + Create Group button — style those) |
| post (= comments / open post) | post panel, photo frame, action strip | — |
| messages | title plate, list rows (unread gold), search field | header search/compose icons |
| chat | header (back, avatar, name), in/out bubbles, input bar: app's photo/GIF/voice buttons + field + send | phone/⋯ in header, emoji button |
| network | tabs Connections / Not Following Back / People You May Know, rows, Follow buttons | — |
| notifications | rows with type icon + avatar + text + time + unread dot | — |
| search | field, tabs People/Groups/Posts, rows with chevron | — |
| group-page | cover, group avatar/name/members, Join, tabs Feed/Chat/Group Shop, posts | — |
| other-profile | cover with their photo cut-in, red name tag, bio, stat boxes, Follow/Message/Close Friend/Invite to Group, ⋯ menu Mute/Block/Report, photo strip | — |
| comments | post embed, comment rows (like/dislike/React/Reply), add-comment field with GIF/emoji | — |
| create-post | author + audience, text box with counter, tiles Add photo/Camera/Emoji/GIF/Poll/Schedule, big Post button | — |
| story | progress bars, author, ⋯/close, reply field + heart | — |
Art: sets 1–4 rejected as "too clean" → full redraw traced from the crops (`prototypes/anime-blaze-redraw-brief.md`,
kit/redraw-a + redraw-b), sketchy comic ink, incl. the page BACKGROUND (was missing) and black-outlined zigzag.
- Nov 15 (redraw): sets 1–4 replaced by kit/redraw-a (22) + redraw-b (21), traced from the screen crops in sketchy
  comic ink; all recoloured into 5 colours. Home QA'd against the concept: background, top bar (avatar · logo ·
  icons · coin pill, reordered — same fields), cover zigzag (mask rebuilt from the new edge art), stats, button,
  composer, Featured Skin frame, Daily Quests (plate, rows, tiles, segment bars, reward pills), tabs, post panel
  (9-slice stretched so the top edge stays above the header), post header (name + time stacked), photo frame
  drawn around the WHOLE photo (owner rule beats the slanted window), action strip, bottom bar.
  CSS gotcha: `:is()` takes its heaviest selector's weight — the first-pass `:is(.card:not(...)…)` rule outranked
  later rules; override with `html body.fs.fs-anime-blaze …` (+ repeated classes where needed).
  NEXT: QA Skins, Groups, Messages, Chat, Network, Notifications, Search, group page, other profile, comments,
  create post, story against their crops (CSS for most is written, not yet checked).
- Nov 15 (screens round 1): Skins cards (name on the art's band, red Equipped tag), Groups + Network as full-width
  slanted rows with red Join/Follow, Messages list (slim search, italic names, white-ring avatars), chat header on the
  redrawn header art. FLUSH rule (owner: content never smaller than or past the white lines; clip to the INNERMOST
  line): post photo masked to the frame window and the frame stretched to the photo's own box (window 26..1161 ×
  34..763 of 1200×800 → frame inset −4.66% −3.44% −5.08% −2.29%; mask 40.2% 47.8% / 105.7% 109.7%); cover mask cut
  at the CENTRE of each zigzag stroke so the photo runs under the line; drawn panels padded ~24px to clear their edges.
  NEXT: Notifications, Search, group page, other profile, comments, create post, story.
- Nov 15 (owner: "black lines to define the space"): frame art now carries solid black ink on the content side —
  photo-frame has a 12px black band inside its window (photo mask = window +4px, edge hides under the band);
  cover-cut / cover-top have a 10px black band against the zigzag AND everything beyond the stroke filled solid black
  (fading out over the last 40% so it blends into the page). No more page texture showing in the Z notch.
  Generated by script from kit/redraw-a (scratch `inkline/`), recoloured into all 5 colours.
  Group page: name/tagline below the cover beside the overlapping picture; secondary buttons on the tab art.
  Notifications: compact rows, plain white type icons.
- Nov 15: cover edge ink rebuilt as a SMOOTH outline = round dilation (~8px) of the zigzag stroke + solid fill beyond
  it (the per-column band looked blocky). Cover no longer tucked under the bar (−6px), so the top zigzag shows under
  the bar like the concept. Bar art bleeds 102% (its PNG has 3px clear edges). Other profile: their photo is a
  slanted cut-in (white+black ink edge via drop-shadow) on the cover's right, allowed to break over the zigzag
  (owner: the profile picture may go out of bounds — it's the main subject); name on the red name-tag art; status
  + bio below the cover; Follow red, other buttons on tab art. NEXT: comments, create post, story viewer.
- Nov 15: frames rebuilt by `prototypes/tools/anime_blaze_frames.py` (scipy distance transforms, no per-column
  artefacts): cover = ONE image `cover-frame` (both zigzags + solid ink outside the photo band, fading out), photo
  meets the white line directly (owner: no black gap between picture and line), mask = band +6px under the line.
  Post photo frame same (no inner band). Skin cards: card art 800×900 = one window with the dark name band over its
  bottom-left → picture fills the window, masked by `skin-card-mask`, frame drawn on top via ::after, name/actions
  on the band (left 7%, top 66.5%, 74%×24%). Featured Skin shows the skin's own card.webp (app.js, falls back to
  the swatch) with room under the red tag. Top bar backed with solid ink (art has 2px clear at its top).
