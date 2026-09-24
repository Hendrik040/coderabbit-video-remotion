import assert from 'node:assert/strict';
import {test} from 'node:test';
import {brandMotion, cycleProgress, frameProgress, motionCurves, revealMotion, revealTiming, staggerFrames} from './motion';
import {availableBrandAssetKinds, assetProject, brandAssetDefaults} from './brandAssets';
import {assetCollections} from './looping';
import {projectSchema} from './schema';
import {groupLibraryKinds} from './assetLibrary';

test('foregrounds enter promptly, hold legibly, and return to their entrance edge with clear endpoints', () => {
  for (const fps of [24, 30, 60]) for (const duration of [0.1, 0.6, 1, 3.2, 12, 19]) {
    const last = Math.ceil(duration * fps) - 1;
    for (const stagger of [0, staggerFrames, 2 * staggerFrames]) {
      assert.equal(revealMotion(0, duration, fps, stagger).opacity, 0);
      assert.equal(revealMotion(last, duration, fps, stagger).opacity, 0);
      let peak = 0;
      let previousEnter = 0, previousLeave = 0;
      for (let frame = 0; frame <= last; frame++) {
        const state = revealMotion(frame, duration, fps, stagger);
        assert.ok(state.enter >= previousEnter && state.leave >= previousLeave, 'no reversal or bounce');
        assert.ok(state.opacity >= 0 && state.opacity <= 1);
        assert.ok(Number.isFinite(state.offset) && state.offset >= 0, 'entry and exit stay on the same edge');
        previousEnter = state.enter;
        previousLeave = state.leave;
        peak = Math.max(peak, state.opacity);
      }
      assert.ok(peak > 0, 'even short overlays remain visible');
      if (duration > 1) assert.equal(revealMotion(Math.floor(last / 2), duration, fps, stagger).opacity, 1);
    }
    assert.deepEqual(revealMotion(last, duration, fps), revealMotion(last + fps, duration, fps));
  }
  assert.ok(revealMotion(3, 4).enter > 0.6, 'foregrounds respond quickly at the first beat');
  assert.ok(revealMotion(3, 4, 30, staggerFrames).enter < revealMotion(3, 4).enter);
});

test('motion timing is shared by the phase strip and renderer and seeking has no history', () => {
  for (const duration of [0.6, 1, 4, 12]) {
    const timing = revealTiming(duration);
    if (duration <= 1) assert.equal(timing.hold, 0);
    assert.ok(Math.abs(timing.enter + timing.hold + timing.exit - timing.last) < 1e-8);
    assert.ok(Math.abs(timing.enter / timing.exit - brandMotion.enter / brandMotion.exit) < 1e-8);
    const before = revealMotion(7, duration);
    revealMotion(timing.last, duration);
    assert.deepEqual(revealMotion(7, duration), before);
    assert.equal(frameProgress(0, duration), 0);
    assert.equal(frameProgress(timing.last, duration), 1);
  }
  for (const fps of [24, 30, 60]) {
    assert.ok(Math.abs(revealMotion(0.2 * fps, 4, fps).enter - revealMotion(6, 4).enter) < 1e-8);
  }
});

test('motion curves do not overshoot and repeating phases are stable across backwards seeks', () => {
  for (const curve of Object.values(motionCurves)) {
    assert.equal(curve(-1), 0);
    assert.equal(curve(2), 1);
    assert.equal(curve(1 - Number.EPSILON), 1, 'phase roundoff cannot leave a faint final frame');
    let previous = 0;
    for (let step = 0; step <= 100; step++) {
      const value = curve(step / 100);
      assert.ok(value >= previous && value <= 1);
      previous = value;
    }
  }
  for (const duration of [4, 8, 12.5, 16]) for (const frame of [0, 1, 29, 70, 111]) {
    const cycle = Math.round(duration * 30);
    assert.equal(cycleProgress(frame, duration), cycleProgress(frame + cycle, duration));
    assert.equal(cycleProgress(frame, duration), cycleProgress(frame - cycle, duration));
  }
});

test('removed assets disappear from both pickers while existing projects remain readable', () => {
  assert.equal(availableBrandAssetKinds.length + 1, 11);
  assert.deepEqual(groupLibraryKinds(availableBrandAssetKinds).find(group => group.id === 'names')?.kinds, ['name-intro', 'name-intro-wipe']);
  assert.ok(assetCollections.linear.includes('name-intro-wipe'));
  for (const kind of ['logo-reveal', 'circle-wipe', 'signal-loop', 'type-reveal', 'brand-signoff'] as const) {
    assert.ok(!availableBrandAssetKinds.includes(kind));
    assert.ok(!assetCollections.linear.includes(kind));
    assert.ok(!assetCollections.looping.includes(kind));
    const oldProject = assetProject({id: kind, ...brandAssetDefaults[kind]});
    assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(oldProject))), oldProject);
  }
});
