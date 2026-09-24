import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont} from "@remotion/google-fonts/IBMPlexMono";
import {TerminalWindow, type TerminalTypingProps} from "./brand/TerminalWindow";
export {INSTALL_COMMANDS, BENCH_SETUP_COMMANDS, SCHEDULE_BENCH_COMMANDS, INSTALL_TWO_COMMANDS_TOTAL_FRAMES, BENCH_SETUP_TOTAL_FRAMES, SCHEDULE_BENCH_TOTAL_FRAMES} from "./brand/TerminalWindow";
export type {TerminalCommand, TerminalTypingProps} from "./brand/TerminalWindow";
const {fontFamily} = loadFont("normal", {weights: ["500"]});

export const TerminalTyping: React.FC<TerminalTypingProps> = (props) => (
  <TerminalWindow {...props} frame={useCurrentFrame()} fps={useVideoConfig().fps} fontFamily={fontFamily}/>
);
