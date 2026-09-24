import {useContext} from "react"
import {TriagePortal} from "./TriageEditor"
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"
import { forwardRef, type ComponentProps, type ReactNode } from "react"
import { cn } from "../../change-stack/source/carrotCn"

// ---------------------------------------------------------------------------
// Tooltip.Provider
// ---------------------------------------------------------------------------

export interface TooltipProviderProps extends ComponentProps<
	typeof BaseTooltip.Provider
> {}

function TooltipProvider(props: TooltipProviderProps) {
	return <BaseTooltip.Provider {...props} />
}

// ---------------------------------------------------------------------------
// Tooltip.Root
// ---------------------------------------------------------------------------

export interface TooltipRootProps extends ComponentProps<
	typeof BaseTooltip.Root
> {}

function TooltipRoot(props: TooltipRootProps) {
	return <BaseTooltip.Root {...props} />
}

// ---------------------------------------------------------------------------
// Tooltip.Trigger
// ---------------------------------------------------------------------------

export interface TooltipTriggerProps extends ComponentProps<
	typeof BaseTooltip.Trigger
> {}

const TooltipTrigger = forwardRef<HTMLButtonElement, TooltipTriggerProps>(
	function TooltipTrigger({ className, ...props }, ref) {
		return (
			<BaseTooltip.Trigger
				ref={ref}
				className={cn("outline-none", className)}
				{...props}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// Tooltip.Content
//
// Positioner sizing: w-(--positioner-width) / h-(--positioner-height)
// gives the positioner real dimensions so align="center" works with
// detached/handle triggers. Position transitions use left/top/right/bottom
// and are disabled on initial open via data-[instant]:transition-none.
//
// Popup entrance: scale+fade via data-[starting-style]/data-[ending-style],
// also disabled during group transfers via data-[instant]:transition-none
// so the pill stays visible while only its position and content change.
// ---------------------------------------------------------------------------

export interface TooltipContentProps extends ComponentProps<
	typeof BaseTooltip.Popup
> {
	/** Side relative to the trigger */
	side?: "top" | "bottom" | "left" | "right"
	/** Alignment relative to the trigger */
	align?: "start" | "center" | "end"
	/** Offset from the trigger in px */
	sideOffset?: number
	/** Content to display */
	children: ReactNode
}

function TooltipContent({
	side = "top",
	align = "center",
	sideOffset = 6,
	className,
	children,
	...props
}: TooltipContentProps) {
	return (
		<BaseTooltip.Portal container={useContext(TriagePortal)}>
			<BaseTooltip.Positioner positionMethod="absolute"
				side={side}
				align={align}
				sideOffset={sideOffset}
				className={cn(
					"z-50 outline-none",
					// Give positioner real dimensions for proper centering
					"h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)]",
					// Smooth position transition during group transfer
					"transition-[top,left,right,bottom,transform] duration-350 ease-cui-out-expo",
					// Skip position transition on initial open / close
					"data-[instant]:transition-none",
				)}
			>
				<BaseTooltip.Popup
					className={cn(
						"bg-cui-inverse text-cui-inverse rounded px-2 py-1 text-cui-sm font-medium",
						"max-w-[280px]",
						"origin-[var(--transform-origin)]",
						// Entrance/exit animation
						"transition-[transform,scale,opacity] duration-150 ease-cui-out-expo",
						"data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
						"data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
						// Skip entrance animation during group transfer (pill stays visible)
						"data-[instant]:transition-none",
						"motion-reduce:transition-none",
						className,
					)}
					{...props}
				>
					{children}
				</BaseTooltip.Popup>
			</BaseTooltip.Positioner>
		</BaseTooltip.Portal>
	)
}

// ---------------------------------------------------------------------------
// Tooltip.Viewport
//
// Wraps content inside Tooltip.Content for direction-aware transfer
// animations. Base UI sets `data-activation-direction` on this element
// (e.g. "right down") and renders `[data-current]` / `[data-previous]`
// child wrappers with `data-starting-style` / `data-ending-style`.
//
// Uses `~=` (word match) via `*=` (contains) selectors on the
// space-separated activation direction value. Transitions use
// translate + opacity on the children, matching the official Base UI
// pattern from their detached-triggers-full demo.
// ---------------------------------------------------------------------------

export interface TooltipViewportProps extends ComponentProps<
	typeof BaseTooltip.Viewport
> {}

const TooltipViewport = forwardRef<HTMLDivElement, TooltipViewportProps>(
	function TooltipViewport({ className, ...props }, ref) {
		return (
			<BaseTooltip.Viewport
				ref={ref}
				className={cn(
					"relative h-full w-full overflow-clip",
					// Children: translate + opacity transition
					"[&_[data-previous]]:transition-[translate,opacity] [&_[data-previous]]:duration-350 [&_[data-previous]]:ease-cui-out-expo",
					"[&_[data-current]]:transition-[translate,opacity] [&_[data-current]]:duration-350 [&_[data-current]]:ease-cui-out-expo",
					// Skip animation when instant (first open)
					"[&_[data-instant]_[data-current]]:transition-none [&_[data-instant]_[data-previous]]:transition-none",
					// Current: slides in from activation direction
					"[&[data-activation-direction*=left]_[data-current][data-starting-style]]:-translate-x-1/2 [&[data-activation-direction*=left]_[data-current][data-starting-style]]:opacity-0",
					"[&[data-activation-direction*=right]_[data-current][data-starting-style]]:translate-x-1/2 [&[data-activation-direction*=right]_[data-current][data-starting-style]]:opacity-0",
					"[&[data-activation-direction*=up]_[data-current][data-starting-style]]:-translate-y-1/2 [&[data-activation-direction*=up]_[data-current][data-starting-style]]:opacity-0",
					"[&[data-activation-direction*=down]_[data-current][data-starting-style]]:translate-y-1/2 [&[data-activation-direction*=down]_[data-current][data-starting-style]]:opacity-0",
					// Previous: slides out opposite to activation direction
					"[&[data-activation-direction*=left]_[data-previous][data-ending-style]]:translate-x-1/2 [&[data-activation-direction*=left]_[data-previous][data-ending-style]]:opacity-0",
					"[&[data-activation-direction*=right]_[data-previous][data-ending-style]]:-translate-x-1/2 [&[data-activation-direction*=right]_[data-previous][data-ending-style]]:opacity-0",
					"[&[data-activation-direction*=up]_[data-previous][data-ending-style]]:translate-y-1/2 [&[data-activation-direction*=up]_[data-previous][data-ending-style]]:opacity-0",
					"[&[data-activation-direction*=down]_[data-previous][data-ending-style]]:-translate-y-1/2 [&[data-activation-direction*=down]_[data-previous][data-ending-style]]:opacity-0",
					// Reduced motion
					"motion-reduce:[&_[data-current]]:!transition-none motion-reduce:[&_[data-previous]]:!transition-none",
					className,
				)}
				{...props}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// createHandle - re-export for shared tooltip pattern
// ---------------------------------------------------------------------------

export const createTooltipHandle = BaseTooltip.createHandle

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Tooltip = {
	Provider: TooltipProvider,
	Root: TooltipRoot,
	Trigger: TooltipTrigger,
	Content: TooltipContent,
	Viewport: TooltipViewport,
	createHandle: BaseTooltip.createHandle,
}
