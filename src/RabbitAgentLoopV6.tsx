import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

// ─── Brand constants ───────────────────────────────────────────────────────────
const CR_ORANGE = "#FF570A";
const BG_COLOR  = "#000000";
const CR_DIM    = "#444444";

// ─── Pill geometry ────────────────────────────────────────────────────────────
const PILL_H      = 120;
const PILL_R      = 60;
const CX          = 960;
const CY          = 540;
const NODE_GAP    = 148;
const PLAN_X      = CX - NODE_GAP;   // 812
const CODE_X      = CX;              // 960
const REVIEW_X    = CX + NODE_GAP;   // 1108
const NODE_R      = 52;
const PILL_W_FULL = NODE_GAP * 2 + NODE_R * 2 + 56;

// ─── Agent definitions ────────────────────────────────────────────────────────
const AGENTS = [
  { file: "agent-chatgpt.png", label: "Codex",    bg: "#FFFFFF", pad: 6 },
  { file: "agent-gemini.png",  label: "Gemini",   bg: "#FFFFFF", pad: 4 },
  { file: "agent-cursor.png",  label: "Cursor",   bg: "#FFFFFF", pad: 2 },
  { file: "agent-claude.png",  label: "Claude",   bg: "#FFFFFF", pad: 4 },
];

// ─── Timing ───────────────────────────────────────────────────────────────────
const T = {
  circleIn:    0,
  morphStart:  36,
  morphEnd:    80,
  logoFadeOut: 82,
  loopStart:   242,
};

// ─── Context graph timing (slides in after morph, before nodes) ───────────────
const CONTEXT_IN         = 85;   // whole section slides in
const CONTEXT_GRAPH_IN   = 94;   // hub + spoke nodes appear
// Per-source stagger: CODEBASE, DOCUMENTATION, GITHUB, JIRA, SLACK
const CONTEXT_SRC_TIMINGS = [100, 109, 118, 127, 136];
const CONTEXT_FLOW_IN    = 142;  // orange flow line toward PLAN
const CONTEXT_FADE_START = 232;  // dims as agents start
const CONTEXT_FADE_END   = 255;

// ─── Sequential node timing (shifted to follow context phase) ─────────────────
const NODE_GROW_DUR    = 16;
const PLAN_GROW        = 148;
const CODE_GROW        = 176;
const REVIEW_GROW      = 204;
const NODE_GROW_STARTS = [PLAN_GROW, CODE_GROW, REVIEW_GROW];
const ARROW1_IN        = PLAN_GROW  + NODE_GROW_DUR + 2;  // 166
const ARROW2_IN        = CODE_GROW  + NODE_GROW_DUR + 2;  // 194
const ARROW_FADE_DUR   = 12;

// ─── Agent cycling ────────────────────────────────────────────────────────────
const AGENT_DWELL = 26;
const AGENT_XFADE = 7;
const AGENT_CYCLE = AGENT_DWELL + AGENT_XFADE; // 33 frames ≈ 1.1s

// ─── End sequence ─────────────────────────────────────────────────────────────
// Stop after last agent's dwell (no xfade into ChatGPT again)
const AGENTS_DONE       = 242 + (AGENTS.length - 1) * AGENT_CYCLE + AGENT_DWELL; // 367
const COLLAPSE_START    = AGENTS_DONE;
const COLLAPSE_DUR      = 24;
const LOGO_REFADE_IN    = COLLAPSE_START + 14;               // logo reappears as pill shrinks
const FINAL_FADE_START  = COLLAPSE_START + COLLAPSE_DUR + 20; // brief hold, then fade to black
const FINAL_FADE_DUR    = 24;

export const RABBIT_AGENT_LOOP_V6_TOTAL_FRAMES = FINAL_FADE_START + FINAL_FADE_DUR + 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// ─── CodeRabbit logo mark ─────────────────────────────────────────────────────
const CRLogoMark: React.FC<{ size: number }> = ({ size }) => (
  <Img
    src={staticFile("cr-logo.png")}
    style={{ width: size, height: size, objectFit: "contain" }}
  />
);

