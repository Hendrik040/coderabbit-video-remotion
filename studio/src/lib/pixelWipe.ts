export const pixelWipeDefaults = {pixelSize: 16, scatter: 0.75};
export type WipePixel = {
  x: number; y: number; width: number; height: number; column: number;
  rowIn: number; rowOut: number; timing: number; speed: number; brightness: number;
};

const unit = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {const t = unit(value); return t * t * (3 - 2 * t);};
const noise = (x: number, y: number) => {
  let n = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

/** Fixed per-pixel variation keeps scrubbing, previews, and exports identical. */
export function createWipePixels(size = pixelWipeDefaults.pixelSize): WipePixel[] {
  const columns = Math.ceil(1280 / size), rows = Math.ceil(720 / size);
  return Array.from({length: columns * rows}, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    return {x: column * size, y: row * size, width: Math.min(size, 1280 - column * size), height: Math.min(size, 720 - row * size),
      column: column / Math.max(1, columns - 1), rowIn: noise(row, 101), rowOut: noise(row, 317),
      timing: noise(column, row), speed: noise(column + 163, row + 571), brightness: noise(column + 31, row + 83)};
  });
}

export const pixelWipePhase = (frame: number, duration: number, fps = 30) => unit(frame / Math.max(2, Math.ceil(duration * fps) - 1));

/** Pixels fly in from the left, settle by 42%, and depart to the right after 58%. */
export function pixelWipeState(pixel: WipePixel, phase: number, scatter = pixelWipeDefaults.scatter) {
  const amount = unit(scatter);
  const enterDelay = pixel.column * 0.18 + amount * (pixel.rowIn * 0.07 + pixel.timing * 0.04);
  const exitDelay = 0.58 + pixel.column * 0.18 + amount * (pixel.rowOut * 0.06 + pixel.timing * 0.04);
  const enter = ease((phase - enterDelay) / (0.1 + amount * pixel.speed * 0.03));
  const leave = ease((phase - exitDelay) / (0.1 + amount * pixel.speed * 0.025));
  const overshoot = pixel.width * (1 + amount * pixel.speed * 6);
  const x = -overshoot + (pixel.x + overshoot) * enter + (1280 - pixel.x + overshoot) * leave;
  const flight = 4 * enter * (1 - enter) + 4 * leave * (1 - leave);
  return {x, enter, leave, flight, visible: enter > 0 && leave < 1};
}
