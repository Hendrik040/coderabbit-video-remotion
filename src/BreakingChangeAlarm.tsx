import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const C = {
  bg:     "#060000",
  red:    "#FF2828",
  orange: "#FF570A",
  green:  "#25E2A8",
  cream:  "#F2F1EB",
  mid:    "#888888",
};

function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ─── Corner bracket ───
const CornerBracket: React.FC<{
  corner: "tl" | "tr" | "bl" | "br";
  opacity: number;
}> = ({ corner, opacity }) => {
  const size = 38;
  const pos = {
    tl: { top: 36, left: 36 },
    tr: { top: 36, right: 36 },
    bl: { bottom: 36, left: 36 },
    br: { bottom: 36, right: 36 },
  }[corner];
  const borders = {
    tl: { borderTop: `2px solid ${C.red}`, borderLeft:  `2px solid ${C.red}` },
    tr: { borderTop: `2px solid ${C.red}`, borderRight: `2px solid ${C.red}` },
    bl: { borderBottom: `2px solid ${C.red}`, borderLeft:  `2px solid ${C.red}` },
    br: { borderBottom: `2px solid ${C.red}`, borderRight: `2px solid ${C.red}` },
  }[corner];

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        opacity,
        ...pos,
        ...borders,
      }}
    />
  );
};

// ─── Warning triangle ───
const WarningTriangle: React.FC<{ scale: number; pulse: number }> = ({ scale, pulse }) => (
  <div style={{ transform: `scale(${scale})` }}>
    <svg width="130" height="118" viewBox="0 0 130 118">
      <defs>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer glow layer */}
      <path
        d="M65 8 L122 108 L8 108 Z"
        fill="none"
        stroke={C.red}
        strokeWidth={3 + pulse * 4}
        strokeLinejoin="round"
        opacity={0.25 + pulse * 0.2}
      />
      {/* Main triangle */}
      <path
        d="M65 8 L122 108 L8 108 Z"
        fill={`${C.red}22`}
        stroke={C.red}
        strokeWidth="3"
        strokeLinejoin="round"
        filter="url(#glow-red)"
      />
      {/* ! */}
      <rect x="61" y="38" width="8" height="36" rx="4" fill={C.red} />
      <circle cx="65" cy="90" r="5" fill={C.red} />
    </svg>
  </div>
);

