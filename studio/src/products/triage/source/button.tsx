import { Button as BaseButton } from "@base-ui/react/button"
import { forwardRef, type ComponentProps, type ReactNode } from "react"
import { cn } from "../../change-stack/source/carrotCn"
import { Spinner } from "./spinner"

const variantConfig = {
	primary: {
		active: true,
		bg: "bg-cui-inverse",
		bgClassName: "shadow-xs inset-shadow-cui-primary",
		hoverOverlay: "group-hover/btn:bg-cui-inverse/90",
		text: "text-cui-inverse",
	},
	outline: {
		active: true,
		bg: "bg-cui-base-2",
		bgClassName: "border border-cui-neutral shadow-xs",
		hoverOverlay:
			"group-hover/btn:bg-cui-subtle group-active/btn:bg-cui-subtle",
		text: "text-cui-primary",
	},
	secondary: {
		active: true,
		bg: "bg-cui-subtle",
		bgClassName: "",
		hoverOverlay: "group-hover/btn:bg-cui-subtle/70",
		text: "text-cui-primary",
	},
	transparent: {
		active: false,
		bg: "",
		bgClassName: "",
		hoverOverlay:
			"group-hover/btn:bg-cui-subtle group-active/btn:bg-cui-subtle",
		text: "text-cui-secondary",
	},
	danger: {
		active: true,
		bg: "bg-cui-danger",
		bgClassName: "border border-cui-danger shadow-xs",
		hoverOverlay:
			"group-hover/btn:bg-cui-danger-strong group-active/btn:bg-cui-danger-strong",
		text: "text-cui-danger-on",
	},
	"danger-light": {
		active: true,
		bg: "bg-cui-danger-subtle",
		bgClassName: "",
		hoverOverlay:
			"group-hover/btn:bg-cui-danger/30 group-active/btn:bg-cui-danger/50",
		text: "text-cui-danger",
	},
	flush: {
		active: true,
		bg: "bg-cui-base-1",
		bgClassName: "",
		hoverOverlay:
			"group-hover/btn:bg-cui-subtle group-active/btn:bg-cui-subtle",
		text: "text-cui-primary",
	},
} as const

const sizeStyles = {
	xs: { height: "h-6", padding: "px-1.5", textPadding: "px-1", icon: "w-6" },
	sm: { height: "h-7", padding: "px-1.5", textPadding: "px-1", icon: "w-7" },
	md: { height: "h-8", padding: "px-2", textPadding: "px-1", icon: "w-8" },
} as const

export type ButtonVariant = keyof typeof variantConfig
export type ButtonSize = keyof typeof sizeStyles

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
	/** Visual style variant */
	variant?: ButtonVariant
	/** Size of the button */
	size?: ButtonSize
	/** Icon element rendered before the label */
	iconLeft?: ReactNode
	/** Icon element rendered after the label */
	iconRight?: ReactNode
	/** Free-form content rendered after the label, before iconRight */
	trailing?: ReactNode
	/** Show a loading spinner overlay */
	loading?: boolean
}

/**
 * Button component built on Base UI with Tailwind CSS styling.
 *
 * All variants use an animated hover layer for consistent press/hover
 * feedback. The layer handles bg, border, and shadow - the outer button
 * is just a layout shell.
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
	{
		variant = "outline",
		size = "md",
		iconLeft,
		iconRight,
		trailing,
		loading = false,
		disabled,
		className,
		children,
		...props
	},
	ref,
) {
	const config = variantConfig[variant]
	const s = sizeStyles[size]
	const isIconOnly = !children && !iconRight
	const sizeClass = isIconOnly
		? cn(s.height, s.icon)
		: cn(s.height, s.padding, "w-fit")

	return (
		<BaseButton
			ref={ref}
			disabled={disabled}
			className={cn(
				"group/btn relative inline-flex min-w-fit cursor-pointer items-center justify-center",
				"rounded text-cui-base whitespace-pre select-none",
				"ring-cui-focus outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ",
				disabled && "pointer-events-none opacity-50",
				config.text,
				sizeClass,
				className,
			)}
			{...props}
		>
			{/* d-hover layer */}
			<div
				className={cn(
					"absolute rounded-[inherit]",
					config.bg,
					config.bgClassName,
					config.active ? "opacity-100 inset-0" : "opacity-0 inset-1",
					!disabled && [
						"transition-[inset,opacity] duration-150 ease-cui-out-expo motion-reduce:transition-none",
						"group-hover/btn:inset-0 group-hover/btn:opacity-100",
						"group-active/btn:inset-px",
					],
				)}
			>
				{/* Hover overlay — composites on top of the base bg */}
				<div
					className={cn(
						"absolute inset-0 rounded-[inherit]",
						config.hoverOverlay,
						!disabled &&
							"transition-[background-color] duration-150 ease-cui-out-expo motion-reduce:transition-none",
					)}
				/>
			</div>

			{iconLeft && (
				<span
					className={cn(
						"relative z-[1] size-5 shrink-0 flex items-center justify-center [&>svg]:size-4",
						loading && "opacity-0",
					)}
				>
					{iconLeft}
				</span>
			)}
			{children && (
				<span
					className={cn(
						"relative z-[1] inline",
						s.textPadding,
						loading && "opacity-0",
					)}
				>
					{children}
				</span>
			)}
			{trailing && (
				<span className={cn("relative z-[1] ml-3", loading && "opacity-0")}>
					{trailing}
				</span>
			)}
			{iconRight && (
				<span
					className={cn(
						"relative z-[1] size-5 shrink-0 flex items-center justify-center [&>svg]:size-4",
						loading && "opacity-0",
					)}
				>
					{iconRight}
				</span>
			)}
			{loading && (
				<span className="absolute inset-0 z-[2] flex items-center justify-center">
					<Spinner showDots={false} size="sm" />
				</span>
			)}
		</BaseButton>
	)
})
