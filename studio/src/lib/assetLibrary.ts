import type {OverlayKind} from '../types';
import {productAssetKinds} from './productAssets';

// Group by the job an asset does. Playback type remains a separate filter.
const groups: {id: string; name: string; kinds: OverlayKind[]}[] = [
  {id: 'products', name: 'Products', kinds: productAssetKinds},
  {id: 'names', name: 'Name intros', kinds: ['name-intro', 'name-intro-wipe', 'presenter']},
  {id: 'transitions', name: 'Screen transitions', kinds: ['stack-wipe', 'color-bar-wipe', 'pixel-glow-wipe']},
  {id: 'bars', name: 'Color bars', kinds: ['color-bar-reveal', 'color-bar-transition', 'color-bar-loop']},
  {id: 'backgrounds', name: 'Backgrounds', kinds: ['hero']},
  {id: 'broadcast', name: 'Broadcast graphics', kinds: ['ident', 'headline', 'triage', 'stack', 'ticker', 'bug']},
  {id: 'explainers', name: 'Explainers', kinds: ['terminal', 'agentflow', 'code', 'diagram', 'callout']},
];

export function groupLibraryKinds<Kind extends OverlayKind>(available: readonly Kind[]) {
  return groups.map(group => ({
    id: group.id,
    name: group.name,
    kinds: available.filter(kind => group.kinds.includes(kind)),
  })).filter(group => group.kinds.length > 0);
}
