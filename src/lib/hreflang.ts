// ── hreflang: the languages a page exists in ─────────────────────────────────
// A page declares its other languages only where it has a translation in a
// language that the language selector offers — the brief's rule, "only for
// languages that are published and where that page has a translation", read
// with the selector (the user's decision of 27 Nov 2026). Until the selector is
// switched on nothing is declared: those pages are then kept out of search by
// the root layout's noindex, and pointing search engines at them would be a
// mixed message. An English page with nothing declared is exactly what it was.
//
// How it is read matters as much as what is read. Next does not hold a page
// back for its metadata: a metadata that resolves after the page is streamed
// to the end of the HTML instead of into its head. The page itself is the
// same, but anything that reads the HTML without running scripts finds the
// title at the bottom. So the page awaits this read too. It is made once a
// request (React's cache), and the page and its metadata wait on the same
// promise: neither can be ready before it.

import { cache } from "react";
import { getSwitcherLocales } from "@/lib/locale";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { articleTranslationLocales, pageTranslationLocalesBySlug, projectTranslationLocales, settingTranslationLocales } from "@/lib/translations/store";

/// What a page is: a saved setting (the homepage, the news page, the landing
/// page), a page, an article or a development.
export type PageKind = "setting" | "page" | "article" | "project";
export type PageIdentity = { setting: string } | { page: string } | { article: string } | { project: string };

/// The languages the selector offers, English aside, that a page has a
/// translation in: the ones search engines are told about. Read once a
/// request, whoever asks.
export const pageLanguagesOf = cache(async (kind: PageKind, id: string): Promise<Locale[]> => {
  // Both reads go out together.
  const [offered, lookup] = await Promise.all([
    getSwitcherLocales(),
    kind === "setting" ? settingTranslationLocales([id])
      : kind === "page" ? pageTranslationLocalesBySlug([id])
      : kind === "article" ? articleTranslationLocales([id])
      : projectTranslationLocales([id]),
  ]);
  return offered.filter((locale) => locale !== DEFAULT_LOCALE && lookup.get(id)?.includes(locale));
});

/// The same, named by what the page is.
export function pageLanguages(identity: PageIdentity): Promise<Locale[]> {
  return pageLanguagesOf(
    "setting" in identity ? "setting" : "page" in identity ? "page" : "article" in identity ? "article" : "project",
    "setting" in identity ? identity.setting : "page" in identity ? identity.page : "article" in identity ? identity.article : identity.project,
  );
}
