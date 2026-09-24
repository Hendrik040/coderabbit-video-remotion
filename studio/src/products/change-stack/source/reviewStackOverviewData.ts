import reviewStackMockData from './reviewStackMockData.json';

// Illustrative invitation-PR data only. No activity here represents a live review.
const layerIds = Object.keys(reviewStackMockData.layerFiles);
const files = [
  ...new Map(
    Object.values(reviewStackMockData.layerFiles)
      .flat()
      .map(file => [file.path, file])
  ).values(),
];

export const overviewLayers = reviewStackMockData.layers.filter(layer => layerIds.includes(layer.id));

export const overviewMetrics = {
  layers: overviewLayers.length,
  files: files.length,
  additions: files.reduce((total, file) => total + Number(file.delta.match(/\+(\d+)/)?.[1] ?? 0), 0),
  deletions: files.reduce((total, file) => total + Number(file.delta.match(/-(\d+)/)?.[1] ?? 0), 0),
};

export const overviewReview = {
  updated: '5 minutes ago',
  title: 'Teammate invitations with roles',
  summary:
    'Adds teammate invitations from the data model through the API and Members settings. Organization admins can invite teammates, choose a role, and manage pending invitations.',
};

export const overviewBlockers = [
  {
    id: 'members-conflict',
    severity: 'Critical',
    title: 'Code conflicts need to be resolved',
    description:
      'The Members settings page also changed on the base branch. Reconcile those edits with the new invitation controls before merging.',
    path: 'src/pages/settings/MembersPage.tsx',
    layerId: 'artifact-builder',
    layerTitle: 'Build the invite & members UI',
  },
] as const;

export const overviewFindings = [
  {
    id: 'invitation-retry-feedback',
    severity: 'Minor',
    title: 'Make a failed invitation easy to retry',
    description:
      'Keep the selected role and email visible when an invitation request fails, so the admin can retry without entering them again.',
    path: 'src/pages/settings/InviteMemberDialog.tsx',
    layerId: 'artifact-builder',
    layerTitle: 'Build the invite & members UI',
  },
] as const;

export const overviewSeverityCounts = {
  critical: overviewBlockers.length,
  minor: overviewFindings.length,
};

export const activityCategories = [
  { id: 'coderabbit', label: 'CodeRabbit' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'commits', label: 'Commits' },
  { id: 'comments', label: 'Comments' },
  { id: 'pr-status', label: 'PR Status' },
  { id: 'bots', label: 'Bots' },
] as const;

export type OverviewActivityCategory = (typeof activityCategories)[number]['id'];

export const defaultActivityCategories: OverviewActivityCategory[] = activityCategories
  .filter(category => category.id !== 'bots')
  .map(category => category.id);

export type OverviewActivityItem = {
  id: string;
  category: OverviewActivityCategory;
  actor: string;
  action: string;
  time: string;
} & ({ kind: 'commit'; title: string } | { kind: 'review-request' | 'comment' | 'deployment' | 'review' });

export const overviewActivity: readonly OverviewActivityItem[] = [
  {
    id: 'invitation-commit',
    kind: 'commit',
    category: 'commits',
    actor: 'demo-author',
    action: 'added a commit',
    title: 'feat: add teammate invitations with roles',
    time: '5m ago',
  },
  {
    id: 'review-requested',
    kind: 'review-request',
    category: 'reviews',
    actor: 'demo-author',
    action: 'requested review from demo-reviewer',
    time: '8m ago',
  },
  {
    id: 'preview-comment',
    kind: 'comment',
    category: 'bots',
    actor: 'demo-deploy-bot',
    action: 'commented on the preview',
    time: '12m ago',
  },
  {
    id: 'preview-deployed',
    kind: 'deployment',
    category: 'pr-status',
    actor: 'demo-deploy-bot',
    action: 'deployed the PR preview',
    time: '12m ago',
  },
  {
    id: 'coderabbit-review',
    kind: 'review',
    category: 'coderabbit',
    actor: 'CodeRabbit',
    action: 'reviewed the changes',
    time: '18m ago',
  },
];
