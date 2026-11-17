// Speaker side panel: opening name card, brand name intro, Q&A panel and end name card
// (motion.py name_card / qa_card / name_intro_ops / side_ops).
import React from 'react';
import {QUESTIONS} from '../cues';
import {BG, CARD_GRID, END_TALK, F, GRAY, GREEN, INK, LINE, LIVE_F, ORANGE, PANEL, QA_F, SPK} from './constants';
import {Bitmap, Label, Ln, R, RO, Svg, Txt, crop, gridBitmap, solid, sprite, type Sprite} from './draw';
import {wrap} from './metrics';
import {ENTER_F, EXIT_F, REVEAL, STAG_F, TRAVEL, int, prog, reveal} from './motion';
import {colorBarStrip} from './accents';
import type {Ops} from './ops';
import type {Version} from './types';

const grid = () => <Bitmap img={gridBitmap(416, 600, 36, PANEL, CARD_GRID)}/>;

export const nameCard = (): Sprite => sprite(416, 600, grid(), <Svg w={416} h={600}>
  <R x0={0} y0={0} x1={415} y1={3} fill={ORANGE}/>
  <Label s="Speaker" x={30} y={76} size={18} fill={ORANGE}/>
  <Txt s="Erik" x={28} y={176} face="J" size={66} fill={INK} tr={-1.6}/>
  <Txt s="Thorelli" x={28} y={248} face="J" size={66} fill={INK} tr={-1.6}/>
  <Txt s="Head of Developer" x={30} y={302} face="G" size={27} fill={GRAY}/>
  <Txt s="Experience, CodeRabbit" x={30} y={337} face="G" size={27} fill={GRAY}/>
  <Ln x0={30} y0={470} x1={386} y1={470} fill={LINE}/>
  <Label s="11 November 2026" x={30} y={512} size={18} fill={ORANGE}/>
  <Label s="Expo session" x={30} y={546} size={18} fill={GRAY}/>
</Svg>);

export function qaCard(v: Version, qn = 0): Sprite {
  const q = v === 'full' && qn ? QUESTIONS[qn - 1] : null;
  return sprite(416, 600, grid(), <Svg w={416} h={600}>
    <R x0={0} y0={0} x1={415} y1={3} fill={ORANGE}/>
    <Label s="Audience" x={30} y={76} size={18} fill={ORANGE}/>
    <Txt s="Q&A" x={24} y={212} face="J" size={120} fill={INK} tr={-3}/>
    <R x0={30} y0={246} x1={386} y1={249} fill={ORANGE}/>
    <Txt s="Audience questions" x={30} y={292} face="G" size={27} fill={GRAY}/>
    <Txt s="Erik Thorelli" x={30} y={330} face="J" size={27} fill={INK}/>
    {q && <>
      <R x0={28} y0={392} x1={388} y1={552} fill={BG}/><RO x0={28} y0={392} x1={388} y1={552} stroke={LINE}/>
      <R x0={28} y0={392} x1={33} y1={552} fill={ORANGE}/>
      <Label s={`Question ${q[1]}`} x={48} y={424} size={15} fill={ORANGE}/>
      {wrap(q[2], 'J', 23, 322).slice(0, 4).map((ln, i) => <Txt key={i} s={ln} x={48} y={460 + i * 30} face="J" size={23} fill={INK}/>)}
    </>}
  </Svg>);
}

/** Brand name intro: solid orange name panel + mint details panel with dark text. */
function nameIntroPanels(): [Sprite, Sprite] {
  const a = solid(384, 70, ORANGE), b = solid(384, 74, GREEN);
  return [
    sprite(384, 70, a.el, <Svg w={384} h={70}><Txt s="Erik Thorelli" x={22} y={48} face="J" size={36} fill={BG} tr={-1}/></Svg>),
    sprite(384, 74, b.el, <Svg w={384} h={74}>
      <Txt s="Head of Developer Experience" x={22} y={31} face="G" size={21} fill={BG}/>
      <Txt s="CodeRabbit" x={22} y={59} face="G" size={21} fill={BG}/>
    </Svg>),
  ];
}

function nameIntroOps(ops: Ops, f: number, v: Version) {
  if (v === 'plain') return;
  const f0 = LIVE_F + 18, f1 = f0 + 132;
  if (!(f0 <= f && f < f1)) return;
  const [na, nb] = nameIntroPanels(), x = SPK[0] + 16, ya = SPK[1] + SPK[3] - 16 - 144;
  ([[na, ya, 'ni_a'], [nb, ya + 70, 'ni_b']] as const).forEach(([im, yy, key], j) => {
    const e = REVEAL(prog(f, f0 + j * STAG_F, ENTER_F)), lv = REVEAL(prog(f, f1 - EXIT_F, EXIT_F));
    const wv = lv > 0 ? int(im.w * e * (1 - lv)) : int(im.w * e);   // reveal from the left, clear to the left
    if (wv >= 1) ops.add(key, crop(im, 0, 0, wv, im.h), x, yy, 1);
  });
  if (v === 'full') {
    const n = 34;
    if (f0 - 6 <= f && f < f0 - 6 + n) ops.add('cbar', colorBarStrip(f, f0 - 6, n, 384, 6), x, ya - 10, 1, 'ni');
  }
}

export function sideOps(ops: Ops, f: number, v: Version) {
  const [x, y] = SPK;
  if (f < LIVE_F + 16) {   // opening name card until the stage camera is back on Erik
    if (v === 'plain') ops.add('name', nameCard(), x, y, prog(f, 0, 8) * (1 - prog(f, LIVE_F, 8)));
    else {
      const [a, off] = reveal(f, 20, null), ex = TRAVEL(prog(f, LIVE_F, 14));
      if (ex <= 0) ops.add('name', nameCard(), x, y + off * 0.7, a);
      else if (ex < 1) { const hh = int(600 * (1 - ex)); ops.add('name_cut', crop(nameCard(), 0, 600 - hh, 416, 600), x, y, 1); }
    }
  }
  if (QA_F - 14 <= f && f < END_TALK + 12) {
    let qn = 0;
    for (const [t, n] of QUESTIONS) if (v === 'full' && f >= F(t)) qn = n;
    const p = TRAVEL(prog(f, QA_F - 14, 14)), out = prog(f, END_TALK, 12);
    if (v === 'plain') { ops.add('qa', qaCard(v, qn), x, y, prog(f, QA_F - 12, 12) * (1 - out)); return; }
    if (p < 1) { const hh = Math.max(1, int(600 * p)); ops.add('qa_cut', crop(qaCard(v, 0), 0, 0, 416, hh), x, y + 600 - hh, 1); }
    else ops.add('qa', qaCard(v, qn), x, y, 1);
  }
  if (f >= END_TALK) {
    if (v === 'plain') ops.add('name', nameCard(), x, y, prog(f, END_TALK, 12));
    else {
      const p = TRAVEL(prog(f, END_TALK, 14));
      if (p >= 1) ops.add('name', nameCard(), x, y, 1);
      else if (p > 0) { const hh = Math.max(1, int(600 * p)); ops.add('name_up', crop(nameCard(), 0, 0, 416, hh), x, y + 600 - hh, 1); }
    }
  }
  nameIntroOps(ops, f, v);
}
