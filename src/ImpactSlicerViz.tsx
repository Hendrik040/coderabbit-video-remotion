import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";

// CodeRabbit Brand Colors
const COLORS = {
  orange: "#FF570A",
  pink: "#F2B8EB",
  aquamarine: "#25BAB1",
  yellow: "#F0DF22",
  dark: "#171717",
  darkLight: "#1e1e1e",
  cream: "#F6F6F1",
  red: "#ff4444",
  green: "#44ff88",
};

// ============== SHARED COMPONENTS ==============

const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 0.1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        backgroundImage: `
          linear-gradient(${COLORS.orange}15 1px, transparent 1px),
          linear-gradient(90deg, ${COLORS.orange}15 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  );
};

const CodeBlock: React.FC<{
  code: string;
  highlightLines?: number[];
  highlightColor?: string;
  fontSize?: number;
}> = ({ code, highlightLines = [], highlightColor = COLORS.orange, fontSize = 18 }) => {
  const lines = code.split("\n");

  return (
    <div
      style={{
        backgroundColor: "#0d0d0d",
        borderRadius: 8,
        padding: "16px 20px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize,
        lineHeight: 1.6,
        border: `1px solid ${COLORS.orange}30`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            padding: "2px 8px",
            marginLeft: -8,
            marginRight: -8,
            backgroundColor: highlightLines.includes(i) ? `${highlightColor}25` : "transparent",
            borderLeft: highlightLines.includes(i) ? `3px solid ${highlightColor}` : "3px solid transparent",
          }}
        >
          <span style={{ color: COLORS.cream, opacity: 0.4, marginRight: 16, userSelect: "none" }}>
            {String(i + 1).padStart(2, " ")}
          </span>
          <span style={{ color: COLORS.cream }}>{line || " "}</span>
        </div>
      ))}
    </div>
  );
};

const StepTitle: React.FC<{ step: number; title: string; subtitle?: string }> = ({ step, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 80,
        opacity: titleOpacity,
        transform: `translateY(${(1 - titleY) * 30}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: COLORS.orange,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.dark,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {step}
        </div>
        <div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.cream,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 18,
                color: COLORS.aquamarine,
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PipelineBox: React.FC<{
  label: string;
  active?: boolean;
  delay?: number;
  x: number;
  y: number;
}> = ({ label, active = false, delay = 0, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const glowOpacity = active ? interpolate(Math.sin(frame * 0.15), [-1, 1], [0.3, 0.8]) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${Math.max(0, scale)})`,
        transformOrigin: "center",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          backgroundColor: active ? COLORS.orange : COLORS.darkLight,
          border: `2px solid ${active ? COLORS.orange : COLORS.orange}50`,
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          color: active ? COLORS.dark : COLORS.cream,
          fontFamily: "'Inter', sans-serif",
          whiteSpace: "nowrap",
          boxShadow: active ? `0 0 30px ${COLORS.orange}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")}` : "none",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; delay?: number }> = ({
  x1, y1, x2, y2, delay = 0
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const currentX2 = x1 + (x2 - x1) * progress;
  const currentY2 = y1 + (y2 - y1) * progress;

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.orange} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={currentX2}
        y2={currentY2}
        stroke={COLORS.orange}
        strokeWidth={2}
        markerEnd={progress > 0.9 ? "url(#arrowhead)" : undefined}
        opacity={0.7}
      />
    </svg>
  );
};

// ============== SCENE COMPONENTS ==============