const CR_DARK = "#16161E";

// ─── Background ───────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: CR_DARK }} />
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.048,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080" preserveAspectRatio="none"
    >
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="960" y1="0" x2="380"  y2="1080" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1540" y2="1080" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
    </svg>
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0B 0%, transparent 60%)`,
      }}
    />
  </>
);

// ─── Context graph geometry ───────────────────────────────────────────────────
// Hub at center; 6 spokes radiate at organic/irregular angles.
// 5 spokes connect to labeled source boxes; 1 is an unlabeled satellite.
const CTX_HUB_X = 405;
const CTX_HUB_Y = 535;
const CTX_BOX_W = 152;
const CTX_BOX_H = 50;

// Spoke end nodes (~80-90px from hub, irregular angles)
const CTX_SPOKES = [
  { x: 325, y: 520 },  // 0 → CODEBASE      (left, slightly up)
  { x: 350, y: 465 },  // 1 → DOCUMENTATION  (upper-left)
  { x: 465, y: 470 },  // 2 → GITHUB         (upper-right)
  { x: 340, y: 595 },  // 3 → JIRA           (lower-left)
  { x: 420, y: 615 },  // 4 → SLACK          (lower-center)
];

// Source boxes: center, edge anchor toward spoke, icon type
const CTX_SOURCES = [
  { label: "CODEBASE",      icon: "code",    cx: 145, cy: 498, si: 0, ax: 221, ay: 507 },
  { label: "DOCUMENTATION", icon: "bars",    cx: 195, cy: 330, si: 1, ax: 224, ay: 355 },
  { label: "GITHUB",        icon: "github",  cx: 580, cy: 315, si: 2, ax: 562, ay: 340 },
  { label: "JIRA",          icon: "jira",    cx: 155, cy: 670, si: 3, ax: 217, ay: 645 },
  { label: "SLACK",         icon: "slack",   cx: 410, cy: 750, si: 4, ax: 412, ay: 725 },
];

// Icon renderer — called inside SVG context
const renderCtxIcon = (type: string, cx: number, cy: number) => {
  const ix = cx - 36; // icon center x
  switch (type) {
    case "code":
      return <text x={ix} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_FAMILY} fontSize={14} fontWeight={500} fill={CR_ORANGE}>{"</>"}</text>;
    case "bars":
      return <>
        <rect x={ix - 9} y={cy - 7} width={18} height={3} rx={1.5} fill={CR_ORANGE} />
        <rect x={ix - 9} y={cy - 1} width={18} height={3} rx={1.5} fill={CR_ORANGE} opacity={0.7} />
        <rect x={ix - 9} y={cy + 5} width={18} height={3} rx={1.5} fill={CR_ORANGE} opacity={0.4} />
      </>;
    case "github":
      return <image href={staticFile("github.png")} x={ix - 10} y={cy - 10} width={20} height={20} />;
    case "fork":
      // Git branch: base node + two branch nodes connected by Y-lines
      return <>
        <circle cx={ix}    cy={cy + 7} r={2.8} fill="none" stroke={CR_ORANGE} strokeWidth={1.5} />
        <circle cx={ix - 8} cy={cy - 7} r={2.8} fill="none" stroke={CR_ORANGE} strokeWidth={1.5} />
        <circle cx={ix + 8} cy={cy - 7} r={2.8} fill="none" stroke={CR_ORANGE} strokeWidth={1.5} />
        <line x1={ix}    y1={cy + 4}  x2={ix}    y2={cy - 1} stroke={CR_ORANGE} strokeWidth={1.5} />
        <line x1={ix}    y1={cy - 1}  x2={ix - 8} y2={cy - 4} stroke={CR_ORANGE} strokeWidth={1.5} />
        <line x1={ix}    y1={cy - 1}  x2={ix + 8} y2={cy - 4} stroke={CR_ORANGE} strokeWidth={1.5} />
      </>;
    case "jira":
      return <image href={staticFile("jira.png")} x={ix - 10} y={cy - 10} width={20} height={20} />;
    case "slack":
      return <image href={staticFile("slack.png")} x={ix - 10} y={cy - 10} width={20} height={20} />;
    default: return null;
  }
};

const ContextSection: React.FC<{ frame: number }> = ({ frame }) => {
  const slideX = interpolate(frame, [CONTEXT_IN, CONTEXT_IN + 24], [-360, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const masterOp   = fi(frame, CONTEXT_IN, 14);
  const fadeOut    = interpolate(frame, [CONTEXT_FADE_START, CONTEXT_FADE_END], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = masterOp * fadeOut;
  if (opacity < 0.01) return null;

  const graphOp    = fi(frame, CONTEXT_GRAPH_IN, 18);
  const flowOp     = fi(frame, CONTEXT_FLOW_IN, 16);
  const flowScroll = Math.max(0, frame - CONTEXT_FLOW_IN) * 3.5;

  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${slideX}px)`, opacity, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 1920 1080">
        <defs>
          <marker id="v4-flow-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 Z" fill={CR_ORANGE} />
          </marker>
          <filter id="v4-hub-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── "BUILDING CONTEXT" header ── */}
        <text x={380} y={268} textAnchor="middle" fontFamily={FONT_FAMILY} fontSize={10}
          fontWeight={500} fill="rgba(255,255,255,0.22)" letterSpacing={3} opacity={graphOp}>
          BUILDING CONTEXT
        </text>

        {/* ── Hub → spoke lines ── */}
        {CTX_SPOKES.map((sn, i) => (
          <line key={i}
            x1={CTX_HUB_X} y1={CTX_HUB_Y} x2={sn.x} y2={sn.y}
            stroke="rgba(255,255,255,0.22)" strokeWidth={1.2}
            opacity={graphOp}
          />
        ))}

        {/* ── Spoke end nodes ── */}
        {CTX_SPOKES.map((sn, i) => (
          <circle key={i} cx={sn.x} cy={sn.y} r={i === 5 ? 5 : 7}
            fill="rgba(0,0,0,0)" stroke="rgba(255,255,255,0.42)" strokeWidth={1.5}
            opacity={graphOp}
          />
        ))}

        {/* ── Hub (orange glow) ── */}
        <circle cx={CTX_HUB_X} cy={CTX_HUB_Y} r={11}
          fill={CR_ORANGE} opacity={graphOp} filter="url(#v4-hub-glow)"
        />

        {/* ── Source boxes — each staggered, connection line + box + icon + label ── */}
        {CTX_SOURCES.map((src, i) => {
          const srcOp = fi(frame, CONTEXT_SRC_TIMINGS[i], 14);
          if (srcOp < 0.01) return null;
          const sn = CTX_SPOKES[src.si];
          const isDoc = src.label === "DOCUMENTATION";
          return (
            <g key={i}>
              {/* Spoke node → box anchor: dashed connector */}
              <line
                x1={sn.x} y1={sn.y} x2={src.ax} y2={src.ay}
                stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} strokeDasharray="5 4"
                opacity={Math.min(srcOp, graphOp)}
              />
              {/* Box */}
              <rect
                x={src.cx - CTX_BOX_W / 2} y={src.cy - CTX_BOX_H / 2}
                width={CTX_BOX_W} height={CTX_BOX_H} rx={8}
                fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.28)" strokeWidth={1.5}
                opacity={srcOp}
              />
              {/* Icon */}
              <g opacity={srcOp}>{renderCtxIcon(src.icon, src.cx, src.cy)}</g>
              {/* Label */}
              <text
                x={src.cx - 18} y={src.cy + 1}
                dominantBaseline="middle" fontFamily={FONT_FAMILY}
                fontSize={isDoc ? 9 : 10} fontWeight={500}
                fill="rgba(255,255,255,0.72)"
                letterSpacing={isDoc ? 0.5 : 1.5}
                opacity={srcOp}
              >{src.label}</text>
            </g>
          );
        })}

        {/* ── Orange animated flow line: hub → PLAN node ── */}
        <line
          x1={CTX_HUB_X + 14} y1={CTX_HUB_Y}
          x2={PLAN_X - NODE_R - 6} y2={CTX_HUB_Y}
          stroke={CR_ORANGE} strokeWidth={2}
          strokeDasharray="10 6" strokeDashoffset={-flowScroll}
          markerEnd="url(#v4-flow-arr)"
          opacity={flowOp * 0.82}
        />
      </svg>
    </div>
  );
};

