import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// CodeRabbit Brand Colors
const COLORS = {
  orange: "#FF570A",
  pink: "#F2B8EB",
  aquamarine: "#25BAB1",
  dark: "#171717",
  darkLight: "#1e1e1e",
  cream: "#F6F6F1",
};

// Review system box component (simplified - no spoilers)
const ReviewBox: React.FC<{
  number: number;
  title: string;
  subtitle: string;
  tokens: string;
  delay: number;
  y: number;
}> = ({ number, title, subtitle, tokens, delay, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: y,
        transform: `translateX(-50%) scale(${Math.max(0, scale)})`,
        opacity,
        width: 850,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.dark,
          border: `3px solid ${COLORS.cream}30`,
          borderRadius: 20,
          padding: "28px 36px",
          display: "flex",
          alignItems: "center",
          gap: 28,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Number badge */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.cream}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.cream,
            fontFamily: "'Inter', sans-serif",
            flexShrink: 0,
          }}
        >
          {number}
        </div>

        {/* Title and subtitle */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.cream,
              fontFamily: "'Inter', sans-serif",
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 16,
              color: COLORS.aquamarine,
              fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.8,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Tokens */}
        <div
          style={{
            textAlign: "center",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: COLORS.cream,
              opacity: 0.5,
              marginBottom: 4,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            TOKENS
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: COLORS.pink,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {tokens}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export const ReviewSystemsCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage: `
            linear-gradient(${COLORS.orange}20 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.orange}20 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${(1 - titleY) * 20}px)`,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: COLORS.cream,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Code Review Approaches
        </div>
      </div>

      {/* Review System 1: Diff Only */}
      <ReviewBox
        number={1}
        title="Diff Only"
        subtitle="Send just the git diff to the LLM"
        tokens="~200"
        delay={40}
        y={200}
      />

      {/* Review System 2: Full Codebase/Context */}
      <ReviewBox
        number={2}
        title="Full Codebase / Context"
        subtitle="Send all files to the LLM"
        tokens="~19,000"
        delay={90}
        y={420}
      />

      {/* Review System 3: Smart Slice */}
      <ReviewBox
        number={3}
        title="Smart Impact Slice"
        subtitle="Send diff + affected callers only"
        tokens="~1,200"
        delay={140}
        y={640}
      />
    </AbsoluteFill>
  );
};
