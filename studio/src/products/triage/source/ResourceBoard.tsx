'use client';

import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BellIcon,
  BookmarkSquareIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  FolderIcon,
  FunnelIcon,
  InboxIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  ShieldExclamationIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
  ViewColumnsIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { Checkbox, Select, SelectButton, SelectContent, SelectOption } from './carrot';
import { useEffect, useId, useRef, useState } from 'react';
import {useTriageState} from './TriageEditor';
import { useTranslations } from './messages';
import CarrotPressable from '../../change-stack/source/CarrotPressable';
import ResourceBoardColumnPanel from './ResourceBoardColumn';
import FollowSettingsPopover from './FollowSettingsPopover';
import { defaultFollowDigestPreferences } from './followDigest';
import styles from './ResourceBoard.module.css';
import {triageProductBoard as triageBoard} from './triageProductBoardData';
import { cardsForView } from './triageViews';
import { focusColumnsFor } from './triageFocus';
import { priorityFilterOptionsFor } from './triagePriorities';
import type { TriageBoardData, TriageCardLayout, TriagePriorityFilter, TriageView } from './types';

export type ResourceBoardOpenPanel = 'display' | 'filter' | 'saved' | 'follow' | null;
type BoardLayout = 'board' | 'list';

const DISPLAY_PROPERTIES = [
  'Summary',
  'Review state',
  'GitHub Actions',
  'Last activity',
  'Diff size',
  'Change type',
  'Review workflow',
  'Needs action',
  'Review guidance',
  'Risk',
  'Security risk',
  'Blast radius',
  'Review effort',
  'Issue severity',
  'Priority',
  'Reviewers',
] as const;

const FILTER_CATEGORIES = [
  { label: 'Title', Icon: DocumentTextIcon },
  { label: 'Repository name', Icon: FolderIcon },
  { label: 'PR author', Icon: UserIcon },
  { label: 'PR reviewers', Icon: UserGroupIcon },
  { label: 'Priority', Icon: FlagIcon },
  { label: 'Review guidance', Icon: RectangleGroupIcon },
  { label: 'Risk', Icon: ExclamationTriangleIcon },
  { label: 'Security risk', Icon: ShieldExclamationIcon },
  { label: 'Change type', Icon: TagIcon },
] as const;

const FIELD_LABEL_KEYS: Partial<Record<string, string>> = {
  Summary: 'fields.summary',
  'Review state': 'fields.reviewState',
  'GitHub Actions': 'fields.githubActions',
  'Last activity': 'fields.lastActivity',
  'Diff size': 'fields.diffSize',
  'Change type': 'fields.changeType',
  'Review workflow': 'fields.reviewWorkflow',
  'Needs action': 'fields.needsAction',
  'Review guidance': 'fields.reviewGuidance',
  Risk: 'fields.risk',
  'Security risk': 'fields.securityRisk',
  'Blast radius': 'fields.blastRadius',
  'Review effort': 'fields.reviewEffort',
  'Issue severity': 'fields.issueSeverity',
  Priority: 'fields.priority',
  Reviewers: 'fields.reviewers',
  Title: 'fields.title',
  'Repository name': 'fields.repositoryName',
  'PR author': 'fields.prAuthor',
  'PR reviewers': 'fields.prReviewers',
  Inbox: 'fields.inbox',
  Focus: 'fields.focus',
  'No grouping': 'fields.noGrouping',
  Repository: 'fields.repository',
};

const NAVIGATION_LABEL_KEYS: Partial<Record<string, string>> = {
  'My views': 'navigation.myViews',
  'Pull requests': 'navigation.pullRequests',
  'Saved views': 'savedViews',
  Projects: 'navigation.projects',
  Initiatives: 'navigation.initiatives',
  'Requires Action': 'navigation.requiresAction',
  'All PRs': 'navigation.allPrs',
  'Close candidates': 'navigation.closeCandidates',
  'Harden access controls': 'navigation.accessControls',
  'Improve review workflows': 'navigation.reviewWorkflows',
  'Make billing usage clearer': 'navigation.billingUsage',
};

const COLUMN_DESCRIPTION_KEYS: Partial<Record<string, string>> = {
  p0: 'priority.urgent',
  p1: 'priority.high',
  p2: 'priority.medium',
  p3: 'priority.low',
};

const GROUPING_OPTIONS = ['Inbox', 'Priority', 'Review state'];
const SUB_GROUPING_OPTIONS = ['No grouping', 'Repository', 'Risk'];

