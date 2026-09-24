'use client';

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  CodeBracketIcon,
  CpuChipIcon,
  EyeIcon,
  FunnelIcon,
  RocketLaunchIcon,
} from '@heroicons/react/16/solid';
import { useId, useRef, useState, type ReactNode } from 'react';
import CarrotPressable from './CarrotPressable';
import {useReviewStackEditor} from './ReviewStackEditor';
import {
  activityCategories,
  defaultActivityCategories,
  overviewActivity,
  overviewBlockers,
  overviewFindings,
  overviewLayers,
  overviewMetrics,
  overviewReview,
  overviewSeverityCounts,
  type OverviewActivityCategory,
  type OverviewActivityItem,
} from './reviewStackOverviewData';
import { CodeRabbitCircleIcon, CompactSidebarIcon } from './ReviewStackProductIcons';
import styles from './ReviewStackOverview.module.css';

const activityIcons: Record<OverviewActivityCategory, ReactNode> = {
  coderabbit: <CodeRabbitCircleIcon className={styles.rabbitMark} />,
  reviews: <EyeIcon />,
  commits: <CodeBracketIcon />,
  comments: <ChatBubbleLeftIcon />,
  'pr-status': <RocketLaunchIcon />,
  bots: <CpuChipIcon />,
};

/** Formats fixture counts without assuming the current collection length. */
const formatCount = (count: number, noun: string) => `${String(count)} ${noun}${count === 1 ? '' : 's'}`;
/** Keeps the attention heading grammatical as fixture findings are added or removed. */
const formatAttentionCount = (count: number) =>
  `${formatCount(count, 'item')} ${count === 1 ? 'needs' : 'need'} attention`;

/** Keeps a metric, its visualization, and its footer together in one inset panel. */
function OverviewStat({
  title,
  value,
  unit,
  children,
  footer,
}: Readonly<{ title: string; value: number; unit: string; children: ReactNode; footer: ReactNode }>) {
  return (
    <section className={styles.stat}>
      <h3>{title}</h3>
      <div className={styles.statBody}>
        <p className={styles.metric}>
          <span>{value}</span>
          <span className={styles.metricUnit}>{unit}</span>
        </p>
        {children}
        <div className={styles.statFooter}>{footer}</div>
      </div>
    </section>
  );
}

/** Keeps each local disclosure independently operable and uniquely named. */
function OverviewDisclosure({
  title,
  defaultOpen = false,
  severity,
  children,
}: Readonly<{
  title: string;
  defaultOpen?: boolean;
  severity?: 'Critical' | 'Minor';
  children: ReactNode;
}>) {
  const {ui, onUiChange} = useReviewStackEditor();
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = ui ? ui.overviewOpenIds.includes(title) : localOpen;
  const toggle = () => onUiChange && ui
    ? onUiChange({overviewOpenIds: open ? ui.overviewOpenIds.filter(id => id !== title) : [...ui.overviewOpenIds, title]})
    : setLocalOpen(current => !current);
  const contentId = useId();

  return (
    <section className={styles.disclosure}>
      <h3>
        <CarrotPressable
          className={styles.disclosureTrigger}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => {
            toggle();
          }}>
          <ChevronDownIcon aria-hidden='true' className={styles.disclosureChevron} />
          <span>{title}</span>
          {severity && (
            <span className={styles.severity} data-severity={severity}>
              {severity}
            </span>
          )}
        </CarrotPressable>
      </h3>
      <div id={contentId} hidden={!open} className={styles.disclosureBody}>
        {children}
      </div>
    </section>
  );
}

