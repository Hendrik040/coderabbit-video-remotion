---
name: product-ui-animations
description: Use this skill whenever creating or modifying simplified, animated product-UI inserts in Remotion for a presenter-led video instead of raw screen recordings, such as floating UI cards beside the speaker (a terminal that types the command, a prompt card that highlights spoken phrases, an app card with a clicking pointer), chip-and-connector infographics (requirement trees, review loops, status chips, question rows) and full-screen stages (a finding, a suggested fix, an end card). Triggers on requests like "animate the demo instead of the screen recording", "simplify the UI", "terminal typing animation", "chip tree", "connector diagram", "floating cards next to me", "launch video inserts", "finding card", "like a reference launch video", "make it easier to understand what's going on", "retime the inserts", "move a card away from my face", "re-render the Antigravity inserts", or any request to build or tweak a product-UI insert. Always consult this skill before writing a product-UI insert from scratch.
version: 1.0.0
---

# Product UI Animations Skill

This skill builds the simplified product animations that replace screen recordings in a walk-and-talk or launch video. A dense real screen is hard to read at video size. The same moment rebuilt from a few cards, chips and connectors shows only the step being explained, lands each beat on the spoken word, and stays in CodeRabbit's brand.

The canonical worked example is the CodeRabbit plugin for Google Antigravity launch film (October 2026):

| File | What it holds |
| --- | --- |
| `src/antigravity/kit.tsx` | Brand tokens (`C`), local fonts, motion curves and the primitives listed under The kit |
| `src/antigravity/scenes.tsx` | Eight inserts: terminal install, prompt and review loop, login demo, questions, review run, finding stage, files changed, end card. Also the unexported helpers `card()`, `Tag`, `Spinner` and `TreeChip` |
| `src/antigravity/index.tsx` | The film's own Remotion entry point; each composition is exactly as long as its slot in the edit |
| `scripts/render-antigravity.mjs` | Review stills, then ProRes masters: 4444 with alpha for overlays, 422 HQ for full-frame stages |

Read `references/scene-recipes.md` for each scene's structure and cue sheet, `references/render-and-verify.md` for render commands and checks, and `references/reference-analysis.md` for studying a reference film frame by frame. Start new work by copying the kit, not by re-deriving it.

## When to use it

- A demo moment where the real screen is small, slow or busy: an agent prompt, a terminal command, an app flow, a review result, a list of changed files.
- The user wants the presenter to stay visible: floating cards sit in the empty side of the shot, so no full-screen cutaway is needed for most beats.
- One moment per video deserves a full-screen stage: the product's key result (here, the returned finding and its suggested fix).

Not for:

- A user's own polished screen recording (for example a Screen Studio export). Show it as recorded and put the presenter in a bubble; that is an editing task.
- A faithful imitation of one app's real interface. Use `slack-ui-demo`.
- Abstract loops and pipeline diagrams with no product content. Use `infographic-flows`.

## Workflow

1. **Study the reference, if there is one.** Download it, map every cut from frame differences, and make dense contact sheets of the UI segments (`references/reference-analysis.md`). Borrow techniques and pacing only: floating cards, chip trees, typed terminals, a pointer that clicks, a full-screen stage for the key moment. Never copy another company's artwork, logo, layouts or copy.
2. **Inventory the true material before designing.** Collect the real prompt text, the real file list and counts, the real finding wording, the real app screens, the real command. Mark what is absent. Where the narration names something the product cannot show, map it to the nearest true element and say so. In the worked example the demo app had no sign-up screen, so "you can create an account" shows its synthetic test accounts.
3. **Build a cue sheet from word timings.** Map ASR word starts onto the edit timeline, then into composition seconds: `t = T - startFrame / fps`. Each beat lands on the word that names it (see Timing). If the narration doesn't name the step yet, get the slot and the line before building.
4. **Measure the layout zones per camera angle.** Sample real frames at each insert's time, measure a face box per shot, and note where the gesturing hands are. Keep overlays in the empty side of the shot and above the caption band (see Layout and fit).
5. **Write one composition per insert** with `durationInFrames` equal to the insert's slot in the edit and `fps` equal to the edit's rate (`30000 / 1001` for 29.97). Timing shows how to convert a slot given in seconds.
6. **Render stills first, then composite them over the real presenter frames** at the same timeline frames. Zoom into chips, cards and arrows at full size before rendering video. The commands are in `references/render-and-verify.md`.
7. **Render the masters, place them, review in context.** Fix from the review notes and render to new filenames.

