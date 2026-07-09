import { getEmDashEntry, getI18nConfig } from "emdash";

const LOCALE_PARAM = "lang";

/**
 * Default locale for visitors who haven't picked one. Reads the CMS-editable
 * "Default language" field (Site Appearance -> edit in
 * /_emdash/admin/content/site_appearance), falling back to astro.config.mjs's
 * `i18n.defaultLocale`, then "en".
 */
export async function getDefaultLocale(): Promise<string> {
	const { entry } = await getEmDashEntry("site_appearance", "default");
	return entry?.data.default_language ?? getI18nConfig()?.defaultLocale ?? "en";
}

/**
 * Resolve the locale for this request (`?lang=` query param, else the
 * CMS-configured default) alongside the default locale itself, so callers
 * can build links with `localeHref` without a second lookup.
 */
export async function getRequestLocale(url: URL): Promise<{ locale: string; defaultLocale: string }> {
	const defaultLocale = await getDefaultLocale();
	const locale = url.searchParams.get(LOCALE_PARAM) ?? defaultLocale;
	return { locale, defaultLocale };
}

/** Append `?lang=` to `path` unless `locale` matches `defaultLocale`. */
export function localeHref(path: string, locale: string, defaultLocale: string): string {
	if (locale === defaultLocale) return path;
	const separator = path.includes("?") ? "&" : "?";
	return `${path}${separator}${LOCALE_PARAM}=${encodeURIComponent(locale)}`;
}
