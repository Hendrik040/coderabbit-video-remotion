---
name: remotion-typewriter
description: Use this skill whenever creating or modifying Remotion typewriter/typing animation slides in this project. Triggers on requests like "create a new slide", "add a typing animation", "make text type out", "new composition", "new scene", "fast version", "slow down the typing", "left justify", "center the text", or any request to build or tweak a Remotion video component with animated text. Always consult this skill before writing any Remotion slide component from scratch.
version: 1.0.0
---

# Remotion Typewriter Skill

This project builds short Remotion videos with typewriter-effect text animations. All slides follow a consistent set of patterns established across the codebase. Always apply these patterns exactly — don't reinvent them.

## Brand constants

```ts
const TEXT_COLOR = "#FF570A";  // CodeRabbit Primary Orange-500
const BG_COLOR   = "#000000";  // Pure black
const FONT_SIZE  = 90;
```

## Font setup

Always use IBM Plex Mono Medium. Load it at the top of every component file:

```ts
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });
```

Apply it in styles as:
```ts
fontFamily: FONT_FAMILY,
fontWeight: 500,
```

## Seeded random (for natural-feeling jitter)

Use this deterministic seeded random so every frame renders identically across renders:

```ts
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
```

Seed with a per-character value that's unique across all strings in the component. For a second string, offset the seed (e.g. `i + 100`) to avoid collisions.

## Char frame pre-computation

Pre-compute the frame at which each character appears **outside the component** (module level), so it's stable across renders:

```ts
const START_FRAME = 18; // brief black screen before typing

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = START_FRAME;
  for (let i = 0; i < TEXT.length; i++) {
    frames.push(currentFrame);
    const char = TEXT[i];
    if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);  // avg ~4
    } else if (char === "." || char === "!") {
      currentFrame += 10 + Math.floor(seededRandom(i * 7 + 5) * 6);  // dramatic pause
    } else if (char === "?") {
      currentFrame += 10 + Math.floor(seededRandom(i * 7 + 5) * 4);
    } else {
      currentFrame += 4 + Math.floor(seededRandom(i * 31 + 17) * 4); // avg ~6
    }
  }
  return frames;
};

const CHAR_FRAMES = computeCharFrames();
```

Inside the component, derive visible characters from `frame`:

```ts
const charsVisible = CHAR_FRAMES.filter((f) => frame >= f).length;
const displayText  = TEXT.slice(0, charsVisible);
```

## Fast mode (fixed speed, no jitter)

When the user wants a specific per-character speed (e.g. 0.08s/char at 30fps):

```ts
const FRAMES_PER_CHAR = Math.round(0.08 * 30); // = 2

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = START_FRAME;
  for (let i = 0; i < TEXT.length; i++) {
    frames.push(currentFrame);
    currentFrame += FRAMES_PER_CHAR; // uniform, no jitter
  }
  return frames;
};
```

## Stable centered text (phantom width trick)

When text is centered, each new character would shift the whole block leftward as the width grows. **Always use the phantom trick** for centered slides to lock the position from frame 1:

```tsx
<div style={{ position: "relative", whiteSpace: "nowrap" }}>
  {/* Invisible full text reserves the final width — block never shifts */}
  <span style={{ visibility: "hidden" }}>{FULL_TEXT}</span>
  {/* Typed text overlaid at the left edge of that fixed-width box */}
  <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
    {displayText}
    <span style={{ visibility: cursorVisibility }}>|</span>
  </span>
</div>
```

For **multi-line centered slides**, apply the same trick per line, and **always render all lines** (never conditionally mount them). Hide unstarted lines with `visibility: "hidden"` on the outer div so the container height is fixed from the start and line 1 never jumps when line 2 appears:

```tsx
{/* Line 2 — always in DOM to prevent line 1 shifting up when it appears */}
<div style={{ position: "relative", whiteSpace: "nowrap", visibility: charsVisible > LINE_1.length ? "visible" : "hidden" }}>
  <span style={{ visibility: "hidden" }}>{LINE_2}</span>
  <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
    {displayLine2}
    <span style={{ visibility: !onLine1 ? cursorVisibility : "hidden" }}>|</span>
  </span>
</div>
```

This pattern is **required for all centered slides**. Left-justified slides don't need it since text naturally grows rightward.

## Cursor blink

**Never** conditionally render the cursor — that shifts layout. Use `visibility` only:

```ts
const cursorBlink      = Math.floor(frame / 15) % 2 === 0;
const cursorVisibility = typingStarted && cursorBlink ? "visible" : "hidden";

// In JSX:
<span style={{ visibility: cursorVisibility }}>|</span>
```

`typingStarted` is `frame >= START_FRAME`. Hide the cursor after a scene ends by clamping: `frame >= START_FRAME && frame < FADE_START`.

## Multi-line typewriter

Concatenate both lines into one `ALL_CHARS` string, track position, then split:

```ts
const LINE_1 = "Introducing";
const LINE_2 = "CodeRabbit Usage-based Add-on";
const ALL_CHARS = LINE_1 + LINE_2;

// In computeCharFrames, add a pause after line 1 finishes:
if (i === LINE_1.length - 1) {
  currentFrame += 22; // pause before line 2 (8 in fast mode)
}

// In component:
const line1Visible = Math.min(charsVisible, LINE_1.length);
const line2Visible = Math.max(0, charsVisible - LINE_1.length);
const onLine1      = charsVisible <= LINE_1.length;

// Cursor logic for two lines:
<span style={{ visibility: onLine1 ? cursorVisibility : "hidden" }}>|</span>  // line 1
<span style={{ visibility: !onLine1 ? cursorVisibility : "hidden" }}>|</span> // line 2
```

Only render line 2's div once `charsVisible > LINE_1.length`.

## Two-scene structure with fade

Use `interpolate` for the black overlay between scenes:

```ts
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const HOLD_AFTER_SCENE1 = 30;   // 1s hold after last char
const FADE_DURATION     = 20;   // fade to black
const FADE_START = SCENE1_LAST_CHAR_FRAME + HOLD_AFTER_SCENE1;
const FADE_END   = FADE_START + FADE_DURATION;
const SCENE2_START = FADE_END + 20; // brief black gap

const fadeOpacity = interpolate(frame, [FADE_START, FADE_END], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

JSX structure:

```tsx
<AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
  {/* Scene 1 — unmount once fade completes */}
  {frame < FADE_END && (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 120 }}>
      ...scene 1 text...
    </AbsoluteFill>
  )}

  {/* Fade overlay */}
  {frame >= FADE_START && frame < FADE_END && (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: fadeOpacity }} />
  )}

  {/* Scene 2 */}
  {frame >= SCENE2_START && (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      ...scene 2 text...
    </AbsoluteFill>
  )}
</AbsoluteFill>
```

## Text alignment

**Default is left-justified.** All slides use left-justified text unless there is a specific reason to center (e.g. a single short punchy word/phrase used as a hero moment). When in doubt, left-justify.

| Style | Container | Inner div |
|-------|-----------|-----------|
| Left-justified (default) | `justifyContent: "center"`, `alignItems: "flex-start"`, `paddingLeft: 120` | `alignItems: "flex-start"` |
| Centered (hero/single word) | `justifyContent: "center"`, `alignItems: "center"` | `alignItems: "center"` |

For multi-scene slides, each scene can have its own alignment. Scene 1 is typically left-justified; a final "Keep shipping!" style scene can also be left-justified.

## Exact total duration

Export the computed total so `Root.tsx` uses the precise frame count with no wasted frames:

```ts
export const MY_COMP_TOTAL_FRAMES = LAST_CHAR_FRAME + 45;
```

Import and use it directly in `Root.tsx`:

```tsx
import { MyComp, MY_COMP_TOTAL_FRAMES } from "./MyComp";

<Composition
  id="MyComp"
  component={MyComp}
  durationInFrames={MY_COMP_TOTAL_FRAMES}
  fps={30}
  width={1920}
  height={1080}
/>
```

## Composition defaults

All slides in this project use:
- `fps={30}`
- `width={1920}`, `height={1080}` (widescreen)
- Some older square comps use `width={1080}`, `height={1080}`

## Complete minimal single-line slide template

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

const TEXT       = "Your text here";
const TEXT_COLOR = "#FF570A";
const BG_COLOR   = "#000000";
const FONT_SIZE  = 90;
const START_FRAME = 18;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let f = START_FRAME;
  for (let i = 0; i < TEXT.length; i++) {
    frames.push(f);
    const c = TEXT[i];
    if (c === " ")            f += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);
    else if (".,!?".includes(c)) f += 10 + Math.floor(seededRandom(i * 7 + 5) * 4);
    else                      f += 4 + Math.floor(seededRandom(i * 31 + 17) * 4);
  }
  return frames;
};

const CHAR_FRAMES = computeCharFrames();
const LAST_FRAME  = CHAR_FRAMES[CHAR_FRAMES.length - 1];
export const TOTAL_FRAMES = LAST_FRAME + 45;

export const MySlide: React.FC = () => {
  const frame = useCurrentFrame();
  const charsVisible    = CHAR_FRAMES.filter((f) => frame >= f).length;
  const cursorBlink     = Math.floor(frame / 15) % 2 === 0;
  const cursorVisibility = frame >= START_FRAME && cursorBlink ? "visible" : "hidden";

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR, justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, fontWeight: 500, color: TEXT_COLOR }}>
        {TEXT.slice(0, charsVisible)}
        <span style={{ visibility: cursorVisibility }}>|</span>
      </div>
    </AbsoluteFill>
  );
};
```

## Existing slides for reference

| File | Description |
|------|-------------|
| `AgentsCookSlide.tsx` | Single line, dots get dramatic pauses |
| `AlternativeCook.tsx` | Single line, no ellipsis variant |
| `CodeRabbitShips.tsx` | Single line |
| `UsageBasedAddonIntro.tsx` | Two lines, centered, original speed |
| `DidThisEverHappenToYou.tsx` | Two scenes, scene 1 left-justified, scene 2 centered, original speed |
| `DidThisEverHappenToYouFast.tsx` | Same as above, fixed 2 frames/char (0.08s) |
| `RateLimitWarning.tsx` | Single line, yellow `#F5C518` on black, 2 frames/char, left-justified, `_` cursor |
| `KeepShipping.tsx` | Two scenes: 2-line scene 1 + "Keep shipping!", orange, 5 frames/char (0.15s), left-justified |
