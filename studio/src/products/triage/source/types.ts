/** Documented priority label shown as the leading pill. */
export type TriagePriority = 'P0' | 'P1' | 'P2' | 'P3';

export type TriagePriorityFilter = TriagePriority | 'close_candidate' | 'none';

export type TriageCardLayout = 'default' | 'product';

export type TriageReviewState =
  'Approved' | 'Changes requested' | 'Review requested' | 'Review required' | 'Review pending' | 'Stale approval';

export interface TriageCiChecks {
  status: 'passing' | 'failing';
  passed: number;
  total: number;
}

/** Change Stack affordance, revealed on card hover in the design. */
export type TriageStackLabel = 'Change Stack' | 'Earlier Change Stack' | 'Open pull request';

export interface TriageReviewer {
  id: string;
  name: string;
  handle: string;
  slackHandle?: string;
  avatar?: string;
  initials?: string;
  match?: number;
  selected?: boolean;
}

export interface TriageReviewerSuggestion {
  reviewer: TriageReviewer;
  match?: number;
}

/** Data-driven reviewer hover card; the suggestion section is optional. */
export interface TriageReviewerPopover {
  reviewers: TriageReviewer[];
  suggestions?: TriageReviewerSuggestion[];
  emptyMessage?: string;
}

export interface TriageFocusCardIds {
  now: string[];
  next: string[];
}

export interface TriageView {
  id: string;
  label: string;
  count: string;
  active?: boolean;
  /** Initial display grouping for this view; other views retain their own choice. */
  grouping?: 'Focus';
  /** Ordered featured cards that lead the two Focus buckets. */
  focusCardIds?: TriageFocusCardIds;
  defaultPriorityFilter?: TriagePriorityFilter[];
  icon?: 'action' | 'all-prs' | 'close' | 'project' | 'initiative';
  showCount?: boolean;
  /** Exact membership for views derived from a supplied product dataset. */
  cardIds?: string[];
}

/** Sidebar section, e.g. "Pull requests" or "Saved views". */
export interface TriageViewGroup {
  id: string;
  label: string;
  badge?: string;
  showViewOptions?: boolean;
  views: TriageView[];
}

/** A board column, grouping cards by priority or a separate disposition. */
export interface TriageColumn {
  id: string;
  title: string;
  count: string;
  description?: string;
}

export interface TriageCard {
  id: string;
  columnId: string;
  repository: string;
  reference: string;
  title: string;
  reason?: string;
  priority?: TriagePriority;
  /** Sample priority score used to rank cards within the same priority level. */
  priorityScore?: number;
  disposition?: 'Safe to close';
  tags: string[];
  stack?: TriageStackLabel;
  pullRequestUrl?: string;
  changeStackPath?: string;
  author?: string;
  openedAt?: string;
  updatedAt?: string;
  activity?: string;
  additions?: number;
  deletions?: number;
  ciChecks?: TriageCiChecks;
  reviewState?: TriageReviewState;
  /** "+N" chip closing the reviewer stack. */
  overflow?: string;
  avatars?: string[];
  reviewerPopover?: TriageReviewerPopover;
}

export interface TriageBoardData {
  /** Explicit illustrative daily queue capacity; not a measured user workload. */
  focusNowCapacity?: number;
  searchPlaceholder: string;
  viewGroups: TriageViewGroup[];
  columns: TriageColumn[];
  cards: TriageCard[];
}
