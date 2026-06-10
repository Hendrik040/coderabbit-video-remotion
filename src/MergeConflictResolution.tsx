import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

const CR_ORANGE = "#FF570A";
const BG_COLOR = "#000000";
const RED = "#FF3B3B";
const GREEN = "#22C55E";

function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// Layout
const LX = 430;   // left branch card center x
const RX = 1490;  // right branch card center x
const CW = 700;   // branch card width
const CH = 256;   // branch card height
const CY_ = 148;  // branch card top y
const CR_X = 960; // CR hub center x
const CR_Y = 508; // CR hub center y
const CR_R = 52;  // CR hub radius

// Timing
const TITLE_IN = 0;
const BRANCH_A_IN = 16;
const BRANCH_B_IN = 22;
const CONFLICT_IN = 55;
const CR_IN = 88;
const PILLAR_0_IN = 112;
const PILLAR_1_IN = 126;
const PILLAR_2_IN = 140;
const CONNECT_IN = 114;
const INTENT_IN = 178;
const RESOLVE_IN = 206;
const PR_IN = 258;
const CMD_IN = 276;
const FADE_START = 360;
const FADE_DUR = 24;

export const MERGE_CONFLICT_TOTAL_FRAMES = FADE_START + FADE_DUR + 20;

const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG_COLOR }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.06,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
    >
      <line x1="960" y1="0" x2="0" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0D 0%, transparent 58%)`,
      }}
    />
  </>
);

export const MergeConflictResolution: React.FC = () => {
  const frame = useCurrentFrame();

  // Branch cards
  const slideA = interpolate(frame, [BRANCH_A_IN, BRANCH_A_IN + 22], [-55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opA = fi(frame, BRANCH_A_IN, 22);

  const slideB = interpolate(frame, [BRANCH_B_IN, BRANCH_B_IN + 22], [55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opB = fi(frame, BRANCH_B_IN, 22);

  // Conflict markers
  const conflictOp = fi(frame, CONFLICT_IN, 14);
  const conflictPulse = 0.65 + Math.sin((frame - CONFLICT_IN) * 0.11) * 0.35;

  // CR logo
  const crOp = fi(frame, CR_IN, 18);
  const crScale = interpolate(frame, [CR_IN, CR_IN + 18], [0.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });

  // Understanding pillars
  const p0 = fi(frame, PILLAR_0_IN, 14);
  const p1 = fi(frame, PILLAR_1_IN, 14);
  const p2 = fi(frame, PILLAR_2_IN, 14);

  // Animated dash connections
  const connectOp = fi(frame, CONNECT_IN, 18);
  const dashScroll = Math.max(0, frame - CONNECT_IN) * 2.8;

  // "Merging intent" label + line to resolution
  const intentOp = fi(frame, INTENT_IN, 16);

  // Resolution card
  const resolveOp = fi(frame, RESOLVE_IN, 20);
  const resolveSlide = interpolate(frame, [RESOLVE_IN, RESOLVE_IN + 20], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // PR + command
  const prOp = fi(frame, PR_IN, 16);
  const cmdOp = fi(frame, CMD_IN, 14);

  // Fade to black
  const finalFade = interpolate(frame, [FADE_START, FADE_START + FADE_DUR], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const CARD_BOT = CY_ + CH;
  const PILLAR_Y = CR_Y + CR_R + 28;
  const PILLAR_XS = [800, 960, 1120];
  const PILLAR_LABELS = ["CODE", "HISTORY", "INTENT"];
  const PILLAR_DESCS = ["what it does", "commit context", "change purpose"];
  const PILLAR_OPS = [p0, p1, p2];
  const RESOLVE_Y = 755;

  const leftCode = [
    "function resolve(data) {",
    "  return fetchUser(data.id, {",
    "    cache: true,",
    "    retry: 3",
    "  })",
    "}",
  ];
  const rightCode = [
    "function resolve(data) {",
    "  return getUser(data.id)",
    "    .catch(handleError)",
    "}",
  ];
  const resolvedCode: { t: string; isNew: boolean }[] = [
    { t: "function resolve(data) {", isNew: false },
    { t: "  return fetchUser(data.id, {", isNew: false },
    { t: "    cache: true,", isNew: false },
    { t: "    retry: 3", isNew: false },
    { t: "  }).catch(handleError)", isNew: true },
    { t: "}", isNew: false },
  ];

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 3,
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };
  const codeStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: 500,
    color: "rgba(255,255,255,0.82)",
    lineHeight: "25px",
    whiteSpace: "pre",
  };
  const dotRow = (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />

      {/* SVG overlay — connectors, markers, labels */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1920 1080"
      >
        <defs>
          <marker id="mc-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CR_ORANGE} />
          </marker>
          <filter id="mc-cr-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text
          x={960} y={80}
          textAnchor="middle" fontFamily={FONT_FAMILY}
          fontSize={12} fontWeight={500} fill="rgba(255,255,255,0.22)"
          letterSpacing={4} opacity={fi(frame, TITLE_IN, 18)}
        >
          MERGE CONFLICT RESOLUTION
        </text>

        {/* Git conflict markers — center gap between cards */}
        <text
          x={775} y={CY_ + CH / 2 - 8} textAnchor="end"
          fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
          fill={RED} letterSpacing={0.5}
          opacity={conflictOp * conflictPulse}
        >
          {"<<<<<<< feature/auth-update"}
        </text>
        <text
          x={960} y={CY_ + CH / 2 + 16} textAnchor="middle"
          fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
          fill="rgba(255,255,255,0.28)" letterSpacing={0.5}
          opacity={conflictOp}
        >
          {"======="}
        </text>
        <text
          x={1145} y={CY_ + CH / 2 + 40}
          fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
          fill={RED} letterSpacing={0.5}
          opacity={conflictOp * conflictPulse}
        >
          {">>>>>>> main"}
        </text>
        <text
          x={960} y={CY_ + CH / 2 + 68} textAnchor="middle"
          fontFamily={FONT_FAMILY} fontSize={9} fontWeight={500}
          fill={RED} letterSpacing={4}
          opacity={conflictOp}
        >
          CONFLICT
        </text>

        {/* Dashed connecting lines: branch cards → CR logo */}
        <line
          x1={LX} y1={CARD_BOT + 14}
          x2={CR_X - CR_R - 5} y2={CR_Y}
          stroke={CR_ORANGE} strokeWidth={1.5}
          strokeDasharray="8 5" strokeDashoffset={-dashScroll}
          markerEnd="url(#mc-arr)"
          opacity={connectOp * 0.72}
        />
        <line
          x1={RX} y1={CARD_BOT + 14}
          x2={CR_X + CR_R + 5} y2={CR_Y}
          stroke={CR_ORANGE} strokeWidth={1.5}
          strokeDasharray="8 5" strokeDashoffset={-dashScroll}
          markerEnd="url(#mc-arr)"
          opacity={connectOp * 0.72}
        />

        {/* CR hub glow ring */}
        <circle
          cx={CR_X} cy={CR_Y} r={CR_R + 16}
          fill="none" stroke={CR_ORANGE} strokeWidth={1.5}
          opacity={crOp * 0.2} filter="url(#mc-cr-glow)"
        />

        {/* Pillar separator dots */}
        {[0, 1].map((i) => (
          <circle
            key={i}
            cx={(PILLAR_XS[i] + PILLAR_XS[i + 1]) / 2}
            cy={PILLAR_Y + 6}
            r={2.5}
            fill="rgba(255,255,255,0.15)"
            opacity={PILLAR_OPS[i] * PILLAR_OPS[i + 1]}
          />
        ))}

        {/* "Merging intent" label */}
        <text
          x={960} y={CR_Y + CR_R + 74} textAnchor="middle"
          fontFamily={FONT_FAMILY} fontSize={10} fontWeight={500}
          fill={CR_ORANGE} letterSpacing={3}
          opacity={intentOp}
        >
          MERGING INTENT, NOT JUST LINES
        </text>

        {/* Line: CR → resolution */}
        <line
          x1={CR_X} y1={CR_Y + CR_R + 8}
          x2={CR_X} y2={RESOLVE_Y - 12}
          stroke={CR_ORANGE} strokeWidth={1.5}
          strokeDasharray="8 5" strokeDashoffset={-dashScroll}
          markerEnd="url(#mc-arr)"
          opacity={intentOp * 0.72}
        />
      </svg>

      {/* Branch A — feature/auth-update */}
      <div style={{ position: "absolute", left: LX - CW / 2, top: CY_, width: CW, height: CH, opacity: opA, transform: `translateX(${slideA}px)` }}>
        <div style={labelStyle}>
          <span style={{ color: CR_ORANGE }}>⎇</span> feature/auth-update
        </div>
        <div style={{
          width: "100%", background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "14px 20px", boxSizing: "border-box",
        }}>
          {dotRow}
          {leftCode.map((l, i) => <div key={i} style={codeStyle}>{l}</div>)}
        </div>
      </div>

      {/* Branch B — main */}
      <div style={{ position: "absolute", left: RX - CW / 2, top: CY_, width: CW, height: CH, opacity: opB, transform: `translateX(${slideB}px)` }}>
        <div style={labelStyle}>
          <span style={{ color: CR_ORANGE }}>⎇</span> main
        </div>
        <div style={{
          width: "100%", background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "14px 20px", boxSizing: "border-box",
        }}>
          {dotRow}
          {rightCode.map((l, i) => <div key={i} style={codeStyle}>{l}</div>)}
        </div>
      </div>

      {/* CR analysis hub */}
      <div style={{
        position: "absolute",
        left: CR_X - CR_R, top: CR_Y - CR_R,
        width: CR_R * 2, height: CR_R * 2,
        opacity: crOp,
        transform: `scale(${crScale})`,
        transformOrigin: "center center",
        borderRadius: "50%",
        overflow: "hidden",
      }}>
        <Img src={staticFile("cr-logo.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Understanding pillars: CODE · HISTORY · INTENT */}
      {PILLAR_LABELS.map((label, i) => (
        <div key={label} style={{ position: "absolute", left: PILLAR_XS[i] - 60, top: PILLAR_Y, width: 120, textAlign: "center", opacity: PILLAR_OPS[i] }}>
          <div style={{ fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 500, color: CR_ORANGE, letterSpacing: 2, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontFamily: FONT_FAMILY, fontSize: 9.5, fontWeight: 500, color: "rgba(255,255,255,0.28)", letterSpacing: 1 }}>
            {PILLAR_DESCS[i]}
          </div>
        </div>
      ))}

      {/* Resolution card */}
      <div style={{ position: "absolute", left: 310, top: RESOLVE_Y + resolveSlide, width: 1300, opacity: resolveOp }}>
        <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: GREEN, letterSpacing: 3, marginBottom: 10 }}>
          ✓ RESOLVED — RECONSTRUCTED FROM INTENT
        </div>
        <div style={{
          width: "100%", background: "rgba(34,197,94,0.035)",
          border: "1px solid rgba(34,197,94,0.18)", borderRadius: 8,
          padding: "14px 24px", boxSizing: "border-box",
          display: "flex", gap: 44, alignItems: "flex-start",
        }}>
          {/* Merged code */}
          <div style={{ flex: 1 }}>
            {dotRow}
            {resolvedCode.map(({ t, isNew }, i) => (
              <div key={i} style={{
                fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 500, lineHeight: "24px", whiteSpace: "pre",
                color: isNew ? GREEN : "rgba(255,255,255,0.82)",
                ...(isNew ? { background: "rgba(34,197,94,0.07)", borderLeft: `2px solid ${GREEN}`, paddingLeft: 4 } : {}),
              }}>
                {t}
              </div>
            ))}
          </div>
          {/* Stats sidebar */}
          <div style={{ borderLeft: "1px solid rgba(34,197,94,0.15)", paddingLeft: 28, paddingTop: 4, display: "flex", flexDirection: "column", gap: 18, minWidth: 190 }}>
            <div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 4 }}>
                CONFLICTS REMAINING
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: 500, color: GREEN }}>
                0
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 4 }}>
                APPROACH
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
                INTENT-BASED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PR description + command */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ opacity: prOp, fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>
          Goes file by file · Commits directly onto your branch · Double-checks everything
        </div>
        <div style={{ opacity: cmdOp, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            background: "rgba(255,87,10,0.08)", border: "1px solid rgba(255,87,10,0.22)",
            borderRadius: 6, padding: "6px 18px",
            fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500, color: CR_ORANGE, letterSpacing: 1,
          }}>
            @coderabbitai resolve merge conflict
          </div>
          <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.22)", letterSpacing: 2 }}>
            or check the box in Finishing Touches
          </div>
        </div>
      </div>

      {finalFade > 0 && <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFade }} />}
    </AbsoluteFill>
  );
};
