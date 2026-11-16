// Text metrics identical to the v4 engine's Pillow text layout.
//
// Pillow (basic layout, as used for v4) places glyphs by their hinted advances with no kerning and no
// ligatures: advance = FT_PIX_ROUND(FT_MulFix(units, FT_DivFix(size * 64, unitsPerEm))). Reading the
// same TTF files here reproduces every line width, wrap and pill size exactly (checked against Pillow
// for 52,320 glyph/size pairs). The browser only rasterises the glyphs at those positions.
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {useBroadcastFonts} from '../../../studio/src/brand/Broadcast';
import {pilRound} from './num';

export type Face = 'J' | 'G' | 'M' | 'HM';
/** J headings (Geist SemiBold), G body (Geist Regular), M labels (Hack Bold), HM technical text (Hack Regular). */
export const FACES: Record<Face, {file: string; family: string; weight: number}> = {
  J: {file: 'Geist-SemiBold', family: 'Geist', weight: 600},
  G: {file: 'Geist-Regular', family: 'Geist', weight: 400},
  M: {file: 'Hack-Bold', family: 'Hack', weight: 700},
  HM: {file: 'Hack-Regular', family: 'Hack', weight: 400},
};

type FontTables = {upm: number; advance: (glyph: number) => number; glyph: (codePoint: number) => number};

