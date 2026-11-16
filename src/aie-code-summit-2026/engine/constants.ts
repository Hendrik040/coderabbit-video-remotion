// Timeline, layout and colour constants of the v4 conference engine (motion.py).
import timeline from '../timeline.json';
import {brand} from '../../../studio/src/brand/Broadcast';
import {brandSwatches} from '../../../studio/src/lib/brandPalette';
import {colorBarSegments} from '../../../studio/src/lib/colorBar';
import {pyRound} from './num';
import type {ColorName} from './types';

// ---------------------------------------------------------------- timeline (24000/1001, sequence frames)
export const FPS_N = timeline.fps.num, FPS_D = timeline.fps.den, FPS = FPS_N / FPS_D;
export const W = timeline.width, H = timeline.height;
export const INTRO = timeline.intro_frames, OUTRO = timeline.outro_frames;
export const SOURCE_IN = timeline.source_in_frame, SOURCE_OUT = timeline.source_out_frame;
export const TALK = SOURCE_OUT - SOURCE_IN, TOTAL = INTRO + TALK + OUTRO, END_TALK = INTRO + TALK;
if (TOTAL !== timeline.total_frames) throw new Error(`timeline.json: ${TOTAL} != ${timeline.total_frames} frames`);
export const QA_F = timeline.qa_start_frame - SOURCE_IN + INTRO;                 // 30872
export const LIVE_F = pyRound(46.5 * FPS) - SOURCE_IN + INTRO;                   // 387: live speaker from here
export const CHAPTERS = timeline.chapters.map(c => ({frame: pyRound(c.sequence_seconds * FPS), number: c.number, title: c.title}));
/** Sequence seconds -> sequence frame (int(round(t * FPS))). */
export const F = (t: number) => pyRound(t * FPS);

/** Clean layers, linked into public/ by scripts/link-aie-code-summit-media.mjs (never committed). */
export const MEDIA = {
  bg: 'aie-code-summit-2026/BG.png',
  slide: 'aie-code-summit-2026/SLIDE_PANEL.mp4',
  speaker: 'aie-code-summit-2026/SPEAKER_PANEL.mp4',
  audio: 'aie-code-summit-2026/PROGRAM_AUDIO_V4.wav',
};
/** Talk frames in SPEAKER_PANEL.mp4 (until the Q&A switch). */
export const SPEAKER_FRAMES = QA_F - INTRO;                                     // 30800

// ---------------------------------------------------------------- CodeRabbit brand tokens
const swatch = (name: string) => {
  const s = brandSwatches.find(x => x.name === name);
  if (!s) throw new Error(`No brand swatch ${name}`);
  return s.value;
};
export const BG = brand.ink;            // #121113
export const PANEL = brand.panel;       // #211F26
export const RAISED = brand.raised;     // #322F37
export const LINE = brand.line;         // #49454F
export const INK = brand.white;         // #EEEDEF
export const GRAY = brand.muted;        // #B5B2BC
export const DIM = '#77717E';           // label grey of the broadcast package
export const ORANGE = brand.orange;     // CR Orange #FF570A
export const GREEN = brand.mint;        // CR Mint #25E2A8
export const BLUE = brand.cobalt;       // CR Cobalt #687FF5
export const PURPLE = swatch('Tertiary 11');   // #9DB3FF
export const CREAM = swatch('Cream 6');        // #F7F2EF
export const PEACH = colorBarSegments.find(s => s.name === 'Peach')!.color;   // #FFA057
export const COL: Record<ColorName | 'cream', string> = {orange: ORANGE, green: GREEN, purple: PURPLE, blue: BLUE, ink: INK, cream: CREAM};
// Engine-only greys for the grid sprites (not palette tokens).
export const CARD_GRID = '#28262D';     // (40, 38, 45) name card and Q&A card
export const PANEL_GRID = '#26242B';    // (38, 36, 43) title / end card
export const FEATURE_GRID = '#1E1D22';  // (30, 29, 34) explainer field

// ---------------------------------------------------------------- layout (1080p)
export const SLIDE = [32, 32, 1408, 792] as const;
export const SPK = [1472, 432, 416, 600] as const;
export const SMALL = [32, 176, 896, 504] as const;           // slide rect during explainer moments
export const FX = 960, FY = 32, FWID = 456, FHGT = 792;      // explainer panel area
export const CARD_W = 560, CARD_R = 1440, CARD_B = 1040;     // footer card: width, right, bottom
export const CH_Y = 852, TITLE_BASE = 966, ROLE_BASE = 1020, PROG_Y = 1055;
export const TAB_H = 30, RULE = 6, PAD = 22;

export const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};
export const rgba = (hex: string, alpha255: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${alpha255 / 255})`;
};
