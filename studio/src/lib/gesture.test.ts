import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deriveCues, sampleAt, smoothSamples} from './gesture';
import type {Sample} from '../types';
const sample = (t: number, overrides: Partial<Sample> = {}): Sample => ({t, x: 0.5, y: 0.5, pinch: 1, confidence: 0.95, gesture: 'Open_Palm', visible: true, ...overrides});
test('a held gesture produces one cue, but release permits another', () => {
  const samples = Array.from({length: 30}, (_, i) => sample(i / 12, {gesture: i > 12 && i < 16 ? 'None' : 'Open_Palm'}));
  assert.equal(deriveCues(samples).filter(c => c.gesture === 'Open_Palm').length, 2);
});
test('short false detections and low confidence produce no cues', () => {
  assert.equal(deriveCues([sample(0), sample(0.08), sample(0.16, {gesture: 'None'})]).length, 0);
  assert.equal(deriveCues(Array.from({length: 12}, (_, i) => sample(i / 12, {confidence: 0.2}))).length, 0);
});
test('seeking interpolates the same position regardless of playback history', () => {
  const samples = [sample(0, {x: 0}), sample(1, {x: 1})];
  assert.equal(sampleAt(samples, 0.25)?.x, 0.25);
  assert.equal(sampleAt(samples, 0.75)?.x, 0.75);
  assert.equal(sampleAt(samples, 0.25)?.x, 0.25);
  assert.equal(sampleAt(samples, 2)?.visible, false);
});
test('occluded hands do not create a sweep or jump to the origin', () => {
  const samples = [sample(0), sample(0.1, {visible: false, x: 0})];
  assert.equal(smoothSamples(samples)[1].x, 0.5);
  assert.equal(deriveCues(samples).length, 0);
});
test('a sweep needs uninterrupted visible motion', () => {
  const samples = Array.from({length: 8}, (_, i) => sample(i / 12, {x: i * 0.08, gesture: 'None'}));
  assert.equal(deriveCues(samples).filter(c => c.gesture === 'Swipe').length, 1);
  const occluded = samples.map((s, i) => ({...s, visible: i !== 3}));
  assert.equal(deriveCues(occluded).filter(c => c.gesture === 'Swipe').length, 0);
});
