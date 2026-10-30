# Scene recipes

Each recipe matches one composition in `src/antigravity/scenes.tsx`. Times are composition seconds unless marked as timeline (T) seconds. The cue comments are the spoken words the beats follow. Start frames are 29.97 fps frames in the v6 edit (100.5 s), as in `PLACEMENTS`. The v7 cut (86.62 s, 2,596 frames) starts the same compositions at 100, 646, 1103, 1671, 1840, 1978, 2285 and 2511 with unchanged durations, so the cues hold in both.

## Shared construction

```tsx
const {t, frame} = useClock(PLACEMENTS.cli.start);   // t = frame / fps
const card = (dark: boolean): CSSProperties => ({
  position: 'absolute', borderRadius: 14, overflow: 'hidden',
  background: dark ? C.panel : C.cream, border: `1.5px solid ${dark ? C.rule : C.cream3}`,
  boxShadow: '0 22px 60px rgba(18,16,20,0.42), 0 2px 6px rgba(18,16,20,0.25)',
});
```

- A tag chip (`Tag`, Hack 21 px) sits with its top 46 px above the card's top, 14 px in from the card's left edge so it clears the corner bracket, and wipes in first. The card wipes in 0.06 s later, and `PixelCorners` start 0.12 s before the tag. D4 uses 0.05 s for both.
- Overlays return a transparent `AbsoluteFill`. Stages set `background: C.cream` and add `<PixelField/>`.
- Every scene calls `useBrandFonts()` so the first frame waits for Geist and Hack.

## 08 Install terminal: `AG08CliInstall` (start 143, 192 frames, alpha)

| Time | Beat |
| --- | --- |
| 1.72 | Tag "Terminal", then the dark card (x 96, y 340, w 800, h 132) |
| 2.99–3.10 | `agy` |
| 4.03–4.24 | `plugin` |
| 4.59–4.84 | `install` |
| 5.17–5.52 | `coderabbit` |
| 5.55 | The caret's blink phase starts, but the 5.96 wipe-out covers the caret by its first off frame (6.07), so it holds steady |
| 5.6 | `coderabbit` eases to Primary 10 `#FF801F` over 0.3 s |
| 5.96 | Card and tag wipe out |

```tsx
const n = typedCount(t, [[2.99, 0], [3.10, 3], [4.02, 3], [4.03, 4], [4.24, 10], [4.58, 10], [4.59, 11],
  [4.84, 18], [5.16, 18], [5.17, 19], [5.52, 29]]);
const b = cmd.indexOf('coderabbit'), e = b + 'coderabbit'.length;   // brand word
const brand = t > 5.6 ? reveal((t - 5.6) / 0.3) : 0;              // 0.08 s after its last letter
```

The pairs come from the ASR start and end of each spoken word. The pairs 0.01 s apart are steps that add the space before the next word. Width check: `$ ` plus the 29-character command is 31 glyphs, about 709.3 px at Hack Bold 38 px (31 × 38 × 0.6021). Add 34 px left padding, the caret (3 px margin, 16 px wide) and 34 px right padding: 34 + 709.3 + 3 + 16 + 34 is about 796 px, so the card is 800 px.

Find the brand word with `indexOf`, not a fixed index, so a new command still splits on it. `color-mix` eases it from Mauve 12 (`C.text`) to `C.orangeSoft`; the `$` is CR Orange (`C.orange`).

## D1 Prompt and review loop: `AGD1PromptLoop` (start 689, 457 frames, alpha)

One card across two camera shots in v6: side angle, then front from 7.74 s. v7 opens it on the last 8 frames of the front shot before the cut to the side angle.

- Card x 96, y 140, w 710, h 300, with a muted `prompt` label. The prompt is Geist 26/38 px.
- The prompt types from 0.55 s over 1.55 s while the presenter says "I put in this prompt here". The real prompt's fourth sentence follows in muted gray, truncated with an ellipsis.
- The prompt is a list of segments; segments with `hl` and `at` highlight when they are spoken:

| Time | Phrase | Color |
| --- | --- | --- |
| 3.94 | rate limiting | orange |
| 4.88 | session handling | mint |
| 6.24 | password resets | cobalt |
| 8.6 | review the changes with CodeRabbit | orange |
| 10.7 | fix critical and major findings | cobalt |
| 12.82 | review again | orange |
| 13.38 | Report anything unresolved | mint |

- The highlight is a solid background whose `backgroundSize` grows from 0 to 100% (`boxDecorationBreak: clone` keeps wrapped lines tidy). Text turns ink once the sweep passes halfway. Phase-one highlights dim to 45% when phase two starts at 7.55.
- Tree chips (`TreeChip`) sit at x 168, rows 60 px apart below the card. The root line runs from (128, card bottom). Each connector draws from 0.18 s before its chip.
- Phase one: three requirement chips that leave at 7.55–7.65. Phase two: four loop chips, two with the white logomark. A loop-back arrow then runs from the right of "review again" (x 398) out to x 528 and back to "review the changes", ending past its right edge (x 488). The arrowhead appears at 13.4 s.
- Everything wipes out at 14.85.

## D2 Login demo: `AGD2LoginDemo` (start 1146, 211 frames, alpha)

