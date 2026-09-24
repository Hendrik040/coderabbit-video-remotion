import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assetProject, appendBrandAsset} from './brandAssets';
import {productAssetDefaults, isProductAsset} from './productAssets';
import {productEditFrame, productFrameState, productTimeline, productStepPatch, triageViews} from './productMotion';
import {triageBoardFor, triagePreviewCards} from './triageAssets';
import {projectSchema} from './schema';
import {demoProject} from './demo';
import {triageProductBoard} from '../products/triage/source/triageProductBoardData';
import originalPayload from '../products/triage/source/triageProductMockPayload.json';
import motionPayload from '../products/triage/source/triageProductMockPayload.motion.json';
import type {Overlay} from '../types';

const asset: Overlay = {id: 'triage', ...productAssetDefaults['triage-board']};

test('Triage imports the real complete fixture and remains distinct from the broadcast graphic', () => {
  assert.equal(isProductAsset('triage'), false);
  assert.equal(isProductAsset('triage-board'), true);
  assert.equal(triageProductBoard.cards.length, originalPayload.length);
  assert.equal(originalPayload.length, 1049);
  assert.deepEqual(triageProductBoard.viewGroups.flatMap(group => group.views.map(view => view.count)), ['80', '1,049', '8', '32']);
  assert.equal(triageProductBoard.focusNowCapacity, 14);
  assert.equal(triagePreviewCards(asset)[0].id, '20000000-0000-4000-8000-000000026102');
  for (let index = 0; index < motionPayload.length; index++) {
    const original = originalPayload[index];
    const optimized = motionPayload[index];
    assert.equal(optimized.id, original.id);
    assert.deepEqual(optimized.priority, original.priority);
    assert.equal(optimized.title, original.title);
    assert.equal(optimized.nextAction.kind, original.nextAction.kind);
  }
});

test('Triage card edits, layout and reviewer state survive presets and composition insertion', () => {
  const id = triagePreviewCards(asset)[0].id;
  const edited: Overlay = {...asset, productAnimation: 'still', triageCards: {[id]: {title: 'Prioritize the review queue', reason: 'Review the original product mock.', repository: 'example/app'}},
    triageUi: {boardLayout: 'list', openPanel: null, openReviewerCardId: id, reviewerQuery: 'Casey', collapsedColumnIds: ['focus-next'], viewGroupings: {'requires-action-view': 'Focus'}, following: false, digestPreferences: {frequency: 'once', firstTime: '10:00', secondTime: '17:00'}}};
  const saved = projectSchema.parse(JSON.parse(JSON.stringify(assetProject(edited))));
  assert.deepEqual(saved.overlays[0], edited);
  assert.equal(saved.name, 'CodeRabbit PR-02 Triage');
  const board = triageBoardFor(edited);
  assert.equal(board.cards.find(card => card.id === id)?.title, 'Prioritize the review queue');
  assert.notEqual(triageProductBoard.cards.find(card => card.id === id)?.title, 'Prioritize the review queue');
  const composition = projectSchema.parse(appendBrandAsset(demoProject('walkthrough'), edited, 'new-triage'));
  assert.deepEqual(composition.overlays.at(-1)?.triageCards, edited.triageCards);
  assert.deepEqual(composition.overlays.at(-1)?.triageUi, edited.triageUi);
});

test('Triage rejects unsupported UI states and oversized edited cards', () => {
  const project = assetProject(asset);
  for (const patch of [{triageView: 'unknown'}, {triageUi: {boardLayout: 'unknown'}}, {triageUi: {viewGroupings: {unknown: 'Focus'}}}, {triageUi: {digestPreferences: {frequency: 'daily', firstTime: '27:00', secondTime: '17:00'}}}, {triageCards: {card: {title: 'x'.repeat(151)}}}, {triageCards: {card: {reason: 'x'.repeat(601)}}}]) {
    assert.equal(projectSchema.safeParse({...project, overlays: [{...asset, ...patch}]}).success, false);
  }
});

test('Triage walkthrough and direct seeking resolve the same original view independently of playback history', () => {
  const timeline = productTimeline(asset);
  assert.equal(timeline[0].start, 0);
  assert.equal(timeline.at(-1)!.end, 480);
  assert.deepEqual(timeline.map(step => step.triageView), triageViews.map(view => view.id));
  for (const step of [...timeline].reverse()) {
    const selected = {...asset, ...productStepPatch(step)};
    const frame = productEditFrame(selected);
    const result = productFrameState(asset, frame);
    productFrameState(asset, 479);
    assert.deepEqual(productFrameState(asset, frame), result);
    assert.equal(result.step.triageView, step.triageView);
    assert.equal(result.shell.opacity, 1);
    assert.ok(triagePreviewCards(selected).length > 0);
    for (const frame of [0, 200, 479]) {
      const still = productFrameState({...selected, productAnimation: 'still'}, frame);
      assert.equal(still.step.triageView, step.triageView);
      assert.deepEqual(still.shell, {opacity: 1, offset: 0});
    }
  }
});
