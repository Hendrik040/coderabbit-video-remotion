import React, {type ReactNode} from 'react';
import {Place, type Sprite} from './draw';
import type {OverlayLayer} from './types';

/** One drawing op of a frame, in paint order (motion.py Ops). `key` is the engine's cache-key head. */
export type Op = {key: string; sub?: string; node: ReactNode};

export class Ops {
  list: Op[] = [];
  /** motion.py Ops.add: ops at or below alpha 0.002 are dropped; alpha keeps 3 decimals. */
  add(key: string, s: Sprite | null | undefined, x = 0, y = 0, a = 1, sub?: string) {
    if (!s || a <= 0.002) return;
    this.list.push({key, sub, node: <Place s={s} x={x} y={y} a={Math.round(a * 1000) / 1000}/>});
  }
  /** Ops that are not sprites (the eased slide video, the pixel-wipe canvas). */
  node(key: string, node: ReactNode, sub?: string) {
    this.list.push({key, sub, node});
  }
}

// motion.py OVERLAY_KINDS: each kit window holds one element type so layers stack cleanly.
const KINDS: Record<OverlayLayer, (o: Op) => boolean> = {
  card: o => o.key === 'card',
  explainer: o => ['fbg', 'fslide', 'fframe', 'flab', 'fpanel'].includes(o.key),
  chapter: o => ['chb', 'chn', 'cht'].includes(o.key) || (o.key === 'cbar' && o.sub === 'ch'),
  'name-intro': o => ['ni_a', 'ni_b'].includes(o.key) || (o.key === 'cbar' && o.sub === 'ni'),
  side: o => ['name', 'name_cut', 'name_up', 'qa', 'qa_cut'].includes(o.key),
  'no-static-chrome': o => o.key !== 'chrome',
};
export const keepLayer = (only: OverlayLayer | undefined) => (only ? KINDS[only] : () => true);
