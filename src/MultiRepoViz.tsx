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
  border: "#2D2D2D",
  cream: "#F2F1EB",
  dim: "#5A5A5A",
  mid: "#888888",
};

// ─── Layout Constants ───
// 3 repo cards, equally spaced across 1080px canvas
// Card W=300, margins=30px, gaps=60px → left edges: 30, 390, 750
const CARD_W = 300;
const CARD_H = 118;
const CARD_TOP = 150;
const BADGE_GAP = 9;
const BADGE_H = 36;
const ARROW_START_Y = CARD_TOP + CARD_H + BADGE_GAP + BADGE_H + 8; // ~321

// Hub dimensions
const HUB_CX = 540;
const HUB_CY = 560;
const HUB_W = 320;
const HUB_H = 76;
const HUB_TOP_Y = HUB_CY - HUB_H / 2; // 522

// Repo center-x values: [180, 540, 900]
const REPO_CX = [30 + CARD_W / 2, 390 + CARD_W / 2, 750 + CARD_W / 2];

// SVG cubic bezier paths: repo-bottom → hub-top (viewBox 1080×1080)
const PATHS = [
  `M ${REPO_CX[0]} ${ARROW_START_Y} C ${REPO_CX[0]} ${ARROW_START_Y + 110} ${HUB_CX} ${HUB_TOP_Y - 110} ${HUB_CX} ${HUB_TOP_Y}`,
  `M ${REPO_CX[1]} ${ARROW_START_Y} C ${REPO_CX[1]} ${ARROW_START_Y + 70} ${HUB_CX} ${HUB_TOP_Y - 70} ${HUB_CX} ${HUB_TOP_Y}`,
  `M ${REPO_CX[2]} ${ARROW_START_Y} C ${REPO_CX[2]} ${ARROW_START_Y + 110} ${HUB_CX} ${HUB_TOP_Y - 110} ${HUB_CX} ${HUB_TOP_Y}`,
];
// Slightly overestimate path lengths for safe strokeDashoffset animation
const PATH_LENGTHS = [600, 280, 600];

// ─── Timing constants (frames @ 30fps) ───
const T = {
  repo0: 0,
  repo1: 18,
  repo2: 36,
  ci0: 85,
  ci1: 103,
  ci2: 121,
  ciBanner: 148,
  hubAppear: 175,
  arrowsStart: 195,
  arrowsEnd: 245,
  errorStart: 268,
  mismatchDetail: 295,
  prodError: 325,
  fadeOut: 390,
  duration: 420,
};

// ─── Helpers ───
function fadeIn(frame: number, start: number, duration = 15) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function useSpring(frame: number, startAt: number, damping = 13, stiffness = 120) {
  const { fps } = useVideoConfig();
  return spring({
    frame: Math.max(0, frame - startAt),
    fps,
    config: { damping, stiffness },
  });
}

// ─── GitHub Icon SVG ───
const GitHubIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={C.cream} opacity={0.55}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

// ─── Repo Card ───
interface RepoConfig {
  name: string;
  org: string;
  lang: string;
  langColor: string;
  tests: number;
  x: number;
  appearAt: number;
  ciAt: number;
}

const REPOS: RepoConfig[] = [
  { name: "backend-api",  org: "acme", lang: "Python",      langColor: "#3776AB", tests: 142, x: 30,  appearAt: T.repo0, ciAt: T.ci0 },
  { name: "web-frontend", org: "acme", lang: "TypeScript",  langColor: "#3178C6", tests: 89,  x: 390, appearAt: T.repo1, ciAt: T.ci1 },
  { name: "mobile-app",   org: "acme", lang: "React Native",langColor: "#61DAFB", tests: 67,  x: 750, appearAt: T.repo2, ciAt: T.ci2 },
];

