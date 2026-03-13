import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const C = {
  orange: "#FF570A",
  teal: "#25BAB1",
  green: "#25E2A8",
  red: "#FF4848",
  purple: "#838BFF",
  dark: "#111111",
  card: "#1C1C1C",
  border: "#2D2D2D",
  cream: "#F2F1EB",
  dim: "#555555",
  mid: "#888888",
};

// ─── Helpers ───
function fi(frame: number, start: number, dur = 15) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function useSpring(frame: number, startAt: number, damping = 13, stiffness = 120) {
  const { fps } = useVideoConfig();
  return spring({ frame: Math.max(0, frame - startAt), fps, config: { damping, stiffness } });
}

// ─── Timing (frames @ 30 fps) ───
const T = {
  // build diagram
  mainLine:       0,
  featureCurve:   20,
  featureHoriz:   38,
  prArrow:        55,
  commits:        65,
  labels:         80,
  yamlOnFeature:  92,

  // phase 1 — config only on feature
  p1Label:        112,
  scanBeam1:      128,
  badResult:      162,

  // phase 2 — config merged to main
  p2Start:        240,
  configCommit:   250,
  yamlOnMain:     262,
  p2Label:        262,
  scanBeam2:      285,
  goodResult:     315,

  fadeOut:        370,
  duration:       400,
};

// ─── Git diagram geometry (1080 × 1080 canvas) ───
const MAIN_Y       = 410;
const FEAT_Y       = 555;
const MAIN_X0      = 55;
const MAIN_X1      = 990;
const BRANCH_X     = 180;
const FEAT_CURVE_X = BRANCH_X + 130;  // 310 — where curve meets horizontal
const FEAT_END_X   = 760;
const CONFIG_X     = 575;             // where config commit lands on main

// Commit x-positions
const MAIN_C   = [BRANCH_X, CONFIG_X, MAIN_X1 - 30]; // [180, 575, 960]
const FEAT_C   = [390, FEAT_END_X];                   // [390, 760]
const PR_TIP_X = MAIN_X1 - 30;                        // arrowhead lands here

// SVG path strings
const PATH_MAIN        = `M ${MAIN_X0} ${MAIN_Y} L ${MAIN_X1} ${MAIN_Y}`;
const PATH_FEAT_CURVE  = `M ${BRANCH_X} ${MAIN_Y} C ${BRANCH_X} ${MAIN_Y + 78} ${BRANCH_X + 80} ${FEAT_Y} ${FEAT_CURVE_X} ${FEAT_Y}`;
const PATH_FEAT_HORIZ  = `M ${FEAT_CURVE_X} ${FEAT_Y} L ${FEAT_END_X} ${FEAT_Y}`;
const PATH_PR          = `M ${FEAT_END_X} ${FEAT_Y} C ${FEAT_END_X} ${FEAT_Y - 68} ${PR_TIP_X - 60} ${MAIN_Y + 22} ${PR_TIP_X} ${MAIN_Y}`;

// Approximate path lengths for strokeDashoffset animation
const LEN_MAIN        = 935;
const LEN_FEAT_CURVE  = 190;
const LEN_FEAT_HORIZ  = 450;
const LEN_PR          = 240;

// ─── Animated SVG path (draw-on effect) ───
const AnimPath: React.FC<{
  d: string;
  length: number;
  startAt: number;
  endAt: number;
  stroke: string;
  strokeWidth?: number;
  dashed?: boolean;
  opacity?: number;
}> = ({ d, length, startAt, endAt, stroke, strokeWidth = 2.5, dashed = false, opacity = 0.85 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startAt, endAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "8 6" : `${length}`}
      strokeDashoffset={dashed ? undefined : length * (1 - progress)}
      fill="none"
      strokeLinecap="round"
      opacity={opacity * (dashed ? fi(frame, startAt, endAt - startAt) : 1)}
    />
  );
};

// ─── Commit dot ───
const CommitDot: React.FC<{
  cx: number; cy: number; appearAt: number;
  color?: string; size?: number; glow?: boolean;
}> = ({ cx, cy, appearAt, color = C.cream, size = 9, glow = false }) => {
  const frame = useCurrentFrame();
  const sc = useSpring(frame, appearAt, 9, 200);
  const op = fi(frame, appearAt, 10);
  return (
    <g opacity={op} transform={`translate(${cx}, ${cy}) scale(${Math.max(0, sc)})`}>
      {glow && <circle r={size + 7} fill={color} opacity={0.18} />}
      <circle r={size} fill={C.card} stroke={color} strokeWidth={2} />
    </g>
  );
};

