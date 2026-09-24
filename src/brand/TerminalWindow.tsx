import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
const FONT_FAMILY = "IBM Plex Mono, monospace";

const PALETTE = {
  outerBg: "#000000",
  bg: "#14110f",
  chrome: "#22201d",
  text: "#f2ede4",
  dim: "#b4a697",
  prompt: "#FF570A",
  output: "#97b47a",
  cursor: "#f2ede4",
};

const DEFAULT_FRAMES_PER_CHAR = 2;
const DEFAULT_OUTPUT_DELAY = 8;
const START_FRAME = 18;

export type TerminalCommand = {
  prompt?: string;
  input: string;
  output?: string[];
  holdFrames?: number;
};

export type TerminalTypingProps = {
  commands: TerminalCommand[];
  framesPerChar?: number;
  outputDelayFrames?: number;
  title?: string;
};

type TimelineEntry = {
  prompt: string;
  input: string;
  output: string[];
  startFrame: number;
  typeEndFrame: number;
  outputFrame: number;
  doneFrame: number;
};

const buildTimeline = (
  commands: TerminalCommand[],
  framesPerChar: number,
  outputDelayFrames: number,
  startOffset: number,
): TimelineEntry[] => {
  const timeline: TimelineEntry[] = [];
  let cursor = startOffset;
  for (const cmd of commands) {
    const prompt = cmd.prompt ?? "$ ";
    const typeFrames = cmd.input.length * framesPerChar;
    const outputLines = cmd.output ?? [];
    const hold = cmd.holdFrames ?? 30;
    const typeEndFrame = cursor + typeFrames;
    const outputFrame = typeEndFrame + outputDelayFrames;
    const doneFrame = outputFrame + hold;
    timeline.push({
      prompt,
      input: cmd.input,
      output: outputLines,
      startFrame: cursor,
      typeEndFrame,
      outputFrame,
      doneFrame,
    });
    cursor = doneFrame;
  }
  return timeline;
};

export const INSTALL_COMMANDS: TerminalCommand[] = [
  {
    input: "claude plugin marketplace add ant-open-skills/custom-model-bench",
    output: ["✔ Added marketplace: ant-open-skills"],
    holdFrames: 20,
  },
  {
    input: "claude plugin install custom-model-bench@ant-open-skills",
    output: ["✔ Installed plugin: custom-model-bench@ant-open-skills (scope: user)"],
    holdFrames: 40,
  },
];

export const BENCH_SETUP_COMMANDS: TerminalCommand[] = [
  { input: "/custom-model-bench:bench-setup", holdFrames: 50 },
  { prompt: "> ", input: "I build Uber for dogs", holdFrames: 40 },
  { prompt: "> ", input: "Speed + Reliability", holdFrames: 40 },
  { prompt: "> ", input: "A system prompt", holdFrames: 60 },
];

export const SCHEDULE_BENCH_COMMANDS: TerminalCommand[] = [
  {
    prompt: "> ",
    input: "/custom-model-bench:schedule-bench run customer-support agent workflow every Monday - 9 p.m.",
    holdFrames: 60,
  },
];

const computeTotalFrames = (commands: TerminalCommand[]): number => {
  const tl = buildTimeline(
    commands,
    DEFAULT_FRAMES_PER_CHAR,
    DEFAULT_OUTPUT_DELAY,
    START_FRAME,
  );
  return tl[tl.length - 1].doneFrame + 45;
};

export const INSTALL_TWO_COMMANDS_TOTAL_FRAMES = computeTotalFrames(INSTALL_COMMANDS);
export const BENCH_SETUP_TOTAL_FRAMES = computeTotalFrames(BENCH_SETUP_COMMANDS);
export const SCHEDULE_BENCH_TOTAL_FRAMES = computeTotalFrames(SCHEDULE_BENCH_COMMANDS);

