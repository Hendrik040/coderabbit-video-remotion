import React, {memo, useCallback, useMemo, useRef, type CSSProperties} from 'react';
import './change-stack/utilities.generated.css';
import TriageScreen, {type TriageScreenState} from './triage/source/TriageScreen';
import {TriageEditor, TriageMotion, TriagePortal, type TriageUi, type TriageCardCopy, type TriageViewId} from './triage/source/TriageEditor';
import {productFrameState} from '../lib/productMotion';
import {triageBoardFor, triageColumnCardLimits} from '../lib/triageAssets';
import type {Overlay, ProductEditHandler} from '../types';
import './triage/frame.css';

const ProductScreen = memo(TriageScreen);

/** The imported board renders only when its saved data changes; cards read the frame separately. */
export function Triage({overlay, frame, fps, onEdit, reduceMotion = false}: {overlay: Overlay; frame: number; fps: number; onEdit?: ProductEditHandler; reduceMotion?: boolean}) {
  const motion = productFrameState(overlay, frame, fps);
  const portal = useRef<HTMLDivElement>(null);
  const view = motion.step.triageView ?? 'requires-action-view';
  const board = useMemo(() => triageBoardFor(overlay), [overlay.triageCards]);
  const ui = useRef(overlay.triageUi);
  ui.current = overlay.triageUi;
  const onUiChange = useCallback((patch: Partial<TriageUi>) => {
    ui.current = {...ui.current, ...patch};
    onEdit?.(overlay.id, {triageUi: ui.current, triageView: view});
  }, [overlay.id, onEdit, view]);
  const onCardChange = useCallback((id: string, patch: Partial<TriageCardCopy>) => onEdit?.(overlay.id, {
    triageCards: {...overlay.triageCards, [id]: {...overlay.triageCards?.[id], ...patch}}, triageView: view,
  }), [onEdit, overlay.id, overlay.triageCards, view]);
  const editor = useMemo(() => ({ui: overlay.triageUi, onUiChange: onEdit ? onUiChange : undefined, onCardChange: onEdit ? onCardChange : undefined}), [overlay.triageUi, onEdit, onUiChange, onCardChange]);
  const state = useMemo(() => ({selectedViewId: view, openPanel: overlay.triageUi?.openPanel ?? null, openReviewerCardId: overlay.triageUi?.openReviewerCardId ?? null}), [view, overlay.triageUi?.openPanel, overlay.triageUi?.openReviewerCardId]);
  const onStateChange = useCallback((next: TriageScreenState) => {
    const changedView = next.selectedViewId !== view;
    ui.current = {...ui.current, openPanel: changedView ? null : next.openPanel, openReviewerCardId: changedView ? null : next.openReviewerCardId};
    onEdit?.(overlay.id, {triageView: next.selectedViewId as TriageViewId, triageUi: ui.current});
  }, [onEdit, overlay.id, view]);
  const still = reduceMotion || overlay.productAnimation === 'still';
  const motionValue = useMemo(() => ({frame: motion.localFrame, clockFrame: still ? 0 : frame, fps, animate: !still}), [motion.localFrame, frame, fps, still]);
  return <div ref={portal} className="product-source triage-source" data-theme="dark" data-interactive={Boolean(onEdit)} data-reviewer-layout="stacked" aria-label="Triage product scene" style={{
    position: 'absolute', inset: 32, fontFamily: 'Geist, sans-serif', fontSize: 16, lineHeight: 1.5,
    opacity: still ? 1 : motion.shell.opacity,
    transform: `translateY(${still ? 0 : motion.shell.offset * .5}px) scale(${overlay.scale})`, transformOrigin: 'center',
    isolation: 'isolate', containerType: 'inline-size',
  } as CSSProperties}>
    <TriagePortal.Provider value={portal}><TriageEditor.Provider value={editor}><TriageMotion.Provider value={motionValue}>
      <ProductScreen board={board} cardLayout="product" cardEntrance columnCardLimits={triageColumnCardLimits}
        state={state} onStateChange={onStateChange} interactive chrome={false} containReviewerPopovers noBlur className="triage-product-screen"/>
    </TriageMotion.Provider></TriageEditor.Provider></TriagePortal.Provider>
  </div>;
}
