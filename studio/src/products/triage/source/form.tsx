import { Field } from "@base-ui/react/field"
import { forwardRef, type ComponentProps, type ReactNode } from "react"
import { cn } from "../../change-stack/source/carrotCn"

export interface FormFieldProps extends ComponentProps<typeof Field.Root> {}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
	function FormField({ className, ...props }, ref) {
		return (
			<Field.Root
				ref={ref}
				className={cn("flex flex-col gap-1.5", className)}
				{...props}
			/>
		)
	},
)

export interface FormLabelProps extends ComponentProps<typeof Field.Label> {
	required?: boolean
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
	function FormLabel({ required, className, children, ...props }, ref) {
		return (
			<Field.Label
				ref={ref}
				className={cn(
					"text-cui-base font-medium text-cui-primary",
					"data-[disabled]:text-cui-tertiary data-[disabled]:cursor-not-allowed",
					className,
				)}
				{...props}
			>
				{children}
				{required && (
					<span className="text-cui-danger ml-0.5" aria-hidden="true">
						*
					</span>
				)}
			</Field.Label>
		)
	},
)

/** Shared visual styles for standalone input (no icons) */
const inputStyles = [
	"w-full rounded-md border border-cui-neutral bg-cui-base-2 px-3 py-1.5 text-cui-base text-cui-primary",
	"outline-none",
	"placeholder:text-cui-tertiary",
	"ring-cui-neutral ring-0 transition-[box-shadow,color,border-color] duration-150 ease-out",
	"focus:ring-2 focus:border-cui-neutral-strong",
	"motion-reduce:transition-none",
	"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
	"data-[invalid]:border-cui-danger data-[invalid]:focus:ring-cui-danger/30",
	"data-[valid]:border-cui-success",
]

/** Wrapper styles when icons are present - mirrors inputStyles but uses has-[:focus] */
const wrapperStyles = [
	"rounded-md border border-cui-neutral bg-cui-base-2 py-1.5 text-cui-base",
	"ring-cui-neutral ring-0 transition-[box-shadow,color,border-color] duration-150 ease-out",
	"has-[:focus]:ring-2 has-[:focus]:border-cui-neutral-strong",
	"motion-reduce:transition-none",
	"has-[*[data-disabled]]:cursor-not-allowed has-[*[data-disabled]]:opacity-50",
	"has-[*[data-invalid]]:border-cui-danger has-[*[data-invalid]:focus]:ring-cui-danger/30",
	"has-[*[data-valid]]:border-cui-success",
]

export interface FormInputProps extends ComponentProps<typeof Field.Control> {
	/** Icon element rendered before the input */
	iconLeft?: ReactNode
	/** Icon element rendered after the input */
	iconRight?: ReactNode
	/** Additional classes on the outer wrapper (only when icons are present) */
	wrapperClassName?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
	function FormInput(
		{ iconLeft, iconRight, wrapperClassName, className, ...props },
		ref,
	) {
		const hasIcon = !!iconLeft || !!iconRight

		// Plain input - no wrapper needed
		if (!hasIcon) {
			return (
				<Field.Control
					ref={ref}
					className={cn(inputStyles, className)}
					{...props}
				/>
			)
		}

		// Wrapped input - border/focus lives on the wrapper, inner input is unstyled
		return (
			<div
				className={cn(
					"flex items-center gap-2 px-2.5",
					wrapperStyles,
					wrapperClassName,
				)}
			>
				{iconLeft && (
					<span className="text-cui-tertiary flex size-5 shrink-0 items-center justify-center [&>svg]:size-4">
						{iconLeft}
					</span>
				)}
				<Field.Control
					ref={ref}
					className={cn(
						"flex-1 min-w-0 h-full bg-transparent text-cui-base text-cui-primary outline-none placeholder:text-cui-tertiary",
						className,
					)}
					{...props}
				/>
				{iconRight && (
					<span className="text-cui-tertiary flex size-5 shrink-0 items-center justify-center [&>svg]:size-4">
						{iconRight}
					</span>
				)}
			</div>
		)
	},
)

export interface FormTextareaProps extends ComponentProps<
	typeof Field.Control
> {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
	function FormTextarea({ className, ...props }, ref) {
		return (
			<Field.Control
				ref={ref}
				render={<textarea />}
				className={cn(inputStyles, "min-h-20 resize-y", className)}
				{...props}
			/>
		)
	},
)

export interface FormHintProps extends ComponentProps<
	typeof Field.Description
> {}

export const FormHint = forwardRef<HTMLParagraphElement, FormHintProps>(
	function FormHint({ className, ...props }, ref) {
		return (
			<Field.Description
				ref={ref}
				className={cn(
					"text-cui-sm text-cui-tertiary data-[invalid]:text-cui-danger",
					className,
				)}
				{...props}
			/>
		)
	},
)

export const Form = {
	Field: FormField,
	Label: FormLabel,
	Input: FormInput,
	Textarea: FormTextarea,
	Hint: FormHint,
}