// SCENE 1: The Problem
const Scene1_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftSlide = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 80 } });
  const rightSlide = spring({ frame: frame - 40, fps, config: { damping: 15, stiffness: 80 } });
  const warningScale = spring({ frame: frame - 180, fps, config: { damping: 10, stiffness: 150 } });

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 50,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <span style={{ fontSize: 42, fontWeight: 700, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          The Problem
        </span>
      </div>

      {/* Left Code Block - Calculator */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 160,
          width: 500,
          transform: `translateX(${(1 - leftSlide) * -100}px)`,
          opacity: leftSlide,
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 14, color: COLORS.aquamarine, fontFamily: "'JetBrains Mono', monospace" }}>
          calculator.py (CHANGED)
        </div>
        <CodeBlock
          code={`def calculate_discount(
    price,
    discount_percent,
    min_purchase      # ← NEW PARAM
):
    if price < min_purchase:
        return price
    return price * (1 - discount_percent/100)`}
          highlightLines={[3]}
          highlightColor={COLORS.orange}
          fontSize={16}
        />
      </div>

      {/* Right Code Block - Order */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 160,
          width: 520,
          transform: `translateX(${(1 - rightSlide) * 100}px)`,
          opacity: rightSlide,
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 14, color: COLORS.pink, fontFamily: "'JetBrains Mono', monospace" }}>
          order.py (NOT UPDATED)
        </div>
        <CodeBlock
          code={`def apply_discount(self, discount_percent):
    subtotal = self.get_subtotal()
    return calculate_discount(
        subtotal,
        discount_percent
        # ← MISSING min_purchase!
    )`}
          highlightLines={[5]}
          highlightColor={COLORS.red}
          fontSize={16}
        />
      </div>

      {/* Warning */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `scale(${warningScale})`,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.red}20`,
            border: `2px solid ${COLORS.red}`,
            borderRadius: 12,
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 32 }}>⚠️</span>
          <span style={{ fontSize: 24, color: COLORS.red, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            This would crash at runtime!
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 2: Pipeline Overview
const Scene2_Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const steps = [
    { label: "Git Diff", x: 80 },
    { label: "Parse Lines", x: 260 },
    { label: "Detect Signatures", x: 440 },
    { label: "Build Callgraph", x: 670 },
    { label: "Find Callers", x: 880 },
    { label: "Send to LLM", x: 1060 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <span style={{ fontSize: 42, fontWeight: 700, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          Smart Code Review with{" "}
          <span style={{ color: COLORS.orange }}>Impact Slicing</span>
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 22, color: COLORS.aquamarine, fontFamily: "'JetBrains Mono', monospace" }}>
          How we catch the bug automatically
        </span>
      </div>

      {/* Pipeline boxes */}
      {steps.map((step, i) => (
        <PipelineBox
          key={i}
          label={step.label}
          x={step.x}
          y={320}
          delay={40 + i * 15}
          active={false}
        />
      ))}

      {/* Arrows between boxes */}
      {steps.slice(0, -1).map((step, i) => (
        <Arrow
          key={i}
          x1={step.x + 100}
          y1={340}
          x2={steps[i + 1].x - 10}
          y2={340}
          delay={55 + i * 15}
        />
      ))}

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [180, 210], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 26, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          Let's walk through each step...
        </span>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 3: Parse the Diff
const Scene3_ParseDiff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const diffOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const extractOpacity = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp" });
  const resultScale = spring({ frame: frame - 180, fps, config: { damping: 12, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={1} title="Parse the Git Diff" subtitle="changed_lines()" />

      {/* Diff output */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 180,
          opacity: diffOpacity,
          width: 600,
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 14, color: COLORS.cream, opacity: 0.6 }}>
          Git diff output:
        </div>
        <CodeBlock
          code={`@@ -1,15 +1,18 @@
 def calculate_discount(
     price,
     discount_percent,
+    min_purchase
 ):
