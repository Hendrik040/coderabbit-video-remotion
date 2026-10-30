# Launch-look vocabulary

The components of the launch-film look as the walk-and-talk example builds them. Each entry says:
- what the component shows;
- when to use it;
- its working values at 1080p and 60000/1001 fps;
- the pitfalls the code comments record.

`wf/` means `studio/src/walktalk-final/`. Values are this film's; keep them as starting points, not laws.

Contents:
1. Foundation: tokens, Stage, Plate, text column
2. Panel frame and captions
3. The attack surface map
4. The voxel agent cursor
5. Card to plate: the PR dot field
6. The app rebuilt from Figma, with a camera
7. Mini visuals for cards
8. Data visuals: the gap chart and the commit graph
9. Agents feeding a card: the review queue crew
10. The close: mini cards merging into a name
11. The brand frame: wipes, straps, outro
12. Not built yet

## 1. Foundation (`wf/graphics.tsx`)

**Tokens (`ui`):**
- ink `#0E0C0F`, panel `#1A181D`, chrome `#141216`, line `#3C3841`;
- white `#EFEDF0`, muted `#B5B2B9`, dim `#7D7982`;
- orange `#FF570A`, peach `#FF801F`, apricot `#FFA057`, mint `#25E2A8`, cobalt `#687FF5`;
- red `#FF3B30`, the Secure launch film's threat colour.

The fonts are Geist 400/600 and Hack 400/700.

**Curves (`studio/src/lib/motion.ts`):**
- `reveal`: (0.23, 1, 0.32, 1), for entrances;
- `travel`: (0.77, 0, 0.175, 1), for wipes and camera moves;
- `colorBar`: (0.65, 0, 0.35, 1), for drawing lines.

`revealAt` runs 0.6 s in and 0.4 s out, with a 28 px rise and a 12 px exit.

**`Stage`:** the dark ground.
- Ink, with an orange glow at the bottom right (alpha .34) and a faint one at the top left (.10).
- On top, a 4 px point grid on a 6 px pitch at 9%, masked to the bottom-right glow. It comes from the Change Stack hero.

**`Plate`:** the full-frame cutaway.
- It wipes in from the left behind an orange rail that leads by 22 ms, both on 0.5 s `travel`.
- It clears to the right the same way, orange first, so the orange never shows on the way out.
- `Plate` needs a clock that is 0 when it starts to wipe in.
- **Exit:** a scene sets `exitAt` to its span's end minus 0.5 s, or minus 0.55 s when it peels onto a wipe (Triage, Secure).
  - A plate either peels off onto the next wipe's bars at their full cover, or hides a picture cut under itself and clears onto the new shot.
  - The chart starts clearing on its cut; the Explain plate is held through its cut.

**Text column (x 120):**

| Element | Style | Position and timing |
| --- | --- | --- |
| `Kicker` | Hack 700, 22 px, uppercase, +2.6 px tracking, orange | top 118, enters at 0.35 s |
| `Headline` | Geist 600, 60–76 px (76 by default), line height 1.06, −0.034 em | top 152, enters at 0.45 s |
| `Body` | Geist 29/1.42, muted | enters at 0.7 s |
| `ListItem` | rows 420 or 560 px wide, sliding in from the column edge | |
| `Badge` | Hack 700, uppercase, 13 or 17 px | |

- **Headline motion:** each line rises through its own clip window (0.7 s reveal, 0.06 s stagger) and leaves on 0.45 s `travel` (0.04 s stagger).
- **Title order:** an old title must have fully left (0.5 s) before a new one rises into the same place.
- **Exception:** `TriageV3` counts its kicker and headline (0.3 and 0.4 s) from the hand-off, not from the span's start.

## 2. Panel frame and captions

**`CornerFrame` (`wf/secure.tsx`):** the panel a plate's product view sits in.
- Fill rgba(14,12,15,.72), a 1 px orange border at .3, and a 60 px orange line grid at .07.
- 12 px orange corner squares close in from 40 px out.
- `heat` (0 to 1) turns the frame red and adds a red wash, for attacks.
- **Standard box:** {700, 226, 1100 × 645}, the same place the other cutaways put their product window. The Change Stack app uses {640, 150, 1200 × 780}.

