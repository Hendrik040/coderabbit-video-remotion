import triageProductMockPayload from './triageProductMockPayload.motion.json';
import { reviewerProfiles } from './triageBoardData';
import type {
  TriageBoardData,
  TriageCard,
  TriagePriority,
  TriageReviewerPopover,
  TriageReviewState,
  TriageView,
} from './types';

type ProductPullRequest = (typeof triageProductMockPayload)[number];

const payload = triageProductMockPayload;

const priorityLabels: Partial<Record<string, TriagePriority>> = {
  p0: 'P0',
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
};

const columnLabels = { ...priorityLabels, close_candidate: 'Safe to close' };

const reviewStates: Record<string, TriageReviewState> = {
  approved: 'Approved',
  changes_requested: 'Changes requested',
  stale_approval: 'Stale approval',
  unknown: 'Review pending',
};

const actionLabels: Record<string, string> = {
  author: 'Needs author action',
};

/** Converts fixture enum keys into readable labels without changing their meaning. */
const labelFor = (value: string) => {
  const label = value.replaceAll('_', ' ');
  return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
};

/** Formats fixture author identity while handling missing or duplicate display names. */
const authorFor = (author: ProductPullRequest['author']) => {
  if (!author) return 'Unknown author';
  if (!author.login) return author.displayName ?? 'Unknown author';
  if (author.displayName && author.displayName.toLowerCase() !== author.login.toLowerCase()) {
    return `@${author.login} (${author.displayName})`;
  }
  return `@${author.login}`;
};

/** Produces a stable unsigned seed so illustrative assignments remain deterministic. */
const hashFor = (value: string) => {
  let hash = 2166136261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
};

/** Maps explicit review decisions before falling back to the ready-to-merge workflow state. */
const reviewStateFor = (pullRequest: ProductPullRequest): TriageReviewState | undefined => {
  const existingState = pullRequest.reviewDecision ? reviewStates[pullRequest.reviewDecision] : undefined;
  if (existingState) return existingState;
  if (pullRequest.workflowState === 'ready_to_merge') return 'Approved';

  return undefined;
};

/** Supplies an illustrative 50–98% score per PR–reviewer pair, not a measured product recommendation. */
const mockMatchFor = (pullRequestId: string, reviewerId: string): number =>
  50 + (hashFor(`match:${pullRequestId}:${reviewerId}`) % 49);

/** Builds stable sample assignments, suggestions, and pair-specific scores without mutating shared profiles. */
const mockReviewersFor = (pullRequest: ProductPullRequest): TriageReviewerPopover => {
  const pullRequestId = pullRequest.id;
  const seed = hashFor(pullRequestId);
  const profiles = Object.values(reviewerProfiles)
    .map(profile => ({ profile, order: hashFor(`${pullRequestId}:${profile.id}`) }))
    .sort((first, second) => first.order - second.order)
    .map(({ profile }) => profile);
  const reviewerCount = 1 + (seed % 4);
  const suggestionCount = 1 + ((seed >>> 8) % 2);

  return {
    reviewers: profiles.slice(0, reviewerCount).map((profile, index) => ({
      ...profile,
      match: mockMatchFor(pullRequestId, profile.id),
      selected: index === 0,
    })),
    suggestions: profiles
      .slice(reviewerCount, reviewerCount + suggestionCount)
      .map(profile => ({ reviewer: profile, match: mockMatchFor(pullRequestId, profile.id) }))
      .sort((first, second) => second.match - first.match),
  };
};

/** Sample display categories, independent of PR priority; these are not security assessments. */
const securityRiskTagFor = (pullRequest: ProductPullRequest): string => {
  const level = pullRequest.securityRisk?.level;
  if (level === 'high' || level === 'critical') return 'High security risk';
  if (level === 'moderate' || level === 'medium') return 'Moderate security risk';
  return 'Low security risk';
};

/** Fill missing sample change types from the PR title without changing workflow state. */
const changeTypeTagFor = (pullRequest: ProductPullRequest): string => {
  if (pullRequest.changeType) {
    const changeType = labelFor(pullRequest.changeType);
    if (/^(?:fix|bugfix|bug fix)$/i.test(changeType)) return 'Bug fix';
    if (/^(?:feat|feature)$/i.test(changeType)) return 'Feature';
    return changeType;
  }

  const title = pullRequest.title.replace(/^\[[^\]]+\]\s*/, '');
  if (/^(?:fix|bugfix|hotfix|resolve|repair|correct)\b/i.test(title)) return 'Bug fix';
  if (/^(?:feat|feature|add|introduce|implement|enable|support|extend|improve)\b/i.test(title)) return 'Feature';
  if (/^(?:docs?|document)\b/i.test(title)) return 'Documentation';
  if (/^(?:test|tests)\b/i.test(title)) return 'Tests';
  if (/^refactor\b/i.test(title)) return 'Refactor';
  return 'Maintenance';
};

