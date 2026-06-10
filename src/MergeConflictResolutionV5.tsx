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

// ── Layout (1080×1080) ────────────────────────────────────────
const CX   = 540;   // canvas center x
const LX   = 258;   // left card center x
const RX   = 822;   // right card center x
const CW   = 430;   // card width
const CH   = 144;   // card height
const CY_  = 76;    // card top y
const CR_R = 64;    // cr logo radius
const CR_Y = 306;   // cr logo center y

// Understanding section
const BADGE_HW = 58;  // pill half-width (116px wide)
const TEXT_R   = 462; // right edge of left text
const TEXT_L   = 618; // left edge of right text
const ROW_Y    = [404, 448, 492];
const BOX_LEFT = 38;
const BOX_TOP  = 384;
const BOX_W    = 1004;
const BOX_H    = 148;

const INTENT_Y = ROW_Y[2] + 54;   // 546
const LINE_Y1  = ROW_Y[2] + 64;   // 556
const LINE_Y2  = 590;
const RESOLVE_Y = 602;

// ── Timing (same pacing as V3/V4) ────────────────────────────
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

export const MERGE_CONFLICT_V5_TOTAL_FRAMES = FADE_START + FADE_DUR + 20;

const ROWS = [
  { label: "CODE",    left: "cache + retry", right: "error handler" },
  { label: "HISTORY", left: "feat: caching", right: "fix: errors"   },
  { label: "INTENT",  left: "reliability",   right: "resilience"    },
] as const;

