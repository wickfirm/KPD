import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, LOCALE_PREVIEW_HEADER, type Locale } from "@/lib/locales";
import { localesSettingKey, parsePublishedLocales, parseSwitcherShown } from "@/lib/published-locales";

export { LOCALE_HEADER };

// ── The language of this response ────────────────────────────────────────────
//
// The middleware sets the request header from the /ar or /ja prefix, or from
// ?lang= on an admin preview; every other request is English. Server components
// and generateMetadata() call getLocale(); client components receive the locale
// as a prop, because they cannot read request headers. Data loaders take the
// locale as an argument for the same reason.

/// Cached per request, so any number of server components can ask.
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/// True for an admin preview of a translation (?lang=ar), which is allowed to
/// show a language that is not published yet.
export const getIsLocalePreview = cache(async (): Promise<boolean> => (await headers()).get(LOCALE_PREVIEW_HEADER) === "1");

// ── Published languages ──────────────────────────────────────────────────────

/// The one "locales" row: which languages are switched on, and whether the
/// language switcher is switched on with them. Never throws: when the row
/// cannot be read, nothing but English is reachable and nothing is offered.
export const getLanguageSettings = cache(async (): Promise<{ published: Locale[]; switcher: boolean }> => {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: localesSettingKey } });
    return { published: parsePublishedLocales(row?.value), switcher: parseSwitcherShown(row?.value) };
  } catch {
    return { published: [], switcher: false };
  }
});

/// The languages the client has switched on (Site settings → Languages): the
/// ones that can be reached at their addresses.
export const getPublishedLocales = cache(async (): Promise<Locale[]> => (await getLanguageSettings()).published);

/// The languages the switcher offers. Until it is switched on, that is none: a
/// language can then be reached at its address without being offered to
/// visitors, and its pages are kept out of search (see the root layout).
export const getSwitcherLocales = cache(async (): Promise<Locale[]> => {
  const { published, switcher } = await getLanguageSettings();
  return switcher ? published : [];
});

/// Whether the language switcher is switched on.
export const getSwitcherShown = cache(async (): Promise<boolean> => (await getLanguageSettings()).switcher);
