// One overlay frame, op for op in the engine's paint order (motion.py frame_ops).
import React from 'react';
import {RABBIT_DETAILS} from '../cues';
import {CHAPTERS, END_TALK, F, H, INTRO, ORANGE, PROG_Y, SLIDE, TALK, TOTAL, W} from './constants';
import {solid} from './draw';
import {REVEAL, TRAVEL, clamp, int, prog} from './motion';
import {Ops} from './ops';
import {chrome, introChromeProgress} from './chrome';
import {cardOps} from './cards';
import {chapterOps} from './chapters';
import {sideOps} from './side';
import {panelBgRegion, panelCardOps, titleCardFull} from './titles';
import {colorBarStrip, colorbarWipeOps, pixelWipe, stackWipeOps} from './accents';
import {featureOps} from './explainers';
import type {Version} from './types';

function progressOps(ops: Ops, f: number, v: Version) {
  if (v === 'plain' || f < INTRO || f >= END_TALK + 10) return;
  const px = int(1408 * clamp((f - INTRO) / TALK)), a = 1 - prog(f, END_TALK, 10);
  if (px > 0) ops.add('pfill', solid(px, 2, ORANGE), 32, PROG_Y - 1, a);
  for (const c of CHAPTERS) if (f >= c.frame) ops.add('ptick', solid(2, 9, ORANGE), 32 + 1408 * (c.frame - INTRO) / TALK - 1, PROG_Y - 4, a);
  ops.add('phead', solid(8, 8, ORANGE), 32 + px - 4, PROG_Y - 4, a);
}

/** Subtle orange line under the logo at the RABBIT_DETAILS cue times (Full adds a blinking caret). */
function rabbitOps(ops: Ops, f: number, v: Version) {
  if (v === 'plain') return;
  for (const t of RABBIT_DETAILS) {
    const lf = f - F(t);
    if (!(lf >= 0 && lf < 70)) continue;
    const grow = REVEAL(prog(lf, 0, 16)), shrink = TRAVEL(prog(lf, 46, 18));
    const xa = 1490 + 290 * shrink, xb = 1490 + 290 * grow;
    if (xb - xa >= 1) ops.add('rl', solid(int(xb - xa), 2, ORANGE), xa, 388, 1);
    if (v === 'full' && (grow < 1 || (lf >= 16 && lf < 46 && Math.floor(lf / 6) % 2 === 0))) ops.add('rcur', solid(8, 14, ORANGE), xb + 4, 382, 1);
  }
}

export function frameOps(f: number, v: Version) {
  const ops = new Ops(), [sx, sy, sw, sh] = SLIDE;
  if (f < 110) {                                   // ---- intro (0..71) and reveal of the live slide
    if (f < 64) ops.add(v === 'plain' ? 'chrome' : 'ichrome', v === 'plain' ? chrome(v) : chrome(v, introChromeProgress(f)), 0, 0, v === 'plain' ? prog(f, 0, 8) : 1);
    else ops.add('chrome', chrome(v), 0, 0, 1);
    if (v === 'plain') {
      if (f < INTRO) panelCardOps(ops, f, v);
      else ops.add('tcard', titleCardFull(), sx, sy, 1 - prog(f, INTRO, 12));
    } else if (v === 'light') {
      if (f < INTRO) panelCardOps(ops, f, v);
      stackWipeOps(ops, f, INTRO, 28, SLIDE, panelBgRegion, 'swi');
    } else {                                       // full: Change Stack pixel wipe over the slide panel; cut under the full field
      const n0 = 56, n = 50, cut = n0 + int(0.5 * n);
      if (f < cut) { if (f < INTRO) panelCardOps(ops, f, v); else ops.add('tcard', titleCardFull(), sx, sy, 1); }
      if (f >= n0 && f < n0 + n) ops.add('pix', pixelWipe(sw, sh, (f - n0) / n), sx, sy, 1, 'intro');
      if (f >= 20 && f < 20 + 66) ops.add('cbar', colorBarStrip(f, 20, 66, 1408, 6), 32, 1068, 1, 'intro');
    }
  } else if (f >= END_TALK - 16) {                 // ---- outro
    ops.add('chrome', chrome(v), 0, 0, 1);
    if (v === 'plain') { if (f >= END_TALK) panelCardOps(ops, f, v, true); }
    else if (v === 'light') {
      if (f >= END_TALK) panelCardOps(ops, f, v, true);
      stackWipeOps(ops, f, END_TALK, 28, SLIDE, panelBgRegion, 'swo');
    } else {
      if (f >= END_TALK) panelCardOps(ops, f, v, true);
      colorbarWipeOps(ops, f, END_TALK, 32, SLIDE);
      if (f >= END_TALK - 4 && f < END_TALK + 60) ops.add('cbar', colorBarStrip(f, END_TALK - 4, 64, 1408, 6), 32, 1068, 1, 'outro');
    }
  } else ops.add('chrome', chrome(v), 0, 0, 1);
  if (f >= INTRO && f < END_TALK) featureOps(ops, f, v);
  chapterOps(ops, f, v); progressOps(ops, f, v); rabbitOps(ops, f, v);
  cardOps(ops, f, v); sideOps(ops, f, v);
  if (f >= TOTAL - 18) ops.add('black', solid(W, H, '#000000'), 0, 0, prog(f, TOTAL - 18, 17));
  return ops;
}
