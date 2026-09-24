import {
	forwardRef,
	type ComponentPropsWithoutRef,
	type ReactNode,
} from "react"
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"
import { cn } from "../../change-stack/source/carrotCn"

const sizeStyles = {
	sm: { root: "size-4 rounded-[4px]", icon: "size-3", label: "text-cui-sm" },
	md: {
		root: "size-[18px] rounded-[5px]",
		icon: "size-3.5",
		label: "text-cui-base",
	},
} as const

export type CheckboxSize = keyof typeof sizeStyles

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckboxProps extends ComponentPropsWithoutRef<
	typeof BaseCheckbox.Root
> {
	/** Size of the checkbox. */
	size?: CheckboxSize
	/** Optional label rendered beside the checkbox. */
	label?: ReactNode
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

/**
 * Checkbox component built on Base UI Checkbox with Tailwind CSS styling.
 *
 * Supports controlled/uncontrolled usage, indeterminate state, disabled
 * state, and an optional label. The label is clickable and toggles the
 * checkbox. An expanded hit area (32px) makes the checkbox easier to click.
 *
 * Checked state uses accent color. Indeterminate state uses neutral gray
 * to visually distinguish it from a deliberate selection.
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
	function Checkbox(
		{
			checked,
			defaultChecked,
			onCheckedChange,
			indeterminate = false,
			disabled = false,
			required,
			size = "md",
			label,
			name,
			className,
			...props
		},
		ref,
	) {
		const s = sizeStyles[size]

		const root = (
			<BaseCheckbox.Root
				ref={ref}
				checked={checked}
				defaultChecked={defaultChecked}
				onCheckedChange={onCheckedChange}
				indeterminate={indeterminate}
				disabled={disabled}
				required={required}
				name={name}
				className={cn(
					"group/checkbox relative inline-flex shrink-0 items-center justify-center",
					"outline-none focus-visible:ring-2 focus-visible:ring-cui-focus focus-visible:ring-offset-2",
					"transition-colors duration-150 ease-out",
					"motion-reduce:transition-none",
					// Expanded 32px hit area via ::before pseudo-element
					"before:absolute before:inset-1/2 before:size-8 before:-translate-1/2",
					disabled
						? "pointer-events-none cursor-not-allowed border border-cui-neutral bg-cui-subtle"
						: "cursor-pointer border border-cui-neutral bg-cui-base-2 data-[checked]:border-cui-accent data-[checked]:bg-cui-accent data-[indeterminate]:border-cui-neutral-strong data-[indeterminate]:bg-cui-subtle",
					s.root,
					!label && className,
				)}
				{...props}
			>
				<BaseCheckbox.Indicator
					keepMounted
					className={cn(
						"flex items-center justify-center",
						disabled
							? "text-cui-tertiary"
							: "data-[checked]:text-cui-accent-on data-[indeterminate]:text-cui-secondary",
						// Default visible state for checked/indeterminate
						"scale-100 opacity-100",
						// Hidden while unchecked (stable state, no transition running)
						"data-[unchecked]:scale-50 data-[unchecked]:opacity-0",
						// Briefly applied by Base UI during enter/exit so the
						// transition has a start/end point.
						"data-[starting-style]:scale-50 data-[starting-style]:opacity-0",
						"data-[ending-style]:scale-50 data-[ending-style]:opacity-0",
						"transition-[scale,opacity] duration-300 ease-cui-out-expo",
						"motion-reduce:transition-none",
					)}
				>
					{indeterminate ? (
						<MinusIcon className={s.icon} />
					) : (
						<CheckIcon className={s.icon} />
					)}
				</BaseCheckbox.Indicator>
			</BaseCheckbox.Root>
		)

		if (!label) return root

		return (
			<label
				className={cn(
					"inline-flex items-center gap-2 select-none",
					disabled ? "cursor-not-allowed" : "cursor-pointer",
					className,
				)}
			>
				{root}
				<span
					className={cn(
						s.label,
						disabled ? "text-cui-tertiary" : "text-cui-primary",
					)}
				>
					{label}
				</span>
			</label>
		)
	},
)
