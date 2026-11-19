# Group page — new concept art, every full skin (brief for Codex image generation)

Goal: a FRESH, richer look for ONE screen only — a single group's page (`#page-group-view`) — painted for one BlipVibe
full skin + rendition at a time. It must clearly belong to that skin: same frames, fonts, textures, palette, ornaments,
top banner and bottom bar as the skin's approved concept art. Concept art only: nothing gets built from this pass until
the owner approves.

## Output (one image per job)
- Use your image generation tool (gpt-image). ONE landscape image, **1536 x 1024**, saved as PNG to the path the job names.
- Plain soft neutral backdrop with **two iPhone portrait screens side by side** (same device frame style as the skin's
  concept sheets), each labelled small underneath: `GROUP PAGE — TOP` and `GROUP PAGE — SCROLLED`.
- Phone A and Phone B are the SAME page: A is scrolled to the top, B is scrolled down to the feed.
- Real app fields and plausible real-looking content only. NO lorem ipsum, no placeholder bars, no gibberish text. Every word
  readable and spelled right. No real brands, logos, celebrities or copyrighted characters.

## What the page holds (real fields from js/app.js — include ALL of them)
Phone A (top):
1. The skin's top banner/header (status bar 9:41, back arrow `←`, page title = the group's name in the skin's title style).
2. **Group cover** — a wide banner photo/painting for the group, framed in the skin's own frame art (make it a hero moment:
   bigger and more decorated than the current group page, e.g. the skin's signature frame/ornament around it).
3. **Group picture** — the group's own photo in the skin's avatar/picture frame, overlapping the cover.
4. **Group name** (big, skin title font) + one-line **description** under it.
5. **Stats row** — three stats: `Members` (e.g. 12,430), `Posts` (e.g. 318), `Group Coins` (e.g. 2,450, with the skin's coin icon).
6. **Buttons**: `Join Group` (primary, skin button art) and `Leave Group` (secondary/outline, danger tint). Optional small
   `Invite Link` and `Group Rules` buttons (scroll + link icons) — these two are real buttons on the page.
7. **Mode tabs**: `Feed` (active) · `Chat` · `Group Shop`.
8. **Members** card: heading `Members`, a row of 6 round member avatars in the skin's small avatar ring + `+42 more`.
9. The skin's bottom nav bar exactly as in its concept (Home · Groups (active) · Skins · Network · Messages, or the skin's own
   nav labels/icons), sitting at the bottom of the phone.

Phone B (scrolled):
1. Same top banner (collapsed header is fine) and same bottom nav (Groups active).
2. The tail of the Members card / the Group Rules + Invite Link buttons.
3. **Post bar**: small round user avatar + field text `Post in <Group Name>...`.
4. **Group Posts** heading in the skin's section-heading style.
5. Two group posts in the skin's post-card art: author avatar (skin ring), author name, time (`2h ago`), `⋯` menu, post text
   (1–2 lines, on-topic for the group), one post with a photo, then the action row with like (filled/active on one post),
   dislike, comment, share counts (e.g. 248 · 3 · 31 · share).

## Design rules
- Open the reference images the job lists FIRST and copy their look exactly: page background, card/panel art, frames,
  ribbons, tapes, fonts, icon style, colours, bottom bar, banner. The group page must look like it was on the original
  concept sheet — just a new, more special layout for this screen.
