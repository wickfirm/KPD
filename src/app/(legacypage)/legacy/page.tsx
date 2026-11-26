import { LegacyView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadStaticBlocks } from "@/lib/static-blocks";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { localizedBlocks, loadLocalizedFixedPageSeo } from "@/lib/translations/store";
import { pageLanguages } from "@/lib/hreflang";

export async function generateMetadata() {
  // The page's other languages, for hreflang: none while it has no translation.
  const [seo, locale, translated] = await Promise.all([loadLocalizedFixedPageSeo("legacy"), getLocale(), pageLanguages({ page: "legacy" })]);
  return pageMetadata(seo, locale, translated);
}
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function LegacyPage() {
// The page waits for what its metadata reads, so that its metadata can never
// resolve after the page (Next would stream it to the end of the HTML).
  const [locale, seo] = await Promise.all([getLocale(), loadLocalizedFixedPageSeo("legacy"), pageLanguages({ page: "legacy" })]);
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "breadcrumb.legacy"), path: seo.path }], locale)} />
    <LegacyView blocks={await localizedBlocks("legacy", await loadStaticBlocks("legacy"), locale)} />
  </>;
}
