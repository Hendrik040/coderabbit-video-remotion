import React, {memo, useMemo, type CSSProperties} from 'react';
import './change-stack/utilities.generated.css';
import ReviewStackScreen, {createDefaultReviewStackScreenState} from './change-stack/source/ReviewStackScreen';
import {ReviewStackEditor, defaultReviewStackUi, type ReviewStackCopy} from './change-stack/source/ReviewStackEditor';
import styles from './change-stack/source/HomeHero.motion.module.css';
import {productBeat, productFrameState} from '../lib/productMotion';
import {productLayerId, productSelection} from '../lib/productAssets';
import type {Overlay, ProductEditHandler} from '../types';
import './change-stack/frame.css';

const ProductScreen = memo(ReviewStackScreen);

/** All animation is frame-derived. The original UI only rerenders when its state or copy changes. */
export function ChangeStack({overlay, frame, fps, onEdit, reduceMotion = false}: {overlay: Overlay; frame: number; fps: number; onEdit?: ProductEditHandler; reduceMotion?: boolean}) {
  const motion = productFrameState(overlay, frame, fps);
  const activeLayerId = productLayerId(motion.step.view, motion.step.layer);
  const state = useMemo(() => ({...createDefaultReviewStackScreenState(activeLayerId), openSummaryIds: overlay.productUi?.openSummaryIds ?? createDefaultReviewStackScreenState().openSummaryIds}), [activeLayerId, overlay.productUi?.openSummaryIds]);
  const editor = useMemo(() => ({
    copy: {title: overlay.title, repo: overlay.productRepository, pr: overlay.productPr, overviewTitle: overlay.productOverviewTitle, summary: overlay.body},
    ui: {...defaultReviewStackUi, ...overlay.productUi},
    onCopyChange: onEdit ? (patch: Partial<ReviewStackCopy>) => onEdit(overlay.id, {
      ...(patch.title !== undefined && {title: patch.title}), ...(patch.summary !== undefined && {body: patch.summary}),
      ...(patch.repo !== undefined && {productRepository: patch.repo}), ...(patch.pr !== undefined && {productPr: patch.pr}),
      ...(patch.overviewTitle !== undefined && {productOverviewTitle: patch.overviewTitle}),
    }) : undefined,
    onUiChange: onEdit ? (patch: Partial<typeof defaultReviewStackUi>) => onEdit(overlay.id, {productUi: {...overlay.productUi, ...patch}}) : undefined,
  }), [overlay.id, overlay.title, overlay.body, overlay.productRepository, overlay.productPr, overlay.productOverviewTitle, overlay.productUi, onEdit]);
  const onStateChange = useMemo(() => onEdit ? (next: typeof state) => onEdit(overlay.id, {
    ...productSelection(next.activeLayerId), productUi: {...overlay.productUi, openSummaryIds: next.openSummaryIds},
  }) : undefined, [onEdit, overlay.id, overlay.productUi]);
  const still = reduceMotion || overlay.productAnimation === 'still';
  const progress = still ? 1 : motion.progress;
  const frameStyle = {
    position: 'absolute', inset: 32, fontFamily: 'Geist, sans-serif', fontSize: 16, lineHeight: 1.5,
    opacity: still ? 1 : motion.shell.opacity,
    transform: `translateY(${still ? 0 : motion.shell.offset * .5}px) scale(${overlay.scale})`,
    transformOrigin: 'center', isolation: 'isolate',
    '--product-panel-opacity': still ? 1 : motion.blend,
    '--product-panel-y': `${still ? 0 : 6 * (1 - motion.blend)}px`,
    ...Object.fromEntries([0, 1, 2, 3].map(index => [`--product-node-${index}`, productBeat(progress, index * .11, .4)])),
  } as CSSProperties;
  return <div className={`product-source change-stack-source ${styles.heroRoot}`} data-theme="dark" data-interactive={Boolean(onEdit)} aria-label="Change Stack product scene" style={frameStyle}>
    <ReviewStackEditor.Provider value={editor}>
      <ProductScreen state={state} onStateChange={onStateChange} hideRightPanel={overlay.productHideContext} removeTopLeftLighting showLayerHoverCards={Boolean(onEdit)} />
    </ReviewStackEditor.Provider>
  </div>;
}
