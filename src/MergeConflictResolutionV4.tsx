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
const BG_COLOR  = "#000000";
const RED       = "#FF3B3B";
const GREEN     = "#22C55E";

function fi(frame: number, start: number, dur = 14): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ── Layout ───────────────────────────────────────────────────
const LX   = 430;   // left card center x
const RX   = 1490;  // right card center x
const CW   = 700;   // card width
const CH   = 156;   // card height — slim, just branch name + 1 diff line
const CY_  = 130;   // card top y
const CR_X = 960;
const CR_Y = 436;   // cr logo center y
const CR_R = 70;    // larger logo for more presence

// Understanding section
const BADGE_HW = 64;          // pill half-width (128px wide pill)
const TEXT_R   = 856;         // right edge of left text
const TEXT_L   = 1064;        // left edge of right text
const ROW_Y    = [548, 598, 648];
const BOX_LEFT = 310;
const BOX_TOP  = 524;
const BOX_W    = 1300;
const BOX_H    = 154;

const INTENT_Y  = ROW_Y[2] + 56;  // 704
const LINE_Y1   = ROW_Y[2] + 68;  // 716
const LINE_Y2   = 756;
const RESOLVE_Y = 768;

// ── Timing (same pacing as V3) ───────────────────────────────
const BRANCH_A_IN = 20;
const BRANCH_B_IN = 28;
const CONFLICT_IN = 65;
const CONNECT_IN  = 100;
const CR_IN       = 110;

type RowT = { labelIn: number; lIn: number; rIn: number };
const ROW_TIMINGS: RowT[] = [
  { labelIn: 138, lIn: 150, rIn: 160 },
  { labelIn: 174, lIn: 186, rIn: 196 },
  { labelIn: 210, lIn: 222, rIn: 232 },
];

const INTENT_IN  = 260;
const RESOLVE_IN = 282;
const FADE_START = 376;
const FADE_DUR   = 24;

export const MERGE_CONFLICT_V4_TOTAL_FRAMES = FADE_START + FADE_DUR + 20;

