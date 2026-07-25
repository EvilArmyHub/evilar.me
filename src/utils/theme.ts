export const DARK_MODE_MEDIA_QUERY = "(prefers-color-scheme: dark)";
export const THEME_APPLIED_EVENT = "theme-applied";
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_CHANGE_EVENT = "theme-change";
export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "light" | "dark";

export interface ThemeChangeDetail {
	theme: ThemePreference;
	persist?: boolean;
}

export function isThemePreference(value: unknown): value is ThemePreference {
	return value === "light" || value === "dark";
}

export function getRootTheme(): ThemePreference | null {
	const theme = document.documentElement.dataset.theme;
	return isThemePreference(theme) ? theme : null;
}

export function rootInDarkMode() {
	return getRootTheme() === "dark";
}

export function dispatchThemeApplied(theme: ThemePreference) {
	document.dispatchEvent(new CustomEvent(THEME_APPLIED_EVENT, { detail: { theme } }));
}

export function dispatchThemeChange(detail: ThemeChangeDetail) {
	document.dispatchEvent(new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, { detail }));
}
