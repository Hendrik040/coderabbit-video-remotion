import { cn } from "../../change-stack/source/carrotCn"

// ---------------------------------------------------------------------------
// 3x3 Pixel Spinner
//
// A square pixel spinner with multiple animation variants. All 9 cells are
// animated — the variant determines the pattern.
//
// Grid position indices:
//   0 1 2
//   3 4 5
//   6 7 8
// ---------------------------------------------------------------------------

/**
 * Perimeter ring (clockwise from top-left), excluding center (4).
 * Used by variants that rotate around the edge.
 */
const RING_ORDER = [0, 1, 2, 5, 8, 7, 6, 3] as const

/**
 * Diagonal sweep order (top-left to bottom-right, anti-diagonal lines).
 * Cells on the same anti-diagonal share the same index.
 *   0: top-left only
 *   1: anti-diagonal through (0,1) & (1,0)
 *   ...
 *   4: bottom-right only
 */
const DIAGONAL_INDEX = [0, 1, 2, 1, 2, 3, 2, 3, 4] as const

export type PixelSpinnerVariant =
	/** One dim cell rotates around a bright ring; center bright */
	| "hole"
	/** Trail of 5 fading cells chases around the ring; center dim */
	| "trail"
	/** Diagonal wave sweeps from top-left to bottom-right */
	| "wave"
	/** Rings expand outward: center to middle to corners, repeating */
	| "radiate"
	/** All cells pulse together */
	| "pulse"
	/** All cells flicker independently (TV static) */
	| "static"

export type PixelSpinnerSize = "xs" | "sm" | "md" | "lg"

const sizeMap: Record<PixelSpinnerSize, number> = {
	xs: 10,
	sm: 14,
	md: 20,
	lg: 32,
}

export interface PixelSpinnerProps {
	/** Animation variant */
	variant?: PixelSpinnerVariant
	/**
	 * Size preset or raw px value.
	 * Presets: `xs` = 10px, `sm` = 14px, `md` = 20px, `lg` = 32px.
	 * Default is `xs`.
	 */
	size?: PixelSpinnerSize | number
	/** Gap between pixels as a fraction of pixel size (0-1). Default 0.25. */
	gap?: number
	/** Cycle duration in seconds. Default 1.2. */
	duration?: number
	className?: string
}

// ---------------------------------------------------------------------------
// Keyframe injection — done once per page, shared across all spinners
// ---------------------------------------------------------------------------

let styleInjected = false
function injectKeyframes() {
	if (styleInjected) return
	if (typeof document === "undefined") return

	const css = `
@keyframes pxs-ring-on {
  0% { opacity: var(--hi); }
  12.5%, 100% { opacity: var(--lo); }
}
@keyframes pxs-ring-off {
  0% { opacity: var(--lo); }
  12.5%, 100% { opacity: var(--hi); }
}
@keyframes pxs-trail-5 {
  0% { opacity: var(--hi); }
  12.5% { opacity: 0.75; }
  25% { opacity: var(--mid); }
  37.5% { opacity: 0.25; }
  50% { opacity: var(--lo); }
  100% { opacity: var(--lo); }
}
@keyframes pxs-wave {
  0%, 100% { opacity: var(--lo); }
  40%, 60% { opacity: var(--hi); }
}
@keyframes pxs-radiate {
  0%, 100% { opacity: var(--lo); }
  20%, 40% { opacity: var(--hi); }
}
@keyframes pxs-pulse {
  0%, 100% { opacity: var(--lo); }
  50% { opacity: var(--hi); }
}
@keyframes pxs-flicker-a { 0%, 100% { opacity: var(--hi); } 33% { opacity: var(--lo); } 66% { opacity: var(--mid); } }
@keyframes pxs-flicker-b { 0%, 100% { opacity: var(--lo); } 25% { opacity: var(--hi); } 75% { opacity: var(--mid); } }
@keyframes pxs-flicker-c { 0%, 100% { opacity: var(--mid); } 40% { opacity: var(--hi); } 80% { opacity: var(--lo); } }
@media (prefers-reduced-motion: reduce) {
  .pxs-cell { animation: none !important; opacity: var(--mid) !important; }
}
`
	const style = document.createElement("style")
	style.setAttribute("data-pxs", "")
	style.textContent = css
	document.head.appendChild(style)
	styleInjected = true
}

// ---------------------------------------------------------------------------
// Per-cell animation resolution
// ---------------------------------------------------------------------------

