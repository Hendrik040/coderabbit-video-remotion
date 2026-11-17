// Title and end card in the slide panel (motion.py panel_bg / TL / title_card_full / panel_card_ops).
import React from 'react';
import {DIM, END_TALK, GRAY, INK, ORANGE, PANEL, PANEL_GRID, SLIDE} from './constants';
import {Bitmap, Label, Place, R, Svg, Txt, crop, gridBitmap, sprite, type Sprite} from './draw';
import {REVEAL, STAG_F, int, prog, reveal} from './motion';
import type {Ops} from './ops';
import type {Version} from './types';

const [, , SW, SH] = SLIDE;
const panelImage = () => gridBitmap(SW, SH, 60, PANEL, PANEL_GRID, [SW - 40, 30, 300, 60, ORANGE]);
/** The dark grid panel with its orange corner glow; a region of it for the stack-wipe rails. */
export const panelBg = (): Sprite => ({w: SW, h: SH, el: <Bitmap img={panelImage()}/>});
export const panelBgRegion = (sx: number, sy: number, w: number, h: number): Sprite => ({w, h, el: <Bitmap img={panelImage()} sx={sx} sy={sy} w={w} h={h}/>});

type Layer = 'eyebrow' | 'l0' | 'l1' | 'spk' | 'date' | 'rule';
function titleLayers(outro: boolean): Record<Layer, Sprite> {
  return {
    eyebrow: sprite(1240, 40, <Svg w={1240} h={40}><Label s={(outro ? 'Thank you  ·  ' : '') + 'AI Engineer Code Summit  ·  San Francisco'} x={0} y={28} size={21} fill={ORANGE} tr={2.4}/></Svg>),
    l0: sprite(1300, 124, <Svg w={1300} h={124}><Txt s="Manage Yourself" x={0} y={98} face="J" size={104} fill={INK} tr={-2.6}/></Svg>),
    l1: sprite(1300, 124, <Svg w={1300} h={124}><Txt s="Out of the Loop" x={0} y={98} face="J" size={104} fill={INK} tr={-2.6}/></Svg>),
    spk: sprite(1200, 90, <Svg w={1200} h={90}>
      <Txt s="Erik Thorelli" x={0} y={34} face="J" size={37} fill={INK} tr={-0.6}/>
      <Txt s="Head of Developer Experience, CodeRabbit" x={0} y={76} face="G" size={28} fill={GRAY}/>
    </Svg>),
    date: sprite(900, 40, <Svg w={900} h={40}><Label s="11 November 2026  ·  Expo session  ·  Hilton San Francisco Union Square" x={0} y={26} size={15} fill={DIM} tr={1.4}/></Svg>),
    rule: sprite(1248, 4, <Svg w={1248} h={4}><R x0={0} y0={0} x1={1248} y1={3} fill={ORANGE}/></Svg>),
  };
}
const TITLE_POS: [Layer, number][] = [['eyebrow', 228], ['l0', 268], ['l1', 384], ['spk', 528], ['date', 648]];

/** The finished title card (held under the Full pixel wipe and faded out in Plain). */
export function titleCardFull(): Sprite {
  const L = titleLayers(false);
  return sprite(SW, SH, panelBg().el, ...TITLE_POS.map(([nm, yy]) => <Place s={L[nm]} x={80} y={yy}/>), <Place s={L.rule} x={80} y={64}/>);
}

export function panelCardOps(ops: Ops, f: number, v: Version, outro = false) {
  const L = titleLayers(outro), [x0, y0] = SLIDE, lf = f - (outro ? END_TALK : 0);
  const bga = outro ? (v === 'full' ? 1 : prog(lf, 0, 10)) : (v !== 'plain' ? 1 : prog(lf, 0, 8));
  ops.add('pbg', panelBg(), x0, y0, bga);
  const base = outro && v !== 'plain' ? 14 : 0;
  let a = 0;
  TITLE_POS.forEach(([nm, yy], j) => {
    let off = 0;
    if (v === 'plain') a = outro ? prog(lf, 0, 10) : prog(lf, 0, 8);
    else [a, off] = reveal(lf, base + 8, null, j * STAG_F * 2);
    ops.add(nm, L[nm], x0 + 80, y0 + yy + off, a * (outro && v !== 'full' ? bga : 1));
  });
  if (v !== 'plain') {   // ident rule draws left -> right
    const wv = int(1248 * REVEAL(prog(lf, base + 4, 18)));
    if (wv > 0) ops.add('trule', crop(L.rule, 0, 0, wv, 4), x0 + 80, y0 + 64, 1);
  } else if (lf >= 0) ops.add('trule', L.rule, x0 + 80, y0 + 64, a);
}
