import assert from 'node:assert/strict';
import {test} from 'node:test';
import {colorBarIntroState, colorBarIntroTiming, colorBarSegments, colorBarState, colorBarTransitionState} from './colorBar';
import {assetProject, brandAssetDefaults} from './brandAssets';
import {projectSchema} from './schema';
import {staggerFrames} from './motion';

test('hero reveal keeps the foreground colors moving through the final frame at every duration', () => {
  const start = colorBarState(0, 30, 4);
  const end = colorBarState(119, 30, 4);
  assert.deepEqual(end.map(s => s.start), start.map(s => s.start));
  assert.deepEqual(end.flatMap((s, i) => s.width > start[i].width ? [s.name] : []), ['Green', 'Bright green', 'Indigo', 'Orange', 'Peach']);
  // The source keeps orange above peach, and expanded accents above the neutral beds.
  assert.ok(end[7].z > end[8].z && end[8].z > end[9].z);
  for (const seconds of [0.1, 0.6, 1.1, 3.2, 4, 12]) {
    const last = Math.ceil(seconds * 30) - 1;
    assert.deepEqual(colorBarState(last, 30, seconds), end);
    let previous = start;
    for (let frame = 1; frame <= last; frame++) {
      const state = colorBarState(frame, 30, seconds);
      for (const i of [1, 2, 5, 7, 8]) assert.ok(state[i].width > previous[i].width, `${seconds}s frame ${frame}: ${state[i].name} must keep moving`);
      assert.deepEqual(state.map(s => s.start), start.map(s => s.start));
      previous = state;
    }
    // Even the quiet tail must move visibly, not just differ by floating-point noise.
    const tail = colorBarState(Math.floor(last * 0.8), 30, seconds);
    assert.ok((end[5].width - tail[5].width) * 1280 > 6);
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
  for (const kind of ['color-bar-reveal', 'color-bar-loop', 'color-bar-wipe', 'color-bar-transition'] as const) {
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

test('bottom bar reveals from the left, drifts while fully visible, then exits to the right', () => {
  const expanded = colorBarState(119, 30, 4);
  for (const seconds of [0.1, 0.6, 2, 4, 12]) {
    const last = Math.ceil(seconds * 30) - 1;
    const start = colorBarTransitionState(0, 30, seconds);
    const end = colorBarTransitionState(last, 30, seconds);
    assert.deepEqual([start.left, start.right], [0, 1]);
    assert.deepEqual([end.left, end.right], [1, 0]);
    const hold = colorBarTransitionState(Math.floor(last / 2), 30, seconds);
    assert.deepEqual([hold.left, hold.right], [0, 0]);
    assert.ok(hold.segments[5].width < expanded[5].width);
    assert.deepEqual(end.segments, expanded);
    let previous = start;
    for (let frame = 0; frame <= last; frame++) {
      const state = colorBarTransitionState(frame, 30, seconds);
      assert.ok(state.left >= previous.left && state.right <= previous.right);
      assert.ok(state.left + state.right <= 1);
      if (frame > 0) assert.ok(state.segments[5].width > previous.segments[5].width);
      previous = state;
    }
    const entrance = colorBarTransitionState(last * 0.16, 30, seconds);
    const exit = colorBarTransitionState(last * 0.84, 30, seconds);
    assert.equal(entrance.left, 0);
    assert.ok(Math.abs(entrance.right - 0.5) < 1e-7);
    assert.ok(Math.abs(exit.left - 0.5) < 1e-7);
    assert.equal(exit.right, 0);
    const settledIn = colorBarTransitionState(last * 0.32, 30, seconds);
    const beforeExit = colorBarTransitionState(last * 0.68, 30, seconds);
    assert.deepEqual([settledIn.left, settledIn.right, beforeExit.left, beforeExit.right], [0, 0, 0, 0]);
    assert.ok((beforeExit.segments[5].width - settledIn.segments[5].width) * 1280 > 10);
  }
});

test('color bar intros stagger the final panels while the palette travels as one continuous bar', () => {
  for (const fps of [24, 30, 60]) for (const duration of [0.1, 0.6, 2, 5, 12]) {
    const timing = colorBarIntroTiming(duration, fps);
    const nameAt = (frame: number) => colorBarIntroState(frame, fps, duration);
    const detailsAt = (frame: number) => colorBarIntroState(frame, fps, duration, staggerFrames);
    for (const at of [nameAt, detailsAt]) {
      const start = at(0), end = at(timing.last);
      assert.deepEqual([start.enter, start.leave, end.enter, end.leave], [0, 0, 1, 1]);
      assert.deepEqual([start.cardLeft, start.cardRight, end.cardLeft, end.cardRight], [0, 1, 1, 0]);
      let previous = start;
      for (let frame = 0; frame <= timing.last; frame++) {
        const state = at(frame), base = nameAt(frame);
        assert.ok(state.enter >= previous.enter && state.leave >= previous.leave, 'the outer wipe never reverses');
        assert.ok(state.enter >= state.leave, 'the wipe cannot turn inside out on short durations');
        assert.ok(state.cardLeft >= previous.cardLeft && state.cardRight <= previous.cardRight, 'each panel reveal and exit keeps moving forward');
        assert.ok(state.cardLeft + state.cardRight <= 1 + 1e-9);
        assert.ok(state.cardLeft >= state.leave && state.cardRight >= 1 - state.enter, 'the final panel stays within the outer sweep');
        assert.deepEqual([state.enter, state.leave, state.segments], [base.enter, base.leave, base.segments], 'staggering the panels never splits or offsets the palette');
        assert.deepEqual(state.segments.map(segment => segment.color), colorBarSegments.map(segment => segment.color));
        previous = state;
      }
      if (duration >= 5) {
        const hold = at(timing.enter);
        assert.deepEqual([hold.cardLeft, hold.cardRight], [0, 0], 'both panels are fully visible throughout the reading hold');
      }
      const middle = at(timing.enter * 0.7);
      at(timing.last);
      assert.deepEqual(at(timing.enter * 0.7), middle, 'seeking backwards reproduces the same colors');
      const fullPalette = at(timing.enter / 2);
      assert.deepEqual([fullPalette.enter, fullPalette.leave, fullPalette.cardLeft, fullPalette.cardRight], [1, 0, 0, 1], 'the whole palette appears before either selected fill');
      const exitPalette = at(timing.last - timing.exit / 2);
      assert.deepEqual([exitPalette.leave, exitPalette.cardLeft, exitPalette.cardRight], [0, 1, 0], 'both final panels withdraw before the palette clears');
    }
    const revealFrame = timing.enter * 0.75;
    const exitFrame = timing.last - timing.exit * 0.75;
    assert.ok(nameAt(revealFrame).cardRight < detailsAt(revealFrame).cardRight, 'the name reveals before the details');
    assert.ok(nameAt(exitFrame).cardLeft > detailsAt(exitFrame).cardLeft, 'the name exits before the details');
  }
  assert.ok(colorBarIntroTiming(5).hold / 30 > 2.8, 'the five-second intro keeps a readable hold');
});
