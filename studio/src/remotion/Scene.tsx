import React from 'react';
import '@fontsource/ibm-plex-mono/500.css';
import {TerminalWindow, terminalDuration} from '../../../src/brand/TerminalWindow';
import {AgentFlow} from '../../../src/brand/AgentFlow';
import {AbsoluteFill, Html5Video, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, sampleAt} from '../lib/gesture';
import {gestureLabel, type Overlay, type Sample, type SceneProps} from '../types';

const sans = 'IBM Plex Mono, monospace';
const mono = 'IBM Plex Mono, monospace';

function CodePanel({overlay, progress}: {overlay: Overlay; progress: number}) {
  const lines = overlay.body.split('\n').slice(0, 12);
  const active = Math.floor(progress * Math.max(0, lines.length - 1));
  return <div style={{background: '#171717', border: '1px solid #ffffff20', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 75px #0005'}}>
    <div style={{height: 54, display: 'flex', alignItems: 'center', padding: '0 22px', borderBottom: '1px solid #ffffff12', gap: 7}}>
      {['#ef8380', '#e8c477', '#85bea3'].map(color => <span key={color} style={{width: 9, height: 9, background: color, borderRadius: 50}}/>)}
      <span style={{font: `15px ${mono}`, color: '#a4a7bb', marginLeft: 18}}>{overlay.title}</span><span style={{marginLeft: 'auto', fontSize: 12, color: overlay.accent}}>TSX</span>
    </div>
    <div style={{padding: '22px 0 24px', font: `17px/1.8 ${mono}`}}>
      {lines.map((line, i) => <div key={i} style={{display: 'flex', padding: '0 22px', background: i === active ? `${overlay.accent}15` : 'transparent', borderLeft: `2px solid ${i === active ? overlay.accent : 'transparent'}`}}>
        <span style={{color: '#505669', width: 30, flexShrink: 0, userSelect: 'none'}}>{i + 1}</span>
        <span style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: line.trim().startsWith('//') ? '#737f93' : '#e3e8ef'}}>{line.split(/("[^"]*"|'[^']*'|\bconst\b|\bif\b|\breturn\b|<\w+\s*\/>)/g).map((part, j) => <span key={j} style={{color: /^(const|if|return)$/.test(part) ? overlay.accent : /^['"]/.test(part) ? '#94d5b8' : /^</.test(part) ? '#e1c08a' : undefined}}>{part}</span>)}</span>
      </div>)}
    </div>
  </div>;
}

function ApiDiagram({overlay, progress}: {overlay: Overlay; progress: number}) {
  const labels = overlay.body.split(',').map(v => v.trim()).filter(Boolean).slice(0, 3);
  while (labels.length < 3) labels.push(['Client', 'API', 'Database'][labels.length]);
  return <div style={{background: '#171717f5', border: '1px solid #ffffff20', borderRadius: 20, padding: '28px 30px 32px', boxShadow: '0 24px 70px #0004'}}>
    <div style={{font: `12px ${mono}`, letterSpacing: 2, color: overlay.accent, marginBottom: 12}}>REQUEST LIFECYCLE</div>
    <div style={{color: '#eff1f6', fontSize: 27, fontWeight: 500, marginBottom: 35}}>{overlay.title}</div>
    <div style={{display: 'flex', alignItems: 'center'}}>
      {labels.map((label, i) => <React.Fragment key={i}>
        {i > 0 && <div style={{height: 2, flex: 1, background: '#ffffff20', position: 'relative'}}><div style={{height: 2, width: `${clamp(progress * 2 - (i - 1)) * 100}%`, background: overlay.accent}}/><div style={{position: 'absolute', right: -1, top: -4, width: 8, height: 8, borderTop: '2px solid #667181', borderRight: '2px solid #667181', transform: 'rotate(45deg)'}}/></div>}
        <div style={{width: 119, textAlign: 'center', padding: '20px 5px', background: progress >= i / 2 ? `${overlay.accent}18` : '#ffffff05', border: `1px solid ${progress >= i / 2 ? `${overlay.accent}66` : '#ffffff1a'}`, borderRadius: 12}}>
          <div style={{font: `26px ${mono}`, marginBottom: 12, color: progress >= i / 2 ? overlay.accent : '#708090'}}>{['⌘', '{ }', '▤'][i]}</div>
          <div style={{fontSize: 15, color: '#d9e0e9', overflowWrap: 'anywhere'}}>{label}</div>
        </div>
      </React.Fragment>)}
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 23, font: `12px ${mono}`, color: '#748291'}}><span>GET /api/components</span><span style={{color: overlay.accent}}>{progress > 0.92 ? '200 OK' : 'IN FLIGHT'}</span></div>
  </div>;
}