**Captions:**
- `PanelCaptions` (`wf/launch.tsx`, used only by the V1-era launch scenes) sets Hack 15 px with +2 tracking: white at the top left, orange at the top right with a blinking 8 px square, and 14 px footers.
- `SecureLaunch` draws its own captions in that style. In monitoring mode it raises them for phones: lane names to 15 px, POINTS MAPPED to 18 px, the status line to 20 px.

## 3. The attack surface map (`SecureLaunch`, `wf/secure.tsx`)

**Modes:**
- **Monitoring mode** is `security.launch.monitor: true` in the cue sheet. Besides the sweep's start (below), it gates the phone-sized captions, the agents' tag fade and their dissolve.
- **For a map that scans once, decouple those three from `monitor`.**

**Grid:**
- Five lanes with Leon's names: Entry points, Trust boundaries, Access controls, Sinks, Security config.
- Each lane is 4 × 8 tiles of 36 px with 8 px gaps. Lanes are 168 px wide with 30 px between them (a 198 px lane pitch).
- Per-lane density is [.78, .5, .62, .55, .36]. About 17% of the other tiles are grey.

**Assembly:**
- Each tile flies in from 240–540 px away, at 1.6–2.8× scale with up to ±75° of rotation, and lands between 0.75 and 1.65 s.
- 2D transforms only, cleared on landing: 3D tiles became composited layers that parallel renders dropped.

**DeepScan sweep:** a 150 px orange trail, a 2 px line with a 14 px glow, a foot square and a `DEEP_SCAN` label.
- **It always loops,** on a 2.2 s period. Monitoring mode only starts it earlier (`earliest` 0.6 s instead of 1.5 s).
- `sweepStart` phases the loop so one pass crosses the target tile (the zero-day sink) exactly at `flag`. Other flags are not synced to the beam.
- The label fades over its last 60 px before the map's right border.
- **Only `MiniChain` scans once.** Build a one-pass map when a beat says it found something.

**Flags:**
- `Lock`: a scan box that closes from a 76 px half-size to `tight` over 0.45 s, with 8 px corner squares.
  - `tight` 22 puts the corners in the gutters around the tile; the default 30 covers the neighbouring tiles' corners.
  - `until` fades it. Both locks on the V5 map let go: the zero-day's at `path + 0.35`, as the path reaches it (its corners would sit on the last leg), and the new risk's 1.2 s after its ping.
- `Ping`: two rings 0.4 s apart, each expanding to 3.4× over 0.9 s.

**The exploit path:** `route` and `Trace`.
- **It chains only vulnerable tiles.** Each turns red with a warning sign and pings as the line reaches it. `reachedAt` inverts the `travel` curve by bisection, so a ping lands exactly when the line arrives.
- **`route` keeps to the gutters.**
  - It runs along the 8 px gutter between rows and turns in the lane gaps.
  - It meets each tile at the middle of its top or bottom edge. The first tile is left on the side facing the next one; each later tile is met on the side facing the one before.
- **`Trace`** draws on 0.9 s `travel` with the `pathLength=1` dash trick.
  - The line is 3 px with a 6 px glow.
  - 8 px squares mark the turns in the lane gaps (`ends mark={8}`). The stops and both ends sit in an 8 px row gutter, between two tiles, so `stops` draws theirs at 4 px, touching neither.
  - Once it is drawn, a white packet runs along it.
- **Never route through a tile's centre:** the line crosses green tiles and the dots cover the warning signs.

**Builder agents:**
- Crews of two or three come in from off frame and drop new tiles at `agentBeats.drops`: [0.45, 0.8, 1.0, 1.35, 1.55, 1.9, 2.1] s after `agents`. A new tile lands from 1.5× with a white flash.
- On the risk beat (+2.75 s), one new tile is flagged orange, with a Lock and a Ping. In V5 it is the last drop, in Security config, a lane away from every leg of the path.
- **Where they work (`drops`, `crewSets`, `entrances`):** every slot sits at least a tile from the path's lines. Each crew's first tile is chosen so its tag, which hangs down and right of the cursor, clears the red tiles and the path, and the three first tiles are far apart.
- **Movement:**
  - each flies in over 0.86 s (it starts 1.0 s before its first drop) and decelerates into the tile;
  - agents hover by ±4 px;
  - after their last tile they park away (`parkAway`), clear of what the scan flags next and of the path's lines.
- **In monitoring mode:** each tag shows through the fly-in and fades over 0.25 s on the first tile, before the agent moves on. Each agent dissolves 0.2 s after it parks, over 0.6 s.

