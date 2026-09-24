import React from 'react';
import {revealMotion, staggerFrames} from '../lib/motion';
import {colorBarIntroState} from '../lib/colorBar';
import {ColorBarTrack} from './ColorBar';
import type {Overlay} from '../types';

const directionalMask = (left: number, right: number, reverse: boolean) => `inset(0 ${(reverse ? left : right) * 100}% 0 ${(reverse ? right : left) * 100}%)`;
function IntroColorSweep({state, reverse}: {state: ReturnType<typeof colorBarIntroState>; reverse: boolean}) {
  return <div className="name-intro-color-sweep" aria-hidden="true" style={{position: 'absolute', inset: 0, isolation: 'isolate', overflow: 'hidden', pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: 0, transform: reverse ? 'scaleX(-1)' : undefined}}><ColorBarTrack segments={state.segments} width={560}/></div>
  </div>;
}

/** A solid lower third; only its mask and text move. Frame math also drives exports. */
export function NameIntro({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const right = overlay.placement === 'right';
  const colorBar = overlay.kind === 'name-intro-wipe';
  const nameMotion = revealMotion(frame, overlay.duration, fps);
  const detailsMotion = revealMotion(frame, overlay.duration, fps, staggerFrames);
  const detailsTextMotion = revealMotion(frame, overlay.duration, fps, 2 * staggerFrames);
  const sweep = colorBar ? colorBarIntroState(frame, fps, overlay.duration) : null;
  const detailsSweep = colorBar ? colorBarIntroState(frame, fps, overlay.duration, overlay.title ? staggerFrames : 0) : null;
  const mask = (motion: typeof nameMotion, panelSweep: typeof sweep) => {
    if (panelSweep) return directionalMask(panelSweep.cardLeft, panelSweep.cardRight, right);
    const hidden = (1 - motion.opacity) * 100;
    return right ? `inset(0 0 0 ${hidden}%)` : `inset(0 ${hidden}% 0 0)`;
  };
  // Each final fill and its text resolve together, over one continuous palette bed.
  const textStyle = (motion: typeof nameMotion) => colorBar ? {} : ({
    opacity: motion.opacity, transform: `translateX(${(right ? 1 : -1) * motion.offset}px)`,
  });
  const position = overlay.body.trim().replace(/\s+/g, ' ');
  const company = (overlay.company ?? '').trim().replace(/\s+/g, ' ');
  // Bleed the lower fill into the upper one so fractional preview scales cannot
  // expose a seam. Extra top padding preserves the text position and total height.
  const detailsJoin = overlay.title ? {marginTop: -1, paddingTop: 15} : {};
  const detailStyle: React.CSSProperties = {minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis'};
  return <div aria-label="Name intro" style={{
    position: 'absolute', bottom: 64, ...(right ? {right: 64} : {left: 64}),
    width: 560, color: overlay.textColor ?? '#121014', isolation: 'isolate',
    clipPath: sweep ? directionalMask(sweep.leave, 1 - sweep.enter, right) : undefined,
    fontFamily: 'Geist, sans-serif', textAlign: right ? 'right' : 'left',
  }}>
    {sweep && <IntroColorSweep state={sweep} reverse={right}/>}
    <div className="name-intro-card" style={{position: 'relative'}}>
      {overlay.title && <div className="name-intro-name" style={{position: 'relative', padding: '24px 32px', backgroundColor: overlay.accent, clipPath: mask(nameMotion, sweep)}}>
        <div style={{...textStyle(nameMotion), fontSize: overlay.title.length > 28 ? 34 : 44, fontWeight: 600, lineHeight: 1.14, letterSpacing: -1.4, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap'}}>{overlay.title}</div>
      </div>}
      {(position || company) && <div className="name-intro-details" style={{position: 'relative', padding: '14px 32px', ...detailsJoin, backgroundColor: overlay.detailBackground ?? '#25E2A8', color: overlay.detailTextColor ?? overlay.textColor ?? '#121014', clipPath: mask(detailsMotion, detailsSweep)}}>
        <div style={{...textStyle(detailsTextMotion), display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start', alignItems: 'baseline', gap: 12, fontSize: 24, fontWeight: 400, lineHeight: 1.35, letterSpacing: -0.3, whiteSpace: 'nowrap'}}>
          {position && <span style={detailStyle}>{position}</span>}
          {position && company && <span aria-hidden="true" style={{flexShrink: 0, opacity: 0.6}}>·</span>}
          {company && <span style={detailStyle}>{company}</span>}
        </div>
      </div>}
    </div>
  </div>;
}
