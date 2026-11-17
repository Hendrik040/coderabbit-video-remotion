# AIE Code Summit 2026: conference motion package

Erik Thorelli, *Manage Yourself Out of the Loop*, AI Engineer Code Summit 2026, San Francisco (11 November 2026).
This folder ports the v4 motion engine (`Edit-v4-Three-Versions/source/engine/motion.py` in the talk's project
folder) to Remotion. It matches that engine's timing frame for frame at 24000/1001 fps: 38,048 frames, a
72-frame intro and outro, and 1920x1080.

AI Engineer Code Summit is the primary identity. CodeRabbit appears only as Erik's affiliation, using the
official lockup (`public/brand/white-typemark.svg`, the same artwork as v4's `coderabbit.png`) at uniform
scale. There is no "The Merge" branding and no sponsor claim, link, QR code or offer.

## Compositions

| ID | What it is |
|---|---|
| `AIE26-Plain`, `AIE26-Light`, `AIE26-Full` | The talk: `BG.png`, `SLIDE_PANEL.mp4` at x32 y32, `SPEAKER_PANEL.mp4` at x1472 y432, `PROGRAM_AUDIO_V4.wav` on the phone clock, and the motion overlay |
| `AIE26-Overlay-Plain`, `-Light`, `-Full` | The motion overlay alone, transparent, for ProRes 4444. The `only` prop keeps one element group, like the v4 kit windows: `card`, `explainer`, `chapter`, `name-intro`, `side` or `no-static-chrome` |

The three versions match the v4 package:

- **Plain:** layout, typography, the title and end cards, chapter labels and the Q&A panel. Elements fade only.
- **Light:** adds the traced-frame intro, the stack-wipe reveal and outro, eased chapter labels, the progress rule, rabbit-line details, the brand name intro and 23 content cards.
- **Full:** adds the pixel-wipe intro, colour-bar accents, the colour-bar wipe outro, 35 cards with animated internals, question text in the Q&A panel, and five explainer moments.

## Setup and preview

```bash
node scripts/link-aie-code-summit-media.mjs "/path/to/AIE-SF-CodeSummit-206/Edit-v4-Three-Versions"
npx remotion studio src/aie-code-summit-2026/index.tsx
```

The link script makes `public/aie-code-summit-2026` a link to the v4 `media/` folder. The link is gitignored, so the media (about 2.9 GB) is never copied or committed.

## Render

```bash
node scripts/render-aie-code-summit.mjs --program --version=full            # AIE26-Full.mov + .mp4
node scripts/render-aie-code-summit.mjs --program                           # all three versions
node scripts/render-aie-code-summit.mjs --overlay --version=full            # ProRes 4444, full length
node scripts/render-aie-code-summit.mjs --overlay --version=full --only=card --frames=1014-2025
node scripts/render-aie-code-summit.mjs --stills=45,420,3290 --version=light
```

- **Output:** goes to `out/aie-code-summit-2026/` unless you pass `--out=<dir>`.
- **Program renders:** each one writes two files. `AIE26-<Version>.mov` is the sample-exact master: H.264, 16-bit PCM, Rec.709 tv range. `AIE26-<Version>.mp4` has the same video with AAC 256k mono audio, like the v4 delivery. The `.mp4` is muxed by `ffmpeg` on PATH, which writes the AAC priming edit list. Remotion's own AAC output has no edit list, so its audio would decode 43 ms late.
- **Speed:** a full program is about 38k frames. Expect around 10 fps at the default `--concurrency=8` on an M4 Max, so about an hour per version.
- **Frame numbers:** `--frames=a-b` is inclusive and uses sequence frames. `handoff/manifest.json` in the v4 folder lists every cue's `in_frame` and `out_frame`.

## Layout

```
cues.ts            every card, explainer and rabbit-line cue, with its text and time in sequence seconds
                   (generated verbatim from cues.py; edit here)
timeline.json      v4 source/timeline.json (fps, intro/outro, chapters, Q&A)
Program.tsx        clean layers + audio + overlay
Overlay.tsx        the overlay for one frame, optionally one element group
engine/frame.tsx   paint order per frame (motion.py frame_ops)
engine/*.tsx       chrome, cards, chapters, side panel, title cards, accents and wipes, explainers
engine/metrics.ts  Pillow-identical text metrics (advances, wrapping)
engine/draw.tsx    shapes with Pillow semantics, the grid/glow bitmaps
```

The port reuses the shared brand code:

- the curves and the 0.6 s / 0.4 s / 60 ms timing from `studio/src/lib/motion.ts`
- the colour-bar segments and transition timing from `studio/src/lib/colorBar.ts`
- the pixel field from `studio/src/lib/pixelWipe.ts`
- the tokens, font loader and logo from `studio/src/brand/Broadcast.tsx`
- palette swatches from `studio/src/lib/brandPalette.ts`

The name intro follows the engine's 384 px side-panel geometry and crop timing. It does not use the 560 px `NameIntro.tsx` lower third, so it keeps that component's colours (orange name panel, mint details) without its layout.

## Fidelity

These checks compared the port with the v4 Full delivery MP4 and with the engine's lossless `--still` PNGs. Further checks covered 43 frames across all three versions.

- **Geometry and timing:** they match the engine exactly. This covers wipe and crop widths, reveal offsets, card heights, wrap points, colour bars, the pixel wipe and the panel glow. The title rule, grid, glow and colour-bar pixels are identical.
- **Text:** glyphs sit on the same integer positions, because the advances come from the same TTFs with FreeType's rounding. Only the glyph rasterisation differs: Chrome draws unhinted glyphs, while Pillow uses hinted FreeType. This shows as about 0.1 to 0.2% of pixels off by more than 64 levels, all of them on glyph edges.
- **Video panels:** the frames are exact (offset 0 against the source frames on both sides). Remotion's decoder renders them 1 to 2 levels darker, at most 3 of 255.
- **Logo:** the logo is the SVG rasterised by Chrome, while v4 used a Lanczos-scaled PNG of the same artwork.
- **Audio:** the PCM master aligns with the v4 MP4 at 0 samples, with correlation 0.99999. The engine's 0.03 s fade-in and 0.4 s fade-out run per frame, as Remotion's volume API requires.
