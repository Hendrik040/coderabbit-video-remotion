import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  CircleStackIcon,
  CodeBracketIcon,
  CommandLineIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  Square3Stack3DIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/16/solid';
import { useId, type CSSProperties } from 'react';
import styles from './ReviewStackImpactViews.module.css';

type ImpactNode = {
  id: string;
  title: string;
  kind: string;
  status: 'New' | 'Changed' | 'Unchanged';
  description: string;
  icon: typeof Squares2X2Icon;
  x: number;
  y: number;
};

// Illustrative invitation-PR data, styled after the live Change Stack graph views.
const architectureNodes: ImpactNode[] = [
  {
    id: 'members',
    title: 'Members settings',
    kind: 'component',
    status: 'Changed',
    description: 'Invite teammates, choose their role, and manage pending invitations.',
    icon: Squares2X2Icon,
    x: 5,
    y: 49,
  },
  {
    id: 'service',
    title: 'Invitation API',
    kind: 'api · service',
    status: 'New',
    description: 'Create and accept invitations with an admin gate and single-use tokens.',
    icon: CommandLineIcon,
    x: 40,
    y: 34,
  },
  {
    id: 'model',
    title: 'Invitation data model',
    kind: 'data',
    status: 'New',
    description: 'Stores the invited email, role, token, status, and expiration.',
    icon: CircleStackIcon,
    x: 40,
    y: 67,
  },
  {
    id: 'email',
    title: 'Email delivery',
    kind: 'service',
    status: 'Unchanged',
    description: 'Delivers the invitation template through the shared email sender.',
    icon: EnvelopeIcon,
    x: 70,
    y: 49,
  },
];

const blastOwners = [
  { ...architectureNodes[1], x: 36, y: 49, blocks: 1, rangeCount: 5 },
  { ...architectureNodes[2], x: 77, y: 49, blocks: 4, rangeCount: 3 },
];

const blastContext = [
  { id: 'permissions', title: 'permissions.ts', x: 13, y: 21, rangeCount: 3 },
  { id: 'email', title: 'invitationEmail.ts', x: 14, y: 79, rangeCount: 2 },
];

/** Positions the static diagram cards in the shared canvas coordinate space. */
function nodePosition(node: Pick<ImpactNode, 'x' | 'y'>, index: number): CSSProperties {
  return { left: `${String(node.x)}%`, top: `${String(node.y)}%`, opacity: `var(--product-node-${index}, 1)`, translate: `0 calc((1 - var(--product-node-${index}, 1)) * 8px)` };
}

/** Depicts the product's graph toolbar without adding interactive controls. */
function GraphToolbar() {
  return (
    <div className={styles.controls} aria-hidden='true'>
      <span>
        <MagnifyingGlassMinusIcon />
      </span>
      <span>
        <MagnifyingGlassPlusIcon />
      </span>
      <span>
        <ArrowsPointingOutIcon />
      </span>
      <span>
        <ArrowPathIcon />
      </span>
    </div>
  );
}

