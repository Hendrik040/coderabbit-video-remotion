import React from 'react';
import {revealMotion, staggerFrames} from '../lib/motion';
import type {Overlay} from '../types';

/** A solid lower third; only its mask and text move. Frame math also drives exports. */
export function NameIntro({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const right = overlay.placement === 'right';
  const nameMotion = revealMotion(frame, overlay.duration, fps);
  const detailsMotion = revealMotion(frame, overlay.duration, fps, staggerFrames);
  const detailsTextMotion = revealMotion(frame, overlay.duration, fps, 2 * staggerFrames);
  const mask = (motion: typeof nameMotion) => {
    const hidden = (1 - motion.opacity) * 100;
    return right ? `inset(0 0 0 ${hidden}%)` : `inset(0 ${hidden}% 0 0)`;
  };
  const textStyle = (motion: typeof nameMotion) => ({
    opacity: motion.opacity, transform: `translateX(${(right ? 1 : -1) * motion.offset}px)`,
  });
  const position = overlay.body.trim().replace(/\s+/g, ' ');
  const company = (overlay.company ?? '').trim().replace(/\s+/g, ' ');
  const detailStyle: React.CSSProperties = {minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis'};
  return <div aria-label="Name intro" style={{
    position: 'absolute', bottom: 64, ...(right ? {right: 64} : {left: 64}),
    width: 560, color: overlay.textColor ?? '#121014',
    fontFamily: 'Geist, sans-serif', textAlign: right ? 'right' : 'left',
  }}>
    {overlay.title && <div className="name-intro-name" style={{padding: '24px 32px', backgroundColor: overlay.accent, clipPath: mask(nameMotion)}}>
      <div style={{...textStyle(nameMotion), fontSize: overlay.title.length > 28 ? 34 : 44, fontWeight: 600, lineHeight: 1.14, letterSpacing: -1.4, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap'}}>{overlay.title}</div>
    </div>}
    {(position || company) && <div className="name-intro-details" style={{padding: '14px 32px', backgroundColor: overlay.detailBackground ?? '#25E2A8', clipPath: mask(detailsMotion)}}>
      <div style={{...textStyle(detailsTextMotion), display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start', alignItems: 'baseline', gap: 12, fontSize: 24, fontWeight: 400, lineHeight: 1.35, letterSpacing: -0.3, whiteSpace: 'nowrap'}}>
        {position && <span style={detailStyle}>{position}</span>}
        {position && company && <span aria-hidden="true" style={{flexShrink: 0, opacity: 0.6}}>·</span>}
        {company && <span style={detailStyle}>{company}</span>}
      </div>
    </div>}
  </div>;
}
