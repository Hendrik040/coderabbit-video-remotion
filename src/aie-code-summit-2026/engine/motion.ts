// Frame math of the v4 engine (motion.py), on the shared brand curves in studio/src/lib/motion.ts.
import {brandMotion, motionCurves, unit} from '../../../studio/src/lib/motion';
import {FPS} from './constants';
import {clamp, pyRound} from './num';

export {clamp, int, lerp, pilRound, pyRound} from './num';

// The engine evaluates every curve at clamp(p) rounded to 5 decimals (for its sprite cache).
const round5 = (p: number) => Math.round(unit(p) * 1e5) / 1e5;
/** cubic-bezier(.23, 1, .32, 1): brand entrances and exits. */
export const REVEAL = (p: number) => motionCurves.reveal(round5(p));
/** cubic-bezier(.77, 0, .175, 1): covering wipes and travel. */
export const TRAVEL = (p: number) => motionCurves.travel(round5(p));
/** cubic-bezier(.65, 0, .35, 1): the Change Stack colour bar. */
export const CBAR = (p: number) => motionCurves.colorBar(round5(p));

// 0.6 s entrance / 0.4 s exit / 60 ms stagger (brandMotion), in whole frames at 24000/1001, and the
// 28 px / 12 px reveal distances scaled from the 720p studio canvas to 1080p.
export const ENTER_F = Math.round(brandMotion.enter * FPS);   // 14
export const EXIT_F = Math.round(brandMotion.exit * FPS);     // 10
export const STAG_F = 1.44;                                   // 60 ms at the engine's 24-frame reference
export const DIST = brandMotion.distance * 1.5;               // 42
export const EXIT_DIST = brandMotion.exitDistance * 1.5;      // 18

export const prog = (f: number, f0: number, n: number) => clamp((f - f0) / Math.max(1, n));
/** Quantised animation state, exactly as the engine caches it. */
export const q = (x: number, n = 48) => pyRound(x * n) / n;

/** Brand reveal: [opacity, offset]. Entrance over 0.6 s, exit over 0.4 s toward the entrance edge. */
export function reveal(f: number, f0: number, f1: number | null, stagger = 0, enter = ENTER_F, exit = EXIT_F): [number, number] {
  const e = REVEAL((f - f0 - stagger) / Math.max(1e-3, enter - Math.min(stagger, enter * 0.6)));
  const lv = f1 !== null ? REVEAL((f - (f1 - exit)) / exit) : 0;
  return [e * (1 - lv), (1 - e) * DIST + lv * EXIT_DIST];
}
