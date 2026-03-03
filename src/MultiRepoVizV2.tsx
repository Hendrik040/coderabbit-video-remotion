import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// ─── Brand Colors ───
const C = {
  orange: "#FF570A",
  teal: "#25BAB1",
  green: "#25E2A8",
  red: "#FF4848",
  purple: "#838BFF",
  dark: "#111111",
  card: "#1C1C1C",
  cardAlt: "#161616",
  border: "#2D2D2D",
  cream: "#F2F1EB",
  dim: "#555555",
  mid: "#888888",
};

// ─── Layout ───
const CARD_W       = 310;
const CARD_TOP     = 138;
// Card body height is driven by its content; this is the hit-test / badge anchor
const CARD_H_APPROX = 236;
const BADGE_GAP    = 10;
const BADGE_H      = 36;
const ARROW_START_Y = CARD_TOP + CARD_H_APPROX + BADGE_GAP + BADGE_H + 8; // ~428

const HUB_CX  = 540;
const HUB_CY  = 620;
const HUB_W   = 330;
const HUB_H   = 78;
const HUB_TOP = HUB_CY - HUB_H / 2; // 581

// Cards: left edges 30, 385, 740  →  centre-x: 185, 540, 895
const REPO_CX = [185, 540, 895];

const PATHS = [
  `M ${REPO_CX[0]} ${ARROW_START_Y} C ${REPO_CX[0]} ${ARROW_START_Y + 115} ${HUB_CX} ${HUB_TOP - 115} ${HUB_CX} ${HUB_TOP}`,
  `M ${REPO_CX[1]} ${ARROW_START_Y} C ${REPO_CX[1]} ${ARROW_START_Y + 75}  ${HUB_CX} ${HUB_TOP - 75}  ${HUB_CX} ${HUB_TOP}`,
  `M ${REPO_CX[2]} ${ARROW_START_Y} C ${REPO_CX[2]} ${ARROW_START_Y + 115} ${HUB_CX} ${HUB_TOP - 115} ${HUB_CX} ${HUB_TOP}`,
];
const PATH_LENGTHS = [640, 240, 640];

// ─── Timing (frames @ 30 fps) ───
// Three staggered card reveals — each with its own file-tree crawl
const TREE_STAGGER = 11; // frames between each tree row
const T = {
  card0: 5,
  card1: 52,
  card2: 99,
  // tree items start 18 frames after the card header springs in
  // 7 items × 11 = 77 frames per tree
  // tree0: 23 → 100  tree1: 70 → 147  tree2: 117 → 194
  techTags:        210,
  separationNote:  228,   // "three isolated codebases" row
  ci0:             265,
  ci1:             283,
  ci2:             301,
  ciBanner:        322,
  // integration phase
  hubAppear:       355,
  arrowsStart:     372,
  arrowsEnd:       428,
  // error phase
  errorStart:      452,
  mismatchDetail:  478,
  prodError:       508,
  fadeOut:         530,
  duration:        560,
};

// ─── Helpers ───
function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ─── Tree data ───
interface TreeRow { folder: boolean; name: string; depth: number; highlight?: boolean }

const REPO_DATA: {
  name: string; org: string; lang: string; langColor: string;
  tests: number; x: number; cardAt: number; ciAt: number;
  tree: TreeRow[];
}[] = [
  {
    name: "backend-api", org: "acme", lang: "Python", langColor: "#3776AB",
    tests: 142, x: 30, cardAt: T.card0, ciAt: T.ci0,
    tree: [
      { folder: true,  name: "api/",           depth: 0 },
      { folder: false, name: "routes.py",       depth: 1 },
      { folder: false, name: "workflow.py",     depth: 1, highlight: true },
      { folder: true,  name: "models/",         depth: 0 },
      { folder: false, name: "schema.py",       depth: 1 },
      { folder: true,  name: "tests/",          depth: 0 },
      { folder: false, name: "test_workflow.py",depth: 1 },
    ],
  },
  {
    name: "web-frontend", org: "acme", lang: "TypeScript", langColor: "#3178C6",
    tests: 89, x: 385, cardAt: T.card1, ciAt: T.ci1,
    tree: [
      { folder: true,  name: "components/",     depth: 0 },
      { folder: false, name: "ChatWidget.tsx",  depth: 1, highlight: true },
      { folder: false, name: "Header.tsx",       depth: 1 },
      { folder: true,  name: "hooks/",           depth: 0 },
      { folder: false, name: "useWorkflow.ts",   depth: 1 },
      { folder: true,  name: "pages/",           depth: 0 },
      { folder: false, name: "index.tsx",        depth: 1 },
    ],
  },
  {
    name: "mobile-app", org: "acme", lang: "React Native", langColor: "#61DAFB",
    tests: 67, x: 740, cardAt: T.card2, ciAt: T.ci2,
    tree: [
      { folder: true,  name: "screens/",          depth: 0 },
      { folder: false, name: "HomeScreen.tsx",    depth: 1, highlight: true },
      { folder: true,  name: "components/",       depth: 0 },
      { folder: false, name: "WorkflowCard.tsx",  depth: 1 },
      { folder: true,  name: "lib/",              depth: 0 },
      { folder: false, name: "api.ts",            depth: 1 },
    ],
  },
];

