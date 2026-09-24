import {assetType} from './assetType';
import type {BroadcastKind, Overlay, OverlayKind, Project} from '../types';

// Stable template names and content contracts are shared by the library and inspector.
export const broadcastTemplates = {
  ident: {code: 'CR-01', name: 'Station ident', description: 'Open or close the show.', title: 'Show name', body: 'Tagline', titleMax: 40, bodyMax: 90, kicker: 'Edition'},
  presenter: {code: 'CR-02', name: 'Presenter strap', description: 'Introduce a person, clearly.', title: 'Presenter name', body: 'Role / organization', titleMax: 44, bodyMax: 70, kicker: 'Segment label'},
  headline: {code: 'CR-03', name: 'Segment title', description: 'Give the next story its moment.', title: 'Headline', body: 'Supporting line', titleMax: 75, bodyMax: 120, kicker: 'Segment label'},
  triage: {code: 'CR-04', name: 'Triage board', description: 'A clear Now / Next review queue.', title: 'Headline', body: 'Now / Next items, one per line', titleMax: 56, bodyMax: 160, kicker: 'Segment label'},
  stack: {code: 'CR-05', name: 'Change Stack', description: 'A story in three review layers.', title: 'Headline', body: 'Three layers, one per line', titleMax: 56, bodyMax: 160, kicker: 'Segment label'},
  ticker: {code: 'CR-06', name: 'Desk ticker', description: 'A steady, readable information rail.', title: 'Rail label', body: 'Ticker items, one per line', titleMax: 20, bodyMax: 240, kicker: 'Edition'},
  bug: {code: 'CR-07', name: 'Station bug', description: 'A quiet corner signature.', title: 'Desk label', body: 'Edition / episode', titleMax: 22, bodyMax: 26, kicker: 'Segment label'},
} as const;
export const broadcastKinds = Object.keys(broadcastTemplates) as BroadcastKind[];
export const isBroadcast = (kind: OverlayKind): kind is BroadcastKind => kind in broadcastTemplates;

const base = {enabled: true, start: 0, duration: 5, binding: 'cue', placement: 'left', accent: '#FF570A', scale: 1} as const;
export const broadcastDefaults: Record<BroadcastKind, Omit<Overlay, 'id'>> = {
  ident: {...base, kind: 'ident', title: 'The Review Desk', body: 'Better context. Better code.', kicker: 'DEVELOPER BROADCAST'},
  presenter: {...base, kind: 'presenter', title: 'Presenter name', body: 'Role / organization', kicker: 'AT THE DESK'},
  headline: {...base, kind: 'headline', title: 'The context behind better code.', body: 'A closer look at the work behind every review.', kicker: 'IN FOCUS / 01'},
  triage: {...base, kind: 'triage', title: 'Know what needs your review.', body: 'Resolve authentication risk\nReview the dashboard update', kicker: 'PRODUCT FOCUS / TRIAGE'},
  stack: {...base, kind: 'stack', title: 'See the story in every change.', body: 'Understand the intent\nTrace the implementation\nReview with context', kicker: 'PRODUCT FOCUS / CHANGE STACK'},
  ticker: {...base, kind: 'ticker', title: 'ON THE DESK', body: 'Triage: prioritize your review queue\nChange Stack: review changes in context', kicker: 'THIS EDITION'},
  bug: {...base, kind: 'bug', title: 'REVIEW DESK', body: 'EDITION 001', kicker: ''},
};

export function broadcastProject(): Project {
  const cue = (kind: BroadcastKind, start: number, duration: number): Overlay => ({...broadcastDefaults[kind], id: kind, start, duration});
  return {name: 'The Review Desk · broadcast rundown', mediaUrl: null, mediaName: 'Broadcast sample slate', duration: 22, fps: 30, width: 1280, height: 720, samples: [], cues: [], sampleMode: true, showTracking: false, mute: false, broadcast: true,
    overlays: [cue('ident', 0, 3), cue('headline', 3, 3.8), cue('presenter', 6.8, 4.2), {...cue('ticker', 6.8, 4.2), body: 'This edition: Triage and Change Stack'}, cue('triage', 11, 5), cue('stack', 16, 6), cue('bug', 3, 19)]};
}

export function retimeOverlays(overlays: Overlay[], oldDuration: number, newDuration: number): Overlay[] {
  return overlays.map(o => {
    const start = Math.max(0, Math.min(newDuration - 0.1, o.start));
    const fullLengthLoop = assetType(o.kind) === 'looping' && o.start === 0 && Math.abs(o.duration - oldDuration) < 0.1;
    const duration = Math.max(0.1, Math.min(newDuration - start, fullLengthLoop ? newDuration : o.duration));
    return {...o, start, duration};
  });
}

export {revealMotion as broadcastMotion} from './motion';
