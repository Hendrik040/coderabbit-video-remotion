'use client';

import { Badge } from './CarrotBadge';
import { ArrowUpRightIcon, BookOpenIcon } from '@heroicons/react/20/solid';
import CarrotPressable from './CarrotPressable';
import {
  Fragment,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import reviewStackMockData from './reviewStackMockData.json';
import { CodeRabbitCircleIcon, CompactSidebarIcon } from './ReviewStackProductIcons';
import { ReviewStackOverviewActivity, ReviewStackOverviewContent } from './ReviewStackOverview';
import ReviewStackImpactViews from './ReviewStackImpactViews';
import styles from './HomeHero.motion.module.css';
import {useReviewStackEditor} from './ReviewStackEditor';

export type ReviewStackScreenState = {
  activeLayerId: string;
  openSummaryIds: string[];
};

type ReviewStackData = typeof reviewStackMockData;
type Layer = ReviewStackData['layers'][number];
type LayerFileReview = ReviewStackData['layerFiles'][keyof ReviewStackData['layerFiles']][number];
type SplitDiffRow = LayerFileReview['splitRows'][number];

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const countToneClasses: Record<string, string> = {
  files: 'border-cui-accent bg-cui-accent-subtle text-cui-accent',
  filesLow: 'border-[var(--color-cui-mauve-8)]/45 bg-[var(--color-cui-mauve-8)]/15 text-[var(--color-cui-mauve-11)]',
  filesMedium: 'border-cui-warn bg-cui-warn-subtle text-cui-warn',
  risk: 'border-cui-danger bg-cui-danger-subtle text-cui-danger',
  review: 'border-cui-accent bg-cui-accent-subtle text-cui-accent',
  checks: 'border-cui-warn bg-cui-warn-subtle text-cui-warn',
  comments: 'border-[var(--color-cui-mauve-8)]/70 bg-[var(--color-cui-mauve-6)]/60 text-[var(--color-cui-mauve-11)]',
  notes: 'border-[var(--color-cui-mauve-7)]/80 bg-[var(--color-cui-mauve-4)]/70 text-[var(--color-cui-mauve-11)]',
  viewed: 'border-[var(--color-cui-mauve-7)]/80 bg-[var(--color-cui-mauve-4)]/70 text-[var(--color-cui-mauve-11)]',
};

const documentCountIconClasses: Record<string, string> = {
  files: 'h-3 w-3 opacity-70 text-cui-warn',
  filesLow: 'h-3 w-3 opacity-70 text-[var(--color-cui-mauve-8)]',
  filesMedium: 'h-3 w-3 opacity-70 text-cui-warn',
};

const layerFilesByLayerId = reviewStackMockData.layerFiles as Partial<Record<string, LayerFileReview[]>>;
const layersById = new Map(reviewStackMockData.layers.map(layer => [layer.id, layer]));

const emptyInsertSideStyle: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, color-mix(in oklch, var(--color-cui-mauve-12) 5.5%, transparent) 0 1px, transparent 1px 7px)',
};

type SidebarLayerItem = {
  ariaLabel: string;
  counts: Array<{ kind: string; value: string }>;
  description?: string;
  icon?: 'overview' | 'blast-radius' | 'architecture-impact';
  id: string;
  marker: string;
  targetLayerId: string;
  title: string;
};

type LayerHoverCardPresentation = 'hover' | 'pinned-large';

const sidebarLayerItems: SidebarLayerItem[] = [
  {
    ariaLabel: 'Pull request overview - Not mergeable, 1 blocker',
    counts: [],
    description: 'Not mergeable · 1 blocker',
    icon: 'overview',
    id: 'overview-meta',
    marker: '',
    targetLayerId: 'overview',
    title: 'Overview',
  },
  {
    ariaLabel: 'Security blast radius',
    counts: [],
    icon: 'blast-radius',
    id: 'blast-radius-meta',
    marker: '',
    targetLayerId: 'blast-radius',
    title: 'Security blast radius',
  },
  {
    ariaLabel: 'Architecture impact',
    counts: [],
    icon: 'architecture-impact',
    id: 'architecture-impact-meta',
    marker: '',
    targetLayerId: 'architecture-impact',
    title: 'Architecture impact',
  },
  {
    ariaLabel: 'Layer 1: Add the invitation data model',
    counts: [{ kind: 'filesLow', value: '2' }],
    id: 'invitation-data-model',
    marker: '1',
    targetLayerId: 'schemas',
    title: 'Add the invitation data model',
  },
  {
    ariaLabel: 'Layer 2: Add the invitation API and emails',
    counts: [
      { kind: 'filesMedium', value: '3' },
      { kind: 'risk', value: '1' },
      { kind: 'review', value: '1' },
    ],
    id: 'invitation-api-emails',
    marker: '2',
    targetLayerId: 'storage',
    title: 'Add the invitation API and emails',
  },
  {
    ariaLabel: 'Layer 3: Build the invite and members UI',
    counts: [{ kind: 'filesLow', value: '4' }],
    id: 'invite-members-ui',
    marker: '3',
    targetLayerId: 'artifact-builder',
    title: 'Build the invite & members UI',
  },
];

const hoverOnlySidebarLayerIds = new Set(['blast-radius-meta', 'architecture-impact-meta']);

type LayerSummaryComplexity = 'low' | 'medium' | 'high' | 'level2';
type LayerSummaryTextPart = string | { code: string };
type LayerSummary = {
  body: LayerSummaryTextPart[];
  complexity: LayerSummaryComplexity;
  id: string;
  lines: string;
  pathLabel?: string;
  range: string;
  seen?: boolean;
  showActions?: boolean;
};

function getSummaryBodyParts(summary: LayerSummary): Array<{ key: string; part: LayerSummaryTextPart }> {
  const occurrences = new Map<string, number>();

  return summary.body.map(part => {
    const partKind = typeof part === 'string' ? 'text' : 'code';
    const value = typeof part === 'string' ? part : part.code;
    const keyBase = `${summary.id}-${partKind}-${value}`;
    const count = occurrences.get(keyBase) ?? 0;

    occurrences.set(keyBase, count + 1);

    return {
      key: count === 0 ? keyBase : `${keyBase}-${count + 1}`,
      part,
    };
  });
}

function getSummaryPreviewText(summary: LayerSummary, wordLimit = 6) {
  const words = summary.body
    .map(part => (typeof part === 'string' ? part : part.code))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  return `${words.slice(0, wordLimit).join(' ')}${words.length > wordLimit ? '...' : ''}`;
}

const summaryComplexityClasses: Record<LayerSummaryComplexity, { icon: string; label: string; level: 1 | 2 | 3 }> = {
  high: {
    icon: 'text-[#f97316]',
    label: 'High complexity',
    level: 3,
  },
  low: {
    icon: 'text-[#fb923c]',
    label: 'Low complexity',
    level: 1,
  },
  level2: {
    icon: 'text-[#fb923c]',
    label: 'Level 2 complexity',
    level: 2,
  },
  medium: {
    icon: 'text-[#facc15]',
    label: 'Medium complexity',
    level: 2,
  },
};