// ─── Pill + nodes ─────────────────────────────────────────────────────────────
const Pill: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {

  const pillWidthIn = interpolate(frame, [T.morphStart, T.morphEnd], [PILL_H, PILL_W_FULL], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pillWidthOut = interpolate(frame, [COLLAPSE_START, COLLAPSE_START + COLLAPSE_DUR], [PILL_W_FULL, PILL_H], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const pillWidth = frame < COLLAPSE_START ? pillWidthIn : pillWidthOut;

  const nodesFade = interpolate(frame, [COLLAPSE_START, COLLAPSE_START + 16], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const getNodeR = (i: number) => interpolate(
    frame,
    [NODE_GROW_STARTS[i], NODE_GROW_STARTS[i] + NODE_GROW_DUR],
    [0, NODE_R],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  ) * nodesFade;

  const logoFadeOut = interpolate(frame, [T.logoFadeOut, T.logoFadeOut + 22], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const logoFadeIn = interpolate(frame, [LOGO_REFADE_IN, LOGO_REFADE_IN + 16], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const logoOp = frame < COLLAPSE_START ? logoFadeOut : logoFadeIn;

  const pillOp  = fi(frame, T.circleIn, 18);
  const pillLeft = CX - pillWidth / 2;
  const pillTop  = CY - PILL_H / 2;

  const nodes = [
    { x: PLAN_X,   label: "PLAN"   },
    { x: CODE_X,   label: "CODE"   },
    { x: REVIEW_X, label: "REVIEW" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pillOp }}>

      {/* Orange pill */}
      <div
        style={{
          position: "absolute",
          left: pillLeft, top: pillTop,
          width: pillWidth, height: PILL_H,
          borderRadius: PILL_R,
          backgroundColor: CR_ORANGE,
          boxShadow: `0 6px 52px ${CR_ORANGE}3A`,
        }}
      />

      {/* CR logo */}
      {logoOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: CX - PILL_H / 2,
            top:  CY - PILL_H / 2,
            opacity: logoOp,
          }}
        >
          <CRLogoMark size={PILL_H} />
        </div>
      )}

      {/* White node circles — sequential: PLAN → CODE → REVIEW */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x} cy={CY}
            r={Math.max(0, getNodeR(i))}
            fill="white"
          />
        ))}
      </svg>

      {/* PLAN / CODE / REVIEW labels */}
      {nodes.map((n, i) => {
        const labelOp = fi(frame, NODE_GROW_STARTS[i] + NODE_GROW_DUR, 12) * nodesFade;
        if (labelOp < 0.01) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x, top: CY,
              transform: "translate(-50%, -50%)",
              opacity: labelOp,
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 12, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR_ORANGE, letterSpacing: 2 }}>
              {n.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Flow arrows (PLAN→CODE, CODE→REVIEW) ─────────────────────────────────────
const FlowArrows: React.FC<{ frame: number }> = ({ frame }) => {
  const collapsingFade = interpolate(frame, [COLLAPSE_START, COLLAPSE_START + 16], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const arrow1Op = fi(frame, ARROW1_IN, ARROW_FADE_DUR) * collapsingFade;
  const arrow2Op = fi(frame, ARROW2_IN, ARROW_FADE_DUR) * collapsingFade;
  if (arrow1Op < 0.01 && arrow2Op < 0.01) return null;

  const scroll1 = Math.max(0, frame - ARROW1_IN) * 2.8;
  const scroll2 = Math.max(0, frame - ARROW2_IN) * 2.8;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <marker id="v4-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="rgba(255,255,255,0.36)" />
        </marker>
      </defs>
      <line
        x1={PLAN_X + NODE_R + 5} y1={CY}
        x2={CODE_X - NODE_R - 5} y2={CY}
        stroke="rgba(255,255,255,0.28)" strokeWidth="1.8"
        strokeDasharray="8 6" strokeDashoffset={-scroll1}
        markerEnd="url(#v4-arr)" opacity={arrow1Op}
      />
      <line
        x1={CODE_X + NODE_R + 5} y1={CY}
        x2={REVIEW_X - NODE_R - 5} y2={CY}
        stroke="rgba(255,255,255,0.28)" strokeWidth="1.8"
        strokeDasharray="8 6" strokeDashoffset={-scroll2}
        markerEnd="url(#v4-arr)" opacity={arrow2Op}
      />
    </svg>
  );
};

// ─── CODE node glow ───────────────────────────────────────────────────────────
const CodeGlow: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart || frame >= AGENTS_DONE) return null;
  const loopFrame = frame - T.loopStart;
  const pulse     = Math.sin(loopFrame * 0.13) * 0.5 + 0.5;
  const op        = fi(frame, T.loopStart, 16) * 0.6;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <filter id="v4-cg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={14 + pulse * 10} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle
        cx={CODE_X} cy={CY} r={NODE_R + 5}
        fill="none" stroke={CR_ORANGE}
        strokeWidth={2.5 + pulse * 2}
        opacity={op}
        filter="url(#v4-cg)"
      />
    </svg>
  );
};

