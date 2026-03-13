import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// CodeRabbit Brand Colors
const COLORS = {
  orange: "#FF570A",
  green: "#25E2A8",
  purple: "#838BFF",
  dark: "#171717",
  darkCard: "#1E1E1E",
  darkInput: "#2A2A2A",
  cream: "#F6F6F1",
  dimText: "#888888",
};

// The browser window is 1100px wide, centered in 1920.
// Left edge of browser = (1920-1100)/2 = 410. Sidebar is 220px.
// So content area starts at ~630px from left. Inputs are ~48px padding inside.
// Vertically, browser is centered in 1080. Browser chrome ~40px top bar.
// We estimate the vertical center: browser height ~540px → top = (1080-540)/2 = 270.
// Coordinates below are absolute to the 1920x1080 canvas.
const BX = 410; // browser left edge
const BY = 250; // browser top edge (approx centered)
const CX = BX + 220 + 48; // content area left (sidebar + padding)

// ─── Cursor waypoints ───
// Each waypoint: [frame, x, y, click?]
const WAYPOINTS: [number, number, number, boolean][] = [
  [30, 1500, 200, false],        // appear top-right
  [70, CX + 200, BY + 195, false],   // move to name input
  [85, CX + 200, BY + 195, true],    // click name input
  [160, CX + 200, BY + 195, false],  // idle while typing
  [175, CX + 200, BY + 295, false],  // move to email input
  [190, CX + 200, BY + 295, true],   // click email input
  [260, CX + 200, BY + 295, false],  // idle while typing
  [280, CX + 70, BY + 395, false],   // move to Save button
  [295, CX + 70, BY + 395, true],    // click Save button
  [380, CX + 70, BY + 395, false],   // idle on button
  [420, 960, 540, false],            // center for screenshot
];

function getCursorPos(frame: number): { x: number; y: number } {
  // Find surrounding waypoints
  let prev = WAYPOINTS[0];
  let next = WAYPOINTS[WAYPOINTS.length - 1];
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (frame >= WAYPOINTS[i][0] && frame <= WAYPOINTS[i + 1][0]) {
      prev = WAYPOINTS[i];
      next = WAYPOINTS[i + 1];
      break;
    }
  }
  if (frame <= WAYPOINTS[0][0]) return { x: WAYPOINTS[0][1], y: WAYPOINTS[0][2] };
  if (frame >= WAYPOINTS[WAYPOINTS.length - 1][0])
    return { x: next[1], y: next[2] };

  const t = interpolate(frame, [prev[0], next[0]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return {
    x: prev[1] + (next[1] - prev[1]) * t,
    y: prev[2] + (next[2] - prev[2]) * t,
  };
}

function isClicking(frame: number): boolean {
  for (const wp of WAYPOINTS) {
    if (wp[3] && Math.abs(frame - wp[0]) < 6) return true;
  }
  return false;
}

// ─── Agent Cursor ───
const AgentCursor: React.FC<{ x: number; y: number; clicking: boolean; opacity: number }> = ({
  x,
  y,
  clicking,
  opacity,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clickScale = clicking
    ? spring({ frame: frame % 12, fps, config: { damping: 8, stiffness: 200 } })
    : 1;

  // Click ripple
  const rippleOpacity = clicking ? interpolate(frame % 12, [0, 11], [0.6, 0]) : 0;
  const rippleScale = clicking ? interpolate(frame % 12, [0, 11], [0, 2]) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        pointerEvents: "none",
        zIndex: 1000,
        transform: `translate(-2px, -2px)`,
      }}
    >
      {/* Click ripple */}
      <div
        style={{
          position: "absolute",
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: `2px solid ${COLORS.orange}`,
          opacity: rippleOpacity,
          transform: `translate(-13px, -13px) scale(${rippleScale})`,
        }}
      />
      {/* Cursor arrow */}
      <svg
        width="24"
        height="28"
        viewBox="0 0 24 28"
        style={{ transform: `scale(${clicking ? 0.85 : 1})`, transition: "transform 0.05s" }}
      >
        <path
          d="M2 2 L2 22 L8 16 L14 26 L18 24 L12 14 L20 14 Z"
          fill={COLORS.orange}
          stroke="#fff"
          strokeWidth="1.5"
        />
      </svg>
      {/* Agent label */}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 14,
          backgroundColor: COLORS.orange,
          color: "#fff",
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          letterSpacing: 0.5,
          boxShadow: `0 2px 8px ${COLORS.orange}60`,
        }}
      >
        Agent
      </div>
    </div>
  );
};

