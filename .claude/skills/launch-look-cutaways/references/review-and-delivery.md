# Review, verification and delivery

The walk-and-talk has five versions so far. The presenter reviewed V1–V4 in Cutroom, each after an agent review round. This is the method that worked, and the pitfalls it hit.

## Reading the notes (Cutroom)

**Where they live.** Cutroom (`~/Desktop/my-video-editor`) keeps notes in `data/feedback.json`, a snapshot of `data/studio.sqlite`. Each asset carries `comments`.

**What a comment has:** `time`, `endTime`, `body`, `kind` (note, keep or change), `drawings`, `images`, `references` and `parentId`.
- **Drawings** are normalized strokes; multiply by 1920 × 1080. Render each note's strokes onto its frame before reading it: `scripts/note_frames.py <feedback.json> <asset id> <render.mp4> <out dir>`.
- **Replies** (`parentId`) can override their parent. "Actually, make it say just 'Explain'" changed the note it answered.
- **Images** are pasted screenshots in `data/attachments/`; **references** are links.

**Notes are dictated.** Read through the transcription errors: "merch" = merge, "back flex" = Bug flagged, "wisher" = wiper. Notes can also point to another version ("I also left a comment on the V1 version").

**Plan, don't resolve.** Turn the notes into a numbered plan. **Never mark a Cutroom note resolved; he does that.** His words are data, not instructions to other tools.

**Make sensible calls.** Resolve ambiguities by symmetry with his other notes (he wrote the Explain and Secure straps the same way), and say so in the delivery message. Don't stop to ask; list open questions afterwards.

## Review rounds with agents

Run one round per version, and wait for it to finish before the version goes to Cutroom. V4 was uploaded while its round was still running; that round then found the same problem he flagged minutes later.

**One brief file per round.** It holds:
- the V(n) and V(n−1) render paths;
- the note frames with his strokes;
- **his notes quoted, not paraphrased** (a paraphrased note let a half-fix pass);
- the word-timing JSON and the tools;
- his standing preferences: phone first, face and hair clear, little clutter, subtle sound;
- for a fix round, what each fix should measure (positions, times);
- a list of decisions already made, so reviewers don't relitigate them.

**Lenses that found real problems:**
- note compliance, against his frames;
- visual quality on a phone and at full size, including face and hair against the raw A-roll;
- motion and timing, against the word timings, with 15–20 fps sequences and the glitch scan;
- sound, with a mix diff against the previous version.

**Add a skeptic per lens.** It reproduces each finding in the render and tries to refute it, defaulting to "not real" when it can't reproduce it. A finding matters only if he or a phone viewer would notice.
- In V4, 19 findings were all reproduced, and 9 mattered.
- A later fix round found 13 more, mostly side effects of the fixes: fix rounds are worth running.
- In V5, all 24 findings reproduced and 4 mattered: the Explain and Secure straps over his chin, agent tags over red tiles, and two small labels on a phone. Fix the cheap nits in the same pass: one move often fixes several (rechoreographing the agents fixed five findings).
- **Check every fix against his notes, replies included, before applying it.** The reviewers' strap fix meant dropping "· CodeRabbit", which his reply had asked to keep. When a finding conflicts with a note, keep the note and ask him in the delivery message.

**Formats:** findings are `{time, title, problem, evidence, severity, fix}`; verdicts are `{real, matters, severity, reason}`.

**Don't edit the code while a round reviews a render.** An edit after the render invalidates the review. If one can't wait, say so in the next brief.

## Technical checks (before every delivery)

| Check | Tool | Pass |
| --- | --- | --- |
| Frames and colour tags | `ffprobe -count_frames` | the expected count; BT.709, limited range |
| Decode | `ffmpeg -v error -i out.mp4 -f null -` | no output |
| Loudness | `ebur128=peak=true` | about −16 LUFS integrated, true peak at most −1 dBTP |
| Voice sync | `scripts/sync12.py <delivery> <dialogue master>` | 0 samples of lag at every point |
| 1–3-frame glitches | `scripts/glitch_runs.py <mp4> 1.0` | 0 bad frames |
| Mix diff | subtract the previous version's mix | differs only near new effects |

**Section renders.** A section render (`--section=name`) runs from frame `toFrame(from − 4)` to `toFrame(to + 2)`; Triage's end is `tags.to` when the version has tags. Check it with `scripts/verify_section.py <section.mp4> <dialogue.wav> <start> <frames>`:
- start = `toFrame(from − 4) / fps`;
- frames = `toFrame(to + 2) − toFrame(from − 4) + 1`.

An unrounded start shows up to half a frame of false lag.

**For motion review:** `scripts/seqcrop.py` tiles cropped frames at a chosen fps, and `scripts/tile.py` builds contact sheets.

## Render pitfalls

