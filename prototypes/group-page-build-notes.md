# Group page — 1:1 build notes (all full skins)

Owner, Nov 19 2026: approved all 17 Group page concepts, then "make all the groups 1 for 1 on the design. No room for
interpretation." Branch `claude/group-page-concepts-6f2572` (not merged).

## Targets
- Concepts (local only): `images/skins/<skin>/group-concept[-<rendition>].png` — left phone = top of the page,
  right phone = scrolled to the feed. Concept brief: `prototypes/group-page-concept-brief.md`.
- Contact sheets (local): `images/skins/_group-concepts/`; build comparisons: `images/skins/_group-concepts/build/`.

## How it is built
- `js/fullskins-group.js` — while a full skin is on, the group page is rebuilt as a MIRROR in the concept's order:
  sticky title banner (← + group name) · hero (cover in the frame's window + group picture) · name/description ·
  stats · Join/Leave (+ Edit for owners) · Invite Link/Group Rules · Feed/Chat/Group Shop · Members. Every value is
  read from the app's own group page (`#gvProfileCard`, `#gvMobileRight`, `#gvModeTabs`, `#gvCoverBanner`) and every
  tap is forwarded to the app's own button, so no feature is lost. A MutationObserver rebuilds it when the app's page
  or the skin changes. The real post bar + feed stay and are dressed by CSS. Groups is shown as the active nav tab.
- `css/fullskins-group.css` — hides the app's original blocks only while the mirror is on, places the art. Prefix
  `html body.fs #page-group-view.gp-on:not(#_)`, `!important` everywhere (the per-skin CSS forces backgrounds).
  Per-rendition geometry/type at the end, keyed by `[data-gp="<skin>[ <rendition folder>]"]`.
- Art: `prototypes/group-page-kit-brief.md` → Codex (one job per rendition) → `images/skins/<skin>/kit/group/<r>/`
  (local) → `prototypes/tools/group_convert.py` → `images/skins/<skin>/assets/[<rendition>/]gp-*.webp` + the
  generated `GP_ART` table in the JS (sizes + transparent windows → CSS vars `--gp-<piece>`, `-ar`, `-wl/wt/wr/wb`,
  `-ol/ot/or/ob`). Anime Blaze: red is painted, blue/purple/green/pink are hue-shifted by the converter.
- Index: `index.html` loads `css/fullskins-group.css` and `js/fullskins-group.js` after the full-skin files.

## QA
- Local preview, read-only: scratch `qa_server.py` serves this worktree with `window.__BV_QA_READONLY=true` injected
  and exposes `showGroupView` to a QA harness that renders a sample group (sample photos from `prototypes/sample/`,
  no account, no live data), applies a skin + rendition locally, and screenshots top + scrolled at 375x812.
- Logged-out preview shows the default avatar on the post bar (real accounts show their photo).

## Field corrections (concept → real app)
- Concept numbers are made up: the app shows its own (members as 12.4k, real post count, group coins).
- Join + Leave both appear only when joined ("Joined" + "Leave Group"); not joined = "Join Group" alone (centred).
- Chat tab only when joined; Group Shop only for owners / shop managers; Edit Group only for owners.
- The app's top bar (logo, search, bell, coins, avatar) gives way to the concept's title banner on this page, as on
  the other full-skin pages; the bottom nav stays.
