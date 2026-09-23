import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createWipePixels, normalizeWipePixelSize, pixelWipeDefaults, pixelWipePhase, pixelWipeState} from './pixelWipe';
import {changeStackPixelGrid} from './pixelGrid';
import {drawPixelWipe} from '../brand/PixelGlowWipe';
import {assetProject, brandAssetDefaults} from './brandAssets';
import {projectSchema} from './schema';

test('fixed wipe points match the hero grid, fully reveal at the midpoint, and clear both ends', () => {
  assert.equal(pixelWipeDefaults.pixelSize, changeStackPixelGrid.size);
  const pixels = createWipePixels();
  assert.equal(pixels.length, Math.ceil(1280 / 6) * Math.ceil(720 / 6));
  assert.equal(pixels[1].x - pixels[0].x, 6);
  for (const pixel of pixels) {
    assert.equal(pixel.width, 4);
    assert.equal(pixel.height, 4);
    assert.equal(pixel.y % 6, 0);
  }
  for (const size of [2, 4, 6, 8]) {
    for (const duration of [0.1, 0.6, 2.4, 12]) {
      const last = Math.ceil(duration * 30) - 1;
      for (const scatter of [0, 0.75, 1]) {
        for (const cell of createWipePixels(size)) {
          for (const direction of ['left', 'right'] as const) {
            assert.equal(pixelWipeState(cell, pixelWipePhase(0, duration), scatter, direction).visible, false);
            assert.equal(pixelWipeState(cell, 0.5, scatter, direction).visibility, 1);
            assert.equal(pixelWipeState(cell, pixelWipePhase(last, duration), scatter, direction).visible, false);
          }
        }
      }
    }
  }
});

test('visibility reveals from the left and fades from the left with independently staggered timing', () => {
  const pixels = createWipePixels();
  assert.deepEqual(createWipePixels(), pixels);
  const column = pixels.filter(pixel => pixel.x === 636);
  assert.ok(new Set(column.map(pixel => pixelWipeState(pixel, 0.18, 1).visibility.toFixed(3))).size > 30);
  assert.equal(new Set(column.map(pixel => pixelWipeState(pixel, 0.18, 0).visibility)).size, 1);
  const left = pixels.filter(pixel => pixel.x < 320), right = pixels.filter(pixel => pixel.x > 960);
  const visibility = (group: typeof pixels, phase: number, direction: 'left' | 'right') => group.reduce((sum, pixel) => sum + pixelWipeState(pixel, phase, 0.75, direction).visibility, 0) / group.length;
  for (const direction of ['left', 'right'] as const) {
    const leading = direction === 'right' ? left : right, trailing = direction === 'right' ? right : left;
    assert.ok(visibility(leading, 0.22, direction) > 0.9);
    assert.ok(visibility(trailing, 0.22, direction) < 0.01);
    assert.ok(visibility(leading, 0.78, direction) < 0.01);
    assert.ok(visibility(trailing, 0.78, direction) > 0.9);
  }
  for (const cell of pixels.filter((_, index) => index % 31 === 0)) {
    let previous = pixelWipeState(cell, 0);
    for (let frame = 1; frame < 72; frame++) {
      const state = pixelWipeState(cell, pixelWipePhase(frame, 2.4));
      if (frame <= 35) assert.ok(state.opacity >= previous.opacity);
      else assert.ok(state.opacity <= previous.opacity);
      previous = state;
    }
    const frames = [0, 12, 27, 36, 51, 71];
    const forward = frames.map(frame => pixelWipeState(cell, pixelWipePhase(frame, 2.4)));
    assert.deepEqual(frames.reverse().map(frame => pixelWipeState(cell, pixelWipePhase(frame, 2.4))).reverse(), forward);
  }
});

test('all rendered points remain at fixed coordinates throughout reveal, full screen, and fade', () => {
  const pixels = createWipePixels();
  const grid = new Set(pixels.map(pixel => `${pixel.x},${pixel.y}`));
  const rectangles: number[][] = [];
  const ctx = {clearRect() {}, save() {}, restore() {}, globalAlpha:1, fillStyle:'', fillRect(...rect: number[]) {rectangles.push([...rect, this.globalAlpha]);}};
  const asset = {id:'points', ...brandAssetDefaults['pixel-glow-wipe']};
  for (const direction of ['left', 'right'] as const) {
    for (const frame of [8, 16, 24, 36, 48, 55, 63]) {
      rectangles.length = 0;
      drawPixelWipe(ctx as unknown as CanvasRenderingContext2D, {...asset, direction}, frame, 30, pixels);
      assert.ok(rectangles.length > 0);
      if (frame === 36) assert.equal(rectangles.length, pixels.length);
      for (const [x, y, width, height, opacity] of rectangles) {
        assert.ok(grid.has(`${x},${y}`), 'Points cannot drift off their original grid');
        assert.equal(width, 4);
        assert.equal(height, 4);
        assert.ok(opacity > 0 && opacity <= 1);
      }
    }
  }
});

test('fine pixel settings persist and legacy coarse presets upgrade to reference-sized points', () => {
  const asset = {id:'pixel-wipe', ...brandAssetDefaults['pixel-glow-wipe'], pixelSize:6, scatter:0.9, intensity:1.2};
  const project = assetProject(asset, 1920);
  assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
  for (const pixelSize of [12, 16, 28, 40]) {
    const saved = projectSchema.parse({...project, overlays:[{...asset,pixelSize}]});
    assert.equal(saved.overlays[0].pixelSize, 4);
    assert.equal(normalizeWipePixelSize(pixelSize), 4);
  }
  for (const patch of [{pixelSize:0}, {pixelSize:1}, {pixelSize:41}, {pixelSize:3.5}, {scatter:-0.1}, {scatter:1.1}]) {
    assert.equal(projectSchema.safeParse({...project, overlays:[{...asset, ...patch}]}).success, false);
  }
});