const hiddenCardTags = new Set([
  'Needs human review',
  'Needs reviewer',
  'Needs reviewer assignment',
  'Security-sensitive',
  'Security sensitive',
]);

/** Builds distinct display tags from sample PR attributes, omitting redundant reviewer signals. */
const tagsFor = (pullRequest: ProductPullRequest): string[] => {
  const effort = pullRequest.reviewEffort;
  const tags = [
    actionLabels[pullRequest.nextAction.kind],
    securityRiskTagFor(pullRequest),
    changeTypeTagFor(pullRequest),
    pullRequest.reviewDepth ? `${labelFor(pullRequest.reviewDepth)} review` : null,
    effort === null ? null : effort >= 0.66 ? 'High effort' : effort >= 0.33 ? 'Medium effort' : 'Low effort',
    pullRequest.blockingPullRequestCount > 0 ? 'Blocking other PRs' : null,
    pullRequest.isDraft ? 'Draft' : null,
    ...pullRequest.priority.signals.map(labelFor),
  ];
  return [
    ...new Set(
      tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0 && !hiddenCardTags.has(tag))
    ),
  ];
};

const cards: TriageCard[] = payload.map(pullRequest => {
  const reviewerPopover = mockReviewersFor(pullRequest);
  const reviewers = reviewerPopover.reviewers;

  return {
    id: pullRequest.id,
    columnId: pullRequest.priority.level,
    repository: pullRequest.repository,
    reference: `#${String(pullRequest.number)}`,
    title: pullRequest.title,
    reason: pullRequest.priority.reason,
    priority: priorityLabels[pullRequest.priority.level],
    priorityScore: pullRequest.priority.score,
    disposition: pullRequest.priority.level === 'close_candidate' ? 'Safe to close' : undefined,
    tags: tagsFor(pullRequest),
    stack: pullRequest.changeStackPath ? 'Change Stack' : undefined,
    pullRequestUrl: pullRequest.url,
    changeStackPath: pullRequest.changeStackPath ?? undefined,
    author: authorFor(pullRequest.author),
    reviewState: reviewStateFor(pullRequest),
    avatars: reviewers
      .slice(0, 3)
      .map(reviewer => reviewer.avatar)
      .filter((avatar): avatar is string => Boolean(avatar)),
    overflow: reviewers.length > 3 ? `+${String(reviewers.length - 3)}` : undefined,
    reviewerPopover,
  };
});

/** Derives a sample view's membership and displayed count from the same fixture predicate. */
const viewFor = (
  id: string,
  label: string,
  predicate: (pullRequest: ProductPullRequest) => boolean,
  active = false
): TriageView => {
  const cardIds = payload.filter(predicate).map(pullRequest => pullRequest.id);
  return { id, label, count: cardIds.length.toLocaleString('en-US'), active, cardIds };
};

const projects = [
  ...new Set(payload.map(pullRequest => pullRequest.project).filter((project): project is string => Boolean(project))),
];

export const triageProductBoard: TriageBoardData = {
  focusNowCapacity: 14,
  cards,
  columns: Object.entries(columnLabels).map(([id, title]) => ({
    id,
    title: title ?? id,
    count: payload.filter(pullRequest => pullRequest.priority.level === id).length.toLocaleString('en-US'),
  })),
  searchPlaceholder: 'Search pull requests',
  viewGroups: [
    {
      id: 'pull-requests',
      label: 'My views',
      showViewOptions: true,
      views: [
        {
          ...viewFor('requires-action-view', 'Requires Action', pullRequest => pullRequest.nextAction.kind !== 'none'),
          active: true,
          icon: 'action',
          grouping: 'Focus',
          defaultPriorityFilter: ['P0', 'P1', 'P2', 'P3', 'close_candidate'],
          focusCardIds: {
            now: ['20000000-0000-4000-8000-000000026102', '20000000-0000-4000-8000-000000026194'],
            next: ['20000000-0000-4000-8000-000000026189', '20000000-0000-4000-8000-000000026153'],
          },
        },
        { ...viewFor('all-reviews-view', 'All PRs', () => true), icon: 'all-prs' },
        {
          ...viewFor(
            'close-candidates-view',
            'Safe to close',
            pullRequest => pullRequest.priority.level === 'close_candidate'
          ),
          icon: 'close',
        },
      ],
    },
    {
      id: 'projects',
      label: 'Projects',
      views: projects.map((project): TriageView => ({
        ...viewFor(`project:${project}`, project, pullRequest => pullRequest.project === project),
        icon: 'project',
      })),
    },
  ],
};