const layerSummariesByLayerId: Record<string, LayerSummary[]> = {
  'architecture-impact': [
    {
      body: [
        'Keeps the review stack contracts isolated by shaping the new public schema exports before downstream services consume the artifact.',
      ],
      complexity: 'medium',
      id: 'architecture-public-contracts',
      lines: '6 lines',
      range: '47-52',
    },
  ],
  'artifact-builder': [
    {
      body: [
        'Adds an Invite teammate button and a pending-invitations list with resend/revoke actions to the Members page.',
      ],
      complexity: 'high',
      id: 'ui-members-page-invite-actions',
      lines: '43 lines',
      pathLabel: 'src/pages/settings/MembersPage.tsx',
      range: '20-62',
    },
    {
      body: [
        'Dialog to enter an email and pick a role, with inline validation and a pending state while the invite is sent.',
      ],
      complexity: 'medium',
      id: 'ui-invite-member-dialog',
      lines: '53 lines',
      pathLabel: 'src/pages/settings/InviteMemberDialog.tsx',
      range: '18-70',
    },
    {
      body: ['React Query hook wrapping list/create/revoke, with optimistic updates for the pending list.'],
      complexity: 'medium',
      id: 'ui-use-invitations-hook',
      lines: '35 lines',
      pathLabel: 'src/pages/settings/useInvitations.ts',
      range: '10-44',
    },
    {
      body: ['Reusable role picker (Admin / Member / Viewer) with a short description for each role.'],
      complexity: 'low',
      id: 'ui-role-select',
      lines: '33 lines',
      pathLabel: 'src/components/RoleSelect.tsx',
      range: '8-40',
    },
  ],
  'blast-radius': [
    {
      body: [
        'Limits the review surface to stack payload normalization, schema parsing, and the generated artifact read model.',
      ],
      complexity: 'medium',
      id: 'blast-radius-review-surface',
      lines: '6 lines',
      range: '24-29',
    },
  ],
  overview: [
    {
      body: [
        'The invitation stack is open and grouped into data model, API/email, and members UI layers with one merge blocker still outstanding.',
      ],
      complexity: 'low',
      id: 'overview-open-invitation-stack',
      lines: '3 layers',
      range: '1-3',
    },
  ],
  schemas: [
    {
      body: [
        'New ',
        { code: 'Invitation' },
        ' model with email, role, single-use token, status, and ',
        { code: 'expiresAt' },
        ' timestamp, linked to the inviting org.',
      ],
      complexity: 'high',
      id: 'data-model-invitation',
      lines: '19 lines',
      pathLabel: 'prisma/schema.prisma',
      range: '40-58',
    },
    {
      body: ['New ', { code: 'MemberRole' }, ' enum (ADMIN, MEMBER, VIEWER) used by both invitations and members.'],
      complexity: 'medium',
      id: 'data-model-member-role',
      lines: '7 lines',
      pathLabel: 'prisma/schema.prisma',
      range: '60-66',
    },
    {
      body: [
        'Creates the ',
        { code: 'Invitation' },
        ' table and the ',
        { code: 'MemberRole' },
        ' enum type, with a unique index on the invite token.',
      ],
      complexity: 'medium',
      id: 'data-model-invitation-migration',
      lines: '21 lines',
      pathLabel: 'prisma/migrations/20260624_add_invitations/migration.sql',
      range: '1-21',
    },
  ],
  storage: [
    {
      body: [
        { code: 'createInvitation' },
        ' builds the invite token, sets a 7-day expiry, persists the row, and hands off to the email sender.',
      ],
      complexity: 'high',
      id: 'api-create-invitation',
      lines: '29 lines',
      pathLabel: 'src/server/invitations/invitationService.ts',
      range: '18-46',
    },
    {
      body: [
        { code: 'acceptInvitation' },
        ' validates the token and expiry, then creates the membership with the invited role.',
      ],
      complexity: 'high',
      id: 'api-accept-invitation',
      lines: '25 lines',
      pathLabel: 'src/server/invitations/invitationService.ts',
      range: '48-72',
    },
    {
      body: [{ code: 'GET /invitations' }, " returns the org's pending invitations for the members settings page."],
      complexity: 'medium',
      id: 'api-list-invitations-route',
      lines: '19 lines',
      pathLabel: 'src/server/invitations/invitationRouter.ts',
      range: '12-30',
    },
    {
      body: [
        { code: 'POST /invitations' },
        ' validates input, checks the admin gate, and delegates to ',
        { code: 'createInvitation' },
        '.',
      ],
      complexity: 'high',
      id: 'api-create-invitations-route',
      lines: '21 lines',
      pathLabel: 'src/server/invitations/invitationRouter.ts',
      range: '32-52',
    },
    {
      body: ["Renders the invitation email with the accept link and the inviter's name and role."],
      complexity: 'medium',
      id: 'api-invitation-email',
      lines: '31 lines',
      pathLabel: 'src/server/email/invitationEmail.ts',
      range: '10-40',
    },
    {
      body: ['Adds ', { code: 'canInviteMembers' }, ', restricting invitation create/revoke to org admins.'],
      complexity: 'medium',
      id: 'api-can-invite-members',
      lines: '17 lines',
      pathLabel: 'src/server/auth/permissions.ts',
      range: '24-40',
    },
  ],
};

const defaultOpenSummaryIds = Object.values(layerSummariesByLayerId).flatMap(summaries => {
  const firstSummary = summaries[0];

  return firstSummary ? [firstSummary.id] : [];
});

/** Initializes the requested view while expanding the first summary in each fixture layer. */
export const createDefaultReviewStackScreenState = (activeLayerId = 'storage'): ReviewStackScreenState => ({
  activeLayerId,
  openSummaryIds: defaultOpenSummaryIds,
});

// Faithful SVG artwork from the live Change Stack sidebar, inspected 2026-09-18.
// Kept local to this product depiction; these are not website control icons.
const sidebarIconArtwork = {
  layers: (
    <>
      <path d='M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z'></path>
      <path d='m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845'></path>
    </>
  ),
  files: (
    <>
      <path d='M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z'></path>
      <path d='M14 2v5a1 1 0 0 0 1 1h5'></path>
      <path d='M10 9H8'></path>
      <path d='M16 13H8'></path>
      <path d='M16 17H8'></path>
    </>
  ),
  overview: (
    <>
      <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
      <path d='M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
    </>
  ),
  'blast-radius': (
    <>
      <path d='M16.247 7.761a6 6 0 0 1 0 8.478'></path>
      <path d='M19.075 4.933a10 10 0 0 1 0 14.134'></path>
      <path d='M4.925 19.067a10 10 0 0 1 0-14.134'></path>
      <path d='M7.753 16.239a6 6 0 0 1 0-8.478'></path>
      <circle cx='12' cy='12' r='2'></circle>
    </>
  ),
  'architecture-impact': (
    <>
      <ellipse cx='12' cy='5' rx='9' ry='3'></ellipse>
      <path d='M3 5V19A9 3 0 0 0 21 19V5'></path>
      <path d='M3 12A9 3 0 0 0 21 12'></path>
    </>
  ),
  qa: (
    <>
      <path d='M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2'></path>
      <path d='M6.453 15h11.094'></path>
      <path d='M8.5 2h7'></path>
    </>
  ),
  open: (
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M5.616 4.928a2.487 2.487 0 0 1-1.119.922c-.148.06-.458.138-.458.138v5.008a2.51 2.51 0 0 1 1.579 1.062c.273.412.419.895.419 1.388.008.343-.057.684-.19 1A2.485 2.485 0 0 1 3.5 15.984a2.482 2.482 0 0 1-1.388-.419A2.487 2.487 0 0 1 1.05 13c.095-.486.331-.932.68-1.283.349-.343.79-.579 1.269-.68V5.949a2.6 2.6 0 0 1-1.269-.68 2.503 2.503 0 0 1-.68-1.283 2.487 2.487 0 0 1 1.06-2.565A2.49 2.49 0 0 1 3.5 1a2.504 2.504 0 0 1 1.807.729 2.493 2.493 0 0 1 .729 1.81c.002.494-.144.978-.42 1.389zm-.756 7.861a1.5 1.5 0 0 0-.552-.579 1.45 1.45 0 0 0-.77-.21 1.495 1.495 0 0 0-1.47 1.79 1.493 1.493 0 0 0 1.18 1.179c.288.058.586.03.86-.08.276-.117.512-.312.68-.56.15-.226.235-.49.249-.76a1.51 1.51 0 0 0-.177-.78zM2.708 4.741c.247.161.536.25.83.25.271 0 .538-.075.77-.211a1.514 1.514 0 0 0 .729-1.359 1.513 1.513 0 0 0-.25-.76 1.551 1.551 0 0 0-.68-.56 1.49 1.49 0 0 0-.86-.08 1.494 1.494 0 0 0-1.179 1.18c-.058.288-.03.586.08.86.117.276.312.512.56.68zm10.329 6.296c.48.097.922.335 1.269.68.466.47.729 1.107.725 1.766.002.493-.144.977-.42 1.388a2.499 2.499 0 0 1-4.532-.899 2.5 2.5 0 0 1 1.067-2.565c.267-.183.571-.308.889-.37V5.489a1.5 1.5 0 0 0-1.5-1.499H8.687l1.269 1.27-.71.709L7.117 3.84v-.7l2.13-2.13.71.711-1.269 1.27h1.85a2.484 2.484 0 0 1 2.312 1.541c.125.302.189.628.187.957v5.548zm.557 3.509a1.493 1.493 0 0 0 .191-1.89 1.552 1.552 0 0 0-.68-.559 1.49 1.49 0 0 0-.86-.08 1.493 1.493 0 0 0-1.179 1.18 1.49 1.49 0 0 0 .08.86 1.496 1.496 0 0 0 2.448.49z'></path>
  ),
};

/** Renders the inspected product artwork; the surrounding row owns its accessible label. */
function SidebarIcon({
  name,
  className = 'size-3.5 shrink-0',
}: Readonly<{ name: keyof typeof sidebarIconArtwork; className?: string }>) {
  const isStatus = name === 'open';

  return (
    <svg
      viewBox={isStatus ? '0 0 16 16' : '0 0 24 24'}
      fill={isStatus ? 'currentColor' : 'none'}
      stroke='currentColor'
      strokeWidth={isStatus ? 0 : name === 'layers' ? 2.25 : 2}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      data-sidebar-icon={name}
      className={className}>
      {sidebarIconArtwork[name]}
    </svg>
  );
}

function GitHubIcon({ className = 'h-3 w-3' }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' className={className}>
      <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
    </svg>
  );
}

function DocumentIcon({ className = 'h-3 w-3 opacity-70 text-[#facc15]' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      data-slot='icon'
      data-layer-complexity-icon='medium'
      className={className}>
      <path
        fillRule='evenodd'
        d='M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z'
        clipRule='evenodd'
      />
      <path d='M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z' />
    </svg>
  );
}

function TypeScriptFileIcon({ className = 'h-3.5 w-3.5 shrink-0' }: Readonly<{ className?: string }>) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-[0.2rem] bg-[#2b2a33] font-mono text-[0.5rem] font-bold leading-none text-[#bbb6c2]',
        className
      )}
      data-pierre-file-icon='file-tree-builtin-typescript'
      aria-hidden='true'>
      TS
    </span>
  );
}