/** Returns a CSS `animation` shorthand for the given cell and variant. */
function getCellAnim(
	variant: PixelSpinnerVariant,
	cellIndex: number,
	duration: number,
): string | null {
	const d = `${duration}s`

	switch (variant) {
		case "hole": {
			// Center stays bright, perimeter cells take turns being dim
			if (cellIndex === 4) return null
			const ringIndex = RING_ORDER.indexOf(
				cellIndex as 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8,
			)
			const delay = -(ringIndex / 8) * duration
			return `pxs-ring-off ${d} ${delay.toFixed(3)}s steps(1) infinite`
		}
		case "trail": {
			// Trail of 5 cells chases around the ring
			if (cellIndex === 4) return null
			const ringIndex = RING_ORDER.indexOf(
				cellIndex as 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8,
			)
			const delay = -(ringIndex / 8) * duration
			return `pxs-trail-5 ${d} ${delay.toFixed(3)}s linear infinite`
		}
		case "wave": {
			// Anti-diagonal sweep: each diagonal peaks at a different time
			const diag = DIAGONAL_INDEX[cellIndex] ?? 0
			// 5 diagonals → stagger across 80% of the cycle, 20% gap between sweeps
			const delay = -(diag / 5) * duration
			return `pxs-wave ${d} ${delay.toFixed(3)}s ease-in-out infinite`
		}
		case "radiate": {
			// Center → middle cross (not in 3x3 so we use edges: 1,3,5,7) → corners (0,2,6,8)
			const ringTier =
				cellIndex === 4 ? 0 : [1, 3, 5, 7].includes(cellIndex) ? 1 : 2
			const delay = -(ringTier / 3) * duration
			return `pxs-radiate ${d} ${delay.toFixed(3)}s ease-in-out infinite`
		}
		case "pulse": {
			// Subtle stagger so the pulse has a gentle ripple
			const delay = -(cellIndex / 9) * duration * 0.3
			return `pxs-pulse ${d} ${delay.toFixed(3)}s ease-in-out infinite`
		}
		case "static": {
			const anims = ["pxs-flicker-a", "pxs-flicker-b", "pxs-flicker-c"]
			const anim = anims[cellIndex % 3]
			const delay = -((cellIndex * 0.17) % 1) * duration
			return `${anim} ${d} ${delay.toFixed(3)}s ease-in-out infinite`
		}
	}
}

/** Returns the resting opacity for a non-animated cell in a given variant. */
function getRestOpacity(
	variant: PixelSpinnerVariant,
	cellIndex: number,
): number {
	// Only hole/trail have a non-animated center
	if (cellIndex !== 4) return 0
	if (variant === "hole") return 1 // bright center
	if (variant === "trail") return 0 // invisible center
	return 0
}

// ---------------------------------------------------------------------------
// PixelSpinner
// ---------------------------------------------------------------------------

/**
 * A 3x3 pixel-grid spinner with configurable animation variants.
 *
 * All 9 cells render; the `variant` controls how they animate:
 *
 * - `hole`     One dim cell rotates around a bright ring (center bright)
 * - `trail`    A fading 5-cell trail chases around the ring
 * - `wave`     Anti-diagonal wave sweeps top-left to bottom-right
 * - `radiate`  Rings expand outward: center to edges to corners
 * - `pulse`    All cells breathe together with a subtle ripple
 * - `static`   Cells flicker independently (TV static)
 */
export function PixelSpinner({
	variant = "wave",
	size = "xs",
	gap = 0.25,
	duration = 1.2,
	className,
}: PixelSpinnerProps) {
	if (typeof document !== "undefined") injectKeyframes()

	const px = typeof size === "number" ? size : sizeMap[size]

	// Compute pixel + gap layout
	// Total size = 3 * pixel + 2 * (pixel * gap), so pixel = px / (3 + 2*gap)
	const pixel = px / (3 + 2 * gap)
	const step = pixel * (1 + gap)

	const cells = Array.from({ length: 9 }, (_, i) => ({
		row: Math.floor(i / 3),
		col: i % 3,
		cellIndex: i,
	}))

	return (
		<span
			aria-label="Loading"
			role="status"
			className={cn("inline-block text-current", className)}
			style={{
				width: px,
				height: px,
				// CSS vars consumed by the keyframes
				["--lo" as string]: "0",
				["--mid" as string]: "0.5",
				["--hi" as string]: "1",
			}}
		>
			<svg
				width={px}
				height={px}
				viewBox={`0 0 ${px} ${px}`}
				aria-hidden="true"
			>
				{cells.map(({ row, col, cellIndex }) => {
					const anim = getCellAnim(variant, cellIndex, duration)
					const restOpacity = getRestOpacity(variant, cellIndex)
					return (
						<rect
							key={cellIndex}
							className="pxs-cell"
							x={col * step}
							y={row * step}
							width={pixel}
							height={pixel}
							fill="currentColor"
							style={{
								opacity: restOpacity,
								animation: anim ?? "none",
							}}
						/>
					)
				})}
			</svg>
		</span>
	)
}
