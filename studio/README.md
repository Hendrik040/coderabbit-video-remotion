# CodeRabbit Motion Studio

A local React + Remotion library for reusable CodeRabbit brand assets. Start with a name intro, transition, color bar, or looping background; edit it and export it independently. The studio stays monochrome, with brand color in the rendered assets. [Catalog, motion rules, and reuse workflow](../docs/brand-motion-system.md).

**Composition** opens the existing footage and timeline editor, including station templates, developer explainers, and gesture analysis. Its saved project is separate from the asset library. Gesture model setup is optional for brand asset editing and rendering.

## Start

From the repository root, using Node.js 22 or newer:

```sh
npm install
npm run studio:setup
npm run studio
```

Open http://127.0.0.1:4319. `PORT` changes the port; development hot reload uses `PORT + 1`. The server binds only to loopback. The model setup downloads Google's MediaPipe gesture model once and copies the installed MediaPipe WASM files into `public/`. Model and font inference/rendering assets are served locally afterward.

On this Codex desktop workspace, dependencies are installed already. `./studio/start.sh` also starts the editor and can use Codex's bundled Node runtime if Node is absent from your shell's PATH.

For production mode, run `npm run studio:build`, then `npm run studio:serve`. Existing authored videos still use `npm start` and the original render scripts.

## Linear and looping assets

**Library → Linear** contains **Name intro**, **Stack wipe**, **Color bar wipe**, **Change Stack pixel wipe**, **Color bar reveal**, and **Color bar reveal & exit**. **Library → Looping** contains **Change Stack glow** and **Color bar loop**. Select and customize an asset, then choose **Export asset**. The export dialog has two options: **Video** (H.264 MP4) and **Transparent background** (ProRes 4444 MOV, graphics only, no audio). Full-frame background assets show the transparent option as unavailable. Choose 720p or 1080p in the same dialog. Covering wipes show their exact cut frame; the pixel wipe marks the fully revealed grid. Save/open JSON presets or add the asset to the existing composition.

The color bar uses the ten segments and expansion curve at the bottom of the Change Stack hero. **Color bar reveal** expands and then drifts gently through the final frame, with timing that scales to the chosen duration. Its loop variant adds a smooth return. **Color bar reveal & exit** wipes the bottom strip in from the left, keeps the colors drifting, and wipes out to the right, with transparent endpoints. It defaults to 4 seconds and a 4px bottom edge; direction can be reversed. Choose the strip's height and position, then select individual segments to edit with the shared brand swatches. All three variants support transparent export and layer above other composition assets.

**Color bar wipe** turns those ten colors into full-frame horizontal bands. They enter from the left with Stack wipe's stagger, cover the center cut, and exit to the right. Edit each band's color, reverse the direction, or change the duration. All transitions render above other layers and export with transparent first and last frames in ProRes 4444.

**Change Stack glow** has separate **Lighting** and **Vignette** controls. Move, rotate, stretch, and soften the light; adjust its intensity and ambient fill. Shape the vignette with its own center, dimensions, angle, strength, and feather. Reset either section to its original appearance. These settings save with the asset preset or composition and apply to preview and export without changing the loop timing.

**Change Stack pixel wipe** uses the hero's actual 4px points and 2px spacing on a fixed grid. Their visibility reveals from left to right, reaches the full frame, then fades out from left to right. Individual opacity timings give the reveal and fade an uneven cadence. Edit fine pixel size (2–8px), timing variation, brightness, palette, or direction. Existing coarse presets upgrade to 4px. The default 2.4-second asset supports ProRes 4444 export, keeps transparent gaps between its points, and never draws the glow background.

The composition editor retains the complete component collection and the earlier presets. [Broadcast package guide](../docs/broadcast-package.md).

## Make a walkthrough

1. Explore the **Developer walkthrough** preset (terminal, agent workflow, callout) or **Code & API explainer** preset. Both use explicitly simulated hand motion.
2. Import an MP4, MOV, M4V, or WebM, up to **1 hour / 4 GB**. Import shows progress and can be cancelled. Files stream to local disk and are checked for a valid video track and duration. Source audio is included unless muted. H.264 video with AAC audio is the most broadly compatible choice; portrait footage is letterboxed. Container support also depends on the browser’s codec support. Existing graphics keep their timing; full-length background loops extend to the new footage. Shorter imports clamp layers to the new endpoint.
3. Select **Footage → Analyze gestures**. Local MediaPipe detection samples at 12 Hz and tracks one hand (43,200 samples for an hour). This step is optional and cancellable; longer recordings take longer to analyze. Open palm, pointing, pinch, and horizontal sweep become candidate cues.
4. Select a component or timeline layer. Edit content, start, duration, placement, scale, and accent. **Set start from a cue** copies that cue's time; later timing edits are manual. **Jump to time** accepts seconds, `mm:ss`, or `hh:mm:ss` for precise navigation through long clips. The timeline shows an overview of dense cues; the inspector keeps every detected cue.
5. Choose **Reveal on cue**, **Hand position → progress**, or **Follow hand**. Progress controls terminal typing, diagram stages, or code highlighting. Callouts have no internal progress animation. Loss of tracking falls back to the timed animation or chosen placement.
6. Use **Add** or **Duplicate** for more layers, up to 12. Hide, delete, and undo edits. Preset changes and footage import can also be undone.
7. Choose **Export video**, then **Video** (H.264 MP4, source audio unless muted) or **Transparent background** (ProRes 4444 MOV, graphics only, no audio). Overlays stay editable in the project; exported videos are flattened. Source frames are extracted with Remotion’s OffthreadVideo during rendering. Export can be cancelled from either studio view; refresh or reopen the studio to reconnect to the current job. Temporary connection loss retries automatically. Keep the local server running: stopping it interrupts the render, which must be started again.

