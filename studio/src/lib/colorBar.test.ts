import assert from 'node:assert/strict';
import {test} from 'node:test';
import {colorBarState} from './colorBar';
import {assetProject, brandAssetDefaults} from './brandAssets';
import {projectSchema} from './schema';

test('hero reveal expands the five foreground colors at fixed anchors and holds after 3.2 seconds', () => {
  const start = colorBarState(0, 30, 4);
  const middle = colorBarState(48, 30, 4);
  const end = colorBarState(96, 30, 4);
  assert.deepEqual(colorBarState(119, 30, 4), end);
  assert.deepEqual(end.map(s => s.start), start.map(s => s.start));
  assert.deepEqual(end.flatMap((s, i) => s.width > start[i].width ? [s.name] : []), ['Green', 'Bright green', 'Indigo', 'Orange', 'Peach']);
  for (let i = 0; i < start.length; i++) {
    assert.ok(Math.abs(middle[i].width - (start[i].width + end[i].width) / 2) < 1e-7);
    assert.ok(end[i].width >= start[i].width);
  }
  // The source keeps orange above peach, and expanded accents above the neutral beds.
  assert.ok(end[7].z > end[8].z && end[8].z > end[9].z);
  for (const seconds of [0.6, 1.1, 3.2, 4, 12]) {
    assert.deepEqual(colorBarState(Math.ceil(seconds * 30) - 1, 30, seconds), end);
  }
});

test('color bar loop moves and returns to an identical rest frame at the seam and on backward seeks', () => {
  for (const seconds of [4, 8, 12.5, 32]) {
    const cycle = Math.round(seconds * 30);
    const rest = colorBarState(0, 30, seconds, true);
    assert.deepEqual(colorBarState(cycle - 1, 30, seconds, true), rest);
    assert.notDeepEqual(colorBarState(Math.round(cycle * 0.45), 30, seconds, true), rest);
    for (const frame of [0, 1, 29, Math.floor(cycle / 2), cycle - 1]) {
      const state = colorBarState(frame, 30, seconds, true);
      assert.deepEqual(colorBarState(frame + cycle, 30, seconds, true), state);
      assert.deepEqual(colorBarState(frame - cycle, 30, seconds, true), state);
    }
  }
});

test('color bar presets preserve edited segments and placement through save and export validation', () => {
  for (const kind of ['color-bar-reveal', 'color-bar-loop'] as const) {
    const asset = {id: kind, ...brandAssetDefaults[kind], barHeight: 28, barPosition: 'top' as const, barColors: ['#25E2A8', ...brandAssetDefaults[kind].barColors!.slice(1)], loopDuration: 12};
    const project = assetProject(asset, 1920);
    assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
    assert.equal(project.overlays[0].barColors?.[0], '#25E2A8');
    if (kind === 'color-bar-loop') assert.equal(project.duration, 12);
    for (const patch of [{barHeight: 0}, {barHeight: 145}, {barPosition: 'left'}, {barColors: ['#FF570A']}, {barColors: Array(10).fill('red')}]) {
      assert.equal(projectSchema.safeParse({...project, overlays: [{...project.overlays[0], ...patch}]}).success, false);
    }
  }
});
