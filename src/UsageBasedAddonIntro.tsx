import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["600"] });

const LINE_1 = "Introducing";
const LINE_2 = "CodeRabbit Usage-based Add-on";
const ALL_CHARS = LINE_1 + LINE_2;

const TEXT_COLOR = "#CC6B1A";
const BG_COLOR = "#000000";
const FONT_SIZE = 90;
const START_FRAME = 18; // Brief black screen before typing

// Deterministic seeded random so frames render consistently
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

// Pre-compute the frame at which each character appears
const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = START_FRAME;

  for (let i = 0; i < ALL_CHARS.length; i++) {
    frames.push(currentFrame);
    const char = ALL_CHARS[i];

    if (i === LINE_1.length - 1) {
      // Pause after finishing line 1 before line 2 starts
      currentFrame += 22;
    } else if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);
    } else {
      currentFrame += 4 + Math.floor(seededRandom(i * 31 + 17) * 4);
    }
  }

  return frames;
};

const CHAR_FRAMES = computeCharFrames();

export const UsageBasedAddonIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const charsVisible = CHAR_FRAMES.filter((f) => frame >= f).length;

  const line1Visible = Math.min(charsVisible, LINE_1.length);
  const line2Visible = Math.max(0, charsVisible - LINE_1.length);

  const displayLine1 = LINE_1.slice(0, line1Visible);
  const displayLine2 = LINE_2.slice(0, line2Visible);

  const onLine1 = charsVisible <= LINE_1.length;
  const typingStarted = frame >= START_FRAME;

  // Cursor blinks every 15 frames; use visibility so layout never shifts
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
          fontWeight: 600,
          color: TEXT_COLOR,
          lineHeight: 1.4,
        }}
      >
        {/* Line 1 */}
        <div>
          {displayLine1}
          <span style={{ visibility: onLine1 ? cursorVisibility : "hidden" }}>|</span>
        </div>

        {/* Line 2 — appears once we've moved past line 1 */}
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
