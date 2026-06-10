---
name: slack-ui-demo
description: Use this skill whenever creating or modifying simulated app-UI screen-recording compositions in this project — videos that look like a real screen recording of Slack (or a similar chat/app UI) showing a product feature, e.g. CodeRabbit's /plan agent. Triggers on requests like "Slack demo video", "screen recording style", "simulate the product in Slack", "chat UI demo", "agent thread demo", "fake Slack recording", or any request to rebuild a real product screen recording as a clean Remotion animation. Always consult this skill before writing any simulated-UI demo component from scratch.
version: 1.0.0
---

# Slack UI Demo Skill

This project builds Remotion compositions that play like a **clean screen recording** of Slack: full-frame UI, no decorative backdrop, no logo outro — as if the viewer is watching someone work. The canonical reference is `src/PlanSlackDemo.tsx` (the "Plan with CodeRabbit Agent" demo). Follow its patterns exactly.

## Workflow (in order)

1. **Analyze the real recording first.** If a screen recording of the actual product exists, extract frames before designing anything:
   ```bash
   ffprobe -v quiet -print_format json -show_format "recording.mp4"   # duration/fps
   ffmpeg -y -v error -i "recording.mp4" -vf "fps=1/4" /tmp/frames/frame_%02d.png
   ```
   Read the frames as images. Note the product's real UI states (e.g. CodeRabbit's "Working…" pill, Cancel button, thread reply format, APP badge, mention highlight) — authenticity comes from copying these states, simplification comes from removing everything else.
2. **Write the copy as module-level constants** (messages, prompt, plan sections) before any JSX.
3. **Build the timeline as derived constants** (see Timeline below).
4. **Verify with stills before rendering video** (see Verification below).

Compositions are **1920×1080 @ 30fps**. Export the computed total (`export const MY_DEMO_TOTAL_FRAMES = ...`) and register in `src/Root.tsx` like every other composition. App logos/avatars load via `staticFile()` from `public/` (e.g. `cr-logo.png`).

## Fonts — realism overrides brand

Slack UI text uses **Lato**, NOT IBM Plex Mono. The brand mono font is only for inline code chips. This is a deliberate exception to the other skills' font rule: a simulated screen recording must look like the real app.

```ts
import { loadFont as loadLato } from "@remotion/google-fonts/Lato";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
const { fontFamily: LATO } = loadLato("normal", { weights: ["400", "700", "900"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500"] });
```

