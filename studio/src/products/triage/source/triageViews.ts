import type { TriageCard, TriageView } from './types';

/**
 * Sidebar view wiring.
 *
 * The Figma content carries no per-view membership, so each view selects on
 * attributes the cards genuinely have rather than on invented flags. The
 * predicates are chosen so every view keeps all three priority columns
 * populated — switching views never lands on an empty column or an empty board.
 */
const hasSeverity = (card: TriageCard) => card.tags.some(tag => tag.startsWith('Issue severity'));

const viewFilters: Partial<Record<string, (card: TriageCard) => boolean>> = {
  // every open pull request
  'all-reviews-view': () => true,
  // waiting on a human reviewer
  'needs-my-review-view': card => card.tags.includes('Needs human review'),
  // the next action sits with the author
  'authored-by-me-view': card => card.tags.includes('Needs author action'),
  // low risk and low effort, so merging them is cheap
  'safe-to-merge-view': card => card.tags.includes('Low risk') && card.tags.includes('Low effort'),
  // anything risky, wide-reaching or complex enough to keep an eye on
  'security-watch-view': card =>
    hasSeverity(card) ||
    card.tags.includes('High blast radius') ||
    card.tags.includes('High risk') ||
    card.tags.includes('High complexity'),
  // safe, fast-moving changes that can ride the next release
  'release-train-view': card => card.tags.includes('Quick review') && card.tags.includes('Low risk'),
  // a deliberately polarized queue for showing how agent-created work is routed
  'agent-created-view': card => card.tags.includes('Agent-created'),
};

/** Prefers explicit view membership, then known filters, and preserves all cards for unknown views. */
export const cardsForView = (cards: TriageCard[], viewId: string, views: TriageView[] = []): TriageCard[] => {
  const cardIds = views.find(view => view.id === viewId)?.cardIds;
  if (cardIds) {
    const membership = new Set(cardIds);
    return cards.filter(card => membership.has(card.id));
  }

  const predicate = viewFilters[viewId];

  return predicate ? cards.filter(predicate) : cards;
};