## Saving and local files

- The current composition autosaves in IndexedDB, which accommodates long tracking recordings. Previous local-storage compositions migrate on first open; asset presets remain in local storage. **Save project** downloads JSON; the folder button opens a saved JSON project (up to 32 MB).
- JSON includes settings, cues, and tracking. It references footage in this studio's media folder; it does not embed or copy that footage. Opening projects from the original Cue demo requires importing their source videos into this studio again.
- Imported clips live in `.studio-data/media/`; bundles live in `.studio-data/render-bundle/`. Set `MOTION_DATA_DIR` to change the data directory.
- Renders live in `out/studio/` and can be downloaded from the export dialog. `MOTION_EXPORT_DIR` overrides this directory. The latest 30 job records persist in `.studio-data/render-jobs.json`; completed files remain downloadable after a server restart. Cancelled or failed exports remove partial output.
- Files remain on this computer. No cloud upload, account, or API key is needed.
- Export uses an installed Google Chrome on macOS. Set `CHROME_PATH` on other systems; otherwise Remotion may need to download its browser.

## How this fits the repository

| Location | Responsibility |
| --- | --- |
| `src/brand/TerminalWindow.tsx` | Shared terminal visuals and typing timeline, extracted from the original `TerminalTyping` |
| `src/TerminalTyping.tsx` | Original composition wrapper, with its existing defaults and command presets |
| `src/brand/AgentFlow.tsx` | Compact, progress-driven adaptation of `RabbitAgentLoopV4`'s plan/code/review graphics |
| `src/MotionBrandKit.tsx` | Remotion composition showcasing the shared brand components |
| `studio/src/remotion/Scene.tsx` | Shared preview/export scene, base footage, and the broadcast / legacy overlay renderers |
| `studio/src/App.tsx` | Editor, presets, local autosave, inspector, timeline, and export UI |
| `studio/src/lib/` | Gesture processing, project schema, and presets |
| `studio/src/workers/tracking.worker.ts` | Local MediaPipe worker |
| `studio/server/index.mjs` | Local media storage and MP4/ProRes rendering |

All `remotion` / `@remotion/*` packages use the same exact version. The root npm lockfile is the only dependency lockfile; there is no separate studio install. Brand assets are shared from the root `public/` directory. Studio fonts are bundled locally for consistent preview and export.

To add another overlay, add its kind and schema entry, defaults, renderer, and inspector label/icon. Reusable visuals belong in `src/brand/`. Keep animation dependent on a frame number or recorded gesture progress so seeking and export agree.

## Scope

This is an experimental overlay studio: 1280×720 at 30 fps, one source clip up to one hour and 4 GB, one tracked hand, and up to 12 overlays. Rendering time depends on the computer, resolution, footage, and assets; long ProRes files and render intermediates can require substantial free disk space. It does not import arbitrary React source through the UI, turn every existing full-screen composition into an overlay, offer multi-track video editing, or produce native After Effects layers. Longer commands and snippets may need smaller scale or shorter text. Review detected cues before publishing real footage; the sample is not a tracking accuracy benchmark.

## Validation

```sh
npm run test:studio
npm run typecheck
npm run studio:build
```

The automated checks cover transition cut coverage and transparent endpoints, reusable asset presets and export dimensions, preservation of existing compositions, glow and vignette geometry, gesture debouncing, confidence filtering, interpolation, missing hands, all four preset schemas, all nineteen overlay kinds, broadcast motion boundaries, seamless loop phases, playback categories, background timing, and import retiming, invalid saved projects, and shared terminal timing. Browser and export checks should additionally cover footage import, detection, editing/undo, project reload, H.264 audio, and transparent ProRes output.

### Long-media verification

The media checks cover one-hour project validation, full tracking payloads, import size/duration bounds, video-track metadata, preserved graphic timing, loop extension, and direct timecode seeking.

Manual integration validation uses synthetic footage in a separate local server/data directory: 90-second H.264/AAC and one-hour MP4 imports; portrait MOV; VP9/Opus WebM import and MP4 export; invalid and over-limit rejection; byte-range seeking; interrupted-upload cleanup; a complete 90-second MP4 export with a graphic at 82 seconds; muted MP4; silent ProRes 4444 with real transparency; one-hour late-frame rendering; large-project autosave/reload; export recovery and cancellation; completed downloads after server restart; short-video gesture analysis and persistence. A full one-hour encode has not been run end to end.
