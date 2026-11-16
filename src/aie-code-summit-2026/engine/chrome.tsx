// Persistent conference chrome: slide/speaker frames, masthead, city, CodeRabbit lockup, footer, progress
// rule and presenter strap (motion.py el_* and chrome()).
import React from 'react';
import {Logo} from '../../../studio/src/brand/Broadcast';
import {CHAPTERS, GRAY, INK, INTRO, LINE, ORANGE, PROG_Y, RAISED, ROLE_BASE, SLIDE, SPK, TALK, TITLE_BASE, W, H, rgba} from './constants';
import {Label, Ln, Place, R, Svg, Txt, crop, sprite, type Sprite} from './draw';
import {getlength} from './metrics';
import {REVEAL, clamp, int, lerp, prog} from './motion';
import type {Version} from './types';

const eo = REVEAL;

function frames(p: number, v: Version) {
  const out: React.ReactNode[] = [];
  for (const [x, y, w, h] of [SLIDE, SPK]) {
    const x0 = x - 1, y0 = y - 1, x1 = x + w, y1 = y + h;
    const segs: [number, number, number, number][] = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
    let L = 2 * (w + h) * p;   // the traced outline; the in-progress side is orange
    for (const [ax, ay, bx, by] of segs) {
      const sl = Math.hypot(bx - ax, by - ay);
      if (L <= 0) break;
      const u = Math.min(1, L / sl);
      out.push(<Ln x0={ax} y0={ay} x1={lerp(ax, bx, u)} y1={lerp(ay, by, u)} fill={p >= 1 || u >= 1 ? LINE : ORANGE}/>);
      L -= sl;
    }
    if (v !== 'plain' && p >= 1) {
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
        out.push(<Ln x0={cx} y0={cy} x1={cx + 14 * sx} y1={cy} w={2} fill={ORANGE}/>, <Ln x0={cx} y0={cy} x1={cx} y1={cy + 14 * sy} w={2} fill={ORANGE}/>);
      }
    }
  }
  return out;
}

function mastheadLines(p: number) {
  const col = rgba(GRAY, int(255 * clamp(p * 1.5)));
  if (eo(p) <= 0) return null;
  const h = int(176 * eo(p));
  return <>
    <Ln x0={1487} y0={40} x1={1516} y1={40} w={2} fill={col}/><Ln x0={1728} y0={40} x1={1873} y1={40} w={2} fill={col}/>
    <Ln x0={1487} y0={40} x1={1487} y1={40 + h} w={2} fill={col}/><Ln x0={1873} y0={40} x1={1873} y1={40 + h} w={2} fill={col}/>
    {p >= 0.99 && <Ln x0={1487} y0={216} x1={1873} y1={216} w={2} fill={col}/>}
  </>;
}

const aiEngineer = () => sprite(220, 40, <Svg w={220} h={40}><Txt s="AI Engineer" x={0} y={30} face="J" size={29} fill={INK} tr={-0.3}/></Svg>);
const word = (s: string) => sprite(380, 80, <Svg w={380} h={80}><Txt s={s} x={0} y={64} face="J" size={66} fill={INK} tr={-1.2}/></Svg>);
const city = () => sprite(400, 70, <Svg w={400} h={70}>
  <Label s="San Francisco" x={0} y={20} size={19} fill={ORANGE}/>
  <Txt s="November 10–12, 2026" x={0} y={52} face="G" size={21} fill={GRAY}/>
</Svg>);
/** The official CodeRabbit lockup (repo's white-typemark.svg, same artwork as v4's coderabbit.png), uniform scale. */
const logo = (w: number): Sprite => ({w, h: Math.round(313 * w / 2152), el: <Logo width={w}/>});
const footerTitle = () => sprite(900, 70, <Svg w={900} h={70}><Txt s="Manage Yourself Out of the Loop" x={0} y={52} face="J" size={46} fill={INK} tr={-0.9}/></Svg>);
const footerRole = () => {
  const x = 2 + getlength('Erik Thorelli', 'J', 22);
  return sprite(900, 40, <Svg w={900} h={40}>
    <Txt s="Erik Thorelli" x={2} y={28} face="J" size={22} fill={INK}/>
    <Txt s="  /  Head of Developer Experience, CodeRabbit" x={x} y={28} face="G" size={22} fill={GRAY}/>
  </Svg>);
};
const strap = () => sprite(420, 34, <Svg w={420} h={34}>
  <R x0={0} y0={10} x1={8} y1={18} fill={ORANGE}/>
  <Label s="Erik Thorelli" x={18} y={22} size={17} fill={INK}/>
</Svg>);

function progressBase(p: number, v: Version) {
  return <>
    <Ln x0={32} y0={PROG_Y} x1={32 + 1408 * eo(p)} y1={PROG_Y} w={2} fill={RAISED}/>
    {v !== 'plain' && p >= 1 && CHAPTERS.map(c => {
      const x = 32 + 1408 * (c.frame - INTRO) / TALK;
      return <Ln key={c.number} x0={x} y0={PROG_Y - 4} x1={x} y1={PROG_Y + 4} w={2} fill={LINE}/>;
    })}
  </>;
}

export type ChromeProgress = {frames: number; masthead: number; city: number; logo: number; title: number; role: number; progress: number; strap: number};
const DONE: ChromeProgress = {frames: 1, masthead: 1, city: 1, logo: 1, title: 1, role: 1, progress: 1, strap: 1};

/** Full-frame chrome sprite. With progress values it is the animated intro (motion.py intro_chrome_ops). */
export function chrome(v: Version, p: ChromeProgress = DONE): Sprite {
  const parts: React.ReactNode[] = [<Svg w={W} h={H}>{frames(p.frames, v)}{mastheadLines(p.masthead)}</Svg>];
  let t = eo(prog(p.masthead, 0.15, 0.5));
  if (t > 0) parts.push(<Place s={aiEngineer()} x={1528} y={20} a={t}/>);
  ['CODE', 'SUMMIT'].forEach((s, i) => {
    const tt = eo(clamp((p.masthead - 0.25 - i * 0.18) / 0.5));
    if (tt > 0) parts.push(<Place s={word(s)} x={1508} y={60 + i * 66 + (1 - tt) * 18} a={tt}/>);
  });
  t = eo(p.city);
  if (t > 0) parts.push(<Place s={city()} x={1490 - (1 - t) * 14} y={236} a={t}/>);
  t = eo(p.logo);
  if (t > 0) parts.push(<Place s={logo(290)} x={1490} y={330 + (1 - t) * 8} a={t}/>);
  if (p.title > 0) {
    const wv = int(900 * eo(p.title));
    if (wv > 0) parts.push(<Place s={crop(footerTitle(), 0, 0, wv, 70)} x={32} y={TITLE_BASE - 52}/>);
  }
  if (p.role > 0) {
    t = eo(p.role);
    parts.push(<Place s={footerRole()} x={32 - (1 - t) * 12} y={ROLE_BASE - 28} a={t}/>);
  }
  parts.push(<Svg w={W} h={H}>{progressBase(p.progress, v)}</Svg>);
  t = eo(p.strap);
  if (t > 0) parts.push(<Place s={strap()} x={1474} y={1040} a={t}/>);
  return sprite(W, H, ...parts);
}

export const introChromeProgress = (f: number): ChromeProgress => ({
  frames: REVEAL(prog(f, 0, 18)), masthead: prog(f, 4, 18), city: prog(f, 14, 12), logo: prog(f, 18, 12),
  title: prog(f, 46, 14), role: prog(f, 52, 12), progress: prog(f, 48, 16), strap: prog(f, 40, 10),
});