const RepoCard: React.FC<RepoConfig> = ({ name, org, lang, langColor, tests, x, appearAt, ciAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    frame: Math.max(0, frame - appearAt),
    fps,
    config: { damping: 13, stiffness: 110 },
  });
  const cardOpacity = fadeIn(frame, appearAt, 12);

  const badgeScale = spring({
    frame: Math.max(0, frame - ciAt),
    fps,
    config: { damping: 9, stiffness: 180 },
  });
  const badgeOpacity = fadeIn(frame, ciAt, 12);

  return (
    <div style={{ position: "absolute", left: x, top: CARD_TOP }}>
      {/* Card body */}
      <div
        style={{
          width: CARD_W,
          opacity: cardOpacity,
          transform: `scale(${Math.max(0, cardScale)})`,
          transformOrigin: "top center",
        }}
      >
        <div
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "18px 22px 16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
            <div style={{ paddingTop: 2 }}>
              <GitHubIcon size={17} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: C.dim,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: 0.4,
                  lineHeight: 1,
                  marginBottom: 4,
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
                  lineHeight: 1,
                  letterSpacing: -0.3,
                }}
              >
                {name}
              </div>
            </div>
          </div>

          {/* Language pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: langColor,
                flexShrink: 0,
                boxShadow: `0 0 6px ${langColor}80`,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: C.mid,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 0.2,
              }}
            >
              {lang}
            </span>
          </div>
        </div>

        {/* CI Badge */}
        {frame >= ciAt - 5 && (
          <div
            style={{
              marginTop: BADGE_GAP,
              opacity: badgeOpacity,
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
                backgroundColor: `${C.green}18`,
                border: `1px solid ${C.green}55`,
                borderRadius: 8,
                padding: "8px 15px",
                height: BADGE_H,
                boxSizing: "border-box",
              }}
            >
              {/* Checkmark icon */}
              <svg width="13" height="13" viewBox="0 0 13 13">
                <circle cx="6.5" cy="6.5" r="6" fill={C.green} opacity={0.22} />
                <circle cx="6.5" cy="6.5" r="6" stroke={C.green} strokeWidth="1" fill="none" />
                <path
                  d="M3.5 6.5 L5.5 8.5 L9.5 4.5"
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

// ─── Animated SVG Arrow ───
const Arrow: React.FC<{
  d: string;
  length: number;
  drawStart: number;
  drawEnd: number;
  isError: boolean;
}> = ({ d, length, drawStart, drawEnd, isError }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const dashOffset = length * (1 - progress);
  const color = isError ? C.red : C.teal;
  const glowOpacity = isError
    ? interpolate(frame, [T.errorStart, T.errorStart + 20], [0, 0.4], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <g>
      {/* Glow layer for error state */}
      {isError && (
        <path
          d={d}
          stroke={C.red}
          strokeWidth={8}
          strokeDasharray={length}
          strokeDashoffset={0}
          fill="none"
          strokeLinecap="round"
          opacity={glowOpacity * (0.6 + Math.sin(frame * 0.18) * 0.4)}
        />
      )}
      {/* Main arrow */}
      <path
        d={d}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={length}
        strokeDashoffset={dashOffset}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
    </g>
  );
};

// ─── Integration Hub ───
const Hub: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - T.hubAppear),
    fps,
    config: { damping: 11, stiffness: 95 },
  });
  const opacity = fadeIn(frame, T.hubAppear, 15);

  const isError = frame >= T.errorStart;
  const errorProgress = interpolate(frame, [T.errorStart, T.errorStart + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = Math.sin(frame * 0.16) * 0.5 + 0.5;
  const glowSize = isError ? 18 + pulse * 18 : 12;
  const glowColor = isError ? C.red : C.teal;
  const borderColor = isError
    ? `rgba(255, 72, 72, ${0.6 + pulse * 0.4})`
    : `${C.teal}90`;
  const bgColor = isError ? `${C.red}18` : `${C.teal}12`;

  return (
    <div
      style={{
        position: "absolute",
        left: HUB_CX - HUB_W / 2,
        top: HUB_CY - HUB_H / 2,
        width: HUB_W,
        height: HUB_H,
        opacity,
        transform: `scale(${Math.max(0, scale)})`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: bgColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 11,
          boxShadow: `0 0 ${glowSize}px ${glowColor}50`,
        }}
      >
        {isError ? (
          <>
            {/* Warning triangle */}
            <svg width="22" height="22" viewBox="0 0 22 20">
              <path
                d="M11 1 L21 19 L1 19 Z"
                fill={`${C.red}28`}
                stroke={C.red}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <line
                x1="11"
                y1="8"
                x2="11"
                y2="13.5"
                stroke={C.red}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="11" cy="16.5" r="1.2" fill={C.red} />
            </svg>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.red,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: -0.2,
                opacity: 0.9 + pulse * 0.1,
              }}
            >
              Contract Mismatch
            </span>
          </>
        ) : (
          <>
            {/* Deploy arrow icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke={C.teal} strokeWidth="1.2" opacity={0.5} />
              <path
                d="M9 13 L9 5.5 M6.5 8 L9 5.5 L11.5 8"
                stroke={C.teal}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: C.teal,
                fontFamily: "'Inter', sans-serif",
                opacity: 0.9,
              }}
            >
              Staging Deploy
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Mismatch Detail Popup ───
const MismatchDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - T.mismatchDetail),
    fps,
    config: { damping: 11, stiffness: 110 },
  });
  const opacity = fadeIn(frame, T.mismatchDetail, 12);

  const popupW = 500;
  const popupLeft = HUB_CX - popupW / 2;
  const popupTop = HUB_CY + HUB_H / 2 + 22;

  return (
    <div
      style={{
        position: "absolute",
        left: popupLeft,
        top: popupTop,
        width: popupW,
        opacity,
        transform: `scale(${Math.max(0, scale)})`,
        transformOrigin: "top center",
      }}
    >
      <div
        style={{
          backgroundColor: "#1A0E0E",
          border: `1px solid ${C.red}45`,
          borderRadius: 12,
          padding: "16px 20px",
          boxShadow: `0 6px 30px rgba(255,72,72,0.2)`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: C.red,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: 0.8,
            marginBottom: 12,
            opacity: 0.75,
          }}
        >
          API RESPONSE SHAPE
        </div>

        {/* Backend (old) */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: C.mid,
              fontFamily: "'Inter', sans-serif",
              marginBottom: 5,
              fontWeight: 500,
            }}
          >
            backend-api returns:
          </div>
          <div
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 7,
              padding: "8px 12px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: C.mid,
            }}
          >
            {"{ "}
            <span style={{ color: "#E06C75" }}>response</span>
            {": { "}
            <span style={{ color: "#E06C75" }}>text</span>
            <span style={{ color: C.cream }}>: string</span>
            {" } }"}
          </div>
        </div>

        {/* Divider with ≠ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "8px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: `${C.red}30` }} />
          <span
            style={{
              fontSize: 16,
              color: C.red,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            ≠
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: `${C.red}30` }} />
        </div>

        {/* Frontend (reading wrong field) */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: C.mid,
              fontFamily: "'Inter', sans-serif",
              marginBottom: 5,
              fontWeight: 500,
            }}
          >
            web-frontend reads:
          </div>
          <div
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 7,
              padding: "8px 12px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          >
            <span style={{ color: C.cream }}>data.</span>
            <span
              style={{
                color: C.red,
                textDecoration: "line-through",
                textDecorationColor: `${C.red}90`,
              }}
            >
              result
            </span>
            <span
              style={{
                color: C.red,
                marginLeft: 6,
                fontSize: 11,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
              }}
            >
              {" "}→ undefined
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

