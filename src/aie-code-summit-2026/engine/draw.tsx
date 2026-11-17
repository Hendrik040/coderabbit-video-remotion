// Drawing primitives with the v4 engine's Pillow semantics: inclusive, truncated rectangle coordinates,
// Pillow's wide-line rows, aliased ellipses, outlines drawn inside, and text on integer glyph positions.
import React, {useLayoutEffect, useRef, type CSSProperties, type ReactNode} from 'react';
import {FACES, glyphRun, getlength, tlen, type Anchor, type Face, type SegWord} from './metrics';
import {hexRgb} from './constants';
import {int, pilRound, pyRound} from './num';

/** A rendered element of known size: the counterpart of a Pillow sprite image. */
export type Sprite = {w: number; h: number; el: ReactNode};

const box = (w: number, h: number): CSSProperties => ({position: 'absolute', left: 0, top: 0, width: w, height: h});

/** Pillow comp(canvas, im, x, y, a): rounded position, group opacity, clipped to the sprite size. */
export function Place({s, x, y, a = 1}: {s: Sprite | null | undefined; x: number; y: number; a?: number}) {
  if (!s || a <= 0.002) return null;
  return <div style={{position: 'absolute', left: pyRound(x), top: pyRound(y), width: s.w, height: s.h, overflow: 'hidden', opacity: a < 0.999 ? a : 1}}>{s.el}</div>;
}
/** im.crop((x0, y0, x1, y1)). */
export const crop = (s: Sprite, x0: number, y0: number, x1: number, y1: number): Sprite => ({
  w: x1 - x0, h: y1 - y0,
  el: <div style={{position: 'absolute', left: -x0, top: -y0, width: s.w, height: s.h}}>{s.el}</div>,
});
export const sprite = (w: number, h: number, ...layers: ReactNode[]): Sprite => ({
  w, h, el: <>{layers.map((l, i) => <React.Fragment key={i}>{l}</React.Fragment>)}</>,
});
/** A vector layer covering its sprite. */
export const Svg = ({w, h, children}: {w: number; h: number; children: ReactNode}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{...box(w, h), overflow: 'hidden'}}>{React.Children.toArray(children)}</svg>
);
/** Image.new(size, colour): an opaque block. */
export const solid = (w: number, h: number, color: string): Sprite => {
  const ww = Math.max(1, int(w)), hh = Math.max(1, int(h));
  return {w: ww, h: hh, el: <div style={{...box(ww, hh), background: color}}/>};
};

// ---------------------------------------------------------------- shapes
/** d.rectangle((x0, y0, x1, y1), fill): both corners inclusive, coordinates truncated. */
export function R({x0, y0, x1, y1, fill}: {x0: number; y0: number; x1: number; y1: number; fill: string}) {
  const a = int(x0), b = int(y0), c = int(x1), d = int(y1);
  if (c < a || d < b) return null;
  return <rect x={a} y={b} width={c - a + 1} height={d - b + 1} fill={fill} shapeRendering="crispEdges"/>;
}
/** d.rectangle(..., outline=stroke, width=w): the outline sits inside the rectangle. */
export function RO({x0, y0, x1, y1, stroke, w = 1}: {x0: number; y0: number; x1: number; y1: number; stroke: string; w?: number}) {
  const a = int(x0), b = int(y0), c = int(x1), d = int(y1);
  return <>
    <R x0={a} y0={b} x1={c} y1={b + w - 1} fill={stroke}/>
    <R x0={a} y0={d - w + 1} x1={c} y1={d} fill={stroke}/>
    <R x0={a} y0={b} x1={a + w - 1} y1={d} fill={stroke}/>
    <R x0={c - w + 1} y0={b} x1={c} y1={d} fill={stroke}/>
  </>;
}
/** d.line((x0, y0, x1, y1), width=w). Axis-aligned lines reproduce Pillow's rows exactly (even widths
 * put the extra row below/right when drawn forward, above/left when drawn backward). */
