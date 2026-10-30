# CodeRabbit Video Studio (Remotion)

A [Remotion](https://www.remotion.dev/) project for producing CodeRabbit marketing and social videos as code. Every video is a React component, so animations are deterministic, reviewable, and easy to remix.

## Local Motion Studio

A local library of reusable CodeRabbit motion assets, with an optional composition editor for footage and layered graphics.

```bash
npm install
npm run studio:setup  # downloads the gesture model once; footage stays local
npm run studio       # http://127.0.0.1:4319
```

Use Node.js 22 or newer for the studio. The **Brand motion** library contains logo reveals, circular and stacked transitions, a type reveal, a brand sign-off, and two looping backgrounds. Preview and export each asset independently in 720p or 1080p, save editable presets, or add it to a composition. Official logos, Geist/Hack typography, and shared motion rules keep the assets consistent. The editor stays monochrome. See the [brand motion system](docs/brand-motion-system.md).

In **Composition**, the **Broadcast rundown**, **Developer walkthrough**, and **Code & API explainer** presets remain available, or import a video. Edit terminals, agent workflows, code panels, API diagrams, and callouts; adjust timing and placement; then export an MP4 or a transparent ProRes overlay. The sample's hand motion is simulated. Imported clips can be analyzed locally for real gestures.

The terminal is shared with the existing `TerminalTyping` compositions. The compact agent workflow adapts `RabbitAgentLoopV4`'s visual language. Both are also shown in the new `MotionBrandKit` composition in Remotion Studio. Existing compositions remain available with `npm start`.

Projects autosave in this browser, with JSON save/open for explicit backups. Source video lives in `.studio-data/media/`; renders go to `out/studio/`. Neither footage nor models are committed. [Studio setup, controls, and limitations](studio/README.md).

```bash
npm run test:studio   # gesture, project validation, and shared terminal checks
npm run typecheck    # original Remotion compositions
npm run studio:build # studio typecheck and production bundle
npm run studio:serve # serve the production build locally
```

The most important thing to know: **this repo is built to be driven with Claude Code.** The design patterns for each video style are captured as skills in `.claude/skills/`, so you can ask Claude for a new video and it will follow the established look automatically — you rarely need to write a composition by hand.

## The four video families

### 1. Typewriter text slides (`remotion-typewriter` skill)

Short punchy slides where text types out character by character on a black background in CodeRabbit orange — used for hooks, taglines, and intros.

- **Skill:** `.claude/skills/remotion-typewriter/SKILL.md`
- **Examples:** `DidThisEverHappenToYou`, `KeepShipping`, `CodeRabbitShips`, `SuperDeveloper`, `TerminalTyping` (terminal-window variant)
- **Look:** IBM Plex Mono 500, orange `#FF570A` on black, seeded-random jitter so renders are identical every time.

### 2. Animated infographic flows (`infographic-flows` skill)

Multi-phase animated diagrams that explain how something works — agent loops, pipelines, knowledge graphs, icon cycling, pill morphs.

- **Skill:** `.claude/skills/infographic-flows/SKILL.md`
- **Canonical reference:** `src/RabbitAgentLoopV4.tsx`
- **Examples:** the `RabbitAgentLoop` series (V1–V6), `MultiRepoViz`, `ASTWalkViz`, `InnerOuterLoopViz`, `ImpactSlicerViz`, the `MergeConflictResolution` series (V1–V5)
- **Look:** same brand mono font and orange-on-black/dark-navy palette, with a shared `fi()` fade-in helper and spring-based motion.

### 3. Simulated app-UI demos (`slack-ui-demo` skill)

Videos that play like a **clean screen recording** of Slack showing a CodeRabbit feature (e.g. the `/plan` agent) — full-frame UI, real Slack dark theme, typing indicators, agent "Working…" pills. Made by studying frames from a real screen recording, then rebuilding it as a simplified, polished animation. These are the recent Slackbot agent videos.

- **Skill:** `.claude/skills/slack-ui-demo/SKILL.md`
- **Canonical reference:** `src/PlanSlackDemo.tsx`
- **Examples:** `PlanSlackDemo` V1–V3
- **Look:** deliberately *not* brand-styled — Lato font and Slack's real dark palette, because realism beats branding for a fake screen recording. 1920×1080 @ 30fps.

### 4. Simplified product-UI inserts (`product-ui-animations` skill)

Animated product moments that replace raw screen recordings in presenter videos. Floating cards sit beside the speaker: a terminal that types the command on the spoken words, a prompt card whose phrases branch into chip trees, a simplified app card with a clicking pointer. A full-screen stage carries the key result (code under review, the returned finding, the suggested fix). Every beat is cued from word timings, so it lands as the line is spoken.

- **Skill:** `.claude/skills/product-ui-animations/SKILL.md` (scene recipes, render and verify commands, and the reference-film method in `references/`)
- **Canonical reference:** `src/antigravity/` (`kit.tsx` primitives, `scenes.tsx` scenes, and a separate entry point, `index.tsx`)
- **Examples:** the eight inserts of the CodeRabbit plugin for Google Antigravity launch film (terminal install, prompt and review loop, login demo, questions, review run, finding stage, files changed, end card)
- **Look:** the current brand kit rather than the older look above: Geist and Hack from `public/brand/fonts`, the Mauve, Cream, Orange, Mint and Cobalt tokens, the 600 ms reveal curve, and the official marks. Compositions use the edit's own frame rate (29.97 fps for that film). Overlays render as ProRes 4444 with alpha.
- **Preview and render:** `npx remotion studio src/antigravity/index.tsx` opens these compositions. `npm start` does not list them, because they are not in `src/Root.tsx`. Render with `node scripts/render-antigravity.mjs`: `--stills` writes review frames only, `--only=<ids>` limits it to some compositions, and `--out=<dir>` sets the output folder (default `out/antigravity`).

## How to make a new video

1. Open this repo in Claude Code.
2. Describe what you want, e.g. *"Make a Slack demo video of the new review command"* or *"Create an infographic showing the multi-repo flow"*.
3. The matching skill triggers automatically and gives Claude the exact fonts, colors, timing helpers, layout patterns, and verification steps for that video family.
4. Preview in Remotion Studio, iterate, render.

If you're tweaking by hand instead, copy the canonical reference component for that family — every composition follows its skill's patterns.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm start        # opens Remotion Studio at http://localhost:3000
```

All compositions except the product-UI inserts are registered in `src/Root.tsx` and show up in the Studio sidebar. The inserts have their own entry point (see family 4).

## Rendering

```bash
# Render any composition in src/Root.tsx by its ID (product-UI inserts: see family 4)
npx remotion render src/index.ts PlanSlackDemoV3 out/plan-slack-demo.mp4

# As GIF
npx remotion render src/index.ts RabbitAgentLoopV4 out/loop.gif --codec=gif

# Different resolution / frame range
npx remotion render src/index.ts CodeRabbitIntro out/intro.mp4 --height=720 --width=1280 --frames=0-180
```

## Project structure

```
├── .claude/skills/        # The four video-family skills (start here)
│   ├── remotion-typewriter/
│   ├── infographic-flows/
│   ├── slack-ui-demo/
│   └── product-ui-animations/
├── src/
│   ├── Root.tsx           # Compositions registered here (not the product-UI inserts)
│   ├── index.ts           # Entry point
│   ├── antigravity/       # Product-UI inserts kit, scenes and separate entry point
│   └── *.tsx              # One file per composition
├── public/                # Logos/avatars loaded via staticFile() (cr-logo.png, brand/ fonts and marks)
├── scripts/               # Render scripts (render-antigravity.mjs)
├── brand-samples/         # Brand reference assets, backgrounds, external logos
└── out/                   # Rendered videos (gitignored)
```

## Brand reference

These colors and the font belong to the older families:

- **Orange** `#FF570A` — primary accent
- **Aquamarine** `#25BAB1`, **Pink** `#F2B8EB` — secondary accents
- **Dark** `#171717` / **Black** `#000000` — backgrounds
- **Cream** `#F6F6F1` — light text/background
- **Font:** IBM Plex Mono Medium (500) — except Slack UI demos, which use Lato for realism

Product-UI inserts use the official tokens in `studio/src/lib/brandPalette.ts` (CR Orange `#FF570A`, CR Mint `#25E2A8`, CR Cobalt `#687FF5`, Mauve grounds, Cream 6 `#F7F2EF`), with Geist and Hack from `public/brand/fonts`.

## License

MIT
