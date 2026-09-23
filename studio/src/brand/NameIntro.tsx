import React from 'react';
import {revealMotion, staggerFrames} from '../lib/motion';
import type {Overlay} from '../types';

/** A solid lower third; only its mask and text move. Frame math also drives exports. */
export function NameIntro({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const right = overlay.placement === 'right';
  const motion = revealMotion(frame, overlay.duration, fps);
  const hidden = (1 - motion.enter * (1 - motion.leave)) * 100;
  const lines = [
    {text: overlay.title, size: overlay.title.length > 28 ? 34 : 44, weight: 600, gap: 0},
    {text: overlay.body, size: 24, weight: 400, gap: 12},
    {text: overlay.company ?? '', size: 20, weight: 400, gap: 4},
  ];
  return <div aria-label="Name intro" style={{
    position: 'absolute', bottom: 64, ...(right ? {right: 64} : {left: 64}),
    width: 560, boxSizing: 'border-box', padding: '28px 32px',
    backgroundColor: overlay.accent, color: overlay.textColor ?? '#121014',
    fontFamily: 'Geist, sans-serif', textAlign: right ? 'right' : 'left',
    clipPath: right ? `inset(0 0 0 ${hidden}%)` : `inset(0 ${hidden}% 0 0)`,
  }}>
    {lines.map((line, i) => {
      if (!line.text) return null;
      const textMotion = revealMotion(frame, overlay.duration, fps, i * staggerFrames);
      return <div key={i} style={{overflow: 'hidden', marginTop: line.gap}}>
        <div style={{
          fontSize: line.size, fontWeight: line.weight, lineHeight: i === 0 ? 1.14 : 1.35,
          letterSpacing: i === 0 ? -1.4 : -0.3, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap',
          opacity: textMotion.opacity, transform: `translateX(${(right ? 1 : -1) * textMotion.offset}px)`,
        }}>{line.text}</div>
      </div>;
    })}
  </div>;
}
