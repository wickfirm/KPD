import { InvestView } from "@/components/public/invest-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadInvestPage } from "@/lib/invest-page";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { loadLocalizedFixedPageSeo, localizedInvestPage } from "@/lib/translations/store";
import { pageLanguages } from "@/lib/hreflang";

export async function generateMetadata() {
  // The page's other languages, for hreflang: none while it has no translation.
  const [seo, locale, translated] = await Promise.all([loadLocalizedFixedPageSeo("invest-in-dubai"), getLocale(), pageLanguages({ page: "invest-in-dubai" })]);
  return pageMetadata(seo, locale, translated);
}
export const revalidate = 300;

/// The page renders the delivered design (public/legacy/invest-in-dubai.html);
/// every section's copy, lists and images come from the investor-guide editor
/// (staticPage "invest-in-dubai": "hero" + "invest" blocks) with the delivered
/// content as the fallback (src/lib/invest-defaults.ts).
export default async function InvestPage() {
  const locale = await getLocale();
  const { hero, saved } = await localizedInvestPage(await loadInvestPage(), locale);
  const seo = await loadLocalizedFixedPageSeo("invest-in-dubai");
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "breadcrumb.investorGuide"), path: seo.path }], locale)} />
    <InvestView hero={hero} saved={saved} />
  </>;
}
