import type { TriageCard, TriageColumn, TriageFocusCardIds } from './types';

interface FocusColumnOptions {
  nowCapacity: number;
  featured?: TriageFocusCardIds;
  visibleCardIds?: ReadonlySet<string>;
  labels: Record<'now' | 'next', Pick<TriageColumn, 'title' | 'description'>>;
}

const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

/** Ranks the complete view, applies its capacity boundary, then filters and features cards within each bucket. */
export const focusColumnsFor = (
  viewCards: readonly TriageCard[],
  { nowCapacity, featured = { now: [], next: [] }, visibleCardIds, labels }: FocusColumnOptions
): { column: TriageColumn; cards: TriageCard[] }[] => {
  const ranked = [...new Map(viewCards.map(card => [card.id, card])).values()].sort(
    (first, second) =>
      (first.priority ? priorityOrder[first.priority] : 4) - (second.priority ? priorityOrder[second.priority] : 4) ||
      (second.priorityScore ?? 0) - (first.priorityScore ?? 0)
  );
  const capacity = Number.isFinite(nowCapacity) ? Math.max(0, Math.floor(nowCapacity)) : 0;

  return (['now', 'next'] as const).map(bucket => {
    const assigned = bucket === 'now' ? ranked.slice(0, capacity) : ranked.slice(capacity);
    const visible = assigned.filter(card => !visibleCardIds || visibleCardIds.has(card.id));
    const byId = new Map(visible.map(card => [card.id, card]));
    const leading = [...new Set(featured[bucket])]
      .map(id => byId.get(id))
      .filter((card): card is TriageCard => Boolean(card));
    const leadingIds = new Set(leading.map(card => card.id));
    const cards = [...leading, ...visible.filter(card => !leadingIds.has(card.id))];
    return {
      column: { id: `focus-${bucket}`, ...labels[bucket], count: cards.length.toLocaleString('en-US') },
      cards,
    };
  });
};
