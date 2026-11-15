# Scrapbook extras set 8 — REALISTIC paper (the current pieces look like CSS boxes)

The owner's verdict on the live Messages and chat screens: "they look a bit too much like CSS".
Our current rows / bubbles / labels have thin, regular, tidy deckled edges, so they read as
rounded rectangles. The target is PHOTOREALISTIC torn paper, like a real scrapbook photographed
from above.

References (study closely):
- prototypes/reference/concept-messages.png — the Messages rows and the "Messages" tag
- prototypes/reference/concept-chat.png — the chat notes (bubbles), input bar, round buttons
- prototypes/reference/scrapbook-master-v2.png — all screens

What "realistic" means here (apply to every piece):
- Real torn edges: irregular, wandering tear lines with visible white/cream paper FIBERS where
  the paper was ripped (the torn edge shows the lighter paper core), not a neat scallop.
- Real paper surface: fine fiber grain, very soft crinkle/creasing (gentle, not crumpled),
  faint foxing/tea stains near some edges, slight tone variation across the sheet.
- Depth: a soft, slightly offset drop shadow under the sheet, as if lying on the page; on some
  pieces a second sheet (dusty pink or kraft) peeks out from underneath one edge.
- Warm, soft palette exactly like the approved Scrapbook art (cream / ivory / dusty rose / kraft).
- No text, no icons. Real alpha transparency outside the paper.

9-slice rules: corners are in the border zone and stay as drawn; the edges between corners
REPEAT, so each edge strip must tile seamlessly while still looking irregular (make the edge
segments long and varied so the repeat is not noticeable); the centre tiles too.

Deliver into images/skins/scrapbook/kit/extras8/ :

| file | size | what |
|---|---|---|
| row9-real-a.png | 1200x300 | Messages / list row: cream torn paper sheet, realistic torn top and bottom edges, gentle crinkle, soft shadow. 120px border zone left/right, 90px top/bottom. |
| row9-real-b.png | 1200x300 | Same, ivory sheet with a dusty-pink torn sheet peeking out under its bottom edge. Same zones. |
| row9-real-c.png | 1200x300 | Same, cream sheet with faint ledger lines and a light tea stain near one corner. Same zones. |
| bubble9-real-cream.png | 800x320 | Chat note (incoming) like concept-chat.png: cream torn paper note, ragged torn edges all round, soft shadow. 100px border zone. |
| bubble9-real-pink.png | 800x320 | Same in dusty-rose paper (outgoing). |
| label9-real.png | 700x260 | Page-title tag like the "Messages" tag: torn cream paper scrap, a little tilt in the tear lines, soft shadow. 80px border zone. |
| field9-real.png | 900x220 | Text field like "Type a message...": light cream torn paper strip, slightly lighter than the bar. 80px border zone. |
| bar9-real.png | 1290x300 | Bottom input bar strip: cream torn paper, realistic torn TOP edge, full width (ends run off the canvas), soft shadow on the top edge. |
| circle-real.png | 300x300 | Round cream paper disc button (search / compose / + / emoji), torn-ish circular edge, soft shadow. Plain. |
| circle-real-rose.png | 300x300 | Same disc in dusty rose (send button). Plain. |

Verify sizes, alpha and seamless edge tiling (tile each 9-slice edge 3x in a test image and check
the joins), then show a contact sheet with each piece on the cream background.
