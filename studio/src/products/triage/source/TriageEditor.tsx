import {createContext, useContext, useState, type Dispatch, type SetStateAction, type HTMLAttributes, type RefObject} from 'react';
import type {TriagePriorityFilter} from './types';
import type {FollowDigestPreferences} from './followDigest';

export type TriageViewId = 'requires-action-view' | 'all-reviews-view' | 'close-candidates-view' | 'project:Delivery Guard';
export type TriageCardCopy = {title: string; reason: string; repository: string; author: string};
export type TriageUi = {
  openPanel: 'display' | 'filter' | 'saved' | 'follow' | null;
  openReviewerCardId: string | null;
  boardLayout: 'board' | 'list';
  viewGroupings: Partial<Record<string, string>>;
  subGrouping: string;
  visibleProperties: string[];
  viewPriorityFilters: Partial<Record<string, TriagePriorityFilter[]>>;
  expandedFilter: string | null;
  following: boolean;
  digestPreferences: FollowDigestPreferences;
  collapsedColumnIds: string[];
  showGlimmer: boolean;
  editingTimes: boolean;
  reviewerQuery: string;
};
export const TriageEditor = createContext<{
  ui?: Partial<TriageUi>;
  onUiChange?: (patch: Partial<TriageUi>) => void;
  onCardChange?: (id: string, patch: Partial<TriageCardCopy>) => void;
}>({});
export const TriageMotion = createContext({frame: 0, clockFrame: 0, fps: 30, animate: false});
export const TriagePortal = createContext<RefObject<HTMLDivElement | null> | undefined>(undefined);

/** Persist native controls in the scene so render workers and saved presets agree. */
export function useTriageState<K extends keyof TriageUi>(key: K, initial: TriageUi[K]): [TriageUi[K], Dispatch<SetStateAction<TriageUi[K]>>] {
  const editor = useContext(TriageEditor);
  const [local, setLocal] = useState(initial);
  const value = editor.ui?.[key] ?? local;
  return [value, update => {
    const next = typeof update === 'function' ? (update as (current: TriageUi[K]) => TriageUi[K])(value) : update;
    if (editor.onUiChange) editor.onUiChange({[key]: next}); else setLocal(next);
  }];
}

/** Keep the source's existing text nodes, storing plain text only. */
export function useTriageCardEditor(id: string) {
  const {onCardChange} = useContext(TriageEditor);
  return (field: keyof TriageCardCopy, limit: number): HTMLAttributes<HTMLElement> => onCardChange ? {
    contentEditable: 'plaintext-only', suppressContentEditableWarning: true,
    role: 'textbox', 'aria-label': `Edit ${field} for ${id}`, tabIndex: 0,
    onBlur: event => onCardChange(id, {[field]: (event.currentTarget.textContent ?? '').trim().slice(0, limit)}),
    onKeyDown: event => {
      if (event.key === 'Enter' && !event.shiftKey) {event.preventDefault(); event.currentTarget.blur();}
      event.stopPropagation();
    },
  } : {};
}
