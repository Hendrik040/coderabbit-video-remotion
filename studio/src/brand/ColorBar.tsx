import React from 'react';
import {colorBarState, colorBarTransitionState} from '../lib/colorBar';
import type {Overlay} from '../types';

/** Shared strip artwork for full-width bars and the lower-third color sweep. */
export function ColorBarTrack({segments, colors, width = 1280}: {segments: ReturnType<typeof colorBarState>; colors?: string[]; width?: number}) {
  return <>{segments.map((segment, index) => <div key={segment.name} data-segment={segment.name} style={{position: 'absolute', inset: 0, backgroundColor: colors?.[index] ?? segment.color, transformOrigin: '0 50%', transform: `translateX(${segment.start * 100}%) scaleX(${segment.width + 1 / width})`, zIndex: segment.z}}/>)}</>;
}

export function ColorBar({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const height = overlay.barHeight ?? 4;
  const position = overlay.barPosition ?? 'bottom';
  const transition = overlay.kind === 'color-bar-transition' ? colorBarTransitionState(frame, fps, overlay.duration) : null;
  const segments = transition?.segments ?? colorBarState(frame, fps, overlay.kind === 'color-bar-loop' ? overlay.loopDuration ?? 8 : overlay.duration, overlay.kind === 'color-bar-loop');
  const reverse = overlay.direction === 'left';
  const clipPath = transition ? `inset(0 ${(reverse ? transition.left : transition.right) * 100}% 0 ${(reverse ? transition.right : transition.left) * 100}%)` : undefined;
  return <div data-color-bar={overlay.kind} style={{position: 'absolute', isolation: 'isolate', left: 0, right: 0, height, top: position === 'top' ? 0 : position === 'center' ? (720 - height) / 2 : undefined, bottom: position === 'bottom' ? 0 : undefined, overflow: 'hidden', clipPath, opacity: overlay.opacity ?? 1}}>
    {/* One logical pixel of overlap prevents transparent seams between fractional segment edges. */}
    <ColorBarTrack segments={segments} colors={overlay.barColors}/>
  </div>;
}