**Hostile variant (`guard`):**
- Three raiders come up from below; the outer two lunge at the two entry points.
- Mint guardrails grow in the lane gaps, and red traces stop at the rail with an X and "BLOCKED".
- The frame heats red.

**Labels:**
- ATTACK SURFACE MAP and AI DEEPSCAN.
- A TRUST & GUARDRAILS bracket over Trust boundaries and Access controls. It turns mint at `rails` (at `guard` in the hostile variant).
- "N POINTS MAPPED", where N is the drawn tile count: an illustration, not a scan result.
- An uppercase status line that steps through the beats, MONITORING through to GUARDRAILS UP.

## 4. The voxel agent cursor (`Agent`, `wf/secure.tsx`)

- **Cursor:** a 17-row arrow in 4 px voxels (52 × 76 px), with a light rim, about 20% coloured spark pixels, a dark body and a 0.8-voxel extrusion.
- **Tag:** Hack 15 px, +1.6 tracking, rotated −8°, hanging at (24, 74) with a hard offset shadow.
- **Props:**

| Prop | Effect |
| --- | --- |
| `tint` | a colour square before the label |
| `label={null}` | no tag |
| `labelOpacity` | fades the tag alone |
| `dissolve` (0 to 1) | removes the cursor pixel by pixel; the tag goes in the first half |
| `hostile` | red raiders |

- Use it for anything an agent does. The card kit's orange `Cursor` is "you". StackV3 still draws "you" as an `Agent` labelled YOU in white; use `Cursor` when reusing it.

## 5. Card to plate: the PR dot field (`TriageV3`, `wf/v3.tsx`)

1. **The card (card look):** a light "PR inbox" card at the top right, with a decoded title.
   - Its rows carry source chips: PM apricot, Design pink, Eng cream with a ring, Agent cobalt.
   - "Your team" appears only as mint dots in the field.
2. **The hand-off:** the plate wipes in over the card.
   - The card and its tag stay put until the plate's sweep covers them.
   - Each chip shrinks into a 20 px dot in place (0.3 s), then flies to its slot (0.75 s, 0.05 s stagger).
   - The dots draw on a layer **above** the plate, and must be gone before the plate's exit wipe.
3. **The field:** 44 columns on a 26 px pitch. "Your team" fills the first 16 columns in two mint rows; "now" climbs to 22 rows with the mix of sources.
4. **The beats:**
   - Flood: a column sweep.
   - Attention: 9 dots turn orange at 1.35× with a ring, and the rest dim.
   - Fast-track: dots turn mint and fly to a mint "main" line.
   - Close: dots turn grey and fall.
   - Done: the 9 gather under "READY FOR YOUR REVIEW" (Hack 700, 28 px).
5. **The honesty line:** "Each dot is a pull request. An illustration, not to scale."

## 6. The app rebuilt from Figma, with a camera (`StackV3`, `wf/v3.tsx`)

**Rebuild the app in code from Leon's Figma frames** rather than playing a screen recording.
- It has its own `appColors`, Geist at 16–48 px (48 for stat values) and Hack at 13–18 px.
- Make the sample numbers consistent with each other (24 files; 19 critical, 19 major), and let the window say it is a sample.

**The beats:**
1. Diff windows that "you" hops between.
2. Layers that land, each with a flash.
3. A sort. Rows that rise lift over the list on a raised card; rows that sink dim and pass beneath, so no two names ever print over each other (`isolation: isolate`).
4. File summaries.
5. A dependency popover and a bracket.
6. A sequence diagram, one message every 0.4 s.
7. Card chips: "Review first" and "Most critical findings".

**The camera:** a list of `shots: {at, s, c}`.
- **Easing:** each shot eases over 0.7 s of `travel` from the previous state as a cumulative reduce. Shots must be in time order and at least 0.7 s apart.
- **Transform:** 2D `translate(panelCentre − s·c) scale(s)`. Keep each view inside the app window.
- **Clip and lens mask:** the view is clipped to the panel. A lens mask (two intersected linear-gradient masks) grows its edge fade from 0 to 70 px as the scale goes from 1 to 1.3, so whatever the frame crops trails off instead of being cut mid-word.
- **Outside the camera:** elements outside the camera container must land before the first push-in.
- **Typical shots:** 1.2–1.5×, starting 0.35–0.55 s before the word that names the part.

**Clocks:** StackV3 runs Plate, Kicker, Headline and CornerFrame on span time, and everything else on edit seconds.

