import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["700"] });

const BG_COLOR = "#F6F6F1";
const TEXT_COLOR = "#171717";
const FONT_SIZE = 110;
const START_FRAME = 18;

// Scene 1 text
const S1_TEXT = "Be a Super Developer";
// Scene 3 text
const S3_TEXT = "CodeRabbit";

// ─── Seeded random (deterministic jitter) ───────────────────────────────────
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

// ─── Char frame computation ──────────────────────────────────────────────────
const computeCharFrames = (
  text: string,
  start: number,
  seedOffset = 0
): number[] => {
  const frames: number[] = [];
  let f = start;
  for (let i = 0; i < text.length; i++) {
    frames.push(f);
    const c = text[i];
    if (c === " ")
      f += 3 + Math.floor(seededRandom((i + seedOffset) * 17 + 3) * 2);
    else f += 4 + Math.floor(seededRandom((i + seedOffset) * 31 + 17) * 4);
  }
  return frames;
};

// ─── Scene 1 timing ─────────────────────────────────────────────────────────
const S1_CHAR_FRAMES = computeCharFrames(S1_TEXT, START_FRAME);
const S1_LAST_FRAME = S1_CHAR_FRAMES[S1_CHAR_FRAMES.length - 1];

// Hold after scene 1 finishes, then begin reverse
const HOLD_AFTER_S1 = 30;
const REVERSE_START = S1_LAST_FRAME + HOLD_AFTER_S1;

// Reverse takes exactly as long as forward, plus one extra frame to reach 0 chars
const FORWARD_DURATION = S1_LAST_FRAME - START_FRAME;
const REVERSE_END = REVERSE_START + FORWARD_DURATION + 1;

// ─── Scene 3 timing ─────────────────────────────────────────────────────────
const HOLD_AFTER_REVERSE = 20;
const S3_START = REVERSE_END + HOLD_AFTER_REVERSE;
const S3_CHAR_FRAMES = computeCharFrames(S3_TEXT, S3_START, 100);
const S3_LAST_FRAME = S3_CHAR_FRAMES[S3_CHAR_FRAMES.length - 1];

export const SUPER_DEVELOPER_TOTAL_FRAMES = S3_LAST_FRAME + 60;

// ─── CodeRabbit logo SVG ─────────────────────────────────────────────────────
const RabbitLogo: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 1201 1200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M600.867 1200C932.238 1200 1200.87 931.37 1200.87 600C1200.87 268.629 932.238 -0.000488281 600.867 -0.000488281C269.496 -0.000488281 0.867188 268.629 0.867188 600C0.867188 931.37 269.496 1200 600.867 1200Z"
      fill="#FF570A"
    />
    <path
      d="M1008.3 500.615C1008.3 500.615 924.706 393.751 819.62 387.639C751.807 383.636 735.379 392.696 732.434 399.444C728.226 364.456 698.322 202.361 491.729 168.008C518.102 357.589 627.02 308.191 691.161 438.86C691.161 438.86 582.921 291.734 404.969 345.903C404.969 345.903 469.83 482.07 661.676 509.891C661.676 509.891 677.05 562.586 681.684 571.862C681.684 571.862 386.224 417.779 296.512 713.505C229.747 698.382 207.352 770.859 284.09 820.369C284.09 820.369 297.147 768.519 328.943 753.131C328.943 753.131 260.711 829.226 340.946 920.36H628.925C635.883 908.834 666.68 848.19 590.514 802.285C644.278 801.516 688.042 902.932 735.128 921.058H803.61C805.927 915.428 810.771 898.567 799.395 883.395C781.857 863.278 743.46 866.002 743.802 828.8C757.062 655.746 1016.55 708.888 1008.3 500.615Z"
      fill="#FEFEFE"
    />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const SuperDeveloper: React.FC = () => {
  const frame = useCurrentFrame();

  const inReverse = frame >= REVERSE_START && frame < REVERSE_END;
  const inScene3 = frame >= S3_START;
  // Scene 1 includes both the typing phase and the hold before reverse
  const inScene1OrHold = !inReverse && !inScene3;

  // ── S1 visible character count ───────────────────────────────────────────
  let s1Visible = 0;
  if (inScene1OrHold) {
    s1Visible = S1_CHAR_FRAMES.filter((cf) => frame >= cf).length;
  } else if (inReverse) {
    // Reverse: effective "forward frame" walks backwards from S1_LAST_FRAME
    const reverseProgress = frame - REVERSE_START;
    const effectiveFrame = S1_LAST_FRAME - reverseProgress;
    s1Visible = S1_CHAR_FRAMES.filter((cf) => cf <= effectiveFrame).length;
  }

  // ── S3 visible character count ───────────────────────────────────────────
  const s3Visible = inScene3
    ? S3_CHAR_FRAMES.filter((cf) => frame >= cf).length
    : 0;

  // ── Cursor blink ─────────────────────────────────────────────────────────
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const showS1Cursor =
    frame >= START_FRAME && (inScene1OrHold || inReverse) && cursorBlink;
  const showS3Cursor = inScene3 && cursorBlink;

  const displayText = inScene3
    ? S3_TEXT.slice(0, s3Visible)
    : S1_TEXT.slice(0, s1Visible);
  const showCursor = inScene3 ? showS3Cursor : showS1Cursor;

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
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 52,
        }}
      >
        {/* CodeRabbit logo mark */}
        <RabbitLogo size={130} />

        {/* Text area — phantom reserves the width of the longest string */}
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontWeight: 700,
            fontSize: FONT_SIZE,
            color: TEXT_COLOR,
            letterSpacing: -1,
            position: "relative",
            whiteSpace: "nowrap",
          }}
        >
          {/* Phantom span — keeps container width stable */}
          <span style={{ visibility: "hidden" }}>{S1_TEXT}</span>

          {/* Live text overlaid at the left edge */}
          <span style={{ position: "absolute", left: 0, top: 0 }}>
            {displayText}
            <span
              style={{ visibility: showCursor ? "visible" : "hidden" }}
            >
              _
            </span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
