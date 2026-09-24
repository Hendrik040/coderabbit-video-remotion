import type { TriageCard, TriagePriorityFilter } from './types';

const PRIORITY_FILTER_OPTIONS: ReadonlyArray<{ value: TriagePriorityFilter; label: string }> = [
  { value: 'P0', label: 'P0' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'close_candidate', label: 'Safe to close' },
  { value: 'none', label: 'No priority' },
];

/** Offers only populated classifications, with close recommendations taking precedence over priority. */
export const priorityFilterOptionsFor = (cards: readonly TriageCard[]) =>
  PRIORITY_FILTER_OPTIONS.filter(option =>
    cards.some(card =>
      option.value === 'close_candidate'
        ? card.disposition === 'Safe to close'
        : option.value === 'none'
          ? !card.priority && !card.disposition
          : card.disposition !== 'Safe to close' && card.priority === option.value
    )
  );
