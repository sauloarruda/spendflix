import { register, init, getLocaleFromNavigator } from "svelte-i18n";

// Register all locales
register("pt", () => import("./locales/pt.json"));
register("en", () => import("./locales/en.json"));

// Normalize locale (pt-BR -> pt, en-US -> en, etc.)
function normalizeLocale(locale: string | null): string {
	if (!locale) return "en";
	const lang = locale.split("-")[0].toLowerCase();
	return lang === "pt" ? "pt" : lang === "en" ? "en" : "en";
}

// Initialize i18n
const detectedLocale = getLocaleFromNavigator();
const normalizedLocale = normalizeLocale(detectedLocale);

init({
	fallbackLocale: "en",
	initialLocale: normalizedLocale,
});

// Export the translation function and loading state
export { _, isLoading } from "svelte-i18n";