## 7. Mini visuals for cards (`wf/v3.tsx`)

The minis suit a recap where every product gets a 262 × 196 card. `MiniChain` mirrors this film's Security plate; the others stand for their product.

- **`MiniCodeReview`:** a scan steps down the lines and flags one. A review-comment row then opens under that line, with the "Bug flagged" chip on a row of its own.
- **`MiniTriage`:** list rows arrive; one turns orange (attention) and one leaves (fast-tracked).
- **`MiniBlast`:** the blast-radius view from Leon's Change Stack film, on his dark 20 px grid.
  - Six Hack 12 px nodes, each sized to its label. The changed node is orange.
  - Dashed orthogonal edges, mint at .55, become a marching orange dash when hot.
  - On "blast radius", two rings grow from the changed node and light only the reached dependents: the radius is precise, not everything nearby.
  - On "architectural impact", the deeper node (db) lights orange, its square turns red and a red "!" badge appears.
- **`MiniChain`:** a 9 × 5 grid of 16 px tiles.
  - One scan pass, after the grid has built, turns the chain tiles red with a 0.25 s bump.
  - The red tiles pulse on "zero-day vulnerabilities".
  - On "attack vectors", a gutter-routed path chains them, and a packet runs one lap. It then rests on the last tile, so it never jumps back as the card empties.

## 8. Data visuals

**`OutputChart` (`wf/scenes.tsx`):** "Output scales. Human review doesn't."
- An exponential orange line (4.5 px, 12 px glow, area gradient) against a nearly flat white line, drawn over 3.6 s on `colorBar`.
- Orange PR squares snapped to a 6 px grid.
- Labels wait until the lines part, with a dark halo: 28 px, axes 22 px.
- It was rebuilt without the animatic's sample multipliers: never show numbers you can't source.

**`ShippedGraph` (`wf/inserts.tsx`):** a GitHub-style contribution graph on a card.
- **Grid:** 7 px cells with 2 px gaps, one column per week, one cell per day, in five levels: grey for a day with no merges, then four mints.
- **Motion:** the sweep crosses the year in under a second. The last two months get a mint outline and a glow.
- **Stat:** decoded in Geist 600 48 px with the value in mint, each word in a slot the width of its final text (`Slot`), so the caption beside it never shifts. Its 25 px caption sits beside it on the same baseline.
- **Outline:** it hugs the last two months' cells, with its left edge in the 2 px gutter before them. With 5 px of padding it cut a week of cells in half.
- **Data, V5 (`graph.source: 'mono'`):** real merged PRs per day.
  1. `daily_prs.py` counts them with GitHub search.
  2. `make_graph_data.py` writes the JSON, with the counts and the level thresholds, to `.studio-data/walk-talk-final/public/media/shipped-mono-daily.json`, the path `useMonoDaily` fetches.
  3. `useMonoDaily` loads it behind `delayRender` / `continueRender`, so private counts never enter Git.
  - If the file is missing, the render hangs until the delayRender timeout.
- **Data, V4's default model:** it spreads weekly totals read off a published chart over the days, so its cells are an illustration.
- **Levels:**
  - any day with a merge shows green, so quiet months still read as shipping;
  - the levels are log-spaced, from the data file's `levels` (the fewest PRs a day for levels 2–4, about 4–6× apart), so weekdays, weekends and the year's ramp all show; linear levels against the busiest day put ten months on one level;
  - days still to come get no cell.
- **What the stat shows:** the busiest full week, with what it counts ("merged in one week").

## 9. Agents feeding a card: the review queue crew (`ReviewQueue` and `Crew`, `wf/inserts.tsx`)

**The card:** a dark "Pull request" card scanned one line per beat, with a "Line N" chip.
- Its tag changes on the word ("Code review" to "Merge queue").
- A counter climbs to "1,000+" with a cubic ease-out.

**The crew:**
- **Card and pile:** the card sits low enough to leave the sky above it to the agents. Its pile grows **up**, 3 px right and 8 px up per card, so even nine deep it stays clear of his hair.
- **Agents:** three come in from above the frame and hover about 140 px apart.
- **A PR's fall:**
  - it rides beside the cursor tip, never under the arrow;
  - it falls with t² and drifts sideways on an ease-out onto a landing span on the pile, at least 12 px clear of the tag;
  - it is drawn over the agents once released;
  - it lands with its bottom on the pile's top edge, over a mint flash only as wide as the PR, so the flash never strikes through its number.
