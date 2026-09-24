import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [{ "text-cui": ["sm", "base", "lg", "xl"] }],
			"text-color": [
				{
					"text-cui": [
						"primary",
						"secondary",
						"tertiary",
						"inverse",
						"accent",
						"accent-on",
						"danger",
						"danger-on",
						"warn",
						"warn-on",
						"success",
						"success-on",
					],
				},
			],
		},
	},
})

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