const VIEW_ICONS = {
  action: InboxIcon,
  'all-prs': RectangleStackIcon,
  close: XCircleIcon,
  project: FlagIcon,
  initiative: ChevronRightIcon,
} satisfies Record<NonNullable<TriageView['icon']>, typeof FlagIcon>;

/**
 * Triage board for the homepage "Prioritize" showcase, built 1:1 from the Figma
 * design (July Homepage - New Cut, node 299:23275).
 *
 * The sidebar views are live: selecting one filters the cards in every priority
 * column. Columns with no cards for the active view are omitted rather than
 * rendered as empty shells.
 */
const ResourceBoard = ({
  board = triageBoard,
  cardLayout,
  cardEntrance = false,
  columnCardIds = {},
  columnCardLimits = {},
  defaultPriorityFilter = [],
  fillHeight = false,
  focusCards = false,
  interactive = true,
  noBlur = false,
  reviewerOverlayOnly = false,
  showSettingsBar = true,
  showGlimmer: controlledShowGlimmer,
  onGlimmerVisibilityChange,
  onHoveredReviewerCardIdChange,
  onOpenPanelChange,
  onOpenReviewerCardIdChange,
  onSelectedViewIdChange,
  onSettingsBarVisibilityChange,
  openPanel: controlledOpenPanel,
  openReviewerCardId: controlledOpenReviewerCardId,
  selectedViewId: controlledSelectedViewId,
}: Readonly<{
  board?: TriageBoardData;
  cardLayout?: TriageCardLayout;
  cardEntrance?: boolean;
  columnCardIds?: Readonly<Record<string, readonly string[]>>;
  columnCardLimits?: Readonly<Record<string, number>>;
  defaultPriorityFilter?: readonly TriagePriorityFilter[];
  fillHeight?: boolean;
  focusCards?: boolean;
  interactive?: boolean;
  noBlur?: boolean;
  reviewerOverlayOnly?: boolean;
  showSettingsBar?: boolean;
  showGlimmer?: boolean;
  onGlimmerVisibilityChange?: (showGlimmer: boolean) => void;
  onHoveredReviewerCardIdChange?: (cardId: string | null) => void;
  onOpenPanelChange?: (openPanel: ResourceBoardOpenPanel) => void;
  onOpenReviewerCardIdChange?: (cardId: string | null) => void;
  onSelectedViewIdChange?: (selectedViewId: string) => void;
  onSettingsBarVisibilityChange?: (showSettingsBar: boolean) => void;
  openPanel?: ResourceBoardOpenPanel;
  openReviewerCardId?: string | null;
  selectedViewId?: string;
}>) => {
  const t = useTranslations('Triage.board');
  /** Keeps control state identifiers stable while localizing their displayed labels. */
  const fieldLabel = (value: string) => {
    const key = FIELD_LABEL_KEYS[value];
    return key ? t(key) : value;
  };
  /** Translates built-in navigation while retaining supplied project names. */
  const navigationLabel = (value: string) => {
    const key = NAVIGATION_LABEL_KEYS[value];
    return key ? t(key) : value;
  };
  /** Returns translated descriptions only for the known priority columns. */
  const priorityDescription = (columnId: string) => {
    const key = COLUMN_DESCRIPTION_KEYS[columnId];
    return key ? t(key) : undefined;
  };
  const allViews = board.viewGroups.flatMap(group => group.views);
  const priorityFilterOptions = priorityFilterOptionsFor(board.cards).map(option => ({
    ...option,
    label:
      option.value === 'close_candidate' ? t('safeToClose') : option.value === 'none' ? t('noPriority') : option.label,
  }));
  const [internalSelectedViewId, setInternalSelectedViewId] = useState(
    allViews.find(view => view.active)?.id ?? allViews[0].id
  );
  const selectedViewId = controlledSelectedViewId ?? internalSelectedViewId;
  const selectedView = allViews.find(view => view.id === selectedViewId);
  const [internalOpenPanel, setInternalOpenPanel] = useState<ResourceBoardOpenPanel>(null);
  const [internalOpenReviewerCardId, setInternalOpenReviewerCardId] = useState<string | null>(null);
  const [hoveredReviewerCardId, setHoveredReviewerCardId] = useState<string | null>(null);
  const openPanel = controlledOpenPanel === undefined ? internalOpenPanel : controlledOpenPanel;
  const openReviewerCardId =
    controlledOpenReviewerCardId === undefined ? internalOpenReviewerCardId : controlledOpenReviewerCardId;
  const [boardLayout, setBoardLayout] = useTriageState('boardLayout', 'board');
  const [viewGroupings, setViewGroupings] = useTriageState('viewGroupings', {});
  const grouping = viewGroupings[selectedViewId] ?? selectedView?.grouping ?? 'Inbox';
  const groupingOptions = (cardLayout === 'product' ? [...GROUPING_OPTIONS, 'Focus'] : GROUPING_OPTIONS).map(value => ({
    label: fieldLabel(value),
    value,
  }));
  const subGroupingOptions = SUB_GROUPING_OPTIONS.map(value => ({ label: fieldLabel(value), value }));
  const focusGrouping = cardLayout === 'product' && grouping === 'Focus';
  /** Stores display choices per view so Focus does not change the other sidebar views. */
  const setGrouping = (value: string) => {
    setViewGroupings(current => ({ ...current, [selectedViewId]: value }));
  };
  const [subGrouping, setSubGrouping] = useTriageState('subGrouping', 'No grouping');
  const [visibleProperties, setVisibleProperties] = useTriageState('visibleProperties', [...DISPLAY_PROPERTIES]);
  const [viewPriorityFilters, setViewPriorityFilters] = useTriageState('viewPriorityFilters', {});
  const priorityFilterForView = (view: TriageView | undefined) =>
    (view ? viewPriorityFilters[view.id] : undefined) ?? view?.defaultPriorityFilter ?? defaultPriorityFilter;
  const priorityFilter = priorityFilterForView(selectedView);
  /** Preserves each view's filter scope, including the featured P0 in Requires Action. */
  const setPriorityFilter = (
    update: TriagePriorityFilter[] | ((current: TriagePriorityFilter[]) => TriagePriorityFilter[])
  ) => {
    setViewPriorityFilters(current => {
      const previous = current[selectedViewId] ?? selectedView?.defaultPriorityFilter ?? [...defaultPriorityFilter];
      return { ...current, [selectedViewId]: typeof update === 'function' ? update(previous) : update };
    });
  };
  const priorityFilterId = useId();
  const activeFilterCount = priorityFilter.length > 0 ? 1 : 0;
  const [expandedFilter, setExpandedFilter] = useTriageState('expandedFilter', null);
  const [following, setFollowing] = useTriageState('following', cardLayout === 'product');
  const [digestPreferences, setDigestPreferences] = useTriageState('digestPreferences', defaultFollowDigestPreferences);
  const [collapsedColumnIds, setCollapsedColumnIds] = useTriageState('collapsedColumnIds', []);
  const [instantColumnToggle, setInstantColumnToggle] = useState(false);
  const [internalShowGlimmer, setInternalShowGlimmer] = useTriageState('showGlimmer', true);
  const showGlimmer = controlledShowGlimmer ?? internalShowGlimmer;
  const boardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!interactive || !openPanel) return undefined;
    const panel = panelRef.current;
    const trigger = boardRef.current?.querySelector<HTMLButtonElement>(`[data-panel-trigger="${openPanel}"]`);
    if (!panel) return undefined;
    const firstControl = panel.querySelector<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [tabindex="0"]'
    );
    (firstControl ?? panel).focus();

    return () => {
      if (panel.contains(document.activeElement) || document.activeElement === document.body) trigger?.focus();
    };
  }, [interactive, openPanel]);

  /** Selects a sidebar view while honoring controlled selection and notifying the parent. */
  const selectView = (nextSelectedViewId: string) => {
    if (controlledSelectedViewId === undefined) setInternalSelectedViewId(nextSelectedViewId);
    onSelectedViewIdChange?.(nextSelectedViewId);
  };

  // Priority choices are ORed together; an empty selection means no priority restriction.
  const cardsForPriorityFilter = (filter: readonly TriagePriorityFilter[]) =>
    filter.length
      ? board.cards.filter(card =>
          filter.includes(card.disposition === 'Safe to close' ? 'close_candidate' : (card.priority ?? 'none'))
        )
      : board.cards;
  const priorityFilteredCards = cardsForPriorityFilter(priorityFilter);
  const visibleCards = cardsForView(priorityFilteredCards, selectedViewId, allViews);
  const viewColumns = focusGrouping
    ? focusColumnsFor(cardsForView(board.cards, selectedViewId, allViews), {
        nowCapacity: board.focusNowCapacity ?? 0,
        featured: selectedView?.focusCardIds,
        visibleCardIds: new Set(visibleCards.map(card => card.id)),
        labels: {
          now: { title: t('focus.now'), description: t('focus.nowDescription') },
          next: { title: t('focus.next'), description: t('focus.nextDescription') },
        },
      })
    : board.columns.map(column => ({ column, cards: visibleCards.filter(card => card.columnId === column.id) }));
  const populatedColumns = viewColumns
    .map(({ column, cards: columnCards }) => {
      // Curate the landing view only; sidebar views must show their own matching PRs.
      const defaultViewId = allViews.find(view => view.active)?.id ?? allViews[0].id;
      const selectedCardIds = !focusGrouping && selectedViewId === defaultViewId ? columnCardIds[column.id] : undefined;
      const previewCards = selectedCardIds
        ? columnCards.filter(card => selectedCardIds.includes(card.id))
        : columnCards;
      return {
        column: cardLayout === 'product' ? { ...column, count: columnCards.length.toLocaleString('en-US') } : column,
        // These marketing previews clip each column; keep the full dataset for view membership and counts.
        cards: cardLayout === 'product' ? previewCards.slice(0, columnCardLimits[column.id] ?? 12) : columnCards,
      };
    })
    .filter(({ cards }) => focusGrouping || cards.length > 0);

  /** Updates the open settings panel locally or through the controlling parent. */
  const setOpenPanel = (nextOpenPanel: ResourceBoardOpenPanel) => {
    if (controlledOpenPanel === undefined) setInternalOpenPanel(nextOpenPanel);
    onOpenPanelChange?.(nextOpenPanel);
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!interactive || !openPanel || !panel) return undefined;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.stopPropagation();
      if (controlledOpenPanel === undefined) setInternalOpenPanel(null);
      onOpenPanelChange?.(null);
    };
    panel.addEventListener('keydown', dismiss);
    return () => {
      panel.removeEventListener('keydown', dismiss);
    };
  }, [controlledOpenPanel, interactive, onOpenPanelChange, openPanel]);

  useEffect(() => {
    if (!interactive || openPanel !== 'follow') return undefined;
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target;
      const trigger = boardRef.current?.querySelector('[data-panel-trigger="follow"]');
      if (!(target instanceof Node) || panelRef.current?.contains(target) || trigger?.contains(target)) return;
      if (controlledOpenPanel === undefined) setInternalOpenPanel(null);
      onOpenPanelChange?.(null);
    };
    document.addEventListener('pointerdown', dismissOutside);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
    };
  }, [controlledOpenPanel, interactive, onOpenPanelChange, openPanel]);

  /** Keeps reviewer expansion synchronized with an optional controlling parent. */
  const setOpenReviewerCardId = (cardId: string | null) => {
    if (controlledOpenReviewerCardId === undefined) setInternalOpenReviewerCardId(cardId);
    onOpenReviewerCardIdChange?.(cardId);
  };

  /** Toggles one mutually exclusive settings panel when the board is interactive. */
  const togglePanel = (panel: Exclude<ResourceBoardOpenPanel, null>) => {
    if (!interactive) return;
    setOpenReviewerCardId(null);
    setOpenPanel(openPanel === panel ? null : panel);
  };

  /** Adds or removes one display/filter choice while retaining the other selections. */
  const toggleListValue = (value: string, setter: (nextValues: string[]) => void, values: string[]) => {
    setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  const savedViewsPanel =
    openPanel === 'saved' ? (
      <div
        className={`${styles.popover} ${styles.popoverSaved}`}
        role='dialog'
        aria-label={t('savedViews')}
        id={`${panelId}-saved`}
        ref={panelRef}
        tabIndex={-1}>
        <span className={styles.popoverTitle}>{t('savedViews')}</span>
        <span className={styles.popoverCopy}>{t('savedViewsDescription')}</span>
        <CarrotPressable
          className={styles.menuRow}
          onClick={() => {
            setBoardLayout('board');
            setViewGroupings({});
            setSubGrouping('No grouping');
            setFollowing(cardLayout === 'product');
            setDigestPreferences(defaultFollowDigestPreferences);
            setCollapsedColumnIds([]);
            setExpandedFilter(null);
            setVisibleProperties([...DISPLAY_PROPERTIES]);
            setViewPriorityFilters({});
            selectView(allViews.find(view => view.active)?.id ?? allViews[0].id);
          }}>
          <ArrowPathIcon className={styles.menuIcon} />
          <span>{t('resetToDefault')}</span>
        </CarrotPressable>
        <div className={styles.menuDivider} />
        <span className={styles.emptyState}>{t('noSavedViews')}</span>
        <div className={styles.menuDivider} />
        <CarrotPressable className={styles.menuAction} disabled>
          <PlusIcon className={styles.menuIcon} />
          <span>{t('saveCurrentView')}</span>
        </CarrotPressable>
      </div>
    ) : null;
  const savedViewsControl = (
    <div className={styles.controlWrap}>
      <CarrotPressable
        className={`${styles.control} ${openPanel === 'saved' ? styles.controlActive : ''}`}
        aria-label={t('savedViews')}
        data-panel-trigger='saved'
        aria-controls={openPanel === 'saved' ? `${panelId}-saved` : undefined}
        aria-expanded={openPanel === 'saved'}
        disabled={!interactive}
        onClick={() => {
          togglePanel('saved');
        }}>
        <BookmarkSquareIcon className={styles.controlIcon} />
      </CarrotPressable>
      {savedViewsPanel}
    </div>
  );
  const displayControl = (
    <div className={styles.controlWrap}>
      <CarrotPressable
        className={`${styles.control} ${openPanel === 'display' ? styles.controlActive : ''}`}
        aria-label={t('display')}
        title={t('display')}
        data-panel-trigger='display'
        aria-controls={openPanel === 'display' ? `${panelId}-display` : undefined}
        aria-expanded={openPanel === 'display'}
        disabled={!interactive}
        onClick={() => {
          togglePanel('display');
        }}>
        <ViewColumnsIcon className={styles.controlIcon} />
      </CarrotPressable>
      {openPanel === 'display' ? (
        <div
          className={`${styles.popover} ${styles.popoverDisplay}`}
          id={`${panelId}-display`}
          ref={panelRef}
          tabIndex={-1}
          role='dialog'
          aria-label={t('displayOptions')}>
          <div className={styles.segmentedControl}>
            {(['list', 'board'] as const).map(layout => (
              <CarrotPressable
                key={layout}
                className={`${styles.segment} ${boardLayout === layout ? styles.segmentActive : ''}`}
                aria-pressed={boardLayout === layout}
                onClick={() => {
                  setBoardLayout(layout);
                }}>
                {layout === 'board' ? (
                  <ViewColumnsIcon className={styles.segmentIcon} />
                ) : (
                  <ListBulletIcon className={styles.segmentIcon} />
                )}
                {t(layout === 'board' ? 'boardLayout' : 'listLayout')}
              </CarrotPressable>
            ))}
          </div>
          <div className={styles.displayField}>
            <span>{t('grouping')}</span>
            <Select items={groupingOptions} value={grouping} onValueChange={setGrouping}>
              <SelectButton size='sm' className={styles.displaySelect} />
              <SelectContent>
                {groupingOptions.map(option => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.displayField}>
            <span>{t('subGrouping')}</span>
            <Select items={subGroupingOptions} value={subGrouping} onValueChange={setSubGrouping}>
              <SelectButton size='sm' className={styles.displaySelect} />
              <SelectContent>
                {subGroupingOptions.map(option => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.menuDivider} />
          <span className={styles.menuLabel}>{t('displayProperties')}</span>
          <div className={styles.propertyGrid}>
            {DISPLAY_PROPERTIES.map(property => (
              <CarrotPressable
                key={property}
                className={`${styles.propertyChip} ${
                  visibleProperties.includes(property) ? styles.propertyChipActive : ''
                }`}
                aria-pressed={visibleProperties.includes(property)}
                onClick={() => {
                  toggleListValue(property, setVisibleProperties, visibleProperties);
                }}>
                {fieldLabel(property)}
              </CarrotPressable>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
  const filterControl = (
    <div className={styles.controlWrap}>
      <CarrotPressable
        className={`${styles.control} ${
          cardLayout !== 'product' && (openPanel === 'filter' || activeFilterCount) ? styles.controlActive : ''
        }`}
        aria-label={activeFilterCount ? t('activeFilters', { count: activeFilterCount }) : t('filter')}
        title={t('filter')}
        aria-expanded={openPanel === 'filter'}
        data-panel-trigger='filter'
        aria-controls={openPanel === 'filter' ? `${panelId}-filter` : undefined}
        disabled={!interactive}
        onClick={() => {
          togglePanel('filter');
        }}>
        <FunnelIcon className={styles.controlIcon} />
        {cardLayout !== 'product' && activeFilterCount ? (
          <span className={styles.controlCount}>{activeFilterCount}</span>
        ) : null}
      </CarrotPressable>
      {openPanel === 'filter' ? (
        <div
          className={`${styles.popover} ${styles.popoverFilter}`}
          id={`${panelId}-filter`}
          ref={panelRef}
          tabIndex={-1}
          role='dialog'
          aria-label={t('filterPullRequests')}>
          {FILTER_CATEGORIES.map(({ label, Icon }) => (
            <div key={label} className={styles.filterGroup}>
              <CarrotPressable
                className={styles.filterRow}
                disabled={!interactive || cardLayout === 'product' || label !== 'Priority'}
                aria-expanded={cardLayout !== 'product' && expandedFilter === label}
                onClick={() => {
                  setExpandedFilter(current => (current === label ? null : label));
                }}>
                <Icon className={styles.filterIcon} />
                <span className={styles.filterLabel}>
                  {fieldLabel(label)}
                  {label === 'Priority' && priorityFilter.length > 0 ? (
                    <span className={styles.filterSelectedValues}>
                      {priorityFilterOptions
                        .filter(option => priorityFilter.includes(option.value))
                        .map(option => (
                          <span
                            key={option.value}
                            className={styles.filterSelectedValue}
                            data-priority={option.value}
                            data-disposition={option.value === 'close_candidate' ? 'Safe to close' : undefined}>
                            {option.label}
                            <XMarkIcon className={styles.filterSelectedValueIcon} aria-hidden='true' />
                          </span>
                        ))}
                    </span>
                  ) : null}
                </span>
                <ChevronRightIcon className={styles.filterChevron} />
              </CarrotPressable>
              {cardLayout !== 'product' && label === 'Priority' && expandedFilter === label ? (
                <div className={styles.filterEditor}>
                  <div className={styles.priorityFilterOptions} role='group' aria-label={t('fields.priority')}>
                    {priorityFilterOptions.map(option => (
                      <label
                        key={option.value}
                        className={styles.filterCheckbox}
                        htmlFor={`${priorityFilterId}-${option.value}`}>
                        <Checkbox
                          id={`${priorityFilterId}-${option.value}`}
                          className={styles.filterCheckboxControl}
                          checked={priorityFilter.includes(option.value)}
                          disabled={!interactive}
                          onCheckedChange={checked => {
                            setPriorityFilter(current =>
                              checked
                                ? [...new Set([...current, option.value])]
                                : current.filter(value => value !== option.value)
                            );
                            setOpenReviewerCardId(null);
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                    {priorityFilter.length > 0 ? (
                      <CarrotPressable
                        className={styles.menuRow}
                        disabled={!interactive}
                        onClick={() => {
                          // Clearing removes this button; keep keyboard dismissal inside the dialog.
                          panelRef.current?.focus();
                          setPriorityFilter([]);
                        }}>
                        {t('clearPriorityFilters')}
                      </CarrotPressable>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {activeFilterCount > 0 ? (
            <CarrotPressable
              className={styles.menuRow}
              disabled={!interactive || cardLayout === 'product'}
              onClick={() => {
                panelRef.current?.focus();
                setPriorityFilter([]);
              }}>
              {t('clearFilters')}
            </CarrotPressable>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  const followLabel = following ? (cardLayout === 'product' ? t('following') : t('unfollow')) : t('follow');
  const followControl = (
    <div className={styles.controlWrap}>
      <CarrotPressable
        className={`${styles.control} ${(cardLayout === 'product' ? openPanel === 'follow' : following) ? styles.controlActive : ''}`}
        aria-label={followLabel}
        title={followLabel}
        aria-pressed={cardLayout === 'product' ? undefined : following}
        aria-haspopup={cardLayout === 'product' ? 'dialog' : undefined}
        aria-expanded={cardLayout === 'product' ? openPanel === 'follow' : undefined}
        aria-controls={openPanel === 'follow' ? `${panelId}-follow` : undefined}
        data-panel-trigger='follow'
        disabled={!interactive}
        onClick={() => {
          if (cardLayout === 'product') {
            setFollowing(true);
            togglePanel('follow');
          } else {
            setFollowing(current => !current);
          }
        }}>
        <BellIcon className={styles.controlIcon} aria-hidden='true' />
        {cardLayout === 'product' ? <span>{followLabel}</span> : null}
      </CarrotPressable>
      {cardLayout === 'product' && openPanel === 'follow' ? (
        <FollowSettingsPopover
          id={`${panelId}-follow`}
          panelRef={panelRef}
          preferences={digestPreferences}
          onChange={setDigestPreferences}
          onUnfollow={() => {
            setFollowing(false);
            setOpenPanel(null);
          }}
        />
      ) : null}
    </div>
  );

  return (
    <div
      ref={boardRef}
      className={styles.viewport}
      data-card-focus={focusCards ? 'true' : undefined}
      data-selected-view={selectedViewId}
      data-fill-height={fillHeight ? 'true' : undefined}
      data-no-blur={noBlur ? 'true' : undefined}
      data-reviewer-overlay-only={reviewerOverlayOnly ? 'true' : undefined}
      data-show-settings-bar={cardLayout !== 'product' && showSettingsBar ? 'true' : 'false'}
      data-show-last-activity={visibleProperties.includes('Last activity') ? 'true' : 'false'}
      data-show-priority={visibleProperties.includes('Priority') ? 'true' : 'false'}
      data-show-reviewers={visibleProperties.includes('Reviewers') ? 'true' : 'false'}
      data-show-summary={visibleProperties.includes('Summary') ? 'true' : 'false'}
      data-show-review-state={visibleProperties.includes('Review state') ? 'true' : 'false'}
      data-show-ci-checks={visibleProperties.includes('GitHub Actions') ? 'true' : 'false'}
      data-show-diff-size={visibleProperties.includes('Diff size') ? 'true' : 'false'}
      role='group'
      aria-label={cardLayout === 'product' ? t('productName') : t('exampleName')}>
      <div className={styles.board}>
        <div className={styles.surface} data-glimmer-visible={showGlimmer ? 'true' : 'false'}>
          {interactive ? (
            <CarrotPressable
              aria-label={t(showGlimmer ? 'hideGlimmer' : 'showGlimmer')}
              aria-pressed={showGlimmer}
              className={styles.glimmerToggle}
              onClick={() => {
                const nextShowGlimmer = !showGlimmer;
                if (controlledShowGlimmer === undefined) setInternalShowGlimmer(nextShowGlimmer);
                onGlimmerVisibilityChange?.(nextShowGlimmer);
              }}
            />
          ) : null}
          {cardLayout !== 'product' ? (
            <div className={styles.header}>
              {interactive && onSettingsBarVisibilityChange ? (
                <CarrotPressable
                  aria-label={t('hideSettingsBar')}
                  className={styles.search}
                  onClick={() => {
                    onSettingsBarVisibilityChange(false);
                  }}>
                  <MagnifyingGlassIcon className={styles.searchIcon} />
                  <span className={styles.searchPlaceholder}>{t('searchPullRequests')}</span>
                </CarrotPressable>
              ) : (
                <div aria-hidden='true' className={styles.search}>
                  <MagnifyingGlassIcon className={styles.searchIcon} />
                  <span className={styles.searchPlaceholder}>{t('searchPullRequests')}</span>
                </div>
              )}

              <div className={styles.controls}>
                <span className={`${styles.control} ${styles.controlStatic}`} aria-hidden='true'>
                  <AdjustmentsHorizontalIcon className={styles.controlIcon} />
                </span>
                {savedViewsControl}
                {displayControl}
                {filterControl}
                {followControl}
              </div>
            </div>
          ) : null}

          <div className={styles.boardArea}>
            <div className={styles.triage}>
              <div className={styles.asideWrap}>
                <nav
                  className={`${styles.aside} ${cardLayout === 'product' ? styles.asideProduct : ''}`}
                  aria-label={t('triageViews')}>
                  {cardLayout === 'product' ? (
                    <div className={styles.sidebarUtilities}>
                      {followControl}
                      {filterControl}
                    </div>
                  ) : null}
                  {board.viewGroups.map((group, groupIndex) => (
                    <div key={group.id} className={styles.navGroup}>
                      <div className={styles.navGroupHeading}>
                        <span className={styles.navGroupLabel}>{navigationLabel(group.label)}</span>
                        {group.badge ? <span className={styles.navGroupBadge}>{group.badge}</span> : null}
                        {group.showViewOptions ? (
                          <div className={`${styles.savedViewControl} ${styles.navGroupAction}`}>
                            <CarrotPressable
                              aria-label={t('openSavedViewOptions')}
                              data-panel-trigger='saved'
                              aria-controls={openPanel === 'saved' ? `${panelId}-saved` : undefined}
                              aria-expanded={openPanel === 'saved'}
                              disabled={!interactive}
                              className={styles.navSearchButton}
                              onClick={() => {
                                if (cardLayout !== 'product') onSettingsBarVisibilityChange?.(true);
                                togglePanel('saved');
                              }}>
                              <PlusIcon className={styles.navSearchIcon} aria-hidden='true' />
                            </CarrotPressable>
                            {cardLayout === 'product' ? savedViewsPanel : null}
                          </div>
                        ) : null}
                        {cardLayout !== 'product' &&
                        groupIndex === 0 &&
                        interactive &&
                        !showSettingsBar &&
                        onSettingsBarVisibilityChange ? (
                          <CarrotPressable
                            aria-label={t('showSettingsBar')}
                            className={styles.navSearchButton}
                            onClick={() => {
                              onSettingsBarVisibilityChange(true);
                            }}>
                            <MagnifyingGlassIcon className={styles.navSearchIcon} />
                          </CarrotPressable>
                        ) : null}
                      </div>
                      <div className={styles.navList}>
                        {group.views.map(view => {
                          const Icon = view.icon ? VIEW_ICONS[view.icon] : undefined;
                          const viewFilter = priorityFilterForView(view);
                          const content = (
                            <>
                              {Icon ? (
                                <Icon className={styles.navIcon} data-nav-icon={view.icon} aria-hidden='true' />
                              ) : null}
                              <span className={styles.navLabel}>{navigationLabel(view.label)}</span>
                              {view.showCount !== false ? (
                                <span className={styles.countChip}>
                                  {viewFilter.length
                                    ? cardsForView(
                                        cardsForPriorityFilter(viewFilter),
                                        view.id,
                                        allViews
                                      ).length.toLocaleString('en-US')
                                    : view.count}
                                </span>
                              ) : null}
                            </>
                          );
                          const className = `${styles.navItem} ${
                            view.id === selectedViewId ? styles.navItemActive : ''
                          } ${view.icon ? styles.navItemWithIcon : ''}`;

                          return interactive ? (
                            <CarrotPressable
                              key={view.id}
                              aria-pressed={view.id === selectedViewId}
                              onClick={() => {
                                selectView(view.id);
                              }}
                              className={className}>
                              {content}
                            </CarrotPressable>
                          ) : (
                            <span key={view.id} className={className}>
                              {content}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              <div
                className={styles.grid}
                data-layout={boardLayout}
                data-grouping={grouping}
                data-instant-toggle={instantColumnToggle}>
                {populatedColumns.length === 0 ? (
                  <div className={`${styles.emptyState} ${styles.boardEmptyState}`} role='status'>
                    {t('noMatchingPullRequests')}
                  </div>
                ) : null}
                {populatedColumns.map(({ column, cards }, columnIndex) => (
                  <ResourceBoardColumnPanel
                    key={column.id}
                    column={column.id === 'close_candidate' ? { ...column, title: t('safeToClose') } : column}
                    cards={cards}
                    cardLayout={cardLayout}
                    entranceColumnIndex={cardEntrance ? columnIndex : undefined}
                    collapsed={collapsedColumnIds.includes(column.id)}
                    bodyId={`${panelId}-column-${column.id}`}
                    description={
                      column.description ??
                      (cardLayout === 'product'
                        ? column.id === 'close_candidate'
                          ? t('recommendation')
                          : undefined
                        : priorityDescription(column.id))
                    }
                    interactive={interactive}
                    onReviewerHoverChange={(cardId, hovered) => {
                      setHoveredReviewerCardId(hovered ? cardId : null);
                      onHoveredReviewerCardIdChange?.(hovered ? cardId : null);
                    }}
                    onReviewerOpenChange={(cardId, open) => {
                      setOpenPanel(null);
                      setOpenReviewerCardId(open ? cardId : null);
                    }}
                    onToggleCollapsed={instant => {
                      setInstantColumnToggle(instant);
                      setHoveredReviewerCardId(null);
                      setOpenReviewerCardId(null);
                      onHoveredReviewerCardIdChange?.(null);
                      setCollapsedColumnIds(currentIds =>
                        currentIds.includes(column.id)
                          ? currentIds.filter(columnId => columnId !== column.id)
                          : [...currentIds, column.id]
                      );
                    }}
                    hoveredReviewerCardId={hoveredReviewerCardId}
                    openReviewerCardId={openReviewerCardId}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceBoard;
