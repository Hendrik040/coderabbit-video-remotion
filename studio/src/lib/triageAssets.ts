import {triageProductBoard} from '../products/triage/source/triageProductBoardData';
import {cardsForView} from '../products/triage/source/triageViews';
import {focusColumnsFor} from '../products/triage/source/triageFocus';
import type {Overlay} from '../types';

// Six cards cover the clipped artwork, including list layout. Keep the complete
// source dataset for counts, view membership, and Focus capacity assignment.
export const triageColumnCardLimits = Object.fromEntries([...triageProductBoard.columns.map(column => column.id), 'focus-now', 'focus-next'].map(id => [id, 6]));
export function triageBoardFor(asset: Overlay) {
  return {...triageProductBoard, cards: triageProductBoard.cards.map(card => asset.triageCards?.[card.id] ? {...card, ...asset.triageCards[card.id]} : card)};
}
export function triagePreviewCards(asset: Overlay) {
  const board = triageBoardFor(asset);
  const views = board.viewGroups.flatMap(group => group.views);
  const view = views.find(item => item.id === asset.triageView) ?? views[0];
  const priority = asset.triageUi?.viewPriorityFilters?.[view.id] ?? view.defaultPriorityFilter ?? [];
  const viewCards = cardsForView(board.cards, view.id, views);
  const visible = viewCards.filter(card => !priority.length || priority.includes(card.disposition === 'Safe to close' ? 'close_candidate' : card.priority ?? 'none'));
  const grouping = asset.triageUi?.viewGroupings?.[view.id] ?? view.grouping ?? 'Inbox';
  const columns = grouping === 'Focus' ? focusColumnsFor(viewCards, {
    nowCapacity: board.focusNowCapacity ?? 0, featured: view.focusCardIds, visibleCardIds: new Set(visible.map(card => card.id)),
    labels: {now: {title: 'Now'}, next: {title: 'Next'}},
  }) : board.columns.map(column => ({column, cards: visible.filter(card => card.columnId === column.id)}));
  return columns.flatMap(({cards}) => cards.slice(0, 6));
}
