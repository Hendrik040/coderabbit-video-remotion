import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { loadFont as loadLato } from "@remotion/google-fonts/Lato";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: LATO } = loadLato("normal", { weights: ["400", "700", "900"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500"] });

// ---------------------------------------------------------------------------
// Slack dark-theme palette
// ---------------------------------------------------------------------------
const BG = "#1A1D21";
const SIDEBAR_BG = "#19171D";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#D1D2D3";
const DIM = "rgba(209,210,211,0.55)";
const FAINT = "rgba(209,210,211,0.35)";
const ACTIVE_BLUE = "#1164A3";
const LINK_BLUE = "#1D9BD1";
const CHIP_BG = "#232529";
const CHIP_BORDER = "#3E4045";
const CHIP_TEXT = "#E8912D";
const CR_ORANGE = "#FF570A";
const GREEN_BTN = "#1F9D61";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const SIDEBAR_W = 300;
const MAIN_W_FULL = 1920 - SIDEBAR_W; // 1620
const THREAD_W = 720;
const MAIN_W_NARROW = 1920 - SIDEBAR_W - THREAD_W; // 900
const HEADER_H = 56;
const MSG_MAX_W = 740;

// ---------------------------------------------------------------------------
// Script content
// ---------------------------------------------------------------------------
const MSG1 =
  "Security review flagged our API keys again — they're static, never expire, and we can't scope or revoke them per-client without breaking integrations 😬";
const MSG2 =
  "Yeah we should move to OAuth client credentials. WorkOS Connect handles the M2M side — short-lived JWTs, JWKS verification, org-scoped tokens. But we have ~40 production clients on keys, we can't just flip it";
const MSG3 =
  "Right, this needs a dual-support window and a deprecation plan. Order of operations really matters here. Should we book time to scope it?";

const PROMPT =
  "/plan Migrate our API authentication from static API keys to OAuth via WorkOS Connect M2M applications. Existing clients must keep working during a dual-support period — accept both auth methods, add deprecation warnings, then sunset keys. Token verification should use WorkOS JWKS. Out of scope: user-facing login, SSO.";
const PROMPT_BODY = PROMPT.slice("/plan ".length);

// ---------------------------------------------------------------------------
// Seeded random + typewriter char frames
// ---------------------------------------------------------------------------
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const TYPE_START = 400;

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let f = TYPE_START;
  for (let i = 0; i < PROMPT.length; i++) {
    frames.push(Math.round(f));
    if (i < 4) {
      f += 5; // "/plan" typed deliberately so the slash popover registers
    } else if (i === 4) {
      f += 16; // beat after "/plan" while popover is up
    } else if (PROMPT[i] === " " && seededRandom(i * 13 + 5) > 0.82) {
      f += 5; // occasional thinking pause at a word boundary
    } else {
      f += 0.45 + seededRandom(i * 31 + 7) * 0.4; // fast natural typing
    }
  }
  return frames;
};

const CHAR_FRAMES = computeCharFrames();
const TYPE_END = CHAR_FRAMES[CHAR_FRAMES.length - 1];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const T_MSG1 = 18;
const T_MSG2 = 140;
const T_MSG3 = 290;
const T_SEND = TYPE_END + 20;
const T_CR_MSG = T_SEND + 8;
const T_THREAD = T_CR_MSG + 26;
const T_WORKING = T_THREAD + 26;
const T_PLAN = T_WORKING + 105;
const S_SCOPE = T_PLAN + 18;
const S_P1 = S_SCOPE + 42;
const S_P2 = S_P1 + 36;
const S_P3 = S_P2 + 36;
const S_NG = S_P3 + 30;
const S_BTN = S_NG + 28;

export const PLAN_SLACK_DEMO_TOTAL_FRAMES = S_BTN + 180;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fi(frame: number, start: number, dur = 12) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function riseIn(frame: number, start: number, dur = 12): React.CSSProperties {
  const op = fi(frame, start, dur);
  const ty = interpolate(frame, [start, start + dur], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: op, transform: `translateY(${ty}px)` };
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const InitialsAvatar: React.FC<{ bg: string; initials: string; size?: number }> = ({
  bg,
  initials,
  size = 40,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 8,
      backgroundColor: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#FFFFFF",
      fontFamily: LATO,
      fontWeight: 900,
      fontSize: size * 0.4,
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);

const CRAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 8,
      backgroundColor: CR_ORANGE,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden",
    }}
  >
    <Img
      src={staticFile("cr-logo.png")}
      style={{ width: "86%", height: "86%", objectFit: "contain" }}
    />
  </div>
);

const AppBadge: React.FC = () => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: DIM,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderRadius: 3,
      padding: "1px 5px",
      marginLeft: 6,
      letterSpacing: 0.3,
      position: "relative",
      top: -1,
    }}
  >
    APP
  </span>
);

