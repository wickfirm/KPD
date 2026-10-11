import { getNewsPageShell } from "@/lib/news-shell";
import { JsonLd } from "@/components/public/json-ld";
import { breadcrumbJsonLd, pageMetadata, pageSeo, webPageJsonLd } from "@/lib/seo";
import { getNavDevelopments, injectNavDevelopments } from "@/lib/nav-developments";
import { DeliveredScripts, DeliveredEarlyScripts } from "@/components/public/delivered-scripts";
import { DeliveredBodyClass } from "@/components/public/delivered-body-class";

export const metadata = pageMetadata(pageSeo.news);

/// The news listing page serves the delivered news.html shell + main content
/// verbatim. The delivered live-news.js fetches press items from the RSS feed
/// and populates the news grid exactly as the client intended - external
/// source links, original card design, original styling.
export default async function NewsPage() {
  const shell = getNewsPageShell();
  const extras = await getNavDevelopments();
  return <>
    <JsonLd data={webPageJsonLd({ kind: "CollectionPage", name: pageSeo.news.title, description: pageSeo.news.description, path: pageSeo.news.path })} />
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "News", path: pageSeo.news.path }])} />
    <DeliveredBodyClass bodyClass="home-development-page news-design-page" />
    <div dangerouslySetInnerHTML={{ __html: injectNavDevelopments(shell.beforeMain, extras) }} />
    <div dangerouslySetInnerHTML={{ __html: shell.main }} />
    <div dangerouslySetInnerHTML={{ __html: injectNavDevelopments(shell.afterMain, extras) }} />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page news-design-page" sources={[
      "/legacy/assets/js/live-news.js?v=20261007-internal-links",
      "/legacy/assets/js/site.js?v=20260715-backend-start-1",
    ]} />
  </>;
}