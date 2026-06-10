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

function fi(frame: number, start: number, dur = 14): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ── Layout ──────────────────────────────────────────────────
const LX = 430;    // left branch column center x
const RX = 1490;   // right branch column center x
const CW = 700;    // branch card width
const CH = 244;    // branch card height
const CY_ = 148;   // branch card top y
const SPINE_X = 960; // center spine x
const IW = 440;    // insight box width
const IH = 76;     // insight box height
const BADGE_HW = 50; // half-width of center dimension badge

// 3 analysis row y-centers (between card bottom and resolution)
const CARD_BOT = CY_ + CH; // 392
const ROW_CY = [448, 542, 636];

// Spine extents
const SPINE_Y1 = ROW_CY[0] - IH / 2 - 12; // 398
const RESOLVE_Y = 732;
const SPINE_Y2 = RESOLVE_Y - 12; // 720

// Arrow endpoints
const L_INSIGHT_R = LX + IW / 2;   // 650
const R_INSIGHT_L = RX - IW / 2;   // 1270
const ARR_L_X1 = L_INSIGHT_R + 14; // 664
const ARR_L_X2 = SPINE_X - BADGE_HW - 8; // 902
const ARR_R_X1 = R_INSIGHT_L - 14; // 1256
const ARR_R_X2 = SPINE_X + BADGE_HW + 8; // 1018

// ── Timing ──────────────────────────────────────────────────
const TITLE_IN       = 0;
const BRANCH_A_IN    = 16;
const BRANCH_B_IN    = 22;
const CONFLICT_IN    = 52;

type RowT = { lIn: number; rIn: number; cIn: number; aIn: number };
const ROW_TIMINGS: RowT[] = [
  { lIn: 88,  rIn: 96,  cIn: 104, aIn: 108 },
  { lIn: 118, rIn: 126, cIn: 134, aIn: 138 },
  { lIn: 148, rIn: 156, cIn: 164, aIn: 168 },
];

const RECONSTRUCT_IN = 196;
const RESOLVE_IN     = 216;
const PR_IN          = 268;
const CMD_IN         = 286;
const FADE_START     = 370;
const FADE_DUR       = 24;

export const MERGE_CONFLICT_V2_TOTAL_FRAMES = FADE_START + FADE_DUR + 20;

// ── Row data ─────────────────────────────────────────────────
const ROWS = [
  {
    dimension: "CODE",
    leftTitle:  "fetchUser(id, {",
    leftSub:    "cache: true, retry: 3",
    rightTitle: ".catch(handleError)",
    rightSub:   "error recovery path",
  },
  {
    dimension: "HISTORY",
    leftTitle:  "feat: add caching layer",
    leftSub:    "2 days ago · 3 files changed",
    rightTitle: "fix: add error handling",
    rightSub:   "1 day ago · 1 file changed",
  },
  {
    dimension: "INTENT",
    leftTitle:  "improve reliability",
    leftSub:    "faster + cached responses",
    rightTitle: "handle failures gracefully",
    rightSub:   "user experience protection",
  },
] as const;