const Chip: React.FC<{ children: React.ReactNode; glow?: number }> = ({
  children,
  glow = 0,
}) => (
  <span
    style={{
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: "0.86em",
      color: CHIP_TEXT,
      backgroundColor: CHIP_BG,
      border: `1px solid ${glow > 0.02 ? `rgba(255,135,42,${0.3 + glow * 0.7})` : CHIP_BORDER}`,
      borderRadius: 4,
      padding: "0px 5px",
      whiteSpace: "nowrap",
      boxShadow: glow > 0.02 ? `0 0 ${10 * glow}px rgba(255,120,30,${0.55 * glow})` : "none",
    }}
  >
    {children}
  </span>
);

const Mention: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      color: "#FCE9B8",
      backgroundColor: "rgba(242,199,68,0.28)",
      borderRadius: 4,
      padding: "0px 3px",
    }}
  >
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
const CHANNELS = ["general", "engineering", "platform-eng", "security", "releases"];

const Sidebar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: SIDEBAR_W,
      height: 1080,
      backgroundColor: SIDEBAR_BG,
      borderRight: `1px solid ${BORDER}`,
      fontFamily: LATO,
      paddingTop: 14,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        padding: "8px 18px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 19 }}>Acme Inc</span>
      <span style={{ color: DIM, fontSize: 13 }}>▾</span>
    </div>

    <div style={{ padding: "18px 10px 6px 18px", color: DIM, fontSize: 14.5 }}>
      <span style={{ marginRight: 7, fontSize: 11 }}>▾</span>Channels
    </div>
    {CHANNELS.map((c) => {
      const active = c === "platform-eng";
      return (
        <div
          key={c}
          style={{
            margin: "0 8px",
            padding: "5px 12px",
            borderRadius: 6,
            backgroundColor: active ? ACTIVE_BLUE : "transparent",
            color: active ? "#FFFFFF" : DIM,
            fontSize: 15.5,
            fontWeight: active ? 700 : 400,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ opacity: active ? 0.95 : 0.6, fontWeight: 400 }}>#</span>
          {c}
        </div>
      );
    })}

    <div style={{ padding: "22px 10px 6px 18px", color: DIM, fontSize: 14.5 }}>
      <span style={{ marginRight: 7, fontSize: 11 }}>▾</span>Apps
    </div>
    <div
      style={{
        margin: "0 8px",
        padding: "5px 12px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        color: DIM,
        fontSize: 15.5,
      }}
    >
      <CRAvatar size={20} />
      CodeRabbit
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Channel message
// ---------------------------------------------------------------------------
const Message: React.FC<{
  frame: number;
  at: number;
  avatar: React.ReactNode;
  name: string;
  time: string;
  app?: boolean;
  children: React.ReactNode;
}> = ({ frame, at, avatar, name, time, app, children }) => (
  <div
    style={{
      display: "flex",
      gap: 12,
      padding: "7px 0",
      ...riseIn(frame, at),
      visibility: frame >= at ? "visible" : "hidden",
    }}
  >
    {avatar}
    <div style={{ minWidth: 0 }}>
      <div style={{ lineHeight: "20px" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 16.5 }}>{name}</span>
        {app && <AppBadge />}
        <span style={{ color: FAINT, fontSize: 12.5, marginLeft: 8 }}>{time}</span>
      </div>
      <div
        style={{
          color: TEXT,
          fontSize: 16.5,
          lineHeight: 1.46,
          maxWidth: MSG_MAX_W,
          marginTop: 2,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

const DateDivider: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0 6px" }}>
    <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "3px 12px",
        color: TEXT,
        fontSize: 12.5,
        fontWeight: 700,
      }}
    >
      Today
    </div>
    <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
  </div>
);

