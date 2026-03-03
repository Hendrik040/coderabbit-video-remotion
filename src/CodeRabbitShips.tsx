import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

const LINE_1 = "knowing that CodeRabbit";
const LINE_2 = "reviews every line they ship.";
const ALL_CHARS = LINE_1 + LINE_2;

const TEXT_COLOR = "#FF570A";
const BG_COLOR = "#000000";
const FONT_SIZE = 80;
const START_FRAME = 18;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = START_FRAME;

  for (let i = 0; i < ALL_CHARS.length; i++) {
    frames.push(currentFrame);
    const char = ALL_CHARS[i];

    if (i === LINE_1.length - 1) {
      // Pause after line 1 before starting line 2
      currentFrame += 22;
    } else if (char === ".") {
      // Slight dramatic pause on the final period
      currentFrame += 14;
    } else if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);
    } else {
      currentFrame += 4 + Math.floor(seededRandom(i * 31 + 17) * 4);
    }
  }

  return frames;
};

const CHAR_FRAMES = computeCharFrames();

export const CodeRabbitShips: React.FC = () => {
  const frame = useCurrentFrame();

  const charsVisible = CHAR_FRAMES.filter((f) => frame >= f).length;

  const line1Visible = Math.min(charsVisible, LINE_1.length);
  const line2Visible = Math.max(0, charsVisible - LINE_1.length);

  const displayLine1 = LINE_1.slice(0, line1Visible);
  const displayLine2 = LINE_2.slice(0, line2Visible);

  const onLine1 = charsVisible <= LINE_1.length;
  const typingStarted = frame >= START_FRAME;
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const cursorVisibility = typingStarted && cursorBlink ? "visible" : "hidden";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_COLOR,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE,
          fontWeight: 500,
          color: TEXT_COLOR,
          lineHeight: 1.4,
        }}
      >
        {/* Line 1 */}
        <div>
          {displayLine1}
          <span style={{ visibility: onLine1 ? cursorVisibility : "hidden" }}>|</span>
        </div>

        {/* Line 2 */}
        {charsVisible > LINE_1.length && (
          <div>
            {displayLine2}
            <span style={{ visibility: !onLine1 ? cursorVisibility : "hidden" }}>|</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
