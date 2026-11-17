export type Version = 'plain' | 'light' | 'full';
export type ColorName = 'orange' | 'green' | 'purple' | 'blue' | 'ink';
/** A run of heading text and its colour name. */
export type Seg = [text: string, color: ColorName];

type CueBase = {id: string; t0: number; t1: number; v: 'L' | 'F' | 'LF'};
/** One footer card. Times are sequence seconds; see cues.ts for the field meanings per kind. */
export type Cue = CueBase & (
  | {kind: 'statement'; tab: string; head: Seg[]; sub?: string | null}
  | {kind: 'stat'; tab: string; value: number; fmt: string; unit: string; sub: string; color?: ColorName}
  | {kind: 'pills'; tab: string; title?: string; agenda?: boolean; pills: [label: string, color: ColorName, t: number][]}
  | {kind: 'list'; tab: string; mode: 'check' | 'approve'; rows: [text: string, t: number][]}
  | {kind: 'slide'; head: string; sub: string | null}
  | {kind: 'question'; n: number; head: string}
  | {kind: 'status'; tab: string; states: [text: string, color: ColorName, t: number][]}
  | {kind: 'bar'; tab: string; value: string; sub: string; at: number}
  | {kind: 'seat'; tab: string; head: Seg[]; sub: string}
  | {kind: 'steps'; tab: string; rows: [label: string, items: [text: string, t: number][]][]}
  | {kind: 'slider'; tab: string; head: Seg[]; sub: string; move: number}
  | {kind: 'never'; tab: string; head: string; flip: number; alt: string}
  | {kind: 'venn'; tab: string; reveal: number}
  | {kind: 'loose'; head: string; bubble: number; hook: number}
);
export type CueKind = Cue['kind'];

/** Full-only explainer moment: the slide eases left beside an explainer panel. */
export type Feature = {id: string; t0: number; t1: number} & (
  | {kind: 'meat_proxy'; clicks: number[]; flip: number}
  | {kind: 'token_trim'; at: number}
  | {kind: 'forward_motion'; at: number}
  | {kind: 'invert_review'; at: number}
  | {kind: 'bug_rates'; marks: number[]}
);

/** Element groups of the v4 overlay kit (motion.py OVERLAY_KINDS). `undefined` renders everything. */
export type OverlayLayer = 'card' | 'explainer' | 'chapter' | 'name-intro' | 'side' | 'no-static-chrome';
