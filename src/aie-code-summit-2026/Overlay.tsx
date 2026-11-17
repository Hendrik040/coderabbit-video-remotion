import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {frameOps} from './engine/frame';
import {useEngineFonts} from './engine/metrics';
import {keepLayer} from './engine/ops';
import type {OverlayLayer, Version} from './engine/types';

export type OverlayProps = {version: Version; only?: OverlayLayer};

/** The motion package for one frame, transparent everywhere outside its graphics (the engine's RGBA overlay).
 * `only` keeps one element group, like the windows of the v4 Premiere / After Effects kit. */
export const Overlay: React.FC<OverlayProps> = ({version, only}) => {
  const frame = useCurrentFrame();
  const ready = useEngineFonts();
  if (!ready) return null;
  const keep = keepLayer(only);
  return <AbsoluteFill style={{WebkitFontSmoothing: 'antialiased'}}>
    {frameOps(frame, version).list.filter(keep).map((op, i) => <React.Fragment key={`${op.key}-${i}`}>{op.node}</React.Fragment>)}
  </AbsoluteFill>;
};
