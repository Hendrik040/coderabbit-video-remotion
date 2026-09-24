import assert from 'node:assert/strict';
import {test} from 'node:test';
import {appendBrandAsset, assetProject, brandAssetDefaults, brandAssetKinds, brandAssetTemplates, circleWipeState, colorBarWipeState, cutFrame, signalPhase, stackWipeState} from './brandAssets';
import {projectSchema} from './schema';
import {demoProject} from './demo';

test('brand asset presets and both export resolutions round-trip without footage or tracking', () => {
  for (const kind of brandAssetKinds) {
    for (const width of [1280, 1920]) {
      const project = assetProject({id: kind, ...brandAssetDefaults[kind]}, width);
      assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
      assert.equal(project.overlays.length, 1);
      assert.equal(project.overlays[0].start, 0);
      assert.equal(project.width / project.height, 16 / 9);
      assert.equal(project.mediaUrl, null);
      assert.deepEqual(project.samples, []);
      assert.equal(project.showTracking, false);
    }
  }
  const loop = assetProject({id: 'signal-loop', ...brandAssetDefaults['signal-loop'], loopDuration: 12});
  assert.equal(loop.duration, 12);
  assert.equal(loop.overlays[0].duration, 12);
});

test('both transition directions cover the entire cut frame and clear the endpoints at every supported duration', () => {
  for (const duration of [0.1, 0.6, 1.8, 2, 7.5, 12]) {
    const last = Math.ceil(duration * 30) - 1;
    for (const frame of [0, last]) {
      const circle = circleWipeState(frame, duration);
      assert.equal(circle.orange, 0);
      assert.equal(circle.plate, 0);
      assert.equal(circle.logo, 0);
      for (let row = 0; row < 6; row++) for (const accent of [true, false]) {
        assert.equal(Math.abs(stackWipeState(frame, duration, row, 30, accent)), 1280);
      }
    }
    const frame = cutFrame(duration), circle = circleWipeState(frame, duration);
    for (const x of [circle.x, 1280 - circle.x]) {
      for (const cornerX of [0, 1280]) assert.ok(circle.plate >= Math.hypot(cornerX - x, 360));
    }
    for (let row = 0; row < 6; row++) assert.equal(stackWipeState(frame, duration, row), 0);
  }
});

test('signal loops reproduce the same phase after a cycle and when seeking backwards', () => {
  for (const seconds of [4, 8, 12.5, 32]) {
    const cycle = Math.round(seconds * 30);
    for (const frame of [0, 1, 29, 90, cycle - 1]) {
      assert.equal(signalPhase(frame, 30, seconds), signalPhase(frame + cycle, 30, seconds));
      assert.equal(signalPhase(frame, 30, seconds), signalPhase(frame - cycle, 30, seconds));
    }
  }
});

test('color bar wipe enters from the left, covers every row at the cut, and exits to the right', () => {
  for (const duration of [0.1, 0.6, 2, 7.5, 12]) {
    const last = Math.ceil(duration * 30) - 1;
    const start = colorBarWipeState(0, duration);
    const covered = colorBarWipeState(cutFrame(duration), duration);
    const end = colorBarWipeState(last, duration);
    let bottom = 0;
    covered.forEach((band, index) => {
      assert.equal(start[index].x, -1280);
      assert.equal(band.x, 0);
      assert.equal(end[index].x, 1280);
      assert.equal(band.y, bottom);
      bottom += band.height;
    });
    assert.equal(bottom, 720);
    let previous = start;
    for (let frame = 1; frame <= last; frame++) {
      const bands = colorBarWipeState(frame, duration);
      bands.forEach((band, index) => {
        assert.ok(band.x >= previous[index].x, 'Every band travels in the same direction for entrance and exit');
        if (index > 0) assert.ok(band.x <= bands[index - 1].x, 'The stagger stays in order');
      });
      previous = bands;
    }
  }
});

test('adding an asset preserves an existing composition and fits its duration', () => {
  const project = demoProject('walkthrough');
  const original = JSON.stringify(project);
  const asset = {id: 'new', ...brandAssetDefaults['logo-reveal'], duration: 30};
  const result = appendBrandAsset(project, asset, 'added');
  assert.equal(JSON.stringify(project), original);
  assert.deepEqual(result.overlays.slice(0, project.overlays.length), project.overlays);
  assert.equal(result.name, project.name);
  assert.equal(result.duration, project.duration);
  assert.equal(result.overlays.at(-1)?.duration, project.duration);
  assert.equal(result.overlays.at(-1)?.id, 'added');
  assert.equal(projectSchema.safeParse(result).success, true);
  const full = {...project, overlays: Array.from({length: 12}, (_, i) => ({...asset, id: `layer-${i}`}))};
  assert.throws(() => appendBrandAsset(full, asset, 'added'), /12 layers/);
});

test('saved assets enforce bounded copy and supported colorways/directions', () => {
  for (const kind of brandAssetKinds) {
    const project = assetProject({id: kind, ...brandAssetDefaults[kind]});
    for (const patch of [{title: 'x'.repeat(brandAssetTemplates[kind].titleMax + 1)}, {body: 'x'.repeat(brandAssetTemplates[kind].bodyMax + 1)}, {colorway: 'pink'}, {direction: 'up'}]) {
      assert.equal(projectSchema.safeParse({...project, overlays: [{...project.overlays[0], ...patch}]}).success, false);
    }
  }
});

test('name intros retain independent colors, company, and placement through presets and composition insertion', () => {
  for (const placement of ['left', 'right'] as const) {
    const asset = {id: 'speaker', ...brandAssetDefaults['name-intro'], title: 'Jordan Lee', body: 'Head of Engineering', company: 'Example Company', accent: '#003E28', detailBackground: '#171D37', textColor: '#F7F2EF', placement};
    const project = assetProject(asset);
    assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))).overlays[0], asset);
    const composition = appendBrandAsset(demoProject(), asset, 'intro');
    const restored = projectSchema.parse(JSON.parse(JSON.stringify(composition))).overlays.at(-1);
    assert.deepEqual(restored, {...asset, id: 'intro'});
    for (const patch of [{company: 'x'.repeat(73)}, {textColor: 'transparent'}, {textColor: '#FF00ZZ'}, {detailBackground: 'transparent'}]) {
      assert.equal(projectSchema.safeParse({...project, overlays: [{...asset, ...patch}]}).success, false);
    }
  }
});
