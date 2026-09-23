import {broadcastKinds} from './broadcast';
import type {AssetType, Overlay, OverlayKind, Project} from '../types';

export const assetType = (kind: OverlayKind): AssetType => kind === 'hero' ? 'looping' : 'linear';
export const assetCollections: Record<AssetType, OverlayKind[]> = {
  linear: [...broadcastKinds, 'terminal', 'agentflow', 'code', 'diagram', 'callout'],
  looping: ['hero'],
};
export const heroDefaults: Omit<Overlay, 'id'> = {
  kind: 'hero', enabled: true, title: 'Change Stack glow', body: '', start: 0, duration: 16,
  binding: 'cue', placement: 'center', accent: '#687FF5', scale: 1,
  loopDuration: 16, intensity: 1, opacity: 1,
};

export function heroProject(): Project {
  return {name: 'Change Stack glow · seamless loop', mediaUrl: null, mediaName: 'Looping background', duration: 16, fps: 30, width: 1280, height: 720, samples: [], cues: [], overlays: [{id: 'hero', ...heroDefaults}], sampleMode: true, showTracking: false, mute: false, broadcast: true};
}

// Match the reference's cubic-bezier(.45, 0, .55, 1) on each half of the drift.
function driftEase(progress: number) {
  if (progress === 0 || progress === 1) return progress;
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const t = (lo + hi) / 2;
    const x = 3 * (1 - t) ** 2 * t * 0.45 + 3 * (1 - t) * t ** 2 * 0.55 + t ** 3;
    if (x < progress) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return 3 * (1 - t) * t ** 2 + t ** 3;
}

/** Periodic phase, including fractional cycle lengths. No wall clock or random state. */
export function heroState(frame: number, fps: number, seconds = 16) {
  const cycleFrames = Math.max(1, Math.round(seconds * fps));
  const phase = ((frame % cycleFrames) + cycleFrames) % cycleFrames / cycleFrames;
  const drift = driftEase(phase <= 0.5 ? phase * 2 : (1 - phase) * 2);
  return {phase, x: 16 * drift, y: -8 * drift, scale: 1 + 0.025 * drift, glow: 1 - 0.05 * drift};
}

// Stable noise makes independent pixel changes reproducible when rendering or seeking.
const noise = (x: number, y: number) => {
  let n = Math.imul(x + 23, 374761393) ^ Math.imul(y + 47, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
const unit = (n: number) => Math.max(0, Math.min(1, n));

/** Reference SVG ellipse, fitted to the video frame (including the hero's top bleed). */
export function heroBeamTransform(width: number, height: number): [number, number, number, number, number, number] {
  const angle = 12 * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  const sx = width / 1443, sy = (height + 71 * height / 720) / 935;
  return [(cos * 37.3 - sin * 24.7) * sx, (sin * 37.3 + cos * 24.7) * sy,
    (-cos * 90.613 - sin * 136.84) * sx, (-sin * 90.613 + cos * 136.84) * sy,
    451 * sx, 446 * sy - 71 * height / 720];
}

type PixelChange = {phase: number; opacity: number};
export type HeroPixel = {x: number; y: number; mask: number; initial: number; changes: PixelChange[]};

/** 4px squares, 2px gaps, each holding its brightness until an independent change. */
export function createHeroPixels(width: number, height: number): HeroPixel[] {
  const [a, b, c, d, tx, ty] = heroBeamTransform(width, height);
  const determinant = a * d - b * c;
  const bleed = 71 * height / 720, gridHeight = height + bleed;
  const pixels: HeroPixel[] = [];
  for (let row = 0; row * 6 - bleed < height; row++) {
    const y = row * 6 - bleed;
    if (y + 4 <= 0) continue;
    for (let col = 0; col * 6 < width; col++) {
      const x = col * 6, dx = x - tx, dy = y - ty;
      const u = (d * dx - c * dy) / determinant, v = (a * dy - b * dx) / determinant;
      const beam = unit(1 - Math.hypot(u, v) / 10);
      const vertical = unit((y + bleed) / (96 * height / 720)) * unit((height - y) / (gridHeight * 0.25));
      const horizontal = unit((width * 0.7 - x) / (width * 0.14));
      const mask = beam * vertical * horizontal;
      if (mask < 0.005) continue;

      // Poisson arrivals at the site's .4 changes/second, baked over the 16s reference cycle.
      // The final value is also the starting value, so the seam has no synchronized reset.
      const seed = Math.imul(col + 1, 73856093) ^ Math.imul(row + 1, 19349663);
      const changes: PixelChange[] = [];
      let seconds = 0;
      for (let event = 0; ; event++) {
        seconds += -Math.log(Math.max(1e-9, 1 - noise(seed, event * 2))) / 0.4;
        if (seconds >= 16) break;
        changes.push({phase: seconds / 16, opacity: noise(seed, event * 2 + 1) * 0.2});
      }
      pixels.push({x, y, mask, initial: changes.at(-1)?.opacity ?? noise(seed, -1) * 0.2, changes});
    }
  }
  return pixels;
}

export const heroPixels = createHeroPixels(1280, 720);

export function heroPixelOpacity(pixel: HeroPixel, phase: number, intensity: number) {
  let opacity = pixel.initial;
  for (const change of pixel.changes) {
    if (change.phase > phase) break;
    opacity = change.opacity;
  }
  return unit(opacity * pixel.mask * intensity);
}

export function activeLoopAssets(overlays: Overlay[], frame: number, fps: number) {
  return overlays.filter(o => assetType(o.kind) === 'looping' && o.enabled && frame >= o.start * fps && frame < (o.start + o.duration) * fps);
}