## Brand system

Tokens come from the official palette in `studio/src/lib/brandPalette.ts`. The kit repeats palette entries as `C` and adds four kit-local values (last row) that are not in the palette:

| Role | Palette step, hex and kit key |
| --- | --- |
| Ink, ground | Mauve 1 `#121014` `C.ink`, Mauve 2 `#1A181D` `C.panel` (dark card), Mauve 4 `#2B282F` `C.raised` (focused code row), Mauve 6 `#3C3841` `C.rule` (card border) |
| Text on dark | Mauve 12 `#EFEDF0` `C.text`, Mauve 11 `#B5B2B9` `C.dim` (secondary), Mauve 10 `#7D7982` `C.muted` (muted label) |
| Signals | CR Orange `#FF570A` `C.orange`, CR Mint `#25E2A8` `C.mint`, CR Cobalt `#687FF5` `C.cobalt` |
| Signal steps | Primary 10 `#FF801F` `C.orangeSoft` (brand word in a command), Secondary 3 `#062619` `C.mintDeep` (status chip ground), Secondary 7 `#006947` `C.mintDark` (added lines and counts) |
| Light stage | Cream 6 `#F7F2EF` `C.cream` ground, Cream 5 `#EBE7E6` `C.cream2`, Cream 4 `#DACDC6` `C.cream3` rules, Cream 3 `#A1887E` `C.cream4` (labels on light cards, stage connectors), Cream 1 `#311C15` `C.brown` ink |
| Kit-local, not in `brandPalette.ts` | paper `#FFFCFA` `C.paper` (light cards), orange tint `#FFE4D6` `C.orangeTint` (removed line), mint tint `#D2F7E8` `C.mintTint` (added line), cobalt tint `#E1E6FF` `C.cobaltTint` (unused by the scenes) |

The kit's cream keys are offset from the palette step numbers: `C.cream` is Cream 6, `C.cream2` is Cream 5, `C.cream3` is Cream 4 and `C.cream4` is Cream 3. Pick a cream by its key or hex, never by its step number.

- **Fonts:** Geist 400 and 600 for reading and headings, Hack 400 and 700 for commands, file names, chips and code. Load the local files in `public/brand/fonts` with `FontFace` behind `delayRender` (`useBrandFonts()`), never from Google Fonts. The older skills in this repo use IBM Plex Mono; these inserts follow the current brand kit.
- **Motion:** the brand's shared curves and timings from `studio/src/lib/motion.ts`. Reveals use `Easing.bezier(0.23, 1, 0.32, 1)` over 0.6 s with a 28 px rise. Exits take 0.4 s and move 12 px back toward the entrance edge. The kit's `envelope` now does this too. The v6/v7 masters predate the fix, but it changes none of their frames, because no shipped insert calls `appear()` with a finite end. Covering wipes and camera moves use `Easing.bezier(0.77, 0, 0.175, 1)`. Stagger children by 60 ms.
- **Colorways:** cards over footage are dark (Mauve 2 with a Mauve 6 border and a soft offset shadow) or light (Cream 6 or paper for an app or browser card). Full-screen stages use the light colorway: a Cream 6 ground, a faint 3 px pixel field and the orange typemark. Signal chips are solid Orange, Mint or Cobalt with ink text. Neutral labels sit on cream, paper or ink, and status chips have their own style (below). In a tree, use one color per item. In a sequence, keep one orange item active at a time.
- **Status chips:** mint text on `C.mintDeep`, Hack Bold 19 px, lowercase like `review running`, with a `Spinner` while the process runs. Place one 24 px below its card at the card's x, with no connector, and end the caret with `until` as the chip lands (D3: chip at 3.3 s, `until={3.35}`). Never show account names, emails, URLs or one-time codes that a real run prints.
- **Logos:** the official artwork only, never redrawn. Use `public/cr-logo.png` (orange circle, white rabbit, transparent corners) on light surfaces and `public/brand/white-logomark.svg` on orange or cobalt chips (`<Logomark onColor/>`). Use `public/brand/orange-typemark.svg` on light stages. Do not use `public/cr-rabbit-orange.png`: its corners are opaque black and show as a dark square on a chip.

