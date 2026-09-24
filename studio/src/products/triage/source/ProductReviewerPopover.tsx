'use client';

import { Form, Popover, Tooltip } from './carrot';
import { MagnifyingGlassIcon, MinusIcon, XMarkIcon } from '@heroicons/react/16/solid';
import Image from './ProductImage';
import { useTranslations } from './messages';
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import CarrotPressable from '../../change-stack/source/CarrotPressable';
import {useTriageState} from './TriageEditor';
import { ReviewerMessageIcon, ReviewersIcon } from './ReviewerIcons';
import type { TriageReviewer, TriageReviewerPopover } from './types';

// Preserve the hero's popup proportions: its 750-unit board uses a 128rem reference width.
const REFERENCE_AVATAR_WIDTH_REM = (12.5 * 128) / 750;

/** Keeps the same avatar geometry in requested and suggested reviewer rows. */
const ReviewerAvatar = ({ reviewer }: Readonly<{ reviewer: TriageReviewer }>) =>
  reviewer.avatar ? (
    <Image src={reviewer.avatar} alt='' width={48} height={48} className='size-8 shrink-0 rounded-full object-cover' />
  ) : (
    <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-cui-neutral text-body-sm text-cui-secondary'>
      {reviewer.initials ?? reviewer.name.slice(0, 1)}
    </span>
  );

/** Shows reviewer hover controls while keeping assignment and messaging actions disabled. */
const ReviewerRow = ({
  reviewer,
  match = reviewer.match,
  suggested = false,
  mockupScale = 1,
}: Readonly<{ reviewer: TriageReviewer; match?: number; suggested?: boolean; mockupScale?: number }>) => {
  const tooltipId = useId();
  const t = useTranslations('Triage.reviewer');
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <li className='group/reviewer flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors hover:bg-cui-subtle focus-within:bg-cui-subtle motion-reduce:transition-none'>
      {suggested ? (
        <ReviewerAvatar reviewer={reviewer} />
      ) : (
        <CarrotPressable
          aria-label={t('remove', { name: reviewer.name })}
          aria-disabled='true'
          className='relative size-8 shrink-0 rounded-full'>
          <ReviewerAvatar reviewer={reviewer} />
          <span
            aria-hidden='true'
            className='absolute inset-0 flex items-center justify-center rounded-full bg-cui-neutral opacity-0 transition-opacity group-hover/reviewer:opacity-100 group-focus-within/reviewer:opacity-100 motion-reduce:transition-none'>
            <MinusIcon className='size-4 text-cui-secondary' />
          </span>
        </CarrotPressable>
      )}
      <span className='min-w-0 flex-1'>
        <span className='block break-words text-body-sm font-medium text-cui-primary'>{reviewer.name}</span>
        {match !== undefined ? (
          <span className='block whitespace-nowrap text-label-sm font-normal tabular-nums text-cui-secondary'>
            {t('match', { score: match })}
          </span>
        ) : null}
      </span>
      {!suggested && reviewer.slackHandle ? (
        <Tooltip.Root open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <Tooltip.Trigger
            render={<CarrotPressable />}
            aria-label={t('sendTo', { name: reviewer.name })}
            aria-disabled='true'
            aria-describedby={tooltipOpen ? tooltipId : undefined}
            className='flex size-6 shrink-0 items-center justify-center rounded-md text-cui-secondary transition-colors hover:bg-cui-subtle focus-visible:bg-cui-subtle motion-reduce:transition-none'>
            <ReviewerMessageIcon className='size-4' />
          </Tooltip.Trigger>
          <Tooltip.Content
            id={tooltipId}
            role='tooltip'
            side='top'
            sideOffset={6 * mockupScale}
            className='font-sans font-normal'
            style={{ zoom: mockupScale, maxWidth: `calc((100vw - 1rem) / ${String(mockupScale)})` }}>
            {t('send')}
          </Tooltip.Content>
        </Tooltip.Root>
      ) : null}
    </li>
  );
};