Bold names/headers use weight 900 (Lato's 700 reads thin at 1080p).

## Slack dark-theme palette

```ts
const BG = "#1A1D21";            // main column
const SIDEBAR_BG = "#19171D";    // sidebar
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#D1D2D3";          // message body
const DIM = "rgba(209,210,211,0.55)";
const FAINT = "rgba(209,210,211,0.35)";  // timestamps, placeholders
const ACTIVE_BLUE = "#1164A3";   // selected channel row
const LINK_BLUE = "#1D9BD1";     // "2 replies" links
const CHIP_BG = "#232529"; const CHIP_BORDER = "#3E4045"; const CHIP_TEXT = "#E8912D"; // inline code
const CR_ORANGE = "#FF570A";     // CodeRabbit avatar square
const GREEN_BTN = "#1F9D61";     // action button ("Implement final plan")
```

## Layout

```ts
const SIDEBAR_W = 300;
const MAIN_W_FULL = 1920 - SIDEBAR_W;            // 1620
const THREAD_W = 720;
const MAIN_W_NARROW = 1920 - SIDEBAR_W - THREAD_W; // 900
const HEADER_H = 56;
const MSG_MAX_W = 740;  // see "no reflow" rule
```

**No-reflow rule:** message text gets a fixed `maxWidth: MSG_MAX_W` that fits the *narrow* main column. When the thread panel slides in and the main column animates from 1620→900, text must NOT rewrap mid-animation. 740 fits both widths; never let message width depend on the animated column width.

Keep the sidebar minimal: workspace name, ~5 dim channels (active one on `ACTIVE_BLUE`), an "Apps" section with the product. No DMs, no unread badges, no workspace rail — clutter steals the focal point.

## Core helpers

```ts
function fi(frame: number, start: number, dur = 12) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function riseIn(frame: number, start: number, dur = 12): React.CSSProperties {
  const op = fi(frame, start, dur);
  const ty = interpolate(frame, [start, start + dur], [8, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: op, transform: `translateY(${ty}px)` };
}
```

Every message/section reveal = `riseIn` + `visibility: frame >= at ? "visible" : "hidden"`. Elements stay mounted (layout space reserved, nothing jumps); messages appear top-down in place like arriving live.

## Typing the slash command (variable-speed typewriter)

Use the seeded-random typewriter (same as the remotion-typewriter skill), but with **three speed phases** so the command registers and the long prompt doesn't drag:

```ts
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const TYPE_START = 400;
const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let f = TYPE_START;
  for (let i = 0; i < PROMPT.length; i++) {
    frames.push(Math.round(f));
    if (i < 4) f += 5;                 // "/plan" typed deliberately (popover moment)
    else if (i === 4) f += 16;         // beat while the slash popover is up
    else if (PROMPT[i] === " " && seededRandom(i * 13 + 5) > 0.82) f += 5; // thinking pause
    else f += 0.45 + seededRandom(i * 31 + 7) * 0.4; // fast natural burst (~6s for 300 chars)
  }
  return frames;
};
const CHAR_FRAMES = computeCharFrames();
const TYPE_END = CHAR_FRAMES[CHAR_FRAMES.length - 1];
```

In the component: `charsVisible = CHAR_FRAMES.filter((f) => frame >= f).length`, `displayText = PROMPT.slice(0, charsVisible)` (sub-frame increments mean several chars can land on one frame — that's the fast-burst effect). Clear the composer by forcing `charsVisible = 0` once `frame >= T_SEND`.

**Slash popover:** a dark card (`#222529`, border `#3E4045`, "SLASH COMMANDS" header, one highlighted row with app avatar + command + description) anchored `bottom: 100%` above the composer. Visible from `CHAR_FRAMES[1]` (after "/p") and fades out at `CHAR_FRAMES[6]` (first char past "/plan ").

**Composer:** rounded box (`#222529`, border `rgba(255,255,255,0.28)`), placeholder `Message #channel` in FAINT, fake toolbar row (+ / Aa / @ / ☺), send arrow that turns `#007A5A` green once text exists. Cursor is a 2px white bar toggled with `visibility` (never conditionally rendered), blink = `Math.floor(frame / 14) % 2`.

## Timeline pattern

All beats are module-level constants **derived from TYPE_END**, so retiming the prompt never breaks downstream beats:

```ts
const T_MSG1 = 18;            // pre-seeded conversation arrives live,
const T_MSG2 = 140;           // spaced by reading time (~3.5–5s per message,
const T_MSG3 = 290;           // longer messages get longer holds)
const T_SEND = TYPE_END + 20;
const T_CR_MSG = T_SEND + 8;     // bot's channel message
const T_THREAD = T_CR_MSG + 26;  // thread panel slides in
const T_WORKING = T_THREAD + 26; // working pill
const T_PLAN = T_WORKING + 105;  // ~3.5s of "Working…"
const S_SCOPE = T_PLAN + 18;     // then one section every ~30–42 frames
// ... S_P1, S_P2, S_P3, S_NG, S_BTN
export const TOTAL_FRAMES = S_BTN + 180; // ~6s hold on the finished state
```

## Thread panel

- Slides in: `translateX` from `THREAD_W`→0 over 20 frames, `Easing.out(Easing.cubic)`; main column width animates `MAIN_W_FULL`→`MAIN_W_NARROW` over the same window.
- Header: "Thread" bold + `# channel` dim + ✕ right.
- Root message = the bot's channel message repeated (name + APP badge + "Prompt:" + quote block).
- Quote block: `borderLeft: "4px solid #4A4D52"`, DIM text — used for echoing the typed prompt.
- Replies divider: `"1 reply"` in LINK_BLUE that flips to `"2 replies"` when the plan posts.

## Authentic product states (copy these from the real recording)

**Working pill:** bordered rounded box with a rotating SVG arc (`strokeDasharray="26 18"`, wrapper `transform: rotate(${frame * 9}deg)`) and shimmer text. Shimmer is frame-driven — CSS animations don't run in Remotion:

```ts
const shimmerX = interpolate((frame - T_WORKING) % 50, [0, 50], [120, -120]);
// backgroundImage: linear-gradient(90deg, #85878B 30%, #FFF 50%, #85878B 70%)
// backgroundSize: "200% 100%", backgroundPositionX: `${shimmerX}%`,
// WebkitBackgroundClip: "text", color: "transparent"
```

Below it: a crimson `#C61E51` Cancel button. The whole pill fades out over the 10 frames before `T_PLAN`.

**Mention pill (self-mention, yellow):** `color: #FCE9B8`, `background: rgba(242,199,68,0.28)`, radius 4.

**APP badge:** 11px bold DIM text on `rgba(255,255,255,0.1)`, radius 3.

**CodeRabbit avatar:** 40px rounded square (radius 8), `CR_ORANGE` background, `cr-rabbit-dark.png` at 82% inside — a dark (`#1A1D21`) rabbit that emulates the real app icon's transparent cutout. Never white-rabbit-on-orange or orange-rabbit-on-black; the real icon is an orange square with the rabbit punched out. People get Slack default person-silhouette avatars (rounded square, muted background, white head-and-shoulders SVG) — Slack never shows initials avatars.

**Code chips:** MONO 0.86em, `CHIP_TEXT` on `CHIP_BG` with `CHIP_BORDER`. The **money-shot glow** pulses the border/box-shadow on the chips that prove codebase awareness (real file paths, table names):

```ts
const glow = fi(frame, S_SCOPE + 12, 18) *
  interpolate(frame, [S_SCOPE + 70, S_SCOPE + 100], [1, 0], { /* clamp */ });
// border: rgba(255,135,42, 0.3 + glow*0.7), boxShadow: 0 0 ${10*glow}px rgba(255,120,30,${0.55*glow})
```

**Action button:** GREEN_BTN, weight 900, pops with `Easing.out(Easing.back(1.8))` scale 0.85→1, `transformOrigin: "left center"`.

## Verification (always before full render)

1. Render stills at key beats: all messages visible, popover up, mid-typing, working pill, plan fully built:
   ```bash
   npx remotion still src/index.ts MyDemo /tmp/f.png --frame=N
   ```
2. The 1920px stills come back downscaled — **crop panels to inspect detail**:
   ```bash
   ffmpeg -y -v error -i /tmp/f.png -vf "crop=720:1080:1200:0" /tmp/f_thread.png
   ```
3. Only then `npx remotion render src/index.ts MyDemo out/MyDemo.mp4`.

## Key rules (learned from iteration)

1. **Realism beats brand** — Lato UI font, Slack's own palette, real product states (Working pill, APP badge, Cancel). The simplification is in *what you omit* (clutter, scroll history, workspace rail), never in inventing fake-looking UI.
2. **No reflow** — fixed `MSG_MAX_W` that fits the narrowed column; never width-dependent text wrapping during the panel slide.
3. **Frame-driven everything** — no CSS animations/transitions; shimmer, spinner, blink all derive from `frame`.
4. **Everything mounted, revealed by `visibility` + opacity** — conditional mounting shifts layout.
5. **Reading-time pacing** — ~3.5–5s per chat message before the next beat; plan sections every ~1–1.4s; ≥5s hold on the final state.
6. **Derive the timeline** — all beats chain off `TYPE_END` and each other; no magic absolute frames after typing starts.
7. **No backdrop, no outro** — it's "an extension of a recorded screen", not a branded slide. Cut/fade in the editor instead.
8. **Plan content must fit the thread panel** (~950px usable) — trim copy rather than implementing scrolling; verify with a cropped still.
