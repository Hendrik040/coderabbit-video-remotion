/** Combines the glyph's fixed styles with the caller's size and placement. */
const cx = (...classes: string[]) => classes.join(' ');

/** Decorative panel glyph shared by the sidebar and context-panel chrome. */
export function CompactSidebarIcon({ className = 'size-4' }: Readonly<{ className?: string }>) {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className={className}>
      <rect x='2' y='3' width='12' height='10' rx='2' stroke='currentColor' strokeWidth='1.5' />
      <rect
        x='4'
        y='5'
        height='6'
        rx='0.75'
        fill='currentColor'
        className='transition-[width] duration-300 ease-cui-out-expo [width:4px] group-hover/btn:[width:2.5px] motion-reduce:transition-none'
      />
    </svg>
  );
}

/** Shared decorative CodeRabbit avatar; the surrounding row names the actor. */
export function CodeRabbitCircleIcon({ className = 'h-4 w-4' }: Readonly<{ className?: string }>) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--text-color-cui-primary)] text-[var(--background-color-cui-base-0)]',
        className
      )}>
      <svg viewBox='0 0 1201 1200' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-[70%] w-[70%]'>
        <path
          fill='currentColor'
          d='M1008.3 500.615C1008.3 500.615 924.706 393.751 819.62 387.639C751.807 383.636 735.379 392.696 732.434 399.444C728.226 364.456 698.322 202.361 491.729 168.008C518.102 357.589 627.02 308.191 691.161 438.86C691.161 438.86 582.921 291.734 404.969 345.903C404.969 345.903 469.83 482.07 661.676 509.891C661.676 509.891 677.05 562.586 681.684 571.862C681.684 571.862 386.224 417.779 296.512 713.505C229.747 698.382 207.352 770.859 284.09 820.369C284.09 820.369 297.147 768.519 328.943 753.131C328.943 753.131 260.711 829.226 340.946 920.36H628.925C635.883 908.834 666.68 848.19 590.514 802.285C644.278 801.516 688.042 902.932 735.128 921.058H803.61C805.927 915.428 810.771 898.567 799.395 883.395C781.857 863.278 743.46 866.002 743.802 828.8C757.062 655.746 1016.55 708.888 1008.3 500.615Z'
        />
      </svg>
    </span>
  );
}