- A light app card (x 96, y 150, w 760, h 620) with a dark tag showing the real URL, `localhost:4317`.
- The header has the app's real name and a `port 4317` chip. The prompt's three requirement chips wipe in at 1.0, 1.35 and 1.7 (on "Antigravity brings").
- State A, sign-in. The test-account chips appear on "create an account" (4.03). The pointer clicks "Alex Morgan" at 4.03. Email types 4.2–4.5, the password dots 4.42–4.62, then the pointer clicks "Sign in" at 4.85.
- State B, signed in (4.85–5.91): a mint "Signed in" banner, the profile, `session active`, `HttpOnly cookie`, and `5 login attempts / 15 min` (the demo's real rate-limit config).
- State C, reset (5.91): the real reset copy, the email field and the "Request reset link" button, clicked at 6.42.
- States crossfade over 0.25 s with a 14 px rise. Buttons darken 18% and shrink 1.5% in a 0.24 s press that peaks 0.06 s after the click.
- The card wipes out at 6.66, before the camera cut at 7.04.

## 04 Questions: `AG04Questions` (start 1714, 169 frames, alpha)

- A root chip (cream, orange mark) reading "login flow" at (96, 330).
- Two cream rows at (156, 420) and (156, 512) with an orange `?` chip and Geist SemiBold 28 px text. Each row wipes in on its first word (0.17 and 2.85), and its text decodes over 0.55 s.
- The rows wipe out at 5.22.

## D3 Review run: `AGD3ReviewRun` (start 1883, 138 frames, alpha)

- An orange "CodeRabbit plugin" chip at 0.12 s, a connector to a cobalt "Antigravity" chip at 0.85 s ("guides Antigravity"), then a connector down to a dark terminal card (x 156, y 476, w 660).
- The terminal types `coderabbit review --agent --include-untracked` from 2.3 s over 0.95 s ("running a review"). Then a mint-on-dark chip reading "review running" with an eight-pixel spinner at 3.3 s.
- Width check: `$ ` plus the 45-character command is 47 glyphs, about 594.3 px at Hack Bold 21 px (47 × 21 × 0.6021). Add 26 px left padding, the caret (3 px margin, 10 px wide) and 26 px right padding: 26 + 594.3 + 3 + 10 + 26 is about 659 px, so the card is 660 px. v6 used 640 px, which left about 6 px right of the caret; v7 uses 660 after a review note asked for more room.

## 05 Finding stage: `AG05Finding` (start 2021, 307 frames, opaque)

| Time | Beat (spoken cue) |
| --- | --- |
| 0.1 | Step chip "1 Analyze" active; typemark and code card appear ("CodeRabbit") |
| 0.9–2.0 | A mint scan band sweeps the code rows ("analyzes the changes") |
| 1.95 | The key row takes a raised fill and an orange left bar |
| 2.2 / 2.7 | Connectors draw; the context chips `config.js MAX_ATTEMPTS: 5` and `server.js login route` wipe in at 2.35 / 2.85 ("using the surrounding codebase") |
| 5.09 | "2 Finding" active; the finding card appears: mark, "CodeRabbit", Major chip ("returns findings") |
| 5.2 | Headline decodes: "The sixth attempt gets through." |
| 6.63–6.7 | `<=` gets an orange block and the explanation types in; the removed line wipes in with a callout connector from the operator ("explanations") |
| 7.9–8.05 | Cobalt connector and "Antigravity can use it" chip ("Antigravity") |
| 8.5–8.65 | "3 Suggested fix" active; the added line and the "Suggested fix" chip ("can use to make fixes") |

- The code card is x 120, y 236, w 840, h 560, with 52 px rows. Context rows are abstract bars, and only the key line is real text (Hack Bold 32 px).
- The operator's x position is `codeX + 40 + 16 × (32 × 0.6021)`, from the 16 characters of `currentAttempts `.
- Finding card: x 1030, y 404, w 770, paper `#FFFCFA`.
- The step chips run active (orange), done (Cream 4 with a check) and upcoming (outlined).

## D4 Changes: `AGD4FilesChanged` (start 2515, 85 frames, alpha)

- Paper card x 96, y 190, w 680, h 560, with a dark "Antigravity" tag. The header reads `11 files changed`, `+2794`, `−0` and has an orange Review button.
- The demo's 11 real files appear one after another (0.15 s + 35 ms each).
- The pointer travels from 0.3 s, clicks Review at 0.95 ("can inspect"), and the rows take a cobalt highlight from 1.05.

## 07 End card: `AG07EndCard` (start 2927, 85 frames, opaque)

- Cream stage with the pixel field. The orange typemark (62 px high) arrives at 0.5, "Plugin for Google Antigravity" (Geist SemiBold 54) at 0.58, and the command chip (ink, Hack Bold 44, orange `$`) wipes in at 0.68.
- The chip's `PixelCorners` use the computed width `31 × 44 × 0.6021 + 72`, and the docs URL decodes in from 0.86.
- It starts at the midpoint of the studio color-bar wipe (`09-color-bar-wipe-end.mov`), which uncovers it over its first 18 frames (0.6 s).
