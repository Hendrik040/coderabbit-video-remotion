import React, {useEffect, useState, type CSSProperties} from 'react';
import {AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {broadcastMotion} from '../lib/broadcast';
import {staggerFrames} from '../lib/motion';
import type {Overlay} from '../types';

export const brand = {orange: '#FF570A', mint: '#25E2A8', cobalt: '#687FF5', ink: '#121113', panel: '#211F26', raised: '#322F37', line: '#49454F', white: '#EEEDEF', muted: '#B5B2BC'};
const sans = 'Geist, sans-serif';
const mono = 'Hack, monospace';
let fontPromise: Promise<unknown> | undefined;
export function useBroadcastFonts() {
  const [handle] = useState(() => delayRender('Loading bundled broadcast fonts'));
  useEffect(() => {
    fontPromise ??= Promise.all([['Geist', 'Regular', '400'], ['Geist', 'SemiBold', '600'], ['Hack', 'Regular', '400'], ['Hack', 'Bold', '700']].map(async ([family, style, weight]) => {
      const font = new FontFace(family, `url(${staticFile(`brand/fonts/${family}-${style}.ttf`)})`, {weight});
      document.fonts.add(await font.load());
    }));
    fontPromise.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
}
const label: CSSProperties = {fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: 1.3, lineHeight: 1.5};
const lineClamp = (lines: number): CSSProperties => ({display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere', whiteSpace: 'pre-line'});
const heading: CSSProperties = {fontFamily: sans, fontWeight: 600, letterSpacing: -2.2, lineHeight: 1.06, margin: 0, ...lineClamp(3)};
const body: CSSProperties = {fontFamily: sans, fontSize: 22, lineHeight: 1.45, color: brand.muted, ...lineClamp(2)};

function Logo({width = 220}: {width?: number}) {
  // Supplied full lockup; no reconstructed lettering, masks, recoloring or rotation.
  return <Img src={staticFile('brand/white-typemark.svg')} style={{width, height: width * 313 / 2152, objectFit: 'contain', display: 'block'}}/>;
}
function Reveal({frame, duration, fps, delay = 0, style, children}: {frame: number; duration: number; fps: number; delay?: number; style?: CSSProperties; children: React.ReactNode}) {
  const motion = broadcastMotion(frame, duration, fps, delay);
  return <div style={{...style, opacity: motion.opacity, transform: `translateY(${motion.offset}px)`}}>{children}</div>;
}
export function BroadcastBackdrop({showSlate}: {showSlate: boolean}) {
  return <AbsoluteFill style={{background: brand.ink, color: brand.muted, fontFamily: sans}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(#ffffff04 1px, transparent 1px), linear-gradient(90deg, #ffffff04 1px, transparent 1px)', backgroundSize: '80px 80px'}}/>
    {showSlate && <>
    <div style={{position: 'absolute', left: 64, top: 60, ...label, color: '#77717E'}}>DEVELOPER BROADCAST <span style={{marginLeft: 24}}> / </span> SAMPLE FEED</div>
    <div style={{position: 'absolute', left: 64, top: 205, fontSize: 80, fontWeight: 600, letterSpacing: -4, lineHeight: 1.05, color: '#49454F'}}>Your story.<br/>On air.</div>
    <div style={{position: 'absolute', right: 64, bottom: 170, ...label, color: '#77717E', writingMode: 'vertical-rl'}}>THE REVIEW DESK / 001</div>
    </>}
  </AbsoluteFill>;
}

export function BroadcastOverlay({overlay: o, frame, fps, hasBackground = false}: {overlay: Overlay; frame: number; fps: number; hasBackground?: boolean}) {
  const motion = broadcastMotion(frame, o.duration, fps);
  const common = {frame, duration: o.duration, fps};
  const kicker = o.kicker ?? '';
  const items = o.body.split('\n').map(s => s.trim()).filter(Boolean);
  const full = ['ident', 'headline', 'triage', 'stack'].includes(o.kind);
  const panel: CSSProperties = {background: brand.panel, border: `1px solid ${brand.line}`, borderRadius: 16};
  const frameStyle: CSSProperties = {position: 'absolute', inset: 0, color: brand.white, fontFamily: sans, opacity: motion.opacity};
  // Fixed title-safe slots intentionally ignore gesture following and arbitrary scale.
  // This keeps the station logo, name strap and ticker from colliding.
  return <div style={frameStyle}>
    {full && !hasBackground && <AbsoluteFill style={{background: brand.ink, clipPath: `inset(0 ${(1 - motion.enter + motion.leave) * 100}% 0 0)`}}/>}
    {o.kind === 'ident' && <>
      <div style={{position: 'absolute', left: 64, top: 64, right: 64, height: 3, background: brand.line}}><div style={{width: '100%', height: 3, background: brand.orange, transform: `scaleX(${motion.enter})`, transformOrigin: 'left'}}/></div>
      <Reveal {...common} style={{position: 'absolute', left: 64, top: 112}}><Logo width={260}/></Reveal>
      <Reveal {...common} delay={staggerFrames} style={{position: 'absolute', left: 64, top: 249, maxWidth: 925}}>
        <div style={{...label, color: brand.orange, marginBottom: 25}}>{kicker}</div>
        <h1 style={{...heading, fontSize: o.title.length > 27 ? 74 : 92, maxWidth: 1020, WebkitLineClamp: 2}}>{o.title}</h1>
        <div style={{...body, marginTop: 26, maxWidth: 900}}>{o.body}</div>
      </Reveal>
      <div style={{position: 'absolute', bottom: 64, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', ...label, color: brand.muted}}><span>CODE. CONTEXT. CONVERSATION.</span><span>THE REVIEW DESK</span></div>
    </>}
    {o.kind === 'headline' && <>
      <Reveal {...common} style={{position: 'absolute', left: 64, top: 78, ...label, color: brand.orange}}>{kicker}</Reveal>
      <div style={{position: 'absolute', top: 182, bottom: 132, left: 64, width: 5, background: brand.orange, transform: `scaleY(${motion.enter})`, transformOrigin: 'top'}}/>
      <Reveal {...common} delay={staggerFrames} style={{position: 'absolute', left: 104, top: 196, width: 1030}}><h1 style={{...heading, fontSize: o.title.length > 55 ? 66 : 82}}>{o.title}</h1><div style={{...body, marginTop: 28, maxWidth: 880}}>{o.body}</div></Reveal>
      <Reveal {...common} delay={2 * staggerFrames} style={{position: 'absolute', left: 104, bottom: 72, ...label, color: brand.muted}}>THE REVIEW DESK <span style={{padding: '0 22px', color: brand.line}}>/</span> IN FOCUS</Reveal>
    </>}
    {o.kind === 'presenter' && <div style={{position: 'absolute', left: 64, bottom: 146, width: 750, transform: `translateX(${(1 - motion.enter) * -32 - motion.leave * 20}px)`}}>
      <div style={{display: 'inline-block', padding: '9px 17px', background: brand.orange, color: brand.ink, ...label, maxWidth: 750, ...lineClamp(1)}}>{kicker || 'AT THE DESK'}</div>
      <div style={{background: brand.panel, border: `1px solid ${brand.line}`, borderLeft: `4px solid ${brand.orange}`, padding: '22px 27px 25px'}}>
        <Reveal {...common} delay={staggerFrames}><div style={{...heading, fontSize: o.title.length > 28 ? 34 : 44, letterSpacing: -1, WebkitLineClamp: 1}}>{o.title}</div><div style={{...body, marginTop: 8, fontSize: 21, WebkitLineClamp: 1}}>{o.body}</div></Reveal>
      </div>
    </div>}
    {(o.kind === 'triage' || o.kind === 'stack') && <>
      <Reveal {...common} style={{position: 'absolute', left: 64, top: 80, ...label, color: brand.orange}}>{kicker}</Reveal>
      <Reveal {...common} delay={staggerFrames} style={{position: 'absolute', left: 64, top: 204, width: 465}}>
        <h1 style={{...heading, fontSize: o.title.length > 40 ? 55 : 64}}>{o.title}</h1>
        <div style={{...label, color: brand.muted, marginTop: 30, fontWeight: 400}}>{o.kind === 'triage' ? 'VALUE / RISK / EFFORT' : 'INTENT / IMPLEMENTATION / CONTEXT'}</div>
        <div style={{marginTop: 68, width: 50, height: 4, background: brand.orange}}/>
      </Reveal>
      <div style={{position: 'absolute', left: 585, top: 198, width: 630}}>
        {o.kind === 'triage' ? <>
          <div style={{display: 'flex', gap: 14}}>{['NOW', 'NEXT'].map((name, i) => <Reveal key={name} {...common} delay={(i + 1) * staggerFrames} style={{...panel, width: 307, minHeight: 290, padding: 23}}>
            <div style={{...label, display: 'flex', alignItems: 'center', gap: 9, color: i === 0 ? brand.orange : brand.muted}}><span style={{width: 7, height: 7, borderRadius: 7, background: i === 0 ? brand.orange : brand.muted}}/>{name}<span style={{marginLeft: 'auto', color: brand.muted}}>01</span></div>
            <div style={{borderTop: `1px solid ${brand.line}`, marginTop: 22, paddingTop: 24}}><span style={{font: `12px ${mono}`, color: brand.muted}}>SAMPLE / {i === 0 ? 'REVIEW PRIORITY' : 'UP NEXT'}</span><div style={{...heading, fontSize: 28, lineHeight: 1.22, letterSpacing: -0.6, marginTop: 18, WebkitLineClamp: 4}}>{items[i] ?? ['Review the next pull request', 'Plan the next review'][i]}</div></div>
          </Reveal>)}</div>
          <Reveal {...common} delay={2 * staggerFrames} style={{...label, color: brand.muted, fontSize: 11, marginTop: 22, fontWeight: 400}}>ILLUSTRATIVE QUEUE / EDIT TO MATCH YOUR STORY</Reveal>
        </> : items.slice(0, 3).map((item, i) => <Reveal key={i} {...common} delay={i * staggerFrames} style={{...panel, marginLeft: i * 17, width: 596 - i * 17, padding: '24px 25px', marginBottom: 12, display: 'flex', gap: 22, alignItems: 'center', minHeight: 96}}>
          <span style={{...label, fontSize: 16, color: i === 0 ? brand.orange : brand.muted}}>0{i + 1}</span><div style={{...heading, fontSize: 26, lineHeight: 1.22, letterSpacing: -0.5, WebkitLineClamp: 2}}>{item}</div><span style={{marginLeft: 'auto', color: i === 2 ? brand.mint : brand.line, fontSize: 22}}>↗</span>
        </Reveal>)}
      </div>
      <div style={{position: 'absolute', left: 64, bottom: 65, ...label, color: brand.muted}}>PRODUCT BRIEF <span style={{padding: '0 20px', color: brand.line}}>/</span> {o.kind === 'triage' ? 'TRIAGE' : 'CHANGE STACK'}</div>
    </>}
    {o.kind === 'ticker' && <div style={{position: 'absolute', left: 64, right: 64, bottom: 54, height: 62, background: brand.panel, border: `1px solid ${brand.line}`, display: 'flex', alignItems: 'center', transform: `translateY(${motion.offset}px)`}}>
      <div style={{...label, color: brand.orange, padding: '0 23px', width: 215, flexShrink: 0, ...lineClamp(2)}}>{o.title}</div>
      <div style={{width: 1, height: 26, background: brand.line, flexShrink: 0}}/>
      <div style={{padding: '0 26px', fontFamily: sans, fontSize: 20, flex: 1, ...lineClamp(1)}}>{items[Math.min(items.length - 1, Math.max(0, Math.floor((frame / fps - 0.6) / 3.5)))] ?? ''}</div>
      <span style={{...label, fontSize: 11, color: brand.muted, paddingRight: 22, maxWidth: 160, ...lineClamp(2)}}>{kicker}</span>
    </div>}
    {o.kind === 'bug' && <div style={{position: 'absolute', right: 64, top: 54, width: 263, background: brand.panel, border: `1px solid ${brand.line}`, padding: '21px 25px 17px', borderRadius: 10, transform: `translateY(${motion.offset}px)`}}>
      <Logo width={210}/><div style={{height: 1, background: brand.line, margin: '17px 0 12px'}}/><div style={{...label, fontSize: 11, letterSpacing: 0.6, ...lineClamp(1)}}>{o.title}</div><div style={{font: `10px ${mono}`, color: brand.muted, marginTop: 6, ...lineClamp(1)}}>{o.body}</div>
    </div>}
  </div>;
}
