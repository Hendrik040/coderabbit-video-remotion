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

// ── Layout ───────────────────────────────────────────────────
const LX = 430;    // left branch card center x
const RX = 1490;   // right branch card center x
const CW = 700;    // branch card width
const CH = 252;    // branch card height
const CY_ = 148;   // branch card top y
const CR_X = 960;  // cr logo center x
const CR_Y = 510;  // cr logo center y
const CR_R = 50;   // cr logo radius

// Understanding section — pill badges + flanking text
const BADGE_HW = 50;           // half-width of pill badge (pill = 100px wide)
const TEXT_R = 868;            // right edge of left insight text
const TEXT_L = 1052;           // left edge of right insight text
const ROW_Y = [592, 629, 666]; // y-center of each row
// Section bounding box (HTML div for CSS border)
const BOX_LEFT = 380;
const BOX_TOP = 570;
const BOX_W = 1160;
const BOX_H = 116;

// Below section
const INTENT_Y = ROW_Y[2] + 48;   // 714
const LINE_Y1 = ROW_Y[2] + 60;    // 726
const LINE_Y2 = 762;
const RESOLVE_Y = 774;

// ── Timing ───────────────────────────────────────────────────
const BRANCH_A_IN = 20;
const BRANCH_B_IN = 28;
const CONFLICT_IN = 65;
const CONNECT_IN = 100;
const CR_IN = 110;

type RowT = { labelIn: number; lIn: number; rIn: number };
const ROW_TIMINGS: RowT[] = [
  { labelIn: 138, lIn: 150, rIn: 160 },
  { labelIn: 174, lIn: 186, rIn: 196 },
  { labelIn: 210, lIn: 222, rIn: 232 },
];

const INTENT_IN   = 260;
const RESOLVE_IN  = 282;
const FADE_START  = 376;
const FADE_DUR    = 24;

export const MERGE_CONFLICT_V3_TOTAL_FRAMES = FADE_START + FADE_DUR + 20;

