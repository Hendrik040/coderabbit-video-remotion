import assert from 'node:assert/strict';
import {test} from 'node:test';
import {activeLoopAssets, assetCollections, assetType, heroPixelOpacity, heroPixels, heroProject, heroState} from './looping';
import {demoProject, overlayDefaults} from './demo';
import {projectSchema} from './schema';

test('every available component belongs to exactly one playback type', () => {
  const kinds = Object.values(assetCollections).flat();
  assert.equal(new Set(kinds).size, kinds.length);
  const available = Object.keys(overlayDefaults).filter(kind => !['logo-reveal', 'circle-wipe', 'signal-loop', 'type-reveal', 'brand-signoff'].includes(kind));
  assert.deepEqual([...kinds].sort(), available.sort());
  for (const [type, collection] of Object.entries(assetCollections)) {
    for (const kind of collection) assert.equal(assetType(kind), type);
  }
});

test('glow and pixel field repeat exactly after every cycle, including when seeking backwards', () => {
  for (const seconds of [4, 7.5, 16, 32]) {
    const cycle = Math.round(seconds * 30);
    for (const frame of [0, 1, 7, 39, 87, cycle - 1]) {
      const a = heroState(frame, 30, seconds);
      assert.deepEqual(heroState(frame + cycle, 30, seconds), a);
      assert.deepEqual(heroState(frame - cycle, 30, seconds), a);
      for (const pixel of heroPixels.filter((_, i) => i % 113 === 0)) {
        assert.equal(heroPixelOpacity(pixel, a.phase, 1), heroPixelOpacity(pixel, heroState(frame + cycle, 30, seconds).phase, 1));
      }
    }
  }
});

test('glow moves out and back with the reference easing, without orbiting or pulsing', () => {
  assert.deepEqual(heroState(0, 30), {phase: 0, x: 0, y: -0, scale: 1, glow: 1});
  assert.deepEqual(heroState(240, 30), {phase: 0.5, x: 16, y: -8, scale: 1.025, glow: 0.95});
  for (const frame of [1, 60, 120, 239]) {
    const {phase: _a, ...outward} = heroState(frame, 30);
    const {phase: _b, ...returning} = heroState(480 - frame, 30);
    assert.deepEqual(outward, returning);
  }
});

test('pixels flicker independently and hold brightness, including across the loop seam', () => {
  const changedFraction = (a: number, b: number) => heroPixels.filter(pixel =>
    heroPixelOpacity(pixel, a, 1) !== heroPixelOpacity(pixel, b, 1)).length / heroPixels.length;
  // At .4 changes/sec, about 1.3% of pixels change per 30fps frame; about 33% per second.
  for (const [a, b] of [[0, 1 / 480], [239 / 480, 240 / 480], [479 / 480, 0]]) {
    const changed = changedFraction(a, b);
    assert.ok(changed > 0.005 && changed < 0.025, `Unexpected frame-wide flicker: ${changed}`);
  }
  assert.ok(changedFraction(0, 30 / 480) > 0.25);
  assert.ok(changedFraction(0, 30 / 480) < 0.4);
  for (const pixel of heroPixels.filter((_, i) => i % 113 === 0)) {
    if (pixel.changes.length < 2) continue;
    const [a, b] = pixel.changes;
    assert.equal(heroPixelOpacity(pixel, a.phase, 1), heroPixelOpacity(pixel, (a.phase + b.phase) / 2, 1));
    assert.equal(heroPixelOpacity(pixel, 0, 1), heroPixelOpacity(pixel, 1, 1));
  }
});

test('loop settings round-trip and reject invalid periods, intensities and opacity', () => {
  const project = heroProject();
  assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
  for (const patch of [{loopDuration: 0}, {loopDuration: Infinity}, {loopDuration: 33}, {intensity: 2}, {opacity: -1}]) {
    assert.equal(projectSchema.safeParse({...project, overlays: [{...project.overlays[0], ...patch}]}).success, false);
  }
});

test('backgrounds respect visibility and timeline boundaries independently of foreground layer order', () => {
  const loop = {...heroProject().overlays[0], start: 2, duration: 20};
  const layers = [...demoProject().overlays, loop];
  assert.equal(activeLoopAssets(layers, 59, 30).length, 0);
  assert.deepEqual(activeLoopAssets(layers, 60, 30), [loop]);
  assert.deepEqual(activeLoopAssets(layers, 659, 30), [loop]);
  assert.equal(activeLoopAssets(layers, 660, 30).length, 0);
  assert.equal(activeLoopAssets([{...loop, enabled: false}], 60, 30).length, 0);
});
