import type {OverlayKind} from '../types';

// Change Stack hero: the site's exact segment starts, widths, stacking, and sRGB colors.
// https://www.coderabbit.ai/change-stack — ChangeStackColorBar / CodeRabbitColorBar.
export const colorBarSegments = [
  {name: 'Deep green', color: '#062619', start: 0, size: 0.0534451, expanded: 0.03, z: 0},
  {name: 'Green', color: '#28684A', start: 0.0534451, size: 0.0182813, expanded: 0.05, z: 1},
  {name: 'Bright green', color: '#46E1A5', start: 0.0717264, size: 0.00834028, expanded: 0.14, z: 1},
  {name: 'Mauve', color: '#322F37', start: 0.0800667, size: 0.18953, expanded: 0.12, z: 0},
  {name: 'Navy', color: '#171D37', start: 0.269596, size: 0.230451, expanded: 0.1, z: 0},
  {name: 'Indigo', color: '#4D60C7', start: 0.500047, size: 0.0225653, expanded: 0.2, z: 1},
  {name: 'Brown', color: '#504343', start: 0.522612, size: 0.19215, expanded: 0.09, z: 0},
  {name: 'Orange', color: '#FF570A', start: 0.714762, size: 0.0225653, expanded: 0.055, z: 2},
  {name: 'Peach', color: '#FFA057', start: 0.737328, size: 0.0366507, expanded: 0.14, z: 1},
  {name: 'Cream', color: '#D7CCC1', start: 0.773978, size: 0.226022, expanded: 0.05, z: 0},
] as const;

export const colorBarColors = colorBarSegments.map(segment => segment.color);
export const isColorBar = (kind: OverlayKind) => kind === 'color-bar-reveal' || kind === 'color-bar-loop' || kind === 'color-bar-transition';
export const colorBarRevealTiming = {expand: 0.8};
export const colorBarTransitionTiming = {reveal: 0.32, exit: 0.68};

const expandedSegments = (expansion: number) => colorBarSegments.map(segment => ({...segment, width: segment.size + (Math.max(segment.size, segment.expanded) - segment.size) * expansion}));
const linearPhase = (frame: number, fps: number, seconds: number) => Math.max(0, Math.min(1, frame / Math.max(2, Math.ceil(seconds * fps) - 1)));

// Reserve part of the expansion for a constant drift, so the eased reveal never settles.
const revealExpansion = (phase: number, expandUntil: number) => 0.85 * colorBarEase(phase / expandUntil) + 0.15 * phase;

/** CSS cubic-bezier(.65, 0, .35, 1), evaluated by frame for identical preview and export. */
export function colorBarEase(progress: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const t = (lo + hi) / 2;
    const x = 3 * (1 - t) ** 2 * t * 0.65 + 3 * (1 - t) * t ** 2 * 0.35 + t ** 3;
    if (x < progress) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return 3 * (1 - t) * t ** 2 + t ** 3;
}

export function colorBarState(frame: number, fps: number, seconds: number, loop = false) {
  if (!loop) return expandedSegments(revealExpansion(linearPhase(frame, fps, seconds), colorBarRevealTiming.expand));
  const cycleFrames = Math.max(1, Math.round(seconds * fps));
  const phase = ((frame % cycleFrames) + cycleFrames) % cycleFrames / cycleFrames;
  // The reusable loop adds a hold and a symmetric return, with a rest at the seam.
  const progress = phase < 0.4 ? phase / 0.4 : phase < 0.5 ? 1 : phase < 0.9 ? (0.9 - phase) / 0.4 : 0;
  const expansion = colorBarEase(progress);
  return expandedSegments(expansion);
}

/** Reveal the bottom strip from the left, keep the colors drifting, then clear to the right. */
export function colorBarTransitionState(frame: number, fps: number, seconds: number) {
  const phase = linearPhase(frame, fps, seconds);
  const enter = colorBarEase(phase / colorBarTransitionTiming.reveal);
  const leave = colorBarEase((phase - colorBarTransitionTiming.exit) / (1 - colorBarTransitionTiming.exit));
  return {left: leave, right: 1 - enter, segments: expandedSegments(revealExpansion(phase, colorBarTransitionTiming.reveal))};
}