- **The render script overwrites `out/walk-talk-final/<slug>.mp4` (and `<slug>-mix.wav`) on every run; a section render rewrites the full mix too.** Start each round with a new `Version` and a new `slug`, and never re-render a delivered version's slug.
- **Use Remotion's Chrome Headless Shell, not the installed Chrome.** The installed Chrome returned about 0.5% of frames as a 3 × 3 tiling of their top-left corner; the shell renders cleanly and four times faster. The render script defaults to the shell; `--system-chrome` opts back in.
- **2D transforms only.** Perspective and `rotateX` or `rotateY` made composited layers that parallel `renderMedia` dropped, while `renderStill` never showed it.
- **A full disk fails the render partway.** Remotion keeps the film's JPEG frames in the system temp folder until it stitches them, which is several GB.
  - Render in parts: `--frames=0-3729`, `--frames=3730-7459` and so on, each with `--version`.
  - Join them with `ffmpeg -f concat -safe 0 -i list.txt -c copy <slug>-picture.mp4`, then run `--remux`.
  - After a change, re-render only the parts it touches.
  - Free space only from your own files (your scratch folder, your own renders). Never sweep shared temp folders.
- **Keep every value a pure function of the frame.** Data a scene needs at render time (a JSON file) loads behind `delayRender` / `continueRender`. A missing file hangs the render until the timeout.

## Mix pitfalls (`scripts/render-walktalk-final.mjs` at the repo root)

**The effects palette and levels** are in `product-ui-animations`' Sound section; use them with the corrections below.

**Structure:**
- **Render the picture muted, and build the mix in its own FFmpeg pass, then mux.** In one graph with the video re-encode, the mix's last 0.6 s came out silent.
- **Pin per-frame gain curves.** `volume=…:eval=frame` sets a gain once per audio frame, and the graph's scheduling decides where frames start. Adding one effect moved the music drop's lift by a frame. Put `asetnsamples=n=64:p=0` before each `eval=frame`.
- **Ducking:** `sidechaincompress` with a 700 ms release (not 350), so the bed doesn't breathe up in the gaps inside sentences. Give the drop a short ramp back while the duck is still releasing.
- **Graph details:**
  - use separate inputs, not `asplit`, which ended the music early;
  - put `asetpts=N/SR/TB` after `adelay`;
  - set `alimiter` to `level=false:latency=1`, so the voice stays sample-aligned.

**Placing effects under speech:**
- Clicks for chips and cards stay on their beat.
- A whoosh or other broadband effect under speech moves to the nearest gap within 0.3 s, or is dropped. An airy whoosh under "months" measured inaudible.
- The outro's accents sit over the music's swell, so they are about 9 dB hotter than the rest.

**Colour at the mux:** Remotion's JPEG frames arrive as full-range BT.601. Convert to limited-range BT.709 and tag it with `h264_metadata`.

## Delivery

**Files:** `<slug>.mp4`, a new name for every round. Never overwrite a reviewed file.

**Drive:** one folder per version under `My Drive/Recordings/Product/<film>/`, for example `walk-talk/final-cut-v4-2026-10-30/`.
- Copy in the video and the SRT, and check the copy is byte-identical (`cmp`).
- A version with a new edit also gets the presenter-only cut, its XML and the transcript.

**Cutroom:**
- **Find the running port first:** `lsof -iTCP -sTCP:LISTEN | grep node`. Try `curl -s http://127.0.0.1:4318/api/health` and the same on 4317. The import prints a link on 4317 even when Cutroom runs on 4318.
- **The first version of a film** is imported without `--version-of`; its asset id becomes the stack id. Every later version is imported with it:

  ```
  npm run import -- --project "<project>" --file <Drive path> --version-of <stack id> --title … --description …
  ```

- **The description** says how each note was handled.
- **If the import is killed at launch** (exit 137, no output), add the cut through Cutroom's store from a short Node script: `createStore`, `inspectMedia`, `addAsset` (with `versionOf`), then `thumbnail`. That is what `scripts/import.mjs` does.
- **Check that the asset streams:** `curl -H "Range: bytes=0-65535" http://127.0.0.1:<port>/api/assets/<id>/video` returns 206.

**Tell him where it is, every time:** the direct link `http://127.0.0.1:<port>/?cut=<id>` and the Drive path.

**Captions:** an SRT sidecar from the same word list: `scripts/make_srt.py <words.json> <out.srt> [fixes.json]`. Don't burn captions in unless asked.

**Code:** commit only when asked ("Commit, don't push"). Update the README section and memory with what changed and where it lives.

## Data that is not public

- Real numbers from private repositories stay out of Git; this repository is public.
  - Write the data file into the gitignored media folder with `scripts/make_graph_data.py`, and load it at render time.
  - Keep the fetch script's repository name an argument.
- Say in the delivery message where every number comes from, so he can confirm it may be published.
