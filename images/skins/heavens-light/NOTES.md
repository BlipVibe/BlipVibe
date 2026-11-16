# Heaven's Light — build notes

**Status (Nov 16 2026): SHIPPED** (owner: "Finish and ship"; `wip` removed, assets whitelisted in `.gitignore`).
Process and owner rules for every skin: `../README.md`, `../scrapbook/NOTES.md`, `../good-witch/NOTES.md`.

## Targets
- `concept-v1-approved.png` (sheet 1: Home, Skins, Profile, Groups, Post, Messages, Chat) and `concept-2.png` (sheet 2:
  Home full, Network, Notifications, Search, Group page, other profile, Comments, Create post, Story). Painted Nov 14,
  approved by the owner Nov 16. Local only.
- Crops (3x): `prototypes/reference/heavens-light/<screen>.png` (16 screens, same names as Good Witch).
- Look: classical sky temple at sunrise — ivory marble, rich gold with bronze edges, laurel wreaths, golden wings,
  fluted columns, sunrise clouds. Titles in caps serif (Cinzel), body Cormorant Garamond.

## Owner direction
- Nov 16: concept sheets approved as they are.
- Nov 16: "make the posts have something around them" → every post sits in an ornate gold + marble frame on all four
  sides (post-panel, post-panel-b, post-panel-c), every photo in its own gold frame.
- Nov 16: TWO renditions (owner: "Add Twilight") — **Day** (the approved concept, assets/ root) and **Twilight** (same
  temple after sunset: indigo starry sky, moonlit slate marble, same warm gold; assets/twilight/, same file names).
  Twilight concept sheets first (concept-twilight.png / concept-twilight-2.png) → owner approval → art traced from them.
  Its own swap animation (not Good Witch's magicSwap).

## Concept → app
| Concept | Build |
|---|---|
| home | top bar (winged laurel avatar · BLIPVIBE between laurels · search · bell · music · coin pill), Daily Quests = marble temple tablet, each quest a row with a golden HALO that fills with light (0/50/100), gold pill tabs, framed post card |
| home-full | stories (gold rings, Add Story +), composer pill, Featured Skin gold frame, coin goal tablet |
| profile | 3 arched temple windows between columns = the 3 timeline photos (`timeline: 3`), oval gold cameo with laurel crown + wings, name, bio between laurel sprigs, stats panel, Edit Profile pill |
| other profile | same arches + cameo, Follow gold pill, Message / Close Friend / Invite pills, ⋯ menu panel |
| skins / groups / messages / network / notifications / search | marble rows with gold rims, gold pills, gold line icons, gold unread dots |
| chat / comments / create post / story | ivory + gold bubbles, round + / send buttons, tool tiles, gold Post pill |
| nav | marble bar, gold line icons; active tab = glowing gold tile with a white icon |

## Art
- Old generic kit (Nov 14) moved to `kit/old-assets/` (local); replaced by Codex sets:
  `kit/hl/` (Day, `prototypes/heavens-light-redraw-brief.md`), `kit/hl-twilight/` (Twilight, same names/sizes,
  `prototypes/heavens-light-twilight-brief.md`), extras (avatar-ring, toggle-day/twilight + animation art in `kit/fx/`,
  `prototypes/heavens-light-extras-brief.md`). Convert: `prototypes/tools/heavens_light_convert.py <skin_dir> both`
  (Codex masks are black/white → converted to alpha); fx art → `assets/fx-*.webp` (gates downsized 75%).
- Measured windows: temple-arch windows at 10 / 38.7 / 67.4% left, 17.9% top, ~22% x 66.1% (of 1290x1000);
  cameo window 22.4% 9.1%, 54.1% x 68.2% (of 700x760); skin-card window 3.1% 2.9% 3.4% 21.6% (l t r b).

## Wiring
- `FULL_SKINS['heavens-light']` in `js/fullskins.js`; CSS section "HEAVEN'S LIGHT" at the end of `css/fullskins.css`
  (started as a clone of the Good Witch block — same app selectors and fixes — then rebuilt to this concept).
- Ship: remove `wip`, whitelist `images/skins/heavens-light/assets/` in `.gitignore`.

## Animations (own, not borrowed)
- Equip (`equipHeaven`): marble-and-gold gates of heaven close, light pours through the seam while the skin applies,
  then swing open (hinged on the outer edges) with god rays, sunrise clouds, feathers, sparkles.
- Day <-> Twilight (`heavenSwap`, winged sun / winged crescent button in the Home top bar): the sky turns, the sun sinks
  behind a cloud bank as the moon rises (and back), stars come out, then the sky clears onto the new rendition.

## Log
- Nov 16: concept approved, crops made, brief written and sent to Codex (kit/hl), registry entry + CSS base added.
- Nov 16: Twilight concepts approved (concept-twilight*.png; crops prototypes/reference/heavens-light-twilight/);
  brief prototypes/heavens-light-twilight-brief.md sent to Codex → kit/hl-twilight → assets/twilight/.
- Nov 16: both kits + extras in, CSS rebuilt to the concept on top of the Good Witch base (temple arches = timeline,
  winged oval cameo, quest tablet with halo rings, gold-tile nav, marble pills, three framed post looks, skin cards,
  compact title bar with laurels per branch), both animations, QA'd in the simulator: Home (Day + Twilight), Groups,
  Skins, Network, Messages, chat (Twilight), Notifications (Day + Twilight), other profile, comments, equip + swap.
  Gotcha: a CSS comment containing "*/" (a path with "heavens-light*/") silently ate the next rule — never put "*/"
  in comment text. QA gotcha: sim_install.sh without a rendition argument uses the REAL setVariant, which saves the
  choice to the account (it saved Twilight once; restored to Day by tapping back).
  Not yet checked: create post, group page, story viewer, search, chat input bar (simulator draws it only with keyboard).
- Nov 16 (ship round, owner on device): swap made smooth (main art preloaded before the sky moves, the sky keeps moving
  while the skin switches — no frozen frame) and the sun now FADES into the moon (and back) where they meet behind the
  clouds, on the original path (owner rejected a version that changed the path). Post spacing: content clears each frame's
  crest/columns (padding per look). Bottom bar: bigger icons (44px), whole active gold tile, labels never truncate.
  Trending Hashtags / outline buttons on the action-btn art (were tiled). Owner asked for a zoom bar when CROPPING a picture
  (not a zoom button on the cameo — that was tried and removed): app-wide crop modal (js/app.js showUnifiedCropModal) now
  has a zoom slider that resizes the crop around its centre.
