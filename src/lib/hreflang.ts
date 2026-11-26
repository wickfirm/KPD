// ── hreflang: the languages a page exists in ─────────────────────────────────
// A page declares its other languages only where it has a translation in a
// language that is published: search engines are told about a translation when
// there is one, and an English page with none is exactly what it was. The
// rule is the brief's ("only for languages that are published and where that
// page has a translation").
//
// How it is read matters as much as what is read. Next does not hold a page
// back for its metadata: a metadata that resolves after the page is streamed
// to the end of the HTML instead of into its head. The page itself is the
// same, but anything that reads the HTML without running scripts finds the
// title at the bottom. So the page awaits this read too. It is made once a
// request (React's cache), and the page and its metadata wait on the same
// promise: neither can be ready before it.

import { cache } from "react";
import { getPublishedLocales } from "@/lib/locale";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { articleTranslationLocales, pageTranslationLocalesBySlug, projectTranslationLocales, settingTranslationLocales } from "@/lib/translations/store";

/// What a page is: a saved setting (the homepage, the news page, the landing
/// page), a page, an article or a development.
export type PageKind = "setting" | "page" | "article" | "project";
export type PageIdentity = { setting: string } | { page: string } | { article: string } | { project: string };

/// The published languages, English aside, that a page has a translation in.
/// Read once a request, whoever asks.
export const pageLanguagesOf = cache(async (kind: PageKind, id: string): Promise<Locale[]> => {
  // Both reads go out together.
  const [published, lookup] = await Promise.all([
    getPublishedLocales(),
    kind === "setting" ? settingTranslationLocales([id])
      : kind === "page" ? pageTranslationLocalesBySlug([id])
      : kind === "article" ? articleTranslationLocales([id])
      : projectTranslationLocales([id]),
  ]);
  return published.filter((locale) => locale !== DEFAULT_LOCALE && lookup.get(id)?.includes(locale));
});

/// The same, named by what the page is.
export function pageLanguages(identity: PageIdentity): Promise<Locale[]> {
  return pageLanguagesOf(
    "setting" in identity ? "setting" : "page" in identity ? "page" : "article" in identity ? "article" : "project",
    "setting" in identity ? identity.setting : "page" in identity ? identity.page : "article" in identity ? identity.article : identity.project,
  );
}