- "Fresh look": do NOT just repeat the old group-page crop. Make the cover + identity block feel like a crest/hero for the
  group (the skin's signature ornament framing the cover and picture), give the stats and members row their own skin-made
  pieces, keep the feed consistent with the skin's Home feed posts.
- Every visual is painted art in the skin's style (no flat web-UI boxes), but text stays crisp and readable on its art.
- Phone portrait proportions, comfortable tap sizes, nothing cramped or cut off by the phone frame.
- The group's topic, name, cover and post photos fit the skin's world (see the job's group name).
- Vaporwave: NO Windows or Apple logos anywhere. The taskbar Start button uses a small pixel palm-tree-over-sunset
  emblem (as in the reference), never a four-colour flag.
- Blood Moon Silver: NO red or pink anywhere (Leave Group uses frosty silver/ice-blue text, white roses only).

## Jobs (rendition id → group, references, output)
Paths: `MAIN` = /Users/danemuller/Developer/BlipVibe, `WT` = MAIN/.claude/worktrees. Output paths are relative to this worktree.

| id | Group name / topic | References to open first | Output |
|---|---|---|---|
| scrapbook | "Sunday Bakers Club" (home baking) | MAIN/prototypes/reference/scrapbook-master-v2.png, MAIN/prototypes/reference/scrapbook-profile-master.webp, MAIN/images/skins/scrapbook/concept-2.png | images/skins/scrapbook/group-concept.png |
| witchcraft | "Moonlit Herbalists" | MAIN/prototypes/reference/witchcraft/{group-page,home,groups,profile}.png, MAIN/images/skins/witchcraft/concept-v3-approved.png | images/skins/witchcraft/group-concept.png |
| anime-blaze (red) | "Shonen Sketch Squad" (drawing) | MAIN/prototypes/reference/anime-blaze/{group-page,home,groups,profile}.png | images/skins/anime-blaze/group-concept-red.png |
| good-witch day | "Enchanted Garden Society" | MAIN/prototypes/reference/good-witch/{group-page,home,groups,profile}.png | images/skins/good-witch/group-concept-day.png |
| good-witch night | "Enchanted Garden Society" | MAIN/prototypes/reference/good-witch-night/{group-page,home,groups,profile}.png | images/skins/good-witch/group-concept-night.png |
| vaporwave retro | "Synthwave Collectors" | MAIN/prototypes/reference/vaporwave/{group-page,home,groups,profile}.png | images/skins/vaporwave/group-concept-retro.png |
| vaporwave modern | "Synthwave Collectors" | MAIN/prototypes/reference/vaporwave-modern/{...} | images/skins/vaporwave/group-concept-modern.png |
| vaporwave retro-dark | "Synthwave Collectors" | MAIN/prototypes/reference/vaporwave-retro-dark/{...} | images/skins/vaporwave/group-concept-retro-dark.png |
| vaporwave modern-dark | "Synthwave Collectors" | MAIN/prototypes/reference/vaporwave-modern-dark/{...} | images/skins/vaporwave/group-concept-modern-dark.png |
| heavens-light day | "Temple Photography" | MAIN/prototypes/reference/heavens-light/{...} | images/skins/heavens-light/group-concept-day.png |
| heavens-light twilight | "Temple Photography" | MAIN/prototypes/reference/heavens-light-twilight/{...} | images/skins/heavens-light/group-concept-twilight.png |
| blood-moon crimson | "Midnight Opera Guild" | WT/blood-moon-skin-fcb151/prototypes/reference/blood-moon-crimson/{...} | images/skins/blood-moon/group-concept-crimson.png |
| blood-moon silver | "Midnight Opera Guild" | WT/blood-moon-skin-fcb151/prototypes/reference/blood-moon-silver/{...} | images/skins/blood-moon/group-concept-silver.png |
| superhero heroes | "Metro City Watch" (neighbourhood heroes) | WT/superhero-skin-8cfc5b/prototypes/reference/superhero-heroes/{...} | images/skins/superhero/group-concept-heroes.png |
| superhero villains | "The Syndicate Lair" | WT/superhero-skin-8cfc5b/prototypes/reference/superhero-villains/{...} | images/skins/superhero/group-concept-villains.png |
| basic rosé | "slow mornings club" (lowercase) | WT/basic-skin-65ee54/prototypes/reference/basic-rose/{...} | images/skins/basic/group-concept-rose.png |
| basic pumpkin spice | "slow mornings club" (lowercase) | WT/basic-skin-65ee54/prototypes/reference/basic-pumpkin/{...} | images/skins/basic/group-concept-pumpkin.png |

`{...}` = group-page.png, home.png, groups.png, profile.png in that folder (they are 3x crops of the approved concept phones).
Anime Blaze's other colours (blue/purple/green/pink) are hue-shifted from red in production, so only red is painted here.
Raw PNGs stay local (git-ignored under images/skins/**).