function Callout({overlay}: {overlay: Overlay}) {
  return <div style={{background: '#F6F6F1', color: '#24232d', borderRadius: 14, padding: '24px 28px', borderLeft: `5px solid ${overlay.accent}`, boxShadow: '0 18px 65px #0004'}}>
    <div style={{font: `11px ${mono}`, color: '#7b7670', letterSpacing: 2, marginBottom: 12}}>A NOTE WORTH KEEPING</div>
    <div style={{fontSize: 28, fontWeight: 600, marginBottom: 10}}>{overlay.title}</div>
    <div style={{fontSize: 18, lineHeight: 1.5, color: '#78716e'}}>{overlay.body}</div>
  </div>;
}

function TrackedHand({sample, simulated}: {sample: Sample; simulated: boolean}) {
  if (!sample.visible) return null;
  const points = simulated ? [
    [121,220],[79,184],[51,150],[33,119],[20,94],
    [88,140],[78,96],[76,51],[78,15],
    [122,133],[121,80],[122,36],[125,2],
    [151,143],[161,96],[166,59],[171,29],
    [178,161],[195,133],[207,110],[218,91],
  ] : [];
  const connections = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
  return <div style={{position: 'absolute', left: sample.x * 1280 - (simulated ? 122 : 0), top: sample.y * 720 - (simulated ? 133 : 0), color: '#FF570A'}}>
    {simulated ? <svg width="244" height="250" viewBox="0 0 244 250" aria-label="Simulated hand landmark motion">
      <path d="M40 45H12V74 M204 18h27v27 M12 201v27h27 M206 228h26v-27" stroke="#625041" fill="none" strokeWidth="1"/>
      {connections.map((c,i) => <polyline key={i} points={c.map(p => points[p].join(',')).join(' ')} fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2"/>)}
      {points.map(([x,y], i) => <circle key={i} cx={x} cy={y} r={i === 9 ? 7 : 3} fill={i === 9 ? '#FF8F59' : '#bc714b'}/>)}
    </svg> : <div style={{width: 24, height: 24, transform: 'translate(-50%, -50%)', border: '2px solid #FF570A', borderRadius: '50%', boxShadow: '0 0 0 8px #FF570A22'}}/>}
    <div style={{position: 'absolute', top: simulated ? 263 : 28, left: simulated ? 30 : -70, width: 190, font: `13px ${mono}`, letterSpacing: 0.5, textAlign: 'center', whiteSpace: 'nowrap', color: '#bca893'}}>{sample.gesture === 'None' ? 'HAND POSITION' : gestureLabel[sample.gesture].toUpperCase()} <span style={{color: '#827992'}}>↗</span></div>
  </div>;
}

export const Scene: React.FC<SceneProps> = ({project, transparent = false}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;
  const hand = sampleAt(project.samples, time);
  return <AbsoluteFill style={{background: transparent ? 'transparent' : '#0c0c0b', fontFamily: sans, overflow: 'hidden'}}>
    {!transparent && project.mediaUrl && <Html5Video src={project.mediaUrl} muted={project.mute} style={{width: '100%', height: '100%', objectFit: 'contain'}}/>}
    <div style={{position: 'absolute', width: 1280, height: 720, transform: `scale(${width / 1280}, ${height / 720})`, transformOrigin: '0 0'}}>
      {!transparent && project.sampleMode && <>
        <AbsoluteFill style={{backgroundImage: 'radial-gradient(ellipse at 78% 48%, #FF570A0f, transparent 50%), radial-gradient(#ffffff0e 1px, transparent 1px)', backgroundSize: 'auto, 28px 28px'}}/>
        <div style={{position: 'absolute', top: 40, left: 55, font: `13px ${mono}`, letterSpacing: 2, color: '#9c94b0'}}>CODERABBIT <span style={{color: '#47454f', margin: '0 13px'}}>/</span> MOTION STUDIO</div>
        <div style={{position: 'absolute', top: 41, right: 55, font: `15px ${mono}`, color: '#8c859c'}}>BRAND KIT / 01</div>
        <div style={{position: 'absolute', top: 105, left: 57, fontSize: 47, letterSpacing: -1.8, color: '#F6F6F1', fontWeight: 500}}>Explain it. Show it. Ship it.</div>
        <div style={{position: 'absolute', top: 172, left: 59, fontSize: 19, color: '#96968b'}}>Developer stories, directed by you.</div>
        <div style={{position: 'absolute', bottom: 38, left: 57, right: 57, display: 'flex', justifyContent: 'space-between', font: `11px ${mono}`, letterSpacing: 1.5, color: '#787184'}}><span>SIMULATED HAND TRACK · SAMPLE SCENE</span><span>CODERABBIT · DEVELOPER WALKTHROUGH</span></div>
      </>}
      {!transparent && project.showTracking && hand && <TrackedHand sample={hand} simulated={project.sampleMode}/>}
      {project.overlays.filter(o => o.enabled).map(overlay => {
        const local = frame - overlay.start * fps;
        if (local < 0 || local >= overlay.duration * fps) return null;
        const entrance = spring({frame: local, fps, config: {damping: 22, stiffness: 130, mass: 0.8}});
        const exit = interpolate(local, [Math.max(0, overlay.duration * fps - 8), overlay.duration * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const progress = overlay.binding === 'progress' && hand?.visible ? clamp((hand.x - 0.18) / 0.65) : clamp(local / (overlay.duration * fps * 0.8));
        const w = ['diagram', 'agentflow'].includes(overlay.kind) ? 580 : overlay.kind === 'callout' ? 440 : 550;
        let x = overlay.placement === 'left' ? 58 : overlay.placement === 'right' ? 1222 - w * overlay.scale : (1280 - w * overlay.scale) / 2;
        let y = overlay.kind === 'callout' ? 420 : 235;
        if (overlay.binding === 'follow' && hand?.visible) {x = clamp(hand.x * 1280 - w / 2, 40, 1240 - w * overlay.scale); y = clamp(hand.y * 720 + 52, 50, 720 - (overlay.kind === 'callout' ? 195 : 390) * overlay.scale - 35);}
        const commands = overlay.body.split('\n').filter(Boolean).slice(0, 6).map(input => ({input, holdFrames: 8}));
        const typedFrame = Math.round(progress * terminalDuration(commands));
        return <div key={overlay.id} style={{position: 'absolute', left: x, top: y, width: w, opacity: entrance * exit, transform: `translateY(${(1 - entrance) * 27}px) scale(${overlay.scale * (0.97 + entrance * 0.03)})`, transformOrigin: 'top left'}}>
          {overlay.kind === 'terminal' ? <TerminalWindow compact commands={commands} title={overlay.title} frame={typedFrame} fps={fps} accent={overlay.accent}/> : overlay.kind === 'agentflow' ? <AgentFlow title={overlay.title} labels={overlay.body.split(',')} progress={progress} accent={overlay.accent}/> : overlay.kind === 'code' ? <CodePanel overlay={overlay} progress={progress}/> : overlay.kind === 'diagram' ? <ApiDiagram overlay={overlay} progress={progress}/> : <Callout overlay={overlay}/>}
        </div>;
      })}
    </div>
  </AbsoluteFill>;
};
