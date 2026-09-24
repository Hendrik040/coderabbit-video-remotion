import assert from 'node:assert/strict';
import {test} from 'node:test';
import {appendBrandAsset, assetProject} from './brandAssets';
import {productAssetDefaults, productViews} from './productAssets';
import {projectSchema} from './schema';
import {demoProject} from './demo';
import {productEditFrame, productFrameState, productTimeline} from './productMotion';
import {changeStackLayers, productLayerId, productSelection} from './productAssets';

test('product views and focused layers survive presets, export validation, and composition insertion', () => {
  for (const view of productViews) for (const productLayer of [0, 1, 2]) for (const width of [1280, 1920]) {
    const asset = {id: 'product', ...productAssetDefaults['change-stack'], productView: view.id, productLayer,
      title: 'Invite your team', body: 'An invitation workflow for the team.', productRepository: 'example/app', productPr: '#72',
      productOverviewTitle: 'Invitations', productHideContext: true,
      productUi: {openSummaryIds: ['schema-summary'], overviewOpenIds: ['Summary'], activityExpanded: false, activityCategories: ['coderabbit' as const]}};
    const saved = projectSchema.parse(JSON.parse(JSON.stringify(assetProject(asset, width))));
    assert.deepEqual(saved.overlays[0], asset);
    assert.equal(saved.name, 'CodeRabbit PR-01 Change Stack');
    assert.equal(saved.width, width);
    const original = demoProject('walkthrough');
    const composition = projectSchema.parse(appendBrandAsset(original, asset, 'new-product'));
    assert.deepEqual(composition.overlays.slice(0, -1), original.overlays);
    assert.deepEqual(composition.overlays.at(-1), {...asset, id: 'new-product', duration: Math.min(asset.duration, original.duration)});
  }
});

test('imported product presets reject unsupported views, layers, and oversized copy', () => {
  const project = assetProject({id: 'product', ...productAssetDefaults['change-stack']});
  for (const patch of [{productView: 'unknown'}, {productLayer: -1}, {productLayer: 3}, {productLayer: 1.5}, {productAnimation: 'css'}, {productRepository: 'x'.repeat(61)}, {productPr: 'x'.repeat(21)}, {productOverviewTitle: 'x'.repeat(91)}, {productUi: {activityCategories: ['unknown']}}, {title: 'x'.repeat(91)}, {body: 'x'.repeat(1001)}]) {
    assert.equal(projectSchema.safeParse({...project, overlays: [{...project.overlays[0], ...patch}]}).success, false);
  }
  const {productView, productLayer, productRepository, ...minimal} = project.overlays[0];
  assert.equal(projectSchema.safeParse({...project, overlays: [minimal]}).success, true, 'Missing optional settings use renderer defaults');
});

test('walkthrough seeking selects the original website layers and is independent of playback history', () => {
  const asset = {id: 'product', ...productAssetDefaults['change-stack']};
  assert.deepEqual(changeStackLayers.map(layer => layer.id), ['schemas', 'storage', 'artifact-builder']);
  const timeline = productTimeline(asset);
  assert.equal(timeline[0].start, 0);
  assert.equal(timeline.at(-1)!.end, 540);
  const ids = timeline.map(step => productLayerId(step.view, step.layer));
  assert.deepEqual(ids, ['overview', 'schemas', 'storage', 'artifact-builder', 'architecture-impact', 'blast-radius']);
  for (const id of ids.reverse()) {
    const selection = productSelection(id);
    const frame = productEditFrame({...asset, ...selection});
    const expected = productFrameState(asset, frame);
    productFrameState(asset, 539);
    productFrameState(asset, 0);
    assert.deepEqual(productFrameState(asset, frame), expected);
    assert.equal(productLayerId(expected.step.view, expected.step.layer), id);
    assert.equal(expected.blend, 1);
    assert.equal(expected.progress, 1);
    assert.equal(expected.shell.opacity, 1);
  }
});

test('still scenes remain fully visible at every frame; short animated scenes stay finite', () => {
  for (const duration of [.1, .6, 1, 18, 30]) {
    const asset = {id: 'product', ...productAssetDefaults['change-stack'], duration};
    for (let frame = 0; frame < duration * 30; frame++) {
      const animated = productFrameState(asset, frame);
      for (const value of [animated.blend, animated.progress, animated.shell.opacity]) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
      const still = productFrameState({...asset, productAnimation: 'still', productView: 'security'}, frame);
      assert.equal(still.step.view, 'security');
      assert.equal(still.progress, 1);
      assert.deepEqual(still.shell, {opacity: 1, offset: 0});
    }
  }
});
