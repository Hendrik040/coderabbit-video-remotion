# Change Stack product asset

This asset imports the **existing React mock UI**, rather than implementing a replacement product screen.

## Source

Website commit: [`f2fcb300a03e26ed81d14712b214a4698e79b864`](https://github.com/coderabbitai/website/tree/f2fcb300a03e26ed81d14712b214a4698e79b864).

`ChangeStackLandingPage.tsx` uses `ReviewStackScreen` from `apps/front/app/components/Common/Heroes/Home/`. This directory includes that component, its overview/impact views, product icons, JSON fixture, overview data, and original CSS modules. `CarrotPressable.tsx` comes from `apps/front/app/components/Common/` at the same commit.

The original `Badge` and `cn` sources come from [`coderabbitai/carrot-ui` v0.25.0](https://github.com/coderabbitai/carrot-ui/tree/v0.25.0), along with that package's `theme.css` and `scales.css`. They retain upstream ownership; the published Carrot package is marked `UNLICENSED`. Only the imported Badge's utility dependencies and Heroicons ship at runtime. Importing the full Carrot barrel would also initialize unrelated components and syntax highlighters.

`upstream.json` records the original file hashes before adaptation.

## Adaptations

- Local imports replace Next aliases. The two activity-result strings no longer require `next-intl`.
- `ReviewStackEditor.tsx` exposes plain-text copy editing and controlled disclosure/activity state. It preserves the original rendered elements. Changes serialize into the overlay; export uses the same values without editor callbacks.
- `ChangeStack.tsx` drives the screen's existing controlled `state` API from Remotion frames. Its memoized screen keeps toolbar, sidebar, syntax markup, and SVG definitions stable between frames.
- The existing graph nodes receive opacity and translate values through CSS variables. Positions, SVG paths, colors, icons, and fixture content remain upstream's. The host also animates the shell and existing workspace panels.
- `frame.css` disables CSS clocks within the product so seeking and headless rendering are independent of playback history. Hover cards are available in the live preview; they do not appear in exports.
- `build-product-styles.mjs` generates scoped Tailwind utilities and `HomeHero.motion.module.css`, a used-selector subset of the original hero CSS. The full upstream stylesheet is retained for future updates. Run `npm run studio:styles` after editing utility classes.

The library thumbnail is a compressed still rendered from this component (`public/products/change-stack.png`), so the library does not mount another player or a duplicate UI.

The default 18-second walkthrough visits overview, data model, API/emails, Members UI, architecture, and security. The same component supports a single animated view, a still, hidden context panels, and transparent-background export. Fonts are bundled locally by the studio.

## Updating

Compare upstream files against the pinned source before replacing them. Keep the controlled-state API and the small editor/motion hooks above, regenerate styles, then verify both the browser preview and a Remotion render. Do not rebuild the UI from screenshots or marketing copy.
