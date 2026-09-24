import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {createHeroPixels, heroBeamTransform, heroPixelOpacity, heroPixels, heroState, type HeroPixel} from '../lib/looping';
import {inversePoint, lightingDefaults, lightingTransform, vignetteDefaults, vignetteTransform} from '../lib/glowSettings';
import type {Overlay} from '../types';
import {changeStackPixelGrid} from '../lib/pixelGrid';

type GlowSettings = Pick<Overlay, 'accent' | 'intensity' | 'loopDuration' | 'lighting' | 'vignette'>;

/** Shared drawing for the main preview, the scrubber, and exported frames. */
export function drawChangeStackGlow(ctx: CanvasRenderingContext2D, frame: number, fps: number, settings: GlowSettings, pixels: HeroPixel[]) {
  const {width, height} = ctx.canvas;
  const intensity = settings.intensity ?? 1;
  const light = {...lightingDefaults, ...settings.lighting};
  const vignette = {...vignetteDefaults, ...settings.vignette};
  const state = heroState(frame, fps, settings.loopDuration ?? 16);
  const rgb = [1, 3, 5].map(n => parseInt(settings.accent.slice(n, n + 2), 16));
  const color = (alpha: number) => `rgba(${rgb.join(',')},${Math.min(1, alpha * intensity)})`;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#121113';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.transform(...lightingTransform(width, height, light));
  ctx.save();
  ctx.globalAlpha = light.ambient;
  ctx.scale(width * 0.65, height * 0.75);
  const corner = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  corner.addColorStop(0, color(0.72));
  corner.addColorStop(0.38, color(0.38));
  corner.addColorStop(0.72, color(0));
  ctx.fillStyle = corner;
  // The whole radial field must move with the light without exposing a clipped edge.
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = state.glow;
  ctx.translate(width * 0.31 + state.x * width / 1280, state.y * height / 720);
  ctx.scale(state.scale, 1);
  ctx.translate(-width * 0.31, 0);
  ctx.transform(...heroBeamTransform(width, height));
  const beam = ctx.createRadialGradient(0, 0, (1 - light.softness) * 10, 0, 0, 10);
  beam.addColorStop(0, color(1));
  beam.addColorStop(1, color(0));
  ctx.fillStyle = beam;
  ctx.fillRect(-10, -10, 20, 20);
  ctx.restore();
  ctx.restore();

  // The reference holds each pixel's opacity between random changes, without a traveling wave.
  ctx.fillStyle = `rgb(${rgb.map(channel => Math.round(channel * 0.2 + 255 * 0.8)).join(',')})`;
  for (const pixel of pixels) {
    const opacity = heroPixelOpacity(pixel, state.phase, intensity);
    if (opacity < 0.001) continue;
    ctx.globalAlpha = opacity;
    ctx.fillRect(pixel.x, pixel.y, changeStackPixelGrid.size, changeStackPixelGrid.size);
  }
  ctx.globalAlpha = 1;

  if (vignette.strength > 0) {
    const transform = vignetteTransform(width, height, vignette);
    // Fill the complete canvas even with a small, rotated, or off-center ellipse.
    const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => inversePoint(transform, x, y));
    const minX = Math.min(...corners.map(p => p[0])), maxX = Math.max(...corners.map(p => p[0]));
    const minY = Math.min(...corners.map(p => p[1])), maxY = Math.max(...corners.map(p => p[1]));
    ctx.save();
    ctx.transform(...transform);
    const shade = ctx.createRadialGradient(0, 0, 1 - vignette.softness, 0, 0, 1);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, `rgba(0,0,0,${vignette.strength})`);
    ctx.fillStyle = shade;
    ctx.fillRect(minX - 1, minY - 1, maxX - minX + 2, maxY - minY + 2);
    ctx.restore();
  }
}

/** Synchronous, frame-driven draw: rendering and backwards seeking never use a wall clock. */
export function ChangeStackGlow({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const {accent, intensity, loopDuration, lighting, vignette} = overlay;
  const {x, y, angle, width, height, softness} = {...lightingDefaults, ...lighting};
  const pixels = useMemo(() => lighting ? createHeroPixels(1280, 720, {x, y, angle, width, height, softness}) : heroPixels, [x, y, angle, width, height, softness, !!lighting]);
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) drawChangeStackGlow(ctx, frame, fps, {accent, intensity, loopDuration, lighting, vignette}, pixels);
  }, [frame, fps, loopDuration, intensity, accent, lighting, vignette, pixels]);
  return <canvas ref={canvas} width={1280} height={720} aria-label="Looping Change Stack glow background" style={{position: 'absolute', inset: 0, width: 1280, height: 720, opacity: overlay.opacity ?? 1}}/>;
}
