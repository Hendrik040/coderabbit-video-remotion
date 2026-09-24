import { forwardRef } from "react"
import { cn } from "../../change-stack/source/carrotCn"
import { PixelSpinner } from "./pixel-spinner"
import type { PixelSpinnerVariant } from "./pixel-spinner"

export interface SpinnerProps {
	/** Text label shown next to the spinner. */
	label?: string
	/** Show the animated dots after the label. */
	showDots?: boolean
	/** Show the pixel spinner glyph. */
	showSpinner?: boolean
	/** Size variant. */
	size?: "sm" | "md"
	/** Animation variant for the pixel spinner. Defaults to `wave`. */
	variant?: PixelSpinnerVariant
	className?: string
}

const spinnerPxBySize = {
	sm: 10,
	md: 12,
} as const

/**
 * Text loading indicator with a 3x3 pixel spinner and animated dots.
 *
 * Uses `PixelSpinner` for the animated glyph and a CSS animation to cycle
 * an animated dots suffix on the label text.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
	function Spinner(
		{
			label,
			showDots = true,
			showSpinner = true,
			size = "md",
			variant = "wave",
			className,
		},
		ref,
	) {
		const textSize = size === "sm" ? "text-cui-sm" : "text-[13px]"
		const spinnerPx = spinnerPxBySize[size]

		return (
			<span
				ref={ref}
				className={cn("inline-flex items-center gap-1.5", className)}
			>
				{showSpinner && (
					<PixelSpinner variant={variant} size={spinnerPx} duration={1.2} />
				)}
				{label && (
					<span className={cn("text-current", textSize)}>
						{label}
						{showDots && (
							<span className="after:animate-cui-dot-cycle inline-block w-[2ch] text-left after:content-['.']" />
						)}
					</span>
				)}
			</span>
		)
	},
)
