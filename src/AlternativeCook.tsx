import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

const LINE_1 = "Let your agents cook";
const TEXT_COLOR = "#FF570A";
const BG_COLOR = "#000000";
const FONT_SIZE = 90;
const START_FRAME = 18;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = START_FRAME;

  for (let i = 0; i < LINE_1.length; i++) {
    frames.push(currentFrame);
    const char = LINE_1[i];

    if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);
    } else {
      currentFrame += 4 + Math.floor(seededRandom(i * 31 + 17) * 4);
    }
  }

  return frames;
};

const CHAR_FRAMES = computeCharFrames();

export const AlternativeCook: React.FC = () => {
  const frame = useCurrentFrame();

  const charsVisible = CHAR_FRAMES.filter((f) => frame >= f).length;
  const displayText = LINE_1.slice(0, charsVisible);

  const typingStarted = frame >= START_FRAME;
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const cursorVisibility = typingStarted && cursorBlink ? "visible" : "hidden";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_COLOR,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE,
          fontWeight: 500,
          color: TEXT_COLOR,
          lineHeight: 1.4,
          position: "relative",
          whiteSpace: "nowrap",
        }}
      >
        {/* Phantom reserves full width so text never shifts while typing */}
        <span style={{ visibility: "hidden" }}>{LINE_1}</span>
        <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
          {displayText}
          <span style={{ visibility: cursorVisibility }}>|</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
