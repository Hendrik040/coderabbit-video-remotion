import {createContext, useContext, type HTMLAttributes} from 'react';
import {activityCategories, type OverviewActivityCategory} from './reviewStackOverviewData';

/** Host-owned copy and disclosure state. The imported product's markup stays intact. */
export type ReviewStackCopy = {title: string; repo: string; pr: string; overviewTitle: string; summary: string};
export type ReviewStackUi = {
  overviewOpenIds: string[];
  activityExpanded: boolean;
  activityCategories: OverviewActivityCategory[];
};
export const defaultReviewStackUi: ReviewStackUi = {
  overviewOpenIds: ['Summary', '1 merge blocker to act on'],
  activityExpanded: true,
  activityCategories: activityCategories.map(category => category.id),
};

export const ReviewStackEditor = createContext<{
  copy?: Partial<ReviewStackCopy>;
  ui?: ReviewStackUi;
  onCopyChange?: (patch: Partial<ReviewStackCopy>) => void;
  onUiChange?: (patch: Partial<ReviewStackUi>) => void;
}>({});

/** Edit the existing text element, without an extra visual wrapper or HTML persistence. */
export function useReviewStackEditor() {
  const editor = useContext(ReviewStackEditor);
  const editable = (field: keyof ReviewStackCopy, label: string, maxLength: number): HTMLAttributes<HTMLElement> => editor.onCopyChange ? {
    contentEditable: 'plaintext-only', suppressContentEditableWarning: true,
    role: 'textbox', 'aria-label': label, tabIndex: 0,
    onBlur: event => editor.onCopyChange?.({[field]: (event.currentTarget.textContent ?? '').trim().slice(0, maxLength)}),
    onKeyDown: event => {
      if (event.key === 'Enter' && !event.shiftKey) {event.preventDefault(); event.currentTarget.blur();}
      event.stopPropagation();
    },
  } : {};
  return {...editor, editable};
}