// ─── PR arrowhead (small triangle at tip) ───
const PRArrowhead: React.FC<{ appearAt: number }> = ({ appearAt }) => {
  const frame = useCurrentFrame();
  const op = fi(frame, appearAt, 12);
  // tip is at (PR_TIP_X, MAIN_Y), coming from lower-left
  return (
    <polygon
      points={`${PR_TIP_X},${MAIN_Y} ${PR_TIP_X - 10},${MAIN_Y - 7} ${PR_TIP_X - 10},${MAIN_Y + 7}`}
      fill={C.purple}
      opacity={op}
    />
  );
};

// ─── Branch label ───
const BranchLabel: React.FC<{
  x: number; y: number; text: string; color: string; appearAt: number; alignRight?: boolean;
}> = ({ x, y, text, color, appearAt, alignRight = false }) => {
  const frame = useCurrentFrame();
  const op = fi(frame, appearAt, 14);
  const sc = useSpring(frame, appearAt, 14, 100);
  return (
    <g opacity={op} transform={`translate(${x}, ${y}) scale(${Math.max(0, sc)})`}>
      <rect
        x={alignRight ? -text.length * 7.2 - 14 : -6}
        y={-14}
        width={text.length * 7.2 + 20}
        height={26}
        rx={6}
        fill={color}
        opacity={0.18}
      />
      <text
        x={alignRight ? -text.length * 3.6 : text.length * 3.6}
        y={4}
        textAnchor="middle"
        fill={color}
        fontSize={13}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={600}
      >
        {text}
      </text>
    </g>
  );
};

