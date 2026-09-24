'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ResourceBoard, {
  triageBoard,
  type ResourceBoardOpenPanel,
  type TriageBoardData,
  type TriageCardLayout,
  type TriagePriorityFilter,
} from './index';
import styles from './TriageScreen.module.css';

export type TriageScreenState = {
  openPanel: ResourceBoardOpenPanel;
  openReviewerCardId: string | null;
  selectedViewId: string;
};

export type TriageScreenProps = {
  board?: TriageBoardData;
  cardLayout?: TriageCardLayout;
  cardEntrance?: boolean;
  columnCardIds?: Readonly<Record<string, readonly string[]>>;
  columnCardLimits?: Readonly<Record<string, number>>;
  defaultPriorityFilter?: readonly TriagePriorityFilter[];
  chrome?: boolean;
  className?: string;
  containReviewerPopovers?: boolean;
  fillHeight?: boolean;
  focusCards?: boolean;
  interactive?: boolean;
  noBlur?: boolean;
  showSettingsBar?: boolean;
  onStateChange?: (state: TriageScreenState) => void;
  onSettingsBarVisibilityChange?: (showSettingsBar: boolean) => void;
  squareBottom?: boolean;
  state?: TriageScreenState;
};

/** Joins enabled frame classes while discarding disabled layout options. */
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

/** Initializes closed panels and the board's declared active view, falling back to its first view. */
export const createDefaultTriageScreenState = (board: TriageBoardData = triageBoard): TriageScreenState => {
  const allViews = board.viewGroups.flatMap(group => group.views);

  return {
    openPanel: null,
    openReviewerCardId: null,
    selectedViewId: allViews.find(view => view.active)?.id ?? allViews[0].id,
  };
};

/**
 * Reusable CodeRabbit Triage product mockup.
 *
 * The screen can manage its own selected view or receive controlled state,
 * and can render with standalone chrome or inside a parent-owned frame.
 */
export default function TriageScreen({
  board = triageBoard,
  cardLayout,
  cardEntrance = false,
  columnCardIds,
  columnCardLimits,
  defaultPriorityFilter,
  chrome = true,
  className = '',
  containReviewerPopovers = false,
  fillHeight = true,
  focusCards = false,
  interactive = true,
  noBlur = false,
  showSettingsBar = true,
  onStateChange,
  onSettingsBarVisibilityChange,
  squareBottom = false,
  state,
}: Readonly<TriageScreenProps> = {}) {
  const [internalState, setInternalState] = useState(() => createDefaultTriageScreenState(board));
  const screenState = state ?? internalState;
  const screenStateRef = useRef(screenState);

  useEffect(() => {
    screenStateRef.current = screenState;
  }, [screenState]);

  /** Applies partial screen changes through the controlled owner or the internal state. */
  const updateScreenState = useCallback(
    (patch: Partial<TriageScreenState>) => {
      const nextState = { ...screenStateRef.current, ...patch };
      screenStateRef.current = nextState;

      if (state) {
        onStateChange?.(nextState);
        return;
      }

      setInternalState(nextState);
      onStateChange?.(nextState);
    },
    [onStateChange, state]
  );

  return (
    <div
      data-reviewer-boundary={containReviewerPopovers ? '' : undefined}
      aria-label={interactive ? 'Interactive CodeRabbit Triage board' : 'CodeRabbit Triage board'}
      className={cx(
        styles.frame,
        'aspect-video w-full',
        chrome && 'rounded-[0.625rem] border border-cui-neutral bg-cui-base-0',
        chrome && squareBottom && 'rounded-b-none border-b-0',
        className
      )}
      role='group'>
      <ResourceBoard
        board={board}
        cardLayout={cardLayout}
        cardEntrance={cardEntrance}
        columnCardIds={columnCardIds}
        columnCardLimits={columnCardLimits}
        defaultPriorityFilter={defaultPriorityFilter}
        fillHeight={fillHeight}
        focusCards={focusCards}
        interactive={interactive}
        noBlur={noBlur}
        showSettingsBar={showSettingsBar}
        onOpenPanelChange={openPanel => {
          updateScreenState({ openPanel });
        }}
        onOpenReviewerCardIdChange={openReviewerCardId => {
          updateScreenState({ openReviewerCardId });
        }}
        onSelectedViewIdChange={selectedViewId => {
          updateScreenState({ selectedViewId });
        }}
        onSettingsBarVisibilityChange={onSettingsBarVisibilityChange}
        openPanel={screenState.openPanel}
        openReviewerCardId={screenState.openReviewerCardId}
        selectedViewId={screenState.selectedViewId}
      />
    </div>
  );
}
