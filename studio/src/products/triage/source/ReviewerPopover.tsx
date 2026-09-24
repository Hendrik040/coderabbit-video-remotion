import { CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid';
import Image from './ProductImage';
import styles from './ResourceBoard.module.css';
import { ReviewerMessageIcon } from './ReviewerIcons';
import type { TriageReviewer, TriageReviewerPopover } from './types';

const AVATAR_SOURCE_SIZE = 48;

/** Shows a reviewer's avatar or initials together with their name and handle. */
const ReviewerIdentity = ({ reviewer }: Readonly<{ reviewer: TriageReviewer }>) => (
  <>
    {reviewer.avatar ? (
      <Image
        src={reviewer.avatar}
        alt=''
        width={AVATAR_SOURCE_SIZE}
        height={AVATAR_SOURCE_SIZE}
        className={styles.reviewerAvatar}
      />
    ) : (
      <span className={styles.reviewerAvatarFallback}>{reviewer.initials ?? reviewer.name.slice(0, 1)}</span>
    )}
    <span className={styles.reviewerName} title={reviewer.name}>
      {reviewer.name}
    </span>
    <span className={styles.reviewerHandle} title={reviewer.handle}>
      {reviewer.handle}
    </span>
  </>
);

/** Lists supplied suggestions in descending match order when scores are available. */
const ReviewerSuggestions = ({
  suggestions,
}: Readonly<{ suggestions: NonNullable<TriageReviewerPopover['suggestions']> }>) => (
  <div className={styles.reviewerList}>
    {[...suggestions]
      .sort((first, second) => (second.match ?? 0) - (first.match ?? 0))
      .map(suggestion => (
        <div key={suggestion.reviewer.id} className={styles.reviewerRow}>
          <span className={styles.reviewerSelected} />
          <ReviewerIdentity reviewer={suggestion.reviewer} />
          {suggestion.match !== undefined ? (
            <span className={styles.reviewerMatch}>{suggestion.match}% match</span>
          ) : null}
          <ReviewerMessageIcon className={styles.reviewerMessageIcon} />
        </div>
      ))}
  </div>
);

/** Presents read-only reviewer details as a labeled non-dialog group. */
const ReviewerPopover = ({ data }: Readonly<{ data: TriageReviewerPopover }>) => (
  <div
    className={styles.reviewerPopover}
    data-empty={data.reviewers.length === 0 ? 'true' : undefined}
    role='group'
    aria-label='Reviewers'>
    <div className={styles.reviewerPopoverHeader}>
      <span className={styles.reviewerPopoverTitle}>Reviewers</span>
      {data.reviewers.length === 0 ? (
        <span className={styles.reviewerEmptyMessage}>{data.emptyMessage ?? 'No reviewers assigned.'}</span>
      ) : null}
      <MagnifyingGlassIcon className={styles.reviewerHeaderSearchIcon} aria-hidden='true' />
    </div>

    <div className={styles.reviewerDivider} />

    {data.reviewers.length ? (
      <div className={styles.reviewerList}>
        {data.reviewers.map(reviewer => (
          <div key={reviewer.id} className={styles.reviewerRow}>
            <span className={styles.reviewerSelected} data-selected={reviewer.selected ? 'true' : undefined}>
              {reviewer.selected ? <CheckIcon aria-hidden='true' /> : null}
            </span>
            <ReviewerIdentity reviewer={reviewer} />
            {reviewer.match !== undefined ? (
              <span className={styles.reviewerMatch}>{reviewer.match}% match</span>
            ) : null}
            <ReviewerMessageIcon className={styles.reviewerMessageIcon} />
          </div>
        ))}
      </div>
    ) : null}

    {data.suggestions?.length ? (
      <>
        {data.reviewers.length ? <div className={styles.reviewerDivider} /> : null}
        <ReviewerSuggestions suggestions={data.suggestions} />
      </>
    ) : null}
  </div>
);

export default ReviewerPopover;
