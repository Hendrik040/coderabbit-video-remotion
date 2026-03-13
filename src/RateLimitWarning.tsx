import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

const WARNING_CHAR = "⚠";
const REST_TEXT    = " Rate Limit Exceeded!";
const TEXT         = WARNING_CHAR + REST_TEXT;
const TEXT_COLOR   = "#F5C518"; // terminal warning yellow
const BG_COLOR     = "#000000";
const FONT_SIZE         = 80;
const WARNING_FONT_SIZE = 130; // ⚠ rendered larger than the rest

// 0.08s per character at 30fps = 2 frames per char (fixed, no jitter)
const FRAMES_PER_CHAR = Math.round(0.08 * 30); // = 2
const START_FRAME     = 12; // brief black screen before typing

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let f = START_FRAME;
  for (let i = 0; i < TEXT.length; i++) {
    frames.push(f);
    f += FRAMES_PER_CHAR;
  }
  return frames;
};

const CHAR_FRAMES  = computeCharFrames();
const LAST_CHAR_FRAME = CHAR_FRAMES[CHAR_FRAMES.length - 1];

export const RATE_LIMIT_TOTAL_FRAMES = LAST_CHAR_FRAME + 45; // ~1.5s hold at end

export const RateLimitWarning: React.FC = () => {
  const frame = useCurrentFrame();

  const charsVisible     = CHAR_FRAMES.filter((f) => frame >= f).length;
  const warningVisible   = charsVisible >= 1;
  const restText         = TEXT.slice(1, charsVisible); // everything after ⚠
  const typingStarted    = frame >= START_FRAME;
  const cursorBlink      = Math.floor(frame / 15) % 2 === 0;
  const cursorVisibility = typingStarted && cursorBlink ? "visible" : "hidden";

  const sharedStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontWeight: 500,
    color: TEXT_COLOR,
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_COLOR,
        justifyContent: "center",
        alignItems: "flex-start",
        paddingLeft: 120,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Warning sign — larger, nudged up to optically center with the text */}
        <span style={{ ...sharedStyle, fontSize: WARNING_FONT_SIZE, lineHeight: 1, transform: "translateY(-18px)", display: "inline-block", marginRight: 24 }}>
          {warningVisible ? WARNING_CHAR : ""}
        </span>

        {/* Rest of the message */}
        <span style={{ ...sharedStyle, fontSize: FONT_SIZE, lineHeight: 1 }}>
          {restText}
          <span style={{ visibility: cursorVisibility }}>_</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
