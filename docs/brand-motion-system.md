# CodeRabbit brand motion system

The studio opens on a reusable asset library. Select a named asset, customize the permitted content, and export it by itself. **Composition** opens the existing timeline for combining assets with footage. Existing compositions and asset presets use separate browser storage; browsing assets does not replace a saved composition.

## Motion vocabulary

Horizontal rails, type, color, and fine pixel fields form the reusable motion vocabulary. Reveals share a 0.6-second entrance and 0.4-second exit, with 60 ms child staggering and proportional compression on short clips. Foreground graphics use `cubic-bezier(.23, 1, .32, 1)` and return toward their entrance edge; masked type continues through its clipping window. Covering wipes use `cubic-bezier(.77, 0, .175, 1)`, staggered coverage, and a fully opaque center interval. The fine pixel transition reveals and fades a stationary grid. Loops use a periodic frame phase.

The references establish the approach to a reusable identity system: [LA28's modular core graphic, type, and layouts](https://la28.org/en/look-of-the-games.html) and [FIFA 26's shared identity across host cities](https://ipt.fifa.com/tournaments/mens/worldcup/canadamexicousa2026/media-releases/unprecedented-host-city-brands-launched-to-bring-fifa-world-cup-26-tm). All motion artwork here is built locally for CodeRabbit. No LA28 or FIFA artwork is included.

[CodeRabbit's brand guidelines](https://www.coderabbit.ai/brand) supply the actual visual foundation. The official full lockup stays upright, proportional, uncropped, and clear of decorative shapes. Dark colorways use the white logo; light colorways use the orange logo. Orange and mauve lead; Geist handles headings and reading text, while Hack labels the studio's technical controls. The editor and library thumbnails stay grayscale; square palette swatches show their actual colors. Brand color appears in the asset preview and export.

## Color palette

Every accent picker uses the same square swatches: CR Orange `#FF570A`, CR Mint `#25E2A8`, and CR Cobalt `#687FF5`, followed by the Mauve, Primary, Secondary, Tertiary, and Cream families shown in the brand guidelines. Supporting colors use the official sRGB tokens from the site's dark palette and preserve its step numbers. They are pinned in `studio/src/lib/brandPalette.ts`; the main CR Mint and supporting Secondary 9 are distinct published colors.

Selecting a swatch updates the asset preview, preset, composition layer, and export. The official SVG logo artwork remains intact. A previously saved custom hex color is displayed as the current color until another swatch is selected.

## Asset catalog

| ID | Asset | Default | Usage | Transparent export |
| --- | --- | --- | --- | --- |
| TR-02 | Stack wipe | 2s | Cover a cut with six staggered rails | Yes |
| TR-03 | Color bar wipe | 2s | Ten brand-color bands enter left and exit right | Yes |
| TR-04 | Change Stack pixel wipe | 2.4s | Fixed pixels reveal, fill the frame, then fade from the left | Yes |
| LT-01 | Name intro | 5s | Name, position, and company on a solid lower-third panel | Yes |
| BG-02 | Change Stack glow | 16s | Product hero light and pixel field | Full-frame plate |
| AC-01 | Color bar reveal | 4s | Hero expansion that continues into a gentle drift | Yes |
| AC-02 | Color bar loop | 8s | Expansion, hold, return, and seamless rest | Yes |
| AC-03 | Color bar reveal & exit | 4s | Bottom strip wipes in, drifts, and wipes out | Yes |

The library contains six linear assets and two loops. Logo reveal, Circle wipe, Signal loop, Type reveal, and Brand sign-off have been removed from both pickers. Their renderers remain compatible with previously saved compositions.

**Name intro** places a solid panel 64px from the bottom and the chosen left/right edge on the 1280 × 720 canvas. Name, position, and company have separate fields; long copy wraps within the panel. Background and text colors are independent, with the complete brand palettes and custom six-digit hex values. Placement also mirrors text alignment and the reveal edge. The panel reveals from that edge over 600 ms, holds still for reading, and clears toward the same edge over 400 ms; name, position, and company share 60 ms text staggering. Short durations compress that timing. Preview, saved presets, composition layers, and transparent exports use the same renderer.

**Linear** assets render one entrance/hold/exit or transition. **Looping** assets export one complete cycle. Linear thumbnails resume on mouse hover, while loop thumbnails run when visible. All thumbnails pause offscreen, in hidden tabs, and when reduced motion is preferred. Keyboard focus does not trigger decorative playback. Reduced motion starts the main preview paused; Play and Replay still let the user inspect the authored animation. These preferences never modify an export. Editing duration preserves pause state and clamps the playhead if the clip becomes shorter. The phase strip uses the same timing as the renderer.

Transitions begin and end transparent. Stack wipe and Color bar wipe completely cover their center cut frame, including in alpha exports and in either direction. Their **Cut at** button seeks to this exact frame. Put one of these exported transitions above two clips in an editor and cut the underlying footage at that marker. The pixel wipe's **Full screen** marker shows every point in the grid, with transparent space between points. The local composition editor supports one source video, so it does not perform a two-clip edit automatically.

**Color bar wipe** uses the hero bar's ten-color sequence as horizontal bands from top to bottom, with Stack wipe's total stagger. At the default 2 seconds, all bands enter from the left, hold a fully covered frame around the 1-second cut, and continue out to the right. Each band's color, direction, and duration can be edited. Transitions render above foreground graphics and accent bars to cover the complete edit.

**Change Stack pixel wipe** uses the hero effect's actual 4px squares and 2px grid spacing. Every point stays fixed; only its opacity changes. A staggered visibility wave reveals the grid from left to right during the first 44% of the clip. All points are visible across the full frame for the middle 12%, then a second wave fades them out from left to right during the final 44%. Independent fade delays and durations give the edges their uneven cadence. Pixel size (2–8px), timing variation, brightness, direction, duration, and brand color are editable. The default uses 75% timing variation over 2.4 seconds; setting it to zero aligns the fades within each column. Variation is seeded so every preview, seek, and export reproduces the same motion. Previously saved coarse tile sizes upgrade to 4px. The **Reveal / Full screen / Fade out** timeline reflects the visibility changes; transparent space remains between points, and the glow background is never drawn.

The color bar uses the [Change Stack hero's bottom accent](https://www.coderabbit.ai/change-stack): ten anchored, overlapping color segments and its `cubic-bezier(.65, 0, .35, 1)` expansion curve. **Color bar reveal** completes the main eased expansion over the first 80% of the clip and keeps the accents moving through the final frame. Fifteen percent of the total width change is spread evenly across the whole clip, creating a gentle drift as the main movement settles. Changing duration scales the motion with it. The final segment widths match the reference; there is no static hold. **Color bar loop** retains 3.2 seconds of expansion, 0.8 seconds of hold, 3.2 seconds of return, and 0.8 seconds of rest at the default 8-second cycle. Changing cycle length scales those phases together.

**Color bar reveal & exit** adds a timed entrance and exit to the bottom strip. The leading edge reveals the expanding colors from left to right during the first 32% of the clip, keeps the complete bar visible for 36%, then clears it toward the right during the final 32%. The same gentle drift continues through the middle interval and exit, so the visible colors never freeze. Direction can be reversed. The first and final frames are transparent; the area above the strip stays transparent throughout. This accent has a Reveal / Drift / Exit timeline rather than a full-frame cut marker.

Bars default to the source's thin 4px bottom edge on a 720p canvas. Height (4–144px), top/center/bottom position, and all ten colors are editable. Select a numbered segment, then choose from the shared brand swatches. Library thumbnails enlarge and center the strip for visibility; the main preview and export use the selected height and position. Bars render above background and foreground assets and leave the rest of an alpha export transparent. The original reveal and loop remain visible at both ends; the reveal & exit accent clears both ends.

**Change Stack glow** keeps the original light beam, ambient glow, and flickering pixel field by default. Its **Lighting** controls move the illumination by a percentage of the frame, rotate it, adjust its width and height, and change softness, intensity, and ambient fill. The pixel grid stays upright while its lighting follows the beam. The independent **Vignette** controls darken the edges around an adjustable center, with separate width, height, angle, strength, and feather. Vignette strength defaults to zero. Each section has a reset; settings persist in presets and composition layers, and the same deterministic renderer drives thumbnails, preview, and export. Geometry edits preserve seamless loop timing.

## Reuse workflow

1. Select an asset. Change its supported copy, duration, dark/light colorway, accent swatch, or direction. The logo artwork and typography stay fixed.
2. Use the transparency button to inspect the alpha-capable assets over a checkerboard.
3. Choose **MP4** for a finished clip or **ProRes 4444** for a transparent reveal/transition. Both support 720p and 1080p at 30 fps. ProRes transparency should be verified in an alpha-capable editor; most video players display alpha against black.
4. **Save preset** downloads the editable asset as JSON; **Open preset** restores it. Asset filenames include their catalog ID and name. Local presets are saved per asset and remain separate from the composition.
5. **Add to composition** places the asset at the start of the existing timeline. Existing layers, source media, cues, and project duration are preserved. The new layer is trimmed to the composition's duration. A composition supports 12 layers.

## Implementation and verification

- `studio/src/lib/motion.ts`: shared timing, curve evaluation, frame progression, and loop phases. Source-specific color bar and glow curves retain their original cadence.
- `studio/src/components/AssetTransport.tsx`: frame subscriptions isolated from the asset library and inspector.
- `studio/src/hooks/usePreviewActivity.ts`: reduced-motion, viewport, and document-visibility gating for previews.
- `studio/src/motion.css`: monochrome, pointer-aware press feedback; no movement for reduced-motion preferences.
- `studio/src/lib/brandAssets.ts`: catalog, defaults, isolated export projects, transition coverage, available assets, and safe insertion into existing compositions.
- `studio/src/brand/MotionAssets.tsx`: frame-driven asset renderers, using the bundled SVG lockups and fonts.
- `studio/src/brand/NameIntro.tsx` and `NameIntroControls.tsx`: solid lower thirds, mirrored reveal/exit masks, three editable text fields, placement, and independent background/text colors.
- `studio/src/AssetStudio.tsx`: asset browsing, previews, presets, controls, and individual exports.
- `studio/src/brand/AssetControls.tsx`: controls shared with the composition inspector.
- `studio/src/lib/colorBar.ts` and `studio/src/brand/ColorBar.tsx`: source-matched color bar geometry, deterministic motion, and transparent overlay rendering.
- `studio/src/lib/glowSettings.ts`, `studio/src/brand/GlowControls.tsx`, and `studio/src/brand/ChangeStackGlow.tsx`: shared lighting/vignette geometry, controls, and frame-driven canvas rendering. `glowSettings.test.ts` covers defaults, transforms, loop continuity, and preset validation.
- `studio/src/lib/pixelGrid.ts`, `studio/src/lib/pixelWipe.ts`, and `studio/src/brand/PixelGlowWipe.tsx`: shared point granularity and deterministic visibility waves. `pixelWipe.test.ts` covers fixed positions, reveal/fade direction, a fully visible grid, transparent endpoints, variation, seeking, and migration of saved settings.
- `studio/src/lib/brandAssets.test.ts`: transition endpoints and full coverage, loop periodicity, asset schema/copy limits, export dimensions, and preservation of existing projects.

Run `npm run test:studio`, `npm run typecheck`, and `npm run studio:build`. After changing motion, render representative frames and inspect alpha at the first, cut, and final frames. The prior station templates and developer explainers remain available in Composition; see [the broadcast package](broadcast-package.md).

## Motion refactor review

| Before | After | Why |
| --- | --- | --- |
| Broadcast and explainer graphics used separate entrance and exit formulas, with 100 ms text staggering. | Shared 600 ms entrance, 400 ms exit, strong ease-out, and 60 ms stagger (`studio/src/lib/motion.ts:29`). | Consistent editorial pacing, clear endpoints, and proportional timing for short clips. |
| Every frame updated the asset library and inspector; duration edits remounted the player. | The transport owns frame subscriptions and duration edits preserve the player (`studio/src/components/AssetTransport.tsx:8`). | Avoid unnecessary UI work and preserve playback state while editing. |
| Hover remounted thumbnails, and keyboard focus started decorative playback. | Stable players resume on mouse hover; thumbnails pause offscreen, in hidden tabs, and under reduced-motion preferences (`studio/src/hooks/usePreviewActivity.ts:18`). | Interruptible previews without unwanted motion or background rendering. |
| Foreground rules changed width, and gesture-following overlays updated layout coordinates. | Fixed geometry with scale and translate transforms (`studio/src/remotion/Scene.tsx:118`). | Reduce layout work during animation. |
| Global hover brightness affected branded previews. | Pointer-gated border feedback for cards and 100/160 ms press/release feedback for controls (`studio/src/motion.css:1`). | Keep artwork colors accurate and UI feedback brief. |

**Approve.** The reviewed changes preserve frame-driven scrubbing and export behavior. Verification covered 42 passing tests, both TypeScript checks, a production build, browser playback and duration edits, and rendered frames plus ProRes alpha exports. The Name intro checks cover both placements, separate colors, long copy, transparent endpoints, persisted settings, and the studio export flow. Covering wipes have opaque cut frames; entrance/exit alpha exports have clear endpoints; glow and color-bar loops match exactly at the seam. The fixed pixel grid and continuing color-bar drift remain intact.
