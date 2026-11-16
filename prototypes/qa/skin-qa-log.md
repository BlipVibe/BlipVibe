# Full-skin QA log

One place for every QA finding on the live full skins. Other sessions and the owner send findings to the QA session,
which fixes them, re-checks them in the simulator and records them here.

## How a screen passes

Each screen × skin × rendition is compared with its approved concept crop (`prototypes/reference/<skin>[-<rendition>]/`,
kept on this machine only), `images/skins/README.md` and the skin's `NOTES.md`. A screen passes only if all of these hold:

| # | Criterion | What fails it |
|---|---|---|
| P | **Pictures in frames** | profile photo, cover/banner, timeline photos, avatar rings/wreaths, story rings, post photos and store-card art each sit exactly in their frame or window: no offset, no spill, no gaps, nothing squished or stretched |
| T | **Text in boxes** | text overflows, clips, wraps out of its button/pill/tab/title bar/bubble art, overlaps an icon, or isn't centred where the concept centres it |
| D | **Decoration where the concept puts it** | a badge, icon, sticker or ornament is missing or misplaced compared with the concept |
| B | **Bars clear** | anything overlaps the top banner or the bottom bar (scrolling content passing under the bars is fine) |
| A | **Art, not CSS** | a CSS-drawn frame, gradient or ring stands in for art; fake checkerboard painted into art; old premium overlays (spinning ring, `.premium-border`) |
| R | **Readable** | text is hard to read over its background (menus included); text fields under 16px |
| M | **Menus/motion** | the account menu has every item on screen with Log out reachable; liked/disliked visibly fill; the skin's own swap/equip animations play and nothing just pops in |

Automated checks run on every capture too (`qaCheck` / `qaPlace` in the QA harness): horizontal scroll, fields < 16px,
premium overlays, squished `<img>`, text clipped in or spilling out of its box.

Cell values: **pass**, **fixed** (commit), **open** (what's wrong).

## Screens

home-top (top bar, profile card, timeline) · home-stories (stories, composer) · home-quests (featured skin, quests, coin
goal) · home-feed (feed posts) · liked (liked/disliked buttons) · groups · group page · messages · chat (keyboard open) ·
network · notifications · search · shop (cards, Owned tag, Coming soon, Equip/Take off) · other-profile (buttons) ·
other ⋯ menu · my profile · comments · create post · story viewer · account menu · settings · modals ·
rendition toggle + swap animation · equip transition

## Results

_The capture pass is in progress; rows fill in as each rendition is checked._

| Skin | Rendition | Screen | P | T | D | B | A | R | M | Result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Cross-skin fixes

| Fix | Commit | Skins |
|---|---|---|
| Someone else's profile: Mute / Block / Report moved into a ⋯ menu at the cover's top right, as in every concept (`wrapPvMore` in `js/fullskins.js`) | pending | all |

## Simulator-only quirks (not app bugs)

- Emoji show as `[?]` boxes in the iOS 26 simulator, on any font.
- The chat input bar is only drawn while the keyboard is open.