export function Ln({x0, y0, x1, y1, w = 1, fill}: {x0: number; y0: number; x1: number; y1: number; w?: number; fill: string}) {
  const a = int(x0), b = int(y0), c = int(x1), d = int(y1);
  const lo = Math.floor((w - 1) / 2), hi = Math.ceil((w - 1) / 2);
  if (a === c && b === d) return <R x0={a} y0={b} x1={a} y1={b} fill={fill}/>;
  if (b === d) {
    const [t, u] = c >= a ? [b - lo, b + hi] : [b - hi, b + lo];
    return <R x0={Math.min(a, c)} y0={t} x1={Math.max(a, c)} y1={u} fill={fill}/>;
  }
  if (a === c) {
    const [l, r] = d >= b ? [a - lo, a + hi] : [a - hi, a + lo];
    return <R x0={l} y0={Math.min(b, d)} x1={r} y1={Math.max(b, d)} fill={fill}/>;
  }
  return <line x1={a + 0.5} y1={b + 0.5} x2={c + 0.5} y2={d + 0.5} stroke={fill} strokeWidth={w}/>;
}
/** The supersampled rounded rectangle (motion.py rrect); the outline replaces the fill beneath it. */
export function RRect({w, h, r, fill, stroke, sw = 1}: {w: number; h: number; r: number; fill?: string; stroke?: string; sw?: number}) {
  const inset = stroke ? sw : 0;
  return <>
    {fill && <rect x={inset} y={inset} width={w - 2 * inset} height={h - 2 * inset} rx={Math.max(0, r - inset)} fill={fill}/>}
    {stroke && <rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} rx={Math.max(0, r - sw / 2)} fill="none" stroke={stroke} strokeWidth={sw}/>}
  </>;
}
/** d.ellipse(bbox): aliased, bbox inclusive and truncated, outline inside. */
export function Ell({x0, y0, x1, y1, fill, stroke, sw = 1}: {x0: number; y0: number; x1: number; y1: number; fill?: string; stroke?: string; sw?: number}) {
  const a = int(x0), b = int(y0), c = int(x1), d = int(y1);
  const cx = (a + c + 1) / 2, cy = (b + d + 1) / 2, rx = (c - a + 1) / 2, ry = (d - b + 1) / 2;
  const inset = stroke ? sw : 0;
  return <>
    {fill && <ellipse cx={cx} cy={cy} rx={Math.max(0, rx - inset)} ry={Math.max(0, ry - inset)} fill={fill} shapeRendering="crispEdges"/>}
    {stroke && <ellipse cx={cx} cy={cy} rx={rx - sw / 2} ry={ry - sw / 2} fill="none" stroke={stroke} strokeWidth={sw} shapeRendering="crispEdges"/>}
  </>;
}

// ---------------------------------------------------------------- text
const TEXT: CSSProperties = {
  fontKerning: 'none', fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "clig" 0, "calt" 0, "kern" 0',
  textRendering: 'geometricPrecision', whiteSpace: 'pre',
};
type TextProps = {s: string; x: number; y: number; face: Face; size: number; fill: string; tr?: number; anchor?: Anchor};
/** d.text((x, y), s, anchor) when tr is 0, tracked(d, x, y, s, font, fill, tr) otherwise. */
export function Txt({s, x, y, face, size, fill, tr = 0, anchor = 'ls'}: TextProps) {
  const {xs, chars} = glyphRun(s, face, size, x, tr, anchor);
  if (!chars.length) return null;
  const f = FACES[face];
  return <text x={xs.join(' ')} y={pilRound(y)} fill={fill} fontFamily={f.family} fontWeight={f.weight} fontSize={size} style={TEXT}>{chars.join('')}</text>;
}
/** Hack Bold technical label, uppercase, +0.1em tracking unless given (motion.py label). */
export const Label = ({s, size, tr, ...p}: Omit<TextProps, 'face' | 'tr'> & {tr?: number}) =>
  <Txt {...p} s={s.toUpperCase()} face="M" size={size} tr={tr ?? size * 0.1}/>;
export const labelEnd = (s: string, x: number, size: number, tr?: number) => x + tlen(s.toUpperCase(), 'M', size, tr ?? size * 0.1);
/** draw_segs: words of a wrapped heading line in their colours. */
export function Segs<C extends string>({line, x, y, face, size, tr = 0, color}: {line: SegWord<C>[]; x: number; y: number; face: Face; size: number; tr?: number; color: (c: C) => string}) {
  let pen = x;
  return <>{line.map(([w, c, space], i) => {
    if (space) pen += getlength(' ', face, size);
    const at = pen;
    pen += tlen(w, face, size, tr);
    return <Txt key={i} s={w} x={at} y={y} face={face} size={size} fill={color(c)} tr={tr}/>;
  })}</>;
}

// ---------------------------------------------------------------- bitmaps (grid sprites with a soft glow)
/** Draw an ImageData region with putImageData (synchronous, so every rendered frame is complete). */
export function Bitmap({img, sx = 0, sy = 0, w, h}: {img: ImageData; sx?: number; sy?: number; w?: number; h?: number}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cw = Math.max(1, w ?? img.width), ch = Math.max(1, h ?? img.height);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    ctx.putImageData(img, -sx, -sy, sx, sy, cw, ch);
  }, [img, sx, sy, cw, ch]);
  return <canvas ref={ref} width={cw} height={ch} style={box(cw, ch)}/>;
}

