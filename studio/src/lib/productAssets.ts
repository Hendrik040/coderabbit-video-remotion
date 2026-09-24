import type {Overlay, OverlayKind, ProductAssetKind, ProductView} from '../types';
import mock from '../products/change-stack/source/reviewStackMockData.json';
import {overviewReview} from '../products/change-stack/source/reviewStackOverviewData';

export const productAssetTemplates = {
  'change-stack': {
    code: 'PR-01', name: 'Change Stack', family: 'Products', duration: 18, alpha: true,
    title: 'Pull request title', body: 'Summary', titleMax: 90, bodyMax: 1000,
    description: 'Explore the change, its layers, and its impact. Edit the product UI directly on the canvas.',
    usage: 'Play a walkthrough or focus on one view. Click the preview to pause and interact, or edit its title and summary directly. Export the same scene with a solid or transparent background.',
  },
  'triage-board': {
    code: 'PR-02', name: 'Triage', family: 'Products', duration: 16, alpha: true,
    title: '', body: '', titleMax: 90, bodyMax: 1000,
    description: 'Explore the review queue, priorities, and suggested reviewers. Edit the original product UI on the canvas.',
    usage: 'Walk through the review queues or hold one view. Click the preview to pause, explore reviewer details, and edit card text. Export with a solid or transparent background.',
  },
} as const;
export const productAssetKinds = Object.keys(productAssetTemplates) as ProductAssetKind[];
export const isProductAsset = (kind: OverlayKind): kind is ProductAssetKind => kind in productAssetTemplates;
export const productViews: {id: ProductView; name: string; description: string}[] = [
  {id: 'overview', name: 'Overview', description: 'The change at a glance'},
  {id: 'layers', name: 'Ordered layers', description: 'From intent to the diff'},
  {id: 'architecture', name: 'Architecture', description: 'How the pieces connect'},
  {id: 'security', name: 'Security', description: 'Follow the blast radius'},
];
export const changeStackLayers = ['schemas', 'storage', 'artifact-builder'].map(id => mock.layers.find(layer => layer.id === id)!);
export function productLayerId(view: ProductView, layer = 0) {
  return view === 'layers' ? changeStackLayers[layer]?.id ?? 'schemas' : view === 'architecture' ? 'architecture-impact' : view === 'security' ? 'blast-radius' : 'overview';
}
export function productSelection(id: string): Pick<Overlay, 'productView' | 'productLayer'> {
  const index = changeStackLayers.findIndex(layer => layer.id === id);
  return {productView: index >= 0 ? 'layers' : id === 'architecture-impact' ? 'architecture' : id === 'blast-radius' ? 'security' : 'overview', productLayer: Math.max(0, index)};
}
export const productAssetDefaults: Record<ProductAssetKind, Omit<Overlay, 'id'>> = {
  'change-stack': {
    kind: 'change-stack', enabled: true, start: 0, duration: 18, binding: 'cue', placement: 'center', scale: 1,
    accent: '#FF570A', colorway: 'dark', productView: 'overview', productLayer: 0, productAnimation: 'walkthrough',
    productRepository: mock.review.repo, productPr: mock.review.pr, title: mock.review.title,
    productOverviewTitle: overviewReview.title, body: overviewReview.summary,
  },
  'triage-board': {
    kind: 'triage-board', enabled: true, start: 0, duration: 16, binding: 'cue', placement: 'center', scale: 1,
    accent: '#FF570A', colorway: 'dark', title: 'Triage', body: '', productAnimation: 'walkthrough',
    triageView: 'requires-action-view',
  },
};
export const productReference = (kind: ProductAssetKind) => `https://www.coderabbit.ai/${kind === 'triage-board' ? 'triage' : 'change-stack'}`;