// ─── YAML file icon ───
const YamlIcon: React.FC<{
  x: number; y: number; appearAt: number;
  isMain?: boolean;
}> = ({ x, y, appearAt, isMain = false }) => {
  const frame = useCurrentFrame();
  const sc = useSpring(frame, appearAt, 9, 160);
  const op = fi(frame, appearAt, 12);
  const accent = isMain ? C.green : C.orange;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 54,
        top: y - 28,
        width: 108,
        opacity: op,
        transform: `scale(${Math.max(0, sc)})`,
        transformOrigin: "center bottom",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: C.card,
          border: `1.5px solid ${accent}`,
          borderRadius: 8,
          padding: "6px 10px",
          boxShadow: `0 0 ${isMain ? 16 : 8}px ${accent}${isMain ? "55" : "30"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* File icon */}
        <svg width="18" height="20" viewBox="0 0 18 20">
          <path
            d="M2 2 L11 2 L16 7 L16 18 L2 18 Z"
            fill={`${accent}25`}
            stroke={accent}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M11 2 L11 7 L16 7"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 9,
            color: accent,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
        >
          .coderabbit.yaml
        </span>
      </div>
      {/* connector line down to branch */}
      <div
        style={{
          width: 1.5,
          height: 12,
          backgroundColor: `${accent}60`,
          margin: "0 auto",
        }}
      />
    </div>
  );
};


// ─── Scan beam (sweeps along main branch) ───
const ScanBeam: React.FC<{
  startAt: number;
  targetX: number | null; // null = sweep full width (not found)
  phase: "bad" | "good";
}> = ({ startAt, targetX, phase }) => {
  const frame = useCurrentFrame();
  const DURATION = 32;
  const endX = targetX ?? MAIN_X1;

  const beamX = interpolate(frame, [startAt, startAt + DURATION], [MAIN_X0 + 20, endX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const beamOp = interpolate(
    frame,
    [startAt, startAt + 8, startAt + DURATION - 5, startAt + DURATION + 10],
    [0, 1, 1, targetX ? 0.6 : 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const color = phase === "good" ? C.teal : C.cream;

  return (
    <g>
      {/* Glow behind beam */}
      <rect
        x={beamX - 3}
        y={MAIN_Y - 22}
        width={6}
        height={44}
        rx={3}
        fill={color}
        opacity={beamOp * 0.25}
        filter="url(#blur)"
      />
      {/* Beam line */}
      <line
        x1={beamX}
        y1={MAIN_Y - 18}
        x2={beamX}
        y2={MAIN_Y + 18}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={beamOp}
      />
    </g>
  );
};

// ─── Scan result callout ───
const ScanResult: React.FC<{
  appearAt: number;
  phase: "bad" | "good";
  x: number;
}> = ({ appearAt, phase, x }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: Math.max(0, frame - appearAt), fps, config: { damping: 9, stiffness: 170 } });
  const op = fi(frame, appearAt, 12);
  const isGood = phase === "good";
  const color = isGood ? C.green : C.red;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 100,
        top: MAIN_Y - 110,
        width: 200,
        opacity: op,
        transform: `scale(${Math.max(0, sc)})`,
        transformOrigin: "center bottom",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: isGood ? `${C.green}14` : `${C.red}14`,
          border: `1.5px solid ${color}`,
          borderRadius: 10,
          padding: "10px 16px",
          textAlign: "center",
          boxShadow: `0 0 18px ${color}35`,
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 4 }}>{isGood ? "✓" : "✗"}</div>
        <div
          style={{
            fontSize: 13,
            color,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {isGood ? "Config found!" : "Config not found"}
        </div>
      </div>
      {/* Pointer */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: `8px solid ${color}`,
          margin: "0 auto",
          opacity: 0.8,
        }}
      />
    </div>
  );
};

// ─── Phase banner (single line) ───
const PhaseBanner: React.FC<{
  text: string;
  appearAt: number;
  color: string;
}> = ({ text, appearAt, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: Math.max(0, frame - appearAt), fps, config: { damping: 12, stiffness: 100 } });
  const op = fi(frame, appearAt, 14);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 680,
        transform: `translateX(-50%) scale(${Math.max(0, sc)})`,
        opacity: op,
        textAlign: "center",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          display: "inline-block",
          backgroundColor: `${color}16`,
          border: `1.5px solid ${color}55`,
          borderRadius: 12,
          padding: "14px 36px",
          fontSize: 20,
          fontWeight: 800,
          color,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: -0.3,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ─── Page title ───
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = spring({ frame, fps, config: { damping: 14, stiffness: 75 } });
  const op = fi(frame, 0, 20);

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        width: "100%",
        textAlign: "center",
        opacity: op,
        transform: `translateY(${(1 - y) * 24}px)`,
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: C.cream,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: -0.6,
        }}
      >
        Config must live on{" "}
        <span style={{ color: C.orange }}>main</span>
      </div>
      <div
        style={{
          fontSize: 15,
          color: C.dim,
          fontFamily: "'Inter', sans-serif",
          marginTop: 7,
          fontWeight: 400,
        }}
      >
        Not just the feature branch
      </div>
    </div>
  );
};


// ─── Main Composition ───
export const ConfigOnMainViz: React.FC = () => {
  const frame = useCurrentFrame();

  const isPhase2 = frame >= T.p2Start;
  const isGoodResult = frame >= T.goodResult;

  const fadeOut = interpolate(frame, [T.fadeOut, T.duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 1 elements dim as phase 2 takes over
  const p1Dim = interpolate(frame, [T.p2Start, T.p2Start + 25], [1, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background ambient
  const errorGlow = interpolate(
    frame,
    [T.badResult, T.badResult + 20, T.p2Start, T.p2Start + 20],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const goodGlow = interpolate(frame, [T.goodResult, T.goodResult + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.dark, opacity: fadeOut, overflow: "hidden" }}>
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: `
            linear-gradient(${C.orange}60 1px, transparent 1px),
            linear-gradient(90deg, ${C.orange}60 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: errorGlow > 0
            ? `radial-gradient(ellipse at 50% 40%, ${C.red}${Math.round(errorGlow * 8).toString(16).padStart(2, "0")} 0%, transparent 55%)`
            : goodGlow > 0
            ? `radial-gradient(ellipse at 50% 40%, ${C.green}${Math.round(goodGlow * 7).toString(16).padStart(2, "0")} 0%, transparent 55%)`
            : "none",
        }}
      />

      {/* ── Title ── */}
      <Title />

      {/* ── Git diagram (SVG) ── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1080 1080"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Main branch line */}
        <AnimPath
          d={PATH_MAIN}
          length={LEN_MAIN}
          startAt={T.mainLine}
          endAt={T.mainLine + 40}
          stroke={C.cream}
          strokeWidth={2.5}
          opacity={0.75}
        />

        {/* Feature branch curve */}
        <AnimPath
          d={PATH_FEAT_CURVE}
          length={LEN_FEAT_CURVE}
          startAt={T.featureCurve}
          endAt={T.featureCurve + 30}
          stroke={C.purple}
          strokeWidth={2.5}
          opacity={0.7}
        />

        {/* Feature branch horizontal */}
        <AnimPath
          d={PATH_FEAT_HORIZ}
          length={LEN_FEAT_HORIZ}
          startAt={T.featureHoriz}
          endAt={T.featureHoriz + 35}
          stroke={C.purple}
          strokeWidth={2.5}
          opacity={0.7}
        />

        {/* PR arrow */}
        <AnimPath
          d={PATH_PR}
          length={LEN_PR}
          startAt={T.prArrow}
          endAt={T.prArrow + 28}
          stroke={C.purple}
          strokeWidth={2}
          opacity={0.6}
        />
        {frame >= T.prArrow + 20 && <PRArrowhead appearAt={T.prArrow + 20} />}

        {/* Commits on main */}
        <CommitDot cx={MAIN_C[0]} cy={MAIN_Y} appearAt={T.commits} />
        {/* Config commit on main — only in phase 2 */}
        {isPhase2 && (
          <CommitDot
            cx={MAIN_C[1]}
            cy={MAIN_Y}
            appearAt={T.configCommit}
            color={C.green}
            size={11}
            glow
          />
        )}
        <CommitDot cx={MAIN_C[2]} cy={MAIN_Y} appearAt={T.commits + 10} />

        {/* Commits on feature */}
        <CommitDot cx={FEAT_C[0]} cy={FEAT_Y} appearAt={T.commits + 5} color={C.purple} />
        <CommitDot cx={FEAT_C[1]} cy={FEAT_Y} appearAt={T.commits + 12} color={C.purple} />

        {/* Phase 1 scan beam */}
        {frame >= T.scanBeam1 && frame < T.p2Start && (
          <ScanBeam startAt={T.scanBeam1} targetX={null} phase="bad" />
        )}

        {/* Phase 2 scan beam */}
        {isPhase2 && frame >= T.scanBeam2 && (
          <ScanBeam startAt={T.scanBeam2} targetX={CONFIG_X} phase="good" />
        )}

        {/* Branch labels */}
        {frame >= T.labels && (
          <BranchLabel x={MAIN_X0 + 8} y={MAIN_Y - 24} text="main" color={C.cream} appearAt={T.labels} />
        )}
        {frame >= T.labels + 8 && (
          <BranchLabel
            x={FEAT_CURVE_X + 50}
            y={FEAT_Y + 26}
            text="feature/rename-query"
            color={C.purple}
            appearAt={T.labels + 8}
          />
        )}
      </svg>

      {/* ── YAML file on feature branch ── */}
      {frame >= T.yamlOnFeature && (
        <div style={{ opacity: isPhase2 ? p1Dim : 1, transition: "opacity 0.3s" }}>
          <YamlIcon
            x={FEAT_C[1]}
            y={FEAT_Y - 50}
            appearAt={T.yamlOnFeature}
            isMain={false}
          />
        </div>
      )}

      {/* ── YAML file on main branch (phase 2 only) ── */}
      {isPhase2 && frame >= T.yamlOnMain && (
        <YamlIcon x={CONFIG_X} y={MAIN_Y - 55} appearAt={T.yamlOnMain} isMain />
      )}

      {/* ── Scan results ── */}
      {frame >= T.badResult && !isPhase2 && (
        <ScanResult appearAt={T.badResult} phase="bad" x={MAIN_X1 - 80} />
      )}
      {isPhase2 && frame >= T.goodResult && (
        <ScanResult appearAt={T.goodResult} phase="good" x={CONFIG_X} />
      )}

      {/* ── Phase banners ── */}
      {frame >= T.p1Label && !isPhase2 && (
        <PhaseBanner
          text="❌  Config only on feature branch"
          appearAt={T.p1Label}
          color={C.red}
        />
      )}
      {isPhase2 && frame >= T.p2Label && (
        <PhaseBanner
          text="✅  Config merged to main"
          appearAt={T.p2Label}
          color={C.green}
        />
      )}

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: isGoodResult
            ? `linear-gradient(90deg, ${C.teal}80, ${C.green}, ${C.teal}80)`
            : `linear-gradient(90deg, ${C.orange}, ${C.purple}, ${C.teal})`,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};
