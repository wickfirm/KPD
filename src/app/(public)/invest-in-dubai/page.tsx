import { InvestView } from "@/components/public/invest-view";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { loadInvestPage } from "@/lib/invest-page";

export const metadata = pageMetadata(pageSeo.invest);
export const revalidate = 300;

/// The page renders the delivered design (public/legacy/invest-in-dubai.html);
/// every section's copy, lists and images come from the investor-guide editor
/// (staticPage "invest-in-dubai": "hero" + "invest" blocks) with the delivered
/// content as the fallback (src/lib/invest-defaults.ts).
export default async function InvestPage() {
  const { hero, saved } = await loadInvestPage();
  return <>
    <JsonLd data={webPageJsonLd({ name: pageSeo.invest.title, description: pageSeo.invest.description, path: pageSeo.invest.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Investor guide", path: pageSeo.invest.path }])} />
    <InvestView hero={hero} saved={saved} />
  </>;
}
