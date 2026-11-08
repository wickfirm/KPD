import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { SiteShellHeader } from "@/components/public/site-shell-header";
import { SiteShellFooter } from "@/components/public/site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";
import { NewsListingMain } from "@/components/public/news-listing";
import { loadNewsArticles, loadNewsListingCopy } from "@/lib/news-listing";
import { loadContactDetails } from "@/lib/static-blocks";

export const metadata = pageMetadata(pageSeo.news);

/// The news listing in the client-approved Option 2.1 "Gallery light" layout,
/// rendered on the server from the published CMS articles (the delivered
/// live-news.js only ever showed these whenever any were published). Hero copy
/// comes from Site settings → News listing; the delivered header/footer and
/// site-cms.js stay as on every other page.
export default async function NewsPage() {
  const [articles, copy, contact] = await Promise.all([loadNewsArticles(), loadNewsListingCopy(), loadContactDetails()]);
  return <>
    <JsonLd data={webPageJsonLd({ kind: "CollectionPage", name: pageSeo.news.title, description: pageSeo.news.description, path: pageSeo.news.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "News", path: pageSeo.news.path }])} />
    <DeliveredBodyClass bodyClass="home-development-page news-design-page" />
    <SiteShellHeader />
    <NewsListingMain articles={articles} copy={copy} email={contact.email} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page news-design-page" />
  </>;
}
