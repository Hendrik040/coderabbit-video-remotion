// Python/Pillow number semantics used by the v4 engine.
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Python round(): halves go to the even neighbour. The engine rounds frames and op positions this way. */
export function pyRound(x: number) {
  const f = Math.floor(x), d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}
/** FreeType/Pillow glyph placement: fractional pen positions round half up. */
export const pilRound = (x: number) => Math.floor(x + 0.5);
/** Python int(): truncate toward zero. Pillow truncates shape coordinates the same way. */
export const int = Math.trunc;
