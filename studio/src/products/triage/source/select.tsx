import {useContext} from "react"
import {TriagePortal} from "./TriageEditor"
import { forwardRef, type ReactElement, type ReactNode } from "react"
import { Select as BaseSelect } from "@base-ui/react/select"
import { ChevronUpDownIcon } from "@heroicons/react/16/solid"
import { cn } from "../../change-stack/source/carrotCn"
import { Button, type ButtonSize } from "./button"
import { Menu } from "./menu"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectItem {
	value: string
	label: string
	icon?: ReactNode
	[key: string]: unknown
}

// ---------------------------------------------------------------------------
// Select (Root)
// ---------------------------------------------------------------------------

export interface SelectProps {
	/** Controlled value */
	value?: string
	/** Uncontrolled default value */
	defaultValue?: string
	/** Called when a value is selected */
	onValueChange?: (value: string) => void
	/** Item data for rendering and value display */
	items: SelectItem[]
	/** Whether the select is disabled */
	disabled?: boolean
	children: ReactNode
	className?: string
}

/**
 * Select component for choosing from a list of predefined options.
 *
 * For searchable/filterable lists, use Combobox instead.
 *
 * Wraps Base UI Select.Root with shared Menu visual primitives.
 */
export function Select({
	value,
	defaultValue,
	onValueChange,
	items,
	disabled,
	children,
	className,
}: SelectProps): ReactElement {
	return (
		<BaseSelect.Root
			value={value}
			defaultValue={defaultValue}
			onValueChange={
				onValueChange
					? val => {
							if (val != null) onValueChange(val)
						}
					: undefined
			}
			items={items}
			disabled={disabled}
		>
			{className ? <div className={className}>{children}</div> : children}
		</BaseSelect.Root>
	)
}

// ---------------------------------------------------------------------------
// SelectTrigger — composable
// ---------------------------------------------------------------------------

export interface SelectTriggerProps {
	children: ReactNode
	className?: string
}

/**
 * Fully composable trigger. Renders whatever children you give it as the
 * element that opens the select popup.
 */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
	function SelectTrigger({ children, className }, ref) {
		return (
			<BaseSelect.Trigger
				ref={ref}
				className={cn(
					"cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cui-focus focus-visible:ring-offset-2 rounded",
					className,
				)}
			>
				{children}
			</BaseSelect.Trigger>
		)
	},
)

// ---------------------------------------------------------------------------
// SelectButton — pre-styled trigger
// ---------------------------------------------------------------------------

export interface SelectButtonProps {
	/** Placeholder text shown when no value is selected */
	placeholder?: string
	/** Size of the button */
	size?: ButtonSize
	className?: string
}

/**
 * Pre-styled trigger for form contexts.
 * Renders as a Button with the selected value + chevron icon.
 */
export const SelectButton = forwardRef<HTMLButtonElement, SelectButtonProps>(
	function SelectButton({ placeholder, size, className }, ref) {
		return (
			<BaseSelect.Trigger
				ref={ref}
				render={
					<Button
						variant="outline"
						size={size}
						iconRight={<ChevronUpDownIcon />}
						className={className}
					>
						<BaseSelect.Value placeholder={placeholder} />
					</Button>
				}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// SelectContent — popup with list
// ---------------------------------------------------------------------------

export interface SelectContentProps {
	/** Alignment relative to trigger */
	align?: "start" | "center" | "end"
	/** Side relative to the trigger */
	side?: "top" | "bottom" | "left" | "right"
	/** Offset from the trigger in px */
	sideOffset?: number
	/** Minimum width */
	minWidth?: string
	/** SelectOption elements */
	children?: ReactNode
	className?: string
}

/**
 * Popup with a scrollable list of options.
 * Uses Base UI Select primitives with shared Menu visuals.
 */
export function SelectContent({
	align = "start",
	side = "bottom",
	sideOffset = 4,
	minWidth = "min-w-[220px]",
	children,
	className,
}: SelectContentProps): ReactElement {
	return (
		<BaseSelect.Portal container={useContext(TriagePortal)}>
			<BaseSelect.Positioner positionMethod="absolute"
				align={align}
				side={side}
				sideOffset={sideOffset}
				alignItemWithTrigger={false}
				render={<Menu.Positioner />}
			>
				<BaseSelect.Popup
					render={<Menu.Panel minWidth={minWidth} className={className} />}
				>
					<BaseSelect.List render={<Menu.List />}>{children}</BaseSelect.List>
				</BaseSelect.Popup>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	)
}

// ---------------------------------------------------------------------------
// SelectOption
// ---------------------------------------------------------------------------

export interface SelectOptionProps {
	/** Value for this option */
	value: string
	/** Icon element rendered before the label */
	icon?: ReactNode
	children: ReactNode
	className?: string
}

/**
 * Individual option in the select popup.
 * Automatically includes a checkmark indicator when selected.
 */
export const SelectOption = forwardRef<HTMLDivElement, SelectOptionProps>(
	function SelectOption({ value, icon, children, className }, ref) {
		return (
			<BaseSelect.Item
				ref={ref}
				value={value}
				render={<Menu.Item icon={icon} className={className} />}
			>
				<BaseSelect.ItemText className="relative z-[1] flex-1">
					{children}
				</BaseSelect.ItemText>
				<BaseSelect.ItemIndicator render={<Menu.ItemIndicator />} />
			</BaseSelect.Item>
		)
	},
)

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

export interface SelectSeparatorProps {
	className?: string
}

export const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(
	function SelectSeparator({ className }, ref) {
		return (
			<BaseSelect.Separator
				ref={ref}
				render={<Menu.Separator className={className} />}
			/>
		)
	},
)

// ---------------------------------------------------------------------------
// SelectGroup / SelectGroupLabel
// ---------------------------------------------------------------------------

export interface SelectGroupProps {
	className?: string
	children: ReactNode
}

export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(
	function SelectGroup({ className, children }, ref) {
		return (
			<BaseSelect.Group ref={ref} className={cn("flex flex-col", className)}>
				{children}
			</BaseSelect.Group>
		)
	},
)

export interface SelectGroupLabelProps {
	className?: string
	children: ReactNode
}

export const SelectGroupLabel = forwardRef<
	HTMLDivElement,
	SelectGroupLabelProps
>(function SelectGroupLabel({ className, children }, ref) {
	return (
		<BaseSelect.GroupLabel
			ref={ref}
			render={<Menu.GroupLabel className={className} />}
		>
			{children}
		</BaseSelect.GroupLabel>
	)
})