// Pillow GaussianBlur = three box-blur passes per axis (BoxBlur.c), on an 8-bit mask.
function gaussianBoxRadius(radius: number, passes = 3) {
  const sigma2 = Math.fround(radius * radius / passes);
  const L = Math.fround(Math.sqrt(12 * sigma2 + 1));
  const l = Math.floor((L - 1) / 2);
  const a = ((2 * l + 1) * (l * (l + 1) - 3 * sigma2)) / (6 * (sigma2 - (l + 1) * (l + 1)));
  return Math.fround(l + a);
}
function boxBlurLines(data: Uint8Array, width: number, height: number, stride: number, step: number, floatRadius: number) {
  const radius = Math.trunc(floatRadius);
  const ww = Math.trunc(16777216 / (floatRadius * 2 + 1));
  const fw = Math.trunc((16777216 - (radius * 2 + 1) * ww) / 2);
  const edgeA = Math.min(radius + 1, width), edgeB = Math.max(width - radius - 1, 0), last = width - 1;
  const line = new Uint8Array(width), out = new Uint8Array(width);
  const save = (x: number, bulk: number) => { out[x] = Math.floor((bulk + 8388608) / 16777216); };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) line[x] = data[y * stride + x * step];
    let acc = line[0] * (radius + 1);
    for (let x = 0; x < edgeA - 1; x++) acc += line[x];
    acc += line[last] * (radius - edgeA + 1);
    const far = (l: number, r: number) => acc * ww + (line[l] + line[r]) * fw;
    if (edgeA <= edgeB) {
      for (let x = 0; x < edgeA; x++) { acc += line[x + radius] - line[0]; save(x, far(0, x + radius + 1)); }
      for (let x = edgeA; x < edgeB; x++) { acc += line[x + radius] - line[x - radius - 1]; save(x, far(x - radius - 1, x + radius + 1)); }
      for (let x = edgeB; x <= last; x++) { acc += line[last] - line[x - radius - 1]; save(x, far(x - radius - 1, last)); }
    } else {
      for (let x = 0; x < edgeB; x++) { acc += line[x + radius] - line[0]; save(x, far(0, x + radius + 1)); }
      for (let x = edgeB; x < edgeA; x++) { acc += line[last] - line[0]; save(x, far(0, last)); }
      for (let x = edgeA; x <= last; x++) { acc += line[last] - line[x - radius - 1]; save(x, far(x - radius - 1, last)); }
    }
    for (let x = 0; x < width; x++) data[y * stride + x * step] = out[x];
  }
}
const div255 = (v: number) => { const t = v + 128; return ((t >> 8) + t) >> 8; };
const bitmaps = new Map<string, ImageData>();
/** motion.py grid_sprite: fill, 1 px grid lines every `step`, optional blurred colour glow (gx, gy, r, alpha, colour). */
export function gridBitmap(w: number, h: number, step: number, fill: string, line: string, glow?: [number, number, number, number, string]) {
  const key = [w, h, step, fill, line, glow?.join()].join('|');
  const hit = bitmaps.get(key);
  if (hit) return hit;
  const img = new ImageData(w, h), px = img.data;
  const [fr, fg, fb] = hexRgb(fill), [lr, lg, lb] = hexRgb(line);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const on = x % step === 0 || y % step === 0, i = 4 * (y * w + x);
    px[i] = on ? lr : fr; px[i + 1] = on ? lg : fg; px[i + 2] = on ? lb : fb; px[i + 3] = 255;
  }
  if (glow) {
    const [gx, gy, r, alpha, color] = glow, [cr, cg, cb] = hexRgb(color);
    const mask = new Uint8Array(w * h);
    for (let y = Math.max(0, gy - r); y <= Math.min(h - 1, gy + r); y++)
      for (let x = Math.max(0, gx - r); x <= Math.min(w - 1, gx + r); x++)
        if ((x - gx) ** 2 + (y - gy) ** 2 <= (r + 0.5) ** 2) mask[y * w + x] = alpha;
    const br = gaussianBoxRadius(r / 2.2);
    for (let i = 0; i < 3; i++) boxBlurLines(mask, w, h, w, 1, br);
    for (let i = 0; i < 3; i++) boxBlurLines(mask, h, w, 1, w, br);
    for (let i = 0; i < w * h; i++) {
      const m = mask[i];
      if (!m) continue;
      px[4 * i] = div255(px[4 * i] * (255 - m) + cr * m);
      px[4 * i + 1] = div255(px[4 * i + 1] * (255 - m) + cg * m);
      px[4 * i + 2] = div255(px[4 * i + 2] * (255 - m) + cb * m);
    }
  }
  bitmaps.set(key, img);
  return img;
}
