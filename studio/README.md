# CodeRabbit Motion Studio

A local React + Remotion library for reusable CodeRabbit brand assets. Start with a logo reveal, transition, title, sign-off, or looping background; edit it and export it independently. The studio stays monochrome, with brand color in the rendered assets. [Catalog, motion rules, and reuse workflow](../docs/brand-motion-system.md).

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

**Library → Linear** contains **Logo reveal**, **Circle wipe**, **Stack wipe**, **Color bar wipe**, **Change Stack pixel wipe**, **Type reveal**, **Brand sign-off**, and **Color bar reveal**. **Library → Looping** contains **Signal loop**, **Change Stack glow**, and **Color bar loop**. Select, customize, and export one asset as MP4 or, where supported, transparent ProRes 4444. Transitions show their exact cut frame. Save/open JSON presets or add the asset to the existing composition.

The color bar matches the ten segments and 3.2-second expansion at the bottom of the Change Stack hero. Its loop variant adds a smooth return. Choose the strip's height and position, then select individual segments to edit with the shared brand swatches. Both variants support transparent export and layer above other composition assets.

**Color bar wipe** turns those ten colors into full-frame horizontal bands. They enter from the left with Stack wipe's stagger, cover the center cut, and exit to the right. Edit each band's color, reverse the direction, or change the duration. All transitions render above other layers and export with transparent first and last frames in ProRes 4444.

**Change Stack glow** has separate **Lighting** and **Vignette** controls. Move, rotate, stretch, and soften the light; adjust its intensity and ambient fill. Shape the vignette with its own center, dimensions, angle, strength, and feather. Reset either section to its original appearance. These settings save with the asset preset or composition and apply to preview and export without changing the loop timing.

**Change Stack pixel wipe** uses that same glow as a transition. Individual pixels travel unevenly from left to right, form a solid plate around the cut, and scatter off the right edge. Edit pixel size and unevenness, or use the shared lighting, vignette, and palette controls. Direction can be reversed. The default 2.4-second asset has transparent endpoints and supports ProRes 4444 export.

The composition editor retains the complete component collection and the earlier presets. [Broadcast package guide](../docs/broadcast-package.md).

## Make a walkthrough

1. Explore the **Developer walkthrough** preset (terminal, agent workflow, callout) or **Code & API explainer** preset. Both use explicitly simulated hand motion.
2. Import an MP4, MOV, or WebM, up to 60 seconds / 300 MB. Source audio is included unless muted. Landscape H.264 footage is the easiest starting point.
3. Select **Footage → Analyze gestures**. Local MediaPipe detection samples at 12 Hz and tracks one hand. Open palm, pointing, pinch, and horizontal sweep become candidate cues.
4. Select a component or timeline layer. Edit content, start, duration, placement, scale, and accent. **Set start from a cue** copies that cue's time; later timing edits are manual.
5. Choose **Reveal on cue**, **Hand position → progress**, or **Follow hand**. Progress controls terminal typing, diagram stages, or code highlighting. Callouts have no internal progress animation. Loss of tracking falls back to the timed animation or chosen placement.
6. Use **Add** or **Duplicate** for more layers, up to 12. Hide, delete, and undo edits. Preset changes and footage import can also be undone.
7. Export **Finished video** (H.264 MP4, source audio unless muted) or **Transparent overlay** (ProRes 4444 MOV, silent). Overlays stay editable in the project; exported videos are flattened.

## Saving and local files

- The current project autosaves in this browser's local storage. **Save project** downloads JSON; the folder button opens a saved JSON project.
- JSON includes settings, cues, and tracking. It references footage in this studio's media folder; it does not embed or copy that footage. Opening projects from the original Cue demo requires importing their source videos into this studio again.
- Imported clips live in `.studio-data/media/`; bundles live in `.studio-data/render-bundle/`. Set `MOTION_DATA_DIR` to change the data directory.
- Renders live in `out/studio/` and can be downloaded from the export dialog.
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

This is an experimental overlay studio: 1280×720 at 30 fps, one source clip, one tracked hand, and up to 12 overlays. It does not import arbitrary React source through the UI, turn every existing full-screen composition into an overlay, offer multi-track video editing, or produce native After Effects layers. Longer commands and snippets may need smaller scale or shorter text. Review detected cues before publishing real footage; the sample is not a tracking accuracy benchmark.

## Validation

```sh
npm run test:studio
npm run typecheck
npm run studio:build
```

The automated checks cover transition cut coverage and transparent endpoints, reusable asset presets and export dimensions, preservation of existing compositions, glow and vignette geometry, gesture debouncing, confidence filtering, interpolation, missing hands, all four preset schemas, all nineteen overlay kinds, broadcast motion boundaries, seamless loop phases, playback categories, background timing, and import retiming, invalid saved projects, and shared terminal timing. Browser and export checks should additionally cover footage import, detection, editing/undo, project reload, H.264 audio, and transparent ProRes output.
