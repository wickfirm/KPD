import { AboutView } from "@/components/public/page-views";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadStaticBlocks } from "@/lib/static-blocks";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { localizedBlocks, loadLocalizedFixedPageSeo } from "@/lib/translations/store";

export async function generateMetadata() {
  return pageMetadata(await loadLocalizedFixedPageSeo("about"), await getLocale());
}
export const dynamic = "force-dynamic";

/// Unified delivered shell + React content; the delivered design is the
/// fallback for every field.
export default async function AboutPage() {
  const locale = await getLocale();
  const seo = await loadLocalizedFixedPageSeo("about");
  return <>
    <JsonLd data={webPageJsonLd({ kind: "AboutPage", name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "nav.about"), path: seo.path }], locale)} />
    <AboutView blocks={await localizedBlocks("about", await loadStaticBlocks("about"), locale)} />
  </>;
}
