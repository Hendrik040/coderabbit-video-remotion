import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/IBMPlexMono';
import {AgentFlow} from './brand/AgentFlow';
import {TerminalWindow} from './brand/TerminalWindow';
const {fontFamily} = loadFont('normal', {weights: ['500']});

export const MotionBrandKit = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#0c0c0b', fontFamily, color: '#F6F6F1', padding: 80}}>
    <div style={{fontSize: 16, color: '#FF570A', letterSpacing: 3}}>CODERABBIT / MOTION STUDIO</div>
    <h1 style={{fontSize: 60, fontWeight: 500, margin: '30px 0 80px'}}>Explain it. Show it. Ship it.</h1>
    <div style={{display: 'flex', gap: 50, alignItems: 'center'}}>
      <div style={{width: 810}}><TerminalWindow compact frame={frame} fps={fps} fontFamily={fontFamily} title="~/my-project" commands={[{input: 'git diff --stat', output: ['3 files changed · ready for review']}, {input: 'git status --short', output: ['M src/api.ts', 'M src/auth.ts']}]} /></div>
      <div style={{width: 810}}><AgentFlow title="A better development loop." labels={['Plan', 'Code', 'Review']} progress={Math.min(1, frame / 240)}/></div>
    </div>
    <div style={{position: 'absolute', bottom: 80, fontSize: 18, color: '#8b8b80'}}>Shared React components • frame-driven animation • ready for presenter footage</div>
  </AbsoluteFill>;
};
