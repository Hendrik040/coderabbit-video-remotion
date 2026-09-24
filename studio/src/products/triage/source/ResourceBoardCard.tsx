import {useContext} from 'react';
import {TriageMotion, useTriageCardEditor} from './TriageEditor';
import {motionCurves, unit} from '../../../lib/motion';
import { ShieldExclamationIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  MinusCircleIcon,
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import Image from './ProductImage';
import { useTranslations } from './messages';
import CarrotPressable from '../../change-stack/source/CarrotPressable';
import priorityPillStyles from './TriagePriorityPill.module.css';
import ReviewChangeStackPill from './ReviewChangeStackPill';
import styles from './ResourceBoard.module.css';
import ProductReviewerPopover from './ProductReviewerPopover';
import ReviewerPopover from './ReviewerPopover';
import type { TriageCard, TriageCardLayout, TriageCiChecks, TriagePriority, TriageReviewState } from './types';

/** Each priority carries its own pill treatment, as in the design. */
const priorityClassNames: Record<TriagePriority, string> = {
  P0: styles.pillP0,
  P1: styles.pillP1,
  P2: styles.pillP2,
  P3: styles.pillP2,
};

/** Reviewer avatars are 48px square source assets exported with the design. */
const AVATAR_SOURCE_SIZE = 48;

const ciAppearance = {
  passing: { Icon: CheckIcon, tone: 'text-cui-success', label: 'CI checks passing' },
  failing: { Icon: XMarkIcon, tone: 'text-cui-danger', label: 'CI checks failing' },
};

const reviewAppearance = {
  Approved: { Icon: CheckCircleIcon, tone: 'text-cui-success' },
  'Changes requested': { Icon: XCircleIcon, tone: 'text-cui-danger' },
  'Review requested': { Icon: UserGroupIcon, tone: 'text-cui-accent' },
  'Review required': { Icon: MinusCircleIcon, tone: 'text-cui-warn' },
  'Review pending': { Icon: ClockIcon, tone: 'text-cui-tertiary' },
  'Stale approval': { Icon: ArrowPathIcon, tone: styles.statusPending },
};

/** Displays check totals only when the caller supplies CI evidence for the card. */
const CardCiChecks = ({ checks }: Readonly<{ checks: TriageCiChecks }>) => {
  const t = useTranslations('Triage.card');
  const { Icon, tone } = ciAppearance[checks.status];
  const label = t(checks.status === 'passing' ? 'checksPassing' : 'checksFailing');
  const description = t('checksPassed', { label, passed: checks.passed, total: checks.total });

  return (
    <span className={`${styles.footerGroup} ${styles.cardChecks}`} title={description}>
      <Icon className={`${styles.footerIcon} ${tone}`} aria-hidden='true' />
      <span className='sr-only'>{label}: </span>
      <span className={styles.meta}>
        {checks.passed}/{checks.total}
      </span>
    </span>
  );
};

/** Maps a supplied review state to its status icon and accessible text. */
const CardReviewState = ({ state }: Readonly<{ state: TriageReviewState }>) => {
  const t = useTranslations('Triage.card');
  const labels = {
    Approved: t('approved'),
    'Changes requested': t('changesRequested'),
    'Review requested': t('reviewRequested'),
    'Review required': t('reviewRequired'),
    'Review pending': t('reviewPending'),
    'Stale approval': t('staleApproval'),
  };
  const { Icon, tone } = reviewAppearance[state];

  return (
    <span className={`${styles.footerGroup} ${styles.cardReviewState}`}>
      <span className={styles.metaDot} aria-hidden='true' />
      <Icon className={`${styles.footerIcon} ${tone}`} aria-hidden='true' />
      <span className={styles.meta}>{labels[state]}</span>
    </span>
  );
};

/** Renders the shared avatar stack without adding interaction to decorative cards. */
const ReviewerAvatars = ({ card, cardLayout }: Readonly<{ card: TriageCard; cardLayout: TriageCardLayout }>) => (
  <>
    {card.avatars?.length ? (
      card.avatars.map(src => (
        <Image
          key={src}
          src={src}
          alt=''
          width={AVATAR_SOURCE_SIZE}
          height={AVATAR_SOURCE_SIZE}
          className={styles.avatar}
        />
      ))
    ) : cardLayout === 'product' && card.reviewerPopover?.reviewers.length ? (
      card.reviewerPopover.reviewers.slice(0, 3).map(reviewer => (
        <span key={reviewer.id} className={`${styles.avatar} ${styles.avatarInitials}`} title={reviewer.name}>
          {reviewer.initials ?? reviewer.name.slice(0, 1)}
        </span>
      ))
    ) : (
      <UserPlusIcon className={styles.emptyReviewerIcon} aria-hidden='true' />
    )}
    {card.overflow ? <span className={styles.avatarOverflow}>{card.overflow}</span> : null}
  </>
);

/** Shares the empty-trigger styling rule across interactive and decorative card layouts. */
const reviewerTriggerClassName = (card: TriageCard, cardLayout: TriageCardLayout) =>
  `${styles.avatars} ${
    !card.avatars?.length && (cardLayout !== 'product' || !card.reviewerPopover?.reviewers.length)
      ? styles.emptyReviewerTrigger
      : ''
  }`;

/** Renders one PR card, exposing reviewer controls only when interaction and detail data are available. */
const ResourceBoardCard = ({
  card,
  cardLayout = 'default',
  entranceDelayMs,
  interactive = true,
  onReviewerHoverChange,
  onReviewerOpenChange,
  reviewerOpen = false,
  reviewerVisible = reviewerOpen,
}: Readonly<{
  card: TriageCard;
  cardLayout?: TriageCardLayout;
  entranceDelayMs?: number;
  interactive?: boolean;
  onReviewerHoverChange?: (hovered: boolean) => void;
  onReviewerOpenChange?: (open: boolean) => void;
  reviewerOpen?: boolean;
  reviewerVisible?: boolean;
}>) => {
  const t = useTranslations('Triage.card');
  const editable = useTriageCardEditor(card.id);
  const motion = useContext(TriageMotion);
  const beat = motion.animate ? motionCurves.reveal(unit((motion.frame / motion.fps - (entranceDelayMs ?? 0) / 1000) / .4)) : 1;
  return (
    <article
      className={`${styles.card} ${cardLayout === 'product' ? styles.productCard : ''}`}
      data-card-id={card.id}
      style={{opacity: beat, transform: beat < 1 ? `translateY(${12 * (1 - beat)}px)` : undefined}}
      data-priority={cardLayout === 'product' ? card.priority : undefined}
      data-disposition={cardLayout === 'product' ? card.disposition : undefined}>
      <div className={styles.cardMain}>
        <div className={styles.cardHead}>
          {cardLayout === 'product' ? (
            card.priority ? (
              <span
                data-priority={card.priority}
                className={`${styles.pill} ${styles.productPriorityPill} ${card.priority === 'P0' ? priorityPillStyles.p0 : ''}`}>
                <span className={styles.priorityDot} aria-hidden='true' />
                {card.priority}
              </span>
            ) : null
          ) : (
            <>
              <span className={`${styles.meta} ${styles.cardReference}`}>{card.reference}</span>
              <span className={styles.metaDot} aria-hidden='true' />
              <span className={styles.meta}>{card.repository}</span>
            </>
          )}
          {card.disposition ? (
            <span
              className={`${styles.pill} ${styles.pillClose}`}
              aria-label={t('recommendation', { disposition: t('safeToClose') })}>
              {t('safeToClose')}
            </span>
          ) : null}
          <span className={styles.stackSlot}>
            {cardLayout !== 'product' && card.activity ? (
              <span className={`${styles.meta} ${styles.cardActivity}`}>{card.activity}</span>
            ) : null}
            {card.stack ? (
              <span className={styles.stackPill}>
                <ReviewChangeStackPill variant='card' tone='dark' label={t('reviewChangeStack')} />
              </span>
            ) : null}
          </span>
        </div>

        <div className={styles.cardTitleBlock}>
          <span className={styles.cardTitle} title={card.title} {...editable('title', 150)}>
            {card.title}
          </span>
          {card.reason ? (
            <span className={styles.cardReason} title={card.reason} {...editable('reason', 600)}>
              {card.reason}
            </span>
          ) : null}
        </div>

        <div className={styles.cardTags}>
          {cardLayout !== 'product' && card.priority ? (
            <span className={`${styles.pill} ${priorityClassNames[card.priority]}`}>{card.priority}</span>
          ) : null}
          {card.tags.map(tag => (
            <span key={tag} className={styles.pill}>
              {cardLayout === 'product' && /^(?:high|moderate|medium|critical)\b.*\b(?:risk|security)\b/i.test(tag) ? (
                <ShieldExclamationIcon className={styles.pillIcon} aria-hidden='true' />
              ) : null}
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardFooterText}>
            <div className={styles.footerRow}>
              {cardLayout === 'product' ? (
                <span className={styles.cardPrimaryMetadata}>
                  <span className={`${styles.footerGroup} ${styles.cardRepository}`}>
                    <span className={`${styles.footerIcon} ${styles.repositoryIcon}`} aria-hidden='true' />
                    <span className={styles.meta} title={card.repository} {...editable('repository', 60)}>
                      {card.repository}
                    </span>
                    <span className={`${styles.meta} ${styles.cardReference}`}>{card.reference}</span>
                  </span>
                  {card.ciChecks ? <CardCiChecks checks={card.ciChecks} /> : null}
                  {card.author ? (
                    <span className={`${styles.footerGroup} ${styles.cardAuthor}`}>
                      <span className={styles.metaDot} aria-hidden='true' />
                      <span className={styles.meta} title={card.author} {...editable('author', 90)}>
                        {card.author}
                      </span>
                    </span>
                  ) : null}
                </span>
              ) : (
                <>
                  {card.ciChecks ? <CardCiChecks checks={card.ciChecks} /> : null}
                  <span className={styles.footerGroup}>
                    <span className={styles.meta} title={card.author} {...editable('author', 90)}>
                      {card.author}
                    </span>
                  </span>
                </>
              )}
              {card.reviewState ? <CardReviewState state={card.reviewState} /> : null}
              {card.openedAt || card.updatedAt ? (
                <span
                  className={`${styles.footerGroup} ${cardLayout === 'product' ? styles.cardActivity : ''}`}
                  title={cardLayout === 'product' ? t('lastActivity') : undefined}>
                  <span className={styles.metaDot} aria-hidden='true' />
                  <span className={styles.meta}>{card.updatedAt ?? card.openedAt}</span>
                </span>
              ) : null}
              {card.additions !== undefined || card.deletions !== undefined ? (
                <span className={`${styles.footerGroup} ${styles.cardDiff}`}>
                  {cardLayout === 'product' ? <span className={styles.metaDot} aria-hidden='true' /> : null}
                  {card.additions !== undefined ? (
                    <span className={`${styles.meta} ${styles.diffAdditions}`}>
                      +{card.additions.toLocaleString('en-US')}
                    </span>
                  ) : null}
                  {card.deletions !== undefined ? (
                    <span className={`${styles.meta} ${styles.diffDeletions}`}>
                      −{card.deletions.toLocaleString('en-US')}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>

          {interactive && cardLayout === 'product' && card.reviewerPopover ? (
            <div className={styles.reviewerAnchor}>
              <ProductReviewerPopover
                data={card.reviewerPopover}
                label={t('reviewersFor', { repository: card.repository, reference: card.reference })}
                open={reviewerOpen}
                onOpenChange={onReviewerOpenChange}
                triggerClassName={reviewerTriggerClassName(card, cardLayout)}>
                <ReviewerAvatars card={card} cardLayout={cardLayout} />
              </ProductReviewerPopover>
            </div>
          ) : card.avatars?.length || card.reviewerPopover ? (
            <div
              className={styles.reviewerAnchor}
              data-open={reviewerVisible ? 'true' : undefined}
              role='presentation'
              onMouseEnter={() => {
                if (interactive && card.reviewerPopover) onReviewerHoverChange?.(true);
              }}
              onMouseLeave={() => {
                if (interactive && card.reviewerPopover) onReviewerHoverChange?.(false);
              }}>
              {interactive && card.reviewerPopover ? (
                <CarrotPressable
                  className={reviewerTriggerClassName(card, cardLayout)}
                  aria-label={t('showReviewerDetails')}
                  aria-expanded={reviewerVisible}
                  onClick={() => onReviewerOpenChange?.(!reviewerOpen)}>
                  <ReviewerAvatars card={card} cardLayout={cardLayout} />
                </CarrotPressable>
              ) : (
                <span className={reviewerTriggerClassName(card, cardLayout)}>
                  <ReviewerAvatars card={card} cardLayout={cardLayout} />
                </span>
              )}
              {interactive && card.reviewerPopover ? <ReviewerPopover data={card.reviewerPopover} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ResourceBoardCard;