// ─── Mock Browser Chrome ───
const BrowserChrome: React.FC<{ children: React.ReactNode; opacity: number }> = ({
  children,
  opacity,
}) => {
  return (
    <div
      style={{
        width: 1100,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid #333`,
        boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
        opacity,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          backgroundColor: "#2A2A2A",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28C840" }} />
        <div
          style={{
            flex: 1,
            marginLeft: 16,
            backgroundColor: "#1A1A1A",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            color: COLORS.dimText,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          https://app.acme.io/settings/profile
        </div>
      </div>
      {/* Page content */}
      <div style={{ backgroundColor: COLORS.darkCard, minHeight: 500 }}>{children}</div>
    </div>
  );
};

// ─── Mock App Page ───
const MockAppPage: React.FC<{
  nameValue: string;
  emailValue: string;
  nameFocused: boolean;
  emailFocused: boolean;
  buttonState: "idle" | "loading" | "success";
  toastVisible: boolean;
}> = ({ nameValue, emailValue, nameFocused, emailFocused, buttonState, toastVisible }) => {
  const frame = useCurrentFrame();

  const spinnerAngle = frame * 8;

  return (
    <div style={{ position: "relative" }}>
      {/* Sidebar + Content layout */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 220,
            backgroundColor: "#1A1A1A",
            padding: "24px 0",
            borderRight: "1px solid #333",
            minHeight: 500,
          }}
        >
          {["Dashboard", "Profile", "Billing", "Team", "Settings"].map((item, i) => (
            <div
              key={item}
              style={{
                padding: "10px 24px",
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                color: i === 1 ? COLORS.orange : COLORS.dimText,
                backgroundColor: i === 1 ? `${COLORS.orange}12` : "transparent",
                borderLeft: i === 1 ? `3px solid ${COLORS.orange}` : "3px solid transparent",
                fontWeight: i === 1 ? 600 : 400,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "36px 48px" }}>
          <h2
            style={{
              fontSize: 24,
              fontFamily: "'Inter', sans-serif",
              color: COLORS.cream,
              fontWeight: 700,
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            Profile Settings
          </h2>
          <p
            style={{
              fontSize: 14,
              color: COLORS.dimText,
              fontFamily: "'Inter', sans-serif",
              marginBottom: 32,
              marginTop: 0,
            }}
          >
            Update your personal information and preferences.
          </p>

          {/* Name field */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: COLORS.cream,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Display Name
            </label>
            <div
              style={{
                backgroundColor: COLORS.darkInput,
                border: `1.5px solid ${nameFocused ? COLORS.orange : "#444"}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 15,
                fontFamily: "'Inter', sans-serif",
                color: COLORS.cream,
                minHeight: 20,
                boxShadow: nameFocused ? `0 0 0 3px ${COLORS.orange}25` : "none",
              }}
            >
              {nameValue || (
                <span style={{ color: "#555" }}>Enter your name</span>
              )}
              {nameFocused && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 16,
                    backgroundColor: COLORS.orange,
                    marginLeft: 1,
                    opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                    verticalAlign: "text-bottom",
                  }}
                />
              )}
            </div>
          </div>

          {/* Email field */}
          <div style={{ marginBottom: 32 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: COLORS.cream,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <div
              style={{
                backgroundColor: COLORS.darkInput,
                border: `1.5px solid ${emailFocused ? COLORS.orange : "#444"}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 15,
                fontFamily: "'Inter', sans-serif",
                color: COLORS.cream,
                minHeight: 20,
                boxShadow: emailFocused ? `0 0 0 3px ${COLORS.orange}25` : "none",
              }}
            >
              {emailValue || (
                <span style={{ color: "#555" }}>Enter your email</span>
              )}
              {emailFocused && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 16,
                    backgroundColor: COLORS.orange,
                    marginLeft: 1,
                    opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                    verticalAlign: "text-bottom",
                  }}
                />
              )}
            </div>
          </div>

          {/* Save button */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor:
                buttonState === "success" ? COLORS.green : COLORS.orange,
              color: "#fff",
              fontSize: 15,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              padding: "11px 32px",
              borderRadius: 10,
              cursor: "pointer",
              boxShadow:
                buttonState === "success"
                  ? `0 0 20px ${COLORS.green}40`
                  : `0 0 20px ${COLORS.orange}30`,
            }}
          >
            {buttonState === "loading" && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                style={{ transform: `rotate(${spinnerAngle}deg)` }}
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="28"
                  strokeDashoffset="8"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {buttonState === "success" && (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M3 8 L6.5 11.5 L13 4.5"
                  stroke="#fff"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {buttonState === "loading"
              ? "Saving..."
              : buttonState === "success"
              ? "Saved!"
              : "Save Changes"}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {toastVisible && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "#1A2E1A",
            border: `1px solid ${COLORS.green}50`,
            borderRadius: 10,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="9" fill={COLORS.green} />
            <path
              d="M5 9 L8 12 L13 6"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 14,
              color: COLORS.green,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}
          >
            Profile updated successfully
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Test Passed Overlay ───
const TestPassedOverlay: React.FC<{ opacity: number; scale: number }> = ({
  opacity,
  scale,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        opacity,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 16,
        }}
      />
      {/* Badge */}
      <div
        style={{
          position: "relative",
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill={COLORS.green} opacity={0.15} />
          <circle
            cx="40"
            cy="40"
            r="30"
            fill={COLORS.green}
            opacity={0.9}
          />
          <path
            d="M24 40 L35 51 L56 29"
            stroke="#fff"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 28,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            color: COLORS.green,
            letterSpacing: 1,
          }}
        >
          TEST PASSED
        </span>
      </div>
    </div>
  );
};

// ─── Main Composition ───
export const CustomerQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── Timings ──
  const UI_APPEAR = 0;
  const CURSOR_APPEAR = 30;
  const NAME_FOCUS = 85;
  const NAME_TYPE_START = 95;
  const NAME_TYPE_END = 155;
  const EMAIL_FOCUS = 190;
  const EMAIL_TYPE_START = 200;
  const EMAIL_TYPE_END = 255;
  const BUTTON_CLICK = 295;
  const BUTTON_LOADING = 305;
  const BUTTON_SUCCESS = 340;
  const TOAST_APPEAR = 345;
  const TEST_PASSED_START = 380;
  const SCREENSHOT_START = 430;
  const FADE_OUT_START = durationInFrames - 45;

  // ── Derived state ──
  const nameText = "Jane Doe";
  const emailText = "jane@acme.io";

  const nameCharsVisible = Math.min(
    Math.floor(
      interpolate(frame, [NAME_TYPE_START, NAME_TYPE_END], [0, nameText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    ),
    nameText.length
  );

  const emailCharsVisible = Math.min(
    Math.floor(
      interpolate(frame, [EMAIL_TYPE_START, EMAIL_TYPE_END], [0, emailText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    ),
    emailText.length
  );

  const nameFocused = frame >= NAME_FOCUS && frame < EMAIL_FOCUS;
  const emailFocused = frame >= EMAIL_FOCUS && frame < BUTTON_CLICK;

  const buttonState: "idle" | "loading" | "success" =
    frame >= BUTTON_SUCCESS
      ? "success"
      : frame >= BUTTON_LOADING
      ? "loading"
      : "idle";

  const toastVisible = frame >= TOAST_APPEAR;

  // Cursor
  const cursorPos = getCursorPos(frame);
  const cursorOpacity = interpolate(frame, [CURSOR_APPEAR, CURSOR_APPEAR + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clicking = isClicking(frame);

  // UI fade in
  const uiOpacity = interpolate(frame, [UI_APPEAR, UI_APPEAR + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const uiScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  // Test passed overlay
  const testPassedOpacity = interpolate(
    frame,
    [TEST_PASSED_START, TEST_PASSED_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const testPassedScale = spring({
    frame: Math.max(0, frame - TEST_PASSED_START),
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Screenshot shrink
  const screenshotProgress = interpolate(
    frame,
    [SCREENSHOT_START, SCREENSHOT_START + 40],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );
  const contentScale = interpolate(screenshotProgress, [0, 1], [1, 0.55]);
  const contentY = interpolate(screenshotProgress, [0, 1], [0, -60]);

  // "Posted to PR" label
  const prLabelOpacity = interpolate(
    frame,
    [SCREENSHOT_START + 35, SCREENSHOT_START + 50],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const prLabelY = spring({
    frame: Math.max(0, frame - (SCREENSHOT_START + 35)),
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Overall fade out
  const fadeOut = interpolate(frame, [FADE_OUT_START, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        overflow: "hidden",
        opacity: fadeOut,
      }}
    >
      {/* Subtle gradient bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 30% 20%, ${COLORS.orange}08 0%, transparent 60%),
                       radial-gradient(ellipse at 70% 80%, ${COLORS.purple}06 0%, transparent 50%)`,
        }}
      />

      {/* Content container */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${contentScale * uiScale}) translateY(${contentY}px)`,
            position: "relative",
          }}
        >
          {/* Browser */}
          <BrowserChrome opacity={uiOpacity}>
            <MockAppPage
              nameValue={nameText.slice(0, nameCharsVisible)}
              emailValue={emailText.slice(0, emailCharsVisible)}
              nameFocused={nameFocused}
              emailFocused={emailFocused}
              buttonState={buttonState}
              toastVisible={toastVisible}
            />
          </BrowserChrome>

          {/* Test passed overlay on the browser */}
          {frame >= TEST_PASSED_START && (
            <TestPassedOverlay
              opacity={testPassedOpacity}
              scale={testPassedScale}
            />
          )}
        </div>

        {/* Cursor - absolute on the 1920x1080 canvas */}
        {frame >= CURSOR_APPEAR && frame < SCREENSHOT_START && (
          <div style={{ position: "absolute", inset: 0 }}>
            <AgentCursor
              x={cursorPos.x}
              y={cursorPos.y}
              clicking={clicking}
              opacity={cursorOpacity}
            />
          </div>
        )}

        {/* "Posted as validation proof to PR #427" label */}
        {frame >= SCREENSHOT_START + 35 && (
          <div
            style={{
              position: "absolute",
              bottom: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              opacity: prLabelOpacity,
              transform: `translateY(${(1 - prLabelY) * 30}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: `${COLORS.green}15`,
                border: `1px solid ${COLORS.green}40`,
                borderRadius: 12,
                padding: "14px 28px",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="10" fill={COLORS.green} opacity={0.2} />
                <path
                  d="M6 11 L9.5 14.5 L16 7.5"
                  stroke={COLORS.green}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 20,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: COLORS.cream,
                }}
              >
                Screenshot posted as proof of validation to{" "}
                <span style={{ color: COLORS.purple }}>PR #427</span>
              </span>
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.green}, ${COLORS.purple})`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