## The kit

| Primitive | Use |
| --- | --- |
| `FPS`, `MONO`, `SANS` | The edit's frame rate (`30000 / 1001`) and the Hack and Geist font stacks |
| `useClock(startFrame)` | `t` in composition seconds; `at(T)` converts a timeline time when a cue is noted that way |
| `reveal(v)`, `travel(v)` | The two brand curves (reveal and covering travel) on a clamped 0–1 progress |
| `clamp01(v)`, `mix(a, b, p)` | Clamp to 0–1, and linear interpolation |
| `envelope(t, start, end?, enter = 0.6, exit = 0.4)` | `{a, b, o, y}`: entrance and exit progress, combined opacity, and the offset: a 28 px rise on entry, then 12 px back toward the entrance edge on exit |
| `appear(t, start, end?, enter = 0.6)` | Style for a fade with the brand rise; for text blocks and cards that do not wipe |
| `wipe(t, start, end?, enter = 0.45, exit = 0.35)` | Left-to-right clip reveal modeled on the name lower third, timed faster (0.45 s in, 0.35 s out) than the brand's 0.6/0.4 s. Use it for cards, tags and chips. The clip also cuts the element's own shadow (see Key rules) |
| `abs(x, y, extra?)` | Absolute-position style at (x, y) |
| `Chip` | Solid label: Hack 700 by default, 6 px radius, padding derived from the font size, `whiteSpace: nowrap` |
| `Connector` | Elbow polyline that draws on with `strokeDasharray`, ending in one 6 px square brand pixel |
| `typedCount(t, schedule)` | Characters shown from `[time, count]` pairs. Two pairs 0.01 s apart make a step, so words appear on their spoken word and hold |
| `Caret` | Steady while typing, then at most four blinks (half-second phases) from `blinkFrom`, then steady. `until` hides it |
| `Decode` | Characters resolve left to right out of seeded glyph noise that changes every two frames. Deterministic across renders |
| `Cursor` | Orange arrow with a white outline. It travels between keys with the travel curve (at most 0.55 s per move), dips 14% on a click and draws an expanding orange ring |
| `PixelCorners` | Three-square brand pixel brackets centered 10 px outside a card's corners (their outer edge sits 13 px out). They fade in over 0.2 s; the install, prompt and login cards start them 0.12 s before the tag (0.18 s before the card). Positions round to whole pixels, and opacity above 0.995 snaps to 1 |
| `PixelField` | Fine 3 px pixel pattern with a radial falloff for light stages |
| `Logomark` | Orange mark on light, white mark on color (`onColor`) |
| `Check` | Square-capped check mark for done steps and the signed-in banner |

`card()`, `Tag`, `Spinner` and `TreeChip` live in `scenes.tsx` and are not exported, so copy them with the kit. `card(dark)` is the 14 px-radius card with a 1.5 px border and a two-layer shadow. `Tag` is a Hack 21 px chip, cobalt with ink text by default, with its top 46 px above the card's top and its left edge 14 px in from the card's, clear of the corner bracket. `Spinner` is eight 4 px pixels at 1.6 turns per second. `TreeChip` is a chip whose connector starts drawing 0.18 s before it.

## Scene patterns

Each pattern below is one composition in `scenes.tsx`. The details and cue sheets are in `references/scene-recipes.md`.

