# Blood Moon — PROFILE composition (owner, Nov 16: "Profile page" — match the concept profile exactly)

Reference crops: `prototypes/reference/blood-moon-crimson/profile.png` and `prototypes/reference/blood-moon-silver/profile.png`.
In both: a HUGE moon at the top centre over gothic spires; a tall pointed gothic stained-glass ARCH on the LEFT (opera house
dome inside) and one on the RIGHT (castle inside), each with black iron + silver tracery and a pointed top with a finial; a WIDE
scalloped/trefoil gothic ARCH across the BOTTOM (the bridge scene) whose top edge tucks under the round profile cameo; roses at
the bases. The three window openings will hold the user's 3 cover photos; the round profile photo frame sits in the middle top
(the app adds it — do NOT paint a cameo or a face).

Paint, for EACH rendition (Crimson = antique silver tracery with ruby glass, red roses, blood-red moon; Silver = bright frosty
silver tracery with ice-blue glass, white roses, silver-white moon, NO red), painted independently (no recolour/filter):
| file | size | what |
|---|---|---|
| profile-windows.png | 1290x1470 | the FRAME ONLY: left arch, right arch, bottom wide arch, their tracery, finials, small ruby/ice glass accents and roses at the bases. The three openings FULLY TRANSPARENT. Everything outside the frame (the top-centre moon area, the middle where the cameo goes, the far edges) FULLY TRANSPARENT. Placement (percent of the canvas): left arch opening ~x 4–29 %, y 8–76 %; right arch opening ~x 71–96 %, y 8–76 %; bottom arch opening ~x 15–85 %, y 64–96 %; the bottom arch's top centre dips down where the cameo will overlap (centre ~x 50 %, y 45 %, cameo ~38 % wide) |
| profile-windows-mask.png | 1290x1470 | white = the three openings, black elsewhere (derive it from the finished frame's alpha so it matches exactly) |
| profile-sky.png | 1290x1470 opaque | the scene that shows AROUND the windows: the huge moon at the top centre (~45 % of the width, centre ~x 50 %, y 18 %) with thin clouds, gothic spires/castle silhouettes below it, fading into the dark page colour (Crimson: very dark wine; Silver: midnight blue) over the bottom third |

Save Crimson into `images/skins/blood-moon/kit/crimson/` and Silver into `images/skins/blood-moon/kit/silver/` (same names).
Real alpha, no text, no people. Finish with `images/skins/blood-moon/kit/_profile-sheet.png`: each rendition's sky with the frame
composited on top next to its concept profile crop.
