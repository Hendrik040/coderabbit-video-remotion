import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {createHeroPixels, heroBeamTransform, heroPixelOpacity, heroPixels, heroState, type HeroPixel} from '../lib/looping';
import type {Overlay} from '../types';

type GlowSettings = {accent: string; intensity?: number; loopDuration?: number};

/** Shared drawing for the live library preview, the scrubber, and exported frames. */
function drawGlow(ctx: CanvasRenderingContext2D, frame: number, fps: number, settings: GlowSettings, pixels: HeroPixel[]) {
  const {width, height} = ctx.canvas;
  const intensity = settings.intensity ?? 1;
  const state = heroState(frame, fps, settings.loopDuration ?? 16);
  const rgb = [1, 3, 5].map(n => parseInt(settings.accent.slice(n, n + 2), 16));
  const color = (alpha: number) => `rgba(${rgb.join(',')},${Math.min(1, alpha * intensity)})`;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#121113';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.scale(width * 0.65, height * 0.75);
  const corner = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  corner.addColorStop(0, color(0.72));
  corner.addColorStop(0.38, color(0.38));
  corner.addColorStop(0.72, color(0));
  ctx.fillStyle = corner;
  ctx.fillRect(0, 0, 1, 1);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = state.glow;
  ctx.translate(width * 0.31 + state.x * width / 1280, state.y * height / 720);
  ctx.scale(state.scale, 1);
  ctx.translate(-width * 0.31, 0);
  ctx.transform(...heroBeamTransform(width, height));
  const beam = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
  beam.addColorStop(0, color(1));
  beam.addColorStop(1, color(0));
  ctx.fillStyle = beam;
  ctx.fillRect(-10, -10, 20, 20);
  ctx.restore();

  // The reference holds each pixel's opacity between random changes, without a traveling wave.
  ctx.fillStyle = `rgb(${rgb.map(channel => Math.round(channel * 0.2 + 255 * 0.8)).join(',')})`;
  for (const pixel of pixels) {
    const opacity = heroPixelOpacity(pixel, state.phase, intensity);
    if (opacity < 0.001) continue;
    ctx.globalAlpha = opacity;
    ctx.fillRect(pixel.x, pixel.y, 4, 4);
  }
  ctx.globalAlpha = 1;
}

/** Synchronous, frame-driven draw: rendering and backwards seeking never use a wall clock. */
export function ChangeStackGlow({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const {accent, intensity, loopDuration} = overlay;
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) drawGlow(ctx, frame, fps, {accent, intensity, loopDuration}, heroPixels);
  }, [frame, fps, loopDuration, intensity, accent]);
  return <canvas ref={canvas} width={1280} height={720} aria-label="Looping Change Stack glow background" style={{position: 'absolute', inset: 0, width: 1280, height: 720, opacity: overlay.opacity ?? 1}}/>;
}

const thumbnailPixels = createHeroPixels(320, 180);

/** This timer belongs only to the library thumbnail; the composition can remain paused. */
export function ChangeStackGlowThumbnail() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settings = {accent: '#888888'};
    let raf = 0, origin = 0, lastFrame = -1, inView = true;
    const draw = (frame: number) => {drawGlow(ctx, frame, 30, settings, thumbnailPixels);};
    const tick = (now: number) => {
      if (!origin) origin = now;
      const frame = Math.floor((now - origin) * 30 / 1000) % 480;
      if (frame !== lastFrame) {draw(frame); lastFrame = frame;}
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && inView && !reducedMotion.matches) raf = requestAnimationFrame(tick);
    };
    draw(0);
    const observer = new IntersectionObserver(([entry]) => {inView = entry.isIntersecting; sync();});
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
    };
  }, []);
  return <canvas ref={canvas} width={320} height={180} className="mini-hero-canvas" aria-hidden="true"/>;
}
