import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {drawChangeStackGlow} from './ChangeStackGlow';
import {createHeroPixels, heroPixels} from '../lib/looping';
import {lightingDefaults} from '../lib/glowSettings';
import {createWipePixels, pixelWipeDefaults, pixelWipePhase, pixelWipeState} from '../lib/pixelWipe';
import type {Overlay} from '../types';

/** The original glow is carried by individual pixels, with a solid interval around the cut. */
export function PixelGlowWipe({overlay, frame, fps}: {overlay: Overlay; frame: number; fps: number}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const source = useRef<HTMLCanvasElement | null>(null);
  const size = overlay.pixelSize ?? pixelWipeDefaults.pixelSize;
  const cells = useMemo(() => createWipePixels(size), [size]);
  const {x, y, angle, width, height, softness} = {...lightingDefaults, ...overlay.lighting};
  const customLighting = !!overlay.lighting;
  const glowPixels = useMemo(() => customLighting ? createHeroPixels(1280, 720, {x, y, angle, width, height, softness}) : heroPixels, [x, y, angle, width, height, softness, customLighting]);
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1280, 720);
    const phase = pixelWipePhase(frame, overlay.duration, fps);
    if (phase <= 0 || phase >= 1) return;
    if (!source.current) {source.current = document.createElement('canvas'); source.current.width = 1280; source.current.height = 720;}
    const sourceCtx = source.current.getContext('2d');
    if (!sourceCtx) return;
    drawChangeStackGlow(sourceCtx, frame, fps, overlay, glowPixels);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (overlay.direction === 'left') {ctx.translate(1280, 0); ctx.scale(-1, 1);}
    if (phase >= 0.42 && phase <= 0.58) {
      ctx.drawImage(source.current, 0, 0);
    } else {
      const rgb = [1, 3, 5].map(n => parseInt(overlay.accent.slice(n, n + 2), 16));
      const highlight = `rgb(${rgb.map(channel => Math.round(channel * 0.35 + 255 * 0.65)).join(',')})`;
      for (const cell of cells) {
        const state = pixelWipeState(cell, phase, overlay.scatter ?? pixelWipeDefaults.scatter);
        if (!state.visible) continue;
        const scale = 1 - state.flight * 0.5;
        const w = Math.max(1, Math.round(cell.width * scale)), h = Math.max(1, Math.round(cell.height * scale));
        const left = Math.round(state.x + (cell.width - w) / 2), top = cell.y + Math.floor((cell.height - h) / 2);
        if (left + w <= 0 || left >= 1280) continue;
        ctx.drawImage(source.current, cell.x, cell.y, cell.width, cell.height, left, top, w, h);
        if (state.flight > 0) {
          ctx.globalAlpha = Math.min(1, state.flight * (0.3 + cell.brightness * 0.5) * (overlay.intensity ?? 1));
          ctx.fillStyle = overlay.accent;
          ctx.fillRect(left, top, w, h);
          ctx.globalAlpha *= 0.45;
          ctx.fillStyle = highlight;
          const core = Math.max(1, Math.round(Math.min(w, h) * 0.45));
          ctx.fillRect(left + Math.floor((w - core) / 2), top + Math.floor((h - core) / 2), core, core);
          ctx.globalAlpha = 1;
        }
      }
    }
    ctx.restore();
  }, [frame, fps, overlay, cells, glowPixels]);
  return <canvas ref={canvas} width={1280} height={720} aria-label="Change Stack pixel wipe transition" style={{position: 'absolute', inset: 0, width: 1280, height: 720}}/>;
}
