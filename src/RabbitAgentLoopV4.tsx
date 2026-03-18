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
  { file: "agent-chatgpt.png", label: "ChatGPT",  bg: "#000000", pad: 6 },
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
const CONTEXT_IN       = 85;   // whole section slides in
const CONTEXT_SRC_A    = 94;   // "CODEBASE" box appears
const CONTEXT_SRC_B    = 110;  // "ORGANIZATION" box appears
const CONTEXT_GRAPH_IN = 120;  // knowledge graph cluster appears
const CONTEXT_FLOW_IN  = 134;  // orange flow line toward PLAN appears
const CONTEXT_FADE_START = 232; // dims as agents start
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
const AGENT_DWELL = 52;
const AGENT_XFADE = 14;
const AGENT_CYCLE = AGENT_DWELL + AGENT_XFADE; // 66 frames ≈ 2.2s

export const RABBIT_AGENT_LOOP_V4_TOTAL_FRAMES = 480;

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

// ─── Background ───────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG_COLOR }} />
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080" preserveAspectRatio="none"
    >
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0D 0%, transparent 58%)`,
      }}
    />
  </>
);

// ─── Context graph (slides in from left) ─────────────────────────────────────
// Layout (screen coords, translateX=0):
//   Source boxes: left side, x≈190
//   Knowledge graph: center of context area, x≈430
//   Orange flow line: graph hub → PLAN circle left edge
const CTX_HUB = { x: 430, y: 540 };
const CTX_NODES = [
  { x: 430, y: 540 },   // 0: hub (orange)
  { x: 368, y: 496 },   // 1: upper-left
  { x: 492, y: 496 },   // 2: upper-right
  { x: 368, y: 584 },   // 3: lower-left
  { x: 492, y: 584 },   // 4: lower-right
  { x: 430, y: 452 },   // 5: top satellite
];
const CTX_EDGES = [[0,1],[0,2],[0,3],[0,4],[1,2],[3,4],[1,5],[2,5]];
const BOX_W = 148;
const BOX_H = 50;
const SRC_A = { cx: 188, cy: 463 };  // CODEBASE
const SRC_B = { cx: 188, cy: 617 };  // ORGANIZATION

const ContextSection: React.FC<{ frame: number }> = ({ frame }) => {
  const slideX = interpolate(frame, [CONTEXT_IN, CONTEXT_IN + 24], [-360, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const masterOp = fi(frame, CONTEXT_IN, 14);
  const fadeOut  = interpolate(frame, [CONTEXT_FADE_START, CONTEXT_FADE_END], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = masterOp * fadeOut;
  if (opacity < 0.01) return null;

  const srcAOp    = fi(frame, CONTEXT_SRC_A, 14);
  const srcBOp    = fi(frame, CONTEXT_SRC_B, 14);
  const graphOp   = fi(frame, CONTEXT_GRAPH_IN, 18);
  const flowOp    = fi(frame, CONTEXT_FLOW_IN, 16);
  const flowScroll = Math.max(0, frame - CONTEXT_FLOW_IN) * 3.5;

  return (
    <div
      style={{
        position: "absolute", inset: 0,
        transform: `translateX(${slideX}px)`,
        opacity,
        pointerEvents: "none",
      }}
    >
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 1920 1080"
      >
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
        <text
          x={310} y={392}
          textAnchor="middle"
          fontFamily={FONT_FAMILY} fontSize={10} fontWeight={500}
          fill="rgba(255,255,255,0.22)" letterSpacing={3}
          opacity={graphOp}
        >
          BUILDING CONTEXT
        </text>

        {/* ── Source box A: CODEBASE ── */}
        <g opacity={srcAOp}>
          <rect
            x={SRC_A.cx - BOX_W / 2} y={SRC_A.cy - BOX_H / 2}
            width={BOX_W} height={BOX_H} rx={8}
            fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.28)" strokeWidth={1.5}
          />
          {/* code icon */}
          <text
            x={SRC_A.cx - 28} y={SRC_A.cy + 1}
            dominantBaseline="middle"
            fontFamily={FONT_FAMILY} fontSize={15} fontWeight={500}
            fill={CR_ORANGE}
          >{"</>"}</text>
          {/* label */}
          <text
            x={SRC_A.cx + 14} y={SRC_A.cy + 1}
            dominantBaseline="middle"
            fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
            fill="rgba(255,255,255,0.72)" letterSpacing={1.5}
          >CODEBASE</text>
        </g>

        {/* ── Source box B: ORGANIZATION ── */}
        <g opacity={srcBOp}>
          <rect
            x={SRC_B.cx - BOX_W / 2} y={SRC_B.cy - BOX_H / 2}
            width={BOX_W} height={BOX_H} rx={8}
            fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.28)" strokeWidth={1.5}
          />
          {/* org icon — simple stacked lines */}
          <rect x={SRC_B.cx - 36} y={SRC_B.cy - 7} width={14} height={3} rx={1.5} fill={CR_ORANGE} />
          <rect x={SRC_B.cx - 36} y={SRC_B.cy + 1} width={14} height={3} rx={1.5} fill={CR_ORANGE} opacity={0.7} />
          <rect x={SRC_B.cx - 36} y={SRC_B.cy + 9} width={14} height={3} rx={1.5} fill={CR_ORANGE} opacity={0.4} />
          <text
            x={SRC_B.cx - 14} y={SRC_B.cy + 1}
            dominantBaseline="middle"
            fontFamily={FONT_FAMILY} fontSize={11} fontWeight={500}
            fill="rgba(255,255,255,0.72)" letterSpacing={1.5}
          >ORGANIZATION</text>
        </g>

        {/* ── Dashed lines: sources → graph nodes ── */}
        <line
          x1={SRC_A.cx + BOX_W / 2} y1={SRC_A.cy}
          x2={CTX_NODES[1].x} y2={CTX_NODES[1].y}
          stroke="rgba(255,255,255,0.18)" strokeWidth={1.2}
          strokeDasharray="5 4"
          opacity={Math.min(srcAOp, graphOp)}
        />
        <line
          x1={SRC_B.cx + BOX_W / 2} y1={SRC_B.cy}
          x2={CTX_NODES[3].x} y2={CTX_NODES[3].y}
          stroke="rgba(255,255,255,0.18)" strokeWidth={1.2}
          strokeDasharray="5 4"
          opacity={Math.min(srcBOp, graphOp)}
        />

        {/* ── Knowledge graph edges ── */}
        {CTX_EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={CTX_NODES[a].x} y1={CTX_NODES[a].y}
            x2={CTX_NODES[b].x} y2={CTX_NODES[b].y}
            stroke="rgba(255,255,255,0.18)" strokeWidth={1}
            opacity={graphOp}
          />
        ))}

        {/* ── Knowledge graph nodes ── */}
        {CTX_NODES.map((n, i) => (
          i === 0 ? (
            // Hub: orange glow
            <circle
              key={i}
              cx={n.x} cy={n.y} r={11}
              fill={CR_ORANGE}
              opacity={graphOp}
              filter="url(#v4-hub-glow)"
            />
          ) : (
            <circle
              key={i}
              cx={n.x} cy={n.y} r={i === 5 ? 5 : 7}
              fill="rgba(0,0,0,0)"
              stroke="rgba(255,255,255,0.45)" strokeWidth={1.5}
              opacity={graphOp}
            />
          )
        ))}

        {/* ── "KNOWLEDGE GRAPH" label below cluster ── */}
        <text
          x={CTX_HUB.x} y={CTX_HUB.y + 108}
          textAnchor="middle"
          fontFamily={FONT_FAMILY} fontSize={9} fontWeight={500}
          fill="rgba(255,255,255,0.25)" letterSpacing={2.5}
          opacity={graphOp}
        >KNOWLEDGE GRAPH</text>

        {/* ── Orange flow line: context graph → PLAN node ── */}
        <line
          x1={CTX_NODES[0].x + 14} y1={CY}
          x2={PLAN_X - NODE_R - 6} y2={CY}
          stroke={CR_ORANGE}
          strokeWidth={2}
          strokeDasharray="10 6"
          strokeDashoffset={-flowScroll}
          markerEnd="url(#v4-flow-arr)"
          opacity={flowOp * 0.82}
        />
      </svg>
    </div>
  );
};

// ─── Pill + nodes ─────────────────────────────────────────────────────────────
const Pill: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {

  const pillWidth = interpolate(frame, [T.morphStart, T.morphEnd], [PILL_H, PILL_W_FULL], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const getNodeR = (i: number) => interpolate(
    frame,
    [NODE_GROW_STARTS[i], NODE_GROW_STARTS[i] + NODE_GROW_DUR],
    [0, NODE_R],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const logoOp = interpolate(frame, [T.logoFadeOut, T.logoFadeOut + 22], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

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
        const labelOp = fi(frame, NODE_GROW_STARTS[i] + NODE_GROW_DUR, 12);
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
  const arrow1Op = fi(frame, ARROW1_IN, ARROW_FADE_DUR);
  const arrow2Op = fi(frame, ARROW2_IN, ARROW_FADE_DUR);
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
  if (frame < T.loopStart) return null;
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
  if (frame < T.loopStart) return null;

  const loopFrame    = frame - T.loopStart;
  const agentIdx     = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const nextIdx      = (agentIdx + 1) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;

  const currentOp = interpolate(frameInCycle, [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const nextOp = interpolate(frameInCycle, [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const pulse   = 1 + Math.sin(frameInCycle * 0.18) * 0.028;
  const ICON    = NODE_R * 2 - 10;
  const inXfade = frameInCycle >= AGENT_DWELL;

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
  if (frame < T.loopStart) return null;
  const loopFrame    = frame - T.loopStart;
  const agentIdx     = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;
  const op = Math.min(
    fi(frame, T.loopStart, 10),
    interpolate(frameInCycle, [AGENT_DWELL + 2, AGENT_DWELL + AGENT_XFADE], [1, 0], {
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
  const op = fi(frame, T.loopStart + 10, 20);
  if (op < 0.01) return null;

  const loopFrame = frame - T.loopStart;
  const activeIdx = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
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
    { start: T.loopStart,   end: 9999,            text: "Coding agents in the loop" },
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
export const RabbitAgentLoopV4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
    </AbsoluteFill>
  );
};
