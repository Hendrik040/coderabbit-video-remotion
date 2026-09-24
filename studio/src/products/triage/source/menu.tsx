import { forwardRef, type ReactNode, type ComponentProps } from "react"
import { MagnifyingGlassIcon, CheckIcon } from "@heroicons/react/16/solid"
import { cn } from "../../change-stack/source/carrotCn"

// ---------------------------------------------------------------------------
// Menu.Panel — Popup container
// ---------------------------------------------------------------------------

export interface MenuPanelProps extends ComponentProps<"div"> {
	/** Minimum width utility class */
	minWidth?: string
}

const MenuPanel = forwardRef<HTMLDivElement, MenuPanelProps>(function MenuPanel(
	{ minWidth, className, children, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(
				"flex flex-col bg-cui-base-2 border border-cui-neutral rounded-lg shadow-md p-1",
				minWidth,
				// Animation (works with Base UI data attributes)
				"origin-[var(--transform-origin)] will-change-[transform,opacity]",
				"transition-[transform,scale,opacity] duration-200 ease-cui-out-expo",
				"data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0",
				"data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
				"motion-reduce:transition-none",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
})

// ---------------------------------------------------------------------------
// Menu.Item — Option row with hover overlay + press squish
// ---------------------------------------------------------------------------

export interface MenuItemProps extends ComponentProps<"div"> {
	/** Icon element rendered before the label */
	icon?: ReactNode
	/** Indicator element rendered after the label (e.g. checkmark) */
	indicator?: ReactNode
	/** Danger styling (red text) */
	variant?: "default" | "danger"
}

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
	{ icon, indicator, variant = "default", className, children, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(
				"group relative flex items-center gap-2 px-2 py-1.5 text-cui-base cursor-pointer rounded select-none outline-none",
				variant === "danger"
					? "text-cui-danger data-[highlighted]:text-cui-danger"
					: "text-cui-primary",
				className,
			)}
			{...props}
		>
			{/* Hover + press overlay */}
			<div
				className={cn(
					"absolute inset-0 rounded-[inherit] bg-cui-subtle opacity-0",
					// Base UI Menu + Combobox
					"group-data-[highlighted]:opacity-100",
					// Base UI Select
					"group-data-[selected]:opacity-100",
					// cmdk
					"group-data-[selected=true]:opacity-100",
					// Squish on press
					"transition-[inset] duration-150 ease-cui-out-expo motion-reduce:transition-none",
					"group-active:inset-px",
				)}
			/>
			{icon && (
				<span
					className={cn(
						"relative z-[1] flex size-5 shrink-0 items-center justify-center [&>svg]:size-4",
						variant === "danger"
							? "text-cui-danger"
							: "text-cui-tertiary group-data-[highlighted]:text-cui-primary group-data-[selected]:text-cui-primary group-data-[selected=true]:text-cui-primary",
					)}
				>
					{icon}
				</span>
			)}
			{children}
			{indicator && (
				<span className="text-cui-accent relative z-[1] ml-auto [&>svg]:size-4">
					{indicator}
				</span>
			)}
		</div>
	)
})

// ---------------------------------------------------------------------------
// Menu.ItemIndicator — Checkmark icon for selected items
// ---------------------------------------------------------------------------

export interface MenuItemIndicatorProps {
	className?: string
}

const MenuItemIndicator = forwardRef<HTMLSpanElement, MenuItemIndicatorProps>(
	function MenuItemIndicator({ className }, ref) {
		return (
			<span
				ref={ref}
				className={cn(
					"relative z-[1] ml-auto text-cui-secondary [&>svg]:size-4",
					className,
				)}
			>
				<CheckIcon />
			</span>
		)
	},
)

// ---------------------------------------------------------------------------
// Menu.List — Scrollable list container
// ---------------------------------------------------------------------------

export interface MenuListProps extends ComponentProps<"div"> {}

const MenuList = forwardRef<HTMLDivElement, MenuListProps>(function MenuList(
	{ className, children, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(
				"flex max-h-[min(var(--available-height),280px)] flex-col gap-0.5 overflow-y-auto overscroll-contain outline-none",
				"[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
})

// ---------------------------------------------------------------------------
// Menu.Separator — Divider line
// ---------------------------------------------------------------------------

export interface MenuSeparatorProps extends ComponentProps<"div"> {}

const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(
	function MenuSeparator({ className, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn("my-1 border-t border-cui-neutral", className)}
				{...props}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// Menu.GroupLabel — Section heading
// ---------------------------------------------------------------------------

export interface MenuGroupLabelProps extends ComponentProps<"div"> {}

const MenuGroupLabel = forwardRef<HTMLDivElement, MenuGroupLabelProps>(
	function MenuGroupLabel({ className, children, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn(
					"px-2 py-1.5 text-cui-sm font-medium text-cui-tertiary select-none",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		)
	},
)

// ---------------------------------------------------------------------------
// Menu.Positioner — z-index wrapper
// ---------------------------------------------------------------------------

export interface MenuPositionerProps extends ComponentProps<"div"> {}

const MenuPositioner = forwardRef<HTMLDivElement, MenuPositionerProps>(
	function MenuPositioner({ className, children, ...props }, ref) {
		return (
			<div ref={ref} className={cn("z-50 outline-none", className)} {...props}>
				{children}
			</div>
		)
	},
)

// ---------------------------------------------------------------------------
// Menu.SearchInput — Search field container (icon + input slot)
// ---------------------------------------------------------------------------

export interface MenuSearchInputProps extends ComponentProps<"div"> {}

const MenuSearchInput = forwardRef<HTMLDivElement, MenuSearchInputProps>(
	function MenuSearchInput({ className, children, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn(
					"mb-0.5 flex items-center gap-2 rounded px-2 py-1.5",
					className,
				)}
				{...props}
			>
				<MagnifyingGlassIcon className="text-cui-tertiary size-4 shrink-0" />
				{children}
			</div>
		)
	},
)

// ---------------------------------------------------------------------------
// Menu.Empty — Empty state message
// ---------------------------------------------------------------------------

export interface MenuEmptyProps extends ComponentProps<"div"> {}

const MenuEmpty = forwardRef<HTMLDivElement, MenuEmptyProps>(function MenuEmpty(
	{ className, children, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(
				"text-cui-secondary px-2 py-4 text-center text-cui-base empty:hidden",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
})

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Menu = {
	Panel: MenuPanel,
	Item: MenuItem,
	ItemIndicator: MenuItemIndicator,
	List: MenuList,
	Separator: MenuSeparator,
	GroupLabel: MenuGroupLabel,
	Positioner: MenuPositioner,
	SearchInput: MenuSearchInput,
	Empty: MenuEmpty,
}