// ── Row data — short, punchy labels ─────────────────────────
const ROWS = [
  { label: "CODE",    left: "cache + retry",  right: "error handler" },
  { label: "HISTORY", left: "feat: caching",  right: "fix: errors"   },
  { label: "INTENT",  left: "reliability",    right: "resilience"    },
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
export const MergeConflictResolutionV4: React.FC = () => {
  const frame = useCurrentFrame();

  // Branch cards — slide in from sides
  const slideA = interpolate(frame, [BRANCH_A_IN, BRANCH_A_IN + 30], [-60, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opA = fi(frame, BRANCH_A_IN, 30);

  const slideB = interpolate(frame, [BRANCH_B_IN, BRANCH_B_IN + 30], [60, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opB = fi(frame, BRANCH_B_IN, 30);

  // Conflict markers
  const conflictOp    = fi(frame, CONFLICT_IN, 14);
  const conflictPulse = 0.65 + Math.sin((frame - CONFLICT_IN) * 0.11) * 0.35;

  // Dashed connections + scroll
  const connectOp = fi(frame, CONNECT_IN, 18);
  const dashScroll = Math.max(0, frame - CONNECT_IN) * 2.8;

  // CR logo
  const crOp    = fi(frame, CR_IN, 24);
  const crScale = interpolate(frame, [CR_IN, CR_IN + 24], [0.3, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)),
  });

  // Section box
  const boxOp = fi(frame, ROW_TIMINGS[0].labelIn - 4, 16);

  // Per-row animations
  const rowOps = ROW_TIMINGS.map(({ labelIn, lIn, rIn }) => ({
    labelOp:    fi(frame, labelIn, 18),
    labelScale: interpolate(frame, [labelIn, labelIn + 18], [0.5, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)),
    }),
    lOp: fi(frame, lIn, 16),
    rOp: fi(frame, rIn, 16),
    lDx: interpolate(frame, [lIn, lIn + 16], [-28, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
    rDx: interpolate(frame, [rIn, rIn + 16], [28, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
  }));

  // Intent + resolution
  const intentOp    = fi(frame, INTENT_IN, 22);
  const resolveOp   = fi(frame, RESOLVE_IN, 26);
  const resolveSlide = interpolate(frame, [RESOLVE_IN, RESOLVE_IN + 26], [22, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const finalFade = interpolate(frame, [FADE_START, FADE_START + FADE_DUR], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const CARD_BOT = CY_ + CH; // 286

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />

      {/* ── Section bounding box ── */}
      <div style={{
        position: "absolute",
        left: BOX_LEFT, top: BOX_TOP, width: BOX_W, height: BOX_H,
        border: "1px solid rgba(255,87,10,0.18)",
        borderRadius: 10,
        background: "rgba(255,87,10,0.03)",
        opacity: boxOp,
      }} />

      {/* ── SVG layer ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
           viewBox="0 0 1920 1080">
        <defs>
          <marker id="v4mc-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CR_ORANGE} />
          </marker>
          <filter id="v4mc-cr-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="v4mc-pill-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text x={960} y={78} textAnchor="middle" fontFamily={FONT_FAMILY}
              fontSize={13} fontWeight={500} fill="rgba(255,255,255,0.25)"
              letterSpacing={5} opacity={fi(frame, 0, 20)}>
          MERGE CONFLICT RESOLUTION
        </text>

        {/* Git conflict markers — center gap */}
        <text x={765} y={CY_ + CH / 2 - 8} textAnchor="end"
              fontFamily={FONT_FAMILY} fontSize={13} fontWeight={500}
              fill={RED} opacity={conflictOp * conflictPulse}>
          {"<<<<<<< feature/auth-update"}
        </text>
        <text x={960} y={CY_ + CH / 2 + 16} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={13} fontWeight={500}
              fill="rgba(255,255,255,0.32)" opacity={conflictOp}>
          {"======="}
        </text>
        <text x={1155} y={CY_ + CH / 2 + 40}
              fontFamily={FONT_FAMILY} fontSize={13} fontWeight={500}
              fill={RED} opacity={conflictOp * conflictPulse}>
          {">>>>>>> main"}
        </text>
        <text x={960} y={CY_ + CH / 2 + 66} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={10} fontWeight={500}
              fill={RED} letterSpacing={4} opacity={conflictOp}>
          CONFLICT
        </text>

        {/* Dashed lines: branch cards → CR logo */}
        <line x1={LX} y1={CARD_BOT + 14} x2={CR_X - CR_R - 5} y2={CR_Y}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v4mc-arr)" opacity={connectOp * 0.75} />
        <line x1={RX} y1={CARD_BOT + 14} x2={CR_X + CR_R + 5} y2={CR_Y}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v4mc-arr)" opacity={connectOp * 0.75} />

        {/* CR hub glow ring */}
        <circle cx={CR_X} cy={CR_Y} r={CR_R + 18}
                fill="none" stroke={CR_ORANGE} strokeWidth={1.5}
                opacity={crOp * 0.22} filter="url(#v4mc-cr-glow)" />

        {/* Understanding rows */}
        {ROWS.map((row, i) => {
          const y = ROW_Y[i];
          const { labelOp, labelScale, lOp, rOp, lDx, rDx } = rowOps[i];
          return (
            <g key={row.label}>
              {/* Pill — springs up */}
              <g transform={`translate(${CR_X},${y}) scale(${labelScale}) translate(${-CR_X},${-y})`}>
                <rect
                  x={CR_X - BADGE_HW} y={y - 16}
                  width={BADGE_HW * 2} height={32}
                  rx={16}
                  fill="rgba(255,87,10,0.15)"
                  stroke={CR_ORANGE} strokeWidth={1.2}
                  opacity={labelOp}
                  filter="url(#v4mc-pill-glow)"
                />
                <text x={CR_X} y={y + 5.5} textAnchor="middle"
                      fontFamily={FONT_FAMILY} fontSize={13} fontWeight={500}
                      fill={CR_ORANGE} letterSpacing={2.5}
                      opacity={labelOp}>
                  {row.label}
                </text>
              </g>

              {/* Left insight — larger, bolder, slides in */}
              <text x={TEXT_R + lDx} y={y + 7} textAnchor="end"
                    fontFamily={FONT_FAMILY} fontSize={20} fontWeight={500}
                    fill="rgba(255,255,255,0.88)"
                    opacity={lOp}>
                {row.left}
              </text>

              {/* Right insight */}
              <text x={TEXT_L + rDx} y={y + 7}
                    fontFamily={FONT_FAMILY} fontSize={20} fontWeight={500}
                    fill="rgba(255,255,255,0.88)"
                    opacity={rOp}>
                {row.right}
              </text>
            </g>
          );
        })}

        {/* "MERGING INTENT, NOT JUST LINES" */}
        <text x={960} y={INTENT_Y} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={12} fontWeight={500}
              fill={CR_ORANGE} letterSpacing={3}
              opacity={intentOp}>
          MERGING INTENT, NOT JUST LINES
        </text>

        {/* Line → resolution */}
        <line x1={CR_X} y1={LINE_Y1} x2={CR_X} y2={LINE_Y2}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v4mc-arr)" opacity={intentOp * 0.72} />
      </svg>

      {/* ── Branch A — just name + 1 key diff line ── */}
      <div style={{
        position: "absolute", left: LX - CW / 2, top: CY_,
        width: CW, opacity: opA, transform: `translateX(${slideA}px)`,
      }}>
        {/* Branch label */}
        <div style={{ fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: 500,
                      color: "rgba(255,255,255,0.45)", letterSpacing: 2,
                      marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: CR_ORANGE, fontSize: 18 }}>⎇</span>
          feature/auth-update
        </div>
        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          padding: "18px 24px", boxSizing: "border-box",
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
          {/* Key change */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500,
                           color: CR_ORANGE, lineHeight: 1 }}>+</span>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500,
                           color: "rgba(255,255,255,0.92)", letterSpacing: 0.5 }}>
              cache: true, retry: 3
            </span>
          </div>
        </div>
      </div>

      {/* ── Branch B — just name + 1 key diff line ── */}
      <div style={{
        position: "absolute", left: RX - CW / 2, top: CY_,
        width: CW, opacity: opB, transform: `translateX(${slideB}px)`,
      }}>
        <div style={{ fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: 500,
                      color: "rgba(255,255,255,0.45)", letterSpacing: 2,
                      marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: CR_ORANGE, fontSize: 18 }}>⎇</span>
          main
        </div>
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          padding: "18px 24px", boxSizing: "border-box",
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500,
                           color: CR_ORANGE, lineHeight: 1 }}>+</span>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500,
                           color: "rgba(255,255,255,0.92)", letterSpacing: 0.5 }}>
              .catch(handleError)
            </span>
          </div>
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

      {/* ── Resolution strip ── */}
      <div style={{
        position: "absolute",
        left: 310, top: RESOLVE_Y + resolveSlide,
        width: 1300, opacity: resolveOp,
      }}>
        <div style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 500,
                      color: GREEN, letterSpacing: 3, marginBottom: 12 }}>
          ✓ RESOLVED — RECONSTRUCTED FROM INTENT
        </div>
        <div style={{
          background: "rgba(34,197,94,0.04)",
          border: "1px solid rgba(34,197,94,0.22)", borderRadius: 10,
          padding: "20px 28px", boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Key merged lines */}
          <div>
            <div style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500,
                          color: "rgba(255,255,255,0.6)", lineHeight: "34px" }}>
              fetchUser(id, &#123; cache, retry &#125;)
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500,
                             color: GREEN, lineHeight: "34px" }}>
                &nbsp;&nbsp;.catch(handleError)
              </span>
              <span style={{ fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 500,
                             color: GREEN, letterSpacing: 2, opacity: 0.7 }}>
                ← merged in
              </span>
            </div>
          </div>
          {/* Conflict count */}
          <div style={{ textAlign: "center", paddingLeft: 32,
                        borderLeft: "1px solid rgba(34,197,94,0.18)" }}>
            <div style={{ fontFamily: FONT_FAMILY, fontSize: 56, fontWeight: 500,
                          color: GREEN, lineHeight: 1 }}>0</div>
            <div style={{ fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 500,
                          color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginTop: 4 }}>
              CONFLICTS
            </div>
          </div>
        </div>
      </div>

      {finalFade > 0 && <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFade }} />}
    </AbsoluteFill>
  );
};