function EyeIcon({ className = 'h-3 w-3 text-[#9b95a0]' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path d='M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' />
      <path
        fillRule='evenodd'
        d='M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function SparklesIcon({ className = 'h-3.5 w-3.5 shrink-0' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path
        fillRule='evenodd'
        d='M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function CommentBubbleIcon({ className = 'h-3.5 w-3.5 shrink-0' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path
        fillRule='evenodd'
        d='M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 0 0-.266.112L8.78 21.53A.75.75 0 0 1 7.5 21v-3.955a48.842 48.842 0 0 1-2.652-.316c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function CopyDocumentIcon({ className = 'h-3.5 w-3.5' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path d='M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z' />
      <path d='M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z' />
    </svg>
  );
}

function CheckCircleIcon({ className = 'h-4 w-4' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path
        fillRule='evenodd'
        d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function ResetProgressIcon({ className = 'h-4 w-4' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path
        fillRule='evenodd'
        d='M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function FollowCodeIcon({ className = 'h-4 w-4' }: Readonly<{ className?: string }>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}>
      <path d='M6 3a3 3 0 0 0-3 3v1.5a.75.75 0 0 0 1.5 0V6A1.5 1.5 0 0 1 6 4.5h1.5a.75.75 0 0 0 0-1.5H6ZM16.5 3a.75.75 0 0 0 0 1.5H18A1.5 1.5 0 0 1 19.5 6v1.5a.75.75 0 0 0 1.5 0V6a3 3 0 0 0-3-3h-1.5ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5ZM4.5 16.5a.75.75 0 0 0-1.5 0V18a3 3 0 0 0 3 3h1.5a.75.75 0 0 0 0-1.5H6A1.5 1.5 0 0 1 4.5 18v-1.5ZM21 16.5a.75.75 0 0 0-1.5 0V18a1.5 1.5 0 0 1-1.5 1.5h-1.5a.75.75 0 0 0 0 1.5H18a3 3 0 0 0 3-3v-1.5Z' />
    </svg>
  );
}

function ChevronsUpDownIcon({ className = 'h-3.5 w-3.5' }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={className}>
      <path d='m7 15 5 5 5-5' />
      <path d='m7 9 5-5 5 5' />
    </svg>
  );
}

const COMPLEXITY_ICON_VERTICAL_OFFSETS: Record<1 | 2 | 3, number> = {
  1: -1.875,
  2: 0,
  3: 1.875,
};

function ComplexityChevronIcon({
  className = 'h-3.5 w-3.5',
  level,
}: Readonly<{
  className?: string;
  level: 1 | 2 | 3;
}>) {
  const paths = ['M4 11.25 L8 8.5 L12 11.25', 'M4 7.5 L8 4.75 L12 7.5', 'M4 3.75 L8 1 L12 3.75'];

  return (
    <svg viewBox='0 0 16 16' fill='currentColor' aria-hidden='true' className={className}>
      <g transform={`translate(0 ${COMPLEXITY_ICON_VERTICAL_OFFSETS[level]})`}>
        {paths.slice(0, level).map(path => (
          <path
            key={path}
            d={path}
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='1.6'
          />
        ))}
      </g>
    </svg>
  );
}

/** Decorative pull-request glyph paired with the fixture's textual status. */
function PullRequestOpenIcon({ className = 'h-3 w-3' }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' className={className}>
      <path d='M16 19.25a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Zm-14.5 0a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Zm0-14.5a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0ZM4.75 3a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 3Zm0 14.5a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 17.5Zm14.5 0a1.75 1.75 0 1 0 .001 3.501 1.75 1.75 0 0 0-.001-3.501Z' />
      <path d='M13.405 1.72a.75.75 0 0 1 0 1.06L12.185 4h4.065A3.75 3.75 0 0 1 20 7.75v8.75a.75.75 0 0 1-1.5 0V7.75a2.25 2.25 0 0 0-2.25-2.25h-4.064l1.22 1.22a.75.75 0 0 1-1.061 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 0ZM4.75 7.25A.75.75 0 0 1 5.5 8v8A.75.75 0 0 1 4 16V8a.75.75 0 0 1 .75-.75Z' />
    </svg>
  );
}

