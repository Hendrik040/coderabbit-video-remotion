import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

const SCENE1_TEXT = "Did this ever happen to you?";
const SCENE2_LINE1 = "Introducing";
const SCENE2_LINE2 = "CodeRabbit Usage-based Add-on";
const SCENE2_ALL = SCENE2_LINE1 + SCENE2_LINE2;

const TEXT_COLOR = "#FF570A";
const BG_COLOR = "#000000";
const FONT_SIZE = 90;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

// --- Scene 1 timing ---
const SCENE1_START = 18;

const computeScene1Frames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = SCENE1_START;
  for (let i = 0; i < SCENE1_TEXT.length; i++) {
    frames.push(currentFrame);
    const char = SCENE1_TEXT[i];
    if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);
    } else if (char === "?") {
      currentFrame += 10 + Math.floor(seededRandom(i * 7 + 5) * 4);
    } else {
      currentFrame += 4 + Math.floor(seededRandom(i * 31 + 17) * 4);
    }
  }
  return frames;
};

const SCENE1_CHAR_FRAMES = computeScene1Frames();
const SCENE1_LAST_CHAR_FRAME =
  SCENE1_CHAR_FRAMES[SCENE1_CHAR_FRAMES.length - 1];

const HOLD_AFTER_SCENE1 = 30;
const FADE_DURATION = 20;
const FADE_START = SCENE1_LAST_CHAR_FRAME + HOLD_AFTER_SCENE1;
const FADE_END = FADE_START + FADE_DURATION;
const SCENE2_START = FADE_END + 20;

// --- Scene 2 timing ---
const computeScene2Frames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = SCENE2_START;
  for (let i = 0; i < SCENE2_ALL.length; i++) {
    frames.push(currentFrame);
    const char = SCENE2_ALL[i];
    if (i === SCENE2_LINE1.length - 1) {
      // Pause after finishing "Introducing" before line 2
      currentFrame += 22;
    } else if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom((i + 100) * 17 + 3) * 2);
    } else {
      currentFrame += 4 + Math.floor(seededRandom((i + 100) * 31 + 17) * 4);
    }
  }
  return frames;
};

const SCENE2_CHAR_FRAMES = computeScene2Frames();
const SCENE2_LAST_CHAR_FRAME =
  SCENE2_CHAR_FRAMES[SCENE2_CHAR_FRAMES.length - 1];

export const DID_THIS_TOTAL_FRAMES = SCENE2_LAST_CHAR_FRAME + 45;

export const DidThisEverHappenToYou: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene 1 state
  const scene1CharsVisible = SCENE1_CHAR_FRAMES.filter(
    (f) => frame >= f
  ).length;
  const scene1DisplayText = SCENE1_TEXT.slice(0, scene1CharsVisible);

  // Fade overlay opacity (0 → 1 over FADE_START..FADE_END)
  const fadeOpacity = interpolate(frame, [FADE_START, FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scene 2 state
  const scene2Started = frame >= SCENE2_START;
  const scene2CharsVisible = scene2Started
    ? SCENE2_CHAR_FRAMES.filter((f) => frame >= f).length
    : 0;
  const scene2Line1Visible = Math.min(scene2CharsVisible, SCENE2_LINE1.length);
  const scene2Line2Visible = Math.max(
    0,
    scene2CharsVisible - SCENE2_LINE1.length
  );
  const scene2DisplayLine1 = SCENE2_LINE1.slice(0, scene2Line1Visible);
  const scene2DisplayLine2 = SCENE2_LINE2.slice(0, scene2Line2Visible);
  const onScene2Line1 = scene2CharsVisible <= SCENE2_LINE1.length;

  // Cursors — visibility-based blink, never conditional render
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const scene1CursorVisibility =
    frame >= SCENE1_START && frame < FADE_START && cursorBlink
      ? "visible"
      : "hidden";
  const scene2CursorVisibility =
    scene2Started && cursorBlink ? "visible" : "hidden";

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    fontWeight: 500,
    color: TEXT_COLOR,
    lineHeight: 1.4,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
      {/* Scene 1 — hidden once fade completes */}
      {frame < FADE_END && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "flex-start",
            paddingLeft: 120,
          }}
        >
          <div style={textStyle}>
            {scene1DisplayText}
            <span style={{ visibility: scene1CursorVisibility }}>|</span>
          </div>
        </AbsoluteFill>
      )}

      {/* Black fade overlay */}
      {frame >= FADE_START && frame < FADE_END && (
        <AbsoluteFill
          style={{ backgroundColor: BG_COLOR, opacity: fadeOpacity }}
        />
      )}

      {/* Scene 2 */}
      {scene2Started && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              ...textStyle,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div>
              {scene2DisplayLine1}
              <span
                style={{
                  visibility:
                    onScene2Line1 ? scene2CursorVisibility : "hidden",
                }}
              >
                |
              </span>
            </div>
            {scene2CharsVisible > SCENE2_LINE1.length && (
              <div>
                {scene2DisplayLine2}
                <span
                  style={{
                    visibility:
                      !onScene2Line1 ? scene2CursorVisibility : "hidden",
                  }}
                >
                  |
                </span>
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