/** A portaled reviewer preview that can respect an explicitly bounded product screen. */
export default function ProductReviewerPopover({
  children,
  data,
  label,
  open,
  onOpenChange,
  triggerClassName,
}: Readonly<{
  children: ReactNode;
  data: TriageReviewerPopover;
  label: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName: string;
}>) {
  const [query, setQuery] = useTriageState('reviewerQuery', '');
  const t = useTranslations('Triage.reviewer');
  const [mockupScale, setMockupScale] = useState(1);
  const [placement, setPlacement] = useState<{ side: 'top' | 'bottom'; maxHeightRem?: number }>({ side: 'top' });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scaleProbeRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const scaleProbe = scaleProbeRef.current;
    if (!open || !trigger || !scaleProbe) return undefined;
    const board = trigger.closest('[data-reviewer-boundary]');

    // Portals lose both container-based sizing and ancestor transforms. Measure a fixed
    // design-unit probe, independent of the number of avatars, to carry both into the popup.
    const updatePlacement = () => {
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const referenceWidth = REFERENCE_AVATAR_WIDTH_REM * rootFontSize;
      const renderedWidth = scaleProbe.offsetWidth;
      if (referenceWidth <= 0 || renderedWidth <= 0) return;
      const scale = renderedWidth / referenceWidth;
      const ancestorScale = scaleProbe.getBoundingClientRect().width / renderedWidth;
      setMockupScale(scale);
      if (!board) return;

      // Carrot handles viewport collisions; reserve space inside the scaled board as well.
      // Choose the roomier side independently of search results so filtering cannot flip it.
      const bounds = board.getBoundingClientRect();
      const anchor = trigger.getBoundingClientRect();
      const spacing = 8 * scale;
      const above = anchor.top - Math.max(0, bounds.top) - spacing * 2;
      const below = Math.min(window.innerHeight, bounds.bottom) - anchor.bottom - spacing * 2;
      const side = above >= below ? 'top' : 'bottom';
      setPlacement({ side, maxHeightRem: Math.max(0, side === 'top' ? above : below) / scale / rootFontSize / ancestorScale });
    };
    updatePlacement();
    const observer = new ResizeObserver(updatePlacement);
    observer.observe(scaleProbe);
    if (board) observer.observe(board);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  const search = query.trim().toLocaleLowerCase();
  const matches = (reviewer: TriageReviewer) =>
    `${reviewer.name} ${reviewer.handle}`.toLocaleLowerCase().includes(search);
  const assigned = data.reviewers.filter(matches);
  const suggestions = (data.suggestions ?? []).filter(suggestion => matches(suggestion.reviewer));
  const noMatches = search.length > 0 && assigned.length === 0 && suggestions.length === 0;

  return (
    <Tooltip.Provider delay={200}>
      <Popover.Root
        open={open}
        onOpenChange={(nextOpen, details) => {
          // Filtering can move the panel away from the pointer. Keep an active search open.
          if (!nextOpen && details.reason === 'trigger-hover' && contentRef.current?.contains(document.activeElement)) {
            details.cancel();
            return;
          }
          if (!nextOpen) setQuery('');
          onOpenChange?.(nextOpen);
        }}>
        <Popover.Trigger
          ref={triggerRef}
          openOnHover
          delay={150}
          closeDelay={160}
          className={triggerClassName}
          aria-label={label}>
          <span
            ref={scaleProbeRef}
            aria-hidden='true'
            style={{
              position: 'absolute',
              insetInlineEnd: 0,
              width: 'calc(12.5 * var(--tb-u))',
              height: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
          />
          {children}
        </Popover.Trigger>
        <Popover.Content
          ref={contentRef}
          align='end'
          side={placement.side}
          sideOffset={8 * mockupScale}
          aria-label={label}
          className='w-80 overflow-y-auto font-sans'
          style={{
            zoom: mockupScale,
            maxWidth: `calc((100vw - 1rem) / ${String(mockupScale)})`,
            maxHeight:
              placement.maxHeightRem === undefined
                ? `calc(var(--available-height) / ${String(mockupScale)})`
                : `min(calc(var(--available-height) / ${String(mockupScale)}), ${String(placement.maxHeightRem)}rem)`,
          }}>
          <div className='mb-3 flex items-center gap-2'>
            <ReviewersIcon className='size-4 text-cui-secondary' />
            <Popover.Title className='flex-1 text-body-sm'>{t('title')}</Popover.Title>
            <Popover.Close
              aria-label={t('close')}
              className='flex size-6 cursor-pointer items-center justify-center rounded-sm text-cui-secondary hover:bg-cui-neutral-subtle hover:text-cui-primary focus-visible:ring-2 focus-visible:ring-cui-focus'>
              <XMarkIcon className='size-4' aria-hidden='true' />
            </Popover.Close>
          </div>
          <Form.Field>
            <Form.Input
              type='search'
              aria-label={t('searchLabel')}
              placeholder={t('searchPlaceholder')}
              autoComplete='off'
              value={query}
              onChange={event => {
                setQuery(event.target.value.slice(0, 100));
              }}
              iconLeft={<MagnifyingGlassIcon className='size-4' aria-hidden='true' />}
              className='text-body-md sm:text-body-sm'
            />
          </Form.Field>
          <div className='mt-3 space-y-3' aria-live='polite'>
            {noMatches ? (
              <p className='px-1 text-body-sm text-cui-secondary'>{t('noMatches')}</p>
            ) : (
              <>
                {assigned.length > 0 ? (
                  <section aria-label={t('requestedLabel')}>
                    <p className='mb-1 px-1 text-label-sm font-normal text-cui-secondary'>{t('requested')}</p>
                    <ul>
                      {assigned.map(reviewer => (
                        <ReviewerRow key={reviewer.id} reviewer={reviewer} mockupScale={mockupScale} />
                      ))}
                    </ul>
                  </section>
                ) : !search && data.reviewers.length === 0 ? (
                  <p className='px-1 text-body-sm text-cui-secondary'>{t('noneAssigned')}</p>
                ) : null}
                {suggestions.length > 0 || (!search && data.reviewers.length > 0) ? (
                  <section aria-label={t('suggestedLabel')}>
                    <p className='mb-1 px-1 text-label-sm font-normal text-cui-secondary'>{t('suggestions')}</p>
                    {suggestions.length ? (
                      <ul>
                        {suggestions.map(suggestion => (
                          <ReviewerRow
                            key={suggestion.reviewer.id}
                            reviewer={suggestion.reviewer}
                            match={suggestion.match}
                            suggested
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className='px-1 text-label-sm font-normal text-cui-secondary'>{t('noMoreSuggestions')}</p>
                    )}
                  </section>
                ) : null}
              </>
            )}
          </div>
        </Popover.Content>
      </Popover.Root>
    </Tooltip.Provider>
  );
}