// ─── Small SVG icons ───
const FolderIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="13" height="12" viewBox="0 0 13 12" style={{ flexShrink: 0 }}>
    <path
      d="M0.5 2.5 C0.5 1.7 1.1 1 1.9 1 L4.6 1 L5.6 2.2 L11.1 2.2 C11.9 2.2 12.5 2.9 12.5 3.7 L12.5 9.5 C12.5 10.3 11.9 11 11.1 11 L1.9 11 C1.1 11 0.5 10.3 0.5 9.5 Z"
      fill={color}
      opacity={0.75}
    />
  </svg>
);

const FileIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="11" height="13" viewBox="0 0 11 13" style={{ flexShrink: 0 }}>
    <path
      d="M1 1 L7 1 L10 4 L10 12 L1 12 Z"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinejoin="round"
      opacity={0.65}
    />
    <path
      d="M7 1 L7 4 L10 4"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinejoin="round"
      opacity={0.65}
    />
  </svg>
);

// ─── GitHub icon ───
const GitHubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={C.cream} opacity={0.45}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

// ─── Animated tree row ───
const TreeRow: React.FC<TreeRow & { appearAt: number }> = ({
  folder, name, depth, highlight = false, appearAt,
}) => {
  const frame = useCurrentFrame();
  const op = fi(frame, appearAt, 9);
  const slideX = interpolate(frame, [appearAt, appearAt + 12], [-10, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const iconColor = highlight ? C.orange : folder ? C.teal : C.mid;
  const textColor = highlight ? C.orange : folder ? C.cream : C.mid;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        paddingLeft: 4 + depth * 16,
        paddingTop: 4,
        paddingBottom: 4,
        opacity: op,
        transform: `translateX(${slideX}px)`,
        backgroundColor: highlight ? `${C.orange}0D` : "transparent",
        borderRadius: 4,
        marginRight: 4,
      }}
    >
      {folder ? <FolderIcon color={iconColor} /> : <FileIcon color={iconColor} />}
      <span
        style={{
          fontSize: 11,
          color: textColor,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: highlight ? 700 : 400,
          letterSpacing: 0.1,
        }}
      >
        {name}
      </span>
    </div>
  );
};

