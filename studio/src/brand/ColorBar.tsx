import React from 'react';
import {colorBarState} from '../lib/colorBar';
import type {Overlay} from '../types';

export function ColorBar({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const height = overlay.barHeight ?? 4;
  const position = overlay.barPosition ?? 'bottom';
  const segments = colorBarState(frame, fps, overlay.kind === 'color-bar-loop' ? overlay.loopDuration ?? 8 : overlay.duration, overlay.kind === 'color-bar-loop');
  return <div data-color-bar={overlay.kind} style={{position: 'absolute', left: 0, right: 0, height, top: position === 'top' ? 0 : position === 'center' ? (720 - height) / 2 : undefined, bottom: position === 'bottom' ? 0 : undefined, overflow: 'hidden', opacity: overlay.opacity ?? 1}}>
    {segments.map((segment, index) => <div key={segment.name} data-segment={segment.name} style={{position: 'absolute', inset: 0, backgroundColor: overlay.barColors?.[index] ?? segment.color, transformOrigin: '0 50%', transform: `translateX(${segment.start * 100}%) scaleX(${segment.width})`, zIndex: segment.z}}/>)}
  </div>;
}
