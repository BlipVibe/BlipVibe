# Superhero — profile REDESIGN concept (both renditions)

Owner (Nov 16) on the shipped profile: "the profile picture is literally covering one of the pictures, we shouldn't do
that. Also this one doesn't look very structured. Maybe have ChatGPT do a redesign?" Earlier: "the profile area should be
completely organized different for heroes and villains … like placement … I like the styles the way they are."

Paint CONCEPT MOCKUPS (phone screens) of a new, clearly STRUCTURED profile layout for each rendition. Keep each rendition's
existing STYLE exactly (open the finished kits and the shipped look and reuse their materials, colours, line weight):
- HEROES kit `images/skins/superhero/kit/heroes/` (golden-age comic: cream halftone paper, thick black ink, red / blue /
  yellow, gold, starbursts, red ribbon banners, yellow plaque buttons, art-deco skyline).
- VILLAINS kit `images/skins/superhero/kit/villains/` (lair: gunmetal plates, bolts, hazard stripes, neon green + purple,
  cracked glass monitors, skull-circuit sigil, angular cut corners).
Approved concept sheets for reference of the whole skin: `images/skins/superhero/concept-heroes*.png`,
`images/skins/superhero/concept-villains*.png`.

HARD RULES for the layout
1. NOTHING overlaps a timeline photo. The profile photo, name, badges, stickers must never cover any of the 3 timeline
   pictures — each picture is fully visible inside its own frame.
2. Structured: a clear grid, aligned edges, consistent gutters and spacing, sections that read top-to-bottom; no element
   floating half over another.
3. Heroes and Villains must be organized DIFFERENTLY (different placement / section order / alignment), not the same
   layout recoloured. Heroes reads like a well-composed comic page (panels in a grid); Villains like a surveillance
   dossier / control terminal.
4. Real app content only (show these, nothing invented): the app top bar (back arrow on the profile page), the 3 timeline
   photos (one of them is the cover photo, each tappable to change it — show a tiny camera badge on each on YOUR profile),
   the round profile photo with a small camera badge (yours), name, a one-line status, a bio line, a row of small round
   badge icons, Following / Followers counts, and the buttons:
   - your own profile: EDIT PROFILE
   - someone else's: FOLLOW (or FOLLOWING), MESSAGE, MUTE, BLOCK, REPORT, CLOSE FRIEND, INVITE TO GROUP, plus a ⋯ menu
   then a PHOTOS section (tabs Photos / Albums, a grid of thumbnails) and the bottom nav (Home, Groups, Skins, Network,
   Messages).
5. Readable text everywhere (dark ink on cream for Heroes, light on dark for Villains); 16px+ text sizes.

Paint TWO sheets (portrait phones with dynamic island, dark sheet background), save to `images/skins/superhero/`:
- `concept-profile-heroes.png` (~1300x1450): 3 phones — (a) your own Profile, (b) someone else's Profile with the buttons,
  (c) the HOME page top (top bar, the 3 timeline photos + your profile photo, name, counters — same no-overlap rule, a
  layout that fits Home). Title "Superhero — Heroes profile".
- `concept-profile-villains.png`: the same 3 screens for Villains. Title "Superhero — Villains profile".
Placeholder photos (realistic people / city photos) are fine on the concept. Keep all the app's real labels in English.

## Approved (owner: "Build them") → production piece still missing
HEROES only, into `images/skins/superhero/kit/heroes/` (match concept-profile-heroes.png phones a/b exactly):
| file | size | what |
|---|---|---|
| timeline-row.png | 1290x470 | the profile page's row of THREE EQUAL SQUARE comic panels, straight (no tilt), thick black ink borders with a thin white inner line, even ink gutters, on transparent; windows fully transparent; leave ~4% margin all round |
| timeline-row-mask.png | 1290x470 | white = exactly the three panel windows, black elsewhere (derive from the frame's alpha) |

## Heroes 1-for-1 pass (owner: "gotta stay within the concepts. The hero one looks like this")
HEROES only, into `images/skins/superhero/kit/heroes/` — copy concept-profile-heroes.png exactly:
| file | size | what |
|---|---|---|
| banner-bar.png | 1290x170 | the FULL-WIDTH red top bar of each phone (behind "PROFILE" / "BLIPVIBE"): a red comic banner strip spanning edge to edge, thick black ink outline top and bottom, a yellow 5-point star just inside each end of the centre zone, slight fold shading; the middle is plain red (title goes there) |
| ink-rule.png | 1200x16 | the thin horizontal black ink line that separates the sections (hand-inked, slightly tapered ends), transparent around it |
| badge-ring.png | 240x240 | the round badge frame of the badge row: thick gold ring with black ink outline, fully transparent centre (~72% window) |
