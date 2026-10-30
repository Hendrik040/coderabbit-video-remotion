import React, {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {Easing, Img, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** The Antigravity edit runs at 29.97 fps. Scene cues are composition seconds; useClock().at() converts timeline seconds. */
export const FPS = 30000 / 1001;
export const startSeconds = (startFrame: number) => startFrame / FPS;

// CodeRabbit tokens from studio/src/lib/brandPalette.ts, plus paper and three light tints that are not in the palette.
export const C = {
  ink: '#121014', panel: '#1A181D', panel2: '#232127', raised: '#2B282F', rule: '#3C3841', rule2: '#4A464F',
  muted: '#7D7982', dim: '#B5B2B9', text: '#EFEDF0',
  orange: '#FF570A', orangeSoft: '#FF801F', orangeDeep: '#462100', orangeTint: '#FFE4D6',
  mint: '#25E2A8', mintDeep: '#062619', mintDark: '#006947', mintTint: '#D2F7E8',
  cobalt: '#687FF5', cobaltDeep: '#171D37', cobaltSoft: '#9DB3FF', cobaltTint: '#E1E6FF',
  cream: '#F7F2EF', cream2: '#EBE7E6', cream3: '#DACDC6', cream4: '#A1887E', brown: '#311C15', paper: '#FFFCFA',
};
export const MONO = 'Hack, monospace';
export const SANS = 'Geist, sans-serif';

let fonts: Promise<unknown> | undefined;
export function useBrandFonts() {
  const [handle] = useState(() => delayRender('Loading local CodeRabbit fonts'));
  useEffect(() => {
    fonts ??= Promise.all([
      ['Geist', 'Regular', '400'], ['Geist', 'SemiBold', '600'],
      ['Hack', 'Regular', '400'], ['Hack', 'Bold', '700'],
    ].map(async ([family, style, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`brand/fonts/${family}-${style}.ttf`)})`, {weight});
      document.fonts.add(await face.load());
    }));
    fonts.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
}

// Brand motion: 600 ms strong ease-out entrances, 400 ms exits toward the entrance edge.
const revealCurve = Easing.bezier(0.23, 1, 0.32, 1);
const travelCurve = Easing.bezier(0.77, 0, 0.175, 1);
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const reveal = (v: number) => revealCurve(clamp01(v));
export const travel = (v: number) => travelCurve(clamp01(v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Composition-local time and the timeline start, so cues can be written in timeline seconds. */
export function useClock(startFrame: number) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const t0 = startFrame / FPS;
  return {frame, t, at: (timeline: number) => timeline - t0};
}

/** Enter at `start`, leave at `end`: opacity, the brand's 28 px rise, and a 12 px exit back toward the entrance edge. */
export function envelope(t: number, start: number, end = Infinity, enter = 0.6, exit = 0.4) {
  const a = reveal((t - start) / enter);
  const b = Number.isFinite(end) ? reveal((t - end) / exit) : 0;
  return {a, b, o: a * (1 - b), y: (1 - a) * 28 + b * 12};
}

export function appear(t: number, start: number, end = Infinity, enter = 0.6): CSSProperties {
  const e = envelope(t, start, end, enter);
  return {opacity: e.o, transform: `translateY(${e.y}px)`};
}

/** Left-to-right wipe used by the name lower third, applied to chips and cards.
 * clip-path also clips the element's own box-shadow, so a wiped card's shadow is cut at the clip edges. */
export function wipe(t: number, start: number, end = Infinity, enter = 0.45, exit = 0.35): CSSProperties {
  const a = reveal((t - start) / enter);
  const b = Number.isFinite(end) ? travel((t - end) / exit) : 0;
  const open = a * (1 - b);
  return {clipPath: `inset(-40px ${(1 - open) * 100}% -40px 0)`, opacity: open > 0.001 ? 1 : 0};
}

export function Chip({children, bg, fg = C.ink, size = 22, mono = true, weight = 700, style, pad}: {
  children: ReactNode; bg: string; fg?: string; size?: number; mono?: boolean; weight?: number; style?: CSSProperties; pad?: string;
}) {
  return <div style={{
    display: 'inline-flex', alignItems: 'center', gap: size * 0.45, background: bg, color: fg,
    fontFamily: mono ? MONO : SANS, fontSize: size, fontWeight: weight, lineHeight: 1,
    padding: pad ?? `${size * 0.42}px ${size * 0.62}px`, borderRadius: 6, whiteSpace: 'nowrap', ...style,
  }}>{children}</div>;
}

/** Orange mark on light surfaces, white mark on orange or cobalt chips (brand rule: light colorways use orange). */
export function Logomark({size = 26, onColor = false, style}: {size?: number; onColor?: boolean; style?: CSSProperties}) {
  return <Img src={staticFile(onColor ? 'brand/white-logomark.svg' : 'cr-logo.png')} style={{width: size, height: size, objectFit: 'contain', flexShrink: 0, ...style}}/>;
}

export function Check({size = 18, color = C.ink}: {size?: number; color?: string}) {
  return <svg width={size} height={size} viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="square"/></svg>;
}

/** Thin elbow connector that draws on, ending in one 6 px brand pixel. */
export function Connector({points, progress, color = C.dim, width = 2, node = true, nodeColor}: {
  points: [number, number][]; progress: number; color?: string; width?: number; node?: boolean; nodeColor?: string;
}) {
  const p = clamp01(progress);
  if (p <= 0) return null;
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  const [ex, ey] = points[points.length - 1];
  return <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={length} strokeDashoffset={length * (1 - p)}/>
    {node && p > 0.97 ? <rect x={ex - 3} y={ey - 3} width={6} height={6} fill={nodeColor ?? color}/> : null}
  </svg>;
}

/** Deterministic glyph noise for decode-in text. */
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz0123456789<>=+-/';
const noise = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return GLYPHS[Math.floor((x - Math.floor(x)) * GLYPHS.length)];
};

/** Characters resolve left to right from brief glyph noise. */
export function Decode({text, t, start, duration = 0.5, frame}: {text: string; t: number; start: number; duration?: number; frame: number}) {
  const p = (t - start) / duration;
  if (p <= 0) return <span style={{opacity: 0}}>{text}</span>;
  if (p >= 1.25) return <>{text}</>;
  const n = text.length;
  return <>{text.split('').map((ch, i) => {
    const local = p * 1.25 * n - i;
    if (ch === ' ') return ' ';
    if (local >= 1.2) return ch;
    if (local <= 0) return <span key={i} style={{opacity: 0}}>{ch}</span>;
    return <span key={i} style={{opacity: 0.75}}>{noise(i, Math.floor(frame / 2))}</span>;
  })}</>;
}

/** Text typed by a schedule of [time, characters shown] pairs; holds between pairs. */
export function typedCount(t: number, schedule: [number, number][]) {
  if (t <= schedule[0][0]) return schedule[0][1];
  for (let i = 1; i < schedule.length; i++) {
    const [t1, n1] = schedule[i];
    const [ta, na] = schedule[i - 1];
    if (t < t1) return Math.round(mix(na, n1, (t - ta) / (t1 - ta)));
  }
  return schedule[schedule.length - 1][1];
}

export function Caret({t, until, color = C.orange, w = 13, h = 30, blinkFrom}: {t: number; until?: number; color?: string; w?: number; h?: number; blinkFrom?: number}) {
  // Steady while typing, then at most four blinks so it never pulses past the brand's limit.
  let on = true;
  if (blinkFrom !== undefined && t > blinkFrom) {
    const k = Math.floor((t - blinkFrom) / 0.5);
    on = k >= 8 ? true : k % 2 === 0;
  }
  if (until !== undefined && t > until) on = false;
  return <span style={{display: 'inline-block', width: w, height: h, background: color, marginLeft: 3, verticalAlign: 'text-bottom', opacity: on ? 1 : 0}}/>;
}

type CursorKey = {t: number; x: number; y: number; click?: boolean};
/** Pointer that travels between keys with the brand travel curve and pulses on clicks. */
export function Cursor({t, keys, show}: {t: number; keys: CursorKey[]; show: [number, number]}) {
  const o = envelope(t, show[0], show[1], 0.25, 0.25).o;
  if (o <= 0) return null;
  let x = keys[0].x, y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    if (t >= keys[i].t) { x = keys[i].x; y = keys[i].y; continue; }
    const travelTime = Math.min(0.55, keys[i].t - keys[i - 1].t);
    const p = travel((t - (keys[i].t - travelTime)) / travelTime);
    x = mix(keys[i - 1].x, keys[i].x, p); y = mix(keys[i - 1].y, keys[i].y, p);
    break;
  }
  const click = keys.filter(k => k.click && t >= k.t && t < k.t + 0.45).pop();
  const c = click ? (t - click.t) / 0.45 : 1;
  const press = click ? 1 - 0.14 * Math.sin(Math.PI * clamp01(c * 2.2)) : 1;
  return <div style={{position: 'absolute', left: 0, top: 0, opacity: o, pointerEvents: 'none'}}>
    {click ? <div style={{position: 'absolute', left: click.x - 26 * c - 4, top: click.y - 26 * c - 4, width: 52 * c + 8, height: 52 * c + 8,
      border: `3px solid ${C.orange}`, borderRadius: '50%', opacity: 1 - c}}/> : null}
    <svg width={34} height={40} viewBox="0 0 34 40" style={{position: 'absolute', left: x - 3, top: y - 2, transform: `scale(${press})`, transformOrigin: '3px 2px'}}>
      <path d="M3 2 L3 31 L10.5 24 L16 36.5 L21.5 34 L16 22 L26.5 22 Z" fill={C.orange} stroke={C.paper} strokeWidth={2.4} strokeLinejoin="round"/>
    </svg>
  </div>;
}

/** Three-square brand pixel brackets that arrive just before a card does. */
export function PixelCorners({x, y, w, h, t, start, end = Infinity, color = C.orange}: {
  x: number; y: number; w: number; h: number; t: number; start: number; end?: number; color?: string;
}) {
  const raw = envelope(t, start, end, 0.2, 0.2).o;
  if (raw <= 0) return null;
  // Snap near-opaque values and whole-pixel positions: a zero-size, fractionally placed layer
  // dropped out of single rendered frames in v6/v7 (caught before the v7 delivery).
  const o = raw > 0.995 ? 1 : raw;
  const s = 6, g = 2;
  const corner = (cx: number, cy: number, dx: number, dy: number, id: string) => [[0, 0], [dx, 0], [0, dy]].map(([ox, oy], i) =>
    <div key={`${id}-${i}`} style={{position: 'absolute', left: Math.round(cx + ox * (s + g) - s / 2), top: Math.round(cy + oy * (s + g) - s / 2), width: s, height: s, background: color}}/>);
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o, pointerEvents: 'none'}}>
    {corner(x - 10, y - 10, 1, 1, 'tl')}{corner(x + w + 10, y - 10, -1, 1, 'tr')}{corner(x - 10, y + h + 10, 1, -1, 'bl')}{corner(x + w + 10, y + h + 10, -1, -1, 'br')}
  </div>;
}

/** Fine 3 px pixel field with a soft radial falloff, the light colorway of the brand's pixel texture. */
export function PixelField({color = C.cream3, opacity = 0.55}: {color?: string; opacity?: number}) {
  return <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <pattern id="ag-pixels" width={14} height={14} patternUnits="userSpaceOnUse"><rect width={3} height={3} fill={color}/></pattern>
      <radialGradient id="ag-fade" cx="78%" cy="18%" r="85%"><stop offset="0" stopColor="#fff" stopOpacity={1}/><stop offset="0.7" stopColor="#fff" stopOpacity={0.15}/><stop offset="1" stopColor="#fff" stopOpacity={0}/></radialGradient>
      <mask id="ag-mask"><rect width={1920} height={1080} fill="url(#ag-fade)"/></mask>
    </defs>
    <rect width={1920} height={1080} fill="url(#ag-pixels)" mask="url(#ag-mask)" opacity={opacity}/>
  </svg>;
}

export const abs = (x: number, y: number, extra?: CSSProperties): CSSProperties => ({position: 'absolute', left: x, top: y, ...extra});