/** Invitation-fixture overview; View layer only changes the enclosing local demo. */
export function ReviewStackOverviewContent({ onSelectLayer }: Readonly<{ onSelectLayer: (id: string) => void }>) {
  const {copy, editable} = useReviewStackEditor();
  return (
    <section className={styles.contentScroll} aria-label='Pull request overview'>
      <div className={styles.overview}>
        <header className={styles.lede}>
          <p className={styles.updated}>Updated {overviewReview.updated}</p>
          <h2 {...editable('overviewTitle', 'Edit overview heading on canvas', 90)}>{copy?.overviewTitle ?? overviewReview.title}</h2>
        </header>

        <div className={styles.stats}>
          <OverviewStat
            title='Layers'
            value={overviewMetrics.layers}
            unit='layers'
            footer='Data model · API · Members UI'>
            <div
              className={styles.segmentBar}
              role='img'
              aria-label={`${String(overviewMetrics.layers)} review layers`}>
              {overviewLayers.map(layer => (
                <span key={layer.id} />
              ))}
            </div>
          </OverviewStat>
          <OverviewStat
            title='Files changed'
            value={overviewMetrics.files}
            unit='files'
            footer={
              <>
                <span className={styles.added}>+{overviewMetrics.additions}</span>
                <span className={styles.removed}>−{overviewMetrics.deletions}</span>
              </>
            }>
            <div
              className={styles.segmentBar}
              role='img'
              aria-label={`${String(overviewMetrics.additions)} lines added, ${String(overviewMetrics.deletions)} removed`}>
              <span className={styles.addedBar} style={{ flexGrow: overviewMetrics.additions }} />
              <span className={styles.removedBar} style={{ flexGrow: overviewMetrics.deletions }} />
            </div>
          </OverviewStat>
          <OverviewStat
            title='Severity findings'
            value={overviewSeverityCounts.critical + overviewSeverityCounts.minor}
            unit='findings'
            footer={
              <>
                <span className={styles.removed}>{overviewSeverityCounts.critical} Critical</span>
                <span className={styles.minor}>{overviewSeverityCounts.minor} Minor</span>
              </>
            }>
            <div
              className={styles.segmentBar}
              role='img'
              aria-label={`${formatCount(overviewSeverityCounts.critical, 'critical finding')}, ${formatCount(overviewSeverityCounts.minor, 'minor finding')}`}>
              <span className={styles.removedBar} />
              <span className={styles.minorBar} />
            </div>
          </OverviewStat>
        </div>

        <OverviewDisclosure title='Summary' defaultOpen>
          <div className={styles.summaryRow}>
            <h4>What changed</h4>
            <p {...editable('summary', 'Edit overview summary on canvas', 1000)}>{copy?.summary ?? overviewReview.summary}</p>
          </div>
          <div className={styles.riskPills}>
            <span className={styles.severity} data-severity='Critical'>
              {overviewSeverityCounts.critical} Critical
            </span>
            <span className={styles.severity} data-severity='Minor'>
              {overviewSeverityCounts.minor} Minor
            </span>
          </div>
        </OverviewDisclosure>

        <OverviewDisclosure
          title={`${formatCount(overviewBlockers.length, 'merge blocker')} to act on`}
          severity='Critical'
          defaultOpen>
          {overviewBlockers.map(blocker => (
            <div key={blocker.id} className={styles.finding}>
              <h4>{blocker.title}</h4>
              <p>{blocker.description}</p>
              <code>{blocker.path}</code>
              <CarrotPressable
                className={styles.viewLayer}
                onClick={() => {
                  onSelectLayer(blocker.layerId);
                }}>
                View layer <ArrowRightIcon aria-hidden='true' />
              </CarrotPressable>
            </div>
          ))}
        </OverviewDisclosure>

        <OverviewDisclosure title={formatAttentionCount(overviewFindings.length)} severity='Minor'>
          {overviewFindings.map(finding => (
            <div key={finding.id} className={styles.finding}>
              <div className={styles.findingTitle}>
                <h4>{finding.title}</h4>
              </div>
              <p>{finding.description}</p>
              <code>{finding.path}</code>
              <CarrotPressable
                className={styles.viewLayer}
                onClick={() => {
                  onSelectLayer(finding.layerId);
                }}>
                View layer <ArrowRightIcon aria-hidden='true' />
              </CarrotPressable>
            </div>
          ))}
        </OverviewDisclosure>
      </div>
    </section>
  );
}

/** Keeps the illustrative comment within the fixed, non-scrolling preview. */
function DeploymentComment({ item }: Readonly<{ item: OverviewActivityItem }>) {
  return (
    <article className={styles.commentCard} aria-label='Deployment comment'>
      <header className={styles.commentHeader}>
        <strong>{item.actor}</strong>
        <span className={styles.commentBadge}>Comment</span>
        <span className={styles.activityTime}>{item.time}</span>
      </header>
      <div className={styles.commentBody}>
        <p>The latest updates on your project. The invitation workflow is ready to preview.</p>
        <table className={styles.deploymentTable}>
          <caption className='sr-only'>Invitation workflow preview deployment</caption>
          <thead>
            <tr>
              <th scope='col'>Project</th>
              <th scope='col'>Deployment</th>
              <th scope='col'>Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>acme-app</td>
              <td>
                <span className={styles.deploymentStatus}>Ready</span>
              </td>
              <td>{item.time}</td>
            </tr>
          </tbody>
        </table>
        <p>Includes the invitation API, role selection, and pending invitations in Members settings.</p>
        <p>Preview checks passed. Merge is still blocked by the Members settings conflict.</p>
      </div>
    </article>
  );
}