function parseFont(buffer: ArrayBuffer): FontTables {
  const v = new DataView(buffer);
  const tables: Record<string, number> = {};
  for (let i = 0, n = v.getUint16(4); i < n; i++) {
    const o = 12 + 16 * i;
    tables[String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3))] = v.getUint32(o + 8);
  }
  const upm = v.getUint16(tables.head + 18);
  const longMetrics = v.getUint16(tables.hhea + 34);
  const advance = (g: number) => v.getUint16(tables.hmtx + 4 * Math.min(g, longMetrics - 1));
  let format12 = -1, format4 = -1;
  for (let i = 0, n = v.getUint16(tables.cmap + 2); i < n; i++) {
    const platform = v.getUint16(tables.cmap + 4 + 8 * i), encoding = v.getUint16(tables.cmap + 6 + 8 * i);
    const offset = tables.cmap + v.getUint32(tables.cmap + 8 + 8 * i), format = v.getUint16(offset);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (unicode && format === 12 && format12 < 0) format12 = offset;
    if (unicode && format === 4 && format4 < 0) format4 = offset;
  }
  const glyph = (cp: number) => {
    if (format12 >= 0) {
      for (let i = 0, n = v.getUint32(format12 + 12); i < n; i++) {
        const g = format12 + 16 + 12 * i, start = v.getUint32(g), end = v.getUint32(g + 4);
        if (cp < start) return 0;
        if (cp <= end) return v.getUint32(g + 8) + cp - start;
      }
      return 0;
    }
    if (format4 < 0 || cp > 0xffff) return 0;
    const segments = v.getUint16(format4 + 6) / 2;
    const ends = format4 + 14, starts = ends + 2 * segments + 2, deltas = starts + 2 * segments, ranges = deltas + 2 * segments;
    for (let i = 0; i < segments; i++) {
      if (cp > v.getUint16(ends + 2 * i)) continue;
      const start = v.getUint16(starts + 2 * i);
      if (cp < start) return 0;
      const delta = v.getInt16(deltas + 2 * i), range = v.getUint16(ranges + 2 * i);
      if (range === 0) return (cp + delta) & 0xffff;
      const g = v.getUint16(ranges + 2 * i + range + 2 * (cp - start));
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  return {upm, advance, glyph};
}

const fonts: Partial<Record<Face, FontTables>> = {};
let loading: Promise<void> | undefined;
const fontsReady = () => Object.keys(fonts).length === Object.keys(FACES).length;

export function loadMetrics() {
  loading ??= Promise.all((Object.keys(FACES) as Face[]).map(async face => {
    const response = await fetch(staticFile(`brand/fonts/${FACES[face].file}.ttf`));
    if (!response.ok) throw new Error(`Font ${FACES[face].file}: HTTP ${response.status}`);
    fonts[face] = parseFont(await response.arrayBuffer());
  })).then(() => undefined);
  return loading;
}

/** Registers the bundled brand fonts (shared broadcast loader) and reads their advance widths. */
export function useEngineFonts() {
  useBroadcastFonts();
  const [ready, setReady] = useState(fontsReady);
  const [handle] = useState(() => (fontsReady() ? null : delayRender('Reading Geist / Hack advance widths')));
  useEffect(() => {
    if (!ready) loadMetrics().then(() => setReady(true)).catch(cancelRender);
  }, [ready]);
  useEffect(() => {
    if (ready && handle !== null) continueRender(handle);
  }, [ready, handle]);
  return ready;
}

// ---------------------------------------------------------------- advances (whole pixels)
const fixDiv = (a: number, b: number) => Math.floor((a * 65536 + Math.floor(b / 2)) / b);
const fixMul = (a: number, b: number) => Math.floor((a * b + 0x8000) / 65536);
const cache = new Map<string, Map<string, number>>();

export function charAdvance(face: Face, size: number, ch: string) {
  const key = `${face}${size}`;
  let table = cache.get(key);
  if (!table) cache.set(key, (table = new Map()));
  let px = table.get(ch);
  if (px === undefined) {
    const font = fonts[face];
    if (!font) throw new Error('useEngineFonts() must run before text is laid out');
    const units = font.advance(font.glyph(ch.codePointAt(0) ?? 0));
    px = Math.floor((fixMul(units, fixDiv(size * 64, font.upm)) + 32) / 64);
    table.set(ch, px);
  }
  return px;
}

/** Pillow font.getlength(s). */
export function getlength(s: string, face: Face, size: number) {
  let w = 0;
  for (const ch of s) w += charAdvance(face, size, ch);
  return w;
}
/** Advance width plus letter-spacing between characters (motion.py tlen). */
export const tlen = (s: string, face: Face, size: number, tr = 0) => getlength(s, face, size) + tr * Math.max(0, [...s].length - 1);

export type Anchor = 'ls' | 'ms' | 'rs';
/** Integer x of each non-space glyph, as Pillow draws `s` with its baseline at y. */
export function glyphRun(s: string, face: Face, size: number, x: number, tr = 0, anchor: Anchor = 'ls') {
  const xs: number[] = [], chars: string[] = [];
  if (!tr) {   // ImageDraw.text: one pen, anchor offset rounded up for centred text
    const len = getlength(s, face, size);
    let pen = pilRound(x) - (anchor === 'ms' ? Math.ceil(len / 2) : anchor === 'rs' ? len : 0);
    for (const ch of s) {
      if (ch.trim()) { xs.push(pen); chars.push(ch); }
      pen += charAdvance(face, size, ch);
    }
  } else {     // tracked(): every character placed on its own from cumulative advances
    let acc = 0, i = 0;
    for (const ch of s) {
      if (ch.trim()) { xs.push(pilRound(x + acc + tr * i)); chars.push(ch); }
      acc += charAdvance(face, size, ch); i++;
    }
  }
  return {xs, chars};
}

// ---------------------------------------------------------------- wrapping (motion.py wrap / seg_wrap)
export function wrap(s: string, face: Face, size: number, maxw: number) {
  const lines: string[] = [];
  let cur = '';
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const t = `${cur} ${w}`.trim();
    if (getlength(t, face, size) <= maxw || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A word of a coloured heading: text, colour, and whether a space precedes it. */
export type SegWord<C> = [text: string, color: C, space: boolean];
export function segWrap<C>(segs: [string, C][], face: Face, size: number, maxw: number): SegWord<C>[][] {
  const words: SegWord<C>[] = [];
  let pending = false;
  for (const [text, c] of segs) {
    text.split(' ').forEach((p, i) => {
      if (p === '') { pending = true; return; }
      words.push([p, c, pending || i > 0]); pending = false;
    });
    if (text.endsWith(' ')) pending = true;
  }
  const lines: SegWord<C>[][] = [];
  let cur: SegWord<C>[] = [], curw = 0;
  const space = getlength(' ', face, size);
  for (const [w, c, sp] of words) {
    const add = (sp && cur.length ? space : 0) + getlength(w, face, size);
    if (cur.length && curw + add > maxw) {
      lines.push(cur); cur = [[w, c, false]]; curw = getlength(w, face, size);
    } else {
      cur.push([w, c, sp && cur.length > 0]); curw += add;
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}