// ─── Agent cycling at CODE ─────────────────────────────────────────────────────
const AgentAtCode: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart || frame >= AGENTS_DONE) return null;

  const loopFrame    = frame - T.loopStart;
  const agentIdx     = Math.min(Math.floor(loopFrame / AGENT_CYCLE), AGENTS.length - 1);
  const isLastAgent  = agentIdx === AGENTS.length - 1;
  const nextIdx      = (agentIdx + 1) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;

  const currentOp = isLastAgent ? 1 : interpolate(frameInCycle, [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const nextOp = interpolate(frameInCycle, [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const pulse   = 1 + Math.sin(frameInCycle * 0.18) * 0.028;
  const ICON    = NODE_R * 2 - 10;
  const inXfade = !isLastAgent && frameInCycle >= AGENT_DWELL;

  const icon = (idx: number, op: number, sc = 1) => {
    const a = AGENTS[idx];
    return (
      <div
        key={idx}
        style={{
          position: "absolute",
          left: CODE_X - ICON / 2, top: CY - ICON / 2,
          width: ICON, height: ICON,
          borderRadius: "50%", overflow: "hidden",
          backgroundColor: a.bg,
          opacity: op, transform: `scale(${sc})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: a.pad, boxSizing: "border-box",
        }}
      >
        <Img src={staticFile(a.file)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    );
  };

  return (
    <>
      {icon(agentIdx, currentOp, pulse)}
      {inXfade && icon(nextIdx, nextOp)}
    </>
  );
};

// ─── Agent name below CODE ─────────────────────────────────────────────────────
const AgentLabel: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart || frame >= AGENTS_DONE) return null;
  const loopFrame    = frame - T.loopStart;
  const agentIdx     = Math.min(Math.floor(loopFrame / AGENT_CYCLE), AGENTS.length - 1);
  const isLastAgent  = agentIdx === AGENTS.length - 1;
  const frameInCycle = loopFrame % AGENT_CYCLE;
  const op = Math.min(
    fi(frame, T.loopStart, 10),
    isLastAgent ? 1 : interpolate(frameInCycle, [AGENT_DWELL + 2, AGENT_DWELL + AGENT_XFADE], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  return (
    <div style={{ position: "absolute", left: CODE_X, top: CY + NODE_R + 24, transform: "translateX(-50%)", opacity: op, pointerEvents: "none" }}>
      <span style={{ fontSize: 13, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR_ORANGE, letterSpacing: 2 }}>
        {AGENTS[agentIdx].label}
      </span>
    </div>
  );
};

// ─── Agent queue (right side) ─────────────────────────────────────────────────
const AgentQueue: React.FC<{ frame: number }> = ({ frame }) => {
  const fadeOut = interpolate(frame, [AGENTS_DONE - 10, AGENTS_DONE], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = fi(frame, T.loopStart + 10, 20) * fadeOut;
  if (op < 0.01) return null;

  const loopFrame = frame - T.loopStart;
  const activeIdx = Math.min(Math.floor(loopFrame / AGENT_CYCLE), AGENTS.length - 1);
  const ICON  = 42;
  const GAP   = 12;
  const totalH = AGENTS.length * ICON + (AGENTS.length - 1) * GAP;
  const stripX = CX + PILL_W_FULL / 2 + 48;
  const stripY = CY - totalH / 2;

  return (
    <div style={{ position: "absolute", left: stripX, top: stripY, opacity: op }}>
      {AGENTS.map((a, i) => {
        const isActive = i === activeIdx;
        const itemOp   = fi(frame, T.loopStart + i * 10, 12);
        return (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < AGENTS.length - 1 ? GAP : 0, opacity: itemOp }}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? CR_ORANGE : "transparent", border: `1.5px solid ${isActive ? CR_ORANGE : "rgba(255,255,255,0.18)"}` }} />
            <div style={{ width: ICON, height: ICON, borderRadius: "50%", overflow: "hidden", backgroundColor: a.bg, border: isActive ? `2px solid ${CR_ORANGE}` : "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", padding: a.pad, boxSizing: "border-box", boxShadow: isActive ? `0 0 16px ${CR_ORANGE}55` : "none", flexShrink: 0 }}>
              <Img src={staticFile(a.file)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: 13, fontFamily: FONT_FAMILY, fontWeight: 500, letterSpacing: 0.5, whiteSpace: "nowrap", color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)" }}>
              {a.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Bottom stage label ────────────────────────────────────────────────────────
const StageLabel: React.FC<{ frame: number }> = ({ frame }) => {
  const stages = [
    { start: T.circleIn,    end: T.morphStart,    text: "CodeRabbit" },
    { start: T.morphStart,  end: CONTEXT_IN,      text: "Plan · Code · Review" },
    { start: CONTEXT_IN,    end: PLAN_GROW,        text: "Building context" },
    { start: PLAN_GROW,     end: T.loopStart,     text: "Plan · Code · Review" },
    { start: T.loopStart,   end: AGENTS_DONE,      text: "Coding agents in the loop" },
  ];
  const s = stages.find(x => frame >= x.start && frame < x.end);
  if (!s) return null;
  const op = Math.min(
    fi(frame, s.start, 10),
    interpolate(frame, [s.end - 8, s.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  return (
    <div style={{ position: "absolute", bottom: 72, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op, pointerEvents: "none" }}>
      <span style={{ fontSize: 15, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR_DIM, letterSpacing: 3 }}>
        {s.text}
      </span>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const RabbitAgentLoopV6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const finalFadeOp = interpolate(frame, [FINAL_FADE_START, FINAL_FADE_START + FINAL_FADE_DUR], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />
      <ContextSection frame={frame} />
      <Pill frame={frame} fps={fps} />
      <FlowArrows frame={frame} />
      <CodeGlow frame={frame} />
      <AgentAtCode frame={frame} />
      <AgentLabel frame={frame} />
      <AgentQueue frame={frame} />
      <StageLabel frame={frame} />
      {finalFadeOp > 0 && (
        <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFadeOp }} />
      )}
    </AbsoluteFill>
  );
};
