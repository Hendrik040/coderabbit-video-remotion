import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateVideoDuration, validateVideoFile} from './media';
import {MAX_PROJECT_BYTES, MAX_TRACKING_SAMPLES, MAX_UPLOAD_BYTES, TRACKING_FPS} from './limits';
import {projectSchema} from './schema';
import {demoProject, overlayDefaults} from './demo';
import {retimeOverlays} from './broadcast';
import {parseTimecode} from './timecode';

test('imports accept one hour and 4 GB, rejecting invalid or oversized media', () => {
  assert.equal(validateVideoDuration(3600), 3600);
  assert.equal(validateVideoDuration(3600.02), 3600, 'encoder padding is clamped to the one-hour timeline');
  for (const value of [0, -1, 3600.1, Infinity, NaN]) assert.throws(() => validateVideoDuration(value));
  assert.doesNotThrow(() => validateVideoFile({name: 'recording.MP4', size: MAX_UPLOAD_BYTES}));
  for (const file of [{name: 'a.mp4', size: 0}, {name: 'a.mp4', size: MAX_UPLOAD_BYTES + 1}, {name: 'a.txt', size: 12}]) assert.throws(() => validateVideoFile(file));
});

test('an hour of tracking and late-timeline layers round-trip below the project size limit', () => {
  const sample = {x: 0.3456789012345678, y: 0.567890123456789, pinch: 0.1234567890123456, confidence: 0.9876543210987654, gesture: 'Open_Palm' as const, visible: true};
  const project = {...demoProject(), duration: 3600,
    samples: Array.from({length: 3600 * TRACKING_FPS}, (_, i) => ({...sample, t: i / TRACKING_FPS})),
    cues: Array.from({length: 6000}, (_, i) => ({id: `cue-${i}`, time: i * 0.6, gesture: 'Open_Palm' as const})),
    overlays: [{...overlayDefaults['name-intro'], id: 'late-intro', start: 3595, duration: 5}],
  };
  const json = JSON.stringify(project, null, 2);
  assert.ok(Buffer.byteLength(json) > 5 * 1024 ** 2, 'fixture exceeds the former browser storage quota');
  assert.ok(Buffer.byteLength(json) < MAX_PROJECT_BYTES);
  assert.deepEqual(projectSchema.parse(JSON.parse(json)), project);
  assert.equal(projectSchema.safeParse({...project, duration: 3600.1}).success, false);
  assert.equal(projectSchema.safeParse({...project, samples: Array(MAX_TRACKING_SAMPLES + 1).fill({...sample, t: 0})}).success, false);
  assert.equal(projectSchema.safeParse({...project, duration: 60, overlays: []}).success, false);
});

test('long footage preserves authored timing and extends full-length background loops', () => {
  const intro = {...overlayDefaults['name-intro'], id: 'intro', start: 3, duration: 5};
  const loop = {...overlayDefaults.hero, id: 'loop', start: 0, duration: 12};
  const part = {...loop, id: 'partial-loop', start: 5, duration: 4};
  const [newIntro, newLoop, newPart] = retimeOverlays([intro, loop, part], 12, 3600);
  assert.deepEqual(newIntro, intro);
  assert.equal(newLoop.duration, 3600);
  assert.deepEqual(newPart, part);
  for (const duration of [0.1, 1, 6, 60, 3600]) {
    const overlays = retimeOverlays([intro, loop, part], 12, duration);
    assert.ok(overlays.every(o => o.start >= 0 && o.duration >= 0.099 && o.start + o.duration <= duration + 0.001));
  }
});

test('direct seek accepts seconds, minutes, or hours and rejects malformed times', () => {
  for (const [value, seconds] of [['90', 90], ['59:59.9', 3599.9], ['1:00:00', 3600], [' 04:05 ', 245]] as const) assert.equal(parseTimecode(value), seconds);
  for (const value of ['', '-1', 'abc', '1:60', '1:10:60', '1:2:3:4']) assert.equal(parseTimecode(value), null);
});