// ── Background ───────────────────────────────────────────────
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG_COLOR }} />
    <div style={{
      position: "absolute", inset: 0, opacity: 0.06,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)," +
        "linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }} />
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
         viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0D 0%, transparent 58%)`,
    }} />
  </>
);

// ── Main component ───────────────────────────────────────────
export const MergeConflictResolutionV2: React.FC = () => {
  const frame = useCurrentFrame();

  // Branch cards slide in from sides
  const slideA = interpolate(frame, [BRANCH_A_IN, BRANCH_A_IN + 22], [-55, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opA = fi(frame, BRANCH_A_IN, 22);

  const slideB = interpolate(frame, [BRANCH_B_IN, BRANCH_B_IN + 22], [55, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opB = fi(frame, BRANCH_B_IN, 22);

  // Conflict markers pulse
  const conflictOp = fi(frame, CONFLICT_IN, 14);
  const conflictPulse = 0.65 + Math.sin((frame - CONFLICT_IN) * 0.11) * 0.35;

  // Spine
  const spineOp = fi(frame, ROW_TIMINGS[0].aIn, 20);
  const spineDash = Math.max(0, frame - ROW_TIMINGS[0].aIn) * 2.4;

  // Per-row animations
  const rowOps = ROW_TIMINGS.map(({ lIn, rIn, cIn, aIn }) => ({
    lOp: fi(frame, lIn, 14),
    rOp: fi(frame, rIn, 14),
    cOp: fi(frame, cIn, 12),
    aOp: fi(frame, aIn, 14),
    lSlide: interpolate(frame, [lIn, lIn + 14], [-28, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
    rSlide: interpolate(frame, [rIn, rIn + 14], [28, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
    aDash: Math.max(0, frame - aIn) * 3.4,
  }));

  // Resolution
  const reconstructOp = fi(frame, RECONSTRUCT_IN, 16);
  const resolveOp = fi(frame, RESOLVE_IN, 20);
  const resolveSlide = interpolate(frame, [RESOLVE_IN, RESOLVE_IN + 20], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const prOp = fi(frame, PR_IN, 16);
  const cmdOp = fi(frame, CMD_IN, 14);
  const finalFade = interpolate(frame, [FADE_START, FADE_START + FADE_DUR], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Shared styles
  const labelStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500,
    color: "rgba(255,255,255,0.35)", letterSpacing: 3,
    marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
  };
  const codeStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: 500,
    color: "rgba(255,255,255,0.82)", lineHeight: "25px", whiteSpace: "pre",
  };
  const dotRow = (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
      ))}
    </div>
  );

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

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />

      {/* ── SVG layer: spine, arrows, badges, labels ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
           viewBox="0 0 1920 1080">
        <defs>
          {/* Single auto-orient arrow — points in the direction the line travels */}
          <marker id="v2-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CR_ORANGE} />
          </marker>
          <filter id="v2-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="v2-badge-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text x={960} y={80} textAnchor="middle" fontFamily={FONT_FAMILY}
              fontSize={12} fontWeight={500} fill="rgba(255,255,255,0.22)"
              letterSpacing={4} opacity={fi(frame, TITLE_IN, 18)}>
          MERGE CONFLICT RESOLUTION
        </text>

        {/* Git conflict markers in center gap */}
        <text x={772} y={CY_ + CH / 2 - 10} textAnchor="end"
              fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
              fill={RED} opacity={conflictOp * conflictPulse}>
          {"<<<<<<< feature/auth-update"}
        </text>
        <text x={960} y={CY_ + CH / 2 + 14} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
              fill="rgba(255,255,255,0.28)" opacity={conflictOp}>
          {"======="}
        </text>
        <text x={1148} y={CY_ + CH / 2 + 38}
              fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
              fill={RED} opacity={conflictOp * conflictPulse}>
          {">>>>>>> main"}
        </text>
        <text x={960} y={CY_ + CH / 2 + 64} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={9} fontWeight={500}
              fill={RED} letterSpacing={4} opacity={conflictOp}>
          CONFLICT
        </text>

        {/* ── Center vertical spine ── */}
        <line
          x1={SPINE_X} y1={SPINE_Y1}
          x2={SPINE_X} y2={SPINE_Y2}
          stroke={CR_ORANGE} strokeWidth={1.5}
          strokeDasharray="6 5" strokeDashoffset={-spineDash}
          markerEnd="url(#v2-arr)"
          opacity={spineOp * 0.58}
        />

        {/* ── Per-row: horizontal arrows + dimension badge ── */}
        {ROWS.map((row, i) => {
          const cy = ROW_CY[i];
          const { aOp, cOp, aDash } = rowOps[i];

          // Left insight → center (x travels right, so markerEnd points right ✓)
          const lArrOp = aOp * 0.8;
          // Right insight → center (x1 > x2, line travels left, markerEnd points left ✓)
          const rArrOp = aOp * 0.8;

          return (
            <g key={row.dimension}>
              {/* Left arrow */}
              <line
                x1={ARR_L_X1} y1={cy} x2={ARR_L_X2} y2={cy}
                stroke={CR_ORANGE} strokeWidth={1.5}
                strokeDasharray="7 5" strokeDashoffset={-aDash}
                markerEnd="url(#v2-arr)"
                opacity={lArrOp}
              />
              {/* Right arrow (x1 > x2 → arrow points left toward center) */}
              <line
                x1={ARR_R_X1} y1={cy} x2={ARR_R_X2} y2={cy}
                stroke={CR_ORANGE} strokeWidth={1.5}
                strokeDasharray="7 5" strokeDashoffset={-aDash}
                markerEnd="url(#v2-arr)"
                opacity={rArrOp}
              />

              {/* Dimension badge — pill centered on spine */}
              <rect
                x={SPINE_X - BADGE_HW} y={cy - 15}
                width={BADGE_HW * 2} height={30}
                rx={15}
                fill="rgba(255,87,10,0.14)"
                stroke={CR_ORANGE} strokeWidth={1}
                opacity={cOp}
                filter="url(#v2-badge-glow)"
              />
              <text
                x={SPINE_X} y={cy + 5}
                textAnchor="middle" fontFamily={FONT_FAMILY}
                fontSize={9} fontWeight={500}
                fill={CR_ORANGE} letterSpacing={2.5}
                opacity={cOp}
              >
                {row.dimension}
              </text>

              {/* Horizontal dot connectors on spine at each row crossing */}
              <circle cx={SPINE_X} cy={cy} r={3} fill={CR_ORANGE}
                      opacity={cOp * 0.4} />
            </g>
          );
        })}

        {/* "RECONSTRUCTING FROM INTENT" label above resolution */}
        <text
          x={960} y={RESOLVE_Y - 24} textAnchor="middle"
          fontFamily={FONT_FAMILY} fontSize={10} fontWeight={500}
          fill={CR_ORANGE} letterSpacing={3}
          opacity={reconstructOp}
        >
          RECONSTRUCTING FROM INTENT
        </text>
      </svg>

      {/* ── Branch A card ── */}
      <div style={{
        position: "absolute", left: LX - CW / 2, top: CY_,
        width: CW, opacity: opA, transform: `translateX(${slideA}px)`,
      }}>
        <div style={labelStyle}><span style={{ color: CR_ORANGE }}>⎇</span> feature/auth-update</div>
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "14px 20px", boxSizing: "border-box",
        }}>
          {dotRow}
          {leftCode.map((l, i) => <div key={i} style={codeStyle}>{l}</div>)}
        </div>
      </div>

      {/* ── Branch B card ── */}
      <div style={{
        position: "absolute", left: RX - CW / 2, top: CY_,
        width: CW, opacity: opB, transform: `translateX(${slideB}px)`,
      }}>
        <div style={labelStyle}><span style={{ color: CR_ORANGE }}>⎇</span> main</div>
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "14px 20px", boxSizing: "border-box",
        }}>
          {dotRow}
          {rightCode.map((l, i) => <div key={i} style={codeStyle}>{l}</div>)}
        </div>
      </div>

      {/* ── Analysis rows — insight cards ── */}
      {ROWS.map((row, i) => {
        const cy = ROW_CY[i];
        const { lOp, rOp, lSlide, rSlide } = rowOps[i];
        const insightCard: React.CSSProperties = {
          position: "absolute",
          width: IW, height: IH,
          background: "rgba(255,87,10,0.045)",
          border: "1px solid rgba(255,87,10,0.2)",
          borderLeft: `2px solid ${CR_ORANGE}`,
          borderRadius: 6,
          padding: "11px 16px",
          boxSizing: "border-box",
        };
        return (
          <React.Fragment key={row.dimension}>
            {/* Left insight */}
            <div style={{
              ...insightCard,
              left: LX - IW / 2, top: cy - IH / 2,
              opacity: lOp, transform: `translateX(${lSlide}px)`,
            }}>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.88)", lineHeight: "18px" }}>
                {row.leftTitle}
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginTop: 5 }}>
                {row.leftSub}
              </div>
            </div>

            {/* Right insight */}
            <div style={{
              ...insightCard,
              left: RX - IW / 2, top: cy - IH / 2,
              opacity: rOp, transform: `translateX(${rSlide}px)`,
            }}>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.88)", lineHeight: "18px" }}>
                {row.rightTitle}
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginTop: 5 }}>
                {row.rightSub}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* ── Resolution card ── */}
      <div style={{
        position: "absolute", left: 310, top: RESOLVE_Y + resolveSlide,
        width: 1300, opacity: resolveOp,
      }}>
        <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: GREEN, letterSpacing: 3, marginBottom: 10 }}>
          ✓ RESOLVED — RECONSTRUCTED FROM INTENT
        </div>
        <div style={{
          background: "rgba(34,197,94,0.035)",
          border: "1px solid rgba(34,197,94,0.18)", borderRadius: 8,
          padding: "14px 24px", boxSizing: "border-box",
          display: "flex", gap: 44, alignItems: "flex-start",
        }}>
          <div style={{ flex: 1 }}>
            {dotRow}
            {resolvedCode.map(({ t, isNew }, i) => (
              <div key={i} style={{
                fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 500,
                lineHeight: "24px", whiteSpace: "pre",
                color: isNew ? GREEN : "rgba(255,255,255,0.82)",
                ...(isNew ? {
                  background: "rgba(34,197,94,0.07)",
                  borderLeft: `2px solid ${GREEN}`,
                  paddingLeft: 4,
                } : {}),
              }}>
                {t}
              </div>
            ))}
          </div>
          {/* Stats */}
          <div style={{
            borderLeft: "1px solid rgba(34,197,94,0.15)",
            paddingLeft: 28, paddingTop: 4,
            display: "flex", flexDirection: "column", gap: 18, minWidth: 190,
          }}>
            <div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 4 }}>
                CONFLICTS REMAINING
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: 500, color: GREEN }}>0</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 4 }}>
                APPROACH
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
                INTENT-BASED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: PR description + command ── */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 44,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <div style={{ opacity: prOp, fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>
          Goes file by file · Commits directly onto your branch · Double-checks everything
        </div>
        <div style={{ opacity: cmdOp, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            background: "rgba(255,87,10,0.08)",
            border: "1px solid rgba(255,87,10,0.22)",
            borderRadius: 6, padding: "6px 18px",
            fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500,
            color: CR_ORANGE, letterSpacing: 1,
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