- **Terminal card, typed on the words.** A `Terminal` tag above a dark card, then `$` and the command typed word by word as the presenter says each word. Once typed, the brand word eases to Primary 10 `#FF801F` (`C.orangeSoft`), from 5.6 s over 0.3 s in 08. The `$` is CR Orange `#FF570A` (`C.orange`). Find the brand word with `indexOf`, as `CliInstall` does, so a new command colors the right letters. Show the command, never invented output.
- **Prompt card that reads along.** The real prompt types in fast while the presenter says "I put in this prompt". Each key phrase gets a color highlight as it is read aloud, sweeping left to right behind the words, and branches out of the card as a chip on a connector (some chips shorten the phrase). After the camera cut, the review instructions highlight and build a second tree with a loop-back arrow.
- **Simplified app card.** A light card tagged with the app's real URL shows one screen at a time as a small state machine. The pointer moves to a real control, clicks, fields fill, the next state crossfades in. The chips from the prompt card reappear inside the app, so the viewer sees the requirements become features.
- **Question rows.** A root chip and one row per question, each a cream row with an orange `?` chip. Each question decodes in on its first word.
- **Chain into the CLI.** Plugin chip, then the agent chip, then a terminal that types the real review command, then a status chip with a pixel spinner. Each link up to the terminal draws a connector first; the status chip has none.
- **Full-screen finding stage.** Step chips across the top (1 Analyze, 2 Finding, 3 Suggested fix) mark progress. A dark code card shows the real key line among abstract bars, and a scan passes over it while the presenter says "analyzes". Context chips for the real related files connect on "surrounding codebase". The finding card arrives on "returns findings": the mark, product name, severity chip and headline. The explanation types in, the operator gets an orange block, and a callout connector links it to the removed line. The suggested fix line follows, labeled "Suggested fix".
- **Changes card.** The real "N files changed +A −D" header, the real file list staggered in, and the pointer clicking Review. Rows take a cobalt highlight.
- **End card.** On a cream stage: the orange typemark, a one-line product title, the install command on an ink chip with an orange `$`, and the docs URL decoding in.

## Timing

- Land each beat on the word that names it. Start each entrance (highlight, chip, row) on the ASR start of its word, as the worked example does.
- Cards wipe in over 0.45–0.55 s and chips over 0.45 s. Start a connector 0.15–0.2 s before its chip and draw it in 0.3–0.5 s, so the chip wipes in as the line arrives.
- Typed commands follow the spoken words: a step to the next word at each word start, linear typing to the word's end, then a hold. When only word starts are known, type each word at about 28 characters per second (0.035 s per character, the 08 rate) and finish before the next word starts. For `coderabbit auth login` with words at 1.2, 2.0 and 2.9 s:

  ```tsx
  const n = typedCount(t, [[1.2, 0], [1.55, 10], [1.99, 10], [2.0, 11], [2.14, 15], [2.89, 15], [2.9, 16], [3.08, 21]]);
  // cmd.slice(0, n), then <Caret t={t} h={36} w={16} blinkFrom={3.1}/>; with a status chip, end it with until instead
  ```

- Pasted prompts type at about 125 characters per second (197 characters in 1.55 s).
- A slot given in seconds is `Math.round(seconds * 30000 / 1001)` frames; use the edit's own frame count when it has one. The last frame is at `(durationInFrames - 1) / fps`, so set `OUT <= last - exit`, where the exit is 0.35 s for `wipe` and 0.4 s for `appear`. A 6 s slot is 180 frames with its last frame at 5.973 s, so a wiped card needs OUT ≤ 5.62. The next shot starts on a hard cut.
- Changing what the tree shows on a camera cut makes the cut feel intended. In the worked example the requirement chips leave as the angle changes, and the loop chips build on the new angle.
- Nothing may show before the cut an insert rides on, and leading elements count: `PixelCorners` lead the card by 0.18 s. In v7 the cut into D1 was placed where the card appears, so its brackets showed on the previous shot for 3 frames. Find an insert's first visible frame from its alpha, and start leading elements at the cut.

## Layout and fit

- **Faces stay clear.** Overlays start at x 96, and y 960 and below stays clear for captions. Measure a face box per shot on the frames under the insert. On this shoot, at 1080p:
  - Side angle: the head sat at about x 980–1240, y 140–460.
  - Front angle: the hairline sat near x 855 and moved as the presenter leaned.
  - Elements at face height stayed clear of the head. The install card's corner pixels reach x 909 on the side angle.
  - Rows below the chin ran further right: the second question row to about x 977 on the side angle, and the review-command card to x 816 on the front angle.
  - These values belong to this shoot. Measure again for any other.
