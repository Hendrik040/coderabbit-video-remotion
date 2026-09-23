import assert from 'node:assert/strict';
import {test} from 'node:test';
import {inversePoint, lightingDefaults, lightingTransform, vignetteDefaults, vignetteTransform} from './glowSettings';
import {createHeroPixels, heroPixelOpacity, heroPixels, heroProject, heroState} from './looping';
import {projectSchema} from './schema';

test('light transforms preserve the reference by default and invert correctly at every supported scale', () => {
  for (const [width, height] of [[320, 180], [1280, 720], [1920, 1080]]) {
    const reference = lightingTransform(width, height);
    for (const [x, y] of [[0, 0], [width / 2, height / 2], [width, height]]) {
      assert.deepEqual(inversePoint(reference, x, y), [x, y]);
    }
    for (const angle of [-180, -45, 12, 90, 180]) {
      const matrix = lightingTransform(width, height, {x: 0.3, y: -0.2, angle, width: 0.25, height: 2.5});
      const [a, b, c, d, tx, ty] = matrix;
      const point = [width * 0.2, height * 0.8];
      const restored = inversePoint(matrix, a * point[0] + c * point[1] + tx, b * point[0] + d * point[1] + ty);
      assert.ok(Math.abs(restored[0] - point[0]) < 1e-8 && Math.abs(restored[1] - point[1]) < 1e-8);
    }
  }
  assert.deepEqual(createHeroPixels(1280, 720, lightingDefaults), heroPixels);
});

test('moving the light repositions the pixel mask while preserving deterministic flicker and loop seams', () => {
  const light = {x: 0.4, y: 0.1, angle: -30, width: 0.7, height: 1.2, softness: 0.65};
  const pixels = createHeroPixels(1280, 720, light);
  const centerX = (list: typeof pixels) => list.reduce((sum, pixel) => sum + pixel.x * pixel.mask, 0) / list.reduce((sum, pixel) => sum + pixel.mask, 0);
  assert.ok(centerX(pixels) > centerX(heroPixels) + 200);
  assert.deepEqual(createHeroPixels(1280, 720, light), pixels);
  for (const frame of [0, 17, 129, 479]) {
    for (const pixel of pixels.filter((_, i) => i % 197 === 0)) {
      const expected = heroPixelOpacity(pixel, heroState(frame, 30).phase, 1);
      assert.equal(heroPixelOpacity(pixel, heroState(frame + 480, 30).phase, 1), expected);
      assert.equal(heroPixelOpacity(pixel, heroState(frame - 480, 30).phase, 1), expected);
    }
  }
});

test('vignette center and elliptical axes scale predictably at export resolutions', () => {
  for (const [width, height] of [[1280, 720], [1920, 1080]]) {
    const settings = {...vignetteDefaults, x: 0.7, y: 0.35, width: 0.6, height: 1.3, angle: 37};
    const matrix = vignetteTransform(width, height, settings);
    const [a, b, c, d, tx, ty] = matrix;
    const center = inversePoint(matrix, width * settings.x, height * settings.y);
    assert.deepEqual(center, [0, 0]);
    for (const point of [[a + tx, b + ty], [c + tx, d + ty]]) {
      const local = inversePoint(matrix, point[0], point[1]);
      assert.ok(Math.abs(Math.hypot(...local) - 1) < 1e-10);
    }
  }
});

test('lighting and vignette edits survive saved projects and reject invalid gradient geometry', () => {
  const project = heroProject();
  assert.equal(projectSchema.safeParse(project).success, true);
  const overlay = {...project.overlays[0], lighting: {...lightingDefaults, x: 0.3, angle: -45}, vignette: {...vignetteDefaults, strength: 0.8, softness: 0.4}};
  const edited = {...project, overlays: [overlay]};
  assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(edited))), edited);
  for (const patch of [{lighting: {width: 0}}, {lighting: {x: Infinity}}, {lighting: {angle: 181}}, {lighting: {softness: 0}}, {vignette: {height: -1}}, {vignette: {strength: 2}}, {vignette: {x: -1}}, {vignette: {softness: 0}}]) {
    assert.equal(projectSchema.safeParse({...project, overlays: [{...overlay, ...patch}]}).success, false);
  }
});