// ── Row data ─────────────────────────────────────────────────
const ROWS = [
  { label: "CODE",    left: "fetchUser + cache + retry", right: ".catch(handleError)" },
  { label: "HISTORY", left: "feat: add caching layer",   right: "fix: add error handling" },
  { label: "INTENT",  left: "improve reliability",        right: "handle failures gracefully" },
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

// ── Main ─────────────────────────────────────────────────────
export const MergeConflictResolutionV3: React.FC = () => {
  const frame = useCurrentFrame();

  // Branch cards
  const slideA = interpolate(frame, [BRANCH_A_IN, BRANCH_A_IN + 30], [-55, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opA = fi(frame, BRANCH_A_IN, 30);

  const slideB = interpolate(frame, [BRANCH_B_IN, BRANCH_B_IN + 30], [55, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opB = fi(frame, BRANCH_B_IN, 30);

  // Conflict
  const conflictOp = fi(frame, CONFLICT_IN, 14);
  const conflictPulse = 0.65 + Math.sin((frame - CONFLICT_IN) * 0.11) * 0.35;

  // Branch → CR dashed connection lines
  const connectOp = fi(frame, CONNECT_IN, 18);
  const dashScroll = Math.max(0, frame - CONNECT_IN) * 2.8;

  // CR logo
  const crOp = fi(frame, CR_IN, 24);
  const crScale = interpolate(frame, [CR_IN, CR_IN + 24], [0.3, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)),
  });

  // Section bounding box
  const boxOp = fi(frame, ROW_TIMINGS[0].labelIn - 4, 14);

  // Per-row
  const rowOps = ROW_TIMINGS.map(({ labelIn, lIn, rIn }) => ({
    labelOp: fi(frame, labelIn, 18),
    labelScale: interpolate(frame, [labelIn, labelIn + 18], [0.5, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)),
    }),
    lOp: fi(frame, lIn, 16),
    rOp: fi(frame, rIn, 16),
    // slide x offsets (applied directly to SVG x coords)
    lDx: interpolate(frame, [lIn, lIn + 16], [-22, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
    rDx: interpolate(frame, [rIn, rIn + 16], [22, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
  }));

  // Intent label + line
  const intentOp = fi(frame, INTENT_IN, 22);

  // Resolution
  const resolveOp = fi(frame, RESOLVE_IN, 26);
  const resolveSlide = interpolate(frame, [RESOLVE_IN, RESOLVE_IN + 26], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const finalFade = interpolate(frame, [FADE_START, FADE_START + FADE_DUR], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const CARD_BOT = CY_ + CH;

  // Shared
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

      {/* ── Section bounding box (HTML for CSS border) ── */}
      <div style={{
        position: "absolute",
        left: BOX_LEFT, top: BOX_TOP,
        width: BOX_W, height: BOX_H,
        border: "1px solid rgba(255,87,10,0.14)",
        borderRadius: 8,
        background: "rgba(255,87,10,0.025)",
        opacity: boxOp,
      }} />

      {/* ── SVG: everything drawn on top ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
           viewBox="0 0 1920 1080">
        <defs>
          <marker id="v3-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CR_ORANGE} />
          </marker>
          <filter id="v3-cr-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="v3-pill-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text x={960} y={80} textAnchor="middle" fontFamily={FONT_FAMILY}
              fontSize={12} fontWeight={500} fill="rgba(255,255,255,0.22)"
              letterSpacing={4} opacity={fi(frame, 0, 18)}>
          MERGE CONFLICT RESOLUTION
        </text>

        {/* Git conflict markers */}
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

        {/* Dashed lines: branch cards → CR logo */}
        <line x1={LX} y1={CARD_BOT + 12} x2={CR_X - CR_R - 4} y2={CR_Y}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v3-arr)" opacity={connectOp * 0.72} />
        <line x1={RX} y1={CARD_BOT + 12} x2={CR_X + CR_R + 4} y2={CR_Y}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v3-arr)" opacity={connectOp * 0.72} />

        {/* CR hub glow ring */}
        <circle cx={CR_X} cy={CR_Y} r={CR_R + 16}
                fill="none" stroke={CR_ORANGE} strokeWidth={1.5}
                opacity={crOp * 0.2} filter="url(#v3-cr-glow)" />

        {/* ── Understanding rows ── */}
        {ROWS.map((row, i) => {
          const y = ROW_Y[i];
          const { labelOp, labelScale, lOp, rOp, lDx, rDx } = rowOps[i];

          return (
            <g key={row.label}>
              {/* Pill badge — scales up from center */}
              <g transform={`translate(${CR_X}, ${y}) scale(${labelScale}) translate(${-CR_X}, ${-y})`}>
                <rect
                  x={CR_X - BADGE_HW} y={y - 13}
                  width={BADGE_HW * 2} height={26}
                  rx={13}
                  fill="rgba(255,87,10,0.13)"
                  stroke={CR_ORANGE} strokeWidth={1}
                  opacity={labelOp}
                  filter="url(#v3-pill-glow)"
                />
                <text x={CR_X} y={y + 4.5} textAnchor="middle"
                      fontFamily={FONT_FAMILY} fontSize={9} fontWeight={500}
                      fill={CR_ORANGE} letterSpacing={2.5}
                      opacity={labelOp}>
                  {row.label}
                </text>
              </g>

              {/* Left insight — slides in from left, right-aligned */}
              <text
                x={TEXT_R + lDx} y={y + 5}
                textAnchor="end"
                fontFamily={FONT_FAMILY} fontSize={12} fontWeight={500}
                fill="rgba(255,255,255,0.7)"
                opacity={lOp}
              >
                {row.left}
              </text>

              {/* Right insight — slides in from right, left-aligned */}
              <text
                x={TEXT_L + rDx} y={y + 5}
                fontFamily={FONT_FAMILY} fontSize={12} fontWeight={500}
                fill="rgba(255,255,255,0.7)"
                opacity={rOp}
              >
                {row.right}
              </text>
            </g>
          );
        })}

        {/* "MERGING INTENT, NOT JUST LINES" */}
        <text x={960} y={INTENT_Y} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={10} fontWeight={500}
              fill={CR_ORANGE} letterSpacing={3}
              opacity={intentOp}>
          MERGING INTENT, NOT JUST LINES
        </text>

        {/* Line: understanding section → resolution */}
        <line x1={CR_X} y1={LINE_Y1} x2={CR_X} y2={LINE_Y2}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v3-arr)"
              opacity={intentOp * 0.72} />
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

      {/* ── CR logo ── */}
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
        <Img src={staticFile("cr-logo.png")}
             style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

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
                ...(isNew ? { background: "rgba(34,197,94,0.07)", borderLeft: `2px solid ${GREEN}`, paddingLeft: 4 } : {}),
              }}>
                {t}
              </div>
            ))}
          </div>
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

      {finalFade > 0 && <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFade }} />}
    </AbsoluteFill>
  );
};