// ---------------------------------------------------------------------------
// Quote block (prompt echo)
// ---------------------------------------------------------------------------
const QuoteBlock: React.FC<{ small?: boolean }> = ({ small }) => (
  <div
    style={{
      borderLeft: "4px solid #4A4D52",
      paddingLeft: 12,
      marginTop: 6,
      color: DIM,
      fontSize: small ? 13.5 : 15,
      lineHeight: 1.45,
      maxWidth: MSG_MAX_W - 20,
    }}
  >
    {PROMPT_BODY}
  </div>
);

// ---------------------------------------------------------------------------
// Composer + slash popover
// ---------------------------------------------------------------------------
const SlashPopover: React.FC<{ frame: number }> = ({ frame }) => {
  const inAt = CHAR_FRAMES[1]; // "/p" typed
  const outAt = CHAR_FRAMES[6]; // first char after "/plan " — autocomplete gone
  const op =
    fi(frame, inAt, 6) *
    interpolate(frame, [outAt - 4, outAt + 2], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: "100%",
        marginBottom: 10,
        width: 560,
        backgroundColor: "#222529",
        border: `1px solid ${CHIP_BORDER}`,
        borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        opacity: op,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          fontSize: 11.5,
          fontWeight: 700,
          color: FAINT,
          letterSpacing: 0.4,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        SLASH COMMANDS
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          backgroundColor: "rgba(17,100,163,0.35)",
        }}
      >
        <CRAvatar size={26} />
        <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 15 }}>/plan</span>
        <span style={{ color: DIM, fontSize: 14 }}>
          Plan work from this conversation
        </span>
        <span style={{ color: FAINT, fontSize: 13, marginLeft: "auto" }}>CodeRabbit</span>
      </div>
    </div>
  );
};