export const TerminalWindow: React.FC<TerminalTypingProps & {frame: number; fps: number; compact?: boolean; fontFamily?: string; accent?: string}> = ({
  frame, fps, compact = false, fontFamily = FONT_FAMILY, accent = PALETTE.prompt,
  commands,
  framesPerChar = DEFAULT_FRAMES_PER_CHAR,
  outputDelayFrames = DEFAULT_OUTPUT_DELAY,
  title = "~ / custom-model-bench",
}) => {

  const timeline = buildTimeline(commands, framesPerChar, outputDelayFrames, START_FRAME);
  const cursorOn = Math.floor((frame / fps) * 2) % 2 === 0;

  const visibleLines: React.ReactNode[] = [];
  for (let i = 0; i < timeline.length; i++) {
    const t = timeline[i];
    if (frame < t.startFrame) break;

    const typedChars = Math.min(
      t.input.length,
      Math.floor((frame - t.startFrame) / framesPerChar),
    );
    const isTypingThis = frame < t.typeEndFrame;
    const isLastCmd = i === timeline.length - 1;

    visibleLines.push(
      <div key={`cmd-${i}`} style={styles.line}>
        <span style={{...styles.prompt, color: accent}}>{t.prompt}</span>
        <span style={styles.lineText}>
          {t.input.slice(0, typedChars)}
          {isTypingThis ? (
            <span style={{ ...styles.cursor, visibility: cursorOn ? "visible" : "hidden" }}>▋</span>
          ) : null}
        </span>
      </div>,
    );

    if (frame >= t.outputFrame) {
      t.output.map((line, j) =>
        visibleLines.push(
          <div key={`cmd-${i}-out-${j}`} style={styles.outputLine}>
            {line}
          </div>,
        ),
      );
    }

    if (isLastCmd && frame >= t.outputFrame) {
      visibleLines.push(
        <div key="tail-cursor" style={styles.line}>
          <span style={{...styles.prompt, color: accent}}>{t.prompt}</span>
          <span style={{ ...styles.cursor, visibility: cursorOn ? "visible" : "hidden" }}>▋</span>
        </div>,
      );
    }
  }

  const opacity = interpolate(frame, [0, START_FRAME], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...styles.root, opacity, fontFamily, ...(compact ? {position: "relative" as const} : {}) }}>
      <div style={{...styles.window, ...(compact ? {width: "100%"} : {})}}>
        <div style={styles.chrome}>
          <div style={{ ...styles.dot, background: "#e4564e" }} />
          <div style={{ ...styles.dot, background: "#e6b34a" }} />
          <div style={{ ...styles.dot, background: "#6cbf5a" }} />
          <span style={styles.title}>{title}</span>
        </div>
        <div style={{...styles.body, ...(compact ? {fontSize: 19, padding: "24px", minHeight: 170} : {})}}>{visibleLines}</div>
      </div>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT_FAMILY,
    fontWeight: 500,
  },
  window: {
    width: "82%",
    maxWidth: 1180,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    background: PALETTE.bg,
  },
  chrome: {
    height: 44,
    background: PALETTE.chrome,
    display: "flex",
    alignItems: "center",
    padding: "0 18px",
    gap: 10,
    position: "relative",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: PALETTE.dim,
    fontSize: 15,
  },
  body: {
    padding: "28px 40px 32px 40px",
    color: PALETTE.text,
    fontSize: 30,
    lineHeight: 1.6,
    minHeight: 160,
  },
  line: {
    display: "flex",
    alignItems: "flex-start",
  },
  lineText: {
    overflowWrap: "break-word",
    wordBreak: "break-word",
    minWidth: 0,
  },
  prompt: {
    color: PALETTE.prompt,
    marginRight: 12,
    flexShrink: 0,
  },
  outputLine: {
    color: PALETTE.output,
    whiteSpace: "pre",
  },
  cursor: {
    color: PALETTE.cursor,
    marginLeft: 2,
  },
};

// Shared by the composition and the studio when mapping a gesture to typing progress.
export const terminalDuration = (commands: TerminalCommand[], framesPerChar = 2) => {
  const entries = buildTimeline(commands, framesPerChar, DEFAULT_OUTPUT_DELAY, START_FRAME);
  return (entries[entries.length - 1]?.doneFrame ?? START_FRAME) + 1;
};
