# CodeRabbit Video Studio (Remotion)

A [Remotion](https://www.remotion.dev/) project for producing CodeRabbit marketing and social videos as code. Every video is a React component, so animations are deterministic, reviewable, and easy to remix.

The most important thing to know: **this repo is built to be driven with Claude Code.** The design patterns for each video style are captured as skills in `.claude/skills/`, so you can ask Claude for a new video and it will follow the established look automatically — you rarely need to write a composition by hand.

## The three video families

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

All compositions are registered in `src/Root.tsx` and show up in the Studio sidebar.

## Rendering

```bash
# Render any composition by its ID (see src/Root.tsx)
npx remotion render src/index.ts PlanSlackDemoV3 out/plan-slack-demo.mp4

# As GIF
npx remotion render src/index.ts RabbitAgentLoopV4 out/loop.gif --codec=gif

# Different resolution / frame range
npx remotion render src/index.ts CodeRabbitIntro out/intro.mp4 --height=720 --width=1280 --frames=0-180
```

## Project structure

```
├── .claude/skills/        # The three video-family skills (start here)
│   ├── remotion-typewriter/
│   ├── infographic-flows/
│   └── slack-ui-demo/
├── src/
│   ├── Root.tsx           # All compositions registered here
│   ├── index.ts           # Entry point
│   └── *.tsx              # One file per composition
├── public/                # Logos/avatars loaded via staticFile() (cr-logo.png, etc.)
├── brand-samples/         # Brand reference assets, backgrounds, external logos
└── out/                   # Rendered videos (gitignored)
```

## Brand reference

- **Orange** `#FF570A` — primary accent
- **Aquamarine** `#25BAB1`, **Pink** `#F2B8EB` — secondary accents
- **Dark** `#171717` / **Black** `#000000` — backgrounds
- **Cream** `#F6F6F1` — light text/background
- **Font:** IBM Plex Mono Medium (500) everywhere — except Slack UI demos, which use Lato for realism

## License

MIT
