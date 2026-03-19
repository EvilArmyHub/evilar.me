import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
	plugins: [require("@tailwindcss/typography")],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Inter", ...defaultTheme.fontFamily.sans],
				display: ["Fraunces", ...defaultTheme.fontFamily.serif],
			},
			typography: () => ({
				DEFAULT: {
					css: {
						fontSize: "1em",
						lineHeight: "1.75",
						a: {
							color: "var(--color-link)",
							textDecoration: "none",
							"&:hover": {
								"@media (hover: hover)": {
									color: "var(--color-link-hover)",
								},
							},
							"&:focus-visible": {
								color: "var(--color-link-hover)",
								outline: "none",
							},
						},
						h1: {
							fontFamily: "var(--font-display)",
							fontWeight: "650",
							letterSpacing: "-0.03em",
						},
						"h2, h3, h4": {
							fontFamily: "var(--font-display)",
							fontWeight: "600",
							letterSpacing: "-0.02em",
						},
						blockquote: {
							borderLeftWidth: "0",
							background: "color-mix(in oklab, var(--color-accent) 8%, transparent)",
							borderRadius: "1rem",
							padding: "1.25rem 1.5rem",
						},
						code: {
							border: "1px dotted #666",
							borderRadius: "2px",
						},
						kbd: {
							"&:where([data-theme='dark'], [data-theme='dark'] *)": {
								background: "var(--color-global-text)",
							},
						},
						hr: {
							borderTopStyle: "dashed",
						},
						strong: {
							fontWeight: "700",
						},
						table: {
							fontSize: "0.9em",
						},
						sup: {
							marginInlineStart: "calc(var(--spacing) * 0.5)",
							a: {
								"&:after": {
									content: "']'",
								},
								"&:before": {
									content: "'['",
								},
								"&:hover": {
									"@media (hover: hover)": {
										color: "var(--color-link)",
									},
								},
							},
						},
						/* Table */
						"tbody tr": {
							borderBottomWidth: "none",
						},
						tfoot: {
							borderTop: "1px dashed #666",
						},
						thead: {
							borderBottomWidth: "none",
						},
						"thead th": {
							borderBottom: "1px dashed #666",
							fontWeight: "700",
						},
						'th[align="center"], td[align="center"]': {
							"text-align": "center",
						},
						'th[align="right"], td[align="right"]': {
							"text-align": "right",
						},
						'th[align="left"], td[align="left"]': {
							"text-align": "left",
						},
						".expressive-code, .admonition, .github-card": {
							marginTop: "calc(var(--spacing)*4)",
							marginBottom: "calc(var(--spacing)*4)",
						},
					},
				},
				sm: {
					css: {
						code: {
							fontSize: "var(--text-sm)",
							fontWeight: "400",
						},
					},
				},
			}),
		},
	},
} satisfies Config;