/** Filters illustrative activity locally without fetching or changing a real review. */
export function ReviewStackOverviewActivity() {
  const {ui, onUiChange} = useReviewStackEditor();
  const [localExpanded, setLocalExpanded] = useState(true);
  const [localCategories, setLocalCategories] = useState<OverviewActivityCategory[]>(() =>
    // Reproduce the supplied product reference with All selected; Reset uses product defaults.
    activityCategories.map(category => category.id)
  );
  const expanded = ui?.activityExpanded ?? localExpanded;
  const selectedCategories = ui?.activityCategories ?? localCategories;
  const setExpanded = (updater: (current: boolean) => boolean) => onUiChange
    ? onUiChange({activityExpanded: updater(expanded)}) : setLocalExpanded(updater);
  const setSelectedCategories = (value: OverviewActivityCategory[] | ((current: OverviewActivityCategory[]) => OverviewActivityCategory[])) => {
    const next = typeof value === 'function' ? value(selectedCategories) : value;
    if (onUiChange) onUiChange({activityCategories: next}); else setLocalCategories(next);
  };
  const filterId = useId();
  const allCategoriesRef = useRef<HTMLButtonElement>(null);
  const visibleActivity = overviewActivity.filter(item => selectedCategories.includes(item.category));
  const hasCustomFilters = activityCategories.some(
    category => selectedCategories.includes(category.id) !== defaultActivityCategories.includes(category.id)
  );

  /** Changes one local filter while preserving the other selected categories. */
  const toggleCategory = (category: OverviewActivityCategory) => {
    setSelectedCategories(current =>
      current.includes(category) ? current.filter(item => item !== category) : [...current, category]
    );
  };

  return (
    <aside className={styles.activity} aria-label='Overview activity'>
      <div className={styles.activityHeader}>
        <span className={styles.panelGlyph} aria-hidden='true'>
          <CompactSidebarIcon />
        </span>
        <div className={styles.panelModes}>
          <span className={styles.activityTab} aria-current='true'>
            <BookOpenIcon aria-hidden='true' /> Activity
          </span>
          <span className={styles.continueTab}>
            <ArrowUpRightIcon aria-hidden='true' /> Continue
          </span>
        </div>
      </div>
      <div className={styles.activityScroll} role='region' aria-label='Activity filters and timeline'>
        <section className={styles.filterCard} aria-label='Activity display properties'>
          <div className={styles.filterHeader}>
            <p>Display properties</p>
            <CarrotPressable
              className={styles.filterTrigger}
              aria-label={expanded ? 'Hide display properties' : 'Show display properties'}
              aria-expanded={expanded}
              aria-controls={filterId}
              onClick={() => {
                setExpanded(current => !current);
              }}>
              <FunnelIcon aria-hidden='true' />
            </CarrotPressable>
          </div>
          <div id={filterId} hidden={!expanded}>
            <div className={styles.filters}>
              {activityCategories.map(category => {
                const selected = selectedCategories.includes(category.id);
                const count = overviewActivity.filter(item => item.category === category.id).length;
                // Keep zero-event fixture categories out of the displayed reference state.
                if (count === 0) return null;

                return (
                  <CarrotPressable
                    key={category.id}
                    className={styles.filterChip}
                    aria-label={`${selected ? 'Hide' : 'Show'} ${category.label}, ${String(count)} ${count === 1 ? 'event' : 'events'}`}
                    aria-pressed={selected}
                    onClick={() => {
                      toggleCategory(category.id);
                    }}>
                    {category.label}
                    <span className={styles.count}>{count}</span>
                  </CarrotPressable>
                );
              })}
            </div>
            <div className={styles.filterActions}>
              <CarrotPressable
                ref={allCategoriesRef}
                aria-label='Show all activity categories'
                onClick={() => {
                  setSelectedCategories(activityCategories.map(category => category.id));
                }}>
                All
              </CarrotPressable>
              <span aria-hidden='true'>·</span>
              <CarrotPressable
                aria-label='Hide all activity categories'
                onClick={() => {
                  setSelectedCategories([]);
                }}>
                None
              </CarrotPressable>
              {hasCustomFilters && (
                <>
                  <span aria-hidden='true'>·</span>
                  <CarrotPressable
                    onClick={() => {
                      allCategoriesRef.current?.focus();
                      setSelectedCategories(defaultActivityCategories);
                    }}>
                    Reset defaults
                  </CarrotPressable>
                </>
              )}
            </div>
          </div>
        </section>

        <p className='sr-only' role='status' aria-atomic='true'>
          {formatCount(visibleActivity.length, 'activity event')}
        </p>

        {visibleActivity.length > 0 ? (
          <ol className={styles.timeline}>
            {visibleActivity.map(item => (
              <li key={item.id} className={styles.activityItem}>
                <span className={styles.activityAvatar} aria-hidden='true'>
                  {activityIcons[item.category]}
                </span>
                <div className={styles.activityEntry}>
                  {item.kind === 'comment' ? (
                    <DeploymentComment item={item} />
                  ) : item.kind === 'commit' ? (
                    <p className={styles.commitEntry}>
                      <span className={styles.commitTitle} title={item.title}>
                        {item.title}
                      </span>
                      <span className={styles.activityTime}>{item.time}</span>
                    </p>
                  ) : (
                    <p className={styles.activitySummary}>
                      <strong>{item.actor}</strong> {item.action}{' '}
                      <span className={styles.activityTime}>{item.time}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyActivity}>No activity to show.</p>
        )}
      </div>
    </aside>
  );
}