// ─── Production Error Badge ───
const ProductionError: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - T.prodError),
    fps,
    config: { damping: 9, stiffness: 130 },
  });
  const opacity = fadeIn(frame, T.prodError, 12);
  const pulse = Math.sin(frame * 0.2) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: HUB_CY + HUB_H / 2 + 195,
        transform: `translateX(-50%) scale(${Math.max(0, scale)})`,
        opacity,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          backgroundColor: `${C.red}1A`,
          border: `1.5px solid ${C.red}`,
          borderRadius: 10,
          padding: "11px 26px",
          boxShadow: `0 0 ${16 + pulse * 14}px ${C.red}50`,
        }}
      >
        {/* Pulsing dot */}
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            backgroundColor: C.red,
            opacity: 0.6 + pulse * 0.4,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 14,
            color: C.red,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          PRODUCTION — TypeError: Cannot read properties of undefined
        </span>
      </div>
    </div>
  );
};

// ─── CI All-Green Banner ───
const CIBanner: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: "absolute",
      bottom: 55,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      opacity,
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 11,
        backgroundColor: `${C.green}12`,
        border: `1px solid ${C.green}38`,
        borderRadius: 10,
        padding: "12px 30px",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 15 15">
        <circle cx="7.5" cy="7.5" r="7" fill={C.green} opacity={0.22} />
        <path
          d="M4 7.5 L6.5 10 L11 5"
          stroke={C.green}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: 13,
          color: C.green,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          letterSpacing: 0.1,
        }}
      >
        All CI checks green · 298 tests passing · Ready to merge
      </span>
    </div>
  </div>
);

