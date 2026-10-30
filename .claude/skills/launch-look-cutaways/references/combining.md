# Combining the launch look with the card skill

In one film, the floating cards (`product-ui-animations`) and the full-screen plates (this skill) must read as one design. These are the rules the walk-and-talk settled on, and the conflicts still left in its code.

## Which kit, which tokens

- **Copy `studio/src/walktalk-final/kit.tsx` for a mixed film, not the Antigravity kit.** It spreads the plate tokens (`ui`) into `C`. Its `wipe` keeps card shadows, and it adds `CardHeader`, `Spinner`, `lightCardStyle` and `monoWidth`.
- **When porting a scene from `src/antigravity/scenes.tsx`:**
  - map `C.ink` to `C.ink2` (`#121014`);
  - map `C.muted` to `C.dim` (`#7D7982`), because `muted` and `dim` are swapped between the two kits;
  - take the frame rate from the composition (the Antigravity kit hard-codes 30000/1001; this film runs at 60000/1001).
- **Shared:** orange `#FF570A`, mint `#25E2A8`, cobalt `#687FF5`, line `#3C3841` and panel `#1A181D`.
- **Conflicts to know:**
  - three inks: `#0E0C0F` for plates, `#121014` for chips, and `#121113` for the Broadcast fill, the default of `RevealStackWipe`;
  - plate threat red is `#FF3B30`, while the rebuilt app keeps its own `appColors` red, `#FF5C7A`.
  - Never mix inks or reds within one surface.

## Colour roles

| Colour | Means |
| --- | --- |
| Red | vulnerable |
| Mint | safe, merged, shipped, guardrails |
| Orange | attention, active, frames, the exploit path, the "you" pointer |
| Cobalt | agents (dots, chips) |
| Grey | closed |

