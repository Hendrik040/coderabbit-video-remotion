import assert from 'node:assert/strict';
import {test} from 'node:test';
import {broadcastDefaults, broadcastKinds, broadcastMotion, broadcastProject, broadcastTemplates, retimeOverlays} from './broadcast';
import {projectSchema} from './schema';

test('broadcast motion clears both ends, including short clips and staggered text', () => {
  for (const duration of [0.1, 0.4, 1, 3.8, 6, 19]) {
    const last = Math.ceil(duration * 30) - 1;
    for (const delay of [0, 3, 6]) {
      assert.equal(broadcastMotion(0, duration, 30, delay).opacity, 0);
      assert.equal(broadcastMotion(last, duration, 30, delay).opacity, 0);
      let visible = false;
      for (let frame = 0; frame <= last; frame++) {
        const m = broadcastMotion(frame, duration, 30, delay);
        assert.ok(Number.isFinite(m.offset) && m.opacity >= 0 && m.opacity <= 1);
        visible ||= m.opacity > 0;
      }
      assert.ok(visible, 'short clips still contain visible content');
    }
  }
});

test('normal clips hold fully opaque and seeking produces the same motion', () => {
  assert.equal(broadcastMotion(18, 5, 30, 6).opacity, 1);
  assert.equal(broadcastMotion(100, 5, 30, 6).opacity, 1);
  const middle = broadcastMotion(10, 5);
  broadcastMotion(149, 5);
  assert.deepEqual(broadcastMotion(10, 5), middle);
});

test('all templates preserve names and edition fields and reject overlong imported copy', () => {
  for (const kind of broadcastKinds) {
    const project = {...broadcastProject(), overlays: [{...broadcastDefaults[kind], id: kind, kicker: 'EDITION 002'}]};
    assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
    const layer = project.overlays[0];
    assert.equal(projectSchema.safeParse({...project, overlays: [{...layer, title: 'x'.repeat(broadcastTemplates[kind].titleMax + 1)}]}).success, false);
  }
});

test('importing different-length footage preserves the broadcast rundown overlaps', () => {
  const project = broadcastProject();
  for (const duration of [0.1, 11, 22, 60]) {
    const overlays = retimeOverlays(project.overlays, project.duration, duration);
    assert.equal(projectSchema.safeParse({...project, duration, overlays}).success, true);
    const strap = overlays.find(o => o.kind === 'presenter')!;
    const ticker = overlays.find(o => o.kind === 'ticker')!;
    const bug = overlays.find(o => o.kind === 'bug')!;
    assert.equal(strap.start, ticker.start);
    assert.equal(strap.duration, ticker.duration);
    assert.ok(bug.start <= strap.start && bug.start + bug.duration >= strap.start + strap.duration - 0.001);
  }
});
