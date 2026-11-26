// ── hreflang: the languages a page exists in ─────────────────────────────────
// A page declares its other languages only where it has a translation in a
// language that is published: search engines are told about a translation when
// there is one, and an English page with none is exactly what it was. The
// rule is the brief's ("only for languages that are published and where that
// page has a translation").

import { getPublishedLocales } from "@/lib/locale";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { articleTranslationLocales, pageTranslationLocalesBySlug, projectTranslationLocales, settingTranslationLocales } from "@/lib/translations/store";

/// What a page is: a saved setting (the homepage, the news page, the landing
/// page), a page, an article or a development.
export type PageIdentity = { setting: string } | { page: string } | { article: string } | { project: string };

/// The published languages, English aside, that a page has a translation in.
export async function pageLanguages(identity: PageIdentity): Promise<Locale[]> {
  // Both reads go out together: a page's metadata must not wait on them.
  const [all, lookup] = await Promise.all([
    getPublishedLocales(),
    "setting" in identity ? settingTranslationLocales([identity.setting])
      : "page" in identity ? pageTranslationLocalesBySlug([identity.page])
      : "article" in identity ? articleTranslationLocales([identity.article])
      : projectTranslationLocales([identity.project]),
  ]);
  const found = "setting" in identity ? lookup.get(identity.setting) : "page" in identity ? lookup.get(identity.page) : "article" in identity ? lookup.get(identity.article) : lookup.get(identity.project);
  return all.filter((locale) => locale !== DEFAULT_LOCALE && found?.includes(locale));
}