// ─── Full repo card with file tree ───
const FileTreeCard: React.FC<(typeof REPO_DATA)[0]> = ({
  name, org, lang, langColor, tests, x, cardAt, ciAt, tree,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const treeStartAt = cardAt + 18;

  const cardScale = spring({
    frame: Math.max(0, frame - cardAt),
    fps,
    config: { damping: 13, stiffness: 105 },
  });
  const cardOp = fi(frame, cardAt, 12);

  const badgeScale = spring({
    frame: Math.max(0, frame - ciAt),
    fps,
    config: { damping: 9, stiffness: 175 },
  });
  const badgeOp = fi(frame, ciAt, 12);

  return (
    <div style={{ position: "absolute", left: x, top: CARD_TOP }}>
      <div
        style={{
          width: CARD_W,
          opacity: cardOp,
          transform: `scale(${Math.max(0, cardScale)})`,
          transformOrigin: "top center",
        }}
      >
        {/* Card body */}
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "15px 16px 12px",
            boxShadow: "0 10px 48px rgba(0,0,0,0.55)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 10 }}>
            <div style={{ paddingTop: 2 }}>
              <GitHubIcon size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.dim,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                {org} /
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.cream,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: -0.3,
                  lineHeight: 1,
                }}
              >
                {name}
              </div>
            </div>
            {/* Language pill — top right */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: `${langColor}18`,
                border: `1px solid ${langColor}40`,
                borderRadius: 6,
                padding: "3px 8px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: langColor,
                  boxShadow: `0 0 5px ${langColor}80`,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: langColor,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {lang}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: C.border, marginBottom: 8 }} />

          {/* File tree */}
          <div>
            {tree.map((row, i) => (
              <TreeRow
                key={i}
                {...row}
                appearAt={treeStartAt + i * TREE_STAGGER}
              />
            ))}
          </div>

          {/* Repo URL footer */}
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${C.border}`,
              fontSize: 9,
              color: C.dim,
              fontFamily: "'JetBrains Mono', monospace",
              opacity: fi(frame, treeStartAt + tree.length * TREE_STAGGER, 12),
            }}
          >
            github.com/{org}/{name}
          </div>
        </div>

        {/* CI badge */}
        {frame >= ciAt - 5 && (
          <div
            style={{
              marginTop: BADGE_GAP,
              opacity: badgeOp,
              transform: `scale(${Math.max(0, badgeScale)})`,
              transformOrigin: "top center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                backgroundColor: `${C.green}16`,
                border: `1px solid ${C.green}50`,
                borderRadius: 8,
                padding: "7px 14px",
                height: BADGE_H,
                boxSizing: "border-box",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="5.5" fill={C.green} opacity={0.2} />
                <circle cx="6" cy="6" r="5.5" stroke={C.green} strokeWidth="1" fill="none" />
                <path
                  d="M3 6 L5 8.2 L9.2 3.8"
                  stroke={C.green}
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  color: C.green,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {tests} tests passing
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── "Three isolated codebases" separator row ───
const SeparationNote: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: "absolute",
      top: CARD_TOP + CARD_H_APPROX + BADGE_GAP + BADGE_H + 26,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      opacity,
      pointerEvents: "none",
    }}
  >
    <div style={{ flex: 1, maxWidth: 200, height: 1, background: `linear-gradient(to right, transparent, ${C.dim}50)` }} />
    <span
      style={{
        fontSize: 12,
        color: C.dim,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        letterSpacing: 0.6,
        whiteSpace: "nowrap",
      }}
    >
      THREE ISOLATED CODEBASES — NO SHARED CONTEXT
    </span>
    <div style={{ flex: 1, maxWidth: 200, height: 1, background: `linear-gradient(to left, transparent, ${C.dim}50)` }} />
  </div>
);

// ─── Animated SVG arrow ───
const Arrow: React.FC<{
  d: string; length: number; drawStart: number; drawEnd: number; isError: boolean;
}> = ({ d, length, drawStart, drawEnd, isError }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const dashOffset = length * (1 - progress);
  const color = isError ? C.red : C.teal;
  const pulse = Math.sin(frame * 0.18) * 0.5 + 0.5;

  return (
    <g>
      {isError && (
        <path d={d} stroke={C.red} strokeWidth={8} strokeDasharray={length}
          strokeDashoffset={0} fill="none" strokeLinecap="round"
          opacity={0.08 + pulse * 0.08} />
      )}
      <path d={d} stroke={color} strokeWidth={2}
        strokeDasharray={length} strokeDashoffset={dashOffset}
        fill="none" strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

// ─── Integration Hub ───
const Hub: React.FC<{ appearAt: number; errorAt: number }> = ({ appearAt, errorAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame: Math.max(0, frame - appearAt), fps, config: { damping: 11, stiffness: 90 } });
  const op    = interpolate(frame, [appearAt, appearAt + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const isError = frame >= errorAt;
  const pulse   = Math.sin(frame * 0.16) * 0.5 + 0.5;
  const borderColor = isError ? `rgba(255,72,72,${0.55 + pulse * 0.45})` : `${C.teal}90`;
  const bg          = isError ? `${C.red}16` : `${C.teal}10`;
  const glowSize    = isError ? 16 + pulse * 20 : 12;
  const glowColor   = isError ? C.red : C.teal;

  return (
    <div
      style={{
        position: "absolute",
        left: HUB_CX - HUB_W / 2,
        top: HUB_CY - HUB_H / 2,
        width: HUB_W,
        height: HUB_H,
        opacity: op,
        transform: `scale(${Math.max(0, scale)})`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          width: "100%", height: "100%",
          backgroundColor: bg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 11,
          boxShadow: `0 0 ${glowSize}px ${glowColor}50`,
        }}
      >
        {isError ? (
          <>
            <svg width="22" height="20" viewBox="0 0 22 20">
              <path d="M11 1 L21 19 L1 19 Z" fill={`${C.red}28`} stroke={C.red} strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="11" y1="8" x2="11" y2="13.5" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
              <circle cx="11" cy="16.5" r="1.2" fill={C.red} />
            </svg>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.red, fontFamily: "'Inter', sans-serif", opacity: 0.9 + pulse * 0.1 }}>
              Contract Mismatch
            </span>
          </>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <circle cx="8.5" cy="8.5" r="7.5" stroke={C.teal} strokeWidth="1.2" opacity={0.5} />
              <path d="M8.5 12.5 L8.5 5.5 M6 8 L8.5 5.5 L11 8"
                stroke={C.teal} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.teal, fontFamily: "'Inter', sans-serif", opacity: 0.9 }}>
              Staging Deploy
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Mismatch detail popup (centered below hub) ───
const MismatchDetail: React.FC<{ appearAt: number }> = ({ appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: Math.max(0, frame - appearAt), fps, config: { damping: 11, stiffness: 110 } });
  const op    = interpolate(frame, [appearAt, appearAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const W = 500;

  return (
    <div
      style={{
        position: "absolute",
        left: HUB_CX - W / 2,
        top: HUB_CY + HUB_H / 2 + 20,
        width: W,
        opacity: op,
        transform: `scale(${Math.max(0, scale)})`,
        transformOrigin: "top center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "#1A0E0E",
          border: `1px solid ${C.red}40`,
          borderRadius: 12,
          padding: "15px 20px",
          boxShadow: `0 6px 30px rgba(255,72,72,0.18)`,
        }}
      >
        <div style={{ fontSize: 10, color: C.red, fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: 0.9, marginBottom: 11, opacity: 0.7 }}>
          API RESPONSE SHAPE
        </div>
        {/* Backend */}
        <div style={{ marginBottom: 9 }}>
          <div style={{ fontSize: 10, color: C.mid, fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: 5 }}>backend-api returns:</div>
          <div style={{ backgroundColor: "#0F0F0F", borderRadius: 7, padding: "7px 11px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.mid }}>
            {"{ "}
            <span style={{ color: "#E06C75" }}>response</span>
            {": { "}
            <span style={{ color: "#E06C75" }}>text</span>
            <span style={{ color: C.cream }}>: string</span>
            {" } }"}
          </div>
        </div>
        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "7px 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: `${C.red}28` }} />
          <span style={{ fontSize: 15, color: C.red, fontFamily: "'Inter', sans-serif", fontWeight: 700, opacity: 0.6 }}>≠</span>
          <div style={{ flex: 1, height: 1, backgroundColor: `${C.red}28` }} />
        </div>
        {/* Frontend */}
        <div>
          <div style={{ fontSize: 10, color: C.mid, fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: 5 }}>web-frontend reads:</div>
          <div style={{ backgroundColor: "#0F0F0F", borderRadius: 7, padding: "7px 11px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            <span style={{ color: C.cream }}>data.</span>
            <span style={{ color: C.red, textDecoration: "line-through", textDecorationColor: `${C.red}90` }}>result</span>
            <span style={{ color: C.red, marginLeft: 6, fontSize: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}> → undefined</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Production error badge ───
const ProductionError: React.FC<{ appearAt: number }> = ({ appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: Math.max(0, frame - appearAt), fps, config: { damping: 9, stiffness: 130 } });
  const op    = interpolate(frame, [appearAt, appearAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(frame * 0.2) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: HUB_CY + HUB_H / 2 + 195,
        transform: `translateX(-50%) scale(${Math.max(0, scale)})`,
        opacity: op,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          backgroundColor: `${C.red}18`,
          border: `1.5px solid ${C.red}`,
          borderRadius: 10,
          padding: "10px 24px",
          boxShadow: `0 0 ${14 + pulse * 14}px ${C.red}50`,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.red, opacity: 0.6 + pulse * 0.4, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: C.red, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: 0.2 }}>
          PRODUCTION — TypeError: Cannot read properties of undefined
        </span>
      </div>
    </div>
  );
};

// ─── CI all-green banner ───
const CIBanner: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: "absolute",
      bottom: 52,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 11,
        backgroundColor: `${C.green}10`,
        border: `1px solid ${C.green}35`,
        borderRadius: 10,
        padding: "11px 28px",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="6.5" fill={C.green} opacity={0.2} />
        <path d="M3.5 7 L6 9.8 L10.8 4.5" stroke={C.green} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 13, color: C.green, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
        All CI checks green · 298 tests passing · Ready to merge
      </span>
    </div>
  </div>
);

// ─── Page title ───
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y  = spring({ frame, fps, config: { damping: 14, stiffness: 75 } });
  const op = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        width: "100%",
        textAlign: "center",
        opacity: op,
        transform: `translateY(${(1 - y) * 26}px)`,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, color: C.cream, fontFamily: "'Inter', sans-serif", letterSpacing: -0.5 }}>
        Multi-Repository Architecture
      </div>
      <div style={{ fontSize: 15, color: C.dim, fontFamily: "'Inter', sans-serif", marginTop: 7 }}>
        Separate stacks · Isolated CI · Shared risks
      </div>
    </div>
  );
};

// ─── Main composition ───
export const MultiRepoVizV2: React.FC = () => {
  const frame = useCurrentFrame();

  const isError = frame >= T.errorStart;

  const ciBannerOp = interpolate(
    frame,
    [T.ciBanner, T.ciBanner + 14, T.errorStart - 18, T.errorStart],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const separationOp = interpolate(
    frame,
    [T.separationNote, T.separationNote + 16, T.arrowsStart - 16, T.arrowsStart],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fadeOut = interpolate(frame, [T.fadeOut, T.duration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const errorBleed = interpolate(frame, [T.errorStart, T.errorStart + 40], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.dark, opacity: fadeOut, overflow: "hidden" }}>

      {/* Grid */}
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `
            linear-gradient(${C.orange}55 1px, transparent 1px),
            linear-gradient(90deg, ${C.orange}55 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: isError
            ? `radial-gradient(ellipse at 50% 58%, ${C.red}${Math.round(errorBleed * 10).toString(16).padStart(2, "0")} 0%, transparent 55%)`
            : `radial-gradient(ellipse at 50% 18%, ${C.orange}07 0%, transparent 50%)`,
        }}
      />

      {/* Title */}
      <Title />

      {/* Repo cards */}
      {REPO_DATA.map((r) => (
        <FileTreeCard key={r.name} {...r} />
      ))}

      {/* SVG arrow layer */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1080 1080"
        preserveAspectRatio="none"
      >
        {PATHS.map((d, i) => (
          <Arrow
            key={i}
            d={d}
            length={PATH_LENGTHS[i]}
            drawStart={T.arrowsStart + i * 20}
            drawEnd={T.arrowsEnd + i * 20}
            isError={isError}
          />
        ))}
      </svg>

      {/* Integration hub */}
      {frame >= T.hubAppear && <Hub appearAt={T.hubAppear} errorAt={T.errorStart} />}

      {/* Mismatch detail */}
      {frame >= T.mismatchDetail && <MismatchDetail appearAt={T.mismatchDetail} />}

      {/* Separation note */}
      {separationOp > 0 && <SeparationNote opacity={separationOp} />}

      {/* CI banner */}
      {ciBannerOp > 0 && <CIBanner opacity={ciBannerOp} />}

      {/* Production error */}
      {frame >= T.prodError && <ProductionError appearAt={T.prodError} />}

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: isError
            ? `linear-gradient(90deg, ${C.red}80, ${C.red}, ${C.red}80)`
            : `linear-gradient(90deg, ${C.orange}, ${C.purple}, ${C.teal})`,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};
