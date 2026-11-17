// Chapter labels (motion.py ch_box / ch_num / ch_title / chapter_ops).
import React from 'react';
import {CHAPTERS, CH_Y, END_TALK, INK, ORANGE, rgba} from './constants';
import {RRect, Svg, Txt, sprite} from './draw';
import {tlen} from './metrics';
import {STAG_F, int, prog, reveal} from './motion';
import {colorBarStrip} from './accents';
import type {Ops} from './ops';
import type {Version} from './types';

export const chapterTitle = (title: string) => {
  const w = int(tlen(title, 'J', 34, 1)) + 8;
  return sprite(w, 52, <Svg w={w} h={52}><Txt s={title} x={0} y={38} face="J" size={34} fill={INK} tr={1}/></Svg>);
};
export const chapterBox = () => sprite(58, 40, <Svg w={58} h={40}><RRect w={58} h={40} r={3} fill={rgba(ORANGE, 30)} stroke={ORANGE} sw={2}/></Svg>);
export const chapterNumber = (n: string) => sprite(58, 40, <Svg w={58} h={40}><Txt s={n} x={29} y={29} face="M" size={22} fill={ORANGE} anchor="ms"/></Svg>);

export function chapterOps(ops: Ops, f: number, v: Version) {
  if (f >= END_TALK + 10) return;
  let cur: number | null = null;
  CHAPTERS.forEach((c, i) => { if (f >= (i === 0 ? 56 : c.frame)) cur = i; });
  if (cur === null) return;
  const i: number = cur, {frame, number, title} = CHAPTERS[i], start = i === 0 ? 56 : frame;
  const end = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].frame : END_TALK + 8;
  const parts = [['chb', chapterBox(), 32, CH_Y], ['chn', chapterNumber(number), 32, CH_Y], ['cht', chapterTitle(title), 106, CH_Y - 4]] as const;
  if (v === 'plain') {
    const a = prog(f, start, 6) * (1 - prog(f, end - 6, 6));
    for (const [key, s, x, y] of parts) ops.add(key, s, x, y, a);
    return;
  }
  parts.forEach(([key, s, x, y], j) => {
    const [a, off] = reveal(f, start, end, j * STAG_F, 12, 8);
    ops.add(key, s, x, y + off * 0.5, a);
  });
  if (v === 'full' && i > 0) {   // Change Stack colour bar reveal & exit under the new title
    const n = 40;
    if (start <= f && f < start + n) ops.add('cbar', colorBarStrip(f, start, n, chapterTitle(title).w, 6), 106, CH_Y + 46, 1, 'ch');
  }
}
