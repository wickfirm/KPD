import { LegacyView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { loadStaticBlocks } from "@/lib/static-blocks";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export async function generateMetadata() {
  return pageMetadata(await loadFixedPageSeo("legacy"), await getLocale());
}
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function LegacyPage() {
  const locale = await getLocale();
  const seo = await loadFixedPageSeo("legacy");
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "breadcrumb.legacy"), path: seo.path }], locale)} />
    <LegacyView blocks={await loadStaticBlocks("legacy")} />
  </>;
}
