# Standard per-skin brief for a Codex chat (sheet 2 + asset kit)

Replace <NAME>, <ID>, and the DIRECTION line. Paths use ~/ (a leading "/" triggers the app's
slash-command autocomplete).

---

You are producing production art for the "<NAME>" skin of BlipVibe, a mobile social app.
Use your image generation; do NOT write application code. Save every file as PNG at the exact path,
creating folders as needed, and save each file as soon as it is done.

Style reference (open it and match it exactly — materials, palette, shapes, icon style, fonts):
~/Developer/BlipVibe/images/skins/<ID>/concept.png
DIRECTION: <one-line summary of the skin, its avatar shape and timeline-photo treatment>

PART 1 — SHEET 2 (skip if ~/Developer/BlipVibe/images/skins/<ID>/concept-2.png already exists)
~/Developer/BlipVibe/images/skins/<ID>/concept-2.png — about 1180x1330, 9 iPhone screens in a 3x3 grid,
same style as the reference, real labels:
1 Home (full): stories bar, "What are we posting today?" composer, featured-skin banner, Daily Quests,
  coin goal bar, feed tabs Following / Discover / My Posts, a post (like, dislike, comment, share)
2 Network: tabs Connections / Not Following Back / People You May Know; people with Follow
3 Notifications: like, follow, reply, mention, message, group invite, skin purchase
4 Search: field, tabs People / Groups / Posts, results
5 Group page: cover, name, members, Join; tabs Feed / Chat / Group Shop; a post
6 Someone else's profile (same profile layout as the reference): Follow, Message, Close Friend,
  Invite to Group, and a more menu with Mute, Block, Report
7 Comments: thread with like, dislike, react, reply; input with GIF and emoji
8 Create post: text, add photo, camera, emoji, GIF, poll, schedule, Post (no audience picker, no char counter)
9 Story viewer: progress segments, author, reply field, react

PART 2 — ASSET KIT (all in the reference's exact style)
QUALITY RULES (checked automatically; failures are sent back for regeneration):
- Panels, chips, buttons and nav/header strips must have perfectly clean, flat, uniform CENTERS
  (a solid or very smooth fill) — no blurry blotches, smudges, dark shadows, noise or texture blobs
  in the middle. Decoration belongs on the edges only.
- The avatar mask is a solid white shape with crisp edges on full transparency.
- Every grid cell contains exactly one item, fully inside its cell.
All sprite sheets: 2048x2048 PNG, TRANSPARENT background, a strict invisible grid of equal cells,
each item centered in its cell with generous padding, nothing crossing cell edges, no text labels.

a) ~/Developer/BlipVibe/images/skins/<ID>/kit/background.png — 1080x1920 full-screen app background,
   calm and low-contrast in the middle, theme detail toward the edges, NO UI, no text.
b) ~/Developer/BlipVibe/images/skins/<ID>/kit/icons.png — 5 columns x 4 rows (20 icons), in this order,
   left-to-right, top-to-bottom: home, groups, skins, network, messages, like, dislike, comment, share,
   search, bell, music, coin, camera, back-arrow, plus, send, emoji, edit-pencil, more-dots.
c) ~/Developer/BlipVibe/images/skins/<ID>/kit/panels.png — 2 columns x 2 rows: (1) standard card panel,
   (2) highlighted/active card panel, (3) small chip/tab, (4) active chip/tab. Plain uniform centers so
   they can be stretched as 9-slice; decorated edges only.
d) ~/Developer/BlipVibe/images/skins/<ID>/kit/buttons.png — 2 columns x 2 rows: primary button,
   secondary button, round icon button, the nav's active-tab highlight graphic. Empty (no text).
e) ~/Developer/BlipVibe/images/skins/<ID>/kit/nav.png — 1 column x 2 rows: (1) the bottom nav bar
   background strip (wide), (2) the top header bar background strip (wide).
f) ~/Developer/BlipVibe/images/skins/<ID>/kit/frames.png — 2 columns x 2 rows: (1) the timeline-photo
   frame overlay(s) exactly as on the profile with transparent openings where photos show,
   (2) the avatar frame/border overlay with a transparent opening, (3) the avatar MASK: the avatar
   shape in solid white on transparent, (4) a post-photo frame overlay with a transparent opening.
g) ~/Developer/BlipVibe/images/skins/<ID>/kit/quests.png — 3 columns x 1 row: the Daily Quest element
   (e.g. bottle / bowl / gauge) at empty, half, and full.
h) ~/Developer/BlipVibe/images/skins/<ID>/kit/deco.png — 3 columns x 2 rows: six signature decorations
   unique to this skin.
i) ~/Developer/BlipVibe/images/skins/<ID>/kit/thumb.png — 1024x1024 square skin-card thumbnail
   (skip if ~/Developer/BlipVibe/images/skins/thumbs/<ID>.png exists).

When everything is saved, list the files.
