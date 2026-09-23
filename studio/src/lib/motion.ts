/** Pure frame math shared by the player, thumbnails, and Remotion exports. */
export const unit = (value: number) => Math.max(0, Math.min(1, value));
export const lastFrame = (seconds: number, fps = 30) => Math.max(2, Math.ceil(seconds * fps) - 1);
export const frameProgress = (frame: number, seconds: number, fps = 30) => unit(frame / lastFrame(seconds, fps));

export function cycleProgress(frame: number, seconds: number, fps = 30) {
  const length = Math.max(1, Math.round(seconds * fps));
  return ((frame % length) + length) % length / length;
}

/** Solve x before evaluating y, just as a CSS cubic-bezier timing function does. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number, iterations = 24) {
  const coordinate = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  return (progress: number) => {
    // Phase subtraction can leave a subpixel residue at an otherwise exact endpoint.
    if (progress <= 1e-10) return 0;
    if (progress >= 1 - 1e-10) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < iterations; i++) {
      const t = (lo + hi) / 2;
      if (coordinate(t, x1, x2) < progress) lo = t; else hi = t;
    }
    return coordinate((lo + hi) / 2, y1, y2);
  };
}

export const motionCurves = {
  reveal: cubicBezier(0.23, 1, 0.32, 1),
  travel: cubicBezier(0.77, 0, 0.175, 1),
  // These two curves reproduce the CodeRabbit website, including its loop cadence.
  colorBar: cubicBezier(0.65, 0, 0.35, 1),
  glow: cubicBezier(0.45, 0, 0.55, 1, 20),
};

// Broadcast graphics have a longer editorial cadence than interactive UI controls.
export const brandMotion = {enter: 0.6, exit: 0.4, stagger: 0.06, distance: 28, exitDistance: 12};
export const staggerFrames = brandMotion.stagger * 30;

export function revealTiming(seconds: number, fps = 30) {
  const last = lastFrame(seconds, fps);
  const factor = Math.min(1, last / (fps * (brandMotion.enter + brandMotion.exit)));
  const enter = brandMotion.enter * fps * factor;
  const exit = brandMotion.exit * fps * factor;
  return {last, factor, enter, hold: factor < 1 ? 0 : Math.max(0, last - enter - exit), exit};
}

/** Clear endpoints, a readable hold, and the same exit edge for every foreground graphic.
 * Stagger uses reference frames at 30 fps, independent of the composition frame rate.
 */
export function revealMotion(frame: number, seconds: number, fps = 30, stagger = 0) {
  const timing = revealTiming(seconds, fps);
  const delay = Math.min(stagger * fps / 30 * timing.factor, timing.enter * 0.6);
  const enter = motionCurves.reveal((frame - delay) / Math.max(0.001, timing.enter - delay));
  const leave = motionCurves.reveal((frame - (timing.last - timing.exit)) / Math.max(0.001, timing.exit));
  return {enter, leave, opacity: enter * (1 - leave), offset: (1 - enter) * brandMotion.distance + leave * brandMotion.exitDistance};
}