const Composer: React.FC<{ frame: number }> = ({ frame }) => {
  const charsVisible =
    frame >= T_SEND ? 0 : CHAR_FRAMES.filter((f) => frame >= f).length;
  const displayText = PROMPT.slice(0, charsVisible);
  const typing = frame >= TYPE_START && frame < T_SEND;
  const cursorOn = Math.floor(frame / 14) % 2 === 0;
  const hasText = displayText.length > 0;

  return (
    <div style={{ position: "absolute", left: 28, right: 28, bottom: 26 }}>
      <SlashPopover frame={frame} />
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: 12,
          backgroundColor: "#222529",
          padding: "12px 14px 10px",
        }}
      >
        <div
          style={{
            minHeight: 24,
            fontSize: 16,
            lineHeight: 1.5,
            color: hasText ? TEXT : FAINT,
            fontFamily: LATO,
            wordBreak: "break-word",
          }}
        >
          {hasText ? displayText : "Message #platform-eng"}
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 18,
              backgroundColor: "#FFFFFF",
              verticalAlign: "text-bottom",
              marginLeft: 1,
              visibility: typing && cursorOn ? "visible" : "hidden",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 10,
            color: FAINT,
            fontSize: 15,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            +
          </span>
          <span style={{ fontWeight: 700 }}>Aa</span>
          <span>@</span>
          <span>☺</span>
          <span
            style={{
              marginLeft: "auto",
              width: 30,
              height: 26,
              borderRadius: 5,
              backgroundColor: hasText ? "#007A5A" : "rgba(255,255,255,0.08)",
              color: hasText ? "#FFFFFF" : FAINT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            ➤
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Working pill (spinner + shimmer)
// ---------------------------------------------------------------------------
const WorkingPill: React.FC<{ frame: number }> = ({ frame }) => {
  const op =
    fi(frame, T_WORKING, 10) *
    interpolate(frame, [T_PLAN - 10, T_PLAN - 2], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  if (op <= 0.01) return null;
  const shimmerX = interpolate((frame - T_WORKING) % 50, [0, 50], [120, -120]);
  return (
    <div style={{ opacity: op }}>
      <div
        style={{
          border: `1px solid ${CHIP_BORDER}`,
          borderRadius: 10,
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          maxWidth: 560,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            transform: `rotate(${frame * 9}deg)`,
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle
              cx="9"
              cy="9"
              r="7"
              fill="none"
              stroke="#9A9CA0"
              strokeWidth="2.4"
              strokeDasharray="26 18"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            backgroundImage:
              "linear-gradient(90deg, #85878B 30%, #FFFFFF 50%, #85878B 70%)",
            backgroundSize: "200% 100%",
            backgroundPositionX: `${shimmerX}%`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Working…
        </span>
        <span style={{ marginLeft: "auto", color: FAINT, fontSize: 13 }}>▾</span>
      </div>
      <div
        style={{
          marginTop: 12,
          display: "inline-block",
          backgroundColor: "#C61E51",
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: 13.5,
          borderRadius: 7,
          padding: "7px 16px",
        }}
      >
        Cancel
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Plan message (thread)
// ---------------------------------------------------------------------------
const Section: React.FC<{
  frame: number;
  at: number;
  children: React.ReactNode;
}> = ({ frame, at, children }) => (
  <div style={{ ...riseIn(frame, at), visibility: frame >= at ? "visible" : "hidden" }}>
    {children}
  </div>
);

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
    <span style={{ color: FAINT }}>•</span>
    <span>{children}</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: "#FFFFFF", fontWeight: 900 }}>{children}</span>
);

const PlanMessage: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T_PLAN) return null;
  // money-shot glow: pulses on the scope chips right after they appear
  const glow =
    fi(frame, S_SCOPE + 12, 18) *
    interpolate(frame, [S_SCOPE + 70, S_SCOPE + 100], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const btnScale = interpolate(frame, [S_BTN, S_BTN + 16], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });

  const body: React.CSSProperties = {
    color: TEXT,
    fontSize: 15,
    lineHeight: 1.5,
  };

  return (
    <div style={{ display: "flex", gap: 12, ...riseIn(frame, T_PLAN) }}>
      <CRAvatar />
      <div style={{ minWidth: 0, ...body }}>
        <div style={{ lineHeight: "20px" }}>
          <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 16 }}>CodeRabbit</span>
          <AppBadge />
          <span style={{ color: FAINT, fontSize: 12.5, marginLeft: 8 }}>10:09 AM</span>
        </div>

        <div style={{ marginTop: 2 }}>Here's the implementation plan.</div>

        <Section frame={frame} at={S_SCOPE}>
          <div style={{ marginTop: 12 }}>
            <SectionTitle>API auth migration — static keys → WorkOS Connect M2M</SectionTitle>
          </div>
          <div style={{ marginTop: 10 }}>
            <SectionTitle>Repository scope</SectionTitle> — <Chip>api-server</Chip>
            <div style={{ marginTop: 4 }}>
              Touches <Chip glow={glow}>middleware/apiKeyAuth.ts</Chip>,{" "}
              <Chip>routes/admin/apiKeys.ts</Chip> and the{" "}
              <Chip glow={glow}>api_keys</Chip> table
            </div>
          </div>
        </Section>

        <Section frame={frame} at={S_P1}>
          <div style={{ marginTop: 12 }}>
            <SectionTitle>Phase 1 — Dual support</SectionTitle>
            <Bullet>
              Accept WorkOS M2M JWTs alongside static keys in{" "}
              <Chip>middleware/apiKeyAuth.ts</Chip>
            </Bullet>
            <Bullet>Verify tokens against WorkOS JWKS; cache signing keys</Bullet>
          </div>
        </Section>

        <Section frame={frame} at={S_P2}>
          <div style={{ marginTop: 12 }}>
            <SectionTitle>Phase 2 — Migration window</SectionTitle>
            <Bullet>
              Add <Chip>Deprecation</Chip> headers + log warnings on key-based requests
            </Bullet>
            <Bullet>Migrate ~40 production clients to OAuth client credentials</Bullet>
          </div>
        </Section>

        <Section frame={frame} at={S_P3}>
          <div style={{ marginTop: 12 }}>
            <SectionTitle>Phase 3 — Sunset</SectionTitle>
            <Bullet>
              Reject static keys, archive the <Chip>api_keys</Chip> table
            </Bullet>
          </div>
        </Section>

        <Section frame={frame} at={S_NG}>
          <div style={{ marginTop: 12 }}>
            <SectionTitle>Non-goals</SectionTitle> — user-facing login, SSO
          </div>
        </Section>

        <Section frame={frame} at={S_BTN}>
          <div
            style={{
              marginTop: 16,
              display: "inline-block",
              backgroundColor: GREEN_BTN,
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 14.5,
              borderRadius: 7,
              padding: "9px 18px",
              transform: `scale(${btnScale})`,
              transformOrigin: "left center",
            }}
          >
            Implement final plan
          </div>
          <div
            style={{
              marginTop: 10,
              color: FAINT,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: `1.5px solid ${FAINT}`,
                display: "inline-block",
              }}
            />
            Saved to Canvas — API auth migration plan
          </div>
        </Section>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Thread panel
// ---------------------------------------------------------------------------
const ThreadPanel: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T_THREAD) return null;
  const slideX = interpolate(frame, [T_THREAD, T_THREAD + 20], [THREAD_W, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: THREAD_W,
        height: 1080,
        backgroundColor: BG,
        borderLeft: `1px solid ${BORDER}`,
        transform: `translateX(${slideX}px)`,
        fontFamily: LATO,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: HEADER_H,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
        }}
      >
        <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 17 }}>Thread</span>
        <span style={{ color: DIM, fontSize: 13.5 }}># platform-eng</span>
        <span style={{ marginLeft: "auto", color: DIM, fontSize: 17 }}>✕</span>
      </div>

      <div style={{ padding: "18px 22px" }}>
        {/* Root message */}
        <div style={{ display: "flex", gap: 12 }}>
          <CRAvatar />
          <div style={{ minWidth: 0 }}>
            <div style={{ lineHeight: "20px" }}>
              <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 16 }}>
                CodeRabbit
              </span>
              <AppBadge />
              <span style={{ color: FAINT, fontSize: 12.5, marginLeft: 8 }}>10:08 AM</span>
            </div>
            <div style={{ color: TEXT, fontSize: 15, lineHeight: 1.5, marginTop: 2 }}>
              Planning request from <Mention>@Alex Kim</Mention>. I will continue in this
              thread.
            </div>
            <div style={{ color: DIM, fontSize: 13.5, marginTop: 8, fontWeight: 700 }}>
              Prompt:
            </div>
            <QuoteBlock small />
          </div>
        </div>

        {/* replies divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "16px 0",
            color: FAINT,
            fontSize: 12.5,
          }}
        >
          <span style={{ color: LINK_BLUE }}>
            {frame >= T_PLAN ? "2 replies" : "1 reply"}
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
        </div>

        <WorkingPill frame={frame} />
        <PlanMessage frame={frame} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const PlanSlackDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const mainW = interpolate(frame, [T_THREAD, T_THREAD + 20], [MAIN_W_FULL, MAIN_W_NARROW], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: LATO, overflow: "hidden" }}>
      <Sidebar />

      {/* Main channel column */}
      <div
        style={{
          position: "absolute",
          left: SIDEBAR_W,
          top: 0,
          width: mainW,
          height: 1080,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: HEADER_H,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
          }}
        >
          <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 18 }}>
            # platform-eng
          </span>
          <span style={{ color: FAINT, fontSize: 13.5 }}>
            API platform · 14 members
          </span>
        </div>

        {/* Messages */}
        <div style={{ padding: "10px 24px 0" }}>
          <DateDivider />

          <Message
            frame={frame}
            at={T_MSG1}
            avatar={<InitialsAvatar bg="#7C3AED" initials="SC" />}
            name="Sarah Chen"
            time="10:02 AM"
          >
            {MSG1}
          </Message>

          <Message
            frame={frame}
            at={T_MSG2}
            avatar={<InitialsAvatar bg="#0E7490" initials="DP" />}
            name="Dev Patel"
            time="10:04 AM"
          >
            {MSG2}
          </Message>

          <Message
            frame={frame}
            at={T_MSG3}
            avatar={<InitialsAvatar bg="#7C3AED" initials="SC" />}
            name="Sarah Chen"
            time="10:06 AM"
          >
            {MSG3}
          </Message>

          <Message
            frame={frame}
            at={T_CR_MSG}
            avatar={<CRAvatar />}
            name="CodeRabbit"
            time="10:08 AM"
            app
          >
            Planning request from <Mention>@Alex Kim</Mention>. I will continue in this
            thread.
            <div style={{ color: DIM, fontSize: 13.5, marginTop: 8, fontWeight: 700 }}>
              Prompt:
            </div>
            <QuoteBlock small />
          </Message>
        </div>

        <Composer frame={frame} />
      </div>

      <ThreadPanel frame={frame} />
    </AbsoluteFill>
  );
};
