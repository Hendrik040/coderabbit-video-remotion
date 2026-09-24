import assert from 'node:assert/strict';
import {test} from 'node:test';
import {videoMetadata} from './media.mjs';

test('the server validates video tracks and uses video duration rather than padded audio', () => {
  const video = {codec_type: 'video', width: 1920, height: 1080, duration: '3600'};
  assert.deepEqual(videoMetadata({streams: [video, {codec_type: 'audio'}], format: {duration: '3600.05'}}), {duration: 3600, width: 1920, height: 1080, hasAudio: true});
  assert.equal(videoMetadata({streams: [{...video, duration: undefined}], format: {duration: '90'}}).duration, 90);
  assert.equal(videoMetadata({streams: [{...video, duration: undefined}], format: {duration: '3600.008'}}).duration, 3600);
  for (const duration of ['0', '3601', 'Infinity', 'NaN']) assert.throws(() => videoMetadata({streams: [{...video, duration}], format: {duration}}));
  assert.throws(() => videoMetadata({streams: [{codec_type: 'audio'}]}));
  assert.throws(() => videoMetadata({streams: [{...video, disposition: {attached_pic: 1}}]}));
});