// ─── Code diff block ───
const DiffBlock: React.FC<{ opacity: number; frame: number }> = ({ opacity, frame }) => {
  // Strikethrough "query" animates in first, then "commitLog" appears
  const oldLineOp = fi(frame, 35, 10);
  const arrowOp   = fi(frame, 48, 10);
  const newLineOp = fi(frame, 55, 10);

  return (
    <div
      style={{
        opacity,
        backgroundColor: "#0E0000",
        border: `1px solid ${C.red}35`,
        borderRadius: 10,
        padding: "14px 22px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 20,
        width: 420,
      }}
    >
      {/* Removed line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: oldLineOp,
          marginBottom: 6,
        }}
      >
        <span style={{ color: C.red, opacity: 0.6, fontSize: 16, width: 14 }}>−</span>
        <span style={{ color: C.red, textDecoration: "line-through", textDecorationColor: `${C.red}90`, opacity: 0.8 }}>
          query
        </span>
        <span style={{ color: C.mid, fontSize: 14, opacity: 0.5 }}>: str</span>
      </div>

      {/* Arrow */}
      <div style={{ opacity: arrowOp, textAlign: "center", color: `${C.mid}60`, fontSize: 14, marginBottom: 6 }}>
        ↓
      </div>

      {/* Added line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: newLineOp,
        }}
      >
        <span style={{ color: C.green, opacity: 0.7, fontSize: 16, width: 14 }}>+</span>
        <span
          style={{
            color: C.green,
            fontWeight: 700,
            textShadow: `0 0 12px ${C.green}60`,
          }}
        >
          commitLog
        </span>
        <span style={{ color: C.mid, fontSize: 14, opacity: 0.5 }}>: str</span>
      </div>
    </div>
  );
};

// ─── Alert header bar ───
const AlertBar: React.FC<{ pulse: number; opacity: number }> = ({ pulse, opacity }) => {
  const frame = useCurrentFrame();
  // Alternates between "⚠  BREAKING CHANGE" and "⚠  ALERT" every ~20 frames
  const textAlt = Math.floor(frame / 22) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        backgroundColor: `${C.red}${Math.round((0.18 + pulse * 0.14) * 255).toString(16).padStart(2, "0")}`,
        borderBottom: `1px solid ${C.red}50`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        opacity,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: C.red,
          opacity: 0.6 + pulse * 0.4,
          boxShadow: `0 0 ${6 + pulse * 6}px ${C.red}`,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: C.red,
          letterSpacing: 2.5,
          opacity: 0.85,
        }}
      >
        {textAlt ? "⚠  BREAKING CHANGE" : "⚠  ALERT"}
      </span>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: C.red,
          opacity: 0.6 + pulse * 0.4,
          boxShadow: `0 0 ${6 + pulse * 6}px ${C.red}`,
        }}
      />
    </div>
  );
};

// ─── File path tag ───
const FilePathTag: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      opacity,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      backgroundColor: `${C.orange}12`,
      border: `1px solid ${C.orange}35`,
      borderRadius: 7,
      padding: "6px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: C.orange,
    }}
  >
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
      <path d="M1 1 L7.5 1 L11 4.5 L11 12 L1 12 Z" stroke={C.orange} strokeWidth="1.1" strokeLinejoin="round" opacity={0.7} />
      <path d="M7.5 1 L7.5 4.5 L11 4.5" stroke={C.orange} strokeWidth="1.1" strokeLinejoin="round" opacity={0.7} />
    </svg>
    backend-api / api / workflow.py
  </div>
);

// ─── Main composition ───
export const BreakingChangeAlarm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // White flash at the very start
  const flashOp = interpolate(frame, [0, 5, 10], [1, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Global fade in / out
  const fadeIn  = fi(frame, 6, 16);
  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow pulse for glow effects
  const slowPulse = Math.sin(frame * 0.18) * 0.5 + 0.5;
  // Fast strobe for border
  const fastPulse = Math.sin(frame * 0.38) * 0.5 + 0.5;

  // Entrance springs
  const { fps: _fps } = useVideoConfig();
  const iconScale = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 8, stiffness: 140 } });
  const headingScale = spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 11, stiffness: 110 } });

  // Individual element opacities
  const cornerOp  = fi(frame, 10, 12);
  const headingOp = fi(frame, 22, 14);
  const diffOp    = fi(frame, 32, 12);
  const pathOp    = fi(frame, 60, 12);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Pulsing radial red glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${C.red}${Math.round((0.08 + slowPulse * 0.1) * 255).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
        }}
      />

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0.13) 6px)",
          pointerEvents: "none",
        }}
      />

      {/* Pulsing red border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `2px solid ${C.red}`,
          opacity: (0.2 + fastPulse * 0.35) * fadeIn,
          pointerEvents: "none",
        }}
      />

      {/* Alert header bar */}
      <AlertBar pulse={slowPulse} opacity={fadeIn} />

      {/* Corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <CornerBracket key={c} corner={c} opacity={cornerOp * (0.5 + slowPulse * 0.5)} />
      ))}

      {/* Central content */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          {/* Warning triangle */}
          <WarningTriangle scale={Math.max(0, iconScale)} pulse={slowPulse} />

          {/* BREAKING CHANGE heading */}
          <div
            style={{
              opacity: headingOp,
              transform: `scale(${Math.max(0, headingScale)})`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: C.red,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 4,
                textShadow: `0 0 ${20 + slowPulse * 20}px ${C.red}80`,
                lineHeight: 1,
              }}
            >
              BREAKING CHANGE
            </div>
            <div
              style={{
                fontSize: 14,
                color: `${C.red}70`,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 3,
                marginTop: 8,
              }}
            >
              RENAMING INPUT FIELD
            </div>
          </div>

          {/* Diff block */}
          <DiffBlock opacity={diffOp} frame={frame} />

          {/* File path */}
          <FilePathTag opacity={pathOp} />
        </div>
      </AbsoluteFill>

      {/* White flash overlay at start */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "white",
          opacity: flashOp,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