- **Shadows:** the pile's cards cast their shadow down and left, so its far edge never darkens his hair.
- **Pile timing:** the pile grows over the first 16 drops and tops out on "a thousand". The newest card drops into place instead of popping in.
- **Tags:** they name the crew as he says "background agents" and are gone as the word ends, 1.4 s after `agents`. Only the first two PRs pass them.

## 10. The close: mini cards merging into a name (`CloseV3`, `wf/v3.tsx`)

1. Four mini cards appear, each as the voice names its product.
2. On "we call it", their contents empty in 0.18 s.
3. The bare shells move onto the name card's rectangle over 0.45 s, with one orange glow pulse.
4. Only the first shell keeps its shadow through the merge. Four stacked shadows vanishing in one frame made the sky flash.
5. The "We call it" tag and the four product chips arrive.
6. "Agentic / change / management" decodes one word per line on each spoken word: 64 px, first word orange.

The name card stays narrower than the grid, so it keeps clear of his face.

## 11. The brand frame (Sourabh's brand studio)

**`BrandAsset` and `Wipe` (`wf/WalkTalkFinal.tsx`):** the studio's renderers, drawn at 1280 × 720 and scaled 1.5×.
- The stack and colour-bar wipes take 2 s; the pixel wipe takes 2.4 s.
- Each wipe's opaque centre frame lands exactly on the picture cut, which hides take and location joins.

**Straps:** the colour-bar `name-intro-wipe`.
- The title sits on the top bar. The body and the company share the details bar: "Review AI-generated code · CodeRabbit".
- **Width:** the brand card is a fixed 560 on its 1280 × 720 canvas (840 px in the master), wide enough for "Review AI-generated code · CodeRabbit". In the walk-and-talk it covers his chin for about 1.4 s when he leans in at 95.5 s. Narrowing it would drop the "· CodeRabbit" he asked to keep, so V5 leaves it to him.
- Each strap lands on its spoken name once the frame is clear: the Explain strap as the colour-bar wipe's last bars clear, the Secure strap as the Explain plate clears the lower left.
- The presenter's name intro near the end ("Hendrik Krack · DevEx · CodeRabbit") is the related `name-intro` asset.
- The straps reach about y 984.

**`RevealStackWipe` (`wf/v3.tsx`):** the six rails redrawn in SVG.
- **Opening:** the white typemark is already in place, clipped to the dark rails, so the rails reveal it as they pass. Don't lengthen the opening to show it.
- **Into the outro:** it runs with fill `#000`, no logo and `until` 0.24 s. It stops inside the full cover, so it never masks the outro's logo.

**Outro:**
- The source is the team's `General-CodeRabbit-Assets/intros+outros/CR-sting-dark.mp4`, staged as `public/media/sting-dark.mp4` (`endSting: {file: 'sting-dark.mp4', seconds: 5.4}`).
- It plays muted; the render script adds its accents over the music's swell.
- **The run-on:** the cut into the outro is 0.95 s (57 frames) after the edit's end.
  - Without `media.runOn` of at least 57 frames, a still (`media.last`) covers that gap. That still was the freeze he rejected.
  - Build the A-roll with the extra frames, graded like the rest. V5 uses `aroll-v5.mp4` with `runOn: 72`.

## 12. Not built yet

Leon's films and project files contain more than the code has. `leon-assets.md` says where each piece appears.

- **3D-tilted UI planes with a camera dolly and lens blur:** rebuild them in 2D.
- **Red threat code passages, and pixel rain.**
- **Word-by-word statement cards** with one orange key word.
- **Runtime-verification node boards:** HIGH/LOW RISK boxes, LIBRARY and API columns, a mint callout.
- **The ASCII wipe, mosaic and pixelate transitions, edge glow and light sweeps.**
- **The "Available now" end card,** and the "Fix with AI" button with its toast.
- **A finding-to-fix-PR beat.** Suggested recipe:
  1. A dark `Plate` and `CornerFrame` code view, with the vulnerable line rebuilt in Hack and marked red, and a push-in on it.
  2. A voxel agent writes the fix as an added diff line, labelled as proposed in a PR.
  3. The tile stays red until a merge is shown.
  4. Hand off to a floating PR card, adapting `ReviewQueue` and `Crew`.
  - Leon's "FIX WITH AI" art is in the unextracted `secure-v2` zip.
