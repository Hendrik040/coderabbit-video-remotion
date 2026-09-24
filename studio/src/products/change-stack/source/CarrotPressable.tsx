'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface CarrotPressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  variant?: string;
  size?: string;
}

/**
 * Carrot-backed primitive for bespoke marketing and product-demo controls.
 * It keeps the caller's layout/visual treatment while standardizing keyboard,
 * focus, disabled, and press behavior through Carrot UI.
 */
const CarrotPressable = forwardRef<HTMLButtonElement, CarrotPressableProps>(function CarrotPressable(
  {
    children,
    className = '',
    disabled,
    iconLeft,
    iconRight,
    loading = false,
    size: _size,
    trailing,
    type = 'button',
    variant: _variant,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type === 'submit' ? 'submit' : 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`outline-hidden enabled:cursor-pointer aria-disabled:cursor-default focus-visible:ring-2 focus-visible:ring-cui-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}>
      {iconLeft}
      {children}
      {trailing}
      {iconRight}
    </button>
  );
});

export default CarrotPressable;
