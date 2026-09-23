import assert from 'node:assert/strict';
import {test} from 'node:test';
import {demoProject, overlayDefaults} from './demo';
import {projectSchema} from './schema';
import {terminalDuration} from '../../../src/brand/TerminalWindow';

test('all presets round-trip through the saved-project schema', () => {
  for (const preset of ['broadcast', 'walkthrough', 'technical', 'loop'] as const) {
    const project = demoProject(preset);
    assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(project))), project);
  }
});

test('every overlay kind is accepted in a project', () => {
  for (const overlay of Object.values(overlayDefaults)) {
    const project = {...demoProject(), overlays: [{...overlay, id: overlay.kind}]};
    assert.deepEqual(projectSchema.parse(project), project);
  }
});

test('projects reject remote footage, duplicate layer IDs, and layers outside the timeline', () => {
  const project = demoProject('walkthrough');
  assert.equal(projectSchema.safeParse({...project, mediaUrl: 'https://example.com/video.mp4'}).success, false);
  assert.equal(projectSchema.safeParse({...project, overlays: [project.overlays[0], project.overlays[0]]}).success, false);
  assert.equal(projectSchema.safeParse({...project, overlays: [{...project.overlays[0], start: 11, duration: 4}]}).success, false);
});

test('terminal progress covers every command, including an empty terminal', () => {
  assert.equal(terminalDuration([]), 19);
  assert.equal(terminalDuration([{input: 'abc', holdFrames: 8}]), 41);
  assert.equal(terminalDuration([{input: 'abc', holdFrames: 8}, {input: 'abcd', holdFrames: 8}]), 65);
});
