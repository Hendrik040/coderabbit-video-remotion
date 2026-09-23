import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {createWipePixels, normalizeWipePixelSize, pixelWipeDefaults, pixelWipePhase, pixelWipeState, type WipePixel} from '../lib/pixelWipe';
import type {Overlay} from '../types';

/** Animate only opacity. Every point stays on the same grid coordinate for the entire transition. */
export function drawPixelWipe(ctx: CanvasRenderingContext2D, overlay: Overlay, frame: number, fps: number, pixels: WipePixel[]) {
  ctx.clearRect(0, 0, 1280, 720);
  const phase = pixelWipePhase(frame, overlay.duration, fps);
  if (phase <= 0 || phase >= 1) return;
  const rgb = [1, 3, 5].map(n => parseInt(overlay.accent.slice(n, n + 2), 16));
  ctx.save();
  ctx.fillStyle = `rgb(${rgb.map(channel => Math.round(channel * 0.35 + 255 * 0.65)).join(',')})`;
  for (const pixel of pixels) {
    const state = pixelWipeState(pixel, phase, overlay.scatter ?? pixelWipeDefaults.scatter, overlay.direction);
    if (!state.visible) continue;
    ctx.globalAlpha = Math.min(1, state.opacity * (overlay.intensity ?? 1));
    ctx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
  }
  ctx.restore();
}

export function PixelGlowWipe({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = normalizeWipePixelSize(overlay.pixelSize);
  const pixels = useMemo(() => createWipePixels(size), [size]);
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) drawPixelWipe(ctx, overlay, frame, fps, pixels);
  }, [frame, fps, overlay, pixels]);
  return <canvas ref={canvas} width={1280} height={720} aria-label="Change Stack fine pixel wipe transition" style={{position: 'absolute', inset: 0, width: 1280, height: 720, imageRendering: 'pixelated'}}/>;
}
