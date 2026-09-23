import React, {type CSSProperties} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {broadcastMotion} from '../lib/broadcast';
import {staggerFrames} from '../lib/motion';
import {assetPhase, circleWipeState, colorBarWipeState, motionEase, signalPhase, stackWipeState} from '../lib/brandAssets';
import {brand} from './Broadcast';
import {isColorBar} from '../lib/colorBar';
import {ColorBar} from './ColorBar';
import {PixelGlowWipe} from './PixelGlowWipe';
import {NameIntro} from './NameIntro';
import type {Overlay} from '../types';

const font = 'Geist, sans-serif';
const copy: CSSProperties = {fontFamily: font, fontWeight: 400, fontSize: 27, lineHeight: 1.4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'};
const logoRatio = 313 / 2152;
function Lockup({width, light = false, style}: {width: number; light?: boolean; style?: CSSProperties}) {
  return <Img src={staticFile(`brand/${light ? 'orange' : 'white'}-typemark.svg`)} style={{width, height: width * logoRatio, display: 'block', objectFit: 'contain', ...style}}/>;
}

export function MotionAsset({overlay: o, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  if (o.kind === 'name-intro') return <NameIntro overlay={o} frame={frame} fps={fps}/>;
  if (isColorBar(o.kind)) return <ColorBar overlay={o} frame={frame} fps={fps}/>;
  if (o.kind === 'pixel-glow-wipe') return <PixelGlowWipe overlay={o} frame={frame} fps={fps}/>;
  const accentColor = o.accent;
  const light = o.colorway === 'light';
  const background = light ? brand.white : brand.ink;
  const foreground = light ? brand.ink : brand.white;
  const muted = light ? '#65616D' : brand.muted;
  const motion = broadcastMotion(frame, o.duration, fps);
  const p = assetPhase(frame, o.duration, fps);
  const reverse = o.direction === 'left';
  const centeredLogo: CSSProperties = {position: 'absolute', left: 400, top: 325, opacity: motion.opacity};

  if (o.kind === 'circle-wipe') {
    const wipe = circleWipeState(frame, o.duration, fps);
    const x = reverse ? 1280 - wipe.x : wipe.x;
    return <AbsoluteFill>
      <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0}}>
        <circle cx={x} cy={360} r={wipe.orange} fill={accentColor}/>
        <circle cx={x} cy={360} r={wipe.plate} fill={background}/>
      </svg>
      <Lockup width={380} light={light} style={{position: 'absolute', top: 332, left: 450, opacity: wipe.logo}}/>
    </AbsoluteFill>;
  }
  if (o.kind === 'color-bar-wipe') {
    return <svg width="1280" height="720" viewBox="0 0 1280 720" aria-label="Color bar wipe transition" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {colorBarWipeState(frame, o.duration, fps).map((band, index) => <rect key={band.name} transform={`translate(${reverse ? -band.x : band.x} 0)`} y={band.y} width={1280} height={band.height} fill={o.barColors?.[index] ?? band.color}/>)}
    </svg>;
  }
  if (o.kind === 'stack-wipe') {
    const logo = motionEase((p - 0.37) / 0.07) * (1 - motionEase((p - 0.55) / 0.05));
    return <AbsoluteFill>
      <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 6}, (_, row) => <React.Fragment key={row}>
          {[true, false].map(accent => {const x = stackWipeState(frame, o.duration, row, fps, accent); return <rect key={String(accent)} transform={`translate(${reverse ? -x : x} 0)`} y={row * 120} width={1280} height={120} fill={accent ? accentColor : background}/>;})}
        </React.Fragment>)}
      </svg>
      <Lockup width={380} light={light} style={{position: 'absolute', top: 332, left: 450, opacity: logo}}/>
    </AbsoluteFill>;
  }
  if (o.kind === 'signal-loop') {
    const phase = signalPhase(frame, fps, o.loopDuration ?? 8);
    return <AbsoluteFill style={{background, opacity: o.opacity ?? 1}}>
      <svg width="1280" height="720" viewBox="0 0 1280 720">
        {Array.from({length: 4}, (_, row) => {
          const direction = (row % 2 === 0 ? 1 : -1) * (reverse ? -1 : 1);
          const shift = direction * phase * 320;
          return <g key={row} transform={`translate(${shift + (row % 2) * 160} ${row * 180})`}>
            {Array.from({length: 8}, (_, col) => <g key={col} transform={`translate(${(col - 2) * 320} 0)`}>
              <path d="M0 90H320" stroke={light ? '#D0CDD5' : '#322F37'} strokeWidth="1"/>
              <rect x={16} y={54} width={202} height={72} rx={36} fill={row === 1 ? 'none' : row === 3 ? (light ? '#D0CDD5' : brand.panel) : accentColor} stroke={row === 1 ? accentColor : 'none'} strokeWidth={3}/>
              <circle cx={270} cy={90} r={36} fill={row % 2 ? accentColor : light ? '#B5B2BC' : brand.raised}/>
            </g>)}
          </g>;
        })}
      </svg>
    </AbsoluteFill>;
  }
  if (o.kind === 'logo-reveal') {
    return <AbsoluteFill style={{color: foreground, fontFamily: font}}>
      <svg width="1280" height="720" style={{position: 'absolute', inset: 0, opacity: motion.opacity}}>
        <circle cx={-150 - (1 - motion.enter) * 130} cy={180} r={260} fill={accentColor}/>
        <circle cx={1410 + (1 - motion.enter) * 130} cy={575} r={255} fill="none" stroke={accentColor} strokeWidth={65}/>
        <path d={`M${64 - (1 - motion.enter) * 150} 628H${260 - (1 - motion.enter) * 150}`} stroke={accentColor} strokeWidth={5}/>
        <circle cx={281} cy={628} r={5} fill={accentColor}/>
      </svg>
      <Lockup width={480} light={light} style={{...centeredLogo, top: o.title ? 285 : 325, transform: `translateY(${motion.offset}px)`}}/>
      <div style={{...copy, position: 'absolute', left: 230, right: 230, top: 405, color: muted, textAlign: 'center', opacity: broadcastMotion(frame, o.duration, fps, 2 * staggerFrames).opacity, transform: `translateY(${motion.offset}px)`}}>{o.title}</div>
    </AbsoluteFill>;
  }
  if (o.kind === 'type-reveal') {
    const lines = o.title.split('\n').slice(0, 3);
    const size = lines.length > 2 ? 88 : Math.max(...lines.map(line => line.length)) > 24 ? 83 : 112;
    return <AbsoluteFill style={{fontFamily: font, color: foreground, opacity: motion.opacity}}>
      <div style={{position: 'absolute', top: 69, left: 72}}><Lockup width={238} light={light}/></div>
      <div style={{position: 'absolute', left: 72, top: 212, right: 94}}>
        {lines.map((line, i) => {
          const lineMotion = broadcastMotion(frame, o.duration, fps, i * staggerFrames);
          return <div key={i} style={{overflow: 'hidden', paddingBottom: 8}}><div style={{fontWeight: 600, fontSize: size, lineHeight: 1.06, letterSpacing: -4.5, color: i === lines.length - 1 && lines.length > 1 ? accentColor : foreground, transform: `translateY(${(1 - lineMotion.enter) * 125 + lineMotion.leave * -125}%)`, overflowWrap: 'anywhere'}}>{line}</div></div>;
        })}
      </div>
      <div style={{...copy, position: 'absolute', left: 76, top: 566, right: 150, color: muted, fontSize: 24, opacity: broadcastMotion(frame, o.duration, fps, 2 * staggerFrames).opacity}}>{o.body}</div>
      <div style={{position: 'absolute', right: 72, bottom: 70, width: 70, height: 7, borderRadius: 4, background: accentColor, transform: `scaleX(${motion.enter})`, transformOrigin: 'left'}}/>
    </AbsoluteFill>;
  }
  // Sign-off is a complete end card. Its plate remains opaque throughout the asset.
  return <AbsoluteFill style={{background, color: foreground, fontFamily: font}}>
    <div style={{position: 'absolute', left: 0, bottom: 0, width: 1280, height: 14, background: accentColor, transform: `scaleX(${motion.enter * (1 - motion.leave)})`, transformOrigin: 'left'}}/>
    <Lockup width={520} light={light} style={{position: 'absolute', top: 244, left: 380, opacity: motion.opacity, transform: `translateY(${motion.offset}px)`}}/>
    <div style={{...copy, position: 'absolute', top: 384, left: 170, right: 170, textAlign: 'center', opacity: broadcastMotion(frame, o.duration, fps, staggerFrames).opacity, fontSize: 32}}>{o.title}</div>
    <div style={{...copy, position: 'absolute', top: 547, left: 170, right: 170, textAlign: 'center', opacity: broadcastMotion(frame, o.duration, fps, 2 * staggerFrames).opacity, color: muted, fontSize: 21}}>{o.body}</div>
  </AbsoluteFill>;
}
