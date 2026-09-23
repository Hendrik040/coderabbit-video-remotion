# The Review Desk — broadcast package

An experimental CodeRabbit station package for repeatable product broadcasts and presenter videos. The studio interface stays black, white and gray; the rendered graphics use CodeRabbit brand colors.

## Templates

| ID | Template | Editable copy | Intended use |
| --- | --- | --- | --- |
| CR-01 | Station ident | Show name, tagline, edition | Opening or closing bumper |
| CR-02 | Presenter strap | Name, role / organization, segment label | Lower third above the ticker |
| CR-03 | Segment title | Headline, supporting line, segment label | Full-screen story introduction |
| CR-04 | Triage board | Headline, two queue items, segment label | Now / Next product brief |
| CR-05 | Change Stack | Headline, three layer titles, segment label | Ordered review context |
| CR-06 | Desk ticker | Rail label, newline-separated items, edition | Bottom information rail |
| CR-07 | Station bug | Desk label, edition / episode | Full official lockup in the upper right |

Load **Broadcast rundown** from the preset menu. The 22-second example opens with the ident, then plays the headline, presenter + ticker, Triage, and Change Stack. The station bug holds across the segments. Sample presenter and queue copy are placeholders, not factual endorsements or live data. Select a library card to edit its existing layer; **Add** or **Duplicate** creates another instance. The Components library has two playback types: **Linear** contains the broadcast templates and legacy explainer tools; **Looping** contains repeatable backgrounds.

Importing footage scales the existing timing proportionally, preserving overlaps. You can then adjust start and duration or copy a detected gesture cue. Broadcast graphics use fixed positions and time-based motion. They do not follow the hand or change with gesture progress.

## Motion and layout

All templates share `broadcastMotion`: 18 frames in, a readable hold, then 12 frames out at 30 fps. Text uses 0 / 3 / 6-frame staggers. Motion compresses proportionally for clips under one second. The first and last rendered frames are clear; absolute frame calculations keep scrubbing, replay and exports deterministic.

Use at least 3 seconds for titles and 5 seconds for product boards. The ticker advances to the next item every 3.5 seconds after its entrance; allow enough duration for every item. The sample ticker uses a single line. The final item holds until the layer exits.

The 1280 × 720 layout uses 64-pixel side margins. The bug occupies the upper-right slot, the name strap sits above the information rail, and full-screen titles/cards reserve room for the bug. Overlapping full-screen templates cover earlier layers in timeline order. Full-screen templates include an opaque background even in a ProRes overlay export, unless a looping background is active beneath them. Name straps, tickers and bugs retain transparent surroundings.

Text fields have template-specific length limits. Longer lines wrap or truncate within reserved boxes; preview all copy before exporting, especially wide names and long words. Triage displays two nonempty body lines and Change Stack displays three. Keep entries concise.

## Brand sources and assets

Reviewed September 23, 2026:

- [CodeRabbit brand guidelines](https://www.coderabbit.ai/brand): official full lockup, orange `#FF570A`, mint `#25E2A8`, cobalt `#687FF5`, mauve neutrals; Geist headings/body and Hack technical labels. This package follows these current rules rather than the older IBM Plex Mono/cream treatment in the legacy compositions.
- [Triage](https://www.coderabbit.ai/triage): quiet review panels, thin borders, clear priority labels and Now / Next grouping.
- [Change Stack](https://www.coderabbit.ai/change-stack): ordered layers, numbered context and stacked review cards.

Official white/orange logo SVGs live in `public/brand/` and are used without redrawing or recoloring. The default dark package uses the supplied white full lockup, with clear space and preserved proportions. No logo rotation, distortion or accent gradients. The mark file is retained as an official source asset for future compact placements.

Geist 1.7.2 (Vercel) and Hack 3.003 (Source Foundry) are bundled in `public/brand/fonts/`, with their upstream licenses. Rendering does not fetch fonts or logos from external sites.

## Implementation and validation

- `studio/src/lib/broadcast.ts`: stable template registry, defaults, rundown, shared motion and import retiming.
- `studio/src/brand/Broadcast.tsx`: brand tokens, local font loading, official logo and seven renderers.
- `studio/src/lib/schema.ts`: backward-compatible optional broadcast/edition fields and copy validation.
- `studio/src/remotion/Scene.tsx`: same scene for the editor Player and local exports.

Run `npm run test:studio`, `npm run typecheck`, and `npm run studio:build`. Tests cover preset round-trips, invalid copy, clear entrance/exit boundaries including short clips and staggered text, deterministic seeking, and preserved overlap when footage duration changes. Visually inspect the rundown, edited copy, and both H.264 and ProRes outputs after design changes.

## Looping assets

**LP-01 — Change Stack glow** recreates the [Change Stack hero background](https://www.coderabbit.ai/change-stack): a cobalt corner light, a slowly drifting elliptical beam, and independently flickering 4-pixel squares with 2-pixel gaps. Each pixel holds its brightness between changes, averaging 0.4 changes per second at the default 16-second cycle. The glow follows the site's out-and-back translation, horizontal stretch and cubic-bezier easing. Cycle length retimes both effects together. This is a local procedural recreation, not a captured website video.

Choose **Components → Looping → Change Stack glow** to add it to the current project. A new background starts at zero and spans the project. It always renders beneath foreground graphics, even when its timeline layer was added last. Full-screen broadcast cards let the active background show through. Lower the backdrop opacity to blend with imported footage; a full-opacity backdrop covers that footage. Disabled or out-of-range background layers have no effect.

The inspector exposes **Cycle length** (4–32 seconds), **Glow intensity**, **Backdrop opacity**, and **Color**. The grayscale library thumbnail animates independently while the timeline is paused, and stops when hidden or reduced motion is preferred. The editor controls remain grayscale. **Load a preset → Change Stack glow loop** opens a standalone 16-second example, and loop-only projects repeat automatically in the Player. Existing projects are not migrated or replaced when the app updates.

Linear assets play their entrance / content / exit once. Looping assets use a periodic frame phase for their entire layer duration, with no entrance or exit fade. To export a video file that repeats seamlessly, use a whole number of cycles: for example, a 16-second project with a 16-second cycle, or a 16-second project with an 8-second cycle. Fractional final cycles are allowed on a mixed timeline but are not seamless when repeating the entire video file.

Implementation: `studio/src/lib/looping.ts` owns playback categories, cycle math, seeded pixel changes, and the preset; `studio/src/brand/ChangeStackGlow.tsx` draws each frame synchronously to a local canvas. Pixel changes repeat exactly and do not reset together at the loop boundary. MP4, ProRes and the timeline share the same frame-driven renderer without a live website dependency or wall-clock state. Only the library thumbnail has its own animation timer. The background is opaque at 100% opacity, including in an alpha-capable export.
