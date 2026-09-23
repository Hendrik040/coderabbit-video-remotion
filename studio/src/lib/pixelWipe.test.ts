import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createWipePixels, pixelWipePhase, pixelWipeState} from './pixelWipe';
import {assetProject, brandAssetDefaults, cutFrame} from './brandAssets';
import {projectSchema} from './schema';

test('pixel wipes clear their endpoints and completely cover the cut at every size and duration', () => {
  for (const size of [8, 16, 28, 40]) {
    const cells = createWipePixels(size);
    assert.equal(cells.reduce((sum, cell) => sum + cell.width * cell.height, 0), 1280 * 720);
    for (const duration of [0.1, 0.6, 2.4, 12]) {
      const last = Math.ceil(duration * 30) - 1;
      for (const scatter of [0, 0.75, 1]) {
        for (const cell of cells) {
          assert.equal(pixelWipeState(cell, pixelWipePhase(0, duration), scatter).visible, false);
          assert.equal(pixelWipeState(cell, pixelWipePhase(last, duration), scatter).visible, false);
          const cut = pixelWipeState(cell, pixelWipePhase(cutFrame(duration), duration), scatter);
          assert.equal(cut.enter, 1);
          assert.equal(cut.leave, 0);
          assert.equal(cut.flight, 0);
          assert.ok(Math.abs(cut.x - cell.x) < 1e-8);
        }
      }
    }
  }
});

test('pixels travel forward with reproducible uneven timing instead of moving as uniform rows', () => {
  const pixels = createWipePixels(16);
  assert.deepEqual(createWipePixels(16), pixels);
  const column = pixels.filter(pixel => pixel.x === 640);
  const positions = column.map(pixel => pixelWipeState(pixel, 0.2, 1).x);
  assert.ok(new Set(positions.map(x => Math.round(x))).size > 15);
  assert.equal(new Set(column.map(pixel => pixelWipeState(pixel, 0.2, 0).x)).size, 1);
  const samples = pixels.filter((_, index) => index % 31 === 0);
  for (const cell of samples) {
    let previous = -Infinity;
    for (let frame = 0; frame < 72; frame++) {
      const state = pixelWipeState(cell, pixelWipePhase(frame, 2.4));
      assert.ok(state.x >= previous - 1e-8);
      previous = state.x;
    }
    const forward = [0, 12, 27, 36, 51, 71].map(frame => pixelWipeState(cell, pixelWipePhase(frame, 2.4)));
    const backward = [71, 51, 36, 27, 12, 0].map(frame => pixelWipeState(cell, pixelWipePhase(frame, 2.4))).reverse();
    assert.deepEqual(backward, forward);
  }
});

test('pixel settings and glow geometry persist through presets and export validation', () => {
  const asset = {id:'pixel-wipe', ...brandAssetDefaults['pixel-glow-wipe'], pixelSize:28, scatter:0.9,
    lighting:{x:0.2, angle:-20}, vignette:{strength:0.6, x:0.7}};
  const project = assetProject(asset, 1920);
  assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
  for (const patch of [{pixelSize:0}, {pixelSize:41}, {pixelSize:12.5}, {scatter:-0.1}, {scatter:1.1}]) {
    assert.equal(projectSchema.safeParse({...project, overlays:[{...asset, ...patch}]}).success, false);
  }
});
