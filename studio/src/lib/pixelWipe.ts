import {changeStackPixelGrid} from './pixelGrid';

export const pixelWipeDefaults = {pixelSize: changeStackPixelGrid.size, scatter: 0.75};
export const pixelWipeTiming = {revealEnd: 0.44, fadeStart: 0.56};
export type WipePixel = {
  x: number; y: number; width: number; height: number; column: number;
  rowDelay: number; timing: number; exitTiming: number; speed: number; brightness: number;
};

const unit = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {const t = unit(value); return t * t * (3 - 2 * t);};
const noise = (x: number, y: number) => {
  let n = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

/** Previously saved coarse image tiles become the reference's fine points. */
export const normalizeWipePixelSize = (size = pixelWipeDefaults.pixelSize) => size > 8 ? changeStackPixelGrid.size : Math.max(2, Math.min(8, Math.round(size)));

/** Fixed points on the reference grid, with deterministic independent visibility timings. */
export function createWipePixels(pixelSize = pixelWipeDefaults.pixelSize): WipePixel[] {
  const size = normalizeWipePixelSize(pixelSize), step = size + changeStackPixelGrid.gap;
  const columns = Math.ceil(1280 / step), rows = Math.ceil(720 / step);
  return Array.from({length: columns * rows}, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    return {x: column * step, y: row * step, width: size, height: Math.min(size, 720 - row * step),
      column: column / Math.max(1, columns - 1), rowDelay: noise(row, 101),
      timing: noise(column, row), exitTiming: noise(column + 97, row + 317),
      speed: noise(column + 163, row + 571), brightness: noise(column + 31, row + 83)};
  });
}

export const pixelWipePhase = (frame: number, duration: number, fps = 30) => unit(frame / Math.max(2, Math.ceil(duration * fps) - 1));

/** Visibility passes over a stationary grid: reveal, full field, then fade from the same edge. */
export function pixelWipeState(pixel: WipePixel, phase: number, scatter = pixelWipeDefaults.scatter, direction: 'left' | 'right' = 'right') {
  const amount = unit(scatter);
  const column = direction === 'left' ? 1 - pixel.column : pixel.column;
  const variation = amount * 0.07;
  const fadeDuration = 0.06 + amount * pixel.speed * 0.02;
  const sweep = pixelWipeTiming.revealEnd - 0.07 - 0.08;
  const revealDelay = column * sweep + variation * (pixel.timing * 0.65 + pixel.rowDelay * 0.35);
  const fadeDelay = pixelWipeTiming.fadeStart + column * sweep + variation * (pixel.exitTiming * 0.65 + (1 - pixel.rowDelay) * 0.35);
  const reveal = ease((phase - revealDelay) / fadeDuration);
  const fade = ease((phase - fadeDelay) / fadeDuration);
  const visibility = reveal * (1 - fade);
  return {visibility, opacity: (0.2 + pixel.brightness * 0.75) * visibility, visible: visibility > 0};
}