- **Size from glyph metrics, not guesses.** Hack's advance is 0.6021 em. A mono `Chip` is `chars × size × 0.6021 + 1.24 × size` wide; add `0.45 × size` plus the icon width when it holds a mark or spinner. A terminal card is `left pad + (2 + command length) × size × 0.6021 + 3 (caret margin) + caret width + right pad` wide, where the 2 is the `$ ` prefix; round it up to the next 10 px. 08: 34 + 709.3 + 3 + 16 + 34 ≈ 796, so 800. D3: 26 + 594.3 + 3 + 10 + 26 ≈ 659, so 660. Use the same width for its `PixelCorners`. Two of Hendrik's v6 review notes were terminal cards 20 px too narrow for their command, and one was end-card corner pixels drawn from a guessed width.
- **Keep tags clear of the corner brackets.** `PixelCorners` reach 13 px outside the card's corner, so a tag that starts at the card's x touches the top-left bracket (a v7 review note). Tags sit 14 px in from the card's edge.
- **Keep padding symmetric.** If the left padding is 34 px, the right needs about the same after the caret. The text must never touch or clip at the card edge.
- **Route connectors and arrowheads around text.** End a loop-back arrow past the right edge of the widest chip it touches. Compute that edge from the same metrics.
- **Check light stages with captions.** Burned-in white captions need a dark box on a cream ground. The editing pipeline uses a separate ASS style for those cues.
- **Review at full size.** Composite each overlay still over the real camera frame at its timeline frame, then crop chips and arrows at 2× before approving (`references/render-and-verify.md`).

## Typography

- **Two families, four weights.** Only Geist 400/600 and Hack 400/700 are bundled. A requested Geist 500 silently falls back to 400.
- **Sizes used in the worked example (1080p):**

| Element | Size |
| --- | --- |
| Terminal command | Hack Bold 38 px (21 px for the long review command) |
| Prompt text | Geist 26/38 px |
| Chips | Hack Bold 22–23 px; tags 21 px; status chips 19 px |
| App titles | Geist SemiBold 34 px |
| Question rows | Geist SemiBold 28 px |
| Finding headline | Geist SemiBold 35 px with −0.6 px tracking |
| End-card title | Geist SemiBold 54 px with −1.2 px tracking |
| Install chip | Hack Bold 44 px |

- **Casing.** Tags and labels are sentence case and untracked (`Terminal`, `Suggested fix`). Chips that quote the prompt keep its lowercase (`rate limiting`), and status chips are lowercase like a CLI line (`review running`). The walk-and-talk cutaways use a different, louder scale; keep one style per film:
  - kicker: Hack 700, 19 px, uppercase, +2.6 px tracking;
  - headline: Geist 600, 76 px, line-height 1.06, −0.034 em tracking;
  - body: Geist 400, 29 px, line-height 1.42, Mauve 11.