/** Decorative directional affordance; this glyph does not supply interaction semantics. */
function Chevron({
  direction = 'right',
  className = 'h-3.5 w-3.5',
}: Readonly<{ direction?: 'right' | 'down'; className?: string }>) {
  return (
    <svg
      aria-hidden='true'
      className={cx(className, direction === 'down' && 'rotate-90')}
      viewBox='0 0 12 12'
      fill='none'>
      <path
        d='m4.25 2.5 3.5 3.5-3.5 3.5'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

/** Uses non-focusable chrome in depiction-only mode and a pressed button when interactive. */
function RightPanelSegmentedButton({
  active,
  children,
  hoverOnly = false,
  onClick,
}: Readonly<{
  active: boolean;
  children: ReactNode;
  hoverOnly?: boolean;
  onClick?: () => void;
}>) {
  const className = cx(
    'relative z-10 flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-sm px-2 text-[0.75rem] font-medium transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]',
    hoverOnly ? 'cursor-default' : 'active:scale-[0.98]',
    active ? 'bg-[#25232a] text-[#f4f1f5] shadow-sm hover:bg-[#2c2931]' : 'text-[#8f8996] hover:text-[#c9c2cc]'
  );

  if (hoverOnly) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button type='button' aria-pressed={active} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function IconButton({
  chrome = 'always',
  label,
  children,
  onClick,
}: Readonly<{
  chrome?: 'always' | 'hover';
  label: string;
  children: ReactNode;
  onClick?: () => void;
}>) {
  const interactive = Boolean(onClick);

  const className = cx(
    'group/btn flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.25rem] border text-[#b5afba] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:text-white',
    interactive
      ? 'active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'
      : 'cursor-default',
    chrome === 'hover'
      ? 'border-transparent bg-transparent hover:border-[#34303a] hover:bg-[#1c1a20]'
      : 'border-[#34303a] bg-[#1c1a20] hover:bg-[#29262e]'
  );

  if (!interactive) {
    return (
      <div aria-label={label} title={label} className={className}>
        {children}
      </div>
    );
  }

  return (
    <button type='button' aria-label={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

/** Shares compact status typography between the toolbar and Overview row, preserving their icons. */
function PullRequestStatusPill({ icon }: Readonly<{ icon: ReactNode }>) {
  return (
    <span
      title={`Pull request: ${reviewStackMockData.review.status}`}
      className='inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-cui-success-subtle px-1.5 py-0.5 text-[0.75rem] font-medium leading-4 text-cui-success'>
      {icon}
      {reviewStackMockData.review.status}
    </span>
  );
}

/** Renders a fixture count with its semantic tone and optional accessible label. */
function CountPill({ kind, label, value }: Readonly<{ kind: string; label?: string; value: string }>) {
  const documentIconClassName = documentCountIconClasses[kind];
  let icon = <span className='h-1.5 w-1.5 rounded-full bg-current' />;

  if (documentIconClassName) {
    icon = <DocumentIcon className={documentIconClassName} />;
  } else if (kind === 'viewed') {
    icon = <EyeIcon />;
  }

  return (
    <span
      data-count-kind={kind}
      aria-label={label ? `${value} ${label}` : undefined}
      className={cx(
        'inline-flex h-5 min-w-7 items-center justify-center gap-1 rounded-full border px-1.5 text-[0.625rem] font-semibold leading-none tabular-nums',
        label && 'px-2',
        countToneClasses[kind] ?? countToneClasses.notes
      )}>
      {icon}
      {value}
      {label && <span className='font-medium'>{label}</span>}
    </span>
  );
}

/** Combines selectable fixture layers with static product navigation. */
function LeftSidebar({
  activeLayerId,
  layerHoverCardPresentation = 'hover',
  openLayerHoverCardId,
  setOpenLayerHoverCardId,
  setActiveLayerId,
  showLayerHoverCards,
  staticPreview = false,
}: Readonly<{
  activeLayerId: string;
  layerHoverCardPresentation?: LayerHoverCardPresentation;
  openLayerHoverCardId?: string | null;
  setOpenLayerHoverCardId?: (id: string | null) => void;
  setActiveLayerId: (id: string) => void;
  showLayerHoverCards: boolean;
  staticPreview?: boolean;
}>) {
  return (
    <aside
      aria-label='Review stack layers and files'
      className={cx(
        'flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col px-2 py-1',
        showLayerHoverCards ? 'overflow-visible' : 'overflow-hidden',
        styles.reviewStackSidebar
      )}>
      <div data-review-sidebar-header className='flex items-center gap-1 border-b border-cui-neutral/50 pb-2 pt-1.5'>
        <div className='mr-auto flex min-w-0 items-center gap-1'>
          <span className='inline-flex h-7 items-center gap-1.5 rounded-full bg-cui-neutral px-2 text-sm font-medium text-cui-primary'>
            <SidebarIcon name='layers' />
            Layers
          </span>
          <span className='inline-flex h-7 items-center gap-1.5 rounded-full bg-cui-base-2 px-2 text-sm text-cui-secondary'>
            <SidebarIcon name='files' />
            Files
          </span>
        </div>
        <span aria-label='Collapse sidebar' className='grid size-7 shrink-0 place-items-center text-cui-secondary'>
          <CompactSidebarIcon className='size-3.5' />
        </span>
      </div>

      <div
        data-review-sidebar-items
        className={cx(
          'mt-2 flex min-h-0 flex-1 flex-col gap-0.5',
          showLayerHoverCards ? 'overflow-visible' : 'overflow-hidden'
        )}>
        {sidebarLayerItems.map((item, index) => (
          <Fragment key={item.id}>
            <LayerRow
              item={item}
              active={item.targetLayerId === activeLayerId}
              hoverCardPresentation={layerHoverCardPresentation}
              onSelect={() => {
                setActiveLayerId(item.targetLayerId);
              }}
              onToggleHoverCard={() => setOpenLayerHoverCardId?.(openLayerHoverCardId === item.id ? null : item.id)}
              openHoverCard={openLayerHoverCardId === item.id}
              showHoverCard={showLayerHoverCards}
              staticPreview={staticPreview}
            />
            {index === 2 && (
              <>
                <div className='flex min-h-8 items-center gap-2 rounded-md p-1.5 text-[0.8125rem] text-cui-secondary'>
                  <span className='grid size-5 shrink-0 place-items-center'>
                    <SidebarIcon name='qa' />
                  </span>
                  QA Agent
                </div>
                <div aria-hidden='true' className='my-1 border-t border-cui-neutral/50' />
              </>
            )}
          </Fragment>
        ))}
      </div>
    </aside>
  );
}

/** Returns product artwork for metadata rows, leaving numbered layers to their text marker. */
function getLayerIcon(icon: SidebarLayerItem['icon']) {
  if (icon === 'overview') {
    return <SidebarIcon name='overview' />;
  }

  if (icon === 'blast-radius') {
    return <SidebarIcon name='blast-radius' />;
  }

  if (icon === 'architecture-impact') {
    return <SidebarIcon name='architecture-impact' />;
  }

  return null;
}

/** Keeps metadata artwork distinct from the ordered numbers used by selectable layers. */
function LayerLeadingMarker({ item }: Readonly<{ item: SidebarLayerItem }>) {
  const icon = getLayerIcon(item.icon);

  return (
    <span
      className={cx(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded text-cui-secondary',
        !icon && 'bg-cui-base-2 font-mono text-[0.625rem] font-normal tabular-nums'
      )}>
      {icon ?? item.marker}
    </span>
  );
}

/** Preserves layer selection and optional hover-card behavior while static rows remain non-focusable. */
function LayerRow({
  active,
  hoverCardPresentation,
  item,
  onSelect,
  onToggleHoverCard,
  openHoverCard,
  showHoverCard,
  staticPreview = false,
}: Readonly<{
  active: boolean;
  hoverCardPresentation: LayerHoverCardPresentation;
  item: SidebarLayerItem;
  onSelect: () => void;
  onToggleHoverCard: () => void;
  openHoverCard: boolean;
  showHoverCard: boolean;
  staticPreview?: boolean;
}>) {
  const hoverOnly = staticPreview && hoverOnlySidebarLayerIds.has(item.id);
  const layer = item.targetLayerId === 'overview' ? undefined : layersById.get(item.targetLayerId);
  const pinnedHoverCard = hoverCardPresentation === 'pinned-large';
  const hoverCardId = showHoverCard && layer ? `layer-hover-card-${item.id}` : undefined;
  const rowContent = (
    <>
      <LayerLeadingMarker item={item} />
      <span className='min-w-0 flex-1'>
        <span className='flex min-w-0 items-center justify-between gap-1.5'>
          <span
            title={item.title}
            className={cx(
              'min-w-0 whitespace-normal break-words leading-5',
              item.icon ? 'text-[0.8125rem] font-normal text-cui-secondary' : 'text-sm font-semibold text-cui-primary'
            )}>
            {item.title}
          </span>
          {item.icon === 'overview' && (
            <PullRequestStatusPill icon={<SidebarIcon name='open' className='size-3 shrink-0' />} />
          )}
        </span>
        {item.counts
          .filter(count => count.kind.startsWith('files'))
          .map(count => (
            <Badge
              key={`${item.id}-${count.kind}`}
              size='sm'
              variant='neutral'
              className='mt-1 whitespace-nowrap tabular-nums'>
              {count.value} files touched
            </Badge>
          ))}
      </span>
    </>
  );
  const rowClassName = cx(
    'group flex min-h-8 w-full min-w-0 items-start gap-2 overflow-hidden rounded-md p-1.5 text-left transition-[background-color,transform] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]',
    active ? 'bg-cui-neutral-subtle' : 'hover:bg-cui-base-2',
    hoverOnly ? 'cursor-default' : cx(pinnedHoverCard && 'cursor-pointer', 'active:scale-[0.99]')
  );

  if (hoverOnly || (staticPreview && (!showHoverCard || !layer))) {
    return (
      <div aria-label={item.ariaLabel} className={rowClassName}>
        {rowContent}
      </div>
    );
  }

  if (!showHoverCard || !layer || item.icon) {
    return (
      <CarrotPressable
        type='button'
        data-review-layer-id={item.targetLayerId}
        aria-label={item.ariaLabel}
        aria-pressed={active}
        onClick={onSelect}
        className={rowClassName}>
        {rowContent}
      </CarrotPressable>
    );
  }

  const handleLayerClick = () => {
    if (pinnedHoverCard) {
      if (!openHoverCard) onSelect();
      onToggleHoverCard();
      return;
    }

    onSelect();
  };

  return (
    <div
      className={cx(styles.layerRowHoverTarget, pinnedHoverCard && styles.layerRowPinnedTarget)}
      data-open={pinnedHoverCard && openHoverCard ? 'true' : undefined}>
      {staticPreview ? (
        <div aria-describedby={hoverCardId} aria-label={item.ariaLabel} className={rowClassName}>
          {rowContent}
        </div>
      ) : (
        <CarrotPressable
          type='button'
          data-review-layer-id={item.targetLayerId}
          aria-describedby={hoverCardId}
          aria-expanded={pinnedHoverCard ? openHoverCard : undefined}
          aria-label={item.ariaLabel}
          aria-pressed={active}
          onClick={handleLayerClick}
          className={rowClassName}>
          {rowContent}
        </CarrotPressable>
      )}
      <LayerHoverCard
        counts={item.counts}
        id={hoverCardId}
        large={pinnedHoverCard}
        layer={layer}
        marker={item.marker}
        onClose={pinnedHoverCard && openHoverCard ? onToggleHoverCard : undefined}
      />
    </div>
  );
}

function getCountLabel(kind: string, value: string) {
  const plural = value !== '1';

  if (kind.startsWith('files')) return plural ? 'files' : 'file';
  if (kind === 'risk') return plural ? 'risks' : 'risk';
  if (kind === 'review') return plural ? 'reviews' : 'review';
  if (kind === 'checks') return plural ? 'checks' : 'check';
  if (kind === 'comments') return plural ? 'comments' : 'comment';

  return kind;
}

function getLayerDisplayNumber(layerId: string, fallbackNumber: string) {
  const sidebarItem = sidebarLayerItems.find(item => item.targetLayerId === layerId && item.marker);
  return (sidebarItem?.marker ?? fallbackNumber).padStart(2, '0');
}

function LayerHoverCard({
  counts,
  id,
  large = false,
  layer,
  marker,
  onClose,
}: Readonly<{
  counts: SidebarLayerItem['counts'];
  id?: string;
  large?: boolean;
  layer: Layer;
  marker: string;
  onClose?: () => void;
}>) {
  const dependencies = layer.dependsOn.flatMap(dependencyId => {
    const dependency = layersById.get(dependencyId);
    return dependency ? [dependency] : [];
  });
  const fileCount = counts.find(count => count.kind.startsWith('files'));
  const reviewCounts = counts.filter(count => !count.kind.startsWith('files'));

  return (
    <div
      id={id}
      role={onClose ? 'button' : 'tooltip'}
      tabIndex={onClose ? 0 : undefined}
      aria-label={onClose ? `Close ${layer.title} layer details` : undefined}
      className={cx(styles.layerHoverCard, large && styles.layerHoverCardLarge)}
      onClick={onClose}
      onKeyDown={event => {
        if (!onClose || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onClose();
      }}>
      <div className='flex min-w-0 items-start gap-2'>
        <span className='flex size-5 shrink-0 items-center justify-center rounded border border-cardBorder bg-neutral-800 font-mono text-[0.625rem] font-bold text-gray-300'>
          {marker.padStart(2, '0')}
        </span>
        <h3 className='min-w-0 flex-1 text-[0.9375rem] font-semibold leading-5 text-gray-50'>{layer.title}</h3>
        {fileCount && (
          <CountPill
            kind={fileCount.kind}
            label={getCountLabel(fileCount.kind, fileCount.value)}
            value={fileCount.value}
          />
        )}
      </div>

      <p className={cx(styles.layerHoverDescription, 'mt-2 text-[0.8125rem] leading-5 text-gray-300')}>
        {layer.description}
      </p>

      <div className='mt-3 flex min-w-0 items-center gap-2 border-t border-cardBorder pt-2.5'>
        <span className='shrink-0 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-gray-400'>
          Depends on
        </span>
        {dependencies.length > 0 ? (
          <div className='flex min-w-0 items-center gap-2'>
            <span aria-hidden='true' className='shrink-0 text-gray-500'>
              →
            </span>
            {dependencies.map(dependency => (
              <span
                key={dependency.id}
                className='inline-flex min-w-0 items-center gap-1.5 text-[0.75rem] leading-4 text-gray-100'>
                <span className='flex size-4 shrink-0 items-center justify-center rounded-sm border border-cardBorder bg-neutral-800 font-mono text-[0.5625rem] font-bold text-gray-300'>
                  {getLayerDisplayNumber(dependency.id, dependency.number)}
                </span>
                <span className='truncate'>{dependency.title}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className='min-w-0 truncate text-[0.75rem] leading-4 text-gray-400'>None · foundation layer</span>
        )}
      </div>

      {reviewCounts.length > 0 && (
        <div
          className='mt-2.5 flex flex-wrap justify-end gap-1.5 border-t border-cardBorder pt-2.5'
          aria-label={`Layer ${marker} review counts`}>
          {reviewCounts.map(count => (
            <CountPill
              key={`${layer.id}-hover-${count.kind}`}
              kind={count.kind}
              label={getCountLabel(count.kind, count.value)}
              value={count.value}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaStats({ delta }: Readonly<{ delta: string }>) {
  const deltaParts = delta.match(/[+-]\d+/g) ?? [];
  const deletions = deltaParts.find(part => part.startsWith('-'));
  const additions = deltaParts.find(part => part.startsWith('+'));

  return (
    <span className='inline-flex shrink-0 items-center gap-1.5 font-mono text-[0.75rem] font-normal tabular-nums'>
      {deletions && <span className='text-[#ff8f98]'>{deletions}</span>}
      {additions && <span className='text-[#65e6a6]'>{additions}</span>}
    </span>
  );
}

type FileHeaderSummaryFile = Pick<LayerFileReview, 'delta' | 'path'>;

function FileHeaderSummary({
  chevronDirection,
  file,
  staticPreview = false,
}: Readonly<{ chevronDirection: 'down' | 'right'; file: Pick<LayerFileReview, 'path'>; staticPreview?: boolean }>) {
  const copyPathControl = (
    <span
      aria-label={`Copy file path ${file.path}`}
      className='flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#aaa3ae]'>
      <CopyDocumentIcon />
    </span>
  );

  return (
    <div className='flex min-w-0 flex-1 items-center gap-2'>
      <Chevron direction={chevronDirection} className='h-4 w-4 shrink-0 text-[#b6b0bb]' />
      <FileIconForPath className='h-3.5 w-3.5 shrink-0' path={file.path} />
      <span
        aria-label='Modified'
        className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.25rem] border-2 border-[var(--color-cui-mauve-8)] text-[var(--color-cui-mauve-8)]'>
        <span className='h-2 w-2 rounded-full bg-[var(--color-cui-mauve-8)]' />
      </span>
      <span className='flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden'>
        <span className='min-w-0 truncate text-left font-mono font-normal text-[0.8125rem] text-[#f0eaf2]'>
          {file.path}
        </span>
        {staticPreview ? (
          copyPathControl
        ) : (
          <button
            type='button'
            aria-label={`Copy file path ${file.path}`}
            title='Copy file path'
            className='flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#aaa3ae] transition-colors duration-150 ease-out hover:bg-[#302c35] hover:text-[#f4f1f5] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'>
            <CopyDocumentIcon />
          </button>
        )}
      </span>
    </div>
  );
}

function FileHeaderReviewControls({
  file,
  staticPreview = false,
}: Readonly<{ file: FileHeaderSummaryFile; staticPreview?: boolean }>) {
  const commentControl = (
    <span
      aria-label={`Add file comment on ${file.path}`}
      className='flex h-6 w-7 items-center justify-center rounded text-[#aaa3ae]'>
      <CommentBubbleIcon />
    </span>
  );

  return (
    <>
      <DeltaStats delta={file.delta} />
      {staticPreview ? (
        commentControl
      ) : (
        <button
          type='button'
          aria-label={`Add file comment on ${file.path}`}
          title='Add file comment'
          className='flex h-6 w-7 items-center justify-center rounded text-[#aaa3ae] transition-colors duration-150 ease-out hover:bg-[#302c35] hover:text-[#f4f1f5] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'>
          <CommentBubbleIcon />
        </button>
      )}
    </>
  );
}

function ReviewFileIcon({ className = 'h-4 w-4' }: Readonly<{ className?: string }>) {
  return (
    <svg aria-hidden='true' className={className} viewBox='0 0 16 16' fill='none'>
      <path d='M4 2.25h5.2L12 5.05v8.7H4v-11.5Z' fill='currentColor' opacity='0.24' />
      <path d='M4 2.25h5.2L12 5.05v8.7H4v-11.5Z' stroke='currentColor' strokeWidth='1.25' strokeLinejoin='round' />
      <path d='M9.2 2.25v3H12' stroke='currentColor' strokeWidth='1.25' strokeLinejoin='round' />
    </svg>
  );
}

function FileIconForPath({ className = 'h-4 w-4 shrink-0', path }: Readonly<{ className?: string; path: string }>) {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    return <TypeScriptFileIcon className={className} />;
  }

  return <ReviewFileIcon className={cx(className, 'text-[#a9a3ae]')} />;
}

function MiddleScrollRegion({
  ariaLabel,
  children,
  className,
}: Readonly<{
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section aria-label={ariaLabel} className={cx('min-h-0 flex-1 overflow-hidden', className)}>
      {children}
    </section>
  );
}

function LayerFileStack({
  files,
  staticPreview = false,
}: Readonly<{ files: LayerFileReview[]; staticPreview?: boolean }>) {
  return (
    <MiddleScrollRegion ariaLabel='Layer file review stack' className='bg-[#18161c]'>
      <div className='min-h-full'>
        {files.map(file => (
          <ReviewFileCard key={file.id} file={file} staticPreview={staticPreview} />
        ))}
      </div>
    </MiddleScrollRegion>
  );
}

function ReviewFileCard({ file, staticPreview = false }: Readonly<{ file: LayerFileReview; staticPreview?: boolean }>) {
  const open = file.expanded && file.splitRows.length > 0;

  return (
    <article
      aria-label={`${file.path} ${open ? 'expanded' : 'collapsed'}`}
      className='border-b border-[#332f39] last:border-b-0'>
      <ReviewFileHeader file={file} open={open} staticPreview={staticPreview} />
      {open && <SplitDiffView file={file} />}
    </article>
  );
}

function ReviewFileHeader({
  file,
  open,
  staticPreview = false,
}: Readonly<{ file: LayerFileReview; open: boolean; staticPreview?: boolean }>) {
  const viewedControl = (
    <span className='flex h-7 shrink-0 items-center gap-1.5 rounded-[0.25rem] bg-[#302d36] px-2 text-[0.75rem] font-medium text-[#f4f1f5]'>
      <CheckCircleIcon />
      {file.reviewState}
    </span>
  );

  return (
    <div
      className={cx(
        'flex h-10 shrink-0 items-center justify-between gap-3 bg-[#201e24] px-3',
        open && 'border-b border-[#332f39]'
      )}>
      <FileHeaderSummary chevronDirection={open ? 'down' : 'right'} file={file} staticPreview={staticPreview} />

      <div className='flex min-w-0 shrink-0 items-center gap-2'>
        <FileHeaderReviewControls file={file} staticPreview={staticPreview} />
        {staticPreview ? (
          viewedControl
        ) : (
          <button
            type='button'
            aria-pressed='false'
            aria-label={`${file.reviewState} for ${file.path}`}
            className='flex h-7 shrink-0 items-center gap-1.5 rounded-[0.25rem] bg-[#302d36] px-2 text-[0.75rem] font-medium text-[#f4f1f5] transition-[background-color,transform] duration-150 ease-out hover:bg-[#3b3740] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'>
            <CheckCircleIcon />
            {file.reviewState}
          </button>
        )}
      </div>
    </div>
  );
}

function SplitDiffView({ file }: Readonly<{ file: LayerFileReview }>) {
  return (
    <div className='bg-[#18161c] font-mono font-normal text-[0.6875rem] leading-5'>
      {file.unmodifiedLabel && (
        <div className='grid h-8 grid-cols-2 border-b border-[#34303a] bg-[#2a2830] text-[0.75rem] text-[#aaa3ae]'>
          <div className='flex items-center px-3'>{file.unmodifiedLabel}</div>
          <div aria-hidden='true' className='border-l border-[#3d3842]' />
        </div>
      )}
      <div data-diff-type='split' className='overflow-hidden'>
        {file.splitRows.map(row => (
          <div
            key={`${file.id}-${row.type}-${row.leftLine}-${row.rightLine}-${row.leftCode}-${row.rightCode}`}
            className='grid grid-cols-2'>
            <DiffCodeLine path={file.path} row={row} side='left' />
            <DiffCodeLine path={file.path} row={row} side='right' />
          </div>
        ))}
      </div>
    </div>
  );
}

function DiffCodeLine({ path, row, side }: Readonly<{ path: string; row: SplitDiffRow; side: 'left' | 'right' }>) {
  const isLeft = side === 'left';
  const line = isLeft ? row.leftLine : row.rightLine;
  const code = isLeft ? row.leftCode : row.rightCode;
  const isChange = row.type === 'change';
  const isInsert = row.type === 'insert';
  const isDelete = row.type === 'delete';
  const isInsertSide = (isInsert || isChange) && !isLeft;
  const isDeleteSide = (isDelete || isChange) && isLeft;
  const isEmptyInsertSide = isInsert && isLeft;
  const isEmptyDeleteSide = isDelete && !isLeft;

  return (
    <div
      style={isEmptyInsertSide || isEmptyDeleteSide ? emptyInsertSideStyle : undefined}
      className={cx(
        'grid min-h-5 grid-cols-[2.4rem_minmax(0,1fr)] items-stretch overflow-hidden',
        isLeft && 'border-r border-[#332f39]',
        !isLeft && 'border-l border-[#332f39]',
        isInsertSide && 'border-l-2 border-[#65e6a6] bg-[#203929]/90 text-[#d6f9df]',
        isDeleteSide && 'border-l-2 border-[#f87171] bg-[#4a2529]/85 text-[#f7a6ad]',
        (isEmptyInsertSide || isEmptyDeleteSide) && 'text-[#706a75]',
        !isInsert && !isDelete && !isChange && 'text-[#d6d0d7]'
      )}>
      <span
        className={cx(
          'select-none px-2 text-right tabular-nums',
          isInsertSide && 'text-[#65e6a6]',
          isDeleteSide && 'text-[#f87171]',
          !isInsertSide && !isDeleteSide && 'text-[#85808c]'
        )}>
        {line}
      </span>
      <code className='min-w-0 overflow-hidden text-ellipsis whitespace-pre pr-3'>{renderDiffCode(code, path)}</code>
    </div>
  );
}

const prismaTokenPattern =
  /(@@?\w+|\b(?:model|enum)\b|\b(?:Invitation|MemberRole|InvitationStatus|Organization|String|DateTime)\b|\b(?:ADMIN|MEMBER|VIEWER|PENDING|ACCEPTED|REVOKED)\b|\b(?:fields|references|now|cuid)\b)/g;

const typescriptTokenPattern =
  /("[^"]*"|\b(?:import|from|export|function|const|return|await|async|boolean)\b|\b(?:Member|Invitation)\b|\b(?:useInvitations|useQuery|useMutation|useQueryClient|trpc|queryClient|list|createMutation|revokeMutation|old|invite|id|previous|member|role)\b|!==|===|=>|\?\?|[:=])/g;

function renderDiffCode(code: string, path: string) {
  if (!code) return null;
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return renderTypeScriptCode(code);

  let tokenOffset = 0;

  return code.split(prismaTokenPattern).map(part => {
    if (!part) return null;
    const key = `${part}-${tokenOffset}`;
    tokenOffset += part.length;
    const tokenClassName = getPrismaTokenClassName(part);

    return tokenClassName ? (
      <span key={key} className={tokenClassName}>
        {part}
      </span>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    );
  });
}

function renderTypeScriptCode(code: string) {
  const trimmedCode = code.trim();
  if (trimmedCode.startsWith('/**') || trimmedCode.startsWith('*') || trimmedCode.startsWith('*/')) {
    return <span className='text-[#9aa29d]'>{code}</span>;
  }

  let tokenOffset = 0;

  return code.split(typescriptTokenPattern).map(part => {
    if (!part) return null;
    const key = `${part}-${tokenOffset}`;
    tokenOffset += part.length;
    const tokenClassName = getTypeScriptTokenClassName(part);

    return tokenClassName ? (
      <span key={key} className={tokenClassName}>
        {part}
      </span>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    );
  });
}

function getPrismaTokenClassName(token: string) {
  if (token === 'model' || token === 'enum') return 'text-[#ff7a92]';
  if (token.startsWith('@')) return 'text-[#c084fc]';
  if (token === 'String' || token === 'DateTime') return 'text-[#60a5fa]';
  if (token === 'fields' || token === 'references') return 'text-[#fb923c]';
  if (token === 'now' || token === 'cuid') return 'text-[#93c5fd]';
  if (/^(Invitation|MemberRole|InvitationStatus|Organization)$/.test(token)) return 'text-[#a78bfa]';
  if (/^(ADMIN|MEMBER|VIEWER|PENDING|ACCEPTED|REVOKED)$/.test(token)) return 'text-[#e8e2ea]';

  return '';
}

function getTypeScriptTokenClassName(token: string) {
  if (/^(import|from|export|function|const|return|await)$/.test(token)) return 'text-[#ff7a92]';
  if (token === 'async') return 'text-[#fb923c]';
  if (token === 'boolean') return 'text-[#60a5fa]';
  if (/^(Member|Invitation)$/.test(token)) return 'text-[#a78bfa]';
  if (/^".*"$/.test(token)) return 'text-[#93c5fd]';
  if (/^(useInvitations|useQuery|useMutation|useQueryClient|trpc)$/.test(token)) return 'text-[#a78bfa]';
  if (/^(queryClient|list|createMutation|revokeMutation|old|invite|id|previous|member)$/.test(token)) {
    return 'text-[#fb923c]';
  }
  if (token === 'role') return 'text-[#d6d0d7]';
  if (token === '===' || token === '!==' || token === '=>' || token === '??' || token === ':' || token === '=') {
    return 'text-[#f87171]';
  }

  return '';
}

/** Shows fixture metadata across every grid column; submission remains illustrative chrome. */
function PullRequestToolbar({ showStack = true }: Readonly<{ showStack?: boolean }>) {
  const {copy, editable} = useReviewStackEditor();
  const review = {...reviewStackMockData.review, title: copy?.title ?? reviewStackMockData.review.title, repo: copy?.repo ?? reviewStackMockData.review.repo, pr: copy?.pr ?? reviewStackMockData.review.pr};

  return (
    <header aria-label='Pull request toolbar' className={styles.reviewStackToolbar}>
      <PullRequestStatusPill icon={<PullRequestOpenIcon className='h-3 w-3 shrink-0' />} />
      <div className='flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap'>
        <span
          {...editable('title', 'Edit pull request title on canvas', 90)}
          title={review.title}
          className='max-w-1/2 shrink-0 truncate text-sm font-semibold leading-5 text-cui-primary'>
          {review.title}
        </span>
        <span aria-hidden='true' className='shrink-0 text-xs text-cui-secondary'>
          |
        </span>
        <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-xs leading-4 text-cui-secondary'>
          <span title={`${review.repo} ${review.pr}`} className='inline-flex shrink-0 items-center gap-1'>
            <GitHubIcon className='h-3 w-3 shrink-0' />
            <span>
              <span {...editable('repo', 'Edit repository on canvas', 60)}>{review.repo}</span>{' '}
              <span {...editable('pr', 'Edit pull request number on canvas', 20)} className='tabular-nums'>{review.pr}</span>
            </span>
          </span>
          <span aria-hidden='true'>·</span>
          <span className='shrink-0'>{review.files}</span>
          {showStack && (
            <>
              <span aria-hidden='true'>·</span>
              <span title={`Stack: ${review.stack}`} className='truncate'>
                Stack: {review.stack}
              </span>
            </>
          )}
        </div>
      </div>
      <div className='flex h-8 shrink-0 cursor-default items-center gap-1 rounded border border-cui-neutral bg-cui-base-2 px-2 text-xs text-cui-primary'>
        Submit review
        <Chevron direction='down' className='h-4 w-4' />
      </div>
    </header>
  );
}

/** Displays the selected fixture layer and lets the static preview suppress file interactions. */
function CenterPanel({
  activeLayer,
  staticPreview = false,
}: Readonly<{ activeLayer: Layer; staticPreview?: boolean }>) {
  const layerFiles = layerFilesByLayerId[activeLayer.id] ?? layerFilesByLayerId.schemas ?? [];

  return (
    <main
      aria-label='Review stack file review'
      className='flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-x border-cui-neutral bg-cui-base-2'>
      <section className='min-w-0 shrink-0 whitespace-normal break-words border-b border-cui-neutral px-4 py-3 leading-5'>
        <h2 className='inline text-[1rem] font-semibold leading-5 text-cui-primary'>{activeLayer.title}</h2>
        <span aria-hidden='true' className='mx-2 text-cui-tertiary'>
          |
        </span>
        <p className='inline text-[0.75rem] leading-5 text-cui-secondary'>{activeLayer.description}</p>
      </section>

      <LayerFileStack files={layerFiles} staticPreview={staticPreview} />
    </main>
  );
}

/** Shows summaries for the selected fixture layer with independently controlled expansion and scrolling. */
function RightPanel({
  activeLayerId,
  openSummaryIds,
  scrollable = true,
  staticPreview = false,
  toggleSummary,
}: Readonly<{
  activeLayerId: string;
  openSummaryIds: string[];
  scrollable?: boolean;
  staticPreview?: boolean;
  toggleSummary: (id: string) => void;
}>) {
  const visibleSummaries = layerSummariesByLayerId[activeLayerId] ?? layerSummariesByLayerId.schemas;
  const summaryCount = visibleSummaries.length;
  const summaryProgress = `${summaryCount}/${summaryCount}`;

  return (
    <aside
      aria-label='Review stack context panel'
      className={cx('flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-2', styles.reviewStackRightSidebar)}>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <IconButton label='Toggle context panel' chrome='hover'>
          <CompactSidebarIcon />
        </IconButton>
        <div className='flex min-w-0 items-center gap-1 text-xs'>
          <span className='inline-flex items-center gap-1 rounded-full bg-cui-neutral px-2 py-1 text-cui-primary'>
            <BookOpenIcon className='size-3.5' />
            Context
          </span>
          <span className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-cui-secondary'>
            <ArrowUpRightIcon className='size-3.5' />
            Continue
          </span>
        </div>
      </div>
      <div className='border-b border-[#302d36] pb-2'>
        <div className='grid grid-cols-2 rounded-md border border-[var(--color-cui-mauve-5)] bg-[var(--color-cui-mauve-1)] p-0.5'>
          <RightPanelSegmentedButton hoverOnly active>
            <SparklesIcon />
            <span className='min-w-0 truncate'>Summaries {summaryCount}</span>
          </RightPanelSegmentedButton>
          <RightPanelSegmentedButton hoverOnly active={false}>
            <CommentBubbleIcon />
            <span className='min-w-0 truncate'>Comments</span>
          </RightPanelSegmentedButton>
        </div>

        <div className='mt-1.5 flex h-9 items-center justify-between gap-2 rounded-md border border-[#302d36] bg-[#24212a] px-1.5 py-1 text-[0.75rem] text-[#bdb6c2]'>
          <div
            className='flex min-w-0 items-center gap-1.5 truncate'
            aria-label={`Summary ${summaryProgress}, ${summaryProgress} summaries seen`}>
            <span
              className='inline-flex shrink-0 items-center gap-1 font-mono font-normal tabular-nums text-[#f4f1f5]'
              title={`Summary ${summaryProgress}`}>
              <SparklesIcon className='h-3 w-3 text-[#aaa3ae]' />
              {summaryProgress}
            </span>
            <span aria-hidden='true' className='text-[#716a78]'>
              ·
            </span>
            <span
              className='inline-flex min-w-0 items-center gap-1 font-mono font-normal tabular-nums text-[#bdb6c2]'
              title={`${summaryProgress} summaries seen`}>
              <EyeIcon className='h-3 w-3 shrink-0 text-[#aaa3ae]' />
              <span className='truncate'>{summaryProgress}</span>
            </span>
          </div>
          <div className='flex shrink-0 items-center gap-1'>
            <div
              role='img'
              aria-label='Review progress status'
              title='Review progress status'
              className='flex h-6 w-6 cursor-default items-center justify-center rounded text-[#aaa3ae] transition-colors duration-150 ease-out hover:bg-[#302c35] hover:text-[#f4f1f5]'>
              <ResetProgressIcon />
            </div>
            <div
              role='img'
              aria-label='Following code'
              title='Following code'
              className='flex h-6 w-6 cursor-default items-center justify-center rounded bg-[#6f3416] text-[#fb923c] transition-colors duration-150 ease-out hover:bg-[#7c3f1d]'>
              <FollowCodeIcon />
            </div>
          </div>
        </div>

        <div className='mt-1.5 flex items-center justify-between gap-2 text-[0.75rem] text-[#dcd6df]'>
          <span className='font-medium'>Complexity</span>
          <div
            role='group'
            aria-label='Complexity visibility indicators'
            className='inline-flex shrink-0 items-center overflow-hidden rounded-md border border-[#34303a] bg-[#151319]'>
            <div
              role='img'
              aria-label='All summaries visible'
              title='All summaries visible'
              className='flex h-7 w-8 cursor-default items-center justify-center border-r border-[#34303a] text-[#aaa3ae] transition-colors duration-150 ease-out hover:bg-[#24212a] hover:text-[#f4f1f5]'>
              <ChevronsUpDownIcon />
            </div>
            <div
              role='img'
              aria-label='High complexity summaries visible'
              title='High complexity summaries visible'
              className='flex h-7 w-8 cursor-default items-center justify-center border-r border-[#34303a] bg-[#f97316]/15 text-[#f97316] transition-colors duration-150 ease-out hover:bg-[#f97316]/20'>
              <ComplexityChevronIcon level={3} />
            </div>
            <div
              role='img'
              aria-label='Medium complexity summaries visible'
              title='Medium complexity summaries visible'
              className='flex h-7 w-8 cursor-default items-center justify-center border-r border-[#34303a] bg-[#facc15]/15 text-[#facc15] transition-colors duration-150 ease-out hover:bg-[#facc15]/20'>
              <ComplexityChevronIcon level={2} />
            </div>
            <div
              role='img'
              aria-label='Low complexity summaries available'
              title='Low complexity summaries available'
              className='flex h-7 w-8 cursor-default items-center justify-center text-[#aaa3ae] transition-colors duration-150 ease-out hover:bg-[#24212a] hover:text-[#f4f1f5]'>
              <ComplexityChevronIcon level={1} />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cx(
          'mt-3 flex flex-col gap-2 pr-1',
          styles.reviewStackRightFeed,
          scrollable && styles.reviewStackRightFeedScrollable
        )}>
        {visibleSummaries.map(summary => (
          <LayerSummaryCard
            key={summary.id}
            summary={summary}
            open={openSummaryIds.includes(summary.id)}
            staticPreview={staticPreview}
            onToggle={() => {
              toggleSummary(summary.id);
            }}
          />
        ))}
      </div>
    </aside>
  );
}

function LayerSummaryCard({
  onToggle,
  open,
  staticPreview = false,
  summary,
}: Readonly<{
  onToggle: () => void;
  open: boolean;
  staticPreview?: boolean;
  summary: LayerSummary;
}>) {
  const complexity = summaryComplexityClasses[summary.complexity];
  const summaryBodyParts = useMemo(() => getSummaryBodyParts(summary), [summary]);
  const summaryPreviewText = useMemo(() => getSummaryPreviewText(summary), [summary]);
  const handleCollapsedKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (open || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    onToggle();
  };

  const className = cx(
    'group/summary relative overflow-hidden rounded-md border border-[#403946] bg-[#242129] px-2 py-1.5 text-[#f1edf3] shadow-sm transition-colors duration-150 ease-out',
    !open &&
      !staticPreview &&
      'cursor-pointer hover:border-[#51475a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'
  );
  const cardContent = (
    <>
      <div className='flex items-center gap-1.5'>
        <span
          role='img'
          aria-label={complexity.label}
          title={complexity.label}
          className='inline-flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-sm border border-[#34303a] bg-[#302d36]'>
          <ComplexityChevronIcon className={cx('h-3.5 w-3.5', complexity.icon)} level={complexity.level} />
        </span>
        <span className='min-w-0 flex-1 truncate text-[0.75rem] leading-5 text-[#eee9f0]' title={summaryPreviewText}>
          {summaryPreviewText}
        </span>
        {open && (
          <span className='shrink-0 rounded border border-[#34303a] bg-[#302d36] px-1.5 py-0 font-mono text-[0.6875rem] font-normal leading-5 text-[#f0edf2]'>
            {summary.range}
          </span>
        )}
        <span className='ml-auto flex shrink-0 items-center gap-1'>
          {summary.seen && (
            <span
              className='inline-flex h-6 w-6 items-center justify-center rounded border border-[#34303a] bg-[#302d36] text-[#aaa3ae]'
              title='Seen'
              aria-label='Seen'>
              <EyeIcon className='h-3.5 w-3.5 text-[#aaa3ae]' />
            </span>
          )}
          {open && !staticPreview ? (
            <button
              type='button'
              aria-expanded={open}
              aria-label='Collapse summary'
              title='Collapse summary'
              onClick={onToggle}
              className='flex h-6 w-6 items-center justify-center rounded text-[#aaa3ae] transition-colors duration-150 ease-out hover:bg-[#302c35] hover:text-[#f4f1f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'>
              <Chevron direction='down' className='h-4 w-4' />
            </button>
          ) : (
            <span
              aria-hidden='true'
              className='flex h-6 w-6 items-center justify-center rounded text-[#aaa3ae] transition-colors duration-150 ease-out group-hover/summary:bg-[#302c35] group-hover/summary:text-[#f4f1f5]'>
              <Chevron direction='right' className='h-4 w-4' />
            </span>
          )}
        </span>
      </div>

      {open && !staticPreview && (
        <div className='pt-1.5'>
          <div className='mb-1.5 font-mono font-normal text-[0.6875rem] leading-4 text-[#9b95a0]'>{summary.lines}</div>
          <p className='text-[0.8125rem] leading-5 text-[#eee9f0]'>
            {summaryBodyParts.map(({ key, part }) =>
              typeof part === 'string' ? (
                <Fragment key={key}>{part}</Fragment>
              ) : (
                <code
                  key={key}
                  className='rounded bg-[#3a3640] px-1 py-0.5 font-mono text-[0.75rem] font-bold text-[#f2edf4]'>
                  {part.code}
                </code>
              )
            )}
          </p>
          {summary.showActions !== false && (
            <div className='mt-2 flex justify-end gap-2'>
              <LayerSummaryActionButton>
                <GitHubIcon className='h-4 w-4' />
                Comment
              </LayerSummaryActionButton>
              <LayerSummaryActionButton>
                <CodeRabbitCircleIcon />
                Chat with AI
              </LayerSummaryActionButton>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (!open && !staticPreview) {
    return (
      <div
        role='button'
        tabIndex={0}
        aria-expanded={false}
        aria-label={`Expand summary: ${summaryPreviewText}`}
        onClick={onToggle}
        onKeyDown={handleCollapsedKeyDown}
        className={className}>
        {cardContent}
      </div>
    );
  }

  return <article className={className}>{cardContent}</article>;
}

function LayerSummaryActionButton({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <button
      type='button'
      className='flex h-7 min-w-0 items-center justify-center gap-1.5 rounded border border-[#3a3540] bg-[#201e25] px-2 text-[0.6875rem] font-medium text-[#f2edf4] transition-[background-color,transform] duration-150 ease-out hover:bg-[#2c2931] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f04006]'>
      {children}
    </button>
  );
}

const HERO_PREVIEW_ACTIVE_LAYER_ID = 'storage';
const HERO_PREVIEW_ACTIVE_LAYER =
  reviewStackMockData.layers.find(layer => layer.id === HERO_PREVIEW_ACTIVE_LAYER_ID) ?? reviewStackMockData.layers[0];
const ignoreHeroPreviewInteraction = () => undefined;

/** Fixed-size decorative hero depiction with no focusable review controls. */
export const ReviewStackHeroPreview = memo(function ReviewStackHeroPreview({
  className = '',
}: Readonly<{ className?: string }>) {
  return (
    <div aria-hidden='true' className={cx(styles.reviewStackScreen, styles.reviewStackNoTopLeftLighting, className)}>
      <div className='grid h-full min-h-0 grid-cols-[16rem_36rem_18rem] grid-rows-[auto_minmax(0,1fr)] font-sans'>
        <PullRequestToolbar />
        <div className='relative z-40 h-full min-h-0 min-w-0'>
          <LeftSidebar
            activeLayerId={HERO_PREVIEW_ACTIVE_LAYER_ID}
            setActiveLayerId={ignoreHeroPreviewInteraction}
            showLayerHoverCards
            staticPreview
          />
        </div>
        <div className={cx('h-full min-h-0 min-w-0', styles.reviewStackCenterColumn)}>
          <CenterPanel activeLayer={HERO_PREVIEW_ACTIVE_LAYER} staticPreview />
        </div>
        <div className='h-full min-h-0 min-w-0'>
          <RightPanel
            activeLayerId={HERO_PREVIEW_ACTIVE_LAYER_ID}
            openSummaryIds={[]}
            staticPreview
            toggleSummary={ignoreHeroPreviewInteraction}
          />
        </div>
      </div>
    </div>
  );
});

/**
 * Interactive fixture shared by Home and the gated Change Stack hero.
 * Passing state delegates updates to onStateChange; otherwise the screen owns its state.
 * Parent surfaces can own the frame or omit the context panel without changing the toolbar span.
 */
export default function ReviewStackScreen({
  chrome = true,
  defaultActiveLayerId = 'storage',
  hideRightPanel = false,
  layerHoverCardPresentation = 'hover',
  onStateChange,
  removeTopLeftLighting = false,
  renderWorkspace,
  rightPanelScrollable = true,
  showGraphToolbar = true,
  showLayerHoverCards = false,
  squareBottomLeft = false,
  state,
}: Readonly<{
  /**
   * When false, the screen renders without its own border/background/radius so
   * a parent surface can own the chrome without drawing a nested wrapper line.
   */
  chrome?: boolean;
  /** Initial selection for an uncontrolled screen. */
  defaultActiveLayerId?: string;
  hideRightPanel?: boolean;
  layerHoverCardPresentation?: LayerHoverCardPresentation;
  onStateChange?: (state: ReviewStackScreenState) => void;
  removeTopLeftLighting?: boolean;
  /** Lets a parent coordinate panel transitions without remounting the toolbar or sidebar. */
  renderWorkspace?: (panels: ReactNode) => ReactNode;
  rightPanelScrollable?: boolean;
  /** Shows the decorative zoom, fit, and reset toolbar in graph views. */
  showGraphToolbar?: boolean;
  showLayerHoverCards?: boolean;
  squareBottomLeft?: boolean;
  state?: ReviewStackScreenState;
}> = {}) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [internalState, setInternalState] = useState(() => createDefaultReviewStackScreenState(defaultActiveLayerId));
  const screenState = state ?? internalState;
  const { activeLayerId, openSummaryIds } = screenState;
  const graphView = activeLayerId === 'architecture-impact' || activeLayerId === 'blast-radius';
  const [openLayerHoverCardId, setOpenLayerHoverCardId] = useState<string | null>(() => {
    if (layerHoverCardPresentation !== 'pinned-large' || activeLayerId === 'overview') return null;

    return sidebarLayerItems.find(item => item.targetLayerId === activeLayerId)?.id ?? null;
  });
  // Controlled parents can select Overview without calling our local selection handler.
  if (activeLayerId === 'overview' && openLayerHoverCardId !== null) {
    setOpenLayerHoverCardId(null);
  }

  const updateScreenState = useCallback(
    (updater: (current: ReviewStackScreenState) => ReviewStackScreenState) => {
      if (state) {
        onStateChange?.(updater(screenState));
        return;
      }

      setInternalState(updater);
    },
    [onStateChange, screenState, state]
  );
  const setActiveLayerId = useCallback(
    (nextActiveLayerId: string) => {
      if (nextActiveLayerId === 'overview') setOpenLayerHoverCardId(null);
      updateScreenState(current => ({
        ...current,
        activeLayerId: nextActiveLayerId,
      }));
    },
    [updateScreenState]
  );

  const activeLayer = useMemo(
    () => reviewStackMockData.layers.find(layer => layer.id === activeLayerId) ?? reviewStackMockData.layers[0],
    [activeLayerId]
  );

  const selectOverviewLayer = (id: string) => {
    setActiveLayerId(id);
    screenRef.current?.querySelector<HTMLButtonElement>(`[data-review-layer-id="${id}"]`)?.focus();
  };

  const toggleSummary = (id: string) => {
    updateScreenState(current => ({
      ...current,
      openSummaryIds: current.openSummaryIds.includes(id)
        ? current.openSummaryIds.filter(item => item !== id)
        : [...current.openSummaryIds, id],
    }));
  };

  const workspace = (
    <>
      <div
        data-review-panel='content'
        className={cx('h-full min-h-0 min-w-0', styles.reviewStackCenterColumn)}
        style={graphView && !hideRightPanel ? { gridColumn: 'span 2' } : undefined}>
        <div className='h-full min-h-0'>
          {graphView ? (
            <ReviewStackImpactViews key={activeLayerId} mode={activeLayerId} showToolbar={showGraphToolbar} />
          ) : activeLayerId === 'overview' ? (
            <ReviewStackOverviewContent onSelectLayer={selectOverviewLayer} />
          ) : (
            <CenterPanel activeLayer={activeLayer} />
          )}
        </div>
      </div>
      {!hideRightPanel && !graphView && (
        <div data-review-panel='context' className='h-full min-h-0 min-w-0'>
          <div className='h-full min-h-0'>
            {activeLayerId === 'overview' ? (
              <ReviewStackOverviewActivity />
            ) : (
              <RightPanel
                activeLayerId={activeLayerId}
                openSummaryIds={openSummaryIds}
                scrollable={rightPanelScrollable}
                toggleSummary={toggleSummary}
              />
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      ref={screenRef}
      aria-label='Interactive review stack preview'
      data-review-view={activeLayerId}
      className={cx(
        styles.reviewStackScreen,
        removeTopLeftLighting && styles.reviewStackNoTopLeftLighting,
        chrome && styles.reviewStackChrome,
        chrome && squareBottomLeft && styles.reviewStackChromeSquareBottomLeft
      )}>
      <div
        className={cx(
          'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] font-sans',
          hideRightPanel
            ? 'grid-cols-[var(--review-stack-sidebar-width,16rem)_minmax(0,1fr)]'
            : 'grid-cols-[var(--review-stack-sidebar-width,16rem)_minmax(0,1fr)_var(--review-stack-context-width,minmax(15rem,21%))]'
        )}>
        <PullRequestToolbar showStack={activeLayerId !== 'overview'} />
        <div
          data-review-panel='sidebar'
          className={cx('h-full min-h-0 min-w-0', showLayerHoverCards && 'relative z-40')}>
          <LeftSidebar
            activeLayerId={activeLayerId}
            layerHoverCardPresentation={layerHoverCardPresentation}
            openLayerHoverCardId={activeLayerId === 'overview' ? null : openLayerHoverCardId}
            setOpenLayerHoverCardId={setOpenLayerHoverCardId}
            setActiveLayerId={setActiveLayerId}
            showLayerHoverCards={showLayerHoverCards}
          />
        </div>
        {renderWorkspace ? renderWorkspace(workspace) : workspace}
      </div>
    </div>
  );
}
