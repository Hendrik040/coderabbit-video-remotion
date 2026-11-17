// Change Stack accents: colour bar strip, colour-bar wipe, brand stack wipe and the 4 px / 2 px pixel wipe.
// Segment geometry and colours come from studio/src/lib/colorBar.ts, the pixel field from studio/src/lib/pixelWipe.ts.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {colorBarSegments, colorBarTransitionTiming} from '../../../studio/src/lib/colorBar';
import {createWipePixels, pixelWipeDefaults, pixelWipeState} from '../../../studio/src/lib/pixelWipe';
import {ORANGE, hexRgb} from './constants';
import {R, Svg, solid, sprite, type Sprite} from './draw';
import {CBAR, TRAVEL, clamp, int, pyRound} from './motion';
import type {Ops} from './ops';

const byZ = [...colorBarSegments].sort((a, b) => a.z - b.z);

/** Change Stack accent bar: anchored, overlapping segments widen with `expansion` (motion.py color_bar),
 * showing only columns a0..a1-1 of it. */
function colorBar(w: number, h: number, expansion: number, a0: number, a1: number): Sprite {
  return sprite(int(w), int(h), <Svg w={int(w)} h={int(h)}>
    {byZ.map(s => {
      const wd = s.size + (Math.max(s.size, s.expanded) - s.size) * expansion, x0 = s.start * w;
      const l = Math.max(int(x0), a0), r = Math.min(int(x0 + wd * w), a1 - 1);
      return r >= l ? <R key={s.name} x0={l} y0={0} x1={r} y1={h} fill={s.color}/> : null;
    })}
  </Svg>);
}

/** Reveal from the left, drift, clear to the right (32% / 36% / 32%; motion.py color_bar_strip). */
export function colorBarStrip(f: number, f0: number, n: number, w: number, h: number): Sprite | null {
  const {reveal: r, exit} = colorBarTransitionTiming;
  const ph = clamp((f - f0) / Math.max(1, n));
  const enter = CBAR(ph / r), leave = CBAR((ph - exit) / (1 - exit));
  const expansion = 0.85 * CBAR(ph / r) + 0.15 * ph;
  const a0 = int(w * leave), a1 = int(w * enter);
  return a1 <= a0 ? null : colorBar(w, h, expansion, a0, a1);
}

/** Brand colour-bar wipe: ten Change Stack bands enter left, cover at fc, exit right. */
export function colorbarWipeOps(ops: Ops, f: number, fc: number, n: number, rect: readonly [number, number, number, number]) {
  const [x, y, w, h] = rect, t = (f - (fc - n / 2)) / n;
  if (!(t >= 0 && t <= 1)) return;
  const bands = colorBarSegments.length, st = 0.02, span = 0.5 - (bands - 1) * st, bh = h / bands;
  colorBarSegments.forEach((seg, i) => {
    const by = int(y + i * bh), hh = pyRound(y + (i + 1) * bh) - by;
    const cov = t < 0.5 ? TRAVEL((t - i * st) / span) : 1, unc = t >= 0.5 ? TRAVEL((t - 0.5 - i * st) / span) : 0;
    const x0 = x + w * unc, x1 = x + w * cov;
    if (x1 - x0 >= 1) ops.add('cw', solid(x1 - x0, hh, seg.color), x0, by, 1);
  });
}

/** Brand stack wipe: six staggered rails (accent leads, panel follows), opaque at the cut frame fc. */
export function stackWipeOps(ops: Ops, f: number, fc: number, n: number, rect: readonly [number, number, number, number], panel: (sx: number, sy: number, w: number, h: number) => Sprite, key: string, rails = 6) {
  const [x, y, w, h] = rect, t = (f - (fc - n / 2)) / n;
  if (!(t >= 0 && t <= 1)) return;
  const st = 0.035, lead = 0.03, span = 0.5 - (rails - 1) * st - lead, rh = h / rails;
  for (let i = 0; i < rails; i++) {
    const by = int(y + i * rh), hh = pyRound(y + (i + 1) * rh) - by;
    for (const acc of [true, false]) {
      const dl = acc ? 0 : lead;
      const cov = t < 0.5 ? TRAVEL((t - i * st - dl) / span) : 1;
      const unc = t >= 0.5 ? TRAVEL((t - 0.5 - i * st - (lead - dl)) / span) : 0;
      const x0 = x + w * unc, x1 = x + w * cov;
      if (x1 - x0 < 1) continue;
      if (acc) ops.add(key, solid(x1 - x0, hh, ORANGE), x0, by, 1);
      else ops.add(key, panel(int(x0 - x), by - y, int(x1 - x) - int(x0 - x), hh), x0, by, 1);
    }
  }
}

// ---------------------------------------------------------------- pixel wipe (Full intro)
const [OR, OG, OB] = hexRgb(ORANGE);
function PixelCanvas({w, h, phase}: {w: number; h: number; phase: number}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pixels = useMemo(() => createWipePixels(pixelWipeDefaults.pixelSize, w, h), [w, h]);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(w, h), d = img.data;
    for (const p of pixels) {
      const alpha = int(pixelWipeState(p, phase, pixelWipeDefaults.scatter).opacity * 255);   // uint8, as numpy truncates
      if (alpha <= 0) continue;
      for (let yy = p.y; yy < Math.min(h, p.y + p.height); yy++) for (let xx = p.x; xx < Math.min(w, p.x + p.width); xx++) {
        const i = 4 * (yy * w + xx);
        d[i] = OR; d[i + 1] = OG; d[i + 2] = OB; d[i + 3] = alpha;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [pixels, phase, w, h]);
  return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}/>;
}
/** Fixed 4 px points / 2 px gaps; a staggered visibility wave reveals, fills and fades from the left. */
export const pixelWipe = (w: number, h: number, phase: number): Sprite => ({w, h, el: <PixelCanvas w={w} h={h} phase={phase}/>});
