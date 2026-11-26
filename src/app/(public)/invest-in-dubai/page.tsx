import { InvestView } from "@/components/public/invest-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { loadFixedPageSeo } from "@/lib/seo-store";
import { loadInvestPage } from "@/lib/invest-page";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export async function generateMetadata() {
  return pageMetadata(await loadFixedPageSeo("invest-in-dubai"), await getLocale());
}
export const revalidate = 300;

/// The page renders the delivered design (public/legacy/invest-in-dubai.html);
/// every section's copy, lists and images come from the investor-guide editor
/// (staticPage "invest-in-dubai": "hero" + "invest" blocks) with the delivered
/// content as the fallback (src/lib/invest-defaults.ts).
export default async function InvestPage() {
  const locale = await getLocale();
  const { hero, saved } = await loadInvestPage();
  const seo = await loadFixedPageSeo("invest-in-dubai");
  return <>
    <JsonLd data={webPageJsonLd({ name: seo.title, description: seo.description, path: seo.path }, locale)} />
    <JsonLd data={breadcrumbJsonLd([{ name: t(locale, "nav.home"), path: "/" }, { name: t(locale, "breadcrumb.investorGuide"), path: seo.path }], locale)} />
    <InvestView hero={hero} saved={saved} />
  </>;
}
