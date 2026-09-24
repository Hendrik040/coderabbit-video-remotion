import type { Ref } from 'react';
import Image from './ProductImage';
import styles from './ReviewChangeStackPill.module.css';

type ReviewChangeStackPillProps = Readonly<{
  buttonRef?: Ref<HTMLSpanElement>;
  label?: string;
  tone?: 'light' | 'dark';
  variant?: 'default' | 'card';
}>;

/** Draws the homepage pill using the same label as its accessible name. */
function ReviewChangeStackButtonSvg({ label }: Readonly<{ label: string }>) {
  return (
    <svg
      className={styles.reviewChangeStackSvg}
      xmlns='http://www.w3.org/2000/svg'
      width='202'
      height='32'
      viewBox='0 0 202 32'
      fill='none'
      aria-hidden='true'>
      <rect
        x='0.5'
        y='0.5'
        width='201'
        height='31'
        rx='7'
        fill='var(--home-hero-button-bg)'
        stroke='var(--home-hero-button-border)'
      />
      <circle cx='17' cy='16' r='11' fill='var(--home-hero-rabbit)' />
      <g transform='translate(7 6) scale(0.5263158)'>
        <path
          d='M30.894 16.6853C30.894 16.6853 28.3158 13.2944 25.0752 13.1005C22.9841 12.9735 22.4775 13.261 22.3867 13.475C22.2569 12.3648 21.3348 7.22143 14.9641 6.13141C15.7774 12.147 19.136 10.5795 21.114 14.7258C21.114 14.7258 17.7762 10.0573 12.2887 11.7762C12.2887 11.7762 14.2888 16.0968 20.2048 16.9796C20.2048 16.9796 20.6789 18.6517 20.8218 18.946C20.8218 18.946 11.7107 14.0569 8.94421 23.4405C6.88535 22.9606 6.19476 25.2604 8.56115 26.8314C8.56115 26.8314 8.96379 25.1861 9.94425 24.6978C9.94425 24.6978 7.84022 27.1124 10.3144 30.0041H19.1948C19.4094 29.6385 20.359 27.7142 18.0103 26.2575C19.6683 26.2332 21.0178 29.4512 22.4698 30.0263H24.5816C24.653 29.8477 24.8024 29.3126 24.4516 28.8313C23.9108 28.1929 22.7267 28.2794 22.7373 27.0989C23.1462 21.6077 31.1481 23.294 30.8937 16.6853H30.894Z'
          fill='var(--home-hero-rabbit-mark)'
        />
      </g>
      <text
        x='36'
        y='21'
        fill='var(--home-hero-button-text)'
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize='13'
        fontWeight='600'
        letterSpacing='0'>
        {label}
      </text>
      <path
        d='M182.5 11.5L187 16L182.5 20.5'
        stroke='var(--home-hero-button-text)'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M175 16H186' stroke='var(--home-hero-button-text)' strokeWidth='1.6' strokeLinecap='round' />
    </svg>
  );
}

/** Renders an illustrative Change Stack badge with a caller-localized label. */
export default function ReviewChangeStackPill({
  buttonRef,
  label = 'Review Change Stack',
  tone = 'light',
  variant = 'default',
}: ReviewChangeStackPillProps) {
  if (variant === 'card') {
    return (
      <span
        ref={buttonRef}
        role='img'
        aria-label={label}
        className={`${styles.reviewChangeStackCard} ${tone === 'dark' ? styles.reviewChangeStackCardDark : ''}`}
        data-review-change-stack-trigger='true'>
        <Image
          className={styles.reviewChangeStackCardTile}
          src='/content/assets/home-redesign-figma/triage/change-stack-tile.svg'
          width={36}
          height={36}
          alt=''
          aria-hidden='true'
        />
        <span className={styles.reviewChangeStackCardLabel}>{label}</span>
        <span className={styles.reviewChangeStackCardArrow} aria-hidden='true' />
      </span>
    );
  }

  return (
    <span
      ref={buttonRef}
      role='img'
      aria-label={label}
      className={styles.reviewChangeStackPill}
      data-review-change-stack-trigger='true'>
      <ReviewChangeStackButtonSvg label={label} />
    </span>
  );
}
