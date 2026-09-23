# CodeRabbit brand motion system

The studio opens on a reusable asset library. Select a named asset, customize the permitted content, and export it by itself. **Composition** opens the existing timeline for combining assets with footage. Existing compositions and asset presets use separate browser storage; browsing assets does not replace a saved composition.

## Motion vocabulary

The system pairs circular fields with horizontal rails. Circles open space; rails build, cover, and clear it. Reveals share an 18-frame entrance and 12-frame exit at 30 fps, with proportional timing on short clips. Transitions use staggered coverage and a fully opaque center interval. Loops use a periodic frame phase.

The references establish the approach to a reusable identity system: [LA28's modular core graphic, type, and layouts](https://la28.org/en/look-of-the-games.html) and [FIFA 26's shared identity across host cities](https://ipt.fifa.com/tournaments/mens/worldcup/canadamexicousa2026/media-releases/unprecedented-host-city-brands-launched-to-bring-fifa-world-cup-26-tm). All motion artwork here is built locally for CodeRabbit. No LA28 or FIFA artwork is included.

[CodeRabbit's brand guidelines](https://www.coderabbit.ai/brand) supply the actual visual foundation. The official full lockup stays upright, proportional, uncropped, and clear of decorative shapes. Dark colorways use the white logo; light colorways use the orange logo. Orange and mauve lead; Geist handles headings and reading text, while Hack labels the studio's technical controls. The editor and library thumbnails stay grayscale; square palette swatches show their actual colors. Brand color appears in the asset preview and export.

## Color palette

Every accent picker uses the same square swatches: CR Orange `#FF570A`, CR Mint `#25E2A8`, and CR Cobalt `#687FF5`, followed by the Mauve, Primary, Secondary, Tertiary, and Cream families shown in the brand guidelines. Supporting colors use the official sRGB tokens from the site's dark palette and preserve its step numbers. They are pinned in `studio/src/lib/brandPalette.ts`; the main CR Mint and supporting Secondary 9 are distinct published colors.

Selecting a swatch updates the asset preview, preset, composition layer, and export. The official SVG logo artwork remains intact. A previously saved custom hex color is displayed as the current color until another swatch is selected.

## Asset catalog

| ID | Asset | Default | Usage | Transparent export |
| --- | --- | --- | --- | --- |
| ID-01 | Logo reveal | 3.2s | Open a film, launch, or presentation | Yes |
| TR-01 | Circle wipe | 1.8s | Cover a cut with expanding circular fields | Yes |
| TR-02 | Stack wipe | 2s | Cover a cut with six staggered rails | Yes |
| TR-03 | Color bar wipe | 2s | Ten brand-color bands enter left and exit right | Yes |
| TR-04 | Change Stack pixel wipe | 2.4s | Uneven traveling pixels assemble and clear the glow | Yes |
| TY-01 | Type reveal | 4s | Introduce a feature or chapter | Yes |
| ID-02 | Brand sign-off | 4s | Close with a lockup, tagline, and destination | Full-frame plate |
| BG-01 | Signal loop | 8s | Repeating orange circles and rails | Full-frame plate |
| BG-02 | Change Stack glow | 16s | Product hero light and pixel field | Full-frame plate |
| AC-01 | Color bar reveal | 4s | Original hero expansion followed by a hold | Yes |
| AC-02 | Color bar loop | 8s | Expansion, hold, return, and seamless rest | Yes |

**Linear** assets render one entrance/hold/exit or transition. **Looping** assets export one complete cycle. The large preview repeats for inspection; linear thumbnails play on hover or keyboard focus, while loop thumbnails run continuously. The Change Stack thumbnail also respects reduced-motion and page visibility settings.

Transitions begin and end transparent. Their center cut frame is completely covered, including in alpha exports and in either direction. The library's **Cut at** button seeks to this exact frame. Put the exported transition above two clips in an editor and cut the underlying footage at that marker. The local composition editor supports one source video, so it does not perform a two-clip edit automatically.

**Color bar wipe** uses the hero bar's ten-color sequence as horizontal bands from top to bottom, with Stack wipe's total stagger. At the default 2 seconds, all bands enter from the left, hold a fully covered frame around the 1-second cut, and continue out to the right. Each band's color, direction, and duration can be edited. Transitions render above foreground graphics and accent bars to cover the complete edit.

**Change Stack pixel wipe** carries the original glow on individual square tiles that travel from left to right with varied delays and speeds. The pixels settle into a complete glow plate around the center cut, then break apart and continue off the right edge. Pixel size (8–40px), unevenness, direction, duration, brand color, lighting, and vignette are editable. The default is 16px pixels at 75% unevenness over 2.4 seconds; setting unevenness to zero synchronizes the rows. Variation is seeded so every preview, seek, and export reproduces the same motion. The cut stays opaque across all settings.

The color bar reproduces the [Change Stack hero's bottom accent](https://www.coderabbit.ai/change-stack): ten anchored, overlapping color segments with a 3.2-second `cubic-bezier(.65, 0, .35, 1)` expansion. The website runs this once on entering view. **Color bar reveal** keeps that behavior and holds its final widths; **Color bar loop** adds a symmetric return, with 3.2 seconds of expansion, 0.8 seconds of hold, 3.2 seconds of return, and 0.8 seconds of rest at the default 8-second cycle. Changing cycle length scales those phases together.

Bars default to the source's thin 4px bottom edge on a 720p canvas. Height (4–144px), top/center/bottom position, and all ten colors are editable. Select a numbered segment, then choose from the shared brand swatches. Library thumbnails enlarge and center the strip for visibility; the main preview and export use the selected height and position. Bars render above background and foreground assets, leave the rest of an alpha export transparent, and remain visible at both ends of a clip.

**Change Stack glow** keeps the original light beam, ambient glow, and flickering pixel field by default. Its **Lighting** controls move the illumination by a percentage of the frame, rotate it, adjust its width and height, and change softness, intensity, and ambient fill. The pixel grid stays upright while its lighting follows the beam. The independent **Vignette** controls darken the edges around an adjustable center, with separate width, height, angle, strength, and feather. Vignette strength defaults to zero. Each section has a reset; settings persist in presets and composition layers, and the same deterministic renderer drives thumbnails, preview, and export. Geometry edits preserve seamless loop timing.

## Reuse workflow

1. Select an asset. Change its supported copy, duration, dark/light colorway, accent swatch, or direction. The logo artwork and typography stay fixed.
2. Use the transparency button to inspect the alpha-capable assets over a checkerboard.
3. Choose **MP4** for a finished clip or **ProRes 4444** for a transparent reveal/transition. Both support 720p and 1080p at 30 fps. ProRes transparency should be verified in an alpha-capable editor; most video players display alpha against black.
4. **Save preset** downloads the editable asset as JSON; **Open preset** restores it. Asset filenames include their catalog ID and name. Local presets are saved per asset and remain separate from the composition.
5. **Add to composition** places the asset at the start of the existing timeline. Existing layers, source media, cues, and project duration are preserved. The new layer is trimmed to the composition's duration. A composition supports 12 layers.

## Implementation and verification

- `studio/src/lib/brandAssets.ts`: catalog, defaults, isolated export projects, transition coverage, periodic signal phase, and safe insertion into existing compositions.
- `studio/src/brand/MotionAssets.tsx`: the six new frame-driven renderers, using the bundled SVG lockups and fonts.
- `studio/src/AssetStudio.tsx`: asset browsing, previews, presets, controls, and individual exports.
- `studio/src/brand/AssetControls.tsx`: controls shared with the composition inspector.
- `studio/src/lib/colorBar.ts` and `studio/src/brand/ColorBar.tsx`: source-matched color bar geometry, deterministic motion, and transparent overlay rendering.
- `studio/src/lib/glowSettings.ts`, `studio/src/brand/GlowControls.tsx`, and `studio/src/brand/ChangeStackGlow.tsx`: shared lighting/vignette geometry, controls, and frame-driven canvas rendering. `glowSettings.test.ts` covers defaults, transforms, loop continuity, and preset validation.
- `studio/src/lib/pixelWipe.ts` and `studio/src/brand/PixelGlowWipe.tsx`: deterministic pixel travel carrying the shared Change Stack renderer. `pixelWipe.test.ts` covers endpoints, cut coverage, direction, variation, seeking, and saved settings.
- `studio/src/lib/brandAssets.test.ts`: transition endpoints and full coverage, loop periodicity, asset schema/copy limits, export dimensions, and preservation of existing projects.

Run `npm run test:studio`, `npm run typecheck`, and `npm run studio:build`. After changing motion, render representative frames and inspect alpha at the first, cut, and final frames. The prior station templates and developer explainers remain available in Composition; see [the broadcast package](broadcast-package.md).
