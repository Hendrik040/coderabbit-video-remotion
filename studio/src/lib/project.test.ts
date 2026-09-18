import assert from 'node:assert/strict';
import {test} from 'node:test';
import {demoProject, overlayDefaults} from './demo';
import {projectSchema} from './schema';
import {terminalDuration} from '../../../src/brand/TerminalWindow';

test('both presets round-trip through the saved-project schema', () => {
  for (const preset of ['walkthrough', 'technical'] as const) {
    const project = demoProject(preset);
    assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
  }
});

test('shared brand components are accepted alongside all three original overlay kinds', () => {
  const project = demoProject();
  project.overlays = Object.values(overlayDefaults).map(o => ({...o, id: o.kind}));
  assert.equal(projectSchema.parse(project).overlays.length, 5);
});

test('projects reject remote footage, duplicate layer IDs, and layers outside the timeline', () => {
  const project = demoProject();
  assert.equal(projectSchema.safeParse({...project, mediaUrl: 'https://example.com/video.mp4'}).success, false);
  assert.equal(projectSchema.safeParse({...project, overlays: [project.overlays[0], project.overlays[0]]}).success, false);
  assert.equal(projectSchema.safeParse({...project, overlays: [{...project.overlays[0], start: 11, duration: 4}]}).success, false);
});

test('terminal progress covers every command, including an empty terminal', () => {
  assert.equal(terminalDuration([]), 19);
  assert.equal(terminalDuration([{input: 'abc', holdFrames: 8}]), 41);
  assert.equal(terminalDuration([{input: 'abc', holdFrames: 8}, {input: 'abcd', holdFrames: 8}]), 65);
});