// ── Background ────────────────────────────────────────────────
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
         viewBox="0 0 1080 1080" preserveAspectRatio="none">
      <line x1="540" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="540" y1="0" x2="1080" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0D 0%, transparent 58%)`,
    }} />
  </>
);

// ── Main ──────────────────────────────────────────────────────
export const MergeConflictResolutionV5: React.FC = () => {
  const frame = useCurrentFrame();

  const slideA = interpolate(frame, [BRANCH_A_IN, BRANCH_A_IN + 30], [-50, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opA = fi(frame, BRANCH_A_IN, 30);

  const slideB = interpolate(frame, [BRANCH_B_IN, BRANCH_B_IN + 30], [50, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const opB = fi(frame, BRANCH_B_IN, 30);

  // "CONFLICT" label — fades in cleanly, no pulse
  const conflictOp = fi(frame, CONFLICT_IN, 18);

  const connectOp  = fi(frame, CONNECT_IN, 18);
  const dashScroll = Math.max(0, frame - CONNECT_IN) * 2.8;

  const crOp    = fi(frame, CR_IN, 24);
  const crScale = interpolate(frame, [CR_IN, CR_IN + 24], [0.3, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)),
  });

  const boxOp = fi(frame, ROW_TIMINGS[0].labelIn - 4, 16);

  const rowOps = ROW_TIMINGS.map(({ labelIn, lIn, rIn }) => ({
    labelOp:    fi(frame, labelIn, 18),
    labelScale: interpolate(frame, [labelIn, labelIn + 18], [0.5, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)),
    }),
    lOp: fi(frame, lIn, 16),
    rOp: fi(frame, rIn, 16),
    lDx: interpolate(frame, [lIn, lIn + 16], [-24, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
    rDx: interpolate(frame, [rIn, rIn + 16], [24, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    }),
  }));

  const intentOp    = fi(frame, INTENT_IN, 22);
  const resolveOp   = fi(frame, RESOLVE_IN, 26);
  const resolveSlide = interpolate(frame, [RESOLVE_IN, RESOLVE_IN + 26], [18, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const finalFade = interpolate(frame, [FADE_START, FADE_START + FADE_DUR], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const CARD_BOT = CY_ + CH; // 220

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />

      {/* Section bounding box */}
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
           viewBox="0 0 1080 1080">
        <defs>
          <marker id="v5-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CR_ORANGE} />
          </marker>
          <filter id="v5-cr-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="v5-pill-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="v5-conflict-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text x={CX} y={52} textAnchor="middle" fontFamily={FONT_FAMILY}
              fontSize={11} fontWeight={500} fill="rgba(255,255,255,0.22)"
              letterSpacing={5} opacity={fi(frame, 0, 20)}>
          MERGE CONFLICT RESOLUTION
        </text>

        {/* CONFLICT label — big, clean, no pulse */}
        <text x={CX} y={CY_ + CH / 2 + 10} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={28} fontWeight={500}
              fill={RED} letterSpacing={8}
              filter="url(#v5-conflict-glow)"
              opacity={conflictOp}>
          CONFLICT
        </text>

        {/* Dashed lines: branch cards → CR logo */}
        <line x1={LX} y1={CARD_BOT + 12}
              x2={CX - CR_R - 4} y2={CR_Y}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v5-arr)" opacity={connectOp * 0.75} />
        <line x1={RX} y1={CARD_BOT + 12}
              x2={CX + CR_R + 4} y2={CR_Y}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v5-arr)" opacity={connectOp * 0.75} />

        {/* CR hub glow ring */}
        <circle cx={CX} cy={CR_Y} r={CR_R + 16}
                fill="none" stroke={CR_ORANGE} strokeWidth={1.5}
                opacity={crOp * 0.22} filter="url(#v5-cr-glow)" />

        {/* Understanding rows */}
        {ROWS.map((row, i) => {
          const y = ROW_Y[i];
          const { labelOp, labelScale, lOp, rOp, lDx, rDx } = rowOps[i];
          return (
            <g key={row.label}>
              <g transform={`translate(${CX},${y}) scale(${labelScale}) translate(${-CX},${-y})`}>
                <rect
                  x={CX - BADGE_HW} y={y - 16}
                  width={BADGE_HW * 2} height={32}
                  rx={16}
                  fill="rgba(255,87,10,0.16)"
                  stroke={CR_ORANGE} strokeWidth={1.2}
                  opacity={labelOp}
                  filter="url(#v5-pill-glow)"
                />
                <text x={CX} y={y + 5.5} textAnchor="middle"
                      fontFamily={FONT_FAMILY} fontSize={13} fontWeight={500}
                      fill={CR_ORANGE} letterSpacing={2.5}
                      opacity={labelOp}>
                  {row.label}
                </text>
              </g>

              {/* Left insight */}
              <text x={TEXT_R + lDx} y={y + 7} textAnchor="end"
                    fontFamily={FONT_FAMILY} fontSize={20} fontWeight={500}
                    fill="rgba(255,255,255,0.9)"
                    opacity={lOp}>
                {row.left}
              </text>

              {/* Right insight */}
              <text x={TEXT_L + rDx} y={y + 7}
                    fontFamily={FONT_FAMILY} fontSize={20} fontWeight={500}
                    fill="rgba(255,255,255,0.9)"
                    opacity={rOp}>
                {row.right}
              </text>
            </g>
          );
        })}

        {/* MERGING INTENT, NOT JUST LINES */}
        <text x={CX} y={INTENT_Y} textAnchor="middle"
              fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
              fill={CR_ORANGE} letterSpacing={3}
              opacity={intentOp}>
          MERGING INTENT, NOT JUST LINES
        </text>

        {/* Line → resolution */}
        <line x1={CX} y1={LINE_Y1} x2={CX} y2={LINE_Y2}
              stroke={CR_ORANGE} strokeWidth={1.5}
              strokeDasharray="8 5" strokeDashoffset={-dashScroll}
              markerEnd="url(#v5-arr)" opacity={intentOp * 0.72} />

        {/* Dim stage label at bottom */}
        <text x={CX} y={1046} textAnchor="middle" fontFamily={FONT_FAMILY}
              fontSize={10} fontWeight={500} fill="rgba(255,255,255,0.12)"
              letterSpacing={3} opacity={resolveOp}>
          coderabbit.ai
        </text>
      </svg>

      {/* ── Branch A ── */}
      <div style={{
        position: "absolute",
        left: LX - CW / 2, top: CY_,
        width: CW, opacity: opA, transform: `translateX(${slideA}px)`,
      }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 500,
          color: "rgba(255,255,255,0.4)", letterSpacing: 2,
          marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: CR_ORANGE, fontSize: 16 }}>⎇</span>
          feature/auth-update
        </div>
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          padding: "16px 22px", boxSizing: "border-box",
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: 500, color: CR_ORANGE }}>+</span>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.92)" }}>
              cache: true, retry: 3
            </span>
          </div>
        </div>
      </div>

      {/* ── Branch B ── */}
      <div style={{
        position: "absolute",
        left: RX - CW / 2, top: CY_,
        width: CW, opacity: opB, transform: `translateX(${slideB}px)`,
      }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 500,
          color: "rgba(255,255,255,0.4)", letterSpacing: 2,
          marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: CR_ORANGE, fontSize: 16 }}>⎇</span>
          main
        </div>
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          padding: "16px 22px", boxSizing: "border-box",
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: 500, color: CR_ORANGE }}>+</span>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.92)" }}>
              .catch(handleError)
            </span>
          </div>
        </div>
      </div>

      {/* ── CR logo ── */}
      <div style={{
        position: "absolute",
        left: CX - CR_R, top: CR_Y - CR_R,
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
        left: BOX_LEFT, top: RESOLVE_Y + resolveSlide,
        width: BOX_W, opacity: resolveOp,
      }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 500,
          color: GREEN, letterSpacing: 3, marginBottom: 10,
        }}>
          ✓ RESOLVED — RECONSTRUCTED FROM INTENT
        </div>
        <div style={{
          background: "rgba(34,197,94,0.04)",
          border: "1px solid rgba(34,197,94,0.22)", borderRadius: 10,
          padding: "18px 24px", boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: 500,
              color: "rgba(255,255,255,0.55)", lineHeight: "32px",
            }}>
              fetchUser(id, &#123; cache, retry &#125;)
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{
                fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: 500,
                color: GREEN, lineHeight: "32px",
              }}>
                &nbsp;&nbsp;.catch(handleError)
              </span>
              <span style={{
                fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500,
                color: GREEN, letterSpacing: 2, opacity: 0.65,
              }}>
                ← merged in
              </span>
            </div>
          </div>
          <div style={{
            textAlign: "center", paddingLeft: 24,
            borderLeft: "1px solid rgba(34,197,94,0.2)",
          }}>
            <div style={{
              fontFamily: FONT_FAMILY, fontSize: 52, fontWeight: 500,
              color: GREEN, lineHeight: 1,
            }}>0</div>
            <div style={{
              fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: 500,
              color: "rgba(255,255,255,0.28)", letterSpacing: 2, marginTop: 4,
            }}>
              CONFLICTS
            </div>
          </div>
        </div>
      </div>

      {finalFade > 0 && <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFade }} />}
    </AbsoluteFill>
  );
};