// ─── Page Title ───
const PageTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const y = spring({ frame, fps, config: { damping: 14, stiffness: 75 } });
  const opacity = fadeIn(frame, 0, 20);

  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        width: "100%",
        textAlign: "center",
        opacity,
        transform: `translateY(${(1 - y) * 28}px)`,
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: C.cream,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: -0.5,
        }}
      >
        Multi-Repository Architecture
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
        Separate stacks · Isolated CI · Shared risks
      </div>
    </div>
  );
};

// ─── Main Composition ───
export const MultiRepoViz: React.FC = () => {
  const frame = useCurrentFrame();

  const isError = frame >= T.errorStart;

  // CI banner fades in then out as error takes over
  const ciBannerOpacity = interpolate(
    frame,
    [T.ciBanner, T.ciBanner + 15, T.errorStart - 20, T.errorStart],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Global fade out at end
  const fadeOut = interpolate(frame, [T.fadeOut, T.duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background error bleed
  const errorBleed = interpolate(frame, [T.errorStart, T.errorStart + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.dark, opacity: fadeOut }}>
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.045,
          backgroundImage: `
            linear-gradient(${C.orange}50 1px, transparent 1px),
            linear-gradient(90deg, ${C.orange}50 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }}
      />

      {/* Ambient glow: orange normally, red on error */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isError
            ? `radial-gradient(ellipse at 50% 62%, ${C.red}${Math.round(errorBleed * 10).toString(16).padStart(2, "0")} 0%, transparent 55%)`
            : `radial-gradient(ellipse at 50% 20%, ${C.orange}07 0%, transparent 50%)`,
        }}
      />

      {/* Page title */}
      <PageTitle />

      {/* Repo cards */}
      {REPOS.map((r) => (
        <RepoCard key={r.name} {...r} />
      ))}

      {/* SVG layer: animated arrows */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 1080 1080"
        preserveAspectRatio="none"
      >
        {PATHS.map((d, i) => (
          <Arrow
            key={i}
            d={d}
            length={PATH_LENGTHS[i]}
            drawStart={T.arrowsStart + i * 18}
            drawEnd={T.arrowsEnd + i * 18}
            isError={isError}
          />
        ))}
      </svg>

      {/* Integration hub */}
      {frame >= T.hubAppear && <Hub />}

      {/* Mismatch detail popup */}
      {frame >= T.mismatchDetail && <MismatchDetail />}

      {/* CI all-green banner */}
      {frame >= T.ciBanner && ciBannerOpacity > 0 && (
        <CIBanner opacity={ciBannerOpacity} />
      )}

      {/* Production error */}
      {frame >= T.prodError && <ProductionError />}

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: isError
            ? `linear-gradient(90deg, ${C.red}80, ${C.red}, ${C.red}80)`
            : `linear-gradient(90deg, ${C.orange}, ${C.purple}, ${C.teal})`,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};
