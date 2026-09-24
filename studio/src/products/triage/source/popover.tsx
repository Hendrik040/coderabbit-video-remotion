import {useContext} from "react"
import {TriagePortal} from "./TriageEditor"
import { Popover as BasePopover } from "@base-ui/react/popover"
import { forwardRef, type ComponentProps, type ReactNode } from "react"
import { cn } from "../../change-stack/source/carrotCn"

// ---------------------------------------------------------------------------
// Popover.Root
// ---------------------------------------------------------------------------

export interface PopoverRootProps extends ComponentProps<
	typeof BasePopover.Root
> {}

function PopoverRoot(props: PopoverRootProps) {
	return <BasePopover.Root {...props} />
}

// ---------------------------------------------------------------------------
// Popover.Trigger
// ---------------------------------------------------------------------------

export interface PopoverTriggerProps extends ComponentProps<
	typeof BasePopover.Trigger
> {}

const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
	function PopoverTrigger({ className, ...props }, ref) {
		return (
			<BasePopover.Trigger
				ref={ref}
				className={cn("cursor-pointer outline-none", className)}
				{...props}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// Popover.Content
// ---------------------------------------------------------------------------

export interface PopoverContentProps extends ComponentProps<
	typeof BasePopover.Popup
> {
	/** Side relative to the trigger */
	side?: "top" | "bottom" | "left" | "right"
	/** Alignment relative to the trigger */
	align?: "start" | "center" | "end"
	/** Offset from the trigger in px */
	sideOffset?: number
	children: ReactNode
}

function PopoverContent({
	side = "bottom",
	align = "center",
	sideOffset = 4,
	className,
	children,
	...props
}: PopoverContentProps) {
	return (
		<BasePopover.Portal container={useContext(TriagePortal)}>
			<BasePopover.Positioner positionMethod="absolute"
				side={side}
				align={align}
				sideOffset={sideOffset}
				className="z-50 outline-none"
			>
				<BasePopover.Popup
					className={cn(
						"bg-cui-base-2 border border-cui-neutral rounded-md shadow-md p-3",
						"origin-[var(--transform-origin)] will-change-[transform,opacity]",
						"transition-[transform,scale,opacity] duration-200 ease-cui-out-expo",
						"data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0",
						"data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
						"motion-reduce:transition-none",
						"focus:outline-none",
						className,
					)}
					{...props}
				>
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	)
}

// ---------------------------------------------------------------------------
// Popover.Arrow
// ---------------------------------------------------------------------------

export interface PopoverArrowProps extends ComponentProps<
	typeof BasePopover.Arrow
> {}

const PopoverArrow = forwardRef<HTMLDivElement, PopoverArrowProps>(
	function PopoverArrow({ className, ...props }, ref) {
		return (
			<BasePopover.Arrow
				ref={ref}
				className={cn(
					"fill-cui-base-2 stroke-cui-neutral [stroke-width:1px]",
					"data-[side=top]:bottom-[-5px]",
					"data-[side=bottom]:top-[-5px]",
					"data-[side=left]:right-[-5px]",
					"data-[side=right]:left-[-5px]",
					className,
				)}
				{...props}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// Popover.Close
// ---------------------------------------------------------------------------

export interface PopoverCloseProps extends ComponentProps<
	typeof BasePopover.Close
> {}

const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(
	function PopoverClose({ className, ...props }, ref) {
		return <BasePopover.Close ref={ref} className={cn(className)} {...props} />
	},
)

// ---------------------------------------------------------------------------
// Popover.Title
// ---------------------------------------------------------------------------

export interface PopoverTitleProps {
	className?: string
	children: ReactNode
}

const PopoverTitle = forwardRef<HTMLParagraphElement, PopoverTitleProps>(
	function PopoverTitle({ className, children }, ref) {
		return (
			<p
				ref={ref}
				className={cn("text-cui-primary text-cui-base font-medium", className)}
			>
				{children}
			</p>
		)
	},
)

// ---------------------------------------------------------------------------
// Popover.Description
// ---------------------------------------------------------------------------

export interface PopoverDescriptionProps extends ComponentProps<
	typeof BasePopover.Description
> {}

const PopoverDescription = forwardRef<
	HTMLParagraphElement,
	PopoverDescriptionProps
>(function PopoverDescription({ className, ...props }, ref) {
	return (
		<BasePopover.Description
			ref={ref}
			className={cn("text-cui-secondary mt-1 text-cui-base", className)}
			{...props}
		/>
	)
})

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Popover = {
	Root: PopoverRoot,
	Trigger: PopoverTrigger,
	Content: PopoverContent,
	Arrow: PopoverArrow,
	Close: PopoverClose,
	Title: PopoverTitle,
	Description: PopoverDescription,
}
