import { ChevronLeftIcon } from '@heroicons/react/16/solid';
import { useTranslations } from './messages';
import CarrotPressable from '../../change-stack/source/CarrotPressable';
import ResourceBoardCard from './ResourceBoardCard';
import styles from './ResourceBoard.module.css';
import type { TriageCard, TriageCardLayout, TriageColumn } from './types';

interface ResourceBoardColumnProps {
  column: TriageColumn;
  cards: TriageCard[];
  cardLayout?: TriageCardLayout;
  entranceColumnIndex?: number;
  collapsed?: boolean;
  bodyId?: string;
  description?: string;
  interactive?: boolean;
  onReviewerHoverChange?: (cardId: string, hovered: boolean) => void;
  onReviewerOpenChange?: (cardId: string, open: boolean) => void;
  onToggleCollapsed?: (instant: boolean) => void;
  hoveredReviewerCardId?: string | null;
  openReviewerCardId?: string | null;
}

/**
 * A priority column: the priority label and its count above a vertical stack
 * of cards clipped by the column body.
 */
const ResourceBoardColumnPanel = ({
  column,
  cards,
  cardLayout,
  entranceColumnIndex,
  collapsed = false,
  bodyId,
  description,
  interactive = true,
  onReviewerHoverChange,
  onReviewerOpenChange,
  onToggleCollapsed,
  hoveredReviewerCardId,
  openReviewerCardId,
}: ResourceBoardColumnProps) => {
  const t = useTranslations('Triage.board');
  const canToggle = interactive && Boolean(onToggleCollapsed);
  const header = (
    <>
      <span className={styles.columnHeading}>
        <span className={styles.columnTitle}>{column.title}</span>
        {description ? <span className={styles.columnDescription}>{description}</span> : null}
      </span>
      <span className={`${styles.countChipOutlined} ${styles.columnCount}`}>{column.count}</span>
      {canToggle ? (
        <span className={styles.collapseControl} aria-hidden='true'>
          <ChevronLeftIcon className={styles.collapseIcon} />
        </span>
      ) : null}
    </>
  );

  return (
    <div className={`${styles.column} ${collapsed ? styles.columnCollapsed : ''}`}>
      {canToggle ? (
        <CarrotPressable
          className={styles.columnHeader}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          onClick={event => onToggleCollapsed?.(event.detail === 0)}>
          {header}
          <span className='sr-only'>{t(collapsed ? 'expandColumn' : 'collapseColumn', { column: column.title })}</span>
        </CarrotPressable>
      ) : (
        <div className={styles.columnHeader}>{header}</div>
      )}

      <div id={bodyId} className={styles.columnBody} aria-hidden={collapsed || undefined} inert={collapsed}>
        <div className={styles.cardStack}>
          {cards.map((card, rowIndex) => (
            <ResourceBoardCard
              key={card.id}
              card={card}
              cardLayout={cardLayout}
              // Match the pricing cards' cadence, advancing one diagonal every 150 ms.
              entranceDelayMs={entranceColumnIndex === undefined ? undefined : (entranceColumnIndex + rowIndex) * 150}
              interactive={interactive}
              onReviewerHoverChange={hovered => {
                onReviewerHoverChange?.(card.id, hovered);
              }}
              onReviewerOpenChange={open => {
                onReviewerOpenChange?.(card.id, open);
              }}
              reviewerOpen={openReviewerCardId === card.id}
              reviewerVisible={hoveredReviewerCardId === card.id || openReviewerCardId === card.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceBoardColumnPanel;