/** Shows changed responsibilities and their connections inside service boundaries. */
function ArchitectureCanvas() {
  const arrowId = useId();
  // Each card occupies 25% of the canvas in both axes; paths meet its edges in the same 1000 × 700 space.
  return (
    <>
      <div className={`${styles.boundary} ${styles.webBoundary}`}>
        <div className={styles.boundaryHeading}>
          <strong>Web application</strong>
          <span>Client</span>
        </div>
      </div>
      <div className={`${styles.boundary} ${styles.serverBoundary}`}>
        <div className={styles.boundaryHeading}>
          <strong>Application server</strong>
          <span>Service</span>
        </div>
      </div>
      <svg
        className={`${styles.connections} ${styles.architectureConnections}`}
        viewBox='0 0 1000 700'
        preserveAspectRatio='none'
        aria-hidden='true'>
        <defs>
          <marker id={arrowId} viewBox='0 0 8 8' refX='7' refY='4' markerWidth='5' markerHeight='5' orient='auto'>
            <path className={styles.arrowHead} d='M1 1 L7 4 L1 7' />
          </marker>
        </defs>
        <path
          data-change='new'
          d='M300 430.5 H338 Q350 430.5 350 418.5 V337.5 Q350 325.5 362 325.5 H397'
          markerEnd={`url(#${arrowId})`}
        />
        <path data-change='new' d='M525 413 V466' markerEnd={`url(#${arrowId})`} />
        <path data-change='new' d='M650 325.5 H815 Q825 325.5 825 335.5 V340' markerEnd={`url(#${arrowId})`} />
      </svg>
      <span className={`${styles.edgeLabel} ${styles.requestEdge}`}>Creates invitation</span>
      <span className={`${styles.edgeLabel} ${styles.persistEdge}`}>Persists token and role</span>
      <span className={`${styles.edgeLabel} ${styles.emailEdge}`}>Sends invite</span>
      {architectureNodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <div key={node.id} className={styles.architectureNode} style={nodePosition(node, index)} data-status={node.status}>
            <div className={styles.architectureNodeHeader}>
              <Icon aria-hidden='true' />
              <span className={styles.nodeHeading}>{node.title}</span>
            </div>
            <p className={styles.nodeDescription}>{node.description}</p>
            <div className={styles.architectureNodeFooter}>
              <span>{node.kind}</span>
              <span className={styles.badge} data-status={node.status}>
                {node.status}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Depicts added components, expanded neutral context, and evidence along dependency edges. */
function BlastCanvas() {
  const arrowId = useId();
  return (
    <>
      <svg
        className={`${styles.connections} ${styles.blastConnections}`}
        viewBox='0 0 1000 700'
        preserveAspectRatio='none'
        aria-hidden='true'>
        <defs>
          <marker
            id={arrowId}
            viewBox='0 0 8 8'
            refX='7'
            refY='4'
            markerWidth='5'
            markerHeight='5'
            orient='auto-start-reverse'>
            <path className={styles.arrowHead} d='M0 0 L8 4 L0 8 Z' />
          </marker>
        </defs>
        <path d='M415 343 L265 213' markerEnd={`url(#${arrowId})`} />
        <path d='M560 380 H770' markerEnd={`url(#${arrowId})`} />
        <path d='M425 424 L275 553' markerEnd={`url(#${arrowId})`} />
      </svg>
      <div className={`${styles.relationship} ${styles.permissionRelationship}`}>
        <span aria-hidden='true'>→</span>
        <span>Checks the organization admin gate before creating an invitation.</span>
        <span className={styles.contextBadge}>Related context</span>
      </div>
      <div className={`${styles.relationship} ${styles.modelRelationship}`}>
        <span aria-hidden='true'>→</span>
        <span>Persists the single-use token, invited role, and expiration.</span>
        <span className={styles.contextBadge}>Related context</span>
      </div>
      <div className={`${styles.relationship} ${styles.emailRelationship}`}>
        <span aria-hidden='true'>→</span>
        <span>Sends the invite link through the shared email delivery service.</span>
        <span className={styles.contextBadge}>Related context</span>
      </div>
      {blastContext.map((node, index) => (
        <div key={node.id} className={styles.contextCard} style={nodePosition(node, index)}>
          <span className={styles.nodeHeading}>
            {node.title}
            <span className={styles.rangeCount}>
              <CodeBracketIcon aria-hidden='true' />
              {node.rangeCount}
            </span>
          </span>
          <span className={styles.contextBadge}>Related context</span>
        </div>
      ))}
      {blastOwners.map((node, index) => (
        <div
          key={node.id}
          className={styles.owner}
          style={nodePosition(node, index)}
          data-stacked={node.blocks > 1}
          data-highlighted={node.id === 'service'}>
          <div className={styles.ownerCard} data-status={node.status}>
            <span className={styles.nodeHeading}>
              {node.title}
              <span className={styles.rangeCount}>
                <CodeBracketIcon aria-hidden='true' />
                {node.rangeCount}
              </span>
            </span>
            <span className={styles.nodeKind}>{node.kind}</span>
            <span className={styles.ownerFooter}>
              <span className={styles.badge} data-status={node.status}>
                {node.status === 'New' ? 'Added' : node.status}
              </span>
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

/** Visual-only product graph fixtures; the surrounding review navigation selects the view. */
export default function ReviewStackImpactViews({
  mode,
  showToolbar = true,
}: Readonly<{ mode: 'architecture-impact' | 'blast-radius'; showToolbar?: boolean }>) {
  const architecture = mode === 'architecture-impact';
  const title = architecture ? 'Architecture impact' : 'Security blast radius';
  return (
    <section className={styles.canvas} data-view={mode} aria-label={`${title} illustration`}>
      <div className={styles.graph}>{architecture ? <ArchitectureCanvas /> : <BlastCanvas />}</div>
      <div className={styles.overlay}>
        <div className={styles.summary}>
          <span className={styles.exampleLabel}>Illustrative PR</span>
          {architecture ? (
            <div className={styles.summaryCounts}>
              <span>2 systems</span>
              <span>3 edges</span>
            </div>
          ) : (
            <>
              <div className={styles.summaryActions}>
                <span>
                  <Square3Stack3DIcon aria-hidden='true' />
                  Expand all
                </span>
                <span>
                  <ShieldCheckIcon aria-hidden='true' />
                  Security · 0
                </span>
              </div>
              <div className={styles.summaryCounts}>
                <span>{blastOwners.filter(node => node.status === 'New').length} Added</span>
                <span>1 Upstream</span>
                <span>1 Downstream</span>
              </div>
            </>
          )}
        </div>
        {architecture && (
          <div className={styles.viewControls}>
            <div className={styles.tabs} aria-label='Architecture diagram view'>
              <span className={`${styles.tab} ${styles.selectedTab}`}>Structural diff</span>
              <span className={styles.tab}>Before</span>
              <span className={styles.tab}>After</span>
            </div>
            <div className={styles.legend} aria-label='Architecture change legend'>
              {['Unchanged', 'Changed', 'New', 'Removed'].map(status => (
                <span key={status}>
                  <i data-status={status} />
                  {status}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {architecture && (
        <span className={styles.changeCount}>
          Example: {architectureNodes.filter(node => node.status === 'New').length} added ·{' '}
          {architectureNodes.filter(node => node.status === 'Changed').length} changed
        </span>
      )}
      {showToolbar && <GraphToolbar />}
    </section>
  );
}
