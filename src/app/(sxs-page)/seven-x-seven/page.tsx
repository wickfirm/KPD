import type { Metadata } from "next";
import { cache } from "react";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { SevenXSevenFresh } from "@/components/public/sxs/SevenXSevenFresh";
import { loadSxsContent } from "@/lib/sxs-content";
import { getLocale, getSwitcherLocales } from "@/lib/locale";
import { localizedSetting } from "@/lib/translations/store";
import { languageAlternates } from "@/lib/seo";
import { pageLanguages } from "@/lib/hreflang";

export const dynamic = "force-dynamic";

/// The page's languages, read once a request. Its metadata and the page itself
/// wait on the same read, so the metadata can never be ready after the page:
/// Next would then stream it at the end of the page instead of in its head,
/// and an English page would no longer be word for word what it was.
const pageInLanguages = cache(() => pageLanguages({ setting: "sxs" }));

/// A second seven x seven page, brought over from the client's residence site.
/// /developments/seven-x-seven is unchanged. Copy and media come from the CMS.
export async function generateMetadata(): Promise<Metadata> {
  const [english, locale, translated] = await Promise.all([loadSxsContent(), getLocale(), pageInLanguages()]);
  const content = await localizedSetting("sxs", english, locale);
  const title = typeof content.seo.title === "string" && content.seo.title.trim() ? content.seo.title : "seven x seven";
  const description = typeof content.seo.description === "string" && content.seo.description.trim() ? content.seo.description : "seven x seven Meydan Horizon Residences. Luxury, in balance.";
  // hreflang once the page has a translation; an English page without one is
  // exactly what it was.
  const languages = languageAlternates({ locale, path: "/seven-x-seven", translated });
  return { title, description, ...(languages ? { alternates: { languages } } : {}) };
}

export default async function SevenXSevenResidencePage() {
  const [english, locale, switcherLocales] = await Promise.all([loadSxsContent(), getLocale(), getSwitcherLocales(), pageInLanguages()]);
  const content = await localizedSetting("sxs", english, locale);
  return <><DeliveredBodyClass bodyClass="sxs-residence" /><SevenXSevenFresh content={content} english={locale === "en" ? undefined : english} locale={locale} switcherLocales={switcherLocales} /></>;
}
