export type GlowLighting = {
  x: number; y: number; angle: number; width: number; height: number;
  softness: number; ambient: number;
};
export type GlowVignette = {
  x: number; y: number; angle: number; width: number; height: number;
  softness: number; strength: number;
};
export type Matrix2D = [number, number, number, number, number, number];

export const lightingDefaults: GlowLighting = {x: 0, y: 0, angle: 12, width: 1, height: 1, softness: 1, ambient: 1};
// Zero strength preserves the original hero until a vignette is added.
export const vignetteDefaults: GlowVignette = {x: 0.5, y: 0.5, angle: 0, width: 1, height: 1, softness: 0.6, strength: 0};

/** Transform the original light field about its source center, in canvas coordinates. */
export function lightingTransform(width: number, height: number, settings: Partial<GlowLighting> = {}): Matrix2D {
  const light = {...lightingDefaults, ...settings};
  const angle = (light.angle - lightingDefaults.angle) * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const a = cos * light.width, b = sin * light.width, c = -sin * light.height, d = cos * light.height;
  const cx = 451 * width / 1443;
  const cy = 446 * (height + 71 * height / 720) / 935 - 71 * height / 720;
  return [a, b, c, d, light.x * width + cx - a * cx - c * cy, light.y * height + cy - b * cx - d * cy];
}

export function inversePoint([a, b, c, d, tx, ty]: Matrix2D, x: number, y: number): [number, number] {
  const determinant = a * d - b * c, dx = x - tx, dy = y - ty;
  return [(d * dx - c * dy) / determinant, (a * dy - b * dx) / determinant];
}

export function vignetteTransform(width: number, height: number, settings: Partial<GlowVignette> = {}): Matrix2D {
  const vignette = {...vignetteDefaults, ...settings};
  const angle = vignette.angle * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  return [cos * width * vignette.width / 2, sin * width * vignette.width / 2,
    -sin * height * vignette.height / 2, cos * height * vignette.height / 2,
    width * vignette.x, height * vignette.y];
}
