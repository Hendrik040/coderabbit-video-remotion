import {motionCurves, revealMotion, revealTiming, unit} from './motion';
import type {Overlay, ProductView} from '../types';
import type {TriageViewId} from '../products/triage/source/TriageEditor';

export type ProductStep = {view: ProductView; layer: number; triageView?: TriageViewId; label: string; start: number; end: number};
export const triageViews: {id: TriageViewId; name: string}[] = [
  {id: 'requires-action-view', name: 'Requires Action'},
  {id: 'all-reviews-view', name: 'All PRs'},
  {id: 'project:Delivery Guard', name: 'Delivery Guard'},
  {id: 'close-candidates-view', name: 'Safe to close'},
];
export const productStepPatch = (step: ProductStep): Partial<Overlay> => step.triageView
  ? {triageView: step.triageView}
  : {productView: step.view, productLayer: step.layer};
const walkthrough = [
  {view: 'overview', layer: 0, label: 'Overview'},
  {view: 'layers', layer: 0, label: 'Data model'},
  {view: 'layers', layer: 1, label: 'API & emails'},
  {view: 'layers', layer: 2, label: 'Members UI'},
  {view: 'architecture', layer: 0, label: 'Architecture'},
  {view: 'security', layer: 0, label: 'Security'},
] satisfies Omit<ProductStep, 'start' | 'end'>[];

export function productTimeline(asset: Overlay, fps = 30): ProductStep[] {
  const total = Math.max(1, Math.ceil(asset.duration * fps));
  if (asset.kind === 'triage-board') {
    const views = asset.productAnimation === 'walkthrough' ? triageViews : [triageViews.find(view => view.id === asset.triageView) ?? triageViews[0]];
    return views.map((view, index) => ({view: 'overview', layer: 0, triageView: view.id, label: view.name,
      start: Math.floor(index * total / views.length), end: Math.floor((index + 1) * total / views.length)}));
  }
  if (asset.productAnimation !== 'walkthrough') return [{view: asset.productView ?? 'overview', layer: asset.productLayer ?? 1, label: 'Product scene', start: 0, end: total}];
  return walkthrough.map((step, index) => ({...step, start: Math.floor(index * total / walkthrough.length), end: Math.floor((index + 1) * total / walkthrough.length)}));
}

/** The only clock for product animation: no timers, CSS keyframes, or playback history. */
export function productFrameState(asset: Overlay, frame: number, fps = 30) {
  const steps = productTimeline(asset, fps);
  let index = 0;
  for (let i = 1; i < steps.length; i++) if (frame >= steps[i].start) index = i;
  const step = steps[index];
  const localFrame = Math.max(0, frame - step.start);
  const length = Math.max(1, step.end - step.start);
  const still = asset.productAnimation === 'still';
  const transitionFrames = Math.max(1, Math.min(fps * .2, length * .15));
  const blend = index === 0 || still ? 1 : motionCurves.reveal(localFrame / transitionFrames);
  const progress = still ? 1 : unit((localFrame / length - .08) / .55);
  return {step, index, previous: index > 0 && blend < 1 ? steps[index - 1] : undefined, localFrame, length, blend, progress,
    shell: still ? {opacity: 1, offset: 0} : revealMotion(frame, asset.duration, fps)};
}

/** Seek into the readable part of a step; selecting the UI never waits for an entrance. */
export function productEditFrame(asset: Overlay, fps = 30) {
  const steps = productTimeline(asset, fps);
  const step = steps.find(item => asset.kind === 'triage-board' ? item.triageView === (asset.triageView ?? 'requires-action-view') : item.view === (asset.productView ?? 'overview') && (item.view !== 'layers' || item.layer === (asset.productLayer ?? 1))) ?? steps[0];
  const {last, exit} = revealTiming(asset.duration, fps);
  return Math.max(0, Math.min(Math.floor(step.start + (step.end - step.start) * .72), Math.floor(last - exit)));
}

export const productBeat = (progress: number, start = 0, span = .25) => motionCurves.reveal(unit((progress - start) / span));
