import { XMarkIcon } from "@heroicons/react/16/solid"
import {
	forwardRef,
	type ComponentPropsWithoutRef,
	type MouseEvent,
} from "react"
import { cn } from "./carrotCn"

const filledVariantStyles = {
	neutral: "bg-cui-subtle text-cui-secondary",
	accent: "bg-cui-accent-subtle text-cui-accent",
	danger: "bg-cui-danger-subtle text-cui-danger",
	warn: "bg-cui-warn-subtle text-cui-warn",
	success: "bg-cui-success-subtle text-cui-success",
} as const

const borderVariantStyles = {
	neutral: "border border-current text-cui-secondary",
	accent: "border border-current text-cui-accent",
	danger: "border border-current text-cui-danger",
	warn: "border border-current text-cui-warn",
	success: "border border-current text-cui-success",
} as const

const sizeStyles = {
	sm: "px-1.5 py-0.5 text-cui-sm",
	md: "px-2 py-0.5 text-cui-base",
} as const

const gapStyles = {
	sm: "gap-1",
	md: "gap-1.5",
} as const

const dotSizeStyles = {
	sm: "size-1.5",
	md: "size-2",
} as const

const dotVariantStyles = {
	neutral: "bg-cui-tertiary",
	accent: "bg-cui-accent",
	danger: "bg-cui-danger",
	warn: "bg-cui-warn",
	success: "bg-cui-success",
} as const

const dismissIconSizeStyles = {
	sm: "size-3",
	md: "size-3.5",
} as const

export type BadgeVariant = keyof typeof filledVariantStyles
export type BadgeSize = keyof typeof sizeStyles
export type BadgeDotPosition = "leading" | "trailing"

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
	/** Semantic intent (color). */
	variant?: BadgeVariant
	/** Size of the badge. */
	size?: BadgeSize
	/**
	 * Render with a border instead of a filled (subtle) background.
	 * Border color is bound to the variant's text color so contrast
	 * passes WCAG in both light and dark mode.
	 */
	border?: boolean
	/** Show a status dot whose color follows `variant`. */
	dot?: boolean
	/** Where the dot sits relative to the label. Default `"leading"`. */
	dotPosition?: BadgeDotPosition
	/**
	 * Render a trailing dismiss (×) button and call this on click.
	 * Receives the event so callers can `stopPropagation()` when the
	 * badge sits inside an interactive parent.
	 */
	onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void
	/** Accessible label for the dismiss button. */
	dismissLabel?: string
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
	{
		variant = "neutral",
		size = "sm",
		border = false,
		dot = false,
		dotPosition = "leading",
		onDismiss,
		dismissLabel = "Dismiss",
		className,
		children,
		...props
	},
	ref,
) {
	const variantStyles = border ? borderVariantStyles : filledVariantStyles
	const hasAdornment = dot || onDismiss != null

	const dotNode = dot ? (
		<span
			aria-hidden
			className={cn(
				"inline-flex shrink-0 rounded-full",
				dotSizeStyles[size],
				dotVariantStyles[variant],
			)}
		/>
	) : null

	return (
		<span
			ref={ref}
			className={cn(
				"inline-flex items-center rounded-md font-medium leading-tight",
				sizeStyles[size],
				hasAdornment && gapStyles[size],
				variantStyles[variant],
				className,
			)}
			{...props}
		>
			{dot && dotPosition === "leading" && dotNode}
			{children}
			{dot && dotPosition === "trailing" && dotNode}
			{onDismiss && (
				<button
					type="button"
					aria-label={dismissLabel}
					onClick={onDismiss}
					className={cn(
						"-mr-0.5 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm",
						"opacity-70 transition-opacity hover:opacity-100",
						"outline-none focus-visible:ring-2 focus-visible:ring-cui-focus focus-visible:ring-offset-1",
					)}
				>
					<XMarkIcon className={dismissIconSizeStyles[size]} />
				</button>
			)}
		</span>
	)
})