+    if price < min_purchase:
+        return price
     return price * (1 - ...)`}
          highlightLines={[4, 6, 7]}
          highlightColor={COLORS.green}
          fontSize={15}
        />
      </div>

      {/* Arrow */}
      <div
        style={{
          position: "absolute",
          left: 720,
          top: 340,
          opacity: extractOpacity,
          fontSize: 48,
          color: COLORS.orange,
        }}
      >
        →
      </div>

      {/* Extracted lines */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 220,
          opacity: extractOpacity,
          width: 450,
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 14, color: COLORS.cream, opacity: 0.6 }}>
          Extracted line numbers:
        </div>
        <div
          style={{
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.aquamarine}50`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: COLORS.aquamarine }}>
            calculator.py
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, color: COLORS.cream, marginTop: 12 }}>
            Lines: {"{"}4, 10, 11, 12, 13, 14, 15{"}"}
          </div>
        </div>
      </div>

      {/* Key insight */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `scale(${Math.max(0, resultScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.orange}15`,
            border: `2px solid ${COLORS.orange}50`,
            borderRadius: 12,
            padding: "16px 32px",
          }}
        >
          <span style={{ fontSize: 22, color: COLORS.orange, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            💡 Line 4 is the function signature — this is important!
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 4: Identify Modified Functions
const Scene4_IdentifyFunctions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const astOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const boxScale = spring({ frame: frame - 100, fps, config: { damping: 12, stiffness: 120 } });
  const overlapOpacity = interpolate(frame, [160, 190], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={2} title="Identify Modified Functions" subtitle="symbols_containing_lines()" />

      {/* AST Visualization */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 200,
          opacity: astOpacity,
        }}
      >
        <div style={{ fontSize: 16, color: COLORS.cream, opacity: 0.6, marginBottom: 16 }}>
          AST (Abstract Syntax Tree):
        </div>
        <svg width={400} height={300}>
          {/* Module node */}
          <rect x={150} y={20} width={100} height={40} rx={8} fill={COLORS.darkLight} stroke={COLORS.cream} strokeOpacity={0.3} />
          <text x={200} y={45} textAnchor="middle" fill={COLORS.cream} fontSize={14} fontFamily="Inter">Module</text>

          {/* Function node */}
          <line x1={200} y1={60} x2={200} y2={100} stroke={COLORS.cream} strokeOpacity={0.3} />
          <rect x={100} y={100} width={200} height={50} rx={8} fill={`${COLORS.orange}30`} stroke={COLORS.orange} strokeWidth={2} />
          <text x={200} y={130} textAnchor="middle" fill={COLORS.orange} fontSize={14} fontFamily="JetBrains Mono" fontWeight={600}>
            calculate_discount
          </text>

          {/* Line range */}
          <text x={200} y={180} textAnchor="middle" fill={COLORS.aquamarine} fontSize={16} fontFamily="JetBrains Mono">
            Lines 4 → 16
          </text>
        </svg>
      </div>

      {/* Changed lines box */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 220,
          transform: `scale(${Math.max(0, boxScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.aquamarine}`,
            borderRadius: 12,
            padding: 24,
            width: 350,
          }}
        >
          <div style={{ fontSize: 16, color: COLORS.aquamarine, marginBottom: 12 }}>Changed Lines:</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: COLORS.cream }}>
            {"{"}4, 10, 11, 12, 13, 14, 15{"}"}
          </div>
          <div style={{ marginTop: 20, fontSize: 16, color: COLORS.orange, marginBottom: 12 }}>Function Range:</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: COLORS.cream }}>
            4 → 16
          </div>
        </div>
      </div>

      {/* Result */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: overlapOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.green}15`,
            border: `2px solid ${COLORS.green}50`,
            borderRadius: 12,
            padding: "16px 32px",
          }}
        >
          <span style={{ fontSize: 22, color: COLORS.green, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            ✓ Changes fall within calculate_discount — it was modified
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 5: Detect Signature Changes (KEY)
const Scene5_SignatureChanges: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const pulseIntensity = interpolate(Math.sin(frame * 0.12), [-1, 1], [0.4, 1]);
  const starScale = spring({ frame: frame - 150, fps, config: { damping: 8, stiffness: 150 } });
  const insightOpacity = interpolate(frame, [220, 250], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={3} title="Detect Signature Changes" subtitle="symbols_with_signature_changes() ⭐" />

      {/* Key badge */}
      <div
        style={{
          position: "absolute",
          top: 70,
          right: 100,
          transform: `scale(${Math.max(0, starScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.orange,
            borderRadius: 20,
            padding: "8px 20px",
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.dark,
          }}
        >
          ⭐ KEY INSIGHT
        </div>
      </div>

      {/* Code with highlighted line 4 */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 200,
          opacity: codeOpacity,
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 16, color: COLORS.cream, opacity: 0.6 }}>
          The question: Was the <span style={{ color: COLORS.orange }}>def line</span> itself modified?
        </div>
        <div
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 8,
            padding: "16px 20px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 20,
            border: `2px solid ${COLORS.orange}`,
            boxShadow: `0 0 ${30 * pulseIntensity}px ${COLORS.orange}50`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: COLORS.orange, marginRight: 16, fontWeight: 700 }}>Line 4:</span>
            <span style={{ color: COLORS.pink }}>def </span>
            <span style={{ color: COLORS.aquamarine }}>calculate_discount</span>
            <span style={{ color: COLORS.cream }}>(price, percent, </span>
            <span style={{ color: COLORS.orange, fontWeight: 700 }}>min_purchase</span>
            <span style={{ color: COLORS.cream }}>):</span>
          </div>
        </div>
      </div>

      {/* Check visualization */}
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 200,
          opacity: interpolate(frame, [80, 110], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.aquamarine}50`,
            borderRadius: 12,
            padding: 24,
            width: 380,
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: COLORS.cream, marginBottom: 16 }}>
            <span style={{ color: COLORS.pink }}>if</span> node.lineno <span style={{ color: COLORS.pink }}>in</span> lines:
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: COLORS.aquamarine }}>
              Line 4
            </span>
            <span style={{ fontSize: 18, color: COLORS.cream }}>in</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: COLORS.aquamarine }}>
              {"{"}4, 10, 11...{"}"}
            </span>
          </div>
          <div style={{ fontSize: 28, color: COLORS.green, fontWeight: 700, textAlign: "center", marginTop: 16 }}>
            ✓ YES!
          </div>
        </div>
      </div>

      {/* Result box */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: "50%",
          transform: `translateX(-50%) scale(${interpolate(frame, [140, 170], [0, 1], { extrapolateRight: "clamp" })})`,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.orange}20`,
            border: `3px solid ${COLORS.orange}`,
            borderRadius: 16,
            padding: "20px 40px",
            boxShadow: `0 0 40px ${COLORS.orange}30`,
          }}
        >
          <div style={{ fontSize: 28, color: COLORS.orange, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
            SIGNATURE CHANGED: calculate_discount
          </div>
        </div>
      </div>

      {/* Bottom insight */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          opacity: insightOpacity,
        }}
      >
        <span style={{ fontSize: 20, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          Body changes don't affect callers. <span style={{ color: COLORS.orange, fontWeight: 600 }}>Signature changes DO.</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 6: Build Callgraph
const Scene6_Callgraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const node1Scale = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 120 } });
  const node2Scale = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 120 } });
  const node3Scale = spring({ frame: frame - 90, fps, config: { damping: 12, stiffness: 120 } });
  const edgeOpacity = interpolate(frame, [120, 160], [0, 1], { extrapolateRight: "clamp" });
  const highlightOpacity = interpolate(frame, [200, 230], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={4} title="Build the Callgraph" subtitle="callgraph_for_files()" />

      {/* Graph visualization */}
      <div style={{ position: "absolute", top: 180, left: 0, width: "100%", height: 500 }}>
        <svg width="100%" height="100%">
          {/* Edges */}
          <g opacity={edgeOpacity}>
            {/* order.py -> calculator.py */}
            <line x1={700} y1={220} x2={450} y2={300} stroke={COLORS.orange} strokeWidth={3} strokeDasharray="none" />
            <polygon points="460,295 450,300 455,290" fill={COLORS.orange} />

            {/* test.py -> calculator.py */}
            <line x1={900} y1={380} x2={500} y2={330} stroke={COLORS.cream} strokeWidth={2} strokeOpacity={0.3} />
          </g>

          {/* Highlight the important edge */}
          {highlightOpacity > 0 && (
            <line
              x1={700}
              y1={220}
              x2={450}
              y2={300}
              stroke={COLORS.orange}
              strokeWidth={6}
              opacity={highlightOpacity * 0.5}
              filter="blur(4px)"
            />
          )}
        </svg>

        {/* calculator.py node */}
        <div
          style={{
            position: "absolute",
            left: 300,
            top: 260,
            transform: `scale(${Math.max(0, node1Scale)})`,
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.darkLight,
              border: `3px solid ${COLORS.orange}`,
              borderRadius: 12,
              padding: "16px 24px",
              boxShadow: `0 0 20px ${COLORS.orange}30`,
            }}
          >
            <div style={{ fontSize: 16, color: COLORS.orange, fontWeight: 600, marginBottom: 8 }}>calculator.py</div>
            <div style={{ fontSize: 14, color: COLORS.aquamarine, fontFamily: "'JetBrains Mono', monospace" }}>
              • calculate_discount<br/>
              • calculate_tax
            </div>
          </div>
        </div>

        {/* order.py node */}
        <div
          style={{
            position: "absolute",
            left: 650,
            top: 140,
            transform: `scale(${Math.max(0, node2Scale)})`,
          }}
        >
          <div
            style={{
              backgroundColor: highlightOpacity > 0 ? `${COLORS.orange}20` : COLORS.darkLight,
              border: `2px solid ${highlightOpacity > 0 ? COLORS.orange : COLORS.cream}50`,
              borderRadius: 12,
              padding: "16px 24px",
              transition: "all 0.3s",
            }}
          >
            <div style={{ fontSize: 16, color: COLORS.cream, fontWeight: 600, marginBottom: 8 }}>order.py</div>
            <div style={{ fontSize: 14, color: COLORS.pink, fontFamily: "'JetBrains Mono', monospace" }}>
              calls: <span style={{ color: COLORS.orange }}>calculate_discount</span>
            </div>
          </div>
        </div>

        {/* test.py node */}
        <div
          style={{
            position: "absolute",
            left: 850,
            top: 340,
            transform: `scale(${Math.max(0, node3Scale)})`,
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.darkLight,
              border: `2px solid ${COLORS.cream}30`,
              borderRadius: 12,
              padding: "16px 24px",
              opacity: 0.6,
            }}
          >
            <div style={{ fontSize: 16, color: COLORS.cream, fontWeight: 600, marginBottom: 8 }}>test_calc.py</div>
            <div style={{ fontSize: 14, color: COLORS.cream, fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }}>
              calls: calculate_discount
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          width: "100%",
          textAlign: "center",
          opacity: highlightOpacity,
        }}
      >
        <span style={{ fontSize: 24, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          Now we can answer: <span style={{ color: COLORS.orange, fontWeight: 600 }}>Who calls calculate_discount?</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 7: Find Callers
const Scene7_FindCallers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const searchPulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [50, 150]);
  const searchOpacity = interpolate(frame, [30, 60, 120, 150], [0, 0.5, 0.5, 0], { extrapolateRight: "clamp" });
  const resultScale = spring({ frame: frame - 160, fps, config: { damping: 10, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={5} title="Find Impacted Callers" subtitle="one_hop_slice()" />

      {/* Search animation */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: searchOpacity,
        }}
      >
        <div
          style={{
            width: searchPulse * 2,
            height: searchPulse * 2,
            borderRadius: "50%",
            border: `3px solid ${COLORS.orange}`,
            opacity: 0.5,
          }}
        />
      </div>

      {/* Query */}
      <div
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.aquamarine}50`,
            borderRadius: 12,
            padding: "16px 32px",
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: COLORS.aquamarine }}>
            Query: Who calls <span style={{ color: COLORS.orange }}>calculate_discount</span>?
          </span>
        </div>
      </div>

      {/* Result */}
      <div
        style={{
          position: "absolute",
          top: 380,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `scale(${Math.max(0, resultScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.orange}15`,
            border: `3px solid ${COLORS.orange}`,
            borderRadius: 16,
            padding: "24px 48px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, color: COLORS.cream, marginBottom: 12, opacity: 0.7 }}>
            IMPACT FILES:
          </div>
          <div style={{ fontSize: 36, color: COLORS.orange, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            [order.py]
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [220, 250], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 22, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          We found a caller! Now let's locate the exact call site...
        </span>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 8: Locate the Bug
const Scene8_LocateBug: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const highlightOpacity = interpolate(frame, [100, 130], [0, 1], { extrapolateRight: "clamp" });
  const bugScale = spring({ frame: frame - 180, fps, config: { damping: 8, stiffness: 150 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={6} title="Locate the Call Site" subtitle="Walking the AST of order.py" />

      {/* Code block */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 200,
          transform: "translateX(-50%)",
          opacity: codeOpacity,
          width: 700,
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 16, color: COLORS.pink, fontFamily: "'JetBrains Mono', monospace" }}>
          order.py — Line 44
        </div>
        <div
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 12,
            padding: "24px 28px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            lineHeight: 1.8,
            border: `2px solid ${COLORS.pink}50`,
          }}
        >
          <div style={{ color: COLORS.cream, opacity: 0.5 }}>
            <span style={{ color: COLORS.orange, opacity: 0.4, marginRight: 16 }}>41</span>
            <span style={{ color: COLORS.pink }}>def </span>
            <span style={{ color: COLORS.aquamarine }}>apply_discount</span>
            (self, discount_percent):
          </div>
          <div style={{ color: COLORS.cream, opacity: 0.5 }}>
            <span style={{ color: COLORS.orange, opacity: 0.4, marginRight: 16 }}>42</span>
            {"    "}subtotal = self.get_subtotal()
          </div>
          <div
            style={{
              color: COLORS.cream,
              backgroundColor: highlightOpacity > 0 ? `${COLORS.red}20` : "transparent",
              marginLeft: -28,
              marginRight: -28,
              paddingLeft: 28,
              paddingRight: 28,
              borderLeft: highlightOpacity > 0 ? `4px solid ${COLORS.red}` : "4px solid transparent",
            }}
          >
            <span style={{ color: COLORS.orange, opacity: 0.4, marginRight: 16 }}>43</span>
            {"    "}
            <span style={{ color: COLORS.pink }}>return </span>
            <span style={{ color: COLORS.aquamarine }}>calculate_discount</span>
            (subtotal, discount_percent)
          </div>
          <div style={{ color: COLORS.cream, opacity: 0.3 }}>
            <span style={{ color: COLORS.orange, opacity: 0.4, marginRight: 16 }}>44</span>
          </div>
        </div>
      </div>

      {/* Bug annotation */}
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 380,
          transform: `scale(${Math.max(0, bugScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.red}20`,
            border: `2px solid ${COLORS.red}`,
            borderRadius: 12,
            padding: "16px 24px",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🐛</div>
          <div style={{ fontSize: 18, color: COLORS.red, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            Missing min_purchase!
          </div>
        </div>
      </div>

      {/* Arrow pointing to the issue */}
      {highlightOpacity > 0 && (
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
          <line
            x1={1050}
            y1={420}
            x2={900}
            y2={380}
            stroke={COLORS.red}
            strokeWidth={2}
            opacity={highlightOpacity}
          />
        </svg>
      )}
    </AbsoluteFill>
  );
};

// SCENE 9: Package for LLM
const Scene9_PackageForLLM: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const box1X = spring({ frame: frame - 30, fps, config: { damping: 15, stiffness: 80 } });
  const box2X = spring({ frame: frame - 60, fps, config: { damping: 15, stiffness: 80 } });
  const mismatchOpacity = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={7} title="Package for the LLM" subtitle="format_context_as_markdown()" />

      {/* NEW signature box */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 220,
          transform: `translateX(${(1 - box1X) * -200}px)`,
          opacity: box1X,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.green}`,
            borderRadius: 12,
            padding: 24,
            width: 480,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.green, marginBottom: 12, fontWeight: 600 }}>
            NEW SIGNATURE (from diff):
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: COLORS.cream }}>
            calculate_discount(<br/>
            {"    "}price,<br/>
            {"    "}discount_percent,<br/>
            {"    "}<span style={{ color: COLORS.orange, fontWeight: 700 }}>min_purchase</span><br/>
            )
          </div>
        </div>
      </div>

      {/* OLD call box */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 220,
          transform: `translateX(${(1 - box2X) * 200}px)`,
          opacity: box2X,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.darkLight,
            border: `2px solid ${COLORS.red}`,
            borderRadius: 12,
            padding: 24,
            width: 480,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.red, marginBottom: 12, fontWeight: 600 }}>
            OLD CALL (from order.py):
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: COLORS.cream }}>
            calculate_discount(<br/>
            {"    "}subtotal,<br/>
            {"    "}discount_percent<br/>
            {"    "}<span style={{ color: COLORS.red, fontWeight: 700 }}>← MISSING!</span><br/>
            )
          </div>
        </div>
      </div>

      {/* Mismatch indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: mismatchOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: `${COLORS.orange}20`,
            border: `3px solid ${COLORS.orange}`,
            borderRadius: 16,
            padding: "20px 40px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 36 }}>🐛</span>
          <span style={{ fontSize: 26, color: COLORS.orange, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
            CONTRACT MISMATCH DETECTED
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 10: Efficiency Comparison
const Scene10_Efficiency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const row1Opacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const row2Opacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const row3Opacity = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });
  const highlightOpacity = interpolate(frame, [140, 170], [0, 1], { extrapolateRight: "clamp" });

  const rows = [
    { approach: "Diff Only", tokens: "~200", finds: false, opacity: row1Opacity },
    { approach: "All Code", tokens: "~19,000", finds: true, opacity: row2Opacity },
    { approach: "Smart Slice", tokens: "~1,200", finds: true, opacity: row3Opacity, highlight: true },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />
      <StepTitle step={8} title="The Result: Efficiency" subtitle="94% fewer tokens" />

      {/* Table */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: "0 8px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <thead>
            <tr style={{ fontSize: 18, color: COLORS.cream, opacity: 0.6 }}>
              <th style={{ padding: "12px 40px", textAlign: "left" }}>Approach</th>
              <th style={{ padding: "12px 40px", textAlign: "center" }}>Tokens</th>
              <th style={{ padding: "12px 40px", textAlign: "center" }}>Finds Bug?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  opacity: row.opacity,
                  backgroundColor: row.highlight && highlightOpacity > 0 ? `${COLORS.orange}20` : COLORS.darkLight,
                  border: row.highlight && highlightOpacity > 0 ? `2px solid ${COLORS.orange}` : "none",
                }}
              >
                <td
                  style={{
                    padding: "16px 40px",
                    borderRadius: "8px 0 0 8px",
                    fontSize: 20,
                    color: row.highlight ? COLORS.orange : COLORS.cream,
                    fontWeight: row.highlight ? 700 : 400,
                  }}
                >
                  {row.approach}
                </td>
                <td
                  style={{
                    padding: "16px 40px",
                    textAlign: "center",
                    fontSize: 20,
                    color: COLORS.aquamarine,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.tokens}
                </td>
                <td
                  style={{
                    padding: "16px 40px",
                    borderRadius: "0 8px 8px 0",
                    textAlign: "center",
                    fontSize: 24,
                  }}
                >
                  {row.finds ? (
                    <span style={{ color: COLORS.green }}>✓</span>
                  ) : (
                    <span style={{ color: COLORS.red }}>✗</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom insight */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          textAlign: "center",
          opacity: highlightOpacity,
        }}
      >
        <span style={{ fontSize: 24, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          Send only the relevant code — <span style={{ color: COLORS.orange, fontWeight: 600 }}>accurate AND efficient</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 11: Key Takeaway
const Scene11_Takeaway: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { label: "Signature Change", delay: 30 },
    { label: "Find Callers", delay: 60 },
    { label: "Show Both to LLM", delay: 90 },
    { label: "Bug Caught! 🐛", delay: 120 },
  ];

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <GridBackground />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 100,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <span style={{ fontSize: 42, fontWeight: 700, color: COLORS.cream, fontFamily: "'Inter', sans-serif" }}>
          The Key Insight
        </span>
      </div>

      {/* Flow */}
      <div
        style={{
          position: "absolute",
          top: 280,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        {steps.map((step, i) => {
          const scale = spring({
            frame: frame - step.delay,
            fps,
            config: { damping: 10, stiffness: 150 },
          });

          const isLast = i === steps.length - 1;

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  transform: `scale(${Math.max(0, scale)})`,
                  backgroundColor: isLast ? COLORS.orange : COLORS.darkLight,
                  border: `2px solid ${isLast ? COLORS.orange : COLORS.orange}50`,
                  borderRadius: 12,
                  padding: "16px 24px",
                  fontSize: 18,
                  fontWeight: 600,
                  color: isLast ? COLORS.dark : COLORS.cream,
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: isLast ? `0 0 30px ${COLORS.orange}50` : "none",
                }}
              >
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <span
                  style={{
                    fontSize: 32,
                    color: COLORS.orange,
                    opacity: interpolate(frame - step.delay - 15, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                >
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom message */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [180, 210], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: `${COLORS.orange}15`,
            border: `2px solid ${COLORS.orange}50`,
            borderRadius: 12,
            padding: "20px 40px",
          }}
        >
          <span style={{ fontSize: 26, color: COLORS.orange, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            Impact Slicing: Accurate AND Efficient
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============== MAIN COMPOSITION ==============

export const ImpactSlicerViz: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      {/* Scene 1: The Problem - 0:00 to 0:10 (300 frames) */}
      <Sequence from={0} durationInFrames={300}>
        <Scene1_Problem />
      </Sequence>

      {/* Scene 2: Pipeline Overview - 0:10 to 0:18 (240 frames) */}
      <Sequence from={300} durationInFrames={240}>
        <Scene2_Pipeline />
      </Sequence>

      {/* Scene 3: Parse Diff - 0:18 to 0:28 (300 frames) */}
      <Sequence from={540} durationInFrames={300}>
        <Scene3_ParseDiff />
      </Sequence>

      {/* Scene 4: Identify Functions - 0:28 to 0:38 (300 frames) */}
      <Sequence from={840} durationInFrames={300}>
        <Scene4_IdentifyFunctions />
      </Sequence>

      {/* Scene 5: Signature Changes - 0:38 to 0:52 (420 frames) */}
      <Sequence from={1140} durationInFrames={420}>
        <Scene5_SignatureChanges />
      </Sequence>

      {/* Scene 6: Build Callgraph - 0:52 to 1:02 (300 frames) */}
      <Sequence from={1560} durationInFrames={300}>
        <Scene6_Callgraph />
      </Sequence>

      {/* Scene 7: Find Callers - 1:02 to 1:12 (300 frames) */}
      <Sequence from={1860} durationInFrames={300}>
        <Scene7_FindCallers />
      </Sequence>

      {/* Scene 8: Locate Bug - 1:12 to 1:22 (300 frames) */}
      <Sequence from={2160} durationInFrames={300}>
        <Scene8_LocateBug />
      </Sequence>

      {/* Scene 9: Package for LLM - 1:22 to 1:28 (180 frames) */}
      <Sequence from={2460} durationInFrames={240}>
        <Scene9_PackageForLLM />
      </Sequence>

      {/* Scene 10: Efficiency - 1:28 to 1:34 (180 frames) */}
      <Sequence from={2700} durationInFrames={240}>
        <Scene10_Efficiency />
      </Sequence>

      {/* Scene 11: Takeaway - 1:34 to 1:40 (180 frames) */}
      <Sequence from={2940} durationInFrames={300}>
        <Scene11_Takeaway />
      </Sequence>
    </AbsoluteFill>
  );
};