- A fix that is proposed but not merged stays red, with a cobalt agent PR chip. It turns mint only on a merge the film shows.
- Allow one orange active item at a time on a card.
- **Card-kit overrides in a mixed film** (the card skill's defaults break these roles):
  - tags are neutral (ink or cream) unless they name an agent; the kit's default cobalt tag reads as an agent;
  - an in-progress status chip is orange or neutral, never mint;
  - don't use the semantic colours as decoration in highlights or chip trees;
  - give the PR inbox's team source a colour outside the semantic set.
- **Accepted exceptions in the example:** product chips carry product colours (Triage orange, Explain mint, Secure cobalt), and the dot field's "Your team" dots are mint.

## Type

| Surface | Scale |
| --- | --- |
| Plates | kicker Hack 700 22 px, uppercase, +2.6 tracking; headline Geist 600 60–76 px, −0.034 em; body Geist 29 px |
| Plate captions | Hack 12–28 px, uppercase, tracked 1–3 px |
| Cards | title Geist 600 30 px; chips Hack 700 15–30 px, sentence case, untracked (the counter is 34 px) |
| Close name | Geist 600 64 px, decoded a word per line |

- **Casing follows the container.** Plate kickers and captions are uppercase and tracked, as in Leon's films. Card tags, chips and labels are sentence case, as in the card skill.
- **Phone sizes by role:** see "Rules learned in review" in SKILL.md. Check every changed frame downscaled to 640 px wide.

## Corners, frames and wipes

- **Both systems frame with corner squares.**
  - Plates: `CornerFrame` 12 px squares, `Lock` 8 px, Leon's P1 card 10 px.
  - Cards: `PixelCorners`, three 6 px squares per corner, 10 px outside the card, arriving 0.12–0.2 s before it.
- **Everything moves left to right.**
  - A plate's rail and plate run on 0.5 s `travel`, with a 22 ms orange lead.
  - The card kit's `wipe` is 0.45 s `reveal` in and 0.35 s `travel` out. Its clip reaches 100 px past three edges so card shadows survive, and the last sliver fades.
- **Studio wipes sit under the plates.** Without a peel, a wipe drawn under an opaque plate pops in one frame. For a plate that peels onto a wipe:
  1. Start the plate's exit 0.2–0.4 s before the wipe's cut, so its 0.5 s peel runs while the bars cover the frame. Triage exits at 92.65 for the cut at 92.86; Secure at 144.15 for 144.53.
  2. Set `wipes[].under` to that exit time. It only tells the mix where the whoosh goes; the scene sets the peel itself (`v3.triage.exit`, or Secure's span end − 0.55).
  3. Change the two together, and check the frames around the peel.

## Timing cadence

- **Plates:** frame at 0.3 s, kicker 0.35, headline 0.45, body 0.7, captions 0.45. Exit at the span end minus 0.5 s (0.55 when peeling).
- **Cards:** corners at −0.12 s, tag at 0, card at +0.06. A connector starts 0.15–0.2 s before its chip.
- **Every beat sits on a measured voice onset, and the comments in `cues.ts` quote the word.**
  - Graphics leave before the next covering wipe, unless they are its peel.
  - Nothing shows before the cut a graphic rides on: leading corners leaked onto the previous shot in an earlier film.
- **A payoff lands on the word that names it, not a second later.** The outline of "the last two months" draws just after "months".

## How long each component needs

These are spans from the worked example, with each beat's offset from the span's start. Use them to budget a script.

| Component | Span | Beats (s from the span's start) |
| --- | --- | --- |
| Gap chart (plate) | 5.6 s | axes 0.4; line draws 0.5–4.1; second headline 2.7 |
| Shipped graph (card) | 7.9 s | tag 0.35; sweep 0.6 (0.9 s long); outline 1.5; stat 2.25; product chips 4.85 / 5.95 / 6.85 |
| Review queue with crew (card) | 17.4 s | scan from 0.44, a line every 0.55 s; pile 4.3; agents 8.7; counter reaches "1,000+" at 14; tag changes at 15.8 |
| PR inbox card, then dot field | 14.3 s card + 16.2 s plate | the plate's beats from the hand-off: flood 1.25; attention 5.8; fast-track 8.5; close 11.8; thrown 13.7; done 14.6; exit 16.15 |
| App with camera (plate) | 27.8 s | hops until 6.6; layered 8.5; then from layered: sort 1.7; files 3.7; popover 7.0; diagram 9.0; review first 15.4; focus 17.0 |
| Security map, monitoring (plate) | 15.7 s | tiles land 0.75–1.65; flag 3.5; path 5.35 (0.9 s draw); agents 6.86, drops up to +2.1, risk +2.75; rails 13.9; exit at span end − 0.55 |
| Close minis to name (cards) | 26 s | minis 0.2 / 5.4 / 8.7 / 13.35; name 19.85; words 20.9 / 21.45 / 21.8 |

## Hand-off patterns

| Pattern | Example | How |
| --- | --- | --- |
| Card becomes a plate | PR inbox chips → dot field | The plate wipes over the card. Each chip shrinks into its dot in place, then flies to its slot. |
| Plate peels onto a wipe | Triage, Secure | The plate exits during the wipe's full cover. |
| Plate hides a cut | the chart, Explain | The picture cuts under the plate, which clears onto the new shot. |
| Card chips inside a plate | "Review first" in the app | Kit chips inside the camera-pushed view. |
| Agents work on a card | the review queue crew | Voxel cursors drop PRs onto a card's pile. |
| Product visuals inside cards | the close's minis | Each mini runs its product's animation smaller. The cards then merge and decode the name. |

## Layout against a moving presenter

- **Map the presenter for each shot across the whole span.** A walking presenter leans and turns, so one frame's face box is not enough. Compare the render with the raw A-roll frame by frame wherever a graphic grows toward him: piles, wide cards, landing flashes.
  - In the example, his hair reached x 566 on one lean, so the nine-deep pile's corner bracket had to end by x 560.
- **Margins:**
  - cards start at x 96. Go as far left as x 40–60 only when a measured lean forces it, and note the shot;
  - tags sit 14 px in from their card;
  - none of these graphics go below y 960. The studio's straps reach about y 984.
  - The straps sit in the lower left, where his chin lands when he leans toward the lens. The full-width strap needs its width for the caption and "· CodeRabbit", so settle shorter copy or the framing with him early.
  - When a lean forces it, narrow the graphic (7 px graph cells, a 3 px pile step) rather than letting it touch him.
- **Agents in the sky:** give cursors the empty band above a card, about 140 px apart, so their arrival tags don't overlap.
  - Keep them out of the path of what they drop.
  - Their PRs fall onto the card's pile, clear of its tag.
- **Leave scenic shots and personal moments clean.**

## Draw order and clocks

- **Draw order in `WalkTalkFinal.tsx`:**
  1. A-roll
  2. Studio wipes (under everything)
  3. Floating inserts
  4. Chart, straps, plates and the close
  5. Name intro
  6. Outro, then the closing `RevealStackWipe` on top
- **Clocks.** `Plate` always takes a clock that is 0 when its plate wipes in.
  - The V1-era scenes use span time and subtract `from` from every cue.
  - The V3+ scenes use edit seconds (`useTime() + span.from`), so their cues read straight from the cue sheet.
  - `TriageV3` runs its plate children on plate time (`t − handoff`) and its legends on edit seconds.
  - `StackV3` runs Plate, Kicker, Headline and CornerFrame on span time.
  - Prefer edit seconds for everything that isn't a `Plate` child.

## Fitting a music bed

The walk-and-talk's bed starts a few seconds before the first wipe, lands a drop on it, ducks under the voice, and lands its ending on the end card. V5's three music alternatives fit other tracks the same way:

1. **Find the grid:** `scripts/music_grid.py <track> --bars` prints the tempo, the first downbeat and each bar's loudness, and marks section changes. It matched the known grid of "Beam Me Up" within 8 ms.
   - Produced tracks run at whole BPMs. When the measurement is within about 0.01 BPM of one (108.0035, 94.0004), use the whole number; a 0.3 ms error per bar adds up to 15 ms over a 50-bar segment.
   - Bars count from the first downbeat. Sections change on bar lines, often after a louder fill bar that ends an 8-bar phrase.
2. **Choose the drop:** the biggest early rise in loudness, such as the band's entry or a re-entry after a break. Land it on the first wipe, about 0.17 s before the cut. Start the bed 5–9 s earlier in a quiet part (an intro, a break or a breakdown), with `fadeIn` when it starts mid-track.
3. **Fill the film** with bar-aligned `music.segments`, each a [from, to] span of track seconds:
   - join sections of the same character (main to main), under continuous speech;
   - prefer joins on phrase boundaries; when the lengths force an odd number of bars, keep both sides of the join in the same section;
   - when the lengths allow, put a break or a re-entry near another wipe.
4. **Land the ending:** a stop on the end card, or an outro that starts as he finishes. The sting's pop lands 1.1 s after the card.
5. **Check it** with `scripts/bed_check.py <mix> <dialogue> <bpm> <drop second> <moments> --joins=<t>,...`:
   - the voice leads the bed by a median of about 24–26 dB while he speaks (V5: 25.9);
   - kicks keep the same offset from the grid on both sides of each join, within about 20 ms;
   - the mix stays at about −16 LUFS and at most −1 dBTP.
6. **Render:** a music alternative is a `Version` with `pictureOf`, so `--remux` builds it on that version's picture. `--mix-only` writes only the mix while you try a fit.

| Track | Tempo | Bed starts | Drop on the first wipe | Joins | Ending |
| --- | --- | --- | --- | --- | --- |
| Captain Qubz, "Beam Me Up" (V3–V5) | 125 BPM | 16.2 s, its intro | its drop, 8.06 s in | a 14-bar repeat at 143.2 s | the outro under the end card |
| Aves, "Roasted" | 83.007 BPM | 15.6 s, bar 22 of its breakdown | bar 25, the re-entry | 30 bars back at 70.5 s, main to main; its breakdown then sits under the Explain chapter change | the outro (bar 49) starts at 180.35 s, as he finishes |
| Curtis Cole, "Too Cool to Care" | 108 BPM | 17.6 s, its break (bar 16) | bar 19, the band's entry | back to bar 0 at 70.9 s; at 159.8 s to the last breakdown bar, so the build and final section carry the close | its stop lands on the end card |
| BalloonPlanet, "Adrenaline" | 94 BPM | 19.1 s, its two-bar break | bar 1, its first hit | the break again at 139.1 s, so its re-entry (bar 31) lands on the third wipe | its stop, just before the rabbit's pop |
