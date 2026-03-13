import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

// --- Scene 1: two lines ---
const S1_LINE1 = "while CodeRabbit reviews every line,";
const S1_LINE2 = "no limits.";
const S1_ALL   = S1_LINE1 + S1_LINE2;

// --- Scene 2 ---
const S2_TEXT = "Keep shipping!";

const TEXT_COLOR = "#FF570A";
const BG_COLOR   = "#000000";

// 0.15s per char at 30fps = 4.5 → 5 frames per char (fixed, no jitter)
const FRAMES_PER_CHAR  = Math.round(0.15 * 30); // = 5
const LINE_PAUSE       = 18; // frames between scene 1 line 1 → line 2
const SCENE1_START     = 18;

const computeScene1Frames = (): number[] => {
  const frames: number[] = [];
  let f = SCENE1_START;
  for (let i = 0; i < S1_ALL.length; i++) {
    frames.push(f);
    f += i === S1_LINE1.length - 1 ? LINE_PAUSE : FRAMES_PER_CHAR;
  }
  return frames;
};

const S1_CHAR_FRAMES    = computeScene1Frames();
const S1_LAST_FRAME     = S1_CHAR_FRAMES[S1_CHAR_FRAMES.length - 1];

const HOLD_AFTER_S1     = 30;
const FADE_DURATION     = 20;
const FADE_START        = S1_LAST_FRAME + HOLD_AFTER_S1;
const FADE_END          = FADE_START + FADE_DURATION;
const SCENE2_START      = FADE_END + 20;

const computeScene2Frames = (): number[] => {
  const frames: number[] = [];
  let f = SCENE2_START;
  for (let i = 0; i < S2_TEXT.length; i++) {
    frames.push(f);
    f += FRAMES_PER_CHAR;
  }
  return frames;
};

const S2_CHAR_FRAMES    = computeScene2Frames();
const S2_LAST_FRAME     = S2_CHAR_FRAMES[S2_CHAR_FRAMES.length - 1];

export const KEEP_SHIPPING_TOTAL_FRAMES = S2_LAST_FRAME + 50;

export const KeepShipping: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Scene 1 ---
  const s1Chars    = S1_CHAR_FRAMES.filter((f) => frame >= f).length;
  const s1L1Vis    = Math.min(s1Chars, S1_LINE1.length);
  const s1L2Vis    = Math.max(0, s1Chars - S1_LINE1.length);
  const onS1L1     = s1Chars <= S1_LINE1.length;

  // --- Fade overlay ---
  const fadeOpacity = interpolate(frame, [FADE_START, FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Scene 2 ---
  const s2Started  = frame >= SCENE2_START;
  const s2Chars    = s2Started ? S2_CHAR_FRAMES.filter((f) => frame >= f).length : 0;

  // --- Cursors ---
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const s1Cursor: React.CSSProperties["visibility"] =
    frame >= SCENE1_START && frame < FADE_START && cursorBlink ? "visible" : "hidden";
  const s2Cursor: React.CSSProperties["visibility"] =
    s2Started && cursorBlink ? "visible" : "hidden";

  const baseText: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontWeight: 500,
    color: TEXT_COLOR,
    lineHeight: 1.5,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
      {/* Scene 1 */}
      {frame < FADE_END && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 120 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            {/* Line 1 */}
            <div style={{ ...baseText, fontSize: 80 }}>
              {S1_LINE1.slice(0, s1L1Vis)}
              <span style={{ visibility: onS1L1 ? s1Cursor : "hidden" }}>|</span>
            </div>

            {/* Line 2 — appears after line 1 finishes */}
            {s1Chars > S1_LINE1.length && (
              <div style={{ ...baseText, fontSize: 80 }}>
                {S1_LINE2.slice(0, s1L2Vis)}
                <span style={{ visibility: !onS1L1 ? s1Cursor : "hidden" }}>|</span>
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* Fade overlay */}
      {frame >= FADE_START && frame < FADE_END && (
        <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: fadeOpacity }} />
      )}

      {/* Scene 2 */}
      {s2Started && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 120 }}>
          <div style={{ ...baseText, fontSize: 90 }}>
            {S2_TEXT.slice(0, s2Chars)}
            <span style={{ visibility: s2Cursor }}>|</span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