- **Monospace only for code.** Hack is for commands, file names, code and chips. Geist carries every sentence the viewer reads.
- **Font conflict.** The older skills in this repo (and the README's brand reference) still prescribe IBM Plex Mono and `spring()`. These inserts follow the current brand kit (`docs/brand-motion-system.md`): Geist and Hack, with bezier curves and no springs.

## Sound

The Antigravity v7 cut shipped with dialogue only. When a film needs sound, plan it with the picture. The house method comes from the walk-and-talk final's render script, which is not on GitHub yet, so the full recipe is here:

- **Render the picture muted; build the mix in FFmpeg.** Remotion renders the picture with `muted: true`. A separate `filter_complex` pass mixes the dialogue, a music bed and a cue sheet of effects into a `pcm_s24le` WAV, which is muxed afterwards. In one graph with the video re-encode, the mix's last 0.6 s came out silent.
- **One cue sheet drives picture and sound.** Export every beat the scenes already know as `[effect, output second of the peak, target peak dBFS]`:
  - each typed word from the `typedCount` schedule;
  - each `Cursor` click;
  - each chip or card wipe;
  - the stage entrance.
- **Align each effect's peak, not its start.** Peaks land 0.02–0.1 s after a chip, tag, highlight or finding beat, and 0.25–0.3 s into a full-frame wipe, plate or strap entrance. Each effect runs `aresample=48000,aformat=channel_layouts=stereo,volume=<target − filePeak>dB,adelay=delays=<round((at − peakAt) × 48000)>S:all=1,asetpts=N/SR/TB`. `S` makes the delay a sample count (a bare number means milliseconds), `all=1` delays every channel, and `asetpts` resets the timestamps that `adelay` leaves offset.
- **Effects and target peaks in that script:**

| Effect | File (peak at, peak level) | Use | Target peak |
| --- | --- | --- | --- |
| swish | `swish.wav` (0.35 s, −2.4 dBFS) | covering wipes | −18 dBFS (−27 on smaller moves) |
| wood | `whoosh-wood.wav` (0.42 s, −15.8) | full-frame plate entrances | −20 to −26 |
| pop | `pop.wav` (0.21 s, +0.8) | straps and name intros | −22 to −26 |
| sticky click | `click-sticky.wav` (0.2 s, +0.2) | tags, cards and tiles landing | −24 to −30 |
| bing | `bing.wav` (0.03 s, −1.3) | a flow starting | −25 |
| click | `click.wav` (0.2 s, +1.1) | chips landing and highlights | −27 to −31 |
| alert | `alert.wav` (0.06 s, +0.7) | a finding | −27 |
| airy whoosh | `whoosh-airy.wav` (0.12 s, −2.0) | anything leaving; floods and pile-ups | −24 to −29 |

- **Exits sit quieter than entrances.** A wipe gets a swish at −18 in and an airy whoosh at −27 out.
- **Floating inserts sit a few dB under full-frame levels.** In the walk-and-talk final cut's two floating product inserts, a root chip lands with a sticky click at −27, each tree chip with a click at −30 and the agents chip with a click at −29, all 0.05 s after the chip appears. A card's arrival gets a wood whoosh at −26 (full-frame plates take −20), peaking 0.25 s after the card's build starts. Cards piling up behind it get an airy whoosh at −29, and a counter gets a pop at −26.
- **Typing (not built yet).** The walk-and-talk set has no typing effect. When you add one, give each typed word one short keystroke burst, sized from that word's typing time in the `typedCount` schedule, near the click level. A pasted prompt gets one short burst, not a full run. Pair each `Cursor` click with the click effect.
- **Bed and bus:**
  - The music runs at −19 dB gain, with `highpass=f=40` and `equalizer=f=2500:t=q:w=1.2:g=-4`, placed with the same `adelay` and `asetpts` pair. Cut or repeat it with a 40 ms `acrossfade` centered on a bar line, and fade it out over the last 1.2 s.
  - The dialogue ducks the bed through `sidechaincompress=threshold=0.04:ratio=3:attack=20:release=350`, so speech sits 16–27 LU above it.
  - Effects mix with `amix=inputs=N:normalize=0:duration=longest`. Then `[dialogue][bed][effects]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.84:level=false:latency=1`.
  - `level=false` keeps the ceiling at 0.84 (−1.5 dBFS) instead of auto-leveling to 0 dB. `latency=1` removes the limiter's 5 ms lookahead delay, so the voice stays sample-aligned with the picture. The walk-and-talk mixes measure about −16 LUFS integrated.
- **Keep audio out of Git.** The bed (an Artlist track) and the effects (Artlist and the team's product-video assets) are linked into a gitignored `.studio-data/<film>/public/media/`. Adobe Stock preview files are not licensed for delivery.

## Rendering

- Give each film one entry point, `src/<project>/index.tsx`, that calls `registerRoot` once and lists every insert, as `src/antigravity/index.tsx` does. Never import it into `src/Root.tsx`, because a second `registerRoot` throws. Composition ids use letters, digits and hyphens only.
- Set the copied kit's `FPS` to the edit's rate. The entry point passes it to every `<Composition>`, and `useClock().at()` uses it. Make `durationInFrames` equal to the insert's placement so the edit can assert frame counts.
- Preview with `npx remotion studio src/<project>/index.tsx`. `npm start` opens `src/index.ts`, which does not show these compositions.
- Overlays render as ProRes 4444, `pixelFormat: 'yuva444p10le'`, `imageFormat: 'png'`, on a transparent `AbsoluteFill`. Stages render as ProRes `hq`, `yuv422p10le`, JPEG frames at quality 95.
- For a new film, copy `scripts/render-antigravity.mjs` to `scripts/render-<project>.mjs` and change `entryPoint`, `shots` and the default output folder. `--stills` writes only the review frames, `--only=<ids>` re-renders single scenes and throws on an id that is not in `shots`, and `--out=<dir>` chooses the destination.
- A CLI render needs the full flag set (`references/render-and-verify.md`). `remotion.config.ts` sets JPEG frames, so a transparent pixel format without `--image-format=png` fails. Without `--pixel-format`, Remotion sends its default `yuv420p`, so the file can be tagged 4444 yet carry no alpha.
- Keep every value a pure function of the frame: no timers, CSS animations or wall clock, and seeded noise only. Use 2D transforms for anything that moves. Parallel renders dropped 3D-transformed layers in the walk-and-talk final.
- Verify each master with `ffprobe` before placing it: the codec tag, the pixel format, the `30000/1001` frame rate and the frame count, then alpha on an open frame. FFmpeg reports a 4444 master with alpha as `yuva444p12le`, so don't expect the `yuva444p10le` you rendered. Premiere and FFmpeg both composite ProRes 4444 alpha correctly over the camera picture.
- Never render into another project's or session's folder. Kill a render you stop with `pkill -f <script>` and check for orphaned `node` processes, because a killed parent can leave a renderer writing files.

## Honesty

- Show the real command, prompt, file names, counts and finding. Never invent terminal output, success messages, metrics or customer results.
- A status chip names only a state the real run reached, never a result the footage doesn't show. Without the real outcome, name the step in progress (`review running`), not a success.
- Label a proposed change as "Suggested fix". Never imply a clean second review, passing tests or an applied fix unless that happened and is shown.
- Abstract what is not the point (context code as gray bars) rather than retyping code you have not verified.
- Sample data inside a built UI must read as sample data: `example.com`, synthetic users, the demo's localhost port.

## Key rules (learned from iteration)

1. Inventory the real material first. Every chip, file name, count and line of code on screen must be true.
2. Cue from word timings. A beat that lands a second late reads as decoration.
3. Size and place cards, tags, chips, corner pixels and arrowheads from computed metrics, never by eye. Four of Hendrik's review notes on the Antigravity cut were width or placement errors of this kind.
4. A logo PNG with opaque corners looks like a black square on a chip. Use the transparent marks.
5. An arrowhead placed on a guessed coordinate landed on a chip's last letters. Derive its position from the chip's computed right edge.
6. Swapping full-screen inserts for floating cards revealed same-angle jump cuts the inserts used to hide. Re-check every cut under an overlay and change the camera angle where needed.
7. Burned-in captions on a cream stage need a boxed caption style.
8. Check copied motion against `studio/src/lib/motion.ts`. The kit's `envelope` exit once drifted 12 px up instead of back toward the entrance edge, and no shipped insert showed it, because none calls `appear()` with a finite end.
9. A stopped background render can keep writing through an orphaned renderer process. Write only to your own output folder, and confirm with `pgrep` that the process is gone.
10. Plan the sound with the picture. Typing, clicks and wipes all have cue times in the scene code, so export them to the mix rather than placing effects by ear later.
11. `clip-path` also clips `box-shadow`, so a wiped card's shadow is cut at the clip edges. The Antigravity masters keep that look. For new work, extend the clip past the shadow on every side and let the moving edge overshoot the card by the shadow's reach as the wipe completes; then check a half-open and a fully open frame. A shadow on an unclipped wrapper would show at full size while the card is still half wiped.
12. Place tiny layers on whole pixels and snap near-1 opacity to 1. The pre-delivery check of v7 caught `PixelCorners` squares dropping out of single frames.
